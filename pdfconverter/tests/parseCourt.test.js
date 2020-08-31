/* global expect */

const { parseCourt } = require("../pdfconverter/parseCourt");
const courts = require("./generateDataTestFiles/courts.json");

describe("parseCourt", () => {

	it("It should find supreme court in citation", () => {

		let jsonData = {
			fileKey: 'test0',
			caseCitations: [
				{
					"id": "2012NZSC1234",
					"fileKey": "jdo_1151539200000_3bc9fba7-5105-4251-9eff-9ac2a3ac4c5e.pdf",
					"citation": "[2012] NZSC 1234",
					"year": 2012
		        }
		    ],
			caseDate: '2014-09-11T13:00:01Z'
		};

		parseCourt(courts, jsonData);

		expect(jsonData.court.name).toBe('Supreme Court');

	});

	it("It should find supreme court in case text with blank citation", () => {

		let jsonData = {
			fileKey: 'test1',
			caseCitations: [
				{
					"id": "",
					"fileKey": "jdo_1151539200000_3bc9fba7-5105-4251-9eff-9ac2a3ac4c5e.pdf",
					"citation": "",
					"year": 2012
		        }
		    ],
			caseDate: '2014-09-11T13:00:01Z',
			caseText: 'BENJAMIN EUGENE MANUEL (ALSO KNOWN AS EUGENE BENJAMIN MANUEL) V THE\nSUPERINTENDENT, HAWKES BAY REGIONAL PRISON SC CIV SC 5/2004 3 August 2004IN THE SUPREME COURT OF NEW ZEALAND\nCIV SC 5/2004\nAND BETWEEN'
		};

		parseCourt(courts, jsonData);

		expect(jsonData.court.name).toBe('Supreme Court');

	});

	it("It should find high court in case text with blank citation", () => {

		let jsonData = {
			fileKey: 'test1',
			caseCitations: [
				{
					"id": "",
					"fileKey": "jdo_1151539200000_3bc9fba7-5105-4251-9eff-9ac2a3ac4c5e.pdf",
					"citation": "",
					"year": 2012
		        }
		    ],
			caseDate: '2014-09-11T13:00:01Z',
			caseText: 'IN THE HIGH COURT OF NEW ZEALAND\nAUCKLAND REGISTR\n CIV 2006-404-3340\nBETWEEN KIWI FREEHOLDS QUEEN STREET\nLIMITED \nFirst Plaintiff'
		};

		parseCourt(courts, jsonData);

		expect(jsonData.court.name).toBe('High Court');

	});

	it("It should find court of appeal in citation type NZCA", () => {

		let jsonData = {
			fileKey: 'test2',
			caseCitations: [
				{
					"id": "2013NZCA1234",
					"fileKey": "jdo_1151539200000_3bc9fba7-5105-4251-9eff-9ac2a3ac4c5e.pdf",
					"citation": "[2013] NZCA 1234",
					"year": 2013
		        }
		    ],
			caseDate: '2014-09-11T13:00:01Z'
		};

		parseCourt(courts, jsonData);

		expect(jsonData.court.name).toBe('Court of Appeal');

	});


	it("It should find court of appeal in citation type CA XX/XXX", () => {

		let jsonData = {
			fileKey: 'test3',
			caseCitations: [
				{
					"id": "2007NZCA237",
					"fileKey": "jdo_1151539200000_3bc9fba7-5105-4251-9eff-9ac2a3ac4c5e.pdf",
					"citation": "CA 237/07",
					"year": 2007
		        }
		    ],
			caseDate: '2014-09-11T13:00:01Z'
		};

		parseCourt(courts, jsonData);

		expect(jsonData.court.name).toBe('Court of Appeal');

	});

	it("It should find supreme court in citation type SC XX/XXX", () => {

		let jsonData = {
			fileKey: 'test3',
			caseCitations: [
				{
					"id": "",
					"fileKey": "jdo_1151539200000_3bc9fba7-5105-4251-9eff-9ac2a3ac4c5e.pdf",
					"citation": "SC 21/07",
					"year": 2007
		        }
		    ],
			caseDate: '2014-09-11T13:00:01Z'
		};

		parseCourt(courts, jsonData);

		expect(jsonData.court.name).toBe('Supreme Court');

	});

	it("It should find court of appeal in case text", () => {

		let jsonData = {
			fileKey: 'test2',
			caseCitations: [
				{
					"id": "",
					"fileKey": "jdo_1151539200000_3bc9fba7-5105-4251-9eff-9ac2a3ac4c5e.pdf",
					"citation": "",
					"year": 2013
		        }
		    ],
			caseDate: '2014-09-11T13:00:01Z',
			caseText: 'IN THE COURT OF APPEAL OF NEW ZEALAND CA237/07 [2008] NZCA 177'
		};

		parseCourt(courts, jsonData);

		expect(jsonData.court.name).toBe('Court of Appeal');

	});

	it("Handle blank citation and nothing in text", () => {

		let jsonData = {
			fileKey: 'test-undefined-1',
			caseCitations: [
				{
					"id": "",
					"fileKey": "jdo_1151539200000_3bc9fba7-5105-4251-9eff-9ac2a3ac4c5e.pdf",
					"citation": "",
					"year": 2013
		        }
		    ],
			caseDate: '2014-09-11T13:00:01Z',
			caseText: 'IN THE NONEXISTENT COURT OF NEW ZEALAND CA237/07'
		};

		parseCourt(courts, jsonData);

		expect(jsonData.court).toBe(undefined);

	});

	it("Handle blank caseText", () => {

		let jsonData = {
			fileKey: 'test-undefined-2',
			caseCitations: [
				{
					"id": "CA237/07",
					"fileKey": "jdo_1151539200000_3bc9fba7-5105-4251-9eff-9ac2a3ac4c5e.pdf",
					"citation": "KIWI FREEHOLDS QUEEN STREET LIMITED AND ORS V SHANTI HOLDINGS LIMITED AND ORS CA CA237/07 23 June 2008\nIN THE COURT OF APPEAL OF NEW ZEALAND",
					"year": 2013
		        }
		    ],
			caseDate: '2014-09-11T13:00:01Z',
			caseText: ''
		};

		parseCourt(courts, jsonData);

		expect(jsonData.court).toBe(undefined);

	});

	it("Handle missing caseText", () => {

		let jsonData = {
			fileKey: 'test-undefined-3',
			caseCitations: [
				{
					"id": "CA237/07",
					"fileKey": "jdo_1151539200000_3bc9fba7-5105-4251-9eff-9ac2a3ac4c5e.pdf",
					"citation": "KIWI FREEHOLDS QUEEN STREET LIMITED AND ORS V SHANTI HOLDINGS LIMITED AND ORS CA CA237/07 23 June 2008\nIN THE COURT OF APPEAL OF NEW ZEALAND",
					"year": 2013
		        }
		    ],
			caseDate: '2014-09-11T13:00:01Z',

		};

		parseCourt(courts, jsonData);

		expect(jsonData.court).toBe(undefined);

	});

	it("Handle no citation array, look in caseText instead", () => {

		let jsonData = {
			fileKey: 'test2',
			caseDate: '2014-09-11T13:00:01Z',
			caseText: 'OLDS QUEEN STREET LIMITED AND ORS V SHANTI HOLDINGS LIMITED AND ORS CA CA237/07 23 June 2008\nIN THE COURT OF APPEAL OF NEW ZEALAND\nCA237/07\n\n[2008] NZCA 177\nBETWEEN KIWI FREEHOLDS QUEEN STREET\nLIMITED\nFirst Appellant'

		};

		parseCourt(courts, jsonData);

		expect(jsonData.court.name).toBe("Court of Appeal");

	});

	it("Handle malformed caseCitations object", () => {

		let jsonData = {
			fileKey: 'test-undefined-4',
			caseCitations: [
				{
					"id": "XXXXXXXXXXXXX",
					"fileKey": "XXXXXXXXXXXXXXXXXXXXXX",
					"citation": "XXXXXXXXXXXXXXXXXXX",
					"year": 1111111111111
		        }
		    ],
			caseDate: '2014-09-11T13:00:01Z',

		};

		parseCourt(courts, jsonData);

		expect(jsonData.court).toBe(undefined);

	});

	it("Handle empty citation array", () => {

		let jsonData = {
			fileKey: 'test-undefined-1',
			caseCitations: [],
			caseDate: '2014-09-11T13:00:01Z',
			caseText: 'IN THE NONEXISTENT COURT OF NEW ZEALAND CA237/07'
		};

		parseCourt(courts, jsonData);

		expect(jsonData.court).toBe(undefined);

	});

});
