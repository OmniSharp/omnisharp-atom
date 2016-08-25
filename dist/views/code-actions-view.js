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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy9jb2RlLWFjdGlvbnMtdmlldy50cyIsImxpYi92aWV3cy9jb2RlLWFjdGlvbnMtdmlldy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7OztrQkFPQSxVQUE0QixPQUE1QixFQUErRCxNQUEvRCxFQUFzRjtBQUNsRixRQUFJLGlCQUF1QixPQUFRLGNBQVIsQ0FEdUQ7QUFFbEYsUUFBSSxDQUFDLGNBQUQsRUFBaUI7QUFDWCxlQUFRLGNBQVIsR0FBeUIsaUJBQWlCLElBQUksZUFBSixDQUF1QixPQUF2QixFQUFnQyxNQUFoQyxDQUFqQixDQURkO0tBQXJCLE1BRU87QUFDSCx1QkFBZSxPQUFmLEdBQXlCLE9BQXpCLENBREc7S0FGUDtBQU1BLG1CQUFlLFFBQWYsR0FSa0Y7QUFTbEYsbUJBQWUsSUFBZixHQVRrRjtBQVVsRixXQUFPLGNBQVAsQ0FWa0Y7Q0FBdEY7O0FDUEE7O0lEQVk7Ozs7Ozs7Ozs7SUFvQlo7OztBQU1JLDZCQUFtQixPQUFuQixFQUE2RCxNQUE3RCxFQUFvRjs7Ozs7QUFBakUsY0FBQSxPQUFBLEdBQUEsT0FBQSxDQUFpRTtBQUF2QixjQUFBLE1BQUEsR0FBQSxNQUFBLENBQXVCO0FBRWhGLGNBQUssY0FBTCxHQUFzQixLQUFLLEtBQUwsQ0FBVyxPQUFYLENBQW1CLE1BQW5CLENBQXRCLENBRmdGO0FBR2hGLGNBQUssUUFBTCxHQUFnQixLQUFLLFFBQUwsQ0FBYyxlQUFkLENBQThCLFVBQTlCLENBQWhCLENBSGdGO0FBSWhGLGNBQUssQ0FBTCxDQUFPLFFBQVAsQ0FBZ0Isc0JBQWhCLEVBSmdGO0FBSzFFLGNBQU0sZ0JBQU4sQ0FBdUIsS0FBdkIsQ0FBNkIsZUFBN0IsR0FBK0MsYUFBL0MsQ0FMMEU7O0tBQXBGOzs7O21DQVllO0FBRVgscUJBQVMsY0FBVCxDQUF3QixTQUF4QixDQUFrQyxRQUFsQyxDQUEyQyxJQUEzQyxDQUFnRCxJQUFoRCxFQUFzRCxLQUFLLE9BQUwsQ0FBYSxLQUFiLENBQXRELENBRlc7Ozs7a0NBS0UsTUFBUztBQUN0QixpQkFBSyxNQUFMLEdBRHNCO0FBR3RCLGlCQUFLLE9BQUwsQ0FBYSxTQUFiLENBQXVCLElBQXZCLEVBSHNCO0FBS3RCLGlCQUFLLGFBQUwsR0FMc0I7QUFNdEIsbUJBQU8sSUFBUCxDQU5zQjs7OzsrQkFTZjs7O0FBQ1AsaUJBQUssbUJBQUwsR0FETztBQUVQLGlCQUFLLGNBQUwsR0FGTztBQUdQLGlCQUFLLGNBQUwsR0FITztBQUlQLGlCQUFLLGtCQUFMLEdBQTBCLEtBQUssTUFBTCxDQUFZLGNBQVosQ0FBMkIsS0FBSyxNQUFMLENBQVksYUFBWixHQUE0QixTQUE1QixFQUEzQixFQUN0QixFQUFFLE1BQU0sU0FBTixFQUFpQixVQUFVLE1BQVYsRUFBa0IsTUFBTSxJQUFOLEVBRGYsQ0FBMUIsQ0FKTztBQU9QLHVCQUFXO3VCQUFNLE9BQUssaUJBQUw7YUFBTixFQUFnQyxHQUEzQyxFQVBPOzs7OytCQVVBO0FBQ1AsaUJBQUssWUFBTCxHQURPO0FBRVAsaUJBQUssYUFBTCxHQUZPO0FBR1AsaUJBQUssY0FBTCxHQUhPOzs7O3lDQU1VO0FBQ2pCLGdCQUFJLEtBQUssa0JBQUwsRUFDQSxLQUFLLGtCQUFMLENBQXdCLE9BQXhCLEdBREo7Ozs7b0NBS1k7QUFDWixpQkFBSyxJQUFMLEdBRFk7Ozs7d0NBSUk7QUFDaEIsZ0JBQUksS0FBSyxRQUFMLEVBQWU7QUFDZixxQkFBSyxjQUFMLENBQW9CLFNBQXBCLENBQThCLEdBQTlCLENBQWtDLFVBQWxDLEVBRGU7YUFBbkI7Ozs7eUNBS2lCO0FBQ2pCLGdCQUFJLEtBQUssUUFBTCxFQUFlO0FBQ2YscUJBQUssY0FBTCxDQUFvQixTQUFwQixDQUE4QixNQUE5QixDQUFxQyxVQUFyQyxFQURlO2FBQW5COzs7O3VDQUtlO0FBQUssbUJBQU8sTUFBUCxDQUFMOzs7O29DQUVBLE1BQVM7QUFFeEIsbUJBQU8sU0FBUyxFQUFULENBQVksWUFBQTs7O0FBQ2YsdUJBQU8sS0FBSyxFQUFMLENBQVE7QUFDWCw2QkFBUyxPQUFUO0FBQ0EsdUNBQW1CLEtBQUssSUFBTDtpQkFGaEIsRUFHSixZQUFBO0FBQ0MsMkJBQU8sT0FBSyxJQUFMLENBQVUsS0FBSyxJQUFMLEVBQVc7QUFDeEIsK0JBQU8sS0FBSyxJQUFMO3FCQURKLENBQVAsQ0FERDtpQkFBQSxDQUhILENBRGU7YUFBQSxDQUFuQixDQUZ3Qjs7Ozs0QkExRHZCO0FBQ0QsbUJBQVksSUFBWixDQURDOzs7OztFQWR3QixTQUFTLGNBQVQiLCJmaWxlIjoibGliL3ZpZXdzL2NvZGUtYWN0aW9ucy12aWV3LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgU3BhY2VQZW4gZnJvbSBcImF0b20tc3BhY2UtcGVuLXZpZXdzXCI7XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFNlbGVjdExpc3RWaWV3T3B0aW9uczxUPiB7XHJcbiAgICBpdGVtczogVFtdO1xyXG4gICAgY29uZmlybWVkOiAoaXRlbTogVCkgPT4gYW55O1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiA8VD4ob3B0aW9uczogU2VsZWN0TGlzdFZpZXdPcHRpb25zPFQ+LCBlZGl0b3I6IEF0b20uVGV4dEVkaXRvcik6IENvZGVBY3Rpb25zVmlldzxUPiB7XHJcbiAgICBsZXQgY29kZUFjdGlvblZpZXcgPSAoPGFueT5lZGl0b3IpLmNvZGVBY3Rpb25WaWV3O1xyXG4gICAgaWYgKCFjb2RlQWN0aW9uVmlldykge1xyXG4gICAgICAgICg8YW55PmVkaXRvcikuY29kZUFjdGlvblZpZXcgPSBjb2RlQWN0aW9uVmlldyA9IG5ldyBDb2RlQWN0aW9uc1ZpZXc8VD4ob3B0aW9ucywgZWRpdG9yKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgY29kZUFjdGlvblZpZXcub3B0aW9ucyA9IG9wdGlvbnM7XHJcbiAgICB9XHJcblxyXG4gICAgY29kZUFjdGlvblZpZXcuc2V0SXRlbXMoKTtcclxuICAgIGNvZGVBY3Rpb25WaWV3LnNob3coKTtcclxuICAgIHJldHVybiBjb2RlQWN0aW9uVmlldztcclxufVxyXG5cclxuY2xhc3MgQ29kZUFjdGlvbnNWaWV3PFQ+IGV4dGVuZHMgU3BhY2VQZW4uU2VsZWN0TGlzdFZpZXcge1xyXG5cclxuICAgIHByaXZhdGUgX292ZXJsYXlEZWNvcmF0aW9uOiBhbnk7XHJcbiAgICBwcml2YXRlIF92aW1Nb2RlOiBib29sZWFuO1xyXG4gICAgcHJpdmF0ZSBfZWRpdG9yRWxlbWVudDogYW55O1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHB1YmxpYyBvcHRpb25zOiBTZWxlY3RMaXN0Vmlld09wdGlvbnM8VD4sIHB1YmxpYyBlZGl0b3I6IEF0b20uVGV4dEVkaXRvcikge1xyXG4gICAgICAgIHN1cGVyKCk7XHJcbiAgICAgICAgdGhpcy5fZWRpdG9yRWxlbWVudCA9IGF0b20udmlld3MuZ2V0VmlldyhlZGl0b3IpO1xyXG4gICAgICAgIHRoaXMuX3ZpbU1vZGUgPSBhdG9tLnBhY2thZ2VzLmlzUGFja2FnZUFjdGl2ZShcInZpbS1tb2RlXCIpO1xyXG4gICAgICAgIHRoaXMuJC5hZGRDbGFzcyhcImNvZGUtYWN0aW9ucy1vdmVybGF5XCIpO1xyXG4gICAgICAgICg8YW55PnRoaXMpLmZpbHRlckVkaXRvclZpZXcubW9kZWwucGxhY2Vob2xkZXJUZXh0ID0gXCJGaWx0ZXIgbGlzdFwiO1xyXG4gICAgfVxyXG5cclxuICAgIGdldCAkKCk6IEpRdWVyeSB7XHJcbiAgICAgICAgcmV0dXJuIDxhbnk+dGhpcztcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2V0SXRlbXMoKSB7XHJcbiAgICAgICAgLy9zdXBlci5zZXRJdGVtcyh0aGlzLm9wdGlvbnMuaXRlbXMpXHJcbiAgICAgICAgU3BhY2VQZW4uU2VsZWN0TGlzdFZpZXcucHJvdG90eXBlLnNldEl0ZW1zLmNhbGwodGhpcywgdGhpcy5vcHRpb25zLml0ZW1zKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgY29uZmlybWVkKGl0ZW06IGFueSk6IGFueSB7XHJcbiAgICAgICAgdGhpcy5jYW5jZWwoKTsgLy93aWxsIGNsb3NlIHRoZSB2aWV3XHJcblxyXG4gICAgICAgIHRoaXMub3B0aW9ucy5jb25maXJtZWQoaXRlbSk7XHJcblxyXG4gICAgICAgIHRoaXMuZW5hYmxlVmltTW9kZSgpO1xyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzaG93KCkge1xyXG4gICAgICAgIHRoaXMuc3RvcmVGb2N1c2VkRWxlbWVudCgpO1xyXG4gICAgICAgIHRoaXMuZGlzYWJsZVZpbU1vZGUoKTtcclxuICAgICAgICB0aGlzLmRlc3Ryb3lPdmVybGF5KCk7XHJcbiAgICAgICAgdGhpcy5fb3ZlcmxheURlY29yYXRpb24gPSB0aGlzLmVkaXRvci5kZWNvcmF0ZU1hcmtlcih0aGlzLmVkaXRvci5nZXRMYXN0Q3Vyc29yKCkuZ2V0TWFya2VyKCksXHJcbiAgICAgICAgICAgIHsgdHlwZTogXCJvdmVybGF5XCIsIHBvc2l0aW9uOiBcInRhaWxcIiwgaXRlbTogdGhpcyB9KTtcclxuXHJcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLmZvY3VzRmlsdGVyRWRpdG9yKCksIDEwMCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGhpZGUoKSB7XHJcbiAgICAgICAgdGhpcy5yZXN0b3JlRm9jdXMoKTtcclxuICAgICAgICB0aGlzLmVuYWJsZVZpbU1vZGUoKTtcclxuICAgICAgICB0aGlzLmRlc3Ryb3lPdmVybGF5KCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRlc3Ryb3lPdmVybGF5KCkge1xyXG4gICAgICAgIGlmICh0aGlzLl9vdmVybGF5RGVjb3JhdGlvbilcclxuICAgICAgICAgICAgdGhpcy5fb3ZlcmxheURlY29yYXRpb24uZGVzdHJveSgpO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICBwdWJsaWMgY2FuY2VsbGVkKCkge1xyXG4gICAgICAgIHRoaXMuaGlkZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBlbmFibGVWaW1Nb2RlKCkge1xyXG4gICAgICAgIGlmICh0aGlzLl92aW1Nb2RlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2VkaXRvckVsZW1lbnQuY2xhc3NMaXN0LmFkZChcInZpbS1tb2RlXCIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGlzYWJsZVZpbU1vZGUoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuX3ZpbU1vZGUpIHtcclxuICAgICAgICAgICAgdGhpcy5fZWRpdG9yRWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKFwidmltLW1vZGVcIik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXRGaWx0ZXJLZXkoKSB7IHJldHVybiBcIk5hbWVcIjsgfVxyXG5cclxuICAgIHB1YmxpYyB2aWV3Rm9ySXRlbShpdGVtOiBhbnkpIHtcclxuXHJcbiAgICAgICAgcmV0dXJuIFNwYWNlUGVuLiQkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5saSh7XHJcbiAgICAgICAgICAgICAgICBcImNsYXNzXCI6IFwiZXZlbnRcIixcclxuICAgICAgICAgICAgICAgIFwiZGF0YS1ldmVudC1uYW1lXCI6IGl0ZW0uTmFtZVxyXG4gICAgICAgICAgICB9LCAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zcGFuKGl0ZW0uTmFtZSwge1xyXG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOiBpdGVtLk5hbWVcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxufVxyXG4iLCJpbXBvcnQgKiBhcyBTcGFjZVBlbiBmcm9tIFwiYXRvbS1zcGFjZS1wZW4tdmlld3NcIjtcbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIChvcHRpb25zLCBlZGl0b3IpIHtcbiAgICBsZXQgY29kZUFjdGlvblZpZXcgPSBlZGl0b3IuY29kZUFjdGlvblZpZXc7XG4gICAgaWYgKCFjb2RlQWN0aW9uVmlldykge1xuICAgICAgICBlZGl0b3IuY29kZUFjdGlvblZpZXcgPSBjb2RlQWN0aW9uVmlldyA9IG5ldyBDb2RlQWN0aW9uc1ZpZXcob3B0aW9ucywgZWRpdG9yKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGNvZGVBY3Rpb25WaWV3Lm9wdGlvbnMgPSBvcHRpb25zO1xuICAgIH1cbiAgICBjb2RlQWN0aW9uVmlldy5zZXRJdGVtcygpO1xuICAgIGNvZGVBY3Rpb25WaWV3LnNob3coKTtcbiAgICByZXR1cm4gY29kZUFjdGlvblZpZXc7XG59XG5jbGFzcyBDb2RlQWN0aW9uc1ZpZXcgZXh0ZW5kcyBTcGFjZVBlbi5TZWxlY3RMaXN0VmlldyB7XG4gICAgY29uc3RydWN0b3Iob3B0aW9ucywgZWRpdG9yKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgICAgIHRoaXMuZWRpdG9yID0gZWRpdG9yO1xuICAgICAgICB0aGlzLl9lZGl0b3JFbGVtZW50ID0gYXRvbS52aWV3cy5nZXRWaWV3KGVkaXRvcik7XG4gICAgICAgIHRoaXMuX3ZpbU1vZGUgPSBhdG9tLnBhY2thZ2VzLmlzUGFja2FnZUFjdGl2ZShcInZpbS1tb2RlXCIpO1xuICAgICAgICB0aGlzLiQuYWRkQ2xhc3MoXCJjb2RlLWFjdGlvbnMtb3ZlcmxheVwiKTtcbiAgICAgICAgdGhpcy5maWx0ZXJFZGl0b3JWaWV3Lm1vZGVsLnBsYWNlaG9sZGVyVGV4dCA9IFwiRmlsdGVyIGxpc3RcIjtcbiAgICB9XG4gICAgZ2V0ICQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBzZXRJdGVtcygpIHtcbiAgICAgICAgU3BhY2VQZW4uU2VsZWN0TGlzdFZpZXcucHJvdG90eXBlLnNldEl0ZW1zLmNhbGwodGhpcywgdGhpcy5vcHRpb25zLml0ZW1zKTtcbiAgICB9XG4gICAgY29uZmlybWVkKGl0ZW0pIHtcbiAgICAgICAgdGhpcy5jYW5jZWwoKTtcbiAgICAgICAgdGhpcy5vcHRpb25zLmNvbmZpcm1lZChpdGVtKTtcbiAgICAgICAgdGhpcy5lbmFibGVWaW1Nb2RlKCk7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBzaG93KCkge1xuICAgICAgICB0aGlzLnN0b3JlRm9jdXNlZEVsZW1lbnQoKTtcbiAgICAgICAgdGhpcy5kaXNhYmxlVmltTW9kZSgpO1xuICAgICAgICB0aGlzLmRlc3Ryb3lPdmVybGF5KCk7XG4gICAgICAgIHRoaXMuX292ZXJsYXlEZWNvcmF0aW9uID0gdGhpcy5lZGl0b3IuZGVjb3JhdGVNYXJrZXIodGhpcy5lZGl0b3IuZ2V0TGFzdEN1cnNvcigpLmdldE1hcmtlcigpLCB7IHR5cGU6IFwib3ZlcmxheVwiLCBwb3NpdGlvbjogXCJ0YWlsXCIsIGl0ZW06IHRoaXMgfSk7XG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4gdGhpcy5mb2N1c0ZpbHRlckVkaXRvcigpLCAxMDApO1xuICAgIH1cbiAgICBoaWRlKCkge1xuICAgICAgICB0aGlzLnJlc3RvcmVGb2N1cygpO1xuICAgICAgICB0aGlzLmVuYWJsZVZpbU1vZGUoKTtcbiAgICAgICAgdGhpcy5kZXN0cm95T3ZlcmxheSgpO1xuICAgIH1cbiAgICBkZXN0cm95T3ZlcmxheSgpIHtcbiAgICAgICAgaWYgKHRoaXMuX292ZXJsYXlEZWNvcmF0aW9uKVxuICAgICAgICAgICAgdGhpcy5fb3ZlcmxheURlY29yYXRpb24uZGVzdHJveSgpO1xuICAgIH1cbiAgICBjYW5jZWxsZWQoKSB7XG4gICAgICAgIHRoaXMuaGlkZSgpO1xuICAgIH1cbiAgICBlbmFibGVWaW1Nb2RlKCkge1xuICAgICAgICBpZiAodGhpcy5fdmltTW9kZSkge1xuICAgICAgICAgICAgdGhpcy5fZWRpdG9yRWxlbWVudC5jbGFzc0xpc3QuYWRkKFwidmltLW1vZGVcIik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZGlzYWJsZVZpbU1vZGUoKSB7XG4gICAgICAgIGlmICh0aGlzLl92aW1Nb2RlKSB7XG4gICAgICAgICAgICB0aGlzLl9lZGl0b3JFbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoXCJ2aW0tbW9kZVwiKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBnZXRGaWx0ZXJLZXkoKSB7IHJldHVybiBcIk5hbWVcIjsgfVxuICAgIHZpZXdGb3JJdGVtKGl0ZW0pIHtcbiAgICAgICAgcmV0dXJuIFNwYWNlUGVuLiQkKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmxpKHtcbiAgICAgICAgICAgICAgICBcImNsYXNzXCI6IFwiZXZlbnRcIixcbiAgICAgICAgICAgICAgICBcImRhdGEtZXZlbnQtbmFtZVwiOiBpdGVtLk5hbWVcbiAgICAgICAgICAgIH0sICgpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zcGFuKGl0ZW0uTmFtZSwge1xuICAgICAgICAgICAgICAgICAgICB0aXRsZTogaXRlbS5OYW1lXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxufVxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
