"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.BuildOutputWindow = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _ansiToHtml = require("../services/ansi-to-html");

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _serverInformation = require("../atom/server-information");

var _omnisharpClient = require("omnisharp-client");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var BuildOutputWindow = exports.BuildOutputWindow = function (_HTMLDivElement) {
    _inherits(BuildOutputWindow, _HTMLDivElement);

    function BuildOutputWindow() {
        var _Object$getPrototypeO;

        _classCallCheck(this, BuildOutputWindow);

        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
        }

        var _this = _possibleConstructorReturn(this, (_Object$getPrototypeO = Object.getPrototypeOf(BuildOutputWindow)).call.apply(_Object$getPrototypeO, [this].concat(args)));

        _this.displayName = "BuildOutputWindow";
        return _this;
    }

    _createClass(BuildOutputWindow, [{
        key: "createdCallback",
        value: function createdCallback() {
            this._convert = new _ansiToHtml.Convert();
            this._output = [];
            this.classList.add("build-output-pane-view", "native-key-bindings");
            this.tabIndex = -1;
        }
    }, {
        key: "attachedCallback",
        value: function attachedCallback() {
            var _this2 = this;

            this.disposable = new _omnisharpClient.CompositeDisposable();
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

    return BuildOutputWindow;
}(HTMLDivElement);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy9idWlsZC1vdXRwdXQtcGFuZS12aWV3LmpzIiwibGliL3ZpZXdzL2J1aWxkLW91dHB1dC1wYW5lLXZpZXcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0FBQ0E7Ozs7QUFDQTs7QUFDQTs7Ozs7Ozs7OztJQ0dBOzs7QUFBQSxpQ0FBQTs7Ozs7MENBQUE7O1NBQUE7O3dLQUF1QyxRQUF2Qzs7QUFDVyxjQUFBLFdBQUEsR0FBYyxtQkFBZCxDQURYOztLQUFBOzs7OzBDQU0wQjtBQUNsQixpQkFBSyxRQUFMLEdBQWdCLHlCQUFoQixDQURrQjtBQUVsQixpQkFBSyxPQUFMLEdBQWUsRUFBZixDQUZrQjtBQUlsQixpQkFBSyxTQUFMLENBQWUsR0FBZixDQUFtQix3QkFBbkIsRUFBNkMscUJBQTdDLEVBSmtCO0FBS2xCLGlCQUFLLFFBQUwsR0FBZ0IsQ0FBQyxDQUFELENBTEU7Ozs7MkNBUUM7OztBQUNuQixpQkFBSyxVQUFMLEdBQWtCLDBDQUFsQixDQURtQjtBQUVuQixpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLDBCQUFPLE9BQVAsQ0FBZSxhQUFmLENBQTZCLFNBQTdCLENBQXVDLG1CQUFPO0FBQzlELGlDQUFFLElBQUYsQ0FBTyxPQUFLLFFBQUwsRUFBZTsyQkFBUyxNQUFNLE1BQU47aUJBQVQsQ0FBdEIsQ0FEOEQ7QUFFOUQsdUJBQUssV0FBTCxDQUFpQixPQUFqQixFQUY4RDthQUFQLENBQTNELEVBRm1CO0FBTW5CLGlCQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsMEJBQU8sT0FBUCxDQUFlLE1BQWYsQ0FBc0IsS0FBdEIsQ0FBNEIsR0FBNUIsRUFBaUMsU0FBakMsQ0FBMkM7dUJBQU0sT0FBSyxjQUFMO2FBQU4sQ0FBL0QsRUFObUI7QUFPbkIsaUJBQUssY0FBTCxHQVBtQjs7OzsyQ0FVQTtBQUNuQixpQkFBSyxVQUFMLENBQWdCLE9BQWhCLEdBRG1COzs7O3lDQUlEO0FBQ2xCLGdCQUFNLE9BQWEsS0FBSyxnQkFBTCxJQUF5QixLQUFLLGdCQUFMLENBQXNCLGdCQUF0QixDQUQxQjtBQUVsQixnQkFBSSxJQUFKLEVBQVUsS0FBSyxzQkFBTCxHQUFWOzs7OztFQTlCK0IiLCJmaWxlIjoibGliL3ZpZXdzL2J1aWxkLW91dHB1dC1wYW5lLXZpZXcuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb252ZXJ0IH0gZnJvbSBcIi4uL3NlcnZpY2VzL2Fuc2ktdG8taHRtbFwiO1xuaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xuaW1wb3J0IHsgc2VydmVyIH0gZnJvbSBcIi4uL2F0b20vc2VydmVyLWluZm9ybWF0aW9uXCI7XG5pbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlIH0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcbmV4cG9ydCBjbGFzcyBCdWlsZE91dHB1dFdpbmRvdyBleHRlbmRzIEhUTUxEaXZFbGVtZW50IHtcbiAgICBjb25zdHJ1Y3RvciguLi5hcmdzKSB7XG4gICAgICAgIHN1cGVyKC4uLmFyZ3MpO1xuICAgICAgICB0aGlzLmRpc3BsYXlOYW1lID0gXCJCdWlsZE91dHB1dFdpbmRvd1wiO1xuICAgIH1cbiAgICBjcmVhdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMuX2NvbnZlcnQgPSBuZXcgQ29udmVydCgpO1xuICAgICAgICB0aGlzLl9vdXRwdXQgPSBbXTtcbiAgICAgICAgdGhpcy5jbGFzc0xpc3QuYWRkKFwiYnVpbGQtb3V0cHV0LXBhbmUtdmlld1wiLCBcIm5hdGl2ZS1rZXktYmluZGluZ3NcIik7XG4gICAgICAgIHRoaXMudGFiSW5kZXggPSAtMTtcbiAgICB9XG4gICAgYXR0YWNoZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChzZXJ2ZXIub2JzZXJ2ZS5vdXRwdXRFbGVtZW50LnN1YnNjcmliZShlbGVtZW50ID0+IHtcbiAgICAgICAgICAgIF8uZWFjaCh0aGlzLmNoaWxkcmVuLCBjaGlsZCA9PiBjaGlsZC5yZW1vdmUoKSk7XG4gICAgICAgICAgICB0aGlzLmFwcGVuZENoaWxkKGVsZW1lbnQpO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoc2VydmVyLm9ic2VydmUub3V0cHV0LmRlbGF5KDEwMCkuc3Vic2NyaWJlKCgpID0+IHRoaXMuc2Nyb2xsVG9Cb3R0b20oKSkpO1xuICAgICAgICB0aGlzLnNjcm9sbFRvQm90dG9tKCk7XG4gICAgfVxuICAgIGRldGFjaGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfVxuICAgIHNjcm9sbFRvQm90dG9tKCkge1xuICAgICAgICBjb25zdCBpdGVtID0gKHRoaXMubGFzdEVsZW1lbnRDaGlsZCAmJiB0aGlzLmxhc3RFbGVtZW50Q2hpbGQubGFzdEVsZW1lbnRDaGlsZCk7XG4gICAgICAgIGlmIChpdGVtKVxuICAgICAgICAgICAgaXRlbS5zY3JvbGxJbnRvVmlld0lmTmVlZGVkKCk7XG4gICAgfVxufVxuIiwiLyogdHNsaW50OmRpc2FibGU6bm8tc3RyaW5nLWxpdGVyYWwgKi9cclxuaW1wb3J0IHtDb252ZXJ0fSBmcm9tIFwiLi4vc2VydmljZXMvYW5zaS10by1odG1sXCI7XHJcbmltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcclxuaW1wb3J0IHtzZXJ2ZXJ9IGZyb20gXCIuLi9hdG9tL3NlcnZlci1pbmZvcm1hdGlvblwiO1xyXG5pbXBvcnQge0NvbXBvc2l0ZURpc3Bvc2FibGV9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XHJcblxyXG5leHBvcnQgY2xhc3MgQnVpbGRPdXRwdXRXaW5kb3cgZXh0ZW5kcyBIVE1MRGl2RWxlbWVudCBpbXBsZW1lbnRzIFdlYkNvbXBvbmVudCB7XHJcbiAgICBwdWJsaWMgZGlzcGxheU5hbWUgPSBcIkJ1aWxkT3V0cHV0V2luZG93XCI7XHJcbiAgICBwcml2YXRlIF9jb252ZXJ0OiBhbnk7XHJcbiAgICBwcml2YXRlIF9vdXRwdXQ6IE91dHB1dE1lc3NhZ2VbXTtcclxuICAgIHByaXZhdGUgZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxuXHJcbiAgICBwdWJsaWMgY3JlYXRlZENhbGxiYWNrKCkge1xyXG4gICAgICAgIHRoaXMuX2NvbnZlcnQgPSBuZXcgQ29udmVydCgpO1xyXG4gICAgICAgIHRoaXMuX291dHB1dCA9IFtdO1xyXG5cclxuICAgICAgICB0aGlzLmNsYXNzTGlzdC5hZGQoXCJidWlsZC1vdXRwdXQtcGFuZS12aWV3XCIsIFwibmF0aXZlLWtleS1iaW5kaW5nc1wiKTtcclxuICAgICAgICB0aGlzLnRhYkluZGV4ID0gLTE7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGF0dGFjaGVkQ2FsbGJhY2soKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKHNlcnZlci5vYnNlcnZlLm91dHB1dEVsZW1lbnQuc3Vic2NyaWJlKGVsZW1lbnQgPT4ge1xyXG4gICAgICAgICAgICBfLmVhY2godGhpcy5jaGlsZHJlbiwgY2hpbGQgPT4gY2hpbGQucmVtb3ZlKCkpO1xyXG4gICAgICAgICAgICB0aGlzLmFwcGVuZENoaWxkKGVsZW1lbnQpO1xyXG4gICAgICAgIH0pKTtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKHNlcnZlci5vYnNlcnZlLm91dHB1dC5kZWxheSgxMDApLnN1YnNjcmliZSgoKSA9PiB0aGlzLnNjcm9sbFRvQm90dG9tKCkpKTtcclxuICAgICAgICB0aGlzLnNjcm9sbFRvQm90dG9tKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRldGFjaGVkQ2FsbGJhY2soKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHNjcm9sbFRvQm90dG9tKCkge1xyXG4gICAgICAgIGNvbnN0IGl0ZW0gPSA8YW55Pih0aGlzLmxhc3RFbGVtZW50Q2hpbGQgJiYgdGhpcy5sYXN0RWxlbWVudENoaWxkLmxhc3RFbGVtZW50Q2hpbGQpO1xyXG4gICAgICAgIGlmIChpdGVtKSBpdGVtLnNjcm9sbEludG9WaWV3SWZOZWVkZWQoKTtcclxuICAgIH1cclxufVxyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
