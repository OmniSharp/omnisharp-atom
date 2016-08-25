"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.statusBar = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _tsDisposables = require("ts-disposables");

var _statusBarView = require("../views/status-bar-view");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var StatusBar = function () {
    function StatusBar() {
        _classCallCheck(this, StatusBar);

        this._active = false;
        this.required = true;
        this.title = "Status Bar";
        this.description = "Adds the OmniSharp status icon to the status bar.";
    }

    _createClass(StatusBar, [{
        key: "activate",
        value: function activate() {
            var _this = this;

            this.disposable = new _tsDisposables.CompositeDisposable();
            this.disposable.add(_tsDisposables.Disposable.create(function () {
                return _this._active = false;
            }));
        }
    }, {
        key: "setup",
        value: function setup(statusBar) {
            this.statusBar = statusBar;
            if (this._active) {
                this._attach();
            }
        }
    }, {
        key: "attach",
        value: function attach() {
            if (this.statusBar) {
                this._attach();
            }
            this._active = true;
        }
    }, {
        key: "_attach",
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
        key: "dispose",
        value: function dispose() {
            this.disposable.dispose();
        }
    }]);

    return StatusBar;
}();

var statusBar = exports.statusBar = new StatusBar();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9hdG9tL3N0YXR1cy1iYXIuanMiLCJsaWIvYXRvbS9zdGF0dXMtYmFyLnRzIl0sIm5hbWVzIjpbIlN0YXR1c0JhciIsIl9hY3RpdmUiLCJyZXF1aXJlZCIsInRpdGxlIiwiZGVzY3JpcHRpb24iLCJkaXNwb3NhYmxlIiwiYWRkIiwiY3JlYXRlIiwic3RhdHVzQmFyIiwiX2F0dGFjaCIsInZpZXciLCJ0aWxlIiwiYWRkTGVmdFRpbGUiLCJpdGVtIiwicHJpb3JpdHkiLCJkZXN0cm95IiwicmVtb3ZlIiwiZGlzcG9zZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0FBQ0E7Ozs7SUNFQUEsUztBQUFBLHlCQUFBO0FBQUE7O0FBSVksYUFBQUMsT0FBQSxHQUFVLEtBQVY7QUFxQ0QsYUFBQUMsUUFBQSxHQUFXLElBQVg7QUFDQSxhQUFBQyxLQUFBLEdBQVEsWUFBUjtBQUNBLGFBQUFDLFdBQUEsR0FBYyxtREFBZDtBQUNWOzs7O21DQXRDa0I7QUFBQTs7QUFDWCxpQkFBS0MsVUFBTCxHQUFrQix3Q0FBbEI7QUFDQSxpQkFBS0EsVUFBTCxDQUFnQkMsR0FBaEIsQ0FBb0IsMEJBQVdDLE1BQVgsQ0FBa0I7QUFBQSx1QkFBTSxNQUFLTixPQUFMLEdBQWUsS0FBckI7QUFBQSxhQUFsQixDQUFwQjtBQUNIOzs7OEJBRVlPLFMsRUFBYztBQUN2QixpQkFBS0EsU0FBTCxHQUFpQkEsU0FBakI7QUFFQSxnQkFBSSxLQUFLUCxPQUFULEVBQWtCO0FBQ2QscUJBQUtRLE9BQUw7QUFDSDtBQUNKOzs7aUNBRVk7QUFDVCxnQkFBSSxLQUFLRCxTQUFULEVBQW9CO0FBQUUscUJBQUtDLE9BQUw7QUFBaUI7QUFDdkMsaUJBQUtSLE9BQUwsR0FBZSxJQUFmO0FBQ0g7OztrQ0FFYztBQUFBOztBQUNYLGlCQUFLUyxJQUFMLEdBQVkscUNBQVo7QUFDQSxnQkFBTUMsT0FBTyxLQUFLSCxTQUFMLENBQWVJLFdBQWYsQ0FBMkI7QUFDcENDLHNCQUFNLEtBQUtILElBRHlCO0FBRXBDSSwwQkFBVSxDQUFDO0FBRnlCLGFBQTNCLENBQWI7QUFJQSxpQkFBS1QsVUFBTCxDQUFnQkMsR0FBaEIsQ0FBb0IsS0FBS0ksSUFBekI7QUFDQSxpQkFBS0wsVUFBTCxDQUFnQkMsR0FBaEIsQ0FBb0IsMEJBQVdDLE1BQVgsQ0FBa0IsWUFBQTtBQUNsQ0kscUJBQUtJLE9BQUw7QUFDQSx1QkFBS0wsSUFBTCxDQUFVTSxNQUFWO0FBQ0gsYUFIbUIsQ0FBcEI7QUFJSDs7O2tDQUVhO0FBQ1YsaUJBQUtYLFVBQUwsQ0FBZ0JZLE9BQWhCO0FBQ0g7Ozs7OztBQU9FLElBQU1ULGdDQUFZLElBQUlSLFNBQUosRUFBbEIiLCJmaWxlIjoibGliL2F0b20vc3RhdHVzLWJhci5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUsIERpc3Bvc2FibGUgfSBmcm9tIFwidHMtZGlzcG9zYWJsZXNcIjtcbmltcG9ydCB7IFN0YXR1c0JhckVsZW1lbnQgfSBmcm9tIFwiLi4vdmlld3Mvc3RhdHVzLWJhci12aWV3XCI7XG5jbGFzcyBTdGF0dXNCYXIge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLl9hY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5yZXF1aXJlZCA9IHRydWU7XG4gICAgICAgIHRoaXMudGl0bGUgPSBcIlN0YXR1cyBCYXJcIjtcbiAgICAgICAgdGhpcy5kZXNjcmlwdGlvbiA9IFwiQWRkcyB0aGUgT21uaVNoYXJwIHN0YXR1cyBpY29uIHRvIHRoZSBzdGF0dXMgYmFyLlwiO1xuICAgIH1cbiAgICBhY3RpdmF0ZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB0aGlzLl9hY3RpdmUgPSBmYWxzZSkpO1xuICAgIH1cbiAgICBzZXR1cChzdGF0dXNCYXIpIHtcbiAgICAgICAgdGhpcy5zdGF0dXNCYXIgPSBzdGF0dXNCYXI7XG4gICAgICAgIGlmICh0aGlzLl9hY3RpdmUpIHtcbiAgICAgICAgICAgIHRoaXMuX2F0dGFjaCgpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGF0dGFjaCgpIHtcbiAgICAgICAgaWYgKHRoaXMuc3RhdHVzQmFyKSB7XG4gICAgICAgICAgICB0aGlzLl9hdHRhY2goKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9hY3RpdmUgPSB0cnVlO1xuICAgIH1cbiAgICBfYXR0YWNoKCkge1xuICAgICAgICB0aGlzLnZpZXcgPSBuZXcgU3RhdHVzQmFyRWxlbWVudCgpO1xuICAgICAgICBjb25zdCB0aWxlID0gdGhpcy5zdGF0dXNCYXIuYWRkTGVmdFRpbGUoe1xuICAgICAgICAgICAgaXRlbTogdGhpcy52aWV3LFxuICAgICAgICAgICAgcHJpb3JpdHk6IC0xMDAwMFxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZCh0aGlzLnZpZXcpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcbiAgICAgICAgICAgIHRpbGUuZGVzdHJveSgpO1xuICAgICAgICAgICAgdGhpcy52aWV3LnJlbW92ZSgpO1xuICAgICAgICB9KSk7XG4gICAgfVxuICAgIGRpc3Bvc2UoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfVxufVxuZXhwb3J0IGNvbnN0IHN0YXR1c0JhciA9IG5ldyBTdGF0dXNCYXI7XG4iLCJpbXBvcnQge0NvbXBvc2l0ZURpc3Bvc2FibGUsIERpc3Bvc2FibGV9IGZyb20gXCJ0cy1kaXNwb3NhYmxlc1wiO1xyXG5pbXBvcnQge1N0YXR1c0JhckVsZW1lbnR9IGZyb20gXCIuLi92aWV3cy9zdGF0dXMtYmFyLXZpZXdcIjtcclxuXHJcbmNsYXNzIFN0YXR1c0JhciBpbXBsZW1lbnRzIElBdG9tRmVhdHVyZSB7XHJcbiAgICBwcml2YXRlIGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XHJcbiAgICBwcml2YXRlIHZpZXc6IFN0YXR1c0JhckVsZW1lbnQ7XHJcbiAgICBwcml2YXRlIHN0YXR1c0JhcjogYW55O1xyXG4gICAgcHJpdmF0ZSBfYWN0aXZlID0gZmFsc2U7XHJcblxyXG4gICAgcHVibGljIGFjdGl2YXRlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB0aGlzLl9hY3RpdmUgPSBmYWxzZSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzZXR1cChzdGF0dXNCYXI6IGFueSkge1xyXG4gICAgICAgIHRoaXMuc3RhdHVzQmFyID0gc3RhdHVzQmFyO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5fYWN0aXZlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2F0dGFjaCgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgYXR0YWNoKCkge1xyXG4gICAgICAgIGlmICh0aGlzLnN0YXR1c0JhcikgeyB0aGlzLl9hdHRhY2goKTsgfVxyXG4gICAgICAgIHRoaXMuX2FjdGl2ZSA9IHRydWU7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfYXR0YWNoKCkge1xyXG4gICAgICAgIHRoaXMudmlldyA9IG5ldyBTdGF0dXNCYXJFbGVtZW50KCk7XHJcbiAgICAgICAgY29uc3QgdGlsZSA9IHRoaXMuc3RhdHVzQmFyLmFkZExlZnRUaWxlKHtcclxuICAgICAgICAgICAgaXRlbTogdGhpcy52aWV3LFxyXG4gICAgICAgICAgICBwcmlvcml0eTogLTEwMDAwXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZCh0aGlzLnZpZXcpO1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xyXG4gICAgICAgICAgICB0aWxlLmRlc3Ryb3koKTtcclxuICAgICAgICAgICAgdGhpcy52aWV3LnJlbW92ZSgpO1xyXG4gICAgICAgIH0pKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGlzcG9zZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZXF1aXJlZCA9IHRydWU7XHJcbiAgICBwdWJsaWMgdGl0bGUgPSBcIlN0YXR1cyBCYXJcIjtcclxuICAgIHB1YmxpYyBkZXNjcmlwdGlvbiA9IFwiQWRkcyB0aGUgT21uaVNoYXJwIHN0YXR1cyBpY29uIHRvIHRoZSBzdGF0dXMgYmFyLlwiO1xyXG59XHJcblxyXG5leHBvcnQgY29uc3Qgc3RhdHVzQmFyID0gbmV3IFN0YXR1c0JhcjtcclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
