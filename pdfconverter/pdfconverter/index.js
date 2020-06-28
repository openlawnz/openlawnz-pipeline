const AWS = require("aws-sdk");
const s3 = new AWS.S3();
const generateData = require("./generateData");
const getOCR = require("./getOCR")

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

exports.handler = async(event, context) => {

  if (!legislation) {
    legislation = await getJSONFile(process.env.INGEST_LEGISLATION_BUCKET, "legislation.json");
  }

  if (!courts) {
    courts = await getJSONFile(process.env.ACRONYMS_BUCKET, "courts.json");
  }

  if (!lawReports) {
    lawReports = await getJSONFile(process.env.ACRONYMS_BUCKET, "law-reports.json");
  }

  await Promise.all(event.Records.map(async record => {

    console.log(record);

    const pdfURL = `https://${record.s3.bucket.name}.s3-ap-southeast-2.amazonaws.com/${record.s3.object.key}`;

    const caseRecord = await getJSONFile(process.env.INGEST_CASES_BUCKET, record.s3.object.key);
    
    await getOCR(pdfURL, caseRecord)
  
    let jsonData = await generateData(pdfURL, caseRecord, courts, lawReports, legislation);

    const caseText = jsonData.caseText;

    delete jsonData.caseText; // Store separately

    // Should read SHA checksum in file fetcher
    jsonData.pdfChecksum = record.s3.object.eTag;

    let putArray = [

      s3
      .putObject({
        Body: JSON.stringify({ ...jsonData.representation, fileKey: jsonData.fileKey }),
        Bucket: process.env.PDF_OUT_BUCKET,
        Key: 'representation/' + jsonData.fileKey + ".json",
        ContentType: 'application/json'
      })
      .promise(),

      s3
      .putObject({
        Body: JSON.stringify({ judges: jsonData.judges, fileKey: jsonData.fileKey }),
        Bucket: process.env.PDF_OUT_BUCKET,
        Key: 'judges/' + jsonData.fileKey + ".json",
        ContentType: 'application/json'
      })
      .promise(),

      s3
      .putObject({
        Body: JSON.stringify(jsonData),
        Bucket: process.env.PDF_OUT_BUCKET,
        Key: 'meta/' + jsonData.fileKey + ".json",
        ContentType: 'application/json'
      })
      .promise(),

      s3
      .putObject({
        Body: caseText,
        Bucket: process.env.PDF_OUT_BUCKET,
        Key: 'fulltext/' + jsonData.fileKey + ".txt",
        ContentType: 'text/plain'
      })
      .promise(),

    ];

    if (jsonData.category) {
      putArray.push(s3
        .putObject({
          Body: JSON.stringify({ ...jsonData.category, fileKey: jsonData.fileKey }),
          Bucket: process.env.PDF_OUT_BUCKET,
          Key: 'categories/' + jsonData.fileKey + ".json",
          ContentType: 'application/json'
        })
        .promise());
    }

    if (jsonData.legislationReferences) {

      putArray.push(s3
        .putObject({
            Body: JSON.stringify(jsonData.legislationReferences),
            Bucket: process.env.PDF_OUT_BUCKET,
            Key: 'legislation-references/' + jsonData.fileKey + ".json",
            ContentType: 'application/json'
          },
          function(err) {
            if (err) console.error(err, err.stack);
          }
        )
        .promise());

    }

    // Write the citation objects
    jsonData.caseCitations.forEach(c => {

      putArray.push(s3
        .putObject({
            Body: JSON.stringify(c),
            Bucket: process.env.PDF_OUT_BUCKET,
            Key: 'citations/' + c.id + ".json",
            ContentType: 'application/json'
          },
          function(err) {
            if (err) console.error(err, err.stack);
          }
        )
        .promise());

    });


    await Promise.all(putArray);

    // Do full case last
    await s3
      .putObject({
        Body: JSON.stringify({
          ...jsonData,
          caseText,
        }),
        Bucket: process.env.PDF_OUT_BUCKET,
        Key: 'fullcase/' + jsonData.fileKey + ".json",
        ContentType: 'application/json'
      })
      .promise()

  }));

};
