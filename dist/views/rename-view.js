'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.RenameView = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _atomSpacePenViews = require('atom-space-pen-views');

var spacePenViews = _interopRequireWildcard(_atomSpacePenViews);

var _omni = require('../server/omni');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var RenameView = exports.RenameView = function (_spacePenViews$View) {
    _inherits(RenameView, _spacePenViews$View);

    function RenameView() {
        _classCallCheck(this, RenameView);

        return _possibleConstructorReturn(this, (RenameView.__proto__ || Object.getPrototypeOf(RenameView)).apply(this, arguments));
    }

    _createClass(RenameView, [{
        key: 'initialize',
        value: function initialize() {
            var _this2 = this;

            atom.commands.add(this[0], 'core:confirm', function () {
                return _this2.rename();
            });
            atom.commands.add(this[0], 'core:cancel', function () {
                return _this2.destroy();
            });
        }
    }, {
        key: 'configure',
        value: function configure(wordToRename) {
            this.miniEditor.setText(wordToRename);
            return this.miniEditor.focus();
        }
    }, {
        key: 'rename',
        value: function rename() {
            var _this3 = this;

            _omni.Omni.request(function (solution) {
                return solution.rename({
                    RenameTo: _this3.miniEditor.getText(),
                    WantsTextChanges: true,
                    ApplyTextChanges: false
                });
            });
            return this.destroy();
        }
    }, {
        key: 'destroy',
        value: function destroy() {
            this.miniEditor.setText('');
            return this.detach();
        }
    }], [{
        key: 'content',
        value: function content() {
            var _this4 = this;

            return this.div({
                class: 'rename overlay from-top'
            }, function () {
                _this4.p({
                    outlet: 'message',
                    class: 'icon icon-diff-renamed'
                }, 'Rename to:');
                return _this4.subview('miniEditor', new spacePenViews.TextEditorView({
                    mini: true
                }));
            });
        }
    }]);

    return RenameView;
}(spacePenViews.View);
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy9yZW5hbWUtdmlldy50cyJdLCJuYW1lcyI6WyJzcGFjZVBlblZpZXdzIiwiUmVuYW1lVmlldyIsImF0b20iLCJjb21tYW5kcyIsImFkZCIsInJlbmFtZSIsImRlc3Ryb3kiLCJ3b3JkVG9SZW5hbWUiLCJtaW5pRWRpdG9yIiwic2V0VGV4dCIsImZvY3VzIiwicmVxdWVzdCIsInNvbHV0aW9uIiwiUmVuYW1lVG8iLCJnZXRUZXh0IiwiV2FudHNUZXh0Q2hhbmdlcyIsIkFwcGx5VGV4dENoYW5nZXMiLCJkZXRhY2giLCJkaXYiLCJjbGFzcyIsInAiLCJvdXRsZXQiLCJzdWJ2aWV3IiwiVGV4dEVkaXRvclZpZXciLCJtaW5pIiwiVmlldyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0lBQVlBLGE7O0FBQ1o7Ozs7Ozs7Ozs7SUFFTUMsVSxXQUFBQSxVOzs7Ozs7Ozs7OztxQ0FrQmU7QUFBQTs7QUFDYkMsaUJBQUtDLFFBQUwsQ0FBY0MsR0FBZCxDQUFrQixLQUFLLENBQUwsQ0FBbEIsRUFBMkIsY0FBM0IsRUFBMkM7QUFBQSx1QkFBTSxPQUFLQyxNQUFMLEVBQU47QUFBQSxhQUEzQztBQUNBSCxpQkFBS0MsUUFBTCxDQUFjQyxHQUFkLENBQWtCLEtBQUssQ0FBTCxDQUFsQixFQUEyQixhQUEzQixFQUEwQztBQUFBLHVCQUFNLE9BQUtFLE9BQUwsRUFBTjtBQUFBLGFBQTFDO0FBQ0g7OztrQ0FFZ0JDLFksRUFBb0I7QUFDakMsaUJBQUtDLFVBQUwsQ0FBZ0JDLE9BQWhCLENBQXdCRixZQUF4QjtBQUNBLG1CQUFPLEtBQUtDLFVBQUwsQ0FBZ0JFLEtBQWhCLEVBQVA7QUFDSDs7O2lDQUVZO0FBQUE7O0FBQ1QsdUJBQUtDLE9BQUwsQ0FBYTtBQUFBLHVCQUFZQyxTQUFTUCxNQUFULENBQWdCO0FBQ3JDUSw4QkFBVSxPQUFLTCxVQUFMLENBQWdCTSxPQUFoQixFQUQyQjtBQUVyQ0Msc0NBQWtCLElBRm1CO0FBR3JDQyxzQ0FBa0I7QUFIbUIsaUJBQWhCLENBQVo7QUFBQSxhQUFiO0FBS0EsbUJBQU8sS0FBS1YsT0FBTCxFQUFQO0FBQ0g7OztrQ0FFYTtBQUNWLGlCQUFLRSxVQUFMLENBQWdCQyxPQUFoQixDQUF3QixFQUF4QjtBQUNBLG1CQUFPLEtBQUtRLE1BQUwsRUFBUDtBQUNIOzs7a0NBdkNvQjtBQUFBOztBQUNqQixtQkFBTyxLQUFLQyxHQUFMLENBQVM7QUFDWkMsdUJBQU87QUFESyxhQUFULEVBRUosWUFBQTtBQUNDLHVCQUFLQyxDQUFMLENBQU87QUFDSEMsNEJBQVEsU0FETDtBQUVIRiwyQkFBTztBQUZKLGlCQUFQLEVBR0csWUFISDtBQUlBLHVCQUFPLE9BQUtHLE9BQUwsQ0FBYSxZQUFiLEVBQ0gsSUFBSXRCLGNBQWN1QixjQUFsQixDQUFpQztBQUM3QkMsMEJBQU07QUFEdUIsaUJBQWpDLENBREcsQ0FBUDtBQUlILGFBWE0sQ0FBUDtBQVlIOzs7O0VBZDJCeEIsY0FBY3lCLEkiLCJmaWxlIjoibGliL3ZpZXdzL3JlbmFtZS12aWV3LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgc3BhY2VQZW5WaWV3cyBmcm9tICdhdG9tLXNwYWNlLXBlbi12aWV3cyc7XHJcbmltcG9ydCB7T21uaX0gZnJvbSAnLi4vc2VydmVyL29tbmknO1xyXG5cclxuZXhwb3J0IGNsYXNzIFJlbmFtZVZpZXcgZXh0ZW5kcyBzcGFjZVBlblZpZXdzLlZpZXcge1xyXG4gICAgcHVibGljIHN0YXRpYyBjb250ZW50KCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmRpdih7XHJcbiAgICAgICAgICAgIGNsYXNzOiAncmVuYW1lIG92ZXJsYXkgZnJvbS10b3AnXHJcbiAgICAgICAgfSwgKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLnAoe1xyXG4gICAgICAgICAgICAgICAgb3V0bGV0OiAnbWVzc2FnZScsXHJcbiAgICAgICAgICAgICAgICBjbGFzczogJ2ljb24gaWNvbi1kaWZmLXJlbmFtZWQnXHJcbiAgICAgICAgICAgIH0sICdSZW5hbWUgdG86Jyk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnN1YnZpZXcoJ21pbmlFZGl0b3InLFxyXG4gICAgICAgICAgICAgICAgbmV3IHNwYWNlUGVuVmlld3MuVGV4dEVkaXRvclZpZXcoe1xyXG4gICAgICAgICAgICAgICAgICAgIG1pbmk6IHRydWVcclxuICAgICAgICAgICAgICAgIH0pKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgbWluaUVkaXRvcjogc3BhY2VQZW5WaWV3cy5UZXh0RWRpdG9yVmlldztcclxuXHJcbiAgICBwdWJsaWMgaW5pdGlhbGl6ZSgpIHtcclxuICAgICAgICBhdG9tLmNvbW1hbmRzLmFkZCh0aGlzWzBdLCAnY29yZTpjb25maXJtJywgKCkgPT4gdGhpcy5yZW5hbWUoKSk7XHJcbiAgICAgICAgYXRvbS5jb21tYW5kcy5hZGQodGhpc1swXSwgJ2NvcmU6Y2FuY2VsJywgKCkgPT4gdGhpcy5kZXN0cm95KCkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBjb25maWd1cmUod29yZFRvUmVuYW1lOiBzdHJpbmcpIHtcclxuICAgICAgICB0aGlzLm1pbmlFZGl0b3Iuc2V0VGV4dCh3b3JkVG9SZW5hbWUpO1xyXG4gICAgICAgIHJldHVybiB0aGlzLm1pbmlFZGl0b3IuZm9jdXMoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVuYW1lKCkge1xyXG4gICAgICAgIE9tbmkucmVxdWVzdChzb2x1dGlvbiA9PiBzb2x1dGlvbi5yZW5hbWUoe1xyXG4gICAgICAgICAgICBSZW5hbWVUbzogdGhpcy5taW5pRWRpdG9yLmdldFRleHQoKSxcclxuICAgICAgICAgICAgV2FudHNUZXh0Q2hhbmdlczogdHJ1ZSxcclxuICAgICAgICAgICAgQXBwbHlUZXh0Q2hhbmdlczogZmFsc2VcclxuICAgICAgICB9KSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZGVzdHJveSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkZXN0cm95KCkge1xyXG4gICAgICAgIHRoaXMubWluaUVkaXRvci5zZXRUZXh0KCcnKTtcclxuICAgICAgICByZXR1cm4gdGhpcy5kZXRhY2goKTtcclxuICAgIH1cclxufVxyXG4iXX0=
