const axios = require('axios');
const moment = require('moment');

const skillsUrl = 'https://erp.brightgrove.com/ords/erp/cv/getSkills';
const skillsLastUpdateUrl = 'https://erp.brightgrove.com/ords/erp/cv/getSkillLastUpdateDate';

let skills;
let skillsLastUpdate;
let checkLastUpdate;

const loadData = async () => {
  try {
    const { data } = await axios.get(skillsLastUpdateUrl);
    const {
      items: [{ skilllastupdatedate }]
    } = data;

    if (!skillsLastUpdate) {
      skillsLastUpdate = moment(skilllastupdatedate).format('YYYYMMDDHHmm');
    }

    checkLastUpdate = moment(skilllastupdatedate).format('YYYYMMDDHHmm');
  } catch (error) {
    console.error(error);
  }

  if (!skills || checkLastUpdate !== skillsLastUpdate) {
    try {
      const { data } = await axios.get(skillsUrl);
      if (data.items) {
        console.log(`Last skills set was loaded (${data.items.length})`, new Date());
        skills = data.items;
      }
    } catch (error) {
      console.error(error);
    }
  }

  return { skills, skillsLastUpdate };
};

module.exports = {
  loadData
};
