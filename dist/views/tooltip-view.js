'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.TooltipView = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _atomSpacePenViews = require('atom-space-pen-views');

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
        key: 'updateText',
        value: function updateText(text) {
            this.inner.html(text);
            this.inner.css({ 'white-space': 'pre', 'text-align': 'left' });
            this.updatePosition();
            this.fadeTo(300, 1);
        }
    }, {
        key: 'updatePosition',
        value: function updatePosition() {
            var offset = 10;
            var left = this.rect.right;
            var top = this.rect.bottom;
            var right = undefined;
            if (left + this[0].offsetWidth >= $(document.body).width()) left = $(document.body).width() - this[0].offsetWidth - offset;
            if (left < 0) {
                this.css({ 'white-space': 'pre-wrap' });
                left = offset;
                right = offset;
            }
            if (top + this[0].offsetHeight >= $(document.body).height()) {
                top = this.rect.top - this[0].offsetHeight;
            }
            this.css({ left: left, top: top, right: right });
        }
    }], [{
        key: 'content',
        value: function content() {
            var _this2 = this;

            return this.div({ class: 'atom-typescript-tooltip tooltip' }, function () {
                _this2.div({ class: 'tooltip-inner', outlet: 'inner' });
            });
        }
    }]);

    return TooltipView;
}(spacePen.View);
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy90b29sdGlwLXZpZXcudHMiXSwibmFtZXMiOlsic3BhY2VQZW4iLCIkIiwialF1ZXJ5IiwiVG9vbHRpcFZpZXciLCJyZWN0IiwiZG9jdW1lbnQiLCJib2R5IiwiYXBwZW5kIiwidXBkYXRlUG9zaXRpb24iLCJ0ZXh0IiwiaW5uZXIiLCJodG1sIiwiY3NzIiwiZmFkZVRvIiwib2Zmc2V0IiwibGVmdCIsInJpZ2h0IiwidG9wIiwiYm90dG9tIiwidW5kZWZpbmVkIiwib2Zmc2V0V2lkdGgiLCJ3aWR0aCIsIm9mZnNldEhlaWdodCIsImhlaWdodCIsImRpdiIsImNsYXNzIiwib3V0bGV0IiwiVmlldyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0lBQVlBLFE7Ozs7Ozs7Ozs7QUFDWixJQUFNQyxJQUFJRCxTQUFTRSxNQUFuQjs7SUFTTUMsVyxXQUFBQSxXOzs7QUFRRix5QkFBbUJDLElBQW5CLEVBQTZCO0FBQUE7O0FBQUE7O0FBQVYsY0FBQUEsSUFBQSxHQUFBQSxJQUFBO0FBRWZILFVBQUVJLFNBQVNDLElBQVgsRUFBaUJDLE1BQWpCLENBQXdCLE1BQUssQ0FBTCxDQUF4QjtBQUNBLGNBQUtDLGNBQUw7QUFIeUI7QUFJNUI7Ozs7bUNBSWlCQyxJLEVBQVk7QUFDMUIsaUJBQUtDLEtBQUwsQ0FBV0MsSUFBWCxDQUFnQkYsSUFBaEI7QUFDQSxpQkFBS0MsS0FBTCxDQUFXRSxHQUFYLENBQWUsRUFBRSxlQUFlLEtBQWpCLEVBQXdCLGNBQWMsTUFBdEMsRUFBZjtBQUNBLGlCQUFLSixjQUFMO0FBQ00saUJBQU1LLE1BQU4sQ0FBYSxHQUFiLEVBQWtCLENBQWxCO0FBQ1Q7Ozt5Q0FFb0I7QUFDakIsZ0JBQU1DLFNBQVMsRUFBZjtBQUNBLGdCQUFJQyxPQUFPLEtBQUtYLElBQUwsQ0FBVVksS0FBckI7QUFDQSxnQkFBSUMsTUFBTSxLQUFLYixJQUFMLENBQVVjLE1BQXBCO0FBQ0EsZ0JBQUlGLFFBQWdCRyxTQUFwQjtBQUdBLGdCQUFJSixPQUFPLEtBQUssQ0FBTCxFQUFRSyxXQUFmLElBQThCbkIsRUFBRUksU0FBU0MsSUFBWCxFQUFpQmUsS0FBakIsRUFBbEMsRUFDSU4sT0FBT2QsRUFBRUksU0FBU0MsSUFBWCxFQUFpQmUsS0FBakIsS0FBMkIsS0FBSyxDQUFMLEVBQVFELFdBQW5DLEdBQWlETixNQUF4RDtBQUNKLGdCQUFJQyxPQUFPLENBQVgsRUFBYztBQUNWLHFCQUFLSCxHQUFMLENBQVMsRUFBRSxlQUFlLFVBQWpCLEVBQVQ7QUFDQUcsdUJBQU9ELE1BQVA7QUFDQUUsd0JBQVFGLE1BQVI7QUFDSDtBQUdELGdCQUFJRyxNQUFNLEtBQUssQ0FBTCxFQUFRSyxZQUFkLElBQThCckIsRUFBRUksU0FBU0MsSUFBWCxFQUFpQmlCLE1BQWpCLEVBQWxDLEVBQTZEO0FBQ3pETixzQkFBTSxLQUFLYixJQUFMLENBQVVhLEdBQVYsR0FBZ0IsS0FBSyxDQUFMLEVBQVFLLFlBQTlCO0FBQ0g7QUFFRCxpQkFBS1YsR0FBTCxDQUFTLEVBQUVHLFVBQUYsRUFBUUUsUUFBUixFQUFhRCxZQUFiLEVBQVQ7QUFDSDs7O2tDQTFDb0I7QUFBQTs7QUFDakIsbUJBQU8sS0FBS1EsR0FBTCxDQUFTLEVBQUVDLE9BQU8saUNBQVQsRUFBVCxFQUF1RCxZQUFBO0FBQzFELHVCQUFLRCxHQUFMLENBQVMsRUFBRUMsT0FBTyxlQUFULEVBQTBCQyxRQUFRLE9BQWxDLEVBQVQ7QUFDSCxhQUZNLENBQVA7QUFHSDs7OztFQU40QjFCLFNBQVMyQixJIiwiZmlsZSI6ImxpYi92aWV3cy90b29sdGlwLXZpZXcuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBzcGFjZVBlbiBmcm9tICdhdG9tLXNwYWNlLXBlbi12aWV3cyc7XHJcbmNvbnN0ICQgPSBzcGFjZVBlbi5qUXVlcnk7XHJcblxyXG5pbnRlcmZhY2UgUmVjdCB7XHJcbiAgICBsZWZ0OiBudW1iZXI7XHJcbiAgICByaWdodDogbnVtYmVyO1xyXG4gICAgdG9wOiBudW1iZXI7XHJcbiAgICBib3R0b206IG51bWJlcjtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIFRvb2x0aXBWaWV3IGV4dGVuZHMgc3BhY2VQZW4uVmlldyB7XHJcblxyXG4gICAgcHVibGljIHN0YXRpYyBjb250ZW50KCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmRpdih7IGNsYXNzOiAnYXRvbS10eXBlc2NyaXB0LXRvb2x0aXAgdG9vbHRpcCcgfSwgKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLmRpdih7IGNsYXNzOiAndG9vbHRpcC1pbm5lcicsIG91dGxldDogJ2lubmVyJyB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgcmVjdDogUmVjdCkge1xyXG4gICAgICAgIHN1cGVyKCk7XHJcbiAgICAgICAgJChkb2N1bWVudC5ib2R5KS5hcHBlbmQodGhpc1swXSk7XHJcbiAgICAgICAgdGhpcy51cGRhdGVQb3NpdGlvbigpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgaW5uZXI6IEpRdWVyeTtcclxuXHJcbiAgICBwdWJsaWMgdXBkYXRlVGV4dCh0ZXh0OiBzdHJpbmcpIHtcclxuICAgICAgICB0aGlzLmlubmVyLmh0bWwodGV4dCk7XHJcbiAgICAgICAgdGhpcy5pbm5lci5jc3MoeyAnd2hpdGUtc3BhY2UnOiAncHJlJywgJ3RleHQtYWxpZ24nOiAnbGVmdCcgfSk7XHJcbiAgICAgICAgdGhpcy51cGRhdGVQb3NpdGlvbigpO1xyXG4gICAgICAgICg8YW55PnRoaXMpLmZhZGVUbygzMDAsIDEpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB1cGRhdGVQb3NpdGlvbigpIHtcclxuICAgICAgICBjb25zdCBvZmZzZXQgPSAxMDtcclxuICAgICAgICBsZXQgbGVmdCA9IHRoaXMucmVjdC5yaWdodDtcclxuICAgICAgICBsZXQgdG9wID0gdGhpcy5yZWN0LmJvdHRvbTtcclxuICAgICAgICBsZXQgcmlnaHQ6IG51bWJlciA9IHVuZGVmaW5lZDtcclxuXHJcbiAgICAgICAgLy8gWCBheGlzIGFkanVzdFxyXG4gICAgICAgIGlmIChsZWZ0ICsgdGhpc1swXS5vZmZzZXRXaWR0aCA+PSAkKGRvY3VtZW50LmJvZHkpLndpZHRoKCkpXHJcbiAgICAgICAgICAgIGxlZnQgPSAkKGRvY3VtZW50LmJvZHkpLndpZHRoKCkgLSB0aGlzWzBdLm9mZnNldFdpZHRoIC0gb2Zmc2V0O1xyXG4gICAgICAgIGlmIChsZWZ0IDwgMCkge1xyXG4gICAgICAgICAgICB0aGlzLmNzcyh7ICd3aGl0ZS1zcGFjZSc6ICdwcmUtd3JhcCcgfSk7XHJcbiAgICAgICAgICAgIGxlZnQgPSBvZmZzZXQ7XHJcbiAgICAgICAgICAgIHJpZ2h0ID0gb2Zmc2V0O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gWSBheGlzIGFkanVzdFxyXG4gICAgICAgIGlmICh0b3AgKyB0aGlzWzBdLm9mZnNldEhlaWdodCA+PSAkKGRvY3VtZW50LmJvZHkpLmhlaWdodCgpKSB7XHJcbiAgICAgICAgICAgIHRvcCA9IHRoaXMucmVjdC50b3AgLSB0aGlzWzBdLm9mZnNldEhlaWdodDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuY3NzKHsgbGVmdCwgdG9wLCByaWdodCB9KTtcclxuICAgIH1cclxufVxyXG4iXX0=
