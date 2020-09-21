var express = require('express');
var router = express.Router();
const fs = require('fs');
const path = require('path');

router.get('/', function (req, res, next) {
  res.send('<html>Welcome to Next Door</html>');
});
/* GET home page. */
router.get('/terms', (req, res, next)=>{
  res.sendFile(path.join(__dirname,'..','terms_and_conditions.html'));
});



module.exports = router;
