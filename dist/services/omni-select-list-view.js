"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.OmniSelectListView = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _atomSpacePenViews = require("atom-space-pen-views");

var SpacePen = _interopRequireWildcard(_atomSpacePenViews);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var $ = require("jquery");

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
        key: "addToList",
        value: function addToList(symbols) {
            this.list.empty();
            if (symbols.length > 0) {
                this.setError(null);
                for (var i = 0; i < Math.min(symbols.length, this.maxItems); i++) {
                    var item = symbols[i];
                    var itemView = $(this.viewForItem(item));
                    itemView.data("select-list-item", item);
                    this.list.append(itemView);
                }
                this.selectItemView(this.list.find("li:first"));
            }
        }
    }, {
        key: "populateList",
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
        key: "onFilter",
        value: function onFilter(filter) {
            throw new Error("Subclass must implement an onFilter(filter) method");
        }
    }, {
        key: "getMinQueryLength",
        value: function getMinQueryLength() {
            return 0;
        }
    }, {
        key: "cancelled",
        value: function cancelled() {
            this.panel.destroy();
        }
    }]);

    return OmniSelectListView;
}(SpacePen.SelectListView);
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9zZXJ2aWNlcy9vbW5pLXNlbGVjdC1saXN0LXZpZXcuanMiLCJsaWIvc2VydmljZXMvb21uaS1zZWxlY3QtbGlzdC12aWV3LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztJQ0NZOzs7Ozs7Ozs7O0FBQ1osSUFBTSxJQUFtQixRQUFRLFFBQVIsQ0FBbkI7O0lBRU47OztBQUtJLGdDQUFZLGVBQVosRUFBb0M7Ozs0SUFDMUIsRUFBRSxpQkFBaUIsZUFBakIsS0FEd0I7O0FBSDVCLGNBQUEsS0FBQSxHQUFlLEVBQWYsQ0FHNEI7QUFFaEMsY0FBSyxRQUFMLENBQWMsRUFBZCxFQUZnQztBQUdoQyxjQUFLLG1CQUFMLEdBSGdDO0FBSWhDLGNBQUssS0FBTCxHQUFhLEtBQUssU0FBTCxDQUFlLGFBQWYsQ0FBNkIsRUFBRSxXQUFGLEVBQTdCLENBQWIsQ0FKZ0M7QUFLaEMsY0FBSyxpQkFBTCxHQUxnQzs7S0FBcEM7Ozs7a0NBUWlCLFNBQTJCO0FBQ3hDLGlCQUFLLElBQUwsQ0FBVSxLQUFWLEdBRHdDO0FBR3hDLGdCQUFJLFFBQVEsTUFBUixHQUFpQixDQUFqQixFQUFvQjtBQUNwQixxQkFBSyxRQUFMLENBQWMsSUFBZCxFQURvQjtBQUdwQixxQkFBSyxJQUFJLElBQUksQ0FBSixFQUFPLElBQUksS0FBSyxHQUFMLENBQVMsUUFBUSxNQUFSLEVBQWdCLEtBQUssUUFBTCxDQUE3QixFQUE2QyxHQUE3RCxFQUFrRTtBQUM5RCx3QkFBTSxPQUFPLFFBQVEsQ0FBUixDQUFQLENBRHdEO0FBRTlELHdCQUFNLFdBQVcsRUFBRSxLQUFLLFdBQUwsQ0FBaUIsSUFBakIsQ0FBRixDQUFYLENBRndEO0FBRzlELDZCQUFTLElBQVQsQ0FBYyxrQkFBZCxFQUFrQyxJQUFsQyxFQUg4RDtBQUk5RCx5QkFBSyxJQUFMLENBQVUsTUFBVixDQUFpQixRQUFqQixFQUo4RDtpQkFBbEU7QUFPQSxxQkFBSyxjQUFMLENBQW9CLEtBQUssSUFBTCxDQUFVLElBQVYsQ0FBZSxVQUFmLENBQXBCLEVBVm9CO2FBQXhCOzs7O3VDQWNlO0FBQ2YsZ0JBQUksS0FBSyxLQUFMLEtBQWUsSUFBZixFQUFxQjtBQUNyQix1QkFEcUI7YUFBekI7QUFJQSxnQkFBTSxjQUFjLEtBQUssY0FBTCxFQUFkLENBTFM7QUFPZixnQkFBSSxZQUFZLE1BQVosSUFBc0IsS0FBSyxpQkFBTCxFQUF0QixFQUFnRDtBQUNoRCxxQkFBSyxRQUFMLENBQWMsV0FBZCxFQURnRDthQUFwRCxNQUVPO0FBQ0gscUJBQUssSUFBTCxDQUFVLEtBQVYsR0FERzthQUZQOzs7O2lDQU9ZLFFBQWU7QUFDM0Isa0JBQU0sSUFBSSxLQUFKLENBQVUsb0RBQVYsQ0FBTixDQUQyQjs7Ozs0Q0FJUDtBQUNwQixtQkFBTyxDQUFQLENBRG9COzs7O29DQUlSO0FBQ1osaUJBQUssS0FBTCxDQUFXLE9BQVgsR0FEWTs7Ozs7RUFwRG9CLFNBQVMsY0FBVCIsImZpbGUiOiJsaWIvc2VydmljZXMvb21uaS1zZWxlY3QtbGlzdC12aWV3LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgU3BhY2VQZW4gZnJvbSBcImF0b20tc3BhY2UtcGVuLXZpZXdzXCI7XG5jb25zdCAkID0gcmVxdWlyZShcImpxdWVyeVwiKTtcbmV4cG9ydCBjbGFzcyBPbW5pU2VsZWN0TGlzdFZpZXcgZXh0ZW5kcyBTcGFjZVBlbi5TZWxlY3RMaXN0VmlldyB7XG4gICAgY29uc3RydWN0b3IocGxhY2Vob2xkZXJUZXh0KSB7XG4gICAgICAgIHN1cGVyKHsgcGxhY2Vob2xkZXJUZXh0OiBwbGFjZWhvbGRlclRleHQgfSk7XG4gICAgICAgIHRoaXMuaXRlbXMgPSBbXTtcbiAgICAgICAgdGhpcy5zZXRJdGVtcyhbXSk7XG4gICAgICAgIHRoaXMuc3RvcmVGb2N1c2VkRWxlbWVudCgpO1xuICAgICAgICB0aGlzLnBhbmVsID0gYXRvbS53b3Jrc3BhY2UuYWRkTW9kYWxQYW5lbCh7IGl0ZW06IHRoaXMgfSk7XG4gICAgICAgIHRoaXMuZm9jdXNGaWx0ZXJFZGl0b3IoKTtcbiAgICB9XG4gICAgYWRkVG9MaXN0KHN5bWJvbHMpIHtcbiAgICAgICAgdGhpcy5saXN0LmVtcHR5KCk7XG4gICAgICAgIGlmIChzeW1ib2xzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHRoaXMuc2V0RXJyb3IobnVsbCk7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IE1hdGgubWluKHN5bWJvbHMubGVuZ3RoLCB0aGlzLm1heEl0ZW1zKTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbSA9IHN5bWJvbHNbaV07XG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbVZpZXcgPSAkKHRoaXMudmlld0Zvckl0ZW0oaXRlbSkpO1xuICAgICAgICAgICAgICAgIGl0ZW1WaWV3LmRhdGEoXCJzZWxlY3QtbGlzdC1pdGVtXCIsIGl0ZW0pO1xuICAgICAgICAgICAgICAgIHRoaXMubGlzdC5hcHBlbmQoaXRlbVZpZXcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5zZWxlY3RJdGVtVmlldyh0aGlzLmxpc3QuZmluZChcImxpOmZpcnN0XCIpKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBwb3B1bGF0ZUxpc3QoKSB7XG4gICAgICAgIGlmICh0aGlzLml0ZW1zID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZmlsdGVyUXVlcnkgPSB0aGlzLmdldEZpbHRlclF1ZXJ5KCk7XG4gICAgICAgIGlmIChmaWx0ZXJRdWVyeS5sZW5ndGggPj0gdGhpcy5nZXRNaW5RdWVyeUxlbmd0aCgpKSB7XG4gICAgICAgICAgICB0aGlzLm9uRmlsdGVyKGZpbHRlclF1ZXJ5KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMubGlzdC5lbXB0eSgpO1xuICAgICAgICB9XG4gICAgfVxuICAgIG9uRmlsdGVyKGZpbHRlcikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJTdWJjbGFzcyBtdXN0IGltcGxlbWVudCBhbiBvbkZpbHRlcihmaWx0ZXIpIG1ldGhvZFwiKTtcbiAgICB9XG4gICAgZ2V0TWluUXVlcnlMZW5ndGgoKSB7XG4gICAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICBjYW5jZWxsZWQoKSB7XG4gICAgICAgIHRoaXMucGFuZWwuZGVzdHJveSgpO1xuICAgIH1cbn1cbiIsImltcG9ydCB7TW9kZWxzfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xyXG5pbXBvcnQgKiBhcyBTcGFjZVBlbiBmcm9tIFwiYXRvbS1zcGFjZS1wZW4tdmlld3NcIjtcclxuY29uc3QgJCA6IEpRdWVyeVN0YXRpYyA9IHJlcXVpcmUoXCJqcXVlcnlcIik7XHJcblxyXG5leHBvcnQgY2xhc3MgT21uaVNlbGVjdExpc3RWaWV3IGV4dGVuZHMgU3BhY2VQZW4uU2VsZWN0TGlzdFZpZXcge1xyXG4gICAgcHVibGljIHBhbmVsOiBBdG9tLlBhbmVsO1xyXG4gICAgcHJpdmF0ZSBpdGVtczogYW55W10gPSBbXTtcclxuICAgIHByaXZhdGUgbGlzdDogYW55O1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHBsYWNlaG9sZGVyVGV4dCA6IHN0cmluZykge1xyXG4gICAgICAgIHN1cGVyKHsgcGxhY2Vob2xkZXJUZXh0OiBwbGFjZWhvbGRlclRleHQgfSk7XHJcbiAgICAgICAgdGhpcy5zZXRJdGVtcyhbXSk7XHJcbiAgICAgICAgdGhpcy5zdG9yZUZvY3VzZWRFbGVtZW50KCk7XHJcbiAgICAgICAgdGhpcy5wYW5lbCA9IGF0b20ud29ya3NwYWNlLmFkZE1vZGFsUGFuZWwoeyBpdGVtOiB0aGlzIH0pO1xyXG4gICAgICAgIHRoaXMuZm9jdXNGaWx0ZXJFZGl0b3IoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgYWRkVG9MaXN0KHN5bWJvbHMgOiBNb2RlbHMuUXVpY2tGaXhbXSkgOiB2b2lkIHtcclxuICAgICAgICB0aGlzLmxpc3QuZW1wdHkoKTtcclxuXHJcbiAgICAgICAgaWYgKHN5bWJvbHMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICB0aGlzLnNldEVycm9yKG51bGwpO1xyXG5cclxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBNYXRoLm1pbihzeW1ib2xzLmxlbmd0aCwgdGhpcy5tYXhJdGVtcyk7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbSA9IHN5bWJvbHNbaV07XHJcbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtVmlldyA9ICQodGhpcy52aWV3Rm9ySXRlbShpdGVtKSk7XHJcbiAgICAgICAgICAgICAgICBpdGVtVmlldy5kYXRhKFwic2VsZWN0LWxpc3QtaXRlbVwiLCBpdGVtKTtcclxuICAgICAgICAgICAgICAgIHRoaXMubGlzdC5hcHBlbmQoaXRlbVZpZXcpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLnNlbGVjdEl0ZW1WaWV3KHRoaXMubGlzdC5maW5kKFwibGk6Zmlyc3RcIikpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcG9wdWxhdGVMaXN0KCkge1xyXG4gICAgICAgIGlmICh0aGlzLml0ZW1zID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IGZpbHRlclF1ZXJ5ID0gdGhpcy5nZXRGaWx0ZXJRdWVyeSgpO1xyXG5cclxuICAgICAgICBpZiAoZmlsdGVyUXVlcnkubGVuZ3RoID49IHRoaXMuZ2V0TWluUXVlcnlMZW5ndGgoKSkge1xyXG4gICAgICAgICAgICB0aGlzLm9uRmlsdGVyKGZpbHRlclF1ZXJ5KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLmxpc3QuZW1wdHkoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIG9uRmlsdGVyKGZpbHRlciA6IHN0cmluZykgOiB2b2lkIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJTdWJjbGFzcyBtdXN0IGltcGxlbWVudCBhbiBvbkZpbHRlcihmaWx0ZXIpIG1ldGhvZFwiKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0TWluUXVlcnlMZW5ndGgoKSA6IG51bWJlciB7XHJcbiAgICAgICAgcmV0dXJuIDA7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNhbmNlbGxlZCgpIHtcclxuICAgICAgICB0aGlzLnBhbmVsLmRlc3Ryb3koKTtcclxuICAgIH1cclxufVxyXG4iXX0=
