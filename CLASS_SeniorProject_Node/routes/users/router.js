const express = require('express');
const passport = require('passport');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const router = express.Router();

const helpers = require('../../helpers/HelperMethods');

require('../../models/users');
var User = mongoose.model('Users');

// Routes
router.get('/login', (req, res) => {
	res.render('users/login');
});

router.get('/register', (req, res) => {
	res.render('users/register');
});

router.get('/logout', function(req, res) {

	req.logout();
	req.flash('success_msg', "Successfully Logged Out!");
	res.redirect('/users/login');
	
});

router.get('/display/:user', (req, res) => {
	User.findOne({name: req.params.user}).then((user) => {
		
		var userData = JSON.parse(JSON.stringify(user));
		var levelsData = [];
		
		for (var i = 0; i < user.levels.length; i++) {
			if (user.levels[i] != undefined) levelsData.push({ level: i, time: helpers.formatTime(user.levels[i]) });
		}
		
		userData.levels = levelsData;
		
		res.render('users/display', userData);
	});
});

// Posts
router.post('/login', (req, res, next) => {
	passport.authenticate('local', {
		successRedirect: '/',
		failureRedirect: '/users/login',
		failureFlash: true
	})(req, res, next);
});

router.post('/register', (req, res) => {
	var errors = [];
	if (req.body.password != req.body.password2) errors.push({text:"Passwords do not match"});
	if (req.body.password.length < 4) errors.push({text:"Password must be at least 4 characters"});

	if (errors.length > 0) {

		req.flash("error_msg", "We have Errors");

		res.render('users/register', {
			errors: errors,
			name: req.body.name,
			password1: req.body.password,
			password2: req.body.password2
		});

	} else {

		User.findOne({name: req.body.username}).then((user) => {

			if (user) {

				req.flash('error_msg', "User Already Exists!");
				res.redirect('/users/register');

			} else {

				var newUser = new User({
					name: req.body.username,
					password: req.body.password,
					score: 0,
					deathCount: 0,
					levels: [],
					admin: true
				});

				bcrypt.genSalt(10, (err, salt) => {

					bcrypt.hash(newUser.password, salt, (err, hash) => {

						if (err) throw err;
						newUser.password = hash;

						newUser.save().then((user) => {
							req.flash('success_msg', "Successfully Registered");
						 	res.redirect('/users/login');
						}).catch((err) => {
							console.log(err);
							return;
						});

					});

				});

			}
		});

	}

});

// Export
module.exports = router;