"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.CommandOutputWindow = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var CommandOutputWindow = exports.CommandOutputWindow = function (_HTMLDivElement) {
    _inherits(CommandOutputWindow, _HTMLDivElement);

    function CommandOutputWindow() {
        var _Object$getPrototypeO;

        _classCallCheck(this, CommandOutputWindow);

        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
        }

        var _this = _possibleConstructorReturn(this, (_Object$getPrototypeO = Object.getPrototypeOf(CommandOutputWindow)).call.apply(_Object$getPrototypeO, [this].concat(args)));

        _this.displayName = "CommandOutputWindow";
        return _this;
    }

    _createClass(CommandOutputWindow, [{
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
            pre.innerText = item.message.trim();
            this._container.appendChild(pre);
            this._scrollToBottom();
        }
    }]);

    return CommandOutputWindow;
}(HTMLDivElement);

exports.CommandOutputWindow = document.registerElement("omnisharp-command-output", { prototype: CommandOutputWindow.prototype });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy9jb21tYW5kLW91dHB1dC13aW5kb3cuanMiLCJsaWIvdmlld3MvY29tbWFuZC1vdXRwdXQtd2luZG93LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOzs7Ozs7Ozs7Ozs7SUNHQTs7O0FBQUEsbUNBQUE7Ozs7OzBDQUFBOztTQUFBOzswS0FBeUMsUUFBekM7O0FBQ1csY0FBQSxXQUFBLEdBQWMscUJBQWQsQ0FEWDs7S0FBQTs7OzswQ0FLMEI7OztBQUNsQixpQkFBSyxTQUFMLENBQWUsR0FBZixDQUFtQix1QkFBbkIsRUFBMkMscUJBQTNDLEVBRGtCO0FBRWxCLGlCQUFLLFFBQUwsR0FBZ0IsQ0FBQyxDQUFELENBRkU7QUFJbEIsaUJBQUssVUFBTCxHQUFrQixTQUFTLGFBQVQsQ0FBdUIsS0FBdkIsQ0FBbEIsQ0FKa0I7QUFLbEIsaUJBQUssVUFBTCxDQUFnQixTQUFoQixDQUEwQixHQUExQixDQUE4QixvQkFBOUIsRUFMa0I7QUFNbEIsaUJBQUssV0FBTCxDQUFpQixLQUFLLFVBQUwsQ0FBakIsQ0FOa0I7QUFRbEIsaUJBQUssZUFBTCxHQUF1QixpQkFBRSxRQUFGLENBQVcsWUFBQTtBQUM5QixvQkFBTSxPQUFhLE9BQUssZ0JBQUwsSUFBeUIsT0FBSyxnQkFBTCxDQUFzQixnQkFBdEIsQ0FEZDtBQUU5QixvQkFBSSxJQUFKLEVBQVUsS0FBSyxzQkFBTCxHQUFWO2FBRjhCLEVBRy9CLEdBSG9CLEVBR2YsRUFBRSxVQUFVLElBQVYsRUFIYSxDQUF2QixDQVJrQjs7OzsyQ0FjQztBQUNuQiw2QkFBRSxLQUFGLENBQVEsS0FBSyxlQUFMLEVBQXNCLElBQTlCLEVBRG1COzs7O21DQUlMLE1BQXlCO0FBQ3ZDLGdCQUFNLE1BQU0sU0FBUyxhQUFULENBQXVCLEtBQXZCLENBQU4sQ0FEaUM7QUFFdkMsZ0JBQUksU0FBSixHQUFnQixLQUFLLE9BQUwsQ0FBYSxJQUFiLEVBQWhCLENBRnVDO0FBSXZDLGlCQUFLLFVBQUwsQ0FBZ0IsV0FBaEIsQ0FBNEIsR0FBNUIsRUFKdUM7QUFLdkMsaUJBQUssZUFBTCxHQUx1Qzs7Ozs7RUF2Qk47O0FBZ0NuQyxRQUFTLG1CQUFULEdBQXFDLFNBQVUsZUFBVixDQUEwQiwwQkFBMUIsRUFBc0QsRUFBRSxXQUFXLG9CQUFvQixTQUFwQixFQUFuRSxDQUFyQyIsImZpbGUiOiJsaWIvdmlld3MvY29tbWFuZC1vdXRwdXQtd2luZG93LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xuZXhwb3J0IGNsYXNzIENvbW1hbmRPdXRwdXRXaW5kb3cgZXh0ZW5kcyBIVE1MRGl2RWxlbWVudCB7XG4gICAgY29uc3RydWN0b3IoLi4uYXJncykge1xuICAgICAgICBzdXBlciguLi5hcmdzKTtcbiAgICAgICAgdGhpcy5kaXNwbGF5TmFtZSA9IFwiQ29tbWFuZE91dHB1dFdpbmRvd1wiO1xuICAgIH1cbiAgICBjcmVhdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMuY2xhc3NMaXN0LmFkZChcIm9tbmktb3V0cHV0LXBhbmUtdmlld1wiLCBcIm5hdGl2ZS1rZXktYmluZGluZ3NcIik7XG4gICAgICAgIHRoaXMudGFiSW5kZXggPSAtMTtcbiAgICAgICAgdGhpcy5fY29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgdGhpcy5fY29udGFpbmVyLmNsYXNzTGlzdC5hZGQoXCJtZXNzYWdlcy1jb250YWluZXJcIik7XG4gICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQodGhpcy5fY29udGFpbmVyKTtcbiAgICAgICAgdGhpcy5fc2Nyb2xsVG9Cb3R0b20gPSBfLnRocm90dGxlKCgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGl0ZW0gPSAodGhpcy5sYXN0RWxlbWVudENoaWxkICYmIHRoaXMubGFzdEVsZW1lbnRDaGlsZC5sYXN0RWxlbWVudENoaWxkKTtcbiAgICAgICAgICAgIGlmIChpdGVtKVxuICAgICAgICAgICAgICAgIGl0ZW0uc2Nyb2xsSW50b1ZpZXdJZk5lZWRlZCgpO1xuICAgICAgICB9LCAxMDAsIHsgdHJhaWxpbmc6IHRydWUgfSk7XG4gICAgfVxuICAgIGF0dGFjaGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIF8uZGVmZXIodGhpcy5fc2Nyb2xsVG9Cb3R0b20sIHRoaXMpO1xuICAgIH1cbiAgICBhZGRNZXNzYWdlKGl0ZW0pIHtcbiAgICAgICAgY29uc3QgcHJlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInByZVwiKTtcbiAgICAgICAgcHJlLmlubmVyVGV4dCA9IGl0ZW0ubWVzc2FnZS50cmltKCk7XG4gICAgICAgIHRoaXMuX2NvbnRhaW5lci5hcHBlbmRDaGlsZChwcmUpO1xuICAgICAgICB0aGlzLl9zY3JvbGxUb0JvdHRvbSgpO1xuICAgIH1cbn1cbmV4cG9ydHMuQ29tbWFuZE91dHB1dFdpbmRvdyA9IGRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudChcIm9tbmlzaGFycC1jb21tYW5kLW91dHB1dFwiLCB7IHByb3RvdHlwZTogQ29tbWFuZE91dHB1dFdpbmRvdy5wcm90b3R5cGUgfSk7XG4iLCIvKiB0c2xpbnQ6ZGlzYWJsZTpuby1zdHJpbmctbGl0ZXJhbCAqL1xyXG5pbXBvcnQgXyBmcm9tIFwibG9kYXNoXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgQ29tbWFuZE91dHB1dFdpbmRvdyBleHRlbmRzIEhUTUxEaXZFbGVtZW50IGltcGxlbWVudHMgV2ViQ29tcG9uZW50IHtcclxuICAgIHB1YmxpYyBkaXNwbGF5TmFtZSA9IFwiQ29tbWFuZE91dHB1dFdpbmRvd1wiO1xyXG4gICAgcHJpdmF0ZSBfY29udGFpbmVyOiBIVE1MRGl2RWxlbWVudDtcclxuICAgIHByaXZhdGUgX3Njcm9sbFRvQm90dG9tOiAoKSA9PiB2b2lkO1xyXG5cclxuICAgIHB1YmxpYyBjcmVhdGVkQ2FsbGJhY2soKSB7XHJcbiAgICAgICAgdGhpcy5jbGFzc0xpc3QuYWRkKFwib21uaS1vdXRwdXQtcGFuZS12aWV3XCIsXCJuYXRpdmUta2V5LWJpbmRpbmdzXCIpO1xyXG4gICAgICAgIHRoaXMudGFiSW5kZXggPSAtMTtcclxuXHJcbiAgICAgICAgdGhpcy5fY29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuICAgICAgICB0aGlzLl9jb250YWluZXIuY2xhc3NMaXN0LmFkZChcIm1lc3NhZ2VzLWNvbnRhaW5lclwiKTtcclxuICAgICAgICB0aGlzLmFwcGVuZENoaWxkKHRoaXMuX2NvbnRhaW5lcik7XHJcblxyXG4gICAgICAgIHRoaXMuX3Njcm9sbFRvQm90dG9tID0gXy50aHJvdHRsZSgoKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IGl0ZW0gPSA8YW55Pih0aGlzLmxhc3RFbGVtZW50Q2hpbGQgJiYgdGhpcy5sYXN0RWxlbWVudENoaWxkLmxhc3RFbGVtZW50Q2hpbGQpO1xyXG4gICAgICAgICAgICBpZiAoaXRlbSkgaXRlbS5zY3JvbGxJbnRvVmlld0lmTmVlZGVkKCk7XHJcbiAgICAgICAgfSwgMTAwLCB7IHRyYWlsaW5nOiB0cnVlIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBhdHRhY2hlZENhbGxiYWNrKCkge1xyXG4gICAgICAgIF8uZGVmZXIodGhpcy5fc2Nyb2xsVG9Cb3R0b20sIHRoaXMpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBhZGRNZXNzYWdlKGl0ZW06IHsgbWVzc2FnZTogc3RyaW5nIH0pIHtcclxuICAgICAgICBjb25zdCBwcmUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwicHJlXCIpO1xyXG4gICAgICAgIHByZS5pbm5lclRleHQgPSBpdGVtLm1lc3NhZ2UudHJpbSgpO1xyXG5cclxuICAgICAgICB0aGlzLl9jb250YWluZXIuYXBwZW5kQ2hpbGQocHJlKTtcclxuICAgICAgICB0aGlzLl9zY3JvbGxUb0JvdHRvbSgpO1xyXG4gICAgfVxyXG59XHJcblxyXG4oPGFueT5leHBvcnRzKS5Db21tYW5kT3V0cHV0V2luZG93ID0gKDxhbnk+ZG9jdW1lbnQpLnJlZ2lzdGVyRWxlbWVudChcIm9tbmlzaGFycC1jb21tYW5kLW91dHB1dFwiLCB7IHByb3RvdHlwZTogQ29tbWFuZE91dHB1dFdpbmRvdy5wcm90b3R5cGUgfSk7XHJcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
