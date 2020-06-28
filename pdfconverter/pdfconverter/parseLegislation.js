/*------------------------------
 Helpers
------------------------------*/
// If legisation name has special characters in it
RegExp.escape = function(s) {
    return s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
};

String.prototype.matchAll = function(regexp) {
    var matches = [];
    this.replace(regexp, function() {
        var arr = [].slice.call(arguments, 0);
        var extras = arr.splice(-2);
        arr.index = extras[0];
        arr.input = extras[1];
        matches.push(arr);
    });
    return matches.length ? matches : null;
};

/**
 * Find all legislation title indices in case text
 * @param {string} legislationTitle
 * @param {string} caseText
 */
const findLegislationTitleIndicesInCaseText = (legislationTitle, caseText) => {
    const search = new RegExp(RegExp.escape(legislationTitle), 'gi');
    return caseText.matchAll(search);
};

/**
 * Check to see if there's a legislation name, followed by a space then round brackets
 * e.g. Care of Children Act 2004 (the Act) or (CCA)
 * @param {string} legislationTitle
 * @param {string} caseText
 */
const findLegislationDefinedTermsInCaseText = (legislationTitle, caseText) => {
    const search = new RegExp(
        // `${RegExp.escape(legislationTitle)} \\((the\\s)?(.*?)\\)`,
        `${RegExp.escape(legislationTitle)} \\((?:“|'|')?((the\\s)?(.*?))(?:”|'|')?\\)`,
        'gi'
    );
    return caseText.matchAll(search);
};

/**
 * Find all defined term indices in case text
 * @param {string} definedTerm
 * @param {string} caseText
 */
const findDefinedTermIndicesInCaseText = (definedTerm, caseText) => {
    const search = new RegExp(RegExp.escape(definedTerm), 'gi');
    return caseText.matchAll(search);
};

/**
 * Find legislation at index
 * @param {number} index
 * @param {Array} legisationReferences
 */
const findLegislationAtIndex = (index, legisationReferences) => {
    return legisationReferences.find((legislationReference) =>
        legislationReference.indexesInCase.find((indexInCase) => indexInCase === index)
    );
};

/**
 * Find legislation at index with missing year
 * @param {number} index
 * @param {Array} legisationReferences
 */
const findLegislationMissingYearAtIndex = (index, legisationReferences) => {
    return legisationReferences.find((legislationReference) =>
        legislationReference.indexesMissingYear.find((indexesMissingYear) => indexesMissingYear === index)
    );
};

/**
 * Find legislation by id
 * @param {number} id
 * @param {Array} legisationReferences
 */
const findLegislationById = (id, legisationReferences) => {
    return legisationReferences.find((legislationReference) => legislationReference.id === id);
};

/**
 * Find definedTerm at index
 * @param {number} index
 * @param {Array} definedTerms
 */
const findDefinedTermAtIndex = (index, definedTerms) => {
    return definedTerms.find((definedTerm) => definedTerm.indexesInCase.find((indexInCase) => indexInCase === index));
};

/**
 * Whether a legislation title's words has a word at an index
 * @param {number} index
 * @param {string} word
 * @param {Array} legislationTitleWords
 */
const legislationTitleHasWordAtWordIndex = (index, word, legislationTitleWords) => {
    if (!legislationTitleWords[index]) {
        return false;
    }
    return word.includes(legislationTitleWords[index].toLowerCase());
};

/**
 * Iterates through the next few words until the "under" "of" or
 * "in" part of a section reference (or equivalent for non standard refs)
 * is encountered.
 * @param {number} offset
 * @param {number} oldi
 * @param {Array} legislation
 * @param {Array} caseWords
 */
const iterateThroughMultipleSections = (offset, oldi, legislation, caseWords) => {
    let j = 2;
    while (j < offset) {
        if (caseWords[oldi + j].match(/^[0-9]+/)) {
            legislation.sections.push(caseWords[oldi + j]);
        }
        j++;
    }
};

const findAndAssociateTextWithLegislation = (text, legislationReferences, currentLegislation) => {
    // Go through all case text
    // If find section, find its associated legislation
    // If footnote, run nested function, passing in current legislation
    // Footnote can change its current legislation, but that's just references to the global legislation dictionary
    let MAX_LEGISLATION_TITLE_WORDS_LENGTH = -1;
    let definedTermReferences = [];

    // Find legislation title indices and populate definedTerms mentioned
    legislationReferences.forEach((legislation) => {
        // Set max legislation title length. This will be used when doing a forward search later in the code
        MAX_LEGISLATION_TITLE_WORDS_LENGTH = Math.max(
            MAX_LEGISLATION_TITLE_WORDS_LENGTH,
            legislation.legislationTitleWords.length
        );

        const foundTitleIndices = findLegislationTitleIndicesInCaseText(legislation.title, text);
        if (foundTitleIndices) {
            foundTitleIndices.forEach((found) => {
                legislation.indexesInCase.push(found.index);
            });

            // If this legislation is referenced, treat all following references
            // for a legislation with this title but no year as referring to this
            const foundMissingYear = findLegislationTitleIndicesInCaseText(
                legislation.title.substring(0, legislation.title.indexOf(legislation.title.match(/\s[0-9]+/))),
                text
            );

            if (foundMissingYear) {
                foundMissingYear.forEach((missing) => {
                    if (!legislation.indexesInCase.includes(missing.index)) {
                        legislation.indexesMissingYear.push(missing.index);
                    }
                });
            }
        }

        const foundDefinedTerms = findLegislationDefinedTermsInCaseText(legislation.title, text);

        if (foundDefinedTerms) {
            foundDefinedTerms.forEach((found) => {
                definedTermReferences.push({
                    legislationId: legislation.id,
                    name: found[1].trim().replace(/'|"/g, ''),
                    indexesInCase: [],
                    sections: []
                });
            });
        }
    });

    // Find definedTerms indices
    definedTermReferences.forEach((term) => {
        const foundDefinedTermIndices = findDefinedTermIndicesInCaseText(term.name, text);
        if (foundDefinedTermIndices) {
            foundDefinedTermIndices.forEach((found) => {
                term.indexesInCase.push(found.index);
            });
        }
    });

    const caseWords = text.split(/\s/);

    let wordIndices = [];
    let currentIndex = 0;
    for (let i = 0; i < caseWords.length; i++) {
        wordIndices[i] = currentIndex;
        currentIndex += caseWords[i].length + 1;
    }

    for (let i = 0; i < caseWords.length; i++) {
        const word = caseWords[i].toLowerCase();
        const nextWord = caseWords[i + 1];

        let singleSection = false;
        let multiSection = false;
        // i needs to be retained for multiple section checking
        let oldi = i;
        let offset = 2;

        // Find the right legislation at aggregate word index
        const currentLegislationCheck = findLegislationAtIndex(wordIndices[i], legislationReferences);

        if (currentLegislationCheck) {
            currentLegislation = currentLegislationCheck;
        }
        else {
            const currentDefinedTermCheck = findDefinedTermAtIndex(wordIndices[i], legislationReferences);
            if (currentDefinedTermCheck) {
                currentLegislation = findLegislationById(currentDefinedTermCheck.legislationId, legislationReferences);
            }
        }

        if (
            ((word === 's' || word === 'section' || word === 'ss' || word === 'sections') &&
                (nextWord && nextWord.match(/[0-9]+/))) ||
            // catch cases with no space between s and number e.g s47 instead of s 47
            (nextWord && nextWord.match(/^s[0-9]+/))
        ) {
            singleSection = true;

            // Check if there are multiple sections being referenced, and
            // find the point where the list ends
            while (
                i + offset < caseWords.length &&
                (caseWords[i + offset].match(/[0-9]+/) ||
                    caseWords[i + offset] === 'and' ||
                    caseWords[i + offset] === 'to' ||
                    caseWords[i + offset] === '-') &&
                !caseWords[i + offset - 1].match(/\.$/) // terminate if word ends on full stop (won't terminate on subsection period)
            ) {
                multiSection = true;
                singleSection = false;
                offset++;
            }
        }

        /*
        Match:
        - s 57
        - section 57
        */
        if (singleSection || multiSection) {
            /*
            		Check if it's got "under the" or "of the" following it, then it's not related
            		to the current legislation. Instead put it in the following act name / legislation
            		- s 57 of the
            		- section 57 under the <Legislation Title>
            		*/
            if (
                (caseWords[i + offset] === 'under' ||
                    caseWords[i + offset] === 'of' ||
                    caseWords[i + offset] === 'in') &&
                caseWords[i + offset + 1] === 'the'
            ) {
                // Check if the index matches that of a missing year index
                const checkForMissingYear = findLegislationMissingYearAtIndex(
                    wordIndices[i + offset + 2],
                    legislationReferences
                );

                // First test for definedTerms --- changed to search by index to account for multi-word terms
                var foundDefinedTerm = findDefinedTermAtIndex(wordIndices[i + offset + 2], definedTermReferences);

                // Handles edge case where definedTerm is "the <definedTerm>" eg "the act", so first word includes "the"
                if (!foundDefinedTerm) {
                    foundDefinedTerm = findDefinedTermAtIndex(wordIndices[i + offset + 1], definedTermReferences);
                }

                if (foundDefinedTerm) {
                    const associatedLegislation = findLegislationById(
                        foundDefinedTerm.legislationId,
                        legislationReferences
                    );
                    associatedLegislation.sections.push(nextWord);
                    // If multiple sections, iterate through each one
                    if (multiSection) {
                        iterateThroughMultipleSections(offset, oldi, associatedLegislation, caseWords);
                    }
                    i += 1;

                    currentLegislation = associatedLegislation;

                    // Missing year legislation check
                }
                else if (checkForMissingYear) {
                    checkForMissingYear.sections.push(nextWord);
                    // If multiple sections, iterate through each one
                    if (multiSection) {
                        iterateThroughMultipleSections(offset, oldi, checkForMissingYear, caseWords);
                    }

                    currentLegislation = checkForMissingYear;
                }
                else {
                    // Find the following legislation
                    let subsequentLegislationReference;
                    let startWordIndex = i + offset + 2;
                    let currentTestWordIndex = 0;
                    let maxLegislationTitleLengthFinish = MAX_LEGISLATION_TITLE_WORDS_LENGTH;
                    let allLegislationTitlesAndId = [...legislationReferences].map((legislation) => {
                        return {
                            id: legislation.id,
                            legislationTitleWords: legislation.legislationTitleWords
                        };
                    });
                    while (!subsequentLegislationReference &&
                        currentTestWordIndex !== maxLegislationTitleLengthFinish &&
                        startWordIndex !== caseWords.length
                    ) {
                        // Progressively filter all legislation titles that have the aggregate of words in its title
                        let testWord;

                        try {
                            testWord = caseWords[startWordIndex].toLowerCase();
                        }
                        catch (ex) {
                            console.log(ex);
                            break;
                        }
                        allLegislationTitlesAndId = allLegislationTitlesAndId.filter((legislation) =>
                            legislationTitleHasWordAtWordIndex(
                                currentTestWordIndex,
                                testWord,
                                legislation.legislationTitleWords
                            )
                        );

                        if (allLegislationTitlesAndId.length === 1) {
                            subsequentLegislationReference = findLegislationById(
                                allLegislationTitlesAndId[0].id,
                                legislationReferences
                            );
                        }
                        startWordIndex++;
                        currentTestWordIndex++;
                    }
                    // Set i to be the current wordlookahead
                    i = startWordIndex;

                    if (subsequentLegislationReference) {
                        subsequentLegislationReference.sections.push(nextWord);

                        // If multiple sections, iterate through each one
                        if (multiSection) {
                            iterateThroughMultipleSections(offset, oldi, subsequentLegislationReference, caseWords);
                        }
                        // Update current legislation (or block current legislation)

                        currentLegislation = subsequentLegislationReference;
                    }
                }
            }
            else {
                if (currentLegislation) {
                    currentLegislation.sections.push(nextWord);
                    // If multiple sections, iterate through each one
                    if (multiSection) {
                        iterateThroughMultipleSections(offset, oldi, currentLegislation, caseWords);
                    }
                }
            }
        }
    }
};

function flattenDeep(arr1) {
    return arr1.reduce((acc, val) => (Array.isArray(val) ? acc.concat(flattenDeep(val)) : acc.concat(val)), []);
}

const processCase = (legalCase, legislations) => {
    let extractionConfidence = 0;
    let uniqueLegislations = [];
    let allLegislations = legislations.slice(0);

    allLegislations.forEach((legislation) => {
        if (!uniqueLegislations.some((l) => l.title == legislation.title)) {
            uniqueLegislations.push(legislation);
        }
    });

    let legislationReferences = uniqueLegislations.map((legislation) => {
        return {
            indexesInCase: [],
            indexesMissingYear: [],
            sections: [],
            legislationTitleWords: legislation.title.split(/\s/),
            ...legislation
        };
    });

    let case_text = legalCase.caseText;
    const footnotes = legalCase.footnoteContexts;
    const footnoteContexts = legalCase.footnotes;

    if (footnotes.length && legalCase.isValid) {
        // Remove footnotes from case
        try {
            footnotes.forEach((f) => {
                let matchStr = RegExp.escape(f.trim()).replace(/\s+/g, '\\s+');
                case_text = case_text.replace(new RegExp(matchStr), '');
            });

            extractionConfidence = 1;
        }
        catch (ex) {
            console.log('Footnotes do not exist in text');
            console.log(ex);
        }
    }

    findAndAssociateTextWithLegislation(case_text, legislationReferences);

    const allLegislationReferenceIndexes = flattenDeep(
        legislationReferences
        .filter((b) => b.indexesInCase.length > 0 || b.indexesMissingYear.length > 0)
        .map((b) => [b.indexesInCase, b.indexesMissingYear])
    ).sort();

    if (footnotes.length === 0 && footnoteContexts.length === 0) {
        extractionConfidence = 2;
    }
    else if (footnoteContexts.length > 0 && legalCase.isValid) {
        try {
            footnoteContexts.forEach((f, fi) => {
                const footnoteContextIndex = case_text.match(RegExp.escape(f)).index + f.length;

                // Look through the legislation references and find the closest to get the start
                let foundCurrentLegislationIndex = null;
                // current running total
                let aggregateIndex = 0;
                for (var i = 0; i < allLegislationReferenceIndexes.length; i++) {
                    aggregateIndex += allLegislationReferenceIndexes[i];
                    if (footnoteContextIndex > aggregateIndex) {
                        foundCurrentLegislationIndex = allLegislationReferenceIndexes[i];
                        break;
                    }
                }
                const foundLegislation =
                    foundCurrentLegislationIndex !== null ?
                    findLegislationAtIndex(foundCurrentLegislationIndex, legislationReferences) ||
                    findLegislationMissingYearAtIndex(foundCurrentLegislationIndex, legislationReferences) :
                    null;
                //console.log(foundLegislation)
                //console.log("associate", foundLegislation, footnotes[fi]);
                findAndAssociateTextWithLegislation(footnotes[fi], legislationReferences, foundLegislation);
            });

            extractionConfidence = 2;
        }
        catch (ex) {
            console.log(JSON.stringify(legalCase, null, 4) + '\n' + ex, false, 'footnoteserror-' + legalCase.id);
        }
    }

    legislationReferences = legislationReferences.filter(
        (legislationReference) => legislationReference.sections.length > 0
    );

    if (legislationReferences.length > 0) {
        legislationReferences = legislationReferences.map((legislationReference) => {
            legislationReference.groupedSections = {};
            legislationReference.sections = legislationReference.sections
                .map((section) => {
                    if (section.endsWith('))')) {
                        section = section.substring(0, section.length - 1);
                    }
                    section = section.split('.')[0];
                    return section
                        .replace(/(~|`|!|@|#|$|%|^|&|\*|{|}|\[|\]|;|:|"|'|<|,|>|\?|\/|\\|\||-|_|\+|=)/g, '')
                        .replace(/(s|s\s+)(\d+)/gi, '$2');
                })
                .forEach((section) => {
                    const [full, mainSection, subSection] = new RegExp(/(\d+)(\(.*\))/gi).exec(section) || [];

                    // if (mainSection) {
                    // 	if (!legislationReference.groupedSections[mainSection]) {
                    // 		legislationReference.groupedSections[mainSection] = {
                    // 			id: mainSection,
                    // 			count: 0
                    // 		};
                    // 	}

                    // 	legislationReference.groupedSections[mainSection].count++;
                    // }

                    if (!legislationReference.groupedSections[section]) {
                        legislationReference.groupedSections[section] = {
                            id: section,
                            count: 0
                        };
                    }

                    legislationReference.groupedSections[section].count++;
                });
            return legislationReference;
        });
    }

    return {
        extractionConfidence,
        legislationReferences
    };
};


module.exports = (legislation, jsonData) => {

    const { legislationReferences, extractionConfidence } = processCase(jsonData, legislation);

    if (legislationReferences && legislationReferences.length > 0) {

        jsonData.legislationReferences = {
            extractionConfidence,
            ...(jsonData.fileKey ? {caseId: jsonData.fileKey } : null),
            legislationReferences: legislationReferences.map(l => ({
                legislationId: l.id,
                groupedSections: l.groupedSections
            }))
        }

    }
    
    return jsonData;


};
