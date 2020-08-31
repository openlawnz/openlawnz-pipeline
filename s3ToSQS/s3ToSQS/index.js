const AWSXRay = require('aws-xray-sdk-core')
const AWS = AWSXRay.captureAWS(require('aws-sdk'))

const sqs = new AWS.SQS();

const sqsQueueUrl = process.env.SQS_QUEUE_URL

exports.handler = async(event) => {

    await Promise.all(event.Records.map(record => {

        var params = {
            MessageBody: JSON.stringify({
                bucketName: record.s3.bucket.name,
                objectKey: record.s3.object.key,
            }),
            QueueUrl: sqsQueueUrl
        };

        return sqs.sendMessage(params).promise();

    }));

};
