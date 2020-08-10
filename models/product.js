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
  description: Sequelize.TEXT,
  standard_quantity_selling: Sequelize.FLOAT,
  mrp: Sequelize.FLOAT,
  discount_percentage: {type: Sequelize.INTEGER, defaultValue: 0},
  in_stock: {type:Sequelize.BOOLEAN, defaultValue:true},
  max_quantity: Sequelize.INTEGER,
  tags: Sequelize.STRING,
  views: {type: Sequelize.INTEGER, defaultValue: 0},
  units_sold: {type: Sequelize.INTEGER, defaultValue: 0},
  rating: Sequelize.FLOAT,
  no_of_rating: {type: Sequelize.INTEGER, defaultValue: 0},
  deleted: {type: Sequelize.BOOLEAN, defaultValue: false},
  details: Sequelize.JSON,
  template_used: {type: Sequelize.BOOLEAN, defaultValue: false},
  is_primary: {type: Sequelize.BOOLEAN, defaultValue:true},
  size_variants: Sequelize.JSON,//{[{size: XL, mrp:999, discount_percentage:23}, {size: XL, mrp:999, discount_percentage:23}]}
  color_variants: Sequelize.JSON,//{[{product_id:1, value: hexcode}, {product_id:2, value:hexcode}]}
  related_products: Sequelize.JSON//{[1,2,3,4]}
});

module.exports = Product;
