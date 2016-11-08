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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy9yZW5hbWUtdmlldy5qcyIsImxpYi92aWV3cy9yZW5hbWUtdmlldy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7SUNBWTs7QURDWjs7Ozs7Ozs7OztJQ0VBOzs7Ozs7Ozs7OztxQ0FrQnFCOzs7QUFDYixpQkFBSyxRQUFMLENBQWMsR0FBZCxDQUFrQixLQUFLLENBQUwsQ0FBbEIsRUFBMkIsY0FBM0IsRUFBMkM7dUJBQU0sT0FBSyxNQUFMO2FBQU4sQ0FBM0MsQ0FEYTtBQUViLGlCQUFLLFFBQUwsQ0FBYyxHQUFkLENBQWtCLEtBQUssQ0FBTCxDQUFsQixFQUEyQixhQUEzQixFQUEwQzt1QkFBTSxPQUFLLE9BQUw7YUFBTixDQUExQyxDQUZhOzs7O2tDQUtBLGNBQW9CO0FBQ2pDLGlCQUFLLFVBQUwsQ0FBZ0IsT0FBaEIsQ0FBd0IsWUFBeEIsRUFEaUM7QUFFakMsbUJBQU8sS0FBSyxVQUFMLENBQWdCLEtBQWhCLEVBQVAsQ0FGaUM7Ozs7aUNBS3hCOzs7QUFDVCx1QkFBSyxPQUFMLENBQWE7dUJBQVksU0FBUyxNQUFULENBQWdCO0FBQ3JDLDhCQUFVLE9BQUssVUFBTCxDQUFnQixPQUFoQixFQUFWO0FBQ0Esc0NBQWtCLElBQWxCO0FBQ0Esc0NBQWtCLEtBQWxCO2lCQUhxQjthQUFaLENBQWIsQ0FEUztBQU1ULG1CQUFPLEtBQUssT0FBTCxFQUFQLENBTlM7Ozs7a0NBU0M7QUFDVixpQkFBSyxVQUFMLENBQWdCLE9BQWhCLENBQXdCLEVBQXhCLEVBRFU7QUFFVixtQkFBTyxLQUFLLE1BQUwsRUFBUCxDQUZVOzs7O2tDQXBDTzs7O0FBQ2pCLG1CQUFPLEtBQUssR0FBTCxDQUFTO0FBQ1oseUJBQVMseUJBQVQ7YUFERyxFQUVKLFlBQUE7QUFDQyx1QkFBSyxDQUFMLENBQU87QUFDSCw0QkFBUSxTQUFSO0FBQ0EsNkJBQVMsd0JBQVQ7aUJBRkosRUFHRyxZQUhILEVBREQ7QUFLQyx1QkFBTyxPQUFLLE9BQUwsQ0FBYSxZQUFiLEVBQ0gsSUFBSSxjQUFjLGNBQWQsQ0FBNkI7QUFDN0IsMEJBQU0sSUFBTjtpQkFESixDQURHLENBQVAsQ0FMRDthQUFBLENBRkgsQ0FEaUI7Ozs7O0VBRE8sY0FBYyxJQUFkIiwiZmlsZSI6ImxpYi92aWV3cy9yZW5hbWUtdmlldy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHNwYWNlUGVuVmlld3MgZnJvbSBcImF0b20tc3BhY2UtcGVuLXZpZXdzXCI7XG5pbXBvcnQgeyBPbW5pIH0gZnJvbSBcIi4uL3NlcnZlci9vbW5pXCI7XG5leHBvcnQgY2xhc3MgUmVuYW1lVmlldyBleHRlbmRzIHNwYWNlUGVuVmlld3MuVmlldyB7XG4gICAgc3RhdGljIGNvbnRlbnQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmRpdih7XG4gICAgICAgICAgICBcImNsYXNzXCI6IFwicmVuYW1lIG92ZXJsYXkgZnJvbS10b3BcIlxuICAgICAgICB9LCAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnAoe1xuICAgICAgICAgICAgICAgIG91dGxldDogXCJtZXNzYWdlXCIsXG4gICAgICAgICAgICAgICAgXCJjbGFzc1wiOiBcImljb24gaWNvbi1kaWZmLXJlbmFtZWRcIlxuICAgICAgICAgICAgfSwgXCJSZW5hbWUgdG86XCIpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3VidmlldyhcIm1pbmlFZGl0b3JcIiwgbmV3IHNwYWNlUGVuVmlld3MuVGV4dEVkaXRvclZpZXcoe1xuICAgICAgICAgICAgICAgIG1pbmk6IHRydWVcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGluaXRpYWxpemUoKSB7XG4gICAgICAgIGF0b20uY29tbWFuZHMuYWRkKHRoaXNbMF0sIFwiY29yZTpjb25maXJtXCIsICgpID0+IHRoaXMucmVuYW1lKCkpO1xuICAgICAgICBhdG9tLmNvbW1hbmRzLmFkZCh0aGlzWzBdLCBcImNvcmU6Y2FuY2VsXCIsICgpID0+IHRoaXMuZGVzdHJveSgpKTtcbiAgICB9XG4gICAgY29uZmlndXJlKHdvcmRUb1JlbmFtZSkge1xuICAgICAgICB0aGlzLm1pbmlFZGl0b3Iuc2V0VGV4dCh3b3JkVG9SZW5hbWUpO1xuICAgICAgICByZXR1cm4gdGhpcy5taW5pRWRpdG9yLmZvY3VzKCk7XG4gICAgfVxuICAgIHJlbmFtZSgpIHtcbiAgICAgICAgT21uaS5yZXF1ZXN0KHNvbHV0aW9uID0+IHNvbHV0aW9uLnJlbmFtZSh7XG4gICAgICAgICAgICBSZW5hbWVUbzogdGhpcy5taW5pRWRpdG9yLmdldFRleHQoKSxcbiAgICAgICAgICAgIFdhbnRzVGV4dENoYW5nZXM6IHRydWUsXG4gICAgICAgICAgICBBcHBseVRleHRDaGFuZ2VzOiBmYWxzZVxuICAgICAgICB9KSk7XG4gICAgICAgIHJldHVybiB0aGlzLmRlc3Ryb3koKTtcbiAgICB9XG4gICAgZGVzdHJveSgpIHtcbiAgICAgICAgdGhpcy5taW5pRWRpdG9yLnNldFRleHQoXCJcIik7XG4gICAgICAgIHJldHVybiB0aGlzLmRldGFjaCgpO1xuICAgIH1cbn1cbiIsImltcG9ydCAqIGFzIHNwYWNlUGVuVmlld3MgZnJvbSBcImF0b20tc3BhY2UtcGVuLXZpZXdzXCI7XHJcbmltcG9ydCB7T21uaX0gZnJvbSBcIi4uL3NlcnZlci9vbW5pXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgUmVuYW1lVmlldyBleHRlbmRzIHNwYWNlUGVuVmlld3MuVmlldyB7XHJcbiAgICBwdWJsaWMgc3RhdGljIGNvbnRlbnQoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZGl2KHtcclxuICAgICAgICAgICAgXCJjbGFzc1wiOiBcInJlbmFtZSBvdmVybGF5IGZyb20tdG9wXCJcclxuICAgICAgICB9LCAoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMucCh7XHJcbiAgICAgICAgICAgICAgICBvdXRsZXQ6IFwibWVzc2FnZVwiLFxyXG4gICAgICAgICAgICAgICAgXCJjbGFzc1wiOiBcImljb24gaWNvbi1kaWZmLXJlbmFtZWRcIlxyXG4gICAgICAgICAgICB9LCBcIlJlbmFtZSB0bzpcIik7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnN1YnZpZXcoXCJtaW5pRWRpdG9yXCIsXHJcbiAgICAgICAgICAgICAgICBuZXcgc3BhY2VQZW5WaWV3cy5UZXh0RWRpdG9yVmlldyh7XHJcbiAgICAgICAgICAgICAgICAgICAgbWluaTogdHJ1ZVxyXG4gICAgICAgICAgICAgICAgfSkpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBtaW5pRWRpdG9yOiBzcGFjZVBlblZpZXdzLlRleHRFZGl0b3JWaWV3O1xyXG5cclxuICAgIHB1YmxpYyBpbml0aWFsaXplKCkge1xyXG4gICAgICAgIGF0b20uY29tbWFuZHMuYWRkKHRoaXNbMF0sIFwiY29yZTpjb25maXJtXCIsICgpID0+IHRoaXMucmVuYW1lKCkpO1xyXG4gICAgICAgIGF0b20uY29tbWFuZHMuYWRkKHRoaXNbMF0sIFwiY29yZTpjYW5jZWxcIiwgKCkgPT4gdGhpcy5kZXN0cm95KCkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBjb25maWd1cmUod29yZFRvUmVuYW1lOiBzdHJpbmcpIHtcclxuICAgICAgICB0aGlzLm1pbmlFZGl0b3Iuc2V0VGV4dCh3b3JkVG9SZW5hbWUpO1xyXG4gICAgICAgIHJldHVybiB0aGlzLm1pbmlFZGl0b3IuZm9jdXMoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVuYW1lKCkge1xyXG4gICAgICAgIE9tbmkucmVxdWVzdChzb2x1dGlvbiA9PiBzb2x1dGlvbi5yZW5hbWUoe1xyXG4gICAgICAgICAgICBSZW5hbWVUbzogdGhpcy5taW5pRWRpdG9yLmdldFRleHQoKSxcclxuICAgICAgICAgICAgV2FudHNUZXh0Q2hhbmdlczogdHJ1ZSxcclxuICAgICAgICAgICAgQXBwbHlUZXh0Q2hhbmdlczogZmFsc2VcclxuICAgICAgICB9KSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZGVzdHJveSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkZXN0cm95KCkge1xyXG4gICAgICAgIHRoaXMubWluaUVkaXRvci5zZXRUZXh0KFwiXCIpO1xyXG4gICAgICAgIHJldHVybiB0aGlzLmRldGFjaCgpO1xyXG4gICAgfVxyXG59XHJcbiJdfQ==
