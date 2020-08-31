/* global expect */
const fs = require("fs");

const parseLegislation = require("../pdfconverter/parseLegislation");
const legislation = require("./generateDataTestFiles/legislation.json");


// const cases = [
//     [
//         "2015NZHC832.json",
//         "Returning zero results in case with no references",
//         undefined
//     ],
//     [
//         "1.json",
//         "Footnote References",
//             /*
//             ---------------------------------------------------
//             Footnote References
//             ---------------------------------------------------
//             Description:
//             Testing footnote logic - assigning main text references not impacted by footnote content
//             Expected results:
//             Section 17, insolvency-act-2006 ( x3 )
//             Section 310, gambling-act-2003
//             Section 18, unit-titles-act-2010
//     */
//         {
//             "extractionConfidence": 2,
//             "legislationReferences": [
//                 { "groupedSections": { "310": { "count": 1, "id": "310" } }, "legislationId": "gambling-act-2003" },
//                 { "groupedSections": { "17": { "count": 1, "id": "17" }, "17(1)(d)(ii)": { "count": 1, "id": "17(1)(d)(ii)" }, "17(7)": { "count": 1, "id": "17(7)" } }, "legislationId": "insolvency-act-2006" },
//                 { "groupedSections": { "18": { "count": 1, "id": "18" } }, "legislationId": "unit-titles-act-2010" }
//             ]

//         }
//     ],
//     [
//         "2.json",
//         "Basic References (full and explicit)",
//         /*
//             ---------------------------------------------------
//             Basic References
//             ---------------------------------------------------
//             Description:
//             Testing explicit, full references - that is, section and number followed by full definition of act with "of the", "in the" or "under the" between the two.
//             Sections can have numbers and letters, for example section 47A (which is a separate section from section 47). Brackets deliniate subsections, so regex should match on any numbers or letters up to the first white space or punctuation (period, bracket, comma etc)
//             Sections have subsections - section 58(2) is a part of section 58. For now, subsections can be ignored and effectively attached to the main section - so in that case, treat 58(2) as a reference to section 58.
//             Sections might be referred to as "section X" or "s X" or "sX"
//             (A later test covers multiple sections and ranges)
//             Expected results:
//             1. Section 5, protection-of-personal-and-property-rights-act-1988;
//             2. Section 57, evidence-act-2006 (ignore the .1 as it is a footnote)
//             3. Section 58, evidence-act-2006.
//             4. Section 47A, care-of-children-act-2004
//             ---------------------------------------------------
//         */
//         {
//             "legislationReferences": [
//                 { "groupedSections": { "5": { "count": 1, "id": "5" } }, "legislationId": "protection-of-personal-and-property-rights-act-1988" },
//                 { "groupedSections": { "57": { "count": 1, "id": "57" } }, "legislationId": "evidence-act-2006" },
//                 { "groupedSections": { "58(2)": { "count": 1, "id": "58(2)" } }, "legislationId": "evidence-act-2006" },
//                 { "groupedSections": { "47A": { "count": 1, "id": "47A" } }, "legislationId": "care-of-children-act-2004" }
//             ]
//         }]

// ]

let dataCache = {};

const getTestResult = (caseJSONFile) => {

    let caseJSON;

    if (dataCache[caseJSONFile]) {
        caseJSON = dataCache[caseJSONFile]
    }
    else {

        caseJSON = JSON.parse(fs.readFileSync(`./parseLegislationTestFiles/${caseJSONFile}.json`).toString());
        dataCache[caseJSONFile] = caseJSON;

    }

    parseLegislation(legislation, caseJSON);

    if (caseJSON.legislationReferences) {
        delete caseJSON.legislationReferences.caseId;
    }

    return caseJSON;
}




/*
---------------------------------------------------
Basic References
---------------------------------------------------
Description:
Testing explicit, full references - that is, section and number followed by full definition of act with "of the", "in the" or "under the" between the two.
Sections can have numbers and letters, for example section 47A (which is a separate section from section 47). Brackets deliniate subsections, so regex should match on any numbers or letters up to the first white space or punctuation (period, bracket, comma etc)
Sections have subsections - section 58(2) is a part of section 58. For now, subsections can be ignored and effectively attached to the main section - so in that case, treat 58(2) as a reference to section 58.
Sections might be referred to as "section X" or "s X" or "sX"
(A later test covers multiple sections and ranges)
Expected results:
1. Section 5, protection-of-personal-and-property-rights-act-1988;
2. Section 57, evidence-act-2006 (ignore the .1 as it is a footnote)
3. Section 58, evidence-act-2006.
4. Section 47A, care-of-children-act-2004
File Name: data/legislation/1-basic-references.txt
---------------------------------------------------
*/

describe('Full, basic references: "in the", under the", and "of the" with following full legislation title', () => {

    const results = getTestResult("1-basic-references");
    it("Should return 3 Acts", () => {

        expect(results.legislationReferences.legislationReferences).toHaveLength(3);

    });

    it("Should return protection-of-personal-and-property-rights-act-1988, evidence-act-2006, care-of-children-act-2004", () => {
        //console.log(JSON.stringify(results.legislationReferences.legislationReferences))
        expect(
            results.legislationReferences.legislationReferences.some(
                ref =>
                ref.legislationId ===
                "protection-of-personal-and-property-rights-act-1988"
            )
        ).toEqual(true);
        expect(results.legislationReferences.legislationReferences.some(ref => ref.legislationId === "evidence-act-2006")).toEqual(
            true
        );
        expect(
            results.legislationReferences.legislationReferences.some(ref => ref.legislationId === "care-of-children-act-2004")
        ).toEqual(true);

    });

    it("Should return section 5 of the PPPR Act, sections 57 and 58 of the Evidence Act, s47 of the Care of Children Act", () => {

        expect(
            results.legislationReferences.legislationReferences.some(
                ref =>
                ref.legislationId ===
                "protection-of-personal-and-property-rights-act-1988" &&
                Object.values(ref.groupedSections).some(
                    section => section.id == "5" && section.count === 1
                )
            )
        ).toEqual(true);

        expect(
            results.legislationReferences.legislationReferences.some(
                ref =>
                ref.legislationId === "care-of-children-act-2004" &&
                Object.values(ref.groupedSections).some(
                    section => section.id == "47a" && section.count === 1
                )
            )
        ).toEqual(true);

        expect(
            results.legislationReferences.legislationReferences.some(
                ref =>
                ref.legislationId === "evidence-act-2006" &&
                Object.values(ref.groupedSections).some(
                    section => section.id == "57" && section.count === 1
                ) &&
                Object.values(ref.groupedSections).some(
                    section => section.id == "58(2)" && section.count === 1
                )
            )
        ).toEqual(true);

    });
});

/*
---------------------------------------------------
"The Act"
---------------------------------------------------
Description:
Sometimes an Act is the only or the primary Act being discussed in a case. It is referred to as "the Act".
For example, the care-of-children-act-2004 (the Act); or care-of-children-act-2004 ("the Act").
Thereafter, "the Act" (without quotes) should trigger the same logic as the full Act title. So, section 15 of the Act is equivalent to section 15 of the care-of-children-act-2004.
Expected results:
Section 5 of the protection-of-personal-and-property-rights-act-1988
File Name: data/legislation/2-the-act.txt
---------------------------------------------------
*/

describe('Testing "the Act" definition', () => {

    const results = getTestResult("2-the-act");

    it("Should return section 5 of the protection-of-personal-and-property-rights-act-1988", () => {

        expect(
            results.legislationReferences.legislationReferences.some(
                ref =>
                ref.legislationId ===
                "protection-of-personal-and-property-rights-act-1988" &&
                Object.values(ref.groupedSections).some(
                    section => section.id == "5" && section.count === 1
                )
            )
        ).toEqual(true);

    });
});

/*
---------------------------------------------------
Defined terms
---------------------------------------------------
Description:
Sometimes an Act is given a shorthand descriptor other than "the Act".
For example, the care-of-children-act-2004 (COCA); or care-of-children-act-2004 ("COCA").
Thereafter, "COCA" (without quotes) should trigger the same logic as the full Act title. So, section 15 of the COCA is equivalent to section 15 of the care-of-children-act-2004.
Expected results:
Section 5 of the protection-of-personal-and-property-rights-act-1988 (explicit definition)
Section 6 of the protection-of-personal-and-property-rights-act-1988 (via defined term)
Section 48 of the care-of-children-act-2004
File Name: data/legislation/3-defined-term.txt
---------------------------------------------------
*/

describe("Testing defined terms", () => {

    const results = getTestResult("3-defined-term");

    it("Should return sections 5 and 6 of the Protection of Personal and Property Rights Act, and section 48 of care-of-children-act-2004", () => {

        expect(
            results.legislationReferences.legislationReferences.some(
                ref =>
                ref.legislationId ===
                "protection-of-personal-and-property-rights-act-1988" &&
                Object.values(ref.groupedSections).some(
                    section => section.id == "5" && section.count === 1
                ) &&
                Object.values(ref.groupedSections).some(
                    section => section.id == "6" && section.count === 1
                )
            )
        ).toEqual(true);
        expect(
            results.legislationReferences.legislationReferences.some(
                ref =>
                ref.legislationId === "care-of-children-act-2004" &&
                Object.values(ref.groupedSections).some(
                    section => section.id == "48" && section.count === 1
                )
            )
        ).toEqual(true);

    });
});

/*
---------------------------------------------------
Subsequent references
---------------------------------------------------
Description:
Sometimes a section is given after the Act name rather than before. For example, [act name], [section].
Expected results:
Section 12, evidence-act-2006
File Name: data/legislation/4-subsequent-reference.txt
---------------------------------------------------
*/

describe("Testing subsequent reference", () => {

    const results = getTestResult("4-subsequent-reference");

    it("Should return section 12 of the evidence-act-2006", () => {

        expect(
            results.legislationReferences.legislationReferences.some(
                ref =>
                ref.legislationId === "evidence-act-2006" &&
                Object.values(ref.groupedSections).some(
                    section => section.id == "12" && section.count === 1
                )
            )
        ).toEqual(true);

    });
});

/*
---------------------------------------------------
Subsequent references - defined term
---------------------------------------------------
Description:
A combination of test 2 and 4 - [the Act], [section] - rather than [section] of the Act
A combination of test 3 and 4 - [defined term], [section] - rather than [section] of the [defined term]
Expected results:
protection-of-personal-and-property-rights-act-1988, section 11.
care-of-children-act-2004, section 48.
File Name: data/legislation/5-subsequent-reference-defined.txt
---------------------------------------------------
*/

describe("Testing subsequent reference with defined terms", () => {

    const results = getTestResult("5-subsequent-reference-defined");

    it("Should return section 11 of the Protection of Personal and Property Rights Act and section 48 of the Care of Children Act", () => {

        expect(
            results.legislationReferences.legislationReferences.some(
                ref =>
                ref.legislationId === "care-of-children-act-2004" &&
                Object.values(ref.groupedSections).some(
                    section => section.id == "48" && section.count === 1
                )
            )
        ).toEqual(true);
        expect(
            results.legislationReferences.legislationReferences.some(
                ref =>
                ref.legislationId ===
                "protection-of-personal-and-property-rights-act-1988" &&
                Object.values(ref.groupedSections).some(
                    section => section.id == "11" && section.count === 1
                )
            )
        ).toEqual(true);

    });
});

/*
---------------------------------------------------
Delayed references - "backup option"
---------------------------------------------------
Description:
An Act might be mentioned well before a section. It might be mentioned at the start of a page, paragraph or sentence - in fact at any arbitrary number of characters prior to the section reference appearing. There needs to be a default / backup option for associating a section number with the relevant Act if it is not explicitly defined or immediately apparent.
The suggested approach is that if no higher priority tests are triggered, and an Act has been previously mentioned in the text, then that Act. Those higher priority tests would be:
1. Basic full references (test 1)
2. The Act / defined terms in the same logic (ie, section 5 of the [defined term]) (test 2 and 3)
3. Immediately subsequent references with or without defined term (test 4 and 5)
For example:
// A limit on jurisdiction appears in the protection-of-personal-and-property-rights-act-1988 although not until the end of part 1, at section 11(2).
This text should be parsed by discovering the Act name, and storing it somewhere until overriden by another Act name (or defined term) or higher priority section reference. When the parser reaches section 11(2), it should lookup the "current legislation name" variable to associate section 11 with the protection-of-personal-and-property-rights-act-1988.
Note: the "current legislation name" must be updated where an Act name appears but cannot be only via an exclusively sequential assessment. For example the above text might be followed by a basic reference, e.g:
// A limit on jurisdiction appears in the protection-of-personal-and-property-rights-act-1988 although not until the end of part 1, at section 11(2). Section 5 of the evidence-act-2006 ....
There, section 5 is "of the Evidence Act". That is a basic reference that should *not* trigger this test, but *should* update the "current legislation" variable for later references. For example:
// A limit on jurisdiction appears in the protection-of-personal-and-property-rights-act-1988 although not until the end of part 1, at section 11(2). Section 5 of the evidence-act-2006 is confusing. As is section 6.
Here, both section 11(2) and section 6 will be linked to whatever the "current legislation" variable is when those points are reached. Section 5 is a defined term.
Expected results:
protection-of-personal-and-property-rights-act-1988, section 11.
evidence-act-2006, Section 5
evidence-act-2006, Section 6
File Name: data/legislation/6-delayed-reference.txt
---------------------------------------------------
*/

describe("Testing delayed reference", () => {

    const results = getTestResult("6-delayed-reference");

    it("Should return section 11 of the Protection of Personal and Property Rights Act, and section 5 and 6 of the Evidence Act", () => {

        expect(
            results.legislationReferences.legislationReferences.some(
                ref =>
                ref.legislationId === "evidence-act-2006" &&
                Object.values(ref.groupedSections).some(
                    section => section.id == "5" && section.count === 1
                ) &&
                Object.values(ref.groupedSections).some(
                    section => section.id == "6" && section.count === 1
                )
            )
        ).toEqual(true);
        expect(
            results.legislationReferences.legislationReferences.some(
                ref =>
                ref.legislationId ===
                "protection-of-personal-and-property-rights-act-1988" &&
                Object.values(ref.groupedSections).some(
                    section => section.id == "11(2)" && section.count === 1
                )
            )
        ).toEqual(true);

    });
});

/*
---------------------------------------------------
Missing year
---------------------------------------------------
Description:
An Act, if its full name including year is mentioned, might later be referred to without the year number.
Expected results:
Section 57 of the Evidence Act.
Section 4(1) of the contractual-remedies-act-1979
File Name: data/legislation/7-missing-year.txt
---------------------------------------------------
*/

describe("Testing missing years", () => {

    const results = getTestResult("7-missing-year");

    it("Should return Section 57 of the Evidence Act, section 4 of the Contractual Remedies Act", () => {

        expect(
            results.legislationReferences.legislationReferences.some(
                ref =>
                ref.legislationId === "evidence-act-2006" &&
                Object.values(ref.groupedSections).some(
                    section => section.id == "57" && section.count === 1
                )
            )
        ).toEqual(true);
        expect(
            results.legislationReferences.legislationReferences.some(
                ref =>
                ref.legislationId === "contractual-remedies-act-1979" &&
                Object.values(ref.groupedSections).some(
                    section => section.id == "4(1)" && section.count === 1
                )
            )
        ).toEqual(true);

    });
});

/*
---------------------------------------------------
Double section and ranges
---------------------------------------------------
Description:
Multiple sections might be referred to in groups or ranges. For example:
ss is shorthand for "sections"
GROUPS:
sections 5 and 6
ss 5 and 6
ss 5, 6 and 7
RANGES:
sections 20 - 25
ss 20A - 25
At this point ranges do not need to match on all sections between the two numbers, just the two numbers themselves. To match on all between a range, we would need a database of sequential sections for each Act in order to know whether there are any missing or additional sections inside a range eg section 2, 2A, 3.
Expected results:
Fair Trading Act sections 9, 10, 43, 11, 13, 42 and 45
File Name: data/legislation/8-double-section-and-ranges.txt
---------------------------------------------------
*/

describe("Testing multiple sections and ranges", () => {

    const results = getTestResult("8-double-section-and-ranges");

    it("", () => {

        expect(
            results.legislationReferences.legislationReferences.some(
                ref =>
                ref.legislationId === "fair-trading-act-1986" &&
                Object.values(ref.groupedSections).some(
                    section => section.id == "9" && section.count === 1
                ) &&
                Object.values(ref.groupedSections).some(
                    section => section.id == "10" && section.count === 1
                ) &&
                Object.values(ref.groupedSections).some(
                    section => section.id == "43" && section.count === 1
                ) &&
                Object.values(ref.groupedSections).some(
                    section => section.id == "11" && section.count === 1
                ) &&
                Object.values(ref.groupedSections).some(
                    section => section.id == "13" && section.count === 1
                ) &&
                Object.values(ref.groupedSections).some(
                    section => section.id == "42" && section.count === 1
                ) &&
                Object.values(ref.groupedSections).some(
                    section => section.id == "45" && section.count === 1
                )
            )
        ).toEqual(true);

    });
});

/*
---------------------------------------------------
Combination test with subsection complications
---------------------------------------------------
Description:
A combination of previous tests, plus an edge-case of a basic reference being complicated by subsection numbers. An explicit definition is given but broken by two subsection references ("s 308(1) and (4) of the Gambling Act")
Expected results:
Section 15, gambling-act-2003
Section 308, gambling-act-2003
Section 7, credit-contracts-and-consumer-finance-act-2003
Section 13, credit-contracts-and-consumer-finance-act-2003
Section 11, credit-contracts-and-consumer-finance-act-2003
File Name: data/legislation/9-combination-test.txt
---------------------------------------------------
*/

describe("Combination test, basic reference broken by subsections", () => {

    const results = getTestResult("9-combination-test");

    it("Should return sections 15 and 308 of the Gambling Act, and sections 7, 13 and 11 of the CCCFA", () => {

        expect(
            results.legislationReferences.legislationReferences.some(
                ref =>
                ref.legislationId === "credit-contracts-and-consumer-finance-act-2003" &&
                Object.values(ref.groupedSections).some(
                    section => section.id == "7(1)" && section.count === 1
                ) &&
                Object.values(ref.groupedSections).some(
                    section => section.id == "13" && section.count === 1
                ) &&
                Object.values(ref.groupedSections).some(
                    section => section.id == "11" && section.count === 1
                )
            )
        ).toEqual(true);
        expect(
            results.legislationReferences.legislationReferences.some(
                ref =>
                ref.legislationId === "gambling-act-2003" &&
                Object.values(ref.groupedSections).some(
                    section => section.id == "15" && section.count === 1
                ) &&
                Object.values(ref.groupedSections).some(
                    section => section.id == "308(1)" && section.count === 1
                )
            )
        ).toEqual(true);

    });
});


/*
---------------------------------------------------
Valid sections only
---------------------------------------------------

Description:
Legislation parser can obtain invalid sections. At line 484 invalid sections are filtered out.
This tests to ensure an invalid section which does get initially returned by the parser is filtered out before data is returned.

*/

describe("Test regex strips out invalid sections", () => {

    const results = getTestResult("11-valid-sections");

    it("Filters out 'read280qualifications'", () => {
        const result = results.legislationReferences.legislationReferences.find(l => l.groupedSections['read280qualifications'])
        expect(result).toBeUndefined();


    });

})

/*
---------------------------------------------------
Footnotes
---------------------------------------------------
Description:
Footnotes are referenced by a context, that is the footnote reference number and a preceeding short snippet of text (to ensure uniqueness).
When iterating through the text and a footnote context is met, it will use the current body's legislation for the footnote text.
Expected results:
Section 17, insolvency-act-2006 ( x3 )
Section 310, Gambling Act.
File Name: data/legislation/10-footnotes-interfering.txt
---------------------------------------------------
*/
describe("Footnotes", () => {

    const results = getTestResult("10-footnotes-interfering");

    it("Should return section 17 of the Insolvency Act (3 times), and section 310 of the Gambling Act, and (fake) Section 18 of unit-titles-act-2010", () => {

        expect(
            results.legislationReferences.legislationReferences.some(
                ref =>
                ref.legislationId === "insolvency-act-2006" &&
                Object.values(ref.groupedSections).some(
                    section => section.id == "17" && section.count === 1
                )
            )
        ).toEqual(true);
        expect(
            results.legislationReferences.legislationReferences.some(
                ref =>
                ref.legislationId === "gambling-act-2003" &&
                Object.values(ref.groupedSections).some(
                    section => section.id == "310" && section.count === 1
                )
            )
        ).toEqual(true);
        expect(
            results.legislationReferences.legislationReferences.some(
                ref =>
                ref.legislationId === "unit-titles-act-2010" &&
                Object.values(ref.groupedSections).some(
                    section => section.id == "18" && section.count === 1
                )
            )
        ).toEqual(true);


    });
});

/*
---------------------------------------------------
Accuracy confidence of Legislation To Cases
---------------------------------------------------
Description:
There are 3 levels of accuracy confidence:
0 - No stripping of footnotes from text, or footnote parsing. Meaning there could be erroneous section references.
1 - Footnotes stripped out, but are invalid (something wrong with citations)
2 - There are no footnotes, or the footnotes that are there are valid
Expected results:
0, 1, 2
File Names:
- data/legislation/11-accuracy-confidence-0.txt (& .footnotes.txt, .footnotecontexts.txt)
- data/legislation/11-accuracy-confidence-1.txt (& .footnotes.txt, .footnotecontexts.txt)
- data/legislation/11-accuracy-confidence-2.txt (& .footnotes.txt, .footnotecontexts.txt)
---------------------------------------------------
*/

/*

describe("Accuracy Confidence", () => {

    const results0 = getTestResult("11-accuracy-confidence-0");

    it("Should return accuracy 0", () => {

        expect(results0[0].accuracy_confidence === 0);


    });

    const results1 = getTestResult("11-accuracy-confidence-1");

    it("Should return accuracy 1", () => {

        expect(results1[0].accuracy_confidence === 1);

    });

    const results2 = getTestResult("11-accuracy-confidence-2");

    it("Should return accuracy 2", () => {

        expect(results2[0].accuracy_confidence === 2);

    });

    const results2a = getTestResult("11-accuracy-confidence-2-no-footnotes");

    it("Should return accuracy 2 (no footnotes)", () => {

        expect(results2a[0].accuracy_confidence === 2);

    });
});


*/
