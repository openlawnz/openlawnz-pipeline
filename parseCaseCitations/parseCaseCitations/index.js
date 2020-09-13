const AWSXRay = require('aws-xray-sdk-core');
const AWS = AWSXRay.captureAWS(require('aws-sdk'));

const AthenaExpress = require('athena-express');
const { parseCaseCitations, getVersion } = require('@openlawnz/openlawnz-parsers');
const s3 = new AWS.S3();
const sqs = new AWS.SQS();
const stepfunctions = new AWS.StepFunctions();

const athenaExpressConfig = { aws: AWS }; //configuring athena-express with aws sdk object
const athenaExpress = new AthenaExpress(athenaExpressConfig);

let athenaResult;

const parsersVersion = getVersion();

exports.handler = async(event) => {
    try {
        if (!athenaResult) {
            console.log('Not using athena result cache');
            // Look at first packet to determine the environment
            const { environment, parserAthenaTable } = JSON.parse(event.Records[0].body);
            athenaResult = await athenaExpress.query(`SELECT * FROM ${parserAthenaTable}${environment}`);
        }
        else {
            console.log('Using athena result cache');
        }

        // Athena makes columns lowercase
        const allItems = athenaResult.Items.filter(a => a.citation).map(row => {
            row.fileKey = row.filekey;
            return row;
        });

        let finalMessage = null;
        // Pre-parse
        await Promise.all(
            event.Records.map(async(record) => {
                const messageBody = JSON.parse(record.body);

                if (messageBody.taskToken) {
                    finalMessage = messageBody;
                }

                var deleteParams = {
                    QueueUrl: messageBody.queueURL,
                    ReceiptHandle: record.receiptHandle,
                };

                return sqs.deleteMessage(deleteParams).promise();
            }),
        );

        await Promise.all(
            event.Records.map(async(record) => {
                const messageBody = JSON.parse(record.body);
                const caseFileKey = messageBody.caseFileKey;
                const casePermanentStorageBucket = messageBody.casePermanentStorageBucket;
                const caseRaw = await s3
                    .getObject({
                        Bucket: casePermanentStorageBucket,
                        Key: `cases/${caseFileKey}.json`,
                    })
                    .promise();

                const caseRecord = JSON.parse(caseRaw.Body.toString());
                const caseText = caseRecord.caseText;

                const citationRecordsToCreate = parseCaseCitations(caseText, allItems);

                if (citationRecordsToCreate.length > 0) {
                    await Promise.all(
                        citationRecordsToCreate.map((c) => {
                            return s3
                                .putObject({
                                        Body: JSON.stringify({
                                            ...c,
                                            parsersVersion,
                                        }),
                                        Bucket: casePermanentStorageBucket,
                                        Key: 'citations/' + c.id + '.json',
                                        ContentType: 'application/json',
                                    },
                                    function (err) {
                                        if (err) console.log(err, err.stack);
                                    },
                                )
                                .promise();
                        }),
                    );
                }
            }),
        );

        if (finalMessage) {
            const params = {
                output: finalMessage.output,
                taskToken: finalMessage.taskToken,
            };

            await stepfunctions.sendTaskSuccess(params).promise();
        }
    }
    catch (ex) {
        console.error('Error case citations', ex);
    }
};
