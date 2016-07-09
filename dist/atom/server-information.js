"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.server = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _omnisharpClient = require("omnisharp-client");

var _omni = require("../server/omni");

var _dock = require("../atom/dock");

var _omniOutputPaneView = require("../views/omni-output-pane-view");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ServerInformation = function () {
    function ServerInformation() {
        _classCallCheck(this, ServerInformation);

        this.required = true;
        this.title = "Server Information";
        this.description = "Monitors server output and status.";
    }

    _createClass(ServerInformation, [{
        key: "activate",
        value: function activate() {
            var _this = this;

            this.disposable = new _omnisharpClient.CompositeDisposable();
            var status = this.setupStatus();
            var output = this.setupOutput();
            var outputElement = this.setupOutputElement();
            var projects = this.setupProjects();
            this.disposable.add(_omni.Omni.activeModel.subscribe(function (z) {
                return _this.model = z;
            }));
            this.observe = { status: status, output: output, outputElement: outputElement, projects: projects, model: _omni.Omni.activeModel };
            this.disposable.add(_dock.dock.addWindow("output", "Omnisharp output", new _omniOutputPaneView.OutputWindow(), {}));
            _dock.dock.selected = "output";
        }
    }, {
        key: "setupStatus",
        value: function setupStatus() {
            return _omni.Omni.activeModel.switchMap(function (model) {
                return model.observe.status;
            }).share();
        }
    }, {
        key: "setupOutput",
        value: function setupOutput() {
            return _omni.Omni.activeModel.switchMap(function (z) {
                return z.observe.output;
            }).startWith([]).share();
        }
    }, {
        key: "setupOutputElement",
        value: function setupOutputElement() {
            return _omni.Omni.activeModel.map(function (z) {
                return z.outputElement;
            }).startWith(document.createElement("div")).share();
        }
    }, {
        key: "setupProjects",
        value: function setupProjects() {
            return _omni.Omni.activeModel.switchMap(function (model) {
                return model.observe.projects;
            }).share();
        }
    }, {
        key: "dispose",
        value: function dispose() {
            this.disposable.dispose();
        }
    }]);

    return ServerInformation;
}();

var server = exports.server = new ServerInformation();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9hdG9tL3NlcnZlci1pbmZvcm1hdGlvbi5qcyIsImxpYi9hdG9tL3NlcnZlci1pbmZvcm1hdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7QUFDQTs7OztJQ01BLGlCO0FBQUEsaUNBQUE7QUFBQTs7QUE0RFcsYUFBQSxRQUFBLEdBQVcsSUFBWDtBQUNBLGFBQUEsS0FBQSxHQUFRLG9CQUFSO0FBQ0EsYUFBQSxXQUFBLEdBQWMsb0NBQWQ7QUFDVjs7OzttQ0FuRGtCO0FBQUE7O0FBQ1gsaUJBQUssVUFBTCxHQUFrQiwwQ0FBbEI7QUFFQSxnQkFBTSxTQUFTLEtBQUssV0FBTCxFQUFmO0FBQ0EsZ0JBQU0sU0FBUyxLQUFLLFdBQUwsRUFBZjtBQUNBLGdCQUFNLGdCQUFnQixLQUFLLGtCQUFMLEVBQXRCO0FBQ0EsZ0JBQU0sV0FBVyxLQUFLLGFBQUwsRUFBakI7QUFFQSxpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLFdBQUssV0FBTCxDQUFpQixTQUFqQixDQUEyQjtBQUFBLHVCQUFLLE1BQUssS0FBTCxHQUFhLENBQWxCO0FBQUEsYUFBM0IsQ0FBcEI7QUFDQSxpQkFBSyxPQUFMLEdBQWUsRUFBRSxjQUFGLEVBQVUsY0FBVixFQUFrQiw0QkFBbEIsRUFBaUMsa0JBQWpDLEVBQTJDLE9BQU8sV0FBSyxXQUF2RCxFQUFmO0FBRUEsaUJBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQixXQUFLLFNBQUwsQ0FBZSxRQUFmLEVBQXlCLGtCQUF6QixFQUE2QyxzQ0FBN0MsRUFBK0QsRUFBL0QsQ0FBcEI7QUFDQSx1QkFBSyxRQUFMLEdBQWdCLFFBQWhCO0FBQ0g7OztzQ0FFa0I7QUFFZixtQkFBTyxXQUFLLFdBQUwsQ0FDRixTQURFLENBQ1E7QUFBQSx1QkFBUyxNQUFNLE9BQU4sQ0FBYyxNQUF2QjtBQUFBLGFBRFIsRUFFRixLQUZFLEVBQVA7QUFHSDs7O3NDQUVrQjtBQUdmLG1CQUFPLFdBQUssV0FBTCxDQUNGLFNBREUsQ0FDUTtBQUFBLHVCQUFLLEVBQUUsT0FBRixDQUFVLE1BQWY7QUFBQSxhQURSLEVBRUYsU0FGRSxDQUVRLEVBRlIsRUFHRixLQUhFLEVBQVA7QUFJSDs7OzZDQUV5QjtBQUN0QixtQkFBTyxXQUFLLFdBQUwsQ0FDRixHQURFLENBQ0U7QUFBQSx1QkFBSyxFQUFFLGFBQVA7QUFBQSxhQURGLEVBRUYsU0FGRSxDQUVRLFNBQVMsYUFBVCxDQUF1QixLQUF2QixDQUZSLEVBR0YsS0FIRSxFQUFQO0FBSUg7Ozt3Q0FFb0I7QUFDakIsbUJBQU8sV0FBSyxXQUFMLENBQ0YsU0FERSxDQUNRO0FBQUEsdUJBQVMsTUFBTSxPQUFOLENBQWMsUUFBdkI7QUFBQSxhQURSLEVBRUYsS0FGRSxFQUFQO0FBR0g7OztrQ0FFYTtBQUNWLGlCQUFLLFVBQUwsQ0FBZ0IsT0FBaEI7QUFDSDs7Ozs7O0FBT0UsSUFBTSwwQkFBUyxJQUFJLGlCQUFKLEVBQWYiLCJmaWxlIjoibGliL2F0b20vc2VydmVyLWluZm9ybWF0aW9uLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSB9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XG5pbXBvcnQgeyBPbW5pIH0gZnJvbSBcIi4uL3NlcnZlci9vbW5pXCI7XG5pbXBvcnQgeyBkb2NrIH0gZnJvbSBcIi4uL2F0b20vZG9ja1wiO1xuaW1wb3J0IHsgT3V0cHV0V2luZG93IH0gZnJvbSBcIi4uL3ZpZXdzL29tbmktb3V0cHV0LXBhbmUtdmlld1wiO1xuY2xhc3MgU2VydmVySW5mb3JtYXRpb24ge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLnJlcXVpcmVkID0gdHJ1ZTtcbiAgICAgICAgdGhpcy50aXRsZSA9IFwiU2VydmVyIEluZm9ybWF0aW9uXCI7XG4gICAgICAgIHRoaXMuZGVzY3JpcHRpb24gPSBcIk1vbml0b3JzIHNlcnZlciBvdXRwdXQgYW5kIHN0YXR1cy5cIjtcbiAgICB9XG4gICAgYWN0aXZhdGUoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIGNvbnN0IHN0YXR1cyA9IHRoaXMuc2V0dXBTdGF0dXMoKTtcbiAgICAgICAgY29uc3Qgb3V0cHV0ID0gdGhpcy5zZXR1cE91dHB1dCgpO1xuICAgICAgICBjb25zdCBvdXRwdXRFbGVtZW50ID0gdGhpcy5zZXR1cE91dHB1dEVsZW1lbnQoKTtcbiAgICAgICAgY29uc3QgcHJvamVjdHMgPSB0aGlzLnNldHVwUHJvamVjdHMoKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmFjdGl2ZU1vZGVsLnN1YnNjcmliZSh6ID0+IHRoaXMubW9kZWwgPSB6KSk7XG4gICAgICAgIHRoaXMub2JzZXJ2ZSA9IHsgc3RhdHVzLCBvdXRwdXQsIG91dHB1dEVsZW1lbnQsIHByb2plY3RzLCBtb2RlbDogT21uaS5hY3RpdmVNb2RlbCB9O1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGRvY2suYWRkV2luZG93KFwib3V0cHV0XCIsIFwiT21uaXNoYXJwIG91dHB1dFwiLCBuZXcgT3V0cHV0V2luZG93LCB7fSkpO1xuICAgICAgICBkb2NrLnNlbGVjdGVkID0gXCJvdXRwdXRcIjtcbiAgICB9XG4gICAgc2V0dXBTdGF0dXMoKSB7XG4gICAgICAgIHJldHVybiBPbW5pLmFjdGl2ZU1vZGVsXG4gICAgICAgICAgICAuc3dpdGNoTWFwKG1vZGVsID0+IG1vZGVsLm9ic2VydmUuc3RhdHVzKVxuICAgICAgICAgICAgLnNoYXJlKCk7XG4gICAgfVxuICAgIHNldHVwT3V0cHV0KCkge1xuICAgICAgICByZXR1cm4gT21uaS5hY3RpdmVNb2RlbFxuICAgICAgICAgICAgLnN3aXRjaE1hcCh6ID0+IHoub2JzZXJ2ZS5vdXRwdXQpXG4gICAgICAgICAgICAuc3RhcnRXaXRoKFtdKVxuICAgICAgICAgICAgLnNoYXJlKCk7XG4gICAgfVxuICAgIHNldHVwT3V0cHV0RWxlbWVudCgpIHtcbiAgICAgICAgcmV0dXJuIE9tbmkuYWN0aXZlTW9kZWxcbiAgICAgICAgICAgIC5tYXAoeiA9PiB6Lm91dHB1dEVsZW1lbnQpXG4gICAgICAgICAgICAuc3RhcnRXaXRoKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIikpXG4gICAgICAgICAgICAuc2hhcmUoKTtcbiAgICB9XG4gICAgc2V0dXBQcm9qZWN0cygpIHtcbiAgICAgICAgcmV0dXJuIE9tbmkuYWN0aXZlTW9kZWxcbiAgICAgICAgICAgIC5zd2l0Y2hNYXAobW9kZWwgPT4gbW9kZWwub2JzZXJ2ZS5wcm9qZWN0cylcbiAgICAgICAgICAgIC5zaGFyZSgpO1xuICAgIH1cbiAgICBkaXNwb3NlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgIH1cbn1cbmV4cG9ydCBjb25zdCBzZXJ2ZXIgPSBuZXcgU2VydmVySW5mb3JtYXRpb247XG4iLCJpbXBvcnQge09ic2VydmFibGV9IGZyb20gXCJyeGpzXCI7XHJcbmltcG9ydCB7Q29tcG9zaXRlRGlzcG9zYWJsZX0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcclxuaW1wb3J0IHtPbW5pfSBmcm9tIFwiLi4vc2VydmVyL29tbmlcIjtcclxuaW1wb3J0IHtPbW5pc2hhcnBDbGllbnRTdGF0dXN9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XHJcbmltcG9ydCB7ZG9ja30gZnJvbSBcIi4uL2F0b20vZG9ja1wiO1xyXG5pbXBvcnQge091dHB1dFdpbmRvd30gZnJvbSBcIi4uL3ZpZXdzL29tbmktb3V0cHV0LXBhbmUtdmlld1wiO1xyXG5pbXBvcnQge1ZpZXdNb2RlbH0gZnJvbSBcIi4uL3NlcnZlci92aWV3LW1vZGVsXCI7XHJcbmltcG9ydCB7SVByb2plY3RWaWV3TW9kZWx9IGZyb20gXCIuLi9vbW5pc2hhcnBcIjtcclxuXHJcbmNsYXNzIFNlcnZlckluZm9ybWF0aW9uIGltcGxlbWVudHMgSUZlYXR1cmUge1xyXG4gICAgcHJpdmF0ZSBkaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xyXG4gICAgcHVibGljIG9ic2VydmU6IHtcclxuICAgICAgICBzdGF0dXM6IE9ic2VydmFibGU8T21uaXNoYXJwQ2xpZW50U3RhdHVzPjtcclxuICAgICAgICBvdXRwdXQ6IE9ic2VydmFibGU8T3V0cHV0TWVzc2FnZVtdPjtcclxuICAgICAgICBvdXRwdXRFbGVtZW50OiBPYnNlcnZhYmxlPEhUTUxEaXZFbGVtZW50PjtcclxuICAgICAgICBwcm9qZWN0czogT2JzZXJ2YWJsZTxJUHJvamVjdFZpZXdNb2RlbFtdPjtcclxuICAgICAgICBtb2RlbDogT2JzZXJ2YWJsZTxWaWV3TW9kZWw+O1xyXG4gICAgfTtcclxuXHJcbiAgICBwdWJsaWMgbW9kZWw6IFZpZXdNb2RlbDtcclxuXHJcbiAgICBwdWJsaWMgYWN0aXZhdGUoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuXHJcbiAgICAgICAgY29uc3Qgc3RhdHVzID0gdGhpcy5zZXR1cFN0YXR1cygpO1xyXG4gICAgICAgIGNvbnN0IG91dHB1dCA9IHRoaXMuc2V0dXBPdXRwdXQoKTtcclxuICAgICAgICBjb25zdCBvdXRwdXRFbGVtZW50ID0gdGhpcy5zZXR1cE91dHB1dEVsZW1lbnQoKTtcclxuICAgICAgICBjb25zdCBwcm9qZWN0cyA9IHRoaXMuc2V0dXBQcm9qZWN0cygpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuYWN0aXZlTW9kZWwuc3Vic2NyaWJlKHogPT4gdGhpcy5tb2RlbCA9IHopKTtcclxuICAgICAgICB0aGlzLm9ic2VydmUgPSB7IHN0YXR1cywgb3V0cHV0LCBvdXRwdXRFbGVtZW50LCBwcm9qZWN0cywgbW9kZWw6IE9tbmkuYWN0aXZlTW9kZWwgfTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChkb2NrLmFkZFdpbmRvdyhcIm91dHB1dFwiLCBcIk9tbmlzaGFycCBvdXRwdXRcIiwgbmV3IE91dHB1dFdpbmRvdywge30pKTtcclxuICAgICAgICBkb2NrLnNlbGVjdGVkID0gXCJvdXRwdXRcIjtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHNldHVwU3RhdHVzKCkge1xyXG4gICAgICAgIC8vIFN0cmVhbSB0aGUgc3RhdHVzIGZyb20gdGhlIGFjdGl2ZSBtb2RlbFxyXG4gICAgICAgIHJldHVybiBPbW5pLmFjdGl2ZU1vZGVsXHJcbiAgICAgICAgICAgIC5zd2l0Y2hNYXAobW9kZWwgPT4gbW9kZWwub2JzZXJ2ZS5zdGF0dXMpXHJcbiAgICAgICAgICAgIC5zaGFyZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgc2V0dXBPdXRwdXQoKSB7XHJcbiAgICAgICAgLy8gQXMgdGhlIGFjdGl2ZSBtb2RlbCBjaGFuZ2VzICh3aGVuIHdlIGdvIGZyb20gYW4gZWRpdG9yIGZvciBDbGllbnRBIHRvIGFuIGVkaXRvciBmb3IgQ2xpZW50QilcclxuICAgICAgICAvLyBXZSB3YW50IHRvIG1ha2Ugc3VyZSB0aGF0IHRoZSBvdXRwdXQgZmllbGQgaXNcclxuICAgICAgICByZXR1cm4gT21uaS5hY3RpdmVNb2RlbFxyXG4gICAgICAgICAgICAuc3dpdGNoTWFwKHogPT4gei5vYnNlcnZlLm91dHB1dClcclxuICAgICAgICAgICAgLnN0YXJ0V2l0aChbXSlcclxuICAgICAgICAgICAgLnNoYXJlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBzZXR1cE91dHB1dEVsZW1lbnQoKSB7XHJcbiAgICAgICAgcmV0dXJuIE9tbmkuYWN0aXZlTW9kZWxcclxuICAgICAgICAgICAgLm1hcCh6ID0+IHoub3V0cHV0RWxlbWVudClcclxuICAgICAgICAgICAgLnN0YXJ0V2l0aChkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpKVxyXG4gICAgICAgICAgICAuc2hhcmUoKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHNldHVwUHJvamVjdHMoKSB7XHJcbiAgICAgICAgcmV0dXJuIE9tbmkuYWN0aXZlTW9kZWxcclxuICAgICAgICAgICAgLnN3aXRjaE1hcChtb2RlbCA9PiBtb2RlbC5vYnNlcnZlLnByb2plY3RzKVxyXG4gICAgICAgICAgICAuc2hhcmUoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGlzcG9zZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZXF1aXJlZCA9IHRydWU7XHJcbiAgICBwdWJsaWMgdGl0bGUgPSBcIlNlcnZlciBJbmZvcm1hdGlvblwiO1xyXG4gICAgcHVibGljIGRlc2NyaXB0aW9uID0gXCJNb25pdG9ycyBzZXJ2ZXIgb3V0cHV0IGFuZCBzdGF0dXMuXCI7XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBzZXJ2ZXIgPSBuZXcgU2VydmVySW5mb3JtYXRpb247XHJcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
