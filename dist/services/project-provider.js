'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _jquery = require('jquery');

var _lodash = require('lodash');

var _rxjs = require('rxjs');

var _omni = require('../server/omni');

var _solutionManager = require('../server/solution-manager');

var _omnisharpClient = require('omnisharp-client');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var filter = require('fuzzaldrin').filter;

var cache = new Map();
var versionCache = new Map();
_omni.Omni.listener.packagesource.flatMap(function (z) {
    return z.response && z.response.Sources || [];
}).subscribe(function (source) {
    if (!cache.get(source)) fetchFromGithub(source, '_keys', '').subscribe(function (result) {
        cache.set(source, result);
    });
});
function fetchFromGithub(source, prefix, searchPrefix) {
    if (prefix === '_keys' && cache.has(source)) {
        return _rxjs.Observable.of(cache.get(source));
    }
    if (cache.has(source)) {
        var c = cache.get(source);
        if (!c) {
            return _rxjs.Observable.of(c);
        }
        if (!(0, _lodash.some)(c.results, function (x) {
            return x.toLowerCase() === prefix.toLowerCase() + '.';
        })) {
            return _rxjs.Observable.of({ results: [] });
        }
    }
    var failedValue = cache.has(source) && !!cache.get(source) ? { prefix: null, results: [] } : { prefix: null, results: null };
    var realSource = source;
    source = (0, _lodash.trim)(source, '/').replace('www.', '').replace('https://', '').replace('http://', '').replace(/\/|\:/g, '-');
    var result = (0, _jquery.ajax)('https://raw.githubusercontent.com/OmniSharp/omnisharp-nuget/resources/resources/' + source + '/' + prefix.toLowerCase() + '.json').then(function (res) {
        return JSON.parse(res);
    }, function () {});
    if (prefix !== '_keys') {
        var sp = searchPrefix.split('.');
        var filePrefix = sp.slice(1, sp.length - 1).join('.').toLowerCase();
        result = result.then(function (value) {
            var k = (0, _lodash.find)(cache.get(realSource).results, function (x) {
                return x.toLowerCase() === prefix.toLowerCase();
            });
            if (!filePrefix) {
                return { prefix: k, results: value._keys };
            } else {
                var v = (0, _lodash.findKey)(value, function (x, key) {
                    return key.toLowerCase() === filePrefix;
                });
                var p = k + '.' + v;
                return { prefix: k && v && p, results: value[v] || [] };
            }
        });
    } else {
        result = result.then(function (results) {
            return { prefix: '', results: results };
        });
    }
    return _rxjs.Observable.fromPromise(result).catch(function () {
        return _rxjs.Observable.of(failedValue);
    });
}
function makeSuggestion(item, path, replacementPrefix) {
    var type = 'package';
    var r = replacementPrefix.split('.');
    var rs = r.slice(0, r.length - 1).join('.');
    if (rs.length) rs += '.';
    if (path.length) path += '.';
    return {
        _search: item,
        text: '' + path + item,
        snippet: '' + path + item,
        type: type,
        displayText: item,
        replacementPrefix: replacementPrefix,
        className: 'autocomplete-project-json'
    };
}
function makeSuggestion2(item, replacementPrefix) {
    var type = 'version';
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
var nameRegex = /\/?dependencies$/;
var versionRegex = /\/?dependencies\/([a-zA-Z0-9\._]*?)(?:\/version)?$/;

var NugetNameProvider = function () {
    function NugetNameProvider() {
        _classCallCheck(this, NugetNameProvider);

        this.fileMatchs = ['project.json'];
    }

    _createClass(NugetNameProvider, [{
        key: 'getSuggestions',
        value: function getSuggestions(options) {
            var searchTokens = options.replacementPrefix.split('.');
            var packagePrefix = void 0;
            if (options.replacementPrefix.indexOf('.') > -1) {
                packagePrefix = options.replacementPrefix.split('.')[0];
            }
            return _solutionManager.SolutionManager.getSolutionForEditor(options.editor).filter(function (x) {
                return x.runtime === _omnisharpClient.Runtime.ClrOrMono;
            }).flatMap(function (z) {
                return z.model.packageSources;
            }).flatMap(function (source) {
                return fetchFromGithub(source, packagePrefix || '_keys', options.replacementPrefix).flatMap(function (z) {
                    if (!z) {
                        console.info('Falling back to server package search for ' + source + '.');
                        return _omni.Omni.request(function (solution) {
                            return solution.packagesearch({
                                Search: options.replacementPrefix,
                                IncludePrerelease: true,
                                ProjectPath: solution.path,
                                Sources: [source]
                            });
                        }).map(function (x) {
                            return { prefix: '', results: x.Packages.map(function (item) {
                                    return item.Id;
                                }) };
                        });
                    } else {
                        return _rxjs.Observable.of(z);
                    }
                });
            }).toArray().map(function (z) {
                var prefix = (0, _lodash.find)(z, function (x) {
                    return !!x.prefix;
                });
                var p = prefix ? prefix.prefix : '';
                return (0, _lodash.map)((0, _lodash.sortBy)((0, _lodash.uniq)((0, _lodash.flatMap)(z, function (c) {
                    return c.results;
                }))), function (x) {
                    return makeSuggestion(x, p, options.replacementPrefix);
                });
            }).map(function (s) {
                return filter(s, searchTokens[searchTokens.length - 1], { key: '_search' });
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
            if (!match) return Promise.resolve([]);
            var name = match[1];
            var o = void 0;
            if (versionCache.has(name)) {
                o = versionCache.get(name);
            } else {
                o = _solutionManager.SolutionManager.getSolutionForEditor(options.editor).flatMap(function (z) {
                    return z.model.packageSources;
                }).filter(function (z) {
                    if (cache.has(z)) {
                        return (0, _lodash.some)(cache.get(z).results, function (x) {
                            return (0, _lodash.startsWith)(name, x);
                        });
                    }
                    return true;
                }).toArray().flatMap(function (sources) {
                    return _omni.Omni.request(function (solution) {
                        return solution.packageversion({
                            Id: name,
                            IncludePrerelease: true,
                            ProjectPath: solution.path,
                            Sources: sources
                        });
                    }).flatMap(function (z) {
                        return z.Versions;
                    }).toArray();
                }).publishReplay(1).refCount();
                versionCache.set(name, o);
            }
            return o.take(1).map(function (z) {
                return z.map(function (x) {
                    return makeSuggestion2(x, options.replacementPrefix);
                });
            }).map(function (s) {
                return filter(s, options.prefix, { key: '_search' });
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9zZXJ2aWNlcy9wcm9qZWN0LXByb3ZpZGVyLnRzIl0sIm5hbWVzIjpbImZpbHRlciIsInJlcXVpcmUiLCJjYWNoZSIsIk1hcCIsInZlcnNpb25DYWNoZSIsImxpc3RlbmVyIiwicGFja2FnZXNvdXJjZSIsImZsYXRNYXAiLCJ6IiwicmVzcG9uc2UiLCJTb3VyY2VzIiwic3Vic2NyaWJlIiwic291cmNlIiwiZ2V0IiwiZmV0Y2hGcm9tR2l0aHViIiwic2V0IiwicmVzdWx0IiwicHJlZml4Iiwic2VhcmNoUHJlZml4IiwiaGFzIiwib2YiLCJjIiwicmVzdWx0cyIsIngiLCJ0b0xvd2VyQ2FzZSIsImZhaWxlZFZhbHVlIiwicmVhbFNvdXJjZSIsInJlcGxhY2UiLCJ0aGVuIiwiSlNPTiIsInBhcnNlIiwicmVzIiwic3AiLCJzcGxpdCIsImZpbGVQcmVmaXgiLCJzbGljZSIsImxlbmd0aCIsImpvaW4iLCJ2YWx1ZSIsImsiLCJfa2V5cyIsInYiLCJrZXkiLCJwIiwiZnJvbVByb21pc2UiLCJjYXRjaCIsIm1ha2VTdWdnZXN0aW9uIiwiaXRlbSIsInBhdGgiLCJyZXBsYWNlbWVudFByZWZpeCIsInR5cGUiLCJyIiwicnMiLCJfc2VhcmNoIiwidGV4dCIsInNuaXBwZXQiLCJkaXNwbGF5VGV4dCIsImNsYXNzTmFtZSIsIm1ha2VTdWdnZXN0aW9uMiIsIm5hbWVSZWdleCIsInZlcnNpb25SZWdleCIsIk51Z2V0TmFtZVByb3ZpZGVyIiwiZmlsZU1hdGNocyIsIm9wdGlvbnMiLCJzZWFyY2hUb2tlbnMiLCJwYWNrYWdlUHJlZml4IiwiaW5kZXhPZiIsImdldFNvbHV0aW9uRm9yRWRpdG9yIiwiZWRpdG9yIiwicnVudGltZSIsIkNsck9yTW9ubyIsIm1vZGVsIiwicGFja2FnZVNvdXJjZXMiLCJjb25zb2xlIiwiaW5mbyIsInJlcXVlc3QiLCJzb2x1dGlvbiIsInBhY2thZ2VzZWFyY2giLCJTZWFyY2giLCJJbmNsdWRlUHJlcmVsZWFzZSIsIlByb2plY3RQYXRoIiwibWFwIiwiUGFja2FnZXMiLCJJZCIsInRvQXJyYXkiLCJzIiwidG9Qcm9taXNlIiwibWF0Y2giLCJOdWdldFZlcnNpb25Qcm92aWRlciIsIlByb21pc2UiLCJyZXNvbHZlIiwibmFtZSIsIm8iLCJwYWNrYWdldmVyc2lvbiIsInNvdXJjZXMiLCJWZXJzaW9ucyIsInB1Ymxpc2hSZXBsYXkiLCJyZWZDb3VudCIsInRha2UiLCJwcm92aWRlcnMiLCJtb2R1bGUiLCJleHBvcnRzIl0sIm1hcHBpbmdzIjoiOzs7O0FBQUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBRUE7Ozs7QUFEQSxJQUFNQSxTQUFTQyxRQUFRLFlBQVIsRUFBc0JELE1BQXJDOztBQUdBLElBQU1FLFFBQVEsSUFBSUMsR0FBSixFQUFkO0FBQ0EsSUFBTUMsZUFBZSxJQUFJRCxHQUFKLEVBQXJCO0FBQ0EsV0FBS0UsUUFBTCxDQUFjQyxhQUFkLENBQ0tDLE9BREwsQ0FDYTtBQUFBLFdBQUtDLEVBQUVDLFFBQUYsSUFBY0QsRUFBRUMsUUFBRixDQUFXQyxPQUF6QixJQUFvQyxFQUF6QztBQUFBLENBRGIsRUFFS0MsU0FGTCxDQUVlLFVBQUNDLE1BQUQsRUFBZTtBQUN0QixRQUFJLENBQUNWLE1BQU1XLEdBQU4sQ0FBVUQsTUFBVixDQUFMLEVBQ0lFLGdCQUFnQkYsTUFBaEIsRUFBd0IsT0FBeEIsRUFBaUMsRUFBakMsRUFBcUNELFNBQXJDLENBQStDLGtCQUFNO0FBQ2pEVCxjQUFNYSxHQUFOLENBQVVILE1BQVYsRUFBa0JJLE1BQWxCO0FBQ0gsS0FGRDtBQUdQLENBUEw7QUFTQSxTQUFBRixlQUFBLENBQXlCRixNQUF6QixFQUF5Q0ssTUFBekMsRUFBeURDLFlBQXpELEVBQTZFO0FBRXpFLFFBQUlELFdBQVcsT0FBWCxJQUFzQmYsTUFBTWlCLEdBQU4sQ0FBVVAsTUFBVixDQUExQixFQUE2QztBQUN6QyxlQUFPLGlCQUFXUSxFQUFYLENBQWNsQixNQUFNVyxHQUFOLENBQVVELE1BQVYsQ0FBZCxDQUFQO0FBQ0g7QUFHRCxRQUFJ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RXlFLEdBQUYsQ0FBTTtBQUFBLDJCQUNadkIsZ0JBQWdCbkMsQ0FBaEIsRUFBbUJ3QyxRQUFRZCxpQkFBM0IsQ0FEWTtBQUFBLGlCQUFOLENBQUw7QUFBQSxhQURGLEVBR0ZnQyxHQUhFLENBR0U7QUFBQSx1QkFDRGpGLE9BQU9xRixDQUFQLEVBQVV0QixRQUFROUMsTUFBbEIsRUFBMEIsRUFBRXlCLEtBQUssU0FBUCxFQUExQixDQURDO0FBQUEsYUFIRixFQUtGNEMsU0FMRSxFQUFQO0FBTUg7OztrQ0FFZ0J0QyxJLEVBQVk7QUFDekIsbUJBQU9BLFFBQVEsQ0FBQyxDQUFDQSxLQUFLdUMsS0FBTCxDQUFXM0IsWUFBWCxDQUFqQjtBQUNIOzs7a0NBQ2EsQ0FBWTs7Ozs7O0FBRzlCLElBQU11QyxZQUFZLENBQUMsSUFBSXRDLGlCQUFKLEVBQUQsRUFBd0IsSUFBSTJCLG9CQUFKLEVBQXhCLENBQWxCO0FBQ0FZLE9BQU9DLE9BQVAsR0FBaUJGLFNBQWpCIiwiZmlsZSI6ImxpYi9zZXJ2aWNlcy9wcm9qZWN0LXByb3ZpZGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgYWpheCB9IGZyb20gJ2pxdWVyeSc7XHJcbmltcG9ydCB7IHNvbWUsIHRyaW0sIGZpbmQsIHN0YXJ0c1dpdGgsIGZpbmRLZXksIGZsYXRNYXAsIHNvcnRCeSwgdW5pcSwgbWFwIH0gZnJvbSAnbG9kYXNoJztcclxuaW1wb3J0IHsgT2JzZXJ2YWJsZSB9IGZyb20gJ3J4anMnO1xyXG5pbXBvcnQgeyBPbW5pIH0gZnJvbSAnLi4vc2VydmVyL29tbmknO1xyXG5pbXBvcnQgeyBTb2x1dGlvbk1hbmFnZXIgfSBmcm9tICcuLi9zZXJ2ZXIvc29sdXRpb24tbWFuYWdlcic7XHJcbmNvbnN0IGZpbHRlciA9IHJlcXVpcmUoJ2Z1enphbGRyaW4nKS5maWx0ZXI7XHJcbmltcG9ydCB7IFJ1bnRpbWUgfSBmcm9tICdvbW5pc2hhcnAtY2xpZW50JztcclxuXHJcbmNvbnN0IGNhY2hlID0gbmV3IE1hcDxzdHJpbmcsIHsgcHJlZml4Pzogc3RyaW5nOyByZXN1bHRzOiBzdHJpbmdbXSB9PigpO1xyXG5jb25zdCB2ZXJzaW9uQ2FjaGUgPSBuZXcgTWFwPHN0cmluZywgYW55PigpO1xyXG5PbW5pLmxpc3RlbmVyLnBhY2thZ2Vzb3VyY2VcclxuICAgIC5mbGF0TWFwKHogPT4gei5yZXNwb25zZSAmJiB6LnJlc3BvbnNlLlNvdXJjZXMgfHwgW10pXHJcbiAgICAuc3Vic2NyaWJlKChzb3VyY2U6IHN0cmluZykgPT4ge1xyXG4gICAgICAgIGlmICghY2FjaGUuZ2V0KHNvdXJjZSkpXHJcbiAgICAgICAgICAgIGZldGNoRnJvbUdpdGh1Yihzb3VyY2UsICdfa2V5cycsICcnKS5zdWJzY3JpYmUocmVzdWx0ID0+IHtcclxuICAgICAgICAgICAgICAgIGNhY2hlLnNldChzb3VyY2UsIHJlc3VsdCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgfSk7XHJcblxyXG5mdW5jdGlvbiBmZXRjaEZyb21HaXRodWIoc291cmNlOiBzdHJpbmcsIHByZWZpeDogc3RyaW5nLCBzZWFyY2hQcmVmaXg6IHN0cmluZyk6IE9ic2VydmFibGU8eyBwcmVmaXg/OiBzdHJpbmc7IHJlc3VsdHM6IHN0cmluZ1tdIH0+IHtcclxuICAgIC8vIFdlIHByZWNhY2hlIHRoZSBrZXlzIHRvIG1ha2UgdGhpcyBzcGVlZHlcclxuICAgIGlmIChwcmVmaXggPT09ICdfa2V5cycgJiYgY2FjaGUuaGFzKHNvdXJjZSkpIHtcclxuICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5vZihjYWNoZS5nZXQoc291cmNlKSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gSWYgd2UgaGF2ZSBhIHZhbHVlIGluIHRoZSBjYWNoZSwgc2VlIGlmIHRoZSBrZXkgZXhpc3RzIG9yIG5vdC5cclxuICAgIGlmIChjYWNoZS5oYXMoc291cmNlKSkge1xyXG4gICAgICAgIGNvbnN0IGMgPSBjYWNoZS5nZXQoc291cmNlKTtcclxuICAgICAgICBpZiAoIWMpIHtcclxuICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUub2YoYyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIXNvbWUoYy5yZXN1bHRzLCB4ID0+IHgudG9Mb3dlckNhc2UoKSA9PT0gcHJlZml4LnRvTG93ZXJDYXNlKCkgKyAnLicpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLm9mKHsgcmVzdWx0czogW10gfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIElmIHdlIGhhdmUgYSBjYWNoZWQgdmFsdWUgdGhlbiB0aGUgZmFpbGVkIHZhbHVlIGlzIGVtcHR5IChubyBuZWVkIHRvIGZhbGwgYmFjayB0byB0aGUgc2VydmVyKVxyXG4gICAgY29uc3QgZmFpbGVkVmFsdWUgPSBjYWNoZS5oYXMoc291cmNlKSAmJiAhIWNhY2hlLmdldChzb3VyY2UpID8gPGFueT57IHByZWZpeDogbnVsbCwgcmVzdWx0czogW10gfSA6IHsgcHJlZml4OiBudWxsLCByZXN1bHRzOiBudWxsIH07XHJcblxyXG4gICAgY29uc3QgcmVhbFNvdXJjZSA9IHNvdXJjZTtcclxuXHJcbiAgICAvLyBUaGlzIGlzIHRoZSBzYW1lIGNvbnZlbnRpb24gdXNlZCBieSBvbW5pc2hhcnAtbnVnZXQgYnVpbGQgdG9vbFxyXG4gICAgc291cmNlID0gdHJpbShzb3VyY2UsICcvJykucmVwbGFjZSgnd3d3LicsICcnKS5yZXBsYWNlKCdodHRwczovLycsICcnKS5yZXBsYWNlKCdodHRwOi8vJywgJycpLnJlcGxhY2UoL1xcL3xcXDovZywgJy0nKTtcclxuXHJcbiAgICAvLyBHZXQgdGhlIGZpbGUgZnJvbSBnaXRodWJcclxuICAgIGxldCByZXN1bHQgPSBhamF4KGBodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vT21uaVNoYXJwL29tbmlzaGFycC1udWdldC9yZXNvdXJjZXMvcmVzb3VyY2VzLyR7c291cmNlfS8ke3ByZWZpeC50b0xvd2VyQ2FzZSgpfS5qc29uYCkudGhlbihyZXMgPT4gSlNPTi5wYXJzZShyZXMpLCAoKSA9PiB7IC8qICovIH0pO1xyXG5cclxuICAgIC8vIFRoZSBub24ga2V5IGZpbGVzIGhhdmUgYW4gb2JqZWN0IGxheW91dFxyXG4gICAgaWYgKHByZWZpeCAhPT0gJ19rZXlzJykge1xyXG4gICAgICAgIGNvbnN0IHNwID0gc2VhcmNoUHJlZml4LnNwbGl0KCcuJyk7XHJcbiAgICAgICAgY29uc3QgZmlsZVByZWZpeCA9IHNwLnNsaWNlKDEsIHNwLmxlbmd0aCAtIDEpLmpvaW4oJy4nKS50b0xvd2VyQ2FzZSgpO1xyXG4gICAgICAgIHJlc3VsdCA9IHJlc3VsdC50aGVuKCh2YWx1ZTogeyBfa2V5czogc3RyaW5nW107W2tleTogc3RyaW5nXTogc3RyaW5nW10gfSkgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBrID0gZmluZChjYWNoZS5nZXQocmVhbFNvdXJjZSkucmVzdWx0cywgeCA9PiB4LnRvTG93ZXJDYXNlKCkgPT09IHByZWZpeC50b0xvd2VyQ2FzZSgpKTtcclxuICAgICAgICAgICAgaWYgKCFmaWxlUHJlZml4KSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4geyBwcmVmaXg6IGssIHJlc3VsdHM6IHZhbHVlLl9rZXlzIH07XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB2ID0gZmluZEtleSh2YWx1ZSwgKHg6IGFueSwga2V5OiBzdHJpbmcpID0+IGtleS50b0xvd2VyQ2FzZSgpID09PSBmaWxlUHJlZml4KTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHAgPSBgJHtrfS4ke3Z9YDtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4geyBwcmVmaXg6IGsgJiYgdiAmJiBwLCByZXN1bHRzOiB2YWx1ZVt2XSB8fCBbXSB9O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJlc3VsdCA9IHJlc3VsdC50aGVuKHJlc3VsdHMgPT4gKHsgcHJlZml4OiAnJywgcmVzdWx0cyB9KSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gUmV0dXJuIHRoZSByZXN1bHRcclxuICAgIHJldHVybiBPYnNlcnZhYmxlLmZyb21Qcm9taXNlPHsgcHJlZml4OiBzdHJpbmc7IHJlc3VsdHM6IHN0cmluZ1tdIH0+KDxhbnk+cmVzdWx0KS5jYXRjaCgoKSA9PiBPYnNlcnZhYmxlLm9mKGZhaWxlZFZhbHVlKSk7XHJcbn1cclxuXHJcbmludGVyZmFjZSBJQXV0b2NvbXBsZXRlUHJvdmlkZXJPcHRpb25zIHtcclxuICAgIGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yO1xyXG4gICAgYnVmZmVyUG9zaXRpb246IFRleHRCdWZmZXIuUG9pbnQ7IC8vIHRoZSBwb3NpdGlvbiBvZiB0aGUgY3Vyc29yXHJcbiAgICBwcmVmaXg6IHN0cmluZztcclxuICAgIHNjb3BlRGVzY3JpcHRvcjogeyBzY29wZXM6IHN0cmluZ1tdIH07XHJcbiAgICBhY3RpdmF0ZWRNYW51YWxseTogYm9vbGVhbjtcclxuICAgIHBhdGg6IHN0cmluZztcclxuICAgIHJlcGxhY2VtZW50UHJlZml4OiBzdHJpbmc7XHJcbn1cclxuXHJcbmludGVyZmFjZSBJQXV0b2NvbXBsZXRlUHJvdmlkZXIge1xyXG4gICAgZmlsZU1hdGNoczogc3RyaW5nW107XHJcbiAgICBwYXRoTWF0Y2g6IChwYXRoOiBzdHJpbmcpID0+IGJvb2xlYW47XHJcbiAgICBnZXRTdWdnZXN0aW9uczogKG9wdGlvbnM6IElBdXRvY29tcGxldGVQcm92aWRlck9wdGlvbnMpID0+IFByb21pc2U8YW55W10+O1xyXG4gICAgZGlzcG9zZSgpOiB2b2lkO1xyXG59XHJcblxyXG5mdW5jdGlvbiBtYWtlU3VnZ2VzdGlvbihpdGVtOiBzdHJpbmcsIHBhdGg6IHN0cmluZywgcmVwbGFjZW1lbnRQcmVmaXg6IHN0cmluZykge1xyXG4gICAgY29uc3QgdHlwZSA9ICdwYWNrYWdlJztcclxuXHJcbiAgICBjb25zdCByID0gcmVwbGFjZW1lbnRQcmVmaXguc3BsaXQoJy4nKTtcclxuICAgIGxldCBycyA9IHIuc2xpY2UoMCwgci5sZW5ndGggLSAxKS5qb2luKCcuJyk7XHJcbiAgICBpZiAocnMubGVuZ3RoKSBycyArPSAnLic7XHJcbiAgICBpZiAocGF0aC5sZW5ndGgpIHBhdGggKz0gJy4nO1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgX3NlYXJjaDogaXRlbSxcclxuICAgICAgICB0ZXh0OiBgJHtwYXRofSR7aXRlbX1gLFxyXG4gICAgICAgIHNuaXBwZXQ6IGAke3BhdGh9JHtpdGVtfWAsXHJcbiAgICAgICAgdHlwZTogdHlwZSxcclxuICAgICAgICBkaXNwbGF5VGV4dDogaXRlbSxcclxuICAgICAgICByZXBsYWNlbWVudFByZWZpeCwvLzogYCR7cnN9JHtpdGVtfWAsXHJcbiAgICAgICAgY2xhc3NOYW1lOiAnYXV0b2NvbXBsZXRlLXByb2plY3QtanNvbicsXHJcbiAgICB9O1xyXG59XHJcblxyXG5mdW5jdGlvbiBtYWtlU3VnZ2VzdGlvbjIoaXRlbTogc3RyaW5nLCByZXBsYWNlbWVudFByZWZpeDogc3RyaW5nKSB7XHJcbiAgICBjb25zdCB0eXBlID0gJ3ZlcnNpb24nO1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgX3NlYXJjaDogaXRlbSxcclxuICAgICAgICB0ZXh0OiBpdGVtLFxyXG4gICAgICAgIHNuaXBwZXQ6IGl0ZW0sXHJcbiAgICAgICAgdHlwZTogdHlwZSxcclxuICAgICAgICBkaXNwbGF5VGV4dDogaXRlbSxcclxuICAgICAgICByZXBsYWNlbWVudFByZWZpeCxcclxuICAgICAgICBjbGFzc05hbWU6ICdhdXRvY29tcGxldGUtcHJvamVjdC1qc29uJyxcclxuICAgIH07XHJcbn1cclxuXHJcbmNvbnN0IG5hbWVSZWdleCA9IC9cXC8/ZGVwZW5kZW5jaWVzJC87XHJcbmNvbnN0IHZlcnNpb25SZWdleCA9IC9cXC8/ZGVwZW5kZW5jaWVzXFwvKFthLXpBLVowLTlcXC5fXSo/KSg/OlxcL3ZlcnNpb24pPyQvO1xyXG5cclxuY2xhc3MgTnVnZXROYW1lUHJvdmlkZXIgaW1wbGVtZW50cyBJQXV0b2NvbXBsZXRlUHJvdmlkZXIge1xyXG4gICAgcHVibGljIGZpbGVNYXRjaHMgPSBbJ3Byb2plY3QuanNvbiddO1xyXG5cclxuICAgIHB1YmxpYyBnZXRTdWdnZXN0aW9ucyhvcHRpb25zOiBJQXV0b2NvbXBsZXRlUHJvdmlkZXJPcHRpb25zKSB7XHJcblxyXG4gICAgICAgIGNvbnN0IHNlYXJjaFRva2VucyA9IG9wdGlvbnMucmVwbGFjZW1lbnRQcmVmaXguc3BsaXQoJy4nKTtcclxuICAgICAgICBsZXQgcGFja2FnZVByZWZpeDogc3RyaW5nO1xyXG4gICAgICAgIGlmIChvcHRpb25zLnJlcGxhY2VtZW50UHJlZml4LmluZGV4T2YoJy4nKSA+IC0xKSB7XHJcbiAgICAgICAgICAgIHBhY2thZ2VQcmVmaXggPSBvcHRpb25zLnJlcGxhY2VtZW50UHJlZml4LnNwbGl0KCcuJylbMF07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gU29sdXRpb25NYW5hZ2VyLmdldFNvbHV0aW9uRm9yRWRpdG9yKG9wdGlvbnMuZWRpdG9yKVxyXG4gICAgICAgICAgICAvLyBPbmx5IHN1cHBvcnRlZCBvbiBEZXNrdG9wIENsciBhdCB0aGUgbW9tZW50XHJcbiAgICAgICAgICAgIC5maWx0ZXIoeCA9PiB4LnJ1bnRpbWUgPT09IFJ1bnRpbWUuQ2xyT3JNb25vKVxyXG4gICAgICAgICAgICAvLyBHZXQgYWxsIHNvdXJjZXNcclxuICAgICAgICAgICAgLmZsYXRNYXAoeiA9PiB6Lm1vZGVsLnBhY2thZ2VTb3VyY2VzKVxyXG4gICAgICAgICAgICAuZmxhdE1hcChzb3VyY2UgPT4ge1xyXG4gICAgICAgICAgICAgICAgLy8gQXR0ZW1wdCB0byBnZXQgdGhlIHNvdXJjZSBmcm9tIGdpdGh1YlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZldGNoRnJvbUdpdGh1Yihzb3VyY2UsIHBhY2thZ2VQcmVmaXggfHwgJ19rZXlzJywgb3B0aW9ucy5yZXBsYWNlbWVudFByZWZpeClcclxuICAgICAgICAgICAgICAgICAgICAuZmxhdE1hcCh6ID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCF6KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBmYWxsIGJhY2sgdG8gdGhlIHNlcnZlciBpZiBzb3VyY2UgaXNuXCJ0IGZvdW5kXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmluZm8oYEZhbGxpbmcgYmFjayB0byBzZXJ2ZXIgcGFja2FnZSBzZWFyY2ggZm9yICR7c291cmNlfS5gKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBPbW5pLnJlcXVlc3Qoc29sdXRpb24gPT4gc29sdXRpb24ucGFja2FnZXNlYXJjaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgU2VhcmNoOiBvcHRpb25zLnJlcGxhY2VtZW50UHJlZml4LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEluY2x1ZGVQcmVyZWxlYXNlOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFByb2plY3RQYXRoOiBzb2x1dGlvbi5wYXRoLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFNvdXJjZXM6IFtzb3VyY2VdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSkpLm1hcCh4ID0+ICh7IHByZWZpeDogJycsIHJlc3VsdHM6IHguUGFja2FnZXMubWFwKGl0ZW0gPT4gaXRlbS5JZCkgfSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUub2Yoeik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgLnRvQXJyYXkoKVxyXG4gICAgICAgICAgICAubWFwKHogPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcHJlZml4ID0gZmluZCh6LCB4ID0+ICEheC5wcmVmaXgpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcCA9IHByZWZpeCA/IHByZWZpeC5wcmVmaXggOiAnJztcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbWFwKHNvcnRCeSh1bmlxKGZsYXRNYXAoeiwgYyA9PiBjLnJlc3VsdHMpKSksXHJcbiAgICAgICAgICAgICAgICAgICAgeCA9PiBtYWtlU3VnZ2VzdGlvbih4LCBwLCBvcHRpb25zLnJlcGxhY2VtZW50UHJlZml4KSk7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC5tYXAocyA9PlxyXG4gICAgICAgICAgICAgICAgZmlsdGVyKHMsIHNlYXJjaFRva2Vuc1tzZWFyY2hUb2tlbnMubGVuZ3RoIC0gMV0sIHsga2V5OiAnX3NlYXJjaCcgfSkpXHJcbiAgICAgICAgICAgIC50b1Byb21pc2UoKTtcclxuICAgIH1cclxuICAgIHB1YmxpYyBwYXRoTWF0Y2gocGF0aDogc3RyaW5nKSB7XHJcbiAgICAgICAgcmV0dXJuIHBhdGggJiYgISFwYXRoLm1hdGNoKG5hbWVSZWdleCk7XHJcbiAgICB9XHJcbiAgICBwdWJsaWMgZGlzcG9zZSgpIHsgLyogKi8gfVxyXG59XHJcblxyXG5jbGFzcyBOdWdldFZlcnNpb25Qcm92aWRlciBpbXBsZW1lbnRzIElBdXRvY29tcGxldGVQcm92aWRlciB7XHJcbiAgICBwdWJsaWMgZ2V0U3VnZ2VzdGlvbnMob3B0aW9uczogSUF1dG9jb21wbGV0ZVByb3ZpZGVyT3B0aW9ucykge1xyXG4gICAgICAgIGNvbnN0IG1hdGNoID0gb3B0aW9ucy5wYXRoLm1hdGNoKHZlcnNpb25SZWdleCk7XHJcbiAgICAgICAgaWYgKCFtYXRjaCkgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbXSk7XHJcbiAgICAgICAgY29uc3QgbmFtZSA9IG1hdGNoWzFdO1xyXG5cclxuICAgICAgICBsZXQgbzogT2JzZXJ2YWJsZTxzdHJpbmdbXT47XHJcblxyXG4gICAgICAgIGlmICh2ZXJzaW9uQ2FjaGUuaGFzKG5hbWUpKSB7XHJcbiAgICAgICAgICAgIG8gPSB2ZXJzaW9uQ2FjaGUuZ2V0KG5hbWUpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIG8gPSBTb2x1dGlvbk1hbmFnZXIuZ2V0U29sdXRpb25Gb3JFZGl0b3Iob3B0aW9ucy5lZGl0b3IpXHJcbiAgICAgICAgICAgICAgICAvLyBHZXQgYWxsIHNvdXJjZXNcclxuICAgICAgICAgICAgICAgIC5mbGF0TWFwKHogPT4gei5tb2RlbC5wYWNrYWdlU291cmNlcylcclxuICAgICAgICAgICAgICAgIC5maWx0ZXIoeiA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNhY2hlLmhhcyh6KSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBTaG9ydCBvdXQgZWFybHkgaWYgdGhlIHNvdXJjZSBkb2VzblwidCBldmVuIGhhdmUgdGhlIGdpdmVuIHByZWZpeFxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gc29tZShjYWNoZS5nZXQoeikucmVzdWx0cywgeCA9PiBzdGFydHNXaXRoKG5hbWUsIHgpKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgLnRvQXJyYXkoKVxyXG4gICAgICAgICAgICAgICAgLmZsYXRNYXAoc291cmNlcyA9PiBPbW5pLnJlcXVlc3Qoc29sdXRpb24gPT4gc29sdXRpb24ucGFja2FnZXZlcnNpb24oe1xyXG4gICAgICAgICAgICAgICAgICAgIElkOiBuYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIEluY2x1ZGVQcmVyZWxlYXNlOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgIFByb2plY3RQYXRoOiBzb2x1dGlvbi5wYXRoLFxyXG4gICAgICAgICAgICAgICAgICAgIFNvdXJjZXM6IHNvdXJjZXMsXHJcbiAgICAgICAgICAgICAgICB9KSlcclxuICAgICAgICAgICAgICAgICAgICAuZmxhdE1hcCh6ID0+IHouVmVyc2lvbnMpXHJcbiAgICAgICAgICAgICAgICAgICAgLnRvQXJyYXkoKSlcclxuICAgICAgICAgICAgICAgIC5wdWJsaXNoUmVwbGF5KDEpLnJlZkNvdW50KCk7XHJcblxyXG4gICAgICAgICAgICB2ZXJzaW9uQ2FjaGUuc2V0KG5hbWUsIG8pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG8udGFrZSgxKVxyXG4gICAgICAgICAgICAubWFwKHogPT4gei5tYXAoeCA9PlxyXG4gICAgICAgICAgICAgICAgbWFrZVN1Z2dlc3Rpb24yKHgsIG9wdGlvbnMucmVwbGFjZW1lbnRQcmVmaXgpKSlcclxuICAgICAgICAgICAgLm1hcChzID0+XHJcbiAgICAgICAgICAgICAgICBmaWx0ZXIocywgb3B0aW9ucy5wcmVmaXgsIHsga2V5OiAnX3NlYXJjaCcgfSkpXHJcbiAgICAgICAgICAgIC50b1Byb21pc2UoKTtcclxuICAgIH1cclxuICAgIHB1YmxpYyBmaWxlTWF0Y2hzID0gWydwcm9qZWN0Lmpzb24nXTtcclxuICAgIHB1YmxpYyBwYXRoTWF0Y2gocGF0aDogc3RyaW5nKSB7XHJcbiAgICAgICAgcmV0dXJuIHBhdGggJiYgISFwYXRoLm1hdGNoKHZlcnNpb25SZWdleCk7XHJcbiAgICB9XHJcbiAgICBwdWJsaWMgZGlzcG9zZSgpIHsgLyogKi8gfVxyXG59XHJcblxyXG5jb25zdCBwcm92aWRlcnMgPSBbbmV3IE51Z2V0TmFtZVByb3ZpZGVyLCBuZXcgTnVnZXRWZXJzaW9uUHJvdmlkZXJdO1xyXG5tb2R1bGUuZXhwb3J0cyA9IHByb3ZpZGVycztcclxuIl19
