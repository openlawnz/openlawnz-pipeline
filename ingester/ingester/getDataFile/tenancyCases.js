const urlAdapter = require("./generic/url");
const helpers = require('../common/functions');

module.exports = async (maxRows, fromDate) => {


	// testing - 10 cases only
	const URL = "https://forms.justice.govt.nz/solr/TTV2/select?q=*&rows=10&fl=applicationNumber_s,timestamp,decisionDateIndex_l,casePerOrgApplicant_s,casePerOrgRespondent_s,costType_s,costAwarded_s,orderDetailJson_s&wt=json";
	
	
	try {

		const ttvData = await urlAdapter(URL, ['response', 'docs']);
		
		return ttvData.map(ttvItem => ({

			fileProvider: "ttv",
			fileKey: `ttv_` + (+new Date(ttvItem.publishedDate_dt)) + "_" + ttvItem.XXXXXXXXXXXXXXX,
			// TODO GOT TO HERE
			fileUrl: "https://forms.justice.govt.nz/search/Documents/TTV2/PDF/" + ttvItem.id,
			caseNames: [ttvItem.CaseName],
			caseDate: ttvItem.JudgmentDate,
			caseCitations: [],
			dateAccessed: new Date()
			// ---------------

		}));
	}

	catch (ex) {
		throw ex;
	}
};
