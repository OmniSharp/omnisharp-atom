"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.statusBar = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _omnisharpClient = require("omnisharp-client");

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

            this.disposable = new _omnisharpClient.CompositeDisposable();
            this.disposable.add(_omnisharpClient.Disposable.create(function () {
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
            this.disposable.add(_omnisharpClient.Disposable.create(function () {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9hdG9tL3N0YXR1cy1iYXIuanMiLCJsaWIvYXRvbS9zdGF0dXMtYmFyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQUNBOzs7O0lDRUE7QUFBQSx5QkFBQTs7O0FBSVksYUFBQSxPQUFBLEdBQVUsS0FBVixDQUpaO0FBeUNXLGFBQUEsUUFBQSxHQUFXLElBQVgsQ0F6Q1g7QUEwQ1csYUFBQSxLQUFBLEdBQVEsWUFBUixDQTFDWDtBQTJDVyxhQUFBLFdBQUEsR0FBYyxtREFBZCxDQTNDWDtLQUFBOzs7O21DQU1tQjs7O0FBQ1gsaUJBQUssVUFBTCxHQUFrQiwwQ0FBbEIsQ0FEVztBQUVYLGlCQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsNEJBQVcsTUFBWCxDQUFrQjt1QkFBTSxNQUFLLE9BQUwsR0FBZSxLQUFmO2FBQU4sQ0FBdEMsRUFGVzs7Ozs4QkFLRixXQUFjO0FBQ3ZCLGlCQUFLLFNBQUwsR0FBaUIsU0FBakIsQ0FEdUI7QUFHdkIsZ0JBQUksS0FBSyxPQUFMLEVBQWM7QUFDZCxxQkFBSyxPQUFMLEdBRGM7YUFBbEI7Ozs7aUNBS1M7QUFDVCxnQkFBSSxLQUFLLFNBQUwsRUFBZ0I7QUFBRSxxQkFBSyxPQUFMLEdBQUY7YUFBcEI7QUFDQSxpQkFBSyxPQUFMLEdBQWUsSUFBZixDQUZTOzs7O2tDQUtFOzs7QUFDWCxpQkFBSyxJQUFMLEdBQVkscUNBQVosQ0FEVztBQUVYLGdCQUFNLE9BQU8sS0FBSyxTQUFMLENBQWUsV0FBZixDQUEyQjtBQUNwQyxzQkFBTSxLQUFLLElBQUw7QUFDTiwwQkFBVSxDQUFDLEtBQUQ7YUFGRCxDQUFQLENBRks7QUFNWCxpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLEtBQUssSUFBTCxDQUFwQixDQU5XO0FBT1gsaUJBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQiw0QkFBVyxNQUFYLENBQWtCLFlBQUE7QUFDbEMscUJBQUssT0FBTCxHQURrQztBQUVsQyx1QkFBSyxJQUFMLENBQVUsTUFBVixHQUZrQzthQUFBLENBQXRDLEVBUFc7Ozs7a0NBYUQ7QUFDVixpQkFBSyxVQUFMLENBQWdCLE9BQWhCLEdBRFU7Ozs7Ozs7QUFTWCxJQUFNLGdDQUFZLElBQUksU0FBSixFQUFaIiwiZmlsZSI6ImxpYi9hdG9tL3N0YXR1cy1iYXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlIH0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcbmltcG9ydCB7IFN0YXR1c0JhckVsZW1lbnQgfSBmcm9tIFwiLi4vdmlld3Mvc3RhdHVzLWJhci12aWV3XCI7XG5jbGFzcyBTdGF0dXNCYXIge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLl9hY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5yZXF1aXJlZCA9IHRydWU7XG4gICAgICAgIHRoaXMudGl0bGUgPSBcIlN0YXR1cyBCYXJcIjtcbiAgICAgICAgdGhpcy5kZXNjcmlwdGlvbiA9IFwiQWRkcyB0aGUgT21uaVNoYXJwIHN0YXR1cyBpY29uIHRvIHRoZSBzdGF0dXMgYmFyLlwiO1xuICAgIH1cbiAgICBhY3RpdmF0ZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB0aGlzLl9hY3RpdmUgPSBmYWxzZSkpO1xuICAgIH1cbiAgICBzZXR1cChzdGF0dXNCYXIpIHtcbiAgICAgICAgdGhpcy5zdGF0dXNCYXIgPSBzdGF0dXNCYXI7XG4gICAgICAgIGlmICh0aGlzLl9hY3RpdmUpIHtcbiAgICAgICAgICAgIHRoaXMuX2F0dGFjaCgpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGF0dGFjaCgpIHtcbiAgICAgICAgaWYgKHRoaXMuc3RhdHVzQmFyKSB7XG4gICAgICAgICAgICB0aGlzLl9hdHRhY2goKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9hY3RpdmUgPSB0cnVlO1xuICAgIH1cbiAgICBfYXR0YWNoKCkge1xuICAgICAgICB0aGlzLnZpZXcgPSBuZXcgU3RhdHVzQmFyRWxlbWVudCgpO1xuICAgICAgICBjb25zdCB0aWxlID0gdGhpcy5zdGF0dXNCYXIuYWRkTGVmdFRpbGUoe1xuICAgICAgICAgICAgaXRlbTogdGhpcy52aWV3LFxuICAgICAgICAgICAgcHJpb3JpdHk6IC0xMDAwMFxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZCh0aGlzLnZpZXcpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcbiAgICAgICAgICAgIHRpbGUuZGVzdHJveSgpO1xuICAgICAgICAgICAgdGhpcy52aWV3LnJlbW92ZSgpO1xuICAgICAgICB9KSk7XG4gICAgfVxuICAgIGRpc3Bvc2UoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfVxufVxuZXhwb3J0IGNvbnN0IHN0YXR1c0JhciA9IG5ldyBTdGF0dXNCYXI7XG4iLCJpbXBvcnQge0NvbXBvc2l0ZURpc3Bvc2FibGUsIERpc3Bvc2FibGV9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XHJcbmltcG9ydCB7U3RhdHVzQmFyRWxlbWVudH0gZnJvbSBcIi4uL3ZpZXdzL3N0YXR1cy1iYXItdmlld1wiO1xyXG5cclxuY2xhc3MgU3RhdHVzQmFyIGltcGxlbWVudHMgSUF0b21GZWF0dXJlIHtcclxuICAgIHByaXZhdGUgZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxuICAgIHByaXZhdGUgdmlldzogU3RhdHVzQmFyRWxlbWVudDtcclxuICAgIHByaXZhdGUgc3RhdHVzQmFyOiBhbnk7XHJcbiAgICBwcml2YXRlIF9hY3RpdmUgPSBmYWxzZTtcclxuXHJcbiAgICBwdWJsaWMgYWN0aXZhdGUoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHRoaXMuX2FjdGl2ZSA9IGZhbHNlKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHNldHVwKHN0YXR1c0JhcjogYW55KSB7XHJcbiAgICAgICAgdGhpcy5zdGF0dXNCYXIgPSBzdGF0dXNCYXI7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9hY3RpdmUpIHtcclxuICAgICAgICAgICAgdGhpcy5fYXR0YWNoKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBhdHRhY2goKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuc3RhdHVzQmFyKSB7IHRoaXMuX2F0dGFjaCgpOyB9XHJcbiAgICAgICAgdGhpcy5fYWN0aXZlID0gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9hdHRhY2goKSB7XHJcbiAgICAgICAgdGhpcy52aWV3ID0gbmV3IFN0YXR1c0JhckVsZW1lbnQoKTtcclxuICAgICAgICBjb25zdCB0aWxlID0gdGhpcy5zdGF0dXNCYXIuYWRkTGVmdFRpbGUoe1xyXG4gICAgICAgICAgICBpdGVtOiB0aGlzLnZpZXcsXHJcbiAgICAgICAgICAgIHByaW9yaXR5OiAtMTAwMDBcclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKHRoaXMudmlldyk7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XHJcbiAgICAgICAgICAgIHRpbGUuZGVzdHJveSgpO1xyXG4gICAgICAgICAgICB0aGlzLnZpZXcucmVtb3ZlKCk7XHJcbiAgICAgICAgfSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkaXNwb3NlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlcXVpcmVkID0gdHJ1ZTtcclxuICAgIHB1YmxpYyB0aXRsZSA9IFwiU3RhdHVzIEJhclwiO1xyXG4gICAgcHVibGljIGRlc2NyaXB0aW9uID0gXCJBZGRzIHRoZSBPbW5pU2hhcnAgc3RhdHVzIGljb24gdG8gdGhlIHN0YXR1cyBiYXIuXCI7XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBzdGF0dXNCYXIgPSBuZXcgU3RhdHVzQmFyO1xyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
