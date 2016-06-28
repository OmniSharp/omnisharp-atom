"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.findUsages = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _rxjs = require("rxjs");

var _omnisharpClient = require("omnisharp-client");

var _omni = require("../server/omni");

var _dock = require("../atom/dock");

var _findPaneView = require("../views/find-pane-view");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var FindUsages = function () {
    function FindUsages() {
        _classCallCheck(this, FindUsages);

        this._findWindow = new _findPaneView.FindWindow();
        this.scrollTop = 0;
        this.usages = [];
        this.required = true;
        this.title = "Find Usages / Go To Implementations";
        this.description = "Adds support to find usages, and go to implementations";
    }

    _createClass(FindUsages, [{
        key: "activate",
        value: function activate() {
            var _this = this;

            this.disposable = new _omnisharpClient.CompositeDisposable();
            var observable = _rxjs.Observable.merge(_omni.Omni.listener.findusages, _omni.Omni.listener.findimplementations.filter(function (z) {
                return z.response.QuickFixes && z.response.QuickFixes.length > 1;
            })).map(function (z) {
                return z.response.QuickFixes || [];
            }).share();
            var selected = new _rxjs.Subject();
            this.observe = {
                find: observable,
                open: _omni.Omni.listener.requests.filter(function (z) {
                    return !z.silent && z.command === "findusages";
                }).map(function () {
                    return true;
                }),
                reset: _omni.Omni.listener.requests.filter(function (z) {
                    return !z.silent && (z.command === "findimplementations" || z.command === "findusages");
                }).map(function () {
                    return true;
                }),
                selected: selected.asObservable()
            };
            this.disposable.add(_omni.Omni.addTextEditorCommand("omnisharp-atom:find-usages", function () {
                _omni.Omni.request(function (solution) {
                    return solution.findusages({});
                });
            }));
            this.disposable.add(_omni.Omni.addTextEditorCommand("omnisharp-atom:go-to-implementation", function () {
                _omni.Omni.request(function (solution) {
                    return solution.findimplementations({});
                });
            }));
            this.disposable.add(atom.commands.add("atom-workspace", "omnisharp-atom:next-usage", function () {
                _this._findWindow.next();
            }));
            this.disposable.add(atom.commands.add("atom-workspace", "omnisharp-atom:go-to-usage", function () {
                _omni.Omni.navigateTo(_this._findWindow.current);
            }));
            this.disposable.add(atom.commands.add("atom-workspace", "omnisharp-atom:previous-usage", function () {
                _this._findWindow.prev();
            }));
            this.disposable.add(atom.commands.add("atom-workspace", "omnisharp-atom:go-to-next-usage", function () {
                _this._findWindow.next();
                _omni.Omni.navigateTo(_this._findWindow.current);
            }));
            this.disposable.add(atom.commands.add("atom-workspace", "omnisharp-atom:go-to-previous-usage", function () {
                _this._findWindow.prev();
                _omni.Omni.navigateTo(_this._findWindow.current);
            }));
            this.disposable.add(this.observe.find.subscribe(function (s) {
                _this.usages = s;
                _this._findWindow.update(s);
            }));
            this.disposable.add(_rxjs.Observable.merge(this.observe.find.map(function (z) {
                return true;
            }), this.observe.open.map(function (z) {
                return true;
            })).subscribe(function () {
                _this.ensureWindowIsCreated();
                _dock.dock.selectWindow("find");
            }));
            this.disposable.add(this.observe.reset.subscribe(function () {
                _this.usages = [];
                _this.scrollTop = 0;
                _this._findWindow.selectedIndex = 0;
            }));
            this.disposable.add(_omni.Omni.listener.findimplementations.subscribe(function (data) {
                if (data.response.QuickFixes.length === 1) {
                    _omni.Omni.navigateTo(data.response.QuickFixes[0]);
                }
            }));
        }
    }, {
        key: "ensureWindowIsCreated",
        value: function ensureWindowIsCreated() {
            var _this2 = this;

            if (!this.window) {
                this.window = new _omnisharpClient.CompositeDisposable();
                var windowDisposable = _dock.dock.addWindow("find", "Find", this._findWindow, { priority: 2000, closeable: true }, this.window);
                this.window.add(windowDisposable);
                this.window.add(_omnisharpClient.Disposable.create(function () {
                    _this2.disposable.remove(_this2.window);
                    _this2.window = null;
                }));
                this.disposable.add(this.window);
            }
        }
    }, {
        key: "dispose",
        value: function dispose() {
            this.disposable.dispose();
        }
    }, {
        key: "navigateToSelectedItem",
        value: function navigateToSelectedItem() {
            _omni.Omni.navigateTo(this.usages[this._findWindow.selectedIndex]);
        }
    }]);

    return FindUsages;
}();

var findUsages = exports.findUsages = new FindUsages();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9maW5kLXVzYWdlcy5qcyIsImxpYi9mZWF0dXJlcy9maW5kLXVzYWdlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7OztJQ0dBO0FBQUEsMEJBQUE7OztBQUdZLGFBQUEsV0FBQSxHQUFjLDhCQUFkLENBSFo7QUFJWSxhQUFBLFNBQUEsR0FBb0IsQ0FBcEIsQ0FKWjtBQUtXLGFBQUEsTUFBQSxHQUFzQyxFQUF0QyxDQUxYO0FBa0hXLGFBQUEsUUFBQSxHQUFXLElBQVgsQ0FsSFg7QUFtSFcsYUFBQSxLQUFBLEdBQVEscUNBQVIsQ0FuSFg7QUFvSFcsYUFBQSxXQUFBLEdBQWMsd0RBQWQsQ0FwSFg7S0FBQTs7OzttQ0FjbUI7OztBQUNYLGlCQUFLLFVBQUwsR0FBa0IsMENBQWxCLENBRFc7QUFHWCxnQkFBTSxhQUFhLGlCQUFXLEtBQVgsQ0FFZixXQUFLLFFBQUwsQ0FBYyxVQUFkLEVBRUEsV0FBSyxRQUFMLENBQWMsbUJBQWQsQ0FDSyxNQURMLENBQ1k7dUJBQUssRUFBRSxRQUFGLENBQVcsVUFBWCxJQUF5QixFQUFFLFFBQUYsQ0FBVyxVQUFYLENBQXNCLE1BQXRCLEdBQStCLENBQS9CO2FBQTlCLENBTEcsRUFRZCxHQVJjLENBUVY7dUJBQWtDLEVBQUUsUUFBRixDQUFXLFVBQVgsSUFBeUIsRUFBekI7YUFBbEMsQ0FSVSxDQVNkLEtBVGMsRUFBYixDQUhLO0FBY1gsZ0JBQU0sV0FBVyxtQkFBWCxDQWRLO0FBZ0JYLGlCQUFLLE9BQUwsR0FBZTtBQUNYLHNCQUFNLFVBQU47QUFHQSxzQkFBTSxXQUFLLFFBQUwsQ0FBYyxRQUFkLENBQXVCLE1BQXZCLENBQThCOzJCQUFLLENBQUMsRUFBRSxNQUFGLElBQVksRUFBRSxPQUFGLEtBQWMsWUFBZDtpQkFBbEIsQ0FBOUIsQ0FBNEUsR0FBNUUsQ0FBZ0Y7MkJBQU07aUJBQU4sQ0FBdEY7QUFDQSx1QkFBTyxXQUFL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aEIsQ0FBb0IsS0FBSyxNQUFMLENBQXBCLENBUmM7YUFBbEI7Ozs7a0NBWVU7QUFDVixpQkFBSyxVQUFMLENBQWdCLE9BQWhCLEdBRFU7Ozs7aURBSWU7QUFDekIsdUJBQUssVUFBTCxDQUFnQixLQUFLLE1BQUwsQ0FBWSxLQUFLLFdBQUwsQ0FBaUIsYUFBakIsQ0FBNUIsRUFEeUI7Ozs7Ozs7QUFRMUIsSUFBTSxrQ0FBYSxJQUFJLFVBQUosRUFBYiIsImZpbGUiOiJsaWIvZmVhdHVyZXMvZmluZC11c2FnZXMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBPYnNlcnZhYmxlLCBTdWJqZWN0IH0gZnJvbSBcInJ4anNcIjtcbmltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUsIERpc3Bvc2FibGUgfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xuaW1wb3J0IHsgT21uaSB9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xuaW1wb3J0IHsgZG9jayB9IGZyb20gXCIuLi9hdG9tL2RvY2tcIjtcbmltcG9ydCB7IEZpbmRXaW5kb3cgfSBmcm9tIFwiLi4vdmlld3MvZmluZC1wYW5lLXZpZXdcIjtcbmNsYXNzIEZpbmRVc2FnZXMge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLl9maW5kV2luZG93ID0gbmV3IEZpbmRXaW5kb3c7XG4gICAgICAgIHRoaXMuc2Nyb2xsVG9wID0gMDtcbiAgICAgICAgdGhpcy51c2FnZXMgPSBbXTtcbiAgICAgICAgdGhpcy5yZXF1aXJlZCA9IHRydWU7XG4gICAgICAgIHRoaXMudGl0bGUgPSBcIkZpbmQgVXNhZ2VzIC8gR28gVG8gSW1wbGVtZW50YXRpb25zXCI7XG4gICAgICAgIHRoaXMuZGVzY3JpcHRpb24gPSBcIkFkZHMgc3VwcG9ydCB0byBmaW5kIHVzYWdlcywgYW5kIGdvIHRvIGltcGxlbWVudGF0aW9uc1wiO1xuICAgIH1cbiAgICBhY3RpdmF0ZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgY29uc3Qgb2JzZXJ2YWJsZSA9IE9ic2VydmFibGUubWVyZ2UoT21uaS5saXN0ZW5lci5maW5kdXNhZ2VzLCBPbW5pLmxpc3RlbmVyLmZpbmRpbXBsZW1lbnRhdGlvbnNcbiAgICAgICAgICAgIC5maWx0ZXIoeiA9PiB6LnJlc3BvbnNlLlF1aWNrRml4ZXMgJiYgei5yZXNwb25zZS5RdWlja0ZpeGVzLmxlbmd0aCA+IDEpKVxuICAgICAgICAgICAgLm1hcCh6ID0+IHoucmVzcG9uc2UuUXVpY2tGaXhlcyB8fCBbXSlcbiAgICAgICAgICAgIC5zaGFyZSgpO1xuICAgICAgICBjb25zdCBzZWxlY3RlZCA9IG5ldyBTdWJqZWN0KCk7XG4gICAgICAgIHRoaXMub2JzZXJ2ZSA9IHtcbiAgICAgICAgICAgIGZpbmQ6IG9ic2VydmFibGUsXG4gICAgICAgICAgICBvcGVuOiBPbW5pLmxpc3RlbmVyLnJlcXVlc3RzLmZpbHRlcih6ID0+ICF6LnNpbGVudCAmJiB6LmNvbW1hbmQgPT09IFwiZmluZHVzYWdlc1wiKS5tYXAoKCkgPT4gdHJ1ZSksXG4gICAgICAgICAgICByZXNldDogT21uaS5saXN0ZW5lci5yZXF1ZXN0cy5maWx0ZXIoeiA9PiAhei5zaWxlbnQgJiYgKHouY29tbWFuZCA9PT0gXCJmaW5kaW1wbGVtZW50YXRpb25zXCIgfHwgei5jb21tYW5kID09PSBcImZpbmR1c2FnZXNcIikpLm1hcCgoKSA9PiB0cnVlKSxcbiAgICAgICAgICAgIHNlbGVjdGVkOiBzZWxlY3RlZC5hc09ic2VydmFibGUoKVxuICAgICAgICB9O1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuYWRkVGV4dEVkaXRvckNvbW1hbmQoXCJvbW5pc2hhcnAtYXRvbTpmaW5kLXVzYWdlc1wiLCAoKSA9PiB7XG4gICAgICAgICAgICBPbW5pLnJlcXVlc3Qoc29sdXRpb24gPT4gc29sdXRpb24uZmluZHVzYWdlcyh7fSkpO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5hZGRUZXh0RWRpdG9yQ29tbWFuZChcIm9tbmlzaGFycC1hdG9tOmdvLXRvLWltcGxlbWVudGF0aW9uXCIsICgpID0+IHtcbiAgICAgICAgICAgIE9tbmkucmVxdWVzdChzb2x1dGlvbiA9PiBzb2x1dGlvbi5maW5kaW1wbGVtZW50YXRpb25zKHt9KSk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwib21uaXNoYXJwLWF0b206bmV4dC11c2FnZVwiLCAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLl9maW5kV2luZG93Lm5leHQoKTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTpnby10by11c2FnZVwiLCAoKSA9PiB7XG4gICAgICAgICAgICBPbW5pLm5hdmlnYXRlVG8odGhpcy5fZmluZFdpbmRvdy5jdXJyZW50KTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTpwcmV2aW91cy11c2FnZVwiLCAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLl9maW5kV2luZG93LnByZXYoKTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTpnby10by1uZXh0LXVzYWdlXCIsICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuX2ZpbmRXaW5kb3cubmV4dCgpO1xuICAgICAgICAgICAgT21uaS5uYXZpZ2F0ZVRvKHRoaXMuX2ZpbmRXaW5kb3cuY3VycmVudCk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwib21uaXNoYXJwLWF0b206Z28tdG8tcHJldmlvdXMtdXNhZ2VcIiwgKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5fZmluZFdpbmRvdy5wcmV2KCk7XG4gICAgICAgICAgICBPbW5pLm5hdmlnYXRlVG8odGhpcy5fZmluZFdpbmRvdy5jdXJyZW50KTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKHRoaXMub2JzZXJ2ZS5maW5kLnN1YnNjcmliZShzID0+IHtcbiAgICAgICAgICAgIHRoaXMudXNhZ2VzID0gcztcbiAgICAgICAgICAgIHRoaXMuX2ZpbmRXaW5kb3cudXBkYXRlKHMpO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT2JzZXJ2YWJsZS5tZXJnZSh0aGlzLm9ic2VydmUuZmluZC5tYXAoeiA9PiB0cnVlKSwgdGhpcy5vYnNlcnZlLm9wZW4ubWFwKHogPT4gdHJ1ZSkpLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmVuc3VyZVdpbmRvd0lzQ3JlYXRlZCgpO1xuICAgICAgICAgICAgZG9jay5zZWxlY3RXaW5kb3coXCJmaW5kXCIpO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQodGhpcy5vYnNlcnZlLnJlc2V0LnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnVzYWdlcyA9IFtdO1xuICAgICAgICAgICAgdGhpcy5zY3JvbGxUb3AgPSAwO1xuICAgICAgICAgICAgdGhpcy5fZmluZFdpbmRvdy5zZWxlY3RlZEluZGV4ID0gMDtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkubGlzdGVuZXIuZmluZGltcGxlbWVudGF0aW9ucy5zdWJzY3JpYmUoKGRhdGEpID0+IHtcbiAgICAgICAgICAgIGlmIChkYXRhLnJlc3BvbnNlLlF1aWNrRml4ZXMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICAgICAgT21uaS5uYXZpZ2F0ZVRvKGRhdGEucmVzcG9uc2UuUXVpY2tGaXhlc1swXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pKTtcbiAgICB9XG4gICAgZW5zdXJlV2luZG93SXNDcmVhdGVkKCkge1xuICAgICAgICBpZiAoIXRoaXMud2luZG93KSB7XG4gICAgICAgICAgICB0aGlzLndpbmRvdyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgICAgICBjb25zdCB3aW5kb3dEaXNwb3NhYmxlID0gZG9jay5hZGRXaW5kb3coXCJmaW5kXCIsIFwiRmluZFwiLCB0aGlzLl9maW5kV2luZG93LCB7IHByaW9yaXR5OiAyMDAwLCBjbG9zZWFibGU6IHRydWUgfSwgdGhpcy53aW5kb3cpO1xuICAgICAgICAgICAgdGhpcy53aW5kb3cuYWRkKHdpbmRvd0Rpc3Bvc2FibGUpO1xuICAgICAgICAgICAgdGhpcy53aW5kb3cuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUucmVtb3ZlKHRoaXMud2luZG93KTtcbiAgICAgICAgICAgICAgICB0aGlzLndpbmRvdyA9IG51bGw7XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKHRoaXMud2luZG93KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBkaXNwb3NlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgIH1cbiAgICBuYXZpZ2F0ZVRvU2VsZWN0ZWRJdGVtKCkge1xuICAgICAgICBPbW5pLm5hdmlnYXRlVG8odGhpcy51c2FnZXNbdGhpcy5fZmluZFdpbmRvdy5zZWxlY3RlZEluZGV4XSk7XG4gICAgfVxufVxuZXhwb3J0IGNvbnN0IGZpbmRVc2FnZXMgPSBuZXcgRmluZFVzYWdlcztcbiIsImltcG9ydCB7TW9kZWxzfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xyXG5pbXBvcnQge09ic2VydmFibGUsIFN1YmplY3R9IGZyb20gXCJyeGpzXCI7XHJcbmltcG9ydCB7Q29tcG9zaXRlRGlzcG9zYWJsZSwgRGlzcG9zYWJsZX0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcclxuaW1wb3J0IHtPbW5pfSBmcm9tIFwiLi4vc2VydmVyL29tbmlcIjtcclxuaW1wb3J0IHtkb2NrfSBmcm9tIFwiLi4vYXRvbS9kb2NrXCI7XHJcbmltcG9ydCB7RmluZFdpbmRvd30gZnJvbSBcIi4uL3ZpZXdzL2ZpbmQtcGFuZS12aWV3XCI7XHJcblxyXG5jbGFzcyBGaW5kVXNhZ2VzIGltcGxlbWVudHMgSUZlYXR1cmUge1xyXG4gICAgcHJpdmF0ZSBkaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xyXG4gICAgcHJpdmF0ZSB3aW5kb3c6IENvbXBvc2l0ZURpc3Bvc2FibGU7XHJcbiAgICBwcml2YXRlIF9maW5kV2luZG93ID0gbmV3IEZpbmRXaW5kb3c7XHJcbiAgICBwcml2YXRlIHNjcm9sbFRvcDogbnVtYmVyID0gMDtcclxuICAgIHB1YmxpYyB1c2FnZXM6IE1vZGVscy5EaWFnbm9zdGljTG9jYXRpb25bXSA9IFtdO1xyXG5cclxuICAgIHB1YmxpYyBvYnNlcnZlOiB7XHJcbiAgICAgICAgZmluZDogT2JzZXJ2YWJsZTxNb2RlbHMuRGlhZ25vc3RpY0xvY2F0aW9uW10+O1xyXG4gICAgICAgIG9wZW46IE9ic2VydmFibGU8Ym9vbGVhbj47XHJcbiAgICAgICAgcmVzZXQ6IE9ic2VydmFibGU8Ym9vbGVhbj47XHJcbiAgICAgICAgc2VsZWN0ZWQ6IE9ic2VydmFibGU8bnVtYmVyPjtcclxuICAgIH07XHJcblxyXG4gICAgcHVibGljIGFjdGl2YXRlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcblxyXG4gICAgICAgIGNvbnN0IG9ic2VydmFibGUgPSBPYnNlcnZhYmxlLm1lcmdlKFxyXG4gICAgICAgICAgICAvLyBMaXN0ZW4gdG8gZmluZCB1c2FnZXNcclxuICAgICAgICAgICAgT21uaS5saXN0ZW5lci5maW5kdXNhZ2VzLFxyXG4gICAgICAgICAgICAvLyBXZSBhbHNvIHdhbnQgZmluZCBpbXBsZW1lbnRhdGlvbnMsIHdoZXJlIHdlIGZvdW5kIG1vcmUgdGhhbiBvbmVcclxuICAgICAgICAgICAgT21uaS5saXN0ZW5lci5maW5kaW1wbGVtZW50YXRpb25zXHJcbiAgICAgICAgICAgICAgICAuZmlsdGVyKHogPT4gei5yZXNwb25zZS5RdWlja0ZpeGVzICYmIHoucmVzcG9uc2UuUXVpY2tGaXhlcy5sZW5ndGggPiAxKVxyXG4gICAgICAgIClcclxuICAgICAgICAgICAgLy8gRm9yIHRoZSBVSSB3ZSBvbmx5IG5lZWQgdGhlIHF1Y2lrIGZpeGVzLlxyXG4gICAgICAgICAgICAubWFwKHogPT4gPE1vZGVscy5EaWFnbm9zdGljTG9jYXRpb25bXT56LnJlc3BvbnNlLlF1aWNrRml4ZXMgfHwgW10pXHJcbiAgICAgICAgICAgIC5zaGFyZSgpO1xyXG5cclxuICAgICAgICBjb25zdCBzZWxlY3RlZCA9IG5ldyBTdWJqZWN0PG51bWJlcj4oKTtcclxuXHJcbiAgICAgICAgdGhpcy5vYnNlcnZlID0ge1xyXG4gICAgICAgICAgICBmaW5kOiBvYnNlcnZhYmxlLFxyXG4gICAgICAgICAgICAvLyBOT1RFOiBXZSBjYW5ub3QgZG8gdGhlIHNhbWUgZm9yIGZpbmQgaW1wbGVtZW50YXRpb25zIGJlY2F1c2UgZmluZCBpbXBsZW1lbnRhdGlvblxyXG4gICAgICAgICAgICAvLyAgICAgIGp1c3QgZ29lcyB0byB0aGUgaXRlbSBpZiBvbmx5IG9uZSBjb21lcyBiYWNrLlxyXG4gICAgICAgICAgICBvcGVuOiBPbW5pLmxpc3RlbmVyLnJlcXVlc3RzLmZpbHRlcih6ID0+ICF6LnNpbGVudCAmJiB6LmNvbW1hbmQgPT09IFwiZmluZHVzYWdlc1wiKS5tYXAoKCkgPT4gdHJ1ZSksXHJcbiAgICAgICAgICAgIHJlc2V0OiBPbW5pLmxpc3RlbmVyLnJlcXVlc3RzLmZpbHRlcih6ID0+ICF6LnNpbGVudCAmJiAoei5jb21tYW5kID09PSBcImZpbmRpbXBsZW1lbnRhdGlvbnNcIiB8fCB6LmNvbW1hbmQgPT09IFwiZmluZHVzYWdlc1wiKSkubWFwKCgpID0+IHRydWUpLFxyXG4gICAgICAgICAgICBzZWxlY3RlZDogc2VsZWN0ZWQuYXNPYnNlcnZhYmxlKClcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuYWRkVGV4dEVkaXRvckNvbW1hbmQoXCJvbW5pc2hhcnAtYXRvbTpmaW5kLXVzYWdlc1wiLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIE9tbmkucmVxdWVzdChzb2x1dGlvbiA9PiBzb2x1dGlvbi5maW5kdXNhZ2VzKHt9KSk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuYWRkVGV4dEVkaXRvckNvbW1hbmQoXCJvbW5pc2hhcnAtYXRvbTpnby10by1pbXBsZW1lbnRhdGlvblwiLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIE9tbmkucmVxdWVzdChzb2x1dGlvbiA9PiBzb2x1dGlvbi5maW5kaW1wbGVtZW50YXRpb25zKHt9KSk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTpuZXh0LXVzYWdlXCIsICgpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5fZmluZFdpbmRvdy5uZXh0KCk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTpnby10by11c2FnZVwiLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIE9tbmkubmF2aWdhdGVUbyh0aGlzLl9maW5kV2luZG93LmN1cnJlbnQpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwib21uaXNoYXJwLWF0b206cHJldmlvdXMtdXNhZ2VcIiwgKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLl9maW5kV2luZG93LnByZXYoKTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcIm9tbmlzaGFycC1hdG9tOmdvLXRvLW5leHQtdXNhZ2VcIiwgKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLl9maW5kV2luZG93Lm5leHQoKTtcclxuICAgICAgICAgICAgT21uaS5uYXZpZ2F0ZVRvKHRoaXMuX2ZpbmRXaW5kb3cuY3VycmVudCk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTpnby10by1wcmV2aW91cy11c2FnZVwiLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuX2ZpbmRXaW5kb3cucHJldigpO1xyXG4gICAgICAgICAgICBPbW5pLm5hdmlnYXRlVG8odGhpcy5fZmluZFdpbmRvdy5jdXJyZW50KTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQodGhpcy5vYnNlcnZlLmZpbmQuc3Vic2NyaWJlKHMgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLnVzYWdlcyA9IHM7XHJcbiAgICAgICAgICAgIHRoaXMuX2ZpbmRXaW5kb3cudXBkYXRlKHMpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPYnNlcnZhYmxlLm1lcmdlKHRoaXMub2JzZXJ2ZS5maW5kLm1hcCh6ID0+IHRydWUpLCB0aGlzLm9ic2VydmUub3Blbi5tYXAoeiA9PiB0cnVlKSkuc3Vic2NyaWJlKCgpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5lbnN1cmVXaW5kb3dJc0NyZWF0ZWQoKTtcclxuICAgICAgICAgICAgZG9jay5zZWxlY3RXaW5kb3coXCJmaW5kXCIpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZCh0aGlzLm9ic2VydmUucmVzZXQuc3Vic2NyaWJlKCgpID0+IHtcclxuICAgICAgICAgICAgdGhpcy51c2FnZXMgPSBbXTtcclxuICAgICAgICAgICAgdGhpcy5zY3JvbGxUb3AgPSAwO1xyXG4gICAgICAgICAgICB0aGlzLl9maW5kV2luZG93LnNlbGVjdGVkSW5kZXggPSAwO1xyXG4gICAgICAgIH0pKTtcclxuXHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5saXN0ZW5lci5maW5kaW1wbGVtZW50YXRpb25zLnN1YnNjcmliZSgoZGF0YSkgPT4ge1xyXG4gICAgICAgICAgICBpZiAoZGF0YS5yZXNwb25zZS5RdWlja0ZpeGVzLmxlbmd0aCA9PT0gMSkge1xyXG4gICAgICAgICAgICAgICAgT21uaS5uYXZpZ2F0ZVRvKGRhdGEucmVzcG9uc2UuUXVpY2tGaXhlc1swXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBlbnN1cmVXaW5kb3dJc0NyZWF0ZWQoKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLndpbmRvdykge1xyXG4gICAgICAgICAgICB0aGlzLndpbmRvdyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcbiAgICAgICAgICAgIGNvbnN0IHdpbmRvd0Rpc3Bvc2FibGUgPSBkb2NrLmFkZFdpbmRvdyhcImZpbmRcIiwgXCJGaW5kXCIsIHRoaXMuX2ZpbmRXaW5kb3csIHsgcHJpb3JpdHk6IDIwMDAsIGNsb3NlYWJsZTogdHJ1ZSB9LCB0aGlzLndpbmRvdyk7XHJcbiAgICAgICAgICAgIHRoaXMud2luZG93LmFkZCh3aW5kb3dEaXNwb3NhYmxlKTtcclxuICAgICAgICAgICAgdGhpcy53aW5kb3cuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5yZW1vdmUodGhpcy53aW5kb3cpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy53aW5kb3cgPSBudWxsO1xyXG4gICAgICAgICAgICB9KSk7XHJcbiAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQodGhpcy53aW5kb3cpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGlzcG9zZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBuYXZpZ2F0ZVRvU2VsZWN0ZWRJdGVtKCkge1xyXG4gICAgICAgIE9tbmkubmF2aWdhdGVUbyh0aGlzLnVzYWdlc1t0aGlzLl9maW5kV2luZG93LnNlbGVjdGVkSW5kZXhdKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVxdWlyZWQgPSB0cnVlO1xyXG4gICAgcHVibGljIHRpdGxlID0gXCJGaW5kIFVzYWdlcyAvIEdvIFRvIEltcGxlbWVudGF0aW9uc1wiO1xyXG4gICAgcHVibGljIGRlc2NyaXB0aW9uID0gXCJBZGRzIHN1cHBvcnQgdG8gZmluZCB1c2FnZXMsIGFuZCBnbyB0byBpbXBsZW1lbnRhdGlvbnNcIjtcclxufVxyXG5leHBvcnQgY29uc3QgZmluZFVzYWdlcyA9IG5ldyBGaW5kVXNhZ2VzO1xyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
