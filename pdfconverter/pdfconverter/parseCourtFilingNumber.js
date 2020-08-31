const commonRegex = require("openlawnz-common/regex.js");

module.exports = (jsonData) => {

    let filingNumber;

    let regs = [
        /((CIV|CHCH|CRI|CIR|WN|AK|CIVP|CA|SC)[\s|\-|\.|:|CA|SC]\s?(\d{4})((\-|\s?)\d*(\-|\s)\d*))|(CIV|CHCH|CRI|CIR|WN|AK|CIVP|CA|SC)([\s|\-|\.|:|CA|SC])?\s?(\d{1,3}\/\d{0,4})/i, // TODO: Fix typo in common
        /\(?(DCA|ACR)\s?\d*\s?\/\s?\d*\)?/i,
        /(Decision\s*No\.?\s*\d+\s*\d+\s*\/\s*)\d{0,4}|(DCA\s*No\.?\s*\d+(?:\/|\s*)\d{0,4})/im
    ];

    for (let i = 0; i < regs.length; i++) {

        // do the initial regex match
        let matches = jsonData.caseText.match(regs[i]);

        if (matches && matches[0]) {
            // trim whitespace

            filingNumber = matches[0];
            filingNumber = filingNumber.replace(/\n/ig, '').replace(/[a-z]|\.|\(|\)/ig, '');

            if (filingNumber && filingNumber.includes('/')) {

                // Remove all whitespace
                filingNumber = filingNumber.replace(/\s+/g, '');

                jsonData.filingNumber = filingNumber;
                return filingNumber;
            }
            else {
                // If no slash then will be long format string - trim whitespace at end only (might have whitespace inside string)
                jsonData.filingNumber = filingNumber.trim();
                return filingNumber.trim();
            }
        }
    }

}
