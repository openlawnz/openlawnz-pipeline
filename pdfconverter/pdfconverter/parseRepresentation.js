const parseInitiation = require("./parseInitiation.js");
const parseResponse = require("./parseResponse.js");
const parseInitiationAppearance = require("./parseInitiationAppearance.js");
const parseResponseAppearance = require("./parseResponseAppearance.js");
const { parse2 } = require("./parseUtility.js");
const getInitiationResponse = data => {
    const pattern1 = /\s{2}BETWEEN\s*([\w\W]*)\s{3}(Hearing:|Court:)\s{3}/;
    const output1 = parse2(data, pattern1, 1);
    if(output1 !== "")
    {
        const output1Temp = output1.split("Hearing:");
        if(output1Temp != null && output1Temp.length > 0)
        {
            return output1Temp[0].trim();
        }
    }

    const pattern2 = /\s{2}BETWEEN\s*([\w\W]*)\s{3}(Judgment:)\s{3}/;
    const output2 = parse2(data, pattern2, 1);
    if(output2 !== "")
    {
        return output2;
    }

    const pattern3 = /\s{3}(THE QUEEN)\s*([\w\W]*)\s{3}(Hearing:)\s{3}/;
    const output3 = data.match(pattern3);
    if(output3 != null && output3 != undefined)
    {
        if(output3[1] != undefined && output3[2] != undefined)
        {
            return output3[1] + output3[2].trim();
        }
    }

    //2004 - 2005
    const pattern4 = /BETWEEN\s*([\w\W]*)(\sRespondent)\s(Hearing:|Heard at|Hearing at|DECISION ON APPLICATION FOR LEAVE TO APP?EAL|IN THE MATTER OF|INTERIM DECISION ISSUED|HEARING ON THE PAPERS)\s/mi;
    const output4 = data.match(pattern4);
    if(output4 != undefined && output4 != null && output4.length > 0 && output4[1] != undefined)
    {
        if(output4[2] != undefined)
        {
            return output4[1] + output4[2];
        }
        return output4[1].trim();
    }
    

    const pattern5 = /BETWEEN\s*([\w\W]*)\s*(HEARD on the papers|COMMENCED at New Plymouth on 10 November 2003 but completed by sequence|HEARD in Wellington on|HEARING at CHRISTCHURCH on|BY CONSENT HEARD ON THE PAPERS|Date of Ruling:|HEARING at NELSON on|HEARD at TAURANGA|HEARING at DUNEDIN|HEARD at PALMERSTON NORTH|HEARD AT NELSON)\s/mi
    const output5 = parse2(data, pattern5, 1);
    if(output5 !== "")
    {
        return output5;
    }

    const pattern6 = /BETWEEN\s*([\w\W]*)\s*(DECI?SION OF JUDGE|JUDGMENT OF JUDGE|RECALL OF JUDGMENT AND DIRECTIONS|DECISION ON APPLICATION FOR LEAVE|DECISION BY JUDGE|RULING OF JUDGE)\s/mi
    const output6 = parse2(data, pattern6, 1);
    if(output6 !== "")
    {
        return output6;
    }

    const pattern7 = /BETWEEN\s*([\w\W]*)\s*(Counsel:)\s/mi
    const output7 = parse2(data, pattern7, 1);
    if(output7 !== "")
    {
        return output7;
    }
    return output1;
}

const getInitiationResponseAppearance = data => {
    //jdo files
    //const pattern = /\s{2}(Counsel:|Appearances:)\s*([\w\W]*)\s{3}(Judgment:|Sentenced:)\s{3}/ 
    //2004-2005 case files
    const pattern = /(Counsel:?|Appearances:?)\s*([\w\W]*)\s*(Judgment:|Sentenced:|DECISION OF JUDGE|RESERVED JUDGMENT OF JUDGE|JUDGMENT OF JUDGE|RULING OF JUDGE|for respondent\sOrder:)\s*/mi;
    
    let output = parse2(data, pattern, 2);
    if(output.startsWith("/COUNSEL"))
    {
        output = output.split("/COUNSEL")[1].trim();
    }
    if(output.endsWith("RESERVED"))
    {
        output = output.substring(0, output.length - 8).trim();
    }
    return output;
}

module.exports = (jsonData) => {
    const initiationResponse = getInitiationResponse(jsonData.caseText);
    const { initiationNames, initiationPartyType } = parseInitiation(initiationResponse);
    const { responseNames, responsePartyType } = parseResponse(initiationResponse);
    
    const initiationResponseAppearance = getInitiationResponseAppearance(jsonData.caseText);
    const { initiationAppearanceNames } = parseInitiationAppearance(initiationResponseAppearance);
    const { responseAppearanceNames } = parseResponseAppearance(initiationResponseAppearance);

    const representation = {
    // this is the data structure required to match the schema in the database
    // one 'initiation' data is compulsory (all cases must have at least one party)
    // 'response' data is optional (not all cases have a respondent / defendant)
    // appearance can be null if not found
        initiation: {
            party_type: initiationPartyType ? initiationPartyType.toLowerCase() : null, // Get from parser applicant | applicant | plaintiff
            names: initiationNames,
            appearance: initiationAppearanceNames
        },
        response: {
            party_type: responsePartyType ? responsePartyType.toLowerCase() : null,// Get from parser respondent | defendant
            names: responseNames,
            appearance: responseAppearanceNames
        }
    }

    jsonData.representation = representation;

    return representation;
}