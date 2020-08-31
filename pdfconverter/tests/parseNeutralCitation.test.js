/* global expect */

const { parseNeutralCitation } = require("../pdfconverter/parseNeutralCitation");
const regNeutralCite = /((?:\[\d{4}\]\s*)(?:(NZACC|NZDC|NZFC|NZHC|NZCA|NZSC|NZEnvC|NZEmpC|NZACA|NZBSA|NZCC|NZCOP|NZCAA|NZDRT|NZHRRT|NZIACDT|NZIPT|NZIEAA|NZLVT|NZLCDT|NZLAT|NZSHD|NZLLA|NZMVDT|NZPSPLA|NZREADT|NZSSAA|NZSAAA|NZTRA|(NZTT\s\w*\w)))(?:\s*(\w{1,8})))|(CA\s?\d+\/\d+)/g;


describe("Case Citations", () => {

	it("parseNeutralCitation constructs correct caseCitations array", () => {

		// Typical situation: citation not present from ingest (empty caseCitations array)
		// parseNeutralCitation should fix that by looking for a citation at the start of the case
		// And then constructing the correct object/array

		const caseNoNeutral = {
			fileKey: 'test1',
			caseText: `IN THE COURT OF APPEAL OF NEW ZEALAND
						CA122 / 2014
						[2014] NZCA 449
						BETWEEN ARTHUR SYLVAN MORGENSTERN
						First Appellant
						TANYA MAY LAVAS
						Second Appellant
						AND STEPHANIE BETH JEFFREYS AND
						TIMOTHY WILSON DOWNES
						Respondents
						Hearing: 28 May 2014 (further submissions received 21 August 2014)
						Court: O’Regan P, Harrison and White JJ
						Counsel: C T Walker for Appellants
						M T Davies and K M Wakelin for Respondents
						Judgment: 11 September 2014 at 11.00am`,
			caseCitations: [],
			caseDate: '2014-09-11T13:00:01Z',
		};

		const result = parseNeutralCitation(caseNoNeutral);

		expect(result.caseCitations).toStrictEqual([
			{
				id: '2014NZCA449',
				caseDate: caseNoNeutral.caseDate,
				fileKey: caseNoNeutral.fileKey,
				citation: '[2014] NZCA 449',
				year: 2014
			}
		])

	});

	it("parseNeutralCitation returns mapped caseCitations array", () => {

		// If caseCitations present still need to construct the object which has citation ID and the citation itself
		const caseNoNeutral = {
			caseText: `IN THE COURT OF APPEAL OF NEW ZEALAND
						CA122 / 2014
						[2014] NZCA 449
						BETWEEN ARTHUR SYLVAN MORGENSTERN
						First Appellant
						TANYA MAY LAVAS
						Second Appellant
						AND STEPHANIE BETH JEFFREYS AND
						TIMOTHY WILSON DOWNES
						Respondents
						Hearing: 28 May 2014 (further submissions received 21 August 2014)
						Court: O’Regan P, Harrison and White JJ
						Counsel: C T Walker for Appellants
						M T Davies and K M Wakelin for Respondents
						Judgment: 11 September 2014 at 11.00am`,
			caseCitations: ["[2014] NZCA 449"],
			caseDate: '2014-09-11T13:00:01Z',
		};

		const result = parseNeutralCitation(caseNoNeutral);

		expect(result.caseCitations).toStrictEqual([
			{
				id: '2014NZCA449',
				caseDate: caseNoNeutral.caseDate,
				fileKey: caseNoNeutral.fileKey,
				citation: '[2014] NZCA 449',
				year: 2014
			}



		])

	});

	it("parseNeutralCitation parseYearFromCaseDate constructs correct caseCitations array", () => {


		const caseNoNeutral = {
			caseText: `IN THE COURT OF APPEAL OF NEW ZEALAND
						CA122 / 2014
						[2014] NZCA 449
						BETWEEN ARTHUR SYLVAN MORGENSTERN
						First Appellant
						TANYA MAY LAVAS
						Second Appellant
						AND STEPHANIE BETH JEFFREYS AND
						TIMOTHY WILSON DOWNES
						Respondents
						Hearing: 28 May 2014 (further submissions received 21 August 2014)
						Court: O’Regan P, Harrison and White JJ
						Counsel: C T Walker for Appellants
						M T Davies and K M Wakelin for Respondents
						Judgment: 11 September 2014 at 11.00am`,
			caseCitations: ['[2014] NZHC 449'],
			caseDate: '',
		};

		const result = parseNeutralCitation(caseNoNeutral);

		expect(result.caseCitations).toStrictEqual([
			{
				id: '2014NZHC449',
				caseDate: caseNoNeutral.caseDate,
				fileKey: caseNoNeutral.fileKey,
				citation: '[2014] NZHC 449',
				year: 2014
			}
		])

	});


	it("Should throw an error if no caseCitations cannot find a case citation in text", () => {

		// should error - no caseCitations in object

		const caseNoCitationInText = {
			caseText: `IN THE COURT OF APPEAL OF NEW ZEALAND
							BETWEEN ARTHUR SYLVAN MORGENSTERN
							First Appellant
							TANYA MAY LAVAS
							Second Appellant
							AND STEPHANIE BETH JEFFREYS AND
							TIMOTHY WILSON DOWNES`,
			caseCitations: []
		};
		// should error - caseCitations object, but no citation in first 500 char

		expect(() => {
			parseNeutralCitation(caseNoCitationInText);
		}).toThrow("No caseCitations in array");

	})


	it("Generates correct ID strips out invalid characters", () => {

		// should error - no caseCitations in object

		const citationIdGenerate = {
			caseCitations: ['!@#$%^&*()[2012] NZHC 145 CIV-2012-088-123']
		};
		// should error - caseCitations object, but no citation in first 500 char

		const result = parseNeutralCitation(citationIdGenerate);

		expect(result.caseCitations).toStrictEqual([
			{
				"caseDate": undefined,
				id: '2012NZHC145CIV-2012-088-123',
				"fileKey": undefined,
				citation: '!@#$%^&*()[2012] NZHC 145 CIV-2012-088-123',
				"year": 2012,
			}
		])

	})

	it("Generates correct ID", () => {

		// should error - no caseCitations in object

		const citationIdGenerate = {
			caseCitations: ['HC PMN CIV: 2004-454-756'],
			caseDate: '2014-09-11T13:00:01Z',
			fileKey: ''
		};
		// should error - caseCitations object, but no citation in first 500 char

		const result = parseNeutralCitation(citationIdGenerate);

		expect(result.caseCitations).toStrictEqual([
			{
				"caseDate": '2014-09-11T13:00:01Z',
				"citation": "HC PMN CIV: 2004-454-756",
				"fileKey": '',
				"id": "HCPMNCIV2004-454-756",
				"year": 2014
			}
		])

	})


	it("Testing neutral citation regex", () => {

		const listOfNeutralCitations = [
			"[2012] NZHC 507",
			"[2012] NZDC 12",
			"[2012] NZCA 12",
			"[2012] NZSC 12",
			"[2012] NZEnvC 13",
			"[2012] NZEmpC 13",
			"[2012] NZACA 13",
			"[2012] NZBSA 13",
			"[2012] NZCC 13",
			"[2012] NZCOP 13",
			"[2012] NZCAA",
			"[2012] NZDRT 13",
			"[2012] NZHRRT 13",
			"[2012] NZIACDT 13",
			"[2012] NZIEAA 13",
			"[2012] NZLVT 13",
			"[2012] NZLCDT 13",
			"[2012] NZLAT 13",
			"[2012] NZSHD 13",
			"[2012] NZLLA 13",
			"[2012] NZMVDT 13",
			"[2012] NZPSPLA 13",
			"[2012] NZREADT 13",
			"[2012] NZSSAA 13",
			"[2012] NZTRA 13"
		]

		const results = listOfNeutralCitations.map(c => c.match(regNeutralCite));

		expect(results.find(r => r === null)).toBe(undefined);
	});
});
