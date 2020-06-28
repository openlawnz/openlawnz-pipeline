/* 
	This adapter grabs a list of all current and repealed legislation from an APIFY crawler 
	The APIFY crawler must be manually run first (crawl results are deleted from APIFY after 7 days)
	TODO: build in a trigger to this process so that the APIFY crawler is run automatically
*/

const urlAdapter = require("./generic/url");

const run = async (APIFY_TASK_ID, APIFY_TOKEN) => {

	try {
		
		const jsonURL = `https://api.apify.com/v2/actor-tasks/${APIFY_TASK_ID}/runs/last/dataset/items?token=${APIFY_TOKEN}`
		
		const apifyData = await urlAdapter(jsonURL);

		const allLegislation = Array.prototype.concat.apply(
			[],
			apifyData.map(b => b.pageFunctionResult)
		);

		return allLegislation;
	} catch (ex) {
		throw ex;
	}
};

if (require.main === module) {
	try {
		throw new Error("Cannot be run individually.")
		//run();
	} catch (ex) {
		console.log(ex);
	}
} else {
	module.exports = run;
}