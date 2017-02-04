'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.server = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _tsDisposables = require('ts-disposables');

var _dock = require('../atom/dock');

var _omni = require('../server/omni');

var _omniOutputPaneView = require('../views/omni-output-pane-view');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ServerInformation = function () {
    function ServerInformation() {
        _classCallCheck(this, ServerInformation);

        this.required = true;
        this.title = 'Server Information';
        this.description = 'Monitors server output and status.';
    }

    _createClass(ServerInformation, [{
        key: 'activate',
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
            this.disposable.add(_dock.dock.addWindow('output', 'Omnisharp output', new _omniOutputPaneView.OutputWindow(), {}));
            _dock.dock.selected = 'output';
        }
    }, {
        key: 'setupStatus',
        value: function setupStatus() {
            return _omni.Omni.activeModel.switchMap(function (model) {
                return model.observe.status;
            }).share();
        }
    }, {
        key: 'setupOutput',
        value: function setupOutput() {
            return _omni.Omni.activeModel.switchMap(function (z) {
                return z.observe.output;
            }).startWith([]).share();
        }
    }, {
        key: 'setupOutputElement',
        value: function setupOutputElement() {
            return _omni.Omni.activeModel.map(function (z) {
                return z.outputElement;
            }).startWith(document.createElement('div')).share();
        }
    }, {
        key: 'setupProjects',
        value: function setupProjects() {
            return _omni.Omni.activeModel.switchMap(function (model) {
                return model.observe.projects;
            }).share();
        }
    }, {
        key: 'dispose',
        value: function dispose() {
            this.disposable.dispose();
        }
    }]);

    return ServerInformation;
}();

var server = exports.server = new ServerInformation();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9hdG9tL3NlcnZlci1pbmZvcm1hdGlvbi50cyJdLCJuYW1lcyI6WyJTZXJ2ZXJJbmZvcm1hdGlvbiIsInJlcXVpcmVkIiwidGl0bGUiLCJkZXNjcmlwdGlvbiIsImRpc3Bvc2FibGUiLCJzdGF0dXMiLCJzZXR1cFN0YXR1cyIsIm91dHB1dCIsInNldHVwT3V0cHV0Iiwib3V0cHV0RWxlbWVudCIsInNldHVwT3V0cHV0RWxlbWVudCIsInByb2plY3RzIiwic2V0dXBQcm9qZWN0cyIsImFkZCIsImFjdGl2ZU1vZGVsIiwic3Vic2NyaWJlIiwibW9kZWwiLCJ6Iiwib2JzZXJ2ZSIsImFkZFdpbmRvdyIsInNlbGVjdGVkIiwic3dpdGNoTWFwIiwic2hhcmUiLCJzdGFydFdpdGgiLCJtYXAiLCJkb2N1bWVudCIsImNyZWF0ZUVsZW1lbnQiLCJkaXNwb3NlIiwic2VydmVyIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFFQTs7QUFDQTs7QUFFQTs7QUFFQTs7OztJQUVBQSxpQjtBQUFBLGlDQUFBO0FBQUE7O0FBNERXLGFBQUFDLFFBQUEsR0FBVyxJQUFYO0FBQ0EsYUFBQUMsS0FBQSxHQUFRLG9CQUFSO0FBQ0EsYUFBQUMsV0FBQSxHQUFjLG9DQUFkO0FBQ1Y7Ozs7bUNBbkRrQjtBQUFBOztBQUNYLGlCQUFLQyxVQUFMLEdBQWtCLHdDQUFsQjtBQUVBLGdCQUFNQyxTQUFTLEtBQUtDLFdBQUwsRUFBZjtBQUNBLGdCQUFNQyxTQUFTLEtBQUtDLFdBQUwsRUFBZjtBQUNBLGdCQUFNQyxnQkFBZ0IsS0FBS0Msa0JBQUwsRUFBdEI7QUFDQSxnQkFBTUMsV0FBVyxLQUFLQyxhQUFMLEVBQWpCO0FBRUEsaUJBQUtSLFVBQUwsQ0FBZ0JTLEdBQWhCLENBQW9CLFdBQUtDLFdBQUwsQ0FBaUJDLFNBQWpCLENBQTJCO0FBQUEsdUJBQUssTUFBS0MsS0FBTCxHQUFhQyxDQUFsQjtBQUFBLGFBQTNCLENBQXBCO0FBQ0EsaUJBQUtDLE9BQUwsR0FBZSxFQUFFYixjQUFGLEVBQVVFLGNBQVYsRUFBa0JFLDRCQUFsQixFQUFpQ0Usa0JBQWpDLEVBQTJDSyxPQUFPLFdBQUtGLFdBQXZELEVBQWY7QUFFQSxpQkFBS1YsVUFBTCxDQUFnQlMsR0FBaEIsQ0FBb0IsV0FBS00sU0FBTCxDQUFlLFFBQWYsRUFBeUIsa0JBQXpCLEVBQTZDLHNDQUE3QyxFQUErRCxFQUEvRCxDQUFwQjtBQUNBLHVCQUFLQyxRQUFMLEdBQWdCLFFBQWhCO0FBQ0g7OztzQ0FFa0I7QUFFZixtQkFBTyxXQUFLTixXQUFMLENBQ0ZPLFNBREUsQ0FDUTtBQUFBLHVCQUFTTCxNQUFNRSxPQUFOLENBQWNiLE1BQXZCO0FBQUEsYUFEUixFQUVGaUIsS0FGRSxFQUFQO0FBR0g7OztzQ0FFa0I7QUFHZixtQkFBTyxXQUFLUixXQUFMLENBQ0ZPLFNBREUsQ0FDUTtBQUFBLHVCQUFLSixFQUFFQyxPQUFGLENBQVVYLE1BQWY7QUFBQSxhQURSLEVBRUZnQixTQUZFLENBRVEsRUFGUixFQUdGRCxLQUhFLEVBQVA7QUFJSDs7OzZDQUV5QjtBQUN0QixtQkFBTyxXQUFLUixXQUFMLENBQ0ZVLEdBREUsQ0FDRTtBQUFBLHVCQUFLUCxFQUFFUixhQUFQO0FBQUEsYUFERixFQUVGYyxTQUZFLENBRVFFLFNBQVNDLGFBQVQsQ0FBdUIsS0FBdkIsQ0FGUixFQUdGSixLQUhFLEVBQVA7QUFJSDs7O3dDQUVvQjtBQUNqQixtQkFBTyxXQUFLUixXQUFMLENBQ0ZPLFNBREUsQ0FDUTtBQUFBLHVCQUFTTCxNQUFNRSxPQUFOLENBQWNQLFFBQXZCO0FBQUEsYUFEUixFQUVGVyxLQUZFLEVBQVA7QUFHSDs7O2tDQUVhO0FBQ1YsaUJBQUtsQixVQUFMLENBQWdCdUIsT0FBaEI7QUFDSDs7Ozs7O0FBT0UsSUFBTUMsMEJBQVMsSUFBSTVCLGlCQUFKLEVBQWYiLCJmaWxlIjoibGliL2F0b20vc2VydmVyLWluZm9ybWF0aW9uLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgSU9tbmlzaGFycENsaWVudFN0YXR1cyB9IGZyb20gJ29tbmlzaGFycC1jbGllbnQnO1xyXG5pbXBvcnQgeyBPYnNlcnZhYmxlIH0gZnJvbSAncnhqcyc7XHJcbmltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUgfSBmcm9tICd0cy1kaXNwb3NhYmxlcyc7XHJcbmltcG9ydCB7IGRvY2sgfSBmcm9tICcuLi9hdG9tL2RvY2snO1xyXG5pbXBvcnQgeyBJUHJvamVjdFZpZXdNb2RlbCB9IGZyb20gJy4uL29tbmlzaGFycCc7XHJcbmltcG9ydCB7IE9tbmkgfSBmcm9tICcuLi9zZXJ2ZXIvb21uaSc7XHJcbmltcG9ydCB7IFZpZXdNb2RlbCB9IGZyb20gJy4uL3NlcnZlci92aWV3LW1vZGVsJztcclxuaW1wb3J0IHsgT3V0cHV0V2luZG93IH0gZnJvbSAnLi4vdmlld3Mvb21uaS1vdXRwdXQtcGFuZS12aWV3JztcclxuXHJcbmNsYXNzIFNlcnZlckluZm9ybWF0aW9uIGltcGxlbWVudHMgSUZlYXR1cmUge1xyXG4gICAgcHJpdmF0ZSBkaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xyXG4gICAgcHVibGljIG9ic2VydmU6IHtcclxuICAgICAgICBzdGF0dXM6IE9ic2VydmFibGU8SU9tbmlzaGFycENsaWVudFN0YXR1cz47XHJcbiAgICAgICAgb3V0cHV0OiBPYnNlcnZhYmxlPE91dHB1dE1lc3NhZ2VbXT47XHJcbiAgICAgICAgb3V0cHV0RWxlbWVudDogT2JzZXJ2YWJsZTxIVE1MRGl2RWxlbWVudD47XHJcbiAgICAgICAgcHJvamVjdHM6IE9ic2VydmFibGU8SVByb2plY3RWaWV3TW9kZWxbXT47XHJcbiAgICAgICAgbW9kZWw6IE9ic2VydmFibGU8Vmlld01vZGVsPjtcclxuICAgIH07XHJcblxyXG4gICAgcHVibGljIG1vZGVsOiBWaWV3TW9kZWw7XHJcblxyXG4gICAgcHVibGljIGFjdGl2YXRlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcblxyXG4gICAgICAgIGNvbnN0IHN0YXR1cyA9IHRoaXMuc2V0dXBTdGF0dXMoKTtcclxuICAgICAgICBjb25zdCBvdXRwdXQgPSB0aGlzLnNldHVwT3V0cHV0KCk7XHJcbiAgICAgICAgY29uc3Qgb3V0cHV0RWxlbWVudCA9IHRoaXMuc2V0dXBPdXRwdXRFbGVtZW50KCk7XHJcbiAgICAgICAgY29uc3QgcHJvamVjdHMgPSB0aGlzLnNldHVwUHJvamVjdHMoKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmFjdGl2ZU1vZGVsLnN1YnNjcmliZSh6ID0+IHRoaXMubW9kZWwgPSB6KSk7XHJcbiAgICAgICAgdGhpcy5vYnNlcnZlID0geyBzdGF0dXMsIG91dHB1dCwgb3V0cHV0RWxlbWVudCwgcHJvamVjdHMsIG1vZGVsOiBPbW5pLmFjdGl2ZU1vZGVsIH07XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoZG9jay5hZGRXaW5kb3coJ291dHB1dCcsICdPbW5pc2hhcnAgb3V0cHV0JywgbmV3IE91dHB1dFdpbmRvdywge30pKTtcclxuICAgICAgICBkb2NrLnNlbGVjdGVkID0gJ291dHB1dCc7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBzZXR1cFN0YXR1cygpIHtcclxuICAgICAgICAvLyBTdHJlYW0gdGhlIHN0YXR1cyBmcm9tIHRoZSBhY3RpdmUgbW9kZWxcclxuICAgICAgICByZXR1cm4gT21uaS5hY3RpdmVNb2RlbFxyXG4gICAgICAgICAgICAuc3dpdGNoTWFwKG1vZGVsID0+IG1vZGVsLm9ic2VydmUuc3RhdHVzKVxyXG4gICAgICAgICAgICAuc2hhcmUoKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHNldHVwT3V0cHV0KCkge1xyXG4gICAgICAgIC8vIEFzIHRoZSBhY3RpdmUgbW9kZWwgY2hhbmdlcyAod2hlbiB3ZSBnbyBmcm9tIGFuIGVkaXRvciBmb3IgQ2xpZW50QSB0byBhbiBlZGl0b3IgZm9yIENsaWVudEIpXHJcbiAgICAgICAgLy8gV2Ugd2FudCB0byBtYWtlIHN1cmUgdGhhdCB0aGUgb3V0cHV0IGZpZWxkIGlzXHJcbiAgICAgICAgcmV0dXJuIE9tbmkuYWN0aXZlTW9kZWxcclxuICAgICAgICAgICAgLnN3aXRjaE1hcCh6ID0+IHoub2JzZXJ2ZS5vdXRwdXQpXHJcbiAgICAgICAgICAgIC5zdGFydFdpdGgoW10pXHJcbiAgICAgICAgICAgIC5zaGFyZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgc2V0dXBPdXRwdXRFbGVtZW50KCkge1xyXG4gICAgICAgIHJldHVybiBPbW5pLmFjdGl2ZU1vZGVsXHJcbiAgICAgICAgICAgIC5tYXAoeiA9PiB6Lm91dHB1dEVsZW1lbnQpXHJcbiAgICAgICAgICAgIC5zdGFydFdpdGgoZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JykpXHJcbiAgICAgICAgICAgIC5zaGFyZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgc2V0dXBQcm9qZWN0cygpIHtcclxuICAgICAgICByZXR1cm4gT21uaS5hY3RpdmVNb2RlbFxyXG4gICAgICAgICAgICAuc3dpdGNoTWFwKG1vZGVsID0+IG1vZGVsLm9ic2VydmUucHJvamVjdHMpXHJcbiAgICAgICAgICAgIC5zaGFyZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkaXNwb3NlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlcXVpcmVkID0gdHJ1ZTtcclxuICAgIHB1YmxpYyB0aXRsZSA9ICdTZXJ2ZXIgSW5mb3JtYXRpb24nO1xyXG4gICAgcHVibGljIGRlc2NyaXB0aW9uID0gJ01vbml0b3JzIHNlcnZlciBvdXRwdXQgYW5kIHN0YXR1cy4nO1xyXG59XHJcblxyXG5leHBvcnQgY29uc3Qgc2VydmVyID0gbmV3IFNlcnZlckluZm9ybWF0aW9uO1xyXG4iXX0=
