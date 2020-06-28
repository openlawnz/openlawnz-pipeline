# pdfconverter

* Used in a lambda

## Install

    npm install
    
## Testing

    npm run test
    
The aim with testing is to build a list of PDFs with different formatting that the pdfToJSON code can handle.

## pdfToJSON

This is the module that does the conversion of PDF to JSON using pdfjs.

To run standalone:

    node pdfToJSON.cli.js (url)
    
e.g.

    node pdfToJSON.cli.js https://s3-ap-southeast-2.amazonaws.com/openlawnz-pdfs/jdo_1376398801000_4ffaed38-cd90-4488-a5da-8b1c61829c5e.pdf