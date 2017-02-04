'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.findSymbols = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _tsDisposables = require('ts-disposables');

var _omni = require('../server/omni');

var _findSymbolsView = require('../views/find-symbols-view');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var FindSymbols = function () {
    function FindSymbols() {
        _classCallCheck(this, FindSymbols);

        this.required = true;
        this.title = 'Find Symbols';
        this.description = 'Adds commands to find symbols through the UI.';
    }

    _createClass(FindSymbols, [{
        key: 'activate',
        value: function activate() {
            var _this = this;

            this.disposable = new _tsDisposables.CompositeDisposable();
            this.disposable.add(atom.commands.add('atom-workspace', 'omnisharp-atom:find-symbols', function () {
                _this.view = new _findSymbolsView.FindSymbolsView();
            }));
            this.disposable.add(_omni.Omni.listener.findsymbols.subscribe(function (data) {
                _this.view.addToList(data.response.QuickFixes);
            }));
        }
    }, {
        key: 'dispose',
        value: function dispose() {
            this.disposable.dispose();
        }
    }]);

    return FindSymbols;
}();

var findSymbols = exports.findSymbols = new FindSymbols();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9maW5kLXN5bWJvbHMudHMiXSwibmFtZXMiOlsiRmluZFN5bWJvbHMiLCJyZXF1aXJlZCIsInRpdGxlIiwiZGVzY3JpcHRpb24iLCJkaXNwb3NhYmxlIiwiYWRkIiwiYXRvbSIsImNvbW1hbmRzIiwidmlldyIsImxpc3RlbmVyIiwiZmluZHN5bWJvbHMiLCJzdWJzY3JpYmUiLCJhZGRUb0xpc3QiLCJkYXRhIiwicmVzcG9uc2UiLCJRdWlja0ZpeGVzIiwiZGlzcG9zZSIsImZpbmRTeW1ib2xzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7OztJQUVBQSxXO0FBQUEsMkJBQUE7QUFBQTs7QUFtQlcsYUFBQUMsUUFBQSxHQUFXLElBQVg7QUFDQSxhQUFBQyxLQUFBLEdBQVEsY0FBUjtBQUNBLGFBQUFDLFdBQUEsR0FBYywrQ0FBZDtBQUNWOzs7O21DQWxCa0I7QUFBQTs7QUFDWCxpQkFBS0MsVUFBTCxHQUFrQix3Q0FBbEI7QUFDQSxpQkFBS0EsVUFBTCxDQUFnQkMsR0FBaEIsQ0FBb0JDLEtBQUtDLFFBQUwsQ0FBY0YsR0FBZCxDQUFrQixnQkFBbEIsRUFBb0MsNkJBQXBDLEVBQW1FLFlBQUE7QUFDbkYsc0JBQUtHLElBQUwsR0FBWSxzQ0FBWjtBQUNILGFBRm1CLENBQXBCO0FBSUEsaUJBQUtKLFVBQUwsQ0FBZ0JDLEdBQWhCLENBQW9CLFdBQUtJLFFBQUwsQ0FBY0MsV0FBZCxDQUEwQkMsU0FBMUIsQ0FBb0MsZ0JBQUk7QUFDeEQsc0JBQUtILElBQUwsQ0FBVUksU0FBVixDQUFvQkMsS0FBS0MsUUFBTCxDQUFjQyxVQUFsQztBQUNILGFBRm1CLENBQXBCO0FBR0g7OztrQ0FFYTtBQUNWLGlCQUFLWCxVQUFMLENBQWdCWSxPQUFoQjtBQUNIOzs7Ozs7QUFPRSxJQUFNQyxvQ0FBYyxJQUFJakIsV0FBSixFQUFwQiIsImZpbGUiOiJsaWIvZmVhdHVyZXMvZmluZC1zeW1ib2xzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtDb21wb3NpdGVEaXNwb3NhYmxlfSBmcm9tICd0cy1kaXNwb3NhYmxlcyc7XHJcbmltcG9ydCB7T21uaX0gZnJvbSAnLi4vc2VydmVyL29tbmknO1xyXG5pbXBvcnQge0ZpbmRTeW1ib2xzVmlld30gZnJvbSAnLi4vdmlld3MvZmluZC1zeW1ib2xzLXZpZXcnO1xyXG5cclxuY2xhc3MgRmluZFN5bWJvbHMgaW1wbGVtZW50cyBJRmVhdHVyZSB7XHJcbiAgICBwcml2YXRlIGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XHJcbiAgICBwcml2YXRlIHZpZXc6IEZpbmRTeW1ib2xzVmlldztcclxuXHJcbiAgICBwdWJsaWMgYWN0aXZhdGUoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKCdhdG9tLXdvcmtzcGFjZScsICdvbW5pc2hhcnAtYXRvbTpmaW5kLXN5bWJvbHMnLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMudmlldyA9IG5ldyBGaW5kU3ltYm9sc1ZpZXcoKTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5saXN0ZW5lci5maW5kc3ltYm9scy5zdWJzY3JpYmUoZGF0YSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMudmlldy5hZGRUb0xpc3QoZGF0YS5yZXNwb25zZS5RdWlja0ZpeGVzKTtcclxuICAgICAgICB9KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVxdWlyZWQgPSB0cnVlO1xyXG4gICAgcHVibGljIHRpdGxlID0gJ0ZpbmQgU3ltYm9scyc7XHJcbiAgICBwdWJsaWMgZGVzY3JpcHRpb24gPSAnQWRkcyBjb21tYW5kcyB0byBmaW5kIHN5bWJvbHMgdGhyb3VnaCB0aGUgVUkuJztcclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IGZpbmRTeW1ib2xzID0gbmV3IEZpbmRTeW1ib2xzO1xyXG4iXX0=
