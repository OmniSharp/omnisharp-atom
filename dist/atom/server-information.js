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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9hdG9tL3NlcnZlci1pbmZvcm1hdGlvbi5qcyIsImxpYi9hdG9tL3NlcnZlci1pbmZvcm1hdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7QUFDQTs7OztJQ01BO0FBQUEsaUNBQUE7OztBQTREVyxhQUFBLFFBQUEsR0FBVyxJQUFYLENBNURYO0FBNkRXLGFBQUEsS0FBQSxHQUFRLG9CQUFSLENBN0RYO0FBOERXLGFBQUEsV0FBQSxHQUFjLG9DQUFkLENBOURYO0tBQUE7Ozs7bUNBWW1COzs7QUFDWCxpQkFBSyxVQUFMLEdBQWtCLDBDQUFsQixDQURXO0FBR1gsZ0JBQU0sU0FBUyxLQUFLLFdBQUwsRUFBVCxDQUhLO0FBSVgsZ0JBQU0sU0FBUyxLQUFLLFdBQUwsRUFBVCxDQUpLO0FBS1gsZ0JBQU0sZ0JBQWdCLEtBQUssa0JBQUwsRUFBaEIsQ0FMSztBQU1YLGdCQUFNLFdBQVcsS0FBSyxhQUFMLEVBQVgsQ0FOSztBQVFYLGlCQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsV0FBSyxXQUFMLENBQWlCLFNBQWpCLENBQTJCO3VCQUFLLE1BQUssS0FBTCxHQUFhLENBQWI7YUFBTCxDQUEvQyxFQVJXO0FBU1gsaUJBQUssT0FBTCxHQUFlLEVBQUUsY0FBRixFQUFVLGNBQVYsRUFBa0IsNEJBQWxCLEVBQWlDLGtCQUFqQyxFQUEyQyxPQUFPLFdBQUssV0FBTCxFQUFqRSxDQVRXO0FBV1gsaUJBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQixXQUFLLFNBQUwsQ0FBZSxRQUFmLEVBQXlCLGtCQUF6QixFQUE2QyxzQ0FBN0MsRUFBK0QsRUFBL0QsQ0FBcEIsRUFYVztBQVlYLHVCQUFLLFFBQUwsR0FBZ0IsUUFBaEIsQ0FaVzs7OztzQ0FlSTtBQUVmLG1CQUFPLFdBQUssV0FBTCxDQUNGLFNBREUsQ0FDUTt1QkFBUyxNQUFNLE9BQU4sQ0FBYyxNQUFkO2FBQVQsQ0FEUixDQUVGLEtBRkUsRUFBUCxDQUZlOzs7O3NDQU9BO0FBR2YsbUJBQU8sV0FBSyxXQUFMLENBQ0YsU0FERSxDQUNRO3VCQUFLLEVBQUUsT0FBRixDQUFVLE1BQVY7YUFBTCxDQURSLENBRUYsU0FGRSxDQUVRLEVBRlIsRUFHRixLQUhFLEVBQVAsQ0FIZTs7Ozs2Q0FTTztBQUN0QixtQkFBTyxXQUFLLFdBQUwsQ0FDRixHQURFLENBQ0U7dUJBQUssRUFBRSxhQUFGO2FBQUwsQ0FERixDQUVGLFNBRkUsQ0FFUSxTQUFTLGFBQVQsQ0FBdUIsS0FBdkIsQ0FGUixFQUdGLEtBSEUsRUFBUCxDQURzQjs7Ozt3Q0FPTDtBQUNqQixtQkFBTyxXQUFLLFdBQUwsQ0FDRixTQURFLENBQ1E7dUJBQVMsTUFBTSxPQUFOLENBQWMsUUFBZDthQUFULENBRFIsQ0FFRixLQUZFLEVBQVAsQ0FEaUI7Ozs7a0NBTVA7QUFDVixpQkFBSyxVQUFMLENBQWdCLE9BQWhCLEdBRFU7Ozs7Ozs7QUFTWCxJQUFNLDBCQUFTLElBQUksaUJBQUosRUFBVCIsImZpbGUiOiJsaWIvYXRvbS9zZXJ2ZXItaW5mb3JtYXRpb24uanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlIH0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcbmltcG9ydCB7IE9tbmkgfSBmcm9tIFwiLi4vc2VydmVyL29tbmlcIjtcbmltcG9ydCB7IGRvY2sgfSBmcm9tIFwiLi4vYXRvbS9kb2NrXCI7XG5pbXBvcnQgeyBPdXRwdXRXaW5kb3cgfSBmcm9tIFwiLi4vdmlld3Mvb21uaS1vdXRwdXQtcGFuZS12aWV3XCI7XG5jbGFzcyBTZXJ2ZXJJbmZvcm1hdGlvbiB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMucmVxdWlyZWQgPSB0cnVlO1xuICAgICAgICB0aGlzLnRpdGxlID0gXCJTZXJ2ZXIgSW5mb3JtYXRpb25cIjtcbiAgICAgICAgdGhpcy5kZXNjcmlwdGlvbiA9IFwiTW9uaXRvcnMgc2VydmVyIG91dHB1dCBhbmQgc3RhdHVzLlwiO1xuICAgIH1cbiAgICBhY3RpdmF0ZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgY29uc3Qgc3RhdHVzID0gdGhpcy5zZXR1cFN0YXR1cygpO1xuICAgICAgICBjb25zdCBvdXRwdXQgPSB0aGlzLnNldHVwT3V0cHV0KCk7XG4gICAgICAgIGNvbnN0IG91dHB1dEVsZW1lbnQgPSB0aGlzLnNldHVwT3V0cHV0RWxlbWVudCgpO1xuICAgICAgICBjb25zdCBwcm9qZWN0cyA9IHRoaXMuc2V0dXBQcm9qZWN0cygpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuYWN0aXZlTW9kZWwuc3Vic2NyaWJlKHogPT4gdGhpcy5tb2RlbCA9IHopKTtcbiAgICAgICAgdGhpcy5vYnNlcnZlID0geyBzdGF0dXMsIG91dHB1dCwgb3V0cHV0RWxlbWVudCwgcHJvamVjdHMsIG1vZGVsOiBPbW5pLmFjdGl2ZU1vZGVsIH07XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoZG9jay5hZGRXaW5kb3coXCJvdXRwdXRcIiwgXCJPbW5pc2hhcnAgb3V0cHV0XCIsIG5ldyBPdXRwdXRXaW5kb3csIHt9KSk7XG4gICAgICAgIGRvY2suc2VsZWN0ZWQgPSBcIm91dHB1dFwiO1xuICAgIH1cbiAgICBzZXR1cFN0YXR1cygpIHtcbiAgICAgICAgcmV0dXJuIE9tbmkuYWN0aXZlTW9kZWxcbiAgICAgICAgICAgIC5zd2l0Y2hNYXAobW9kZWwgPT4gbW9kZWwub2JzZXJ2ZS5zdGF0dXMpXG4gICAgICAgICAgICAuc2hhcmUoKTtcbiAgICB9XG4gICAgc2V0dXBPdXRwdXQoKSB7XG4gICAgICAgIHJldHVybiBPbW5pLmFjdGl2ZU1vZGVsXG4gICAgICAgICAgICAuc3dpdGNoTWFwKHogPT4gei5vYnNlcnZlLm91dHB1dClcbiAgICAgICAgICAgIC5zdGFydFdpdGgoW10pXG4gICAgICAgICAgICAuc2hhcmUoKTtcbiAgICB9XG4gICAgc2V0dXBPdXRwdXRFbGVtZW50KCkge1xuICAgICAgICByZXR1cm4gT21uaS5hY3RpdmVNb2RlbFxuICAgICAgICAgICAgLm1hcCh6ID0+IHoub3V0cHV0RWxlbWVudClcbiAgICAgICAgICAgIC5zdGFydFdpdGgoZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKSlcbiAgICAgICAgICAgIC5zaGFyZSgpO1xuICAgIH1cbiAgICBzZXR1cFByb2plY3RzKCkge1xuICAgICAgICByZXR1cm4gT21uaS5hY3RpdmVNb2RlbFxuICAgICAgICAgICAgLnN3aXRjaE1hcChtb2RlbCA9PiBtb2RlbC5vYnNlcnZlLnByb2plY3RzKVxuICAgICAgICAgICAgLnNoYXJlKCk7XG4gICAgfVxuICAgIGRpc3Bvc2UoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfVxufVxuZXhwb3J0IGNvbnN0IHNlcnZlciA9IG5ldyBTZXJ2ZXJJbmZvcm1hdGlvbjtcbiIsImltcG9ydCB7T2JzZXJ2YWJsZX0gZnJvbSBcInJ4anNcIjtcclxuaW1wb3J0IHtDb21wb3NpdGVEaXNwb3NhYmxlfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xyXG5pbXBvcnQge09tbml9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xyXG5pbXBvcnQge09tbmlzaGFycENsaWVudFN0YXR1c30gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcclxuaW1wb3J0IHtkb2NrfSBmcm9tIFwiLi4vYXRvbS9kb2NrXCI7XHJcbmltcG9ydCB7T3V0cHV0V2luZG93fSBmcm9tIFwiLi4vdmlld3Mvb21uaS1vdXRwdXQtcGFuZS12aWV3XCI7XHJcbmltcG9ydCB7Vmlld01vZGVsfSBmcm9tIFwiLi4vc2VydmVyL3ZpZXctbW9kZWxcIjtcclxuaW1wb3J0IHtJUHJvamVjdFZpZXdNb2RlbH0gZnJvbSBcIi4uL29tbmlzaGFycFwiO1xyXG5cclxuY2xhc3MgU2VydmVySW5mb3JtYXRpb24gaW1wbGVtZW50cyBJRmVhdHVyZSB7XHJcbiAgICBwcml2YXRlIGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XHJcbiAgICBwdWJsaWMgb2JzZXJ2ZToge1xyXG4gICAgICAgIHN0YXR1czogT2JzZXJ2YWJsZTxPbW5pc2hhcnBDbGllbnRTdGF0dXM+O1xyXG4gICAgICAgIG91dHB1dDogT2JzZXJ2YWJsZTxPdXRwdXRNZXNzYWdlW10+O1xyXG4gICAgICAgIG91dHB1dEVsZW1lbnQ6IE9ic2VydmFibGU8SFRNTERpdkVsZW1lbnQ+O1xyXG4gICAgICAgIHByb2plY3RzOiBPYnNlcnZhYmxlPElQcm9qZWN0Vmlld01vZGVsW10+O1xyXG4gICAgICAgIG1vZGVsOiBPYnNlcnZhYmxlPFZpZXdNb2RlbD47XHJcbiAgICB9O1xyXG5cclxuICAgIHB1YmxpYyBtb2RlbDogVmlld01vZGVsO1xyXG5cclxuICAgIHB1YmxpYyBhY3RpdmF0ZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG5cclxuICAgICAgICBjb25zdCBzdGF0dXMgPSB0aGlzLnNldHVwU3RhdHVzKCk7XHJcbiAgICAgICAgY29uc3Qgb3V0cHV0ID0gdGhpcy5zZXR1cE91dHB1dCgpO1xyXG4gICAgICAgIGNvbnN0IG91dHB1dEVsZW1lbnQgPSB0aGlzLnNldHVwT3V0cHV0RWxlbWVudCgpO1xyXG4gICAgICAgIGNvbnN0IHByb2plY3RzID0gdGhpcy5zZXR1cFByb2plY3RzKCk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5hY3RpdmVNb2RlbC5zdWJzY3JpYmUoeiA9PiB0aGlzLm1vZGVsID0geikpO1xyXG4gICAgICAgIHRoaXMub2JzZXJ2ZSA9IHsgc3RhdHVzLCBvdXRwdXQsIG91dHB1dEVsZW1lbnQsIHByb2plY3RzLCBtb2RlbDogT21uaS5hY3RpdmVNb2RlbCB9O1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGRvY2suYWRkV2luZG93KFwib3V0cHV0XCIsIFwiT21uaXNoYXJwIG91dHB1dFwiLCBuZXcgT3V0cHV0V2luZG93LCB7fSkpO1xyXG4gICAgICAgIGRvY2suc2VsZWN0ZWQgPSBcIm91dHB1dFwiO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgc2V0dXBTdGF0dXMoKSB7XHJcbiAgICAgICAgLy8gU3RyZWFtIHRoZSBzdGF0dXMgZnJvbSB0aGUgYWN0aXZlIG1vZGVsXHJcbiAgICAgICAgcmV0dXJuIE9tbmkuYWN0aXZlTW9kZWxcclxuICAgICAgICAgICAgLnN3aXRjaE1hcChtb2RlbCA9PiBtb2RlbC5vYnNlcnZlLnN0YXR1cylcclxuICAgICAgICAgICAgLnNoYXJlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBzZXR1cE91dHB1dCgpIHtcclxuICAgICAgICAvLyBBcyB0aGUgYWN0aXZlIG1vZGVsIGNoYW5nZXMgKHdoZW4gd2UgZ28gZnJvbSBhbiBlZGl0b3IgZm9yIENsaWVudEEgdG8gYW4gZWRpdG9yIGZvciBDbGllbnRCKVxyXG4gICAgICAgIC8vIFdlIHdhbnQgdG8gbWFrZSBzdXJlIHRoYXQgdGhlIG91dHB1dCBmaWVsZCBpc1xyXG4gICAgICAgIHJldHVybiBPbW5pLmFjdGl2ZU1vZGVsXHJcbiAgICAgICAgICAgIC5zd2l0Y2hNYXAoeiA9PiB6Lm9ic2VydmUub3V0cHV0KVxyXG4gICAgICAgICAgICAuc3RhcnRXaXRoKFtdKVxyXG4gICAgICAgICAgICAuc2hhcmUoKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHNldHVwT3V0cHV0RWxlbWVudCgpIHtcclxuICAgICAgICByZXR1cm4gT21uaS5hY3RpdmVNb2RlbFxyXG4gICAgICAgICAgICAubWFwKHogPT4gei5vdXRwdXRFbGVtZW50KVxyXG4gICAgICAgICAgICAuc3RhcnRXaXRoKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIikpXHJcbiAgICAgICAgICAgIC5zaGFyZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgc2V0dXBQcm9qZWN0cygpIHtcclxuICAgICAgICByZXR1cm4gT21uaS5hY3RpdmVNb2RlbFxyXG4gICAgICAgICAgICAuc3dpdGNoTWFwKG1vZGVsID0+IG1vZGVsLm9ic2VydmUucHJvamVjdHMpXHJcbiAgICAgICAgICAgIC5zaGFyZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkaXNwb3NlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlcXVpcmVkID0gdHJ1ZTtcclxuICAgIHB1YmxpYyB0aXRsZSA9IFwiU2VydmVyIEluZm9ybWF0aW9uXCI7XHJcbiAgICBwdWJsaWMgZGVzY3JpcHRpb24gPSBcIk1vbml0b3JzIHNlcnZlciBvdXRwdXQgYW5kIHN0YXR1cy5cIjtcclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IHNlcnZlciA9IG5ldyBTZXJ2ZXJJbmZvcm1hdGlvbjtcclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
