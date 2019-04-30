const express = require('express');
const passport = require('passport');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const router = express.Router();

require('../models/users');
var User = mongoose.model('Users');

var leaderboard = {levels:[]};

router.get('/', (req, res) => {
	res.render('index');
});

router.get('/leaderboard', (req, res) => {
    var promises = [];

    for (var i = 0; i < 10; i++) {
        promises.push(getLeaderboardData(i));
    }

    Promise.all(promises).then(() => {
        res.render('leaderboard', leaderboard);
    });
});

async function getLeaderboardData(level) {
    leaderboard.levels[level] = {};

	return User.find({'levels.': { $ne: null }}).sort('-levels[' + level + ']').then((users) => {
        leaderboard.levels[level].users = [];
        var index = 0;
		for (var i = 0; i < users.length; i++) {
            if (users[i].levels != undefined && users[i].levels.length > level && users[i].levels[level] >= 0) {
                leaderboard.levels[level].users[index] = {};

                leaderboard.levels[level].users[index].name = users[i].name;
                leaderboard.levels[level].users[index].time = formatTime(users[i].levels[level]);

                index++;
            }
		}
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

module.exports = router;