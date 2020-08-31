const AWS = require('aws-sdk');
const cloudfront = new AWS.CloudFront();

exports.handler = async(event) => {

	const environment = event.Input.environment;

	if (!environment) {
		console.log("No environment passed in");
		return;
	}

	const distributions = await cloudfront.listDistributions({}).promise();

	const distributionsWithTags = (await Promise.all(distributions.DistributionList.Items.map(async d => {

		const data = await cloudfront.listTagsForResource({
			Resource: d.ARN
		}).promise();

		return {
			Id: d.Id,
			Tags: data.Tags.Items
		}

	}))).filter(d => d.Tags.find(t => t.Key == "environment" && t.Value == environment));

	await Promise.all(distributionsWithTags.map(async d => {

		await cloudfront.createInvalidation({
			DistributionId: d.Id,
			InvalidationBatch: {
				CallerReference: 'pipeline' + (+new Date()),
				Paths: {
					Quantity: 1,
					Items: [
		 				'/*'
		 			]
				}
			}
		}).promise();

	}))


};
