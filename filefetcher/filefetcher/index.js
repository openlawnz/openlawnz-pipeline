/*
  OpenLaw NZ File fetcher:
    1 - Checks to see if the PDF of a case already exists in s3
    2 - If it does, copies from that s3 bucket
    3 - If it does not, sends it to sqsQueueUrl (which triggers downloadExternalFile)
*/ 

const AWS = require("aws-sdk");
const s3 = new AWS.S3();
const sqs = new AWS.SQS();

const sqsQueueUrl = process.env.QUEUE_URL;

// Called from S3
exports.handler = async(event, context) => {

  console.log("file event");
  console.log(event);

  await Promise.all(event.Records.map(async record => {

    console.log('record', record);

    const fileKey = record.s3.object.key;

    const caseRecordRaw = await s3.getObject({
      Bucket: record.s3.bucket.name,
      Key: record.s3.object.key
    }).promise();

    const caseRecord = JSON.parse(caseRecordRaw.Body.toString());

    console.log("caseRecord");
    console.log(caseRecord);

    if (caseRecord.exists) {

      console.log("File exists, copying.");

      await s3.copyObject({
        CopySource: process.env.COPY_SOURCE + `/${fileKey}`,
        Bucket: process.env.PDF_IN_BUCKET,
        Key: fileKey,
        ACL: "public-read"
      }).promise();

    }
    else {
      
      console.log("File does not exist. Putting in queue.");
      
      if(typeof caseRecord.messageDelay !== "undefined") {
  
        const params = {
          MessageBody: JSON.stringify({
            fileUrl: caseRecord.fileUrl,
            fileKey: caseRecord.fileKey
          }),
  
          QueueUrl: sqsQueueUrl,
          DelaySeconds: caseRecord.messageDelay
        };
  
        await sqs.sendMessage(params).promise();
        
      } else {
        
        console.error("Case record does not have messageDelay, which is required")
        
      }

    }

  }));


};
