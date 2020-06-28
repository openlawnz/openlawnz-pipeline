const justicePattern = {
    Court:/\s{2}Court:\s*([a-zA-Z0-9\u00C0-\u02AB ']*)\s+J\s[\r\n\f]*\s/,
    SentencingNote: /\s{2}SENTENCING\sNOTES\sOF\s([a-zA-Z0-9\u00C0-\u02AB ']*)\sJ\s[\r\n\f]*/,
    SentencingRemarks: /\s{2}SENTENCING\sREMARKS\sOF\s{1,2}([a-zA-Z0-9\u00C0-\u02AB ']*)\sJ\s[\r\n\f]*/,
    Judgement: /\s{2}JUDGE?MENT\sOF\s{1,2}([a-zA-Z0-9\u00C0-\u02AB ']*)\sJ\s?[\r\n\f]*/,
    JudgementNo: /\s{2}JUDGE?MENT \(?NO [1-9]\)? OF ([a-zA-Z0-9\u00C0-\u02AB ']*)\sJ\s?[\r\n\f]*/,
    OralJudgement: /\s{2}\(?ORAL\)?\sJUDGE?MENT\sOF\s{1,2}([a-zA-Z0-9\u00C0-\u02AB ']*)\sJ\s[\r\n\f]*/,
    ReservedJudgement: /\s{2}RESERVED JUDGE?MENT OF {1,2}([a-zA-Z0-9\u00C0-\u02AB ']*)\sJ\s[\r\n\f]*/,
    RedactedJudgement: /\s{2}\[?REDACTED\]? JUDGE?MENT OF {1,2}([a-zA-Z0-9\u00C0-\u02AB ']*)\sJ\s[\r\n\f]*/,
    ReasonJudgement: /\s{2}REASONS JUDGE?MENT OF {1,2}([a-zA-Z0-9\u00C0-\u02AB ']*)\sJ\s[\r\n\f]*/,
    ResultJudgement: /\s{2}RESULT JUDGE?MENT OF {1,2}([a-zA-Z0-9\u00C0-\u02AB ']*)\sJ\s[\r\n\f]*/,
    CostsJudgement: /\s{2}\[?COSTS\]? JUDGE?MENT OF {1,2}([a-zA-Z0-9\u00C0-\u02AB ']*)\sJ\s[\r\n\f]*/,
    InterimJudgement: /\s{2}\(?INTERIM\)? JUDGE?MENT OF {1,2}([a-zA-Z0-9\u00C0-\u02AB ']*)\sJ\s[\r\n\f]*/,
    SentencingBy: /\s{2}SENTENCING\sBY\s{1,2}([a-zA-Z0-9\u00C0-\u02AB ']*)\sJ\s[\r\n\f]*/,
    SentenceOf: /\s{2}SENTENCE\sOF\s{1,2}([a-zA-Z0-9\u00C0-\u02AB ']*)\sJ\s[\r\n\f]*/,
    //Sentence: /\s{2}SENTENC(E OF|ING BY)\s{1,2}([a-zA-Z0-9\u00C0-\u02AB ']*)\sJ\s[\r\n\f]*/,
    NotesOnSentence: /\s{2}NOTES\sON\sSENTENCE\sOF\s{1,2}([a-zA-Z0-9\u00C0-\u02AB ']*)\sJ\s[\r\n\f]*/,
    FinalJudgment: /\s{2}FINAL\sJUDGE?MENT\sOF\s{1,2}([a-zA-Z0-9\u00C0-\u02AB ']*)\sJ\s[\r\n\f]*/,
    RulingJudgment: /\s{2}RULING\sOF\s{1,2}([a-zA-Z0-9\u00C0-\u02AB ']*)\sJ\s[\r\n\f]*/,
    ReasonForDecision: /\s{2}REASONS\sFOR\sDECISION\sOF\s{1,2}([a-zA-Z0-9\u00C0-\u02AB ']*)\sJ\s[\r\n\f]*/,
    ReasonForJudgment: /\s{2}REASONS\sFOR\sJUDGMENT\sOF\s{1,2}([a-zA-Z0-9\u00C0-\u02AB ']*)\sJ\s[\r\n\f]*/,
};

const reservedJusticeWords = ["THE COURT", "JUSTICE"];
const reservedJusticeWordsLength = reservedJusticeWords.length;
// const justicePatternBuilder = {};
// for (const prop in justicePattern) {
//     justicePatternBuilder[prop] = new RegExp(`\s{2}${justicePattern[prop]}([a-zA-Z0-9\u00C0-\u02AB ']*)\sJ\s[\r\n\f]*/`) 
// }
//exports.justicePattern = justicePattern;   
const textSeparators = [',', ' AND ']; 
module.exports = (data, judgeTitles) =>
{
    for (var key in justicePattern) {
        var temp = data.match(justicePattern[key]);
        if(temp)
        {
            var tempValue = temp[1].toUpperCase().trim();
            for (const property in judgeTitles) {
                if(judgeTitles[property].short_title !== "CJ" 
                && judgeTitles[property].short_title !== "P"
                && judgeTitles[property].short_title !== "J"
                && (tempValue.startsWith(judgeTitles[property].short_title.toUpperCase())
                ||tempValue.startsWith("ASSOCIATE")))
                    return null;
            }
            //jdo_1536843601000_2d50a4a2-d20a-40db-a987-d6195286ebec.pdf.txt
            var tempValue2 = tempValue.split(new RegExp(textSeparators.join('|'), 'gi'));
            var tempValue2Length = tempValue2.length;
            for(var i = 0; i < tempValue2Length; i++)
            {
                var tempValue2Final = tempValue2[i].trim();
                var proceed = true;
                for (const property in judgeTitles) {
                    //console.log(`${property}: ${object[property]}`);
                    const judgeTitleRegExp = new RegExp(`\^\[a-zA-Z0-9\u00C0-\u02AB\s\']*\\s+${judgeTitles[property].short_title}`);
                    if(tempValue2Final.match(judgeTitleRegExp))
                    {
                        proceed = false;
                    }
                }   
                if(proceed)
                {
                    return { value: [tempValue2Final], valueIndex: temp.index };
                }
            }
            
        }
    }

    //jdo_1540386001000_c39d6368-8c23-48ae-92b2-97653870eff7.pdf.txt
    let justiceCustom1 = data.match(/(19|20)\d{2}\s{1,9}JUDGE?MENT\sOF(\sJUSTICE)?\s{1,2}([a-zA-Z0-9\u00C0-\u02AB ']*)\s\s[\r\n\f]*/);
    if(justiceCustom1)
    {
        if(justiceCustom1[3] != undefined)
        {
            let justiceCustom1Value = justiceCustom1[3].trim().toUpperCase();
            for (const property in judgeTitles) {
                if(judgeTitles[property].short_title !== "CJ" 
                && judgeTitles[property].short_title !== "P"
                && judgeTitles[property].short_title !== "J"
                && justiceCustom1Value.startsWith(judgeTitles[property].short_title.toUpperCase()))
                    return null;
            }
            for(var i = 0; i < reservedJusticeWordsLength; i++)
            {
                if(justiceCustom1Value.startsWith(reservedJusticeWords[i]))
                    return null;
            }  
            return { value: [justiceCustom1Value], valueIndex: justiceCustom1.index };
        }
    }

    return null;
}