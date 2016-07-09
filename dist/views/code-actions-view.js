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

        var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(CodeActionsView).call(this));

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy9jb2RlLWFjdGlvbnMtdmlldy50cyIsImxpYi92aWV3cy9jb2RlLWFjdGlvbnMtdmlldy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7OztrQkFPQSxVQUE0QixPQUE1QixFQUErRCxNQUEvRCxFQUFzRjtBQUNsRixRQUFJLGlCQUF1QixPQUFRLGNBQW5DO0FBQ0EsUUFBSSxDQUFDLGNBQUwsRUFBcUI7QUFDWCxlQUFRLGNBQVIsR0FBeUIsaUJBQWlCLElBQUksZUFBSixDQUF1QixPQUF2QixFQUFnQyxNQUFoQyxDQUExQztBQUNULEtBRkQsTUFFTztBQUNILHVCQUFlLE9BQWYsR0FBeUIsT0FBekI7QUFDSDtBQUVELG1CQUFlLFFBQWY7QUFDQSxtQkFBZSxJQUFmO0FBQ0EsV0FBTyxjQUFQO0FBQ0gsQzs7QUNsQkQ7O0lEQVksUTs7Ozs7Ozs7OztJQW9CWixlOzs7QUFNSSw2QkFBbUIsT0FBbkIsRUFBNkQsTUFBN0QsRUFBb0Y7QUFBQTs7QUFBQTs7QUFBakUsY0FBQSxPQUFBLEdBQUEsT0FBQTtBQUEwQyxjQUFBLE1BQUEsR0FBQSxNQUFBO0FBRXpELGNBQUssY0FBTCxHQUFzQixLQUFLLEtBQUwsQ0FBVyxPQUFYLENBQW1CLE1BQW5CLENBQXRCO0FBQ0EsY0FBSyxRQUFMLEdBQWdCLEtBQUssUUFBTCxDQUFjLGVBQWQsQ0FBOEIsVUFBOUIsQ0FBaEI7QUFDQSxjQUFLLENBQUwsQ0FBTyxRQUFQLENBQWdCLHNCQUFoQjtBQUNNLGNBQU0sZ0JBQU4sQ0FBdUIsS0FBdkIsQ0FBNkIsZUFBN0IsR0FBK0MsYUFBL0M7QUFMMEU7QUFNbkY7Ozs7bUNBTWM7QUFFWCxxQkFBUyxjQUFULENBQXdCLFNBQXhCLENBQWtDLFFBQWxDLENBQTJDLElBQTNDLENBQWdELElBQWhELEVBQXNELEtBQUssT0FBTCxDQUFhLEtBQW5FO0FBQ0g7OztrQ0FFZ0IsSSxFQUFTO0FBQ3RCLGlCQUFLLE1BQUw7QUFFQSxpQkFBSyxPQUFMLENBQWEsU0FBYixDQUF1QixJQUF2QjtBQUVBLGlCQUFLLGFBQUw7QUFDQSxtQkFBTyxJQUFQO0FBQ0g7OzsrQkFFVTtBQUFBOztBQUNQLGlCQUFLLG1CQUFMO0FBQ0EsaUJBQUssY0FBTDtBQUNBLGlCQUFLLGNBQUw7QUFDQSxpQkFBSyxrQkFBTCxHQUEwQixLQUFLLE1BQUwsQ0FBWSxjQUFaLENBQTJCLEtBQUssTUFBTCxDQUFZLGFBQVosR0FBNEIsU0FBNUIsRUFBM0IsRUFDdEIsRUFBRSxNQUFNLFNBQVIsRUFBbUIsVUFBVSxNQUE3QixFQUFxQyxNQUFNLElBQTNDLEVBRHNCLENBQTFCO0FBR0EsdUJBQVc7QUFBQSx1QkFBTSxPQUFLLGlCQUFMLEVBQU47QUFBQSxhQUFYLEVBQTJDLEdBQTNDO0FBQ0g7OzsrQkFFVTtBQUNQLGlCQUFLLFlBQUw7QUFDQSxpQkFBSyxhQUFMO0FBQ0EsaUJBQUssY0FBTDtBQUNIOzs7eUNBRW9CO0FBQ2pCLGdCQUFJLEtBQUssa0JBQVQsRUFDSSxLQUFLLGtCQUFMLENBQXdCLE9BQXhCO0FBQ1A7OztvQ0FHZTtBQUNaLGlCQUFLLElBQUw7QUFDSDs7O3dDQUVtQjtBQUNoQixnQkFBSSxLQUFLLFFBQVQsRUFBbUI7QUFDZixxQkFBSyxjQUFMLENBQW9CLFNBQXBCLENBQThCLEdBQTlCLENBQWtDLFVBQWxDO0FBQ0g7QUFDSjs7O3lDQUVvQjtBQUNqQixnQkFBSSxLQUFLLFFBQVQsRUFBbUI7QUFDZixxQkFBSyxjQUFMLENBQW9CLFNBQXBCLENBQThCLE1BQTlCLENBQXFDLFVBQXJDO0FBQ0g7QUFDSjs7O3VDQUVrQjtBQUFLLG1CQUFPLE1BQVA7QUFBZ0I7OztvQ0FFckIsSSxFQUFTO0FBRXhCLG1CQUFPLFNBQVMsRUFBVCxDQUFZLFlBQUE7QUFBQTs7QUFDZix1QkFBTyxLQUFLLEVBQUwsQ0FBUTtBQUNYLDZCQUFTLE9BREU7QUFFWCx1Q0FBbUIsS0FBSztBQUZiLGlCQUFSLEVBR0osWUFBQTtBQUNDLDJCQUFPLE9BQUssSUFBTCxDQUFVLEtBQUssSUFBZixFQUFxQjtBQUN4QiwrQkFBTyxLQUFLO0FBRFkscUJBQXJCLENBQVA7QUFHSCxpQkFQTSxDQUFQO0FBUUgsYUFUTSxDQUFQO0FBVUg7Ozs0QkF0RUk7QUFDRCxtQkFBWSxJQUFaO0FBQ0g7Ozs7RUFoQjRCLFNBQVMsYyIsImZpbGUiOiJsaWIvdmlld3MvY29kZS1hY3Rpb25zLXZpZXcuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBTcGFjZVBlbiBmcm9tIFwiYXRvbS1zcGFjZS1wZW4tdmlld3NcIjtcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgU2VsZWN0TGlzdFZpZXdPcHRpb25zPFQ+IHtcclxuICAgIGl0ZW1zOiBUW107XHJcbiAgICBjb25maXJtZWQ6IChpdGVtOiBUKSA9PiBhbnk7XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIDxUPihvcHRpb25zOiBTZWxlY3RMaXN0Vmlld09wdGlvbnM8VD4sIGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yKTogQ29kZUFjdGlvbnNWaWV3PFQ+IHtcclxuICAgIGxldCBjb2RlQWN0aW9uVmlldyA9ICg8YW55PmVkaXRvcikuY29kZUFjdGlvblZpZXc7XHJcbiAgICBpZiAoIWNvZGVBY3Rpb25WaWV3KSB7XHJcbiAgICAgICAgKDxhbnk+ZWRpdG9yKS5jb2RlQWN0aW9uVmlldyA9IGNvZGVBY3Rpb25WaWV3ID0gbmV3IENvZGVBY3Rpb25zVmlldzxUPihvcHRpb25zLCBlZGl0b3IpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBjb2RlQWN0aW9uVmlldy5vcHRpb25zID0gb3B0aW9ucztcclxuICAgIH1cclxuXHJcbiAgICBjb2RlQWN0aW9uVmlldy5zZXRJdGVtcygpO1xyXG4gICAgY29kZUFjdGlvblZpZXcuc2hvdygpO1xyXG4gICAgcmV0dXJuIGNvZGVBY3Rpb25WaWV3O1xyXG59XHJcblxyXG5jbGFzcyBDb2RlQWN0aW9uc1ZpZXc8VD4gZXh0ZW5kcyBTcGFjZVBlbi5TZWxlY3RMaXN0VmlldyB7XHJcblxyXG4gICAgcHJpdmF0ZSBfb3ZlcmxheURlY29yYXRpb246IGFueTtcclxuICAgIHByaXZhdGUgX3ZpbU1vZGU6IGJvb2xlYW47XHJcbiAgICBwcml2YXRlIF9lZGl0b3JFbGVtZW50OiBhbnk7XHJcblxyXG4gICAgY29uc3RydWN0b3IocHVibGljIG9wdGlvbnM6IFNlbGVjdExpc3RWaWV3T3B0aW9uczxUPiwgcHVibGljIGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yKSB7XHJcbiAgICAgICAgc3VwZXIoKTtcclxuICAgICAgICB0aGlzLl9lZGl0b3JFbGVtZW50ID0gYXRvbS52aWV3cy5nZXRWaWV3KGVkaXRvcik7XHJcbiAgICAgICAgdGhpcy5fdmltTW9kZSA9IGF0b20ucGFja2FnZXMuaXNQYWNrYWdlQWN0aXZlKFwidmltLW1vZGVcIik7XHJcbiAgICAgICAgdGhpcy4kLmFkZENsYXNzKFwiY29kZS1hY3Rpb25zLW92ZXJsYXlcIik7XHJcbiAgICAgICAgKDxhbnk+dGhpcykuZmlsdGVyRWRpdG9yVmlldy5tb2RlbC5wbGFjZWhvbGRlclRleHQgPSBcIkZpbHRlciBsaXN0XCI7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0ICQoKTogSlF1ZXJ5IHtcclxuICAgICAgICByZXR1cm4gPGFueT50aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzZXRJdGVtcygpIHtcclxuICAgICAgICAvL3N1cGVyLnNldEl0ZW1zKHRoaXMub3B0aW9ucy5pdGVtcylcclxuICAgICAgICBTcGFjZVBlbi5TZWxlY3RMaXN0Vmlldy5wcm90b3R5cGUuc2V0SXRlbXMuY2FsbCh0aGlzLCB0aGlzLm9wdGlvbnMuaXRlbXMpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBjb25maXJtZWQoaXRlbTogYW55KTogYW55IHtcclxuICAgICAgICB0aGlzLmNhbmNlbCgpOyAvL3dpbGwgY2xvc2UgdGhlIHZpZXdcclxuXHJcbiAgICAgICAgdGhpcy5vcHRpb25zLmNvbmZpcm1lZChpdGVtKTtcclxuXHJcbiAgICAgICAgdGhpcy5lbmFibGVWaW1Nb2RlKCk7XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHNob3coKSB7XHJcbiAgICAgICAgdGhpcy5zdG9yZUZvY3VzZWRFbGVtZW50KCk7XHJcbiAgICAgICAgdGhpcy5kaXNhYmxlVmltTW9kZSgpO1xyXG4gICAgICAgIHRoaXMuZGVzdHJveU92ZXJsYXkoKTtcclxuICAgICAgICB0aGlzLl9vdmVybGF5RGVjb3JhdGlvbiA9IHRoaXMuZWRpdG9yLmRlY29yYXRlTWFya2VyKHRoaXMuZWRpdG9yLmdldExhc3RDdXJzb3IoKS5nZXRNYXJrZXIoKSxcclxuICAgICAgICAgICAgeyB0eXBlOiBcIm92ZXJsYXlcIiwgcG9zaXRpb246IFwidGFpbFwiLCBpdGVtOiB0aGlzIH0pO1xyXG5cclxuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHRoaXMuZm9jdXNGaWx0ZXJFZGl0b3IoKSwgMTAwKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgaGlkZSgpIHtcclxuICAgICAgICB0aGlzLnJlc3RvcmVGb2N1cygpO1xyXG4gICAgICAgIHRoaXMuZW5hYmxlVmltTW9kZSgpO1xyXG4gICAgICAgIHRoaXMuZGVzdHJveU92ZXJsYXkoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGVzdHJveU92ZXJsYXkoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuX292ZXJsYXlEZWNvcmF0aW9uKVxyXG4gICAgICAgICAgICB0aGlzLl9vdmVybGF5RGVjb3JhdGlvbi5kZXN0cm95KCk7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIHB1YmxpYyBjYW5jZWxsZWQoKSB7XHJcbiAgICAgICAgdGhpcy5oaWRlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGVuYWJsZVZpbU1vZGUoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuX3ZpbU1vZGUpIHtcclxuICAgICAgICAgICAgdGhpcy5fZWRpdG9yRWxlbWVudC5jbGFzc0xpc3QuYWRkKFwidmltLW1vZGVcIik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkaXNhYmxlVmltTW9kZSgpIHtcclxuICAgICAgICBpZiAodGhpcy5fdmltTW9kZSkge1xyXG4gICAgICAgICAgICB0aGlzLl9lZGl0b3JFbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoXCJ2aW0tbW9kZVwiKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldEZpbHRlcktleSgpIHsgcmV0dXJuIFwiTmFtZVwiOyB9XHJcblxyXG4gICAgcHVibGljIHZpZXdGb3JJdGVtKGl0ZW06IGFueSkge1xyXG5cclxuICAgICAgICByZXR1cm4gU3BhY2VQZW4uJCQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmxpKHtcclxuICAgICAgICAgICAgICAgIFwiY2xhc3NcIjogXCJldmVudFwiLFxyXG4gICAgICAgICAgICAgICAgXCJkYXRhLWV2ZW50LW5hbWVcIjogaXRlbS5OYW1lXHJcbiAgICAgICAgICAgIH0sICgpID0+IHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnNwYW4oaXRlbS5OYW1lLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGl0bGU6IGl0ZW0uTmFtZVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59XHJcbiIsImltcG9ydCAqIGFzIFNwYWNlUGVuIGZyb20gXCJhdG9tLXNwYWNlLXBlbi12aWV3c1wiO1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gKG9wdGlvbnMsIGVkaXRvcikge1xuICAgIGxldCBjb2RlQWN0aW9uVmlldyA9IGVkaXRvci5jb2RlQWN0aW9uVmlldztcbiAgICBpZiAoIWNvZGVBY3Rpb25WaWV3KSB7XG4gICAgICAgIGVkaXRvci5jb2RlQWN0aW9uVmlldyA9IGNvZGVBY3Rpb25WaWV3ID0gbmV3IENvZGVBY3Rpb25zVmlldyhvcHRpb25zLCBlZGl0b3IpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgY29kZUFjdGlvblZpZXcub3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgfVxuICAgIGNvZGVBY3Rpb25WaWV3LnNldEl0ZW1zKCk7XG4gICAgY29kZUFjdGlvblZpZXcuc2hvdygpO1xuICAgIHJldHVybiBjb2RlQWN0aW9uVmlldztcbn1cbmNsYXNzIENvZGVBY3Rpb25zVmlldyBleHRlbmRzIFNwYWNlUGVuLlNlbGVjdExpc3RWaWV3IHtcbiAgICBjb25zdHJ1Y3RvcihvcHRpb25zLCBlZGl0b3IpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICAgICAgdGhpcy5lZGl0b3IgPSBlZGl0b3I7XG4gICAgICAgIHRoaXMuX2VkaXRvckVsZW1lbnQgPSBhdG9tLnZpZXdzLmdldFZpZXcoZWRpdG9yKTtcbiAgICAgICAgdGhpcy5fdmltTW9kZSA9IGF0b20ucGFja2FnZXMuaXNQYWNrYWdlQWN0aXZlKFwidmltLW1vZGVcIik7XG4gICAgICAgIHRoaXMuJC5hZGRDbGFzcyhcImNvZGUtYWN0aW9ucy1vdmVybGF5XCIpO1xuICAgICAgICB0aGlzLmZpbHRlckVkaXRvclZpZXcubW9kZWwucGxhY2Vob2xkZXJUZXh0ID0gXCJGaWx0ZXIgbGlzdFwiO1xuICAgIH1cbiAgICBnZXQgJCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIHNldEl0ZW1zKCkge1xuICAgICAgICBTcGFjZVBlbi5TZWxlY3RMaXN0Vmlldy5wcm90b3R5cGUuc2V0SXRlbXMuY2FsbCh0aGlzLCB0aGlzLm9wdGlvbnMuaXRlbXMpO1xuICAgIH1cbiAgICBjb25maXJtZWQoaXRlbSkge1xuICAgICAgICB0aGlzLmNhbmNlbCgpO1xuICAgICAgICB0aGlzLm9wdGlvbnMuY29uZmlybWVkKGl0ZW0pO1xuICAgICAgICB0aGlzLmVuYWJsZVZpbU1vZGUoKTtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHNob3coKSB7XG4gICAgICAgIHRoaXMuc3RvcmVGb2N1c2VkRWxlbWVudCgpO1xuICAgICAgICB0aGlzLmRpc2FibGVWaW1Nb2RlKCk7XG4gICAgICAgIHRoaXMuZGVzdHJveU92ZXJsYXkoKTtcbiAgICAgICAgdGhpcy5fb3ZlcmxheURlY29yYXRpb24gPSB0aGlzLmVkaXRvci5kZWNvcmF0ZU1hcmtlcih0aGlzLmVkaXRvci5nZXRMYXN0Q3Vyc29yKCkuZ2V0TWFya2VyKCksIHsgdHlwZTogXCJvdmVybGF5XCIsIHBvc2l0aW9uOiBcInRhaWxcIiwgaXRlbTogdGhpcyB9KTtcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLmZvY3VzRmlsdGVyRWRpdG9yKCksIDEwMCk7XG4gICAgfVxuICAgIGhpZGUoKSB7XG4gICAgICAgIHRoaXMucmVzdG9yZUZvY3VzKCk7XG4gICAgICAgIHRoaXMuZW5hYmxlVmltTW9kZSgpO1xuICAgICAgICB0aGlzLmRlc3Ryb3lPdmVybGF5KCk7XG4gICAgfVxuICAgIGRlc3Ryb3lPdmVybGF5KCkge1xuICAgICAgICBpZiAodGhpcy5fb3ZlcmxheURlY29yYXRpb24pXG4gICAgICAgICAgICB0aGlzLl9vdmVybGF5RGVjb3JhdGlvbi5kZXN0cm95KCk7XG4gICAgfVxuICAgIGNhbmNlbGxlZCgpIHtcbiAgICAgICAgdGhpcy5oaWRlKCk7XG4gICAgfVxuICAgIGVuYWJsZVZpbU1vZGUoKSB7XG4gICAgICAgIGlmICh0aGlzLl92aW1Nb2RlKSB7XG4gICAgICAgICAgICB0aGlzLl9lZGl0b3JFbGVtZW50LmNsYXNzTGlzdC5hZGQoXCJ2aW0tbW9kZVwiKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBkaXNhYmxlVmltTW9kZSgpIHtcbiAgICAgICAgaWYgKHRoaXMuX3ZpbU1vZGUpIHtcbiAgICAgICAgICAgIHRoaXMuX2VkaXRvckVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZShcInZpbS1tb2RlXCIpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGdldEZpbHRlcktleSgpIHsgcmV0dXJuIFwiTmFtZVwiOyB9XG4gICAgdmlld0Zvckl0ZW0oaXRlbSkge1xuICAgICAgICByZXR1cm4gU3BhY2VQZW4uJCQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMubGkoe1xuICAgICAgICAgICAgICAgIFwiY2xhc3NcIjogXCJldmVudFwiLFxuICAgICAgICAgICAgICAgIFwiZGF0YS1ldmVudC1uYW1lXCI6IGl0ZW0uTmFtZVxuICAgICAgICAgICAgfSwgKCkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnNwYW4oaXRlbS5OYW1lLCB7XG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOiBpdGVtLk5hbWVcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG59XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
