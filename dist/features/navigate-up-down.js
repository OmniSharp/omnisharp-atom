"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.navigate = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _tsDisposables = require("ts-disposables");

var _omni = require("../server/omni");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Navigate = function () {
    function Navigate() {
        _classCallCheck(this, Navigate);

        this.required = true;
        this.title = "Navigate";
        this.description = "Adds server based navigation support";
    }

    _createClass(Navigate, [{
        key: "activate",
        value: function activate() {
            var _this = this;

            this.disposable = new _tsDisposables.CompositeDisposable();
            this.disposable.add(_omni.Omni.addTextEditorCommand("omnisharp-atom:navigate-up", function () {
                return _this.navigateUp();
            }));
            this.disposable.add(_omni.Omni.addTextEditorCommand("omnisharp-atom:navigate-down", function () {
                return _this.navigateDown();
            }));
            this.disposable.add(_omni.Omni.listener.navigateup.subscribe(function (data) {
                return _this.navigateTo(data.response);
            }));
            this.disposable.add(_omni.Omni.listener.navigatedown.subscribe(function (data) {
                return _this.navigateTo(data.response);
            }));
        }
    }, {
        key: "dispose",
        value: function dispose() {
            this.disposable.dispose();
        }
    }, {
        key: "navigateUp",
        value: function navigateUp() {
            _omni.Omni.request(function (solution) {
                return solution.navigateup({});
            });
        }
    }, {
        key: "navigateDown",
        value: function navigateDown() {
            _omni.Omni.request(function (solution) {
                return solution.navigatedown({});
            });
        }
    }, {
        key: "navigateTo",
        value: function navigateTo(data) {
            var editor = atom.workspace.getActiveTextEditor();
            _omni.Omni.navigateTo({ FileName: editor.getURI(), Line: data.Line, Column: data.Column });
        }
    }]);

    return Navigate;
}();

var navigate = exports.navigate = new Navigate();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9uYXZpZ2F0ZS11cC1kb3duLmpzIiwibGliL2ZlYXR1cmVzL25hdmlnYXRlLXVwLWRvd24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0FBQ0E7Ozs7SUNHQTtBQUFBLHdCQUFBOzs7QUFtQ1csYUFBQSxRQUFBLEdBQVcsSUFBWCxDQW5DWDtBQW9DVyxhQUFBLEtBQUEsR0FBUSxVQUFSLENBcENYO0FBcUNXLGFBQUEsV0FBQSxHQUFjLHNDQUFkLENBckNYO0tBQUE7Ozs7bUNBR21COzs7QUFDWCxpQkFBSyxVQUFMLEdBQWtCLHdDQUFsQixDQURXO0FBR1gsaUJBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQixXQUFLLG9CQUFMLENBQTBCLDRCQUExQixFQUF3RCxZQUFBO0FBQ3hFLHVCQUFPLE1BQUssVUFBTCxFQUFQLENBRHdFO2FBQUEsQ0FBNUUsRUFIVztBQU9YLGlCQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsV0FBSyxvQkFBTCxDQUEwQiw4QkFBMUIsRUFBMEQsWUFBQTtBQUMxRSx1QkFBTyxNQUFLLFlBQUwsRUFBUCxDQUQwRTthQUFBLENBQTlFLEVBUFc7QUFXWCxpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLFdBQUssUUFBTCxDQUFjLFVBQWQsQ0FBeUIsU0FBekIsQ0FBbUMsVUFBQyxJQUFEO3VCQUFVLE1BQUssVUFBTCxDQUFnQixLQUFLLFFBQUw7YUFBMUIsQ0FBdkQsRUFYVztBQVlYLGlCQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsV0FBSyxRQUFMLENBQWMsWUFBZCxDQUEyQixTQUEzQixDQUFxQyxVQUFDLElBQUQ7dUJBQVUsTUFBSyxVQUFMLENBQWdCLEtBQUssUUFBTDthQUExQixDQUF6RCxFQVpXOzs7O2tDQWVEO0FBQ1YsaUJBQUssVUFBTCxDQUFnQixPQUFoQixHQURVOzs7O3FDQUlHO0FBQ2IsdUJBQUssT0FBTCxDQUFhO3VCQUFZLFNBQVMsVUFBVCxDQUFvQixFQUFwQjthQUFaLENBQWIsQ0FEYTs7Ozt1Q0FJRTtBQUNmLHVCQUFLLE9BQUwsQ0FBYTt1QkFBWSxTQUFTLFlBQVQsQ0FBc0IsRUFBdEI7YUFBWixDQUFiLENBRGU7Ozs7bUNBSUEsTUFBNkI7QUFDNUMsZ0JBQU0sU0FBUyxLQUFLLFNBQUwsQ0FBZSxtQkFBZixFQUFULENBRHNDO0FBRTVDLHVCQUFLLFVBQUwsQ0FBZ0IsRUFBRSxVQUFVLE9BQU8sTUFBUCxFQUFWLEVBQTJCLE1BQU0sS0FBSyxJQUFMLEVBQVcsUUFBUSxLQUFLLE1BQUwsRUFBdEUsRUFGNEM7Ozs7Ozs7QUFTN0MsSUFBTSw4QkFBVyxJQUFJLFFBQUosRUFBWCIsImZpbGUiOiJsaWIvZmVhdHVyZXMvbmF2aWdhdGUtdXAtZG93bi5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUgfSBmcm9tIFwidHMtZGlzcG9zYWJsZXNcIjtcbmltcG9ydCB7IE9tbmkgfSBmcm9tIFwiLi4vc2VydmVyL29tbmlcIjtcbmNsYXNzIE5hdmlnYXRlIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5yZXF1aXJlZCA9IHRydWU7XG4gICAgICAgIHRoaXMudGl0bGUgPSBcIk5hdmlnYXRlXCI7XG4gICAgICAgIHRoaXMuZGVzY3JpcHRpb24gPSBcIkFkZHMgc2VydmVyIGJhc2VkIG5hdmlnYXRpb24gc3VwcG9ydFwiO1xuICAgIH1cbiAgICBhY3RpdmF0ZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmFkZFRleHRFZGl0b3JDb21tYW5kKFwib21uaXNoYXJwLWF0b206bmF2aWdhdGUtdXBcIiwgKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMubmF2aWdhdGVVcCgpO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5hZGRUZXh0RWRpdG9yQ29tbWFuZChcIm9tbmlzaGFycC1hdG9tOm5hdmlnYXRlLWRvd25cIiwgKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMubmF2aWdhdGVEb3duKCk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmxpc3RlbmVyLm5hdmlnYXRldXAuc3Vic2NyaWJlKChkYXRhKSA9PiB0aGlzLm5hdmlnYXRlVG8oZGF0YS5yZXNwb25zZSkpKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmxpc3RlbmVyLm5hdmlnYXRlZG93bi5zdWJzY3JpYmUoKGRhdGEpID0+IHRoaXMubmF2aWdhdGVUbyhkYXRhLnJlc3BvbnNlKSkpO1xuICAgIH1cbiAgICBkaXNwb3NlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgIH1cbiAgICBuYXZpZ2F0ZVVwKCkge1xuICAgICAgICBPbW5pLnJlcXVlc3Qoc29sdXRpb24gPT4gc29sdXRpb24ubmF2aWdhdGV1cCh7fSkpO1xuICAgIH1cbiAgICBuYXZpZ2F0ZURvd24oKSB7XG4gICAgICAgIE9tbmkucmVxdWVzdChzb2x1dGlvbiA9PiBzb2x1dGlvbi5uYXZpZ2F0ZWRvd24oe30pKTtcbiAgICB9XG4gICAgbmF2aWdhdGVUbyhkYXRhKSB7XG4gICAgICAgIGNvbnN0IGVkaXRvciA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKTtcbiAgICAgICAgT21uaS5uYXZpZ2F0ZVRvKHsgRmlsZU5hbWU6IGVkaXRvci5nZXRVUkkoKSwgTGluZTogZGF0YS5MaW5lLCBDb2x1bW46IGRhdGEuQ29sdW1uIH0pO1xuICAgIH1cbn1cbmV4cG9ydCBjb25zdCBuYXZpZ2F0ZSA9IG5ldyBOYXZpZ2F0ZTtcbiIsImltcG9ydCB7TW9kZWxzfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xyXG5pbXBvcnQge0NvbXBvc2l0ZURpc3Bvc2FibGV9IGZyb20gXCJ0cy1kaXNwb3NhYmxlc1wiO1xyXG5pbXBvcnQge09tbml9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xyXG5cclxuY2xhc3MgTmF2aWdhdGUgaW1wbGVtZW50cyBJRmVhdHVyZSB7XHJcbiAgICBwcml2YXRlIGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XHJcblxyXG4gICAgcHVibGljIGFjdGl2YXRlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5hZGRUZXh0RWRpdG9yQ29tbWFuZChcIm9tbmlzaGFycC1hdG9tOm5hdmlnYXRlLXVwXCIsICgpID0+IHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubmF2aWdhdGVVcCgpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmFkZFRleHRFZGl0b3JDb21tYW5kKFwib21uaXNoYXJwLWF0b206bmF2aWdhdGUtZG93blwiLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm5hdmlnYXRlRG93bigpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmxpc3RlbmVyLm5hdmlnYXRldXAuc3Vic2NyaWJlKChkYXRhKSA9PiB0aGlzLm5hdmlnYXRlVG8oZGF0YS5yZXNwb25zZSkpKTtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkubGlzdGVuZXIubmF2aWdhdGVkb3duLnN1YnNjcmliZSgoZGF0YSkgPT4gdGhpcy5uYXZpZ2F0ZVRvKGRhdGEucmVzcG9uc2UpKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgbmF2aWdhdGVVcCgpIHtcclxuICAgICAgICBPbW5pLnJlcXVlc3Qoc29sdXRpb24gPT4gc29sdXRpb24ubmF2aWdhdGV1cCh7fSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBuYXZpZ2F0ZURvd24oKSB7XHJcbiAgICAgICAgT21uaS5yZXF1ZXN0KHNvbHV0aW9uID0+IHNvbHV0aW9uLm5hdmlnYXRlZG93bih7fSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgbmF2aWdhdGVUbyhkYXRhOiBNb2RlbHMuTmF2aWdhdGVSZXNwb25zZSkge1xyXG4gICAgICAgIGNvbnN0IGVkaXRvciA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKTtcclxuICAgICAgICBPbW5pLm5hdmlnYXRlVG8oeyBGaWxlTmFtZTogZWRpdG9yLmdldFVSSSgpLCBMaW5lOiBkYXRhLkxpbmUsIENvbHVtbjogZGF0YS5Db2x1bW4gfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlcXVpcmVkID0gdHJ1ZTtcclxuICAgIHB1YmxpYyB0aXRsZSA9IFwiTmF2aWdhdGVcIjtcclxuICAgIHB1YmxpYyBkZXNjcmlwdGlvbiA9IFwiQWRkcyBzZXJ2ZXIgYmFzZWQgbmF2aWdhdGlvbiBzdXBwb3J0XCI7XHJcbn1cclxuZXhwb3J0IGNvbnN0IG5hdmlnYXRlID0gbmV3IE5hdmlnYXRlO1xyXG4iXX0=
