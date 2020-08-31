/**
 * @jest-environment node
 */

/* global expect */

const { processPDF } = require("../pdfconverter/pdfToJSON");

describe("pdfToJSON", () => {


    it('Does not process urls with govt.nz', async() => {
        await expect(processPDF("https://www.openlaw.nz/file.govt.nz", {})).rejects.toEqual(new Error('Cannot use NZ Govt or NZlii URLs'));
    });

    it('Does not process urls with nzlii.org files', async() => {
        await expect(processPDF("https://www.openlaw.nz/file.nzlii.org", {})).rejects.toEqual(new Error('Cannot use NZ Govt or NZlii URLs'));
    });

    it('Throws an error when URL does not exist', async() => {
        await expect(processPDF("https://pdfs.openlaw.nz/jdo_1376398801000_4ffaed38-cd90-4488-a5da-8b1c61829c5ew.pdf", {})).rejects.toEqual(new Error('Invalid PDF structure'));
    });

    it('Loads a PDF', async() => {
        const result = {};
        await processPDF("https://pdfs.openlaw.nz/jdo_1376398801000_4ffaed38-cd90-4488-a5da-8b1c61829c5e.pdf", result);
        expect(result.footnotes.length).toBeGreaterThan(0);
        expect(result.footnoteContexts.length).toBeGreaterThan(0);
        expect(result.caseText).not.toBe("");
    });

    it('Handles a PDF with no text in a page', async() => {
        const result = {};
        await processPDF("https://pdfs.openlaw.nz/jdo_1133136000000_80a28195-6190-4564-9f4b-5ac9c63b348c.pdf", result);
        //console.log(result);
        // expect(result.footnotes.length).toBeGreaterThan(0);
        // expect(result.footnoteContexts.length).toBeGreaterThan(0);
        expect(result.caseText).not.toBe("");
    });

    it('Handles no caseText', async() => {


        const result = {};
        await processPDF("https://pdfs.openlaw.nz/jdo_1404478801000_defd75fc-e476-4c75-baa8-43780ae11415.pdf", result);
        //console.log(result)
        //expect(result.footnotes.length).toBeGreaterThan(0);
        //expect(result.footnoteContexts.length).toBeGreaterThan(0);
        expect(result.caseText).toBe("");
    })

});
