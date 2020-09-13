const AWSXRay = require('aws-xray-sdk-core');
const AWS = AWSXRay.captureAWS(require('aws-sdk'));
const s3 = new AWS.S3();
const pdfconverter = require('./pdfconverter');

const { convertPDFURLWithPDFJS, convertPDFURLWithAzureOCRConfiguration } = require('@openlawnz/openlawnz-parsers');
const convertPDFURLWithAzureOCR = require('./convertPDFURLWithAzureOCR');

let legislation;

const getJSONFile = async(bucket, key) => {
    let raw = await s3
        .getObject({
            Bucket: bucket,
            Key: key,
        })
        .promise();

    return JSON.parse(raw.Body.toString());
};

exports.handler = async(event) => {
    if (!legislation) {
        legislation = await getJSONFile(process.env.LEGISLATION_JSON_BUCKET, 'legislation.json');
    }

    await Promise.all(
        event.Records.map(async(record) => {
            const caseRecord = JSON.parse(record.body);

            try {
                const jsonData = await pdfconverter(
                    caseRecord,
                    legislation,
                    convertPDFURLWithAzureOCR,
                    convertPDFURLWithPDFJS,
                );

                // Put into S3 permanent storage
                await s3
                    .putObject({
                        Body: JSON.stringify({
                            ...caseRecord,
                            ...jsonData
                        }),
                        Bucket: caseRecord.caseMeta.buckets.BUCKET_PERMANENT_JSON_WITH_ENV,
                        Key: 'cases/' + jsonData.fileKey + '.json',
                        ContentType: 'application/json',
                    })
                    .promise();
            }
            catch (ex) {
                console.error(caseRecord.fileKey, ex);

                await s3
                    .putObject({
                        Bucket: caseRecord.caseMeta.buckets.BUCKET_PIPELINE_PROCESSING_WITH_ENV,
                        Key: caseRecord.caseMeta.runKey + '/errors/' + caseRecord.fileKey,
                        Body: JSON.stringify(caseRecord),
                    })
                    .promise();
            }
        }),
    );
};
