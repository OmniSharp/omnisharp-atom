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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9zZXJ2aWNlcy9vbW5pLXNlbGVjdC1saXN0LXZpZXcuanMiLCJsaWIvc2VydmljZXMvb21uaS1zZWxlY3QtbGlzdC12aWV3LnRzIl0sIm5hbWVzIjpbIlNwYWNlUGVuIiwiJCIsInJlcXVpcmUiLCJPbW5pU2VsZWN0TGlzdFZpZXciLCJwbGFjZWhvbGRlclRleHQiLCJpdGVtcyIsInNldEl0ZW1zIiwic3RvcmVGb2N1c2VkRWxlbWVudCIsInBhbmVsIiwiYXRvbSIsIndvcmtzcGFjZSIsImFkZE1vZGFsUGFuZWwiLCJpdGVtIiwiZm9jdXNGaWx0ZXJFZGl0b3IiLCJzeW1ib2xzIiwibGlzdCIsImVtcHR5IiwibGVuZ3RoIiwic2V0RXJyb3IiLCJpIiwiTWF0aCIsIm1pbiIsIm1heEl0ZW1zIiwiaXRlbVZpZXciLCJ2aWV3Rm9ySXRlbSIsImRhdGEiLCJhcHBlbmQiLCJzZWxlY3RJdGVtVmlldyIsImZpbmQiLCJmaWx0ZXJRdWVyeSIsImdldEZpbHRlclF1ZXJ5IiwiZ2V0TWluUXVlcnlMZW5ndGgiLCJvbkZpbHRlciIsImZpbHRlciIsIkVycm9yIiwiZGVzdHJveSIsIlNlbGVjdExpc3RWaWV3Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7SUNDWUEsUTs7Ozs7Ozs7OztBQUNaLElBQU1DLElBQW1CQyxRQUFRLFFBQVIsQ0FBekI7O0lBRUFDLGtCLFdBQUFBLGtCOzs7QUFLSSxnQ0FBWUMsZUFBWixFQUFvQztBQUFBOztBQUFBLDRJQUMxQixFQUFFQSxpQkFBaUJBLGVBQW5CLEVBRDBCOztBQUg1QixjQUFBQyxLQUFBLEdBQWUsRUFBZjtBQUtKLGNBQUtDLFFBQUwsQ0FBYyxFQUFkO0FBQ0EsY0FBS0MsbUJBQUw7QUFDQSxjQUFLQyxLQUFMLEdBQWFDLEtBQUtDLFNBQUwsQ0FBZUMsYUFBZixDQUE2QixFQUFFQyxXQUFGLEVBQTdCLENBQWI7QUFDQSxjQUFLQyxpQkFBTDtBQUxnQztBQU1uQzs7OztrQ0FFZ0JDLE8sRUFBMkI7QUFDeEMsaUJBQUtDLElBQUwsQ0FBVUMsS0FBVjtBQUVBLGdCQUFJRixRQUFRRyxNQUFSLEdBQWlCLENBQXJCLEVBQXdCO0FBQ3BCLHFCQUFLQyxRQUFMLENBQWMsSUFBZDtBQUVBLHFCQUFLLElBQUlDLElBQUksQ0FBYixFQUFnQkEsSUFBSUMsS0FBS0MsR0FBTCxDQUFTUCxRQUFRRyxNQUFqQixFQUF5QixLQUFLSyxRQUE5QixDQUFwQixFQUE2REgsR0FBN0QsRUFBa0U7QUFDOUQsd0JBQU1QLE9BQU9FLFFBQVFLLENBQVIsQ0FBYjtBQUNBLHdCQUFNSSxXQUFXdEIsRUFBRSxLQUFLdUIsV0FBTCxDQUFpQlosSUFBakIsQ0FBRixDQUFqQjtBQUNBVyw2QkFBU0UsSUFBVCxDQUFjLGtCQUFkLEVBQWtDYixJQUFsQztBQUNBLHlCQUFLRyxJQUFMLENBQVVXLE1BQVYsQ0FBaUJILFFBQWpCO0FBQ0g7QUFFRCxxQkFBS0ksY0FBTCxDQUFvQixLQUFLWixJQUFMLENBQVVhLElBQVYsQ0FBZSxVQUFmLENBQXBCO0FBQ0g7QUFDSjs7O3VDQUVrQjtBQUNmLGdCQUFJLEtBQUt2QixLQUFMLEtBQWUsSUFBbkIsRUFBeUI7QUFDckI7QUFDSDtBQUVELGdCQUFNd0IsY0FBYyxLQUFLQyxjQUFMLEVBQXBCO0FBRUEsZ0JBQUlELFlBQVlaLE1BQVosSUFBc0IsS0FBS2MsaUJBQUwsRUFBMUIsRUFBb0Q7QUFDaEQscUJBQUtDLFFBQUwsQ0FBY0gsV0FBZDtBQUNILGFBRkQsTUFFTztBQUNILHFCQUFLZCxJQUFMLENBQVVDLEtBQVY7QUFDSDtBQUNKOzs7aUNBRWVpQixNLEVBQWU7QUFDM0Isa0JBQU0sSUFBSUMsS0FBSixDQUFVLG9EQUFWLENBQU47QUFDSDs7OzRDQUV1QjtBQUNwQixtQkFBTyxDQUFQO0FBQ0g7OztvQ0FFZTtBQUNaLGlCQUFLMUIsS0FBTCxDQUFXMkIsT0FBWDtBQUNIOzs7O0VBdERtQ25DLFNBQVNvQyxjIiwiZmlsZSI6ImxpYi9zZXJ2aWNlcy9vbW5pLXNlbGVjdC1saXN0LXZpZXcuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBTcGFjZVBlbiBmcm9tIFwiYXRvbS1zcGFjZS1wZW4tdmlld3NcIjtcbmNvbnN0ICQgPSByZXF1aXJlKFwianF1ZXJ5XCIpO1xuZXhwb3J0IGNsYXNzIE9tbmlTZWxlY3RMaXN0VmlldyBleHRlbmRzIFNwYWNlUGVuLlNlbGVjdExpc3RWaWV3IHtcbiAgICBjb25zdHJ1Y3RvcihwbGFjZWhvbGRlclRleHQpIHtcbiAgICAgICAgc3VwZXIoeyBwbGFjZWhvbGRlclRleHQ6IHBsYWNlaG9sZGVyVGV4dCB9KTtcbiAgICAgICAgdGhpcy5pdGVtcyA9IFtdO1xuICAgICAgICB0aGlzLnNldEl0ZW1zKFtdKTtcbiAgICAgICAgdGhpcy5zdG9yZUZvY3VzZWRFbGVtZW50KCk7XG4gICAgICAgIHRoaXMucGFuZWwgPSBhdG9tLndvcmtzcGFjZS5hZGRNb2RhbFBhbmVsKHsgaXRlbTogdGhpcyB9KTtcbiAgICAgICAgdGhpcy5mb2N1c0ZpbHRlckVkaXRvcigpO1xuICAgIH1cbiAgICBhZGRUb0xpc3Qoc3ltYm9scykge1xuICAgICAgICB0aGlzLmxpc3QuZW1wdHkoKTtcbiAgICAgICAgaWYgKHN5bWJvbHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgdGhpcy5zZXRFcnJvcihudWxsKTtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgTWF0aC5taW4oc3ltYm9scy5sZW5ndGgsIHRoaXMubWF4SXRlbXMpOyBpKyspIHtcbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtID0gc3ltYm9sc1tpXTtcbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtVmlldyA9ICQodGhpcy52aWV3Rm9ySXRlbShpdGVtKSk7XG4gICAgICAgICAgICAgICAgaXRlbVZpZXcuZGF0YShcInNlbGVjdC1saXN0LWl0ZW1cIiwgaXRlbSk7XG4gICAgICAgICAgICAgICAgdGhpcy5saXN0LmFwcGVuZChpdGVtVmlldyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnNlbGVjdEl0ZW1WaWV3KHRoaXMubGlzdC5maW5kKFwibGk6Zmlyc3RcIikpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHBvcHVsYXRlTGlzdCgpIHtcbiAgICAgICAgaWYgKHRoaXMuaXRlbXMgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBmaWx0ZXJRdWVyeSA9IHRoaXMuZ2V0RmlsdGVyUXVlcnkoKTtcbiAgICAgICAgaWYgKGZpbHRlclF1ZXJ5Lmxlbmd0aCA+PSB0aGlzLmdldE1pblF1ZXJ5TGVuZ3RoKCkpIHtcbiAgICAgICAgICAgIHRoaXMub25GaWx0ZXIoZmlsdGVyUXVlcnkpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5saXN0LmVtcHR5KCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgb25GaWx0ZXIoZmlsdGVyKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlN1YmNsYXNzIG11c3QgaW1wbGVtZW50IGFuIG9uRmlsdGVyKGZpbHRlcikgbWV0aG9kXCIpO1xuICAgIH1cbiAgICBnZXRNaW5RdWVyeUxlbmd0aCgpIHtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICAgIGNhbmNlbGxlZCgpIHtcbiAgICAgICAgdGhpcy5wYW5lbC5kZXN0cm95KCk7XG4gICAgfVxufVxuIiwiaW1wb3J0IHtNb2RlbHN9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XHJcbmltcG9ydCAqIGFzIFNwYWNlUGVuIGZyb20gXCJhdG9tLXNwYWNlLXBlbi12aWV3c1wiO1xyXG5jb25zdCAkIDogSlF1ZXJ5U3RhdGljID0gcmVxdWlyZShcImpxdWVyeVwiKTtcclxuXHJcbmV4cG9ydCBjbGFzcyBPbW5pU2VsZWN0TGlzdFZpZXcgZXh0ZW5kcyBTcGFjZVBlbi5TZWxlY3RMaXN0VmlldyB7XHJcbiAgICBwdWJsaWMgcGFuZWw6IEF0b20uUGFuZWw7XHJcbiAgICBwcml2YXRlIGl0ZW1zOiBhbnlbXSA9IFtdO1xyXG4gICAgcHJpdmF0ZSBsaXN0OiBhbnk7XHJcblxyXG4gICAgY29uc3RydWN0b3IocGxhY2Vob2xkZXJUZXh0IDogc3RyaW5nKSB7XHJcbiAgICAgICAgc3VwZXIoeyBwbGFjZWhvbGRlclRleHQ6IHBsYWNlaG9sZGVyVGV4dCB9KTtcclxuICAgICAgICB0aGlzLnNldEl0ZW1zKFtdKTtcclxuICAgICAgICB0aGlzLnN0b3JlRm9jdXNlZEVsZW1lbnQoKTtcclxuICAgICAgICB0aGlzLnBhbmVsID0gYXRvbS53b3Jrc3BhY2UuYWRkTW9kYWxQYW5lbCh7IGl0ZW06IHRoaXMgfSk7XHJcbiAgICAgICAgdGhpcy5mb2N1c0ZpbHRlckVkaXRvcigpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBhZGRUb0xpc3Qoc3ltYm9scyA6IE1vZGVscy5RdWlja0ZpeFtdKSA6IHZvaWQge1xyXG4gICAgICAgIHRoaXMubGlzdC5lbXB0eSgpO1xyXG5cclxuICAgICAgICBpZiAoc3ltYm9scy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0RXJyb3IobnVsbCk7XHJcblxyXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IE1hdGgubWluKHN5bWJvbHMubGVuZ3RoLCB0aGlzLm1heEl0ZW1zKTsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtID0gc3ltYm9sc1tpXTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1WaWV3ID0gJCh0aGlzLnZpZXdGb3JJdGVtKGl0ZW0pKTtcclxuICAgICAgICAgICAgICAgIGl0ZW1WaWV3LmRhdGEoXCJzZWxlY3QtbGlzdC1pdGVtXCIsIGl0ZW0pO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5saXN0LmFwcGVuZChpdGVtVmlldyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0SXRlbVZpZXcodGhpcy5saXN0LmZpbmQoXCJsaTpmaXJzdFwiKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBwb3B1bGF0ZUxpc3QoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuaXRlbXMgPT09IG51bGwpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgZmlsdGVyUXVlcnkgPSB0aGlzLmdldEZpbHRlclF1ZXJ5KCk7XHJcblxyXG4gICAgICAgIGlmIChmaWx0ZXJRdWVyeS5sZW5ndGggPj0gdGhpcy5nZXRNaW5RdWVyeUxlbmd0aCgpKSB7XHJcbiAgICAgICAgICAgIHRoaXMub25GaWx0ZXIoZmlsdGVyUXVlcnkpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMubGlzdC5lbXB0eSgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgb25GaWx0ZXIoZmlsdGVyIDogc3RyaW5nKSA6IHZvaWQge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlN1YmNsYXNzIG11c3QgaW1wbGVtZW50IGFuIG9uRmlsdGVyKGZpbHRlcikgbWV0aG9kXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXRNaW5RdWVyeUxlbmd0aCgpIDogbnVtYmVyIHtcclxuICAgICAgICByZXR1cm4gMDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgY2FuY2VsbGVkKCkge1xyXG4gICAgICAgIHRoaXMucGFuZWwuZGVzdHJveSgpO1xyXG4gICAgfVxyXG59XHJcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
