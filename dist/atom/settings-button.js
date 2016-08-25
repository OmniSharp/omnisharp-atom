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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9hdG9tL3NldHRpbmdzLWJ1dHRvbi5qcyIsImxpYi9hdG9tL3NldHRpbmdzLWJ1dHRvbi50cyJdLCJuYW1lcyI6WyJTZXR0aW5nc0J1dHRvbiIsInJlcXVpcmVkIiwidGl0bGUiLCJ0b29sdGlwIiwiZGVzY3JpcHRpb24iLCJkZWZhdWx0IiwiZGlzcG9zYWJsZSIsImh0bWxCdXR0b24iLCJkb2N1bWVudCIsImNyZWF0ZUVsZW1lbnQiLCJjbGFzc0xpc3QiLCJhZGQiLCJvbmNsaWNrIiwiYXRvbSIsImNvbW1hbmRzIiwiZGlzcGF0Y2giLCJ2aWV3cyIsImdldFZpZXciLCJ3b3Jrc3BhY2UiLCJvbm1vdXNlZW50ZXIiLCJlIiwidG9vbHRpcHMiLCJjdXJyZW50VGFyZ2V0Iiwib25tb3VzZWxlYXZlIiwicmVtb3ZlIiwiZGlzcG9zZSIsImFkZEJ1dHRvbiIsInByaW9yaXR5Iiwic2V0dGluZ3NCdXR0b24iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQUNBOzs7O0lDRUFBLGM7QUFBQSw4QkFBQTtBQUFBOztBQWtDVyxhQUFBQyxRQUFBLEdBQVcsSUFBWDtBQUNBLGFBQUFDLEtBQUEsR0FBUSxzQkFBUjtBQUNBLGFBQUFDLE9BQUEsR0FBVSxlQUFWO0FBQ0EsYUFBQUMsV0FBQSxHQUFjLGlEQUFkO0FBQ0EsYUFBQUMsT0FBQSxHQUFVLElBQVY7QUFDVjs7OzttQ0FwQ2tCO0FBQUE7O0FBQ1gsaUJBQUtDLFVBQUwsR0FBa0Isd0NBQWxCO0FBQ0EsZ0JBQUlILGdCQUFKO0FBRUEsZ0JBQU1JLGFBQWFDLFNBQVNDLGFBQVQsQ0FBdUIsR0FBdkIsQ0FBbkI7QUFDQUYsdUJBQVdHLFNBQVgsQ0FBcUJDLEdBQXJCLENBQXlCLEtBQXpCLEVBQStCLFdBQS9CO0FBRUFKLHVCQUFXSyxPQUFYLEdBQXFCO0FBQUEsdUJBQU1DLEtBQUtDLFFBQUwsQ0FBY0MsUUFBZCxDQUF1QkYsS0FBS0csS0FBTCxDQUFXQyxPQUFYLENBQW1CSixLQUFLSyxTQUF4QixDQUF2QixFQUEyRCx5QkFBM0QsQ0FBTjtBQUFBLGFBQXJCO0FBQ0FYLHVCQUFXWSxZQUFYLEdBQTBCLFVBQUNDLENBQUQsRUFBRTtBQUN4QmpCLDBCQUFVVSxLQUFLUSxRQUFMLENBQWNWLEdBQWQsQ0FBdUJTLEVBQUVFLGFBQXpCLEVBQXdDLEVBQUVwQixPQUFPLE1BQUtDLE9BQWQsRUFBeEMsQ0FBVjtBQUNBLHNCQUFLRyxVQUFMLENBQWdCSyxHQUFoQixDQUFvQlIsT0FBcEI7QUFDSCxhQUhEO0FBSUFJLHVCQUFXZ0IsWUFBWCxHQUEwQixVQUFDSCxDQUFELEVBQUU7QUFDeEIsb0JBQUlqQixPQUFKLEVBQWE7QUFDVCwwQkFBS0csVUFBTCxDQUFnQmtCLE1BQWhCLENBQXVCckIsT0FBdkI7QUFDQUEsNEJBQVFzQixPQUFSO0FBQ0g7QUFDSixhQUxEO0FBT0EsaUJBQUtuQixVQUFMLENBQWdCSyxHQUFoQixDQUFvQixXQUFLZSxTQUFMLENBQ2hCLGlCQURnQixFQUVoQixVQUZnQixFQUdoQm5CLFVBSGdCLEVBSWhCLEVBQUVvQixVQUFVLEdBQVosRUFKZ0IsQ0FBcEI7QUFNSDs7O2tDQUVhO0FBQ1YsaUJBQUtyQixVQUFMLENBQWdCbUIsT0FBaEI7QUFDSDs7Ozs7O0FBU0UsSUFBTUcsMENBQWlCLElBQUk1QixjQUFKLEVBQXZCIiwiZmlsZSI6ImxpYi9hdG9tL3NldHRpbmdzLWJ1dHRvbi5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUgfSBmcm9tIFwidHMtZGlzcG9zYWJsZXNcIjtcbmltcG9ydCB7IGRvY2sgfSBmcm9tIFwiLi4vYXRvbS9kb2NrXCI7XG5jbGFzcyBTZXR0aW5nc0J1dHRvbiB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMucmVxdWlyZWQgPSB0cnVlO1xuICAgICAgICB0aGlzLnRpdGxlID0gXCJTaG93IFNldHRpbmdzIGJ1dHRvblwiO1xuICAgICAgICB0aGlzLnRvb2x0aXAgPSBcIlNob3cgU2V0dGluZ3NcIjtcbiAgICAgICAgdGhpcy5kZXNjcmlwdGlvbiA9IFwiU2hvd3MgdGhlIHNldHRpbmdzIGJ1dHRvbiBvbiB0aGUgT21uaVNoYXJwIERvY2tcIjtcbiAgICAgICAgdGhpcy5kZWZhdWx0ID0gdHJ1ZTtcbiAgICB9XG4gICAgYWN0aXZhdGUoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIGxldCB0b29sdGlwO1xuICAgICAgICBjb25zdCBodG1sQnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImFcIik7XG4gICAgICAgIGh0bWxCdXR0b24uY2xhc3NMaXN0LmFkZChcImJ0blwiLCBcImljb24tZ2VhclwiKTtcbiAgICAgICAgaHRtbEJ1dHRvbi5vbmNsaWNrID0gKCkgPT4gYXRvbS5jb21tYW5kcy5kaXNwYXRjaChhdG9tLnZpZXdzLmdldFZpZXcoYXRvbS53b3Jrc3BhY2UpLCBcIm9tbmlzaGFycC1hdG9tOnNldHRpbmdzXCIpO1xuICAgICAgICBodG1sQnV0dG9uLm9ubW91c2VlbnRlciA9IChlKSA9PiB7XG4gICAgICAgICAgICB0b29sdGlwID0gYXRvbS50b29sdGlwcy5hZGQoZS5jdXJyZW50VGFyZ2V0LCB7IHRpdGxlOiB0aGlzLnRvb2x0aXAgfSk7XG4gICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKHRvb2x0aXApO1xuICAgICAgICB9O1xuICAgICAgICBodG1sQnV0dG9uLm9ubW91c2VsZWF2ZSA9IChlKSA9PiB7XG4gICAgICAgICAgICBpZiAodG9vbHRpcCkge1xuICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5yZW1vdmUodG9vbHRpcCk7XG4gICAgICAgICAgICAgICAgdG9vbHRpcC5kaXNwb3NlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoZG9jay5hZGRCdXR0b24oXCJzZXR0aW5ncy1idXR0b25cIiwgXCJTZXR0aW5nc1wiLCBodG1sQnV0dG9uLCB7IHByaW9yaXR5OiA5OTkgfSkpO1xuICAgIH1cbiAgICBkaXNwb3NlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgIH1cbn1cbmV4cG9ydCBjb25zdCBzZXR0aW5nc0J1dHRvbiA9IG5ldyBTZXR0aW5nc0J1dHRvbigpO1xuIiwiaW1wb3J0IHtDb21wb3NpdGVEaXNwb3NhYmxlLCBJRGlzcG9zYWJsZX0gZnJvbSBcInRzLWRpc3Bvc2FibGVzXCI7XHJcbmltcG9ydCB7ZG9ja30gZnJvbSBcIi4uL2F0b20vZG9ja1wiO1xyXG5cclxuY2xhc3MgU2V0dGluZ3NCdXR0b24gaW1wbGVtZW50cyBJRmVhdHVyZSB7XHJcbiAgICBwcml2YXRlIGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XHJcblxyXG4gICAgcHVibGljIGFjdGl2YXRlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcbiAgICAgICAgbGV0IHRvb2x0aXAgOklEaXNwb3NhYmxlO1xyXG5cclxuICAgICAgICBjb25zdCBodG1sQnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImFcIik7XHJcbiAgICAgICAgaHRtbEJ1dHRvbi5jbGFzc0xpc3QuYWRkKFwiYnRuXCIsXCJpY29uLWdlYXJcIik7XHJcblxyXG4gICAgICAgIGh0bWxCdXR0b24ub25jbGljayA9ICgpID0+IGF0b20uY29tbWFuZHMuZGlzcGF0Y2goYXRvbS52aWV3cy5nZXRWaWV3KGF0b20ud29ya3NwYWNlKSwgXCJvbW5pc2hhcnAtYXRvbTpzZXR0aW5nc1wiKTtcclxuICAgICAgICBodG1sQnV0dG9uLm9ubW91c2VlbnRlciA9IChlKSA9PiB7XHJcbiAgICAgICAgICAgIHRvb2x0aXAgPSBhdG9tLnRvb2x0aXBzLmFkZCg8YW55PmUuY3VycmVudFRhcmdldCwgeyB0aXRsZTogdGhpcy50b29sdGlwIH0pO1xyXG4gICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKHRvb2x0aXApO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgaHRtbEJ1dHRvbi5vbm1vdXNlbGVhdmUgPSAoZSkgPT4ge1xyXG4gICAgICAgICAgICBpZiAodG9vbHRpcCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLnJlbW92ZSh0b29sdGlwKTtcclxuICAgICAgICAgICAgICAgIHRvb2x0aXAuZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChkb2NrLmFkZEJ1dHRvbihcclxuICAgICAgICAgICAgXCJzZXR0aW5ncy1idXR0b25cIixcclxuICAgICAgICAgICAgXCJTZXR0aW5nc1wiLFxyXG4gICAgICAgICAgICBodG1sQnV0dG9uLFxyXG4gICAgICAgICAgICB7IHByaW9yaXR5OiA5OTkgfVxyXG4gICAgICAgICkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkaXNwb3NlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlcXVpcmVkID0gdHJ1ZTtcclxuICAgIHB1YmxpYyB0aXRsZSA9IFwiU2hvdyBTZXR0aW5ncyBidXR0b25cIjtcclxuICAgIHB1YmxpYyB0b29sdGlwID0gXCJTaG93IFNldHRpbmdzXCI7XHJcbiAgICBwdWJsaWMgZGVzY3JpcHRpb24gPSBcIlNob3dzIHRoZSBzZXR0aW5ncyBidXR0b24gb24gdGhlIE9tbmlTaGFycCBEb2NrXCI7XHJcbiAgICBwdWJsaWMgZGVmYXVsdCA9IHRydWU7XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBzZXR0aW5nc0J1dHRvbiA9IG5ldyBTZXR0aW5nc0J1dHRvbigpO1xyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
