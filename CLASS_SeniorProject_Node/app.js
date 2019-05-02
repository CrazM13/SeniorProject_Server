const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const io = require('socket.io')(process.env.PORT || 5000);
const db = require('./config/database');

const bodyParser = require('body-parser');
const express = require('express');
const exphbs = require('express-handlebars');
const session = require('express-session');
const passport = require('passport');
const flash = require('connect-flash');
const favicon = require('serve-favicon');

const helpers = require('./helpers/HelperMethods');

const app = express();
const port = process.env.PORT || 1222;

// Templating Engine
app.engine('handlebars', exphbs({
	defaultLayout: 'main'
}));
app.set('view engine', 'handlebars');

require('./helpers/handlebar_helpers');

// Sessions
app.use(session({
	secret: "secret",
	resave: true,
	saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

require('./config/passport')(passport);

// Flash
app.use(flash());

app.use((req, res, next) => {
	res.locals.success_msg = req.flash('success_msg');
	res.locals.error_msg = req.flash('error_msg');
	res.locals.error = req.flash('error');
	res.locals.user = req.user || null;
	next();
});

// Body Parser
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

// Mongoose
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
				socket.emit('recieveHighScores', leaderboard);
			});
			
		});
	});

});

async function getLevelLeaderData(level, user) {
	leaderboard.levels[level] = {};

	return User.find({'levels.': { $ne: null }}).sort('-levels[' + level + ']').then((users) => {
		for (var i = 0; i < users.length; i++) {
			if (users[i].levels != undefined && users[i].levels.length > level && users[i].levels[level] >= 0) {
				leaderboard.levels[level].topBestTime = helpers.formatTime(users[i].levels[level]);
				leaderboard.levels[level].topUser = users[i].name;

				break;
			}
		}

		if (leaderboard.levels[level].topUser == undefined) {
			leaderboard.levels[level].topBestTime = helpers.formatTime(-1);
			leaderboard.levels[level].topUser = "...";
		}

		leaderboard.levels[level].userBestTime = helpers.formatTime(user.levels[level]);

	});
}

app.use(express.static(__dirname + "/views"));
app.use(express.static(__dirname + "/public"));

app.use(favicon(__dirname + '/public/images/favicon.ico'));

app.use('/', require('./routes/router'));

app.listen(port, () => {
	console.log("Server is running on port " + port.toString());
});