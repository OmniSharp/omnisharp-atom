"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.server = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _tsDisposables = require("ts-disposables");

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

            this.disposable = new _tsDisposables.CompositeDisposable();
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9hdG9tL3NlcnZlci1pbmZvcm1hdGlvbi5qcyIsImxpYi9hdG9tL3NlcnZlci1pbmZvcm1hdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7QUFDQTs7OztJQ01BO0FBQUEsaUNBQUE7OztBQTREVyxhQUFBLFFBQUEsR0FBVyxJQUFYLENBNURYO0FBNkRXLGFBQUEsS0FBQSxHQUFRLG9CQUFSLENBN0RYO0FBOERXLGFBQUEsV0FBQSxHQUFjLG9DQUFkLENBOURYO0tBQUE7Ozs7bUNBWW1COzs7QUFDWCxpQkFBSyxVQUFMLEdBQWtCLHdDQUFsQixDQURXO0FBR1gsZ0JBQU0sU0FBUyxLQUFLLFdBQUwsRUFBVCxDQUhLO0FBSVgsZ0JBQU0sU0FBUyxLQUFLLFdBQUwsRUFBVCxDQUpLO0FBS1gsZ0JBQU0sZ0JBQWdCLEtBQUssa0JBQUwsRUFBaEIsQ0FMSztBQU1YLGdCQUFNLFdBQVcsS0FBSyxhQUFMLEVBQVgsQ0FOSztBQVFYLGlCQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsV0FBSyxXQUFMLENBQWlCLFNBQWpCLENBQTJCO3VCQUFLLE1BQUssS0FBTCxHQUFhLENBQWI7YUFBTCxDQUEvQyxFQVJXO0FBU1gsaUJBQUssT0FBTCxHQUFlLEVBQUUsY0FBRixFQUFVLGNBQVYsRUFBa0IsNEJBQWxCLEVBQWlDLGtCQUFqQyxFQUEyQyxPQUFPLFdBQUssV0FBTCxFQUFqRSxDQVRXO0FBV1gsaUJBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQixXQUFLLFNBQUwsQ0FBZSxRQUFmLEVBQXlCLGtCQUF6QixFQUE2QyxzQ0FBN0MsRUFBK0QsRUFBL0QsQ0FBcEIsRUFYVztBQVlYLHVCQUFLLFFBQUwsR0FBZ0IsUUFBaEIsQ0FaVzs7OztzQ0FlSTtBQUVmLG1CQUFPLFdBQUssV0FBTCxDQUNGLFNBREUsQ0FDUTt1QkFBUyxNQUFNLE9BQU4sQ0FBYyxNQUFkO2FBQVQsQ0FEUixDQUVGLEtBRkUsRUFBUCxDQUZlOzs7O3NDQU9BO0FBR2YsbUJBQU8sV0FBSyxXQUFMLENBQ0YsU0FERSxDQUNRO3VCQUFLLEVBQUUsT0FBRixDQUFVLE1BQVY7YUFBTCxDQURSLENBRUYsU0FGRSxDQUVRLEVBRlIsRUFHRixLQUhFLEVBQVAsQ0FIZTs7Ozs2Q0FTTztBQUN0QixtQkFBTyxXQUFLLFdBQUwsQ0FDRixHQURFLENBQ0U7dUJBQUssRUFBRSxhQUFGO2FBQUwsQ0FERixDQUVGLFNBRkUsQ0FFUSxTQUFTLGFBQVQsQ0FBdUIsS0FBdkIsQ0FGUixFQUdGLEtBSEUsRUFBUCxDQURzQjs7Ozt3Q0FPTDtBQUNqQixtQkFBTyxXQUFLLFdBQUwsQ0FDRixTQURFLENBQ1E7dUJBQVMsTUFBTSxPQUFOLENBQWMsUUFBZDthQUFULENBRFIsQ0FFRixLQUZFLEVBQVAsQ0FEaUI7Ozs7a0NBTVA7QUFDVixpQkFBSyxVQUFMLENBQWdCLE9BQWhCLEdBRFU7Ozs7Ozs7QUFTWCxJQUFNLDBCQUFTLElBQUksaUJBQUosRUFBVCIsImZpbGUiOiJsaWIvYXRvbS9zZXJ2ZXItaW5mb3JtYXRpb24uanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlIH0gZnJvbSBcInRzLWRpc3Bvc2FibGVzXCI7XG5pbXBvcnQgeyBPbW5pIH0gZnJvbSBcIi4uL3NlcnZlci9vbW5pXCI7XG5pbXBvcnQgeyBkb2NrIH0gZnJvbSBcIi4uL2F0b20vZG9ja1wiO1xuaW1wb3J0IHsgT3V0cHV0V2luZG93IH0gZnJvbSBcIi4uL3ZpZXdzL29tbmktb3V0cHV0LXBhbmUtdmlld1wiO1xuY2xhc3MgU2VydmVySW5mb3JtYXRpb24ge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLnJlcXVpcmVkID0gdHJ1ZTtcbiAgICAgICAgdGhpcy50aXRsZSA9IFwiU2VydmVyIEluZm9ybWF0aW9uXCI7XG4gICAgICAgIHRoaXMuZGVzY3JpcHRpb24gPSBcIk1vbml0b3JzIHNlcnZlciBvdXRwdXQgYW5kIHN0YXR1cy5cIjtcbiAgICB9XG4gICAgYWN0aXZhdGUoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIGNvbnN0IHN0YXR1cyA9IHRoaXMuc2V0dXBTdGF0dXMoKTtcbiAgICAgICAgY29uc3Qgb3V0cHV0ID0gdGhpcy5zZXR1cE91dHB1dCgpO1xuICAgICAgICBjb25zdCBvdXRwdXRFbGVtZW50ID0gdGhpcy5zZXR1cE91dHB1dEVsZW1lbnQoKTtcbiAgICAgICAgY29uc3QgcHJvamVjdHMgPSB0aGlzLnNldHVwUHJvamVjdHMoKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmFjdGl2ZU1vZGVsLnN1YnNjcmliZSh6ID0+IHRoaXMubW9kZWwgPSB6KSk7XG4gICAgICAgIHRoaXMub2JzZXJ2ZSA9IHsgc3RhdHVzLCBvdXRwdXQsIG91dHB1dEVsZW1lbnQsIHByb2plY3RzLCBtb2RlbDogT21uaS5hY3RpdmVNb2RlbCB9O1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGRvY2suYWRkV2luZG93KFwib3V0cHV0XCIsIFwiT21uaXNoYXJwIG91dHB1dFwiLCBuZXcgT3V0cHV0V2luZG93LCB7fSkpO1xuICAgICAgICBkb2NrLnNlbGVjdGVkID0gXCJvdXRwdXRcIjtcbiAgICB9XG4gICAgc2V0dXBTdGF0dXMoKSB7XG4gICAgICAgIHJldHVybiBPbW5pLmFjdGl2ZU1vZGVsXG4gICAgICAgICAgICAuc3dpdGNoTWFwKG1vZGVsID0+IG1vZGVsLm9ic2VydmUuc3RhdHVzKVxuICAgICAgICAgICAgLnNoYXJlKCk7XG4gICAgfVxuICAgIHNldHVwT3V0cHV0KCkge1xuICAgICAgICByZXR1cm4gT21uaS5hY3RpdmVNb2RlbFxuICAgICAgICAgICAgLnN3aXRjaE1hcCh6ID0+IHoub2JzZXJ2ZS5vdXRwdXQpXG4gICAgICAgICAgICAuc3RhcnRXaXRoKFtdKVxuICAgICAgICAgICAgLnNoYXJlKCk7XG4gICAgfVxuICAgIHNldHVwT3V0cHV0RWxlbWVudCgpIHtcbiAgICAgICAgcmV0dXJuIE9tbmkuYWN0aXZlTW9kZWxcbiAgICAgICAgICAgIC5tYXAoeiA9PiB6Lm91dHB1dEVsZW1lbnQpXG4gICAgICAgICAgICAuc3RhcnRXaXRoKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIikpXG4gICAgICAgICAgICAuc2hhcmUoKTtcbiAgICB9XG4gICAgc2V0dXBQcm9qZWN0cygpIHtcbiAgICAgICAgcmV0dXJuIE9tbmkuYWN0aXZlTW9kZWxcbiAgICAgICAgICAgIC5zd2l0Y2hNYXAobW9kZWwgPT4gbW9kZWwub2JzZXJ2ZS5wcm9qZWN0cylcbiAgICAgICAgICAgIC5zaGFyZSgpO1xuICAgIH1cbiAgICBkaXNwb3NlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgIH1cbn1cbmV4cG9ydCBjb25zdCBzZXJ2ZXIgPSBuZXcgU2VydmVySW5mb3JtYXRpb247XG4iLCJpbXBvcnQge09ic2VydmFibGV9IGZyb20gXCJyeGpzXCI7XHJcbmltcG9ydCB7Q29tcG9zaXRlRGlzcG9zYWJsZX0gZnJvbSBcInRzLWRpc3Bvc2FibGVzXCI7XHJcbmltcG9ydCB7T21uaX0gZnJvbSBcIi4uL3NlcnZlci9vbW5pXCI7XHJcbmltcG9ydCB7T21uaXNoYXJwQ2xpZW50U3RhdHVzfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xyXG5pbXBvcnQge2RvY2t9IGZyb20gXCIuLi9hdG9tL2RvY2tcIjtcclxuaW1wb3J0IHtPdXRwdXRXaW5kb3d9IGZyb20gXCIuLi92aWV3cy9vbW5pLW91dHB1dC1wYW5lLXZpZXdcIjtcclxuaW1wb3J0IHtWaWV3TW9kZWx9IGZyb20gXCIuLi9zZXJ2ZXIvdmlldy1tb2RlbFwiO1xyXG5pbXBvcnQge0lQcm9qZWN0Vmlld01vZGVsfSBmcm9tIFwiLi4vb21uaXNoYXJwXCI7XHJcblxyXG5jbGFzcyBTZXJ2ZXJJbmZvcm1hdGlvbiBpbXBsZW1lbnRzIElGZWF0dXJlIHtcclxuICAgIHByaXZhdGUgZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxuICAgIHB1YmxpYyBvYnNlcnZlOiB7XHJcbiAgICAgICAgc3RhdHVzOiBPYnNlcnZhYmxlPE9tbmlzaGFycENsaWVudFN0YXR1cz47XHJcbiAgICAgICAgb3V0cHV0OiBPYnNlcnZhYmxlPE91dHB1dE1lc3NhZ2VbXT47XHJcbiAgICAgICAgb3V0cHV0RWxlbWVudDogT2JzZXJ2YWJsZTxIVE1MRGl2RWxlbWVudD47XHJcbiAgICAgICAgcHJvamVjdHM6IE9ic2VydmFibGU8SVByb2plY3RWaWV3TW9kZWxbXT47XHJcbiAgICAgICAgbW9kZWw6IE9ic2VydmFibGU8Vmlld01vZGVsPjtcclxuICAgIH07XHJcblxyXG4gICAgcHVibGljIG1vZGVsOiBWaWV3TW9kZWw7XHJcblxyXG4gICAgcHVibGljIGFjdGl2YXRlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcblxyXG4gICAgICAgIGNvbnN0IHN0YXR1cyA9IHRoaXMuc2V0dXBTdGF0dXMoKTtcclxuICAgICAgICBjb25zdCBvdXRwdXQgPSB0aGlzLnNldHVwT3V0cHV0KCk7XHJcbiAgICAgICAgY29uc3Qgb3V0cHV0RWxlbWVudCA9IHRoaXMuc2V0dXBPdXRwdXRFbGVtZW50KCk7XHJcbiAgICAgICAgY29uc3QgcHJvamVjdHMgPSB0aGlzLnNldHVwUHJvamVjdHMoKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmFjdGl2ZU1vZGVsLnN1YnNjcmliZSh6ID0+IHRoaXMubW9kZWwgPSB6KSk7XHJcbiAgICAgICAgdGhpcy5vYnNlcnZlID0geyBzdGF0dXMsIG91dHB1dCwgb3V0cHV0RWxlbWVudCwgcHJvamVjdHMsIG1vZGVsOiBPbW5pLmFjdGl2ZU1vZGVsIH07XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoZG9jay5hZGRXaW5kb3coXCJvdXRwdXRcIiwgXCJPbW5pc2hhcnAgb3V0cHV0XCIsIG5ldyBPdXRwdXRXaW5kb3csIHt9KSk7XHJcbiAgICAgICAgZG9jay5zZWxlY3RlZCA9IFwib3V0cHV0XCI7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBzZXR1cFN0YXR1cygpIHtcclxuICAgICAgICAvLyBTdHJlYW0gdGhlIHN0YXR1cyBmcm9tIHRoZSBhY3RpdmUgbW9kZWxcclxuICAgICAgICByZXR1cm4gT21uaS5hY3RpdmVNb2RlbFxyXG4gICAgICAgICAgICAuc3dpdGNoTWFwKG1vZGVsID0+IG1vZGVsLm9ic2VydmUuc3RhdHVzKVxyXG4gICAgICAgICAgICAuc2hhcmUoKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHNldHVwT3V0cHV0KCkge1xyXG4gICAgICAgIC8vIEFzIHRoZSBhY3RpdmUgbW9kZWwgY2hhbmdlcyAod2hlbiB3ZSBnbyBmcm9tIGFuIGVkaXRvciBmb3IgQ2xpZW50QSB0byBhbiBlZGl0b3IgZm9yIENsaWVudEIpXHJcbiAgICAgICAgLy8gV2Ugd2FudCB0byBtYWtlIHN1cmUgdGhhdCB0aGUgb3V0cHV0IGZpZWxkIGlzXHJcbiAgICAgICAgcmV0dXJuIE9tbmkuYWN0aXZlTW9kZWxcclxuICAgICAgICAgICAgLnN3aXRjaE1hcCh6ID0+IHoub2JzZXJ2ZS5vdXRwdXQpXHJcbiAgICAgICAgICAgIC5zdGFydFdpdGgoW10pXHJcbiAgICAgICAgICAgIC5zaGFyZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgc2V0dXBPdXRwdXRFbGVtZW50KCkge1xyXG4gICAgICAgIHJldHVybiBPbW5pLmFjdGl2ZU1vZGVsXHJcbiAgICAgICAgICAgIC5tYXAoeiA9PiB6Lm91dHB1dEVsZW1lbnQpXHJcbiAgICAgICAgICAgIC5zdGFydFdpdGgoZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKSlcclxuICAgICAgICAgICAgLnNoYXJlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBzZXR1cFByb2plY3RzKCkge1xyXG4gICAgICAgIHJldHVybiBPbW5pLmFjdGl2ZU1vZGVsXHJcbiAgICAgICAgICAgIC5zd2l0Y2hNYXAobW9kZWwgPT4gbW9kZWwub2JzZXJ2ZS5wcm9qZWN0cylcclxuICAgICAgICAgICAgLnNoYXJlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVxdWlyZWQgPSB0cnVlO1xyXG4gICAgcHVibGljIHRpdGxlID0gXCJTZXJ2ZXIgSW5mb3JtYXRpb25cIjtcclxuICAgIHB1YmxpYyBkZXNjcmlwdGlvbiA9IFwiTW9uaXRvcnMgc2VydmVyIG91dHB1dCBhbmQgc3RhdHVzLlwiO1xyXG59XHJcblxyXG5leHBvcnQgY29uc3Qgc2VydmVyID0gbmV3IFNlcnZlckluZm9ybWF0aW9uO1xyXG4iXX0=
