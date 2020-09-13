const AWSXRay = require('aws-xray-sdk-core');
const AWS = AWSXRay.captureAWS(require('aws-sdk'));

const sqs = new AWS.SQS();
const AthenaExpress = require('athena-express');
const s3 = new AWS.S3();

const athenaExpressConfig = { aws: AWS }; //configuring athena-express with aws sdk object
const athenaExpress = new AthenaExpress(athenaExpressConfig);

const { parseCaseToCase, getVersion } = require('@openlawnz/openlawnz-parsers');

let athenaResult;

const parsersVersion = getVersion();

exports.handler = async(event) => {
    try {
        if (!athenaResult) {
            const { environment, parserAthenaTable } = JSON.parse(event.Records[0].body);
            athenaResult = await athenaExpress.query(`SELECT * FROM ${parserAthenaTable}${environment}`);
        }

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

                // Athena makes columns lowercase
                const allCitations = athenaResult.Items.map(row => {
                    row.fileKey = row.filekey;
                    return row;
                });

                const caseToCaseMatches = parseCaseToCase(caseText, allCitations, caseFileKey);

                if (caseToCaseMatches) {
                    await s3
                        .putObject({
                                Body: JSON.stringify({
                                    ...caseToCaseMatches,
                                    parsersVersion
                                }),
                                Bucket: casePermanentStorageBucket,
                                Key: 'case-to-case/' + caseFileKey + '.json',
                                ContentType: 'application/json',
                            },
                            function (err) {
                                if (err) console.error(err, err.stack);
                            },
                        )
                        .promise();
                }
            }),
        );

        if (finalMessage) {
            const stepfunctions = new AWS.StepFunctions();

            const params = {
                output: finalMessage.output,
                taskToken: finalMessage.taskToken,
            };

            await stepfunctions.sendTaskSuccess(params).promise();
        }
    }
    catch (ex) {
        console.error('Error case to case', ex);
    }
};
