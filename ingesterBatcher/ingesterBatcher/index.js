const AWS = require("aws-sdk");
const s3 = new AWS.S3();

// From SQS FIFO queue

const delay = t => new Promise(resolve => setTimeout(resolve, t));

// Should have a batch of 10
exports.handler = async event => {

    //console.log('eventRecords', event.Records);
    
    for (var i = 0; i < event.Records.length; i++) {
        
        console.log('process batch');
        
        const record = event.Records[i];
        const messageBody = JSON.parse(record.body);


        for (let x in messageBody.ingestRecords) {

            let ingestRecord = messageBody.ingestRecords[x];
            console.log('process record');

            try {
                await s3.putObject({
                    Bucket: process.env.INGEST_CASES_BUCKET,
                    Key: ingestRecord.fileKey,
                    Body: JSON.stringify({ ...ingestRecord, runKey: messageBody.runKey }),
                }).promise();
            }
            catch (ex) { console.error("Error writing object to ingest cases bucket", ex) }

            
        }
        
        await delay(5000);


    }



};
