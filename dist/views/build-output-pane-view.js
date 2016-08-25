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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy9idWlsZC1vdXRwdXQtcGFuZS12aWV3LmpzIiwibGliL3ZpZXdzL2J1aWxkLW91dHB1dC1wYW5lLXZpZXcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0FBQ0E7Ozs7QUFDQTs7QUFDQTs7Ozs7Ozs7OztJQ0dBOzs7QUFBQSxpQ0FBQTs7Ozs7MENBQUE7O1NBQUE7O3dLQUF1QyxRQUF2Qzs7QUFDVyxjQUFBLFdBQUEsR0FBYyxtQkFBZCxDQURYOztLQUFBOzs7OzBDQU0wQjtBQUNsQixpQkFBSyxRQUFMLEdBQWdCLHlCQUFoQixDQURrQjtBQUVsQixpQkFBSyxPQUFMLEdBQWUsRUFBZixDQUZrQjtBQUlsQixpQkFBSyxTQUFMLENBQWUsR0FBZixDQUFtQix3QkFBbkIsRUFBNkMscUJBQTdDLEVBSmtCO0FBS2xCLGlCQUFLLFFBQUwsR0FBZ0IsQ0FBQyxDQUFELENBTEU7Ozs7MkNBUUM7OztBQUNuQixpQkFBSyxVQUFMLEdBQWtCLHdDQUFsQixDQURtQjtBQUVuQixpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLDBCQUFPLE9BQVAsQ0FBZSxhQUFmLENBQTZCLFNBQTdCLENBQXVDLG1CQUFPO0FBQzlELGlDQUFFLElBQUYsQ0FBTyxPQUFLLFFBQUwsRUFBZTsyQkFBUyxNQUFNLE1BQU47aUJBQVQsQ0FBdEIsQ0FEOEQ7QUFFOUQsdUJBQUssV0FBTCxDQUFpQixPQUFqQixFQUY4RDthQUFQLENBQTNELEVBRm1CO0FBTW5CLGlCQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsMEJBQU8sT0FBUCxDQUFlLE1BQWYsQ0FBc0IsS0FBdEIsQ0FBNEIsR0FBNUIsRUFBaUMsU0FBakMsQ0FBMkM7dUJBQU0sT0FBSyxjQUFMO2FBQU4sQ0FBL0QsRUFObUI7QUFPbkIsaUJBQUssY0FBTCxHQVBtQjs7OzsyQ0FVQTtBQUNuQixpQkFBSyxVQUFMLENBQWdCLE9BQWhCLEdBRG1COzs7O3lDQUlEO0FBQ2xCLGdCQUFNLE9BQWEsS0FBSyxnQkFBTCxJQUF5QixLQUFLLGdCQUFMLENBQXNCLGdCQUF0QixDQUQxQjtBQUVsQixnQkFBSSxJQUFKLEVBQVUsS0FBSyxzQkFBTCxHQUFWOzs7OztFQTlCK0IiLCJmaWxlIjoibGliL3ZpZXdzL2J1aWxkLW91dHB1dC1wYW5lLXZpZXcuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb252ZXJ0IH0gZnJvbSBcIi4uL3NlcnZpY2VzL2Fuc2ktdG8taHRtbFwiO1xuaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xuaW1wb3J0IHsgc2VydmVyIH0gZnJvbSBcIi4uL2F0b20vc2VydmVyLWluZm9ybWF0aW9uXCI7XG5pbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlIH0gZnJvbSBcInRzLWRpc3Bvc2FibGVzXCI7XG5leHBvcnQgY2xhc3MgQnVpbGRPdXRwdXRXaW5kb3cgZXh0ZW5kcyBIVE1MRGl2RWxlbWVudCB7XG4gICAgY29uc3RydWN0b3IoLi4uYXJncykge1xuICAgICAgICBzdXBlciguLi5hcmdzKTtcbiAgICAgICAgdGhpcy5kaXNwbGF5TmFtZSA9IFwiQnVpbGRPdXRwdXRXaW5kb3dcIjtcbiAgICB9XG4gICAgY3JlYXRlZENhbGxiYWNrKCkge1xuICAgICAgICB0aGlzLl9jb252ZXJ0ID0gbmV3IENvbnZlcnQoKTtcbiAgICAgICAgdGhpcy5fb3V0cHV0ID0gW107XG4gICAgICAgIHRoaXMuY2xhc3NMaXN0LmFkZChcImJ1aWxkLW91dHB1dC1wYW5lLXZpZXdcIiwgXCJuYXRpdmUta2V5LWJpbmRpbmdzXCIpO1xuICAgICAgICB0aGlzLnRhYkluZGV4ID0gLTE7XG4gICAgfVxuICAgIGF0dGFjaGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoc2VydmVyLm9ic2VydmUub3V0cHV0RWxlbWVudC5zdWJzY3JpYmUoZWxlbWVudCA9PiB7XG4gICAgICAgICAgICBfLmVhY2godGhpcy5jaGlsZHJlbiwgY2hpbGQgPT4gY2hpbGQucmVtb3ZlKCkpO1xuICAgICAgICAgICAgdGhpcy5hcHBlbmRDaGlsZChlbGVtZW50KTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKHNlcnZlci5vYnNlcnZlLm91dHB1dC5kZWxheSgxMDApLnN1YnNjcmliZSgoKSA9PiB0aGlzLnNjcm9sbFRvQm90dG9tKCkpKTtcbiAgICAgICAgdGhpcy5zY3JvbGxUb0JvdHRvbSgpO1xuICAgIH1cbiAgICBkZXRhY2hlZENhbGxiYWNrKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgIH1cbiAgICBzY3JvbGxUb0JvdHRvbSgpIHtcbiAgICAgICAgY29uc3QgaXRlbSA9ICh0aGlzLmxhc3RFbGVtZW50Q2hpbGQgJiYgdGhpcy5sYXN0RWxlbWVudENoaWxkLmxhc3RFbGVtZW50Q2hpbGQpO1xuICAgICAgICBpZiAoaXRlbSlcbiAgICAgICAgICAgIGl0ZW0uc2Nyb2xsSW50b1ZpZXdJZk5lZWRlZCgpO1xuICAgIH1cbn1cbiIsIi8qIHRzbGludDpkaXNhYmxlOm5vLXN0cmluZy1saXRlcmFsICovXHJcbmltcG9ydCB7Q29udmVydH0gZnJvbSBcIi4uL3NlcnZpY2VzL2Fuc2ktdG8taHRtbFwiO1xyXG5pbXBvcnQgXyBmcm9tIFwibG9kYXNoXCI7XHJcbmltcG9ydCB7c2VydmVyfSBmcm9tIFwiLi4vYXRvbS9zZXJ2ZXItaW5mb3JtYXRpb25cIjtcclxuaW1wb3J0IHtDb21wb3NpdGVEaXNwb3NhYmxlfSBmcm9tIFwidHMtZGlzcG9zYWJsZXNcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBCdWlsZE91dHB1dFdpbmRvdyBleHRlbmRzIEhUTUxEaXZFbGVtZW50IGltcGxlbWVudHMgV2ViQ29tcG9uZW50IHtcclxuICAgIHB1YmxpYyBkaXNwbGF5TmFtZSA9IFwiQnVpbGRPdXRwdXRXaW5kb3dcIjtcclxuICAgIHByaXZhdGUgX2NvbnZlcnQ6IGFueTtcclxuICAgIHByaXZhdGUgX291dHB1dDogT3V0cHV0TWVzc2FnZVtdO1xyXG4gICAgcHJpdmF0ZSBkaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xyXG5cclxuICAgIHB1YmxpYyBjcmVhdGVkQ2FsbGJhY2soKSB7XHJcbiAgICAgICAgdGhpcy5fY29udmVydCA9IG5ldyBDb252ZXJ0KCk7XHJcbiAgICAgICAgdGhpcy5fb3V0cHV0ID0gW107XHJcblxyXG4gICAgICAgIHRoaXMuY2xhc3NMaXN0LmFkZChcImJ1aWxkLW91dHB1dC1wYW5lLXZpZXdcIiwgXCJuYXRpdmUta2V5LWJpbmRpbmdzXCIpO1xyXG4gICAgICAgIHRoaXMudGFiSW5kZXggPSAtMTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgYXR0YWNoZWRDYWxsYmFjaygpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoc2VydmVyLm9ic2VydmUub3V0cHV0RWxlbWVudC5zdWJzY3JpYmUoZWxlbWVudCA9PiB7XHJcbiAgICAgICAgICAgIF8uZWFjaCh0aGlzLmNoaWxkcmVuLCBjaGlsZCA9PiBjaGlsZC5yZW1vdmUoKSk7XHJcbiAgICAgICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQoZWxlbWVudCk7XHJcbiAgICAgICAgfSkpO1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoc2VydmVyLm9ic2VydmUub3V0cHV0LmRlbGF5KDEwMCkuc3Vic2NyaWJlKCgpID0+IHRoaXMuc2Nyb2xsVG9Cb3R0b20oKSkpO1xyXG4gICAgICAgIHRoaXMuc2Nyb2xsVG9Cb3R0b20oKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGV0YWNoZWRDYWxsYmFjaygpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgc2Nyb2xsVG9Cb3R0b20oKSB7XHJcbiAgICAgICAgY29uc3QgaXRlbSA9IDxhbnk+KHRoaXMubGFzdEVsZW1lbnRDaGlsZCAmJiB0aGlzLmxhc3RFbGVtZW50Q2hpbGQubGFzdEVsZW1lbnRDaGlsZCk7XHJcbiAgICAgICAgaWYgKGl0ZW0pIGl0ZW0uc2Nyb2xsSW50b1ZpZXdJZk5lZWRlZCgpO1xyXG4gICAgfVxyXG59XHJcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
