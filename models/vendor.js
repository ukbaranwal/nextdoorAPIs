const Sequelize = require('sequelize');
const sequelize = require('../util/database');

const Vendor = sequelize.define('vendor', {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true
  },
  vendor_type: Sequelize.INTEGER,
  image_url: Sequelize.STRING,
  name: {type: Sequelize.STRING, allowNull: false},
  shop_name: Sequelize.STRING,
  email: {type: Sequelize.STRING, allowNull: false},
  phone: {type: Sequelize.STRING, allowNull: false},
  address: Sequelize.TEXT,
  city: Sequelize.STRING,
  password: {type: Sequelize.STRING, allowNull: false},
  shop_open: {type: Sequelize.BOOLEAN, defaultValue: false},
  opt_for_delivery_boy: Sequelize.BOOLEAN,
  no_of_ratings: {type: Sequelize.INTEGER, defaultValue: 0},
  rating: {type: Sequelize.FLOAT, defaultValue: 0},
  deleted: {type: Sequelize.BOOLEAN, defaultValue: false},
  rating_stars: {type: Sequelize.JSON, defaultValue:[0,0,0,0,0]}, //[1,3,8,9,10]
  ban: {type: Sequelize.BOOLEAN, defaultValue: false},
  verified: {type: Sequelize.BOOLEAN, defaultValue: false},
  local_store: Sequelize.BOOLEAN,
  upi_id: Sequelize.STRING,
  paytm_no: Sequelize.STRING,
  location_lat: Sequelize.STRING,
  location_long: Sequelize.STRING,
  tags: Sequelize.STRING,
  membership_active: {type: Sequelize.BOOLEAN, defaultValue: true},
  payable: {type: Sequelize.FLOAT, defaultValue: 0},
  delivery_boy: Sequelize.INTEGER,
  owns_store: Sequelize.BOOLEAN, 
  reset_password_token: Sequelize.STRING,
  reset_password_time: Sequelize.DATE,
  opening_time: Sequelize.STRING,
  closing_time: Sequelize.STRING,
  device_id: Sequelize.STRING,
  firebase_token: Sequelize.STRING,
  banners: Sequelize.JSON
});

module.exports = Vendor;
