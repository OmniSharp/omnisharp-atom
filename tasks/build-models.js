var fs = require('fs');
var _ = require('lodash');
var modelLocations = ['./node_modules/omnisharp-server-roslyn-binaries/omnisharp-roslyn/src/OmniSharp/Models', './node_modules/omnisharp-server-roslyn-binaries/omnisharp-roslyn/src/OmniSharp.Stdio/Protocol'];
var models = [];
var genericModels = [];

var dictionaryRegex = /IDictionary<(.*?), (.*?)>/;
var listRegex = /IList<(.*?)>/;
var collectionRegex = /ICollection<(.*?)>/;
var enumerableRegex = /IEnumerable<(.*?)>/;

var getterSetterRegex = /^\s*public (.*?) \{ get; set; \}/;
var getterRegex = /^\s*public (.*?) \{ get/;
var filepathRegex = /^\s*public string FileName$/;

var inheritsRegex = /class .*? \: (.*?)$/;

function inferPropertyType(property) {
    var dictionary = property.match(dictionaryRegex);
    if (dictionary) {
        return '{ [ key: '+dictionary[1]+' ]: '+dictionary[2]+' }';
    }
    var array = property.match(listRegex) || property.match(collectionRegex) || property.match(enumerableRegex);
    if (array) {
        return array[1] + '[]';
    }
    if (property === 'Stream')
        return 'T';

    if (property === 'object')
        return 'T';

    if (property === 'Guid' || property === 'char')
        return 'string';

    if (property === 'bool')
        return 'boolean';

    if (property === 'int' || property === 'int?')
        return 'number';

    if (property === "TestCommandType")
        return 'any';

    return property;
}

module.exports = function() {
    modelLocations.forEach(function(modelLocation) {
        var namespace = modelLocation.split('/');
        namespace = namespace[namespace.length - 1];
        var files = fs.readdirSync(modelLocation);

        files.forEach(function(file) {
            if (file.indexOf('.cs') === -1) {
                return;
            }

            var properties = [];
            var isGenericModel = false;

            var name = file.replace('.cs','.d.ts');
            var modelName = name.replace('.d.ts', '');
            var content = fs.readFileSync(modelLocation + '/' + file).toString('utf-8').split('\n');
            var inheritsFrom = '';

            while (content.length) {
                var row = content.shift();
                var result = row.match(getterSetterRegex) || row.match(getterRegex) || (row.match(filepathRegex) && ['', 'string FileName']);
                if (result) {
                    var property = result[1].split(' ');

                    var propertyName = property.pop();
                    propertyName = propertyName;
                    var type = property.join(' ');

                    var propertyType = inferPropertyType(type);
                    if (propertyType === false)
                        continue;

                    if (propertyType === "T") {
                        isGenericModel = true;
                    }

                    if (_.endsWith(propertyName, "Stream")) {
                        propertyName = propertyName.substr(0, propertyName.length - "Stream".length);
                    }

                    properties.push(propertyName + (_.endsWith(type, '?') ? '?' : '?') + ': ' + propertyType);
                }

                var inherits = row.match(inheritsRegex);
                if (inherits) {
                    inheritsFrom = inherits[1];
                    if (inheritsFrom .indexOf('IComparable') > -1)
                        inheritsFrom = '';
                }
            }

            var lines = [];
            lines.push('interface ' + modelName + (isGenericModel && '<T>' || '') + (inheritsFrom && ' extends ' + inheritsFrom || '') +' {');
            properties.forEach(function(property) {
                lines.push('    ' + property + ';');
            });
            lines.push('}');
            lines.name = namespace;

            models.push(lines);
        });
    });

    var fileContent = 'declare module OmniSharp {\n';
    _.each(_.groupBy(models, function(x) { return x.name; }), function(items, name) {
        fileContent += '    module ' + name + ' {\n';
        items.forEach(function(model) {
            fileContent += model.map(function(z) { return '        ' + z; }).join('\n') + '\n\n';
        });

        fileContent += '    }\n';
    });
    fileContent += '\n}\n';

    fs.writeFileSync('./lib/models.d.ts', fileContent);
};
