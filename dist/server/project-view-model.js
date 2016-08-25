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
                    _this._filesSet.add(file);
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

        return _possibleConstructorReturn(this, (EmptyProjectViewModel.__proto__ || Object.getPrototypeOf(EmptyProjectViewModel)).apply(this, arguments));
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

        return _possibleConstructorReturn(this, (ProxyProjectViewModel.__proto__ || Object.getPrototypeOf(ProxyProjectViewModel)).apply(this, arguments));
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

        return _possibleConstructorReturn(this, (MsBuildProjectViewModel.__proto__ || Object.getPrototypeOf(MsBuildProjectViewModel)).apply(this, arguments));
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

        return _possibleConstructorReturn(this, (DotNetProjectViewModel.__proto__ || Object.getPrototypeOf(DotNetProjectViewModel)).apply(this, arguments));
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

        return _possibleConstructorReturn(this, (ScriptCsProjectViewModel.__proto__ || Object.getPrototypeOf(ScriptCsProjectViewModel)).apply(this, arguments));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9zZXJ2ZXIvcHJvamVjdC12aWV3LW1vZGVsLnRzIiwibGliL3NlcnZlci9wcm9qZWN0LXZpZXctbW9kZWwuanMiXSwibmFtZXMiOlsicHJvamVjdFZpZXdNb2RlbEZhY3RvcnkiLCJ3b3Jrc3BhY2VWaWV3TW9kZWxGYWN0b3J5IiwicHJvamVjdEZhY3RvcmllcyIsIk1zQnVpbGRQcm9qZWN0IiwiTXNCdWlsZFByb2plY3RWaWV3TW9kZWwiLCJEb3ROZXRQcm9qZWN0IiwiRG90TmV0UHJvamVjdFZpZXdNb2RlbCIsInN1cHBvcnRlZFByb2plY3RUeXBlcyIsImtleXMiLCJvbW5pc2hhcnBQcm9qZWN0Iiwic29sdXRpb25QYXRoIiwicHJvamVjdFR5cGVzIiwiZmlsdGVyIiwiaGFzIiwidHlwZSIsIm1pc3NpbmciLCJkaWZmZXJlbmNlIiwibGVuZ3RoIiwiY29uc29sZSIsImxvZyIsInJlc3VsdHMiLCJza2lwRG54IiwiZWFjaCIsInN0YXJ0c1dpdGgiLCJwcm9qZWN0VHlwZSIsInB1c2giLCJ3b3Jrc3BhY2VGYWN0b3JpZXMiLCJNc0J1aWxkIiwid29ya3NwYWNlIiwibWFwIiwiUHJvamVjdHMiLCJwcm9qZWN0SW5mb3JtYXRpb24iLCJEb3ROZXQiLCJTY3JpcHRDcyIsIm9tbmlzaGFycFdvcmtzcGFjZSIsInByb2plY3RzIiwiZm9ySW4iLCJpdGVtIiwia2V5IiwiZmFjdG9yeSIsIlByb2plY3RWaWV3TW9kZWwiLCJwcm9qZWN0IiwiX3NvdXJjZUZpbGVzIiwiX3N1YmplY3RBY3RpdmVGcmFtZXdvcmsiLCJfZnJhbWV3b3JrcyIsIkZyaWVuZGx5TmFtZSIsIk5hbWUiLCJTaG9ydE5hbWUiLCJfY29uZmlndXJhdGlvbnMiLCJpbml0Iiwib2JzZXJ2ZSIsImFjdGl2ZUZyYW1ld29yayIsIm5leHQiLCJvdGhlciIsIm5hbWUiLCJwYXRoIiwic291cmNlRmlsZXMiLCJmcmFtZXdvcmtzIiwiX2FjdGl2ZUZyYW1ld29yayIsImNvbmZpZ3VyYXRpb25zIiwidW5zdWJzY3JpYmUiLCJfbmFtZSIsInZhbHVlIiwiX3BhdGgiLCJfc29sdXRpb25QYXRoIiwiX2ZpbGVzU2V0IiwiU2V0IiwiYWRkIiwiZmlsZSIsImlzVW5zdWJzY3JpYmVkIiwiY29uY2F0IiwiRW1wdHlQcm9qZWN0Vmlld01vZGVsIiwiUHJveHlQcm9qZWN0Vmlld01vZGVsIiwidXBkYXRlIiwiVGFyZ2V0RnJhbWV3b3JrIiwiQXNzZW1ibHlOYW1lIiwiUGF0aCIsIlNvdXJjZUZpbGVzIiwiRnJhbWV3b3JrcyIsIkNvbmZpZ3VyYXRpb25zIiwieCIsIlNjcmlwdENzUHJvamVjdFZpZXdNb2RlbCIsIlJvb3RQYXRoIiwiQ3N4RmlsZXNCZWluZ1Byb2Nlc3NlZCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O1FBV0FBLHVCLEdBQUFBLHVCO1FBa0NBQyx5QixHQUFBQSx5Qjs7QUM3Q0E7Ozs7QUFDQTs7Ozs7Ozs7Ozs7O0FESUEsSUFBTUMsbUJBQTJGO0FBQzdGQyxvQkFBcUJDLHVCQUR3RTtBQUU3RkMsbUJBQW9CQztBQUZ5RSxDQUFqRztBQUtBLElBQU1DLHdCQUF3QixpQkFBRUMsSUFBRixDQUFPTixnQkFBUCxDQUE5QjtBQUNBLFNBQUFGLHVCQUFBLENBQXdDUyxnQkFBeEMsRUFBNkZDLFlBQTdGLEVBQWlIO0FBQzdHLFFBQU1DLGVBQWUsaUJBQUVDLE1BQUYsQ0FBU0wscUJBQVQsRUFBZ0M7QUFBQSxlQUFRLGlCQUFFTSxHQUFGLENBQU1KLGdCQUFOLEVBQXdCSyxJQUF4QixDQUFSO0FBQUEsS0FBaEMsQ0FBckI7QUFDQSxRQUFNQyxVQUFVLGlCQUFFQyxVQUFGLENBQWEsaUJBQUVSLElBQUYsQ0FBT0MsZ0JBQVAsQ0FBYixFQUF1Q0YscUJBQXZDLENBQWhCO0FBQ0EsUUFBSVEsUUFBUUUsTUFBWixFQUFvQjtBQUNoQkMsZ0JBQVFDLEdBQVIsdUNBQWdESixPQUFoRDtBQUNIO0FBRUQsUUFBTUssVUFBbUMsRUFBekM7QUFDQSxRQUFJQyxVQUFVLEtBQWQ7QUFDQSxRQUFJVixhQUFhLGVBQWIsS0FB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QkFBS2EsSUFBTCxHQUFZLFVBQVo7QUFDQSxpQkFBS0MsSUFBTCxHQUFZZCxRQUFReUMsUUFBcEI7QUFDQSxpQkFBSzFCLFdBQUwsR0FBbUJmLFFBQVEwQyxzQkFBM0I7QUFDSDs7OztFQUxrQzNDLGdCIiwiZmlsZSI6ImxpYi9zZXJ2ZXIvcHJvamVjdC12aWV3LW1vZGVsLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtJUHJvamVjdFZpZXdNb2RlbH0gZnJvbSBcIi4uL29tbmlzaGFycFwiO1xyXG5pbXBvcnQge01vZGVscywgU2NyaXB0Q3N9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XHJcbmltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcclxuaW1wb3J0IHtPYnNlcnZhYmxlLCBSZXBsYXlTdWJqZWN0fSBmcm9tIFwicnhqc1wiO1xyXG5cclxuY29uc3QgcHJvamVjdEZhY3RvcmllczogeyBba2V5OiBzdHJpbmddOiB7IG5ldyAocHJvamVjdDogYW55LCBzb2x1dGlvblBhdGg6IHN0cmluZyk6IGFueTsgfTsgfSA9IHtcclxuICAgIE1zQnVpbGRQcm9qZWN0OiA8YW55Pk1zQnVpbGRQcm9qZWN0Vmlld01vZGVsLFxyXG4gICAgRG90TmV0UHJvamVjdDogPGFueT5Eb3ROZXRQcm9qZWN0Vmlld01vZGVsXHJcbn07XHJcblxyXG5jb25zdCBzdXBwb3J0ZWRQcm9qZWN0VHlwZXMgPSBfLmtleXMocHJvamVjdEZhY3Rvcmllcyk7XHJcbmV4cG9ydCBmdW5jdGlvbiBwcm9qZWN0Vmlld01vZGVsRmFjdG9yeShvbW5pc2hhcnBQcm9qZWN0OiBNb2RlbHMuUHJvamVjdEluZm9ybWF0aW9uUmVzcG9uc2UsIHNvbHV0aW9uUGF0aDogc3RyaW5nKSB7XHJcbiAgICBjb25zdCBwcm9qZWN0VHlwZXMgPSBfLmZpbHRlcihzdXBwb3J0ZWRQcm9qZWN0VHlwZXMsIHR5cGUgPT4gXy5oYXMob21uaXNoYXJwUHJvamVjdCwgdHlwZSkpO1xyXG4gICAgY29uc3QgbWlzc2luZyA9IF8uZGlmZmVyZW5jZShfLmtleXMob21uaXNoYXJwUHJvamVjdCksIHN1cHBvcnRlZFByb2plY3RUeXBlcyk7XHJcbiAgICBpZiAobWlzc2luZy5sZW5ndGgpIHtcclxuICAgICAgICBjb25zb2xlLmxvZyhgTWlzc2luZyBmYWN0b3J5IGZvciBwcm9qZWN0IHR5cGUgJHttaXNzaW5nfWApO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHJlc3VsdHM6IFByb2plY3RWaWV3TW9kZWw8YW55PltdID0gW107XHJcbiAgICBsZXQgc2tpcERueCA9IGZhbHNlO1xyXG4gICAgaWYgKHByb2plY3RUeXBlc1tcIkRvdE5ldFByb2plY3RcIl0gJiYgcHJvamVjdFR5cGVzW1wiRG54UHJvamVjdFwiXSkgc2tpcERueCA9IHRydWU7XHJcbiAgICBfLmVhY2gocHJvamVjdFR5cGVzLCBwcm9qZWN0VHlwZSA9PiB7XHJcbiAgICAgICAgaWYgKHNraXBEbnggJiYgXy5zdGFydHNXaXRoKHByb2plY3RUeXBlLCBcIkRueFwiKSkgcmV0dXJuO1xyXG4gICAgICAgIGlmIChwcm9qZWN0VHlwZSAmJiBwcm9qZWN0RmFjdG9yaWVzW3Byb2plY3RUeXBlXSkge1xyXG4gICAgICAgICAgICByZXN1bHRzLnB1c2gobmV3IHByb2plY3RGYWN0b3JpZXNbcHJvamVjdFR5cGVdKG9tbmlzaGFycFByb2plY3RbcHJvamVjdFR5cGVdLCBzb2x1dGlvblBhdGgpKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIHJldHVybiByZXN1bHRzO1xyXG59XHJcblxyXG5jb25zdCB3b3Jrc3BhY2VGYWN0b3JpZXM6IHsgW2tleTogc3RyaW5nXTogKHdvcmtzcGFjZTogYW55LCBzb2x1dGlvblBhdGg6IHN0cmluZykgPT4gUHJvamVjdFZpZXdNb2RlbDxhbnk+W10gfSA9IHtcclxuICAgIE1zQnVpbGQ6ICh3b3Jrc3BhY2U6IE1vZGVscy5Nc0J1aWxkV29ya3NwYWNlSW5mb3JtYXRpb24sIHNvbHV0aW9uUGF0aDogc3RyaW5nKSA9PiB7XHJcbiAgICAgICAgcmV0dXJuIF8ubWFwKHdvcmtzcGFjZS5Qcm9qZWN0cywgcHJvamVjdEluZm9ybWF0aW9uID0+IG5ldyBNc0J1aWxkUHJvamVjdFZpZXdNb2RlbChwcm9qZWN0SW5mb3JtYXRpb24sIHNvbHV0aW9uUGF0aCkpO1xyXG4gICAgfSxcclxuICAgIERvdE5ldDogKHdvcmtzcGFjZTogTW9kZWxzLkRvdE5ldFdvcmtzcGFjZUluZm9ybWF0aW9uLCBzb2x1dGlvblBhdGg6IHN0cmluZykgPT4ge1xyXG4gICAgICAgIHJldHVybiBfLm1hcCh3b3Jrc3BhY2UuUHJvamVjdHMsIHByb2plY3RJbmZvcm1hdGlvbiA9PiBuZXcgRG90TmV0UHJvamVjdFZpZXdNb2RlbChwcm9qZWN0SW5mb3JtYXRpb24sIHNvbHV0aW9uUGF0aCkpO1xyXG4gICAgfSxcclxuICAgIFNjcmlwdENzOiAod29ya3NwYWNlOiBTY3JpcHRDcy5TY3JpcHRDc0NvbnRleHRNb2RlbCwgc29sdXRpb25QYXRoOiBzdHJpbmcpID0+IHtcclxuICAgICAgICAvKmlmICh3b3Jrc3BhY2UuQ3N4RmlsZXMubGVuZ3RoID4gMClcclxuICAgICAgICAgICAgcmV0dXJuIFtuZXcgU2NyaXB0Q3NQcm9qZWN0Vmlld01vZGVsKHdvcmtzcGFjZSwgc29sdXRpb25QYXRoKV07XHJcbiAgICAgICAgKi9cclxuICAgICAgICByZXR1cm4gW107XHJcbiAgICB9LFxyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHdvcmtzcGFjZVZpZXdNb2RlbEZhY3Rvcnkob21uaXNoYXJwV29ya3NwYWNlOiBNb2RlbHMuV29ya3NwYWNlSW5mb3JtYXRpb25SZXNwb25zZSwgc29sdXRpb25QYXRoOiBzdHJpbmcpIHtcclxuICAgIGNvbnN0IHByb2plY3RzOiBhbnlbXSA9IFtdO1xyXG4gICAgbGV0IHNraXBEbnggPSBmYWxzZTtcclxuICAgIGlmIChvbW5pc2hhcnBXb3Jrc3BhY2VbXCJEb3ROZXRcIl0gJiYgb21uaXNoYXJwV29ya3NwYWNlW1wiRG54XCJdKSBza2lwRG54ID0gdHJ1ZTtcclxuICAgIF8uZm9ySW4ob21uaXNoYXJwV29ya3NwYWNlLCAoaXRlbSwga2V5KSA9PiB7XHJcbiAgICAgICAgY29uc3QgZmFjdG9yeSA9IHdvcmtzcGFjZUZhY3Rvcmllc1trZXldO1xyXG4gICAgICAgIGlmIChza2lwRG54ICYmIF8uc3RhcnRzV2l0aChrZXksIFwiRG54XCIpKSByZXR1cm47XHJcbiAgICAgICAgaWYgKGZhY3RvcnkpIHtcclxuICAgICAgICAgICAgcHJvamVjdHMucHVzaCguLi5mYWN0b3J5KGl0ZW0sIHNvbHV0aW9uUGF0aCkpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiBwcm9qZWN0cztcclxufVxyXG5cclxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIFByb2plY3RWaWV3TW9kZWw8VD4gaW1wbGVtZW50cyBJUHJvamVjdFZpZXdNb2RlbCB7XHJcbiAgICBjb25zdHJ1Y3Rvcihwcm9qZWN0OiBULCBzb2x1dGlvblBhdGg6IHN0cmluZykge1xyXG4gICAgICAgIHRoaXMuc29sdXRpb25QYXRoID0gc29sdXRpb25QYXRoO1xyXG4gICAgICAgIHRoaXMuaW5pdChwcm9qZWN0KTtcclxuICAgICAgICB0aGlzLm9ic2VydmUgPSB7IGFjdGl2ZUZyYW1ld29yazogPE9ic2VydmFibGU8TW9kZWxzLkRvdE5ldEZyYW1ld29yaz4+PGFueT50aGlzLl9zdWJqZWN0QWN0aXZlRnJhbWV3b3JrIH07XHJcbiAgICAgICAgdGhpcy5fc3ViamVjdEFjdGl2ZUZyYW1ld29yay5uZXh0KHRoaXMuX2ZyYW1ld29ya3NbMF0pO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX25hbWU6IHN0cmluZztcclxuICAgIHB1YmxpYyBnZXQgbmFtZSgpIHsgcmV0dXJuIHRoaXMuX25hbWU7IH1cclxuICAgIHB1YmxpYyBzZXQgbmFtZSh2YWx1ZSkgeyB0aGlzLl9uYW1lID0gdmFsdWU7IH1cclxuXHJcbiAgICBwcml2YXRlIF9wYXRoOiBzdHJpbmc7XHJcbiAgICBwdWJsaWMgZ2V0IHBhdGgoKSB7IHJldHVybiB0aGlzLl9wYXRoOyB9XHJcbiAgICBwdWJsaWMgc2V0IHBhdGgodmFsdWUpIHsgdGhpcy5fcGF0aCA9IHZhbHVlOyB9XHJcblxyXG4gICAgcHJpdmF0ZSBfc29sdXRpb25QYXRoOiBzdHJpbmc7XHJcbiAgICBwdWJsaWMgZ2V0IHNvbHV0aW9uUGF0aCgpIHsgcmV0dXJuIHRoaXMuX3NvbHV0aW9uUGF0aDsgfVxyXG4gICAgcHVibGljIHNldCBzb2x1dGlvblBhdGgodmFsdWUpIHsgdGhpcy5fc29sdXRpb25QYXRoID0gdmFsdWU7IH1cclxuXHJcbiAgICBwcml2YXRlIF9zb3VyY2VGaWxlczogc3RyaW5nW10gPSBbXTtcclxuICAgIHB1YmxpYyBnZXQgc291cmNlRmlsZXMoKSB7IHJldHVybiB0aGlzLl9zb3VyY2VGaWxlczsgfVxyXG4gICAgcHVibGljIHNldCBzb3VyY2VGaWxlcyh2YWx1ZSkge1xyXG4gICAgICAgIHRoaXMuX3NvdXJjZUZpbGVzID0gdmFsdWUgfHwgW107XHJcbiAgICAgICAgaWYgKHRoaXMuX2ZpbGVzU2V0KSB0aGlzLl9maWxlc1NldCA9IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfZmlsZXNTZXQ6IFNldDxzdHJpbmc+O1xyXG4gICAgcHVibGljIGdldCBmaWxlc1NldCgpIHtcclxuICAgICAgICBpZiAoIXRoaXMuX2ZpbGVzU2V0KSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2ZpbGVzU2V0ID0gbmV3IFNldDxzdHJpbmc+KCk7XHJcbiAgICAgICAgICAgIF8uZWFjaCh0aGlzLl9zb3VyY2VGaWxlcywgZmlsZSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9maWxlc1NldC5hZGQoZmlsZSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcy5fZmlsZXNTZXQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfc3ViamVjdEFjdGl2ZUZyYW1ld29yayA9IG5ldyBSZXBsYXlTdWJqZWN0PE1vZGVscy5Eb3ROZXRGcmFtZXdvcms+KDEpO1xyXG4gICAgcHJpdmF0ZSBfYWN0aXZlRnJhbWV3b3JrOiBNb2RlbHMuRG90TmV0RnJhbWV3b3JrO1xyXG4gICAgcHVibGljIGdldCBhY3RpdmVGcmFtZXdvcmsoKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLl9hY3RpdmVGcmFtZXdvcmspIHtcclxuICAgICAgICAgICAgdGhpcy5fYWN0aXZlRnJhbWV3b3JrID0gdGhpcy5mcmFtZXdvcmtzWzBdO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcy5fYWN0aXZlRnJhbWV3b3JrO1xyXG4gICAgfVxyXG4gICAgcHVibGljIHNldCBhY3RpdmVGcmFtZXdvcmsodmFsdWUpIHtcclxuICAgICAgICB0aGlzLl9hY3RpdmVGcmFtZXdvcmsgPSB2YWx1ZTtcclxuICAgICAgICBpZiAoIXRoaXMuX3N1YmplY3RBY3RpdmVGcmFtZXdvcmsuaXNVbnN1YnNjcmliZWQpIHtcclxuICAgICAgICAgICAgdGhpcy5fc3ViamVjdEFjdGl2ZUZyYW1ld29yay5uZXh0KHRoaXMuX2FjdGl2ZUZyYW1ld29yayk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX2ZyYW1ld29ya3M6IE1vZGVscy5Eb3ROZXRGcmFtZXdvcmtbXSA9IFt7IEZyaWVuZGx5TmFtZTogXCJBbGxcIiwgTmFtZTogXCJhbGxcIiwgU2hvcnROYW1lOiBcImFsbFwiIH1dO1xyXG4gICAgcHVibGljIGdldCBmcmFtZXdvcmtzKCkgeyByZXR1cm4gdGhpcy5fZnJhbWV3b3JrczsgfVxyXG4gICAgcHVibGljIHNldCBmcmFtZXdvcmtzKHZhbHVlKSB7XHJcbiAgICAgICAgdGhpcy5fZnJhbWV3b3JrcyA9IFt7IEZyaWVuZGx5TmFtZTogXCJBbGxcIiwgTmFtZTogXCJhbGxcIiwgU2hvcnROYW1lOiBcImFsbFwiIH1dLmNvbmNhdCh2YWx1ZSk7XHJcbiAgICAgICAgaWYgKCF0aGlzLmFjdGl2ZUZyYW1ld29yaykge1xyXG4gICAgICAgICAgICB0aGlzLmFjdGl2ZUZyYW1ld29yayA9IHRoaXMuX2ZyYW1ld29ya3NbMF07XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX2NvbmZpZ3VyYXRpb25zOiBzdHJpbmdbXSA9IFtdO1xyXG4gICAgcHVibGljIGdldCBjb25maWd1cmF0aW9ucygpIHsgcmV0dXJuIHRoaXMuX2NvbmZpZ3VyYXRpb25zOyB9XHJcbiAgICBwdWJsaWMgc2V0IGNvbmZpZ3VyYXRpb25zKHZhbHVlKSB7IHRoaXMuX2NvbmZpZ3VyYXRpb25zID0gdmFsdWUgfHwgW107IH1cclxuXHJcbiAgICBwdWJsaWMgb2JzZXJ2ZToge1xyXG4gICAgICAgIGFjdGl2ZUZyYW1ld29yazogT2JzZXJ2YWJsZTxNb2RlbHMuRG90TmV0RnJhbWV3b3JrPjtcclxuICAgIH07XHJcblxyXG4gICAgcHVibGljIGFic3RyYWN0IGluaXQodmFsdWU6IFQpOiB2b2lkO1xyXG4gICAgcHVibGljIHVwZGF0ZShvdGhlcjogUHJvamVjdFZpZXdNb2RlbDxUPikge1xyXG4gICAgICAgIHRoaXMubmFtZSA9IG90aGVyLm5hbWU7XHJcbiAgICAgICAgdGhpcy5wYXRoID0gb3RoZXIucGF0aDtcclxuICAgICAgICB0aGlzLnNvbHV0aW9uUGF0aCA9IG90aGVyLnNvbHV0aW9uUGF0aDtcclxuICAgICAgICB0aGlzLnNvdXJjZUZpbGVzID0gb3RoZXIuc291cmNlRmlsZXM7XHJcbiAgICAgICAgdGhpcy5mcmFtZXdvcmtzID0gb3RoZXIuZnJhbWV3b3JrcztcclxuICAgICAgICB0aGlzLmFjdGl2ZUZyYW1ld29yayA9IHRoaXMuX2FjdGl2ZUZyYW1ld29yaztcclxuICAgICAgICB0aGlzLmNvbmZpZ3VyYXRpb25zID0gb3RoZXIuY29uZmlndXJhdGlvbnM7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHRvSlNPTigpIHtcclxuICAgICAgICBjb25zdCB7bmFtZSwgcGF0aCwgc29sdXRpb25QYXRoLCBzb3VyY2VGaWxlcywgZnJhbWV3b3JrcywgY29uZmlndXJhdGlvbnN9ID0gdGhpcztcclxuICAgICAgICByZXR1cm4geyBuYW1lLCBwYXRoLCBzb2x1dGlvblBhdGgsIHNvdXJjZUZpbGVzLCBmcmFtZXdvcmtzLCBjb25maWd1cmF0aW9ucyB9O1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkaXNwb3NlKCkge1xyXG4gICAgICAgIHRoaXMuX3N1YmplY3RBY3RpdmVGcmFtZXdvcmsudW5zdWJzY3JpYmUoKTtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIEVtcHR5UHJvamVjdFZpZXdNb2RlbCBleHRlbmRzIFByb2plY3RWaWV3TW9kZWw8UHJvamVjdFZpZXdNb2RlbDxhbnk+PiB7XHJcbiAgICBwdWJsaWMgaW5pdChwcm9qZWN0OiBQcm9qZWN0Vmlld01vZGVsPGFueT4pIHsgLyogKi8gfVxyXG59XHJcblxyXG5jbGFzcyBQcm94eVByb2plY3RWaWV3TW9kZWwgZXh0ZW5kcyBQcm9qZWN0Vmlld01vZGVsPFByb2plY3RWaWV3TW9kZWw8YW55Pj4ge1xyXG4gICAgcHVibGljIGluaXQocHJvamVjdDogUHJvamVjdFZpZXdNb2RlbDxhbnk+KSB7XHJcbiAgICAgICAgdGhpcy51cGRhdGUocHJvamVjdCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmNsYXNzIE1zQnVpbGRQcm9qZWN0Vmlld01vZGVsIGV4dGVuZHMgUHJvamVjdFZpZXdNb2RlbDxNb2RlbHMuTVNCdWlsZFByb2plY3Q+IHtcclxuICAgIHB1YmxpYyBpbml0KHByb2plY3Q6IE1vZGVscy5NU0J1aWxkUHJvamVjdCkge1xyXG4gICAgICAgIGNvbnN0IGZyYW1ld29ya3MgPSBbe1xyXG4gICAgICAgICAgICBGcmllbmRseU5hbWU6IHByb2plY3QuVGFyZ2V0RnJhbWV3b3JrLFxyXG4gICAgICAgICAgICBOYW1lOiBwcm9qZWN0LlRhcmdldEZyYW1ld29yayxcclxuICAgICAgICAgICAgU2hvcnROYW1lOiBwcm9qZWN0LlRhcmdldEZyYW1ld29ya1xyXG4gICAgICAgIH1dO1xyXG5cclxuICAgICAgICB0aGlzLm5hbWUgPSBwcm9qZWN0LkFzc2VtYmx5TmFtZTtcclxuICAgICAgICB0aGlzLnBhdGggPSBwcm9qZWN0LlBhdGg7XHJcbiAgICAgICAgdGhpcy5mcmFtZXdvcmtzID0gZnJhbWV3b3JrcztcclxuICAgICAgICB0aGlzLnNvdXJjZUZpbGVzID0gcHJvamVjdC5Tb3VyY2VGaWxlcztcclxuICAgIH1cclxufVxyXG5cclxuY2xhc3MgRG90TmV0UHJvamVjdFZpZXdNb2RlbCBleHRlbmRzIFByb2plY3RWaWV3TW9kZWw8TW9kZWxzLkRvdE5ldFByb2plY3RJbmZvcm1hdGlvbj4ge1xyXG4gICAgcHVibGljIGluaXQocHJvamVjdDogTW9kZWxzLkRvdE5ldFByb2plY3RJbmZvcm1hdGlvbikge1xyXG4gICAgICAgIHRoaXMubmFtZSA9IHByb2plY3QuTmFtZTtcclxuICAgICAgICB0aGlzLnBhdGggPSBwcm9qZWN0LlBhdGg7XHJcbiAgICAgICAgdGhpcy5mcmFtZXdvcmtzID0gcHJvamVjdC5GcmFtZXdvcmtzIHx8IFtdO1xyXG4gICAgICAgIHRoaXMuY29uZmlndXJhdGlvbnMgPSAocHJvamVjdC5Db25maWd1cmF0aW9ucyB8fCBbXSkubWFwKHggPT4geC5OYW1lKTtcclxuICAgICAgICB0aGlzLnNvdXJjZUZpbGVzID0gcHJvamVjdC5Tb3VyY2VGaWxlcyB8fCBbXTtcclxuICAgIH1cclxufVxyXG5cclxuY2xhc3MgU2NyaXB0Q3NQcm9qZWN0Vmlld01vZGVsIGV4dGVuZHMgUHJvamVjdFZpZXdNb2RlbDxTY3JpcHRDcy5TY3JpcHRDc0NvbnRleHRNb2RlbD4ge1xyXG4gICAgcHVibGljIGluaXQocHJvamVjdDogU2NyaXB0Q3MuU2NyaXB0Q3NDb250ZXh0TW9kZWwpIHtcclxuICAgICAgICB0aGlzLm5hbWUgPSBcIlNjcmlwdENzXCI7XHJcbiAgICAgICAgdGhpcy5wYXRoID0gcHJvamVjdC5Sb290UGF0aDtcclxuICAgICAgICB0aGlzLnNvdXJjZUZpbGVzID0gcHJvamVjdC5Dc3hGaWxlc0JlaW5nUHJvY2Vzc2VkO1xyXG4gICAgfVxyXG59XHJcbiIsImltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcbmltcG9ydCB7IFJlcGxheVN1YmplY3QgfSBmcm9tIFwicnhqc1wiO1xuY29uc3QgcHJvamVjdEZhY3RvcmllcyA9IHtcbiAgICBNc0J1aWxkUHJvamVjdDogTXNCdWlsZFByb2plY3RWaWV3TW9kZWwsXG4gICAgRG90TmV0UHJvamVjdDogRG90TmV0UHJvamVjdFZpZXdNb2RlbFxufTtcbmNvbnN0IHN1cHBvcnRlZFByb2plY3RUeXBlcyA9IF8ua2V5cyhwcm9qZWN0RmFjdG9yaWVzKTtcbmV4cG9ydCBmdW5jdGlvbiBwcm9qZWN0Vmlld01vZGVsRmFjdG9yeShvbW5pc2hhcnBQcm9qZWN0LCBzb2x1dGlvblBhdGgpIHtcbiAgICBjb25zdCBwcm9qZWN0VHlwZXMgPSBfLmZpbHRlcihzdXBwb3J0ZWRQcm9qZWN0VHlwZXMsIHR5cGUgPT4gXy5oYXMob21uaXNoYXJwUHJvamVjdCwgdHlwZSkpO1xuICAgIGNvbnN0IG1pc3NpbmcgPSBfLmRpZmZlcmVuY2UoXy5rZXlzKG9tbmlzaGFycFByb2plY3QpLCBzdXBwb3J0ZWRQcm9qZWN0VHlwZXMpO1xuICAgIGlmIChtaXNzaW5nLmxlbmd0aCkge1xuICAgICAgICBjb25zb2xlLmxvZyhgTWlzc2luZyBmYWN0b3J5IGZvciBwcm9qZWN0IHR5cGUgJHttaXNzaW5nfWApO1xuICAgIH1cbiAgICBjb25zdCByZXN1bHRzID0gW107XG4gICAgbGV0IHNraXBEbnggPSBmYWxzZTtcbiAgICBpZiAocHJvamVjdFR5cGVzW1wiRG90TmV0UHJvamVjdFwiXSAmJiBwcm9qZWN0VHlwZXNbXCJEbnhQcm9qZWN0XCJdKVxuICAgICAgICBza2lwRG54ID0gdHJ1ZTtcbiAgICBfLmVhY2gocHJvamVjdFR5cGVzLCBwcm9qZWN0VHlwZSA9PiB7XG4gICAgICAgIGlmIChza2lwRG54ICYmIF8uc3RhcnRzV2l0aChwcm9qZWN0VHlwZSwgXCJEbnhcIikpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGlmIChwcm9qZWN0VHlwZSAmJiBwcm9qZWN0RmFjdG9yaWVzW3Byb2plY3RUeXBlXSkge1xuICAgICAgICAgICAgcmVzdWx0cy5wdXNoKG5ldyBwcm9qZWN0RmFjdG9yaWVzW3Byb2plY3RUeXBlXShvbW5pc2hhcnBQcm9qZWN0W3Byb2plY3RUeXBlXSwgc29sdXRpb25QYXRoKSk7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gcmVzdWx0cztcbn1cbmNvbnN0IHdvcmtzcGFjZUZhY3RvcmllcyA9IHtcbiAgICBNc0J1aWxkOiAod29ya3NwYWNlLCBzb2x1dGlvblBhdGgpID0+IHtcbiAgICAgICAgcmV0dXJuIF8ubWFwKHdvcmtzcGFjZS5Qcm9qZWN0cywgcHJvamVjdEluZm9ybWF0aW9uID0+IG5ldyBNc0J1aWxkUHJvamVjdFZpZXdNb2RlbChwcm9qZWN0SW5mb3JtYXRpb24sIHNvbHV0aW9uUGF0aCkpO1xuICAgIH0sXG4gICAgRG90TmV0OiAod29ya3NwYWNlLCBzb2x1dGlvblBhdGgpID0+IHtcbiAgICAgICAgcmV0dXJuIF8ubWFwKHdvcmtzcGFjZS5Qcm9qZWN0cywgcHJvamVjdEluZm9ybWF0aW9uID0+IG5ldyBEb3ROZXRQcm9qZWN0Vmlld01vZGVsKHByb2plY3RJbmZvcm1hdGlvbiwgc29sdXRpb25QYXRoKSk7XG4gICAgfSxcbiAgICBTY3JpcHRDczogKHdvcmtzcGFjZSwgc29sdXRpb25QYXRoKSA9PiB7XG4gICAgICAgIHJldHVybiBbXTtcbiAgICB9LFxufTtcbmV4cG9ydCBmdW5jdGlvbiB3b3Jrc3BhY2VWaWV3TW9kZWxGYWN0b3J5KG9tbmlzaGFycFdvcmtzcGFjZSwgc29sdXRpb25QYXRoKSB7XG4gICAgY29uc3QgcHJvamVjdHMgPSBbXTtcbiAgICBsZXQgc2tpcERueCA9IGZhbHNlO1xuICAgIGlmIChvbW5pc2hhcnBXb3Jrc3BhY2VbXCJEb3ROZXRcIl0gJiYgb21uaXNoYXJwV29ya3NwYWNlW1wiRG54XCJdKVxuICAgICAgICBza2lwRG54ID0gdHJ1ZTtcbiAgICBfLmZvckluKG9tbmlzaGFycFdvcmtzcGFjZSwgKGl0ZW0sIGtleSkgPT4ge1xuICAgICAgICBjb25zdCBmYWN0b3J5ID0gd29ya3NwYWNlRmFjdG9yaWVzW2tleV07XG4gICAgICAgIGlmIChza2lwRG54ICYmIF8uc3RhcnRzV2l0aChrZXksIFwiRG54XCIpKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBpZiAoZmFjdG9yeSkge1xuICAgICAgICAgICAgcHJvamVjdHMucHVzaCguLi5mYWN0b3J5KGl0ZW0sIHNvbHV0aW9uUGF0aCkpO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHByb2plY3RzO1xufVxuZXhwb3J0IGNsYXNzIFByb2plY3RWaWV3TW9kZWwge1xuICAgIGNvbnN0cnVjdG9yKHByb2plY3QsIHNvbHV0aW9uUGF0aCkge1xuICAgICAgICB0aGlzLl9zb3VyY2VGaWxlcyA9IFtdO1xuICAgICAgICB0aGlzLl9zdWJqZWN0QWN0aXZlRnJhbWV3b3JrID0gbmV3IFJlcGxheVN1YmplY3QoMSk7XG4gICAgICAgIHRoaXMuX2ZyYW1ld29ya3MgPSBbeyBGcmllbmRseU5hbWU6IFwiQWxsXCIsIE5hbWU6IFwiYWxsXCIsIFNob3J0TmFtZTogXCJhbGxcIiB9XTtcbiAgICAgICAgdGhpcy5fY29uZmlndXJhdGlvbnMgPSBbXTtcbiAgICAgICAgdGhpcy5zb2x1dGlvblBhdGggPSBzb2x1dGlvblBhdGg7XG4gICAgICAgIHRoaXMuaW5pdChwcm9qZWN0KTtcbiAgICAgICAgdGhpcy5vYnNlcnZlID0geyBhY3RpdmVGcmFtZXdvcms6IHRoaXMuX3N1YmplY3RBY3RpdmVGcmFtZXdvcmsgfTtcbiAgICAgICAgdGhpcy5fc3ViamVjdEFjdGl2ZUZyYW1ld29yay5uZXh0KHRoaXMuX2ZyYW1ld29ya3NbMF0pO1xuICAgIH1cbiAgICBnZXQgbmFtZSgpIHsgcmV0dXJuIHRoaXMuX25hbWU7IH1cbiAgICBzZXQgbmFtZSh2YWx1ZSkgeyB0aGlzLl9uYW1lID0gdmFsdWU7IH1cbiAgICBnZXQgcGF0aCgpIHsgcmV0dXJuIHRoaXMuX3BhdGg7IH1cbiAgICBzZXQgcGF0aCh2YWx1ZSkgeyB0aGlzLl9wYXRoID0gdmFsdWU7IH1cbiAgICBnZXQgc29sdXRpb25QYXRoKCkgeyByZXR1cm4gdGhpcy5fc29sdXRpb25QYXRoOyB9XG4gICAgc2V0IHNvbHV0aW9uUGF0aCh2YWx1ZSkgeyB0aGlzLl9zb2x1dGlvblBhdGggPSB2YWx1ZTsgfVxuICAgIGdldCBzb3VyY2VGaWxlcygpIHsgcmV0dXJuIHRoaXMuX3NvdXJjZUZpbGVzOyB9XG4gICAgc2V0IHNvdXJjZUZpbGVzKHZhbHVlKSB7XG4gICAgICAgIHRoaXMuX3NvdXJjZUZpbGVzID0gdmFsdWUgfHwgW107XG4gICAgICAgIGlmICh0aGlzLl9maWxlc1NldClcbiAgICAgICAgICAgIHRoaXMuX2ZpbGVzU2V0ID0gbnVsbDtcbiAgICB9XG4gICAgZ2V0IGZpbGVzU2V0KCkge1xuICAgICAgICBpZiAoIXRoaXMuX2ZpbGVzU2V0KSB7XG4gICAgICAgICAgICB0aGlzLl9maWxlc1NldCA9IG5ldyBTZXQoKTtcbiAgICAgICAgICAgIF8uZWFjaCh0aGlzLl9zb3VyY2VGaWxlcywgZmlsZSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5fZmlsZXNTZXQuYWRkKGZpbGUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuX2ZpbGVzU2V0O1xuICAgIH1cbiAgICBnZXQgYWN0aXZlRnJhbWV3b3JrKCkge1xuICAgICAgICBpZiAoIXRoaXMuX2FjdGl2ZUZyYW1ld29yaykge1xuICAgICAgICAgICAgdGhpcy5fYWN0aXZlRnJhbWV3b3JrID0gdGhpcy5mcmFtZXdvcmtzWzBdO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLl9hY3RpdmVGcmFtZXdvcms7XG4gICAgfVxuICAgIHNldCBhY3RpdmVGcmFtZXdvcmsodmFsdWUpIHtcbiAgICAgICAgdGhpcy5fYWN0aXZlRnJhbWV3b3JrID0gdmFsdWU7XG4gICAgICAgIGlmICghdGhpcy5fc3ViamVjdEFjdGl2ZUZyYW1ld29yay5pc1Vuc3Vic2NyaWJlZCkge1xuICAgICAgICAgICAgdGhpcy5fc3ViamVjdEFjdGl2ZUZyYW1ld29yay5uZXh0KHRoaXMuX2FjdGl2ZUZyYW1ld29yayk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZ2V0IGZyYW1ld29ya3MoKSB7IHJldHVybiB0aGlzLl9mcmFtZXdvcmtzOyB9XG4gICAgc2V0IGZyYW1ld29ya3ModmFsdWUpIHtcbiAgICAgICAgdGhpcy5fZnJhbWV3b3JrcyA9IFt7IEZyaWVuZGx5TmFtZTogXCJBbGxcIiwgTmFtZTogXCJhbGxcIiwgU2hvcnROYW1lOiBcImFsbFwiIH1dLmNvbmNhdCh2YWx1ZSk7XG4gICAgICAgIGlmICghdGhpcy5hY3RpdmVGcmFtZXdvcmspIHtcbiAgICAgICAgICAgIHRoaXMuYWN0aXZlRnJhbWV3b3JrID0gdGhpcy5fZnJhbWV3b3Jrc1swXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBnZXQgY29uZmlndXJhdGlvbnMoKSB7IHJldHVybiB0aGlzLl9jb25maWd1cmF0aW9uczsgfVxuICAgIHNldCBjb25maWd1cmF0aW9ucyh2YWx1ZSkgeyB0aGlzLl9jb25maWd1cmF0aW9ucyA9IHZhbHVlIHx8IFtdOyB9XG4gICAgdXBkYXRlKG90aGVyKSB7XG4gICAgICAgIHRoaXMubmFtZSA9IG90aGVyLm5hbWU7XG4gICAgICAgIHRoaXMucGF0aCA9IG90aGVyLnBhdGg7XG4gICAgICAgIHRoaXMuc29sdXRpb25QYXRoID0gb3RoZXIuc29sdXRpb25QYXRoO1xuICAgICAgICB0aGlzLnNvdXJjZUZpbGVzID0gb3RoZXIuc291cmNlRmlsZXM7XG4gICAgICAgIHRoaXMuZnJhbWV3b3JrcyA9IG90aGVyLmZyYW1ld29ya3M7XG4gICAgICAgIHRoaXMuYWN0aXZlRnJhbWV3b3JrID0gdGhpcy5fYWN0aXZlRnJhbWV3b3JrO1xuICAgICAgICB0aGlzLmNvbmZpZ3VyYXRpb25zID0gb3RoZXIuY29uZmlndXJhdGlvbnM7XG4gICAgfVxuICAgIHRvSlNPTigpIHtcbiAgICAgICAgY29uc3QgeyBuYW1lLCBwYXRoLCBzb2x1dGlvblBhdGgsIHNvdXJjZUZpbGVzLCBmcmFtZXdvcmtzLCBjb25maWd1cmF0aW9ucyB9ID0gdGhpcztcbiAgICAgICAgcmV0dXJuIHsgbmFtZSwgcGF0aCwgc29sdXRpb25QYXRoLCBzb3VyY2VGaWxlcywgZnJhbWV3b3JrcywgY29uZmlndXJhdGlvbnMgfTtcbiAgICB9XG4gICAgZGlzcG9zZSgpIHtcbiAgICAgICAgdGhpcy5fc3ViamVjdEFjdGl2ZUZyYW1ld29yay51bnN1YnNjcmliZSgpO1xuICAgIH1cbn1cbmV4cG9ydCBjbGFzcyBFbXB0eVByb2plY3RWaWV3TW9kZWwgZXh0ZW5kcyBQcm9qZWN0Vmlld01vZGVsIHtcbiAgICBpbml0KHByb2plY3QpIHsgfVxufVxuY2xhc3MgUHJveHlQcm9qZWN0Vmlld01vZGVsIGV4dGVuZHMgUHJvamVjdFZpZXdNb2RlbCB7XG4gICAgaW5pdChwcm9qZWN0KSB7XG4gICAgICAgIHRoaXMudXBkYXRlKHByb2plY3QpO1xuICAgIH1cbn1cbmNsYXNzIE1zQnVpbGRQcm9qZWN0Vmlld01vZGVsIGV4dGVuZHMgUHJvamVjdFZpZXdNb2RlbCB7XG4gICAgaW5pdChwcm9qZWN0KSB7XG4gICAgICAgIGNvbnN0IGZyYW1ld29ya3MgPSBbe1xuICAgICAgICAgICAgICAgIEZyaWVuZGx5TmFtZTogcHJvamVjdC5UYXJnZXRGcmFtZXdvcmssXG4gICAgICAgICAgICAgICAgTmFtZTogcHJvamVjdC5UYXJnZXRGcmFtZXdvcmssXG4gICAgICAgICAgICAgICAgU2hvcnROYW1lOiBwcm9qZWN0LlRhcmdldEZyYW1ld29ya1xuICAgICAgICAgICAgfV07XG4gICAgICAgIHRoaXMubmFtZSA9IHByb2plY3QuQXNzZW1ibHlOYW1lO1xuICAgICAgICB0aGlzLnBhdGggPSBwcm9qZWN0LlBhdGg7XG4gICAgICAgIHRoaXMuZnJhbWV3b3JrcyA9IGZyYW1ld29ya3M7XG4gICAgICAgIHRoaXMuc291cmNlRmlsZXMgPSBwcm9qZWN0LlNvdXJjZUZpbGVzO1xuICAgIH1cbn1cbmNsYXNzIERvdE5ldFByb2plY3RWaWV3TW9kZWwgZXh0ZW5kcyBQcm9qZWN0Vmlld01vZGVsIHtcbiAgICBpbml0KHByb2plY3QpIHtcbiAgICAgICAgdGhpcy5uYW1lID0gcHJvamVjdC5OYW1lO1xuICAgICAgICB0aGlzLnBhdGggPSBwcm9qZWN0LlBhdGg7XG4gICAgICAgIHRoaXMuZnJhbWV3b3JrcyA9IHByb2plY3QuRnJhbWV3b3JrcyB8fCBbXTtcbiAgICAgICAgdGhpcy5jb25maWd1cmF0aW9ucyA9IChwcm9qZWN0LkNvbmZpZ3VyYXRpb25zIHx8IFtdKS5tYXAoeCA9PiB4Lk5hbWUpO1xuICAgICAgICB0aGlzLnNvdXJjZUZpbGVzID0gcHJvamVjdC5Tb3VyY2VGaWxlcyB8fCBbXTtcbiAgICB9XG59XG5jbGFzcyBTY3JpcHRDc1Byb2plY3RWaWV3TW9kZWwgZXh0ZW5kcyBQcm9qZWN0Vmlld01vZGVsIHtcbiAgICBpbml0KHByb2plY3QpIHtcbiAgICAgICAgdGhpcy5uYW1lID0gXCJTY3JpcHRDc1wiO1xuICAgICAgICB0aGlzLnBhdGggPSBwcm9qZWN0LlJvb3RQYXRoO1xuICAgICAgICB0aGlzLnNvdXJjZUZpbGVzID0gcHJvamVjdC5Dc3hGaWxlc0JlaW5nUHJvY2Vzc2VkO1xuICAgIH1cbn1cbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
