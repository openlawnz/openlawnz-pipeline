/*
  This is the OpenLawNZ ingester. The ingester downloads case law and other legal information to s3.

  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  !                                                                                                                           !
  ! ALL PROCESSING MUST BE DONE WITH ANOTHER PERSON PRESENT                                                                   !
  ! BEFORE RUNNING LARGE DATASETS A SERIES OF CHECKS MUST BE CARRIED OUT TO ENSURE NO ADVERSE SERVER EFFECTS (e.g. DDOS)      !
  !                                                                                                                           !
  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

*/

const AWSXRay = require('aws-xray-sdk-core')
const AWS = AWSXRay.captureAWS(require('aws-sdk'))
const { generateHash, validateHash } = require("./getStartToken");

const getDataFile = require("./getDataFile");
const s3 = new AWS.S3();
const lambda = new AWS.Lambda();
const cloudwatchevents = new AWS.CloudWatchEvents();
const sqs = new AWS.SQS();


const AthenaExpress = require("athena-express");
const athenaExpressConfig = { aws: AWS }; //configuring athena-express with aws sdk object
const athenaExpress = new AthenaExpress(athenaExpressConfig);



let DRY_RUN = false;

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

const checkBucketExists = async bucket => {
  const options = {
    Bucket: bucket,
  };
  try {
    await s3.headBucket(options).promise();
    return true;
  }
  catch (error) {
    if (error.statusCode === 404) {
      return false;
    }
    throw error;
  }
};

const checkAllBucketsExist = async buckets => {

  const bucketKeys = Object.keys(buckets);
  const errors = [];

  for (let i = 0; i < bucketKeys.length; i++) {

    const bucketKey = bucketKeys[i];
    const exists = await checkBucketExists(buckets[bucketKey]);

    if (!exists) {
      errors.push({
        key: bucketKey,
        val: buckets[bucketKey]
      });
    }

  }

  if (errors.length > 0) {

    console.log("Some buckets do not exist:");

    errors.forEach(error => {
      console.log(error.key + ": " + error.val);
    });
    return false;
  }

  return true;

};

const printCasesStats = (cases) => {
  const casesTotal = cases.length;
  cases = cases.slice(0, 20)
  console.log(JSON.stringify(cases, null, 4));
  cases.forEach(c => console.log(c.caseMeta.buckets))
  cases.forEach(c => console.log(c.caseMeta))
  console.log('total to process', casesTotal)

};

const processCases = async({
  environment,
  cases,
  taskToken,
  ingestOnly,
  azureOCREnabled,
  baseMessageDelay
}) => {

  // TODO: Check that the environment is valid (dev/staging/production)
  if (!environment) {
    console.log("You must specify an environment.");
    return;
  }



  const runKey = 'run' + (+new Date());

  const PROCESS_BUCKETS = {
    BUCKET_PERMANENT_JSON_WITH_ENV: `${process.env.BUCKET_PERMANENT_JSON}-${environment}`,
    BUCKET_INGEST_CASES_WITH_ENV: `${process.env.BUCKET_INGEST_CASES}-${environment}`,
    BUCKET_PIPELINE_PROCESSING_WITH_ENV: `${process.env.BUCKET_PIPELINE_PROCESSING}-${environment}`,
    BUCKET_PUBLIC_PDF_WITH_ENV: `${process.env.BUCKET_PUBLIC_PDF}-${environment}`,
    BUCKET_DOWNLOAD_ERROR: process.env.BUCKET_DOWNLOAD_ERROR,
    BUCKET_OCR: process.env.BUCKET_OCR
  };

  const allBucketsExist = await checkAllBucketsExist(PROCESS_BUCKETS);

  if (!allBucketsExist) {
    return;
  }

  // TODO: Check Queue URLs exist
  const INGESTER_BATCHER_QUEUE_URL = process.env.INGESTER_BATCHER_QUEUE_URL;



  let generalCaseMeta = {
    environment,
    azureOCREnabled: azureOCREnabled || false,
    // Ensure message delay whether or not it's used
    baseMessageDelay: typeof baseMessageDelay !== "undefined" ? baseMessageDelay : 20,
    buckets: PROCESS_BUCKETS,
    runKey
  };






  //---------------------------------------------------------------------
  // Filter cases with known broken downloads
  //---------------------------------------------------------------------

  const fileKeysWithErrors = await getJSONFile(PROCESS_BUCKETS.BUCKET_DOWNLOAD_ERROR, "errors.json");

  cases = cases.filter(c => fileKeysWithErrors.indexOf(c.fileKey) === -1);






  //---------------------------------------------------------------------
  // Merge case meta with processing meta
  //---------------------------------------------------------------------

  cases = cases.map(c => {

    const meta = { ...c.meta };
    delete c.meta;

    return {
      ...c,
      caseMeta: {
        ...generalCaseMeta,
        ...meta,
      },
      runKey // For Athena, which can't go into caseMeta atm - TODO
    };
  });




  //---------------------------------------------------------------------
  // Check to see if each case exists in the environment's public bucket
  //---------------------------------------------------------------------

  let messageDelayCount = 0;

  cases = await Promise.all(cases.map(async(c, i) => {

    let existsInEnvPublicBucket = false;
    // Check if it exists in public S3 first
    try {

      await s3.headObject({
        Bucket: PROCESS_BUCKETS.BUCKET_PUBLIC_PDF_WITH_ENV,
        Key: c.fileKey,
      }).promise();

      existsInEnvPublicBucket = true;

    }
    catch (ex) {}

    c.caseMeta.existsInEnvPublicBucket = existsInEnvPublicBucket;

    if (!existsInEnvPublicBucket) {


      let inCache = false;

      try {

        await s3.headObject({
          Bucket: c.caseMeta.s3Cache.bucket,
          Key: c.caseMeta.s3Cache.objectKey,
        }).promise();

        inCache = true;

      }
      catch (ex) {
        // Doesn't exist, continue
      }

      c.caseMeta.existsInEnvS3Cache = inCache;

      if (!inCache) {
        c.caseMeta.messageDelay = messageDelayCount * c.caseMeta.baseMessageDelay;
        messageDelayCount++;
      }

    }

    return c;

  }));


  //---------------------------------------------------------------------
  // If OCR is enabled then check if it's already been processed
  //---------------------------------------------------------------------

  if (generalCaseMeta.azureOCREnabled) {

    cases = await Promise.all(cases.map(async c => {

      let hasOCR = false;
      // Check if key exists in global OCR bucket
      try {

        await s3.headObject({
          Bucket: PROCESS_BUCKETS.BUCKET_OCR,
          Key: c.fileKey,
        }).promise();

        hasOCR = true;

      }
      catch (ex) {}

      c.caseMeta.hasOCR = hasOCR;

      return c;

    }));

  }




  //---------------------------------------------------------------------
  // If it's a dry run, return before doing processing
  //---------------------------------------------------------------------

  if (DRY_RUN) {
    printCasesStats(cases);
    //console.log(`Number of cases exists in public bucket: ${cases.filter(c => c.caseMeta.existsInEnvPublicBucket).length}`);
    //console.log(`Number of cases exists in cache bucket: ${cases.filter(c => c.caseMeta.existsInEnvS3Cache).length}`);
    console.log("Dry run finished.");
    return;
  }





  //---------------------------------------------------------------------
  // Define cases to be run immediately
  // Or that need to go into batches for Azure OCR reasons
  //---------------------------------------------------------------------

  let casesReadyToIngestImmediately;

  if (!generalCaseMeta.azureOCREnabled) {

    casesReadyToIngestImmediately = cases;

  }
  else {

    console.log('Azure OCR enabled');

    // Have OCR, so no need to put into a delay batch
    casesReadyToIngestImmediately = cases.filter(c => c.caseMeta.hasOCR);

    const allCasesThatDoNotHaveOCR = cases.filter(c => !c.caseMeta.hasOCR);

    let allCasesThatDoNotHaveOCRBatches = [];
    let currentBatch = [];

    // Azure OCR has a concurrency set to 10, so we have to batch the ingest for those
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


    await Promise.all(allCasesThatDoNotHaveOCRBatches.map(async(ingestRecords, i) => {

      const params = {
        MessageBody: JSON.stringify(ingestRecords),
        MessageGroupId: "IngesterBatcher",
        QueueUrl: INGESTER_BATCHER_QUEUE_URL,
      };

      await sqs.sendMessage(params).promise();

      if (i > 0 && i % 1000 == 0) {
        await delay(1000);
      }

    }));

  }




  //---------------------------------------------------------------------
  // Put immediately available cases into S3 bucket
  //---------------------------------------------------------------------

  const casesTotal = cases.length;

  console.log(`Number of cases exists in public bucket: ${casesReadyToIngestImmediately.filter(c => c.caseMeta.existsInEnvPublicBucket).length}`);
  console.log(`Number of cases exists in cache bucket: ${casesReadyToIngestImmediately.filter(c => c.caseMeta.existsInEnvS3Cache).length}`);
  console.log(`Number of cases combined: ${casesTotal}`);




  //---------------------------------------------------------------------
  // Cloudwatch will tell us when all the cases have been processed (or have an error)
  //---------------------------------------------------------------------

  await setCloudWatchEvent(runKey, environment, casesTotal, taskToken, ingestOnly);





  //---------------------------------------------------------------------
  // Update Athena to point to new bucket runKey for CloudWatch
  //---------------------------------------------------------------------

  await athenaExpress.query(`alter TABLE ${process.env.ATHENA_CASES_SUCCESS_TABLE}${environment} set location 's3://${process.env.BUCKET_PIPELINE_PROCESSING}-${environment}/${runKey}/success';`);

  await athenaExpress.query(`alter TABLE ${process.env.ATHENA_CASE_ERRORS_TABLE}${environment} set location 's3://${process.env.BUCKET_PIPELINE_PROCESSING}-${environment}/${runKey}/errors';`);



  await Promise.all(casesReadyToIngestImmediately.map(async(record, i) => {

    const params = {
      MessageBody: JSON.stringify({
        record,
        noDelay: true
      }),
      QueueUrl: process.env.INGESTER_QUEUE_URL,
    };

    await sqs.sendMessage(params).promise();

    if (i > 0 && i % 1000 == 0) {
      console.log("Delay", i)
      await delay(1000);
    }

  }));

  console.log("Done");




};






//---------------------------------------------------------------------
// Cloudwatch event will monitor the processing bucket
// When the total (success & error combined), it will trigger a step function
//---------------------------------------------------------------------


const setCloudWatchEvent = async(runKey, environment, casesLength, taskToken, ingestOnly) => {


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
        taskToken,
        ingestOnly,
        environment
      })
    }]
  }).promise();

  await cloudwatchevents.enableRule({
    Name: ingesterWatcherName
  }).promise();

};










exports.handler = async(event) => {


  // TODO: Check that another step function is not running in the interim

  try {

    if (!event.Input) {
      throw new Error("Must be called with Step Function");
    }


    DRY_RUN = event.Input.DRY_RUN;
    const SAFETY_HASH = event.Input.SAFETY_HASH;

    const CMD = event.Input.CMD;
    const MODE = event.Mode; // auto | manual
    const TASK_TOKEN = event.TaskToken;
    const ENVIRONMENT = event.Input.ENVIRONMENT;
    const INGEST_ONLY = event.Input.INGEST_ONLY;
    const DATALOCATION = event.Input.DATALOCATION;
    const DATASLICE = event.Input.DATASLICE !== null ? event.Input.DATASLICE : undefined;
    const RESET_LEGISLATION_BUCKET = event.Input.RESET_LEGISLATION_BUCKET;

    if (!CMD) {
      throw new Error("Missing CMD");
    }

    if (!MODE || ['auto', 'manual'].indexOf(MODE) === -1) {
      throw new Error("Missing/invalid MODE");
    }

    if (!ENVIRONMENT) {
      throw new Error("Missing ENVIRONMENT");
    }



    if (ENVIRONMENT == "prod") {

      if (MODE === 'auto') {

        if (SAFETY_HASH !== process.env.AUTO_MODE_START_HASH) {

          console.log("Missing/invalid auto SAFETY_HASH.");

          return;

        }

      }
      else {

        if (!SAFETY_HASH || (SAFETY_HASH && !validateHash(SAFETY_HASH))) {

          console.log("Missing/invalid manual SAFETY_HASH. Here's a new one:");
          console.log(generateHash());

          return;

        }

      }



    }



    console.log("Removing lambda 0 concurrency setting");

    const lambdaFunctions = await lambda.listFunctions({}).promise();

    for (let func of lambdaFunctions.Functions) {

      const funcTags = await lambda.listTags({
        Resource: func.FunctionArn
      }).promise()

      const isPipelineLambda = funcTags.Tags['openlawnz-pipeline'] === 'true';

      if (isPipelineLambda) {

        if (func.FunctionName === process.env.PUT_IN_DB_LAMBDA_NAME) {

          await lambda.putFunctionConcurrency({
            FunctionName: func.FunctionName,
            ReservedConcurrentExecutions: 60 // Should store as a tag
          }).promise();

        }
        else {
          await lambda.deleteFunctionConcurrency({
            FunctionName: func.FunctionName
          }).promise();
        }

      }

    }


    //
    if (CMD === "rerunCases") {

      console.log("Re-run all cases");

      let casesToProcessWithAzureOCR = [];
      let casesToProcess = [];

      let cases = await athenaExpress.query(`SELECT * FROM ${process.env.ATHENA_CASES_RERUN_TABLE}${ENVIRONMENT};`);

      //Athena only works with all lowercase

      cases.Items = cases.Items.slice(0, DATASLICE);

      cases.Items.forEach(c => {

        const caseMeta = JSON.parse(c.casemeta);
        const caseCitations = JSON.parse(c.casecitations);
        const caseNames = JSON.parse(c.casenames);

        const caseToProcess = {
          fileProvider: c.fileprovider,
          fileKey: c.filekey,
          fileUrl: c.fileurl,
          caseDate: c.casedate,
          caseNames: caseNames,
          //dateAccessed: c.dateaccessed,
          caseCitations: caseCitations.map(c => c.citation),
          meta: {
            s3Cache: {
              bucket: caseMeta.s3cache.bucket,
              objectKey: caseMeta.s3cache.objectkey,
            }
          }
        };

        if (caseMeta.azureocrenabled) {
          casesToProcessWithAzureOCR.push(caseToProcess);
        }
        else {
          casesToProcess.push(caseToProcess);
        }

      });


      const processItems = [];

      if (casesToProcessWithAzureOCR.length > 0) {

        console.log('casesToProcessWithAzureOCR', casesToProcessWithAzureOCR.length)

        processItems.push(processCases({
          environment: ENVIRONMENT,
          cases: casesToProcessWithAzureOCR,
          ingestOnly: INGEST_ONLY,
          taskToken: TASK_TOKEN,
          azureOCREnabled: true

        }))

      }

      if (casesToProcess.length > 0) {

        console.log('casesToProcess', casesToProcess.length)

        processItems.push(processCases({
          environment: ENVIRONMENT,
          cases: casesToProcess,
          ingestOnly: INGEST_ONLY,
          taskToken: TASK_TOKEN,
          baseMessageDelay: 10

        }))
      }

      await Promise.all(processItems);

    }


    //---------------------------------------------------------------------
    // Get ACC
    //---------------------------------------------------------------------

    else if (CMD === "getACC") {

      console.log("Get ACC cases");

      const cases = await getDataFile("acc");

      await processCases({
        environment: ENVIRONMENT,
        cases: cases.slice(0, DATASLICE),
        ingestOnly: INGEST_ONLY,
        taskToken: TASK_TOKEN,
        azureOCREnabled: true,
        baseMessageDelay: 10
      });

    }






    //---------------------------------------------------------------------
    // Get Cases
    //---------------------------------------------------------------------

    else if (CMD === "getCases") {

      if (!DATALOCATION) {
        console.log("TEMP: Need datalocation for migration")
        return;
      }

      console.log("Get cases");

      const cases = await getDataFile("moj", DATALOCATION);

      await processCases({
        environment: ENVIRONMENT,
        cases: cases.slice(0, DATASLICE),
        ingestOnly: INGEST_ONLY,
        taskToken: TASK_TOKEN,
        baseMessageDelay: 10
      });

    }






    //---------------------------------------------------------------------
    // Get Legislation
    //---------------------------------------------------------------------

    else if (CMD === "getLegislation") {



      // if (RESET_LEGISLATION_BUCKET) {

      //   console.log("Resetting legislation bucket");

      //   try {
      //     await emptyS3Directory(process.env.LEGISLATION_JSON_BUCKET);
      //   }
      //   catch (ex) {
      //     console.log(ex);
      //   }

      //   console.log("Done");


      // }

      // let records = await getDataFile("pco", DATALOCATION, process.env.APIFY_TASK_ID, process.env.APIFY_TOKEN);

      // records = records.map(r => ({
      //   ...r,
      //   id: toLegislationUrl(r.title)
      // }));

      // await s3.putObject({
      //   Bucket: process.env.BUCKET_LEGISLATION_JSON,
      //   Key: "legislation.json",
      //   Body: JSON.stringify(records),
      // }).promise();

    }






    //---------------------------------------------------------------------
    // Test JDO cases
    //---------------------------------------------------------------------

    else if (CMD === "testCases") {

      //   let cases = [{
      //       "fileProvider": "jdo",
      //       "fileKey": "jdo_1424959201000_3967474d-f0d5-4b16-beca-719d6481f52b.pdf",
      //       "fileUrl": "",
      //       "meta": {
      //         "s3Cache": {
      //           "bucket": process.env.BUCKET_JDO_CACHE,
      //           "objectKey": "jdo_1424959201000_3967474d-f0d5-4b16-beca-719d6481f52b.pdf"
      //         }
      //       },
      //       "caseNames": ["TEST CASE 1 - Clayton v Clayton - CITES CASE 2 AND 3 AND 4"],
      //       "caseDate": "2015-02-26T13:00:01Z",
      //       "caseCitations": ["[2015] NZCA 30"],
      //       "dateAccessed": ""
      //   },
      //     {
      //       "fileProvider": "jdo",
      //       "fileKey": "jdo_1417525201000_a8a9807a-15bd-43e0-a153-1cde074f6e51.pdf",
      //       "fileUrl": "",
      //       "meta": {
      //         "s3Cache": {
      //           "bucket": process.env.BUCKET_JDO_CACHE,
      //           "objectKey": "jdo_1417525201000_a8a9807a-15bd-43e0-a153-1cde074f6e51.pdf"
      //         }
      //       },
      //       "caseNames": ["TEST CASE 2 - ARTHUR SYLVAN MORGENSTERN v STEPHANIE BETH JEFFREYS AND TIMOTHY WILSON DOWNES - CITED BY CASE 1 "],
      //       "caseDate": "2014-12-02T13:00:01Z",
      //       "caseCitations": ["[2014] NZSC 176"],
      //       "dateAccessed": ""
      //   },
      //     {
      //       "fileProvider": "jdo",
      //       "fileKey": "jdo_1410440401000_f0cdb380-7cef-469b-a294-b3ecefc00dc7.pdf",
      //       "fileUrl": "",
      //       "meta": {
      //         "s3Cache": {
      //           "bucket": process.env.BUCKET_JDO_CACHE,
      //           "objectKey": "jdo_1410440401000_f0cdb380-7cef-469b-a294-b3ecefc00dc7.pdf"
      //         }
      //       },
      //       "caseNames": ["TEST CASE 3 - MORGENSTERN v JEFFREYS CA122/2014 - HAS EXTRA CITATION TO DISCOVER, CITED BY CASE 1"],
      //       "caseDate": "2014-09-11T13:00:01Z",
      //       "caseCitations": ["[2014] NZCA 449"],
      //       "dateAccessed": ""
      //   },
      //     {
      //       "fileProvider": "jdo",
      //       "fileKey": "jdo_1404997201000_ec4145ad-2d29-4a23-ac25-9080c54d6b89.pdf",
      //       "fileUrl": "",
      //       "meta": {
      //         "s3Cache": {
      //           "bucket": process.env.BUCKET_JDO_CACHE,
      //           "objectKey": "jdo_1404997201000_ec4145ad-2d29-4a23-ac25-9080c54d6b89.pdf"
      //         }
      //       },
      //       "caseNames": ["TEST CASE 4 - FORIVERMOR LIMITED v ANZ BANK NEW ZEALAND LIMITED (FORMERLY ANZ NATIONAL BANK LIMITED) - CITED BY CASE 1"],
      //       "caseDate": "2014-07-10T13:00:01Z",
      //       "caseCitations": ["[2014] NZSC 89"],
      //       "dateAccessed": ""
      //   },
      //     {
      //       "fileProvider": "jdo",
      //       "fileKey": "jdo_1545138001000_55c721dd-d9dc-4d12-bcf8-c17bc49ebb68.pdf",
      //       "fileUrl": "",
      //       "meta": {
      //         "s3Cache": {
      //           "bucket": process.env.BUCKET_JDO_CACHE,
      //           "objectKey": "jdo_1545138001000_55c721dd-d9dc-4d12-bcf8-c17bc49ebb68.pdf"
      //         }
      //       },
      //       "caseNames": ["TEST CASE 5 - TAHI ENTERPRISES LTD v TAUA CITES CASE 6"],
      //       "caseDate": "2018-12-18T13:00:01Z",
      //       "caseCitations": ["[2018] NZHC 3372"],
      //       "dateAccessed": ""
      //   },
      //     {
      //       "fileProvider": "jdo",
      //       "fileKey": "jdo_1522069201000_26666a48-dd4a-43ed-9f53-77e66655897c.pdf",
      //       "fileUrl": "",
      //       "meta": {
      //         "s3Cache": {
      //           "bucket": process.env.BUCKET_JDO_CACHE,
      //           "objectKey": "jdo_1522069201000_26666a48-dd4a-43ed-9f53-77e66655897c.pdf"
      //         }
      //       },
      //       "caseNames": ["TEST CASE 6 - TAHI ENTERPRISES LTD v TAUA (2) - CITED BY CASE 5"],
      //       "caseDate": "2018-03-26T13:00:01Z",
      //       "caseCitations": ["[2018] NZHC 516"],
      //       "dateAccessed": ""
      //   },
      //     {
      //       "fileProvider": "jdo",
      //       "fileKey": "jdo_1535029201000_9f72b12e-a468-4698-b22c-eb6cd183643c.pdf",
      //       "fileUrl": "",
      //       "meta": {
      //         "s3Cache": {
      //           "bucket": process.env.BUCKET_JDO_CACHE,
      //           "objectKey": "jdo_1535029201000_9f72b12e-a468-4698-b22c-eb6cd183643c.pdf"
      //         }
      //       },
      //       "caseNames": ["TEST CASE 7 - DENNIS v CHIEF EXECUTIVE OF THE MINISTRY OF BUSINESS, INNOVATION AND EMPLOYMENT"],
      //       "caseDate": "2018-08-23T13:00:01Z",
      //       "caseCitations": ["[2018] NZHC 2169"],
      //       "dateAccessed": ""
      //   },
      //     {
      //       "fileProvider": "jdo",
      //       "fileKey": "jdo_1518613201000_5988e968-c452-4acf-86d0-650f59dc84bf.pdf",
      //       "fileUrl": "",
      //       "meta": {
      //         "s3Cache": {
      //           "bucket": process.env.BUCKET_JDO_CACHE,
      //           "objectKey": "jdo_1518613201000_5988e968-c452-4acf-86d0-650f59dc84bf.pdf"
      //         }
      //       },
      //       "caseNames": ["TEST CASE 8 - KAUR v MINISTER OF IMMIGRATION"],
      //       "caseDate": "2018-02-14T13:00:01Z",
      //       "caseCitations": ["[2018] NZFC 138"],
      //       "dateAccessed": ""
      //   },
      //     {
      //       "fileProvider": "jdo",
      //       "fileKey": "jdo_1495198801000_73a5cf73-ec98-431e-8a5e-b60a5625b879.pdf",
      //       "fileUrl": "",
      //       "meta": {
      //         "s3Cache": {
      //           "bucket": process.env.BUCKET_JDO_CACHE,
      //           "objectKey": "jdo_1518613201000_5988e968-c452-4acf-86d0-650f59dc84bf.pdf"
      //         }
      //       },
      //       "caseNames": ["TEST CASE 9 - FANG v THE MINISTRY OF BUSINESS, INNOVATION AND EMPLOYMENT - TWO CITATIONS TO DISCOVER"],
      //       "caseDate": "2017-05-19T13:00:01Z",
      //       "caseCitations": ["[2017] 1 NZFLR 5"],
      //       "dateAccessed": ""
      //   },
      //     {
      //       "fileProvider": "jdo",
      //       "fileKey": "jdo_XXXXXXXXXXXXXXX.pdf",
      //       "fileUrl": "",
      //       "meta": {
      //         "s3Cache": {
      //           "bucket": process.env.BUCKET_JDO_CACHE,
      //           "objectKey": "jdo_XXXXXXXXXXXXXXX.pdf"
      //         }
      //       },
      //       "caseNames": ["TEST CASE 10 - INVALID PDF KEY AND URL"],
      //       "caseDate": "2017-05-19T13:00:01Z",
      //       "caseCitations": ["[2017] NZHC 1"],
      //       "dateAccessed": ""
      //   },
      //     {
      //       "fileProvider": "jdo",
      //       "fileKey": "jdo_YYYYYYYYYYYYYYYYY.pdf",
      //       "fileUrl": "",
      //       "meta": {
      //         "s3Cache": {
      //           "bucket": process.env.BUCKET_JDO_CACHE,
      //           "objectKey": "jdo_YYYYYYYYYYYYYYYYY.pdf"
      //         }
      //       },
      //       "caseNames": ["TEST CASE 11 - INVALID PDF KEY AND URL"],
      //       "caseDate": "2017-05-19T13:00:01Z",
      //       "caseCitations": ["[2018] NZHC 1"],
      //       "dateAccessed": ""
      //   }
      // ]

      //   await processCases({
      //     environment: ENVIRONMENT,
      //     cases: cases.slice(0, DATASLICE),
      //     ingestOnly: INGEST_ONLY,
      //     taskToken: TASK_TOKEN,
      //     baseMessageDelay: 20
      //   });

    }
    else {
      throw new Error("No command given");
    }

  }
  catch (ex) {

    console.error(ex);
  }

}
