  # OpenLaw NZ - Ingester
  This is the OpenLawNZ ingester. The ingester downloads case law and other legal information to s3.
  The ingester must be run with a payload that specifies an event and a parameter, for example:
  
    {
    "RESET_CASE_BUCKETS": true,
    "CMD": "getACC"
    }

## Options:
  
    "RESET_CASE_BUCKETS": true
        
This will empty the PDF_OUT bucket, PDF_IN bucket and INGEST_CASES bucket.
These buckets should only be reset if the main database schema is being re-created from scratch.
The buckets should not be reset if new cases are being added.
    
    "RESET_LEGISLATION_BUCKET": true

This will empty the INGEST_LEGISLATION bucket. 
INGEST_LEGISLATION should only be reset if the main database schema is being re-created from scratch.
  
    "CMD" : "" 

Specifies which data to ingest. The command can be any of the following:
        
- `"getACC"` - use the ACC adapter in `/getDataFile`
 - `"getCases"` - use the jdoCases adapter in `/getDataFile`
 - `"getLegislation"` - use the pcoLegislation adapter in `/getDataFile`
 - `"testCases"` - process a sample set of data by specifying a an array of case objects (at line 375)

The commands getACC, getCases and testCases activate the function `processCases()`.

## ProcessCases()

ProcessCases:
- Separates cases into two groups - those with OCR already complete and those without
- Sends cases that do **not** need ocr directly to the ingest cases bucket
- Sends cases that need ocr to the ingesterbatcher sqs queue, staggered with a delay. The ingesterbatcher sqs queue must trigger `/ingesterBatcher`) which writes to the ingest cases bucket. The ingesterbatcher queue and lambda are required to ensure rate limiting of the OCR requests (to stay within Azure limits). 

The function also activates a cloudwatch rule (ingesterWatcher) which should be set up with a schedule of 1 minute and a lambda target of `ingesterWatcher`. The lambda checks (using Athena) whether the ingester is complete by counting the number of processed cases and errored cases, and waiting until the total matches the total ingested. 

Once the count matches, the lambda triggers step functions for caseCitation parser and caseToCase parser (because those must be done in order and after all other pdfConverter parsing is complete) and disables the rule. 

NB - It is important that the `ingesterWatcher` lambda function disables the CloudWatch rule and stops it from running every minute to avoid unnecessary cost.

## Setup

Create a Lambda function with NodeJS (12.x)

The following environment variables must be set in template.yaml:

          APIFY_TASK_ID:        // The task for the Apify legislation scraper
          APIFY_TOKEN:          // API token
          PDF_IN_BUCKET:        // Where all PDFs are stored once downloaded (before processing). S3 event must be set on this bucket to trigger the pdf converter. Will be wiped on RESET_CASE_BUCKETS.
          PDF_OUT_BUCKET:       // This will be wiped on RESET_CASE_BUCKETS. Files are not written to this bucket by this function (see /pdfconverter)
          INGEST_CASES_BUCKET:  // Case meta data is separated out and saved here as JSON prior to processing. Will be wiped on RESET_CASE_BUCKETS.
          INGEST_LEGISLATION_BUCKET:    // Legislation records saved here for processing
          PDF_CHECK_EXISTS_BUCKET:      // Bucket to check if PDF file has already been downloaded to s3
          ACC_BUCKET:   // ACC ingester bucket - where 1 JSON file per year of ACC cases is saved. Only required for getACC.
          ACC_URL:      // http string to prepend to generate URL of ACC files for download (in our case, s3 bucket URL). Only required for getACC.
          CLOUDWATCH_FUNCTION:          // ingesterWatcher function name ('cloud9-...-...')
          INGESTER_WATCHER_NAME:        // Name of ingester watcher function
          OCR_BUCKET:                   // Bucket to save OCR converted files (and to check if it exists already)
          INGESTER_QUEUE_URL:           // SQS queue url for ingester batcher
          INGESTER_WATCHER_RULE:        // ARN for ingester watcher rule
          INGESTER_WATCHER_LAMBDA_ARN:  // ARN for ingester watcher lambda
          DOWNLOAD_ERROR_BUCKET:        // Bucket to save errors
  
  ### Other Lambda settings (template.yaml)
  - `MemorySize`: 1024
  - `Timeout`: 900 (max)
  
  ## Next step in pipeline
  Ingester writes files to `INGEST_CASES_BUCKET`

  `INGEST_CASES_BUCKET` must have an s3 PUT event trigger to the `fileFetcher` Lambda.