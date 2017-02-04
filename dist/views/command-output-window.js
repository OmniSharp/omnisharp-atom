'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.CommandOutputWindow = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var CommandOutputWindow = exports.CommandOutputWindow = function (_HTMLDivElement) {
    _inherits(CommandOutputWindow, _HTMLDivElement);

    function CommandOutputWindow() {
        _classCallCheck(this, CommandOutputWindow);

        var _this = _possibleConstructorReturn(this, (CommandOutputWindow.__proto__ || Object.getPrototypeOf(CommandOutputWindow)).apply(this, arguments));

        _this.displayName = 'CommandOutputWindow';
        return _this;
    }

    _createClass(CommandOutputWindow, [{
        key: 'createdCallback',
        value: function createdCallback() {
            var _this2 = this;

            this.classList.add('omni-output-pane-view', 'native-key-bindings');
            this.tabIndex = -1;
            this._container = document.createElement('div');
            this._container.classList.add('messages-container');
            this.appendChild(this._container);
            this._scrollToBottom = (0, _lodash.throttle)(function () {
                var item = _this2.lastElementChild && _this2.lastElementChild.lastElementChild;
                if (item) item.scrollIntoViewIfNeeded();
            }, 100, { trailing: true });
        }
    }, {
        key: 'attachedCallback',
        value: function attachedCallback() {
            (0, _lodash.defer)(this._scrollToBottom, this);
        }
    }, {
        key: 'addMessage',
        value: function addMessage(item) {
            var pre = document.createElement('pre');
            pre.innerText = item.message.trim();
            this._container.appendChild(pre);
            this._scrollToBottom();
        }
    }]);

    return CommandOutputWindow;
}(HTMLDivElement);

exports.CommandOutputWindow = document.registerElement('omnisharp-command-output', { prototype: CommandOutputWindow.prototype });
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy9jb21tYW5kLW91dHB1dC13aW5kb3cudHMiLCJsaWIvdmlld3MvY29tbWFuZC1vdXRwdXQtd2luZG93LmpzIl0sIm5hbWVzIjpbIkNvbW1hbmRPdXRwdXRXaW5kb3ciLCJhcmd1bWVudHMiLCJkaXNwbGF5TmFtZSIsImNsYXNzTGlzdCIsImFkZCIsInRhYkluZGV4IiwiX2NvbnRhaW5lciIsImRvY3VtZW50IiwiY3JlYXRlRWxlbWVudCIsImFwcGVuZENoaWxkIiwiX3Njcm9sbFRvQm90dG9tIiwiaXRlbSIsImxhc3RFbGVtZW50Q2hpbGQiLCJzY3JvbGxJbnRvVmlld0lmTmVlZGVkIiwidHJhaWxpbmciLCJwcmUiLCJpbm5lclRleHQiLCJtZXNzYWdlIiwidHJpbSIsIkhUTUxEaXZFbGVtZW50IiwiZXhwb3J0cyIsInJlZ2lzdGVyRWxlbWVudCIsInByb3RvdHlwZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQ0E7Ozs7Ozs7O0lBRU1BLG1CLFdBQUFBLG1COzs7QUFBTixtQ0FBQTtBQUFBOztBQUFBLCtJQ0FpQkMsU0RBakI7O0FBQ1csY0FBQUMsV0FBQSxHQUFjLHFCQUFkO0FBRFg7QUE4QkM7Ozs7MENBekJ5QjtBQUFBOztBQUNsQixpQkFBS0MsU0FBTCxDQUFlQyxHQUFmLENBQW1CLHVCQUFuQixFQUE0QyxxQkFBNUM7QUFDQSxpQkFBS0MsUUFBTCxHQUFnQixDQUFDLENBQWpCO0FBRUEsaUJBQUtDLFVBQUwsR0FBa0JDLFNBQVNDLGFBQVQsQ0FBdUIsS0FBdkIsQ0FBbEI7QUFDQSxpQkFBS0YsVUFBTCxDQUFnQkgsU0FBaEIsQ0FBMEJDLEdBQTFCLENBQThCLG9CQUE5QjtBQUNBLGlCQUFLSyxXQUFMLENBQWlCLEtBQUtILFVBQXRCO0FBRUEsaUJBQUtJLGVBQUwsR0FBdUIsc0JBQVMsWUFBQTtBQUM1QixvQkFBTUMsT0FBYSxPQUFLQyxnQkFBTCxJQUF5QixPQUFLQSxnQkFBTCxDQUFzQkEsZ0JBQWxFO0FBQ0Esb0JBQUlELElBQUosRUFBVUEsS0FBS0Usc0JBQUw7QUFDYixhQUhzQixFQUdwQixHQUhvQixFQUdmLEVBQUVDLFVBQVUsSUFBWixFQUhlLENBQXZCO0FBSUg7OzsyQ0FFc0I7QUFDbkIsK0JBQU0sS0FBS0osZUFBWCxFQUE0QixJQUE1QjtBQUNIOzs7bUNBRWlCQyxJLEVBQXlCO0FBQ3ZDLGdCQUFNSSxNQUFNUixTQUFTQyxhQUFULENBQXVCLEtBQXZCLENBQVo7QUFDQU8sZ0JBQUlDLFNBQUosR0FBZ0JMLEtBQUtNLE9BQUwsQ0FBYUMsSUFBYixFQUFoQjtBQUVBLGlCQUFLWixVQUFMLENBQWdCRyxXQUFoQixDQUE0Qk0sR0FBNUI7QUFDQSxpQkFBS0wsZUFBTDtBQUNIOzs7O0VBN0JvQ1MsYzs7QUFnQ25DQyxRQUFTcEIsbUJBQVQsR0FBcUNPLFNBQVVjLGVBQVYsQ0FBMEIsMEJBQTFCLEVBQXNELEVBQUVDLFdBQVd0QixvQkFBb0JzQixTQUFqQyxFQUF0RCxDQUFyQyIsImZpbGUiOiJsaWIvdmlld3MvY29tbWFuZC1vdXRwdXQtd2luZG93LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogdHNsaW50OmRpc2FibGU6bm8tc3RyaW5nLWxpdGVyYWwgKi9cclxuaW1wb3J0IHsgdGhyb3R0bGUsIGRlZmVyIH0gZnJvbSAnbG9kYXNoJztcclxuXHJcbmV4cG9ydCBjbGFzcyBDb21tYW5kT3V0cHV0V2luZG93IGV4dGVuZHMgSFRNTERpdkVsZW1lbnQgaW1wbGVtZW50cyBXZWJDb21wb25lbnQge1xyXG4gICAgcHVibGljIGRpc3BsYXlOYW1lID0gJ0NvbW1hbmRPdXRwdXRXaW5kb3cnO1xyXG4gICAgcHJpdmF0ZSBfY29udGFpbmVyOiBIVE1MRGl2RWxlbWVudDtcclxuICAgIHByaXZhdGUgX3Njcm9sbFRvQm90dG9tOiAoKSA9PiB2b2lkO1xyXG5cclxuICAgIHB1YmxpYyBjcmVhdGVkQ2FsbGJhY2soKSB7XHJcbiAgICAgICAgdGhpcy5jbGFzc0xpc3QuYWRkKCdvbW5pLW91dHB1dC1wYW5lLXZpZXcnLCAnbmF0aXZlLWtleS1iaW5kaW5ncycpO1xyXG4gICAgICAgIHRoaXMudGFiSW5kZXggPSAtMTtcclxuXHJcbiAgICAgICAgdGhpcy5fY29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICAgICAgdGhpcy5fY29udGFpbmVyLmNsYXNzTGlzdC5hZGQoJ21lc3NhZ2VzLWNvbnRhaW5lcicpO1xyXG4gICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQodGhpcy5fY29udGFpbmVyKTtcclxuXHJcbiAgICAgICAgdGhpcy5fc2Nyb2xsVG9Cb3R0b20gPSB0aHJvdHRsZSgoKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IGl0ZW0gPSA8YW55Pih0aGlzLmxhc3RFbGVtZW50Q2hpbGQgJiYgdGhpcy5sYXN0RWxlbWVudENoaWxkLmxhc3RFbGVtZW50Q2hpbGQpO1xyXG4gICAgICAgICAgICBpZiAoaXRlbSkgaXRlbS5zY3JvbGxJbnRvVmlld0lmTmVlZGVkKCk7XHJcbiAgICAgICAgfSwgMTAwLCB7IHRyYWlsaW5nOiB0cnVlIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBhdHRhY2hlZENhbGxiYWNrKCkge1xyXG4gICAgICAgIGRlZmVyKHRoaXMuX3Njcm9sbFRvQm90dG9tLCB0aGlzKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgYWRkTWVzc2FnZShpdGVtOiB7IG1lc3NhZ2U6IHN0cmluZyB9KSB7XHJcbiAgICAgICAgY29uc3QgcHJlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncHJlJyk7XHJcbiAgICAgICAgcHJlLmlubmVyVGV4dCA9IGl0ZW0ubWVzc2FnZS50cmltKCk7XHJcblxyXG4gICAgICAgIHRoaXMuX2NvbnRhaW5lci5hcHBlbmRDaGlsZChwcmUpO1xyXG4gICAgICAgIHRoaXMuX3Njcm9sbFRvQm90dG9tKCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbig8YW55PmV4cG9ydHMpLkNvbW1hbmRPdXRwdXRXaW5kb3cgPSAoPGFueT5kb2N1bWVudCkucmVnaXN0ZXJFbGVtZW50KCdvbW5pc2hhcnAtY29tbWFuZC1vdXRwdXQnLCB7IHByb3RvdHlwZTogQ29tbWFuZE91dHB1dFdpbmRvdy5wcm90b3R5cGUgfSk7XHJcbiIsImltcG9ydCB7IHRocm90dGxlLCBkZWZlciB9IGZyb20gJ2xvZGFzaCc7XG5leHBvcnQgY2xhc3MgQ29tbWFuZE91dHB1dFdpbmRvdyBleHRlbmRzIEhUTUxEaXZFbGVtZW50IHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoLi4uYXJndW1lbnRzKTtcbiAgICAgICAgdGhpcy5kaXNwbGF5TmFtZSA9ICdDb21tYW5kT3V0cHV0V2luZG93JztcbiAgICB9XG4gICAgY3JlYXRlZENhbGxiYWNrKCkge1xuICAgICAgICB0aGlzLmNsYXNzTGlzdC5hZGQoJ29tbmktb3V0cHV0LXBhbmUtdmlldycsICduYXRpdmUta2V5LWJpbmRpbmdzJyk7XG4gICAgICAgIHRoaXMudGFiSW5kZXggPSAtMTtcbiAgICAgICAgdGhpcy5fY29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIHRoaXMuX2NvbnRhaW5lci5jbGFzc0xpc3QuYWRkKCdtZXNzYWdlcy1jb250YWluZXInKTtcbiAgICAgICAgdGhpcy5hcHBlbmRDaGlsZCh0aGlzLl9jb250YWluZXIpO1xuICAgICAgICB0aGlzLl9zY3JvbGxUb0JvdHRvbSA9IHRocm90dGxlKCgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGl0ZW0gPSAodGhpcy5sYXN0RWxlbWVudENoaWxkICYmIHRoaXMubGFzdEVsZW1lbnRDaGlsZC5sYXN0RWxlbWVudENoaWxkKTtcbiAgICAgICAgICAgIGlmIChpdGVtKVxuICAgICAgICAgICAgICAgIGl0ZW0uc2Nyb2xsSW50b1ZpZXdJZk5lZWRlZCgpO1xuICAgICAgICB9LCAxMDAsIHsgdHJhaWxpbmc6IHRydWUgfSk7XG4gICAgfVxuICAgIGF0dGFjaGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIGRlZmVyKHRoaXMuX3Njcm9sbFRvQm90dG9tLCB0aGlzKTtcbiAgICB9XG4gICAgYWRkTWVzc2FnZShpdGVtKSB7XG4gICAgICAgIGNvbnN0IHByZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3ByZScpO1xuICAgICAgICBwcmUuaW5uZXJUZXh0ID0gaXRlbS5tZXNzYWdlLnRyaW0oKTtcbiAgICAgICAgdGhpcy5fY29udGFpbmVyLmFwcGVuZENoaWxkKHByZSk7XG4gICAgICAgIHRoaXMuX3Njcm9sbFRvQm90dG9tKCk7XG4gICAgfVxufVxuZXhwb3J0cy5Db21tYW5kT3V0cHV0V2luZG93ID0gZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50KCdvbW5pc2hhcnAtY29tbWFuZC1vdXRwdXQnLCB7IHByb3RvdHlwZTogQ29tbWFuZE91dHB1dFdpbmRvdy5wcm90b3R5cGUgfSk7XG4iXX0=
