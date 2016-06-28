"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.codeCheck = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _rxjs = require("rxjs");

var _omnisharpClient = require("omnisharp-client");

var _omni = require("../server/omni");

var _dock = require("../atom/dock");

var _codecheckOutputPaneView = require("../views/codecheck-output-pane-view");

var _reloadWorkspace = require("./reload-workspace");

var _lodash = require("lodash");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var CodeCheck = function () {
    function CodeCheck() {
        _classCallCheck(this, CodeCheck);

        this.displayDiagnostics = [];
        this.selectedIndex = 0;
        this.scrollTop = 0;
        this._window = new _codecheckOutputPaneView.CodeCheckOutputElement();
        this.required = true;
        this.title = "Diagnostics";
        this.description = "Support for diagnostic errors.";
    }

    _createClass(CodeCheck, [{
        key: "activate",
        value: function activate() {
            var _this = this;

            this.disposable = new _omnisharpClient.CompositeDisposable();
            this._fullCodeCheck = new _rxjs.Subject();
            this.disposable.add(this._fullCodeCheck);
            this.disposable.add(atom.commands.add("atom-workspace", "omnisharp-atom:next-diagnostic", function () {
                _this._window.next();
            }));
            this.disposable.add(atom.commands.add("atom-workspace", "omnisharp-atom:go-to-diagnostic", function () {
                _omni.Omni.navigateTo(_this._window.current);
            }));
            this.disposable.add(atom.commands.add("atom-workspace", "omnisharp-atom:previous-diagnostic", function () {
                _this._window.prev();
            }));
            this.disposable.add(atom.commands.add("atom-workspace", "omnisharp-atom:go-to-next-diagnostic", function () {
                _this._window.next();
                _omni.Omni.navigateTo(_this._window.current);
            }));
            this.disposable.add(atom.commands.add("atom-workspace", "omnisharp-atom:go-to-previous-diagnostic", function () {
                _this._window.prev();
                _omni.Omni.navigateTo(_this._window.current);
            }));
            this.disposable.add(_omni.Omni.diagnostics.subscribe(function (diagnostics) {
                _this.displayDiagnostics = _this.filterOnlyWarningsAndErrors(diagnostics);
            }));
            this.disposable.add(_omni.Omni.diagnostics.subscribe(function (s) {
                _this.scrollTop = 0;
                _this.selectedIndex = 0;
            }));
            this.disposable.add(_omni.Omni.diagnostics.delay(100).subscribe(function (diagnostics) {
                return _this._window.update(diagnostics);
            }));
            this.disposable.add(_dock.dock.addWindow("errors", "Errors & Warnings", this._window));
            var started = 0,
                finished = 0;
            this.disposable.add(_rxjs.Observable.combineLatest(_omni.Omni.listener.packageRestoreStarted.map(function (x) {
                return started++;
            }), _omni.Omni.listener.packageRestoreFinished.map(function (x) {
                return finished++;
            }), function (s, f) {
                return s === f;
            }).filter(function (r) {
                return r;
            }).debounceTime(2000).subscribe(function () {
                started = 0;
                finished = 0;
                _this.doFullCodeCheck();
            }));
            this.disposable.add(_omni.Omni.listener.packageRestoreFinished.debounceTime(3000).subscribe(function () {
                return _this.doFullCodeCheck();
            }));
            this.disposable.add(atom.commands.add("atom-workspace", "omnisharp-atom:code-check", function () {
                return _this.doFullCodeCheck();
            }));
            this.disposable.add(this._fullCodeCheck.concatMap(function () {
                return _reloadWorkspace.reloadWorkspace.reloadWorkspace().toArray().concatMap(function (x) {
                    return _omni.Omni.solutions;
                }).concatMap(function (solution) {
                    return solution.whenConnected().do(function () {
                        return solution.diagnostics({ FileName: null });
                    });
                });
            }).subscribe());
            _omni.Omni.registerConfiguration(function (solution) {
                return solution.whenConnected().delay(1000).subscribe(function () {
                    return _this._fullCodeCheck.next(true);
                });
            });
        }
    }, {
        key: "doFullCodeCheck",
        value: function doFullCodeCheck() {
            this._fullCodeCheck.next(true);
        }
    }, {
        key: "filterOnlyWarningsAndErrors",
        value: function filterOnlyWarningsAndErrors(quickFixes) {
            return (0, _lodash.filter)(quickFixes, function (x) {
                return x.LogLevel !== "Hidden";
            });
        }
    }, {
        key: "dispose",
        value: function dispose() {
            this.disposable.dispose();
        }
    }]);

    return CodeCheck;
}();

var codeCheck = exports.codeCheck = new CodeCheck();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9jb2RlLWNoZWNrLmpzIiwibGliL2ZlYXR1cmVzL2NvZGUtY2hlY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7SUNHQTtBQUFBLHlCQUFBOzs7QUFHVyxhQUFBLGtCQUFBLEdBQWtELEVBQWxELENBSFg7QUFJVyxhQUFBLGFBQUEsR0FBd0IsQ0FBeEIsQ0FKWDtBQUtZLGFBQUEsU0FBQSxHQUFvQixDQUFwQixDQUxaO0FBT1ksYUFBQSxPQUFBLEdBQVUscURBQVYsQ0FQWjtBQWdHVyxhQUFBLFFBQUEsR0FBVyxJQUFYLENBaEdYO0FBaUdXLGFBQUEsS0FBQSxHQUFRLGFBQVIsQ0FqR1g7QUFrR1csYUFBQSxXQUFBLEdBQWMsZ0NBQWQsQ0FsR1g7S0FBQTs7OzttQ0FTbUI7OztBQUNYLGlCQUFLLFVBQUwsR0FBa0IsMENBQWxCLENBRFc7QUFHWCxpQkFBSyxjQUFMLEdBQXNCLG1CQUF0QixDQUhXO0FBSVgsaUJBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQixLQUFLLGNBQUwsQ0FBcEIsQ0FKVztBQU1YLGlCQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsS0FBSyxRQUFMLENBQWMsR0FBZCxDQUFrQixnQkFBbEIsRUFBb0MsZ0NBQXBDLEVBQXNFLFlBQUE7QUFDdEYsc0JBQUssT0FBTCxDQUFhLElBQWIsR0FEc0Y7YUFBQSxDQUExRixFQU5XO0FBVVgsaUJBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQixLQUFLLFFBQUwsQ0FBYyxHQUFkLENBQWtCLGdCQUFsQixFQUFvQyxpQ0FBcEMsRUFBdUUsWUFBQTtBQUN2RiwyQkFBSyxVQUFMLENBQWdCLE1BQUssT0FBTCxDQUFhLE9BQWIsQ0FBaEIsQ0FEdUY7YUFBQSxDQUEzRixFQVZXO0FBY1gsaUJBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQixLQUFLLFFBQUwsQ0FBYyxHQUFkLENB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RkUsQ0FHWixTQUhZLENBR0Y7MkJBQVksU0FBUyxhQUFULEdBQ2xCLEVBRGtCLENBQ2Y7K0JBQU0sU0FBUyxXQUFULENBQXFCLEVBQUUsVUFBVSxJQUFWLEVBQXZCO3FCQUFOO2lCQURHO2FBSEosQ0FESyxDQU9mLFNBUGUsRUFBcEIsRUE1RFc7QUFxRVgsdUJBQUsscUJBQUwsQ0FBMkI7dUJBQVksU0FDbEMsYUFEa0MsR0FFbEMsS0FGa0MsQ0FFNUIsSUFGNEIsRUFHbEMsU0FIa0MsQ0FHeEI7MkJBQU0sTUFBSyxjQUFMLENBQW9CLElBQXBCLENBQXlCLElBQXpCO2lCQUFOO2FBSFksQ0FBM0IsQ0FyRVc7Ozs7MENBMkVPO0FBQ2xCLGlCQUFLLGNBQUwsQ0FBb0IsSUFBcEIsQ0FBeUIsSUFBekIsRUFEa0I7Ozs7b0RBSWEsWUFBdUM7QUFDdEUsbUJBQU8sb0JBQU8sVUFBUCxFQUFtQjt1QkFBSyxFQUFFLFFBQUYsS0FBZSxRQUFmO2FBQUwsQ0FBMUIsQ0FEc0U7Ozs7a0NBSTVEO0FBQ1YsaUJBQUssVUFBTCxDQUFnQixPQUFoQixHQURVOzs7Ozs7O0FBU1gsSUFBTSxnQ0FBWSxJQUFJLFNBQUosRUFBWiIsImZpbGUiOiJsaWIvZmVhdHVyZXMvY29kZS1jaGVjay5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE9ic2VydmFibGUsIFN1YmplY3QgfSBmcm9tIFwicnhqc1wiO1xuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSB9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XG5pbXBvcnQgeyBPbW5pIH0gZnJvbSBcIi4uL3NlcnZlci9vbW5pXCI7XG5pbXBvcnQgeyBkb2NrIH0gZnJvbSBcIi4uL2F0b20vZG9ja1wiO1xuaW1wb3J0IHsgQ29kZUNoZWNrT3V0cHV0RWxlbWVudCB9IGZyb20gXCIuLi92aWV3cy9jb2RlY2hlY2stb3V0cHV0LXBhbmUtdmlld1wiO1xuaW1wb3J0IHsgcmVsb2FkV29ya3NwYWNlIH0gZnJvbSBcIi4vcmVsb2FkLXdvcmtzcGFjZVwiO1xuaW1wb3J0IHsgZmlsdGVyIH0gZnJvbSBcImxvZGFzaFwiO1xuY2xhc3MgQ29kZUNoZWNrIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5kaXNwbGF5RGlhZ25vc3RpY3MgPSBbXTtcbiAgICAgICAgdGhpcy5zZWxlY3RlZEluZGV4ID0gMDtcbiAgICAgICAgdGhpcy5zY3JvbGxUb3AgPSAwO1xuICAgICAgICB0aGlzLl93aW5kb3cgPSBuZXcgQ29kZUNoZWNrT3V0cHV0RWxlbWVudDtcbiAgICAgICAgdGhpcy5yZXF1aXJlZCA9IHRydWU7XG4gICAgICAgIHRoaXMudGl0bGUgPSBcIkRpYWdub3N0aWNzXCI7XG4gICAgICAgIHRoaXMuZGVzY3JpcHRpb24gPSBcIlN1cHBvcnQgZm9yIGRpYWdub3N0aWMgZXJyb3JzLlwiO1xuICAgIH1cbiAgICBhY3RpdmF0ZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgdGhpcy5fZnVsbENvZGVDaGVjayA9IG5ldyBTdWJqZWN0KCk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQodGhpcy5fZnVsbENvZGVDaGVjayk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcIm9tbmlzaGFycC1hdG9tOm5leHQtZGlhZ25vc3RpY1wiLCAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLl93aW5kb3cubmV4dCgpO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcIm9tbmlzaGFycC1hdG9tOmdvLXRvLWRpYWdub3N0aWNcIiwgKCkgPT4ge1xuICAgICAgICAgICAgT21uaS5uYXZpZ2F0ZVRvKHRoaXMuX3dpbmRvdy5jdXJyZW50KTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTpwcmV2aW91cy1kaWFnbm9zdGljXCIsICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuX3dpbmRvdy5wcmV2KCk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwib21uaXNoYXJwLWF0b206Z28tdG8tbmV4dC1kaWFnbm9zdGljXCIsICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuX3dpbmRvdy5uZXh0KCk7XG4gICAgICAgICAgICBPbW5pLm5hdmlnYXRlVG8odGhpcy5fd2luZG93LmN1cnJlbnQpO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcIm9tbmlzaGFycC1hdG9tOmdvLXRvLXByZXZpb3VzLWRpYWdub3N0aWNcIiwgKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5fd2luZG93LnByZXYoKTtcbiAgICAgICAgICAgIE9tbmkubmF2aWdhdGVUbyh0aGlzLl93aW5kb3cuY3VycmVudCk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmRpYWdub3N0aWNzXG4gICAgICAgICAgICAuc3Vic2NyaWJlKGRpYWdub3N0aWNzID0+IHtcbiAgICAgICAgICAgIHRoaXMuZGlzcGxheURpYWdub3N0aWNzID0gdGhpcy5maWx0ZXJPbmx5V2FybmluZ3NBbmRFcnJvcnMoZGlhZ25vc3RpY3MpO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5kaWFnbm9zdGljcy5zdWJzY3JpYmUocyA9PiB7XG4gICAgICAgICAgICB0aGlzLnNjcm9sbFRvcCA9IDA7XG4gICAgICAgICAgICB0aGlzLnNlbGVjdGVkSW5kZXggPSAwO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5kaWFnbm9zdGljc1xuICAgICAgICAgICAgLmRlbGF5KDEwMClcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoZGlhZ25vc3RpY3MgPT4gdGhpcy5fd2luZG93LnVwZGF0ZShkaWFnbm9zdGljcykpKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChkb2NrLmFkZFdpbmRvdyhcImVycm9yc1wiLCBcIkVycm9ycyAmIFdhcm5pbmdzXCIsIHRoaXMuX3dpbmRvdykpO1xuICAgICAgICBsZXQgc3RhcnRlZCA9IDAsIGZpbmlzaGVkID0gMDtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPYnNlcnZhYmxlLmNvbWJpbmVMYXRlc3QoT21uaS5saXN0ZW5lci5wYWNrYWdlUmVzdG9yZVN0YXJ0ZWQubWFwKHggPT4gc3RhcnRlZCsrKSwgT21uaS5saXN0ZW5lci5wYWNrYWdlUmVzdG9yZUZpbmlzaGVkLm1hcCh4ID0+IGZpbmlzaGVkKyspLCAocywgZikgPT4gcyA9PT0gZilcbiAgICAgICAgICAgIC5maWx0ZXIociA9PiByKVxuICAgICAgICAgICAgLmRlYm91bmNlVGltZSgyMDAwKVxuICAgICAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgICAgICBzdGFydGVkID0gMDtcbiAgICAgICAgICAgIGZpbmlzaGVkID0gMDtcbiAgICAgICAgICAgIHRoaXMuZG9GdWxsQ29kZUNoZWNrKCk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmxpc3RlbmVyLnBhY2thZ2VSZXN0b3JlRmluaXNoZWQuZGVib3VuY2VUaW1lKDMwMDApLnN1YnNjcmliZSgoKSA9PiB0aGlzLmRvRnVsbENvZGVDaGVjaygpKSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcIm9tbmlzaGFycC1hdG9tOmNvZGUtY2hlY2tcIiwgKCkgPT4gdGhpcy5kb0Z1bGxDb2RlQ2hlY2soKSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKHRoaXMuX2Z1bGxDb2RlQ2hlY2tcbiAgICAgICAgICAgIC5jb25jYXRNYXAoKCkgPT4gcmVsb2FkV29ya3NwYWNlLnJlbG9hZFdvcmtzcGFjZSgpXG4gICAgICAgICAgICAudG9BcnJheSgpXG4gICAgICAgICAgICAuY29uY2F0TWFwKHggPT4gT21uaS5zb2x1dGlvbnMpXG4gICAgICAgICAgICAuY29uY2F0TWFwKHNvbHV0aW9uID0+IHNvbHV0aW9uLndoZW5Db25uZWN0ZWQoKVxuICAgICAgICAgICAgLmRvKCgpID0+IHNvbHV0aW9uLmRpYWdub3N0aWNzKHsgRmlsZU5hbWU6IG51bGwgfSkpKSlcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoKSk7XG4gICAgICAgIE9tbmkucmVnaXN0ZXJDb25maWd1cmF0aW9uKHNvbHV0aW9uID0+IHNvbHV0aW9uXG4gICAgICAgICAgICAud2hlbkNvbm5lY3RlZCgpXG4gICAgICAgICAgICAuZGVsYXkoMTAwMClcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoKCkgPT4gdGhpcy5fZnVsbENvZGVDaGVjay5uZXh0KHRydWUpKSk7XG4gICAgfVxuICAgIGRvRnVsbENvZGVDaGVjaygpIHtcbiAgICAgICAgdGhpcy5fZnVsbENvZGVDaGVjay5uZXh0KHRydWUpO1xuICAgIH1cbiAgICBmaWx0ZXJPbmx5V2FybmluZ3NBbmRFcnJvcnMocXVpY2tGaXhlcykge1xuICAgICAgICByZXR1cm4gZmlsdGVyKHF1aWNrRml4ZXMsIHggPT4geC5Mb2dMZXZlbCAhPT0gXCJIaWRkZW5cIik7XG4gICAgfVxuICAgIGRpc3Bvc2UoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfVxufVxuZXhwb3J0IGNvbnN0IGNvZGVDaGVjayA9IG5ldyBDb2RlQ2hlY2s7XG4iLCJpbXBvcnQge01vZGVsc30gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcclxuaW1wb3J0IHtPYnNlcnZhYmxlLCBTdWJqZWN0fSBmcm9tIFwicnhqc1wiO1xyXG5pbXBvcnQge0NvbXBvc2l0ZURpc3Bvc2FibGV9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XHJcbmltcG9ydCB7T21uaX0gZnJvbSBcIi4uL3NlcnZlci9vbW5pXCI7XHJcbmltcG9ydCB7ZG9ja30gZnJvbSBcIi4uL2F0b20vZG9ja1wiO1xyXG5pbXBvcnQge0NvZGVDaGVja091dHB1dEVsZW1lbnR9IGZyb20gXCIuLi92aWV3cy9jb2RlY2hlY2stb3V0cHV0LXBhbmUtdmlld1wiO1xyXG5pbXBvcnQge3JlbG9hZFdvcmtzcGFjZX0gZnJvbSBcIi4vcmVsb2FkLXdvcmtzcGFjZVwiO1xyXG5pbXBvcnQge2ZpbHRlcn0gZnJvbSBcImxvZGFzaFwiO1xyXG5cclxuY2xhc3MgQ29kZUNoZWNrIGltcGxlbWVudHMgSUZlYXR1cmUge1xyXG4gICAgcHJpdmF0ZSBkaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xyXG5cclxuICAgIHB1YmxpYyBkaXNwbGF5RGlhZ25vc3RpY3M6IE1vZGVscy5EaWFnbm9zdGljTG9jYXRpb25bXSA9IFtdO1xyXG4gICAgcHVibGljIHNlbGVjdGVkSW5kZXg6IG51bWJlciA9IDA7XHJcbiAgICBwcml2YXRlIHNjcm9sbFRvcDogbnVtYmVyID0gMDtcclxuICAgIHByaXZhdGUgX2Z1bGxDb2RlQ2hlY2s6IFN1YmplY3Q8YW55PjtcclxuICAgIHByaXZhdGUgX3dpbmRvdyA9IG5ldyBDb2RlQ2hlY2tPdXRwdXRFbGVtZW50O1xyXG5cclxuICAgIHB1YmxpYyBhY3RpdmF0ZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG5cclxuICAgICAgICB0aGlzLl9mdWxsQ29kZUNoZWNrID0gbmV3IFN1YmplY3Q8YW55PigpO1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQodGhpcy5fZnVsbENvZGVDaGVjayk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcIm9tbmlzaGFycC1hdG9tOm5leHQtZGlhZ25vc3RpY1wiLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuX3dpbmRvdy5uZXh0KCk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTpnby10by1kaWFnbm9zdGljXCIsICgpID0+IHtcclxuICAgICAgICAgICAgT21uaS5uYXZpZ2F0ZVRvKHRoaXMuX3dpbmRvdy5jdXJyZW50KTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcIm9tbmlzaGFycC1hdG9tOnByZXZpb3VzLWRpYWdub3N0aWNcIiwgKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLl93aW5kb3cucHJldigpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwib21uaXNoYXJwLWF0b206Z28tdG8tbmV4dC1kaWFnbm9zdGljXCIsICgpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5fd2luZG93Lm5leHQoKTtcclxuICAgICAgICAgICAgT21uaS5uYXZpZ2F0ZVRvKHRoaXMuX3dpbmRvdy5jdXJyZW50KTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcIm9tbmlzaGFycC1hdG9tOmdvLXRvLXByZXZpb3VzLWRpYWdub3N0aWNcIiwgKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLl93aW5kb3cucHJldigpO1xyXG4gICAgICAgICAgICBPbW5pLm5hdmlnYXRlVG8odGhpcy5fd2luZG93LmN1cnJlbnQpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmRpYWdub3N0aWNzXHJcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoZGlhZ25vc3RpY3MgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kaXNwbGF5RGlhZ25vc3RpY3MgPSB0aGlzLmZpbHRlck9ubHlXYXJuaW5nc0FuZEVycm9ycyhkaWFnbm9zdGljcyk7XHJcbiAgICAgICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmRpYWdub3N0aWNzLnN1YnNjcmliZShzID0+IHtcclxuICAgICAgICAgICAgdGhpcy5zY3JvbGxUb3AgPSAwO1xyXG4gICAgICAgICAgICB0aGlzLnNlbGVjdGVkSW5kZXggPSAwO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmRpYWdub3N0aWNzXHJcbiAgICAgICAgICAgIC5kZWxheSgxMDApXHJcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoZGlhZ25vc3RpY3MgPT4gdGhpcy5fd2luZG93LnVwZGF0ZShkaWFnbm9zdGljcykpKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChkb2NrLmFkZFdpbmRvdyhcImVycm9yc1wiLCBcIkVycm9ycyAmIFdhcm5pbmdzXCIsIHRoaXMuX3dpbmRvdykpO1xyXG5cclxuICAgICAgICBsZXQgc3RhcnRlZCA9IDAsIGZpbmlzaGVkID0gMDtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9ic2VydmFibGUuY29tYmluZUxhdGVzdChcclxuICAgICAgICAgICAgT21uaS5saXN0ZW5lci5wYWNrYWdlUmVzdG9yZVN0YXJ0ZWQubWFwKHggPT4gc3RhcnRlZCsrKSxcclxuICAgICAgICAgICAgT21uaS5saXN0ZW5lci5wYWNrYWdlUmVzdG9yZUZpbmlzaGVkLm1hcCh4ID0+IGZpbmlzaGVkKyspLFxyXG4gICAgICAgICAgICAocywgZikgPT4gcyA9PT0gZilcclxuICAgICAgICAgICAgLmZpbHRlcihyID0+IHIpXHJcbiAgICAgICAgICAgIC5kZWJvdW5jZVRpbWUoMjAwMClcclxuICAgICAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBzdGFydGVkID0gMDtcclxuICAgICAgICAgICAgICAgIGZpbmlzaGVkID0gMDtcclxuICAgICAgICAgICAgICAgIHRoaXMuZG9GdWxsQ29kZUNoZWNrKCk7XHJcbiAgICAgICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmxpc3RlbmVyLnBhY2thZ2VSZXN0b3JlRmluaXNoZWQuZGVib3VuY2VUaW1lKDMwMDApLnN1YnNjcmliZSgoKSA9PiB0aGlzLmRvRnVsbENvZGVDaGVjaygpKSk7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwib21uaXNoYXJwLWF0b206Y29kZS1jaGVja1wiLCAoKSA9PiB0aGlzLmRvRnVsbENvZGVDaGVjaygpKSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQodGhpcy5fZnVsbENvZGVDaGVja1xyXG4gICAgICAgICAgICAuY29uY2F0TWFwKCgpID0+IHJlbG9hZFdvcmtzcGFjZS5yZWxvYWRXb3Jrc3BhY2UoKVxyXG4gICAgICAgICAgICAgICAgLnRvQXJyYXkoKVxyXG4gICAgICAgICAgICAgICAgLmNvbmNhdE1hcCh4ID0+IE9tbmkuc29sdXRpb25zKVxyXG4gICAgICAgICAgICAgICAgLmNvbmNhdE1hcChzb2x1dGlvbiA9PiBzb2x1dGlvbi53aGVuQ29ubmVjdGVkKClcclxuICAgICAgICAgICAgICAgICAgICAuZG8oKCkgPT4gc29sdXRpb24uZGlhZ25vc3RpY3MoeyBGaWxlTmFtZTogbnVsbCB9KSkpXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICAgICAgLnN1YnNjcmliZSgpKTtcclxuXHJcbiAgICAgICAgT21uaS5yZWdpc3RlckNvbmZpZ3VyYXRpb24oc29sdXRpb24gPT4gc29sdXRpb25cclxuICAgICAgICAgICAgLndoZW5Db25uZWN0ZWQoKVxyXG4gICAgICAgICAgICAuZGVsYXkoMTAwMClcclxuICAgICAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB0aGlzLl9mdWxsQ29kZUNoZWNrLm5leHQodHJ1ZSkpKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZG9GdWxsQ29kZUNoZWNrKCkge1xyXG4gICAgICAgIHRoaXMuX2Z1bGxDb2RlQ2hlY2submV4dCh0cnVlKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZmlsdGVyT25seVdhcm5pbmdzQW5kRXJyb3JzKHF1aWNrRml4ZXM6IE1vZGVscy5EaWFnbm9zdGljTG9jYXRpb25bXSk6IE1vZGVscy5EaWFnbm9zdGljTG9jYXRpb25bXSB7XHJcbiAgICAgICAgcmV0dXJuIGZpbHRlcihxdWlja0ZpeGVzLCB4ID0+IHguTG9nTGV2ZWwgIT09IFwiSGlkZGVuXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkaXNwb3NlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlcXVpcmVkID0gdHJ1ZTtcclxuICAgIHB1YmxpYyB0aXRsZSA9IFwiRGlhZ25vc3RpY3NcIjtcclxuICAgIHB1YmxpYyBkZXNjcmlwdGlvbiA9IFwiU3VwcG9ydCBmb3IgZGlhZ25vc3RpYyBlcnJvcnMuXCI7XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBjb2RlQ2hlY2sgPSBuZXcgQ29kZUNoZWNrO1xyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
