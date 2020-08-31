exports.parse = (data, pattern) => {
    for (var key in pattern) {
        for (var value in pattern[key]) {
            var temp = data.match(pattern[key][value]);
            if (temp) {
                return { value: [temp[1].trim()], valueIndex: temp.index };
            }
        }
    }

    return null;
}

function parse2(data, pattern, patternResultIndex) {
    const output = data.match(pattern);
    if (output != undefined && output != null && output.length > 0 && output[patternResultIndex] != undefined) {
        return output[patternResultIndex].trim();
    }

    return "";
}
exports.parse2 = parse2;

exports.parse3 = (data, pattern, patternResultIndex) => {
    let result = [];
    for (let i = 0; i < pattern.length; i++) {
        let output;
        while ((output = pattern[i].exec(data)) !== null) {
            if (output != undefined && output.length > 0 && output[patternResultIndex] != undefined) {
                const outputValue = output[patternResultIndex].trim();
                if (outputValue != "" && !result.includes(outputValue)) {
                    result.push(outputValue);
                }
            }
        }
    }

    return result;
}

exports.parse4 = (data, pattern, patternResultIndex) => {
    let result = [];
    for (let i = 0; i < pattern.length; i++) {
        let output = data.match(pattern[i]);
        if (output != undefined && output != null && output.length > 0 && output[patternResultIndex] != undefined) {
            const outputValue = output[patternResultIndex].trim();
            if (outputValue != "" && !result.includes(outputValue)) {
                result.push(outputValue);
            }
        }
    }

    return result;
}

exports.parse5 = (data, patterns) => {
    let result = [];
    for (let i = 0; i < patterns.length; i++) {
        let patternObject = patterns[i].item;
        for (let j = 0; j < patternObject.length; j++) {
            let output = data.match(patternObject[j].pattern);
            if (output != undefined && output != null && output.length > 0 && output[patternObject[j].patternResultIndex] != undefined) {
                const outputValue = output[patternObject[j].patternResultIndex].trim();
                if (outputValue != "" && !result.includes(outputValue)) {
                    result.push(outputValue);
                    j = patternObject.length + 1;
                }
            }
        }
    }

    return result;
}

exports.parse6 = (data, patterns) => {
    let result = "";
    for (let i = 0; i < patterns.length; i++) {
        let output = data.match(patterns[i].pattern);
        if (output != undefined && output != null && output.length > 0 && output[patterns[i].patternResultIndex] != undefined) {
            result = output[patterns[i].patternResultIndex].trim();
            i = patterns.length + 1;
        }
    }

    return result;
}

function parseNewLine(data) {
    let result = [];
    for (var dataCounter = 0; dataCounter < data.length; dataCounter++) {
        var dataTemp = data[dataCounter];
        if (dataTemp.includes("\n")) {
            dataTemp = parse2(dataTemp, /([a-zA-Z0-9\u00C0-\u02AB\s'\(\),.-]*)[\n]([a-zA-Z0-9\u00C0-\u02AB\s'\(\),.-]*)/mi, 2);
            result.push(dataTemp);
        }
        else {
            result.push(dataTemp);
        }
    }

    return result;
}

exports.parseSeparator = (data, separators) => {
    let result = [];
    let hasSeparator = false;
    let data1 = parseNewLine(data);
    for (var i = 0; i < separators.length; i++) {
        for (var dataCounter = 0; dataCounter < data1.length; dataCounter++) {
            if (hasSeparator) {
                break;
            }
            var dataTemp = data1[dataCounter];
            const separatorObject = separators[i];
            for (var separator1Counter = 0; separator1Counter < separatorObject.firstSeparator.length; separator1Counter++) {
                switch (separatorObject.firstSeparatorType) {
                case 1:
                    {
                        if (dataTemp.includes(separatorObject.firstSeparator[separator1Counter])) {
                            var firstData = dataTemp.split(separatorObject.firstSeparator[separator1Counter]);
                            for (var j = 0; j < firstData.length; j++) {
                                if (separatorObject.secondSeparator != undefined) {
                                    let hasSecondSeparator = false;
                                    for (var k = 0; k < separatorObject.secondSeparator.length; k++) {
                                        switch (separatorObject.secondSeparatorType) {
                                        case 1:
                                            {
                                                if (firstData[j].includes(separatorObject.secondSeparator[k])) {
                                                    var secondData = firstData[j].split(separatorObject.secondSeparator[k]);
                                                    for (var l = 0; l < secondData.length; l++) {
                                                        var value = secondData[l].trim();
                                                        if (!result.includes(value)) {
                                                            result.push(value);
                                                        }
                                                    }
                                                    hasSecondSeparator = true;
                                                    k = separatorObject.secondSeparator.length + 1;
                                                }
                                            }
                                            break;
                                        case 3:
                                            {
                                                if (firstData[j].endsWith(separatorObject.secondSeparator[k])) {
                                                    if (!result.includes(firstData[j].substring(0, firstData[j].length - separatorObject.secondSeparator[k].length))) {
                                                        result.push(firstData[j].substring(0, firstData[j].length - separatorObject.secondSeparator[k].length));
                                                    }
                                                    hasSecondSeparator = true;
                                                    k = separatorObject.secondSeparator.length + 1;
                                                }
                                            }
                                            break;
                                        }
                                    }

                                    if (!hasSecondSeparator) {
                                        var value = firstData[j].trim();
                                        if (!result.includes(value)) {
                                            result.push(value);
                                        }
                                    }
                                }
                                else {
                                    var value = firstData[j].trim();
                                    if (!result.includes(value)) {
                                        result.push(value);
                                    }
                                }
                            }

                            hasSeparator = true;
                            i = separators.length + 1;
                        }
                    }
                    break;
                case 3:
                    {
                        var value = dataTemp.trim();
                        if (value.endsWith(separatorObject.firstSeparator[separator1Counter])) {
                            if (!result.includes(value.substring(0, value.length - separatorObject.firstSeparator[separator1Counter].length))) {
                                result.push(value.substring(0, value.length - separatorObject.firstSeparator[separator1Counter].length));
                            }
                            hasSeparator = true;
                            i = separators.length + 1;
                        }
                    }
                    break;
                }
            }


        }
    }

    if (!hasSeparator) {
        for (var dataCounter = 0; dataCounter < data1.length; dataCounter++) {
            var value = data1[dataCounter].trim();
            if (value != "" && !result.includes(value)) {
                result.push(value);
            }
        }
    }

    return result;
}

exports.parseAppearance1 = (data, pattern, patternIndex, reservedDescription) => {
    let result = [];
    for (var i = 0; i < data.length; i++) {
        let outputValue = parse2(data[i], pattern, patternIndex);
        if (outputValue === "") {
            for (var j = 0; j < reservedDescription.length; j++) {
                if (data[i].endsWith(reservedDescription[j])) {
                    data[i] = data[i].replace(reservedDescription[j], "");
                }
            }
            if (data[i] != "" && !result.includes(data[i]))
                result.push(data[i]);
        }
        else {
            for (var j = 0; j < reservedDescription.length; j++) {
                if (outputValue.endsWith(reservedDescription[j])) {
                    outputValue = outputValue.replace(reservedDescription[j], "");
                }
            }
            if (data[i] != "" && !result.includes(outputValue))
                result.push(outputValue);
        }
    }
    return result;
}

exports.mergeData = (data1, data2) => {
    const data2Length = data2.length;
    for (let i = 0; i < data2Length; i++) {
        if (!data1.includes(data2[i])) {
            data1.push(data2[i]);
        }
    }
}

exports.truncateLongData = (data, maxLength) => {
    var i = data.length
    while (i--) {
        if (data[i].length > maxLength) {
            data.splice(i, 1);
        }
    }
}
