"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.navigate = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _omnisharpClient = require("omnisharp-client");

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

            this.disposable = new _omnisharpClient.CompositeDisposable();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9uYXZpZ2F0ZS11cC1kb3duLmpzIiwibGliL2ZlYXR1cmVzL25hdmlnYXRlLXVwLWRvd24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0FBQ0E7Ozs7SUNHQTtBQUFBLHdCQUFBOzs7QUFtQ1csYUFBQSxRQUFBLEdBQVcsSUFBWCxDQW5DWDtBQW9DVyxhQUFBLEtBQUEsR0FBUSxVQUFSLENBcENYO0FBcUNXLGFBQUEsV0FBQSxHQUFjLHNDQUFkLENBckNYO0tBQUE7Ozs7bUNBR21COzs7QUFDWCxpQkFBSyxVQUFMLEdBQWtCLDBDQUFsQixDQURXO0FBR1gsaUJBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQixXQUFLLG9CQUFMLENBQTBCLDRCQUExQixFQUF3RCxZQUFBO0FBQ3hFLHVCQUFPLE1BQUssVUFBTCxFQUFQLENBRHdFO2FBQUEsQ0FBNUUsRUFIVztBQU9YLGlCQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsV0FBSyxvQkFBTCxDQUEwQiw4QkFBMUIsRUFBMEQsWUFBQTtBQUMxRSx1QkFBTyxNQUFLLFlBQUwsRUFBUCxDQUQwRTthQUFBLENBQTlFLEVBUFc7QUFXWCxpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLFdBQUssUUFBTCxDQUFjLFVBQWQsQ0FBeUIsU0FBekIsQ0FBbUMsVUFBQyxJQUFEO3VCQUFVLE1BQUssVUFBTCxDQUFnQixLQUFLLFFBQUw7YUFBMUIsQ0FBdkQsRUFYVztBQVlYLGlCQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsV0FBSyxRQUFMLENBQWMsWUFBZCxDQUEyQixTQUEzQixDQUFxQyxVQUFDLElBQUQ7dUJBQVUsTUFBSyxVQUFMLENBQWdCLEtBQUssUUFBTDthQUExQixDQUF6RCxFQVpXOzs7O2tDQWVEO0FBQ1YsaUJBQUssVUFBTCxDQUFnQixPQUFoQixHQURVOzs7O3FDQUlHO0FBQ2IsdUJBQUssT0FBTCxDQUFhO3VCQUFZLFNBQVMsVUFBVCxDQUFvQixFQUFwQjthQUFaLENBQWIsQ0FEYTs7Ozt1Q0FJRTtBQUNmLHVCQUFLLE9BQUwsQ0FBYTt1QkFBWSxTQUFTLFlBQVQsQ0FBc0IsRUFBdEI7YUFBWixDQUFiLENBRGU7Ozs7bUNBSUEsTUFBNkI7QUFDNUMsZ0JBQU0sU0FBUyxLQUFLLFNBQUwsQ0FBZSxtQkFBZixFQUFULENBRHNDO0FBRTVDLHVCQUFLLFVBQUwsQ0FBZ0IsRUFBRSxVQUFVLE9BQU8sTUFBUCxFQUFWLEVBQTJCLE1BQU0sS0FBSyxJQUFMLEVBQVcsUUFBUSxLQUFLLE1BQUwsRUFBdEUsRUFGNEM7Ozs7Ozs7QUFTN0MsSUFBTSw4QkFBVyxJQUFJLFFBQUosRUFBWCIsImZpbGUiOiJsaWIvZmVhdHVyZXMvbmF2aWdhdGUtdXAtZG93bi5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUgfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xuaW1wb3J0IHsgT21uaSB9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xuY2xhc3MgTmF2aWdhdGUge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLnJlcXVpcmVkID0gdHJ1ZTtcbiAgICAgICAgdGhpcy50aXRsZSA9IFwiTmF2aWdhdGVcIjtcbiAgICAgICAgdGhpcy5kZXNjcmlwdGlvbiA9IFwiQWRkcyBzZXJ2ZXIgYmFzZWQgbmF2aWdhdGlvbiBzdXBwb3J0XCI7XG4gICAgfVxuICAgIGFjdGl2YXRlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuYWRkVGV4dEVkaXRvckNvbW1hbmQoXCJvbW5pc2hhcnAtYXRvbTpuYXZpZ2F0ZS11cFwiLCAoKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5uYXZpZ2F0ZVVwKCk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmFkZFRleHRFZGl0b3JDb21tYW5kKFwib21uaXNoYXJwLWF0b206bmF2aWdhdGUtZG93blwiLCAoKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5uYXZpZ2F0ZURvd24oKTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkubGlzdGVuZXIubmF2aWdhdGV1cC5zdWJzY3JpYmUoKGRhdGEpID0+IHRoaXMubmF2aWdhdGVUbyhkYXRhLnJlc3BvbnNlKSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkubGlzdGVuZXIubmF2aWdhdGVkb3duLnN1YnNjcmliZSgoZGF0YSkgPT4gdGhpcy5uYXZpZ2F0ZVRvKGRhdGEucmVzcG9uc2UpKSk7XG4gICAgfVxuICAgIGRpc3Bvc2UoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfVxuICAgIG5hdmlnYXRlVXAoKSB7XG4gICAgICAgIE9tbmkucmVxdWVzdChzb2x1dGlvbiA9PiBzb2x1dGlvbi5uYXZpZ2F0ZXVwKHt9KSk7XG4gICAgfVxuICAgIG5hdmlnYXRlRG93bigpIHtcbiAgICAgICAgT21uaS5yZXF1ZXN0KHNvbHV0aW9uID0+IHNvbHV0aW9uLm5hdmlnYXRlZG93bih7fSkpO1xuICAgIH1cbiAgICBuYXZpZ2F0ZVRvKGRhdGEpIHtcbiAgICAgICAgY29uc3QgZWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpO1xuICAgICAgICBPbW5pLm5hdmlnYXRlVG8oeyBGaWxlTmFtZTogZWRpdG9yLmdldFVSSSgpLCBMaW5lOiBkYXRhLkxpbmUsIENvbHVtbjogZGF0YS5Db2x1bW4gfSk7XG4gICAgfVxufVxuZXhwb3J0IGNvbnN0IG5hdmlnYXRlID0gbmV3IE5hdmlnYXRlO1xuIiwiaW1wb3J0IHtNb2RlbHN9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XHJcbmltcG9ydCB7Q29tcG9zaXRlRGlzcG9zYWJsZX0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcclxuaW1wb3J0IHtPbW5pfSBmcm9tIFwiLi4vc2VydmVyL29tbmlcIjtcclxuXHJcbmNsYXNzIE5hdmlnYXRlIGltcGxlbWVudHMgSUZlYXR1cmUge1xyXG4gICAgcHJpdmF0ZSBkaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xyXG5cclxuICAgIHB1YmxpYyBhY3RpdmF0ZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuYWRkVGV4dEVkaXRvckNvbW1hbmQoXCJvbW5pc2hhcnAtYXRvbTpuYXZpZ2F0ZS11cFwiLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm5hdmlnYXRlVXAoKTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5hZGRUZXh0RWRpdG9yQ29tbWFuZChcIm9tbmlzaGFycC1hdG9tOm5hdmlnYXRlLWRvd25cIiwgKCkgPT4ge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5uYXZpZ2F0ZURvd24oKTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5saXN0ZW5lci5uYXZpZ2F0ZXVwLnN1YnNjcmliZSgoZGF0YSkgPT4gdGhpcy5uYXZpZ2F0ZVRvKGRhdGEucmVzcG9uc2UpKSk7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmxpc3RlbmVyLm5hdmlnYXRlZG93bi5zdWJzY3JpYmUoKGRhdGEpID0+IHRoaXMubmF2aWdhdGVUbyhkYXRhLnJlc3BvbnNlKSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkaXNwb3NlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIG5hdmlnYXRlVXAoKSB7XHJcbiAgICAgICAgT21uaS5yZXF1ZXN0KHNvbHV0aW9uID0+IHNvbHV0aW9uLm5hdmlnYXRldXAoe30pKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgbmF2aWdhdGVEb3duKCkge1xyXG4gICAgICAgIE9tbmkucmVxdWVzdChzb2x1dGlvbiA9PiBzb2x1dGlvbi5uYXZpZ2F0ZWRvd24oe30pKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIG5hdmlnYXRlVG8oZGF0YTogTW9kZWxzLk5hdmlnYXRlUmVzcG9uc2UpIHtcclxuICAgICAgICBjb25zdCBlZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKCk7XHJcbiAgICAgICAgT21uaS5uYXZpZ2F0ZVRvKHsgRmlsZU5hbWU6IGVkaXRvci5nZXRVUkkoKSwgTGluZTogZGF0YS5MaW5lLCBDb2x1bW46IGRhdGEuQ29sdW1uIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZXF1aXJlZCA9IHRydWU7XHJcbiAgICBwdWJsaWMgdGl0bGUgPSBcIk5hdmlnYXRlXCI7XHJcbiAgICBwdWJsaWMgZGVzY3JpcHRpb24gPSBcIkFkZHMgc2VydmVyIGJhc2VkIG5hdmlnYXRpb24gc3VwcG9ydFwiO1xyXG59XHJcbmV4cG9ydCBjb25zdCBuYXZpZ2F0ZSA9IG5ldyBOYXZpZ2F0ZTtcclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
