const Fuse = require('fuse.js');
const PDFParser = require('pdf2json');
const textract = require('textract');

const { loadData } = require('./src/endpoints/data-loader');

const data = loadData();
const groups = Object.keys(data);

const testFirstPass = rawText => {
  const rawTextLower = rawText.toLowerCase();
  const out = {};

  groups.forEach(group => {
    const keys = data[group];

    keys.forEach(key => {
      const search = rawTextLower.indexOf(key.toLowerCase()) > 0 && key.length > 1;
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

const testSecondPass = text => {
  const out = {};
  const textArray = text
    .replace(/\//g, ',')
    .replace(/\r/g, ',')
    .replace(/\n/g, ',')
    .split(',')
    .map(x => x.trim())
    .filter(x => !!x);

  const fuse = new Fuse(textArray, { includeScore: true });

  groups.forEach(group => {
    const keys = data[group];

    keys.forEach(key => {
      const search = fuse.search(key);
      search.forEach(one => {
        if (one.score < 0.1) {
          if (!out[group]) {
            out[group] = [];
          }

          const ifExists = out[group].indexOf(key);
          if (ifExists < 0 && key.length > 1) {
            out[group].push(key);
          }
        }
      });
    });
  });

  return out;
};

const parseDocFile = async path => new Promise((resolve, reject) => textract
  .fromFileWithPath(path, (error, text) => {
    if (error) {
      return reject(error);
    }

    return resolve(text);
  }));

(async () => {
  // const pdf = './test-examples/Dmytro Bubon - Senior Full-Stack Developer _ Tech Lead (1).pdf';
  // const response = await parseFilePDF(pdf);
  // const match = testFirstPass(response);
  // const match = testSecondPass(response);
  // console.log(match);

  // microsoft word
  const response = await parseDocFile('./test-examples/apolunin_cv.docx');
  const match = testSecondPass(response);

  console.log(match);
})();

// const fuse = new Fuse(data.Backend, options);

// const result = fuse.search('GraphQL');

// console.log(result);
