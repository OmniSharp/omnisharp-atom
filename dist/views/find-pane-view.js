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
        var _Object$getPrototypeO;

        _classCallCheck(this, FindWindow);

        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
        }

        var _this = _possibleConstructorReturn(this, (_Object$getPrototypeO = Object.getPrototypeOf(FindWindow)).call.apply(_Object$getPrototypeO, [this].concat(args)));

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy9maW5kLXBhbmUtdmlldy5qcyIsImxpYi92aWV3cy9maW5kLXBhbmUtdmlldy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7QUFDQTs7SUNFWTs7QUREWjs7QUFDQTs7Ozs7Ozs7OztBQ01BLElBQU0sb0JBQW9CLFlBQUM7QUFDdkIsUUFBTSxnQkFBZ0I7QUFDbEIsYUFBSyxTQUFBLFFBQUEsR0FBQTtBQUFzQixtQkFBTyxLQUFLLFNBQUwsQ0FBZSxRQUFmLENBQXdCLFVBQXhCLENBQVAsQ0FBdEI7U0FBQTtBQUNMLGFBQUssU0FBQSxRQUFBLENBQWtCLEtBQWxCLEVBQWdDO0FBQUksZ0JBQUksS0FBSixFQUFXLEtBQUssU0FBTCxDQUFlLEdBQWYsQ0FBbUIsVUFBbkIsRUFBWCxLQUFnRCxLQUFLLFNBQUwsQ0FBZSxNQUFmLENBQXNCLFVBQXRCLEVBQWhEO1NBQXBDO0tBRkgsQ0FEaUI7QUFNdkIsUUFBTSxXQUFXO0FBQ2IsYUFBSyxTQUFBLEdBQUEsR0FBQTtBQUFpQixtQkFBTyxLQUFLLElBQUwsQ0FBeEI7U0FBQTtLQURILENBTmlCO0FBVXZCLFFBQU0sY0FBYztBQUNoQixhQUFLLFNBQUEsTUFBQSxHQUFBO0FBQW9CLG1CQUFPLEtBQUssT0FBTCxDQUEzQjtTQUFBO0FBQ0wsYUFBSyxTQUFBLE1BQUEsQ0FBZ0IsS0FBaEIsRUFBOEI7QUFDL0IsZ0JBQUksQ0FBQyxLQUFLLE9BQUwsSUFBZ0IsS0FBakIsRUFBd0I7QUFDeEIscUJBQUssS0FBTCxDQUFXLE9BQVgsR0FEd0I7YUFBNUI7QUFHQSxpQkFBSyxPQUFMLEdBQWUsS0FBZixDQUorQjtTQUE5QjtLQUZILENBVmlCO0FBb0J2QixhQUFBLFVBQUEsQ0FBb0IsR0FBcEIsRUFBaUMsSUFBakMsRUFBZ0U7QUFDNUQsYUFBSyxJQUFMLEdBQVksR0FBWixDQUQ0RDtBQUU1RCxhQUFLLE9BQUwsR0FBZSxLQUFmLENBRjREO0FBSTVELGFBQUssU0FBTCxDQUFl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QkFBSyxLQUFMLENBQVcsU0FBWCxHQUF1QixPQUF2QixDQVZrQjtBQVdsQixpQkFBSyxLQUFMLENBQVcsY0FBWCxHQUE0QixpQkFBNUIsQ0FYa0I7Ozs7MkNBY0M7QUFDbkIsaUJBQUssS0FBTCxDQUFXLFFBQVgsR0FEbUI7Ozs7MkNBSUE7QUFDbkIsaUJBQUssS0FBTCxDQUFXLFFBQVgsR0FEbUI7Ozs7K0JBSVQsUUFBeUI7QUFDbkMsaUJBQUssS0FBTCxDQUFXLFlBQVgsQ0FBd0IsTUFBeEIsRUFEbUM7Ozs7K0JBSTVCO0FBQ1AsaUJBQUssS0FBTCxDQUFXLElBQVgsR0FETzs7OzsrQkFJQTtBQUNQLGlCQUFLLEtBQUwsQ0FBVyxJQUFYLEdBRE87Ozs7a0NBUU8sVUFBeUI7QUFDdkMsdUJBQUssVUFBTCxDQUFnQixRQUFoQixFQUR1Qzs7Ozs0QkFKbkI7QUFBSyxtQkFBTyxLQUFLLEtBQUwsQ0FBVyxhQUFYLENBQVo7OzBCQUNDLE9BQUs7QUFBSSxpQkFBSyxLQUFMLENBQVcsYUFBWCxHQUEyQixLQUEzQixDQUFKOzs7OzRCQUNaO0FBQUssbUJBQU8sS0FBSyxLQUFMLENBQVcsT0FBWCxDQUFaOzs7OztFQXhDVTs7QUErQzFCLFFBQVMsVUFBVCxHQUE0QixTQUFVLGVBQVYsQ0FBMEIsdUJBQTFCLEVBQW1ELEVBQUUsV0FBVyxXQUFXLFNBQVgsRUFBaEUsQ0FBNUIiLCJmaWxlIjoibGliL3ZpZXdzL2ZpbmQtcGFuZS12aWV3LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgT21uaSB9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IHsgT3V0cHV0RWxlbWVudCB9IGZyb20gXCIuL291dHB1dC1jb21wb25lbnRcIjtcbmltcG9ydCB7IEhpZ2hsaWdodEVsZW1lbnQgfSBmcm9tIFwiLi9oaWdobGlnaHQtZWxlbWVudFwiO1xuY29uc3QgZ2V0TWVzc2FnZUVsZW1lbnQgPSAoZnVuY3Rpb24gKCkge1xuICAgIGNvbnN0IHNlbGVjdGVkUHJvcHMgPSB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gc2VsZWN0ZWQoKSB7IHJldHVybiB0aGlzLmNsYXNzTGlzdC5jb250YWlucyhcInNlbGVjdGVkXCIpOyB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uIHNlbGVjdGVkKHZhbHVlKSB7IGlmICh2YWx1ZSlcbiAgICAgICAgICAgIHRoaXMuY2xhc3NMaXN0LmFkZChcInNlbGVjdGVkXCIpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICB0aGlzLmNsYXNzTGlzdC5yZW1vdmUoXCJzZWxlY3RlZFwiKTsgfVxuICAgIH07XG4gICAgY29uc3Qga2V5UHJvcHMgPSB7XG4gICAgICAgIGdldDogZnVuY3Rpb24ga2V5KCkgeyByZXR1cm4gdGhpcy5fa2V5OyB9XG4gICAgfTtcbiAgICBjb25zdCBpbnZpZXdQcm9wcyA9IHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiBpbnZpZXcoKSB7IHJldHVybiB0aGlzLl9pbnZpZXc7IH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gaW52aWV3KHZhbHVlKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuX2ludmlldyAmJiB2YWx1ZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3RleHQuZW5oYW5jZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5faW52aWV3ID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIGZ1bmN0aW9uIHNldE1lc3NhZ2Uoa2V5LCBpdGVtKSB7XG4gICAgICAgIHRoaXMuX2tleSA9IGtleTtcbiAgICAgICAgdGhpcy5faW52aWV3ID0gZmFsc2U7XG4gICAgICAgIHRoaXMuY2xhc3NMaXN0LmFkZChpdGVtLkxvZ0xldmVsKTtcbiAgICAgICAgdGhpcy5fdXNhZ2UgPSBpdGVtO1xuICAgICAgICB0aGlzLl90ZXh0LnVzYWdlID0gaXRlbTtcbiAgICAgICAgdGhpcy5fbG9jYXRpb24uaW5uZXJUZXh0ID0gYCR7cGF0aC5iYXNlbmFtZShpdGVtLkZpbGVOYW1lKX0oJHtpdGVtLkxpbmV9LCR7aXRlbS5Db2x1bW59KWA7XG4gICAgICAgIHRoaXMuX2ZpbGVuYW1lLmlubmVyVGV4dCA9IHBhdGguZGlybmFtZShpdGVtLkZpbGVOYW1lKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gYXR0YWNoZWQoKSB7XG4gICAgICAgIHRoaXMuX3RleHQudXNhZ2UgPSB0aGlzLl91c2FnZTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZGV0YWNoZWQoKSB7IHRoaXMuX2ludmlldyA9IGZhbHNlOyB9XG4gICAgcmV0dXJuIGZ1bmN0aW9uIGdldE1lc3NhZ2VFbGVtZW50KCkge1xuICAgICAgICBjb25zdCBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImxpXCIpO1xuICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5hZGQoXCJmaW5kLXVzYWdlc1wiKTtcbiAgICAgICAgY29uc3QgdGV4dCA9IGVsZW1lbnQuX3RleHQgPSBuZXcgSGlnaGxpZ2h0RWxlbWVudCgpO1xuICAgICAgICB0ZXh0LmNsYXNzTGlzdC5hZGQoXCJ0ZXh0LWhpZ2hsaWdodFwiKTtcbiAgICAgICAgZWxlbWVudC5hcHBlbmRDaGlsZCh0ZXh0KTtcbiAgICAgICAgY29uc3QgbG9jYXRpb24gPSBlbGVtZW50Ll9sb2NhdGlvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJwcmVcIik7XG4gICAgICAgIGxvY2F0aW9uLmNsYXNzTGlzdC5hZGQoXCJpbmxpbmUtYmxvY2tcIik7XG4gICAgICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQobG9jYXRpb24pO1xuICAgICAgICBjb25zdCBmaWxlbmFtZSA9IGVsZW1lbnQuX2ZpbGVuYW1lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInByZVwiKTtcbiAgICAgICAgZmlsZW5hbWUuY2xhc3NMaXN0LmFkZChcInRleHQtc3VidGxlXCIsIFwiaW5saW5lLWJsb2NrXCIpO1xuICAgICAgICBlbGVtZW50LmFwcGVuZENoaWxkKGZpbGVuYW1lKTtcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGVsZW1lbnQsIFwia2V5XCIsIGtleVByb3BzKTtcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGVsZW1lbnQsIFwic2VsZWN0ZWRcIiwgc2VsZWN0ZWRQcm9wcyk7XG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShlbGVtZW50LCBcImludmlld1wiLCBpbnZpZXdQcm9wcyk7XG4gICAgICAgIGVsZW1lbnQuc2V0TWVzc2FnZSA9IHNldE1lc3NhZ2U7XG4gICAgICAgIGVsZW1lbnQuYXR0YWNoZWQgPSBhdHRhY2hlZDtcbiAgICAgICAgZWxlbWVudC5kZXRhY2hlZCA9IGRldGFjaGVkO1xuICAgICAgICByZXR1cm4gZWxlbWVudDtcbiAgICB9O1xufSkoKTtcbmV4cG9ydCBjbGFzcyBGaW5kV2luZG93IGV4dGVuZHMgSFRNTERpdkVsZW1lbnQge1xuICAgIGNvbnN0cnVjdG9yKC4uLmFyZ3MpIHtcbiAgICAgICAgc3VwZXIoLi4uYXJncyk7XG4gICAgICAgIHRoaXMuZGlzcGxheU5hbWUgPSBcIkZpbmRQYW5lV2luZG93XCI7XG4gICAgfVxuICAgIGNyZWF0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdGhpcy5jbGFzc0xpc3QuYWRkKFwiZmluZC1vdXRwdXQtcGFuZVwiKTtcbiAgICAgICAgdGhpcy5fbGlzdCA9IG5ldyBPdXRwdXRFbGVtZW50KCk7XG4gICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQodGhpcy5fbGlzdCk7XG4gICAgICAgIHRoaXMuX2xpc3QuZ2V0S2V5ID0gKHVzYWdlKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gYHF1aWNrLWZpeC0ke3VzYWdlLkZpbGVOYW1lfS0oJHt1c2FnZS5MaW5lfS0ke3VzYWdlLkNvbHVtbn0pLSgke3VzYWdlLkVuZExpbmV9LSR7dXNhZ2UuRW5kQ29sdW1ufSktKCR7dXNhZ2UuUHJvamVjdHMuam9pbihcIi1cIil9KWA7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuX2xpc3QuaGFuZGxlQ2xpY2sgPSAoaXRlbSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5nb3RvVXNhZ2UoaXRlbSk7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuX2xpc3QuZXZlbnROYW1lID0gXCJ1c2FnZVwiO1xuICAgICAgICB0aGlzLl9saXN0LmVsZW1lbnRGYWN0b3J5ID0gZ2V0TWVzc2FnZUVsZW1lbnQ7XG4gICAgfVxuICAgIGF0dGFjaGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMuX2xpc3QuYXR0YWNoZWQoKTtcbiAgICB9XG4gICAgZGV0YWNoZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdGhpcy5fbGlzdC5kZXRhY2hlZCgpO1xuICAgIH1cbiAgICB1cGRhdGUob3V0cHV0KSB7XG4gICAgICAgIHRoaXMuX2xpc3QudXBkYXRlT3V0cHV0KG91dHB1dCk7XG4gICAgfVxuICAgIG5leHQoKSB7XG4gICAgICAgIHRoaXMuX2xpc3QubmV4dCgpO1xuICAgIH1cbiAgICBwcmV2KCkge1xuICAgICAgICB0aGlzLl9saXN0LnByZXYoKTtcbiAgICB9XG4gICAgZ2V0IHNlbGVjdGVkSW5kZXgoKSB7IHJldHVybiB0aGlzLl9saXN0LnNlbGVjdGVkSW5kZXg7IH1cbiAgICBzZXQgc2VsZWN0ZWRJbmRleCh2YWx1ZSkgeyB0aGlzLl9saXN0LnNlbGVjdGVkSW5kZXggPSB2YWx1ZTsgfVxuICAgIGdldCBjdXJyZW50KCkgeyByZXR1cm4gdGhpcy5fbGlzdC5jdXJyZW50OyB9XG4gICAgZ290b1VzYWdlKHF1aWNrZml4KSB7XG4gICAgICAgIE9tbmkubmF2aWdhdGVUbyhxdWlja2ZpeCk7XG4gICAgfVxufVxuZXhwb3J0cy5GaW5kV2luZG93ID0gZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50KFwib21uaXNoYXJwLWZpbmQtd2luZG93XCIsIHsgcHJvdG90eXBlOiBGaW5kV2luZG93LnByb3RvdHlwZSB9KTtcbiIsIi8qIHRzbGludDpkaXNhYmxlOm5vLXN0cmluZy1saXRlcmFsICovXHJcbmltcG9ydCB7TW9kZWxzfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xyXG5pbXBvcnQge09tbml9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xyXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gXCJwYXRoXCI7XHJcbmltcG9ydCB7T3V0cHV0RWxlbWVudCwgTWVzc2FnZUVsZW1lbnR9IGZyb20gXCIuL291dHB1dC1jb21wb25lbnRcIjtcclxuaW1wb3J0IHtIaWdobGlnaHRFbGVtZW50fSBmcm9tIFwiLi9oaWdobGlnaHQtZWxlbWVudFwiO1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBGaW5kTWVzc2FnZUVsZW1lbnQgZXh0ZW5kcyBNZXNzYWdlRWxlbWVudDxNb2RlbHMuRGlhZ25vc3RpY0xvY2F0aW9uPiB7IH1cclxuXHJcbmNvbnN0IGdldE1lc3NhZ2VFbGVtZW50ID0gKGZ1bmN0aW9uKCkge1xyXG4gICAgY29uc3Qgc2VsZWN0ZWRQcm9wcyA9IHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uIHNlbGVjdGVkKCkgeyByZXR1cm4gdGhpcy5jbGFzc0xpc3QuY29udGFpbnMoXCJzZWxlY3RlZFwiKTsgfSxcclxuICAgICAgICBzZXQ6IGZ1bmN0aW9uIHNlbGVjdGVkKHZhbHVlOiBib29sZWFuKSB7IGlmICh2YWx1ZSkgdGhpcy5jbGFzc0xpc3QuYWRkKFwic2VsZWN0ZWRcIik7IGVsc2UgdGhpcy5jbGFzc0xpc3QucmVtb3ZlKFwic2VsZWN0ZWRcIik7IH1cclxuICAgIH07XHJcblxyXG4gICAgY29uc3Qga2V5UHJvcHMgPSB7XHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiBrZXkoKSB7IHJldHVybiB0aGlzLl9rZXk7IH1cclxuICAgIH07XHJcblxyXG4gICAgY29uc3QgaW52aWV3UHJvcHMgPSB7XHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiBpbnZpZXcoKSB7IHJldHVybiB0aGlzLl9pbnZpZXc7IH0sXHJcbiAgICAgICAgc2V0OiBmdW5jdGlvbiBpbnZpZXcodmFsdWU6IGJvb2xlYW4pIHtcclxuICAgICAgICAgICAgaWYgKCF0aGlzLl9pbnZpZXcgJiYgdmFsdWUpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX3RleHQuZW5oYW5jZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuX2ludmlldyA9IHZhbHVlO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgZnVuY3Rpb24gc2V0TWVzc2FnZShrZXk6IHN0cmluZywgaXRlbTogTW9kZWxzLkRpYWdub3N0aWNMb2NhdGlvbikge1xyXG4gICAgICAgIHRoaXMuX2tleSA9IGtleTtcclxuICAgICAgICB0aGlzLl9pbnZpZXcgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgdGhpcy5jbGFzc0xpc3QuYWRkKGl0ZW0uTG9nTGV2ZWwpO1xyXG4gICAgICAgIHRoaXMuX3VzYWdlID0gaXRlbTtcclxuICAgICAgICB0aGlzLl90ZXh0LnVzYWdlID0gaXRlbTtcclxuICAgICAgICB0aGlzLl9sb2NhdGlvbi5pbm5lclRleHQgPSBgJHtwYXRoLmJhc2VuYW1lKGl0ZW0uRmlsZU5hbWUpfSgke2l0ZW0uTGluZX0sJHtpdGVtLkNvbHVtbn0pYDtcclxuICAgICAgICB0aGlzLl9maWxlbmFtZS5pbm5lclRleHQgPSBwYXRoLmRpcm5hbWUoaXRlbS5GaWxlTmFtZSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gYXR0YWNoZWQoKSB7XHJcbiAgICAgICAgdGhpcy5fdGV4dC51c2FnZSA9IHRoaXMuX3VzYWdlO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGRldGFjaGVkKCkgeyB0aGlzLl9pbnZpZXcgPSBmYWxzZTsgfVxyXG5cclxuICAgIHJldHVybiBmdW5jdGlvbiBnZXRNZXNzYWdlRWxlbWVudCgpOiBGaW5kTWVzc2FnZUVsZW1lbnQge1xyXG4gICAgICAgIGNvbnN0IGVsZW1lbnQ6IEZpbmRNZXNzYWdlRWxlbWVudCA9IDxhbnk+ZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImxpXCIpO1xyXG4gICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZChcImZpbmQtdXNhZ2VzXCIpO1xyXG5cclxuICAgICAgICBjb25zdCB0ZXh0ID0gKGVsZW1lbnQgYXMgYW55KS5fdGV4dCA9IG5ldyBIaWdobGlnaHRFbGVtZW50KCk7XHJcbiAgICAgICAgdGV4dC5jbGFzc0xpc3QuYWRkKFwidGV4dC1oaWdobGlnaHRcIik7XHJcbiAgICAgICAgZWxlbWVudC5hcHBlbmRDaGlsZCh0ZXh0KTtcclxuXHJcbiAgICAgICAgY29uc3QgbG9jYXRpb24gPSAoZWxlbWVudCBhcyBhbnkpLl9sb2NhdGlvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJwcmVcIik7XHJcbiAgICAgICAgbG9jYXRpb24uY2xhc3NMaXN0LmFkZChcImlubGluZS1ibG9ja1wiKTtcclxuICAgICAgICBlbGVtZW50LmFwcGVuZENoaWxkKGxvY2F0aW9uKTtcclxuXHJcbiAgICAgICAgY29uc3QgZmlsZW5hbWUgPSAoZWxlbWVudCBhcyBhbnkpLl9maWxlbmFtZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJwcmVcIik7XHJcbiAgICAgICAgZmlsZW5hbWUuY2xhc3NMaXN0LmFkZChcInRleHQtc3VidGxlXCIsIFwiaW5saW5lLWJsb2NrXCIpO1xyXG4gICAgICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQoZmlsZW5hbWUpO1xyXG5cclxuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZWxlbWVudCwgXCJrZXlcIiwga2V5UHJvcHMpO1xyXG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShlbGVtZW50LCBcInNlbGVjdGVkXCIsIHNlbGVjdGVkUHJvcHMpO1xyXG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShlbGVtZW50LCBcImludmlld1wiLCBpbnZpZXdQcm9wcyk7XHJcbiAgICAgICAgZWxlbWVudC5zZXRNZXNzYWdlID0gc2V0TWVzc2FnZTtcclxuICAgICAgICBlbGVtZW50LmF0dGFjaGVkID0gYXR0YWNoZWQ7XHJcbiAgICAgICAgZWxlbWVudC5kZXRhY2hlZCA9IGRldGFjaGVkO1xyXG5cclxuICAgICAgICByZXR1cm4gZWxlbWVudDtcclxuICAgIH07XHJcbn0pKCk7XHJcblxyXG5leHBvcnQgY2xhc3MgRmluZFdpbmRvdyBleHRlbmRzIEhUTUxEaXZFbGVtZW50IGltcGxlbWVudHMgV2ViQ29tcG9uZW50IHtcclxuICAgIHB1YmxpYyBkaXNwbGF5TmFtZSA9IFwiRmluZFBhbmVXaW5kb3dcIjtcclxuICAgIHByaXZhdGUgX2xpc3Q6IE91dHB1dEVsZW1lbnQ8TW9kZWxzLlF1aWNrRml4LCBGaW5kTWVzc2FnZUVsZW1lbnQ+O1xyXG5cclxuICAgIHB1YmxpYyBjcmVhdGVkQ2FsbGJhY2soKSB7XHJcbiAgICAgICAgdGhpcy5jbGFzc0xpc3QuYWRkKFwiZmluZC1vdXRwdXQtcGFuZVwiKTtcclxuICAgICAgICB0aGlzLl9saXN0ID0gbmV3IE91dHB1dEVsZW1lbnQ8TW9kZWxzLlF1aWNrRml4LCBGaW5kTWVzc2FnZUVsZW1lbnQ+KCk7XHJcbiAgICAgICAgdGhpcy5hcHBlbmRDaGlsZCh0aGlzLl9saXN0KTtcclxuICAgICAgICB0aGlzLl9saXN0LmdldEtleSA9ICh1c2FnZTogTW9kZWxzLlF1aWNrRml4KSA9PiB7XHJcbiAgICAgICAgICAgIHJldHVybiBgcXVpY2stZml4LSR7dXNhZ2UuRmlsZU5hbWV9LSgke3VzYWdlLkxpbmV9LSR7dXNhZ2UuQ29sdW1ufSktKCR7dXNhZ2UuRW5kTGluZX0tJHt1c2FnZS5FbmRDb2x1bW59KS0oJHt1c2FnZS5Qcm9qZWN0cy5qb2luKFwiLVwiKX0pYDtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHRoaXMuX2xpc3QuaGFuZGxlQ2xpY2sgPSAoaXRlbTogTW9kZWxzLlF1aWNrRml4KSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuZ290b1VzYWdlKGl0ZW0pO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgdGhpcy5fbGlzdC5ldmVudE5hbWUgPSBcInVzYWdlXCI7XHJcbiAgICAgICAgdGhpcy5fbGlzdC5lbGVtZW50RmFjdG9yeSA9IGdldE1lc3NhZ2VFbGVtZW50O1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBhdHRhY2hlZENhbGxiYWNrKCkge1xyXG4gICAgICAgIHRoaXMuX2xpc3QuYXR0YWNoZWQoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGV0YWNoZWRDYWxsYmFjaygpIHtcclxuICAgICAgICB0aGlzLl9saXN0LmRldGFjaGVkKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHVwZGF0ZShvdXRwdXQ6IE1vZGVscy5RdWlja0ZpeFtdKSB7XHJcbiAgICAgICAgdGhpcy5fbGlzdC51cGRhdGVPdXRwdXQob3V0cHV0KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgbmV4dCgpIHtcclxuICAgICAgICB0aGlzLl9saXN0Lm5leHQoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcHJldigpIHtcclxuICAgICAgICB0aGlzLl9saXN0LnByZXYoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0IHNlbGVjdGVkSW5kZXgoKSB7IHJldHVybiB0aGlzLl9saXN0LnNlbGVjdGVkSW5kZXg7IH1cclxuICAgIHB1YmxpYyBzZXQgc2VsZWN0ZWRJbmRleCh2YWx1ZSkgeyB0aGlzLl9saXN0LnNlbGVjdGVkSW5kZXggPSB2YWx1ZTsgfVxyXG4gICAgcHVibGljIGdldCBjdXJyZW50KCkgeyByZXR1cm4gdGhpcy5fbGlzdC5jdXJyZW50OyB9XHJcblxyXG4gICAgcHJpdmF0ZSBnb3RvVXNhZ2UocXVpY2tmaXg6IE1vZGVscy5RdWlja0ZpeCkge1xyXG4gICAgICAgIE9tbmkubmF2aWdhdGVUbyhxdWlja2ZpeCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbig8YW55PmV4cG9ydHMpLkZpbmRXaW5kb3cgPSAoPGFueT5kb2N1bWVudCkucmVnaXN0ZXJFbGVtZW50KFwib21uaXNoYXJwLWZpbmQtd2luZG93XCIsIHsgcHJvdG90eXBlOiBGaW5kV2luZG93LnByb3RvdHlwZSB9KTtcclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
