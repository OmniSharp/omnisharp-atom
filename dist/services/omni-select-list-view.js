'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.OmniSelectListView = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _atomSpacePenViews = require('atom-space-pen-views');

var SpacePen = _interopRequireWildcard(_atomSpacePenViews);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var $ = require('jquery');

var OmniSelectListView = exports.OmniSelectListView = function (_SpacePen$SelectListV) {
    _inherits(OmniSelectListView, _SpacePen$SelectListV);

    function OmniSelectListView(placeholderText) {
        _classCallCheck(this, OmniSelectListView);

        var _this = _possibleConstructorReturn(this, (OmniSelectListView.__proto__ || Object.getPrototypeOf(OmniSelectListView)).call(this, { placeholderText: placeholderText }));

        _this.items = [];
        _this.setItems([]);
        _this.storeFocusedElement();
        _this.panel = atom.workspace.addModalPanel({ item: _this });
        _this.focusFilterEditor();
        return _this;
    }

    _createClass(OmniSelectListView, [{
        key: 'addToList',
        value: function addToList(symbols) {
            this.list.empty();
            if (symbols.length > 0) {
                this.setError(null);
                for (var i = 0; i < Math.min(symbols.length, this.maxItems); i++) {
                    var item = symbols[i];
                    var itemView = $(this.viewForItem(item));
                    itemView.data('select-list-item', item);
                    this.list.append(itemView);
                }
                this.selectItemView(this.list.find('li:first'));
            }
        }
    }, {
        key: 'populateList',
        value: function populateList() {
            if (this.items === null) {
                return;
            }
            var filterQuery = this.getFilterQuery();
            if (filterQuery.length >= this.getMinQueryLength()) {
                this.onFilter(filterQuery);
            } else {
                this.list.empty();
            }
        }
    }, {
        key: 'onFilter',
        value: function onFilter(filter) {
            throw new Error('Subclass must implement an onFilter(filter) method');
        }
    }, {
        key: 'getMinQueryLength',
        value: function getMinQueryLength() {
            return 0;
        }
    }, {
        key: 'cancelled',
        value: function cancelled() {
            this.panel.destroy();
        }
    }]);

    return OmniSelectListView;
}(SpacePen.SelectListView);
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9zZXJ2aWNlcy9vbW5pLXNlbGVjdC1saXN0LXZpZXcudHMiXSwibmFtZXMiOlsiU3BhY2VQZW4iLCIkIiwicmVxdWlyZSIsIk9tbmlTZWxlY3RMaXN0VmlldyIsInBsYWNlaG9sZGVyVGV4dCIsIml0ZW1zIiwic2V0SXRlbXMiLCJzdG9yZUZvY3VzZWRFbGVtZW50IiwicGFuZWwiLCJhdG9tIiwid29ya3NwYWNlIiwiYWRkTW9kYWxQYW5lbCIsIml0ZW0iLCJmb2N1c0ZpbHRlckVkaXRvciIsInN5bWJvbHMiLCJsaXN0IiwiZW1wdHkiLCJsZW5ndGgiLCJzZXRFcnJvciIsImkiLCJNYXRoIiwibWluIiwibWF4SXRlbXMiLCJpdGVtVmlldyIsInZpZXdGb3JJdGVtIiwiZGF0YSIsImFwcGVuZCIsInNlbGVjdEl0ZW1WaWV3IiwiZmluZCIsImZpbHRlclF1ZXJ5IiwiZ2V0RmlsdGVyUXVlcnkiLCJnZXRNaW5RdWVyeUxlbmd0aCIsIm9uRmlsdGVyIiwiZmlsdGVyIiwiRXJyb3IiLCJkZXN0cm95IiwiU2VsZWN0TGlzdFZpZXciXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztJQUFZQSxROzs7Ozs7Ozs7O0FBRVosSUFBTUMsSUFBbUJDLFFBQVEsUUFBUixDQUF6Qjs7SUFFTUMsa0IsV0FBQUEsa0I7OztBQUtGLGdDQUFZQyxlQUFaLEVBQW9DO0FBQUE7O0FBQUEsNElBQzFCLEVBQUVBLGlCQUFpQkEsZUFBbkIsRUFEMEI7O0FBSDVCLGNBQUFDLEtBQUEsR0FBZSxFQUFmO0FBS0osY0FBS0MsUUFBTCxDQUFjLEVBQWQ7QUFDQSxjQUFLQyxtQkFBTDtBQUNBLGNBQUtDLEtBQUwsR0FBYUMsS0FBS0MsU0FBTCxDQUFlQyxhQUFmLENBQTZCLEVBQUVDLFdBQUYsRUFBN0IsQ0FBYjtBQUNBLGNBQUtDLGlCQUFMO0FBTGdDO0FBTW5DOzs7O2tDQUVnQkMsTyxFQUEyQjtBQUN4QyxpQkFBS0MsSUFBTCxDQUFVQyxLQUFWO0FBRUEsZ0JBQUlGLFFBQVFHLE1BQVIsR0FBaUIsQ0FBckIsRUFBd0I7QUFDcEIscUJBQUtDLFFBQUwsQ0FBYyxJQUFkO0FBRUEscUJBQUssSUFBSUMsSUFBSSxDQUFiLEVBQWdCQSxJQUFJQyxLQUFLQyxHQUFMLENBQVNQLFFBQVFHLE1BQWpCLEVBQXlCLEtBQUtLLFFBQTlCLENBQXBCLEVBQTZESCxHQUE3RCxFQUFrRTtBQUM5RCx3QkFBTVAsT0FBT0UsUUFBUUssQ0FBUixDQUFiO0FBQ0Esd0JBQU1JLFdBQVd0QixFQUFFLEtBQUt1QixXQUFMLENBQWlCWixJQUFqQixDQUFGLENBQWpCO0FBQ0FXLDZCQUFTRSxJQUFULENBQWMsa0JBQWQsRUFBa0NiLElBQWxDO0FBQ0EseUJBQUtHLElBQUwsQ0FBVVcsTUFBVixDQUFpQkgsUUFBakI7QUFDSDtBQUVELHFCQUFLSSxjQUFMLENBQW9CLEtBQUtaLElBQUwsQ0FBVWEsSUFBVixDQUFlLFVBQWYsQ0FBcEI7QUFDSDtBQUNKOzs7dUNBRWtCO0FBQ2YsZ0JBQUksS0FBS3ZCLEtBQUwsS0FBZSxJQUFuQixFQUF5QjtBQUNyQjtBQUNIO0FBRUQsZ0JBQU13QixjQUFjLEtBQUtDLGNBQUwsRUFBcEI7QUFFQSxnQkFBSUQsWUFBWVosTUFBWixJQUFzQixLQUFLYyxpQkFBTCxFQUExQixFQUFvRDtBQUNoRCxxQkFBS0MsUUFBTCxDQUFjSCxXQUFkO0FBQ0gsYUFGRCxNQUVPO0FBQ0gscUJBQUtkLElBQUwsQ0FBVUMsS0FBVjtBQUNIO0FBQ0o7OztpQ0FFZWlCLE0sRUFBZTtBQUMzQixrQkFBTSxJQUFJQyxLQUFKLENBQVUsb0RBQVYsQ0FBTjtBQUNIOzs7NENBRXVCO0FBQ3BCLG1CQUFPLENBQVA7QUFDSDs7O29DQUVlO0FBQ1osaUJBQUsxQixLQUFMLENBQVcyQixPQUFYO0FBQ0g7Ozs7RUF0RG1DbkMsU0FBU29DLGMiLCJmaWxlIjoibGliL3NlcnZpY2VzL29tbmktc2VsZWN0LWxpc3Qtdmlldy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIFNwYWNlUGVuIGZyb20gJ2F0b20tc3BhY2UtcGVuLXZpZXdzJztcclxuaW1wb3J0IHtNb2RlbHN9IGZyb20gJ29tbmlzaGFycC1jbGllbnQnO1xyXG5jb25zdCAkIDogSlF1ZXJ5U3RhdGljID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcblxyXG5leHBvcnQgY2xhc3MgT21uaVNlbGVjdExpc3RWaWV3IGV4dGVuZHMgU3BhY2VQZW4uU2VsZWN0TGlzdFZpZXcge1xyXG4gICAgcHVibGljIHBhbmVsOiBBdG9tLlBhbmVsO1xyXG4gICAgcHJpdmF0ZSBpdGVtczogYW55W10gPSBbXTtcclxuICAgIHByaXZhdGUgbGlzdDogYW55O1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHBsYWNlaG9sZGVyVGV4dCA6IHN0cmluZykge1xyXG4gICAgICAgIHN1cGVyKHsgcGxhY2Vob2xkZXJUZXh0OiBwbGFjZWhvbGRlclRleHQgfSk7XHJcbiAgICAgICAgdGhpcy5zZXRJdGVtcyhbXSk7XHJcbiAgICAgICAgdGhpcy5zdG9yZUZvY3VzZWRFbGVtZW50KCk7XHJcbiAgICAgICAgdGhpcy5wYW5lbCA9IGF0b20ud29ya3NwYWNlLmFkZE1vZGFsUGFuZWwoeyBpdGVtOiB0aGlzIH0pO1xyXG4gICAgICAgIHRoaXMuZm9jdXNGaWx0ZXJFZGl0b3IoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgYWRkVG9MaXN0KHN5bWJvbHMgOiBNb2RlbHMuUXVpY2tGaXhbXSkgOiB2b2lkIHtcclxuICAgICAgICB0aGlzLmxpc3QuZW1wdHkoKTtcclxuXHJcbiAgICAgICAgaWYgKHN5bWJvbHMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICB0aGlzLnNldEVycm9yKG51bGwpO1xyXG5cclxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBNYXRoLm1pbihzeW1ib2xzLmxlbmd0aCwgdGhpcy5tYXhJdGVtcyk7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbSA9IHN5bWJvbHNbaV07XHJcbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtVmlldyA9ICQodGhpcy52aWV3Rm9ySXRlbShpdGVtKSk7XHJcbiAgICAgICAgICAgICAgICBpdGVtVmlldy5kYXRhKCdzZWxlY3QtbGlzdC1pdGVtJywgaXRlbSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmxpc3QuYXBwZW5kKGl0ZW1WaWV3KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy5zZWxlY3RJdGVtVmlldyh0aGlzLmxpc3QuZmluZCgnbGk6Zmlyc3QnKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBwb3B1bGF0ZUxpc3QoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuaXRlbXMgPT09IG51bGwpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgZmlsdGVyUXVlcnkgPSB0aGlzLmdldEZpbHRlclF1ZXJ5KCk7XHJcblxyXG4gICAgICAgIGlmIChmaWx0ZXJRdWVyeS5sZW5ndGggPj0gdGhpcy5nZXRNaW5RdWVyeUxlbmd0aCgpKSB7XHJcbiAgICAgICAgICAgIHRoaXMub25GaWx0ZXIoZmlsdGVyUXVlcnkpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMubGlzdC5lbXB0eSgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgb25GaWx0ZXIoZmlsdGVyIDogc3RyaW5nKSA6IHZvaWQge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignU3ViY2xhc3MgbXVzdCBpbXBsZW1lbnQgYW4gb25GaWx0ZXIoZmlsdGVyKSBtZXRob2QnKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0TWluUXVlcnlMZW5ndGgoKSA6IG51bWJlciB7XHJcbiAgICAgICAgcmV0dXJuIDA7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNhbmNlbGxlZCgpIHtcclxuICAgICAgICB0aGlzLnBhbmVsLmRlc3Ryb3koKTtcclxuICAgIH1cclxufVxyXG4iXX0=
