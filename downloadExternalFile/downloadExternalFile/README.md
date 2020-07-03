# Download External File 

This is a lambda function used to download files that are not already saved in s3.

It is called by an SQS queue.

## Setup

First make an SQS queue called ExternalFileDownloader.

Then make a node.js lambda with default settings.

`template.yaml` must include:

    Environment:
        Variables:
            PDF_IN_BUCKET: '...'     // Where to write successfully downloaded files
            PDF_OUT_BUCKET: '...'    // Used for error writing only

## Next step in pipeline

Files that are downloaded are written to s3 `PDF_IN_BUCKET`. That bucket must have an s3 event on PUT and COPY to the `pdfconverter` lambda function.
