"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.settingsButton = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _tsDisposables = require("ts-disposables");

var _dock = require("../atom/dock");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var SettingsButton = function () {
    function SettingsButton() {
        _classCallCheck(this, SettingsButton);

        this.required = true;
        this.title = "Show Settings button";
        this.tooltip = "Show Settings";
        this.description = "Shows the settings button on the OmniSharp Dock";
        this.default = true;
    }

    _createClass(SettingsButton, [{
        key: "activate",
        value: function activate() {
            var _this = this;

            this.disposable = new _tsDisposables.CompositeDisposable();
            var tooltip = void 0;
            var htmlButton = document.createElement("a");
            htmlButton.classList.add("btn", "icon-gear");
            htmlButton.onclick = function () {
                return atom.commands.dispatch(atom.views.getView(atom.workspace), "omnisharp-atom:settings");
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
            this.disposable.add(_dock.dock.addButton("settings-button", "Settings", htmlButton, { priority: 999 }));
        }
    }, {
        key: "dispose",
        value: function dispose() {
            this.disposable.dispose();
        }
    }]);

    return SettingsButton;
}();

var settingsButton = exports.settingsButton = new SettingsButton();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9hdG9tL3NldHRpbmdzLWJ1dHRvbi5qcyIsImxpYi9hdG9tL3NldHRpbmdzLWJ1dHRvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7QUFDQTs7OztJQ0VBO0FBQUEsOEJBQUE7OztBQWtDVyxhQUFBLFFBQUEsR0FBVyxJQUFYLENBbENYO0FBbUNXLGFBQUEsS0FBQSxHQUFRLHNCQUFSLENBbkNYO0FBb0NXLGFBQUEsT0FBQSxHQUFVLGVBQVYsQ0FwQ1g7QUFxQ1csYUFBQSxXQUFBLEdBQWMsaURBQWQsQ0FyQ1g7QUFzQ1csYUFBQSxPQUFBLEdBQVUsSUFBVixDQXRDWDtLQUFBOzs7O21DQUdtQjs7O0FBQ1gsaUJBQUssVUFBTCxHQUFrQix3Q0FBbEIsQ0FEVztBQUVYLGdCQUFJLGdCQUFKLENBRlc7QUFJWCxnQkFBTSxhQUFhLFNBQVMsYUFBVCxDQUF1QixHQUF2QixDQUFiLENBSks7QUFLWCx1QkFBVyxTQUFYLENBQXFCLEdBQXJCLENBQXlCLEtBQXpCLEVBQStCLFdBQS9CLEVBTFc7QUFPWCx1QkFBVyxPQUFYLEdBQXFCO3VCQUFNLEtBQUssUUFBTCxDQUFjLFFBQWQsQ0FBdUIsS0FBSyxLQUFMLENBQVcsT0FBWCxDQUFtQixLQUFLLFNBQUwsQ0FBMUMsRUFBMkQseUJBQTNEO2FBQU4sQ0FQVjtBQVFYLHVCQUFXLFlBQVgsR0FBMEIsVUFBQyxDQUFELEVBQUU7QUFDeEIsMEJBQVUsS0FBSyxRQUFMLENBQWMsR0FBZCxDQUF1QixFQUFFLGFBQUYsRUFBaUIsRUFBRSxPQUFPLE1BQUssT0FBTCxFQUFqRCxDQUFWLENBRHdCO0FBRXhCLHNCQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsT0FBcEIsRUFGd0I7YUFBRixDQVJmO0FBWVgsdUJBQVcsWUFBWCxHQUEwQixVQUFDLENBQUQsRUFBRTtBQUN4QixvQkFBSSxPQUFKLEVBQWE7QUFDVCwwQkFBSyxVQUFMLENBQWdCLE1BQWhCLENBQXVCLE9BQXZCLEVBRFM7QUFFVCw0QkFBUSxPQUFSLEdBRlM7aUJBQWI7YUFEc0IsQ0FaZjtBQW1CWCxpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLFdBQUssU0FBTCxDQUNoQixpQkFEZ0IsRUFFaEIsVUFGZ0IsRUFHaEIsVUFIZ0IsRUFJaEIsRUFBRSxVQUFVLEdBQVYsRUFKYyxDQUFwQixFQW5CVzs7OztrQ0EyQkQ7QUFDVixpQkFBSyxVQUFMLENBQWdCLE9BQWhCLEdBRFU7Ozs7Ozs7QUFXWCxJQUFNLDBDQUFpQixJQUFJLGNBQUosRUFBakIiLCJmaWxlIjoibGliL2F0b20vc2V0dGluZ3MtYnV0dG9uLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSB9IGZyb20gXCJ0cy1kaXNwb3NhYmxlc1wiO1xuaW1wb3J0IHsgZG9jayB9IGZyb20gXCIuLi9hdG9tL2RvY2tcIjtcbmNsYXNzIFNldHRpbmdzQnV0dG9uIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5yZXF1aXJlZCA9IHRydWU7XG4gICAgICAgIHRoaXMudGl0bGUgPSBcIlNob3cgU2V0dGluZ3MgYnV0dG9uXCI7XG4gICAgICAgIHRoaXMudG9vbHRpcCA9IFwiU2hvdyBTZXR0aW5nc1wiO1xuICAgICAgICB0aGlzLmRlc2NyaXB0aW9uID0gXCJTaG93cyB0aGUgc2V0dGluZ3MgYnV0dG9uIG9uIHRoZSBPbW5pU2hhcnAgRG9ja1wiO1xuICAgICAgICB0aGlzLmRlZmF1bHQgPSB0cnVlO1xuICAgIH1cbiAgICBhY3RpdmF0ZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgbGV0IHRvb2x0aXA7XG4gICAgICAgIGNvbnN0IGh0bWxCdXR0b24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYVwiKTtcbiAgICAgICAgaHRtbEJ1dHRvbi5jbGFzc0xpc3QuYWRkKFwiYnRuXCIsIFwiaWNvbi1nZWFyXCIpO1xuICAgICAgICBodG1sQnV0dG9uLm9uY2xpY2sgPSAoKSA9PiBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSksIFwib21uaXNoYXJwLWF0b206c2V0dGluZ3NcIik7XG4gICAgICAgIGh0bWxCdXR0b24ub25tb3VzZWVudGVyID0gKGUpID0+IHtcbiAgICAgICAgICAgIHRvb2x0aXAgPSBhdG9tLnRvb2x0aXBzLmFkZChlLmN1cnJlbnRUYXJnZXQsIHsgdGl0bGU6IHRoaXMudG9vbHRpcCB9KTtcbiAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQodG9vbHRpcCk7XG4gICAgICAgIH07XG4gICAgICAgIGh0bWxCdXR0b24ub25tb3VzZWxlYXZlID0gKGUpID0+IHtcbiAgICAgICAgICAgIGlmICh0b29sdGlwKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLnJlbW92ZSh0b29sdGlwKTtcbiAgICAgICAgICAgICAgICB0b29sdGlwLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChkb2NrLmFkZEJ1dHRvbihcInNldHRpbmdzLWJ1dHRvblwiLCBcIlNldHRpbmdzXCIsIGh0bWxCdXR0b24sIHsgcHJpb3JpdHk6IDk5OSB9KSk7XG4gICAgfVxuICAgIGRpc3Bvc2UoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfVxufVxuZXhwb3J0IGNvbnN0IHNldHRpbmdzQnV0dG9uID0gbmV3IFNldHRpbmdzQnV0dG9uKCk7XG4iLCJpbXBvcnQge0NvbXBvc2l0ZURpc3Bvc2FibGUsIElEaXNwb3NhYmxlfSBmcm9tIFwidHMtZGlzcG9zYWJsZXNcIjtcclxuaW1wb3J0IHtkb2NrfSBmcm9tIFwiLi4vYXRvbS9kb2NrXCI7XHJcblxyXG5jbGFzcyBTZXR0aW5nc0J1dHRvbiBpbXBsZW1lbnRzIElGZWF0dXJlIHtcclxuICAgIHByaXZhdGUgZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxuXHJcbiAgICBwdWJsaWMgYWN0aXZhdGUoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgICAgICBsZXQgdG9vbHRpcCA6SURpc3Bvc2FibGU7XHJcblxyXG4gICAgICAgIGNvbnN0IGh0bWxCdXR0b24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYVwiKTtcclxuICAgICAgICBodG1sQnV0dG9uLmNsYXNzTGlzdC5hZGQoXCJidG5cIixcImljb24tZ2VhclwiKTtcclxuXHJcbiAgICAgICAgaHRtbEJ1dHRvbi5vbmNsaWNrID0gKCkgPT4gYXRvbS5jb21tYW5kcy5kaXNwYXRjaChhdG9tLnZpZXdzLmdldFZpZXcoYXRvbS53b3Jrc3BhY2UpLCBcIm9tbmlzaGFycC1hdG9tOnNldHRpbmdzXCIpO1xyXG4gICAgICAgIGh0bWxCdXR0b24ub25tb3VzZWVudGVyID0gKGUpID0+IHtcclxuICAgICAgICAgICAgdG9vbHRpcCA9IGF0b20udG9vbHRpcHMuYWRkKDxhbnk+ZS5jdXJyZW50VGFyZ2V0LCB7IHRpdGxlOiB0aGlzLnRvb2x0aXAgfSk7XHJcbiAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQodG9vbHRpcCk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICBodG1sQnV0dG9uLm9ubW91c2VsZWF2ZSA9IChlKSA9PiB7XHJcbiAgICAgICAgICAgIGlmICh0b29sdGlwKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUucmVtb3ZlKHRvb2x0aXApO1xyXG4gICAgICAgICAgICAgICAgdG9vbHRpcC5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGRvY2suYWRkQnV0dG9uKFxyXG4gICAgICAgICAgICBcInNldHRpbmdzLWJ1dHRvblwiLFxyXG4gICAgICAgICAgICBcIlNldHRpbmdzXCIsXHJcbiAgICAgICAgICAgIGh0bWxCdXR0b24sXHJcbiAgICAgICAgICAgIHsgcHJpb3JpdHk6IDk5OSB9XHJcbiAgICAgICAgKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVxdWlyZWQgPSB0cnVlO1xyXG4gICAgcHVibGljIHRpdGxlID0gXCJTaG93IFNldHRpbmdzIGJ1dHRvblwiO1xyXG4gICAgcHVibGljIHRvb2x0aXAgPSBcIlNob3cgU2V0dGluZ3NcIjtcclxuICAgIHB1YmxpYyBkZXNjcmlwdGlvbiA9IFwiU2hvd3MgdGhlIHNldHRpbmdzIGJ1dHRvbiBvbiB0aGUgT21uaVNoYXJwIERvY2tcIjtcclxuICAgIHB1YmxpYyBkZWZhdWx0ID0gdHJ1ZTtcclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IHNldHRpbmdzQnV0dG9uID0gbmV3IFNldHRpbmdzQnV0dG9uKCk7XHJcbiJdfQ==
