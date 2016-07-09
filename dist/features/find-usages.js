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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9maW5kLXVzYWdlcy5qcyIsImxpYi9mZWF0dXJlcy9maW5kLXVzYWdlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7OztJQ0dBLFU7QUFBQSwwQkFBQTtBQUFBOztBQUdZLGFBQUEsV0FBQSxHQUFjLDhCQUFkO0FBQ0EsYUFBQSxTQUFBLEdBQW9CLENBQXBCO0FBQ0QsYUFBQSxNQUFBLEdBQXNDLEVBQXRDO0FBNkdBLGFBQUEsUUFBQSxHQUFXLElBQVg7QUFDQSxhQUFBLEtBQUEsR0FBUSxxQ0FBUjtBQUNBLGFBQUEsV0FBQSxHQUFjLHdEQUFkO0FBQ1Y7Ozs7bUNBdkdrQjtBQUFBOztBQUNYLGlCQUFLLFVBQUwsR0FBa0IsMENBQWxCO0FBRUEsZ0JBQU0sYUFBYSxpQkFBVyxLQUFYLENBRWYsV0FBSyxRQUFMLENBQWMsVUFGQyxFQUlmLFdBQUssUUFBTCxDQUFjLG1CQUFkLENBQ0ssTUFETCxDQUNZO0FBQUEsdUJBQUssRUFBRSxRQUFGLENBQVcsVUFBWCxJQUF5QixFQUFFLFFBQUYsQ0FBVyxVQUFYLENBQXNCLE1BQXRCLEdBQStCLENBQTdEO0FBQUEsYUFEWixDQUplLEVBUWQsR0FSYyxDQVFWO0FBQUEsdUJBQWtDLEVBQUUsUUFBRixDQUFXLFVBQVgsSUFBeUIsRUFBM0Q7QUFBQSxhQVJVLEVBU2QsS0FUYyxFQUFuQjtBQVdBLGdCQUFNLFdBQVcsbUJBQWpCO0FBRUEsaUJBQUssT0FBTCxHQUFlO0FBQ1gsc0JBQU0sVUFESztBQUlYLHNCQUFNLFdBQUssUUFBTCxDQUFjLFFBQWQsQ0FBdUIsTUFBdkIsQ0FBOEI7QUFBQSwyQkFBSyxDQUFDLEVBQUUsTUFBSCxJQUFhLEVBQUUsT0FBRixLQUFjLFlBQWhDO0FBQUEsaUJBQTlCLEVBQTRFLEdBQTVFLENBQWdGO0FBQUEsMkJBQU0sSUFBTjtBQUFBLGlCQUFoRixDQUpLO0FBS1gsdUJBQU8sV0FBSyxRQUFM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Z0IsS0FBSyxNQUFMLENBQVksS0FBSyxXQUFMLENBQWlCLGFBQTdCLENBQWhCO0FBQ0g7Ozs7OztBQU1FLElBQU0sa0NBQWEsSUFBSSxVQUFKLEVBQW5CIiwiZmlsZSI6ImxpYi9mZWF0dXJlcy9maW5kLXVzYWdlcy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE9ic2VydmFibGUsIFN1YmplY3QgfSBmcm9tIFwicnhqc1wiO1xuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSwgRGlzcG9zYWJsZSB9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XG5pbXBvcnQgeyBPbW5pIH0gZnJvbSBcIi4uL3NlcnZlci9vbW5pXCI7XG5pbXBvcnQgeyBkb2NrIH0gZnJvbSBcIi4uL2F0b20vZG9ja1wiO1xuaW1wb3J0IHsgRmluZFdpbmRvdyB9IGZyb20gXCIuLi92aWV3cy9maW5kLXBhbmUtdmlld1wiO1xuY2xhc3MgRmluZFVzYWdlcyB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuX2ZpbmRXaW5kb3cgPSBuZXcgRmluZFdpbmRvdztcbiAgICAgICAgdGhpcy5zY3JvbGxUb3AgPSAwO1xuICAgICAgICB0aGlzLnVzYWdlcyA9IFtdO1xuICAgICAgICB0aGlzLnJlcXVpcmVkID0gdHJ1ZTtcbiAgICAgICAgdGhpcy50aXRsZSA9IFwiRmluZCBVc2FnZXMgLyBHbyBUbyBJbXBsZW1lbnRhdGlvbnNcIjtcbiAgICAgICAgdGhpcy5kZXNjcmlwdGlvbiA9IFwiQWRkcyBzdXBwb3J0IHRvIGZpbmQgdXNhZ2VzLCBhbmQgZ28gdG8gaW1wbGVtZW50YXRpb25zXCI7XG4gICAgfVxuICAgIGFjdGl2YXRlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICBjb25zdCBvYnNlcnZhYmxlID0gT2JzZXJ2YWJsZS5tZXJnZShPbW5pLmxpc3RlbmVyLmZpbmR1c2FnZXMsIE9tbmkubGlzdGVuZXIuZmluZGltcGxlbWVudGF0aW9uc1xuICAgICAgICAgICAgLmZpbHRlcih6ID0+IHoucmVzcG9uc2UuUXVpY2tGaXhlcyAmJiB6LnJlc3BvbnNlLlF1aWNrRml4ZXMubGVuZ3RoID4gMSkpXG4gICAgICAgICAgICAubWFwKHogPT4gei5yZXNwb25zZS5RdWlja0ZpeGVzIHx8IFtdKVxuICAgICAgICAgICAgLnNoYXJlKCk7XG4gICAgICAgIGNvbnN0IHNlbGVjdGVkID0gbmV3IFN1YmplY3QoKTtcbiAgICAgICAgdGhpcy5vYnNlcnZlID0ge1xuICAgICAgICAgICAgZmluZDogb2JzZXJ2YWJsZSxcbiAgICAgICAgICAgIG9wZW46IE9tbmkubGlzdGVuZXIucmVxdWVzdHMuZmlsdGVyKHogPT4gIXouc2lsZW50ICYmIHouY29tbWFuZCA9PT0gXCJmaW5kdXNhZ2VzXCIpLm1hcCgoKSA9PiB0cnVlKSxcbiAgICAgICAgICAgIHJlc2V0OiBPbW5pLmxpc3RlbmVyLnJlcXVlc3RzLmZpbHRlcih6ID0+ICF6LnNpbGVudCAmJiAoei5jb21tYW5kID09PSBcImZpbmRpbXBsZW1lbnRhdGlvbnNcIiB8fCB6LmNvbW1hbmQgPT09IFwiZmluZHVzYWdlc1wiKSkubWFwKCgpID0+IHRydWUpLFxuICAgICAgICAgICAgc2VsZWN0ZWQ6IHNlbGVjdGVkLmFzT2JzZXJ2YWJsZSgpXG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5hZGRUZXh0RWRpdG9yQ29tbWFuZChcIm9tbmlzaGFycC1hdG9tOmZpbmQtdXNhZ2VzXCIsICgpID0+IHtcbiAgICAgICAgICAgIE9tbmkucmVxdWVzdChzb2x1dGlvbiA9PiBzb2x1dGlvbi5maW5kdXNhZ2VzKHt9KSk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmFkZFRleHRFZGl0b3JDb21tYW5kKFwib21uaXNoYXJwLWF0b206Z28tdG8taW1wbGVtZW50YXRpb25cIiwgKCkgPT4ge1xuICAgICAgICAgICAgT21uaS5yZXF1ZXN0KHNvbHV0aW9uID0+IHNvbHV0aW9uLmZpbmRpbXBsZW1lbnRhdGlvbnMoe30pKTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTpuZXh0LXVzYWdlXCIsICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuX2ZpbmRXaW5kb3cubmV4dCgpO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcIm9tbmlzaGFycC1hdG9tOmdvLXRvLXVzYWdlXCIsICgpID0+IHtcbiAgICAgICAgICAgIE9tbmkubmF2aWdhdGVUbyh0aGlzLl9maW5kV2luZG93LmN1cnJlbnQpO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcIm9tbmlzaGFycC1hdG9tOnByZXZpb3VzLXVzYWdlXCIsICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuX2ZpbmRXaW5kb3cucHJldigpO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcIm9tbmlzaGFycC1hdG9tOmdvLXRvLW5leHQtdXNhZ2VcIiwgKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5fZmluZFdpbmRvdy5uZXh0KCk7XG4gICAgICAgICAgICBPbW5pLm5hdmlnYXRlVG8odGhpcy5fZmluZFdpbmRvdy5jdXJyZW50KTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTpnby10by1wcmV2aW91cy11c2FnZVwiLCAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLl9maW5kV2luZG93LnByZXYoKTtcbiAgICAgICAgICAgIE9tbmkubmF2aWdhdGVUbyh0aGlzLl9maW5kV2luZG93LmN1cnJlbnQpO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQodGhpcy5vYnNlcnZlLmZpbmQuc3Vic2NyaWJlKHMgPT4ge1xuICAgICAgICAgICAgdGhpcy51c2FnZXMgPSBzO1xuICAgICAgICAgICAgdGhpcy5fZmluZFdpbmRvdy51cGRhdGUocyk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPYnNlcnZhYmxlLm1lcmdlKHRoaXMub2JzZXJ2ZS5maW5kLm1hcCh6ID0+IHRydWUpLCB0aGlzLm9ic2VydmUub3Blbi5tYXAoeiA9PiB0cnVlKSkuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuZW5zdXJlV2luZG93SXNDcmVhdGVkKCk7XG4gICAgICAgICAgICBkb2NrLnNlbGVjdFdpbmRvdyhcImZpbmRcIik7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZCh0aGlzLm9ic2VydmUucmVzZXQuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMudXNhZ2VzID0gW107XG4gICAgICAgICAgICB0aGlzLnNjcm9sbFRvcCA9IDA7XG4gICAgICAgICAgICB0aGlzLl9maW5kV2luZG93LnNlbGVjdGVkSW5kZXggPSAwO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5saXN0ZW5lci5maW5kaW1wbGVtZW50YXRpb25zLnN1YnNjcmliZSgoZGF0YSkgPT4ge1xuICAgICAgICAgICAgaWYgKGRhdGEucmVzcG9uc2UuUXVpY2tGaXhlcy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgICAgICBPbW5pLm5hdmlnYXRlVG8oZGF0YS5yZXNwb25zZS5RdWlja0ZpeGVzWzBdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSkpO1xuICAgIH1cbiAgICBlbnN1cmVXaW5kb3dJc0NyZWF0ZWQoKSB7XG4gICAgICAgIGlmICghdGhpcy53aW5kb3cpIHtcbiAgICAgICAgICAgIHRoaXMud2luZG93ID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgICAgIGNvbnN0IHdpbmRvd0Rpc3Bvc2FibGUgPSBkb2NrLmFkZFdpbmRvdyhcImZpbmRcIiwgXCJGaW5kXCIsIHRoaXMuX2ZpbmRXaW5kb3csIHsgcHJpb3JpdHk6IDIwMDAsIGNsb3NlYWJsZTogdHJ1ZSB9LCB0aGlzLndpbmRvdyk7XG4gICAgICAgICAgICB0aGlzLndpbmRvdy5hZGQod2luZG93RGlzcG9zYWJsZSk7XG4gICAgICAgICAgICB0aGlzLndpbmRvdy5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5yZW1vdmUodGhpcy53aW5kb3cpO1xuICAgICAgICAgICAgICAgIHRoaXMud2luZG93ID0gbnVsbDtcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQodGhpcy53aW5kb3cpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGRpc3Bvc2UoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfVxuICAgIG5hdmlnYXRlVG9TZWxlY3RlZEl0ZW0oKSB7XG4gICAgICAgIE9tbmkubmF2aWdhdGVUbyh0aGlzLnVzYWdlc1t0aGlzLl9maW5kV2luZG93LnNlbGVjdGVkSW5kZXhdKTtcbiAgICB9XG59XG5leHBvcnQgY29uc3QgZmluZFVzYWdlcyA9IG5ldyBGaW5kVXNhZ2VzO1xuIiwiaW1wb3J0IHtNb2RlbHN9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XHJcbmltcG9ydCB7T2JzZXJ2YWJsZSwgU3ViamVjdH0gZnJvbSBcInJ4anNcIjtcclxuaW1wb3J0IHtDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xyXG5pbXBvcnQge09tbml9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xyXG5pbXBvcnQge2RvY2t9IGZyb20gXCIuLi9hdG9tL2RvY2tcIjtcclxuaW1wb3J0IHtGaW5kV2luZG93fSBmcm9tIFwiLi4vdmlld3MvZmluZC1wYW5lLXZpZXdcIjtcclxuXHJcbmNsYXNzIEZpbmRVc2FnZXMgaW1wbGVtZW50cyBJRmVhdHVyZSB7XHJcbiAgICBwcml2YXRlIGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XHJcbiAgICBwcml2YXRlIHdpbmRvdzogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxuICAgIHByaXZhdGUgX2ZpbmRXaW5kb3cgPSBuZXcgRmluZFdpbmRvdztcclxuICAgIHByaXZhdGUgc2Nyb2xsVG9wOiBudW1iZXIgPSAwO1xyXG4gICAgcHVibGljIHVzYWdlczogTW9kZWxzLkRpYWdub3N0aWNMb2NhdGlvbltdID0gW107XHJcblxyXG4gICAgcHVibGljIG9ic2VydmU6IHtcclxuICAgICAgICBmaW5kOiBPYnNlcnZhYmxlPE1vZGVscy5EaWFnbm9zdGljTG9jYXRpb25bXT47XHJcbiAgICAgICAgb3BlbjogT2JzZXJ2YWJsZTxib29sZWFuPjtcclxuICAgICAgICByZXNldDogT2JzZXJ2YWJsZTxib29sZWFuPjtcclxuICAgICAgICBzZWxlY3RlZDogT2JzZXJ2YWJsZTxudW1iZXI+O1xyXG4gICAgfTtcclxuXHJcbiAgICBwdWJsaWMgYWN0aXZhdGUoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuXHJcbiAgICAgICAgY29uc3Qgb2JzZXJ2YWJsZSA9IE9ic2VydmFibGUubWVyZ2UoXHJcbiAgICAgICAgICAgIC8vIExpc3RlbiB0byBmaW5kIHVzYWdlc1xyXG4gICAgICAgICAgICBPbW5pLmxpc3RlbmVyLmZpbmR1c2FnZXMsXHJcbiAgICAgICAgICAgIC8vIFdlIGFsc28gd2FudCBmaW5kIGltcGxlbWVudGF0aW9ucywgd2hlcmUgd2UgZm91bmQgbW9yZSB0aGFuIG9uZVxyXG4gICAgICAgICAgICBPbW5pLmxpc3RlbmVyLmZpbmRpbXBsZW1lbnRhdGlvbnNcclxuICAgICAgICAgICAgICAgIC5maWx0ZXIoeiA9PiB6LnJlc3BvbnNlLlF1aWNrRml4ZXMgJiYgei5yZXNwb25zZS5RdWlja0ZpeGVzLmxlbmd0aCA+IDEpXHJcbiAgICAgICAgKVxyXG4gICAgICAgICAgICAvLyBGb3IgdGhlIFVJIHdlIG9ubHkgbmVlZCB0aGUgcXVjaWsgZml4ZXMuXHJcbiAgICAgICAgICAgIC5tYXAoeiA9PiA8TW9kZWxzLkRpYWdub3N0aWNMb2NhdGlvbltdPnoucmVzcG9uc2UuUXVpY2tGaXhlcyB8fCBbXSlcclxuICAgICAgICAgICAgLnNoYXJlKCk7XHJcblxyXG4gICAgICAgIGNvbnN0IHNlbGVjdGVkID0gbmV3IFN1YmplY3Q8bnVtYmVyPigpO1xyXG5cclxuICAgICAgICB0aGlzLm9ic2VydmUgPSB7XHJcbiAgICAgICAgICAgIGZpbmQ6IG9ic2VydmFibGUsXHJcbiAgICAgICAgICAgIC8vIE5PVEU6IFdlIGNhbm5vdCBkbyB0aGUgc2FtZSBmb3IgZmluZCBpbXBsZW1lbnRhdGlvbnMgYmVjYXVzZSBmaW5kIGltcGxlbWVudGF0aW9uXHJcbiAgICAgICAgICAgIC8vICAgICAganVzdCBnb2VzIHRvIHRoZSBpdGVtIGlmIG9ubHkgb25lIGNvbWVzIGJhY2suXHJcbiAgICAgICAgICAgIG9wZW46IE9tbmkubGlzdGVuZXIucmVxdWVzdHMuZmlsdGVyKHogPT4gIXouc2lsZW50ICYmIHouY29tbWFuZCA9PT0gXCJmaW5kdXNhZ2VzXCIpLm1hcCgoKSA9PiB0cnVlKSxcclxuICAgICAgICAgICAgcmVzZXQ6IE9tbmkubGlzdGVuZXIucmVxdWVzdHMuZmlsdGVyKHogPT4gIXouc2lsZW50ICYmICh6LmNvbW1hbmQgPT09IFwiZmluZGltcGxlbWVudGF0aW9uc1wiIHx8IHouY29tbWFuZCA9PT0gXCJmaW5kdXNhZ2VzXCIpKS5tYXAoKCkgPT4gdHJ1ZSksXHJcbiAgICAgICAgICAgIHNlbGVjdGVkOiBzZWxlY3RlZC5hc09ic2VydmFibGUoKVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5hZGRUZXh0RWRpdG9yQ29tbWFuZChcIm9tbmlzaGFycC1hdG9tOmZpbmQtdXNhZ2VzXCIsICgpID0+IHtcclxuICAgICAgICAgICAgT21uaS5yZXF1ZXN0KHNvbHV0aW9uID0+IHNvbHV0aW9uLmZpbmR1c2FnZXMoe30pKTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5hZGRUZXh0RWRpdG9yQ29tbWFuZChcIm9tbmlzaGFycC1hdG9tOmdvLXRvLWltcGxlbWVudGF0aW9uXCIsICgpID0+IHtcclxuICAgICAgICAgICAgT21uaS5yZXF1ZXN0KHNvbHV0aW9uID0+IHNvbHV0aW9uLmZpbmRpbXBsZW1lbnRhdGlvbnMoe30pKTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcIm9tbmlzaGFycC1hdG9tOm5leHQtdXNhZ2VcIiwgKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLl9maW5kV2luZG93Lm5leHQoKTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcIm9tbmlzaGFycC1hdG9tOmdvLXRvLXVzYWdlXCIsICgpID0+IHtcclxuICAgICAgICAgICAgT21uaS5uYXZpZ2F0ZVRvKHRoaXMuX2ZpbmRXaW5kb3cuY3VycmVudCk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTpwcmV2aW91cy11c2FnZVwiLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuX2ZpbmRXaW5kb3cucHJldigpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwib21uaXNoYXJwLWF0b206Z28tdG8tbmV4dC11c2FnZVwiLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuX2ZpbmRXaW5kb3cubmV4dCgpO1xyXG4gICAgICAgICAgICBPbW5pLm5hdmlnYXRlVG8odGhpcy5fZmluZFdpbmRvdy5jdXJyZW50KTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcIm9tbmlzaGFycC1hdG9tOmdvLXRvLXByZXZpb3VzLXVzYWdlXCIsICgpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5fZmluZFdpbmRvdy5wcmV2KCk7XHJcbiAgICAgICAgICAgIE9tbmkubmF2aWdhdGVUbyh0aGlzLl9maW5kV2luZG93LmN1cnJlbnQpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZCh0aGlzLm9ic2VydmUuZmluZC5zdWJzY3JpYmUocyA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMudXNhZ2VzID0gcztcclxuICAgICAgICAgICAgdGhpcy5fZmluZFdpbmRvdy51cGRhdGUocyk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9ic2VydmFibGUubWVyZ2UodGhpcy5vYnNlcnZlLmZpbmQubWFwKHogPT4gdHJ1ZSksIHRoaXMub2JzZXJ2ZS5vcGVuLm1hcCh6ID0+IHRydWUpKS5zdWJzY3JpYmUoKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLmVuc3VyZVdpbmRvd0lzQ3JlYXRlZCgpO1xyXG4gICAgICAgICAgICBkb2NrLnNlbGVjdFdpbmRvdyhcImZpbmRcIik7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKHRoaXMub2JzZXJ2ZS5yZXNldC5zdWJzY3JpYmUoKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLnVzYWdlcyA9IFtdO1xyXG4gICAgICAgICAgICB0aGlzLnNjcm9sbFRvcCA9IDA7XHJcbiAgICAgICAgICAgIHRoaXMuX2ZpbmRXaW5kb3cuc2VsZWN0ZWRJbmRleCA9IDA7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmxpc3RlbmVyLmZpbmRpbXBsZW1lbnRhdGlvbnMuc3Vic2NyaWJlKChkYXRhKSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChkYXRhLnJlc3BvbnNlLlF1aWNrRml4ZXMubGVuZ3RoID09PSAxKSB7XHJcbiAgICAgICAgICAgICAgICBPbW5pLm5hdmlnYXRlVG8oZGF0YS5yZXNwb25zZS5RdWlja0ZpeGVzWzBdKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGVuc3VyZVdpbmRvd0lzQ3JlYXRlZCgpIHtcclxuICAgICAgICBpZiAoIXRoaXMud2luZG93KSB7XHJcbiAgICAgICAgICAgIHRoaXMud2luZG93ID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgICAgICAgICAgY29uc3Qgd2luZG93RGlzcG9zYWJsZSA9IGRvY2suYWRkV2luZG93KFwiZmluZFwiLCBcIkZpbmRcIiwgdGhpcy5fZmluZFdpbmRvdywgeyBwcmlvcml0eTogMjAwMCwgY2xvc2VhYmxlOiB0cnVlIH0sIHRoaXMud2luZG93KTtcclxuICAgICAgICAgICAgdGhpcy53aW5kb3cuYWRkKHdpbmRvd0Rpc3Bvc2FibGUpO1xyXG4gICAgICAgICAgICB0aGlzLndpbmRvdy5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLnJlbW92ZSh0aGlzLndpbmRvdyk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLndpbmRvdyA9IG51bGw7XHJcbiAgICAgICAgICAgIH0pKTtcclxuICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZCh0aGlzLndpbmRvdyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkaXNwb3NlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIG5hdmlnYXRlVG9TZWxlY3RlZEl0ZW0oKSB7XHJcbiAgICAgICAgT21uaS5uYXZpZ2F0ZVRvKHRoaXMudXNhZ2VzW3RoaXMuX2ZpbmRXaW5kb3cuc2VsZWN0ZWRJbmRleF0pO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZXF1aXJlZCA9IHRydWU7XHJcbiAgICBwdWJsaWMgdGl0bGUgPSBcIkZpbmQgVXNhZ2VzIC8gR28gVG8gSW1wbGVtZW50YXRpb25zXCI7XHJcbiAgICBwdWJsaWMgZGVzY3JpcHRpb24gPSBcIkFkZHMgc3VwcG9ydCB0byBmaW5kIHVzYWdlcywgYW5kIGdvIHRvIGltcGxlbWVudGF0aW9uc1wiO1xyXG59XHJcbmV4cG9ydCBjb25zdCBmaW5kVXNhZ2VzID0gbmV3IEZpbmRVc2FnZXM7XHJcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
