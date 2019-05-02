const handlebars = require('handlebars');

handlebars.registerHelper("add", (obj1, obj2, options) => {
    return new handlebars.SafeString(obj1 + obj2);
});

module.exports = handlebars;