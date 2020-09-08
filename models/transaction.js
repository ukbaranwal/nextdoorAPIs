// product_details json
const Sequelize = require('sequelize');
const sequelize = require('../util/database');

const Transaction = sequelize.define('transaction', {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true
  },
  amount: {type: Sequelize.FLOAT, allowNull: false},
  reference_no: {type: Sequelize.STRING, allowNull: false},
  method: Sequelize.STRING,
  is_success: Sequelize.BOOLEAN,
  details: Sequelize.JSON
  });

module.exports = Transaction;
