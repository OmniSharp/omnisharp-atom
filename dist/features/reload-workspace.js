"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.reloadWorkspace = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _rxjs = require("rxjs");

var _omnisharpClient = require("omnisharp-client");

var _omni = require("../server/omni");

var _fs = require("fs");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var oexists = _rxjs.Observable.bindCallback(_fs.exists);

var ReloadWorkspace = function () {
    function ReloadWorkspace() {
        _classCallCheck(this, ReloadWorkspace);

        this.required = true;
        this.title = "Reload Workspace";
        this.description = "Reloads the workspace, to make sure all the files are in sync.";
    }

    _createClass(ReloadWorkspace, [{
        key: "activate",
        value: function activate() {
            var _this = this;

            this.disposable = new _omnisharpClient.CompositeDisposable();
            this.disposable.add(atom.commands.add(atom.views.getView(atom.workspace), "omnisharp-atom:reload-workspace", function () {
                return _this.reloadWorkspace().toPromise();
            }));
        }
    }, {
        key: "reloadWorkspace",
        value: function reloadWorkspace() {
            return _omni.Omni.solutions.flatMap(function (solution) {
                return _rxjs.Observable.from(solution.model.projects).flatMap(function (x) {
                    return x.sourceFiles;
                }).concatMap(function (file) {
                    return oexists(file).filter(function (x) {
                        return !x;
                    }).flatMap(function () {
                        return solution.updatebuffer({ FileName: file, Buffer: "" });
                    });
                });
            });
        }
    }, {
        key: "dispose",
        value: function dispose() {
            this.disposable.dispose();
        }
    }]);

    return ReloadWorkspace;
}();

var reloadWorkspace = exports.reloadWorkspace = new ReloadWorkspace();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9yZWxvYWQtd29ya3NwYWNlLmpzIiwibGliL2ZlYXR1cmVzL3JlbG9hZC13b3Jrc3BhY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7QUNFQSxJQUFNLFVBQVUsaUJBQVcsWUFBWCxZQUFWOztJQUVOO0FBQUEsK0JBQUE7OztBQXVCVyxhQUFBLFFBQUEsR0FBVyxJQUFYLENBdkJYO0FBd0JXLGFBQUEsS0FBQSxHQUFRLGtCQUFSLENBeEJYO0FBeUJXLGFBQUEsV0FBQSxHQUFjLGdFQUFkLENBekJYO0tBQUE7Ozs7bUNBR21COzs7QUFDWCxpQkFBSyxVQUFMLEdBQWtCLDBDQUFsQixDQURXO0FBR1gsaUJBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQixLQUFLLFFBQUwsQ0FBYyxHQUFkLENBQWtCLEtBQUssS0FBTCxDQUFXLE9BQVgsQ0FBbUIsS0FBSyxTQUFMLENBQXJDLEVBQXNELGlDQUF0RCxFQUF5Rjt1QkFBTSxNQUFLLGVBQUwsR0FBdUIsU0FBdkI7YUFBTixDQUE3RyxFQUhXOzs7OzBDQU1PO0FBQ2xCLG1CQUFPLFdBQUssU0FBTCxDQUNGLE9BREUsQ0FDTSxvQkFBUTtBQUNiLHVCQUFPLGlCQUFXLElBQVgsQ0FBdUMsU0FBUyxLQUFULENBQWUsUUFBZixDQUF2QyxDQUNGLE9BREUsQ0FDTTsyQkFBSyxFQUFFLFdBQUY7aUJBQUwsQ0FETixDQUVGLFNBRkUsQ0FFUTsyQkFBUSxRQUFRLElBQVIsRUFBYyxNQUFkLENBQXFCOytCQUFLLENBQUMsQ0FBRDtxQkFBTCxDQUFyQixDQUNkLE9BRGMsQ0FDTjsrQkFBTSxTQUFTLFlBQVQsQ0FBc0IsRUFBRSxVQUFVLElBQVYsRUFBZ0IsUUFBUSxFQUFSLEVBQXhDO3FCQUFOO2lCQURGLENBRmYsQ0FEYTthQUFSLENBRGIsQ0FEa0I7Ozs7a0NBVVI7QUFDVixpQkFBSyxVQUFMLENBQWdCLE9BQWhCLEdBRFU7Ozs7Ozs7QUFTWCxJQUFNLDRDQUFrQixJQUFJLGVBQUosRUFBbEIiLCJmaWxlIjoibGliL2ZlYXR1cmVzL3JlbG9hZC13b3Jrc3BhY2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBPYnNlcnZhYmxlIH0gZnJvbSBcInJ4anNcIjtcbmltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUgfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xuaW1wb3J0IHsgT21uaSB9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xuaW1wb3J0IHsgZXhpc3RzIH0gZnJvbSBcImZzXCI7XG5jb25zdCBvZXhpc3RzID0gT2JzZXJ2YWJsZS5iaW5kQ2FsbGJhY2soZXhpc3RzKTtcbmNsYXNzIFJlbG9hZFdvcmtzcGFjZSB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMucmVxdWlyZWQgPSB0cnVlO1xuICAgICAgICB0aGlzLnRpdGxlID0gXCJSZWxvYWQgV29ya3NwYWNlXCI7XG4gICAgICAgIHRoaXMuZGVzY3JpcHRpb24gPSBcIlJlbG9hZHMgdGhlIHdvcmtzcGFjZSwgdG8gbWFrZSBzdXJlIGFsbCB0aGUgZmlsZXMgYXJlIGluIHN5bmMuXCI7XG4gICAgfVxuICAgIGFjdGl2YXRlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSksIFwib21uaXNoYXJwLWF0b206cmVsb2FkLXdvcmtzcGFjZVwiLCAoKSA9PiB0aGlzLnJlbG9hZFdvcmtzcGFjZSgpLnRvUHJvbWlzZSgpKSk7XG4gICAgfVxuICAgIHJlbG9hZFdvcmtzcGFjZSgpIHtcbiAgICAgICAgcmV0dXJuIE9tbmkuc29sdXRpb25zXG4gICAgICAgICAgICAuZmxhdE1hcChzb2x1dGlvbiA9PiB7XG4gICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5mcm9tKHNvbHV0aW9uLm1vZGVsLnByb2plY3RzKVxuICAgICAgICAgICAgICAgIC5mbGF0TWFwKHggPT4geC5zb3VyY2VGaWxlcylcbiAgICAgICAgICAgICAgICAuY29uY2F0TWFwKGZpbGUgPT4gb2V4aXN0cyhmaWxlKS5maWx0ZXIoeCA9PiAheClcbiAgICAgICAgICAgICAgICAuZmxhdE1hcCgoKSA9PiBzb2x1dGlvbi51cGRhdGVidWZmZXIoeyBGaWxlTmFtZTogZmlsZSwgQnVmZmVyOiBcIlwiIH0pKSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBkaXNwb3NlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgIH1cbn1cbmV4cG9ydCBjb25zdCByZWxvYWRXb3Jrc3BhY2UgPSBuZXcgUmVsb2FkV29ya3NwYWNlO1xuIiwiaW1wb3J0IHtPYnNlcnZhYmxlfSBmcm9tIFwicnhqc1wiO1xyXG5pbXBvcnQge0NvbXBvc2l0ZURpc3Bvc2FibGV9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XHJcbmltcG9ydCB7T21uaX0gZnJvbSBcIi4uL3NlcnZlci9vbW5pXCI7XHJcbmltcG9ydCB7ZXhpc3RzfSBmcm9tIFwiZnNcIjtcclxuaW1wb3J0IHtQcm9qZWN0Vmlld01vZGVsfSBmcm9tIFwiLi4vc2VydmVyL3Byb2plY3Qtdmlldy1tb2RlbFwiO1xyXG5jb25zdCBvZXhpc3RzID0gT2JzZXJ2YWJsZS5iaW5kQ2FsbGJhY2soZXhpc3RzKTtcclxuXHJcbmNsYXNzIFJlbG9hZFdvcmtzcGFjZSBpbXBsZW1lbnRzIElGZWF0dXJlIHtcclxuICAgIHByaXZhdGUgZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxuXHJcbiAgICBwdWJsaWMgYWN0aXZhdGUoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChhdG9tLnZpZXdzLmdldFZpZXcoYXRvbS53b3Jrc3BhY2UpLCBcIm9tbmlzaGFycC1hdG9tOnJlbG9hZC13b3Jrc3BhY2VcIiwgKCkgPT4gdGhpcy5yZWxvYWRXb3Jrc3BhY2UoKS50b1Byb21pc2UoKSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZWxvYWRXb3Jrc3BhY2UoKSB7XHJcbiAgICAgICAgcmV0dXJuIE9tbmkuc29sdXRpb25zXHJcbiAgICAgICAgICAgIC5mbGF0TWFwKHNvbHV0aW9uID0+IHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmZyb208UHJvamVjdFZpZXdNb2RlbDxhbnk+Pihzb2x1dGlvbi5tb2RlbC5wcm9qZWN0cylcclxuICAgICAgICAgICAgICAgICAgICAuZmxhdE1hcCh4ID0+IHguc291cmNlRmlsZXMpXHJcbiAgICAgICAgICAgICAgICAgICAgLmNvbmNhdE1hcChmaWxlID0+IG9leGlzdHMoZmlsZSkuZmlsdGVyKHggPT4gIXgpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5mbGF0TWFwKCgpID0+IHNvbHV0aW9uLnVwZGF0ZWJ1ZmZlcih7IEZpbGVOYW1lOiBmaWxlLCBCdWZmZXI6IFwiXCIgfSkpKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVxdWlyZWQgPSB0cnVlO1xyXG4gICAgcHVibGljIHRpdGxlID0gXCJSZWxvYWQgV29ya3NwYWNlXCI7XHJcbiAgICBwdWJsaWMgZGVzY3JpcHRpb24gPSBcIlJlbG9hZHMgdGhlIHdvcmtzcGFjZSwgdG8gbWFrZSBzdXJlIGFsbCB0aGUgZmlsZXMgYXJlIGluIHN5bmMuXCI7XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCByZWxvYWRXb3Jrc3BhY2UgPSBuZXcgUmVsb2FkV29ya3NwYWNlO1xyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
