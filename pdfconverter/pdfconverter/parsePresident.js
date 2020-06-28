const presidentPattern = {
	CourtPresident:/\s{2}Court:\s*([a-zA-Z0-9\u00C0-\u02AB ']*)\s+P[,]?\s/
};
exports.presidentPattern = presidentPattern;