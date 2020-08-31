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
    let perPageFootnote = [];

    if (textContent.items.length === 0) {
        // Could have diagrams jdo_1133136000000_80a28195-6190-4564-9f4b-5ac9c63b348c.pdf
        state.caseText += "";
    }
    else {

        const textItems = textContent.items.map((t) => ({
            ...t,
            str: replaceText(t.str),
        }));



        // Add linebreaks
        let prev;

        state.caseText += textItems.map((i) => {

            let ret = "";
            if (prev && (prev.height == i.height && prev.transform[5] != i.transform[5])) {
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

        if (state.isValid) {

            //finding #3 in jdo_1538136001000_0aa9cc09-d8ad-4ee8-b65e-6f182f75f5a6.pdf page 4
            //the footnote context number 2 has the same font height as footnote number 2.
            //Hence the below loop is to loop until it find the footnote index
            let textItemsLength = textItems.length;
            let footnoteStartIndex = 0;
            let j = 0;
            do {
                const tempValue = textItems[j];
                if (state.currentFootnote == tempValue.str &&
                    tempValue.height < 6.5 &&
                    !state.footnotes[state.currentFootnote]) {
                    footnoteStartIndex = j;
                }
                j++;
            } while (j < textItemsLength);
            //set the i value to start from footnoteStartIndex
            for (let i = footnoteStartIndex; i < textItemsLength; i++) {
                const t = textItems[i];
                if (state.currentFootnote == t.str &&
                    t.height < 6.5 &&
                    !state.footnotes[state.currentFootnote]) {
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
                    i = (i + searchAhead) - 1;
                    state.footnotes[
                        t.transform.join("") + "_" + state.currentFootnote
                        ] = currentFootnoteText.trim();
                    perPageFootnote.push(state.currentFootnote);
                    if (state.currentFootnote != Object.keys(state.footnotes).length) {
                        state.isValid = false;
                        break;
                    }

                    state.currentFootnote++;
                }
            }

            if (state.isValid) {

                const perPageFootnoteLength = perPageFootnote.length;
                for (let i = 0; i < perPageFootnoteLength; i++) {
                    let currentNumber = perPageFootnote[i];

                    for (let x = 0; x < textItems.length; x++) {
                        const t = textItems[x];

                        if (
                            currentNumber == t.str &&
                            t.height <= 8.7 &&
                            !state.footnotes[t.transform.join("") + "_" + currentNumber] // Not mixing with contexts
                            //Finding #4 in jdo_1539003601000_8fcba815-0f04-42e8-9162-8c42b8ce0020.pdf page 17
                            //It has square metre which is considered as footnote context number 2 although there is no footnote number 2 in this page
                            //Add this check to take only footnote context number which has its corresponding footnote in that page
                            //This is temporary solution because it still does not solve if the page has the square metre, footnote number 2, footnote context number 2
                            &&
                            perPageFootnote.includes(currentNumber)
                            //Finding #5 in jdo_1540990801000_4b296bdd-d3ff-4503-9ad8-eccdbbbf8c65.pdf page 19
                            //The footnote context number 58 has the same height as footnote number 58 so it will be included twice in footnote context which can cause the isValid to false.
                            //The below check is to make sure that it will only save the FIRST footnote found. It has a relation with Finding #4
                            &&
                            !state.footnotesContextNumbers.includes(currentNumber)
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
                            do {
                                //If the str value is a space, the below code will include it.
                                //This is because some index in the array has only space value.
                                footnoteContextTempContent.push(textItems[backwardDataIndex].str);
                                footnoteContextContentLength += textItems[backwardDataIndex].str.length;
                                if (footnoteContextContentLength >= expectedFootnoteContextLength) {
                                    break;
                                }
                                else {
                                    backwardDataIndex--;
                                }
                            } while (backwardDataIndex > 0)

                            footnoteContextContent = footnoteContextTempContent.reverse().join('');

                            //Finding #2 in 3967474d-f0d5-4b16-beca-719d6481f52b.pdf
                            //In page number 37, "the footnote context number 84 + the total characters before it" is equal to less than 10.
                            //This results in passing the the negative value to the slice method. This will make array index 83 value become "84"
                            //When validating footnote context number 84, there is a statement like "[84] Although Mr Clayton......" in page 20 which can make the isValid false.
                            //The below code is to take all footnote context characters when the the footnote context characters has less than 10 characters.
                            let sliceStringIndex = footnoteContextContentLength - expectedFootnoteContextLength;
                            if (sliceStringIndex < 0) {
                                state.footnoteContexts.push(
                                    footnoteContextContent.slice(0)
                                );
                            }
                            else {
                                state.footnoteContexts.push(
                                    footnoteContextContent.slice(sliceStringIndex)
                                );
                            }
                            state.footnotesContextNumbers.push(currentNumber);
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


    }

    return state;
};

const processPDF = async(pdfURL, jsonData) => {

    if (pdfURL.indexOf('govt.nz') !== -1 || pdfURL.indexOf('nzlii.org') !== -1) {

        throw new Error("Cannot use NZ Govt or NZlii URLs");

    }

    let doc;

    const loadingTask = pdfjsLib.getDocument(pdfURL);

    doc = await loadingTask.promise;

    const numPages = doc.numPages;

    const state = {
        doc,
        caseText: "",
        currentFootnote: 1,
        footnoteContexts: [],
        footnotes: {},
        footnotesContextNumbers: [],
        isValid: true,
    };

    for (let i = 0; i < numPages; i++) {
        await loadPage(i + 1, state);
    }

    jsonData.isValid = state.isValid;
    jsonData.caseText = state.caseText;
    jsonData.footnoteContexts = state.footnoteContexts;
    jsonData.footnotes = Object.values(state.footnotes);

};

exports.processPDF = processPDF;
exports.replaceText = replaceText;
