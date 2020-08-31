const AWS = require('aws-sdk')

const s3 = new AWS.S3();
const judge_titles = require("openlawnz-common/judge-titles.js");

exports.handler = async(event) => {

    try {

        await s3
            .putObject({
                    Body: JSON.stringify(judge_titles),
                    Bucket: process.env.BUCKET_JUDGE_TITLES,
                    Key: "judge-titles.json",
                    ContentType: 'application/json'
                },
                function (err) {
                    if (err) console.error(err, err.stack);
                }
            )
            .promise()

    }
    catch (ex) {
        console.error("Error putting judge-titles.json", ex);
    }

};
