"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.packageRestore = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _tsDisposables = require("ts-disposables");

var _omni = require("../server/omni");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var PackageRestore = function () {
    function PackageRestore() {
        _classCallCheck(this, PackageRestore);

        this.required = true;
        this.title = "Package Restore";
        this.description = "Initializes a package restore, when an project.json file is saved.";
    }

    _createClass(PackageRestore, [{
        key: "activate",
        value: function activate() {
            this.disposable = new _tsDisposables.CompositeDisposable();
            this.disposable.add(_omni.Omni.eachConfigEditor(function (editor, cd) {
                cd.add(editor.getBuffer().onDidSave(function () {
                    _omni.Omni.request(function (solution) {
                        return solution.filesChanged([{ FileName: editor.getPath() }]);
                    });
                }));
            }));
        }
    }, {
        key: "dispose",
        value: function dispose() {
            this.disposable.dispose();
        }
    }]);

    return PackageRestore;
}();

var packageRestore = exports.packageRestore = new PackageRestore();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9wYWNrYWdlLXJlc3RvcmUuanMiLCJsaWIvZmVhdHVyZXMvcGFja2FnZS1yZXN0b3JlLnRzIl0sIm5hbWVzIjpbIlBhY2thZ2VSZXN0b3JlIiwicmVxdWlyZWQiLCJ0aXRsZSIsImRlc2NyaXB0aW9uIiwiZGlzcG9zYWJsZSIsImFkZCIsImVhY2hDb25maWdFZGl0b3IiLCJlZGl0b3IiLCJjZCIsImdldEJ1ZmZlciIsIm9uRGlkU2F2ZSIsInJlcXVlc3QiLCJzb2x1dGlvbiIsImZpbGVzQ2hhbmdlZCIsIkZpbGVOYW1lIiwiZ2V0UGF0aCIsImRpc3Bvc2UiLCJwYWNrYWdlUmVzdG9yZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0FBQ0E7Ozs7SUNFQUEsYztBQUFBLDhCQUFBO0FBQUE7O0FBZ0JXLGFBQUFDLFFBQUEsR0FBVyxJQUFYO0FBQ0EsYUFBQUMsS0FBQSxHQUFRLGlCQUFSO0FBQ0EsYUFBQUMsV0FBQSxHQUFjLG9FQUFkO0FBQ1Y7Ozs7bUNBaEJrQjtBQUNYLGlCQUFLQyxVQUFMLEdBQWtCLHdDQUFsQjtBQUNBLGlCQUFLQSxVQUFMLENBQWdCQyxHQUFoQixDQUFvQixXQUFLQyxnQkFBTCxDQUFzQixVQUFDQyxNQUFELEVBQVNDLEVBQVQsRUFBVztBQUNqREEsbUJBQUdILEdBQUgsQ0FBT0UsT0FBT0UsU0FBUCxHQUFtQkMsU0FBbkIsQ0FBNkIsWUFBQTtBQUNoQywrQkFBS0MsT0FBTCxDQUFhO0FBQUEsK0JBQVlDLFNBQVNDLFlBQVQsQ0FBc0IsQ0FBQyxFQUFFQyxVQUFVUCxPQUFPUSxPQUFQLEVBQVosRUFBRCxDQUF0QixDQUFaO0FBQUEscUJBQWI7QUFDSCxpQkFGTSxDQUFQO0FBR0gsYUFKbUIsQ0FBcEI7QUFLSDs7O2tDQUVhO0FBQ1YsaUJBQUtYLFVBQUwsQ0FBZ0JZLE9BQWhCO0FBQ0g7Ozs7OztBQU9FLElBQU1DLDBDQUFpQixJQUFJakIsY0FBSixFQUF2QiIsImZpbGUiOiJsaWIvZmVhdHVyZXMvcGFja2FnZS1yZXN0b3JlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSB9IGZyb20gXCJ0cy1kaXNwb3NhYmxlc1wiO1xuaW1wb3J0IHsgT21uaSB9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xuY2xhc3MgUGFja2FnZVJlc3RvcmUge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLnJlcXVpcmVkID0gdHJ1ZTtcbiAgICAgICAgdGhpcy50aXRsZSA9IFwiUGFja2FnZSBSZXN0b3JlXCI7XG4gICAgICAgIHRoaXMuZGVzY3JpcHRpb24gPSBcIkluaXRpYWxpemVzIGEgcGFja2FnZSByZXN0b3JlLCB3aGVuIGFuIHByb2plY3QuanNvbiBmaWxlIGlzIHNhdmVkLlwiO1xuICAgIH1cbiAgICBhY3RpdmF0ZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmVhY2hDb25maWdFZGl0b3IoKGVkaXRvciwgY2QpID0+IHtcbiAgICAgICAgICAgIGNkLmFkZChlZGl0b3IuZ2V0QnVmZmVyKCkub25EaWRTYXZlKCgpID0+IHtcbiAgICAgICAgICAgICAgICBPbW5pLnJlcXVlc3Qoc29sdXRpb24gPT4gc29sdXRpb24uZmlsZXNDaGFuZ2VkKFt7IEZpbGVOYW1lOiBlZGl0b3IuZ2V0UGF0aCgpIH1dKSk7XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgIH0pKTtcbiAgICB9XG4gICAgZGlzcG9zZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICB9XG59XG5leHBvcnQgY29uc3QgcGFja2FnZVJlc3RvcmUgPSBuZXcgUGFja2FnZVJlc3RvcmU7XG4iLCJpbXBvcnQge0NvbXBvc2l0ZURpc3Bvc2FibGV9IGZyb20gXCJ0cy1kaXNwb3NhYmxlc1wiO1xyXG5pbXBvcnQge09tbml9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xyXG5cclxuY2xhc3MgUGFja2FnZVJlc3RvcmUgaW1wbGVtZW50cyBJRmVhdHVyZSB7XHJcbiAgICBwcml2YXRlIGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XHJcblxyXG4gICAgcHVibGljIGFjdGl2YXRlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmVhY2hDb25maWdFZGl0b3IoKGVkaXRvciwgY2QpID0+IHtcclxuICAgICAgICAgICAgY2QuYWRkKGVkaXRvci5nZXRCdWZmZXIoKS5vbkRpZFNhdmUoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgT21uaS5yZXF1ZXN0KHNvbHV0aW9uID0+IHNvbHV0aW9uLmZpbGVzQ2hhbmdlZChbeyBGaWxlTmFtZTogZWRpdG9yLmdldFBhdGgoKSB9XSkpO1xyXG4gICAgICAgICAgICB9KSk7XHJcbiAgICAgICAgfSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkaXNwb3NlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlcXVpcmVkID0gdHJ1ZTtcclxuICAgIHB1YmxpYyB0aXRsZSA9IFwiUGFja2FnZSBSZXN0b3JlXCI7XHJcbiAgICBwdWJsaWMgZGVzY3JpcHRpb24gPSBcIkluaXRpYWxpemVzIGEgcGFja2FnZSByZXN0b3JlLCB3aGVuIGFuIHByb2plY3QuanNvbiBmaWxlIGlzIHNhdmVkLlwiO1xyXG59XHJcblxyXG5leHBvcnQgY29uc3QgcGFja2FnZVJlc3RvcmUgPSBuZXcgUGFja2FnZVJlc3RvcmU7XHJcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
