// From https://github.com/Azure-Samples/azure-search-javascript-samples/blob/master/quickstart/AzureSearchClient.js

const fetch = require('node-fetch');

class AzureSearchClient {
    constructor(searchServiceName, adminKey, queryKey, indexerName) {
        this.searchServiceName = searchServiceName;
        this.adminKey = adminKey;
        this.queryKey = queryKey;
        this.indexerName = indexerName;
        this.apiVersion = '2019-05-06';
    }


    getResetIndexerUrl() { return `https://${this.searchServiceName}.search.windows.net/indexers/${this.indexerName}/reset?api-version=${this.apiVersion}`; }

    getRunIndexerUrl() { return `https://${this.searchServiceName}.search.windows.net/indexers/${this.indexerName}/run?api-version=${this.apiVersion}`; }

    static async request(url, method, apiKey, bodyJson = null) {

        const headers = {
            'content-type': 'application/json',
            'api-key': apiKey
        };
        const init = bodyJson === null ? {
            method,
            headers
        } : {
            method,
            headers,
            body: JSON.stringify(bodyJson)
        };
        return fetch(url, init);
    }

    static throwOnHttpError(response) {
        const statusCode = response.status;
        if (statusCode >= 300) {
            console.log(`Request failed: ${JSON.stringify(response, null, 4)}`);
            throw new Error(`Failure in request. HTTP Status was ${statusCode}`);
        }
    }

    async resetAsync() {
        console.log("\n Reset indexer");
        const endpoint = this.getResetIndexerUrl();
        const response = await AzureSearchClient.request(endpoint, "POST", this.adminKey);
        AzureSearchClient.throwOnHttpError(response);
        return this;
    }

    async runAsync() {
        console.log("\n Run indexer");
        const endpoint = this.getRunIndexerUrl();
        const response = await AzureSearchClient.request(endpoint, "POST", this.adminKey);
        AzureSearchClient.throwOnHttpError(response);
        return this;
    }

}

module.exports = AzureSearchClient;
