var fs = require('fs'), path = require('path');
if (fs.existsSync(path.resolve(__dirname, 'lib/omnisharp-atom.js'))) {
    module.exports = require(path.join(__dirname, 'lib/omnisharp-atom'));
} else {
    module.exports = require(path.join(__dirname, 'dist/omnisharp-atom'));
}
