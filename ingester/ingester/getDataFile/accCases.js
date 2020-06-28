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


	// acc input will be json file (s3? local?)

	// files in s3 bucket in format integer-year.pdf
	// some files in format "integer-year [appellant].pdf" 
	// therefore before s3 request to get the pdf file, need to use:
	// ObjectListing objectListing = s3Client.listObjects(bucketName, "integer-year");
	try {
		let allCases = [];

		const startYear = 1993;
		const endYear = 2019;

		const allYears = [];
		for (var i = startYear; i < endYear + 1; i++) {
			allYears.push(i);
		}

		allCases = await Promise.all(allYears.map(async y => {

			return getJSONFile(process.env.ACC_BUCKET, y + ".json");

		}));


		allCases = await Promise.all(allCases.flat().map(async accItem => {

			const accKey = accItem.file_key_acc.substring(6);

			return {

				fileProvider: "acc",
				fileKey: accItem.file_key_openlaw,
				fileUrl: process.env.ACC_URL + accKey + ".pdf",
				caseNames: [accItem.case_name],
				caseDate: accItem.case_date,
				caseCitations: accItem.citations,
				dateAccessed: new Date(),

			}

		}));


		return allCases;

	}

	catch (ex) {
		console.error("ERROR: accCases.js", ex)
		throw ex;
	}
};
