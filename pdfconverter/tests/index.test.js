/**
 * @jest-environment node
 */

/* global expect */
require('dotenv').config();

const { convertPDFURLWithPDFJS } = require('@openlawnz/openlawnz-parsers');
const packageJSON = require('./package.json');
const parsersVersion = packageJSON.dependencies['@openlawnz/openlawnz-parsers'];

const pdfconverter = require('../pdfconverter/pdfconverter');
const ingestJSON = require('./testData/pdfconverter/INPUT_jdo_1116806400000_4b0d5546-345a-45c2-b641-fb3ed3fdf581.pdf.json');
const permanentJSON = require('./testData/pdfconverter/OUTPUT_jdo_1116806400000_4b0d5546-345a-45c2-b641-fb3ed3fdf581.pdf.json');
const allLegislation = require('./testData/pdfconverter/legislation.json');

describe('Convert PDF to JSON using PDFJS file', () => {
    it('pdfconverter', async () => {
        ingestJSON.caseMeta.buckets.BUCKET_PUBLIC_PDF_WITH_ENV = process.env.BUCKET_PUBLIC_PDF_WITH_ENV;
        ingestJSON.parsersVersion = parsersVersion;

        permanentJSON.caseMeta.buckets.BUCKET_PUBLIC_PDF_WITH_ENV = process.env.BUCKET_PUBLIC_PDF_WITH_ENV;
        permanentJSON.parsersVersion = parsersVersion;

        const result = await pdfconverter(parsersVersion, ingestJSON, allLegislation, null, convertPDFURLWithPDFJS);

        expect({ ...ingestJSON, ...result }).toStrictEqual(permanentJSON);
    });
});
