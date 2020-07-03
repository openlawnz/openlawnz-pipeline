# S3 to SQS Function

This is a lambda function that when called, will send a message to an SQS queue.

This function is called by s3 PUT event on the `PDF_OUT_BUCKET` (see the `pdfconverter`).

The population of the SQS queue goes through this Lambda and not directly from s3. We found s3 -> sqs queue functionality to be unreliable. 

## Setup

Create a node.js lambda.

`template.yaml` must include:

    Environment:
        Variables:
          SQS_QUEUE_URL: '...'  // Queue URL to the sqs that will trigger the database insert lambda function

- `Memorysize:` 128
- `Timeout:` 15

`process.env.SQS_QUEUE_URL` should be set to the URL of the SQS queue that calls the lambda that writes to the database.

## Next step in pipeline

This lambda populates the PutInDB SQS queue.

That queue should be a standard SQS queue (not FIFO), with a Lambda trigger to the `putInDB` function.