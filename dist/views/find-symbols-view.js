"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.FindSymbolsView = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _omniSelectListView = require("../services/omni-select-list-view");

var _omni = require("../server/omni");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var FindSymbolsView = exports.FindSymbolsView = function (_OmniSelectListView) {
    _inherits(FindSymbolsView, _OmniSelectListView);

    function FindSymbolsView() {
        _classCallCheck(this, FindSymbolsView);

        var _this = _possibleConstructorReturn(this, (FindSymbolsView.__proto__ || Object.getPrototypeOf(FindSymbolsView)).call(this, "Find Symbols"));

        _this.setMaxItems(50);
        return _this;
    }

    _createClass(FindSymbolsView, [{
        key: "viewForItem",
        value: function viewForItem(item) {
            return "<li>\n            <span>\n            <img style=\"margin-right: 0.75em;\" height=\"16px\" width=\"16px\" src=\"atom://omnisharp-atom/styles/icons/autocomplete_" + item.Kind.toLowerCase() + "@3x.png\" />\n            <span>" + item.Text + "</span>\n            </span>\n            <br/>\n            <span class=\"filename\">" + atom.project.relativizePath(item.FileName)[1] + ": " + item.Line + "</span>\n            </li>";
        }
    }, {
        key: "getFilterKey",
        value: function getFilterKey() {
            return "Text";
        }
    }, {
        key: "confirmed",
        value: function confirmed(item) {
            this.cancel();
            this.hide();
            _omni.Omni.navigateTo(item);
            return null;
        }
    }, {
        key: "onFilter",
        value: function onFilter(filter) {
            _omni.Omni.request(function (solution) {
                return solution.findsymbols({ Filter: filter });
            });
        }
    }, {
        key: "getMinQueryLength",
        value: function getMinQueryLength() {
            return 1;
        }
    }]);

    return FindSymbolsView;
}(_omniSelectListView.OmniSelectListView);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy9maW5kLXN5bWJvbHMtdmlldy5qcyIsImxpYi92aWV3cy9maW5kLXN5bWJvbHMtdmlldy50cyJdLCJuYW1lcyI6WyJGaW5kU3ltYm9sc1ZpZXciLCJzZXRNYXhJdGVtcyIsIml0ZW0iLCJLaW5kIiwidG9Mb3dlckNhc2UiLCJUZXh0IiwiYXRvbSIsInByb2plY3QiLCJyZWxhdGl2aXplUGF0aCIsIkZpbGVOYW1lIiwiTGluZSIsImNhbmNlbCIsImhpZGUiLCJuYXZpZ2F0ZVRvIiwiZmlsdGVyIiwicmVxdWVzdCIsInNvbHV0aW9uIiwiZmluZHN5bWJvbHMiLCJGaWx0ZXIiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQUNBOzs7Ozs7OztJQ0dBQSxlLFdBQUFBLGU7OztBQUNJLCtCQUFBO0FBQUE7O0FBQUEsc0lBQ1UsY0FEVjs7QUFHSSxjQUFLQyxXQUFMLENBQWlCLEVBQWpCO0FBSEo7QUFJQzs7OztvQ0FFa0JDLEksRUFBMkI7QUFDMUMsd0xBRTBIQSxLQUFLQyxJQUFMLENBQVVDLFdBQVYsRUFGMUgsd0NBR2FGLEtBQUtHLElBSGxCLDhGQU04QkMsS0FBS0MsT0FBTCxDQUFhQyxjQUFiLENBQTRCTixLQUFLTyxRQUFqQyxFQUEyQyxDQUEzQyxDQU45QixVQU1pRlAsS0FBS1EsSUFOdEY7QUFRSDs7O3VDQUVrQjtBQUNmLG1CQUFPLE1BQVA7QUFDSDs7O2tDQUVnQlIsSSxFQUFTO0FBQ3RCLGlCQUFLUyxNQUFMO0FBQ0EsaUJBQUtDLElBQUw7QUFFQSx1QkFBS0MsVUFBTCxDQUFnQlgsSUFBaEI7QUFDQSxtQkFBTyxJQUFQO0FBQ0g7OztpQ0FFZVksTSxFQUFjO0FBQzFCLHVCQUFLQyxPQUFMLENBQWE7QUFBQSx1QkFBYUMsU0FBU0MsV0FBVCxDQUFxQixFQUFFQyxRQUFRSixNQUFWLEVBQXJCLENBQWI7QUFBQSxhQUFiO0FBQ0g7Ozs0Q0FFdUI7QUFDcEIsbUJBQU8sQ0FBUDtBQUNIIiwiZmlsZSI6ImxpYi92aWV3cy9maW5kLXN5bWJvbHMtdmlldy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE9tbmlTZWxlY3RMaXN0VmlldyB9IGZyb20gXCIuLi9zZXJ2aWNlcy9vbW5pLXNlbGVjdC1saXN0LXZpZXdcIjtcbmltcG9ydCB7IE9tbmkgfSBmcm9tIFwiLi4vc2VydmVyL29tbmlcIjtcbmV4cG9ydCBjbGFzcyBGaW5kU3ltYm9sc1ZpZXcgZXh0ZW5kcyBPbW5pU2VsZWN0TGlzdFZpZXcge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcihcIkZpbmQgU3ltYm9sc1wiKTtcbiAgICAgICAgdGhpcy5zZXRNYXhJdGVtcyg1MCk7XG4gICAgfVxuICAgIHZpZXdGb3JJdGVtKGl0ZW0pIHtcbiAgICAgICAgcmV0dXJuIGA8bGk+XHJcbiAgICAgICAgICAgIDxzcGFuPlxyXG4gICAgICAgICAgICA8aW1nIHN0eWxlPVwibWFyZ2luLXJpZ2h0OiAwLjc1ZW07XCIgaGVpZ2h0PVwiMTZweFwiIHdpZHRoPVwiMTZweFwiIHNyYz1cImF0b206Ly9vbW5pc2hhcnAtYXRvbS9zdHlsZXMvaWNvbnMvYXV0b2NvbXBsZXRlXyR7aXRlbS5LaW5kLnRvTG93ZXJDYXNlKCl9QDN4LnBuZ1wiIC8+XHJcbiAgICAgICAgICAgIDxzcGFuPiR7aXRlbS5UZXh0fTwvc3Bhbj5cclxuICAgICAgICAgICAgPC9zcGFuPlxyXG4gICAgICAgICAgICA8YnIvPlxyXG4gICAgICAgICAgICA8c3BhbiBjbGFzcz1cImZpbGVuYW1lXCI+JHthdG9tLnByb2plY3QucmVsYXRpdml6ZVBhdGgoaXRlbS5GaWxlTmFtZSlbMV19OiAke2l0ZW0uTGluZX08L3NwYW4+XHJcbiAgICAgICAgICAgIDwvbGk+YDtcbiAgICB9XG4gICAgZ2V0RmlsdGVyS2V5KCkge1xuICAgICAgICByZXR1cm4gXCJUZXh0XCI7XG4gICAgfVxuICAgIGNvbmZpcm1lZChpdGVtKSB7XG4gICAgICAgIHRoaXMuY2FuY2VsKCk7XG4gICAgICAgIHRoaXMuaGlkZSgpO1xuICAgICAgICBPbW5pLm5hdmlnYXRlVG8oaXRlbSk7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBvbkZpbHRlcihmaWx0ZXIpIHtcbiAgICAgICAgT21uaS5yZXF1ZXN0KHNvbHV0aW9uID0+IHNvbHV0aW9uLmZpbmRzeW1ib2xzKHsgRmlsdGVyOiBmaWx0ZXIgfSkpO1xuICAgIH1cbiAgICBnZXRNaW5RdWVyeUxlbmd0aCgpIHtcbiAgICAgICAgcmV0dXJuIDE7XG4gICAgfVxufVxuIiwiaW1wb3J0IHtNb2RlbHN9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XHJcbmltcG9ydCB7T21uaVNlbGVjdExpc3RWaWV3fSBmcm9tIFwiLi4vc2VydmljZXMvb21uaS1zZWxlY3QtbGlzdC12aWV3XCI7XHJcbmltcG9ydCB7T21uaX0gZnJvbSBcIi4uL3NlcnZlci9vbW5pXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgRmluZFN5bWJvbHNWaWV3IGV4dGVuZHMgT21uaVNlbGVjdExpc3RWaWV3IHtcclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHN1cGVyKFwiRmluZCBTeW1ib2xzXCIpO1xyXG5cclxuICAgICAgICB0aGlzLnNldE1heEl0ZW1zKDUwKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgdmlld0Zvckl0ZW0oaXRlbTogTW9kZWxzLlN5bWJvbExvY2F0aW9uKSB7XHJcbiAgICAgICAgcmV0dXJuIGA8bGk+XHJcbiAgICAgICAgICAgIDxzcGFuPlxyXG4gICAgICAgICAgICA8aW1nIHN0eWxlPVwibWFyZ2luLXJpZ2h0OiAwLjc1ZW07XCIgaGVpZ2h0PVwiMTZweFwiIHdpZHRoPVwiMTZweFwiIHNyYz1cImF0b206Ly9vbW5pc2hhcnAtYXRvbS9zdHlsZXMvaWNvbnMvYXV0b2NvbXBsZXRlXyR7IGl0ZW0uS2luZC50b0xvd2VyQ2FzZSgpIH1AM3gucG5nXCIgLz5cclxuICAgICAgICAgICAgPHNwYW4+JHsgaXRlbS5UZXh0IH08L3NwYW4+XHJcbiAgICAgICAgICAgIDwvc3Bhbj5cclxuICAgICAgICAgICAgPGJyLz5cclxuICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJmaWxlbmFtZVwiPiR7IGF0b20ucHJvamVjdC5yZWxhdGl2aXplUGF0aChpdGVtLkZpbGVOYW1lKVsxXSB9OiAke2l0ZW0uTGluZX08L3NwYW4+XHJcbiAgICAgICAgICAgIDwvbGk+YDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0RmlsdGVyS2V5KCkge1xyXG4gICAgICAgIHJldHVybiBcIlRleHRcIjtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgY29uZmlybWVkKGl0ZW06IGFueSk6IGFueSB7XHJcbiAgICAgICAgdGhpcy5jYW5jZWwoKTtcclxuICAgICAgICB0aGlzLmhpZGUoKTtcclxuXHJcbiAgICAgICAgT21uaS5uYXZpZ2F0ZVRvKGl0ZW0pO1xyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBvbkZpbHRlcihmaWx0ZXI6IHN0cmluZykge1xyXG4gICAgICAgIE9tbmkucmVxdWVzdChzb2x1dGlvbiA9PiAgc29sdXRpb24uZmluZHN5bWJvbHMoeyBGaWx0ZXI6IGZpbHRlciB9KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldE1pblF1ZXJ5TGVuZ3RoKCkge1xyXG4gICAgICAgIHJldHVybiAxO1xyXG4gICAgfVxyXG59XHJcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
