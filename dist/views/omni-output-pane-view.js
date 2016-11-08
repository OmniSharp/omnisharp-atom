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
        _classCallCheck(this, OutputWindow);

        var _this = _possibleConstructorReturn(this, (OutputWindow.__proto__ || Object.getPrototypeOf(OutputWindow)).apply(this, arguments));

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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy9vbW5pLW91dHB1dC1wYW5lLXZpZXcuanMiLCJsaWIvdmlld3Mvb21uaS1vdXRwdXQtcGFuZS12aWV3LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQUNBOzs7O0FBQ0E7O0FBQ0E7Ozs7Ozs7Ozs7SUNHQTs7O0FBQUEsNEJBQUE7OztpSUFBa0MsWUFBbEM7O0FBQ1csY0FBQSxXQUFBLEdBQWMsY0FBZCxDQURYOztLQUFBOzs7OzBDQU0wQjtBQUNsQixpQkFBSyxRQUFMLEdBQWdCLHlCQUFoQixDQURrQjtBQUVsQixpQkFBSyxPQUFMLEdBQWUsRUFBZixDQUZrQjtBQUlsQixpQkFBSyxTQUFMLENBQWUsR0FBZixDQUFtQix1QkFBbkIsRUFBNEMscUJBQTVDLEVBSmtCO0FBS2xCLGlCQUFLLFFBQUwsR0FBZ0IsQ0FBQyxDQUFELENBTEU7Ozs7MkNBUUM7OztBQUNuQixpQkFBSyxVQUFMLEdBQWtCLHdDQUFsQixDQURtQjtBQUVuQixpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLDBCQUFPLE9BQVAsQ0FBZSxhQUFmLENBQTZCLFNBQTdCLENBQXVDLG1CQUFPO0FBQzlELGlDQUFFLElBQUYsQ0FBTyxPQUFLLFFBQUwsRUFBZTsyQkFBUyxNQUFNLE1BQU47aUJBQVQsQ0FBdEIsQ0FEOEQ7QUFFOUQsdUJBQUssV0FBTCxDQUFpQixPQUFqQixFQUY4RDthQUFQLENBQTNELEVBRm1CO0FBTW5CLGlCQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsMEJBQU8sT0FBUCxDQUFlLE1BQWYsQ0FBc0IsS0FBdEIsQ0FBNEIsR0FBNUIsRUFBaUMsU0FBakMsQ0FBMkM7dUJBQU0sT0FBSyxjQUFMO2FBQU4sQ0FBL0QsRUFObUI7QUFPbkIsaUJBQUssY0FBTCxHQVBtQjs7OzsyQ0FVQTtBQUNuQixpQkFBSyxVQUFMLENBQWdCLE9BQWhCLEdBRG1COzs7O3lDQUlEO0FBQ2xCLGdCQUFNLE9BQWEsS0FBSyxnQkFBTCxJQUF5QixLQUFLLGdCQUFMLENBQXNCLGdCQUF0QixDQUQxQjtBQUVsQixnQkFBSSxJQUFKLEVBQVUsS0FBSyxzQkFBTCxHQUFWOzs7OztFQTlCMEI7O0FBa0M1QixRQUFTLFlBQVQsR0FBOEIsU0FBVSxlQUFWLENBQTBCLHlCQUExQixFQUFxRCxFQUFFLFdBQVcsYUFBYSxTQUFiLEVBQWxFLENBQTlCIiwiZmlsZSI6ImxpYi92aWV3cy9vbW5pLW91dHB1dC1wYW5lLXZpZXcuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb252ZXJ0IH0gZnJvbSBcIi4uL3NlcnZpY2VzL2Fuc2ktdG8taHRtbFwiO1xuaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xuaW1wb3J0IHsgc2VydmVyIH0gZnJvbSBcIi4uL2F0b20vc2VydmVyLWluZm9ybWF0aW9uXCI7XG5pbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlIH0gZnJvbSBcInRzLWRpc3Bvc2FibGVzXCI7XG5leHBvcnQgY2xhc3MgT3V0cHV0V2luZG93IGV4dGVuZHMgSFRNTERpdkVsZW1lbnQge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlciguLi5hcmd1bWVudHMpO1xuICAgICAgICB0aGlzLmRpc3BsYXlOYW1lID0gXCJPdXRwdXRXaW5kb3dcIjtcbiAgICB9XG4gICAgY3JlYXRlZENhbGxiYWNrKCkge1xuICAgICAgICB0aGlzLl9jb252ZXJ0ID0gbmV3IENvbnZlcnQoKTtcbiAgICAgICAgdGhpcy5fb3V0cHV0ID0gW107XG4gICAgICAgIHRoaXMuY2xhc3NMaXN0LmFkZChcIm9tbmktb3V0cHV0LXBhbmUtdmlld1wiLCBcIm5hdGl2ZS1rZXktYmluZGluZ3NcIik7XG4gICAgICAgIHRoaXMudGFiSW5kZXggPSAtMTtcbiAgICB9XG4gICAgYXR0YWNoZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChzZXJ2ZXIub2JzZXJ2ZS5vdXRwdXRFbGVtZW50LnN1YnNjcmliZShlbGVtZW50ID0+IHtcbiAgICAgICAgICAgIF8uZWFjaCh0aGlzLmNoaWxkcmVuLCBjaGlsZCA9PiBjaGlsZC5yZW1vdmUoKSk7XG4gICAgICAgICAgICB0aGlzLmFwcGVuZENoaWxkKGVsZW1lbnQpO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoc2VydmVyLm9ic2VydmUub3V0cHV0LmRlbGF5KDEwMCkuc3Vic2NyaWJlKCgpID0+IHRoaXMuc2Nyb2xsVG9Cb3R0b20oKSkpO1xuICAgICAgICB0aGlzLnNjcm9sbFRvQm90dG9tKCk7XG4gICAgfVxuICAgIGRldGFjaGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfVxuICAgIHNjcm9sbFRvQm90dG9tKCkge1xuICAgICAgICBjb25zdCBpdGVtID0gKHRoaXMubGFzdEVsZW1lbnRDaGlsZCAmJiB0aGlzLmxhc3RFbGVtZW50Q2hpbGQubGFzdEVsZW1lbnRDaGlsZCk7XG4gICAgICAgIGlmIChpdGVtKVxuICAgICAgICAgICAgaXRlbS5zY3JvbGxJbnRvVmlld0lmTmVlZGVkKCk7XG4gICAgfVxufVxuZXhwb3J0cy5PdXRwdXRXaW5kb3cgPSBkb2N1bWVudC5yZWdpc3RlckVsZW1lbnQoXCJvbW5pc2hhcnAtb3V0cHV0LXdpbmRvd1wiLCB7IHByb3RvdHlwZTogT3V0cHV0V2luZG93LnByb3RvdHlwZSB9KTtcbiIsIi8qIHRzbGludDpkaXNhYmxlOm5vLXN0cmluZy1saXRlcmFsICovXHJcbmltcG9ydCB7Q29udmVydH0gZnJvbSBcIi4uL3NlcnZpY2VzL2Fuc2ktdG8taHRtbFwiO1xyXG5pbXBvcnQgXyBmcm9tIFwibG9kYXNoXCI7XHJcbmltcG9ydCB7c2VydmVyfSBmcm9tIFwiLi4vYXRvbS9zZXJ2ZXItaW5mb3JtYXRpb25cIjtcclxuaW1wb3J0IHtDb21wb3NpdGVEaXNwb3NhYmxlfSBmcm9tIFwidHMtZGlzcG9zYWJsZXNcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBPdXRwdXRXaW5kb3cgZXh0ZW5kcyBIVE1MRGl2RWxlbWVudCBpbXBsZW1lbnRzIFdlYkNvbXBvbmVudCB7XHJcbiAgICBwdWJsaWMgZGlzcGxheU5hbWUgPSBcIk91dHB1dFdpbmRvd1wiO1xyXG4gICAgcHJpdmF0ZSBkaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xyXG4gICAgcHJpdmF0ZSBfY29udmVydDogYW55O1xyXG4gICAgcHJpdmF0ZSBfb3V0cHV0OiBPdXRwdXRNZXNzYWdlW107XHJcblxyXG4gICAgcHVibGljIGNyZWF0ZWRDYWxsYmFjaygpIHtcclxuICAgICAgICB0aGlzLl9jb252ZXJ0ID0gbmV3IENvbnZlcnQoKTtcclxuICAgICAgICB0aGlzLl9vdXRwdXQgPSBbXTtcclxuXHJcbiAgICAgICAgdGhpcy5jbGFzc0xpc3QuYWRkKFwib21uaS1vdXRwdXQtcGFuZS12aWV3XCIsIFwibmF0aXZlLWtleS1iaW5kaW5nc1wiKTtcclxuICAgICAgICB0aGlzLnRhYkluZGV4ID0gLTE7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGF0dGFjaGVkQ2FsbGJhY2soKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKHNlcnZlci5vYnNlcnZlLm91dHB1dEVsZW1lbnQuc3Vic2NyaWJlKGVsZW1lbnQgPT4ge1xyXG4gICAgICAgICAgICBfLmVhY2godGhpcy5jaGlsZHJlbiwgY2hpbGQgPT4gY2hpbGQucmVtb3ZlKCkpO1xyXG4gICAgICAgICAgICB0aGlzLmFwcGVuZENoaWxkKGVsZW1lbnQpO1xyXG4gICAgICAgIH0pKTtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKHNlcnZlci5vYnNlcnZlLm91dHB1dC5kZWxheSgxMDApLnN1YnNjcmliZSgoKSA9PiB0aGlzLnNjcm9sbFRvQm90dG9tKCkpKTtcclxuICAgICAgICB0aGlzLnNjcm9sbFRvQm90dG9tKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRldGFjaGVkQ2FsbGJhY2soKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHNjcm9sbFRvQm90dG9tKCkge1xyXG4gICAgICAgIGNvbnN0IGl0ZW0gPSA8YW55Pih0aGlzLmxhc3RFbGVtZW50Q2hpbGQgJiYgdGhpcy5sYXN0RWxlbWVudENoaWxkLmxhc3RFbGVtZW50Q2hpbGQpO1xyXG4gICAgICAgIGlmIChpdGVtKSBpdGVtLnNjcm9sbEludG9WaWV3SWZOZWVkZWQoKTtcclxuICAgIH1cclxufVxyXG5cclxuKDxhbnk+ZXhwb3J0cykuT3V0cHV0V2luZG93ID0gKDxhbnk+ZG9jdW1lbnQpLnJlZ2lzdGVyRWxlbWVudChcIm9tbmlzaGFycC1vdXRwdXQtd2luZG93XCIsIHsgcHJvdG90eXBlOiBPdXRwdXRXaW5kb3cucHJvdG90eXBlIH0pO1xyXG4iXX0=
