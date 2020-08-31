const { parse2, parse4, mergeData, parseAppearance1, parseSeparator } = require("./parseUtility.js");
module.exports = (data) =>
{
    let initiationAppearanceNames = [];
    
    //acc_1110153600000_2005NZACC68.pdf.txt
    const initiationAppearancePattern3 = [
        /(for respondent)\s([a-zA-Z0-9\u00C0-\u02AB\s'\(\),.-]*)\s(by or)?\s(for appellant)/mi
    ];
    const result1 = parse4(data, initiationAppearancePattern3, 2);
    mergeData(initiationAppearanceNames, result1);

    if(result1.length == 0)
    {
        //Get the first appearance name
        const initiationAppearancePattern1 = /([a-zA-Z0-9\u00C0-\u02AB\s'\(\),.-–-]*)( for (the )?app?ellant.?)/mi;
        let result1Custom1 = parse2(data, initiationAppearancePattern1, 1);
        const initiationAppearancePattern1Custom1 = /([a-zA-Z0-9\u00C0-\u02AB\s'\(\),.-–-]*)(\scounsel|\sAdvocate)/mi
        const reservedDescription = [", Barrister of Auckland"];
        let result1Custom2 = parseAppearance1([result1Custom1], initiationAppearancePattern1Custom1, 1, reservedDescription);
        var separators = [
            {
                firstSeparator: ["for appellant"],
                firstSeparatorType: 1,
                secondSeparator: [" and "],
                secondSeparatorType: 1 // contain
            },
            {
                firstSeparator: [" and "],
                firstSeparatorType: 1,
                secondSeparator: [","," -"],
                secondSeparatorType: 3
            },
            {
                firstSeparator: [",", " –"],
                firstSeparatorType: 3 // endsWith
            },
            {
                firstSeparator: [" appeared"],
                firstSeparatorType: 3 // endsWith
            },
            {
                firstSeparator: [" as"],
                firstSeparatorType: 3 // endsWith
            },
            {
                firstSeparator: [" -"],
                firstSeparatorType: 3 // endsWith
            }
        ];
        var result1Custom3 = parseSeparator(result1Custom2, separators);
        mergeData(initiationAppearanceNames, result1Custom3);
    }

    const partyTypePattern = /(applicants?|appellants?|plaintiffs?)/i;
    const initiationAppearancePattern2 =  /([a-zA-Z0-9\u00C0-\u02AB\s'\(\),]*)\s(in Person.?|on (his|her) own behalf|for self)\s/mi;
    let result2 = data.match(initiationAppearancePattern2);
    if(result2 != undefined && result2 != null && result2.length > 0 && result2[1] != undefined && result2[2] != undefined)
    {
        let initiationAppearanceName = result2[1].trim();
        const suffix = result2[2].trim();
        const partyTypeName = initiationAppearanceName.match(partyTypePattern);
        if(partyTypeName == null || partyTypeName == undefined)
        {
            //Cannot recall below code used on which file so become untidy. due to time limit
            // if(!initiationAppearanceName.includes("for respondent") && !initiationAppearanceNames.includes(initiationAppearanceName + " " + suffix))
            //     initiationAppearanceNames.push(initiationAppearanceName + " " + suffix);
            const reservedDescription = [" appears", " appeared", " and her husband"];
            var hasReservedDescription = false;
            for(var i = 0; i < reservedDescription.length; i++)
            {
                if(initiationAppearanceName.endsWith(reservedDescription[i]))
                {
                    initiationAppearanceName = initiationAppearanceName.replace(reservedDescription[i], "");
                    if(!initiationAppearanceNames.includes(initiationAppearanceName))
                        initiationAppearanceNames.push(initiationAppearanceName);
                    hasReservedDescription = true;
                    i = reservedDescription.length + 1;
                }
            }

            if(!hasReservedDescription)
            {
                if(!initiationAppearanceNames.includes(initiationAppearanceName))
                    initiationAppearanceNames.push(initiationAppearanceName);
            }
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