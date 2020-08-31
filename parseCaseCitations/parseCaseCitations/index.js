// search through all cases and all citations
// find all double citations in the full text of each case eg R v Smith [2012] NZHC 1234, [2012] 2 NZLR 123.
// check to see if first part of match already has id in database
// if so, add second part of match to case_citation database with same id

const AWSXRay = require('aws-xray-sdk-core')
const AWS = AWSXRay.captureAWS(require('aws-sdk'))

const AthenaExpress = require("athena-express");
const uuidv4 = require("uuid").v4;
const s3 = new AWS.S3();
const sqs = new AWS.SQS();
const stepfunctions = new AWS.StepFunctions();

const athenaExpressConfig = { aws: AWS }; //configuring athena-express with aws sdk object
const athenaExpress = new AthenaExpress(athenaExpressConfig);

const regDoubleCites = /(\[|\()\d{4}(\]|\))[\s\S](\d{0,3}[\s\S])\w{1,5}[\s\S]\d{1,5}(([\s\S]\(\w*\))?)(;|,)\s(\[|\()\d{4}(\]|\))[\s\S](\d{0,3}[\s\S])\w{1,5}[\s\S]\d{1,5}(([\s\S]\(\w*\))?)/g;

const commaOrSemi = /,|;/g;

function findCaseByCitation(allCitations, citation) {
    return allCitations.find(function (row) {
        return row.citation.trim().toLowerCase() === citation.toLowerCase();
    });
}

let athenaResult;

exports.handler = async(event) => {

    try {

        if (!athenaResult) {
            console.log("Not using athena result cache")
            // Look at first packet to determine the environment
            const { environment, parserAthenaTable } = JSON.parse(event.Records[0].body);
            athenaResult = await athenaExpress.query(`SELECT * FROM ${parserAthenaTable}${environment}`);
        }
        else {
            console.log("Using athena result cache")
        }

        const allItems = athenaResult.Items.filter(a => a.citation);

        let finalMessage = null;

        // Pre-parse
        await Promise.all(event.Records.map(async record => {
            const messageBody = JSON.parse(record.body);

            if (messageBody.taskToken) {
                finalMessage = messageBody;
            }

            var deleteParams = {
                QueueUrl: messageBody.queueURL,
                ReceiptHandle: record.receiptHandle
            };

            return sqs.deleteMessage(deleteParams).promise();

        }));

        await Promise.all(event.Records.map(async record => {

            const messageBody = JSON.parse(record.body);
            const caseFileKey = messageBody.caseFileKey;
            const casePermanentStorageBucket = messageBody.casePermanentStorageBucket;
            const caseRaw = await s3.getObject({
                Bucket: casePermanentStorageBucket,
                Key: `cases/${caseFileKey}.json`
            }).promise()

            const caseRecord = JSON.parse(caseRaw.Body.toString());
            const caseText = caseRecord.caseText;

            let citationRecordsToCreate = [];

            // regex match for all double citations inside case text
            var citationsMatches = caseText.match(regDoubleCites);

            // TODO: Check necessity of all the conditions
            if (citationsMatches) {

                if (citationsMatches.length > 0) {

                    for (let i in citationsMatches) {

                        const citationsMatch = citationsMatches[i];
                        // split into first and second citation
                        var separatedCitations = citationsMatch.split(commaOrSemi);

                        if (separatedCitations.length > 1) {

                            // separatedCitations[0] has first of double citation
                            // separatedCitations[1] has second of double citation
                            // we want to search for first citation to see if it is in the db already
                            var citation = separatedCitations[0];
                            var secondaryCitation = separatedCitations && separatedCitations[1].trim();

                            // TODO: Tidy up
                            if (citation && secondaryCitation) {
                                var foundCase = findCaseByCitation(allItems, citation);
                                var foundSecondaryCase = findCaseByCitation(allItems, secondaryCitation);
                                if (foundCase && !foundSecondaryCase) {

                                    const citationId = secondaryCitation.replace(/(\[|\(|\]|\)|\/|\s|\,)/g, "") // Regex
                                    // const citationId = uuidv4();

                                    citationRecordsToCreate.push({
                                        id: citationId,
                                        citation: secondaryCitation,
                                        fileKey: caseFileKey,
                                        caseDate: foundCase.caseDate,
                                        year: foundCase.year
                                    })

                                }

                            }

                        }

                    }

                }
                else {
                    //console.log("no matches")
                }

                if (citationRecordsToCreate.length > 0) {

                    await Promise.all(citationRecordsToCreate.map(c => {

                        return s3
                            .putObject({
                                    Body: JSON.stringify(c),
                                    Bucket: casePermanentStorageBucket,
                                    Key: 'citations/' + c.id + ".json",
                                    ContentType: 'application/json'
                                },
                                function (err) {
                                    if (err) console.log(err, err.stack);
                                }
                            )
                            .promise()

                    }))


                }

            }

        }));

        if (finalMessage) {
            const params = {
                output: finalMessage.output,
                taskToken: finalMessage.taskToken
            };

            await stepfunctions.sendTaskSuccess(params).promise();

        }

    }
    catch (ex) {
        console.error("Error case citations", ex)
    }
};
