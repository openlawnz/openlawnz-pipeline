const AWS = require("aws-sdk");
const sqs = new AWS.SQS();
const AthenaExpress = require("athena-express");

const athenaExpressConfig = { aws: AWS }; //configuring athena-express with aws sdk object
const athenaExpress = new AthenaExpress(athenaExpressConfig);

let athenaResult;

exports.handler = async(event, context) => {

    if (!athenaResult) {
        athenaResult = await athenaExpress.query(`SELECT * FROM ${process.env.ATHENA_CASES_TABLE}`);
    }
    const total = athenaResult.Items.length;

    // Gets token from SQS to pass onto each function
    const taskToken = event.TaskToken;
    const sqsQueueUrl = event.Input.sqsQueueUrl;

    console.log(athenaResult.Items.length, " items");


    let batches = [];
    let currentBatch = [];

    athenaResult.Items.forEach((item, i) => {

        const payload = {
            caseFileKey: item.filekey,
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
    
    if(currentBatch.length > 0) {
    
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

        console.log("Waiting 10 seconds")
        // Wait 10 seconds
        await new Promise((resolve, reject) => {
            // wait for 50 ms.
            setTimeout(function() { resolve() }, 1000);

        });


    };

    console.log("All put on queue")
};