const {
    parseFromPDFJSConversion,
    parseFromAzureOCRConversion,
    parseLocation,
    parseNeutralCitation,
    parseCourt,
    parseLawReport,
    parseCategory,
    parseCourtFilingNumber,
    parseRepresentation,
    parseLegislation,
    parseJudges,
    courts,
    lawReports,
    judgeTitles,
    getVersion
} = require('@openlawnz/openlawnz-parsers');

const pdfconverter = async(caseRecord, allLegislation, convertWithAzureOCR, convertWithPDFJS) => {
    let conversionEngine;

    const pdfURLForOCR = `https://${caseRecord.caseMeta.buckets.BUCKET_PUBLIC_PDF_WITH_ENV}.s3-ap-southeast-2.amazonaws.com/${caseRecord.fileKey}`;

    let pages;
    let caseText;
    let footnoteContexts;
    let footnotes;
    let isValid;

    const parsersVersion = getVersion();

    // If using OCR
    if (caseRecord.caseMeta.azureOCREnabled) {
        console.log(`Get OCR from Azure ${pdfURLForOCR}`);
        conversionEngine = 'azure';
        // convertPDFURLWithAzureOCRConfiguration
        pages = await convertWithAzureOCR(pdfURLForOCR, caseRecord);

        ({ caseText, footnoteContexts, footnotes, isValid } = parseFromAzureOCRConversion(pages));
    }
    else {
        console.log(`Use PDF JS ${pdfURLForOCR}`);
        conversionEngine = 'pdfjs';
        // Otherwise use PDF.JS
        pages = await convertWithPDFJS(pdfURLForOCR);

        ({ caseText, footnoteContexts, footnotes, isValid } = parseFromPDFJSConversion(pages));
    }

    if (!caseText) {
        throw new Error("No case text (and processPDF didn't throw Error)");
    }

    // Errors will be thrown to parent

    const fileKey = caseRecord.fileKey;
    const fileProvider = caseRecord.fileProvider;
    const caseLocation = parseLocation(caseText);
    const caseCitations = parseNeutralCitation({
        caseCitations: caseRecord.caseCitations,
        fileKey: caseRecord.fileKey,
        caseDate: caseRecord.caseDate,
        caseText: caseText,
    });
    const court = parseCourt({
        caseText: caseText,
        caseCitations,
        courts,
    });
    const lawReport = parseLawReport(lawReports, caseCitations);
    const category = parseCategory(fileProvider, court, lawReport);
    const filingNumber = parseCourtFilingNumber(caseText);
    const representation = parseRepresentation(caseText);
    const legislation = parseLegislation({
        allLegislation,
        caseText,
        footnoteContexts,
        footnotes,
        fileKey,
        isValid,
    });
    const judges = parseJudges({ judgeTitles, fileKey, caseText });

    let obj = {
        isValid,
        caseText,
        caseCitations,
        caseLocation,
        representation,
        category,
        fileProvider,
        court,
        fileKey,
        filingNumber,
        lawReport,
        legislation,
        judges,
        conversionEngine,
        pdfChecksum: '',
        parsersVersion,
    };

    Object.keys(obj).forEach((key) => obj[key] === undefined && delete obj[key]);

    return obj;
};

module.exports = pdfconverter;
