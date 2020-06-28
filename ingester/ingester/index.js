/* 
  This is the OpenLawNZ ingester. The ingester downloads case law and other legal information to s3.
  The ingester must be run with a payload that specifies an event and a parameter, for example:
  
    {
    "RESET_CASE_BUCKETS": true,
    "CMD": "getACC"
    }
  
  Options:
  
    "RESET_CASE_BUCKETS": true
        This will empty the PDF_OUT bucket, PDF_IN bucket and INGEST_CASES bucket.
        These buckets should be reset only if the main database schema is being re-created from scratch.
        The buckets should not be reset if new cases are being added.
    
    "RESET_LEGISLATION_BUCKET": true
        This will empty the INGEST_LEGISLATION bucket. 
        INGEST_LEGISLATION should be reset if the main database schema is being re-created from scratch.
  
    "CMD" specifies which data to ingest. It has parameters:
        
        getACC - use the ACC adapter
        getCases - use the jdoCases adapter
        getLegislation - use the pcoLegislation adapter
        testCases - pass in a sample set of data by specifying a an array of case objects 
  
  Bucket names are set in process.env (template.yaml)    
  
  The commands getACC, getCases and testCases activate the function processCases(). Part of that function activates a cloudwatch rule to run every minute and check whether the ingester is complete (by counting the number of processed cases and errored cases, and waiting until the total matches the total ingested). Once the count matches, it triggers step functions for caseCitation parser and caseToCase parser (those must be done in order and after all other pdfConverter parsing is complete)
  
*/


const AWS = require("aws-sdk");
const uuidv4 = require("uuid").v4;
const getDataFile = require("./getDataFile");
const s3 = new AWS.S3();
const lambda = new AWS.Lambda();
const cloudwatchevents = new AWS.CloudWatchEvents();
const sqs = new AWS.SQS();

const delay = t => new Promise(resolve => setTimeout(resolve, t));

const getJSONFile = async(bucket, key) => {

  let raw = await s3.getObject({
    Bucket: bucket,
    Key: key
  }).promise();

  return JSON.parse(raw.Body.toString());

};

function toLegislationUrl(url) {
  return url.toString() // Convert to string
    .normalize("NFD") // Change diacritics
    .replace(/[\u0300-\u036f]/g, '') // Remove illegal characters
    .replace(/\s+/g, '-') // Change whitespace to dashes
    .toLowerCase() // Change to lowercase
    .replace(/&/g, '') // Replace ampersand
    .replace(/[^a-z0-9\-]/g, '') // Remove anything that is not a letter, number or dash
    .replace(/-+/g, '-') // Remove duplicate dashes
    .replace(/^-*/, '') // Remove starting dashes
    .replace(/-*$/, ''); // Remove trailing dashes
}


async function emptyS3Directory(bucket, dir) {
  const listParams = {
    Bucket: bucket,
    Prefix: dir
  };

  const listedObjects = await s3.listObjectsV2(listParams).promise();

  if (listedObjects.Contents.length === 0) return;

  const deleteParams = {
    Bucket: bucket,
    Delete: { Objects: [] }
  };

  listedObjects.Contents.forEach(({ Key }) => {
    deleteParams.Delete.Objects.push({ Key });
  });

  await s3.deleteObjects(deleteParams).promise();

  if (listedObjects.IsTruncated) await emptyS3Directory(bucket, dir);
}

exports.handler = async(event, context) => {

  if (event.RESET_CASE_BUCKETS) {


    console.log("Resetting cases buckets");
    try {
      await Promise.all([

        emptyS3Directory(process.env.PDF_OUT_BUCKET),
        emptyS3Directory(process.env.PDF_IN_BUCKET),
        emptyS3Directory(process.env.INGEST_CASES_BUCKET)

      ]);

    }
    catch (ex) {
      console.error("Error emptying buckets", ex);
    }

    console.log("Done.")


  }

  if (event.RESET_LEGISLATION_BUCKET) {


    console.log("Resetting legislation bucket");

    try {
      await emptyS3Directory(process.env.INGEST_LEGISLATION_BUCKET);
    }
    catch (ex) {
      console.log(ex)
    }

    console.log("Done");


  }


  const processCases = async(cases, messageDelay) => {

    if (typeof messageDelay === "undefined") {
      messageDelay = 20;
    }
    
    const fileKeysWithErrors = await getJSONFile(process.env.DOWNLOAD_ERROR_BUCKET, "errors.json");
    
    cases = cases.filter(c => fileKeysWithErrors.indexOf(c.fileKey) === -1);

    let allCasesWithExists = await Promise.all(cases.map(async c => {

      let exists = false;
      // Check if it exists in S3 first
      try {

        await s3.headObject({
          Bucket: process.env.PDF_CHECK_EXISTS_BUCKET,
          Key: c.fileKey,
        }).promise();

        exists = true;

      }
      catch (ex) {}

      return { ...c, exists };

    }));


    allCasesWithExists = await Promise.all(allCasesWithExists.map(async c => {

      let hasOCR = false;
      // Check if it exists in S3 first
      try {

        await s3.headObject({
          Bucket: process.env.OCR_BUCKET,
          Key: c.fileKey,
        }).promise();

        hasOCR = true;

      }
      catch (ex) {}

      return { ...c, hasOCR };

    }));
    
    const runKey = 'run' + (+new Date());

    const allCasesThatDoNotExist = allCasesWithExists.filter(c => !c.exists).map((c, i) => ({ ...c, messageDelay: i * messageDelay }));
    const allCasesThatDoExist = allCasesWithExists.filter(c => c.exists);
    const allCasesCombined = allCasesThatDoNotExist.concat(allCasesThatDoExist);
    // Test only with files that exist
    //const allCasesCombined = allCasesWithExists.filter(c => c.exists);

    const allCasesThatHaveOCR = allCasesCombined.filter(c => c.hasOCR);
    const allCasesThatDoNotHaveOCR = allCasesCombined.filter(c => !c.hasOCR);

    let allCasesThatDoNotHaveOCRBatches = [];
    let currentBatch = [];

    allCasesThatDoNotHaveOCR.forEach((o, i) => {

      if (i > 0 && i % 10 == 0) {

        allCasesThatDoNotHaveOCRBatches.push(currentBatch)
        currentBatch = [];

      }

      currentBatch.push(o);

    });

    if (currentBatch.length > 0) {
      allCasesThatDoNotHaveOCRBatches.push(currentBatch);
    }

    console.log("Total batches " + allCasesThatDoNotHaveOCRBatches.length);
    
    await Promise.all(allCasesThatDoNotHaveOCRBatches.map(async (ingestRecords, i) => {

      const params = {
        MessageBody: JSON.stringify({
          runKey,
          ingestRecords
        }),
        MessageGroupId: "IngesterBatcher",
        QueueUrl: process.env.INGESTER_QUEUE_URL,
      };
      
      await sqs.sendMessage(params).promise();

      if (i > 0 && i % 1000) {
        await delay(1000);
      }

    }));
    
    console.log( allCasesThatHaveOCR.length);

    console.log("All put on queue")

    console.log("Number of cases combined: " + (allCasesCombined.length - 1));

    await setCloudWatchEvent(runKey, allCasesCombined.length - 1);
    
    for (let i = 0; i < allCasesThatHaveOCR.length; i++) {

      const record = allCasesThatHaveOCR[i];

      try {
        await s3.putObject({
          Bucket: process.env.INGEST_CASES_BUCKET,
          Key: record.fileKey,
          Body: JSON.stringify({ ...record, runKey }),
        }).promise();
      }
      catch (ex) { console.error("Error writing object to ingest cases bucket", ex) }
    }

  }

  const setCloudWatchEvent = async(runKey, casesLength) => {


    const ingesterWatcherName = process.env.INGESTER_WATCHER_NAME;

    let rule;

    try {
      rule = await cloudwatchevents.describeRule({
        Name: ingesterWatcherName
      }).promise();
    }
    catch (ex) {

    }


    if (!rule) {

      rule = await cloudwatchevents.putRule({
        Name: ingesterWatcherName,
        ScheduleExpression: 'rate(1 minute)'
      }).promise();

      await lambda.addPermission({
        Action: "lambda:InvokeFunction",
        FunctionName: process.env.CLOUDWATCH_FUNCTION,
        Principal: "events.amazonaws.com",
        SourceArn: rule.RuleArn,
        StatementId: ingesterWatcherName
      }).promise();

    }
    else {

      // Remove old targets
      const targets = await cloudwatchevents.listTargetsByRule({
        Rule: rule.Name
      }).promise();

      if (targets.Targets.length > 0) {

        const targetIds = targets.Targets.map(t => t.Id);

        await cloudwatchevents.removeTargets({
          Ids: targetIds,
          Rule: rule.Name
        }).promise();

      }

      // remove tags
      await cloudwatchevents.untagResource({
        ResourceARN: process.env.INGESTER_WATCHER_RULE,
        TagKeys: ['lastProcessedCount', 'thresholdCount']
      }).promise();

    }

    await cloudwatchevents.putTargets({
      Rule: ingesterWatcherName,
      Targets: [{
        Arn: process.env.INGESTER_WATCHER_LAMBDA_ARN,
        Id: runKey,
        Input: JSON.stringify({
          count: casesLength,
          runKey,
        })
      }]
    }).promise();

    await cloudwatchevents.enableRule({
      Name: ingesterWatcherName
    }).promise();

  }

  if (event.CMD === "getACC") {

    console.log("Get ACC cases")

    const cases = await getDataFile("acc");

    await processCases(cases, 0);

  }
  else if (event.CMD === "getCases") {

    console.log("Get cases. Disabled.")

    //const cases = await getDataFile("moj", event.datalocation);

    //await processCases(cases, 20);

  }
  else if (event.CMD === "getLegislation") {

    let records = await getDataFile("pco", event.datalocation, process.env.APIFY_TASK_ID, process.env.APIFY_TOKEN);

    records = records.map(r => ({
      ...r,
      id: toLegislationUrl(r.title)
    }))

    await s3.putObject({
      Bucket: process.env.INGEST_LEGISLATION_BUCKET,
      Key: "legislation.json",
      Body: JSON.stringify(records),
    }).promise();

  }
  else if (event.CMD === "testCases") {

    let cases = [{
        "fileProvider": "jdo",
        "fileKey": "jdo_1424959201000_3967474d-f0d5-4b16-beca-719d6481f52b.pdf",
        "fileUrl": "",
        "caseNames": ["TEST CASE 1 - Clayton v Clayton - CITES CASE 2 AND 3 AND 4"],
        "caseDate": "2015-02-26T13:00:01Z",
        "caseCitations": ["[2015] NZCA 30"],
        "dateAccessed": ""
      },
      {
        "fileProvider": "jdo",
        "fileKey": "jdo_1417525201000_a8a9807a-15bd-43e0-a153-1cde074f6e51.pdf",
        "fileUrl": "",
        "caseNames": ["TEST CASE 2 - ARTHUR SYLVAN MORGENSTERN v STEPHANIE BETH JEFFREYS AND TIMOTHY WILSON DOWNES - CITED BY CASE 1 "],
        "caseDate": "2014-12-02T13:00:01Z",
        "caseCitations": ["[2014] NZSC 176"],
        "dateAccessed": ""
      },
      {
        "fileProvider": "jdo",
        "fileKey": "jdo_1410440401000_f0cdb380-7cef-469b-a294-b3ecefc00dc7.pdf",
        "fileUrl": "",
        "caseNames": ["TEST CASE 3 - MORGENSTERN v JEFFREYS CA122/2014 - HAS EXTRA CITATION TO DISCOVER, CITED BY CASE 1"],
        "caseDate": "2014-09-11T13:00:01Z",
        "caseCitations": ["[2014] NZCA 449"],
        "dateAccessed": ""
      },
      {
        "fileProvider": "jdo",
        "fileKey": "jdo_1404997201000_ec4145ad-2d29-4a23-ac25-9080c54d6b89.pdf",
        "fileUrl": "",
        "caseNames": ["TEST CASE 4 - FORIVERMOR LIMITED v ANZ BANK NEW ZEALAND LIMITED (FORMERLY ANZ NATIONAL BANK LIMITED) - CITED BY CASE 1"],
        "caseDate": "2014-07-10T13:00:01Z",
        "caseCitations": ["[2014] NZSC 89"],
        "dateAccessed": ""
      },
      {
        "fileProvider": "jdo",
        "fileKey": "jdo_1545138001000_55c721dd-d9dc-4d12-bcf8-c17bc49ebb68.pdf",
        "fileUrl": "",
        "caseNames": ["TEST CASE 5 - TAHI ENTERPRISES LTD v TAUA CITES CASE 6"],
        "caseDate": "2018-12-18T13:00:01Z",
        "caseCitations": ["[2018] NZHC 3372"],
        "dateAccessed": ""
      },
      {
        "fileProvider": "jdo",
        "fileKey": "jdo_1522069201000_26666a48-dd4a-43ed-9f53-77e66655897c.pdf",
        "fileUrl": "",
        "caseNames": ["TEST CASE 6 - TAHI ENTERPRISES LTD v TAUA (2) - CITED BY CASE 5"],
        "caseDate": "2018-03-26T13:00:01Z",
        "caseCitations": ["[2018] NZHC 516"],
        "dateAccessed": ""
      },
      {
        "fileProvider": "jdo",
        "fileKey": "jdo_1535029201000_9f72b12e-a468-4698-b22c-eb6cd183643c.pdf",
        "fileUrl": "",
        "caseNames": ["TEST CASE 7 - DENNIS v CHIEF EXECUTIVE OF THE MINISTRY OF BUSINESS, INNOVATION AND EMPLOYMENT"],
        "caseDate": "2018-08-23T13:00:01Z",
        "caseCitations": ["[2018] NZHC 2169"],
        "dateAccessed": ""
      },
      {
        "fileProvider": "jdo",
        "fileKey": "jdo_1518613201000_5988e968-c452-4acf-86d0-650f59dc84bf.pdf",
        "fileUrl": "",
        "caseNames": ["TEST CASE 8 - KAUR v MINISTER OF IMMIGRATION"],
        "caseDate": "2018-02-14T13:00:01Z",
        "caseCitations": ["[2018] NZFC 138"],
        "dateAccessed": ""
      },
      {
        "fileProvider": "jdo",
        "fileKey": "jdo_1495198801000_73a5cf73-ec98-431e-8a5e-b60a5625b879.pdf",
        "fileUrl": "",
        "caseNames": ["TEST CASE 9 - FANG v THE MINISTRY OF BUSINESS, INNOVATION AND EMPLOYMENT - TWO CITATIONS TO DISCOVER"],
        "caseDate": "2017-05-19T13:00:01Z",
        "caseCitations": ["[2017] 1 NZFLR 5"],
        "dateAccessed": ""
      }
    ]

    await processCases(cases);


  }
  else {
    throw new Error("No command given");
  }

}
