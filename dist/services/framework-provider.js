'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _jquery = require('jquery');

var _lodash = require('lodash');

var _rxjs = require('rxjs');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var filter = require('fuzzaldrin').filter;
var frameworkCache = new Map();
function fetchFrameworkFromGithub(framework) {
    if (frameworkCache.has(framework)) {
        return _rxjs.Observable.of(frameworkCache.get(framework));
    }
    var result = (0, _jquery.ajax)('https://raw.githubusercontent.com/OmniSharp/omnisharp-nuget/resources/frameworks/' + framework.toLowerCase() + '.json').then(function (res) {
        return JSON.parse(res);
    });
    return _rxjs.Observable.fromPromise(result);
}
function makeSuggestion(item, replacementPrefix) {
    var type = 'package';
    return {
        _search: item,
        text: item,
        snippet: item,
        type: type,
        displayText: item,
        replacementPrefix: replacementPrefix,
        className: 'autocomplete-project-json'
    };
}
var nameRegex = /\/((?:dnx|net)[0-9]{2,3})\/frameworkAssemblies$/;
var versionRegex = /\/((?:dnx|net)[0-9]{2,3})\/frameworkAssemblies\/([a-zA-Z0-9\._]*?)(?:\/version)?$/;

var NugetNameProvider = function () {
    function NugetNameProvider() {
        _classCallCheck(this, NugetNameProvider);

        this.fileMatchs = ['project.json'];
    }

    _createClass(NugetNameProvider, [{
        key: 'getSuggestions',
        value: function getSuggestions(options) {
            var framework = options.path.match(nameRegex)[1];
            return fetchFrameworkFromGithub(framework).map(_lodash.keys).map(function (z) {
                return z.map(function (x) {
                    return makeSuggestion(x, options.replacementPrefix);
                });
            }).map(function (s) {
                return filter(s, options.prefix, { key: '_search' });
            }).toPromise();
        }
    }, {
        key: 'pathMatch',
        value: function pathMatch(path) {
            return path && !!path.match(nameRegex);
        }
    }, {
        key: 'dispose',
        value: function dispose() {}
    }]);

    return NugetNameProvider;
}();

var NugetVersionProvider = function () {
    function NugetVersionProvider() {
        _classCallCheck(this, NugetVersionProvider);

        this.fileMatchs = ['project.json'];
    }

    _createClass(NugetVersionProvider, [{
        key: 'getSuggestions',
        value: function getSuggestions(options) {
            var match = options.path.match(versionRegex);
            var framework = match[1];
            var name = match[2];
            return fetchFrameworkFromGithub(framework).map(function (x) {
                return [makeSuggestion(x[name], options.replacementPrefix)];
            }).toPromise();
        }
    }, {
        key: 'pathMatch',
        value: function pathMatch(path) {
            return path && !!path.match(versionRegex);
        }
    }, {
        key: 'dispose',
        value: function dispose() {}
    }]);

    return NugetVersionProvider;
}();

var providers = [new NugetNameProvider(), new NugetVersionProvider()];
module.exports = providers;
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9zZXJ2aWNlcy9mcmFtZXdvcmstcHJvdmlkZXIudHMiXSwibmFtZXMiOlsiZmlsdGVyIiwicmVxdWlyZSIsImZyYW1ld29ya0NhY2hlIiwiTWFwIiwiZmV0Y2hGcmFtZXdvcmtGcm9tR2l0aHViIiwiZnJhbWV3b3JrIiwiaGFzIiwib2YiLCJnZXQiLCJyZXN1bHQiLCJ0b0xvd2VyQ2FzZSIsInRoZW4iLCJKU09OIiwicGFyc2UiLCJyZXMiLCJmcm9tUHJvbWlzZSIsIm1ha2VTdWdnZXN0aW9uIiwiaXRlbSIsInJlcGxhY2VtZW50UHJlZml4IiwidHlwZSIsIl9zZWFyY2giLCJ0ZXh0Iiwic25pcHBldCIsImRpc3BsYXlUZXh0IiwiY2xhc3NOYW1lIiwibmFtZVJlZ2V4IiwidmVyc2lvblJlZ2V4IiwiTnVnZXROYW1lUHJvdmlkZXIiLCJmaWxlTWF0Y2hzIiwib3B0aW9ucyIsInBhdGgiLCJtYXRjaCIsIm1hcCIsInoiLCJ4IiwicyIsInByZWZpeCIsImtleSIsInRvUHJvbWlzZSIsIk51Z2V0VmVyc2lvblByb3ZpZGVyIiwibmFtZSIsInByb3ZpZGVycyIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiI7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7OztBQUNBLElBQU1BLFNBQVNDLFFBQVEsWUFBUixFQUFzQkQsTUFBckM7QUFFQSxJQUFNRSxpQkFBaUIsSUFBSUMsR0FBSixFQUF2QjtBQUVBLFNBQUFDLHdCQUFBLENBQWtDQyxTQUFsQyxFQUFtRDtBQUMvQyxRQUFJSCxlQUFlSSxHQUFmLENBQW1CRCxTQUFuQixDQUFKLEVBQW1DO0FBQy9CLGVBQU8saUJBQVdFLEVBQVgsQ0FBeUNMLGVBQWVNLEdBQWYsQ0FBbUJILFNBQW5CLENBQXpDLENBQVA7QUFDSDtBQUdELFFBQU1JLFNBQVMsd0dBQXlGSixVQUFVSyxXQUFWLEVBQXpGLFlBQXlIQyxJQUF6SCxDQUE4SDtBQUFBLGVBQU9DLEtBQUtDLEtBQUwsQ0FBV0MsR0FBWCxDQUFQO0FBQUEsS0FBOUgsQ0FBZjtBQUVBLFdBQU8saUJBQVdDLFdBQVgsQ0FBdUROLE1BQXZELENBQVA7QUFDSDtBQW1CRCxTQUFBTyxjQUFBLENBQXdCQyxJQUF4QixFQUFzQ0MsaUJBQXRDLEVBQStEO0FBQzNELFFBQU1DLE9BQU8sU0FBYjtBQUVBLFdBQU87QUFDSEMsaUJBQVNILElBRE47QUFFSEksY0FBTUosSUFGSDtBQUdISyxpQkFBU0wsSUFITjtBQUlIRSxjQUFNQSxJQUpIO0FBS0hJLHFCQUFhTixJQUxWO0FBTUhDLDRDQU5HO0FBT0hNLG1CQUFXO0FBUFIsS0FBUDtBQVNIO0FBRUQsSUFBTUMsWUFBWSxpREFBbEI7QUFDQSxJQUFNQyxlQUFlLG1GQUFyQjs7SUFFQUMsaUI7QUFBQSxpQ0FBQTtBQUFBOztBQVVXLGFBQUFDLFVBQUEsR0FBYSxDQUFDLGNBQUQsQ0FBYjtBQUtWOzs7O3VDQWR5QkMsTyxFQUFxQztBQUN2RCxnQkFBTXhCLFlBQVl3QixRQUFRQyxJQUFSLENBQWFDLEtBQWIsQ0FBbUJOLFNBQW5CLEVBQThCLENBQTlCLENBQWxCO0FBRUEsbUJBQU9yQix5QkFBeUJDLFNBQXpCLEVBQ0YyQixHQURFLGVBRUZBLEdBRkUsQ0FFRTtBQUFBLHVCQUFLQyxFQUFFRCxHQUFGLENBQU07QUFBQSwyQkFBS2hCLGVBQWVrQixDQUFmLEVBQWtCTCxRQUFRWCxpQkFBMUIsQ0FBTDtBQUFBLGlCQUFOLENBQUw7QUFBQSxhQUZGLEVBR0ZjLEdBSEUsQ0FHRTtBQUFBLHVCQUFLaEMsT0FBT21DLENBQVAsRUFBVU4sUUFBUU8sTUFBbEIsRUFBMEIsRUFBRUMsS0FBSyxTQUFQLEVBQTFCLENBQUw7QUFBQSxhQUhGLEVBSUZDLFNBSkUsRUFBUDtBQUtIOzs7a0NBRWdCUixJLEVBQVk7QUFDekIsbUJBQU9BLFFBQVEsQ0FBQyxDQUFDQSxLQUFLQyxLQUFMLENBQVdOLFNBQVgsQ0FBakI7QUFDSDs7O2tDQUNhLENBQVk7Ozs7OztJQUc5QmMsb0I7QUFBQSxvQ0FBQTtBQUFBOztBQVVXLGFBQUFYLFVBQUEsR0FBYSxDQUFDLGNBQUQsQ0FBYjtBQUtWOzs7O3VDQWR5QkMsTyxFQUFxQztBQUN2RCxnQkFBTUUsUUFBUUYsUUFBUUMsSUFBUixDQUFhQyxLQUFiLENBQW1CTCxZQUFuQixDQUFkO0FBQ0EsZ0JBQU1yQixZQUFZMEIsTUFBTSxDQUFOLENBQWxCO0FBQ0EsZ0JBQU1TLE9BQU9ULE1BQU0sQ0FBTixDQUFiO0FBRUEsbUJBQU8zQix5QkFBeUJDLFNBQXpCLEVBQ0YyQixHQURFLENBQ0U7QUFBQSx1QkFBSyxDQUFDaEIsZUFBZWtCLEVBQUVNLElBQUYsQ0FBZixFQUF3QlgsUUFBUVgsaUJBQWhDLENBQUQsQ0FBTDtBQUFBLGFBREYsRUFFRm9CLFNBRkUsRUFBUDtBQUdIOzs7a0NBRWdCUixJLEVBQVk7QUFDekIsbUJBQU9BLFFBQVEsQ0FBQyxDQUFDQSxLQUFLQyxLQUFMLENBQVdMLFlBQVgsQ0FBakI7QUFDSDs7O2tDQUNhLENBQVk7Ozs7OztBQUc5QixJQUFNZSxZQUFZLENBQUMsSUFBSWQsaUJBQUosRUFBRCxFQUF3QixJQUFJWSxvQkFBSixFQUF4QixDQUFsQjtBQUNBRyxPQUFPQyxPQUFQLEdBQWlCRixTQUFqQiIsImZpbGUiOiJsaWIvc2VydmljZXMvZnJhbWV3b3JrLXByb3ZpZGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgYWpheCB9IGZyb20gJ2pxdWVyeSc7XHJcbmltcG9ydCB7IGtleXMgfSBmcm9tICdsb2Rhc2gnO1xyXG5pbXBvcnQgeyBPYnNlcnZhYmxlIH0gZnJvbSAncnhqcyc7XHJcbmNvbnN0IGZpbHRlciA9IHJlcXVpcmUoJ2Z1enphbGRyaW4nKS5maWx0ZXI7XHJcblxyXG5jb25zdCBmcmFtZXdvcmtDYWNoZSA9IG5ldyBNYXA8c3RyaW5nLCB7IFtrZXk6IHN0cmluZ106IHN0cmluZyB9PigpO1xyXG5cclxuZnVuY3Rpb24gZmV0Y2hGcmFtZXdvcmtGcm9tR2l0aHViKGZyYW1ld29yazogc3RyaW5nKSB7XHJcbiAgICBpZiAoZnJhbWV3b3JrQ2FjaGUuaGFzKGZyYW1ld29yaykpIHtcclxuICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5vZjx7IFtrZXk6IHN0cmluZ106IHN0cmluZyB9PihmcmFtZXdvcmtDYWNoZS5nZXQoZnJhbWV3b3JrKSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gR2V0IHRoZSBmaWxlIGZyb20gZ2l0aHViXHJcbiAgICBjb25zdCByZXN1bHQgPSBhamF4KGBodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vT21uaVNoYXJwL29tbmlzaGFycC1udWdldC9yZXNvdXJjZXMvZnJhbWV3b3Jrcy8ke2ZyYW1ld29yay50b0xvd2VyQ2FzZSgpfS5qc29uYCkudGhlbihyZXMgPT4gSlNPTi5wYXJzZShyZXMpKTtcclxuXHJcbiAgICByZXR1cm4gT2JzZXJ2YWJsZS5mcm9tUHJvbWlzZTx7IFtrZXk6IHN0cmluZ106IHN0cmluZyB9Pig8YW55PnJlc3VsdCk7XHJcbn1cclxuXHJcbmludGVyZmFjZSBJQXV0b2NvbXBsZXRlUHJvdmlkZXJPcHRpb25zIHtcclxuICAgIGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yO1xyXG4gICAgYnVmZmVyUG9zaXRpb246IFRleHRCdWZmZXIuUG9pbnQ7IC8vIHRoZSBwb3NpdGlvbiBvZiB0aGUgY3Vyc29yXHJcbiAgICBwcmVmaXg6IHN0cmluZztcclxuICAgIHNjb3BlRGVzY3JpcHRvcjogeyBzY29wZXM6IHN0cmluZ1tdIH07XHJcbiAgICBhY3RpdmF0ZWRNYW51YWxseTogYm9vbGVhbjtcclxuICAgIHBhdGg6IHN0cmluZztcclxuICAgIHJlcGxhY2VtZW50UHJlZml4OiBzdHJpbmc7XHJcbn1cclxuXHJcbmludGVyZmFjZSBJQXV0b2NvbXBsZXRlUHJvdmlkZXIge1xyXG4gICAgZmlsZU1hdGNoczogc3RyaW5nW107XHJcbiAgICBwYXRoTWF0Y2g6IChwYXRoOiBzdHJpbmcpID0+IGJvb2xlYW47XHJcbiAgICBnZXRTdWdnZXN0aW9uczogKG9wdGlvbnM6IElBdXRvY29tcGxldGVQcm92aWRlck9wdGlvbnMpID0+IFByb21pc2U8YW55W10+O1xyXG4gICAgZGlzcG9zZSgpOiB2b2lkO1xyXG59XHJcblxyXG5mdW5jdGlvbiBtYWtlU3VnZ2VzdGlvbihpdGVtOiBzdHJpbmcsIHJlcGxhY2VtZW50UHJlZml4OiBzdHJpbmcpIHtcclxuICAgIGNvbnN0IHR5cGUgPSAncGFja2FnZSc7XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBfc2VhcmNoOiBpdGVtLFxyXG4gICAgICAgIHRleHQ6IGl0ZW0sXHJcbiAgICAgICAgc25pcHBldDogaXRlbSxcclxuICAgICAgICB0eXBlOiB0eXBlLFxyXG4gICAgICAgIGRpc3BsYXlUZXh0OiBpdGVtLFxyXG4gICAgICAgIHJlcGxhY2VtZW50UHJlZml4LFxyXG4gICAgICAgIGNsYXNzTmFtZTogJ2F1dG9jb21wbGV0ZS1wcm9qZWN0LWpzb24nLFxyXG4gICAgfTtcclxufVxyXG5cclxuY29uc3QgbmFtZVJlZ2V4ID0gL1xcLygoPzpkbnh8bmV0KVswLTldezIsM30pXFwvZnJhbWV3b3JrQXNzZW1ibGllcyQvO1xyXG5jb25zdCB2ZXJzaW9uUmVnZXggPSAvXFwvKCg/OmRueHxuZXQpWzAtOV17MiwzfSlcXC9mcmFtZXdvcmtBc3NlbWJsaWVzXFwvKFthLXpBLVowLTlcXC5fXSo/KSg/OlxcL3ZlcnNpb24pPyQvO1xyXG5cclxuY2xhc3MgTnVnZXROYW1lUHJvdmlkZXIgaW1wbGVtZW50cyBJQXV0b2NvbXBsZXRlUHJvdmlkZXIge1xyXG4gICAgcHVibGljIGdldFN1Z2dlc3Rpb25zKG9wdGlvbnM6IElBdXRvY29tcGxldGVQcm92aWRlck9wdGlvbnMpIHtcclxuICAgICAgICBjb25zdCBmcmFtZXdvcmsgPSBvcHRpb25zLnBhdGgubWF0Y2gobmFtZVJlZ2V4KVsxXTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGZldGNoRnJhbWV3b3JrRnJvbUdpdGh1YihmcmFtZXdvcmspXHJcbiAgICAgICAgICAgIC5tYXAoa2V5cylcclxuICAgICAgICAgICAgLm1hcCh6ID0+IHoubWFwKHggPT4gbWFrZVN1Z2dlc3Rpb24oeCwgb3B0aW9ucy5yZXBsYWNlbWVudFByZWZpeCkpKVxyXG4gICAgICAgICAgICAubWFwKHMgPT4gZmlsdGVyKHMsIG9wdGlvbnMucHJlZml4LCB7IGtleTogJ19zZWFyY2gnIH0pKVxyXG4gICAgICAgICAgICAudG9Qcm9taXNlKCk7XHJcbiAgICB9XHJcbiAgICBwdWJsaWMgZmlsZU1hdGNocyA9IFsncHJvamVjdC5qc29uJ107XHJcbiAgICBwdWJsaWMgcGF0aE1hdGNoKHBhdGg6IHN0cmluZykge1xyXG4gICAgICAgIHJldHVybiBwYXRoICYmICEhcGF0aC5tYXRjaChuYW1lUmVnZXgpO1xyXG4gICAgfVxyXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7IC8qICovIH1cclxufVxyXG5cclxuY2xhc3MgTnVnZXRWZXJzaW9uUHJvdmlkZXIgaW1wbGVtZW50cyBJQXV0b2NvbXBsZXRlUHJvdmlkZXIge1xyXG4gICAgcHVibGljIGdldFN1Z2dlc3Rpb25zKG9wdGlvbnM6IElBdXRvY29tcGxldGVQcm92aWRlck9wdGlvbnMpIHtcclxuICAgICAgICBjb25zdCBtYXRjaCA9IG9wdGlvbnMucGF0aC5tYXRjaCh2ZXJzaW9uUmVnZXgpO1xyXG4gICAgICAgIGNvbnN0IGZyYW1ld29yayA9IG1hdGNoWzFdO1xyXG4gICAgICAgIGNvbnN0IG5hbWUgPSBtYXRjaFsyXTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGZldGNoRnJhbWV3b3JrRnJvbUdpdGh1YihmcmFtZXdvcmspXHJcbiAgICAgICAgICAgIC5tYXAoeCA9PiBbbWFrZVN1Z2dlc3Rpb24oeFtuYW1lXSwgb3B0aW9ucy5yZXBsYWNlbWVudFByZWZpeCldKVxyXG4gICAgICAgICAgICAudG9Qcm9taXNlKCk7XHJcbiAgICB9XHJcbiAgICBwdWJsaWMgZmlsZU1hdGNocyA9IFsncHJvamVjdC5qc29uJ107XHJcbiAgICBwdWJsaWMgcGF0aE1hdGNoKHBhdGg6IHN0cmluZykge1xyXG4gICAgICAgIHJldHVybiBwYXRoICYmICEhcGF0aC5tYXRjaCh2ZXJzaW9uUmVnZXgpO1xyXG4gICAgfVxyXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7IC8qICovIH1cclxufVxyXG5cclxuY29uc3QgcHJvdmlkZXJzID0gW25ldyBOdWdldE5hbWVQcm92aWRlciwgbmV3IE51Z2V0VmVyc2lvblByb3ZpZGVyXTtcclxubW9kdWxlLmV4cG9ydHMgPSBwcm92aWRlcnM7XHJcbiJdfQ==
