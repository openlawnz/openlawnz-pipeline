/* global expect */
const fs = require("fs");
const parseRepresentation = require("../pdfconverter/parseRepresentation");

const cases = {
    case1: "jdo_1404997201000_ec4145ad-2d29-4a23-ac25-9080c54d6b89.pdf",
    case2: "jdo_1410440401000_f0cdb380-7cef-469b-a294-b3ecefc00dc7.pdf",
    case3: "jdo_1417525201000_a8a9807a-15bd-43e0-a153-1cde074f6e51.pdf",
    case4: "jdo_1424959201000_3967474d-f0d5-4b16-beca-719d6481f52b.pdf",
    case5: "jdo_1495198801000_73a5cf73-ec98-431e-8a5e-b60a5625b879.pdf",
    case6: "jdo_1522069201000_26666a48-dd4a-43ed-9f53-77e66655897c.pdf",
    case7: "jdo_1545138001000_55c721dd-d9dc-4d12-bcf8-c17bc49ebb68.pdf",
    case8: "jdo_1536930001000_990cc5f4-b2b6-42ed-9d6b-7eefb38e6517.pdf",
    case9: "jdo_1537189201000_9d9bc1ee-c2db-493b-ab91-0f70975c1675.pdf"
}


describe(cases.case1, () => {

    const caseText = fs.readFileSync(`./parseRepresentation/caseTexts/${cases.case1}.txt`).toString();

    it('Case 1 - Returns applicant and respondent for single applicant and single respondent case', async() => {

        const result = parseRepresentation({
            caseText
        });
        const { initiation, response } = result;
        
        expect(initiation.names).toEqual(['FORIVERMOR LIMITED'])
        expect(response.names).toEqual(['ANZ BANK NEW ZEALAND LIMITED (FORMERLY ANZ NATIONAL BANK LIMITED)']);
        expect(initiation.appearance).toEqual("G J Thwaite");
        expect(response.appearance).toEqual("C T Walker");
    
    });
    
})


describe(cases.case2, () => {

    const caseText = fs.readFileSync(`./parseRepresentation/caseTexts/${cases.case2}.txt`).toString();

    it('Case 2 - Returns 2 appellants and 1 respondent', async() => {

        const result = parseRepresentation({
            caseText
        });
        const { initiation, response } = result;
        
        expect(initiation.names).toEqual(['ARTHUR SYLVAN MORGENSTERN', 'TANYA MAY LAVAS']);
        expect(response.names).toEqual(['STEPHANIE BETH JEFFREYS AND TIMOTHY WILSON DOWNES']);
        expect(initiation.appearance).toEqual("C T Walker");
        expect(response.appearance).toEqual("M T Davies and K M Wakelin");
    
    });
    
});

describe(cases.case3, () => {

    const caseText = fs.readFileSync(`./parseRepresentation/caseTexts/${cases.case3}.txt`).toString();

    it('Case 3 - Returns 2 appellants and 1 respondent', async() => {

        const result = parseRepresentation({
            caseText
        });
        const { initiation, response } = result;
        
        expect(initiation.names).toEqual(['ARTHUR SYLVAN MORGENSTERN', 'TANYA MAY LAVAS']);
        expect(response.names).toEqual(['STEPHANIE BETH JEFFREYS AND TIMOTHY WILSON DOWNES']);
        expect(initiation.appearance).toEqual("C T Walker");
        expect(response.appearance).toEqual("N H Malarao and K M Wakelin");
    
    });
    
});

describe(cases.case4, () => {

    const caseText = fs.readFileSync(`./parseRepresentation/caseTexts/${cases.case4}.txt`).toString();

    it('Case 4 - Returns 1 appellant and 2 respondents - first case in multi case only', async() => {

        const result = parseRepresentation({
            caseText
        });
        const { initiation, response } = result;
        
        // nb this proceeding is a combined proceeding with multiple cases being dealt with in one judgment - it is ok to get the first initiaion and response parties only
        expect(initiation.names).toEqual(["MELANIE ANN CLAYTON", "MCGLOSKEY NOMINEES LIMITED (AS TRUSTEE OF THE DENARAU RESORT TRUST)", "MARK ARNOLD CLAYTON", "DEBORAH JOAN VAUGHAN (AS TRUSTEE OF THE SOPHIA NO 7 TRUST)", "MARK ARNOLD CLAYTON (AS TRUSTEE OF THE VAUGHAN ROAD PROPERTY TRUST)", "DEBORAH JOAN VAUGHAN (AS TRUSTEE OF THE SOPHIA NO 7 TRUST) Second Appellant CHELMSFORD HOLDINGS LIMITED  (AS TRUSTEE OF THE CHELMSFORD TRUST)", "MARK ARNOLD CLAYTON (AS TRUSTEE OF THE VAUGHAN ROAD PROPERTY TRUST) Second Appellant BRYAN WILLIAM CHESHIRE AND  MARK ARNOLD CLAYTON (AS TRUSTEES OF THE STACEY CLAYTON EDUCATION TRUST AND THE ANNA CLAYTON EDUCATION TRUST)", "DEBORAH JOAN VAUGHAN (AS TRUSTEE OF THE SOPHIA NO 7 TRUST) Second Appellant CHELMSFORD HOLDINGS LIMITED (AS TRUSTEE OF THE CHELMSFORD TRUST) Third Appellant BRYAN WILLIAM CHESHIRE (AS TRUSTEE OF THE LIGHTER QUAY 5B TRUST)"]);
        expect(response.names).toEqual(['MARK ARNOLD CLAYTON', 'BRYAN WILLIAM CHESHIRE AND MARK ARNOLD CLAYTON (AS TRUSTEES OF THE CLAYMARK TRUST)']);
        // case 4 - dont worry about representation - edge case, way too tricky for now
        
    });
    
});

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