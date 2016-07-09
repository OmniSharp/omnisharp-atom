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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9zZXJ2aWNlcy9wcm9qZWN0LXByb3ZpZGVyLmpzIiwibGliL3NlcnZpY2VzL3Byb2plY3QtcHJvdmlkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQUFBOzs7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBRUE7Ozs7OztBQ0RBLElBQU0sU0FBUyxRQUFRLFlBQVIsRUFBc0IsTUFBckM7O0FBR0EsSUFBTSxRQUFRLElBQUksR0FBSixFQUFkO0FBQ0EsSUFBTSxlQUFlLElBQUksR0FBSixFQUFyQjtBQUNBLFdBQUssUUFBTCxDQUFjLGFBQWQsQ0FDSyxPQURMLENBQ2E7QUFBQSxXQUFLLEVBQUUsUUFBRixJQUFjLEVBQUUsUUFBRixDQUFXLE9BQXpCLElBQW9DLEVBQXpDO0FBQUEsQ0FEYixFQUVLLFNBRkwsQ0FFZSxVQUFDLE1BQUQsRUFBZTtBQUN0QixRQUFJLENBQUMsTUFBTSxHQUFOLENBQVUsTUFBVixDQUFMLEVBQ0ksZ0JBQWdCLE1BQWhCLEVBQXdCLE9BQXhCLEVBQWlDLEVBQWpDLEVBQXFDLFNBQXJDLENBQStDLGtCQUFNO0FBQ2pELGNBQU0sR0FBTixDQUFVLE1BQVYsRUFBa0IsTUFBbEI7QUFDSCxLQUZEO0FBR1AsQ0FQTDtBQVNBLFNBQUEsZUFBQSxDQUF5QixNQUF6QixFQUF5QyxNQUF6QyxFQUF5RCxZQUF6RCxFQUE2RTtBQUV6RSxRQUFJLFdBQVcsT0FBWCxJQUFzQixNQUFNLEdBQU4sQ0FBVSxNQUFWLENBQTFCLEVBQTZDO0FBQ3pDLGVBQU8saUJBQVcsRUFBWCxDQUFjLE1BQU0sR0FBTixDQUFVLE1BQVYsQ0FBZCxDQUFQO0FBQ0g7QUFHRCxRQUFJLE1BQU0sR0FBTixDQUFVLE1BQVYsQ0FBSixFQUF1QjtBQUNuQixZQUFNLElBQUksTUFBTSxHQUFOLENBQVUsTUFBVixDQUFWO0FBQ0EsWUFBSSxDQUFDLENBQUwsRUFBUTtBQUNKLG1CQUFPLGlCQUFXLEVBQVgsQ0FBYyxDQUFkLENBQVA7QUFDSDtBQUVELFlB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b250ZW50IjpbImltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcbmltcG9ydCB7IE9ic2VydmFibGUgfSBmcm9tIFwicnhqc1wiO1xuaW1wb3J0IHsgT21uaSB9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xuaW1wb3J0IHsgU29sdXRpb25NYW5hZ2VyIH0gZnJvbSBcIi4uL3NlcnZlci9zb2x1dGlvbi1tYW5hZ2VyXCI7XG5pbXBvcnQgeyBhamF4IH0gZnJvbSBcImpxdWVyeVwiO1xuY29uc3QgZmlsdGVyID0gcmVxdWlyZShcImZ1enphbGRyaW5cIikuZmlsdGVyO1xuaW1wb3J0IHsgUnVudGltZSB9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XG5jb25zdCBjYWNoZSA9IG5ldyBNYXAoKTtcbmNvbnN0IHZlcnNpb25DYWNoZSA9IG5ldyBNYXAoKTtcbk9tbmkubGlzdGVuZXIucGFja2FnZXNvdXJjZVxuICAgIC5mbGF0TWFwKHogPT4gei5yZXNwb25zZSAmJiB6LnJlc3BvbnNlLlNvdXJjZXMgfHwgW10pXG4gICAgLnN1YnNjcmliZSgoc291cmNlKSA9PiB7XG4gICAgaWYgKCFjYWNoZS5nZXQoc291cmNlKSlcbiAgICAgICAgZmV0Y2hGcm9tR2l0aHViKHNvdXJjZSwgXCJfa2V5c1wiLCBcIlwiKS5zdWJzY3JpYmUocmVzdWx0ID0+IHtcbiAgICAgICAgICAgIGNhY2hlLnNldChzb3VyY2UsIHJlc3VsdCk7XG4gICAgICAgIH0pO1xufSk7XG5mdW5jdGlvbiBmZXRjaEZyb21HaXRodWIoc291cmNlLCBwcmVmaXgsIHNlYXJjaFByZWZpeCkge1xuICAgIGlmIChwcmVmaXggPT09IFwiX2tleXNcIiAmJiBjYWNoZS5oYXMoc291cmNlKSkge1xuICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5vZihjYWNoZS5nZXQoc291cmNlKSk7XG4gICAgfVxuICAgIGlmIChjYWNoZS5oYXMoc291cmNlKSkge1xuICAgICAgICBjb25zdCBjID0gY2FjaGUuZ2V0KHNvdXJjZSk7XG4gICAgICAgIGlmICghYykge1xuICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUub2YoYyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFfLnNvbWUoYy5yZXN1bHRzLCB4ID0+IHgudG9Mb3dlckNhc2UoKSA9PT0gcHJlZml4LnRvTG93ZXJDYXNlKCkgKyBcIi5cIikpIHtcbiAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLm9mKHsgcmVzdWx0czogW10gfSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgY29uc3QgZmFpbGVkVmFsdWUgPSBjYWNoZS5oYXMoc291cmNlKSAmJiAhIWNhY2hlLmdldChzb3VyY2UpID8geyBwcmVmaXg6IG51bGwsIHJlc3VsdHM6IFtdIH0gOiB7IHByZWZpeDogbnVsbCwgcmVzdWx0czogbnVsbCB9O1xuICAgIGNvbnN0IHJlYWxTb3VyY2UgPSBzb3VyY2U7XG4gICAgc291cmNlID0gXy50cmltKHNvdXJjZSwgXCIvXCIpLnJlcGxhY2UoXCJ3d3cuXCIsIFwiXCIpLnJlcGxhY2UoXCJodHRwczovL1wiLCBcIlwiKS5yZXBsYWNlKFwiaHR0cDovL1wiLCBcIlwiKS5yZXBsYWNlKC9cXC98XFw6L2csIFwiLVwiKTtcbiAgICBsZXQgcmVzdWx0ID0gYWpheChgaHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tL09tbmlTaGFycC9vbW5pc2hhcnAtbnVnZXQvcmVzb3VyY2VzL3Jlc291cmNlcy8ke3NvdXJjZX0vJHtwcmVmaXgudG9Mb3dlckNhc2UoKX0uanNvbmApLnRoZW4ocmVzID0+IEpTT04ucGFyc2UocmVzKSwgKCkgPT4geyB9KTtcbiAgICBpZiAocHJlZml4ICE9PSBcIl9rZXlzXCIpIHtcbiAgICAgICAgY29uc3Qgc3AgPSBzZWFyY2hQcmVmaXguc3BsaXQoXCIuXCIpO1xuICAgICAgICBjb25zdCBmaWxlUHJlZml4ID0gc3Auc2xpY2UoMSwgc3AubGVuZ3RoIC0gMSkuam9pbihcIi5cIikudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgcmVzdWx0ID0gcmVzdWx0LnRoZW4oKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBrID0gXy5maW5kKGNhY2hlLmdldChyZWFsU291cmNlKS5yZXN1bHRzLCB4ID0+IHgudG9Mb3dlckNhc2UoKSA9PT0gcHJlZml4LnRvTG93ZXJDYXNlKCkpO1xuICAgICAgICAgICAgaWYgKCFmaWxlUHJlZml4KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgcHJlZml4OiBrLCByZXN1bHRzOiB2YWx1ZS5fa2V5cyB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdiA9IF8uZmluZEtleSh2YWx1ZSwgKHgsIGtleSkgPT4ga2V5LnRvTG93ZXJDYXNlKCkgPT09IGZpbGVQcmVmaXgpLCBwID0gYCR7a30uJHt2fWA7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgcHJlZml4OiBrICYmIHYgJiYgcCwgcmVzdWx0czogdmFsdWVbdl0gfHwgW10gfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICByZXN1bHQgPSByZXN1bHQudGhlbigocmVzdWx0cykgPT4gKHsgcHJlZml4OiBcIlwiLCByZXN1bHRzIH0pKTtcbiAgICB9XG4gICAgcmV0dXJuIE9ic2VydmFibGUuZnJvbVByb21pc2UocmVzdWx0KS5jYXRjaCgoKSA9PiBPYnNlcnZhYmxlLm9mKGZhaWxlZFZhbHVlKSk7XG59XG5mdW5jdGlvbiBtYWtlU3VnZ2VzdGlvbihpdGVtLCBwYXRoLCByZXBsYWNlbWVudFByZWZpeCkge1xuICAgIGNvbnN0IHR5cGUgPSBcInBhY2thZ2VcIjtcbiAgICBjb25zdCByID0gcmVwbGFjZW1lbnRQcmVmaXguc3BsaXQoXCIuXCIpO1xuICAgIGxldCBycyA9IHIuc2xpY2UoMCwgci5sZW5ndGggLSAxKS5qb2luKFwiLlwiKTtcbiAgICBpZiAocnMubGVuZ3RoKVxuICAgICAgICBycyArPSBcIi5cIjtcbiAgICBpZiAocGF0aC5sZW5ndGgpXG4gICAgICAgIHBhdGggKz0gXCIuXCI7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgX3NlYXJjaDogaXRlbSxcbiAgICAgICAgdGV4dDogYCR7cGF0aH0ke2l0ZW19YCxcbiAgICAgICAgc25pcHBldDogYCR7cGF0aH0ke2l0ZW19YCxcbiAgICAgICAgdHlwZTogdHlwZSxcbiAgICAgICAgZGlzcGxheVRleHQ6IGl0ZW0sXG4gICAgICAgIHJlcGxhY2VtZW50UHJlZml4LFxuICAgICAgICBjbGFzc05hbWU6IFwiYXV0b2NvbXBsZXRlLXByb2plY3QtanNvblwiLFxuICAgIH07XG59XG5mdW5jdGlvbiBtYWtlU3VnZ2VzdGlvbjIoaXRlbSwgcmVwbGFjZW1lbnRQcmVmaXgpIHtcbiAgICBjb25zdCB0eXBlID0gXCJ2ZXJzaW9uXCI7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgX3NlYXJjaDogaXRlbSxcbiAgICAgICAgdGV4dDogaXRlbSxcbiAgICAgICAgc25pcHBldDogaXRlbSxcbiAgICAgICAgdHlwZTogdHlwZSxcbiAgICAgICAgZGlzcGxheVRleHQ6IGl0ZW0sXG4gICAgICAgIHJlcGxhY2VtZW50UHJlZml4LFxuICAgICAgICBjbGFzc05hbWU6IFwiYXV0b2NvbXBsZXRlLXByb2plY3QtanNvblwiLFxuICAgIH07XG59XG5jb25zdCBuYW1lUmVnZXggPSAvXFwvP2RlcGVuZGVuY2llcyQvO1xuY29uc3QgdmVyc2lvblJlZ2V4ID0gL1xcLz9kZXBlbmRlbmNpZXNcXC8oW2EtekEtWjAtOVxcLl9dKj8pKD86XFwvdmVyc2lvbik/JC87XG5jbGFzcyBOdWdldE5hbWVQcm92aWRlciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuZmlsZU1hdGNocyA9IFtcInByb2plY3QuanNvblwiXTtcbiAgICB9XG4gICAgZ2V0U3VnZ2VzdGlvbnMob3B0aW9ucykge1xuICAgICAgICBjb25zdCBzZWFyY2hUb2tlbnMgPSBvcHRpb25zLnJlcGxhY2VtZW50UHJlZml4LnNwbGl0KFwiLlwiKTtcbiAgICAgICAgbGV0IHBhY2thZ2VQcmVmaXg7XG4gICAgICAgIGlmIChvcHRpb25zLnJlcGxhY2VtZW50UHJlZml4LmluZGV4T2YoXCIuXCIpID4gLTEpIHtcbiAgICAgICAgICAgIHBhY2thZ2VQcmVmaXggPSBvcHRpb25zLnJlcGxhY2VtZW50UHJlZml4LnNwbGl0KFwiLlwiKVswXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gU29sdXRpb25NYW5hZ2VyLmdldFNvbHV0aW9uRm9yRWRpdG9yKG9wdGlvbnMuZWRpdG9yKVxuICAgICAgICAgICAgLmZpbHRlcih4ID0+IHgucnVudGltZSA9PT0gUnVudGltZS5DbHJPck1vbm8pXG4gICAgICAgICAgICAuZmxhdE1hcCh6ID0+IHoubW9kZWwucGFja2FnZVNvdXJjZXMpXG4gICAgICAgICAgICAuZmxhdE1hcChzb3VyY2UgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGZldGNoRnJvbUdpdGh1Yihzb3VyY2UsIHBhY2thZ2VQcmVmaXggfHwgXCJfa2V5c1wiLCBvcHRpb25zLnJlcGxhY2VtZW50UHJlZml4KVxuICAgICAgICAgICAgICAgIC5mbGF0TWFwKHogPT4ge1xuICAgICAgICAgICAgICAgIGlmICgheikge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmluZm8oYEZhbGxpbmcgYmFjayB0byBzZXJ2ZXIgcGFja2FnZSBzZWFyY2ggZm9yICR7c291cmNlfS5gKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIE9tbmkucmVxdWVzdChzb2x1dGlvbiA9PiBzb2x1dGlvbi5wYWNrYWdlc2VhcmNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFNlYXJjaDogb3B0aW9ucy5yZXBsYWNlbWVudFByZWZpeCxcbiAgICAgICAgICAgICAgICAgICAgICAgIEluY2x1ZGVQcmVyZWxlYXNlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgUHJvamVjdFBhdGg6IHNvbHV0aW9uLnBhdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICBTb3VyY2VzOiBbc291cmNlXSxcbiAgICAgICAgICAgICAgICAgICAgfSkpLm1hcCh4ID0+ICh7IHByZWZpeDogXCJcIiwgcmVzdWx0czogeC5QYWNrYWdlcy5tYXAoaXRlbSA9PiBpdGVtLklkKSB9KSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5vZih6KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSlcbiAgICAgICAgICAgIC50b0FycmF5KClcbiAgICAgICAgICAgIC5tYXAoeiA9PiB7XG4gICAgICAgICAgICBjb25zdCBwcmVmaXggPSBfLmZpbmQoeiwgeCA9PiAhIXgucHJlZml4KTtcbiAgICAgICAgICAgIGNvbnN0IHAgPSBwcmVmaXggPyBwcmVmaXgucHJlZml4IDogXCJcIjtcbiAgICAgICAgICAgIHJldHVybiBfKHoubWFwKHggPT4geC5yZXN1bHRzKSlcbiAgICAgICAgICAgICAgICAuZmxhdHRlbigpXG4gICAgICAgICAgICAgICAgLnNvcnRCeSgpXG4gICAgICAgICAgICAgICAgLnVuaXEoKVxuICAgICAgICAgICAgICAgIC5tYXAoeCA9PiBtYWtlU3VnZ2VzdGlvbih4LCBwLCBvcHRpb25zLnJlcGxhY2VtZW50UHJlZml4KSlcbiAgICAgICAgICAgICAgICAudmFsdWUoKTtcbiAgICAgICAgfSlcbiAgICAgICAgICAgIC5tYXAocyA9PiBmaWx0ZXIocywgc2VhcmNoVG9rZW5zW3NlYXJjaFRva2Vucy5sZW5ndGggLSAxXSwgeyBrZXk6IFwiX3NlYXJjaFwiIH0pKVxuICAgICAgICAgICAgLnRvUHJvbWlzZSgpO1xuICAgIH1cbiAgICBwYXRoTWF0Y2gocGF0aCkge1xuICAgICAgICByZXR1cm4gcGF0aCAmJiAhIXBhdGgubWF0Y2gobmFtZVJlZ2V4KTtcbiAgICB9XG4gICAgZGlzcG9zZSgpIHsgfVxufVxuY2xhc3MgTnVnZXRWZXJzaW9uUHJvdmlkZXIge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmZpbGVNYXRjaHMgPSBbXCJwcm9qZWN0Lmpzb25cIl07XG4gICAgfVxuICAgIGdldFN1Z2dlc3Rpb25zKG9wdGlvbnMpIHtcbiAgICAgICAgY29uc3QgbWF0Y2ggPSBvcHRpb25zLnBhdGgubWF0Y2godmVyc2lvblJlZ2V4KTtcbiAgICAgICAgaWYgKCFtYXRjaClcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoW10pO1xuICAgICAgICBjb25zdCBuYW1lID0gbWF0Y2hbMV07XG4gICAgICAgIGxldCBvO1xuICAgICAgICBpZiAodmVyc2lvbkNhY2hlLmhhcyhuYW1lKSkge1xuICAgICAgICAgICAgbyA9IHZlcnNpb25DYWNoZS5nZXQobmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBvID0gU29sdXRpb25NYW5hZ2VyLmdldFNvbHV0aW9uRm9yRWRpdG9yKG9wdGlvbnMuZWRpdG9yKVxuICAgICAgICAgICAgICAgIC5mbGF0TWFwKHogPT4gei5tb2RlbC5wYWNrYWdlU291cmNlcylcbiAgICAgICAgICAgICAgICAuZmlsdGVyKHogPT4ge1xuICAgICAgICAgICAgICAgIGlmIChjYWNoZS5oYXMoeikpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIF8uc29tZShjYWNoZS5nZXQoeikucmVzdWx0cywgeCA9PiBfLnN0YXJ0c1dpdGgobmFtZSwgeCkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLnRvQXJyYXkoKVxuICAgICAgICAgICAgICAgIC5mbGF0TWFwKHNvdXJjZXMgPT4gT21uaS5yZXF1ZXN0KHNvbHV0aW9uID0+IHNvbHV0aW9uLnBhY2thZ2V2ZXJzaW9uKHtcbiAgICAgICAgICAgICAgICBJZDogbmFtZSxcbiAgICAgICAgICAgICAgICBJbmNsdWRlUHJlcmVsZWFzZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICBQcm9qZWN0UGF0aDogc29sdXRpb24ucGF0aCxcbiAgICAgICAgICAgICAgICBTb3VyY2VzOiBzb3VyY2VzLFxuICAgICAgICAgICAgfSkpXG4gICAgICAgICAgICAgICAgLmZsYXRNYXAoeiA9PiB6LlZlcnNpb25zKVxuICAgICAgICAgICAgICAgIC50b0FycmF5KCkpXG4gICAgICAgICAgICAgICAgLnB1Ymxpc2hSZXBsYXkoMSkucmVmQ291bnQoKTtcbiAgICAgICAgICAgIHZlcnNpb25DYWNoZS5zZXQobmFtZSwgbyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG8udGFrZSgxKVxuICAgICAgICAgICAgLm1hcCh6ID0+IHoubWFwKHggPT4gbWFrZVN1Z2dlc3Rpb24yKHgsIG9wdGlvbnMucmVwbGFjZW1lbnRQcmVmaXgpKSlcbiAgICAgICAgICAgIC5tYXAocyA9PiBmaWx0ZXIocywgb3B0aW9ucy5wcmVmaXgsIHsga2V5OiBcIl9zZWFyY2hcIiB9KSlcbiAgICAgICAgICAgIC50b1Byb21pc2UoKTtcbiAgICB9XG4gICAgcGF0aE1hdGNoKHBhdGgpIHtcbiAgICAgICAgcmV0dXJuIHBhdGggJiYgISFwYXRoLm1hdGNoKHZlcnNpb25SZWdleCk7XG4gICAgfVxuICAgIGRpc3Bvc2UoKSB7IH1cbn1cbmNvbnN0IHByb3ZpZGVycyA9IFtuZXcgTnVnZXROYW1lUHJvdmlkZXIsIG5ldyBOdWdldFZlcnNpb25Qcm92aWRlcl07XG5tb2R1bGUuZXhwb3J0cyA9IHByb3ZpZGVycztcbiIsImltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcclxuaW1wb3J0IHtPYnNlcnZhYmxlfSBmcm9tIFwicnhqc1wiO1xyXG5pbXBvcnQge09tbml9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xyXG5pbXBvcnQge1NvbHV0aW9uTWFuYWdlcn0gZnJvbSBcIi4uL3NlcnZlci9zb2x1dGlvbi1tYW5hZ2VyXCI7XHJcbmltcG9ydCB7YWpheH0gZnJvbSBcImpxdWVyeVwiO1xyXG5jb25zdCBmaWx0ZXIgPSByZXF1aXJlKFwiZnV6emFsZHJpblwiKS5maWx0ZXI7XHJcbmltcG9ydCB7UnVudGltZX0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcclxuXHJcbmNvbnN0IGNhY2hlID0gbmV3IE1hcDxzdHJpbmcsIHsgcHJlZml4Pzogc3RyaW5nOyByZXN1bHRzOiBzdHJpbmdbXSB9PigpO1xyXG5jb25zdCB2ZXJzaW9uQ2FjaGUgPSBuZXcgTWFwPHN0cmluZywgYW55PigpO1xyXG5PbW5pLmxpc3RlbmVyLnBhY2thZ2Vzb3VyY2VcclxuICAgIC5mbGF0TWFwKHogPT4gei5yZXNwb25zZSAmJiB6LnJlc3BvbnNlLlNvdXJjZXMgfHwgW10pXHJcbiAgICAuc3Vic2NyaWJlKChzb3VyY2U6IHN0cmluZykgPT4ge1xyXG4gICAgICAgIGlmICghY2FjaGUuZ2V0KHNvdXJjZSkpXHJcbiAgICAgICAgICAgIGZldGNoRnJvbUdpdGh1Yihzb3VyY2UsIFwiX2tleXNcIiwgXCJcIikuc3Vic2NyaWJlKHJlc3VsdCA9PiB7XHJcbiAgICAgICAgICAgICAgICBjYWNoZS5zZXQoc291cmNlLCByZXN1bHQpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgIH0pO1xyXG5cclxuZnVuY3Rpb24gZmV0Y2hGcm9tR2l0aHViKHNvdXJjZTogc3RyaW5nLCBwcmVmaXg6IHN0cmluZywgc2VhcmNoUHJlZml4OiBzdHJpbmcpOiBPYnNlcnZhYmxlPHsgcHJlZml4Pzogc3RyaW5nOyByZXN1bHRzOiBzdHJpbmdbXSB9PiB7XHJcbiAgICAvLyBXZSBwcmVjYWNoZSB0aGUga2V5cyB0byBtYWtlIHRoaXMgc3BlZWR5XHJcbiAgICBpZiAocHJlZml4ID09PSBcIl9rZXlzXCIgJiYgY2FjaGUuaGFzKHNvdXJjZSkpIHtcclxuICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5vZihjYWNoZS5nZXQoc291cmNlKSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gSWYgd2UgaGF2ZSBhIHZhbHVlIGluIHRoZSBjYWNoZSwgc2VlIGlmIHRoZSBrZXkgZXhpc3RzIG9yIG5vdC5cclxuICAgIGlmIChjYWNoZS5oYXMoc291cmNlKSkge1xyXG4gICAgICAgIGNvbnN0IGMgPSBjYWNoZS5nZXQoc291cmNlKTtcclxuICAgICAgICBpZiAoIWMpIHtcclxuICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUub2YoYyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIV8uc29tZShjLnJlc3VsdHMsIHggPT4geC50b0xvd2VyQ2FzZSgpID09PSBwcmVmaXgudG9Mb3dlckNhc2UoKSArIFwiLlwiKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5vZih7IHJlc3VsdHM6IFtdIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBJZiB3ZSBoYXZlIGEgY2FjaGVkIHZhbHVlIHRoZW4gdGhlIGZhaWxlZCB2YWx1ZSBpcyBlbXB0eSAobm8gbmVlZCB0byBmYWxsIGJhY2sgdG8gdGhlIHNlcnZlcilcclxuICAgIGNvbnN0IGZhaWxlZFZhbHVlID0gY2FjaGUuaGFzKHNvdXJjZSkgJiYgISFjYWNoZS5nZXQoc291cmNlKSA/IDxhbnk+eyBwcmVmaXg6IG51bGwsIHJlc3VsdHM6IFtdIH0gOiB7IHByZWZpeDogbnVsbCwgcmVzdWx0czogbnVsbCB9O1xyXG5cclxuICAgIGNvbnN0IHJlYWxTb3VyY2UgPSBzb3VyY2U7XHJcblxyXG4gICAgLy8gVGhpcyBpcyB0aGUgc2FtZSBjb252ZW50aW9uIHVzZWQgYnkgb21uaXNoYXJwLW51Z2V0IGJ1aWxkIHRvb2xcclxuICAgIHNvdXJjZSA9IF8udHJpbShzb3VyY2UsIFwiL1wiKS5yZXBsYWNlKFwid3d3LlwiLCBcIlwiKS5yZXBsYWNlKFwiaHR0cHM6Ly9cIiwgXCJcIikucmVwbGFjZShcImh0dHA6Ly9cIiwgXCJcIikucmVwbGFjZSgvXFwvfFxcOi9nLCBcIi1cIik7XHJcblxyXG4gICAgLy8gR2V0IHRoZSBmaWxlIGZyb20gZ2l0aHViXHJcbiAgICBsZXQgcmVzdWx0ID0gYWpheChgaHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tL09tbmlTaGFycC9vbW5pc2hhcnAtbnVnZXQvcmVzb3VyY2VzL3Jlc291cmNlcy8ke3NvdXJjZX0vJHtwcmVmaXgudG9Mb3dlckNhc2UoKX0uanNvbmApLnRoZW4ocmVzID0+IEpTT04ucGFyc2UocmVzKSwgKCkgPT4geyAvKiAqLyB9KTtcclxuXHJcbiAgICAvLyBUaGUgbm9uIGtleSBmaWxlcyBoYXZlIGFuIG9iamVjdCBsYXlvdXRcclxuICAgIGlmIChwcmVmaXggIT09IFwiX2tleXNcIikge1xyXG4gICAgICAgIGNvbnN0IHNwID0gc2VhcmNoUHJlZml4LnNwbGl0KFwiLlwiKTtcclxuICAgICAgICBjb25zdCBmaWxlUHJlZml4ID0gc3Auc2xpY2UoMSwgc3AubGVuZ3RoIC0gMSkuam9pbihcIi5cIikudG9Mb3dlckNhc2UoKTtcclxuICAgICAgICByZXN1bHQgPSByZXN1bHQudGhlbigodmFsdWU6IHsgX2tleXM6IHN0cmluZ1tdO1trZXk6IHN0cmluZ106IHN0cmluZ1tdIH0pID0+IHtcclxuICAgICAgICAgICAgY29uc3QgayA9IF8uZmluZChjYWNoZS5nZXQocmVhbFNvdXJjZSkucmVzdWx0cywgeCA9PiB4LnRvTG93ZXJDYXNlKCkgPT09IHByZWZpeC50b0xvd2VyQ2FzZSgpKTtcclxuICAgICAgICAgICAgaWYgKCFmaWxlUHJlZml4KSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4geyBwcmVmaXg6IGssIHJlc3VsdHM6IHZhbHVlLl9rZXlzIH07XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB2ID0gKDxhbnk+XykuZmluZEtleSh2YWx1ZSwgKHg6IGFueSwga2V5OiBzdHJpbmcpID0+IGtleS50b0xvd2VyQ2FzZSgpID09PSBmaWxlUHJlZml4KSxcclxuICAgICAgICAgICAgICAgICAgICBwID0gYCR7a30uJHt2fWA7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgcHJlZml4OiBrICYmIHYgJiYgcCwgcmVzdWx0czogdmFsdWVbdl0gfHwgW10gfTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICByZXN1bHQgPSByZXN1bHQudGhlbigocmVzdWx0cykgPT4gKHsgcHJlZml4OiBcIlwiLCByZXN1bHRzIH0pKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBSZXR1cm4gdGhlIHJlc3VsdFxyXG4gICAgcmV0dXJuIE9ic2VydmFibGUuZnJvbVByb21pc2U8eyBwcmVmaXg6IHN0cmluZzsgcmVzdWx0czogc3RyaW5nW10gfT4oPGFueT5yZXN1bHQpLmNhdGNoKCgpID0+IE9ic2VydmFibGUub2YoZmFpbGVkVmFsdWUpKTtcclxufVxyXG5cclxuaW50ZXJmYWNlIElBdXRvY29tcGxldGVQcm92aWRlck9wdGlvbnMge1xyXG4gICAgZWRpdG9yOiBBdG9tLlRleHRFZGl0b3I7XHJcbiAgICBidWZmZXJQb3NpdGlvbjogVGV4dEJ1ZmZlci5Qb2ludDsgLy8gdGhlIHBvc2l0aW9uIG9mIHRoZSBjdXJzb3JcclxuICAgIHByZWZpeDogc3RyaW5nO1xyXG4gICAgc2NvcGVEZXNjcmlwdG9yOiB7IHNjb3Blczogc3RyaW5nW10gfTtcclxuICAgIGFjdGl2YXRlZE1hbnVhbGx5OiBib29sZWFuO1xyXG4gICAgcGF0aDogc3RyaW5nO1xyXG4gICAgcmVwbGFjZW1lbnRQcmVmaXg6IHN0cmluZztcclxufVxyXG5cclxuaW50ZXJmYWNlIElBdXRvY29tcGxldGVQcm92aWRlciB7XHJcbiAgICBmaWxlTWF0Y2hzOiBzdHJpbmdbXTtcclxuICAgIHBhdGhNYXRjaDogKHBhdGg6IHN0cmluZykgPT4gYm9vbGVhbjtcclxuICAgIGdldFN1Z2dlc3Rpb25zOiAob3B0aW9uczogSUF1dG9jb21wbGV0ZVByb3ZpZGVyT3B0aW9ucykgPT4gUHJvbWlzZTxhbnlbXT47XHJcbiAgICBkaXNwb3NlKCk6IHZvaWQ7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG1ha2VTdWdnZXN0aW9uKGl0ZW06IHN0cmluZywgcGF0aDogc3RyaW5nLCByZXBsYWNlbWVudFByZWZpeDogc3RyaW5nKSB7XHJcbiAgICBjb25zdCB0eXBlID0gXCJwYWNrYWdlXCI7XHJcblxyXG4gICAgY29uc3QgciA9IHJlcGxhY2VtZW50UHJlZml4LnNwbGl0KFwiLlwiKTtcclxuICAgIGxldCBycyA9IHIuc2xpY2UoMCwgci5sZW5ndGggLSAxKS5qb2luKFwiLlwiKTtcclxuICAgIGlmIChycy5sZW5ndGgpIHJzICs9IFwiLlwiO1xyXG4gICAgaWYgKHBhdGgubGVuZ3RoKSBwYXRoICs9IFwiLlwiO1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgX3NlYXJjaDogaXRlbSxcclxuICAgICAgICB0ZXh0OiBgJHtwYXRofSR7aXRlbX1gLFxyXG4gICAgICAgIHNuaXBwZXQ6IGAke3BhdGh9JHtpdGVtfWAsXHJcbiAgICAgICAgdHlwZTogdHlwZSxcclxuICAgICAgICBkaXNwbGF5VGV4dDogaXRlbSxcclxuICAgICAgICByZXBsYWNlbWVudFByZWZpeCwvLzogYCR7cnN9JHtpdGVtfWAsXHJcbiAgICAgICAgY2xhc3NOYW1lOiBcImF1dG9jb21wbGV0ZS1wcm9qZWN0LWpzb25cIixcclxuICAgIH07XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG1ha2VTdWdnZXN0aW9uMihpdGVtOiBzdHJpbmcsIHJlcGxhY2VtZW50UHJlZml4OiBzdHJpbmcpIHtcclxuICAgIGNvbnN0IHR5cGUgPSBcInZlcnNpb25cIjtcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIF9zZWFyY2g6IGl0ZW0sXHJcbiAgICAgICAgdGV4dDogaXRlbSxcclxuICAgICAgICBzbmlwcGV0OiBpdGVtLFxyXG4gICAgICAgIHR5cGU6IHR5cGUsXHJcbiAgICAgICAgZGlzcGxheVRleHQ6IGl0ZW0sXHJcbiAgICAgICAgcmVwbGFjZW1lbnRQcmVmaXgsXHJcbiAgICAgICAgY2xhc3NOYW1lOiBcImF1dG9jb21wbGV0ZS1wcm9qZWN0LWpzb25cIixcclxuICAgIH07XHJcbn1cclxuXHJcbmNvbnN0IG5hbWVSZWdleCA9IC9cXC8/ZGVwZW5kZW5jaWVzJC87XHJcbmNvbnN0IHZlcnNpb25SZWdleCA9IC9cXC8/ZGVwZW5kZW5jaWVzXFwvKFthLXpBLVowLTlcXC5fXSo/KSg/OlxcL3ZlcnNpb24pPyQvO1xyXG5cclxuY2xhc3MgTnVnZXROYW1lUHJvdmlkZXIgaW1wbGVtZW50cyBJQXV0b2NvbXBsZXRlUHJvdmlkZXIge1xyXG4gICAgcHVibGljIGdldFN1Z2dlc3Rpb25zKG9wdGlvbnM6IElBdXRvY29tcGxldGVQcm92aWRlck9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgY29uc3Qgc2VhcmNoVG9rZW5zID0gb3B0aW9ucy5yZXBsYWNlbWVudFByZWZpeC5zcGxpdChcIi5cIik7XHJcbiAgICAgICAgbGV0IHBhY2thZ2VQcmVmaXg6IHN0cmluZztcclxuICAgICAgICBpZiAob3B0aW9ucy5yZXBsYWNlbWVudFByZWZpeC5pbmRleE9mKFwiLlwiKSA+IC0xKSB7XHJcbiAgICAgICAgICAgIHBhY2thZ2VQcmVmaXggPSBvcHRpb25zLnJlcGxhY2VtZW50UHJlZml4LnNwbGl0KFwiLlwiKVswXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBTb2x1dGlvbk1hbmFnZXIuZ2V0U29sdXRpb25Gb3JFZGl0b3Iob3B0aW9ucy5lZGl0b3IpXHJcbiAgICAgICAgICAgIC8vIE9ubHkgc3VwcG9ydGVkIG9uIERlc2t0b3AgQ2xyIGF0IHRoZSBtb21lbnRcclxuICAgICAgICAgICAgLmZpbHRlcih4ID0+IHgucnVudGltZSA9PT0gUnVudGltZS5DbHJPck1vbm8pXHJcbiAgICAgICAgICAgIC8vIEdldCBhbGwgc291cmNlc1xyXG4gICAgICAgICAgICAuZmxhdE1hcCh6ID0+IHoubW9kZWwucGFja2FnZVNvdXJjZXMpXHJcbiAgICAgICAgICAgIC5mbGF0TWFwKHNvdXJjZSA9PiB7XHJcbiAgICAgICAgICAgICAgICAvLyBBdHRlbXB0IHRvIGdldCB0aGUgc291cmNlIGZyb20gZ2l0aHViXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmV0Y2hGcm9tR2l0aHViKHNvdXJjZSwgcGFja2FnZVByZWZpeCB8fCBcIl9rZXlzXCIsIG9wdGlvbnMucmVwbGFjZW1lbnRQcmVmaXgpXHJcbiAgICAgICAgICAgICAgICAgICAgLmZsYXRNYXAoeiA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgheikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gZmFsbCBiYWNrIHRvIHRoZSBzZXJ2ZXIgaWYgc291cmNlIGlzblwidCBmb3VuZFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5pbmZvKGBGYWxsaW5nIGJhY2sgdG8gc2VydmVyIHBhY2thZ2Ugc2VhcmNoIGZvciAke3NvdXJjZX0uYCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gT21uaS5yZXF1ZXN0KHNvbHV0aW9uID0+IHNvbHV0aW9uLnBhY2thZ2VzZWFyY2goe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFNlYXJjaDogb3B0aW9ucy5yZXBsYWNlbWVudFByZWZpeCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBJbmNsdWRlUHJlcmVsZWFzZTogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBQcm9qZWN0UGF0aDogc29sdXRpb24ucGF0aCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBTb3VyY2VzOiBbc291cmNlXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pKS5tYXAoeCA9PiAoeyBwcmVmaXg6IFwiXCIsIHJlc3VsdHM6IHguUGFja2FnZXMubWFwKGl0ZW0gPT4gaXRlbS5JZCkgfSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUub2Yoeik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgLnRvQXJyYXkoKVxyXG4gICAgICAgICAgICAubWFwKHogPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcHJlZml4ID0gXy5maW5kKHosIHggPT4gISF4LnByZWZpeCk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBwID0gcHJlZml4ID8gcHJlZml4LnByZWZpeCA6IFwiXCI7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gXyh6Lm1hcCh4ID0+IHgucmVzdWx0cykpXHJcbiAgICAgICAgICAgICAgICAgICAgLmZsYXR0ZW48c3RyaW5nPigpXHJcbiAgICAgICAgICAgICAgICAgICAgLnNvcnRCeSgpXHJcbiAgICAgICAgICAgICAgICAgICAgLnVuaXEoKVxyXG4gICAgICAgICAgICAgICAgICAgIC5tYXAoeCA9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtYWtlU3VnZ2VzdGlvbih4LCBwLCBvcHRpb25zLnJlcGxhY2VtZW50UHJlZml4KSlcclxuICAgICAgICAgICAgICAgICAgICAudmFsdWUoKTtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgLm1hcChzID0+XHJcbiAgICAgICAgICAgICAgICBmaWx0ZXIocywgc2VhcmNoVG9rZW5zW3NlYXJjaFRva2Vucy5sZW5ndGggLSAxXSwgeyBrZXk6IFwiX3NlYXJjaFwiIH0pKVxyXG4gICAgICAgICAgICAudG9Qcm9taXNlKCk7XHJcbiAgICB9XHJcbiAgICBwdWJsaWMgZmlsZU1hdGNocyA9IFtcInByb2plY3QuanNvblwiXTtcclxuICAgIHB1YmxpYyBwYXRoTWF0Y2gocGF0aDogc3RyaW5nKSB7XHJcbiAgICAgICAgcmV0dXJuIHBhdGggJiYgISFwYXRoLm1hdGNoKG5hbWVSZWdleCk7XHJcbiAgICB9XHJcbiAgICBwdWJsaWMgZGlzcG9zZSgpIHsgLyogKi8gfVxyXG59XHJcblxyXG5jbGFzcyBOdWdldFZlcnNpb25Qcm92aWRlciBpbXBsZW1lbnRzIElBdXRvY29tcGxldGVQcm92aWRlciB7XHJcbiAgICBwdWJsaWMgZ2V0U3VnZ2VzdGlvbnMob3B0aW9uczogSUF1dG9jb21wbGV0ZVByb3ZpZGVyT3B0aW9ucykge1xyXG4gICAgICAgIGNvbnN0IG1hdGNoID0gb3B0aW9ucy5wYXRoLm1hdGNoKHZlcnNpb25SZWdleCk7XHJcbiAgICAgICAgaWYgKCFtYXRjaCkgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbXSk7XHJcbiAgICAgICAgY29uc3QgbmFtZSA9IG1hdGNoWzFdO1xyXG5cclxuICAgICAgICBsZXQgbzogT2JzZXJ2YWJsZTxzdHJpbmdbXT47XHJcblxyXG4gICAgICAgIGlmICh2ZXJzaW9uQ2FjaGUuaGFzKG5hbWUpKSB7XHJcbiAgICAgICAgICAgIG8gPSB2ZXJzaW9uQ2FjaGUuZ2V0KG5hbWUpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIG8gPSBTb2x1dGlvbk1hbmFnZXIuZ2V0U29sdXRpb25Gb3JFZGl0b3Iob3B0aW9ucy5lZGl0b3IpXHJcbiAgICAgICAgICAgICAgICAvLyBHZXQgYWxsIHNvdXJjZXNcclxuICAgICAgICAgICAgICAgIC5mbGF0TWFwKHogPT4gei5tb2RlbC5wYWNrYWdlU291cmNlcylcclxuICAgICAgICAgICAgICAgIC5maWx0ZXIoeiA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNhY2hlLmhhcyh6KSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBTaG9ydCBvdXQgZWFybHkgaWYgdGhlIHNvdXJjZSBkb2VzblwidCBldmVuIGhhdmUgdGhlIGdpdmVuIHByZWZpeFxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gXy5zb21lKGNhY2hlLmdldCh6KS5yZXN1bHRzLCB4ID0+IF8uc3RhcnRzV2l0aChuYW1lLCB4KSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIC50b0FycmF5KClcclxuICAgICAgICAgICAgICAgIC5mbGF0TWFwKHNvdXJjZXMgPT4gT21uaS5yZXF1ZXN0KHNvbHV0aW9uID0+IHNvbHV0aW9uLnBhY2thZ2V2ZXJzaW9uKHtcclxuICAgICAgICAgICAgICAgICAgICBJZDogbmFtZSxcclxuICAgICAgICAgICAgICAgICAgICBJbmNsdWRlUHJlcmVsZWFzZTogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICBQcm9qZWN0UGF0aDogc29sdXRpb24ucGF0aCxcclxuICAgICAgICAgICAgICAgICAgICBTb3VyY2VzOiBzb3VyY2VzLFxyXG4gICAgICAgICAgICAgICAgfSkpXHJcbiAgICAgICAgICAgICAgICAgICAgLmZsYXRNYXAoeiA9PiB6LlZlcnNpb25zKVxyXG4gICAgICAgICAgICAgICAgICAgIC50b0FycmF5KCkpXHJcbiAgICAgICAgICAgICAgICAucHVibGlzaFJlcGxheSgxKS5yZWZDb3VudCgpO1xyXG5cclxuICAgICAgICAgICAgdmVyc2lvbkNhY2hlLnNldChuYW1lLCBvKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBvLnRha2UoMSlcclxuICAgICAgICAgICAgLm1hcCh6ID0+IHoubWFwKHggPT5cclxuICAgICAgICAgICAgICAgIG1ha2VTdWdnZXN0aW9uMih4LCBvcHRpb25zLnJlcGxhY2VtZW50UHJlZml4KSkpXHJcbiAgICAgICAgICAgIC5tYXAocyA9PlxyXG4gICAgICAgICAgICAgICAgZmlsdGVyKHMsIG9wdGlvbnMucHJlZml4LCB7IGtleTogXCJfc2VhcmNoXCIgfSkpXHJcbiAgICAgICAgICAgIC50b1Byb21pc2UoKTtcclxuICAgIH1cclxuICAgIHB1YmxpYyBmaWxlTWF0Y2hzID0gW1wicHJvamVjdC5qc29uXCJdO1xyXG4gICAgcHVibGljIHBhdGhNYXRjaChwYXRoOiBzdHJpbmcpIHtcclxuICAgICAgICByZXR1cm4gcGF0aCAmJiAhIXBhdGgubWF0Y2godmVyc2lvblJlZ2V4KTtcclxuICAgIH1cclxuICAgIHB1YmxpYyBkaXNwb3NlKCkgeyAvKiAqLyB9XHJcbn1cclxuXHJcbmNvbnN0IHByb3ZpZGVycyA9IFtuZXcgTnVnZXROYW1lUHJvdmlkZXIsIG5ldyBOdWdldFZlcnNpb25Qcm92aWRlcl07XHJcbm1vZHVsZS5leHBvcnRzID0gcHJvdmlkZXJzO1xyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
