'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.reloadWorkspace = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _fs = require('fs');

var _rxjs = require('rxjs');

var _tsDisposables = require('ts-disposables');

var _omni = require('../server/omni');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var oexists = _rxjs.Observable.bindCallback(_fs.exists);

var ReloadWorkspace = function () {
    function ReloadWorkspace() {
        _classCallCheck(this, ReloadWorkspace);

        this.required = true;
        this.title = 'Reload Workspace';
        this.description = 'Reloads the workspace, to make sure all the files are in sync.';
    }

    _createClass(ReloadWorkspace, [{
        key: 'activate',
        value: function activate() {
            var _this = this;

            this.disposable = new _tsDisposables.CompositeDisposable();
            this.disposable.add(atom.commands.add(atom.views.getView(atom.workspace), 'omnisharp-atom:reload-workspace', function () {
                return _this.reloadWorkspace().toPromise();
            }));
        }
    }, {
        key: 'reloadWorkspace',
        value: function reloadWorkspace() {
            return _omni.Omni.solutions.flatMap(function (solution) {
                return _rxjs.Observable.from(solution.model.projects).flatMap(function (x) {
                    return x.sourceFiles;
                }).concatMap(function (file) {
                    return oexists(file).filter(function (x) {
                        return !x;
                    }).flatMap(function () {
                        return solution.updatebuffer({ FileName: file, Buffer: '' });
                    });
                });
            });
        }
    }, {
        key: 'dispose',
        value: function dispose() {
            this.disposable.dispose();
        }
    }]);

    return ReloadWorkspace;
}();

var reloadWorkspace = exports.reloadWorkspace = new ReloadWorkspace();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9yZWxvYWQtd29ya3NwYWNlLnRzIl0sIm5hbWVzIjpbIm9leGlzdHMiLCJiaW5kQ2FsbGJhY2siLCJSZWxvYWRXb3Jrc3BhY2UiLCJyZXF1aXJlZCIsInRpdGxlIiwiZGVzY3JpcHRpb24iLCJkaXNwb3NhYmxlIiwiYWRkIiwiYXRvbSIsImNvbW1hbmRzIiwidmlld3MiLCJnZXRWaWV3Iiwid29ya3NwYWNlIiwicmVsb2FkV29ya3NwYWNlIiwidG9Qcm9taXNlIiwic29sdXRpb25zIiwiZmxhdE1hcCIsImZyb20iLCJzb2x1dGlvbiIsIm1vZGVsIiwicHJvamVjdHMiLCJ4Iiwic291cmNlRmlsZXMiLCJjb25jYXRNYXAiLCJmaWxlIiwiZmlsdGVyIiwidXBkYXRlYnVmZmVyIiwiRmlsZU5hbWUiLCJCdWZmZXIiLCJkaXNwb3NlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7QUFDQTs7OztBQUVBLElBQU1BLFVBQVUsaUJBQVdDLFlBQVgsWUFBaEI7O0lBRUFDLGU7QUFBQSwrQkFBQTtBQUFBOztBQXVCVyxhQUFBQyxRQUFBLEdBQVcsSUFBWDtBQUNBLGFBQUFDLEtBQUEsR0FBUSxrQkFBUjtBQUNBLGFBQUFDLFdBQUEsR0FBYyxnRUFBZDtBQUNWOzs7O21DQXZCa0I7QUFBQTs7QUFDWCxpQkFBS0MsVUFBTCxHQUFrQix3Q0FBbEI7QUFFQSxpQkFBS0EsVUFBTCxDQUFnQkMsR0FBaEIsQ0FBb0JDLEtBQUtDLFFBQUwsQ0FBY0YsR0FBZCxDQUFrQkMsS0FBS0UsS0FBTCxDQUFXQyxPQUFYLENBQW1CSCxLQUFLSSxTQUF4QixDQUFsQixFQUFzRCxpQ0FBdEQsRUFBeUY7QUFBQSx1QkFBTSxNQUFLQyxlQUFMLEdBQXVCQyxTQUF2QixFQUFOO0FBQUEsYUFBekYsQ0FBcEI7QUFDSDs7OzBDQUVxQjtBQUNsQixtQkFBTyxXQUFLQyxTQUFMLENBQ0ZDLE9BREUsQ0FDTSxvQkFBUTtBQUNiLHVCQUFPLGlCQUFXQyxJQUFYLENBQXVDQyxTQUFTQyxLQUFULENBQWVDLFFBQXRELEVBQ0ZKLE9BREUsQ0FDTTtBQUFBLDJCQUFLSyxFQUFFQyxXQUFQO0FBQUEsaUJBRE4sRUFFRkMsU0FGRSxDQUVRO0FBQUEsMkJBQVF2QixRQUFRd0IsSUFBUixFQUFjQyxNQUFkLENBQXFCO0FBQUEsK0JBQUssQ0FBQ0osQ0FBTjtBQUFBLHFCQUFyQixFQUNkTCxPQURjLENBQ047QUFBQSwrQkFBTUUsU0FBU1EsWUFBVCxDQUFzQixFQUFFQyxVQUFVSCxJQUFaLEVBQWtCSSxRQUFRLEVBQTFCLEVBQXRCLENBQU47QUFBQSxxQkFETSxDQUFSO0FBQUEsaUJBRlIsQ0FBUDtBQUlILGFBTkUsQ0FBUDtBQU9IOzs7a0NBRWE7QUFDVixpQkFBS3RCLFVBQUwsQ0FBZ0J1QixPQUFoQjtBQUNIOzs7Ozs7QUFPRSxJQUFNaEIsNENBQWtCLElBQUlYLGVBQUosRUFBeEIiLCJmaWxlIjoibGliL2ZlYXR1cmVzL3JlbG9hZC13b3Jrc3BhY2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge2V4aXN0c30gZnJvbSAnZnMnO1xyXG5pbXBvcnQge09ic2VydmFibGV9IGZyb20gJ3J4anMnO1xyXG5pbXBvcnQge0NvbXBvc2l0ZURpc3Bvc2FibGV9IGZyb20gJ3RzLWRpc3Bvc2FibGVzJztcclxuaW1wb3J0IHtPbW5pfSBmcm9tICcuLi9zZXJ2ZXIvb21uaSc7XHJcbmltcG9ydCB7UHJvamVjdFZpZXdNb2RlbH0gZnJvbSAnLi4vc2VydmVyL3Byb2plY3Qtdmlldy1tb2RlbCc7XHJcbmNvbnN0IG9leGlzdHMgPSBPYnNlcnZhYmxlLmJpbmRDYWxsYmFjayhleGlzdHMpO1xyXG5cclxuY2xhc3MgUmVsb2FkV29ya3NwYWNlIGltcGxlbWVudHMgSUZlYXR1cmUge1xyXG4gICAgcHJpdmF0ZSBkaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xyXG5cclxuICAgIHB1YmxpYyBhY3RpdmF0ZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSksICdvbW5pc2hhcnAtYXRvbTpyZWxvYWQtd29ya3NwYWNlJywgKCkgPT4gdGhpcy5yZWxvYWRXb3Jrc3BhY2UoKS50b1Byb21pc2UoKSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZWxvYWRXb3Jrc3BhY2UoKSB7XHJcbiAgICAgICAgcmV0dXJuIE9tbmkuc29sdXRpb25zXHJcbiAgICAgICAgICAgIC5mbGF0TWFwKHNvbHV0aW9uID0+IHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmZyb208UHJvamVjdFZpZXdNb2RlbDxhbnk+Pihzb2x1dGlvbi5tb2RlbC5wcm9qZWN0cylcclxuICAgICAgICAgICAgICAgICAgICAuZmxhdE1hcCh4ID0+IHguc291cmNlRmlsZXMpXHJcbiAgICAgICAgICAgICAgICAgICAgLmNvbmNhdE1hcChmaWxlID0+IG9leGlzdHMoZmlsZSkuZmlsdGVyKHggPT4gIXgpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5mbGF0TWFwKCgpID0+IHNvbHV0aW9uLnVwZGF0ZWJ1ZmZlcih7IEZpbGVOYW1lOiBmaWxlLCBCdWZmZXI6ICcnIH0pKSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkaXNwb3NlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlcXVpcmVkID0gdHJ1ZTtcclxuICAgIHB1YmxpYyB0aXRsZSA9ICdSZWxvYWQgV29ya3NwYWNlJztcclxuICAgIHB1YmxpYyBkZXNjcmlwdGlvbiA9ICdSZWxvYWRzIHRoZSB3b3Jrc3BhY2UsIHRvIG1ha2Ugc3VyZSBhbGwgdGhlIGZpbGVzIGFyZSBpbiBzeW5jLic7XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCByZWxvYWRXb3Jrc3BhY2UgPSBuZXcgUmVsb2FkV29ya3NwYWNlO1xyXG4iXX0=
