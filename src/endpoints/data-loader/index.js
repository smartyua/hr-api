const path = require('path');
const fs = require('fs');

const basePath = path.resolve('', 'seed-skills');

const data = {};

const loadData = () => {
  if (Object.keys(data).length > 0) {
    return data;
  }

  console.log(`Read seed data - ${basePath}`);
  const files = fs.readdirSync(basePath);

  files.forEach(file => {
    const group = file.split('.').shift();
    const list = fs.readFileSync(`${basePath}/${file}`, 'utf-8')
      .split('\n')
      .map(x => x.trim())
      .filter(x => !!x);

    data[group] = list;
  });

  return data;
};

module.exports = {
  loadData
};
