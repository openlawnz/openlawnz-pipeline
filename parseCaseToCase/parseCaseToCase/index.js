const AWS = require("aws-sdk");
const sqs = new AWS.SQS();
const AthenaExpress = require("athena-express");
const s3 = new AWS.S3();

const athenaExpressConfig = { aws: AWS }; //configuring athena-express with aws sdk object
const athenaExpress = new AthenaExpress(athenaExpressConfig);

const orig_citation_reg = /((?:\[\d{4}\]\s*)(?:([a-zA-Z]{1,7}))(?:\s*(\w{1,6})))[,;.\s]/g;
const citation_reg = /((?:(\[|\()\d{4}(\]|\))\s*)(\d\s)?(?:([a-zA-Z]{1,7}))(?:\s*(\d{1,6})))[,;.\s]/g;

let athenaResult;

exports.handler = async(event, context) => {

    console.log("Starting case to case", event)

    if (!athenaResult) {
        athenaResult = await athenaExpress.query(`SELECT * FROM ${process.env.ATHENA_CITATIONS_TABLE}`);
    }
    // console.log(athenaResult);

    let taskToken = null;


    // Pre-parse
    console.log("Pre-parse")
    await Promise.all(event.Records.map(async record => {
        const messageBody = JSON.parse(record.body);

        if (messageBody.taskToken) {
            taskToken = messageBody.taskToken;
        }

        var deleteParams = {
            QueueUrl: messageBody.queueURL,
            ReceiptHandle: record.receiptHandle
        };

        return sqs.deleteMessage(deleteParams).promise();

    }));

    console.log("Parse")

    await Promise.all(event.Records.map(async record => {

        const messageBody = JSON.parse(record.body);
        const caseFileKey = messageBody.caseFileKey;
        console.log("Case to case parsing: ", caseFileKey)

        const caseTextRaw = await s3.getObject({
            Bucket: process.env.PDF_OUT_BUCKET,
            Key: "fulltext/" + caseFileKey + ".txt"
        }).promise()

        const caseText = caseTextRaw.Body.toString();

        const allCitations = athenaResult.Items;

        let case_citations = {};
        let totalcites = 0;


        var matches = caseText.match(citation_reg);
        // create map entry with key as the ID, all citations as body
        if (matches) {
            totalcites += matches.length;

            //console.log('a', case_citations[caseFileKey])
            // console.log(matches);

            // case_citations object is filekey:citations[]

            let mapped_count = {};
            // loop over all citations within keyed case text
            matches.forEach((caseCitation) => {


                allCitations.forEach(function(citationRow) {
                    //console.log(citationRow)
                    // match against caseRow.case_text, and only match if the ids are not identical (dont need to add a case's reference to itself)
                    if (citationRow.citation) {

                        // console.log("matches in text: " + citationRow.citation)

                        caseCitation = caseCitation.slice(0, -1);
                        caseCitation += ';';
                        //remove white space(could be inconsistent)
                        caseCitation = caseCitation.replace(/\s/g, '');

                        // if the citation is a substring of multiple other cases, we need to account for this by "ending"
                        // the citation with a semicolon ;
                        var w = citationRow.citation.concat(';');
                        w = w.replace(/\s/g, '');
                        //console.log('citationRow', citationRow, key)

                        // map the count udner its case_id - can add to this if it encounters this ID again
                        if (caseCitation.indexOf(w) !== -1 && citationRow.filekey != caseFileKey) {

                            if (mapped_count[citationRow.filekey]) {
                                mapped_count[citationRow.filekey] += 1;
                            }
                            else {
                                mapped_count[citationRow.filekey] = 1;
                            }
                            /**
                             * here, we need to check for duplicates already in the case_to_case table?
                             * the script will likely be run regularly across the whole db (to account for new citations being added)
                             * this will result in duplicate entries
                             * UPDATE: put a key on (case_id_1, case_id_2)
                             */
                        }
                    }
                });
            });

            // console.log("mapped count");
            // console.log(mapped_count)

            let c = {
                case_origin: caseFileKey,
                case_cites: Object.keys(mapped_count).map(k => ({
                    fileKey: k,
                    count: mapped_count[k]
                }))
            };


            // console.log(c)

            await s3
                .putObject({
                        Body: JSON.stringify(c),
                        Bucket: process.env.PDF_OUT_BUCKET,
                        Key: 'case-to-case/' + caseFileKey + ".json",
                        ContentType: 'application/json'
                    },
                    function(err) {
                        if (err) console.error(err, err.stack);
                    }
                )
                .promise()

        }
        
        console.log("Done")
        
    }));

    if (taskToken) {

        const stepfunctions = new AWS.StepFunctions();

        const params = {
            output: "\"Callback task completed successfully.\"",
            taskToken: taskToken
        };

        await stepfunctions.sendTaskSuccess(params).promise();

    }

};
