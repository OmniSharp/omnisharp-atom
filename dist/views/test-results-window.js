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
        _classCallCheck(this, TestResultsWindow);

        var _this = _possibleConstructorReturn(this, (TestResultsWindow.__proto__ || Object.getPrototypeOf(TestResultsWindow)).apply(this, arguments));

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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy90ZXN0LXJlc3VsdHMtd2luZG93LmpzIiwibGliL3ZpZXdzL3Rlc3QtcmVzdWx0cy13aW5kb3cudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0FBRUE7Ozs7Ozs7Ozs7OztBQ0FBLElBQU0sVUFBVSx5QkFBVjs7SUFRTjs7O0FBQUEsaUNBQUE7OzsySUFBdUMsWUFBdkM7O0FBQ1csY0FBQSxXQUFBLEdBQWMscUJBQWQsQ0FEWDs7S0FBQTs7OzswQ0FLMEI7OztBQUNsQixpQkFBSyxTQUFMLENBQWUsR0FBZixDQUFtQix1QkFBbkIsRUFBNEMscUJBQTVDLEVBRGtCO0FBRWxCLGlCQUFLLFFBQUwsR0FBZ0IsQ0FBQyxDQUFELENBRkU7QUFJbEIsaUJBQUssVUFBTCxHQUFrQixTQUFTLGFBQVQsQ0FBdUIsS0FBdkIsQ0FBbEIsQ0FKa0I7QUFLbEIsaUJBQUssVUFBTCxDQUFnQixTQUFoQixDQUEwQixHQUExQixDQUE4QixvQkFBOUIsRUFMa0I7QUFNbEIsaUJBQUssV0FBTCxDQUFpQixLQUFLLFVBQUwsQ0FBakIsQ0FOa0I7QUFRbEIsaUJBQUssZUFBTCxHQUF1QixpQkFBRSxRQUFGLENBQVcsWUFBQTtBQUM5QixvQkFBTSxPQUFhLE9BQUssZ0JBQUwsSUFBeUIsT0FBSyxnQkFBTCxDQUFzQixnQkFBdEIsQ0FEZDtBQUU5QixvQkFBSSxJQUFKLEVBQVUsS0FBSyxzQkFBTCxHQUFWO2FBRjhCLEVBRy9CLEdBSG9CLEVBR2YsRUFBRSxVQUFVLElBQVYsRUFIYSxDQUF2QixDQVJrQjs7OzsyQ0FjQztBQUNuQiw2QkFBRSxLQUFGLENBQVEsS0FBSyxlQUFMLEVBQXNCLElBQTlCLEVBRG1COzs7O21DQUlMLE1BQW1CO0FBQ2pDLGdCQUFNLE1BQU0sU0FBUyxhQUFULENBQXVCLEtBQXZCLENBQU4sQ0FEMkI7QUFFakMsZ0JBQUksU0FBSixDQUFjLEdBQWQsQ0FBa0IsS0FBSyxRQUFMLENBQWxCLENBRmlDO0FBR2pDLGdCQUFJLFNBQUosR0FBZ0IsUUFBUSxNQUFSLENBQWUsS0FBSyxPQUFMLENBQWYsQ0FBNkIsSUFBN0IsRUFBaEIsQ0FIaUM7QUFLakMsaUJBQUssVUFBTCxDQUFnQixXQUFoQixDQUE0QixHQUE1QixFQUxpQztBQU1qQyxpQkFBSyxlQUFMLEdBTmlDOzs7O2dDQVN6QjtBQUNSLGlCQUFLLFVBQUwsQ0FBZ0IsU0FBaEIsR0FBNEIsRUFBNUIsQ0FEUTs7Ozs7RUFoQ3VCOztBQXFDakMsUUFBUyxpQkFBVCxHQUFtQyxTQUFVLGVBQVYsQ0FBMEIsd0JBQTFCLEVBQW9ELEVBQUUsV0FBVyxrQkFBa0IsU0FBbEIsRUFBakUsQ0FBbkMiLCJmaWxlIjoibGliL3ZpZXdzL3Rlc3QtcmVzdWx0cy13aW5kb3cuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb252ZXJ0IH0gZnJvbSBcIi4uL3NlcnZpY2VzL2Fuc2ktdG8taHRtbFwiO1xuY29uc3QgY29udmVydCA9IG5ldyBDb252ZXJ0KCk7XG5pbXBvcnQgXyBmcm9tIFwibG9kYXNoXCI7XG5leHBvcnQgY2xhc3MgVGVzdFJlc3VsdHNXaW5kb3cgZXh0ZW5kcyBIVE1MRGl2RWxlbWVudCB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKC4uLmFyZ3VtZW50cyk7XG4gICAgICAgIHRoaXMuZGlzcGxheU5hbWUgPSBcIkNvbW1hbmRPdXRwdXRXaW5kb3dcIjtcbiAgICB9XG4gICAgY3JlYXRlZENhbGxiYWNrKCkge1xuICAgICAgICB0aGlzLmNsYXNzTGlzdC5hZGQoXCJvbW5pLW91dHB1dC1wYW5lLXZpZXdcIiwgXCJuYXRpdmUta2V5LWJpbmRpbmdzXCIpO1xuICAgICAgICB0aGlzLnRhYkluZGV4ID0gLTE7XG4gICAgICAgIHRoaXMuX2NvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgIHRoaXMuX2NvbnRhaW5lci5jbGFzc0xpc3QuYWRkKFwibWVzc2FnZXMtY29udGFpbmVyXCIpO1xuICAgICAgICB0aGlzLmFwcGVuZENoaWxkKHRoaXMuX2NvbnRhaW5lcik7XG4gICAgICAgIHRoaXMuX3Njcm9sbFRvQm90dG9tID0gXy50aHJvdHRsZSgoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBpdGVtID0gKHRoaXMubGFzdEVsZW1lbnRDaGlsZCAmJiB0aGlzLmxhc3RFbGVtZW50Q2hpbGQubGFzdEVsZW1lbnRDaGlsZCk7XG4gICAgICAgICAgICBpZiAoaXRlbSlcbiAgICAgICAgICAgICAgICBpdGVtLnNjcm9sbEludG9WaWV3SWZOZWVkZWQoKTtcbiAgICAgICAgfSwgMTAwLCB7IHRyYWlsaW5nOiB0cnVlIH0pO1xuICAgIH1cbiAgICBhdHRhY2hlZENhbGxiYWNrKCkge1xuICAgICAgICBfLmRlZmVyKHRoaXMuX3Njcm9sbFRvQm90dG9tLCB0aGlzKTtcbiAgICB9XG4gICAgYWRkTWVzc2FnZShpdGVtKSB7XG4gICAgICAgIGNvbnN0IHByZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJwcmVcIik7XG4gICAgICAgIHByZS5jbGFzc0xpc3QuYWRkKGl0ZW0ubG9nTGV2ZWwpO1xuICAgICAgICBwcmUuaW5uZXJUZXh0ID0gY29udmVydC50b0h0bWwoaXRlbS5tZXNzYWdlKS50cmltKCk7XG4gICAgICAgIHRoaXMuX2NvbnRhaW5lci5hcHBlbmRDaGlsZChwcmUpO1xuICAgICAgICB0aGlzLl9zY3JvbGxUb0JvdHRvbSgpO1xuICAgIH1cbiAgICBjbGVhcigpIHtcbiAgICAgICAgdGhpcy5fY29udGFpbmVyLmlubmVySFRNTCA9IFwiXCI7XG4gICAgfVxufVxuZXhwb3J0cy5UZXN0UmVzdWx0c1dpbmRvdyA9IGRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudChcIm9tbmlzaGFycC10ZXN0LXJlc3VsdHNcIiwgeyBwcm90b3R5cGU6IFRlc3RSZXN1bHRzV2luZG93LnByb3RvdHlwZSB9KTtcbiIsIi8qIHRzbGludDpkaXNhYmxlOm5vLXN0cmluZy1saXRlcmFsICovXHJcbmltcG9ydCB7Q29udmVydH0gZnJvbSBcIi4uL3NlcnZpY2VzL2Fuc2ktdG8taHRtbFwiO1xyXG5jb25zdCBjb252ZXJ0ID0gbmV3IENvbnZlcnQoKTtcclxuaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xyXG5cclxuLy8gY3RybC1yLiBjdHJsLXQgcnVuIHRlc3RcclxuLy8gY3RybC1yLCBjdHJsLWYgcnVuIGZpeHR1cmVcclxuLy8gY3RybC1yLCBjdHJsLWEgcnVuIGFsbFxyXG4vLyBjdHJsLXIsIGN0cmwtbCBydW4gbGFzdFxyXG5cclxuZXhwb3J0IGNsYXNzIFRlc3RSZXN1bHRzV2luZG93IGV4dGVuZHMgSFRNTERpdkVsZW1lbnQgaW1wbGVtZW50cyBXZWJDb21wb25lbnQge1xyXG4gICAgcHVibGljIGRpc3BsYXlOYW1lID0gXCJDb21tYW5kT3V0cHV0V2luZG93XCI7XHJcbiAgICBwcml2YXRlIF9jb250YWluZXI6IEhUTUxEaXZFbGVtZW50O1xyXG4gICAgcHJpdmF0ZSBfc2Nyb2xsVG9Cb3R0b206ICgpID0+IHZvaWQ7XHJcblxyXG4gICAgcHVibGljIGNyZWF0ZWRDYWxsYmFjaygpIHtcclxuICAgICAgICB0aGlzLmNsYXNzTGlzdC5hZGQoXCJvbW5pLW91dHB1dC1wYW5lLXZpZXdcIiwgXCJuYXRpdmUta2V5LWJpbmRpbmdzXCIpO1xyXG4gICAgICAgIHRoaXMudGFiSW5kZXggPSAtMTtcclxuXHJcbiAgICAgICAgdGhpcy5fY29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuICAgICAgICB0aGlzLl9jb250YWluZXIuY2xhc3NMaXN0LmFkZChcIm1lc3NhZ2VzLWNvbnRhaW5lclwiKTtcclxuICAgICAgICB0aGlzLmFwcGVuZENoaWxkKHRoaXMuX2NvbnRhaW5lcik7XHJcblxyXG4gICAgICAgIHRoaXMuX3Njcm9sbFRvQm90dG9tID0gXy50aHJvdHRsZSgoKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IGl0ZW0gPSA8YW55Pih0aGlzLmxhc3RFbGVtZW50Q2hpbGQgJiYgdGhpcy5sYXN0RWxlbWVudENoaWxkLmxhc3RFbGVtZW50Q2hpbGQpO1xyXG4gICAgICAgICAgICBpZiAoaXRlbSkgaXRlbS5zY3JvbGxJbnRvVmlld0lmTmVlZGVkKCk7XHJcbiAgICAgICAgfSwgMTAwLCB7IHRyYWlsaW5nOiB0cnVlIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBhdHRhY2hlZENhbGxiYWNrKCkge1xyXG4gICAgICAgIF8uZGVmZXIodGhpcy5fc2Nyb2xsVG9Cb3R0b20sIHRoaXMpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBhZGRNZXNzYWdlKGl0ZW06IE91dHB1dE1lc3NhZ2UpIHtcclxuICAgICAgICBjb25zdCBwcmUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwicHJlXCIpO1xyXG4gICAgICAgIHByZS5jbGFzc0xpc3QuYWRkKGl0ZW0ubG9nTGV2ZWwpO1xyXG4gICAgICAgIHByZS5pbm5lclRleHQgPSBjb252ZXJ0LnRvSHRtbChpdGVtLm1lc3NhZ2UpLnRyaW0oKTtcclxuXHJcbiAgICAgICAgdGhpcy5fY29udGFpbmVyLmFwcGVuZENoaWxkKHByZSk7XHJcbiAgICAgICAgdGhpcy5fc2Nyb2xsVG9Cb3R0b20oKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgY2xlYXIoKSB7XHJcbiAgICAgICAgdGhpcy5fY29udGFpbmVyLmlubmVySFRNTCA9IFwiXCI7XHJcbiAgICB9XHJcbn1cclxuXHJcbig8YW55PmV4cG9ydHMpLlRlc3RSZXN1bHRzV2luZG93ID0gKDxhbnk+ZG9jdW1lbnQpLnJlZ2lzdGVyRWxlbWVudChcIm9tbmlzaGFycC10ZXN0LXJlc3VsdHNcIiwgeyBwcm90b3R5cGU6IFRlc3RSZXN1bHRzV2luZG93LnByb3RvdHlwZSB9KTtcclxuIl19
