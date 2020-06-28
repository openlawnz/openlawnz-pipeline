const { parse2, parse4, parse5, mergeData, parseAppearance1} = require("./parseUtility.js");
module.exports = (data) =>
{
    let responseAppearanceNames = [];

    //2004-2005 case files
    const responseAppearancePattern3 = [
        {
            item: [
                {
                    pattern:/(on (his|her) own behalf|counsel for appellant.?|in person.?|for Appellant.?|for self)\s([a-zA-Z0-9\u00C0-\u02AB\s'\(\),.-]*)\s(for Respondent|for First Respondent|for the Respondent)/mi,
                    patternResultIndex : 3
                },
                {
                    pattern:/(for Appellant.?)(\s)([a-zA-Z0-9\u00C0-\u02AB\s'\(\),.-]*)(, Respondent, in person.)/mi,
                    patternResultIndex : 3
                },
                {
                    pattern:/(for Appellant.?)(\s)([a-zA-Z0-9\u00C0-\u02AB\s'\(\),.-]*)/mi,
                    patternResultIndex : 3
                },
                {
                    pattern:/(for the App?ellant.?)\s([a-zA-Z0-9\u00C0-\u02AB\s'\(\),.-]*)\s(for the Respondent)/mi,
                    patternResultIndex : 2
                }
            ]
            ///(on his own behalf|counsel for appellant.?|in person.?|for Appellant.?)\s([a-zA-Z0-9\u00C0-\u02AB\s'\(\),.-]*)\sfor Respondent/mi
        },
        {
            item: [
            {
                pattern:/(First Respondent)\s([a-zA-Z0-9\u00C0-\u02AB\s'\(\),.-]*)\s(for Second Respondent)/mi,
                patternResultIndex : 2
            }]
        }
    ];
    let result3 = parse5(data, responseAppearancePattern3);
    const responseAppearancePattern3Custom1 = /([a-zA-Z0-9\u00C0-\u02AB\s'\(\),.]*)(,\scounsel|, Advocate|-\scounsel|-\ssolicitor)/mi;
    const reservedDescription = [" of Christchurch", ", solicitor, Legal Services"];
    let result4 = parseAppearance1(result3, responseAppearancePattern3Custom1, 1, reservedDescription);
    for(var i = 0; i < result4.length; i++)
    {
        if(result4[i].includes("\n"))
        {
            var output4 = parse2(result4[i], /([a-zA-Z0-9\u00C0-\u02AB\s'\(\),.-]*)[\n]([a-zA-Z0-9\u00C0-\u02AB\s'\(\),.-]*)/mi, 2);
            if(output4 !== "" && !responseAppearanceNames.includes(output4))
            {
                if(output4.endsWith(","))
                {
                    responseAppearanceNames.push(output4.substring(0, output4.length - 1));
                }
                else
                {
                    responseAppearanceNames.push(output4);
                }
            }
        }
        else
        {
            if(!responseAppearanceNames.includes(result4[i]))
            {
                responseAppearanceNames.push(result4[i])
            }
        }
    }

    //special logic, need further refactor for acc_1110153600000_2005NZACC68.pdf.txt
    if(responseAppearanceNames.length == 0)
    {
        const responseAppearancePattern4 = [
            /([a-zA-Z0-9\u00C0-\u02AB\s'\(\),.-]*)\s(Counsel for respondent)\n/mi
        ];
        const result4 = parse4(data, responseAppearancePattern4, 1);
        mergeData(responseAppearanceNames, result4);
    }
    return {
        responseAppearanceNames
    }
}