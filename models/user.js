const Sequelize = require('sequelize');
const sequelize = require('../util/database');

const User = sequelize.define('user', {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true
  },
  name: {type: Sequelize.STRING, allowNull: false},
  email: {type: Sequelize.STRING, allowNull: false},
  phone: {type: Sequelize.STRING, allowNull: false},
  city: Sequelize.STRING,
  password: {type: Sequelize.STRING, allowNull: false},
  deleted: {type: Sequelize.BOOLEAN, defaultValue: false},
  ban: {type: Sequelize.BOOLEAN, defaultValue: false},
  location_lat: Sequelize.STRING,
  location_long: Sequelize.STRING,
  reset_password_token: Sequelize.STRING,
  reset_password_time: Sequelize.DATE,
  address: Sequelize.JSON,//{"id":1, "name":"Utkarsh Baranwal", "address":"B14/418", "postcode":241235, "city":"Kalyani", "Landmark":"Near Penguin Park", "contact":7355972739}
  wallet_balance: {type:Sequelize.FLOAT, defaultValue:0},
  cart: {type:Sequelize.JSON, defaultValue:[]},//{product_id:1, quantity:2}
  device_id: Sequelize.STRING,
  firebase_token: Sequelize.STRING
});

module.exports = User;
