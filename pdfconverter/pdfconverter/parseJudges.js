const fs = require("fs");
const { parse } = require("./parseUtility.js");
const associateJudgePattern = require("./parseAssociateJudge.js");
const chiefJusticePattern = require("./parseChiefJustice.js");
const parseDoubleJustice = require("./parseDoubleJustice.js");
const parseJustice = require("./parseJustice.js");
const presidentPattern = require("./parsePresident.js");
const parseJudge = require("./parseJudge.js");
module.exports = (judgeTitles, jsonData) => {
    const judgeTitleKeys = Object.keys(judgeTitles);
    var caseId = jsonData.fileKey;
    var parsedResult = new Map();

    //help method for insert value into result list
    function insertResult(judgeName, caseID, titleID) 
    {
        if (judgeTitleKeys.indexOf(titleID) === -1) {
            console.log("Invalid titleID", titleID);
            return;
        }

        if (!parsedResult.has(judgeName)) {
            parsedResult.set(judgeName, [[caseID], titleID]);
        }
        else 
        {
            var casesApper = parsedResult.get(judgeName)[0];
            if (!casesApper.includes(caseID)) casesApper.push(caseID);
            var titles = parsedResult.get(judgeName)[1];
            if (!titles.includes(titleID)) titles.push(titleID);
            parsedResult.set(judgeName, [casesApper, titles]);
        }
    };

    function parseResult(result, caseId, judgeTitle)
    {
        if(result != undefined && result != null && result.value != undefined && result.value != null)
        {
            var resultLength = result.value.length;
            for(var i = 0; i < resultLength; i++)
            {
                insertResult(result.value[i], caseId, judgeTitle);
                // fs.appendFileSync('judgelog.txt', judgeTitle + " " + result.value[i] + "\n", function (err) {
                //     if (err) throw err;
                //     console.log('Saved!');
                // });
            }
            // fs.appendFileSync('judgelog.txt', jsonData.caseText.substring(result.valueIndex - 50, result.valueIndex + 80) + "\n", function (err) {
            //     if (err) throw err;
            //     console.log('Saved!');
            // });
            if(resultLength > 0)
                return true;
        }
        return false;
    }

    function parseCommonJudge(data, pattern, caseId, judgeTitle)
    {
        let result = parse(data, pattern);
        return parseResult(result, caseId, judgeTitle);
    }

    // fs.appendFileSync('judgelog.txt', "==================================================" + caseId + "==============================================\n", function (err) {
    //     if (err) throw err;
    //     console.log('Saved!');
    // });

    //var parsed = false;
    parseCommonJudge(jsonData.caseText, chiefJusticePattern, caseId, 'chief-justice');
    parseCommonJudge(jsonData.caseText, presidentPattern, caseId, "president");
    parseResult(parseJudge(jsonData.caseText, judgeTitles), caseId, 'judge');
    parseResult(parseDoubleJustice(jsonData.caseText, judgeTitles), caseId, 'justice');
    parseResult(parseJustice(jsonData.caseText, judgeTitles), caseId, 'justice');
    parseCommonJudge(jsonData.caseText, associateJudgePattern, caseId, 'associate-judge');

    let caseJudges = [];
    parsedResult.forEach(
        (value, key) => {
            caseJudges.push({
                title_id: value[1],
                name: key
            })
        });

    //console.log('judges: ' + JSON.stringify(caseJudges));
    jsonData.judges = caseJudges;
    //jsonData.parsed = true;
    return jsonData;
}