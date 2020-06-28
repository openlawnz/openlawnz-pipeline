module.exports.insertSlash = function(citation, insertString) {
	var first = citation.substring(0, 4);
	var second = citation.substring(4);
	return first + insertString + second;
};

// https://hackernoon.com/accessing-nested-objects-in-javascript-f02f1bd6387f
module.exports.getNestedObject = (nestedObj, pathArr) => {
	return pathArr.reduce(
		(obj, key) => (obj && obj[key] !== 'undefined' ? obj[key] : undefined),
		nestedObj
	);
};

module.exports.getCitation = function(str) {
	const regCite = /(\[?\d{4}\]?)(\s*?)NZ(D|F|H|C|S|L)(A|C|R)(\s.*?)(\d+)*/;
	// try for neutral citation
	if (str.match(regCite)) {
		return str.match(regCite)[0];
	} else {
		// try for other types of citation
		const otherCite = /((\[\d{4}\])(\s*)NZ(D|F|H|C|S|L)(A|C|R)(\s.*?)(\d+))|((HC|DC|FC) (\w{2,4} (\w{3,4}).*)(?=\s\d{1,2} ))|(COA)(\s.{5,10}\/\d{4})|(SC\s\d{0,5}\/\d{0,4})/;
		if (str.match(otherCite)) {
			return str.match(otherCite)[0];
		} else {
			return null;
		}
	}
};