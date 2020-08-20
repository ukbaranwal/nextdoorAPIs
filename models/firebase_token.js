const Sequelize = require('sequelize');
const sequelize = require('../util/database');

const VendorFirebaseToken = sequelize.define('vendor_firebase_token', {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true
  },
  device_id: Sequelize.STRING,
  firebase_token: Sequelize.STRING,
});

module.exports = VendorFirebaseToken;
