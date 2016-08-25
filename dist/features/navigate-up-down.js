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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9uYXZpZ2F0ZS11cC1kb3duLmpzIiwibGliL2ZlYXR1cmVzL25hdmlnYXRlLXVwLWRvd24udHMiXSwibmFtZXMiOlsiTmF2aWdhdGUiLCJyZXF1aXJlZCIsInRpdGxlIiwiZGVzY3JpcHRpb24iLCJkaXNwb3NhYmxlIiwiYWRkIiwiYWRkVGV4dEVkaXRvckNvbW1hbmQiLCJuYXZpZ2F0ZVVwIiwibmF2aWdhdGVEb3duIiwibGlzdGVuZXIiLCJuYXZpZ2F0ZXVwIiwic3Vic2NyaWJlIiwiZGF0YSIsIm5hdmlnYXRlVG8iLCJyZXNwb25zZSIsIm5hdmlnYXRlZG93biIsImRpc3Bvc2UiLCJyZXF1ZXN0Iiwic29sdXRpb24iLCJlZGl0b3IiLCJhdG9tIiwid29ya3NwYWNlIiwiZ2V0QWN0aXZlVGV4dEVkaXRvciIsIkZpbGVOYW1lIiwiZ2V0VVJJIiwiTGluZSIsIkNvbHVtbiIsIm5hdmlnYXRlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7QUFDQTs7OztJQ0dBQSxRO0FBQUEsd0JBQUE7QUFBQTs7QUFtQ1csYUFBQUMsUUFBQSxHQUFXLElBQVg7QUFDQSxhQUFBQyxLQUFBLEdBQVEsVUFBUjtBQUNBLGFBQUFDLFdBQUEsR0FBYyxzQ0FBZDtBQUNWOzs7O21DQW5Da0I7QUFBQTs7QUFDWCxpQkFBS0MsVUFBTCxHQUFrQix3Q0FBbEI7QUFFQSxpQkFBS0EsVUFBTCxDQUFnQkMsR0FBaEIsQ0FBb0IsV0FBS0Msb0JBQUwsQ0FBMEIsNEJBQTFCLEVBQXdELFlBQUE7QUFDeEUsdUJBQU8sTUFBS0MsVUFBTCxFQUFQO0FBQ0gsYUFGbUIsQ0FBcEI7QUFJQSxpQkFBS0gsVUFBTCxDQUFnQkMsR0FBaEIsQ0FBb0IsV0FBS0Msb0JBQUwsQ0FBMEIsOEJBQTFCLEVBQTBELFlBQUE7QUFDMUUsdUJBQU8sTUFBS0UsWUFBTCxFQUFQO0FBQ0gsYUFGbUIsQ0FBcEI7QUFJQSxpQkFBS0osVUFBTCxDQUFnQkMsR0FBaEIsQ0FBb0IsV0FBS0ksUUFBTCxDQUFjQyxVQUFkLENBQXlCQyxTQUF6QixDQUFtQyxVQUFDQyxJQUFEO0FBQUEsdUJBQVUsTUFBS0MsVUFBTCxDQUFnQkQsS0FBS0UsUUFBckIsQ0FBVjtBQUFBLGFBQW5DLENBQXBCO0FBQ0EsaUJBQUtWLFVBQUwsQ0FBZ0JDLEdBQWhCLENBQW9CLFdBQUtJLFFBQUwsQ0FBY00sWUFBZCxDQUEyQkosU0FBM0IsQ0FBcUMsVUFBQ0MsSUFBRDtBQUFBLHVCQUFVLE1BQUtDLFVBQUwsQ0FBZ0JELEtBQUtFLFFBQXJCLENBQVY7QUFBQSxhQUFyQyxDQUFwQjtBQUNIOzs7a0NBRWE7QUFDVixpQkFBS1YsVUFBTCxDQUFnQlksT0FBaEI7QUFDSDs7O3FDQUVnQjtBQUNiLHVCQUFLQyxPQUFMLENBQWE7QUFBQSx1QkFBWUMsU0FBU1IsVUFBVCxDQUFvQixFQUFwQixDQUFaO0FBQUEsYUFBYjtBQUNIOzs7dUNBRWtCO0FBQ2YsdUJBQUtPLE9BQUwsQ0FBYTtBQUFBLHVCQUFZQyxTQUFTSCxZQUFULENBQXNCLEVBQXRCLENBQVo7QUFBQSxhQUFiO0FBQ0g7OzttQ0FFa0JILEksRUFBNkI7QUFDNUMsZ0JBQU1PLFNBQVNDLEtBQUtDLFNBQUwsQ0FBZUMsbUJBQWYsRUFBZjtBQUNBLHVCQUFLVCxVQUFMLENBQWdCLEVBQUVVLFVBQVVKLE9BQU9LLE1BQVAsRUFBWixFQUE2QkMsTUFBTWIsS0FBS2EsSUFBeEMsRUFBOENDLFFBQVFkLEtBQUtjLE1BQTNELEVBQWhCO0FBQ0g7Ozs7OztBQU1FLElBQU1DLDhCQUFXLElBQUkzQixRQUFKLEVBQWpCIiwiZmlsZSI6ImxpYi9mZWF0dXJlcy9uYXZpZ2F0ZS11cC1kb3duLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSB9IGZyb20gXCJ0cy1kaXNwb3NhYmxlc1wiO1xuaW1wb3J0IHsgT21uaSB9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xuY2xhc3MgTmF2aWdhdGUge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLnJlcXVpcmVkID0gdHJ1ZTtcbiAgICAgICAgdGhpcy50aXRsZSA9IFwiTmF2aWdhdGVcIjtcbiAgICAgICAgdGhpcy5kZXNjcmlwdGlvbiA9IFwiQWRkcyBzZXJ2ZXIgYmFzZWQgbmF2aWdhdGlvbiBzdXBwb3J0XCI7XG4gICAgfVxuICAgIGFjdGl2YXRlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuYWRkVGV4dEVkaXRvckNvbW1hbmQoXCJvbW5pc2hhcnAtYXRvbTpuYXZpZ2F0ZS11cFwiLCAoKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5uYXZpZ2F0ZVVwKCk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmFkZFRleHRFZGl0b3JDb21tYW5kKFwib21uaXNoYXJwLWF0b206bmF2aWdhdGUtZG93blwiLCAoKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5uYXZpZ2F0ZURvd24oKTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkubGlzdGVuZXIubmF2aWdhdGV1cC5zdWJzY3JpYmUoKGRhdGEpID0+IHRoaXMubmF2aWdhdGVUbyhkYXRhLnJlc3BvbnNlKSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkubGlzdGVuZXIubmF2aWdhdGVkb3duLnN1YnNjcmliZSgoZGF0YSkgPT4gdGhpcy5uYXZpZ2F0ZVRvKGRhdGEucmVzcG9uc2UpKSk7XG4gICAgfVxuICAgIGRpc3Bvc2UoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfVxuICAgIG5hdmlnYXRlVXAoKSB7XG4gICAgICAgIE9tbmkucmVxdWVzdChzb2x1dGlvbiA9PiBzb2x1dGlvbi5uYXZpZ2F0ZXVwKHt9KSk7XG4gICAgfVxuICAgIG5hdmlnYXRlRG93bigpIHtcbiAgICAgICAgT21uaS5yZXF1ZXN0KHNvbHV0aW9uID0+IHNvbHV0aW9uLm5hdmlnYXRlZG93bih7fSkpO1xuICAgIH1cbiAgICBuYXZpZ2F0ZVRvKGRhdGEpIHtcbiAgICAgICAgY29uc3QgZWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpO1xuICAgICAgICBPbW5pLm5hdmlnYXRlVG8oeyBGaWxlTmFtZTogZWRpdG9yLmdldFVSSSgpLCBMaW5lOiBkYXRhLkxpbmUsIENvbHVtbjogZGF0YS5Db2x1bW4gfSk7XG4gICAgfVxufVxuZXhwb3J0IGNvbnN0IG5hdmlnYXRlID0gbmV3IE5hdmlnYXRlO1xuIiwiaW1wb3J0IHtNb2RlbHN9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XHJcbmltcG9ydCB7Q29tcG9zaXRlRGlzcG9zYWJsZX0gZnJvbSBcInRzLWRpc3Bvc2FibGVzXCI7XHJcbmltcG9ydCB7T21uaX0gZnJvbSBcIi4uL3NlcnZlci9vbW5pXCI7XHJcblxyXG5jbGFzcyBOYXZpZ2F0ZSBpbXBsZW1lbnRzIElGZWF0dXJlIHtcclxuICAgIHByaXZhdGUgZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxuXHJcbiAgICBwdWJsaWMgYWN0aXZhdGUoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmFkZFRleHRFZGl0b3JDb21tYW5kKFwib21uaXNoYXJwLWF0b206bmF2aWdhdGUtdXBcIiwgKCkgPT4ge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5uYXZpZ2F0ZVVwKCk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuYWRkVGV4dEVkaXRvckNvbW1hbmQoXCJvbW5pc2hhcnAtYXRvbTpuYXZpZ2F0ZS1kb3duXCIsICgpID0+IHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubmF2aWdhdGVEb3duKCk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkubGlzdGVuZXIubmF2aWdhdGV1cC5zdWJzY3JpYmUoKGRhdGEpID0+IHRoaXMubmF2aWdhdGVUbyhkYXRhLnJlc3BvbnNlKSkpO1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5saXN0ZW5lci5uYXZpZ2F0ZWRvd24uc3Vic2NyaWJlKChkYXRhKSA9PiB0aGlzLm5hdmlnYXRlVG8oZGF0YS5yZXNwb25zZSkpKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGlzcG9zZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBuYXZpZ2F0ZVVwKCkge1xyXG4gICAgICAgIE9tbmkucmVxdWVzdChzb2x1dGlvbiA9PiBzb2x1dGlvbi5uYXZpZ2F0ZXVwKHt9KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIG5hdmlnYXRlRG93bigpIHtcclxuICAgICAgICBPbW5pLnJlcXVlc3Qoc29sdXRpb24gPT4gc29sdXRpb24ubmF2aWdhdGVkb3duKHt9KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBuYXZpZ2F0ZVRvKGRhdGE6IE1vZGVscy5OYXZpZ2F0ZVJlc3BvbnNlKSB7XHJcbiAgICAgICAgY29uc3QgZWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpO1xyXG4gICAgICAgIE9tbmkubmF2aWdhdGVUbyh7IEZpbGVOYW1lOiBlZGl0b3IuZ2V0VVJJKCksIExpbmU6IGRhdGEuTGluZSwgQ29sdW1uOiBkYXRhLkNvbHVtbiB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVxdWlyZWQgPSB0cnVlO1xyXG4gICAgcHVibGljIHRpdGxlID0gXCJOYXZpZ2F0ZVwiO1xyXG4gICAgcHVibGljIGRlc2NyaXB0aW9uID0gXCJBZGRzIHNlcnZlciBiYXNlZCBuYXZpZ2F0aW9uIHN1cHBvcnRcIjtcclxufVxyXG5leHBvcnQgY29uc3QgbmF2aWdhdGUgPSBuZXcgTmF2aWdhdGU7XHJcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
