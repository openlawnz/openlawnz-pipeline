// TEMPORARILY DEFUNCT
const AWSXRay = require('aws-xray-sdk-core')
const AWS = AWSXRay.captureAWS(require('aws-sdk'))
//const fetch = require("node-fetch");
const s3 = new AWS.S3();
//const sqs = new AWS.SQS();

const PDF_CONVERTER_QUEUE_URL = process.env.PDF_CONVERTER_QUEUE_URL;

if (!PDF_CONVERTER_QUEUE_URL) {
  console.log("All environment variables are not set");
  return;
}

// From SQS FIFO queue
exports.handler = async event => {


  try {
    for (var i = 0; i < event.Records.length; i++) {

      const record = event.Records[i];
      const messageBody = JSON.parse(record.body);
      let exists = false;



      // Check if exists in S3 already, if so ignore
      // S3 may send duplicate events
      // Check if it exists in S3 first
      try {

        await s3.headObject({
          Bucket: messageBody.caseMeta.buckets.BUCKET_PUBLIC_PDF_WITH_ENV,
          Key: messageBody.fileKey,
        }).promise();

        exists = true;

        console.log("Exists, ignore")

      }
      catch (ex) {
        // Doesn't exist, continue
      }

      if (!exists) {



        console.log(`Does not exist (${messageBody.fileKey}), download. DISABLED. Going straight to error`);

        try {

          await s3.putObject({
            Bucket: messageBody.caseMeta.buckets.BUCKET_PIPELINE_PROCESSING_WITH_ENV,
            Key: messageBody.caseMeta.runKey + '/errors/' + messageBody.fileKey,
            Body: JSON.stringify(messageBody),
          }).promise();


        }

        catch (ex) {

          console.error(ex);
        }

        // Download. No external downloading
        /*


            if (fileUrl.indexOf("jdo") !== -1) {
              console.error("TEMP: JDO URL, aborting");
              return;
            }

            const res = await fetch(fileUrl);

            if (res.status == 200) {
              console.log("Status 200");
              const buffer = await res.buffer();
              await s3.putObject({
                Bucket: messageBody.caseMeta.buckets.BUCKET_PUBLIC_PDF_WITH_ENV,
                Key: messageBody.fileKey,
                ACL: "public-read",
                Body: buffer,
              }).promise();

          }
          else {
            await s3.putObject({
              Bucket: messageBody.caseMeta.buckets.BUCKET_PIPELINE_PROCESSING_WITH_ENV,
              Key: 'errors/' + messageBody.fileKey,
              Body: JSON.stringify(messageBody),
            }).promise();
          }



          const params = {
            MessageBody: JSON.stringify(messageBody),
            QueueUrl: PDF_CONVERTER_QUEUE_URL,
          };

          await sqs.sendMessage(params).promise();

          */




      }


    }

  }
  catch (ex) {
    console.error(ex)
  }



};
