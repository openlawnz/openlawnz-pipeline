module.exports = (jsonData) => {

    let filingNumber;

    let regs = [
        /\(?DCA\s?\d*\s?\/\s?\d*\)?/i,
        /(Decision\sNo\.?\s+\d+\s?(?:\/\s+|\s+)\d{0,4})|(DCA\sNo\.?\s\d+(?:\/|\s+)\d{0,4})/im
    ];
    
    for (let i = 0; i < regs.length; i++) {
        
        // do the initial regex match
        let matches = jsonData.caseText.match(regs[i]);
        
        if (matches && matches[0]) {
            // trim whitespace
            filingNumber = matches[0].trim();
            filingNumber = filingNumber.replace(/\n/ig,'').replace(/\s+/g,'').replace(/[a-z]|\.|\(|\)/ig,'');
            

            if(filingNumber && filingNumber.includes('/')) {
                filingNumber = filingNumber.split('/')[0];
                console.log(filingNumber)
                jsonData.filingNumber = filingNumber;
                return filingNumber;
            }
        }
    } 

}
