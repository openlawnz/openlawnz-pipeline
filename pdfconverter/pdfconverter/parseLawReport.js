const parseLawReport = (lawReports, jsonData) => {


    let foundLawReport = lawReports.find(l => jsonData.caseCitations[0].citation.indexOf(l.acronym) !== -1)

    if (foundLawReport) {

        jsonData.lawReport = foundLawReport;

        return;

    }
    
};

module.exports = parseLawReport;
