var mongoose = require('mongoose');

var schema = new mongoose.Schema({
	title: String,
	words: [String],
	difficulty: {type: Number, default: 1}
})

mongoose.model('Wordlist', schema);