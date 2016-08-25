"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.SolutionStatusCard = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _omnisharpClient = require("omnisharp-client");

var _tsDisposables = require("ts-disposables");

var _path = require("path");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var $ = require("jquery");
var fastdom = require("fastdom");

function truncateStringReverse(str) {
    var maxLength = arguments.length <= 1 || arguments[1] === undefined ? 55 : arguments[1];

    var reversedString = _lodash2.default.toArray(str).reverse().join("");
    return _lodash2.default.toArray(_lodash2.default.truncate(reversedString, maxLength)).reverse().join("");
}
var getMessageElement = function () {
    var projectProps = {
        get: function project() {
            return this._project;
        },
        set: function project(project) {
            this._project = project;
            this._key = project.path;
            var path = truncateStringReverse(project.path.replace(this.project.solutionPath, ""), 24);
            this.title = path + " [" + project.frameworks.filter(function (z) {
                return z.Name !== "all";
            }).map(function (x) {
                return x.FriendlyName;
            }) + "]";
            this.innerText = project.name;
        }
    };
    var keyProps = {
        get: function key() {
            return this._key;
        }
    };
    return function getMessageElement() {
        var element = document.createElement("div");
        element.classList.add("project", "name");
        Object.defineProperty(element, "project", projectProps);
        Object.defineProperty(element, "key", keyProps);
        return element;
    };
}();

var SolutionStatusCard = exports.SolutionStatusCard = function (_HTMLDivElement) {
    _inherits(SolutionStatusCard, _HTMLDivElement);

    function SolutionStatusCard() {
        var _ref;

        _classCallCheck(this, SolutionStatusCard);

        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
        }

        var _this = _possibleConstructorReturn(this, (_ref = SolutionStatusCard.__proto__ || Object.getPrototypeOf(SolutionStatusCard)).call.apply(_ref, [this].concat(args)));

        _this.displayName = "Card";
        return _this;
    }

    _createClass(SolutionStatusCard, [{
        key: "_getMetaControls",
        value: function _getMetaControls() {
            this._stopBtn = document.createElement("button");
            this._stopBtn.classList.add("btn", "btn-xs", "btn-error");
            this._stopBtn.onclick = function () {
                return atom.commands.dispatch(atom.views.getView(atom.workspace), "omnisharp-atom:stop-server");
            };
            var span = document.createElement("span");
            span.classList.add("fa", "fa-stop");
            this._stopBtn.appendChild(span);
            this._stopBtn.innerHTML += " Stop";
            this._startBtn = document.createElement("button");
            this._startBtn.classList.add("btn", "btn-xs", "btn-success");
            this._startBtn.onclick = function () {
                return atom.commands.dispatch(atom.views.getView(atom.workspace), "omnisharp-atom:start-server");
            };
            span = document.createElement("span");
            span.classList.add("fa", "fa-play");
            this._startBtn.appendChild(span);
            this._startBtn.innerHTML += " Start";
            this._restartBtn = document.createElement("button");
            this._restartBtn.classList.add("btn", "btn-xs", "btn-info");
            this._restartBtn.onclick = function () {
                return atom.commands.dispatch(atom.views.getView(atom.workspace), "omnisharp-atom:restart-server");
            };
            span = document.createElement("span");
            span.classList.add("fa", "fa-refresh");
            this._restartBtn.appendChild(span);
            this._restartBtn.innerHTML += " Restart";
            var metaControls = document.createElement("div");
            metaControls.classList.add("meta-controls");
            var buttonGroup = document.createElement("div");
            buttonGroup.classList.add("btn-group");
            metaControls.appendChild(buttonGroup);
            buttonGroup.appendChild(this._startBtn);
            buttonGroup.appendChild(this._stopBtn);
            buttonGroup.appendChild(this._restartBtn);
            return metaControls;
        }
    }, {
        key: "_getStatusItem",
        value: function _getStatusItem() {
            this._statusItem = document.createElement("span");
            this._statusItem.classList.add("pull-left", "stats-item");
            var statusContainer = document.createElement("span");
            this._statusItem.appendChild(statusContainer);
            var icon = document.createElement("span");
            statusContainer.appendChild(icon);
            icon.classList.add("icon", "icon-zap");
            this._statusText = document.createElement("span");
            statusContainer.appendChild(this._statusText);
            return this._statusItem;
        }
    }, {
        key: "_getVersions",
        value: function _getVersions() {
            var versions = document.createElement("span");
            versions.classList.add("pull-right", "stats-item");
            var spans = document.createElement("span");
            spans.classList.add("icon", "icon-versions");
            versions.appendChild(spans);
            this._runtimeText = document.createElement("span");
            versions.appendChild(this._runtimeText);
            return versions;
        }
    }, {
        key: "_getBody",
        value: function _getBody() {
            var body = document.createElement("div");
            this._body = body;
            body.classList.add("body");
            var header = document.createElement("h4");
            header.classList.add("name");
            body.appendChild(header);
            this._name = document.createElement("span");
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
        key: "_getProjects",
        value: function _getProjects() {
            this._projects = document.createElement("div");
            this._projects.classList.add("meta", "meta-projects");
            var header = document.createElement("div");
            header.classList.add("header");
            header.innerText = "Projects";
            return this._projects;
        }
    }, {
        key: "_getButtons",
        value: function _getButtons() {
            this._buttons = document.createElement("div");
            this._buttons.classList.add("selector", "btn-group", "btn-group-xs");
            var left = document.createElement("div");
            left.classList.add("btn", "btn-xs", "icon", "icon-triangle-left");
            left.onclick = function (e) {
                return atom.commands.dispatch(atom.views.getView(atom.workspace), "omnisharp-atom:previous-solution-status");
            };
            this._buttons.appendChild(left);
            var right = document.createElement("div");
            right.classList.add("btn", "btn-xs", "icon", "icon-triangle-right");
            right.onclick = function (e) {
                return atom.commands.dispatch(atom.views.getView(atom.workspace), "omnisharp-atom:next-solution-status");
            };
            this._buttons.appendChild(right);
            return this._buttons;
        }
    }, {
        key: "createdCallback",
        value: function createdCallback() {
            this.modelDisposable = new _tsDisposables.CompositeDisposable();
            this.classList.add("omnisharp-card");
            this._getButtons();
            var body = this._getBody();
            this.appendChild(body);
            var projects = this._getProjects();
            this.appendChild(projects);
        }
    }, {
        key: "attachedCallback",
        value: function attachedCallback() {
            this.verifyPosition();
        }
    }, {
        key: "updateCard",
        value: function updateCard(model, count) {
            this.model = model;
            this.count = count;
        }
    }, {
        key: "verifyPosition",
        value: function verifyPosition() {
            var offset = $(document.querySelectorAll(this.attachTo)).offset();
            if (offset) {
                $(this).css({
                    position: "fixed",
                    top: offset.top - this.clientHeight,
                    left: offset.left
                });
            }
        }
    }, {
        key: "count",
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
        key: "model",
        get: function get() {
            return this._model;
        },
        set: function set(model) {
            var _this2 = this;

            this._model = model;
            this.modelDisposable.dispose();
            this.modelDisposable = new _tsDisposables.CompositeDisposable();
            this.modelDisposable.add(this._model.observe.state.delay(10).subscribe(function (_ref2) {
                var index = _ref2.index;
                var path = _ref2.path;
                var state = _ref2.state;
                var isReady = _ref2.isReady;
                var isOff = _ref2.isOff;
                var isOn = _ref2.isOn;

                fastdom.mutate(function () {
                    var name = (0, _path.basename)(path) + " (" + index + ")";
                    if (_this2._name.innerText !== name) {
                        _this2._name.innerText = name;
                    }
                    if (state === _omnisharpClient.DriverState.Connected) {
                        _this2._statusText.innerText = "Online";
                    } else if (state === _omnisharpClient.DriverState.Connecting) {
                        _this2._statusText.innerText = "Loading";
                    } else if (state === _omnisharpClient.DriverState.Disconnected) {
                        _this2._statusText.innerText = "Offline";
                    } else {
                        _this2._statusText.innerText = _omnisharpClient.DriverState[state];
                    }
                    if (isReady) {
                        _this2._startBtn.style.display = "none";
                        _this2._stopBtn.style.display = "";
                    } else if (isOff) {
                        _this2._startBtn.style.display = "";
                        _this2._stopBtn.style.display = "none";
                    } else {
                        _this2._startBtn.style.display = "none";
                        _this2._stopBtn.style.display = "none";
                    }
                    if (isOn) {
                        _this2._restartBtn.style.display = "";
                    } else {
                        _this2._restartBtn.style.display = "none";
                    }
                    if (isOff) {
                        _this2._projects.style.display = "none";
                    } else {
                        _this2._projects.style.display = "";
                    }
                    _this2._statusItem.className = "pull-left stats-item";
                    _this2._statusItem.classList.add(_omnisharpClient.DriverState[state].toLowerCase());
                    _this2.verifyPosition();
                    _this2._runtimeText.style.display = "none";
                    _this2._runtimeText.innerText = "";
                });
            }));
            this.modelDisposable.add(this._model.observe.projects.subscribe(function (projects) {
                fastdom.mutate(function () {
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
                });
            }));
        }
    }]);

    return SolutionStatusCard;
}(HTMLDivElement);

exports.SolutionStatusCard = document.registerElement("omnisharp-solution-card", { prototype: SolutionStatusCard.prototype });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy9zb2x1dGlvbi1zdGF0dXMtdmlldy5qcyIsImxpYi92aWV3cy9zb2x1dGlvbi1zdGF0dXMtdmlldy50cyJdLCJuYW1lcyI6WyIkIiwicmVxdWlyZSIsImZhc3Rkb20iLCJ0cnVuY2F0ZVN0cmluZ1JldmVyc2UiLCJzdHIiLCJtYXhMZW5ndGgiLCJyZXZlcnNlZFN0cmluZyIsInRvQXJyYXkiLCJyZXZlcnNlIiwiam9pbiIsInRydW5jYXRlIiwiZ2V0TWVzc2FnZUVsZW1lbnQiLCJwcm9qZWN0UHJvcHMiLCJnZXQiLCJwcm9qZWN0IiwiX3Byb2plY3QiLCJzZXQiLCJfa2V5IiwicGF0aCIsInJlcGxhY2UiLCJzb2x1dGlvblBhdGgiLCJ0aXRsZSIsImZyYW1ld29ya3MiLCJmaWx0ZXIiLCJ6IiwiTmFtZSIsIm1hcCIsIngiLCJGcmllbmRseU5hbWUiLCJpbm5lclRleHQiLCJuYW1lIiwia2V5UHJvcHMiLCJrZXkiLCJlbGVtZW50IiwiZG9jdW1lbnQiLCJjcmVhdGVFbGVtZW50IiwiY2xhc3NMaXN0IiwiYWRkIiwiT2JqZWN0IiwiZGVmaW5lUHJvcGVydHkiLCJTb2x1dGlvblN0YXR1c0NhcmQiLCJhcmdzIiwiZGlzcGxheU5hbWUiLCJfc3RvcEJ0biIsIm9uY2xpY2siLCJhdG9tIiwiY29tbWFuZHMiLCJkaXNwYXRjaCIsInZpZXdzIiwiZ2V0VmlldyIsIndvcmtzcGFjZSIsInNwYW4iLCJhcHBlbmRDaGlsZCIsImlubmVySFRNTCIsIl9zdGFydEJ0biIsIl9yZXN0YXJ0QnRuIiwibWV0YUNvbnRyb2xzIiwiYnV0dG9uR3JvdXAiLCJfc3RhdHVzSXRlbSIsInN0YXR1c0NvbnRhaW5lciIsImljb24iLCJfc3RhdHVzVGV4dCIsInZlcnNpb25zIiwic3BhbnMiLCJfcnVudGltZVRleHQiLCJib2R5IiwiX2JvZHkiLCJoZWFkZXIiLCJfbmFtZSIsIl9nZXRWZXJzaW9ucyIsInN0YXR1c0l0ZW0iLCJfZ2V0U3RhdHVzSXRlbSIsIl9nZXRNZXRhQ29udHJvbHMiLCJfcHJvamVjdHMiLCJfYnV0dG9ucyIsImxlZnQiLCJlIiwicmlnaHQiLCJtb2RlbERpc3Bvc2FibGUiLCJfZ2V0QnV0dG9ucyIsIl9nZXRCb2R5IiwicHJvamVjdHMiLCJfZ2V0UHJvamVjdHMiLCJ2ZXJpZnlQb3NpdGlvbiIsIm1vZGVsIiwiY291bnQiLCJvZmZzZXQiLCJxdWVyeVNlbGVjdG9yQWxsIiwiYXR0YWNoVG8iLCJjc3MiLCJwb3NpdGlvbiIsInRvcCIsImNsaWVudEhlaWdodCIsIl9jb3VudCIsInBhcmVudEVsZW1lbnQiLCJpbnNlcnRCZWZvcmUiLCJyZW1vdmUiLCJfbW9kZWwiLCJkaXNwb3NlIiwib2JzZXJ2ZSIsInN0YXRlIiwiZGVsYXkiLCJzdWJzY3JpYmUiLCJpbmRleCIsImlzUmVhZHkiLCJpc09mZiIsImlzT24iLCJtdXRhdGUiLCJDb25uZWN0ZWQiLCJDb25uZWN0aW5nIiwiRGlzY29ubmVjdGVkIiwic3R5bGUiLCJkaXNwbGF5IiwiY2xhc3NOYW1lIiwidG9Mb3dlckNhc2UiLCJpIiwibGVuIiwiY2hpbGRyZW4iLCJsZW5ndGgiLCJpdGVtIiwiY2hpbGQiLCJIVE1MRGl2RWxlbWVudCIsImV4cG9ydHMiLCJyZWdpc3RlckVsZW1lbnQiLCJwcm90b3R5cGUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOzs7O0FBQ0E7O0FBQ0E7O0FBR0E7Ozs7Ozs7Ozs7QUNBQSxJQUFNQSxJQUFrQkMsUUFBUSxRQUFSLENBQXhCO0FBQ0EsSUFBSUMsVUFBMEJELFFBQVEsU0FBUixDQUE5Qjs7QUFHQSxTQUFBRSxxQkFBQSxDQUErQkMsR0FBL0IsRUFBMEQ7QUFBQSxRQUFkQyxTQUFjLHlEQUFGLEVBQUU7O0FBQ3RELFFBQU1DLGlCQUFpQixpQkFBRUMsT0FBRixDQUFVSCxHQUFWLEVBQWVJLE9BQWYsR0FBeUJDLElBQXpCLENBQThCLEVBQTlCLENBQXZCO0FBQ0EsV0FBTyxpQkFBRUYsT0FBRixDQUFVLGlCQUFFRyxRQUFGLENBQVdKLGNBQVgsRUFBMkJELFNBQTNC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LGNBQUw7QUFDSCxpQkFuQkQ7QUFvQkgsYUFyQndCLENBQXpCO0FBc0JIOzs7O0VBckhtQ3NDLGM7O0FBc1JsQ0MsUUFBU2xGLGtCQUFULEdBQW9DTixTQUFVeUYsZUFBVixDQUEwQix5QkFBMUIsRUFBcUQsRUFBRUMsV0FBV3BGLG1CQUFtQm9GLFNBQWhDLEVBQXJELENBQXBDIiwiZmlsZSI6ImxpYi92aWV3cy9zb2x1dGlvbi1zdGF0dXMtdmlldy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcbmltcG9ydCB7IERyaXZlclN0YXRlIH0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcbmltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUgfSBmcm9tIFwidHMtZGlzcG9zYWJsZXNcIjtcbmNvbnN0ICQgPSByZXF1aXJlKFwianF1ZXJ5XCIpO1xubGV0IGZhc3Rkb20gPSByZXF1aXJlKFwiZmFzdGRvbVwiKTtcbmltcG9ydCB7IGJhc2VuYW1lIH0gZnJvbSBcInBhdGhcIjtcbmZ1bmN0aW9uIHRydW5jYXRlU3RyaW5nUmV2ZXJzZShzdHIsIG1heExlbmd0aCA9IDU1KSB7XG4gICAgY29uc3QgcmV2ZXJzZWRTdHJpbmcgPSBfLnRvQXJyYXkoc3RyKS5yZXZlcnNlKCkuam9pbihcIlwiKTtcbiAgICByZXR1cm4gXy50b0FycmF5KF8udHJ1bmNhdGUocmV2ZXJzZWRTdHJpbmcsIG1heExlbmd0aCkpLnJldmVyc2UoKS5qb2luKFwiXCIpO1xufVxuY29uc3QgZ2V0TWVzc2FnZUVsZW1lbnQgPSAoZnVuY3Rpb24gKCkge1xuICAgIGNvbnN0IHByb2plY3RQcm9wcyA9IHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiBwcm9qZWN0KCkgeyByZXR1cm4gdGhpcy5fcHJvamVjdDsgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiBwcm9qZWN0KHByb2plY3QpIHtcbiAgICAgICAgICAgIHRoaXMuX3Byb2plY3QgPSBwcm9qZWN0O1xuICAgICAgICAgICAgdGhpcy5fa2V5ID0gcHJvamVjdC5wYXRoO1xuICAgICAgICAgICAgY29uc3QgcGF0aCA9IHRydW5jYXRlU3RyaW5nUmV2ZXJzZShwcm9qZWN0LnBhdGgucmVwbGFjZSh0aGlzLnByb2plY3Quc29sdXRpb25QYXRoLCBcIlwiKSwgMjQpO1xuICAgICAgICAgICAgdGhpcy50aXRsZSA9IGAke3BhdGh9IFske3Byb2plY3QuZnJhbWV3b3Jrcy5maWx0ZXIoeiA9PiB6Lk5hbWUgIT09IFwiYWxsXCIpLm1hcCh4ID0+IHguRnJpZW5kbHlOYW1lKX1dYDtcbiAgICAgICAgICAgIHRoaXMuaW5uZXJUZXh0ID0gcHJvamVjdC5uYW1lO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBjb25zdCBrZXlQcm9wcyA9IHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiBrZXkoKSB7IHJldHVybiB0aGlzLl9rZXk7IH1cbiAgICB9O1xuICAgIHJldHVybiBmdW5jdGlvbiBnZXRNZXNzYWdlRWxlbWVudCgpIHtcbiAgICAgICAgY29uc3QgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZChcInByb2plY3RcIiwgXCJuYW1lXCIpO1xuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZWxlbWVudCwgXCJwcm9qZWN0XCIsIHByb2plY3RQcm9wcyk7XG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShlbGVtZW50LCBcImtleVwiLCBrZXlQcm9wcyk7XG4gICAgICAgIHJldHVybiBlbGVtZW50O1xuICAgIH07XG59KSgpO1xuZXhwb3J0IGNsYXNzIFNvbHV0aW9uU3RhdHVzQ2FyZCBleHRlbmRzIEhUTUxEaXZFbGVtZW50IHtcbiAgICBjb25zdHJ1Y3RvciguLi5hcmdzKSB7XG4gICAgICAgIHN1cGVyKC4uLmFyZ3MpO1xuICAgICAgICB0aGlzLmRpc3BsYXlOYW1lID0gXCJDYXJkXCI7XG4gICAgfVxuICAgIGdldCBjb3VudCgpIHsgcmV0dXJuIHRoaXMuX2NvdW50OyB9XG4gICAgc2V0IGNvdW50KGNvdW50KSB7XG4gICAgICAgIGlmICh0aGlzLl9jb3VudCAhPT0gY291bnQpIHtcbiAgICAgICAgICAgIHRoaXMuX2NvdW50ID0gY291bnQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuX2NvdW50ID4gMSkge1xuICAgICAgICAgICAgdGhpcy5fYm9keS5wYXJlbnRFbGVtZW50Lmluc2VydEJlZm9yZSh0aGlzLl9idXR0b25zLCB0aGlzLl9ib2R5KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX2J1dHRvbnMucmVtb3ZlKCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZ2V0IG1vZGVsKCkgeyByZXR1cm4gdGhpcy5fbW9kZWw7IH1cbiAgICBzZXQgbW9kZWwobW9kZWwpIHtcbiAgICAgICAgdGhpcy5fbW9kZWwgPSBtb2RlbDtcbiAgICAgICAgdGhpcy5tb2RlbERpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgICAgICB0aGlzLm1vZGVsRGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIHRoaXMubW9kZWxEaXNwb3NhYmxlLmFkZCh0aGlzLl9tb2RlbC5vYnNlcnZlLnN0YXRlLmRlbGF5KDEwKS5zdWJzY3JpYmUoKHsgaW5kZXgsIHBhdGgsIHN0YXRlLCBpc1JlYWR5LCBpc09mZiwgaXNPbiB9KSA9PiB7XG4gICAgICAgICAgICBmYXN0ZG9tLm11dGF0ZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgbmFtZSA9IGAke2Jhc2VuYW1lKHBhdGgpfSAoJHtpbmRleH0pYDtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fbmFtZS5pbm5lclRleHQgIT09IG5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fbmFtZS5pbm5lclRleHQgPSBuYW1lO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoc3RhdGUgPT09IERyaXZlclN0YXRlLkNvbm5lY3RlZCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9zdGF0dXNUZXh0LmlubmVyVGV4dCA9IFwiT25saW5lXCI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHN0YXRlID09PSBEcml2ZXJTdGF0ZS5Db25uZWN0aW5nKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3N0YXR1c1RleHQuaW5uZXJUZXh0ID0gXCJMb2FkaW5nXCI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHN0YXRlID09PSBEcml2ZXJTdGF0ZS5EaXNjb25uZWN0ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc3RhdHVzVGV4dC5pbm5lclRleHQgPSBcIk9mZmxpbmVcIjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3N0YXR1c1RleHQuaW5uZXJUZXh0ID0gRHJpdmVyU3RhdGVbc3RhdGVdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoaXNSZWFkeSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9zdGFydEJ0bi5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3N0b3BCdG4uc3R5bGUuZGlzcGxheSA9IFwiXCI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGlzT2ZmKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3N0YXJ0QnRuLnN0eWxlLmRpc3BsYXkgPSBcIlwiO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9zdG9wQnRuLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3N0YXJ0QnRuLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc3RvcEJ0bi5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChpc09uKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Jlc3RhcnRCdG4uc3R5bGUuZGlzcGxheSA9IFwiXCI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9yZXN0YXJ0QnRuLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGlzT2ZmKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Byb2plY3RzLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Byb2plY3RzLnN0eWxlLmRpc3BsYXkgPSBcIlwiO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLl9zdGF0dXNJdGVtLmNsYXNzTmFtZSA9IFwicHVsbC1sZWZ0IHN0YXRzLWl0ZW1cIjtcbiAgICAgICAgICAgICAgICB0aGlzLl9zdGF0dXNJdGVtLmNsYXNzTGlzdC5hZGQoRHJpdmVyU3RhdGVbc3RhdGVdLnRvTG93ZXJDYXNlKCkpO1xuICAgICAgICAgICAgICAgIHRoaXMudmVyaWZ5UG9zaXRpb24oKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9ydW50aW1lVGV4dC5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgICAgICAgICAgdGhpcy5fcnVudGltZVRleHQuaW5uZXJUZXh0ID0gXCJcIjtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMubW9kZWxEaXNwb3NhYmxlLmFkZCh0aGlzLl9tb2RlbC5vYnNlcnZlLnByb2plY3RzLnN1YnNjcmliZShwcm9qZWN0cyA9PiB7XG4gICAgICAgICAgICBmYXN0ZG9tLm11dGF0ZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDAsIGxlbiA9IHRoaXMuX3Byb2plY3RzLmNoaWxkcmVuLmxlbmd0aCA+IHByb2plY3RzLmxlbmd0aCA/IHRoaXMuX3Byb2plY3RzLmNoaWxkcmVuLmxlbmd0aCA6IHByb2plY3RzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW0gPSBwcm9qZWN0c1tpXTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGNoaWxkID0gdGhpcy5fcHJvamVjdHMuY2hpbGRyZW5baV07XG4gICAgICAgICAgICAgICAgICAgIGlmICghaXRlbSAmJiBjaGlsZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGQucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChpdGVtICYmICFjaGlsZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGQgPSBnZXRNZXNzYWdlRWxlbWVudCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fcHJvamVjdHMuYXBwZW5kQ2hpbGQoY2hpbGQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChjaGlsZCAmJiBjaGlsZC5rZXkgIT09IGl0ZW0ucGF0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGQucHJvamVjdCA9IGl0ZW07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy52ZXJpZnlQb3NpdGlvbigpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pKTtcbiAgICB9XG4gICAgX2dldE1ldGFDb250cm9scygpIHtcbiAgICAgICAgdGhpcy5fc3RvcEJ0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XG4gICAgICAgIHRoaXMuX3N0b3BCdG4uY2xhc3NMaXN0LmFkZChcImJ0blwiLCBcImJ0bi14c1wiLCBcImJ0bi1lcnJvclwiKTtcbiAgICAgICAgdGhpcy5fc3RvcEJ0bi5vbmNsaWNrID0gKCkgPT4gYXRvbS5jb21tYW5kcy5kaXNwYXRjaChhdG9tLnZpZXdzLmdldFZpZXcoYXRvbS53b3Jrc3BhY2UpLCBcIm9tbmlzaGFycC1hdG9tOnN0b3Atc2VydmVyXCIpO1xuICAgICAgICBsZXQgc3BhbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICBzcGFuLmNsYXNzTGlzdC5hZGQoXCJmYVwiLCBcImZhLXN0b3BcIik7XG4gICAgICAgIHRoaXMuX3N0b3BCdG4uYXBwZW5kQ2hpbGQoc3Bhbik7XG4gICAgICAgIHRoaXMuX3N0b3BCdG4uaW5uZXJIVE1MICs9IFwiIFN0b3BcIjtcbiAgICAgICAgdGhpcy5fc3RhcnRCdG4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpO1xuICAgICAgICB0aGlzLl9zdGFydEJ0bi5jbGFzc0xpc3QuYWRkKFwiYnRuXCIsIFwiYnRuLXhzXCIsIFwiYnRuLXN1Y2Nlc3NcIik7XG4gICAgICAgIHRoaXMuX3N0YXJ0QnRuLm9uY2xpY2sgPSAoKSA9PiBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSksIFwib21uaXNoYXJwLWF0b206c3RhcnQtc2VydmVyXCIpO1xuICAgICAgICBzcGFuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICAgIHNwYW4uY2xhc3NMaXN0LmFkZChcImZhXCIsIFwiZmEtcGxheVwiKTtcbiAgICAgICAgdGhpcy5fc3RhcnRCdG4uYXBwZW5kQ2hpbGQoc3Bhbik7XG4gICAgICAgIHRoaXMuX3N0YXJ0QnRuLmlubmVySFRNTCArPSBcIiBTdGFydFwiO1xuICAgICAgICB0aGlzLl9yZXN0YXJ0QnRuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImJ1dHRvblwiKTtcbiAgICAgICAgdGhpcy5fcmVzdGFydEJ0bi5jbGFzc0xpc3QuYWRkKFwiYnRuXCIsIFwiYnRuLXhzXCIsIFwiYnRuLWluZm9cIik7XG4gICAgICAgIHRoaXMuX3Jlc3RhcnRCdG4ub25jbGljayA9ICgpID0+IGF0b20uY29tbWFuZHMuZGlzcGF0Y2goYXRvbS52aWV3cy5nZXRWaWV3KGF0b20ud29ya3NwYWNlKSwgXCJvbW5pc2hhcnAtYXRvbTpyZXN0YXJ0LXNlcnZlclwiKTtcbiAgICAgICAgc3BhbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICBzcGFuLmNsYXNzTGlzdC5hZGQoXCJmYVwiLCBcImZhLXJlZnJlc2hcIik7XG4gICAgICAgIHRoaXMuX3Jlc3RhcnRCdG4uYXBwZW5kQ2hpbGQoc3Bhbik7XG4gICAgICAgIHRoaXMuX3Jlc3RhcnRCdG4uaW5uZXJIVE1MICs9IFwiIFJlc3RhcnRcIjtcbiAgICAgICAgY29uc3QgbWV0YUNvbnRyb2xzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgbWV0YUNvbnRyb2xzLmNsYXNzTGlzdC5hZGQoXCJtZXRhLWNvbnRyb2xzXCIpO1xuICAgICAgICBjb25zdCBidXR0b25Hcm91cCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgIGJ1dHRvbkdyb3VwLmNsYXNzTGlzdC5hZGQoXCJidG4tZ3JvdXBcIik7XG4gICAgICAgIG1ldGFDb250cm9scy5hcHBlbmRDaGlsZChidXR0b25Hcm91cCk7XG4gICAgICAgIGJ1dHRvbkdyb3VwLmFwcGVuZENoaWxkKHRoaXMuX3N0YXJ0QnRuKTtcbiAgICAgICAgYnV0dG9uR3JvdXAuYXBwZW5kQ2hpbGQodGhpcy5fc3RvcEJ0bik7XG4gICAgICAgIGJ1dHRvbkdyb3VwLmFwcGVuZENoaWxkKHRoaXMuX3Jlc3RhcnRCdG4pO1xuICAgICAgICByZXR1cm4gbWV0YUNvbnRyb2xzO1xuICAgIH1cbiAgICBfZ2V0U3RhdHVzSXRlbSgpIHtcbiAgICAgICAgdGhpcy5fc3RhdHVzSXRlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICB0aGlzLl9zdGF0dXNJdGVtLmNsYXNzTGlzdC5hZGQoXCJwdWxsLWxlZnRcIiwgXCJzdGF0cy1pdGVtXCIpO1xuICAgICAgICBjb25zdCBzdGF0dXNDb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgdGhpcy5fc3RhdHVzSXRlbS5hcHBlbmRDaGlsZChzdGF0dXNDb250YWluZXIpO1xuICAgICAgICBjb25zdCBpY29uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICAgIHN0YXR1c0NvbnRhaW5lci5hcHBlbmRDaGlsZChpY29uKTtcbiAgICAgICAgaWNvbi5jbGFzc0xpc3QuYWRkKFwiaWNvblwiLCBcImljb24temFwXCIpO1xuICAgICAgICB0aGlzLl9zdGF0dXNUZXh0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICAgIHN0YXR1c0NvbnRhaW5lci5hcHBlbmRDaGlsZCh0aGlzLl9zdGF0dXNUZXh0KTtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3N0YXR1c0l0ZW07XG4gICAgfVxuICAgIF9nZXRWZXJzaW9ucygpIHtcbiAgICAgICAgY29uc3QgdmVyc2lvbnMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgdmVyc2lvbnMuY2xhc3NMaXN0LmFkZChcInB1bGwtcmlnaHRcIiwgXCJzdGF0cy1pdGVtXCIpO1xuICAgICAgICBjb25zdCBzcGFucyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICBzcGFucy5jbGFzc0xpc3QuYWRkKFwiaWNvblwiLCBcImljb24tdmVyc2lvbnNcIik7XG4gICAgICAgIHZlcnNpb25zLmFwcGVuZENoaWxkKHNwYW5zKTtcbiAgICAgICAgdGhpcy5fcnVudGltZVRleHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgdmVyc2lvbnMuYXBwZW5kQ2hpbGQodGhpcy5fcnVudGltZVRleHQpO1xuICAgICAgICByZXR1cm4gdmVyc2lvbnM7XG4gICAgfVxuICAgIF9nZXRCb2R5KCkge1xuICAgICAgICBjb25zdCBib2R5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgdGhpcy5fYm9keSA9IGJvZHk7XG4gICAgICAgIGJvZHkuY2xhc3NMaXN0LmFkZChcImJvZHlcIik7XG4gICAgICAgIGNvbnN0IGhlYWRlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJoNFwiKTtcbiAgICAgICAgaGVhZGVyLmNsYXNzTGlzdC5hZGQoXCJuYW1lXCIpO1xuICAgICAgICBib2R5LmFwcGVuZENoaWxkKGhlYWRlcik7XG4gICAgICAgIHRoaXMuX25hbWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgaGVhZGVyLmFwcGVuZENoaWxkKHRoaXMuX25hbWUpO1xuICAgICAgICBjb25zdCB2ZXJzaW9ucyA9IHRoaXMuX2dldFZlcnNpb25zKCk7XG4gICAgICAgIGJvZHkuYXBwZW5kQ2hpbGQodmVyc2lvbnMpO1xuICAgICAgICBjb25zdCBzdGF0dXNJdGVtID0gdGhpcy5fZ2V0U3RhdHVzSXRlbSgpO1xuICAgICAgICBib2R5LmFwcGVuZENoaWxkKHN0YXR1c0l0ZW0pO1xuICAgICAgICBjb25zdCBtZXRhQ29udHJvbHMgPSB0aGlzLl9nZXRNZXRhQ29udHJvbHMoKTtcbiAgICAgICAgYm9keS5hcHBlbmRDaGlsZChtZXRhQ29udHJvbHMpO1xuICAgICAgICByZXR1cm4gYm9keTtcbiAgICB9XG4gICAgX2dldFByb2plY3RzKCkge1xuICAgICAgICB0aGlzLl9wcm9qZWN0cyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgIHRoaXMuX3Byb2plY3RzLmNsYXNzTGlzdC5hZGQoXCJtZXRhXCIsIFwibWV0YS1wcm9qZWN0c1wiKTtcbiAgICAgICAgY29uc3QgaGVhZGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgaGVhZGVyLmNsYXNzTGlzdC5hZGQoXCJoZWFkZXJcIik7XG4gICAgICAgIGhlYWRlci5pbm5lclRleHQgPSBcIlByb2plY3RzXCI7XG4gICAgICAgIHJldHVybiB0aGlzLl9wcm9qZWN0cztcbiAgICB9XG4gICAgX2dldEJ1dHRvbnMoKSB7XG4gICAgICAgIHRoaXMuX2J1dHRvbnMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICB0aGlzLl9idXR0b25zLmNsYXNzTGlzdC5hZGQoXCJzZWxlY3RvclwiLCBcImJ0bi1ncm91cFwiLCBcImJ0bi1ncm91cC14c1wiKTtcbiAgICAgICAgY29uc3QgbGVmdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgIGxlZnQuY2xhc3NMaXN0LmFkZChcImJ0blwiLCBcImJ0bi14c1wiLCBcImljb25cIiwgXCJpY29uLXRyaWFuZ2xlLWxlZnRcIik7XG4gICAgICAgIGxlZnQub25jbGljayA9IChlKSA9PiBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSksIFwib21uaXNoYXJwLWF0b206cHJldmlvdXMtc29sdXRpb24tc3RhdHVzXCIpO1xuICAgICAgICB0aGlzLl9idXR0b25zLmFwcGVuZENoaWxkKGxlZnQpO1xuICAgICAgICBjb25zdCByaWdodCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgIHJpZ2h0LmNsYXNzTGlzdC5hZGQoXCJidG5cIiwgXCJidG4teHNcIiwgXCJpY29uXCIsIFwiaWNvbi10cmlhbmdsZS1yaWdodFwiKTtcbiAgICAgICAgcmlnaHQub25jbGljayA9IChlKSA9PiBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSksIFwib21uaXNoYXJwLWF0b206bmV4dC1zb2x1dGlvbi1zdGF0dXNcIik7XG4gICAgICAgIHRoaXMuX2J1dHRvbnMuYXBwZW5kQ2hpbGQocmlnaHQpO1xuICAgICAgICByZXR1cm4gdGhpcy5fYnV0dG9ucztcbiAgICB9XG4gICAgY3JlYXRlZENhbGxiYWNrKCkge1xuICAgICAgICB0aGlzLm1vZGVsRGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIHRoaXMuY2xhc3NMaXN0LmFkZChcIm9tbmlzaGFycC1jYXJkXCIpO1xuICAgICAgICB0aGlzLl9nZXRCdXR0b25zKCk7XG4gICAgICAgIGNvbnN0IGJvZHkgPSB0aGlzLl9nZXRCb2R5KCk7XG4gICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQoYm9keSk7XG4gICAgICAgIGNvbnN0IHByb2plY3RzID0gdGhpcy5fZ2V0UHJvamVjdHMoKTtcbiAgICAgICAgdGhpcy5hcHBlbmRDaGlsZChwcm9qZWN0cyk7XG4gICAgfVxuICAgIGF0dGFjaGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMudmVyaWZ5UG9zaXRpb24oKTtcbiAgICB9XG4gICAgdXBkYXRlQ2FyZChtb2RlbCwgY291bnQpIHtcbiAgICAgICAgdGhpcy5tb2RlbCA9IG1vZGVsO1xuICAgICAgICB0aGlzLmNvdW50ID0gY291bnQ7XG4gICAgfVxuICAgIHZlcmlmeVBvc2l0aW9uKCkge1xuICAgICAgICBjb25zdCBvZmZzZXQgPSAkKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwodGhpcy5hdHRhY2hUbykpLm9mZnNldCgpO1xuICAgICAgICBpZiAob2Zmc2V0KSB7XG4gICAgICAgICAgICAkKHRoaXMpLmNzcyh7XG4gICAgICAgICAgICAgICAgcG9zaXRpb246IFwiZml4ZWRcIixcbiAgICAgICAgICAgICAgICB0b3A6IG9mZnNldC50b3AgLSB0aGlzLmNsaWVudEhlaWdodCxcbiAgICAgICAgICAgICAgICBsZWZ0OiBvZmZzZXQubGVmdFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5leHBvcnRzLlNvbHV0aW9uU3RhdHVzQ2FyZCA9IGRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudChcIm9tbmlzaGFycC1zb2x1dGlvbi1jYXJkXCIsIHsgcHJvdG90eXBlOiBTb2x1dGlvblN0YXR1c0NhcmQucHJvdG90eXBlIH0pO1xuIiwiaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xyXG5pbXBvcnQge1ZpZXdNb2RlbH0gZnJvbSBcIi4uL3NlcnZlci92aWV3LW1vZGVsXCI7XHJcbmltcG9ydCB7UHJvamVjdFZpZXdNb2RlbH0gZnJvbSBcIi4uL3NlcnZlci9wcm9qZWN0LXZpZXctbW9kZWxcIjtcclxuaW1wb3J0IHtEcml2ZXJTdGF0ZX0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcclxuaW1wb3J0IHtDb21wb3NpdGVEaXNwb3NhYmxlfSAgZnJvbSBcInRzLWRpc3Bvc2FibGVzXCI7XHJcbmNvbnN0ICQ6IEpRdWVyeVN0YXRpYyA9IHJlcXVpcmUoXCJqcXVlcnlcIik7XHJcbmxldCBmYXN0ZG9tOiB0eXBlb2YgRmFzdGRvbSA9IHJlcXVpcmUoXCJmYXN0ZG9tXCIpO1xyXG5pbXBvcnQge2Jhc2VuYW1lfSBmcm9tIFwicGF0aFwiO1xyXG5cclxuZnVuY3Rpb24gdHJ1bmNhdGVTdHJpbmdSZXZlcnNlKHN0cjogc3RyaW5nLCBtYXhMZW5ndGggPSA1NSkge1xyXG4gICAgY29uc3QgcmV2ZXJzZWRTdHJpbmcgPSBfLnRvQXJyYXkoc3RyKS5yZXZlcnNlKCkuam9pbihcIlwiKTtcclxuICAgIHJldHVybiBfLnRvQXJyYXkoXy50cnVuY2F0ZShyZXZlcnNlZFN0cmluZywgbWF4TGVuZ3RoKSkucmV2ZXJzZSgpLmpvaW4oXCJcIik7XHJcbn1cclxuXHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFByb2plY3REaXNwbGF5RWxlbWVudCBleHRlbmRzIEhUTUxEaXZFbGVtZW50IHtcclxuICAgIHByb2plY3Q6IFByb2plY3RWaWV3TW9kZWw8YW55PjtcclxuICAgIGtleTogc3RyaW5nO1xyXG59XHJcblxyXG5jb25zdCBnZXRNZXNzYWdlRWxlbWVudCA9IChmdW5jdGlvbigpIHtcclxuICAgIGNvbnN0IHByb2plY3RQcm9wcyA9IHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uIHByb2plY3QoKSB7IHJldHVybiB0aGlzLl9wcm9qZWN0OyB9LFxyXG4gICAgICAgIHNldDogZnVuY3Rpb24gcHJvamVjdChwcm9qZWN0OiBQcm9qZWN0Vmlld01vZGVsPGFueT4pIHtcclxuICAgICAgICAgICAgdGhpcy5fcHJvamVjdCA9IHByb2plY3Q7XHJcbiAgICAgICAgICAgIHRoaXMuX2tleSA9IHByb2plY3QucGF0aDtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IHBhdGggPSB0cnVuY2F0ZVN0cmluZ1JldmVyc2UocHJvamVjdC5wYXRoLnJlcGxhY2UodGhpcy5wcm9qZWN0LnNvbHV0aW9uUGF0aCwgXCJcIiksIDI0KTtcclxuICAgICAgICAgICAgdGhpcy50aXRsZSA9IGAke3BhdGh9IFske3Byb2plY3QuZnJhbWV3b3Jrcy5maWx0ZXIoeiA9PiB6Lk5hbWUgIT09IFwiYWxsXCIpLm1hcCh4ID0+IHguRnJpZW5kbHlOYW1lKX1dYDtcclxuICAgICAgICAgICAgdGhpcy5pbm5lclRleHQgPSBwcm9qZWN0Lm5hbWU7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBjb25zdCBrZXlQcm9wcyA9IHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uIGtleSgpIHsgcmV0dXJuIHRoaXMuX2tleTsgfVxyXG4gICAgfTtcclxuXHJcbiAgICByZXR1cm4gZnVuY3Rpb24gZ2V0TWVzc2FnZUVsZW1lbnQoKTogUHJvamVjdERpc3BsYXlFbGVtZW50IHtcclxuICAgICAgICBjb25zdCBlbGVtZW50OiBQcm9qZWN0RGlzcGxheUVsZW1lbnQgPSA8YW55PmRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkKFwicHJvamVjdFwiLCBcIm5hbWVcIik7XHJcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGVsZW1lbnQsIFwicHJvamVjdFwiLCBwcm9qZWN0UHJvcHMpO1xyXG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShlbGVtZW50LCBcImtleVwiLCBrZXlQcm9wcyk7XHJcblxyXG4gICAgICAgIHJldHVybiBlbGVtZW50O1xyXG4gICAgfTtcclxufSkoKTtcclxuXHJcbmV4cG9ydCBjbGFzcyBTb2x1dGlvblN0YXR1c0NhcmQgZXh0ZW5kcyBIVE1MRGl2RWxlbWVudCBpbXBsZW1lbnRzIFdlYkNvbXBvbmVudCB7XHJcbiAgICBwdWJsaWMgZGlzcGxheU5hbWUgPSBcIkNhcmRcIjtcclxuXHJcbiAgICBwcml2YXRlIG1vZGVsRGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxuICAgIHB1YmxpYyBhdHRhY2hUbzogc3RyaW5nO1xyXG5cclxuICAgIHByaXZhdGUgX25hbWU6IEhUTUxTcGFuRWxlbWVudDtcclxuICAgIHByaXZhdGUgX3Byb2plY3RzOiBIVE1MRGl2RWxlbWVudDtcclxuICAgIHByaXZhdGUgX2J1dHRvbnM6IEhUTUxEaXZFbGVtZW50O1xyXG4gICAgcHJpdmF0ZSBfYm9keTogSFRNTEVsZW1lbnQ7XHJcblxyXG4gICAgcHJpdmF0ZSBfc3RvcEJ0bjogSFRNTEJ1dHRvbkVsZW1lbnQ7XHJcbiAgICBwcml2YXRlIF9zdGFydEJ0bjogSFRNTEJ1dHRvbkVsZW1lbnQ7XHJcbiAgICBwcml2YXRlIF9yZXN0YXJ0QnRuOiBIVE1MQnV0dG9uRWxlbWVudDtcclxuXHJcbiAgICBwcml2YXRlIF9zdGF0dXNJdGVtOiBIVE1MU3BhbkVsZW1lbnQ7XHJcbiAgICBwcml2YXRlIF9zdGF0dXNUZXh0OiBIVE1MU3BhbkVsZW1lbnQ7XHJcbiAgICBwcml2YXRlIF9ydW50aW1lVGV4dDogSFRNTFNwYW5FbGVtZW50O1xyXG5cclxuICAgIHByaXZhdGUgX2NvdW50OiBudW1iZXI7XHJcbiAgICBwdWJsaWMgZ2V0IGNvdW50KCkgeyByZXR1cm4gdGhpcy5fY291bnQ7IH1cclxuICAgIHB1YmxpYyBzZXQgY291bnQoY291bnQpIHtcclxuICAgICAgICBpZiAodGhpcy5fY291bnQgIT09IGNvdW50KSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2NvdW50ID0gY291bnQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLl9jb3VudCA+IDEpIHtcclxuICAgICAgICAgICAgdGhpcy5fYm9keS5wYXJlbnRFbGVtZW50Lmluc2VydEJlZm9yZSh0aGlzLl9idXR0b25zLCB0aGlzLl9ib2R5KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLl9idXR0b25zLnJlbW92ZSgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9tb2RlbDogVmlld01vZGVsO1xyXG4gICAgcHVibGljIGdldCBtb2RlbCgpIHsgcmV0dXJuIHRoaXMuX21vZGVsOyB9XHJcbiAgICBwdWJsaWMgc2V0IG1vZGVsKG1vZGVsKSB7XHJcbiAgICAgICAgdGhpcy5fbW9kZWwgPSBtb2RlbDtcclxuICAgICAgICB0aGlzLm1vZGVsRGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICAgICAgdGhpcy5tb2RlbERpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG5cclxuICAgICAgICB0aGlzLm1vZGVsRGlzcG9zYWJsZS5hZGQodGhpcy5fbW9kZWwub2JzZXJ2ZS5zdGF0ZS5kZWxheSgxMCkuc3Vic2NyaWJlKCh7aW5kZXgsIHBhdGgsIC8qcnVudGltZSwqLyBzdGF0ZSwgaXNSZWFkeSwgaXNPZmYsIGlzT259KSA9PiB7XHJcbiAgICAgICAgICAgIGZhc3Rkb20ubXV0YXRlKCgpID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IG5hbWUgPSBgJHtiYXNlbmFtZShwYXRoKX0gKCR7aW5kZXh9KWA7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fbmFtZS5pbm5lclRleHQgIT09IG5hbWUpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9uYW1lLmlubmVyVGV4dCA9IG5hbWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHN0YXRlID09PSBEcml2ZXJTdGF0ZS5Db25uZWN0ZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9zdGF0dXNUZXh0LmlubmVyVGV4dCA9IFwiT25saW5lXCI7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHN0YXRlID09PSBEcml2ZXJTdGF0ZS5Db25uZWN0aW5nKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc3RhdHVzVGV4dC5pbm5lclRleHQgPSBcIkxvYWRpbmdcIjtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoc3RhdGUgPT09IERyaXZlclN0YXRlLkRpc2Nvbm5lY3RlZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3N0YXR1c1RleHQuaW5uZXJUZXh0ID0gXCJPZmZsaW5lXCI7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3N0YXR1c1RleHQuaW5uZXJUZXh0ID0gRHJpdmVyU3RhdGVbc3RhdGVdO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChpc1JlYWR5KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc3RhcnRCdG4uc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3N0b3BCdG4uc3R5bGUuZGlzcGxheSA9IFwiXCI7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGlzT2ZmKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc3RhcnRCdG4uc3R5bGUuZGlzcGxheSA9IFwiXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc3RvcEJ0bi5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3N0YXJ0QnRuLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9zdG9wQnRuLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoaXNPbikge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Jlc3RhcnRCdG4uc3R5bGUuZGlzcGxheSA9IFwiXCI7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Jlc3RhcnRCdG4uc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChpc09mZikge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Byb2plY3RzLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcHJvamVjdHMuc3R5bGUuZGlzcGxheSA9IFwiXCI7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy90aGlzLl9zdGF0dXNUZXh0LmlubmVyVGV4dCA9IERyaXZlclN0YXRlW3N0YXRlXTtcclxuICAgICAgICAgICAgICAgIHRoaXMuX3N0YXR1c0l0ZW0uY2xhc3NOYW1lID0gXCJwdWxsLWxlZnQgc3RhdHMtaXRlbVwiO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fc3RhdHVzSXRlbS5jbGFzc0xpc3QuYWRkKERyaXZlclN0YXRlW3N0YXRlXS50b0xvd2VyQ2FzZSgpKTtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLnZlcmlmeVBvc2l0aW9uKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgLyppZiAocnVudGltZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3J1bnRpbWVUZXh0LnN0eWxlLmRpc3BsYXkgPSBcIlwiO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3J1bnRpbWVUZXh0LmlubmVyVGV4dCA9IHJ1bnRpbWU7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgeyovXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcnVudGltZVRleHQuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3J1bnRpbWVUZXh0LmlubmVyVGV4dCA9IFwiXCI7XHJcbiAgICAgICAgICAgICAgICAvKn0qL1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMubW9kZWxEaXNwb3NhYmxlLmFkZCh0aGlzLl9tb2RlbC5vYnNlcnZlLnByb2plY3RzLnN1YnNjcmliZShwcm9qZWN0cyA9PiB7XHJcbiAgICAgICAgICAgIGZhc3Rkb20ubXV0YXRlKCgpID0+IHtcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwLCBsZW4gPSB0aGlzLl9wcm9qZWN0cy5jaGlsZHJlbi5sZW5ndGggPiBwcm9qZWN0cy5sZW5ndGggPyB0aGlzLl9wcm9qZWN0cy5jaGlsZHJlbi5sZW5ndGggOiBwcm9qZWN0cy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW0gPSBwcm9qZWN0c1tpXTtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgY2hpbGQ6IFByb2plY3REaXNwbGF5RWxlbWVudCA9IDxhbnk+dGhpcy5fcHJvamVjdHMuY2hpbGRyZW5baV07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICghaXRlbSAmJiBjaGlsZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGlsZC5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChpdGVtICYmICFjaGlsZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGlsZCA9IGdldE1lc3NhZ2VFbGVtZW50KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3Byb2plY3RzLmFwcGVuZENoaWxkKGNoaWxkKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChjaGlsZCAmJiBjaGlsZC5rZXkgIT09IGl0ZW0ucGF0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGlsZC5wcm9qZWN0ID0gaXRlbTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy52ZXJpZnlQb3NpdGlvbigpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfZ2V0TWV0YUNvbnRyb2xzKCkge1xyXG4gICAgICAgIHRoaXMuX3N0b3BCdG4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpO1xyXG4gICAgICAgIHRoaXMuX3N0b3BCdG4uY2xhc3NMaXN0LmFkZChcImJ0blwiLCBcImJ0bi14c1wiLCBcImJ0bi1lcnJvclwiKTtcclxuICAgICAgICB0aGlzLl9zdG9wQnRuLm9uY2xpY2sgPSAoKSA9PiBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSksIFwib21uaXNoYXJwLWF0b206c3RvcC1zZXJ2ZXJcIik7XHJcblxyXG4gICAgICAgIGxldCBzcGFuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XHJcbiAgICAgICAgc3Bhbi5jbGFzc0xpc3QuYWRkKFwiZmFcIiwgXCJmYS1zdG9wXCIpO1xyXG4gICAgICAgIHRoaXMuX3N0b3BCdG4uYXBwZW5kQ2hpbGQoc3Bhbik7XHJcbiAgICAgICAgdGhpcy5fc3RvcEJ0bi5pbm5lckhUTUwgKz0gXCIgU3RvcFwiO1xyXG5cclxuICAgICAgICB0aGlzLl9zdGFydEJ0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XHJcbiAgICAgICAgdGhpcy5fc3RhcnRCdG4uY2xhc3NMaXN0LmFkZChcImJ0blwiLCBcImJ0bi14c1wiLCBcImJ0bi1zdWNjZXNzXCIpO1xyXG4gICAgICAgIHRoaXMuX3N0YXJ0QnRuLm9uY2xpY2sgPSAoKSA9PiBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSksIFwib21uaXNoYXJwLWF0b206c3RhcnQtc2VydmVyXCIpO1xyXG5cclxuICAgICAgICBzcGFuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XHJcbiAgICAgICAgc3Bhbi5jbGFzc0xpc3QuYWRkKFwiZmFcIiwgXCJmYS1wbGF5XCIpO1xyXG4gICAgICAgIHRoaXMuX3N0YXJ0QnRuLmFwcGVuZENoaWxkKHNwYW4pO1xyXG4gICAgICAgIHRoaXMuX3N0YXJ0QnRuLmlubmVySFRNTCArPSBcIiBTdGFydFwiO1xyXG5cclxuICAgICAgICB0aGlzLl9yZXN0YXJ0QnRuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImJ1dHRvblwiKTtcclxuICAgICAgICB0aGlzLl9yZXN0YXJ0QnRuLmNsYXNzTGlzdC5hZGQoXCJidG5cIiwgXCJidG4teHNcIiwgXCJidG4taW5mb1wiKTtcclxuICAgICAgICB0aGlzLl9yZXN0YXJ0QnRuLm9uY2xpY2sgPSAoKSA9PiBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSksIFwib21uaXNoYXJwLWF0b206cmVzdGFydC1zZXJ2ZXJcIik7XHJcblxyXG4gICAgICAgIHNwYW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcclxuICAgICAgICBzcGFuLmNsYXNzTGlzdC5hZGQoXCJmYVwiLCBcImZhLXJlZnJlc2hcIik7XHJcbiAgICAgICAgdGhpcy5fcmVzdGFydEJ0bi5hcHBlbmRDaGlsZChzcGFuKTtcclxuICAgICAgICB0aGlzLl9yZXN0YXJ0QnRuLmlubmVySFRNTCArPSBcIiBSZXN0YXJ0XCI7XHJcblxyXG4gICAgICAgIGNvbnN0IG1ldGFDb250cm9scyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgICAgICAgbWV0YUNvbnRyb2xzLmNsYXNzTGlzdC5hZGQoXCJtZXRhLWNvbnRyb2xzXCIpO1xyXG5cclxuICAgICAgICBjb25zdCBidXR0b25Hcm91cCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgICAgICAgYnV0dG9uR3JvdXAuY2xhc3NMaXN0LmFkZChcImJ0bi1ncm91cFwiKTtcclxuICAgICAgICBtZXRhQ29udHJvbHMuYXBwZW5kQ2hpbGQoYnV0dG9uR3JvdXApO1xyXG5cclxuICAgICAgICBidXR0b25Hcm91cC5hcHBlbmRDaGlsZCh0aGlzLl9zdGFydEJ0bik7XHJcbiAgICAgICAgYnV0dG9uR3JvdXAuYXBwZW5kQ2hpbGQodGhpcy5fc3RvcEJ0bik7XHJcbiAgICAgICAgYnV0dG9uR3JvdXAuYXBwZW5kQ2hpbGQodGhpcy5fcmVzdGFydEJ0bik7XHJcblxyXG4gICAgICAgIHJldHVybiBtZXRhQ29udHJvbHM7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfZ2V0U3RhdHVzSXRlbSgpIHtcclxuICAgICAgICB0aGlzLl9zdGF0dXNJdGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XHJcbiAgICAgICAgdGhpcy5fc3RhdHVzSXRlbS5jbGFzc0xpc3QuYWRkKFwicHVsbC1sZWZ0XCIsIFwic3RhdHMtaXRlbVwiKTtcclxuXHJcbiAgICAgICAgY29uc3Qgc3RhdHVzQ29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XHJcbiAgICAgICAgdGhpcy5fc3RhdHVzSXRlbS5hcHBlbmRDaGlsZChzdGF0dXNDb250YWluZXIpO1xyXG4gICAgICAgIGNvbnN0IGljb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcclxuICAgICAgICBzdGF0dXNDb250YWluZXIuYXBwZW5kQ2hpbGQoaWNvbik7XHJcbiAgICAgICAgaWNvbi5jbGFzc0xpc3QuYWRkKFwiaWNvblwiLCBcImljb24temFwXCIpO1xyXG5cclxuICAgICAgICB0aGlzLl9zdGF0dXNUZXh0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XHJcbiAgICAgICAgc3RhdHVzQ29udGFpbmVyLmFwcGVuZENoaWxkKHRoaXMuX3N0YXR1c1RleHQpO1xyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy5fc3RhdHVzSXRlbTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9nZXRWZXJzaW9ucygpIHtcclxuICAgICAgICBjb25zdCB2ZXJzaW9ucyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xyXG4gICAgICAgIHZlcnNpb25zLmNsYXNzTGlzdC5hZGQoXCJwdWxsLXJpZ2h0XCIsIFwic3RhdHMtaXRlbVwiKTtcclxuXHJcbiAgICAgICAgY29uc3Qgc3BhbnMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcclxuICAgICAgICBzcGFucy5jbGFzc0xpc3QuYWRkKFwiaWNvblwiLCBcImljb24tdmVyc2lvbnNcIik7XHJcbiAgICAgICAgdmVyc2lvbnMuYXBwZW5kQ2hpbGQoc3BhbnMpO1xyXG5cclxuICAgICAgICB0aGlzLl9ydW50aW1lVGV4dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xyXG4gICAgICAgIHZlcnNpb25zLmFwcGVuZENoaWxkKHRoaXMuX3J1bnRpbWVUZXh0KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHZlcnNpb25zO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX2dldEJvZHkoKSB7XHJcbiAgICAgICAgY29uc3QgYm9keSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgICAgICAgdGhpcy5fYm9keSA9IGJvZHk7XHJcbiAgICAgICAgYm9keS5jbGFzc0xpc3QuYWRkKFwiYm9keVwiKTtcclxuXHJcbiAgICAgICAgY29uc3QgaGVhZGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImg0XCIpO1xyXG4gICAgICAgIGhlYWRlci5jbGFzc0xpc3QuYWRkKFwibmFtZVwiKTtcclxuICAgICAgICBib2R5LmFwcGVuZENoaWxkKGhlYWRlcik7XHJcblxyXG4gICAgICAgIHRoaXMuX25hbWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcclxuICAgICAgICBoZWFkZXIuYXBwZW5kQ2hpbGQodGhpcy5fbmFtZSk7XHJcblxyXG4gICAgICAgIGNvbnN0IHZlcnNpb25zID0gdGhpcy5fZ2V0VmVyc2lvbnMoKTtcclxuICAgICAgICBib2R5LmFwcGVuZENoaWxkKHZlcnNpb25zKTtcclxuXHJcbiAgICAgICAgY29uc3Qgc3RhdHVzSXRlbSA9IHRoaXMuX2dldFN0YXR1c0l0ZW0oKTtcclxuICAgICAgICBib2R5LmFwcGVuZENoaWxkKHN0YXR1c0l0ZW0pO1xyXG5cclxuICAgICAgICBjb25zdCBtZXRhQ29udHJvbHMgPSB0aGlzLl9nZXRNZXRhQ29udHJvbHMoKTtcclxuICAgICAgICBib2R5LmFwcGVuZENoaWxkKG1ldGFDb250cm9scyk7XHJcblxyXG4gICAgICAgIHJldHVybiBib2R5O1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX2dldFByb2plY3RzKCkge1xyXG4gICAgICAgIHRoaXMuX3Byb2plY3RzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuICAgICAgICB0aGlzLl9wcm9qZWN0cy5jbGFzc0xpc3QuYWRkKFwibWV0YVwiLCBcIm1ldGEtcHJvamVjdHNcIik7XHJcblxyXG4gICAgICAgIGNvbnN0IGhlYWRlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgICAgICAgaGVhZGVyLmNsYXNzTGlzdC5hZGQoXCJoZWFkZXJcIik7XHJcbiAgICAgICAgaGVhZGVyLmlubmVyVGV4dCA9IFwiUHJvamVjdHNcIjtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX3Byb2plY3RzO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX2dldEJ1dHRvbnMoKSB7XHJcbiAgICAgICAgdGhpcy5fYnV0dG9ucyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgICAgICAgdGhpcy5fYnV0dG9ucy5jbGFzc0xpc3QuYWRkKFwic2VsZWN0b3JcIiwgXCJidG4tZ3JvdXBcIiwgXCJidG4tZ3JvdXAteHNcIik7XHJcblxyXG4gICAgICAgIGNvbnN0IGxlZnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gICAgICAgIGxlZnQuY2xhc3NMaXN0LmFkZChcImJ0blwiLCBcImJ0bi14c1wiLCBcImljb25cIiwgXCJpY29uLXRyaWFuZ2xlLWxlZnRcIik7XHJcbiAgICAgICAgbGVmdC5vbmNsaWNrID0gKGUpID0+IGF0b20uY29tbWFuZHMuZGlzcGF0Y2goYXRvbS52aWV3cy5nZXRWaWV3KGF0b20ud29ya3NwYWNlKSwgXCJvbW5pc2hhcnAtYXRvbTpwcmV2aW91cy1zb2x1dGlvbi1zdGF0dXNcIik7XHJcbiAgICAgICAgdGhpcy5fYnV0dG9ucy5hcHBlbmRDaGlsZChsZWZ0KTtcclxuXHJcbiAgICAgICAgY29uc3QgcmlnaHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gICAgICAgIHJpZ2h0LmNsYXNzTGlzdC5hZGQoXCJidG5cIiwgXCJidG4teHNcIiwgXCJpY29uXCIsIFwiaWNvbi10cmlhbmdsZS1yaWdodFwiKTtcclxuICAgICAgICByaWdodC5vbmNsaWNrID0gKGUpID0+IGF0b20uY29tbWFuZHMuZGlzcGF0Y2goYXRvbS52aWV3cy5nZXRWaWV3KGF0b20ud29ya3NwYWNlKSwgXCJvbW5pc2hhcnAtYXRvbTpuZXh0LXNvbHV0aW9uLXN0YXR1c1wiKTtcclxuICAgICAgICB0aGlzLl9idXR0b25zLmFwcGVuZENoaWxkKHJpZ2h0KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2J1dHRvbnM7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNyZWF0ZWRDYWxsYmFjaygpIHtcclxuICAgICAgICB0aGlzLm1vZGVsRGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcblxyXG4gICAgICAgIHRoaXMuY2xhc3NMaXN0LmFkZChcIm9tbmlzaGFycC1jYXJkXCIpO1xyXG5cclxuICAgICAgICB0aGlzLl9nZXRCdXR0b25zKCk7XHJcblxyXG4gICAgICAgIGNvbnN0IGJvZHkgPSB0aGlzLl9nZXRCb2R5KCk7XHJcbiAgICAgICAgdGhpcy5hcHBlbmRDaGlsZChib2R5KTtcclxuXHJcbiAgICAgICAgY29uc3QgcHJvamVjdHMgPSB0aGlzLl9nZXRQcm9qZWN0cygpO1xyXG4gICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQocHJvamVjdHMpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBhdHRhY2hlZENhbGxiYWNrKCkge1xyXG4gICAgICAgIHRoaXMudmVyaWZ5UG9zaXRpb24oKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgdXBkYXRlQ2FyZChtb2RlbDogVmlld01vZGVsLCBjb3VudDogbnVtYmVyKSB7XHJcbiAgICAgICAgdGhpcy5tb2RlbCA9IG1vZGVsO1xyXG4gICAgICAgIHRoaXMuY291bnQgPSBjb3VudDtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHZlcmlmeVBvc2l0aW9uKCkge1xyXG4gICAgICAgIGNvbnN0IG9mZnNldCA9ICQoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCh0aGlzLmF0dGFjaFRvKSkub2Zmc2V0KCk7XHJcbiAgICAgICAgaWYgKG9mZnNldCkge1xyXG4gICAgICAgICAgICAkKHRoaXMpLmNzcyh7XHJcbiAgICAgICAgICAgICAgICBwb3NpdGlvbjogXCJmaXhlZFwiLFxyXG4gICAgICAgICAgICAgICAgdG9wOiBvZmZzZXQudG9wIC0gdGhpcy5jbGllbnRIZWlnaHQsXHJcbiAgICAgICAgICAgICAgICBsZWZ0OiBvZmZzZXQubGVmdFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbig8YW55PmV4cG9ydHMpLlNvbHV0aW9uU3RhdHVzQ2FyZCA9ICg8YW55PmRvY3VtZW50KS5yZWdpc3RlckVsZW1lbnQoXCJvbW5pc2hhcnAtc29sdXRpb24tY2FyZFwiLCB7IHByb3RvdHlwZTogU29sdXRpb25TdGF0dXNDYXJkLnByb3RvdHlwZSB9KTtcclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
