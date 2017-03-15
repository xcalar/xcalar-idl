fs = require('fs');
_ = require('underscore');

ctorVersion = 2; // be used in constructor.js
var src = "site/scripts/template/constructor.template.js";
var dest = genDest(ctorVersion);


function genCtor() {
    var str = fs.readFileSync(src).toString();
    var template = _.template(str);
    var parsedStr = template();
    // comment starats with ! will not be removed by grunt htmlmin
    parsedStr = "/* !!This file is autogenerated. Please do not modify */\n" +
                 parsedStr;
    fs.writeFileSync(dest, parsedStr);
    console.log("generate", dest);
}

function genDest(version) {
    if (version > 26) {
        throw "version too large";
    }
    var str = "ABCDEFGHIJKLMNOPQRETUVWXYZ";
    var ch = (version < 2) ? "" : str[version - 2];
    return "assets/js/constructor/D" + ch +
           "_persConstructorV" + version + ".js";
}

module.exports = genCtor;
