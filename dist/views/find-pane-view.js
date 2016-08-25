"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.FindWindow = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _omni = require("../server/omni");

var _path = require("path");

var path = _interopRequireWildcard(_path);

var _outputComponent = require("./output-component");

var _highlightElement = require("./highlight-element");

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var getMessageElement = function () {
    var selectedProps = {
        get: function selected() {
            return this.classList.contains("selected");
        },
        set: function selected(value) {
            if (value) this.classList.add("selected");else this.classList.remove("selected");
        }
    };
    var keyProps = {
        get: function key() {
            return this._key;
        }
    };
    var inviewProps = {
        get: function inview() {
            return this._inview;
        },
        set: function inview(value) {
            if (!this._inview && value) {
                this._text.enhance();
            }
            this._inview = value;
        }
    };
    function setMessage(key, item) {
        this._key = key;
        this._inview = false;
        this.classList.add(item.LogLevel);
        this._usage = item;
        this._text.usage = item;
        this._location.innerText = path.basename(item.FileName) + "(" + item.Line + "," + item.Column + ")";
        this._filename.innerText = path.dirname(item.FileName);
    }
    function attached() {
        this._text.usage = this._usage;
    }
    function detached() {
        this._inview = false;
    }
    return function getMessageElement() {
        var element = document.createElement("li");
        element.classList.add("find-usages");
        var text = element._text = new _highlightElement.HighlightElement();
        text.classList.add("text-highlight");
        element.appendChild(text);
        var location = element._location = document.createElement("pre");
        location.classList.add("inline-block");
        element.appendChild(location);
        var filename = element._filename = document.createElement("pre");
        filename.classList.add("text-subtle", "inline-block");
        element.appendChild(filename);
        Object.defineProperty(element, "key", keyProps);
        Object.defineProperty(element, "selected", selectedProps);
        Object.defineProperty(element, "inview", inviewProps);
        element.setMessage = setMessage;
        element.attached = attached;
        element.detached = detached;
        return element;
    };
}();

var FindWindow = exports.FindWindow = function (_HTMLDivElement) {
    _inherits(FindWindow, _HTMLDivElement);

    function FindWindow() {
        var _ref;

        _classCallCheck(this, FindWindow);

        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
        }

        var _this = _possibleConstructorReturn(this, (_ref = FindWindow.__proto__ || Object.getPrototypeOf(FindWindow)).call.apply(_ref, [this].concat(args)));

        _this.displayName = "FindPaneWindow";
        return _this;
    }

    _createClass(FindWindow, [{
        key: "createdCallback",
        value: function createdCallback() {
            var _this2 = this;

            this.classList.add("find-output-pane");
            this._list = new _outputComponent.OutputElement();
            this.appendChild(this._list);
            this._list.getKey = function (usage) {
                return "quick-fix-" + usage.FileName + "-(" + usage.Line + "-" + usage.Column + ")-(" + usage.EndLine + "-" + usage.EndColumn + ")-(" + usage.Projects.join("-") + ")";
            };
            this._list.handleClick = function (item) {
                _this2.gotoUsage(item);
            };
            this._list.eventName = "usage";
            this._list.elementFactory = getMessageElement;
        }
    }, {
        key: "attachedCallback",
        value: function attachedCallback() {
            this._list.attached();
        }
    }, {
        key: "detachedCallback",
        value: function detachedCallback() {
            this._list.detached();
        }
    }, {
        key: "update",
        value: function update(output) {
            this._list.updateOutput(output);
        }
    }, {
        key: "next",
        value: function next() {
            this._list.next();
        }
    }, {
        key: "prev",
        value: function prev() {
            this._list.prev();
        }
    }, {
        key: "gotoUsage",
        value: function gotoUsage(quickfix) {
            _omni.Omni.navigateTo(quickfix);
        }
    }, {
        key: "selectedIndex",
        get: function get() {
            return this._list.selectedIndex;
        },
        set: function set(value) {
            this._list.selectedIndex = value;
        }
    }, {
        key: "current",
        get: function get() {
            return this._list.current;
        }
    }]);

    return FindWindow;
}(HTMLDivElement);

exports.FindWindow = document.registerElement("omnisharp-find-window", { prototype: FindWindow.prototype });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy9maW5kLXBhbmUtdmlldy5qcyIsImxpYi92aWV3cy9maW5kLXBhbmUtdmlldy50cyJdLCJuYW1lcyI6WyJwYXRoIiwiZ2V0TWVzc2FnZUVsZW1lbnQiLCJzZWxlY3RlZFByb3BzIiwiZ2V0Iiwic2VsZWN0ZWQiLCJjbGFzc0xpc3QiLCJjb250YWlucyIsInNldCIsInZhbHVlIiwiYWRkIiwicmVtb3ZlIiwia2V5UHJvcHMiLCJrZXkiLCJfa2V5IiwiaW52aWV3UHJvcHMiLCJpbnZpZXciLCJfaW52aWV3IiwiX3RleHQiLCJlbmhhbmNlIiwic2V0TWVzc2FnZSIsIml0ZW0iLCJMb2dMZXZlbCIsIl91c2FnZSIsInVzYWdlIiwiX2xvY2F0aW9uIiwiaW5uZXJUZXh0IiwiYmFzZW5hbWUiLCJGaWxlTmFtZSIsIkxpbmUiLCJDb2x1bW4iLCJfZmlsZW5hbWUiLCJkaXJuYW1lIiwiYXR0YWNoZWQiLCJkZXRhY2hlZCIsImVsZW1lbnQiLCJkb2N1bWVudCIsImNyZWF0ZUVsZW1lbnQiLCJ0ZXh0IiwiYXBwZW5kQ2hpbGQiLCJsb2NhdGlvbiIsImZpbGVuYW1lIiwiT2JqZWN0IiwiZGVmaW5lUHJvcGVydHkiLCJGaW5kV2luZG93IiwiYXJncyIsImRpc3BsYXlOYW1lIiwiX2xpc3QiLCJnZXRLZXkiLCJFbmRMaW5lIiwiRW5kQ29sdW1uIiwiUHJvamVjdHMiLCJqb2luIiwiaGFuZGxlQ2xpY2siLCJnb3RvVXNhZ2UiLCJldmVudE5hbWUiLCJlbGVtZW50RmFjdG9yeSIsIm91dHB1dCIsInVwZGF0ZU91dHB1dCIsIm5leHQiLCJwcmV2IiwicXVpY2tmaXgiLCJuYXZpZ2F0ZVRvIiwic2VsZWN0ZWRJbmRleCIsImN1cnJlbnQiLCJIVE1MRGl2RWxlbWVudCIsImV4cG9ydHMiLCJyZWdpc3RlckVsZW1lbnQiLCJwcm90b3R5cGUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQUNBOztJQ0VZQSxJOztBRERaOztBQUNBOzs7Ozs7Ozs7O0FDTUEs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QjtBQUNuQixpQkFBS2MsS0FBTCxDQUFXYixRQUFYO0FBQ0g7OzsrQkFFYXVCLE0sRUFBeUI7QUFDbkMsaUJBQUtWLEtBQUwsQ0FBV1csWUFBWCxDQUF3QkQsTUFBeEI7QUFDSDs7OytCQUVVO0FBQ1AsaUJBQUtWLEtBQUwsQ0FBV1ksSUFBWDtBQUNIOzs7K0JBRVU7QUFDUCxpQkFBS1osS0FBTCxDQUFXYSxJQUFYO0FBQ0g7OztrQ0FNaUJDLFEsRUFBeUI7QUFDdkMsdUJBQUtDLFVBQUwsQ0FBZ0JELFFBQWhCO0FBQ0g7Ozs0QkFOdUI7QUFBSyxtQkFBTyxLQUFLZCxLQUFMLENBQVdnQixhQUFsQjtBQUFrQyxTOzBCQUN0Q3RELEssRUFBSztBQUFJLGlCQUFLc0MsS0FBTCxDQUFXZ0IsYUFBWCxHQUEyQnRELEtBQTNCO0FBQW1DOzs7NEJBQ25EO0FBQUssbUJBQU8sS0FBS3NDLEtBQUwsQ0FBV2lCLE9BQWxCO0FBQTRCOzs7O0VBeEN2QkMsYzs7QUErQzFCQyxRQUFTdEIsVUFBVCxHQUE0QlIsU0FBVStCLGVBQVYsQ0FBMEIsdUJBQTFCLEVBQW1ELEVBQUVDLFdBQVd4QixXQUFXd0IsU0FBeEIsRUFBbkQsQ0FBNUIiLCJmaWxlIjoibGliL3ZpZXdzL2ZpbmQtcGFuZS12aWV3LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgT21uaSB9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IHsgT3V0cHV0RWxlbWVudCB9IGZyb20gXCIuL291dHB1dC1jb21wb25lbnRcIjtcbmltcG9ydCB7IEhpZ2hsaWdodEVsZW1lbnQgfSBmcm9tIFwiLi9oaWdobGlnaHQtZWxlbWVudFwiO1xuY29uc3QgZ2V0TWVzc2FnZUVsZW1lbnQgPSAoZnVuY3Rpb24gKCkge1xuICAgIGNvbnN0IHNlbGVjdGVkUHJvcHMgPSB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gc2VsZWN0ZWQoKSB7IHJldHVybiB0aGlzLmNsYXNzTGlzdC5jb250YWlucyhcInNlbGVjdGVkXCIpOyB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uIHNlbGVjdGVkKHZhbHVlKSB7IGlmICh2YWx1ZSlcbiAgICAgICAgICAgIHRoaXMuY2xhc3NMaXN0LmFkZChcInNlbGVjdGVkXCIpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICB0aGlzLmNsYXNzTGlzdC5yZW1vdmUoXCJzZWxlY3RlZFwiKTsgfVxuICAgIH07XG4gICAgY29uc3Qga2V5UHJvcHMgPSB7XG4gICAgICAgIGdldDogZnVuY3Rpb24ga2V5KCkgeyByZXR1cm4gdGhpcy5fa2V5OyB9XG4gICAgfTtcbiAgICBjb25zdCBpbnZpZXdQcm9wcyA9IHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiBpbnZpZXcoKSB7IHJldHVybiB0aGlzLl9pbnZpZXc7IH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gaW52aWV3KHZhbHVlKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuX2ludmlldyAmJiB2YWx1ZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3RleHQuZW5oYW5jZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5faW52aWV3ID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIGZ1bmN0aW9uIHNldE1lc3NhZ2Uoa2V5LCBpdGVtKSB7XG4gICAgICAgIHRoaXMuX2tleSA9IGtleTtcbiAgICAgICAgdGhpcy5faW52aWV3ID0gZmFsc2U7XG4gICAgICAgIHRoaXMuY2xhc3NMaXN0LmFkZChpdGVtLkxvZ0xldmVsKTtcbiAgICAgICAgdGhpcy5fdXNhZ2UgPSBpdGVtO1xuICAgICAgICB0aGlzLl90ZXh0LnVzYWdlID0gaXRlbTtcbiAgICAgICAgdGhpcy5fbG9jYXRpb24uaW5uZXJUZXh0ID0gYCR7cGF0aC5iYXNlbmFtZShpdGVtLkZpbGVOYW1lKX0oJHtpdGVtLkxpbmV9LCR7aXRlbS5Db2x1bW59KWA7XG4gICAgICAgIHRoaXMuX2ZpbGVuYW1lLmlubmVyVGV4dCA9IHBhdGguZGlybmFtZShpdGVtLkZpbGVOYW1lKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gYXR0YWNoZWQoKSB7XG4gICAgICAgIHRoaXMuX3RleHQudXNhZ2UgPSB0aGlzLl91c2FnZTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZGV0YWNoZWQoKSB7IHRoaXMuX2ludmlldyA9IGZhbHNlOyB9XG4gICAgcmV0dXJuIGZ1bmN0aW9uIGdldE1lc3NhZ2VFbGVtZW50KCkge1xuICAgICAgICBjb25zdCBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImxpXCIpO1xuICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5hZGQoXCJmaW5kLXVzYWdlc1wiKTtcbiAgICAgICAgY29uc3QgdGV4dCA9IGVsZW1lbnQuX3RleHQgPSBuZXcgSGlnaGxpZ2h0RWxlbWVudCgpO1xuICAgICAgICB0ZXh0LmNsYXNzTGlzdC5hZGQoXCJ0ZXh0LWhpZ2hsaWdodFwiKTtcbiAgICAgICAgZWxlbWVudC5hcHBlbmRDaGlsZCh0ZXh0KTtcbiAgICAgICAgY29uc3QgbG9jYXRpb24gPSBlbGVtZW50Ll9sb2NhdGlvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJwcmVcIik7XG4gICAgICAgIGxvY2F0aW9uLmNsYXNzTGlzdC5hZGQoXCJpbmxpbmUtYmxvY2tcIik7XG4gICAgICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQobG9jYXRpb24pO1xuICAgICAgICBjb25zdCBmaWxlbmFtZSA9IGVsZW1lbnQuX2ZpbGVuYW1lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInByZVwiKTtcbiAgICAgICAgZmlsZW5hbWUuY2xhc3NMaXN0LmFkZChcInRleHQtc3VidGxlXCIsIFwiaW5saW5lLWJsb2NrXCIpO1xuICAgICAgICBlbGVtZW50LmFwcGVuZENoaWxkKGZpbGVuYW1lKTtcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGVsZW1lbnQsIFwia2V5XCIsIGtleVByb3BzKTtcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGVsZW1lbnQsIFwic2VsZWN0ZWRcIiwgc2VsZWN0ZWRQcm9wcyk7XG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShlbGVtZW50LCBcImludmlld1wiLCBpbnZpZXdQcm9wcyk7XG4gICAgICAgIGVsZW1lbnQuc2V0TWVzc2FnZSA9IHNldE1lc3NhZ2U7XG4gICAgICAgIGVsZW1lbnQuYXR0YWNoZWQgPSBhdHRhY2hlZDtcbiAgICAgICAgZWxlbWVudC5kZXRhY2hlZCA9IGRldGFjaGVkO1xuICAgICAgICByZXR1cm4gZWxlbWVudDtcbiAgICB9O1xufSkoKTtcbmV4cG9ydCBjbGFzcyBGaW5kV2luZG93IGV4dGVuZHMgSFRNTERpdkVsZW1lbnQge1xuICAgIGNvbnN0cnVjdG9yKC4uLmFyZ3MpIHtcbiAgICAgICAgc3VwZXIoLi4uYXJncyk7XG4gICAgICAgIHRoaXMuZGlzcGxheU5hbWUgPSBcIkZpbmRQYW5lV2luZG93XCI7XG4gICAgfVxuICAgIGNyZWF0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdGhpcy5jbGFzc0xpc3QuYWRkKFwiZmluZC1vdXRwdXQtcGFuZVwiKTtcbiAgICAgICAgdGhpcy5fbGlzdCA9IG5ldyBPdXRwdXRFbGVtZW50KCk7XG4gICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQodGhpcy5fbGlzdCk7XG4gICAgICAgIHRoaXMuX2xpc3QuZ2V0S2V5ID0gKHVzYWdlKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gYHF1aWNrLWZpeC0ke3VzYWdlLkZpbGVOYW1lfS0oJHt1c2FnZS5MaW5lfS0ke3VzYWdlLkNvbHVtbn0pLSgke3VzYWdlLkVuZExpbmV9LSR7dXNhZ2UuRW5kQ29sdW1ufSktKCR7dXNhZ2UuUHJvamVjdHMuam9pbihcIi1cIil9KWA7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuX2xpc3QuaGFuZGxlQ2xpY2sgPSAoaXRlbSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5nb3RvVXNhZ2UoaXRlbSk7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuX2xpc3QuZXZlbnROYW1lID0gXCJ1c2FnZVwiO1xuICAgICAgICB0aGlzLl9saXN0LmVsZW1lbnRGYWN0b3J5ID0gZ2V0TWVzc2FnZUVsZW1lbnQ7XG4gICAgfVxuICAgIGF0dGFjaGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMuX2xpc3QuYXR0YWNoZWQoKTtcbiAgICB9XG4gICAgZGV0YWNoZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdGhpcy5fbGlzdC5kZXRhY2hlZCgpO1xuICAgIH1cbiAgICB1cGRhdGUob3V0cHV0KSB7XG4gICAgICAgIHRoaXMuX2xpc3QudXBkYXRlT3V0cHV0KG91dHB1dCk7XG4gICAgfVxuICAgIG5leHQoKSB7XG4gICAgICAgIHRoaXMuX2xpc3QubmV4dCgpO1xuICAgIH1cbiAgICBwcmV2KCkge1xuICAgICAgICB0aGlzLl9saXN0LnByZXYoKTtcbiAgICB9XG4gICAgZ2V0IHNlbGVjdGVkSW5kZXgoKSB7IHJldHVybiB0aGlzLl9saXN0LnNlbGVjdGVkSW5kZXg7IH1cbiAgICBzZXQgc2VsZWN0ZWRJbmRleCh2YWx1ZSkgeyB0aGlzLl9saXN0LnNlbGVjdGVkSW5kZXggPSB2YWx1ZTsgfVxuICAgIGdldCBjdXJyZW50KCkgeyByZXR1cm4gdGhpcy5fbGlzdC5jdXJyZW50OyB9XG4gICAgZ290b1VzYWdlKHF1aWNrZml4KSB7XG4gICAgICAgIE9tbmkubmF2aWdhdGVUbyhxdWlja2ZpeCk7XG4gICAgfVxufVxuZXhwb3J0cy5GaW5kV2luZG93ID0gZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50KFwib21uaXNoYXJwLWZpbmQtd2luZG93XCIsIHsgcHJvdG90eXBlOiBGaW5kV2luZG93LnByb3RvdHlwZSB9KTtcbiIsIi8qIHRzbGludDpkaXNhYmxlOm5vLXN0cmluZy1saXRlcmFsICovXHJcbmltcG9ydCB7TW9kZWxzfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xyXG5pbXBvcnQge09tbml9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xyXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gXCJwYXRoXCI7XHJcbmltcG9ydCB7T3V0cHV0RWxlbWVudCwgTWVzc2FnZUVsZW1lbnR9IGZyb20gXCIuL291dHB1dC1jb21wb25lbnRcIjtcclxuaW1wb3J0IHtIaWdobGlnaHRFbGVtZW50fSBmcm9tIFwiLi9oaWdobGlnaHQtZWxlbWVudFwiO1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBGaW5kTWVzc2FnZUVsZW1lbnQgZXh0ZW5kcyBNZXNzYWdlRWxlbWVudDxNb2RlbHMuRGlhZ25vc3RpY0xvY2F0aW9uPiB7IH1cclxuXHJcbmNvbnN0IGdldE1lc3NhZ2VFbGVtZW50ID0gKGZ1bmN0aW9uKCkge1xyXG4gICAgY29uc3Qgc2VsZWN0ZWRQcm9wcyA9IHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uIHNlbGVjdGVkKCkgeyByZXR1cm4gdGhpcy5jbGFzc0xpc3QuY29udGFpbnMoXCJzZWxlY3RlZFwiKTsgfSxcclxuICAgICAgICBzZXQ6IGZ1bmN0aW9uIHNlbGVjdGVkKHZhbHVlOiBib29sZWFuKSB7IGlmICh2YWx1ZSkgdGhpcy5jbGFzc0xpc3QuYWRkKFwic2VsZWN0ZWRcIik7IGVsc2UgdGhpcy5jbGFzc0xpc3QucmVtb3ZlKFwic2VsZWN0ZWRcIik7IH1cclxuICAgIH07XHJcblxyXG4gICAgY29uc3Qga2V5UHJvcHMgPSB7XHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiBrZXkoKSB7IHJldHVybiB0aGlzLl9rZXk7IH1cclxuICAgIH07XHJcblxyXG4gICAgY29uc3QgaW52aWV3UHJvcHMgPSB7XHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiBpbnZpZXcoKSB7IHJldHVybiB0aGlzLl9pbnZpZXc7IH0sXHJcbiAgICAgICAgc2V0OiBmdW5jdGlvbiBpbnZpZXcodmFsdWU6IGJvb2xlYW4pIHtcclxuICAgICAgICAgICAgaWYgKCF0aGlzLl9pbnZpZXcgJiYgdmFsdWUpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX3RleHQuZW5oYW5jZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuX2ludmlldyA9IHZhbHVlO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgZnVuY3Rpb24gc2V0TWVzc2FnZShrZXk6IHN0cmluZywgaXRlbTogTW9kZWxzLkRpYWdub3N0aWNMb2NhdGlvbikge1xyXG4gICAgICAgIHRoaXMuX2tleSA9IGtleTtcclxuICAgICAgICB0aGlzLl9pbnZpZXcgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgdGhpcy5jbGFzc0xpc3QuYWRkKGl0ZW0uTG9nTGV2ZWwpO1xyXG4gICAgICAgIHRoaXMuX3VzYWdlID0gaXRlbTtcclxuICAgICAgICB0aGlzLl90ZXh0LnVzYWdlID0gaXRlbTtcclxuICAgICAgICB0aGlzLl9sb2NhdGlvbi5pbm5lclRleHQgPSBgJHtwYXRoLmJhc2VuYW1lKGl0ZW0uRmlsZU5hbWUpfSgke2l0ZW0uTGluZX0sJHtpdGVtLkNvbHVtbn0pYDtcclxuICAgICAgICB0aGlzLl9maWxlbmFtZS5pbm5lclRleHQgPSBwYXRoLmRpcm5hbWUoaXRlbS5GaWxlTmFtZSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gYXR0YWNoZWQoKSB7XHJcbiAgICAgICAgdGhpcy5fdGV4dC51c2FnZSA9IHRoaXMuX3VzYWdlO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGRldGFjaGVkKCkgeyB0aGlzLl9pbnZpZXcgPSBmYWxzZTsgfVxyXG5cclxuICAgIHJldHVybiBmdW5jdGlvbiBnZXRNZXNzYWdlRWxlbWVudCgpOiBGaW5kTWVzc2FnZUVsZW1lbnQge1xyXG4gICAgICAgIGNvbnN0IGVsZW1lbnQ6IEZpbmRNZXNzYWdlRWxlbWVudCA9IDxhbnk+ZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImxpXCIpO1xyXG4gICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZChcImZpbmQtdXNhZ2VzXCIpO1xyXG5cclxuICAgICAgICBjb25zdCB0ZXh0ID0gKGVsZW1lbnQgYXMgYW55KS5fdGV4dCA9IG5ldyBIaWdobGlnaHRFbGVtZW50KCk7XHJcbiAgICAgICAgdGV4dC5jbGFzc0xpc3QuYWRkKFwidGV4dC1oaWdobGlnaHRcIik7XHJcbiAgICAgICAgZWxlbWVudC5hcHBlbmRDaGlsZCh0ZXh0KTtcclxuXHJcbiAgICAgICAgY29uc3QgbG9jYXRpb24gPSAoZWxlbWVudCBhcyBhbnkpLl9sb2NhdGlvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJwcmVcIik7XHJcbiAgICAgICAgbG9jYXRpb24uY2xhc3NMaXN0LmFkZChcImlubGluZS1ibG9ja1wiKTtcclxuICAgICAgICBlbGVtZW50LmFwcGVuZENoaWxkKGxvY2F0aW9uKTtcclxuXHJcbiAgICAgICAgY29uc3QgZmlsZW5hbWUgPSAoZWxlbWVudCBhcyBhbnkpLl9maWxlbmFtZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJwcmVcIik7XHJcbiAgICAgICAgZmlsZW5hbWUuY2xhc3NMaXN0LmFkZChcInRleHQtc3VidGxlXCIsIFwiaW5saW5lLWJsb2NrXCIpO1xyXG4gICAgICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQoZmlsZW5hbWUpO1xyXG5cclxuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZWxlbWVudCwgXCJrZXlcIiwga2V5UHJvcHMpO1xyXG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShlbGVtZW50LCBcInNlbGVjdGVkXCIsIHNlbGVjdGVkUHJvcHMpO1xyXG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShlbGVtZW50LCBcImludmlld1wiLCBpbnZpZXdQcm9wcyk7XHJcbiAgICAgICAgZWxlbWVudC5zZXRNZXNzYWdlID0gc2V0TWVzc2FnZTtcclxuICAgICAgICBlbGVtZW50LmF0dGFjaGVkID0gYXR0YWNoZWQ7XHJcbiAgICAgICAgZWxlbWVudC5kZXRhY2hlZCA9IGRldGFjaGVkO1xyXG5cclxuICAgICAgICByZXR1cm4gZWxlbWVudDtcclxuICAgIH07XHJcbn0pKCk7XHJcblxyXG5leHBvcnQgY2xhc3MgRmluZFdpbmRvdyBleHRlbmRzIEhUTUxEaXZFbGVtZW50IGltcGxlbWVudHMgV2ViQ29tcG9uZW50IHtcclxuICAgIHB1YmxpYyBkaXNwbGF5TmFtZSA9IFwiRmluZFBhbmVXaW5kb3dcIjtcclxuICAgIHByaXZhdGUgX2xpc3Q6IE91dHB1dEVsZW1lbnQ8TW9kZWxzLlF1aWNrRml4LCBGaW5kTWVzc2FnZUVsZW1lbnQ+O1xyXG5cclxuICAgIHB1YmxpYyBjcmVhdGVkQ2FsbGJhY2soKSB7XHJcbiAgICAgICAgdGhpcy5jbGFzc0xpc3QuYWRkKFwiZmluZC1vdXRwdXQtcGFuZVwiKTtcclxuICAgICAgICB0aGlzLl9saXN0ID0gbmV3IE91dHB1dEVsZW1lbnQ8TW9kZWxzLlF1aWNrRml4LCBGaW5kTWVzc2FnZUVsZW1lbnQ+KCk7XHJcbiAgICAgICAgdGhpcy5hcHBlbmRDaGlsZCh0aGlzLl9saXN0KTtcclxuICAgICAgICB0aGlzLl9saXN0LmdldEtleSA9ICh1c2FnZTogTW9kZWxzLlF1aWNrRml4KSA9PiB7XHJcbiAgICAgICAgICAgIHJldHVybiBgcXVpY2stZml4LSR7dXNhZ2UuRmlsZU5hbWV9LSgke3VzYWdlLkxpbmV9LSR7dXNhZ2UuQ29sdW1ufSktKCR7dXNhZ2UuRW5kTGluZX0tJHt1c2FnZS5FbmRDb2x1bW59KS0oJHt1c2FnZS5Qcm9qZWN0cy5qb2luKFwiLVwiKX0pYDtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHRoaXMuX2xpc3QuaGFuZGxlQ2xpY2sgPSAoaXRlbTogTW9kZWxzLlF1aWNrRml4KSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuZ290b1VzYWdlKGl0ZW0pO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgdGhpcy5fbGlzdC5ldmVudE5hbWUgPSBcInVzYWdlXCI7XHJcbiAgICAgICAgdGhpcy5fbGlzdC5lbGVtZW50RmFjdG9yeSA9IGdldE1lc3NhZ2VFbGVtZW50O1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBhdHRhY2hlZENhbGxiYWNrKCkge1xyXG4gICAgICAgIHRoaXMuX2xpc3QuYXR0YWNoZWQoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGV0YWNoZWRDYWxsYmFjaygpIHtcclxuICAgICAgICB0aGlzLl9saXN0LmRldGFjaGVkKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHVwZGF0ZShvdXRwdXQ6IE1vZGVscy5RdWlja0ZpeFtdKSB7XHJcbiAgICAgICAgdGhpcy5fbGlzdC51cGRhdGVPdXRwdXQob3V0cHV0KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgbmV4dCgpIHtcclxuICAgICAgICB0aGlzLl9saXN0Lm5leHQoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcHJldigpIHtcclxuICAgICAgICB0aGlzLl9saXN0LnByZXYoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0IHNlbGVjdGVkSW5kZXgoKSB7IHJldHVybiB0aGlzLl9saXN0LnNlbGVjdGVkSW5kZXg7IH1cclxuICAgIHB1YmxpYyBzZXQgc2VsZWN0ZWRJbmRleCh2YWx1ZSkgeyB0aGlzLl9saXN0LnNlbGVjdGVkSW5kZXggPSB2YWx1ZTsgfVxyXG4gICAgcHVibGljIGdldCBjdXJyZW50KCkgeyByZXR1cm4gdGhpcy5fbGlzdC5jdXJyZW50OyB9XHJcblxyXG4gICAgcHJpdmF0ZSBnb3RvVXNhZ2UocXVpY2tmaXg6IE1vZGVscy5RdWlja0ZpeCkge1xyXG4gICAgICAgIE9tbmkubmF2aWdhdGVUbyhxdWlja2ZpeCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbig8YW55PmV4cG9ydHMpLkZpbmRXaW5kb3cgPSAoPGFueT5kb2N1bWVudCkucmVnaXN0ZXJFbGVtZW50KFwib21uaXNoYXJwLWZpbmQtd2luZG93XCIsIHsgcHJvdG90eXBlOiBGaW5kV2luZG93LnByb3RvdHlwZSB9KTtcclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
