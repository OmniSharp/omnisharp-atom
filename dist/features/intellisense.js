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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9pbnRlbGxpc2Vuc2UuanMiLCJsaWIvZmVhdHVyZXMvaW50ZWxsaXNlbnNlLnRzIl0sIm5hbWVzIjpbIkludGVsbGlzZW5zZSIsInJlcXVpcmVkIiwiZGVmYXVsdCIsInRpdGxlIiwiZGVzY3JpcHRpb24iLCJkaXNwb3NhYmxlIiwiYWRkIiwic3dpdGNoQWN0aXZlRWRpdG9yIiwiZWRpdG9yIiwiY2QiLCJvbldpbGxJbnNlcnRUZXh0IiwiZXZlbnQiLCJ0ZXh0IiwibGVuZ3RoIiwiYXRvbSIsImNvbW1hbmRzIiwiZGlzcGF0Y2giLCJ2aWV3cyIsImdldFZpZXciLCJvbkRpZEluc2VydFRleHQiLCJkaXNwb3NlIiwiaW50ZWxsaXNlbnNlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7OztJQ0VBQSxZO0FBQUEsNEJBQUE7QUFBQTs7QUE2QlcsYUFBQUMsUUFBQSxHQUFXLEtBQVg7QUFDQSxhQUFBQyxPQUFBLEdBQVUsSUFBVjtBQUNBLGFBQUFDLEtBQUEsR0FBUSxjQUFSO0FBQ0EsYUFBQUMsV0FBQSxHQUFjLGtFQUFkO0FBQ1Y7Ozs7bUNBOUJrQjtBQUNYLGlCQUFLQyxVQUFMLEdBQWtCLHdDQUFsQjtBQUVBLGlCQUFLQSxVQUFMLENBQWdCQyxHQUFoQixDQUFvQixXQUFLQyxrQkFBTCxDQUF3QixVQUFDQyxNQUFELEVBQVNDLEVBQVQsRUFBVztBQUNuREEsbUJBQUdILEdBQUgsQ0FBT0UsT0FBT0UsZ0JBQVAsQ0FBd0IsaUJBQUs7QUFDaEMsd0JBQUlDLE1BQU1DLElBQU4sQ0FBV0MsTUFBWCxHQUFvQixDQUF4QixFQUEyQjtBQUUzQix3QkFBSUYsTUFBTUMsSUFBTixLQUFlLEdBQWYsSUFBc0JELE1BQU1DLElBQU4sS0FBZSxHQUF6QyxFQUE4QztBQUMxQ0UsNkJBQUtDLFFBQUwsQ0FBY0MsUUFBZCxDQUF1QkYsS0FBS0csS0FBTCxDQUFXQyxPQUFYLENBQW1CVixNQUFuQixDQUF2QixFQUFtRCwyQkFBbkQ7QUFDSDtBQUNKLGlCQU5NLENBQVA7QUFRQUMsbUJBQUdILEdBQUgsQ0FBT0UsT0FBT1csZUFBUCxDQUF1QixpQkFBSztBQUMvQix3QkFBSVIsTUFBTUMsSUFBTixDQUFXQyxNQUFYLEdBQW9CLENBQXhCLEVBQTJCO0FBRTNCLHdCQUFJRixNQUFNQyxJQUFOLEtBQWUsR0FBbkIsRUFBd0I7QUFDcEIsMkNBQU07QUFBQSxtQ0FBTUUsS0FBS0MsUUFBTCxDQUFjQyxRQUFkLENBQXVCRixLQUFLRyxLQUFMLENBQVdDLE9BQVgsQ0FBbUJWLE1BQW5CLENBQXZCLEVBQW1ELDRCQUFuRCxDQUFOO0FBQUEseUJBQU47QUFDSDtBQUNKLGlCQU5NLENBQVA7QUFPSCxhQWhCbUIsQ0FBcEI7QUFpQkg7OztrQ0FFYTtBQUNWLGlCQUFLSCxVQUFMLENBQWdCZSxPQUFoQjtBQUNIOzs7Ozs7QUFPRSxJQUFNQyxzQ0FBZSxJQUFJckIsWUFBSixFQUFyQiIsImZpbGUiOiJsaWIvZmVhdHVyZXMvaW50ZWxsaXNlbnNlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSB9IGZyb20gXCJ0cy1kaXNwb3NhYmxlc1wiO1xuaW1wb3J0IHsgT21uaSB9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xuaW1wb3J0IHsgZGVmZXIgfSBmcm9tIFwibG9kYXNoXCI7XG5jbGFzcyBJbnRlbGxpc2Vuc2Uge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLnJlcXVpcmVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMuZGVmYXVsdCA9IHRydWU7XG4gICAgICAgIHRoaXMudGl0bGUgPSBcIkludGVsbGlzZW5zZVwiO1xuICAgICAgICB0aGlzLmRlc2NyaXB0aW9uID0gXCJBdWdtZW50cyBzb21lIG9mIHRoZSBpc3N1ZXMgd2l0aCBBdG9tcyBhdXRvY29tcGxldGUtcGx1cyBwYWNrYWdlXCI7XG4gICAgfVxuICAgIGFjdGl2YXRlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuc3dpdGNoQWN0aXZlRWRpdG9yKChlZGl0b3IsIGNkKSA9PiB7XG4gICAgICAgICAgICBjZC5hZGQoZWRpdG9yLm9uV2lsbEluc2VydFRleHQoZXZlbnQgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChldmVudC50ZXh0Lmxlbmd0aCA+IDEpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQudGV4dCA9PT0gXCI7XCIgfHwgZXZlbnQudGV4dCA9PT0gXCIuXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgYXRvbS5jb21tYW5kcy5kaXNwYXRjaChhdG9tLnZpZXdzLmdldFZpZXcoZWRpdG9yKSwgXCJhdXRvY29tcGxldGUtcGx1czpjb25maXJtXCIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIGNkLmFkZChlZGl0b3Iub25EaWRJbnNlcnRUZXh0KGV2ZW50ID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQudGV4dC5sZW5ndGggPiAxKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LnRleHQgPT09IFwiLlwiKSB7XG4gICAgICAgICAgICAgICAgICAgIGRlZmVyKCgpID0+IGF0b20uY29tbWFuZHMuZGlzcGF0Y2goYXRvbS52aWV3cy5nZXRWaWV3KGVkaXRvciksIFwiYXV0b2NvbXBsZXRlLXBsdXM6YWN0aXZhdGVcIikpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfSkpO1xuICAgIH1cbiAgICBkaXNwb3NlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgIH1cbn1cbmV4cG9ydCBjb25zdCBpbnRlbGxpc2Vuc2UgPSBuZXcgSW50ZWxsaXNlbnNlO1xuIiwiaW1wb3J0IHtDb21wb3NpdGVEaXNwb3NhYmxlfSBmcm9tIFwidHMtZGlzcG9zYWJsZXNcIjtcclxuaW1wb3J0IHtPbW5pfSBmcm9tIFwiLi4vc2VydmVyL29tbmlcIjtcclxuaW1wb3J0IHtkZWZlcn0gZnJvbSBcImxvZGFzaFwiO1xyXG5cclxuY2xhc3MgSW50ZWxsaXNlbnNlIGltcGxlbWVudHMgSUZlYXR1cmUge1xyXG4gICAgcHJpdmF0ZSBkaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xyXG5cclxuICAgIHB1YmxpYyBhY3RpdmF0ZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuc3dpdGNoQWN0aXZlRWRpdG9yKChlZGl0b3IsIGNkKSA9PiB7XHJcbiAgICAgICAgICAgIGNkLmFkZChlZGl0b3Iub25XaWxsSW5zZXJ0VGV4dChldmVudCA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQudGV4dC5sZW5ndGggPiAxKSByZXR1cm47XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LnRleHQgPT09IFwiO1wiIHx8IGV2ZW50LnRleHQgPT09IFwiLlwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYXRvbS5jb21tYW5kcy5kaXNwYXRjaChhdG9tLnZpZXdzLmdldFZpZXcoZWRpdG9yKSwgXCJhdXRvY29tcGxldGUtcGx1czpjb25maXJtXCIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgICAgICBjZC5hZGQoZWRpdG9yLm9uRGlkSW5zZXJ0VGV4dChldmVudCA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQudGV4dC5sZW5ndGggPiAxKSByZXR1cm47XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LnRleHQgPT09IFwiLlwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZGVmZXIoKCkgPT4gYXRvbS5jb21tYW5kcy5kaXNwYXRjaChhdG9tLnZpZXdzLmdldFZpZXcoZWRpdG9yKSwgXCJhdXRvY29tcGxldGUtcGx1czphY3RpdmF0ZVwiKSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pKTtcclxuICAgICAgICB9KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVxdWlyZWQgPSBmYWxzZTtcclxuICAgIHB1YmxpYyBkZWZhdWx0ID0gdHJ1ZTtcclxuICAgIHB1YmxpYyB0aXRsZSA9IFwiSW50ZWxsaXNlbnNlXCI7XHJcbiAgICBwdWJsaWMgZGVzY3JpcHRpb24gPSBcIkF1Z21lbnRzIHNvbWUgb2YgdGhlIGlzc3VlcyB3aXRoIEF0b21zIGF1dG9jb21wbGV0ZS1wbHVzIHBhY2thZ2VcIjtcclxufVxyXG5leHBvcnQgY29uc3QgaW50ZWxsaXNlbnNlID0gbmV3IEludGVsbGlzZW5zZTtcclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
