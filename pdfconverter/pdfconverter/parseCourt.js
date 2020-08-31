/**
 * find acronyms row by citation from acronyms list
 *
 * @param acronymList, e.g [{ acronym: 'ERNZ', category: 'Employment', court_id: 17 }]
 * @param citation, e.g '[2019] ERNZ 9/2011'
 * @returns {*}
 */
const findAcronymItemByCitation = (courts, citation) => {
    return courts.find(court => court.acronyms.find((item) => {
        // should not use str.includes(), coz if acronym='HC' with match citation: [2014] NZHC 2750
        let regCitation = /(?:[\[|\(])(?:[12][0-9]{3})(?:[\]|\)])\s?(?:\d*\s)?([a-zA-Z]{2,7})/;
        let match = citation.match(regCitation);
        // console.log('found', match)
        if (!match || !match[1]) {
            // console.log('not found, trying SC XX/XX');
            regCitation = /([\w]{2,4})\s[\d\w]{1,6}\/(?:[12][0-9]{3})/;
            // parse citations like :
            // SC 109/2010
            // SC 9/2011
            // COA CA314/2012
            match = citation.match(regCitation);
        }
        if (!match || !match[1]) {
            // console.log('still not found, trying format HC PMN');
            regCitation = /([\w]{2})(?:\s+[\w]{2,4})?\s(?:CIV|CRI)?/i;
            // parse citations like :
            // HC PMN CIV-2004-454-670
            // HC HAM CIV-2009-419-136
            // HC AK CIV 2010-404-3074
            match = citation.match(regCitation);
        }
        if (match && match[1]) {
            // console.log('found and good to go', match[1])
            return !!match[1] && match[1] === item.toUpperCase();
        }
        return false;

    }));
};

const getCourtNameByCaseText = (caseText) => {
    // parse court_name from case_text
    let regexCourtName = /IN\sTHE\s([\s|A-Z]+)OF\s([\s|A-Z]+)/i;
    if (caseText) {
        let match = caseText.match(regexCourtName);
        if (!match || !match[1]) {
            regexCourtName = /IN\sTHE\s(HIGH COURT)OF\s([\s|A-Z]+)/i;
            match = caseText.match(regexCourtName);
        }
        if (match && match[1]) {
            return match[1].trim();
        }
    }
    return null;
};

const parseCourt = (courts, jsonData) => {

    //wrapped in if - was error if no citation
    let foundCourt;
    if (jsonData.caseCitations && jsonData.caseCitations[0] && jsonData.caseCitations[0].citation != '') {
        foundCourt = findAcronymItemByCitation(courts, jsonData.caseCitations[0].citation);
    }

    if (foundCourt) {

        jsonData.court = foundCourt;

        return;

    }

    const foundCourtText = getCourtNameByCaseText(jsonData.caseText);

    if (foundCourtText) {

        const foundCourt = courts.find(c => c.name.toLowerCase() === foundCourtText.toLowerCase());

        if (foundCourt) {
            jsonData.court = foundCourt;
        }

        return;

    }

    console.error("No matching court. Filekey: ", jsonData.fileKey);


};

exports.findAcronymItemByCitation = findAcronymItemByCitation;
exports.getCourtNameByCaseText = getCourtNameByCaseText;
exports.parseCourt = parseCourt;
