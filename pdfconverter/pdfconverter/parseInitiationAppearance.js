const { parse2, parse4, mergeData, parseAppearance1 } = require("./parseUtility.js");
module.exports = (data) =>
{
    let initiationAppearanceNames = [];
    
    //acc_1110153600000_2005NZACC68.pdf.txt
    const initiationAppearancePattern3 = [
        /(for respondent)\s([a-zA-Z0-9\u00C0-\u02AB\s'\(\),.-]*)\s(by or)?\s(for appellant)/mi
    ];
    const result3 = parse4(data, initiationAppearancePattern3, 2);
    mergeData(initiationAppearanceNames, result3);

    if(result3.length == 0)
    {
        //Get the first appearance name
        const initiationAppearancePattern1 = /([a-zA-Z0-9\u00C0-\u02AB\s'\(\),.-]*)( for (the )?app?ellant.?)/mi;
        let result1 = parse2(data, initiationAppearancePattern1, 1);
        const initiationAppearancePattern1Custom1 = /([a-zA-Z0-9\u00C0-\u02AB\s'\(\),.]*)(, counsel|, Advocate|- Advocate)/mi
        const reservedDescription = [", Barrister of Auckland"];
        let result1Custom1 = parseAppearance1([result1], initiationAppearancePattern1Custom1, 1, reservedDescription);
        for(var i = 0; i < result1Custom1.length; i++)
        {
            if(result1Custom1[i].includes("for appellant"))
            {
                var customValue = result1Custom1[i].split("for appellant");
                for(var j = 0; j < customValue.length; j++)
                {
                    //need to refactor the below code because it has been repeated again at below
                    if(customValue[j].includes(" and "))
                    {
                        var temp = customValue[j].split(" and ");
                        if(!initiationAppearanceNames.includes(temp[0].trim()))
                        {
                            initiationAppearanceNames.push(temp[0].trim());
                        }
                        if(!initiationAppearanceNames.includes(temp[1].trim()))
                        {
                            initiationAppearanceNames.push(temp[1].trim());
                        }
                    }
                    else
                    {
                        if(!initiationAppearanceNames.includes(customValue[j].trim()))
                        {
                            initiationAppearanceNames.push(customValue[j].trim());
                        }
                    }
                }
            }
            else if(result1Custom1[i].includes(" and "))
            {
                var temp = result1Custom1[i].split(" and ");
                if(!initiationAppearanceNames.includes(temp[0].trim()))
                {
                    initiationAppearanceNames.push(temp[0].trim());
                }
                if(!initiationAppearanceNames.includes(temp[1].trim()))
                {
                    initiationAppearanceNames.push(temp[1].trim());
                }
            }
            else
            {
                if(!initiationAppearanceNames.includes(result1Custom1[i].trim()))
                {
                    initiationAppearanceNames.push(result1Custom1[i].trim());
                }
            }
        }
    }

    

    //Get the first in person name
    //jdo files
    //const firstInitiationInPerson = data.match(/(Appellants?|Applicants?|Plaintiffs?)\s(in Person)\s{2}/);
    //2004-2005 case files
    // const firstInitiationInPerson = data.match(/(Appellants?|Applicants?|Plaintiffs?)\s(in Person|on his own behalf)\s/mi);
    // if(firstInitiationInPerson != undefined && firstInitiationInPerson != null && firstInitiationInPerson[2] != undefined)
    // {
    //     initiationAppearanceNames.push(firstInitiationInPerson[2].trim());
    // }
    const partyTypePattern = /(applicants?|appellants?|plaintiffs?)/i;
    const initiationAppearancePattern2 =  /([a-zA-Z0-9\u00C0-\u02AB\s'\(\),]*)\s(in Person.?|on (his|her) own behalf|for self)\s/mi;
    let result2 = data.match(initiationAppearancePattern2);
    if(result2 != undefined && result2 != null && result2.length > 0 && result2[1] != undefined && result2[2] != undefined)
    {
        const initiationAppearanceName = result2[1].trim();
        const suffix = result2[2].trim();
        const partyTypeName = initiationAppearanceName.match(partyTypePattern);
        if(partyTypeName == null || partyTypeName == undefined)
        {
            if(!initiationAppearanceName.includes("for respondent") && !initiationAppearanceNames.includes(initiationAppearanceName + " " + suffix))
                initiationAppearanceNames.push(initiationAppearanceName + " " + suffix);
        }
        else
        {
            if(!initiationAppearanceNames.includes(suffix))
                initiationAppearanceNames.push(suffix);
        }
    }


    
    return {
        initiationAppearanceNames
    }
}