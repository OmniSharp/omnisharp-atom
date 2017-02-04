'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.BuildOutputWindow = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _tsDisposables = require('ts-disposables');

var _serverInformation = require('../atom/server-information');

var _ansiToHtml = require('../services/ansi-to-html');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var BuildOutputWindow = exports.BuildOutputWindow = function (_HTMLDivElement) {
    _inherits(BuildOutputWindow, _HTMLDivElement);

    function BuildOutputWindow() {
        _classCallCheck(this, BuildOutputWindow);

        var _this = _possibleConstructorReturn(this, (BuildOutputWindow.__proto__ || Object.getPrototypeOf(BuildOutputWindow)).apply(this, arguments));

        _this.displayName = 'BuildOutputWindow';
        return _this;
    }

    _createClass(BuildOutputWindow, [{
        key: 'createdCallback',
        value: function createdCallback() {
            this._convert = new _ansiToHtml.Convert();
            this._output = [];
            this.classList.add('build-output-pane-view', 'native-key-bindings');
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

    return BuildOutputWindow;
}(HTMLDivElement);
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy9idWlsZC1vdXRwdXQtcGFuZS12aWV3LnRzIiwibGliL3ZpZXdzL2J1aWxkLW91dHB1dC1wYW5lLXZpZXcuanMiXSwibmFtZXMiOlsiQnVpbGRPdXRwdXRXaW5kb3ciLCJhcmd1bWVudHMiLCJkaXNwbGF5TmFtZSIsIl9jb252ZXJ0IiwiX291dHB1dCIsImNsYXNzTGlzdCIsImFkZCIsInRhYkluZGV4IiwiZGlzcG9zYWJsZSIsIm9ic2VydmUiLCJvdXRwdXRFbGVtZW50Iiwic3Vic2NyaWJlIiwiY2hpbGRyZW4iLCJjaGlsZCIsInJlbW92ZSIsImFwcGVuZENoaWxkIiwiZWxlbWVudCIsIm91dHB1dCIsImRlbGF5Iiwic2Nyb2xsVG9Cb3R0b20iLCJkaXNwb3NlIiwiaXRlbSIsImxhc3RFbGVtZW50Q2hpbGQiLCJzY3JvbGxJbnRvVmlld0lmTmVlZGVkIiwiSFRNTERpdkVsZW1lbnQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUNBOztBQUNBOztBQUNBOztBQUNBOzs7Ozs7OztJQUdNQSxpQixXQUFBQSxpQjs7O0FBQU4saUNBQUE7QUFBQTs7QUFBQSwySUNEaUJDLFNEQ2pCOztBQUNXLGNBQUFDLFdBQUEsR0FBYyxtQkFBZDtBQURYO0FBZ0NDOzs7OzBDQTFCeUI7QUFDbEIsaUJBQUtDLFFBQUwsR0FBZ0IseUJBQWhCO0FBQ0EsaUJBQUtDLE9BQUwsR0FBZSxFQUFmO0FBRUEsaUJBQUtDLFNBQUwsQ0FBZUMsR0FBZixDQUFtQix3QkFBbkIsRUFBNkMscUJBQTdDO0FBQ0EsaUJBQUtDLFFBQUwsR0FBZ0IsQ0FBQyxDQUFqQjtBQUNIOzs7MkNBRXNCO0FBQUE7O0FBQ25CLGlCQUFLQyxVQUFMLEdBQWtCLHdDQUFsQjtBQUNBLGlCQUFLQSxVQUFMLENBQWdCRixHQUFoQixDQUFvQiwwQkFBT0csT0FBUCxDQUFlQyxhQUFmLENBQTZCQyxTQUE3QixDQUF1QyxtQkFBTztBQUM5RCxrQ0FBSyxPQUFLQyxRQUFWLEVBQW9CO0FBQUEsMkJBQVNDLE1BQU1DLE1BQU4sRUFBVDtBQUFBLGlCQUFwQjtBQUNBLHVCQUFLQyxXQUFMLENBQWlCQyxPQUFqQjtBQUNILGFBSG1CLENBQXBCO0FBSUEsaUJBQUtSLFVBQUwsQ0FBZ0JGLEdBQWhCLENBQW9CLDBCQUFPRyxPQUFQLENBQWVRLE1BQWYsQ0FBc0JDLEtBQXRCLENBQTRCLEdBQTVCLEVBQWlDUCxTQUFqQyxDQUEyQztBQUFBLHVCQUFNLE9BQUtRLGNBQUwsRUFBTjtBQUFBLGFBQTNDLENBQXBCO0FBQ0EsaUJBQUtBLGNBQUw7QUFDSDs7OzJDQUVzQjtBQUNuQixpQkFBS1gsVUFBTCxDQUFnQlksT0FBaEI7QUFDSDs7O3lDQUVxQjtBQUNsQixnQkFBTUMsT0FBYSxLQUFLQyxnQkFBTCxJQUF5QixLQUFLQSxnQkFBTCxDQUFzQkEsZ0JBQWxFO0FBQ0EsZ0JBQUlELElBQUosRUFBVUEsS0FBS0Usc0JBQUw7QUFDYjs7OztFQS9Ca0NDLGMiLCJmaWxlIjoibGliL3ZpZXdzL2J1aWxkLW91dHB1dC1wYW5lLXZpZXcuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiB0c2xpbnQ6ZGlzYWJsZTpuby1zdHJpbmctbGl0ZXJhbCAqL1xyXG5pbXBvcnQgeyBlYWNoIH0gZnJvbSAnbG9kYXNoJztcclxuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSB9IGZyb20gJ3RzLWRpc3Bvc2FibGVzJztcclxuaW1wb3J0IHsgc2VydmVyIH0gZnJvbSAnLi4vYXRvbS9zZXJ2ZXItaW5mb3JtYXRpb24nO1xyXG5pbXBvcnQgeyBDb252ZXJ0IH0gZnJvbSAnLi4vc2VydmljZXMvYW5zaS10by1odG1sJztcclxuXHJcbi8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpleHBvcnQtbmFtZVxyXG5leHBvcnQgY2xhc3MgQnVpbGRPdXRwdXRXaW5kb3cgZXh0ZW5kcyBIVE1MRGl2RWxlbWVudCBpbXBsZW1lbnRzIFdlYkNvbXBvbmVudCB7XHJcbiAgICBwdWJsaWMgZGlzcGxheU5hbWUgPSAnQnVpbGRPdXRwdXRXaW5kb3cnO1xyXG4gICAgcHJpdmF0ZSBfY29udmVydDogYW55O1xyXG4gICAgcHJpdmF0ZSBfb3V0cHV0OiBPdXRwdXRNZXNzYWdlW107XHJcbiAgICBwcml2YXRlIGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XHJcblxyXG4gICAgcHVibGljIGNyZWF0ZWRDYWxsYmFjaygpIHtcclxuICAgICAgICB0aGlzLl9jb252ZXJ0ID0gbmV3IENvbnZlcnQoKTtcclxuICAgICAgICB0aGlzLl9vdXRwdXQgPSBbXTtcclxuXHJcbiAgICAgICAgdGhpcy5jbGFzc0xpc3QuYWRkKCdidWlsZC1vdXRwdXQtcGFuZS12aWV3JywgJ25hdGl2ZS1rZXktYmluZGluZ3MnKTtcclxuICAgICAgICB0aGlzLnRhYkluZGV4ID0gLTE7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGF0dGFjaGVkQ2FsbGJhY2soKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKHNlcnZlci5vYnNlcnZlLm91dHB1dEVsZW1lbnQuc3Vic2NyaWJlKGVsZW1lbnQgPT4ge1xyXG4gICAgICAgICAgICBlYWNoKHRoaXMuY2hpbGRyZW4sIGNoaWxkID0+IGNoaWxkLnJlbW92ZSgpKTtcclxuICAgICAgICAgICAgdGhpcy5hcHBlbmRDaGlsZChlbGVtZW50KTtcclxuICAgICAgICB9KSk7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChzZXJ2ZXIub2JzZXJ2ZS5vdXRwdXQuZGVsYXkoMTAwKS5zdWJzY3JpYmUoKCkgPT4gdGhpcy5zY3JvbGxUb0JvdHRvbSgpKSk7XHJcbiAgICAgICAgdGhpcy5zY3JvbGxUb0JvdHRvbSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkZXRhY2hlZENhbGxiYWNrKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBzY3JvbGxUb0JvdHRvbSgpIHtcclxuICAgICAgICBjb25zdCBpdGVtID0gPGFueT4odGhpcy5sYXN0RWxlbWVudENoaWxkICYmIHRoaXMubGFzdEVsZW1lbnRDaGlsZC5sYXN0RWxlbWVudENoaWxkKTtcclxuICAgICAgICBpZiAoaXRlbSkgaXRlbS5zY3JvbGxJbnRvVmlld0lmTmVlZGVkKCk7XHJcbiAgICB9XHJcbn1cclxuIiwiaW1wb3J0IHsgZWFjaCB9IGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlIH0gZnJvbSAndHMtZGlzcG9zYWJsZXMnO1xuaW1wb3J0IHsgc2VydmVyIH0gZnJvbSAnLi4vYXRvbS9zZXJ2ZXItaW5mb3JtYXRpb24nO1xuaW1wb3J0IHsgQ29udmVydCB9IGZyb20gJy4uL3NlcnZpY2VzL2Fuc2ktdG8taHRtbCc7XG5leHBvcnQgY2xhc3MgQnVpbGRPdXRwdXRXaW5kb3cgZXh0ZW5kcyBIVE1MRGl2RWxlbWVudCB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKC4uLmFyZ3VtZW50cyk7XG4gICAgICAgIHRoaXMuZGlzcGxheU5hbWUgPSAnQnVpbGRPdXRwdXRXaW5kb3cnO1xuICAgIH1cbiAgICBjcmVhdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMuX2NvbnZlcnQgPSBuZXcgQ29udmVydCgpO1xuICAgICAgICB0aGlzLl9vdXRwdXQgPSBbXTtcbiAgICAgICAgdGhpcy5jbGFzc0xpc3QuYWRkKCdidWlsZC1vdXRwdXQtcGFuZS12aWV3JywgJ25hdGl2ZS1rZXktYmluZGluZ3MnKTtcbiAgICAgICAgdGhpcy50YWJJbmRleCA9IC0xO1xuICAgIH1cbiAgICBhdHRhY2hlZENhbGxiYWNrKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKHNlcnZlci5vYnNlcnZlLm91dHB1dEVsZW1lbnQuc3Vic2NyaWJlKGVsZW1lbnQgPT4ge1xuICAgICAgICAgICAgZWFjaCh0aGlzLmNoaWxkcmVuLCBjaGlsZCA9PiBjaGlsZC5yZW1vdmUoKSk7XG4gICAgICAgICAgICB0aGlzLmFwcGVuZENoaWxkKGVsZW1lbnQpO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoc2VydmVyLm9ic2VydmUub3V0cHV0LmRlbGF5KDEwMCkuc3Vic2NyaWJlKCgpID0+IHRoaXMuc2Nyb2xsVG9Cb3R0b20oKSkpO1xuICAgICAgICB0aGlzLnNjcm9sbFRvQm90dG9tKCk7XG4gICAgfVxuICAgIGRldGFjaGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfVxuICAgIHNjcm9sbFRvQm90dG9tKCkge1xuICAgICAgICBjb25zdCBpdGVtID0gKHRoaXMubGFzdEVsZW1lbnRDaGlsZCAmJiB0aGlzLmxhc3RFbGVtZW50Q2hpbGQubGFzdEVsZW1lbnRDaGlsZCk7XG4gICAgICAgIGlmIChpdGVtKVxuICAgICAgICAgICAgaXRlbS5zY3JvbGxJbnRvVmlld0lmTmVlZGVkKCk7XG4gICAgfVxufVxuIl19
