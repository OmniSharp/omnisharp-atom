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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy9idWlsZC1vdXRwdXQtcGFuZS12aWV3LmpzIiwibGliL3ZpZXdzL2J1aWxkLW91dHB1dC1wYW5lLXZpZXcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0FBQ0E7Ozs7QUFDQTs7QUFDQTs7Ozs7Ozs7OztJQ0dBLGlCLFdBQUEsaUI7OztBQUFBLGlDQUFBO0FBQUE7O0FBQUE7O0FBQUEsMENBQUEsSUFBQTtBQUFBLGdCQUFBO0FBQUE7O0FBQUEsd0tBQXVDLElBQXZDOztBQUNXLGNBQUEsV0FBQSxHQUFjLG1CQUFkO0FBRFg7QUFnQ0M7Ozs7MENBMUJ5QjtBQUNsQixpQkFBSyxRQUFMLEdBQWdCLHlCQUFoQjtBQUNBLGlCQUFLLE9BQUwsR0FBZSxFQUFmO0FBRUEsaUJBQUssU0FBTCxDQUFlLEdBQWYsQ0FBbUIsd0JBQW5CLEVBQTZDLHFCQUE3QztBQUNBLGlCQUFLLFFBQUwsR0FBZ0IsQ0FBQyxDQUFqQjtBQUNIOzs7MkNBRXNCO0FBQUE7O0FBQ25CLGlCQUFLLFVBQUwsR0FBa0IsMENBQWxCO0FBQ0EsaUJBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQiwwQkFBTyxPQUFQLENBQWUsYUFBZixDQUE2QixTQUE3QixDQUF1QyxtQkFBTztBQUM5RCxpQ0FBRSxJQUFGLENBQU8sT0FBSyxRQUFaLEVBQXNCO0FBQUEsMkJBQVMsTUFBTSxNQUFOLEVBQVQ7QUFBQSxpQkFBdEI7QUFDQSx1QkFBSyxXQUFMLENBQWlCLE9BQWpCO0FBQ0gsYUFIbUIsQ0FBcEI7QUFJQSxpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLDBCQUFPLE9BQVAsQ0FBZSxNQUFmLENBQXNCLEtBQXRCLENBQTRCLEdBQTVCLEVBQWlDLFNBQWpDLENBQTJDO0FBQUEsdUJBQU0sT0FBSyxjQUFMLEVBQU47QUFBQSxhQUEzQyxDQUFwQjtBQUNBLGlCQUFLLGNBQUw7QUFDSDs7OzJDQUVzQjtBQUNuQixpQkFBSyxVQUFMLENBQWdCLE9BQWhCO0FBQ0g7Ozt5Q0FFcUI7QUFDbEIsZ0JBQU0sT0FBYSxLQUFLLGdCQUFMLElBQXlCLEtBQUssZ0JBQUwsQ0FBc0IsZ0JBQWxFO0FBQ0EsZ0JBQUksSUFBSixFQUFVLEtBQUssc0JBQUw7QUFDYjs7OztFQS9Ca0MsYyIsImZpbGUiOiJsaWIvdmlld3MvYnVpbGQtb3V0cHV0LXBhbmUtdmlldy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbnZlcnQgfSBmcm9tIFwiLi4vc2VydmljZXMvYW5zaS10by1odG1sXCI7XG5pbXBvcnQgXyBmcm9tIFwibG9kYXNoXCI7XG5pbXBvcnQgeyBzZXJ2ZXIgfSBmcm9tIFwiLi4vYXRvbS9zZXJ2ZXItaW5mb3JtYXRpb25cIjtcbmltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUgfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xuZXhwb3J0IGNsYXNzIEJ1aWxkT3V0cHV0V2luZG93IGV4dGVuZHMgSFRNTERpdkVsZW1lbnQge1xuICAgIGNvbnN0cnVjdG9yKC4uLmFyZ3MpIHtcbiAgICAgICAgc3VwZXIoLi4uYXJncyk7XG4gICAgICAgIHRoaXMuZGlzcGxheU5hbWUgPSBcIkJ1aWxkT3V0cHV0V2luZG93XCI7XG4gICAgfVxuICAgIGNyZWF0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdGhpcy5fY29udmVydCA9IG5ldyBDb252ZXJ0KCk7XG4gICAgICAgIHRoaXMuX291dHB1dCA9IFtdO1xuICAgICAgICB0aGlzLmNsYXNzTGlzdC5hZGQoXCJidWlsZC1vdXRwdXQtcGFuZS12aWV3XCIsIFwibmF0aXZlLWtleS1iaW5kaW5nc1wiKTtcbiAgICAgICAgdGhpcy50YWJJbmRleCA9IC0xO1xuICAgIH1cbiAgICBhdHRhY2hlZENhbGxiYWNrKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKHNlcnZlci5vYnNlcnZlLm91dHB1dEVsZW1lbnQuc3Vic2NyaWJlKGVsZW1lbnQgPT4ge1xuICAgICAgICAgICAgXy5lYWNoKHRoaXMuY2hpbGRyZW4sIGNoaWxkID0+IGNoaWxkLnJlbW92ZSgpKTtcbiAgICAgICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQoZWxlbWVudCk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChzZXJ2ZXIub2JzZXJ2ZS5vdXRwdXQuZGVsYXkoMTAwKS5zdWJzY3JpYmUoKCkgPT4gdGhpcy5zY3JvbGxUb0JvdHRvbSgpKSk7XG4gICAgICAgIHRoaXMuc2Nyb2xsVG9Cb3R0b20oKTtcbiAgICB9XG4gICAgZGV0YWNoZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICB9XG4gICAgc2Nyb2xsVG9Cb3R0b20oKSB7XG4gICAgICAgIGNvbnN0IGl0ZW0gPSAodGhpcy5sYXN0RWxlbWVudENoaWxkICYmIHRoaXMubGFzdEVsZW1lbnRDaGlsZC5sYXN0RWxlbWVudENoaWxkKTtcbiAgICAgICAgaWYgKGl0ZW0pXG4gICAgICAgICAgICBpdGVtLnNjcm9sbEludG9WaWV3SWZOZWVkZWQoKTtcbiAgICB9XG59XG4iLCIvKiB0c2xpbnQ6ZGlzYWJsZTpuby1zdHJpbmctbGl0ZXJhbCAqL1xyXG5pbXBvcnQge0NvbnZlcnR9IGZyb20gXCIuLi9zZXJ2aWNlcy9hbnNpLXRvLWh0bWxcIjtcclxuaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xyXG5pbXBvcnQge3NlcnZlcn0gZnJvbSBcIi4uL2F0b20vc2VydmVyLWluZm9ybWF0aW9uXCI7XHJcbmltcG9ydCB7Q29tcG9zaXRlRGlzcG9zYWJsZX0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBCdWlsZE91dHB1dFdpbmRvdyBleHRlbmRzIEhUTUxEaXZFbGVtZW50IGltcGxlbWVudHMgV2ViQ29tcG9uZW50IHtcclxuICAgIHB1YmxpYyBkaXNwbGF5TmFtZSA9IFwiQnVpbGRPdXRwdXRXaW5kb3dcIjtcclxuICAgIHByaXZhdGUgX2NvbnZlcnQ6IGFueTtcclxuICAgIHByaXZhdGUgX291dHB1dDogT3V0cHV0TWVzc2FnZVtdO1xyXG4gICAgcHJpdmF0ZSBkaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xyXG5cclxuICAgIHB1YmxpYyBjcmVhdGVkQ2FsbGJhY2soKSB7XHJcbiAgICAgICAgdGhpcy5fY29udmVydCA9IG5ldyBDb252ZXJ0KCk7XHJcbiAgICAgICAgdGhpcy5fb3V0cHV0ID0gW107XHJcblxyXG4gICAgICAgIHRoaXMuY2xhc3NMaXN0LmFkZChcImJ1aWxkLW91dHB1dC1wYW5lLXZpZXdcIiwgXCJuYXRpdmUta2V5LWJpbmRpbmdzXCIpO1xyXG4gICAgICAgIHRoaXMudGFiSW5kZXggPSAtMTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgYXR0YWNoZWRDYWxsYmFjaygpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoc2VydmVyLm9ic2VydmUub3V0cHV0RWxlbWVudC5zdWJzY3JpYmUoZWxlbWVudCA9PiB7XHJcbiAgICAgICAgICAgIF8uZWFjaCh0aGlzLmNoaWxkcmVuLCBjaGlsZCA9PiBjaGlsZC5yZW1vdmUoKSk7XHJcbiAgICAgICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQoZWxlbWVudCk7XHJcbiAgICAgICAgfSkpO1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoc2VydmVyLm9ic2VydmUub3V0cHV0LmRlbGF5KDEwMCkuc3Vic2NyaWJlKCgpID0+IHRoaXMuc2Nyb2xsVG9Cb3R0b20oKSkpO1xyXG4gICAgICAgIHRoaXMuc2Nyb2xsVG9Cb3R0b20oKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGV0YWNoZWRDYWxsYmFjaygpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgc2Nyb2xsVG9Cb3R0b20oKSB7XHJcbiAgICAgICAgY29uc3QgaXRlbSA9IDxhbnk+KHRoaXMubGFzdEVsZW1lbnRDaGlsZCAmJiB0aGlzLmxhc3RFbGVtZW50Q2hpbGQubGFzdEVsZW1lbnRDaGlsZCk7XHJcbiAgICAgICAgaWYgKGl0ZW0pIGl0ZW0uc2Nyb2xsSW50b1ZpZXdJZk5lZWRlZCgpO1xyXG4gICAgfVxyXG59XHJcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
