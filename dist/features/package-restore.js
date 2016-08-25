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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9wYWNrYWdlLXJlc3RvcmUuanMiLCJsaWIvZmVhdHVyZXMvcGFja2FnZS1yZXN0b3JlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQUNBOzs7O0lDRUE7QUFBQSw4QkFBQTs7O0FBZ0JXLGFBQUEsUUFBQSxHQUFXLElBQVgsQ0FoQlg7QUFpQlcsYUFBQSxLQUFBLEdBQVEsaUJBQVIsQ0FqQlg7QUFrQlcsYUFBQSxXQUFBLEdBQWMsb0VBQWQsQ0FsQlg7S0FBQTs7OzttQ0FHbUI7QUFDWCxpQkFBSyxVQUFMLEdBQWtCLHdDQUFsQixDQURXO0FBRVgsaUJBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQixXQUFLLGdCQUFMLENBQXNCLFVBQUMsTUFBRCxFQUFTLEVBQVQsRUFBVztBQUNqRCxtQkFBRyxHQUFILENBQU8sT0FBTyxTQUFQLEdBQW1CLFNBQW5CLENBQTZCLFlBQUE7QUFDaEMsK0JBQUssT0FBTCxDQUFhOytCQUFZLFNBQVMsWUFBVCxDQUFzQixDQUFDLEVBQUUsVUFBVSxPQUFPLE9BQVAsRUFBVixFQUFILENBQXRCO3FCQUFaLENBQWIsQ0FEZ0M7aUJBQUEsQ0FBcEMsRUFEaUQ7YUFBWCxDQUExQyxFQUZXOzs7O2tDQVNEO0FBQ1YsaUJBQUssVUFBTCxDQUFnQixPQUFoQixHQURVOzs7Ozs7O0FBU1gsSUFBTSwwQ0FBaUIsSUFBSSxjQUFKLEVBQWpCIiwiZmlsZSI6ImxpYi9mZWF0dXJlcy9wYWNrYWdlLXJlc3RvcmUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlIH0gZnJvbSBcInRzLWRpc3Bvc2FibGVzXCI7XG5pbXBvcnQgeyBPbW5pIH0gZnJvbSBcIi4uL3NlcnZlci9vbW5pXCI7XG5jbGFzcyBQYWNrYWdlUmVzdG9yZSB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMucmVxdWlyZWQgPSB0cnVlO1xuICAgICAgICB0aGlzLnRpdGxlID0gXCJQYWNrYWdlIFJlc3RvcmVcIjtcbiAgICAgICAgdGhpcy5kZXNjcmlwdGlvbiA9IFwiSW5pdGlhbGl6ZXMgYSBwYWNrYWdlIHJlc3RvcmUsIHdoZW4gYW4gcHJvamVjdC5qc29uIGZpbGUgaXMgc2F2ZWQuXCI7XG4gICAgfVxuICAgIGFjdGl2YXRlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuZWFjaENvbmZpZ0VkaXRvcigoZWRpdG9yLCBjZCkgPT4ge1xuICAgICAgICAgICAgY2QuYWRkKGVkaXRvci5nZXRCdWZmZXIoKS5vbkRpZFNhdmUoKCkgPT4ge1xuICAgICAgICAgICAgICAgIE9tbmkucmVxdWVzdChzb2x1dGlvbiA9PiBzb2x1dGlvbi5maWxlc0NoYW5nZWQoW3sgRmlsZU5hbWU6IGVkaXRvci5nZXRQYXRoKCkgfV0pKTtcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfSkpO1xuICAgIH1cbiAgICBkaXNwb3NlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgIH1cbn1cbmV4cG9ydCBjb25zdCBwYWNrYWdlUmVzdG9yZSA9IG5ldyBQYWNrYWdlUmVzdG9yZTtcbiIsImltcG9ydCB7Q29tcG9zaXRlRGlzcG9zYWJsZX0gZnJvbSBcInRzLWRpc3Bvc2FibGVzXCI7XHJcbmltcG9ydCB7T21uaX0gZnJvbSBcIi4uL3NlcnZlci9vbW5pXCI7XHJcblxyXG5jbGFzcyBQYWNrYWdlUmVzdG9yZSBpbXBsZW1lbnRzIElGZWF0dXJlIHtcclxuICAgIHByaXZhdGUgZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxuXHJcbiAgICBwdWJsaWMgYWN0aXZhdGUoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuZWFjaENvbmZpZ0VkaXRvcigoZWRpdG9yLCBjZCkgPT4ge1xyXG4gICAgICAgICAgICBjZC5hZGQoZWRpdG9yLmdldEJ1ZmZlcigpLm9uRGlkU2F2ZSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBPbW5pLnJlcXVlc3Qoc29sdXRpb24gPT4gc29sdXRpb24uZmlsZXNDaGFuZ2VkKFt7IEZpbGVOYW1lOiBlZGl0b3IuZ2V0UGF0aCgpIH1dKSk7XHJcbiAgICAgICAgICAgIH0pKTtcclxuICAgICAgICB9KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVxdWlyZWQgPSB0cnVlO1xyXG4gICAgcHVibGljIHRpdGxlID0gXCJQYWNrYWdlIFJlc3RvcmVcIjtcclxuICAgIHB1YmxpYyBkZXNjcmlwdGlvbiA9IFwiSW5pdGlhbGl6ZXMgYSBwYWNrYWdlIHJlc3RvcmUsIHdoZW4gYW4gcHJvamVjdC5qc29uIGZpbGUgaXMgc2F2ZWQuXCI7XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBwYWNrYWdlUmVzdG9yZSA9IG5ldyBQYWNrYWdlUmVzdG9yZTtcclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
