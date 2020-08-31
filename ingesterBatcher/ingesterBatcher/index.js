const AWSXRay = require('aws-xray-sdk-core')
const AWS = AWSXRay.captureAWS(require('aws-sdk'))
const s3 = new AWS.S3();

// From SQS FIFO queue

const delay = t => new Promise(resolve => setTimeout(resolve, t));


const putInS3 = async(ingestRecord) => {
    try {
        await s3.putObject({
            Bucket: ingestRecord.caseMeta.buckets.BUCKET_INGEST_CASES_WITH_ENV,
            Key: ingestRecord.fileKey,
            Body: JSON.stringify(ingestRecord),
        }).promise();
    }
    catch (ex) { console.error("Error writing object to ingest cases bucket", ex) }
}

// Should have a batch of 10
exports.handler = async event => {

    for (var i = 0; i < event.Records.length; i++) {

        const record = event.Records[i];
        const messageBody = JSON.parse(record.body);

        if (messageBody.noDelay) {

            await putInS3(messageBody.record)
        }
        else {

            for (let x in messageBody) {

                let ingestRecord = messageBody[x];

                await putInS3(ingestRecord)

            }

            await delay(5000);

        }


    }



};
