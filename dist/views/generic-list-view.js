"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.GenericSelectListView = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _atomSpacePenViews = require("atom-space-pen-views");

var spacePen = _interopRequireWildcard(_atomSpacePenViews);

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _rxjs = require("rxjs");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var GenericSelectListView = exports.GenericSelectListView = function (_spacePen$SelectListV) {
    _inherits(GenericSelectListView, _spacePen$SelectListV);

    function GenericSelectListView(messageText, _items, onConfirm, onCancel) {
        _classCallCheck(this, GenericSelectListView);

        var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(GenericSelectListView).call(this));

        _this.messageText = messageText;
        _this._items = _items;
        _this.onConfirm = onConfirm;
        _this.onCancel = onCancel;
        _this._onClosed = new _rxjs.AsyncSubject();
        _this.keyBindings = null;
        return _this;
    }

    _createClass(GenericSelectListView, [{
        key: "initialize",
        value: function initialize() {
            spacePen.SelectListView.prototype.initialize.call(this);
            this.addClass("generic-list");
            this.message.text(this.messageText);
            return false;
        }
    }, {
        key: "getFilterKey",
        value: function getFilterKey() {
            return "displayName";
        }
    }, {
        key: "cancelled",
        value: function cancelled() {
            this.onCancel();
            return this.hide();
        }
    }, {
        key: "toggle",
        value: function toggle() {
            if (this.panel && this.panel.isVisible()) {
                this.cancel();
            } else {
                this.show();
            }
        }
    }, {
        key: "show",
        value: function show() {
            if (this.panel == null) {
                this.panel = atom.workspace.addModalPanel({ item: this });
            }
            this.panel.show();
            this.storeFocusedElement();
            if (this.previouslyFocusedElement[0] && this.previouslyFocusedElement[0] !== document.body) {
                this.eventElement = this.previouslyFocusedElement[0];
            } else {
                this.eventElement = atom.views.getView(atom.workspace);
            }
            this.keyBindings = atom.keymaps.findKeyBindings({
                target: this.eventElement
            });
            var commands = _lodash2.default.sortBy(this._items, "displayName");
            this.setItems(commands);
            this.focusFilterEditor();
        }
    }, {
        key: "hide",
        value: function hide() {
            this._onClosed.next(true);
            this._onClosed.complete();
            if (this.panel) {
                this.panel.hide();
            }
            this.panel.destroy();
            this.panel = null;
        }
    }, {
        key: "viewForItem",
        value: function viewForItem(item) {
            return spacePen.$$(function () {
                var _this2 = this;

                return this.li({
                    "class": "event",
                    "data-event-name": item.name
                }, function () {
                    return _this2.span(item.displayName, {
                        title: item.name
                    });
                });
            });
        }
    }, {
        key: "confirmed",
        value: function confirmed(item) {
            this.onConfirm(item.name);
            this.cancel();
            return null;
        }
    }, {
        key: "onClosed",
        get: function get() {
            return this._onClosed;
        }
    }], [{
        key: "content",
        value: function content() {
            var _this3 = this;

            return this.div({}, function () {
                _this3.p({
                    outlet: "message"
                }, "");
                spacePen.SelectListView.content.call(_this3);
            });
        }
    }]);

    return GenericSelectListView;
}(spacePen.SelectListView);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy9nZW5lcmljLWxpc3Qtdmlldy5qcyIsImxpYi92aWV3cy9nZW5lcmljLWxpc3Qtdmlldy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7SUNBWSxROztBRENaOzs7O0FBQ0E7Ozs7Ozs7Ozs7OztJQ0VBLHFCLFdBQUEscUI7OztBQW1CSSxtQ0FBb0IsV0FBcEIsRUFBZ0QsTUFBaEQsRUFBeUcsU0FBekcsRUFBa0osUUFBbEosRUFBc0s7QUFBQTs7QUFBQTs7QUFBbEosY0FBQSxXQUFBLEdBQUEsV0FBQTtBQUE0QixjQUFBLE1BQUEsR0FBQSxNQUFBO0FBQXlELGNBQUEsU0FBQSxHQUFBLFNBQUE7QUFBeUMsY0FBQSxRQUFBLEdBQUEsUUFBQTtBQUwxSSxjQUFBLFNBQUEsR0FBWSx3QkFBWjtBQVNELGNBQUEsV0FBQSxHQUFtQixJQUFuQjtBQUorSjtBQUVySzs7OztxQ0FJZ0I7QUFDUCxxQkFBUyxjQUFULENBQXlCLFNBQXpCLENBQW1DLFVBQW5DLENBQThDLElBQTlDLENBQW1ELElBQW5EO0FBQ04saUJBQUssUUFBTCxDQUFjLGNBQWQ7QUFDQSxpQkFBSyxPQUFMLENBQWEsSUFBYixDQUFrQixLQUFLLFdBQXZCO0FBRUEsbUJBQU8sS0FBUDtBQUNIOzs7dUNBRWtCO0FBQ2YsbUJBQU8sYUFBUDtBQUNIOzs7b0NBRWU7QUFDWixpQkFBSyxRQUFMO0FBQ0EsbUJBQU8sS0FBSyxJQUFMLEVBQVA7QUFDSDs7O2lDQUVZO0FBQ1QsZ0JBQUksS0FBSyxLQUFMLElBQWMsS0FBSyxLQUFMLENBQVcsU0FBWCxFQUFsQixFQUEwQztBQUN0QyxxQkFBSyxNQUFMO0FBQ0gsYUFGRCxNQUVPO0FBQ0gscUJBQUssSUFBTDtBQUNIO0FBQ0o7OzsrQkFFVTtBQUNQLGdCQUFJLEtBQUssS0FBTCxJQUFjLElBQWxCLEVBQXdCO0FBQ3BCLHFCQUFLLEtBQUwsR0FBYSxLQUFLLFNBQUwsQ0FBZSxhQUFmLENBQTZCLEVBQUUsTUFBTSxJQUFSLEVBQTdCLENBQWI7QUFDSDtBQUNELGlCQUFLLEtBQUwsQ0FBVyxJQUFYO0FBQ0EsaUJBQUssbUJBQUw7QUFFQSxnQkFBSSxLQUFLLHdCQUFMLENBQThCLENBQTlCLEtBQW9DLEtBQUssd0JBQUwsQ0FBOEIsQ0FBOUIsTUFBcUMsU0FBUyxJQUF0RixFQUE0RjtBQUN4RixxQkFBSyxZQUFMLEdBQW9CLEtBQUssd0JBQUwsQ0FBOEIsQ0FBOUIsQ0FBcEI7QUFDSCxhQUZELE1BRU87QUFDSCxxQkFBSyxZQUFMLEdBQW9CLEtBQUssS0FBTCxDQUFXLE9BQVgsQ0FBbUIsS0FBSyxTQUF4QixDQUFwQjtBQUNIO0FBRUQsaUJBQUssV0FBTCxHQUFtQixLQUFLLE9BQUwsQ0FBYSxlQUFiLENBQTZCO0FBQzVDLHdCQUFRLEtBQUs7QUFEK0IsYUFBN0IsQ0FBbkI7QUFLQSxnQkFBTSxXQUFXLGlCQUFFLE1BQUYsQ0FBUyxLQUFLLE1BQWQsRUFBc0IsYUFBdEIsQ0FBakI7QUFDQSxpQkFBSyxRQUFMLENBQWMsUUFBZDtBQUNBLGlCQUFLLGlCQUFMO0FBQ0g7OzsrQkFFVTtBQUNQLGlCQUFLLFNBQUwsQ0FBZSxJQUFmLENBQW9CLElBQXBCO0FBQ0EsaUJBQUssU0FBTCxDQUFlLFFBQWY7QUFFQSxnQkFBSSxLQUFLLEtBQVQsRUFBZ0I7QUFDWixxQkFBSyxLQUFMLENBQVcsSUFBWDtBQUNIO0FBQ0QsaUJBQUssS0FBTCxDQUFXLE9BQVg7QUFDQSxpQkFBSyxLQUFMLEdBQWEsSUFBYjtBQUNIOzs7b0NBRWtCLEksRUFBNEM7QUFDM0QsbUJBQU8sU0FBUyxFQUFULENBQVksWUFBQTtBQUFBOztBQUNmLHVCQUFPLEtBQUssRUFBTCxDQUFRO0FBQ1gsNkJBQVMsT0FERTtBQUVYLHVDQUFtQixLQUFLO0FBRmIsaUJBQVIsRUFHSixZQUFBO0FBQ0MsMkJBQU8sT0FBSyxJQUFMLENBQVUsS0FBSyxXQUFmLEVBQTRCO0FBQy9CLCtCQUFPLEtBQUs7QUFEbUIscUJBQTVCLENBQVA7QUFHSCxpQkFQTSxDQUFQO0FBUUgsYUFUTSxDQUFQO0FBVUg7OztrQ0FFZ0IsSSxFQUFVO0FBQ3ZCLGlCQUFLLFNBQUwsQ0FBZSxLQUFLLElBQXBCO0FBQ0EsaUJBQUssTUFBTDtBQUVBLG1CQUFPLElBQVA7QUFDSDs7OzRCQXZGa0I7QUFBSyxtQkFBTyxLQUFLLFNBQVo7QUFBd0I7OztrQ0FkM0I7QUFBQTs7QUFDakIsbUJBQU8sS0FBSyxHQUFMLENBQVMsRUFBVCxFQUFhLFlBQUE7QUFDaEIsdUJBQUssQ0FBTCxDQUFPO0FBQ0gsNEJBQVE7QUFETCxpQkFBUCxFQUVHLEVBRkg7QUFJTSx5QkFBUyxjQUFULENBQXlCLE9BQXpCLENBQWlDLElBQWpDO0FBQ1QsYUFOTSxDQUFQO0FBT0g7Ozs7RUFUc0MsU0FBUyxjIiwiZmlsZSI6ImxpYi92aWV3cy9nZW5lcmljLWxpc3Qtdmlldy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHNwYWNlUGVuIGZyb20gXCJhdG9tLXNwYWNlLXBlbi12aWV3c1wiO1xuaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xuaW1wb3J0IHsgQXN5bmNTdWJqZWN0IH0gZnJvbSBcInJ4anNcIjtcbmV4cG9ydCBjbGFzcyBHZW5lcmljU2VsZWN0TGlzdFZpZXcgZXh0ZW5kcyBzcGFjZVBlbi5TZWxlY3RMaXN0VmlldyB7XG4gICAgY29uc3RydWN0b3IobWVzc2FnZVRleHQsIF9pdGVtcywgb25Db25maXJtLCBvbkNhbmNlbCkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLm1lc3NhZ2VUZXh0ID0gbWVzc2FnZVRleHQ7XG4gICAgICAgIHRoaXMuX2l0ZW1zID0gX2l0ZW1zO1xuICAgICAgICB0aGlzLm9uQ29uZmlybSA9IG9uQ29uZmlybTtcbiAgICAgICAgdGhpcy5vbkNhbmNlbCA9IG9uQ2FuY2VsO1xuICAgICAgICB0aGlzLl9vbkNsb3NlZCA9IG5ldyBBc3luY1N1YmplY3QoKTtcbiAgICAgICAgdGhpcy5rZXlCaW5kaW5ncyA9IG51bGw7XG4gICAgfVxuICAgIHN0YXRpYyBjb250ZW50KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5kaXYoe30sICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMucCh7XG4gICAgICAgICAgICAgICAgb3V0bGV0OiBcIm1lc3NhZ2VcIlxuICAgICAgICAgICAgfSwgXCJcIik7XG4gICAgICAgICAgICBzcGFjZVBlbi5TZWxlY3RMaXN0Vmlldy5jb250ZW50LmNhbGwodGhpcyk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBnZXQgb25DbG9zZWQoKSB7IHJldHVybiB0aGlzLl9vbkNsb3NlZDsgfVxuICAgIGluaXRpYWxpemUoKSB7XG4gICAgICAgIHNwYWNlUGVuLlNlbGVjdExpc3RWaWV3LnByb3RvdHlwZS5pbml0aWFsaXplLmNhbGwodGhpcyk7XG4gICAgICAgIHRoaXMuYWRkQ2xhc3MoXCJnZW5lcmljLWxpc3RcIik7XG4gICAgICAgIHRoaXMubWVzc2FnZS50ZXh0KHRoaXMubWVzc2FnZVRleHQpO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGdldEZpbHRlcktleSgpIHtcbiAgICAgICAgcmV0dXJuIFwiZGlzcGxheU5hbWVcIjtcbiAgICB9XG4gICAgY2FuY2VsbGVkKCkge1xuICAgICAgICB0aGlzLm9uQ2FuY2VsKCk7XG4gICAgICAgIHJldHVybiB0aGlzLmhpZGUoKTtcbiAgICB9XG4gICAgdG9nZ2xlKCkge1xuICAgICAgICBpZiAodGhpcy5wYW5lbCAmJiB0aGlzLnBhbmVsLmlzVmlzaWJsZSgpKSB7XG4gICAgICAgICAgICB0aGlzLmNhbmNlbCgpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5zaG93KCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgc2hvdygpIHtcbiAgICAgICAgaWYgKHRoaXMucGFuZWwgPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5wYW5lbCA9IGF0b20ud29ya3NwYWNlLmFkZE1vZGFsUGFuZWwoeyBpdGVtOiB0aGlzIH0pO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucGFuZWwuc2hvdygpO1xuICAgICAgICB0aGlzLnN0b3JlRm9jdXNlZEVsZW1lbnQoKTtcbiAgICAgICAgaWYgKHRoaXMucHJldmlvdXNseUZvY3VzZWRFbGVtZW50WzBdICYmIHRoaXMucHJldmlvdXNseUZvY3VzZWRFbGVtZW50WzBdICE9PSBkb2N1bWVudC5ib2R5KSB7XG4gICAgICAgICAgICB0aGlzLmV2ZW50RWxlbWVudCA9IHRoaXMucHJldmlvdXNseUZvY3VzZWRFbGVtZW50WzBdO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5ldmVudEVsZW1lbnQgPSBhdG9tLnZpZXdzLmdldFZpZXcoYXRvbS53b3Jrc3BhY2UpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMua2V5QmluZGluZ3MgPSBhdG9tLmtleW1hcHMuZmluZEtleUJpbmRpbmdzKHtcbiAgICAgICAgICAgIHRhcmdldDogdGhpcy5ldmVudEVsZW1lbnRcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IGNvbW1hbmRzID0gXy5zb3J0QnkodGhpcy5faXRlbXMsIFwiZGlzcGxheU5hbWVcIik7XG4gICAgICAgIHRoaXMuc2V0SXRlbXMoY29tbWFuZHMpO1xuICAgICAgICB0aGlzLmZvY3VzRmlsdGVyRWRpdG9yKCk7XG4gICAgfVxuICAgIGhpZGUoKSB7XG4gICAgICAgIHRoaXMuX29uQ2xvc2VkLm5leHQodHJ1ZSk7XG4gICAgICAgIHRoaXMuX29uQ2xvc2VkLmNvbXBsZXRlKCk7XG4gICAgICAgIGlmICh0aGlzLnBhbmVsKSB7XG4gICAgICAgICAgICB0aGlzLnBhbmVsLmhpZGUoKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnBhbmVsLmRlc3Ryb3koKTtcbiAgICAgICAgdGhpcy5wYW5lbCA9IG51bGw7XG4gICAgfVxuICAgIHZpZXdGb3JJdGVtKGl0ZW0pIHtcbiAgICAgICAgcmV0dXJuIHNwYWNlUGVuLiQkKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmxpKHtcbiAgICAgICAgICAgICAgICBcImNsYXNzXCI6IFwiZXZlbnRcIixcbiAgICAgICAgICAgICAgICBcImRhdGEtZXZlbnQtbmFtZVwiOiBpdGVtLm5hbWVcbiAgICAgICAgICAgIH0sICgpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zcGFuKGl0ZW0uZGlzcGxheU5hbWUsIHtcbiAgICAgICAgICAgICAgICAgICAgdGl0bGU6IGl0ZW0ubmFtZVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBjb25maXJtZWQoaXRlbSkge1xuICAgICAgICB0aGlzLm9uQ29uZmlybShpdGVtLm5hbWUpO1xuICAgICAgICB0aGlzLmNhbmNlbCgpO1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59XG4iLCJpbXBvcnQgKiBhcyBzcGFjZVBlbiBmcm9tIFwiYXRvbS1zcGFjZS1wZW4tdmlld3NcIjtcclxuaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xyXG5pbXBvcnQge0FzeW5jU3ViamVjdH0gZnJvbSBcInJ4anNcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBHZW5lcmljU2VsZWN0TGlzdFZpZXcgZXh0ZW5kcyBzcGFjZVBlbi5TZWxlY3RMaXN0VmlldyB7XHJcbiAgICBwdWJsaWMgc3RhdGljIGNvbnRlbnQoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZGl2KHt9LCAoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMucCh7XHJcbiAgICAgICAgICAgICAgICBvdXRsZXQ6IFwibWVzc2FnZVwiXHJcbiAgICAgICAgICAgIH0sIFwiXCIpO1xyXG5cclxuICAgICAgICAgICAgKDxhbnk+c3BhY2VQZW4uU2VsZWN0TGlzdFZpZXcpLmNvbnRlbnQuY2FsbCh0aGlzKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHBhbmVsOiBBdG9tLlBhbmVsO1xyXG4gICAgcHJpdmF0ZSBwcmV2aW91c2x5Rm9jdXNlZEVsZW1lbnQ6IE5vZGU7XHJcbiAgICBwcml2YXRlIGV2ZW50RWxlbWVudDogYW55O1xyXG4gICAgcHJpdmF0ZSBfb25DbG9zZWQgPSBuZXcgQXN5bmNTdWJqZWN0PGJvb2xlYW4+KCk7XHJcbiAgICBwdWJsaWMgZ2V0IG9uQ2xvc2VkKCkgeyByZXR1cm4gdGhpcy5fb25DbG9zZWQ7IH1cclxuXHJcbiAgICBwdWJsaWMgbWVzc2FnZTogSlF1ZXJ5O1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgbWVzc2FnZVRleHQ6IHN0cmluZywgcHVibGljIF9pdGVtczogeyBkaXNwbGF5TmFtZTogc3RyaW5nOyBuYW1lOiBzdHJpbmc7IH1bXSwgcHVibGljIG9uQ29uZmlybTogKHJlc3VsdDogYW55KSA9PiB2b2lkLCBwdWJsaWMgb25DYW5jZWw6ICgpID0+IHZvaWQpIHtcclxuICAgICAgICBzdXBlcigpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBrZXlCaW5kaW5nczogYW55ID0gbnVsbDtcclxuXHJcbiAgICBwdWJsaWMgaW5pdGlhbGl6ZSgpIHtcclxuICAgICAgICAoPGFueT5zcGFjZVBlbi5TZWxlY3RMaXN0VmlldykucHJvdG90eXBlLmluaXRpYWxpemUuY2FsbCh0aGlzKTtcclxuICAgICAgICB0aGlzLmFkZENsYXNzKFwiZ2VuZXJpYy1saXN0XCIpO1xyXG4gICAgICAgIHRoaXMubWVzc2FnZS50ZXh0KHRoaXMubWVzc2FnZVRleHQpO1xyXG5cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldEZpbHRlcktleSgpIHtcclxuICAgICAgICByZXR1cm4gXCJkaXNwbGF5TmFtZVwiO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBjYW5jZWxsZWQoKSB7XHJcbiAgICAgICAgdGhpcy5vbkNhbmNlbCgpO1xyXG4gICAgICAgIHJldHVybiB0aGlzLmhpZGUoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgdG9nZ2xlKCkge1xyXG4gICAgICAgIGlmICh0aGlzLnBhbmVsICYmIHRoaXMucGFuZWwuaXNWaXNpYmxlKCkpIHtcclxuICAgICAgICAgICAgdGhpcy5jYW5jZWwoKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLnNob3coKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHNob3coKSB7XHJcbiAgICAgICAgaWYgKHRoaXMucGFuZWwgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICB0aGlzLnBhbmVsID0gYXRvbS53b3Jrc3BhY2UuYWRkTW9kYWxQYW5lbCh7IGl0ZW06IHRoaXMgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMucGFuZWwuc2hvdygpO1xyXG4gICAgICAgIHRoaXMuc3RvcmVGb2N1c2VkRWxlbWVudCgpO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5wcmV2aW91c2x5Rm9jdXNlZEVsZW1lbnRbMF0gJiYgdGhpcy5wcmV2aW91c2x5Rm9jdXNlZEVsZW1lbnRbMF0gIT09IGRvY3VtZW50LmJvZHkpIHtcclxuICAgICAgICAgICAgdGhpcy5ldmVudEVsZW1lbnQgPSB0aGlzLnByZXZpb3VzbHlGb2N1c2VkRWxlbWVudFswXTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLmV2ZW50RWxlbWVudCA9IGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmtleUJpbmRpbmdzID0gYXRvbS5rZXltYXBzLmZpbmRLZXlCaW5kaW5ncyh7XHJcbiAgICAgICAgICAgIHRhcmdldDogdGhpcy5ldmVudEVsZW1lbnRcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gaW5mZXIgdGhlIGdlbmVyYXRvciBzb21laG93PyBiYXNlZCBvbiB0aGUgcHJvamVjdCBpbmZvcm1hdGlvbj8gIHN0b3JlIGluIHRoZSBwcm9qZWN0IHN5c3RlbT8/XHJcbiAgICAgICAgY29uc3QgY29tbWFuZHMgPSBfLnNvcnRCeSh0aGlzLl9pdGVtcywgXCJkaXNwbGF5TmFtZVwiKTtcclxuICAgICAgICB0aGlzLnNldEl0ZW1zKGNvbW1hbmRzKTtcclxuICAgICAgICB0aGlzLmZvY3VzRmlsdGVyRWRpdG9yKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGhpZGUoKSB7XHJcbiAgICAgICAgdGhpcy5fb25DbG9zZWQubmV4dCh0cnVlKTtcclxuICAgICAgICB0aGlzLl9vbkNsb3NlZC5jb21wbGV0ZSgpO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5wYW5lbCkge1xyXG4gICAgICAgICAgICB0aGlzLnBhbmVsLmhpZGUoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5wYW5lbC5kZXN0cm95KCk7XHJcbiAgICAgICAgdGhpcy5wYW5lbCA9IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHZpZXdGb3JJdGVtKGl0ZW06IHsgZGlzcGxheU5hbWU6IHN0cmluZzsgbmFtZTogc3RyaW5nOyB9KSB7XHJcbiAgICAgICAgcmV0dXJuIHNwYWNlUGVuLiQkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5saSh7XHJcbiAgICAgICAgICAgICAgICBcImNsYXNzXCI6IFwiZXZlbnRcIixcclxuICAgICAgICAgICAgICAgIFwiZGF0YS1ldmVudC1uYW1lXCI6IGl0ZW0ubmFtZVxyXG4gICAgICAgICAgICB9LCAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zcGFuKGl0ZW0uZGlzcGxheU5hbWUsIHtcclxuICAgICAgICAgICAgICAgICAgICB0aXRsZTogaXRlbS5uYW1lXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNvbmZpcm1lZChpdGVtPzogYW55KTogc3BhY2VQZW4uVmlldyB7XHJcbiAgICAgICAgdGhpcy5vbkNvbmZpcm0oaXRlbS5uYW1lKTtcclxuICAgICAgICB0aGlzLmNhbmNlbCgpO1xyXG5cclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxufVxyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
