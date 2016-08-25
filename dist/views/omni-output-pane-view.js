"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.OutputWindow = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _ansiToHtml = require("../services/ansi-to-html");

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _serverInformation = require("../atom/server-information");

var _tsDisposables = require("ts-disposables");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var OutputWindow = exports.OutputWindow = function (_HTMLDivElement) {
    _inherits(OutputWindow, _HTMLDivElement);

    function OutputWindow() {
        var _ref;

        _classCallCheck(this, OutputWindow);

        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
        }

        var _this = _possibleConstructorReturn(this, (_ref = OutputWindow.__proto__ || Object.getPrototypeOf(OutputWindow)).call.apply(_ref, [this].concat(args)));

        _this.displayName = "OutputWindow";
        return _this;
    }

    _createClass(OutputWindow, [{
        key: "createdCallback",
        value: function createdCallback() {
            this._convert = new _ansiToHtml.Convert();
            this._output = [];
            this.classList.add("omni-output-pane-view", "native-key-bindings");
            this.tabIndex = -1;
        }
    }, {
        key: "attachedCallback",
        value: function attachedCallback() {
            var _this2 = this;

            this.disposable = new _tsDisposables.CompositeDisposable();
            this.disposable.add(_serverInformation.server.observe.outputElement.subscribe(function (element) {
                _lodash2.default.each(_this2.children, function (child) {
                    return child.remove();
                });
                _this2.appendChild(element);
            }));
            this.disposable.add(_serverInformation.server.observe.output.delay(100).subscribe(function () {
                return _this2.scrollToBottom();
            }));
            this.scrollToBottom();
        }
    }, {
        key: "detachedCallback",
        value: function detachedCallback() {
            this.disposable.dispose();
        }
    }, {
        key: "scrollToBottom",
        value: function scrollToBottom() {
            var item = this.lastElementChild && this.lastElementChild.lastElementChild;
            if (item) item.scrollIntoViewIfNeeded();
        }
    }]);

    return OutputWindow;
}(HTMLDivElement);

exports.OutputWindow = document.registerElement("omnisharp-output-window", { prototype: OutputWindow.prototype });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy9vbW5pLW91dHB1dC1wYW5lLXZpZXcuanMiLCJsaWIvdmlld3Mvb21uaS1vdXRwdXQtcGFuZS12aWV3LnRzIl0sIm5hbWVzIjpbIk91dHB1dFdpbmRvdyIsImFyZ3MiLCJkaXNwbGF5TmFtZSIsIl9jb252ZXJ0IiwiX291dHB1dCIsImNsYXNzTGlzdCIsImFkZCIsInRhYkluZGV4IiwiZGlzcG9zYWJsZSIsIm9ic2VydmUiLCJvdXRwdXRFbGVtZW50Iiwic3Vic2NyaWJlIiwiZWFjaCIsImNoaWxkcmVuIiwiY2hpbGQiLCJyZW1vdmUiLCJhcHBlbmRDaGlsZCIsImVsZW1lbnQiLCJvdXRwdXQiLCJkZWxheSIsInNjcm9sbFRvQm90dG9tIiwiZGlzcG9zZSIsIml0ZW0iLCJsYXN0RWxlbWVudENoaWxkIiwic2Nyb2xsSW50b1ZpZXdJZk5lZWRlZCIsIkhUTUxEaXZFbGVtZW50IiwiZXhwb3J0cyIsImRvY3VtZW50IiwicmVnaXN0ZXJFbGVtZW50IiwicHJvdG90eXBlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7QUFDQTs7OztBQUNBOztBQUNBOzs7Ozs7Ozs7O0lDR0FBLFksV0FBQUEsWTs7O0FBQUEsNEJBQUE7QUFBQTs7QUFBQTs7QUFBQSwwQ0FBQUMsSUFBQTtBQUFBQSxnQkFBQTtBQUFBOztBQUFBLDJKQUFrQ0EsSUFBbEM7O0FBQ1csY0FBQUMsV0FBQSxHQUFjLGNBQWQ7QUFEWDtBQWdDQzs7OzswQ0ExQnlCO0FBQ2xCLGlCQUFLQyxRQUFMLEdBQWdCLHlCQUFoQjtBQUNBLGlCQUFLQyxPQUFMLEdBQWUsRUFBZjtBQUVBLGlCQUFLQyxTQUFMLENBQWVDLEdBQWYsQ0FBbUIsdUJBQW5CLEVBQTRDLHFCQUE1QztBQUNBLGlCQUFLQyxRQUFMLEdBQWdCLENBQUMsQ0FBakI7QUFDSDs7OzJDQUVzQjtBQUFBOztBQUNuQixpQkFBS0MsVUFBTCxHQUFrQix3Q0FBbEI7QUFDQSxpQkFBS0EsVUFBTCxDQUFnQkYsR0FBaEIsQ0FBb0IsMEJBQU9HLE9BQVAsQ0FBZUMsYUFBZixDQUE2QkMsU0FBN0IsQ0FBdUMsbUJBQU87QUFDOUQsaUNBQUVDLElBQUYsQ0FBTyxPQUFLQyxRQUFaLEVBQXNCO0FBQUEsMkJBQVNDLE1BQU1DLE1BQU4sRUFBVDtBQUFBLGlCQUF0QjtBQUNBLHVCQUFLQyxXQUFMLENBQWlCQyxPQUFqQjtBQUNILGFBSG1CLENBQXBCO0FBSUEsaUJBQUtULFVBQUwsQ0FBZ0JGLEdBQWhCLENBQW9CLDBCQUFPRyxPQUFQLENBQWVTLE1BQWYsQ0FBc0JDLEtBQXRCLENBQTRCLEdBQTVCLEVBQWlDUixTQUFqQyxDQUEyQztBQUFBLHVCQUFNLE9BQUtTLGNBQUwsRUFBTjtBQUFBLGFBQTNDLENBQXBCO0FBQ0EsaUJBQUtBLGNBQUw7QUFDSDs7OzJDQUVzQjtBQUNuQixpQkFBS1osVUFBTCxDQUFnQmEsT0FBaEI7QUFDSDs7O3lDQUVxQjtBQUNsQixnQkFBTUMsT0FBYSxLQUFLQyxnQkFBTCxJQUF5QixLQUFLQSxnQkFBTCxDQUFzQkEsZ0JBQWxFO0FBQ0EsZ0JBQUlELElBQUosRUFBVUEsS0FBS0Usc0JBQUw7QUFDYjs7OztFQS9CNkJDLGM7O0FBa0M1QkMsUUFBUzFCLFlBQVQsR0FBOEIyQixTQUFVQyxlQUFWLENBQTBCLHlCQUExQixFQUFxRCxFQUFFQyxXQUFXN0IsYUFBYTZCLFNBQTFCLEVBQXJELENBQTlCIiwiZmlsZSI6ImxpYi92aWV3cy9vbW5pLW91dHB1dC1wYW5lLXZpZXcuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb252ZXJ0IH0gZnJvbSBcIi4uL3NlcnZpY2VzL2Fuc2ktdG8taHRtbFwiO1xuaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xuaW1wb3J0IHsgc2VydmVyIH0gZnJvbSBcIi4uL2F0b20vc2VydmVyLWluZm9ybWF0aW9uXCI7XG5pbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlIH0gZnJvbSBcInRzLWRpc3Bvc2FibGVzXCI7XG5leHBvcnQgY2xhc3MgT3V0cHV0V2luZG93IGV4dGVuZHMgSFRNTERpdkVsZW1lbnQge1xuICAgIGNvbnN0cnVjdG9yKC4uLmFyZ3MpIHtcbiAgICAgICAgc3VwZXIoLi4uYXJncyk7XG4gICAgICAgIHRoaXMuZGlzcGxheU5hbWUgPSBcIk91dHB1dFdpbmRvd1wiO1xuICAgIH1cbiAgICBjcmVhdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMuX2NvbnZlcnQgPSBuZXcgQ29udmVydCgpO1xuICAgICAgICB0aGlzLl9vdXRwdXQgPSBbXTtcbiAgICAgICAgdGhpcy5jbGFzc0xpc3QuYWRkKFwib21uaS1vdXRwdXQtcGFuZS12aWV3XCIsIFwibmF0aXZlLWtleS1iaW5kaW5nc1wiKTtcbiAgICAgICAgdGhpcy50YWJJbmRleCA9IC0xO1xuICAgIH1cbiAgICBhdHRhY2hlZENhbGxiYWNrKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKHNlcnZlci5vYnNlcnZlLm91dHB1dEVsZW1lbnQuc3Vic2NyaWJlKGVsZW1lbnQgPT4ge1xuICAgICAgICAgICAgXy5lYWNoKHRoaXMuY2hpbGRyZW4sIGNoaWxkID0+IGNoaWxkLnJlbW92ZSgpKTtcbiAgICAgICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQoZWxlbWVudCk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChzZXJ2ZXIub2JzZXJ2ZS5vdXRwdXQuZGVsYXkoMTAwKS5zdWJzY3JpYmUoKCkgPT4gdGhpcy5zY3JvbGxUb0JvdHRvbSgpKSk7XG4gICAgICAgIHRoaXMuc2Nyb2xsVG9Cb3R0b20oKTtcbiAgICB9XG4gICAgZGV0YWNoZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICB9XG4gICAgc2Nyb2xsVG9Cb3R0b20oKSB7XG4gICAgICAgIGNvbnN0IGl0ZW0gPSAodGhpcy5sYXN0RWxlbWVudENoaWxkICYmIHRoaXMubGFzdEVsZW1lbnRDaGlsZC5sYXN0RWxlbWVudENoaWxkKTtcbiAgICAgICAgaWYgKGl0ZW0pXG4gICAgICAgICAgICBpdGVtLnNjcm9sbEludG9WaWV3SWZOZWVkZWQoKTtcbiAgICB9XG59XG5leHBvcnRzLk91dHB1dFdpbmRvdyA9IGRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudChcIm9tbmlzaGFycC1vdXRwdXQtd2luZG93XCIsIHsgcHJvdG90eXBlOiBPdXRwdXRXaW5kb3cucHJvdG90eXBlIH0pO1xuIiwiLyogdHNsaW50OmRpc2FibGU6bm8tc3RyaW5nLWxpdGVyYWwgKi9cclxuaW1wb3J0IHtDb252ZXJ0fSBmcm9tIFwiLi4vc2VydmljZXMvYW5zaS10by1odG1sXCI7XHJcbmltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcclxuaW1wb3J0IHtzZXJ2ZXJ9IGZyb20gXCIuLi9hdG9tL3NlcnZlci1pbmZvcm1hdGlvblwiO1xyXG5pbXBvcnQge0NvbXBvc2l0ZURpc3Bvc2FibGV9IGZyb20gXCJ0cy1kaXNwb3NhYmxlc1wiO1xyXG5cclxuZXhwb3J0IGNsYXNzIE91dHB1dFdpbmRvdyBleHRlbmRzIEhUTUxEaXZFbGVtZW50IGltcGxlbWVudHMgV2ViQ29tcG9uZW50IHtcclxuICAgIHB1YmxpYyBkaXNwbGF5TmFtZSA9IFwiT3V0cHV0V2luZG93XCI7XHJcbiAgICBwcml2YXRlIGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XHJcbiAgICBwcml2YXRlIF9jb252ZXJ0OiBhbnk7XHJcbiAgICBwcml2YXRlIF9vdXRwdXQ6IE91dHB1dE1lc3NhZ2VbXTtcclxuXHJcbiAgICBwdWJsaWMgY3JlYXRlZENhbGxiYWNrKCkge1xyXG4gICAgICAgIHRoaXMuX2NvbnZlcnQgPSBuZXcgQ29udmVydCgpO1xyXG4gICAgICAgIHRoaXMuX291dHB1dCA9IFtdO1xyXG5cclxuICAgICAgICB0aGlzLmNsYXNzTGlzdC5hZGQoXCJvbW5pLW91dHB1dC1wYW5lLXZpZXdcIiwgXCJuYXRpdmUta2V5LWJpbmRpbmdzXCIpO1xyXG4gICAgICAgIHRoaXMudGFiSW5kZXggPSAtMTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgYXR0YWNoZWRDYWxsYmFjaygpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoc2VydmVyLm9ic2VydmUub3V0cHV0RWxlbWVudC5zdWJzY3JpYmUoZWxlbWVudCA9PiB7XHJcbiAgICAgICAgICAgIF8uZWFjaCh0aGlzLmNoaWxkcmVuLCBjaGlsZCA9PiBjaGlsZC5yZW1vdmUoKSk7XHJcbiAgICAgICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQoZWxlbWVudCk7XHJcbiAgICAgICAgfSkpO1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoc2VydmVyLm9ic2VydmUub3V0cHV0LmRlbGF5KDEwMCkuc3Vic2NyaWJlKCgpID0+IHRoaXMuc2Nyb2xsVG9Cb3R0b20oKSkpO1xyXG4gICAgICAgIHRoaXMuc2Nyb2xsVG9Cb3R0b20oKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGV0YWNoZWRDYWxsYmFjaygpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgc2Nyb2xsVG9Cb3R0b20oKSB7XHJcbiAgICAgICAgY29uc3QgaXRlbSA9IDxhbnk+KHRoaXMubGFzdEVsZW1lbnRDaGlsZCAmJiB0aGlzLmxhc3RFbGVtZW50Q2hpbGQubGFzdEVsZW1lbnRDaGlsZCk7XHJcbiAgICAgICAgaWYgKGl0ZW0pIGl0ZW0uc2Nyb2xsSW50b1ZpZXdJZk5lZWRlZCgpO1xyXG4gICAgfVxyXG59XHJcblxyXG4oPGFueT5leHBvcnRzKS5PdXRwdXRXaW5kb3cgPSAoPGFueT5kb2N1bWVudCkucmVnaXN0ZXJFbGVtZW50KFwib21uaXNoYXJwLW91dHB1dC13aW5kb3dcIiwgeyBwcm90b3R5cGU6IE91dHB1dFdpbmRvdy5wcm90b3R5cGUgfSk7XHJcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
