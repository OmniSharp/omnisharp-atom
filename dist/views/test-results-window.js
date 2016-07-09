"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.TestResultsWindow = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _ansiToHtml = require("../services/ansi-to-html");

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var convert = new _ansiToHtml.Convert();

var TestResultsWindow = exports.TestResultsWindow = function (_HTMLDivElement) {
    _inherits(TestResultsWindow, _HTMLDivElement);

    function TestResultsWindow() {
        var _Object$getPrototypeO;

        _classCallCheck(this, TestResultsWindow);

        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
        }

        var _this = _possibleConstructorReturn(this, (_Object$getPrototypeO = Object.getPrototypeOf(TestResultsWindow)).call.apply(_Object$getPrototypeO, [this].concat(args)));

        _this.displayName = "CommandOutputWindow";
        return _this;
    }

    _createClass(TestResultsWindow, [{
        key: "createdCallback",
        value: function createdCallback() {
            var _this2 = this;

            this.classList.add("omni-output-pane-view", "native-key-bindings");
            this.tabIndex = -1;
            this._container = document.createElement("div");
            this._container.classList.add("messages-container");
            this.appendChild(this._container);
            this._scrollToBottom = _lodash2.default.throttle(function () {
                var item = _this2.lastElementChild && _this2.lastElementChild.lastElementChild;
                if (item) item.scrollIntoViewIfNeeded();
            }, 100, { trailing: true });
        }
    }, {
        key: "attachedCallback",
        value: function attachedCallback() {
            _lodash2.default.defer(this._scrollToBottom, this);
        }
    }, {
        key: "addMessage",
        value: function addMessage(item) {
            var pre = document.createElement("pre");
            pre.classList.add(item.logLevel);
            pre.innerText = convert.toHtml(item.message).trim();
            this._container.appendChild(pre);
            this._scrollToBottom();
        }
    }, {
        key: "clear",
        value: function clear() {
            this._container.innerHTML = "";
        }
    }]);

    return TestResultsWindow;
}(HTMLDivElement);

exports.TestResultsWindow = document.registerElement("omnisharp-test-results", { prototype: TestResultsWindow.prototype });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy90ZXN0LXJlc3VsdHMtd2luZG93LmpzIiwibGliL3ZpZXdzL3Rlc3QtcmVzdWx0cy13aW5kb3cudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0FBRUE7Ozs7Ozs7Ozs7OztBQ0FBLElBQU0sVUFBVSx5QkFBaEI7O0lBUUEsaUIsV0FBQSxpQjs7O0FBQUEsaUNBQUE7QUFBQTs7QUFBQTs7QUFBQSwwQ0FBQSxJQUFBO0FBQUEsZ0JBQUE7QUFBQTs7QUFBQSx3S0FBdUMsSUFBdkM7O0FBQ1csY0FBQSxXQUFBLEdBQWMscUJBQWQ7QUFEWDtBQW1DQzs7OzswQ0E5QnlCO0FBQUE7O0FBQ2xCLGlCQUFLLFNBQUwsQ0FBZSxHQUFmLENBQW1CLHVCQUFuQixFQUE0QyxxQkFBNUM7QUFDQSxpQkFBSyxRQUFMLEdBQWdCLENBQUMsQ0FBakI7QUFFQSxpQkFBSyxVQUFMLEdBQWtCLFNBQVMsYUFBVCxDQUF1QixLQUF2QixDQUFsQjtBQUNBLGlCQUFLLFVBQUwsQ0FBZ0IsU0FBaEIsQ0FBMEIsR0FBMUIsQ0FBOEIsb0JBQTlCO0FBQ0EsaUJBQUssV0FBTCxDQUFpQixLQUFLLFVBQXRCO0FBRUEsaUJBQUssZUFBTCxHQUF1QixpQkFBRSxRQUFGLENBQVcsWUFBQTtBQUM5QixvQkFBTSxPQUFhLE9BQUssZ0JBQUwsSUFBeUIsT0FBSyxnQkFBTCxDQUFzQixnQkFBbEU7QUFDQSxvQkFBSSxJQUFKLEVBQVUsS0FBSyxzQkFBTDtBQUNiLGFBSHNCLEVBR3BCLEdBSG9CLEVBR2YsRUFBRSxVQUFVLElBQVosRUFIZSxDQUF2QjtBQUlIOzs7MkNBRXNCO0FBQ25CLDZCQUFFLEtBQUYsQ0FBUSxLQUFLLGVBQWIsRUFBOEIsSUFBOUI7QUFDSDs7O21DQUVpQixJLEVBQW1CO0FBQ2pDLGdCQUFNLE1BQU0sU0FBUyxhQUFULENBQXVCLEtBQXZCLENBQVo7QUFDQSxnQkFBSSxTQUFKLENBQWMsR0FBZCxDQUFrQixLQUFLLFFBQXZCO0FBQ0EsZ0JBQUksU0FBSixHQUFnQixRQUFRLE1BQVIsQ0FBZSxLQUFLLE9BQXBCLEVBQTZCLElBQTdCLEVBQWhCO0FBRUEsaUJBQUssVUFBTCxDQUFnQixXQUFoQixDQUE0QixHQUE1QjtBQUNBLGlCQUFLLGVBQUw7QUFDSDs7O2dDQUVXO0FBQ1IsaUJBQUssVUFBTCxDQUFnQixTQUFoQixHQUE0QixFQUE1QjtBQUNIOzs7O0VBbENrQyxjOztBQXFDakMsUUFBUyxpQkFBVCxHQUFtQyxTQUFVLGVBQVYsQ0FBMEIsd0JBQTFCLEVBQW9ELEVBQUUsV0FBVyxrQkFBa0IsU0FBL0IsRUFBcEQsQ0FBbkMiLCJmaWxlIjoibGliL3ZpZXdzL3Rlc3QtcmVzdWx0cy13aW5kb3cuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb252ZXJ0IH0gZnJvbSBcIi4uL3NlcnZpY2VzL2Fuc2ktdG8taHRtbFwiO1xuY29uc3QgY29udmVydCA9IG5ldyBDb252ZXJ0KCk7XG5pbXBvcnQgXyBmcm9tIFwibG9kYXNoXCI7XG5leHBvcnQgY2xhc3MgVGVzdFJlc3VsdHNXaW5kb3cgZXh0ZW5kcyBIVE1MRGl2RWxlbWVudCB7XG4gICAgY29uc3RydWN0b3IoLi4uYXJncykge1xuICAgICAgICBzdXBlciguLi5hcmdzKTtcbiAgICAgICAgdGhpcy5kaXNwbGF5TmFtZSA9IFwiQ29tbWFuZE91dHB1dFdpbmRvd1wiO1xuICAgIH1cbiAgICBjcmVhdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMuY2xhc3NMaXN0LmFkZChcIm9tbmktb3V0cHV0LXBhbmUtdmlld1wiLCBcIm5hdGl2ZS1rZXktYmluZGluZ3NcIik7XG4gICAgICAgIHRoaXMudGFiSW5kZXggPSAtMTtcbiAgICAgICAgdGhpcy5fY29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgdGhpcy5fY29udGFpbmVyLmNsYXNzTGlzdC5hZGQoXCJtZXNzYWdlcy1jb250YWluZXJcIik7XG4gICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQodGhpcy5fY29udGFpbmVyKTtcbiAgICAgICAgdGhpcy5fc2Nyb2xsVG9Cb3R0b20gPSBfLnRocm90dGxlKCgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGl0ZW0gPSAodGhpcy5sYXN0RWxlbWVudENoaWxkICYmIHRoaXMubGFzdEVsZW1lbnRDaGlsZC5sYXN0RWxlbWVudENoaWxkKTtcbiAgICAgICAgICAgIGlmIChpdGVtKVxuICAgICAgICAgICAgICAgIGl0ZW0uc2Nyb2xsSW50b1ZpZXdJZk5lZWRlZCgpO1xuICAgICAgICB9LCAxMDAsIHsgdHJhaWxpbmc6IHRydWUgfSk7XG4gICAgfVxuICAgIGF0dGFjaGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIF8uZGVmZXIodGhpcy5fc2Nyb2xsVG9Cb3R0b20sIHRoaXMpO1xuICAgIH1cbiAgICBhZGRNZXNzYWdlKGl0ZW0pIHtcbiAgICAgICAgY29uc3QgcHJlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInByZVwiKTtcbiAgICAgICAgcHJlLmNsYXNzTGlzdC5hZGQoaXRlbS5sb2dMZXZlbCk7XG4gICAgICAgIHByZS5pbm5lclRleHQgPSBjb252ZXJ0LnRvSHRtbChpdGVtLm1lc3NhZ2UpLnRyaW0oKTtcbiAgICAgICAgdGhpcy5fY29udGFpbmVyLmFwcGVuZENoaWxkKHByZSk7XG4gICAgICAgIHRoaXMuX3Njcm9sbFRvQm90dG9tKCk7XG4gICAgfVxuICAgIGNsZWFyKCkge1xuICAgICAgICB0aGlzLl9jb250YWluZXIuaW5uZXJIVE1MID0gXCJcIjtcbiAgICB9XG59XG5leHBvcnRzLlRlc3RSZXN1bHRzV2luZG93ID0gZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50KFwib21uaXNoYXJwLXRlc3QtcmVzdWx0c1wiLCB7IHByb3RvdHlwZTogVGVzdFJlc3VsdHNXaW5kb3cucHJvdG90eXBlIH0pO1xuIiwiLyogdHNsaW50OmRpc2FibGU6bm8tc3RyaW5nLWxpdGVyYWwgKi9cclxuaW1wb3J0IHtDb252ZXJ0fSBmcm9tIFwiLi4vc2VydmljZXMvYW5zaS10by1odG1sXCI7XHJcbmNvbnN0IGNvbnZlcnQgPSBuZXcgQ29udmVydCgpO1xyXG5pbXBvcnQgXyBmcm9tIFwibG9kYXNoXCI7XHJcblxyXG4vLyBjdHJsLXIuIGN0cmwtdCBydW4gdGVzdFxyXG4vLyBjdHJsLXIsIGN0cmwtZiBydW4gZml4dHVyZVxyXG4vLyBjdHJsLXIsIGN0cmwtYSBydW4gYWxsXHJcbi8vIGN0cmwtciwgY3RybC1sIHJ1biBsYXN0XHJcblxyXG5leHBvcnQgY2xhc3MgVGVzdFJlc3VsdHNXaW5kb3cgZXh0ZW5kcyBIVE1MRGl2RWxlbWVudCBpbXBsZW1lbnRzIFdlYkNvbXBvbmVudCB7XHJcbiAgICBwdWJsaWMgZGlzcGxheU5hbWUgPSBcIkNvbW1hbmRPdXRwdXRXaW5kb3dcIjtcclxuICAgIHByaXZhdGUgX2NvbnRhaW5lcjogSFRNTERpdkVsZW1lbnQ7XHJcbiAgICBwcml2YXRlIF9zY3JvbGxUb0JvdHRvbTogKCkgPT4gdm9pZDtcclxuXHJcbiAgICBwdWJsaWMgY3JlYXRlZENhbGxiYWNrKCkge1xyXG4gICAgICAgIHRoaXMuY2xhc3NMaXN0LmFkZChcIm9tbmktb3V0cHV0LXBhbmUtdmlld1wiLCBcIm5hdGl2ZS1rZXktYmluZGluZ3NcIik7XHJcbiAgICAgICAgdGhpcy50YWJJbmRleCA9IC0xO1xyXG5cclxuICAgICAgICB0aGlzLl9jb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gICAgICAgIHRoaXMuX2NvbnRhaW5lci5jbGFzc0xpc3QuYWRkKFwibWVzc2FnZXMtY29udGFpbmVyXCIpO1xyXG4gICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQodGhpcy5fY29udGFpbmVyKTtcclxuXHJcbiAgICAgICAgdGhpcy5fc2Nyb2xsVG9Cb3R0b20gPSBfLnRocm90dGxlKCgpID0+IHtcclxuICAgICAgICAgICAgY29uc3QgaXRlbSA9IDxhbnk+KHRoaXMubGFzdEVsZW1lbnRDaGlsZCAmJiB0aGlzLmxhc3RFbGVtZW50Q2hpbGQubGFzdEVsZW1lbnRDaGlsZCk7XHJcbiAgICAgICAgICAgIGlmIChpdGVtKSBpdGVtLnNjcm9sbEludG9WaWV3SWZOZWVkZWQoKTtcclxuICAgICAgICB9LCAxMDAsIHsgdHJhaWxpbmc6IHRydWUgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGF0dGFjaGVkQ2FsbGJhY2soKSB7XHJcbiAgICAgICAgXy5kZWZlcih0aGlzLl9zY3JvbGxUb0JvdHRvbSwgdGhpcyk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGFkZE1lc3NhZ2UoaXRlbTogT3V0cHV0TWVzc2FnZSkge1xyXG4gICAgICAgIGNvbnN0IHByZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJwcmVcIik7XHJcbiAgICAgICAgcHJlLmNsYXNzTGlzdC5hZGQoaXRlbS5sb2dMZXZlbCk7XHJcbiAgICAgICAgcHJlLmlubmVyVGV4dCA9IGNvbnZlcnQudG9IdG1sKGl0ZW0ubWVzc2FnZSkudHJpbSgpO1xyXG5cclxuICAgICAgICB0aGlzLl9jb250YWluZXIuYXBwZW5kQ2hpbGQocHJlKTtcclxuICAgICAgICB0aGlzLl9zY3JvbGxUb0JvdHRvbSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBjbGVhcigpIHtcclxuICAgICAgICB0aGlzLl9jb250YWluZXIuaW5uZXJIVE1MID0gXCJcIjtcclxuICAgIH1cclxufVxyXG5cclxuKDxhbnk+ZXhwb3J0cykuVGVzdFJlc3VsdHNXaW5kb3cgPSAoPGFueT5kb2N1bWVudCkucmVnaXN0ZXJFbGVtZW50KFwib21uaXNoYXJwLXRlc3QtcmVzdWx0c1wiLCB7IHByb3RvdHlwZTogVGVzdFJlc3VsdHNXaW5kb3cucHJvdG90eXBlIH0pO1xyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
