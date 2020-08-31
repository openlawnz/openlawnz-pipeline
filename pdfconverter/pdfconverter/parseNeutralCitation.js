// const { regNeutralCite, regNeutralCitation, citation_reg, regCourtFillingCitation, regOtherCitation } = require('../../common/regex')

const regNeutralCite = /((?:\[\d{4}\]\s*)(?:(NZACC|NZDC|NZFC|NZHC|NZCA|NZSC|NZEnvC|NZEmpC|NZACA|NZBSA|NZCC|NZCOP|NZCAA|NZDRT|NZHRRT|NZIACDT|NZIPT|NZIEAA|NZLVT|NZLCDT|NZLAT|NZSHD|NZLLA|NZMVDT|NZPSPLA|NZREADT|NZSSAA|NZSAAA|NZTRA|(NZTT\s\w*\w)))(?:\s*(\w{1,8})))|(CA\s?\d+\/\d+)/g;

const regNeutralCitation = /([\[|\(]?)(\d{4})([\]|\)]?)\s?(\d*\s)?(SC|RMA|NZELC|NZBLC|NZRA|NZCR|ERNZ|NZELR|IPR|NZCLC|NZRMA|CRNZ|FRNZ|ELRNZ|HRNZ|TCLR|NZAR|PRNZ|NZTRA|NZTR|NZTC|NZACC|ACC|NZDC|NZFC|NZHC|HC|NZCAA|NZCA|NZSC|NZEnvC|NZEmpC|NZACA|NZBSA|NZCCLR|NZCC|NZCOP|NZDRT|NZHRRT|NZIACDT|NZIPT|NZIEAA|NZLVT|NZLCDT|NZLAT|NZSHD|NZLLA|NZMVDT|NZPSPLA|NZREADT|NZSSAA|NZSAAA)|(CA\s?\d+\/\d+)/;

const otherCite = /((\[\d{4}\])(\s*)NZ(D|F|H|C|S|L)(A|C|R)(\s.*?)(\d+))|((HC|DC|FC) (\w{2,4} (\w{3,4}).*)(?=\s\d{1,2} ))|(COA)(\s.{5,10}\/\d{4})|(SC\s\d{0,5}\/\d{0,4})/;

exports.parseNeutralCitation = (jsonData) => {


  // if there's no caseCitations array (even if empty) then the input object is invalid
  if (!jsonData.caseCitations) {
    console.error("No citations array")
  }

  // Neutral citation
  // If there's no citations, then find one in the text and make an array
  else if (jsonData.caseCitations.length === 0) {

    const subset = jsonData.caseText.substr(0, 550);

    const citation = subset.match(regNeutralCite);
    // for now, limit to the first citation found (in case double citation appears in header - deal with double citations in header later)
    if (citation && citation[0]) {
      jsonData.caseCitations = [citation[0]];
    }

    //else if the regNeutralCite didnt work use regOtherCitation()

    //else if still nothing, then move on (error)

  }

  if (jsonData.caseCitations.length === 0) {
    throw new Error("No caseCitations in array");
  }
  else {

    jsonData.caseCitations = jsonData.caseCitations.map(c => {



      const citationId = c.replace(/[^a-zA-Z\d\-]/g, "") // Regex

      // Convert to object

      let citationObj = {
        id: citationId,
        citation: c,
        fileKey: jsonData.fileKey,
        caseDate: jsonData.caseDate
      }

      // Get Year

      const matches = citationObj.citation.match(regNeutralCitation);

      if (matches && matches[2]) {
        citationObj.year = parseInt(matches[2])
      }
      else {

        citationObj.year = parseInt(citationObj.caseDate.toString().substr(0, 4));
      }

      return citationObj;


    });

  }



  return jsonData;

}
