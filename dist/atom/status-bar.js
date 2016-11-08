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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9hdG9tL3N0YXR1cy1iYXIuanMiLCJsaWIvYXRvbS9zdGF0dXMtYmFyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQUNBOzs7O0lDRUE7QUFBQSx5QkFBQTs7O0FBSVksYUFBQSxPQUFBLEdBQVUsS0FBVixDQUpaO0FBeUNXLGFBQUEsUUFBQSxHQUFXLElBQVgsQ0F6Q1g7QUEwQ1csYUFBQSxLQUFBLEdBQVEsWUFBUixDQTFDWDtBQTJDVyxhQUFBLFdBQUEsR0FBYyxtREFBZCxDQTNDWDtLQUFBOzs7O21DQU1tQjs7O0FBQ1gsaUJBQUssVUFBTCxHQUFrQix3Q0FBbEIsQ0FEVztBQUVYLGlCQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsMEJBQVcsTUFBWCxDQUFrQjt1QkFBTSxNQUFLLE9BQUwsR0FBZSxLQUFmO2FBQU4sQ0FBdEMsRUFGVzs7Ozs4QkFLRixXQUFjO0FBQ3ZCLGlCQUFLLFNBQUwsR0FBaUIsU0FBakIsQ0FEdUI7QUFHdkIsZ0JBQUksS0FBSyxPQUFMLEVBQWM7QUFDZCxxQkFBSyxPQUFMLEdBRGM7YUFBbEI7Ozs7aUNBS1M7QUFDVCxnQkFBSSxLQUFLLFNBQUwsRUFBZ0I7QUFBRSxxQkFBSyxPQUFMLEdBQUY7YUFBcEI7QUFDQSxpQkFBSyxPQUFMLEdBQWUsSUFBZixDQUZTOzs7O2tDQUtFOzs7QUFDWCxpQkFBSyxJQUFMLEdBQVkscUNBQVosQ0FEVztBQUVYLGdCQUFNLE9BQU8sS0FBSyxTQUFMLENBQWUsV0FBZixDQUEyQjtBQUNwQyxzQkFBTSxLQUFLLElBQUw7QUFDTiwwQkFBVSxDQUFDLEtBQUQ7YUFGRCxDQUFQLENBRks7QUFNWCxpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLEtBQUssSUFBTCxDQUFwQixDQU5XO0FBT1gsaUJBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQiwwQkFBVyxNQUFYLENBQWtCLFlBQUE7QUFDbEMscUJBQUssT0FBTCxHQURrQztBQUVsQyx1QkFBSyxJQUFMLENBQVUsTUFBVixHQUZrQzthQUFBLENBQXRDLEVBUFc7Ozs7a0NBYUQ7QUFDVixpQkFBSyxVQUFMLENBQWdCLE9BQWhCLEdBRFU7Ozs7Ozs7QUFTWCxJQUFNLGdDQUFZLElBQUksU0FBSixFQUFaIiwiZmlsZSI6ImxpYi9hdG9tL3N0YXR1cy1iYXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlIH0gZnJvbSBcInRzLWRpc3Bvc2FibGVzXCI7XG5pbXBvcnQgeyBTdGF0dXNCYXJFbGVtZW50IH0gZnJvbSBcIi4uL3ZpZXdzL3N0YXR1cy1iYXItdmlld1wiO1xuY2xhc3MgU3RhdHVzQmFyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5fYWN0aXZlID0gZmFsc2U7XG4gICAgICAgIHRoaXMucmVxdWlyZWQgPSB0cnVlO1xuICAgICAgICB0aGlzLnRpdGxlID0gXCJTdGF0dXMgQmFyXCI7XG4gICAgICAgIHRoaXMuZGVzY3JpcHRpb24gPSBcIkFkZHMgdGhlIE9tbmlTaGFycCBzdGF0dXMgaWNvbiB0byB0aGUgc3RhdHVzIGJhci5cIjtcbiAgICB9XG4gICAgYWN0aXZhdGUoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4gdGhpcy5fYWN0aXZlID0gZmFsc2UpKTtcbiAgICB9XG4gICAgc2V0dXAoc3RhdHVzQmFyKSB7XG4gICAgICAgIHRoaXMuc3RhdHVzQmFyID0gc3RhdHVzQmFyO1xuICAgICAgICBpZiAodGhpcy5fYWN0aXZlKSB7XG4gICAgICAgICAgICB0aGlzLl9hdHRhY2goKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBhdHRhY2goKSB7XG4gICAgICAgIGlmICh0aGlzLnN0YXR1c0Jhcikge1xuICAgICAgICAgICAgdGhpcy5fYXR0YWNoKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fYWN0aXZlID0gdHJ1ZTtcbiAgICB9XG4gICAgX2F0dGFjaCgpIHtcbiAgICAgICAgdGhpcy52aWV3ID0gbmV3IFN0YXR1c0JhckVsZW1lbnQoKTtcbiAgICAgICAgY29uc3QgdGlsZSA9IHRoaXMuc3RhdHVzQmFyLmFkZExlZnRUaWxlKHtcbiAgICAgICAgICAgIGl0ZW06IHRoaXMudmlldyxcbiAgICAgICAgICAgIHByaW9yaXR5OiAtMTAwMDBcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQodGhpcy52aWV3KTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XG4gICAgICAgICAgICB0aWxlLmRlc3Ryb3koKTtcbiAgICAgICAgICAgIHRoaXMudmlldy5yZW1vdmUoKTtcbiAgICAgICAgfSkpO1xuICAgIH1cbiAgICBkaXNwb3NlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgIH1cbn1cbmV4cG9ydCBjb25zdCBzdGF0dXNCYXIgPSBuZXcgU3RhdHVzQmFyO1xuIiwiaW1wb3J0IHtDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlfSBmcm9tIFwidHMtZGlzcG9zYWJsZXNcIjtcclxuaW1wb3J0IHtTdGF0dXNCYXJFbGVtZW50fSBmcm9tIFwiLi4vdmlld3Mvc3RhdHVzLWJhci12aWV3XCI7XHJcblxyXG5jbGFzcyBTdGF0dXNCYXIgaW1wbGVtZW50cyBJQXRvbUZlYXR1cmUge1xyXG4gICAgcHJpdmF0ZSBkaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xyXG4gICAgcHJpdmF0ZSB2aWV3OiBTdGF0dXNCYXJFbGVtZW50O1xyXG4gICAgcHJpdmF0ZSBzdGF0dXNCYXI6IGFueTtcclxuICAgIHByaXZhdGUgX2FjdGl2ZSA9IGZhbHNlO1xyXG5cclxuICAgIHB1YmxpYyBhY3RpdmF0ZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4gdGhpcy5fYWN0aXZlID0gZmFsc2UpKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2V0dXAoc3RhdHVzQmFyOiBhbnkpIHtcclxuICAgICAgICB0aGlzLnN0YXR1c0JhciA9IHN0YXR1c0JhcjtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX2FjdGl2ZSkge1xyXG4gICAgICAgICAgICB0aGlzLl9hdHRhY2goKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGF0dGFjaCgpIHtcclxuICAgICAgICBpZiAodGhpcy5zdGF0dXNCYXIpIHsgdGhpcy5fYXR0YWNoKCk7IH1cclxuICAgICAgICB0aGlzLl9hY3RpdmUgPSB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX2F0dGFjaCgpIHtcclxuICAgICAgICB0aGlzLnZpZXcgPSBuZXcgU3RhdHVzQmFyRWxlbWVudCgpO1xyXG4gICAgICAgIGNvbnN0IHRpbGUgPSB0aGlzLnN0YXR1c0Jhci5hZGRMZWZ0VGlsZSh7XHJcbiAgICAgICAgICAgIGl0ZW06IHRoaXMudmlldyxcclxuICAgICAgICAgICAgcHJpb3JpdHk6IC0xMDAwMFxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQodGhpcy52aWV3KTtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcclxuICAgICAgICAgICAgdGlsZS5kZXN0cm95KCk7XHJcbiAgICAgICAgICAgIHRoaXMudmlldy5yZW1vdmUoKTtcclxuICAgICAgICB9KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVxdWlyZWQgPSB0cnVlO1xyXG4gICAgcHVibGljIHRpdGxlID0gXCJTdGF0dXMgQmFyXCI7XHJcbiAgICBwdWJsaWMgZGVzY3JpcHRpb24gPSBcIkFkZHMgdGhlIE9tbmlTaGFycCBzdGF0dXMgaWNvbiB0byB0aGUgc3RhdHVzIGJhci5cIjtcclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IHN0YXR1c0JhciA9IG5ldyBTdGF0dXNCYXI7XHJcbiJdfQ==
