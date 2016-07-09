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

        var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(FindSymbolsView).call(this, "Find Symbols"));

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy9maW5kLXN5bWJvbHMtdmlldy5qcyIsImxpYi92aWV3cy9maW5kLXN5bWJvbHMtdmlldy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7QUFDQTs7Ozs7Ozs7SUNHQSxlLFdBQUEsZTs7O0FBQ0ksK0JBQUE7QUFBQTs7QUFBQSx1R0FDVSxjQURWOztBQUdJLGNBQUssV0FBTCxDQUFpQixFQUFqQjtBQUhKO0FBSUM7Ozs7b0NBRWtCLEksRUFBMkI7QUFDMUMsd0xBRTBILEtBQUssSUFBTCxDQUFVLFdBQVYsRUFGMUgsd0NBR2EsS0FBSyxJQUhsQiw4RkFNOEIsS0FBSyxPQUFMLENBQWEsY0FBYixDQUE0QixLQUFLLFFBQWpDLEVBQTJDLENBQTNDLENBTjlCLFVBTWlGLEtBQUssSUFOdEY7QUFRSDs7O3VDQUVrQjtBQUNmLG1CQUFPLE1BQVA7QUFDSDs7O2tDQUVnQixJLEVBQVM7QUFDdEIsaUJBQUssTUFBTDtBQUNBLGlCQUFLLElBQUw7QUFFQSx1QkFBSyxVQUFMLENBQWdCLElBQWhCO0FBQ0EsbUJBQU8sSUFBUDtBQUNIOzs7aUNBRWUsTSxFQUFjO0FBQzFCLHVCQUFLLE9BQUwsQ0FBYTtBQUFBLHVCQUFhLFNBQVMsV0FBVCxDQUFxQixFQUFFLFFBQVEsTUFBVixFQUFyQixDQUFiO0FBQUEsYUFBYjtBQUNIOzs7NENBRXVCO0FBQ3BCLG1CQUFPLENBQVA7QUFDSCIsImZpbGUiOiJsaWIvdmlld3MvZmluZC1zeW1ib2xzLXZpZXcuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBPbW5pU2VsZWN0TGlzdFZpZXcgfSBmcm9tIFwiLi4vc2VydmljZXMvb21uaS1zZWxlY3QtbGlzdC12aWV3XCI7XG5pbXBvcnQgeyBPbW5pIH0gZnJvbSBcIi4uL3NlcnZlci9vbW5pXCI7XG5leHBvcnQgY2xhc3MgRmluZFN5bWJvbHNWaWV3IGV4dGVuZHMgT21uaVNlbGVjdExpc3RWaWV3IHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoXCJGaW5kIFN5bWJvbHNcIik7XG4gICAgICAgIHRoaXMuc2V0TWF4SXRlbXMoNTApO1xuICAgIH1cbiAgICB2aWV3Rm9ySXRlbShpdGVtKSB7XG4gICAgICAgIHJldHVybiBgPGxpPlxyXG4gICAgICAgICAgICA8c3Bhbj5cclxuICAgICAgICAgICAgPGltZyBzdHlsZT1cIm1hcmdpbi1yaWdodDogMC43NWVtO1wiIGhlaWdodD1cIjE2cHhcIiB3aWR0aD1cIjE2cHhcIiBzcmM9XCJhdG9tOi8vb21uaXNoYXJwLWF0b20vc3R5bGVzL2ljb25zL2F1dG9jb21wbGV0ZV8ke2l0ZW0uS2luZC50b0xvd2VyQ2FzZSgpfUAzeC5wbmdcIiAvPlxyXG4gICAgICAgICAgICA8c3Bhbj4ke2l0ZW0uVGV4dH08L3NwYW4+XHJcbiAgICAgICAgICAgIDwvc3Bhbj5cclxuICAgICAgICAgICAgPGJyLz5cclxuICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJmaWxlbmFtZVwiPiR7YXRvbS5wcm9qZWN0LnJlbGF0aXZpemVQYXRoKGl0ZW0uRmlsZU5hbWUpWzFdfTogJHtpdGVtLkxpbmV9PC9zcGFuPlxyXG4gICAgICAgICAgICA8L2xpPmA7XG4gICAgfVxuICAgIGdldEZpbHRlcktleSgpIHtcbiAgICAgICAgcmV0dXJuIFwiVGV4dFwiO1xuICAgIH1cbiAgICBjb25maXJtZWQoaXRlbSkge1xuICAgICAgICB0aGlzLmNhbmNlbCgpO1xuICAgICAgICB0aGlzLmhpZGUoKTtcbiAgICAgICAgT21uaS5uYXZpZ2F0ZVRvKGl0ZW0pO1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgb25GaWx0ZXIoZmlsdGVyKSB7XG4gICAgICAgIE9tbmkucmVxdWVzdChzb2x1dGlvbiA9PiBzb2x1dGlvbi5maW5kc3ltYm9scyh7IEZpbHRlcjogZmlsdGVyIH0pKTtcbiAgICB9XG4gICAgZ2V0TWluUXVlcnlMZW5ndGgoKSB7XG4gICAgICAgIHJldHVybiAxO1xuICAgIH1cbn1cbiIsImltcG9ydCB7TW9kZWxzfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xyXG5pbXBvcnQge09tbmlTZWxlY3RMaXN0Vmlld30gZnJvbSBcIi4uL3NlcnZpY2VzL29tbmktc2VsZWN0LWxpc3Qtdmlld1wiO1xyXG5pbXBvcnQge09tbml9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xyXG5cclxuZXhwb3J0IGNsYXNzIEZpbmRTeW1ib2xzVmlldyBleHRlbmRzIE9tbmlTZWxlY3RMaXN0VmlldyB7XHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICBzdXBlcihcIkZpbmQgU3ltYm9sc1wiKTtcclxuXHJcbiAgICAgICAgdGhpcy5zZXRNYXhJdGVtcyg1MCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHZpZXdGb3JJdGVtKGl0ZW06IE1vZGVscy5TeW1ib2xMb2NhdGlvbikge1xyXG4gICAgICAgIHJldHVybiBgPGxpPlxyXG4gICAgICAgICAgICA8c3Bhbj5cclxuICAgICAgICAgICAgPGltZyBzdHlsZT1cIm1hcmdpbi1yaWdodDogMC43NWVtO1wiIGhlaWdodD1cIjE2cHhcIiB3aWR0aD1cIjE2cHhcIiBzcmM9XCJhdG9tOi8vb21uaXNoYXJwLWF0b20vc3R5bGVzL2ljb25zL2F1dG9jb21wbGV0ZV8keyBpdGVtLktpbmQudG9Mb3dlckNhc2UoKSB9QDN4LnBuZ1wiIC8+XHJcbiAgICAgICAgICAgIDxzcGFuPiR7IGl0ZW0uVGV4dCB9PC9zcGFuPlxyXG4gICAgICAgICAgICA8L3NwYW4+XHJcbiAgICAgICAgICAgIDxici8+XHJcbiAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwiZmlsZW5hbWVcIj4keyBhdG9tLnByb2plY3QucmVsYXRpdml6ZVBhdGgoaXRlbS5GaWxlTmFtZSlbMV0gfTogJHtpdGVtLkxpbmV9PC9zcGFuPlxyXG4gICAgICAgICAgICA8L2xpPmA7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldEZpbHRlcktleSgpIHtcclxuICAgICAgICByZXR1cm4gXCJUZXh0XCI7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNvbmZpcm1lZChpdGVtOiBhbnkpOiBhbnkge1xyXG4gICAgICAgIHRoaXMuY2FuY2VsKCk7XHJcbiAgICAgICAgdGhpcy5oaWRlKCk7XHJcblxyXG4gICAgICAgIE9tbmkubmF2aWdhdGVUbyhpdGVtKTtcclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgb25GaWx0ZXIoZmlsdGVyOiBzdHJpbmcpIHtcclxuICAgICAgICBPbW5pLnJlcXVlc3Qoc29sdXRpb24gPT4gIHNvbHV0aW9uLmZpbmRzeW1ib2xzKHsgRmlsdGVyOiBmaWx0ZXIgfSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXRNaW5RdWVyeUxlbmd0aCgpIHtcclxuICAgICAgICByZXR1cm4gMTtcclxuICAgIH1cclxufVxyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
