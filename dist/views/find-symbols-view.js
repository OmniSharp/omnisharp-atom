'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.FindSymbolsView = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _omni = require('../server/omni');

var _omniSelectListView = require('../services/omni-select-list-view');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var FindSymbolsView = exports.FindSymbolsView = function (_OmniSelectListView) {
    _inherits(FindSymbolsView, _OmniSelectListView);

    function FindSymbolsView() {
        _classCallCheck(this, FindSymbolsView);

        var _this = _possibleConstructorReturn(this, (FindSymbolsView.__proto__ || Object.getPrototypeOf(FindSymbolsView)).call(this, 'Find Symbols'));

        _this.setMaxItems(50);
        return _this;
    }

    _createClass(FindSymbolsView, [{
        key: 'viewForItem',
        value: function viewForItem(item) {
            return '<li>\n            <span>\n            <img style="margin-right: 0.75em;" height="16px" width="16px" src="atom://omnisharp-atom/styles/icons/autocomplete_' + item.Kind.toLowerCase() + '@3x.png" />\n            <span>' + item.Text + '</span>\n            </span>\n            <br/>\n            <span class="filename">' + atom.project.relativizePath(item.FileName)[1] + ': ' + item.Line + '</span>\n            </li>';
        }
    }, {
        key: 'getFilterKey',
        value: function getFilterKey() {
            return 'Text';
        }
    }, {
        key: 'confirmed',
        value: function confirmed(item) {
            this.cancel();
            this.hide();
            _omni.Omni.navigateTo(item);
            return null;
        }
    }, {
        key: 'onFilter',
        value: function onFilter(filter) {
            _omni.Omni.request(function (solution) {
                return solution.findsymbols({ Filter: filter });
            });
        }
    }, {
        key: 'getMinQueryLength',
        value: function getMinQueryLength() {
            return 1;
        }
    }]);

    return FindSymbolsView;
}(_omniSelectListView.OmniSelectListView);
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy9maW5kLXN5bWJvbHMtdmlldy50cyJdLCJuYW1lcyI6WyJGaW5kU3ltYm9sc1ZpZXciLCJzZXRNYXhJdGVtcyIsIml0ZW0iLCJLaW5kIiwidG9Mb3dlckNhc2UiLCJUZXh0IiwiYXRvbSIsInByb2plY3QiLCJyZWxhdGl2aXplUGF0aCIsIkZpbGVOYW1lIiwiTGluZSIsImNhbmNlbCIsImhpZGUiLCJuYXZpZ2F0ZVRvIiwiZmlsdGVyIiwicmVxdWVzdCIsInNvbHV0aW9uIiwiZmluZHN5bWJvbHMiLCJGaWx0ZXIiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUNBOztBQUNBOzs7Ozs7OztJQUVNQSxlLFdBQUFBLGU7OztBQUNGLCtCQUFBO0FBQUE7O0FBQUEsc0lBQ1UsY0FEVjs7QUFHSSxjQUFLQyxXQUFMLENBQWlCLEVBQWpCO0FBSEo7QUFJQzs7OztvQ0FFa0JDLEksRUFBMkI7QUFDMUMsaUxBRTBIQSxLQUFLQyxJQUFMLENBQVVDLFdBQVYsRUFGMUgsdUNBR2FGLEtBQUtHLElBSGxCLDRGQU04QkMsS0FBS0MsT0FBTCxDQUFhQyxjQUFiLENBQTRCTixLQUFLTyxRQUFqQyxFQUEyQyxDQUEzQyxDQU45QixVQU1pRlAsS0FBS1EsSUFOdEY7QUFRSDs7O3VDQUVrQjtBQUNmLG1CQUFPLE1BQVA7QUFDSDs7O2tDQUVnQlIsSSxFQUFTO0FBQ3RCLGlCQUFLUyxNQUFMO0FBQ0EsaUJBQUtDLElBQUw7QUFFQSx1QkFBS0MsVUFBTCxDQUFnQlgsSUFBaEI7QUFDQSxtQkFBTyxJQUFQO0FBQ0g7OztpQ0FFZVksTSxFQUFjO0FBQzFCLHVCQUFLQyxPQUFMLENBQWE7QUFBQSx1QkFBYUMsU0FBU0MsV0FBVCxDQUFxQixFQUFFQyxRQUFRSixNQUFWLEVBQXJCLENBQWI7QUFBQSxhQUFiO0FBQ0g7Ozs0Q0FFdUI7QUFDcEIsbUJBQU8sQ0FBUDtBQUNIIiwiZmlsZSI6ImxpYi92aWV3cy9maW5kLXN5bWJvbHMtdmlldy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7TW9kZWxzfSBmcm9tICdvbW5pc2hhcnAtY2xpZW50JztcclxuaW1wb3J0IHtPbW5pfSBmcm9tICcuLi9zZXJ2ZXIvb21uaSc7XHJcbmltcG9ydCB7T21uaVNlbGVjdExpc3RWaWV3fSBmcm9tICcuLi9zZXJ2aWNlcy9vbW5pLXNlbGVjdC1saXN0LXZpZXcnO1xyXG5cclxuZXhwb3J0IGNsYXNzIEZpbmRTeW1ib2xzVmlldyBleHRlbmRzIE9tbmlTZWxlY3RMaXN0VmlldyB7XHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICBzdXBlcignRmluZCBTeW1ib2xzJyk7XHJcblxyXG4gICAgICAgIHRoaXMuc2V0TWF4SXRlbXMoNTApO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB2aWV3Rm9ySXRlbShpdGVtOiBNb2RlbHMuU3ltYm9sTG9jYXRpb24pIHtcclxuICAgICAgICByZXR1cm4gYDxsaT5cclxuICAgICAgICAgICAgPHNwYW4+XHJcbiAgICAgICAgICAgIDxpbWcgc3R5bGU9XCJtYXJnaW4tcmlnaHQ6IDAuNzVlbTtcIiBoZWlnaHQ9XCIxNnB4XCIgd2lkdGg9XCIxNnB4XCIgc3JjPVwiYXRvbTovL29tbmlzaGFycC1hdG9tL3N0eWxlcy9pY29ucy9hdXRvY29tcGxldGVfJHsgaXRlbS5LaW5kLnRvTG93ZXJDYXNlKCkgfUAzeC5wbmdcIiAvPlxyXG4gICAgICAgICAgICA8c3Bhbj4keyBpdGVtLlRleHQgfTwvc3Bhbj5cclxuICAgICAgICAgICAgPC9zcGFuPlxyXG4gICAgICAgICAgICA8YnIvPlxyXG4gICAgICAgICAgICA8c3BhbiBjbGFzcz1cImZpbGVuYW1lXCI+JHsgYXRvbS5wcm9qZWN0LnJlbGF0aXZpemVQYXRoKGl0ZW0uRmlsZU5hbWUpWzFdIH06ICR7aXRlbS5MaW5lfTwvc3Bhbj5cclxuICAgICAgICAgICAgPC9saT5gO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXRGaWx0ZXJLZXkoKSB7XHJcbiAgICAgICAgcmV0dXJuICdUZXh0JztcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgY29uZmlybWVkKGl0ZW06IGFueSk6IGFueSB7XHJcbiAgICAgICAgdGhpcy5jYW5jZWwoKTtcclxuICAgICAgICB0aGlzLmhpZGUoKTtcclxuXHJcbiAgICAgICAgT21uaS5uYXZpZ2F0ZVRvKGl0ZW0pO1xyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBvbkZpbHRlcihmaWx0ZXI6IHN0cmluZykge1xyXG4gICAgICAgIE9tbmkucmVxdWVzdChzb2x1dGlvbiA9PiAgc29sdXRpb24uZmluZHN5bWJvbHMoeyBGaWx0ZXI6IGZpbHRlciB9KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldE1pblF1ZXJ5TGVuZ3RoKCkge1xyXG4gICAgICAgIHJldHVybiAxO1xyXG4gICAgfVxyXG59XHJcbiJdfQ==
