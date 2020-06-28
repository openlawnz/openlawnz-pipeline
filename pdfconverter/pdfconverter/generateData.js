const { processPDF } = require("./pdfToJSON");
const { parseNeutralCitation } = require("./parseNeutralCitation");
const { parseCourt } = require("./parseCourt");
const parseLawReport = require('./parseLawReport');
const parseCategory = require("./parseCategory");
const parseRepresentation = require("./parseRepresentation");
const parseJudges = require("./parseJudges");
const parseLocation = require("./parseLocation");
const parseLegislation = require("./parseLegislation");
const judgeTitles = require("openlawnz-common/judge-titles.js");


// Cache between lambda calls
let courts;
let lawReports;
let legislation;

// Enhancement: Use worker_threads

module.exports = async (pdfURL, initialState, courts, lawReports, legislation) => {
    
    console.log('initialState', initialState)
    
    let pdfJSON = {
            isValid: false,
            footnoteContexts: [],
            footnotes: [],
        }
    
    const state = Object.assign(pdfJSON, {
        "caseCitations": [],
        ...initialState
    });
    
    parseNeutralCitation(state);
    
    parseLocation(state);
    
    parseCourt(courts, state);
    
    parseLawReport(lawReports, state);
    
    // Relies on parseCourt and parseLawReport
    parseCategory(state);
    
    parseRepresentation(state);
    
    parseJudges(judgeTitles, state);
    
    parseLegislation(legislation, state);
    
    return state;
    
}