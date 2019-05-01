const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

require('../models/users');
const User = mongoose.model('Users');

module.exports = function(passport) {
	passport.use(new LocalStrategy({usernameField: 'username'}, function(username, password, done) {
		User.findOne({
			name: username
		}).then(function(user) {
			if (!user) {
				return done(null, false, {message:"No User Found"});
			}

			bcrypt.compare(password, user.password, function(err, isMatch) {
				if(err) throw err;

				if (isMatch) {
					return done(null, user);
				} else {
					return done(null, false, {message:"Password incorrect"});
				}

			});

		});
	}));

	passport.serializeUser(function(user, done) {
		done(null, user.id);
	});

	passport.deserializeUser(function(id, done) {
		User.findById(id, function(err, user) {
			done(err, user);
		});
	});
}