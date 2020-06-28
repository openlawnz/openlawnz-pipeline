const { parse2, parse5, mergeData } = require("./parseUtility.js");
module.exports = (data) =>
{
    let responseNames = [];

    //Get the respondent/defendant name between number
    const responsePattern1 = [
        {
            //jdo files
            //pattern : /^(First |Second |Third |Fourth )?(Appellants?|Applicants?|Plaintiffs?)\s*(AND)\s*([a-zA-Z0-9\u00C0-\u02AB\s'\(\),]*)\s{2}(First )?\s*(Respondents?|Defendants?)/m,
            //2004-2005 case files
            item: [
                {
                    pattern:/^(First |Second |Third |Fourth |Intended )?(Appellants?|Applicants?|Plaintiffs?)\s*([a-zA-Z0-9\u00C0-\u02AB\s'\(\),\/.]*)?\s*(AND)\s*(-)?\s*([a-zA-Z0-9\u00C0-\u02AB\s'\(\),\/.]*)\s*(First |Intended)\s*(Respondents?|Defendants?)/mi,
                    patternResultIndex : 6
                },
                {
                    pattern:/^(First |Second |Third |Fourth )?(Appellants?|Applicants?|Plaintiffs?)\s*([a-zA-Z0-9\u00C0-\u02AB\s'\(\),\/.\&\-]*)?\s*(AND)\s*(-)?\s*([a-zA-Z0-9\u00C0-\u02AB\s'\(\),\/.]*)\s*(Respondents?|Defendants?)/mi,
                    patternResultIndex : 6
                },
                {
                    pattern:/^(First |Second |Third |Fourth )?(Appellants?|Applicants?|Plaintiffs?)\s*([a-zA-Z0-9\u00C0-\u02AB\s'\(\),\/.]*)?\s*(AND)\s*(-)?\s*([a-zA-Z0-9\u00C0-\u02AB\s'\(\),\/.]*)\s*(Respondents?|Defendants?)/mi,
                    patternResultIndex : 6
                }
            ]
        },
        {
            item: [
                {
                    pattern:/^(First )?(Respondents?|Defendants?)\s*(AND)?\s*([a-zA-Z0-9\u00C0-\u02AB\s'\(\),]*)\s*(Second)\s*(Respondents?|Defendants?)/mi,
                    patternResultIndex : 4
                }
            ]
        },
        {
            item: [
                {
                    pattern:/v\s{5,7}([\w\W]*)/m,
                    patternResultIndex : 1
                }
            ]
        }
    ];
    let result1 = parse5(data, responsePattern1);
    mergeData(responseNames, result1);

    // //Get the respondent/defendant name between number
    // const responsePattern2 = [
    //     /^(First )?(Respondents?|Defendants?)\s*(AND)?\s*([a-zA-Z0-9\u00C0-\u02AB\s'\(\),]*)\s*(Second)?\s*(Respondents?|Defendants?)/gm,///^(First )?(Respondents?|Defendants?)\s*([a-zA-Z0-9\u00C0-\u02AB\s'\(\),]*)\s{2}(Second)?\s*(Respondents?|Defendants?)/gm,
    //     /^(Second )?(Respondents?|Defendants?)\s*(AND)?\s*([a-zA-Z0-9\u00C0-\u02AB\s'\(\),]*)\s*(Third)?\s*(Respondents?|Defendants?)/gm,///^(Second )?(Respondents?|Defendants?)\s*([a-zA-Z0-9\u00C0-\u02AB\s'\(\),]*)\s{2}(Third)?\s*(Respondents?|Defendants?)/gm,
    //     /^(Third )?(Respondents?|Defendants?)\s*(AND)?\s*([a-zA-Z0-9\u00C0-\u02AB\s'\(\),]*)\s*(Fourth)?\s*(Respondents?|Defendants?)/gm///^(Third )?(Respondents?|Defendants?)\s*([a-zA-Z0-9\u00C0-\u02AB\s'\(\),]*)\s{2}(Fourth)?\s*(Respondents?|Defendants?)/gm
    // ];
    // let result2 = parse3(data, responsePattern2, 4);
    // mergeData(responseNames, result2);

    //Get Party Type
    const responseTypePattern = /(defendant|respondent)/i;
    let responsePartyType = parse2(data, responseTypePattern, 1);

    return {
        responseNames,
        responsePartyType
    }
}