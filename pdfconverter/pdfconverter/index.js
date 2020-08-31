const AWSXRay = require('aws-xray-sdk-core')
const AWS = AWSXRay.captureAWS(require('aws-sdk'))

const s3 = new AWS.S3();
const generateData = require("./generateData");
const getOCR = require("./getOCR");
const { processPDF } = require("./pdfToJSON");

let courts;
let lawReports;
let legislation;

const getJSONFile = async(bucket, key) => {

  let raw = await s3.getObject({
    Bucket: bucket,
    Key: key
  }).promise();

  return JSON.parse(raw.Body.toString());

};

exports.handler = async(event) => {

  if (!legislation) {
    legislation = await getJSONFile(process.env.LEGISLATION_JSON_BUCKET, "legislation.json");
  }

  if (!courts) {
    courts = await getJSONFile(process.env.ACRONYMS_BUCKET, "courts.json");
  }

  if (!lawReports) {
    lawReports = await getJSONFile(process.env.ACRONYMS_BUCKET, "law-reports.json");
  }




  await Promise.all(event.Records.map(async record => {

    const caseRecord = JSON.parse(record.body);
    let conversionEngine;

    try {

      const pdfURLForOCR = `https://${caseRecord.caseMeta.buckets.BUCKET_PUBLIC_PDF_WITH_ENV}.s3-ap-southeast-2.amazonaws.com/${caseRecord.fileKey}`;

      // If using OCR
      if (caseRecord.caseMeta.azureOCREnabled) {

        console.log(`Get OCR from Azure ${pdfURLForOCR}`);
        conversionEngine = "azure";
        await getOCR(pdfURLForOCR, caseRecord);

      }
      else {

        console.log(`Use PDF JS ${pdfURLForOCR}`);
        conversionEngine = "pdfjs"
        // Otherwise use PDF.JS
        await processPDF(pdfURLForOCR, caseRecord);

      }

      if (!caseRecord.caseText) {
        throw new Error("No case text (and processPDF didn't throw Error)")
      }

      let jsonData = await generateData(caseRecord, courts, lawReports, legislation);

      jsonData.conversionEngine = conversionEngine;

      // TODO
      jsonData.pdfChecksum = "";

      // Put into S3 permanent storage
      await s3
        .putObject({
          Body: JSON.stringify(jsonData),
          Bucket: caseRecord.caseMeta.buckets.BUCKET_PERMANENT_JSON_WITH_ENV,
          Key: 'cases/' + jsonData.fileKey + ".json",
          ContentType: 'application/json'
        })
        .promise()

    }
    catch (ex) {

      console.error(caseRecord.fileKey, ex);

      await s3.putObject({
        Bucket: caseRecord.caseMeta.buckets.BUCKET_PIPELINE_PROCESSING_WITH_ENV,
        Key: caseRecord.caseMeta.runKey + '/errors/' + caseRecord.fileKey,
        Body: JSON.stringify(caseRecord),
      }).promise();

    }

  }));

};
