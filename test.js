// const Fuse = require('fuse.js');
const PDFParser = require('pdf2json');

const { loadData } = require('./src/endpoints/data-loader');

const data = loadData();

const testText = rawText => {
  const rawTextLower = rawText.toLowerCase();
  const groups = Object.keys(data);
  const out = {};

  groups.forEach(group => {
    const keys = data[group];

    keys.forEach(key => {
      const search = rawTextLower.indexOf(key.toLowerCase()) > 0;
      if (search) {
        if (!out[group]) {
          out[group] = [];
        }

        out[group].push(key);
      }
    });
  });

  return out;
};

const parseFilePDF = filePath => new Promise((resolve, reject) => {
  const pdfParser = new PDFParser(this, 1);
  pdfParser.on('pdfParser_dataError', errData => reject(errData.parserError));
  pdfParser.on('pdfParser_dataReady', () => resolve(pdfParser.getRawTextContent()));
  pdfParser.loadPDF(filePath);
});

(async () => {
  const pdf = './test-examples/Dmytro Bubon - Senior Full-Stack Developer _ Tech Lead (1).pdf';
  const response = await parseFilePDF(pdf);
  const match = testText(response);
  console.log(match);
})();

// const fuse = new Fuse(data.Backend, options);

// const result = fuse.search('GraphQL');

// console.log(result);
