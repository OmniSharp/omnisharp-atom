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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9zZXJ2ZXIvcHJvamVjdC12aWV3LW1vZGVsLnRzIiwibGliL3NlcnZlci9wcm9qZWN0LXZpZXctbW9kZWwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O1FBV0E7UUFrQ0E7O0FDN0NBOzs7O0FBQ0E7Ozs7Ozs7Ozs7OztBRElBLElBQU0sbUJBQTJGO0FBQzdGLG9CQUFxQix1QkFBckI7QUFDQSxtQkFBb0Isc0JBQXBCO0NBRkU7QUFLTixJQUFNLHdCQUF3QixpQkFBRSxJQUFGLENBQU8sZ0JBQVAsQ0FBeEI7QUFDTixTQUFBLHVCQUFBLENBQXdDLGdCQUF4QyxFQUE2RixZQUE3RixFQUFpSDtBQUM3RyxRQUFNLGVBQWUsaUJBQUUsTUFBRixDQUFTLHFCQUFULEVBQWdDO2VBQVEsaUJBQUUsR0FBRixDQUFNLGdCQUFOLEVBQXdCLElBQXhCO0tBQVIsQ0FBL0MsQ0FEdUc7QUFFN0csUUFBTSxVQUFVLGlCQUFFLFVBQUYsQ0FBYSxpQkFBRSxJQUFGLENBQU8sZ0JBQVAsQ0FBYixFQUF1QyxxQkFBdkMsQ0FBVixDQUZ1RztBQUc3RyxRQUFJLFFBQVEsTUFBUixFQUFnQjtBQUNoQixnQkFBUSxHQUFSLHVDQUFnRCxPQUFoRCxFQURnQjtLQUFwQjtBQUlBLFFBQU0sVUFBbUMsRUFBbkMsQ0FQdUc7QUFRN0csUUFBSSxVQUFVLEtBQVYsQ0FSeUc7QUFTN0csUUFBSSxhQUFhLGVBQWIsS0FBaUMsYUFBYSxZQUFiLENBQWpDLEVBQTZELFVBQVUsSUFBVixDQUFqRTtBQUNBLHFCQUFFLElBQUYsQ0FBTyxZQUFQLEVBQXFCLHVCQUFXO0FBQzVCLFlBQUksV0FBVyxpQkFBRSxVQUFGLENBQWEsV0FBYixFQUEwQixLQUExQixDQUFYLEVBQTZDLE9BQWpEO0FBQ0EsWUFBSSxlQUFlLGlCQUFpQixXQUFqQixDQUFmLEVBQThDO0FBQzlDLG9CQUFRLElBQVIsQ0FBYSxJQUFJLGlCQUFpQixXQUFqQixDQUFKLENBQWtDLGlCQUFpQixXQUFqQixDQUFs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bUI7Ozs7O0VBRFI7O0lBZXRDOzs7Ozs7Ozs7Ozs2QkFDZ0IsU0FBd0M7QUFDaEQsaUJBQUssSUFBTCxHQUFZLFFBQVEsSUFBUixDQURvQztBQUVoRCxpQkFBSyxJQUFMLEdBQVksUUFBUSxJQUFSLENBRm9DO0FBR2hELGlCQUFLLFVBQUwsR0FBa0IsUUFBUSxVQUFSLElBQXNCLEVBQXRCLENBSDhCO0FBSWhELGlCQUFLLGNBQUwsR0FBc0IsQ0FBQyxRQUFRLGNBQVIsSUFBMEIsRUFBMUIsQ0FBRCxDQUErQixHQUEvQixDQUFtQzt1QkFBSyxFQUFFLElBQUY7YUFBTCxDQUF6RCxDQUpnRDtBQUtoRCxpQkFBSyxXQUFMLEdBQW1CLFFBQVEsV0FBUixJQUF1QixFQUF2QixDQUw2Qjs7Ozs7RUFEbkI7O0lBVXJDOzs7Ozs7Ozs7Ozs2QkFDZ0IsU0FBc0M7QUFDOUMsaUJBQUssSUFBTCxHQUFZLFVBQVosQ0FEOEM7QUFFOUMsaUJBQUssSUFBTCxHQUFZLFFBQVEsUUFBUixDQUZrQztBQUc5QyxpQkFBSyxXQUFMLEdBQW1CLFFBQVEsc0JBQVIsQ0FIMkI7Ozs7O0VBRGYiLCJmaWxlIjoibGliL3NlcnZlci9wcm9qZWN0LXZpZXctbW9kZWwuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge0lQcm9qZWN0Vmlld01vZGVsfSBmcm9tIFwiLi4vb21uaXNoYXJwXCI7XHJcbmltcG9ydCB7TW9kZWxzLCBTY3JpcHRDc30gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcclxuaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xyXG5pbXBvcnQge09ic2VydmFibGUsIFJlcGxheVN1YmplY3R9IGZyb20gXCJyeGpzXCI7XHJcblxyXG5jb25zdCBwcm9qZWN0RmFjdG9yaWVzOiB7IFtrZXk6IHN0cmluZ106IHsgbmV3IChwcm9qZWN0OiBhbnksIHNvbHV0aW9uUGF0aDogc3RyaW5nKTogYW55OyB9OyB9ID0ge1xyXG4gICAgTXNCdWlsZFByb2plY3Q6IDxhbnk+TXNCdWlsZFByb2plY3RWaWV3TW9kZWwsXHJcbiAgICBEb3ROZXRQcm9qZWN0OiA8YW55PkRvdE5ldFByb2plY3RWaWV3TW9kZWxcclxufTtcclxuXHJcbmNvbnN0IHN1cHBvcnRlZFByb2plY3RUeXBlcyA9IF8ua2V5cyhwcm9qZWN0RmFjdG9yaWVzKTtcclxuZXhwb3J0IGZ1bmN0aW9uIHByb2plY3RWaWV3TW9kZWxGYWN0b3J5KG9tbmlzaGFycFByb2plY3Q6IE1vZGVscy5Qcm9qZWN0SW5mb3JtYXRpb25SZXNwb25zZSwgc29sdXRpb25QYXRoOiBzdHJpbmcpIHtcclxuICAgIGNvbnN0IHByb2plY3RUeXBlcyA9IF8uZmlsdGVyKHN1cHBvcnRlZFByb2plY3RUeXBlcywgdHlwZSA9PiBfLmhhcyhvbW5pc2hhcnBQcm9qZWN0LCB0eXBlKSk7XHJcbiAgICBjb25zdCBtaXNzaW5nID0gXy5kaWZmZXJlbmNlKF8ua2V5cyhvbW5pc2hhcnBQcm9qZWN0KSwgc3VwcG9ydGVkUHJvamVjdFR5cGVzKTtcclxuICAgIGlmIChtaXNzaW5nLmxlbmd0aCkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGBNaXNzaW5nIGZhY3RvcnkgZm9yIHByb2plY3QgdHlwZSAke21pc3Npbmd9YCk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgcmVzdWx0czogUHJvamVjdFZpZXdNb2RlbDxhbnk+W10gPSBbXTtcclxuICAgIGxldCBza2lwRG54ID0gZmFsc2U7XHJcbiAgICBpZiAocHJvamVjdFR5cGVzW1wiRG90TmV0UHJvamVjdFwiXSAmJiBwcm9qZWN0VHlwZXNbXCJEbnhQcm9qZWN0XCJdKSBza2lwRG54ID0gdHJ1ZTtcclxuICAgIF8uZWFjaChwcm9qZWN0VHlwZXMsIHByb2plY3RUeXBlID0+IHtcclxuICAgICAgICBpZiAoc2tpcERueCAmJiBfLnN0YXJ0c1dpdGgocHJvamVjdFR5cGUsIFwiRG54XCIpKSByZXR1cm47XHJcbiAgICAgICAgaWYgKHByb2plY3RUeXBlICYmIHByb2plY3RGYWN0b3JpZXNbcHJvamVjdFR5cGVdKSB7XHJcbiAgICAgICAgICAgIHJlc3VsdHMucHVzaChuZXcgcHJvamVjdEZhY3Rvcmllc1twcm9qZWN0VHlwZV0ob21uaXNoYXJwUHJvamVjdFtwcm9qZWN0VHlwZV0sIHNvbHV0aW9uUGF0aCkpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIHJlc3VsdHM7XHJcbn1cclxuXHJcbmNvbnN0IHdvcmtzcGFjZUZhY3RvcmllczogeyBba2V5OiBzdHJpbmddOiAod29ya3NwYWNlOiBhbnksIHNvbHV0aW9uUGF0aDogc3RyaW5nKSA9PiBQcm9qZWN0Vmlld01vZGVsPGFueT5bXSB9ID0ge1xyXG4gICAgTXNCdWlsZDogKHdvcmtzcGFjZTogTW9kZWxzLk1zQnVpbGRXb3Jrc3BhY2VJbmZvcm1hdGlvbiwgc29sdXRpb25QYXRoOiBzdHJpbmcpID0+IHtcclxuICAgICAgICByZXR1cm4gXy5tYXAod29ya3NwYWNlLlByb2plY3RzLCBwcm9qZWN0SW5mb3JtYXRpb24gPT4gbmV3IE1zQnVpbGRQcm9qZWN0Vmlld01vZGVsKHByb2plY3RJbmZvcm1hdGlvbiwgc29sdXRpb25QYXRoKSk7XHJcbiAgICB9LFxyXG4gICAgRG90TmV0OiAod29ya3NwYWNlOiBNb2RlbHMuRG90TmV0V29ya3NwYWNlSW5mb3JtYXRpb24sIHNvbHV0aW9uUGF0aDogc3RyaW5nKSA9PiB7XHJcbiAgICAgICAgcmV0dXJuIF8ubWFwKHdvcmtzcGFjZS5Qcm9qZWN0cywgcHJvamVjdEluZm9ybWF0aW9uID0+IG5ldyBEb3ROZXRQcm9qZWN0Vmlld01vZGVsKHByb2plY3RJbmZvcm1hdGlvbiwgc29sdXRpb25QYXRoKSk7XHJcbiAgICB9LFxyXG4gICAgU2NyaXB0Q3M6ICh3b3Jrc3BhY2U6IFNjcmlwdENzLlNjcmlwdENzQ29udGV4dE1vZGVsLCBzb2x1dGlvblBhdGg6IHN0cmluZykgPT4ge1xyXG4gICAgICAgIC8qaWYgKHdvcmtzcGFjZS5Dc3hGaWxlcy5sZW5ndGggPiAwKVxyXG4gICAgICAgICAgICByZXR1cm4gW25ldyBTY3JpcHRDc1Byb2plY3RWaWV3TW9kZWwod29ya3NwYWNlLCBzb2x1dGlvblBhdGgpXTtcclxuICAgICAgICAqL1xyXG4gICAgICAgIHJldHVybiBbXTtcclxuICAgIH0sXHJcbn07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gd29ya3NwYWNlVmlld01vZGVsRmFjdG9yeShvbW5pc2hhcnBXb3Jrc3BhY2U6IE1vZGVscy5Xb3Jrc3BhY2VJbmZvcm1hdGlvblJlc3BvbnNlLCBzb2x1dGlvblBhdGg6IHN0cmluZykge1xyXG4gICAgY29uc3QgcHJvamVjdHM6IGFueVtdID0gW107XHJcbiAgICBsZXQgc2tpcERueCA9IGZhbHNlO1xyXG4gICAgaWYgKG9tbmlzaGFycFdvcmtzcGFjZVtcIkRvdE5ldFwiXSAmJiBvbW5pc2hhcnBXb3Jrc3BhY2VbXCJEbnhcIl0pIHNraXBEbnggPSB0cnVlO1xyXG4gICAgXy5mb3JJbihvbW5pc2hhcnBXb3Jrc3BhY2UsIChpdGVtLCBrZXkpID0+IHtcclxuICAgICAgICBjb25zdCBmYWN0b3J5ID0gd29ya3NwYWNlRmFjdG9yaWVzW2tleV07XHJcbiAgICAgICAgaWYgKHNraXBEbnggJiYgXy5zdGFydHNXaXRoKGtleSwgXCJEbnhcIikpIHJldHVybjtcclxuICAgICAgICBpZiAoZmFjdG9yeSkge1xyXG4gICAgICAgICAgICBwcm9qZWN0cy5wdXNoKC4uLmZhY3RvcnkoaXRlbSwgc29sdXRpb25QYXRoKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgcmV0dXJuIHByb2plY3RzO1xyXG59XHJcblxyXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgUHJvamVjdFZpZXdNb2RlbDxUPiBpbXBsZW1lbnRzIElQcm9qZWN0Vmlld01vZGVsIHtcclxuICAgIGNvbnN0cnVjdG9yKHByb2plY3Q6IFQsIHNvbHV0aW9uUGF0aDogc3RyaW5nKSB7XHJcbiAgICAgICAgdGhpcy5zb2x1dGlvblBhdGggPSBzb2x1dGlvblBhdGg7XHJcbiAgICAgICAgdGhpcy5pbml0KHByb2plY3QpO1xyXG4gICAgICAgIHRoaXMub2JzZXJ2ZSA9IHsgYWN0aXZlRnJhbWV3b3JrOiA8T2JzZXJ2YWJsZTxNb2RlbHMuRG90TmV0RnJhbWV3b3JrPj48YW55PnRoaXMuX3N1YmplY3RBY3RpdmVGcmFtZXdvcmsgfTtcclxuICAgICAgICB0aGlzLl9zdWJqZWN0QWN0aXZlRnJhbWV3b3JrLm5leHQodGhpcy5fZnJhbWV3b3Jrc1swXSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfbmFtZTogc3RyaW5nO1xyXG4gICAgcHVibGljIGdldCBuYW1lKCkgeyByZXR1cm4gdGhpcy5fbmFtZTsgfVxyXG4gICAgcHVibGljIHNldCBuYW1lKHZhbHVlKSB7IHRoaXMuX25hbWUgPSB2YWx1ZTsgfVxyXG5cclxuICAgIHByaXZhdGUgX3BhdGg6IHN0cmluZztcclxuICAgIHB1YmxpYyBnZXQgcGF0aCgpIHsgcmV0dXJuIHRoaXMuX3BhdGg7IH1cclxuICAgIHB1YmxpYyBzZXQgcGF0aCh2YWx1ZSkgeyB0aGlzLl9wYXRoID0gdmFsdWU7IH1cclxuXHJcbiAgICBwcml2YXRlIF9zb2x1dGlvblBhdGg6IHN0cmluZztcclxuICAgIHB1YmxpYyBnZXQgc29sdXRpb25QYXRoKCkgeyByZXR1cm4gdGhpcy5fc29sdXRpb25QYXRoOyB9XHJcbiAgICBwdWJsaWMgc2V0IHNvbHV0aW9uUGF0aCh2YWx1ZSkgeyB0aGlzLl9zb2x1dGlvblBhdGggPSB2YWx1ZTsgfVxyXG5cclxuICAgIHByaXZhdGUgX3NvdXJjZUZpbGVzOiBzdHJpbmdbXSA9IFtdO1xyXG4gICAgcHVibGljIGdldCBzb3VyY2VGaWxlcygpIHsgcmV0dXJuIHRoaXMuX3NvdXJjZUZpbGVzOyB9XHJcbiAgICBwdWJsaWMgc2V0IHNvdXJjZUZpbGVzKHZhbHVlKSB7XHJcbiAgICAgICAgdGhpcy5fc291cmNlRmlsZXMgPSB2YWx1ZSB8fCBbXTtcclxuICAgICAgICBpZiAodGhpcy5fZmlsZXNTZXQpIHRoaXMuX2ZpbGVzU2V0ID0gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9maWxlc1NldDogU2V0PHN0cmluZz47XHJcbiAgICBwdWJsaWMgZ2V0IGZpbGVzU2V0KCkge1xyXG4gICAgICAgIGlmICghdGhpcy5fZmlsZXNTZXQpIHtcclxuICAgICAgICAgICAgdGhpcy5fZmlsZXNTZXQgPSBuZXcgU2V0PHN0cmluZz4oKTtcclxuICAgICAgICAgICAgXy5lYWNoKHRoaXMuX3NvdXJjZUZpbGVzLCBmaWxlID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2ZpbGVzU2V0LmFkZChmaWxlKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzLl9maWxlc1NldDtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9zdWJqZWN0QWN0aXZlRnJhbWV3b3JrID0gbmV3IFJlcGxheVN1YmplY3Q8TW9kZWxzLkRvdE5ldEZyYW1ld29yaz4oMSk7XHJcbiAgICBwcml2YXRlIF9hY3RpdmVGcmFtZXdvcms6IE1vZGVscy5Eb3ROZXRGcmFtZXdvcms7XHJcbiAgICBwdWJsaWMgZ2V0IGFjdGl2ZUZyYW1ld29yaygpIHtcclxuICAgICAgICBpZiAoIXRoaXMuX2FjdGl2ZUZyYW1ld29yaykge1xyXG4gICAgICAgICAgICB0aGlzLl9hY3RpdmVGcmFtZXdvcmsgPSB0aGlzLmZyYW1ld29ya3NbMF07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzLl9hY3RpdmVGcmFtZXdvcms7XHJcbiAgICB9XHJcbiAgICBwdWJsaWMgc2V0IGFjdGl2ZUZyYW1ld29yayh2YWx1ZSkge1xyXG4gICAgICAgIHRoaXMuX2FjdGl2ZUZyYW1ld29yayA9IHZhbHVlO1xyXG4gICAgICAgIGlmICghdGhpcy5fc3ViamVjdEFjdGl2ZUZyYW1ld29yay5pc1Vuc3Vic2NyaWJlZCkge1xyXG4gICAgICAgICAgICB0aGlzLl9zdWJqZWN0QWN0aXZlRnJhbWV3b3JrLm5leHQodGhpcy5fYWN0aXZlRnJhbWV3b3JrKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfZnJhbWV3b3JrczogTW9kZWxzLkRvdE5ldEZyYW1ld29ya1tdID0gW3sgRnJpZW5kbHlOYW1lOiBcIkFsbFwiLCBOYW1lOiBcImFsbFwiLCBTaG9ydE5hbWU6IFwiYWxsXCIgfV07XHJcbiAgICBwdWJsaWMgZ2V0IGZyYW1ld29ya3MoKSB7IHJldHVybiB0aGlzLl9mcmFtZXdvcmtzOyB9XHJcbiAgICBwdWJsaWMgc2V0IGZyYW1ld29ya3ModmFsdWUpIHtcclxuICAgICAgICB0aGlzLl9mcmFtZXdvcmtzID0gW3sgRnJpZW5kbHlOYW1lOiBcIkFsbFwiLCBOYW1lOiBcImFsbFwiLCBTaG9ydE5hbWU6IFwiYWxsXCIgfV0uY29uY2F0KHZhbHVlKTtcclxuICAgICAgICBpZiAoIXRoaXMuYWN0aXZlRnJhbWV3b3JrKSB7XHJcbiAgICAgICAgICAgIHRoaXMuYWN0aXZlRnJhbWV3b3JrID0gdGhpcy5fZnJhbWV3b3Jrc1swXTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfY29uZmlndXJhdGlvbnM6IHN0cmluZ1tdID0gW107XHJcbiAgICBwdWJsaWMgZ2V0IGNvbmZpZ3VyYXRpb25zKCkgeyByZXR1cm4gdGhpcy5fY29uZmlndXJhdGlvbnM7IH1cclxuICAgIHB1YmxpYyBzZXQgY29uZmlndXJhdGlvbnModmFsdWUpIHsgdGhpcy5fY29uZmlndXJhdGlvbnMgPSB2YWx1ZSB8fCBbXTsgfVxyXG5cclxuICAgIHB1YmxpYyBvYnNlcnZlOiB7XHJcbiAgICAgICAgYWN0aXZlRnJhbWV3b3JrOiBPYnNlcnZhYmxlPE1vZGVscy5Eb3ROZXRGcmFtZXdvcms+O1xyXG4gICAgfTtcclxuXHJcbiAgICBwdWJsaWMgYWJzdHJhY3QgaW5pdCh2YWx1ZTogVCk6IHZvaWQ7XHJcbiAgICBwdWJsaWMgdXBkYXRlKG90aGVyOiBQcm9qZWN0Vmlld01vZGVsPFQ+KSB7XHJcbiAgICAgICAgdGhpcy5uYW1lID0gb3RoZXIubmFtZTtcclxuICAgICAgICB0aGlzLnBhdGggPSBvdGhlci5wYXRoO1xyXG4gICAgICAgIHRoaXMuc29sdXRpb25QYXRoID0gb3RoZXIuc29sdXRpb25QYXRoO1xyXG4gICAgICAgIHRoaXMuc291cmNlRmlsZXMgPSBvdGhlci5zb3VyY2VGaWxlcztcclxuICAgICAgICB0aGlzLmZyYW1ld29ya3MgPSBvdGhlci5mcmFtZXdvcmtzO1xyXG4gICAgICAgIHRoaXMuYWN0aXZlRnJhbWV3b3JrID0gdGhpcy5fYWN0aXZlRnJhbWV3b3JrO1xyXG4gICAgICAgIHRoaXMuY29uZmlndXJhdGlvbnMgPSBvdGhlci5jb25maWd1cmF0aW9ucztcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgdG9KU09OKCkge1xyXG4gICAgICAgIGNvbnN0IHtuYW1lLCBwYXRoLCBzb2x1dGlvblBhdGgsIHNvdXJjZUZpbGVzLCBmcmFtZXdvcmtzLCBjb25maWd1cmF0aW9uc30gPSB0aGlzO1xyXG4gICAgICAgIHJldHVybiB7IG5hbWUsIHBhdGgsIHNvbHV0aW9uUGF0aCwgc291cmNlRmlsZXMsIGZyYW1ld29ya3MsIGNvbmZpZ3VyYXRpb25zIH07XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgdGhpcy5fc3ViamVjdEFjdGl2ZUZyYW1ld29yay51bnN1YnNjcmliZSgpO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgRW1wdHlQcm9qZWN0Vmlld01vZGVsIGV4dGVuZHMgUHJvamVjdFZpZXdNb2RlbDxQcm9qZWN0Vmlld01vZGVsPGFueT4+IHtcclxuICAgIHB1YmxpYyBpbml0KHByb2plY3Q6IFByb2plY3RWaWV3TW9kZWw8YW55PikgeyAvKiAqLyB9XHJcbn1cclxuXHJcbmNsYXNzIFByb3h5UHJvamVjdFZpZXdNb2RlbCBleHRlbmRzIFByb2plY3RWaWV3TW9kZWw8UHJvamVjdFZpZXdNb2RlbDxhbnk+PiB7XHJcbiAgICBwdWJsaWMgaW5pdChwcm9qZWN0OiBQcm9qZWN0Vmlld01vZGVsPGFueT4pIHtcclxuICAgICAgICB0aGlzLnVwZGF0ZShwcm9qZWN0KTtcclxuICAgIH1cclxufVxyXG5cclxuY2xhc3MgTXNCdWlsZFByb2plY3RWaWV3TW9kZWwgZXh0ZW5kcyBQcm9qZWN0Vmlld01vZGVsPE1vZGVscy5NU0J1aWxkUHJvamVjdD4ge1xyXG4gICAgcHVibGljIGluaXQocHJvamVjdDogTW9kZWxzLk1TQnVpbGRQcm9qZWN0KSB7XHJcbiAgICAgICAgY29uc3QgZnJhbWV3b3JrcyA9IFt7XHJcbiAgICAgICAgICAgIEZyaWVuZGx5TmFtZTogcHJvamVjdC5UYXJnZXRGcmFtZXdvcmssXHJcbiAgICAgICAgICAgIE5hbWU6IHByb2plY3QuVGFyZ2V0RnJhbWV3b3JrLFxyXG4gICAgICAgICAgICBTaG9ydE5hbWU6IHByb2plY3QuVGFyZ2V0RnJhbWV3b3JrXHJcbiAgICAgICAgfV07XHJcblxyXG4gICAgICAgIHRoaXMubmFtZSA9IHByb2plY3QuQXNzZW1ibHlOYW1lO1xyXG4gICAgICAgIHRoaXMucGF0aCA9IHByb2plY3QuUGF0aDtcclxuICAgICAgICB0aGlzLmZyYW1ld29ya3MgPSBmcmFtZXdvcmtzO1xyXG4gICAgICAgIHRoaXMuc291cmNlRmlsZXMgPSBwcm9qZWN0LlNvdXJjZUZpbGVzO1xyXG4gICAgfVxyXG59XHJcblxyXG5jbGFzcyBEb3ROZXRQcm9qZWN0Vmlld01vZGVsIGV4dGVuZHMgUHJvamVjdFZpZXdNb2RlbDxNb2RlbHMuRG90TmV0UHJvamVjdEluZm9ybWF0aW9uPiB7XHJcbiAgICBwdWJsaWMgaW5pdChwcm9qZWN0OiBNb2RlbHMuRG90TmV0UHJvamVjdEluZm9ybWF0aW9uKSB7XHJcbiAgICAgICAgdGhpcy5uYW1lID0gcHJvamVjdC5OYW1lO1xyXG4gICAgICAgIHRoaXMucGF0aCA9IHByb2plY3QuUGF0aDtcclxuICAgICAgICB0aGlzLmZyYW1ld29ya3MgPSBwcm9qZWN0LkZyYW1ld29ya3MgfHwgW107XHJcbiAgICAgICAgdGhpcy5jb25maWd1cmF0aW9ucyA9IChwcm9qZWN0LkNvbmZpZ3VyYXRpb25zIHx8IFtdKS5tYXAoeCA9PiB4Lk5hbWUpO1xyXG4gICAgICAgIHRoaXMuc291cmNlRmlsZXMgPSBwcm9qZWN0LlNvdXJjZUZpbGVzIHx8IFtdO1xyXG4gICAgfVxyXG59XHJcblxyXG5jbGFzcyBTY3JpcHRDc1Byb2plY3RWaWV3TW9kZWwgZXh0ZW5kcyBQcm9qZWN0Vmlld01vZGVsPFNjcmlwdENzLlNjcmlwdENzQ29udGV4dE1vZGVsPiB7XHJcbiAgICBwdWJsaWMgaW5pdChwcm9qZWN0OiBTY3JpcHRDcy5TY3JpcHRDc0NvbnRleHRNb2RlbCkge1xyXG4gICAgICAgIHRoaXMubmFtZSA9IFwiU2NyaXB0Q3NcIjtcclxuICAgICAgICB0aGlzLnBhdGggPSBwcm9qZWN0LlJvb3RQYXRoO1xyXG4gICAgICAgIHRoaXMuc291cmNlRmlsZXMgPSBwcm9qZWN0LkNzeEZpbGVzQmVpbmdQcm9jZXNzZWQ7XHJcbiAgICB9XHJcbn1cclxuIiwiaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xuaW1wb3J0IHsgUmVwbGF5U3ViamVjdCB9IGZyb20gXCJyeGpzXCI7XG5jb25zdCBwcm9qZWN0RmFjdG9yaWVzID0ge1xuICAgIE1zQnVpbGRQcm9qZWN0OiBNc0J1aWxkUHJvamVjdFZpZXdNb2RlbCxcbiAgICBEb3ROZXRQcm9qZWN0OiBEb3ROZXRQcm9qZWN0Vmlld01vZGVsXG59O1xuY29uc3Qgc3VwcG9ydGVkUHJvamVjdFR5cGVzID0gXy5rZXlzKHByb2plY3RGYWN0b3JpZXMpO1xuZXhwb3J0IGZ1bmN0aW9uIHByb2plY3RWaWV3TW9kZWxGYWN0b3J5KG9tbmlzaGFycFByb2plY3QsIHNvbHV0aW9uUGF0aCkge1xuICAgIGNvbnN0IHByb2plY3RUeXBlcyA9IF8uZmlsdGVyKHN1cHBvcnRlZFByb2plY3RUeXBlcywgdHlwZSA9PiBfLmhhcyhvbW5pc2hhcnBQcm9qZWN0LCB0eXBlKSk7XG4gICAgY29uc3QgbWlzc2luZyA9IF8uZGlmZmVyZW5jZShfLmtleXMob21uaXNoYXJwUHJvamVjdCksIHN1cHBvcnRlZFByb2plY3RUeXBlcyk7XG4gICAgaWYgKG1pc3NpbmcubGVuZ3RoKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBNaXNzaW5nIGZhY3RvcnkgZm9yIHByb2plY3QgdHlwZSAke21pc3Npbmd9YCk7XG4gICAgfVxuICAgIGNvbnN0IHJlc3VsdHMgPSBbXTtcbiAgICBsZXQgc2tpcERueCA9IGZhbHNlO1xuICAgIGlmIChwcm9qZWN0VHlwZXNbXCJEb3ROZXRQcm9qZWN0XCJdICYmIHByb2plY3RUeXBlc1tcIkRueFByb2plY3RcIl0pXG4gICAgICAgIHNraXBEbnggPSB0cnVlO1xuICAgIF8uZWFjaChwcm9qZWN0VHlwZXMsIHByb2plY3RUeXBlID0+IHtcbiAgICAgICAgaWYgKHNraXBEbnggJiYgXy5zdGFydHNXaXRoKHByb2plY3RUeXBlLCBcIkRueFwiKSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgaWYgKHByb2plY3RUeXBlICYmIHByb2plY3RGYWN0b3JpZXNbcHJvamVjdFR5cGVdKSB7XG4gICAgICAgICAgICByZXN1bHRzLnB1c2gobmV3IHByb2plY3RGYWN0b3JpZXNbcHJvamVjdFR5cGVdKG9tbmlzaGFycFByb2plY3RbcHJvamVjdFR5cGVdLCBzb2x1dGlvblBhdGgpKTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiByZXN1bHRzO1xufVxuY29uc3Qgd29ya3NwYWNlRmFjdG9yaWVzID0ge1xuICAgIE1zQnVpbGQ6ICh3b3Jrc3BhY2UsIHNvbHV0aW9uUGF0aCkgPT4ge1xuICAgICAgICByZXR1cm4gXy5tYXAod29ya3NwYWNlLlByb2plY3RzLCBwcm9qZWN0SW5mb3JtYXRpb24gPT4gbmV3IE1zQnVpbGRQcm9qZWN0Vmlld01vZGVsKHByb2plY3RJbmZvcm1hdGlvbiwgc29sdXRpb25QYXRoKSk7XG4gICAgfSxcbiAgICBEb3ROZXQ6ICh3b3Jrc3BhY2UsIHNvbHV0aW9uUGF0aCkgPT4ge1xuICAgICAgICByZXR1cm4gXy5tYXAod29ya3NwYWNlLlByb2plY3RzLCBwcm9qZWN0SW5mb3JtYXRpb24gPT4gbmV3IERvdE5ldFByb2plY3RWaWV3TW9kZWwocHJvamVjdEluZm9ybWF0aW9uLCBzb2x1dGlvblBhdGgpKTtcbiAgICB9LFxuICAgIFNjcmlwdENzOiAod29ya3NwYWNlLCBzb2x1dGlvblBhdGgpID0+IHtcbiAgICAgICAgcmV0dXJuIFtdO1xuICAgIH0sXG59O1xuZXhwb3J0IGZ1bmN0aW9uIHdvcmtzcGFjZVZpZXdNb2RlbEZhY3Rvcnkob21uaXNoYXJwV29ya3NwYWNlLCBzb2x1dGlvblBhdGgpIHtcbiAgICBjb25zdCBwcm9qZWN0cyA9IFtdO1xuICAgIGxldCBza2lwRG54ID0gZmFsc2U7XG4gICAgaWYgKG9tbmlzaGFycFdvcmtzcGFjZVtcIkRvdE5ldFwiXSAmJiBvbW5pc2hhcnBXb3Jrc3BhY2VbXCJEbnhcIl0pXG4gICAgICAgIHNraXBEbnggPSB0cnVlO1xuICAgIF8uZm9ySW4ob21uaXNoYXJwV29ya3NwYWNlLCAoaXRlbSwga2V5KSA9PiB7XG4gICAgICAgIGNvbnN0IGZhY3RvcnkgPSB3b3Jrc3BhY2VGYWN0b3JpZXNba2V5XTtcbiAgICAgICAgaWYgKHNraXBEbnggJiYgXy5zdGFydHNXaXRoKGtleSwgXCJEbnhcIikpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGlmIChmYWN0b3J5KSB7XG4gICAgICAgICAgICBwcm9qZWN0cy5wdXNoKC4uLmZhY3RvcnkoaXRlbSwgc29sdXRpb25QYXRoKSk7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gcHJvamVjdHM7XG59XG5leHBvcnQgY2xhc3MgUHJvamVjdFZpZXdNb2RlbCB7XG4gICAgY29uc3RydWN0b3IocHJvamVjdCwgc29sdXRpb25QYXRoKSB7XG4gICAgICAgIHRoaXMuX3NvdXJjZUZpbGVzID0gW107XG4gICAgICAgIHRoaXMuX3N1YmplY3RBY3RpdmVGcmFtZXdvcmsgPSBuZXcgUmVwbGF5U3ViamVjdCgxKTtcbiAgICAgICAgdGhpcy5fZnJhbWV3b3JrcyA9IFt7IEZyaWVuZGx5TmFtZTogXCJBbGxcIiwgTmFtZTogXCJhbGxcIiwgU2hvcnROYW1lOiBcImFsbFwiIH1dO1xuICAgICAgICB0aGlzLl9jb25maWd1cmF0aW9ucyA9IFtdO1xuICAgICAgICB0aGlzLnNvbHV0aW9uUGF0aCA9IHNvbHV0aW9uUGF0aDtcbiAgICAgICAgdGhpcy5pbml0KHByb2plY3QpO1xuICAgICAgICB0aGlzLm9ic2VydmUgPSB7IGFjdGl2ZUZyYW1ld29yazogdGhpcy5fc3ViamVjdEFjdGl2ZUZyYW1ld29yayB9O1xuICAgICAgICB0aGlzLl9zdWJqZWN0QWN0aXZlRnJhbWV3b3JrLm5leHQodGhpcy5fZnJhbWV3b3Jrc1swXSk7XG4gICAgfVxuICAgIGdldCBuYW1lKCkgeyByZXR1cm4gdGhpcy5fbmFtZTsgfVxuICAgIHNldCBuYW1lKHZhbHVlKSB7IHRoaXMuX25hbWUgPSB2YWx1ZTsgfVxuICAgIGdldCBwYXRoKCkgeyByZXR1cm4gdGhpcy5fcGF0aDsgfVxuICAgIHNldCBwYXRoKHZhbHVlKSB7IHRoaXMuX3BhdGggPSB2YWx1ZTsgfVxuICAgIGdldCBzb2x1dGlvblBhdGgoKSB7IHJldHVybiB0aGlzLl9zb2x1dGlvblBhdGg7IH1cbiAgICBzZXQgc29sdXRpb25QYXRoKHZhbHVlKSB7IHRoaXMuX3NvbHV0aW9uUGF0aCA9IHZhbHVlOyB9XG4gICAgZ2V0IHNvdXJjZUZpbGVzKCkgeyByZXR1cm4gdGhpcy5fc291cmNlRmlsZXM7IH1cbiAgICBzZXQgc291cmNlRmlsZXModmFsdWUpIHtcbiAgICAgICAgdGhpcy5fc291cmNlRmlsZXMgPSB2YWx1ZSB8fCBbXTtcbiAgICAgICAgaWYgKHRoaXMuX2ZpbGVzU2V0KVxuICAgICAgICAgICAgdGhpcy5fZmlsZXNTZXQgPSBudWxsO1xuICAgIH1cbiAgICBnZXQgZmlsZXNTZXQoKSB7XG4gICAgICAgIGlmICghdGhpcy5fZmlsZXNTZXQpIHtcbiAgICAgICAgICAgIHRoaXMuX2ZpbGVzU2V0ID0gbmV3IFNldCgpO1xuICAgICAgICAgICAgXy5lYWNoKHRoaXMuX3NvdXJjZUZpbGVzLCBmaWxlID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLl9maWxlc1NldC5hZGQoZmlsZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5fZmlsZXNTZXQ7XG4gICAgfVxuICAgIGdldCBhY3RpdmVGcmFtZXdvcmsoKSB7XG4gICAgICAgIGlmICghdGhpcy5fYWN0aXZlRnJhbWV3b3JrKSB7XG4gICAgICAgICAgICB0aGlzLl9hY3RpdmVGcmFtZXdvcmsgPSB0aGlzLmZyYW1ld29ya3NbMF07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuX2FjdGl2ZUZyYW1ld29yaztcbiAgICB9XG4gICAgc2V0IGFjdGl2ZUZyYW1ld29yayh2YWx1ZSkge1xuICAgICAgICB0aGlzLl9hY3RpdmVGcmFtZXdvcmsgPSB2YWx1ZTtcbiAgICAgICAgaWYgKCF0aGlzLl9zdWJqZWN0QWN0aXZlRnJhbWV3b3JrLmlzVW5zdWJzY3JpYmVkKSB7XG4gICAgICAgICAgICB0aGlzLl9zdWJqZWN0QWN0aXZlRnJhbWV3b3JrLm5leHQodGhpcy5fYWN0aXZlRnJhbWV3b3JrKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBnZXQgZnJhbWV3b3JrcygpIHsgcmV0dXJuIHRoaXMuX2ZyYW1ld29ya3M7IH1cbiAgICBzZXQgZnJhbWV3b3Jrcyh2YWx1ZSkge1xuICAgICAgICB0aGlzLl9mcmFtZXdvcmtzID0gW3sgRnJpZW5kbHlOYW1lOiBcIkFsbFwiLCBOYW1lOiBcImFsbFwiLCBTaG9ydE5hbWU6IFwiYWxsXCIgfV0uY29uY2F0KHZhbHVlKTtcbiAgICAgICAgaWYgKCF0aGlzLmFjdGl2ZUZyYW1ld29yaykge1xuICAgICAgICAgICAgdGhpcy5hY3RpdmVGcmFtZXdvcmsgPSB0aGlzLl9mcmFtZXdvcmtzWzBdO1xuICAgICAgICB9XG4gICAgfVxuICAgIGdldCBjb25maWd1cmF0aW9ucygpIHsgcmV0dXJuIHRoaXMuX2NvbmZpZ3VyYXRpb25zOyB9XG4gICAgc2V0IGNvbmZpZ3VyYXRpb25zKHZhbHVlKSB7IHRoaXMuX2NvbmZpZ3VyYXRpb25zID0gdmFsdWUgfHwgW107IH1cbiAgICB1cGRhdGUob3RoZXIpIHtcbiAgICAgICAgdGhpcy5uYW1lID0gb3RoZXIubmFtZTtcbiAgICAgICAgdGhpcy5wYXRoID0gb3RoZXIucGF0aDtcbiAgICAgICAgdGhpcy5zb2x1dGlvblBhdGggPSBvdGhlci5zb2x1dGlvblBhdGg7XG4gICAgICAgIHRoaXMuc291cmNlRmlsZXMgPSBvdGhlci5zb3VyY2VGaWxlcztcbiAgICAgICAgdGhpcy5mcmFtZXdvcmtzID0gb3RoZXIuZnJhbWV3b3JrcztcbiAgICAgICAgdGhpcy5hY3RpdmVGcmFtZXdvcmsgPSB0aGlzLl9hY3RpdmVGcmFtZXdvcms7XG4gICAgICAgIHRoaXMuY29uZmlndXJhdGlvbnMgPSBvdGhlci5jb25maWd1cmF0aW9ucztcbiAgICB9XG4gICAgdG9KU09OKCkge1xuICAgICAgICBjb25zdCB7IG5hbWUsIHBhdGgsIHNvbHV0aW9uUGF0aCwgc291cmNlRmlsZXMsIGZyYW1ld29ya3MsIGNvbmZpZ3VyYXRpb25zIH0gPSB0aGlzO1xuICAgICAgICByZXR1cm4geyBuYW1lLCBwYXRoLCBzb2x1dGlvblBhdGgsIHNvdXJjZUZpbGVzLCBmcmFtZXdvcmtzLCBjb25maWd1cmF0aW9ucyB9O1xuICAgIH1cbiAgICBkaXNwb3NlKCkge1xuICAgICAgICB0aGlzLl9zdWJqZWN0QWN0aXZlRnJhbWV3b3JrLnVuc3Vic2NyaWJlKCk7XG4gICAgfVxufVxuZXhwb3J0IGNsYXNzIEVtcHR5UHJvamVjdFZpZXdNb2RlbCBleHRlbmRzIFByb2plY3RWaWV3TW9kZWwge1xuICAgIGluaXQocHJvamVjdCkgeyB9XG59XG5jbGFzcyBQcm94eVByb2plY3RWaWV3TW9kZWwgZXh0ZW5kcyBQcm9qZWN0Vmlld01vZGVsIHtcbiAgICBpbml0KHByb2plY3QpIHtcbiAgICAgICAgdGhpcy51cGRhdGUocHJvamVjdCk7XG4gICAgfVxufVxuY2xhc3MgTXNCdWlsZFByb2plY3RWaWV3TW9kZWwgZXh0ZW5kcyBQcm9qZWN0Vmlld01vZGVsIHtcbiAgICBpbml0KHByb2plY3QpIHtcbiAgICAgICAgY29uc3QgZnJhbWV3b3JrcyA9IFt7XG4gICAgICAgICAgICAgICAgRnJpZW5kbHlOYW1lOiBwcm9qZWN0LlRhcmdldEZyYW1ld29yayxcbiAgICAgICAgICAgICAgICBOYW1lOiBwcm9qZWN0LlRhcmdldEZyYW1ld29yayxcbiAgICAgICAgICAgICAgICBTaG9ydE5hbWU6IHByb2plY3QuVGFyZ2V0RnJhbWV3b3JrXG4gICAgICAgICAgICB9XTtcbiAgICAgICAgdGhpcy5uYW1lID0gcHJvamVjdC5Bc3NlbWJseU5hbWU7XG4gICAgICAgIHRoaXMucGF0aCA9IHByb2plY3QuUGF0aDtcbiAgICAgICAgdGhpcy5mcmFtZXdvcmtzID0gZnJhbWV3b3JrcztcbiAgICAgICAgdGhpcy5zb3VyY2VGaWxlcyA9IHByb2plY3QuU291cmNlRmlsZXM7XG4gICAgfVxufVxuY2xhc3MgRG90TmV0UHJvamVjdFZpZXdNb2RlbCBleHRlbmRzIFByb2plY3RWaWV3TW9kZWwge1xuICAgIGluaXQocHJvamVjdCkge1xuICAgICAgICB0aGlzLm5hbWUgPSBwcm9qZWN0Lk5hbWU7XG4gICAgICAgIHRoaXMucGF0aCA9IHByb2plY3QuUGF0aDtcbiAgICAgICAgdGhpcy5mcmFtZXdvcmtzID0gcHJvamVjdC5GcmFtZXdvcmtzIHx8IFtdO1xuICAgICAgICB0aGlzLmNvbmZpZ3VyYXRpb25zID0gKHByb2plY3QuQ29uZmlndXJhdGlvbnMgfHwgW10pLm1hcCh4ID0+IHguTmFtZSk7XG4gICAgICAgIHRoaXMuc291cmNlRmlsZXMgPSBwcm9qZWN0LlNvdXJjZUZpbGVzIHx8IFtdO1xuICAgIH1cbn1cbmNsYXNzIFNjcmlwdENzUHJvamVjdFZpZXdNb2RlbCBleHRlbmRzIFByb2plY3RWaWV3TW9kZWwge1xuICAgIGluaXQocHJvamVjdCkge1xuICAgICAgICB0aGlzLm5hbWUgPSBcIlNjcmlwdENzXCI7XG4gICAgICAgIHRoaXMucGF0aCA9IHByb2plY3QuUm9vdFBhdGg7XG4gICAgICAgIHRoaXMuc291cmNlRmlsZXMgPSBwcm9qZWN0LkNzeEZpbGVzQmVpbmdQcm9jZXNzZWQ7XG4gICAgfVxufVxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
