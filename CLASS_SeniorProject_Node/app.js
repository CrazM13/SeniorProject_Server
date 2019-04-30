const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const io = require('socket.io')(process.env.PORT || 5000);
const db = require('./config/database');

mongoose.connect(db.mongoURI, {
	useNewUrlParser: true
}).then(() => {
	console.log("MongoDB Connected");
}).catch((err) => {
	console.log(err);
});

require('./models/users');
var User = mongoose.model('Users');

var leaderboard = {levels: []};

io.on('connection', (socket) => {
	
	User.findOne({name: "tmpTestUser"}).then((defaultUser) => {
		if (!defaultUser) {
			var newUser = {
				name: "tmpTestUser",
				password: "nilnull",
				score: 0,
				deathCount: 0,
				levels: []
			}
			new User(newUser).save();
		}
	});

	socket.emit('connected');
	
	socket.on('requestData', (data) => {
		console.log("requestData", JSON.stringify(data, null, 4));
		
		User.findOne({ name: data.user }).then((user) => {
			socket.emit('retrieveData', user);
		});
	});
	
	socket.on('updateScore', (data) => {
		console.log("updateScore", JSON.stringify(data, null, 4));
		
		User.findOne({ name: data.user }).then((user) => {
			user.score = data.score;
			
			user.save();
		});
	});
	
	socket.on('updateDeathCount', (data) => {
		console.log("updateDeathCount", JSON.stringify(data, null, 4));

		User.findOne({ name: data.user }).then((user) => {
			user.deathCount = data.deathCount;

			user.save();
		});
	});
	
	socket.on('updateBestTime', (data) => {
		console.log("updateBestTime", JSON.stringify(data, null, 4));
		
		User.findOne({ name: data.user }).then((user) => {
			if (user.levels.length > data.level) user.levels[data.level] = data.time;
			else {
				for (var i = user.levels.length; i < data.level; i++) {
					user.levels.push(-1);
				}
				user.levels.push(data.time);
			}

			user.save();
		});
	});
	
	socket.on('checkUserAvailablity', (data) => {
		console.log(JSON.stringify(data, null, 4));

		User.findOne({ name: data.user }).then((user) => {
			socket.emit('checkUserAvailablityResult', { result: user == null });
		});
	});
	
	socket.on('attemptLogin', (data) => {
		console.log(JSON.stringify(data, null, 4));
		var success = false;
		
		User.findOne({name: data.user}).then((user) => {
			bcrypt.compare(data.password, user.password, (err, isMatch) => {
				if (err) success = false;

				if (isMatch) {
					success = true;
				} else {
					success = false;
				}
				
				socket.emit('loginResult', { result: success, user: user.name });
			});
		});
	});
	
	socket.on('attemptRegister', (data) => {
		console.log(JSON.stringify(data, null, 4));
		var success = false;
		
		var user = data.user;
		var password = data.password;
		
		User.findOne({name: user}).then((userFound) => {
			if (userFound == null) {
				success = true;
				
				var newUser = {
					name: user,
					password: "",
					score: 0,
					deathCount: 0,
					levels: []
				}
				
				bcrypt.genSalt(10, (err, salt) => {
					bcrypt.hash(password, salt, (err, hash) => {
						if (err) success = false;
						newUser.password = hash;

						new User(newUser).save().then((newUserAccount) => {
							socket.emit('registerResult', { result: success, user: newUserAccount.name });
						});
					});
				});
			}
		});
	});
	
	socket.on("getHighScores", (data) => {

		User.findOne({name: data.user}).then((user) => {

			var promises = [];

			for (var i = 0; i < user.levels.length; i++) {
				promises.push(getLevelLeaderData(i, user));
			}

			Promise.all(promises).then(() => {
				console.log(JSON.stringify(leaderboard, null, 4));
			});
			
		});
	});

});

async function getLevelLeaderData(level, user) {
	leaderboard.levels[level] = {};

	return User.find({'levels.': { $ne: null }}).sort('-levels[' + level + ']').then((users) => {
		for (var i = 0; i < users.length; i++) {
			if (users[i].levels != undefined && users[i].levels.length > level && users[i].levels[level] >= 0) {
				leaderboard.levels[level].topBestTime = formatTime(users[i].levels[level]);
				leaderboard.levels[level].topUser = users[i].name;

				break;
			}
		}

		leaderboard.levels[level].userBestTime = formatTime(user.levels[level]);

	});
}

function formatTime(timeFloat) {

	if (timeFloat < 0) return "--:--.--";
	if (timeFloat > 594000) return "\u221e";

	timeFloat = Math.round(timeFloat * 100);

	var sec = Math.round(timeFloat / 100);
	var min = Math.round(sec / 60);
	sec %= 60;
	var dec = timeFloat % 100;

	return "" + (min > 9 ? min : "0" + min) + ":" + (sec > 9 ? sec : "0" + sec) + "." + (dec > 9 ? dec : "0" + dec);
}