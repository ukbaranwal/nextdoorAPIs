var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
  res.send('<html>Welcome to Next Door</html>');
});

module.exports = router;
