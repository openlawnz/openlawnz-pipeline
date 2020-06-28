const AWS = require("aws-sdk");
const sqs = new AWS.SQS();

const sqsQueueUrl = process.env.SQS_QUEUE_URL

exports.handler = async(event, context) => {

    await Promise.all(event.Records.map(record => {

        console.log('record', record)

        var params = {
            MessageBody: JSON.stringify({
                caseFileKey: record.s3.object.key,
            }),
            QueueUrl: sqsQueueUrl
        };

        console.log("send message");
        console.log(params)

        return sqs.sendMessage(params).promise();

    }));

};
