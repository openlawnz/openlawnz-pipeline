const AWS = require('aws-sdk');
const stepfunctions = new AWS.StepFunctions();
const sqs = new AWS.SQS();
const cloudwatchevents = new AWS.CloudWatchEvents();
const lambda = new AWS.Lambda();

exports.handler = async(event) => {

    //const environment = event.Input.environment;
    console.log('SQS Queues');

    const sqsQueues = await sqs.listQueues({}).promise();
    try {
        for (let sqsQueue of sqsQueues.QueueUrls) {
            await sqs.purgeQueue({
                QueueUrl: sqsQueue
            }).promise();

        }
    }
    catch (ex) {
        if (ex.code !== 'AWS.SimpleQueueService.PurgeQueueInProgress') {
            console.log(ex)
        }
    }

    console.log('Cloudwatch Event Rule');

    await cloudwatchevents.disableRule({
        Name: process.env.CLOUDWATCH_RULE_NAME
    }).promise();

    // Lambdas

    console.log('Lambdas');

    const lambdaFunctions = await lambda.listFunctions({}).promise();

    for (let func of lambdaFunctions.Functions) {

        const funcTags = await lambda.listTags({
            Resource: func.FunctionArn
        }).promise()

        //console.log(funcTags.Tags)
        //console.log(typeof funcTags.Tags['openlawnz-pipeline'])
        const isPipelineLambda = funcTags.Tags['openlawnz-pipeline'] === 'true';

        if (isPipelineLambda) {

            await lambda.putFunctionConcurrency({
                FunctionName: func.FunctionName,
                ReservedConcurrentExecutions: 0
            }).promise();

        }

    }

    // Step functions
    if (event.IncludeStepFunctions) {

        console.log('Step Functions');

        const runningExecutions = await stepfunctions.listExecutions({
            stateMachineArn: process.env.STEP_FUNCTION_ARN,
            statusFilter: 'RUNNING'
        }).promise();


        for (let execution of runningExecutions.executions) {
            await stepfunctions.stopExecution({
                executionArn: execution.executionArn
            }).promise();
        }

    }

};
