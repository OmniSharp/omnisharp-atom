'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.packageRestore = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _tsDisposables = require('ts-disposables');

var _omni = require('../server/omni');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var PackageRestore = function () {
    function PackageRestore() {
        _classCallCheck(this, PackageRestore);

        this.required = true;
        this.title = 'Package Restore';
        this.description = 'Initializes a package restore, when an project.json file is saved.';
    }

    _createClass(PackageRestore, [{
        key: 'activate',
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
        key: 'dispose',
        value: function dispose() {
            this.disposable.dispose();
        }
    }]);

    return PackageRestore;
}();

var packageRestore = exports.packageRestore = new PackageRestore();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9wYWNrYWdlLXJlc3RvcmUudHMiXSwibmFtZXMiOlsiUGFja2FnZVJlc3RvcmUiLCJyZXF1aXJlZCIsInRpdGxlIiwiZGVzY3JpcHRpb24iLCJkaXNwb3NhYmxlIiwiYWRkIiwiZWFjaENvbmZpZ0VkaXRvciIsImVkaXRvciIsImNkIiwiZ2V0QnVmZmVyIiwib25EaWRTYXZlIiwicmVxdWVzdCIsInNvbHV0aW9uIiwiZmlsZXNDaGFuZ2VkIiwiRmlsZU5hbWUiLCJnZXRQYXRoIiwiZGlzcG9zZSIsInBhY2thZ2VSZXN0b3JlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7QUFDQTs7OztJQUVBQSxjO0FBQUEsOEJBQUE7QUFBQTs7QUFnQlcsYUFBQUMsUUFBQSxHQUFXLElBQVg7QUFDQSxhQUFBQyxLQUFBLEdBQVEsaUJBQVI7QUFDQSxhQUFBQyxXQUFBLEdBQWMsb0VBQWQ7QUFDVjs7OzttQ0FoQmtCO0FBQ1gsaUJBQUtDLFVBQUwsR0FBa0Isd0NBQWxCO0FBQ0EsaUJBQUtBLFVBQUwsQ0FBZ0JDLEdBQWhCLENBQW9CLFdBQUtDLGdCQUFMLENBQXNCLFVBQUNDLE1BQUQsRUFBU0MsRUFBVCxFQUFXO0FBQ2pEQSxtQkFBR0gsR0FBSCxDQUFPRSxPQUFPRSxTQUFQLEdBQW1CQyxTQUFuQixDQUE2QixZQUFBO0FBQ2hDLCtCQUFLQyxPQUFMLENBQWE7QUFBQSwrQkFBWUMsU0FBU0MsWUFBVCxDQUFzQixDQUFDLEVBQUVDLFVBQVVQLE9BQU9RLE9BQVAsRUFBWixFQUFELENBQXRCLENBQVo7QUFBQSxxQkFBYjtBQUNILGlCQUZNLENBQVA7QUFHSCxhQUptQixDQUFwQjtBQUtIOzs7a0NBRWE7QUFDVixpQkFBS1gsVUFBTCxDQUFnQlksT0FBaEI7QUFDSDs7Ozs7O0FBT0UsSUFBTUMsMENBQWlCLElBQUlqQixjQUFKLEVBQXZCIiwiZmlsZSI6ImxpYi9mZWF0dXJlcy9wYWNrYWdlLXJlc3RvcmUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge0NvbXBvc2l0ZURpc3Bvc2FibGV9IGZyb20gJ3RzLWRpc3Bvc2FibGVzJztcclxuaW1wb3J0IHtPbW5pfSBmcm9tICcuLi9zZXJ2ZXIvb21uaSc7XHJcblxyXG5jbGFzcyBQYWNrYWdlUmVzdG9yZSBpbXBsZW1lbnRzIElGZWF0dXJlIHtcclxuICAgIHByaXZhdGUgZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxuXHJcbiAgICBwdWJsaWMgYWN0aXZhdGUoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuZWFjaENvbmZpZ0VkaXRvcigoZWRpdG9yLCBjZCkgPT4ge1xyXG4gICAgICAgICAgICBjZC5hZGQoZWRpdG9yLmdldEJ1ZmZlcigpLm9uRGlkU2F2ZSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBPbW5pLnJlcXVlc3Qoc29sdXRpb24gPT4gc29sdXRpb24uZmlsZXNDaGFuZ2VkKFt7IEZpbGVOYW1lOiBlZGl0b3IuZ2V0UGF0aCgpIH1dKSk7XHJcbiAgICAgICAgICAgIH0pKTtcclxuICAgICAgICB9KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVxdWlyZWQgPSB0cnVlO1xyXG4gICAgcHVibGljIHRpdGxlID0gJ1BhY2thZ2UgUmVzdG9yZSc7XHJcbiAgICBwdWJsaWMgZGVzY3JpcHRpb24gPSAnSW5pdGlhbGl6ZXMgYSBwYWNrYWdlIHJlc3RvcmUsIHdoZW4gYW4gcHJvamVjdC5qc29uIGZpbGUgaXMgc2F2ZWQuJztcclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IHBhY2thZ2VSZXN0b3JlID0gbmV3IFBhY2thZ2VSZXN0b3JlO1xyXG4iXX0=
