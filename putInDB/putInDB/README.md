# Put In DB Function

This is a lambda function that should be triggered by an SQS queue (see `s3ToSQS`).

This function reads an SQS event, which has been triggered by a JSON file being written to s3 `PDF_OUT_BUCKET`.

The event contains the file name. The function checks what sort of file has been written, and writes the contents to the database. 

## Setup

Create a Node.JS lambda function:
- `MemorySize`: 512
- `TimeOut`: 15
- Must belong to a security group and subnets that will allow traffic to database server

Set the following environment variables in `template.yaml`:

          DB_HOST: 
          DB_NAME: 
          PORT: 
          DB_USER: 
          DB_PASSWORD: 
          PDF_OUT_BUCKET: // Where to find case data to get for inserting
          INGEST_LEGISLATION_BUCKET: // Where to find legislation data for inserting


## Next step