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

var _omnisharpClient = require("omnisharp-client");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var OutputWindow = exports.OutputWindow = function (_HTMLDivElement) {
    _inherits(OutputWindow, _HTMLDivElement);

    function OutputWindow() {
        var _Object$getPrototypeO;

        _classCallCheck(this, OutputWindow);

        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
        }

        var _this = _possibleConstructorReturn(this, (_Object$getPrototypeO = Object.getPrototypeOf(OutputWindow)).call.apply(_Object$getPrototypeO, [this].concat(args)));

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

    return OutputWindow;
}(HTMLDivElement);

exports.OutputWindow = document.registerElement("omnisharp-output-window", { prototype: OutputWindow.prototype });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy9vbW5pLW91dHB1dC1wYW5lLXZpZXcuanMiLCJsaWIvdmlld3Mvb21uaS1vdXRwdXQtcGFuZS12aWV3LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQUNBOzs7O0FBQ0E7O0FBQ0E7Ozs7Ozs7Ozs7SUNHQTs7O0FBQUEsNEJBQUE7Ozs7OzBDQUFBOztTQUFBOzttS0FBa0MsUUFBbEM7O0FBQ1csY0FBQSxXQUFBLEdBQWMsY0FBZCxDQURYOztLQUFBOzs7OzBDQU0wQjtBQUNsQixpQkFBSyxRQUFMLEdBQWdCLHlCQUFoQixDQURrQjtBQUVsQixpQkFBSyxPQUFMLEdBQWUsRUFBZixDQUZrQjtBQUlsQixpQkFBSyxTQUFMLENBQWUsR0FBZixDQUFtQix1QkFBbkIsRUFBNEMscUJBQTVDLEVBSmtCO0FBS2xCLGlCQUFLLFFBQUwsR0FBZ0IsQ0FBQyxDQUFELENBTEU7Ozs7MkNBUUM7OztBQUNuQixpQkFBSyxVQUFMLEdBQWtCLDBDQUFsQixDQURtQjtBQUVuQixpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLDBCQUFPLE9BQVAsQ0FBZSxhQUFmLENBQTZCLFNBQTdCLENBQXVDLG1CQUFPO0FBQzlELGlDQUFFLElBQUYsQ0FBTyxPQUFLLFFBQUwsRUFBZTsyQkFBUyxNQUFNLE1BQU47aUJBQVQsQ0FBdEIsQ0FEOEQ7QUFFOUQsdUJBQUssV0FBTCxDQUFpQixPQUFqQixFQUY4RDthQUFQLENBQTNELEVBRm1CO0FBTW5CLGlCQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsMEJBQU8sT0FBUCxDQUFlLE1BQWYsQ0FBc0IsS0FBdEIsQ0FBNEIsR0FBNUIsRUFBaUMsU0FBakMsQ0FBMkM7dUJBQU0sT0FBSyxjQUFMO2FBQU4sQ0FBL0QsRUFObUI7QUFPbkIsaUJBQUssY0FBTCxHQVBtQjs7OzsyQ0FVQTtBQUNuQixpQkFBSyxVQUFMLENBQWdCLE9BQWhCLEdBRG1COzs7O3lDQUlEO0FBQ2xCLGdCQUFNLE9BQWEsS0FBSyxnQkFBTCxJQUF5QixLQUFLLGdCQUFMLENBQXNCLGdCQUF0QixDQUQxQjtBQUVsQixnQkFBSSxJQUFKLEVBQVUsS0FBSyxzQkFBTCxHQUFWOzs7OztFQTlCMEI7O0FBa0M1QixRQUFTLFlBQVQsR0FBOEIsU0FBVSxlQUFWLENBQTBCLHlCQUExQixFQUFxRCxFQUFFLFdBQVcsYUFBYSxTQUFiLEVBQWxFLENBQTlCIiwiZmlsZSI6ImxpYi92aWV3cy9vbW5pLW91dHB1dC1wYW5lLXZpZXcuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb252ZXJ0IH0gZnJvbSBcIi4uL3NlcnZpY2VzL2Fuc2ktdG8taHRtbFwiO1xuaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xuaW1wb3J0IHsgc2VydmVyIH0gZnJvbSBcIi4uL2F0b20vc2VydmVyLWluZm9ybWF0aW9uXCI7XG5pbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlIH0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcbmV4cG9ydCBjbGFzcyBPdXRwdXRXaW5kb3cgZXh0ZW5kcyBIVE1MRGl2RWxlbWVudCB7XG4gICAgY29uc3RydWN0b3IoLi4uYXJncykge1xuICAgICAgICBzdXBlciguLi5hcmdzKTtcbiAgICAgICAgdGhpcy5kaXNwbGF5TmFtZSA9IFwiT3V0cHV0V2luZG93XCI7XG4gICAgfVxuICAgIGNyZWF0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdGhpcy5fY29udmVydCA9IG5ldyBDb252ZXJ0KCk7XG4gICAgICAgIHRoaXMuX291dHB1dCA9IFtdO1xuICAgICAgICB0aGlzLmNsYXNzTGlzdC5hZGQoXCJvbW5pLW91dHB1dC1wYW5lLXZpZXdcIiwgXCJuYXRpdmUta2V5LWJpbmRpbmdzXCIpO1xuICAgICAgICB0aGlzLnRhYkluZGV4ID0gLTE7XG4gICAgfVxuICAgIGF0dGFjaGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoc2VydmVyLm9ic2VydmUub3V0cHV0RWxlbWVudC5zdWJzY3JpYmUoZWxlbWVudCA9PiB7XG4gICAgICAgICAgICBfLmVhY2godGhpcy5jaGlsZHJlbiwgY2hpbGQgPT4gY2hpbGQucmVtb3ZlKCkpO1xuICAgICAgICAgICAgdGhpcy5hcHBlbmRDaGlsZChlbGVtZW50KTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKHNlcnZlci5vYnNlcnZlLm91dHB1dC5kZWxheSgxMDApLnN1YnNjcmliZSgoKSA9PiB0aGlzLnNjcm9sbFRvQm90dG9tKCkpKTtcbiAgICAgICAgdGhpcy5zY3JvbGxUb0JvdHRvbSgpO1xuICAgIH1cbiAgICBkZXRhY2hlZENhbGxiYWNrKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgIH1cbiAgICBzY3JvbGxUb0JvdHRvbSgpIHtcbiAgICAgICAgY29uc3QgaXRlbSA9ICh0aGlzLmxhc3RFbGVtZW50Q2hpbGQgJiYgdGhpcy5sYXN0RWxlbWVudENoaWxkLmxhc3RFbGVtZW50Q2hpbGQpO1xuICAgICAgICBpZiAoaXRlbSlcbiAgICAgICAgICAgIGl0ZW0uc2Nyb2xsSW50b1ZpZXdJZk5lZWRlZCgpO1xuICAgIH1cbn1cbmV4cG9ydHMuT3V0cHV0V2luZG93ID0gZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50KFwib21uaXNoYXJwLW91dHB1dC13aW5kb3dcIiwgeyBwcm90b3R5cGU6IE91dHB1dFdpbmRvdy5wcm90b3R5cGUgfSk7XG4iLCIvKiB0c2xpbnQ6ZGlzYWJsZTpuby1zdHJpbmctbGl0ZXJhbCAqL1xyXG5pbXBvcnQge0NvbnZlcnR9IGZyb20gXCIuLi9zZXJ2aWNlcy9hbnNpLXRvLWh0bWxcIjtcclxuaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xyXG5pbXBvcnQge3NlcnZlcn0gZnJvbSBcIi4uL2F0b20vc2VydmVyLWluZm9ybWF0aW9uXCI7XHJcbmltcG9ydCB7Q29tcG9zaXRlRGlzcG9zYWJsZX0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBPdXRwdXRXaW5kb3cgZXh0ZW5kcyBIVE1MRGl2RWxlbWVudCBpbXBsZW1lbnRzIFdlYkNvbXBvbmVudCB7XHJcbiAgICBwdWJsaWMgZGlzcGxheU5hbWUgPSBcIk91dHB1dFdpbmRvd1wiO1xyXG4gICAgcHJpdmF0ZSBkaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xyXG4gICAgcHJpdmF0ZSBfY29udmVydDogYW55O1xyXG4gICAgcHJpdmF0ZSBfb3V0cHV0OiBPdXRwdXRNZXNzYWdlW107XHJcblxyXG4gICAgcHVibGljIGNyZWF0ZWRDYWxsYmFjaygpIHtcclxuICAgICAgICB0aGlzLl9jb252ZXJ0ID0gbmV3IENvbnZlcnQoKTtcclxuICAgICAgICB0aGlzLl9vdXRwdXQgPSBbXTtcclxuXHJcbiAgICAgICAgdGhpcy5jbGFzc0xpc3QuYWRkKFwib21uaS1vdXRwdXQtcGFuZS12aWV3XCIsIFwibmF0aXZlLWtleS1iaW5kaW5nc1wiKTtcclxuICAgICAgICB0aGlzLnRhYkluZGV4ID0gLTE7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGF0dGFjaGVkQ2FsbGJhY2soKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKHNlcnZlci5vYnNlcnZlLm91dHB1dEVsZW1lbnQuc3Vic2NyaWJlKGVsZW1lbnQgPT4ge1xyXG4gICAgICAgICAgICBfLmVhY2godGhpcy5jaGlsZHJlbiwgY2hpbGQgPT4gY2hpbGQucmVtb3ZlKCkpO1xyXG4gICAgICAgICAgICB0aGlzLmFwcGVuZENoaWxkKGVsZW1lbnQpO1xyXG4gICAgICAgIH0pKTtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKHNlcnZlci5vYnNlcnZlLm91dHB1dC5kZWxheSgxMDApLnN1YnNjcmliZSgoKSA9PiB0aGlzLnNjcm9sbFRvQm90dG9tKCkpKTtcclxuICAgICAgICB0aGlzLnNjcm9sbFRvQm90dG9tKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRldGFjaGVkQ2FsbGJhY2soKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHNjcm9sbFRvQm90dG9tKCkge1xyXG4gICAgICAgIGNvbnN0IGl0ZW0gPSA8YW55Pih0aGlzLmxhc3RFbGVtZW50Q2hpbGQgJiYgdGhpcy5sYXN0RWxlbWVudENoaWxkLmxhc3RFbGVtZW50Q2hpbGQpO1xyXG4gICAgICAgIGlmIChpdGVtKSBpdGVtLnNjcm9sbEludG9WaWV3SWZOZWVkZWQoKTtcclxuICAgIH1cclxufVxyXG5cclxuKDxhbnk+ZXhwb3J0cykuT3V0cHV0V2luZG93ID0gKDxhbnk+ZG9jdW1lbnQpLnJlZ2lzdGVyRWxlbWVudChcIm9tbmlzaGFycC1vdXRwdXQtd2luZG93XCIsIHsgcHJvdG90eXBlOiBPdXRwdXRXaW5kb3cucHJvdG90eXBlIH0pO1xyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
