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
        _classCallCheck(this, FindWindow);

        var _this = _possibleConstructorReturn(this, (FindWindow.__proto__ || Object.getPrototypeOf(FindWindow)).apply(this, arguments));

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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy9maW5kLXBhbmUtdmlldy5qcyIsImxpYi92aWV3cy9maW5kLXBhbmUtdmlldy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7QUFDQTs7SUNFWTs7QUREWjs7QUFDQTs7Ozs7Ozs7OztBQ01BLElBQU0sb0JBQW9CLFlBQUM7QUFDdkIsUUFBTSxnQkFBZ0I7QUFDbEIsYUFBSyxTQUFBLFFBQUEsR0FBQTtBQUFzQixtQkFBTyxLQUFLLFNBQUwsQ0FBZSxRQUFmLENBQXdCLFVBQXhCLENBQVAsQ0FBdEI7U0FBQTtBQUNMLGFBQUssU0FBQSxRQUFBLENBQWtCLEtBQWxCLEVBQWdDO0FBQUksZ0JBQUksS0FBSixFQUFXLEtBQUssU0FBTCxDQUFlLEdBQWYsQ0FBbUIsVUFBbkIsRUFBWCxLQUFnRCxLQUFLLFNBQUwsQ0FBZSxNQUFmLENBQXNCLFVBQXRCLEVBQWhEO1NBQXBDO0tBRkgsQ0FEaUI7QUFNdkIsUUFBTSxXQUFXO0FBQ2IsYUFBSyxTQUFBLEdBQUEsR0FBQTtBQUFpQixtQkFBTyxLQUFLLElBQUwsQ0FBeEI7U0FBQTtLQURILENBTmlCO0FBVXZCLFFBQU0sY0FBYztBQUNoQixhQUFLLFNBQUEsTUFBQSxHQUFBO0FBQW9CLG1CQUFPLEtBQUssT0FBTCxDQUEzQjtTQUFBO0FBQ0wsYUFBSyxTQUFBLE1BQUEsQ0FBZ0IsS0FBaEIsRUFBOEI7QUFDL0IsZ0JBQUksQ0FBQyxLQUFLLE9BQUwsSUFBZ0IsS0FBakIsRUFBd0I7QUFDeEIscUJBQUssS0FBTCxDQUFXLE9BQVgsR0FEd0I7YUFBNUI7QUFHQSxpQkFBSyxPQUFMLEdBQWUsS0FBZixDQUorQjtTQUE5QjtLQUZILENBVmlCO0FBb0J2QixhQUFBLFVBQUEsQ0FBb0IsR0FBcEIsRUFBaUMsSUFBakMsRUFBZ0U7QUFDNUQsYUFBSyxJQUFMLEdBQVksR0FBWixDQUQ0RDtBQUU1RCxhQUFLLE9BQUwsR0FBZSxLQUFmLENBRjREO0FBSTVELGFBQUssU0FBTCxDQUFl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U0FBWCxHQUF1QixPQUF2QixDQVZrQjtBQVdsQixpQkFBSyxLQUFMLENBQVcsY0FBWCxHQUE0QixpQkFBNUIsQ0FYa0I7Ozs7MkNBY0M7QUFDbkIsaUJBQUssS0FBTCxDQUFXLFFBQVgsR0FEbUI7Ozs7MkNBSUE7QUFDbkIsaUJBQUssS0FBTCxDQUFXLFFBQVgsR0FEbUI7Ozs7K0JBSVQsUUFBeUI7QUFDbkMsaUJBQUssS0FBTCxDQUFXLFlBQVgsQ0FBd0IsTUFBeEIsRUFEbUM7Ozs7K0JBSTVCO0FBQ1AsaUJBQUssS0FBTCxDQUFXLElBQVgsR0FETzs7OzsrQkFJQTtBQUNQLGlCQUFLLEtBQUwsQ0FBVyxJQUFYLEdBRE87Ozs7a0NBUU8sVUFBeUI7QUFDdkMsdUJBQUssVUFBTCxDQUFnQixRQUFoQixFQUR1Qzs7Ozs0QkFKbkI7QUFBSyxtQkFBTyxLQUFLLEtBQUwsQ0FBVyxhQUFYLENBQVo7OzBCQUNDLE9BQUs7QUFBSSxpQkFBSyxLQUFMLENBQVcsYUFBWCxHQUEyQixLQUEzQixDQUFKOzs7OzRCQUNaO0FBQUssbUJBQU8sS0FBSyxLQUFMLENBQVcsT0FBWCxDQUFaOzs7OztFQXhDVTs7QUErQzFCLFFBQVMsVUFBVCxHQUE0QixTQUFVLGVBQVYsQ0FBMEIsdUJBQTFCLEVBQW1ELEVBQUUsV0FBVyxXQUFXLFNBQVgsRUFBaEUsQ0FBNUIiLCJmaWxlIjoibGliL3ZpZXdzL2ZpbmQtcGFuZS12aWV3LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgT21uaSB9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IHsgT3V0cHV0RWxlbWVudCB9IGZyb20gXCIuL291dHB1dC1jb21wb25lbnRcIjtcbmltcG9ydCB7IEhpZ2hsaWdodEVsZW1lbnQgfSBmcm9tIFwiLi9oaWdobGlnaHQtZWxlbWVudFwiO1xuY29uc3QgZ2V0TWVzc2FnZUVsZW1lbnQgPSAoZnVuY3Rpb24gKCkge1xuICAgIGNvbnN0IHNlbGVjdGVkUHJvcHMgPSB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gc2VsZWN0ZWQoKSB7IHJldHVybiB0aGlzLmNsYXNzTGlzdC5jb250YWlucyhcInNlbGVjdGVkXCIpOyB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uIHNlbGVjdGVkKHZhbHVlKSB7IGlmICh2YWx1ZSlcbiAgICAgICAgICAgIHRoaXMuY2xhc3NMaXN0LmFkZChcInNlbGVjdGVkXCIpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICB0aGlzLmNsYXNzTGlzdC5yZW1vdmUoXCJzZWxlY3RlZFwiKTsgfVxuICAgIH07XG4gICAgY29uc3Qga2V5UHJvcHMgPSB7XG4gICAgICAgIGdldDogZnVuY3Rpb24ga2V5KCkgeyByZXR1cm4gdGhpcy5fa2V5OyB9XG4gICAgfTtcbiAgICBjb25zdCBpbnZpZXdQcm9wcyA9IHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiBpbnZpZXcoKSB7IHJldHVybiB0aGlzLl9pbnZpZXc7IH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gaW52aWV3KHZhbHVlKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuX2ludmlldyAmJiB2YWx1ZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3RleHQuZW5oYW5jZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5faW52aWV3ID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIGZ1bmN0aW9uIHNldE1lc3NhZ2Uoa2V5LCBpdGVtKSB7XG4gICAgICAgIHRoaXMuX2tleSA9IGtleTtcbiAgICAgICAgdGhpcy5faW52aWV3ID0gZmFsc2U7XG4gICAgICAgIHRoaXMuY2xhc3NMaXN0LmFkZChpdGVtLkxvZ0xldmVsKTtcbiAgICAgICAgdGhpcy5fdXNhZ2UgPSBpdGVtO1xuICAgICAgICB0aGlzLl90ZXh0LnVzYWdlID0gaXRlbTtcbiAgICAgICAgdGhpcy5fbG9jYXRpb24uaW5uZXJUZXh0ID0gYCR7cGF0aC5iYXNlbmFtZShpdGVtLkZpbGVOYW1lKX0oJHtpdGVtLkxpbmV9LCR7aXRlbS5Db2x1bW59KWA7XG4gICAgICAgIHRoaXMuX2ZpbGVuYW1lLmlubmVyVGV4dCA9IHBhdGguZGlybmFtZShpdGVtLkZpbGVOYW1lKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gYXR0YWNoZWQoKSB7XG4gICAgICAgIHRoaXMuX3RleHQudXNhZ2UgPSB0aGlzLl91c2FnZTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZGV0YWNoZWQoKSB7IHRoaXMuX2ludmlldyA9IGZhbHNlOyB9XG4gICAgcmV0dXJuIGZ1bmN0aW9uIGdldE1lc3NhZ2VFbGVtZW50KCkge1xuICAgICAgICBjb25zdCBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImxpXCIpO1xuICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5hZGQoXCJmaW5kLXVzYWdlc1wiKTtcbiAgICAgICAgY29uc3QgdGV4dCA9IGVsZW1lbnQuX3RleHQgPSBuZXcgSGlnaGxpZ2h0RWxlbWVudCgpO1xuICAgICAgICB0ZXh0LmNsYXNzTGlzdC5hZGQoXCJ0ZXh0LWhpZ2hsaWdodFwiKTtcbiAgICAgICAgZWxlbWVudC5hcHBlbmRDaGlsZCh0ZXh0KTtcbiAgICAgICAgY29uc3QgbG9jYXRpb24gPSBlbGVtZW50Ll9sb2NhdGlvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJwcmVcIik7XG4gICAgICAgIGxvY2F0aW9uLmNsYXNzTGlzdC5hZGQoXCJpbmxpbmUtYmxvY2tcIik7XG4gICAgICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQobG9jYXRpb24pO1xuICAgICAgICBjb25zdCBmaWxlbmFtZSA9IGVsZW1lbnQuX2ZpbGVuYW1lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInByZVwiKTtcbiAgICAgICAgZmlsZW5hbWUuY2xhc3NMaXN0LmFkZChcInRleHQtc3VidGxlXCIsIFwiaW5saW5lLWJsb2NrXCIpO1xuICAgICAgICBlbGVtZW50LmFwcGVuZENoaWxkKGZpbGVuYW1lKTtcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGVsZW1lbnQsIFwia2V5XCIsIGtleVByb3BzKTtcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGVsZW1lbnQsIFwic2VsZWN0ZWRcIiwgc2VsZWN0ZWRQcm9wcyk7XG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShlbGVtZW50LCBcImludmlld1wiLCBpbnZpZXdQcm9wcyk7XG4gICAgICAgIGVsZW1lbnQuc2V0TWVzc2FnZSA9IHNldE1lc3NhZ2U7XG4gICAgICAgIGVsZW1lbnQuYXR0YWNoZWQgPSBhdHRhY2hlZDtcbiAgICAgICAgZWxlbWVudC5kZXRhY2hlZCA9IGRldGFjaGVkO1xuICAgICAgICByZXR1cm4gZWxlbWVudDtcbiAgICB9O1xufSkoKTtcbmV4cG9ydCBjbGFzcyBGaW5kV2luZG93IGV4dGVuZHMgSFRNTERpdkVsZW1lbnQge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlciguLi5hcmd1bWVudHMpO1xuICAgICAgICB0aGlzLmRpc3BsYXlOYW1lID0gXCJGaW5kUGFuZVdpbmRvd1wiO1xuICAgIH1cbiAgICBjcmVhdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMuY2xhc3NMaXN0LmFkZChcImZpbmQtb3V0cHV0LXBhbmVcIik7XG4gICAgICAgIHRoaXMuX2xpc3QgPSBuZXcgT3V0cHV0RWxlbWVudCgpO1xuICAgICAgICB0aGlzLmFwcGVuZENoaWxkKHRoaXMuX2xpc3QpO1xuICAgICAgICB0aGlzLl9saXN0LmdldEtleSA9ICh1c2FnZSkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGBxdWljay1maXgtJHt1c2FnZS5GaWxlTmFtZX0tKCR7dXNhZ2UuTGluZX0tJHt1c2FnZS5Db2x1bW59KS0oJHt1c2FnZS5FbmRMaW5lfS0ke3VzYWdlLkVuZENvbHVtbn0pLSgke3VzYWdlLlByb2plY3RzLmpvaW4oXCItXCIpfSlgO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLl9saXN0LmhhbmRsZUNsaWNrID0gKGl0ZW0pID0+IHtcbiAgICAgICAgICAgIHRoaXMuZ290b1VzYWdlKGl0ZW0pO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLl9saXN0LmV2ZW50TmFtZSA9IFwidXNhZ2VcIjtcbiAgICAgICAgdGhpcy5fbGlzdC5lbGVtZW50RmFjdG9yeSA9IGdldE1lc3NhZ2VFbGVtZW50O1xuICAgIH1cbiAgICBhdHRhY2hlZENhbGxiYWNrKCkge1xuICAgICAgICB0aGlzLl9saXN0LmF0dGFjaGVkKCk7XG4gICAgfVxuICAgIGRldGFjaGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMuX2xpc3QuZGV0YWNoZWQoKTtcbiAgICB9XG4gICAgdXBkYXRlKG91dHB1dCkge1xuICAgICAgICB0aGlzLl9saXN0LnVwZGF0ZU91dHB1dChvdXRwdXQpO1xuICAgIH1cbiAgICBuZXh0KCkge1xuICAgICAgICB0aGlzLl9saXN0Lm5leHQoKTtcbiAgICB9XG4gICAgcHJldigpIHtcbiAgICAgICAgdGhpcy5fbGlzdC5wcmV2KCk7XG4gICAgfVxuICAgIGdldCBzZWxlY3RlZEluZGV4KCkgeyByZXR1cm4gdGhpcy5fbGlzdC5zZWxlY3RlZEluZGV4OyB9XG4gICAgc2V0IHNlbGVjdGVkSW5kZXgodmFsdWUpIHsgdGhpcy5fbGlzdC5zZWxlY3RlZEluZGV4ID0gdmFsdWU7IH1cbiAgICBnZXQgY3VycmVudCgpIHsgcmV0dXJuIHRoaXMuX2xpc3QuY3VycmVudDsgfVxuICAgIGdvdG9Vc2FnZShxdWlja2ZpeCkge1xuICAgICAgICBPbW5pLm5hdmlnYXRlVG8ocXVpY2tmaXgpO1xuICAgIH1cbn1cbmV4cG9ydHMuRmluZFdpbmRvdyA9IGRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudChcIm9tbmlzaGFycC1maW5kLXdpbmRvd1wiLCB7IHByb3RvdHlwZTogRmluZFdpbmRvdy5wcm90b3R5cGUgfSk7XG4iLCIvKiB0c2xpbnQ6ZGlzYWJsZTpuby1zdHJpbmctbGl0ZXJhbCAqL1xyXG5pbXBvcnQge01vZGVsc30gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcclxuaW1wb3J0IHtPbW5pfSBmcm9tIFwiLi4vc2VydmVyL29tbmlcIjtcclxuaW1wb3J0ICogYXMgcGF0aCBmcm9tIFwicGF0aFwiO1xyXG5pbXBvcnQge091dHB1dEVsZW1lbnQsIE1lc3NhZ2VFbGVtZW50fSBmcm9tIFwiLi9vdXRwdXQtY29tcG9uZW50XCI7XHJcbmltcG9ydCB7SGlnaGxpZ2h0RWxlbWVudH0gZnJvbSBcIi4vaGlnaGxpZ2h0LWVsZW1lbnRcIjtcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgRmluZE1lc3NhZ2VFbGVtZW50IGV4dGVuZHMgTWVzc2FnZUVsZW1lbnQ8TW9kZWxzLkRpYWdub3N0aWNMb2NhdGlvbj4geyB9XHJcblxyXG5jb25zdCBnZXRNZXNzYWdlRWxlbWVudCA9IChmdW5jdGlvbigpIHtcclxuICAgIGNvbnN0IHNlbGVjdGVkUHJvcHMgPSB7XHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiBzZWxlY3RlZCgpIHsgcmV0dXJuIHRoaXMuY2xhc3NMaXN0LmNvbnRhaW5zKFwic2VsZWN0ZWRcIik7IH0sXHJcbiAgICAgICAgc2V0OiBmdW5jdGlvbiBzZWxlY3RlZCh2YWx1ZTogYm9vbGVhbikgeyBpZiAodmFsdWUpIHRoaXMuY2xhc3NMaXN0LmFkZChcInNlbGVjdGVkXCIpOyBlbHNlIHRoaXMuY2xhc3NMaXN0LnJlbW92ZShcInNlbGVjdGVkXCIpOyB9XHJcbiAgICB9O1xyXG5cclxuICAgIGNvbnN0IGtleVByb3BzID0ge1xyXG4gICAgICAgIGdldDogZnVuY3Rpb24ga2V5KCkgeyByZXR1cm4gdGhpcy5fa2V5OyB9XHJcbiAgICB9O1xyXG5cclxuICAgIGNvbnN0IGludmlld1Byb3BzID0ge1xyXG4gICAgICAgIGdldDogZnVuY3Rpb24gaW52aWV3KCkgeyByZXR1cm4gdGhpcy5faW52aWV3OyB9LFxyXG4gICAgICAgIHNldDogZnVuY3Rpb24gaW52aWV3KHZhbHVlOiBib29sZWFuKSB7XHJcbiAgICAgICAgICAgIGlmICghdGhpcy5faW52aWV3ICYmIHZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl90ZXh0LmVuaGFuY2UoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLl9pbnZpZXcgPSB2YWx1ZTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIGZ1bmN0aW9uIHNldE1lc3NhZ2Uoa2V5OiBzdHJpbmcsIGl0ZW06IE1vZGVscy5EaWFnbm9zdGljTG9jYXRpb24pIHtcclxuICAgICAgICB0aGlzLl9rZXkgPSBrZXk7XHJcbiAgICAgICAgdGhpcy5faW52aWV3ID0gZmFsc2U7XHJcblxyXG4gICAgICAgIHRoaXMuY2xhc3NMaXN0LmFkZChpdGVtLkxvZ0xldmVsKTtcclxuICAgICAgICB0aGlzLl91c2FnZSA9IGl0ZW07XHJcbiAgICAgICAgdGhpcy5fdGV4dC51c2FnZSA9IGl0ZW07XHJcbiAgICAgICAgdGhpcy5fbG9jYXRpb24uaW5uZXJUZXh0ID0gYCR7cGF0aC5iYXNlbmFtZShpdGVtLkZpbGVOYW1lKX0oJHtpdGVtLkxpbmV9LCR7aXRlbS5Db2x1bW59KWA7XHJcbiAgICAgICAgdGhpcy5fZmlsZW5hbWUuaW5uZXJUZXh0ID0gcGF0aC5kaXJuYW1lKGl0ZW0uRmlsZU5hbWUpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGF0dGFjaGVkKCkge1xyXG4gICAgICAgIHRoaXMuX3RleHQudXNhZ2UgPSB0aGlzLl91c2FnZTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBkZXRhY2hlZCgpIHsgdGhpcy5faW52aWV3ID0gZmFsc2U7IH1cclxuXHJcbiAgICByZXR1cm4gZnVuY3Rpb24gZ2V0TWVzc2FnZUVsZW1lbnQoKTogRmluZE1lc3NhZ2VFbGVtZW50IHtcclxuICAgICAgICBjb25zdCBlbGVtZW50OiBGaW5kTWVzc2FnZUVsZW1lbnQgPSA8YW55PmRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJsaVwiKTtcclxuICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5hZGQoXCJmaW5kLXVzYWdlc1wiKTtcclxuXHJcbiAgICAgICAgY29uc3QgdGV4dCA9IChlbGVtZW50IGFzIGFueSkuX3RleHQgPSBuZXcgSGlnaGxpZ2h0RWxlbWVudCgpO1xyXG4gICAgICAgIHRleHQuY2xhc3NMaXN0LmFkZChcInRleHQtaGlnaGxpZ2h0XCIpO1xyXG4gICAgICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQodGV4dCk7XHJcblxyXG4gICAgICAgIGNvbnN0IGxvY2F0aW9uID0gKGVsZW1lbnQgYXMgYW55KS5fbG9jYXRpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwicHJlXCIpO1xyXG4gICAgICAgIGxvY2F0aW9uLmNsYXNzTGlzdC5hZGQoXCJpbmxpbmUtYmxvY2tcIik7XHJcbiAgICAgICAgZWxlbWVudC5hcHBlbmRDaGlsZChsb2NhdGlvbik7XHJcblxyXG4gICAgICAgIGNvbnN0IGZpbGVuYW1lID0gKGVsZW1lbnQgYXMgYW55KS5fZmlsZW5hbWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwicHJlXCIpO1xyXG4gICAgICAgIGZpbGVuYW1lLmNsYXNzTGlzdC5hZGQoXCJ0ZXh0LXN1YnRsZVwiLCBcImlubGluZS1ibG9ja1wiKTtcclxuICAgICAgICBlbGVtZW50LmFwcGVuZENoaWxkKGZpbGVuYW1lKTtcclxuXHJcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGVsZW1lbnQsIFwia2V5XCIsIGtleVByb3BzKTtcclxuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZWxlbWVudCwgXCJzZWxlY3RlZFwiLCBzZWxlY3RlZFByb3BzKTtcclxuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZWxlbWVudCwgXCJpbnZpZXdcIiwgaW52aWV3UHJvcHMpO1xyXG4gICAgICAgIGVsZW1lbnQuc2V0TWVzc2FnZSA9IHNldE1lc3NhZ2U7XHJcbiAgICAgICAgZWxlbWVudC5hdHRhY2hlZCA9IGF0dGFjaGVkO1xyXG4gICAgICAgIGVsZW1lbnQuZGV0YWNoZWQgPSBkZXRhY2hlZDtcclxuXHJcbiAgICAgICAgcmV0dXJuIGVsZW1lbnQ7XHJcbiAgICB9O1xyXG59KSgpO1xyXG5cclxuZXhwb3J0IGNsYXNzIEZpbmRXaW5kb3cgZXh0ZW5kcyBIVE1MRGl2RWxlbWVudCBpbXBsZW1lbnRzIFdlYkNvbXBvbmVudCB7XHJcbiAgICBwdWJsaWMgZGlzcGxheU5hbWUgPSBcIkZpbmRQYW5lV2luZG93XCI7XHJcbiAgICBwcml2YXRlIF9saXN0OiBPdXRwdXRFbGVtZW50PE1vZGVscy5RdWlja0ZpeCwgRmluZE1lc3NhZ2VFbGVtZW50PjtcclxuXHJcbiAgICBwdWJsaWMgY3JlYXRlZENhbGxiYWNrKCkge1xyXG4gICAgICAgIHRoaXMuY2xhc3NMaXN0LmFkZChcImZpbmQtb3V0cHV0LXBhbmVcIik7XHJcbiAgICAgICAgdGhpcy5fbGlzdCA9IG5ldyBPdXRwdXRFbGVtZW50PE1vZGVscy5RdWlja0ZpeCwgRmluZE1lc3NhZ2VFbGVtZW50PigpO1xyXG4gICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQodGhpcy5fbGlzdCk7XHJcbiAgICAgICAgdGhpcy5fbGlzdC5nZXRLZXkgPSAodXNhZ2U6IE1vZGVscy5RdWlja0ZpeCkgPT4ge1xyXG4gICAgICAgICAgICByZXR1cm4gYHF1aWNrLWZpeC0ke3VzYWdlLkZpbGVOYW1lfS0oJHt1c2FnZS5MaW5lfS0ke3VzYWdlLkNvbHVtbn0pLSgke3VzYWdlLkVuZExpbmV9LSR7dXNhZ2UuRW5kQ29sdW1ufSktKCR7dXNhZ2UuUHJvamVjdHMuam9pbihcIi1cIil9KWA7XHJcbiAgICAgICAgfTtcclxuICAgICAgICB0aGlzLl9saXN0LmhhbmRsZUNsaWNrID0gKGl0ZW06IE1vZGVscy5RdWlja0ZpeCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLmdvdG9Vc2FnZShpdGVtKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHRoaXMuX2xpc3QuZXZlbnROYW1lID0gXCJ1c2FnZVwiO1xyXG4gICAgICAgIHRoaXMuX2xpc3QuZWxlbWVudEZhY3RvcnkgPSBnZXRNZXNzYWdlRWxlbWVudDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgYXR0YWNoZWRDYWxsYmFjaygpIHtcclxuICAgICAgICB0aGlzLl9saXN0LmF0dGFjaGVkKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRldGFjaGVkQ2FsbGJhY2soKSB7XHJcbiAgICAgICAgdGhpcy5fbGlzdC5kZXRhY2hlZCgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB1cGRhdGUob3V0cHV0OiBNb2RlbHMuUXVpY2tGaXhbXSkge1xyXG4gICAgICAgIHRoaXMuX2xpc3QudXBkYXRlT3V0cHV0KG91dHB1dCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIG5leHQoKSB7XHJcbiAgICAgICAgdGhpcy5fbGlzdC5uZXh0KCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHByZXYoKSB7XHJcbiAgICAgICAgdGhpcy5fbGlzdC5wcmV2KCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldCBzZWxlY3RlZEluZGV4KCkgeyByZXR1cm4gdGhpcy5fbGlzdC5zZWxlY3RlZEluZGV4OyB9XHJcbiAgICBwdWJsaWMgc2V0IHNlbGVjdGVkSW5kZXgodmFsdWUpIHsgdGhpcy5fbGlzdC5zZWxlY3RlZEluZGV4ID0gdmFsdWU7IH1cclxuICAgIHB1YmxpYyBnZXQgY3VycmVudCgpIHsgcmV0dXJuIHRoaXMuX2xpc3QuY3VycmVudDsgfVxyXG5cclxuICAgIHByaXZhdGUgZ290b1VzYWdlKHF1aWNrZml4OiBNb2RlbHMuUXVpY2tGaXgpIHtcclxuICAgICAgICBPbW5pLm5hdmlnYXRlVG8ocXVpY2tmaXgpO1xyXG4gICAgfVxyXG59XHJcblxyXG4oPGFueT5leHBvcnRzKS5GaW5kV2luZG93ID0gKDxhbnk+ZG9jdW1lbnQpLnJlZ2lzdGVyRWxlbWVudChcIm9tbmlzaGFycC1maW5kLXdpbmRvd1wiLCB7IHByb3RvdHlwZTogRmluZFdpbmRvdy5wcm90b3R5cGUgfSk7XHJcbiJdfQ==
