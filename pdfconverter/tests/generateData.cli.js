const fs = require("fs")
const generateData = require("../pdfconverter/generateData");
const courts = require("./generateDataTestFiles/courts.json");
const lawReports = require("./generateDataTestFiles/law-reports.json");
const judgeTitles = require("./generateDataTestFiles/judge-titles.json");
const legislation = require("./generateDataTestFiles/legislation.json");

const myArgs = process.argv.slice(2);

(async () => {
    
    const result = await generateData(myArgs[0], null, courts, lawReports, judgeTitles, legislation);
    
    console.log(result);
    
})(); 