/* global expect */
const fs = require("fs");

const judgeTitles = require("openlawnz-common/judge-titles.js");
const parseJudges = require("../pdfconverter/parseJudges");


const cases = {
    case1: "jdo_1404997201000_ec4145ad-2d29-4a23-ac25-9080c54d6b89.pdf",
    case2: "jdo_1410440401000_f0cdb380-7cef-469b-a294-b3ecefc00dc7.pdf",
    case3: "jdo_1417525201000_a8a9807a-15bd-43e0-a153-1cde074f6e51.pdf",
    case4: "jdo_1424959201000_3967474d-f0d5-4b16-beca-719d6481f52b.pdf",
    case5: "jdo_1495198801000_73a5cf73-ec98-431e-8a5e-b60a5625b879.pdf",
    case6: "jdo_1522069201000_26666a48-dd4a-43ed-9f53-77e66655897c.pdf",
    case7: "jdo_1545138001000_55c721dd-d9dc-4d12-bcf8-c17bc49ebb68.pdf"
}


/* Example result format
{
judges: [
        {
            title_id: 'justice',
            name: 'LANG'
        },
        {
            title_id: 'justice',
            name: 'BREWER'
        }
    ]
}
*/

describe(cases.case1, () => {

    const caseText = fs.readFileSync(`./parseJudgesTestFiles/caseTexts/${cases.case1}.txt`).toString();

    it('Returns three judge supreme court', async() => {

        const result = parseJudges(judgeTitles, {
            fileKey: cases.case1,
            caseText: caseText
        });

        expect(result.judges[0]).toMatchObject({
            title_id: 'chief-justice',
            name: 'Elias'
        });

        expect(result.judges[1]).toMatchObject({
            title_id: 'justice',
            name: 'McGrath'
        });

        expect(result.judges[2]).toMatchObject({
            title_id: 'justice',
            name: 'Glazebrook'
        });
    });
});

 
 
describe(cases.case2, () => {

    const caseText = fs.readFileSync(`./parseJudgesTestFiles/caseTexts/${cases.case2}.txt`).toString();

    it('Returns three judges court of appeal', async() => {

        const result = parseJudges(judgeTitles, {
            fileKey: cases.case2,
            caseText: caseText
        });
        
        expect(result.judges[0]).toMatchObject({
            title_id: 'president',
            name: 'O\'Regan'
        });
        expect(result.judges[1]).toMatchObject({
            title_id: 'justice',
            name: 'Harrison'
        });
        expect(result.judges[2]).toMatchObject({
            title_id: 'justice',
            name: 'White'
        });
    });

});


describe(cases.case3, () => {

    const caseText = fs.readFileSync(`./parseJudgesTestFiles/caseTexts/${cases.case3}.txt`).toString();

    it('Returns correct judges in three judge case', async() => {
    // William Young, Glazebrook and Arnold JJ 
        const result = parseJudges(judgeTitles, {
            fileKey: cases.case3,
            caseText: caseText
        });
        
        expect(result.judges[0]).toMatchObject({
            title_id: 'justice',
            name: 'William Young'
        });
        expect(result.judges[1]).toMatchObject({
            title_id: 'justice',
            name: 'Glazebrook'
        });
        expect(result.judges[2]).toMatchObject({
            title_id: 'justice',
            name: 'Arnold'
        });
    });

});

describe(cases.case4, () => {

    const caseText = fs.readFileSync(`./parseJudgesTestFiles/caseTexts/${cases.case4}.txt`).toString();
    // Ellen France, Randerson and White JJ 
    it('Returns correct judges in three judge court of appeal case', async() => {

        const result = parseJudges(judgeTitles, {
            fileKey: cases.case4,
            caseText: caseText
        });
        
        expect(result.judges[0]).toMatchObject({
            title_id: 'justice',
            name: 'Ellen France'
        });
        expect(result.judges[1]).toMatchObject({
            title_id: 'justice',
            name: 'Randerson'
        });
        expect(result.judges[2]).toMatchObject({
            title_id: 'justice',
            name: 'White'
        });
    });

});


describe(cases.case5, () => {

    const caseText = fs.readFileSync(`./parseJudgesTestFiles/caseTexts/${cases.case5}.txt`).toString();
    // Kós P, Winkelmann and Brown JJ 
    it('Returns three judges including president Kós', async() => {

        const result = parseJudges(judgeTitles, {
            fileKey: cases.case5,
            caseText: caseText
        });

        // expect(result.judges).toHaveLength(1);
        expect(result.judges[0]).toMatchObject({
            title_id: 'president',
            name: 'Kós'
        });
        expect(result.judges[1]).toMatchObject({
            title_id: 'justice',
            name: 'Winkelmann'
        });
        expect(result.judges[2]).toMatchObject({
            title_id: 'justice',
            name: 'Brown'
        });

    });

});

describe(cases.case6, () => {

    const caseText = fs.readFileSync(`./parseJudgesTestFiles/caseTexts/${cases.case6}.txt`).toString();
    // Kós P, Winkelmann and Brown JJ 
    it('Returns judge title justice and judge name LANG', async() => {

        const result = parseJudges(judgeTitles, {
            fileKey: cases.case6,
            caseText: caseText
        });

        // expect(result.judges).toHaveLength(1);
        expect(result.judges[0]).toMatchObject({
            title_id: 'justice',
            name: 'LANG'
        });
    });

});

describe(cases.case7, () => {

    const caseText = fs.readFileSync(`./parseJudgesTestFiles/caseTexts/${cases.case7}.txt`).toString();
    // Associate Judge Smith
    it('Returns associate judge', async() => {

        const result = parseJudges(judgeTitles, {
            fileKey: cases.case7,
            caseText: caseText
        });

        // expect(result.judges).toHaveLength(1);
        expect(result.judges[0]).toMatchObject({
            title_id: 'associate-judge',
            name: 'SMITH'
        });
    });

});