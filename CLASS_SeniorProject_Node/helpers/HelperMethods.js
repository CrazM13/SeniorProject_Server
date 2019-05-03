const FileReader = require('filereader');

module.exports = {
    formatTime: function(timeFloat) {

        if (timeFloat < 0) return "--:--.--";
        if (timeFloat > 594000) return "\u221e";
    
        timeFloat = Math.round(timeFloat * 100);
    
        var sec = Math.round(timeFloat / 100);
        var min = Math.round(sec / 60);
        sec %= 60;
        var dec = timeFloat % 100;
    
        return "" + (min > 9 ? min : "0" + min) + ":" + (sec > 9 ? sec : "0" + sec) + "." + (dec > 9 ? dec : "0" + dec);
    },
    getBase64: function (file) { // Source: Joshua Paling | https://stackoverflow.com/questions/36280818/how-to-convert-file-to-base64-in-javascript
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }
};