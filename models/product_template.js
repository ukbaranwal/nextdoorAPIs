const Sequelize = require('sequelize');
const sequelize = require('../util/database');

const ProductTemplate = sequelize.define('product_template', {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true
  },
  images: Sequelize.JSON,
  name: {type: Sequelize.STRING, allowNull: false},
  brand: Sequelize.STRING,
  description: Sequelize.TEXT,
  standard_quantity_selling: Sequelize.FLOAT,
  mrp: Sequelize.FLOAT,
  tags: Sequelize.STRING
});

module.exports = ProductTemplate;
