const Sequelize = require('sequelize');
const sequelize = require('../util/database');

const Notification = sequelize.define('notification', {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true
  },
  title: Sequelize.STRING,
  body: Sequelize.STRING,
  action: Sequelize.STRING
});

module.exports = Notification;
