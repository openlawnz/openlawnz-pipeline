const AWS = require("aws-sdk");
const cloudwatchevents = new AWS.CloudWatchEvents();
const stepfunctions = new AWS.StepFunctions();

const AthenaExpress = require("athena-express");

const athenaExpressConfig = { aws: AWS }; //configuring athena-express with aws sdk object
const athenaExpress = new AthenaExpress(athenaExpressConfig);


exports.handler = async(event, context, callback) => {

    // console.log(event)

    const athenaResult = await athenaExpress.query(`
        SELECT COUNT(*) as count FROM (
            SELECT filekey FROM ${process.env.ATHENA_CASES_TABLE} 
            UNION ALL
            SELECT filekey FROM ${process.env.ATHENA_ERRORS_TABLE}
        )
    `);

    const athenaCount = parseInt(athenaResult.Items[0]['count']);

    console.log(event, athenaCount)

    if (event.count === athenaCount) {
        // terminate rule
        await cloudwatchevents.disableRule({
            Name: 'ingesterwatcher'
        }).promise();


        // TODO: Read output of errors
        // Read last errors from errors bucket
        // Add to the array (if not already there) and save to bucket
        
        /*
        [
             
        ]
        */


        await stepfunctions.startExecution({
            stateMachineArn: process.env.STATE_MACHINE_ARN
        }).promise();

    }
    else {
       
        // get tags
        let tagData = await cloudwatchevents.listTagsForResource({
            ResourceARN: process.env.INGESTER_WATCHER_RULE

        }).promise();

        let lastProcessedCount = athenaCount;
        let thresholdCount = -1;

        if (tagData.Tags.length > 0) {
            //  If tagData exists, set last processed and thresholdCount
            
            console.log(tagData.Tags)
            
            const lastProcessedCountTag = tagData.Tags.find(t => t.Key == "lastProcessedCount")
            if(lastProcessedCountTag) { lastProcessedCount = parseInt(lastProcessedCountTag.Value);}

            const thresholdCountTag = tagData.Tags.find(t => t.Key == "thresholdCount")
            if(thresholdCountTag) {thresholdCount = parseInt(thresholdCountTag.Value);}

        }

        if (lastProcessedCount === athenaCount) {
            // if lastProcessed equals athenaCount there has been no change
            thresholdCount++
        }

        else {
            thresholdCount = 0;
        }

        if (thresholdCount > 3) {

            // terminate rule
            await cloudwatchevents.disableRule({
                Name: 'ingesterwatcher'
            }).promise();

        }
        else {

            await cloudwatchevents.tagResource({
                ResourceARN: process.env.INGESTER_WATCHER_RULE,
                Tags: [{
                        Key: 'lastProcessedCount',
                        Value: athenaCount + ""
                    },
                    {
                        Key: 'thresholdCount',
                        Value: thresholdCount + ""
                    }
                ]
            }).promise();
        }
    }
};
