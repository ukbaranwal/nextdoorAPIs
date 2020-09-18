const Sequelize = require('sequelize');
const sequelize = require('../util/database');

const Complaint = sequelize.define('complaint', {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true
  },
  complaint: Sequelize.TEXT,
  contact_info: Sequelize.STRING,
  reason: Sequelize.TEXT
});

module.exports = Complaint;
