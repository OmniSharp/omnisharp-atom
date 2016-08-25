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

var _tsDisposables = require("ts-disposables");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var BuildOutputWindow = exports.BuildOutputWindow = function (_HTMLDivElement) {
    _inherits(BuildOutputWindow, _HTMLDivElement);

    function BuildOutputWindow() {
        var _ref;

        _classCallCheck(this, BuildOutputWindow);

        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
        }

        var _this = _possibleConstructorReturn(this, (_ref = BuildOutputWindow.__proto__ || Object.getPrototypeOf(BuildOutputWindow)).call.apply(_ref, [this].concat(args)));

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

    return BuildOutputWindow;
}(HTMLDivElement);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy9idWlsZC1vdXRwdXQtcGFuZS12aWV3LmpzIiwibGliL3ZpZXdzL2J1aWxkLW91dHB1dC1wYW5lLXZpZXcudHMiXSwibmFtZXMiOlsiQnVpbGRPdXRwdXRXaW5kb3ciLCJhcmdzIiwiZGlzcGxheU5hbWUiLCJfY29udmVydCIsIl9vdXRwdXQiLCJjbGFzc0xpc3QiLCJhZGQiLCJ0YWJJbmRleCIsImRpc3Bvc2FibGUiLCJvYnNlcnZlIiwib3V0cHV0RWxlbWVudCIsInN1YnNjcmliZSIsImVhY2giLCJjaGlsZHJlbiIsImNoaWxkIiwicmVtb3ZlIiwiYXBwZW5kQ2hpbGQiLCJlbGVtZW50Iiwib3V0cHV0IiwiZGVsYXkiLCJzY3JvbGxUb0JvdHRvbSIsImRpc3Bvc2UiLCJpdGVtIiwibGFzdEVsZW1lbnRDaGlsZCIsInNjcm9sbEludG9WaWV3SWZOZWVkZWQiLCJIVE1MRGl2RWxlbWVudCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0FBQ0E7Ozs7QUFDQTs7QUFDQTs7Ozs7Ozs7OztJQ0dBQSxpQixXQUFBQSxpQjs7O0FBQUEsaUNBQUE7QUFBQTs7QUFBQTs7QUFBQSwwQ0FBQUMsSUFBQTtBQUFBQSxnQkFBQTtBQUFBOztBQUFBLHFLQUF1Q0EsSUFBdkM7O0FBQ1csY0FBQUMsV0FBQSxHQUFjLG1CQUFkO0FBRFg7QUFnQ0M7Ozs7MENBMUJ5QjtBQUNsQixpQkFBS0MsUUFBTCxHQUFnQix5QkFBaEI7QUFDQSxpQkFBS0MsT0FBTCxHQUFlLEVBQWY7QUFFQSxpQkFBS0MsU0FBTCxDQUFlQyxHQUFmLENBQW1CLHdCQUFuQixFQUE2QyxxQkFBN0M7QUFDQSxpQkFBS0MsUUFBTCxHQUFnQixDQUFDLENBQWpCO0FBQ0g7OzsyQ0FFc0I7QUFBQTs7QUFDbkIsaUJBQUtDLFVBQUwsR0FBa0Isd0NBQWxCO0FBQ0EsaUJBQUtBLFVBQUwsQ0FBZ0JGLEdBQWhCLENBQW9CLDBCQUFPRyxPQUFQLENBQWVDLGFBQWYsQ0FBNkJDLFNBQTdCLENBQXVDLG1CQUFPO0FBQzlELGlDQUFFQyxJQUFGLENBQU8sT0FBS0MsUUFBWixFQUFzQjtBQUFBLDJCQUFTQyxNQUFNQyxNQUFOLEVBQVQ7QUFBQSxpQkFBdEI7QUFDQSx1QkFBS0MsV0FBTCxDQUFpQkMsT0FBakI7QUFDSCxhQUhtQixDQUFwQjtBQUlBLGlCQUFLVCxVQUFMLENBQWdCRixHQUFoQixDQUFvQiwwQkFBT0csT0FBUCxDQUFlUyxNQUFmLENBQXNCQyxLQUF0QixDQUE0QixHQUE1QixFQUFpQ1IsU0FBakMsQ0FBMkM7QUFBQSx1QkFBTSxPQUFLUyxjQUFMLEVBQU47QUFBQSxhQUEzQyxDQUFwQjtBQUNBLGlCQUFLQSxjQUFMO0FBQ0g7OzsyQ0FFc0I7QUFDbkIsaUJBQUtaLFVBQUwsQ0FBZ0JhLE9BQWhCO0FBQ0g7Ozt5Q0FFcUI7QUFDbEIsZ0JBQU1DLE9BQWEsS0FBS0MsZ0JBQUwsSUFBeUIsS0FBS0EsZ0JBQUwsQ0FBc0JBLGdCQUFsRTtBQUNBLGdCQUFJRCxJQUFKLEVBQVVBLEtBQUtFLHNCQUFMO0FBQ2I7Ozs7RUEvQmtDQyxjIiwiZmlsZSI6ImxpYi92aWV3cy9idWlsZC1vdXRwdXQtcGFuZS12aWV3LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29udmVydCB9IGZyb20gXCIuLi9zZXJ2aWNlcy9hbnNpLXRvLWh0bWxcIjtcbmltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcbmltcG9ydCB7IHNlcnZlciB9IGZyb20gXCIuLi9hdG9tL3NlcnZlci1pbmZvcm1hdGlvblwiO1xuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSB9IGZyb20gXCJ0cy1kaXNwb3NhYmxlc1wiO1xuZXhwb3J0IGNsYXNzIEJ1aWxkT3V0cHV0V2luZG93IGV4dGVuZHMgSFRNTERpdkVsZW1lbnQge1xuICAgIGNvbnN0cnVjdG9yKC4uLmFyZ3MpIHtcbiAgICAgICAgc3VwZXIoLi4uYXJncyk7XG4gICAgICAgIHRoaXMuZGlzcGxheU5hbWUgPSBcIkJ1aWxkT3V0cHV0V2luZG93XCI7XG4gICAgfVxuICAgIGNyZWF0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdGhpcy5fY29udmVydCA9IG5ldyBDb252ZXJ0KCk7XG4gICAgICAgIHRoaXMuX291dHB1dCA9IFtdO1xuICAgICAgICB0aGlzLmNsYXNzTGlzdC5hZGQoXCJidWlsZC1vdXRwdXQtcGFuZS12aWV3XCIsIFwibmF0aXZlLWtleS1iaW5kaW5nc1wiKTtcbiAgICAgICAgdGhpcy50YWJJbmRleCA9IC0xO1xuICAgIH1cbiAgICBhdHRhY2hlZENhbGxiYWNrKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKHNlcnZlci5vYnNlcnZlLm91dHB1dEVsZW1lbnQuc3Vic2NyaWJlKGVsZW1lbnQgPT4ge1xuICAgICAgICAgICAgXy5lYWNoKHRoaXMuY2hpbGRyZW4sIGNoaWxkID0+IGNoaWxkLnJlbW92ZSgpKTtcbiAgICAgICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQoZWxlbWVudCk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChzZXJ2ZXIub2JzZXJ2ZS5vdXRwdXQuZGVsYXkoMTAwKS5zdWJzY3JpYmUoKCkgPT4gdGhpcy5zY3JvbGxUb0JvdHRvbSgpKSk7XG4gICAgICAgIHRoaXMuc2Nyb2xsVG9Cb3R0b20oKTtcbiAgICB9XG4gICAgZGV0YWNoZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICB9XG4gICAgc2Nyb2xsVG9Cb3R0b20oKSB7XG4gICAgICAgIGNvbnN0IGl0ZW0gPSAodGhpcy5sYXN0RWxlbWVudENoaWxkICYmIHRoaXMubGFzdEVsZW1lbnRDaGlsZC5sYXN0RWxlbWVudENoaWxkKTtcbiAgICAgICAgaWYgKGl0ZW0pXG4gICAgICAgICAgICBpdGVtLnNjcm9sbEludG9WaWV3SWZOZWVkZWQoKTtcbiAgICB9XG59XG4iLCIvKiB0c2xpbnQ6ZGlzYWJsZTpuby1zdHJpbmctbGl0ZXJhbCAqL1xyXG5pbXBvcnQge0NvbnZlcnR9IGZyb20gXCIuLi9zZXJ2aWNlcy9hbnNpLXRvLWh0bWxcIjtcclxuaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xyXG5pbXBvcnQge3NlcnZlcn0gZnJvbSBcIi4uL2F0b20vc2VydmVyLWluZm9ybWF0aW9uXCI7XHJcbmltcG9ydCB7Q29tcG9zaXRlRGlzcG9zYWJsZX0gZnJvbSBcInRzLWRpc3Bvc2FibGVzXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgQnVpbGRPdXRwdXRXaW5kb3cgZXh0ZW5kcyBIVE1MRGl2RWxlbWVudCBpbXBsZW1lbnRzIFdlYkNvbXBvbmVudCB7XHJcbiAgICBwdWJsaWMgZGlzcGxheU5hbWUgPSBcIkJ1aWxkT3V0cHV0V2luZG93XCI7XHJcbiAgICBwcml2YXRlIF9jb252ZXJ0OiBhbnk7XHJcbiAgICBwcml2YXRlIF9vdXRwdXQ6IE91dHB1dE1lc3NhZ2VbXTtcclxuICAgIHByaXZhdGUgZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxuXHJcbiAgICBwdWJsaWMgY3JlYXRlZENhbGxiYWNrKCkge1xyXG4gICAgICAgIHRoaXMuX2NvbnZlcnQgPSBuZXcgQ29udmVydCgpO1xyXG4gICAgICAgIHRoaXMuX291dHB1dCA9IFtdO1xyXG5cclxuICAgICAgICB0aGlzLmNsYXNzTGlzdC5hZGQoXCJidWlsZC1vdXRwdXQtcGFuZS12aWV3XCIsIFwibmF0aXZlLWtleS1iaW5kaW5nc1wiKTtcclxuICAgICAgICB0aGlzLnRhYkluZGV4ID0gLTE7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGF0dGFjaGVkQ2FsbGJhY2soKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKHNlcnZlci5vYnNlcnZlLm91dHB1dEVsZW1lbnQuc3Vic2NyaWJlKGVsZW1lbnQgPT4ge1xyXG4gICAgICAgICAgICBfLmVhY2godGhpcy5jaGlsZHJlbiwgY2hpbGQgPT4gY2hpbGQucmVtb3ZlKCkpO1xyXG4gICAgICAgICAgICB0aGlzLmFwcGVuZENoaWxkKGVsZW1lbnQpO1xyXG4gICAgICAgIH0pKTtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKHNlcnZlci5vYnNlcnZlLm91dHB1dC5kZWxheSgxMDApLnN1YnNjcmliZSgoKSA9PiB0aGlzLnNjcm9sbFRvQm90dG9tKCkpKTtcclxuICAgICAgICB0aGlzLnNjcm9sbFRvQm90dG9tKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRldGFjaGVkQ2FsbGJhY2soKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHNjcm9sbFRvQm90dG9tKCkge1xyXG4gICAgICAgIGNvbnN0IGl0ZW0gPSA8YW55Pih0aGlzLmxhc3RFbGVtZW50Q2hpbGQgJiYgdGhpcy5sYXN0RWxlbWVudENoaWxkLmxhc3RFbGVtZW50Q2hpbGQpO1xyXG4gICAgICAgIGlmIChpdGVtKSBpdGVtLnNjcm9sbEludG9WaWV3SWZOZWVkZWQoKTtcclxuICAgIH1cclxufVxyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
