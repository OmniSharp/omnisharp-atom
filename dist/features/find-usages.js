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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9maW5kLXVzYWdlcy5qcyIsImxpYi9mZWF0dXJlcy9maW5kLXVzYWdlcy50cyJdLCJuYW1lcyI6WyJGaW5kVXNhZ2VzIiwiX2ZpbmRXaW5kb3ciLCJzY3JvbGxUb3AiLCJ1c2FnZXMiLCJyZXF1aXJlZCIsInRpdGxlIiwiZGVzY3JpcHRpb24iLCJkaXNwb3NhYmxlIiwib2JzZXJ2YWJsZSIsIm1lcmdlIiwibGlzdGVuZXIiLCJmaW5kdXNhZ2VzIiwiZmluZGltcGxlbWVudGF0aW9ucyIsImZpbHRlciIsInoiLCJyZXNwb25zZSIsIlF1aWNrRml4ZXMiLCJsZW5ndGgiLCJtYXAiLCJzaGFyZSIsInNlbGVjdGVkIiwib2JzZXJ2ZSIsImZpbmQiLCJvcGVuIiwicmVxdWVzdHMiLCJzaWxlbnQiLCJjb21tYW5kIiwicmVzZXQiLCJhc09ic2VydmFibGUiLCJhZGQiLCJhZGRUZXh0RWRpdG9yQ29tbWFuZCIsInJlcXVlc3QiLCJzb2x1dGlvbiIsImF0b20iLCJjb21tYW5kcyIsIm5leHQiLCJuYXZpZ2F0ZVRvIiwiY3VycmVudCIsInByZXYiLCJzdWJzY3JpYmUiLCJzIiwidXBkYXRlIiwiZW5zdXJlV2luZG93SXNDcmVhdGVkIiwic2VsZWN0V2luZG93Iiwic2VsZWN0ZWRJbmRleCIsImRhdGEiLCJ3aW5kb3ciLCJ3aW5kb3dEaXNwb3NhYmxlIiwiYWRkV2luZG93IiwicHJpb3JpdHkiLCJjbG9zZWFibGUiLCJjcmVhdGUiLCJyZW1vdmUiLCJkaXNwb3NlIiwiZmluZFVzYWdlcyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7SUNHQUEsVTtBQUFBLDBCQUFBO0FBQUE7O0FBR1ksYUFBQUMsV0FBQSxHQUFjLDhCQUFkO0FBQ0EsYUFBQUMsU0FBQSxHQUFvQixDQUFwQjtBQUNELGFBQUFDLE1BQUEsR0FBc0MsRUFBdEM7QUE2R0EsYUFBQUMsUUFBQSxHQUFXLElBQVg7QUFDQSxhQUFBQyxL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Q0g7Ozs7OztBQU1FLElBQU1VLGtDQUFhLElBQUl0RCxVQUFKLEVBQW5CIiwiZmlsZSI6ImxpYi9mZWF0dXJlcy9maW5kLXVzYWdlcy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE9ic2VydmFibGUsIFN1YmplY3QgfSBmcm9tIFwicnhqc1wiO1xuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSwgRGlzcG9zYWJsZSB9IGZyb20gXCJ0cy1kaXNwb3NhYmxlc1wiO1xuaW1wb3J0IHsgT21uaSB9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xuaW1wb3J0IHsgZG9jayB9IGZyb20gXCIuLi9hdG9tL2RvY2tcIjtcbmltcG9ydCB7IEZpbmRXaW5kb3cgfSBmcm9tIFwiLi4vdmlld3MvZmluZC1wYW5lLXZpZXdcIjtcbmNsYXNzIEZpbmRVc2FnZXMge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLl9maW5kV2luZG93ID0gbmV3IEZpbmRXaW5kb3c7XG4gICAgICAgIHRoaXMuc2Nyb2xsVG9wID0gMDtcbiAgICAgICAgdGhpcy51c2FnZXMgPSBbXTtcbiAgICAgICAgdGhpcy5yZXF1aXJlZCA9IHRydWU7XG4gICAgICAgIHRoaXMudGl0bGUgPSBcIkZpbmQgVXNhZ2VzIC8gR28gVG8gSW1wbGVtZW50YXRpb25zXCI7XG4gICAgICAgIHRoaXMuZGVzY3JpcHRpb24gPSBcIkFkZHMgc3VwcG9ydCB0byBmaW5kIHVzYWdlcywgYW5kIGdvIHRvIGltcGxlbWVudGF0aW9uc1wiO1xuICAgIH1cbiAgICBhY3RpdmF0ZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgY29uc3Qgb2JzZXJ2YWJsZSA9IE9ic2VydmFibGUubWVyZ2UoT21uaS5saXN0ZW5lci5maW5kdXNhZ2VzLCBPbW5pLmxpc3RlbmVyLmZpbmRpbXBsZW1lbnRhdGlvbnNcbiAgICAgICAgICAgIC5maWx0ZXIoeiA9PiB6LnJlc3BvbnNlLlF1aWNrRml4ZXMgJiYgei5yZXNwb25zZS5RdWlja0ZpeGVzLmxlbmd0aCA+IDEpKVxuICAgICAgICAgICAgLm1hcCh6ID0+IHoucmVzcG9uc2UuUXVpY2tGaXhlcyB8fCBbXSlcbiAgICAgICAgICAgIC5zaGFyZSgpO1xuICAgICAgICBjb25zdCBzZWxlY3RlZCA9IG5ldyBTdWJqZWN0KCk7XG4gICAgICAgIHRoaXMub2JzZXJ2ZSA9IHtcbiAgICAgICAgICAgIGZpbmQ6IG9ic2VydmFibGUsXG4gICAgICAgICAgICBvcGVuOiBPbW5pLmxpc3RlbmVyLnJlcXVlc3RzLmZpbHRlcih6ID0+ICF6LnNpbGVudCAmJiB6LmNvbW1hbmQgPT09IFwiZmluZHVzYWdlc1wiKS5tYXAoKCkgPT4gdHJ1ZSksXG4gICAgICAgICAgICByZXNldDogT21uaS5saXN0ZW5lci5yZXF1ZXN0cy5maWx0ZXIoeiA9PiAhei5zaWxlbnQgJiYgKHouY29tbWFuZCA9PT0gXCJmaW5kaW1wbGVtZW50YXRpb25zXCIgfHwgei5jb21tYW5kID09PSBcImZpbmR1c2FnZXNcIikpLm1hcCgoKSA9PiB0cnVlKSxcbiAgICAgICAgICAgIHNlbGVjdGVkOiBzZWxlY3RlZC5hc09ic2VydmFibGUoKVxuICAgICAgICB9O1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuYWRkVGV4dEVkaXRvckNvbW1hbmQoXCJvbW5pc2hhcnAtYXRvbTpmaW5kLXVzYWdlc1wiLCAoKSA9PiB7XG4gICAgICAgICAgICBPbW5pLnJlcXVlc3Qoc29sdXRpb24gPT4gc29sdXRpb24uZmluZHVzYWdlcyh7fSkpO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5hZGRUZXh0RWRpdG9yQ29tbWFuZChcIm9tbmlzaGFycC1hdG9tOmdvLXRvLWltcGxlbWVudGF0aW9uXCIsICgpID0+IHtcbiAgICAgICAgICAgIE9tbmkucmVxdWVzdChzb2x1dGlvbiA9PiBzb2x1dGlvbi5maW5kaW1wbGVtZW50YXRpb25zKHt9KSk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwib21uaXNoYXJwLWF0b206bmV4dC11c2FnZVwiLCAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLl9maW5kV2luZG93Lm5leHQoKTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTpnby10by11c2FnZVwiLCAoKSA9PiB7XG4gICAgICAgICAgICBPbW5pLm5hdmlnYXRlVG8odGhpcy5fZmluZFdpbmRvdy5jdXJyZW50KTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTpwcmV2aW91cy11c2FnZVwiLCAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLl9maW5kV2luZG93LnByZXYoKTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTpnby10by1uZXh0LXVzYWdlXCIsICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuX2ZpbmRXaW5kb3cubmV4dCgpO1xuICAgICAgICAgICAgT21uaS5uYXZpZ2F0ZVRvKHRoaXMuX2ZpbmRXaW5kb3cuY3VycmVudCk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwib21uaXNoYXJwLWF0b206Z28tdG8tcHJldmlvdXMtdXNhZ2VcIiwgKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5fZmluZFdpbmRvdy5wcmV2KCk7XG4gICAgICAgICAgICBPbW5pLm5hdmlnYXRlVG8odGhpcy5fZmluZFdpbmRvdy5jdXJyZW50KTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKHRoaXMub2JzZXJ2ZS5maW5kLnN1YnNjcmliZShzID0+IHtcbiAgICAgICAgICAgIHRoaXMudXNhZ2VzID0gcztcbiAgICAgICAgICAgIHRoaXMuX2ZpbmRXaW5kb3cudXBkYXRlKHMpO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT2JzZXJ2YWJsZS5tZXJnZSh0aGlzLm9ic2VydmUuZmluZC5tYXAoeiA9PiB0cnVlKSwgdGhpcy5vYnNlcnZlLm9wZW4ubWFwKHogPT4gdHJ1ZSkpLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmVuc3VyZVdpbmRvd0lzQ3JlYXRlZCgpO1xuICAgICAgICAgICAgZG9jay5zZWxlY3RXaW5kb3coXCJmaW5kXCIpO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQodGhpcy5vYnNlcnZlLnJlc2V0LnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnVzYWdlcyA9IFtdO1xuICAgICAgICAgICAgdGhpcy5zY3JvbGxUb3AgPSAwO1xuICAgICAgICAgICAgdGhpcy5fZmluZFdpbmRvdy5zZWxlY3RlZEluZGV4ID0gMDtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkubGlzdGVuZXIuZmluZGltcGxlbWVudGF0aW9ucy5zdWJzY3JpYmUoKGRhdGEpID0+IHtcbiAgICAgICAgICAgIGlmIChkYXRhLnJlc3BvbnNlLlF1aWNrRml4ZXMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICAgICAgT21uaS5uYXZpZ2F0ZVRvKGRhdGEucmVzcG9uc2UuUXVpY2tGaXhlc1swXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pKTtcbiAgICB9XG4gICAgZW5zdXJlV2luZG93SXNDcmVhdGVkKCkge1xuICAgICAgICBpZiAoIXRoaXMud2luZG93KSB7XG4gICAgICAgICAgICB0aGlzLndpbmRvdyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgICAgICBjb25zdCB3aW5kb3dEaXNwb3NhYmxlID0gZG9jay5hZGRXaW5kb3coXCJmaW5kXCIsIFwiRmluZFwiLCB0aGlzLl9maW5kV2luZG93LCB7IHByaW9yaXR5OiAyMDAwLCBjbG9zZWFibGU6IHRydWUgfSwgdGhpcy53aW5kb3cpO1xuICAgICAgICAgICAgdGhpcy53aW5kb3cuYWRkKHdpbmRvd0Rpc3Bvc2FibGUpO1xuICAgICAgICAgICAgdGhpcy53aW5kb3cuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUucmVtb3ZlKHRoaXMud2luZG93KTtcbiAgICAgICAgICAgICAgICB0aGlzLndpbmRvdyA9IG51bGw7XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKHRoaXMud2luZG93KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBkaXNwb3NlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgIH1cbiAgICBuYXZpZ2F0ZVRvU2VsZWN0ZWRJdGVtKCkge1xuICAgICAgICBPbW5pLm5hdmlnYXRlVG8odGhpcy51c2FnZXNbdGhpcy5fZmluZFdpbmRvdy5zZWxlY3RlZEluZGV4XSk7XG4gICAgfVxufVxuZXhwb3J0IGNvbnN0IGZpbmRVc2FnZXMgPSBuZXcgRmluZFVzYWdlcztcbiIsImltcG9ydCB7TW9kZWxzfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xyXG5pbXBvcnQge09ic2VydmFibGUsIFN1YmplY3R9IGZyb20gXCJyeGpzXCI7XHJcbmltcG9ydCB7Q29tcG9zaXRlRGlzcG9zYWJsZSwgRGlzcG9zYWJsZX0gZnJvbSBcInRzLWRpc3Bvc2FibGVzXCI7XHJcbmltcG9ydCB7T21uaX0gZnJvbSBcIi4uL3NlcnZlci9vbW5pXCI7XHJcbmltcG9ydCB7ZG9ja30gZnJvbSBcIi4uL2F0b20vZG9ja1wiO1xyXG5pbXBvcnQge0ZpbmRXaW5kb3d9IGZyb20gXCIuLi92aWV3cy9maW5kLXBhbmUtdmlld1wiO1xyXG5cclxuY2xhc3MgRmluZFVzYWdlcyBpbXBsZW1lbnRzIElGZWF0dXJlIHtcclxuICAgIHByaXZhdGUgZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxuICAgIHByaXZhdGUgd2luZG93OiBDb21wb3NpdGVEaXNwb3NhYmxlO1xyXG4gICAgcHJpdmF0ZSBfZmluZFdpbmRvdyA9IG5ldyBGaW5kV2luZG93O1xyXG4gICAgcHJpdmF0ZSBzY3JvbGxUb3A6IG51bWJlciA9IDA7XHJcbiAgICBwdWJsaWMgdXNhZ2VzOiBNb2RlbHMuRGlhZ25vc3RpY0xvY2F0aW9uW10gPSBbXTtcclxuXHJcbiAgICBwdWJsaWMgb2JzZXJ2ZToge1xyXG4gICAgICAgIGZpbmQ6IE9ic2VydmFibGU8TW9kZWxzLkRpYWdub3N0aWNMb2NhdGlvbltdPjtcclxuICAgICAgICBvcGVuOiBPYnNlcnZhYmxlPGJvb2xlYW4+O1xyXG4gICAgICAgIHJlc2V0OiBPYnNlcnZhYmxlPGJvb2xlYW4+O1xyXG4gICAgICAgIHNlbGVjdGVkOiBPYnNlcnZhYmxlPG51bWJlcj47XHJcbiAgICB9O1xyXG5cclxuICAgIHB1YmxpYyBhY3RpdmF0ZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG5cclxuICAgICAgICBjb25zdCBvYnNlcnZhYmxlID0gT2JzZXJ2YWJsZS5tZXJnZShcclxuICAgICAgICAgICAgLy8gTGlzdGVuIHRvIGZpbmQgdXNhZ2VzXHJcbiAgICAgICAgICAgIE9tbmkubGlzdGVuZXIuZmluZHVzYWdlcyxcclxuICAgICAgICAgICAgLy8gV2UgYWxzbyB3YW50IGZpbmQgaW1wbGVtZW50YXRpb25zLCB3aGVyZSB3ZSBmb3VuZCBtb3JlIHRoYW4gb25lXHJcbiAgICAgICAgICAgIE9tbmkubGlzdGVuZXIuZmluZGltcGxlbWVudGF0aW9uc1xyXG4gICAgICAgICAgICAgICAgLmZpbHRlcih6ID0+IHoucmVzcG9uc2UuUXVpY2tGaXhlcyAmJiB6LnJlc3BvbnNlLlF1aWNrRml4ZXMubGVuZ3RoID4gMSlcclxuICAgICAgICApXHJcbiAgICAgICAgICAgIC8vIEZvciB0aGUgVUkgd2Ugb25seSBuZWVkIHRoZSBxdWNpayBmaXhlcy5cclxuICAgICAgICAgICAgLm1hcCh6ID0+IDxNb2RlbHMuRGlhZ25vc3RpY0xvY2F0aW9uW10+ei5yZXNwb25zZS5RdWlja0ZpeGVzIHx8IFtdKVxyXG4gICAgICAgICAgICAuc2hhcmUoKTtcclxuXHJcbiAgICAgICAgY29uc3Qgc2VsZWN0ZWQgPSBuZXcgU3ViamVjdDxudW1iZXI+KCk7XHJcblxyXG4gICAgICAgIHRoaXMub2JzZXJ2ZSA9IHtcclxuICAgICAgICAgICAgZmluZDogb2JzZXJ2YWJsZSxcclxuICAgICAgICAgICAgLy8gTk9URTogV2UgY2Fubm90IGRvIHRoZSBzYW1lIGZvciBmaW5kIGltcGxlbWVudGF0aW9ucyBiZWNhdXNlIGZpbmQgaW1wbGVtZW50YXRpb25cclxuICAgICAgICAgICAgLy8gICAgICBqdXN0IGdvZXMgdG8gdGhlIGl0ZW0gaWYgb25seSBvbmUgY29tZXMgYmFjay5cclxuICAgICAgICAgICAgb3BlbjogT21uaS5saXN0ZW5lci5yZXF1ZXN0cy5maWx0ZXIoeiA9PiAhei5zaWxlbnQgJiYgei5jb21tYW5kID09PSBcImZpbmR1c2FnZXNcIikubWFwKCgpID0+IHRydWUpLFxyXG4gICAgICAgICAgICByZXNldDogT21uaS5saXN0ZW5lci5yZXF1ZXN0cy5maWx0ZXIoeiA9PiAhei5zaWxlbnQgJiYgKHouY29tbWFuZCA9PT0gXCJmaW5kaW1wbGVtZW50YXRpb25zXCIgfHwgei5jb21tYW5kID09PSBcImZpbmR1c2FnZXNcIikpLm1hcCgoKSA9PiB0cnVlKSxcclxuICAgICAgICAgICAgc2VsZWN0ZWQ6IHNlbGVjdGVkLmFzT2JzZXJ2YWJsZSgpXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmFkZFRleHRFZGl0b3JDb21tYW5kKFwib21uaXNoYXJwLWF0b206ZmluZC11c2FnZXNcIiwgKCkgPT4ge1xyXG4gICAgICAgICAgICBPbW5pLnJlcXVlc3Qoc29sdXRpb24gPT4gc29sdXRpb24uZmluZHVzYWdlcyh7fSkpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmFkZFRleHRFZGl0b3JDb21tYW5kKFwib21uaXNoYXJwLWF0b206Z28tdG8taW1wbGVtZW50YXRpb25cIiwgKCkgPT4ge1xyXG4gICAgICAgICAgICBPbW5pLnJlcXVlc3Qoc29sdXRpb24gPT4gc29sdXRpb24uZmluZGltcGxlbWVudGF0aW9ucyh7fSkpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwib21uaXNoYXJwLWF0b206bmV4dC11c2FnZVwiLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuX2ZpbmRXaW5kb3cubmV4dCgpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwib21uaXNoYXJwLWF0b206Z28tdG8tdXNhZ2VcIiwgKCkgPT4ge1xyXG4gICAgICAgICAgICBPbW5pLm5hdmlnYXRlVG8odGhpcy5fZmluZFdpbmRvdy5jdXJyZW50KTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcIm9tbmlzaGFycC1hdG9tOnByZXZpb3VzLXVzYWdlXCIsICgpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5fZmluZFdpbmRvdy5wcmV2KCk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTpnby10by1uZXh0LXVzYWdlXCIsICgpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5fZmluZFdpbmRvdy5uZXh0KCk7XHJcbiAgICAgICAgICAgIE9tbmkubmF2aWdhdGVUbyh0aGlzLl9maW5kV2luZG93LmN1cnJlbnQpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwib21uaXNoYXJwLWF0b206Z28tdG8tcHJldmlvdXMtdXNhZ2VcIiwgKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLl9maW5kV2luZG93LnByZXYoKTtcclxuICAgICAgICAgICAgT21uaS5uYXZpZ2F0ZVRvKHRoaXMuX2ZpbmRXaW5kb3cuY3VycmVudCk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKHRoaXMub2JzZXJ2ZS5maW5kLnN1YnNjcmliZShzID0+IHtcclxuICAgICAgICAgICAgdGhpcy51c2FnZXMgPSBzO1xyXG4gICAgICAgICAgICB0aGlzLl9maW5kV2luZG93LnVwZGF0ZShzKTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT2JzZXJ2YWJsZS5tZXJnZSh0aGlzLm9ic2VydmUuZmluZC5tYXAoeiA9PiB0cnVlKSwgdGhpcy5vYnNlcnZlLm9wZW4ubWFwKHogPT4gdHJ1ZSkpLnN1YnNjcmliZSgoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuZW5zdXJlV2luZG93SXNDcmVhdGVkKCk7XHJcbiAgICAgICAgICAgIGRvY2suc2VsZWN0V2luZG93KFwiZmluZFwiKTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQodGhpcy5vYnNlcnZlLnJlc2V0LnN1YnNjcmliZSgoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMudXNhZ2VzID0gW107XHJcbiAgICAgICAgICAgIHRoaXMuc2Nyb2xsVG9wID0gMDtcclxuICAgICAgICAgICAgdGhpcy5fZmluZFdpbmRvdy5zZWxlY3RlZEluZGV4ID0gMDtcclxuICAgICAgICB9KSk7XHJcblxyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkubGlzdGVuZXIuZmluZGltcGxlbWVudGF0aW9ucy5zdWJzY3JpYmUoKGRhdGEpID0+IHtcclxuICAgICAgICAgICAgaWYgKGRhdGEucmVzcG9uc2UuUXVpY2tGaXhlcy5sZW5ndGggPT09IDEpIHtcclxuICAgICAgICAgICAgICAgIE9tbmkubmF2aWdhdGVUbyhkYXRhLnJlc3BvbnNlLlF1aWNrRml4ZXNbMF0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZW5zdXJlV2luZG93SXNDcmVhdGVkKCkge1xyXG4gICAgICAgIGlmICghdGhpcy53aW5kb3cpIHtcclxuICAgICAgICAgICAgdGhpcy53aW5kb3cgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG4gICAgICAgICAgICBjb25zdCB3aW5kb3dEaXNwb3NhYmxlID0gZG9jay5hZGRXaW5kb3coXCJmaW5kXCIsIFwiRmluZFwiLCB0aGlzLl9maW5kV2luZG93LCB7IHByaW9yaXR5OiAyMDAwLCBjbG9zZWFibGU6IHRydWUgfSwgdGhpcy53aW5kb3cpO1xyXG4gICAgICAgICAgICB0aGlzLndpbmRvdy5hZGQod2luZG93RGlzcG9zYWJsZSk7XHJcbiAgICAgICAgICAgIHRoaXMud2luZG93LmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUucmVtb3ZlKHRoaXMud2luZG93KTtcclxuICAgICAgICAgICAgICAgIHRoaXMud2luZG93ID0gbnVsbDtcclxuICAgICAgICAgICAgfSkpO1xyXG4gICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKHRoaXMud2luZG93KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgbmF2aWdhdGVUb1NlbGVjdGVkSXRlbSgpIHtcclxuICAgICAgICBPbW5pLm5hdmlnYXRlVG8odGhpcy51c2FnZXNbdGhpcy5fZmluZFdpbmRvdy5zZWxlY3RlZEluZGV4XSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlcXVpcmVkID0gdHJ1ZTtcclxuICAgIHB1YmxpYyB0aXRsZSA9IFwiRmluZCBVc2FnZXMgLyBHbyBUbyBJbXBsZW1lbnRhdGlvbnNcIjtcclxuICAgIHB1YmxpYyBkZXNjcmlwdGlvbiA9IFwiQWRkcyBzdXBwb3J0IHRvIGZpbmQgdXNhZ2VzLCBhbmQgZ28gdG8gaW1wbGVtZW50YXRpb25zXCI7XHJcbn1cclxuZXhwb3J0IGNvbnN0IGZpbmRVc2FnZXMgPSBuZXcgRmluZFVzYWdlcztcclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
