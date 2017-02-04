'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.intellisense = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _tsDisposables = require('ts-disposables');

var _omni = require('../server/omni');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Intellisense = function () {
    function Intellisense() {
        _classCallCheck(this, Intellisense);

        this.required = false;
        this.default = true;
        this.title = 'Intellisense';
        this.description = 'Augments some of the issues with Atoms autocomplete-plus package';
    }

    _createClass(Intellisense, [{
        key: 'activate',
        value: function activate() {
            this.disposable = new _tsDisposables.CompositeDisposable();
            this.disposable.add(_omni.Omni.switchActiveEditor(function (editor, cd) {
                cd.add(editor.onWillInsertText(function (event) {
                    if (event.text.length > 1) return;
                    if (event.text === ';' || event.text === '.') {
                        atom.commands.dispatch(atom.views.getView(editor), 'autocomplete-plus:confirm');
                    }
                }));
                cd.add(editor.onDidInsertText(function (event) {
                    if (event.text.length > 1) return;
                    if (event.text === '.') {
                        (0, _lodash.defer)(function () {
                            return atom.commands.dispatch(atom.views.getView(editor), 'autocomplete-plus:activate');
                        });
                    }
                }));
            }));
        }
    }, {
        key: 'dispose',
        value: function dispose() {
            this.disposable.dispose();
        }
    }]);

    return Intellisense;
}();

var intellisense = exports.intellisense = new Intellisense();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9pbnRlbGxpc2Vuc2UudHMiXSwibmFtZXMiOlsiSW50ZWxsaXNlbnNlIiwicmVxdWlyZWQiLCJkZWZhdWx0IiwidGl0bGUiLCJkZXNjcmlwdGlvbiIsImRpc3Bvc2FibGUiLCJhZGQiLCJzd2l0Y2hBY3RpdmVFZGl0b3IiLCJlZGl0b3IiLCJjZCIsIm9uV2lsbEluc2VydFRleHQiLCJldmVudCIsInRleHQiLCJsZW5ndGgiLCJhdG9tIiwiY29tbWFuZHMiLCJkaXNwYXRjaCIsInZpZXdzIiwiZ2V0VmlldyIsIm9uRGlkSW5zZXJ0VGV4dCIsImRpc3Bvc2UiLCJpbnRlbGxpc2Vuc2UiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQUNBOztBQUNBOzs7O0lBRUFBLFk7QUFBQSw0QkFBQTtBQUFBOztBQTZCVyxhQUFBQyxRQUFBLEdBQVcsS0FBWDtBQUNBLGFBQUFDLE9BQUEsR0FBVSxJQUFWO0FBQ0EsYUFBQUMsS0FBQSxHQUFRLGNBQVI7QUFDQSxhQUFBQyxXQUFBLEdBQWMsa0VBQWQ7QUFDVjs7OzttQ0E5QmtCO0FBQ1gsaUJBQUtDLFVBQUwsR0FBa0Isd0NBQWxCO0FBRUEsaUJBQUtBLFVBQUwsQ0FBZ0JDLEdBQWhCLENBQW9CLFdBQUtDLGtCQUFMLENBQXdCLFVBQUNDLE1BQUQsRUFBU0MsRUFBVCxFQUFXO0FBQ25EQSxtQkFBR0gsR0FBSCxDQUFPRSxPQUFPRSxnQkFBUCxDQUF3QixpQkFBSztBQUNoQyx3QkFBSUMsTUFBTUMsSUFBTixDQUFXQyxNQUFYLEdBQW9CLENBQXhCLEVBQTJCO0FBRTNCLHdCQUFJRixNQUFNQyxJQUFOLEtBQWUsR0FBZixJQUFzQkQsTUFBTUMsSUFBTixLQUFlLEdBQXpDLEVBQThDO0FBQzFDRSw2QkFBS0MsUUFBTCxDQUFjQyxRQUFkLENBQXVCRixLQUFLRyxLQUFMLENBQVdDLE9BQVgsQ0FBbUJWLE1BQW5CLENBQXZCLEVBQW1ELDJCQUFuRDtBQUNIO0FBQ0osaUJBTk0sQ0FBUDtBQVFBQyxtQkFBR0gsR0FBSCxDQUFPRSxPQUFPVyxlQUFQLENBQXVCLGlCQUFLO0FBQy9CLHdCQUFJUixNQUFNQyxJQUFOLENBQVdDLE1BQVgsR0FBb0IsQ0FBeEIsRUFBMkI7QUFFM0Isd0JBQUlGLE1BQU1DLElBQU4sS0FBZSxHQUFuQixFQUF3QjtBQUNwQiwyQ0FBTTtBQUFBLG1DQUFNRSxLQUFLQyxRQUFMLENBQWNDLFFBQWQsQ0FBdUJGLEtBQUtHLEtBQUwsQ0FBV0MsT0FBWCxDQUFtQlYsTUFBbkIsQ0FBdkIsRUFBbUQsNEJBQW5ELENBQU47QUFBQSx5QkFBTjtBQUNIO0FBQ0osaUJBTk0sQ0FBUDtBQU9ILGFBaEJtQixDQUFwQjtBQWlCSDs7O2tDQUVhO0FBQ1YsaUJBQUtILFVBQUwsQ0FBZ0JlLE9BQWhCO0FBQ0g7Ozs7OztBQU9FLElBQU1DLHNDQUFlLElBQUlyQixZQUFKLEVBQXJCIiwiZmlsZSI6ImxpYi9mZWF0dXJlcy9pbnRlbGxpc2Vuc2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge2RlZmVyfSBmcm9tICdsb2Rhc2gnO1xyXG5pbXBvcnQge0NvbXBvc2l0ZURpc3Bvc2FibGV9IGZyb20gJ3RzLWRpc3Bvc2FibGVzJztcclxuaW1wb3J0IHtPbW5pfSBmcm9tICcuLi9zZXJ2ZXIvb21uaSc7XHJcblxyXG5jbGFzcyBJbnRlbGxpc2Vuc2UgaW1wbGVtZW50cyBJRmVhdHVyZSB7XHJcbiAgICBwcml2YXRlIGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XHJcblxyXG4gICAgcHVibGljIGFjdGl2YXRlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5zd2l0Y2hBY3RpdmVFZGl0b3IoKGVkaXRvciwgY2QpID0+IHtcclxuICAgICAgICAgICAgY2QuYWRkKGVkaXRvci5vbldpbGxJbnNlcnRUZXh0KGV2ZW50ID0+IHtcclxuICAgICAgICAgICAgICAgIGlmIChldmVudC50ZXh0Lmxlbmd0aCA+IDEpIHJldHVybjtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQudGV4dCA9PT0gJzsnIHx8IGV2ZW50LnRleHQgPT09ICcuJykge1xyXG4gICAgICAgICAgICAgICAgICAgIGF0b20uY29tbWFuZHMuZGlzcGF0Y2goYXRvbS52aWV3cy5nZXRWaWV3KGVkaXRvciksICdhdXRvY29tcGxldGUtcGx1czpjb25maXJtJyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgICAgIGNkLmFkZChlZGl0b3Iub25EaWRJbnNlcnRUZXh0KGV2ZW50ID0+IHtcclxuICAgICAgICAgICAgICAgIGlmIChldmVudC50ZXh0Lmxlbmd0aCA+IDEpIHJldHVybjtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQudGV4dCA9PT0gJy4nKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZGVmZXIoKCkgPT4gYXRvbS5jb21tYW5kcy5kaXNwYXRjaChhdG9tLnZpZXdzLmdldFZpZXcoZWRpdG9yKSwgJ2F1dG9jb21wbGV0ZS1wbHVzOmFjdGl2YXRlJykpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KSk7XHJcbiAgICAgICAgfSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkaXNwb3NlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlcXVpcmVkID0gZmFsc2U7XHJcbiAgICBwdWJsaWMgZGVmYXVsdCA9IHRydWU7XHJcbiAgICBwdWJsaWMgdGl0bGUgPSAnSW50ZWxsaXNlbnNlJztcclxuICAgIHB1YmxpYyBkZXNjcmlwdGlvbiA9ICdBdWdtZW50cyBzb21lIG9mIHRoZSBpc3N1ZXMgd2l0aCBBdG9tcyBhdXRvY29tcGxldGUtcGx1cyBwYWNrYWdlJztcclxufVxyXG5leHBvcnQgY29uc3QgaW50ZWxsaXNlbnNlID0gbmV3IEludGVsbGlzZW5zZTtcclxuIl19
