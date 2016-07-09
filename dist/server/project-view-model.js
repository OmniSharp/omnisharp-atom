"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.EmptyProjectViewModel = exports.ProjectViewModel = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.projectViewModelFactory = projectViewModelFactory;
exports.workspaceViewModelFactory = workspaceViewModelFactory;

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _rxjs = require("rxjs");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var projectFactories = {
    MsBuildProject: MsBuildProjectViewModel,
    DotNetProject: DotNetProjectViewModel
};
var supportedProjectTypes = _lodash2.default.keys(projectFactories);
function projectViewModelFactory(omnisharpProject, solutionPath) {
    var projectTypes = _lodash2.default.filter(supportedProjectTypes, function (type) {
        return _lodash2.default.has(omnisharpProject, type);
    });
    var missing = _lodash2.default.difference(_lodash2.default.keys(omnisharpProject), supportedProjectTypes);
    if (missing.length) {
        console.log("Missing factory for project type " + missing);
    }
    var results = [];
    var skipDnx = false;
    if (projectTypes["DotNetProject"] && projectTypes["DnxProject"]) skipDnx = true;
    _lodash2.default.each(projectTypes, function (projectType) {
        if (skipDnx && _lodash2.default.startsWith(projectType, "Dnx")) return;
        if (projectType && projectFactories[projectType]) {
            results.push(new projectFactories[projectType](omnisharpProject[projectType], solutionPath));
        }
    });
    return results;
}
var workspaceFactories = {
    MsBuild: function MsBuild(workspace, solutionPath) {
        return _lodash2.default.map(workspace.Projects, function (projectInformation) {
            return new MsBuildProjectViewModel(projectInformation, solutionPath);
        });
    },
    DotNet: function DotNet(workspace, solutionPath) {
        return _lodash2.default.map(workspace.Projects, function (projectInformation) {
            return new DotNetProjectViewModel(projectInformation, solutionPath);
        });
    },
    ScriptCs: function ScriptCs(workspace, solutionPath) {
        return [];
    }
};
function workspaceViewModelFactory(omnisharpWorkspace, solutionPath) {
    var projects = [];
    var skipDnx = false;
    if (omnisharpWorkspace["DotNet"] && omnisharpWorkspace["Dnx"]) skipDnx = true;
    _lodash2.default.forIn(omnisharpWorkspace, function (item, key) {
        var factory = workspaceFactories[key];
        if (skipDnx && _lodash2.default.startsWith(key, "Dnx")) return;
        if (factory) {
            projects.push.apply(projects, _toConsumableArray(factory(item, solutionPath)));
        }
    });
    return projects;
}

var ProjectViewModel = exports.ProjectViewModel = function () {
    function ProjectViewModel(project, solutionPath) {
        _classCallCheck(this, ProjectViewModel);

        this._sourceFiles = [];
        this._subjectActiveFramework = new _rxjs.ReplaySubject(1);
        this._frameworks = [{ FriendlyName: "All", Name: "all", ShortName: "all" }];
        this._configurations = [];
        this.solutionPath = solutionPath;
        this.init(project);
        this.observe = { activeFramework: this._subjectActiveFramework };
        this._subjectActiveFramework.next(this._frameworks[0]);
    }

    _createClass(ProjectViewModel, [{
        key: "update",
        value: function update(other) {
            this.name = other.name;
            this.path = other.path;
            this.solutionPath = other.solutionPath;
            this.sourceFiles = other.sourceFiles;
            this.frameworks = other.frameworks;
            this.activeFramework = this._activeFramework;
            this.configurations = other.configurations;
        }
    }, {
        key: "toJSON",
        value: function toJSON() {
            var name = this.name;
            var path = this.path;
            var solutionPath = this.solutionPath;
            var sourceFiles = this.sourceFiles;
            var frameworks = this.frameworks;
            var configurations = this.configurations;

            return { name: name, path: path, solutionPath: solutionPath, sourceFiles: sourceFiles, frameworks: frameworks, configurations: configurations };
        }
    }, {
        key: "dispose",
        value: function dispose() {
            this._subjectActiveFramework.unsubscribe();
        }
    }, {
        key: "name",
        get: function get() {
            return this._name;
        },
        set: function set(value) {
            this._name = value;
        }
    }, {
        key: "path",
        get: function get() {
            return this._path;
        },
        set: function set(value) {
            this._path = value;
        }
    }, {
        key: "solutionPath",
        get: function get() {
            return this._solutionPath;
        },
        set: function set(value) {
            this._solutionPath = value;
        }
    }, {
        key: "sourceFiles",
        get: function get() {
            return this._sourceFiles;
        },
        set: function set(value) {
            this._sourceFiles = value || [];
            if (this._filesSet) this._filesSet = null;
        }
    }, {
        key: "filesSet",
        get: function get() {
            var _this = this;

            if (!this._filesSet) {
                this._filesSet = new Set();
                _lodash2.default.each(this._sourceFiles, function (file) {
                    return _this._filesSet.add(file);
                });
            }
            return this._filesSet;
        }
    }, {
        key: "activeFramework",
        get: function get() {
            if (!this._activeFramework) {
                this._activeFramework = this.frameworks[0];
            }
            return this._activeFramework;
        },
        set: function set(value) {
            this._activeFramework = value;
            if (!this._subjectActiveFramework.isUnsubscribed) {
                this._subjectActiveFramework.next(this._activeFramework);
            }
        }
    }, {
        key: "frameworks",
        get: function get() {
            return this._frameworks;
        },
        set: function set(value) {
            this._frameworks = [{ FriendlyName: "All", Name: "all", ShortName: "all" }].concat(value);
            if (!this.activeFramework) {
                this.activeFramework = this._frameworks[0];
            }
        }
    }, {
        key: "configurations",
        get: function get() {
            return this._configurations;
        },
        set: function set(value) {
            this._configurations = value || [];
        }
    }]);

    return ProjectViewModel;
}();

var EmptyProjectViewModel = exports.EmptyProjectViewModel = function (_ProjectViewModel) {
    _inherits(EmptyProjectViewModel, _ProjectViewModel);

    function EmptyProjectViewModel() {
        _classCallCheck(this, EmptyProjectViewModel);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(EmptyProjectViewModel).apply(this, arguments));
    }

    _createClass(EmptyProjectViewModel, [{
        key: "init",
        value: function init(project) {}
    }]);

    return EmptyProjectViewModel;
}(ProjectViewModel);

var ProxyProjectViewModel = function (_ProjectViewModel2) {
    _inherits(ProxyProjectViewModel, _ProjectViewModel2);

    function ProxyProjectViewModel() {
        _classCallCheck(this, ProxyProjectViewModel);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(ProxyProjectViewModel).apply(this, arguments));
    }

    _createClass(ProxyProjectViewModel, [{
        key: "init",
        value: function init(project) {
            this.update(project);
        }
    }]);

    return ProxyProjectViewModel;
}(ProjectViewModel);

var MsBuildProjectViewModel = function (_ProjectViewModel3) {
    _inherits(MsBuildProjectViewModel, _ProjectViewModel3);

    function MsBuildProjectViewModel() {
        _classCallCheck(this, MsBuildProjectViewModel);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(MsBuildProjectViewModel).apply(this, arguments));
    }

    _createClass(MsBuildProjectViewModel, [{
        key: "init",
        value: function init(project) {
            var frameworks = [{
                FriendlyName: project.TargetFramework,
                Name: project.TargetFramework,
                ShortName: project.TargetFramework
            }];
            this.name = project.AssemblyName;
            this.path = project.Path;
            this.frameworks = frameworks;
            this.sourceFiles = project.SourceFiles;
        }
    }]);

    return MsBuildProjectViewModel;
}(ProjectViewModel);

var DotNetProjectViewModel = function (_ProjectViewModel4) {
    _inherits(DotNetProjectViewModel, _ProjectViewModel4);

    function DotNetProjectViewModel() {
        _classCallCheck(this, DotNetProjectViewModel);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(DotNetProjectViewModel).apply(this, arguments));
    }

    _createClass(DotNetProjectViewModel, [{
        key: "init",
        value: function init(project) {
            this.name = project.Name;
            this.path = project.Path;
            this.frameworks = project.Frameworks || [];
            this.configurations = (project.Configurations || []).map(function (x) {
                return x.Name;
            });
            this.sourceFiles = project.SourceFiles || [];
        }
    }]);

    return DotNetProjectViewModel;
}(ProjectViewModel);

var ScriptCsProjectViewModel = function (_ProjectViewModel5) {
    _inherits(ScriptCsProjectViewModel, _ProjectViewModel5);

    function ScriptCsProjectViewModel() {
        _classCallCheck(this, ScriptCsProjectViewModel);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(ScriptCsProjectViewModel).apply(this, arguments));
    }

    _createClass(ScriptCsProjectViewModel, [{
        key: "init",
        value: function init(project) {
            this.name = "ScriptCs";
            this.path = project.RootPath;
            this.sourceFiles = project.CsxFilesBeingProcessed;
        }
    }]);

    return ScriptCsProjectViewModel;
}(ProjectViewModel);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9zZXJ2ZXIvcHJvamVjdC12aWV3LW1vZGVsLnRzIiwibGliL3NlcnZlci9wcm9qZWN0LXZpZXctbW9kZWwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O1FBV0EsdUIsR0FBQSx1QjtRQWtDQSx5QixHQUFBLHlCOztBQzdDQTs7OztBQUNBOzs7Ozs7Ozs7Ozs7QURJQSxJQUFNLG1CQUEyRjtBQUM3RixvQkFBcUIsdUJBRHdFO0FBRTdGLG1CQUFvQjtBQUZ5RSxDQUFqRztBQUtBLElBQU0sd0JBQXdCLGlCQUFFLElBQUYsQ0FBTyxnQkFBUCxDQUE5QjtBQUNBLFNBQUEsdUJBQUEsQ0FBd0MsZ0JBQXhDLEVBQTZGLFlBQTdGLEVBQWlIO0FBQzdHLFFBQU0sZUFBZSxpQkFBRSxNQUFGLENBQVMscUJBQVQsRUFBZ0M7QUFBQSxlQUFRLGlCQUFFLEdBQUYsQ0FBTSxnQkFBTixFQUF3QixJQUF4QixDQUFSO0FBQUEsS0FBaEMsQ0FBckI7QUFDQSxRQUFNLFVBQVUsaUJBQUUsVUFBRixDQUFhLGlCQUFFLElBQUYsQ0FBTyxnQkFBUCxDQUFiLEVBQXVDLHFCQUF2QyxDQUFoQjtBQUNBLFFBQUksUUFBUSxNQUFaLEVBQW9CO0FBQ2hCLGdCQUFRLEdBQVIsdUNBQWdELE9BQWhEO0FBQ0g7QUFFRCxRQUFNLFVBQW1DLEVBQXpDO0FBQ0EsUUFBSSxVQUFVLEtBQWQ7QUFDQSxRQUFJLGFBQWEsZUFBYixLQUFpQyxhQUFhLFlBQWIsQ0FBckMsRUFBaUUsVUFBVSxJQUFWO0FBQ2pFLHFCQUFFLElBQUYsQ0FBTyxZQUFQLEVBQXFCLHVCQUFXO0FBQzVCLFlBQUksV0FBVyxpQkFBRSxVQUFGLENBQWEsV0FBYixFQUEwQixLQUExQixDQUFmLEVBQWlEO0FBQ2pELFlBQUksZUFBZSxpQkFBaUIsV0FBakIsQ0FBbkIsRUFBa0Q7QUFDOUMsb0JBQVEsSUFBUixDQUFhLElBQUksaUJBQWlCLFdBQWpCLENBQUosQ0FBa0MsaUJBQWlCLFdBQWpCLENBQWxDLEVB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Ozs2QkFDZ0IsTyxFQUF3QztBQUNoRCxpQkFBSyxJQUFMLEdBQVksUUFBUSxJQUFwQjtBQUNBLGlCQUFLLElBQUwsR0FBWSxRQUFRLElBQXBCO0FBQ0EsaUJBQUssVUFBTCxHQUFrQixRQUFRLFVBQVIsSUFBc0IsRUFBeEM7QUFDQSxpQkFBSyxjQUFMLEdBQXNCLENBQUMsUUFBUSxjQUFSLElBQTBCLEVBQTNCLEVBQStCLEdBQS9CLENBQW1DO0FBQUEsdUJBQUssRUFBRSxJQUFQO0FBQUEsYUFBbkMsQ0FBdEI7QUFDQSxpQkFBSyxXQUFMLEdBQW1CLFFBQVEsV0FBUixJQUF1QixFQUExQztBQUNIOzs7O0VBUGdDLGdCOztJQVVyQyx3Qjs7Ozs7Ozs7Ozs7NkJBQ2dCLE8sRUFBc0M7QUFDOUMsaUJBQUssSUFBTCxHQUFZLFVBQVo7QUFDQSxpQkFBSyxJQUFMLEdBQVksUUFBUSxRQUFwQjtBQUNBLGlCQUFLLFdBQUwsR0FBbUIsUUFBUSxzQkFBM0I7QUFDSDs7OztFQUxrQyxnQiIsImZpbGUiOiJsaWIvc2VydmVyL3Byb2plY3Qtdmlldy1tb2RlbC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7SVByb2plY3RWaWV3TW9kZWx9IGZyb20gXCIuLi9vbW5pc2hhcnBcIjtcclxuaW1wb3J0IHtNb2RlbHMsIFNjcmlwdENzfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xyXG5pbXBvcnQgXyBmcm9tIFwibG9kYXNoXCI7XHJcbmltcG9ydCB7T2JzZXJ2YWJsZSwgUmVwbGF5U3ViamVjdH0gZnJvbSBcInJ4anNcIjtcclxuXHJcbmNvbnN0IHByb2plY3RGYWN0b3JpZXM6IHsgW2tleTogc3RyaW5nXTogeyBuZXcgKHByb2plY3Q6IGFueSwgc29sdXRpb25QYXRoOiBzdHJpbmcpOiBhbnk7IH07IH0gPSB7XHJcbiAgICBNc0J1aWxkUHJvamVjdDogPGFueT5Nc0J1aWxkUHJvamVjdFZpZXdNb2RlbCxcclxuICAgIERvdE5ldFByb2plY3Q6IDxhbnk+RG90TmV0UHJvamVjdFZpZXdNb2RlbFxyXG59O1xyXG5cclxuY29uc3Qgc3VwcG9ydGVkUHJvamVjdFR5cGVzID0gXy5rZXlzKHByb2plY3RGYWN0b3JpZXMpO1xyXG5leHBvcnQgZnVuY3Rpb24gcHJvamVjdFZpZXdNb2RlbEZhY3Rvcnkob21uaXNoYXJwUHJvamVjdDogTW9kZWxzLlByb2plY3RJbmZvcm1hdGlvblJlc3BvbnNlLCBzb2x1dGlvblBhdGg6IHN0cmluZykge1xyXG4gICAgY29uc3QgcHJvamVjdFR5cGVzID0gXy5maWx0ZXIoc3VwcG9ydGVkUHJvamVjdFR5cGVzLCB0eXBlID0+IF8uaGFzKG9tbmlzaGFycFByb2plY3QsIHR5cGUpKTtcclxuICAgIGNvbnN0IG1pc3NpbmcgPSBfLmRpZmZlcmVuY2UoXy5rZXlzKG9tbmlzaGFycFByb2plY3QpLCBzdXBwb3J0ZWRQcm9qZWN0VHlwZXMpO1xyXG4gICAgaWYgKG1pc3NpbmcubGVuZ3RoKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coYE1pc3NpbmcgZmFjdG9yeSBmb3IgcHJvamVjdCB0eXBlICR7bWlzc2luZ31gKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCByZXN1bHRzOiBQcm9qZWN0Vmlld01vZGVsPGFueT5bXSA9IFtdO1xyXG4gICAgbGV0IHNraXBEbnggPSBmYWxzZTtcclxuICAgIGlmIChwcm9qZWN0VHlwZXNbXCJEb3ROZXRQcm9qZWN0XCJdICYmIHByb2plY3RUeXBlc1tcIkRueFByb2plY3RcIl0pIHNraXBEbnggPSB0cnVlO1xyXG4gICAgXy5lYWNoKHByb2plY3RUeXBlcywgcHJvamVjdFR5cGUgPT4ge1xyXG4gICAgICAgIGlmIChza2lwRG54ICYmIF8uc3RhcnRzV2l0aChwcm9qZWN0VHlwZSwgXCJEbnhcIikpIHJldHVybjtcclxuICAgICAgICBpZiAocHJvamVjdFR5cGUgJiYgcHJvamVjdEZhY3Rvcmllc1twcm9qZWN0VHlwZV0pIHtcclxuICAgICAgICAgICAgcmVzdWx0cy5wdXNoKG5ldyBwcm9qZWN0RmFjdG9yaWVzW3Byb2plY3RUeXBlXShvbW5pc2hhcnBQcm9qZWN0W3Byb2plY3RUeXBlXSwgc29sdXRpb25QYXRoKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gcmVzdWx0cztcclxufVxyXG5cclxuY29uc3Qgd29ya3NwYWNlRmFjdG9yaWVzOiB7IFtrZXk6IHN0cmluZ106ICh3b3Jrc3BhY2U6IGFueSwgc29sdXRpb25QYXRoOiBzdHJpbmcpID0+IFByb2plY3RWaWV3TW9kZWw8YW55PltdIH0gPSB7XHJcbiAgICBNc0J1aWxkOiAod29ya3NwYWNlOiBNb2RlbHMuTXNCdWlsZFdvcmtzcGFjZUluZm9ybWF0aW9uLCBzb2x1dGlvblBhdGg6IHN0cmluZykgPT4ge1xyXG4gICAgICAgIHJldHVybiBfLm1hcCh3b3Jrc3BhY2UuUHJvamVjdHMsIHByb2plY3RJbmZvcm1hdGlvbiA9PiBuZXcgTXNCdWlsZFByb2plY3RWaWV3TW9kZWwocHJvamVjdEluZm9ybWF0aW9uLCBzb2x1dGlvblBhdGgpKTtcclxuICAgIH0sXHJcbiAgICBEb3ROZXQ6ICh3b3Jrc3BhY2U6IE1vZGVscy5Eb3ROZXRXb3Jrc3BhY2VJbmZvcm1hdGlvbiwgc29sdXRpb25QYXRoOiBzdHJpbmcpID0+IHtcclxuICAgICAgICByZXR1cm4gXy5tYXAod29ya3NwYWNlLlByb2plY3RzLCBwcm9qZWN0SW5mb3JtYXRpb24gPT4gbmV3IERvdE5ldFByb2plY3RWaWV3TW9kZWwocHJvamVjdEluZm9ybWF0aW9uLCBzb2x1dGlvblBhdGgpKTtcclxuICAgIH0sXHJcbiAgICBTY3JpcHRDczogKHdvcmtzcGFjZTogU2NyaXB0Q3MuU2NyaXB0Q3NDb250ZXh0TW9kZWwsIHNvbHV0aW9uUGF0aDogc3RyaW5nKSA9PiB7XHJcbiAgICAgICAgLyppZiAod29ya3NwYWNlLkNzeEZpbGVzLmxlbmd0aCA+IDApXHJcbiAgICAgICAgICAgIHJldHVybiBbbmV3IFNjcmlwdENzUHJvamVjdFZpZXdNb2RlbCh3b3Jrc3BhY2UsIHNvbHV0aW9uUGF0aCldO1xyXG4gICAgICAgICovXHJcbiAgICAgICAgcmV0dXJuIFtdO1xyXG4gICAgfSxcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB3b3Jrc3BhY2VWaWV3TW9kZWxGYWN0b3J5KG9tbmlzaGFycFdvcmtzcGFjZTogTW9kZWxzLldvcmtzcGFjZUluZm9ybWF0aW9uUmVzcG9uc2UsIHNvbHV0aW9uUGF0aDogc3RyaW5nKSB7XHJcbiAgICBjb25zdCBwcm9qZWN0czogYW55W10gPSBbXTtcclxuICAgIGxldCBza2lwRG54ID0gZmFsc2U7XHJcbiAgICBpZiAob21uaXNoYXJwV29ya3NwYWNlW1wiRG90TmV0XCJdICYmIG9tbmlzaGFycFdvcmtzcGFjZVtcIkRueFwiXSkgc2tpcERueCA9IHRydWU7XHJcbiAgICBfLmZvckluKG9tbmlzaGFycFdvcmtzcGFjZSwgKGl0ZW0sIGtleSkgPT4ge1xyXG4gICAgICAgIGNvbnN0IGZhY3RvcnkgPSB3b3Jrc3BhY2VGYWN0b3JpZXNba2V5XTtcclxuICAgICAgICBpZiAoc2tpcERueCAmJiBfLnN0YXJ0c1dpdGgoa2V5LCBcIkRueFwiKSkgcmV0dXJuO1xyXG4gICAgICAgIGlmIChmYWN0b3J5KSB7XHJcbiAgICAgICAgICAgIHByb2plY3RzLnB1c2goLi4uZmFjdG9yeShpdGVtLCBzb2x1dGlvblBhdGgpKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gcHJvamVjdHM7XHJcbn1cclxuXHJcbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBQcm9qZWN0Vmlld01vZGVsPFQ+IGltcGxlbWVudHMgSVByb2plY3RWaWV3TW9kZWwge1xyXG4gICAgY29uc3RydWN0b3IocHJvamVjdDogVCwgc29sdXRpb25QYXRoOiBzdHJpbmcpIHtcclxuICAgICAgICB0aGlzLnNvbHV0aW9uUGF0aCA9IHNvbHV0aW9uUGF0aDtcclxuICAgICAgICB0aGlzLmluaXQocHJvamVjdCk7XHJcbiAgICAgICAgdGhpcy5vYnNlcnZlID0geyBhY3RpdmVGcmFtZXdvcms6IDxPYnNlcnZhYmxlPE1vZGVscy5Eb3ROZXRGcmFtZXdvcms+Pjxhbnk+dGhpcy5fc3ViamVjdEFjdGl2ZUZyYW1ld29yayB9O1xyXG4gICAgICAgIHRoaXMuX3N1YmplY3RBY3RpdmVGcmFtZXdvcmsubmV4dCh0aGlzLl9mcmFtZXdvcmtzWzBdKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9uYW1lOiBzdHJpbmc7XHJcbiAgICBwdWJsaWMgZ2V0IG5hbWUoKSB7IHJldHVybiB0aGlzLl9uYW1lOyB9XHJcbiAgICBwdWJsaWMgc2V0IG5hbWUodmFsdWUpIHsgdGhpcy5fbmFtZSA9IHZhbHVlOyB9XHJcblxyXG4gICAgcHJpdmF0ZSBfcGF0aDogc3RyaW5nO1xyXG4gICAgcHVibGljIGdldCBwYXRoKCkgeyByZXR1cm4gdGhpcy5fcGF0aDsgfVxyXG4gICAgcHVibGljIHNldCBwYXRoKHZhbHVlKSB7IHRoaXMuX3BhdGggPSB2YWx1ZTsgfVxyXG5cclxuICAgIHByaXZhdGUgX3NvbHV0aW9uUGF0aDogc3RyaW5nO1xyXG4gICAgcHVibGljIGdldCBzb2x1dGlvblBhdGgoKSB7IHJldHVybiB0aGlzLl9zb2x1dGlvblBhdGg7IH1cclxuICAgIHB1YmxpYyBzZXQgc29sdXRpb25QYXRoKHZhbHVlKSB7IHRoaXMuX3NvbHV0aW9uUGF0aCA9IHZhbHVlOyB9XHJcblxyXG4gICAgcHJpdmF0ZSBfc291cmNlRmlsZXM6IHN0cmluZ1tdID0gW107XHJcbiAgICBwdWJsaWMgZ2V0IHNvdXJjZUZpbGVzKCkgeyByZXR1cm4gdGhpcy5fc291cmNlRmlsZXM7IH1cclxuICAgIHB1YmxpYyBzZXQgc291cmNlRmlsZXModmFsdWUpIHtcclxuICAgICAgICB0aGlzLl9zb3VyY2VGaWxlcyA9IHZhbHVlIHx8IFtdO1xyXG4gICAgICAgIGlmICh0aGlzLl9maWxlc1NldCkgdGhpcy5fZmlsZXNTZXQgPSBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX2ZpbGVzU2V0OiBTZXQ8c3RyaW5nPjtcclxuICAgIHB1YmxpYyBnZXQgZmlsZXNTZXQoKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLl9maWxlc1NldCkge1xyXG4gICAgICAgICAgICB0aGlzLl9maWxlc1NldCA9IG5ldyBTZXQ8c3RyaW5nPigpO1xyXG4gICAgICAgICAgICBfLmVhY2godGhpcy5fc291cmNlRmlsZXMsIGZpbGUgPT4gdGhpcy5fZmlsZXNTZXQuYWRkKGZpbGUpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2ZpbGVzU2V0O1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX3N1YmplY3RBY3RpdmVGcmFtZXdvcmsgPSBuZXcgUmVwbGF5U3ViamVjdDxNb2RlbHMuRG90TmV0RnJhbWV3b3JrPigxKTtcclxuICAgIHByaXZhdGUgX2FjdGl2ZUZyYW1ld29yazogTW9kZWxzLkRvdE5ldEZyYW1ld29yaztcclxuICAgIHB1YmxpYyBnZXQgYWN0aXZlRnJhbWV3b3JrKCkge1xyXG4gICAgICAgIGlmICghdGhpcy5fYWN0aXZlRnJhbWV3b3JrKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2FjdGl2ZUZyYW1ld29yayA9IHRoaXMuZnJhbWV3b3Jrc1swXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2FjdGl2ZUZyYW1ld29yaztcclxuICAgIH1cclxuICAgIHB1YmxpYyBzZXQgYWN0aXZlRnJhbWV3b3JrKHZhbHVlKSB7XHJcbiAgICAgICAgdGhpcy5fYWN0aXZlRnJhbWV3b3JrID0gdmFsdWU7XHJcbiAgICAgICAgaWYgKCF0aGlzLl9zdWJqZWN0QWN0aXZlRnJhbWV3b3JrLmlzVW5zdWJzY3JpYmVkKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3N1YmplY3RBY3RpdmVGcmFtZXdvcmsubmV4dCh0aGlzLl9hY3RpdmVGcmFtZXdvcmspO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9mcmFtZXdvcmtzOiBNb2RlbHMuRG90TmV0RnJhbWV3b3JrW10gPSBbeyBGcmllbmRseU5hbWU6IFwiQWxsXCIsIE5hbWU6IFwiYWxsXCIsIFNob3J0TmFtZTogXCJhbGxcIiB9XTtcclxuICAgIHB1YmxpYyBnZXQgZnJhbWV3b3JrcygpIHsgcmV0dXJuIHRoaXMuX2ZyYW1ld29ya3M7IH1cclxuICAgIHB1YmxpYyBzZXQgZnJhbWV3b3Jrcyh2YWx1ZSkge1xyXG4gICAgICAgIHRoaXMuX2ZyYW1ld29ya3MgPSBbeyBGcmllbmRseU5hbWU6IFwiQWxsXCIsIE5hbWU6IFwiYWxsXCIsIFNob3J0TmFtZTogXCJhbGxcIiB9XS5jb25jYXQodmFsdWUpO1xyXG4gICAgICAgIGlmICghdGhpcy5hY3RpdmVGcmFtZXdvcmspIHtcclxuICAgICAgICAgICAgdGhpcy5hY3RpdmVGcmFtZXdvcmsgPSB0aGlzLl9mcmFtZXdvcmtzWzBdO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9jb25maWd1cmF0aW9uczogc3RyaW5nW10gPSBbXTtcclxuICAgIHB1YmxpYyBnZXQgY29uZmlndXJhdGlvbnMoKSB7IHJldHVybiB0aGlzLl9jb25maWd1cmF0aW9uczsgfVxyXG4gICAgcHVibGljIHNldCBjb25maWd1cmF0aW9ucyh2YWx1ZSkgeyB0aGlzLl9jb25maWd1cmF0aW9ucyA9IHZhbHVlIHx8IFtdOyB9XHJcblxyXG4gICAgcHVibGljIG9ic2VydmU6IHtcclxuICAgICAgICBhY3RpdmVGcmFtZXdvcms6IE9ic2VydmFibGU8TW9kZWxzLkRvdE5ldEZyYW1ld29yaz47XHJcbiAgICB9O1xyXG5cclxuICAgIHB1YmxpYyBhYnN0cmFjdCBpbml0KHZhbHVlOiBUKTogdm9pZDtcclxuICAgIHB1YmxpYyB1cGRhdGUob3RoZXI6IFByb2plY3RWaWV3TW9kZWw8VD4pIHtcclxuICAgICAgICB0aGlzLm5hbWUgPSBvdGhlci5uYW1lO1xyXG4gICAgICAgIHRoaXMucGF0aCA9IG90aGVyLnBhdGg7XHJcbiAgICAgICAgdGhpcy5zb2x1dGlvblBhdGggPSBvdGhlci5zb2x1dGlvblBhdGg7XHJcbiAgICAgICAgdGhpcy5zb3VyY2VGaWxlcyA9IG90aGVyLnNvdXJjZUZpbGVzO1xyXG4gICAgICAgIHRoaXMuZnJhbWV3b3JrcyA9IG90aGVyLmZyYW1ld29ya3M7XHJcbiAgICAgICAgdGhpcy5hY3RpdmVGcmFtZXdvcmsgPSB0aGlzLl9hY3RpdmVGcmFtZXdvcms7XHJcbiAgICAgICAgdGhpcy5jb25maWd1cmF0aW9ucyA9IG90aGVyLmNvbmZpZ3VyYXRpb25zO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB0b0pTT04oKSB7XHJcbiAgICAgICAgY29uc3Qge25hbWUsIHBhdGgsIHNvbHV0aW9uUGF0aCwgc291cmNlRmlsZXMsIGZyYW1ld29ya3MsIGNvbmZpZ3VyYXRpb25zfSA9IHRoaXM7XHJcbiAgICAgICAgcmV0dXJuIHsgbmFtZSwgcGF0aCwgc29sdXRpb25QYXRoLCBzb3VyY2VGaWxlcywgZnJhbWV3b3JrcywgY29uZmlndXJhdGlvbnMgfTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGlzcG9zZSgpIHtcclxuICAgICAgICB0aGlzLl9zdWJqZWN0QWN0aXZlRnJhbWV3b3JrLnVuc3Vic2NyaWJlKCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBFbXB0eVByb2plY3RWaWV3TW9kZWwgZXh0ZW5kcyBQcm9qZWN0Vmlld01vZGVsPFByb2plY3RWaWV3TW9kZWw8YW55Pj4ge1xyXG4gICAgcHVibGljIGluaXQocHJvamVjdDogUHJvamVjdFZpZXdNb2RlbDxhbnk+KSB7IC8qICovIH1cclxufVxyXG5cclxuY2xhc3MgUHJveHlQcm9qZWN0Vmlld01vZGVsIGV4dGVuZHMgUHJvamVjdFZpZXdNb2RlbDxQcm9qZWN0Vmlld01vZGVsPGFueT4+IHtcclxuICAgIHB1YmxpYyBpbml0KHByb2plY3Q6IFByb2plY3RWaWV3TW9kZWw8YW55Pikge1xyXG4gICAgICAgIHRoaXMudXBkYXRlKHByb2plY3QpO1xyXG4gICAgfVxyXG59XHJcblxyXG5jbGFzcyBNc0J1aWxkUHJvamVjdFZpZXdNb2RlbCBleHRlbmRzIFByb2plY3RWaWV3TW9kZWw8TW9kZWxzLk1TQnVpbGRQcm9qZWN0PiB7XHJcbiAgICBwdWJsaWMgaW5pdChwcm9qZWN0OiBNb2RlbHMuTVNCdWlsZFByb2plY3QpIHtcclxuICAgICAgICBjb25zdCBmcmFtZXdvcmtzID0gW3tcclxuICAgICAgICAgICAgRnJpZW5kbHlOYW1lOiBwcm9qZWN0LlRhcmdldEZyYW1ld29yayxcclxuICAgICAgICAgICAgTmFtZTogcHJvamVjdC5UYXJnZXRGcmFtZXdvcmssXHJcbiAgICAgICAgICAgIFNob3J0TmFtZTogcHJvamVjdC5UYXJnZXRGcmFtZXdvcmtcclxuICAgICAgICB9XTtcclxuXHJcbiAgICAgICAgdGhpcy5uYW1lID0gcHJvamVjdC5Bc3NlbWJseU5hbWU7XHJcbiAgICAgICAgdGhpcy5wYXRoID0gcHJvamVjdC5QYXRoO1xyXG4gICAgICAgIHRoaXMuZnJhbWV3b3JrcyA9IGZyYW1ld29ya3M7XHJcbiAgICAgICAgdGhpcy5zb3VyY2VGaWxlcyA9IHByb2plY3QuU291cmNlRmlsZXM7XHJcbiAgICB9XHJcbn1cclxuXHJcbmNsYXNzIERvdE5ldFByb2plY3RWaWV3TW9kZWwgZXh0ZW5kcyBQcm9qZWN0Vmlld01vZGVsPE1vZGVscy5Eb3ROZXRQcm9qZWN0SW5mb3JtYXRpb24+IHtcclxuICAgIHB1YmxpYyBpbml0KHByb2plY3Q6IE1vZGVscy5Eb3ROZXRQcm9qZWN0SW5mb3JtYXRpb24pIHtcclxuICAgICAgICB0aGlzLm5hbWUgPSBwcm9qZWN0Lk5hbWU7XHJcbiAgICAgICAgdGhpcy5wYXRoID0gcHJvamVjdC5QYXRoO1xyXG4gICAgICAgIHRoaXMuZnJhbWV3b3JrcyA9IHByb2plY3QuRnJhbWV3b3JrcyB8fCBbXTtcclxuICAgICAgICB0aGlzLmNvbmZpZ3VyYXRpb25zID0gKHByb2plY3QuQ29uZmlndXJhdGlvbnMgfHwgW10pLm1hcCh4ID0+IHguTmFtZSk7XHJcbiAgICAgICAgdGhpcy5zb3VyY2VGaWxlcyA9IHByb2plY3QuU291cmNlRmlsZXMgfHwgW107XHJcbiAgICB9XHJcbn1cclxuXHJcbmNsYXNzIFNjcmlwdENzUHJvamVjdFZpZXdNb2RlbCBleHRlbmRzIFByb2plY3RWaWV3TW9kZWw8U2NyaXB0Q3MuU2NyaXB0Q3NDb250ZXh0TW9kZWw+IHtcclxuICAgIHB1YmxpYyBpbml0KHByb2plY3Q6IFNjcmlwdENzLlNjcmlwdENzQ29udGV4dE1vZGVsKSB7XHJcbiAgICAgICAgdGhpcy5uYW1lID0gXCJTY3JpcHRDc1wiO1xyXG4gICAgICAgIHRoaXMucGF0aCA9IHByb2plY3QuUm9vdFBhdGg7XHJcbiAgICAgICAgdGhpcy5zb3VyY2VGaWxlcyA9IHByb2plY3QuQ3N4RmlsZXNCZWluZ1Byb2Nlc3NlZDtcclxuICAgIH1cclxufVxyXG4iLCJpbXBvcnQgXyBmcm9tIFwibG9kYXNoXCI7XG5pbXBvcnQgeyBSZXBsYXlTdWJqZWN0IH0gZnJvbSBcInJ4anNcIjtcbmNvbnN0IHByb2plY3RGYWN0b3JpZXMgPSB7XG4gICAgTXNCdWlsZFByb2plY3Q6IE1zQnVpbGRQcm9qZWN0Vmlld01vZGVsLFxuICAgIERvdE5ldFByb2plY3Q6IERvdE5ldFByb2plY3RWaWV3TW9kZWxcbn07XG5jb25zdCBzdXBwb3J0ZWRQcm9qZWN0VHlwZXMgPSBfLmtleXMocHJvamVjdEZhY3Rvcmllcyk7XG5leHBvcnQgZnVuY3Rpb24gcHJvamVjdFZpZXdNb2RlbEZhY3Rvcnkob21uaXNoYXJwUHJvamVjdCwgc29sdXRpb25QYXRoKSB7XG4gICAgY29uc3QgcHJvamVjdFR5cGVzID0gXy5maWx0ZXIoc3VwcG9ydGVkUHJvamVjdFR5cGVzLCB0eXBlID0+IF8uaGFzKG9tbmlzaGFycFByb2plY3QsIHR5cGUpKTtcbiAgICBjb25zdCBtaXNzaW5nID0gXy5kaWZmZXJlbmNlKF8ua2V5cyhvbW5pc2hhcnBQcm9qZWN0KSwgc3VwcG9ydGVkUHJvamVjdFR5cGVzKTtcbiAgICBpZiAobWlzc2luZy5sZW5ndGgpIHtcbiAgICAgICAgY29uc29sZS5sb2coYE1pc3NpbmcgZmFjdG9yeSBmb3IgcHJvamVjdCB0eXBlICR7bWlzc2luZ31gKTtcbiAgICB9XG4gICAgY29uc3QgcmVzdWx0cyA9IFtdO1xuICAgIGxldCBza2lwRG54ID0gZmFsc2U7XG4gICAgaWYgKHByb2plY3RUeXBlc1tcIkRvdE5ldFByb2plY3RcIl0gJiYgcHJvamVjdFR5cGVzW1wiRG54UHJvamVjdFwiXSlcbiAgICAgICAgc2tpcERueCA9IHRydWU7XG4gICAgXy5lYWNoKHByb2plY3RUeXBlcywgcHJvamVjdFR5cGUgPT4ge1xuICAgICAgICBpZiAoc2tpcERueCAmJiBfLnN0YXJ0c1dpdGgocHJvamVjdFR5cGUsIFwiRG54XCIpKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBpZiAocHJvamVjdFR5cGUgJiYgcHJvamVjdEZhY3Rvcmllc1twcm9qZWN0VHlwZV0pIHtcbiAgICAgICAgICAgIHJlc3VsdHMucHVzaChuZXcgcHJvamVjdEZhY3Rvcmllc1twcm9qZWN0VHlwZV0ob21uaXNoYXJwUHJvamVjdFtwcm9qZWN0VHlwZV0sIHNvbHV0aW9uUGF0aCkpO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdHM7XG59XG5jb25zdCB3b3Jrc3BhY2VGYWN0b3JpZXMgPSB7XG4gICAgTXNCdWlsZDogKHdvcmtzcGFjZSwgc29sdXRpb25QYXRoKSA9PiB7XG4gICAgICAgIHJldHVybiBfLm1hcCh3b3Jrc3BhY2UuUHJvamVjdHMsIHByb2plY3RJbmZvcm1hdGlvbiA9PiBuZXcgTXNCdWlsZFByb2plY3RWaWV3TW9kZWwocHJvamVjdEluZm9ybWF0aW9uLCBzb2x1dGlvblBhdGgpKTtcbiAgICB9LFxuICAgIERvdE5ldDogKHdvcmtzcGFjZSwgc29sdXRpb25QYXRoKSA9PiB7XG4gICAgICAgIHJldHVybiBfLm1hcCh3b3Jrc3BhY2UuUHJvamVjdHMsIHByb2plY3RJbmZvcm1hdGlvbiA9PiBuZXcgRG90TmV0UHJvamVjdFZpZXdNb2RlbChwcm9qZWN0SW5mb3JtYXRpb24sIHNvbHV0aW9uUGF0aCkpO1xuICAgIH0sXG4gICAgU2NyaXB0Q3M6ICh3b3Jrc3BhY2UsIHNvbHV0aW9uUGF0aCkgPT4ge1xuICAgICAgICByZXR1cm4gW107XG4gICAgfSxcbn07XG5leHBvcnQgZnVuY3Rpb24gd29ya3NwYWNlVmlld01vZGVsRmFjdG9yeShvbW5pc2hhcnBXb3Jrc3BhY2UsIHNvbHV0aW9uUGF0aCkge1xuICAgIGNvbnN0IHByb2plY3RzID0gW107XG4gICAgbGV0IHNraXBEbnggPSBmYWxzZTtcbiAgICBpZiAob21uaXNoYXJwV29ya3NwYWNlW1wiRG90TmV0XCJdICYmIG9tbmlzaGFycFdvcmtzcGFjZVtcIkRueFwiXSlcbiAgICAgICAgc2tpcERueCA9IHRydWU7XG4gICAgXy5mb3JJbihvbW5pc2hhcnBXb3Jrc3BhY2UsIChpdGVtLCBrZXkpID0+IHtcbiAgICAgICAgY29uc3QgZmFjdG9yeSA9IHdvcmtzcGFjZUZhY3Rvcmllc1trZXldO1xuICAgICAgICBpZiAoc2tpcERueCAmJiBfLnN0YXJ0c1dpdGgoa2V5LCBcIkRueFwiKSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgaWYgKGZhY3RvcnkpIHtcbiAgICAgICAgICAgIHByb2plY3RzLnB1c2goLi4uZmFjdG9yeShpdGVtLCBzb2x1dGlvblBhdGgpKTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBwcm9qZWN0cztcbn1cbmV4cG9ydCBjbGFzcyBQcm9qZWN0Vmlld01vZGVsIHtcbiAgICBjb25zdHJ1Y3Rvcihwcm9qZWN0LCBzb2x1dGlvblBhdGgpIHtcbiAgICAgICAgdGhpcy5fc291cmNlRmlsZXMgPSBbXTtcbiAgICAgICAgdGhpcy5fc3ViamVjdEFjdGl2ZUZyYW1ld29yayA9IG5ldyBSZXBsYXlTdWJqZWN0KDEpO1xuICAgICAgICB0aGlzLl9mcmFtZXdvcmtzID0gW3sgRnJpZW5kbHlOYW1lOiBcIkFsbFwiLCBOYW1lOiBcImFsbFwiLCBTaG9ydE5hbWU6IFwiYWxsXCIgfV07XG4gICAgICAgIHRoaXMuX2NvbmZpZ3VyYXRpb25zID0gW107XG4gICAgICAgIHRoaXMuc29sdXRpb25QYXRoID0gc29sdXRpb25QYXRoO1xuICAgICAgICB0aGlzLmluaXQocHJvamVjdCk7XG4gICAgICAgIHRoaXMub2JzZXJ2ZSA9IHsgYWN0aXZlRnJhbWV3b3JrOiB0aGlzLl9zdWJqZWN0QWN0aXZlRnJhbWV3b3JrIH07XG4gICAgICAgIHRoaXMuX3N1YmplY3RBY3RpdmVGcmFtZXdvcmsubmV4dCh0aGlzLl9mcmFtZXdvcmtzWzBdKTtcbiAgICB9XG4gICAgZ2V0IG5hbWUoKSB7IHJldHVybiB0aGlzLl9uYW1lOyB9XG4gICAgc2V0IG5hbWUodmFsdWUpIHsgdGhpcy5fbmFtZSA9IHZhbHVlOyB9XG4gICAgZ2V0IHBhdGgoKSB7IHJldHVybiB0aGlzLl9wYXRoOyB9XG4gICAgc2V0IHBhdGgodmFsdWUpIHsgdGhpcy5fcGF0aCA9IHZhbHVlOyB9XG4gICAgZ2V0IHNvbHV0aW9uUGF0aCgpIHsgcmV0dXJuIHRoaXMuX3NvbHV0aW9uUGF0aDsgfVxuICAgIHNldCBzb2x1dGlvblBhdGgodmFsdWUpIHsgdGhpcy5fc29sdXRpb25QYXRoID0gdmFsdWU7IH1cbiAgICBnZXQgc291cmNlRmlsZXMoKSB7IHJldHVybiB0aGlzLl9zb3VyY2VGaWxlczsgfVxuICAgIHNldCBzb3VyY2VGaWxlcyh2YWx1ZSkge1xuICAgICAgICB0aGlzLl9zb3VyY2VGaWxlcyA9IHZhbHVlIHx8IFtdO1xuICAgICAgICBpZiAodGhpcy5fZmlsZXNTZXQpXG4gICAgICAgICAgICB0aGlzLl9maWxlc1NldCA9IG51bGw7XG4gICAgfVxuICAgIGdldCBmaWxlc1NldCgpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9maWxlc1NldCkge1xuICAgICAgICAgICAgdGhpcy5fZmlsZXNTZXQgPSBuZXcgU2V0KCk7XG4gICAgICAgICAgICBfLmVhY2godGhpcy5fc291cmNlRmlsZXMsIGZpbGUgPT4gdGhpcy5fZmlsZXNTZXQuYWRkKGZpbGUpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5fZmlsZXNTZXQ7XG4gICAgfVxuICAgIGdldCBhY3RpdmVGcmFtZXdvcmsoKSB7XG4gICAgICAgIGlmICghdGhpcy5fYWN0aXZlRnJhbWV3b3JrKSB7XG4gICAgICAgICAgICB0aGlzLl9hY3RpdmVGcmFtZXdvcmsgPSB0aGlzLmZyYW1ld29ya3NbMF07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuX2FjdGl2ZUZyYW1ld29yaztcbiAgICB9XG4gICAgc2V0IGFjdGl2ZUZyYW1ld29yayh2YWx1ZSkge1xuICAgICAgICB0aGlzLl9hY3RpdmVGcmFtZXdvcmsgPSB2YWx1ZTtcbiAgICAgICAgaWYgKCF0aGlzLl9zdWJqZWN0QWN0aXZlRnJhbWV3b3JrLmlzVW5zdWJzY3JpYmVkKSB7XG4gICAgICAgICAgICB0aGlzLl9zdWJqZWN0QWN0aXZlRnJhbWV3b3JrLm5leHQodGhpcy5fYWN0aXZlRnJhbWV3b3JrKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBnZXQgZnJhbWV3b3JrcygpIHsgcmV0dXJuIHRoaXMuX2ZyYW1ld29ya3M7IH1cbiAgICBzZXQgZnJhbWV3b3Jrcyh2YWx1ZSkge1xuICAgICAgICB0aGlzLl9mcmFtZXdvcmtzID0gW3sgRnJpZW5kbHlOYW1lOiBcIkFsbFwiLCBOYW1lOiBcImFsbFwiLCBTaG9ydE5hbWU6IFwiYWxsXCIgfV0uY29uY2F0KHZhbHVlKTtcbiAgICAgICAgaWYgKCF0aGlzLmFjdGl2ZUZyYW1ld29yaykge1xuICAgICAgICAgICAgdGhpcy5hY3RpdmVGcmFtZXdvcmsgPSB0aGlzLl9mcmFtZXdvcmtzWzBdO1xuICAgICAgICB9XG4gICAgfVxuICAgIGdldCBjb25maWd1cmF0aW9ucygpIHsgcmV0dXJuIHRoaXMuX2NvbmZpZ3VyYXRpb25zOyB9XG4gICAgc2V0IGNvbmZpZ3VyYXRpb25zKHZhbHVlKSB7IHRoaXMuX2NvbmZpZ3VyYXRpb25zID0gdmFsdWUgfHwgW107IH1cbiAgICB1cGRhdGUob3RoZXIpIHtcbiAgICAgICAgdGhpcy5uYW1lID0gb3RoZXIubmFtZTtcbiAgICAgICAgdGhpcy5wYXRoID0gb3RoZXIucGF0aDtcbiAgICAgICAgdGhpcy5zb2x1dGlvblBhdGggPSBvdGhlci5zb2x1dGlvblBhdGg7XG4gICAgICAgIHRoaXMuc291cmNlRmlsZXMgPSBvdGhlci5zb3VyY2VGaWxlcztcbiAgICAgICAgdGhpcy5mcmFtZXdvcmtzID0gb3RoZXIuZnJhbWV3b3JrcztcbiAgICAgICAgdGhpcy5hY3RpdmVGcmFtZXdvcmsgPSB0aGlzLl9hY3RpdmVGcmFtZXdvcms7XG4gICAgICAgIHRoaXMuY29uZmlndXJhdGlvbnMgPSBvdGhlci5jb25maWd1cmF0aW9ucztcbiAgICB9XG4gICAgdG9KU09OKCkge1xuICAgICAgICBjb25zdCB7IG5hbWUsIHBhdGgsIHNvbHV0aW9uUGF0aCwgc291cmNlRmlsZXMsIGZyYW1ld29ya3MsIGNvbmZpZ3VyYXRpb25zIH0gPSB0aGlzO1xuICAgICAgICByZXR1cm4geyBuYW1lLCBwYXRoLCBzb2x1dGlvblBhdGgsIHNvdXJjZUZpbGVzLCBmcmFtZXdvcmtzLCBjb25maWd1cmF0aW9ucyB9O1xuICAgIH1cbiAgICBkaXNwb3NlKCkge1xuICAgICAgICB0aGlzLl9zdWJqZWN0QWN0aXZlRnJhbWV3b3JrLnVuc3Vic2NyaWJlKCk7XG4gICAgfVxufVxuZXhwb3J0IGNsYXNzIEVtcHR5UHJvamVjdFZpZXdNb2RlbCBleHRlbmRzIFByb2plY3RWaWV3TW9kZWwge1xuICAgIGluaXQocHJvamVjdCkgeyB9XG59XG5jbGFzcyBQcm94eVByb2plY3RWaWV3TW9kZWwgZXh0ZW5kcyBQcm9qZWN0Vmlld01vZGVsIHtcbiAgICBpbml0KHByb2plY3QpIHtcbiAgICAgICAgdGhpcy51cGRhdGUocHJvamVjdCk7XG4gICAgfVxufVxuY2xhc3MgTXNCdWlsZFByb2plY3RWaWV3TW9kZWwgZXh0ZW5kcyBQcm9qZWN0Vmlld01vZGVsIHtcbiAgICBpbml0KHByb2plY3QpIHtcbiAgICAgICAgY29uc3QgZnJhbWV3b3JrcyA9IFt7XG4gICAgICAgICAgICAgICAgRnJpZW5kbHlOYW1lOiBwcm9qZWN0LlRhcmdldEZyYW1ld29yayxcbiAgICAgICAgICAgICAgICBOYW1lOiBwcm9qZWN0LlRhcmdldEZyYW1ld29yayxcbiAgICAgICAgICAgICAgICBTaG9ydE5hbWU6IHByb2plY3QuVGFyZ2V0RnJhbWV3b3JrXG4gICAgICAgICAgICB9XTtcbiAgICAgICAgdGhpcy5uYW1lID0gcHJvamVjdC5Bc3NlbWJseU5hbWU7XG4gICAgICAgIHRoaXMucGF0aCA9IHByb2plY3QuUGF0aDtcbiAgICAgICAgdGhpcy5mcmFtZXdvcmtzID0gZnJhbWV3b3JrcztcbiAgICAgICAgdGhpcy5zb3VyY2VGaWxlcyA9IHByb2plY3QuU291cmNlRmlsZXM7XG4gICAgfVxufVxuY2xhc3MgRG90TmV0UHJvamVjdFZpZXdNb2RlbCBleHRlbmRzIFByb2plY3RWaWV3TW9kZWwge1xuICAgIGluaXQocHJvamVjdCkge1xuICAgICAgICB0aGlzLm5hbWUgPSBwcm9qZWN0Lk5hbWU7XG4gICAgICAgIHRoaXMucGF0aCA9IHByb2plY3QuUGF0aDtcbiAgICAgICAgdGhpcy5mcmFtZXdvcmtzID0gcHJvamVjdC5GcmFtZXdvcmtzIHx8IFtdO1xuICAgICAgICB0aGlzLmNvbmZpZ3VyYXRpb25zID0gKHByb2plY3QuQ29uZmlndXJhdGlvbnMgfHwgW10pLm1hcCh4ID0+IHguTmFtZSk7XG4gICAgICAgIHRoaXMuc291cmNlRmlsZXMgPSBwcm9qZWN0LlNvdXJjZUZpbGVzIHx8IFtdO1xuICAgIH1cbn1cbmNsYXNzIFNjcmlwdENzUHJvamVjdFZpZXdNb2RlbCBleHRlbmRzIFByb2plY3RWaWV3TW9kZWwge1xuICAgIGluaXQocHJvamVjdCkge1xuICAgICAgICB0aGlzLm5hbWUgPSBcIlNjcmlwdENzXCI7XG4gICAgICAgIHRoaXMucGF0aCA9IHByb2plY3QuUm9vdFBhdGg7XG4gICAgICAgIHRoaXMuc291cmNlRmlsZXMgPSBwcm9qZWN0LkNzeEZpbGVzQmVpbmdQcm9jZXNzZWQ7XG4gICAgfVxufVxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
