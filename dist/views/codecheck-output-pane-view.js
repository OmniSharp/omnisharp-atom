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
        _classCallCheck(this, CodeCheckOutputElement);

        var _this = _possibleConstructorReturn(this, (CodeCheckOutputElement.__proto__ || Object.getPrototypeOf(CodeCheckOutputElement)).apply(this, arguments));

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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy9jb2RlY2hlY2stb3V0cHV0LXBhbmUtdmlldy5qcyIsImxpYi92aWV3cy9jb2RlY2hlY2stb3V0cHV0LXBhbmUtdmlldy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7SUNDWTs7QURBWjs7QUFDQTs7Ozs7Ozs7OztBQ0tBLElBQU0sb0JBQW9CLFlBQUM7QUFDdkIsUUFBTSxnQkFBZ0I7QUFDbEIsYUFBSyxTQUFBLFFBQUEsR0FBQTtBQUFzQixtQkFBTyxLQUFLLFNBQUwsQ0FBZSxRQUFmLENBQXdCLFVBQXhCLENBQVAsQ0FBdEI7U0FBQTtBQUNMLGFBQUssU0FBQSxRQUFBLENBQWtCLEtBQWxCLEVBQWdDO0FBQUksZ0JBQUksS0FBSixFQUFXLEtBQUssU0FBTCxDQUFlLEdBQWYsQ0FBbUIsVUFBbkIsRUFBWCxLQUFnRCxLQUFLLFNBQUwsQ0FBZSxNQUFmLENBQXNCLFVBQXRCLEVBQWhEO1NBQXBDO0tBRkgsQ0FEaUI7QUFNdkIsUUFBTSxXQUFXO0FBQ2IsYUFBSyxTQUFBLEdBQUEsR0FBQTtBQUFpQixtQkFBTyxLQUFLLElBQUwsQ0FBeEI7U0FBQTtLQURILENBTmlCO0FBVXZCLFFBQU0sY0FBYztBQUNoQixhQUFLLFNBQUEsTUFBQSxHQUFBO0FBQW9CLG1CQUFPLEtBQUssT0FBTCxDQUEzQjtTQUFBO0FBQ0wsYUFBSyxTQUFBLE1BQUEsQ0FBZ0IsS0FBaEIsRUFBOEI7QUFBSSxpQkFBSyxPQUFMLEdBQWUsS0FBZixDQUFKO1NBQTlCO0tBRkgsQ0FWaUI7QUFldkIsYUFBQSxVQUFBLENBQW9CLEdBQXBCLEVBQWlDLElBQWpDLEVBQWdFO0FBQzVELGFBQUssSUFBTCxHQUFZLEdBQVosQ0FENEQ7QUFHNUQsYUFBSyxTQUFMLENBQWUsR0FBZixNQUFzQixLQUFLLFFBQUwsQ0FBdEIsQ0FINEQ7QUFLNUQsWUFBSSxLQUFLLFFBQUwsS0FBa0IsT0FBbEIsRUFBMkI7QUFDM0IsaUJBQUssS0FBTCxDQUFXLFNBQVgs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VyxJQUFYLEdBRE87Ozs7aUNBUU0sVUFBbUM7QUFDaEQsdUJBQUssVUFBTCxDQUFnQixRQUFoQixFQURnRDs7Ozs0QkFKNUI7QUFBSyxtQkFBTyxLQUFLLEtBQUwsQ0FBVyxhQUFYLENBQVo7OzBCQUNDLE9BQUs7QUFBSSxpQkFBSyxLQUFMLENBQVcsYUFBWCxHQUEyQixLQUEzQixDQUFKOzs7OzRCQUNaO0FBQUssbUJBQU8sS0FBSyxLQUFMLENBQVcsT0FBWCxDQUFaOzs7OztFQXhDc0I7O0FBK0N0QyxRQUFTLHNCQUFULEdBQXdDLFNBQVUsZUFBVixDQUEwQiw0QkFBMUIsRUFBd0QsRUFBRSxXQUFXLHVCQUF1QixTQUF2QixFQUFyRSxDQUF4QyIsImZpbGUiOiJsaWIvdmlld3MvY29kZWNoZWNrLW91dHB1dC1wYW5lLXZpZXcuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgeyBPbW5pIH0gZnJvbSBcIi4uL3NlcnZlci9vbW5pXCI7XG5pbXBvcnQgeyBPdXRwdXRFbGVtZW50IH0gZnJvbSBcIi4vb3V0cHV0LWNvbXBvbmVudFwiO1xuY29uc3QgZ2V0TWVzc2FnZUVsZW1lbnQgPSAoZnVuY3Rpb24gKCkge1xuICAgIGNvbnN0IHNlbGVjdGVkUHJvcHMgPSB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gc2VsZWN0ZWQoKSB7IHJldHVybiB0aGlzLmNsYXNzTGlzdC5jb250YWlucyhcInNlbGVjdGVkXCIpOyB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uIHNlbGVjdGVkKHZhbHVlKSB7IGlmICh2YWx1ZSlcbiAgICAgICAgICAgIHRoaXMuY2xhc3NMaXN0LmFkZChcInNlbGVjdGVkXCIpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICB0aGlzLmNsYXNzTGlzdC5yZW1vdmUoXCJzZWxlY3RlZFwiKTsgfVxuICAgIH07XG4gICAgY29uc3Qga2V5UHJvcHMgPSB7XG4gICAgICAgIGdldDogZnVuY3Rpb24ga2V5KCkgeyByZXR1cm4gdGhpcy5fa2V5OyB9XG4gICAgfTtcbiAgICBjb25zdCBpbnZpZXdQcm9wcyA9IHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiBpbnZpZXcoKSB7IHJldHVybiB0aGlzLl9pbnZpZXc7IH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gaW52aWV3KHZhbHVlKSB7IHRoaXMuX2ludmlldyA9IHZhbHVlOyB9XG4gICAgfTtcbiAgICBmdW5jdGlvbiBzZXRNZXNzYWdlKGtleSwgaXRlbSkge1xuICAgICAgICB0aGlzLl9rZXkgPSBrZXk7XG4gICAgICAgIHRoaXMuY2xhc3NMaXN0LmFkZChgJHtpdGVtLkxvZ0xldmVsfWApO1xuICAgICAgICBpZiAoaXRlbS5Mb2dMZXZlbCA9PT0gXCJFcnJvclwiKSB7XG4gICAgICAgICAgICB0aGlzLl9pY29uLmNsYXNzTGlzdC5hZGQoXCJmYS10aW1lcy1jaXJjbGVcIik7XG4gICAgICAgICAgICB0aGlzLl9pY29uLmNsYXNzTGlzdC5yZW1vdmUoXCJmYS1leGNsYW1hdGlvbi10cmlhbmdsZVwiKTtcbiAgICAgICAgICAgIHRoaXMuX2ljb24uY2xhc3NMaXN0LnJlbW92ZShcImZhLWluZm9cIik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoaXRlbS5Mb2dMZXZlbCA9PT0gXCJXYXJuaW5nXCIpIHtcbiAgICAgICAgICAgIHRoaXMuX2ljb24uY2xhc3NMaXN0LmFkZChcImZhLWV4Y2xhbWF0aW9uLXRyaWFuZ2xlXCIpO1xuICAgICAgICAgICAgdGhpcy5faWNvbi5jbGFzc0xpc3QucmVtb3ZlKFwiZmEtdGltZXMtY2lyY2xlXCIpO1xuICAgICAgICAgICAgdGhpcy5faWNvbi5jbGFzc0xpc3QucmVtb3ZlKFwiZmEtaW5mb1wiKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX2ljb24uY2xhc3NMaXN0LmFkZChcImZhLWluZm9cIik7XG4gICAgICAgICAgICB0aGlzLl9pY29uLmNsYXNzTGlzdC5yZW1vdmUoXCJmYS1leGNsYW1hdGlvbi10cmlhbmdsZVwiKTtcbiAgICAgICAgICAgIHRoaXMuX2ljb24uY2xhc3NMaXN0LnJlbW92ZShcImZhLXRpbWVzLWNpcmNsZVwiKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl90ZXh0LmlubmVyVGV4dCA9IGl0ZW0uVGV4dDtcbiAgICAgICAgdGhpcy5fbG9jYXRpb24uaW5uZXJUZXh0ID0gYCR7cGF0aC5iYXNlbmFtZShpdGVtLkZpbGVOYW1lKX0oJHtpdGVtLkxpbmV9LCR7aXRlbS5Db2x1bW59KWA7XG4gICAgICAgIHRoaXMuX2ZpbGVuYW1lLmlubmVyVGV4dCA9IHBhdGguZGlybmFtZShpdGVtLkZpbGVOYW1lKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gYXR0YWNoZWQoKSB7IH1cbiAgICBmdW5jdGlvbiBkZXRhY2hlZCgpIHsgfVxuICAgIHJldHVybiBmdW5jdGlvbiBnZXRNZXNzYWdlRWxlbWVudCgpIHtcbiAgICAgICAgY29uc3QgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJsaVwiKTtcbiAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkKFwiY29kZWNoZWNrXCIpO1xuICAgICAgICBjb25zdCBpY29uID0gZWxlbWVudC5faWNvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICBpY29uLmNsYXNzTGlzdC5hZGQoXCJmYVwiKTtcbiAgICAgICAgZWxlbWVudC5hcHBlbmRDaGlsZChpY29uKTtcbiAgICAgICAgY29uc3QgdGV4dCA9IGVsZW1lbnQuX3RleHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwicHJlXCIpO1xuICAgICAgICB0ZXh0LmNsYXNzTGlzdC5hZGQoXCJ0ZXh0LWhpZ2hsaWdodFwiKTtcbiAgICAgICAgZWxlbWVudC5hcHBlbmRDaGlsZCh0ZXh0KTtcbiAgICAgICAgY29uc3QgbG9jYXRpb24gPSBlbGVtZW50Ll9sb2NhdGlvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJwcmVcIik7XG4gICAgICAgIGxvY2F0aW9uLmNsYXNzTGlzdC5hZGQoXCJpbmxpbmUtYmxvY2tcIik7XG4gICAgICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQobG9jYXRpb24pO1xuICAgICAgICBjb25zdCBmaWxlbmFtZSA9IGVsZW1lbnQuX2ZpbGVuYW1lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInByZVwiKTtcbiAgICAgICAgZmlsZW5hbWUuY2xhc3NMaXN0LmFkZChcInRleHQtc3VidGxlXCIsIFwiaW5saW5lLWJsb2NrXCIpO1xuICAgICAgICBlbGVtZW50LmFwcGVuZENoaWxkKGZpbGVuYW1lKTtcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGVsZW1lbnQsIFwia2V5XCIsIGtleVByb3BzKTtcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGVsZW1lbnQsIFwic2VsZWN0ZWRcIiwgc2VsZWN0ZWRQcm9wcyk7XG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShlbGVtZW50LCBcImludmlld1wiLCBpbnZpZXdQcm9wcyk7XG4gICAgICAgIGVsZW1lbnQuc2V0TWVzc2FnZSA9IHNldE1lc3NhZ2U7XG4gICAgICAgIGVsZW1lbnQuYXR0YWNoZWQgPSBhdHRhY2hlZDtcbiAgICAgICAgZWxlbWVudC5kZXRhY2hlZCA9IGRldGFjaGVkO1xuICAgICAgICByZXR1cm4gZWxlbWVudDtcbiAgICB9O1xufSkoKTtcbmV4cG9ydCBjbGFzcyBDb2RlQ2hlY2tPdXRwdXRFbGVtZW50IGV4dGVuZHMgSFRNTERpdkVsZW1lbnQge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlciguLi5hcmd1bWVudHMpO1xuICAgICAgICB0aGlzLmRpc3BsYXlOYW1lID0gXCJGaW5kUGFuZVdpbmRvd1wiO1xuICAgIH1cbiAgICBjcmVhdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMuY2xhc3NMaXN0LmFkZChcImNvZGVjaGVjay1vdXRwdXQtcGFuZVwiKTtcbiAgICAgICAgdGhpcy5fbGlzdCA9IG5ldyBPdXRwdXRFbGVtZW50KCk7XG4gICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQodGhpcy5fbGlzdCk7XG4gICAgICAgIHRoaXMuX2xpc3QuZ2V0S2V5ID0gKGVycm9yKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gYGNvZGUtY2hlY2stJHtlcnJvci5Mb2dMZXZlbH0tJHtlcnJvci5GaWxlTmFtZX0tKCR7ZXJyb3IuTGluZX0tJHtlcnJvci5Db2x1bW59KS0oJHtlcnJvci5FbmRMaW5lfS0ke2Vycm9yLkVuZENvbHVtbn0pLSgkeyhlcnJvci5Qcm9qZWN0cyB8fCBbXSkuam9pbihcIi1cIil9KWA7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuX2xpc3QuaGFuZGxlQ2xpY2sgPSAoaXRlbSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5nb1RvTGluZShpdGVtKTtcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5fbGlzdC5ldmVudE5hbWUgPSBcImRpYWdub3N0aWNcIjtcbiAgICAgICAgdGhpcy5fbGlzdC5lbGVtZW50RmFjdG9yeSA9IGdldE1lc3NhZ2VFbGVtZW50O1xuICAgIH1cbiAgICBhdHRhY2hlZENhbGxiYWNrKCkge1xuICAgICAgICB0aGlzLl9saXN0LmF0dGFjaGVkKCk7XG4gICAgfVxuICAgIGRldGFjaGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMuX2xpc3QuZGV0YWNoZWQoKTtcbiAgICB9XG4gICAgdXBkYXRlKG91dHB1dCkge1xuICAgICAgICB0aGlzLl9saXN0LnVwZGF0ZU91dHB1dChvdXRwdXQpO1xuICAgIH1cbiAgICBuZXh0KCkge1xuICAgICAgICB0aGlzLl9saXN0Lm5leHQoKTtcbiAgICB9XG4gICAgcHJldigpIHtcbiAgICAgICAgdGhpcy5fbGlzdC5wcmV2KCk7XG4gICAgfVxuICAgIGdldCBzZWxlY3RlZEluZGV4KCkgeyByZXR1cm4gdGhpcy5fbGlzdC5zZWxlY3RlZEluZGV4OyB9XG4gICAgc2V0IHNlbGVjdGVkSW5kZXgodmFsdWUpIHsgdGhpcy5fbGlzdC5zZWxlY3RlZEluZGV4ID0gdmFsdWU7IH1cbiAgICBnZXQgY3VycmVudCgpIHsgcmV0dXJuIHRoaXMuX2xpc3QuY3VycmVudDsgfVxuICAgIGdvVG9MaW5lKGxvY2F0aW9uKSB7XG4gICAgICAgIE9tbmkubmF2aWdhdGVUbyhsb2NhdGlvbik7XG4gICAgfVxufVxuZXhwb3J0cy5Db2RlQ2hlY2tPdXRwdXRFbGVtZW50ID0gZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50KFwib21uaXNoYXJwLWNvZGVjaGVjay1vdXRwdXRcIiwgeyBwcm90b3R5cGU6IENvZGVDaGVja091dHB1dEVsZW1lbnQucHJvdG90eXBlIH0pO1xuIiwiaW1wb3J0IHtNb2RlbHN9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XHJcbmltcG9ydCAqIGFzIHBhdGggZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0IHtPbW5pfSBmcm9tIFwiLi4vc2VydmVyL29tbmlcIjtcclxuaW1wb3J0IHtPdXRwdXRFbGVtZW50LCBNZXNzYWdlRWxlbWVudH0gZnJvbSBcIi4vb3V0cHV0LWNvbXBvbmVudFwiO1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBDb2RlQ2hlY2tNZXNzYWdlRWxlbWVudCBleHRlbmRzIE1lc3NhZ2VFbGVtZW50PE1vZGVscy5EaWFnbm9zdGljTG9jYXRpb24+IHsgfVxyXG5cclxuY29uc3QgZ2V0TWVzc2FnZUVsZW1lbnQgPSAoZnVuY3Rpb24oKSB7XHJcbiAgICBjb25zdCBzZWxlY3RlZFByb3BzID0ge1xyXG4gICAgICAgIGdldDogZnVuY3Rpb24gc2VsZWN0ZWQoKSB7IHJldHVybiB0aGlzLmNsYXNzTGlzdC5jb250YWlucyhcInNlbGVjdGVkXCIpOyB9LFxyXG4gICAgICAgIHNldDogZnVuY3Rpb24gc2VsZWN0ZWQodmFsdWU6IGJvb2xlYW4pIHsgaWYgKHZhbHVlKSB0aGlzLmNsYXNzTGlzdC5hZGQoXCJzZWxlY3RlZFwiKTsgZWxzZSB0aGlzLmNsYXNzTGlzdC5yZW1vdmUoXCJzZWxlY3RlZFwiKTsgfVxyXG4gICAgfTtcclxuXHJcbiAgICBjb25zdCBrZXlQcm9wcyA9IHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uIGtleSgpIHsgcmV0dXJuIHRoaXMuX2tleTsgfVxyXG4gICAgfTtcclxuXHJcbiAgICBjb25zdCBpbnZpZXdQcm9wcyA9IHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uIGludmlldygpIHsgcmV0dXJuIHRoaXMuX2ludmlldzsgfSxcclxuICAgICAgICBzZXQ6IGZ1bmN0aW9uIGludmlldyh2YWx1ZTogYm9vbGVhbikgeyB0aGlzLl9pbnZpZXcgPSB2YWx1ZTsgfVxyXG4gICAgfTtcclxuXHJcbiAgICBmdW5jdGlvbiBzZXRNZXNzYWdlKGtleTogc3RyaW5nLCBpdGVtOiBNb2RlbHMuRGlhZ25vc3RpY0xvY2F0aW9uKSB7XHJcbiAgICAgICAgdGhpcy5fa2V5ID0ga2V5O1xyXG5cclxuICAgICAgICB0aGlzLmNsYXNzTGlzdC5hZGQoYCR7aXRlbS5Mb2dMZXZlbH1gKTtcclxuXHJcbiAgICAgICAgaWYgKGl0ZW0uTG9nTGV2ZWwgPT09IFwiRXJyb3JcIikge1xyXG4gICAgICAgICAgICB0aGlzLl9pY29uLmNsYXNzTGlzdC5hZGQoXCJmYS10aW1lcy1jaXJjbGVcIik7XHJcbiAgICAgICAgICAgIHRoaXMuX2ljb24uY2xhc3NMaXN0LnJlbW92ZShcImZhLWV4Y2xhbWF0aW9uLXRyaWFuZ2xlXCIpO1xyXG4gICAgICAgICAgICB0aGlzLl9pY29uLmNsYXNzTGlzdC5yZW1vdmUoXCJmYS1pbmZvXCIpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoaXRlbS5Mb2dMZXZlbCA9PT0gXCJXYXJuaW5nXCIpIHtcclxuICAgICAgICAgICAgdGhpcy5faWNvbi5jbGFzc0xpc3QuYWRkKFwiZmEtZXhjbGFtYXRpb24tdHJpYW5nbGVcIik7XHJcbiAgICAgICAgICAgIHRoaXMuX2ljb24uY2xhc3NMaXN0LnJlbW92ZShcImZhLXRpbWVzLWNpcmNsZVwiKTtcclxuICAgICAgICAgICAgdGhpcy5faWNvbi5jbGFzc0xpc3QucmVtb3ZlKFwiZmEtaW5mb1wiKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLl9pY29uLmNsYXNzTGlzdC5hZGQoXCJmYS1pbmZvXCIpO1xyXG4gICAgICAgICAgICB0aGlzLl9pY29uLmNsYXNzTGlzdC5yZW1vdmUoXCJmYS1leGNsYW1hdGlvbi10cmlhbmdsZVwiKTtcclxuICAgICAgICAgICAgdGhpcy5faWNvbi5jbGFzc0xpc3QucmVtb3ZlKFwiZmEtdGltZXMtY2lyY2xlXCIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5fdGV4dC5pbm5lclRleHQgPSBpdGVtLlRleHQ7XHJcbiAgICAgICAgdGhpcy5fbG9jYXRpb24uaW5uZXJUZXh0ID0gYCR7cGF0aC5iYXNlbmFtZShpdGVtLkZpbGVOYW1lKX0oJHtpdGVtLkxpbmV9LCR7aXRlbS5Db2x1bW59KWA7XHJcbiAgICAgICAgdGhpcy5fZmlsZW5hbWUuaW5uZXJUZXh0ID0gcGF0aC5kaXJuYW1lKGl0ZW0uRmlsZU5hbWUpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGF0dGFjaGVkKCkgeyAvKiAqLyB9XHJcblxyXG4gICAgZnVuY3Rpb24gZGV0YWNoZWQoKSB7IC8qICovIH1cclxuXHJcbiAgICByZXR1cm4gZnVuY3Rpb24gZ2V0TWVzc2FnZUVsZW1lbnQoKTogQ29kZUNoZWNrTWVzc2FnZUVsZW1lbnQge1xyXG4gICAgICAgIGNvbnN0IGVsZW1lbnQ6IENvZGVDaGVja01lc3NhZ2VFbGVtZW50ID0gPGFueT5kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwibGlcIik7XHJcbiAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkKFwiY29kZWNoZWNrXCIpO1xyXG5cclxuICAgICAgICBjb25zdCBpY29uID0gKGVsZW1lbnQgYXMgYW55KS5faWNvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xyXG4gICAgICAgIGljb24uY2xhc3NMaXN0LmFkZChcImZhXCIpO1xyXG4gICAgICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQoaWNvbik7XHJcblxyXG4gICAgICAgIGNvbnN0IHRleHQgPSAoZWxlbWVudCBhcyBhbnkpLl90ZXh0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInByZVwiKTtcclxuICAgICAgICB0ZXh0LmNsYXNzTGlzdC5hZGQoXCJ0ZXh0LWhpZ2hsaWdodFwiKTtcclxuICAgICAgICBlbGVtZW50LmFwcGVuZENoaWxkKHRleHQpO1xyXG5cclxuICAgICAgICBjb25zdCBsb2NhdGlvbiA9IChlbGVtZW50IGFzIGFueSkuX2xvY2F0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInByZVwiKTtcclxuICAgICAgICBsb2NhdGlvbi5jbGFzc0xpc3QuYWRkKFwiaW5saW5lLWJsb2NrXCIpO1xyXG4gICAgICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQobG9jYXRpb24pO1xyXG5cclxuICAgICAgICBjb25zdCBmaWxlbmFtZSA9IChlbGVtZW50IGFzIGFueSkuX2ZpbGVuYW1lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInByZVwiKTtcclxuICAgICAgICBmaWxlbmFtZS5jbGFzc0xpc3QuYWRkKFwidGV4dC1zdWJ0bGVcIiwgXCJpbmxpbmUtYmxvY2tcIik7XHJcbiAgICAgICAgZWxlbWVudC5hcHBlbmRDaGlsZChmaWxlbmFtZSk7XHJcblxyXG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShlbGVtZW50LCBcImtleVwiLCBrZXlQcm9wcyk7XHJcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGVsZW1lbnQsIFwic2VsZWN0ZWRcIiwgc2VsZWN0ZWRQcm9wcyk7XHJcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGVsZW1lbnQsIFwiaW52aWV3XCIsIGludmlld1Byb3BzKTtcclxuICAgICAgICBlbGVtZW50LnNldE1lc3NhZ2UgPSBzZXRNZXNzYWdlO1xyXG4gICAgICAgIGVsZW1lbnQuYXR0YWNoZWQgPSBhdHRhY2hlZDtcclxuICAgICAgICBlbGVtZW50LmRldGFjaGVkID0gZGV0YWNoZWQ7XHJcblxyXG4gICAgICAgIHJldHVybiBlbGVtZW50O1xyXG4gICAgfTtcclxufSkoKTtcclxuXHJcbmV4cG9ydCBjbGFzcyBDb2RlQ2hlY2tPdXRwdXRFbGVtZW50IGV4dGVuZHMgSFRNTERpdkVsZW1lbnQgaW1wbGVtZW50cyBXZWJDb21wb25lbnQge1xyXG4gICAgcHVibGljIGRpc3BsYXlOYW1lID0gXCJGaW5kUGFuZVdpbmRvd1wiO1xyXG4gICAgcHJpdmF0ZSBfbGlzdDogT3V0cHV0RWxlbWVudDxNb2RlbHMuRGlhZ25vc3RpY0xvY2F0aW9uLCBDb2RlQ2hlY2tNZXNzYWdlRWxlbWVudD47XHJcblxyXG4gICAgcHVibGljIGNyZWF0ZWRDYWxsYmFjaygpIHtcclxuICAgICAgICB0aGlzLmNsYXNzTGlzdC5hZGQoXCJjb2RlY2hlY2stb3V0cHV0LXBhbmVcIik7XHJcbiAgICAgICAgdGhpcy5fbGlzdCA9IG5ldyBPdXRwdXRFbGVtZW50PE1vZGVscy5EaWFnbm9zdGljTG9jYXRpb24sIENvZGVDaGVja01lc3NhZ2VFbGVtZW50PigpO1xyXG4gICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQodGhpcy5fbGlzdCk7XHJcbiAgICAgICAgdGhpcy5fbGlzdC5nZXRLZXkgPSAoZXJyb3I6IE1vZGVscy5EaWFnbm9zdGljTG9jYXRpb24pID0+IHtcclxuICAgICAgICAgICAgcmV0dXJuIGBjb2RlLWNoZWNrLSR7ZXJyb3IuTG9nTGV2ZWx9LSR7ZXJyb3IuRmlsZU5hbWV9LSgke2Vycm9yLkxpbmV9LSR7ZXJyb3IuQ29sdW1ufSktKCR7ZXJyb3IuRW5kTGluZX0tJHtlcnJvci5FbmRDb2x1bW59KS0oJHsoZXJyb3IuUHJvamVjdHMgfHwgW10pLmpvaW4oXCItXCIpfSlgO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgdGhpcy5fbGlzdC5oYW5kbGVDbGljayA9IChpdGVtOiBNb2RlbHMuRGlhZ25vc3RpY0xvY2F0aW9uKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuZ29Ub0xpbmUoaXRlbSk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICB0aGlzLl9saXN0LmV2ZW50TmFtZSA9IFwiZGlhZ25vc3RpY1wiO1xyXG4gICAgICAgIHRoaXMuX2xpc3QuZWxlbWVudEZhY3RvcnkgPSBnZXRNZXNzYWdlRWxlbWVudDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgYXR0YWNoZWRDYWxsYmFjaygpIHtcclxuICAgICAgICB0aGlzLl9saXN0LmF0dGFjaGVkKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRldGFjaGVkQ2FsbGJhY2soKSB7XHJcbiAgICAgICAgdGhpcy5fbGlzdC5kZXRhY2hlZCgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB1cGRhdGUob3V0cHV0OiBNb2RlbHMuRGlhZ25vc3RpY0xvY2F0aW9uW10pIHtcclxuICAgICAgICB0aGlzLl9saXN0LnVwZGF0ZU91dHB1dChvdXRwdXQpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBuZXh0KCkge1xyXG4gICAgICAgIHRoaXMuX2xpc3QubmV4dCgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBwcmV2KCkge1xyXG4gICAgICAgIHRoaXMuX2xpc3QucHJldigpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgc2VsZWN0ZWRJbmRleCgpIHsgcmV0dXJuIHRoaXMuX2xpc3Quc2VsZWN0ZWRJbmRleDsgfVxyXG4gICAgcHVibGljIHNldCBzZWxlY3RlZEluZGV4KHZhbHVlKSB7IHRoaXMuX2xpc3Quc2VsZWN0ZWRJbmRleCA9IHZhbHVlOyB9XHJcbiAgICBwdWJsaWMgZ2V0IGN1cnJlbnQoKSB7IHJldHVybiB0aGlzLl9saXN0LmN1cnJlbnQ7IH1cclxuXHJcbiAgICBwcml2YXRlIGdvVG9MaW5lKGxvY2F0aW9uOiBNb2RlbHMuRGlhZ25vc3RpY0xvY2F0aW9uKSB7XHJcbiAgICAgICAgT21uaS5uYXZpZ2F0ZVRvKGxvY2F0aW9uKTtcclxuICAgIH1cclxufVxyXG5cclxuKDxhbnk+ZXhwb3J0cykuQ29kZUNoZWNrT3V0cHV0RWxlbWVudCA9ICg8YW55PmRvY3VtZW50KS5yZWdpc3RlckVsZW1lbnQoXCJvbW5pc2hhcnAtY29kZWNoZWNrLW91dHB1dFwiLCB7IHByb3RvdHlwZTogQ29kZUNoZWNrT3V0cHV0RWxlbWVudC5wcm90b3R5cGUgfSk7XHJcbiJdfQ==
