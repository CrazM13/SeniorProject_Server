const handlebars = require('handlebars');

handlebars.registerHelper("add", (obj1, obj2, options) => {
	return new handlebars.SafeString(obj1 + obj2);
});

handlebars.registerHelper("preview", (message) => {
   var newMessage = "";
   
	for (var i = 0; i < 10; i++) {
		newMessage = message[i];
	}
   
	return new handlebars.SafeString(newMessage);
   
});

module.exports = handlebars;