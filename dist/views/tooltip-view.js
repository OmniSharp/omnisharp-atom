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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy90b29sdGlwLXZpZXcuanMiLCJsaWIvdmlld3MvdG9vbHRpcC12aWV3LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztJQ0FZOzs7Ozs7Ozs7O0FBQ1osSUFBTSxJQUFJLFNBQVMsTUFBVDs7SUFTVjs7O0FBUUkseUJBQW1CLElBQW5CLEVBQTZCOzs7OztBQUFWLGNBQUEsSUFBQSxHQUFBLElBQUEsQ0FBVTtBQUV6QixVQUFFLFNBQVMsSUFBVCxDQUFGLENBQWlCLE1BQWpCLENBQXdCLE1BQUssQ0FBTCxDQUF4QixFQUZ5QjtBQUd6QixjQUFLLGNBQUwsR0FIeUI7O0tBQTdCOzs7O21DQVFrQixNQUFZO0FBQzFCLGlCQUFLLEtBQUwsQ0FBVyxJQUFYLENBQWdCLElBQWhCLEVBRDBCO0FBRTFCLGlCQUFLLEtBQUwsQ0FBVyxHQUFYLENBQWUsRUFBRSxlQUFlLEtBQWYsRUFBc0IsY0FBYyxNQUFkLEVBQXZDLEVBRjBCO0FBRzFCLGlCQUFLLGNBQUwsR0FIMEI7QUFJcEIsaUJBQU0sTUFBTixDQUFhLEdBQWIsRUFBa0IsQ0FBbEIsRUFKb0I7Ozs7eUNBT1Q7QUFDakIsZ0JBQU0sU0FBUyxFQUFULENBRFc7QUFFakIsZ0JBQUksT0FBTyxLQUFLLElBQUwsQ0FBVSxLQUFWLENBRk07QUFHakIsZ0JBQUksTUFBTSxLQUFLLElBQUwsQ0FBVSxNQUFWLENBSE87QUFJakIsZ0JBQUksUUFBZ0IsU0FBaEIsQ0FKYTtBQU9qQixnQkFBSSxPQUFPLEtBQUssQ0FBTCxFQUFRLFdBQVIsSUFBdUIsRUFBRSxTQUFTLElBQVQsQ0FBRixDQUFpQixLQUFqQixFQUE5QixFQUNBLE9BQU8sRUFBRSxTQUFTLElBQVQsQ0FBRixDQUFpQixLQUFqQixLQUEyQixLQUFLLENBQUwsRUFBUSxXQUFSLEdBQXNCLE1BQWpELENBRFg7QUFFQSxnQkFBSSxPQUFPLENBQVAsRUFBVTtBQUNWLHFCQUFLLEdBQUwsQ0FBUyxFQUFFLGVBQWUsVUFBZixFQUFYLEVBRFU7QUFFVix1QkFBTyxNQUFQLENBRlU7QUFHVix3QkFBUSxNQUFSLENBSFU7YUFBZDtBQU9BLGdCQUFJLE1BQU0sS0FBSyxDQUFMLEVBQVEsWUFBUixJQUF3QixFQUFFLFNBQVMsSUFBVCxDQUFGLENBQWlCLE1BQWpCLEVBQTlCLEVBQXlEO0FBQ3pELHNCQUFNLEtBQUssSUFBTCxDQUFVLEdBQVYsR0FBZ0IsS0FBSyxDQUFMLEVBQVEsWUFBUixDQURtQzthQUE3RDtBQUlBLGlCQUFLLEdBQUwsQ0FBUyxFQUFFLFVBQUYsRUFBUSxRQUFSLEVBQWEsWUFBYixFQUFULEVBcEJpQjs7OztrQ0FyQkE7OztBQUNqQixtQkFBTyxLQUFLLEdBQUwsQ0FBUyxFQUFFLE9BQU8saUNBQVAsRUFBWCxFQUF1RCxZQUFBO0FBQzFELHVCQUFLLEdBQUwsQ0FBUyxFQUFFLE9BQU8sZUFBUCxFQUF3QixRQUFRLE9BQVIsRUFBbkMsRUFEMEQ7YUFBQSxDQUE5RCxDQURpQjs7Ozs7RUFGUSxTQUFTLElBQVQiLCJmaWxlIjoibGliL3ZpZXdzL3Rvb2x0aXAtdmlldy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHNwYWNlUGVuIGZyb20gXCJhdG9tLXNwYWNlLXBlbi12aWV3c1wiO1xuY29uc3QgJCA9IHNwYWNlUGVuLmpRdWVyeTtcbmV4cG9ydCBjbGFzcyBUb29sdGlwVmlldyBleHRlbmRzIHNwYWNlUGVuLlZpZXcge1xuICAgIGNvbnN0cnVjdG9yKHJlY3QpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5yZWN0ID0gcmVjdDtcbiAgICAgICAgJChkb2N1bWVudC5ib2R5KS5hcHBlbmQodGhpc1swXSk7XG4gICAgICAgIHRoaXMudXBkYXRlUG9zaXRpb24oKTtcbiAgICB9XG4gICAgc3RhdGljIGNvbnRlbnQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmRpdih7IGNsYXNzOiBcImF0b20tdHlwZXNjcmlwdC10b29sdGlwIHRvb2x0aXBcIiB9LCAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmRpdih7IGNsYXNzOiBcInRvb2x0aXAtaW5uZXJcIiwgb3V0bGV0OiBcImlubmVyXCIgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICB1cGRhdGVUZXh0KHRleHQpIHtcbiAgICAgICAgdGhpcy5pbm5lci5odG1sKHRleHQpO1xuICAgICAgICB0aGlzLmlubmVyLmNzcyh7IFwid2hpdGUtc3BhY2VcIjogXCJwcmVcIiwgXCJ0ZXh0LWFsaWduXCI6IFwibGVmdFwiIH0pO1xuICAgICAgICB0aGlzLnVwZGF0ZVBvc2l0aW9uKCk7XG4gICAgICAgIHRoaXMuZmFkZVRvKDMwMCwgMSk7XG4gICAgfVxuICAgIHVwZGF0ZVBvc2l0aW9uKCkge1xuICAgICAgICBjb25zdCBvZmZzZXQgPSAxMDtcbiAgICAgICAgbGV0IGxlZnQgPSB0aGlzLnJlY3QucmlnaHQ7XG4gICAgICAgIGxldCB0b3AgPSB0aGlzLnJlY3QuYm90dG9tO1xuICAgICAgICBsZXQgcmlnaHQgPSB1bmRlZmluZWQ7XG4gICAgICAgIGlmIChsZWZ0ICsgdGhpc1swXS5vZmZzZXRXaWR0aCA+PSAkKGRvY3VtZW50LmJvZHkpLndpZHRoKCkpXG4gICAgICAgICAgICBsZWZ0ID0gJChkb2N1bWVudC5ib2R5KS53aWR0aCgpIC0gdGhpc1swXS5vZmZzZXRXaWR0aCAtIG9mZnNldDtcbiAgICAgICAgaWYgKGxlZnQgPCAwKSB7XG4gICAgICAgICAgICB0aGlzLmNzcyh7IFwid2hpdGUtc3BhY2VcIjogXCJwcmUtd3JhcFwiIH0pO1xuICAgICAgICAgICAgbGVmdCA9IG9mZnNldDtcbiAgICAgICAgICAgIHJpZ2h0ID0gb2Zmc2V0O1xuICAgICAgICB9XG4gICAgICAgIGlmICh0b3AgKyB0aGlzWzBdLm9mZnNldEhlaWdodCA+PSAkKGRvY3VtZW50LmJvZHkpLmhlaWdodCgpKSB7XG4gICAgICAgICAgICB0b3AgPSB0aGlzLnJlY3QudG9wIC0gdGhpc1swXS5vZmZzZXRIZWlnaHQ7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5jc3MoeyBsZWZ0LCB0b3AsIHJpZ2h0IH0pO1xuICAgIH1cbn1cbiIsImltcG9ydCAqIGFzIHNwYWNlUGVuIGZyb20gXCJhdG9tLXNwYWNlLXBlbi12aWV3c1wiO1xyXG5jb25zdCAkID0gc3BhY2VQZW4ualF1ZXJ5O1xyXG5cclxuaW50ZXJmYWNlIFJlY3Qge1xyXG4gICAgbGVmdDogbnVtYmVyO1xyXG4gICAgcmlnaHQ6IG51bWJlcjtcclxuICAgIHRvcDogbnVtYmVyO1xyXG4gICAgYm90dG9tOiBudW1iZXI7XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBUb29sdGlwVmlldyBleHRlbmRzIHNwYWNlUGVuLlZpZXcge1xyXG5cclxuICAgIHB1YmxpYyBzdGF0aWMgY29udGVudCgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5kaXYoeyBjbGFzczogXCJhdG9tLXR5cGVzY3JpcHQtdG9vbHRpcCB0b29sdGlwXCIgfSwgKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLmRpdih7IGNsYXNzOiBcInRvb2x0aXAtaW5uZXJcIiwgb3V0bGV0OiBcImlubmVyXCIgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3RydWN0b3IocHVibGljIHJlY3Q6IFJlY3QpIHtcclxuICAgICAgICBzdXBlcigpO1xyXG4gICAgICAgICQoZG9jdW1lbnQuYm9keSkuYXBwZW5kKHRoaXNbMF0pO1xyXG4gICAgICAgIHRoaXMudXBkYXRlUG9zaXRpb24oKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGlubmVyOiBKUXVlcnk7XHJcblxyXG4gICAgcHVibGljIHVwZGF0ZVRleHQodGV4dDogc3RyaW5nKSB7XHJcbiAgICAgICAgdGhpcy5pbm5lci5odG1sKHRleHQpO1xyXG4gICAgICAgIHRoaXMuaW5uZXIuY3NzKHsgXCJ3aGl0ZS1zcGFjZVwiOiBcInByZVwiLCBcInRleHQtYWxpZ25cIjogXCJsZWZ0XCIgfSk7XHJcbiAgICAgICAgdGhpcy51cGRhdGVQb3NpdGlvbigpO1xyXG4gICAgICAgICg8YW55PnRoaXMpLmZhZGVUbygzMDAsIDEpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB1cGRhdGVQb3NpdGlvbigpIHtcclxuICAgICAgICBjb25zdCBvZmZzZXQgPSAxMDtcclxuICAgICAgICBsZXQgbGVmdCA9IHRoaXMucmVjdC5yaWdodDtcclxuICAgICAgICBsZXQgdG9wID0gdGhpcy5yZWN0LmJvdHRvbTtcclxuICAgICAgICBsZXQgcmlnaHQ6IG51bWJlciA9IHVuZGVmaW5lZDtcclxuXHJcbiAgICAgICAgLy8gWCBheGlzIGFkanVzdFxyXG4gICAgICAgIGlmIChsZWZ0ICsgdGhpc1swXS5vZmZzZXRXaWR0aCA+PSAkKGRvY3VtZW50LmJvZHkpLndpZHRoKCkpXHJcbiAgICAgICAgICAgIGxlZnQgPSAkKGRvY3VtZW50LmJvZHkpLndpZHRoKCkgLSB0aGlzWzBdLm9mZnNldFdpZHRoIC0gb2Zmc2V0O1xyXG4gICAgICAgIGlmIChsZWZ0IDwgMCkge1xyXG4gICAgICAgICAgICB0aGlzLmNzcyh7IFwid2hpdGUtc3BhY2VcIjogXCJwcmUtd3JhcFwiIH0pO1xyXG4gICAgICAgICAgICBsZWZ0ID0gb2Zmc2V0O1xyXG4gICAgICAgICAgICByaWdodCA9IG9mZnNldDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFkgYXhpcyBhZGp1c3RcclxuICAgICAgICBpZiAodG9wICsgdGhpc1swXS5vZmZzZXRIZWlnaHQgPj0gJChkb2N1bWVudC5ib2R5KS5oZWlnaHQoKSkge1xyXG4gICAgICAgICAgICB0b3AgPSB0aGlzLnJlY3QudG9wIC0gdGhpc1swXS5vZmZzZXRIZWlnaHQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmNzcyh7IGxlZnQsIHRvcCwgcmlnaHQgfSk7XHJcbiAgICB9XHJcbn1cclxuIl19
