/* global expect */
const fs = require("fs");

const parseLocation = require("../pdfconverter/parseLocation");


const cases = {
    case1: "jdo_1404997201000_ec4145ad-2d29-4a23-ac25-9080c54d6b89.pdf",
    case2: "jdo_1410440401000_f0cdb380-7cef-469b-a294-b3ecefc00dc7.pdf",
    case3: "jdo_1417525201000_a8a9807a-15bd-43e0-a153-1cde074f6e51.pdf",
    case4: "jdo_1424959201000_3967474d-f0d5-4b16-beca-719d6481f52b.pdf",
    case5: "jdo_1495198801000_73a5cf73-ec98-431e-8a5e-b60a5625b879.pdf",
    case6: "jdo_1522069201000_26666a48-dd4a-43ed-9f53-77e66655897c.pdf",
    case7: "jdo_1545138001000_55c721dd-d9dc-4d12-bcf8-c17bc49ebb68.pdf"
}


describe(cases.case1, () => {

    const caseText = fs.readFileSync(`./parseJudgesTestFiles/caseTexts/${cases.case1}.txt`).toString();

    it('Location', async() => {

        const result = parseLocation( {
            fileKey: cases.case1,
            caseText: caseText
        });
        
         expect(result).toBe('NEW ZEALAND');
        
        console.log(result)
    });
});

 
 
