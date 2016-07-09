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

        var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(OmniSelectListView).call(this, { placeholderText: placeholderText }));

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9zZXJ2aWNlcy9vbW5pLXNlbGVjdC1saXN0LXZpZXcuanMiLCJsaWIvc2VydmljZXMvb21uaS1zZWxlY3QtbGlzdC12aWV3LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztJQ0NZLFE7Ozs7Ozs7Ozs7QUFDWixJQUFNLElBQW1CLFFBQVEsUUFBUixDQUF6Qjs7SUFFQSxrQixXQUFBLGtCOzs7QUFLSSxnQ0FBWSxlQUFaLEVBQW9DO0FBQUE7O0FBQUEsMEdBQzFCLEVBQUUsaUJBQWlCLGVBQW5CLEVBRDBCOztBQUg1QixjQUFBLEtBQUEsR0FBZSxFQUFmO0FBS0osY0FBSyxRQUFMLENBQWMsRUFBZDtBQUNBLGNBQUssbUJBQUw7QUFDQSxjQUFLLEtBQUwsR0FBYSxLQUFLLFNBQUwsQ0FBZSxhQUFmLENBQTZCLEVBQUUsV0FBRixFQUE3QixDQUFiO0FBQ0EsY0FBSyxpQkFBTDtBQUxnQztBQU1uQzs7OztrQ0FFZ0IsTyxFQUEyQjtBQUN4QyxpQkFBSyxJQUFMLENBQVUsS0FBVjtBQUVBLGdCQUFJLFFBQVEsTUFBUixHQUFpQixDQUFyQixFQUF3QjtBQUNwQixxQkFBSyxRQUFMLENBQWMsSUFBZDtBQUVBLHFCQUFLLElBQUksSUFBSSxDQUFiLEVBQWdCLElBQUksS0FBSyxHQUFMLENBQVMsUUFBUSxNQUFqQixFQUF5QixLQUFLLFFBQTlCLENBQXBCLEVBQTZELEdBQTdELEVBQWtFO0FBQzlELHdCQUFNLE9BQU8sUUFBUSxDQUFSLENBQWI7QUFDQSx3QkFBTSxXQUFXLEVBQUUsS0FBSyxXQUFMLENBQWlCLElBQWpCLENBQUYsQ0FBakI7QUFDQSw2QkFBUyxJQUFULENBQWMsa0JBQWQsRUFBa0MsSUFBbEM7QUFDQSx5QkFBSyxJQUFMLENBQVUsTUFBVixDQUFpQixRQUFqQjtBQUNIO0FBRUQscUJBQUssY0FBTCxDQUFvQixLQUFLLElBQUwsQ0FBVSxJQUFWLENBQWUsVUFBZixDQUFwQjtBQUNIO0FBQ0o7Ozt1Q0FFa0I7QUFDZixnQkFBSSxLQUFLLEtBQUwsS0FBZSxJQUFuQixFQUF5QjtBQUNyQjtBQUNIO0FBRUQsZ0JBQU0sY0FBYyxLQUFLLGNBQUwsRUFBcEI7QUFFQSxnQkFBSSxZQUFZLE1BQVosSUFBc0IsS0FBSyxpQkFBTCxFQUExQixFQUFvRDtBQUNoRCxxQkFBSyxRQUFMLENBQWMsV0FBZDtBQUNILGFBRkQsTUFFTztBQUNILHFCQUFLLElBQUwsQ0FBVSxLQUFWO0FBQ0g7QUFDSjs7O2lDQUVlLE0sRUFBZTtBQUMzQixrQkFBTSxJQUFJLEtBQUosQ0FBVSxvREFBVixDQUFOO0FBQ0g7Ozs0Q0FFdUI7QUFDcEIsbUJBQU8sQ0FBUDtBQUNIOzs7b0NBRWU7QUFDWixpQkFBSyxLQUFMLENBQVcsT0FBWDtBQUNIOzs7O0VBdERtQyxTQUFTLGMiLCJmaWxlIjoibGliL3NlcnZpY2VzL29tbmktc2VsZWN0LWxpc3Qtdmlldy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIFNwYWNlUGVuIGZyb20gXCJhdG9tLXNwYWNlLXBlbi12aWV3c1wiO1xuY29uc3QgJCA9IHJlcXVpcmUoXCJqcXVlcnlcIik7XG5leHBvcnQgY2xhc3MgT21uaVNlbGVjdExpc3RWaWV3IGV4dGVuZHMgU3BhY2VQZW4uU2VsZWN0TGlzdFZpZXcge1xuICAgIGNvbnN0cnVjdG9yKHBsYWNlaG9sZGVyVGV4dCkge1xuICAgICAgICBzdXBlcih7IHBsYWNlaG9sZGVyVGV4dDogcGxhY2Vob2xkZXJUZXh0IH0pO1xuICAgICAgICB0aGlzLml0ZW1zID0gW107XG4gICAgICAgIHRoaXMuc2V0SXRlbXMoW10pO1xuICAgICAgICB0aGlzLnN0b3JlRm9jdXNlZEVsZW1lbnQoKTtcbiAgICAgICAgdGhpcy5wYW5lbCA9IGF0b20ud29ya3NwYWNlLmFkZE1vZGFsUGFuZWwoeyBpdGVtOiB0aGlzIH0pO1xuICAgICAgICB0aGlzLmZvY3VzRmlsdGVyRWRpdG9yKCk7XG4gICAgfVxuICAgIGFkZFRvTGlzdChzeW1ib2xzKSB7XG4gICAgICAgIHRoaXMubGlzdC5lbXB0eSgpO1xuICAgICAgICBpZiAoc3ltYm9scy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB0aGlzLnNldEVycm9yKG51bGwpO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBNYXRoLm1pbihzeW1ib2xzLmxlbmd0aCwgdGhpcy5tYXhJdGVtcyk7IGkrKykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW0gPSBzeW1ib2xzW2ldO1xuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1WaWV3ID0gJCh0aGlzLnZpZXdGb3JJdGVtKGl0ZW0pKTtcbiAgICAgICAgICAgICAgICBpdGVtVmlldy5kYXRhKFwic2VsZWN0LWxpc3QtaXRlbVwiLCBpdGVtKTtcbiAgICAgICAgICAgICAgICB0aGlzLmxpc3QuYXBwZW5kKGl0ZW1WaWV3KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuc2VsZWN0SXRlbVZpZXcodGhpcy5saXN0LmZpbmQoXCJsaTpmaXJzdFwiKSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcG9wdWxhdGVMaXN0KCkge1xuICAgICAgICBpZiAodGhpcy5pdGVtcyA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGZpbHRlclF1ZXJ5ID0gdGhpcy5nZXRGaWx0ZXJRdWVyeSgpO1xuICAgICAgICBpZiAoZmlsdGVyUXVlcnkubGVuZ3RoID49IHRoaXMuZ2V0TWluUXVlcnlMZW5ndGgoKSkge1xuICAgICAgICAgICAgdGhpcy5vbkZpbHRlcihmaWx0ZXJRdWVyeSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmxpc3QuZW1wdHkoKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBvbkZpbHRlcihmaWx0ZXIpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiU3ViY2xhc3MgbXVzdCBpbXBsZW1lbnQgYW4gb25GaWx0ZXIoZmlsdGVyKSBtZXRob2RcIik7XG4gICAgfVxuICAgIGdldE1pblF1ZXJ5TGVuZ3RoKCkge1xuICAgICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgY2FuY2VsbGVkKCkge1xuICAgICAgICB0aGlzLnBhbmVsLmRlc3Ryb3koKTtcbiAgICB9XG59XG4iLCJpbXBvcnQge01vZGVsc30gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcclxuaW1wb3J0ICogYXMgU3BhY2VQZW4gZnJvbSBcImF0b20tc3BhY2UtcGVuLXZpZXdzXCI7XHJcbmNvbnN0ICQgOiBKUXVlcnlTdGF0aWMgPSByZXF1aXJlKFwianF1ZXJ5XCIpO1xyXG5cclxuZXhwb3J0IGNsYXNzIE9tbmlTZWxlY3RMaXN0VmlldyBleHRlbmRzIFNwYWNlUGVuLlNlbGVjdExpc3RWaWV3IHtcclxuICAgIHB1YmxpYyBwYW5lbDogQXRvbS5QYW5lbDtcclxuICAgIHByaXZhdGUgaXRlbXM6IGFueVtdID0gW107XHJcbiAgICBwcml2YXRlIGxpc3Q6IGFueTtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihwbGFjZWhvbGRlclRleHQgOiBzdHJpbmcpIHtcclxuICAgICAgICBzdXBlcih7IHBsYWNlaG9sZGVyVGV4dDogcGxhY2Vob2xkZXJUZXh0IH0pO1xyXG4gICAgICAgIHRoaXMuc2V0SXRlbXMoW10pO1xyXG4gICAgICAgIHRoaXMuc3RvcmVGb2N1c2VkRWxlbWVudCgpO1xyXG4gICAgICAgIHRoaXMucGFuZWwgPSBhdG9tLndvcmtzcGFjZS5hZGRNb2RhbFBhbmVsKHsgaXRlbTogdGhpcyB9KTtcclxuICAgICAgICB0aGlzLmZvY3VzRmlsdGVyRWRpdG9yKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGFkZFRvTGlzdChzeW1ib2xzIDogTW9kZWxzLlF1aWNrRml4W10pIDogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5saXN0LmVtcHR5KCk7XHJcblxyXG4gICAgICAgIGlmIChzeW1ib2xzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgdGhpcy5zZXRFcnJvcihudWxsKTtcclxuXHJcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgTWF0aC5taW4oc3ltYm9scy5sZW5ndGgsIHRoaXMubWF4SXRlbXMpOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW0gPSBzeW1ib2xzW2ldO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbVZpZXcgPSAkKHRoaXMudmlld0Zvckl0ZW0oaXRlbSkpO1xyXG4gICAgICAgICAgICAgICAgaXRlbVZpZXcuZGF0YShcInNlbGVjdC1saXN0LWl0ZW1cIiwgaXRlbSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmxpc3QuYXBwZW5kKGl0ZW1WaWV3KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy5zZWxlY3RJdGVtVmlldyh0aGlzLmxpc3QuZmluZChcImxpOmZpcnN0XCIpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHBvcHVsYXRlTGlzdCgpIHtcclxuICAgICAgICBpZiAodGhpcy5pdGVtcyA9PT0gbnVsbCkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBmaWx0ZXJRdWVyeSA9IHRoaXMuZ2V0RmlsdGVyUXVlcnkoKTtcclxuXHJcbiAgICAgICAgaWYgKGZpbHRlclF1ZXJ5Lmxlbmd0aCA+PSB0aGlzLmdldE1pblF1ZXJ5TGVuZ3RoKCkpIHtcclxuICAgICAgICAgICAgdGhpcy5vbkZpbHRlcihmaWx0ZXJRdWVyeSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5saXN0LmVtcHR5KCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBvbkZpbHRlcihmaWx0ZXIgOiBzdHJpbmcpIDogdm9pZCB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiU3ViY2xhc3MgbXVzdCBpbXBsZW1lbnQgYW4gb25GaWx0ZXIoZmlsdGVyKSBtZXRob2RcIik7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldE1pblF1ZXJ5TGVuZ3RoKCkgOiBudW1iZXIge1xyXG4gICAgICAgIHJldHVybiAwO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBjYW5jZWxsZWQoKSB7XHJcbiAgICAgICAgdGhpcy5wYW5lbC5kZXN0cm95KCk7XHJcbiAgICB9XHJcbn1cclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
