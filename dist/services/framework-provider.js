"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _rxjs = require("rxjs");

var _jquery = require("jquery");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var filter = require("fuzzaldrin").filter;
var frameworkCache = new Map();
function fetchFrameworkFromGithub(framework) {
    if (frameworkCache.has(framework)) {
        return _rxjs.Observable.of(frameworkCache.get(framework));
    }
    var result = (0, _jquery.ajax)("https://raw.githubusercontent.com/OmniSharp/omnisharp-nuget/resources/frameworks/" + framework.toLowerCase() + ".json").then(function (res) {
        return JSON.parse(res);
    });
    return _rxjs.Observable.fromPromise(result);
}
function makeSuggestion(item, replacementPrefix) {
    var type = "package";
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
var nameRegex = /\/((?:dnx|net)[0-9]{2,3})\/frameworkAssemblies$/;
var versionRegex = /\/((?:dnx|net)[0-9]{2,3})\/frameworkAssemblies\/([a-zA-Z0-9\._]*?)(?:\/version)?$/;

var NugetNameProvider = function () {
    function NugetNameProvider() {
        _classCallCheck(this, NugetNameProvider);

        this.fileMatchs = ["project.json"];
    }

    _createClass(NugetNameProvider, [{
        key: "getSuggestions",
        value: function getSuggestions(options) {
            var framework = options.path.match(nameRegex)[1];
            return fetchFrameworkFromGithub(framework).map(_lodash2.default.keys).map(function (z) {
                return z.map(function (x) {
                    return makeSuggestion(x, options.replacementPrefix);
                });
            }).map(function (s) {
                return filter(s, options.prefix, { key: "_search" });
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
            var framework = match[1];
            var name = match[2];
            return fetchFrameworkFromGithub(framework).map(function (x) {
                return [makeSuggestion(x[name], options.replacementPrefix)];
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9zZXJ2aWNlcy9mcmFtZXdvcmstcHJvdmlkZXIuanMiLCJsaWIvc2VydmljZXMvZnJhbWV3b3JrLXByb3ZpZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7QUFBQTs7OztBQUNBOztBQUNBOzs7Ozs7QUNDQSxJQUFNLFNBQVMsUUFBUSxZQUFSLEVBQXNCLE1BQXRCO0FBRWYsSUFBTSxpQkFBaUIsSUFBSSxHQUFKLEVBQWpCO0FBRU4sU0FBQSx3QkFBQSxDQUFrQyxTQUFsQyxFQUFtRDtBQUMvQyxRQUFJLGVBQWUsR0FBZixDQUFtQixTQUFuQixDQUFKLEVBQW1DO0FBQy9CLGVBQU8saUJBQVcsRUFBWCxDQUF5QyxlQUFlLEdBQWYsQ0FBbUIsU0FBbkIsQ0FBekMsQ0FBUCxDQUQrQjtLQUFuQztBQUtBLFFBQU0sU0FBUyx3R0FBeUYsVUFBVSxXQUFWLFlBQXpGLEVBQXlILElBQXpILENBQThIO2VBQU8sS0FBSyxLQUFMLENBQVcsR0FBWDtLQUFQLENBQXZJLENBTnlDO0FBUS9DLFdBQU8saUJBQVcsV0FBWCxDQUF1RCxNQUF2RCxDQUFQLENBUitDO0NBQW5EO0FBNEJBLFNBQUEsY0FBQSxDQUF3QixJQUF4QixFQUFzQyxpQkFBdEMsRUFBK0Q7QUFDM0QsUUFBTSxPQUFPLFNBQVAsQ0FEcUQ7QUFHM0QsV0FBTztBQUNILGlCQUFTLElBQVQ7QUFDQSxjQUFNLElBQU47QUFDQSxpQkFBUyxJQUFUO0FBQ0EsY0FBTSxJQUFOO0FBQ0EscUJBQWEsSUFBYjtBQUNBLDRDQU5HO0FBT0gsbUJBQVcsMkJBQVg7S0FQSixDQUgyRDtDQUEvRDtBQWNBLElBQU0sWUFBWSxpREFBWjtBQUNOLElBQU0sZUFBZSxtRkFBZjs7SUFFTjtBQUFBLGlDQUFBOzs7QUFVVyxhQUFBLFVBQUEsR0FBYSxDQUFDLGNBQUQsQ0FBYixDQVZYO0tBQUE7Ozs7dUNBQzBCLFNBQXFDO0FBQ3ZELGdCQUFNLFlBQVksUUFBUSxJQUFSLENBQWEsS0FBYixDQUFtQixTQUFuQixFQUE4QixDQUE5QixDQUFaLENBRGlEO0FBR3ZELG1CQUFPLHlCQUF5QixTQUF6QixFQUNGLEdBREUsQ0FDRSxpQkFBRSxJQUFGLENBREYsQ0FFRixHQUZFLENBRUU7dUJBQUssRUFBRSxHQUFGLENBQU07MkJBQUssZUFBZSxDQUFmLEVBQWtCLFFBQVEsaUJBQVI7aUJBQXZCO2FBQVgsQ0FGRixDQUdGLEdBSEUsQ0FHRTt1QkFBSyxPQUFPLENBQVAsRUFBVSxRQUFRLE1BQVIsRUFBZ0IsRUFBRSxLQUFLLFNBQUwsRUFBNUI7YUFBTCxDQUhGLENBSUYsU0FKRSxFQUFQLENBSHVEOzs7O2tDQVUxQyxNQUFZO0FBQ3pCLG1CQUFPLFFBQVEsQ0FBQyxDQUFDLEtBQUssS0FBTCxDQUFXLFNBQVgsQ0FBRCxDQURTOzs7O2tDQUdmOzs7Ozs7SUFHbEI7QUFBQSxvQ0FBQTs7O0FBVVcsYUFBQSxVQUFBLEdBQWEsQ0FBQyxjQUFELENBQWIsQ0FWWDtLQUFBOzs7O3VDQUMwQixTQUFxQztBQUN2RCxnQkFBTSxRQUFRLFFBQVEsSUFBUixDQUFhLEtBQWIsQ0FBbUIsWUFBbkIsQ0FBUixDQURpRDtBQUV2RCxnQkFBTSxZQUFZLE1BQU0sQ0FBTixDQUFaLENBRmlEO0FBR3ZELGdCQUFNLE9BQU8sTUFBTSxDQUFOLENBQVAsQ0FIaUQ7QUFLdkQsbUJBQU8seUJBQXlCLFNBQXpCLEVBQ0YsR0FERSxDQUNFO3VCQUFLLENBQUMsZUFBZSxFQUFFLElBQUYsQ0FBZixFQUF3QixRQUFRLGlCQUFSLENBQXpCO2FBQUwsQ0FERixDQUVGLFNBRkUsRUFBUCxDQUx1RDs7OztrQ0FVMUMsTUFBWTtBQUN6QixtQkFBTyxRQUFRLENBQUMsQ0FBQyxLQUFLLEtBQUwsQ0FBVyxZQUFYLENBQUQsQ0FEUzs7OztrQ0FHZjs7Ozs7O0FBR2xCLElBQU0sWUFBWSxDQUFDLElBQUksaUJBQUosRUFBRCxFQUF3QixJQUFJLG9CQUFKLEVBQXhCLENBQVo7QUFDTixPQUFPLE9BQVAsR0FBaUIsU0FBakIiLCJmaWxlIjoibGliL3NlcnZpY2VzL2ZyYW1ld29yay1wcm92aWRlci5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcbmltcG9ydCB7IE9ic2VydmFibGUgfSBmcm9tIFwicnhqc1wiO1xuaW1wb3J0IHsgYWpheCB9IGZyb20gXCJqcXVlcnlcIjtcbmNvbnN0IGZpbHRlciA9IHJlcXVpcmUoXCJmdXp6YWxkcmluXCIpLmZpbHRlcjtcbmNvbnN0IGZyYW1ld29ya0NhY2hlID0gbmV3IE1hcCgpO1xuZnVuY3Rpb24gZmV0Y2hGcmFtZXdvcmtGcm9tR2l0aHViKGZyYW1ld29yaykge1xuICAgIGlmIChmcmFtZXdvcmtDYWNoZS5oYXMoZnJhbWV3b3JrKSkge1xuICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5vZihmcmFtZXdvcmtDYWNoZS5nZXQoZnJhbWV3b3JrKSk7XG4gICAgfVxuICAgIGNvbnN0IHJlc3VsdCA9IGFqYXgoYGh0dHBzOi8vcmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbS9PbW5pU2hhcnAvb21uaXNoYXJwLW51Z2V0L3Jlc291cmNlcy9mcmFtZXdvcmtzLyR7ZnJhbWV3b3JrLnRvTG93ZXJDYXNlKCl9Lmpzb25gKS50aGVuKHJlcyA9PiBKU09OLnBhcnNlKHJlcykpO1xuICAgIHJldHVybiBPYnNlcnZhYmxlLmZyb21Qcm9taXNlKHJlc3VsdCk7XG59XG5mdW5jdGlvbiBtYWtlU3VnZ2VzdGlvbihpdGVtLCByZXBsYWNlbWVudFByZWZpeCkge1xuICAgIGNvbnN0IHR5cGUgPSBcInBhY2thZ2VcIjtcbiAgICByZXR1cm4ge1xuICAgICAgICBfc2VhcmNoOiBpdGVtLFxuICAgICAgICB0ZXh0OiBpdGVtLFxuICAgICAgICBzbmlwcGV0OiBpdGVtLFxuICAgICAgICB0eXBlOiB0eXBlLFxuICAgICAgICBkaXNwbGF5VGV4dDogaXRlbSxcbiAgICAgICAgcmVwbGFjZW1lbnRQcmVmaXgsXG4gICAgICAgIGNsYXNzTmFtZTogXCJhdXRvY29tcGxldGUtcHJvamVjdC1qc29uXCIsXG4gICAgfTtcbn1cbmNvbnN0IG5hbWVSZWdleCA9IC9cXC8oKD86ZG54fG5ldClbMC05XXsyLDN9KVxcL2ZyYW1ld29ya0Fzc2VtYmxpZXMkLztcbmNvbnN0IHZlcnNpb25SZWdleCA9IC9cXC8oKD86ZG54fG5ldClbMC05XXsyLDN9KVxcL2ZyYW1ld29ya0Fzc2VtYmxpZXNcXC8oW2EtekEtWjAtOVxcLl9dKj8pKD86XFwvdmVyc2lvbik/JC87XG5jbGFzcyBOdWdldE5hbWVQcm92aWRlciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuZmlsZU1hdGNocyA9IFtcInByb2plY3QuanNvblwiXTtcbiAgICB9XG4gICAgZ2V0U3VnZ2VzdGlvbnMob3B0aW9ucykge1xuICAgICAgICBjb25zdCBmcmFtZXdvcmsgPSBvcHRpb25zLnBhdGgubWF0Y2gobmFtZVJlZ2V4KVsxXTtcbiAgICAgICAgcmV0dXJuIGZldGNoRnJhbWV3b3JrRnJvbUdpdGh1YihmcmFtZXdvcmspXG4gICAgICAgICAgICAubWFwKF8ua2V5cylcbiAgICAgICAgICAgIC5tYXAoeiA9PiB6Lm1hcCh4ID0+IG1ha2VTdWdnZXN0aW9uKHgsIG9wdGlvbnMucmVwbGFjZW1lbnRQcmVmaXgpKSlcbiAgICAgICAgICAgIC5tYXAocyA9PiBmaWx0ZXIocywgb3B0aW9ucy5wcmVmaXgsIHsga2V5OiBcIl9zZWFyY2hcIiB9KSlcbiAgICAgICAgICAgIC50b1Byb21pc2UoKTtcbiAgICB9XG4gICAgcGF0aE1hdGNoKHBhdGgpIHtcbiAgICAgICAgcmV0dXJuIHBhdGggJiYgISFwYXRoLm1hdGNoKG5hbWVSZWdleCk7XG4gICAgfVxuICAgIGRpc3Bvc2UoKSB7IH1cbn1cbmNsYXNzIE51Z2V0VmVyc2lvblByb3ZpZGVyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5maWxlTWF0Y2hzID0gW1wicHJvamVjdC5qc29uXCJdO1xuICAgIH1cbiAgICBnZXRTdWdnZXN0aW9ucyhvcHRpb25zKSB7XG4gICAgICAgIGNvbnN0IG1hdGNoID0gb3B0aW9ucy5wYXRoLm1hdGNoKHZlcnNpb25SZWdleCk7XG4gICAgICAgIGNvbnN0IGZyYW1ld29yayA9IG1hdGNoWzFdO1xuICAgICAgICBjb25zdCBuYW1lID0gbWF0Y2hbMl07XG4gICAgICAgIHJldHVybiBmZXRjaEZyYW1ld29ya0Zyb21HaXRodWIoZnJhbWV3b3JrKVxuICAgICAgICAgICAgLm1hcCh4ID0+IFttYWtlU3VnZ2VzdGlvbih4W25hbWVdLCBvcHRpb25zLnJlcGxhY2VtZW50UHJlZml4KV0pXG4gICAgICAgICAgICAudG9Qcm9taXNlKCk7XG4gICAgfVxuICAgIHBhdGhNYXRjaChwYXRoKSB7XG4gICAgICAgIHJldHVybiBwYXRoICYmICEhcGF0aC5tYXRjaCh2ZXJzaW9uUmVnZXgpO1xuICAgIH1cbiAgICBkaXNwb3NlKCkgeyB9XG59XG5jb25zdCBwcm92aWRlcnMgPSBbbmV3IE51Z2V0TmFtZVByb3ZpZGVyLCBuZXcgTnVnZXRWZXJzaW9uUHJvdmlkZXJdO1xubW9kdWxlLmV4cG9ydHMgPSBwcm92aWRlcnM7XG4iLCJpbXBvcnQgXyBmcm9tIFwibG9kYXNoXCI7XHJcbmltcG9ydCB7T2JzZXJ2YWJsZX0gZnJvbSBcInJ4anNcIjtcclxuaW1wb3J0IHthamF4fSBmcm9tIFwianF1ZXJ5XCI7XHJcbmNvbnN0IGZpbHRlciA9IHJlcXVpcmUoXCJmdXp6YWxkcmluXCIpLmZpbHRlcjtcclxuXHJcbmNvbnN0IGZyYW1ld29ya0NhY2hlID0gbmV3IE1hcDxzdHJpbmcsIHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH0+KCk7XHJcblxyXG5mdW5jdGlvbiBmZXRjaEZyYW1ld29ya0Zyb21HaXRodWIoZnJhbWV3b3JrOiBzdHJpbmcpIHtcclxuICAgIGlmIChmcmFtZXdvcmtDYWNoZS5oYXMoZnJhbWV3b3JrKSkge1xyXG4gICAgICAgIHJldHVybiBPYnNlcnZhYmxlLm9mPHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH0+KGZyYW1ld29ya0NhY2hlLmdldChmcmFtZXdvcmspKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBHZXQgdGhlIGZpbGUgZnJvbSBnaXRodWJcclxuICAgIGNvbnN0IHJlc3VsdCA9IGFqYXgoYGh0dHBzOi8vcmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbS9PbW5pU2hhcnAvb21uaXNoYXJwLW51Z2V0L3Jlc291cmNlcy9mcmFtZXdvcmtzLyR7ZnJhbWV3b3JrLnRvTG93ZXJDYXNlKCl9Lmpzb25gKS50aGVuKHJlcyA9PiBKU09OLnBhcnNlKHJlcykpO1xyXG5cclxuICAgIHJldHVybiBPYnNlcnZhYmxlLmZyb21Qcm9taXNlPHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH0+KDxhbnk+cmVzdWx0KTtcclxufVxyXG5cclxuaW50ZXJmYWNlIElBdXRvY29tcGxldGVQcm92aWRlck9wdGlvbnMge1xyXG4gICAgZWRpdG9yOiBBdG9tLlRleHRFZGl0b3I7XHJcbiAgICBidWZmZXJQb3NpdGlvbjogVGV4dEJ1ZmZlci5Qb2ludDsgLy8gdGhlIHBvc2l0aW9uIG9mIHRoZSBjdXJzb3JcclxuICAgIHByZWZpeDogc3RyaW5nO1xyXG4gICAgc2NvcGVEZXNjcmlwdG9yOiB7IHNjb3Blczogc3RyaW5nW10gfTtcclxuICAgIGFjdGl2YXRlZE1hbnVhbGx5OiBib29sZWFuO1xyXG4gICAgcGF0aDogc3RyaW5nO1xyXG4gICAgcmVwbGFjZW1lbnRQcmVmaXg6IHN0cmluZztcclxufVxyXG5cclxuaW50ZXJmYWNlIElBdXRvY29tcGxldGVQcm92aWRlciB7XHJcbiAgICBmaWxlTWF0Y2hzOiBzdHJpbmdbXTtcclxuICAgIHBhdGhNYXRjaDogKHBhdGg6IHN0cmluZykgPT4gYm9vbGVhbjtcclxuICAgIGdldFN1Z2dlc3Rpb25zOiAob3B0aW9uczogSUF1dG9jb21wbGV0ZVByb3ZpZGVyT3B0aW9ucykgPT4gUHJvbWlzZTxhbnlbXT47XHJcbiAgICBkaXNwb3NlKCk6IHZvaWQ7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG1ha2VTdWdnZXN0aW9uKGl0ZW06IHN0cmluZywgcmVwbGFjZW1lbnRQcmVmaXg6IHN0cmluZykge1xyXG4gICAgY29uc3QgdHlwZSA9IFwicGFja2FnZVwiO1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgX3NlYXJjaDogaXRlbSxcclxuICAgICAgICB0ZXh0OiBpdGVtLFxyXG4gICAgICAgIHNuaXBwZXQ6IGl0ZW0sXHJcbiAgICAgICAgdHlwZTogdHlwZSxcclxuICAgICAgICBkaXNwbGF5VGV4dDogaXRlbSxcclxuICAgICAgICByZXBsYWNlbWVudFByZWZpeCxcclxuICAgICAgICBjbGFzc05hbWU6IFwiYXV0b2NvbXBsZXRlLXByb2plY3QtanNvblwiLFxyXG4gICAgfTtcclxufVxyXG5cclxuY29uc3QgbmFtZVJlZ2V4ID0gL1xcLygoPzpkbnh8bmV0KVswLTldezIsM30pXFwvZnJhbWV3b3JrQXNzZW1ibGllcyQvO1xyXG5jb25zdCB2ZXJzaW9uUmVnZXggPSAvXFwvKCg/OmRueHxuZXQpWzAtOV17MiwzfSlcXC9mcmFtZXdvcmtBc3NlbWJsaWVzXFwvKFthLXpBLVowLTlcXC5fXSo/KSg/OlxcL3ZlcnNpb24pPyQvO1xyXG5cclxuY2xhc3MgTnVnZXROYW1lUHJvdmlkZXIgaW1wbGVtZW50cyBJQXV0b2NvbXBsZXRlUHJvdmlkZXIge1xyXG4gICAgcHVibGljIGdldFN1Z2dlc3Rpb25zKG9wdGlvbnM6IElBdXRvY29tcGxldGVQcm92aWRlck9wdGlvbnMpIHtcclxuICAgICAgICBjb25zdCBmcmFtZXdvcmsgPSBvcHRpb25zLnBhdGgubWF0Y2gobmFtZVJlZ2V4KVsxXTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGZldGNoRnJhbWV3b3JrRnJvbUdpdGh1YihmcmFtZXdvcmspXHJcbiAgICAgICAgICAgIC5tYXAoXy5rZXlzKVxyXG4gICAgICAgICAgICAubWFwKHogPT4gei5tYXAoeCA9PiBtYWtlU3VnZ2VzdGlvbih4LCBvcHRpb25zLnJlcGxhY2VtZW50UHJlZml4KSkpXHJcbiAgICAgICAgICAgIC5tYXAocyA9PiBmaWx0ZXIocywgb3B0aW9ucy5wcmVmaXgsIHsga2V5OiBcIl9zZWFyY2hcIiB9KSlcclxuICAgICAgICAgICAgLnRvUHJvbWlzZSgpO1xyXG4gICAgfVxyXG4gICAgcHVibGljIGZpbGVNYXRjaHMgPSBbXCJwcm9qZWN0Lmpzb25cIl07XHJcbiAgICBwdWJsaWMgcGF0aE1hdGNoKHBhdGg6IHN0cmluZykge1xyXG4gICAgICAgIHJldHVybiBwYXRoICYmICEhcGF0aC5tYXRjaChuYW1lUmVnZXgpO1xyXG4gICAgfVxyXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7IC8qICovIH1cclxufVxyXG5cclxuY2xhc3MgTnVnZXRWZXJzaW9uUHJvdmlkZXIgaW1wbGVtZW50cyBJQXV0b2NvbXBsZXRlUHJvdmlkZXIge1xyXG4gICAgcHVibGljIGdldFN1Z2dlc3Rpb25zKG9wdGlvbnM6IElBdXRvY29tcGxldGVQcm92aWRlck9wdGlvbnMpIHtcclxuICAgICAgICBjb25zdCBtYXRjaCA9IG9wdGlvbnMucGF0aC5tYXRjaCh2ZXJzaW9uUmVnZXgpO1xyXG4gICAgICAgIGNvbnN0IGZyYW1ld29yayA9IG1hdGNoWzFdO1xyXG4gICAgICAgIGNvbnN0IG5hbWUgPSBtYXRjaFsyXTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGZldGNoRnJhbWV3b3JrRnJvbUdpdGh1YihmcmFtZXdvcmspXHJcbiAgICAgICAgICAgIC5tYXAoeCA9PiBbbWFrZVN1Z2dlc3Rpb24oeFtuYW1lXSwgb3B0aW9ucy5yZXBsYWNlbWVudFByZWZpeCldKVxyXG4gICAgICAgICAgICAudG9Qcm9taXNlKCk7XHJcbiAgICB9XHJcbiAgICBwdWJsaWMgZmlsZU1hdGNocyA9IFtcInByb2plY3QuanNvblwiXTtcclxuICAgIHB1YmxpYyBwYXRoTWF0Y2gocGF0aDogc3RyaW5nKSB7XHJcbiAgICAgICAgcmV0dXJuIHBhdGggJiYgISFwYXRoLm1hdGNoKHZlcnNpb25SZWdleCk7XHJcbiAgICB9XHJcbiAgICBwdWJsaWMgZGlzcG9zZSgpIHsgLyogKi8gfVxyXG59XHJcblxyXG5jb25zdCBwcm92aWRlcnMgPSBbbmV3IE51Z2V0TmFtZVByb3ZpZGVyLCBuZXcgTnVnZXRWZXJzaW9uUHJvdmlkZXJdO1xyXG5tb2R1bGUuZXhwb3J0cyA9IHByb3ZpZGVycztcclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
