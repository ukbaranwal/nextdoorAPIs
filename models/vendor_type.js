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
  service: Sequelize.STRING,
  delivery_boy_needed: Sequelize.BOOLEAN,
  store_needed: Sequelize.BOOLEAN,
  image_url: Sequelize.STRING
});

module.exports = VendorType;
