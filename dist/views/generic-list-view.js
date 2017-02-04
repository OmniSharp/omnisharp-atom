'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.GenericSelectListView = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _atomSpacePenViews = require('atom-space-pen-views');

var spacePen = _interopRequireWildcard(_atomSpacePenViews);

var _lodash = require('lodash');

var _rxjs = require('rxjs');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var GenericSelectListView = exports.GenericSelectListView = function (_spacePen$SelectListV) {
    _inherits(GenericSelectListView, _spacePen$SelectListV);

    function GenericSelectListView(messageText, _items, onConfirm, onCancel) {
        _classCallCheck(this, GenericSelectListView);

        var _this = _possibleConstructorReturn(this, (GenericSelectListView.__proto__ || Object.getPrototypeOf(GenericSelectListView)).call(this));

        _this.messageText = messageText;
        _this._items = _items;
        _this.onConfirm = onConfirm;
        _this.onCancel = onCancel;
        _this._onClosed = new _rxjs.AsyncSubject();
        _this.keyBindings = null;
        return _this;
    }

    _createClass(GenericSelectListView, [{
        key: 'initialize',
        value: function initialize() {
            spacePen.SelectListView.prototype.initialize.call(this);
            this.addClass('generic-list');
            this.message.text(this.messageText);
            return false;
        }
    }, {
        key: 'getFilterKey',
        value: function getFilterKey() {
            return 'displayName';
        }
    }, {
        key: 'cancelled',
        value: function cancelled() {
            this.onCancel();
            return this.hide();
        }
    }, {
        key: 'toggle',
        value: function toggle() {
            if (this.panel && this.panel.isVisible()) {
                this.cancel();
            } else {
                this.show();
            }
        }
    }, {
        key: 'show',
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
            var commands = (0, _lodash.sortBy)(this._items, function (x) {
                return x.displayName;
            });
            this.setItems(commands);
            this.focusFilterEditor();
        }
    }, {
        key: 'hide',
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
        key: 'viewForItem',
        value: function viewForItem(item) {
            return spacePen.$$(function () {
                var _this2 = this;

                return this.li({
                    'class': 'event',
                    'data-event-name': item.name
                }, function () {
                    return _this2.span(item.displayName, {
                        title: item.name
                    });
                });
            });
        }
    }, {
        key: 'confirmed',
        value: function confirmed(item) {
            this.onConfirm(item.name);
            this.cancel();
            return null;
        }
    }, {
        key: 'onClosed',
        get: function get() {
            return this._onClosed;
        }
    }], [{
        key: 'content',
        value: function content() {
            var _this3 = this;

            return this.div({}, function () {
                _this3.p({
                    outlet: 'message'
                }, '');
                spacePen.SelectListView.content.call(_this3);
            });
        }
    }]);

    return GenericSelectListView;
}(spacePen.SelectListView);
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy9nZW5lcmljLWxpc3Qtdmlldy50cyJdLCJuYW1lcyI6WyJzcGFjZVBlbiIsIkdlbmVyaWNTZWxlY3RMaXN0VmlldyIsIm1lc3NhZ2VUZXh0IiwiX2l0ZW1zIiwib25Db25maXJtIiwib25DYW5jZWwiLCJfb25DbG9zZWQiLCJrZXlCaW5kaW5ncyIsIlNlbGVjdExpc3RWaWV3IiwicHJvdG90eXBlIiwiaW5pdGlhbGl6ZSIsImNhbGwiLCJhZGRDbGFzcyIsIm1lc3NhZ2UiLCJ0ZXh0IiwiaGlkZSIsInBhbmVsIiwiaXNWaXNpYmxlIiwiY2FuY2VsIiwic2hvdyIsImF0b20iLCJ3b3Jrc3BhY2UiLCJhZGRNb2RhbFBhbmVsIiwiaXRlbSIsInN0b3JlRm9jdXNlZEVsZW1lbnQiLCJwcmV2aW91c2x5Rm9jdXNlZEVsZW1lbnQiLCJkb2N1bWVudCIsImJvZHkiLCJldmVudEVsZW1lbnQiLCJ2aWV3cyIsImdldFZpZXciLCJrZXltYXBzIiwiZmluZEtleUJpbmRpbmdzIiwidGFyZ2V0IiwiY29tbWFuZHMiLCJ4IiwiZGlzcGxheU5hbWUiLCJzZXRJdGVtcyIsImZvY3VzRmlsdGVyRWRpdG9yIiwibmV4dCIsImNvbXBsZXRlIiwiZGVzdHJveSIsIiQkIiwibGkiLCJuYW1lIiwic3BhbiIsInRpdGxlIiwiZGl2IiwicCIsIm91dGxldCIsImNvbnRlbnQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztJQUFZQSxROztBQUNaOztBQUNBOzs7Ozs7Ozs7O0lBRU1DLHFCLFdBQUFBLHFCOzs7QUFtQkYsbUNBQW9CQyxXQUFwQixFQUFnREMsTUFBaEQsRUFBeUdDLFNBQXpHLEVBQWtKQyxRQUFsSixFQUFzSztBQUFBOztBQUFBOztBQUFsSixjQUFBSCxXQUFBLEdBQUFBLFdBQUE7QUFBNEIsY0FBQUMsTUFBQSxHQUFBQSxNQUFBO0FBQXlELGNBQUFDLFNBQUEsR0FBQUEsU0FBQTtBQUF5QyxjQUFBQyxRQUFBLEdBQUFBLFFBQUE7QUFMMUksY0FBQUMs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QUlNakQseUJBQVNRLGNBQVQsQ0FBeUIwQyxPQUF6QixDQUFpQ3ZDLElBQWpDO0FBQ1QsYUFOTSxDQUFQO0FBT0g7Ozs7RUFUc0NYLFNBQVNRLGMiLCJmaWxlIjoibGliL3ZpZXdzL2dlbmVyaWMtbGlzdC12aWV3LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgc3BhY2VQZW4gZnJvbSAnYXRvbS1zcGFjZS1wZW4tdmlld3MnO1xyXG5pbXBvcnQgeyBzb3J0QnkgfSBmcm9tICdsb2Rhc2gnO1xyXG5pbXBvcnQgeyBBc3luY1N1YmplY3QgfSBmcm9tICdyeGpzJztcclxuXHJcbmV4cG9ydCBjbGFzcyBHZW5lcmljU2VsZWN0TGlzdFZpZXcgZXh0ZW5kcyBzcGFjZVBlbi5TZWxlY3RMaXN0VmlldyB7XHJcbiAgICBwdWJsaWMgc3RhdGljIGNvbnRlbnQoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZGl2KHt9LCAoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMucCh7XHJcbiAgICAgICAgICAgICAgICBvdXRsZXQ6ICdtZXNzYWdlJ1xyXG4gICAgICAgICAgICB9LCAnJyk7XHJcblxyXG4gICAgICAgICAgICAoPGFueT5zcGFjZVBlbi5TZWxlY3RMaXN0VmlldykuY29udGVudC5jYWxsKHRoaXMpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgcGFuZWw6IEF0b20uUGFuZWw7XHJcbiAgICBwcml2YXRlIHByZXZpb3VzbHlGb2N1c2VkRWxlbWVudDogTm9kZTtcclxuICAgIHByaXZhdGUgZXZlbnRFbGVtZW50OiBhbnk7XHJcbiAgICBwcml2YXRlIF9vbkNsb3NlZCA9IG5ldyBBc3luY1N1YmplY3Q8Ym9vbGVhbj4oKTtcclxuICAgIHB1YmxpYyBnZXQgb25DbG9zZWQoKSB7IHJldHVybiB0aGlzLl9vbkNsb3NlZDsgfVxyXG5cclxuICAgIHB1YmxpYyBtZXNzYWdlOiBKUXVlcnk7XHJcblxyXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBtZXNzYWdlVGV4dDogc3RyaW5nLCBwdWJsaWMgX2l0ZW1zOiB7IGRpc3BsYXlOYW1lOiBzdHJpbmc7IG5hbWU6IHN0cmluZzsgfVtdLCBwdWJsaWMgb25Db25maXJtOiAocmVzdWx0OiBhbnkpID0+IHZvaWQsIHB1YmxpYyBvbkNhbmNlbDogKCkgPT4gdm9pZCkge1xyXG4gICAgICAgIHN1cGVyKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGtleUJpbmRpbmdzOiBhbnkgPSBudWxsO1xyXG5cclxuICAgIHB1YmxpYyBpbml0aWFsaXplKCkge1xyXG4gICAgICAgICg8YW55PnNwYWNlUGVuLlNlbGVjdExpc3RWaWV3KS5wcm90b3R5cGUuaW5pdGlhbGl6ZS5jYWxsKHRoaXMpO1xyXG4gICAgICAgIHRoaXMuYWRkQ2xhc3MoJ2dlbmVyaWMtbGlzdCcpO1xyXG4gICAgICAgIHRoaXMubWVzc2FnZS50ZXh0KHRoaXMubWVzc2FnZVRleHQpO1xyXG5cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldEZpbHRlcktleSgpIHtcclxuICAgICAgICByZXR1cm4gJ2Rpc3BsYXlOYW1lJztcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgY2FuY2VsbGVkKCkge1xyXG4gICAgICAgIHRoaXMub25DYW5jZWwoKTtcclxuICAgICAgICByZXR1cm4gdGhpcy5oaWRlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHRvZ2dsZSgpIHtcclxuICAgICAgICBpZiAodGhpcy5wYW5lbCAmJiB0aGlzLnBhbmVsLmlzVmlzaWJsZSgpKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY2FuY2VsKCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5zaG93KCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzaG93KCkge1xyXG4gICAgICAgIGlmICh0aGlzLnBhbmVsID09IG51bGwpIHtcclxuICAgICAgICAgICAgdGhpcy5wYW5lbCA9IGF0b20ud29ya3NwYWNlLmFkZE1vZGFsUGFuZWwoeyBpdGVtOiB0aGlzIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnBhbmVsLnNob3coKTtcclxuICAgICAgICB0aGlzLnN0b3JlRm9jdXNlZEVsZW1lbnQoKTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMucHJldmlvdXNseUZvY3VzZWRFbGVtZW50WzBdICYmIHRoaXMucHJldmlvdXNseUZvY3VzZWRFbGVtZW50WzBdICE9PSBkb2N1bWVudC5ib2R5KSB7XHJcbiAgICAgICAgICAgIHRoaXMuZXZlbnRFbGVtZW50ID0gdGhpcy5wcmV2aW91c2x5Rm9jdXNlZEVsZW1lbnRbMF07XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5ldmVudEVsZW1lbnQgPSBhdG9tLnZpZXdzLmdldFZpZXcoYXRvbS53b3Jrc3BhY2UpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5rZXlCaW5kaW5ncyA9IGF0b20ua2V5bWFwcy5maW5kS2V5QmluZGluZ3Moe1xyXG4gICAgICAgICAgICB0YXJnZXQ6IHRoaXMuZXZlbnRFbGVtZW50XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIGluZmVyIHRoZSBnZW5lcmF0b3Igc29tZWhvdz8gYmFzZWQgb24gdGhlIHByb2plY3QgaW5mb3JtYXRpb24/ICBzdG9yZSBpbiB0aGUgcHJvamVjdCBzeXN0ZW0/P1xyXG4gICAgICAgIGNvbnN0IGNvbW1hbmRzID0gc29ydEJ5KHRoaXMuX2l0ZW1zLCB4ID0+IHguZGlzcGxheU5hbWUpO1xyXG4gICAgICAgIHRoaXMuc2V0SXRlbXMoY29tbWFuZHMpO1xyXG4gICAgICAgIHRoaXMuZm9jdXNGaWx0ZXJFZGl0b3IoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgaGlkZSgpIHtcclxuICAgICAgICB0aGlzLl9vbkNsb3NlZC5uZXh0KHRydWUpO1xyXG4gICAgICAgIHRoaXMuX29uQ2xvc2VkLmNvbXBsZXRlKCk7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLnBhbmVsKSB7XHJcbiAgICAgICAgICAgIHRoaXMucGFuZWwuaGlkZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnBhbmVsLmRlc3Ryb3koKTtcclxuICAgICAgICB0aGlzLnBhbmVsID0gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgdmlld0Zvckl0ZW0oaXRlbTogeyBkaXNwbGF5TmFtZTogc3RyaW5nOyBuYW1lOiBzdHJpbmc7IH0pIHtcclxuICAgICAgICByZXR1cm4gc3BhY2VQZW4uJCQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5saSh7XHJcbiAgICAgICAgICAgICAgICAnY2xhc3MnOiAnZXZlbnQnLFxyXG4gICAgICAgICAgICAgICAgJ2RhdGEtZXZlbnQtbmFtZSc6IGl0ZW0ubmFtZVxyXG4gICAgICAgICAgICB9LCAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zcGFuKGl0ZW0uZGlzcGxheU5hbWUsIHtcclxuICAgICAgICAgICAgICAgICAgICB0aXRsZTogaXRlbS5uYW1lXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNvbmZpcm1lZChpdGVtPzogYW55KTogc3BhY2VQZW4uVmlldyB7XHJcbiAgICAgICAgdGhpcy5vbkNvbmZpcm0oaXRlbS5uYW1lKTtcclxuICAgICAgICB0aGlzLmNhbmNlbCgpO1xyXG5cclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxufVxyXG4iXX0=
