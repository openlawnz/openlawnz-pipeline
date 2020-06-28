/* 
	This is an adapter for the ingester to bring in files from judicial decisions online (JDO), a Ministry of Justice site
	const URL specifies the jdo search paramaters and can be modified to limit the date range and max number of records that are passed for ingest
*/

const urlAdapter = require("./generic/url");
const helpers = require('../common/functions');

module.exports = async (maxRows, fromDate) => {


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
	const URL = "https://forms.justice.govt.nz/solr/jdo/select?q=*&facet=true&facet.field=Location&facet.field=Jurisdiction&facet.limit=-1&facet.mincount=1&rows=1000&json.nl=map&fq=JudgmentDate%3A%5B*%20TO%202019-2-1T23%3A59%3A59Z%5D&sort=JudgmentDate%20desc&fl=CaseName%2C%20JudgmentDate%2C%20DocumentName%2C%20id%2C%20score&wt=json";
	
	
	try {

		const jdoData = await urlAdapter(URL, ['response', 'docs']);
		
		return jdoData.map(jdoItem => ({

			fileProvider: "jdo",
			fileKey: `jdo_` + (+new Date(jdoItem.JudgmentDate)) + "_" + jdoItem.DocumentName,
			fileUrl: "https://forms.justice.govt.nz/search/Documents/pdf/" + jdoItem.id,
			caseNames: [jdoItem.CaseName],
			caseDate: jdoItem.JudgmentDate,
			caseCitations: [helpers.getCitation(jdoItem.CaseName)],
			dateAccessed: new Date()


		}));
	}

	catch (ex) {
		console.error("Error returning jdo data to ingester", ex);
		throw ex;
	}
};
