"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.intellisense = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _tsDisposables = require("ts-disposables");

var _omni = require("../server/omni");

var _lodash = require("lodash");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Intellisense = function () {
    function Intellisense() {
        _classCallCheck(this, Intellisense);

        this.required = false;
        this.default = true;
        this.title = "Intellisense";
        this.description = "Augments some of the issues with Atoms autocomplete-plus package";
    }

    _createClass(Intellisense, [{
        key: "activate",
        value: function activate() {
            this.disposable = new _tsDisposables.CompositeDisposable();
            this.disposable.add(_omni.Omni.switchActiveEditor(function (editor, cd) {
                cd.add(editor.onWillInsertText(function (event) {
                    if (event.text.length > 1) return;
                    if (event.text === ";" || event.text === ".") {
                        atom.commands.dispatch(atom.views.getView(editor), "autocomplete-plus:confirm");
                    }
                }));
                cd.add(editor.onDidInsertText(function (event) {
                    if (event.text.length > 1) return;
                    if (event.text === ".") {
                        (0, _lodash.defer)(function () {
                            return atom.commands.dispatch(atom.views.getView(editor), "autocomplete-plus:activate");
                        });
                    }
                }));
            }));
        }
    }, {
        key: "dispose",
        value: function dispose() {
            this.disposable.dispose();
        }
    }]);

    return Intellisense;
}();

var intellisense = exports.intellisense = new Intellisense();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9pbnRlbGxpc2Vuc2UuanMiLCJsaWIvZmVhdHVyZXMvaW50ZWxsaXNlbnNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQUNBOztBQUNBOzs7O0lDRUE7QUFBQSw0QkFBQTs7O0FBNkJXLGFBQUEsUUFBQSxHQUFXLEtBQVgsQ0E3Qlg7QUE4QlcsYUFBQSxPQUFBLEdBQVUsSUFBVixDQTlCWDtBQStCVyxhQUFBLEtBQUEsR0FBUSxjQUFSLENBL0JYO0FBZ0NXLGFBQUEsV0FBQSxHQUFjLGtFQUFkLENBaENYO0tBQUE7Ozs7bUNBR21CO0FBQ1gsaUJBQUssVUFBTCxHQUFrQix3Q0FBbEIsQ0FEVztBQUdYLGlCQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsV0FBSyxrQkFBTCxDQUF3QixVQUFDLE1BQUQsRUFBUyxFQUFULEVBQVc7QUFDbkQsbUJBQUcsR0FBSCxDQUFPLE9BQU8sZ0JBQVAsQ0FBd0IsaUJBQUs7QUFDaEMsd0JBQUksTUFBTSxJQUFOLENBQVcsTUFBWCxHQUFvQixDQUFwQixFQUF1QixPQUEzQjtBQUVBLHdCQUFJLE1BQU0sSUFBTixLQUFlLEdBQWYsSUFBc0IsTUFBTSxJQUFOLEtBQWUsR0FBZixFQUFvQjtBQUMxQyw2QkFBSyxRQUFMLENBQWMsUUFBZCxDQUF1QixLQUFLLEtBQUwsQ0FBVyxPQUFYLENBQW1CLE1BQW5CLENBQXZCLEVBQW1ELDJCQUFuRCxFQUQwQztxQkFBOUM7aUJBSDJCLENBQS9CLEVBRG1EO0FBU25ELG1CQUFHLEdBQUgsQ0FBTyxPQUFPLGVBQVAsQ0FBdUIsaUJBQUs7QUFDL0Isd0JBQUksTUFBTSxJQUFOLENBQVcsTUFBWCxHQUFvQixDQUFwQixFQUF1QixPQUEzQjtBQUVBLHdCQUFJLE1BQU0sSUFBTixLQUFlLEdBQWYsRUFBb0I7QUFDcEIsMkNBQU07bUNBQU0sS0FBSyxRQUFMLENBQWMsUUFBZCxDQUF1QixLQUFLLEtBQUwsQ0FBVyxPQUFYLENBQW1CLE1BQW5CLENBQXZCLEVBQW1ELDRCQUFuRDt5QkFBTixDQUFOLENBRG9CO3FCQUF4QjtpQkFIMEIsQ0FBOUIsRUFUbUQ7YUFBWCxDQUE1QyxFQUhXOzs7O2tDQXNCRDtBQUNWLGlCQUFLLFVBQUwsQ0FBZ0IsT0FBaEIsR0FEVTs7Ozs7OztBQVNYLElBQU0sc0NBQWUsSUFBSSxZQUFKLEVBQWYiLCJmaWxlIjoibGliL2ZlYXR1cmVzL2ludGVsbGlzZW5zZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUgfSBmcm9tIFwidHMtZGlzcG9zYWJsZXNcIjtcbmltcG9ydCB7IE9tbmkgfSBmcm9tIFwiLi4vc2VydmVyL29tbmlcIjtcbmltcG9ydCB7IGRlZmVyIH0gZnJvbSBcImxvZGFzaFwiO1xuY2xhc3MgSW50ZWxsaXNlbnNlIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5yZXF1aXJlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLmRlZmF1bHQgPSB0cnVlO1xuICAgICAgICB0aGlzLnRpdGxlID0gXCJJbnRlbGxpc2Vuc2VcIjtcbiAgICAgICAgdGhpcy5kZXNjcmlwdGlvbiA9IFwiQXVnbWVudHMgc29tZSBvZiB0aGUgaXNzdWVzIHdpdGggQXRvbXMgYXV0b2NvbXBsZXRlLXBsdXMgcGFja2FnZVwiO1xuICAgIH1cbiAgICBhY3RpdmF0ZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLnN3aXRjaEFjdGl2ZUVkaXRvcigoZWRpdG9yLCBjZCkgPT4ge1xuICAgICAgICAgICAgY2QuYWRkKGVkaXRvci5vbldpbGxJbnNlcnRUZXh0KGV2ZW50ID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQudGV4dC5sZW5ndGggPiAxKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LnRleHQgPT09IFwiO1wiIHx8IGV2ZW50LnRleHQgPT09IFwiLlwiKSB7XG4gICAgICAgICAgICAgICAgICAgIGF0b20uY29tbWFuZHMuZGlzcGF0Y2goYXRvbS52aWV3cy5nZXRWaWV3KGVkaXRvciksIFwiYXV0b2NvbXBsZXRlLXBsdXM6Y29uZmlybVwiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICBjZC5hZGQoZWRpdG9yLm9uRGlkSW5zZXJ0VGV4dChldmVudCA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LnRleHQubGVuZ3RoID4gMSlcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIGlmIChldmVudC50ZXh0ID09PSBcIi5cIikge1xuICAgICAgICAgICAgICAgICAgICBkZWZlcigoKSA9PiBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGF0b20udmlld3MuZ2V0VmlldyhlZGl0b3IpLCBcImF1dG9jb21wbGV0ZS1wbHVzOmFjdGl2YXRlXCIpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgIH0pKTtcbiAgICB9XG4gICAgZGlzcG9zZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICB9XG59XG5leHBvcnQgY29uc3QgaW50ZWxsaXNlbnNlID0gbmV3IEludGVsbGlzZW5zZTtcbiIsImltcG9ydCB7Q29tcG9zaXRlRGlzcG9zYWJsZX0gZnJvbSBcInRzLWRpc3Bvc2FibGVzXCI7XHJcbmltcG9ydCB7T21uaX0gZnJvbSBcIi4uL3NlcnZlci9vbW5pXCI7XHJcbmltcG9ydCB7ZGVmZXJ9IGZyb20gXCJsb2Rhc2hcIjtcclxuXHJcbmNsYXNzIEludGVsbGlzZW5zZSBpbXBsZW1lbnRzIElGZWF0dXJlIHtcclxuICAgIHByaXZhdGUgZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxuXHJcbiAgICBwdWJsaWMgYWN0aXZhdGUoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLnN3aXRjaEFjdGl2ZUVkaXRvcigoZWRpdG9yLCBjZCkgPT4ge1xyXG4gICAgICAgICAgICBjZC5hZGQoZWRpdG9yLm9uV2lsbEluc2VydFRleHQoZXZlbnQgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LnRleHQubGVuZ3RoID4gMSkgcmV0dXJuO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChldmVudC50ZXh0ID09PSBcIjtcIiB8fCBldmVudC50ZXh0ID09PSBcIi5cIikge1xyXG4gICAgICAgICAgICAgICAgICAgIGF0b20uY29tbWFuZHMuZGlzcGF0Y2goYXRvbS52aWV3cy5nZXRWaWV3KGVkaXRvciksIFwiYXV0b2NvbXBsZXRlLXBsdXM6Y29uZmlybVwiKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICAgICAgY2QuYWRkKGVkaXRvci5vbkRpZEluc2VydFRleHQoZXZlbnQgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LnRleHQubGVuZ3RoID4gMSkgcmV0dXJuO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChldmVudC50ZXh0ID09PSBcIi5cIikge1xyXG4gICAgICAgICAgICAgICAgICAgIGRlZmVyKCgpID0+IGF0b20uY29tbWFuZHMuZGlzcGF0Y2goYXRvbS52aWV3cy5nZXRWaWV3KGVkaXRvciksIFwiYXV0b2NvbXBsZXRlLXBsdXM6YWN0aXZhdGVcIikpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KSk7XHJcbiAgICAgICAgfSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkaXNwb3NlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlcXVpcmVkID0gZmFsc2U7XHJcbiAgICBwdWJsaWMgZGVmYXVsdCA9IHRydWU7XHJcbiAgICBwdWJsaWMgdGl0bGUgPSBcIkludGVsbGlzZW5zZVwiO1xyXG4gICAgcHVibGljIGRlc2NyaXB0aW9uID0gXCJBdWdtZW50cyBzb21lIG9mIHRoZSBpc3N1ZXMgd2l0aCBBdG9tcyBhdXRvY29tcGxldGUtcGx1cyBwYWNrYWdlXCI7XHJcbn1cclxuZXhwb3J0IGNvbnN0IGludGVsbGlzZW5zZSA9IG5ldyBJbnRlbGxpc2Vuc2U7XHJcbiJdfQ==
