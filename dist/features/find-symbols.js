"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.findSymbols = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _omnisharpClient = require("omnisharp-client");

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

            this.disposable = new _omnisharpClient.CompositeDisposable();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9maW5kLXN5bWJvbHMuanMiLCJsaWIvZmVhdHVyZXMvZmluZC1zeW1ib2xzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQUNBOztBQUNBOzs7O0lDRUEsVztBQUFBLDJCQUFBO0FBQUE7O0FBbUJXLGFBQUEsUUFBQSxHQUFXLElBQVg7QUFDQSxhQUFBLEtBQUEsR0FBUSxjQUFSO0FBQ0EsYUFBQSxXQUFBLEdBQWMsK0NBQWQ7QUFDVjs7OzttQ0FsQmtCO0FBQUE7O0FBQ1gsaUJBQUssVUFBTCxHQUFrQiwwQ0FBbEI7QUFDQSxpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLEtBQUssUUFBTCxDQUFjLEdBQWQsQ0FBa0IsZ0JBQWxCLEVBQW9DLDZCQUFwQyxFQUFtRSxZQUFBO0FBQ25GLHNCQUFLLElBQUwsR0FBWSxzQ0FBWjtBQUNILGFBRm1CLENBQXBCO0FBSUEsaUJBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQixXQUFLLFFBQUwsQ0FBYyxXQUFkLENBQTBCLFNBQTFCLENBQW9DLFVBQUMsSUFBRCxFQUFLO0FBQ3pELHNCQUFLLElBQUwsQ0FBVSxTQUFWLENBQW9CLEtBQUssUUFBTCxDQUFjLFVBQWxDO0FBQ0gsYUFGbUIsQ0FBcEI7QUFHSDs7O2tDQUVhO0FBQ1YsaUJBQUssVUFBTCxDQUFnQixPQUFoQjtBQUNIOzs7Ozs7QUFPRSxJQUFNLG9DQUFjLElBQUksV0FBSixFQUFwQiIsImZpbGUiOiJsaWIvZmVhdHVyZXMvZmluZC1zeW1ib2xzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSB9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XG5pbXBvcnQgeyBPbW5pIH0gZnJvbSBcIi4uL3NlcnZlci9vbW5pXCI7XG5pbXBvcnQgeyBGaW5kU3ltYm9sc1ZpZXcgfSBmcm9tIFwiLi4vdmlld3MvZmluZC1zeW1ib2xzLXZpZXdcIjtcbmNsYXNzIEZpbmRTeW1ib2xzIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5yZXF1aXJlZCA9IHRydWU7XG4gICAgICAgIHRoaXMudGl0bGUgPSBcIkZpbmQgU3ltYm9sc1wiO1xuICAgICAgICB0aGlzLmRlc2NyaXB0aW9uID0gXCJBZGRzIGNvbW1hbmRzIHRvIGZpbmQgc3ltYm9scyB0aHJvdWdoIHRoZSBVSS5cIjtcbiAgICB9XG4gICAgYWN0aXZhdGUoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcIm9tbmlzaGFycC1hdG9tOmZpbmQtc3ltYm9sc1wiLCAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnZpZXcgPSBuZXcgRmluZFN5bWJvbHNWaWV3KCk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmxpc3RlbmVyLmZpbmRzeW1ib2xzLnN1YnNjcmliZSgoZGF0YSkgPT4ge1xuICAgICAgICAgICAgdGhpcy52aWV3LmFkZFRvTGlzdChkYXRhLnJlc3BvbnNlLlF1aWNrRml4ZXMpO1xuICAgICAgICB9KSk7XG4gICAgfVxuICAgIGRpc3Bvc2UoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfVxufVxuZXhwb3J0IGNvbnN0IGZpbmRTeW1ib2xzID0gbmV3IEZpbmRTeW1ib2xzO1xuIiwiaW1wb3J0IHtDb21wb3NpdGVEaXNwb3NhYmxlfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xyXG5pbXBvcnQge09tbml9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xyXG5pbXBvcnQge0ZpbmRTeW1ib2xzVmlld30gZnJvbSBcIi4uL3ZpZXdzL2ZpbmQtc3ltYm9scy12aWV3XCI7XHJcblxyXG5jbGFzcyBGaW5kU3ltYm9scyBpbXBsZW1lbnRzIElGZWF0dXJlIHtcclxuICAgIHByaXZhdGUgZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxuICAgIHByaXZhdGUgdmlldzogRmluZFN5bWJvbHNWaWV3O1xyXG5cclxuICAgIHB1YmxpYyBhY3RpdmF0ZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcIm9tbmlzaGFycC1hdG9tOmZpbmQtc3ltYm9sc1wiLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMudmlldyA9IG5ldyBGaW5kU3ltYm9sc1ZpZXcoKTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5saXN0ZW5lci5maW5kc3ltYm9scy5zdWJzY3JpYmUoKGRhdGEpID0+IHtcclxuICAgICAgICAgICAgdGhpcy52aWV3LmFkZFRvTGlzdChkYXRhLnJlc3BvbnNlLlF1aWNrRml4ZXMpO1xyXG4gICAgICAgIH0pKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGlzcG9zZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZXF1aXJlZCA9IHRydWU7XHJcbiAgICBwdWJsaWMgdGl0bGUgPSBcIkZpbmQgU3ltYm9sc1wiO1xyXG4gICAgcHVibGljIGRlc2NyaXB0aW9uID0gXCJBZGRzIGNvbW1hbmRzIHRvIGZpbmQgc3ltYm9scyB0aHJvdWdoIHRoZSBVSS5cIjtcclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IGZpbmRTeW1ib2xzID0gbmV3IEZpbmRTeW1ib2xzO1xyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
