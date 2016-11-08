"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.codeCheck = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _rxjs = require("rxjs");

var _tsDisposables = require("ts-disposables");

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

            this.disposable = new _tsDisposables.CompositeDisposable();
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9jb2RlLWNoZWNrLmpzIiwibGliL2ZlYXR1cmVzL2NvZGUtY2hlY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7SUNHQTtBQUFBLHlCQUFBOzs7QUFHVyxhQUFBLGtCQUFBLEdBQWtELEVBQWxELENBSFg7QUFJVyxhQUFBLGFBQUEsR0FBd0IsQ0FBeEIsQ0FKWDtBQUtZLGFBQUEsU0FBQSxHQUFvQixDQUFwQixDQUxaO0FBT1ksYUFBQSxPQUFBLEdBQVUscURBQVYsQ0FQWjtBQWdHVyxhQUFBLFFBQUEsR0FBVyxJQUFYLENBaEdYO0FBaUdXLGFBQUEsS0FBQSxHQUFRLGFBQVIsQ0FqR1g7QUFrR1csYUFBQSxXQUFBLEdBQWMsZ0NBQWQsQ0FsR1g7S0FBQTs7OzttQ0FTbUI7OztBQUNYLGlCQUFLLFVBQUwsR0FBa0Isd0NBQWxCLENBRFc7QUFHWCxpQkFBSyxjQUFMLEdBQXNCLG1CQUF0QixDQUhXO0FBSVgsaUJBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQixLQUFLLGNBQUwsQ0FBcEIsQ0FKVztBQU1YLGlCQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsS0FBSyxRQUFMLENBQWMsR0FBZCxDQUFrQixnQkFBbEIsRUFBb0MsZ0NBQXBDLEVBQXNFLFlBQUE7QUFDdEYsc0JBQUssT0FBTCxDQUFhLElBQWIsR0FEc0Y7YUFBQSxDQUExRixFQU5XO0FBVVgsaUJBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQixLQUFLLFFBQUwsQ0FBYyxHQUFkLENBQWtCLGdCQUFsQixFQUFvQyxpQ0FBcEMsRUFBdUUsWUFBQTtBQUN2RiwyQkFBSyxVQUFMLENBQWdCLE1BQUssT0FBTCxDQUFhLE9BQWIsQ0FBaEIsQ0FEdUY7YUFBQSxDQUEzRixFQVZXO0FBY1gsaUJBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQixLQUFLLFFBQUwsQ0FBYyxHQUFkLENB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RkUsQ0FHWixTQUhZLENBR0Y7MkJBQVksU0FBUyxhQUFULEdBQ2xCLEVBRGtCLENBQ2Y7K0JBQU0sU0FBUyxXQUFULENBQXFCLEVBQUUsVUFBVSxJQUFWLEVBQXZCO3FCQUFOO2lCQURHO2FBSEosQ0FESyxDQU9mLFNBUGUsRUFBcEIsRUE1RFc7QUFxRVgsdUJBQUsscUJBQUwsQ0FBMkI7dUJBQVksU0FDbEMsYUFEa0MsR0FFbEMsS0FGa0MsQ0FFNUIsSUFGNEIsRUFHbEMsU0FIa0MsQ0FHeEI7MkJBQU0sTUFBSyxjQUFMLENBQW9CLElBQXBCLENBQXlCLElBQXpCO2lCQUFOO2FBSFksQ0FBM0IsQ0FyRVc7Ozs7MENBMkVPO0FBQ2xCLGlCQUFLLGNBQUwsQ0FBb0IsSUFBcEIsQ0FBeUIsSUFBekIsRUFEa0I7Ozs7b0RBSWEsWUFBdUM7QUFDdEUsbUJBQU8sb0JBQU8sVUFBUCxFQUFtQjt1QkFBSyxFQUFFLFFBQUYsS0FBZSxRQUFmO2FBQUwsQ0FBMUIsQ0FEc0U7Ozs7a0NBSTVEO0FBQ1YsaUJBQUssVUFBTCxDQUFnQixPQUFoQixHQURVOzs7Ozs7O0FBU1gsSUFBTSxnQ0FBWSxJQUFJLFNBQUosRUFBWiIsImZpbGUiOiJsaWIvZmVhdHVyZXMvY29kZS1jaGVjay5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE9ic2VydmFibGUsIFN1YmplY3QgfSBmcm9tIFwicnhqc1wiO1xuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSB9IGZyb20gXCJ0cy1kaXNwb3NhYmxlc1wiO1xuaW1wb3J0IHsgT21uaSB9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xuaW1wb3J0IHsgZG9jayB9IGZyb20gXCIuLi9hdG9tL2RvY2tcIjtcbmltcG9ydCB7IENvZGVDaGVja091dHB1dEVsZW1lbnQgfSBmcm9tIFwiLi4vdmlld3MvY29kZWNoZWNrLW91dHB1dC1wYW5lLXZpZXdcIjtcbmltcG9ydCB7IHJlbG9hZFdvcmtzcGFjZSB9IGZyb20gXCIuL3JlbG9hZC13b3Jrc3BhY2VcIjtcbmltcG9ydCB7IGZpbHRlciB9IGZyb20gXCJsb2Rhc2hcIjtcbmNsYXNzIENvZGVDaGVjayB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuZGlzcGxheURpYWdub3N0aWNzID0gW107XG4gICAgICAgIHRoaXMuc2VsZWN0ZWRJbmRleCA9IDA7XG4gICAgICAgIHRoaXMuc2Nyb2xsVG9wID0gMDtcbiAgICAgICAgdGhpcy5fd2luZG93ID0gbmV3IENvZGVDaGVja091dHB1dEVsZW1lbnQ7XG4gICAgICAgIHRoaXMucmVxdWlyZWQgPSB0cnVlO1xuICAgICAgICB0aGlzLnRpdGxlID0gXCJEaWFnbm9zdGljc1wiO1xuICAgICAgICB0aGlzLmRlc2NyaXB0aW9uID0gXCJTdXBwb3J0IGZvciBkaWFnbm9zdGljIGVycm9ycy5cIjtcbiAgICB9XG4gICAgYWN0aXZhdGUoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIHRoaXMuX2Z1bGxDb2RlQ2hlY2sgPSBuZXcgU3ViamVjdCgpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKHRoaXMuX2Z1bGxDb2RlQ2hlY2spO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTpuZXh0LWRpYWdub3N0aWNcIiwgKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5fd2luZG93Lm5leHQoKTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTpnby10by1kaWFnbm9zdGljXCIsICgpID0+IHtcbiAgICAgICAgICAgIE9tbmkubmF2aWdhdGVUbyh0aGlzLl93aW5kb3cuY3VycmVudCk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwib21uaXNoYXJwLWF0b206cHJldmlvdXMtZGlhZ25vc3RpY1wiLCAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLl93aW5kb3cucHJldigpO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcIm9tbmlzaGFycC1hdG9tOmdvLXRvLW5leHQtZGlhZ25vc3RpY1wiLCAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLl93aW5kb3cubmV4dCgpO1xuICAgICAgICAgICAgT21uaS5uYXZpZ2F0ZVRvKHRoaXMuX3dpbmRvdy5jdXJyZW50KTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTpnby10by1wcmV2aW91cy1kaWFnbm9zdGljXCIsICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuX3dpbmRvdy5wcmV2KCk7XG4gICAgICAgICAgICBPbW5pLm5hdmlnYXRlVG8odGhpcy5fd2luZG93LmN1cnJlbnQpO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5kaWFnbm9zdGljc1xuICAgICAgICAgICAgLnN1YnNjcmliZShkaWFnbm9zdGljcyA9PiB7XG4gICAgICAgICAgICB0aGlzLmRpc3BsYXlEaWFnbm9zdGljcyA9IHRoaXMuZmlsdGVyT25seVdhcm5pbmdzQW5kRXJyb3JzKGRpYWdub3N0aWNzKTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuZGlhZ25vc3RpY3Muc3Vic2NyaWJlKHMgPT4ge1xuICAgICAgICAgICAgdGhpcy5zY3JvbGxUb3AgPSAwO1xuICAgICAgICAgICAgdGhpcy5zZWxlY3RlZEluZGV4ID0gMDtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuZGlhZ25vc3RpY3NcbiAgICAgICAgICAgIC5kZWxheSgxMDApXG4gICAgICAgICAgICAuc3Vic2NyaWJlKGRpYWdub3N0aWNzID0+IHRoaXMuX3dpbmRvdy51cGRhdGUoZGlhZ25vc3RpY3MpKSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoZG9jay5hZGRXaW5kb3coXCJlcnJvcnNcIiwgXCJFcnJvcnMgJiBXYXJuaW5nc1wiLCB0aGlzLl93aW5kb3cpKTtcbiAgICAgICAgbGV0IHN0YXJ0ZWQgPSAwLCBmaW5pc2hlZCA9IDA7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT2JzZXJ2YWJsZS5jb21iaW5lTGF0ZXN0KE9tbmkubGlzdGVuZXIucGFja2FnZVJlc3RvcmVTdGFydGVkLm1hcCh4ID0+IHN0YXJ0ZWQrKyksIE9tbmkubGlzdGVuZXIucGFja2FnZVJlc3RvcmVGaW5pc2hlZC5tYXAoeCA9PiBmaW5pc2hlZCsrKSwgKHMsIGYpID0+IHMgPT09IGYpXG4gICAgICAgICAgICAuZmlsdGVyKHIgPT4gcilcbiAgICAgICAgICAgIC5kZWJvdW5jZVRpbWUoMjAwMClcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgICAgICAgc3RhcnRlZCA9IDA7XG4gICAgICAgICAgICBmaW5pc2hlZCA9IDA7XG4gICAgICAgICAgICB0aGlzLmRvRnVsbENvZGVDaGVjaygpO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5saXN0ZW5lci5wYWNrYWdlUmVzdG9yZUZpbmlzaGVkLmRlYm91bmNlVGltZSgzMDAwKS5zdWJzY3JpYmUoKCkgPT4gdGhpcy5kb0Z1bGxDb2RlQ2hlY2soKSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTpjb2RlLWNoZWNrXCIsICgpID0+IHRoaXMuZG9GdWxsQ29kZUNoZWNrKCkpKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZCh0aGlzLl9mdWxsQ29kZUNoZWNrXG4gICAgICAgICAgICAuY29uY2F0TWFwKCgpID0+IHJlbG9hZFdvcmtzcGFjZS5yZWxvYWRXb3Jrc3BhY2UoKVxuICAgICAgICAgICAgLnRvQXJyYXkoKVxuICAgICAgICAgICAgLmNvbmNhdE1hcCh4ID0+IE9tbmkuc29sdXRpb25zKVxuICAgICAgICAgICAgLmNvbmNhdE1hcChzb2x1dGlvbiA9PiBzb2x1dGlvbi53aGVuQ29ubmVjdGVkKClcbiAgICAgICAgICAgIC5kbygoKSA9PiBzb2x1dGlvbi5kaWFnbm9zdGljcyh7IEZpbGVOYW1lOiBudWxsIH0pKSkpXG4gICAgICAgICAgICAuc3Vic2NyaWJlKCkpO1xuICAgICAgICBPbW5pLnJlZ2lzdGVyQ29uZmlndXJhdGlvbihzb2x1dGlvbiA9PiBzb2x1dGlvblxuICAgICAgICAgICAgLndoZW5Db25uZWN0ZWQoKVxuICAgICAgICAgICAgLmRlbGF5KDEwMDApXG4gICAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHRoaXMuX2Z1bGxDb2RlQ2hlY2submV4dCh0cnVlKSkpO1xuICAgIH1cbiAgICBkb0Z1bGxDb2RlQ2hlY2soKSB7XG4gICAgICAgIHRoaXMuX2Z1bGxDb2RlQ2hlY2submV4dCh0cnVlKTtcbiAgICB9XG4gICAgZmlsdGVyT25seVdhcm5pbmdzQW5kRXJyb3JzKHF1aWNrRml4ZXMpIHtcbiAgICAgICAgcmV0dXJuIGZpbHRlcihxdWlja0ZpeGVzLCB4ID0+IHguTG9nTGV2ZWwgIT09IFwiSGlkZGVuXCIpO1xuICAgIH1cbiAgICBkaXNwb3NlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgIH1cbn1cbmV4cG9ydCBjb25zdCBjb2RlQ2hlY2sgPSBuZXcgQ29kZUNoZWNrO1xuIiwiaW1wb3J0IHtNb2RlbHN9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XHJcbmltcG9ydCB7T2JzZXJ2YWJsZSwgU3ViamVjdH0gZnJvbSBcInJ4anNcIjtcclxuaW1wb3J0IHtDb21wb3NpdGVEaXNwb3NhYmxlfSBmcm9tIFwidHMtZGlzcG9zYWJsZXNcIjtcclxuaW1wb3J0IHtPbW5pfSBmcm9tIFwiLi4vc2VydmVyL29tbmlcIjtcclxuaW1wb3J0IHtkb2NrfSBmcm9tIFwiLi4vYXRvbS9kb2NrXCI7XHJcbmltcG9ydCB7Q29kZUNoZWNrT3V0cHV0RWxlbWVudH0gZnJvbSBcIi4uL3ZpZXdzL2NvZGVjaGVjay1vdXRwdXQtcGFuZS12aWV3XCI7XHJcbmltcG9ydCB7cmVsb2FkV29ya3NwYWNlfSBmcm9tIFwiLi9yZWxvYWQtd29ya3NwYWNlXCI7XHJcbmltcG9ydCB7ZmlsdGVyfSBmcm9tIFwibG9kYXNoXCI7XHJcblxyXG5jbGFzcyBDb2RlQ2hlY2sgaW1wbGVtZW50cyBJRmVhdHVyZSB7XHJcbiAgICBwcml2YXRlIGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XHJcblxyXG4gICAgcHVibGljIGRpc3BsYXlEaWFnbm9zdGljczogTW9kZWxzLkRpYWdub3N0aWNMb2NhdGlvbltdID0gW107XHJcbiAgICBwdWJsaWMgc2VsZWN0ZWRJbmRleDogbnVtYmVyID0gMDtcclxuICAgIHByaXZhdGUgc2Nyb2xsVG9wOiBudW1iZXIgPSAwO1xyXG4gICAgcHJpdmF0ZSBfZnVsbENvZGVDaGVjazogU3ViamVjdDxhbnk+O1xyXG4gICAgcHJpdmF0ZSBfd2luZG93ID0gbmV3IENvZGVDaGVja091dHB1dEVsZW1lbnQ7XHJcblxyXG4gICAgcHVibGljIGFjdGl2YXRlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcblxyXG4gICAgICAgIHRoaXMuX2Z1bGxDb2RlQ2hlY2sgPSBuZXcgU3ViamVjdDxhbnk+KCk7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZCh0aGlzLl9mdWxsQ29kZUNoZWNrKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwib21uaXNoYXJwLWF0b206bmV4dC1kaWFnbm9zdGljXCIsICgpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5fd2luZG93Lm5leHQoKTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcIm9tbmlzaGFycC1hdG9tOmdvLXRvLWRpYWdub3N0aWNcIiwgKCkgPT4ge1xyXG4gICAgICAgICAgICBPbW5pLm5hdmlnYXRlVG8odGhpcy5fd2luZG93LmN1cnJlbnQpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwib21uaXNoYXJwLWF0b206cHJldmlvdXMtZGlhZ25vc3RpY1wiLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuX3dpbmRvdy5wcmV2KCk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTpnby10by1uZXh0LWRpYWdub3N0aWNcIiwgKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLl93aW5kb3cubmV4dCgpO1xyXG4gICAgICAgICAgICBPbW5pLm5hdmlnYXRlVG8odGhpcy5fd2luZG93LmN1cnJlbnQpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwib21uaXNoYXJwLWF0b206Z28tdG8tcHJldmlvdXMtZGlhZ25vc3RpY1wiLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuX3dpbmRvdy5wcmV2KCk7XHJcbiAgICAgICAgICAgIE9tbmkubmF2aWdhdGVUbyh0aGlzLl93aW5kb3cuY3VycmVudCk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuZGlhZ25vc3RpY3NcclxuICAgICAgICAgICAgLnN1YnNjcmliZShkaWFnbm9zdGljcyA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRpc3BsYXlEaWFnbm9zdGljcyA9IHRoaXMuZmlsdGVyT25seVdhcm5pbmdzQW5kRXJyb3JzKGRpYWdub3N0aWNzKTtcclxuICAgICAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuZGlhZ25vc3RpY3Muc3Vic2NyaWJlKHMgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLnNjcm9sbFRvcCA9IDA7XHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWRJbmRleCA9IDA7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuZGlhZ25vc3RpY3NcclxuICAgICAgICAgICAgLmRlbGF5KDEwMClcclxuICAgICAgICAgICAgLnN1YnNjcmliZShkaWFnbm9zdGljcyA9PiB0aGlzLl93aW5kb3cudXBkYXRlKGRpYWdub3N0aWNzKSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGRvY2suYWRkV2luZG93KFwiZXJyb3JzXCIsIFwiRXJyb3JzICYgV2FybmluZ3NcIiwgdGhpcy5fd2luZG93KSk7XHJcblxyXG4gICAgICAgIGxldCBzdGFydGVkID0gMCwgZmluaXNoZWQgPSAwO1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT2JzZXJ2YWJsZS5jb21iaW5lTGF0ZXN0KFxyXG4gICAgICAgICAgICBPbW5pLmxpc3RlbmVyLnBhY2thZ2VSZXN0b3JlU3RhcnRlZC5tYXAoeCA9PiBzdGFydGVkKyspLFxyXG4gICAgICAgICAgICBPbW5pLmxpc3RlbmVyLnBhY2thZ2VSZXN0b3JlRmluaXNoZWQubWFwKHggPT4gZmluaXNoZWQrKyksXHJcbiAgICAgICAgICAgIChzLCBmKSA9PiBzID09PSBmKVxyXG4gICAgICAgICAgICAuZmlsdGVyKHIgPT4gcilcclxuICAgICAgICAgICAgLmRlYm91bmNlVGltZSgyMDAwKVxyXG4gICAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHtcclxuICAgICAgICAgICAgICAgIHN0YXJ0ZWQgPSAwO1xyXG4gICAgICAgICAgICAgICAgZmluaXNoZWQgPSAwO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kb0Z1bGxDb2RlQ2hlY2soKTtcclxuICAgICAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkubGlzdGVuZXIucGFja2FnZVJlc3RvcmVGaW5pc2hlZC5kZWJvdW5jZVRpbWUoMzAwMCkuc3Vic2NyaWJlKCgpID0+IHRoaXMuZG9GdWxsQ29kZUNoZWNrKCkpKTtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTpjb2RlLWNoZWNrXCIsICgpID0+IHRoaXMuZG9GdWxsQ29kZUNoZWNrKCkpKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZCh0aGlzLl9mdWxsQ29kZUNoZWNrXHJcbiAgICAgICAgICAgIC5jb25jYXRNYXAoKCkgPT4gcmVsb2FkV29ya3NwYWNlLnJlbG9hZFdvcmtzcGFjZSgpXHJcbiAgICAgICAgICAgICAgICAudG9BcnJheSgpXHJcbiAgICAgICAgICAgICAgICAuY29uY2F0TWFwKHggPT4gT21uaS5zb2x1dGlvbnMpXHJcbiAgICAgICAgICAgICAgICAuY29uY2F0TWFwKHNvbHV0aW9uID0+IHNvbHV0aW9uLndoZW5Db25uZWN0ZWQoKVxyXG4gICAgICAgICAgICAgICAgICAgIC5kbygoKSA9PiBzb2x1dGlvbi5kaWFnbm9zdGljcyh7IEZpbGVOYW1lOiBudWxsIH0pKSlcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAuc3Vic2NyaWJlKCkpO1xyXG5cclxuICAgICAgICBPbW5pLnJlZ2lzdGVyQ29uZmlndXJhdGlvbihzb2x1dGlvbiA9PiBzb2x1dGlvblxyXG4gICAgICAgICAgICAud2hlbkNvbm5lY3RlZCgpXHJcbiAgICAgICAgICAgIC5kZWxheSgxMDAwKVxyXG4gICAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHRoaXMuX2Z1bGxDb2RlQ2hlY2submV4dCh0cnVlKSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkb0Z1bGxDb2RlQ2hlY2soKSB7XHJcbiAgICAgICAgdGhpcy5fZnVsbENvZGVDaGVjay5uZXh0KHRydWUpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBmaWx0ZXJPbmx5V2FybmluZ3NBbmRFcnJvcnMocXVpY2tGaXhlczogTW9kZWxzLkRpYWdub3N0aWNMb2NhdGlvbltdKTogTW9kZWxzLkRpYWdub3N0aWNMb2NhdGlvbltdIHtcclxuICAgICAgICByZXR1cm4gZmlsdGVyKHF1aWNrRml4ZXMsIHggPT4geC5Mb2dMZXZlbCAhPT0gXCJIaWRkZW5cIik7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVxdWlyZWQgPSB0cnVlO1xyXG4gICAgcHVibGljIHRpdGxlID0gXCJEaWFnbm9zdGljc1wiO1xyXG4gICAgcHVibGljIGRlc2NyaXB0aW9uID0gXCJTdXBwb3J0IGZvciBkaWFnbm9zdGljIGVycm9ycy5cIjtcclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IGNvZGVDaGVjayA9IG5ldyBDb2RlQ2hlY2s7XHJcbiJdfQ==
