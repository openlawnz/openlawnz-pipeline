// const { regNeutralCite, regNeutralCitation, citation_reg, regCourtFillingCitation, regOtherCitation } = require('../../common/regex')

const regNeutralCite = /((?:\[\d{4}\]\s*)(?:(NZACC|NZDC|NZFC|NZHC|NZCA|NZSC|NZEnvC|NZEmpC|NZACA|NZBSA|NZCC|NZCOP|NZCAA|NZDRT|NZHRRT|NZIACDT|NZIPT|NZIEAA|NZLVT|NZLCDT|NZLAT|NZSHD|NZLLA|NZMVDT|NZPSPLA|NZREADT|NZSSAA|NZSAAA|NZTRA|(NZTT\s\w*\w)))(?:\s*(\w{1,8})))/g;


const regNeutralCitation = /([\[|\(]?)(\d{4})([\]|\)]?)\s?(\d*\s)?(SC|RMA|NZELC|NZBLC|NZRA|NZCR|ERNZ|NZELR|IPR|NZCLC|NZRMA|CRNZ|FRNZ|ELRNZ|HRNZ|TCLR|NZAR|PRNZ|NZTRA|NZTR|NZTC|NZACC|ACC|NZDC|NZFC|NZHC|HC|NZCAA|NZCA|NZSC|NZEnvC|NZEmpC|NZACA|NZBSA|NZCCLR|NZCC|NZCOP|NZDRT|NZHRRT|NZIACDT|NZIPT|NZIEAA|NZLVT|NZLCDT|NZLAT|NZSHD|NZLLA|NZMVDT|NZPSPLA|NZREADT|NZSSAA|NZSAAA)/;

// parse neutral citations
const parseNeutralCitation = (item) => {
  const matches = item['citation'].match(regNeutralCitation);
  if (matches && matches[2]) {
    return {
      'id': item['id'],
      ...(item.fileKey ? {fileKey: item.fileKey } : null),
      'citation': item['citation'],
      'year': parseInt(matches[2])
    }
  }
};

const parseYearFromCaseDate = (item) => {
  return {
    'id': item['id'],
    ...(item.fileKey ? {fileKey: item.fileKey } : null),
    'citation': item['citation'],
    'year': parseInt(item['caseDate'].toString().substr(0,4))
  }
};


exports.parseNeutralCitation = (jsonData) => {
    // Neutral citation
    if (jsonData.caseCitations && jsonData.caseCitations.length === 0) {

      const subset = jsonData.caseText.substr(0, 550);

      const citation = subset.match(regNeutralCite);
      // for now, limit to the first citation found (in case double citation appears in header - deal with double citations in header later)
      jsonData.caseCitations = [citation[0]];

    }

    if (!jsonData.caseCitations) {
      console.log("No citations array")
    }
    else if (jsonData.caseCitations.length === 0) {
      console.log("No citation")
    }
    else {


      jsonData.caseCitations = jsonData.caseCitations.map(c => {

        const citationId = c.replace(/(\[|\(|\]|\)|\s|\,)/g, "") // Regex

        // Convert to object
        c = {
          id: citationId,
          citation: c,
          ...(jsonData.fileKey ? {fileKey: jsonData.fileKey } : null),
          caseDate: jsonData.caseDate
        }

        // Get Year

        const parsedNeutralCitation = parseNeutralCitation(c);
        
        if (parsedNeutralCitation) {
          return parsedNeutralCitation;
        }

        return parseYearFromCaseDate(c);

      });

    }
    
    return jsonData;
    
}