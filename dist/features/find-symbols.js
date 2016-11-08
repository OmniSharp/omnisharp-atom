"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.findSymbols = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _tsDisposables = require("ts-disposables");

var _omni = require("../server/omni");

var _findSymbolsView = require("../views/find-symbols-view");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var FindSymbols = function () {
    function FindSymbols() {
        _classCallCheck(this, FindSymbols);

        this.required = true;
        this.title = "Find Symbols";
        this.description = "Adds commands to find symbols through the UI.";
    }

    _createClass(FindSymbols, [{
        key: "activate",
        value: function activate() {
            var _this = this;

            this.disposable = new _tsDisposables.CompositeDisposable();
            this.disposable.add(atom.commands.add("atom-workspace", "omnisharp-atom:find-symbols", function () {
                _this.view = new _findSymbolsView.FindSymbolsView();
            }));
            this.disposable.add(_omni.Omni.listener.findsymbols.subscribe(function (data) {
                _this.view.addToList(data.response.QuickFixes);
            }));
        }
    }, {
        key: "dispose",
        value: function dispose() {
            this.disposable.dispose();
        }
    }]);

    return FindSymbols;
}();

var findSymbols = exports.findSymbols = new FindSymbols();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9maW5kLXN5bWJvbHMuanMiLCJsaWIvZmVhdHVyZXMvZmluZC1zeW1ib2xzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQUNBOztBQUNBOzs7O0lDRUE7QUFBQSwyQkFBQTs7O0FBbUJXLGFBQUEsUUFBQSxHQUFXLElBQVgsQ0FuQlg7QUFvQlcsYUFBQSxLQUFBLEdBQVEsY0FBUixDQXBCWDtBQXFCVyxhQUFBLFdBQUEsR0FBYywrQ0FBZCxDQXJCWDtLQUFBOzs7O21DQUltQjs7O0FBQ1gsaUJBQUssVUFBTCxHQUFrQix3Q0FBbEIsQ0FEVztBQUVYLGlCQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsS0FBSyxRQUFMLENBQWMsR0FBZCxDQUFrQixnQkFBbEIsRUFBb0MsNkJBQXBDLEVBQW1FLFlBQUE7QUFDbkYsc0JBQUssSUFBTCxHQUFZLHNDQUFaLENBRG1GO2FBQUEsQ0FBdkYsRUFGVztBQU1YLGlCQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsV0FBSyxRQUFMLENBQWMsV0FBZCxDQUEwQixTQUExQixDQUFvQyxVQUFDLElBQUQsRUFBSztBQUN6RCxzQkFBSyxJQUFMLENBQVUsU0FBVixDQUFvQixLQUFLLFFBQUwsQ0FBYyxVQUFkLENBQXBCLENBRHlEO2FBQUwsQ0FBeEQsRUFOVzs7OztrQ0FXRDtBQUNWLGlCQUFLLFVBQUwsQ0FBZ0IsT0FBaEIsR0FEVTs7Ozs7OztBQVNYLElBQU0sb0NBQWMsSUFBSSxXQUFKLEVBQWQiLCJmaWxlIjoibGliL2ZlYXR1cmVzL2ZpbmQtc3ltYm9scy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUgfSBmcm9tIFwidHMtZGlzcG9zYWJsZXNcIjtcbmltcG9ydCB7IE9tbmkgfSBmcm9tIFwiLi4vc2VydmVyL29tbmlcIjtcbmltcG9ydCB7IEZpbmRTeW1ib2xzVmlldyB9IGZyb20gXCIuLi92aWV3cy9maW5kLXN5bWJvbHMtdmlld1wiO1xuY2xhc3MgRmluZFN5bWJvbHMge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLnJlcXVpcmVkID0gdHJ1ZTtcbiAgICAgICAgdGhpcy50aXRsZSA9IFwiRmluZCBTeW1ib2xzXCI7XG4gICAgICAgIHRoaXMuZGVzY3JpcHRpb24gPSBcIkFkZHMgY29tbWFuZHMgdG8gZmluZCBzeW1ib2xzIHRocm91Z2ggdGhlIFVJLlwiO1xuICAgIH1cbiAgICBhY3RpdmF0ZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwib21uaXNoYXJwLWF0b206ZmluZC1zeW1ib2xzXCIsICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMudmlldyA9IG5ldyBGaW5kU3ltYm9sc1ZpZXcoKTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkubGlzdGVuZXIuZmluZHN5bWJvbHMuc3Vic2NyaWJlKChkYXRhKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnZpZXcuYWRkVG9MaXN0KGRhdGEucmVzcG9uc2UuUXVpY2tGaXhlcyk7XG4gICAgICAgIH0pKTtcbiAgICB9XG4gICAgZGlzcG9zZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICB9XG59XG5leHBvcnQgY29uc3QgZmluZFN5bWJvbHMgPSBuZXcgRmluZFN5bWJvbHM7XG4iLCJpbXBvcnQge0NvbXBvc2l0ZURpc3Bvc2FibGV9IGZyb20gXCJ0cy1kaXNwb3NhYmxlc1wiO1xyXG5pbXBvcnQge09tbml9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xyXG5pbXBvcnQge0ZpbmRTeW1ib2xzVmlld30gZnJvbSBcIi4uL3ZpZXdzL2ZpbmQtc3ltYm9scy12aWV3XCI7XHJcblxyXG5jbGFzcyBGaW5kU3ltYm9scyBpbXBsZW1lbnRzIElGZWF0dXJlIHtcclxuICAgIHByaXZhdGUgZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxuICAgIHByaXZhdGUgdmlldzogRmluZFN5bWJvbHNWaWV3O1xyXG5cclxuICAgIHB1YmxpYyBhY3RpdmF0ZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcIm9tbmlzaGFycC1hdG9tOmZpbmQtc3ltYm9sc1wiLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMudmlldyA9IG5ldyBGaW5kU3ltYm9sc1ZpZXcoKTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5saXN0ZW5lci5maW5kc3ltYm9scy5zdWJzY3JpYmUoKGRhdGEpID0+IHtcclxuICAgICAgICAgICAgdGhpcy52aWV3LmFkZFRvTGlzdChkYXRhLnJlc3BvbnNlLlF1aWNrRml4ZXMpO1xyXG4gICAgICAgIH0pKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGlzcG9zZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZXF1aXJlZCA9IHRydWU7XHJcbiAgICBwdWJsaWMgdGl0bGUgPSBcIkZpbmQgU3ltYm9sc1wiO1xyXG4gICAgcHVibGljIGRlc2NyaXB0aW9uID0gXCJBZGRzIGNvbW1hbmRzIHRvIGZpbmQgc3ltYm9scyB0aHJvdWdoIHRoZSBVSS5cIjtcclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IGZpbmRTeW1ib2xzID0gbmV3IEZpbmRTeW1ib2xzO1xyXG4iXX0=
