'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.SolutionStatusCard = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _omnisharpClient = require('omnisharp-client');

var _tsDisposables = require('ts-disposables');

var _path = require('path');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var $ = require('jquery');

function truncateStringReverse(str) {
    var maxLength = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 55;

    var reversedString = (0, _lodash.toArray)(str).reverse().join('');
    return (0, _lodash.toArray)((0, _lodash.truncate)(reversedString, maxLength)).reverse().join('');
}
var getMessageElement = function () {
    var projectProps = {
        get: function project() {
            return this._project;
        },
        set: function project(project) {
            this._project = project;
            this._key = project.path;
            var path = truncateStringReverse(project.path.replace(this.project.solutionPath, ''), 24);
            this.title = path + ' [' + project.frameworks.filter(function (z) {
                return z.Name !== 'all';
            }).map(function (x) {
                return x.FriendlyName;
            }) + ']';
            this.innerText = project.name;
        }
    };
    var keyProps = {
        get: function key() {
            return this._key;
        }
    };
    return function getMessageElement() {
        var element = document.createElement('div');
        element.classList.add('project', 'name');
        Object.defineProperty(element, 'project', projectProps);
        Object.defineProperty(element, 'key', keyProps);
        return element;
    };
}();

var SolutionStatusCard = exports.SolutionStatusCard = function (_HTMLDivElement) {
    _inherits(SolutionStatusCard, _HTMLDivElement);

    function SolutionStatusCard() {
        _classCallCheck(this, SolutionStatusCard);

        var _this = _possibleConstructorReturn(this, (SolutionStatusCard.__proto__ || Object.getPrototypeOf(SolutionStatusCard)).apply(this, arguments));

        _this.displayName = 'Card';
        return _this;
    }

    _createClass(SolutionStatusCard, [{
        key: '_getMetaControls',
        value: function _getMetaControls() {
            this._stopBtn = document.createElement('button');
            this._stopBtn.classList.add('btn', 'btn-xs', 'btn-error');
            this._stopBtn.onclick = function () {
                return atom.commands.dispatch(atom.views.getView(atom.workspace), 'omnisharp-atom:stop-server');
            };
            var span = document.createElement('span');
            span.classList.add('fa', 'fa-stop');
            this._stopBtn.appendChild(span);
            this._stopBtn.innerHTML += ' Stop';
            this._startBtn = document.createElement('button');
            this._startBtn.classList.add('btn', 'btn-xs', 'btn-success');
            this._startBtn.onclick = function () {
                return atom.commands.dispatch(atom.views.getView(atom.workspace), 'omnisharp-atom:start-server');
            };
            span = document.createElement('span');
            span.classList.add('fa', 'fa-play');
            this._startBtn.appendChild(span);
            this._startBtn.innerHTML += ' Start';
            this._restartBtn = document.createElement('button');
            this._restartBtn.classList.add('btn', 'btn-xs', 'btn-info');
            this._restartBtn.onclick = function () {
                return atom.commands.dispatch(atom.views.getView(atom.workspace), 'omnisharp-atom:restart-server');
            };
            span = document.createElement('span');
            span.classList.add('fa', 'fa-refresh');
            this._restartBtn.appendChild(span);
            this._restartBtn.innerHTML += ' Restart';
            var metaControls = document.createElement('div');
            metaControls.classList.add('meta-controls');
            var buttonGroup = document.createElement('div');
            buttonGroup.classList.add('btn-group');
            metaControls.appendChild(buttonGroup);
            buttonGroup.appendChild(this._startBtn);
            buttonGroup.appendChild(this._stopBtn);
            buttonGroup.appendChild(this._restartBtn);
            return metaControls;
        }
    }, {
        key: '_getStatusItem',
        value: function _getStatusItem() {
            this._statusItem = document.createElement('span');
            this._statusItem.classList.add('pull-left', 'stats-item');
            var statusContainer = document.createElement('span');
            this._statusItem.appendChild(statusContainer);
            var icon = document.createElement('span');
            statusContainer.appendChild(icon);
            icon.classList.add('icon', 'icon-zap');
            this._statusText = document.createElement('span');
            statusContainer.appendChild(this._statusText);
            return this._statusItem;
        }
    }, {
        key: '_getVersions',
        value: function _getVersions() {
            var versions = document.createElement('span');
            versions.classList.add('pull-right', 'stats-item');
            var spans = document.createElement('span');
            spans.classList.add('icon', 'icon-versions');
            versions.appendChild(spans);
            this._runtimeText = document.createElement('span');
            versions.appendChild(this._runtimeText);
            return versions;
        }
    }, {
        key: '_getBody',
        value: function _getBody() {
            var body = document.createElement('div');
            this._body = body;
            body.classList.add('body');
            var header = document.createElement('h4');
            header.classList.add('name');
            body.appendChild(header);
            this._name = document.createElement('span');
            header.appendChild(this._name);
            var versions = this._getVersions();
            body.appendChild(versions);
            var statusItem = this._getStatusItem();
            body.appendChild(statusItem);
            var metaControls = this._getMetaControls();
            body.appendChild(metaControls);
            return body;
        }
    }, {
        key: '_getProjects',
        value: function _getProjects() {
            this._projects = document.createElement('div');
            this._projects.classList.add('meta', 'meta-projects');
            var header = document.createElement('div');
            header.classList.add('header');
            header.innerText = 'Projects';
            return this._projects;
        }
    }, {
        key: '_getButtons',
        value: function _getButtons() {
            this._buttons = document.createElement('div');
            this._buttons.classList.add('selector', 'btn-group', 'btn-group-xs');
            var left = document.createElement('div');
            left.classList.add('btn', 'btn-xs', 'icon', 'icon-triangle-left');
            left.onclick = function (e) {
                return atom.commands.dispatch(atom.views.getView(atom.workspace), 'omnisharp-atom:previous-solution-status');
            };
            this._buttons.appendChild(left);
            var right = document.createElement('div');
            right.classList.add('btn', 'btn-xs', 'icon', 'icon-triangle-right');
            right.onclick = function (e) {
                return atom.commands.dispatch(atom.views.getView(atom.workspace), 'omnisharp-atom:next-solution-status');
            };
            this._buttons.appendChild(right);
            return this._buttons;
        }
    }, {
        key: 'createdCallback',
        value: function createdCallback() {
            this.modelDisposable = new _tsDisposables.CompositeDisposable();
            this.classList.add('omnisharp-card');
            this._getButtons();
            var body = this._getBody();
            this.appendChild(body);
            var projects = this._getProjects();
            this.appendChild(projects);
        }
    }, {
        key: 'attachedCallback',
        value: function attachedCallback() {
            this.verifyPosition();
        }
    }, {
        key: 'updateCard',
        value: function updateCard(model, count) {
            this.model = model;
            this.count = count;
        }
    }, {
        key: 'verifyPosition',
        value: function verifyPosition() {
            var offset = $(document.querySelectorAll(this.attachTo)).offset();
            if (offset) {
                $(this).css({
                    position: 'fixed',
                    top: offset.top - this.clientHeight,
                    left: offset.left
                });
            }
        }
    }, {
        key: 'count',
        get: function get() {
            return this._count;
        },
        set: function set(count) {
            if (this._count !== count) {
                this._count = count;
            }
            if (this._count > 1) {
                this._body.parentElement.insertBefore(this._buttons, this._body);
            } else {
                this._buttons.remove();
            }
        }
    }, {
        key: 'model',
        get: function get() {
            return this._model;
        },
        set: function set(model) {
            var _this2 = this;

            this._model = model;
            this.modelDisposable.dispose();
            this.modelDisposable = new _tsDisposables.CompositeDisposable();
            this.modelDisposable.add(this._model.observe.state.delay(10).subscribe(function (_ref) {
                var index = _ref.index,
                    path = _ref.path,
                    state = _ref.state,
                    isReady = _ref.isReady,
                    isOff = _ref.isOff,
                    isOn = _ref.isOn;

                var name = (0, _path.basename)(path) + ' (' + index + ')';
                if (_this2._name.innerText !== name) {
                    _this2._name.innerText = name;
                }
                if (state === _omnisharpClient.DriverState.Connected) {
                    _this2._statusText.innerText = 'Online';
                } else if (state === _omnisharpClient.DriverState.Connecting) {
                    _this2._statusText.innerText = 'Loading';
                } else if (state === _omnisharpClient.DriverState.Disconnected) {
                    _this2._statusText.innerText = 'Offline';
                } else {
                    _this2._statusText.innerText = _omnisharpClient.DriverState[state];
                }
                if (isReady) {
                    _this2._startBtn.style.display = 'none';
                    _this2._stopBtn.style.display = '';
                } else if (isOff) {
                    _this2._startBtn.style.display = '';
                    _this2._stopBtn.style.display = 'none';
                } else {
                    _this2._startBtn.style.display = 'none';
                    _this2._stopBtn.style.display = 'none';
                }
                if (isOn) {
                    _this2._restartBtn.style.display = '';
                } else {
                    _this2._restartBtn.style.display = 'none';
                }
                if (isOff) {
                    _this2._projects.style.display = 'none';
                } else {
                    _this2._projects.style.display = '';
                }
                _this2._statusItem.className = 'pull-left stats-item';
                _this2._statusItem.classList.add(_omnisharpClient.DriverState[state].toLowerCase());
                _this2.verifyPosition();
                _this2._runtimeText.style.display = 'none';
                _this2._runtimeText.innerText = '';
            }));
            this.modelDisposable.add(this._model.observe.projects.subscribe(function (projects) {
                for (var i = 0, len = _this2._projects.children.length > projects.length ? _this2._projects.children.length : projects.length; i < len; i++) {
                    var item = projects[i];
                    var child = _this2._projects.children[i];
                    if (!item && child) {
                        child.remove();
                        continue;
                    } else if (item && !child) {
                        child = getMessageElement();
                        _this2._projects.appendChild(child);
                    }
                    if (child && child.key !== item.path) {
                        child.project = item;
                    }
                }
                _this2.verifyPosition();
            }));
        }
    }]);

    return SolutionStatusCard;
}(HTMLDivElement);

exports.SolutionStatusCard = document.registerElement('omnisharp-solution-card', { prototype: SolutionStatusCard.prototype });
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy9zb2x1dGlvbi1zdGF0dXMtdmlldy50cyIsImxpYi92aWV3cy9zb2x1dGlvbi1zdGF0dXMtdmlldy5qcyJdLCJuYW1lcyI6WyIkIiwicmVxdWlyZSIsInRydW5jYXRlU3RyaW5nUmV2ZXJzZSIsInN0ciIsIm1heExlbmd0aCIsInJldmVyc2VkU3RyaW5nIiwicmV2ZXJzZSIsImpvaW4iLCJnZXRNZXNzYWdlRWxlbWVudCIsInByb2plY3RQcm9wcyIsImdldCIsInByb2plY3QiLCJfcHJvamVjdCIsInNldCIsIl9rZXkiLCJwYXRoIiwicmVwbGFjZSIsInNvbHV0aW9uUGF0aCIsInRpdGxlIiwiZnJhbWV3b3JrcyIsImZpbHRlciIsInoiLCJOYW1lIiwibWFwIiwieCIsIkZyaWVuZGx5TmFtZSIsImlubmVyVGV4dCIsIm5hbWUiLCJrZXlQcm9wcyIsImtleSIsImVsZW1lbnQiLCJkb2N1bWVudCIsImNyZWF0ZUVsZW1lbnQiLCJjbGFzc0xpc3QiLCJhZGQiLCJPYmplY3QiLCJkZWZpbmVQcm9wZXJ0eSIsIlNvbHV0aW9uU3RhdHVzQ2FyZCIsImFyZ3VtZW50cyIsImRpc3BsYXlOYW1lIiwiX3N0b3BCdG4iLCJvbmNsaWNrIiwiYXRvbSIsImNvbW1hbmRzIiwiZGlzcGF0Y2giLCJ2aWV3cyIsImdldFZpZXciLCJ3b3Jrc3BhY2UiLCJzcGFuIiwiYXBwZW5kQ2hpbGQiLCJpbm5lckhUTUwiLCJfc3RhcnRCdG4iLCJfcmVzdGFydEJ0biIsIm1ldGFDb250cm9scyIsImJ1dHRvbkdyb3VwIiwiX3N0YXR1c0l0ZW0iLCJzdGF0dXNDb250YWluZXIiLCJpY29uIiwiX3N0YXR1c1RleHQiLCJ2ZXJzaW9ucyIsInNwYW5zIiwiX3J1bnRpbWVUZXh0IiwiYm9keSIsIl9ib2R5IiwiaGVhZGVyIiwiX25hbWUiLCJfZ2V0VmVyc2lvbnMiLCJzdGF0dXNJdGVtIiwiX2dldFN0YXR1c0l0ZW0iLCJfZ2V0TWV0YUNvbnRyb2xzIiwiX3Byb2plY3RzIiwiX2J1dHRvbnMiLCJsZWZ0IiwicmlnaHQiLCJtb2RlbERpc3Bvc2FibGUiLCJfZ2V0QnV0dG9ucyIsIl9nZXRCb2R5IiwicHJvamVjdHMiLCJfZ2V0UHJvamVjdHMiLCJ2ZXJpZnlQb3NpdGlvbiIsIm1vZGVsIiwiY291bnQiLCJvZmZzZXQiLCJxdWVyeVNlbGVjdG9yQWxsIiwiYXR0YWNoVG8iLCJjc3MiLCJwb3NpdGlvbiIsInRvcCIsImNsaWVudEhlaWdodCIsIl9jb3VudCIsInBhcmVudEVsZW1lbnQiLCJpbnNlcnRCZWZvcmUiLCJyZW1vdmUiLCJfbW9kZWwiLCJkaXNwb3NlIiwib2JzZXJ2ZSIsInN0YXRlIiwiZGVsYXkiLCJzdWJzY3JpYmUiLCJpbmRleCIsImlzUmVhZHkiLCJpc09mZiIsImlzT24iLCJDb25uZWN0ZWQiLCJDb25uZWN0aW5nIiwiRGlzY29ubmVjdGVkIiwic3R5bGUiLCJkaXNwbGF5IiwiY2xhc3NOYW1lIiwidG9Mb3dlckNhc2UiLCJpIiwibGVuIiwiY2hpbGRyZW4iLCJsZW5ndGgiLCJpdGVtIiwiY2hpbGQiLCJIVE1MRGl2RWxlbWVudCIsImV4cG9ydHMiLCJyZWdpc3RlckVsZW1lbnQiLCJwcm90b3R5cGUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQUNBOztBQUNBOztBQUlBOzs7Ozs7OztBQURBLElBQU1BLElBQWtCQyxRQUFRLFFBQVIsQ0FBeEI7O0FBR0EsU0FBQUMscUJBQUEsQ0FBK0JDLEdBQS9CLEVBQTBEO0FBQUEsUUFBZEMsU0FBYyx1RUFBRixFQUFFOztBQUN0RCxRQUFNQyxpQkFBaUIscUJBQVFGLEdBQVIsRUFBYUcsT0FBYixHQUF1QkMsSUFBdkIsQ0FBNEIsRUFBNUIsQ0FBdkI7QUFDQSxXQUFPLHFCQUFRLHNCQUFTRixjQUFULEVBQXlCRCxTQUF6QixDQUFSLEVBQTZDRSxPQUE3QyxHQUF1REMsSUFBdkQsQ0FBNEQsRUFBNUQsQ0FBUDtBQUNIO0FBUUQsSUFBTUMsb0JBQXFCLFlBQUE7QUFDdkIsUUFBTUMsZUFBZTtBQUNqQkMsYUFBSyxTQUFB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SzJELE1BQUwsQ0FBWUUsT0FBWixDQUFvQmxCLFFBQXBCLENBQTZCcUIsU0FBN0IsQ0FBdUMsb0JBQVE7QUFDcEUscUJBQUssSUFBSVksSUFBSSxDQUFSLEVBQVdDLE1BQU0sT0FBS3pDLFNBQUwsQ0FBZTBDLFFBQWYsQ0FBd0JDLE1BQXhCLEdBQWlDcEMsU0FBU29DLE1BQTFDLEdBQW1ELE9BQUszQyxTQUFMLENBQWUwQyxRQUFmLENBQXdCQyxNQUEzRSxHQUFvRnBDLFNBQVNvQyxNQUFuSCxFQUEySEgsSUFBSUMsR0FBL0gsRUFBb0lELEdBQXBJLEVBQXlJO0FBQ3JJLHdCQUFNSSxPQUFPckMsU0FBU2lDLENBQVQsQ0FBYjtBQUNBLHdCQUFJSyxRQUFvQyxPQUFLN0MsU0FBTCxDQUFlMEMsUUFBZixDQUF3QkYsQ0FBeEIsQ0FBeEM7QUFFQSx3QkFBSSxDQUFDSSxJQUFELElBQVNDLEtBQWIsRUFBb0I7QUFDaEJBLDhCQUFNdkIsTUFBTjtBQUNBO0FBQ0gscUJBSEQsTUFHTyxJQUFJc0IsUUFBUSxDQUFDQyxLQUFiLEVBQW9CO0FBQ3ZCQSxnQ0FBUTNHLG1CQUFSO0FBQ0EsK0JBQUs4RCxTQUFMLENBQWVyQixXQUFmLENBQTJCa0UsS0FBM0I7QUFDSDtBQUVELHdCQUFJQSxTQUFTQSxNQUFNdEYsR0FBTixLQUFjcUYsS0FBS25HLElBQWhDLEVBQXNDO0FBQ2xDb0csOEJBQU14RyxPQUFOLEdBQWdCdUcsSUFBaEI7QUFDSDtBQUNKO0FBRUQsdUJBQUtuQyxjQUFMO0FBQ0gsYUFuQndCLENBQXpCO0FBb0JIOzs7O0VBakhtQ3FDLGM7O0FBa1JsQ0MsUUFBU2hGLGtCQUFULEdBQW9DTixTQUFVdUYsZUFBVixDQUEwQix5QkFBMUIsRUFBcUQsRUFBRUMsV0FBV2xGLG1CQUFtQmtGLFNBQWhDLEVBQXJELENBQXBDIiwiZmlsZSI6ImxpYi92aWV3cy9zb2x1dGlvbi1zdGF0dXMtdmlldy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHRvQXJyYXksIHRydW5jYXRlIH0gZnJvbSAnbG9kYXNoJztcclxuaW1wb3J0IHsgRHJpdmVyU3RhdGUgfSBmcm9tICdvbW5pc2hhcnAtY2xpZW50JztcclxuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSB9IGZyb20gJ3RzLWRpc3Bvc2FibGVzJztcclxuaW1wb3J0IHsgUHJvamVjdFZpZXdNb2RlbCB9IGZyb20gJy4uL3NlcnZlci9wcm9qZWN0LXZpZXctbW9kZWwnO1xyXG5pbXBvcnQgeyBWaWV3TW9kZWwgfSBmcm9tICcuLi9zZXJ2ZXIvdmlldy1tb2RlbCc7XHJcbmNvbnN0ICQ6IEpRdWVyeVN0YXRpYyA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5pbXBvcnQgeyBiYXNlbmFtZSB9IGZyb20gJ3BhdGgnO1xyXG5cclxuZnVuY3Rpb24gdHJ1bmNhdGVTdHJpbmdSZXZlcnNlKHN0cjogc3RyaW5nLCBtYXhMZW5ndGggPSA1NSkge1xyXG4gICAgY29uc3QgcmV2ZXJzZWRTdHJpbmcgPSB0b0FycmF5KHN0cikucmV2ZXJzZSgpLmpvaW4oJycpO1xyXG4gICAgcmV0dXJuIHRvQXJyYXkodHJ1bmNhdGUocmV2ZXJzZWRTdHJpbmcsIG1heExlbmd0aCkpLnJldmVyc2UoKS5qb2luKCcnKTtcclxufVxyXG5cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgUHJvamVjdERpc3BsYXlFbGVtZW50IGV4dGVuZHMgSFRNTERpdkVsZW1lbnQge1xyXG4gICAgcHJvamVjdDogUHJvamVjdFZpZXdNb2RlbDxhbnk+O1xyXG4gICAga2V5OiBzdHJpbmc7XHJcbn1cclxuXHJcbmNvbnN0IGdldE1lc3NhZ2VFbGVtZW50ID0gKGZ1bmN0aW9uICgpIHtcclxuICAgIGNvbnN0IHByb2plY3RQcm9wcyA9IHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uIHByb2plY3QoKSB7IHJldHVybiB0aGlzLl9wcm9qZWN0OyB9LFxyXG4gICAgICAgIHNldDogZnVuY3Rpb24gcHJvamVjdChwcm9qZWN0OiBQcm9qZWN0Vmlld01vZGVsPGFueT4pIHtcclxuICAgICAgICAgICAgdGhpcy5fcHJvamVjdCA9IHByb2plY3Q7XHJcbiAgICAgICAgICAgIHRoaXMuX2tleSA9IHByb2plY3QucGF0aDtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IHBhdGggPSB0cnVuY2F0ZVN0cmluZ1JldmVyc2UocHJvamVjdC5wYXRoLnJlcGxhY2UodGhpcy5wcm9qZWN0LnNvbHV0aW9uUGF0aCwgJycpLCAyNCk7XHJcbiAgICAgICAgICAgIHRoaXMudGl0bGUgPSBgJHtwYXRofSBbJHtwcm9qZWN0LmZyYW1ld29ya3MuZmlsdGVyKHogPT4gei5OYW1lICE9PSAnYWxsJykubWFwKHggPT4geC5GcmllbmRseU5hbWUpfV1gO1xyXG4gICAgICAgICAgICB0aGlzLmlubmVyVGV4dCA9IHByb2plY3QubmFtZTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIGNvbnN0IGtleVByb3BzID0ge1xyXG4gICAgICAgIGdldDogZnVuY3Rpb24ga2V5KCkgeyByZXR1cm4gdGhpcy5fa2V5OyB9XHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiBmdW5jdGlvbiBnZXRNZXNzYWdlRWxlbWVudCgpOiBQcm9qZWN0RGlzcGxheUVsZW1lbnQge1xyXG4gICAgICAgIGNvbnN0IGVsZW1lbnQ6IFByb2plY3REaXNwbGF5RWxlbWVudCA9IDxhbnk+ZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkKCdwcm9qZWN0JywgJ25hbWUnKTtcclxuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZWxlbWVudCwgJ3Byb2plY3QnLCBwcm9qZWN0UHJvcHMpO1xyXG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShlbGVtZW50LCAna2V5Jywga2V5UHJvcHMpO1xyXG5cclxuICAgICAgICByZXR1cm4gZWxlbWVudDtcclxuICAgIH07XHJcbn0pKCk7XHJcblxyXG5leHBvcnQgY2xhc3MgU29sdXRpb25TdGF0dXNDYXJkIGV4dGVuZHMgSFRNTERpdkVsZW1lbnQgaW1wbGVtZW50cyBXZWJDb21wb25lbnQge1xyXG4gICAgcHVibGljIGRpc3BsYXlOYW1lID0gJ0NhcmQnO1xyXG5cclxuICAgIHByaXZhdGUgbW9kZWxEaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xyXG4gICAgcHVibGljIGF0dGFjaFRvOiBzdHJpbmc7XHJcblxyXG4gICAgcHJpdmF0ZSBfbmFtZTogSFRNTFNwYW5FbGVtZW50O1xyXG4gICAgcHJpdmF0ZSBfcHJvamVjdHM6IEhUTUxEaXZFbGVtZW50O1xyXG4gICAgcHJpdmF0ZSBfYnV0dG9uczogSFRNTERpdkVsZW1lbnQ7XHJcbiAgICBwcml2YXRlIF9ib2R5OiBIVE1MRWxlbWVudDtcclxuXHJcbiAgICBwcml2YXRlIF9zdG9wQnRuOiBIVE1MQnV0dG9uRWxlbWVudDtcclxuICAgIHByaXZhdGUgX3N0YXJ0QnRuOiBIVE1MQnV0dG9uRWxlbWVudDtcclxuICAgIHByaXZhdGUgX3Jlc3RhcnRCdG46IEhUTUxCdXR0b25FbGVtZW50O1xyXG5cclxuICAgIHByaXZhdGUgX3N0YXR1c0l0ZW06IEhUTUxTcGFuRWxlbWVudDtcclxuICAgIHByaXZhdGUgX3N0YXR1c1RleHQ6IEhUTUxTcGFuRWxlbWVudDtcclxuICAgIHByaXZhdGUgX3J1bnRpbWVUZXh0OiBIVE1MU3BhbkVsZW1lbnQ7XHJcblxyXG4gICAgcHJpdmF0ZSBfY291bnQ6IG51bWJlcjtcclxuICAgIHB1YmxpYyBnZXQgY291bnQoKSB7IHJldHVybiB0aGlzLl9jb3VudDsgfVxyXG4gICAgcHVibGljIHNldCBjb3VudChjb3VudCkge1xyXG4gICAgICAgIGlmICh0aGlzLl9jb3VudCAhPT0gY291bnQpIHtcclxuICAgICAgICAgICAgdGhpcy5fY291bnQgPSBjb3VudDtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMuX2NvdW50ID4gMSkge1xyXG4gICAgICAgICAgICB0aGlzLl9ib2R5LnBhcmVudEVsZW1lbnQuaW5zZXJ0QmVmb3JlKHRoaXMuX2J1dHRvbnMsIHRoaXMuX2JvZHkpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2J1dHRvbnMucmVtb3ZlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX21vZGVsOiBWaWV3TW9kZWw7XHJcbiAgICBwdWJsaWMgZ2V0IG1vZGVsKCkgeyByZXR1cm4gdGhpcy5fbW9kZWw7IH1cclxuICAgIHB1YmxpYyBzZXQgbW9kZWwobW9kZWwpIHtcclxuICAgICAgICB0aGlzLl9tb2RlbCA9IG1vZGVsO1xyXG4gICAgICAgIHRoaXMubW9kZWxEaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgICAgICB0aGlzLm1vZGVsRGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcblxyXG4gICAgICAgIHRoaXMubW9kZWxEaXNwb3NhYmxlLmFkZCh0aGlzLl9tb2RlbC5vYnNlcnZlLnN0YXRlLmRlbGF5KDEwKS5zdWJzY3JpYmUoKHtpbmRleCwgcGF0aCwgLypydW50aW1lLCovIHN0YXRlLCBpc1JlYWR5LCBpc09mZiwgaXNPbn0pID0+IHtcclxuICAgICAgICAgICAgY29uc3QgbmFtZSA9IGAke2Jhc2VuYW1lKHBhdGgpfSAoJHtpbmRleH0pYDtcclxuICAgICAgICAgICAgaWYgKHRoaXMuX25hbWUuaW5uZXJUZXh0ICE9PSBuYW1lKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9uYW1lLmlubmVyVGV4dCA9IG5hbWU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChzdGF0ZSA9PT0gRHJpdmVyU3RhdGUuQ29ubmVjdGVkKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9zdGF0dXNUZXh0LmlubmVyVGV4dCA9ICdPbmxpbmUnO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHN0YXRlID09PSBEcml2ZXJTdGF0ZS5Db25uZWN0aW5nKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9zdGF0dXNUZXh0LmlubmVyVGV4dCA9ICdMb2FkaW5nJztcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChzdGF0ZSA9PT0gRHJpdmVyU3RhdGUuRGlzY29ubmVjdGVkKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9zdGF0dXNUZXh0LmlubmVyVGV4dCA9ICdPZmZsaW5lJztcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX3N0YXR1c1RleHQuaW5uZXJUZXh0ID0gRHJpdmVyU3RhdGVbc3RhdGVdO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoaXNSZWFkeSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fc3RhcnRCdG4uc3R5bGUuZGlzcGxheSA9ICdub25lJztcclxuICAgICAgICAgICAgICAgIHRoaXMuX3N0b3BCdG4uc3R5bGUuZGlzcGxheSA9ICcnO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGlzT2ZmKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9zdGFydEJ0bi5zdHlsZS5kaXNwbGF5ID0gJyc7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9zdG9wQnRuLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9zdGFydEJ0bi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fc3RvcEJ0bi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoaXNPbikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fcmVzdGFydEJ0bi5zdHlsZS5kaXNwbGF5ID0gJyc7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9yZXN0YXJ0QnRuLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChpc09mZikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fcHJvamVjdHMuc3R5bGUuZGlzcGxheSA9ICdub25lJztcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX3Byb2plY3RzLnN0eWxlLmRpc3BsYXkgPSAnJztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy90aGlzLl9zdGF0dXNUZXh0LmlubmVyVGV4dCA9IERyaXZlclN0YXRlW3N0YXRlXTtcclxuICAgICAgICAgICAgdGhpcy5fc3RhdHVzSXRlbS5jbGFzc05hbWUgPSAncHVsbC1sZWZ0IHN0YXRzLWl0ZW0nO1xyXG4gICAgICAgICAgICB0aGlzLl9zdGF0dXNJdGVtLmNsYXNzTGlzdC5hZGQoRHJpdmVyU3RhdGVbc3RhdGVdLnRvTG93ZXJDYXNlKCkpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy52ZXJpZnlQb3NpdGlvbigpO1xyXG5cclxuICAgICAgICAgICAgLyppZiAocnVudGltZSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fcnVudGltZVRleHQuc3R5bGUuZGlzcGxheSA9IFwiXCI7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9ydW50aW1lVGV4dC5pbm5lclRleHQgPSBydW50aW1lO1xyXG4gICAgICAgICAgICB9IGVsc2UgeyovXHJcbiAgICAgICAgICAgIHRoaXMuX3J1bnRpbWVUZXh0LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XHJcbiAgICAgICAgICAgIHRoaXMuX3J1bnRpbWVUZXh0LmlubmVyVGV4dCA9ICcnO1xyXG4gICAgICAgICAgICAvKn0qL1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5tb2RlbERpc3Bvc2FibGUuYWRkKHRoaXMuX21vZGVsLm9ic2VydmUucHJvamVjdHMuc3Vic2NyaWJlKHByb2plY3RzID0+IHtcclxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDAsIGxlbiA9IHRoaXMuX3Byb2plY3RzLmNoaWxkcmVuLmxlbmd0aCA+IHByb2plY3RzLmxlbmd0aCA/IHRoaXMuX3Byb2plY3RzLmNoaWxkcmVuLmxlbmd0aCA6IHByb2plY3RzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtID0gcHJvamVjdHNbaV07XHJcbiAgICAgICAgICAgICAgICBsZXQgY2hpbGQ6IFByb2plY3REaXNwbGF5RWxlbWVudCA9IDxhbnk+dGhpcy5fcHJvamVjdHMuY2hpbGRyZW5baV07XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCFpdGVtICYmIGNoaWxkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2hpbGQucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGl0ZW0gJiYgIWNoaWxkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2hpbGQgPSBnZXRNZXNzYWdlRWxlbWVudCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Byb2plY3RzLmFwcGVuZENoaWxkKGNoaWxkKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoY2hpbGQgJiYgY2hpbGQua2V5ICE9PSBpdGVtLnBhdGgpIHtcclxuICAgICAgICAgICAgICAgICAgICBjaGlsZC5wcm9qZWN0ID0gaXRlbTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy52ZXJpZnlQb3NpdGlvbigpO1xyXG4gICAgICAgIH0pKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9nZXRNZXRhQ29udHJvbHMoKSB7XHJcbiAgICAgICAgdGhpcy5fc3RvcEJ0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpO1xyXG4gICAgICAgIHRoaXMuX3N0b3BCdG4uY2xhc3NMaXN0LmFkZCgnYnRuJywgJ2J0bi14cycsICdidG4tZXJyb3InKTtcclxuICAgICAgICB0aGlzLl9zdG9wQnRuLm9uY2xpY2sgPSAoKSA9PiBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSksICdvbW5pc2hhcnAtYXRvbTpzdG9wLXNlcnZlcicpO1xyXG5cclxuICAgICAgICBsZXQgc3BhbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcclxuICAgICAgICBzcGFuLmNsYXNzTGlzdC5hZGQoJ2ZhJywgJ2ZhLXN0b3AnKTtcclxuICAgICAgICB0aGlzLl9zdG9wQnRuLmFwcGVuZENoaWxkKHNwYW4pO1xyXG4gICAgICAgIHRoaXMuX3N0b3BCdG4uaW5uZXJIVE1MICs9ICcgU3RvcCc7XHJcblxyXG4gICAgICAgIHRoaXMuX3N0YXJ0QnRuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJyk7XHJcbiAgICAgICAgdGhpcy5fc3RhcnRCdG4uY2xhc3NMaXN0LmFkZCgnYnRuJywgJ2J0bi14cycsICdidG4tc3VjY2VzcycpO1xyXG4gICAgICAgIHRoaXMuX3N0YXJ0QnRuLm9uY2xpY2sgPSAoKSA9PiBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSksICdvbW5pc2hhcnAtYXRvbTpzdGFydC1zZXJ2ZXInKTtcclxuXHJcbiAgICAgICAgc3BhbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcclxuICAgICAgICBzcGFuLmNsYXNzTGlzdC5hZGQoJ2ZhJywgJ2ZhLXBsYXknKTtcclxuICAgICAgICB0aGlzLl9zdGFydEJ0bi5hcHBlbmRDaGlsZChzcGFuKTtcclxuICAgICAgICB0aGlzLl9zdGFydEJ0bi5pbm5lckhUTUwgKz0gJyBTdGFydCc7XHJcblxyXG4gICAgICAgIHRoaXMuX3Jlc3RhcnRCdG4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdidXR0b24nKTtcclxuICAgICAgICB0aGlzLl9yZXN0YXJ0QnRuLmNsYXNzTGlzdC5hZGQoJ2J0bicsICdidG4teHMnLCAnYnRuLWluZm8nKTtcclxuICAgICAgICB0aGlzLl9yZXN0YXJ0QnRuLm9uY2xpY2sgPSAoKSA9PiBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSksICdvbW5pc2hhcnAtYXRvbTpyZXN0YXJ0LXNlcnZlcicpO1xyXG5cclxuICAgICAgICBzcGFuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xyXG4gICAgICAgIHNwYW4uY2xhc3NMaXN0LmFkZCgnZmEnLCAnZmEtcmVmcmVzaCcpO1xyXG4gICAgICAgIHRoaXMuX3Jlc3RhcnRCdG4uYXBwZW5kQ2hpbGQoc3Bhbik7XHJcbiAgICAgICAgdGhpcy5fcmVzdGFydEJ0bi5pbm5lckhUTUwgKz0gJyBSZXN0YXJ0JztcclxuXHJcbiAgICAgICAgY29uc3QgbWV0YUNvbnRyb2xzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICAgICAgbWV0YUNvbnRyb2xzLmNsYXNzTGlzdC5hZGQoJ21ldGEtY29udHJvbHMnKTtcclxuXHJcbiAgICAgICAgY29uc3QgYnV0dG9uR3JvdXAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgICBidXR0b25Hcm91cC5jbGFzc0xpc3QuYWRkKCdidG4tZ3JvdXAnKTtcclxuICAgICAgICBtZXRhQ29udHJvbHMuYXBwZW5kQ2hpbGQoYnV0dG9uR3JvdXApO1xyXG5cclxuICAgICAgICBidXR0b25Hcm91cC5hcHBlbmRDaGlsZCh0aGlzLl9zdGFydEJ0bik7XHJcbiAgICAgICAgYnV0dG9uR3JvdXAuYXBwZW5kQ2hpbGQodGhpcy5fc3RvcEJ0bik7XHJcbiAgICAgICAgYnV0dG9uR3JvdXAuYXBwZW5kQ2hpbGQodGhpcy5fcmVzdGFydEJ0bik7XHJcblxyXG4gICAgICAgIHJldHVybiBtZXRhQ29udHJvbHM7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfZ2V0U3RhdHVzSXRlbSgpIHtcclxuICAgICAgICB0aGlzLl9zdGF0dXNJdGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xyXG4gICAgICAgIHRoaXMuX3N0YXR1c0l0ZW0uY2xhc3NMaXN0LmFkZCgncHVsbC1sZWZ0JywgJ3N0YXRzLWl0ZW0nKTtcclxuXHJcbiAgICAgICAgY29uc3Qgc3RhdHVzQ29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xyXG4gICAgICAgIHRoaXMuX3N0YXR1c0l0ZW0uYXBwZW5kQ2hpbGQoc3RhdHVzQ29udGFpbmVyKTtcclxuICAgICAgICBjb25zdCBpY29uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xyXG4gICAgICAgIHN0YXR1c0NvbnRhaW5lci5hcHBlbmRDaGlsZChpY29uKTtcclxuICAgICAgICBpY29uLmNsYXNzTGlzdC5hZGQoJ2ljb24nLCAnaWNvbi16YXAnKTtcclxuXHJcbiAgICAgICAgdGhpcy5fc3RhdHVzVGV4dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcclxuICAgICAgICBzdGF0dXNDb250YWluZXIuYXBwZW5kQ2hpbGQodGhpcy5fc3RhdHVzVGV4dCk7XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzLl9zdGF0dXNJdGVtO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX2dldFZlcnNpb25zKCkge1xyXG4gICAgICAgIGNvbnN0IHZlcnNpb25zID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xyXG4gICAgICAgIHZlcnNpb25zLmNsYXNzTGlzdC5hZGQoJ3B1bGwtcmlnaHQnLCAnc3RhdHMtaXRlbScpO1xyXG5cclxuICAgICAgICBjb25zdCBzcGFucyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcclxuICAgICAgICBzcGFucy5jbGFzc0xpc3QuYWRkKCdpY29uJywgJ2ljb24tdmVyc2lvbnMnKTtcclxuICAgICAgICB2ZXJzaW9ucy5hcHBlbmRDaGlsZChzcGFucyk7XHJcblxyXG4gICAgICAgIHRoaXMuX3J1bnRpbWVUZXh0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xyXG4gICAgICAgIHZlcnNpb25zLmFwcGVuZENoaWxkKHRoaXMuX3J1bnRpbWVUZXh0KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHZlcnNpb25zO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX2dldEJvZHkoKSB7XHJcbiAgICAgICAgY29uc3QgYm9keSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICAgIHRoaXMuX2JvZHkgPSBib2R5O1xyXG4gICAgICAgIGJvZHkuY2xhc3NMaXN0LmFkZCgnYm9keScpO1xyXG5cclxuICAgICAgICBjb25zdCBoZWFkZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdoNCcpO1xyXG4gICAgICAgIGhlYWRlci5jbGFzc0xpc3QuYWRkKCduYW1lJyk7XHJcbiAgICAgICAgYm9keS5hcHBlbmRDaGlsZChoZWFkZXIpO1xyXG5cclxuICAgICAgICB0aGlzLl9uYW1lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xyXG4gICAgICAgIGhlYWRlci5hcHBlbmRDaGlsZCh0aGlzLl9uYW1lKTtcclxuXHJcbiAgICAgICAgY29uc3QgdmVyc2lvbnMgPSB0aGlzLl9nZXRWZXJzaW9ucygpO1xyXG4gICAgICAgIGJvZHkuYXBwZW5kQ2hpbGQodmVyc2lvbnMpO1xyXG5cclxuICAgICAgICBjb25zdCBzdGF0dXNJdGVtID0gdGhpcy5fZ2V0U3RhdHVzSXRlbSgpO1xyXG4gICAgICAgIGJvZHkuYXBwZW5kQ2hpbGQoc3RhdHVzSXRlbSk7XHJcblxyXG4gICAgICAgIGNvbnN0IG1ldGFDb250cm9scyA9IHRoaXMuX2dldE1ldGFDb250cm9scygpO1xyXG4gICAgICAgIGJvZHkuYXBwZW5kQ2hpbGQobWV0YUNvbnRyb2xzKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGJvZHk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfZ2V0UHJvamVjdHMoKSB7XHJcbiAgICAgICAgdGhpcy5fcHJvamVjdHMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgICB0aGlzLl9wcm9qZWN0cy5jbGFzc0xpc3QuYWRkKCdtZXRhJywgJ21ldGEtcHJvamVjdHMnKTtcclxuXHJcbiAgICAgICAgY29uc3QgaGVhZGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICAgICAgaGVhZGVyLmNsYXNzTGlzdC5hZGQoJ2hlYWRlcicpO1xyXG4gICAgICAgIGhlYWRlci5pbm5lclRleHQgPSAnUHJvamVjdHMnO1xyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy5fcHJvamVjdHM7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfZ2V0QnV0dG9ucygpIHtcclxuICAgICAgICB0aGlzLl9idXR0b25zID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICAgICAgdGhpcy5fYnV0dG9ucy5jbGFzc0xpc3QuYWRkKCdzZWxlY3RvcicsICdidG4tZ3JvdXAnLCAnYnRuLWdyb3VwLXhzJyk7XHJcblxyXG4gICAgICAgIGNvbnN0IGxlZnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgICBsZWZ0LmNsYXNzTGlzdC5hZGQoJ2J0bicsICdidG4teHMnLCAnaWNvbicsICdpY29uLXRyaWFuZ2xlLWxlZnQnKTtcclxuICAgICAgICBsZWZ0Lm9uY2xpY2sgPSBlID0+IGF0b20uY29tbWFuZHMuZGlzcGF0Y2goYXRvbS52aWV3cy5nZXRWaWV3KGF0b20ud29ya3NwYWNlKSwgJ29tbmlzaGFycC1hdG9tOnByZXZpb3VzLXNvbHV0aW9uLXN0YXR1cycpO1xyXG4gICAgICAgIHRoaXMuX2J1dHRvbnMuYXBwZW5kQ2hpbGQobGVmdCk7XHJcblxyXG4gICAgICAgIGNvbnN0IHJpZ2h0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICAgICAgcmlnaHQuY2xhc3NMaXN0LmFkZCgnYnRuJywgJ2J0bi14cycsICdpY29uJywgJ2ljb24tdHJpYW5nbGUtcmlnaHQnKTtcclxuICAgICAgICByaWdodC5vbmNsaWNrID0gZSA9PiBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSksICdvbW5pc2hhcnAtYXRvbTpuZXh0LXNvbHV0aW9uLXN0YXR1cycpO1xyXG4gICAgICAgIHRoaXMuX2J1dHRvbnMuYXBwZW5kQ2hpbGQocmlnaHQpO1xyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy5fYnV0dG9ucztcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgY3JlYXRlZENhbGxiYWNrKCkge1xyXG4gICAgICAgIHRoaXMubW9kZWxEaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuXHJcbiAgICAgICAgdGhpcy5jbGFzc0xpc3QuYWRkKCdvbW5pc2hhcnAtY2FyZCcpO1xyXG5cclxuICAgICAgICB0aGlzLl9nZXRCdXR0b25zKCk7XHJcblxyXG4gICAgICAgIGNvbnN0IGJvZHkgPSB0aGlzLl9nZXRCb2R5KCk7XHJcbiAgICAgICAgdGhpcy5hcHBlbmRDaGlsZChib2R5KTtcclxuXHJcbiAgICAgICAgY29uc3QgcHJvamVjdHMgPSB0aGlzLl9nZXRQcm9qZWN0cygpO1xyXG4gICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQocHJvamVjdHMpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBhdHRhY2hlZENhbGxiYWNrKCkge1xyXG4gICAgICAgIHRoaXMudmVyaWZ5UG9zaXRpb24oKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgdXBkYXRlQ2FyZChtb2RlbDogVmlld01vZGVsLCBjb3VudDogbnVtYmVyKSB7XHJcbiAgICAgICAgdGhpcy5tb2RlbCA9IG1vZGVsO1xyXG4gICAgICAgIHRoaXMuY291bnQgPSBjb3VudDtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHZlcmlmeVBvc2l0aW9uKCkge1xyXG4gICAgICAgIGNvbnN0IG9mZnNldCA9ICQoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCh0aGlzLmF0dGFjaFRvKSkub2Zmc2V0KCk7XHJcbiAgICAgICAgaWYgKG9mZnNldCkge1xyXG4gICAgICAgICAgICAkKHRoaXMpLmNzcyh7XHJcbiAgICAgICAgICAgICAgICBwb3NpdGlvbjogJ2ZpeGVkJyxcclxuICAgICAgICAgICAgICAgIHRvcDogb2Zmc2V0LnRvcCAtIHRoaXMuY2xpZW50SGVpZ2h0LFxyXG4gICAgICAgICAgICAgICAgbGVmdDogb2Zmc2V0LmxlZnRcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG4oPGFueT5leHBvcnRzKS5Tb2x1dGlvblN0YXR1c0NhcmQgPSAoPGFueT5kb2N1bWVudCkucmVnaXN0ZXJFbGVtZW50KCdvbW5pc2hhcnAtc29sdXRpb24tY2FyZCcsIHsgcHJvdG90eXBlOiBTb2x1dGlvblN0YXR1c0NhcmQucHJvdG90eXBlIH0pO1xyXG4iLCJpbXBvcnQgeyB0b0FycmF5LCB0cnVuY2F0ZSB9IGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgeyBEcml2ZXJTdGF0ZSB9IGZyb20gJ29tbmlzaGFycC1jbGllbnQnO1xuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSB9IGZyb20gJ3RzLWRpc3Bvc2FibGVzJztcbmNvbnN0ICQgPSByZXF1aXJlKCdqcXVlcnknKTtcbmltcG9ydCB7IGJhc2VuYW1lIH0gZnJvbSAncGF0aCc7XG5mdW5jdGlvbiB0cnVuY2F0ZVN0cmluZ1JldmVyc2Uoc3RyLCBtYXhMZW5ndGggPSA1NSkge1xuICAgIGNvbnN0IHJldmVyc2VkU3RyaW5nID0gdG9BcnJheShzdHIpLnJldmVyc2UoKS5qb2luKCcnKTtcbiAgICByZXR1cm4gdG9BcnJheSh0cnVuY2F0ZShyZXZlcnNlZFN0cmluZywgbWF4TGVuZ3RoKSkucmV2ZXJzZSgpLmpvaW4oJycpO1xufVxuY29uc3QgZ2V0TWVzc2FnZUVsZW1lbnQgPSAoZnVuY3Rpb24gKCkge1xuICAgIGNvbnN0IHByb2plY3RQcm9wcyA9IHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiBwcm9qZWN0KCkgeyByZXR1cm4gdGhpcy5fcHJvamVjdDsgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiBwcm9qZWN0KHByb2plY3QpIHtcbiAgICAgICAgICAgIHRoaXMuX3Byb2plY3QgPSBwcm9qZWN0O1xuICAgICAgICAgICAgdGhpcy5fa2V5ID0gcHJvamVjdC5wYXRoO1xuICAgICAgICAgICAgY29uc3QgcGF0aCA9IHRydW5jYXRlU3RyaW5nUmV2ZXJzZShwcm9qZWN0LnBhdGgucmVwbGFjZSh0aGlzLnByb2plY3Quc29sdXRpb25QYXRoLCAnJyksIDI0KTtcbiAgICAgICAgICAgIHRoaXMudGl0bGUgPSBgJHtwYXRofSBbJHtwcm9qZWN0LmZyYW1ld29ya3MuZmlsdGVyKHogPT4gei5OYW1lICE9PSAnYWxsJykubWFwKHggPT4geC5GcmllbmRseU5hbWUpfV1gO1xuICAgICAgICAgICAgdGhpcy5pbm5lclRleHQgPSBwcm9qZWN0Lm5hbWU7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIGNvbnN0IGtleVByb3BzID0ge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uIGtleSgpIHsgcmV0dXJuIHRoaXMuX2tleTsgfVxuICAgIH07XG4gICAgcmV0dXJuIGZ1bmN0aW9uIGdldE1lc3NhZ2VFbGVtZW50KCkge1xuICAgICAgICBjb25zdCBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZCgncHJvamVjdCcsICduYW1lJyk7XG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShlbGVtZW50LCAncHJvamVjdCcsIHByb2plY3RQcm9wcyk7XG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShlbGVtZW50LCAna2V5Jywga2V5UHJvcHMpO1xuICAgICAgICByZXR1cm4gZWxlbWVudDtcbiAgICB9O1xufSkoKTtcbmV4cG9ydCBjbGFzcyBTb2x1dGlvblN0YXR1c0NhcmQgZXh0ZW5kcyBIVE1MRGl2RWxlbWVudCB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKC4uLmFyZ3VtZW50cyk7XG4gICAgICAgIHRoaXMuZGlzcGxheU5hbWUgPSAnQ2FyZCc7XG4gICAgfVxuICAgIGdldCBjb3VudCgpIHsgcmV0dXJuIHRoaXMuX2NvdW50OyB9XG4gICAgc2V0IGNvdW50KGNvdW50KSB7XG4gICAgICAgIGlmICh0aGlzLl9jb3VudCAhPT0gY291bnQpIHtcbiAgICAgICAgICAgIHRoaXMuX2NvdW50ID0gY291bnQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuX2NvdW50ID4gMSkge1xuICAgICAgICAgICAgdGhpcy5fYm9keS5wYXJlbnRFbGVtZW50Lmluc2VydEJlZm9yZSh0aGlzLl9idXR0b25zLCB0aGlzLl9ib2R5KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX2J1dHRvbnMucmVtb3ZlKCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZ2V0IG1vZGVsKCkgeyByZXR1cm4gdGhpcy5fbW9kZWw7IH1cbiAgICBzZXQgbW9kZWwobW9kZWwpIHtcbiAgICAgICAgdGhpcy5fbW9kZWwgPSBtb2RlbDtcbiAgICAgICAgdGhpcy5tb2RlbERpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgICAgICB0aGlzLm1vZGVsRGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIHRoaXMubW9kZWxEaXNwb3NhYmxlLmFkZCh0aGlzLl9tb2RlbC5vYnNlcnZlLnN0YXRlLmRlbGF5KDEwKS5zdWJzY3JpYmUoKHsgaW5kZXgsIHBhdGgsIHN0YXRlLCBpc1JlYWR5LCBpc09mZiwgaXNPbiB9KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBuYW1lID0gYCR7YmFzZW5hbWUocGF0aCl9ICgke2luZGV4fSlgO1xuICAgICAgICAgICAgaWYgKHRoaXMuX25hbWUuaW5uZXJUZXh0ICE9PSBuYW1lKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fbmFtZS5pbm5lclRleHQgPSBuYW1lO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHN0YXRlID09PSBEcml2ZXJTdGF0ZS5Db25uZWN0ZWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9zdGF0dXNUZXh0LmlubmVyVGV4dCA9ICdPbmxpbmUnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoc3RhdGUgPT09IERyaXZlclN0YXRlLkNvbm5lY3RpbmcpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9zdGF0dXNUZXh0LmlubmVyVGV4dCA9ICdMb2FkaW5nJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHN0YXRlID09PSBEcml2ZXJTdGF0ZS5EaXNjb25uZWN0ZWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9zdGF0dXNUZXh0LmlubmVyVGV4dCA9ICdPZmZsaW5lJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuX3N0YXR1c1RleHQuaW5uZXJUZXh0ID0gRHJpdmVyU3RhdGVbc3RhdGVdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGlzUmVhZHkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9zdGFydEJ0bi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgICAgICAgIHRoaXMuX3N0b3BCdG4uc3R5bGUuZGlzcGxheSA9ICcnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoaXNPZmYpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9zdGFydEJ0bi5zdHlsZS5kaXNwbGF5ID0gJyc7XG4gICAgICAgICAgICAgICAgdGhpcy5fc3RvcEJ0bi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fc3RhcnRCdG4uc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgICAgICAgICB0aGlzLl9zdG9wQnRuLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaXNPbikge1xuICAgICAgICAgICAgICAgIHRoaXMuX3Jlc3RhcnRCdG4uc3R5bGUuZGlzcGxheSA9ICcnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fcmVzdGFydEJ0bi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGlzT2ZmKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fcHJvamVjdHMuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuX3Byb2plY3RzLnN0eWxlLmRpc3BsYXkgPSAnJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX3N0YXR1c0l0ZW0uY2xhc3NOYW1lID0gJ3B1bGwtbGVmdCBzdGF0cy1pdGVtJztcbiAgICAgICAgICAgIHRoaXMuX3N0YXR1c0l0ZW0uY2xhc3NMaXN0LmFkZChEcml2ZXJTdGF0ZVtzdGF0ZV0udG9Mb3dlckNhc2UoKSk7XG4gICAgICAgICAgICB0aGlzLnZlcmlmeVBvc2l0aW9uKCk7XG4gICAgICAgICAgICB0aGlzLl9ydW50aW1lVGV4dC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgICAgdGhpcy5fcnVudGltZVRleHQuaW5uZXJUZXh0ID0gJyc7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5tb2RlbERpc3Bvc2FibGUuYWRkKHRoaXMuX21vZGVsLm9ic2VydmUucHJvamVjdHMuc3Vic2NyaWJlKHByb2plY3RzID0+IHtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwLCBsZW4gPSB0aGlzLl9wcm9qZWN0cy5jaGlsZHJlbi5sZW5ndGggPiBwcm9qZWN0cy5sZW5ndGggPyB0aGlzLl9wcm9qZWN0cy5jaGlsZHJlbi5sZW5ndGggOiBwcm9qZWN0cy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW0gPSBwcm9qZWN0c1tpXTtcbiAgICAgICAgICAgICAgICBsZXQgY2hpbGQgPSB0aGlzLl9wcm9qZWN0cy5jaGlsZHJlbltpXTtcbiAgICAgICAgICAgICAgICBpZiAoIWl0ZW0gJiYgY2hpbGQpIHtcbiAgICAgICAgICAgICAgICAgICAgY2hpbGQucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChpdGVtICYmICFjaGlsZCkge1xuICAgICAgICAgICAgICAgICAgICBjaGlsZCA9IGdldE1lc3NhZ2VFbGVtZW50KCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Byb2plY3RzLmFwcGVuZENoaWxkKGNoaWxkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGNoaWxkICYmIGNoaWxkLmtleSAhPT0gaXRlbS5wYXRoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNoaWxkLnByb2plY3QgPSBpdGVtO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMudmVyaWZ5UG9zaXRpb24oKTtcbiAgICAgICAgfSkpO1xuICAgIH1cbiAgICBfZ2V0TWV0YUNvbnRyb2xzKCkge1xuICAgICAgICB0aGlzLl9zdG9wQnRuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJyk7XG4gICAgICAgIHRoaXMuX3N0b3BCdG4uY2xhc3NMaXN0LmFkZCgnYnRuJywgJ2J0bi14cycsICdidG4tZXJyb3InKTtcbiAgICAgICAgdGhpcy5fc3RvcEJ0bi5vbmNsaWNrID0gKCkgPT4gYXRvbS5jb21tYW5kcy5kaXNwYXRjaChhdG9tLnZpZXdzLmdldFZpZXcoYXRvbS53b3Jrc3BhY2UpLCAnb21uaXNoYXJwLWF0b206c3RvcC1zZXJ2ZXInKTtcbiAgICAgICAgbGV0IHNwYW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgICAgIHNwYW4uY2xhc3NMaXN0LmFkZCgnZmEnLCAnZmEtc3RvcCcpO1xuICAgICAgICB0aGlzLl9zdG9wQnRuLmFwcGVuZENoaWxkKHNwYW4pO1xuICAgICAgICB0aGlzLl9zdG9wQnRuLmlubmVySFRNTCArPSAnIFN0b3AnO1xuICAgICAgICB0aGlzLl9zdGFydEJ0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpO1xuICAgICAgICB0aGlzLl9zdGFydEJ0bi5jbGFzc0xpc3QuYWRkKCdidG4nLCAnYnRuLXhzJywgJ2J0bi1zdWNjZXNzJyk7XG4gICAgICAgIHRoaXMuX3N0YXJ0QnRuLm9uY2xpY2sgPSAoKSA9PiBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSksICdvbW5pc2hhcnAtYXRvbTpzdGFydC1zZXJ2ZXInKTtcbiAgICAgICAgc3BhbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICAgICAgc3Bhbi5jbGFzc0xpc3QuYWRkKCdmYScsICdmYS1wbGF5Jyk7XG4gICAgICAgIHRoaXMuX3N0YXJ0QnRuLmFwcGVuZENoaWxkKHNwYW4pO1xuICAgICAgICB0aGlzLl9zdGFydEJ0bi5pbm5lckhUTUwgKz0gJyBTdGFydCc7XG4gICAgICAgIHRoaXMuX3Jlc3RhcnRCdG4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdidXR0b24nKTtcbiAgICAgICAgdGhpcy5fcmVzdGFydEJ0bi5jbGFzc0xpc3QuYWRkKCdidG4nLCAnYnRuLXhzJywgJ2J0bi1pbmZvJyk7XG4gICAgICAgIHRoaXMuX3Jlc3RhcnRCdG4ub25jbGljayA9ICgpID0+IGF0b20uY29tbWFuZHMuZGlzcGF0Y2goYXRvbS52aWV3cy5nZXRWaWV3KGF0b20ud29ya3NwYWNlKSwgJ29tbmlzaGFycC1hdG9tOnJlc3RhcnQtc2VydmVyJyk7XG4gICAgICAgIHNwYW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgICAgIHNwYW4uY2xhc3NMaXN0LmFkZCgnZmEnLCAnZmEtcmVmcmVzaCcpO1xuICAgICAgICB0aGlzLl9yZXN0YXJ0QnRuLmFwcGVuZENoaWxkKHNwYW4pO1xuICAgICAgICB0aGlzLl9yZXN0YXJ0QnRuLmlubmVySFRNTCArPSAnIFJlc3RhcnQnO1xuICAgICAgICBjb25zdCBtZXRhQ29udHJvbHMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgbWV0YUNvbnRyb2xzLmNsYXNzTGlzdC5hZGQoJ21ldGEtY29udHJvbHMnKTtcbiAgICAgICAgY29uc3QgYnV0dG9uR3JvdXAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgYnV0dG9uR3JvdXAuY2xhc3NMaXN0LmFkZCgnYnRuLWdyb3VwJyk7XG4gICAgICAgIG1ldGFDb250cm9scy5hcHBlbmRDaGlsZChidXR0b25Hcm91cCk7XG4gICAgICAgIGJ1dHRvbkdyb3VwLmFwcGVuZENoaWxkKHRoaXMuX3N0YXJ0QnRuKTtcbiAgICAgICAgYnV0dG9uR3JvdXAuYXBwZW5kQ2hpbGQodGhpcy5fc3RvcEJ0bik7XG4gICAgICAgIGJ1dHRvbkdyb3VwLmFwcGVuZENoaWxkKHRoaXMuX3Jlc3RhcnRCdG4pO1xuICAgICAgICByZXR1cm4gbWV0YUNvbnRyb2xzO1xuICAgIH1cbiAgICBfZ2V0U3RhdHVzSXRlbSgpIHtcbiAgICAgICAgdGhpcy5fc3RhdHVzSXRlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICAgICAgdGhpcy5fc3RhdHVzSXRlbS5jbGFzc0xpc3QuYWRkKCdwdWxsLWxlZnQnLCAnc3RhdHMtaXRlbScpO1xuICAgICAgICBjb25zdCBzdGF0dXNDb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgICAgIHRoaXMuX3N0YXR1c0l0ZW0uYXBwZW5kQ2hpbGQoc3RhdHVzQ29udGFpbmVyKTtcbiAgICAgICAgY29uc3QgaWNvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICAgICAgc3RhdHVzQ29udGFpbmVyLmFwcGVuZENoaWxkKGljb24pO1xuICAgICAgICBpY29uLmNsYXNzTGlzdC5hZGQoJ2ljb24nLCAnaWNvbi16YXAnKTtcbiAgICAgICAgdGhpcy5fc3RhdHVzVGV4dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICAgICAgc3RhdHVzQ29udGFpbmVyLmFwcGVuZENoaWxkKHRoaXMuX3N0YXR1c1RleHQpO1xuICAgICAgICByZXR1cm4gdGhpcy5fc3RhdHVzSXRlbTtcbiAgICB9XG4gICAgX2dldFZlcnNpb25zKCkge1xuICAgICAgICBjb25zdCB2ZXJzaW9ucyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICAgICAgdmVyc2lvbnMuY2xhc3NMaXN0LmFkZCgncHVsbC1yaWdodCcsICdzdGF0cy1pdGVtJyk7XG4gICAgICAgIGNvbnN0IHNwYW5zID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgICAgICBzcGFucy5jbGFzc0xpc3QuYWRkKCdpY29uJywgJ2ljb24tdmVyc2lvbnMnKTtcbiAgICAgICAgdmVyc2lvbnMuYXBwZW5kQ2hpbGQoc3BhbnMpO1xuICAgICAgICB0aGlzLl9ydW50aW1lVGV4dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICAgICAgdmVyc2lvbnMuYXBwZW5kQ2hpbGQodGhpcy5fcnVudGltZVRleHQpO1xuICAgICAgICByZXR1cm4gdmVyc2lvbnM7XG4gICAgfVxuICAgIF9nZXRCb2R5KCkge1xuICAgICAgICBjb25zdCBib2R5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIHRoaXMuX2JvZHkgPSBib2R5O1xuICAgICAgICBib2R5LmNsYXNzTGlzdC5hZGQoJ2JvZHknKTtcbiAgICAgICAgY29uc3QgaGVhZGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaDQnKTtcbiAgICAgICAgaGVhZGVyLmNsYXNzTGlzdC5hZGQoJ25hbWUnKTtcbiAgICAgICAgYm9keS5hcHBlbmRDaGlsZChoZWFkZXIpO1xuICAgICAgICB0aGlzLl9uYW1lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgICAgICBoZWFkZXIuYXBwZW5kQ2hpbGQodGhpcy5fbmFtZSk7XG4gICAgICAgIGNvbnN0IHZlcnNpb25zID0gdGhpcy5fZ2V0VmVyc2lvbnMoKTtcbiAgICAgICAgYm9keS5hcHBlbmRDaGlsZCh2ZXJzaW9ucyk7XG4gICAgICAgIGNvbnN0IHN0YXR1c0l0ZW0gPSB0aGlzLl9nZXRTdGF0dXNJdGVtKCk7XG4gICAgICAgIGJvZHkuYXBwZW5kQ2hpbGQoc3RhdHVzSXRlbSk7XG4gICAgICAgIGNvbnN0IG1ldGFDb250cm9scyA9IHRoaXMuX2dldE1ldGFDb250cm9scygpO1xuICAgICAgICBib2R5LmFwcGVuZENoaWxkKG1ldGFDb250cm9scyk7XG4gICAgICAgIHJldHVybiBib2R5O1xuICAgIH1cbiAgICBfZ2V0UHJvamVjdHMoKSB7XG4gICAgICAgIHRoaXMuX3Byb2plY3RzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIHRoaXMuX3Byb2plY3RzLmNsYXNzTGlzdC5hZGQoJ21ldGEnLCAnbWV0YS1wcm9qZWN0cycpO1xuICAgICAgICBjb25zdCBoZWFkZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgaGVhZGVyLmNsYXNzTGlzdC5hZGQoJ2hlYWRlcicpO1xuICAgICAgICBoZWFkZXIuaW5uZXJUZXh0ID0gJ1Byb2plY3RzJztcbiAgICAgICAgcmV0dXJuIHRoaXMuX3Byb2plY3RzO1xuICAgIH1cbiAgICBfZ2V0QnV0dG9ucygpIHtcbiAgICAgICAgdGhpcy5fYnV0dG9ucyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICB0aGlzLl9idXR0b25zLmNsYXNzTGlzdC5hZGQoJ3NlbGVjdG9yJywgJ2J0bi1ncm91cCcsICdidG4tZ3JvdXAteHMnKTtcbiAgICAgICAgY29uc3QgbGVmdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICBsZWZ0LmNsYXNzTGlzdC5hZGQoJ2J0bicsICdidG4teHMnLCAnaWNvbicsICdpY29uLXRyaWFuZ2xlLWxlZnQnKTtcbiAgICAgICAgbGVmdC5vbmNsaWNrID0gZSA9PiBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSksICdvbW5pc2hhcnAtYXRvbTpwcmV2aW91cy1zb2x1dGlvbi1zdGF0dXMnKTtcbiAgICAgICAgdGhpcy5fYnV0dG9ucy5hcHBlbmRDaGlsZChsZWZ0KTtcbiAgICAgICAgY29uc3QgcmlnaHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgcmlnaHQuY2xhc3NMaXN0LmFkZCgnYnRuJywgJ2J0bi14cycsICdpY29uJywgJ2ljb24tdHJpYW5nbGUtcmlnaHQnKTtcbiAgICAgICAgcmlnaHQub25jbGljayA9IGUgPT4gYXRvbS5jb21tYW5kcy5kaXNwYXRjaChhdG9tLnZpZXdzLmdldFZpZXcoYXRvbS53b3Jrc3BhY2UpLCAnb21uaXNoYXJwLWF0b206bmV4dC1zb2x1dGlvbi1zdGF0dXMnKTtcbiAgICAgICAgdGhpcy5fYnV0dG9ucy5hcHBlbmRDaGlsZChyaWdodCk7XG4gICAgICAgIHJldHVybiB0aGlzLl9idXR0b25zO1xuICAgIH1cbiAgICBjcmVhdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMubW9kZWxEaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgdGhpcy5jbGFzc0xpc3QuYWRkKCdvbW5pc2hhcnAtY2FyZCcpO1xuICAgICAgICB0aGlzLl9nZXRCdXR0b25zKCk7XG4gICAgICAgIGNvbnN0IGJvZHkgPSB0aGlzLl9nZXRCb2R5KCk7XG4gICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQoYm9keSk7XG4gICAgICAgIGNvbnN0IHByb2plY3RzID0gdGhpcy5fZ2V0UHJvamVjdHMoKTtcbiAgICAgICAgdGhpcy5hcHBlbmRDaGlsZChwcm9qZWN0cyk7XG4gICAgfVxuICAgIGF0dGFjaGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMudmVyaWZ5UG9zaXRpb24oKTtcbiAgICB9XG4gICAgdXBkYXRlQ2FyZChtb2RlbCwgY291bnQpIHtcbiAgICAgICAgdGhpcy5tb2RlbCA9IG1vZGVsO1xuICAgICAgICB0aGlzLmNvdW50ID0gY291bnQ7XG4gICAgfVxuICAgIHZlcmlmeVBvc2l0aW9uKCkge1xuICAgICAgICBjb25zdCBvZmZzZXQgPSAkKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwodGhpcy5hdHRhY2hUbykpLm9mZnNldCgpO1xuICAgICAgICBpZiAob2Zmc2V0KSB7XG4gICAgICAgICAgICAkKHRoaXMpLmNzcyh7XG4gICAgICAgICAgICAgICAgcG9zaXRpb246ICdmaXhlZCcsXG4gICAgICAgICAgICAgICAgdG9wOiBvZmZzZXQudG9wIC0gdGhpcy5jbGllbnRIZWlnaHQsXG4gICAgICAgICAgICAgICAgbGVmdDogb2Zmc2V0LmxlZnRcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxufVxuZXhwb3J0cy5Tb2x1dGlvblN0YXR1c0NhcmQgPSBkb2N1bWVudC5yZWdpc3RlckVsZW1lbnQoJ29tbmlzaGFycC1zb2x1dGlvbi1jYXJkJywgeyBwcm90b3R5cGU6IFNvbHV0aW9uU3RhdHVzQ2FyZC5wcm90b3R5cGUgfSk7XG4iXX0=
