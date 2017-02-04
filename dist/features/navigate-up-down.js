'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.navigate = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _tsDisposables = require('ts-disposables');

var _omni = require('../server/omni');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Navigate = function () {
    function Navigate() {
        _classCallCheck(this, Navigate);

        this.required = true;
        this.title = 'Navigate';
        this.description = 'Adds server based navigation support';
    }

    _createClass(Navigate, [{
        key: 'activate',
        value: function activate() {
            var _this = this;

            this.disposable = new _tsDisposables.CompositeDisposable();
            this.disposable.add(_omni.Omni.addTextEditorCommand('omnisharp-atom:navigate-up', function () {
                return _this.navigateUp();
            }));
            this.disposable.add(_omni.Omni.addTextEditorCommand('omnisharp-atom:navigate-down', function () {
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
        key: 'dispose',
        value: function dispose() {
            this.disposable.dispose();
        }
    }, {
        key: 'navigateUp',
        value: function navigateUp() {
            _omni.Omni.request(function (solution) {
                return solution.navigateup({});
            });
        }
    }, {
        key: 'navigateDown',
        value: function navigateDown() {
            _omni.Omni.request(function (solution) {
                return solution.navigatedown({});
            });
        }
    }, {
        key: 'navigateTo',
        value: function navigateTo(data) {
            var editor = atom.workspace.getActiveTextEditor();
            _omni.Omni.navigateTo({ FileName: editor.getURI(), Line: data.Line, Column: data.Column });
        }
    }]);

    return Navigate;
}();

var navigate = exports.navigate = new Navigate();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9uYXZpZ2F0ZS11cC1kb3duLnRzIl0sIm5hbWVzIjpbIk5hdmlnYXRlIiwicmVxdWlyZWQiLCJ0aXRsZSIsImRlc2NyaXB0aW9uIiwiZGlzcG9zYWJsZSIsImFkZCIsImFkZFRleHRFZGl0b3JDb21tYW5kIiwibmF2aWdhdGVVcCIsIm5hdmlnYXRlRG93biIsImxpc3RlbmVyIiwibmF2aWdhdGV1cCIsInN1YnNjcmliZSIsIm5hdmlnYXRlVG8iLCJkYXRhIiwicmVzcG9uc2UiLCJuYXZpZ2F0ZWRvd24iLCJkaXNwb3NlIiwicmVxdWVzdCIsInNvbHV0aW9uIiwiZWRpdG9yIiwiYXRvbSIsIndvcmtzcGFjZSIsImdldEFjdGl2ZVRleHRFZGl0b3IiLCJGaWxlTmFtZSIsImdldFVSSSIsIkxpbmUiLCJDb2x1bW4iLCJuYXZpZ2F0ZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQ0E7O0FBQ0E7Ozs7SUFFQUEsUTtBQUFBLHdCQUFBO0FBQUE7O0FBbUNXLGFBQUFDLFFBQUEsR0FBVyxJQUFYO0FBQ0EsYUFBQUMsS0FBQSxHQUFRLFVBQVI7QUFDQSxhQUFBQyxXQUFBLEdBQWMsc0NBQWQ7QUFDVjs7OzttQ0FuQ2tCO0FBQUE7O0FBQ1gsaUJBQUtDLFVBQUwsR0FBa0Isd0NBQWxCO0FBRUEsaUJBQUtBLFVBQUwsQ0FBZ0JDLEdBQWhCLENBQW9CLFdBQUtDLG9CQUFMLENBQTBCLDRCQUExQixFQUF3RCxZQUFBO0FBQ3hFLHVCQUFPLE1BQUtDLFVBQUwsRUFBUDtBQUNILGFBRm1CLENBQXBCO0FBSUEsaUJBQUtILFVBQUwsQ0FBZ0JDLEdBQWhCLENBQW9CLFdBQUtDLG9CQUFMLENBQTBCLDhCQUExQixFQUEwRCxZQUFBO0FBQzFFLHVCQUFPLE1BQUtFLFlBQUwsRUFBUDtBQUNILGFBRm1CLENBQXBCO0FBSUEsaUJBQUtKLFVBQUwsQ0FBZ0JDLEdBQWhCLENBQW9CLFdBQUtJLFFBQUwsQ0FBY0MsVUFBZCxDQUF5QkMsU0FBekIsQ0FBbUM7QUFBQSx1QkFBUSxNQUFLQyxVQUFMLENBQWdCQyxLQUFLQyxRQUFyQixDQUFSO0FBQUEsYUFBbkMsQ0FBcEI7QUFDQSxpQkFBS1YsVUFBTCxDQUFnQkMsR0FBaEIsQ0FBb0IsV0FBS0ksUUFBTCxDQUFjTSxZQUFkLENBQTJCSixTQUEzQixDQUFxQztBQUFBLHVCQUFRLE1BQUtDLFVBQUwsQ0FBZ0JDLEtBQUtDLFFBQXJCLENBQVI7QUFBQSxhQUFyQyxDQUFwQjtBQUNIOzs7a0NBRWE7QUFDVixpQkFBS1YsVUFBTCxDQUFnQlksT0FBaEI7QUFDSDs7O3FDQUVnQjtBQUNiLHVCQUFLQyxPQUFMLENBQWE7QUFBQSx1QkFBWUMsU0FBU1IsVUFBVCxDQUFvQixFQUFwQixDQUFaO0FBQUEsYUFBYjtBQUNIOzs7dUNBRWtCO0FBQ2YsdUJBQUtPLE9BQUwsQ0FBYTtBQUFBLHVCQUFZQyxTQUFTSCxZQUFULENBQXNCLEVBQXRCLENBQVo7QUFBQSxhQUFiO0FBQ0g7OzttQ0FFa0JGLEksRUFBNkI7QUFDNUMsZ0JBQU1NLFNBQVNDLEtBQUtDLFNBQUwsQ0FBZUMsbUJBQWYsRUFBZjtBQUNBLHVCQUFLVixVQUFMLENBQWdCLEVBQUVXLFVBQVVKLE9BQU9LLE1BQVAsRUFBWixFQUE2QkMsTUFBTVosS0FBS1ksSUFBeEMsRUFBOENDLFFBQVFiLEtBQUthLE1BQTNELEVBQWhCO0FBQ0g7Ozs7OztBQU1FLElBQU1DLDhCQUFXLElBQUkzQixRQUFKLEVBQWpCIiwiZmlsZSI6ImxpYi9mZWF0dXJlcy9uYXZpZ2F0ZS11cC1kb3duLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtNb2RlbHN9IGZyb20gJ29tbmlzaGFycC1jbGllbnQnO1xyXG5pbXBvcnQge0NvbXBvc2l0ZURpc3Bvc2FibGV9IGZyb20gJ3RzLWRpc3Bvc2FibGVzJztcclxuaW1wb3J0IHtPbW5pfSBmcm9tICcuLi9zZXJ2ZXIvb21uaSc7XHJcblxyXG5jbGFzcyBOYXZpZ2F0ZSBpbXBsZW1lbnRzIElGZWF0dXJlIHtcclxuICAgIHByaXZhdGUgZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxuXHJcbiAgICBwdWJsaWMgYWN0aXZhdGUoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmFkZFRleHRFZGl0b3JDb21tYW5kKCdvbW5pc2hhcnAtYXRvbTpuYXZpZ2F0ZS11cCcsICgpID0+IHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubmF2aWdhdGVVcCgpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmFkZFRleHRFZGl0b3JDb21tYW5kKCdvbW5pc2hhcnAtYXRvbTpuYXZpZ2F0ZS1kb3duJywgKCkgPT4ge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5uYXZpZ2F0ZURvd24oKTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5saXN0ZW5lci5uYXZpZ2F0ZXVwLnN1YnNjcmliZShkYXRhID0+IHRoaXMubmF2aWdhdGVUbyhkYXRhLnJlc3BvbnNlKSkpO1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5saXN0ZW5lci5uYXZpZ2F0ZWRvd24uc3Vic2NyaWJlKGRhdGEgPT4gdGhpcy5uYXZpZ2F0ZVRvKGRhdGEucmVzcG9uc2UpKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgbmF2aWdhdGVVcCgpIHtcclxuICAgICAgICBPbW5pLnJlcXVlc3Qoc29sdXRpb24gPT4gc29sdXRpb24ubmF2aWdhdGV1cCh7fSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBuYXZpZ2F0ZURvd24oKSB7XHJcbiAgICAgICAgT21uaS5yZXF1ZXN0KHNvbHV0aW9uID0+IHNvbHV0aW9uLm5hdmlnYXRlZG93bih7fSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgbmF2aWdhdGVUbyhkYXRhOiBNb2RlbHMuTmF2aWdhdGVSZXNwb25zZSkge1xyXG4gICAgICAgIGNvbnN0IGVkaXRvciA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKTtcclxuICAgICAgICBPbW5pLm5hdmlnYXRlVG8oeyBGaWxlTmFtZTogZWRpdG9yLmdldFVSSSgpLCBMaW5lOiBkYXRhLkxpbmUsIENvbHVtbjogZGF0YS5Db2x1bW4gfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlcXVpcmVkID0gdHJ1ZTtcclxuICAgIHB1YmxpYyB0aXRsZSA9ICdOYXZpZ2F0ZSc7XHJcbiAgICBwdWJsaWMgZGVzY3JpcHRpb24gPSAnQWRkcyBzZXJ2ZXIgYmFzZWQgbmF2aWdhdGlvbiBzdXBwb3J0JztcclxufVxyXG5leHBvcnQgY29uc3QgbmF2aWdhdGUgPSBuZXcgTmF2aWdhdGU7XHJcbiJdfQ==
