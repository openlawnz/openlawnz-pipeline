// This is to generate a safety hash for running prod

const crypto = require('crypto')

const algorithm = "aes-192-cbc"; //algorithm to use
const text = "ok"; //text to be encrypted
const iv = Buffer.alloc(16, 0);

const genKey = () => {
	const date = new Date();
	const password = date.getUTCFullYear().toString() + date.getUTCMonth().toString() + date.getUTCDate().toString() + date.getUTCHours().toString() + date.getUTCMinutes().toString();
	return crypto.scryptSync(password, 'salt', 24);
};

const generateHash = () => {
	const cipher = crypto.createCipheriv(algorithm, genKey(), iv);
	var encrypted = cipher.update(text, 'utf8', 'hex') + cipher.final('hex'); // encrypted text
	return encrypted;
};

const validateHash = (hash) => {
	try {
		const decipher = crypto.createDecipheriv(algorithm, genKey(), iv);
		var decrypted = decipher.update(hash, 'hex', 'utf8') + decipher.final('utf8'); //deciphered text
		return decrypted === text;
	}
	catch (ex) {
		return false;
	}
};

module.exports.generateHash = generateHash;
module.exports.validateHash = validateHash;
