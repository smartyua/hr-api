const fs = require('fs');
const path = require('path');
const axios = require('axios');
const _ = require('lodash');
const { findPhoneNumbersInText } = require('libphonenumber-js');
// const Fuse = require('fuse.js');
const PDFParser = require('pdf2json');
const mammoth = require('mammoth');
const pdf = require('html-pdf');
const striptags = require('striptags');

const { loadData } = require('./data-loader');
const logger = require('../../logger');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const extractEmail = text => {
  let email = '';
  /* eslint-disable no-control-regex */
  /* eslint-disable max-len */
  const emailReg = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;
  /* eslint-enable max-len */
  /* eslint-enable no-control-regex */

  const checkEmail = text.match(emailReg);
  if (checkEmail && checkEmail[0]) {
    [email] = checkEmail;
  }

  return email;
};

const extractPhoneRegExp = text => {
  let phone = '';
  /* eslint-disable no-control-regex */
  /* eslint-disable max-len */
  const phoneReg = /(?:(?:\+?([1-9]|[0-9][0-9]|[0-9][0-9][0-9])\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([0-9][1-9]|[0-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\s*(?:[.-]\s*)?([0-9]{4})(?:\s*(?:#|x\.?|ext\.?|extension)\s*(\d+))?/;
  /* eslint-enable max-len */
  /* eslint-enable no-control-regex */

  const phoneCheck = text.match(phoneReg);
  if (phoneCheck && phoneCheck[0]) {
    [phone] = phoneCheck;
  }

  phone = phone.replace(/\D/g, '');

  if (phone.length < 10) {
    return null;
  }

  if (phone.indexOf('380') < 0 || phone.indexOf('38') < 0) {
    return `+380${phone.replace(/ /g, '').replace(/-/g, '')}`;
  }

  return phone;
};

const extractPhone = text => {
  const phones = findPhoneNumbersInText(text, 'UA');

  if (phones && phones.length) {
    const phone = phones[0].number.formatNational().replace(/ /g, '');
    return `+38${phone}`;
  }

  return extractPhoneRegExp(text);
};

const textParse1 = ({ text: rawText, skills }) => {
  const rawTextLower = rawText.toLowerCase();
  const out = [];

  skills.forEach(({ id, name: key }) => {
    const searchKey = key.toLowerCase();
    const search = ([
      // rawTextLower.includes(` ${searchKey}`) && key.length > 1,
      rawTextLower.includes(` ${searchKey},`) && key.length > 1,
      rawTextLower.includes(` ${searchKey}.`) && key.length > 1
    ]).filter(x => !!x);

    if (search.length) {
      out.push({ id, name: key });
    }
  });

  return out;
};

const extractName = (text = '') => {
  let data = text;
  if (text.includes('</p><p>')) {
    data = text.replace(/<\/p><p>/g, '\n');
  }

  const rows = data.split('\n').map(x => striptags(x).trim());
  let firstName;
  let lastName;

  rows.forEach((row, index) => {
    const lowerRow = row.toLowerCase();
    const words = lowerRow.split(' ');

    if (index < 3) {
      if (words.length === 2
        && lowerRow.indexOf('ukraine') < 0
        && lowerRow.indexOf('email') < 0
      ) {
        [firstName, lastName] = row.split(' ');
      }
    }
    return false;
  });

  return { firstName, lastName };
};

const parseFilePDF = filePath => new Promise((resolve, reject) => {
  const pdfParser = new PDFParser(this, 1);
  pdfParser.on('pdfParser_dataError', errData => reject(errData.parserError));
  pdfParser.on('pdfParser_dataReady', () => resolve(pdfParser.getRawTextContent()));
  pdfParser.loadPDF(filePath);
});

const getLinkedinLink = text => {
  const regex = /([A-z:.]+)?linkedin\.com\/in\/([A-zАя_-]+)-([0-9a-z]+)/gi;
  const result = text.match(regex);

  if (result && result[0]) {
    const name = result[0].split('/')
      .pop()
      .split('-')
      .slice(0, 2)
      .map(x => _.upperFirst(x));

    return {
      name,
      firstName: name[0] || null,
      lastName: name[1] || null,
      link: result[0]
    };
  }

  // https://www.linkedin.com/in/yaroslava-reshetylo-a598262a/
  // https://www.linkedin.com/in/yaroslava-reshetylo/

  return {};
};

const mutateParagraphs = text => {
  const textArray = text
    .replace(/\r/g, '')
    .replace(/\n/g, '')
    .replace(/\(/g, ' ')
    .replace(/,/g, ' ,')
    .replace(/www\./g, ' www.');
    // .split(',')
    // .map(x => x.trim())
    // .filter(x => !!x);

  return textArray;
};

const checkBGERP = async ({ fullName, phone, email }) => {
  const headers = {
    name: fullName
  };

  if (phone) {
    headers.phone = phone;
  }

  if (email) {
    headers.email = email;
  }

  const url = 'https://erp.brightgrove.com/ords/erp/cv/getCandidates';
  const response = await axios.get(url, { headers });
  const candidates = _.get(response, 'data.items');
  return candidates;
};

const matchCV = async (req, res, next) => {
  try {
    const { files, body } = req;
    const { text: bodyText, fullName } = body;
    const { skills, skillsLastUpdate } = await loadData();

    if (!files && !bodyText) {
      throw new Error('File or text are absent in request');
    }

    let text = '';
    let candidates;
    let cvLink;
    const out = {};

    if (files) {
      const [uploadItem] = files;
      const { originalname, path: filePath } = uploadItem;
      let filename = filePath;
      let newName = originalname
        .replace(/\s+/g, '-')
        .replace(/[^0-9_a-zA-Z_.-]/g, '');

      const type = newName
        .split('.')
        .pop()
        .toLowerCase();

      if (type === 'doc' || type === 'docx') {
        newName = newName
          .replace('.docx', '.pdf')
          .replace('.doc', '.pdf');

        const newFilename = path.resolve('', 'storage', newName);

        await mammoth.convertToHtml({ path: filename })
          .then(({ value }) => value)
          .then(html => {
            text = html;
            return pdf.create(html, { format: 'Letter' })
              .toFile(newFilename, (err, result) => {
                if (err) {
                  logger.error(err);
                  return false;
                }

                logger.info(result.filename);
                return true;
              });
          });

        filename = newFilename;
      }

      const fileLink = path.resolve('', 'storage', newName);
      cvLink = `/storage/${newName}`;

      fs.writeFileSync(fileLink, fs.readFileSync(filename));

      if (type === 'pdf') {
        text = await parseFilePDF(filename);
      }

      if (type === 'txt') {
        text = fs.readFileSync(filename, 'utf-8');
      }
    }

    if (bodyText) {
      text = bodyText;
    }

    // out.fuzzy = textParse2({ text, skills });
    out.match = textParse1({ text, skills });

    let { firstName = '', lastName = '' } = extractName(text);
    let phoneCV = extractPhone(text);
    let emailCV = extractEmail(text);

    if (fullName) {
      candidates = await checkBGERP({
        email: emailCV,
        fullName,
        phone: phoneCV
      });
    }

    if (candidates && candidates.length === 1) {
      const candidate = candidates[0];
      const { phone, name, email } = candidate;
      phoneCV = phone;
      emailCV = email;
      const fio = name.split(' ').map(x => x.trim());
      if (fio && fio[0]) {
        [firstName] = fio;
      }

      if (fio && fio[1]) {
        [, lastName] = fio;
      }
    }

    let linkedIn;

    const LIData = getLinkedinLink(mutateParagraphs(text));
    if (Object.keys(LIData)) {
      if (!firstName && LIData.firstName) {
        firstName = LIData.firstName;
      }

      linkedIn = LIData.link;

      if (!lastName && LIData.lastName) {
        lastName = LIData.lastName;
      }
    }

    return res.json({
      skillsLastUpdate,
      candidates,
      cvLink,
      firstName: firstName && firstName.length > 3 ? firstName.trim() : null,
      lastName: lastName && lastName.length > 3 ? lastName.trim() : null,
      linkedIn,
      phone: phoneCV,
      email: emailCV,
      ...out
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  matchCV,
  textParse1
};
