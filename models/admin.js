const Sequelize = require('sequelize');
const sequelize = require('../util/database');

const Admin = sequelize.define('admin', {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true
  },
  name: {type: Sequelize.STRING, allowNull: false},
  email: {type: Sequelize.STRING, allowNull: false},
  phone: {type: Sequelize.STRING, allowNull: false},
  address: Sequelize.STRING,
  city: Sequelize.STRING,
  image_url: Sequelize.TEXT,
  password: {type: Sequelize.STRING, allowNull: false},
  root_access: {type: Sequelize.BOOLEAN, defaultValue: false},
  device_id: Sequelize.STRING
});

module.exports = Admin;
