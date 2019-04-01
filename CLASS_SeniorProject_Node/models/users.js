const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var UserSchema = new Schema({

	name: {
		type: String,
		required: true
	},
	password: {
		type: String,
		required: true
	},
	score: {
		type: Number,
		required: true
	},
	levels: [
		{
			type: Number,
			required: false
		}
	]

});

mongoose.model('Users', UserSchema);