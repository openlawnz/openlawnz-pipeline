# PDF Converter

This is a serverless function that processes and parses PDF files.

It is called by an s3 event. See `fileFetcher` and `downloadExternalFile` for the functions that should write to the s3 bucket which calls this function.

## Setup

Create a node.js lambda function.

`template.yaml` must include:

    Environment:
        Variables:
            PDF_IN_BUCKET: '...'                
            PDF_OUT_BUCKET: '...'             
            INGEST_CASES_BUCKET: '...'        
            INGEST_LEGISLATION_BUCKET: '...'  
            ACRONYMS_BUCKET: '...'            
            OCR_BUCKET: '...'                 
            AZURE_SUBSCRIPTION_KEY: '...'     
            AZURE_SEND_ENDPOINT: '...'        
            AZURE_RESULT_ENDPOINT: '...'             

## Install

In Cloud9:

    npm install
    
## Testing

    npm run test
    
## Next step in pipeline

This function writes to `PDF_OUT_BUCKET`.

`PDF_OUT_BUCKET` must be set with an s3 event to trigger `s3ToSQS` (which in turn triggers `putInDB`).