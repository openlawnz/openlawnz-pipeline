exports.parse = (data, pattern) =>
{
    for (var key in pattern) {
        for (var value in pattern[key]) {
            var temp = data.match(pattern[key][value]);
            if(temp)
            {
                return { value: [temp[1].trim()], valueIndex: temp.index };
            }
        }
    }

    return null;
}

function parse2(data, pattern, patternResultIndex)
{
    const output = data.match(pattern);
    if(output != undefined && output != null && output.length > 0 && output[patternResultIndex] != undefined)
    {
        return output[patternResultIndex].trim();
    }
    
    return "";
}
exports.parse2 = parse2;

exports.parse3 = (data, pattern, patternResultIndex) =>
{
    let result = [];
    for (let i = 0; i < pattern.length; i++) {
        let output;
        while ((output = pattern[i].exec(data)) !== null) {
            if(output != undefined && output.length > 0 && output[patternResultIndex] != undefined)
            {
                const outputValue = output[patternResultIndex].trim();
                if(!result.includes(outputValue))
                {
                    result.push(outputValue);
                }
            }
        }
    }

    return result;
}

exports.parse4 = (data, pattern, patternResultIndex) =>
{
    let result = [];
    for (let i = 0; i < pattern.length; i++) {
        let output = data.match(pattern[i]);
        if(output != undefined && output != null && output.length > 0 && output[patternResultIndex] != undefined)
        {
            const outputValue = output[patternResultIndex].trim();
            if(!result.includes(outputValue))
            {
                result.push(outputValue);
            }
        }
    }

    return result;
}

exports.parse5 = (data, patterns) =>
{
    let result = [];
    for (let i = 0; i < patterns.length; i++) {
        let patternObject = patterns[i];
        for (let j = 0; j < patternObject.pattern.length; j++) {
            let output = data.match(patternObject.pattern[j]);
            if(output != undefined && output != null && output.length > 0 && output[patternObject.patternResultIndex] != undefined)
            {
                const outputValue = output[patternObject.patternResultIndex].trim();
                if(!result.includes(outputValue))
                {
                    result.push(outputValue);
                    j = patternObject.length + 1;
                }
            }
        }
    }
    
    return result;
}

exports.parse5 = (data, patterns) =>
{
    let result = [];
    for (let i = 0; i < patterns.length; i++) {
        let patternObject = patterns[i].item;
        for (let j = 0; j < patternObject.length; j++) {
            let output = data.match(patternObject[j].pattern);
            if(output != undefined && output != null && output.length > 0 && output[patternObject[j].patternResultIndex] != undefined)
            {
                const outputValue = output[patternObject[j].patternResultIndex].trim();
                if(!result.includes(outputValue))
                {
                    result.push(outputValue);
                    j = patternObject.length + 1;
                }
            }
        }
    }
    
    return result;
}

exports.parseAppearance1 = (data, pattern, patternIndex, reservedDescription) =>
{
    let result = [];
    for(var i = 0; i < data.length; i++)
    {
        let outputValue = parse2(data[i], pattern, patternIndex);
        if(outputValue === "")
        {
            for(var j = 0; j < reservedDescription.length; j++)
            {
                if(data[i].endsWith(reservedDescription[j]))
                {
                    data[i] = data[i].replace(reservedDescription[j], "");
                }
            }
            if(data[i] != "" && !result.includes(data[i]))
                result.push(data[i]);
        }
        else
        {
            for(var j = 0; j < reservedDescription.length; j++)
            {
                if(outputValue.endsWith(reservedDescription[j]))
                {
                    outputValue = outputValue.replace(reservedDescription[j], "");
                }
            }
            if(data[i] != "" && !result.includes(outputValue))
                result.push(outputValue);
        }
    }
    return result;
}

exports.mergeData = (data1, data2) =>
{
    const data2Length = data2.length;
    for(let i = 0; i < data2Length; i++)
    {
        if(!data1.includes(data2[i]))
        {
            data1.push(data2[i]);
        }
    }   
}