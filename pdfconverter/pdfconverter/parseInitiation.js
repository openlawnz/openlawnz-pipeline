const { parse2, parse3, parse4, mergeData } = require("./parseUtility.js");
module.exports = (data) =>
{
    let initiationNames = [];
    if(data.startsWith("BETWEEN"))
    {
        data = data.replace(/^(BETWEEN\s)/,"");
    }
    //Get the first applicant/appelant/plaintiff name
    const initiationPattern1 = [
        //jdo files
        ///([a-zA-Z0-9\u00C0-\u02AB\s'\(\)\/,]*)\s{2}(First )?\s*(Appellants?|Applicants?|Plaintiffs?)/m,///(^[a-zA-Z0-9\u00C0-\u02AB\s'\(\),]*)\s{2}(First )?\s*(Appellants?|Applicants?|Plaintiffs?)/m;
        //2004 - 2005
        /([a-zA-Z0-9\u00C0-\u02AB\s'\(\)\/,-.!"]*)\s*(First )?\s*(Appellants?|Applicants?|Plaintiffs?)/mi,
        /(THE QUEEN)(v)\s{1,7}/mi
    ];
    const result1 = parse4(data, initiationPattern1, 1);
    mergeData(initiationNames, result1);


    //Get the applicant/appelant/plaintiff name between "BETWEEN" and applicant/appelant/plaintiff
    const initiationPattern2 = [
        ///^(BETWEEN)\s*([a-zA-Z0-9\u00C0-\u02AB\s'\(\),]*)\s{2}(First )?\s*(Appellants?|Applicants?|Plaintiffs?)/gm
        //2004-2005
        /(BETWEEN)\s*([a-zA-Z0-9\u00C0-\u02AB\s'\(\),’]*)\s*(First )?\s*(Appellants?|Applicants?|Plaintiffs?)/gm
    ];
    let result2 = parse3(data, initiationPattern2, 2);
    mergeData(initiationNames, result2);

    //Get the applicant/appelant/plaintiff name between number
    const initiationPattern3 = [
        /(First )?(Appellants?|Applicants?|Plaintiffs?)\s*(AND)?\s*([a-zA-Z0-9\u00C0-\u02AB\s'\(\),]*)\s{2}(Second )?\s*(Appellants?|Applicants?|Plaintiffs?)/gm,
        /(Second )?(Appellants?|Applicants?|Plaintiffs?)\s*(AND)?\s*([a-zA-Z0-9\u00C0-\u02AB\s'\(\),]*)\s{2}(Third )?\s*(Appellants?|Applicants?|Plaintiffs?)/gm,
        /(Third )?(Appellants?|Applicants?|Plaintiffs?)\s*(AND)?\s*([a-zA-Z0-9\u00C0-\u02AB\s'\(\),]*)\s{2}(Fourth )?\s*(Appellants?|Applicants?|Plaintiffs?)/gm
    ];
    let result3 = parse3(data, initiationPattern3, 4);
    mergeData(initiationNames, result3);

    //Get The Queen


    //Get Party Type
    const partyTypePattern = /(applicant|appellant|plaintiff)/i;
    const initiationPartyType = parse2(data, partyTypePattern, 1);

    return {
        initiationNames,
        initiationPartyType
    }
}