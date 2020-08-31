const parseLawReport = (lawReports, jsonData) => {

    if (jsonData.caseCitations[0]) {

        let foundLawReport = lawReports.find(l => jsonData.caseCitations[0].citation.indexOf(l.acronym) !== -1)

        if (foundLawReport) {

            jsonData.lawReport = foundLawReport;

            return;
        }
    }

};

module.exports = parseLawReport;
