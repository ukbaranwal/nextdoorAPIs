const Sequelize = require('sequelize');
const sequelize = require('../util/database');

const Banner = sequelize.define('banner', {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true
  },
  banner_url: Sequelize.STRING,
});

module.exports = Banner;
