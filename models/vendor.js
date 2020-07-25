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
  address: Sequelize.STRING,
  city: Sequelize.STRING,
  password: {type: Sequelize.STRING, allowNull: false},
  shop_open: Sequelize.BOOLEAN,
  opt_for_delivery_boy: Sequelize.BOOLEAN,
  no_of_ratings: Sequelize.INTEGER,
  rating: Sequelize.FLOAT,
  deleted: Sequelize.BOOLEAN,
  ban: Sequelize.BOOLEAN,
  verified: Sequelize.BOOLEAN,
  local_store: Sequelize.BOOLEAN,
  upi_id: Sequelize.STRING,
  paytm_no: Sequelize.STRING,
  location_lat: Sequelize.STRING,
  location_long: Sequelize.STRING,
  tags: Sequelize.STRING,
  membership_active: Sequelize.BOOLEAN,
  payable: Sequelize.FLOAT,
  delivery_boy: Sequelize.INTEGER,
  owns_store: Sequelize.BOOLEAN, 
  reset_password_token: Sequelize.STRING,
  reset_password_time: Sequelize.DATE,
  opening_time: Sequelize.STRING,
  closing_time: Sequelize.STRING
});

module.exports = Vendor;
