'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.OutputWindow = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _tsDisposables = require('ts-disposables');

var _serverInformation = require('../atom/server-information');

var _ansiToHtml = require('../services/ansi-to-html');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var OutputWindow = exports.OutputWindow = function (_HTMLDivElement) {
    _inherits(OutputWindow, _HTMLDivElement);

    function OutputWindow() {
        _classCallCheck(this, OutputWindow);

        var _this = _possibleConstructorReturn(this, (OutputWindow.__proto__ || Object.getPrototypeOf(OutputWindow)).apply(this, arguments));

        _this.displayName = 'OutputWindow';
        return _this;
    }

    _createClass(OutputWindow, [{
        key: 'createdCallback',
        value: function createdCallback() {
            this._convert = new _ansiToHtml.Convert();
            this._output = [];
            this.classList.add('omni-output-pane-view', 'native-key-bindings');
            this.tabIndex = -1;
        }
    }, {
        key: 'attachedCallback',
        value: function attachedCallback() {
            var _this2 = this;

            this.disposable = new _tsDisposables.CompositeDisposable();
            this.disposable.add(_serverInformation.server.observe.outputElement.subscribe(function (element) {
                (0, _lodash.each)(_this2.children, function (child) {
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
        key: 'detachedCallback',
        value: function detachedCallback() {
            this.disposable.dispose();
        }
    }, {
        key: 'scrollToBottom',
        value: function scrollToBottom() {
            var item = this.lastElementChild && this.lastElementChild.lastElementChild;
            if (item) item.scrollIntoViewIfNeeded();
        }
    }]);

    return OutputWindow;
}(HTMLDivElement);

exports.OutputWindow = document.registerElement('omnisharp-output-window', { prototype: OutputWindow.prototype });
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy9vbW5pLW91dHB1dC1wYW5lLXZpZXcudHMiLCJsaWIvdmlld3Mvb21uaS1vdXRwdXQtcGFuZS12aWV3LmpzIl0sIm5hbWVzIjpbIk91dHB1dFdpbmRvdyIsImFyZ3VtZW50cyIsImRpc3BsYXlOYW1lIiwiX2NvbnZlcnQiLCJfb3V0cHV0IiwiY2xhc3NMaXN0IiwiYWRkIiwidGFiSW5kZXgiLCJkaXNwb3NhYmxlIiwib2JzZXJ2ZSIsIm91dHB1dEVsZW1lbnQiLCJzdWJzY3JpYmUiLCJjaGlsZHJlbiIsImNoaWxkIiwicmVtb3ZlIiwiYXBwZW5kQ2hpbGQiLCJlbGVtZW50Iiwib3V0cHV0IiwiZGVsYXkiLCJzY3JvbGxUb0JvdHRvbSIsImRpc3Bvc2UiLCJpdGVtIiwibGFzdEVsZW1lbnRDaGlsZCIsInNjcm9sbEludG9WaWV3SWZOZWVkZWQiLCJIVE1MRGl2RWxlbWVudCIsImV4cG9ydHMiLCJkb2N1bWVudCIsInJlZ2lzdGVyRWxlbWVudCIsInByb3RvdHlwZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7Ozs7O0lBRU1BLFksV0FBQUEsWTs7O0FBQU4sNEJBQUE7QUFBQTs7QUFBQSxpSUNBaUJDLFNEQWpCOztBQUNXLGNBQUFDLFdBQUEsR0FBYyxjQUFkO0FBRFg7QUFnQ0M7Ozs7MENBMUJ5QjtBQUNsQixpQkFBS0MsUUFBTCxHQUFnQix5QkFBaEI7QUFDQSxpQkFBS0MsT0FBTCxHQUFlLEVBQWY7QUFFQSxpQkFBS0MsU0FBTCxDQUFlQyxHQUFmLENBQW1CLHVCQUFuQixFQUE0QyxxQkFBNUM7QUFDQSxpQkFBS0MsUUFBTCxHQUFnQixDQUFDLENBQWpCO0FBQ0g7OzsyQ0FFc0I7QUFBQTs7QUFDbkIsaUJBQUtDLFVBQUwsR0FBa0Isd0NBQWxCO0FBQ0EsaUJBQUtBLFVBQUwsQ0FBZ0JGLEdBQWhCLENBQW9CLDBCQUFPRyxPQUFQLENBQWVDLGFBQWYsQ0FBNkJDLFNBQTdCLENBQXVDLG1CQUFPO0FBQzlELGtDQUFLLE9BQUtDLFFBQVYsRUFBb0I7QUFBQSwyQkFBU0MsTUFBTUMsTUFBTixFQUFUO0FBQUEsaUJBQXBCO0FBQ0EsdUJBQUtDLFdBQUwsQ0FBaUJDLE9BQWpCO0FBQ0gsYUFIbUIsQ0FBcEI7QUFJQSxpQkFBS1IsVUFBTCxDQUFnQkYsR0FBaEIsQ0FBb0IsMEJBQU9HLE9BQVAsQ0FBZVEsTUFBZixDQUFzQkMsS0FBdEIsQ0FBNEIsR0FBNUIsRUFBaUNQLFNBQWpDLENBQTJDO0FBQUEsdUJBQU0sT0FBS1EsY0FBTCxFQUFOO0FBQUEsYUFBM0MsQ0FBcEI7QUFDQSxpQkFBS0EsY0FBTDtBQUNIOzs7MkNBRXNCO0FBQ25CLGlCQUFLWCxVQUFMLENBQWdCWSxPQUFoQjtBQUNIOzs7eUNBRXFCO0FBQ2xCLGdCQUFNQyxPQUFhLEtBQUtDLGdCQUFMLElBQXlCLEtBQUtBLGdCQUFMLENBQXNCQSxnQkFBbEU7QUFDQSxnQkFBSUQsSUFBSixFQUFVQSxLQUFLRSxzQkFBTDtBQUNiOzs7O0VBL0I2QkMsYzs7QUFrQzVCQyxRQUFTekIsWUFBVCxHQUE4QjBCLFNBQVVDLGVBQVYsQ0FBMEIseUJBQTFCLEVBQXFELEVBQUVDLFdBQVc1QixhQUFhNEIsU0FBMUIsRUFBckQsQ0FBOUIiLCJmaWxlIjoibGliL3ZpZXdzL29tbmktb3V0cHV0LXBhbmUtdmlldy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIHRzbGludDpkaXNhYmxlOm5vLXN0cmluZy1saXRlcmFsICovXHJcbmltcG9ydCB7ZWFjaH0gZnJvbSAnbG9kYXNoJztcclxuaW1wb3J0IHtDb21wb3NpdGVEaXNwb3NhYmxlfSBmcm9tICd0cy1kaXNwb3NhYmxlcyc7XHJcbmltcG9ydCB7c2VydmVyfSBmcm9tICcuLi9hdG9tL3NlcnZlci1pbmZvcm1hdGlvbic7XHJcbmltcG9ydCB7Q29udmVydH0gZnJvbSAnLi4vc2VydmljZXMvYW5zaS10by1odG1sJztcclxuXHJcbmV4cG9ydCBjbGFzcyBPdXRwdXRXaW5kb3cgZXh0ZW5kcyBIVE1MRGl2RWxlbWVudCBpbXBsZW1lbnRzIFdlYkNvbXBvbmVudCB7XHJcbiAgICBwdWJsaWMgZGlzcGxheU5hbWUgPSAnT3V0cHV0V2luZG93JztcclxuICAgIHByaXZhdGUgZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxuICAgIHByaXZhdGUgX2NvbnZlcnQ6IGFueTtcclxuICAgIHByaXZhdGUgX291dHB1dDogT3V0cHV0TWVzc2FnZVtdO1xyXG5cclxuICAgIHB1YmxpYyBjcmVhdGVkQ2FsbGJhY2soKSB7XHJcbiAgICAgICAgdGhpcy5fY29udmVydCA9IG5ldyBDb252ZXJ0KCk7XHJcbiAgICAgICAgdGhpcy5fb3V0cHV0ID0gW107XHJcblxyXG4gICAgICAgIHRoaXMuY2xhc3NMaXN0LmFkZCgnb21uaS1vdXRwdXQtcGFuZS12aWV3JywgJ25hdGl2ZS1rZXktYmluZGluZ3MnKTtcclxuICAgICAgICB0aGlzLnRhYkluZGV4ID0gLTE7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGF0dGFjaGVkQ2FsbGJhY2soKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKHNlcnZlci5vYnNlcnZlLm91dHB1dEVsZW1lbnQuc3Vic2NyaWJlKGVsZW1lbnQgPT4ge1xyXG4gICAgICAgICAgICBlYWNoKHRoaXMuY2hpbGRyZW4sIGNoaWxkID0+IGNoaWxkLnJlbW92ZSgpKTtcclxuICAgICAgICAgICAgdGhpcy5hcHBlbmRDaGlsZChlbGVtZW50KTtcclxuICAgICAgICB9KSk7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChzZXJ2ZXIub2JzZXJ2ZS5vdXRwdXQuZGVsYXkoMTAwKS5zdWJzY3JpYmUoKCkgPT4gdGhpcy5zY3JvbGxUb0JvdHRvbSgpKSk7XHJcbiAgICAgICAgdGhpcy5zY3JvbGxUb0JvdHRvbSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkZXRhY2hlZENhbGxiYWNrKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBzY3JvbGxUb0JvdHRvbSgpIHtcclxuICAgICAgICBjb25zdCBpdGVtID0gPGFueT4odGhpcy5sYXN0RWxlbWVudENoaWxkICYmIHRoaXMubGFzdEVsZW1lbnRDaGlsZC5sYXN0RWxlbWVudENoaWxkKTtcclxuICAgICAgICBpZiAoaXRlbSkgaXRlbS5zY3JvbGxJbnRvVmlld0lmTmVlZGVkKCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbig8YW55PmV4cG9ydHMpLk91dHB1dFdpbmRvdyA9ICg8YW55PmRvY3VtZW50KS5yZWdpc3RlckVsZW1lbnQoJ29tbmlzaGFycC1vdXRwdXQtd2luZG93JywgeyBwcm90b3R5cGU6IE91dHB1dFdpbmRvdy5wcm90b3R5cGUgfSk7XHJcbiIsImltcG9ydCB7IGVhY2ggfSBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSB9IGZyb20gJ3RzLWRpc3Bvc2FibGVzJztcbmltcG9ydCB7IHNlcnZlciB9IGZyb20gJy4uL2F0b20vc2VydmVyLWluZm9ybWF0aW9uJztcbmltcG9ydCB7IENvbnZlcnQgfSBmcm9tICcuLi9zZXJ2aWNlcy9hbnNpLXRvLWh0bWwnO1xuZXhwb3J0IGNsYXNzIE91dHB1dFdpbmRvdyBleHRlbmRzIEhUTUxEaXZFbGVtZW50IHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoLi4uYXJndW1lbnRzKTtcbiAgICAgICAgdGhpcy5kaXNwbGF5TmFtZSA9ICdPdXRwdXRXaW5kb3cnO1xuICAgIH1cbiAgICBjcmVhdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMuX2NvbnZlcnQgPSBuZXcgQ29udmVydCgpO1xuICAgICAgICB0aGlzLl9vdXRwdXQgPSBbXTtcbiAgICAgICAgdGhpcy5jbGFzc0xpc3QuYWRkKCdvbW5pLW91dHB1dC1wYW5lLXZpZXcnLCAnbmF0aXZlLWtleS1iaW5kaW5ncycpO1xuICAgICAgICB0aGlzLnRhYkluZGV4ID0gLTE7XG4gICAgfVxuICAgIGF0dGFjaGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoc2VydmVyLm9ic2VydmUub3V0cHV0RWxlbWVudC5zdWJzY3JpYmUoZWxlbWVudCA9PiB7XG4gICAgICAgICAgICBlYWNoKHRoaXMuY2hpbGRyZW4sIGNoaWxkID0+IGNoaWxkLnJlbW92ZSgpKTtcbiAgICAgICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQoZWxlbWVudCk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChzZXJ2ZXIub2JzZXJ2ZS5vdXRwdXQuZGVsYXkoMTAwKS5zdWJzY3JpYmUoKCkgPT4gdGhpcy5zY3JvbGxUb0JvdHRvbSgpKSk7XG4gICAgICAgIHRoaXMuc2Nyb2xsVG9Cb3R0b20oKTtcbiAgICB9XG4gICAgZGV0YWNoZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICB9XG4gICAgc2Nyb2xsVG9Cb3R0b20oKSB7XG4gICAgICAgIGNvbnN0IGl0ZW0gPSAodGhpcy5sYXN0RWxlbWVudENoaWxkICYmIHRoaXMubGFzdEVsZW1lbnRDaGlsZC5sYXN0RWxlbWVudENoaWxkKTtcbiAgICAgICAgaWYgKGl0ZW0pXG4gICAgICAgICAgICBpdGVtLnNjcm9sbEludG9WaWV3SWZOZWVkZWQoKTtcbiAgICB9XG59XG5leHBvcnRzLk91dHB1dFdpbmRvdyA9IGRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudCgnb21uaXNoYXJwLW91dHB1dC13aW5kb3cnLCB7IHByb3RvdHlwZTogT3V0cHV0V2luZG93LnByb3RvdHlwZSB9KTtcbiJdfQ==
