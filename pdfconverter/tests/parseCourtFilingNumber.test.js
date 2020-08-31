/* global expect */

const parseCourtFilingNumber = require("../pdfconverter/parseCourtFilingNumber");

describe("parseCourtFilingNumber", () => {

	it("It should find \"CIV 2013-488-365\" filing number", () => {

		let jsonData = {
			fileKey: 'test1',
			caseText: `IN THE COURT OF APPEAL OF NEW ZEALAND
						CA122 / 2014
						[2014] NZCA 449
						CIV 2013-488-365
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
			caseDate: '2014-09-11T13:00:01Z'
		};

		parseCourtFilingNumber(jsonData)

		expect(jsonData.filingNumber).toBe('2013-488-365');


	});

	it("It should find \"CIV 2013 488 365\" filing number", () => {

		let jsonData = {
			fileKey: 'test1',
			caseText: `IN THE COURT OF APPEAL OF NEW ZEALAND
						CA122 / 2014
						[2014] NZCA 449
						CIV 2013 488 365
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
			caseDate: '2014-09-11T13:00:01Z'
		};

		parseCourtFilingNumber(jsonData)

		expect(jsonData.filingNumber).toBe('2013 488 365');


	});

	it("It should find \"SC 5/2004\" filing number", () => {

		let jsonData = {
			fileKey: 'test1',
			caseText: `BENJAMIN EUGENE MANUEL (ALSO KNOWN AS EUGENE BENJAMIN MANUEL) V THE
						SUPERINTENDENT, HAWKES BAY REGIONAL PRISON SC CIV SC 5/2004 3 August 2004IN THE SUPREME COURT OF NEW ZEALAND
						CIV SC 5/2004
						AND BETWEENBENJAMIN EUGENE MANUEL (ALSO
						KNOWN AS EUGENE BENJAMIN
						MANUEL)
						Applicant
						ANDTHE SUPERINTENDENT, HAWKES
						BAY REGIONAL PRISON
						Respondent
						Hearing:3 August 2004
						Coram:Gault J
						Blanchard J
						Appearances:  A J Ellis and G Edgeler for Applicant
						S P France for Respondent
						Judgment:3 August 2004
						JUDGMENT OF THE COURT
						[1]The  applicant  seeks  leave  to  appeal  against  the  judgment  of  the  Court  of
						Appeal delivered on 15 June 200`,
			caseCitations: [],
			caseDate: '2014-09-11T13:00:01Z'
		};

		parseCourtFilingNumber(jsonData)

		expect(jsonData.filingNumber).toBe('5/2004');

	});

	it("It should find \"CA84/05\" filing number", () => {

		let jsonData = {
			fileKey: 'test1',
			caseText: `EFFECTIVE FENCING LTD V CHAPMAN AND ANOR CA CA84/05  16 February 2007IN THE COURT OF APPEAL OF NEW ZEALAND
						CA84/05
						[2007] NZCA 12
						BETWEENEFFECTIVE FENCING LIMITED
						Appellant
						ANDGILBERT DALE CHAPMAN AND
						GRANT BRUCE REYNOLDS AS
						LIQUIDATORS OF UPSTAIRS LIMITED
						(IN LIQUIDATION)
						Respondents
						Hearing:21 August 2006
						Court:Chambers, Randerson and John Hansen JJ
						Counsel:M H Benvie for`,
			caseCitations: [],
			caseDate: '2014-09-11T13:00:01Z'
		};

		parseCourtFilingNumber(jsonData)

		expect(jsonData.filingNumber).toBe('84/05');

	});

	it("It should find \"CA CA1/07\" filing number", () => {

		let jsonData = {
			fileKey: 'test1',
			caseText: `SUDA GROUP LTD V SEE WAI AND PUTI YING WONG CA CA1/07  28 April 2008IN THE COURT OF APPEAL OF NEW ZEALAND
						CA1/07
						[2008] NZCA 101
						BETWEENSUDA GROUP LIMITED
						Appellant
						ANDSEE WAI AND PUTI YING WONG
						Respondents`,
			caseCitations: [],
			caseDate: '2014-09-11T13:00:01Z'
		};

		parseCourtFilingNumber(jsonData)

		expect(jsonData.filingNumber).toBe('1/07');

	});


	it("It should find \"DCA\" ACC filing number", () => {

		let jsonData = {
			fileKey: 'test1',
			caseText: `IN THE COURT OF APPEAL OF NEW ZEALAND
							CA122 / 2014
							[2014] NZCA 449
							DCA 111/222
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
			caseDate: '2014-09-11T13:00:01Z'
		};

		parseCourtFilingNumber(jsonData)

		expect(jsonData.filingNumber).toBe('111/222');

	});

	it("It should find \"DCA\" ACC filing number with missing space before number", () => {

		let jsonData = {
			fileKey: 'test1',
			caseText: `IN THE COURT OF APPEAL OF NEW ZEALAND
							CA122 / 2014
							[2014] NZCA 449
							DCA111/222
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
			caseDate: '2014-09-11T13:00:01Z'
		};

		parseCourtFilingNumber(jsonData)

		expect(jsonData.filingNumber).toBe('111/222');


	});

	it("It should find \"ACR\" ACC filing number", () => {

		let jsonData = {
			fileKey: 'test1',
			caseText: `IN THE COURT OF APPEAL OF NEW ZEALAND
							CA122 / 2014
							[2014] NZCA 449
							ACR 111/222
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
			caseDate: '2014-09-11T13:00:01Z'
		};

		parseCourtFilingNumber(jsonData)

		expect(jsonData.filingNumber).toBe('111/222');


	});

	it("It should find \"ACR\" ACC filing number with missing space before number", () => {

		let jsonData = {
			fileKey: 'test1',
			caseText: `IN THE COURT OF APPEAL OF NEW ZEALAND
							CA122 / 2014
							[2014] NZCA 449
							ACR111/222
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
			caseDate: '2014-09-11T13:00:01Z'
		};

		parseCourtFilingNumber(jsonData)

		expect(jsonData.filingNumber).toBe('111/222');


	});

	it("It should find \"Decision No\" ACC filing number", () => {

		let jsonData = {
			fileKey: 'test1',
			caseText: `IN THE COURT OF APPEAL OF NEW ZEALAND
							CA122 / 2014
							[2014] NZCA 449
							Decision No 111/222
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
			caseDate: '2014-09-11T13:00:01Z'
		};

		parseCourtFilingNumber(jsonData)

		expect(jsonData.filingNumber).toBe('111/222');


	});

	it("It should find \"Decision No\" ACC filing number with one line break ", () => {

		let jsonData = {
			fileKey: 'test1',
			caseText: `IN THE COURT OF APPEAL OF NEW ZEALAND
							CA122 / 2014
							[2014] NZCA 449
							Decision
							No 111/222
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
			caseDate: '2014-09-11T13:00:01Z'
		};

		parseCourtFilingNumber(jsonData)

		expect(jsonData.filingNumber).toBe('111/222');


	});

	it("It should find \"Decision No\" ACC filing number with line breaks", () => {

		let jsonData = {
			fileKey: 'test1',
			caseText: `IN THE COURT OF APPEAL OF NEW ZEALAND
							CA122 / 2014
							[2014] NZCA 449
							Decision
							No
							111/222
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
			caseDate: '2014-09-11T13:00:01Z'
		};

		parseCourtFilingNumber(jsonData)

		expect(jsonData.filingNumber).toBe('111/222');

	});

	it("It should find \"Decision No\" ACC filing number with missing space before number", () => {

		let jsonData = {
			fileKey: 'test1',
			caseText: `IN THE COURT OF APPEAL OF NEW ZEALAND
							CA122 / 2014
							[2014] NZCA 449
							Decision No111/222
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
			caseDate: '2014-09-11T13:00:01Z'
		};

		parseCourtFilingNumber(jsonData)

		expect(jsonData.filingNumber).toBe('111/222');


	});

	it("It should find \"DCA No\" ACC filing number", () => {

		let jsonData = {
			fileKey: 'test1',
			caseText: `IN THE COURT OF APPEAL OF NEW ZEALAND
							CA122 / 2014
							[2014] NZCA 449
							DCA No 111/222
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
			caseDate: '2014-09-11T13:00:01Z'
		};

		parseCourtFilingNumber(jsonData)

		expect(jsonData.filingNumber).toBe('111/222');


	});

	it("It should find \"DCA No\" ACC filing number with one line break", () => {

		let jsonData = {
			fileKey: 'test1',
			caseText: `IN THE COURT OF APPEAL OF NEW ZEALAND
							CA122 / 2014
							[2014] NZCA 449
							DCA
							No 111/222
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
			caseDate: '2014-09-11T13:00:01Z'
		};

		parseCourtFilingNumber(jsonData)

		expect(jsonData.filingNumber).toBe('111/222');


	});

	it("It should find \"DCA No\" ACC filing number with line breaks", () => {

		let jsonData = {
			fileKey: 'test1',
			caseText: `IN THE COURT OF APPEAL OF NEW ZEALAND
							CA122 / 2014
							[2014] NZCA 449
							DCA
							No
							111/222
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
			caseDate: '2014-09-11T13:00:01Z'
		};

		parseCourtFilingNumber(jsonData)

		expect(jsonData.filingNumber).toBe('111/222');


	});

	it("It should find \"DCA No\" ACC filing number with missing space before number", () => {

		let jsonData = {
			fileKey: 'test1',
			caseText: `IN THE COURT OF APPEAL OF NEW ZEALAND
							CA122 / 2014
							[2014] NZCA 449
							DCA No111/222
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
			caseDate: '2014-09-11T13:00:01Z'
		};

		parseCourtFilingNumber(jsonData)

		expect(jsonData.filingNumber).toBe('111/222');


	});

});
