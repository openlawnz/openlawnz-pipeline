const associateJudgePattern = {
	JudgementOf:/\s{2}JUDGMENT\sOF\sASSOCIATE\sJUDGE\s([a-zA-Z0-9\u00C0-\u02AB ']*)\s[\r\n\f]*/,
	AssociateJudge:/\s{2}ASSOCIATE\sJUDGE\s([a-zA-Z0-9\u00C0-\u02AB ']*)\s[\r\n\f]*/,
	CostsJudgement:/\s{2}COSTS? JUDGE?MENT\sOF\sASSOCIATE\sJUDGE\s([a-zA-Z0-9\u00C0-\u02AB ']*)\s[\r\n\f]*/,
	OralJudgement:/\s{2}ORAL JUDGE?MENT\sOF\sASSOCIATE\sJUDGE\s([a-zA-Z0-9\u00C0-\u02AB ']*)\s[\r\n\f]*/,
	ReservedJudgment:/\s{2}RESERVED JUDGE?MENT\sOF\sASSOCIATE\sJUDGE\s([a-zA-Z0-9\u00C0-\u02AB ']*)\s[\r\n\f]*/,
	ReissuedJudgment:/\s{2}REISSUED JUDGE?MENT\sOF\sASSOCIATE\sJUDGE\s([a-zA-Z0-9\u00C0-\u02AB ']*)\s[\r\n\f]*/,
	RedactedJudgement: /\s{2}\[?REDACTED\]? JUDGE?MENT OF ASSOCIATE\sJUDGE\s([a-zA-Z0-9\u00C0-\u02AB ']*)\s[\r\n\f]*/,
	InterlocutoryJudgment:/\s{2}INTERLOCUTORY JUDGE?MENT\sOF\sASSOCIATE\sJUDGE\s([a-zA-Z0-9\u00C0-\u02AB ']*)\s[\r\n\f]*/,
	ReasonForJudgment:/\s{2}REASONS FOR JUDGE?MENT\sOF\sASSOCIATE\sJUDGE\s([a-zA-Z0-9\u00C0-\u02AB ']*)\s[\r\n\f]*/,
	JudgementNo: /\s{2}JUDGE?MENT \(N[O|o][.| ][1-9]\) OF ASSOCIATE JUDGE ([a-zA-Z0-9\u00C0-\u02AB ']*)\s[\r\n\f]*/,
};
exports.associateJudgePattern =  associateJudgePattern;