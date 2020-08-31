const { parseNeutralCitation } = require("./parseNeutralCitation");
const { parseCourt } = require("./parseCourt");
const parseLawReport = require('./parseLawReport');
const parseCategory = require("./parseCategory");
const parseRepresentation = require("./parseRepresentation");
const parseJudges = require("./parseJudges");
const parseLocation = require("./parseLocation");
const parseLegislation = require("./parseLegislation");
const parseCourtFilingNumber = require("./parseCourtFilingNumber");
const judgeTitles = require("openlawnz-common/judge-titles.js");


module.exports = async(initialState, courts, lawReports, legislation) => {

    const state = {
        "caseCitations": [],
        ...initialState
    };

    state.caseText = state.caseText.replace(/\u0000/g, ' ');

    // Errors will be thrown to parent
    parseNeutralCitation(state);

    parseLocation(state);

    parseCourt(courts, state);

    parseLawReport(lawReports, state);

    // Relies on parseCourt and parseLawReport
    parseCategory(state);

    parseRepresentation(state);

    parseJudges(judgeTitles, state);

    parseLegislation(legislation, state);

    parseCourtFilingNumber(state);

    return state;

}
