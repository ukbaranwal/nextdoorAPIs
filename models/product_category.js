const Sequelize = require('sequelize');
const sequelize = require('../util/database');

const ProductCategory = sequelize.define('product_category', {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true
  },
  name: {type: Sequelize.STRING, allowNull: false},
  parent_id: {type: Sequelize.INTEGER, defaultValue:0},
  tags: Sequelize.STRING,
  quantity_by_weight: {type:Sequelize.BOOLEAN, defaultValue: false},
  quantity_by_piece: {type:Sequelize.BOOLEAN, defaultValue: false},
  image_url: Sequelize.TEXT,
  have_color_variants: {type: Sequelize.BOOLEAN, defaultValue: false},
  have_size_variants: {type: Sequelize.BOOLEAN, defaultValue:false }
});

module.exports = ProductCategory;
