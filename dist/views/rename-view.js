"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.RenameView = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _atomSpacePenViews = require("atom-space-pen-views");

var spacePenViews = _interopRequireWildcard(_atomSpacePenViews);

var _omni = require("../server/omni");

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
        key: "initialize",
        value: function initialize() {
            var _this2 = this;

            atom.commands.add(this[0], "core:confirm", function () {
                return _this2.rename();
            });
            atom.commands.add(this[0], "core:cancel", function () {
                return _this2.destroy();
            });
        }
    }, {
        key: "configure",
        value: function configure(wordToRename) {
            this.miniEditor.setText(wordToRename);
            return this.miniEditor.focus();
        }
    }, {
        key: "rename",
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
        key: "destroy",
        value: function destroy() {
            this.miniEditor.setText("");
            return this.detach();
        }
    }], [{
        key: "content",
        value: function content() {
            var _this4 = this;

            return this.div({
                "class": "rename overlay from-top"
            }, function () {
                _this4.p({
                    outlet: "message",
                    "class": "icon icon-diff-renamed"
                }, "Rename to:");
                return _this4.subview("miniEditor", new spacePenViews.TextEditorView({
                    mini: true
                }));
            });
        }
    }]);

    return RenameView;
}(spacePenViews.View);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy9yZW5hbWUtdmlldy5qcyIsImxpYi92aWV3cy9yZW5hbWUtdmlldy50cyJdLCJuYW1lcyI6WyJzcGFjZVBlblZpZXdzIiwiUmVuYW1lVmlldyIsImF0b20iLCJjb21tYW5kcyIsImFkZCIsInJlbmFtZSIsImRlc3Ryb3kiLCJ3b3JkVG9SZW5hbWUiLCJtaW5pRWRpdG9yIiwic2V0VGV4dCIsImZvY3VzIiwicmVxdWVzdCIsInNvbHV0aW9uIiwiUmVuYW1lVG8iLCJnZXRUZXh0IiwiV2FudHNUZXh0Q2hhbmdlcyIsIkFwcGx5VGV4dENoYW5nZXMiLCJkZXRhY2giLCJkaXYiLCJwIiwib3V0bGV0Iiwic3VidmlldyIsIlRleHRFZGl0b3JWaWV3IiwibWluaSIsIlZpZXciXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztJQ0FZQSxhOztBRENaOzs7Ozs7Ozs7O0lDRUFDLFUsV0FBQUEsVTs7Ozs7Ozs7Ozs7cUNBa0JxQjtBQUFBOztBQUNiQyxpQkFBS0MsUUFBTCxDQUFjQyxHQUFkLENBQWtCLEtBQUssQ0FBTCxDQUFsQixFQUEyQixjQUEzQixFQUEyQztBQUFBLHVCQUFNLE9BQUtDLE1BQUwsRUFBTjtBQUFBLGFBQTNDO0FBQ0FILGlCQUFLQyxRQUFMLENBQWNDLEdBQWQsQ0FBa0IsS0FBSyxDQUFMLENBQWxCLEVBQTJCLGFBQTNCLEVBQTBDO0FBQUEsdUJBQU0sT0FBS0UsT0FBTCxFQUFOO0FBQUEsYUFBMUM7QUFDSDs7O2tDQUVnQkMsWSxFQUFvQjtBQUNqQyxpQkFBS0MsVUFBTCxDQUFnQkMsT0FBaEIsQ0FBd0JGLFlBQXhCO0FBQ0EsbUJBQU8sS0FBS0MsVUFBTCxDQUFnQkUsS0FBaEIsRUFBUDtBQUNIOzs7aUNBRVk7QUFBQTs7QUFDVCx1QkFBS0MsT0FBTCxDQUFhO0FBQUEsdUJBQVlDLFNBQVNQLE1BQVQsQ0FBZ0I7QUFDckNRLDhCQUFVLE9BQUtMLFVBQUwsQ0FBZ0JNLE9BQWhCLEVBRDJCO0FBRXJDQyxzQ0FBa0IsSUFGbUI7QUFHckNDLHNDQUFrQjtBQUhtQixpQkFBaEIsQ0FBWjtBQUFBLGFBQWI7QUFLQSxtQkFBTyxLQUFLVixPQUFMLEVBQVA7QUFDSDs7O2tDQUVhO0FBQ1YsaUJBQUtFLFVBQUwsQ0FBZ0JDLE9BQWhCLENBQXdCLEVBQXhCO0FBQ0EsbUJBQU8sS0FBS1EsTUFBTCxFQUFQO0FBQ0g7OztrQ0F2Q29CO0FBQUE7O0FBQ2pCLG1CQUFPLEtBQUtDLEdBQUwsQ0FBUztBQUNaLHlCQUFTO0FBREcsYUFBVCxFQUVKLFlBQUE7QUFDQyx1QkFBS0MsQ0FBTCxDQUFPO0FBQ0hDLDRCQUFRLFNBREw7QUFFSCw2QkFBUztBQUZOLGlCQUFQLEVBR0csWUFISDtBQUlBLHVCQUFPLE9BQUtDLE9BQUwsQ0FBYSxZQUFiLEVBQ0gsSUFBSXJCLGNBQWNzQixjQUFsQixDQUFpQztBQUM3QkMsMEJBQU07QUFEdUIsaUJBQWpDLENBREcsQ0FBUDtBQUlILGFBWE0sQ0FBUDtBQVlIOzs7O0VBZDJCdkIsY0FBY3dCLEkiLCJmaWxlIjoibGliL3ZpZXdzL3JlbmFtZS12aWV3LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgc3BhY2VQZW5WaWV3cyBmcm9tIFwiYXRvbS1zcGFjZS1wZW4tdmlld3NcIjtcbmltcG9ydCB7IE9tbmkgfSBmcm9tIFwiLi4vc2VydmVyL29tbmlcIjtcbmV4cG9ydCBjbGFzcyBSZW5hbWVWaWV3IGV4dGVuZHMgc3BhY2VQZW5WaWV3cy5WaWV3IHtcbiAgICBzdGF0aWMgY29udGVudCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGl2KHtcbiAgICAgICAgICAgIFwiY2xhc3NcIjogXCJyZW5hbWUgb3ZlcmxheSBmcm9tLXRvcFwiXG4gICAgICAgIH0sICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMucCh7XG4gICAgICAgICAgICAgICAgb3V0bGV0OiBcIm1lc3NhZ2VcIixcbiAgICAgICAgICAgICAgICBcImNsYXNzXCI6IFwiaWNvbiBpY29uLWRpZmYtcmVuYW1lZFwiXG4gICAgICAgICAgICB9LCBcIlJlbmFtZSB0bzpcIik7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zdWJ2aWV3KFwibWluaUVkaXRvclwiLCBuZXcgc3BhY2VQZW5WaWV3cy5UZXh0RWRpdG9yVmlldyh7XG4gICAgICAgICAgICAgICAgbWluaTogdHJ1ZVxuICAgICAgICAgICAgfSkpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgaW5pdGlhbGl6ZSgpIHtcbiAgICAgICAgYXRvbS5jb21tYW5kcy5hZGQodGhpc1swXSwgXCJjb3JlOmNvbmZpcm1cIiwgKCkgPT4gdGhpcy5yZW5hbWUoKSk7XG4gICAgICAgIGF0b20uY29tbWFuZHMuYWRkKHRoaXNbMF0sIFwiY29yZTpjYW5jZWxcIiwgKCkgPT4gdGhpcy5kZXN0cm95KCkpO1xuICAgIH1cbiAgICBjb25maWd1cmUod29yZFRvUmVuYW1lKSB7XG4gICAgICAgIHRoaXMubWluaUVkaXRvci5zZXRUZXh0KHdvcmRUb1JlbmFtZSk7XG4gICAgICAgIHJldHVybiB0aGlzLm1pbmlFZGl0b3IuZm9jdXMoKTtcbiAgICB9XG4gICAgcmVuYW1lKCkge1xuICAgICAgICBPbW5pLnJlcXVlc3Qoc29sdXRpb24gPT4gc29sdXRpb24ucmVuYW1lKHtcbiAgICAgICAgICAgIFJlbmFtZVRvOiB0aGlzLm1pbmlFZGl0b3IuZ2V0VGV4dCgpLFxuICAgICAgICAgICAgV2FudHNUZXh0Q2hhbmdlczogdHJ1ZSxcbiAgICAgICAgICAgIEFwcGx5VGV4dENoYW5nZXM6IGZhbHNlXG4gICAgICAgIH0pKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGVzdHJveSgpO1xuICAgIH1cbiAgICBkZXN0cm95KCkge1xuICAgICAgICB0aGlzLm1pbmlFZGl0b3Iuc2V0VGV4dChcIlwiKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGV0YWNoKCk7XG4gICAgfVxufVxuIiwiaW1wb3J0ICogYXMgc3BhY2VQZW5WaWV3cyBmcm9tIFwiYXRvbS1zcGFjZS1wZW4tdmlld3NcIjtcclxuaW1wb3J0IHtPbW5pfSBmcm9tIFwiLi4vc2VydmVyL29tbmlcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBSZW5hbWVWaWV3IGV4dGVuZHMgc3BhY2VQZW5WaWV3cy5WaWV3IHtcclxuICAgIHB1YmxpYyBzdGF0aWMgY29udGVudCgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5kaXYoe1xyXG4gICAgICAgICAgICBcImNsYXNzXCI6IFwicmVuYW1lIG92ZXJsYXkgZnJvbS10b3BcIlxyXG4gICAgICAgIH0sICgpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5wKHtcclxuICAgICAgICAgICAgICAgIG91dGxldDogXCJtZXNzYWdlXCIsXHJcbiAgICAgICAgICAgICAgICBcImNsYXNzXCI6IFwiaWNvbiBpY29uLWRpZmYtcmVuYW1lZFwiXHJcbiAgICAgICAgICAgIH0sIFwiUmVuYW1lIHRvOlwiKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3VidmlldyhcIm1pbmlFZGl0b3JcIixcclxuICAgICAgICAgICAgICAgIG5ldyBzcGFjZVBlblZpZXdzLlRleHRFZGl0b3JWaWV3KHtcclxuICAgICAgICAgICAgICAgICAgICBtaW5pOiB0cnVlXHJcbiAgICAgICAgICAgICAgICB9KSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIG1pbmlFZGl0b3I6IHNwYWNlUGVuVmlld3MuVGV4dEVkaXRvclZpZXc7XHJcblxyXG4gICAgcHVibGljIGluaXRpYWxpemUoKSB7XHJcbiAgICAgICAgYXRvbS5jb21tYW5kcy5hZGQodGhpc1swXSwgXCJjb3JlOmNvbmZpcm1cIiwgKCkgPT4gdGhpcy5yZW5hbWUoKSk7XHJcbiAgICAgICAgYXRvbS5jb21tYW5kcy5hZGQodGhpc1swXSwgXCJjb3JlOmNhbmNlbFwiLCAoKSA9PiB0aGlzLmRlc3Ryb3koKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNvbmZpZ3VyZSh3b3JkVG9SZW5hbWU6IHN0cmluZykge1xyXG4gICAgICAgIHRoaXMubWluaUVkaXRvci5zZXRUZXh0KHdvcmRUb1JlbmFtZSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubWluaUVkaXRvci5mb2N1cygpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZW5hbWUoKSB7XHJcbiAgICAgICAgT21uaS5yZXF1ZXN0KHNvbHV0aW9uID0+IHNvbHV0aW9uLnJlbmFtZSh7XHJcbiAgICAgICAgICAgIFJlbmFtZVRvOiB0aGlzLm1pbmlFZGl0b3IuZ2V0VGV4dCgpLFxyXG4gICAgICAgICAgICBXYW50c1RleHRDaGFuZ2VzOiB0cnVlLFxyXG4gICAgICAgICAgICBBcHBseVRleHRDaGFuZ2VzOiBmYWxzZVxyXG4gICAgICAgIH0pKTtcclxuICAgICAgICByZXR1cm4gdGhpcy5kZXN0cm95KCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRlc3Ryb3koKSB7XHJcbiAgICAgICAgdGhpcy5taW5pRWRpdG9yLnNldFRleHQoXCJcIik7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZGV0YWNoKCk7XHJcbiAgICB9XHJcbn1cclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
