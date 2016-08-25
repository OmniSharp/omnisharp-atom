"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.CodeCheckOutputElement = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _path = require("path");

var path = _interopRequireWildcard(_path);

var _omni = require("../server/omni");

var _outputComponent = require("./output-component");

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
            this._inview = value;
        }
    };
    function setMessage(key, item) {
        this._key = key;
        this.classList.add("" + item.LogLevel);
        if (item.LogLevel === "Error") {
            this._icon.classList.add("fa-times-circle");
            this._icon.classList.remove("fa-exclamation-triangle");
            this._icon.classList.remove("fa-info");
        } else if (item.LogLevel === "Warning") {
            this._icon.classList.add("fa-exclamation-triangle");
            this._icon.classList.remove("fa-times-circle");
            this._icon.classList.remove("fa-info");
        } else {
            this._icon.classList.add("fa-info");
            this._icon.classList.remove("fa-exclamation-triangle");
            this._icon.classList.remove("fa-times-circle");
        }
        this._text.innerText = item.Text;
        this._location.innerText = path.basename(item.FileName) + "(" + item.Line + "," + item.Column + ")";
        this._filename.innerText = path.dirname(item.FileName);
    }
    function attached() {}
    function detached() {}
    return function getMessageElement() {
        var element = document.createElement("li");
        element.classList.add("codecheck");
        var icon = element._icon = document.createElement("span");
        icon.classList.add("fa");
        element.appendChild(icon);
        var text = element._text = document.createElement("pre");
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

var CodeCheckOutputElement = exports.CodeCheckOutputElement = function (_HTMLDivElement) {
    _inherits(CodeCheckOutputElement, _HTMLDivElement);

    function CodeCheckOutputElement() {
        var _ref;

        _classCallCheck(this, CodeCheckOutputElement);

        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
        }

        var _this = _possibleConstructorReturn(this, (_ref = CodeCheckOutputElement.__proto__ || Object.getPrototypeOf(CodeCheckOutputElement)).call.apply(_ref, [this].concat(args)));

        _this.displayName = "FindPaneWindow";
        return _this;
    }

    _createClass(CodeCheckOutputElement, [{
        key: "createdCallback",
        value: function createdCallback() {
            var _this2 = this;

            this.classList.add("codecheck-output-pane");
            this._list = new _outputComponent.OutputElement();
            this.appendChild(this._list);
            this._list.getKey = function (error) {
                return "code-check-" + error.LogLevel + "-" + error.FileName + "-(" + error.Line + "-" + error.Column + ")-(" + error.EndLine + "-" + error.EndColumn + ")-(" + (error.Projects || []).join("-") + ")";
            };
            this._list.handleClick = function (item) {
                _this2.goToLine(item);
            };
            this._list.eventName = "diagnostic";
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
        key: "goToLine",
        value: function goToLine(location) {
            _omni.Omni.navigateTo(location);
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

    return CodeCheckOutputElement;
}(HTMLDivElement);

exports.CodeCheckOutputElement = document.registerElement("omnisharp-codecheck-output", { prototype: CodeCheckOutputElement.prototype });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy9jb2RlY2hlY2stb3V0cHV0LXBhbmUtdmlldy5qcyIsImxpYi92aWV3cy9jb2RlY2hlY2stb3V0cHV0LXBhbmUtdmlldy50cyJdLCJuYW1lcyI6WyJwYXRoIiwiZ2V0TWVzc2FnZUVsZW1lbnQiLCJzZWxlY3RlZFByb3BzIiwiZ2V0Iiwic2VsZWN0ZWQiLCJjbGFzc0xpc3QiLCJjb250YWlucyIsInNldCIsInZhbHVlIiwiYWRkIiwicmVtb3ZlIiwia2V5UHJvcHMiLCJrZXkiLCJfa2V5IiwiaW52aWV3UHJvcHMiLCJpbnZpZXciLCJfaW52aWV3Iiwic2V0TWVzc2FnZSIsIml0ZW0iLCJMb2dMZXZlbCIsIl9pY29uIiwiX3RleHQiLCJpbm5lclRleHQiLCJUZXh0IiwiX2xvY2F0aW9uIiwiYmFzZW5hbWUiLCJGaWxlTmFtZSIsIkxpbmUiLCJDb2x1bW4iLCJfZmlsZW5hbWUiLCJkaXJuYW1lIiwiYXR0YWNoZWQiLCJkZXRhY2hlZCIsImVsZW1lbnQiLCJkb2N1bWVudCIsImNyZWF0ZUVsZW1lbnQiLCJpY29uIiwiYXBwZW5kQ2hpbGQiLCJ0ZXh0IiwibG9jYXRpb24iLCJmaWxlbmFtZSIsIk9iamVjdCIsImRlZmluZVByb3BlcnR5IiwiQ29kZUNoZWNrT3V0cHV0RWxlbWVudCIsImFyZ3MiLCJkaXNwbGF5TmFtZSIsIl9saXN0IiwiZ2V0S2V5IiwiZXJyb3IiLCJFbmRMaW5lIiwiRW5kQ29sdW1uIiwiUHJvamVjdHMiLCJqb2luIiwiaGFuZGxlQ2xpY2siLCJnb1RvTGluZSIsImV2ZW50TmFtZSIsImVsZW1lbnRGYWN0b3J5Iiwib3V0cHV0IiwidXBkYXRlT3V0cHV0IiwibmV4dCIsInByZXYiLCJuYXZpZ2F0ZVRvIiwic2VsZWN0ZWRJbmRleCIsImN1cnJlbnQiLCJIVE1MRGl2RWxlbWVudCIsImV4cG9ydHMiLCJyZWdpc3RlckVsZW1lbnQiLCJwcm90b3R5cGUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztJQ0NZQSxJOztBREFa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QixhQUFsQjtBQUFrQyxTOzBCQUN0Q3RELEssRUFBSztBQUFJLGlCQUFLc0MsS0FBTCxDQUFXZ0IsYUFBWCxHQUEyQnRELEtBQTNCO0FBQW1DOzs7NEJBQ25EO0FBQUssbUJBQU8sS0FBS3NDLEtBQUwsQ0FBV2lCLE9BQWxCO0FBQTRCOzs7O0VBeENYQyxjOztBQStDdENDLFFBQVN0QixzQkFBVCxHQUF3Q1QsU0FBVWdDLGVBQVYsQ0FBMEIsNEJBQTFCLEVBQXdELEVBQUVDLFdBQVd4Qix1QkFBdUJ3QixTQUFwQyxFQUF4RCxDQUF4QyIsImZpbGUiOiJsaWIvdmlld3MvY29kZWNoZWNrLW91dHB1dC1wYW5lLXZpZXcuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgeyBPbW5pIH0gZnJvbSBcIi4uL3NlcnZlci9vbW5pXCI7XG5pbXBvcnQgeyBPdXRwdXRFbGVtZW50IH0gZnJvbSBcIi4vb3V0cHV0LWNvbXBvbmVudFwiO1xuY29uc3QgZ2V0TWVzc2FnZUVsZW1lbnQgPSAoZnVuY3Rpb24gKCkge1xuICAgIGNvbnN0IHNlbGVjdGVkUHJvcHMgPSB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gc2VsZWN0ZWQoKSB7IHJldHVybiB0aGlzLmNsYXNzTGlzdC5jb250YWlucyhcInNlbGVjdGVkXCIpOyB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uIHNlbGVjdGVkKHZhbHVlKSB7IGlmICh2YWx1ZSlcbiAgICAgICAgICAgIHRoaXMuY2xhc3NMaXN0LmFkZChcInNlbGVjdGVkXCIpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICB0aGlzLmNsYXNzTGlzdC5yZW1vdmUoXCJzZWxlY3RlZFwiKTsgfVxuICAgIH07XG4gICAgY29uc3Qga2V5UHJvcHMgPSB7XG4gICAgICAgIGdldDogZnVuY3Rpb24ga2V5KCkgeyByZXR1cm4gdGhpcy5fa2V5OyB9XG4gICAgfTtcbiAgICBjb25zdCBpbnZpZXdQcm9wcyA9IHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiBpbnZpZXcoKSB7IHJldHVybiB0aGlzLl9pbnZpZXc7IH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gaW52aWV3KHZhbHVlKSB7IHRoaXMuX2ludmlldyA9IHZhbHVlOyB9XG4gICAgfTtcbiAgICBmdW5jdGlvbiBzZXRNZXNzYWdlKGtleSwgaXRlbSkge1xuICAgICAgICB0aGlzLl9rZXkgPSBrZXk7XG4gICAgICAgIHRoaXMuY2xhc3NMaXN0LmFkZChgJHtpdGVtLkxvZ0xldmVsfWApO1xuICAgICAgICBpZiAoaXRlbS5Mb2dMZXZlbCA9PT0gXCJFcnJvclwiKSB7XG4gICAgICAgICAgICB0aGlzLl9pY29uLmNsYXNzTGlzdC5hZGQoXCJmYS10aW1lcy1jaXJjbGVcIik7XG4gICAgICAgICAgICB0aGlzLl9pY29uLmNsYXNzTGlzdC5yZW1vdmUoXCJmYS1leGNsYW1hdGlvbi10cmlhbmdsZVwiKTtcbiAgICAgICAgICAgIHRoaXMuX2ljb24uY2xhc3NMaXN0LnJlbW92ZShcImZhLWluZm9cIik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoaXRlbS5Mb2dMZXZlbCA9PT0gXCJXYXJuaW5nXCIpIHtcbiAgICAgICAgICAgIHRoaXMuX2ljb24uY2xhc3NMaXN0LmFkZChcImZhLWV4Y2xhbWF0aW9uLXRyaWFuZ2xlXCIpO1xuICAgICAgICAgICAgdGhpcy5faWNvbi5jbGFzc0xpc3QucmVtb3ZlKFwiZmEtdGltZXMtY2lyY2xlXCIpO1xuICAgICAgICAgICAgdGhpcy5faWNvbi5jbGFzc0xpc3QucmVtb3ZlKFwiZmEtaW5mb1wiKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX2ljb24uY2xhc3NMaXN0LmFkZChcImZhLWluZm9cIik7XG4gICAgICAgICAgICB0aGlzLl9pY29uLmNsYXNzTGlzdC5yZW1vdmUoXCJmYS1leGNsYW1hdGlvbi10cmlhbmdsZVwiKTtcbiAgICAgICAgICAgIHRoaXMuX2ljb24uY2xhc3NMaXN0LnJlbW92ZShcImZhLXRpbWVzLWNpcmNsZVwiKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl90ZXh0LmlubmVyVGV4dCA9IGl0ZW0uVGV4dDtcbiAgICAgICAgdGhpcy5fbG9jYXRpb24uaW5uZXJUZXh0ID0gYCR7cGF0aC5iYXNlbmFtZShpdGVtLkZpbGVOYW1lKX0oJHtpdGVtLkxpbmV9LCR7aXRlbS5Db2x1bW59KWA7XG4gICAgICAgIHRoaXMuX2ZpbGVuYW1lLmlubmVyVGV4dCA9IHBhdGguZGlybmFtZShpdGVtLkZpbGVOYW1lKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gYXR0YWNoZWQoKSB7IH1cbiAgICBmdW5jdGlvbiBkZXRhY2hlZCgpIHsgfVxuICAgIHJldHVybiBmdW5jdGlvbiBnZXRNZXNzYWdlRWxlbWVudCgpIHtcbiAgICAgICAgY29uc3QgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJsaVwiKTtcbiAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkKFwiY29kZWNoZWNrXCIpO1xuICAgICAgICBjb25zdCBpY29uID0gZWxlbWVudC5faWNvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICBpY29uLmNsYXNzTGlzdC5hZGQoXCJmYVwiKTtcbiAgICAgICAgZWxlbWVudC5hcHBlbmRDaGlsZChpY29uKTtcbiAgICAgICAgY29uc3QgdGV4dCA9IGVsZW1lbnQuX3RleHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwicHJlXCIpO1xuICAgICAgICB0ZXh0LmNsYXNzTGlzdC5hZGQoXCJ0ZXh0LWhpZ2hsaWdodFwiKTtcbiAgICAgICAgZWxlbWVudC5hcHBlbmRDaGlsZCh0ZXh0KTtcbiAgICAgICAgY29uc3QgbG9jYXRpb24gPSBlbGVtZW50Ll9sb2NhdGlvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJwcmVcIik7XG4gICAgICAgIGxvY2F0aW9uLmNsYXNzTGlzdC5hZGQoXCJpbmxpbmUtYmxvY2tcIik7XG4gICAgICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQobG9jYXRpb24pO1xuICAgICAgICBjb25zdCBmaWxlbmFtZSA9IGVsZW1lbnQuX2ZpbGVuYW1lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInByZVwiKTtcbiAgICAgICAgZmlsZW5hbWUuY2xhc3NMaXN0LmFkZChcInRleHQtc3VidGxlXCIsIFwiaW5saW5lLWJsb2NrXCIpO1xuICAgICAgICBlbGVtZW50LmFwcGVuZENoaWxkKGZpbGVuYW1lKTtcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGVsZW1lbnQsIFwia2V5XCIsIGtleVByb3BzKTtcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGVsZW1lbnQsIFwic2VsZWN0ZWRcIiwgc2VsZWN0ZWRQcm9wcyk7XG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShlbGVtZW50LCBcImludmlld1wiLCBpbnZpZXdQcm9wcyk7XG4gICAgICAgIGVsZW1lbnQuc2V0TWVzc2FnZSA9IHNldE1lc3NhZ2U7XG4gICAgICAgIGVsZW1lbnQuYXR0YWNoZWQgPSBhdHRhY2hlZDtcbiAgICAgICAgZWxlbWVudC5kZXRhY2hlZCA9IGRldGFjaGVkO1xuICAgICAgICByZXR1cm4gZWxlbWVudDtcbiAgICB9O1xufSkoKTtcbmV4cG9ydCBjbGFzcyBDb2RlQ2hlY2tPdXRwdXRFbGVtZW50IGV4dGVuZHMgSFRNTERpdkVsZW1lbnQge1xuICAgIGNvbnN0cnVjdG9yKC4uLmFyZ3MpIHtcbiAgICAgICAgc3VwZXIoLi4uYXJncyk7XG4gICAgICAgIHRoaXMuZGlzcGxheU5hbWUgPSBcIkZpbmRQYW5lV2luZG93XCI7XG4gICAgfVxuICAgIGNyZWF0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdGhpcy5jbGFzc0xpc3QuYWRkKFwiY29kZWNoZWNrLW91dHB1dC1wYW5lXCIpO1xuICAgICAgICB0aGlzLl9saXN0ID0gbmV3IE91dHB1dEVsZW1lbnQoKTtcbiAgICAgICAgdGhpcy5hcHBlbmRDaGlsZCh0aGlzLl9saXN0KTtcbiAgICAgICAgdGhpcy5fbGlzdC5nZXRLZXkgPSAoZXJyb3IpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBgY29kZS1jaGVjay0ke2Vycm9yLkxvZ0xldmVsfS0ke2Vycm9yLkZpbGVOYW1lfS0oJHtlcnJvci5MaW5lfS0ke2Vycm9yLkNvbHVtbn0pLSgke2Vycm9yLkVuZExpbmV9LSR7ZXJyb3IuRW5kQ29sdW1ufSktKCR7KGVycm9yLlByb2plY3RzIHx8IFtdKS5qb2luKFwiLVwiKX0pYDtcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5fbGlzdC5oYW5kbGVDbGljayA9IChpdGVtKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmdvVG9MaW5lKGl0ZW0pO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLl9saXN0LmV2ZW50TmFtZSA9IFwiZGlhZ25vc3RpY1wiO1xuICAgICAgICB0aGlzLl9saXN0LmVsZW1lbnRGYWN0b3J5ID0gZ2V0TWVzc2FnZUVsZW1lbnQ7XG4gICAgfVxuICAgIGF0dGFjaGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMuX2xpc3QuYXR0YWNoZWQoKTtcbiAgICB9XG4gICAgZGV0YWNoZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdGhpcy5fbGlzdC5kZXRhY2hlZCgpO1xuICAgIH1cbiAgICB1cGRhdGUob3V0cHV0KSB7XG4gICAgICAgIHRoaXMuX2xpc3QudXBkYXRlT3V0cHV0KG91dHB1dCk7XG4gICAgfVxuICAgIG5leHQoKSB7XG4gICAgICAgIHRoaXMuX2xpc3QubmV4dCgpO1xuICAgIH1cbiAgICBwcmV2KCkge1xuICAgICAgICB0aGlzLl9saXN0LnByZXYoKTtcbiAgICB9XG4gICAgZ2V0IHNlbGVjdGVkSW5kZXgoKSB7IHJldHVybiB0aGlzLl9saXN0LnNlbGVjdGVkSW5kZXg7IH1cbiAgICBzZXQgc2VsZWN0ZWRJbmRleCh2YWx1ZSkgeyB0aGlzLl9saXN0LnNlbGVjdGVkSW5kZXggPSB2YWx1ZTsgfVxuICAgIGdldCBjdXJyZW50KCkgeyByZXR1cm4gdGhpcy5fbGlzdC5jdXJyZW50OyB9XG4gICAgZ29Ub0xpbmUobG9jYXRpb24pIHtcbiAgICAgICAgT21uaS5uYXZpZ2F0ZVRvKGxvY2F0aW9uKTtcbiAgICB9XG59XG5leHBvcnRzLkNvZGVDaGVja091dHB1dEVsZW1lbnQgPSBkb2N1bWVudC5yZWdpc3RlckVsZW1lbnQoXCJvbW5pc2hhcnAtY29kZWNoZWNrLW91dHB1dFwiLCB7IHByb3RvdHlwZTogQ29kZUNoZWNrT3V0cHV0RWxlbWVudC5wcm90b3R5cGUgfSk7XG4iLCJpbXBvcnQge01vZGVsc30gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcclxuaW1wb3J0ICogYXMgcGF0aCBmcm9tIFwicGF0aFwiO1xyXG5pbXBvcnQge09tbml9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xyXG5pbXBvcnQge091dHB1dEVsZW1lbnQsIE1lc3NhZ2VFbGVtZW50fSBmcm9tIFwiLi9vdXRwdXQtY29tcG9uZW50XCI7XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIENvZGVDaGVja01lc3NhZ2VFbGVtZW50IGV4dGVuZHMgTWVzc2FnZUVsZW1lbnQ8TW9kZWxzLkRpYWdub3N0aWNMb2NhdGlvbj4geyB9XHJcblxyXG5jb25zdCBnZXRNZXNzYWdlRWxlbWVudCA9IChmdW5jdGlvbigpIHtcclxuICAgIGNvbnN0IHNlbGVjdGVkUHJvcHMgPSB7XHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiBzZWxlY3RlZCgpIHsgcmV0dXJuIHRoaXMuY2xhc3NMaXN0LmNvbnRhaW5zKFwic2VsZWN0ZWRcIik7IH0sXHJcbiAgICAgICAgc2V0OiBmdW5jdGlvbiBzZWxlY3RlZCh2YWx1ZTogYm9vbGVhbikgeyBpZiAodmFsdWUpIHRoaXMuY2xhc3NMaXN0LmFkZChcInNlbGVjdGVkXCIpOyBlbHNlIHRoaXMuY2xhc3NMaXN0LnJlbW92ZShcInNlbGVjdGVkXCIpOyB9XHJcbiAgICB9O1xyXG5cclxuICAgIGNvbnN0IGtleVByb3BzID0ge1xyXG4gICAgICAgIGdldDogZnVuY3Rpb24ga2V5KCkgeyByZXR1cm4gdGhpcy5fa2V5OyB9XHJcbiAgICB9O1xyXG5cclxuICAgIGNvbnN0IGludmlld1Byb3BzID0ge1xyXG4gICAgICAgIGdldDogZnVuY3Rpb24gaW52aWV3KCkgeyByZXR1cm4gdGhpcy5faW52aWV3OyB9LFxyXG4gICAgICAgIHNldDogZnVuY3Rpb24gaW52aWV3KHZhbHVlOiBib29sZWFuKSB7IHRoaXMuX2ludmlldyA9IHZhbHVlOyB9XHJcbiAgICB9O1xyXG5cclxuICAgIGZ1bmN0aW9uIHNldE1lc3NhZ2Uoa2V5OiBzdHJpbmcsIGl0ZW06IE1vZGVscy5EaWFnbm9zdGljTG9jYXRpb24pIHtcclxuICAgICAgICB0aGlzLl9rZXkgPSBrZXk7XHJcblxyXG4gICAgICAgIHRoaXMuY2xhc3NMaXN0LmFkZChgJHtpdGVtLkxvZ0xldmVsfWApO1xyXG5cclxuICAgICAgICBpZiAoaXRlbS5Mb2dMZXZlbCA9PT0gXCJFcnJvclwiKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2ljb24uY2xhc3NMaXN0LmFkZChcImZhLXRpbWVzLWNpcmNsZVwiKTtcclxuICAgICAgICAgICAgdGhpcy5faWNvbi5jbGFzc0xpc3QucmVtb3ZlKFwiZmEtZXhjbGFtYXRpb24tdHJpYW5nbGVcIik7XHJcbiAgICAgICAgICAgIHRoaXMuX2ljb24uY2xhc3NMaXN0LnJlbW92ZShcImZhLWluZm9cIik7XHJcbiAgICAgICAgfSBlbHNlIGlmIChpdGVtLkxvZ0xldmVsID09PSBcIldhcm5pbmdcIikge1xyXG4gICAgICAgICAgICB0aGlzLl9pY29uLmNsYXNzTGlzdC5hZGQoXCJmYS1leGNsYW1hdGlvbi10cmlhbmdsZVwiKTtcclxuICAgICAgICAgICAgdGhpcy5faWNvbi5jbGFzc0xpc3QucmVtb3ZlKFwiZmEtdGltZXMtY2lyY2xlXCIpO1xyXG4gICAgICAgICAgICB0aGlzLl9pY29uLmNsYXNzTGlzdC5yZW1vdmUoXCJmYS1pbmZvXCIpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2ljb24uY2xhc3NMaXN0LmFkZChcImZhLWluZm9cIik7XHJcbiAgICAgICAgICAgIHRoaXMuX2ljb24uY2xhc3NMaXN0LnJlbW92ZShcImZhLWV4Y2xhbWF0aW9uLXRyaWFuZ2xlXCIpO1xyXG4gICAgICAgICAgICB0aGlzLl9pY29uLmNsYXNzTGlzdC5yZW1vdmUoXCJmYS10aW1lcy1jaXJjbGVcIik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLl90ZXh0LmlubmVyVGV4dCA9IGl0ZW0uVGV4dDtcclxuICAgICAgICB0aGlzLl9sb2NhdGlvbi5pbm5lclRleHQgPSBgJHtwYXRoLmJhc2VuYW1lKGl0ZW0uRmlsZU5hbWUpfSgke2l0ZW0uTGluZX0sJHtpdGVtLkNvbHVtbn0pYDtcclxuICAgICAgICB0aGlzLl9maWxlbmFtZS5pbm5lclRleHQgPSBwYXRoLmRpcm5hbWUoaXRlbS5GaWxlTmFtZSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gYXR0YWNoZWQoKSB7IC8qICovIH1cclxuXHJcbiAgICBmdW5jdGlvbiBkZXRhY2hlZCgpIHsgLyogKi8gfVxyXG5cclxuICAgIHJldHVybiBmdW5jdGlvbiBnZXRNZXNzYWdlRWxlbWVudCgpOiBDb2RlQ2hlY2tNZXNzYWdlRWxlbWVudCB7XHJcbiAgICAgICAgY29uc3QgZWxlbWVudDogQ29kZUNoZWNrTWVzc2FnZUVsZW1lbnQgPSA8YW55PmRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJsaVwiKTtcclxuICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5hZGQoXCJjb2RlY2hlY2tcIik7XHJcblxyXG4gICAgICAgIGNvbnN0IGljb24gPSAoZWxlbWVudCBhcyBhbnkpLl9pY29uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XHJcbiAgICAgICAgaWNvbi5jbGFzc0xpc3QuYWRkKFwiZmFcIik7XHJcbiAgICAgICAgZWxlbWVudC5hcHBlbmRDaGlsZChpY29uKTtcclxuXHJcbiAgICAgICAgY29uc3QgdGV4dCA9IChlbGVtZW50IGFzIGFueSkuX3RleHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwicHJlXCIpO1xyXG4gICAgICAgIHRleHQuY2xhc3NMaXN0LmFkZChcInRleHQtaGlnaGxpZ2h0XCIpO1xyXG4gICAgICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQodGV4dCk7XHJcblxyXG4gICAgICAgIGNvbnN0IGxvY2F0aW9uID0gKGVsZW1lbnQgYXMgYW55KS5fbG9jYXRpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwicHJlXCIpO1xyXG4gICAgICAgIGxvY2F0aW9uLmNsYXNzTGlzdC5hZGQoXCJpbmxpbmUtYmxvY2tcIik7XHJcbiAgICAgICAgZWxlbWVudC5hcHBlbmRDaGlsZChsb2NhdGlvbik7XHJcblxyXG4gICAgICAgIGNvbnN0IGZpbGVuYW1lID0gKGVsZW1lbnQgYXMgYW55KS5fZmlsZW5hbWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwicHJlXCIpO1xyXG4gICAgICAgIGZpbGVuYW1lLmNsYXNzTGlzdC5hZGQoXCJ0ZXh0LXN1YnRsZVwiLCBcImlubGluZS1ibG9ja1wiKTtcclxuICAgICAgICBlbGVtZW50LmFwcGVuZENoaWxkKGZpbGVuYW1lKTtcclxuXHJcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGVsZW1lbnQsIFwia2V5XCIsIGtleVByb3BzKTtcclxuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZWxlbWVudCwgXCJzZWxlY3RlZFwiLCBzZWxlY3RlZFByb3BzKTtcclxuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZWxlbWVudCwgXCJpbnZpZXdcIiwgaW52aWV3UHJvcHMpO1xyXG4gICAgICAgIGVsZW1lbnQuc2V0TWVzc2FnZSA9IHNldE1lc3NhZ2U7XHJcbiAgICAgICAgZWxlbWVudC5hdHRhY2hlZCA9IGF0dGFjaGVkO1xyXG4gICAgICAgIGVsZW1lbnQuZGV0YWNoZWQgPSBkZXRhY2hlZDtcclxuXHJcbiAgICAgICAgcmV0dXJuIGVsZW1lbnQ7XHJcbiAgICB9O1xyXG59KSgpO1xyXG5cclxuZXhwb3J0IGNsYXNzIENvZGVDaGVja091dHB1dEVsZW1lbnQgZXh0ZW5kcyBIVE1MRGl2RWxlbWVudCBpbXBsZW1lbnRzIFdlYkNvbXBvbmVudCB7XHJcbiAgICBwdWJsaWMgZGlzcGxheU5hbWUgPSBcIkZpbmRQYW5lV2luZG93XCI7XHJcbiAgICBwcml2YXRlIF9saXN0OiBPdXRwdXRFbGVtZW50PE1vZGVscy5EaWFnbm9zdGljTG9jYXRpb24sIENvZGVDaGVja01lc3NhZ2VFbGVtZW50PjtcclxuXHJcbiAgICBwdWJsaWMgY3JlYXRlZENhbGxiYWNrKCkge1xyXG4gICAgICAgIHRoaXMuY2xhc3NMaXN0LmFkZChcImNvZGVjaGVjay1vdXRwdXQtcGFuZVwiKTtcclxuICAgICAgICB0aGlzLl9saXN0ID0gbmV3IE91dHB1dEVsZW1lbnQ8TW9kZWxzLkRpYWdub3N0aWNMb2NhdGlvbiwgQ29kZUNoZWNrTWVzc2FnZUVsZW1lbnQ+KCk7XHJcbiAgICAgICAgdGhpcy5hcHBlbmRDaGlsZCh0aGlzLl9saXN0KTtcclxuICAgICAgICB0aGlzLl9saXN0LmdldEtleSA9IChlcnJvcjogTW9kZWxzLkRpYWdub3N0aWNMb2NhdGlvbikgPT4ge1xyXG4gICAgICAgICAgICByZXR1cm4gYGNvZGUtY2hlY2stJHtlcnJvci5Mb2dMZXZlbH0tJHtlcnJvci5GaWxlTmFtZX0tKCR7ZXJyb3IuTGluZX0tJHtlcnJvci5Db2x1bW59KS0oJHtlcnJvci5FbmRMaW5lfS0ke2Vycm9yLkVuZENvbHVtbn0pLSgkeyhlcnJvci5Qcm9qZWN0cyB8fCBbXSkuam9pbihcIi1cIil9KWA7XHJcbiAgICAgICAgfTtcclxuICAgICAgICB0aGlzLl9saXN0LmhhbmRsZUNsaWNrID0gKGl0ZW06IE1vZGVscy5EaWFnbm9zdGljTG9jYXRpb24pID0+IHtcclxuICAgICAgICAgICAgdGhpcy5nb1RvTGluZShpdGVtKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHRoaXMuX2xpc3QuZXZlbnROYW1lID0gXCJkaWFnbm9zdGljXCI7XHJcbiAgICAgICAgdGhpcy5fbGlzdC5lbGVtZW50RmFjdG9yeSA9IGdldE1lc3NhZ2VFbGVtZW50O1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBhdHRhY2hlZENhbGxiYWNrKCkge1xyXG4gICAgICAgIHRoaXMuX2xpc3QuYXR0YWNoZWQoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGV0YWNoZWRDYWxsYmFjaygpIHtcclxuICAgICAgICB0aGlzLl9saXN0LmRldGFjaGVkKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHVwZGF0ZShvdXRwdXQ6IE1vZGVscy5EaWFnbm9zdGljTG9jYXRpb25bXSkge1xyXG4gICAgICAgIHRoaXMuX2xpc3QudXBkYXRlT3V0cHV0KG91dHB1dCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIG5leHQoKSB7XHJcbiAgICAgICAgdGhpcy5fbGlzdC5uZXh0KCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHByZXYoKSB7XHJcbiAgICAgICAgdGhpcy5fbGlzdC5wcmV2KCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldCBzZWxlY3RlZEluZGV4KCkgeyByZXR1cm4gdGhpcy5fbGlzdC5zZWxlY3RlZEluZGV4OyB9XHJcbiAgICBwdWJsaWMgc2V0IHNlbGVjdGVkSW5kZXgodmFsdWUpIHsgdGhpcy5fbGlzdC5zZWxlY3RlZEluZGV4ID0gdmFsdWU7IH1cclxuICAgIHB1YmxpYyBnZXQgY3VycmVudCgpIHsgcmV0dXJuIHRoaXMuX2xpc3QuY3VycmVudDsgfVxyXG5cclxuICAgIHByaXZhdGUgZ29Ub0xpbmUobG9jYXRpb246IE1vZGVscy5EaWFnbm9zdGljTG9jYXRpb24pIHtcclxuICAgICAgICBPbW5pLm5hdmlnYXRlVG8obG9jYXRpb24pO1xyXG4gICAgfVxyXG59XHJcblxyXG4oPGFueT5leHBvcnRzKS5Db2RlQ2hlY2tPdXRwdXRFbGVtZW50ID0gKDxhbnk+ZG9jdW1lbnQpLnJlZ2lzdGVyRWxlbWVudChcIm9tbmlzaGFycC1jb2RlY2hlY2stb3V0cHV0XCIsIHsgcHJvdG90eXBlOiBDb2RlQ2hlY2tPdXRwdXRFbGVtZW50LnByb3RvdHlwZSB9KTtcclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
