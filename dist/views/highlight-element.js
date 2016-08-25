"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.HighlightElement = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _textEditorPool = require("./text-editor-pool");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var HighlightElement = exports.HighlightElement = function (_HTMLElement) {
    _inherits(HighlightElement, _HTMLElement);

    function HighlightElement() {
        _classCallCheck(this, HighlightElement);

        return _possibleConstructorReturn(this, (HighlightElement.__proto__ || Object.getPrototypeOf(HighlightElement)).apply(this, arguments));
    }

    _createClass(HighlightElement, [{
        key: "createdCallback",
        value: function createdCallback() {
            this._editor = new _textEditorPool.EditorElement();
        }
    }, {
        key: "attachedCallback",
        value: function attachedCallback() {
            this.appendChild(this._editor);
        }
    }, {
        key: "detachedCallback",
        value: function detachedCallback() {
            this.removeChild(this._editor);
        }
    }, {
        key: "revert",
        value: function revert() {
            this._editor.revert();
        }
    }, {
        key: "enhance",
        value: function enhance() {
            this._editor.enhance();
        }
    }, {
        key: "usage",
        set: function set(usage) {
            this._editor.usage = usage;
        }
    }]);

    return HighlightElement;
}(HTMLElement);

exports.HighlightElement = document.registerElement("omnisharp-highlight-element", { prototype: HighlightElement.prototype });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy9oaWdobGlnaHQtZWxlbWVudC5qcyIsImxpYi92aWV3cy9oaWdobGlnaHQtZWxlbWVudC50cyJdLCJuYW1lcyI6WyJIaWdobGlnaHRFbGVtZW50IiwiX2VkaXRvciIsImFwcGVuZENoaWxkIiwicmVtb3ZlQ2hpbGQiLCJyZXZlcnQiLCJlbmhhbmNlIiwidXNhZ2UiLCJIVE1MRWxlbWVudCIsImV4cG9ydHMiLCJkb2N1bWVudCIsInJlZ2lzdGVyRWxlbWVudCIsInByb3RvdHlwZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7Ozs7Ozs7O0lDR0FBLGdCLFdBQUFBLGdCOzs7Ozs7Ozs7OzswQ0FHMEI7QUFDbEIsaUJBQUtDLE9BQUwsR0FBZSxtQ0FBZjtBQUNIOzs7MkNBRXNCO0FBQ25CLGlCQUFLQyxXQUFMLENBQWlCLEtBQUtELE9BQXRCO0FBQ0g7OzsyQ0FFc0I7QUFDbkIsaUJBQUtFLFdBQUwsQ0FBaUIsS0FBS0YsT0FBdEI7QUFDSDs7O2lDQUVZO0FBQ1QsaUJBQUtBLE9BQUwsQ0FBYUcsTUFBYjtBQUNIOzs7a0NBRWE7QUFDVixpQkFBS0gsT0FBTCxDQUFhSSxPQUFiO0FBQ0g7OzswQkFFZ0JDLEssRUFBc0I7QUFDbkMsaUJBQUtMLE9BQUwsQ0FBYUssS0FBYixHQUFxQkEsS0FBckI7QUFDSDs7OztFQXpCaUNDLFc7O0FBNEJoQ0MsUUFBU1IsZ0JBQVQsR0FBa0NTLFNBQVVDLGVBQVYsQ0FBMEIsNkJBQTFCLEVBQXlELEVBQUVDLFdBQVdYLGlCQUFpQlcsU0FBOUIsRUFBekQsQ0FBbEMiLCJmaWxlIjoibGliL3ZpZXdzL2hpZ2hsaWdodC1lbGVtZW50LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRWRpdG9yRWxlbWVudCB9IGZyb20gXCIuL3RleHQtZWRpdG9yLXBvb2xcIjtcbmV4cG9ydCBjbGFzcyBIaWdobGlnaHRFbGVtZW50IGV4dGVuZHMgSFRNTEVsZW1lbnQge1xuICAgIGNyZWF0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdGhpcy5fZWRpdG9yID0gbmV3IEVkaXRvckVsZW1lbnQ7XG4gICAgfVxuICAgIGF0dGFjaGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQodGhpcy5fZWRpdG9yKTtcbiAgICB9XG4gICAgZGV0YWNoZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdGhpcy5yZW1vdmVDaGlsZCh0aGlzLl9lZGl0b3IpO1xuICAgIH1cbiAgICByZXZlcnQoKSB7XG4gICAgICAgIHRoaXMuX2VkaXRvci5yZXZlcnQoKTtcbiAgICB9XG4gICAgZW5oYW5jZSgpIHtcbiAgICAgICAgdGhpcy5fZWRpdG9yLmVuaGFuY2UoKTtcbiAgICB9XG4gICAgc2V0IHVzYWdlKHVzYWdlKSB7XG4gICAgICAgIHRoaXMuX2VkaXRvci51c2FnZSA9IHVzYWdlO1xuICAgIH1cbn1cbmV4cG9ydHMuSGlnaGxpZ2h0RWxlbWVudCA9IGRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudChcIm9tbmlzaGFycC1oaWdobGlnaHQtZWxlbWVudFwiLCB7IHByb3RvdHlwZTogSGlnaGxpZ2h0RWxlbWVudC5wcm90b3R5cGUgfSk7XG4iLCJpbXBvcnQge01vZGVsc30gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcclxuaW1wb3J0IHtFZGl0b3JFbGVtZW50fSBmcm9tIFwiLi90ZXh0LWVkaXRvci1wb29sXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgSGlnaGxpZ2h0RWxlbWVudCBleHRlbmRzIEhUTUxFbGVtZW50IGltcGxlbWVudHMgV2ViQ29tcG9uZW50IHtcclxuICAgIHByaXZhdGUgX2VkaXRvcjogRWRpdG9yRWxlbWVudDtcclxuXHJcbiAgICBwdWJsaWMgY3JlYXRlZENhbGxiYWNrKCkge1xyXG4gICAgICAgIHRoaXMuX2VkaXRvciA9IG5ldyBFZGl0b3JFbGVtZW50O1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBhdHRhY2hlZENhbGxiYWNrKCkge1xyXG4gICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQodGhpcy5fZWRpdG9yKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGV0YWNoZWRDYWxsYmFjaygpIHtcclxuICAgICAgICB0aGlzLnJlbW92ZUNoaWxkKHRoaXMuX2VkaXRvcik7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJldmVydCgpIHtcclxuICAgICAgICB0aGlzLl9lZGl0b3IucmV2ZXJ0KCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGVuaGFuY2UoKSB7XHJcbiAgICAgICAgdGhpcy5fZWRpdG9yLmVuaGFuY2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2V0IHVzYWdlKHVzYWdlOiBNb2RlbHMuUXVpY2tGaXgpIHtcclxuICAgICAgICB0aGlzLl9lZGl0b3IudXNhZ2UgPSB1c2FnZTtcclxuICAgIH1cclxufVxyXG5cclxuKDxhbnk+ZXhwb3J0cykuSGlnaGxpZ2h0RWxlbWVudCA9ICg8YW55PmRvY3VtZW50KS5yZWdpc3RlckVsZW1lbnQoXCJvbW5pc2hhcnAtaGlnaGxpZ2h0LWVsZW1lbnRcIiwgeyBwcm90b3R5cGU6IEhpZ2hsaWdodEVsZW1lbnQucHJvdG90eXBlIH0pO1xyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
