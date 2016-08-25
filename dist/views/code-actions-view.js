"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.default = function (options, editor) {
    var codeActionView = editor.codeActionView;
    if (!codeActionView) {
        editor.codeActionView = codeActionView = new CodeActionsView(options, editor);
    } else {
        codeActionView.options = options;
    }
    codeActionView.setItems();
    codeActionView.show();
    return codeActionView;
};

var _atomSpacePenViews = require("atom-space-pen-views");

var SpacePen = _interopRequireWildcard(_atomSpacePenViews);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var CodeActionsView = function (_SpacePen$SelectListV) {
    _inherits(CodeActionsView, _SpacePen$SelectListV);

    function CodeActionsView(options, editor) {
        _classCallCheck(this, CodeActionsView);

        var _this = _possibleConstructorReturn(this, (CodeActionsView.__proto__ || Object.getPrototypeOf(CodeActionsView)).call(this));

        _this.options = options;
        _this.editor = editor;
        _this._editorElement = atom.views.getView(editor);
        _this._vimMode = atom.packages.isPackageActive("vim-mode");
        _this.$.addClass("code-actions-overlay");
        _this.filterEditorView.model.placeholderText = "Filter list";
        return _this;
    }

    _createClass(CodeActionsView, [{
        key: "setItems",
        value: function setItems() {
            SpacePen.SelectListView.prototype.setItems.call(this, this.options.items);
        }
    }, {
        key: "confirmed",
        value: function confirmed(item) {
            this.cancel();
            this.options.confirmed(item);
            this.enableVimMode();
            return null;
        }
    }, {
        key: "show",
        value: function show() {
            var _this2 = this;

            this.storeFocusedElement();
            this.disableVimMode();
            this.destroyOverlay();
            this._overlayDecoration = this.editor.decorateMarker(this.editor.getLastCursor().getMarker(), { type: "overlay", position: "tail", item: this });
            setTimeout(function () {
                return _this2.focusFilterEditor();
            }, 100);
        }
    }, {
        key: "hide",
        value: function hide() {
            this.restoreFocus();
            this.enableVimMode();
            this.destroyOverlay();
        }
    }, {
        key: "destroyOverlay",
        value: function destroyOverlay() {
            if (this._overlayDecoration) this._overlayDecoration.destroy();
        }
    }, {
        key: "cancelled",
        value: function cancelled() {
            this.hide();
        }
    }, {
        key: "enableVimMode",
        value: function enableVimMode() {
            if (this._vimMode) {
                this._editorElement.classList.add("vim-mode");
            }
        }
    }, {
        key: "disableVimMode",
        value: function disableVimMode() {
            if (this._vimMode) {
                this._editorElement.classList.remove("vim-mode");
            }
        }
    }, {
        key: "getFilterKey",
        value: function getFilterKey() {
            return "Name";
        }
    }, {
        key: "viewForItem",
        value: function viewForItem(item) {
            return SpacePen.$$(function () {
                var _this3 = this;

                return this.li({
                    "class": "event",
                    "data-event-name": item.Name
                }, function () {
                    return _this3.span(item.Name, {
                        title: item.Name
                    });
                });
            });
        }
    }, {
        key: "$",
        get: function get() {
            return this;
        }
    }]);

    return CodeActionsView;
}(SpacePen.SelectListView);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy9jb2RlLWFjdGlvbnMtdmlldy50cyIsImxpYi92aWV3cy9jb2RlLWFjdGlvbnMtdmlldy5qcyJdLCJuYW1lcyI6WyJvcHRpb25zIiwiZWRpdG9yIiwiY29kZUFjdGlvblZpZXciLCJDb2RlQWN0aW9uc1ZpZXciLCJzZXRJdGVtcyIsInNob3ciLCJTcGFjZVBlbiIsIl9lZGl0b3JFbGVtZW50IiwiYXRvbSIsInZpZXdzIiwiZ2V0VmlldyIsIl92aW1Nb2RlIiwicGFja2FnZXMiLCJpc1BhY2thZ2VBY3RpdmUiLCIkIiwiYWRkQ2xhc3MiLCJmaWx0ZXJFZGl0b3JWaWV3IiwibW9kZWwiLCJwbGFjZWhvbGRlclRleHQiLCJTZWxlY3RMaXN0VmlldyIsInByb3RvdHlwZSIsImNhbGwiLCJpdGVtcyIsIml0ZW0iLCJjYW5jZWwiLCJjb25maXJtZWQiLCJlbmFibGVWaW1Nb2RlIiwic3RvcmVGb2N1c2VkRWxlbWVudCIsImRpc2FibGVWaW1Nb2RlIiwiZGVzdHJveU92ZXJsYXkiLCJfb3ZlcmxheURlY29yYXRpb24iLCJkZWNvcmF0ZU1hcmtlciIsImdldExhc3RDdXJzb3IiLCJnZXRNYXJrZXIiLCJ0eXBlIiwicG9zaXRpb24iLCJzZXRUaW1lb3V0IiwiZm9jdXNGaWx0ZXJFZGl0b3IiLCJyZXN0b3JlRm9jdXMiLCJkZXN0cm95IiwiaGlkZSIsImNsYXNzTGlzdCIsImFkZCIsInJlbW92ZSIsIiQkIiwibGkiLCJOYW1lIiwic3BhbiIsInRpdGxlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7OztrQkFPQSxVQUE0QkEsT0FBNUIsRUFBK0RDLE1BQS9ELEVBQXNGO0FBQ2xGLFFBQUlDLGlCQUF1QkQsT0FBUUMsY0FBbkM7QUFDQSxRQUFJLENBQUNBLGNBQUwsRUFBcUI7QUFDWEQsZUFBUUMsY0FBUixHQUF5QkEsaUJBQWlCLElBQUlDLGVBQUosQ0FBdUJILE9BQXZCLEVBQWdDQyxNQUFoQyxDQUExQztBQUNULEtBRkQsTUFFTztBQUNIQyx1QkFBZUYsT0FBZixHQUF5QkEsT0FBekI7QUFDSDtBQUVERSxtQkFBZUUsUUFBZjtBQUNBRixtQkFBZUcsSUFBZjtBQUNBLFdBQU9ILGNBQVA7QUFDSCxDOztBQ2xCRDs7SURBWUksUTs7Ozs7Ozs7OztJQW9CWkgsZTs7O0FBTUksNkJBQW1CSCxPQUFuQixFQUE2REMsTUFBN0QsRUFBb0Y7QUFBQTs7QUFBQTs7QUFBakUsY0FBQUQsT0FBQSxHQUFBQSxPQUFBO0FBQTBDLGNBQUFDLE1BQUEsR0FBQUEsTUFBQTtBQUV6RCxjQUFLTSxjQUFMLEdBQXNCQyxLQUFLQyxLQUFMLENBQVdDLE9BQVgsQ0FBbUJULE1BQW5CLENBQXRCO0FBQ0EsY0FBS1UsUUFBTCxHQUFnQkgsS0FBS0ksUUFBTCxDQUFjQyxlQUFkLENBQThCLFVBQTlCLENBQWhCO0FBQ0EsY0FBS0MsQ0FBTCxDQUFPQyxRQUFQLENBQWdCLHNCQUFoQjtBQUNNLGNBQU1DLGdCQUFOLENBQXVCQyxLQUF2QixDQUE2QkMsZUFBN0IsR0FBK0MsYUFBL0M7QUFMMEU7QUFNbkY7Ozs7bUNBTWM7QUFFWFoscUJBQVNhLGNBQVQsQ0FBd0JDLFNBQXhCLENBQWtDaEIsUUFBbEMsQ0FBMkNpQixJQUEzQyxDQUFnRCxJQUFoRCxFQUFzRCxLQUFLckIsT0FBTCxDQUFhc0IsS0FBbkU7QUFDSDs7O2tDQUVnQkMsSSxFQUFTO0FBQ3RCLGlCQUFLQyxNQUFMO0FBRUEsaUJBQUt4QixPQUFMLENBQWF5QixTQUFiLENBQXVCRixJQUF2QjtBQUVBLGlCQUFLRyxhQUFMO0FBQ0EsbUJBQU8sSUFBUDtBQUNIOzs7K0JBRVU7QUFBQTs7QUFDUCxpQkFBS0MsbUJBQUw7QUFDQSxpQkFBS0MsY0FBTDtBQUNBLGlCQUFLQyxjQUFMO0FBQ0EsaUJBQUtDLGtCQUFMLEdBQTBCLEtBQUs3QixNQUFMLENBQVk4QixjQUFaLENBQTJCLEtBQUs5QixNQUFMLENBQVkrQixhQUFaLEdBQTRCQyxTQUE1QixFQUEzQixFQUN0QixFQUFFQyxNQUFNLFNBQVIsRUFBbUJDLFVBQVUsTUFBN0IsRUFBcUNaLE1BQU0sSUFBM0MsRUFEc0IsQ0FBMUI7QUFHQWEsdUJBQVc7QUFBQSx1QkFBTSxPQUFLQyxpQkFBTCxFQUFOO0FBQUEsYUFBWCxFQUEyQyxHQUEzQztBQUNIOzs7K0JBRVU7QUFDUCxpQkFBS0MsWUFBTDtBQUNBLGlCQUFLWixhQUFMO0FBQ0EsaUJBQUtHLGNBQUw7QUFDSDs7O3lDQUVvQjtBQUNqQixnQkFBSSxLQUFLQyxrQkFBVCxFQUNJLEtBQUtBLGtCQUFMLENBQXdCUyxPQUF4QjtBQUNQOzs7b0NBR2U7QUFDWixpQkFBS0MsSUFBTDtBQUNIOzs7d0NBRW1CO0FBQ2hCLGdCQUFJLEtBQUs3QixRQUFULEVBQW1CO0FBQ2YscUJBQUtKLGNBQUwsQ0FBb0JrQyxTQUFwQixDQUE4QkMsR0FBOUIsQ0FBa0MsVUFBbEM7QUFDSDtBQUNKOzs7eUNBRW9CO0FBQ2pCLGdCQUFJLEtBQUsvQixRQUFULEVBQW1CO0FBQ2YscUJBQUtKLGNBQUwsQ0FBb0JrQyxTQUFwQixDQUE4QkUsTUFBOUIsQ0FBcUMsVUFBckM7QUFDSDtBQUNKOzs7dUNBRWtCO0FBQUssbUJBQU8sTUFBUDtBQUFnQjs7O29DQUVyQnBCLEksRUFBUztBQUV4QixtQkFBT2pCLFNBQVNzQyxFQUFULENBQVksWUFBQTtBQUFBOztBQUNmLHVCQUFPLEtBQUtDLEVBQUwsQ0FBUTtBQUNYLDZCQUFTLE9BREU7QUFFWCx1Q0FBbUJ0QixLQUFLdUI7QUFGYixpQkFBUixFQUdKLFlBQUE7QUFDQywyQkFBTyxPQUFLQyxJQUFMLENBQVV4QixLQUFLdUIsSUFBZixFQUFxQjtBQUN4QkUsK0JBQU96QixLQUFLdUI7QUFEWSxxQkFBckIsQ0FBUDtBQUdILGlCQVBNLENBQVA7QUFRSCxhQVRNLENBQVA7QUFVSDs7OzRCQXRFSTtBQUNELG1CQUFZLElBQVo7QUFDSDs7OztFQWhCNEJ4QyxTQUFTYSxjIiwiZmlsZSI6ImxpYi92aWV3cy9jb2RlLWFjdGlvbnMtdmlldy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIFNwYWNlUGVuIGZyb20gXCJhdG9tLXNwYWNlLXBlbi12aWV3c1wiO1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBTZWxlY3RMaXN0Vmlld09wdGlvbnM8VD4ge1xyXG4gICAgaXRlbXM6IFRbXTtcclxuICAgIGNvbmZpcm1lZDogKGl0ZW06IFQpID0+IGFueTtcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gPFQ+KG9wdGlvbnM6IFNlbGVjdExpc3RWaWV3T3B0aW9uczxUPiwgZWRpdG9yOiBBdG9tLlRleHRFZGl0b3IpOiBDb2RlQWN0aW9uc1ZpZXc8VD4ge1xyXG4gICAgbGV0IGNvZGVBY3Rpb25WaWV3ID0gKDxhbnk+ZWRpdG9yKS5jb2RlQWN0aW9uVmlldztcclxuICAgIGlmICghY29kZUFjdGlvblZpZXcpIHtcclxuICAgICAgICAoPGFueT5lZGl0b3IpLmNvZGVBY3Rpb25WaWV3ID0gY29kZUFjdGlvblZpZXcgPSBuZXcgQ29kZUFjdGlvbnNWaWV3PFQ+KG9wdGlvbnMsIGVkaXRvcik7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGNvZGVBY3Rpb25WaWV3Lm9wdGlvbnMgPSBvcHRpb25zO1xyXG4gICAgfVxyXG5cclxuICAgIGNvZGVBY3Rpb25WaWV3LnNldEl0ZW1zKCk7XHJcbiAgICBjb2RlQWN0aW9uVmlldy5zaG93KCk7XHJcbiAgICByZXR1cm4gY29kZUFjdGlvblZpZXc7XHJcbn1cclxuXHJcbmNsYXNzIENvZGVBY3Rpb25zVmlldzxUPiBleHRlbmRzIFNwYWNlUGVuLlNlbGVjdExpc3RWaWV3IHtcclxuXHJcbiAgICBwcml2YXRlIF9vdmVybGF5RGVjb3JhdGlvbjogYW55O1xyXG4gICAgcHJpdmF0ZSBfdmltTW9kZTogYm9vbGVhbjtcclxuICAgIHByaXZhdGUgX2VkaXRvckVsZW1lbnQ6IGFueTtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgb3B0aW9uczogU2VsZWN0TGlzdFZpZXdPcHRpb25zPFQ+LCBwdWJsaWMgZWRpdG9yOiBBdG9tLlRleHRFZGl0b3IpIHtcclxuICAgICAgICBzdXBlcigpO1xyXG4gICAgICAgIHRoaXMuX2VkaXRvckVsZW1lbnQgPSBhdG9tLnZpZXdzLmdldFZpZXcoZWRpdG9yKTtcclxuICAgICAgICB0aGlzLl92aW1Nb2RlID0gYXRvbS5wYWNrYWdlcy5pc1BhY2thZ2VBY3RpdmUoXCJ2aW0tbW9kZVwiKTtcclxuICAgICAgICB0aGlzLiQuYWRkQ2xhc3MoXCJjb2RlLWFjdGlvbnMtb3ZlcmxheVwiKTtcclxuICAgICAgICAoPGFueT50aGlzKS5maWx0ZXJFZGl0b3JWaWV3Lm1vZGVsLnBsYWNlaG9sZGVyVGV4dCA9IFwiRmlsdGVyIGxpc3RcIjtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgJCgpOiBKUXVlcnkge1xyXG4gICAgICAgIHJldHVybiA8YW55PnRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHNldEl0ZW1zKCkge1xyXG4gICAgICAgIC8vc3VwZXIuc2V0SXRlbXModGhpcy5vcHRpb25zLml0ZW1zKVxyXG4gICAgICAgIFNwYWNlUGVuLlNlbGVjdExpc3RWaWV3LnByb3RvdHlwZS5zZXRJdGVtcy5jYWxsKHRoaXMsIHRoaXMub3B0aW9ucy5pdGVtcyk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNvbmZpcm1lZChpdGVtOiBhbnkpOiBhbnkge1xyXG4gICAgICAgIHRoaXMuY2FuY2VsKCk7IC8vd2lsbCBjbG9zZSB0aGUgdmlld1xyXG5cclxuICAgICAgICB0aGlzLm9wdGlvbnMuY29uZmlybWVkKGl0ZW0pO1xyXG5cclxuICAgICAgICB0aGlzLmVuYWJsZVZpbU1vZGUoKTtcclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2hvdygpIHtcclxuICAgICAgICB0aGlzLnN0b3JlRm9jdXNlZEVsZW1lbnQoKTtcclxuICAgICAgICB0aGlzLmRpc2FibGVWaW1Nb2RlKCk7XHJcbiAgICAgICAgdGhpcy5kZXN0cm95T3ZlcmxheSgpO1xyXG4gICAgICAgIHRoaXMuX292ZXJsYXlEZWNvcmF0aW9uID0gdGhpcy5lZGl0b3IuZGVjb3JhdGVNYXJrZXIodGhpcy5lZGl0b3IuZ2V0TGFzdEN1cnNvcigpLmdldE1hcmtlcigpLFxyXG4gICAgICAgICAgICB7IHR5cGU6IFwib3ZlcmxheVwiLCBwb3NpdGlvbjogXCJ0YWlsXCIsIGl0ZW06IHRoaXMgfSk7XHJcblxyXG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4gdGhpcy5mb2N1c0ZpbHRlckVkaXRvcigpLCAxMDApO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBoaWRlKCkge1xyXG4gICAgICAgIHRoaXMucmVzdG9yZUZvY3VzKCk7XHJcbiAgICAgICAgdGhpcy5lbmFibGVWaW1Nb2RlKCk7XHJcbiAgICAgICAgdGhpcy5kZXN0cm95T3ZlcmxheSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkZXN0cm95T3ZlcmxheSgpIHtcclxuICAgICAgICBpZiAodGhpcy5fb3ZlcmxheURlY29yYXRpb24pXHJcbiAgICAgICAgICAgIHRoaXMuX292ZXJsYXlEZWNvcmF0aW9uLmRlc3Ryb3koKTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgcHVibGljIGNhbmNlbGxlZCgpIHtcclxuICAgICAgICB0aGlzLmhpZGUoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZW5hYmxlVmltTW9kZSgpIHtcclxuICAgICAgICBpZiAodGhpcy5fdmltTW9kZSkge1xyXG4gICAgICAgICAgICB0aGlzLl9lZGl0b3JFbGVtZW50LmNsYXNzTGlzdC5hZGQoXCJ2aW0tbW9kZVwiKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRpc2FibGVWaW1Nb2RlKCkge1xyXG4gICAgICAgIGlmICh0aGlzLl92aW1Nb2RlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2VkaXRvckVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZShcInZpbS1tb2RlXCIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0RmlsdGVyS2V5KCkgeyByZXR1cm4gXCJOYW1lXCI7IH1cclxuXHJcbiAgICBwdWJsaWMgdmlld0Zvckl0ZW0oaXRlbTogYW55KSB7XHJcblxyXG4gICAgICAgIHJldHVybiBTcGFjZVBlbi4kJChmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubGkoe1xyXG4gICAgICAgICAgICAgICAgXCJjbGFzc1wiOiBcImV2ZW50XCIsXHJcbiAgICAgICAgICAgICAgICBcImRhdGEtZXZlbnQtbmFtZVwiOiBpdGVtLk5hbWVcclxuICAgICAgICAgICAgfSwgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3BhbihpdGVtLk5hbWUsIHtcclxuICAgICAgICAgICAgICAgICAgICB0aXRsZTogaXRlbS5OYW1lXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn1cclxuIiwiaW1wb3J0ICogYXMgU3BhY2VQZW4gZnJvbSBcImF0b20tc3BhY2UtcGVuLXZpZXdzXCI7XG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiAob3B0aW9ucywgZWRpdG9yKSB7XG4gICAgbGV0IGNvZGVBY3Rpb25WaWV3ID0gZWRpdG9yLmNvZGVBY3Rpb25WaWV3O1xuICAgIGlmICghY29kZUFjdGlvblZpZXcpIHtcbiAgICAgICAgZWRpdG9yLmNvZGVBY3Rpb25WaWV3ID0gY29kZUFjdGlvblZpZXcgPSBuZXcgQ29kZUFjdGlvbnNWaWV3KG9wdGlvbnMsIGVkaXRvcik7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBjb2RlQWN0aW9uVmlldy5vcHRpb25zID0gb3B0aW9ucztcbiAgICB9XG4gICAgY29kZUFjdGlvblZpZXcuc2V0SXRlbXMoKTtcbiAgICBjb2RlQWN0aW9uVmlldy5zaG93KCk7XG4gICAgcmV0dXJuIGNvZGVBY3Rpb25WaWV3O1xufVxuY2xhc3MgQ29kZUFjdGlvbnNWaWV3IGV4dGVuZHMgU3BhY2VQZW4uU2VsZWN0TGlzdFZpZXcge1xuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnMsIGVkaXRvcikge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuICAgICAgICB0aGlzLmVkaXRvciA9IGVkaXRvcjtcbiAgICAgICAgdGhpcy5fZWRpdG9yRWxlbWVudCA9IGF0b20udmlld3MuZ2V0VmlldyhlZGl0b3IpO1xuICAgICAgICB0aGlzLl92aW1Nb2RlID0gYXRvbS5wYWNrYWdlcy5pc1BhY2thZ2VBY3RpdmUoXCJ2aW0tbW9kZVwiKTtcbiAgICAgICAgdGhpcy4kLmFkZENsYXNzKFwiY29kZS1hY3Rpb25zLW92ZXJsYXlcIik7XG4gICAgICAgIHRoaXMuZmlsdGVyRWRpdG9yVmlldy5tb2RlbC5wbGFjZWhvbGRlclRleHQgPSBcIkZpbHRlciBsaXN0XCI7XG4gICAgfVxuICAgIGdldCAkKCkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgc2V0SXRlbXMoKSB7XG4gICAgICAgIFNwYWNlUGVuLlNlbGVjdExpc3RWaWV3LnByb3RvdHlwZS5zZXRJdGVtcy5jYWxsKHRoaXMsIHRoaXMub3B0aW9ucy5pdGVtcyk7XG4gICAgfVxuICAgIGNvbmZpcm1lZChpdGVtKSB7XG4gICAgICAgIHRoaXMuY2FuY2VsKCk7XG4gICAgICAgIHRoaXMub3B0aW9ucy5jb25maXJtZWQoaXRlbSk7XG4gICAgICAgIHRoaXMuZW5hYmxlVmltTW9kZSgpO1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgc2hvdygpIHtcbiAgICAgICAgdGhpcy5zdG9yZUZvY3VzZWRFbGVtZW50KCk7XG4gICAgICAgIHRoaXMuZGlzYWJsZVZpbU1vZGUoKTtcbiAgICAgICAgdGhpcy5kZXN0cm95T3ZlcmxheSgpO1xuICAgICAgICB0aGlzLl9vdmVybGF5RGVjb3JhdGlvbiA9IHRoaXMuZWRpdG9yLmRlY29yYXRlTWFya2VyKHRoaXMuZWRpdG9yLmdldExhc3RDdXJzb3IoKS5nZXRNYXJrZXIoKSwgeyB0eXBlOiBcIm92ZXJsYXlcIiwgcG9zaXRpb246IFwidGFpbFwiLCBpdGVtOiB0aGlzIH0pO1xuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHRoaXMuZm9jdXNGaWx0ZXJFZGl0b3IoKSwgMTAwKTtcbiAgICB9XG4gICAgaGlkZSgpIHtcbiAgICAgICAgdGhpcy5yZXN0b3JlRm9jdXMoKTtcbiAgICAgICAgdGhpcy5lbmFibGVWaW1Nb2RlKCk7XG4gICAgICAgIHRoaXMuZGVzdHJveU92ZXJsYXkoKTtcbiAgICB9XG4gICAgZGVzdHJveU92ZXJsYXkoKSB7XG4gICAgICAgIGlmICh0aGlzLl9vdmVybGF5RGVjb3JhdGlvbilcbiAgICAgICAgICAgIHRoaXMuX292ZXJsYXlEZWNvcmF0aW9uLmRlc3Ryb3koKTtcbiAgICB9XG4gICAgY2FuY2VsbGVkKCkge1xuICAgICAgICB0aGlzLmhpZGUoKTtcbiAgICB9XG4gICAgZW5hYmxlVmltTW9kZSgpIHtcbiAgICAgICAgaWYgKHRoaXMuX3ZpbU1vZGUpIHtcbiAgICAgICAgICAgIHRoaXMuX2VkaXRvckVsZW1lbnQuY2xhc3NMaXN0LmFkZChcInZpbS1tb2RlXCIpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGRpc2FibGVWaW1Nb2RlKCkge1xuICAgICAgICBpZiAodGhpcy5fdmltTW9kZSkge1xuICAgICAgICAgICAgdGhpcy5fZWRpdG9yRWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKFwidmltLW1vZGVcIik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZ2V0RmlsdGVyS2V5KCkgeyByZXR1cm4gXCJOYW1lXCI7IH1cbiAgICB2aWV3Rm9ySXRlbShpdGVtKSB7XG4gICAgICAgIHJldHVybiBTcGFjZVBlbi4kJChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5saSh7XG4gICAgICAgICAgICAgICAgXCJjbGFzc1wiOiBcImV2ZW50XCIsXG4gICAgICAgICAgICAgICAgXCJkYXRhLWV2ZW50LW5hbWVcIjogaXRlbS5OYW1lXG4gICAgICAgICAgICB9LCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3BhbihpdGVtLk5hbWUsIHtcbiAgICAgICAgICAgICAgICAgICAgdGl0bGU6IGl0ZW0uTmFtZVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
