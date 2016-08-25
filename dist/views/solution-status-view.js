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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy9zb2x1dGlvbi1zdGF0dXMtdmlldy5qcyIsImxpYi92aWV3cy9zb2x1dGlvbi1zdGF0dXMtdmlldy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7OztBQUNBOztBQUNBOztBQUdBOzs7Ozs7Ozs7O0FDQUEsSUFBTSxJQUFrQixRQUFRLFFBQVIsQ0FBbEI7QUFDTixJQUFJLFVBQTBCLFFBQVEsU0FBUixDQUExQjs7QUFHSixTQUFBLHFCQUFBLENBQStCLEdBQS9CLEVBQTBEO1FBQWQsa0VBQVksa0JBQUU7O0FBQ3RELFFBQU0saUJBQWlCLGlCQUFFLE9BQUYsQ0FBVSxHQUFWLEVBQWUsT0FBZixHQUF5QixJQUF6QixDQUE4QixFQUE5QixDQUFqQixDQURnRDtBQUV0RCxXQUFPLGlCQUFFLE9BQUYsQ0FBVSxpQkFBRSxRQUFGLENBQVcsY0FBWCxFQUEyQixTQUEzQixDQUFWLEVBQWlELE9BQWpELEdBQTJELElBQTNELENBQWdFLEVBQWhFLENBQVAsQ0FGc0Q7Q0FBMUQ7QUFXQSxJQUFNLG9CQUFvQixZQUFDO0FBQ3ZCLFFBQU0sZUFBZTtBQUNqQixhQUFLLFNBQUEsT0FBQSxHQUFBO0FBQXFCLG1CQUFPLEtBQUssUUFBTCxDQUE1QjtTQUFBO0FBQ0wsYUFBSyxTQUFBLE9BQUEsQ0FBaUIsT0FBakIsRUFBK0M7QUFDaEQsaUJBQUssUUFBTCxHQUFnQixPQUFoQixDQURnRDtBQUVoRCxpQkFBSyxJQUFMLEdBQVksUUFBUSxJQUFSLENBRm9DO0FBSWhELGdCQUFNLE9BQU8sc0JBQXNCLFFBQVEsSUFBUixDQUFhLE9BQWIsQ0FBcUIsS0FBSyxPQUFMLENBQWEsWUFBYixFQUEyQixFQUFoRCxDQUF0QixFQUEyRSxFQUEzRSxDQUFQLENBSjBDO0FBS2hELGlCQUFLLEtBQUwsR0FBZ0IsY0FBUyxRQUFRLFVBQVIsQ0FBbUIsTUFBbkIsQ0FBMEI7dUJBQUssRUFBRSxJQUFGLEtBQVcsS0FBWDthQUFMLENBQTFCLENBQWlE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QjtBQUNoQixrQ0FBTSxNQUFOLEdBRGdCO0FBRWhCLHFDQUZnQjt5QkFBcEIsTUFHTyxJQUFJLFFBQVEsQ0FBQyxLQUFELEVBQVE7QUFDdkIsb0NBQVEsbUJBQVIsQ0FEdUI7QUFFdkIsbUNBQUssU0FBTCxDQUFlLFdBQWYsQ0FBMkIsS0FBM0IsRUFGdUI7eUJBQXBCO0FBS1AsNEJBQUksU0FBUyxNQUFNLEdBQU4sS0FBYyxLQUFLLElBQUwsRUFBVztBQUNsQyxrQ0FBTSxPQUFOLEdBQWdCLElBQWhCLENBRGtDO3lCQUF0QztxQkFaSjtBQWlCQSwyQkFBSyxjQUFMLEdBbEJXO2lCQUFBLENBQWYsQ0FEb0U7YUFBUixDQUFoRSxFQTdEa0I7Ozs7O0VBbENjOztBQXNSbEMsUUFBUyxrQkFBVCxHQUFvQyxTQUFVLGVBQVYsQ0FBMEIseUJBQTFCLEVBQXFELEVBQUUsV0FBVyxtQkFBbUIsU0FBbkIsRUFBbEUsQ0FBcEMiLCJmaWxlIjoibGliL3ZpZXdzL3NvbHV0aW9uLXN0YXR1cy12aWV3LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xuaW1wb3J0IHsgRHJpdmVyU3RhdGUgfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSB9IGZyb20gXCJ0cy1kaXNwb3NhYmxlc1wiO1xuY29uc3QgJCA9IHJlcXVpcmUoXCJqcXVlcnlcIik7XG5sZXQgZmFzdGRvbSA9IHJlcXVpcmUoXCJmYXN0ZG9tXCIpO1xuaW1wb3J0IHsgYmFzZW5hbWUgfSBmcm9tIFwicGF0aFwiO1xuZnVuY3Rpb24gdHJ1bmNhdGVTdHJpbmdSZXZlcnNlKHN0ciwgbWF4TGVuZ3RoID0gNTUpIHtcbiAgICBjb25zdCByZXZlcnNlZFN0cmluZyA9IF8udG9BcnJheShzdHIpLnJldmVyc2UoKS5qb2luKFwiXCIpO1xuICAgIHJldHVybiBfLnRvQXJyYXkoXy50cnVuY2F0ZShyZXZlcnNlZFN0cmluZywgbWF4TGVuZ3RoKSkucmV2ZXJzZSgpLmpvaW4oXCJcIik7XG59XG5jb25zdCBnZXRNZXNzYWdlRWxlbWVudCA9IChmdW5jdGlvbiAoKSB7XG4gICAgY29uc3QgcHJvamVjdFByb3BzID0ge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uIHByb2plY3QoKSB7IHJldHVybiB0aGlzLl9wcm9qZWN0OyB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uIHByb2plY3QocHJvamVjdCkge1xuICAgICAgICAgICAgdGhpcy5fcHJvamVjdCA9IHByb2plY3Q7XG4gICAgICAgICAgICB0aGlzLl9rZXkgPSBwcm9qZWN0LnBhdGg7XG4gICAgICAgICAgICBjb25zdCBwYXRoID0gdHJ1bmNhdGVTdHJpbmdSZXZlcnNlKHByb2plY3QucGF0aC5yZXBsYWNlKHRoaXMucHJvamVjdC5zb2x1dGlvblBhdGgsIFwiXCIpLCAyNCk7XG4gICAgICAgICAgICB0aGlzLnRpdGxlID0gYCR7cGF0aH0gWyR7cHJvamVjdC5mcmFtZXdvcmtzLmZpbHRlcih6ID0+IHouTmFtZSAhPT0gXCJhbGxcIikubWFwKHggPT4geC5GcmllbmRseU5hbWUpfV1gO1xuICAgICAgICAgICAgdGhpcy5pbm5lclRleHQgPSBwcm9qZWN0Lm5hbWU7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIGNvbnN0IGtleVByb3BzID0ge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uIGtleSgpIHsgcmV0dXJuIHRoaXMuX2tleTsgfVxuICAgIH07XG4gICAgcmV0dXJuIGZ1bmN0aW9uIGdldE1lc3NhZ2VFbGVtZW50KCkge1xuICAgICAgICBjb25zdCBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkKFwicHJvamVjdFwiLCBcIm5hbWVcIik7XG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShlbGVtZW50LCBcInByb2plY3RcIiwgcHJvamVjdFByb3BzKTtcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGVsZW1lbnQsIFwia2V5XCIsIGtleVByb3BzKTtcbiAgICAgICAgcmV0dXJuIGVsZW1lbnQ7XG4gICAgfTtcbn0pKCk7XG5leHBvcnQgY2xhc3MgU29sdXRpb25TdGF0dXNDYXJkIGV4dGVuZHMgSFRNTERpdkVsZW1lbnQge1xuICAgIGNvbnN0cnVjdG9yKC4uLmFyZ3MpIHtcbiAgICAgICAgc3VwZXIoLi4uYXJncyk7XG4gICAgICAgIHRoaXMuZGlzcGxheU5hbWUgPSBcIkNhcmRcIjtcbiAgICB9XG4gICAgZ2V0IGNvdW50KCkgeyByZXR1cm4gdGhpcy5fY291bnQ7IH1cbiAgICBzZXQgY291bnQoY291bnQpIHtcbiAgICAgICAgaWYgKHRoaXMuX2NvdW50ICE9PSBjb3VudCkge1xuICAgICAgICAgICAgdGhpcy5fY291bnQgPSBjb3VudDtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5fY291bnQgPiAxKSB7XG4gICAgICAgICAgICB0aGlzLl9ib2R5LnBhcmVudEVsZW1lbnQuaW5zZXJ0QmVmb3JlKHRoaXMuX2J1dHRvbnMsIHRoaXMuX2JvZHkpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fYnV0dG9ucy5yZW1vdmUoKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBnZXQgbW9kZWwoKSB7IHJldHVybiB0aGlzLl9tb2RlbDsgfVxuICAgIHNldCBtb2RlbChtb2RlbCkge1xuICAgICAgICB0aGlzLl9tb2RlbCA9IG1vZGVsO1xuICAgICAgICB0aGlzLm1vZGVsRGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgICAgIHRoaXMubW9kZWxEaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgdGhpcy5tb2RlbERpc3Bvc2FibGUuYWRkKHRoaXMuX21vZGVsLm9ic2VydmUuc3RhdGUuZGVsYXkoMTApLnN1YnNjcmliZSgoeyBpbmRleCwgcGF0aCwgc3RhdGUsIGlzUmVhZHksIGlzT2ZmLCBpc09uIH0pID0+IHtcbiAgICAgICAgICAgIGZhc3Rkb20ubXV0YXRlKCgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBuYW1lID0gYCR7YmFzZW5hbWUocGF0aCl9ICgke2luZGV4fSlgO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9uYW1lLmlubmVyVGV4dCAhPT0gbmFtZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9uYW1lLmlubmVyVGV4dCA9IG5hbWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChzdGF0ZSA9PT0gRHJpdmVyU3RhdGUuQ29ubmVjdGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3N0YXR1c1RleHQuaW5uZXJUZXh0ID0gXCJPbmxpbmVcIjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoc3RhdGUgPT09IERyaXZlclN0YXRlLkNvbm5lY3RpbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc3RhdHVzVGV4dC5pbm5lclRleHQgPSBcIkxvYWRpbmdcIjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoc3RhdGUgPT09IERyaXZlclN0YXRlLkRpc2Nvbm5lY3RlZCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9zdGF0dXNUZXh0LmlubmVyVGV4dCA9IFwiT2ZmbGluZVwiO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc3RhdHVzVGV4dC5pbm5lclRleHQgPSBEcml2ZXJTdGF0ZVtzdGF0ZV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChpc1JlYWR5KSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3N0YXJ0QnRuLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc3RvcEJ0bi5zdHlsZS5kaXNwbGF5ID0gXCJcIjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoaXNPZmYpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc3RhcnRCdG4uc3R5bGUuZGlzcGxheSA9IFwiXCI7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3N0b3BCdG4uc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc3RhcnRCdG4uc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9zdG9wQnRuLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGlzT24pIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcmVzdGFydEJ0bi5zdHlsZS5kaXNwbGF5ID0gXCJcIjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Jlc3RhcnRCdG4uc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoaXNPZmYpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcHJvamVjdHMuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcHJvamVjdHMuc3R5bGUuZGlzcGxheSA9IFwiXCI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuX3N0YXR1c0l0ZW0uY2xhc3NOYW1lID0gXCJwdWxsLWxlZnQgc3RhdHMtaXRlbVwiO1xuICAgICAgICAgICAgICAgIHRoaXMuX3N0YXR1c0l0ZW0uY2xhc3NMaXN0LmFkZChEcml2ZXJTdGF0ZVtzdGF0ZV0udG9Mb3dlckNhc2UoKSk7XG4gICAgICAgICAgICAgICAgdGhpcy52ZXJpZnlQb3NpdGlvbigpO1xuICAgICAgICAgICAgICAgIHRoaXMuX3J1bnRpbWVUZXh0LnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgICAgICAgICB0aGlzLl9ydW50aW1lVGV4dC5pbm5lclRleHQgPSBcIlwiO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5tb2RlbERpc3Bvc2FibGUuYWRkKHRoaXMuX21vZGVsLm9ic2VydmUucHJvamVjdHMuc3Vic2NyaWJlKHByb2plY3RzID0+IHtcbiAgICAgICAgICAgIGZhc3Rkb20ubXV0YXRlKCgpID0+IHtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMCwgbGVuID0gdGhpcy5fcHJvamVjdHMuY2hpbGRyZW4ubGVuZ3RoID4gcHJvamVjdHMubGVuZ3RoID8gdGhpcy5fcHJvamVjdHMuY2hpbGRyZW4ubGVuZ3RoIDogcHJvamVjdHMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaXRlbSA9IHByb2plY3RzW2ldO1xuICAgICAgICAgICAgICAgICAgICBsZXQgY2hpbGQgPSB0aGlzLl9wcm9qZWN0cy5jaGlsZHJlbltpXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFpdGVtICYmIGNoaWxkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjaGlsZC5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKGl0ZW0gJiYgIWNoaWxkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjaGlsZCA9IGdldE1lc3NhZ2VFbGVtZW50KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9wcm9qZWN0cy5hcHBlbmRDaGlsZChjaGlsZCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGNoaWxkICYmIGNoaWxkLmtleSAhPT0gaXRlbS5wYXRoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjaGlsZC5wcm9qZWN0ID0gaXRlbTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLnZlcmlmeVBvc2l0aW9uKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSkpO1xuICAgIH1cbiAgICBfZ2V0TWV0YUNvbnRyb2xzKCkge1xuICAgICAgICB0aGlzLl9zdG9wQnRuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImJ1dHRvblwiKTtcbiAgICAgICAgdGhpcy5fc3RvcEJ0bi5jbGFzc0xpc3QuYWRkKFwiYnRuXCIsIFwiYnRuLXhzXCIsIFwiYnRuLWVycm9yXCIpO1xuICAgICAgICB0aGlzLl9zdG9wQnRuLm9uY2xpY2sgPSAoKSA9PiBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSksIFwib21uaXNoYXJwLWF0b206c3RvcC1zZXJ2ZXJcIik7XG4gICAgICAgIGxldCBzcGFuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICAgIHNwYW4uY2xhc3NMaXN0LmFkZChcImZhXCIsIFwiZmEtc3RvcFwiKTtcbiAgICAgICAgdGhpcy5fc3RvcEJ0bi5hcHBlbmRDaGlsZChzcGFuKTtcbiAgICAgICAgdGhpcy5fc3RvcEJ0bi5pbm5lckhUTUwgKz0gXCIgU3RvcFwiO1xuICAgICAgICB0aGlzLl9zdGFydEJ0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XG4gICAgICAgIHRoaXMuX3N0YXJ0QnRuLmNsYXNzTGlzdC5hZGQoXCJidG5cIiwgXCJidG4teHNcIiwgXCJidG4tc3VjY2Vzc1wiKTtcbiAgICAgICAgdGhpcy5fc3RhcnRCdG4ub25jbGljayA9ICgpID0+IGF0b20uY29tbWFuZHMuZGlzcGF0Y2goYXRvbS52aWV3cy5nZXRWaWV3KGF0b20ud29ya3NwYWNlKSwgXCJvbW5pc2hhcnAtYXRvbTpzdGFydC1zZXJ2ZXJcIik7XG4gICAgICAgIHNwYW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgc3Bhbi5jbGFzc0xpc3QuYWRkKFwiZmFcIiwgXCJmYS1wbGF5XCIpO1xuICAgICAgICB0aGlzLl9zdGFydEJ0bi5hcHBlbmRDaGlsZChzcGFuKTtcbiAgICAgICAgdGhpcy5fc3RhcnRCdG4uaW5uZXJIVE1MICs9IFwiIFN0YXJ0XCI7XG4gICAgICAgIHRoaXMuX3Jlc3RhcnRCdG4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpO1xuICAgICAgICB0aGlzLl9yZXN0YXJ0QnRuLmNsYXNzTGlzdC5hZGQoXCJidG5cIiwgXCJidG4teHNcIiwgXCJidG4taW5mb1wiKTtcbiAgICAgICAgdGhpcy5fcmVzdGFydEJ0bi5vbmNsaWNrID0gKCkgPT4gYXRvbS5jb21tYW5kcy5kaXNwYXRjaChhdG9tLnZpZXdzLmdldFZpZXcoYXRvbS53b3Jrc3BhY2UpLCBcIm9tbmlzaGFycC1hdG9tOnJlc3RhcnQtc2VydmVyXCIpO1xuICAgICAgICBzcGFuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICAgIHNwYW4uY2xhc3NMaXN0LmFkZChcImZhXCIsIFwiZmEtcmVmcmVzaFwiKTtcbiAgICAgICAgdGhpcy5fcmVzdGFydEJ0bi5hcHBlbmRDaGlsZChzcGFuKTtcbiAgICAgICAgdGhpcy5fcmVzdGFydEJ0bi5pbm5lckhUTUwgKz0gXCIgUmVzdGFydFwiO1xuICAgICAgICBjb25zdCBtZXRhQ29udHJvbHMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICBtZXRhQ29udHJvbHMuY2xhc3NMaXN0LmFkZChcIm1ldGEtY29udHJvbHNcIik7XG4gICAgICAgIGNvbnN0IGJ1dHRvbkdyb3VwID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgYnV0dG9uR3JvdXAuY2xhc3NMaXN0LmFkZChcImJ0bi1ncm91cFwiKTtcbiAgICAgICAgbWV0YUNvbnRyb2xzLmFwcGVuZENoaWxkKGJ1dHRvbkdyb3VwKTtcbiAgICAgICAgYnV0dG9uR3JvdXAuYXBwZW5kQ2hpbGQodGhpcy5fc3RhcnRCdG4pO1xuICAgICAgICBidXR0b25Hcm91cC5hcHBlbmRDaGlsZCh0aGlzLl9zdG9wQnRuKTtcbiAgICAgICAgYnV0dG9uR3JvdXAuYXBwZW5kQ2hpbGQodGhpcy5fcmVzdGFydEJ0bik7XG4gICAgICAgIHJldHVybiBtZXRhQ29udHJvbHM7XG4gICAgfVxuICAgIF9nZXRTdGF0dXNJdGVtKCkge1xuICAgICAgICB0aGlzLl9zdGF0dXNJdGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICAgIHRoaXMuX3N0YXR1c0l0ZW0uY2xhc3NMaXN0LmFkZChcInB1bGwtbGVmdFwiLCBcInN0YXRzLWl0ZW1cIik7XG4gICAgICAgIGNvbnN0IHN0YXR1c0NvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICB0aGlzLl9zdGF0dXNJdGVtLmFwcGVuZENoaWxkKHN0YXR1c0NvbnRhaW5lcik7XG4gICAgICAgIGNvbnN0IGljb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgc3RhdHVzQ29udGFpbmVyLmFwcGVuZENoaWxkKGljb24pO1xuICAgICAgICBpY29uLmNsYXNzTGlzdC5hZGQoXCJpY29uXCIsIFwiaWNvbi16YXBcIik7XG4gICAgICAgIHRoaXMuX3N0YXR1c1RleHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgc3RhdHVzQ29udGFpbmVyLmFwcGVuZENoaWxkKHRoaXMuX3N0YXR1c1RleHQpO1xuICAgICAgICByZXR1cm4gdGhpcy5fc3RhdHVzSXRlbTtcbiAgICB9XG4gICAgX2dldFZlcnNpb25zKCkge1xuICAgICAgICBjb25zdCB2ZXJzaW9ucyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICB2ZXJzaW9ucy5jbGFzc0xpc3QuYWRkKFwicHVsbC1yaWdodFwiLCBcInN0YXRzLWl0ZW1cIik7XG4gICAgICAgIGNvbnN0IHNwYW5zID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICAgIHNwYW5zLmNsYXNzTGlzdC5hZGQoXCJpY29uXCIsIFwiaWNvbi12ZXJzaW9uc1wiKTtcbiAgICAgICAgdmVyc2lvbnMuYXBwZW5kQ2hpbGQoc3BhbnMpO1xuICAgICAgICB0aGlzLl9ydW50aW1lVGV4dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICB2ZXJzaW9ucy5hcHBlbmRDaGlsZCh0aGlzLl9ydW50aW1lVGV4dCk7XG4gICAgICAgIHJldHVybiB2ZXJzaW9ucztcbiAgICB9XG4gICAgX2dldEJvZHkoKSB7XG4gICAgICAgIGNvbnN0IGJvZHkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICB0aGlzLl9ib2R5ID0gYm9keTtcbiAgICAgICAgYm9keS5jbGFzc0xpc3QuYWRkKFwiYm9keVwiKTtcbiAgICAgICAgY29uc3QgaGVhZGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImg0XCIpO1xuICAgICAgICBoZWFkZXIuY2xhc3NMaXN0LmFkZChcIm5hbWVcIik7XG4gICAgICAgIGJvZHkuYXBwZW5kQ2hpbGQoaGVhZGVyKTtcbiAgICAgICAgdGhpcy5fbmFtZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICBoZWFkZXIuYXBwZW5kQ2hpbGQodGhpcy5fbmFtZSk7XG4gICAgICAgIGNvbnN0IHZlcnNpb25zID0gdGhpcy5fZ2V0VmVyc2lvbnMoKTtcbiAgICAgICAgYm9keS5hcHBlbmRDaGlsZCh2ZXJzaW9ucyk7XG4gICAgICAgIGNvbnN0IHN0YXR1c0l0ZW0gPSB0aGlzLl9nZXRTdGF0dXNJdGVtKCk7XG4gICAgICAgIGJvZHkuYXBwZW5kQ2hpbGQoc3RhdHVzSXRlbSk7XG4gICAgICAgIGNvbnN0IG1ldGFDb250cm9scyA9IHRoaXMuX2dldE1ldGFDb250cm9scygpO1xuICAgICAgICBib2R5LmFwcGVuZENoaWxkKG1ldGFDb250cm9scyk7XG4gICAgICAgIHJldHVybiBib2R5O1xuICAgIH1cbiAgICBfZ2V0UHJvamVjdHMoKSB7XG4gICAgICAgIHRoaXMuX3Byb2plY3RzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgdGhpcy5fcHJvamVjdHMuY2xhc3NMaXN0LmFkZChcIm1ldGFcIiwgXCJtZXRhLXByb2plY3RzXCIpO1xuICAgICAgICBjb25zdCBoZWFkZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICBoZWFkZXIuY2xhc3NMaXN0LmFkZChcImhlYWRlclwiKTtcbiAgICAgICAgaGVhZGVyLmlubmVyVGV4dCA9IFwiUHJvamVjdHNcIjtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3Byb2plY3RzO1xuICAgIH1cbiAgICBfZ2V0QnV0dG9ucygpIHtcbiAgICAgICAgdGhpcy5fYnV0dG9ucyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgIHRoaXMuX2J1dHRvbnMuY2xhc3NMaXN0LmFkZChcInNlbGVjdG9yXCIsIFwiYnRuLWdyb3VwXCIsIFwiYnRuLWdyb3VwLXhzXCIpO1xuICAgICAgICBjb25zdCBsZWZ0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgbGVmdC5jbGFzc0xpc3QuYWRkKFwiYnRuXCIsIFwiYnRuLXhzXCIsIFwiaWNvblwiLCBcImljb24tdHJpYW5nbGUtbGVmdFwiKTtcbiAgICAgICAgbGVmdC5vbmNsaWNrID0gKGUpID0+IGF0b20uY29tbWFuZHMuZGlzcGF0Y2goYXRvbS52aWV3cy5nZXRWaWV3KGF0b20ud29ya3NwYWNlKSwgXCJvbW5pc2hhcnAtYXRvbTpwcmV2aW91cy1zb2x1dGlvbi1zdGF0dXNcIik7XG4gICAgICAgIHRoaXMuX2J1dHRvbnMuYXBwZW5kQ2hpbGQobGVmdCk7XG4gICAgICAgIGNvbnN0IHJpZ2h0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgcmlnaHQuY2xhc3NMaXN0LmFkZChcImJ0blwiLCBcImJ0bi14c1wiLCBcImljb25cIiwgXCJpY29uLXRyaWFuZ2xlLXJpZ2h0XCIpO1xuICAgICAgICByaWdodC5vbmNsaWNrID0gKGUpID0+IGF0b20uY29tbWFuZHMuZGlzcGF0Y2goYXRvbS52aWV3cy5nZXRWaWV3KGF0b20ud29ya3NwYWNlKSwgXCJvbW5pc2hhcnAtYXRvbTpuZXh0LXNvbHV0aW9uLXN0YXR1c1wiKTtcbiAgICAgICAgdGhpcy5fYnV0dG9ucy5hcHBlbmRDaGlsZChyaWdodCk7XG4gICAgICAgIHJldHVybiB0aGlzLl9idXR0b25zO1xuICAgIH1cbiAgICBjcmVhdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMubW9kZWxEaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgdGhpcy5jbGFzc0xpc3QuYWRkKFwib21uaXNoYXJwLWNhcmRcIik7XG4gICAgICAgIHRoaXMuX2dldEJ1dHRvbnMoKTtcbiAgICAgICAgY29uc3QgYm9keSA9IHRoaXMuX2dldEJvZHkoKTtcbiAgICAgICAgdGhpcy5hcHBlbmRDaGlsZChib2R5KTtcbiAgICAgICAgY29uc3QgcHJvamVjdHMgPSB0aGlzLl9nZXRQcm9qZWN0cygpO1xuICAgICAgICB0aGlzLmFwcGVuZENoaWxkKHByb2plY3RzKTtcbiAgICB9XG4gICAgYXR0YWNoZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdGhpcy52ZXJpZnlQb3NpdGlvbigpO1xuICAgIH1cbiAgICB1cGRhdGVDYXJkKG1vZGVsLCBjb3VudCkge1xuICAgICAgICB0aGlzLm1vZGVsID0gbW9kZWw7XG4gICAgICAgIHRoaXMuY291bnQgPSBjb3VudDtcbiAgICB9XG4gICAgdmVyaWZ5UG9zaXRpb24oKSB7XG4gICAgICAgIGNvbnN0IG9mZnNldCA9ICQoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCh0aGlzLmF0dGFjaFRvKSkub2Zmc2V0KCk7XG4gICAgICAgIGlmIChvZmZzZXQpIHtcbiAgICAgICAgICAgICQodGhpcykuY3NzKHtcbiAgICAgICAgICAgICAgICBwb3NpdGlvbjogXCJmaXhlZFwiLFxuICAgICAgICAgICAgICAgIHRvcDogb2Zmc2V0LnRvcCAtIHRoaXMuY2xpZW50SGVpZ2h0LFxuICAgICAgICAgICAgICAgIGxlZnQ6IG9mZnNldC5sZWZ0XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbn1cbmV4cG9ydHMuU29sdXRpb25TdGF0dXNDYXJkID0gZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50KFwib21uaXNoYXJwLXNvbHV0aW9uLWNhcmRcIiwgeyBwcm90b3R5cGU6IFNvbHV0aW9uU3RhdHVzQ2FyZC5wcm90b3R5cGUgfSk7XG4iLCJpbXBvcnQgXyBmcm9tIFwibG9kYXNoXCI7XHJcbmltcG9ydCB7Vmlld01vZGVsfSBmcm9tIFwiLi4vc2VydmVyL3ZpZXctbW9kZWxcIjtcclxuaW1wb3J0IHtQcm9qZWN0Vmlld01vZGVsfSBmcm9tIFwiLi4vc2VydmVyL3Byb2plY3Qtdmlldy1tb2RlbFwiO1xyXG5pbXBvcnQge0RyaXZlclN0YXRlfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xyXG5pbXBvcnQge0NvbXBvc2l0ZURpc3Bvc2FibGV9ICBmcm9tIFwidHMtZGlzcG9zYWJsZXNcIjtcclxuY29uc3QgJDogSlF1ZXJ5U3RhdGljID0gcmVxdWlyZShcImpxdWVyeVwiKTtcclxubGV0IGZhc3Rkb206IHR5cGVvZiBGYXN0ZG9tID0gcmVxdWlyZShcImZhc3Rkb21cIik7XHJcbmltcG9ydCB7YmFzZW5hbWV9IGZyb20gXCJwYXRoXCI7XHJcblxyXG5mdW5jdGlvbiB0cnVuY2F0ZVN0cmluZ1JldmVyc2Uoc3RyOiBzdHJpbmcsIG1heExlbmd0aCA9IDU1KSB7XHJcbiAgICBjb25zdCByZXZlcnNlZFN0cmluZyA9IF8udG9BcnJheShzdHIpLnJldmVyc2UoKS5qb2luKFwiXCIpO1xyXG4gICAgcmV0dXJuIF8udG9BcnJheShfLnRydW5jYXRlKHJldmVyc2VkU3RyaW5nLCBtYXhMZW5ndGgpKS5yZXZlcnNlKCkuam9pbihcIlwiKTtcclxufVxyXG5cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgUHJvamVjdERpc3BsYXlFbGVtZW50IGV4dGVuZHMgSFRNTERpdkVsZW1lbnQge1xyXG4gICAgcHJvamVjdDogUHJvamVjdFZpZXdNb2RlbDxhbnk+O1xyXG4gICAga2V5OiBzdHJpbmc7XHJcbn1cclxuXHJcbmNvbnN0IGdldE1lc3NhZ2VFbGVtZW50ID0gKGZ1bmN0aW9uKCkge1xyXG4gICAgY29uc3QgcHJvamVjdFByb3BzID0ge1xyXG4gICAgICAgIGdldDogZnVuY3Rpb24gcHJvamVjdCgpIHsgcmV0dXJuIHRoaXMuX3Byb2plY3Q7IH0sXHJcbiAgICAgICAgc2V0OiBmdW5jdGlvbiBwcm9qZWN0KHByb2plY3Q6IFByb2plY3RWaWV3TW9kZWw8YW55Pikge1xyXG4gICAgICAgICAgICB0aGlzLl9wcm9qZWN0ID0gcHJvamVjdDtcclxuICAgICAgICAgICAgdGhpcy5fa2V5ID0gcHJvamVjdC5wYXRoO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgcGF0aCA9IHRydW5jYXRlU3RyaW5nUmV2ZXJzZShwcm9qZWN0LnBhdGgucmVwbGFjZSh0aGlzLnByb2plY3Quc29sdXRpb25QYXRoLCBcIlwiKSwgMjQpO1xyXG4gICAgICAgICAgICB0aGlzLnRpdGxlID0gYCR7cGF0aH0gWyR7cHJvamVjdC5mcmFtZXdvcmtzLmZpbHRlcih6ID0+IHouTmFtZSAhPT0gXCJhbGxcIikubWFwKHggPT4geC5GcmllbmRseU5hbWUpfV1gO1xyXG4gICAgICAgICAgICB0aGlzLmlubmVyVGV4dCA9IHByb2plY3QubmFtZTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIGNvbnN0IGtleVByb3BzID0ge1xyXG4gICAgICAgIGdldDogZnVuY3Rpb24ga2V5KCkgeyByZXR1cm4gdGhpcy5fa2V5OyB9XHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiBmdW5jdGlvbiBnZXRNZXNzYWdlRWxlbWVudCgpOiBQcm9qZWN0RGlzcGxheUVsZW1lbnQge1xyXG4gICAgICAgIGNvbnN0IGVsZW1lbnQ6IFByb2plY3REaXNwbGF5RWxlbWVudCA9IDxhbnk+ZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5hZGQoXCJwcm9qZWN0XCIsIFwibmFtZVwiKTtcclxuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZWxlbWVudCwgXCJwcm9qZWN0XCIsIHByb2plY3RQcm9wcyk7XHJcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGVsZW1lbnQsIFwia2V5XCIsIGtleVByb3BzKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGVsZW1lbnQ7XHJcbiAgICB9O1xyXG59KSgpO1xyXG5cclxuZXhwb3J0IGNsYXNzIFNvbHV0aW9uU3RhdHVzQ2FyZCBleHRlbmRzIEhUTUxEaXZFbGVtZW50IGltcGxlbWVudHMgV2ViQ29tcG9uZW50IHtcclxuICAgIHB1YmxpYyBkaXNwbGF5TmFtZSA9IFwiQ2FyZFwiO1xyXG5cclxuICAgIHByaXZhdGUgbW9kZWxEaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xyXG4gICAgcHVibGljIGF0dGFjaFRvOiBzdHJpbmc7XHJcblxyXG4gICAgcHJpdmF0ZSBfbmFtZTogSFRNTFNwYW5FbGVtZW50O1xyXG4gICAgcHJpdmF0ZSBfcHJvamVjdHM6IEhUTUxEaXZFbGVtZW50O1xyXG4gICAgcHJpdmF0ZSBfYnV0dG9uczogSFRNTERpdkVsZW1lbnQ7XHJcbiAgICBwcml2YXRlIF9ib2R5OiBIVE1MRWxlbWVudDtcclxuXHJcbiAgICBwcml2YXRlIF9zdG9wQnRuOiBIVE1MQnV0dG9uRWxlbWVudDtcclxuICAgIHByaXZhdGUgX3N0YXJ0QnRuOiBIVE1MQnV0dG9uRWxlbWVudDtcclxuICAgIHByaXZhdGUgX3Jlc3RhcnRCdG46IEhUTUxCdXR0b25FbGVtZW50O1xyXG5cclxuICAgIHByaXZhdGUgX3N0YXR1c0l0ZW06IEhUTUxTcGFuRWxlbWVudDtcclxuICAgIHByaXZhdGUgX3N0YXR1c1RleHQ6IEhUTUxTcGFuRWxlbWVudDtcclxuICAgIHByaXZhdGUgX3J1bnRpbWVUZXh0OiBIVE1MU3BhbkVsZW1lbnQ7XHJcblxyXG4gICAgcHJpdmF0ZSBfY291bnQ6IG51bWJlcjtcclxuICAgIHB1YmxpYyBnZXQgY291bnQoKSB7IHJldHVybiB0aGlzLl9jb3VudDsgfVxyXG4gICAgcHVibGljIHNldCBjb3VudChjb3VudCkge1xyXG4gICAgICAgIGlmICh0aGlzLl9jb3VudCAhPT0gY291bnQpIHtcclxuICAgICAgICAgICAgdGhpcy5fY291bnQgPSBjb3VudDtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMuX2NvdW50ID4gMSkge1xyXG4gICAgICAgICAgICB0aGlzLl9ib2R5LnBhcmVudEVsZW1lbnQuaW5zZXJ0QmVmb3JlKHRoaXMuX2J1dHRvbnMsIHRoaXMuX2JvZHkpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2J1dHRvbnMucmVtb3ZlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX21vZGVsOiBWaWV3TW9kZWw7XHJcbiAgICBwdWJsaWMgZ2V0IG1vZGVsKCkgeyByZXR1cm4gdGhpcy5fbW9kZWw7IH1cclxuICAgIHB1YmxpYyBzZXQgbW9kZWwobW9kZWwpIHtcclxuICAgICAgICB0aGlzLl9tb2RlbCA9IG1vZGVsO1xyXG4gICAgICAgIHRoaXMubW9kZWxEaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgICAgICB0aGlzLm1vZGVsRGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcblxyXG4gICAgICAgIHRoaXMubW9kZWxEaXNwb3NhYmxlLmFkZCh0aGlzLl9tb2RlbC5vYnNlcnZlLnN0YXRlLmRlbGF5KDEwKS5zdWJzY3JpYmUoKHtpbmRleCwgcGF0aCwgLypydW50aW1lLCovIHN0YXRlLCBpc1JlYWR5LCBpc09mZiwgaXNPbn0pID0+IHtcclxuICAgICAgICAgICAgZmFzdGRvbS5tdXRhdGUoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgbmFtZSA9IGAke2Jhc2VuYW1lKHBhdGgpfSAoJHtpbmRleH0pYDtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9uYW1lLmlubmVyVGV4dCAhPT0gbmFtZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX25hbWUuaW5uZXJUZXh0ID0gbmFtZTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoc3RhdGUgPT09IERyaXZlclN0YXRlLkNvbm5lY3RlZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3N0YXR1c1RleHQuaW5uZXJUZXh0ID0gXCJPbmxpbmVcIjtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoc3RhdGUgPT09IERyaXZlclN0YXRlLkNvbm5lY3RpbmcpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9zdGF0dXNUZXh0LmlubmVyVGV4dCA9IFwiTG9hZGluZ1wiO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChzdGF0ZSA9PT0gRHJpdmVyU3RhdGUuRGlzY29ubmVjdGVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc3RhdHVzVGV4dC5pbm5lclRleHQgPSBcIk9mZmxpbmVcIjtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc3RhdHVzVGV4dC5pbm5lclRleHQgPSBEcml2ZXJTdGF0ZVtzdGF0ZV07XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGlzUmVhZHkpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9zdGFydEJ0bi5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc3RvcEJ0bi5zdHlsZS5kaXNwbGF5ID0gXCJcIjtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoaXNPZmYpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9zdGFydEJ0bi5zdHlsZS5kaXNwbGF5ID0gXCJcIjtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9zdG9wQnRuLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc3RhcnRCdG4uc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3N0b3BCdG4uc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChpc09uKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcmVzdGFydEJ0bi5zdHlsZS5kaXNwbGF5ID0gXCJcIjtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcmVzdGFydEJ0bi5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGlzT2ZmKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcHJvamVjdHMuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9wcm9qZWN0cy5zdHlsZS5kaXNwbGF5ID0gXCJcIjtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvL3RoaXMuX3N0YXR1c1RleHQuaW5uZXJUZXh0ID0gRHJpdmVyU3RhdGVbc3RhdGVdO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fc3RhdHVzSXRlbS5jbGFzc05hbWUgPSBcInB1bGwtbGVmdCBzdGF0cy1pdGVtXCI7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9zdGF0dXNJdGVtLmNsYXNzTGlzdC5hZGQoRHJpdmVyU3RhdGVbc3RhdGVdLnRvTG93ZXJDYXNlKCkpO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMudmVyaWZ5UG9zaXRpb24oKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvKmlmIChydW50aW1lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcnVudGltZVRleHQuc3R5bGUuZGlzcGxheSA9IFwiXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcnVudGltZVRleHQuaW5uZXJUZXh0ID0gcnVudGltZTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7Ki9cclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9ydW50aW1lVGV4dC5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcnVudGltZVRleHQuaW5uZXJUZXh0ID0gXCJcIjtcclxuICAgICAgICAgICAgICAgIC8qfSovXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5tb2RlbERpc3Bvc2FibGUuYWRkKHRoaXMuX21vZGVsLm9ic2VydmUucHJvamVjdHMuc3Vic2NyaWJlKHByb2plY3RzID0+IHtcclxuICAgICAgICAgICAgZmFzdGRvbS5tdXRhdGUoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDAsIGxlbiA9IHRoaXMuX3Byb2plY3RzLmNoaWxkcmVuLmxlbmd0aCA+IHByb2plY3RzLmxlbmd0aCA/IHRoaXMuX3Byb2plY3RzLmNoaWxkcmVuLmxlbmd0aCA6IHByb2plY3RzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaXRlbSA9IHByb2plY3RzW2ldO1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBjaGlsZDogUHJvamVjdERpc3BsYXlFbGVtZW50ID0gPGFueT50aGlzLl9wcm9qZWN0cy5jaGlsZHJlbltpXTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFpdGVtICYmIGNoaWxkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGl0ZW0gJiYgIWNoaWxkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkID0gZ2V0TWVzc2FnZUVsZW1lbnQoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fcHJvamVjdHMuYXBwZW5kQ2hpbGQoY2hpbGQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNoaWxkICYmIGNoaWxkLmtleSAhPT0gaXRlbS5wYXRoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkLnByb2plY3QgPSBpdGVtO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLnZlcmlmeVBvc2l0aW9uKCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9nZXRNZXRhQ29udHJvbHMoKSB7XHJcbiAgICAgICAgdGhpcy5fc3RvcEJ0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XHJcbiAgICAgICAgdGhpcy5fc3RvcEJ0bi5jbGFzc0xpc3QuYWRkKFwiYnRuXCIsIFwiYnRuLXhzXCIsIFwiYnRuLWVycm9yXCIpO1xyXG4gICAgICAgIHRoaXMuX3N0b3BCdG4ub25jbGljayA9ICgpID0+IGF0b20uY29tbWFuZHMuZGlzcGF0Y2goYXRvbS52aWV3cy5nZXRWaWV3KGF0b20ud29ya3NwYWNlKSwgXCJvbW5pc2hhcnAtYXRvbTpzdG9wLXNlcnZlclwiKTtcclxuXHJcbiAgICAgICAgbGV0IHNwYW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcclxuICAgICAgICBzcGFuLmNsYXNzTGlzdC5hZGQoXCJmYVwiLCBcImZhLXN0b3BcIik7XHJcbiAgICAgICAgdGhpcy5fc3RvcEJ0bi5hcHBlbmRDaGlsZChzcGFuKTtcclxuICAgICAgICB0aGlzLl9zdG9wQnRuLmlubmVySFRNTCArPSBcIiBTdG9wXCI7XHJcblxyXG4gICAgICAgIHRoaXMuX3N0YXJ0QnRuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImJ1dHRvblwiKTtcclxuICAgICAgICB0aGlzLl9zdGFydEJ0bi5jbGFzc0xpc3QuYWRkKFwiYnRuXCIsIFwiYnRuLXhzXCIsIFwiYnRuLXN1Y2Nlc3NcIik7XHJcbiAgICAgICAgdGhpcy5fc3RhcnRCdG4ub25jbGljayA9ICgpID0+IGF0b20uY29tbWFuZHMuZGlzcGF0Y2goYXRvbS52aWV3cy5nZXRWaWV3KGF0b20ud29ya3NwYWNlKSwgXCJvbW5pc2hhcnAtYXRvbTpzdGFydC1zZXJ2ZXJcIik7XHJcblxyXG4gICAgICAgIHNwYW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcclxuICAgICAgICBzcGFuLmNsYXNzTGlzdC5hZGQoXCJmYVwiLCBcImZhLXBsYXlcIik7XHJcbiAgICAgICAgdGhpcy5fc3RhcnRCdG4uYXBwZW5kQ2hpbGQoc3Bhbik7XHJcbiAgICAgICAgdGhpcy5fc3RhcnRCdG4uaW5uZXJIVE1MICs9IFwiIFN0YXJ0XCI7XHJcblxyXG4gICAgICAgIHRoaXMuX3Jlc3RhcnRCdG4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpO1xyXG4gICAgICAgIHRoaXMuX3Jlc3RhcnRCdG4uY2xhc3NMaXN0LmFkZChcImJ0blwiLCBcImJ0bi14c1wiLCBcImJ0bi1pbmZvXCIpO1xyXG4gICAgICAgIHRoaXMuX3Jlc3RhcnRCdG4ub25jbGljayA9ICgpID0+IGF0b20uY29tbWFuZHMuZGlzcGF0Y2goYXRvbS52aWV3cy5nZXRWaWV3KGF0b20ud29ya3NwYWNlKSwgXCJvbW5pc2hhcnAtYXRvbTpyZXN0YXJ0LXNlcnZlclwiKTtcclxuXHJcbiAgICAgICAgc3BhbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xyXG4gICAgICAgIHNwYW4uY2xhc3NMaXN0LmFkZChcImZhXCIsIFwiZmEtcmVmcmVzaFwiKTtcclxuICAgICAgICB0aGlzLl9yZXN0YXJ0QnRuLmFwcGVuZENoaWxkKHNwYW4pO1xyXG4gICAgICAgIHRoaXMuX3Jlc3RhcnRCdG4uaW5uZXJIVE1MICs9IFwiIFJlc3RhcnRcIjtcclxuXHJcbiAgICAgICAgY29uc3QgbWV0YUNvbnRyb2xzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuICAgICAgICBtZXRhQ29udHJvbHMuY2xhc3NMaXN0LmFkZChcIm1ldGEtY29udHJvbHNcIik7XHJcblxyXG4gICAgICAgIGNvbnN0IGJ1dHRvbkdyb3VwID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuICAgICAgICBidXR0b25Hcm91cC5jbGFzc0xpc3QuYWRkKFwiYnRuLWdyb3VwXCIpO1xyXG4gICAgICAgIG1ldGFDb250cm9scy5hcHBlbmRDaGlsZChidXR0b25Hcm91cCk7XHJcblxyXG4gICAgICAgIGJ1dHRvbkdyb3VwLmFwcGVuZENoaWxkKHRoaXMuX3N0YXJ0QnRuKTtcclxuICAgICAgICBidXR0b25Hcm91cC5hcHBlbmRDaGlsZCh0aGlzLl9zdG9wQnRuKTtcclxuICAgICAgICBidXR0b25Hcm91cC5hcHBlbmRDaGlsZCh0aGlzLl9yZXN0YXJ0QnRuKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIG1ldGFDb250cm9scztcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9nZXRTdGF0dXNJdGVtKCkge1xyXG4gICAgICAgIHRoaXMuX3N0YXR1c0l0ZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcclxuICAgICAgICB0aGlzLl9zdGF0dXNJdGVtLmNsYXNzTGlzdC5hZGQoXCJwdWxsLWxlZnRcIiwgXCJzdGF0cy1pdGVtXCIpO1xyXG5cclxuICAgICAgICBjb25zdCBzdGF0dXNDb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcclxuICAgICAgICB0aGlzLl9zdGF0dXNJdGVtLmFwcGVuZENoaWxkKHN0YXR1c0NvbnRhaW5lcik7XHJcbiAgICAgICAgY29uc3QgaWNvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xyXG4gICAgICAgIHN0YXR1c0NvbnRhaW5lci5hcHBlbmRDaGlsZChpY29uKTtcclxuICAgICAgICBpY29uLmNsYXNzTGlzdC5hZGQoXCJpY29uXCIsIFwiaWNvbi16YXBcIik7XHJcblxyXG4gICAgICAgIHRoaXMuX3N0YXR1c1RleHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcclxuICAgICAgICBzdGF0dXNDb250YWluZXIuYXBwZW5kQ2hpbGQodGhpcy5fc3RhdHVzVGV4dCk7XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzLl9zdGF0dXNJdGVtO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX2dldFZlcnNpb25zKCkge1xyXG4gICAgICAgIGNvbnN0IHZlcnNpb25zID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XHJcbiAgICAgICAgdmVyc2lvbnMuY2xhc3NMaXN0LmFkZChcInB1bGwtcmlnaHRcIiwgXCJzdGF0cy1pdGVtXCIpO1xyXG5cclxuICAgICAgICBjb25zdCBzcGFucyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xyXG4gICAgICAgIHNwYW5zLmNsYXNzTGlzdC5hZGQoXCJpY29uXCIsIFwiaWNvbi12ZXJzaW9uc1wiKTtcclxuICAgICAgICB2ZXJzaW9ucy5hcHBlbmRDaGlsZChzcGFucyk7XHJcblxyXG4gICAgICAgIHRoaXMuX3J1bnRpbWVUZXh0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XHJcbiAgICAgICAgdmVyc2lvbnMuYXBwZW5kQ2hpbGQodGhpcy5fcnVudGltZVRleHQpO1xyXG5cclxuICAgICAgICByZXR1cm4gdmVyc2lvbnM7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfZ2V0Qm9keSgpIHtcclxuICAgICAgICBjb25zdCBib2R5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuICAgICAgICB0aGlzLl9ib2R5ID0gYm9keTtcclxuICAgICAgICBib2R5LmNsYXNzTGlzdC5hZGQoXCJib2R5XCIpO1xyXG5cclxuICAgICAgICBjb25zdCBoZWFkZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaDRcIik7XHJcbiAgICAgICAgaGVhZGVyLmNsYXNzTGlzdC5hZGQoXCJuYW1lXCIpO1xyXG4gICAgICAgIGJvZHkuYXBwZW5kQ2hpbGQoaGVhZGVyKTtcclxuXHJcbiAgICAgICAgdGhpcy5fbmFtZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xyXG4gICAgICAgIGhlYWRlci5hcHBlbmRDaGlsZCh0aGlzLl9uYW1lKTtcclxuXHJcbiAgICAgICAgY29uc3QgdmVyc2lvbnMgPSB0aGlzLl9nZXRWZXJzaW9ucygpO1xyXG4gICAgICAgIGJvZHkuYXBwZW5kQ2hpbGQodmVyc2lvbnMpO1xyXG5cclxuICAgICAgICBjb25zdCBzdGF0dXNJdGVtID0gdGhpcy5fZ2V0U3RhdHVzSXRlbSgpO1xyXG4gICAgICAgIGJvZHkuYXBwZW5kQ2hpbGQoc3RhdHVzSXRlbSk7XHJcblxyXG4gICAgICAgIGNvbnN0IG1ldGFDb250cm9scyA9IHRoaXMuX2dldE1ldGFDb250cm9scygpO1xyXG4gICAgICAgIGJvZHkuYXBwZW5kQ2hpbGQobWV0YUNvbnRyb2xzKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGJvZHk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfZ2V0UHJvamVjdHMoKSB7XHJcbiAgICAgICAgdGhpcy5fcHJvamVjdHMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gICAgICAgIHRoaXMuX3Byb2plY3RzLmNsYXNzTGlzdC5hZGQoXCJtZXRhXCIsIFwibWV0YS1wcm9qZWN0c1wiKTtcclxuXHJcbiAgICAgICAgY29uc3QgaGVhZGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuICAgICAgICBoZWFkZXIuY2xhc3NMaXN0LmFkZChcImhlYWRlclwiKTtcclxuICAgICAgICBoZWFkZXIuaW5uZXJUZXh0ID0gXCJQcm9qZWN0c1wiO1xyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy5fcHJvamVjdHM7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfZ2V0QnV0dG9ucygpIHtcclxuICAgICAgICB0aGlzLl9idXR0b25zID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuICAgICAgICB0aGlzLl9idXR0b25zLmNsYXNzTGlzdC5hZGQoXCJzZWxlY3RvclwiLCBcImJ0bi1ncm91cFwiLCBcImJ0bi1ncm91cC14c1wiKTtcclxuXHJcbiAgICAgICAgY29uc3QgbGVmdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgICAgICAgbGVmdC5jbGFzc0xpc3QuYWRkKFwiYnRuXCIsIFwiYnRuLXhzXCIsIFwiaWNvblwiLCBcImljb24tdHJpYW5nbGUtbGVmdFwiKTtcclxuICAgICAgICBsZWZ0Lm9uY2xpY2sgPSAoZSkgPT4gYXRvbS5jb21tYW5kcy5kaXNwYXRjaChhdG9tLnZpZXdzLmdldFZpZXcoYXRvbS53b3Jrc3BhY2UpLCBcIm9tbmlzaGFycC1hdG9tOnByZXZpb3VzLXNvbHV0aW9uLXN0YXR1c1wiKTtcclxuICAgICAgICB0aGlzLl9idXR0b25zLmFwcGVuZENoaWxkKGxlZnQpO1xyXG5cclxuICAgICAgICBjb25zdCByaWdodCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgICAgICAgcmlnaHQuY2xhc3NMaXN0LmFkZChcImJ0blwiLCBcImJ0bi14c1wiLCBcImljb25cIiwgXCJpY29uLXRyaWFuZ2xlLXJpZ2h0XCIpO1xyXG4gICAgICAgIHJpZ2h0Lm9uY2xpY2sgPSAoZSkgPT4gYXRvbS5jb21tYW5kcy5kaXNwYXRjaChhdG9tLnZpZXdzLmdldFZpZXcoYXRvbS53b3Jrc3BhY2UpLCBcIm9tbmlzaGFycC1hdG9tOm5leHQtc29sdXRpb24tc3RhdHVzXCIpO1xyXG4gICAgICAgIHRoaXMuX2J1dHRvbnMuYXBwZW5kQ2hpbGQocmlnaHQpO1xyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy5fYnV0dG9ucztcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgY3JlYXRlZENhbGxiYWNrKCkge1xyXG4gICAgICAgIHRoaXMubW9kZWxEaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuXHJcbiAgICAgICAgdGhpcy5jbGFzc0xpc3QuYWRkKFwib21uaXNoYXJwLWNhcmRcIik7XHJcblxyXG4gICAgICAgIHRoaXMuX2dldEJ1dHRvbnMoKTtcclxuXHJcbiAgICAgICAgY29uc3QgYm9keSA9IHRoaXMuX2dldEJvZHkoKTtcclxuICAgICAgICB0aGlzLmFwcGVuZENoaWxkKGJvZHkpO1xyXG5cclxuICAgICAgICBjb25zdCBwcm9qZWN0cyA9IHRoaXMuX2dldFByb2plY3RzKCk7XHJcbiAgICAgICAgdGhpcy5hcHBlbmRDaGlsZChwcm9qZWN0cyk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGF0dGFjaGVkQ2FsbGJhY2soKSB7XHJcbiAgICAgICAgdGhpcy52ZXJpZnlQb3NpdGlvbigpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB1cGRhdGVDYXJkKG1vZGVsOiBWaWV3TW9kZWwsIGNvdW50OiBudW1iZXIpIHtcclxuICAgICAgICB0aGlzLm1vZGVsID0gbW9kZWw7XHJcbiAgICAgICAgdGhpcy5jb3VudCA9IGNvdW50O1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgdmVyaWZ5UG9zaXRpb24oKSB7XHJcbiAgICAgICAgY29uc3Qgb2Zmc2V0ID0gJChkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHRoaXMuYXR0YWNoVG8pKS5vZmZzZXQoKTtcclxuICAgICAgICBpZiAob2Zmc2V0KSB7XHJcbiAgICAgICAgICAgICQodGhpcykuY3NzKHtcclxuICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBcImZpeGVkXCIsXHJcbiAgICAgICAgICAgICAgICB0b3A6IG9mZnNldC50b3AgLSB0aGlzLmNsaWVudEhlaWdodCxcclxuICAgICAgICAgICAgICAgIGxlZnQ6IG9mZnNldC5sZWZ0XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuKDxhbnk+ZXhwb3J0cykuU29sdXRpb25TdGF0dXNDYXJkID0gKDxhbnk+ZG9jdW1lbnQpLnJlZ2lzdGVyRWxlbWVudChcIm9tbmlzaGFycC1zb2x1dGlvbi1jYXJkXCIsIHsgcHJvdG90eXBlOiBTb2x1dGlvblN0YXR1c0NhcmQucHJvdG90eXBlIH0pO1xyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
