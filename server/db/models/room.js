var mongoose = require('mongoose');

var schema = new mongoose.Schema({
	name: String,
	wordlist: { type: mongoose.Schema.Types.ObjectId, ref: 'Wordlist'},
	maxPlayers: Number,
	numRounds: Number,
	roundTime: Number
})

mongoose.model('Room', schema);