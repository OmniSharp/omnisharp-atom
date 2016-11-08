"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.findUsages = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _rxjs = require("rxjs");

var _tsDisposables = require("ts-disposables");

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

            this.disposable = new _tsDisposables.CompositeDisposable();
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
                this.window = new _tsDisposables.CompositeDisposable();
                var windowDisposable = _dock.dock.addWindow("find", "Find", this._findWindow, { priority: 2000, closeable: true }, this.window);
                this.window.add(windowDisposable);
                this.window.add(_tsDisposables.Disposable.create(function () {
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9maW5kLXVzYWdlcy5qcyIsImxpYi9mZWF0dXJlcy9maW5kLXVzYWdlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7OztJQ0dBO0FBQUEsMEJBQUE7OztBQUdZLGFBQUEsV0FBQSxHQUFjLDhCQUFkLENBSFo7QUFJWSxhQUFBLFNBQUEsR0FBb0IsQ0FBcEIsQ0FKWjtBQUtXLGFBQUEsTUFBQSxHQUFzQyxFQUF0QyxDQUxYO0FBa0hXLGFBQUEsUUFBQSxHQUFXLElBQVgsQ0FsSFg7QUFtSFcsYUFBQSxLQUFBLEdBQVEscUNBQVIsQ0FuSFg7QUFvSFcsYUFBQSxXQUFBLEdBQWMsd0RBQWQsQ0FwSFg7S0FBQTs7OzttQ0FjbUI7OztBQUNYLGlCQUFLLFVBQUwsR0FBa0Isd0NBQWxCLENBRFc7QUFHWCxnQkFBTSxhQUFhLGlCQUFXLEtBQVgsQ0FFZixXQUFLLFFBQUwsQ0FBYyxVQUFkLEVBRUEsV0FBSyxRQUFMLENBQWMsbUJBQWQsQ0FDSyxNQURMLENBQ1k7dUJBQUssRUFBRSxRQUFGLENBQVcsVUFBWCxJQUF5QixFQUFFLFFBQUYsQ0FBVyxVQUFYLENBQXNCLE1BQXRCLEdBQStCLENBQS9CO2FBQTlCLENBTEcsRUFRZCxHQVJjLENBUVY7dUJBQWtDLEVBQUUsUUFBRixDQUFXLFVBQVgsSUFBeUIsRUFBekI7YUFBbEMsQ0FSVSxDQVNkLEtBVGMsRUFBYixDQUhLO0FBY1gsZ0JBQU0sV0FBVyxtQkFBWCxDQWRLO0FBZ0JYLGlCQUFLLE9BQUwsR0FBZTtBQUNYLHNCQUFNLFVBQU47QUFHQSxzQkFBTSxXQUFLLFFBQUwsQ0FBYyxRQUFkLENBQXVCLE1BQXZCLENBQThCOzJCQUFLLENBQUMsRUFBRSxNQUFGLElBQVksRUFBRSxPQUFGLEtBQWMsWUFBZDtpQkFBbEIsQ0FBOUIsQ0FBNEUsR0FBNUUsQ0FBZ0Y7MkJBQU07aUJBQU4sQ0FBdEY7QUFDQSx1QkFBTyxXQUFL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aEIsQ0FBb0IsS0FBSyxNQUFMLENBQXBCLENBUmM7YUFBbEI7Ozs7a0NBWVU7QUFDVixpQkFBSyxVQUFMLENBQWdCLE9BQWhCLEdBRFU7Ozs7aURBSWU7QUFDekIsdUJBQUssVUFBTCxDQUFnQixLQUFLLE1BQUwsQ0FBWSxLQUFLLFdBQUwsQ0FBaUIsYUFBakIsQ0FBNUIsRUFEeUI7Ozs7Ozs7QUFRMUIsSUFBTSxrQ0FBYSxJQUFJLFVBQUosRUFBYiIsImZpbGUiOiJsaWIvZmVhdHVyZXMvZmluZC11c2FnZXMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBPYnNlcnZhYmxlLCBTdWJqZWN0IH0gZnJvbSBcInJ4anNcIjtcbmltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUsIERpc3Bvc2FibGUgfSBmcm9tIFwidHMtZGlzcG9zYWJsZXNcIjtcbmltcG9ydCB7IE9tbmkgfSBmcm9tIFwiLi4vc2VydmVyL29tbmlcIjtcbmltcG9ydCB7IGRvY2sgfSBmcm9tIFwiLi4vYXRvbS9kb2NrXCI7XG5pbXBvcnQgeyBGaW5kV2luZG93IH0gZnJvbSBcIi4uL3ZpZXdzL2ZpbmQtcGFuZS12aWV3XCI7XG5jbGFzcyBGaW5kVXNhZ2VzIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5fZmluZFdpbmRvdyA9IG5ldyBGaW5kV2luZG93O1xuICAgICAgICB0aGlzLnNjcm9sbFRvcCA9IDA7XG4gICAgICAgIHRoaXMudXNhZ2VzID0gW107XG4gICAgICAgIHRoaXMucmVxdWlyZWQgPSB0cnVlO1xuICAgICAgICB0aGlzLnRpdGxlID0gXCJGaW5kIFVzYWdlcyAvIEdvIFRvIEltcGxlbWVudGF0aW9uc1wiO1xuICAgICAgICB0aGlzLmRlc2NyaXB0aW9uID0gXCJBZGRzIHN1cHBvcnQgdG8gZmluZCB1c2FnZXMsIGFuZCBnbyB0byBpbXBsZW1lbnRhdGlvbnNcIjtcbiAgICB9XG4gICAgYWN0aXZhdGUoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIGNvbnN0IG9ic2VydmFibGUgPSBPYnNlcnZhYmxlLm1lcmdlKE9tbmkubGlzdGVuZXIuZmluZHVzYWdlcywgT21uaS5saXN0ZW5lci5maW5kaW1wbGVtZW50YXRpb25zXG4gICAgICAgICAgICAuZmlsdGVyKHogPT4gei5yZXNwb25zZS5RdWlja0ZpeGVzICYmIHoucmVzcG9uc2UuUXVpY2tGaXhlcy5sZW5ndGggPiAxKSlcbiAgICAgICAgICAgIC5tYXAoeiA9PiB6LnJlc3BvbnNlLlF1aWNrRml4ZXMgfHwgW10pXG4gICAgICAgICAgICAuc2hhcmUoKTtcbiAgICAgICAgY29uc3Qgc2VsZWN0ZWQgPSBuZXcgU3ViamVjdCgpO1xuICAgICAgICB0aGlzLm9ic2VydmUgPSB7XG4gICAgICAgICAgICBmaW5kOiBvYnNlcnZhYmxlLFxuICAgICAgICAgICAgb3BlbjogT21uaS5saXN0ZW5lci5yZXF1ZXN0cy5maWx0ZXIoeiA9PiAhei5zaWxlbnQgJiYgei5jb21tYW5kID09PSBcImZpbmR1c2FnZXNcIikubWFwKCgpID0+IHRydWUpLFxuICAgICAgICAgICAgcmVzZXQ6IE9tbmkubGlzdGVuZXIucmVxdWVzdHMuZmlsdGVyKHogPT4gIXouc2lsZW50ICYmICh6LmNvbW1hbmQgPT09IFwiZmluZGltcGxlbWVudGF0aW9uc1wiIHx8IHouY29tbWFuZCA9PT0gXCJmaW5kdXNhZ2VzXCIpKS5tYXAoKCkgPT4gdHJ1ZSksXG4gICAgICAgICAgICBzZWxlY3RlZDogc2VsZWN0ZWQuYXNPYnNlcnZhYmxlKClcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmFkZFRleHRFZGl0b3JDb21tYW5kKFwib21uaXNoYXJwLWF0b206ZmluZC11c2FnZXNcIiwgKCkgPT4ge1xuICAgICAgICAgICAgT21uaS5yZXF1ZXN0KHNvbHV0aW9uID0+IHNvbHV0aW9uLmZpbmR1c2FnZXMoe30pKTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuYWRkVGV4dEVkaXRvckNvbW1hbmQoXCJvbW5pc2hhcnAtYXRvbTpnby10by1pbXBsZW1lbnRhdGlvblwiLCAoKSA9PiB7XG4gICAgICAgICAgICBPbW5pLnJlcXVlc3Qoc29sdXRpb24gPT4gc29sdXRpb24uZmluZGltcGxlbWVudGF0aW9ucyh7fSkpO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcIm9tbmlzaGFycC1hdG9tOm5leHQtdXNhZ2VcIiwgKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5fZmluZFdpbmRvdy5uZXh0KCk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwib21uaXNoYXJwLWF0b206Z28tdG8tdXNhZ2VcIiwgKCkgPT4ge1xuICAgICAgICAgICAgT21uaS5uYXZpZ2F0ZVRvKHRoaXMuX2ZpbmRXaW5kb3cuY3VycmVudCk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwib21uaXNoYXJwLWF0b206cHJldmlvdXMtdXNhZ2VcIiwgKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5fZmluZFdpbmRvdy5wcmV2KCk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwib21uaXNoYXJwLWF0b206Z28tdG8tbmV4dC11c2FnZVwiLCAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLl9maW5kV2luZG93Lm5leHQoKTtcbiAgICAgICAgICAgIE9tbmkubmF2aWdhdGVUbyh0aGlzLl9maW5kV2luZG93LmN1cnJlbnQpO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcIm9tbmlzaGFycC1hdG9tOmdvLXRvLXByZXZpb3VzLXVzYWdlXCIsICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuX2ZpbmRXaW5kb3cucHJldigpO1xuICAgICAgICAgICAgT21uaS5uYXZpZ2F0ZVRvKHRoaXMuX2ZpbmRXaW5kb3cuY3VycmVudCk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZCh0aGlzLm9ic2VydmUuZmluZC5zdWJzY3JpYmUocyA9PiB7XG4gICAgICAgICAgICB0aGlzLnVzYWdlcyA9IHM7XG4gICAgICAgICAgICB0aGlzLl9maW5kV2luZG93LnVwZGF0ZShzKTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9ic2VydmFibGUubWVyZ2UodGhpcy5vYnNlcnZlLmZpbmQubWFwKHogPT4gdHJ1ZSksIHRoaXMub2JzZXJ2ZS5vcGVuLm1hcCh6ID0+IHRydWUpKS5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5lbnN1cmVXaW5kb3dJc0NyZWF0ZWQoKTtcbiAgICAgICAgICAgIGRvY2suc2VsZWN0V2luZG93KFwiZmluZFwiKTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKHRoaXMub2JzZXJ2ZS5yZXNldC5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy51c2FnZXMgPSBbXTtcbiAgICAgICAgICAgIHRoaXMuc2Nyb2xsVG9wID0gMDtcbiAgICAgICAgICAgIHRoaXMuX2ZpbmRXaW5kb3cuc2VsZWN0ZWRJbmRleCA9IDA7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmxpc3RlbmVyLmZpbmRpbXBsZW1lbnRhdGlvbnMuc3Vic2NyaWJlKChkYXRhKSA9PiB7XG4gICAgICAgICAgICBpZiAoZGF0YS5yZXNwb25zZS5RdWlja0ZpeGVzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgICAgIE9tbmkubmF2aWdhdGVUbyhkYXRhLnJlc3BvbnNlLlF1aWNrRml4ZXNbMF0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KSk7XG4gICAgfVxuICAgIGVuc3VyZVdpbmRvd0lzQ3JlYXRlZCgpIHtcbiAgICAgICAgaWYgKCF0aGlzLndpbmRvdykge1xuICAgICAgICAgICAgdGhpcy53aW5kb3cgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICAgICAgY29uc3Qgd2luZG93RGlzcG9zYWJsZSA9IGRvY2suYWRkV2luZG93KFwiZmluZFwiLCBcIkZpbmRcIiwgdGhpcy5fZmluZFdpbmRvdywgeyBwcmlvcml0eTogMjAwMCwgY2xvc2VhYmxlOiB0cnVlIH0sIHRoaXMud2luZG93KTtcbiAgICAgICAgICAgIHRoaXMud2luZG93LmFkZCh3aW5kb3dEaXNwb3NhYmxlKTtcbiAgICAgICAgICAgIHRoaXMud2luZG93LmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLnJlbW92ZSh0aGlzLndpbmRvdyk7XG4gICAgICAgICAgICAgICAgdGhpcy53aW5kb3cgPSBudWxsO1xuICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZCh0aGlzLndpbmRvdyk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZGlzcG9zZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICB9XG4gICAgbmF2aWdhdGVUb1NlbGVjdGVkSXRlbSgpIHtcbiAgICAgICAgT21uaS5uYXZpZ2F0ZVRvKHRoaXMudXNhZ2VzW3RoaXMuX2ZpbmRXaW5kb3cuc2VsZWN0ZWRJbmRleF0pO1xuICAgIH1cbn1cbmV4cG9ydCBjb25zdCBmaW5kVXNhZ2VzID0gbmV3IEZpbmRVc2FnZXM7XG4iLCJpbXBvcnQge01vZGVsc30gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcclxuaW1wb3J0IHtPYnNlcnZhYmxlLCBTdWJqZWN0fSBmcm9tIFwicnhqc1wiO1xyXG5pbXBvcnQge0NvbXBvc2l0ZURpc3Bvc2FibGUsIERpc3Bvc2FibGV9IGZyb20gXCJ0cy1kaXNwb3NhYmxlc1wiO1xyXG5pbXBvcnQge09tbml9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xyXG5pbXBvcnQge2RvY2t9IGZyb20gXCIuLi9hdG9tL2RvY2tcIjtcclxuaW1wb3J0IHtGaW5kV2luZG93fSBmcm9tIFwiLi4vdmlld3MvZmluZC1wYW5lLXZpZXdcIjtcclxuXHJcbmNsYXNzIEZpbmRVc2FnZXMgaW1wbGVtZW50cyBJRmVhdHVyZSB7XHJcbiAgICBwcml2YXRlIGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XHJcbiAgICBwcml2YXRlIHdpbmRvdzogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxuICAgIHByaXZhdGUgX2ZpbmRXaW5kb3cgPSBuZXcgRmluZFdpbmRvdztcclxuICAgIHByaXZhdGUgc2Nyb2xsVG9wOiBudW1iZXIgPSAwO1xyXG4gICAgcHVibGljIHVzYWdlczogTW9kZWxzLkRpYWdub3N0aWNMb2NhdGlvbltdID0gW107XHJcblxyXG4gICAgcHVibGljIG9ic2VydmU6IHtcclxuICAgICAgICBmaW5kOiBPYnNlcnZhYmxlPE1vZGVscy5EaWFnbm9zdGljTG9jYXRpb25bXT47XHJcbiAgICAgICAgb3BlbjogT2JzZXJ2YWJsZTxib29sZWFuPjtcclxuICAgICAgICByZXNldDogT2JzZXJ2YWJsZTxib29sZWFuPjtcclxuICAgICAgICBzZWxlY3RlZDogT2JzZXJ2YWJsZTxudW1iZXI+O1xyXG4gICAgfTtcclxuXHJcbiAgICBwdWJsaWMgYWN0aXZhdGUoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuXHJcbiAgICAgICAgY29uc3Qgb2JzZXJ2YWJsZSA9IE9ic2VydmFibGUubWVyZ2UoXHJcbiAgICAgICAgICAgIC8vIExpc3RlbiB0byBmaW5kIHVzYWdlc1xyXG4gICAgICAgICAgICBPbW5pLmxpc3RlbmVyLmZpbmR1c2FnZXMsXHJcbiAgICAgICAgICAgIC8vIFdlIGFsc28gd2FudCBmaW5kIGltcGxlbWVudGF0aW9ucywgd2hlcmUgd2UgZm91bmQgbW9yZSB0aGFuIG9uZVxyXG4gICAgICAgICAgICBPbW5pLmxpc3RlbmVyLmZpbmRpbXBsZW1lbnRhdGlvbnNcclxuICAgICAgICAgICAgICAgIC5maWx0ZXIoeiA9PiB6LnJlc3BvbnNlLlF1aWNrRml4ZXMgJiYgei5yZXNwb25zZS5RdWlja0ZpeGVzLmxlbmd0aCA+IDEpXHJcbiAgICAgICAgKVxyXG4gICAgICAgICAgICAvLyBGb3IgdGhlIFVJIHdlIG9ubHkgbmVlZCB0aGUgcXVjaWsgZml4ZXMuXHJcbiAgICAgICAgICAgIC5tYXAoeiA9PiA8TW9kZWxzLkRpYWdub3N0aWNMb2NhdGlvbltdPnoucmVzcG9uc2UuUXVpY2tGaXhlcyB8fCBbXSlcclxuICAgICAgICAgICAgLnNoYXJlKCk7XHJcblxyXG4gICAgICAgIGNvbnN0IHNlbGVjdGVkID0gbmV3IFN1YmplY3Q8bnVtYmVyPigpO1xyXG5cclxuICAgICAgICB0aGlzLm9ic2VydmUgPSB7XHJcbiAgICAgICAgICAgIGZpbmQ6IG9ic2VydmFibGUsXHJcbiAgICAgICAgICAgIC8vIE5PVEU6IFdlIGNhbm5vdCBkbyB0aGUgc2FtZSBmb3IgZmluZCBpbXBsZW1lbnRhdGlvbnMgYmVjYXVzZSBmaW5kIGltcGxlbWVudGF0aW9uXHJcbiAgICAgICAgICAgIC8vICAgICAganVzdCBnb2VzIHRvIHRoZSBpdGVtIGlmIG9ubHkgb25lIGNvbWVzIGJhY2suXHJcbiAgICAgICAgICAgIG9wZW46IE9tbmkubGlzdGVuZXIucmVxdWVzdHMuZmlsdGVyKHogPT4gIXouc2lsZW50ICYmIHouY29tbWFuZCA9PT0gXCJmaW5kdXNhZ2VzXCIpLm1hcCgoKSA9PiB0cnVlKSxcclxuICAgICAgICAgICAgcmVzZXQ6IE9tbmkubGlzdGVuZXIucmVxdWVzdHMuZmlsdGVyKHogPT4gIXouc2lsZW50ICYmICh6LmNvbW1hbmQgPT09IFwiZmluZGltcGxlbWVudGF0aW9uc1wiIHx8IHouY29tbWFuZCA9PT0gXCJmaW5kdXNhZ2VzXCIpKS5tYXAoKCkgPT4gdHJ1ZSksXHJcbiAgICAgICAgICAgIHNlbGVjdGVkOiBzZWxlY3RlZC5hc09ic2VydmFibGUoKVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5hZGRUZXh0RWRpdG9yQ29tbWFuZChcIm9tbmlzaGFycC1hdG9tOmZpbmQtdXNhZ2VzXCIsICgpID0+IHtcclxuICAgICAgICAgICAgT21uaS5yZXF1ZXN0KHNvbHV0aW9uID0+IHNvbHV0aW9uLmZpbmR1c2FnZXMoe30pKTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5hZGRUZXh0RWRpdG9yQ29tbWFuZChcIm9tbmlzaGFycC1hdG9tOmdvLXRvLWltcGxlbWVudGF0aW9uXCIsICgpID0+IHtcclxuICAgICAgICAgICAgT21uaS5yZXF1ZXN0KHNvbHV0aW9uID0+IHNvbHV0aW9uLmZpbmRpbXBsZW1lbnRhdGlvbnMoe30pKTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcIm9tbmlzaGFycC1hdG9tOm5leHQtdXNhZ2VcIiwgKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLl9maW5kV2luZG93Lm5leHQoKTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcIm9tbmlzaGFycC1hdG9tOmdvLXRvLXVzYWdlXCIsICgpID0+IHtcclxuICAgICAgICAgICAgT21uaS5uYXZpZ2F0ZVRvKHRoaXMuX2ZpbmRXaW5kb3cuY3VycmVudCk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTpwcmV2aW91cy11c2FnZVwiLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuX2ZpbmRXaW5kb3cucHJldigpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwib21uaXNoYXJwLWF0b206Z28tdG8tbmV4dC11c2FnZVwiLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuX2ZpbmRXaW5kb3cubmV4dCgpO1xyXG4gICAgICAgICAgICBPbW5pLm5hdmlnYXRlVG8odGhpcy5fZmluZFdpbmRvdy5jdXJyZW50KTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcIm9tbmlzaGFycC1hdG9tOmdvLXRvLXByZXZpb3VzLXVzYWdlXCIsICgpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5fZmluZFdpbmRvdy5wcmV2KCk7XHJcbiAgICAgICAgICAgIE9tbmkubmF2aWdhdGVUbyh0aGlzLl9maW5kV2luZG93LmN1cnJlbnQpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZCh0aGlzLm9ic2VydmUuZmluZC5zdWJzY3JpYmUocyA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMudXNhZ2VzID0gcztcclxuICAgICAgICAgICAgdGhpcy5fZmluZFdpbmRvdy51cGRhdGUocyk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9ic2VydmFibGUubWVyZ2UodGhpcy5vYnNlcnZlLmZpbmQubWFwKHogPT4gdHJ1ZSksIHRoaXMub2JzZXJ2ZS5vcGVuLm1hcCh6ID0+IHRydWUpKS5zdWJzY3JpYmUoKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLmVuc3VyZVdpbmRvd0lzQ3JlYXRlZCgpO1xyXG4gICAgICAgICAgICBkb2NrLnNlbGVjdFdpbmRvdyhcImZpbmRcIik7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKHRoaXMub2JzZXJ2ZS5yZXNldC5zdWJzY3JpYmUoKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLnVzYWdlcyA9IFtdO1xyXG4gICAgICAgICAgICB0aGlzLnNjcm9sbFRvcCA9IDA7XHJcbiAgICAgICAgICAgIHRoaXMuX2ZpbmRXaW5kb3cuc2VsZWN0ZWRJbmRleCA9IDA7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmxpc3RlbmVyLmZpbmRpbXBsZW1lbnRhdGlvbnMuc3Vic2NyaWJlKChkYXRhKSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChkYXRhLnJlc3BvbnNlLlF1aWNrRml4ZXMubGVuZ3RoID09PSAxKSB7XHJcbiAgICAgICAgICAgICAgICBPbW5pLm5hdmlnYXRlVG8oZGF0YS5yZXNwb25zZS5RdWlja0ZpeGVzWzBdKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGVuc3VyZVdpbmRvd0lzQ3JlYXRlZCgpIHtcclxuICAgICAgICBpZiAoIXRoaXMud2luZG93KSB7XHJcbiAgICAgICAgICAgIHRoaXMud2luZG93ID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgICAgICAgICAgY29uc3Qgd2luZG93RGlzcG9zYWJsZSA9IGRvY2suYWRkV2luZG93KFwiZmluZFwiLCBcIkZpbmRcIiwgdGhpcy5fZmluZFdpbmRvdywgeyBwcmlvcml0eTogMjAwMCwgY2xvc2VhYmxlOiB0cnVlIH0sIHRoaXMud2luZG93KTtcclxuICAgICAgICAgICAgdGhpcy53aW5kb3cuYWRkKHdpbmRvd0Rpc3Bvc2FibGUpO1xyXG4gICAgICAgICAgICB0aGlzLndpbmRvdy5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLnJlbW92ZSh0aGlzLndpbmRvdyk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLndpbmRvdyA9IG51bGw7XHJcbiAgICAgICAgICAgIH0pKTtcclxuICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZCh0aGlzLndpbmRvdyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkaXNwb3NlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIG5hdmlnYXRlVG9TZWxlY3RlZEl0ZW0oKSB7XHJcbiAgICAgICAgT21uaS5uYXZpZ2F0ZVRvKHRoaXMudXNhZ2VzW3RoaXMuX2ZpbmRXaW5kb3cuc2VsZWN0ZWRJbmRleF0pO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZXF1aXJlZCA9IHRydWU7XHJcbiAgICBwdWJsaWMgdGl0bGUgPSBcIkZpbmQgVXNhZ2VzIC8gR28gVG8gSW1wbGVtZW50YXRpb25zXCI7XHJcbiAgICBwdWJsaWMgZGVzY3JpcHRpb24gPSBcIkFkZHMgc3VwcG9ydCB0byBmaW5kIHVzYWdlcywgYW5kIGdvIHRvIGltcGxlbWVudGF0aW9uc1wiO1xyXG59XHJcbmV4cG9ydCBjb25zdCBmaW5kVXNhZ2VzID0gbmV3IEZpbmRVc2FnZXM7XHJcbiJdfQ==
