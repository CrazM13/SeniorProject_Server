const express = require('express');
const passport = require('passport');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const router = express.Router();

const helpers = require('../helpers/HelperMethods');

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

router.use('/users', require('./users/router'));
router.use('/runs', require('./runs/router'));

async function getLeaderboardData(level) {
    leaderboard.levels[level] = {};

	return User.find({'levels.': { $ne: null }}).then((users) => {
        leaderboard.levels[level].users = [];
        var index = 0;
		for (var i = 0; i < users.length; i++) {
            if (users[i].levels != undefined && users[i].levels.length > level && users[i].levels[level] >= 0) {
                leaderboard.levels[level].users[index] = {};

                leaderboard.levels[level].users[index].name = users[i].name;
                leaderboard.levels[level].users[index].time = helpers.formatTime(users[i].levels[level]);
                leaderboard.levels[level].users[index].timeVal = users[i].levels[level];

                index++;
            }
        }

        leaderboard.levels[level].users.sort((a, b) => {
            return parseFloat(a.timeVal) - parseFloat(b.timeVal);
        });
    });
}

module.exports = router;