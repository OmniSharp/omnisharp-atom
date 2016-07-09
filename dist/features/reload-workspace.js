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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9yZWxvYWQtd29ya3NwYWNlLmpzIiwibGliL2ZlYXR1cmVzL3JlbG9hZC13b3Jrc3BhY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7QUNFQSxJQUFNLFVBQVUsaUJBQVcsWUFBWCxZQUFoQjs7SUFFQSxlO0FBQUEsK0JBQUE7QUFBQTs7QUF1QlcsYUFBQSxRQUFBLEdBQVcsSUFBWDtBQUNBLGFBQUEsS0FBQSxHQUFRLGtCQUFSO0FBQ0EsYUFBQSxXQUFBLEdBQWMsZ0VBQWQ7QUFDVjs7OzttQ0F2QmtCO0FBQUE7O0FBQ1gsaUJBQUssVUFBTCxHQUFrQiwwQ0FBbEI7QUFFQSxpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLEtBQUssUUFBTCxDQUFjLEdBQWQsQ0FBa0IsS0FBSyxLQUFMLENBQVcsT0FBWCxDQUFtQixLQUFLLFNBQXhCLENBQWxCLEVBQXNELGlDQUF0RCxFQUF5RjtBQUFBLHVCQUFNLE1BQUssZUFBTCxHQUF1QixTQUF2QixFQUFOO0FBQUEsYUFBekYsQ0FBcEI7QUFDSDs7OzBDQUVxQjtBQUNsQixtQkFBTyxXQUFLLFNBQUwsQ0FDRixPQURFLENBQ00sb0JBQVE7QUFDYix1QkFBTyxpQkFBVyxJQUFYLENBQXVDLFNBQVMsS0FBVCxDQUFlLFFBQXRELEVBQ0YsT0FERSxDQUNNO0FBQUEsMkJBQUssRUFBRSxXQUFQO0FBQUEsaUJBRE4sRUFFRixTQUZFLENBRVE7QUFBQSwyQkFBUSxRQUFRLElBQVIsRUFBYyxNQUFkLENBQXFCO0FBQUEsK0JBQUssQ0FBQyxDQUFOO0FBQUEscUJBQXJCLEVBQ2QsT0FEYyxDQUNOO0FBQUEsK0JBQU0sU0FBUyxZQUFULENBQXNCLEVBQUUsVUFBVSxJQUFaLEVBQWtCLFFBQVEsRUFBMUIsRUFBdEIsQ0FBTjtBQUFBLHFCQURNLENBQVI7QUFBQSxpQkFGUixDQUFQO0FBSUgsYUFORSxDQUFQO0FBT0g7OztrQ0FFYTtBQUNWLGlCQUFLLFVBQUwsQ0FBZ0IsT0FBaEI7QUFDSDs7Ozs7O0FBT0UsSUFBTSw0Q0FBa0IsSUFBSSxlQUFKLEVBQXhCIiwiZmlsZSI6ImxpYi9mZWF0dXJlcy9yZWxvYWQtd29ya3NwYWNlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgT2JzZXJ2YWJsZSB9IGZyb20gXCJyeGpzXCI7XG5pbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlIH0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcbmltcG9ydCB7IE9tbmkgfSBmcm9tIFwiLi4vc2VydmVyL29tbmlcIjtcbmltcG9ydCB7IGV4aXN0cyB9IGZyb20gXCJmc1wiO1xuY29uc3Qgb2V4aXN0cyA9IE9ic2VydmFibGUuYmluZENhbGxiYWNrKGV4aXN0cyk7XG5jbGFzcyBSZWxvYWRXb3Jrc3BhY2Uge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLnJlcXVpcmVkID0gdHJ1ZTtcbiAgICAgICAgdGhpcy50aXRsZSA9IFwiUmVsb2FkIFdvcmtzcGFjZVwiO1xuICAgICAgICB0aGlzLmRlc2NyaXB0aW9uID0gXCJSZWxvYWRzIHRoZSB3b3Jrc3BhY2UsIHRvIG1ha2Ugc3VyZSBhbGwgdGhlIGZpbGVzIGFyZSBpbiBzeW5jLlwiO1xuICAgIH1cbiAgICBhY3RpdmF0ZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChhdG9tLnZpZXdzLmdldFZpZXcoYXRvbS53b3Jrc3BhY2UpLCBcIm9tbmlzaGFycC1hdG9tOnJlbG9hZC13b3Jrc3BhY2VcIiwgKCkgPT4gdGhpcy5yZWxvYWRXb3Jrc3BhY2UoKS50b1Byb21pc2UoKSkpO1xuICAgIH1cbiAgICByZWxvYWRXb3Jrc3BhY2UoKSB7XG4gICAgICAgIHJldHVybiBPbW5pLnNvbHV0aW9uc1xuICAgICAgICAgICAgLmZsYXRNYXAoc29sdXRpb24gPT4ge1xuICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuZnJvbShzb2x1dGlvbi5tb2RlbC5wcm9qZWN0cylcbiAgICAgICAgICAgICAgICAuZmxhdE1hcCh4ID0+IHguc291cmNlRmlsZXMpXG4gICAgICAgICAgICAgICAgLmNvbmNhdE1hcChmaWxlID0+IG9leGlzdHMoZmlsZSkuZmlsdGVyKHggPT4gIXgpXG4gICAgICAgICAgICAgICAgLmZsYXRNYXAoKCkgPT4gc29sdXRpb24udXBkYXRlYnVmZmVyKHsgRmlsZU5hbWU6IGZpbGUsIEJ1ZmZlcjogXCJcIiB9KSkpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgZGlzcG9zZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICB9XG59XG5leHBvcnQgY29uc3QgcmVsb2FkV29ya3NwYWNlID0gbmV3IFJlbG9hZFdvcmtzcGFjZTtcbiIsImltcG9ydCB7T2JzZXJ2YWJsZX0gZnJvbSBcInJ4anNcIjtcclxuaW1wb3J0IHtDb21wb3NpdGVEaXNwb3NhYmxlfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xyXG5pbXBvcnQge09tbml9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xyXG5pbXBvcnQge2V4aXN0c30gZnJvbSBcImZzXCI7XHJcbmltcG9ydCB7UHJvamVjdFZpZXdNb2RlbH0gZnJvbSBcIi4uL3NlcnZlci9wcm9qZWN0LXZpZXctbW9kZWxcIjtcclxuY29uc3Qgb2V4aXN0cyA9IE9ic2VydmFibGUuYmluZENhbGxiYWNrKGV4aXN0cyk7XHJcblxyXG5jbGFzcyBSZWxvYWRXb3Jrc3BhY2UgaW1wbGVtZW50cyBJRmVhdHVyZSB7XHJcbiAgICBwcml2YXRlIGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XHJcblxyXG4gICAgcHVibGljIGFjdGl2YXRlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoYXRvbS52aWV3cy5nZXRWaWV3KGF0b20ud29ya3NwYWNlKSwgXCJvbW5pc2hhcnAtYXRvbTpyZWxvYWQtd29ya3NwYWNlXCIsICgpID0+IHRoaXMucmVsb2FkV29ya3NwYWNlKCkudG9Qcm9taXNlKCkpKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVsb2FkV29ya3NwYWNlKCkge1xyXG4gICAgICAgIHJldHVybiBPbW5pLnNvbHV0aW9uc1xyXG4gICAgICAgICAgICAuZmxhdE1hcChzb2x1dGlvbiA9PiB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5mcm9tPFByb2plY3RWaWV3TW9kZWw8YW55Pj4oc29sdXRpb24ubW9kZWwucHJvamVjdHMpXHJcbiAgICAgICAgICAgICAgICAgICAgLmZsYXRNYXAoeCA9PiB4LnNvdXJjZUZpbGVzKVxyXG4gICAgICAgICAgICAgICAgICAgIC5jb25jYXRNYXAoZmlsZSA9PiBvZXhpc3RzKGZpbGUpLmZpbHRlcih4ID0+ICF4KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuZmxhdE1hcCgoKSA9PiBzb2x1dGlvbi51cGRhdGVidWZmZXIoeyBGaWxlTmFtZTogZmlsZSwgQnVmZmVyOiBcIlwiIH0pKSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkaXNwb3NlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlcXVpcmVkID0gdHJ1ZTtcclxuICAgIHB1YmxpYyB0aXRsZSA9IFwiUmVsb2FkIFdvcmtzcGFjZVwiO1xyXG4gICAgcHVibGljIGRlc2NyaXB0aW9uID0gXCJSZWxvYWRzIHRoZSB3b3Jrc3BhY2UsIHRvIG1ha2Ugc3VyZSBhbGwgdGhlIGZpbGVzIGFyZSBpbiBzeW5jLlwiO1xyXG59XHJcblxyXG5leHBvcnQgY29uc3QgcmVsb2FkV29ya3NwYWNlID0gbmV3IFJlbG9hZFdvcmtzcGFjZTtcclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
