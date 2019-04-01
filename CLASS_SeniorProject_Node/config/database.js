if (process.env.NODE_ENV === 'production') {
	module.exports = { mongoURI: 'mongodb+srv://crazm13:crazymusic1222@cluster0-44txz.mongodb.net/test?retryWrites=true' }
} else {
	module.exports = { mongoURI: 'mongodb://localhost:27017/seniorprojectdata' }
}