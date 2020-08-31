const AzureSearchClient = require('./AzureSearchClient.js');

exports.handler = async(event) => {

    const environment = event.Input.environment;

    const client = new AzureSearchClient(
        process.env.SERVICE_NAME,
        process.env.ADMIN_KEY,
        process.env.QUERY_KEY,
        process.env.INDEXER_NAME + '-' + environment + '-indexer'
    );


    try {
        await client.resetAsync();
        await client.runAsync();
    }
    catch (ex) {
        console.log(ex)
    }

    return {
        environment
    }

};
