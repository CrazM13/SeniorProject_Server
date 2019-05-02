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
	deathCount: {
		type: Number,
		required: true,
		default: 0
	},
	levels: [
		{
			type: Number,
			required: false
		}
	],
	admin: {
		type: Boolean,
		required: false,
		default: false
	}

});

mongoose.model('Users', UserSchema);