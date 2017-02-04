'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.StatusBarElement = exports.ProjectCountElement = exports.DiagnosticsElement = exports.FlameElement = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _rxjs = require('rxjs');

var _tsDisposables = require('ts-disposables');

var _serverInformation = require('../atom/server-information');

var _omni = require('../server/omni');

var _solutionManager = require('../server/solution-manager');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function addClassIfNotincludes(icon) {
    if (icon) {
        for (var _len = arguments.length, cls = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
            cls[_key - 1] = arguments[_key];
        }

        (0, _lodash.each)(cls, function (c) {
            if (!icon.classList.contains(c)) icon.classList.add(c);
        });
    }
}
function removeClassIfincludes(icon) {
    if (icon) {
        for (var _len2 = arguments.length, cls = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
            cls[_key2 - 1] = arguments[_key2];
        }

        (0, _lodash.each)(cls, function (c) {
            if (icon.classList.contains(c)) icon.classList.remove(c);
        });
    }
}
function _updateState(self, state) {
    (0, _lodash.each)(_omni.Omni.viewModelStatefulProperties, function (x) {
        if ((0, _lodash.has)(state, x)) {
            self[x] = state[x];
        }
    });
}

var FlameElement = exports.FlameElement = function (_HTMLAnchorElement) {
    _inherits(FlameElement, _HTMLAnchorElement);

    function FlameElement() {
        _classCallCheck(this, FlameElement);

        return _possibleConstructorReturn(this, (FlameElement.__proto__ || Object.getPrototypeOf(FlameElement)).apply(this, arguments));
    }

    _createClass(FlameElement, [{
        key: 'createdCallback',
        value: function createdCallback() {
            this.classList.add('omnisharp-atom-button');
            this._state = { status: {} };
            var icon = this._icon = document.createElement('span');
            icon.classList.add('icon', 'icon-flame');
            this.appendChild(icon);
            var outgoing = this._outgoing = document.createElement('span');
            outgoing.classList.add('outgoing-requests');
            this.appendChild(outgoing);
        }
    }, {
        key: 'updateState',
        value: function updateState(state) {
            _updateState(this._state, state);
            var icon = this._icon;
            if (this._state.isOff) {
                removeClassIfincludes(icon, 'text-subtle');
            } else {
                addClassIfNotincludes(icon, 'text-subtle');
            }
            if (this._state.isReady) {
                addClassIfNotincludes(icon, 'text-success');
            } else {
                removeClassIfincludes(icon, 'text-success');
            }
            if (this._state.isError) {
                addClassIfNotincludes(icon, 'text-error');
            } else {
                removeClassIfincludes(icon, 'text-error');
            }
            if (this._state.isConnecting) {
                addClassIfNotincludes(icon, 'icon-flame-loading');
                removeClassIfincludes(icon, 'icon-flame-processing');
                removeClassIfincludes(icon, 'icon-flame-loading');
            } else if (this._state.status.hasOutgoingRequests) {
                addClassIfNotincludes(icon, 'icon-flame-processing');
                removeClassIfincludes(icon, 'icon-flame-loading');
            } else {
                removeClassIfincludes(icon, 'icon-flame-processing');
                removeClassIfincludes(icon, 'icon-flame-loading');
            }
        }
    }, {
        key: 'updateOutgoing',
        value: function updateOutgoing(status) {
            if (status.hasOutgoingRequests && status.outgoingRequests > 0) {
                removeClassIfincludes(this._outgoing, 'fade');
            } else {
                addClassIfNotincludes(this._outgoing, 'fade');
            }
            if (status.outgoingRequests !== this._state.status.outgoingRequests) {
                this._outgoing.innerText = status.outgoingRequests && status.outgoingRequests.toString() || '0';
            }
            this._state.status = status || {};
            this.updateState(this._state);
        }
    }]);

    return FlameElement;
}(HTMLAnchorElement);

exports.FlameElement = document.registerElement('omnisharp-flame', { prototype: FlameElement.prototype });

var DiagnosticsElement = exports.DiagnosticsElement = function (_HTMLAnchorElement2) {
    _inherits(DiagnosticsElement, _HTMLAnchorElement2);

    function DiagnosticsElement() {
        _classCallCheck(this, DiagnosticsElement);

        return _possibleConstructorReturn(this, (DiagnosticsElement.__proto__ || Object.getPrototypeOf(DiagnosticsElement)).apply(this, arguments));
    }

    _createClass(DiagnosticsElement, [{
        key: 'createdCallback',
        value: function createdCallback() {
            var _this3 = this;

            this.classList.add('inline-block', 'error-warning-summary');
            var sync = this._sync = document.createElement('a');
            sync.classList.add('icon', 'icon-sync', 'text-subtle');
            this.appendChild(sync);
            sync.onclick = function () {
                return _this3.syncClick();
            };
            var s = document.createElement('span');
            this.appendChild(s);
            s.onclick = function () {
                return _this3.diagnosticClick();
            };
            var errorsIcon = document.createElement('span');
            errorsIcon.classList.add('icon', 'icon-issue-opened');
            s.appendChild(errorsIcon);
            var errors = this._errors = document.createElement('span');
            errors.classList.add('error-summary');
            s.appendChild(errors);
            var warningsIcon = document.createElement('span');
            warningsIcon.classList.add('icon', 'icon-alert');
            s.appendChild(warningsIcon);
            var warnings = this._warnings = document.createElement('span');
            warnings.classList.add('warning-summary');
            s.appendChild(warnings);
        }
    }, {
        key: 'updateState',
        value: function updateState(state) {
            if (!(0, _lodash.isEqual)(this._state, state)) {
                this._state = state;
                if (this._state.errorCount) {
                    this._errors.innerText = this._state.errorCount.toString();
                } else {
                    this._errors.innerText = '0';
                }
                if (this._state.warningCount) {
                    this._warnings.innerText = this._state.warningCount.toString();
                } else {
                    this._warnings.innerText = '0';
                }
            }
        }
    }]);

    return DiagnosticsElement;
}(HTMLAnchorElement);

exports.DiagnosticsElement = document.registerElement('omnisharp-diagnostics', { prototype: DiagnosticsElement.prototype });

var ProjectCountElement = exports.ProjectCountElement = function (_HTMLAnchorElement3) {
    _inherits(ProjectCountElement, _HTMLAnchorElement3);

    function ProjectCountElement() {
        _classCallCheck(this, ProjectCountElement);

        return _possibleConstructorReturn(this, (ProjectCountElement.__proto__ || Object.getPrototypeOf(ProjectCountElement)).apply(this, arguments));
    }

    _createClass(ProjectCountElement, [{
        key: 'createdCallback',
        value: function createdCallback() {
            this.classList.add('inline-block', 'project-summary', 'projects-icon');
            var icon = document.createElement('span');
            icon.classList.add('icon', 'icon-pulse');
            this.appendChild(icon);
            var sub = this._solutionNunmber = document.createElement('sub');
            icon.appendChild(sub);
            var projects = this.projects = document.createElement('span');
            projects.classList.add('projects');
            projects.innerText = '0 Projects';
            this.appendChild(projects);
        }
    }, {
        key: 'updateState',
        value: function updateState(state) {
            if (!(0, _lodash.isEqual)(this._state, state)) {
                this._state = state;
                this.projects.innerText = this._state.projectCount + ' Projects';
            }
        }
    }, {
        key: 'updateSolutionNumber',
        value: function updateSolutionNumber(solutionNumber) {
            this._solutionNunmber.innerText = solutionNumber;
        }
    }]);

    return ProjectCountElement;
}(HTMLAnchorElement);

exports.ProjectCountElement = document.registerElement('omnisharp-project-count', { prototype: ProjectCountElement.prototype });

var StatusBarElement = exports.StatusBarElement = function (_HTMLElement) {
    _inherits(StatusBarElement, _HTMLElement);

    function StatusBarElement() {
        _classCallCheck(this, StatusBarElement);

        var _this5 = _possibleConstructorReturn(this, (StatusBarElement.__proto__ || Object.getPrototypeOf(StatusBarElement)).apply(this, arguments));

        _this5._hasValidEditor = false;
        return _this5;
    }

    _createClass(StatusBarElement, [{
        key: 'createdCallback',
        value: function createdCallback() {
            var _this6 = this;

            this.classList.add('inline-block');
            var flameElement = this._flame = new exports.FlameElement();
            this.appendChild(flameElement);
            flameElement.onclick = function () {
                return _this6.toggle();
            };
            var projectCount = this._projectCount = new exports.ProjectCountElement();
            this.appendChild(projectCount);
            projectCount.onclick = function () {
                return _this6.toggleSolutionInformation();
            };
            projectCount.projects.style.display = 'none';
            var diagnostics = this._diagnostics = new exports.DiagnosticsElement();
            this.appendChild(diagnostics);
            diagnostics.diagnosticClick = function () {
                return _this6.toggleErrorWarningPanel();
            };
            diagnostics.syncClick = function () {
                return _this6.doCodeCheck();
            };
            diagnostics.style.display = 'none';
            this._disposable = new _tsDisposables.CompositeDisposable();
            this._state = { status: {} };
        }
    }, {
        key: 'attachedCallback',
        value: function attachedCallback() {
            var _this7 = this;

            this._disposable.add(_omni.Omni.diagnosticsCounts.subscribe(function (counts) {
                _this7._diagnostics.updateState({
                    errorCount: counts['error'] || 0,
                    warningCount: counts['warning'] || 0
                });
            }));
            this._disposable.add(_rxjs.Observable.merge(_omni.Omni.activeModel, _omni.Omni.activeModel.flatMap(function (x) {
                return x.observe.state;
            })).subscribe(function (model) {
                _this7._flame.updateState(model);
                _updateState(_this7._state, model);
                _this7._updateVisible();
            }));
            this._disposable.add(_serverInformation.server.observe.projects.debounceTime(500).subscribe(function (projects) {
                return _this7._projectCount.updateState({ projectCount: projects.length });
            }));
            this._disposable.add(_serverInformation.server.observe.status.subscribe(function (status) {
                return _this7._flame.updateOutgoing(status || {});
            }));
            this._disposable.add(_serverInformation.server.observe.model.subscribe(function (model) {
                var solutionNumber = _solutionManager.SolutionManager.activeSolutions.length > 1 ? (0, _lodash.trim)(_serverInformation.server.model && _serverInformation.server.model.index, 'client') : '';
                _this7._projectCount.updateSolutionNumber(solutionNumber);
            }));
            this._disposable.add(_omni.Omni.activeEditorOrConfigEditor.subscribe(function (editor) {
                _this7._updateVisible(!!editor);
            }));
            this._disposable.add(_solutionManager.SolutionManager.activeSolution.subscribe(function (solutions) {
                var solutionNumber = _solutionManager.SolutionManager.activeSolutions.length > 1 ? (0, _lodash.trim)(_serverInformation.server.model && _serverInformation.server.model.index, 'client') : '';
                _this7._projectCount.updateSolutionNumber(solutionNumber);
            }));
        }
    }, {
        key: '_updateVisible',
        value: function _updateVisible(hasValidEditor) {
            if (typeof hasValidEditor !== 'undefined') {
                this._hasValidEditor = hasValidEditor;
            }
            if (this._state.isOn && this._hasValidEditor) {
                this._showOnStateItems();
            } else {
                this._hideOnStateItems();
            }
        }
    }, {
        key: '_showOnStateItems',
        value: function _showOnStateItems() {
            if (this._diagnostics.style.display === 'none') {
                this._diagnostics.style.display = '';
            }
            if (this._projectCount.projects.style.display === 'none') {
                this._projectCount.projects.style.display = '';
            }
        }
    }, {
        key: '_hideOnStateItems',
        value: function _hideOnStateItems() {
            if (this._diagnostics.style.display !== 'none') {
                this._diagnostics.style.display = 'none';
            }
            if (this._projectCount.projects.style.display !== 'none') {
                this._projectCount.projects.style.display = 'none';
            }
        }
    }, {
        key: 'detachedCallback',
        value: function detachedCallback() {
            this._disposable.dispose();
        }
    }, {
        key: 'dispose',
        value: function dispose() {
            this._disposable.dispose();
        }
    }, {
        key: 'toggle',
        value: function toggle() {
            atom.commands.dispatch(atom.views.getView(atom.workspace), 'omnisharp-atom:toggle-dock');
        }
    }, {
        key: 'toggleErrorWarningPanel',
        value: function toggleErrorWarningPanel() {
            atom.commands.dispatch(atom.views.getView(atom.workspace), 'omnisharp-atom:dock-toggle-errors');
        }
    }, {
        key: 'toggleSolutionInformation',
        value: function toggleSolutionInformation() {
            atom.commands.dispatch(atom.views.getView(atom.workspace), 'omnisharp-atom:solution-status');
        }
    }, {
        key: 'doCodeCheck',
        value: function doCodeCheck() {
            atom.commands.dispatch(atom.views.getView(atom.workspace), 'omnisharp-atom:code-check');
        }
    }]);

    return StatusBarElement;
}(HTMLElement);

exports.StatusBarElement = document.registerElement('omnisharp-status-bar', { prototype: StatusBarElement.prototype });
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy9zdGF0dXMtYmFyLXZpZXcudHMiLCJsaWIvdmlld3Mvc3RhdHVzLWJhci12aWV3LmpzIl0sIm5hbWVzIjpbImFkZENsYXNzSWZOb3RpbmNsdWRlcyIsImljb24iLCJjbHMiLCJjbGFzc0xpc3QiLCJjb250YWlucyIsImMiLCJhZGQiLCJyZW1vdmVDbGFzc0lmaW5jbHVkZXMiLCJyZW1vdmUiLCJ1cGRhdGVTdGF0ZSIsInNlbGYiLCJzdGF0ZSIsInZpZXdNb2RlbFN0YXRlZnVsUHJvcGVydGllcyIsIngiLCJGbGFtZUVsZW1lbnQiLCJfc3RhdGUiLCJzdGF0dXMiLCJfaWNvbiIsImRvY3VtZW50IiwiY3JlYXRlRWxlbWVudCIsImFwcGVuZENoaWxkIiwib3V0Z29pbmciLCJfb3V0Z29pbmciLCJpc09mZiIsImlzUmVhZHkiLCJpc0Vycm9yIiwiaXNDb25uZWN0aW5nIiwiaGFzT3V0Z29pbmdSZXF1ZXN0cyIsIm91dGdvaW5nUmVxdWVzdHMiLCJpbm5lclRleHQiLCJ0b1N0cmluZyIsIkhUTUxBbmNob3JFbGVtZW50IiwiZXhwb3J0cyIsInJlZ2lzdGVyRWxlbWVudCIsInByb3RvdHlwZSIsIkRpYWdub3N0aWNzRWxlbWVudCIsInN5bmMiLCJfc3luYyIsIm9uY2xpY2siLCJzeW5jQ2xpY2siLCJzIiwiZGlhZ25vc3RpY0NsaWNrIiwiZXJyb3JzSWNvbiIsImVycm9ycyIsIl9lcnJvcnMiLCJ3YXJuaW5nc0ljb24iLCJ3YXJuaW5ncyIsIl93YXJuaW5ncyIsImVycm9yQ291bnQiLCJ3YXJuaW5nQ291bnQiLCJQcm9qZWN0Q291bnRFbGVtZW50Iiwic3ViIiwiX3NvbHV0aW9uTnVubWJlciIsInByb2plY3RzIiwicHJvamVjdENvdW50Iiwic29sdXRpb25OdW1iZXIiLCJTdGF0dXNCYXJFbGVtZW50IiwiYXJndW1lbnRzIiwiX2hhc1ZhbGlkRWRpdG9yIiwiZmxhbWVFbGVtZW50IiwiX2ZsYW1lIiwidG9nZ2xlIiwiX3Byb2plY3RDb3VudCIsInRvZ2dsZVNvbHV0aW9uSW5mb3JtYXRpb24iLCJzdHlsZSIsImRpc3BsYXkiLCJkaWFnbm9zdGljcyIsIl9kaWFnbm9zdGljcyIsInRvZ2dsZUVycm9yV2FybmluZ1BhbmVsIiwiZG9Db2RlQ2hlY2siLCJfZGlzcG9zYWJsZSIsImRpYWdub3N0aWNzQ291bnRzIiwic3Vic2NyaWJlIiwiY291bnRzIiwibWVyZ2UiLCJhY3RpdmVNb2RlbCIsImZsYXRNYXAiLCJvYnNlcnZlIiwibW9kZWwiLCJfdXBkYXRlVmlzaWJsZSIsImRlYm91bmNlVGltZSIsImxlbmd0aCIsInVwZGF0ZU91dGdvaW5nIiwiYWN0aXZlU29sdXRpb25zIiwiaW5kZXgiLCJ1cGRhdGVTb2x1dGlvbk51bWJlciIsImFjdGl2ZUVkaXRvck9yQ29uZmlnRWRpdG9yIiwiZWRpdG9yIiwiYWN0aXZlU29sdXRpb24iLCJoYXNWYWxpZEVkaXRvciIsImlzT24iLCJfc2hvd09uU3RhdGVJdGVtcyIsIl9oaWRlT25TdGF0ZUl0ZW1zIiwiZGlzcG9zZSIsImF0b20iLCJjb21tYW5kcyIsImRpc3BhdGNoIiwidmlld3MiLCJnZXRWaWV3Iiwid29ya3NwYWNlIiwiSFRNTEVsZW1lbnQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUNBOztBQUVBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOzs7Ozs7OztBQUVBLFNBQUFBLHFCQUFBLENBQStCQyxJQUEvQixFQUFrRTtBQUM5RCxRQUFJQSxJQUFKLEVBQVU7QUFBQSwwQ0FEdUNDLEdBQ3ZDO0FBRHVDQSxlQUN2QztBQUFBOztBQUNOLDBCQUFLQSxHQUFMLEVBQVUsYUFBQztBQUNQLGdCQUFJLENBQUNELEtBQUtFLFNBQUwsQ0FBZUMsUUFBZixDQUF3QkMsQ0FBeEIsQ0FBTCxFQUNJSixLQUFLRSxTQUFMLENBQWVHLEdBQWYsQ0FBbUJELENBQW5CO0FBQ1AsU0FIRDtBQUlIO0FBQ0o7QUFDRCxTQUFBRSxxQkFBQSxDQUErQk4sSUFBL0IsRUFBa0U7QUFDOUQsUUFBSUEsSUFBSixFQUFVO0FBQUEsMkNB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QTJELDRCQUEzRDtBQUNIOzs7a0RBRTZCO0FBQzFCTCxpQkFBS0MsUUFBTCxDQUFjQyxRQUFkLENBQXVCRixLQUFLRyxLQUFMLENBQVdDLE9BQVgsQ0FBbUJKLEtBQUtLLFNBQXhCLENBQXZCLEVBQTJELG1DQUEzRDtBQUNIOzs7b0RBRStCO0FBQzVCTCxpQkFBS0MsUUFBTCxDQUFjQyxRQUFkLENBQXVCRixLQUFLRyxLQUFMLENBQVdDLE9BQVgsQ0FBbUJKLEtBQUtLLFNBQXhCLENBQXZCLEVBQTJELGdDQUEzRDtBQUNIOzs7c0NBRWlCO0FBQ2RMLGlCQUFLQyxRQUFMLENBQWNDLFFBQWQsQ0FBdUJGLEtBQUtHLEtBQUwsQ0FBV0MsT0FBWCxDQUFtQkosS0FBS0ssU0FBeEIsQ0FBdkIsRUFBMkQsMkJBQTNEO0FBQ0g7Ozs7RUFsSGlDQyxXOztBQXFIaENwRSxRQUFTd0IsZ0JBQVQsR0FBa0N0QyxTQUFVZSxlQUFWLENBQTBCLHNCQUExQixFQUFrRCxFQUFFQyxXQUFXc0IsaUJBQWlCdEIsU0FBOUIsRUFBbEQsQ0FBbEMiLCJmaWxlIjoibGliL3ZpZXdzL3N0YXR1cy1iYXItdmlldy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIHRzbGludDpkaXNhYmxlOm5vLXN0cmluZy1saXRlcmFsICovXHJcbmltcG9ydCB7IGVhY2gsIGhhcywgaXNFcXVhbCwgdHJpbSB9IGZyb20gJ2xvZGFzaCc7XHJcbmltcG9ydCB7IElPbW5pc2hhcnBDbGllbnRTdGF0dXMgfSBmcm9tICdvbW5pc2hhcnAtY2xpZW50JztcclxuaW1wb3J0IHsgT2JzZXJ2YWJsZSB9IGZyb20gJ3J4anMnO1xyXG5pbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlLCBJRGlzcG9zYWJsZSB9IGZyb20gJ3RzLWRpc3Bvc2FibGVzJztcclxuaW1wb3J0IHsgc2VydmVyIH0gZnJvbSAnLi4vYXRvbS9zZXJ2ZXItaW5mb3JtYXRpb24nO1xyXG5pbXBvcnQgeyBPbW5pIH0gZnJvbSAnLi4vc2VydmVyL29tbmknO1xyXG5pbXBvcnQgeyBTb2x1dGlvbk1hbmFnZXIgfSBmcm9tICcuLi9zZXJ2ZXIvc29sdXRpb24tbWFuYWdlcic7XHJcblxyXG5mdW5jdGlvbiBhZGRDbGFzc0lmTm90aW5jbHVkZXMoaWNvbjogSFRNTEVsZW1lbnQsIC4uLmNsczogc3RyaW5nW10pIHtcclxuICAgIGlmIChpY29uKSB7XHJcbiAgICAgICAgZWFjaChjbHMsIGMgPT4ge1xyXG4gICAgICAgICAgICBpZiAoIWljb24uY2xhc3NMaXN0LmNvbnRhaW5zKGMpKVxyXG4gICAgICAgICAgICAgICAgaWNvbi5jbGFzc0xpc3QuYWRkKGMpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59XHJcbmZ1bmN0aW9uIHJlbW92ZUNsYXNzSWZpbmNsdWRlcyhpY29uOiBIVE1MRWxlbWVudCwgLi4uY2xzOiBzdHJpbmdbXSkge1xyXG4gICAgaWYgKGljb24pIHtcclxuICAgICAgICBlYWNoKGNscywgYyA9PiB7XHJcbiAgICAgICAgICAgIGlmIChpY29uLmNsYXNzTGlzdC5jb250YWlucyhjKSlcclxuICAgICAgICAgICAgICAgIGljb24uY2xhc3NMaXN0LnJlbW92ZShjKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxufVxyXG5cclxuaW50ZXJmYWNlIFN0YXR1c0JhclN0YXRlIHtcclxuICAgIGlzT2ZmPzogYm9vbGVhbjtcclxuICAgIGlzQ29ubmVjdGluZz86IGJvb2xlYW47XHJcbiAgICBpc09uPzogYm9vbGVhbjtcclxuICAgIGlzUmVhZHk/OiBib29sZWFuO1xyXG4gICAgaXNFcnJvcj86IGJvb2xlYW47XHJcbiAgICBzdGF0dXM/OiBJT21uaXNoYXJwQ2xpZW50U3RhdHVzO1xyXG59XHJcblxyXG5mdW5jdGlvbiB1cGRhdGVTdGF0ZShzZWxmOiBhbnksIHN0YXRlOiBhbnkpIHtcclxuICAgIGVhY2goT21uaS52aWV3TW9kZWxTdGF0ZWZ1bFByb3BlcnRpZXMsIHggPT4ge1xyXG4gICAgICAgIGlmIChoYXMoc3RhdGUsIHgpKSB7XHJcbiAgICAgICAgICAgIHNlbGZbeF0gPSBzdGF0ZVt4XTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIEZsYW1lRWxlbWVudCBleHRlbmRzIEhUTUxBbmNob3JFbGVtZW50IGltcGxlbWVudHMgV2ViQ29tcG9uZW50IHtcclxuICAgIHByaXZhdGUgX3N0YXRlOiB7XHJcbiAgICAgICAgaXNPZmY/OiBib29sZWFuO1xyXG4gICAgICAgIGlzQ29ubmVjdGluZz86IGJvb2xlYW47XHJcbiAgICAgICAgaXNPbj86IGJvb2xlYW47XHJcbiAgICAgICAgaXNSZWFkeT86IGJvb2xlYW47XHJcbiAgICAgICAgaXNFcnJvcj86IGJvb2xlYW47XHJcbiAgICAgICAgc3RhdHVzPzogSU9tbmlzaGFycENsaWVudFN0YXR1cztcclxuICAgIH07XHJcblxyXG4gICAgcHJpdmF0ZSBfaWNvbjogSFRNTFNwYW5FbGVtZW50O1xyXG4gICAgcHJpdmF0ZSBfb3V0Z29pbmc6IEhUTUxTcGFuRWxlbWVudDtcclxuXHJcbiAgICBwdWJsaWMgY3JlYXRlZENhbGxiYWNrKCkge1xyXG4gICAgICAgIHRoaXMuY2xhc3NMaXN0LmFkZCgnb21uaXNoYXJwLWF0b20tYnV0dG9uJyk7XHJcbiAgICAgICAgdGhpcy5fc3RhdGUgPSB7IHN0YXR1czogPGFueT57fSB9O1xyXG5cclxuICAgICAgICBjb25zdCBpY29uID0gdGhpcy5faWNvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcclxuICAgICAgICBpY29uLmNsYXNzTGlzdC5hZGQoJ2ljb24nLCAnaWNvbi1mbGFtZScpO1xyXG4gICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQoaWNvbik7XHJcblxyXG4gICAgICAgIGNvbnN0IG91dGdvaW5nID0gdGhpcy5fb3V0Z29pbmcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XHJcbiAgICAgICAgb3V0Z29pbmcuY2xhc3NMaXN0LmFkZCgnb3V0Z29pbmctcmVxdWVzdHMnKTtcclxuICAgICAgICB0aGlzLmFwcGVuZENoaWxkKG91dGdvaW5nKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgdXBkYXRlU3RhdGUoc3RhdGU6IHR5cGVvZiBGbGFtZUVsZW1lbnQucHJvdG90eXBlLl9zdGF0ZSkge1xyXG4gICAgICAgIHVwZGF0ZVN0YXRlKHRoaXMuX3N0YXRlLCBzdGF0ZSk7XHJcbiAgICAgICAgY29uc3QgaWNvbiA9IHRoaXMuX2ljb247XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9zdGF0ZS5pc09mZikge1xyXG4gICAgICAgICAgICByZW1vdmVDbGFzc0lmaW5jbHVkZXMoaWNvbiwgJ3RleHQtc3VidGxlJyk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgYWRkQ2xhc3NJZk5vdGluY2x1ZGVzKGljb24sICd0ZXh0LXN1YnRsZScpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX3N0YXRlLmlzUmVhZHkpIHtcclxuICAgICAgICAgICAgYWRkQ2xhc3NJZk5vdGluY2x1ZGVzKGljb24sICd0ZXh0LXN1Y2Nlc3MnKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByZW1vdmVDbGFzc0lmaW5jbHVkZXMoaWNvbiwgJ3RleHQtc3VjY2VzcycpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX3N0YXRlLmlzRXJyb3IpIHtcclxuICAgICAgICAgICAgYWRkQ2xhc3NJZk5vdGluY2x1ZGVzKGljb24sICd0ZXh0LWVycm9yJyk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmVtb3ZlQ2xhc3NJZmluY2x1ZGVzKGljb24sICd0ZXh0LWVycm9yJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5fc3RhdGUuaXNDb25uZWN0aW5nKSB7XHJcbiAgICAgICAgICAgIGFkZENsYXNzSWZOb3RpbmNsdWRlcyhpY29uLCAnaWNvbi1mbGFtZS1sb2FkaW5nJyk7XHJcbiAgICAgICAgICAgIHJlbW92ZUNsYXNzSWZpbmNsdWRlcyhpY29uLCAnaWNvbi1mbGFtZS1wcm9jZXNzaW5nJyk7XHJcbiAgICAgICAgICAgIHJlbW92ZUNsYXNzSWZpbmNsdWRlcyhpY29uLCAnaWNvbi1mbGFtZS1sb2FkaW5nJyk7XHJcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLl9zdGF0ZS5zdGF0dXMuaGFzT3V0Z29pbmdSZXF1ZXN0cykge1xyXG4gICAgICAgICAgICBhZGRDbGFzc0lmTm90aW5jbHVkZXMoaWNvbiwgJ2ljb24tZmxhbWUtcHJvY2Vzc2luZycpO1xyXG4gICAgICAgICAgICByZW1vdmVDbGFzc0lmaW5jbHVkZXMoaWNvbiwgJ2ljb24tZmxhbWUtbG9hZGluZycpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJlbW92ZUNsYXNzSWZpbmNsdWRlcyhpY29uLCAnaWNvbi1mbGFtZS1wcm9jZXNzaW5nJyk7XHJcbiAgICAgICAgICAgIHJlbW92ZUNsYXNzSWZpbmNsdWRlcyhpY29uLCAnaWNvbi1mbGFtZS1sb2FkaW5nJyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB1cGRhdGVPdXRnb2luZyhzdGF0dXM6IHR5cGVvZiBGbGFtZUVsZW1lbnQucHJvdG90eXBlLl9zdGF0ZS5zdGF0dXMpIHtcclxuICAgICAgICBpZiAoc3RhdHVzLmhhc091dGdvaW5nUmVxdWVzdHMgJiYgc3RhdHVzLm91dGdvaW5nUmVxdWVzdHMgPiAwKSB7XHJcbiAgICAgICAgICAgIHJlbW92ZUNsYXNzSWZpbmNsdWRlcyh0aGlzLl9vdXRnb2luZywgJ2ZhZGUnKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBhZGRDbGFzc0lmTm90aW5jbHVkZXModGhpcy5fb3V0Z29pbmcsICdmYWRlJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoc3RhdHVzLm91dGdvaW5nUmVxdWVzdHMgIT09IHRoaXMuX3N0YXRlLnN0YXR1cy5vdXRnb2luZ1JlcXVlc3RzKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX291dGdvaW5nLmlubmVyVGV4dCA9IHN0YXR1cy5vdXRnb2luZ1JlcXVlc3RzICYmIHN0YXR1cy5vdXRnb2luZ1JlcXVlc3RzLnRvU3RyaW5nKCkgfHwgJzAnO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5fc3RhdGUuc3RhdHVzID0gc3RhdHVzIHx8IDxhbnk+e307XHJcbiAgICAgICAgdGhpcy51cGRhdGVTdGF0ZSh0aGlzLl9zdGF0ZSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbig8YW55PmV4cG9ydHMpLkZsYW1lRWxlbWVudCA9ICg8YW55PmRvY3VtZW50KS5yZWdpc3RlckVsZW1lbnQoJ29tbmlzaGFycC1mbGFtZScsIHsgcHJvdG90eXBlOiBGbGFtZUVsZW1lbnQucHJvdG90eXBlIH0pO1xyXG5cclxuZXhwb3J0IGNsYXNzIERpYWdub3N0aWNzRWxlbWVudCBleHRlbmRzIEhUTUxBbmNob3JFbGVtZW50IGltcGxlbWVudHMgV2ViQ29tcG9uZW50IHtcclxuICAgIHByaXZhdGUgX3N0YXRlOiB7XHJcbiAgICAgICAgZXJyb3JDb3VudDogbnVtYmVyO1xyXG4gICAgICAgIHdhcm5pbmdDb3VudDogbnVtYmVyO1xyXG4gICAgfTtcclxuICAgIHByaXZhdGUgX2Vycm9yczogSFRNTFNwYW5FbGVtZW50O1xyXG4gICAgcHJpdmF0ZSBfd2FybmluZ3M6IEhUTUxTcGFuRWxlbWVudDtcclxuICAgIHByaXZhdGUgX3N5bmM6IEhUTUxBbmNob3JFbGVtZW50O1xyXG5cclxuICAgIHB1YmxpYyBjcmVhdGVkQ2FsbGJhY2soKSB7XHJcbiAgICAgICAgdGhpcy5jbGFzc0xpc3QuYWRkKCdpbmxpbmUtYmxvY2snLCAnZXJyb3Itd2FybmluZy1zdW1tYXJ5Jyk7XHJcblxyXG4gICAgICAgIGNvbnN0IHN5bmMgPSB0aGlzLl9zeW5jID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xyXG4gICAgICAgIHN5bmMuY2xhc3NMaXN0LmFkZCgnaWNvbicsICdpY29uLXN5bmMnLCAndGV4dC1zdWJ0bGUnKTtcclxuICAgICAgICB0aGlzLmFwcGVuZENoaWxkKHN5bmMpO1xyXG4gICAgICAgIHN5bmMub25jbGljayA9ICgpID0+IHRoaXMuc3luY0NsaWNrKCk7XHJcblxyXG4gICAgICAgIGNvbnN0IHMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XHJcbiAgICAgICAgdGhpcy5hcHBlbmRDaGlsZChzKTtcclxuICAgICAgICBzLm9uY2xpY2sgPSAoKSA9PiB0aGlzLmRpYWdub3N0aWNDbGljaygpO1xyXG5cclxuICAgICAgICBjb25zdCBlcnJvcnNJY29uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xyXG4gICAgICAgIGVycm9yc0ljb24uY2xhc3NMaXN0LmFkZCgnaWNvbicsICdpY29uLWlzc3VlLW9wZW5lZCcpO1xyXG4gICAgICAgIHMuYXBwZW5kQ2hpbGQoZXJyb3JzSWNvbik7XHJcblxyXG4gICAgICAgIGNvbnN0IGVycm9ycyA9IHRoaXMuX2Vycm9ycyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcclxuICAgICAgICBlcnJvcnMuY2xhc3NMaXN0LmFkZCgnZXJyb3Itc3VtbWFyeScpO1xyXG4gICAgICAgIHMuYXBwZW5kQ2hpbGQoZXJyb3JzKTtcclxuXHJcbiAgICAgICAgY29uc3Qgd2FybmluZ3NJY29uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xyXG4gICAgICAgIHdhcm5pbmdzSWNvbi5jbGFzc0xpc3QuYWRkKCdpY29uJywgJ2ljb24tYWxlcnQnKTtcclxuICAgICAgICBzLmFwcGVuZENoaWxkKHdhcm5pbmdzSWNvbik7XHJcblxyXG4gICAgICAgIGNvbnN0IHdhcm5pbmdzID0gdGhpcy5fd2FybmluZ3MgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XHJcbiAgICAgICAgd2FybmluZ3MuY2xhc3NMaXN0LmFkZCgnd2FybmluZy1zdW1tYXJ5Jyk7XHJcbiAgICAgICAgcy5hcHBlbmRDaGlsZCh3YXJuaW5ncyk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHVwZGF0ZVN0YXRlKHN0YXRlOiB0eXBlb2YgRGlhZ25vc3RpY3NFbGVtZW50LnByb3RvdHlwZS5fc3RhdGUpIHtcclxuICAgICAgICBpZiAoIWlzRXF1YWwodGhpcy5fc3RhdGUsIHN0YXRlKSkge1xyXG4gICAgICAgICAgICB0aGlzLl9zdGF0ZSA9IHN0YXRlO1xyXG4gICAgICAgICAgICBpZiAodGhpcy5fc3RhdGUuZXJyb3JDb3VudCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fZXJyb3JzLmlubmVyVGV4dCA9IHRoaXMuX3N0YXRlLmVycm9yQ291bnQudG9TdHJpbmcoKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2Vycm9ycy5pbm5lclRleHQgPSAnMCc7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLl9zdGF0ZS53YXJuaW5nQ291bnQpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX3dhcm5pbmdzLmlubmVyVGV4dCA9IHRoaXMuX3N0YXRlLndhcm5pbmdDb3VudC50b1N0cmluZygpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fd2FybmluZ3MuaW5uZXJUZXh0ID0gJzAnO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzeW5jQ2xpY2s6ICgpID0+IHZvaWQ7XHJcbiAgICBwdWJsaWMgZGlhZ25vc3RpY0NsaWNrOiAoKSA9PiB2b2lkO1xyXG59XHJcblxyXG4oPGFueT5leHBvcnRzKS5EaWFnbm9zdGljc0VsZW1lbnQgPSAoPGFueT5kb2N1bWVudCkucmVnaXN0ZXJFbGVtZW50KCdvbW5pc2hhcnAtZGlhZ25vc3RpY3MnLCB7IHByb3RvdHlwZTogRGlhZ25vc3RpY3NFbGVtZW50LnByb3RvdHlwZSB9KTtcclxuXHJcbmV4cG9ydCBjbGFzcyBQcm9qZWN0Q291bnRFbGVtZW50IGV4dGVuZHMgSFRNTEFuY2hvckVsZW1lbnQgaW1wbGVtZW50cyBXZWJDb21wb25lbnQge1xyXG4gICAgcHJpdmF0ZSBfc3RhdGU6IHsgcHJvamVjdENvdW50OiBudW1iZXIgfTtcclxuICAgIHB1YmxpYyBwcm9qZWN0czogSFRNTFNwYW5FbGVtZW50O1xyXG4gICAgcHJpdmF0ZSBfc29sdXRpb25OdW5tYmVyOiBIVE1MU3BhbkVsZW1lbnQ7XHJcblxyXG4gICAgcHVibGljIGNyZWF0ZWRDYWxsYmFjaygpIHtcclxuICAgICAgICB0aGlzLmNsYXNzTGlzdC5hZGQoJ2lubGluZS1ibG9jaycsICdwcm9qZWN0LXN1bW1hcnknLCAncHJvamVjdHMtaWNvbicpO1xyXG5cclxuICAgICAgICBjb25zdCBpY29uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xyXG4gICAgICAgIGljb24uY2xhc3NMaXN0LmFkZCgnaWNvbicsICdpY29uLXB1bHNlJyk7XHJcbiAgICAgICAgdGhpcy5hcHBlbmRDaGlsZChpY29uKTtcclxuXHJcbiAgICAgICAgY29uc3Qgc3ViID0gdGhpcy5fc29sdXRpb25OdW5tYmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3ViJyk7XHJcbiAgICAgICAgaWNvbi5hcHBlbmRDaGlsZChzdWIpO1xyXG5cclxuICAgICAgICBjb25zdCBwcm9qZWN0cyA9IHRoaXMucHJvamVjdHMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XHJcbiAgICAgICAgcHJvamVjdHMuY2xhc3NMaXN0LmFkZCgncHJvamVjdHMnKTtcclxuICAgICAgICBwcm9qZWN0cy5pbm5lclRleHQgPSAnMCBQcm9qZWN0cyc7XHJcbiAgICAgICAgdGhpcy5hcHBlbmRDaGlsZChwcm9qZWN0cyk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHVwZGF0ZVN0YXRlKHN0YXRlOiB0eXBlb2YgUHJvamVjdENvdW50RWxlbWVudC5wcm90b3R5cGUuX3N0YXRlKSB7XHJcbiAgICAgICAgaWYgKCFpc0VxdWFsKHRoaXMuX3N0YXRlLCBzdGF0ZSkpIHtcclxuICAgICAgICAgICAgdGhpcy5fc3RhdGUgPSBzdGF0ZTtcclxuICAgICAgICAgICAgdGhpcy5wcm9qZWN0cy5pbm5lclRleHQgPSBgJHt0aGlzLl9zdGF0ZS5wcm9qZWN0Q291bnR9IFByb2plY3RzYDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHVwZGF0ZVNvbHV0aW9uTnVtYmVyKHNvbHV0aW9uTnVtYmVyOiBzdHJpbmcpIHtcclxuICAgICAgICB0aGlzLl9zb2x1dGlvbk51bm1iZXIuaW5uZXJUZXh0ID0gc29sdXRpb25OdW1iZXI7XHJcbiAgICB9XHJcbn1cclxuXHJcbig8YW55PmV4cG9ydHMpLlByb2plY3RDb3VudEVsZW1lbnQgPSAoPGFueT5kb2N1bWVudCkucmVnaXN0ZXJFbGVtZW50KCdvbW5pc2hhcnAtcHJvamVjdC1jb3VudCcsIHsgcHJvdG90eXBlOiBQcm9qZWN0Q291bnRFbGVtZW50LnByb3RvdHlwZSB9KTtcclxuXHJcblxyXG5leHBvcnQgY2xhc3MgU3RhdHVzQmFyRWxlbWVudCBleHRlbmRzIEhUTUxFbGVtZW50IGltcGxlbWVudHMgV2ViQ29tcG9uZW50LCBJRGlzcG9zYWJsZSB7XHJcbiAgICBwcml2YXRlIF9zdGF0ZTogU3RhdHVzQmFyU3RhdGU7XHJcbiAgICBwcml2YXRlIF9kaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xyXG4gICAgcHJpdmF0ZSBfZmxhbWU6IEZsYW1lRWxlbWVudDtcclxuICAgIHByaXZhdGUgX2RpYWdub3N0aWNzOiBEaWFnbm9zdGljc0VsZW1lbnQ7XHJcbiAgICBwcml2YXRlIF9wcm9qZWN0Q291bnQ6IFByb2plY3RDb3VudEVsZW1lbnQ7XHJcblxyXG4gICAgcHVibGljIGNyZWF0ZWRDYWxsYmFjaygpIHtcclxuICAgICAgICB0aGlzLmNsYXNzTGlzdC5hZGQoJ2lubGluZS1ibG9jaycpO1xyXG5cclxuICAgICAgICBjb25zdCBmbGFtZUVsZW1lbnQgPSB0aGlzLl9mbGFtZSA9IDxGbGFtZUVsZW1lbnQ+bmV3IGV4cG9ydHMuRmxhbWVFbGVtZW50KCk7XHJcbiAgICAgICAgdGhpcy5hcHBlbmRDaGlsZChmbGFtZUVsZW1lbnQpO1xyXG4gICAgICAgIGZsYW1lRWxlbWVudC5vbmNsaWNrID0gKCkgPT4gdGhpcy50b2dnbGUoKTtcclxuXHJcbiAgICAgICAgY29uc3QgcHJvamVjdENvdW50ID0gdGhpcy5fcHJvamVjdENvdW50ID0gPFByb2plY3RDb3VudEVsZW1lbnQ+bmV3IGV4cG9ydHMuUHJvamVjdENvdW50RWxlbWVudCgpO1xyXG4gICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQocHJvamVjdENvdW50KTtcclxuICAgICAgICBwcm9qZWN0Q291bnQub25jbGljayA9ICgpID0+IHRoaXMudG9nZ2xlU29sdXRpb25JbmZvcm1hdGlvbigpO1xyXG4gICAgICAgIHByb2plY3RDb3VudC5wcm9qZWN0cy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xyXG5cclxuICAgICAgICBjb25zdCBkaWFnbm9zdGljcyA9IHRoaXMuX2RpYWdub3N0aWNzID0gPERpYWdub3N0aWNzRWxlbWVudD5uZXcgZXhwb3J0cy5EaWFnbm9zdGljc0VsZW1lbnQoKTtcclxuICAgICAgICB0aGlzLmFwcGVuZENoaWxkKGRpYWdub3N0aWNzKTtcclxuICAgICAgICBkaWFnbm9zdGljcy5kaWFnbm9zdGljQ2xpY2sgPSAoKSA9PiB0aGlzLnRvZ2dsZUVycm9yV2FybmluZ1BhbmVsKCk7XHJcbiAgICAgICAgZGlhZ25vc3RpY3Muc3luY0NsaWNrID0gKCkgPT4gdGhpcy5kb0NvZGVDaGVjaygpO1xyXG4gICAgICAgIGRpYWdub3N0aWNzLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XHJcblxyXG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG4gICAgICAgIHRoaXMuX3N0YXRlID0geyBzdGF0dXM6IDxhbnk+e30gfTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgYXR0YWNoZWRDYWxsYmFjaygpIHtcclxuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChPbW5pLmRpYWdub3N0aWNzQ291bnRzLnN1YnNjcmliZShjb3VudHMgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLl9kaWFnbm9zdGljcy51cGRhdGVTdGF0ZSh7XHJcbiAgICAgICAgICAgICAgICBlcnJvckNvdW50OiBjb3VudHNbJ2Vycm9yJ10gfHwgMCxcclxuICAgICAgICAgICAgICAgIHdhcm5pbmdDb3VudDogY291bnRzWyd3YXJuaW5nJ10gfHwgMFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKE9ic2VydmFibGUubWVyZ2UoT21uaS5hY3RpdmVNb2RlbCwgT21uaS5hY3RpdmVNb2RlbC5mbGF0TWFwKHggPT4geC5vYnNlcnZlLnN0YXRlKSlcclxuICAgICAgICAgICAgLnN1YnNjcmliZShtb2RlbCA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9mbGFtZS51cGRhdGVTdGF0ZShtb2RlbCk7XHJcbiAgICAgICAgICAgICAgICB1cGRhdGVTdGF0ZSh0aGlzLl9zdGF0ZSwgbW9kZWwpO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMuX3VwZGF0ZVZpc2libGUoKTtcclxuICAgICAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChzZXJ2ZXIub2JzZXJ2ZS5wcm9qZWN0c1xyXG4gICAgICAgICAgICAuZGVib3VuY2VUaW1lKDUwMClcclxuICAgICAgICAgICAgLnN1YnNjcmliZShwcm9qZWN0cyA9PiB0aGlzLl9wcm9qZWN0Q291bnQudXBkYXRlU3RhdGUoeyBwcm9qZWN0Q291bnQ6IHByb2plY3RzLmxlbmd0aCB9KSkpO1xyXG5cclxuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChzZXJ2ZXIub2JzZXJ2ZS5zdGF0dXNcclxuICAgICAgICAgICAgLnN1YnNjcmliZShzdGF0dXMgPT4gdGhpcy5fZmxhbWUudXBkYXRlT3V0Z29pbmcoc3RhdHVzIHx8IDxhbnk+e30pKSk7XHJcblxyXG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKHNlcnZlci5vYnNlcnZlLm1vZGVsXHJcbiAgICAgICAgICAgIC5zdWJzY3JpYmUobW9kZWwgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc3Qgc29sdXRpb25OdW1iZXIgPSBTb2x1dGlvbk1hbmFnZXIuYWN0aXZlU29sdXRpb25zLmxlbmd0aCA+IDEgPyB0cmltKHNlcnZlci5tb2RlbCAmJiAoPGFueT5zZXJ2ZXIubW9kZWwpLmluZGV4LCAnY2xpZW50JykgOiAnJztcclxuICAgICAgICAgICAgICAgIHRoaXMuX3Byb2plY3RDb3VudC51cGRhdGVTb2x1dGlvbk51bWJlcihzb2x1dGlvbk51bWJlcik7XHJcbiAgICAgICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoT21uaS5hY3RpdmVFZGl0b3JPckNvbmZpZ0VkaXRvci5zdWJzY3JpYmUoZWRpdG9yID0+IHtcclxuICAgICAgICAgICAgdGhpcy5fdXBkYXRlVmlzaWJsZSghIWVkaXRvcik7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChTb2x1dGlvbk1hbmFnZXIuYWN0aXZlU29sdXRpb25cclxuICAgICAgICAgICAgLnN1YnNjcmliZShzb2x1dGlvbnMgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc3Qgc29sdXRpb25OdW1iZXIgPSBTb2x1dGlvbk1hbmFnZXIuYWN0aXZlU29sdXRpb25zLmxlbmd0aCA+IDEgPyB0cmltKHNlcnZlci5tb2RlbCAmJiAoPGFueT5zZXJ2ZXIubW9kZWwpLmluZGV4LCAnY2xpZW50JykgOiAnJztcclxuICAgICAgICAgICAgICAgIHRoaXMuX3Byb2plY3RDb3VudC51cGRhdGVTb2x1dGlvbk51bWJlcihzb2x1dGlvbk51bWJlcik7XHJcbiAgICAgICAgICAgIH0pKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9oYXNWYWxpZEVkaXRvcjogYm9vbGVhbiA9IGZhbHNlO1xyXG4gICAgcHJpdmF0ZSBfdXBkYXRlVmlzaWJsZShoYXNWYWxpZEVkaXRvcj86IGJvb2xlYW4pIHtcclxuICAgICAgICBpZiAodHlwZW9mIGhhc1ZhbGlkRWRpdG9yICE9PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgICAgICB0aGlzLl9oYXNWYWxpZEVkaXRvciA9IGhhc1ZhbGlkRWRpdG9yO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX3N0YXRlLmlzT24gJiYgdGhpcy5faGFzVmFsaWRFZGl0b3IpIHtcclxuICAgICAgICAgICAgdGhpcy5fc2hvd09uU3RhdGVJdGVtcygpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2hpZGVPblN0YXRlSXRlbXMoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfc2hvd09uU3RhdGVJdGVtcygpIHtcclxuICAgICAgICBpZiAodGhpcy5fZGlhZ25vc3RpY3Muc3R5bGUuZGlzcGxheSA9PT0gJ25vbmUnKSB7IHRoaXMuX2RpYWdub3N0aWNzLnN0eWxlLmRpc3BsYXkgPSAnJzsgfVxyXG4gICAgICAgIGlmICh0aGlzLl9wcm9qZWN0Q291bnQucHJvamVjdHMuc3R5bGUuZGlzcGxheSA9PT0gJ25vbmUnKSB7IHRoaXMuX3Byb2plY3RDb3VudC5wcm9qZWN0cy5zdHlsZS5kaXNwbGF5ID0gJyc7IH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9oaWRlT25TdGF0ZUl0ZW1zKCkge1xyXG4gICAgICAgIGlmICh0aGlzLl9kaWFnbm9zdGljcy5zdHlsZS5kaXNwbGF5ICE9PSAnbm9uZScpIHsgdGhpcy5fZGlhZ25vc3RpY3Muc3R5bGUuZGlzcGxheSA9ICdub25lJzsgfVxyXG4gICAgICAgIGlmICh0aGlzLl9wcm9qZWN0Q291bnQucHJvamVjdHMuc3R5bGUuZGlzcGxheSAhPT0gJ25vbmUnKSB7IHRoaXMuX3Byb2plY3RDb3VudC5wcm9qZWN0cy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnOyB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRldGFjaGVkQ2FsbGJhY2soKSB7XHJcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHRvZ2dsZSgpIHtcclxuICAgICAgICBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSksICdvbW5pc2hhcnAtYXRvbTp0b2dnbGUtZG9jaycpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB0b2dnbGVFcnJvcldhcm5pbmdQYW5lbCgpIHtcclxuICAgICAgICBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSksICdvbW5pc2hhcnAtYXRvbTpkb2NrLXRvZ2dsZS1lcnJvcnMnKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgdG9nZ2xlU29sdXRpb25JbmZvcm1hdGlvbigpIHtcclxuICAgICAgICBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSksICdvbW5pc2hhcnAtYXRvbTpzb2x1dGlvbi1zdGF0dXMnKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZG9Db2RlQ2hlY2soKSB7XHJcbiAgICAgICAgYXRvbS5jb21tYW5kcy5kaXNwYXRjaChhdG9tLnZpZXdzLmdldFZpZXcoYXRvbS53b3Jrc3BhY2UpLCAnb21uaXNoYXJwLWF0b206Y29kZS1jaGVjaycpO1xyXG4gICAgfVxyXG59XHJcblxyXG4oPGFueT5leHBvcnRzKS5TdGF0dXNCYXJFbGVtZW50ID0gKDxhbnk+ZG9jdW1lbnQpLnJlZ2lzdGVyRWxlbWVudCgnb21uaXNoYXJwLXN0YXR1cy1iYXInLCB7IHByb3RvdHlwZTogU3RhdHVzQmFyRWxlbWVudC5wcm90b3R5cGUgfSk7XHJcbiIsImltcG9ydCB7IGVhY2gsIGhhcywgaXNFcXVhbCwgdHJpbSB9IGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgeyBPYnNlcnZhYmxlIH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlIH0gZnJvbSAndHMtZGlzcG9zYWJsZXMnO1xuaW1wb3J0IHsgc2VydmVyIH0gZnJvbSAnLi4vYXRvbS9zZXJ2ZXItaW5mb3JtYXRpb24nO1xuaW1wb3J0IHsgT21uaSB9IGZyb20gJy4uL3NlcnZlci9vbW5pJztcbmltcG9ydCB7IFNvbHV0aW9uTWFuYWdlciB9IGZyb20gJy4uL3NlcnZlci9zb2x1dGlvbi1tYW5hZ2VyJztcbmZ1bmN0aW9uIGFkZENsYXNzSWZOb3RpbmNsdWRlcyhpY29uLCAuLi5jbHMpIHtcbiAgICBpZiAoaWNvbikge1xuICAgICAgICBlYWNoKGNscywgYyA9PiB7XG4gICAgICAgICAgICBpZiAoIWljb24uY2xhc3NMaXN0LmNvbnRhaW5zKGMpKVxuICAgICAgICAgICAgICAgIGljb24uY2xhc3NMaXN0LmFkZChjKTtcbiAgICAgICAgfSk7XG4gICAgfVxufVxuZnVuY3Rpb24gcmVtb3ZlQ2xhc3NJZmluY2x1ZGVzKGljb24sIC4uLmNscykge1xuICAgIGlmIChpY29uKSB7XG4gICAgICAgIGVhY2goY2xzLCBjID0+IHtcbiAgICAgICAgICAgIGlmIChpY29uLmNsYXNzTGlzdC5jb250YWlucyhjKSlcbiAgICAgICAgICAgICAgICBpY29uLmNsYXNzTGlzdC5yZW1vdmUoYyk7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHVwZGF0ZVN0YXRlKHNlbGYsIHN0YXRlKSB7XG4gICAgZWFjaChPbW5pLnZpZXdNb2RlbFN0YXRlZnVsUHJvcGVydGllcywgeCA9PiB7XG4gICAgICAgIGlmIChoYXMoc3RhdGUsIHgpKSB7XG4gICAgICAgICAgICBzZWxmW3hdID0gc3RhdGVbeF07XG4gICAgICAgIH1cbiAgICB9KTtcbn1cbmV4cG9ydCBjbGFzcyBGbGFtZUVsZW1lbnQgZXh0ZW5kcyBIVE1MQW5jaG9yRWxlbWVudCB7XG4gICAgY3JlYXRlZENhbGxiYWNrKCkge1xuICAgICAgICB0aGlzLmNsYXNzTGlzdC5hZGQoJ29tbmlzaGFycC1hdG9tLWJ1dHRvbicpO1xuICAgICAgICB0aGlzLl9zdGF0ZSA9IHsgc3RhdHVzOiB7fSB9O1xuICAgICAgICBjb25zdCBpY29uID0gdGhpcy5faWNvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICAgICAgaWNvbi5jbGFzc0xpc3QuYWRkKCdpY29uJywgJ2ljb24tZmxhbWUnKTtcbiAgICAgICAgdGhpcy5hcHBlbmRDaGlsZChpY29uKTtcbiAgICAgICAgY29uc3Qgb3V0Z29pbmcgPSB0aGlzLl9vdXRnb2luZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICAgICAgb3V0Z29pbmcuY2xhc3NMaXN0LmFkZCgnb3V0Z29pbmctcmVxdWVzdHMnKTtcbiAgICAgICAgdGhpcy5hcHBlbmRDaGlsZChvdXRnb2luZyk7XG4gICAgfVxuICAgIHVwZGF0ZVN0YXRlKHN0YXRlKSB7XG4gICAgICAgIHVwZGF0ZVN0YXRlKHRoaXMuX3N0YXRlLCBzdGF0ZSk7XG4gICAgICAgIGNvbnN0IGljb24gPSB0aGlzLl9pY29uO1xuICAgICAgICBpZiAodGhpcy5fc3RhdGUuaXNPZmYpIHtcbiAgICAgICAgICAgIHJlbW92ZUNsYXNzSWZpbmNsdWRlcyhpY29uLCAndGV4dC1zdWJ0bGUnKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGFkZENsYXNzSWZOb3RpbmNsdWRlcyhpY29uLCAndGV4dC1zdWJ0bGUnKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5fc3RhdGUuaXNSZWFkeSkge1xuICAgICAgICAgICAgYWRkQ2xhc3NJZk5vdGluY2x1ZGVzKGljb24sICd0ZXh0LXN1Y2Nlc3MnKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJlbW92ZUNsYXNzSWZpbmNsdWRlcyhpY29uLCAndGV4dC1zdWNjZXNzJyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuX3N0YXRlLmlzRXJyb3IpIHtcbiAgICAgICAgICAgIGFkZENsYXNzSWZOb3RpbmNsdWRlcyhpY29uLCAndGV4dC1lcnJvcicpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmVtb3ZlQ2xhc3NJZmluY2x1ZGVzKGljb24sICd0ZXh0LWVycm9yJyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuX3N0YXRlLmlzQ29ubmVjdGluZykge1xuICAgICAgICAgICAgYWRkQ2xhc3NJZk5vdGluY2x1ZGVzKGljb24sICdpY29uLWZsYW1lLWxvYWRpbmcnKTtcbiAgICAgICAgICAgIHJlbW92ZUNsYXNzSWZpbmNsdWRlcyhpY29uLCAnaWNvbi1mbGFtZS1wcm9jZXNzaW5nJyk7XG4gICAgICAgICAgICByZW1vdmVDbGFzc0lmaW5jbHVkZXMoaWNvbiwgJ2ljb24tZmxhbWUtbG9hZGluZycpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHRoaXMuX3N0YXRlLnN0YXR1cy5oYXNPdXRnb2luZ1JlcXVlc3RzKSB7XG4gICAgICAgICAgICBhZGRDbGFzc0lmTm90aW5jbHVkZXMoaWNvbiwgJ2ljb24tZmxhbWUtcHJvY2Vzc2luZycpO1xuICAgICAgICAgICAgcmVtb3ZlQ2xhc3NJZmluY2x1ZGVzKGljb24sICdpY29uLWZsYW1lLWxvYWRpbmcnKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJlbW92ZUNsYXNzSWZpbmNsdWRlcyhpY29uLCAnaWNvbi1mbGFtZS1wcm9jZXNzaW5nJyk7XG4gICAgICAgICAgICByZW1vdmVDbGFzc0lmaW5jbHVkZXMoaWNvbiwgJ2ljb24tZmxhbWUtbG9hZGluZycpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHVwZGF0ZU91dGdvaW5nKHN0YXR1cykge1xuICAgICAgICBpZiAoc3RhdHVzLmhhc091dGdvaW5nUmVxdWVzdHMgJiYgc3RhdHVzLm91dGdvaW5nUmVxdWVzdHMgPiAwKSB7XG4gICAgICAgICAgICByZW1vdmVDbGFzc0lmaW5jbHVkZXModGhpcy5fb3V0Z29pbmcsICdmYWRlJyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBhZGRDbGFzc0lmTm90aW5jbHVkZXModGhpcy5fb3V0Z29pbmcsICdmYWRlJyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHN0YXR1cy5vdXRnb2luZ1JlcXVlc3RzICE9PSB0aGlzLl9zdGF0ZS5zdGF0dXMub3V0Z29pbmdSZXF1ZXN0cykge1xuICAgICAgICAgICAgdGhpcy5fb3V0Z29pbmcuaW5uZXJUZXh0ID0gc3RhdHVzLm91dGdvaW5nUmVxdWVzdHMgJiYgc3RhdHVzLm91dGdvaW5nUmVxdWVzdHMudG9TdHJpbmcoKSB8fCAnMCc7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fc3RhdGUuc3RhdHVzID0gc3RhdHVzIHx8IHt9O1xuICAgICAgICB0aGlzLnVwZGF0ZVN0YXRlKHRoaXMuX3N0YXRlKTtcbiAgICB9XG59XG5leHBvcnRzLkZsYW1lRWxlbWVudCA9IGRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudCgnb21uaXNoYXJwLWZsYW1lJywgeyBwcm90b3R5cGU6IEZsYW1lRWxlbWVudC5wcm90b3R5cGUgfSk7XG5leHBvcnQgY2xhc3MgRGlhZ25vc3RpY3NFbGVtZW50IGV4dGVuZHMgSFRNTEFuY2hvckVsZW1lbnQge1xuICAgIGNyZWF0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdGhpcy5jbGFzc0xpc3QuYWRkKCdpbmxpbmUtYmxvY2snLCAnZXJyb3Itd2FybmluZy1zdW1tYXJ5Jyk7XG4gICAgICAgIGNvbnN0IHN5bmMgPSB0aGlzLl9zeW5jID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuICAgICAgICBzeW5jLmNsYXNzTGlzdC5hZGQoJ2ljb24nLCAnaWNvbi1zeW5jJywgJ3RleHQtc3VidGxlJyk7XG4gICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQoc3luYyk7XG4gICAgICAgIHN5bmMub25jbGljayA9ICgpID0+IHRoaXMuc3luY0NsaWNrKCk7XG4gICAgICAgIGNvbnN0IHMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQocyk7XG4gICAgICAgIHMub25jbGljayA9ICgpID0+IHRoaXMuZGlhZ25vc3RpY0NsaWNrKCk7XG4gICAgICAgIGNvbnN0IGVycm9yc0ljb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgICAgIGVycm9yc0ljb24uY2xhc3NMaXN0LmFkZCgnaWNvbicsICdpY29uLWlzc3VlLW9wZW5lZCcpO1xuICAgICAgICBzLmFwcGVuZENoaWxkKGVycm9yc0ljb24pO1xuICAgICAgICBjb25zdCBlcnJvcnMgPSB0aGlzLl9lcnJvcnMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgICAgIGVycm9ycy5jbGFzc0xpc3QuYWRkKCdlcnJvci1zdW1tYXJ5Jyk7XG4gICAgICAgIHMuYXBwZW5kQ2hpbGQoZXJyb3JzKTtcbiAgICAgICAgY29uc3Qgd2FybmluZ3NJY29uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgICAgICB3YXJuaW5nc0ljb24uY2xhc3NMaXN0LmFkZCgnaWNvbicsICdpY29uLWFsZXJ0Jyk7XG4gICAgICAgIHMuYXBwZW5kQ2hpbGQod2FybmluZ3NJY29uKTtcbiAgICAgICAgY29uc3Qgd2FybmluZ3MgPSB0aGlzLl93YXJuaW5ncyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICAgICAgd2FybmluZ3MuY2xhc3NMaXN0LmFkZCgnd2FybmluZy1zdW1tYXJ5Jyk7XG4gICAgICAgIHMuYXBwZW5kQ2hpbGQod2FybmluZ3MpO1xuICAgIH1cbiAgICB1cGRhdGVTdGF0ZShzdGF0ZSkge1xuICAgICAgICBpZiAoIWlzRXF1YWwodGhpcy5fc3RhdGUsIHN0YXRlKSkge1xuICAgICAgICAgICAgdGhpcy5fc3RhdGUgPSBzdGF0ZTtcbiAgICAgICAgICAgIGlmICh0aGlzLl9zdGF0ZS5lcnJvckNvdW50KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fZXJyb3JzLmlubmVyVGV4dCA9IHRoaXMuX3N0YXRlLmVycm9yQ291bnQudG9TdHJpbmcoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuX2Vycm9ycy5pbm5lclRleHQgPSAnMCc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5fc3RhdGUud2FybmluZ0NvdW50KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fd2FybmluZ3MuaW5uZXJUZXh0ID0gdGhpcy5fc3RhdGUud2FybmluZ0NvdW50LnRvU3RyaW5nKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLl93YXJuaW5ncy5pbm5lclRleHQgPSAnMCc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5leHBvcnRzLkRpYWdub3N0aWNzRWxlbWVudCA9IGRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudCgnb21uaXNoYXJwLWRpYWdub3N0aWNzJywgeyBwcm90b3R5cGU6IERpYWdub3N0aWNzRWxlbWVudC5wcm90b3R5cGUgfSk7XG5leHBvcnQgY2xhc3MgUHJvamVjdENvdW50RWxlbWVudCBleHRlbmRzIEhUTUxBbmNob3JFbGVtZW50IHtcbiAgICBjcmVhdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMuY2xhc3NMaXN0LmFkZCgnaW5saW5lLWJsb2NrJywgJ3Byb2plY3Qtc3VtbWFyeScsICdwcm9qZWN0cy1pY29uJyk7XG4gICAgICAgIGNvbnN0IGljb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgICAgIGljb24uY2xhc3NMaXN0LmFkZCgnaWNvbicsICdpY29uLXB1bHNlJyk7XG4gICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQoaWNvbik7XG4gICAgICAgIGNvbnN0IHN1YiA9IHRoaXMuX3NvbHV0aW9uTnVubWJlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N1YicpO1xuICAgICAgICBpY29uLmFwcGVuZENoaWxkKHN1Yik7XG4gICAgICAgIGNvbnN0IHByb2plY3RzID0gdGhpcy5wcm9qZWN0cyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICAgICAgcHJvamVjdHMuY2xhc3NMaXN0LmFkZCgncHJvamVjdHMnKTtcbiAgICAgICAgcHJvamVjdHMuaW5uZXJUZXh0ID0gJzAgUHJvamVjdHMnO1xuICAgICAgICB0aGlzLmFwcGVuZENoaWxkKHByb2plY3RzKTtcbiAgICB9XG4gICAgdXBkYXRlU3RhdGUoc3RhdGUpIHtcbiAgICAgICAgaWYgKCFpc0VxdWFsKHRoaXMuX3N0YXRlLCBzdGF0ZSkpIHtcbiAgICAgICAgICAgIHRoaXMuX3N0YXRlID0gc3RhdGU7XG4gICAgICAgICAgICB0aGlzLnByb2plY3RzLmlubmVyVGV4dCA9IGAke3RoaXMuX3N0YXRlLnByb2plY3RDb3VudH0gUHJvamVjdHNgO1xuICAgICAgICB9XG4gICAgfVxuICAgIHVwZGF0ZVNvbHV0aW9uTnVtYmVyKHNvbHV0aW9uTnVtYmVyKSB7XG4gICAgICAgIHRoaXMuX3NvbHV0aW9uTnVubWJlci5pbm5lclRleHQgPSBzb2x1dGlvbk51bWJlcjtcbiAgICB9XG59XG5leHBvcnRzLlByb2plY3RDb3VudEVsZW1lbnQgPSBkb2N1bWVudC5yZWdpc3RlckVsZW1lbnQoJ29tbmlzaGFycC1wcm9qZWN0LWNvdW50JywgeyBwcm90b3R5cGU6IFByb2plY3RDb3VudEVsZW1lbnQucHJvdG90eXBlIH0pO1xuZXhwb3J0IGNsYXNzIFN0YXR1c0JhckVsZW1lbnQgZXh0ZW5kcyBIVE1MRWxlbWVudCB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKC4uLmFyZ3VtZW50cyk7XG4gICAgICAgIHRoaXMuX2hhc1ZhbGlkRWRpdG9yID0gZmFsc2U7XG4gICAgfVxuICAgIGNyZWF0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdGhpcy5jbGFzc0xpc3QuYWRkKCdpbmxpbmUtYmxvY2snKTtcbiAgICAgICAgY29uc3QgZmxhbWVFbGVtZW50ID0gdGhpcy5fZmxhbWUgPSBuZXcgZXhwb3J0cy5GbGFtZUVsZW1lbnQoKTtcbiAgICAgICAgdGhpcy5hcHBlbmRDaGlsZChmbGFtZUVsZW1lbnQpO1xuICAgICAgICBmbGFtZUVsZW1lbnQub25jbGljayA9ICgpID0+IHRoaXMudG9nZ2xlKCk7XG4gICAgICAgIGNvbnN0IHByb2plY3RDb3VudCA9IHRoaXMuX3Byb2plY3RDb3VudCA9IG5ldyBleHBvcnRzLlByb2plY3RDb3VudEVsZW1lbnQoKTtcbiAgICAgICAgdGhpcy5hcHBlbmRDaGlsZChwcm9qZWN0Q291bnQpO1xuICAgICAgICBwcm9qZWN0Q291bnQub25jbGljayA9ICgpID0+IHRoaXMudG9nZ2xlU29sdXRpb25JbmZvcm1hdGlvbigpO1xuICAgICAgICBwcm9qZWN0Q291bnQucHJvamVjdHMuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgY29uc3QgZGlhZ25vc3RpY3MgPSB0aGlzLl9kaWFnbm9zdGljcyA9IG5ldyBleHBvcnRzLkRpYWdub3N0aWNzRWxlbWVudCgpO1xuICAgICAgICB0aGlzLmFwcGVuZENoaWxkKGRpYWdub3N0aWNzKTtcbiAgICAgICAgZGlhZ25vc3RpY3MuZGlhZ25vc3RpY0NsaWNrID0gKCkgPT4gdGhpcy50b2dnbGVFcnJvcldhcm5pbmdQYW5lbCgpO1xuICAgICAgICBkaWFnbm9zdGljcy5zeW5jQ2xpY2sgPSAoKSA9PiB0aGlzLmRvQ29kZUNoZWNrKCk7XG4gICAgICAgIGRpYWdub3N0aWNzLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICB0aGlzLl9zdGF0ZSA9IHsgc3RhdHVzOiB7fSB9O1xuICAgIH1cbiAgICBhdHRhY2hlZENhbGxiYWNrKCkge1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChPbW5pLmRpYWdub3N0aWNzQ291bnRzLnN1YnNjcmliZShjb3VudHMgPT4ge1xuICAgICAgICAgICAgdGhpcy5fZGlhZ25vc3RpY3MudXBkYXRlU3RhdGUoe1xuICAgICAgICAgICAgICAgIGVycm9yQ291bnQ6IGNvdW50c1snZXJyb3InXSB8fCAwLFxuICAgICAgICAgICAgICAgIHdhcm5pbmdDb3VudDogY291bnRzWyd3YXJuaW5nJ10gfHwgMFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoT2JzZXJ2YWJsZS5tZXJnZShPbW5pLmFjdGl2ZU1vZGVsLCBPbW5pLmFjdGl2ZU1vZGVsLmZsYXRNYXAoeCA9PiB4Lm9ic2VydmUuc3RhdGUpKVxuICAgICAgICAgICAgLnN1YnNjcmliZShtb2RlbCA9PiB7XG4gICAgICAgICAgICB0aGlzLl9mbGFtZS51cGRhdGVTdGF0ZShtb2RlbCk7XG4gICAgICAgICAgICB1cGRhdGVTdGF0ZSh0aGlzLl9zdGF0ZSwgbW9kZWwpO1xuICAgICAgICAgICAgdGhpcy5fdXBkYXRlVmlzaWJsZSgpO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKHNlcnZlci5vYnNlcnZlLnByb2plY3RzXG4gICAgICAgICAgICAuZGVib3VuY2VUaW1lKDUwMClcbiAgICAgICAgICAgIC5zdWJzY3JpYmUocHJvamVjdHMgPT4gdGhpcy5fcHJvamVjdENvdW50LnVwZGF0ZVN0YXRlKHsgcHJvamVjdENvdW50OiBwcm9qZWN0cy5sZW5ndGggfSkpKTtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoc2VydmVyLm9ic2VydmUuc3RhdHVzXG4gICAgICAgICAgICAuc3Vic2NyaWJlKHN0YXR1cyA9PiB0aGlzLl9mbGFtZS51cGRhdGVPdXRnb2luZyhzdGF0dXMgfHwge30pKSk7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKHNlcnZlci5vYnNlcnZlLm1vZGVsXG4gICAgICAgICAgICAuc3Vic2NyaWJlKG1vZGVsID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHNvbHV0aW9uTnVtYmVyID0gU29sdXRpb25NYW5hZ2VyLmFjdGl2ZVNvbHV0aW9ucy5sZW5ndGggPiAxID8gdHJpbShzZXJ2ZXIubW9kZWwgJiYgc2VydmVyLm1vZGVsLmluZGV4LCAnY2xpZW50JykgOiAnJztcbiAgICAgICAgICAgIHRoaXMuX3Byb2plY3RDb3VudC51cGRhdGVTb2x1dGlvbk51bWJlcihzb2x1dGlvbk51bWJlcik7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoT21uaS5hY3RpdmVFZGl0b3JPckNvbmZpZ0VkaXRvci5zdWJzY3JpYmUoZWRpdG9yID0+IHtcbiAgICAgICAgICAgIHRoaXMuX3VwZGF0ZVZpc2libGUoISFlZGl0b3IpO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKFNvbHV0aW9uTWFuYWdlci5hY3RpdmVTb2x1dGlvblxuICAgICAgICAgICAgLnN1YnNjcmliZShzb2x1dGlvbnMgPT4ge1xuICAgICAgICAgICAgY29uc3Qgc29sdXRpb25OdW1iZXIgPSBTb2x1dGlvbk1hbmFnZXIuYWN0aXZlU29sdXRpb25zLmxlbmd0aCA+IDEgPyB0cmltKHNlcnZlci5tb2RlbCAmJiBzZXJ2ZXIubW9kZWwuaW5kZXgsICdjbGllbnQnKSA6ICcnO1xuICAgICAgICAgICAgdGhpcy5fcHJvamVjdENvdW50LnVwZGF0ZVNvbHV0aW9uTnVtYmVyKHNvbHV0aW9uTnVtYmVyKTtcbiAgICAgICAgfSkpO1xuICAgIH1cbiAgICBfdXBkYXRlVmlzaWJsZShoYXNWYWxpZEVkaXRvcikge1xuICAgICAgICBpZiAodHlwZW9mIGhhc1ZhbGlkRWRpdG9yICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgdGhpcy5faGFzVmFsaWRFZGl0b3IgPSBoYXNWYWxpZEVkaXRvcjtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5fc3RhdGUuaXNPbiAmJiB0aGlzLl9oYXNWYWxpZEVkaXRvcikge1xuICAgICAgICAgICAgdGhpcy5fc2hvd09uU3RhdGVJdGVtcygpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5faGlkZU9uU3RhdGVJdGVtcygpO1xuICAgICAgICB9XG4gICAgfVxuICAgIF9zaG93T25TdGF0ZUl0ZW1zKCkge1xuICAgICAgICBpZiAodGhpcy5fZGlhZ25vc3RpY3Muc3R5bGUuZGlzcGxheSA9PT0gJ25vbmUnKSB7XG4gICAgICAgICAgICB0aGlzLl9kaWFnbm9zdGljcy5zdHlsZS5kaXNwbGF5ID0gJyc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuX3Byb2plY3RDb3VudC5wcm9qZWN0cy5zdHlsZS5kaXNwbGF5ID09PSAnbm9uZScpIHtcbiAgICAgICAgICAgIHRoaXMuX3Byb2plY3RDb3VudC5wcm9qZWN0cy5zdHlsZS5kaXNwbGF5ID0gJyc7XG4gICAgICAgIH1cbiAgICB9XG4gICAgX2hpZGVPblN0YXRlSXRlbXMoKSB7XG4gICAgICAgIGlmICh0aGlzLl9kaWFnbm9zdGljcy5zdHlsZS5kaXNwbGF5ICE9PSAnbm9uZScpIHtcbiAgICAgICAgICAgIHRoaXMuX2RpYWdub3N0aWNzLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuX3Byb2plY3RDb3VudC5wcm9qZWN0cy5zdHlsZS5kaXNwbGF5ICE9PSAnbm9uZScpIHtcbiAgICAgICAgICAgIHRoaXMuX3Byb2plY3RDb3VudC5wcm9qZWN0cy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICB9XG4gICAgfVxuICAgIGRldGFjaGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgIH1cbiAgICBkaXNwb3NlKCkge1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICB9XG4gICAgdG9nZ2xlKCkge1xuICAgICAgICBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSksICdvbW5pc2hhcnAtYXRvbTp0b2dnbGUtZG9jaycpO1xuICAgIH1cbiAgICB0b2dnbGVFcnJvcldhcm5pbmdQYW5lbCgpIHtcbiAgICAgICAgYXRvbS5jb21tYW5kcy5kaXNwYXRjaChhdG9tLnZpZXdzLmdldFZpZXcoYXRvbS53b3Jrc3BhY2UpLCAnb21uaXNoYXJwLWF0b206ZG9jay10b2dnbGUtZXJyb3JzJyk7XG4gICAgfVxuICAgIHRvZ2dsZVNvbHV0aW9uSW5mb3JtYXRpb24oKSB7XG4gICAgICAgIGF0b20uY29tbWFuZHMuZGlzcGF0Y2goYXRvbS52aWV3cy5nZXRWaWV3KGF0b20ud29ya3NwYWNlKSwgJ29tbmlzaGFycC1hdG9tOnNvbHV0aW9uLXN0YXR1cycpO1xuICAgIH1cbiAgICBkb0NvZGVDaGVjaygpIHtcbiAgICAgICAgYXRvbS5jb21tYW5kcy5kaXNwYXRjaChhdG9tLnZpZXdzLmdldFZpZXcoYXRvbS53b3Jrc3BhY2UpLCAnb21uaXNoYXJwLWF0b206Y29kZS1jaGVjaycpO1xuICAgIH1cbn1cbmV4cG9ydHMuU3RhdHVzQmFyRWxlbWVudCA9IGRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudCgnb21uaXNoYXJwLXN0YXR1cy1iYXInLCB7IHByb3RvdHlwZTogU3RhdHVzQmFyRWxlbWVudC5wcm90b3R5cGUgfSk7XG4iXX0=
