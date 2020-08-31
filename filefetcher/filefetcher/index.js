const AWSXRay = require('aws-xray-sdk-core')
const AWS = AWSXRay.captureAWS(require('aws-sdk'))

const s3 = new AWS.S3();
const sqs = new AWS.SQS();

const DOWNLOAD_EXTERNAL_QUEUE_URL = process.env.DOWNLOAD_EXTERNAL_QUEUE_URL;
const PDF_CONVERTER_QUEUE_URL = process.env.PDF_CONVERTER_QUEUE_URL

if (!DOWNLOAD_EXTERNAL_QUEUE_URL || !PDF_CONVERTER_QUEUE_URL) {
  console.log("All environment variables are not set");
  return;
}

// Called from S3
exports.handler = async(event, context) => {

  try {

    console.log("file event");
    console.log(event);

    await Promise.all(event.Records.map(async record => {

      console.log('record', record);

      const caseRecordRaw = await s3.getObject({
        Bucket: record.s3.bucket.name,
        Key: record.s3.object.key
      }).promise();

      const caseRecord = JSON.parse(caseRecordRaw.Body.toString());

      console.log("caseRecord");
      console.log(caseRecord);

      let sendToPDFConverter = false;

      if (caseRecord.caseMeta.existsInEnvPublicBucket) {

        sendToPDFConverter = true;

      }
      else if (caseRecord.caseMeta.existsInEnvS3Cache) {


        console.log("In env s3 cache")
        try {
          await s3.copyObject({
            CopySource: caseRecord.caseMeta.s3Cache.bucket + `/${caseRecord.caseMeta.s3Cache.objectKey}`,
            Bucket: caseRecord.caseMeta.buckets.BUCKET_PUBLIC_PDF_WITH_ENV,
            Key: caseRecord.fileKey,
            ACL: "public-read"
          }).promise();

          sendToPDFConverter = true;
        }
        catch (ex) {
          console.log("Copy failed");
          console.log(ex);
        }

      }


      if (sendToPDFConverter) {

        console.log("Send to PDF Converter")

        const params = {
          MessageBody: JSON.stringify(caseRecord),
          QueueUrl: PDF_CONVERTER_QUEUE_URL,
        };

        await sqs.sendMessage(params).promise();

      }
      else {

        console.log("File does not exist. Putting in download queue.");

        if (typeof caseRecord.caseMeta.messageDelay !== "undefined") {

          const params = {
            MessageBody: JSON.stringify(caseRecord),
            QueueUrl: DOWNLOAD_EXTERNAL_QUEUE_URL,
            DelaySeconds: caseRecord.caseMeta.messageDelay
          };

          await sqs.sendMessage(params).promise();

        }
        else {

          console.error("Case record does not have messageDelay, which is required")

        }

      }

    }));

  }
  catch (ex) {
    console.log("Exception. Do not retry.")
  }


};
