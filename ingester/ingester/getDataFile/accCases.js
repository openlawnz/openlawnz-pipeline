const urlAdapter = require("./generic/url");
const helpers = require('../common/functions');

const AWS = require("aws-sdk");
const s3 = new AWS.S3();

const getJSONFile = async(bucket, key) => {

	try {
		let raw = await s3.getObject({
			Bucket: bucket,
			Key: key
		}).promise();
		return JSON.parse(raw.Body.toString());
	}
	catch (ex) {
		return null;
	}
};

module.exports = async() => {

	/*
	{
		"file_provider": "",
		"file_key_nzlii": "",
		"file_key_openlaw": "",
		"file_key_acc": "/2001/1-2001",
		"case_name": "",
		"case_date": "",
		"citations": [],
		"url": ""
	},

	*/

	try {
		let allCases = [];

		const startYear = 1993; // 1993
		const endYear = 2019;

		const allYears = [];
		for (var i = startYear; i < endYear + 1; i++) {
			allYears.push(i);
		}

		allCases = await Promise.all(allYears.map(async y => {

			return getJSONFile(process.env.BUCKET_ACC, y + ".json");

		}));

		allCases = await Promise.all(allCases.flat().map(accItem => {

			const accKey = accItem.file_key_acc.substring(6);

			return {

				fileProvider: "acc",
				fileKey: accItem.file_key_openlaw,
				fileUrl: '',
				meta: {
					s3Cache: {
						bucket: process.env.BUCKET_ACC_CACHE,
						objectKey: accKey + ".pdf"
					}
				},
				caseNames: [accItem.case_name],
				caseDate: accItem.case_date,
				caseCitations: accItem.citations,
				dateAccessed: new Date(),

			}

		}));


		return allCases

	}

	catch (ex) {
		console.error("ERROR: accCases.js", ex)
		throw ex;
	}
};
