"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.StatusBarElement = exports.ProjectCountElement = exports.DiagnosticsElement = exports.FlameElement = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _rxjs = require("rxjs");

var _omnisharpClient = require("omnisharp-client");

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _omni = require("../server/omni");

var _serverInformation = require("../atom/server-information");

var _solutionManager = require("../server/solution-manager");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var fastdom = require("fastdom");
function addClassIfNotincludes(icon) {
    for (var _len = arguments.length, cls = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        cls[_key - 1] = arguments[_key];
    }

    if (icon) {
        fastdom.measure(function () {
            _lodash2.default.each(cls, function (c) {
                if (!icon.classList.contains(c)) fastdom.mutate(function () {
                    return icon.classList.add(c);
                });
            });
        });
    }
}
function removeClassIfincludes(icon) {
    for (var _len2 = arguments.length, cls = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
        cls[_key2 - 1] = arguments[_key2];
    }

    if (icon) {
        fastdom.measure(function () {
            _lodash2.default.each(cls, function (c) {
                if (icon.classList.contains(c)) fastdom.mutate(function () {
                    return icon.classList.remove(c);
                });
            });
        });
    }
}
function _updateState(self, state) {
    _lodash2.default.each(_omni.Omni.viewModelStatefulProperties, function (x) {
        if (_lodash2.default.has(state, x)) {
            self[x] = state[x];
        }
    });
}

var FlameElement = exports.FlameElement = function (_HTMLAnchorElement) {
    _inherits(FlameElement, _HTMLAnchorElement);

    function FlameElement() {
        _classCallCheck(this, FlameElement);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(FlameElement).apply(this, arguments));
    }

    _createClass(FlameElement, [{
        key: "createdCallback",
        value: function createdCallback() {
            this.classList.add("omnisharp-atom-button");
            this._state = { status: {} };
            var icon = this._icon = document.createElement("span");
            icon.classList.add("icon", "icon-flame");
            this.appendChild(icon);
            var outgoing = this._outgoing = document.createElement("span");
            outgoing.classList.add("outgoing-requests");
            this.appendChild(outgoing);
        }
    }, {
        key: "updateState",
        value: function updateState(state) {
            _updateState(this._state, state);
            var icon = this._icon;
            if (this._state.isOff) {
                removeClassIfincludes(icon, "text-subtle");
            } else {
                addClassIfNotincludes(icon, "text-subtle");
            }
            if (this._state.isReady) {
                addClassIfNotincludes(icon, "text-success");
            } else {
                removeClassIfincludes(icon, "text-success");
            }
            if (this._state.isError) {
                addClassIfNotincludes(icon, "text-error");
            } else {
                removeClassIfincludes(icon, "text-error");
            }
            if (this._state.isConnecting) {
                addClassIfNotincludes(icon, "icon-flame-loading");
                removeClassIfincludes(icon, "icon-flame-processing");
                removeClassIfincludes(icon, "icon-flame-loading");
            } else if (this._state.status.hasOutgoingRequests) {
                addClassIfNotincludes(icon, "icon-flame-processing");
                removeClassIfincludes(icon, "icon-flame-loading");
            } else {
                removeClassIfincludes(icon, "icon-flame-processing");
                removeClassIfincludes(icon, "icon-flame-loading");
            }
        }
    }, {
        key: "updateOutgoing",
        value: function updateOutgoing(status) {
            var _this2 = this;

            if (status.hasOutgoingRequests && status.outgoingRequests > 0) {
                removeClassIfincludes(this._outgoing, "fade");
            } else {
                addClassIfNotincludes(this._outgoing, "fade");
            }
            if (status.outgoingRequests !== this._state.status.outgoingRequests) {
                fastdom.mutate(function () {
                    return _this2._outgoing.innerText = status.outgoingRequests && status.outgoingRequests.toString() || "0";
                });
            }
            this._state.status = status || {};
            this.updateState(this._state);
        }
    }]);

    return FlameElement;
}(HTMLAnchorElement);

exports.FlameElement = document.registerElement("omnisharp-flame", { prototype: FlameElement.prototype });

var DiagnosticsElement = exports.DiagnosticsElement = function (_HTMLAnchorElement2) {
    _inherits(DiagnosticsElement, _HTMLAnchorElement2);

    function DiagnosticsElement() {
        _classCallCheck(this, DiagnosticsElement);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(DiagnosticsElement).apply(this, arguments));
    }

    _createClass(DiagnosticsElement, [{
        key: "createdCallback",
        value: function createdCallback() {
            var _this4 = this;

            this.classList.add("inline-block", "error-warning-summary");
            var sync = this._sync = document.createElement("a");
            sync.classList.add("icon", "icon-sync", "text-subtle");
            this.appendChild(sync);
            sync.onclick = function () {
                return _this4.syncClick();
            };
            var s = document.createElement("span");
            this.appendChild(s);
            s.onclick = function () {
                return _this4.diagnosticClick();
            };
            var errorsIcon = document.createElement("span");
            errorsIcon.classList.add("icon", "icon-issue-opened");
            s.appendChild(errorsIcon);
            var errors = this._errors = document.createElement("span");
            errors.classList.add("error-summary");
            s.appendChild(errors);
            var warningsIcon = document.createElement("span");
            warningsIcon.classList.add("icon", "icon-alert");
            s.appendChild(warningsIcon);
            var warnings = this._warnings = document.createElement("span");
            warnings.classList.add("warning-summary");
            s.appendChild(warnings);
        }
    }, {
        key: "updateState",
        value: function updateState(state) {
            var _this5 = this;

            if (!_lodash2.default.isEqual(this._state, state)) {
                this._state = state;
                fastdom.mutate(function () {
                    if (_this5._state.errorCount) {
                        _this5._errors.innerText = _this5._state.errorCount.toString();
                    } else {
                        _this5._errors.innerText = "0";
                    }
                    if (_this5._state.warningCount) {
                        _this5._warnings.innerText = _this5._state.warningCount.toString();
                    } else {
                        _this5._warnings.innerText = "0";
                    }
                });
            }
        }
    }]);

    return DiagnosticsElement;
}(HTMLAnchorElement);

exports.DiagnosticsElement = document.registerElement("omnisharp-diagnostics", { prototype: DiagnosticsElement.prototype });

var ProjectCountElement = exports.ProjectCountElement = function (_HTMLAnchorElement3) {
    _inherits(ProjectCountElement, _HTMLAnchorElement3);

    function ProjectCountElement() {
        _classCallCheck(this, ProjectCountElement);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(ProjectCountElement).apply(this, arguments));
    }

    _createClass(ProjectCountElement, [{
        key: "createdCallback",
        value: function createdCallback() {
            this.classList.add("inline-block", "project-summary", "projects-icon");
            var icon = document.createElement("span");
            icon.classList.add("icon", "icon-pulse");
            this.appendChild(icon);
            var sub = this._solutionNunmber = document.createElement("sub");
            icon.appendChild(sub);
            var projects = this.projects = document.createElement("span");
            projects.classList.add("projects");
            projects.innerText = "0 Projects";
            this.appendChild(projects);
        }
    }, {
        key: "updateState",
        value: function updateState(state) {
            var _this7 = this;

            if (!_lodash2.default.isEqual(this._state, state)) {
                this._state = state;
                fastdom.mutate(function () {
                    return _this7.projects.innerText = _this7._state.projectCount + " Projects";
                });
            }
        }
    }, {
        key: "updateSolutionNumber",
        value: function updateSolutionNumber(solutionNumber) {
            var _this8 = this;

            fastdom.mutate(function () {
                return _this8._solutionNunmber.innerText = solutionNumber;
            });
        }
    }]);

    return ProjectCountElement;
}(HTMLAnchorElement);

exports.ProjectCountElement = document.registerElement("omnisharp-project-count", { prototype: ProjectCountElement.prototype });

var StatusBarElement = exports.StatusBarElement = function (_HTMLElement) {
    _inherits(StatusBarElement, _HTMLElement);

    function StatusBarElement() {
        var _Object$getPrototypeO;

        _classCallCheck(this, StatusBarElement);

        for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
            args[_key3] = arguments[_key3];
        }

        var _this9 = _possibleConstructorReturn(this, (_Object$getPrototypeO = Object.getPrototypeOf(StatusBarElement)).call.apply(_Object$getPrototypeO, [this].concat(args)));

        _this9._hasValidEditor = false;
        return _this9;
    }

    _createClass(StatusBarElement, [{
        key: "createdCallback",
        value: function createdCallback() {
            var _this10 = this;

            this.classList.add("inline-block");
            var flameElement = this._flame = new exports.FlameElement();
            this.appendChild(flameElement);
            flameElement.onclick = function () {
                return _this10.toggle();
            };
            var projectCount = this._projectCount = new exports.ProjectCountElement();
            this.appendChild(projectCount);
            projectCount.onclick = function () {
                return _this10.toggleSolutionInformation();
            };
            projectCount.projects.style.display = "none";
            var diagnostics = this._diagnostics = new exports.DiagnosticsElement();
            this.appendChild(diagnostics);
            diagnostics.diagnosticClick = function () {
                return _this10.toggleErrorWarningPanel();
            };
            diagnostics.syncClick = function () {
                return _this10.doCodeCheck();
            };
            diagnostics.style.display = "none";
            this._disposable = new _omnisharpClient.CompositeDisposable();
            this._state = { status: {} };
        }
    }, {
        key: "attachedCallback",
        value: function attachedCallback() {
            var _this11 = this;

            this._disposable.add(_omni.Omni.diagnosticsCounts.subscribe(function (counts) {
                _this11._diagnostics.updateState({
                    errorCount: counts["error"] || 0,
                    warningCount: counts["warning"] || 0
                });
            }));
            this._disposable.add(_rxjs.Observable.merge(_omni.Omni.activeModel, _omni.Omni.activeModel.flatMap(function (x) {
                return x.observe.state;
            })).subscribe(function (model) {
                _this11._flame.updateState(model);
                _updateState(_this11._state, model);
                _this11._updateVisible();
            }));
            this._disposable.add(_serverInformation.server.observe.projects.debounceTime(500).subscribe(function (projects) {
                return _this11._projectCount.updateState({ projectCount: projects.length });
            }));
            this._disposable.add(_serverInformation.server.observe.status.subscribe(function (status) {
                return _this11._flame.updateOutgoing(status || {});
            }));
            this._disposable.add(_serverInformation.server.observe.model.subscribe(function (model) {
                var solutionNumber = _solutionManager.SolutionManager.activeSolutions.length > 1 ? _lodash2.default.trim(_serverInformation.server.model && _serverInformation.server.model.index, "client") : "";
                _this11._projectCount.updateSolutionNumber(solutionNumber);
            }));
            this._disposable.add(_omni.Omni.activeEditorOrConfigEditor.subscribe(function (editor) {
                _this11._updateVisible(!!editor);
            }));
            this._disposable.add(_solutionManager.SolutionManager.activeSolution.subscribe(function (solutions) {
                var solutionNumber = _solutionManager.SolutionManager.activeSolutions.length > 1 ? _lodash2.default.trim(_serverInformation.server.model && _serverInformation.server.model.index, "client") : "";
                _this11._projectCount.updateSolutionNumber(solutionNumber);
            }));
        }
    }, {
        key: "_updateVisible",
        value: function _updateVisible(hasValidEditor) {
            if (typeof hasValidEditor !== "undefined") {
                this._hasValidEditor = hasValidEditor;
            }
            if (this._state.isOn && this._hasValidEditor) {
                this._showOnStateItems();
            } else {
                this._hideOnStateItems();
            }
        }
    }, {
        key: "_showOnStateItems",
        value: function _showOnStateItems() {
            var _this12 = this;

            fastdom.measure(function () {
                if (_this12._diagnostics.style.display === "none") {
                    fastdom.mutate(function () {
                        return _this12._diagnostics.style.display = "";
                    });
                }
                if (_this12._projectCount.projects.style.display === "none") {
                    fastdom.mutate(function () {
                        return _this12._projectCount.projects.style.display = "";
                    });
                }
            });
        }
    }, {
        key: "_hideOnStateItems",
        value: function _hideOnStateItems() {
            var _this13 = this;

            fastdom.measure(function () {
                if (_this13._diagnostics.style.display !== "none") {
                    fastdom.mutate(function () {
                        return _this13._diagnostics.style.display = "none";
                    });
                }
                if (_this13._projectCount.projects.style.display !== "none") {
                    fastdom.mutate(function () {
                        return _this13._projectCount.projects.style.display = "none";
                    });
                }
            });
        }
    }, {
        key: "detachedCallback",
        value: function detachedCallback() {
            this._disposable.dispose();
        }
    }, {
        key: "dispose",
        value: function dispose() {
            this._disposable.dispose();
        }
    }, {
        key: "toggle",
        value: function toggle() {
            atom.commands.dispatch(atom.views.getView(atom.workspace), "omnisharp-atom:toggle-dock");
        }
    }, {
        key: "toggleErrorWarningPanel",
        value: function toggleErrorWarningPanel() {
            atom.commands.dispatch(atom.views.getView(atom.workspace), "omnisharp-atom:dock-toggle-errors");
        }
    }, {
        key: "toggleSolutionInformation",
        value: function toggleSolutionInformation() {
            atom.commands.dispatch(atom.views.getView(atom.workspace), "omnisharp-atom:solution-status");
        }
    }, {
        key: "doCodeCheck",
        value: function doCodeCheck() {
            atom.commands.dispatch(atom.views.getView(atom.workspace), "omnisharp-atom:code-check");
        }
    }]);

    return StatusBarElement;
}(HTMLElement);

exports.StatusBarElement = document.registerElement("omnisharp-status-bar", { prototype: StatusBarElement.prototype });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy9zdGF0dXMtYmFyLXZpZXcuanMiLCJsaWIvdmlld3Mvc3RhdHVzLWJhci12aWV3LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQUNBOztBQUNBOzs7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7Ozs7Ozs7QUNHQSxJQUFJLFVBQTBCLFFBQVEsU0FBUixDQUE5QjtBQUVBLFNBQUEscUJBQUEsQ0FBK0IsSUFBL0IsRUFBa0U7QUFBQSxzQ0FBYixHQUFhO0FBQWIsV0FBYTtBQUFBOztBQUM5RCxRQUFJLElBQUosRUFBVTtBQUNOLGdCQUFRLE9BQVIsQ0FBZ0IsWUFBQTtBQUNaLDZCQUFFLElBQUYsQ0FBTyxHQUFQLEVBQVksYUFBQztBQUNULG9CQUFJLENBQUMsS0FBSyxTQUFMLENBQWUsUUFBZixDQUF3QixDQUF4QixDQUFMLEVBQ0ksUUFBUSxNQUFSLENBQWU7QUFBQSwyQkFBTSxLQUFLLFNBQUwsQ0FBZSxHQUFmLENBQW1CLENBQW5CLENBQU47QUFBQSxpQkFBZjtBQUNQLGFBSEQ7QUFJSCxTQUxEO0FBTUg7QUFDSjtBQUNELFNBQUEscUJBQUEsQ0FBK0IsSUFBL0IsRUFBa0U7QUFBQSx1Q0FBYixHQUFhO0FBQWIsV0FBYTtBQUFBOztBQUM5RCxRQUFJLElBQUosRUFBVTtBQUNOLGdCQUFRLE9BQVIsQ0FBZ0IsWUFBQTtBQUNaLDZCQUFFLElBQUYsQ0FBTyxHQUFQLEVBQVksYUFBQztBQUNULG9CQUFJLEtBQUssU0FBTCxDQUFlLFFBQWYsQ0FBd0IsQ0FBeEIsQ0FBSixFQUNJLFFBQVEsTUFBUixDQUFlO0FBQUEsMkJBQU0sS0FBSyxTQUFMLENBQWUsTUFBZixDQUFzQixDQUF0QixDQUFOO0FBQUEsaUJBQWY7QUFDUCxhQUhEO0FBSUgsU0FMRDtBQU1IO0FBQ0o7QUFXRCxTQUFBLFlBQUEsQ0FBcUIsSUFBckIsRUFBZ0MsS0FBaEMsRUFBMEM7QUFDdEMscUJBQUUsSUFBRixDQUFPLFdBQUssMkJBQVosRUFBeUMs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QUFTLGdCQUFULEdBQWtDLFNBQVUsZUFBVixDQUEwQixzQkFBMUIsRUFBa0QsRUFBRSxXQUFXLGlCQUFpQixTQUE5QixFQUFsRCxDQUFsQyIsImZpbGUiOiJsaWIvdmlld3Mvc3RhdHVzLWJhci12aWV3LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgT2JzZXJ2YWJsZSB9IGZyb20gXCJyeGpzXCI7XG5pbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlIH0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcbmltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcbmltcG9ydCB7IE9tbmkgfSBmcm9tIFwiLi4vc2VydmVyL29tbmlcIjtcbmltcG9ydCB7IHNlcnZlciB9IGZyb20gXCIuLi9hdG9tL3NlcnZlci1pbmZvcm1hdGlvblwiO1xuaW1wb3J0IHsgU29sdXRpb25NYW5hZ2VyIH0gZnJvbSBcIi4uL3NlcnZlci9zb2x1dGlvbi1tYW5hZ2VyXCI7XG5sZXQgZmFzdGRvbSA9IHJlcXVpcmUoXCJmYXN0ZG9tXCIpO1xuZnVuY3Rpb24gYWRkQ2xhc3NJZk5vdGluY2x1ZGVzKGljb24sIC4uLmNscykge1xuICAgIGlmIChpY29uKSB7XG4gICAgICAgIGZhc3Rkb20ubWVhc3VyZSgoKSA9PiB7XG4gICAgICAgICAgICBfLmVhY2goY2xzLCBjID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoIWljb24uY2xhc3NMaXN0LmNvbnRhaW5zKGMpKVxuICAgICAgICAgICAgICAgICAgICBmYXN0ZG9tLm11dGF0ZSgoKSA9PiBpY29uLmNsYXNzTGlzdC5hZGQoYykpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHJlbW92ZUNsYXNzSWZpbmNsdWRlcyhpY29uLCAuLi5jbHMpIHtcbiAgICBpZiAoaWNvbikge1xuICAgICAgICBmYXN0ZG9tLm1lYXN1cmUoKCkgPT4ge1xuICAgICAgICAgICAgXy5lYWNoKGNscywgYyA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGljb24uY2xhc3NMaXN0LmNvbnRhaW5zKGMpKVxuICAgICAgICAgICAgICAgICAgICBmYXN0ZG9tLm11dGF0ZSgoKSA9PiBpY29uLmNsYXNzTGlzdC5yZW1vdmUoYykpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHVwZGF0ZVN0YXRlKHNlbGYsIHN0YXRlKSB7XG4gICAgXy5lYWNoKE9tbmkudmlld01vZGVsU3RhdGVmdWxQcm9wZXJ0aWVzLCB4ID0+IHtcbiAgICAgICAgaWYgKF8uaGFzKHN0YXRlLCB4KSkge1xuICAgICAgICAgICAgc2VsZlt4XSA9IHN0YXRlW3hdO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5leHBvcnQgY2xhc3MgRmxhbWVFbGVtZW50IGV4dGVuZHMgSFRNTEFuY2hvckVsZW1lbnQge1xuICAgIGNyZWF0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdGhpcy5jbGFzc0xpc3QuYWRkKFwib21uaXNoYXJwLWF0b20tYnV0dG9uXCIpO1xuICAgICAgICB0aGlzLl9zdGF0ZSA9IHsgc3RhdHVzOiB7fSB9O1xuICAgICAgICBjb25zdCBpY29uID0gdGhpcy5faWNvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICBpY29uLmNsYXNzTGlzdC5hZGQoXCJpY29uXCIsIFwiaWNvbi1mbGFtZVwiKTtcbiAgICAgICAgdGhpcy5hcHBlbmRDaGlsZChpY29uKTtcbiAgICAgICAgY29uc3Qgb3V0Z29pbmcgPSB0aGlzLl9vdXRnb2luZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICBvdXRnb2luZy5jbGFzc0xpc3QuYWRkKFwib3V0Z29pbmctcmVxdWVzdHNcIik7XG4gICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQob3V0Z29pbmcpO1xuICAgIH1cbiAgICB1cGRhdGVTdGF0ZShzdGF0ZSkge1xuICAgICAgICB1cGRhdGVTdGF0ZSh0aGlzLl9zdGF0ZSwgc3RhdGUpO1xuICAgICAgICBjb25zdCBpY29uID0gdGhpcy5faWNvbjtcbiAgICAgICAgaWYgKHRoaXMuX3N0YXRlLmlzT2ZmKSB7XG4gICAgICAgICAgICByZW1vdmVDbGFzc0lmaW5jbHVkZXMoaWNvbiwgXCJ0ZXh0LXN1YnRsZVwiKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGFkZENsYXNzSWZOb3RpbmNsdWRlcyhpY29uLCBcInRleHQtc3VidGxlXCIpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLl9zdGF0ZS5pc1JlYWR5KSB7XG4gICAgICAgICAgICBhZGRDbGFzc0lmTm90aW5jbHVkZXMoaWNvbiwgXCJ0ZXh0LXN1Y2Nlc3NcIik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZW1vdmVDbGFzc0lmaW5jbHVkZXMoaWNvbiwgXCJ0ZXh0LXN1Y2Nlc3NcIik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuX3N0YXRlLmlzRXJyb3IpIHtcbiAgICAgICAgICAgIGFkZENsYXNzSWZOb3RpbmNsdWRlcyhpY29uLCBcInRleHQtZXJyb3JcIik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZW1vdmVDbGFzc0lmaW5jbHVkZXMoaWNvbiwgXCJ0ZXh0LWVycm9yXCIpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLl9zdGF0ZS5pc0Nvbm5lY3RpbmcpIHtcbiAgICAgICAgICAgIGFkZENsYXNzSWZOb3RpbmNsdWRlcyhpY29uLCBcImljb24tZmxhbWUtbG9hZGluZ1wiKTtcbiAgICAgICAgICAgIHJlbW92ZUNsYXNzSWZpbmNsdWRlcyhpY29uLCBcImljb24tZmxhbWUtcHJvY2Vzc2luZ1wiKTtcbiAgICAgICAgICAgIHJlbW92ZUNsYXNzSWZpbmNsdWRlcyhpY29uLCBcImljb24tZmxhbWUtbG9hZGluZ1wiKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh0aGlzLl9zdGF0ZS5zdGF0dXMuaGFzT3V0Z29pbmdSZXF1ZXN0cykge1xuICAgICAgICAgICAgYWRkQ2xhc3NJZk5vdGluY2x1ZGVzKGljb24sIFwiaWNvbi1mbGFtZS1wcm9jZXNzaW5nXCIpO1xuICAgICAgICAgICAgcmVtb3ZlQ2xhc3NJZmluY2x1ZGVzKGljb24sIFwiaWNvbi1mbGFtZS1sb2FkaW5nXCIpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmVtb3ZlQ2xhc3NJZmluY2x1ZGVzKGljb24sIFwiaWNvbi1mbGFtZS1wcm9jZXNzaW5nXCIpO1xuICAgICAgICAgICAgcmVtb3ZlQ2xhc3NJZmluY2x1ZGVzKGljb24sIFwiaWNvbi1mbGFtZS1sb2FkaW5nXCIpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHVwZGF0ZU91dGdvaW5nKHN0YXR1cykge1xuICAgICAgICBpZiAoc3RhdHVzLmhhc091dGdvaW5nUmVxdWVzdHMgJiYgc3RhdHVzLm91dGdvaW5nUmVxdWVzdHMgPiAwKSB7XG4gICAgICAgICAgICByZW1vdmVDbGFzc0lmaW5jbHVkZXModGhpcy5fb3V0Z29pbmcsIFwiZmFkZVwiKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGFkZENsYXNzSWZOb3RpbmNsdWRlcyh0aGlzLl9vdXRnb2luZywgXCJmYWRlXCIpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzdGF0dXMub3V0Z29pbmdSZXF1ZXN0cyAhPT0gdGhpcy5fc3RhdGUuc3RhdHVzLm91dGdvaW5nUmVxdWVzdHMpIHtcbiAgICAgICAgICAgIGZhc3Rkb20ubXV0YXRlKCgpID0+IHRoaXMuX291dGdvaW5nLmlubmVyVGV4dCA9IHN0YXR1cy5vdXRnb2luZ1JlcXVlc3RzICYmIHN0YXR1cy5vdXRnb2luZ1JlcXVlc3RzLnRvU3RyaW5nKCkgfHwgXCIwXCIpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3N0YXRlLnN0YXR1cyA9IHN0YXR1cyB8fCB7fTtcbiAgICAgICAgdGhpcy51cGRhdGVTdGF0ZSh0aGlzLl9zdGF0ZSk7XG4gICAgfVxufVxuZXhwb3J0cy5GbGFtZUVsZW1lbnQgPSBkb2N1bWVudC5yZWdpc3RlckVsZW1lbnQoXCJvbW5pc2hhcnAtZmxhbWVcIiwgeyBwcm90b3R5cGU6IEZsYW1lRWxlbWVudC5wcm90b3R5cGUgfSk7XG5leHBvcnQgY2xhc3MgRGlhZ25vc3RpY3NFbGVtZW50IGV4dGVuZHMgSFRNTEFuY2hvckVsZW1lbnQge1xuICAgIGNyZWF0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdGhpcy5jbGFzc0xpc3QuYWRkKFwiaW5saW5lLWJsb2NrXCIsIFwiZXJyb3Itd2FybmluZy1zdW1tYXJ5XCIpO1xuICAgICAgICBjb25zdCBzeW5jID0gdGhpcy5fc3luYyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJhXCIpO1xuICAgICAgICBzeW5jLmNsYXNzTGlzdC5hZGQoXCJpY29uXCIsIFwiaWNvbi1zeW5jXCIsIFwidGV4dC1zdWJ0bGVcIik7XG4gICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQoc3luYyk7XG4gICAgICAgIHN5bmMub25jbGljayA9ICgpID0+IHRoaXMuc3luY0NsaWNrKCk7XG4gICAgICAgIGNvbnN0IHMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgdGhpcy5hcHBlbmRDaGlsZChzKTtcbiAgICAgICAgcy5vbmNsaWNrID0gKCkgPT4gdGhpcy5kaWFnbm9zdGljQ2xpY2soKTtcbiAgICAgICAgY29uc3QgZXJyb3JzSWNvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICBlcnJvcnNJY29uLmNsYXNzTGlzdC5hZGQoXCJpY29uXCIsIFwiaWNvbi1pc3N1ZS1vcGVuZWRcIik7XG4gICAgICAgIHMuYXBwZW5kQ2hpbGQoZXJyb3JzSWNvbik7XG4gICAgICAgIGNvbnN0IGVycm9ycyA9IHRoaXMuX2Vycm9ycyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICBlcnJvcnMuY2xhc3NMaXN0LmFkZChcImVycm9yLXN1bW1hcnlcIik7XG4gICAgICAgIHMuYXBwZW5kQ2hpbGQoZXJyb3JzKTtcbiAgICAgICAgY29uc3Qgd2FybmluZ3NJY29uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICAgIHdhcm5pbmdzSWNvbi5jbGFzc0xpc3QuYWRkKFwiaWNvblwiLCBcImljb24tYWxlcnRcIik7XG4gICAgICAgIHMuYXBwZW5kQ2hpbGQod2FybmluZ3NJY29uKTtcbiAgICAgICAgY29uc3Qgd2FybmluZ3MgPSB0aGlzLl93YXJuaW5ncyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICB3YXJuaW5ncy5jbGFzc0xpc3QuYWRkKFwid2FybmluZy1zdW1tYXJ5XCIpO1xuICAgICAgICBzLmFwcGVuZENoaWxkKHdhcm5pbmdzKTtcbiAgICB9XG4gICAgdXBkYXRlU3RhdGUoc3RhdGUpIHtcbiAgICAgICAgaWYgKCFfLmlzRXF1YWwodGhpcy5fc3RhdGUsIHN0YXRlKSkge1xuICAgICAgICAgICAgdGhpcy5fc3RhdGUgPSBzdGF0ZTtcbiAgICAgICAgICAgIGZhc3Rkb20ubXV0YXRlKCgpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fc3RhdGUuZXJyb3JDb3VudCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9lcnJvcnMuaW5uZXJUZXh0ID0gdGhpcy5fc3RhdGUuZXJyb3JDb3VudC50b1N0cmluZygpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZXJyb3JzLmlubmVyVGV4dCA9IFwiMFwiO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fc3RhdGUud2FybmluZ0NvdW50KSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3dhcm5pbmdzLmlubmVyVGV4dCA9IHRoaXMuX3N0YXRlLndhcm5pbmdDb3VudC50b1N0cmluZygpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fd2FybmluZ3MuaW5uZXJUZXh0ID0gXCIwXCI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5leHBvcnRzLkRpYWdub3N0aWNzRWxlbWVudCA9IGRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudChcIm9tbmlzaGFycC1kaWFnbm9zdGljc1wiLCB7IHByb3RvdHlwZTogRGlhZ25vc3RpY3NFbGVtZW50LnByb3RvdHlwZSB9KTtcbmV4cG9ydCBjbGFzcyBQcm9qZWN0Q291bnRFbGVtZW50IGV4dGVuZHMgSFRNTEFuY2hvckVsZW1lbnQge1xuICAgIGNyZWF0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdGhpcy5jbGFzc0xpc3QuYWRkKFwiaW5saW5lLWJsb2NrXCIsIFwicHJvamVjdC1zdW1tYXJ5XCIsIFwicHJvamVjdHMtaWNvblwiKTtcbiAgICAgICAgY29uc3QgaWNvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICBpY29uLmNsYXNzTGlzdC5hZGQoXCJpY29uXCIsIFwiaWNvbi1wdWxzZVwiKTtcbiAgICAgICAgdGhpcy5hcHBlbmRDaGlsZChpY29uKTtcbiAgICAgICAgY29uc3Qgc3ViID0gdGhpcy5fc29sdXRpb25OdW5tYmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInN1YlwiKTtcbiAgICAgICAgaWNvbi5hcHBlbmRDaGlsZChzdWIpO1xuICAgICAgICBjb25zdCBwcm9qZWN0cyA9IHRoaXMucHJvamVjdHMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgcHJvamVjdHMuY2xhc3NMaXN0LmFkZChcInByb2plY3RzXCIpO1xuICAgICAgICBwcm9qZWN0cy5pbm5lclRleHQgPSBcIjAgUHJvamVjdHNcIjtcbiAgICAgICAgdGhpcy5hcHBlbmRDaGlsZChwcm9qZWN0cyk7XG4gICAgfVxuICAgIHVwZGF0ZVN0YXRlKHN0YXRlKSB7XG4gICAgICAgIGlmICghXy5pc0VxdWFsKHRoaXMuX3N0YXRlLCBzdGF0ZSkpIHtcbiAgICAgICAgICAgIHRoaXMuX3N0YXRlID0gc3RhdGU7XG4gICAgICAgICAgICBmYXN0ZG9tLm11dGF0ZSgoKSA9PiB0aGlzLnByb2plY3RzLmlubmVyVGV4dCA9IGAke3RoaXMuX3N0YXRlLnByb2plY3RDb3VudH0gUHJvamVjdHNgKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICB1cGRhdGVTb2x1dGlvbk51bWJlcihzb2x1dGlvbk51bWJlcikge1xuICAgICAgICBmYXN0ZG9tLm11dGF0ZSgoKSA9PiB0aGlzLl9zb2x1dGlvbk51bm1iZXIuaW5uZXJUZXh0ID0gc29sdXRpb25OdW1iZXIpO1xuICAgIH1cbn1cbmV4cG9ydHMuUHJvamVjdENvdW50RWxlbWVudCA9IGRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudChcIm9tbmlzaGFycC1wcm9qZWN0LWNvdW50XCIsIHsgcHJvdG90eXBlOiBQcm9qZWN0Q291bnRFbGVtZW50LnByb3RvdHlwZSB9KTtcbmV4cG9ydCBjbGFzcyBTdGF0dXNCYXJFbGVtZW50IGV4dGVuZHMgSFRNTEVsZW1lbnQge1xuICAgIGNvbnN0cnVjdG9yKC4uLmFyZ3MpIHtcbiAgICAgICAgc3VwZXIoLi4uYXJncyk7XG4gICAgICAgIHRoaXMuX2hhc1ZhbGlkRWRpdG9yID0gZmFsc2U7XG4gICAgfVxuICAgIGNyZWF0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdGhpcy5jbGFzc0xpc3QuYWRkKFwiaW5saW5lLWJsb2NrXCIpO1xuICAgICAgICBjb25zdCBmbGFtZUVsZW1lbnQgPSB0aGlzLl9mbGFtZSA9IG5ldyBleHBvcnRzLkZsYW1lRWxlbWVudCgpO1xuICAgICAgICB0aGlzLmFwcGVuZENoaWxkKGZsYW1lRWxlbWVudCk7XG4gICAgICAgIGZsYW1lRWxlbWVudC5vbmNsaWNrID0gKCkgPT4gdGhpcy50b2dnbGUoKTtcbiAgICAgICAgY29uc3QgcHJvamVjdENvdW50ID0gdGhpcy5fcHJvamVjdENvdW50ID0gbmV3IGV4cG9ydHMuUHJvamVjdENvdW50RWxlbWVudCgpO1xuICAgICAgICB0aGlzLmFwcGVuZENoaWxkKHByb2plY3RDb3VudCk7XG4gICAgICAgIHByb2plY3RDb3VudC5vbmNsaWNrID0gKCkgPT4gdGhpcy50b2dnbGVTb2x1dGlvbkluZm9ybWF0aW9uKCk7XG4gICAgICAgIHByb2plY3RDb3VudC5wcm9qZWN0cy5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgIGNvbnN0IGRpYWdub3N0aWNzID0gdGhpcy5fZGlhZ25vc3RpY3MgPSBuZXcgZXhwb3J0cy5EaWFnbm9zdGljc0VsZW1lbnQoKTtcbiAgICAgICAgdGhpcy5hcHBlbmRDaGlsZChkaWFnbm9zdGljcyk7XG4gICAgICAgIGRpYWdub3N0aWNzLmRpYWdub3N0aWNDbGljayA9ICgpID0+IHRoaXMudG9nZ2xlRXJyb3JXYXJuaW5nUGFuZWwoKTtcbiAgICAgICAgZGlhZ25vc3RpY3Muc3luY0NsaWNrID0gKCkgPT4gdGhpcy5kb0NvZGVDaGVjaygpO1xuICAgICAgICBkaWFnbm9zdGljcy5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICB0aGlzLl9zdGF0ZSA9IHsgc3RhdHVzOiB7fSB9O1xuICAgIH1cbiAgICBhdHRhY2hlZENhbGxiYWNrKCkge1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChPbW5pLmRpYWdub3N0aWNzQ291bnRzLnN1YnNjcmliZShjb3VudHMgPT4ge1xuICAgICAgICAgICAgdGhpcy5fZGlhZ25vc3RpY3MudXBkYXRlU3RhdGUoe1xuICAgICAgICAgICAgICAgIGVycm9yQ291bnQ6IGNvdW50c1tcImVycm9yXCJdIHx8IDAsXG4gICAgICAgICAgICAgICAgd2FybmluZ0NvdW50OiBjb3VudHNbXCJ3YXJuaW5nXCJdIHx8IDBcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKE9ic2VydmFibGUubWVyZ2UoT21uaS5hY3RpdmVNb2RlbCwgT21uaS5hY3RpdmVNb2RlbC5mbGF0TWFwKHggPT4geC5vYnNlcnZlLnN0YXRlKSlcbiAgICAgICAgICAgIC5zdWJzY3JpYmUobW9kZWwgPT4ge1xuICAgICAgICAgICAgdGhpcy5fZmxhbWUudXBkYXRlU3RhdGUobW9kZWwpO1xuICAgICAgICAgICAgdXBkYXRlU3RhdGUodGhpcy5fc3RhdGUsIG1vZGVsKTtcbiAgICAgICAgICAgIHRoaXMuX3VwZGF0ZVZpc2libGUoKTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChzZXJ2ZXIub2JzZXJ2ZS5wcm9qZWN0c1xuICAgICAgICAgICAgLmRlYm91bmNlVGltZSg1MDApXG4gICAgICAgICAgICAuc3Vic2NyaWJlKHByb2plY3RzID0+IHRoaXMuX3Byb2plY3RDb3VudC51cGRhdGVTdGF0ZSh7IHByb2plY3RDb3VudDogcHJvamVjdHMubGVuZ3RoIH0pKSk7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKHNlcnZlci5vYnNlcnZlLnN0YXR1c1xuICAgICAgICAgICAgLnN1YnNjcmliZShzdGF0dXMgPT4gdGhpcy5fZmxhbWUudXBkYXRlT3V0Z29pbmcoc3RhdHVzIHx8IHt9KSkpO1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChzZXJ2ZXIub2JzZXJ2ZS5tb2RlbFxuICAgICAgICAgICAgLnN1YnNjcmliZShtb2RlbCA9PiB7XG4gICAgICAgICAgICBjb25zdCBzb2x1dGlvbk51bWJlciA9IFNvbHV0aW9uTWFuYWdlci5hY3RpdmVTb2x1dGlvbnMubGVuZ3RoID4gMSA/IF8udHJpbShzZXJ2ZXIubW9kZWwgJiYgc2VydmVyLm1vZGVsLmluZGV4LCBcImNsaWVudFwiKSA6IFwiXCI7XG4gICAgICAgICAgICB0aGlzLl9wcm9qZWN0Q291bnQudXBkYXRlU29sdXRpb25OdW1iZXIoc29sdXRpb25OdW1iZXIpO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKE9tbmkuYWN0aXZlRWRpdG9yT3JDb25maWdFZGl0b3Iuc3Vic2NyaWJlKGVkaXRvciA9PiB7XG4gICAgICAgICAgICB0aGlzLl91cGRhdGVWaXNpYmxlKCEhZWRpdG9yKTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChTb2x1dGlvbk1hbmFnZXIuYWN0aXZlU29sdXRpb25cbiAgICAgICAgICAgIC5zdWJzY3JpYmUoc29sdXRpb25zID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHNvbHV0aW9uTnVtYmVyID0gU29sdXRpb25NYW5hZ2VyLmFjdGl2ZVNvbHV0aW9ucy5sZW5ndGggPiAxID8gXy50cmltKHNlcnZlci5tb2RlbCAmJiBzZXJ2ZXIubW9kZWwuaW5kZXgsIFwiY2xpZW50XCIpIDogXCJcIjtcbiAgICAgICAgICAgIHRoaXMuX3Byb2plY3RDb3VudC51cGRhdGVTb2x1dGlvbk51bWJlcihzb2x1dGlvbk51bWJlcik7XG4gICAgICAgIH0pKTtcbiAgICB9XG4gICAgX3VwZGF0ZVZpc2libGUoaGFzVmFsaWRFZGl0b3IpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBoYXNWYWxpZEVkaXRvciAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgICAgdGhpcy5faGFzVmFsaWRFZGl0b3IgPSBoYXNWYWxpZEVkaXRvcjtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5fc3RhdGUuaXNPbiAmJiB0aGlzLl9oYXNWYWxpZEVkaXRvcikge1xuICAgICAgICAgICAgdGhpcy5fc2hvd09uU3RhdGVJdGVtcygpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5faGlkZU9uU3RhdGVJdGVtcygpO1xuICAgICAgICB9XG4gICAgfVxuICAgIF9zaG93T25TdGF0ZUl0ZW1zKCkge1xuICAgICAgICBmYXN0ZG9tLm1lYXN1cmUoKCkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMuX2RpYWdub3N0aWNzLnN0eWxlLmRpc3BsYXkgPT09IFwibm9uZVwiKSB7XG4gICAgICAgICAgICAgICAgZmFzdGRvbS5tdXRhdGUoKCkgPT4gdGhpcy5fZGlhZ25vc3RpY3Muc3R5bGUuZGlzcGxheSA9IFwiXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMuX3Byb2plY3RDb3VudC5wcm9qZWN0cy5zdHlsZS5kaXNwbGF5ID09PSBcIm5vbmVcIikge1xuICAgICAgICAgICAgICAgIGZhc3Rkb20ubXV0YXRlKCgpID0+IHRoaXMuX3Byb2plY3RDb3VudC5wcm9qZWN0cy5zdHlsZS5kaXNwbGF5ID0gXCJcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBfaGlkZU9uU3RhdGVJdGVtcygpIHtcbiAgICAgICAgZmFzdGRvbS5tZWFzdXJlKCgpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9kaWFnbm9zdGljcy5zdHlsZS5kaXNwbGF5ICE9PSBcIm5vbmVcIikge1xuICAgICAgICAgICAgICAgIGZhc3Rkb20ubXV0YXRlKCgpID0+IHRoaXMuX2RpYWdub3N0aWNzLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5fcHJvamVjdENvdW50LnByb2plY3RzLnN0eWxlLmRpc3BsYXkgIT09IFwibm9uZVwiKSB7XG4gICAgICAgICAgICAgICAgZmFzdGRvbS5tdXRhdGUoKCkgPT4gdGhpcy5fcHJvamVjdENvdW50LnByb2plY3RzLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBkZXRhY2hlZENhbGxiYWNrKCkge1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICB9XG4gICAgZGlzcG9zZSgpIHtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfVxuICAgIHRvZ2dsZSgpIHtcbiAgICAgICAgYXRvbS5jb21tYW5kcy5kaXNwYXRjaChhdG9tLnZpZXdzLmdldFZpZXcoYXRvbS53b3Jrc3BhY2UpLCBcIm9tbmlzaGFycC1hdG9tOnRvZ2dsZS1kb2NrXCIpO1xuICAgIH1cbiAgICB0b2dnbGVFcnJvcldhcm5pbmdQYW5lbCgpIHtcbiAgICAgICAgYXRvbS5jb21tYW5kcy5kaXNwYXRjaChhdG9tLnZpZXdzLmdldFZpZXcoYXRvbS53b3Jrc3BhY2UpLCBcIm9tbmlzaGFycC1hdG9tOmRvY2stdG9nZ2xlLWVycm9yc1wiKTtcbiAgICB9XG4gICAgdG9nZ2xlU29sdXRpb25JbmZvcm1hdGlvbigpIHtcbiAgICAgICAgYXRvbS5jb21tYW5kcy5kaXNwYXRjaChhdG9tLnZpZXdzLmdldFZpZXcoYXRvbS53b3Jrc3BhY2UpLCBcIm9tbmlzaGFycC1hdG9tOnNvbHV0aW9uLXN0YXR1c1wiKTtcbiAgICB9XG4gICAgZG9Db2RlQ2hlY2soKSB7XG4gICAgICAgIGF0b20uY29tbWFuZHMuZGlzcGF0Y2goYXRvbS52aWV3cy5nZXRWaWV3KGF0b20ud29ya3NwYWNlKSwgXCJvbW5pc2hhcnAtYXRvbTpjb2RlLWNoZWNrXCIpO1xuICAgIH1cbn1cbmV4cG9ydHMuU3RhdHVzQmFyRWxlbWVudCA9IGRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudChcIm9tbmlzaGFycC1zdGF0dXMtYmFyXCIsIHsgcHJvdG90eXBlOiBTdGF0dXNCYXJFbGVtZW50LnByb3RvdHlwZSB9KTtcbiIsIi8qIHRzbGludDpkaXNhYmxlOm5vLXN0cmluZy1saXRlcmFsICovXHJcbmltcG9ydCB7T2JzZXJ2YWJsZX0gZnJvbSBcInJ4anNcIjtcclxuaW1wb3J0IHtDb21wb3NpdGVEaXNwb3NhYmxlLCBJRGlzcG9zYWJsZX0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcclxuaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xyXG5pbXBvcnQge09tbml9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xyXG5pbXBvcnQge09tbmlzaGFycENsaWVudFN0YXR1c30gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcclxuaW1wb3J0IHtzZXJ2ZXJ9IGZyb20gXCIuLi9hdG9tL3NlcnZlci1pbmZvcm1hdGlvblwiO1xyXG5pbXBvcnQge1NvbHV0aW9uTWFuYWdlcn0gZnJvbSBcIi4uL3NlcnZlci9zb2x1dGlvbi1tYW5hZ2VyXCI7XHJcbmxldCBmYXN0ZG9tOiB0eXBlb2YgRmFzdGRvbSA9IHJlcXVpcmUoXCJmYXN0ZG9tXCIpO1xyXG5cclxuZnVuY3Rpb24gYWRkQ2xhc3NJZk5vdGluY2x1ZGVzKGljb246IEhUTUxFbGVtZW50LCAuLi5jbHM6IHN0cmluZ1tdKSB7XHJcbiAgICBpZiAoaWNvbikge1xyXG4gICAgICAgIGZhc3Rkb20ubWVhc3VyZSgoKSA9PiB7XHJcbiAgICAgICAgICAgIF8uZWFjaChjbHMsIGMgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFpY29uLmNsYXNzTGlzdC5jb250YWlucyhjKSlcclxuICAgICAgICAgICAgICAgICAgICBmYXN0ZG9tLm11dGF0ZSgoKSA9PiBpY29uLmNsYXNzTGlzdC5hZGQoYykpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxufVxyXG5mdW5jdGlvbiByZW1vdmVDbGFzc0lmaW5jbHVkZXMoaWNvbjogSFRNTEVsZW1lbnQsIC4uLmNsczogc3RyaW5nW10pIHtcclxuICAgIGlmIChpY29uKSB7XHJcbiAgICAgICAgZmFzdGRvbS5tZWFzdXJlKCgpID0+IHtcclxuICAgICAgICAgICAgXy5lYWNoKGNscywgYyA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoaWNvbi5jbGFzc0xpc3QuY29udGFpbnMoYykpXHJcbiAgICAgICAgICAgICAgICAgICAgZmFzdGRvbS5tdXRhdGUoKCkgPT4gaWNvbi5jbGFzc0xpc3QucmVtb3ZlKGMpKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmludGVyZmFjZSBTdGF0dXNCYXJTdGF0ZSB7XHJcbiAgICBpc09mZj86IGJvb2xlYW47XHJcbiAgICBpc0Nvbm5lY3Rpbmc/OiBib29sZWFuO1xyXG4gICAgaXNPbj86IGJvb2xlYW47XHJcbiAgICBpc1JlYWR5PzogYm9vbGVhbjtcclxuICAgIGlzRXJyb3I/OiBib29sZWFuO1xyXG4gICAgc3RhdHVzPzogT21uaXNoYXJwQ2xpZW50U3RhdHVzO1xyXG59XHJcblxyXG5mdW5jdGlvbiB1cGRhdGVTdGF0ZShzZWxmOiBhbnksIHN0YXRlOiBhbnkpIHtcclxuICAgIF8uZWFjaChPbW5pLnZpZXdNb2RlbFN0YXRlZnVsUHJvcGVydGllcywgeCA9PiB7XHJcbiAgICAgICAgaWYgKF8uaGFzKHN0YXRlLCB4KSkge1xyXG4gICAgICAgICAgICBzZWxmW3hdID0gc3RhdGVbeF07XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBGbGFtZUVsZW1lbnQgZXh0ZW5kcyBIVE1MQW5jaG9yRWxlbWVudCBpbXBsZW1lbnRzIFdlYkNvbXBvbmVudCB7XHJcbiAgICBwcml2YXRlIF9zdGF0ZToge1xyXG4gICAgICAgIGlzT2ZmPzogYm9vbGVhbjtcclxuICAgICAgICBpc0Nvbm5lY3Rpbmc/OiBib29sZWFuO1xyXG4gICAgICAgIGlzT24/OiBib29sZWFuO1xyXG4gICAgICAgIGlzUmVhZHk/OiBib29sZWFuO1xyXG4gICAgICAgIGlzRXJyb3I/OiBib29sZWFuO1xyXG4gICAgICAgIHN0YXR1cz86IE9tbmlzaGFycENsaWVudFN0YXR1cztcclxuICAgIH07XHJcblxyXG4gICAgcHJpdmF0ZSBfaWNvbjogSFRNTFNwYW5FbGVtZW50O1xyXG4gICAgcHJpdmF0ZSBfb3V0Z29pbmc6IEhUTUxTcGFuRWxlbWVudDtcclxuXHJcbiAgICBwdWJsaWMgY3JlYXRlZENhbGxiYWNrKCkge1xyXG4gICAgICAgIHRoaXMuY2xhc3NMaXN0LmFkZChcIm9tbmlzaGFycC1hdG9tLWJ1dHRvblwiKTtcclxuICAgICAgICB0aGlzLl9zdGF0ZSA9IHsgc3RhdHVzOiA8YW55Pnt9IH07XHJcblxyXG4gICAgICAgIGNvbnN0IGljb24gPSB0aGlzLl9pY29uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XHJcbiAgICAgICAgaWNvbi5jbGFzc0xpc3QuYWRkKFwiaWNvblwiLCBcImljb24tZmxhbWVcIik7XHJcbiAgICAgICAgdGhpcy5hcHBlbmRDaGlsZChpY29uKTtcclxuXHJcbiAgICAgICAgY29uc3Qgb3V0Z29pbmcgPSB0aGlzLl9vdXRnb2luZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xyXG4gICAgICAgIG91dGdvaW5nLmNsYXNzTGlzdC5hZGQoXCJvdXRnb2luZy1yZXF1ZXN0c1wiKTtcclxuICAgICAgICB0aGlzLmFwcGVuZENoaWxkKG91dGdvaW5nKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgdXBkYXRlU3RhdGUoc3RhdGU6IHR5cGVvZiBGbGFtZUVsZW1lbnQucHJvdG90eXBlLl9zdGF0ZSkge1xyXG4gICAgICAgIHVwZGF0ZVN0YXRlKHRoaXMuX3N0YXRlLCBzdGF0ZSk7XHJcbiAgICAgICAgY29uc3QgaWNvbiA9IHRoaXMuX2ljb247XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9zdGF0ZS5pc09mZikge1xyXG4gICAgICAgICAgICByZW1vdmVDbGFzc0lmaW5jbHVkZXMoaWNvbiwgXCJ0ZXh0LXN1YnRsZVwiKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBhZGRDbGFzc0lmTm90aW5jbHVkZXMoaWNvbiwgXCJ0ZXh0LXN1YnRsZVwiKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9zdGF0ZS5pc1JlYWR5KSB7XHJcbiAgICAgICAgICAgIGFkZENsYXNzSWZOb3RpbmNsdWRlcyhpY29uLCBcInRleHQtc3VjY2Vzc1wiKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByZW1vdmVDbGFzc0lmaW5jbHVkZXMoaWNvbiwgXCJ0ZXh0LXN1Y2Nlc3NcIik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5fc3RhdGUuaXNFcnJvcikge1xyXG4gICAgICAgICAgICBhZGRDbGFzc0lmTm90aW5jbHVkZXMoaWNvbiwgXCJ0ZXh0LWVycm9yXCIpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJlbW92ZUNsYXNzSWZpbmNsdWRlcyhpY29uLCBcInRleHQtZXJyb3JcIik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5fc3RhdGUuaXNDb25uZWN0aW5nKSB7XHJcbiAgICAgICAgICAgIGFkZENsYXNzSWZOb3RpbmNsdWRlcyhpY29uLCBcImljb24tZmxhbWUtbG9hZGluZ1wiKTtcclxuICAgICAgICAgICAgcmVtb3ZlQ2xhc3NJZmluY2x1ZGVzKGljb24sIFwiaWNvbi1mbGFtZS1wcm9jZXNzaW5nXCIpO1xyXG4gICAgICAgICAgICByZW1vdmVDbGFzc0lmaW5jbHVkZXMoaWNvbiwgXCJpY29uLWZsYW1lLWxvYWRpbmdcIik7XHJcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLl9zdGF0ZS5zdGF0dXMuaGFzT3V0Z29pbmdSZXF1ZXN0cykge1xyXG4gICAgICAgICAgICBhZGRDbGFzc0lmTm90aW5jbHVkZXMoaWNvbiwgXCJpY29uLWZsYW1lLXByb2Nlc3NpbmdcIik7XHJcbiAgICAgICAgICAgIHJlbW92ZUNsYXNzSWZpbmNsdWRlcyhpY29uLCBcImljb24tZmxhbWUtbG9hZGluZ1wiKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByZW1vdmVDbGFzc0lmaW5jbHVkZXMoaWNvbiwgXCJpY29uLWZsYW1lLXByb2Nlc3NpbmdcIik7XHJcbiAgICAgICAgICAgIHJlbW92ZUNsYXNzSWZpbmNsdWRlcyhpY29uLCBcImljb24tZmxhbWUtbG9hZGluZ1wiKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHVwZGF0ZU91dGdvaW5nKHN0YXR1czogdHlwZW9mIEZsYW1lRWxlbWVudC5wcm90b3R5cGUuX3N0YXRlLnN0YXR1cykge1xyXG4gICAgICAgIGlmIChzdGF0dXMuaGFzT3V0Z29pbmdSZXF1ZXN0cyAmJiBzdGF0dXMub3V0Z29pbmdSZXF1ZXN0cyA+IDApIHtcclxuICAgICAgICAgICAgcmVtb3ZlQ2xhc3NJZmluY2x1ZGVzKHRoaXMuX291dGdvaW5nLCBcImZhZGVcIik7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgYWRkQ2xhc3NJZk5vdGluY2x1ZGVzKHRoaXMuX291dGdvaW5nLCBcImZhZGVcIik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoc3RhdHVzLm91dGdvaW5nUmVxdWVzdHMgIT09IHRoaXMuX3N0YXRlLnN0YXR1cy5vdXRnb2luZ1JlcXVlc3RzKSB7XHJcbiAgICAgICAgICAgIGZhc3Rkb20ubXV0YXRlKCgpID0+IHRoaXMuX291dGdvaW5nLmlubmVyVGV4dCA9IHN0YXR1cy5vdXRnb2luZ1JlcXVlc3RzICYmIHN0YXR1cy5vdXRnb2luZ1JlcXVlc3RzLnRvU3RyaW5nKCkgfHwgXCIwXCIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5fc3RhdGUuc3RhdHVzID0gc3RhdHVzIHx8IDxhbnk+e307XHJcbiAgICAgICAgdGhpcy51cGRhdGVTdGF0ZSh0aGlzLl9zdGF0ZSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbig8YW55PmV4cG9ydHMpLkZsYW1lRWxlbWVudCA9ICg8YW55PmRvY3VtZW50KS5yZWdpc3RlckVsZW1lbnQoXCJvbW5pc2hhcnAtZmxhbWVcIiwgeyBwcm90b3R5cGU6IEZsYW1lRWxlbWVudC5wcm90b3R5cGUgfSk7XHJcblxyXG5leHBvcnQgY2xhc3MgRGlhZ25vc3RpY3NFbGVtZW50IGV4dGVuZHMgSFRNTEFuY2hvckVsZW1lbnQgaW1wbGVtZW50cyBXZWJDb21wb25lbnQge1xyXG4gICAgcHJpdmF0ZSBfc3RhdGU6IHtcclxuICAgICAgICBlcnJvckNvdW50OiBudW1iZXI7XHJcbiAgICAgICAgd2FybmluZ0NvdW50OiBudW1iZXI7XHJcbiAgICB9O1xyXG4gICAgcHJpdmF0ZSBfZXJyb3JzOiBIVE1MU3BhbkVsZW1lbnQ7XHJcbiAgICBwcml2YXRlIF93YXJuaW5nczogSFRNTFNwYW5FbGVtZW50O1xyXG4gICAgcHJpdmF0ZSBfc3luYzogSFRNTEFuY2hvckVsZW1lbnQ7XHJcblxyXG4gICAgcHVibGljIGNyZWF0ZWRDYWxsYmFjaygpIHtcclxuICAgICAgICB0aGlzLmNsYXNzTGlzdC5hZGQoXCJpbmxpbmUtYmxvY2tcIiwgXCJlcnJvci13YXJuaW5nLXN1bW1hcnlcIik7XHJcblxyXG4gICAgICAgIGNvbnN0IHN5bmMgPSB0aGlzLl9zeW5jID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImFcIik7XHJcbiAgICAgICAgc3luYy5jbGFzc0xpc3QuYWRkKFwiaWNvblwiLCBcImljb24tc3luY1wiLCBcInRleHQtc3VidGxlXCIpO1xyXG4gICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQoc3luYyk7XHJcbiAgICAgICAgc3luYy5vbmNsaWNrID0gKCkgPT4gdGhpcy5zeW5jQ2xpY2soKTtcclxuXHJcbiAgICAgICAgY29uc3QgcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xyXG4gICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQocyk7XHJcbiAgICAgICAgcy5vbmNsaWNrID0gKCkgPT4gdGhpcy5kaWFnbm9zdGljQ2xpY2soKTtcclxuXHJcbiAgICAgICAgY29uc3QgZXJyb3JzSWNvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xyXG4gICAgICAgIGVycm9yc0ljb24uY2xhc3NMaXN0LmFkZChcImljb25cIiwgXCJpY29uLWlzc3VlLW9wZW5lZFwiKTtcclxuICAgICAgICBzLmFwcGVuZENoaWxkKGVycm9yc0ljb24pO1xyXG5cclxuICAgICAgICBjb25zdCBlcnJvcnMgPSB0aGlzLl9lcnJvcnMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcclxuICAgICAgICBlcnJvcnMuY2xhc3NMaXN0LmFkZChcImVycm9yLXN1bW1hcnlcIik7XHJcbiAgICAgICAgcy5hcHBlbmRDaGlsZChlcnJvcnMpO1xyXG5cclxuICAgICAgICBjb25zdCB3YXJuaW5nc0ljb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcclxuICAgICAgICB3YXJuaW5nc0ljb24uY2xhc3NMaXN0LmFkZChcImljb25cIiwgXCJpY29uLWFsZXJ0XCIpO1xyXG4gICAgICAgIHMuYXBwZW5kQ2hpbGQod2FybmluZ3NJY29uKTtcclxuXHJcbiAgICAgICAgY29uc3Qgd2FybmluZ3MgPSB0aGlzLl93YXJuaW5ncyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xyXG4gICAgICAgIHdhcm5pbmdzLmNsYXNzTGlzdC5hZGQoXCJ3YXJuaW5nLXN1bW1hcnlcIik7XHJcbiAgICAgICAgcy5hcHBlbmRDaGlsZCh3YXJuaW5ncyk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHVwZGF0ZVN0YXRlKHN0YXRlOiB0eXBlb2YgRGlhZ25vc3RpY3NFbGVtZW50LnByb3RvdHlwZS5fc3RhdGUpIHtcclxuICAgICAgICBpZiAoIV8uaXNFcXVhbCh0aGlzLl9zdGF0ZSwgc3RhdGUpKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3N0YXRlID0gc3RhdGU7XHJcbiAgICAgICAgICAgIGZhc3Rkb20ubXV0YXRlKCgpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9zdGF0ZS5lcnJvckNvdW50KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZXJyb3JzLmlubmVyVGV4dCA9IHRoaXMuX3N0YXRlLmVycm9yQ291bnQudG9TdHJpbmcoKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZXJyb3JzLmlubmVyVGV4dCA9IFwiMFwiO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9zdGF0ZS53YXJuaW5nQ291bnQpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl93YXJuaW5ncy5pbm5lclRleHQgPSB0aGlzLl9zdGF0ZS53YXJuaW5nQ291bnQudG9TdHJpbmcoKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fd2FybmluZ3MuaW5uZXJUZXh0ID0gXCIwXCI7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc3luY0NsaWNrOiAoKSA9PiB2b2lkO1xyXG4gICAgcHVibGljIGRpYWdub3N0aWNDbGljazogKCkgPT4gdm9pZDtcclxufVxyXG5cclxuKDxhbnk+ZXhwb3J0cykuRGlhZ25vc3RpY3NFbGVtZW50ID0gKDxhbnk+ZG9jdW1lbnQpLnJlZ2lzdGVyRWxlbWVudChcIm9tbmlzaGFycC1kaWFnbm9zdGljc1wiLCB7IHByb3RvdHlwZTogRGlhZ25vc3RpY3NFbGVtZW50LnByb3RvdHlwZSB9KTtcclxuXHJcbmV4cG9ydCBjbGFzcyBQcm9qZWN0Q291bnRFbGVtZW50IGV4dGVuZHMgSFRNTEFuY2hvckVsZW1lbnQgaW1wbGVtZW50cyBXZWJDb21wb25lbnQge1xyXG4gICAgcHJpdmF0ZSBfc3RhdGU6IHsgcHJvamVjdENvdW50OiBudW1iZXIgfTtcclxuICAgIHB1YmxpYyBwcm9qZWN0czogSFRNTFNwYW5FbGVtZW50O1xyXG4gICAgcHJpdmF0ZSBfc29sdXRpb25OdW5tYmVyOiBIVE1MU3BhbkVsZW1lbnQ7XHJcblxyXG4gICAgcHVibGljIGNyZWF0ZWRDYWxsYmFjaygpIHtcclxuICAgICAgICB0aGlzLmNsYXNzTGlzdC5hZGQoXCJpbmxpbmUtYmxvY2tcIiwgXCJwcm9qZWN0LXN1bW1hcnlcIiwgXCJwcm9qZWN0cy1pY29uXCIpO1xyXG5cclxuICAgICAgICBjb25zdCBpY29uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XHJcbiAgICAgICAgaWNvbi5jbGFzc0xpc3QuYWRkKFwiaWNvblwiLCBcImljb24tcHVsc2VcIik7XHJcbiAgICAgICAgdGhpcy5hcHBlbmRDaGlsZChpY29uKTtcclxuXHJcbiAgICAgICAgY29uc3Qgc3ViID0gdGhpcy5fc29sdXRpb25OdW5tYmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInN1YlwiKTtcclxuICAgICAgICBpY29uLmFwcGVuZENoaWxkKHN1Yik7XHJcblxyXG4gICAgICAgIGNvbnN0IHByb2plY3RzID0gdGhpcy5wcm9qZWN0cyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xyXG4gICAgICAgIHByb2plY3RzLmNsYXNzTGlzdC5hZGQoXCJwcm9qZWN0c1wiKTtcclxuICAgICAgICBwcm9qZWN0cy5pbm5lclRleHQgPSBcIjAgUHJvamVjdHNcIjtcclxuICAgICAgICB0aGlzLmFwcGVuZENoaWxkKHByb2plY3RzKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgdXBkYXRlU3RhdGUoc3RhdGU6IHR5cGVvZiBQcm9qZWN0Q291bnRFbGVtZW50LnByb3RvdHlwZS5fc3RhdGUpIHtcclxuICAgICAgICBpZiAoIV8uaXNFcXVhbCh0aGlzLl9zdGF0ZSwgc3RhdGUpKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3N0YXRlID0gc3RhdGU7XHJcbiAgICAgICAgICAgIGZhc3Rkb20ubXV0YXRlKCgpID0+IHRoaXMucHJvamVjdHMuaW5uZXJUZXh0ID0gYCR7dGhpcy5fc3RhdGUucHJvamVjdENvdW50fSBQcm9qZWN0c2ApO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgdXBkYXRlU29sdXRpb25OdW1iZXIoc29sdXRpb25OdW1iZXI6IHN0cmluZykge1xyXG4gICAgICAgIGZhc3Rkb20ubXV0YXRlKCgpID0+IHRoaXMuX3NvbHV0aW9uTnVubWJlci5pbm5lclRleHQgPSBzb2x1dGlvbk51bWJlcik7XHJcbiAgICB9XHJcbn1cclxuXHJcbig8YW55PmV4cG9ydHMpLlByb2plY3RDb3VudEVsZW1lbnQgPSAoPGFueT5kb2N1bWVudCkucmVnaXN0ZXJFbGVtZW50KFwib21uaXNoYXJwLXByb2plY3QtY291bnRcIiwgeyBwcm90b3R5cGU6IFByb2plY3RDb3VudEVsZW1lbnQucHJvdG90eXBlIH0pO1xyXG5cclxuXHJcbmV4cG9ydCBjbGFzcyBTdGF0dXNCYXJFbGVtZW50IGV4dGVuZHMgSFRNTEVsZW1lbnQgaW1wbGVtZW50cyBXZWJDb21wb25lbnQsIElEaXNwb3NhYmxlIHtcclxuICAgIHByaXZhdGUgX3N0YXRlOiBTdGF0dXNCYXJTdGF0ZTtcclxuICAgIHByaXZhdGUgX2Rpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XHJcbiAgICBwcml2YXRlIF9mbGFtZTogRmxhbWVFbGVtZW50O1xyXG4gICAgcHJpdmF0ZSBfZGlhZ25vc3RpY3M6IERpYWdub3N0aWNzRWxlbWVudDtcclxuICAgIHByaXZhdGUgX3Byb2plY3RDb3VudDogUHJvamVjdENvdW50RWxlbWVudDtcclxuXHJcbiAgICBwdWJsaWMgY3JlYXRlZENhbGxiYWNrKCkge1xyXG4gICAgICAgIHRoaXMuY2xhc3NMaXN0LmFkZChcImlubGluZS1ibG9ja1wiKTtcclxuXHJcbiAgICAgICAgY29uc3QgZmxhbWVFbGVtZW50ID0gdGhpcy5fZmxhbWUgPSA8RmxhbWVFbGVtZW50Pm5ldyBleHBvcnRzLkZsYW1lRWxlbWVudCgpO1xyXG4gICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQoZmxhbWVFbGVtZW50KTtcclxuICAgICAgICBmbGFtZUVsZW1lbnQub25jbGljayA9ICgpID0+IHRoaXMudG9nZ2xlKCk7XHJcblxyXG4gICAgICAgIGNvbnN0IHByb2plY3RDb3VudCA9IHRoaXMuX3Byb2plY3RDb3VudCA9IDxQcm9qZWN0Q291bnRFbGVtZW50Pm5ldyBleHBvcnRzLlByb2plY3RDb3VudEVsZW1lbnQoKTtcclxuICAgICAgICB0aGlzLmFwcGVuZENoaWxkKHByb2plY3RDb3VudCk7XHJcbiAgICAgICAgcHJvamVjdENvdW50Lm9uY2xpY2sgPSAoKSA9PiB0aGlzLnRvZ2dsZVNvbHV0aW9uSW5mb3JtYXRpb24oKTtcclxuICAgICAgICBwcm9qZWN0Q291bnQucHJvamVjdHMuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xyXG5cclxuICAgICAgICBjb25zdCBkaWFnbm9zdGljcyA9IHRoaXMuX2RpYWdub3N0aWNzID0gPERpYWdub3N0aWNzRWxlbWVudD5uZXcgZXhwb3J0cy5EaWFnbm9zdGljc0VsZW1lbnQoKTtcclxuICAgICAgICB0aGlzLmFwcGVuZENoaWxkKGRpYWdub3N0aWNzKTtcclxuICAgICAgICBkaWFnbm9zdGljcy5kaWFnbm9zdGljQ2xpY2sgPSAoKSA9PiB0aGlzLnRvZ2dsZUVycm9yV2FybmluZ1BhbmVsKCk7XHJcbiAgICAgICAgZGlhZ25vc3RpY3Muc3luY0NsaWNrID0gKCkgPT4gdGhpcy5kb0NvZGVDaGVjaygpO1xyXG4gICAgICAgIGRpYWdub3N0aWNzLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcclxuXHJcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcbiAgICAgICAgdGhpcy5fc3RhdGUgPSB7IHN0YXR1czogPGFueT57fSB9O1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBhdHRhY2hlZENhbGxiYWNrKCkge1xyXG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKE9tbmkuZGlhZ25vc3RpY3NDb3VudHMuc3Vic2NyaWJlKGNvdW50cyA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuX2RpYWdub3N0aWNzLnVwZGF0ZVN0YXRlKHtcclxuICAgICAgICAgICAgICAgIGVycm9yQ291bnQ6IGNvdW50c1tcImVycm9yXCJdIHx8IDAsXHJcbiAgICAgICAgICAgICAgICB3YXJuaW5nQ291bnQ6IGNvdW50c1tcIndhcm5pbmdcIl0gfHwgMFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKE9ic2VydmFibGUubWVyZ2UoT21uaS5hY3RpdmVNb2RlbCwgT21uaS5hY3RpdmVNb2RlbC5mbGF0TWFwKHggPT4geC5vYnNlcnZlLnN0YXRlKSlcclxuICAgICAgICAgICAgLnN1YnNjcmliZShtb2RlbCA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9mbGFtZS51cGRhdGVTdGF0ZShtb2RlbCk7XHJcbiAgICAgICAgICAgICAgICB1cGRhdGVTdGF0ZSh0aGlzLl9zdGF0ZSwgbW9kZWwpO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMuX3VwZGF0ZVZpc2libGUoKTtcclxuICAgICAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChzZXJ2ZXIub2JzZXJ2ZS5wcm9qZWN0c1xyXG4gICAgICAgICAgICAuZGVib3VuY2VUaW1lKDUwMClcclxuICAgICAgICAgICAgLnN1YnNjcmliZShwcm9qZWN0cyA9PiB0aGlzLl9wcm9qZWN0Q291bnQudXBkYXRlU3RhdGUoeyBwcm9qZWN0Q291bnQ6IHByb2plY3RzLmxlbmd0aCB9KSkpO1xyXG5cclxuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChzZXJ2ZXIub2JzZXJ2ZS5zdGF0dXNcclxuICAgICAgICAgICAgLnN1YnNjcmliZShzdGF0dXMgPT4gdGhpcy5fZmxhbWUudXBkYXRlT3V0Z29pbmcoc3RhdHVzIHx8IDxhbnk+e30pKSk7XHJcblxyXG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKHNlcnZlci5vYnNlcnZlLm1vZGVsXHJcbiAgICAgICAgICAgIC5zdWJzY3JpYmUobW9kZWwgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc3Qgc29sdXRpb25OdW1iZXIgPSBTb2x1dGlvbk1hbmFnZXIuYWN0aXZlU29sdXRpb25zLmxlbmd0aCA+IDEgPyBfLnRyaW0oc2VydmVyLm1vZGVsICYmICg8YW55PnNlcnZlci5tb2RlbCkuaW5kZXgsIFwiY2xpZW50XCIpIDogXCJcIjtcclxuICAgICAgICAgICAgICAgIHRoaXMuX3Byb2plY3RDb3VudC51cGRhdGVTb2x1dGlvbk51bWJlcihzb2x1dGlvbk51bWJlcik7XHJcbiAgICAgICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoT21uaS5hY3RpdmVFZGl0b3JPckNvbmZpZ0VkaXRvci5zdWJzY3JpYmUoZWRpdG9yID0+IHtcclxuICAgICAgICAgICAgdGhpcy5fdXBkYXRlVmlzaWJsZSghIWVkaXRvcik7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChTb2x1dGlvbk1hbmFnZXIuYWN0aXZlU29sdXRpb25cclxuICAgICAgICAgICAgLnN1YnNjcmliZShzb2x1dGlvbnMgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc3Qgc29sdXRpb25OdW1iZXIgPSBTb2x1dGlvbk1hbmFnZXIuYWN0aXZlU29sdXRpb25zLmxlbmd0aCA+IDEgPyBfLnRyaW0oc2VydmVyLm1vZGVsICYmICg8YW55PnNlcnZlci5tb2RlbCkuaW5kZXgsIFwiY2xpZW50XCIpIDogXCJcIjtcclxuICAgICAgICAgICAgICAgIHRoaXMuX3Byb2plY3RDb3VudC51cGRhdGVTb2x1dGlvbk51bWJlcihzb2x1dGlvbk51bWJlcik7XHJcbiAgICAgICAgICAgIH0pKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9oYXNWYWxpZEVkaXRvcjogYm9vbGVhbiA9IGZhbHNlO1xyXG4gICAgcHJpdmF0ZSBfdXBkYXRlVmlzaWJsZShoYXNWYWxpZEVkaXRvcj86IGJvb2xlYW4pIHtcclxuICAgICAgICBpZiAodHlwZW9mIGhhc1ZhbGlkRWRpdG9yICE9PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2hhc1ZhbGlkRWRpdG9yID0gaGFzVmFsaWRFZGl0b3I7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5fc3RhdGUuaXNPbiAmJiB0aGlzLl9oYXNWYWxpZEVkaXRvcikge1xyXG4gICAgICAgICAgICB0aGlzLl9zaG93T25TdGF0ZUl0ZW1zKCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5faGlkZU9uU3RhdGVJdGVtcygpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9zaG93T25TdGF0ZUl0ZW1zKCkge1xyXG4gICAgICAgIGZhc3Rkb20ubWVhc3VyZSgoKSA9PiB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLl9kaWFnbm9zdGljcy5zdHlsZS5kaXNwbGF5ID09PSBcIm5vbmVcIikgeyBmYXN0ZG9tLm11dGF0ZSgoKSA9PiB0aGlzLl9kaWFnbm9zdGljcy5zdHlsZS5kaXNwbGF5ID0gXCJcIik7IH1cclxuICAgICAgICAgICAgaWYgKHRoaXMuX3Byb2plY3RDb3VudC5wcm9qZWN0cy5zdHlsZS5kaXNwbGF5ID09PSBcIm5vbmVcIikgeyBmYXN0ZG9tLm11dGF0ZSgoKSA9PiB0aGlzLl9wcm9qZWN0Q291bnQucHJvamVjdHMuc3R5bGUuZGlzcGxheSA9IFwiXCIpOyB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfaGlkZU9uU3RhdGVJdGVtcygpIHtcclxuICAgICAgICBmYXN0ZG9tLm1lYXN1cmUoKCkgPT4ge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5fZGlhZ25vc3RpY3Muc3R5bGUuZGlzcGxheSAhPT0gXCJub25lXCIpIHsgZmFzdGRvbS5tdXRhdGUoKCkgPT4gdGhpcy5fZGlhZ25vc3RpY3Muc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiKTsgfVxyXG4gICAgICAgICAgICBpZiAodGhpcy5fcHJvamVjdENvdW50LnByb2plY3RzLnN0eWxlLmRpc3BsYXkgIT09IFwibm9uZVwiKSB7IGZhc3Rkb20ubXV0YXRlKCgpID0+IHRoaXMuX3Byb2plY3RDb3VudC5wcm9qZWN0cy5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCIpOyB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRldGFjaGVkQ2FsbGJhY2soKSB7XHJcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHRvZ2dsZSgpIHtcclxuICAgICAgICBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSksIFwib21uaXNoYXJwLWF0b206dG9nZ2xlLWRvY2tcIik7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHRvZ2dsZUVycm9yV2FybmluZ1BhbmVsKCkge1xyXG4gICAgICAgIGF0b20uY29tbWFuZHMuZGlzcGF0Y2goYXRvbS52aWV3cy5nZXRWaWV3KGF0b20ud29ya3NwYWNlKSwgXCJvbW5pc2hhcnAtYXRvbTpkb2NrLXRvZ2dsZS1lcnJvcnNcIik7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHRvZ2dsZVNvbHV0aW9uSW5mb3JtYXRpb24oKSB7XHJcbiAgICAgICAgYXRvbS5jb21tYW5kcy5kaXNwYXRjaChhdG9tLnZpZXdzLmdldFZpZXcoYXRvbS53b3Jrc3BhY2UpLCBcIm9tbmlzaGFycC1hdG9tOnNvbHV0aW9uLXN0YXR1c1wiKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZG9Db2RlQ2hlY2soKSB7XHJcbiAgICAgICAgYXRvbS5jb21tYW5kcy5kaXNwYXRjaChhdG9tLnZpZXdzLmdldFZpZXcoYXRvbS53b3Jrc3BhY2UpLCBcIm9tbmlzaGFycC1hdG9tOmNvZGUtY2hlY2tcIik7XHJcbiAgICB9XHJcbn1cclxuXHJcbig8YW55PmV4cG9ydHMpLlN0YXR1c0JhckVsZW1lbnQgPSAoPGFueT5kb2N1bWVudCkucmVnaXN0ZXJFbGVtZW50KFwib21uaXNoYXJwLXN0YXR1cy1iYXJcIiwgeyBwcm90b3R5cGU6IFN0YXR1c0JhckVsZW1lbnQucHJvdG90eXBlIH0pO1xyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
