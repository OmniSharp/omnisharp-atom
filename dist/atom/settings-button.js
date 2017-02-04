'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.settingsButton = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _tsDisposables = require('ts-disposables');

var _dock = require('../atom/dock');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var SettingsButton = function () {
    function SettingsButton() {
        _classCallCheck(this, SettingsButton);

        this.required = true;
        this.title = 'Show Settings button';
        this.tooltip = 'Show Settings';
        this.description = 'Shows the settings button on the OmniSharp Dock';
        this.default = true;
    }

    _createClass(SettingsButton, [{
        key: 'activate',
        value: function activate() {
            var _this = this;

            this.disposable = new _tsDisposables.CompositeDisposable();
            var tooltip = void 0;
            var htmlButton = document.createElement('a');
            htmlButton.classList.add('btn', 'icon-gear');
            htmlButton.onclick = function () {
                return atom.commands.dispatch(atom.views.getView(atom.workspace), 'omnisharp-atom:settings');
            };
            htmlButton.onmouseenter = function (e) {
                tooltip = atom.tooltips.add(e.currentTarget, { title: _this.tooltip });
                _this.disposable.add(tooltip);
            };
            htmlButton.onmouseleave = function (e) {
                if (tooltip) {
                    _this.disposable.remove(tooltip);
                    tooltip.dispose();
                }
            };
            this.disposable.add(_dock.dock.addButton('settings-button', 'Settings', htmlButton, { priority: 999 }));
        }
    }, {
        key: 'dispose',
        value: function dispose() {
            this.disposable.dispose();
        }
    }]);

    return SettingsButton;
}();

var settingsButton = exports.settingsButton = new SettingsButton();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9hdG9tL3NldHRpbmdzLWJ1dHRvbi50cyJdLCJuYW1lcyI6WyJTZXR0aW5nc0J1dHRvbiIsInJlcXVpcmVkIiwidGl0bGUiLCJ0b29sdGlwIiwiZGVzY3JpcHRpb24iLCJkZWZhdWx0IiwiZGlzcG9zYWJsZSIsImh0bWxCdXR0b24iLCJkb2N1bWVudCIsImNyZWF0ZUVsZW1lbnQiLCJjbGFzc0xpc3QiLCJhZGQiLCJvbmNsaWNrIiwiYXRvbSIsImNvbW1hbmRzIiwiZGlzcGF0Y2giLCJ2aWV3cyIsImdldFZpZXciLCJ3b3Jrc3BhY2UiLCJvbm1vdXNlZW50ZXIiLCJ0b29sdGlwcyIsImUiLCJjdXJyZW50VGFyZ2V0Iiwib25tb3VzZWxlYXZlIiwicmVtb3ZlIiwiZGlzcG9zZSIsImFkZEJ1dHRvbiIsInByaW9yaXR5Iiwic2V0dGluZ3NCdXR0b24iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQUNBOzs7O0lBRUFBLGM7QUFBQSw4QkFBQTtBQUFBOztBQWtDVyxhQUFBQyxRQUFBLEdBQVcsSUFBWDtBQUNBLGFBQUFDLEtBQUEsR0FBUSxzQkFBUjtBQUNBLGFBQUFDLE9BQUEsR0FBVSxlQUFWO0FBQ0EsYUFBQUMsV0FBQSxHQUFjLGlEQUFkO0FBQ0EsYUFBQUMsT0FBQSxHQUFVLElBQVY7QUFDVjs7OzttQ0FwQ2tCO0FBQUE7O0FBQ1gsaUJBQUtDLFVBQUwsR0FBa0Isd0NBQWxCO0FBQ0EsZ0JBQUlILGdCQUFKO0FBRUEsZ0JBQU1JLGFBQWFDLFNBQVNDLGFBQVQsQ0FBdUIsR0FBdkIsQ0FBbkI7QUFDQUYsdUJBQVdHLFNBQVgsQ0FBcUJDLEdBQXJCLENBQXlCLEtBQXpCLEVBQStCLFdBQS9CO0FBRUFKLHVCQUFXSyxPQUFYLEdBQXFCO0FBQUEsdUJBQU1DLEtBQUtDLFFBQUwsQ0FBY0MsUUFBZCxDQUF1QkYsS0FBS0csS0FBTCxDQUFXQyxPQUFYLENBQW1CSixLQUFLSyxTQUF4QixDQUF2QixFQUEyRCx5QkFBM0QsQ0FBTjtBQUFBLGFBQXJCO0FBQ0FYLHVCQUFXWSxZQUFYLEdBQTBCLGFBQUM7QUFDdkJoQiwwQkFBVVUsS0FBS08sUUFBTCxDQUFjVCxHQUFkLENBQXVCVSxFQUFFQyxhQUF6QixFQUF3QyxFQUFFcEIsT0FBTyxNQUFLQyxPQUFkLEVBQXhDLENBQVY7QUFDQSxzQkFBS0csVUFBTCxDQUFnQkssR0FBaEIsQ0FBb0JSLE9BQXBCO0FBQ0gsYUFIRDtBQUlBSSx1QkFBV2dCLFlBQVgsR0FBMEIsYUFBQztBQUN2QixvQkFBSXBCLE9BQUosRUFBYTtBQUNULDBCQUFLRyxVQUFMLENBQWdCa0IsTUFBaEIsQ0FBdUJyQixPQUF2QjtBQUNBQSw0QkFBUXNCLE9BQVI7QUFDSDtBQUNKLGFBTEQ7QUFPQSxpQkFBS25CLFVBQUwsQ0FBZ0JLLEdBQWhCLENBQW9CLFdBQUtlLFNBQUwsQ0FDaEIsaUJBRGdCLEVBRWhCLFVBRmdCLEVBR2hCbkIsVUFIZ0IsRUFJaEIsRUFBRW9CLFVBQVUsR0FBWixFQUpnQixDQUFwQjtBQU1IOzs7a0NBRWE7QUFDVixpQkFBS3JCLFVBQUwsQ0FBZ0JtQixPQUFoQjtBQUNIOzs7Ozs7QUFTRSxJQUFNRywwQ0FBaUIsSUFBSTVCLGNBQUosRUFBdkIiLCJmaWxlIjoibGliL2F0b20vc2V0dGluZ3MtYnV0dG9uLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtDb21wb3NpdGVEaXNwb3NhYmxlLCBJRGlzcG9zYWJsZX0gZnJvbSAndHMtZGlzcG9zYWJsZXMnO1xyXG5pbXBvcnQge2RvY2t9IGZyb20gJy4uL2F0b20vZG9jayc7XHJcblxyXG5jbGFzcyBTZXR0aW5nc0J1dHRvbiBpbXBsZW1lbnRzIElGZWF0dXJlIHtcclxuICAgIHByaXZhdGUgZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxuXHJcbiAgICBwdWJsaWMgYWN0aXZhdGUoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgICAgICBsZXQgdG9vbHRpcCA6SURpc3Bvc2FibGU7XHJcblxyXG4gICAgICAgIGNvbnN0IGh0bWxCdXR0b24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XHJcbiAgICAgICAgaHRtbEJ1dHRvbi5jbGFzc0xpc3QuYWRkKCdidG4nLCdpY29uLWdlYXInKTtcclxuXHJcbiAgICAgICAgaHRtbEJ1dHRvbi5vbmNsaWNrID0gKCkgPT4gYXRvbS5jb21tYW5kcy5kaXNwYXRjaChhdG9tLnZpZXdzLmdldFZpZXcoYXRvbS53b3Jrc3BhY2UpLCAnb21uaXNoYXJwLWF0b206c2V0dGluZ3MnKTtcclxuICAgICAgICBodG1sQnV0dG9uLm9ubW91c2VlbnRlciA9IGUgPT4ge1xyXG4gICAgICAgICAgICB0b29sdGlwID0gYXRvbS50b29sdGlwcy5hZGQoPGFueT5lLmN1cnJlbnRUYXJnZXQsIHsgdGl0bGU6IHRoaXMudG9vbHRpcCB9KTtcclxuICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZCh0b29sdGlwKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIGh0bWxCdXR0b24ub25tb3VzZWxlYXZlID0gZSA9PiB7XHJcbiAgICAgICAgICAgIGlmICh0b29sdGlwKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUucmVtb3ZlKHRvb2x0aXApO1xyXG4gICAgICAgICAgICAgICAgdG9vbHRpcC5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGRvY2suYWRkQnV0dG9uKFxyXG4gICAgICAgICAgICAnc2V0dGluZ3MtYnV0dG9uJyxcclxuICAgICAgICAgICAgJ1NldHRpbmdzJyxcclxuICAgICAgICAgICAgaHRtbEJ1dHRvbixcclxuICAgICAgICAgICAgeyBwcmlvcml0eTogOTk5IH1cclxuICAgICAgICApKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGlzcG9zZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZXF1aXJlZCA9IHRydWU7XHJcbiAgICBwdWJsaWMgdGl0bGUgPSAnU2hvdyBTZXR0aW5ncyBidXR0b24nO1xyXG4gICAgcHVibGljIHRvb2x0aXAgPSAnU2hvdyBTZXR0aW5ncyc7XHJcbiAgICBwdWJsaWMgZGVzY3JpcHRpb24gPSAnU2hvd3MgdGhlIHNldHRpbmdzIGJ1dHRvbiBvbiB0aGUgT21uaVNoYXJwIERvY2snO1xyXG4gICAgcHVibGljIGRlZmF1bHQgPSB0cnVlO1xyXG59XHJcblxyXG5leHBvcnQgY29uc3Qgc2V0dGluZ3NCdXR0b24gPSBuZXcgU2V0dGluZ3NCdXR0b24oKTtcclxuIl19
