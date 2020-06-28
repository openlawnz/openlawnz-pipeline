const Fuse = require('fuse.js')

const options = {
    isCaseSensitive: false,
    includeScore: true,
    shouldSort: true,
    includeMatches: false,
    findAllMatches: false,
    threshold: 0.3,
  };

const locationList = ["Alexandra","Ashburton","Auckland","Blenheim","Chatham Islands","Christchurch","Dannevirke","Dargaville","Dunedin","Gisborne","Gore","Greymouth","Hamilton","Hastings","Hawera","Huntly","Hutt Valley","Invercargill","Kaikohe","Kaikoura","Kaitaia","Levin","Manukau","Marton","Ohakune","Masterton","Morrinsville","Napier","Nelson","New Plymouth","North Shore","Oamaru","Opotiki","Palmerston North","Papakura","Porirua","Pukekohe","Queenstown","Rotorua","Ruatoria","Taihape","Taumarunui","Taupo","Tauranga","Te Awamutu","Te Kuiti","Thames","Timaru","Tokoroa","Waihi","Waipukurau","Wairoa","Waitakere","Wellington","Westport","Whakatane","Whanganui","Whangarei"]
const fuse = new Fuse(locationList, options)

module.exports = (jsonData) => {

    let caseLocation;

    let regs = [
        /NEW ZEALAND\s+(.*)\sREGISTRY/,
        /HELD\sAT(.*\n)/,
        /DISTRICT C.*\n(.*)\sREGISTRY/,
        /THE \w+ COURT\sAT\s(.*)\n/,
        /IN\sTHE\s[A-Z\s]+(?:OF|AT)\s(^(?!an).*)[\r\n]+/i,
        /IN THE COURT OF APPEAL OF ([A-Z\s]+)[\r\n]+/i,
        /(?:IN|BEFORE)\sTHE\s[A-Z\s]{0,17}(?:OF|AT|Decision.+\nAT|DCA.+\nAT|'|.\sAT)\s?(.*)[\r\n]+/i,
        /(?:IN|BEFORE)\sTHE\s[A-Z\s]{0,17}(?:Decision.+\n)(.*)(?:REGISTRY)/i
    ];

    function replaceAll(str,regex){
        var re = new RegExp(Object.keys(regex).join("|"),"gi");
        return str.replace(re, function(matched){
            return regex[matched];
        });
    }

    for (let i = 0; i < regs.length; i++) {

        // do the initial regex match
        let matches = jsonData.caseText.match(regs[i]);
        
        if (matches && matches[1]) {
            // trim whitespace
            initialExtract = matches[1].trim();

            const locationMatch = fuse.search(initialExtract)
            if(locationMatch.length > 0) {
                console.log(locationMatch[0].item)
                caseLocation = locationMatch[0].item;
                break
            }
        }
    } 

    jsonData.caseLocation = caseLocation;
    return caseLocation; 


}