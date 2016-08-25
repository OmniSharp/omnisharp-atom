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

        var _this = _possibleConstructorReturn(this, (TooltipView.__proto__ || Object.getPrototypeOf(TooltipView)).call(this));

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy90b29sdGlwLXZpZXcuanMiLCJsaWIvdmlld3MvdG9vbHRpcC12aWV3LnRzIl0sIm5hbWVzIjpbInNwYWNlUGVuIiwiJCIsImpRdWVyeSIsIlRvb2x0aXBWaWV3IiwicmVjdCIsImRvY3VtZW50IiwiYm9keSIsImFwcGVuZCIsInVwZGF0ZVBvc2l0aW9uIiwidGV4dCIsImlubmVyIiwiaHRtbCIsImNzcyIsImZhZGVUbyIsIm9mZnNldCIsImxlZnQiLCJyaWdodCIsInRvcCIsImJvdHRvbSIsInVuZGVmaW5lZCIsIm9mZnNldFdpZHRoIiwid2lkdGgiLCJvZmZzZXRIZWlnaHQiLCJoZWlnaHQiLCJkaXYiLCJjbGFzcyIsIm91dGxldCIsIlZpZXciXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztJQ0FZQSxROzs7Ozs7Ozs7O0FBQ1osSUFBTUMsSUFBSUQsU0FBU0UsTUFBbkI7O0lBU0FDLFcsV0FBQUEsVzs7O0FBUUkseUJBQW1CQyxJQUFuQixFQUE2QjtBQUFBOztBQUFBOztBQUFWLGNBQUFBLElBQUEsR0FBQUEsSUFBQTtBQUVmSCxVQUFFSSxTQUFTQyxJQUFYLEVBQWlCQyxNQUFqQixDQUF3QixNQUFLLENBQUwsQ0FBeEI7QUFDQSxjQUFLQyxjQUFMO0FBSHlCO0FBSTVCOzs7O21DQUlpQkMsSSxFQUFZO0FBQzFCLGlCQUFLQyxLQUFMLENBQVdDLElBQVgsQ0FBZ0JGLElBQWhCO0FBQ0EsaUJBQUtDLEtBQUwsQ0FBV0UsR0FBWCxDQUFlLEVBQUUsZUFBZSxLQUFqQixFQUF3QixjQUFjLE1BQXRDLEVBQWY7QUFDQSxpQkFBS0osY0FBTDtBQUNNLGlCQUFNSyxNQUFOLENBQWEsR0FBYixFQUFrQixDQUFsQjtBQUNUOzs7eUNBRW9CO0FBQ2pCLGdCQUFNQyxTQUFTLEVBQWY7QUFDQSxnQkFBSUMsT0FBTyxLQUFLWCxJQUFMLENBQVVZLEtBQXJCO0FBQ0EsZ0JBQUlDLE1BQU0sS0FBS2IsSUFBTCxDQUFVYyxNQUFwQjtBQUNBLGdCQUFJRixRQUFnQkcsU0FBcEI7QUFHQSxnQkFBSUosT0FBTyxLQUFLLENBQUwsRUFBUUssV0FBZixJQUE4Qm5CLEVBQUVJLFNBQVNDLElBQVgsRUFBaUJlLEtBQWpCLEVBQWxDLEVBQ0lOLE9BQU9kLEVBQUVJLFNBQVNDLElBQVgsRUFBaUJlLEtBQWpCLEtBQTJCLEtBQUssQ0FBTCxFQUFRRCxXQUFuQyxHQUFpRE4sTUFBeEQ7QUFDSixnQkFBSUMsT0FBTyxDQUFYLEVBQWM7QUFDVixxQkFBS0gsR0FBTCxDQUFTLEVBQUUsZUFBZSxVQUFqQixFQUFUO0FBQ0FHLHVCQUFPRCxNQUFQO0FBQ0FFLHdCQUFRRixNQUFSO0FBQ0g7QUFHRCxnQkFBSUcsTUFBTSxLQUFLLENBQUwsRUFBUUssWUFBZCxJQUE4QnJCLEVBQUVJLFNBQVNDLElBQVgsRUFBaUJpQixNQUFqQixFQUFsQyxFQUE2RDtBQUN6RE4sc0JBQU0sS0FBS2IsSUFBTCxDQUFVYSxHQUFWLEdBQWdCLEtBQUssQ0FBTCxFQUFRSyxZQUE5QjtBQUNIO0FBRUQsaUJBQUtWLEdBQUwsQ0FBUyxFQUFFRyxVQUFGLEVBQVFFLFFBQVIsRUFBYUQsWUFBYixFQUFUO0FBQ0g7OztrQ0ExQ29CO0FBQUE7O0FBQ2pCLG1CQUFPLEtBQUtRLEdBQUwsQ0FBUyxFQUFFQyxPQUFPLGlDQUFULEVBQVQsRUFBdUQsWUFBQTtBQUMxRCx1QkFBS0QsR0FBTCxDQUFTLEVBQUVDLE9BQU8sZUFBVCxFQUEwQkMsUUFBUSxPQUFsQyxFQUFUO0FBQ0gsYUFGTSxDQUFQO0FBR0g7Ozs7RUFONEIxQixTQUFTMkIsSSIsImZpbGUiOiJsaWIvdmlld3MvdG9vbHRpcC12aWV3LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgc3BhY2VQZW4gZnJvbSBcImF0b20tc3BhY2UtcGVuLXZpZXdzXCI7XG5jb25zdCAkID0gc3BhY2VQZW4ualF1ZXJ5O1xuZXhwb3J0IGNsYXNzIFRvb2x0aXBWaWV3IGV4dGVuZHMgc3BhY2VQZW4uVmlldyB7XG4gICAgY29uc3RydWN0b3IocmVjdCkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLnJlY3QgPSByZWN0O1xuICAgICAgICAkKGRvY3VtZW50LmJvZHkpLmFwcGVuZCh0aGlzWzBdKTtcbiAgICAgICAgdGhpcy51cGRhdGVQb3NpdGlvbigpO1xuICAgIH1cbiAgICBzdGF0aWMgY29udGVudCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGl2KHsgY2xhc3M6IFwiYXRvbS10eXBlc2NyaXB0LXRvb2x0aXAgdG9vbHRpcFwiIH0sICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuZGl2KHsgY2xhc3M6IFwidG9vbHRpcC1pbm5lclwiLCBvdXRsZXQ6IFwiaW5uZXJcIiB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHVwZGF0ZVRleHQodGV4dCkge1xuICAgICAgICB0aGlzLmlubmVyLmh0bWwodGV4dCk7XG4gICAgICAgIHRoaXMuaW5uZXIuY3NzKHsgXCJ3aGl0ZS1zcGFjZVwiOiBcInByZVwiLCBcInRleHQtYWxpZ25cIjogXCJsZWZ0XCIgfSk7XG4gICAgICAgIHRoaXMudXBkYXRlUG9zaXRpb24oKTtcbiAgICAgICAgdGhpcy5mYWRlVG8oMzAwLCAxKTtcbiAgICB9XG4gICAgdXBkYXRlUG9zaXRpb24oKSB7XG4gICAgICAgIGNvbnN0IG9mZnNldCA9IDEwO1xuICAgICAgICBsZXQgbGVmdCA9IHRoaXMucmVjdC5yaWdodDtcbiAgICAgICAgbGV0IHRvcCA9IHRoaXMucmVjdC5ib3R0b207XG4gICAgICAgIGxldCByaWdodCA9IHVuZGVmaW5lZDtcbiAgICAgICAgaWYgKGxlZnQgKyB0aGlzWzBdLm9mZnNldFdpZHRoID49ICQoZG9jdW1lbnQuYm9keSkud2lkdGgoKSlcbiAgICAgICAgICAgIGxlZnQgPSAkKGRvY3VtZW50LmJvZHkpLndpZHRoKCkgLSB0aGlzWzBdLm9mZnNldFdpZHRoIC0gb2Zmc2V0O1xuICAgICAgICBpZiAobGVmdCA8IDApIHtcbiAgICAgICAgICAgIHRoaXMuY3NzKHsgXCJ3aGl0ZS1zcGFjZVwiOiBcInByZS13cmFwXCIgfSk7XG4gICAgICAgICAgICBsZWZ0ID0gb2Zmc2V0O1xuICAgICAgICAgICAgcmlnaHQgPSBvZmZzZXQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRvcCArIHRoaXNbMF0ub2Zmc2V0SGVpZ2h0ID49ICQoZG9jdW1lbnQuYm9keSkuaGVpZ2h0KCkpIHtcbiAgICAgICAgICAgIHRvcCA9IHRoaXMucmVjdC50b3AgLSB0aGlzWzBdLm9mZnNldEhlaWdodDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmNzcyh7IGxlZnQsIHRvcCwgcmlnaHQgfSk7XG4gICAgfVxufVxuIiwiaW1wb3J0ICogYXMgc3BhY2VQZW4gZnJvbSBcImF0b20tc3BhY2UtcGVuLXZpZXdzXCI7XHJcbmNvbnN0ICQgPSBzcGFjZVBlbi5qUXVlcnk7XHJcblxyXG5pbnRlcmZhY2UgUmVjdCB7XHJcbiAgICBsZWZ0OiBudW1iZXI7XHJcbiAgICByaWdodDogbnVtYmVyO1xyXG4gICAgdG9wOiBudW1iZXI7XHJcbiAgICBib3R0b206IG51bWJlcjtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIFRvb2x0aXBWaWV3IGV4dGVuZHMgc3BhY2VQZW4uVmlldyB7XHJcblxyXG4gICAgcHVibGljIHN0YXRpYyBjb250ZW50KCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmRpdih7IGNsYXNzOiBcImF0b20tdHlwZXNjcmlwdC10b29sdGlwIHRvb2x0aXBcIiB9LCAoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuZGl2KHsgY2xhc3M6IFwidG9vbHRpcC1pbm5lclwiLCBvdXRsZXQ6IFwiaW5uZXJcIiB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgcmVjdDogUmVjdCkge1xyXG4gICAgICAgIHN1cGVyKCk7XHJcbiAgICAgICAgJChkb2N1bWVudC5ib2R5KS5hcHBlbmQodGhpc1swXSk7XHJcbiAgICAgICAgdGhpcy51cGRhdGVQb3NpdGlvbigpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgaW5uZXI6IEpRdWVyeTtcclxuXHJcbiAgICBwdWJsaWMgdXBkYXRlVGV4dCh0ZXh0OiBzdHJpbmcpIHtcclxuICAgICAgICB0aGlzLmlubmVyLmh0bWwodGV4dCk7XHJcbiAgICAgICAgdGhpcy5pbm5lci5jc3MoeyBcIndoaXRlLXNwYWNlXCI6IFwicHJlXCIsIFwidGV4dC1hbGlnblwiOiBcImxlZnRcIiB9KTtcclxuICAgICAgICB0aGlzLnVwZGF0ZVBvc2l0aW9uKCk7XHJcbiAgICAgICAgKDxhbnk+dGhpcykuZmFkZVRvKDMwMCwgMSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHVwZGF0ZVBvc2l0aW9uKCkge1xyXG4gICAgICAgIGNvbnN0IG9mZnNldCA9IDEwO1xyXG4gICAgICAgIGxldCBsZWZ0ID0gdGhpcy5yZWN0LnJpZ2h0O1xyXG4gICAgICAgIGxldCB0b3AgPSB0aGlzLnJlY3QuYm90dG9tO1xyXG4gICAgICAgIGxldCByaWdodDogbnVtYmVyID0gdW5kZWZpbmVkO1xyXG5cclxuICAgICAgICAvLyBYIGF4aXMgYWRqdXN0XHJcbiAgICAgICAgaWYgKGxlZnQgKyB0aGlzWzBdLm9mZnNldFdpZHRoID49ICQoZG9jdW1lbnQuYm9keSkud2lkdGgoKSlcclxuICAgICAgICAgICAgbGVmdCA9ICQoZG9jdW1lbnQuYm9keSkud2lkdGgoKSAtIHRoaXNbMF0ub2Zmc2V0V2lkdGggLSBvZmZzZXQ7XHJcbiAgICAgICAgaWYgKGxlZnQgPCAwKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY3NzKHsgXCJ3aGl0ZS1zcGFjZVwiOiBcInByZS13cmFwXCIgfSk7XHJcbiAgICAgICAgICAgIGxlZnQgPSBvZmZzZXQ7XHJcbiAgICAgICAgICAgIHJpZ2h0ID0gb2Zmc2V0O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gWSBheGlzIGFkanVzdFxyXG4gICAgICAgIGlmICh0b3AgKyB0aGlzWzBdLm9mZnNldEhlaWdodCA+PSAkKGRvY3VtZW50LmJvZHkpLmhlaWdodCgpKSB7XHJcbiAgICAgICAgICAgIHRvcCA9IHRoaXMucmVjdC50b3AgLSB0aGlzWzBdLm9mZnNldEhlaWdodDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuY3NzKHsgbGVmdCwgdG9wLCByaWdodCB9KTtcclxuICAgIH1cclxufVxyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
