const AWSXRay = require('aws-xray-sdk-core')
const AWS = AWSXRay.captureAWS(require('aws-sdk'))

const s3 = new AWS.S3();
const sqs = new AWS.SQS();

const { BlobServiceClient } = require('@azure/storage-blob');

const AZURE_STORAGE_CONNECTION_STRING = `${process.env.AZURE_STORAGE_CONNECTION_STRING}`;

const stepfunctions = new AWS.StepFunctions();

const getJSONFile = async(bucket, key) => {

    let raw = await s3.getObject({
        Bucket: bucket,
        Key: key
    }).promise();

    return JSON.parse(raw.Body.toString());

};

let blobServiceClient;
let containerClient;

exports.handler = async(event) => {


    try {

        let finalMessage = null;

        // Create a unique name for the container
        if (!blobServiceClient) {
            const { environment } = JSON.parse(event.Records[0].body);
            const containerName = 'fullcases-' + environment;
            // Create the BlobServiceClient object which will be used to create a container client
            blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
            // Get a reference to a container
            containerClient = blobServiceClient.getContainerClient(containerName);
        }

        // Pre-parse
        await Promise.all(event.Records.map(async record => {
            const messageBody = JSON.parse(record.body);

            if (messageBody.taskToken) {
                finalMessage = messageBody;
            }

            var deleteParams = {
                QueueUrl: messageBody.queueURL,
                ReceiptHandle: record.receiptHandle
            };

            return sqs.deleteMessage(deleteParams).promise();

        }));

        await Promise.all(event.Records.map(async record => {

            const messageBody = JSON.parse(record.body);

            const caseFileKey = messageBody.caseFileKey + ".json";
            const casePermanentStorageBucket = messageBody.casePermanentStorageBucket;

            // Compile complete object

            const baseCase = await getJSONFile(casePermanentStorageBucket, 'cases/' + caseFileKey);

            let compositeCase = baseCase;

            try {
                const caseToCase = await getJSONFile(casePermanentStorageBucket, "case-to-case/" + caseFileKey);
                compositeCase.case_cites = caseToCase.case_cites;
            }
            catch (ex) {

            }

            delete compositeCase.caseMeta;
            delete compositeCase.runKey;

            const blockBlobClient = containerClient.getBlockBlobClient(compositeCase.fileKey + ".json");

            console.log('\nUploading to Azure storage as blob:\n\t', compositeCase.fileKey + ".json");

            const data = JSON.stringify(compositeCase);
            const uploadBlobResponse = await blockBlobClient.upload(data, data.length);
            console.log("Blob was uploaded successfully. requestId: ", uploadBlobResponse.requestId);

            console.log("Done")
        }));

        if (finalMessage) {

            const params = {
                output: finalMessage.output,
                taskToken: finalMessage.taskToken
            };

            await stepfunctions.sendTaskSuccess(params).promise();

        }

    }
    catch (ex) {
        console.error("Error create JSON file", ex)
    }
};
