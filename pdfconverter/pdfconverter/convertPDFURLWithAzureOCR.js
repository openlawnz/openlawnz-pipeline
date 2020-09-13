'use strict';

const fetch = require('node-fetch');

const AWSXRay = require('aws-xray-sdk-core')
const AWS = AWSXRay.captureAWS(require('aws-sdk'))

const s3 = new AWS.S3();

let subscriptionKey = process.env.AZURE_SUBSCRIPTION_KEY;
let sendEndpoint = process.env.AZURE_SEND_ENDPOINT;
let resultEndpoint = process.env.AZURE_RESULT_ENDPOINT;

const delay = t => new Promise(resolve => setTimeout(resolve, t));

const getJSONFile = async(bucket, key) => {

    let raw = await s3.getObject({
        Bucket: bucket,
        Key: key
    }).promise();

    return JSON.parse(raw.Body.toString());

};

const checkResult = async(url, options) => {

    await delay(5000);
    console.log('check url', url);
    const response = await fetch(url, options).then(r => r.json());

    console.log(response, response.status)
    if (response.status === "succeeded") {
        // Read header
        console.log("success");

        return response.analyzeResult.readResults;

    }
    else {
        console.log("didnt find data");
        return await checkResult(url, options);
    }

};

const checkResponse = async(pdfURL) => {

    const delayAmount = 1000 + (Math.floor(Math.random() * 5000));

    console.log('check reponse', delayAmount, pdfURL);

    await delay(delayAmount);

    const response = await fetch(sendEndpoint, {
        body: JSON.stringify({ url: pdfURL }),
        method: 'post',
        headers: {
            'Content-Type': 'application/json',
            'Ocp-Apim-Subscription-Key': subscriptionKey
        }
    })

    console.log(response);
    console.log(response.headers);
    if (response.status === 202) {
        return response;
    }
    else {
        console.log("Too many requests");
        return await checkResponse(pdfURL);
    }

}

module.exports = async(pdfURL, jsonData) => {

    if (pdfURL.indexOf('govt.nz') !== -1 || pdfURL.indexOf('nzlii.org') !== -1) {
        console.error("Cannot use NZ Govt or NZlii URLs");
        return;
    }

    try {

        let pages;

        let exists = false;
        // Check if it exists in S3 first
        try {

            await s3.headObject({
                Bucket: jsonData.caseMeta.buckets.BUCKET_OCR,
                Key: jsonData.fileKey
            }).promise();

            exists = true;

        }
        catch (ex) {}


        if (exists) {
            // file exists
            console.log("OCR Already exists");

            pages = await getJSONFile(jsonData.caseMeta.buckets.BUCKET_OCR, jsonData.fileKey)

        }

        else {

            console.log("OCR doesn't exist, get it from Azure");

            const response = await checkResponse(pdfURL);

            let headersArr = response.headers.get('operation-location').split('/');

            const operationID = headersArr[headersArr.length - 1];

            let resultURL = resultEndpoint + "/" + operationID;

            console.log("result url: " + resultURL);

            pages = await checkResult(resultURL, {
                headers: {
                    'Content-Type': 'application/json',
                    'Ocp-Apim-Subscription-Key': subscriptionKey
                }
            });

            // write result to s3
            await s3
                .putObject({
                    Body: JSON.stringify(pages),
                    Bucket: jsonData.caseMeta.buckets.BUCKET_OCR,
                    Key: jsonData.fileKey,
                    ContentType: 'application/json'
                })
                .promise();

        };

        return pages;

    }
    catch (ex) {
        console.log('Operation failed');
        console.log(ex);
    }
}
