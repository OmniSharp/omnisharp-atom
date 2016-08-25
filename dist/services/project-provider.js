"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _rxjs = require("rxjs");

var _omni = require("../server/omni");

var _solutionManager = require("../server/solution-manager");

var _jquery = require("jquery");

var _omnisharpClient = require("omnisharp-client");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var filter = require("fuzzaldrin").filter;

var cache = new Map();
var versionCache = new Map();
_omni.Omni.listener.packagesource.flatMap(function (z) {
    return z.response && z.response.Sources || [];
}).subscribe(function (source) {
    if (!cache.get(source)) fetchFromGithub(source, "_keys", "").subscribe(function (result) {
        cache.set(source, result);
    });
});
function fetchFromGithub(source, prefix, searchPrefix) {
    if (prefix === "_keys" && cache.has(source)) {
        return _rxjs.Observable.of(cache.get(source));
    }
    if (cache.has(source)) {
        var c = cache.get(source);
        if (!c) {
            return _rxjs.Observable.of(c);
        }
        if (!_lodash2.default.some(c.results, function (x) {
            return x.toLowerCase() === prefix.toLowerCase() + ".";
        })) {
            return _rxjs.Observable.of({ results: [] });
        }
    }
    var failedValue = cache.has(source) && !!cache.get(source) ? { prefix: null, results: [] } : { prefix: null, results: null };
    var realSource = source;
    source = _lodash2.default.trim(source, "/").replace("www.", "").replace("https://", "").replace("http://", "").replace(/\/|\:/g, "-");
    var result = (0, _jquery.ajax)("https://raw.githubusercontent.com/OmniSharp/omnisharp-nuget/resources/resources/" + source + "/" + prefix.toLowerCase() + ".json").then(function (res) {
        return JSON.parse(res);
    }, function () {});
    if (prefix !== "_keys") {
        (function () {
            var sp = searchPrefix.split(".");
            var filePrefix = sp.slice(1, sp.length - 1).join(".").toLowerCase();
            result = result.then(function (value) {
                var k = _lodash2.default.find(cache.get(realSource).results, function (x) {
                    return x.toLowerCase() === prefix.toLowerCase();
                });
                if (!filePrefix) {
                    return { prefix: k, results: value._keys };
                } else {
                    var v = _lodash2.default.findKey(value, function (x, key) {
                        return key.toLowerCase() === filePrefix;
                    }),
                        p = k + "." + v;
                    return { prefix: k && v && p, results: value[v] || [] };
                }
            });
        })();
    } else {
        result = result.then(function (results) {
            return { prefix: "", results: results };
        });
    }
    return _rxjs.Observable.fromPromise(result).catch(function () {
        return _rxjs.Observable.of(failedValue);
    });
}
function makeSuggestion(item, path, replacementPrefix) {
    var type = "package";
    var r = replacementPrefix.split(".");
    var rs = r.slice(0, r.length - 1).join(".");
    if (rs.length) rs += ".";
    if (path.length) path += ".";
    return {
        _search: item,
        text: "" + path + item,
        snippet: "" + path + item,
        type: type,
        displayText: item,
        replacementPrefix: replacementPrefix,
        className: "autocomplete-project-json"
    };
}
function makeSuggestion2(item, replacementPrefix) {
    var type = "version";
    return {
        _search: item,
        text: item,
        snippet: item,
        type: type,
        displayText: item,
        replacementPrefix: replacementPrefix,
        className: "autocomplete-project-json"
    };
}
var nameRegex = /\/?dependencies$/;
var versionRegex = /\/?dependencies\/([a-zA-Z0-9\._]*?)(?:\/version)?$/;

var NugetNameProvider = function () {
    function NugetNameProvider() {
        _classCallCheck(this, NugetNameProvider);

        this.fileMatchs = ["project.json"];
    }

    _createClass(NugetNameProvider, [{
        key: "getSuggestions",
        value: function getSuggestions(options) {
            var searchTokens = options.replacementPrefix.split(".");
            var packagePrefix = void 0;
            if (options.replacementPrefix.indexOf(".") > -1) {
                packagePrefix = options.replacementPrefix.split(".")[0];
            }
            return _solutionManager.SolutionManager.getSolutionForEditor(options.editor).filter(function (x) {
                return x.runtime === _omnisharpClient.Runtime.ClrOrMono;
            }).flatMap(function (z) {
                return z.model.packageSources;
            }).flatMap(function (source) {
                return fetchFromGithub(source, packagePrefix || "_keys", options.replacementPrefix).flatMap(function (z) {
                    if (!z) {
                        console.info("Falling back to server package search for " + source + ".");
                        return _omni.Omni.request(function (solution) {
                            return solution.packagesearch({
                                Search: options.replacementPrefix,
                                IncludePrerelease: true,
                                ProjectPath: solution.path,
                                Sources: [source]
                            });
                        }).map(function (x) {
                            return { prefix: "", results: x.Packages.map(function (item) {
                                    return item.Id;
                                }) };
                        });
                    } else {
                        return _rxjs.Observable.of(z);
                    }
                });
            }).toArray().map(function (z) {
                var prefix = _lodash2.default.find(z, function (x) {
                    return !!x.prefix;
                });
                var p = prefix ? prefix.prefix : "";
                return (0, _lodash2.default)(z.map(function (x) {
                    return x.results;
                })).flatten().sortBy().uniq().map(function (x) {
                    return makeSuggestion(x, p, options.replacementPrefix);
                }).value();
            }).map(function (s) {
                return filter(s, searchTokens[searchTokens.length - 1], { key: "_search" });
            }).toPromise();
        }
    }, {
        key: "pathMatch",
        value: function pathMatch(path) {
            return path && !!path.match(nameRegex);
        }
    }, {
        key: "dispose",
        value: function dispose() {}
    }]);

    return NugetNameProvider;
}();

var NugetVersionProvider = function () {
    function NugetVersionProvider() {
        _classCallCheck(this, NugetVersionProvider);

        this.fileMatchs = ["project.json"];
    }

    _createClass(NugetVersionProvider, [{
        key: "getSuggestions",
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
                        return _lodash2.default.some(cache.get(z).results, function (x) {
                            return _lodash2.default.startsWith(name, x);
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
                return filter(s, options.prefix, { key: "_search" });
            }).toPromise();
        }
    }, {
        key: "pathMatch",
        value: function pathMatch(path) {
            return path && !!path.match(versionRegex);
        }
    }, {
        key: "dispose",
        value: function dispose() {}
    }]);

    return NugetVersionProvider;
}();

var providers = [new NugetNameProvider(), new NugetVersionProvider()];
module.exports = providers;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9zZXJ2aWNlcy9wcm9qZWN0LXByb3ZpZGVyLmpzIiwibGliL3NlcnZpY2VzL3Byb2plY3QtcHJvdmlkZXIudHMiXSwibmFtZXMiOlsiZmlsdGVyIiwicmVxdWlyZSIsImNhY2hlIiwiTWFwIiwidmVyc2lvbkNhY2hlIiwibGlzdGVuZXIiLCJwYWNrYWdlc291cmNlIiwiZmxhdE1hcCIsInoiLCJyZXNwb25zZSIsIlNvdXJjZXMiLCJzdWJzY3JpYmUiLCJzb3VyY2UiLCJnZXQiLCJmZXRjaEZyb21HaXRodWIiLCJzZXQiLCJyZXN1bHQiLCJwcmVmaXgiLCJzZWFyY2hQcmVmaXgiLCJoYXMiLCJvZiIsImMiLCJzb21lIiwicmVzdWx0cyIsIngiLCJ0b0xvd2VyQ2FzZSIsImZhaWxlZFZhbHVlIiwicmVhbFNvdXJjZSIsInRyaW0iLCJyZXBsYWNlIiwidGhlbiIsIkpTT04iLCJwYXJzZSIsInJlcyIsInNwIiwic3BsaXQiLCJmaWxlUHJlZml4Iiwic2xpY2UiLCJsZW5ndGgiLCJqb2luIiwidmFsdWUiLCJrIiwiZmluZCIsIl9rZXlzIiwidiIsImZpbmRLZXkiLCJrZXkiLCJwIiwiZnJvbVByb21pc2UiLCJjYXRjaCIsIm1ha2VTdWdnZXN0aW9uIiwiaXRlbSIsInBhdGgiLCJyZXBsYWNlbWVudFByZWZpeCIsInR5cGUiLCJyIiwicnMiLCJfc2VhcmNoIiwidGV4dCIsInNuaXBwZXQiLCJkaXNwbGF5VGV4dCIsImNsYXNzTmFtZSIsIm1ha2VTdWdnZXN0aW9uMiIsIm5hbWVSZWdleCIsInZlcnNpb25SZWdleCIsIk51Z2V0TmFtZVByb3ZpZGVyIiwiZmlsZU1hdGNocyIsIm9wdGlvbnMiLCJzZWFyY2hUb2tlbnMiLCJwYWNrYWdlUHJlZml4IiwiaW5kZXhPZiIsImdldFNvbHV0aW9uRm9yRWRpdG9yIiwiZWRpdG9yIiwicnVudGltZSIsIkNsck9yTW9ubyIsIm1vZGVsIiwicGFja2FnZVNvdXJjZXMiLCJjb25zb2xlIiwiaW5mbyIsInJlcXVlc3QiLCJzb2x1dGlvbiIsInBhY2thZ2VzZWFyY2giLCJTZWFyY2giLCJJbmNsdWRlUHJlcmVsZWFzZSIsIlByb2plY3RQYXRoIiwibWFwIiwiUGFja2FnZXMiLCJJZCIsInRvQXJyYXkiLCJmbGF0dGVuIiwic29ydEJ5IiwidW5pcSIsInMiLCJ0b1Byb21pc2UiLCJtYXRjaCIsIk51Z2V0VmVyc2lvblByb3ZpZGVyIiwiUHJvbWlzZSIsInJlc29sdmUiLCJuYW1lIiwibyIsInN0YXJ0c1dpdGgiLCJwYWNrYWdldmVyc2lvbiIsInNvdXJjZXMiLCJWZXJzaW9ucyIsInB1Ymxpc2hSZXBsYXkiLCJyZWZDb3VudCIsInRha2UiLCJwcm92aWRlcnMiLCJtb2R1bGUiLCJleHBvcnRzIl0sIm1hcHBpbmdzIjoiOzs7O0FBQUE7Ozs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFFQTs7Ozs7O0FDREEsSUFBTUEsU0FBU0MsUUFBUSxZQUFSLEVBQXNCRCxNQUFyQzs7QUFHQSxJQUFNRSxRQUFRLElBQUlDLEdBQUosRUFBZDtBQUNBLElBQU1DLGVBQWUsSUFBSUQsR0FBSixFQUFyQjtBQUNBLFdBQUtFLFFBQUwsQ0FBY0MsYUFBZCxDQUNLQyxPQURMLENBQ2E7QUFBQSxXQUFLQyxFQUFFQyxRQUFGLElBQWNELEVBQUVDLFFBQUYsQ0FBV0MsT0FBekIsSUFBb0MsRUFBekM7QUFBQSxDQURiLEVBRUtDLFNBRkwsQ0FFZSxVQUFDQyxNQUFELEVBQWU7QUFDdEIsUUFBSSxDQUFDVixNQUFNVyxHQUFOLENBQVVELE1BQVYsQ0FBTCxFQUNJRSxnQkFBZ0JGLE1BQWhCLEVBQXdCLE9BQXhCLEVBQWlDLEVBQWpDLEVBQXFDRCxTQUFyQyxDQUErQyxrQkFBTTtBQUNqRFQsY0FBTWEsR0FBTixDQUFVSCxNQUFWLEVBQWtCSSxNQUFsQjtBQUNILEtBRkQ7QUFHUCxDQVBMO0FBU0EsU0FBQUYsZUFBQSxDQUF5QkYsTUFBekIsRUFBeUNLLE1BQXpDLEVBQXlEQyxZQUF6RCxFQUE2RTtBQUV6RSxRQUFJRCxXQUFXLE9BQVgsSUFBc0JmLE1B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LHlCQUF4QixDQUFaO0FBQUEscUJBQWIsRUFNZi9GLE9BTmUsQ0FNUDtBQUFBLCtCQUFLQyxFQUFFK0YsUUFBUDtBQUFBLHFCQU5PLEVBT2ZmLE9BUGUsRUFBWDtBQUFBLGlCQVhULEVBbUJDZ0IsYUFuQkQsQ0FtQmUsQ0FuQmYsRUFtQmtCQyxRQW5CbEIsRUFBSjtBQXFCQXJHLDZCQUFhVyxHQUFiLENBQWlCbUYsSUFBakIsRUFBdUJDLENBQXZCO0FBQ0g7QUFFRCxtQkFBT0EsRUFBRU8sSUFBRixDQUFPLENBQVAsRUFDRnJCLEdBREUsQ0FDRTtBQUFBLHVCQUFLN0UsRUFBRTZFLEdBQUYsQ0FBTTtBQUFBLDJCQUNadkIsZ0JBQWdCdEMsQ0FBaEIsRUFBbUIyQyxRQUFRZCxpQkFBM0IsQ0FEWTtBQUFBLGlCQUFOLENBQUw7QUFBQSxhQURGLEVBR0ZnQyxHQUhFLENBR0U7QUFBQSx1QkFDRHJGLE9BQU80RixDQUFQLEVBQVV6QixRQUFRbEQsTUFBbEIsRUFBMEIsRUFBRTZCLEtBQUssU0FBUCxFQUExQixDQURDO0FBQUEsYUFIRixFQUtGK0MsU0FMRSxFQUFQO0FBTUg7OztrQ0FFZ0J6QyxJLEVBQVk7QUFDekIsbUJBQU9BLFFBQVEsQ0FBQyxDQUFDQSxLQUFLMEMsS0FBTCxDQUFXOUIsWUFBWCxDQUFqQjtBQUNIOzs7a0NBQ2EsQ0FBWTs7Ozs7O0FBRzlCLElBQU0yQyxZQUFZLENBQUMsSUFBSTFDLGlCQUFKLEVBQUQsRUFBd0IsSUFBSThCLG9CQUFKLEVBQXhCLENBQWxCO0FBQ0FhLE9BQU9DLE9BQVAsR0FBaUJGLFNBQWpCIiwiZmlsZSI6ImxpYi9zZXJ2aWNlcy9wcm9qZWN0LXByb3ZpZGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xuaW1wb3J0IHsgT2JzZXJ2YWJsZSB9IGZyb20gXCJyeGpzXCI7XG5pbXBvcnQgeyBPbW5pIH0gZnJvbSBcIi4uL3NlcnZlci9vbW5pXCI7XG5pbXBvcnQgeyBTb2x1dGlvbk1hbmFnZXIgfSBmcm9tIFwiLi4vc2VydmVyL3NvbHV0aW9uLW1hbmFnZXJcIjtcbmltcG9ydCB7IGFqYXggfSBmcm9tIFwianF1ZXJ5XCI7XG5jb25zdCBmaWx0ZXIgPSByZXF1aXJlKFwiZnV6emFsZHJpblwiKS5maWx0ZXI7XG5pbXBvcnQgeyBSdW50aW1lIH0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcbmNvbnN0IGNhY2hlID0gbmV3IE1hcCgpO1xuY29uc3QgdmVyc2lvbkNhY2hlID0gbmV3IE1hcCgpO1xuT21uaS5saXN0ZW5lci5wYWNrYWdlc291cmNlXG4gICAgLmZsYXRNYXAoeiA9PiB6LnJlc3BvbnNlICYmIHoucmVzcG9uc2UuU291cmNlcyB8fCBbXSlcbiAgICAuc3Vic2NyaWJlKChzb3VyY2UpID0+IHtcbiAgICBpZiAoIWNhY2hlLmdldChzb3VyY2UpKVxuICAgICAgICBmZXRjaEZyb21HaXRodWIoc291cmNlLCBcIl9rZXlzXCIsIFwiXCIpLnN1YnNjcmliZShyZXN1bHQgPT4ge1xuICAgICAgICAgICAgY2FjaGUuc2V0KHNvdXJjZSwgcmVzdWx0KTtcbiAgICAgICAgfSk7XG59KTtcbmZ1bmN0aW9uIGZldGNoRnJvbUdpdGh1Yihzb3VyY2UsIHByZWZpeCwgc2VhcmNoUHJlZml4KSB7XG4gICAgaWYgKHByZWZpeCA9PT0gXCJfa2V5c1wiICYmIGNhY2hlLmhhcyhzb3VyY2UpKSB7XG4gICAgICAgIHJldHVybiBPYnNlcnZhYmxlLm9mKGNhY2hlLmdldChzb3VyY2UpKTtcbiAgICB9XG4gICAgaWYgKGNhY2hlLmhhcyhzb3VyY2UpKSB7XG4gICAgICAgIGNvbnN0IGMgPSBjYWNoZS5nZXQoc291cmNlKTtcbiAgICAgICAgaWYgKCFjKSB7XG4gICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5vZihjKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIV8uc29tZShjLnJlc3VsdHMsIHggPT4geC50b0xvd2VyQ2FzZSgpID09PSBwcmVmaXgudG9Mb3dlckNhc2UoKSArIFwiLlwiKSkge1xuICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUub2YoeyByZXN1bHRzOiBbXSB9KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBjb25zdCBmYWlsZWRWYWx1ZSA9IGNhY2hlLmhhcyhzb3VyY2UpICYmICEhY2FjaGUuZ2V0KHNvdXJjZSkgPyB7IHByZWZpeDogbnVsbCwgcmVzdWx0czogW10gfSA6IHsgcHJlZml4OiBudWxsLCByZXN1bHRzOiBudWxsIH07XG4gICAgY29uc3QgcmVhbFNvdXJjZSA9IHNvdXJjZTtcbiAgICBzb3VyY2UgPSBfLnRyaW0oc291cmNlLCBcIi9cIikucmVwbGFjZShcInd3dy5cIiwgXCJcIikucmVwbGFjZShcImh0dHBzOi8vXCIsIFwiXCIpLnJlcGxhY2UoXCJodHRwOi8vXCIsIFwiXCIpLnJlcGxhY2UoL1xcL3xcXDovZywgXCItXCIpO1xuICAgIGxldCByZXN1bHQgPSBhamF4KGBodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vT21uaVNoYXJwL29tbmlzaGFycC1udWdldC9yZXNvdXJjZXMvcmVzb3VyY2VzLyR7c291cmNlfS8ke3ByZWZpeC50b0xvd2VyQ2FzZSgpfS5qc29uYCkudGhlbihyZXMgPT4gSlNPTi5wYXJzZShyZXMpLCAoKSA9PiB7IH0pO1xuICAgIGlmIChwcmVmaXggIT09IFwiX2tleXNcIikge1xuICAgICAgICBjb25zdCBzcCA9IHNlYXJjaFByZWZpeC5zcGxpdChcIi5cIik7XG4gICAgICAgIGNvbnN0IGZpbGVQcmVmaXggPSBzcC5zbGljZSgxLCBzcC5sZW5ndGggLSAxKS5qb2luKFwiLlwiKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICByZXN1bHQgPSByZXN1bHQudGhlbigodmFsdWUpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGsgPSBfLmZpbmQoY2FjaGUuZ2V0KHJlYWxTb3VyY2UpLnJlc3VsdHMsIHggPT4geC50b0xvd2VyQ2FzZSgpID09PSBwcmVmaXgudG9Mb3dlckNhc2UoKSk7XG4gICAgICAgICAgICBpZiAoIWZpbGVQcmVmaXgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geyBwcmVmaXg6IGssIHJlc3VsdHM6IHZhbHVlLl9rZXlzIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zdCB2ID0gXy5maW5kS2V5KHZhbHVlLCAoeCwga2V5KSA9PiBrZXkudG9Mb3dlckNhc2UoKSA9PT0gZmlsZVByZWZpeCksIHAgPSBgJHtrfS4ke3Z9YDtcbiAgICAgICAgICAgICAgICByZXR1cm4geyBwcmVmaXg6IGsgJiYgdiAmJiBwLCByZXN1bHRzOiB2YWx1ZVt2XSB8fCBbXSB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHJlc3VsdCA9IHJlc3VsdC50aGVuKChyZXN1bHRzKSA9PiAoeyBwcmVmaXg6IFwiXCIsIHJlc3VsdHMgfSkpO1xuICAgIH1cbiAgICByZXR1cm4gT2JzZXJ2YWJsZS5mcm9tUHJvbWlzZShyZXN1bHQpLmNhdGNoKCgpID0+IE9ic2VydmFibGUub2YoZmFpbGVkVmFsdWUpKTtcbn1cbmZ1bmN0aW9uIG1ha2VTdWdnZXN0aW9uKGl0ZW0sIHBhdGgsIHJlcGxhY2VtZW50UHJlZml4KSB7XG4gICAgY29uc3QgdHlwZSA9IFwicGFja2FnZVwiO1xuICAgIGNvbnN0IHIgPSByZXBsYWNlbWVudFByZWZpeC5zcGxpdChcIi5cIik7XG4gICAgbGV0IHJzID0gci5zbGljZSgwLCByLmxlbmd0aCAtIDEpLmpvaW4oXCIuXCIpO1xuICAgIGlmIChycy5sZW5ndGgpXG4gICAgICAgIHJzICs9IFwiLlwiO1xuICAgIGlmIChwYXRoLmxlbmd0aClcbiAgICAgICAgcGF0aCArPSBcIi5cIjtcbiAgICByZXR1cm4ge1xuICAgICAgICBfc2VhcmNoOiBpdGVtLFxuICAgICAgICB0ZXh0OiBgJHtwYXRofSR7aXRlbX1gLFxuICAgICAgICBzbmlwcGV0OiBgJHtwYXRofSR7aXRlbX1gLFxuICAgICAgICB0eXBlOiB0eXBlLFxuICAgICAgICBkaXNwbGF5VGV4dDogaXRlbSxcbiAgICAgICAgcmVwbGFjZW1lbnRQcmVmaXgsXG4gICAgICAgIGNsYXNzTmFtZTogXCJhdXRvY29tcGxldGUtcHJvamVjdC1qc29uXCIsXG4gICAgfTtcbn1cbmZ1bmN0aW9uIG1ha2VTdWdnZXN0aW9uMihpdGVtLCByZXBsYWNlbWVudFByZWZpeCkge1xuICAgIGNvbnN0IHR5cGUgPSBcInZlcnNpb25cIjtcbiAgICByZXR1cm4ge1xuICAgICAgICBfc2VhcmNoOiBpdGVtLFxuICAgICAgICB0ZXh0OiBpdGVtLFxuICAgICAgICBzbmlwcGV0OiBpdGVtLFxuICAgICAgICB0eXBlOiB0eXBlLFxuICAgICAgICBkaXNwbGF5VGV4dDogaXRlbSxcbiAgICAgICAgcmVwbGFjZW1lbnRQcmVmaXgsXG4gICAgICAgIGNsYXNzTmFtZTogXCJhdXRvY29tcGxldGUtcHJvamVjdC1qc29uXCIsXG4gICAgfTtcbn1cbmNvbnN0IG5hbWVSZWdleCA9IC9cXC8/ZGVwZW5kZW5jaWVzJC87XG5jb25zdCB2ZXJzaW9uUmVnZXggPSAvXFwvP2RlcGVuZGVuY2llc1xcLyhbYS16QS1aMC05XFwuX10qPykoPzpcXC92ZXJzaW9uKT8kLztcbmNsYXNzIE51Z2V0TmFtZVByb3ZpZGVyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5maWxlTWF0Y2hzID0gW1wicHJvamVjdC5qc29uXCJdO1xuICAgIH1cbiAgICBnZXRTdWdnZXN0aW9ucyhvcHRpb25zKSB7XG4gICAgICAgIGNvbnN0IHNlYXJjaFRva2VucyA9IG9wdGlvbnMucmVwbGFjZW1lbnRQcmVmaXguc3BsaXQoXCIuXCIpO1xuICAgICAgICBsZXQgcGFja2FnZVByZWZpeDtcbiAgICAgICAgaWYgKG9wdGlvbnMucmVwbGFjZW1lbnRQcmVmaXguaW5kZXhPZihcIi5cIikgPiAtMSkge1xuICAgICAgICAgICAgcGFja2FnZVByZWZpeCA9IG9wdGlvbnMucmVwbGFjZW1lbnRQcmVmaXguc3BsaXQoXCIuXCIpWzBdO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBTb2x1dGlvbk1hbmFnZXIuZ2V0U29sdXRpb25Gb3JFZGl0b3Iob3B0aW9ucy5lZGl0b3IpXG4gICAgICAgICAgICAuZmlsdGVyKHggPT4geC5ydW50aW1lID09PSBSdW50aW1lLkNsck9yTW9ubylcbiAgICAgICAgICAgIC5mbGF0TWFwKHogPT4gei5tb2RlbC5wYWNrYWdlU291cmNlcylcbiAgICAgICAgICAgIC5mbGF0TWFwKHNvdXJjZSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gZmV0Y2hGcm9tR2l0aHViKHNvdXJjZSwgcGFja2FnZVByZWZpeCB8fCBcIl9rZXlzXCIsIG9wdGlvbnMucmVwbGFjZW1lbnRQcmVmaXgpXG4gICAgICAgICAgICAgICAgLmZsYXRNYXAoeiA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKCF6KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuaW5mbyhgRmFsbGluZyBiYWNrIHRvIHNlcnZlciBwYWNrYWdlIHNlYXJjaCBmb3IgJHtzb3VyY2V9LmApO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gT21uaS5yZXF1ZXN0KHNvbHV0aW9uID0+IHNvbHV0aW9uLnBhY2thZ2VzZWFyY2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgU2VhcmNoOiBvcHRpb25zLnJlcGxhY2VtZW50UHJlZml4LFxuICAgICAgICAgICAgICAgICAgICAgICAgSW5jbHVkZVByZXJlbGVhc2U6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBQcm9qZWN0UGF0aDogc29sdXRpb24ucGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgIFNvdXJjZXM6IFtzb3VyY2VdLFxuICAgICAgICAgICAgICAgICAgICB9KSkubWFwKHggPT4gKHsgcHJlZml4OiBcIlwiLCByZXN1bHRzOiB4LlBhY2thZ2VzLm1hcChpdGVtID0+IGl0ZW0uSWQpIH0pKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLm9mKHopO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KVxuICAgICAgICAgICAgLnRvQXJyYXkoKVxuICAgICAgICAgICAgLm1hcCh6ID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHByZWZpeCA9IF8uZmluZCh6LCB4ID0+ICEheC5wcmVmaXgpO1xuICAgICAgICAgICAgY29uc3QgcCA9IHByZWZpeCA/IHByZWZpeC5wcmVmaXggOiBcIlwiO1xuICAgICAgICAgICAgcmV0dXJuIF8oei5tYXAoeCA9PiB4LnJlc3VsdHMpKVxuICAgICAgICAgICAgICAgIC5mbGF0dGVuKClcbiAgICAgICAgICAgICAgICAuc29ydEJ5KClcbiAgICAgICAgICAgICAgICAudW5pcSgpXG4gICAgICAgICAgICAgICAgLm1hcCh4ID0+IG1ha2VTdWdnZXN0aW9uKHgsIHAsIG9wdGlvbnMucmVwbGFjZW1lbnRQcmVmaXgpKVxuICAgICAgICAgICAgICAgIC52YWx1ZSgpO1xuICAgICAgICB9KVxuICAgICAgICAgICAgLm1hcChzID0+IGZpbHRlcihzLCBzZWFyY2hUb2tlbnNbc2VhcmNoVG9rZW5zLmxlbmd0aCAtIDFdLCB7IGtleTogXCJfc2VhcmNoXCIgfSkpXG4gICAgICAgICAgICAudG9Qcm9taXNlKCk7XG4gICAgfVxuICAgIHBhdGhNYXRjaChwYXRoKSB7XG4gICAgICAgIHJldHVybiBwYXRoICYmICEhcGF0aC5tYXRjaChuYW1lUmVnZXgpO1xuICAgIH1cbiAgICBkaXNwb3NlKCkgeyB9XG59XG5jbGFzcyBOdWdldFZlcnNpb25Qcm92aWRlciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuZmlsZU1hdGNocyA9IFtcInByb2plY3QuanNvblwiXTtcbiAgICB9XG4gICAgZ2V0U3VnZ2VzdGlvbnMob3B0aW9ucykge1xuICAgICAgICBjb25zdCBtYXRjaCA9IG9wdGlvbnMucGF0aC5tYXRjaCh2ZXJzaW9uUmVnZXgpO1xuICAgICAgICBpZiAoIW1hdGNoKVxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbXSk7XG4gICAgICAgIGNvbnN0IG5hbWUgPSBtYXRjaFsxXTtcbiAgICAgICAgbGV0IG87XG4gICAgICAgIGlmICh2ZXJzaW9uQ2FjaGUuaGFzKG5hbWUpKSB7XG4gICAgICAgICAgICBvID0gdmVyc2lvbkNhY2hlLmdldChuYW1lKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIG8gPSBTb2x1dGlvbk1hbmFnZXIuZ2V0U29sdXRpb25Gb3JFZGl0b3Iob3B0aW9ucy5lZGl0b3IpXG4gICAgICAgICAgICAgICAgLmZsYXRNYXAoeiA9PiB6Lm1vZGVsLnBhY2thZ2VTb3VyY2VzKVxuICAgICAgICAgICAgICAgIC5maWx0ZXIoeiA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGNhY2hlLmhhcyh6KSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gXy5zb21lKGNhY2hlLmdldCh6KS5yZXN1bHRzLCB4ID0+IF8uc3RhcnRzV2l0aChuYW1lLCB4KSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAudG9BcnJheSgpXG4gICAgICAgICAgICAgICAgLmZsYXRNYXAoc291cmNlcyA9PiBPbW5pLnJlcXVlc3Qoc29sdXRpb24gPT4gc29sdXRpb24ucGFja2FnZXZlcnNpb24oe1xuICAgICAgICAgICAgICAgIElkOiBuYW1lLFxuICAgICAgICAgICAgICAgIEluY2x1ZGVQcmVyZWxlYXNlOiB0cnVlLFxuICAgICAgICAgICAgICAgIFByb2plY3RQYXRoOiBzb2x1dGlvbi5wYXRoLFxuICAgICAgICAgICAgICAgIFNvdXJjZXM6IHNvdXJjZXMsXG4gICAgICAgICAgICB9KSlcbiAgICAgICAgICAgICAgICAuZmxhdE1hcCh6ID0+IHouVmVyc2lvbnMpXG4gICAgICAgICAgICAgICAgLnRvQXJyYXkoKSlcbiAgICAgICAgICAgICAgICAucHVibGlzaFJlcGxheSgxKS5yZWZDb3VudCgpO1xuICAgICAgICAgICAgdmVyc2lvbkNhY2hlLnNldChuYW1lLCBvKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gby50YWtlKDEpXG4gICAgICAgICAgICAubWFwKHogPT4gei5tYXAoeCA9PiBtYWtlU3VnZ2VzdGlvbjIoeCwgb3B0aW9ucy5yZXBsYWNlbWVudFByZWZpeCkpKVxuICAgICAgICAgICAgLm1hcChzID0+IGZpbHRlcihzLCBvcHRpb25zLnByZWZpeCwgeyBrZXk6IFwiX3NlYXJjaFwiIH0pKVxuICAgICAgICAgICAgLnRvUHJvbWlzZSgpO1xuICAgIH1cbiAgICBwYXRoTWF0Y2gocGF0aCkge1xuICAgICAgICByZXR1cm4gcGF0aCAmJiAhIXBhdGgubWF0Y2godmVyc2lvblJlZ2V4KTtcbiAgICB9XG4gICAgZGlzcG9zZSgpIHsgfVxufVxuY29uc3QgcHJvdmlkZXJzID0gW25ldyBOdWdldE5hbWVQcm92aWRlciwgbmV3IE51Z2V0VmVyc2lvblByb3ZpZGVyXTtcbm1vZHVsZS5leHBvcnRzID0gcHJvdmlkZXJzO1xuIiwiaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xyXG5pbXBvcnQge09ic2VydmFibGV9IGZyb20gXCJyeGpzXCI7XHJcbmltcG9ydCB7T21uaX0gZnJvbSBcIi4uL3NlcnZlci9vbW5pXCI7XHJcbmltcG9ydCB7U29sdXRpb25NYW5hZ2VyfSBmcm9tIFwiLi4vc2VydmVyL3NvbHV0aW9uLW1hbmFnZXJcIjtcclxuaW1wb3J0IHthamF4fSBmcm9tIFwianF1ZXJ5XCI7XHJcbmNvbnN0IGZpbHRlciA9IHJlcXVpcmUoXCJmdXp6YWxkcmluXCIpLmZpbHRlcjtcclxuaW1wb3J0IHtSdW50aW1lfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xyXG5cclxuY29uc3QgY2FjaGUgPSBuZXcgTWFwPHN0cmluZywgeyBwcmVmaXg/OiBzdHJpbmc7IHJlc3VsdHM6IHN0cmluZ1tdIH0+KCk7XHJcbmNvbnN0IHZlcnNpb25DYWNoZSA9IG5ldyBNYXA8c3RyaW5nLCBhbnk+KCk7XHJcbk9tbmkubGlzdGVuZXIucGFja2FnZXNvdXJjZVxyXG4gICAgLmZsYXRNYXAoeiA9PiB6LnJlc3BvbnNlICYmIHoucmVzcG9uc2UuU291cmNlcyB8fCBbXSlcclxuICAgIC5zdWJzY3JpYmUoKHNvdXJjZTogc3RyaW5nKSA9PiB7XHJcbiAgICAgICAgaWYgKCFjYWNoZS5nZXQoc291cmNlKSlcclxuICAgICAgICAgICAgZmV0Y2hGcm9tR2l0aHViKHNvdXJjZSwgXCJfa2V5c1wiLCBcIlwiKS5zdWJzY3JpYmUocmVzdWx0ID0+IHtcclxuICAgICAgICAgICAgICAgIGNhY2hlLnNldChzb3VyY2UsIHJlc3VsdCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgfSk7XHJcblxyXG5mdW5jdGlvbiBmZXRjaEZyb21HaXRodWIoc291cmNlOiBzdHJpbmcsIHByZWZpeDogc3RyaW5nLCBzZWFyY2hQcmVmaXg6IHN0cmluZyk6IE9ic2VydmFibGU8eyBwcmVmaXg/OiBzdHJpbmc7IHJlc3VsdHM6IHN0cmluZ1tdIH0+IHtcclxuICAgIC8vIFdlIHByZWNhY2hlIHRoZSBrZXlzIHRvIG1ha2UgdGhpcyBzcGVlZHlcclxuICAgIGlmIChwcmVmaXggPT09IFwiX2tleXNcIiAmJiBjYWNoZS5oYXMoc291cmNlKSkge1xyXG4gICAgICAgIHJldHVybiBPYnNlcnZhYmxlLm9mKGNhY2hlLmdldChzb3VyY2UpKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBJZiB3ZSBoYXZlIGEgdmFsdWUgaW4gdGhlIGNhY2hlLCBzZWUgaWYgdGhlIGtleSBleGlzdHMgb3Igbm90LlxyXG4gICAgaWYgKGNhY2hlLmhhcyhzb3VyY2UpKSB7XHJcbiAgICAgICAgY29uc3QgYyA9IGNhY2hlLmdldChzb3VyY2UpO1xyXG4gICAgICAgIGlmICghYykge1xyXG4gICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5vZihjKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghXy5zb21lKGMucmVzdWx0cywgeCA9PiB4LnRvTG93ZXJDYXNlKCkgPT09IHByZWZpeC50b0xvd2VyQ2FzZSgpICsgXCIuXCIpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLm9mKHsgcmVzdWx0czogW10gfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIElmIHdlIGhhdmUgYSBjYWNoZWQgdmFsdWUgdGhlbiB0aGUgZmFpbGVkIHZhbHVlIGlzIGVtcHR5IChubyBuZWVkIHRvIGZhbGwgYmFjayB0byB0aGUgc2VydmVyKVxyXG4gICAgY29uc3QgZmFpbGVkVmFsdWUgPSBjYWNoZS5oYXMoc291cmNlKSAmJiAhIWNhY2hlLmdldChzb3VyY2UpID8gPGFueT57IHByZWZpeDogbnVsbCwgcmVzdWx0czogW10gfSA6IHsgcHJlZml4OiBudWxsLCByZXN1bHRzOiBudWxsIH07XHJcblxyXG4gICAgY29uc3QgcmVhbFNvdXJjZSA9IHNvdXJjZTtcclxuXHJcbiAgICAvLyBUaGlzIGlzIHRoZSBzYW1lIGNvbnZlbnRpb24gdXNlZCBieSBvbW5pc2hhcnAtbnVnZXQgYnVpbGQgdG9vbFxyXG4gICAgc291cmNlID0gXy50cmltKHNvdXJjZSwgXCIvXCIpLnJlcGxhY2UoXCJ3d3cuXCIsIFwiXCIpLnJlcGxhY2UoXCJodHRwczovL1wiLCBcIlwiKS5yZXBsYWNlKFwiaHR0cDovL1wiLCBcIlwiKS5yZXBsYWNlKC9cXC98XFw6L2csIFwiLVwiKTtcclxuXHJcbiAgICAvLyBHZXQgdGhlIGZpbGUgZnJvbSBnaXRodWJcclxuICAgIGxldCByZXN1bHQgPSBhamF4KGBodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vT21uaVNoYXJwL29tbmlzaGFycC1udWdldC9yZXNvdXJjZXMvcmVzb3VyY2VzLyR7c291cmNlfS8ke3ByZWZpeC50b0xvd2VyQ2FzZSgpfS5qc29uYCkudGhlbihyZXMgPT4gSlNPTi5wYXJzZShyZXMpLCAoKSA9PiB7IC8qICovIH0pO1xyXG5cclxuICAgIC8vIFRoZSBub24ga2V5IGZpbGVzIGhhdmUgYW4gb2JqZWN0IGxheW91dFxyXG4gICAgaWYgKHByZWZpeCAhPT0gXCJfa2V5c1wiKSB7XHJcbiAgICAgICAgY29uc3Qgc3AgPSBzZWFyY2hQcmVmaXguc3BsaXQoXCIuXCIpO1xyXG4gICAgICAgIGNvbnN0IGZpbGVQcmVmaXggPSBzcC5zbGljZSgxLCBzcC5sZW5ndGggLSAxKS5qb2luKFwiLlwiKS50b0xvd2VyQ2FzZSgpO1xyXG4gICAgICAgIHJlc3VsdCA9IHJlc3VsdC50aGVuKCh2YWx1ZTogeyBfa2V5czogc3RyaW5nW107W2tleTogc3RyaW5nXTogc3RyaW5nW10gfSkgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBrID0gXy5maW5kKGNhY2hlLmdldChyZWFsU291cmNlKS5yZXN1bHRzLCB4ID0+IHgudG9Mb3dlckNhc2UoKSA9PT0gcHJlZml4LnRvTG93ZXJDYXNlKCkpO1xyXG4gICAgICAgICAgICBpZiAoIWZpbGVQcmVmaXgpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB7IHByZWZpeDogaywgcmVzdWx0czogdmFsdWUuX2tleXMgfTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHYgPSAoPGFueT5fKS5maW5kS2V5KHZhbHVlLCAoeDogYW55LCBrZXk6IHN0cmluZykgPT4ga2V5LnRvTG93ZXJDYXNlKCkgPT09IGZpbGVQcmVmaXgpLFxyXG4gICAgICAgICAgICAgICAgICAgIHAgPSBgJHtrfS4ke3Z9YDtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4geyBwcmVmaXg6IGsgJiYgdiAmJiBwLCByZXN1bHRzOiB2YWx1ZVt2XSB8fCBbXSB9O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJlc3VsdCA9IHJlc3VsdC50aGVuKChyZXN1bHRzKSA9PiAoeyBwcmVmaXg6IFwiXCIsIHJlc3VsdHMgfSkpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFJldHVybiB0aGUgcmVzdWx0XHJcbiAgICByZXR1cm4gT2JzZXJ2YWJsZS5mcm9tUHJvbWlzZTx7IHByZWZpeDogc3RyaW5nOyByZXN1bHRzOiBzdHJpbmdbXSB9Pig8YW55PnJlc3VsdCkuY2F0Y2goKCkgPT4gT2JzZXJ2YWJsZS5vZihmYWlsZWRWYWx1ZSkpO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgSUF1dG9jb21wbGV0ZVByb3ZpZGVyT3B0aW9ucyB7XHJcbiAgICBlZGl0b3I6IEF0b20uVGV4dEVkaXRvcjtcclxuICAgIGJ1ZmZlclBvc2l0aW9uOiBUZXh0QnVmZmVyLlBvaW50OyAvLyB0aGUgcG9zaXRpb24gb2YgdGhlIGN1cnNvclxyXG4gICAgcHJlZml4OiBzdHJpbmc7XHJcbiAgICBzY29wZURlc2NyaXB0b3I6IHsgc2NvcGVzOiBzdHJpbmdbXSB9O1xyXG4gICAgYWN0aXZhdGVkTWFudWFsbHk6IGJvb2xlYW47XHJcbiAgICBwYXRoOiBzdHJpbmc7XHJcbiAgICByZXBsYWNlbWVudFByZWZpeDogc3RyaW5nO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgSUF1dG9jb21wbGV0ZVByb3ZpZGVyIHtcclxuICAgIGZpbGVNYXRjaHM6IHN0cmluZ1tdO1xyXG4gICAgcGF0aE1hdGNoOiAocGF0aDogc3RyaW5nKSA9PiBib29sZWFuO1xyXG4gICAgZ2V0U3VnZ2VzdGlvbnM6IChvcHRpb25zOiBJQXV0b2NvbXBsZXRlUHJvdmlkZXJPcHRpb25zKSA9PiBQcm9taXNlPGFueVtdPjtcclxuICAgIGRpc3Bvc2UoKTogdm9pZDtcclxufVxyXG5cclxuZnVuY3Rpb24gbWFrZVN1Z2dlc3Rpb24oaXRlbTogc3RyaW5nLCBwYXRoOiBzdHJpbmcsIHJlcGxhY2VtZW50UHJlZml4OiBzdHJpbmcpIHtcclxuICAgIGNvbnN0IHR5cGUgPSBcInBhY2thZ2VcIjtcclxuXHJcbiAgICBjb25zdCByID0gcmVwbGFjZW1lbnRQcmVmaXguc3BsaXQoXCIuXCIpO1xyXG4gICAgbGV0IHJzID0gci5zbGljZSgwLCByLmxlbmd0aCAtIDEpLmpvaW4oXCIuXCIpO1xyXG4gICAgaWYgKHJzLmxlbmd0aCkgcnMgKz0gXCIuXCI7XHJcbiAgICBpZiAocGF0aC5sZW5ndGgpIHBhdGggKz0gXCIuXCI7XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBfc2VhcmNoOiBpdGVtLFxyXG4gICAgICAgIHRleHQ6IGAke3BhdGh9JHtpdGVtfWAsXHJcbiAgICAgICAgc25pcHBldDogYCR7cGF0aH0ke2l0ZW19YCxcclxuICAgICAgICB0eXBlOiB0eXBlLFxyXG4gICAgICAgIGRpc3BsYXlUZXh0OiBpdGVtLFxyXG4gICAgICAgIHJlcGxhY2VtZW50UHJlZml4LC8vOiBgJHtyc30ke2l0ZW19YCxcclxuICAgICAgICBjbGFzc05hbWU6IFwiYXV0b2NvbXBsZXRlLXByb2plY3QtanNvblwiLFxyXG4gICAgfTtcclxufVxyXG5cclxuZnVuY3Rpb24gbWFrZVN1Z2dlc3Rpb24yKGl0ZW06IHN0cmluZywgcmVwbGFjZW1lbnRQcmVmaXg6IHN0cmluZykge1xyXG4gICAgY29uc3QgdHlwZSA9IFwidmVyc2lvblwiO1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgX3NlYXJjaDogaXRlbSxcclxuICAgICAgICB0ZXh0OiBpdGVtLFxyXG4gICAgICAgIHNuaXBwZXQ6IGl0ZW0sXHJcbiAgICAgICAgdHlwZTogdHlwZSxcclxuICAgICAgICBkaXNwbGF5VGV4dDogaXRlbSxcclxuICAgICAgICByZXBsYWNlbWVudFByZWZpeCxcclxuICAgICAgICBjbGFzc05hbWU6IFwiYXV0b2NvbXBsZXRlLXByb2plY3QtanNvblwiLFxyXG4gICAgfTtcclxufVxyXG5cclxuY29uc3QgbmFtZVJlZ2V4ID0gL1xcLz9kZXBlbmRlbmNpZXMkLztcclxuY29uc3QgdmVyc2lvblJlZ2V4ID0gL1xcLz9kZXBlbmRlbmNpZXNcXC8oW2EtekEtWjAtOVxcLl9dKj8pKD86XFwvdmVyc2lvbik/JC87XHJcblxyXG5jbGFzcyBOdWdldE5hbWVQcm92aWRlciBpbXBsZW1lbnRzIElBdXRvY29tcGxldGVQcm92aWRlciB7XHJcbiAgICBwdWJsaWMgZ2V0U3VnZ2VzdGlvbnMob3B0aW9uczogSUF1dG9jb21wbGV0ZVByb3ZpZGVyT3B0aW9ucykge1xyXG5cclxuICAgICAgICBjb25zdCBzZWFyY2hUb2tlbnMgPSBvcHRpb25zLnJlcGxhY2VtZW50UHJlZml4LnNwbGl0KFwiLlwiKTtcclxuICAgICAgICBsZXQgcGFja2FnZVByZWZpeDogc3RyaW5nO1xyXG4gICAgICAgIGlmIChvcHRpb25zLnJlcGxhY2VtZW50UHJlZml4LmluZGV4T2YoXCIuXCIpID4gLTEpIHtcclxuICAgICAgICAgICAgcGFja2FnZVByZWZpeCA9IG9wdGlvbnMucmVwbGFjZW1lbnRQcmVmaXguc3BsaXQoXCIuXCIpWzBdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIFNvbHV0aW9uTWFuYWdlci5nZXRTb2x1dGlvbkZvckVkaXRvcihvcHRpb25zLmVkaXRvcilcclxuICAgICAgICAgICAgLy8gT25seSBzdXBwb3J0ZWQgb24gRGVza3RvcCBDbHIgYXQgdGhlIG1vbWVudFxyXG4gICAgICAgICAgICAuZmlsdGVyKHggPT4geC5ydW50aW1lID09PSBSdW50aW1lLkNsck9yTW9ubylcclxuICAgICAgICAgICAgLy8gR2V0IGFsbCBzb3VyY2VzXHJcbiAgICAgICAgICAgIC5mbGF0TWFwKHogPT4gei5tb2RlbC5wYWNrYWdlU291cmNlcylcclxuICAgICAgICAgICAgLmZsYXRNYXAoc291cmNlID0+IHtcclxuICAgICAgICAgICAgICAgIC8vIEF0dGVtcHQgdG8gZ2V0IHRoZSBzb3VyY2UgZnJvbSBnaXRodWJcclxuICAgICAgICAgICAgICAgIHJldHVybiBmZXRjaEZyb21HaXRodWIoc291cmNlLCBwYWNrYWdlUHJlZml4IHx8IFwiX2tleXNcIiwgb3B0aW9ucy5yZXBsYWNlbWVudFByZWZpeClcclxuICAgICAgICAgICAgICAgICAgICAuZmxhdE1hcCh6ID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCF6KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBmYWxsIGJhY2sgdG8gdGhlIHNlcnZlciBpZiBzb3VyY2UgaXNuXCJ0IGZvdW5kXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmluZm8oYEZhbGxpbmcgYmFjayB0byBzZXJ2ZXIgcGFja2FnZSBzZWFyY2ggZm9yICR7c291cmNlfS5gKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBPbW5pLnJlcXVlc3Qoc29sdXRpb24gPT4gc29sdXRpb24ucGFja2FnZXNlYXJjaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgU2VhcmNoOiBvcHRpb25zLnJlcGxhY2VtZW50UHJlZml4LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEluY2x1ZGVQcmVyZWxlYXNlOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFByb2plY3RQYXRoOiBzb2x1dGlvbi5wYXRoLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFNvdXJjZXM6IFtzb3VyY2VdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSkpLm1hcCh4ID0+ICh7IHByZWZpeDogXCJcIiwgcmVzdWx0czogeC5QYWNrYWdlcy5tYXAoaXRlbSA9PiBpdGVtLklkKSB9KSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5vZih6KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAudG9BcnJheSgpXHJcbiAgICAgICAgICAgIC5tYXAoeiA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBwcmVmaXggPSBfLmZpbmQoeiwgeCA9PiAhIXgucHJlZml4KTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHAgPSBwcmVmaXggPyBwcmVmaXgucHJlZml4IDogXCJcIjtcclxuICAgICAgICAgICAgICAgIHJldHVybiBfKHoubWFwKHggPT4geC5yZXN1bHRzKSlcclxuICAgICAgICAgICAgICAgICAgICAuZmxhdHRlbjxzdHJpbmc+KClcclxuICAgICAgICAgICAgICAgICAgICAuc29ydEJ5KClcclxuICAgICAgICAgICAgICAgICAgICAudW5pcSgpXHJcbiAgICAgICAgICAgICAgICAgICAgLm1hcCh4ID0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1ha2VTdWdnZXN0aW9uKHgsIHAsIG9wdGlvbnMucmVwbGFjZW1lbnRQcmVmaXgpKVxyXG4gICAgICAgICAgICAgICAgICAgIC52YWx1ZSgpO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAubWFwKHMgPT5cclxuICAgICAgICAgICAgICAgIGZpbHRlcihzLCBzZWFyY2hUb2tlbnNbc2VhcmNoVG9rZW5zLmxlbmd0aCAtIDFdLCB7IGtleTogXCJfc2VhcmNoXCIgfSkpXHJcbiAgICAgICAgICAgIC50b1Byb21pc2UoKTtcclxuICAgIH1cclxuICAgIHB1YmxpYyBmaWxlTWF0Y2hzID0gW1wicHJvamVjdC5qc29uXCJdO1xyXG4gICAgcHVibGljIHBhdGhNYXRjaChwYXRoOiBzdHJpbmcpIHtcclxuICAgICAgICByZXR1cm4gcGF0aCAmJiAhIXBhdGgubWF0Y2gobmFtZVJlZ2V4KTtcclxuICAgIH1cclxuICAgIHB1YmxpYyBkaXNwb3NlKCkgeyAvKiAqLyB9XHJcbn1cclxuXHJcbmNsYXNzIE51Z2V0VmVyc2lvblByb3ZpZGVyIGltcGxlbWVudHMgSUF1dG9jb21wbGV0ZVByb3ZpZGVyIHtcclxuICAgIHB1YmxpYyBnZXRTdWdnZXN0aW9ucyhvcHRpb25zOiBJQXV0b2NvbXBsZXRlUHJvdmlkZXJPcHRpb25zKSB7XHJcbiAgICAgICAgY29uc3QgbWF0Y2ggPSBvcHRpb25zLnBhdGgubWF0Y2godmVyc2lvblJlZ2V4KTtcclxuICAgICAgICBpZiAoIW1hdGNoKSByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtdKTtcclxuICAgICAgICBjb25zdCBuYW1lID0gbWF0Y2hbMV07XHJcblxyXG4gICAgICAgIGxldCBvOiBPYnNlcnZhYmxlPHN0cmluZ1tdPjtcclxuXHJcbiAgICAgICAgaWYgKHZlcnNpb25DYWNoZS5oYXMobmFtZSkpIHtcclxuICAgICAgICAgICAgbyA9IHZlcnNpb25DYWNoZS5nZXQobmFtZSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgbyA9IFNvbHV0aW9uTWFuYWdlci5nZXRTb2x1dGlvbkZvckVkaXRvcihvcHRpb25zLmVkaXRvcilcclxuICAgICAgICAgICAgICAgIC8vIEdldCBhbGwgc291cmNlc1xyXG4gICAgICAgICAgICAgICAgLmZsYXRNYXAoeiA9PiB6Lm1vZGVsLnBhY2thZ2VTb3VyY2VzKVxyXG4gICAgICAgICAgICAgICAgLmZpbHRlcih6ID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoY2FjaGUuaGFzKHopKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNob3J0IG91dCBlYXJseSBpZiB0aGUgc291cmNlIGRvZXNuXCJ0IGV2ZW4gaGF2ZSB0aGUgZ2l2ZW4gcHJlZml4XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBfLnNvbWUoY2FjaGUuZ2V0KHopLnJlc3VsdHMsIHggPT4gXy5zdGFydHNXaXRoKG5hbWUsIHgpKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgLnRvQXJyYXkoKVxyXG4gICAgICAgICAgICAgICAgLmZsYXRNYXAoc291cmNlcyA9PiBPbW5pLnJlcXVlc3Qoc29sdXRpb24gPT4gc29sdXRpb24ucGFja2FnZXZlcnNpb24oe1xyXG4gICAgICAgICAgICAgICAgICAgIElkOiBuYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIEluY2x1ZGVQcmVyZWxlYXNlOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgIFByb2plY3RQYXRoOiBzb2x1dGlvbi5wYXRoLFxyXG4gICAgICAgICAgICAgICAgICAgIFNvdXJjZXM6IHNvdXJjZXMsXHJcbiAgICAgICAgICAgICAgICB9KSlcclxuICAgICAgICAgICAgICAgICAgICAuZmxhdE1hcCh6ID0+IHouVmVyc2lvbnMpXHJcbiAgICAgICAgICAgICAgICAgICAgLnRvQXJyYXkoKSlcclxuICAgICAgICAgICAgICAgIC5wdWJsaXNoUmVwbGF5KDEpLnJlZkNvdW50KCk7XHJcblxyXG4gICAgICAgICAgICB2ZXJzaW9uQ2FjaGUuc2V0KG5hbWUsIG8pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG8udGFrZSgxKVxyXG4gICAgICAgICAgICAubWFwKHogPT4gei5tYXAoeCA9PlxyXG4gICAgICAgICAgICAgICAgbWFrZVN1Z2dlc3Rpb24yKHgsIG9wdGlvbnMucmVwbGFjZW1lbnRQcmVmaXgpKSlcclxuICAgICAgICAgICAgLm1hcChzID0+XHJcbiAgICAgICAgICAgICAgICBmaWx0ZXIocywgb3B0aW9ucy5wcmVmaXgsIHsga2V5OiBcIl9zZWFyY2hcIiB9KSlcclxuICAgICAgICAgICAgLnRvUHJvbWlzZSgpO1xyXG4gICAgfVxyXG4gICAgcHVibGljIGZpbGVNYXRjaHMgPSBbXCJwcm9qZWN0Lmpzb25cIl07XHJcbiAgICBwdWJsaWMgcGF0aE1hdGNoKHBhdGg6IHN0cmluZykge1xyXG4gICAgICAgIHJldHVybiBwYXRoICYmICEhcGF0aC5tYXRjaCh2ZXJzaW9uUmVnZXgpO1xyXG4gICAgfVxyXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7IC8qICovIH1cclxufVxyXG5cclxuY29uc3QgcHJvdmlkZXJzID0gW25ldyBOdWdldE5hbWVQcm92aWRlciwgbmV3IE51Z2V0VmVyc2lvblByb3ZpZGVyXTtcclxubW9kdWxlLmV4cG9ydHMgPSBwcm92aWRlcnM7XHJcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
