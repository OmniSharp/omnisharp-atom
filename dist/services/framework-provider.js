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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9zZXJ2aWNlcy9mcmFtZXdvcmstcHJvdmlkZXIuanMiLCJsaWIvc2VydmljZXMvZnJhbWV3b3JrLXByb3ZpZGVyLnRzIl0sIm5hbWVzIjpbImZpbHRlciIsInJlcXVpcmUiLCJmcmFtZXdvcmtDYWNoZSIsIk1hcCIsImZldGNoRnJhbWV3b3JrRnJvbUdpdGh1YiIsImZyYW1ld29yayIsImhhcyIsIm9mIiwiZ2V0IiwicmVzdWx0IiwidG9Mb3dlckNhc2UiLCJ0aGVuIiwiSlNPTiIsInBhcnNlIiwicmVzIiwiZnJvbVByb21pc2UiLCJtYWtlU3VnZ2VzdGlvbiIsIml0ZW0iLCJyZXBsYWNlbWVudFByZWZpeCIsInR5cGUiLCJfc2VhcmNoIiwidGV4dCIsInNuaXBwZXQiLCJkaXNwbGF5VGV4dCIsImNsYXNzTmFtZSIsIm5hbWVSZWdleCIsInZlcnNpb25SZWdleCIsIk51Z2V0TmFtZVByb3ZpZGVyIiwiZmlsZU1hdGNocyIsIm9wdGlvbnMiLCJwYXRoIiwibWF0Y2giLCJtYXAiLCJrZXlzIiwieiIsIngiLCJzIiwicHJlZml4Iiwia2V5IiwidG9Qcm9taXNlIiwiTnVnZXRWZXJzaW9uUHJvdmlkZXIiLCJuYW1lIiwicHJvdmlkZXJzIiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6Ijs7OztBQUFBOzs7O0FBQ0E7O0FBQ0E7Ozs7OztBQ0NBLElBQU1BLFNBQVNDLFFBQVEsWUFBUixFQUFzQkQsTUFBckM7QUFFQSxJQUFNRSxpQkFBaUIsSUFBSUMsR0FBSixFQUF2QjtBQUVBLFNBQUFDLHdCQUFBLENBQWtDQyxTQUFsQyxFQUFtRDtBQUMvQyxRQUFJSCxlQUFlSSxHQUFmLENBQW1CRCxTQUFuQixDQUFKLEVBQW1DO0FBQy9CLGVBQU8saUJBQVdFLEVBQVgsQ0FBeUNMLGVBQWVNLEdBQWYsQ0FBbUJILFNBQW5CLENBQXpDLENBQVA7QUFDSDtBQUdELFFBQU1JLFNBQVMsd0dBQXlGSixVQUFVSyxXQUFWLEVBQXpGLFlBQXlIQyxJQUF6SCxDQUE4SDtBQUFBLGVBQU9DLEtBQUtDLEtBQUwsQ0FBV0MsR0FBWCxDQUFQO0FBQUEsS0FBOUgsQ0FBZjtBQUVBLFdBQU8saUJBQVdDLFdBQVgsQ0FBdUROLE1BQXZELENBQVA7QUFDSDtBQW1CRCxTQUFBTyxjQUFBLENBQXdCQyxJQUF4QixFQUFzQ0MsaUJBQXRDLEVBQStEO0FBQzNELFFBQU1DLE9BQU8sU0FBYjtBQUVBLFdBQU87QUFDSEMsaUJBQVNILElBRE47QUFFSEksY0FBTUosSUFGSDtBQUdISyxpQkFBU0wsSUFITjtBQUlIRSxjQUFNQSxJQUpIO0FBS0hJLHFCQUFhTixJQUxWO0FBTUhDLDRDQU5HO0FBT0hNLG1CQUFXO0FBUFIsS0FBUDtBQVNIO0FBRUQsSUFBTUMsWUFBWSxpREFBbEI7QUFDQSxJQUFNQyxlQUFlLG1GQUFyQjs7SUFFQUMsaUI7QUFBQSxpQ0FBQTtBQUFBOztBQVVXLGFBQUFDLFVBQUEsR0FBYSxDQUFDLGNBQUQsQ0FBYjtBQUtWOzs7O3VDQWR5QkMsTyxFQUFxQztBQUN2RCxnQkFBTXhCLFlBQVl3QixRQUFRQyxJQUFSLENBQWFDLEtBQWIsQ0FBbUJOLFNBQW5CLEVBQThCLENBQTlCLENBQWxCO0FBRUEsbUJBQU9yQix5QkFBeUJDLFNBQXpCLEVBQ0YyQixHQURFLENBQ0UsaUJBQUVDLElBREosRUFFRkQsR0FGRSxDQUVFO0FBQUEsdUJBQUtFLEVBQUVGLEdBQUYsQ0FBTTtBQUFBLDJCQUFLaEIsZUFBZW1CLENBQWYsRUFBa0JOLFFBQVFYLGlCQUExQixDQUFMO0FBQUEsaUJBQU4sQ0FBTDtBQUFBLGFBRkYsRUFHRmMsR0FIRSxDQUdFO0FBQUEsdUJBQUtoQyxPQUFPb0MsQ0FBUCxFQUFVUCxRQUFRUSxNQUFsQixFQUEwQixFQUFFQyxLQUFLLFNBQVAsRUFBMUIsQ0FBTDtBQUFBLGFBSEYsRUFJRkMsU0FKRSxFQUFQO0FBS0g7OztrQ0FFZ0JULEksRUFBWTtBQUN6QixtQkFBT0EsUUFBUSxDQUFDLENBQUNBLEtBQUtDLEtBQUwsQ0FBV04sU0FBWCxDQUFqQjtBQUNIOzs7a0NBQ2EsQ0FBWTs7Ozs7O0lBRzlCZSxvQjtBQUFBLG9DQUFBO0FBQUE7O0FBVVcsYUFBQVosVUFBQSxHQUFhLENBQUMsY0FBRCxDQUFiO0FBS1Y7Ozs7dUNBZHlCQyxPLEVBQXFDO0FBQ3ZELGdCQUFNRSxRQUFRRixRQUFRQyxJQUFSLENBQWFDLEtBQWIsQ0FBbUJMLFlBQW5CLENBQWQ7QUFDQSxnQkFBTXJCLFlBQVkwQixNQUFNLENBQU4sQ0FBbEI7QUFDQSxnQkFBTVUsT0FBT1YsTUFBTSxDQUFOLENBQWI7QUFFQSxtQkFBTzNCLHlCQUF5QkMsU0FBekIsRUFDRjJCLEdBREUsQ0FDRTtBQUFBLHVCQUFLLENBQUNoQixlQUFlbUIsRUFBRU0sSUFBRixDQUFmLEVBQXdCWixRQUFRWCxpQkFBaEMsQ0FBRCxDQUFMO0FBQUEsYUFERixFQUVGcUIsU0FGRSxFQUFQO0FBR0g7OztrQ0FFZ0JULEksRUFBWTtBQUN6QixtQkFBT0EsUUFBUSxDQUFDLENBQUNBLEtBQUtDLEtBQUwsQ0FBV0wsWUFBWCxDQUFqQjtBQUNIOzs7a0NBQ2EsQ0FBWTs7Ozs7O0FBRzlCLElBQU1nQixZQUFZLENBQUMsSUFBSWYsaUJBQUosRUFBRCxFQUF3QixJQUFJYSxvQkFBSixFQUF4QixDQUFsQjtBQUNBRyxPQUFPQyxPQUFQLEdBQWlCRixTQUFqQiIsImZpbGUiOiJsaWIvc2VydmljZXMvZnJhbWV3b3JrLXByb3ZpZGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xuaW1wb3J0IHsgT2JzZXJ2YWJsZSB9IGZyb20gXCJyeGpzXCI7XG5pbXBvcnQgeyBhamF4IH0gZnJvbSBcImpxdWVyeVwiO1xuY29uc3QgZmlsdGVyID0gcmVxdWlyZShcImZ1enphbGRyaW5cIikuZmlsdGVyO1xuY29uc3QgZnJhbWV3b3JrQ2FjaGUgPSBuZXcgTWFwKCk7XG5mdW5jdGlvbiBmZXRjaEZyYW1ld29ya0Zyb21HaXRodWIoZnJhbWV3b3JrKSB7XG4gICAgaWYgKGZyYW1ld29ya0NhY2hlLmhhcyhmcmFtZXdvcmspKSB7XG4gICAgICAgIHJldHVybiBPYnNlcnZhYmxlLm9mKGZyYW1ld29ya0NhY2hlLmdldChmcmFtZXdvcmspKTtcbiAgICB9XG4gICAgY29uc3QgcmVzdWx0ID0gYWpheChgaHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tL09tbmlTaGFycC9vbW5pc2hhcnAtbnVnZXQvcmVzb3VyY2VzL2ZyYW1ld29ya3MvJHtmcmFtZXdvcmsudG9Mb3dlckNhc2UoKX0uanNvbmApLnRoZW4ocmVzID0+IEpTT04ucGFyc2UocmVzKSk7XG4gICAgcmV0dXJuIE9ic2VydmFibGUuZnJvbVByb21pc2UocmVzdWx0KTtcbn1cbmZ1bmN0aW9uIG1ha2VTdWdnZXN0aW9uKGl0ZW0sIHJlcGxhY2VtZW50UHJlZml4KSB7XG4gICAgY29uc3QgdHlwZSA9IFwicGFja2FnZVwiO1xuICAgIHJldHVybiB7XG4gICAgICAgIF9zZWFyY2g6IGl0ZW0sXG4gICAgICAgIHRleHQ6IGl0ZW0sXG4gICAgICAgIHNuaXBwZXQ6IGl0ZW0sXG4gICAgICAgIHR5cGU6IHR5cGUsXG4gICAgICAgIGRpc3BsYXlUZXh0OiBpdGVtLFxuICAgICAgICByZXBsYWNlbWVudFByZWZpeCxcbiAgICAgICAgY2xhc3NOYW1lOiBcImF1dG9jb21wbGV0ZS1wcm9qZWN0LWpzb25cIixcbiAgICB9O1xufVxuY29uc3QgbmFtZVJlZ2V4ID0gL1xcLygoPzpkbnh8bmV0KVswLTldezIsM30pXFwvZnJhbWV3b3JrQXNzZW1ibGllcyQvO1xuY29uc3QgdmVyc2lvblJlZ2V4ID0gL1xcLygoPzpkbnh8bmV0KVswLTldezIsM30pXFwvZnJhbWV3b3JrQXNzZW1ibGllc1xcLyhbYS16QS1aMC05XFwuX10qPykoPzpcXC92ZXJzaW9uKT8kLztcbmNsYXNzIE51Z2V0TmFtZVByb3ZpZGVyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5maWxlTWF0Y2hzID0gW1wicHJvamVjdC5qc29uXCJdO1xuICAgIH1cbiAgICBnZXRTdWdnZXN0aW9ucyhvcHRpb25zKSB7XG4gICAgICAgIGNvbnN0IGZyYW1ld29yayA9IG9wdGlvbnMucGF0aC5tYXRjaChuYW1lUmVnZXgpWzFdO1xuICAgICAgICByZXR1cm4gZmV0Y2hGcmFtZXdvcmtGcm9tR2l0aHViKGZyYW1ld29yaylcbiAgICAgICAgICAgIC5tYXAoXy5rZXlzKVxuICAgICAgICAgICAgLm1hcCh6ID0+IHoubWFwKHggPT4gbWFrZVN1Z2dlc3Rpb24oeCwgb3B0aW9ucy5yZXBsYWNlbWVudFByZWZpeCkpKVxuICAgICAgICAgICAgLm1hcChzID0+IGZpbHRlcihzLCBvcHRpb25zLnByZWZpeCwgeyBrZXk6IFwiX3NlYXJjaFwiIH0pKVxuICAgICAgICAgICAgLnRvUHJvbWlzZSgpO1xuICAgIH1cbiAgICBwYXRoTWF0Y2gocGF0aCkge1xuICAgICAgICByZXR1cm4gcGF0aCAmJiAhIXBhdGgubWF0Y2gobmFtZVJlZ2V4KTtcbiAgICB9XG4gICAgZGlzcG9zZSgpIHsgfVxufVxuY2xhc3MgTnVnZXRWZXJzaW9uUHJvdmlkZXIge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmZpbGVNYXRjaHMgPSBbXCJwcm9qZWN0Lmpzb25cIl07XG4gICAgfVxuICAgIGdldFN1Z2dlc3Rpb25zKG9wdGlvbnMpIHtcbiAgICAgICAgY29uc3QgbWF0Y2ggPSBvcHRpb25zLnBhdGgubWF0Y2godmVyc2lvblJlZ2V4KTtcbiAgICAgICAgY29uc3QgZnJhbWV3b3JrID0gbWF0Y2hbMV07XG4gICAgICAgIGNvbnN0IG5hbWUgPSBtYXRjaFsyXTtcbiAgICAgICAgcmV0dXJuIGZldGNoRnJhbWV3b3JrRnJvbUdpdGh1YihmcmFtZXdvcmspXG4gICAgICAgICAgICAubWFwKHggPT4gW21ha2VTdWdnZXN0aW9uKHhbbmFtZV0sIG9wdGlvbnMucmVwbGFjZW1lbnRQcmVmaXgpXSlcbiAgICAgICAgICAgIC50b1Byb21pc2UoKTtcbiAgICB9XG4gICAgcGF0aE1hdGNoKHBhdGgpIHtcbiAgICAgICAgcmV0dXJuIHBhdGggJiYgISFwYXRoLm1hdGNoKHZlcnNpb25SZWdleCk7XG4gICAgfVxuICAgIGRpc3Bvc2UoKSB7IH1cbn1cbmNvbnN0IHByb3ZpZGVycyA9IFtuZXcgTnVnZXROYW1lUHJvdmlkZXIsIG5ldyBOdWdldFZlcnNpb25Qcm92aWRlcl07XG5tb2R1bGUuZXhwb3J0cyA9IHByb3ZpZGVycztcbiIsImltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcclxuaW1wb3J0IHtPYnNlcnZhYmxlfSBmcm9tIFwicnhqc1wiO1xyXG5pbXBvcnQge2FqYXh9IGZyb20gXCJqcXVlcnlcIjtcclxuY29uc3QgZmlsdGVyID0gcmVxdWlyZShcImZ1enphbGRyaW5cIikuZmlsdGVyO1xyXG5cclxuY29uc3QgZnJhbWV3b3JrQ2FjaGUgPSBuZXcgTWFwPHN0cmluZywgeyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfT4oKTtcclxuXHJcbmZ1bmN0aW9uIGZldGNoRnJhbWV3b3JrRnJvbUdpdGh1YihmcmFtZXdvcms6IHN0cmluZykge1xyXG4gICAgaWYgKGZyYW1ld29ya0NhY2hlLmhhcyhmcmFtZXdvcmspKSB7XHJcbiAgICAgICAgcmV0dXJuIE9ic2VydmFibGUub2Y8eyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfT4oZnJhbWV3b3JrQ2FjaGUuZ2V0KGZyYW1ld29yaykpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEdldCB0aGUgZmlsZSBmcm9tIGdpdGh1YlxyXG4gICAgY29uc3QgcmVzdWx0ID0gYWpheChgaHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tL09tbmlTaGFycC9vbW5pc2hhcnAtbnVnZXQvcmVzb3VyY2VzL2ZyYW1ld29ya3MvJHtmcmFtZXdvcmsudG9Mb3dlckNhc2UoKX0uanNvbmApLnRoZW4ocmVzID0+IEpTT04ucGFyc2UocmVzKSk7XHJcblxyXG4gICAgcmV0dXJuIE9ic2VydmFibGUuZnJvbVByb21pc2U8eyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfT4oPGFueT5yZXN1bHQpO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgSUF1dG9jb21wbGV0ZVByb3ZpZGVyT3B0aW9ucyB7XHJcbiAgICBlZGl0b3I6IEF0b20uVGV4dEVkaXRvcjtcclxuICAgIGJ1ZmZlclBvc2l0aW9uOiBUZXh0QnVmZmVyLlBvaW50OyAvLyB0aGUgcG9zaXRpb24gb2YgdGhlIGN1cnNvclxyXG4gICAgcHJlZml4OiBzdHJpbmc7XHJcbiAgICBzY29wZURlc2NyaXB0b3I6IHsgc2NvcGVzOiBzdHJpbmdbXSB9O1xyXG4gICAgYWN0aXZhdGVkTWFudWFsbHk6IGJvb2xlYW47XHJcbiAgICBwYXRoOiBzdHJpbmc7XHJcbiAgICByZXBsYWNlbWVudFByZWZpeDogc3RyaW5nO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgSUF1dG9jb21wbGV0ZVByb3ZpZGVyIHtcclxuICAgIGZpbGVNYXRjaHM6IHN0cmluZ1tdO1xyXG4gICAgcGF0aE1hdGNoOiAocGF0aDogc3RyaW5nKSA9PiBib29sZWFuO1xyXG4gICAgZ2V0U3VnZ2VzdGlvbnM6IChvcHRpb25zOiBJQXV0b2NvbXBsZXRlUHJvdmlkZXJPcHRpb25zKSA9PiBQcm9taXNlPGFueVtdPjtcclxuICAgIGRpc3Bvc2UoKTogdm9pZDtcclxufVxyXG5cclxuZnVuY3Rpb24gbWFrZVN1Z2dlc3Rpb24oaXRlbTogc3RyaW5nLCByZXBsYWNlbWVudFByZWZpeDogc3RyaW5nKSB7XHJcbiAgICBjb25zdCB0eXBlID0gXCJwYWNrYWdlXCI7XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBfc2VhcmNoOiBpdGVtLFxyXG4gICAgICAgIHRleHQ6IGl0ZW0sXHJcbiAgICAgICAgc25pcHBldDogaXRlbSxcclxuICAgICAgICB0eXBlOiB0eXBlLFxyXG4gICAgICAgIGRpc3BsYXlUZXh0OiBpdGVtLFxyXG4gICAgICAgIHJlcGxhY2VtZW50UHJlZml4LFxyXG4gICAgICAgIGNsYXNzTmFtZTogXCJhdXRvY29tcGxldGUtcHJvamVjdC1qc29uXCIsXHJcbiAgICB9O1xyXG59XHJcblxyXG5jb25zdCBuYW1lUmVnZXggPSAvXFwvKCg/OmRueHxuZXQpWzAtOV17MiwzfSlcXC9mcmFtZXdvcmtBc3NlbWJsaWVzJC87XHJcbmNvbnN0IHZlcnNpb25SZWdleCA9IC9cXC8oKD86ZG54fG5ldClbMC05XXsyLDN9KVxcL2ZyYW1ld29ya0Fzc2VtYmxpZXNcXC8oW2EtekEtWjAtOVxcLl9dKj8pKD86XFwvdmVyc2lvbik/JC87XHJcblxyXG5jbGFzcyBOdWdldE5hbWVQcm92aWRlciBpbXBsZW1lbnRzIElBdXRvY29tcGxldGVQcm92aWRlciB7XHJcbiAgICBwdWJsaWMgZ2V0U3VnZ2VzdGlvbnMob3B0aW9uczogSUF1dG9jb21wbGV0ZVByb3ZpZGVyT3B0aW9ucykge1xyXG4gICAgICAgIGNvbnN0IGZyYW1ld29yayA9IG9wdGlvbnMucGF0aC5tYXRjaChuYW1lUmVnZXgpWzFdO1xyXG5cclxuICAgICAgICByZXR1cm4gZmV0Y2hGcmFtZXdvcmtGcm9tR2l0aHViKGZyYW1ld29yaylcclxuICAgICAgICAgICAgLm1hcChfLmtleXMpXHJcbiAgICAgICAgICAgIC5tYXAoeiA9PiB6Lm1hcCh4ID0+IG1ha2VTdWdnZXN0aW9uKHgsIG9wdGlvbnMucmVwbGFjZW1lbnRQcmVmaXgpKSlcclxuICAgICAgICAgICAgLm1hcChzID0+IGZpbHRlcihzLCBvcHRpb25zLnByZWZpeCwgeyBrZXk6IFwiX3NlYXJjaFwiIH0pKVxyXG4gICAgICAgICAgICAudG9Qcm9taXNlKCk7XHJcbiAgICB9XHJcbiAgICBwdWJsaWMgZmlsZU1hdGNocyA9IFtcInByb2plY3QuanNvblwiXTtcclxuICAgIHB1YmxpYyBwYXRoTWF0Y2gocGF0aDogc3RyaW5nKSB7XHJcbiAgICAgICAgcmV0dXJuIHBhdGggJiYgISFwYXRoLm1hdGNoKG5hbWVSZWdleCk7XHJcbiAgICB9XHJcbiAgICBwdWJsaWMgZGlzcG9zZSgpIHsgLyogKi8gfVxyXG59XHJcblxyXG5jbGFzcyBOdWdldFZlcnNpb25Qcm92aWRlciBpbXBsZW1lbnRzIElBdXRvY29tcGxldGVQcm92aWRlciB7XHJcbiAgICBwdWJsaWMgZ2V0U3VnZ2VzdGlvbnMob3B0aW9uczogSUF1dG9jb21wbGV0ZVByb3ZpZGVyT3B0aW9ucykge1xyXG4gICAgICAgIGNvbnN0IG1hdGNoID0gb3B0aW9ucy5wYXRoLm1hdGNoKHZlcnNpb25SZWdleCk7XHJcbiAgICAgICAgY29uc3QgZnJhbWV3b3JrID0gbWF0Y2hbMV07XHJcbiAgICAgICAgY29uc3QgbmFtZSA9IG1hdGNoWzJdO1xyXG5cclxuICAgICAgICByZXR1cm4gZmV0Y2hGcmFtZXdvcmtGcm9tR2l0aHViKGZyYW1ld29yaylcclxuICAgICAgICAgICAgLm1hcCh4ID0+IFttYWtlU3VnZ2VzdGlvbih4W25hbWVdLCBvcHRpb25zLnJlcGxhY2VtZW50UHJlZml4KV0pXHJcbiAgICAgICAgICAgIC50b1Byb21pc2UoKTtcclxuICAgIH1cclxuICAgIHB1YmxpYyBmaWxlTWF0Y2hzID0gW1wicHJvamVjdC5qc29uXCJdO1xyXG4gICAgcHVibGljIHBhdGhNYXRjaChwYXRoOiBzdHJpbmcpIHtcclxuICAgICAgICByZXR1cm4gcGF0aCAmJiAhIXBhdGgubWF0Y2godmVyc2lvblJlZ2V4KTtcclxuICAgIH1cclxuICAgIHB1YmxpYyBkaXNwb3NlKCkgeyAvKiAqLyB9XHJcbn1cclxuXHJcbmNvbnN0IHByb3ZpZGVycyA9IFtuZXcgTnVnZXROYW1lUHJvdmlkZXIsIG5ldyBOdWdldFZlcnNpb25Qcm92aWRlcl07XHJcbm1vZHVsZS5leHBvcnRzID0gcHJvdmlkZXJzO1xyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
