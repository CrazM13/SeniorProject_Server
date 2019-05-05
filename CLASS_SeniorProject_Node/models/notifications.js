const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var NotificationSchema = new Schema({

	recipient: {
		type: String,
		required: true
	},
	sender: {
		type: String,
		required: true	
	},
	message: {
		type: String,
		required: true
	},
	unread: {
		type: Boolean,
		default: true
	}

});

mongoose.model('Notifications', NotificationSchema);