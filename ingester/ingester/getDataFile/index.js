module.exports = async(datasource, datalocation, apifyTaskId, apifyToken) => {

	if (!datasource) {
		throw new Error("Missing datasource");
	}

	let retData;

	if (datasource === "moj") {

		try {
			retData = await require("./jdoCases")(datalocation);
		}
		catch (ex) {
			console.error("Error with JDO data source", ex)
		}

	}
	else if (datasource === "acc") {
		try {
			retData = await require("./accCases")();
		}
		catch (ex) {
			console.error("Error with ACC data source", ex)
		}

	}
	else if (datasource === "pco") {

		if (!apifyTaskId || !apifyToken) {
			console.error("Error with pco datasource - no apify task or token")
			throw new Error("Missing Apify env variables");
		}

		try {
			retData = await require("./pcoLegislation")(apifyTaskId, apifyToken);
		}
		catch (ex) {
			console.error("Error with PCO datasource", ex)
		}

	}
	else if (datasource === "url") {

		if (!datalocation) {
			console.error("Error with url datasource")
			throw new Error("Missing datalocation");

		}

		retData = await require("./generic/url")(datalocation);

	}
	else {

		try {
			retData = JSON.stringify(JSON.parse(datasource));
		}
		catch (ex) {
			console.error("Error with data source (not jdo, not acc, not pco, not url)", ex)
			throw ex;
		}
	}

	return retData;

};
