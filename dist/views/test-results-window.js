'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.TestResultsWindow = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _ansiToHtml = require('../services/ansi-to-html');

var _lodash = require('lodash');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var convert = new _ansiToHtml.Convert();

var TestResultsWindow = exports.TestResultsWindow = function (_HTMLDivElement) {
    _inherits(TestResultsWindow, _HTMLDivElement);

    function TestResultsWindow() {
        _classCallCheck(this, TestResultsWindow);

        var _this = _possibleConstructorReturn(this, (TestResultsWindow.__proto__ || Object.getPrototypeOf(TestResultsWindow)).apply(this, arguments));

        _this.displayName = 'CommandOutputWindow';
        return _this;
    }

    _createClass(TestResultsWindow, [{
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
            pre.classList.add(item.logLevel);
            pre.innerText = convert.toHtml(item.message).trim();
            this._container.appendChild(pre);
            this._scrollToBottom();
        }
    }, {
        key: 'clear',
        value: function clear() {
            this._container.innerHTML = '';
        }
    }]);

    return TestResultsWindow;
}(HTMLDivElement);

exports.TestResultsWindow = document.registerElement('omnisharp-test-results', { prototype: TestResultsWindow.prototype });
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy90ZXN0LXJlc3VsdHMtd2luZG93LnRzIiwibGliL3ZpZXdzL3Rlc3QtcmVzdWx0cy13aW5kb3cuanMiXSwibmFtZXMiOlsiY29udmVydCIsIlRlc3RSZXN1bHRzV2luZG93IiwiYXJndW1lbnRzIiwiZGlzcGxheU5hbWUiLCJjbGFzc0xpc3QiLCJhZGQiLCJ0YWJJbmRleCIsIl9jb250YWluZXIiLCJkb2N1bWVudCIsImNyZWF0ZUVsZW1lbnQiLCJhcHBlbmRDaGlsZCIsIl9zY3JvbGxUb0JvdHRvbSIsIml0ZW0iLCJsYXN0RWxlbWVudENoaWxkIiwic2Nyb2xsSW50b1ZpZXdJZk5lZWRlZCIsInRyYWlsaW5nIiwicHJlIiwibG9nTGV2ZWwiLCJpbm5lclRleHQiLCJ0b0h0bWwiLCJtZXNzYWdlIiwidHJpbSIsImlubmVySFRNTCIsIkhUTUxEaXZFbGVtZW50IiwiZXhwb3J0cyIsInJlZ2lzdGVyRWxlbWVudCIsInByb3RvdHlwZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQ0E7O0FBRUE7Ozs7Ozs7O0FBREEsSUFBTUEsVUFBVSx5QkFBaEI7O0lBUU1DLGlCLFdBQUFBLGlCOzs7QUFBTixpQ0FBQTtBQUFBOztBQUFBLDJJQ0xpQkMsU0RLakI7O0FBQ1csY0FBQUMsV0FBQSxHQUFjLHFCQUFkO0FBRFg7QUFtQ0M7Ozs7MENBOUJ5QjtBQUFBOztBQUNsQixpQkFBS0MsU0FBTCxDQUFlQyxHQUFmLENBQW1CLHVCQUFuQixFQUE0QyxxQkFBNUM7QUFDQSxpQkFBS0MsUUFBTCxHQUFnQixDQUFDLENBQWpCO0FBRUEsaUJBQUtDLFVBQUwsR0FBa0JDLFNBQVNDLGFBQVQsQ0FBdUIsS0FBdkIsQ0FBbEI7QUFDQSxpQkFBS0YsVUFBTCxDQUFnQkgsU0FBaEIsQ0FBMEJDLEdBQTFCLENBQThCLG9CQUE5QjtBQUNBLGlCQUFLSyxXQUFMLENBQWlCLEtBQUtILFVBQXRCO0FBRUEsaUJBQUtJLGVBQUwsR0FBdUIsc0JBQVMsWUFBQTtBQUM1QixvQkFBTUMsT0FBYSxPQUFLQyxnQkFBTCxJQUF5QixPQUFLQSxnQkFBTCxDQUFzQkEsZ0JBQWxFO0FBQ0Esb0JBQUlELElBQUosRUFBVUEsS0FBS0Usc0JBQUw7QUFDYixhQUhzQixFQUdwQixHQUhvQixFQUdmLEVBQUVDLFVBQVUsSUFBWixFQUhlLENBQXZCO0FBSUg7OzsyQ0FFc0I7QUFDbkIsK0JBQU0sS0FBS0osZUFBWCxFQUE0QixJQUE1QjtBQUNIOzs7bUNBRWlCQyxJLEVBQW1CO0FBQ2pDLGdCQUFNSSxNQUFNUixTQUFTQyxhQUFULENBQXVCLEtBQXZCLENBQVo7QUFDQU8sZ0JBQUlaLFNBQUosQ0FBY0MsR0FBZCxDQUFrQk8sS0FBS0ssUUFBdkI7QUFDQUQsZ0JBQUlFLFNBQUosR0FBZ0JsQixRQUFRbUIsTUFBUixDQUFlUCxLQUFLUSxPQUFwQixFQUE2QkMsSUFBN0IsRUFBaEI7QUFFQSxpQkFBS2QsVUFBTCxDQUFnQkcsV0FBaEIsQ0FBNEJNLEdBQTVCO0FBQ0EsaUJBQUtMLGVBQUw7QUFDSDs7O2dDQUVXO0FBQ1IsaUJBQUtKLFVBQUwsQ0FBZ0JlLFNBQWhCLEdBQTRCLEVBQTVCO0FBQ0g7Ozs7RUFsQ2tDQyxjOztBQXFDakNDLFFBQVN2QixpQkFBVCxHQUFtQ08sU0FBVWlCLGVBQVYsQ0FBMEIsd0JBQTFCLEVBQW9ELEVBQUVDLFdBQVd6QixrQkFBa0J5QixTQUEvQixFQUFwRCxDQUFuQyIsImZpbGUiOiJsaWIvdmlld3MvdGVzdC1yZXN1bHRzLXdpbmRvdy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIHRzbGludDpkaXNhYmxlOm5vLXN0cmluZy1saXRlcmFsICovXHJcbmltcG9ydCB7Q29udmVydH0gZnJvbSAnLi4vc2VydmljZXMvYW5zaS10by1odG1sJztcclxuY29uc3QgY29udmVydCA9IG5ldyBDb252ZXJ0KCk7XHJcbmltcG9ydCB7dGhyb3R0bGUsIGRlZmVyfSBmcm9tICdsb2Rhc2gnO1xyXG5cclxuLy8gY3RybC1yLiBjdHJsLXQgcnVuIHRlc3RcclxuLy8gY3RybC1yLCBjdHJsLWYgcnVuIGZpeHR1cmVcclxuLy8gY3RybC1yLCBjdHJsLWEgcnVuIGFsbFxyXG4vLyBjdHJsLXIsIGN0cmwtbCBydW4gbGFzdFxyXG5cclxuZXhwb3J0IGNsYXNzIFRlc3RSZXN1bHRzV2luZG93IGV4dGVuZHMgSFRNTERpdkVsZW1lbnQgaW1wbGVtZW50cyBXZWJDb21wb25lbnQge1xyXG4gICAgcHVibGljIGRpc3BsYXlOYW1lID0gJ0NvbW1hbmRPdXRwdXRXaW5kb3cnO1xyXG4gICAgcHJpdmF0ZSBfY29udGFpbmVyOiBIVE1MRGl2RWxlbWVudDtcclxuICAgIHByaXZhdGUgX3Njcm9sbFRvQm90dG9tOiAoKSA9PiB2b2lkO1xyXG5cclxuICAgIHB1YmxpYyBjcmVhdGVkQ2FsbGJhY2soKSB7XHJcbiAgICAgICAgdGhpcy5jbGFzc0xpc3QuYWRkKCdvbW5pLW91dHB1dC1wYW5lLXZpZXcnLCAnbmF0aXZlLWtleS1iaW5kaW5ncycpO1xyXG4gICAgICAgIHRoaXMudGFiSW5kZXggPSAtMTtcclxuXHJcbiAgICAgICAgdGhpcy5fY29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICAgICAgdGhpcy5fY29udGFpbmVyLmNsYXNzTGlzdC5hZGQoJ21lc3NhZ2VzLWNvbnRhaW5lcicpO1xyXG4gICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQodGhpcy5fY29udGFpbmVyKTtcclxuXHJcbiAgICAgICAgdGhpcy5fc2Nyb2xsVG9Cb3R0b20gPSB0aHJvdHRsZSgoKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IGl0ZW0gPSA8YW55Pih0aGlzLmxhc3RFbGVtZW50Q2hpbGQgJiYgdGhpcy5sYXN0RWxlbWVudENoaWxkLmxhc3RFbGVtZW50Q2hpbGQpO1xyXG4gICAgICAgICAgICBpZiAoaXRlbSkgaXRlbS5zY3JvbGxJbnRvVmlld0lmTmVlZGVkKCk7XHJcbiAgICAgICAgfSwgMTAwLCB7IHRyYWlsaW5nOiB0cnVlIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBhdHRhY2hlZENhbGxiYWNrKCkge1xyXG4gICAgICAgIGRlZmVyKHRoaXMuX3Njcm9sbFRvQm90dG9tLCB0aGlzKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgYWRkTWVzc2FnZShpdGVtOiBPdXRwdXRNZXNzYWdlKSB7XHJcbiAgICAgICAgY29uc3QgcHJlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncHJlJyk7XHJcbiAgICAgICAgcHJlLmNsYXNzTGlzdC5hZGQoaXRlbS5sb2dMZXZlbCk7XHJcbiAgICAgICAgcHJlLmlubmVyVGV4dCA9IGNvbnZlcnQudG9IdG1sKGl0ZW0ubWVzc2FnZSkudHJpbSgpO1xyXG5cclxuICAgICAgICB0aGlzLl9jb250YWluZXIuYXBwZW5kQ2hpbGQocHJlKTtcclxuICAgICAgICB0aGlzLl9zY3JvbGxUb0JvdHRvbSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBjbGVhcigpIHtcclxuICAgICAgICB0aGlzLl9jb250YWluZXIuaW5uZXJIVE1MID0gJyc7XHJcbiAgICB9XHJcbn1cclxuXHJcbig8YW55PmV4cG9ydHMpLlRlc3RSZXN1bHRzV2luZG93ID0gKDxhbnk+ZG9jdW1lbnQpLnJlZ2lzdGVyRWxlbWVudCgnb21uaXNoYXJwLXRlc3QtcmVzdWx0cycsIHsgcHJvdG90eXBlOiBUZXN0UmVzdWx0c1dpbmRvdy5wcm90b3R5cGUgfSk7XHJcbiIsImltcG9ydCB7IENvbnZlcnQgfSBmcm9tICcuLi9zZXJ2aWNlcy9hbnNpLXRvLWh0bWwnO1xuY29uc3QgY29udmVydCA9IG5ldyBDb252ZXJ0KCk7XG5pbXBvcnQgeyB0aHJvdHRsZSwgZGVmZXIgfSBmcm9tICdsb2Rhc2gnO1xuZXhwb3J0IGNsYXNzIFRlc3RSZXN1bHRzV2luZG93IGV4dGVuZHMgSFRNTERpdkVsZW1lbnQge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlciguLi5hcmd1bWVudHMpO1xuICAgICAgICB0aGlzLmRpc3BsYXlOYW1lID0gJ0NvbW1hbmRPdXRwdXRXaW5kb3cnO1xuICAgIH1cbiAgICBjcmVhdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMuY2xhc3NMaXN0LmFkZCgnb21uaS1vdXRwdXQtcGFuZS12aWV3JywgJ25hdGl2ZS1rZXktYmluZGluZ3MnKTtcbiAgICAgICAgdGhpcy50YWJJbmRleCA9IC0xO1xuICAgICAgICB0aGlzLl9jb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgdGhpcy5fY29udGFpbmVyLmNsYXNzTGlzdC5hZGQoJ21lc3NhZ2VzLWNvbnRhaW5lcicpO1xuICAgICAgICB0aGlzLmFwcGVuZENoaWxkKHRoaXMuX2NvbnRhaW5lcik7XG4gICAgICAgIHRoaXMuX3Njcm9sbFRvQm90dG9tID0gdGhyb3R0bGUoKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgaXRlbSA9ICh0aGlzLmxhc3RFbGVtZW50Q2hpbGQgJiYgdGhpcy5sYXN0RWxlbWVudENoaWxkLmxhc3RFbGVtZW50Q2hpbGQpO1xuICAgICAgICAgICAgaWYgKGl0ZW0pXG4gICAgICAgICAgICAgICAgaXRlbS5zY3JvbGxJbnRvVmlld0lmTmVlZGVkKCk7XG4gICAgICAgIH0sIDEwMCwgeyB0cmFpbGluZzogdHJ1ZSB9KTtcbiAgICB9XG4gICAgYXR0YWNoZWRDYWxsYmFjaygpIHtcbiAgICAgICAgZGVmZXIodGhpcy5fc2Nyb2xsVG9Cb3R0b20sIHRoaXMpO1xuICAgIH1cbiAgICBhZGRNZXNzYWdlKGl0ZW0pIHtcbiAgICAgICAgY29uc3QgcHJlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncHJlJyk7XG4gICAgICAgIHByZS5jbGFzc0xpc3QuYWRkKGl0ZW0ubG9nTGV2ZWwpO1xuICAgICAgICBwcmUuaW5uZXJUZXh0ID0gY29udmVydC50b0h0bWwoaXRlbS5tZXNzYWdlKS50cmltKCk7XG4gICAgICAgIHRoaXMuX2NvbnRhaW5lci5hcHBlbmRDaGlsZChwcmUpO1xuICAgICAgICB0aGlzLl9zY3JvbGxUb0JvdHRvbSgpO1xuICAgIH1cbiAgICBjbGVhcigpIHtcbiAgICAgICAgdGhpcy5fY29udGFpbmVyLmlubmVySFRNTCA9ICcnO1xuICAgIH1cbn1cbmV4cG9ydHMuVGVzdFJlc3VsdHNXaW5kb3cgPSBkb2N1bWVudC5yZWdpc3RlckVsZW1lbnQoJ29tbmlzaGFycC10ZXN0LXJlc3VsdHMnLCB7IHByb3RvdHlwZTogVGVzdFJlc3VsdHNXaW5kb3cucHJvdG90eXBlIH0pO1xuIl19
