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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9hdG9tL3NlcnZlci1pbmZvcm1hdGlvbi5qcyIsImxpYi9hdG9tL3NlcnZlci1pbmZvcm1hdGlvbi50cyJdLCJuYW1lcyI6WyJTZXJ2ZXJJbmZvcm1hdGlvbiIsInJlcXVpcmVkIiwidGl0bGUiLCJkZXNjcmlwdGlvbiIsImRpc3Bvc2FibGUiLCJzdGF0dXMiLCJzZXR1cFN0YXR1cyIsIm91dHB1dCIsInNldHVwT3V0cHV0Iiwib3V0cHV0RWxlbWVudCIsInNldHVwT3V0cHV0RWxlbWVudCIsInByb2plY3RzIiwic2V0dXBQcm9qZWN0cyIsImFkZCIsImFjdGl2ZU1vZGVsIiwic3Vic2NyaWJlIiwibW9kZWwiLCJ6Iiwib2JzZXJ2ZSIsImFkZFdpbmRvdyIsInNlbGVjdGVkIiwic3dpdGNoTWFwIiwic2hhcmUiLCJzdGFydFdpdGgiLCJtYXAiLCJkb2N1bWVudCIsImNyZWF0ZUVsZW1lbnQiLCJkaXNwb3NlIiwic2VydmVyIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7QUFDQTs7OztJQ01BQSxpQjtBQUFBLGlDQUFBO0FBQUE7O0FBNERXLGFBQUFDLFFBQUEsR0FBVyxJQUFYO0FBQ0EsYUFBQUMsS0FBQSxHQUFRLG9CQUFSO0FBQ0EsYUFBQUMsV0FBQSxHQUFjLG9DQUFkO0FBQ1Y7Ozs7bUNBbkRrQjtBQUFBOztBQUNYLGlCQUFLQyxVQUFMLEdBQWtCLHdDQUFsQjtBQUVBLGdCQUFNQyxTQUFTLEtBQUtDLFdBQUwsRUFBZjtBQUNBLGdCQUFNQyxTQUFTLEtBQUtDLFdBQUwsRUFBZjtBQUNBLGdCQUFNQyxnQkFBZ0IsS0FBS0Msa0JBQUwsRUFBdEI7QUFDQSxnQkFBTUMsV0FBVyxLQUFLQyxhQUFMLEVBQWpCO0FBRUEsaUJBQUtSLFVBQUwsQ0FBZ0JTLEdBQWhCLENBQW9CLFdBQUtDLFdBQUwsQ0FBaUJDLFNBQWpCLENBQTJCO0FBQUEsdUJBQUssTUFBS0MsS0FBTCxHQUFhQyxDQUFsQjtBQUFBLGFBQTNCLENBQXBCO0FBQ0EsaUJBQUtDLE9BQUwsR0FBZSxFQUFFYixjQUFGLEVBQVVFLGNBQVYsRUFBa0JFLDRCQUFsQixFQUFpQ0Usa0JBQWpDLEVBQTJDSyxPQUFPLFdBQUtGLFdBQXZELEVBQWY7QUFFQSxpQkFBS1YsVUFBTCxDQUFnQlMsR0FBaEIsQ0FBb0IsV0FBS00sU0FBTCxDQUFlLFFBQWYsRUFBeUIsa0JBQXpCLEVBQTZDLHNDQUE3QyxFQUErRCxFQUEvRCxDQUFwQjtBQUNBLHVCQUFLQyxRQUFMLEdBQWdCLFFBQWhCO0FBQ0g7OztzQ0FFa0I7QUFFZixtQkFBTyxXQUFLTixXQUFMLENBQ0ZPLFNBREUsQ0FDUTtBQUFBLHVCQUFTTCxNQUFNRSxPQUFOLENBQWNiLE1BQXZCO0FBQUEsYUFEUixFQUVGaUIsS0FGRSxFQUFQO0FBR0g7OztzQ0FFa0I7QUFHZixtQkFBTyxXQUFLUixXQUFMLENBQ0ZPLFNBREUsQ0FDUTtBQUFBLHVCQUFLSixFQUFFQyxPQUFGLENBQVVYLE1BQWY7QUFBQSxhQURSLEVBRUZnQixTQUZFLENBRVEsRUFGUixFQUdGRCxLQUhFLEVBQVA7QUFJSDs7OzZDQUV5QjtBQUN0QixtQkFBTyxXQUFLUixXQUFMLENBQ0ZVLEdBREUsQ0FDRTtBQUFBLHVCQUFLUCxFQUFFUixhQUFQO0FBQUEsYUFERixFQUVGYyxTQUZFLENBRVFFLFNBQVNDLGFBQVQsQ0FBdUIsS0FBdkIsQ0FGUixFQUdGSixLQUhFLEVBQVA7QUFJSDs7O3dDQUVvQjtBQUNqQixtQkFBTyxXQUFLUixXQUFMLENBQ0ZPLFNBREUsQ0FDUTtBQUFBLHVCQUFTTCxNQUFNRSxPQUFOLENBQWNQLFFBQXZCO0FBQUEsYUFEUixFQUVGVyxLQUZFLEVBQVA7QUFHSDs7O2tDQUVhO0FBQ1YsaUJBQUtsQixVQUFMLENBQWdCdUIsT0FBaEI7QUFDSDs7Ozs7O0FBT0UsSUFBTUMsMEJBQVMsSUFBSTVCLGlCQUFKLEVBQWYiLCJmaWxlIjoibGliL2F0b20vc2VydmVyLWluZm9ybWF0aW9uLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSB9IGZyb20gXCJ0cy1kaXNwb3NhYmxlc1wiO1xuaW1wb3J0IHsgT21uaSB9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xuaW1wb3J0IHsgZG9jayB9IGZyb20gXCIuLi9hdG9tL2RvY2tcIjtcbmltcG9ydCB7IE91dHB1dFdpbmRvdyB9IGZyb20gXCIuLi92aWV3cy9vbW5pLW91dHB1dC1wYW5lLXZpZXdcIjtcbmNsYXNzIFNlcnZlckluZm9ybWF0aW9uIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5yZXF1aXJlZCA9IHRydWU7XG4gICAgICAgIHRoaXMudGl0bGUgPSBcIlNlcnZlciBJbmZvcm1hdGlvblwiO1xuICAgICAgICB0aGlzLmRlc2NyaXB0aW9uID0gXCJNb25pdG9ycyBzZXJ2ZXIgb3V0cHV0IGFuZCBzdGF0dXMuXCI7XG4gICAgfVxuICAgIGFjdGl2YXRlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICBjb25zdCBzdGF0dXMgPSB0aGlzLnNldHVwU3RhdHVzKCk7XG4gICAgICAgIGNvbnN0IG91dHB1dCA9IHRoaXMuc2V0dXBPdXRwdXQoKTtcbiAgICAgICAgY29uc3Qgb3V0cHV0RWxlbWVudCA9IHRoaXMuc2V0dXBPdXRwdXRFbGVtZW50KCk7XG4gICAgICAgIGNvbnN0IHByb2plY3RzID0gdGhpcy5zZXR1cFByb2plY3RzKCk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5hY3RpdmVNb2RlbC5zdWJzY3JpYmUoeiA9PiB0aGlzLm1vZGVsID0geikpO1xuICAgICAgICB0aGlzLm9ic2VydmUgPSB7IHN0YXR1cywgb3V0cHV0LCBvdXRwdXRFbGVtZW50LCBwcm9qZWN0cywgbW9kZWw6IE9tbmkuYWN0aXZlTW9kZWwgfTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChkb2NrLmFkZFdpbmRvdyhcIm91dHB1dFwiLCBcIk9tbmlzaGFycCBvdXRwdXRcIiwgbmV3IE91dHB1dFdpbmRvdywge30pKTtcbiAgICAgICAgZG9jay5zZWxlY3RlZCA9IFwib3V0cHV0XCI7XG4gICAgfVxuICAgIHNldHVwU3RhdHVzKCkge1xuICAgICAgICByZXR1cm4gT21uaS5hY3RpdmVNb2RlbFxuICAgICAgICAgICAgLnN3aXRjaE1hcChtb2RlbCA9PiBtb2RlbC5vYnNlcnZlLnN0YXR1cylcbiAgICAgICAgICAgIC5zaGFyZSgpO1xuICAgIH1cbiAgICBzZXR1cE91dHB1dCgpIHtcbiAgICAgICAgcmV0dXJuIE9tbmkuYWN0aXZlTW9kZWxcbiAgICAgICAgICAgIC5zd2l0Y2hNYXAoeiA9PiB6Lm9ic2VydmUub3V0cHV0KVxuICAgICAgICAgICAgLnN0YXJ0V2l0aChbXSlcbiAgICAgICAgICAgIC5zaGFyZSgpO1xuICAgIH1cbiAgICBzZXR1cE91dHB1dEVsZW1lbnQoKSB7XG4gICAgICAgIHJldHVybiBPbW5pLmFjdGl2ZU1vZGVsXG4gICAgICAgICAgICAubWFwKHogPT4gei5vdXRwdXRFbGVtZW50KVxuICAgICAgICAgICAgLnN0YXJ0V2l0aChkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpKVxuICAgICAgICAgICAgLnNoYXJlKCk7XG4gICAgfVxuICAgIHNldHVwUHJvamVjdHMoKSB7XG4gICAgICAgIHJldHVybiBPbW5pLmFjdGl2ZU1vZGVsXG4gICAgICAgICAgICAuc3dpdGNoTWFwKG1vZGVsID0+IG1vZGVsLm9ic2VydmUucHJvamVjdHMpXG4gICAgICAgICAgICAuc2hhcmUoKTtcbiAgICB9XG4gICAgZGlzcG9zZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICB9XG59XG5leHBvcnQgY29uc3Qgc2VydmVyID0gbmV3IFNlcnZlckluZm9ybWF0aW9uO1xuIiwiaW1wb3J0IHtPYnNlcnZhYmxlfSBmcm9tIFwicnhqc1wiO1xyXG5pbXBvcnQge0NvbXBvc2l0ZURpc3Bvc2FibGV9IGZyb20gXCJ0cy1kaXNwb3NhYmxlc1wiO1xyXG5pbXBvcnQge09tbml9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xyXG5pbXBvcnQge09tbmlzaGFycENsaWVudFN0YXR1c30gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcclxuaW1wb3J0IHtkb2NrfSBmcm9tIFwiLi4vYXRvbS9kb2NrXCI7XHJcbmltcG9ydCB7T3V0cHV0V2luZG93fSBmcm9tIFwiLi4vdmlld3Mvb21uaS1vdXRwdXQtcGFuZS12aWV3XCI7XHJcbmltcG9ydCB7Vmlld01vZGVsfSBmcm9tIFwiLi4vc2VydmVyL3ZpZXctbW9kZWxcIjtcclxuaW1wb3J0IHtJUHJvamVjdFZpZXdNb2RlbH0gZnJvbSBcIi4uL29tbmlzaGFycFwiO1xyXG5cclxuY2xhc3MgU2VydmVySW5mb3JtYXRpb24gaW1wbGVtZW50cyBJRmVhdHVyZSB7XHJcbiAgICBwcml2YXRlIGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XHJcbiAgICBwdWJsaWMgb2JzZXJ2ZToge1xyXG4gICAgICAgIHN0YXR1czogT2JzZXJ2YWJsZTxPbW5pc2hhcnBDbGllbnRTdGF0dXM+O1xyXG4gICAgICAgIG91dHB1dDogT2JzZXJ2YWJsZTxPdXRwdXRNZXNzYWdlW10+O1xyXG4gICAgICAgIG91dHB1dEVsZW1lbnQ6IE9ic2VydmFibGU8SFRNTERpdkVsZW1lbnQ+O1xyXG4gICAgICAgIHByb2plY3RzOiBPYnNlcnZhYmxlPElQcm9qZWN0Vmlld01vZGVsW10+O1xyXG4gICAgICAgIG1vZGVsOiBPYnNlcnZhYmxlPFZpZXdNb2RlbD47XHJcbiAgICB9O1xyXG5cclxuICAgIHB1YmxpYyBtb2RlbDogVmlld01vZGVsO1xyXG5cclxuICAgIHB1YmxpYyBhY3RpdmF0ZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG5cclxuICAgICAgICBjb25zdCBzdGF0dXMgPSB0aGlzLnNldHVwU3RhdHVzKCk7XHJcbiAgICAgICAgY29uc3Qgb3V0cHV0ID0gdGhpcy5zZXR1cE91dHB1dCgpO1xyXG4gICAgICAgIGNvbnN0IG91dHB1dEVsZW1lbnQgPSB0aGlzLnNldHVwT3V0cHV0RWxlbWVudCgpO1xyXG4gICAgICAgIGNvbnN0IHByb2plY3RzID0gdGhpcy5zZXR1cFByb2plY3RzKCk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5hY3RpdmVNb2RlbC5zdWJzY3JpYmUoeiA9PiB0aGlzLm1vZGVsID0geikpO1xyXG4gICAgICAgIHRoaXMub2JzZXJ2ZSA9IHsgc3RhdHVzLCBvdXRwdXQsIG91dHB1dEVsZW1lbnQsIHByb2plY3RzLCBtb2RlbDogT21uaS5hY3RpdmVNb2RlbCB9O1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGRvY2suYWRkV2luZG93KFwib3V0cHV0XCIsIFwiT21uaXNoYXJwIG91dHB1dFwiLCBuZXcgT3V0cHV0V2luZG93LCB7fSkpO1xyXG4gICAgICAgIGRvY2suc2VsZWN0ZWQgPSBcIm91dHB1dFwiO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgc2V0dXBTdGF0dXMoKSB7XHJcbiAgICAgICAgLy8gU3RyZWFtIHRoZSBzdGF0dXMgZnJvbSB0aGUgYWN0aXZlIG1vZGVsXHJcbiAgICAgICAgcmV0dXJuIE9tbmkuYWN0aXZlTW9kZWxcclxuICAgICAgICAgICAgLnN3aXRjaE1hcChtb2RlbCA9PiBtb2RlbC5vYnNlcnZlLnN0YXR1cylcclxuICAgICAgICAgICAgLnNoYXJlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBzZXR1cE91dHB1dCgpIHtcclxuICAgICAgICAvLyBBcyB0aGUgYWN0aXZlIG1vZGVsIGNoYW5nZXMgKHdoZW4gd2UgZ28gZnJvbSBhbiBlZGl0b3IgZm9yIENsaWVudEEgdG8gYW4gZWRpdG9yIGZvciBDbGllbnRCKVxyXG4gICAgICAgIC8vIFdlIHdhbnQgdG8gbWFrZSBzdXJlIHRoYXQgdGhlIG91dHB1dCBmaWVsZCBpc1xyXG4gICAgICAgIHJldHVybiBPbW5pLmFjdGl2ZU1vZGVsXHJcbiAgICAgICAgICAgIC5zd2l0Y2hNYXAoeiA9PiB6Lm9ic2VydmUub3V0cHV0KVxyXG4gICAgICAgICAgICAuc3RhcnRXaXRoKFtdKVxyXG4gICAgICAgICAgICAuc2hhcmUoKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHNldHVwT3V0cHV0RWxlbWVudCgpIHtcclxuICAgICAgICByZXR1cm4gT21uaS5hY3RpdmVNb2RlbFxyXG4gICAgICAgICAgICAubWFwKHogPT4gei5vdXRwdXRFbGVtZW50KVxyXG4gICAgICAgICAgICAuc3RhcnRXaXRoKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIikpXHJcbiAgICAgICAgICAgIC5zaGFyZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgc2V0dXBQcm9qZWN0cygpIHtcclxuICAgICAgICByZXR1cm4gT21uaS5hY3RpdmVNb2RlbFxyXG4gICAgICAgICAgICAuc3dpdGNoTWFwKG1vZGVsID0+IG1vZGVsLm9ic2VydmUucHJvamVjdHMpXHJcbiAgICAgICAgICAgIC5zaGFyZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkaXNwb3NlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlcXVpcmVkID0gdHJ1ZTtcclxuICAgIHB1YmxpYyB0aXRsZSA9IFwiU2VydmVyIEluZm9ybWF0aW9uXCI7XHJcbiAgICBwdWJsaWMgZGVzY3JpcHRpb24gPSBcIk1vbml0b3JzIHNlcnZlciBvdXRwdXQgYW5kIHN0YXR1cy5cIjtcclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IHNlcnZlciA9IG5ldyBTZXJ2ZXJJbmZvcm1hdGlvbjtcclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
