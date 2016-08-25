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
        var _ref;

        _classCallCheck(this, CommandOutputWindow);

        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
        }

        var _this = _possibleConstructorReturn(this, (_ref = CommandOutputWindow.__proto__ || Object.getPrototypeOf(CommandOutputWindow)).call.apply(_ref, [this].concat(args)));

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy9jb21tYW5kLW91dHB1dC13aW5kb3cuanMiLCJsaWIvdmlld3MvY29tbWFuZC1vdXRwdXQtd2luZG93LnRzIl0sIm5hbWVzIjpbIkNvbW1hbmRPdXRwdXRXaW5kb3ciLCJhcmdzIiwiZGlzcGxheU5hbWUiLCJjbGFzc0xpc3QiLCJhZGQiLCJ0YWJJbmRleCIsIl9jb250YWluZXIiLCJkb2N1bWVudCIsImNyZWF0ZUVsZW1lbnQiLCJhcHBlbmRDaGlsZCIsIl9zY3JvbGxUb0JvdHRvbSIsInRocm90dGxlIiwiaXRlbSIsImxhc3RFbGVtZW50Q2hpbGQiLCJzY3JvbGxJbnRvVmlld0lmTmVlZGVkIiwidHJhaWxpbmciLCJkZWZlciIsInByZSIsImlubmVyVGV4dCIsIm1lc3NhZ2UiLCJ0cmltIiwiSFRNTERpdkVsZW1lbnQiLCJleHBvcnRzIiwicmVnaXN0ZXJFbGVtZW50IiwicHJvdG90eXBlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7Ozs7Ozs7Ozs7O0lDR0FBLG1CLFdBQUFBLG1COzs7QUFBQSxtQ0FBQTtBQUFBOztBQUFBOztBQUFBLDBDQUFBQyxJQUFBO0FBQUFBLGdCQUFBO0FBQUE7O0FBQUEseUtBQXlDQSxJQUF6Qzs7QUFDVyxjQUFBQyxXQUFBLEdBQWMscUJBQWQ7QUFEWDtBQThCQzs7OzswQ0F6QnlCO0FBQUE7O0FBQ2xCLGlCQUFLQyxTQUFMLENBQWVDLEdBQWYsQ0FBbUIsdUJBQW5CLEVBQTJDLHFCQUEzQztBQUNBLGlCQUFLQyxRQUFMLEdBQWdCLENBQUMsQ0FBakI7QUFFQSxpQkFBS0MsVUFBTCxHQUFrQkMsU0FBU0MsYUFBVCxDQUF1QixLQUF2QixDQUFsQjtBQUNBLGlCQUFLRixVQUFMLENBQWdCSCxTQUFoQixDQUEwQkMsR0FBMUIsQ0FBOEIsb0JBQTlCO0FBQ0EsaUJBQUtLLFdBQUwsQ0FBaUIsS0FBS0gsVUFBdEI7QUFFQSxpQkFBS0ksZUFBTCxHQUF1QixpQkFBRUMsUUFBRixDQUFXLFlBQUE7QUFDOUIsb0JBQU1DLE9BQWEsT0FBS0MsZ0JBQUwsSUFBeUIsT0FBS0EsZ0JBQUwsQ0FBc0JBLGdCQUFsRTtBQUNBLG9CQUFJRCxJQUFKLEVBQVVBLEtBQUtFLHNCQUFMO0FBQ2IsYUFIc0IsRUFHcEIsR0FIb0IsRUFHZixFQUFFQyxVQUFVLElBQVosRUFIZSxDQUF2QjtBQUlIOzs7MkNBRXNCO0FBQ25CLDZCQUFFQyxLQUFGLENBQVEsS0FBS04sZUFBYixFQUE4QixJQUE5QjtBQUNIOzs7bUNBRWlCRSxJLEVBQXlCO0FBQ3ZDLGdCQUFNSyxNQUFNVixTQUFTQyxhQUFULENBQXVCLEtBQXZCLENBQVo7QUFDQVMsZ0JBQUlDLFNBQUosR0FBZ0JOLEtBQUtPLE9BQUwsQ0FBYUMsSUFBYixFQUFoQjtBQUVBLGlCQUFLZCxVQUFMLENBQWdCRyxXQUFoQixDQUE0QlEsR0FBNUI7QUFDQSxpQkFBS1AsZUFBTDtBQUNIOzs7O0VBN0JvQ1csYzs7QUFnQ25DQyxRQUFTdEIsbUJBQVQsR0FBcUNPLFNBQVVnQixlQUFWLENBQTBCLDBCQUExQixFQUFzRCxFQUFFQyxXQUFXeEIsb0JBQW9Cd0IsU0FBakMsRUFBdEQsQ0FBckMiLCJmaWxlIjoibGliL3ZpZXdzL2NvbW1hbmQtb3V0cHV0LXdpbmRvdy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcbmV4cG9ydCBjbGFzcyBDb21tYW5kT3V0cHV0V2luZG93IGV4dGVuZHMgSFRNTERpdkVsZW1lbnQge1xuICAgIGNvbnN0cnVjdG9yKC4uLmFyZ3MpIHtcbiAgICAgICAgc3VwZXIoLi4uYXJncyk7XG4gICAgICAgIHRoaXMuZGlzcGxheU5hbWUgPSBcIkNvbW1hbmRPdXRwdXRXaW5kb3dcIjtcbiAgICB9XG4gICAgY3JlYXRlZENhbGxiYWNrKCkge1xuICAgICAgICB0aGlzLmNsYXNzTGlzdC5hZGQoXCJvbW5pLW91dHB1dC1wYW5lLXZpZXdcIiwgXCJuYXRpdmUta2V5LWJpbmRpbmdzXCIpO1xuICAgICAgICB0aGlzLnRhYkluZGV4ID0gLTE7XG4gICAgICAgIHRoaXMuX2NvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgIHRoaXMuX2NvbnRhaW5lci5jbGFzc0xpc3QuYWRkKFwibWVzc2FnZXMtY29udGFpbmVyXCIpO1xuICAgICAgICB0aGlzLmFwcGVuZENoaWxkKHRoaXMuX2NvbnRhaW5lcik7XG4gICAgICAgIHRoaXMuX3Njcm9sbFRvQm90dG9tID0gXy50aHJvdHRsZSgoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBpdGVtID0gKHRoaXMubGFzdEVsZW1lbnRDaGlsZCAmJiB0aGlzLmxhc3RFbGVtZW50Q2hpbGQubGFzdEVsZW1lbnRDaGlsZCk7XG4gICAgICAgICAgICBpZiAoaXRlbSlcbiAgICAgICAgICAgICAgICBpdGVtLnNjcm9sbEludG9WaWV3SWZOZWVkZWQoKTtcbiAgICAgICAgfSwgMTAwLCB7IHRyYWlsaW5nOiB0cnVlIH0pO1xuICAgIH1cbiAgICBhdHRhY2hlZENhbGxiYWNrKCkge1xuICAgICAgICBfLmRlZmVyKHRoaXMuX3Njcm9sbFRvQm90dG9tLCB0aGlzKTtcbiAgICB9XG4gICAgYWRkTWVzc2FnZShpdGVtKSB7XG4gICAgICAgIGNvbnN0IHByZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJwcmVcIik7XG4gICAgICAgIHByZS5pbm5lclRleHQgPSBpdGVtLm1lc3NhZ2UudHJpbSgpO1xuICAgICAgICB0aGlzLl9jb250YWluZXIuYXBwZW5kQ2hpbGQocHJlKTtcbiAgICAgICAgdGhpcy5fc2Nyb2xsVG9Cb3R0b20oKTtcbiAgICB9XG59XG5leHBvcnRzLkNvbW1hbmRPdXRwdXRXaW5kb3cgPSBkb2N1bWVudC5yZWdpc3RlckVsZW1lbnQoXCJvbW5pc2hhcnAtY29tbWFuZC1vdXRwdXRcIiwgeyBwcm90b3R5cGU6IENvbW1hbmRPdXRwdXRXaW5kb3cucHJvdG90eXBlIH0pO1xuIiwiLyogdHNsaW50OmRpc2FibGU6bm8tc3RyaW5nLWxpdGVyYWwgKi9cclxuaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xyXG5cclxuZXhwb3J0IGNsYXNzIENvbW1hbmRPdXRwdXRXaW5kb3cgZXh0ZW5kcyBIVE1MRGl2RWxlbWVudCBpbXBsZW1lbnRzIFdlYkNvbXBvbmVudCB7XHJcbiAgICBwdWJsaWMgZGlzcGxheU5hbWUgPSBcIkNvbW1hbmRPdXRwdXRXaW5kb3dcIjtcclxuICAgIHByaXZhdGUgX2NvbnRhaW5lcjogSFRNTERpdkVsZW1lbnQ7XHJcbiAgICBwcml2YXRlIF9zY3JvbGxUb0JvdHRvbTogKCkgPT4gdm9pZDtcclxuXHJcbiAgICBwdWJsaWMgY3JlYXRlZENhbGxiYWNrKCkge1xyXG4gICAgICAgIHRoaXMuY2xhc3NMaXN0LmFkZChcIm9tbmktb3V0cHV0LXBhbmUtdmlld1wiLFwibmF0aXZlLWtleS1iaW5kaW5nc1wiKTtcclxuICAgICAgICB0aGlzLnRhYkluZGV4ID0gLTE7XHJcblxyXG4gICAgICAgIHRoaXMuX2NvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgICAgICAgdGhpcy5fY29udGFpbmVyLmNsYXNzTGlzdC5hZGQoXCJtZXNzYWdlcy1jb250YWluZXJcIik7XHJcbiAgICAgICAgdGhpcy5hcHBlbmRDaGlsZCh0aGlzLl9jb250YWluZXIpO1xyXG5cclxuICAgICAgICB0aGlzLl9zY3JvbGxUb0JvdHRvbSA9IF8udGhyb3R0bGUoKCkgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBpdGVtID0gPGFueT4odGhpcy5sYXN0RWxlbWVudENoaWxkICYmIHRoaXMubGFzdEVsZW1lbnRDaGlsZC5sYXN0RWxlbWVudENoaWxkKTtcclxuICAgICAgICAgICAgaWYgKGl0ZW0pIGl0ZW0uc2Nyb2xsSW50b1ZpZXdJZk5lZWRlZCgpO1xyXG4gICAgICAgIH0sIDEwMCwgeyB0cmFpbGluZzogdHJ1ZSB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgYXR0YWNoZWRDYWxsYmFjaygpIHtcclxuICAgICAgICBfLmRlZmVyKHRoaXMuX3Njcm9sbFRvQm90dG9tLCB0aGlzKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgYWRkTWVzc2FnZShpdGVtOiB7IG1lc3NhZ2U6IHN0cmluZyB9KSB7XHJcbiAgICAgICAgY29uc3QgcHJlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInByZVwiKTtcclxuICAgICAgICBwcmUuaW5uZXJUZXh0ID0gaXRlbS5tZXNzYWdlLnRyaW0oKTtcclxuXHJcbiAgICAgICAgdGhpcy5fY29udGFpbmVyLmFwcGVuZENoaWxkKHByZSk7XHJcbiAgICAgICAgdGhpcy5fc2Nyb2xsVG9Cb3R0b20oKTtcclxuICAgIH1cclxufVxyXG5cclxuKDxhbnk+ZXhwb3J0cykuQ29tbWFuZE91dHB1dFdpbmRvdyA9ICg8YW55PmRvY3VtZW50KS5yZWdpc3RlckVsZW1lbnQoXCJvbW5pc2hhcnAtY29tbWFuZC1vdXRwdXRcIiwgeyBwcm90b3R5cGU6IENvbW1hbmRPdXRwdXRXaW5kb3cucHJvdG90eXBlIH0pO1xyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
