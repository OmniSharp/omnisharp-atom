'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.EmptyProjectViewModel = exports.ProjectViewModel = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.projectViewModelFactory = projectViewModelFactory;
exports.workspaceViewModelFactory = workspaceViewModelFactory;

var _lodash = require('lodash');

var _rxjs = require('rxjs');

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var projectFactories = {
    MsBuildProject: MsBuildProjectViewModel,
    DotNetProject: DotNetProjectViewModel
};
var supportedProjectTypes = (0, _lodash.keys)(projectFactories);
function projectViewModelFactory(omnisharpProject, solutionPath) {
    var projectTypes = (0, _lodash.filter)(supportedProjectTypes, function (type) {
        return (0, _lodash.has)(omnisharpProject, type);
    });
    var missing = (0, _lodash.difference)((0, _lodash.keys)(omnisharpProject), supportedProjectTypes);
    if (missing.length) {
        console.log('Missing factory for project type ' + missing);
    }
    var results = [];
    var skipDnx = false;
    if (projectTypes['DotNetProject'] && projectTypes['DnxProject']) {
        skipDnx = true;
    }
    (0, _lodash.each)(projectTypes, function (projectType) {
        if (skipDnx && (0, _lodash.startsWith)(projectType, 'Dnx')) {
            return;
        }
        if (projectType && projectFactories[projectType]) {
            results.push(new projectFactories[projectType](omnisharpProject[projectType], solutionPath));
        }
    });
    return results;
}
var workspaceFactories = {
    MsBuild: function MsBuild(workspace, solutionPath) {
        return (0, _lodash.map)(workspace.Projects, function (projectInformation) {
            return new MsBuildProjectViewModel(projectInformation, solutionPath);
        });
    },
    DotNet: function DotNet(workspace, solutionPath) {
        return (0, _lodash.map)(workspace.Projects, function (projectInformation) {
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
    if (omnisharpWorkspace['DotNet'] && omnisharpWorkspace['Dnx']) skipDnx = true;
    (0, _lodash.forIn)(omnisharpWorkspace, function (item, key) {
        var factory = workspaceFactories[key];
        if (skipDnx && (0, _lodash.startsWith)(key, 'Dnx')) return;
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
        this._frameworks = [{ FriendlyName: 'All', Name: 'all', ShortName: 'all' }];
        this._configurations = [];
        this.solutionPath = solutionPath;
        this.init(project);
        this.observe = { activeFramework: this._subjectActiveFramework };
        this._subjectActiveFramework.next(this._frameworks[0]);
    }

    _createClass(ProjectViewModel, [{
        key: 'update',
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
        key: 'toJSON',
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
        key: 'dispose',
        value: function dispose() {
            this._subjectActiveFramework.unsubscribe();
        }
    }, {
        key: 'name',
        get: function get() {
            return this._name;
        },
        set: function set(value) {
            this._name = value;
        }
    }, {
        key: 'path',
        get: function get() {
            return this._path;
        },
        set: function set(value) {
            this._path = value;
        }
    }, {
        key: 'solutionPath',
        get: function get() {
            return this._solutionPath;
        },
        set: function set(value) {
            this._solutionPath = value;
        }
    }, {
        key: 'sourceFiles',
        get: function get() {
            return this._sourceFiles;
        },
        set: function set(value) {
            this._sourceFiles = value || [];
            if (this._filesSet) this._filesSet = null;
        }
    }, {
        key: 'filesSet',
        get: function get() {
            var _this = this;

            if (!this._filesSet) {
                this._filesSet = new Set();
                (0, _lodash.each)(this._sourceFiles, function (file) {
                    _this._filesSet.add(file);
                });
            }
            return this._filesSet;
        }
    }, {
        key: 'activeFramework',
        get: function get() {
            if (!this._activeFramework) {
                this._activeFramework = this.frameworks[0];
            }
            return this._activeFramework;
        },
        set: function set(value) {
            this._activeFramework = value;
            if (!this._subjectActiveFramework.closed) {
                this._subjectActiveFramework.next(this._activeFramework);
            }
        }
    }, {
        key: 'frameworks',
        get: function get() {
            return this._frameworks;
        },
        set: function set(value) {
            this._frameworks = [{ FriendlyName: 'All', Name: 'all', ShortName: 'all' }].concat(value);
            if (!this.activeFramework) {
                this.activeFramework = this._frameworks[0];
            }
        }
    }, {
        key: 'configurations',
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
        key: 'init',
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
        key: 'init',
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
        key: 'init',
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
        key: 'init',
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
        key: 'init',
        value: function init(project) {
            this.name = 'ScriptCs';
            this.path = project.RootPath;
            this.sourceFiles = project.CsxFilesBeingProcessed;
        }
    }]);

    return ScriptCsProjectViewModel;
}(ProjectViewModel);
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9zZXJ2ZXIvcHJvamVjdC12aWV3LW1vZGVsLnRzIl0sIm5hbWVzIjpbInByb2plY3RWaWV3TW9kZWxGYWN0b3J5Iiwid29ya3NwYWNlVmlld01vZGVsRmFjdG9yeSIsInByb2plY3RGYWN0b3JpZXMiLCJNc0J1aWxkUHJvamVjdCIsIk1zQnVpbGRQcm9qZWN0Vmlld01vZGVsIiwiRG90TmV0UHJvamVjdCIsIkRvdE5ldFByb2plY3RWaWV3TW9kZWwiLCJzdXBwb3J0ZWRQcm9qZWN0VHlwZXMiLCJvbW5pc2hhcnBQcm9qZWN0Iiwic29sdXRpb25QYXRoIiwicHJvamVjdFR5cGVzIiwidHlwZSIsIm1pc3NpbmciLCJsZW5ndGgiLCJjb25zb2xlIiwibG9nIiwicmVzdWx0cyIsInNraXBEbngiLCJwcm9qZWN0VHlwZSIsInB1c2giLCJ3b3Jrc3BhY2VGYWN0b3JpZXMiLCJNc0J1aWxkIiwid29ya3NwYWNlIiwiUHJvamVjdHMiLCJwcm9qZWN0SW5mb3JtYXRpb24iLCJEb3ROZXQiLCJTY3JpcHRDcyIsIm9tbmlzaGFycFdvcmtzcGFjZSIsInByb2plY3RzIiwiaXRlbSIsImtleSIsImZhY3RvcnkiLCJQcm9qZWN0Vmlld01vZGVsIiwicHJvamVjdCIsIl9zb3VyY2VGaWxlcyIsIl9zdWJqZWN0QWN0aXZlRnJhbWV3b3JrIiwiX2ZyYW1ld29ya3MiLCJGcmllbmRseU5hbWUiLCJOYW1lIiwiU2hvcnROYW1lIiwiX2NvbmZpZ3VyYXRpb25zIiwiaW5pdCIsIm9ic2VydmUiLCJhY3RpdmVGcmFtZXdvcmsiLCJuZXh0Iiwib3RoZXIiLCJuYW1lIiwicGF0aCIsInNvdXJjZUZpbGVzIiwiZnJhbWV3b3JrcyIsIl9hY3RpdmVGcmFtZXdvcmsiLCJjb25maWd1cmF0aW9ucyIsInVuc3Vic2NyaWJlIiwiX25hbWUiLCJ2YWx1ZSIsIl9wYXRoIiwiX3NvbHV0aW9uUGF0aCIsIl9maWxlc1NldCIsIlNldCIsImFkZCIsImZpbGUiLCJjbG9zZWQiLCJjb25jYXQiLCJFbXB0eVByb2plY3RWaWV3TW9kZWwiLCJQcm94eVByb2plY3RWaWV3TW9kZWwiLCJ1cGRhdGUiLCJUYXJnZXRGcmFtZXdvcmsiLCJBc3NlbWJseU5hbWUiLCJQYXRoIiwiU291cmNlRmlsZXMiLCJGcmFtZXdvcmtzIiwiQ29uZmlndXJhdGlvbnMiLCJtYXAiLCJ4IiwiU2NyaXB0Q3NQcm9qZWN0Vmlld01vZGVsIiwiUm9vdFBhdGgiLCJDc3hGaWxlc0JlaW5nUHJvY2Vzc2VkIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7UUFXTUEsdUIsR0FBQUEsdUI7UUFrQ0FDLHlCLEdBQUFBLHlCOztBQTdDTjs7QUFFQTs7Ozs7Ozs7OztBQUdBLElBQU1DLG1CQUEyRjtBQUM3RkMsb0JBQXFCQyx1QkFEd0U7QUFFN0ZDLG1CQUFvQkM7QUFGeUUsQ0FBakc7QUFLQSxJQUFNQyx3QkFBd0Isa0JBQUtMLGdCQUFMLENBQTlCO0FBQ00sU0FBQUYsdUJBQUEsQ0FBa0NRLGdCQUFsQyxFQUF1RkMsWUFBdkYsRUFBMkc7QUFDN0csUUFBTUMsZUFBZSxvQkFBT0gscUJBQVAsRUFBOEI7QUFBQSxlQUFRLGlCQUFJQyxnQkFBSixFQUFzQkcsSUFBdEIsQ0FBUjtBQUFBLEtBQTlCLENBQXJCO0FBQ0EsUUFBTUMsVUFBVSx3QkFBVyxrQkFBS0osZ0JBQUwsQ0FBWCxFQUFtQ0QscUJBQW5DLENBQWhCO0FBQ0EsUUFBSUssUUFBUUMsTUFBWixFQUFvQjtBQUNoQkMsZ0JBQVFDLEdBQVIsdUNBQWdESCxPQUFoRDtBQUNIO0FBRUQsUUFBTUksVUFBbUMsRUFBekM7QUFDQSxRQUFJQyxVQUFVLEtBQWQ7QUFDQSxRQUFJUCxhQUFhLGVBQWIsS0FBaUNBLGFBQWEsWUFBYixDQUFyQyxFQUFpRTtBQUFFTyxrQkFBVSxJQUFWO0FBQWlCO0FBQ3BGLHNCQUFLUCxZQUFMLEVBQW1CLHVCQUFXO0FBQzFCLFlBQUlPLFdBQVcsd0JBQVdDLFdBQVgsRUFBd0IsS0FBeEIsQ0FBZixFQUErQztBQUFFO0FBQVM7QUFDMUQsWUFBSUEsZUFBZWhCLGlCQUFp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O0FBQ3RDLGdCQUFNZ0IsYUFBYSxDQUFDO0FBQ2hCWiw4QkFBY0osUUFBUWlDLGVBRE47QUFFaEI1QixzQkFBTUwsUUFBUWlDLGVBRkU7QUFHaEIzQiwyQkFBV04sUUFBUWlDO0FBSEgsYUFBRCxDQUFuQjtBQU1BLGlCQUFLcEIsSUFBTCxHQUFZYixRQUFRa0MsWUFBcEI7QUFDQSxpQkFBS3BCLElBQUwsR0FBWWQsUUFBUW1DLElBQXBCO0FBQ0EsaUJBQUtuQixVQUFMLEdBQWtCQSxVQUFsQjtBQUNBLGlCQUFLRCxXQUFMLEdBQW1CZixRQUFRb0MsV0FBM0I7QUFDSDs7OztFQVppQ3JDLGdCOztJQWV0QzFCLHNCOzs7Ozs7Ozs7Ozs2QkFDZ0IyQixPLEVBQXdDO0FBQ2hELGlCQUFLYSxJQUFMLEdBQVliLFFBQVFLLElBQXBCO0FBQ0EsaUJBQUtTLElBQUwsR0FBWWQsUUFBUW1DLElBQXBCO0FBQ0EsaUJBQUtuQixVQUFMLEdBQWtCaEIsUUFBUXFDLFVBQVIsSUFBc0IsRUFBeEM7QUFDQSxpQkFBS25CLGNBQUwsR0FBc0IsQ0FBQ2xCLFFBQVFzQyxjQUFSLElBQTBCLEVBQTNCLEVBQStCQyxHQUEvQixDQUFtQztBQUFBLHVCQUFLQyxFQUFFbkMsSUFBUDtBQUFBLGFBQW5DLENBQXRCO0FBQ0EsaUJBQUtVLFdBQUwsR0FBbUJmLFFBQVFvQyxXQUFSLElBQXVCLEVBQTFDO0FBQ0g7Ozs7RUFQZ0NyQyxnQjs7SUFVckMwQyx3Qjs7Ozs7Ozs7Ozs7NkJBQ2dCekMsTyxFQUFzQztBQUM5QyxpQkFBS2EsSUFBTCxHQUFZLFVBQVo7QUFDQSxpQkFBS0MsSUFBTCxHQUFZZCxRQUFRMEMsUUFBcEI7QUFDQSxpQkFBSzNCLFdBQUwsR0FBbUJmLFFBQVEyQyxzQkFBM0I7QUFDSDs7OztFQUxrQzVDLGdCIiwiZmlsZSI6ImxpYi9zZXJ2ZXIvcHJvamVjdC12aWV3LW1vZGVsLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZGlmZmVyZW5jZSwgZWFjaCwgZmlsdGVyLCBmb3JJbiwgaGFzLCBrZXlzLCBtYXAsIHN0YXJ0c1dpdGggfSBmcm9tICdsb2Rhc2gnO1xyXG5pbXBvcnQgeyBNb2RlbHMsIFNjcmlwdENzIH0gZnJvbSAnb21uaXNoYXJwLWNsaWVudCc7XHJcbmltcG9ydCB7IE9ic2VydmFibGUsIFJlcGxheVN1YmplY3QgfSBmcm9tICdyeGpzJztcclxuaW1wb3J0IHsgSVByb2plY3RWaWV3TW9kZWwgfSBmcm9tICcuLi9vbW5pc2hhcnAnO1xyXG5cclxuY29uc3QgcHJvamVjdEZhY3RvcmllczogeyBba2V5OiBzdHJpbmddOiB7IG5ldyAocHJvamVjdDogYW55LCBzb2x1dGlvblBhdGg6IHN0cmluZyk6IGFueTsgfTsgfSA9IHtcclxuICAgIE1zQnVpbGRQcm9qZWN0OiA8YW55Pk1zQnVpbGRQcm9qZWN0Vmlld01vZGVsLFxyXG4gICAgRG90TmV0UHJvamVjdDogPGFueT5Eb3ROZXRQcm9qZWN0Vmlld01vZGVsXHJcbn07XHJcblxyXG5jb25zdCBzdXBwb3J0ZWRQcm9qZWN0VHlwZXMgPSBrZXlzKHByb2plY3RGYWN0b3JpZXMpO1xyXG5leHBvcnQgZnVuY3Rpb24gcHJvamVjdFZpZXdNb2RlbEZhY3Rvcnkob21uaXNoYXJwUHJvamVjdDogTW9kZWxzLlByb2plY3RJbmZvcm1hdGlvblJlc3BvbnNlLCBzb2x1dGlvblBhdGg6IHN0cmluZykge1xyXG4gICAgY29uc3QgcHJvamVjdFR5cGVzID0gZmlsdGVyKHN1cHBvcnRlZFByb2plY3RUeXBlcywgdHlwZSA9PiBoYXMob21uaXNoYXJwUHJvamVjdCwgdHlwZSkpO1xyXG4gICAgY29uc3QgbWlzc2luZyA9IGRpZmZlcmVuY2Uoa2V5cyhvbW5pc2hhcnBQcm9qZWN0KSwgc3VwcG9ydGVkUHJvamVjdFR5cGVzKTtcclxuICAgIGlmIChtaXNzaW5nLmxlbmd0aCkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGBNaXNzaW5nIGZhY3RvcnkgZm9yIHByb2plY3QgdHlwZSAke21pc3Npbmd9YCk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgcmVzdWx0czogUHJvamVjdFZpZXdNb2RlbDxhbnk+W10gPSBbXTtcclxuICAgIGxldCBza2lwRG54ID0gZmFsc2U7XHJcbiAgICBpZiAocHJvamVjdFR5cGVzWydEb3ROZXRQcm9qZWN0J10gJiYgcHJvamVjdFR5cGVzWydEbnhQcm9qZWN0J10pIHsgc2tpcERueCA9IHRydWU7IH1cclxuICAgIGVhY2gocHJvamVjdFR5cGVzLCBwcm9qZWN0VHlwZSA9PiB7XHJcbiAgICAgICAgaWYgKHNraXBEbnggJiYgc3RhcnRzV2l0aChwcm9qZWN0VHlwZSwgJ0RueCcpKSB7IHJldHVybjsgfVxyXG4gICAgICAgIGlmIChwcm9qZWN0VHlwZSAmJiBwcm9qZWN0RmFjdG9yaWVzW3Byb2plY3RUeXBlXSkge1xyXG4gICAgICAgICAgICByZXN1bHRzLnB1c2gobmV3IHByb2plY3RGYWN0b3JpZXNbcHJvamVjdFR5cGVdKG9tbmlzaGFycFByb2plY3RbcHJvamVjdFR5cGVdLCBzb2x1dGlvblBhdGgpKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIHJldHVybiByZXN1bHRzO1xyXG59XHJcblxyXG5jb25zdCB3b3Jrc3BhY2VGYWN0b3JpZXM6IHsgW2tleTogc3RyaW5nXTogKHdvcmtzcGFjZTogYW55LCBzb2x1dGlvblBhdGg6IHN0cmluZykgPT4gUHJvamVjdFZpZXdNb2RlbDxhbnk+W10gfSA9IHtcclxuICAgIE1zQnVpbGQ6ICh3b3Jrc3BhY2U6IE1vZGVscy5Nc0J1aWxkV29ya3NwYWNlSW5mb3JtYXRpb24sIHNvbHV0aW9uUGF0aDogc3RyaW5nKSA9PiB7XHJcbiAgICAgICAgcmV0dXJuIG1hcCh3b3Jrc3BhY2UuUHJvamVjdHMsIHByb2plY3RJbmZvcm1hdGlvbiA9PiBuZXcgTXNCdWlsZFByb2plY3RWaWV3TW9kZWwocHJvamVjdEluZm9ybWF0aW9uLCBzb2x1dGlvblBhdGgpKTtcclxuICAgIH0sXHJcbiAgICBEb3ROZXQ6ICh3b3Jrc3BhY2U6IE1vZGVscy5Eb3ROZXRXb3Jrc3BhY2VJbmZvcm1hdGlvbiwgc29sdXRpb25QYXRoOiBzdHJpbmcpID0+IHtcclxuICAgICAgICByZXR1cm4gbWFwKHdvcmtzcGFjZS5Qcm9qZWN0cywgcHJvamVjdEluZm9ybWF0aW9uID0+IG5ldyBEb3ROZXRQcm9qZWN0Vmlld01vZGVsKHByb2plY3RJbmZvcm1hdGlvbiwgc29sdXRpb25QYXRoKSk7XHJcbiAgICB9LFxyXG4gICAgU2NyaXB0Q3M6ICh3b3Jrc3BhY2U6IFNjcmlwdENzLlNjcmlwdENzQ29udGV4dE1vZGVsLCBzb2x1dGlvblBhdGg6IHN0cmluZykgPT4ge1xyXG4gICAgICAgIC8qaWYgKHdvcmtzcGFjZS5Dc3hGaWxlcy5sZW5ndGggPiAwKVxyXG4gICAgICAgICAgICByZXR1cm4gW25ldyBTY3JpcHRDc1Byb2plY3RWaWV3TW9kZWwod29ya3NwYWNlLCBzb2x1dGlvblBhdGgpXTtcclxuICAgICAgICAqL1xyXG4gICAgICAgIHJldHVybiBbXTtcclxuICAgIH0sXHJcbn07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gd29ya3NwYWNlVmlld01vZGVsRmFjdG9yeShvbW5pc2hhcnBXb3Jrc3BhY2U6IE1vZGVscy5Xb3Jrc3BhY2VJbmZvcm1hdGlvblJlc3BvbnNlLCBzb2x1dGlvblBhdGg6IHN0cmluZykge1xyXG4gICAgY29uc3QgcHJvamVjdHM6IGFueVtdID0gW107XHJcbiAgICBsZXQgc2tpcERueCA9IGZhbHNlO1xyXG4gICAgaWYgKG9tbmlzaGFycFdvcmtzcGFjZVsnRG90TmV0J10gJiYgb21uaXNoYXJwV29ya3NwYWNlWydEbngnXSkgc2tpcERueCA9IHRydWU7XHJcbiAgICBmb3JJbihvbW5pc2hhcnBXb3Jrc3BhY2UsIChpdGVtLCBrZXkpID0+IHtcclxuICAgICAgICBjb25zdCBmYWN0b3J5ID0gd29ya3NwYWNlRmFjdG9yaWVzW2tleV07XHJcbiAgICAgICAgaWYgKHNraXBEbnggJiYgc3RhcnRzV2l0aChrZXksICdEbngnKSkgcmV0dXJuO1xyXG4gICAgICAgIGlmIChmYWN0b3J5KSB7XHJcbiAgICAgICAgICAgIHByb2plY3RzLnB1c2goLi4uZmFjdG9yeShpdGVtLCBzb2x1dGlvblBhdGgpKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gcHJvamVjdHM7XHJcbn1cclxuXHJcbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBQcm9qZWN0Vmlld01vZGVsPFQ+IGltcGxlbWVudHMgSVByb2plY3RWaWV3TW9kZWwge1xyXG4gICAgY29uc3RydWN0b3IocHJvamVjdDogVCwgc29sdXRpb25QYXRoOiBzdHJpbmcpIHtcclxuICAgICAgICB0aGlzLnNvbHV0aW9uUGF0aCA9IHNvbHV0aW9uUGF0aDtcclxuICAgICAgICB0aGlzLmluaXQocHJvamVjdCk7XHJcbiAgICAgICAgdGhpcy5vYnNlcnZlID0geyBhY3RpdmVGcmFtZXdvcms6IDxPYnNlcnZhYmxlPE1vZGVscy5Eb3ROZXRGcmFtZXdvcms+Pjxhbnk+dGhpcy5fc3ViamVjdEFjdGl2ZUZyYW1ld29yayB9O1xyXG4gICAgICAgIHRoaXMuX3N1YmplY3RBY3RpdmVGcmFtZXdvcmsubmV4dCh0aGlzLl9mcmFtZXdvcmtzWzBdKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9uYW1lOiBzdHJpbmc7XHJcbiAgICBwdWJsaWMgZ2V0IG5hbWUoKSB7IHJldHVybiB0aGlzLl9uYW1lOyB9XHJcbiAgICBwdWJsaWMgc2V0IG5hbWUodmFsdWUpIHsgdGhpcy5fbmFtZSA9IHZhbHVlOyB9XHJcblxyXG4gICAgcHJpdmF0ZSBfcGF0aDogc3RyaW5nO1xyXG4gICAgcHVibGljIGdldCBwYXRoKCkgeyByZXR1cm4gdGhpcy5fcGF0aDsgfVxyXG4gICAgcHVibGljIHNldCBwYXRoKHZhbHVlKSB7IHRoaXMuX3BhdGggPSB2YWx1ZTsgfVxyXG5cclxuICAgIHByaXZhdGUgX3NvbHV0aW9uUGF0aDogc3RyaW5nO1xyXG4gICAgcHVibGljIGdldCBzb2x1dGlvblBhdGgoKSB7IHJldHVybiB0aGlzLl9zb2x1dGlvblBhdGg7IH1cclxuICAgIHB1YmxpYyBzZXQgc29sdXRpb25QYXRoKHZhbHVlKSB7IHRoaXMuX3NvbHV0aW9uUGF0aCA9IHZhbHVlOyB9XHJcblxyXG4gICAgcHJpdmF0ZSBfc291cmNlRmlsZXM6IHN0cmluZ1tdID0gW107XHJcbiAgICBwdWJsaWMgZ2V0IHNvdXJjZUZpbGVzKCkgeyByZXR1cm4gdGhpcy5fc291cmNlRmlsZXM7IH1cclxuICAgIHB1YmxpYyBzZXQgc291cmNlRmlsZXModmFsdWUpIHtcclxuICAgICAgICB0aGlzLl9zb3VyY2VGaWxlcyA9IHZhbHVlIHx8IFtdO1xyXG4gICAgICAgIGlmICh0aGlzLl9maWxlc1NldCkgdGhpcy5fZmlsZXNTZXQgPSBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX2ZpbGVzU2V0OiBTZXQ8c3RyaW5nPjtcclxuICAgIHB1YmxpYyBnZXQgZmlsZXNTZXQoKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLl9maWxlc1NldCkge1xyXG4gICAgICAgICAgICB0aGlzLl9maWxlc1NldCA9IG5ldyBTZXQ8c3RyaW5nPigpO1xyXG4gICAgICAgICAgICBlYWNoKHRoaXMuX3NvdXJjZUZpbGVzLCBmaWxlID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2ZpbGVzU2V0LmFkZChmaWxlKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzLl9maWxlc1NldDtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9zdWJqZWN0QWN0aXZlRnJhbWV3b3JrID0gbmV3IFJlcGxheVN1YmplY3Q8TW9kZWxzLkRvdE5ldEZyYW1ld29yaz4oMSk7XHJcbiAgICBwcml2YXRlIF9hY3RpdmVGcmFtZXdvcms6IE1vZGVscy5Eb3ROZXRGcmFtZXdvcms7XHJcbiAgICBwdWJsaWMgZ2V0IGFjdGl2ZUZyYW1ld29yaygpIHtcclxuICAgICAgICBpZiAoIXRoaXMuX2FjdGl2ZUZyYW1ld29yaykge1xyXG4gICAgICAgICAgICB0aGlzLl9hY3RpdmVGcmFtZXdvcmsgPSB0aGlzLmZyYW1ld29ya3NbMF07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzLl9hY3RpdmVGcmFtZXdvcms7XHJcbiAgICB9XHJcbiAgICBwdWJsaWMgc2V0IGFjdGl2ZUZyYW1ld29yayh2YWx1ZSkge1xyXG4gICAgICAgIHRoaXMuX2FjdGl2ZUZyYW1ld29yayA9IHZhbHVlO1xyXG4gICAgICAgIGlmICghdGhpcy5fc3ViamVjdEFjdGl2ZUZyYW1ld29yay5jbG9zZWQpIHtcclxuICAgICAgICAgICAgdGhpcy5fc3ViamVjdEFjdGl2ZUZyYW1ld29yay5uZXh0KHRoaXMuX2FjdGl2ZUZyYW1ld29yayk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX2ZyYW1ld29ya3M6IE1vZGVscy5Eb3ROZXRGcmFtZXdvcmtbXSA9IFt7IEZyaWVuZGx5TmFtZTogJ0FsbCcsIE5hbWU6ICdhbGwnLCBTaG9ydE5hbWU6ICdhbGwnIH1dO1xyXG4gICAgcHVibGljIGdldCBmcmFtZXdvcmtzKCkgeyByZXR1cm4gdGhpcy5fZnJhbWV3b3JrczsgfVxyXG4gICAgcHVibGljIHNldCBmcmFtZXdvcmtzKHZhbHVlKSB7XHJcbiAgICAgICAgdGhpcy5fZnJhbWV3b3JrcyA9IFt7IEZyaWVuZGx5TmFtZTogJ0FsbCcsIE5hbWU6ICdhbGwnLCBTaG9ydE5hbWU6ICdhbGwnIH1dLmNvbmNhdCh2YWx1ZSk7XHJcbiAgICAgICAgaWYgKCF0aGlzLmFjdGl2ZUZyYW1ld29yaykge1xyXG4gICAgICAgICAgICB0aGlzLmFjdGl2ZUZyYW1ld29yayA9IHRoaXMuX2ZyYW1ld29ya3NbMF07XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX2NvbmZpZ3VyYXRpb25zOiBzdHJpbmdbXSA9IFtdO1xyXG4gICAgcHVibGljIGdldCBjb25maWd1cmF0aW9ucygpIHsgcmV0dXJuIHRoaXMuX2NvbmZpZ3VyYXRpb25zOyB9XHJcbiAgICBwdWJsaWMgc2V0IGNvbmZpZ3VyYXRpb25zKHZhbHVlKSB7IHRoaXMuX2NvbmZpZ3VyYXRpb25zID0gdmFsdWUgfHwgW107IH1cclxuXHJcbiAgICBwdWJsaWMgb2JzZXJ2ZToge1xyXG4gICAgICAgIGFjdGl2ZUZyYW1ld29yazogT2JzZXJ2YWJsZTxNb2RlbHMuRG90TmV0RnJhbWV3b3JrPjtcclxuICAgIH07XHJcblxyXG4gICAgcHVibGljIGFic3RyYWN0IGluaXQodmFsdWU6IFQpOiB2b2lkO1xyXG4gICAgcHVibGljIHVwZGF0ZShvdGhlcjogUHJvamVjdFZpZXdNb2RlbDxUPikge1xyXG4gICAgICAgIHRoaXMubmFtZSA9IG90aGVyLm5hbWU7XHJcbiAgICAgICAgdGhpcy5wYXRoID0gb3RoZXIucGF0aDtcclxuICAgICAgICB0aGlzLnNvbHV0aW9uUGF0aCA9IG90aGVyLnNvbHV0aW9uUGF0aDtcclxuICAgICAgICB0aGlzLnNvdXJjZUZpbGVzID0gb3RoZXIuc291cmNlRmlsZXM7XHJcbiAgICAgICAgdGhpcy5mcmFtZXdvcmtzID0gb3RoZXIuZnJhbWV3b3JrcztcclxuICAgICAgICB0aGlzLmFjdGl2ZUZyYW1ld29yayA9IHRoaXMuX2FjdGl2ZUZyYW1ld29yaztcclxuICAgICAgICB0aGlzLmNvbmZpZ3VyYXRpb25zID0gb3RoZXIuY29uZmlndXJhdGlvbnM7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHRvSlNPTigpIHtcclxuICAgICAgICBjb25zdCB7bmFtZSwgcGF0aCwgc29sdXRpb25QYXRoLCBzb3VyY2VGaWxlcywgZnJhbWV3b3JrcywgY29uZmlndXJhdGlvbnN9ID0gdGhpcztcclxuICAgICAgICByZXR1cm4geyBuYW1lLCBwYXRoLCBzb2x1dGlvblBhdGgsIHNvdXJjZUZpbGVzLCBmcmFtZXdvcmtzLCBjb25maWd1cmF0aW9ucyB9O1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkaXNwb3NlKCkge1xyXG4gICAgICAgIHRoaXMuX3N1YmplY3RBY3RpdmVGcmFtZXdvcmsudW5zdWJzY3JpYmUoKTtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIEVtcHR5UHJvamVjdFZpZXdNb2RlbCBleHRlbmRzIFByb2plY3RWaWV3TW9kZWw8UHJvamVjdFZpZXdNb2RlbDxhbnk+PiB7XHJcbiAgICBwdWJsaWMgaW5pdChwcm9qZWN0OiBQcm9qZWN0Vmlld01vZGVsPGFueT4pIHsgLyogKi8gfVxyXG59XHJcblxyXG5jbGFzcyBQcm94eVByb2plY3RWaWV3TW9kZWwgZXh0ZW5kcyBQcm9qZWN0Vmlld01vZGVsPFByb2plY3RWaWV3TW9kZWw8YW55Pj4ge1xyXG4gICAgcHVibGljIGluaXQocHJvamVjdDogUHJvamVjdFZpZXdNb2RlbDxhbnk+KSB7XHJcbiAgICAgICAgdGhpcy51cGRhdGUocHJvamVjdCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmNsYXNzIE1zQnVpbGRQcm9qZWN0Vmlld01vZGVsIGV4dGVuZHMgUHJvamVjdFZpZXdNb2RlbDxNb2RlbHMuTVNCdWlsZFByb2plY3Q+IHtcclxuICAgIHB1YmxpYyBpbml0KHByb2plY3Q6IE1vZGVscy5NU0J1aWxkUHJvamVjdCkge1xyXG4gICAgICAgIGNvbnN0IGZyYW1ld29ya3MgPSBbe1xyXG4gICAgICAgICAgICBGcmllbmRseU5hbWU6IHByb2plY3QuVGFyZ2V0RnJhbWV3b3JrLFxyXG4gICAgICAgICAgICBOYW1lOiBwcm9qZWN0LlRhcmdldEZyYW1ld29yayxcclxuICAgICAgICAgICAgU2hvcnROYW1lOiBwcm9qZWN0LlRhcmdldEZyYW1ld29ya1xyXG4gICAgICAgIH1dO1xyXG5cclxuICAgICAgICB0aGlzLm5hbWUgPSBwcm9qZWN0LkFzc2VtYmx5TmFtZTtcclxuICAgICAgICB0aGlzLnBhdGggPSBwcm9qZWN0LlBhdGg7XHJcbiAgICAgICAgdGhpcy5mcmFtZXdvcmtzID0gZnJhbWV3b3JrcztcclxuICAgICAgICB0aGlzLnNvdXJjZUZpbGVzID0gcHJvamVjdC5Tb3VyY2VGaWxlcztcclxuICAgIH1cclxufVxyXG5cclxuY2xhc3MgRG90TmV0UHJvamVjdFZpZXdNb2RlbCBleHRlbmRzIFByb2plY3RWaWV3TW9kZWw8TW9kZWxzLkRvdE5ldFByb2plY3RJbmZvcm1hdGlvbj4ge1xyXG4gICAgcHVibGljIGluaXQocHJvamVjdDogTW9kZWxzLkRvdE5ldFByb2plY3RJbmZvcm1hdGlvbikge1xyXG4gICAgICAgIHRoaXMubmFtZSA9IHByb2plY3QuTmFtZTtcclxuICAgICAgICB0aGlzLnBhdGggPSBwcm9qZWN0LlBhdGg7XHJcbiAgICAgICAgdGhpcy5mcmFtZXdvcmtzID0gcHJvamVjdC5GcmFtZXdvcmtzIHx8IFtdO1xyXG4gICAgICAgIHRoaXMuY29uZmlndXJhdGlvbnMgPSAocHJvamVjdC5Db25maWd1cmF0aW9ucyB8fCBbXSkubWFwKHggPT4geC5OYW1lKTtcclxuICAgICAgICB0aGlzLnNvdXJjZUZpbGVzID0gcHJvamVjdC5Tb3VyY2VGaWxlcyB8fCBbXTtcclxuICAgIH1cclxufVxyXG5cclxuY2xhc3MgU2NyaXB0Q3NQcm9qZWN0Vmlld01vZGVsIGV4dGVuZHMgUHJvamVjdFZpZXdNb2RlbDxTY3JpcHRDcy5TY3JpcHRDc0NvbnRleHRNb2RlbD4ge1xyXG4gICAgcHVibGljIGluaXQocHJvamVjdDogU2NyaXB0Q3MuU2NyaXB0Q3NDb250ZXh0TW9kZWwpIHtcclxuICAgICAgICB0aGlzLm5hbWUgPSAnU2NyaXB0Q3MnO1xyXG4gICAgICAgIHRoaXMucGF0aCA9IHByb2plY3QuUm9vdFBhdGg7XHJcbiAgICAgICAgdGhpcy5zb3VyY2VGaWxlcyA9IHByb2plY3QuQ3N4RmlsZXNCZWluZ1Byb2Nlc3NlZDtcclxuICAgIH1cclxufVxyXG4iXX0=
