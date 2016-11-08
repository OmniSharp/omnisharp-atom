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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy9oaWdobGlnaHQtZWxlbWVudC5qcyIsImxpYi92aWV3cy9oaWdobGlnaHQtZWxlbWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7Ozs7Ozs7SUNHQTs7Ozs7Ozs7Ozs7MENBRzBCO0FBQ2xCLGlCQUFLLE9BQUwsR0FBZSxtQ0FBZixDQURrQjs7OzsyQ0FJQztBQUNuQixpQkFBSyxXQUFMLENBQWlCLEtBQUssT0FBTCxDQUFqQixDQURtQjs7OzsyQ0FJQTtBQUNuQixpQkFBSyxXQUFMLENBQWlCLEtBQUssT0FBTCxDQUFqQixDQURtQjs7OztpQ0FJVjtBQUNULGlCQUFLLE9BQUwsQ0FBYSxNQUFiLEdBRFM7Ozs7a0NBSUM7QUFDVixpQkFBSyxPQUFMLENBQWEsT0FBYixHQURVOzs7OzBCQUlHLE9BQXNCO0FBQ25DLGlCQUFLLE9BQUwsQ0FBYSxLQUFiLEdBQXFCLEtBQXJCLENBRG1DOzs7OztFQXZCTDs7QUE0QmhDLFFBQVMsZ0JBQVQsR0FBa0MsU0FBVSxlQUFWLENBQTBCLDZCQUExQixFQUF5RCxFQUFFLFdBQVcsaUJBQWlCLFNBQWpCLEVBQXRFLENBQWxDIiwiZmlsZSI6ImxpYi92aWV3cy9oaWdobGlnaHQtZWxlbWVudC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEVkaXRvckVsZW1lbnQgfSBmcm9tIFwiLi90ZXh0LWVkaXRvci1wb29sXCI7XG5leHBvcnQgY2xhc3MgSGlnaGxpZ2h0RWxlbWVudCBleHRlbmRzIEhUTUxFbGVtZW50IHtcbiAgICBjcmVhdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMuX2VkaXRvciA9IG5ldyBFZGl0b3JFbGVtZW50O1xuICAgIH1cbiAgICBhdHRhY2hlZENhbGxiYWNrKCkge1xuICAgICAgICB0aGlzLmFwcGVuZENoaWxkKHRoaXMuX2VkaXRvcik7XG4gICAgfVxuICAgIGRldGFjaGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMucmVtb3ZlQ2hpbGQodGhpcy5fZWRpdG9yKTtcbiAgICB9XG4gICAgcmV2ZXJ0KCkge1xuICAgICAgICB0aGlzLl9lZGl0b3IucmV2ZXJ0KCk7XG4gICAgfVxuICAgIGVuaGFuY2UoKSB7XG4gICAgICAgIHRoaXMuX2VkaXRvci5lbmhhbmNlKCk7XG4gICAgfVxuICAgIHNldCB1c2FnZSh1c2FnZSkge1xuICAgICAgICB0aGlzLl9lZGl0b3IudXNhZ2UgPSB1c2FnZTtcbiAgICB9XG59XG5leHBvcnRzLkhpZ2hsaWdodEVsZW1lbnQgPSBkb2N1bWVudC5yZWdpc3RlckVsZW1lbnQoXCJvbW5pc2hhcnAtaGlnaGxpZ2h0LWVsZW1lbnRcIiwgeyBwcm90b3R5cGU6IEhpZ2hsaWdodEVsZW1lbnQucHJvdG90eXBlIH0pO1xuIiwiaW1wb3J0IHtNb2RlbHN9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XHJcbmltcG9ydCB7RWRpdG9yRWxlbWVudH0gZnJvbSBcIi4vdGV4dC1lZGl0b3ItcG9vbFwiO1xyXG5cclxuZXhwb3J0IGNsYXNzIEhpZ2hsaWdodEVsZW1lbnQgZXh0ZW5kcyBIVE1MRWxlbWVudCBpbXBsZW1lbnRzIFdlYkNvbXBvbmVudCB7XHJcbiAgICBwcml2YXRlIF9lZGl0b3I6IEVkaXRvckVsZW1lbnQ7XHJcblxyXG4gICAgcHVibGljIGNyZWF0ZWRDYWxsYmFjaygpIHtcclxuICAgICAgICB0aGlzLl9lZGl0b3IgPSBuZXcgRWRpdG9yRWxlbWVudDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgYXR0YWNoZWRDYWxsYmFjaygpIHtcclxuICAgICAgICB0aGlzLmFwcGVuZENoaWxkKHRoaXMuX2VkaXRvcik7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRldGFjaGVkQ2FsbGJhY2soKSB7XHJcbiAgICAgICAgdGhpcy5yZW1vdmVDaGlsZCh0aGlzLl9lZGl0b3IpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZXZlcnQoKSB7XHJcbiAgICAgICAgdGhpcy5fZWRpdG9yLnJldmVydCgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBlbmhhbmNlKCkge1xyXG4gICAgICAgIHRoaXMuX2VkaXRvci5lbmhhbmNlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHNldCB1c2FnZSh1c2FnZTogTW9kZWxzLlF1aWNrRml4KSB7XHJcbiAgICAgICAgdGhpcy5fZWRpdG9yLnVzYWdlID0gdXNhZ2U7XHJcbiAgICB9XHJcbn1cclxuXHJcbig8YW55PmV4cG9ydHMpLkhpZ2hsaWdodEVsZW1lbnQgPSAoPGFueT5kb2N1bWVudCkucmVnaXN0ZXJFbGVtZW50KFwib21uaXNoYXJwLWhpZ2hsaWdodC1lbGVtZW50XCIsIHsgcHJvdG90eXBlOiBIaWdobGlnaHRFbGVtZW50LnByb3RvdHlwZSB9KTtcclxuIl19
