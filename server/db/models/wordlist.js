var mongoose = require('mongoose');

var schema = new mongoose.Schema({
	title: String,
	words: [String]
})

mongoose.model('Wordlist', schema);