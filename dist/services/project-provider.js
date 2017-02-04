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
        (function () {
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
        })();
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9zZXJ2aWNlcy9wcm9qZWN0LXByb3ZpZGVyLnRzIl0sIm5hbWVzIjpbImZpbHRlciIsInJlcXVpcmUiLCJjYWNoZSIsIk1hcCIsInZlcnNpb25DYWNoZSIsImxpc3RlbmVyIiwicGFja2FnZXNvdXJjZSIsImZsYXRNYXAiLCJ6IiwicmVzcG9uc2UiLCJTb3VyY2VzIiwic3Vic2NyaWJlIiwic291cmNlIiwiZ2V0IiwiZmV0Y2hGcm9tR2l0aHViIiwic2V0IiwicmVzdWx0IiwicHJlZml4Iiwic2VhcmNoUHJlZml4IiwiaGFzIiwib2YiLCJjIiwicmVzdWx0cyIsIngiLCJ0b0xvd2VyQ2FzZSIsImZhaWxlZFZhbHVlIiwicmVhbFNvdXJjZSIsInJlcGxhY2UiLCJ0aGVuIiwiSlNPTiIsInBhcnNlIiwicmVzIiwic3AiLCJzcGxpdCIsImZpbGVQcmVmaXgiLCJzbGljZSIsImxlbmd0aCIsImpvaW4iLCJ2YWx1ZSIsImsiLCJfa2V5cyIsInYiLCJrZXkiLCJwIiwiZnJvbVByb21pc2UiLCJjYXRjaCIsIm1ha2VTdWdnZXN0aW9uIiwiaXRlbSIsInBhdGgiLCJyZXBsYWNlbWVudFByZWZpeCIsInR5cGUiLCJyIiwicnMiLCJfc2VhcmNoIiwidGV4dCIsInNuaXBwZXQiLCJkaXNwbGF5VGV4dCIsImNsYXNzTmFtZSIsIm1ha2VTdWdnZXN0aW9uMiIsIm5hbWVSZWdleCIsInZlcnNpb25SZWdleCIsIk51Z2V0TmFtZVByb3ZpZGVyIiwiZmlsZU1hdGNocyIsIm9wdGlvbnMiLCJzZWFyY2hUb2tlbnMiLCJwYWNrYWdlUHJlZml4IiwiaW5kZXhPZiIsImdldFNvbHV0aW9uRm9yRWRpdG9yIiwiZWRpdG9yIiwicnVudGltZSIsIkNsck9yTW9ubyIsIm1vZGVsIiwicGFja2FnZVNvdXJjZXMiLCJjb25zb2xlIiwiaW5mbyIsInJlcXVlc3QiLCJzb2x1dGlvbiIsInBhY2thZ2VzZWFyY2giLCJTZWFyY2giLCJJbmNsdWRlUHJlcmVsZWFzZSIsIlByb2plY3RQYXRoIiwibWFwIiwiUGFja2FnZXMiLCJJZCIsInRvQXJyYXkiLCJzIiwidG9Qcm9taXNlIiwibWF0Y2giLCJOdWdldFZlcnNpb25Qcm92aWRlciIsIlByb21pc2UiLCJyZXNvbHZlIiwibmFtZSIsIm8iLCJwYWNrYWdldmVyc2lvbiIsInNvdXJjZXMiLCJWZXJzaW9ucyIsInB1Ymxpc2hSZXBsYXkiLCJyZWZDb3VudCIsInRha2UiLCJwcm92aWRlcnMiLCJtb2R1bGUiLCJleHBvcnRzIl0sIm1hcHBpbmdzIjoiOzs7O0FBQUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBRUE7Ozs7QUFEQSxJQUFNQSxTQUFTQyxRQUFRLFlBQVIsRUFBc0JELE1BQXJDOztBQUdBLElBQU1FLFFBQVEsSUFBSUMsR0FBSixFQUFkO0FBQ0EsSUFBTUMsZUFBZSxJQUFJRCxHQUFKLEVBQXJCO0FBQ0EsV0FBS0UsUUFBTCxDQUFjQyxhQUFkLENBQ0tDLE9BREwsQ0FDYTtBQUFBLFdBQUtDLEVBQUVDLFFBQUYsSUFBY0QsRUFBRUMsUUFBRixDQUFXQyxPQUF6QixJQUFvQyxFQUF6QztBQUFBLENBRGIsRUFFS0MsU0FGTCxDQUVlLFVBQUNDLE1BQUQsRUFBZTtBQUN0QixRQUFJLENBQUNWLE1BQU1XLEdBQU4sQ0FBVUQsTUFBVixDQUFMLEVBQ0lFLGdCQUFnQkYsTUFBaEIsRUFBd0IsT0FBeEIsRUFBaUMsRUFBakMsRUFBcUNELFNBQXJDLENBQStDLGtCQUFNO0FBQ2pEVCxjQUFNYSxHQUFOLENBQVVILE1BQVYsRUFBa0JJLE1BQWxCO0FBQ0gsS0FGRDtBQUdQLENBUEw7QUFTQSxTQUFBRixlQUFBLENBQXlCRixNQUF6QixFQUF5Q0ssTUFBekMsRUFBeURDLFlBQXpELEVBQTZFO0FBRXpFLFFBQUlELFdBQVcsT0FBWCxJQUFzQmYsTUFBTWlCLEdBQU4sQ0FBVVAsTUFBVixDQUExQixFQUE2QztBQUN6QyxlQUFPLGlCQUFXUSxFQUFYLENBQWNsQixNQUFNVyxHQUFOLENBQVVELE1BQVYsQ0FBZCxDQUFQO0FBQ0g7QUFHRCxRQUFJ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QUFBQSx1QkFBS3pFLEVBQUV5RSxHQUFGLENBQU07QUFBQSwyQkFDWnZCLGdCQUFnQm5DLENBQWhCLEVBQW1Cd0MsUUFBUWQsaUJBQTNCLENBRFk7QUFBQSxpQkFBTixDQUFMO0FBQUEsYUFERixFQUdGZ0MsR0FIRSxDQUdFO0FBQUEsdUJBQ0RqRixPQUFPcUYsQ0FBUCxFQUFVdEIsUUFBUTlDLE1BQWxCLEVBQTBCLEVBQUV5QixLQUFLLFNBQVAsRUFBMUIsQ0FEQztBQUFBLGFBSEYsRUFLRjRDLFNBTEUsRUFBUDtBQU1IOzs7a0NBRWdCdEMsSSxFQUFZO0FBQ3pCLG1CQUFPQSxRQUFRLENBQUMsQ0FBQ0EsS0FBS3VDLEtBQUwsQ0FBVzNCLFlBQVgsQ0FBakI7QUFDSDs7O2tDQUNhLENBQVk7Ozs7OztBQUc5QixJQUFNdUMsWUFBWSxDQUFDLElBQUl0QyxpQkFBSixFQUFELEVBQXdCLElBQUkyQixvQkFBSixFQUF4QixDQUFsQjtBQUNBWSxPQUFPQyxPQUFQLEdBQWlCRixTQUFqQiIsImZpbGUiOiJsaWIvc2VydmljZXMvcHJvamVjdC1wcm92aWRlci5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGFqYXggfSBmcm9tICdqcXVlcnknO1xyXG5pbXBvcnQgeyBzb21lLCB0cmltLCBmaW5kLCBzdGFydHNXaXRoLCBmaW5kS2V5LCBmbGF0TWFwLCBzb3J0QnksIHVuaXEsIG1hcCB9IGZyb20gJ2xvZGFzaCc7XHJcbmltcG9ydCB7IE9ic2VydmFibGUgfSBmcm9tICdyeGpzJztcclxuaW1wb3J0IHsgT21uaSB9IGZyb20gJy4uL3NlcnZlci9vbW5pJztcclxuaW1wb3J0IHsgU29sdXRpb25NYW5hZ2VyIH0gZnJvbSAnLi4vc2VydmVyL3NvbHV0aW9uLW1hbmFnZXInO1xyXG5jb25zdCBmaWx0ZXIgPSByZXF1aXJlKCdmdXp6YWxkcmluJykuZmlsdGVyO1xyXG5pbXBvcnQgeyBSdW50aW1lIH0gZnJvbSAnb21uaXNoYXJwLWNsaWVudCc7XHJcblxyXG5jb25zdCBjYWNoZSA9IG5ldyBNYXA8c3RyaW5nLCB7IHByZWZpeD86IHN0cmluZzsgcmVzdWx0czogc3RyaW5nW10gfT4oKTtcclxuY29uc3QgdmVyc2lvbkNhY2hlID0gbmV3IE1hcDxzdHJpbmcsIGFueT4oKTtcclxuT21uaS5saXN0ZW5lci5wYWNrYWdlc291cmNlXHJcbiAgICAuZmxhdE1hcCh6ID0+IHoucmVzcG9uc2UgJiYgei5yZXNwb25zZS5Tb3VyY2VzIHx8IFtdKVxyXG4gICAgLnN1YnNjcmliZSgoc291cmNlOiBzdHJpbmcpID0+IHtcclxuICAgICAgICBpZiAoIWNhY2hlLmdldChzb3VyY2UpKVxyXG4gICAgICAgICAgICBmZXRjaEZyb21HaXRodWIoc291cmNlLCAnX2tleXMnLCAnJykuc3Vic2NyaWJlKHJlc3VsdCA9PiB7XHJcbiAgICAgICAgICAgICAgICBjYWNoZS5zZXQoc291cmNlLCByZXN1bHQpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgIH0pO1xyXG5cclxuZnVuY3Rpb24gZmV0Y2hGcm9tR2l0aHViKHNvdXJjZTogc3RyaW5nLCBwcmVmaXg6IHN0cmluZywgc2VhcmNoUHJlZml4OiBzdHJpbmcpOiBPYnNlcnZhYmxlPHsgcHJlZml4Pzogc3RyaW5nOyByZXN1bHRzOiBzdHJpbmdbXSB9PiB7XHJcbiAgICAvLyBXZSBwcmVjYWNoZSB0aGUga2V5cyB0byBtYWtlIHRoaXMgc3BlZWR5XHJcbiAgICBpZiAocHJlZml4ID09PSAnX2tleXMnICYmIGNhY2hlLmhhcyhzb3VyY2UpKSB7XHJcbiAgICAgICAgcmV0dXJuIE9ic2VydmFibGUub2YoY2FjaGUuZ2V0KHNvdXJjZSkpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIElmIHdlIGhhdmUgYSB2YWx1ZSBpbiB0aGUgY2FjaGUsIHNlZSBpZiB0aGUga2V5IGV4aXN0cyBvciBub3QuXHJcbiAgICBpZiAoY2FjaGUuaGFzKHNvdXJjZSkpIHtcclxuICAgICAgICBjb25zdCBjID0gY2FjaGUuZ2V0KHNvdXJjZSk7XHJcbiAgICAgICAgaWYgKCFjKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLm9mKGMpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCFzb21lKGMucmVzdWx0cywgeCA9PiB4LnRvTG93ZXJDYXNlKCkgPT09IHByZWZpeC50b0xvd2VyQ2FzZSgpICsgJy4nKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5vZih7IHJlc3VsdHM6IFtdIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBJZiB3ZSBoYXZlIGEgY2FjaGVkIHZhbHVlIHRoZW4gdGhlIGZhaWxlZCB2YWx1ZSBpcyBlbXB0eSAobm8gbmVlZCB0byBmYWxsIGJhY2sgdG8gdGhlIHNlcnZlcilcclxuICAgIGNvbnN0IGZhaWxlZFZhbHVlID0gY2FjaGUuaGFzKHNvdXJjZSkgJiYgISFjYWNoZS5nZXQoc291cmNlKSA/IDxhbnk+eyBwcmVmaXg6IG51bGwsIHJlc3VsdHM6IFtdIH0gOiB7IHByZWZpeDogbnVsbCwgcmVzdWx0czogbnVsbCB9O1xyXG5cclxuICAgIGNvbnN0IHJlYWxTb3VyY2UgPSBzb3VyY2U7XHJcblxyXG4gICAgLy8gVGhpcyBpcyB0aGUgc2FtZSBjb252ZW50aW9uIHVzZWQgYnkgb21uaXNoYXJwLW51Z2V0IGJ1aWxkIHRvb2xcclxuICAgIHNvdXJjZSA9IHRyaW0oc291cmNlLCAnLycpLnJlcGxhY2UoJ3d3dy4nLCAnJykucmVwbGFjZSgnaHR0cHM6Ly8nLCAnJykucmVwbGFjZSgnaHR0cDovLycsICcnKS5yZXBsYWNlKC9cXC98XFw6L2csICctJyk7XHJcblxyXG4gICAgLy8gR2V0IHRoZSBmaWxlIGZyb20gZ2l0aHViXHJcbiAgICBsZXQgcmVzdWx0ID0gYWpheChgaHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tL09tbmlTaGFycC9vbW5pc2hhcnAtbnVnZXQvcmVzb3VyY2VzL3Jlc291cmNlcy8ke3NvdXJjZX0vJHtwcmVmaXgudG9Mb3dlckNhc2UoKX0uanNvbmApLnRoZW4ocmVzID0+IEpTT04ucGFyc2UocmVzKSwgKCkgPT4geyAvKiAqLyB9KTtcclxuXHJcbiAgICAvLyBUaGUgbm9uIGtleSBmaWxlcyBoYXZlIGFuIG9iamVjdCBsYXlvdXRcclxuICAgIGlmIChwcmVmaXggIT09ICdfa2V5cycpIHtcclxuICAgICAgICBjb25zdCBzcCA9IHNlYXJjaFByZWZpeC5zcGxpdCgnLicpO1xyXG4gICAgICAgIGNvbnN0IGZpbGVQcmVmaXggPSBzcC5zbGljZSgxLCBzcC5sZW5ndGggLSAxKS5qb2luKCcuJykudG9Mb3dlckNhc2UoKTtcclxuICAgICAgICByZXN1bHQgPSByZXN1bHQudGhlbigodmFsdWU6IHsgX2tleXM6IHN0cmluZ1tdO1trZXk6IHN0cmluZ106IHN0cmluZ1tdIH0pID0+IHtcclxuICAgICAgICAgICAgY29uc3QgayA9IGZpbmQoY2FjaGUuZ2V0KHJlYWxTb3VyY2UpLnJlc3VsdHMsIHggPT4geC50b0xvd2VyQ2FzZSgpID09PSBwcmVmaXgudG9Mb3dlckNhc2UoKSk7XHJcbiAgICAgICAgICAgIGlmICghZmlsZVByZWZpeCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgcHJlZml4OiBrLCByZXN1bHRzOiB2YWx1ZS5fa2V5cyB9O1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgdiA9IGZpbmRLZXkodmFsdWUsICh4OiBhbnksIGtleTogc3RyaW5nKSA9PiBrZXkudG9Mb3dlckNhc2UoKSA9PT0gZmlsZVByZWZpeCk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBwID0gYCR7a30uJHt2fWA7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgcHJlZml4OiBrICYmIHYgJiYgcCwgcmVzdWx0czogdmFsdWVbdl0gfHwgW10gfTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICByZXN1bHQgPSByZXN1bHQudGhlbihyZXN1bHRzID0+ICh7IHByZWZpeDogJycsIHJlc3VsdHMgfSkpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFJldHVybiB0aGUgcmVzdWx0XHJcbiAgICByZXR1cm4gT2JzZXJ2YWJsZS5mcm9tUHJvbWlzZTx7IHByZWZpeDogc3RyaW5nOyByZXN1bHRzOiBzdHJpbmdbXSB9Pig8YW55PnJlc3VsdCkuY2F0Y2goKCkgPT4gT2JzZXJ2YWJsZS5vZihmYWlsZWRWYWx1ZSkpO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgSUF1dG9jb21wbGV0ZVByb3ZpZGVyT3B0aW9ucyB7XHJcbiAgICBlZGl0b3I6IEF0b20uVGV4dEVkaXRvcjtcclxuICAgIGJ1ZmZlclBvc2l0aW9uOiBUZXh0QnVmZmVyLlBvaW50OyAvLyB0aGUgcG9zaXRpb24gb2YgdGhlIGN1cnNvclxyXG4gICAgcHJlZml4OiBzdHJpbmc7XHJcbiAgICBzY29wZURlc2NyaXB0b3I6IHsgc2NvcGVzOiBzdHJpbmdbXSB9O1xyXG4gICAgYWN0aXZhdGVkTWFudWFsbHk6IGJvb2xlYW47XHJcbiAgICBwYXRoOiBzdHJpbmc7XHJcbiAgICByZXBsYWNlbWVudFByZWZpeDogc3RyaW5nO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgSUF1dG9jb21wbGV0ZVByb3ZpZGVyIHtcclxuICAgIGZpbGVNYXRjaHM6IHN0cmluZ1tdO1xyXG4gICAgcGF0aE1hdGNoOiAocGF0aDogc3RyaW5nKSA9PiBib29sZWFuO1xyXG4gICAgZ2V0U3VnZ2VzdGlvbnM6IChvcHRpb25zOiBJQXV0b2NvbXBsZXRlUHJvdmlkZXJPcHRpb25zKSA9PiBQcm9taXNlPGFueVtdPjtcclxuICAgIGRpc3Bvc2UoKTogdm9pZDtcclxufVxyXG5cclxuZnVuY3Rpb24gbWFrZVN1Z2dlc3Rpb24oaXRlbTogc3RyaW5nLCBwYXRoOiBzdHJpbmcsIHJlcGxhY2VtZW50UHJlZml4OiBzdHJpbmcpIHtcclxuICAgIGNvbnN0IHR5cGUgPSAncGFja2FnZSc7XHJcblxyXG4gICAgY29uc3QgciA9IHJlcGxhY2VtZW50UHJlZml4LnNwbGl0KCcuJyk7XHJcbiAgICBsZXQgcnMgPSByLnNsaWNlKDAsIHIubGVuZ3RoIC0gMSkuam9pbignLicpO1xyXG4gICAgaWYgKHJzLmxlbmd0aCkgcnMgKz0gJy4nO1xyXG4gICAgaWYgKHBhdGgubGVuZ3RoKSBwYXRoICs9ICcuJztcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIF9zZWFyY2g6IGl0ZW0sXHJcbiAgICAgICAgdGV4dDogYCR7cGF0aH0ke2l0ZW19YCxcclxuICAgICAgICBzbmlwcGV0OiBgJHtwYXRofSR7aXRlbX1gLFxyXG4gICAgICAgIHR5cGU6IHR5cGUsXHJcbiAgICAgICAgZGlzcGxheVRleHQ6IGl0ZW0sXHJcbiAgICAgICAgcmVwbGFjZW1lbnRQcmVmaXgsLy86IGAke3JzfSR7aXRlbX1gLFxyXG4gICAgICAgIGNsYXNzTmFtZTogJ2F1dG9jb21wbGV0ZS1wcm9qZWN0LWpzb24nLFxyXG4gICAgfTtcclxufVxyXG5cclxuZnVuY3Rpb24gbWFrZVN1Z2dlc3Rpb24yKGl0ZW06IHN0cmluZywgcmVwbGFjZW1lbnRQcmVmaXg6IHN0cmluZykge1xyXG4gICAgY29uc3QgdHlwZSA9ICd2ZXJzaW9uJztcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIF9zZWFyY2g6IGl0ZW0sXHJcbiAgICAgICAgdGV4dDogaXRlbSxcclxuICAgICAgICBzbmlwcGV0OiBpdGVtLFxyXG4gICAgICAgIHR5cGU6IHR5cGUsXHJcbiAgICAgICAgZGlzcGxheVRleHQ6IGl0ZW0sXHJcbiAgICAgICAgcmVwbGFjZW1lbnRQcmVmaXgsXHJcbiAgICAgICAgY2xhc3NOYW1lOiAnYXV0b2NvbXBsZXRlLXByb2plY3QtanNvbicsXHJcbiAgICB9O1xyXG59XHJcblxyXG5jb25zdCBuYW1lUmVnZXggPSAvXFwvP2RlcGVuZGVuY2llcyQvO1xyXG5jb25zdCB2ZXJzaW9uUmVnZXggPSAvXFwvP2RlcGVuZGVuY2llc1xcLyhbYS16QS1aMC05XFwuX10qPykoPzpcXC92ZXJzaW9uKT8kLztcclxuXHJcbmNsYXNzIE51Z2V0TmFtZVByb3ZpZGVyIGltcGxlbWVudHMgSUF1dG9jb21wbGV0ZVByb3ZpZGVyIHtcclxuICAgIHB1YmxpYyBmaWxlTWF0Y2hzID0gWydwcm9qZWN0Lmpzb24nXTtcclxuXHJcbiAgICBwdWJsaWMgZ2V0U3VnZ2VzdGlvbnMob3B0aW9uczogSUF1dG9jb21wbGV0ZVByb3ZpZGVyT3B0aW9ucykge1xyXG5cclxuICAgICAgICBjb25zdCBzZWFyY2hUb2tlbnMgPSBvcHRpb25zLnJlcGxhY2VtZW50UHJlZml4LnNwbGl0KCcuJyk7XHJcbiAgICAgICAgbGV0IHBhY2thZ2VQcmVmaXg6IHN0cmluZztcclxuICAgICAgICBpZiAob3B0aW9ucy5yZXBsYWNlbWVudFByZWZpeC5pbmRleE9mKCcuJykgPiAtMSkge1xyXG4gICAgICAgICAgICBwYWNrYWdlUHJlZml4ID0gb3B0aW9ucy5yZXBsYWNlbWVudFByZWZpeC5zcGxpdCgnLicpWzBdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIFNvbHV0aW9uTWFuYWdlci5nZXRTb2x1dGlvbkZvckVkaXRvcihvcHRpb25zLmVkaXRvcilcclxuICAgICAgICAgICAgLy8gT25seSBzdXBwb3J0ZWQgb24gRGVza3RvcCBDbHIgYXQgdGhlIG1vbWVudFxyXG4gICAgICAgICAgICAuZmlsdGVyKHggPT4geC5ydW50aW1lID09PSBSdW50aW1lLkNsck9yTW9ubylcclxuICAgICAgICAgICAgLy8gR2V0IGFsbCBzb3VyY2VzXHJcbiAgICAgICAgICAgIC5mbGF0TWFwKHogPT4gei5tb2RlbC5wYWNrYWdlU291cmNlcylcclxuICAgICAgICAgICAgLmZsYXRNYXAoc291cmNlID0+IHtcclxuICAgICAgICAgICAgICAgIC8vIEF0dGVtcHQgdG8gZ2V0IHRoZSBzb3VyY2UgZnJvbSBnaXRodWJcclxuICAgICAgICAgICAgICAgIHJldHVybiBmZXRjaEZyb21HaXRodWIoc291cmNlLCBwYWNrYWdlUHJlZml4IHx8ICdfa2V5cycsIG9wdGlvbnMucmVwbGFjZW1lbnRQcmVmaXgpXHJcbiAgICAgICAgICAgICAgICAgICAgLmZsYXRNYXAoeiA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgheikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gZmFsbCBiYWNrIHRvIHRoZSBzZXJ2ZXIgaWYgc291cmNlIGlzblwidCBmb3VuZFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5pbmZvKGBGYWxsaW5nIGJhY2sgdG8gc2VydmVyIHBhY2thZ2Ugc2VhcmNoIGZvciAke3NvdXJjZX0uYCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gT21uaS5yZXF1ZXN0KHNvbHV0aW9uID0+IHNvbHV0aW9uLnBhY2thZ2VzZWFyY2goe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFNlYXJjaDogb3B0aW9ucy5yZXBsYWNlbWVudFByZWZpeCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBJbmNsdWRlUHJlcmVsZWFzZTogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBQcm9qZWN0UGF0aDogc29sdXRpb24ucGF0aCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBTb3VyY2VzOiBbc291cmNlXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pKS5tYXAoeCA9PiAoeyBwcmVmaXg6ICcnLCByZXN1bHRzOiB4LlBhY2thZ2VzLm1hcChpdGVtID0+IGl0ZW0uSWQpIH0pKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLm9mKHopO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC50b0FycmF5KClcclxuICAgICAgICAgICAgLm1hcCh6ID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHByZWZpeCA9IGZpbmQoeiwgeCA9PiAhIXgucHJlZml4KTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHAgPSBwcmVmaXggPyBwcmVmaXgucHJlZml4IDogJyc7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG1hcChzb3J0QnkodW5pcShmbGF0TWFwKHosIGMgPT4gYy5yZXN1bHRzKSkpLFxyXG4gICAgICAgICAgICAgICAgICAgIHggPT4gbWFrZVN1Z2dlc3Rpb24oeCwgcCwgb3B0aW9ucy5yZXBsYWNlbWVudFByZWZpeCkpO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAubWFwKHMgPT5cclxuICAgICAgICAgICAgICAgIGZpbHRlcihzLCBzZWFyY2hUb2tlbnNbc2VhcmNoVG9rZW5zLmxlbmd0aCAtIDFdLCB7IGtleTogJ19zZWFyY2gnIH0pKVxyXG4gICAgICAgICAgICAudG9Qcm9taXNlKCk7XHJcbiAgICB9XHJcbiAgICBwdWJsaWMgcGF0aE1hdGNoKHBhdGg6IHN0cmluZykge1xyXG4gICAgICAgIHJldHVybiBwYXRoICYmICEhcGF0aC5tYXRjaChuYW1lUmVnZXgpO1xyXG4gICAgfVxyXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7IC8qICovIH1cclxufVxyXG5cclxuY2xhc3MgTnVnZXRWZXJzaW9uUHJvdmlkZXIgaW1wbGVtZW50cyBJQXV0b2NvbXBsZXRlUHJvdmlkZXIge1xyXG4gICAgcHVibGljIGdldFN1Z2dlc3Rpb25zKG9wdGlvbnM6IElBdXRvY29tcGxldGVQcm92aWRlck9wdGlvbnMpIHtcclxuICAgICAgICBjb25zdCBtYXRjaCA9IG9wdGlvbnMucGF0aC5tYXRjaCh2ZXJzaW9uUmVnZXgpO1xyXG4gICAgICAgIGlmICghbWF0Y2gpIHJldHVybiBQcm9taXNlLnJlc29sdmUoW10pO1xyXG4gICAgICAgIGNvbnN0IG5hbWUgPSBtYXRjaFsxXTtcclxuXHJcbiAgICAgICAgbGV0IG86IE9ic2VydmFibGU8c3RyaW5nW10+O1xyXG5cclxuICAgICAgICBpZiAodmVyc2lvbkNhY2hlLmhhcyhuYW1lKSkge1xyXG4gICAgICAgICAgICBvID0gdmVyc2lvbkNhY2hlLmdldChuYW1lKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBvID0gU29sdXRpb25NYW5hZ2VyLmdldFNvbHV0aW9uRm9yRWRpdG9yKG9wdGlvbnMuZWRpdG9yKVxyXG4gICAgICAgICAgICAgICAgLy8gR2V0IGFsbCBzb3VyY2VzXHJcbiAgICAgICAgICAgICAgICAuZmxhdE1hcCh6ID0+IHoubW9kZWwucGFja2FnZVNvdXJjZXMpXHJcbiAgICAgICAgICAgICAgICAuZmlsdGVyKHogPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChjYWNoZS5oYXMoeikpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gU2hvcnQgb3V0IGVhcmx5IGlmIHRoZSBzb3VyY2UgZG9lc25cInQgZXZlbiBoYXZlIHRoZSBnaXZlbiBwcmVmaXhcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNvbWUoY2FjaGUuZ2V0KHopLnJlc3VsdHMsIHggPT4gc3RhcnRzV2l0aChuYW1lLCB4KSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIC50b0FycmF5KClcclxuICAgICAgICAgICAgICAgIC5mbGF0TWFwKHNvdXJjZXMgPT4gT21uaS5yZXF1ZXN0KHNvbHV0aW9uID0+IHNvbHV0aW9uLnBhY2thZ2V2ZXJzaW9uKHtcclxuICAgICAgICAgICAgICAgICAgICBJZDogbmFtZSxcclxuICAgICAgICAgICAgICAgICAgICBJbmNsdWRlUHJlcmVsZWFzZTogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICBQcm9qZWN0UGF0aDogc29sdXRpb24ucGF0aCxcclxuICAgICAgICAgICAgICAgICAgICBTb3VyY2VzOiBzb3VyY2VzLFxyXG4gICAgICAgICAgICAgICAgfSkpXHJcbiAgICAgICAgICAgICAgICAgICAgLmZsYXRNYXAoeiA9PiB6LlZlcnNpb25zKVxyXG4gICAgICAgICAgICAgICAgICAgIC50b0FycmF5KCkpXHJcbiAgICAgICAgICAgICAgICAucHVibGlzaFJlcGxheSgxKS5yZWZDb3VudCgpO1xyXG5cclxuICAgICAgICAgICAgdmVyc2lvbkNhY2hlLnNldChuYW1lLCBvKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBvLnRha2UoMSlcclxuICAgICAgICAgICAgLm1hcCh6ID0+IHoubWFwKHggPT5cclxuICAgICAgICAgICAgICAgIG1ha2VTdWdnZXN0aW9uMih4LCBvcHRpb25zLnJlcGxhY2VtZW50UHJlZml4KSkpXHJcbiAgICAgICAgICAgIC5tYXAocyA9PlxyXG4gICAgICAgICAgICAgICAgZmlsdGVyKHMsIG9wdGlvbnMucHJlZml4LCB7IGtleTogJ19zZWFyY2gnIH0pKVxyXG4gICAgICAgICAgICAudG9Qcm9taXNlKCk7XHJcbiAgICB9XHJcbiAgICBwdWJsaWMgZmlsZU1hdGNocyA9IFsncHJvamVjdC5qc29uJ107XHJcbiAgICBwdWJsaWMgcGF0aE1hdGNoKHBhdGg6IHN0cmluZykge1xyXG4gICAgICAgIHJldHVybiBwYXRoICYmICEhcGF0aC5tYXRjaCh2ZXJzaW9uUmVnZXgpO1xyXG4gICAgfVxyXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7IC8qICovIH1cclxufVxyXG5cclxuY29uc3QgcHJvdmlkZXJzID0gW25ldyBOdWdldE5hbWVQcm92aWRlciwgbmV3IE51Z2V0VmVyc2lvblByb3ZpZGVyXTtcclxubW9kdWxlLmV4cG9ydHMgPSBwcm92aWRlcnM7XHJcbiJdfQ==
