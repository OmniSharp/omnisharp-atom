"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.settingsButton = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _omnisharpClient = require("omnisharp-client");

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

            this.disposable = new _omnisharpClient.CompositeDisposable();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9hdG9tL3NldHRpbmdzLWJ1dHRvbi5qcyIsImxpYi9hdG9tL3NldHRpbmdzLWJ1dHRvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7QUFDQTs7OztJQ0VBO0FBQUEsOEJBQUE7OztBQWtDVyxhQUFBLFFBQUEsR0FBVyxJQUFYLENBbENYO0FBbUNXLGFBQUEsS0FBQSxHQUFRLHNCQUFSLENBbkNYO0FBb0NXLGFBQUEsT0FBQSxHQUFVLGVBQVYsQ0FwQ1g7QUFxQ1csYUFBQSxXQUFBLEdBQWMsaURBQWQsQ0FyQ1g7QUFzQ1csYUFBQSxPQUFBLEdBQVUsSUFBVixDQXRDWDtLQUFBOzs7O21DQUdtQjs7O0FBQ1gsaUJBQUssVUFBTCxHQUFrQiwwQ0FBbEIsQ0FEVztBQUVYLGdCQUFJLGdCQUFKLENBRlc7QUFJWCxnQkFBTSxhQUFhLFNBQVMsYUFBVCxDQUF1QixHQUF2QixDQUFiLENBSks7QUFLWCx1QkFBVyxTQUFYLENBQXFCLEdBQXJCLENBQXlCLEtBQXpCLEVBQStCLFdBQS9CLEVBTFc7QUFPWCx1QkFBVyxPQUFYLEdBQXFCO3VCQUFNLEtBQUssUUFBTCxDQUFjLFFBQWQsQ0FBdUIsS0FBSyxLQUFMLENBQVcsT0FBWCxDQUFtQixLQUFLLFNBQUwsQ0FBMUMsRUFBMkQseUJBQTNEO2FBQU4sQ0FQVjtBQVFYLHVCQUFXLFlBQVgsR0FBMEIsVUFBQyxDQUFELEVBQUU7QUFDeEIsMEJBQVUsS0FBSyxRQUFMLENBQWMsR0FBZCxDQUF1QixFQUFFLGFBQUYsRUFBaUIsRUFBRSxPQUFPLE1BQUssT0FBTCxFQUFqRCxDQUFWLENBRHdCO0FBRXhCLHNCQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsT0FBcEIsRUFGd0I7YUFBRixDQVJmO0FBWVgsdUJBQVcsWUFBWCxHQUEwQixVQUFDLENBQUQsRUFBRTtBQUN4QixvQkFBSSxPQUFKLEVBQWE7QUFDVCwwQkFBSyxVQUFMLENBQWdCLE1BQWhCLENBQXVCLE9BQXZCLEVBRFM7QUFFVCw0QkFBUSxPQUFSLEdBRlM7aUJBQWI7YUFEc0IsQ0FaZjtBQW1CWCxpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLFdBQUssU0FBTCxDQUNoQixpQkFEZ0IsRUFFaEIsVUFGZ0IsRUFHaEIsVUFIZ0IsRUFJaEIsRUFBRSxVQUFVLEdBQVYsRUFKYyxDQUFwQixFQW5CVzs7OztrQ0EyQkQ7QUFDVixpQkFBSyxVQUFMLENBQWdCLE9BQWhCLEdBRFU7Ozs7Ozs7QUFXWCxJQUFNLDBDQUFpQixJQUFJLGNBQUosRUFBakIiLCJmaWxlIjoibGliL2F0b20vc2V0dGluZ3MtYnV0dG9uLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSB9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XG5pbXBvcnQgeyBkb2NrIH0gZnJvbSBcIi4uL2F0b20vZG9ja1wiO1xuY2xhc3MgU2V0dGluZ3NCdXR0b24ge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLnJlcXVpcmVkID0gdHJ1ZTtcbiAgICAgICAgdGhpcy50aXRsZSA9IFwiU2hvdyBTZXR0aW5ncyBidXR0b25cIjtcbiAgICAgICAgdGhpcy50b29sdGlwID0gXCJTaG93IFNldHRpbmdzXCI7XG4gICAgICAgIHRoaXMuZGVzY3JpcHRpb24gPSBcIlNob3dzIHRoZSBzZXR0aW5ncyBidXR0b24gb24gdGhlIE9tbmlTaGFycCBEb2NrXCI7XG4gICAgICAgIHRoaXMuZGVmYXVsdCA9IHRydWU7XG4gICAgfVxuICAgIGFjdGl2YXRlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICBsZXQgdG9vbHRpcDtcbiAgICAgICAgY29uc3QgaHRtbEJ1dHRvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJhXCIpO1xuICAgICAgICBodG1sQnV0dG9uLmNsYXNzTGlzdC5hZGQoXCJidG5cIiwgXCJpY29uLWdlYXJcIik7XG4gICAgICAgIGh0bWxCdXR0b24ub25jbGljayA9ICgpID0+IGF0b20uY29tbWFuZHMuZGlzcGF0Y2goYXRvbS52aWV3cy5nZXRWaWV3KGF0b20ud29ya3NwYWNlKSwgXCJvbW5pc2hhcnAtYXRvbTpzZXR0aW5nc1wiKTtcbiAgICAgICAgaHRtbEJ1dHRvbi5vbm1vdXNlZW50ZXIgPSAoZSkgPT4ge1xuICAgICAgICAgICAgdG9vbHRpcCA9IGF0b20udG9vbHRpcHMuYWRkKGUuY3VycmVudFRhcmdldCwgeyB0aXRsZTogdGhpcy50b29sdGlwIH0pO1xuICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZCh0b29sdGlwKTtcbiAgICAgICAgfTtcbiAgICAgICAgaHRtbEJ1dHRvbi5vbm1vdXNlbGVhdmUgPSAoZSkgPT4ge1xuICAgICAgICAgICAgaWYgKHRvb2x0aXApIHtcbiAgICAgICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUucmVtb3ZlKHRvb2x0aXApO1xuICAgICAgICAgICAgICAgIHRvb2x0aXAuZGlzcG9zZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGRvY2suYWRkQnV0dG9uKFwic2V0dGluZ3MtYnV0dG9uXCIsIFwiU2V0dGluZ3NcIiwgaHRtbEJ1dHRvbiwgeyBwcmlvcml0eTogOTk5IH0pKTtcbiAgICB9XG4gICAgZGlzcG9zZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICB9XG59XG5leHBvcnQgY29uc3Qgc2V0dGluZ3NCdXR0b24gPSBuZXcgU2V0dGluZ3NCdXR0b24oKTtcbiIsImltcG9ydCB7Q29tcG9zaXRlRGlzcG9zYWJsZSwgSURpc3Bvc2FibGV9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XHJcbmltcG9ydCB7ZG9ja30gZnJvbSBcIi4uL2F0b20vZG9ja1wiO1xyXG5cclxuY2xhc3MgU2V0dGluZ3NCdXR0b24gaW1wbGVtZW50cyBJRmVhdHVyZSB7XHJcbiAgICBwcml2YXRlIGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XHJcblxyXG4gICAgcHVibGljIGFjdGl2YXRlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcbiAgICAgICAgbGV0IHRvb2x0aXAgOklEaXNwb3NhYmxlO1xyXG5cclxuICAgICAgICBjb25zdCBodG1sQnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImFcIik7XHJcbiAgICAgICAgaHRtbEJ1dHRvbi5jbGFzc0xpc3QuYWRkKFwiYnRuXCIsXCJpY29uLWdlYXJcIik7XHJcblxyXG4gICAgICAgIGh0bWxCdXR0b24ub25jbGljayA9ICgpID0+IGF0b20uY29tbWFuZHMuZGlzcGF0Y2goYXRvbS52aWV3cy5nZXRWaWV3KGF0b20ud29ya3NwYWNlKSwgXCJvbW5pc2hhcnAtYXRvbTpzZXR0aW5nc1wiKTtcclxuICAgICAgICBodG1sQnV0dG9uLm9ubW91c2VlbnRlciA9IChlKSA9PiB7XHJcbiAgICAgICAgICAgIHRvb2x0aXAgPSBhdG9tLnRvb2x0aXBzLmFkZCg8YW55PmUuY3VycmVudFRhcmdldCwgeyB0aXRsZTogdGhpcy50b29sdGlwIH0pO1xyXG4gICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKHRvb2x0aXApO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgaHRtbEJ1dHRvbi5vbm1vdXNlbGVhdmUgPSAoZSkgPT4ge1xyXG4gICAgICAgICAgICBpZiAodG9vbHRpcCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLnJlbW92ZSh0b29sdGlwKTtcclxuICAgICAgICAgICAgICAgIHRvb2x0aXAuZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChkb2NrLmFkZEJ1dHRvbihcclxuICAgICAgICAgICAgXCJzZXR0aW5ncy1idXR0b25cIixcclxuICAgICAgICAgICAgXCJTZXR0aW5nc1wiLFxyXG4gICAgICAgICAgICBodG1sQnV0dG9uLFxyXG4gICAgICAgICAgICB7IHByaW9yaXR5OiA5OTkgfVxyXG4gICAgICAgICkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkaXNwb3NlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlcXVpcmVkID0gdHJ1ZTtcclxuICAgIHB1YmxpYyB0aXRsZSA9IFwiU2hvdyBTZXR0aW5ncyBidXR0b25cIjtcclxuICAgIHB1YmxpYyB0b29sdGlwID0gXCJTaG93IFNldHRpbmdzXCI7XHJcbiAgICBwdWJsaWMgZGVzY3JpcHRpb24gPSBcIlNob3dzIHRoZSBzZXR0aW5ncyBidXR0b24gb24gdGhlIE9tbmlTaGFycCBEb2NrXCI7XHJcbiAgICBwdWJsaWMgZGVmYXVsdCA9IHRydWU7XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBzZXR0aW5nc0J1dHRvbiA9IG5ldyBTZXR0aW5nc0J1dHRvbigpO1xyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
