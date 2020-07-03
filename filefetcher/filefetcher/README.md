 # OpenLaw NZ File fetcher

 This is a lambda function. It is called by an s3 PUT event on the `INGEST_CASES` bucket.

 It:

- Checks to see if the PDF of a case already exists in s3
- If it does, copies the PDF from that s3 bucket to the bucket used for processing (`PDF_IN_BUCKET`)
- If it does not, sends it to an SQS queue

## Setup

Create a node.js lambda:

- `MemorySize`: 512
- `TimeOut`: 30

`template.yaml` must include:

    Environment:
        Variables:
          QUEUE_URL: '...'       // SQS queue for external file downloader (the queue that triggers /downloadExternalFile)
          COPY_SOURCE: '...'     // the bucket where PDF files might exist
          PDF_IN_BUCKET: '...'   // the bucket to copy files that do exist in COPY_SOURCE

## Next Step in Pipeline

Files that do not already exist are sent to the sqs queue `QUEUE_URL`. That queue must have a target of the `downloadExternalFile` lambda.

Files that do exist are sent to s3 `PDF_IN_BUCKET`. That bucket must have an s3 event on PUT and COPY to the `pdfconverter` lambda function.