const Sequelize = require('sequelize');
const sequelize = require('../util/database');

const VendorType = sequelize.define('vendor_type', {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true
  },
  name: {type: Sequelize.STRING, allowNull: false},
  service: {type:Sequelize.BOOLEAN, defaultValue: false},
  selling: {type:Sequelize.BOOLEAN, defaultValue: false},
  delivery_boy_needed: Sequelize.BOOLEAN,
  store_needed: Sequelize.BOOLEAN,
  image_url: Sequelize.TEXT
});

module.exports = VendorType;
