var fs = require('fs');
var path = require('path');
var season = require('season');
var ATOM_HOME = path.join(process.env.HOME, '.atom');

if (!fs.existsSync(path.join(ATOM_HOME, 'config.cson.bak'))) {
    throw new Error('backup does not exist, stopping, you might want to backup first!');
}

var config = season.readFileSync(path.join(ATOM_HOME, 'config.cson.bak'));
season.writeFileSync(path.join(ATOM_HOME, 'config.cson'), config);
fs.unlinkSync(path.join(ATOM_HOME, 'config.cson.bak'));
