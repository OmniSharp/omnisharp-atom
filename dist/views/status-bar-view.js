"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.StatusBarElement = exports.ProjectCountElement = exports.DiagnosticsElement = exports.FlameElement = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _rxjs = require("rxjs");

var _tsDisposables = require("ts-disposables");

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
            this._disposable = new _tsDisposables.CompositeDisposable();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy9zdGF0dXMtYmFyLXZpZXcuanMiLCJsaWIvdmlld3Mvc3RhdHVzLWJhci12aWV3LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQUNBOztBQUNBOzs7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7Ozs7Ozs7QUNHQSxJQUFJLFVBQTBCLFFBQVEsU0FBUixDQUExQjtBQUVKLFNBQUEscUJBQUEsQ0FBK0IsSUFBL0IsRUFBa0U7c0NBQWI7O0tBQWE7O0FBQzlELFFBQUksSUFBSixFQUFVO0FBQ04sZ0JBQVEsT0FBUixDQUFnQixZQUFBO0FBQ1osNkJBQUUsSUFBRixDQUFPLEdBQVAsRUFBWSxhQUFDO0FBQ1Qsb0JBQUksQ0FBQyxLQUFLLFNBQUwsQ0FBZSxRQUFmLENBQXdCLENBQXhCLENBQUQsRUFDQSxRQUFRLE1BQVIsQ0FBZTsyQkFBTSxLQUFLLFNBQUwsQ0FBZSxHQUFmLENBQW1CLENBQW5CO2lCQUFOLENBQWYsQ0FESjthQURRLENBQVosQ0FEWTtTQUFBLENBQWhCLENBRE07S0FBVjtDQURKO0FBVUEsU0FBQSxxQkFBQSxDQUErQixJQUEvQixFQUFrRTt1Q0FBYjs7S0FBYTs7QUFDOUQsUUFBSSxJQUFKLEVBQVU7QUFDTixnQkFBUSxPQUFSLENBQWdCLFlBQUE7QUFDWiw2QkFBRSxJQUFGLENBQU8sR0FBUCxFQUFZLGFBQUM7QUFDVCxvQkFBSSxLQUFLLFNBQUwsQ0FBZSxRQUFmLENBQXdCLENBQXhCLENBQUosRUFDSSxRQUFRLE1BQVIsQ0FBZTsyQkFBTSxLQUFLLFNBQUwsQ0FBZSxNQUFmLENBQXNCLENBQXRCO2lCQUFOLENBQWYsQ0FESjthQURRLENBQVosQ0FEWTtTQUFBLENBQWhCLENBRE07S0FBVjtDQURKO0FBb0JBLFNBQUEsWUFBQSxDQUFxQixJQUFyQixFQUFnQyxLQUFoQyxFQUEwQztBQUN0QyxxQkFBRSxJQUFGLENBQU8sV0FBSywyQkFBTCxFQUFrQyxhQUFDO0FBQ3RDLFlBQUksaUJBQUUsR0FB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S0FBSyxTQUFMLENBQTFDLEVBQTJELG1DQUEzRCxFQUQwQjs7OztvREFJRTtBQUM1QixpQkFBSyxRQUFMLENBQWMsUUFBZCxDQUF1QixLQUFLLEtBQUwsQ0FBVyxPQUFYLENBQW1CLEtBQUssU0FBTCxDQUExQyxFQUEyRCxnQ0FBM0QsRUFENEI7Ozs7c0NBSWQ7QUFDZCxpQkFBSyxRQUFMLENBQWMsUUFBZCxDQUF1QixLQUFLLEtBQUwsQ0FBVyxPQUFYLENBQW1CLEtBQUssU0FBTCxDQUExQyxFQUEyRCwyQkFBM0QsRUFEYzs7Ozs7RUFwSGdCOztBQXlIaEMsUUFBUyxnQkFBVCxHQUFrQyxTQUFVLGVBQVYsQ0FBMEIsc0JBQTFCLEVBQWtELEVBQUUsV0FBVyxpQkFBaUIsU0FBakIsRUFBL0QsQ0FBbEMiLCJmaWxlIjoibGliL3ZpZXdzL3N0YXR1cy1iYXItdmlldy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE9ic2VydmFibGUgfSBmcm9tIFwicnhqc1wiO1xuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSB9IGZyb20gXCJ0cy1kaXNwb3NhYmxlc1wiO1xuaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xuaW1wb3J0IHsgT21uaSB9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xuaW1wb3J0IHsgc2VydmVyIH0gZnJvbSBcIi4uL2F0b20vc2VydmVyLWluZm9ybWF0aW9uXCI7XG5pbXBvcnQgeyBTb2x1dGlvbk1hbmFnZXIgfSBmcm9tIFwiLi4vc2VydmVyL3NvbHV0aW9uLW1hbmFnZXJcIjtcbmxldCBmYXN0ZG9tID0gcmVxdWlyZShcImZhc3Rkb21cIik7XG5mdW5jdGlvbiBhZGRDbGFzc0lmTm90aW5jbHVkZXMoaWNvbiwgLi4uY2xzKSB7XG4gICAgaWYgKGljb24pIHtcbiAgICAgICAgZmFzdGRvbS5tZWFzdXJlKCgpID0+IHtcbiAgICAgICAgICAgIF8uZWFjaChjbHMsIGMgPT4ge1xuICAgICAgICAgICAgICAgIGlmICghaWNvbi5jbGFzc0xpc3QuY29udGFpbnMoYykpXG4gICAgICAgICAgICAgICAgICAgIGZhc3Rkb20ubXV0YXRlKCgpID0+IGljb24uY2xhc3NMaXN0LmFkZChjKSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxufVxuZnVuY3Rpb24gcmVtb3ZlQ2xhc3NJZmluY2x1ZGVzKGljb24sIC4uLmNscykge1xuICAgIGlmIChpY29uKSB7XG4gICAgICAgIGZhc3Rkb20ubWVhc3VyZSgoKSA9PiB7XG4gICAgICAgICAgICBfLmVhY2goY2xzLCBjID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoaWNvbi5jbGFzc0xpc3QuY29udGFpbnMoYykpXG4gICAgICAgICAgICAgICAgICAgIGZhc3Rkb20ubXV0YXRlKCgpID0+IGljb24uY2xhc3NMaXN0LnJlbW92ZShjKSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxufVxuZnVuY3Rpb24gdXBkYXRlU3RhdGUoc2VsZiwgc3RhdGUpIHtcbiAgICBfLmVhY2goT21uaS52aWV3TW9kZWxTdGF0ZWZ1bFByb3BlcnRpZXMsIHggPT4ge1xuICAgICAgICBpZiAoXy5oYXMoc3RhdGUsIHgpKSB7XG4gICAgICAgICAgICBzZWxmW3hdID0gc3RhdGVbeF07XG4gICAgICAgIH1cbiAgICB9KTtcbn1cbmV4cG9ydCBjbGFzcyBGbGFtZUVsZW1lbnQgZXh0ZW5kcyBIVE1MQW5jaG9yRWxlbWVudCB7XG4gICAgY3JlYXRlZENhbGxiYWNrKCkge1xuICAgICAgICB0aGlzLmNsYXNzTGlzdC5hZGQoXCJvbW5pc2hhcnAtYXRvbS1idXR0b25cIik7XG4gICAgICAgIHRoaXMuX3N0YXRlID0geyBzdGF0dXM6IHt9IH07XG4gICAgICAgIGNvbnN0IGljb24gPSB0aGlzLl9pY29uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICAgIGljb24uY2xhc3NMaXN0LmFkZChcImljb25cIiwgXCJpY29uLWZsYW1lXCIpO1xuICAgICAgICB0aGlzLmFwcGVuZENoaWxkKGljb24pO1xuICAgICAgICBjb25zdCBvdXRnb2luZyA9IHRoaXMuX291dGdvaW5nID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICAgIG91dGdvaW5nLmNsYXNzTGlzdC5hZGQoXCJvdXRnb2luZy1yZXF1ZXN0c1wiKTtcbiAgICAgICAgdGhpcy5hcHBlbmRDaGlsZChvdXRnb2luZyk7XG4gICAgfVxuICAgIHVwZGF0ZVN0YXRlKHN0YXRlKSB7XG4gICAgICAgIHVwZGF0ZVN0YXRlKHRoaXMuX3N0YXRlLCBzdGF0ZSk7XG4gICAgICAgIGNvbnN0IGljb24gPSB0aGlzLl9pY29uO1xuICAgICAgICBpZiAodGhpcy5fc3RhdGUuaXNPZmYpIHtcbiAgICAgICAgICAgIHJlbW92ZUNsYXNzSWZpbmNsdWRlcyhpY29uLCBcInRleHQtc3VidGxlXCIpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgYWRkQ2xhc3NJZk5vdGluY2x1ZGVzKGljb24sIFwidGV4dC1zdWJ0bGVcIik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuX3N0YXRlLmlzUmVhZHkpIHtcbiAgICAgICAgICAgIGFkZENsYXNzSWZOb3RpbmNsdWRlcyhpY29uLCBcInRleHQtc3VjY2Vzc1wiKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJlbW92ZUNsYXNzSWZpbmNsdWRlcyhpY29uLCBcInRleHQtc3VjY2Vzc1wiKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5fc3RhdGUuaXNFcnJvcikge1xuICAgICAgICAgICAgYWRkQ2xhc3NJZk5vdGluY2x1ZGVzKGljb24sIFwidGV4dC1lcnJvclwiKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJlbW92ZUNsYXNzSWZpbmNsdWRlcyhpY29uLCBcInRleHQtZXJyb3JcIik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuX3N0YXRlLmlzQ29ubmVjdGluZykge1xuICAgICAgICAgICAgYWRkQ2xhc3NJZk5vdGluY2x1ZGVzKGljb24sIFwiaWNvbi1mbGFtZS1sb2FkaW5nXCIpO1xuICAgICAgICAgICAgcmVtb3ZlQ2xhc3NJZmluY2x1ZGVzKGljb24sIFwiaWNvbi1mbGFtZS1wcm9jZXNzaW5nXCIpO1xuICAgICAgICAgICAgcmVtb3ZlQ2xhc3NJZmluY2x1ZGVzKGljb24sIFwiaWNvbi1mbGFtZS1sb2FkaW5nXCIpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHRoaXMuX3N0YXRlLnN0YXR1cy5oYXNPdXRnb2luZ1JlcXVlc3RzKSB7XG4gICAgICAgICAgICBhZGRDbGFzc0lmTm90aW5jbHVkZXMoaWNvbiwgXCJpY29uLWZsYW1lLXByb2Nlc3NpbmdcIik7XG4gICAgICAgICAgICByZW1vdmVDbGFzc0lmaW5jbHVkZXMoaWNvbiwgXCJpY29uLWZsYW1lLWxvYWRpbmdcIik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZW1vdmVDbGFzc0lmaW5jbHVkZXMoaWNvbiwgXCJpY29uLWZsYW1lLXByb2Nlc3NpbmdcIik7XG4gICAgICAgICAgICByZW1vdmVDbGFzc0lmaW5jbHVkZXMoaWNvbiwgXCJpY29uLWZsYW1lLWxvYWRpbmdcIik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgdXBkYXRlT3V0Z29pbmcoc3RhdHVzKSB7XG4gICAgICAgIGlmIChzdGF0dXMuaGFzT3V0Z29pbmdSZXF1ZXN0cyAmJiBzdGF0dXMub3V0Z29pbmdSZXF1ZXN0cyA+IDApIHtcbiAgICAgICAgICAgIHJlbW92ZUNsYXNzSWZpbmNsdWRlcyh0aGlzLl9vdXRnb2luZywgXCJmYWRlXCIpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgYWRkQ2xhc3NJZk5vdGluY2x1ZGVzKHRoaXMuX291dGdvaW5nLCBcImZhZGVcIik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHN0YXR1cy5vdXRnb2luZ1JlcXVlc3RzICE9PSB0aGlzLl9zdGF0ZS5zdGF0dXMub3V0Z29pbmdSZXF1ZXN0cykge1xuICAgICAgICAgICAgZmFzdGRvbS5tdXRhdGUoKCkgPT4gdGhpcy5fb3V0Z29pbmcuaW5uZXJUZXh0ID0gc3RhdHVzLm91dGdvaW5nUmVxdWVzdHMgJiYgc3RhdHVzLm91dGdvaW5nUmVxdWVzdHMudG9TdHJpbmcoKSB8fCBcIjBcIik7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fc3RhdGUuc3RhdHVzID0gc3RhdHVzIHx8IHt9O1xuICAgICAgICB0aGlzLnVwZGF0ZVN0YXRlKHRoaXMuX3N0YXRlKTtcbiAgICB9XG59XG5leHBvcnRzLkZsYW1lRWxlbWVudCA9IGRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudChcIm9tbmlzaGFycC1mbGFtZVwiLCB7IHByb3RvdHlwZTogRmxhbWVFbGVtZW50LnByb3RvdHlwZSB9KTtcbmV4cG9ydCBjbGFzcyBEaWFnbm9zdGljc0VsZW1lbnQgZXh0ZW5kcyBIVE1MQW5jaG9yRWxlbWVudCB7XG4gICAgY3JlYXRlZENhbGxiYWNrKCkge1xuICAgICAgICB0aGlzLmNsYXNzTGlzdC5hZGQoXCJpbmxpbmUtYmxvY2tcIiwgXCJlcnJvci13YXJuaW5nLXN1bW1hcnlcIik7XG4gICAgICAgIGNvbnN0IHN5bmMgPSB0aGlzLl9zeW5jID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImFcIik7XG4gICAgICAgIHN5bmMuY2xhc3NMaXN0LmFkZChcImljb25cIiwgXCJpY29uLXN5bmNcIiwgXCJ0ZXh0LXN1YnRsZVwiKTtcbiAgICAgICAgdGhpcy5hcHBlbmRDaGlsZChzeW5jKTtcbiAgICAgICAgc3luYy5vbmNsaWNrID0gKCkgPT4gdGhpcy5zeW5jQ2xpY2soKTtcbiAgICAgICAgY29uc3QgcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICB0aGlzLmFwcGVuZENoaWxkKHMpO1xuICAgICAgICBzLm9uY2xpY2sgPSAoKSA9PiB0aGlzLmRpYWdub3N0aWNDbGljaygpO1xuICAgICAgICBjb25zdCBlcnJvcnNJY29uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICAgIGVycm9yc0ljb24uY2xhc3NMaXN0LmFkZChcImljb25cIiwgXCJpY29uLWlzc3VlLW9wZW5lZFwiKTtcbiAgICAgICAgcy5hcHBlbmRDaGlsZChlcnJvcnNJY29uKTtcbiAgICAgICAgY29uc3QgZXJyb3JzID0gdGhpcy5fZXJyb3JzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICAgIGVycm9ycy5jbGFzc0xpc3QuYWRkKFwiZXJyb3Itc3VtbWFyeVwiKTtcbiAgICAgICAgcy5hcHBlbmRDaGlsZChlcnJvcnMpO1xuICAgICAgICBjb25zdCB3YXJuaW5nc0ljb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgd2FybmluZ3NJY29uLmNsYXNzTGlzdC5hZGQoXCJpY29uXCIsIFwiaWNvbi1hbGVydFwiKTtcbiAgICAgICAgcy5hcHBlbmRDaGlsZCh3YXJuaW5nc0ljb24pO1xuICAgICAgICBjb25zdCB3YXJuaW5ncyA9IHRoaXMuX3dhcm5pbmdzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICAgIHdhcm5pbmdzLmNsYXNzTGlzdC5hZGQoXCJ3YXJuaW5nLXN1bW1hcnlcIik7XG4gICAgICAgIHMuYXBwZW5kQ2hpbGQod2FybmluZ3MpO1xuICAgIH1cbiAgICB1cGRhdGVTdGF0ZShzdGF0ZSkge1xuICAgICAgICBpZiAoIV8uaXNFcXVhbCh0aGlzLl9zdGF0ZSwgc3RhdGUpKSB7XG4gICAgICAgICAgICB0aGlzLl9zdGF0ZSA9IHN0YXRlO1xuICAgICAgICAgICAgZmFzdGRvbS5tdXRhdGUoKCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9zdGF0ZS5lcnJvckNvdW50KSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2Vycm9ycy5pbm5lclRleHQgPSB0aGlzLl9zdGF0ZS5lcnJvckNvdW50LnRvU3RyaW5nKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9lcnJvcnMuaW5uZXJUZXh0ID0gXCIwXCI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9zdGF0ZS53YXJuaW5nQ291bnQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fd2FybmluZ3MuaW5uZXJUZXh0ID0gdGhpcy5fc3RhdGUud2FybmluZ0NvdW50LnRvU3RyaW5nKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl93YXJuaW5ncy5pbm5lclRleHQgPSBcIjBcIjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbn1cbmV4cG9ydHMuRGlhZ25vc3RpY3NFbGVtZW50ID0gZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50KFwib21uaXNoYXJwLWRpYWdub3N0aWNzXCIsIHsgcHJvdG90eXBlOiBEaWFnbm9zdGljc0VsZW1lbnQucHJvdG90eXBlIH0pO1xuZXhwb3J0IGNsYXNzIFByb2plY3RDb3VudEVsZW1lbnQgZXh0ZW5kcyBIVE1MQW5jaG9yRWxlbWVudCB7XG4gICAgY3JlYXRlZENhbGxiYWNrKCkge1xuICAgICAgICB0aGlzLmNsYXNzTGlzdC5hZGQoXCJpbmxpbmUtYmxvY2tcIiwgXCJwcm9qZWN0LXN1bW1hcnlcIiwgXCJwcm9qZWN0cy1pY29uXCIpO1xuICAgICAgICBjb25zdCBpY29uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICAgIGljb24uY2xhc3NMaXN0LmFkZChcImljb25cIiwgXCJpY29uLXB1bHNlXCIpO1xuICAgICAgICB0aGlzLmFwcGVuZENoaWxkKGljb24pO1xuICAgICAgICBjb25zdCBzdWIgPSB0aGlzLl9zb2x1dGlvbk51bm1iZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3ViXCIpO1xuICAgICAgICBpY29uLmFwcGVuZENoaWxkKHN1Yik7XG4gICAgICAgIGNvbnN0IHByb2plY3RzID0gdGhpcy5wcm9qZWN0cyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICBwcm9qZWN0cy5jbGFzc0xpc3QuYWRkKFwicHJvamVjdHNcIik7XG4gICAgICAgIHByb2plY3RzLmlubmVyVGV4dCA9IFwiMCBQcm9qZWN0c1wiO1xuICAgICAgICB0aGlzLmFwcGVuZENoaWxkKHByb2plY3RzKTtcbiAgICB9XG4gICAgdXBkYXRlU3RhdGUoc3RhdGUpIHtcbiAgICAgICAgaWYgKCFfLmlzRXF1YWwodGhpcy5fc3RhdGUsIHN0YXRlKSkge1xuICAgICAgICAgICAgdGhpcy5fc3RhdGUgPSBzdGF0ZTtcbiAgICAgICAgICAgIGZhc3Rkb20ubXV0YXRlKCgpID0+IHRoaXMucHJvamVjdHMuaW5uZXJUZXh0ID0gYCR7dGhpcy5fc3RhdGUucHJvamVjdENvdW50fSBQcm9qZWN0c2ApO1xuICAgICAgICB9XG4gICAgfVxuICAgIHVwZGF0ZVNvbHV0aW9uTnVtYmVyKHNvbHV0aW9uTnVtYmVyKSB7XG4gICAgICAgIGZhc3Rkb20ubXV0YXRlKCgpID0+IHRoaXMuX3NvbHV0aW9uTnVubWJlci5pbm5lclRleHQgPSBzb2x1dGlvbk51bWJlcik7XG4gICAgfVxufVxuZXhwb3J0cy5Qcm9qZWN0Q291bnRFbGVtZW50ID0gZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50KFwib21uaXNoYXJwLXByb2plY3QtY291bnRcIiwgeyBwcm90b3R5cGU6IFByb2plY3RDb3VudEVsZW1lbnQucHJvdG90eXBlIH0pO1xuZXhwb3J0IGNsYXNzIFN0YXR1c0JhckVsZW1lbnQgZXh0ZW5kcyBIVE1MRWxlbWVudCB7XG4gICAgY29uc3RydWN0b3IoLi4uYXJncykge1xuICAgICAgICBzdXBlciguLi5hcmdzKTtcbiAgICAgICAgdGhpcy5faGFzVmFsaWRFZGl0b3IgPSBmYWxzZTtcbiAgICB9XG4gICAgY3JlYXRlZENhbGxiYWNrKCkge1xuICAgICAgICB0aGlzLmNsYXNzTGlzdC5hZGQoXCJpbmxpbmUtYmxvY2tcIik7XG4gICAgICAgIGNvbnN0IGZsYW1lRWxlbWVudCA9IHRoaXMuX2ZsYW1lID0gbmV3IGV4cG9ydHMuRmxhbWVFbGVtZW50KCk7XG4gICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQoZmxhbWVFbGVtZW50KTtcbiAgICAgICAgZmxhbWVFbGVtZW50Lm9uY2xpY2sgPSAoKSA9PiB0aGlzLnRvZ2dsZSgpO1xuICAgICAgICBjb25zdCBwcm9qZWN0Q291bnQgPSB0aGlzLl9wcm9qZWN0Q291bnQgPSBuZXcgZXhwb3J0cy5Qcm9qZWN0Q291bnRFbGVtZW50KCk7XG4gICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQocHJvamVjdENvdW50KTtcbiAgICAgICAgcHJvamVjdENvdW50Lm9uY2xpY2sgPSAoKSA9PiB0aGlzLnRvZ2dsZVNvbHV0aW9uSW5mb3JtYXRpb24oKTtcbiAgICAgICAgcHJvamVjdENvdW50LnByb2plY3RzLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgY29uc3QgZGlhZ25vc3RpY3MgPSB0aGlzLl9kaWFnbm9zdGljcyA9IG5ldyBleHBvcnRzLkRpYWdub3N0aWNzRWxlbWVudCgpO1xuICAgICAgICB0aGlzLmFwcGVuZENoaWxkKGRpYWdub3N0aWNzKTtcbiAgICAgICAgZGlhZ25vc3RpY3MuZGlhZ25vc3RpY0NsaWNrID0gKCkgPT4gdGhpcy50b2dnbGVFcnJvcldhcm5pbmdQYW5lbCgpO1xuICAgICAgICBkaWFnbm9zdGljcy5zeW5jQ2xpY2sgPSAoKSA9PiB0aGlzLmRvQ29kZUNoZWNrKCk7XG4gICAgICAgIGRpYWdub3N0aWNzLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIHRoaXMuX3N0YXRlID0geyBzdGF0dXM6IHt9IH07XG4gICAgfVxuICAgIGF0dGFjaGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKE9tbmkuZGlhZ25vc3RpY3NDb3VudHMuc3Vic2NyaWJlKGNvdW50cyA9PiB7XG4gICAgICAgICAgICB0aGlzLl9kaWFnbm9zdGljcy51cGRhdGVTdGF0ZSh7XG4gICAgICAgICAgICAgICAgZXJyb3JDb3VudDogY291bnRzW1wiZXJyb3JcIl0gfHwgMCxcbiAgICAgICAgICAgICAgICB3YXJuaW5nQ291bnQ6IGNvdW50c1tcIndhcm5pbmdcIl0gfHwgMFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoT2JzZXJ2YWJsZS5tZXJnZShPbW5pLmFjdGl2ZU1vZGVsLCBPbW5pLmFjdGl2ZU1vZGVsLmZsYXRNYXAoeCA9PiB4Lm9ic2VydmUuc3RhdGUpKVxuICAgICAgICAgICAgLnN1YnNjcmliZShtb2RlbCA9PiB7XG4gICAgICAgICAgICB0aGlzLl9mbGFtZS51cGRhdGVTdGF0ZShtb2RlbCk7XG4gICAgICAgICAgICB1cGRhdGVTdGF0ZSh0aGlzLl9zdGF0ZSwgbW9kZWwpO1xuICAgICAgICAgICAgdGhpcy5fdXBkYXRlVmlzaWJsZSgpO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKHNlcnZlci5vYnNlcnZlLnByb2plY3RzXG4gICAgICAgICAgICAuZGVib3VuY2VUaW1lKDUwMClcbiAgICAgICAgICAgIC5zdWJzY3JpYmUocHJvamVjdHMgPT4gdGhpcy5fcHJvamVjdENvdW50LnVwZGF0ZVN0YXRlKHsgcHJvamVjdENvdW50OiBwcm9qZWN0cy5sZW5ndGggfSkpKTtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoc2VydmVyLm9ic2VydmUuc3RhdHVzXG4gICAgICAgICAgICAuc3Vic2NyaWJlKHN0YXR1cyA9PiB0aGlzLl9mbGFtZS51cGRhdGVPdXRnb2luZyhzdGF0dXMgfHwge30pKSk7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKHNlcnZlci5vYnNlcnZlLm1vZGVsXG4gICAgICAgICAgICAuc3Vic2NyaWJlKG1vZGVsID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHNvbHV0aW9uTnVtYmVyID0gU29sdXRpb25NYW5hZ2VyLmFjdGl2ZVNvbHV0aW9ucy5sZW5ndGggPiAxID8gXy50cmltKHNlcnZlci5tb2RlbCAmJiBzZXJ2ZXIubW9kZWwuaW5kZXgsIFwiY2xpZW50XCIpIDogXCJcIjtcbiAgICAgICAgICAgIHRoaXMuX3Byb2plY3RDb3VudC51cGRhdGVTb2x1dGlvbk51bWJlcihzb2x1dGlvbk51bWJlcik7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoT21uaS5hY3RpdmVFZGl0b3JPckNvbmZpZ0VkaXRvci5zdWJzY3JpYmUoZWRpdG9yID0+IHtcbiAgICAgICAgICAgIHRoaXMuX3VwZGF0ZVZpc2libGUoISFlZGl0b3IpO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKFNvbHV0aW9uTWFuYWdlci5hY3RpdmVTb2x1dGlvblxuICAgICAgICAgICAgLnN1YnNjcmliZShzb2x1dGlvbnMgPT4ge1xuICAgICAgICAgICAgY29uc3Qgc29sdXRpb25OdW1iZXIgPSBTb2x1dGlvbk1hbmFnZXIuYWN0aXZlU29sdXRpb25zLmxlbmd0aCA+IDEgPyBfLnRyaW0oc2VydmVyLm1vZGVsICYmIHNlcnZlci5tb2RlbC5pbmRleCwgXCJjbGllbnRcIikgOiBcIlwiO1xuICAgICAgICAgICAgdGhpcy5fcHJvamVjdENvdW50LnVwZGF0ZVNvbHV0aW9uTnVtYmVyKHNvbHV0aW9uTnVtYmVyKTtcbiAgICAgICAgfSkpO1xuICAgIH1cbiAgICBfdXBkYXRlVmlzaWJsZShoYXNWYWxpZEVkaXRvcikge1xuICAgICAgICBpZiAodHlwZW9mIGhhc1ZhbGlkRWRpdG9yICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICB0aGlzLl9oYXNWYWxpZEVkaXRvciA9IGhhc1ZhbGlkRWRpdG9yO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLl9zdGF0ZS5pc09uICYmIHRoaXMuX2hhc1ZhbGlkRWRpdG9yKSB7XG4gICAgICAgICAgICB0aGlzLl9zaG93T25TdGF0ZUl0ZW1zKCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9oaWRlT25TdGF0ZUl0ZW1zKCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgX3Nob3dPblN0YXRlSXRlbXMoKSB7XG4gICAgICAgIGZhc3Rkb20ubWVhc3VyZSgoKSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5fZGlhZ25vc3RpY3Muc3R5bGUuZGlzcGxheSA9PT0gXCJub25lXCIpIHtcbiAgICAgICAgICAgICAgICBmYXN0ZG9tLm11dGF0ZSgoKSA9PiB0aGlzLl9kaWFnbm9zdGljcy5zdHlsZS5kaXNwbGF5ID0gXCJcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5fcHJvamVjdENvdW50LnByb2plY3RzLnN0eWxlLmRpc3BsYXkgPT09IFwibm9uZVwiKSB7XG4gICAgICAgICAgICAgICAgZmFzdGRvbS5tdXRhdGUoKCkgPT4gdGhpcy5fcHJvamVjdENvdW50LnByb2plY3RzLnN0eWxlLmRpc3BsYXkgPSBcIlwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIF9oaWRlT25TdGF0ZUl0ZW1zKCkge1xuICAgICAgICBmYXN0ZG9tLm1lYXN1cmUoKCkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMuX2RpYWdub3N0aWNzLnN0eWxlLmRpc3BsYXkgIT09IFwibm9uZVwiKSB7XG4gICAgICAgICAgICAgICAgZmFzdGRvbS5tdXRhdGUoKCkgPT4gdGhpcy5fZGlhZ25vc3RpY3Muc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLl9wcm9qZWN0Q291bnQucHJvamVjdHMuc3R5bGUuZGlzcGxheSAhPT0gXCJub25lXCIpIHtcbiAgICAgICAgICAgICAgICBmYXN0ZG9tLm11dGF0ZSgoKSA9PiB0aGlzLl9wcm9qZWN0Q291bnQucHJvamVjdHMuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGRldGFjaGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgIH1cbiAgICBkaXNwb3NlKCkge1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICB9XG4gICAgdG9nZ2xlKCkge1xuICAgICAgICBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSksIFwib21uaXNoYXJwLWF0b206dG9nZ2xlLWRvY2tcIik7XG4gICAgfVxuICAgIHRvZ2dsZUVycm9yV2FybmluZ1BhbmVsKCkge1xuICAgICAgICBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSksIFwib21uaXNoYXJwLWF0b206ZG9jay10b2dnbGUtZXJyb3JzXCIpO1xuICAgIH1cbiAgICB0b2dnbGVTb2x1dGlvbkluZm9ybWF0aW9uKCkge1xuICAgICAgICBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSksIFwib21uaXNoYXJwLWF0b206c29sdXRpb24tc3RhdHVzXCIpO1xuICAgIH1cbiAgICBkb0NvZGVDaGVjaygpIHtcbiAgICAgICAgYXRvbS5jb21tYW5kcy5kaXNwYXRjaChhdG9tLnZpZXdzLmdldFZpZXcoYXRvbS53b3Jrc3BhY2UpLCBcIm9tbmlzaGFycC1hdG9tOmNvZGUtY2hlY2tcIik7XG4gICAgfVxufVxuZXhwb3J0cy5TdGF0dXNCYXJFbGVtZW50ID0gZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50KFwib21uaXNoYXJwLXN0YXR1cy1iYXJcIiwgeyBwcm90b3R5cGU6IFN0YXR1c0JhckVsZW1lbnQucHJvdG90eXBlIH0pO1xuIiwiLyogdHNsaW50OmRpc2FibGU6bm8tc3RyaW5nLWxpdGVyYWwgKi9cclxuaW1wb3J0IHtPYnNlcnZhYmxlfSBmcm9tIFwicnhqc1wiO1xyXG5pbXBvcnQge0NvbXBvc2l0ZURpc3Bvc2FibGUsIElEaXNwb3NhYmxlfSBmcm9tIFwidHMtZGlzcG9zYWJsZXNcIjtcclxuaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xyXG5pbXBvcnQge09tbml9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xyXG5pbXBvcnQge09tbmlzaGFycENsaWVudFN0YXR1c30gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcclxuaW1wb3J0IHtzZXJ2ZXJ9IGZyb20gXCIuLi9hdG9tL3NlcnZlci1pbmZvcm1hdGlvblwiO1xyXG5pbXBvcnQge1NvbHV0aW9uTWFuYWdlcn0gZnJvbSBcIi4uL3NlcnZlci9zb2x1dGlvbi1tYW5hZ2VyXCI7XHJcbmxldCBmYXN0ZG9tOiB0eXBlb2YgRmFzdGRvbSA9IHJlcXVpcmUoXCJmYXN0ZG9tXCIpO1xyXG5cclxuZnVuY3Rpb24gYWRkQ2xhc3NJZk5vdGluY2x1ZGVzKGljb246IEhUTUxFbGVtZW50LCAuLi5jbHM6IHN0cmluZ1tdKSB7XHJcbiAgICBpZiAoaWNvbikge1xyXG4gICAgICAgIGZhc3Rkb20ubWVhc3VyZSgoKSA9PiB7XHJcbiAgICAgICAgICAgIF8uZWFjaChjbHMsIGMgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFpY29uLmNsYXNzTGlzdC5jb250YWlucyhjKSlcclxuICAgICAgICAgICAgICAgICAgICBmYXN0ZG9tLm11dGF0ZSgoKSA9PiBpY29uLmNsYXNzTGlzdC5hZGQoYykpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxufVxyXG5mdW5jdGlvbiByZW1vdmVDbGFzc0lmaW5jbHVkZXMoaWNvbjogSFRNTEVsZW1lbnQsIC4uLmNsczogc3RyaW5nW10pIHtcclxuICAgIGlmIChpY29uKSB7XHJcbiAgICAgICAgZmFzdGRvbS5tZWFzdXJlKCgpID0+IHtcclxuICAgICAgICAgICAgXy5lYWNoKGNscywgYyA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoaWNvbi5jbGFzc0xpc3QuY29udGFpbnMoYykpXHJcbiAgICAgICAgICAgICAgICAgICAgZmFzdGRvbS5tdXRhdGUoKCkgPT4gaWNvbi5jbGFzc0xpc3QucmVtb3ZlKGMpKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmludGVyZmFjZSBTdGF0dXNCYXJTdGF0ZSB7XHJcbiAgICBpc09mZj86IGJvb2xlYW47XHJcbiAgICBpc0Nvbm5lY3Rpbmc/OiBib29sZWFuO1xyXG4gICAgaXNPbj86IGJvb2xlYW47XHJcbiAgICBpc1JlYWR5PzogYm9vbGVhbjtcclxuICAgIGlzRXJyb3I/OiBib29sZWFuO1xyXG4gICAgc3RhdHVzPzogT21uaXNoYXJwQ2xpZW50U3RhdHVzO1xyXG59XHJcblxyXG5mdW5jdGlvbiB1cGRhdGVTdGF0ZShzZWxmOiBhbnksIHN0YXRlOiBhbnkpIHtcclxuICAgIF8uZWFjaChPbW5pLnZpZXdNb2RlbFN0YXRlZnVsUHJvcGVydGllcywgeCA9PiB7XHJcbiAgICAgICAgaWYgKF8uaGFzKHN0YXRlLCB4KSkge1xyXG4gICAgICAgICAgICBzZWxmW3hdID0gc3RhdGVbeF07XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBGbGFtZUVsZW1lbnQgZXh0ZW5kcyBIVE1MQW5jaG9yRWxlbWVudCBpbXBsZW1lbnRzIFdlYkNvbXBvbmVudCB7XHJcbiAgICBwcml2YXRlIF9zdGF0ZToge1xyXG4gICAgICAgIGlzT2ZmPzogYm9vbGVhbjtcclxuICAgICAgICBpc0Nvbm5lY3Rpbmc/OiBib29sZWFuO1xyXG4gICAgICAgIGlzT24/OiBib29sZWFuO1xyXG4gICAgICAgIGlzUmVhZHk/OiBib29sZWFuO1xyXG4gICAgICAgIGlzRXJyb3I/OiBib29sZWFuO1xyXG4gICAgICAgIHN0YXR1cz86IE9tbmlzaGFycENsaWVudFN0YXR1cztcclxuICAgIH07XHJcblxyXG4gICAgcHJpdmF0ZSBfaWNvbjogSFRNTFNwYW5FbGVtZW50O1xyXG4gICAgcHJpdmF0ZSBfb3V0Z29pbmc6IEhUTUxTcGFuRWxlbWVudDtcclxuXHJcbiAgICBwdWJsaWMgY3JlYXRlZENhbGxiYWNrKCkge1xyXG4gICAgICAgIHRoaXMuY2xhc3NMaXN0LmFkZChcIm9tbmlzaGFycC1hdG9tLWJ1dHRvblwiKTtcclxuICAgICAgICB0aGlzLl9zdGF0ZSA9IHsgc3RhdHVzOiA8YW55Pnt9IH07XHJcblxyXG4gICAgICAgIGNvbnN0IGljb24gPSB0aGlzLl9pY29uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XHJcbiAgICAgICAgaWNvbi5jbGFzc0xpc3QuYWRkKFwiaWNvblwiLCBcImljb24tZmxhbWVcIik7XHJcbiAgICAgICAgdGhpcy5hcHBlbmRDaGlsZChpY29uKTtcclxuXHJcbiAgICAgICAgY29uc3Qgb3V0Z29pbmcgPSB0aGlzLl9vdXRnb2luZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xyXG4gICAgICAgIG91dGdvaW5nLmNsYXNzTGlzdC5hZGQoXCJvdXRnb2luZy1yZXF1ZXN0c1wiKTtcclxuICAgICAgICB0aGlzLmFwcGVuZENoaWxkKG91dGdvaW5nKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgdXBkYXRlU3RhdGUoc3RhdGU6IHR5cGVvZiBGbGFtZUVsZW1lbnQucHJvdG90eXBlLl9zdGF0ZSkge1xyXG4gICAgICAgIHVwZGF0ZVN0YXRlKHRoaXMuX3N0YXRlLCBzdGF0ZSk7XHJcbiAgICAgICAgY29uc3QgaWNvbiA9IHRoaXMuX2ljb247XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9zdGF0ZS5pc09mZikge1xyXG4gICAgICAgICAgICByZW1vdmVDbGFzc0lmaW5jbHVkZXMoaWNvbiwgXCJ0ZXh0LXN1YnRsZVwiKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBhZGRDbGFzc0lmTm90aW5jbHVkZXMoaWNvbiwgXCJ0ZXh0LXN1YnRsZVwiKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9zdGF0ZS5pc1JlYWR5KSB7XHJcbiAgICAgICAgICAgIGFkZENsYXNzSWZOb3RpbmNsdWRlcyhpY29uLCBcInRleHQtc3VjY2Vzc1wiKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByZW1vdmVDbGFzc0lmaW5jbHVkZXMoaWNvbiwgXCJ0ZXh0LXN1Y2Nlc3NcIik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5fc3RhdGUuaXNFcnJvcikge1xyXG4gICAgICAgICAgICBhZGRDbGFzc0lmTm90aW5jbHVkZXMoaWNvbiwgXCJ0ZXh0LWVycm9yXCIpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJlbW92ZUNsYXNzSWZpbmNsdWRlcyhpY29uLCBcInRleHQtZXJyb3JcIik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5fc3RhdGUuaXNDb25uZWN0aW5nKSB7XHJcbiAgICAgICAgICAgIGFkZENsYXNzSWZOb3RpbmNsdWRlcyhpY29uLCBcImljb24tZmxhbWUtbG9hZGluZ1wiKTtcclxuICAgICAgICAgICAgcmVtb3ZlQ2xhc3NJZmluY2x1ZGVzKGljb24sIFwiaWNvbi1mbGFtZS1wcm9jZXNzaW5nXCIpO1xyXG4gICAgICAgICAgICByZW1vdmVDbGFzc0lmaW5jbHVkZXMoaWNvbiwgXCJpY29uLWZsYW1lLWxvYWRpbmdcIik7XHJcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLl9zdGF0ZS5zdGF0dXMuaGFzT3V0Z29pbmdSZXF1ZXN0cykge1xyXG4gICAgICAgICAgICBhZGRDbGFzc0lmTm90aW5jbHVkZXMoaWNvbiwgXCJpY29uLWZsYW1lLXByb2Nlc3NpbmdcIik7XHJcbiAgICAgICAgICAgIHJlbW92ZUNsYXNzSWZpbmNsdWRlcyhpY29uLCBcImljb24tZmxhbWUtbG9hZGluZ1wiKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByZW1vdmVDbGFzc0lmaW5jbHVkZXMoaWNvbiwgXCJpY29uLWZsYW1lLXByb2Nlc3NpbmdcIik7XHJcbiAgICAgICAgICAgIHJlbW92ZUNsYXNzSWZpbmNsdWRlcyhpY29uLCBcImljb24tZmxhbWUtbG9hZGluZ1wiKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHVwZGF0ZU91dGdvaW5nKHN0YXR1czogdHlwZW9mIEZsYW1lRWxlbWVudC5wcm90b3R5cGUuX3N0YXRlLnN0YXR1cykge1xyXG4gICAgICAgIGlmIChzdGF0dXMuaGFzT3V0Z29pbmdSZXF1ZXN0cyAmJiBzdGF0dXMub3V0Z29pbmdSZXF1ZXN0cyA+IDApIHtcclxuICAgICAgICAgICAgcmVtb3ZlQ2xhc3NJZmluY2x1ZGVzKHRoaXMuX291dGdvaW5nLCBcImZhZGVcIik7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgYWRkQ2xhc3NJZk5vdGluY2x1ZGVzKHRoaXMuX291dGdvaW5nLCBcImZhZGVcIik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoc3RhdHVzLm91dGdvaW5nUmVxdWVzdHMgIT09IHRoaXMuX3N0YXRlLnN0YXR1cy5vdXRnb2luZ1JlcXVlc3RzKSB7XHJcbiAgICAgICAgICAgIGZhc3Rkb20ubXV0YXRlKCgpID0+IHRoaXMuX291dGdvaW5nLmlubmVyVGV4dCA9IHN0YXR1cy5vdXRnb2luZ1JlcXVlc3RzICYmIHN0YXR1cy5vdXRnb2luZ1JlcXVlc3RzLnRvU3RyaW5nKCkgfHwgXCIwXCIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5fc3RhdGUuc3RhdHVzID0gc3RhdHVzIHx8IDxhbnk+e307XHJcbiAgICAgICAgdGhpcy51cGRhdGVTdGF0ZSh0aGlzLl9zdGF0ZSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbig8YW55PmV4cG9ydHMpLkZsYW1lRWxlbWVudCA9ICg8YW55PmRvY3VtZW50KS5yZWdpc3RlckVsZW1lbnQoXCJvbW5pc2hhcnAtZmxhbWVcIiwgeyBwcm90b3R5cGU6IEZsYW1lRWxlbWVudC5wcm90b3R5cGUgfSk7XHJcblxyXG5leHBvcnQgY2xhc3MgRGlhZ25vc3RpY3NFbGVtZW50IGV4dGVuZHMgSFRNTEFuY2hvckVsZW1lbnQgaW1wbGVtZW50cyBXZWJDb21wb25lbnQge1xyXG4gICAgcHJpdmF0ZSBfc3RhdGU6IHtcclxuICAgICAgICBlcnJvckNvdW50OiBudW1iZXI7XHJcbiAgICAgICAgd2FybmluZ0NvdW50OiBudW1iZXI7XHJcbiAgICB9O1xyXG4gICAgcHJpdmF0ZSBfZXJyb3JzOiBIVE1MU3BhbkVsZW1lbnQ7XHJcbiAgICBwcml2YXRlIF93YXJuaW5nczogSFRNTFNwYW5FbGVtZW50O1xyXG4gICAgcHJpdmF0ZSBfc3luYzogSFRNTEFuY2hvckVsZW1lbnQ7XHJcblxyXG4gICAgcHVibGljIGNyZWF0ZWRDYWxsYmFjaygpIHtcclxuICAgICAgICB0aGlzLmNsYXNzTGlzdC5hZGQoXCJpbmxpbmUtYmxvY2tcIiwgXCJlcnJvci13YXJuaW5nLXN1bW1hcnlcIik7XHJcblxyXG4gICAgICAgIGNvbnN0IHN5bmMgPSB0aGlzLl9zeW5jID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImFcIik7XHJcbiAgICAgICAgc3luYy5jbGFzc0xpc3QuYWRkKFwiaWNvblwiLCBcImljb24tc3luY1wiLCBcInRleHQtc3VidGxlXCIpO1xyXG4gICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQoc3luYyk7XHJcbiAgICAgICAgc3luYy5vbmNsaWNrID0gKCkgPT4gdGhpcy5zeW5jQ2xpY2soKTtcclxuXHJcbiAgICAgICAgY29uc3QgcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xyXG4gICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQocyk7XHJcbiAgICAgICAgcy5vbmNsaWNrID0gKCkgPT4gdGhpcy5kaWFnbm9zdGljQ2xpY2soKTtcclxuXHJcbiAgICAgICAgY29uc3QgZXJyb3JzSWNvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xyXG4gICAgICAgIGVycm9yc0ljb24uY2xhc3NMaXN0LmFkZChcImljb25cIiwgXCJpY29uLWlzc3VlLW9wZW5lZFwiKTtcclxuICAgICAgICBzLmFwcGVuZENoaWxkKGVycm9yc0ljb24pO1xyXG5cclxuICAgICAgICBjb25zdCBlcnJvcnMgPSB0aGlzLl9lcnJvcnMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcclxuICAgICAgICBlcnJvcnMuY2xhc3NMaXN0LmFkZChcImVycm9yLXN1bW1hcnlcIik7XHJcbiAgICAgICAgcy5hcHBlbmRDaGlsZChlcnJvcnMpO1xyXG5cclxuICAgICAgICBjb25zdCB3YXJuaW5nc0ljb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcclxuICAgICAgICB3YXJuaW5nc0ljb24uY2xhc3NMaXN0LmFkZChcImljb25cIiwgXCJpY29uLWFsZXJ0XCIpO1xyXG4gICAgICAgIHMuYXBwZW5kQ2hpbGQod2FybmluZ3NJY29uKTtcclxuXHJcbiAgICAgICAgY29uc3Qgd2FybmluZ3MgPSB0aGlzLl93YXJuaW5ncyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xyXG4gICAgICAgIHdhcm5pbmdzLmNsYXNzTGlzdC5hZGQoXCJ3YXJuaW5nLXN1bW1hcnlcIik7XHJcbiAgICAgICAgcy5hcHBlbmRDaGlsZCh3YXJuaW5ncyk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHVwZGF0ZVN0YXRlKHN0YXRlOiB0eXBlb2YgRGlhZ25vc3RpY3NFbGVtZW50LnByb3RvdHlwZS5fc3RhdGUpIHtcclxuICAgICAgICBpZiAoIV8uaXNFcXVhbCh0aGlzLl9zdGF0ZSwgc3RhdGUpKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3N0YXRlID0gc3RhdGU7XHJcbiAgICAgICAgICAgIGZhc3Rkb20ubXV0YXRlKCgpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9zdGF0ZS5lcnJvckNvdW50KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZXJyb3JzLmlubmVyVGV4dCA9IHRoaXMuX3N0YXRlLmVycm9yQ291bnQudG9TdHJpbmcoKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZXJyb3JzLmlubmVyVGV4dCA9IFwiMFwiO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9zdGF0ZS53YXJuaW5nQ291bnQpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl93YXJuaW5ncy5pbm5lclRleHQgPSB0aGlzLl9zdGF0ZS53YXJuaW5nQ291bnQudG9TdHJpbmcoKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fd2FybmluZ3MuaW5uZXJUZXh0ID0gXCIwXCI7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc3luY0NsaWNrOiAoKSA9PiB2b2lkO1xyXG4gICAgcHVibGljIGRpYWdub3N0aWNDbGljazogKCkgPT4gdm9pZDtcclxufVxyXG5cclxuKDxhbnk+ZXhwb3J0cykuRGlhZ25vc3RpY3NFbGVtZW50ID0gKDxhbnk+ZG9jdW1lbnQpLnJlZ2lzdGVyRWxlbWVudChcIm9tbmlzaGFycC1kaWFnbm9zdGljc1wiLCB7IHByb3RvdHlwZTogRGlhZ25vc3RpY3NFbGVtZW50LnByb3RvdHlwZSB9KTtcclxuXHJcbmV4cG9ydCBjbGFzcyBQcm9qZWN0Q291bnRFbGVtZW50IGV4dGVuZHMgSFRNTEFuY2hvckVsZW1lbnQgaW1wbGVtZW50cyBXZWJDb21wb25lbnQge1xyXG4gICAgcHJpdmF0ZSBfc3RhdGU6IHsgcHJvamVjdENvdW50OiBudW1iZXIgfTtcclxuICAgIHB1YmxpYyBwcm9qZWN0czogSFRNTFNwYW5FbGVtZW50O1xyXG4gICAgcHJpdmF0ZSBfc29sdXRpb25OdW5tYmVyOiBIVE1MU3BhbkVsZW1lbnQ7XHJcblxyXG4gICAgcHVibGljIGNyZWF0ZWRDYWxsYmFjaygpIHtcclxuICAgICAgICB0aGlzLmNsYXNzTGlzdC5hZGQoXCJpbmxpbmUtYmxvY2tcIiwgXCJwcm9qZWN0LXN1bW1hcnlcIiwgXCJwcm9qZWN0cy1pY29uXCIpO1xyXG5cclxuICAgICAgICBjb25zdCBpY29uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XHJcbiAgICAgICAgaWNvbi5jbGFzc0xpc3QuYWRkKFwiaWNvblwiLCBcImljb24tcHVsc2VcIik7XHJcbiAgICAgICAgdGhpcy5hcHBlbmRDaGlsZChpY29uKTtcclxuXHJcbiAgICAgICAgY29uc3Qgc3ViID0gdGhpcy5fc29sdXRpb25OdW5tYmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInN1YlwiKTtcclxuICAgICAgICBpY29uLmFwcGVuZENoaWxkKHN1Yik7XHJcblxyXG4gICAgICAgIGNvbnN0IHByb2plY3RzID0gdGhpcy5wcm9qZWN0cyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xyXG4gICAgICAgIHByb2plY3RzLmNsYXNzTGlzdC5hZGQoXCJwcm9qZWN0c1wiKTtcclxuICAgICAgICBwcm9qZWN0cy5pbm5lclRleHQgPSBcIjAgUHJvamVjdHNcIjtcclxuICAgICAgICB0aGlzLmFwcGVuZENoaWxkKHByb2plY3RzKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgdXBkYXRlU3RhdGUoc3RhdGU6IHR5cGVvZiBQcm9qZWN0Q291bnRFbGVtZW50LnByb3RvdHlwZS5fc3RhdGUpIHtcclxuICAgICAgICBpZiAoIV8uaXNFcXVhbCh0aGlzLl9zdGF0ZSwgc3RhdGUpKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3N0YXRlID0gc3RhdGU7XHJcbiAgICAgICAgICAgIGZhc3Rkb20ubXV0YXRlKCgpID0+IHRoaXMucHJvamVjdHMuaW5uZXJUZXh0ID0gYCR7dGhpcy5fc3RhdGUucHJvamVjdENvdW50fSBQcm9qZWN0c2ApO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgdXBkYXRlU29sdXRpb25OdW1iZXIoc29sdXRpb25OdW1iZXI6IHN0cmluZykge1xyXG4gICAgICAgIGZhc3Rkb20ubXV0YXRlKCgpID0+IHRoaXMuX3NvbHV0aW9uTnVubWJlci5pbm5lclRleHQgPSBzb2x1dGlvbk51bWJlcik7XHJcbiAgICB9XHJcbn1cclxuXHJcbig8YW55PmV4cG9ydHMpLlByb2plY3RDb3VudEVsZW1lbnQgPSAoPGFueT5kb2N1bWVudCkucmVnaXN0ZXJFbGVtZW50KFwib21uaXNoYXJwLXByb2plY3QtY291bnRcIiwgeyBwcm90b3R5cGU6IFByb2plY3RDb3VudEVsZW1lbnQucHJvdG90eXBlIH0pO1xyXG5cclxuXHJcbmV4cG9ydCBjbGFzcyBTdGF0dXNCYXJFbGVtZW50IGV4dGVuZHMgSFRNTEVsZW1lbnQgaW1wbGVtZW50cyBXZWJDb21wb25lbnQsIElEaXNwb3NhYmxlIHtcclxuICAgIHByaXZhdGUgX3N0YXRlOiBTdGF0dXNCYXJTdGF0ZTtcclxuICAgIHByaXZhdGUgX2Rpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XHJcbiAgICBwcml2YXRlIF9mbGFtZTogRmxhbWVFbGVtZW50O1xyXG4gICAgcHJpdmF0ZSBfZGlhZ25vc3RpY3M6IERpYWdub3N0aWNzRWxlbWVudDtcclxuICAgIHByaXZhdGUgX3Byb2plY3RDb3VudDogUHJvamVjdENvdW50RWxlbWVudDtcclxuXHJcbiAgICBwdWJsaWMgY3JlYXRlZENhbGxiYWNrKCkge1xyXG4gICAgICAgIHRoaXMuY2xhc3NMaXN0LmFkZChcImlubGluZS1ibG9ja1wiKTtcclxuXHJcbiAgICAgICAgY29uc3QgZmxhbWVFbGVtZW50ID0gdGhpcy5fZmxhbWUgPSA8RmxhbWVFbGVtZW50Pm5ldyBleHBvcnRzLkZsYW1lRWxlbWVudCgpO1xyXG4gICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQoZmxhbWVFbGVtZW50KTtcclxuICAgICAgICBmbGFtZUVsZW1lbnQub25jbGljayA9ICgpID0+IHRoaXMudG9nZ2xlKCk7XHJcblxyXG4gICAgICAgIGNvbnN0IHByb2plY3RDb3VudCA9IHRoaXMuX3Byb2plY3RDb3VudCA9IDxQcm9qZWN0Q291bnRFbGVtZW50Pm5ldyBleHBvcnRzLlByb2plY3RDb3VudEVsZW1lbnQoKTtcclxuICAgICAgICB0aGlzLmFwcGVuZENoaWxkKHByb2plY3RDb3VudCk7XHJcbiAgICAgICAgcHJvamVjdENvdW50Lm9uY2xpY2sgPSAoKSA9PiB0aGlzLnRvZ2dsZVNvbHV0aW9uSW5mb3JtYXRpb24oKTtcclxuICAgICAgICBwcm9qZWN0Q291bnQucHJvamVjdHMuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xyXG5cclxuICAgICAgICBjb25zdCBkaWFnbm9zdGljcyA9IHRoaXMuX2RpYWdub3N0aWNzID0gPERpYWdub3N0aWNzRWxlbWVudD5uZXcgZXhwb3J0cy5EaWFnbm9zdGljc0VsZW1lbnQoKTtcclxuICAgICAgICB0aGlzLmFwcGVuZENoaWxkKGRpYWdub3N0aWNzKTtcclxuICAgICAgICBkaWFnbm9zdGljcy5kaWFnbm9zdGljQ2xpY2sgPSAoKSA9PiB0aGlzLnRvZ2dsZUVycm9yV2FybmluZ1BhbmVsKCk7XHJcbiAgICAgICAgZGlhZ25vc3RpY3Muc3luY0NsaWNrID0gKCkgPT4gdGhpcy5kb0NvZGVDaGVjaygpO1xyXG4gICAgICAgIGRpYWdub3N0aWNzLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcclxuXHJcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcbiAgICAgICAgdGhpcy5fc3RhdGUgPSB7IHN0YXR1czogPGFueT57fSB9O1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBhdHRhY2hlZENhbGxiYWNrKCkge1xyXG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKE9tbmkuZGlhZ25vc3RpY3NDb3VudHMuc3Vic2NyaWJlKGNvdW50cyA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuX2RpYWdub3N0aWNzLnVwZGF0ZVN0YXRlKHtcclxuICAgICAgICAgICAgICAgIGVycm9yQ291bnQ6IGNvdW50c1tcImVycm9yXCJdIHx8IDAsXHJcbiAgICAgICAgICAgICAgICB3YXJuaW5nQ291bnQ6IGNvdW50c1tcIndhcm5pbmdcIl0gfHwgMFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKE9ic2VydmFibGUubWVyZ2UoT21uaS5hY3RpdmVNb2RlbCwgT21uaS5hY3RpdmVNb2RlbC5mbGF0TWFwKHggPT4geC5vYnNlcnZlLnN0YXRlKSlcclxuICAgICAgICAgICAgLnN1YnNjcmliZShtb2RlbCA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9mbGFtZS51cGRhdGVTdGF0ZShtb2RlbCk7XHJcbiAgICAgICAgICAgICAgICB1cGRhdGVTdGF0ZSh0aGlzLl9zdGF0ZSwgbW9kZWwpO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMuX3VwZGF0ZVZpc2libGUoKTtcclxuICAgICAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChzZXJ2ZXIub2JzZXJ2ZS5wcm9qZWN0c1xyXG4gICAgICAgICAgICAuZGVib3VuY2VUaW1lKDUwMClcclxuICAgICAgICAgICAgLnN1YnNjcmliZShwcm9qZWN0cyA9PiB0aGlzLl9wcm9qZWN0Q291bnQudXBkYXRlU3RhdGUoeyBwcm9qZWN0Q291bnQ6IHByb2plY3RzLmxlbmd0aCB9KSkpO1xyXG5cclxuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChzZXJ2ZXIub2JzZXJ2ZS5zdGF0dXNcclxuICAgICAgICAgICAgLnN1YnNjcmliZShzdGF0dXMgPT4gdGhpcy5fZmxhbWUudXBkYXRlT3V0Z29pbmcoc3RhdHVzIHx8IDxhbnk+e30pKSk7XHJcblxyXG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKHNlcnZlci5vYnNlcnZlLm1vZGVsXHJcbiAgICAgICAgICAgIC5zdWJzY3JpYmUobW9kZWwgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc3Qgc29sdXRpb25OdW1iZXIgPSBTb2x1dGlvbk1hbmFnZXIuYWN0aXZlU29sdXRpb25zLmxlbmd0aCA+IDEgPyBfLnRyaW0oc2VydmVyLm1vZGVsICYmICg8YW55PnNlcnZlci5tb2RlbCkuaW5kZXgsIFwiY2xpZW50XCIpIDogXCJcIjtcclxuICAgICAgICAgICAgICAgIHRoaXMuX3Byb2plY3RDb3VudC51cGRhdGVTb2x1dGlvbk51bWJlcihzb2x1dGlvbk51bWJlcik7XHJcbiAgICAgICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoT21uaS5hY3RpdmVFZGl0b3JPckNvbmZpZ0VkaXRvci5zdWJzY3JpYmUoZWRpdG9yID0+IHtcclxuICAgICAgICAgICAgdGhpcy5fdXBkYXRlVmlzaWJsZSghIWVkaXRvcik7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChTb2x1dGlvbk1hbmFnZXIuYWN0aXZlU29sdXRpb25cclxuICAgICAgICAgICAgLnN1YnNjcmliZShzb2x1dGlvbnMgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc3Qgc29sdXRpb25OdW1iZXIgPSBTb2x1dGlvbk1hbmFnZXIuYWN0aXZlU29sdXRpb25zLmxlbmd0aCA+IDEgPyBfLnRyaW0oc2VydmVyLm1vZGVsICYmICg8YW55PnNlcnZlci5tb2RlbCkuaW5kZXgsIFwiY2xpZW50XCIpIDogXCJcIjtcclxuICAgICAgICAgICAgICAgIHRoaXMuX3Byb2plY3RDb3VudC51cGRhdGVTb2x1dGlvbk51bWJlcihzb2x1dGlvbk51bWJlcik7XHJcbiAgICAgICAgICAgIH0pKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9oYXNWYWxpZEVkaXRvcjogYm9vbGVhbiA9IGZhbHNlO1xyXG4gICAgcHJpdmF0ZSBfdXBkYXRlVmlzaWJsZShoYXNWYWxpZEVkaXRvcj86IGJvb2xlYW4pIHtcclxuICAgICAgICBpZiAodHlwZW9mIGhhc1ZhbGlkRWRpdG9yICE9PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2hhc1ZhbGlkRWRpdG9yID0gaGFzVmFsaWRFZGl0b3I7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5fc3RhdGUuaXNPbiAmJiB0aGlzLl9oYXNWYWxpZEVkaXRvcikge1xyXG4gICAgICAgICAgICB0aGlzLl9zaG93T25TdGF0ZUl0ZW1zKCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5faGlkZU9uU3RhdGVJdGVtcygpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9zaG93T25TdGF0ZUl0ZW1zKCkge1xyXG4gICAgICAgIGZhc3Rkb20ubWVhc3VyZSgoKSA9PiB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLl9kaWFnbm9zdGljcy5zdHlsZS5kaXNwbGF5ID09PSBcIm5vbmVcIikgeyBmYXN0ZG9tLm11dGF0ZSgoKSA9PiB0aGlzLl9kaWFnbm9zdGljcy5zdHlsZS5kaXNwbGF5ID0gXCJcIik7IH1cclxuICAgICAgICAgICAgaWYgKHRoaXMuX3Byb2plY3RDb3VudC5wcm9qZWN0cy5zdHlsZS5kaXNwbGF5ID09PSBcIm5vbmVcIikgeyBmYXN0ZG9tLm11dGF0ZSgoKSA9PiB0aGlzLl9wcm9qZWN0Q291bnQucHJvamVjdHMuc3R5bGUuZGlzcGxheSA9IFwiXCIpOyB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfaGlkZU9uU3RhdGVJdGVtcygpIHtcclxuICAgICAgICBmYXN0ZG9tLm1lYXN1cmUoKCkgPT4ge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5fZGlhZ25vc3RpY3Muc3R5bGUuZGlzcGxheSAhPT0gXCJub25lXCIpIHsgZmFzdGRvbS5tdXRhdGUoKCkgPT4gdGhpcy5fZGlhZ25vc3RpY3Muc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiKTsgfVxyXG4gICAgICAgICAgICBpZiAodGhpcy5fcHJvamVjdENvdW50LnByb2plY3RzLnN0eWxlLmRpc3BsYXkgIT09IFwibm9uZVwiKSB7IGZhc3Rkb20ubXV0YXRlKCgpID0+IHRoaXMuX3Byb2plY3RDb3VudC5wcm9qZWN0cy5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCIpOyB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRldGFjaGVkQ2FsbGJhY2soKSB7XHJcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHRvZ2dsZSgpIHtcclxuICAgICAgICBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSksIFwib21uaXNoYXJwLWF0b206dG9nZ2xlLWRvY2tcIik7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHRvZ2dsZUVycm9yV2FybmluZ1BhbmVsKCkge1xyXG4gICAgICAgIGF0b20uY29tbWFuZHMuZGlzcGF0Y2goYXRvbS52aWV3cy5nZXRWaWV3KGF0b20ud29ya3NwYWNlKSwgXCJvbW5pc2hhcnAtYXRvbTpkb2NrLXRvZ2dsZS1lcnJvcnNcIik7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHRvZ2dsZVNvbHV0aW9uSW5mb3JtYXRpb24oKSB7XHJcbiAgICAgICAgYXRvbS5jb21tYW5kcy5kaXNwYXRjaChhdG9tLnZpZXdzLmdldFZpZXcoYXRvbS53b3Jrc3BhY2UpLCBcIm9tbmlzaGFycC1hdG9tOnNvbHV0aW9uLXN0YXR1c1wiKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZG9Db2RlQ2hlY2soKSB7XHJcbiAgICAgICAgYXRvbS5jb21tYW5kcy5kaXNwYXRjaChhdG9tLnZpZXdzLmdldFZpZXcoYXRvbS53b3Jrc3BhY2UpLCBcIm9tbmlzaGFycC1hdG9tOmNvZGUtY2hlY2tcIik7XHJcbiAgICB9XHJcbn1cclxuXHJcbig8YW55PmV4cG9ydHMpLlN0YXR1c0JhckVsZW1lbnQgPSAoPGFueT5kb2N1bWVudCkucmVnaXN0ZXJFbGVtZW50KFwib21uaXNoYXJwLXN0YXR1cy1iYXJcIiwgeyBwcm90b3R5cGU6IFN0YXR1c0JhckVsZW1lbnQucHJvdG90eXBlIH0pO1xyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
