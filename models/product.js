const Sequelize = require('sequelize');
const sequelize = require('../util/database');

const Product = sequelize.define('product', {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true
  },
  images: Sequelize.JSON,
  name: {type: Sequelize.STRING, allowNull: false},
  brand: Sequelize.STRING,
  description: Sequelize.STRING,
  standard_quantity_selling: Sequelize.FLOAT,
  mrp: Sequelize.FLOAT,
  discount_percentage: {type: Sequelize.INTEGER, defaultValue: 0},
  in_stock: {type:Sequelize.BOOLEAN, defaultValue:true},
  max_quantity: Sequelize.INTEGER,
  tags: Sequelize.STRING,
  views: {type: Sequelize.INTEGER, defaultValue: 0},
  units_sold: {type: Sequelize.INTEGER, defaultValue: 0},
  rating: Sequelize.FLOAT,
  deleted: {type: Sequelize.BOOLEAN, defaultValue: false},
  details: Sequelize.JSON
});

module.exports = Product;
