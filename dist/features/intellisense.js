"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.intellisense = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _omnisharpClient = require("omnisharp-client");

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
            this.disposable = new _omnisharpClient.CompositeDisposable();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9pbnRlbGxpc2Vuc2UuanMiLCJsaWIvZmVhdHVyZXMvaW50ZWxsaXNlbnNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQUNBOztBQUNBOzs7O0lDRUE7QUFBQSw0QkFBQTs7O0FBNkJXLGFBQUEsUUFBQSxHQUFXLEtBQVgsQ0E3Qlg7QUE4QlcsYUFBQSxPQUFBLEdBQVUsSUFBVixDQTlCWDtBQStCVyxhQUFBLEtBQUEsR0FBUSxjQUFSLENBL0JYO0FBZ0NXLGFBQUEsV0FBQSxHQUFjLGtFQUFkLENBaENYO0tBQUE7Ozs7bUNBR21CO0FBQ1gsaUJBQUssVUFBTCxHQUFrQiwwQ0FBbEIsQ0FEVztBQUdYLGlCQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsV0FBSyxrQkFBTCxDQUF3QixVQUFDLE1BQUQsRUFBUyxFQUFULEVBQVc7QUFDbkQsbUJBQUcsR0FBSCxDQUFPLE9BQU8sZ0JBQVAsQ0FBd0IsaUJBQUs7QUFDaEMsd0JBQUksTUFBTSxJQUFOLENBQVcsTUFBWCxHQUFvQixDQUFwQixFQUF1QixPQUEzQjtBQUVBLHdCQUFJLE1BQU0sSUFBTixLQUFlLEdBQWYsSUFBc0IsTUFBTSxJQUFOLEtBQWUsR0FBZixFQUFvQjtBQUMxQyw2QkFBSyxRQUFMLENBQWMsUUFBZCxDQUF1QixLQUFLLEtBQUwsQ0FBVyxPQUFYLENBQW1CLE1BQW5CLENBQXZCLEVBQW1ELDJCQUFuRCxFQUQwQztxQkFBOUM7aUJBSDJCLENBQS9CLEVBRG1EO0FBU25ELG1CQUFHLEdBQUgsQ0FBTyxPQUFPLGVBQVAsQ0FBdUIsaUJBQUs7QUFDL0Isd0JBQUksTUFBTSxJQUFOLENBQVcsTUFBWCxHQUFvQixDQUFwQixFQUF1QixPQUEzQjtBQUVBLHdCQUFJLE1BQU0sSUFBTixLQUFlLEdBQWYsRUFBb0I7QUFDcEIsMkNBQU07bUNBQU0sS0FBSyxRQUFMLENBQWMsUUFBZCxDQUF1QixLQUFLLEtBQUwsQ0FBVyxPQUFYLENBQW1CLE1BQW5CLENBQXZCLEVBQW1ELDRCQUFuRDt5QkFBTixDQUFOLENBRG9CO3FCQUF4QjtpQkFIMEIsQ0FBOUIsRUFUbUQ7YUFBWCxDQUE1QyxFQUhXOzs7O2tDQXNCRDtBQUNWLGlCQUFLLFVBQUwsQ0FBZ0IsT0FBaEIsR0FEVTs7Ozs7OztBQVNYLElBQU0sc0NBQWUsSUFBSSxZQUFKLEVBQWYiLCJmaWxlIjoibGliL2ZlYXR1cmVzL2ludGVsbGlzZW5zZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUgfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xuaW1wb3J0IHsgT21uaSB9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xuaW1wb3J0IHsgZGVmZXIgfSBmcm9tIFwibG9kYXNoXCI7XG5jbGFzcyBJbnRlbGxpc2Vuc2Uge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLnJlcXVpcmVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMuZGVmYXVsdCA9IHRydWU7XG4gICAgICAgIHRoaXMudGl0bGUgPSBcIkludGVsbGlzZW5zZVwiO1xuICAgICAgICB0aGlzLmRlc2NyaXB0aW9uID0gXCJBdWdtZW50cyBzb21lIG9mIHRoZSBpc3N1ZXMgd2l0aCBBdG9tcyBhdXRvY29tcGxldGUtcGx1cyBwYWNrYWdlXCI7XG4gICAgfVxuICAgIGFjdGl2YXRlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuc3dpdGNoQWN0aXZlRWRpdG9yKChlZGl0b3IsIGNkKSA9PiB7XG4gICAgICAgICAgICBjZC5hZGQoZWRpdG9yLm9uV2lsbEluc2VydFRleHQoZXZlbnQgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChldmVudC50ZXh0Lmxlbmd0aCA+IDEpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQudGV4dCA9PT0gXCI7XCIgfHwgZXZlbnQudGV4dCA9PT0gXCIuXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgYXRvbS5jb21tYW5kcy5kaXNwYXRjaChhdG9tLnZpZXdzLmdldFZpZXcoZWRpdG9yKSwgXCJhdXRvY29tcGxldGUtcGx1czpjb25maXJtXCIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIGNkLmFkZChlZGl0b3Iub25EaWRJbnNlcnRUZXh0KGV2ZW50ID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQudGV4dC5sZW5ndGggPiAxKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LnRleHQgPT09IFwiLlwiKSB7XG4gICAgICAgICAgICAgICAgICAgIGRlZmVyKCgpID0+IGF0b20uY29tbWFuZHMuZGlzcGF0Y2goYXRvbS52aWV3cy5nZXRWaWV3KGVkaXRvciksIFwiYXV0b2NvbXBsZXRlLXBsdXM6YWN0aXZhdGVcIikpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfSkpO1xuICAgIH1cbiAgICBkaXNwb3NlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgIH1cbn1cbmV4cG9ydCBjb25zdCBpbnRlbGxpc2Vuc2UgPSBuZXcgSW50ZWxsaXNlbnNlO1xuIiwiaW1wb3J0IHtDb21wb3NpdGVEaXNwb3NhYmxlfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xyXG5pbXBvcnQge09tbml9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xyXG5pbXBvcnQge2RlZmVyfSBmcm9tIFwibG9kYXNoXCI7XHJcblxyXG5jbGFzcyBJbnRlbGxpc2Vuc2UgaW1wbGVtZW50cyBJRmVhdHVyZSB7XHJcbiAgICBwcml2YXRlIGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XHJcblxyXG4gICAgcHVibGljIGFjdGl2YXRlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5zd2l0Y2hBY3RpdmVFZGl0b3IoKGVkaXRvciwgY2QpID0+IHtcclxuICAgICAgICAgICAgY2QuYWRkKGVkaXRvci5vbldpbGxJbnNlcnRUZXh0KGV2ZW50ID0+IHtcclxuICAgICAgICAgICAgICAgIGlmIChldmVudC50ZXh0Lmxlbmd0aCA+IDEpIHJldHVybjtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQudGV4dCA9PT0gXCI7XCIgfHwgZXZlbnQudGV4dCA9PT0gXCIuXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGF0b20udmlld3MuZ2V0VmlldyhlZGl0b3IpLCBcImF1dG9jb21wbGV0ZS1wbHVzOmNvbmZpcm1cIik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgICAgIGNkLmFkZChlZGl0b3Iub25EaWRJbnNlcnRUZXh0KGV2ZW50ID0+IHtcclxuICAgICAgICAgICAgICAgIGlmIChldmVudC50ZXh0Lmxlbmd0aCA+IDEpIHJldHVybjtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQudGV4dCA9PT0gXCIuXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICBkZWZlcigoKSA9PiBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGF0b20udmlld3MuZ2V0VmlldyhlZGl0b3IpLCBcImF1dG9jb21wbGV0ZS1wbHVzOmFjdGl2YXRlXCIpKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSkpO1xyXG4gICAgICAgIH0pKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGlzcG9zZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZXF1aXJlZCA9IGZhbHNlO1xyXG4gICAgcHVibGljIGRlZmF1bHQgPSB0cnVlO1xyXG4gICAgcHVibGljIHRpdGxlID0gXCJJbnRlbGxpc2Vuc2VcIjtcclxuICAgIHB1YmxpYyBkZXNjcmlwdGlvbiA9IFwiQXVnbWVudHMgc29tZSBvZiB0aGUgaXNzdWVzIHdpdGggQXRvbXMgYXV0b2NvbXBsZXRlLXBsdXMgcGFja2FnZVwiO1xyXG59XHJcbmV4cG9ydCBjb25zdCBpbnRlbGxpc2Vuc2UgPSBuZXcgSW50ZWxsaXNlbnNlO1xyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
