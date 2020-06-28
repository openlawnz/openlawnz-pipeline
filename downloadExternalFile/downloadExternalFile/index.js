const AWS = require("aws-sdk");
const fetch = require("node-fetch");
const s3 = new AWS.S3();

// From SQS FIFO queue
exports.handler = async event => {

  for (var i = 0; i < event.Records.length; i++) {

    const record = event.Records[i];
    const messageBody = JSON.parse(record.body);

    const fileKey = messageBody.fileKey;
    const fileUrl = messageBody.fileUrl;

    console.log(fileKey, fileUrl);


    // Check if exists in S3 already, if so ignore
    // S3 may send duplicate events

    let exists = false;
    // Check if it exists in S3 first
    try {

      await s3.headObject({
        Bucket: process.env.PDF_IN_BUCKET,
        Key: fileKey,
      }).promise();

      exists = true;

      console.log("Exists, ignore")

    }
    catch (ex) { 
      // Doesn't exist, continue
    }

    if (!exists) {

      console.log("Does not exist, download");

      if (fileUrl.indexOf("jdo") !== -1) {
        console.error("TEMP: JDO URL, aborting");
        return;
      }

      const res = await fetch(fileUrl);

      if (res.status == 200) {
        console.log("Status 200. Putting object into pdfs_in.");
        const buffer = await res.buffer();
        await s3.putObject({
          Bucket: process.env.PDF_IN_BUCKET, // eventually will be openlawnz-pdfs
          Key: fileKey,
          ACL: "public-read",
          Body: buffer,
        }).promise();
      }
      else {
        console.log("PDF object not at specified source, putting in pdfs-out/errors instead. ")
        await s3.putObject({
          Bucket: process.env.PDF_OUT_BUCKET,
          Key: 'errors/' + fileKey,
          Body: JSON.stringify(messageBody),
        }).promise();
      }

    }

  }



};
