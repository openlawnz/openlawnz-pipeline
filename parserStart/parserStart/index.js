const AWSXRay = require('aws-xray-sdk-core')
const AWS = AWSXRay.captureAWS(require('aws-sdk'))

const sqs = new AWS.SQS();
const AthenaExpress = require("athena-express");

const athenaExpressConfig = { aws: AWS }; //configuring athena-express with aws sdk object
const athenaExpress = new AthenaExpress(athenaExpressConfig);

let athenaResult;
let lastAthenaTable;

exports.handler = async(event) => {

    const environment = event.Input.environment;
    const athenaTable = event.Input.athenaTable;
    const parserAthenaTable = event.Input.parserAthenaTable;

    if (!environment) {
        console.log("No environment passed in");
        return;
    }

    // Object should be the same between athena tables
    if (!athenaResult || athenaTable !== lastAthenaTable) {
        athenaResult = await athenaExpress.query(`SELECT * FROM ${athenaTable}${environment}`);
    }
    lastAthenaTable = athenaTable;
    const total = athenaResult.Items.length;

    // Gets token from SQS to pass onto each function
    const taskToken = event.TaskToken;
    const sqsQueueUrl = event.Input.sqsQueueUrl;

    let batches = [];
    let currentBatch = [];

    athenaResult.Items.forEach((item, i) => {

        const payload = {
            caseFileKey: item.filekey,
            casePermanentStorageBucket: `${process.env.BUCKET_PERMANENT_JSON}-${environment}`,
            parserAthenaTable,
            runKey: item.runkey,
            environment,
            output: JSON.stringify({ environment: event.Input.environment })
        }

        if (i == total - 1) {
            payload.taskToken = taskToken;
        }

        payload.queueURL = sqsQueueUrl;

        var params = {
            MessageBody: JSON.stringify(payload),
            QueueUrl: sqsQueueUrl,
            MessageGroupId: "parser"
        };

        if (i > 1 && i % 1000 === 0) {

            batches.push(currentBatch);
            currentBatch = [];

        }

        currentBatch.push(params)


    });

    if (currentBatch.length > 0) {

        batches.push(currentBatch);

    }

    console.log("Total batches " + batches.length);

    for (let i = 0; i < batches.length; i++) {

        console.log("Sending batch " + (i + 1) + "/" + batches.length);
        // Send batch of 1000
        await Promise.all(batches[i].map(async params => {
            try {
                await sqs.sendMessage(params).promise();
            }
            catch (ex) {
                console.log("Error with message batch " + ex);
            }
        }));

        console.log("Waiting 1 second")
        await new Promise((resolve, reject) => {

            setTimeout(function () { resolve() }, 1000);

        });


    };

    console.log("All put on queue")
};
