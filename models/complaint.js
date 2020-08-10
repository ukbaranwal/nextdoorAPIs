const Sequelize = require('sequelize');
const sequelize = require('../util/database');

const Complaint = sequelize.define('complaint', {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true
  },
  complaint: Sequelize.STRING
});

module.exports = Complaint;
