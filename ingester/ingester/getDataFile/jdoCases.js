/*
	This is an adapter for the ingester to bring in files from judicial decisions online (JDO), a Ministry of Justice site
	const URL specifies the jdo search paramaters and can be modified to limit the date range and max number of records that are passed for ingest
*/
const fs = require('fs');
const path = require('path');
const urlAdapter = require("./generic/url");
const helpers = require('../common/functions');

// TODO: Change datalocation to be an object that can read from URL or file system
module.exports = async(datalocation) => {


	// const URL = [
	// 	"https://forms.justice.govt.nz/solr/jdo/select",
	// 	"?q=*",
	// 	"&facet=true",
	// 	"&facet.field=Location",
	// 	"&facet.field=Jurisdiction",
	// 	"&facet.limit=-1",
	// 	"&facet.mincount=1",
	// 	"&rows=" + (maxRows || 2),
	// 	"&json.nl=map",
	// 	`&fq=JudgmentDate%3A%5B${(fromDate || "2016-2-27")}T00%3A00%3A00Z%20TO%20*%20%5D`,
	// 	"&sort=JudgmentDate%20desc",
	// 	"&fl=CaseName%2C%20JudgmentDate%2C%20DocumentName%2C%20id%2C%20score",
	// 	"&wt=json"
	// ].join("");

	// const URL = "https://forms.justice.govt.nz/solr/jdo/select?q=*&facet=true&facet.field=Location&facet.field=Jurisdiction&facet.limit=-1&facet.mincount=1&rows=10&json.nl=map&fq=JudgmentDate%3A%5B2017-01-01T00%3A00%3A00Z%20TO%202017-07-01T23%3A59%3A59Z%5D&sort=JudgmentDate%20desc&fl=CaseName%2C%20JudgmentDate%2C%20DocumentName%2C%20id%2C%20score&wt=json";
	// const URL = "https://forms.justice.govt.nz/solr/jdo/select?q=*&facet=true&facet.field=Location&facet.field=Jurisdiction&facet.limit=-1&facet.mincount=1&rows=3000&json.nl=map&fq=JudgmentDate%3A%5B2016-01-01T00%3A00%3A00Z%20TO%202017-01-01T23%3A59%3A59Z%5D&sort=JudgmentDate%20desc&fl=CaseName%2C%20JudgmentDate%2C%20DocumentName%2C%20id%2C%20score&wt=json";
	// const URL = "https://forms.justice.govt.nz/solr/jdo/select?q=*&facet=true&facet.field=Location&facet.field=Jurisdiction&facet.limit=-1&facet.mincount=1&rows=100&json.nl=map&fq=JudgmentDate%3A%5B*%20TO%202019-2-1T23%3A59%3A59Z%5D&sort=JudgmentDate%20desc&fl=CaseName%2C%20JudgmentDate%2C%20DocumentName%2C%20id%2C%20score&wt=json";


	try {

		let jdoData;

		if (!datalocation) {
			// TEMPORARILY DISABLED DUE TO MIGRATION
			//jdoData = await urlAdapter(URL, ['response', 'docs']);
			throw new Error("No datalocation")
		}
		else {
			const jsonData = JSON.parse(fs.readFileSync(path.join(__dirname, datalocation), "utf8").toString());
			jdoData = helpers.getNestedObject(jsonData, ['response', 'docs']);
		}

		return jdoData;

		// TEMPORARILY DISABLED DUE TO MIGRATION
		// return jdoData.map(jdoItem => {

		// 	const fileKey = `jdo_` + (+new Date(jdoItem.JudgmentDate)) + "_" + jdoItem.DocumentName;
		// 	const neutralCitation = helpers.getCitation(jdoItem.CaseName);

		// 	return {
		// 		fileProvider: "jdo",
		// 		fileKey,
		// 		fileUrl: "https://forms.justice.govt.nz/search/Documents/pdf/" + jdoItem.id,
		// 		meta: {
		// 			s3Cache: {
		// 				bucket: process.env.BUCKET_JDO_CACHE,
		// 				objectKey: fileKey
		// 			}
		// 		},
		// 		caseNames: [jdoItem.CaseName],
		// 		caseDate: jdoItem.JudgmentDate,
		// 		caseCitations: neutralCitation ? [neutralCitation] : [],
		// 		dateAccessed: new Date()

		// 	}
		// });
	}

	catch (ex) {
		console.error("Error returning jdo data to ingester", ex);
		throw ex;
	}
};
