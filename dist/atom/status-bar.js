'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.statusBar = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _tsDisposables = require('ts-disposables');

var _statusBarView = require('../views/status-bar-view');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var StatusBar = function () {
    function StatusBar() {
        _classCallCheck(this, StatusBar);

        this._active = false;
        this.required = true;
        this.title = 'Status Bar';
        this.description = 'Adds the OmniSharp status icon to the status bar.';
    }

    _createClass(StatusBar, [{
        key: 'activate',
        value: function activate() {
            var _this = this;

            this.disposable = new _tsDisposables.CompositeDisposable();
            this.disposable.add(_tsDisposables.Disposable.create(function () {
                return _this._active = false;
            }));
        }
    }, {
        key: 'setup',
        value: function setup(statusBar) {
            this.statusBar = statusBar;
            if (this._active) {
                this._attach();
            }
        }
    }, {
        key: 'attach',
        value: function attach() {
            if (this.statusBar) {
                this._attach();
            }
            this._active = true;
        }
    }, {
        key: '_attach',
        value: function _attach() {
            var _this2 = this;

            this.view = new _statusBarView.StatusBarElement();
            var tile = this.statusBar.addLeftTile({
                item: this.view,
                priority: -10000
            });
            this.disposable.add(this.view);
            this.disposable.add(_tsDisposables.Disposable.create(function () {
                tile.destroy();
                _this2.view.remove();
            }));
        }
    }, {
        key: 'dispose',
        value: function dispose() {
            this.disposable.dispose();
        }
    }]);

    return StatusBar;
}();

var statusBar = exports.statusBar = new StatusBar();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9hdG9tL3N0YXR1cy1iYXIudHMiXSwibmFtZXMiOlsiU3RhdHVzQmFyIiwiX2FjdGl2ZSIsInJlcXVpcmVkIiwidGl0bGUiLCJkZXNjcmlwdGlvbiIsImRpc3Bvc2FibGUiLCJhZGQiLCJjcmVhdGUiLCJzdGF0dXNCYXIiLCJfYXR0YWNoIiwidmlldyIsInRpbGUiLCJhZGRMZWZ0VGlsZSIsIml0ZW0iLCJwcmlvcml0eSIsImRlc3Ryb3kiLCJyZW1vdmUiLCJkaXNwb3NlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7QUFDQTs7OztJQUVBQSxTO0FBQUEseUJBQUE7QUFBQTs7QUFJWSxhQUFBQyxPQUFBLEdBQVUsS0FBVjtBQXFDRCxhQUFBQyxRQUFBLEdBQVcsSUFBWDtBQUNBLGFBQUFDLEtBQUEsR0FBUSxZQUFSO0FBQ0EsYUFBQUMsV0FBQSxHQUFjLG1EQUFkO0FBQ1Y7Ozs7bUNBdENrQjtBQUFBOztBQUNYLGlCQUFLQyxVQUFMLEdBQWtCLHdDQUFsQjtBQUNBLGlCQUFLQSxVQUFMLENBQWdCQyxHQUFoQixDQUFvQiwwQkFBV0MsTUFBWCxDQUFrQjtBQUFBLHVCQUFNLE1BQUtOLE9BQUwsR0FBZSxLQUFyQjtBQUFBLGFBQWxCLENBQXBCO0FBQ0g7Ozs4QkFFWU8sUyxFQUFjO0FBQ3ZCLGlCQUFLQSxTQUFMLEdBQWlCQSxTQUFqQjtBQUVBLGdCQUFJLEtBQUtQLE9BQVQsRUFBa0I7QUFDZCxxQkFBS1EsT0FBTDtBQUNIO0FBQ0o7OztpQ0FFWTtBQUNULGdCQUFJLEtBQUtELFNBQVQsRUFBb0I7QUFBRSxxQkFBS0MsT0FBTDtBQUFpQjtBQUN2QyxpQkFBS1IsT0FBTCxHQUFlLElBQWY7QUFDSDs7O2tDQUVjO0FBQUE7O0FBQ1gsaUJBQUtTLElBQUwsR0FBWSxxQ0FBWjtBQUNBLGdCQUFNQyxPQUFPLEtBQUtILFNBQUwsQ0FBZUksV0FBZixDQUEyQjtBQUNwQ0Msc0JBQU0sS0FBS0gsSUFEeUI7QUFFcENJLDBCQUFVLENBQUM7QUFGeUIsYUFBM0IsQ0FBYjtBQUlBLGlCQUFLVCxVQUFMLENBQWdCQyxHQUFoQixDQUFvQixLQUFLSSxJQUF6QjtBQUNBLGlCQUFLTCxVQUFMLENBQWdCQyxHQUFoQixDQUFvQiwwQkFBV0MsTUFBWCxDQUFrQixZQUFBO0FBQ2xDSSxxQkFBS0ksT0FBTDtBQUNBLHVCQUFLTCxJQUFMLENBQVVNLE1BQVY7QUFDSCxhQUhtQixDQUFwQjtBQUlIOzs7a0NBRWE7QUFDVixpQkFBS1gsVUFBTCxDQUFnQlksT0FBaEI7QUFDSDs7Ozs7O0FBT0UsSUFBTVQsZ0NBQVksSUFBSVIsU0FBSixFQUFsQiIsImZpbGUiOiJsaWIvYXRvbS9zdGF0dXMtYmFyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlfSBmcm9tICd0cy1kaXNwb3NhYmxlcyc7XHJcbmltcG9ydCB7U3RhdHVzQmFyRWxlbWVudH0gZnJvbSAnLi4vdmlld3Mvc3RhdHVzLWJhci12aWV3JztcclxuXHJcbmNsYXNzIFN0YXR1c0JhciBpbXBsZW1lbnRzIElBdG9tRmVhdHVyZSB7XHJcbiAgICBwcml2YXRlIGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XHJcbiAgICBwcml2YXRlIHZpZXc6IFN0YXR1c0JhckVsZW1lbnQ7XHJcbiAgICBwcml2YXRlIHN0YXR1c0JhcjogYW55O1xyXG4gICAgcHJpdmF0ZSBfYWN0aXZlID0gZmFsc2U7XHJcblxyXG4gICAgcHVibGljIGFjdGl2YXRlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB0aGlzLl9hY3RpdmUgPSBmYWxzZSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzZXR1cChzdGF0dXNCYXI6IGFueSkge1xyXG4gICAgICAgIHRoaXMuc3RhdHVzQmFyID0gc3RhdHVzQmFyO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5fYWN0aXZlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2F0dGFjaCgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgYXR0YWNoKCkge1xyXG4gICAgICAgIGlmICh0aGlzLnN0YXR1c0JhcikgeyB0aGlzLl9hdHRhY2goKTsgfVxyXG4gICAgICAgIHRoaXMuX2FjdGl2ZSA9IHRydWU7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfYXR0YWNoKCkge1xyXG4gICAgICAgIHRoaXMudmlldyA9IG5ldyBTdGF0dXNCYXJFbGVtZW50KCk7XHJcbiAgICAgICAgY29uc3QgdGlsZSA9IHRoaXMuc3RhdHVzQmFyLmFkZExlZnRUaWxlKHtcclxuICAgICAgICAgICAgaXRlbTogdGhpcy52aWV3LFxyXG4gICAgICAgICAgICBwcmlvcml0eTogLTEwMDAwXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZCh0aGlzLnZpZXcpO1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xyXG4gICAgICAgICAgICB0aWxlLmRlc3Ryb3koKTtcclxuICAgICAgICAgICAgdGhpcy52aWV3LnJlbW92ZSgpO1xyXG4gICAgICAgIH0pKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGlzcG9zZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZXF1aXJlZCA9IHRydWU7XHJcbiAgICBwdWJsaWMgdGl0bGUgPSAnU3RhdHVzIEJhcic7XHJcbiAgICBwdWJsaWMgZGVzY3JpcHRpb24gPSAnQWRkcyB0aGUgT21uaVNoYXJwIHN0YXR1cyBpY29uIHRvIHRoZSBzdGF0dXMgYmFyLic7XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBzdGF0dXNCYXIgPSBuZXcgU3RhdHVzQmFyO1xyXG4iXX0=
