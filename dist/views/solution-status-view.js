"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.SolutionStatusCard = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _omnisharpClient = require("omnisharp-client");

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
        var _Object$getPrototypeO;

        _classCallCheck(this, SolutionStatusCard);

        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
        }

        var _this = _possibleConstructorReturn(this, (_Object$getPrototypeO = Object.getPrototypeOf(SolutionStatusCard)).call.apply(_Object$getPrototypeO, [this].concat(args)));

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
            this.modelDisposable = new _omnisharpClient.CompositeDisposable();
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
            this.modelDisposable = new _omnisharpClient.CompositeDisposable();
            this.modelDisposable.add(this._model.observe.state.delay(10).subscribe(function (_ref) {
                var index = _ref.index;
                var path = _ref.path;
                var state = _ref.state;
                var isReady = _ref.isReady;
                var isOff = _ref.isOff;
                var isOn = _ref.isOn;

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy9zb2x1dGlvbi1zdGF0dXMtdmlldy5qcyIsImxpYi92aWV3cy9zb2x1dGlvbi1zdGF0dXMtdmlldy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7OztBQUNBOztBQUlBOzs7Ozs7Ozs7O0FDQUEsSUFBTSxJQUFrQixRQUFRLFFBQVIsQ0FBbEI7QUFDTixJQUFJLFVBQTBCLFFBQVEsU0FBUixDQUExQjs7QUFHSixTQUFBLHFCQUFBLENBQStCLEdBQS9CLEVBQTBEO1FBQWQsa0VBQVksa0JBQUU7O0FBQ3RELFFBQU0saUJBQWlCLGlCQUFFLE9BQUYsQ0FBVSxHQUFWLEVBQWUsT0FBZixHQUF5QixJQUF6QixDQUE4QixFQUE5QixDQUFqQixDQURnRDtBQUV0RCxXQUFPLGlCQUFFLE9BQUYsQ0FBVSxpQkFBRSxRQUFGLENBQVcsY0FBWCxFQUEyQixTQUEzQixDQUFWLEVBQWlELE9BQWpELEdBQTJELElBQTNELENBQWdFLEVBQWhFLENBQVAsQ0FGc0Q7Q0FBMUQ7QUFXQSxJQUFNLG9CQUFvQixZQUFDO0FBQ3ZCLFFBQU0sZUFBZTtBQUNqQixhQUFLLFNBQUEsT0FBQSxHQUFBO0FBQXFCLG1CQUFPLEtBQUssUUFBTCxDQUE1QjtTQUFBO0FBQ0wsYUFBSyxTQUFBLE9BQUEsQ0FBaUIsT0FBakIsRUFBK0M7QUFDaEQsaUJBQUssUUFBTCxHQUFnQixPQUFoQixDQURnRDtBQUVoRCxpQkFBSyxJQUFMLEdBQVksUUFBUSxJQUFSLENBRm9DO0FBSWhELGdCQUFNLE9BQU8sc0JBQXNCLFFBQVEsSUFBUixDQUFhLE9BQWIsQ0FBcUIsS0FBSyxPQUFMLENBQWEsWUFBYixFQUEyQixFQUFoRCxDQUF0QixFQUEyRSxFQUEzRSxDQUFQLENBSjBDO0FBS2hELGlCQUFLLEtBQUwsR0FBZ0IsY0FBUyxRQUFRLFVBQVIsQ0FBbUIsTUFBbkIsQ0FBMEI7dUJBQUssRUFBRSxJQUFGLEtBQVcsS0FBWDthQUFMLENBQTFCLENBQWlELEdBQWpE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QixrQ0FBTSxNQUFOLEdBRGdCO0FBRWhCLHFDQUZnQjt5QkFBcEIsTUFHTyxJQUFJLFFBQVEsQ0FBQyxLQUFELEVBQVE7QUFDdkIsb0NBQVEsbUJBQVIsQ0FEdUI7QUFFdkIsbUNBQUssU0FBTCxDQUFlLFdBQWYsQ0FBMkIsS0FBM0IsRUFGdUI7eUJBQXBCO0FBS1AsNEJBQUksU0FBUyxNQUFNLEdBQU4sS0FBYyxLQUFLLElBQUwsRUFBVztBQUNsQyxrQ0FBTSxPQUFOLEdBQWdCLElBQWhCLENBRGtDO3lCQUF0QztxQkFaSjtBQWlCQSwyQkFBSyxjQUFMLEdBbEJXO2lCQUFBLENBQWYsQ0FEb0U7YUFBUixDQUFoRSxFQTdEa0I7Ozs7O0VBbENjOztBQXNSbEMsUUFBUyxrQkFBVCxHQUFvQyxTQUFVLGVBQVYsQ0FBMEIseUJBQTFCLEVBQXFELEVBQUUsV0FBVyxtQkFBbUIsU0FBbkIsRUFBbEUsQ0FBcEMiLCJmaWxlIjoibGliL3ZpZXdzL3NvbHV0aW9uLXN0YXR1cy12aWV3LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xuaW1wb3J0IHsgRHJpdmVyU3RhdGUgfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSB9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XG5jb25zdCAkID0gcmVxdWlyZShcImpxdWVyeVwiKTtcbmxldCBmYXN0ZG9tID0gcmVxdWlyZShcImZhc3Rkb21cIik7XG5pbXBvcnQgeyBiYXNlbmFtZSB9IGZyb20gXCJwYXRoXCI7XG5mdW5jdGlvbiB0cnVuY2F0ZVN0cmluZ1JldmVyc2Uoc3RyLCBtYXhMZW5ndGggPSA1NSkge1xuICAgIGNvbnN0IHJldmVyc2VkU3RyaW5nID0gXy50b0FycmF5KHN0cikucmV2ZXJzZSgpLmpvaW4oXCJcIik7XG4gICAgcmV0dXJuIF8udG9BcnJheShfLnRydW5jYXRlKHJldmVyc2VkU3RyaW5nLCBtYXhMZW5ndGgpKS5yZXZlcnNlKCkuam9pbihcIlwiKTtcbn1cbmNvbnN0IGdldE1lc3NhZ2VFbGVtZW50ID0gKGZ1bmN0aW9uICgpIHtcbiAgICBjb25zdCBwcm9qZWN0UHJvcHMgPSB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gcHJvamVjdCgpIHsgcmV0dXJuIHRoaXMuX3Byb2plY3Q7IH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gcHJvamVjdChwcm9qZWN0KSB7XG4gICAgICAgICAgICB0aGlzLl9wcm9qZWN0ID0gcHJvamVjdDtcbiAgICAgICAgICAgIHRoaXMuX2tleSA9IHByb2plY3QucGF0aDtcbiAgICAgICAgICAgIGNvbnN0IHBhdGggPSB0cnVuY2F0ZVN0cmluZ1JldmVyc2UocHJvamVjdC5wYXRoLnJlcGxhY2UodGhpcy5wcm9qZWN0LnNvbHV0aW9uUGF0aCwgXCJcIiksIDI0KTtcbiAgICAgICAgICAgIHRoaXMudGl0bGUgPSBgJHtwYXRofSBbJHtwcm9qZWN0LmZyYW1ld29ya3MuZmlsdGVyKHogPT4gei5OYW1lICE9PSBcImFsbFwiKS5tYXAoeCA9PiB4LkZyaWVuZGx5TmFtZSl9XWA7XG4gICAgICAgICAgICB0aGlzLmlubmVyVGV4dCA9IHByb2plY3QubmFtZTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgY29uc3Qga2V5UHJvcHMgPSB7XG4gICAgICAgIGdldDogZnVuY3Rpb24ga2V5KCkgeyByZXR1cm4gdGhpcy5fa2V5OyB9XG4gICAgfTtcbiAgICByZXR1cm4gZnVuY3Rpb24gZ2V0TWVzc2FnZUVsZW1lbnQoKSB7XG4gICAgICAgIGNvbnN0IGVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5hZGQoXCJwcm9qZWN0XCIsIFwibmFtZVwiKTtcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGVsZW1lbnQsIFwicHJvamVjdFwiLCBwcm9qZWN0UHJvcHMpO1xuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZWxlbWVudCwgXCJrZXlcIiwga2V5UHJvcHMpO1xuICAgICAgICByZXR1cm4gZWxlbWVudDtcbiAgICB9O1xufSkoKTtcbmV4cG9ydCBjbGFzcyBTb2x1dGlvblN0YXR1c0NhcmQgZXh0ZW5kcyBIVE1MRGl2RWxlbWVudCB7XG4gICAgY29uc3RydWN0b3IoLi4uYXJncykge1xuICAgICAgICBzdXBlciguLi5hcmdzKTtcbiAgICAgICAgdGhpcy5kaXNwbGF5TmFtZSA9IFwiQ2FyZFwiO1xuICAgIH1cbiAgICBnZXQgY291bnQoKSB7IHJldHVybiB0aGlzLl9jb3VudDsgfVxuICAgIHNldCBjb3VudChjb3VudCkge1xuICAgICAgICBpZiAodGhpcy5fY291bnQgIT09IGNvdW50KSB7XG4gICAgICAgICAgICB0aGlzLl9jb3VudCA9IGNvdW50O1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLl9jb3VudCA+IDEpIHtcbiAgICAgICAgICAgIHRoaXMuX2JvZHkucGFyZW50RWxlbWVudC5pbnNlcnRCZWZvcmUodGhpcy5fYnV0dG9ucywgdGhpcy5fYm9keSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9idXR0b25zLnJlbW92ZSgpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGdldCBtb2RlbCgpIHsgcmV0dXJuIHRoaXMuX21vZGVsOyB9XG4gICAgc2V0IG1vZGVsKG1vZGVsKSB7XG4gICAgICAgIHRoaXMuX21vZGVsID0gbW9kZWw7XG4gICAgICAgIHRoaXMubW9kZWxEaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICAgICAgdGhpcy5tb2RlbERpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICB0aGlzLm1vZGVsRGlzcG9zYWJsZS5hZGQodGhpcy5fbW9kZWwub2JzZXJ2ZS5zdGF0ZS5kZWxheSgxMCkuc3Vic2NyaWJlKCh7IGluZGV4LCBwYXRoLCBzdGF0ZSwgaXNSZWFkeSwgaXNPZmYsIGlzT24gfSkgPT4ge1xuICAgICAgICAgICAgZmFzdGRvbS5tdXRhdGUoKCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IG5hbWUgPSBgJHtiYXNlbmFtZShwYXRoKX0gKCR7aW5kZXh9KWA7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX25hbWUuaW5uZXJUZXh0ICE9PSBuYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX25hbWUuaW5uZXJUZXh0ID0gbmFtZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHN0YXRlID09PSBEcml2ZXJTdGF0ZS5Db25uZWN0ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc3RhdHVzVGV4dC5pbm5lclRleHQgPSBcIk9ubGluZVwiO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChzdGF0ZSA9PT0gRHJpdmVyU3RhdGUuQ29ubmVjdGluZykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9zdGF0dXNUZXh0LmlubmVyVGV4dCA9IFwiTG9hZGluZ1wiO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChzdGF0ZSA9PT0gRHJpdmVyU3RhdGUuRGlzY29ubmVjdGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3N0YXR1c1RleHQuaW5uZXJUZXh0ID0gXCJPZmZsaW5lXCI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9zdGF0dXNUZXh0LmlubmVyVGV4dCA9IERyaXZlclN0YXRlW3N0YXRlXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGlzUmVhZHkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc3RhcnRCdG4uc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9zdG9wQnRuLnN0eWxlLmRpc3BsYXkgPSBcIlwiO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChpc09mZikge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9zdGFydEJ0bi5zdHlsZS5kaXNwbGF5ID0gXCJcIjtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc3RvcEJ0bi5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9zdGFydEJ0bi5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3N0b3BCdG4uc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoaXNPbikge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9yZXN0YXJ0QnRuLnN0eWxlLmRpc3BsYXkgPSBcIlwiO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcmVzdGFydEJ0bi5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChpc09mZikge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9wcm9qZWN0cy5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9wcm9qZWN0cy5zdHlsZS5kaXNwbGF5ID0gXCJcIjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5fc3RhdHVzSXRlbS5jbGFzc05hbWUgPSBcInB1bGwtbGVmdCBzdGF0cy1pdGVtXCI7XG4gICAgICAgICAgICAgICAgdGhpcy5fc3RhdHVzSXRlbS5jbGFzc0xpc3QuYWRkKERyaXZlclN0YXRlW3N0YXRlXS50b0xvd2VyQ2FzZSgpKTtcbiAgICAgICAgICAgICAgICB0aGlzLnZlcmlmeVBvc2l0aW9uKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5fcnVudGltZVRleHQuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICAgICAgICAgIHRoaXMuX3J1bnRpbWVUZXh0LmlubmVyVGV4dCA9IFwiXCI7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLm1vZGVsRGlzcG9zYWJsZS5hZGQodGhpcy5fbW9kZWwub2JzZXJ2ZS5wcm9qZWN0cy5zdWJzY3JpYmUocHJvamVjdHMgPT4ge1xuICAgICAgICAgICAgZmFzdGRvbS5tdXRhdGUoKCkgPT4ge1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwLCBsZW4gPSB0aGlzLl9wcm9qZWN0cy5jaGlsZHJlbi5sZW5ndGggPiBwcm9qZWN0cy5sZW5ndGggPyB0aGlzLl9wcm9qZWN0cy5jaGlsZHJlbi5sZW5ndGggOiBwcm9qZWN0cy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBpdGVtID0gcHJvamVjdHNbaV07XG4gICAgICAgICAgICAgICAgICAgIGxldCBjaGlsZCA9IHRoaXMuX3Byb2plY3RzLmNoaWxkcmVuW2ldO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWl0ZW0gJiYgY2hpbGQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkLnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoaXRlbSAmJiAhY2hpbGQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkID0gZ2V0TWVzc2FnZUVsZW1lbnQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3Byb2plY3RzLmFwcGVuZENoaWxkKGNoaWxkKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoY2hpbGQgJiYgY2hpbGQua2V5ICE9PSBpdGVtLnBhdGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkLnByb2plY3QgPSBpdGVtO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMudmVyaWZ5UG9zaXRpb24oKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KSk7XG4gICAgfVxuICAgIF9nZXRNZXRhQ29udHJvbHMoKSB7XG4gICAgICAgIHRoaXMuX3N0b3BCdG4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpO1xuICAgICAgICB0aGlzLl9zdG9wQnRuLmNsYXNzTGlzdC5hZGQoXCJidG5cIiwgXCJidG4teHNcIiwgXCJidG4tZXJyb3JcIik7XG4gICAgICAgIHRoaXMuX3N0b3BCdG4ub25jbGljayA9ICgpID0+IGF0b20uY29tbWFuZHMuZGlzcGF0Y2goYXRvbS52aWV3cy5nZXRWaWV3KGF0b20ud29ya3NwYWNlKSwgXCJvbW5pc2hhcnAtYXRvbTpzdG9wLXNlcnZlclwiKTtcbiAgICAgICAgbGV0IHNwYW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgc3Bhbi5jbGFzc0xpc3QuYWRkKFwiZmFcIiwgXCJmYS1zdG9wXCIpO1xuICAgICAgICB0aGlzLl9zdG9wQnRuLmFwcGVuZENoaWxkKHNwYW4pO1xuICAgICAgICB0aGlzLl9zdG9wQnRuLmlubmVySFRNTCArPSBcIiBTdG9wXCI7XG4gICAgICAgIHRoaXMuX3N0YXJ0QnRuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImJ1dHRvblwiKTtcbiAgICAgICAgdGhpcy5fc3RhcnRCdG4uY2xhc3NMaXN0LmFkZChcImJ0blwiLCBcImJ0bi14c1wiLCBcImJ0bi1zdWNjZXNzXCIpO1xuICAgICAgICB0aGlzLl9zdGFydEJ0bi5vbmNsaWNrID0gKCkgPT4gYXRvbS5jb21tYW5kcy5kaXNwYXRjaChhdG9tLnZpZXdzLmdldFZpZXcoYXRvbS53b3Jrc3BhY2UpLCBcIm9tbmlzaGFycC1hdG9tOnN0YXJ0LXNlcnZlclwiKTtcbiAgICAgICAgc3BhbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICBzcGFuLmNsYXNzTGlzdC5hZGQoXCJmYVwiLCBcImZhLXBsYXlcIik7XG4gICAgICAgIHRoaXMuX3N0YXJ0QnRuLmFwcGVuZENoaWxkKHNwYW4pO1xuICAgICAgICB0aGlzLl9zdGFydEJ0bi5pbm5lckhUTUwgKz0gXCIgU3RhcnRcIjtcbiAgICAgICAgdGhpcy5fcmVzdGFydEJ0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XG4gICAgICAgIHRoaXMuX3Jlc3RhcnRCdG4uY2xhc3NMaXN0LmFkZChcImJ0blwiLCBcImJ0bi14c1wiLCBcImJ0bi1pbmZvXCIpO1xuICAgICAgICB0aGlzLl9yZXN0YXJ0QnRuLm9uY2xpY2sgPSAoKSA9PiBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSksIFwib21uaXNoYXJwLWF0b206cmVzdGFydC1zZXJ2ZXJcIik7XG4gICAgICAgIHNwYW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgc3Bhbi5jbGFzc0xpc3QuYWRkKFwiZmFcIiwgXCJmYS1yZWZyZXNoXCIpO1xuICAgICAgICB0aGlzLl9yZXN0YXJ0QnRuLmFwcGVuZENoaWxkKHNwYW4pO1xuICAgICAgICB0aGlzLl9yZXN0YXJ0QnRuLmlubmVySFRNTCArPSBcIiBSZXN0YXJ0XCI7XG4gICAgICAgIGNvbnN0IG1ldGFDb250cm9scyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgIG1ldGFDb250cm9scy5jbGFzc0xpc3QuYWRkKFwibWV0YS1jb250cm9sc1wiKTtcbiAgICAgICAgY29uc3QgYnV0dG9uR3JvdXAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICBidXR0b25Hcm91cC5jbGFzc0xpc3QuYWRkKFwiYnRuLWdyb3VwXCIpO1xuICAgICAgICBtZXRhQ29udHJvbHMuYXBwZW5kQ2hpbGQoYnV0dG9uR3JvdXApO1xuICAgICAgICBidXR0b25Hcm91cC5hcHBlbmRDaGlsZCh0aGlzLl9zdGFydEJ0bik7XG4gICAgICAgIGJ1dHRvbkdyb3VwLmFwcGVuZENoaWxkKHRoaXMuX3N0b3BCdG4pO1xuICAgICAgICBidXR0b25Hcm91cC5hcHBlbmRDaGlsZCh0aGlzLl9yZXN0YXJ0QnRuKTtcbiAgICAgICAgcmV0dXJuIG1ldGFDb250cm9scztcbiAgICB9XG4gICAgX2dldFN0YXR1c0l0ZW0oKSB7XG4gICAgICAgIHRoaXMuX3N0YXR1c0l0ZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgdGhpcy5fc3RhdHVzSXRlbS5jbGFzc0xpc3QuYWRkKFwicHVsbC1sZWZ0XCIsIFwic3RhdHMtaXRlbVwiKTtcbiAgICAgICAgY29uc3Qgc3RhdHVzQ29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICAgIHRoaXMuX3N0YXR1c0l0ZW0uYXBwZW5kQ2hpbGQoc3RhdHVzQ29udGFpbmVyKTtcbiAgICAgICAgY29uc3QgaWNvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICBzdGF0dXNDb250YWluZXIuYXBwZW5kQ2hpbGQoaWNvbik7XG4gICAgICAgIGljb24uY2xhc3NMaXN0LmFkZChcImljb25cIiwgXCJpY29uLXphcFwiKTtcbiAgICAgICAgdGhpcy5fc3RhdHVzVGV4dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICBzdGF0dXNDb250YWluZXIuYXBwZW5kQ2hpbGQodGhpcy5fc3RhdHVzVGV4dCk7XG4gICAgICAgIHJldHVybiB0aGlzLl9zdGF0dXNJdGVtO1xuICAgIH1cbiAgICBfZ2V0VmVyc2lvbnMoKSB7XG4gICAgICAgIGNvbnN0IHZlcnNpb25zID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICAgIHZlcnNpb25zLmNsYXNzTGlzdC5hZGQoXCJwdWxsLXJpZ2h0XCIsIFwic3RhdHMtaXRlbVwiKTtcbiAgICAgICAgY29uc3Qgc3BhbnMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgc3BhbnMuY2xhc3NMaXN0LmFkZChcImljb25cIiwgXCJpY29uLXZlcnNpb25zXCIpO1xuICAgICAgICB2ZXJzaW9ucy5hcHBlbmRDaGlsZChzcGFucyk7XG4gICAgICAgIHRoaXMuX3J1bnRpbWVUZXh0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICAgIHZlcnNpb25zLmFwcGVuZENoaWxkKHRoaXMuX3J1bnRpbWVUZXh0KTtcbiAgICAgICAgcmV0dXJuIHZlcnNpb25zO1xuICAgIH1cbiAgICBfZ2V0Qm9keSgpIHtcbiAgICAgICAgY29uc3QgYm9keSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgIHRoaXMuX2JvZHkgPSBib2R5O1xuICAgICAgICBib2R5LmNsYXNzTGlzdC5hZGQoXCJib2R5XCIpO1xuICAgICAgICBjb25zdCBoZWFkZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaDRcIik7XG4gICAgICAgIGhlYWRlci5jbGFzc0xpc3QuYWRkKFwibmFtZVwiKTtcbiAgICAgICAgYm9keS5hcHBlbmRDaGlsZChoZWFkZXIpO1xuICAgICAgICB0aGlzLl9uYW1lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICAgIGhlYWRlci5hcHBlbmRDaGlsZCh0aGlzLl9uYW1lKTtcbiAgICAgICAgY29uc3QgdmVyc2lvbnMgPSB0aGlzLl9nZXRWZXJzaW9ucygpO1xuICAgICAgICBib2R5LmFwcGVuZENoaWxkKHZlcnNpb25zKTtcbiAgICAgICAgY29uc3Qgc3RhdHVzSXRlbSA9IHRoaXMuX2dldFN0YXR1c0l0ZW0oKTtcbiAgICAgICAgYm9keS5hcHBlbmRDaGlsZChzdGF0dXNJdGVtKTtcbiAgICAgICAgY29uc3QgbWV0YUNvbnRyb2xzID0gdGhpcy5fZ2V0TWV0YUNvbnRyb2xzKCk7XG4gICAgICAgIGJvZHkuYXBwZW5kQ2hpbGQobWV0YUNvbnRyb2xzKTtcbiAgICAgICAgcmV0dXJuIGJvZHk7XG4gICAgfVxuICAgIF9nZXRQcm9qZWN0cygpIHtcbiAgICAgICAgdGhpcy5fcHJvamVjdHMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICB0aGlzLl9wcm9qZWN0cy5jbGFzc0xpc3QuYWRkKFwibWV0YVwiLCBcIm1ldGEtcHJvamVjdHNcIik7XG4gICAgICAgIGNvbnN0IGhlYWRlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgIGhlYWRlci5jbGFzc0xpc3QuYWRkKFwiaGVhZGVyXCIpO1xuICAgICAgICBoZWFkZXIuaW5uZXJUZXh0ID0gXCJQcm9qZWN0c1wiO1xuICAgICAgICByZXR1cm4gdGhpcy5fcHJvamVjdHM7XG4gICAgfVxuICAgIF9nZXRCdXR0b25zKCkge1xuICAgICAgICB0aGlzLl9idXR0b25zID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgdGhpcy5fYnV0dG9ucy5jbGFzc0xpc3QuYWRkKFwic2VsZWN0b3JcIiwgXCJidG4tZ3JvdXBcIiwgXCJidG4tZ3JvdXAteHNcIik7XG4gICAgICAgIGNvbnN0IGxlZnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICBsZWZ0LmNsYXNzTGlzdC5hZGQoXCJidG5cIiwgXCJidG4teHNcIiwgXCJpY29uXCIsIFwiaWNvbi10cmlhbmdsZS1sZWZ0XCIpO1xuICAgICAgICBsZWZ0Lm9uY2xpY2sgPSAoZSkgPT4gYXRvbS5jb21tYW5kcy5kaXNwYXRjaChhdG9tLnZpZXdzLmdldFZpZXcoYXRvbS53b3Jrc3BhY2UpLCBcIm9tbmlzaGFycC1hdG9tOnByZXZpb3VzLXNvbHV0aW9uLXN0YXR1c1wiKTtcbiAgICAgICAgdGhpcy5fYnV0dG9ucy5hcHBlbmRDaGlsZChsZWZ0KTtcbiAgICAgICAgY29uc3QgcmlnaHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICByaWdodC5jbGFzc0xpc3QuYWRkKFwiYnRuXCIsIFwiYnRuLXhzXCIsIFwiaWNvblwiLCBcImljb24tdHJpYW5nbGUtcmlnaHRcIik7XG4gICAgICAgIHJpZ2h0Lm9uY2xpY2sgPSAoZSkgPT4gYXRvbS5jb21tYW5kcy5kaXNwYXRjaChhdG9tLnZpZXdzLmdldFZpZXcoYXRvbS53b3Jrc3BhY2UpLCBcIm9tbmlzaGFycC1hdG9tOm5leHQtc29sdXRpb24tc3RhdHVzXCIpO1xuICAgICAgICB0aGlzLl9idXR0b25zLmFwcGVuZENoaWxkKHJpZ2h0KTtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2J1dHRvbnM7XG4gICAgfVxuICAgIGNyZWF0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdGhpcy5tb2RlbERpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICB0aGlzLmNsYXNzTGlzdC5hZGQoXCJvbW5pc2hhcnAtY2FyZFwiKTtcbiAgICAgICAgdGhpcy5fZ2V0QnV0dG9ucygpO1xuICAgICAgICBjb25zdCBib2R5ID0gdGhpcy5fZ2V0Qm9keSgpO1xuICAgICAgICB0aGlzLmFwcGVuZENoaWxkKGJvZHkpO1xuICAgICAgICBjb25zdCBwcm9qZWN0cyA9IHRoaXMuX2dldFByb2plY3RzKCk7XG4gICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQocHJvamVjdHMpO1xuICAgIH1cbiAgICBhdHRhY2hlZENhbGxiYWNrKCkge1xuICAgICAgICB0aGlzLnZlcmlmeVBvc2l0aW9uKCk7XG4gICAgfVxuICAgIHVwZGF0ZUNhcmQobW9kZWwsIGNvdW50KSB7XG4gICAgICAgIHRoaXMubW9kZWwgPSBtb2RlbDtcbiAgICAgICAgdGhpcy5jb3VudCA9IGNvdW50O1xuICAgIH1cbiAgICB2ZXJpZnlQb3NpdGlvbigpIHtcbiAgICAgICAgY29uc3Qgb2Zmc2V0ID0gJChkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHRoaXMuYXR0YWNoVG8pKS5vZmZzZXQoKTtcbiAgICAgICAgaWYgKG9mZnNldCkge1xuICAgICAgICAgICAgJCh0aGlzKS5jc3Moe1xuICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBcImZpeGVkXCIsXG4gICAgICAgICAgICAgICAgdG9wOiBvZmZzZXQudG9wIC0gdGhpcy5jbGllbnRIZWlnaHQsXG4gICAgICAgICAgICAgICAgbGVmdDogb2Zmc2V0LmxlZnRcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxufVxuZXhwb3J0cy5Tb2x1dGlvblN0YXR1c0NhcmQgPSBkb2N1bWVudC5yZWdpc3RlckVsZW1lbnQoXCJvbW5pc2hhcnAtc29sdXRpb24tY2FyZFwiLCB7IHByb3RvdHlwZTogU29sdXRpb25TdGF0dXNDYXJkLnByb3RvdHlwZSB9KTtcbiIsImltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcclxuaW1wb3J0IHtWaWV3TW9kZWx9IGZyb20gXCIuLi9zZXJ2ZXIvdmlldy1tb2RlbFwiO1xyXG5pbXBvcnQge1Byb2plY3RWaWV3TW9kZWx9IGZyb20gXCIuLi9zZXJ2ZXIvcHJvamVjdC12aWV3LW1vZGVsXCI7XHJcbmltcG9ydCB7RHJpdmVyU3RhdGV9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XHJcbmltcG9ydCB7Q29tcG9zaXRlRGlzcG9zYWJsZX0gIGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XHJcbmNvbnN0ICQ6IEpRdWVyeVN0YXRpYyA9IHJlcXVpcmUoXCJqcXVlcnlcIik7XHJcbmxldCBmYXN0ZG9tOiB0eXBlb2YgRmFzdGRvbSA9IHJlcXVpcmUoXCJmYXN0ZG9tXCIpO1xyXG5pbXBvcnQge2Jhc2VuYW1lfSBmcm9tIFwicGF0aFwiO1xyXG5cclxuZnVuY3Rpb24gdHJ1bmNhdGVTdHJpbmdSZXZlcnNlKHN0cjogc3RyaW5nLCBtYXhMZW5ndGggPSA1NSkge1xyXG4gICAgY29uc3QgcmV2ZXJzZWRTdHJpbmcgPSBfLnRvQXJyYXkoc3RyKS5yZXZlcnNlKCkuam9pbihcIlwiKTtcclxuICAgIHJldHVybiBfLnRvQXJyYXkoXy50cnVuY2F0ZShyZXZlcnNlZFN0cmluZywgbWF4TGVuZ3RoKSkucmV2ZXJzZSgpLmpvaW4oXCJcIik7XHJcbn1cclxuXHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFByb2plY3REaXNwbGF5RWxlbWVudCBleHRlbmRzIEhUTUxEaXZFbGVtZW50IHtcclxuICAgIHByb2plY3Q6IFByb2plY3RWaWV3TW9kZWw8YW55PjtcclxuICAgIGtleTogc3RyaW5nO1xyXG59XHJcblxyXG5jb25zdCBnZXRNZXNzYWdlRWxlbWVudCA9IChmdW5jdGlvbigpIHtcclxuICAgIGNvbnN0IHByb2plY3RQcm9wcyA9IHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uIHByb2plY3QoKSB7IHJldHVybiB0aGlzLl9wcm9qZWN0OyB9LFxyXG4gICAgICAgIHNldDogZnVuY3Rpb24gcHJvamVjdChwcm9qZWN0OiBQcm9qZWN0Vmlld01vZGVsPGFueT4pIHtcclxuICAgICAgICAgICAgdGhpcy5fcHJvamVjdCA9IHByb2plY3Q7XHJcbiAgICAgICAgICAgIHRoaXMuX2tleSA9IHByb2plY3QucGF0aDtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IHBhdGggPSB0cnVuY2F0ZVN0cmluZ1JldmVyc2UocHJvamVjdC5wYXRoLnJlcGxhY2UodGhpcy5wcm9qZWN0LnNvbHV0aW9uUGF0aCwgXCJcIiksIDI0KTtcclxuICAgICAgICAgICAgdGhpcy50aXRsZSA9IGAke3BhdGh9IFske3Byb2plY3QuZnJhbWV3b3Jrcy5maWx0ZXIoeiA9PiB6Lk5hbWUgIT09IFwiYWxsXCIpLm1hcCh4ID0+IHguRnJpZW5kbHlOYW1lKX1dYDtcclxuICAgICAgICAgICAgdGhpcy5pbm5lclRleHQgPSBwcm9qZWN0Lm5hbWU7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBjb25zdCBrZXlQcm9wcyA9IHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uIGtleSgpIHsgcmV0dXJuIHRoaXMuX2tleTsgfVxyXG4gICAgfTtcclxuXHJcbiAgICByZXR1cm4gZnVuY3Rpb24gZ2V0TWVzc2FnZUVsZW1lbnQoKTogUHJvamVjdERpc3BsYXlFbGVtZW50IHtcclxuICAgICAgICBjb25zdCBlbGVtZW50OiBQcm9qZWN0RGlzcGxheUVsZW1lbnQgPSA8YW55PmRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkKFwicHJvamVjdFwiLCBcIm5hbWVcIik7XHJcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGVsZW1lbnQsIFwicHJvamVjdFwiLCBwcm9qZWN0UHJvcHMpO1xyXG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShlbGVtZW50LCBcImtleVwiLCBrZXlQcm9wcyk7XHJcblxyXG4gICAgICAgIHJldHVybiBlbGVtZW50O1xyXG4gICAgfTtcclxufSkoKTtcclxuXHJcbmV4cG9ydCBjbGFzcyBTb2x1dGlvblN0YXR1c0NhcmQgZXh0ZW5kcyBIVE1MRGl2RWxlbWVudCBpbXBsZW1lbnRzIFdlYkNvbXBvbmVudCB7XHJcbiAgICBwdWJsaWMgZGlzcGxheU5hbWUgPSBcIkNhcmRcIjtcclxuXHJcbiAgICBwcml2YXRlIG1vZGVsRGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxuICAgIHB1YmxpYyBhdHRhY2hUbzogc3RyaW5nO1xyXG5cclxuICAgIHByaXZhdGUgX25hbWU6IEhUTUxTcGFuRWxlbWVudDtcclxuICAgIHByaXZhdGUgX3Byb2plY3RzOiBIVE1MRGl2RWxlbWVudDtcclxuICAgIHByaXZhdGUgX2J1dHRvbnM6IEhUTUxEaXZFbGVtZW50O1xyXG4gICAgcHJpdmF0ZSBfYm9keTogSFRNTEVsZW1lbnQ7XHJcblxyXG4gICAgcHJpdmF0ZSBfc3RvcEJ0bjogSFRNTEJ1dHRvbkVsZW1lbnQ7XHJcbiAgICBwcml2YXRlIF9zdGFydEJ0bjogSFRNTEJ1dHRvbkVsZW1lbnQ7XHJcbiAgICBwcml2YXRlIF9yZXN0YXJ0QnRuOiBIVE1MQnV0dG9uRWxlbWVudDtcclxuXHJcbiAgICBwcml2YXRlIF9zdGF0dXNJdGVtOiBIVE1MU3BhbkVsZW1lbnQ7XHJcbiAgICBwcml2YXRlIF9zdGF0dXNUZXh0OiBIVE1MU3BhbkVsZW1lbnQ7XHJcbiAgICBwcml2YXRlIF9ydW50aW1lVGV4dDogSFRNTFNwYW5FbGVtZW50O1xyXG5cclxuICAgIHByaXZhdGUgX2NvdW50OiBudW1iZXI7XHJcbiAgICBwdWJsaWMgZ2V0IGNvdW50KCkgeyByZXR1cm4gdGhpcy5fY291bnQ7IH1cclxuICAgIHB1YmxpYyBzZXQgY291bnQoY291bnQpIHtcclxuICAgICAgICBpZiAodGhpcy5fY291bnQgIT09IGNvdW50KSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2NvdW50ID0gY291bnQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLl9jb3VudCA+IDEpIHtcclxuICAgICAgICAgICAgdGhpcy5fYm9keS5wYXJlbnRFbGVtZW50Lmluc2VydEJlZm9yZSh0aGlzLl9idXR0b25zLCB0aGlzLl9ib2R5KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLl9idXR0b25zLnJlbW92ZSgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9tb2RlbDogVmlld01vZGVsO1xyXG4gICAgcHVibGljIGdldCBtb2RlbCgpIHsgcmV0dXJuIHRoaXMuX21vZGVsOyB9XHJcbiAgICBwdWJsaWMgc2V0IG1vZGVsKG1vZGVsKSB7XHJcbiAgICAgICAgdGhpcy5fbW9kZWwgPSBtb2RlbDtcclxuICAgICAgICB0aGlzLm1vZGVsRGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICAgICAgdGhpcy5tb2RlbERpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG5cclxuICAgICAgICB0aGlzLm1vZGVsRGlzcG9zYWJsZS5hZGQodGhpcy5fbW9kZWwub2JzZXJ2ZS5zdGF0ZS5kZWxheSgxMCkuc3Vic2NyaWJlKCh7aW5kZXgsIHBhdGgsIC8qcnVudGltZSwqLyBzdGF0ZSwgaXNSZWFkeSwgaXNPZmYsIGlzT259KSA9PiB7XHJcbiAgICAgICAgICAgIGZhc3Rkb20ubXV0YXRlKCgpID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IG5hbWUgPSBgJHtiYXNlbmFtZShwYXRoKX0gKCR7aW5kZXh9KWA7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fbmFtZS5pbm5lclRleHQgIT09IG5hbWUpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9uYW1lLmlubmVyVGV4dCA9IG5hbWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHN0YXRlID09PSBEcml2ZXJTdGF0ZS5Db25uZWN0ZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9zdGF0dXNUZXh0LmlubmVyVGV4dCA9IFwiT25saW5lXCI7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHN0YXRlID09PSBEcml2ZXJTdGF0ZS5Db25uZWN0aW5nKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc3RhdHVzVGV4dC5pbm5lclRleHQgPSBcIkxvYWRpbmdcIjtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoc3RhdGUgPT09IERyaXZlclN0YXRlLkRpc2Nvbm5lY3RlZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3N0YXR1c1RleHQuaW5uZXJUZXh0ID0gXCJPZmZsaW5lXCI7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3N0YXR1c1RleHQuaW5uZXJUZXh0ID0gRHJpdmVyU3RhdGVbc3RhdGVdO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChpc1JlYWR5KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc3RhcnRCdG4uc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3N0b3BCdG4uc3R5bGUuZGlzcGxheSA9IFwiXCI7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGlzT2ZmKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc3RhcnRCdG4uc3R5bGUuZGlzcGxheSA9IFwiXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc3RvcEJ0bi5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3N0YXJ0QnRuLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9zdG9wQnRuLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoaXNPbikge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Jlc3RhcnRCdG4uc3R5bGUuZGlzcGxheSA9IFwiXCI7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Jlc3RhcnRCdG4uc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChpc09mZikge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Byb2plY3RzLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcHJvamVjdHMuc3R5bGUuZGlzcGxheSA9IFwiXCI7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy90aGlzLl9zdGF0dXNUZXh0LmlubmVyVGV4dCA9IERyaXZlclN0YXRlW3N0YXRlXTtcclxuICAgICAgICAgICAgICAgIHRoaXMuX3N0YXR1c0l0ZW0uY2xhc3NOYW1lID0gXCJwdWxsLWxlZnQgc3RhdHMtaXRlbVwiO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fc3RhdHVzSXRlbS5jbGFzc0xpc3QuYWRkKERyaXZlclN0YXRlW3N0YXRlXS50b0xvd2VyQ2FzZSgpKTtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLnZlcmlmeVBvc2l0aW9uKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgLyppZiAocnVudGltZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3J1bnRpbWVUZXh0LnN0eWxlLmRpc3BsYXkgPSBcIlwiO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3J1bnRpbWVUZXh0LmlubmVyVGV4dCA9IHJ1bnRpbWU7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgeyovXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcnVudGltZVRleHQuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3J1bnRpbWVUZXh0LmlubmVyVGV4dCA9IFwiXCI7XHJcbiAgICAgICAgICAgICAgICAvKn0qL1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMubW9kZWxEaXNwb3NhYmxlLmFkZCh0aGlzLl9tb2RlbC5vYnNlcnZlLnByb2plY3RzLnN1YnNjcmliZShwcm9qZWN0cyA9PiB7XHJcbiAgICAgICAgICAgIGZhc3Rkb20ubXV0YXRlKCgpID0+IHtcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwLCBsZW4gPSB0aGlzLl9wcm9qZWN0cy5jaGlsZHJlbi5sZW5ndGggPiBwcm9qZWN0cy5sZW5ndGggPyB0aGlzLl9wcm9qZWN0cy5jaGlsZHJlbi5sZW5ndGggOiBwcm9qZWN0cy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW0gPSBwcm9qZWN0c1tpXTtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgY2hpbGQ6IFByb2plY3REaXNwbGF5RWxlbWVudCA9IDxhbnk+dGhpcy5fcHJvamVjdHMuY2hpbGRyZW5baV07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICghaXRlbSAmJiBjaGlsZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGlsZC5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChpdGVtICYmICFjaGlsZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGlsZCA9IGdldE1lc3NhZ2VFbGVtZW50KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3Byb2plY3RzLmFwcGVuZENoaWxkKGNoaWxkKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChjaGlsZCAmJiBjaGlsZC5rZXkgIT09IGl0ZW0ucGF0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGlsZC5wcm9qZWN0ID0gaXRlbTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy52ZXJpZnlQb3NpdGlvbigpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfZ2V0TWV0YUNvbnRyb2xzKCkge1xyXG4gICAgICAgIHRoaXMuX3N0b3BCdG4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpO1xyXG4gICAgICAgIHRoaXMuX3N0b3BCdG4uY2xhc3NMaXN0LmFkZChcImJ0blwiLCBcImJ0bi14c1wiLCBcImJ0bi1lcnJvclwiKTtcclxuICAgICAgICB0aGlzLl9zdG9wQnRuLm9uY2xpY2sgPSAoKSA9PiBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSksIFwib21uaXNoYXJwLWF0b206c3RvcC1zZXJ2ZXJcIik7XHJcblxyXG4gICAgICAgIGxldCBzcGFuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XHJcbiAgICAgICAgc3Bhbi5jbGFzc0xpc3QuYWRkKFwiZmFcIiwgXCJmYS1zdG9wXCIpO1xyXG4gICAgICAgIHRoaXMuX3N0b3BCdG4uYXBwZW5kQ2hpbGQoc3Bhbik7XHJcbiAgICAgICAgdGhpcy5fc3RvcEJ0bi5pbm5lckhUTUwgKz0gXCIgU3RvcFwiO1xyXG5cclxuICAgICAgICB0aGlzLl9zdGFydEJ0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XHJcbiAgICAgICAgdGhpcy5fc3RhcnRCdG4uY2xhc3NMaXN0LmFkZChcImJ0blwiLCBcImJ0bi14c1wiLCBcImJ0bi1zdWNjZXNzXCIpO1xyXG4gICAgICAgIHRoaXMuX3N0YXJ0QnRuLm9uY2xpY2sgPSAoKSA9PiBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSksIFwib21uaXNoYXJwLWF0b206c3RhcnQtc2VydmVyXCIpO1xyXG5cclxuICAgICAgICBzcGFuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XHJcbiAgICAgICAgc3Bhbi5jbGFzc0xpc3QuYWRkKFwiZmFcIiwgXCJmYS1wbGF5XCIpO1xyXG4gICAgICAgIHRoaXMuX3N0YXJ0QnRuLmFwcGVuZENoaWxkKHNwYW4pO1xyXG4gICAgICAgIHRoaXMuX3N0YXJ0QnRuLmlubmVySFRNTCArPSBcIiBTdGFydFwiO1xyXG5cclxuICAgICAgICB0aGlzLl9yZXN0YXJ0QnRuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImJ1dHRvblwiKTtcclxuICAgICAgICB0aGlzLl9yZXN0YXJ0QnRuLmNsYXNzTGlzdC5hZGQoXCJidG5cIiwgXCJidG4teHNcIiwgXCJidG4taW5mb1wiKTtcclxuICAgICAgICB0aGlzLl9yZXN0YXJ0QnRuLm9uY2xpY2sgPSAoKSA9PiBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSksIFwib21uaXNoYXJwLWF0b206cmVzdGFydC1zZXJ2ZXJcIik7XHJcblxyXG4gICAgICAgIHNwYW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcclxuICAgICAgICBzcGFuLmNsYXNzTGlzdC5hZGQoXCJmYVwiLCBcImZhLXJlZnJlc2hcIik7XHJcbiAgICAgICAgdGhpcy5fcmVzdGFydEJ0bi5hcHBlbmRDaGlsZChzcGFuKTtcclxuICAgICAgICB0aGlzLl9yZXN0YXJ0QnRuLmlubmVySFRNTCArPSBcIiBSZXN0YXJ0XCI7XHJcblxyXG4gICAgICAgIGNvbnN0IG1ldGFDb250cm9scyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgICAgICAgbWV0YUNvbnRyb2xzLmNsYXNzTGlzdC5hZGQoXCJtZXRhLWNvbnRyb2xzXCIpO1xyXG5cclxuICAgICAgICBjb25zdCBidXR0b25Hcm91cCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgICAgICAgYnV0dG9uR3JvdXAuY2xhc3NMaXN0LmFkZChcImJ0bi1ncm91cFwiKTtcclxuICAgICAgICBtZXRhQ29udHJvbHMuYXBwZW5kQ2hpbGQoYnV0dG9uR3JvdXApO1xyXG5cclxuICAgICAgICBidXR0b25Hcm91cC5hcHBlbmRDaGlsZCh0aGlzLl9zdGFydEJ0bik7XHJcbiAgICAgICAgYnV0dG9uR3JvdXAuYXBwZW5kQ2hpbGQodGhpcy5fc3RvcEJ0bik7XHJcbiAgICAgICAgYnV0dG9uR3JvdXAuYXBwZW5kQ2hpbGQodGhpcy5fcmVzdGFydEJ0bik7XHJcblxyXG4gICAgICAgIHJldHVybiBtZXRhQ29udHJvbHM7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfZ2V0U3RhdHVzSXRlbSgpIHtcclxuICAgICAgICB0aGlzLl9zdGF0dXNJdGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XHJcbiAgICAgICAgdGhpcy5fc3RhdHVzSXRlbS5jbGFzc0xpc3QuYWRkKFwicHVsbC1sZWZ0XCIsIFwic3RhdHMtaXRlbVwiKTtcclxuXHJcbiAgICAgICAgY29uc3Qgc3RhdHVzQ29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XHJcbiAgICAgICAgdGhpcy5fc3RhdHVzSXRlbS5hcHBlbmRDaGlsZChzdGF0dXNDb250YWluZXIpO1xyXG4gICAgICAgIGNvbnN0IGljb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcclxuICAgICAgICBzdGF0dXNDb250YWluZXIuYXBwZW5kQ2hpbGQoaWNvbik7XHJcbiAgICAgICAgaWNvbi5jbGFzc0xpc3QuYWRkKFwiaWNvblwiLCBcImljb24temFwXCIpO1xyXG5cclxuICAgICAgICB0aGlzLl9zdGF0dXNUZXh0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XHJcbiAgICAgICAgc3RhdHVzQ29udGFpbmVyLmFwcGVuZENoaWxkKHRoaXMuX3N0YXR1c1RleHQpO1xyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy5fc3RhdHVzSXRlbTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9nZXRWZXJzaW9ucygpIHtcclxuICAgICAgICBjb25zdCB2ZXJzaW9ucyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xyXG4gICAgICAgIHZlcnNpb25zLmNsYXNzTGlzdC5hZGQoXCJwdWxsLXJpZ2h0XCIsIFwic3RhdHMtaXRlbVwiKTtcclxuXHJcbiAgICAgICAgY29uc3Qgc3BhbnMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcclxuICAgICAgICBzcGFucy5jbGFzc0xpc3QuYWRkKFwiaWNvblwiLCBcImljb24tdmVyc2lvbnNcIik7XHJcbiAgICAgICAgdmVyc2lvbnMuYXBwZW5kQ2hpbGQoc3BhbnMpO1xyXG5cclxuICAgICAgICB0aGlzLl9ydW50aW1lVGV4dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xyXG4gICAgICAgIHZlcnNpb25zLmFwcGVuZENoaWxkKHRoaXMuX3J1bnRpbWVUZXh0KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHZlcnNpb25zO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX2dldEJvZHkoKSB7XHJcbiAgICAgICAgY29uc3QgYm9keSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgICAgICAgdGhpcy5fYm9keSA9IGJvZHk7XHJcbiAgICAgICAgYm9keS5jbGFzc0xpc3QuYWRkKFwiYm9keVwiKTtcclxuXHJcbiAgICAgICAgY29uc3QgaGVhZGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImg0XCIpO1xyXG4gICAgICAgIGhlYWRlci5jbGFzc0xpc3QuYWRkKFwibmFtZVwiKTtcclxuICAgICAgICBib2R5LmFwcGVuZENoaWxkKGhlYWRlcik7XHJcblxyXG4gICAgICAgIHRoaXMuX25hbWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcclxuICAgICAgICBoZWFkZXIuYXBwZW5kQ2hpbGQodGhpcy5fbmFtZSk7XHJcblxyXG4gICAgICAgIGNvbnN0IHZlcnNpb25zID0gdGhpcy5fZ2V0VmVyc2lvbnMoKTtcclxuICAgICAgICBib2R5LmFwcGVuZENoaWxkKHZlcnNpb25zKTtcclxuXHJcbiAgICAgICAgY29uc3Qgc3RhdHVzSXRlbSA9IHRoaXMuX2dldFN0YXR1c0l0ZW0oKTtcclxuICAgICAgICBib2R5LmFwcGVuZENoaWxkKHN0YXR1c0l0ZW0pO1xyXG5cclxuICAgICAgICBjb25zdCBtZXRhQ29udHJvbHMgPSB0aGlzLl9nZXRNZXRhQ29udHJvbHMoKTtcclxuICAgICAgICBib2R5LmFwcGVuZENoaWxkKG1ldGFDb250cm9scyk7XHJcblxyXG4gICAgICAgIHJldHVybiBib2R5O1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX2dldFByb2plY3RzKCkge1xyXG4gICAgICAgIHRoaXMuX3Byb2plY3RzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuICAgICAgICB0aGlzLl9wcm9qZWN0cy5jbGFzc0xpc3QuYWRkKFwibWV0YVwiLCBcIm1ldGEtcHJvamVjdHNcIik7XHJcblxyXG4gICAgICAgIGNvbnN0IGhlYWRlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgICAgICAgaGVhZGVyLmNsYXNzTGlzdC5hZGQoXCJoZWFkZXJcIik7XHJcbiAgICAgICAgaGVhZGVyLmlubmVyVGV4dCA9IFwiUHJvamVjdHNcIjtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX3Byb2plY3RzO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX2dldEJ1dHRvbnMoKSB7XHJcbiAgICAgICAgdGhpcy5fYnV0dG9ucyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgICAgICAgdGhpcy5fYnV0dG9ucy5jbGFzc0xpc3QuYWRkKFwic2VsZWN0b3JcIiwgXCJidG4tZ3JvdXBcIiwgXCJidG4tZ3JvdXAteHNcIik7XHJcblxyXG4gICAgICAgIGNvbnN0IGxlZnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gICAgICAgIGxlZnQuY2xhc3NMaXN0LmFkZChcImJ0blwiLCBcImJ0bi14c1wiLCBcImljb25cIiwgXCJpY29uLXRyaWFuZ2xlLWxlZnRcIik7XHJcbiAgICAgICAgbGVmdC5vbmNsaWNrID0gKGUpID0+IGF0b20uY29tbWFuZHMuZGlzcGF0Y2goYXRvbS52aWV3cy5nZXRWaWV3KGF0b20ud29ya3NwYWNlKSwgXCJvbW5pc2hhcnAtYXRvbTpwcmV2aW91cy1zb2x1dGlvbi1zdGF0dXNcIik7XHJcbiAgICAgICAgdGhpcy5fYnV0dG9ucy5hcHBlbmRDaGlsZChsZWZ0KTtcclxuXHJcbiAgICAgICAgY29uc3QgcmlnaHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gICAgICAgIHJpZ2h0LmNsYXNzTGlzdC5hZGQoXCJidG5cIiwgXCJidG4teHNcIiwgXCJpY29uXCIsIFwiaWNvbi10cmlhbmdsZS1yaWdodFwiKTtcclxuICAgICAgICByaWdodC5vbmNsaWNrID0gKGUpID0+IGF0b20uY29tbWFuZHMuZGlzcGF0Y2goYXRvbS52aWV3cy5nZXRWaWV3KGF0b20ud29ya3NwYWNlKSwgXCJvbW5pc2hhcnAtYXRvbTpuZXh0LXNvbHV0aW9uLXN0YXR1c1wiKTtcclxuICAgICAgICB0aGlzLl9idXR0b25zLmFwcGVuZENoaWxkKHJpZ2h0KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2J1dHRvbnM7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNyZWF0ZWRDYWxsYmFjaygpIHtcclxuICAgICAgICB0aGlzLm1vZGVsRGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcblxyXG4gICAgICAgIHRoaXMuY2xhc3NMaXN0LmFkZChcIm9tbmlzaGFycC1jYXJkXCIpO1xyXG5cclxuICAgICAgICB0aGlzLl9nZXRCdXR0b25zKCk7XHJcblxyXG4gICAgICAgIGNvbnN0IGJvZHkgPSB0aGlzLl9nZXRCb2R5KCk7XHJcbiAgICAgICAgdGhpcy5hcHBlbmRDaGlsZChib2R5KTtcclxuXHJcbiAgICAgICAgY29uc3QgcHJvamVjdHMgPSB0aGlzLl9nZXRQcm9qZWN0cygpO1xyXG4gICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQocHJvamVjdHMpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBhdHRhY2hlZENhbGxiYWNrKCkge1xyXG4gICAgICAgIHRoaXMudmVyaWZ5UG9zaXRpb24oKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgdXBkYXRlQ2FyZChtb2RlbDogVmlld01vZGVsLCBjb3VudDogbnVtYmVyKSB7XHJcbiAgICAgICAgdGhpcy5tb2RlbCA9IG1vZGVsO1xyXG4gICAgICAgIHRoaXMuY291bnQgPSBjb3VudDtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHZlcmlmeVBvc2l0aW9uKCkge1xyXG4gICAgICAgIGNvbnN0IG9mZnNldCA9ICQoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCh0aGlzLmF0dGFjaFRvKSkub2Zmc2V0KCk7XHJcbiAgICAgICAgaWYgKG9mZnNldCkge1xyXG4gICAgICAgICAgICAkKHRoaXMpLmNzcyh7XHJcbiAgICAgICAgICAgICAgICBwb3NpdGlvbjogXCJmaXhlZFwiLFxyXG4gICAgICAgICAgICAgICAgdG9wOiBvZmZzZXQudG9wIC0gdGhpcy5jbGllbnRIZWlnaHQsXHJcbiAgICAgICAgICAgICAgICBsZWZ0OiBvZmZzZXQubGVmdFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbig8YW55PmV4cG9ydHMpLlNvbHV0aW9uU3RhdHVzQ2FyZCA9ICg8YW55PmRvY3VtZW50KS5yZWdpc3RlckVsZW1lbnQoXCJvbW5pc2hhcnAtc29sdXRpb24tY2FyZFwiLCB7IHByb3RvdHlwZTogU29sdXRpb25TdGF0dXNDYXJkLnByb3RvdHlwZSB9KTtcclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
