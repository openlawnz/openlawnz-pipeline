/* global expect */
const fs = require("fs");
const parseRepresentation = require("../pdfconverter/parseRepresentation");

const cases = {
    case1: "jdo_1545224401000_d634a715-0ad3-4a8c-82ce-35bf60521541.pdf",
    case2: "jdo_1541768401000_62075bd3-8205-4ecc-9e92-678842024bc2.pdf",
    case3: "jdo_1539262801000_635bd98f-d5cd-475f-855f-c4e51243f820.pdf",
    case4: "jdo_1544533201000_d6a07abf-9ae8-4941-bead-c0d12dc9647e.pdf",
    case5: "jdo_1495198801000_73a5cf73-ec98-431e-8a5e-b60a5625b879.pdf",
    case6: "jdo_1522069201000_26666a48-dd4a-43ed-9f53-77e66655897c.pdf",
    case7: "jdo_1545138001000_55c721dd-d9dc-4d12-bcf8-c17bc49ebb68.pdf",
    case8: "jdo_1536930001000_990cc5f4-b2b6-42ed-9d6b-7eefb38e6517.pdf",
    case9: "jdo_1537189201000_9d9bc1ee-c2db-493b-ab91-0f70975c1675.pdf"
}


describe(cases.case1, () => {

    const caseText = fs.readFileSync(`./parseRepresentation/caseTexts/${cases.case1}.txt`).toString();

    it('Case 1 - Returns applicant and respondent (simple form)', async() => {

        const result = parseRepresentation({
            caseText
        });
        const { initiation, response } = result;

        expect(initiation.names).toEqual(['JESSIE MAREE GREEN'])
        expect(response.names).toEqual(['IAN RAY CARR'])

    });

})


describe(cases.case2, () => {

    const caseText = fs.readFileSync(`./parseRepresentation/caseTexts/${cases.case2}.txt`).toString();

    it('Case 2 - Returns single appellant and two items in array for respondents', async() => {

        const result = parseRepresentation({
            caseText
        });
        const { initiation, response } = result;
        expect(initiation.names).toStrictEqual(['ATTORNEY-GENERAL']);
        expect(response.names).toStrictEqual(['ARTHUR WILLIAM TAYLOR', 'HINEMANU NGARONOA, SANDRA WILDE, KIRSTY OLIVIA FENSOM AND CLAIRE THRUPP']);

    });

});


describe(cases.case3, () => {

    const caseText = fs.readFileSync(`./parseRepresentation/caseTexts/${cases.case3}.txt`).toString();

    it('Case 3 - single letter appellant and respondent, simple appellant appearance, two response appearance', async() => {

        const result = parseRepresentation({
            caseText
        });
        const { initiation, response } = result;

        expect(initiation.names).toEqual(['S']);
        expect(response.names).toEqual(['P']);
        expect(initiation.appearance).toEqual(["L F Soljan"]);
        expect(response.appearance).toEqual(["A E Ashmore", "N J Fairley"]);

    });

});


describe(cases.case4, () => {

    const caseText = fs.readFileSync(`./parseRepresentation/caseTexts/${cases.case4}.txt`).toString();

    it('Case 4 - Returns 1 appellant and 2 respondents - first case in multi case only', async() => {

        const result = parseRepresentation({
            caseText
        });
        const { initiation, response } = result;

        expect(initiation.names).toEqual(["SUMIT KUMAR"]);
        expect(response.names).toEqual(['NEW ZEALAND POLICE']);
        expect(initiation.appearance).toEqual(['J A Kincade', 'A Shendi'])
        expect(response.appearance).toEqual(['R M A McCoubrey', 'A C L Palmer'])

    });

});

/*
describe(cases.case5, () => {

    const caseText = fs.readFileSync(`./parseRepresentation/caseTexts/${cases.case5}.txt`).toString();

    it('Case 5 - Returns appellants and respondents in multi case decision (ignore representation)', async() => {

        const result = parseRepresentation({
            caseText
        });
        const { initiation, response } = result;

        // nb this proceeding is a combined proceeding with multiple cases being dealt with in one judgment - it is ok to get the first initiaion and response parties only
        expect(initiation.names).toEqual(['MINGBO FANG', 'THE CHIEF EXECUTIVE OF THE MINISTRY OF BUSINESS, INNOVATION AND EMPLOYMENT', 'MINISTRY OF BUSINESS, INNOVATION AND EMPLOYMENT']);
        expect(response.names).toEqual(['THE MINISTRY OF BUSINESS, INNOVATION AND EMPLOYMENT', 'DEFANG DONG ', 'ZHIWEI LI']);
        // representation can be blank - although there is representation noted in the case, it is not noted as "for Respondent" or "for Appellant" etc so no way to tell. Parser does not need to find D Zhang or S M Kilian.

    });

});

describe(cases.case6, () => {

    const caseText = fs.readFileSync(`./parseRepresentation/caseTexts/${cases.case6}.txt`).toString();

    it('Case 6 - Returns 2 applicants and 3 groups of respondents, including representation', async() => {

        const result = parseRepresentation({
            caseText
        });
        const { initiation, response } = result;

        // nb this proceeding is a combined proceeding with multiple cases being dealt with in one judgment - it is ok to get the first initiaion and response parties only
        expect(initiation.names).toEqual(['TAHI ENTERPRISES LIMITED', 'DIANNE LEE']);
        expect(response.names).toEqual(['TE WARENA TAUA AND MIRIAMA TAMAARIKI as executors of the Estate of Hariata Arapo Ewe', 'TE WARENA TAUA, GEORGE HORI WINIKEREI TAUA, NGARAMA WALKER, HAMUERA TAUA and MIRIAMA TAMAARIKI as trustees of the Te Kawerau Iwi Tribal Authority', 'TE WARENA TAUA, GEORGE HORI WINIKEREI TAUA, NGARAMA WALKER, HAMUERA TAUA and MIRIAMA TAMAARIKI as trustees of the Te Kawerau Iwi Settlement Trust']);
        expect(initiation.appearance).toEqual("M Heard and C Upton");
        expect(response.appearance).toEqual("J S Langston");
        // nb - in this case, "First respondents abide decision of the Court" - means no appearance, no representation. Ignore this and similar strings.
        // If there WAS separate representation (eg if the text had J S Langston for Second and Third Respondents and John Smith for First respondents) then the response appearance should equal "JS Langston and John Smith" ie concatenate the two appearances into one string
    });

});

describe(cases.case7, () => {

    const caseText = fs.readFileSync(`./parseRepresentation/caseTexts/${cases.case7}.txt`).toString();

    it('Case 7 - Returns 2 applicants and 3 groups of respondents, including representation', async() => {

        const result = parseRepresentation({
            caseText
        });
        const { initiation, response } = result;

        // nb this proceeding is a combined proceeding with multiple cases being dealt with in one judgment - it is ok to get the first initiaion and response parties only
        expect(initiation.names).toEqual(['TAHI ENTERPRISES LIMITED', 'DIANNE LEE']);
        expect(response.names).toEqual(['TE WARENA TAUA and MIRIAMA TAMAARIKI as executor of the estate of HARIATA ARAPO EWE']);
        expect(initiation.appearance).toEqual("D M Salmon and C Upton");
        expect(response.appearance).toEqual("K J Crossland and A Alipour");

    });

});

describe(cases.case8, () => {

    const caseText = fs.readFileSync(`./parseRepresentation/caseTexts/${cases.case8}.txt`).toString();

    it('Case 8 - Self represented test', async() => {

        const result = parseRepresentation({
            caseText
        });
        const { initiation, response } = result;

        expect(initiation.names).toEqual(['NICHOLAS PAUL ALFRED REEKIE']);
        expect(response.names).toEqual(['CLAIMANTS A and B']);
        expect(initiation.appearance).toEqual("in Person");
        expect(response.appearance).toEqual("Victoria Casey QC as Amicus Curiae");

    });

});

describe(cases.case9, () => {

    const caseText = fs.readFileSync(`./parseRepresentation/caseTexts/${cases.case9}.txt`).toString();

    it('Case 9 - One represented respondent, two self-represented respondents', async() => {

        const result = parseRepresentation({
            caseText
        });
        const { initiation, response } = result;

        // nb this proceeding has one lawyer for one of the response parties, and the other two response parties are "in person"
        // all response lawyers and "in person" strings can be combined into one
        expect(initiation.names).toEqual(['PERI MICAELA FINNIGAN and BORIS VAN DELDEN']);
        expect(response.names).toEqual(['BRIAN ROBERT ELLIS', 'GERALD NORMAN WILLIAMS', 'JAMES NEIL BLACK ']);
        expect(initiation.appearance).toEqual("J K Boparoy");
        expect(response.appearance).toEqual("W C Pyke for First Defendant, G N Williams in person, J N Black in person");

    });

});
*/
