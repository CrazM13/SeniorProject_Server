const express = require('express');
const passport = require('passport');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const router = express.Router();

const helpers = require('../../helpers/HelperMethods');

require('../../models/users');
var User = mongoose.model('Users');

require('../../models/notifications');
var Notification = mongoose.model('Notifications');

var invalidationOptions = ["Run Is Impossable", "Run Used Cheats", "Run Was A TAS"];

// Routes
router.get('/invalidate/:user/:level', (req, res) => {
	var data = {};
	
	User.findOne({name: req.params.user}).then((user) => {
		data.user = user.name;
		data.level = user.levels[req.params.level];
		data.levelNum = req.params.level;
		data.options = invalidationOptions;
		
		res.render('runs/invalidate', data);
	});
	
});

// Posts
router.post('/invalidate/:user/:level', (req, res) => {
	
	var notification = {};
	
	notification.recipient = req.params.user;
	
	var message = "" + req.params.user + ", you're run on level " + req.params.level + " has been deemed invaled for the reason: ";
	
	if (req.body.reason != "other") {
		message += invalidationOptions[req.body.reason];
	} else {
		message += req.body.other_reason;
	}
	
	notification.message = message;
	notification.sender = req.user.name;
	
	new Notification(notification).save().then(() => {
		User.findOne({name: req.params.user}).then((user) => {
			
			user.levels[req.params.level] = -1;
			
			user.save().then(() => {
				res.redirect("/leaderboard");
			});
		});
	});
	
});

// Export
module.exports = router;