const pdfjsLib = require("pdfjs-dist/build/pdf.js");

const characterReplaceMap = [
    ["‖", ""],
    ["…", ""],
    ["‘", "'"],
    ["’", "'"],
    ["“", '"'],
    ["”", '"'],
    ["", ""],
    ["﻿", ""],
];

const replaceText = (text) => {
    characterReplaceMap.forEach((mapItem) => {
        if (text.indexOf(mapItem[0]) !== -1) {
            text = text.replace(new RegExp(mapItem[0], "g"), mapItem[1]);
        }
    });

    return text;
};

const loadPage = async(pageNumber, state) => {
    const page = await state.doc.getPage(pageNumber);
    const textContent = await page.getTextContent();

    const textItems = textContent.items.map((t) => ({
        ...t,
        str: replaceText(t.str),
    }));
    
    // Add linebreaks
    let prev;
    
    state.caseText += textItems.map((i) => {
        
        let ret = "";
        if(prev && (prev.height == i.height && prev.transform[5] != i.transform[5])) {
            ret = "\n";
            
        }
        ret += i.str;
        
        prev = i;
        
        return ret;
        
    }).join("");
    
    /*
    if(prev) {
            if((prev.height == i.height && prev.transform[5] != i.transform[5])
                || (prev.height <= 7.3 && i.height < 6.5)) {
                ret = "\n";
                
            }
        }
        */
    
    // console.log(state.caseText);

    if (state.isValid) {

        for (let i = 0; i < textItems.length; i++) {
            const t = textItems[i];
            
            if (
                state.currentFootnote == t.str &&
                t.height < 6.5 &&
                !state.footnotes[state.currentFootnote]
            ) {
                let searchAhead = 1;
                let currentFootnoteFinished = false;
                let currentFootnoteText = t.str;

                while (!currentFootnoteFinished) {
                    var currentSearchAhead = textItems[i + searchAhead];
                    if (
                        currentSearchAhead &&
                        currentSearchAhead.str == state.currentFootnote + 1 &&
                        currentSearchAhead.height <= 7.3
                    ) {
                        currentFootnoteFinished = true;
                    }
                    else if (currentSearchAhead) {
                        currentFootnoteText += currentSearchAhead.str;
                        searchAhead++;
                    }
                    else {
                        currentFootnoteFinished = true;
                    }
                }

                state.footnotes[
                    t.transform.join("") + "_" + state.currentFootnote
                ] = currentFootnoteText.trim();

                if (state.currentFootnote != Object.keys(state.footnotes).length) {
                    state.isValid = false;
                    break;
                }

                state.currentFootnote++;
            }
        }

        if (state.isValid) {
            const footnotesArr = Object.keys(state.footnotes);

            for (let i = 0; i < footnotesArr.length; i++) {
                let currentNumber = footnotesArr[i].split("_")[1];

                for (let x = 0; x < textItems.length; x++) {
                    const t = textItems[x];

                    if (
                        currentNumber == t.str &&
                        t.height <= 8.7 &&
                        !state.footnotes[t.transform.join("") + "_" + currentNumber] // Not mixing with contexts
                    ) {
                        // const footnoteContext = textItems
                        //     .slice(x - 5, x + 1)
                        //     .map((t) => t.str)
                        //     .join("")
                        //     .trim();
                        // state.footnoteContexts.push(
                        //     footnoteContext.slice(footnoteContext.length - 10)
                        // );
                        
                        //Finding #1 in 3967474d-f0d5-4b16-beca-719d6481f52b.pdf
                        //The below code purpose is to get a few characters before the footnote value.
                        //In this code, it will take total 10 characters which is "the footnote context number + the remaining characters before it".
                        //The below code is implemented due to the finding in page 20 for footnote context number 24, array index 23.
                        //The initial code (commented above) will save the footnote context number 24 as empty value in array index 23 due to passing negative value to slice method.
                        //To not save it as empty value, the below code will loop the array (extracted from pdf.js) backward from every footnote context found.
                        //It will loop backward until "the footnote context number + the remaining characters before it" has a minimal of 10 characters OR until the backward loop ends
                        //For footnote context number 24, it will be saved as "a trust.24" instead of empty string.
                        let expectedFootnoteContextLength = 10;
                        let backwardDataIndex = x;
                        let footnoteContextTempContent = [];
                        let footnoteContextContent = ""
                        let footnoteContextContentLength = 0;
                        do
                        {
                            //If the str value is a space, the below code will include it. 
                            //This is because some index in the array has only space value.
                            footnoteContextTempContent.push(textItems[backwardDataIndex].str);
                            footnoteContextContentLength += textItems[backwardDataIndex].str.length;
                            if(footnoteContextContentLength >= expectedFootnoteContextLength)
                            {
                                break;
                            }
                            else
                            {
                                backwardDataIndex--;
                            }
                        }while(backwardDataIndex > 0)

                        footnoteContextContent = footnoteContextTempContent.reverse().join('');

                        //Finding #2 in 3967474d-f0d5-4b16-beca-719d6481f52b.pdf
                        //In page number 37, "the footnote context number 84 + the total characters before it" is equal to less than 10.
                        //This results in passing the the negative value to the slice method. This will make array index 83 value become "84"
                        //When validating footnote context number 84, there is a statement like "[84] Although Mr Clayton......" in page 20 which can make the isValid false. 
                        //The below code is to take all footnote context characters when the the footnote context characters has less than 10 characters.
                        let sliceStringIndex = footnoteContextContentLength - expectedFootnoteContextLength;
                        if(sliceStringIndex < 0)
                        {
                            state.footnoteContexts.push(
                                footnoteContextContent.slice(0)
                            );
                        }
                        else
                        {
                            state.footnoteContexts.push(
                                footnoteContextContent.slice(sliceStringIndex)
                            );
                        }
                    }
                }
            }
        }

        if (Object.keys(state.footnotes).length != state.footnoteContexts.length) {
            state.isValid = false;
        }

        // Validate that all footnote contexts are there
        if (state.isValid && state.footnoteContexts.length > 0) {
            let currentIndex = -1;
            for (let f = 0; f < state.footnoteContexts.length; f++) {
                const searchIndex = state.caseText.indexOf(state.footnoteContexts[f]);
                if (
                    searchIndex != -1 &&
                    state.footnoteContexts[f].endsWith(f + 1) &&
                    searchIndex > currentIndex
                ) {
                    currentIndex = searchIndex;
                }
                else {
                    state.isValid = false;
                    break;
                }
            }
        }

    }

    return state;
};

const processPDF = async(pdfURL) => {
    const loadingTask = pdfjsLib.getDocument(pdfURL);
    const doc = await loadingTask.promise;
    const numPages = doc.numPages;

    const state = {
        doc,
        caseText: "",
        currentFootnote: 1,
        footnoteContexts: [],
        footnotes: {},
        isValid: true,
    };

    for (let i = 0; i < numPages; i++) {
        await loadPage(i + 1, state);
    }

    // Finalise return

    const ret = {
        isValid: state.isValid,
        caseText: state.caseText,
        footnoteContexts: state.footnoteContexts,
        footnotes: Object.values(state.footnotes),
    };

    return ret;
};

exports.processPDF = processPDF;
exports.replaceText = replaceText;