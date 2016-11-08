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
            var name = this.name,
                path = this.path,
                solutionPath = this.solutionPath,
                sourceFiles = this.sourceFiles,
                frameworks = this.frameworks,
                configurations = this.configurations;

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
            if (!this._subjectActiveFramework.isStopped) {
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9zZXJ2ZXIvcHJvamVjdC12aWV3LW1vZGVsLnRzIiwibGliL3NlcnZlci9wcm9qZWN0LXZpZXctbW9kZWwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O1FBV0E7UUFrQ0E7O0FDN0NBOzs7O0FBQ0E7Ozs7Ozs7Ozs7OztBRElBLElBQU0sbUJBQTJGO0FBQzdGLG9CQUFxQix1QkFBckI7QUFDQSxtQkFBb0Isc0JBQXBCO0NBRkU7QUFLTixJQUFNLHdCQUF3QixpQkFBRSxJQUFGLENBQU8sZ0JBQVAsQ0FBeEI7QUFDTixTQUFBLHVCQUFBLENBQXdDLGdCQUF4QyxFQUE2RixZQUE3RixFQUFpSDtBQUM3RyxRQUFNLGVBQWUsaUJBQUUsTUFBRixDQUFTLHFCQUFULEVBQWdDO2VBQVEsaUJBQUUsR0FBRixDQUFNLGdCQUFOLEVBQXdCLElBQXhCO0tBQVIsQ0FBL0MsQ0FEdUc7QUFFN0csUUFBTSxVQUFVLGlCQUFFLFVBQUYsQ0FBYSxpQkFBRSxJQUFGLENBQU8sZ0JBQVAsQ0FBYixFQUF1QyxxQkFBdkMsQ0FBVixDQUZ1RztBQUc3RyxRQUFJLFFBQVEsTUFBUixFQUFnQjtBQUNoQixnQkFBUSxHQUFSLHVDQUFnRCxPQUFoRCxFQURnQjtLQUFwQjtBQUlBLFFBQU0sVUFBbUMsRUFBbkMsQ0FQdUc7QUFRN0csUUFBSSxVQUFVLEtBQVYsQ0FSeUc7QUFTN0csUUFBSSxhQUFhLGVBQWIsS0FBaUMsYUFBYSxZQUFiLENBQWpDLEVBQTZELFVBQVUsSUFBVixDQUFqRTtBQUNBLHFCQUFFLElBQUYsQ0FBTyxZQUFQLEVBQXFCLHVCQUFXO0FBQzVCLFlBQUksV0FBVyxpQkFBRSxVQUFGLENBQWEsV0FBYixFQUEwQixLQUExQixDQUFYLEVBQTZDLE9BQWpEO0FBQ0EsWUFBSSxlQUFlLGlCQUFpQixXQUFqQixDQUFmLEVBQThDO0FBQzlDLG9CQUFRLElBQVIsQ0FBYSxJQUFJLGlCQUFpQixXQUFqQixDQUFKLENBQWtDLGlCQUFpQixXQUFqQixDQUFs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QkFDZ0IsU0FBd0M7QUFDaEQsaUJBQUssSUFBTCxHQUFZLFFBQVEsSUFBUixDQURvQztBQUVoRCxpQkFBSyxJQUFMLEdBQVksUUFBUSxJQUFSLENBRm9DO0FBR2hELGlCQUFLLFVBQUwsR0FBa0IsUUFBUSxVQUFSLElBQXNCLEVBQXRCLENBSDhCO0FBSWhELGlCQUFLLGNBQUwsR0FBc0IsQ0FBQyxRQUFRLGNBQVIsSUFBMEIsRUFBMUIsQ0FBRCxDQUErQixHQUEvQixDQUFtQzt1QkFBSyxFQUFFLElBQUY7YUFBTCxDQUF6RCxDQUpnRDtBQUtoRCxpQkFBSyxXQUFMLEdBQW1CLFFBQVEsV0FBUixJQUF1QixFQUF2QixDQUw2Qjs7Ozs7RUFEbkI7O0lBVXJDOzs7Ozs7Ozs7Ozs2QkFDZ0IsU0FBc0M7QUFDOUMsaUJBQUssSUFBTCxHQUFZLFVBQVosQ0FEOEM7QUFFOUMsaUJBQUssSUFBTCxHQUFZLFFBQVEsUUFBUixDQUZrQztBQUc5QyxpQkFBSyxXQUFMLEdBQW1CLFFBQVEsc0JBQVIsQ0FIMkI7Ozs7O0VBRGYiLCJmaWxlIjoibGliL3NlcnZlci9wcm9qZWN0LXZpZXctbW9kZWwuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge0lQcm9qZWN0Vmlld01vZGVsfSBmcm9tIFwiLi4vb21uaXNoYXJwXCI7XHJcbmltcG9ydCB7TW9kZWxzLCBTY3JpcHRDc30gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcclxuaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xyXG5pbXBvcnQge09ic2VydmFibGUsIFJlcGxheVN1YmplY3R9IGZyb20gXCJyeGpzXCI7XHJcblxyXG5jb25zdCBwcm9qZWN0RmFjdG9yaWVzOiB7IFtrZXk6IHN0cmluZ106IHsgbmV3IChwcm9qZWN0OiBhbnksIHNvbHV0aW9uUGF0aDogc3RyaW5nKTogYW55OyB9OyB9ID0ge1xyXG4gICAgTXNCdWlsZFByb2plY3Q6IDxhbnk+TXNCdWlsZFByb2plY3RWaWV3TW9kZWwsXHJcbiAgICBEb3ROZXRQcm9qZWN0OiA8YW55PkRvdE5ldFByb2plY3RWaWV3TW9kZWxcclxufTtcclxuXHJcbmNvbnN0IHN1cHBvcnRlZFByb2plY3RUeXBlcyA9IF8ua2V5cyhwcm9qZWN0RmFjdG9yaWVzKTtcclxuZXhwb3J0IGZ1bmN0aW9uIHByb2plY3RWaWV3TW9kZWxGYWN0b3J5KG9tbmlzaGFycFByb2plY3Q6IE1vZGVscy5Qcm9qZWN0SW5mb3JtYXRpb25SZXNwb25zZSwgc29sdXRpb25QYXRoOiBzdHJpbmcpIHtcclxuICAgIGNvbnN0IHByb2plY3RUeXBlcyA9IF8uZmlsdGVyKHN1cHBvcnRlZFByb2plY3RUeXBlcywgdHlwZSA9PiBfLmhhcyhvbW5pc2hhcnBQcm9qZWN0LCB0eXBlKSk7XHJcbiAgICBjb25zdCBtaXNzaW5nID0gXy5kaWZmZXJlbmNlKF8ua2V5cyhvbW5pc2hhcnBQcm9qZWN0KSwgc3VwcG9ydGVkUHJvamVjdFR5cGVzKTtcclxuICAgIGlmIChtaXNzaW5nLmxlbmd0aCkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGBNaXNzaW5nIGZhY3RvcnkgZm9yIHByb2plY3QgdHlwZSAke21pc3Npbmd9YCk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgcmVzdWx0czogUHJvamVjdFZpZXdNb2RlbDxhbnk+W10gPSBbXTtcclxuICAgIGxldCBza2lwRG54ID0gZmFsc2U7XHJcbiAgICBpZiAocHJvamVjdFR5cGVzW1wiRG90TmV0UHJvamVjdFwiXSAmJiBwcm9qZWN0VHlwZXNbXCJEbnhQcm9qZWN0XCJdKSBza2lwRG54ID0gdHJ1ZTtcclxuICAgIF8uZWFjaChwcm9qZWN0VHlwZXMsIHByb2plY3RUeXBlID0+IHtcclxuICAgICAgICBpZiAoc2tpcERueCAmJiBfLnN0YXJ0c1dpdGgocHJvamVjdFR5cGUsIFwiRG54XCIpKSByZXR1cm47XHJcbiAgICAgICAgaWYgKHByb2plY3RUeXBlICYmIHByb2plY3RGYWN0b3JpZXNbcHJvamVjdFR5cGVdKSB7XHJcbiAgICAgICAgICAgIHJlc3VsdHMucHVzaChuZXcgcHJvamVjdEZhY3Rvcmllc1twcm9qZWN0VHlwZV0ob21uaXNoYXJwUHJvamVjdFtwcm9qZWN0VHlwZV0sIHNvbHV0aW9uUGF0aCkpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIHJlc3VsdHM7XHJcbn1cclxuXHJcbmNvbnN0IHdvcmtzcGFjZUZhY3RvcmllczogeyBba2V5OiBzdHJpbmddOiAod29ya3NwYWNlOiBhbnksIHNvbHV0aW9uUGF0aDogc3RyaW5nKSA9PiBQcm9qZWN0Vmlld01vZGVsPGFueT5bXSB9ID0ge1xyXG4gICAgTXNCdWlsZDogKHdvcmtzcGFjZTogTW9kZWxzLk1zQnVpbGRXb3Jrc3BhY2VJbmZvcm1hdGlvbiwgc29sdXRpb25QYXRoOiBzdHJpbmcpID0+IHtcclxuICAgICAgICByZXR1cm4gXy5tYXAod29ya3NwYWNlLlByb2plY3RzLCBwcm9qZWN0SW5mb3JtYXRpb24gPT4gbmV3IE1zQnVpbGRQcm9qZWN0Vmlld01vZGVsKHByb2plY3RJbmZvcm1hdGlvbiwgc29sdXRpb25QYXRoKSk7XHJcbiAgICB9LFxyXG4gICAgRG90TmV0OiAod29ya3NwYWNlOiBNb2RlbHMuRG90TmV0V29ya3NwYWNlSW5mb3JtYXRpb24sIHNvbHV0aW9uUGF0aDogc3RyaW5nKSA9PiB7XHJcbiAgICAgICAgcmV0dXJuIF8ubWFwKHdvcmtzcGFjZS5Qcm9qZWN0cywgcHJvamVjdEluZm9ybWF0aW9uID0+IG5ldyBEb3ROZXRQcm9qZWN0Vmlld01vZGVsKHByb2plY3RJbmZvcm1hdGlvbiwgc29sdXRpb25QYXRoKSk7XHJcbiAgICB9LFxyXG4gICAgU2NyaXB0Q3M6ICh3b3Jrc3BhY2U6IFNjcmlwdENzLlNjcmlwdENzQ29udGV4dE1vZGVsLCBzb2x1dGlvblBhdGg6IHN0cmluZykgPT4ge1xyXG4gICAgICAgIC8qaWYgKHdvcmtzcGFjZS5Dc3hGaWxlcy5sZW5ndGggPiAwKVxyXG4gICAgICAgICAgICByZXR1cm4gW25ldyBTY3JpcHRDc1Byb2plY3RWaWV3TW9kZWwod29ya3NwYWNlLCBzb2x1dGlvblBhdGgpXTtcclxuICAgICAgICAqL1xyXG4gICAgICAgIHJldHVybiBbXTtcclxuICAgIH0sXHJcbn07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gd29ya3NwYWNlVmlld01vZGVsRmFjdG9yeShvbW5pc2hhcnBXb3Jrc3BhY2U6IE1vZGVscy5Xb3Jrc3BhY2VJbmZvcm1hdGlvblJlc3BvbnNlLCBzb2x1dGlvblBhdGg6IHN0cmluZykge1xyXG4gICAgY29uc3QgcHJvamVjdHM6IGFueVtdID0gW107XHJcbiAgICBsZXQgc2tpcERueCA9IGZhbHNlO1xyXG4gICAgaWYgKG9tbmlzaGFycFdvcmtzcGFjZVtcIkRvdE5ldFwiXSAmJiBvbW5pc2hhcnBXb3Jrc3BhY2VbXCJEbnhcIl0pIHNraXBEbnggPSB0cnVlO1xyXG4gICAgXy5mb3JJbihvbW5pc2hhcnBXb3Jrc3BhY2UsIChpdGVtLCBrZXkpID0+IHtcclxuICAgICAgICBjb25zdCBmYWN0b3J5ID0gd29ya3NwYWNlRmFjdG9yaWVzW2tleV07XHJcbiAgICAgICAgaWYgKHNraXBEbnggJiYgXy5zdGFydHNXaXRoKGtleSwgXCJEbnhcIikpIHJldHVybjtcclxuICAgICAgICBpZiAoZmFjdG9yeSkge1xyXG4gICAgICAgICAgICBwcm9qZWN0cy5wdXNoKC4uLmZhY3RvcnkoaXRlbSwgc29sdXRpb25QYXRoKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgcmV0dXJuIHByb2plY3RzO1xyXG59XHJcblxyXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgUHJvamVjdFZpZXdNb2RlbDxUPiBpbXBsZW1lbnRzIElQcm9qZWN0Vmlld01vZGVsIHtcclxuICAgIGNvbnN0cnVjdG9yKHByb2plY3Q6IFQsIHNvbHV0aW9uUGF0aDogc3RyaW5nKSB7XHJcbiAgICAgICAgdGhpcy5zb2x1dGlvblBhdGggPSBzb2x1dGlvblBhdGg7XHJcbiAgICAgICAgdGhpcy5pbml0KHByb2plY3QpO1xyXG4gICAgICAgIHRoaXMub2JzZXJ2ZSA9IHsgYWN0aXZlRnJhbWV3b3JrOiA8T2JzZXJ2YWJsZTxNb2RlbHMuRG90TmV0RnJhbWV3b3JrPj48YW55PnRoaXMuX3N1YmplY3RBY3RpdmVGcmFtZXdvcmsgfTtcclxuICAgICAgICB0aGlzLl9zdWJqZWN0QWN0aXZlRnJhbWV3b3JrLm5leHQodGhpcy5fZnJhbWV3b3Jrc1swXSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfbmFtZTogc3RyaW5nO1xyXG4gICAgcHVibGljIGdldCBuYW1lKCkgeyByZXR1cm4gdGhpcy5fbmFtZTsgfVxyXG4gICAgcHVibGljIHNldCBuYW1lKHZhbHVlKSB7IHRoaXMuX25hbWUgPSB2YWx1ZTsgfVxyXG5cclxuICAgIHByaXZhdGUgX3BhdGg6IHN0cmluZztcclxuICAgIHB1YmxpYyBnZXQgcGF0aCgpIHsgcmV0dXJuIHRoaXMuX3BhdGg7IH1cclxuICAgIHB1YmxpYyBzZXQgcGF0aCh2YWx1ZSkgeyB0aGlzLl9wYXRoID0gdmFsdWU7IH1cclxuXHJcbiAgICBwcml2YXRlIF9zb2x1dGlvblBhdGg6IHN0cmluZztcclxuICAgIHB1YmxpYyBnZXQgc29sdXRpb25QYXRoKCkgeyByZXR1cm4gdGhpcy5fc29sdXRpb25QYXRoOyB9XHJcbiAgICBwdWJsaWMgc2V0IHNvbHV0aW9uUGF0aCh2YWx1ZSkgeyB0aGlzLl9zb2x1dGlvblBhdGggPSB2YWx1ZTsgfVxyXG5cclxuICAgIHByaXZhdGUgX3NvdXJjZUZpbGVzOiBzdHJpbmdbXSA9IFtdO1xyXG4gICAgcHVibGljIGdldCBzb3VyY2VGaWxlcygpIHsgcmV0dXJuIHRoaXMuX3NvdXJjZUZpbGVzOyB9XHJcbiAgICBwdWJsaWMgc2V0IHNvdXJjZUZpbGVzKHZhbHVlKSB7XHJcbiAgICAgICAgdGhpcy5fc291cmNlRmlsZXMgPSB2YWx1ZSB8fCBbXTtcclxuICAgICAgICBpZiAodGhpcy5fZmlsZXNTZXQpIHRoaXMuX2ZpbGVzU2V0ID0gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9maWxlc1NldDogU2V0PHN0cmluZz47XHJcbiAgICBwdWJsaWMgZ2V0IGZpbGVzU2V0KCkge1xyXG4gICAgICAgIGlmICghdGhpcy5fZmlsZXNTZXQpIHtcclxuICAgICAgICAgICAgdGhpcy5fZmlsZXNTZXQgPSBuZXcgU2V0PHN0cmluZz4oKTtcclxuICAgICAgICAgICAgXy5lYWNoKHRoaXMuX3NvdXJjZUZpbGVzLCBmaWxlID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2ZpbGVzU2V0LmFkZChmaWxlKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzLl9maWxlc1NldDtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9zdWJqZWN0QWN0aXZlRnJhbWV3b3JrID0gbmV3IFJlcGxheVN1YmplY3Q8TW9kZWxzLkRvdE5ldEZyYW1ld29yaz4oMSk7XHJcbiAgICBwcml2YXRlIF9hY3RpdmVGcmFtZXdvcms6IE1vZGVscy5Eb3ROZXRGcmFtZXdvcms7XHJcbiAgICBwdWJsaWMgZ2V0IGFjdGl2ZUZyYW1ld29yaygpIHtcclxuICAgICAgICBpZiAoIXRoaXMuX2FjdGl2ZUZyYW1ld29yaykge1xyXG4gICAgICAgICAgICB0aGlzLl9hY3RpdmVGcmFtZXdvcmsgPSB0aGlzLmZyYW1ld29ya3NbMF07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzLl9hY3RpdmVGcmFtZXdvcms7XHJcbiAgICB9XHJcbiAgICBwdWJsaWMgc2V0IGFjdGl2ZUZyYW1ld29yayh2YWx1ZSkge1xyXG4gICAgICAgIHRoaXMuX2FjdGl2ZUZyYW1ld29yayA9IHZhbHVlO1xyXG4gICAgICAgIGlmICghdGhpcy5fc3ViamVjdEFjdGl2ZUZyYW1ld29yay5pc1N0b3BwZWQpIHtcclxuICAgICAgICAgICAgdGhpcy5fc3ViamVjdEFjdGl2ZUZyYW1ld29yay5uZXh0KHRoaXMuX2FjdGl2ZUZyYW1ld29yayk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX2ZyYW1ld29ya3M6IE1vZGVscy5Eb3ROZXRGcmFtZXdvcmtbXSA9IFt7IEZyaWVuZGx5TmFtZTogXCJBbGxcIiwgTmFtZTogXCJhbGxcIiwgU2hvcnROYW1lOiBcImFsbFwiIH1dO1xyXG4gICAgcHVibGljIGdldCBmcmFtZXdvcmtzKCkgeyByZXR1cm4gdGhpcy5fZnJhbWV3b3JrczsgfVxyXG4gICAgcHVibGljIHNldCBmcmFtZXdvcmtzKHZhbHVlKSB7XHJcbiAgICAgICAgdGhpcy5fZnJhbWV3b3JrcyA9IFt7IEZyaWVuZGx5TmFtZTogXCJBbGxcIiwgTmFtZTogXCJhbGxcIiwgU2hvcnROYW1lOiBcImFsbFwiIH1dLmNvbmNhdCh2YWx1ZSk7XHJcbiAgICAgICAgaWYgKCF0aGlzLmFjdGl2ZUZyYW1ld29yaykge1xyXG4gICAgICAgICAgICB0aGlzLmFjdGl2ZUZyYW1ld29yayA9IHRoaXMuX2ZyYW1ld29ya3NbMF07XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX2NvbmZpZ3VyYXRpb25zOiBzdHJpbmdbXSA9IFtdO1xyXG4gICAgcHVibGljIGdldCBjb25maWd1cmF0aW9ucygpIHsgcmV0dXJuIHRoaXMuX2NvbmZpZ3VyYXRpb25zOyB9XHJcbiAgICBwdWJsaWMgc2V0IGNvbmZpZ3VyYXRpb25zKHZhbHVlKSB7IHRoaXMuX2NvbmZpZ3VyYXRpb25zID0gdmFsdWUgfHwgW107IH1cclxuXHJcbiAgICBwdWJsaWMgb2JzZXJ2ZToge1xyXG4gICAgICAgIGFjdGl2ZUZyYW1ld29yazogT2JzZXJ2YWJsZTxNb2RlbHMuRG90TmV0RnJhbWV3b3JrPjtcclxuICAgIH07XHJcblxyXG4gICAgcHVibGljIGFic3RyYWN0IGluaXQodmFsdWU6IFQpOiB2b2lkO1xyXG4gICAgcHVibGljIHVwZGF0ZShvdGhlcjogUHJvamVjdFZpZXdNb2RlbDxUPikge1xyXG4gICAgICAgIHRoaXMubmFtZSA9IG90aGVyLm5hbWU7XHJcbiAgICAgICAgdGhpcy5wYXRoID0gb3RoZXIucGF0aDtcclxuICAgICAgICB0aGlzLnNvbHV0aW9uUGF0aCA9IG90aGVyLnNvbHV0aW9uUGF0aDtcclxuICAgICAgICB0aGlzLnNvdXJjZUZpbGVzID0gb3RoZXIuc291cmNlRmlsZXM7XHJcbiAgICAgICAgdGhpcy5mcmFtZXdvcmtzID0gb3RoZXIuZnJhbWV3b3JrcztcclxuICAgICAgICB0aGlzLmFjdGl2ZUZyYW1ld29yayA9IHRoaXMuX2FjdGl2ZUZyYW1ld29yaztcclxuICAgICAgICB0aGlzLmNvbmZpZ3VyYXRpb25zID0gb3RoZXIuY29uZmlndXJhdGlvbnM7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHRvSlNPTigpIHtcclxuICAgICAgICBjb25zdCB7bmFtZSwgcGF0aCwgc29sdXRpb25QYXRoLCBzb3VyY2VGaWxlcywgZnJhbWV3b3JrcywgY29uZmlndXJhdGlvbnN9ID0gdGhpcztcclxuICAgICAgICByZXR1cm4geyBuYW1lLCBwYXRoLCBzb2x1dGlvblBhdGgsIHNvdXJjZUZpbGVzLCBmcmFtZXdvcmtzLCBjb25maWd1cmF0aW9ucyB9O1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkaXNwb3NlKCkge1xyXG4gICAgICAgIHRoaXMuX3N1YmplY3RBY3RpdmVGcmFtZXdvcmsudW5zdWJzY3JpYmUoKTtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIEVtcHR5UHJvamVjdFZpZXdNb2RlbCBleHRlbmRzIFByb2plY3RWaWV3TW9kZWw8UHJvamVjdFZpZXdNb2RlbDxhbnk+PiB7XHJcbiAgICBwdWJsaWMgaW5pdChwcm9qZWN0OiBQcm9qZWN0Vmlld01vZGVsPGFueT4pIHsgLyogKi8gfVxyXG59XHJcblxyXG5jbGFzcyBQcm94eVByb2plY3RWaWV3TW9kZWwgZXh0ZW5kcyBQcm9qZWN0Vmlld01vZGVsPFByb2plY3RWaWV3TW9kZWw8YW55Pj4ge1xyXG4gICAgcHVibGljIGluaXQocHJvamVjdDogUHJvamVjdFZpZXdNb2RlbDxhbnk+KSB7XHJcbiAgICAgICAgdGhpcy51cGRhdGUocHJvamVjdCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmNsYXNzIE1zQnVpbGRQcm9qZWN0Vmlld01vZGVsIGV4dGVuZHMgUHJvamVjdFZpZXdNb2RlbDxNb2RlbHMuTVNCdWlsZFByb2plY3Q+IHtcclxuICAgIHB1YmxpYyBpbml0KHByb2plY3Q6IE1vZGVscy5NU0J1aWxkUHJvamVjdCkge1xyXG4gICAgICAgIGNvbnN0IGZyYW1ld29ya3MgPSBbe1xyXG4gICAgICAgICAgICBGcmllbmRseU5hbWU6IHByb2plY3QuVGFyZ2V0RnJhbWV3b3JrLFxyXG4gICAgICAgICAgICBOYW1lOiBwcm9qZWN0LlRhcmdldEZyYW1ld29yayxcclxuICAgICAgICAgICAgU2hvcnROYW1lOiBwcm9qZWN0LlRhcmdldEZyYW1ld29ya1xyXG4gICAgICAgIH1dO1xyXG5cclxuICAgICAgICB0aGlzLm5hbWUgPSBwcm9qZWN0LkFzc2VtYmx5TmFtZTtcclxuICAgICAgICB0aGlzLnBhdGggPSBwcm9qZWN0LlBhdGg7XHJcbiAgICAgICAgdGhpcy5mcmFtZXdvcmtzID0gZnJhbWV3b3JrcztcclxuICAgICAgICB0aGlzLnNvdXJjZUZpbGVzID0gcHJvamVjdC5Tb3VyY2VGaWxlcztcclxuICAgIH1cclxufVxyXG5cclxuY2xhc3MgRG90TmV0UHJvamVjdFZpZXdNb2RlbCBleHRlbmRzIFByb2plY3RWaWV3TW9kZWw8TW9kZWxzLkRvdE5ldFByb2plY3RJbmZvcm1hdGlvbj4ge1xyXG4gICAgcHVibGljIGluaXQocHJvamVjdDogTW9kZWxzLkRvdE5ldFByb2plY3RJbmZvcm1hdGlvbikge1xyXG4gICAgICAgIHRoaXMubmFtZSA9IHByb2plY3QuTmFtZTtcclxuICAgICAgICB0aGlzLnBhdGggPSBwcm9qZWN0LlBhdGg7XHJcbiAgICAgICAgdGhpcy5mcmFtZXdvcmtzID0gcHJvamVjdC5GcmFtZXdvcmtzIHx8IFtdO1xyXG4gICAgICAgIHRoaXMuY29uZmlndXJhdGlvbnMgPSAocHJvamVjdC5Db25maWd1cmF0aW9ucyB8fCBbXSkubWFwKHggPT4geC5OYW1lKTtcclxuICAgICAgICB0aGlzLnNvdXJjZUZpbGVzID0gcHJvamVjdC5Tb3VyY2VGaWxlcyB8fCBbXTtcclxuICAgIH1cclxufVxyXG5cclxuY2xhc3MgU2NyaXB0Q3NQcm9qZWN0Vmlld01vZGVsIGV4dGVuZHMgUHJvamVjdFZpZXdNb2RlbDxTY3JpcHRDcy5TY3JpcHRDc0NvbnRleHRNb2RlbD4ge1xyXG4gICAgcHVibGljIGluaXQocHJvamVjdDogU2NyaXB0Q3MuU2NyaXB0Q3NDb250ZXh0TW9kZWwpIHtcclxuICAgICAgICB0aGlzLm5hbWUgPSBcIlNjcmlwdENzXCI7XHJcbiAgICAgICAgdGhpcy5wYXRoID0gcHJvamVjdC5Sb290UGF0aDtcclxuICAgICAgICB0aGlzLnNvdXJjZUZpbGVzID0gcHJvamVjdC5Dc3hGaWxlc0JlaW5nUHJvY2Vzc2VkO1xyXG4gICAgfVxyXG59XHJcbiIsImltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcbmltcG9ydCB7IFJlcGxheVN1YmplY3QgfSBmcm9tIFwicnhqc1wiO1xuY29uc3QgcHJvamVjdEZhY3RvcmllcyA9IHtcbiAgICBNc0J1aWxkUHJvamVjdDogTXNCdWlsZFByb2plY3RWaWV3TW9kZWwsXG4gICAgRG90TmV0UHJvamVjdDogRG90TmV0UHJvamVjdFZpZXdNb2RlbFxufTtcbmNvbnN0IHN1cHBvcnRlZFByb2plY3RUeXBlcyA9IF8ua2V5cyhwcm9qZWN0RmFjdG9yaWVzKTtcbmV4cG9ydCBmdW5jdGlvbiBwcm9qZWN0Vmlld01vZGVsRmFjdG9yeShvbW5pc2hhcnBQcm9qZWN0LCBzb2x1dGlvblBhdGgpIHtcbiAgICBjb25zdCBwcm9qZWN0VHlwZXMgPSBfLmZpbHRlcihzdXBwb3J0ZWRQcm9qZWN0VHlwZXMsIHR5cGUgPT4gXy5oYXMob21uaXNoYXJwUHJvamVjdCwgdHlwZSkpO1xuICAgIGNvbnN0IG1pc3NpbmcgPSBfLmRpZmZlcmVuY2UoXy5rZXlzKG9tbmlzaGFycFByb2plY3QpLCBzdXBwb3J0ZWRQcm9qZWN0VHlwZXMpO1xuICAgIGlmIChtaXNzaW5nLmxlbmd0aCkge1xuICAgICAgICBjb25zb2xlLmxvZyhgTWlzc2luZyBmYWN0b3J5IGZvciBwcm9qZWN0IHR5cGUgJHttaXNzaW5nfWApO1xuICAgIH1cbiAgICBjb25zdCByZXN1bHRzID0gW107XG4gICAgbGV0IHNraXBEbnggPSBmYWxzZTtcbiAgICBpZiAocHJvamVjdFR5cGVzW1wiRG90TmV0UHJvamVjdFwiXSAmJiBwcm9qZWN0VHlwZXNbXCJEbnhQcm9qZWN0XCJdKVxuICAgICAgICBza2lwRG54ID0gdHJ1ZTtcbiAgICBfLmVhY2gocHJvamVjdFR5cGVzLCBwcm9qZWN0VHlwZSA9PiB7XG4gICAgICAgIGlmIChza2lwRG54ICYmIF8uc3RhcnRzV2l0aChwcm9qZWN0VHlwZSwgXCJEbnhcIikpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGlmIChwcm9qZWN0VHlwZSAmJiBwcm9qZWN0RmFjdG9yaWVzW3Byb2plY3RUeXBlXSkge1xuICAgICAgICAgICAgcmVzdWx0cy5wdXNoKG5ldyBwcm9qZWN0RmFjdG9yaWVzW3Byb2plY3RUeXBlXShvbW5pc2hhcnBQcm9qZWN0W3Byb2plY3RUeXBlXSwgc29sdXRpb25QYXRoKSk7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gcmVzdWx0cztcbn1cbmNvbnN0IHdvcmtzcGFjZUZhY3RvcmllcyA9IHtcbiAgICBNc0J1aWxkOiAod29ya3NwYWNlLCBzb2x1dGlvblBhdGgpID0+IHtcbiAgICAgICAgcmV0dXJuIF8ubWFwKHdvcmtzcGFjZS5Qcm9qZWN0cywgcHJvamVjdEluZm9ybWF0aW9uID0+IG5ldyBNc0J1aWxkUHJvamVjdFZpZXdNb2RlbChwcm9qZWN0SW5mb3JtYXRpb24sIHNvbHV0aW9uUGF0aCkpO1xuICAgIH0sXG4gICAgRG90TmV0OiAod29ya3NwYWNlLCBzb2x1dGlvblBhdGgpID0+IHtcbiAgICAgICAgcmV0dXJuIF8ubWFwKHdvcmtzcGFjZS5Qcm9qZWN0cywgcHJvamVjdEluZm9ybWF0aW9uID0+IG5ldyBEb3ROZXRQcm9qZWN0Vmlld01vZGVsKHByb2plY3RJbmZvcm1hdGlvbiwgc29sdXRpb25QYXRoKSk7XG4gICAgfSxcbiAgICBTY3JpcHRDczogKHdvcmtzcGFjZSwgc29sdXRpb25QYXRoKSA9PiB7XG4gICAgICAgIHJldHVybiBbXTtcbiAgICB9LFxufTtcbmV4cG9ydCBmdW5jdGlvbiB3b3Jrc3BhY2VWaWV3TW9kZWxGYWN0b3J5KG9tbmlzaGFycFdvcmtzcGFjZSwgc29sdXRpb25QYXRoKSB7XG4gICAgY29uc3QgcHJvamVjdHMgPSBbXTtcbiAgICBsZXQgc2tpcERueCA9IGZhbHNlO1xuICAgIGlmIChvbW5pc2hhcnBXb3Jrc3BhY2VbXCJEb3ROZXRcIl0gJiYgb21uaXNoYXJwV29ya3NwYWNlW1wiRG54XCJdKVxuICAgICAgICBza2lwRG54ID0gdHJ1ZTtcbiAgICBfLmZvckluKG9tbmlzaGFycFdvcmtzcGFjZSwgKGl0ZW0sIGtleSkgPT4ge1xuICAgICAgICBjb25zdCBmYWN0b3J5ID0gd29ya3NwYWNlRmFjdG9yaWVzW2tleV07XG4gICAgICAgIGlmIChza2lwRG54ICYmIF8uc3RhcnRzV2l0aChrZXksIFwiRG54XCIpKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBpZiAoZmFjdG9yeSkge1xuICAgICAgICAgICAgcHJvamVjdHMucHVzaCguLi5mYWN0b3J5KGl0ZW0sIHNvbHV0aW9uUGF0aCkpO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHByb2plY3RzO1xufVxuZXhwb3J0IGNsYXNzIFByb2plY3RWaWV3TW9kZWwge1xuICAgIGNvbnN0cnVjdG9yKHByb2plY3QsIHNvbHV0aW9uUGF0aCkge1xuICAgICAgICB0aGlzLl9zb3VyY2VGaWxlcyA9IFtdO1xuICAgICAgICB0aGlzLl9zdWJqZWN0QWN0aXZlRnJhbWV3b3JrID0gbmV3IFJlcGxheVN1YmplY3QoMSk7XG4gICAgICAgIHRoaXMuX2ZyYW1ld29ya3MgPSBbeyBGcmllbmRseU5hbWU6IFwiQWxsXCIsIE5hbWU6IFwiYWxsXCIsIFNob3J0TmFtZTogXCJhbGxcIiB9XTtcbiAgICAgICAgdGhpcy5fY29uZmlndXJhdGlvbnMgPSBbXTtcbiAgICAgICAgdGhpcy5zb2x1dGlvblBhdGggPSBzb2x1dGlvblBhdGg7XG4gICAgICAgIHRoaXMuaW5pdChwcm9qZWN0KTtcbiAgICAgICAgdGhpcy5vYnNlcnZlID0geyBhY3RpdmVGcmFtZXdvcms6IHRoaXMuX3N1YmplY3RBY3RpdmVGcmFtZXdvcmsgfTtcbiAgICAgICAgdGhpcy5fc3ViamVjdEFjdGl2ZUZyYW1ld29yay5uZXh0KHRoaXMuX2ZyYW1ld29ya3NbMF0pO1xuICAgIH1cbiAgICBnZXQgbmFtZSgpIHsgcmV0dXJuIHRoaXMuX25hbWU7IH1cbiAgICBzZXQgbmFtZSh2YWx1ZSkgeyB0aGlzLl9uYW1lID0gdmFsdWU7IH1cbiAgICBnZXQgcGF0aCgpIHsgcmV0dXJuIHRoaXMuX3BhdGg7IH1cbiAgICBzZXQgcGF0aCh2YWx1ZSkgeyB0aGlzLl9wYXRoID0gdmFsdWU7IH1cbiAgICBnZXQgc29sdXRpb25QYXRoKCkgeyByZXR1cm4gdGhpcy5fc29sdXRpb25QYXRoOyB9XG4gICAgc2V0IHNvbHV0aW9uUGF0aCh2YWx1ZSkgeyB0aGlzLl9zb2x1dGlvblBhdGggPSB2YWx1ZTsgfVxuICAgIGdldCBzb3VyY2VGaWxlcygpIHsgcmV0dXJuIHRoaXMuX3NvdXJjZUZpbGVzOyB9XG4gICAgc2V0IHNvdXJjZUZpbGVzKHZhbHVlKSB7XG4gICAgICAgIHRoaXMuX3NvdXJjZUZpbGVzID0gdmFsdWUgfHwgW107XG4gICAgICAgIGlmICh0aGlzLl9maWxlc1NldClcbiAgICAgICAgICAgIHRoaXMuX2ZpbGVzU2V0ID0gbnVsbDtcbiAgICB9XG4gICAgZ2V0IGZpbGVzU2V0KCkge1xuICAgICAgICBpZiAoIXRoaXMuX2ZpbGVzU2V0KSB7XG4gICAgICAgICAgICB0aGlzLl9maWxlc1NldCA9IG5ldyBTZXQoKTtcbiAgICAgICAgICAgIF8uZWFjaCh0aGlzLl9zb3VyY2VGaWxlcywgZmlsZSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5fZmlsZXNTZXQuYWRkKGZpbGUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuX2ZpbGVzU2V0O1xuICAgIH1cbiAgICBnZXQgYWN0aXZlRnJhbWV3b3JrKCkge1xuICAgICAgICBpZiAoIXRoaXMuX2FjdGl2ZUZyYW1ld29yaykge1xuICAgICAgICAgICAgdGhpcy5fYWN0aXZlRnJhbWV3b3JrID0gdGhpcy5mcmFtZXdvcmtzWzBdO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLl9hY3RpdmVGcmFtZXdvcms7XG4gICAgfVxuICAgIHNldCBhY3RpdmVGcmFtZXdvcmsodmFsdWUpIHtcbiAgICAgICAgdGhpcy5fYWN0aXZlRnJhbWV3b3JrID0gdmFsdWU7XG4gICAgICAgIGlmICghdGhpcy5fc3ViamVjdEFjdGl2ZUZyYW1ld29yay5pc1N0b3BwZWQpIHtcbiAgICAgICAgICAgIHRoaXMuX3N1YmplY3RBY3RpdmVGcmFtZXdvcmsubmV4dCh0aGlzLl9hY3RpdmVGcmFtZXdvcmspO1xuICAgICAgICB9XG4gICAgfVxuICAgIGdldCBmcmFtZXdvcmtzKCkgeyByZXR1cm4gdGhpcy5fZnJhbWV3b3JrczsgfVxuICAgIHNldCBmcmFtZXdvcmtzKHZhbHVlKSB7XG4gICAgICAgIHRoaXMuX2ZyYW1ld29ya3MgPSBbeyBGcmllbmRseU5hbWU6IFwiQWxsXCIsIE5hbWU6IFwiYWxsXCIsIFNob3J0TmFtZTogXCJhbGxcIiB9XS5jb25jYXQodmFsdWUpO1xuICAgICAgICBpZiAoIXRoaXMuYWN0aXZlRnJhbWV3b3JrKSB7XG4gICAgICAgICAgICB0aGlzLmFjdGl2ZUZyYW1ld29yayA9IHRoaXMuX2ZyYW1ld29ya3NbMF07XG4gICAgICAgIH1cbiAgICB9XG4gICAgZ2V0IGNvbmZpZ3VyYXRpb25zKCkgeyByZXR1cm4gdGhpcy5fY29uZmlndXJhdGlvbnM7IH1cbiAgICBzZXQgY29uZmlndXJhdGlvbnModmFsdWUpIHsgdGhpcy5fY29uZmlndXJhdGlvbnMgPSB2YWx1ZSB8fCBbXTsgfVxuICAgIHVwZGF0ZShvdGhlcikge1xuICAgICAgICB0aGlzLm5hbWUgPSBvdGhlci5uYW1lO1xuICAgICAgICB0aGlzLnBhdGggPSBvdGhlci5wYXRoO1xuICAgICAgICB0aGlzLnNvbHV0aW9uUGF0aCA9IG90aGVyLnNvbHV0aW9uUGF0aDtcbiAgICAgICAgdGhpcy5zb3VyY2VGaWxlcyA9IG90aGVyLnNvdXJjZUZpbGVzO1xuICAgICAgICB0aGlzLmZyYW1ld29ya3MgPSBvdGhlci5mcmFtZXdvcmtzO1xuICAgICAgICB0aGlzLmFjdGl2ZUZyYW1ld29yayA9IHRoaXMuX2FjdGl2ZUZyYW1ld29yaztcbiAgICAgICAgdGhpcy5jb25maWd1cmF0aW9ucyA9IG90aGVyLmNvbmZpZ3VyYXRpb25zO1xuICAgIH1cbiAgICB0b0pTT04oKSB7XG4gICAgICAgIGNvbnN0IHsgbmFtZSwgcGF0aCwgc29sdXRpb25QYXRoLCBzb3VyY2VGaWxlcywgZnJhbWV3b3JrcywgY29uZmlndXJhdGlvbnMgfSA9IHRoaXM7XG4gICAgICAgIHJldHVybiB7IG5hbWUsIHBhdGgsIHNvbHV0aW9uUGF0aCwgc291cmNlRmlsZXMsIGZyYW1ld29ya3MsIGNvbmZpZ3VyYXRpb25zIH07XG4gICAgfVxuICAgIGRpc3Bvc2UoKSB7XG4gICAgICAgIHRoaXMuX3N1YmplY3RBY3RpdmVGcmFtZXdvcmsudW5zdWJzY3JpYmUoKTtcbiAgICB9XG59XG5leHBvcnQgY2xhc3MgRW1wdHlQcm9qZWN0Vmlld01vZGVsIGV4dGVuZHMgUHJvamVjdFZpZXdNb2RlbCB7XG4gICAgaW5pdChwcm9qZWN0KSB7IH1cbn1cbmNsYXNzIFByb3h5UHJvamVjdFZpZXdNb2RlbCBleHRlbmRzIFByb2plY3RWaWV3TW9kZWwge1xuICAgIGluaXQocHJvamVjdCkge1xuICAgICAgICB0aGlzLnVwZGF0ZShwcm9qZWN0KTtcbiAgICB9XG59XG5jbGFzcyBNc0J1aWxkUHJvamVjdFZpZXdNb2RlbCBleHRlbmRzIFByb2plY3RWaWV3TW9kZWwge1xuICAgIGluaXQocHJvamVjdCkge1xuICAgICAgICBjb25zdCBmcmFtZXdvcmtzID0gW3tcbiAgICAgICAgICAgICAgICBGcmllbmRseU5hbWU6IHByb2plY3QuVGFyZ2V0RnJhbWV3b3JrLFxuICAgICAgICAgICAgICAgIE5hbWU6IHByb2plY3QuVGFyZ2V0RnJhbWV3b3JrLFxuICAgICAgICAgICAgICAgIFNob3J0TmFtZTogcHJvamVjdC5UYXJnZXRGcmFtZXdvcmtcbiAgICAgICAgICAgIH1dO1xuICAgICAgICB0aGlzLm5hbWUgPSBwcm9qZWN0LkFzc2VtYmx5TmFtZTtcbiAgICAgICAgdGhpcy5wYXRoID0gcHJvamVjdC5QYXRoO1xuICAgICAgICB0aGlzLmZyYW1ld29ya3MgPSBmcmFtZXdvcmtzO1xuICAgICAgICB0aGlzLnNvdXJjZUZpbGVzID0gcHJvamVjdC5Tb3VyY2VGaWxlcztcbiAgICB9XG59XG5jbGFzcyBEb3ROZXRQcm9qZWN0Vmlld01vZGVsIGV4dGVuZHMgUHJvamVjdFZpZXdNb2RlbCB7XG4gICAgaW5pdChwcm9qZWN0KSB7XG4gICAgICAgIHRoaXMubmFtZSA9IHByb2plY3QuTmFtZTtcbiAgICAgICAgdGhpcy5wYXRoID0gcHJvamVjdC5QYXRoO1xuICAgICAgICB0aGlzLmZyYW1ld29ya3MgPSBwcm9qZWN0LkZyYW1ld29ya3MgfHwgW107XG4gICAgICAgIHRoaXMuY29uZmlndXJhdGlvbnMgPSAocHJvamVjdC5Db25maWd1cmF0aW9ucyB8fCBbXSkubWFwKHggPT4geC5OYW1lKTtcbiAgICAgICAgdGhpcy5zb3VyY2VGaWxlcyA9IHByb2plY3QuU291cmNlRmlsZXMgfHwgW107XG4gICAgfVxufVxuY2xhc3MgU2NyaXB0Q3NQcm9qZWN0Vmlld01vZGVsIGV4dGVuZHMgUHJvamVjdFZpZXdNb2RlbCB7XG4gICAgaW5pdChwcm9qZWN0KSB7XG4gICAgICAgIHRoaXMubmFtZSA9IFwiU2NyaXB0Q3NcIjtcbiAgICAgICAgdGhpcy5wYXRoID0gcHJvamVjdC5Sb290UGF0aDtcbiAgICAgICAgdGhpcy5zb3VyY2VGaWxlcyA9IHByb2plY3QuQ3N4RmlsZXNCZWluZ1Byb2Nlc3NlZDtcbiAgICB9XG59XG4iXX0=
