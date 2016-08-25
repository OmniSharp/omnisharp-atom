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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9maW5kLXN5bWJvbHMuanMiLCJsaWIvZmVhdHVyZXMvZmluZC1zeW1ib2xzLnRzIl0sIm5hbWVzIjpbIkZpbmRTeW1ib2xzIiwicmVxdWlyZWQiLCJ0aXRsZSIsImRlc2NyaXB0aW9uIiwiZGlzcG9zYWJsZSIsImFkZCIsImF0b20iLCJjb21tYW5kcyIsInZpZXciLCJsaXN0ZW5lciIsImZpbmRzeW1ib2xzIiwic3Vic2NyaWJlIiwiZGF0YSIsImFkZFRvTGlzdCIsInJlc3BvbnNlIiwiUXVpY2tGaXhlcyIsImRpc3Bvc2UiLCJmaW5kU3ltYm9scyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7Ozs7SUNFQUEsVztBQUFBLDJCQUFBO0FBQUE7O0FBbUJXLGFBQUFDLFFBQUEsR0FBVyxJQUFYO0FBQ0EsYUFBQUMsS0FBQSxHQUFRLGNBQVI7QUFDQSxhQUFBQyxXQUFBLEdBQWMsK0NBQWQ7QUFDVjs7OzttQ0FsQmtCO0FBQUE7O0FBQ1gsaUJBQUtDLFVBQUwsR0FBa0Isd0NBQWxCO0FBQ0EsaUJBQUtBLFVBQUwsQ0FBZ0JDLEdBQWhCLENBQW9CQyxLQUFLQyxRQUFMLENBQWNGLEdBQWQsQ0FBa0IsZ0JBQWxCLEVBQW9DLDZCQUFwQyxFQUFtRSxZQUFBO0FBQ25GLHNCQUFLRyxJQUFMLEdBQVksc0NBQVo7QUFDSCxhQUZtQixDQUFwQjtBQUlBLGlCQUFLSixVQUFMLENBQWdCQyxHQUFoQixDQUFvQixXQUFLSSxRQUFMLENBQWNDLFdBQWQsQ0FBMEJDLFNBQTFCLENBQW9DLFVBQUNDLElBQUQsRUFBSztBQUN6RCxzQkFBS0osSUFBTCxDQUFVSyxTQUFWLENBQW9CRCxLQUFLRSxRQUFMLENBQWNDLFVBQWxDO0FBQ0gsYUFGbUIsQ0FBcEI7QUFHSDs7O2tDQUVhO0FBQ1YsaUJBQUtYLFVBQUwsQ0FBZ0JZLE9BQWhCO0FBQ0g7Ozs7OztBQU9FLElBQU1DLG9DQUFjLElBQUlqQixXQUFKLEVBQXBCIiwiZmlsZSI6ImxpYi9mZWF0dXJlcy9maW5kLXN5bWJvbHMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlIH0gZnJvbSBcInRzLWRpc3Bvc2FibGVzXCI7XG5pbXBvcnQgeyBPbW5pIH0gZnJvbSBcIi4uL3NlcnZlci9vbW5pXCI7XG5pbXBvcnQgeyBGaW5kU3ltYm9sc1ZpZXcgfSBmcm9tIFwiLi4vdmlld3MvZmluZC1zeW1ib2xzLXZpZXdcIjtcbmNsYXNzIEZpbmRTeW1ib2xzIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5yZXF1aXJlZCA9IHRydWU7XG4gICAgICAgIHRoaXMudGl0bGUgPSBcIkZpbmQgU3ltYm9sc1wiO1xuICAgICAgICB0aGlzLmRlc2NyaXB0aW9uID0gXCJBZGRzIGNvbW1hbmRzIHRvIGZpbmQgc3ltYm9scyB0aHJvdWdoIHRoZSBVSS5cIjtcbiAgICB9XG4gICAgYWN0aXZhdGUoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcIm9tbmlzaGFycC1hdG9tOmZpbmQtc3ltYm9sc1wiLCAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnZpZXcgPSBuZXcgRmluZFN5bWJvbHNWaWV3KCk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmxpc3RlbmVyLmZpbmRzeW1ib2xzLnN1YnNjcmliZSgoZGF0YSkgPT4ge1xuICAgICAgICAgICAgdGhpcy52aWV3LmFkZFRvTGlzdChkYXRhLnJlc3BvbnNlLlF1aWNrRml4ZXMpO1xuICAgICAgICB9KSk7XG4gICAgfVxuICAgIGRpc3Bvc2UoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfVxufVxuZXhwb3J0IGNvbnN0IGZpbmRTeW1ib2xzID0gbmV3IEZpbmRTeW1ib2xzO1xuIiwiaW1wb3J0IHtDb21wb3NpdGVEaXNwb3NhYmxlfSBmcm9tIFwidHMtZGlzcG9zYWJsZXNcIjtcclxuaW1wb3J0IHtPbW5pfSBmcm9tIFwiLi4vc2VydmVyL29tbmlcIjtcclxuaW1wb3J0IHtGaW5kU3ltYm9sc1ZpZXd9IGZyb20gXCIuLi92aWV3cy9maW5kLXN5bWJvbHMtdmlld1wiO1xyXG5cclxuY2xhc3MgRmluZFN5bWJvbHMgaW1wbGVtZW50cyBJRmVhdHVyZSB7XHJcbiAgICBwcml2YXRlIGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XHJcbiAgICBwcml2YXRlIHZpZXc6IEZpbmRTeW1ib2xzVmlldztcclxuXHJcbiAgICBwdWJsaWMgYWN0aXZhdGUoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTpmaW5kLXN5bWJvbHNcIiwgKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLnZpZXcgPSBuZXcgRmluZFN5bWJvbHNWaWV3KCk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkubGlzdGVuZXIuZmluZHN5bWJvbHMuc3Vic2NyaWJlKChkYXRhKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMudmlldy5hZGRUb0xpc3QoZGF0YS5yZXNwb25zZS5RdWlja0ZpeGVzKTtcclxuICAgICAgICB9KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVxdWlyZWQgPSB0cnVlO1xyXG4gICAgcHVibGljIHRpdGxlID0gXCJGaW5kIFN5bWJvbHNcIjtcclxuICAgIHB1YmxpYyBkZXNjcmlwdGlvbiA9IFwiQWRkcyBjb21tYW5kcyB0byBmaW5kIHN5bWJvbHMgdGhyb3VnaCB0aGUgVUkuXCI7XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBmaW5kU3ltYm9scyA9IG5ldyBGaW5kU3ltYm9scztcclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
