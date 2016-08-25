"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.reloadWorkspace = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _rxjs = require("rxjs");

var _tsDisposables = require("ts-disposables");

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

            this.disposable = new _tsDisposables.CompositeDisposable();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9yZWxvYWQtd29ya3NwYWNlLmpzIiwibGliL2ZlYXR1cmVzL3JlbG9hZC13b3Jrc3BhY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7QUNFQSxJQUFNLFVBQVUsaUJBQVcsWUFBWCxZQUFWOztJQUVOO0FBQUEsK0JBQUE7OztBQXVCVyxhQUFBLFFBQUEsR0FBVyxJQUFYLENBdkJYO0FBd0JXLGFBQUEsS0FBQSxHQUFRLGtCQUFSLENBeEJYO0FBeUJXLGFBQUEsV0FBQSxHQUFjLGdFQUFkLENBekJYO0tBQUE7Ozs7bUNBR21COzs7QUFDWCxpQkFBSyxVQUFMLEdBQWtCLHdDQUFsQixDQURXO0FBR1gsaUJBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQixLQUFLLFFBQUwsQ0FBYyxHQUFkLENBQWtCLEtBQUssS0FBTCxDQUFXLE9BQVgsQ0FBbUIsS0FBSyxTQUFMLENBQXJDLEVBQXNELGlDQUF0RCxFQUF5Rjt1QkFBTSxNQUFLLGVBQUwsR0FBdUIsU0FBdkI7YUFBTixDQUE3RyxFQUhXOzs7OzBDQU1PO0FBQ2xCLG1CQUFPLFdBQUssU0FBTCxDQUNGLE9BREUsQ0FDTSxvQkFBUTtBQUNiLHVCQUFPLGlCQUFXLElBQVgsQ0FBdUMsU0FBUyxLQUFULENBQWUsUUFBZixDQUF2QyxDQUNGLE9BREUsQ0FDTTsyQkFBSyxFQUFFLFdBQUY7aUJBQUwsQ0FETixDQUVGLFNBRkUsQ0FFUTsyQkFBUSxRQUFRLElBQVIsRUFBYyxNQUFkLENBQXFCOytCQUFLLENBQUMsQ0FBRDtxQkFBTCxDQUFyQixDQUNkLE9BRGMsQ0FDTjsrQkFBTSxTQUFTLFlBQVQsQ0FBc0IsRUFBRSxVQUFVLElBQVYsRUFBZ0IsUUFBUSxFQUFSLEVBQXhDO3FCQUFOO2lCQURGLENBRmYsQ0FEYTthQUFSLENBRGIsQ0FEa0I7Ozs7a0NBVVI7QUFDVixpQkFBSyxVQUFMLENBQWdCLE9BQWhCLEdBRFU7Ozs7Ozs7QUFTWCxJQUFNLDRDQUFrQixJQUFJLGVBQUosRUFBbEIiLCJmaWxlIjoibGliL2ZlYXR1cmVzL3JlbG9hZC13b3Jrc3BhY2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBPYnNlcnZhYmxlIH0gZnJvbSBcInJ4anNcIjtcbmltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUgfSBmcm9tIFwidHMtZGlzcG9zYWJsZXNcIjtcbmltcG9ydCB7IE9tbmkgfSBmcm9tIFwiLi4vc2VydmVyL29tbmlcIjtcbmltcG9ydCB7IGV4aXN0cyB9IGZyb20gXCJmc1wiO1xuY29uc3Qgb2V4aXN0cyA9IE9ic2VydmFibGUuYmluZENhbGxiYWNrKGV4aXN0cyk7XG5jbGFzcyBSZWxvYWRXb3Jrc3BhY2Uge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLnJlcXVpcmVkID0gdHJ1ZTtcbiAgICAgICAgdGhpcy50aXRsZSA9IFwiUmVsb2FkIFdvcmtzcGFjZVwiO1xuICAgICAgICB0aGlzLmRlc2NyaXB0aW9uID0gXCJSZWxvYWRzIHRoZSB3b3Jrc3BhY2UsIHRvIG1ha2Ugc3VyZSBhbGwgdGhlIGZpbGVzIGFyZSBpbiBzeW5jLlwiO1xuICAgIH1cbiAgICBhY3RpdmF0ZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChhdG9tLnZpZXdzLmdldFZpZXcoYXRvbS53b3Jrc3BhY2UpLCBcIm9tbmlzaGFycC1hdG9tOnJlbG9hZC13b3Jrc3BhY2VcIiwgKCkgPT4gdGhpcy5yZWxvYWRXb3Jrc3BhY2UoKS50b1Byb21pc2UoKSkpO1xuICAgIH1cbiAgICByZWxvYWRXb3Jrc3BhY2UoKSB7XG4gICAgICAgIHJldHVybiBPbW5pLnNvbHV0aW9uc1xuICAgICAgICAgICAgLmZsYXRNYXAoc29sdXRpb24gPT4ge1xuICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuZnJvbShzb2x1dGlvbi5tb2RlbC5wcm9qZWN0cylcbiAgICAgICAgICAgICAgICAuZmxhdE1hcCh4ID0+IHguc291cmNlRmlsZXMpXG4gICAgICAgICAgICAgICAgLmNvbmNhdE1hcChmaWxlID0+IG9leGlzdHMoZmlsZSkuZmlsdGVyKHggPT4gIXgpXG4gICAgICAgICAgICAgICAgLmZsYXRNYXAoKCkgPT4gc29sdXRpb24udXBkYXRlYnVmZmVyKHsgRmlsZU5hbWU6IGZpbGUsIEJ1ZmZlcjogXCJcIiB9KSkpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgZGlzcG9zZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICB9XG59XG5leHBvcnQgY29uc3QgcmVsb2FkV29ya3NwYWNlID0gbmV3IFJlbG9hZFdvcmtzcGFjZTtcbiIsImltcG9ydCB7T2JzZXJ2YWJsZX0gZnJvbSBcInJ4anNcIjtcclxuaW1wb3J0IHtDb21wb3NpdGVEaXNwb3NhYmxlfSBmcm9tIFwidHMtZGlzcG9zYWJsZXNcIjtcclxuaW1wb3J0IHtPbW5pfSBmcm9tIFwiLi4vc2VydmVyL29tbmlcIjtcclxuaW1wb3J0IHtleGlzdHN9IGZyb20gXCJmc1wiO1xyXG5pbXBvcnQge1Byb2plY3RWaWV3TW9kZWx9IGZyb20gXCIuLi9zZXJ2ZXIvcHJvamVjdC12aWV3LW1vZGVsXCI7XHJcbmNvbnN0IG9leGlzdHMgPSBPYnNlcnZhYmxlLmJpbmRDYWxsYmFjayhleGlzdHMpO1xyXG5cclxuY2xhc3MgUmVsb2FkV29ya3NwYWNlIGltcGxlbWVudHMgSUZlYXR1cmUge1xyXG4gICAgcHJpdmF0ZSBkaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xyXG5cclxuICAgIHB1YmxpYyBhY3RpdmF0ZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSksIFwib21uaXNoYXJwLWF0b206cmVsb2FkLXdvcmtzcGFjZVwiLCAoKSA9PiB0aGlzLnJlbG9hZFdvcmtzcGFjZSgpLnRvUHJvbWlzZSgpKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlbG9hZFdvcmtzcGFjZSgpIHtcclxuICAgICAgICByZXR1cm4gT21uaS5zb2x1dGlvbnNcclxuICAgICAgICAgICAgLmZsYXRNYXAoc29sdXRpb24gPT4ge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuZnJvbTxQcm9qZWN0Vmlld01vZGVsPGFueT4+KHNvbHV0aW9uLm1vZGVsLnByb2plY3RzKVxyXG4gICAgICAgICAgICAgICAgICAgIC5mbGF0TWFwKHggPT4geC5zb3VyY2VGaWxlcylcclxuICAgICAgICAgICAgICAgICAgICAuY29uY2F0TWFwKGZpbGUgPT4gb2V4aXN0cyhmaWxlKS5maWx0ZXIoeCA9PiAheClcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmZsYXRNYXAoKCkgPT4gc29sdXRpb24udXBkYXRlYnVmZmVyKHsgRmlsZU5hbWU6IGZpbGUsIEJ1ZmZlcjogXCJcIiB9KSkpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGlzcG9zZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZXF1aXJlZCA9IHRydWU7XHJcbiAgICBwdWJsaWMgdGl0bGUgPSBcIlJlbG9hZCBXb3Jrc3BhY2VcIjtcclxuICAgIHB1YmxpYyBkZXNjcmlwdGlvbiA9IFwiUmVsb2FkcyB0aGUgd29ya3NwYWNlLCB0byBtYWtlIHN1cmUgYWxsIHRoZSBmaWxlcyBhcmUgaW4gc3luYy5cIjtcclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IHJlbG9hZFdvcmtzcGFjZSA9IG5ldyBSZWxvYWRXb3Jrc3BhY2U7XHJcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
