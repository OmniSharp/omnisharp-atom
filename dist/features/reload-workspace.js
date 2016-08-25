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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9yZWxvYWQtd29ya3NwYWNlLmpzIiwibGliL2ZlYXR1cmVzL3JlbG9hZC13b3Jrc3BhY2UudHMiXSwibmFtZXMiOlsib2V4aXN0cyIsImJpbmRDYWxsYmFjayIsIlJlbG9hZFdvcmtzcGFjZSIsInJlcXVpcmVkIiwidGl0bGUiLCJkZXNjcmlwdGlvbiIsImRpc3Bvc2FibGUiLCJhZGQiLCJhdG9tIiwiY29tbWFuZHMiLCJ2aWV3cyIsImdldFZpZXciLCJ3b3Jrc3BhY2UiLCJyZWxvYWRXb3Jrc3BhY2UiLCJ0b1Byb21pc2UiLCJzb2x1dGlvbnMiLCJmbGF0TWFwIiwiZnJvbSIsInNvbHV0aW9uIiwibW9kZWwiLCJwcm9qZWN0cyIsIngiLCJzb3VyY2VGaWxlcyIsImNvbmNhdE1hcCIsImZpbGUiLCJmaWx0ZXIiLCJ1cGRhdGVidWZmZXIiLCJGaWxlTmFtZSIsIkJ1ZmZlciIsImRpc3Bvc2UiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQUNBOztBQUNBOztBQUNBOzs7O0FDRUEsSUFBTUEsVUFBVSxpQkFBV0MsWUFBWCxZQUFoQjs7SUFFQUMsZTtBQUFBLCtCQUFBO0FBQUE7O0FBdUJXLGFBQUFDLFFBQUEsR0FBVyxJQUFYO0FBQ0EsYUFBQUMsS0FBQSxHQUFRLGtCQUFSO0FBQ0EsYUFBQUMsV0FBQSxHQUFjLGdFQUFkO0FBQ1Y7Ozs7bUNBdkJrQjtBQUFBOztBQUNYLGlCQUFLQyxVQUFMLEdBQWtCLHdDQUFsQjtBQUVBLGlCQUFLQSxVQUFMLENBQWdCQyxHQUFoQixDQUFvQkMsS0FBS0MsUUFBTCxDQUFjRixHQUFkLENBQWtCQyxLQUFLRSxLQUFMLENBQVdDLE9BQVgsQ0FBbUJILEtBQUtJLFNBQXhCLENBQWxCLEVBQXNELGlDQUF0RCxFQUF5RjtBQUFBLHVCQUFNLE1BQUtDLGVBQUwsR0FBdUJDLFNBQXZCLEVBQU47QUFBQSxhQUF6RixDQUFwQjtBQUNIOzs7MENBRXFCO0FBQ2xCLG1CQUFPLFdBQUtDLFNBQUwsQ0FDRkMsT0FERSxDQUNNLG9CQUFRO0FBQ2IsdUJBQU8saUJBQVdDLElBQVgsQ0FBdUNDLFNBQVNDLEtBQVQsQ0FBZUMsUUFBdEQsRUFDRkosT0FERSxDQUNNO0FBQUEsMkJBQUtLLEVBQUVDLFdBQVA7QUFBQSxpQkFETixFQUVGQyxTQUZFLENBRVE7QUFBQSwyQkFBUXZCLFFBQVF3QixJQUFSLEVBQWNDLE1BQWQsQ0FBcUI7QUFBQSwrQkFBSyxDQUFDSixDQUFOO0FBQUEscUJBQXJCLEVBQ2RMLE9BRGMsQ0FDTjtBQUFBLCtCQUFNRSxTQUFTUSxZQUFULENBQXNCLEVBQUVDLFVBQVVILElBQVosRUFBa0JJLFFBQVEsRUFBMUIsRUFBdEIsQ0FBTjtBQUFBLHFCQURNLENBQVI7QUFBQSxpQkFGUixDQUFQO0FBSUgsYUFORSxDQUFQO0FBT0g7OztrQ0FFYTtBQUNWLGlCQUFLdEIsVUFBTCxDQUFnQnVCLE9BQWhCO0FBQ0g7Ozs7OztBQU9FLElBQU1oQiw0Q0FBa0IsSUFBSVgsZUFBSixFQUF4QiIsImZpbGUiOiJsaWIvZmVhdHVyZXMvcmVsb2FkLXdvcmtzcGFjZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE9ic2VydmFibGUgfSBmcm9tIFwicnhqc1wiO1xuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSB9IGZyb20gXCJ0cy1kaXNwb3NhYmxlc1wiO1xuaW1wb3J0IHsgT21uaSB9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xuaW1wb3J0IHsgZXhpc3RzIH0gZnJvbSBcImZzXCI7XG5jb25zdCBvZXhpc3RzID0gT2JzZXJ2YWJsZS5iaW5kQ2FsbGJhY2soZXhpc3RzKTtcbmNsYXNzIFJlbG9hZFdvcmtzcGFjZSB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMucmVxdWlyZWQgPSB0cnVlO1xuICAgICAgICB0aGlzLnRpdGxlID0gXCJSZWxvYWQgV29ya3NwYWNlXCI7XG4gICAgICAgIHRoaXMuZGVzY3JpcHRpb24gPSBcIlJlbG9hZHMgdGhlIHdvcmtzcGFjZSwgdG8gbWFrZSBzdXJlIGFsbCB0aGUgZmlsZXMgYXJlIGluIHN5bmMuXCI7XG4gICAgfVxuICAgIGFjdGl2YXRlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSksIFwib21uaXNoYXJwLWF0b206cmVsb2FkLXdvcmtzcGFjZVwiLCAoKSA9PiB0aGlzLnJlbG9hZFdvcmtzcGFjZSgpLnRvUHJvbWlzZSgpKSk7XG4gICAgfVxuICAgIHJlbG9hZFdvcmtzcGFjZSgpIHtcbiAgICAgICAgcmV0dXJuIE9tbmkuc29sdXRpb25zXG4gICAgICAgICAgICAuZmxhdE1hcChzb2x1dGlvbiA9PiB7XG4gICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5mcm9tKHNvbHV0aW9uLm1vZGVsLnByb2plY3RzKVxuICAgICAgICAgICAgICAgIC5mbGF0TWFwKHggPT4geC5zb3VyY2VGaWxlcylcbiAgICAgICAgICAgICAgICAuY29uY2F0TWFwKGZpbGUgPT4gb2V4aXN0cyhmaWxlKS5maWx0ZXIoeCA9PiAheClcbiAgICAgICAgICAgICAgICAuZmxhdE1hcCgoKSA9PiBzb2x1dGlvbi51cGRhdGVidWZmZXIoeyBGaWxlTmFtZTogZmlsZSwgQnVmZmVyOiBcIlwiIH0pKSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBkaXNwb3NlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgIH1cbn1cbmV4cG9ydCBjb25zdCByZWxvYWRXb3Jrc3BhY2UgPSBuZXcgUmVsb2FkV29ya3NwYWNlO1xuIiwiaW1wb3J0IHtPYnNlcnZhYmxlfSBmcm9tIFwicnhqc1wiO1xyXG5pbXBvcnQge0NvbXBvc2l0ZURpc3Bvc2FibGV9IGZyb20gXCJ0cy1kaXNwb3NhYmxlc1wiO1xyXG5pbXBvcnQge09tbml9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xyXG5pbXBvcnQge2V4aXN0c30gZnJvbSBcImZzXCI7XHJcbmltcG9ydCB7UHJvamVjdFZpZXdNb2RlbH0gZnJvbSBcIi4uL3NlcnZlci9wcm9qZWN0LXZpZXctbW9kZWxcIjtcclxuY29uc3Qgb2V4aXN0cyA9IE9ic2VydmFibGUuYmluZENhbGxiYWNrKGV4aXN0cyk7XHJcblxyXG5jbGFzcyBSZWxvYWRXb3Jrc3BhY2UgaW1wbGVtZW50cyBJRmVhdHVyZSB7XHJcbiAgICBwcml2YXRlIGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XHJcblxyXG4gICAgcHVibGljIGFjdGl2YXRlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoYXRvbS52aWV3cy5nZXRWaWV3KGF0b20ud29ya3NwYWNlKSwgXCJvbW5pc2hhcnAtYXRvbTpyZWxvYWQtd29ya3NwYWNlXCIsICgpID0+IHRoaXMucmVsb2FkV29ya3NwYWNlKCkudG9Qcm9taXNlKCkpKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVsb2FkV29ya3NwYWNlKCkge1xyXG4gICAgICAgIHJldHVybiBPbW5pLnNvbHV0aW9uc1xyXG4gICAgICAgICAgICAuZmxhdE1hcChzb2x1dGlvbiA9PiB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5mcm9tPFByb2plY3RWaWV3TW9kZWw8YW55Pj4oc29sdXRpb24ubW9kZWwucHJvamVjdHMpXHJcbiAgICAgICAgICAgICAgICAgICAgLmZsYXRNYXAoeCA9PiB4LnNvdXJjZUZpbGVzKVxyXG4gICAgICAgICAgICAgICAgICAgIC5jb25jYXRNYXAoZmlsZSA9PiBvZXhpc3RzKGZpbGUpLmZpbHRlcih4ID0+ICF4KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuZmxhdE1hcCgoKSA9PiBzb2x1dGlvbi51cGRhdGVidWZmZXIoeyBGaWxlTmFtZTogZmlsZSwgQnVmZmVyOiBcIlwiIH0pKSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkaXNwb3NlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlcXVpcmVkID0gdHJ1ZTtcclxuICAgIHB1YmxpYyB0aXRsZSA9IFwiUmVsb2FkIFdvcmtzcGFjZVwiO1xyXG4gICAgcHVibGljIGRlc2NyaXB0aW9uID0gXCJSZWxvYWRzIHRoZSB3b3Jrc3BhY2UsIHRvIG1ha2Ugc3VyZSBhbGwgdGhlIGZpbGVzIGFyZSBpbiBzeW5jLlwiO1xyXG59XHJcblxyXG5leHBvcnQgY29uc3QgcmVsb2FkV29ya3NwYWNlID0gbmV3IFJlbG9hZFdvcmtzcGFjZTtcclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
