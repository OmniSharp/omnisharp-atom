"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.TooltipView = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _atomSpacePenViews = require("atom-space-pen-views");

var spacePen = _interopRequireWildcard(_atomSpacePenViews);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var $ = spacePen.jQuery;

var TooltipView = exports.TooltipView = function (_spacePen$View) {
    _inherits(TooltipView, _spacePen$View);

    function TooltipView(rect) {
        _classCallCheck(this, TooltipView);

        var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(TooltipView).call(this));

        _this.rect = rect;
        $(document.body).append(_this[0]);
        _this.updatePosition();
        return _this;
    }

    _createClass(TooltipView, [{
        key: "updateText",
        value: function updateText(text) {
            this.inner.html(text);
            this.inner.css({ "white-space": "pre", "text-align": "left" });
            this.updatePosition();
            this.fadeTo(300, 1);
        }
    }, {
        key: "updatePosition",
        value: function updatePosition() {
            var offset = 10;
            var left = this.rect.right;
            var top = this.rect.bottom;
            var right = undefined;
            if (left + this[0].offsetWidth >= $(document.body).width()) left = $(document.body).width() - this[0].offsetWidth - offset;
            if (left < 0) {
                this.css({ "white-space": "pre-wrap" });
                left = offset;
                right = offset;
            }
            if (top + this[0].offsetHeight >= $(document.body).height()) {
                top = this.rect.top - this[0].offsetHeight;
            }
            this.css({ left: left, top: top, right: right });
        }
    }], [{
        key: "content",
        value: function content() {
            var _this2 = this;

            return this.div({ class: "atom-typescript-tooltip tooltip" }, function () {
                _this2.div({ class: "tooltip-inner", outlet: "inner" });
            });
        }
    }]);

    return TooltipView;
}(spacePen.View);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy90b29sdGlwLXZpZXcuanMiLCJsaWIvdmlld3MvdG9vbHRpcC12aWV3LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztJQ0FZLFE7Ozs7Ozs7Ozs7QUFDWixJQUFNLElBQUksU0FBUyxNQUFuQjs7SUFTQSxXLFdBQUEsVzs7O0FBUUkseUJBQW1CLElBQW5CLEVBQTZCO0FBQUE7O0FBQUE7O0FBQVYsY0FBQSxJQUFBLEdBQUEsSUFBQTtBQUVmLFVBQUUsU0FBUyxJQUFYLEVBQWlCLE1BQWpCLENBQXdCLE1BQUssQ0FBTCxDQUF4QjtBQUNBLGNBQUssY0FBTDtBQUh5QjtBQUk1Qjs7OzttQ0FJaUIsSSxFQUFZO0FBQzFCLGlCQUFLLEtBQUwsQ0FBVyxJQUFYLENBQWdCLElBQWhCO0FBQ0EsaUJBQUssS0FBTCxDQUFXLEdBQVgsQ0FBZSxFQUFFLGVBQWUsS0FBakIsRUFBd0IsY0FBYyxNQUF0QyxFQUFmO0FBQ0EsaUJBQUssY0FBTDtBQUNNLGlCQUFNLE1BQU4sQ0FBYSxHQUFiLEVBQWtCLENBQWxCO0FBQ1Q7Ozt5Q0FFb0I7QUFDakIsZ0JBQU0sU0FBUyxFQUFmO0FBQ0EsZ0JBQUksT0FBTyxLQUFLLElBQUwsQ0FBVSxLQUFyQjtBQUNBLGdCQUFJLE1BQU0sS0FBSyxJQUFMLENBQVUsTUFBcEI7QUFDQSxnQkFBSSxRQUFnQixTQUFwQjtBQUdBLGdCQUFJLE9BQU8sS0FBSyxDQUFMLEVBQVEsV0FBZixJQUE4QixFQUFFLFNBQVMsSUFBWCxFQUFpQixLQUFqQixFQUFsQyxFQUNJLE9BQU8sRUFBRSxTQUFTLElBQVgsRUFBaUIsS0FBakIsS0FBMkIsS0FBSyxDQUFMLEVBQVEsV0FBbkMsR0FBaUQsTUFBeEQ7QUFDSixnQkFBSSxPQUFPLENBQVgsRUFBYztBQUNWLHFCQUFLLEdBQUwsQ0FBUyxFQUFFLGVBQWUsVUFBakIsRUFBVDtBQUNBLHVCQUFPLE1BQVA7QUFDQSx3QkFBUSxNQUFSO0FBQ0g7QUFHRCxnQkFBSSxNQUFNLEtBQUssQ0FBTCxFQUFRLFlBQWQsSUFBOEIsRUFBRSxTQUFTLElBQVgsRUFBaUIsTUFBakIsRUFBbEMsRUFBNkQ7QUFDekQsc0JBQU0sS0FBSyxJQUFMLENBQVUsR0FBVixHQUFnQixLQUFLLENBQUwsRUFBUSxZQUE5QjtBQUNIO0FBRUQsaUJBQUssR0FBTCxDQUFTLEVBQUUsVUFBRixFQUFRLFFBQVIsRUFBYSxZQUFiLEVBQVQ7QUFDSDs7O2tDQTFDb0I7QUFBQTs7QUFDakIsbUJBQU8sS0FBSyxHQUFMLENBQVMsRUFBRSxPQUFPLGlDQUFULEVBQVQsRUFBdUQsWUFBQTtBQUMxRCx1QkFBSyxHQUFMLENBQVMsRUFBRSxPQUFPLGVBQVQsRUFBMEIsUUFBUSxPQUFsQyxFQUFUO0FBQ0gsYUFGTSxDQUFQO0FBR0g7Ozs7RUFONEIsU0FBUyxJIiwiZmlsZSI6ImxpYi92aWV3cy90b29sdGlwLXZpZXcuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBzcGFjZVBlbiBmcm9tIFwiYXRvbS1zcGFjZS1wZW4tdmlld3NcIjtcbmNvbnN0ICQgPSBzcGFjZVBlbi5qUXVlcnk7XG5leHBvcnQgY2xhc3MgVG9vbHRpcFZpZXcgZXh0ZW5kcyBzcGFjZVBlbi5WaWV3IHtcbiAgICBjb25zdHJ1Y3RvcihyZWN0KSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMucmVjdCA9IHJlY3Q7XG4gICAgICAgICQoZG9jdW1lbnQuYm9keSkuYXBwZW5kKHRoaXNbMF0pO1xuICAgICAgICB0aGlzLnVwZGF0ZVBvc2l0aW9uKCk7XG4gICAgfVxuICAgIHN0YXRpYyBjb250ZW50KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5kaXYoeyBjbGFzczogXCJhdG9tLXR5cGVzY3JpcHQtdG9vbHRpcCB0b29sdGlwXCIgfSwgKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5kaXYoeyBjbGFzczogXCJ0b29sdGlwLWlubmVyXCIsIG91dGxldDogXCJpbm5lclwiIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgdXBkYXRlVGV4dCh0ZXh0KSB7XG4gICAgICAgIHRoaXMuaW5uZXIuaHRtbCh0ZXh0KTtcbiAgICAgICAgdGhpcy5pbm5lci5jc3MoeyBcIndoaXRlLXNwYWNlXCI6IFwicHJlXCIsIFwidGV4dC1hbGlnblwiOiBcImxlZnRcIiB9KTtcbiAgICAgICAgdGhpcy51cGRhdGVQb3NpdGlvbigpO1xuICAgICAgICB0aGlzLmZhZGVUbygzMDAsIDEpO1xuICAgIH1cbiAgICB1cGRhdGVQb3NpdGlvbigpIHtcbiAgICAgICAgY29uc3Qgb2Zmc2V0ID0gMTA7XG4gICAgICAgIGxldCBsZWZ0ID0gdGhpcy5yZWN0LnJpZ2h0O1xuICAgICAgICBsZXQgdG9wID0gdGhpcy5yZWN0LmJvdHRvbTtcbiAgICAgICAgbGV0IHJpZ2h0ID0gdW5kZWZpbmVkO1xuICAgICAgICBpZiAobGVmdCArIHRoaXNbMF0ub2Zmc2V0V2lkdGggPj0gJChkb2N1bWVudC5ib2R5KS53aWR0aCgpKVxuICAgICAgICAgICAgbGVmdCA9ICQoZG9jdW1lbnQuYm9keSkud2lkdGgoKSAtIHRoaXNbMF0ub2Zmc2V0V2lkdGggLSBvZmZzZXQ7XG4gICAgICAgIGlmIChsZWZ0IDwgMCkge1xuICAgICAgICAgICAgdGhpcy5jc3MoeyBcIndoaXRlLXNwYWNlXCI6IFwicHJlLXdyYXBcIiB9KTtcbiAgICAgICAgICAgIGxlZnQgPSBvZmZzZXQ7XG4gICAgICAgICAgICByaWdodCA9IG9mZnNldDtcbiAgICAgICAgfVxuICAgICAgICBpZiAodG9wICsgdGhpc1swXS5vZmZzZXRIZWlnaHQgPj0gJChkb2N1bWVudC5ib2R5KS5oZWlnaHQoKSkge1xuICAgICAgICAgICAgdG9wID0gdGhpcy5yZWN0LnRvcCAtIHRoaXNbMF0ub2Zmc2V0SGVpZ2h0O1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuY3NzKHsgbGVmdCwgdG9wLCByaWdodCB9KTtcbiAgICB9XG59XG4iLCJpbXBvcnQgKiBhcyBzcGFjZVBlbiBmcm9tIFwiYXRvbS1zcGFjZS1wZW4tdmlld3NcIjtcclxuY29uc3QgJCA9IHNwYWNlUGVuLmpRdWVyeTtcclxuXHJcbmludGVyZmFjZSBSZWN0IHtcclxuICAgIGxlZnQ6IG51bWJlcjtcclxuICAgIHJpZ2h0OiBudW1iZXI7XHJcbiAgICB0b3A6IG51bWJlcjtcclxuICAgIGJvdHRvbTogbnVtYmVyO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgVG9vbHRpcFZpZXcgZXh0ZW5kcyBzcGFjZVBlbi5WaWV3IHtcclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIGNvbnRlbnQoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZGl2KHsgY2xhc3M6IFwiYXRvbS10eXBlc2NyaXB0LXRvb2x0aXAgdG9vbHRpcFwiIH0sICgpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5kaXYoeyBjbGFzczogXCJ0b29sdGlwLWlubmVyXCIsIG91dGxldDogXCJpbm5lclwiIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0cnVjdG9yKHB1YmxpYyByZWN0OiBSZWN0KSB7XHJcbiAgICAgICAgc3VwZXIoKTtcclxuICAgICAgICAkKGRvY3VtZW50LmJvZHkpLmFwcGVuZCh0aGlzWzBdKTtcclxuICAgICAgICB0aGlzLnVwZGF0ZVBvc2l0aW9uKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBpbm5lcjogSlF1ZXJ5O1xyXG5cclxuICAgIHB1YmxpYyB1cGRhdGVUZXh0KHRleHQ6IHN0cmluZykge1xyXG4gICAgICAgIHRoaXMuaW5uZXIuaHRtbCh0ZXh0KTtcclxuICAgICAgICB0aGlzLmlubmVyLmNzcyh7IFwid2hpdGUtc3BhY2VcIjogXCJwcmVcIiwgXCJ0ZXh0LWFsaWduXCI6IFwibGVmdFwiIH0pO1xyXG4gICAgICAgIHRoaXMudXBkYXRlUG9zaXRpb24oKTtcclxuICAgICAgICAoPGFueT50aGlzKS5mYWRlVG8oMzAwLCAxKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgdXBkYXRlUG9zaXRpb24oKSB7XHJcbiAgICAgICAgY29uc3Qgb2Zmc2V0ID0gMTA7XHJcbiAgICAgICAgbGV0IGxlZnQgPSB0aGlzLnJlY3QucmlnaHQ7XHJcbiAgICAgICAgbGV0IHRvcCA9IHRoaXMucmVjdC5ib3R0b207XHJcbiAgICAgICAgbGV0IHJpZ2h0OiBudW1iZXIgPSB1bmRlZmluZWQ7XHJcblxyXG4gICAgICAgIC8vIFggYXhpcyBhZGp1c3RcclxuICAgICAgICBpZiAobGVmdCArIHRoaXNbMF0ub2Zmc2V0V2lkdGggPj0gJChkb2N1bWVudC5ib2R5KS53aWR0aCgpKVxyXG4gICAgICAgICAgICBsZWZ0ID0gJChkb2N1bWVudC5ib2R5KS53aWR0aCgpIC0gdGhpc1swXS5vZmZzZXRXaWR0aCAtIG9mZnNldDtcclxuICAgICAgICBpZiAobGVmdCA8IDApIHtcclxuICAgICAgICAgICAgdGhpcy5jc3MoeyBcIndoaXRlLXNwYWNlXCI6IFwicHJlLXdyYXBcIiB9KTtcclxuICAgICAgICAgICAgbGVmdCA9IG9mZnNldDtcclxuICAgICAgICAgICAgcmlnaHQgPSBvZmZzZXQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBZIGF4aXMgYWRqdXN0XHJcbiAgICAgICAgaWYgKHRvcCArIHRoaXNbMF0ub2Zmc2V0SGVpZ2h0ID49ICQoZG9jdW1lbnQuYm9keSkuaGVpZ2h0KCkpIHtcclxuICAgICAgICAgICAgdG9wID0gdGhpcy5yZWN0LnRvcCAtIHRoaXNbMF0ub2Zmc2V0SGVpZ2h0O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5jc3MoeyBsZWZ0LCB0b3AsIHJpZ2h0IH0pO1xyXG4gICAgfVxyXG59XHJcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
