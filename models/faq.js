const Sequelize = require('sequelize');
const sequelize = require('../util/database');

const Faq = sequelize.define('faq', {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true
  },
  question: Sequelize.TEXT,
  answer: Sequelize.TEXT
});

module.exports = Tag;
