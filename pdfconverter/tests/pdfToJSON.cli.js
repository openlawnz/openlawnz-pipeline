const { processPDF } = require("./pdfToJSON");

const myArgs = process.argv.slice(2);

(async () => {
    
    const result = await processPDF(myArgs[0]);
    
    console.log(result);
    
})(); 