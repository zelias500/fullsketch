'use strict';
var router = require('express').Router();
module.exports = router;
var _ = require('lodash');
var mongoose = require('mongoose');
var Wordlist = mongoose.model('Wordlist');

router.get('/', function(req, res, next){
	Wordlist.find().then(function(wordlists){
		res.status(200).json(wordlists);
	})
})