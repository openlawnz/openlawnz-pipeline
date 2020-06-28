module.exports = (data, judgeTitles) =>
{
    //2004-2005 data
    const justicePattern2 = {
        // DecisionJudge:/DECISION OF JUDGE ([a-zA-Z0-9\u00C0-\u02AB ']*)\s/,
        // ReservedJudgementJudge:/RESERVED JUDGMENT OF JUDGE ([a-zA-Z0-9\u00C0-\u02AB ']*)\s/,
        JudgmentJudge:/(DECI?SION |JUDGMENT |DECISION ON APPLICATION FOR LEAVE TO APPEAL\s|RECALL OF JUDGMENT AND DIRECTIONS\s|RULING |DIRECTIONS ORDER |CONSENT ORDER |DECISION AS TO LEAVE TO APPEAL |DECISION AS TO STRIKE OUT |STRIKE OUT ORDER )(OF |BY )JUDGE ([a-zA-Z0-9\u00C0-\u02AB '.]*)\s/,
    }
    for (var key in justicePattern2) {
        var output2 = data.match(justicePattern2[key]);
        if(output2 != null && output2[3] != undefined)
        {
            var output2Value = output2[3].trim();
            const justicePattern2Custom1 = /([a-zA-Z0-9\u00C0-\u02AB '.]*)\s('?ON |AS |STRKING )/;
            var output2Custom1 = output2Value.match(justicePattern2Custom1)
            if(output2Custom1 != null && output2Custom1[1] != undefined)
            {
                return { value: [output2Custom1[1].trim()], valueIndex: output2.index };
            }
            else
            {
                if(output2Value.endsWith(" ON"))
                {
                    return { value: [output2Value.split(" ON")[0]], valueIndex: output2.index };
                }
                return { value: [output2Value], valueIndex: output2.index };
            }
        }
    }
}