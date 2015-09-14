var fs = require('fs');
var path = require('path');
var season = require('season');
var ATOM_HOME = path.join(process.env.HOME, '.atom');

if (fs.existsSync(path.join(ATOM_HOME, 'config.cson.bak'))) {
    throw new Error('backup exists, stopping, you might want to restore it!');
}

var config = season.readFileSync(path.join(ATOM_HOME, 'config.cson'));
// Store a backup
season.writeFileSync(path.join(ATOM_HOME, 'config.cson.bak'), config);

var disabledPackages = config['*'].core.disabledPackages;

var requiredPackages = require('./package.json')['package-deps'];
fs.readdirSync(path.join(ATOM_HOME, 'packages')).forEach(function(package) {
    if (requiredPackages.indexOf(package) === -1 && disabledPackages.indexOf(package) === -1 && package !== "atom-typescript" && package !== "omnisharp-atom") {
        disabledPackages.push(package);
    }
});

season.writeFileSync(path.join(ATOM_HOME, 'config.cson'), config);
