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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9maW5kLXN5bWJvbHMuanMiLCJsaWIvZmVhdHVyZXMvZmluZC1zeW1ib2xzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQUNBOztBQUNBOzs7O0lDRUE7QUFBQSwyQkFBQTs7O0FBbUJXLGFBQUEsUUFBQSxHQUFXLElBQVgsQ0FuQlg7QUFvQlcsYUFBQSxLQUFBLEdBQVEsY0FBUixDQXBCWDtBQXFCVyxhQUFBLFdBQUEsR0FBYywrQ0FBZCxDQXJCWDtLQUFBOzs7O21DQUltQjs7O0FBQ1gsaUJBQUssVUFBTCxHQUFrQiwwQ0FBbEIsQ0FEVztBQUVYLGlCQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsS0FBSyxRQUFMLENBQWMsR0FBZCxDQUFrQixnQkFBbEIsRUFBb0MsNkJBQXBDLEVBQW1FLFlBQUE7QUFDbkYsc0JBQUssSUFBTCxHQUFZLHNDQUFaLENBRG1GO2FBQUEsQ0FBdkYsRUFGVztBQU1YLGlCQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsV0FBSyxRQUFMLENBQWMsV0FBZCxDQUEwQixTQUExQixDQUFvQyxVQUFDLElBQUQsRUFBSztBQUN6RCxzQkFBSyxJQUFMLENBQVUsU0FBVixDQUFvQixLQUFLLFFBQUwsQ0FBYyxVQUFkLENBQXBCLENBRHlEO2FBQUwsQ0FBeEQsRUFOVzs7OztrQ0FXRDtBQUNWLGlCQUFLLFVBQUwsQ0FBZ0IsT0FBaEIsR0FEVTs7Ozs7OztBQVNYLElBQU0sb0NBQWMsSUFBSSxXQUFKLEVBQWQiLCJmaWxlIjoibGliL2ZlYXR1cmVzL2ZpbmQtc3ltYm9scy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUgfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xuaW1wb3J0IHsgT21uaSB9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xuaW1wb3J0IHsgRmluZFN5bWJvbHNWaWV3IH0gZnJvbSBcIi4uL3ZpZXdzL2ZpbmQtc3ltYm9scy12aWV3XCI7XG5jbGFzcyBGaW5kU3ltYm9scyB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMucmVxdWlyZWQgPSB0cnVlO1xuICAgICAgICB0aGlzLnRpdGxlID0gXCJGaW5kIFN5bWJvbHNcIjtcbiAgICAgICAgdGhpcy5kZXNjcmlwdGlvbiA9IFwiQWRkcyBjb21tYW5kcyB0byBmaW5kIHN5bWJvbHMgdGhyb3VnaCB0aGUgVUkuXCI7XG4gICAgfVxuICAgIGFjdGl2YXRlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTpmaW5kLXN5bWJvbHNcIiwgKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy52aWV3ID0gbmV3IEZpbmRTeW1ib2xzVmlldygpO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5saXN0ZW5lci5maW5kc3ltYm9scy5zdWJzY3JpYmUoKGRhdGEpID0+IHtcbiAgICAgICAgICAgIHRoaXMudmlldy5hZGRUb0xpc3QoZGF0YS5yZXNwb25zZS5RdWlja0ZpeGVzKTtcbiAgICAgICAgfSkpO1xuICAgIH1cbiAgICBkaXNwb3NlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgIH1cbn1cbmV4cG9ydCBjb25zdCBmaW5kU3ltYm9scyA9IG5ldyBGaW5kU3ltYm9scztcbiIsImltcG9ydCB7Q29tcG9zaXRlRGlzcG9zYWJsZX0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcclxuaW1wb3J0IHtPbW5pfSBmcm9tIFwiLi4vc2VydmVyL29tbmlcIjtcclxuaW1wb3J0IHtGaW5kU3ltYm9sc1ZpZXd9IGZyb20gXCIuLi92aWV3cy9maW5kLXN5bWJvbHMtdmlld1wiO1xyXG5cclxuY2xhc3MgRmluZFN5bWJvbHMgaW1wbGVtZW50cyBJRmVhdHVyZSB7XHJcbiAgICBwcml2YXRlIGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XHJcbiAgICBwcml2YXRlIHZpZXc6IEZpbmRTeW1ib2xzVmlldztcclxuXHJcbiAgICBwdWJsaWMgYWN0aXZhdGUoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTpmaW5kLXN5bWJvbHNcIiwgKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLnZpZXcgPSBuZXcgRmluZFN5bWJvbHNWaWV3KCk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkubGlzdGVuZXIuZmluZHN5bWJvbHMuc3Vic2NyaWJlKChkYXRhKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMudmlldy5hZGRUb0xpc3QoZGF0YS5yZXNwb25zZS5RdWlja0ZpeGVzKTtcclxuICAgICAgICB9KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVxdWlyZWQgPSB0cnVlO1xyXG4gICAgcHVibGljIHRpdGxlID0gXCJGaW5kIFN5bWJvbHNcIjtcclxuICAgIHB1YmxpYyBkZXNjcmlwdGlvbiA9IFwiQWRkcyBjb21tYW5kcyB0byBmaW5kIHN5bWJvbHMgdGhyb3VnaCB0aGUgVUkuXCI7XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBmaW5kU3ltYm9scyA9IG5ldyBGaW5kU3ltYm9scztcclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
