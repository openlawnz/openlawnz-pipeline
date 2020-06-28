const download = require("download");

const common = require("../../common/functions");

const run = async (url, pathArr) => {
	try {
		const jsonData = await download(url);

		const json = JSON.parse(jsonData);
		if (!pathArr) {
			return json;
		} else {
			return common.getNestedObject(json, pathArr);
		}
	} catch (ex) {
		console.error("Error parsing json data for url.js", ex)
		throw ex;
	}
};

if (require.main === module) {
	try {
		throw new Error("Cannot be run individually.")
		//run();
	} catch (ex) {
		console.error(ex);
	}
} else {
	module.exports = run;
}