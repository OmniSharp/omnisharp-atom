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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy9zdGF0dXMtYmFyLXZpZXcuanMiLCJsaWIvdmlld3Mvc3RhdHVzLWJhci12aWV3LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQUNBOztBQUNBOzs7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7Ozs7Ozs7QUNHQSxJQUFJLFVBQTBCLFFBQVEsU0FBUixDQUExQjtBQUVKLFNBQUEscUJBQUEsQ0FBK0IsSUFBL0IsRUFBa0U7c0NBQWI7O0tBQWE7O0FBQzlELFFBQUksSUFBSixFQUFVO0FBQ04sZ0JBQVEsT0FBUixDQUFnQixZQUFBO0FBQ1osNkJBQUUsSUFBRixDQUFPLEdBQVAsRUFBWSxhQUFDO0FBQ1Qsb0JBQUksQ0FBQyxLQUFLLFNBQUwsQ0FBZSxRQUFmLENBQXdCLENBQXhCLENBQUQsRUFDQSxRQUFRLE1BQVIsQ0FBZTsyQkFBTSxLQUFLLFNBQUwsQ0FBZSxHQUFmLENBQW1CLENBQW5CO2lCQUFOLENBQWYsQ0FESjthQURRLENBQVosQ0FEWTtTQUFBLENBQWhCLENBRE07S0FBVjtDQURKO0FBVUEsU0FBQSxxQkFBQSxDQUErQixJQUEvQixFQUFrRTt1Q0FBYjs7S0FBYTs7QUFDOUQsUUFBSSxJQUFKLEVBQVU7QUFDTixnQkFBUSxPQUFSLENBQWdCLFlBQUE7QUFDWiw2QkFBRSxJQUFGLENBQU8sR0FBUCxFQUFZLGFBQUM7QUFDVCxvQkFBSSxLQUFLLFNBQUwsQ0FBZSxRQUFmLENBQXdCLENBQXhCLENBQUosRUFDSSxRQUFRLE1BQVIsQ0FBZTsyQkFBTSxLQUFLLFNBQUwsQ0FBZSxNQUFmLENBQXNCLENBQXRCO2lCQUFOLENBQWYsQ0FESjthQURRLENBQVosQ0FEWTtTQUFBLENBQWhCLENBRE07S0FBVjtDQURKO0FBb0JBLFNBQUEsWUFBQSxDQUFxQixJQUFyQixFQUFnQyxLQUFoQyxFQUEwQztBQUN0QyxxQkFBRSxJQUFGLENBQU8sV0FBSywyQkFBTCxFQUFrQyxhQUFDO0FBQ3RDLFlBQUksaUJBQUUsR0FB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S0FBSyxTQUFMLENBQTFDLEVBQTJELG1DQUEzRCxFQUQwQjs7OztvREFJRTtBQUM1QixpQkFBSyxRQUFMLENBQWMsUUFBZCxDQUF1QixLQUFLLEtBQUwsQ0FBVyxPQUFYLENBQW1CLEtBQUssU0FBTCxDQUExQyxFQUEyRCxnQ0FBM0QsRUFENEI7Ozs7c0NBSWQ7QUFDZCxpQkFBSyxRQUFMLENBQWMsUUFBZCxDQUF1QixLQUFLLEtBQUwsQ0FBVyxPQUFYLENBQW1CLEtBQUssU0FBTCxDQUExQyxFQUEyRCwyQkFBM0QsRUFEYzs7Ozs7RUFwSGdCOztBQXlIaEMsUUFBUyxnQkFBVCxHQUFrQyxTQUFVLGVBQVYsQ0FBMEIsc0JBQTFCLEVBQWtELEVBQUUsV0FBVyxpQkFBaUIsU0FBakIsRUFBL0QsQ0FBbEMiLCJmaWxlIjoibGliL3ZpZXdzL3N0YXR1cy1iYXItdmlldy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE9ic2VydmFibGUgfSBmcm9tIFwicnhqc1wiO1xuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSB9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XG5pbXBvcnQgXyBmcm9tIFwibG9kYXNoXCI7XG5pbXBvcnQgeyBPbW5pIH0gZnJvbSBcIi4uL3NlcnZlci9vbW5pXCI7XG5pbXBvcnQgeyBzZXJ2ZXIgfSBmcm9tIFwiLi4vYXRvbS9zZXJ2ZXItaW5mb3JtYXRpb25cIjtcbmltcG9ydCB7IFNvbHV0aW9uTWFuYWdlciB9IGZyb20gXCIuLi9zZXJ2ZXIvc29sdXRpb24tbWFuYWdlclwiO1xubGV0IGZhc3Rkb20gPSByZXF1aXJlKFwiZmFzdGRvbVwiKTtcbmZ1bmN0aW9uIGFkZENsYXNzSWZOb3RpbmNsdWRlcyhpY29uLCAuLi5jbHMpIHtcbiAgICBpZiAoaWNvbikge1xuICAgICAgICBmYXN0ZG9tLm1lYXN1cmUoKCkgPT4ge1xuICAgICAgICAgICAgXy5lYWNoKGNscywgYyA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKCFpY29uLmNsYXNzTGlzdC5jb250YWlucyhjKSlcbiAgICAgICAgICAgICAgICAgICAgZmFzdGRvbS5tdXRhdGUoKCkgPT4gaWNvbi5jbGFzc0xpc3QuYWRkKGMpKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG59XG5mdW5jdGlvbiByZW1vdmVDbGFzc0lmaW5jbHVkZXMoaWNvbiwgLi4uY2xzKSB7XG4gICAgaWYgKGljb24pIHtcbiAgICAgICAgZmFzdGRvbS5tZWFzdXJlKCgpID0+IHtcbiAgICAgICAgICAgIF8uZWFjaChjbHMsIGMgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChpY29uLmNsYXNzTGlzdC5jb250YWlucyhjKSlcbiAgICAgICAgICAgICAgICAgICAgZmFzdGRvbS5tdXRhdGUoKCkgPT4gaWNvbi5jbGFzc0xpc3QucmVtb3ZlKGMpKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG59XG5mdW5jdGlvbiB1cGRhdGVTdGF0ZShzZWxmLCBzdGF0ZSkge1xuICAgIF8uZWFjaChPbW5pLnZpZXdNb2RlbFN0YXRlZnVsUHJvcGVydGllcywgeCA9PiB7XG4gICAgICAgIGlmIChfLmhhcyhzdGF0ZSwgeCkpIHtcbiAgICAgICAgICAgIHNlbGZbeF0gPSBzdGF0ZVt4XTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuZXhwb3J0IGNsYXNzIEZsYW1lRWxlbWVudCBleHRlbmRzIEhUTUxBbmNob3JFbGVtZW50IHtcbiAgICBjcmVhdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMuY2xhc3NMaXN0LmFkZChcIm9tbmlzaGFycC1hdG9tLWJ1dHRvblwiKTtcbiAgICAgICAgdGhpcy5fc3RhdGUgPSB7IHN0YXR1czoge30gfTtcbiAgICAgICAgY29uc3QgaWNvbiA9IHRoaXMuX2ljb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgaWNvbi5jbGFzc0xpc3QuYWRkKFwiaWNvblwiLCBcImljb24tZmxhbWVcIik7XG4gICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQoaWNvbik7XG4gICAgICAgIGNvbnN0IG91dGdvaW5nID0gdGhpcy5fb3V0Z29pbmcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgb3V0Z29pbmcuY2xhc3NMaXN0LmFkZChcIm91dGdvaW5nLXJlcXVlc3RzXCIpO1xuICAgICAgICB0aGlzLmFwcGVuZENoaWxkKG91dGdvaW5nKTtcbiAgICB9XG4gICAgdXBkYXRlU3RhdGUoc3RhdGUpIHtcbiAgICAgICAgdXBkYXRlU3RhdGUodGhpcy5fc3RhdGUsIHN0YXRlKTtcbiAgICAgICAgY29uc3QgaWNvbiA9IHRoaXMuX2ljb247XG4gICAgICAgIGlmICh0aGlzLl9zdGF0ZS5pc09mZikge1xuICAgICAgICAgICAgcmVtb3ZlQ2xhc3NJZmluY2x1ZGVzKGljb24sIFwidGV4dC1zdWJ0bGVcIik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBhZGRDbGFzc0lmTm90aW5jbHVkZXMoaWNvbiwgXCJ0ZXh0LXN1YnRsZVwiKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5fc3RhdGUuaXNSZWFkeSkge1xuICAgICAgICAgICAgYWRkQ2xhc3NJZk5vdGluY2x1ZGVzKGljb24sIFwidGV4dC1zdWNjZXNzXCIpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmVtb3ZlQ2xhc3NJZmluY2x1ZGVzKGljb24sIFwidGV4dC1zdWNjZXNzXCIpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLl9zdGF0ZS5pc0Vycm9yKSB7XG4gICAgICAgICAgICBhZGRDbGFzc0lmTm90aW5jbHVkZXMoaWNvbiwgXCJ0ZXh0LWVycm9yXCIpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmVtb3ZlQ2xhc3NJZmluY2x1ZGVzKGljb24sIFwidGV4dC1lcnJvclwiKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5fc3RhdGUuaXNDb25uZWN0aW5nKSB7XG4gICAgICAgICAgICBhZGRDbGFzc0lmTm90aW5jbHVkZXMoaWNvbiwgXCJpY29uLWZsYW1lLWxvYWRpbmdcIik7XG4gICAgICAgICAgICByZW1vdmVDbGFzc0lmaW5jbHVkZXMoaWNvbiwgXCJpY29uLWZsYW1lLXByb2Nlc3NpbmdcIik7XG4gICAgICAgICAgICByZW1vdmVDbGFzc0lmaW5jbHVkZXMoaWNvbiwgXCJpY29uLWZsYW1lLWxvYWRpbmdcIik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodGhpcy5fc3RhdGUuc3RhdHVzLmhhc091dGdvaW5nUmVxdWVzdHMpIHtcbiAgICAgICAgICAgIGFkZENsYXNzSWZOb3RpbmNsdWRlcyhpY29uLCBcImljb24tZmxhbWUtcHJvY2Vzc2luZ1wiKTtcbiAgICAgICAgICAgIHJlbW92ZUNsYXNzSWZpbmNsdWRlcyhpY29uLCBcImljb24tZmxhbWUtbG9hZGluZ1wiKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJlbW92ZUNsYXNzSWZpbmNsdWRlcyhpY29uLCBcImljb24tZmxhbWUtcHJvY2Vzc2luZ1wiKTtcbiAgICAgICAgICAgIHJlbW92ZUNsYXNzSWZpbmNsdWRlcyhpY29uLCBcImljb24tZmxhbWUtbG9hZGluZ1wiKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICB1cGRhdGVPdXRnb2luZyhzdGF0dXMpIHtcbiAgICAgICAgaWYgKHN0YXR1cy5oYXNPdXRnb2luZ1JlcXVlc3RzICYmIHN0YXR1cy5vdXRnb2luZ1JlcXVlc3RzID4gMCkge1xuICAgICAgICAgICAgcmVtb3ZlQ2xhc3NJZmluY2x1ZGVzKHRoaXMuX291dGdvaW5nLCBcImZhZGVcIik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBhZGRDbGFzc0lmTm90aW5jbHVkZXModGhpcy5fb3V0Z29pbmcsIFwiZmFkZVwiKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc3RhdHVzLm91dGdvaW5nUmVxdWVzdHMgIT09IHRoaXMuX3N0YXRlLnN0YXR1cy5vdXRnb2luZ1JlcXVlc3RzKSB7XG4gICAgICAgICAgICBmYXN0ZG9tLm11dGF0ZSgoKSA9PiB0aGlzLl9vdXRnb2luZy5pbm5lclRleHQgPSBzdGF0dXMub3V0Z29pbmdSZXF1ZXN0cyAmJiBzdGF0dXMub3V0Z29pbmdSZXF1ZXN0cy50b1N0cmluZygpIHx8IFwiMFwiKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9zdGF0ZS5zdGF0dXMgPSBzdGF0dXMgfHwge307XG4gICAgICAgIHRoaXMudXBkYXRlU3RhdGUodGhpcy5fc3RhdGUpO1xuICAgIH1cbn1cbmV4cG9ydHMuRmxhbWVFbGVtZW50ID0gZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50KFwib21uaXNoYXJwLWZsYW1lXCIsIHsgcHJvdG90eXBlOiBGbGFtZUVsZW1lbnQucHJvdG90eXBlIH0pO1xuZXhwb3J0IGNsYXNzIERpYWdub3N0aWNzRWxlbWVudCBleHRlbmRzIEhUTUxBbmNob3JFbGVtZW50IHtcbiAgICBjcmVhdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMuY2xhc3NMaXN0LmFkZChcImlubGluZS1ibG9ja1wiLCBcImVycm9yLXdhcm5pbmctc3VtbWFyeVwiKTtcbiAgICAgICAgY29uc3Qgc3luYyA9IHRoaXMuX3N5bmMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYVwiKTtcbiAgICAgICAgc3luYy5jbGFzc0xpc3QuYWRkKFwiaWNvblwiLCBcImljb24tc3luY1wiLCBcInRleHQtc3VidGxlXCIpO1xuICAgICAgICB0aGlzLmFwcGVuZENoaWxkKHN5bmMpO1xuICAgICAgICBzeW5jLm9uY2xpY2sgPSAoKSA9PiB0aGlzLnN5bmNDbGljaygpO1xuICAgICAgICBjb25zdCBzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQocyk7XG4gICAgICAgIHMub25jbGljayA9ICgpID0+IHRoaXMuZGlhZ25vc3RpY0NsaWNrKCk7XG4gICAgICAgIGNvbnN0IGVycm9yc0ljb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgZXJyb3JzSWNvbi5jbGFzc0xpc3QuYWRkKFwiaWNvblwiLCBcImljb24taXNzdWUtb3BlbmVkXCIpO1xuICAgICAgICBzLmFwcGVuZENoaWxkKGVycm9yc0ljb24pO1xuICAgICAgICBjb25zdCBlcnJvcnMgPSB0aGlzLl9lcnJvcnMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgZXJyb3JzLmNsYXNzTGlzdC5hZGQoXCJlcnJvci1zdW1tYXJ5XCIpO1xuICAgICAgICBzLmFwcGVuZENoaWxkKGVycm9ycyk7XG4gICAgICAgIGNvbnN0IHdhcm5pbmdzSWNvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICB3YXJuaW5nc0ljb24uY2xhc3NMaXN0LmFkZChcImljb25cIiwgXCJpY29uLWFsZXJ0XCIpO1xuICAgICAgICBzLmFwcGVuZENoaWxkKHdhcm5pbmdzSWNvbik7XG4gICAgICAgIGNvbnN0IHdhcm5pbmdzID0gdGhpcy5fd2FybmluZ3MgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgd2FybmluZ3MuY2xhc3NMaXN0LmFkZChcIndhcm5pbmctc3VtbWFyeVwiKTtcbiAgICAgICAgcy5hcHBlbmRDaGlsZCh3YXJuaW5ncyk7XG4gICAgfVxuICAgIHVwZGF0ZVN0YXRlKHN0YXRlKSB7XG4gICAgICAgIGlmICghXy5pc0VxdWFsKHRoaXMuX3N0YXRlLCBzdGF0ZSkpIHtcbiAgICAgICAgICAgIHRoaXMuX3N0YXRlID0gc3RhdGU7XG4gICAgICAgICAgICBmYXN0ZG9tLm11dGF0ZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX3N0YXRlLmVycm9yQ291bnQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZXJyb3JzLmlubmVyVGV4dCA9IHRoaXMuX3N0YXRlLmVycm9yQ291bnQudG9TdHJpbmcoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2Vycm9ycy5pbm5lclRleHQgPSBcIjBcIjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX3N0YXRlLndhcm5pbmdDb3VudCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl93YXJuaW5ncy5pbm5lclRleHQgPSB0aGlzLl9zdGF0ZS53YXJuaW5nQ291bnQudG9TdHJpbmcoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3dhcm5pbmdzLmlubmVyVGV4dCA9IFwiMFwiO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxufVxuZXhwb3J0cy5EaWFnbm9zdGljc0VsZW1lbnQgPSBkb2N1bWVudC5yZWdpc3RlckVsZW1lbnQoXCJvbW5pc2hhcnAtZGlhZ25vc3RpY3NcIiwgeyBwcm90b3R5cGU6IERpYWdub3N0aWNzRWxlbWVudC5wcm90b3R5cGUgfSk7XG5leHBvcnQgY2xhc3MgUHJvamVjdENvdW50RWxlbWVudCBleHRlbmRzIEhUTUxBbmNob3JFbGVtZW50IHtcbiAgICBjcmVhdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMuY2xhc3NMaXN0LmFkZChcImlubGluZS1ibG9ja1wiLCBcInByb2plY3Qtc3VtbWFyeVwiLCBcInByb2plY3RzLWljb25cIik7XG4gICAgICAgIGNvbnN0IGljb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgaWNvbi5jbGFzc0xpc3QuYWRkKFwiaWNvblwiLCBcImljb24tcHVsc2VcIik7XG4gICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQoaWNvbik7XG4gICAgICAgIGNvbnN0IHN1YiA9IHRoaXMuX3NvbHV0aW9uTnVubWJlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzdWJcIik7XG4gICAgICAgIGljb24uYXBwZW5kQ2hpbGQoc3ViKTtcbiAgICAgICAgY29uc3QgcHJvamVjdHMgPSB0aGlzLnByb2plY3RzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICAgIHByb2plY3RzLmNsYXNzTGlzdC5hZGQoXCJwcm9qZWN0c1wiKTtcbiAgICAgICAgcHJvamVjdHMuaW5uZXJUZXh0ID0gXCIwIFByb2plY3RzXCI7XG4gICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQocHJvamVjdHMpO1xuICAgIH1cbiAgICB1cGRhdGVTdGF0ZShzdGF0ZSkge1xuICAgICAgICBpZiAoIV8uaXNFcXVhbCh0aGlzLl9zdGF0ZSwgc3RhdGUpKSB7XG4gICAgICAgICAgICB0aGlzLl9zdGF0ZSA9IHN0YXRlO1xuICAgICAgICAgICAgZmFzdGRvbS5tdXRhdGUoKCkgPT4gdGhpcy5wcm9qZWN0cy5pbm5lclRleHQgPSBgJHt0aGlzLl9zdGF0ZS5wcm9qZWN0Q291bnR9IFByb2plY3RzYCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgdXBkYXRlU29sdXRpb25OdW1iZXIoc29sdXRpb25OdW1iZXIpIHtcbiAgICAgICAgZmFzdGRvbS5tdXRhdGUoKCkgPT4gdGhpcy5fc29sdXRpb25OdW5tYmVyLmlubmVyVGV4dCA9IHNvbHV0aW9uTnVtYmVyKTtcbiAgICB9XG59XG5leHBvcnRzLlByb2plY3RDb3VudEVsZW1lbnQgPSBkb2N1bWVudC5yZWdpc3RlckVsZW1lbnQoXCJvbW5pc2hhcnAtcHJvamVjdC1jb3VudFwiLCB7IHByb3RvdHlwZTogUHJvamVjdENvdW50RWxlbWVudC5wcm90b3R5cGUgfSk7XG5leHBvcnQgY2xhc3MgU3RhdHVzQmFyRWxlbWVudCBleHRlbmRzIEhUTUxFbGVtZW50IHtcbiAgICBjb25zdHJ1Y3RvciguLi5hcmdzKSB7XG4gICAgICAgIHN1cGVyKC4uLmFyZ3MpO1xuICAgICAgICB0aGlzLl9oYXNWYWxpZEVkaXRvciA9IGZhbHNlO1xuICAgIH1cbiAgICBjcmVhdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMuY2xhc3NMaXN0LmFkZChcImlubGluZS1ibG9ja1wiKTtcbiAgICAgICAgY29uc3QgZmxhbWVFbGVtZW50ID0gdGhpcy5fZmxhbWUgPSBuZXcgZXhwb3J0cy5GbGFtZUVsZW1lbnQoKTtcbiAgICAgICAgdGhpcy5hcHBlbmRDaGlsZChmbGFtZUVsZW1lbnQpO1xuICAgICAgICBmbGFtZUVsZW1lbnQub25jbGljayA9ICgpID0+IHRoaXMudG9nZ2xlKCk7XG4gICAgICAgIGNvbnN0IHByb2plY3RDb3VudCA9IHRoaXMuX3Byb2plY3RDb3VudCA9IG5ldyBleHBvcnRzLlByb2plY3RDb3VudEVsZW1lbnQoKTtcbiAgICAgICAgdGhpcy5hcHBlbmRDaGlsZChwcm9qZWN0Q291bnQpO1xuICAgICAgICBwcm9qZWN0Q291bnQub25jbGljayA9ICgpID0+IHRoaXMudG9nZ2xlU29sdXRpb25JbmZvcm1hdGlvbigpO1xuICAgICAgICBwcm9qZWN0Q291bnQucHJvamVjdHMuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICBjb25zdCBkaWFnbm9zdGljcyA9IHRoaXMuX2RpYWdub3N0aWNzID0gbmV3IGV4cG9ydHMuRGlhZ25vc3RpY3NFbGVtZW50KCk7XG4gICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQoZGlhZ25vc3RpY3MpO1xuICAgICAgICBkaWFnbm9zdGljcy5kaWFnbm9zdGljQ2xpY2sgPSAoKSA9PiB0aGlzLnRvZ2dsZUVycm9yV2FybmluZ1BhbmVsKCk7XG4gICAgICAgIGRpYWdub3N0aWNzLnN5bmNDbGljayA9ICgpID0+IHRoaXMuZG9Db2RlQ2hlY2soKTtcbiAgICAgICAgZGlhZ25vc3RpY3Muc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgdGhpcy5fc3RhdGUgPSB7IHN0YXR1czoge30gfTtcbiAgICB9XG4gICAgYXR0YWNoZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoT21uaS5kaWFnbm9zdGljc0NvdW50cy5zdWJzY3JpYmUoY291bnRzID0+IHtcbiAgICAgICAgICAgIHRoaXMuX2RpYWdub3N0aWNzLnVwZGF0ZVN0YXRlKHtcbiAgICAgICAgICAgICAgICBlcnJvckNvdW50OiBjb3VudHNbXCJlcnJvclwiXSB8fCAwLFxuICAgICAgICAgICAgICAgIHdhcm5pbmdDb3VudDogY291bnRzW1wid2FybmluZ1wiXSB8fCAwXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChPYnNlcnZhYmxlLm1lcmdlKE9tbmkuYWN0aXZlTW9kZWwsIE9tbmkuYWN0aXZlTW9kZWwuZmxhdE1hcCh4ID0+IHgub2JzZXJ2ZS5zdGF0ZSkpXG4gICAgICAgICAgICAuc3Vic2NyaWJlKG1vZGVsID0+IHtcbiAgICAgICAgICAgIHRoaXMuX2ZsYW1lLnVwZGF0ZVN0YXRlKG1vZGVsKTtcbiAgICAgICAgICAgIHVwZGF0ZVN0YXRlKHRoaXMuX3N0YXRlLCBtb2RlbCk7XG4gICAgICAgICAgICB0aGlzLl91cGRhdGVWaXNpYmxlKCk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoc2VydmVyLm9ic2VydmUucHJvamVjdHNcbiAgICAgICAgICAgIC5kZWJvdW5jZVRpbWUoNTAwKVxuICAgICAgICAgICAgLnN1YnNjcmliZShwcm9qZWN0cyA9PiB0aGlzLl9wcm9qZWN0Q291bnQudXBkYXRlU3RhdGUoeyBwcm9qZWN0Q291bnQ6IHByb2plY3RzLmxlbmd0aCB9KSkpO1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChzZXJ2ZXIub2JzZXJ2ZS5zdGF0dXNcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoc3RhdHVzID0+IHRoaXMuX2ZsYW1lLnVwZGF0ZU91dGdvaW5nKHN0YXR1cyB8fCB7fSkpKTtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoc2VydmVyLm9ic2VydmUubW9kZWxcbiAgICAgICAgICAgIC5zdWJzY3JpYmUobW9kZWwgPT4ge1xuICAgICAgICAgICAgY29uc3Qgc29sdXRpb25OdW1iZXIgPSBTb2x1dGlvbk1hbmFnZXIuYWN0aXZlU29sdXRpb25zLmxlbmd0aCA+IDEgPyBfLnRyaW0oc2VydmVyLm1vZGVsICYmIHNlcnZlci5tb2RlbC5pbmRleCwgXCJjbGllbnRcIikgOiBcIlwiO1xuICAgICAgICAgICAgdGhpcy5fcHJvamVjdENvdW50LnVwZGF0ZVNvbHV0aW9uTnVtYmVyKHNvbHV0aW9uTnVtYmVyKTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChPbW5pLmFjdGl2ZUVkaXRvck9yQ29uZmlnRWRpdG9yLnN1YnNjcmliZShlZGl0b3IgPT4ge1xuICAgICAgICAgICAgdGhpcy5fdXBkYXRlVmlzaWJsZSghIWVkaXRvcik7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoU29sdXRpb25NYW5hZ2VyLmFjdGl2ZVNvbHV0aW9uXG4gICAgICAgICAgICAuc3Vic2NyaWJlKHNvbHV0aW9ucyA9PiB7XG4gICAgICAgICAgICBjb25zdCBzb2x1dGlvbk51bWJlciA9IFNvbHV0aW9uTWFuYWdlci5hY3RpdmVTb2x1dGlvbnMubGVuZ3RoID4gMSA/IF8udHJpbShzZXJ2ZXIubW9kZWwgJiYgc2VydmVyLm1vZGVsLmluZGV4LCBcImNsaWVudFwiKSA6IFwiXCI7XG4gICAgICAgICAgICB0aGlzLl9wcm9qZWN0Q291bnQudXBkYXRlU29sdXRpb25OdW1iZXIoc29sdXRpb25OdW1iZXIpO1xuICAgICAgICB9KSk7XG4gICAgfVxuICAgIF91cGRhdGVWaXNpYmxlKGhhc1ZhbGlkRWRpdG9yKSB7XG4gICAgICAgIGlmICh0eXBlb2YgaGFzVmFsaWRFZGl0b3IgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgIHRoaXMuX2hhc1ZhbGlkRWRpdG9yID0gaGFzVmFsaWRFZGl0b3I7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuX3N0YXRlLmlzT24gJiYgdGhpcy5faGFzVmFsaWRFZGl0b3IpIHtcbiAgICAgICAgICAgIHRoaXMuX3Nob3dPblN0YXRlSXRlbXMoKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX2hpZGVPblN0YXRlSXRlbXMoKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBfc2hvd09uU3RhdGVJdGVtcygpIHtcbiAgICAgICAgZmFzdGRvbS5tZWFzdXJlKCgpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9kaWFnbm9zdGljcy5zdHlsZS5kaXNwbGF5ID09PSBcIm5vbmVcIikge1xuICAgICAgICAgICAgICAgIGZhc3Rkb20ubXV0YXRlKCgpID0+IHRoaXMuX2RpYWdub3N0aWNzLnN0eWxlLmRpc3BsYXkgPSBcIlwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLl9wcm9qZWN0Q291bnQucHJvamVjdHMuc3R5bGUuZGlzcGxheSA9PT0gXCJub25lXCIpIHtcbiAgICAgICAgICAgICAgICBmYXN0ZG9tLm11dGF0ZSgoKSA9PiB0aGlzLl9wcm9qZWN0Q291bnQucHJvamVjdHMuc3R5bGUuZGlzcGxheSA9IFwiXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG4gICAgX2hpZGVPblN0YXRlSXRlbXMoKSB7XG4gICAgICAgIGZhc3Rkb20ubWVhc3VyZSgoKSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5fZGlhZ25vc3RpY3Muc3R5bGUuZGlzcGxheSAhPT0gXCJub25lXCIpIHtcbiAgICAgICAgICAgICAgICBmYXN0ZG9tLm11dGF0ZSgoKSA9PiB0aGlzLl9kaWFnbm9zdGljcy5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMuX3Byb2plY3RDb3VudC5wcm9qZWN0cy5zdHlsZS5kaXNwbGF5ICE9PSBcIm5vbmVcIikge1xuICAgICAgICAgICAgICAgIGZhc3Rkb20ubXV0YXRlKCgpID0+IHRoaXMuX3Byb2plY3RDb3VudC5wcm9qZWN0cy5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG4gICAgZGV0YWNoZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfVxuICAgIGRpc3Bvc2UoKSB7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgIH1cbiAgICB0b2dnbGUoKSB7XG4gICAgICAgIGF0b20uY29tbWFuZHMuZGlzcGF0Y2goYXRvbS52aWV3cy5nZXRWaWV3KGF0b20ud29ya3NwYWNlKSwgXCJvbW5pc2hhcnAtYXRvbTp0b2dnbGUtZG9ja1wiKTtcbiAgICB9XG4gICAgdG9nZ2xlRXJyb3JXYXJuaW5nUGFuZWwoKSB7XG4gICAgICAgIGF0b20uY29tbWFuZHMuZGlzcGF0Y2goYXRvbS52aWV3cy5nZXRWaWV3KGF0b20ud29ya3NwYWNlKSwgXCJvbW5pc2hhcnAtYXRvbTpkb2NrLXRvZ2dsZS1lcnJvcnNcIik7XG4gICAgfVxuICAgIHRvZ2dsZVNvbHV0aW9uSW5mb3JtYXRpb24oKSB7XG4gICAgICAgIGF0b20uY29tbWFuZHMuZGlzcGF0Y2goYXRvbS52aWV3cy5nZXRWaWV3KGF0b20ud29ya3NwYWNlKSwgXCJvbW5pc2hhcnAtYXRvbTpzb2x1dGlvbi1zdGF0dXNcIik7XG4gICAgfVxuICAgIGRvQ29kZUNoZWNrKCkge1xuICAgICAgICBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSksIFwib21uaXNoYXJwLWF0b206Y29kZS1jaGVja1wiKTtcbiAgICB9XG59XG5leHBvcnRzLlN0YXR1c0JhckVsZW1lbnQgPSBkb2N1bWVudC5yZWdpc3RlckVsZW1lbnQoXCJvbW5pc2hhcnAtc3RhdHVzLWJhclwiLCB7IHByb3RvdHlwZTogU3RhdHVzQmFyRWxlbWVudC5wcm90b3R5cGUgfSk7XG4iLCIvKiB0c2xpbnQ6ZGlzYWJsZTpuby1zdHJpbmctbGl0ZXJhbCAqL1xyXG5pbXBvcnQge09ic2VydmFibGV9IGZyb20gXCJyeGpzXCI7XHJcbmltcG9ydCB7Q29tcG9zaXRlRGlzcG9zYWJsZSwgSURpc3Bvc2FibGV9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XHJcbmltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcclxuaW1wb3J0IHtPbW5pfSBmcm9tIFwiLi4vc2VydmVyL29tbmlcIjtcclxuaW1wb3J0IHtPbW5pc2hhcnBDbGllbnRTdGF0dXN9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XHJcbmltcG9ydCB7c2VydmVyfSBmcm9tIFwiLi4vYXRvbS9zZXJ2ZXItaW5mb3JtYXRpb25cIjtcclxuaW1wb3J0IHtTb2x1dGlvbk1hbmFnZXJ9IGZyb20gXCIuLi9zZXJ2ZXIvc29sdXRpb24tbWFuYWdlclwiO1xyXG5sZXQgZmFzdGRvbTogdHlwZW9mIEZhc3Rkb20gPSByZXF1aXJlKFwiZmFzdGRvbVwiKTtcclxuXHJcbmZ1bmN0aW9uIGFkZENsYXNzSWZOb3RpbmNsdWRlcyhpY29uOiBIVE1MRWxlbWVudCwgLi4uY2xzOiBzdHJpbmdbXSkge1xyXG4gICAgaWYgKGljb24pIHtcclxuICAgICAgICBmYXN0ZG9tLm1lYXN1cmUoKCkgPT4ge1xyXG4gICAgICAgICAgICBfLmVhY2goY2xzLCBjID0+IHtcclxuICAgICAgICAgICAgICAgIGlmICghaWNvbi5jbGFzc0xpc3QuY29udGFpbnMoYykpXHJcbiAgICAgICAgICAgICAgICAgICAgZmFzdGRvbS5tdXRhdGUoKCkgPT4gaWNvbi5jbGFzc0xpc3QuYWRkKGMpKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn1cclxuZnVuY3Rpb24gcmVtb3ZlQ2xhc3NJZmluY2x1ZGVzKGljb246IEhUTUxFbGVtZW50LCAuLi5jbHM6IHN0cmluZ1tdKSB7XHJcbiAgICBpZiAoaWNvbikge1xyXG4gICAgICAgIGZhc3Rkb20ubWVhc3VyZSgoKSA9PiB7XHJcbiAgICAgICAgICAgIF8uZWFjaChjbHMsIGMgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKGljb24uY2xhc3NMaXN0LmNvbnRhaW5zKGMpKVxyXG4gICAgICAgICAgICAgICAgICAgIGZhc3Rkb20ubXV0YXRlKCgpID0+IGljb24uY2xhc3NMaXN0LnJlbW92ZShjKSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59XHJcblxyXG5pbnRlcmZhY2UgU3RhdHVzQmFyU3RhdGUge1xyXG4gICAgaXNPZmY/OiBib29sZWFuO1xyXG4gICAgaXNDb25uZWN0aW5nPzogYm9vbGVhbjtcclxuICAgIGlzT24/OiBib29sZWFuO1xyXG4gICAgaXNSZWFkeT86IGJvb2xlYW47XHJcbiAgICBpc0Vycm9yPzogYm9vbGVhbjtcclxuICAgIHN0YXR1cz86IE9tbmlzaGFycENsaWVudFN0YXR1cztcclxufVxyXG5cclxuZnVuY3Rpb24gdXBkYXRlU3RhdGUoc2VsZjogYW55LCBzdGF0ZTogYW55KSB7XHJcbiAgICBfLmVhY2goT21uaS52aWV3TW9kZWxTdGF0ZWZ1bFByb3BlcnRpZXMsIHggPT4ge1xyXG4gICAgICAgIGlmIChfLmhhcyhzdGF0ZSwgeCkpIHtcclxuICAgICAgICAgICAgc2VsZlt4XSA9IHN0YXRlW3hdO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgRmxhbWVFbGVtZW50IGV4dGVuZHMgSFRNTEFuY2hvckVsZW1lbnQgaW1wbGVtZW50cyBXZWJDb21wb25lbnQge1xyXG4gICAgcHJpdmF0ZSBfc3RhdGU6IHtcclxuICAgICAgICBpc09mZj86IGJvb2xlYW47XHJcbiAgICAgICAgaXNDb25uZWN0aW5nPzogYm9vbGVhbjtcclxuICAgICAgICBpc09uPzogYm9vbGVhbjtcclxuICAgICAgICBpc1JlYWR5PzogYm9vbGVhbjtcclxuICAgICAgICBpc0Vycm9yPzogYm9vbGVhbjtcclxuICAgICAgICBzdGF0dXM/OiBPbW5pc2hhcnBDbGllbnRTdGF0dXM7XHJcbiAgICB9O1xyXG5cclxuICAgIHByaXZhdGUgX2ljb246IEhUTUxTcGFuRWxlbWVudDtcclxuICAgIHByaXZhdGUgX291dGdvaW5nOiBIVE1MU3BhbkVsZW1lbnQ7XHJcblxyXG4gICAgcHVibGljIGNyZWF0ZWRDYWxsYmFjaygpIHtcclxuICAgICAgICB0aGlzLmNsYXNzTGlzdC5hZGQoXCJvbW5pc2hhcnAtYXRvbS1idXR0b25cIik7XHJcbiAgICAgICAgdGhpcy5fc3RhdGUgPSB7IHN0YXR1czogPGFueT57fSB9O1xyXG5cclxuICAgICAgICBjb25zdCBpY29uID0gdGhpcy5faWNvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xyXG4gICAgICAgIGljb24uY2xhc3NMaXN0LmFkZChcImljb25cIiwgXCJpY29uLWZsYW1lXCIpO1xyXG4gICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQoaWNvbik7XHJcblxyXG4gICAgICAgIGNvbnN0IG91dGdvaW5nID0gdGhpcy5fb3V0Z29pbmcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcclxuICAgICAgICBvdXRnb2luZy5jbGFzc0xpc3QuYWRkKFwib3V0Z29pbmctcmVxdWVzdHNcIik7XHJcbiAgICAgICAgdGhpcy5hcHBlbmRDaGlsZChvdXRnb2luZyk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHVwZGF0ZVN0YXRlKHN0YXRlOiB0eXBlb2YgRmxhbWVFbGVtZW50LnByb3RvdHlwZS5fc3RhdGUpIHtcclxuICAgICAgICB1cGRhdGVTdGF0ZSh0aGlzLl9zdGF0ZSwgc3RhdGUpO1xyXG4gICAgICAgIGNvbnN0IGljb24gPSB0aGlzLl9pY29uO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5fc3RhdGUuaXNPZmYpIHtcclxuICAgICAgICAgICAgcmVtb3ZlQ2xhc3NJZmluY2x1ZGVzKGljb24sIFwidGV4dC1zdWJ0bGVcIik7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgYWRkQ2xhc3NJZk5vdGluY2x1ZGVzKGljb24sIFwidGV4dC1zdWJ0bGVcIik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5fc3RhdGUuaXNSZWFkeSkge1xyXG4gICAgICAgICAgICBhZGRDbGFzc0lmTm90aW5jbHVkZXMoaWNvbiwgXCJ0ZXh0LXN1Y2Nlc3NcIik7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmVtb3ZlQ2xhc3NJZmluY2x1ZGVzKGljb24sIFwidGV4dC1zdWNjZXNzXCIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX3N0YXRlLmlzRXJyb3IpIHtcclxuICAgICAgICAgICAgYWRkQ2xhc3NJZk5vdGluY2x1ZGVzKGljb24sIFwidGV4dC1lcnJvclwiKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByZW1vdmVDbGFzc0lmaW5jbHVkZXMoaWNvbiwgXCJ0ZXh0LWVycm9yXCIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX3N0YXRlLmlzQ29ubmVjdGluZykge1xyXG4gICAgICAgICAgICBhZGRDbGFzc0lmTm90aW5jbHVkZXMoaWNvbiwgXCJpY29uLWZsYW1lLWxvYWRpbmdcIik7XHJcbiAgICAgICAgICAgIHJlbW92ZUNsYXNzSWZpbmNsdWRlcyhpY29uLCBcImljb24tZmxhbWUtcHJvY2Vzc2luZ1wiKTtcclxuICAgICAgICAgICAgcmVtb3ZlQ2xhc3NJZmluY2x1ZGVzKGljb24sIFwiaWNvbi1mbGFtZS1sb2FkaW5nXCIpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5fc3RhdGUuc3RhdHVzLmhhc091dGdvaW5nUmVxdWVzdHMpIHtcclxuICAgICAgICAgICAgYWRkQ2xhc3NJZk5vdGluY2x1ZGVzKGljb24sIFwiaWNvbi1mbGFtZS1wcm9jZXNzaW5nXCIpO1xyXG4gICAgICAgICAgICByZW1vdmVDbGFzc0lmaW5jbHVkZXMoaWNvbiwgXCJpY29uLWZsYW1lLWxvYWRpbmdcIik7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmVtb3ZlQ2xhc3NJZmluY2x1ZGVzKGljb24sIFwiaWNvbi1mbGFtZS1wcm9jZXNzaW5nXCIpO1xyXG4gICAgICAgICAgICByZW1vdmVDbGFzc0lmaW5jbHVkZXMoaWNvbiwgXCJpY29uLWZsYW1lLWxvYWRpbmdcIik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB1cGRhdGVPdXRnb2luZyhzdGF0dXM6IHR5cGVvZiBGbGFtZUVsZW1lbnQucHJvdG90eXBlLl9zdGF0ZS5zdGF0dXMpIHtcclxuICAgICAgICBpZiAoc3RhdHVzLmhhc091dGdvaW5nUmVxdWVzdHMgJiYgc3RhdHVzLm91dGdvaW5nUmVxdWVzdHMgPiAwKSB7XHJcbiAgICAgICAgICAgIHJlbW92ZUNsYXNzSWZpbmNsdWRlcyh0aGlzLl9vdXRnb2luZywgXCJmYWRlXCIpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGFkZENsYXNzSWZOb3RpbmNsdWRlcyh0aGlzLl9vdXRnb2luZywgXCJmYWRlXCIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHN0YXR1cy5vdXRnb2luZ1JlcXVlc3RzICE9PSB0aGlzLl9zdGF0ZS5zdGF0dXMub3V0Z29pbmdSZXF1ZXN0cykge1xyXG4gICAgICAgICAgICBmYXN0ZG9tLm11dGF0ZSgoKSA9PiB0aGlzLl9vdXRnb2luZy5pbm5lclRleHQgPSBzdGF0dXMub3V0Z29pbmdSZXF1ZXN0cyAmJiBzdGF0dXMub3V0Z29pbmdSZXF1ZXN0cy50b1N0cmluZygpIHx8IFwiMFwiKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuX3N0YXRlLnN0YXR1cyA9IHN0YXR1cyB8fCA8YW55Pnt9O1xyXG4gICAgICAgIHRoaXMudXBkYXRlU3RhdGUodGhpcy5fc3RhdGUpO1xyXG4gICAgfVxyXG59XHJcblxyXG4oPGFueT5leHBvcnRzKS5GbGFtZUVsZW1lbnQgPSAoPGFueT5kb2N1bWVudCkucmVnaXN0ZXJFbGVtZW50KFwib21uaXNoYXJwLWZsYW1lXCIsIHsgcHJvdG90eXBlOiBGbGFtZUVsZW1lbnQucHJvdG90eXBlIH0pO1xyXG5cclxuZXhwb3J0IGNsYXNzIERpYWdub3N0aWNzRWxlbWVudCBleHRlbmRzIEhUTUxBbmNob3JFbGVtZW50IGltcGxlbWVudHMgV2ViQ29tcG9uZW50IHtcclxuICAgIHByaXZhdGUgX3N0YXRlOiB7XHJcbiAgICAgICAgZXJyb3JDb3VudDogbnVtYmVyO1xyXG4gICAgICAgIHdhcm5pbmdDb3VudDogbnVtYmVyO1xyXG4gICAgfTtcclxuICAgIHByaXZhdGUgX2Vycm9yczogSFRNTFNwYW5FbGVtZW50O1xyXG4gICAgcHJpdmF0ZSBfd2FybmluZ3M6IEhUTUxTcGFuRWxlbWVudDtcclxuICAgIHByaXZhdGUgX3N5bmM6IEhUTUxBbmNob3JFbGVtZW50O1xyXG5cclxuICAgIHB1YmxpYyBjcmVhdGVkQ2FsbGJhY2soKSB7XHJcbiAgICAgICAgdGhpcy5jbGFzc0xpc3QuYWRkKFwiaW5saW5lLWJsb2NrXCIsIFwiZXJyb3Itd2FybmluZy1zdW1tYXJ5XCIpO1xyXG5cclxuICAgICAgICBjb25zdCBzeW5jID0gdGhpcy5fc3luYyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJhXCIpO1xyXG4gICAgICAgIHN5bmMuY2xhc3NMaXN0LmFkZChcImljb25cIiwgXCJpY29uLXN5bmNcIiwgXCJ0ZXh0LXN1YnRsZVwiKTtcclxuICAgICAgICB0aGlzLmFwcGVuZENoaWxkKHN5bmMpO1xyXG4gICAgICAgIHN5bmMub25jbGljayA9ICgpID0+IHRoaXMuc3luY0NsaWNrKCk7XHJcblxyXG4gICAgICAgIGNvbnN0IHMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcclxuICAgICAgICB0aGlzLmFwcGVuZENoaWxkKHMpO1xyXG4gICAgICAgIHMub25jbGljayA9ICgpID0+IHRoaXMuZGlhZ25vc3RpY0NsaWNrKCk7XHJcblxyXG4gICAgICAgIGNvbnN0IGVycm9yc0ljb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcclxuICAgICAgICBlcnJvcnNJY29uLmNsYXNzTGlzdC5hZGQoXCJpY29uXCIsIFwiaWNvbi1pc3N1ZS1vcGVuZWRcIik7XHJcbiAgICAgICAgcy5hcHBlbmRDaGlsZChlcnJvcnNJY29uKTtcclxuXHJcbiAgICAgICAgY29uc3QgZXJyb3JzID0gdGhpcy5fZXJyb3JzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XHJcbiAgICAgICAgZXJyb3JzLmNsYXNzTGlzdC5hZGQoXCJlcnJvci1zdW1tYXJ5XCIpO1xyXG4gICAgICAgIHMuYXBwZW5kQ2hpbGQoZXJyb3JzKTtcclxuXHJcbiAgICAgICAgY29uc3Qgd2FybmluZ3NJY29uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XHJcbiAgICAgICAgd2FybmluZ3NJY29uLmNsYXNzTGlzdC5hZGQoXCJpY29uXCIsIFwiaWNvbi1hbGVydFwiKTtcclxuICAgICAgICBzLmFwcGVuZENoaWxkKHdhcm5pbmdzSWNvbik7XHJcblxyXG4gICAgICAgIGNvbnN0IHdhcm5pbmdzID0gdGhpcy5fd2FybmluZ3MgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcclxuICAgICAgICB3YXJuaW5ncy5jbGFzc0xpc3QuYWRkKFwid2FybmluZy1zdW1tYXJ5XCIpO1xyXG4gICAgICAgIHMuYXBwZW5kQ2hpbGQod2FybmluZ3MpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB1cGRhdGVTdGF0ZShzdGF0ZTogdHlwZW9mIERpYWdub3N0aWNzRWxlbWVudC5wcm90b3R5cGUuX3N0YXRlKSB7XHJcbiAgICAgICAgaWYgKCFfLmlzRXF1YWwodGhpcy5fc3RhdGUsIHN0YXRlKSkge1xyXG4gICAgICAgICAgICB0aGlzLl9zdGF0ZSA9IHN0YXRlO1xyXG4gICAgICAgICAgICBmYXN0ZG9tLm11dGF0ZSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fc3RhdGUuZXJyb3JDb3VudCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2Vycm9ycy5pbm5lclRleHQgPSB0aGlzLl9zdGF0ZS5lcnJvckNvdW50LnRvU3RyaW5nKCk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2Vycm9ycy5pbm5lclRleHQgPSBcIjBcIjtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fc3RhdGUud2FybmluZ0NvdW50KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fd2FybmluZ3MuaW5uZXJUZXh0ID0gdGhpcy5fc3RhdGUud2FybmluZ0NvdW50LnRvU3RyaW5nKCk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3dhcm5pbmdzLmlubmVyVGV4dCA9IFwiMFwiO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHN5bmNDbGljazogKCkgPT4gdm9pZDtcclxuICAgIHB1YmxpYyBkaWFnbm9zdGljQ2xpY2s6ICgpID0+IHZvaWQ7XHJcbn1cclxuXHJcbig8YW55PmV4cG9ydHMpLkRpYWdub3N0aWNzRWxlbWVudCA9ICg8YW55PmRvY3VtZW50KS5yZWdpc3RlckVsZW1lbnQoXCJvbW5pc2hhcnAtZGlhZ25vc3RpY3NcIiwgeyBwcm90b3R5cGU6IERpYWdub3N0aWNzRWxlbWVudC5wcm90b3R5cGUgfSk7XHJcblxyXG5leHBvcnQgY2xhc3MgUHJvamVjdENvdW50RWxlbWVudCBleHRlbmRzIEhUTUxBbmNob3JFbGVtZW50IGltcGxlbWVudHMgV2ViQ29tcG9uZW50IHtcclxuICAgIHByaXZhdGUgX3N0YXRlOiB7IHByb2plY3RDb3VudDogbnVtYmVyIH07XHJcbiAgICBwdWJsaWMgcHJvamVjdHM6IEhUTUxTcGFuRWxlbWVudDtcclxuICAgIHByaXZhdGUgX3NvbHV0aW9uTnVubWJlcjogSFRNTFNwYW5FbGVtZW50O1xyXG5cclxuICAgIHB1YmxpYyBjcmVhdGVkQ2FsbGJhY2soKSB7XHJcbiAgICAgICAgdGhpcy5jbGFzc0xpc3QuYWRkKFwiaW5saW5lLWJsb2NrXCIsIFwicHJvamVjdC1zdW1tYXJ5XCIsIFwicHJvamVjdHMtaWNvblwiKTtcclxuXHJcbiAgICAgICAgY29uc3QgaWNvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xyXG4gICAgICAgIGljb24uY2xhc3NMaXN0LmFkZChcImljb25cIiwgXCJpY29uLXB1bHNlXCIpO1xyXG4gICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQoaWNvbik7XHJcblxyXG4gICAgICAgIGNvbnN0IHN1YiA9IHRoaXMuX3NvbHV0aW9uTnVubWJlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzdWJcIik7XHJcbiAgICAgICAgaWNvbi5hcHBlbmRDaGlsZChzdWIpO1xyXG5cclxuICAgICAgICBjb25zdCBwcm9qZWN0cyA9IHRoaXMucHJvamVjdHMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcclxuICAgICAgICBwcm9qZWN0cy5jbGFzc0xpc3QuYWRkKFwicHJvamVjdHNcIik7XHJcbiAgICAgICAgcHJvamVjdHMuaW5uZXJUZXh0ID0gXCIwIFByb2plY3RzXCI7XHJcbiAgICAgICAgdGhpcy5hcHBlbmRDaGlsZChwcm9qZWN0cyk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHVwZGF0ZVN0YXRlKHN0YXRlOiB0eXBlb2YgUHJvamVjdENvdW50RWxlbWVudC5wcm90b3R5cGUuX3N0YXRlKSB7XHJcbiAgICAgICAgaWYgKCFfLmlzRXF1YWwodGhpcy5fc3RhdGUsIHN0YXRlKSkge1xyXG4gICAgICAgICAgICB0aGlzLl9zdGF0ZSA9IHN0YXRlO1xyXG4gICAgICAgICAgICBmYXN0ZG9tLm11dGF0ZSgoKSA9PiB0aGlzLnByb2plY3RzLmlubmVyVGV4dCA9IGAke3RoaXMuX3N0YXRlLnByb2plY3RDb3VudH0gUHJvamVjdHNgKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHVwZGF0ZVNvbHV0aW9uTnVtYmVyKHNvbHV0aW9uTnVtYmVyOiBzdHJpbmcpIHtcclxuICAgICAgICBmYXN0ZG9tLm11dGF0ZSgoKSA9PiB0aGlzLl9zb2x1dGlvbk51bm1iZXIuaW5uZXJUZXh0ID0gc29sdXRpb25OdW1iZXIpO1xyXG4gICAgfVxyXG59XHJcblxyXG4oPGFueT5leHBvcnRzKS5Qcm9qZWN0Q291bnRFbGVtZW50ID0gKDxhbnk+ZG9jdW1lbnQpLnJlZ2lzdGVyRWxlbWVudChcIm9tbmlzaGFycC1wcm9qZWN0LWNvdW50XCIsIHsgcHJvdG90eXBlOiBQcm9qZWN0Q291bnRFbGVtZW50LnByb3RvdHlwZSB9KTtcclxuXHJcblxyXG5leHBvcnQgY2xhc3MgU3RhdHVzQmFyRWxlbWVudCBleHRlbmRzIEhUTUxFbGVtZW50IGltcGxlbWVudHMgV2ViQ29tcG9uZW50LCBJRGlzcG9zYWJsZSB7XHJcbiAgICBwcml2YXRlIF9zdGF0ZTogU3RhdHVzQmFyU3RhdGU7XHJcbiAgICBwcml2YXRlIF9kaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xyXG4gICAgcHJpdmF0ZSBfZmxhbWU6IEZsYW1lRWxlbWVudDtcclxuICAgIHByaXZhdGUgX2RpYWdub3N0aWNzOiBEaWFnbm9zdGljc0VsZW1lbnQ7XHJcbiAgICBwcml2YXRlIF9wcm9qZWN0Q291bnQ6IFByb2plY3RDb3VudEVsZW1lbnQ7XHJcblxyXG4gICAgcHVibGljIGNyZWF0ZWRDYWxsYmFjaygpIHtcclxuICAgICAgICB0aGlzLmNsYXNzTGlzdC5hZGQoXCJpbmxpbmUtYmxvY2tcIik7XHJcblxyXG4gICAgICAgIGNvbnN0IGZsYW1lRWxlbWVudCA9IHRoaXMuX2ZsYW1lID0gPEZsYW1lRWxlbWVudD5uZXcgZXhwb3J0cy5GbGFtZUVsZW1lbnQoKTtcclxuICAgICAgICB0aGlzLmFwcGVuZENoaWxkKGZsYW1lRWxlbWVudCk7XHJcbiAgICAgICAgZmxhbWVFbGVtZW50Lm9uY2xpY2sgPSAoKSA9PiB0aGlzLnRvZ2dsZSgpO1xyXG5cclxuICAgICAgICBjb25zdCBwcm9qZWN0Q291bnQgPSB0aGlzLl9wcm9qZWN0Q291bnQgPSA8UHJvamVjdENvdW50RWxlbWVudD5uZXcgZXhwb3J0cy5Qcm9qZWN0Q291bnRFbGVtZW50KCk7XHJcbiAgICAgICAgdGhpcy5hcHBlbmRDaGlsZChwcm9qZWN0Q291bnQpO1xyXG4gICAgICAgIHByb2plY3RDb3VudC5vbmNsaWNrID0gKCkgPT4gdGhpcy50b2dnbGVTb2x1dGlvbkluZm9ybWF0aW9uKCk7XHJcbiAgICAgICAgcHJvamVjdENvdW50LnByb2plY3RzLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcclxuXHJcbiAgICAgICAgY29uc3QgZGlhZ25vc3RpY3MgPSB0aGlzLl9kaWFnbm9zdGljcyA9IDxEaWFnbm9zdGljc0VsZW1lbnQ+bmV3IGV4cG9ydHMuRGlhZ25vc3RpY3NFbGVtZW50KCk7XHJcbiAgICAgICAgdGhpcy5hcHBlbmRDaGlsZChkaWFnbm9zdGljcyk7XHJcbiAgICAgICAgZGlhZ25vc3RpY3MuZGlhZ25vc3RpY0NsaWNrID0gKCkgPT4gdGhpcy50b2dnbGVFcnJvcldhcm5pbmdQYW5lbCgpO1xyXG4gICAgICAgIGRpYWdub3N0aWNzLnN5bmNDbGljayA9ICgpID0+IHRoaXMuZG9Db2RlQ2hlY2soKTtcclxuICAgICAgICBkaWFnbm9zdGljcy5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XHJcblxyXG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG4gICAgICAgIHRoaXMuX3N0YXRlID0geyBzdGF0dXM6IDxhbnk+e30gfTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgYXR0YWNoZWRDYWxsYmFjaygpIHtcclxuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChPbW5pLmRpYWdub3N0aWNzQ291bnRzLnN1YnNjcmliZShjb3VudHMgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLl9kaWFnbm9zdGljcy51cGRhdGVTdGF0ZSh7XHJcbiAgICAgICAgICAgICAgICBlcnJvckNvdW50OiBjb3VudHNbXCJlcnJvclwiXSB8fCAwLFxyXG4gICAgICAgICAgICAgICAgd2FybmluZ0NvdW50OiBjb3VudHNbXCJ3YXJuaW5nXCJdIHx8IDBcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChPYnNlcnZhYmxlLm1lcmdlKE9tbmkuYWN0aXZlTW9kZWwsIE9tbmkuYWN0aXZlTW9kZWwuZmxhdE1hcCh4ID0+IHgub2JzZXJ2ZS5zdGF0ZSkpXHJcbiAgICAgICAgICAgIC5zdWJzY3JpYmUobW9kZWwgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fZmxhbWUudXBkYXRlU3RhdGUobW9kZWwpO1xyXG4gICAgICAgICAgICAgICAgdXBkYXRlU3RhdGUodGhpcy5fc3RhdGUsIG1vZGVsKTtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLl91cGRhdGVWaXNpYmxlKCk7XHJcbiAgICAgICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoc2VydmVyLm9ic2VydmUucHJvamVjdHNcclxuICAgICAgICAgICAgLmRlYm91bmNlVGltZSg1MDApXHJcbiAgICAgICAgICAgIC5zdWJzY3JpYmUocHJvamVjdHMgPT4gdGhpcy5fcHJvamVjdENvdW50LnVwZGF0ZVN0YXRlKHsgcHJvamVjdENvdW50OiBwcm9qZWN0cy5sZW5ndGggfSkpKTtcclxuXHJcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoc2VydmVyLm9ic2VydmUuc3RhdHVzXHJcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoc3RhdHVzID0+IHRoaXMuX2ZsYW1lLnVwZGF0ZU91dGdvaW5nKHN0YXR1cyB8fCA8YW55Pnt9KSkpO1xyXG5cclxuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChzZXJ2ZXIub2JzZXJ2ZS5tb2RlbFxyXG4gICAgICAgICAgICAuc3Vic2NyaWJlKG1vZGVsID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHNvbHV0aW9uTnVtYmVyID0gU29sdXRpb25NYW5hZ2VyLmFjdGl2ZVNvbHV0aW9ucy5sZW5ndGggPiAxID8gXy50cmltKHNlcnZlci5tb2RlbCAmJiAoPGFueT5zZXJ2ZXIubW9kZWwpLmluZGV4LCBcImNsaWVudFwiKSA6IFwiXCI7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9wcm9qZWN0Q291bnQudXBkYXRlU29sdXRpb25OdW1iZXIoc29sdXRpb25OdW1iZXIpO1xyXG4gICAgICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKE9tbmkuYWN0aXZlRWRpdG9yT3JDb25maWdFZGl0b3Iuc3Vic2NyaWJlKGVkaXRvciA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuX3VwZGF0ZVZpc2libGUoISFlZGl0b3IpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoU29sdXRpb25NYW5hZ2VyLmFjdGl2ZVNvbHV0aW9uXHJcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoc29sdXRpb25zID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHNvbHV0aW9uTnVtYmVyID0gU29sdXRpb25NYW5hZ2VyLmFjdGl2ZVNvbHV0aW9ucy5sZW5ndGggPiAxID8gXy50cmltKHNlcnZlci5tb2RlbCAmJiAoPGFueT5zZXJ2ZXIubW9kZWwpLmluZGV4LCBcImNsaWVudFwiKSA6IFwiXCI7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9wcm9qZWN0Q291bnQudXBkYXRlU29sdXRpb25OdW1iZXIoc29sdXRpb25OdW1iZXIpO1xyXG4gICAgICAgICAgICB9KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfaGFzVmFsaWRFZGl0b3I6IGJvb2xlYW4gPSBmYWxzZTtcclxuICAgIHByaXZhdGUgX3VwZGF0ZVZpc2libGUoaGFzVmFsaWRFZGl0b3I/OiBib29sZWFuKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBoYXNWYWxpZEVkaXRvciAhPT0gXCJ1bmRlZmluZWRcIikge1xyXG4gICAgICAgICAgICB0aGlzLl9oYXNWYWxpZEVkaXRvciA9IGhhc1ZhbGlkRWRpdG9yO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX3N0YXRlLmlzT24gJiYgdGhpcy5faGFzVmFsaWRFZGl0b3IpIHtcclxuICAgICAgICAgICAgdGhpcy5fc2hvd09uU3RhdGVJdGVtcygpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2hpZGVPblN0YXRlSXRlbXMoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfc2hvd09uU3RhdGVJdGVtcygpIHtcclxuICAgICAgICBmYXN0ZG9tLm1lYXN1cmUoKCkgPT4ge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5fZGlhZ25vc3RpY3Muc3R5bGUuZGlzcGxheSA9PT0gXCJub25lXCIpIHsgZmFzdGRvbS5tdXRhdGUoKCkgPT4gdGhpcy5fZGlhZ25vc3RpY3Muc3R5bGUuZGlzcGxheSA9IFwiXCIpOyB9XHJcbiAgICAgICAgICAgIGlmICh0aGlzLl9wcm9qZWN0Q291bnQucHJvamVjdHMuc3R5bGUuZGlzcGxheSA9PT0gXCJub25lXCIpIHsgZmFzdGRvbS5tdXRhdGUoKCkgPT4gdGhpcy5fcHJvamVjdENvdW50LnByb2plY3RzLnN0eWxlLmRpc3BsYXkgPSBcIlwiKTsgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX2hpZGVPblN0YXRlSXRlbXMoKSB7XHJcbiAgICAgICAgZmFzdGRvbS5tZWFzdXJlKCgpID0+IHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuX2RpYWdub3N0aWNzLnN0eWxlLmRpc3BsYXkgIT09IFwibm9uZVwiKSB7IGZhc3Rkb20ubXV0YXRlKCgpID0+IHRoaXMuX2RpYWdub3N0aWNzLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIik7IH1cclxuICAgICAgICAgICAgaWYgKHRoaXMuX3Byb2plY3RDb3VudC5wcm9qZWN0cy5zdHlsZS5kaXNwbGF5ICE9PSBcIm5vbmVcIikgeyBmYXN0ZG9tLm11dGF0ZSgoKSA9PiB0aGlzLl9wcm9qZWN0Q291bnQucHJvamVjdHMuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiKTsgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkZXRhY2hlZENhbGxiYWNrKCkge1xyXG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkaXNwb3NlKCkge1xyXG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB0b2dnbGUoKSB7XHJcbiAgICAgICAgYXRvbS5jb21tYW5kcy5kaXNwYXRjaChhdG9tLnZpZXdzLmdldFZpZXcoYXRvbS53b3Jrc3BhY2UpLCBcIm9tbmlzaGFycC1hdG9tOnRvZ2dsZS1kb2NrXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB0b2dnbGVFcnJvcldhcm5pbmdQYW5lbCgpIHtcclxuICAgICAgICBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSksIFwib21uaXNoYXJwLWF0b206ZG9jay10b2dnbGUtZXJyb3JzXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB0b2dnbGVTb2x1dGlvbkluZm9ybWF0aW9uKCkge1xyXG4gICAgICAgIGF0b20uY29tbWFuZHMuZGlzcGF0Y2goYXRvbS52aWV3cy5nZXRWaWV3KGF0b20ud29ya3NwYWNlKSwgXCJvbW5pc2hhcnAtYXRvbTpzb2x1dGlvbi1zdGF0dXNcIik7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRvQ29kZUNoZWNrKCkge1xyXG4gICAgICAgIGF0b20uY29tbWFuZHMuZGlzcGF0Y2goYXRvbS52aWV3cy5nZXRWaWV3KGF0b20ud29ya3NwYWNlKSwgXCJvbW5pc2hhcnAtYXRvbTpjb2RlLWNoZWNrXCIpO1xyXG4gICAgfVxyXG59XHJcblxyXG4oPGFueT5leHBvcnRzKS5TdGF0dXNCYXJFbGVtZW50ID0gKDxhbnk+ZG9jdW1lbnQpLnJlZ2lzdGVyRWxlbWVudChcIm9tbmlzaGFycC1zdGF0dXMtYmFyXCIsIHsgcHJvdG90eXBlOiBTdGF0dXNCYXJFbGVtZW50LnByb3RvdHlwZSB9KTtcclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
