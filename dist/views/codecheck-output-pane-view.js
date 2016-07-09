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
        var _Object$getPrototypeO;

        _classCallCheck(this, CodeCheckOutputElement);

        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
        }

        var _this = _possibleConstructorReturn(this, (_Object$getPrototypeO = Object.getPrototypeOf(CodeCheckOutputElement)).call.apply(_Object$getPrototypeO, [this].concat(args)));

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy9jb2RlY2hlY2stb3V0cHV0LXBhbmUtdmlldy5qcyIsImxpYi92aWV3cy9jb2RlY2hlY2stb3V0cHV0LXBhbmUtdmlldy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7SUNDWSxJOztBREFaOztBQUNBOzs7Ozs7Ozs7O0FDS0EsSUFBTSxvQkFBcUIsWUFBQTtBQUN2QixRQUFNLGdCQUFnQjtBQUNsQixhQUFLLFNBQUEsUUFBQSxHQUFBO0FBQXNCLG1CQUFPLEtBQUssU0FBTCxDQUFlLFFBQWYsQ0FBd0IsVUFBeEIsQ0FBUDtBQUE2QyxTQUR0RDtBQUVsQixhQUFLLFNBQUEsUUFBQSxDQUFrQixLQUFsQixFQUFnQztBQUFJLGdCQUFJLEtBQUosRUFBVyxLQUFLLFNBQUwsQ0FBZSxHQUFmLENBQW1CLFVBQW5CLEVBQVgsS0FBZ0QsS0FBSyxTQUFMLENBQWUsTUFBZixDQUFzQixVQUF0QjtBQUFvQztBQUYzRyxLQUF0QjtBQUtBLFFBQU0sV0FBVztBQUNiLGFBQUssU0FBQSxHQUFBLEdBQUE7QUFBaUIsbUJBQU8sS0FBSyxJQUFaO0FBQW1CO0FBRDVCLEtBQWpCO0FBSUEsUUFBTSxjQUFjO0FBQ2hCLGFBQUssU0FBQSxNQUFBLEdBQUE7QUFBb0IsbUJBQU8sS0FBSyxPQUFaO0FBQXNCLFNBRC9CO0FBRWhCLGFBQUssU0FBQSxNQUFBLENBQWdCLEtBQWhCLEVBQThCO0FBQUksaUJBQUssT0FBTCxHQUFlLEtBQWY7QUFBdUI7QUFGOUMsS0FBcEI7QUFLQSxhQUFBLFVBQUEsQ0FBb0IsR0FBcEIsRUFBaUMsSUFBakMsRUFBZ0U7QUFDNUQsYUFBSyxJQUFMLEdBQVksR0FBWjtBQUVBLGFBQUssU0FBTCxDQUFlLEdBQWYsTUFBc0IsS0FBSyxRQUEzQjtBQUVBLFlBQUksS0FBSyxRQUFMLEtBQWtCLE9BQXRCLEVBQStCO0FBQzNCLGlCQUFLLEtBQUwsQ0FBVyxTQUFYLENBQXFCLEdBQXJCLENBQXlCLGlCQUF6QjtBQUNB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Q0FBVyxPQUFsQjtBQUE0Qjs7OztFQXhDWCxjOztBQStDdEMsUUFBUyxzQkFBVCxHQUF3QyxTQUFVLGVBQVYsQ0FBMEIsNEJBQTFCLEVBQXdELEVBQUUsV0FBVyx1QkFBdUIsU0FBcEMsRUFBeEQsQ0FBeEMiLCJmaWxlIjoibGliL3ZpZXdzL2NvZGVjaGVjay1vdXRwdXQtcGFuZS12aWV3LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IHsgT21uaSB9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xuaW1wb3J0IHsgT3V0cHV0RWxlbWVudCB9IGZyb20gXCIuL291dHB1dC1jb21wb25lbnRcIjtcbmNvbnN0IGdldE1lc3NhZ2VFbGVtZW50ID0gKGZ1bmN0aW9uICgpIHtcbiAgICBjb25zdCBzZWxlY3RlZFByb3BzID0ge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uIHNlbGVjdGVkKCkgeyByZXR1cm4gdGhpcy5jbGFzc0xpc3QuY29udGFpbnMoXCJzZWxlY3RlZFwiKTsgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiBzZWxlY3RlZCh2YWx1ZSkgeyBpZiAodmFsdWUpXG4gICAgICAgICAgICB0aGlzLmNsYXNzTGlzdC5hZGQoXCJzZWxlY3RlZFwiKTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgdGhpcy5jbGFzc0xpc3QucmVtb3ZlKFwic2VsZWN0ZWRcIik7IH1cbiAgICB9O1xuICAgIGNvbnN0IGtleVByb3BzID0ge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uIGtleSgpIHsgcmV0dXJuIHRoaXMuX2tleTsgfVxuICAgIH07XG4gICAgY29uc3QgaW52aWV3UHJvcHMgPSB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gaW52aWV3KCkgeyByZXR1cm4gdGhpcy5faW52aWV3OyB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uIGludmlldyh2YWx1ZSkgeyB0aGlzLl9pbnZpZXcgPSB2YWx1ZTsgfVxuICAgIH07XG4gICAgZnVuY3Rpb24gc2V0TWVzc2FnZShrZXksIGl0ZW0pIHtcbiAgICAgICAgdGhpcy5fa2V5ID0ga2V5O1xuICAgICAgICB0aGlzLmNsYXNzTGlzdC5hZGQoYCR7aXRlbS5Mb2dMZXZlbH1gKTtcbiAgICAgICAgaWYgKGl0ZW0uTG9nTGV2ZWwgPT09IFwiRXJyb3JcIikge1xuICAgICAgICAgICAgdGhpcy5faWNvbi5jbGFzc0xpc3QuYWRkKFwiZmEtdGltZXMtY2lyY2xlXCIpO1xuICAgICAgICAgICAgdGhpcy5faWNvbi5jbGFzc0xpc3QucmVtb3ZlKFwiZmEtZXhjbGFtYXRpb24tdHJpYW5nbGVcIik7XG4gICAgICAgICAgICB0aGlzLl9pY29uLmNsYXNzTGlzdC5yZW1vdmUoXCJmYS1pbmZvXCIpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGl0ZW0uTG9nTGV2ZWwgPT09IFwiV2FybmluZ1wiKSB7XG4gICAgICAgICAgICB0aGlzLl9pY29uLmNsYXNzTGlzdC5hZGQoXCJmYS1leGNsYW1hdGlvbi10cmlhbmdsZVwiKTtcbiAgICAgICAgICAgIHRoaXMuX2ljb24uY2xhc3NMaXN0LnJlbW92ZShcImZhLXRpbWVzLWNpcmNsZVwiKTtcbiAgICAgICAgICAgIHRoaXMuX2ljb24uY2xhc3NMaXN0LnJlbW92ZShcImZhLWluZm9cIik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9pY29uLmNsYXNzTGlzdC5hZGQoXCJmYS1pbmZvXCIpO1xuICAgICAgICAgICAgdGhpcy5faWNvbi5jbGFzc0xpc3QucmVtb3ZlKFwiZmEtZXhjbGFtYXRpb24tdHJpYW5nbGVcIik7XG4gICAgICAgICAgICB0aGlzLl9pY29uLmNsYXNzTGlzdC5yZW1vdmUoXCJmYS10aW1lcy1jaXJjbGVcIik7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fdGV4dC5pbm5lclRleHQgPSBpdGVtLlRleHQ7XG4gICAgICAgIHRoaXMuX2xvY2F0aW9uLmlubmVyVGV4dCA9IGAke3BhdGguYmFzZW5hbWUoaXRlbS5GaWxlTmFtZSl9KCR7aXRlbS5MaW5lfSwke2l0ZW0uQ29sdW1ufSlgO1xuICAgICAgICB0aGlzLl9maWxlbmFtZS5pbm5lclRleHQgPSBwYXRoLmRpcm5hbWUoaXRlbS5GaWxlTmFtZSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGF0dGFjaGVkKCkgeyB9XG4gICAgZnVuY3Rpb24gZGV0YWNoZWQoKSB7IH1cbiAgICByZXR1cm4gZnVuY3Rpb24gZ2V0TWVzc2FnZUVsZW1lbnQoKSB7XG4gICAgICAgIGNvbnN0IGVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwibGlcIik7XG4gICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZChcImNvZGVjaGVja1wiKTtcbiAgICAgICAgY29uc3QgaWNvbiA9IGVsZW1lbnQuX2ljb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgaWNvbi5jbGFzc0xpc3QuYWRkKFwiZmFcIik7XG4gICAgICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQoaWNvbik7XG4gICAgICAgIGNvbnN0IHRleHQgPSBlbGVtZW50Ll90ZXh0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInByZVwiKTtcbiAgICAgICAgdGV4dC5jbGFzc0xpc3QuYWRkKFwidGV4dC1oaWdobGlnaHRcIik7XG4gICAgICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQodGV4dCk7XG4gICAgICAgIGNvbnN0IGxvY2F0aW9uID0gZWxlbWVudC5fbG9jYXRpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwicHJlXCIpO1xuICAgICAgICBsb2NhdGlvbi5jbGFzc0xpc3QuYWRkKFwiaW5saW5lLWJsb2NrXCIpO1xuICAgICAgICBlbGVtZW50LmFwcGVuZENoaWxkKGxvY2F0aW9uKTtcbiAgICAgICAgY29uc3QgZmlsZW5hbWUgPSBlbGVtZW50Ll9maWxlbmFtZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJwcmVcIik7XG4gICAgICAgIGZpbGVuYW1lLmNsYXNzTGlzdC5hZGQoXCJ0ZXh0LXN1YnRsZVwiLCBcImlubGluZS1ibG9ja1wiKTtcbiAgICAgICAgZWxlbWVudC5hcHBlbmRDaGlsZChmaWxlbmFtZSk7XG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShlbGVtZW50LCBcImtleVwiLCBrZXlQcm9wcyk7XG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShlbGVtZW50LCBcInNlbGVjdGVkXCIsIHNlbGVjdGVkUHJvcHMpO1xuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZWxlbWVudCwgXCJpbnZpZXdcIiwgaW52aWV3UHJvcHMpO1xuICAgICAgICBlbGVtZW50LnNldE1lc3NhZ2UgPSBzZXRNZXNzYWdlO1xuICAgICAgICBlbGVtZW50LmF0dGFjaGVkID0gYXR0YWNoZWQ7XG4gICAgICAgIGVsZW1lbnQuZGV0YWNoZWQgPSBkZXRhY2hlZDtcbiAgICAgICAgcmV0dXJuIGVsZW1lbnQ7XG4gICAgfTtcbn0pKCk7XG5leHBvcnQgY2xhc3MgQ29kZUNoZWNrT3V0cHV0RWxlbWVudCBleHRlbmRzIEhUTUxEaXZFbGVtZW50IHtcbiAgICBjb25zdHJ1Y3RvciguLi5hcmdzKSB7XG4gICAgICAgIHN1cGVyKC4uLmFyZ3MpO1xuICAgICAgICB0aGlzLmRpc3BsYXlOYW1lID0gXCJGaW5kUGFuZVdpbmRvd1wiO1xuICAgIH1cbiAgICBjcmVhdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMuY2xhc3NMaXN0LmFkZChcImNvZGVjaGVjay1vdXRwdXQtcGFuZVwiKTtcbiAgICAgICAgdGhpcy5fbGlzdCA9IG5ldyBPdXRwdXRFbGVtZW50KCk7XG4gICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQodGhpcy5fbGlzdCk7XG4gICAgICAgIHRoaXMuX2xpc3QuZ2V0S2V5ID0gKGVycm9yKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gYGNvZGUtY2hlY2stJHtlcnJvci5Mb2dMZXZlbH0tJHtlcnJvci5GaWxlTmFtZX0tKCR7ZXJyb3IuTGluZX0tJHtlcnJvci5Db2x1bW59KS0oJHtlcnJvci5FbmRMaW5lfS0ke2Vycm9yLkVuZENvbHVtbn0pLSgkeyhlcnJvci5Qcm9qZWN0cyB8fCBbXSkuam9pbihcIi1cIil9KWA7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuX2xpc3QuaGFuZGxlQ2xpY2sgPSAoaXRlbSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5nb1RvTGluZShpdGVtKTtcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5fbGlzdC5ldmVudE5hbWUgPSBcImRpYWdub3N0aWNcIjtcbiAgICAgICAgdGhpcy5fbGlzdC5lbGVtZW50RmFjdG9yeSA9IGdldE1lc3NhZ2VFbGVtZW50O1xuICAgIH1cbiAgICBhdHRhY2hlZENhbGxiYWNrKCkge1xuICAgICAgICB0aGlzLl9saXN0LmF0dGFjaGVkKCk7XG4gICAgfVxuICAgIGRldGFjaGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMuX2xpc3QuZGV0YWNoZWQoKTtcbiAgICB9XG4gICAgdXBkYXRlKG91dHB1dCkge1xuICAgICAgICB0aGlzLl9saXN0LnVwZGF0ZU91dHB1dChvdXRwdXQpO1xuICAgIH1cbiAgICBuZXh0KCkge1xuICAgICAgICB0aGlzLl9saXN0Lm5leHQoKTtcbiAgICB9XG4gICAgcHJldigpIHtcbiAgICAgICAgdGhpcy5fbGlzdC5wcmV2KCk7XG4gICAgfVxuICAgIGdldCBzZWxlY3RlZEluZGV4KCkgeyByZXR1cm4gdGhpcy5fbGlzdC5zZWxlY3RlZEluZGV4OyB9XG4gICAgc2V0IHNlbGVjdGVkSW5kZXgodmFsdWUpIHsgdGhpcy5fbGlzdC5zZWxlY3RlZEluZGV4ID0gdmFsdWU7IH1cbiAgICBnZXQgY3VycmVudCgpIHsgcmV0dXJuIHRoaXMuX2xpc3QuY3VycmVudDsgfVxuICAgIGdvVG9MaW5lKGxvY2F0aW9uKSB7XG4gICAgICAgIE9tbmkubmF2aWdhdGVUbyhsb2NhdGlvbik7XG4gICAgfVxufVxuZXhwb3J0cy5Db2RlQ2hlY2tPdXRwdXRFbGVtZW50ID0gZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50KFwib21uaXNoYXJwLWNvZGVjaGVjay1vdXRwdXRcIiwgeyBwcm90b3R5cGU6IENvZGVDaGVja091dHB1dEVsZW1lbnQucHJvdG90eXBlIH0pO1xuIiwiaW1wb3J0IHtNb2RlbHN9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XHJcbmltcG9ydCAqIGFzIHBhdGggZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0IHtPbW5pfSBmcm9tIFwiLi4vc2VydmVyL29tbmlcIjtcclxuaW1wb3J0IHtPdXRwdXRFbGVtZW50LCBNZXNzYWdlRWxlbWVudH0gZnJvbSBcIi4vb3V0cHV0LWNvbXBvbmVudFwiO1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBDb2RlQ2hlY2tNZXNzYWdlRWxlbWVudCBleHRlbmRzIE1lc3NhZ2VFbGVtZW50PE1vZGVscy5EaWFnbm9zdGljTG9jYXRpb24+IHsgfVxyXG5cclxuY29uc3QgZ2V0TWVzc2FnZUVsZW1lbnQgPSAoZnVuY3Rpb24oKSB7XHJcbiAgICBjb25zdCBzZWxlY3RlZFByb3BzID0ge1xyXG4gICAgICAgIGdldDogZnVuY3Rpb24gc2VsZWN0ZWQoKSB7IHJldHVybiB0aGlzLmNsYXNzTGlzdC5jb250YWlucyhcInNlbGVjdGVkXCIpOyB9LFxyXG4gICAgICAgIHNldDogZnVuY3Rpb24gc2VsZWN0ZWQodmFsdWU6IGJvb2xlYW4pIHsgaWYgKHZhbHVlKSB0aGlzLmNsYXNzTGlzdC5hZGQoXCJzZWxlY3RlZFwiKTsgZWxzZSB0aGlzLmNsYXNzTGlzdC5yZW1vdmUoXCJzZWxlY3RlZFwiKTsgfVxyXG4gICAgfTtcclxuXHJcbiAgICBjb25zdCBrZXlQcm9wcyA9IHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uIGtleSgpIHsgcmV0dXJuIHRoaXMuX2tleTsgfVxyXG4gICAgfTtcclxuXHJcbiAgICBjb25zdCBpbnZpZXdQcm9wcyA9IHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uIGludmlldygpIHsgcmV0dXJuIHRoaXMuX2ludmlldzsgfSxcclxuICAgICAgICBzZXQ6IGZ1bmN0aW9uIGludmlldyh2YWx1ZTogYm9vbGVhbikgeyB0aGlzLl9pbnZpZXcgPSB2YWx1ZTsgfVxyXG4gICAgfTtcclxuXHJcbiAgICBmdW5jdGlvbiBzZXRNZXNzYWdlKGtleTogc3RyaW5nLCBpdGVtOiBNb2RlbHMuRGlhZ25vc3RpY0xvY2F0aW9uKSB7XHJcbiAgICAgICAgdGhpcy5fa2V5ID0ga2V5O1xyXG5cclxuICAgICAgICB0aGlzLmNsYXNzTGlzdC5hZGQoYCR7aXRlbS5Mb2dMZXZlbH1gKTtcclxuXHJcbiAgICAgICAgaWYgKGl0ZW0uTG9nTGV2ZWwgPT09IFwiRXJyb3JcIikge1xyXG4gICAgICAgICAgICB0aGlzLl9pY29uLmNsYXNzTGlzdC5hZGQoXCJmYS10aW1lcy1jaXJjbGVcIik7XHJcbiAgICAgICAgICAgIHRoaXMuX2ljb24uY2xhc3NMaXN0LnJlbW92ZShcImZhLWV4Y2xhbWF0aW9uLXRyaWFuZ2xlXCIpO1xyXG4gICAgICAgICAgICB0aGlzLl9pY29uLmNsYXNzTGlzdC5yZW1vdmUoXCJmYS1pbmZvXCIpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoaXRlbS5Mb2dMZXZlbCA9PT0gXCJXYXJuaW5nXCIpIHtcclxuICAgICAgICAgICAgdGhpcy5faWNvbi5jbGFzc0xpc3QuYWRkKFwiZmEtZXhjbGFtYXRpb24tdHJpYW5nbGVcIik7XHJcbiAgICAgICAgICAgIHRoaXMuX2ljb24uY2xhc3NMaXN0LnJlbW92ZShcImZhLXRpbWVzLWNpcmNsZVwiKTtcclxuICAgICAgICAgICAgdGhpcy5faWNvbi5jbGFzc0xpc3QucmVtb3ZlKFwiZmEtaW5mb1wiKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLl9pY29uLmNsYXNzTGlzdC5hZGQoXCJmYS1pbmZvXCIpO1xyXG4gICAgICAgICAgICB0aGlzLl9pY29uLmNsYXNzTGlzdC5yZW1vdmUoXCJmYS1leGNsYW1hdGlvbi10cmlhbmdsZVwiKTtcclxuICAgICAgICAgICAgdGhpcy5faWNvbi5jbGFzc0xpc3QucmVtb3ZlKFwiZmEtdGltZXMtY2lyY2xlXCIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5fdGV4dC5pbm5lclRleHQgPSBpdGVtLlRleHQ7XHJcbiAgICAgICAgdGhpcy5fbG9jYXRpb24uaW5uZXJUZXh0ID0gYCR7cGF0aC5iYXNlbmFtZShpdGVtLkZpbGVOYW1lKX0oJHtpdGVtLkxpbmV9LCR7aXRlbS5Db2x1bW59KWA7XHJcbiAgICAgICAgdGhpcy5fZmlsZW5hbWUuaW5uZXJUZXh0ID0gcGF0aC5kaXJuYW1lKGl0ZW0uRmlsZU5hbWUpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGF0dGFjaGVkKCkgeyAvKiAqLyB9XHJcblxyXG4gICAgZnVuY3Rpb24gZGV0YWNoZWQoKSB7IC8qICovIH1cclxuXHJcbiAgICByZXR1cm4gZnVuY3Rpb24gZ2V0TWVzc2FnZUVsZW1lbnQoKTogQ29kZUNoZWNrTWVzc2FnZUVsZW1lbnQge1xyXG4gICAgICAgIGNvbnN0IGVsZW1lbnQ6IENvZGVDaGVja01lc3NhZ2VFbGVtZW50ID0gPGFueT5kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwibGlcIik7XHJcbiAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkKFwiY29kZWNoZWNrXCIpO1xyXG5cclxuICAgICAgICBjb25zdCBpY29uID0gKGVsZW1lbnQgYXMgYW55KS5faWNvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xyXG4gICAgICAgIGljb24uY2xhc3NMaXN0LmFkZChcImZhXCIpO1xyXG4gICAgICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQoaWNvbik7XHJcblxyXG4gICAgICAgIGNvbnN0IHRleHQgPSAoZWxlbWVudCBhcyBhbnkpLl90ZXh0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInByZVwiKTtcclxuICAgICAgICB0ZXh0LmNsYXNzTGlzdC5hZGQoXCJ0ZXh0LWhpZ2hsaWdodFwiKTtcclxuICAgICAgICBlbGVtZW50LmFwcGVuZENoaWxkKHRleHQpO1xyXG5cclxuICAgICAgICBjb25zdCBsb2NhdGlvbiA9IChlbGVtZW50IGFzIGFueSkuX2xvY2F0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInByZVwiKTtcclxuICAgICAgICBsb2NhdGlvbi5jbGFzc0xpc3QuYWRkKFwiaW5saW5lLWJsb2NrXCIpO1xyXG4gICAgICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQobG9jYXRpb24pO1xyXG5cclxuICAgICAgICBjb25zdCBmaWxlbmFtZSA9IChlbGVtZW50IGFzIGFueSkuX2ZpbGVuYW1lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInByZVwiKTtcclxuICAgICAgICBmaWxlbmFtZS5jbGFzc0xpc3QuYWRkKFwidGV4dC1zdWJ0bGVcIiwgXCJpbmxpbmUtYmxvY2tcIik7XHJcbiAgICAgICAgZWxlbWVudC5hcHBlbmRDaGlsZChmaWxlbmFtZSk7XHJcblxyXG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShlbGVtZW50LCBcImtleVwiLCBrZXlQcm9wcyk7XHJcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGVsZW1lbnQsIFwic2VsZWN0ZWRcIiwgc2VsZWN0ZWRQcm9wcyk7XHJcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGVsZW1lbnQsIFwiaW52aWV3XCIsIGludmlld1Byb3BzKTtcclxuICAgICAgICBlbGVtZW50LnNldE1lc3NhZ2UgPSBzZXRNZXNzYWdlO1xyXG4gICAgICAgIGVsZW1lbnQuYXR0YWNoZWQgPSBhdHRhY2hlZDtcclxuICAgICAgICBlbGVtZW50LmRldGFjaGVkID0gZGV0YWNoZWQ7XHJcblxyXG4gICAgICAgIHJldHVybiBlbGVtZW50O1xyXG4gICAgfTtcclxufSkoKTtcclxuXHJcbmV4cG9ydCBjbGFzcyBDb2RlQ2hlY2tPdXRwdXRFbGVtZW50IGV4dGVuZHMgSFRNTERpdkVsZW1lbnQgaW1wbGVtZW50cyBXZWJDb21wb25lbnQge1xyXG4gICAgcHVibGljIGRpc3BsYXlOYW1lID0gXCJGaW5kUGFuZVdpbmRvd1wiO1xyXG4gICAgcHJpdmF0ZSBfbGlzdDogT3V0cHV0RWxlbWVudDxNb2RlbHMuRGlhZ25vc3RpY0xvY2F0aW9uLCBDb2RlQ2hlY2tNZXNzYWdlRWxlbWVudD47XHJcblxyXG4gICAgcHVibGljIGNyZWF0ZWRDYWxsYmFjaygpIHtcclxuICAgICAgICB0aGlzLmNsYXNzTGlzdC5hZGQoXCJjb2RlY2hlY2stb3V0cHV0LXBhbmVcIik7XHJcbiAgICAgICAgdGhpcy5fbGlzdCA9IG5ldyBPdXRwdXRFbGVtZW50PE1vZGVscy5EaWFnbm9zdGljTG9jYXRpb24sIENvZGVDaGVja01lc3NhZ2VFbGVtZW50PigpO1xyXG4gICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQodGhpcy5fbGlzdCk7XHJcbiAgICAgICAgdGhpcy5fbGlzdC5nZXRLZXkgPSAoZXJyb3I6IE1vZGVscy5EaWFnbm9zdGljTG9jYXRpb24pID0+IHtcclxuICAgICAgICAgICAgcmV0dXJuIGBjb2RlLWNoZWNrLSR7ZXJyb3IuTG9nTGV2ZWx9LSR7ZXJyb3IuRmlsZU5hbWV9LSgke2Vycm9yLkxpbmV9LSR7ZXJyb3IuQ29sdW1ufSktKCR7ZXJyb3IuRW5kTGluZX0tJHtlcnJvci5FbmRDb2x1bW59KS0oJHsoZXJyb3IuUHJvamVjdHMgfHwgW10pLmpvaW4oXCItXCIpfSlgO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgdGhpcy5fbGlzdC5oYW5kbGVDbGljayA9IChpdGVtOiBNb2RlbHMuRGlhZ25vc3RpY0xvY2F0aW9uKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuZ29Ub0xpbmUoaXRlbSk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICB0aGlzLl9saXN0LmV2ZW50TmFtZSA9IFwiZGlhZ25vc3RpY1wiO1xyXG4gICAgICAgIHRoaXMuX2xpc3QuZWxlbWVudEZhY3RvcnkgPSBnZXRNZXNzYWdlRWxlbWVudDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgYXR0YWNoZWRDYWxsYmFjaygpIHtcclxuICAgICAgICB0aGlzLl9saXN0LmF0dGFjaGVkKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRldGFjaGVkQ2FsbGJhY2soKSB7XHJcbiAgICAgICAgdGhpcy5fbGlzdC5kZXRhY2hlZCgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB1cGRhdGUob3V0cHV0OiBNb2RlbHMuRGlhZ25vc3RpY0xvY2F0aW9uW10pIHtcclxuICAgICAgICB0aGlzLl9saXN0LnVwZGF0ZU91dHB1dChvdXRwdXQpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBuZXh0KCkge1xyXG4gICAgICAgIHRoaXMuX2xpc3QubmV4dCgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBwcmV2KCkge1xyXG4gICAgICAgIHRoaXMuX2xpc3QucHJldigpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgc2VsZWN0ZWRJbmRleCgpIHsgcmV0dXJuIHRoaXMuX2xpc3Quc2VsZWN0ZWRJbmRleDsgfVxyXG4gICAgcHVibGljIHNldCBzZWxlY3RlZEluZGV4KHZhbHVlKSB7IHRoaXMuX2xpc3Quc2VsZWN0ZWRJbmRleCA9IHZhbHVlOyB9XHJcbiAgICBwdWJsaWMgZ2V0IGN1cnJlbnQoKSB7IHJldHVybiB0aGlzLl9saXN0LmN1cnJlbnQ7IH1cclxuXHJcbiAgICBwcml2YXRlIGdvVG9MaW5lKGxvY2F0aW9uOiBNb2RlbHMuRGlhZ25vc3RpY0xvY2F0aW9uKSB7XHJcbiAgICAgICAgT21uaS5uYXZpZ2F0ZVRvKGxvY2F0aW9uKTtcclxuICAgIH1cclxufVxyXG5cclxuKDxhbnk+ZXhwb3J0cykuQ29kZUNoZWNrT3V0cHV0RWxlbWVudCA9ICg8YW55PmRvY3VtZW50KS5yZWdpc3RlckVsZW1lbnQoXCJvbW5pc2hhcnAtY29kZWNoZWNrLW91dHB1dFwiLCB7IHByb3RvdHlwZTogQ29kZUNoZWNrT3V0cHV0RWxlbWVudC5wcm90b3R5cGUgfSk7XHJcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
