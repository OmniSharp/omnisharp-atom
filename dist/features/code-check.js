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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9jb2RlLWNoZWNrLmpzIiwibGliL2ZlYXR1cmVzL2NvZGUtY2hlY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7SUNHQSxTO0FBQUEseUJBQUE7QUFBQTs7QUFHVyxhQUFBLGtCQUFBLEdBQWtELEVBQWxEO0FBQ0EsYUFBQSxhQUFBLEdBQXdCLENBQXhCO0FBQ0MsYUFBQSxTQUFBLEdBQW9CLENBQXBCO0FBRUEsYUFBQSxPQUFBLEdBQVUscURBQVY7QUF5RkQsYUFBQSxRQUFBLEdBQVcsSUFBWDtBQUNBLGFBQUEsS0FBQSxHQUFRLGFBQVI7QUFDQSxhQUFBLFdBQUEsR0FBYyxnQ0FBZDtBQUNWOzs7O21DQTFGa0I7QUFBQTs7QUFDWCxpQkFBSyxVQUFMLEdBQWtCLDBDQUFsQjtBQUVBLGlCQUFLLGNBQUwsR0FBc0IsbUJBQXRCO0FBQ0EsaUJBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQixLQUFLLGNBQXpCO0FBRUEsaUJBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQixLQUFLLFFBQUwsQ0FBYyxHQUFkLENBQWtCLGdCQUFsQixFQUFvQyxnQ0FBcEMsRUFBc0UsWUFBQTtBQUN0RixzQkFBSyxPQUFMLENBQWEsSUFBYjtBQUNILGFBRm1CLENBQXBCO0FBSUEsaUJBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQixLQUFLLFFBQUwsQ0FBYyxHQUFkLENBQWtCLGdCQUFsQixFQUFvQyxpQ0FBcEMsRUFBdUUsWUFBQTtBQUN2RiwyQkFBSyxVQUFMLENBQWdCLE1BQUssT0FBTCxDQUFhLE9BQTdCO0FBQ0gsYUFGbUIsQ0FBcEI7QUFJQSxpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLEtBQUssUUFBTCxDQUFjLEdBQWQsQ0FBa0IsZ0JBQWxCLEVBQW9DLG9DQUFwQyxFQUEwRSxZQUFBO0FBQzFGLHNCQUFLLE9BQUwsQ0FBYSxJQUFiO0FB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LFdBQVQsQ0FBcUIsRUFBRSxVQUFVLElBQVosRUFBckIsQ0FBTjtBQUFBLHFCQURlLENBQVo7QUFBQSxpQkFIRSxDQUFOO0FBQUEsYUFESyxFQU9mLFNBUGUsRUFBcEI7QUFTQSx1QkFBSyxxQkFBTCxDQUEyQjtBQUFBLHVCQUFZLFNBQ2xDLGFBRGtDLEdBRWxDLEtBRmtDLENBRTVCLElBRjRCLEVBR2xDLFNBSGtDLENBR3hCO0FBQUEsMkJBQU0sTUFBSyxjQUFMLENBQW9CLElBQXBCLENBQXlCLElBQXpCLENBQU47QUFBQSxpQkFId0IsQ0FBWjtBQUFBLGFBQTNCO0FBSUg7OzswQ0FFcUI7QUFDbEIsaUJBQUssY0FBTCxDQUFvQixJQUFwQixDQUF5QixJQUF6QjtBQUNIOzs7b0RBRWtDLFUsRUFBdUM7QUFDdEUsbUJBQU8sb0JBQU8sVUFBUCxFQUFtQjtBQUFBLHVCQUFLLEVBQUUsUUFBRixLQUFlLFFBQXBCO0FBQUEsYUFBbkIsQ0FBUDtBQUNIOzs7a0NBRWE7QUFDVixpQkFBSyxVQUFMLENBQWdCLE9BQWhCO0FBQ0g7Ozs7OztBQU9FLElBQU0sZ0NBQVksSUFBSSxTQUFKLEVBQWxCIiwiZmlsZSI6ImxpYi9mZWF0dXJlcy9jb2RlLWNoZWNrLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgT2JzZXJ2YWJsZSwgU3ViamVjdCB9IGZyb20gXCJyeGpzXCI7XG5pbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlIH0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcbmltcG9ydCB7IE9tbmkgfSBmcm9tIFwiLi4vc2VydmVyL29tbmlcIjtcbmltcG9ydCB7IGRvY2sgfSBmcm9tIFwiLi4vYXRvbS9kb2NrXCI7XG5pbXBvcnQgeyBDb2RlQ2hlY2tPdXRwdXRFbGVtZW50IH0gZnJvbSBcIi4uL3ZpZXdzL2NvZGVjaGVjay1vdXRwdXQtcGFuZS12aWV3XCI7XG5pbXBvcnQgeyByZWxvYWRXb3Jrc3BhY2UgfSBmcm9tIFwiLi9yZWxvYWQtd29ya3NwYWNlXCI7XG5pbXBvcnQgeyBmaWx0ZXIgfSBmcm9tIFwibG9kYXNoXCI7XG5jbGFzcyBDb2RlQ2hlY2sge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmRpc3BsYXlEaWFnbm9zdGljcyA9IFtdO1xuICAgICAgICB0aGlzLnNlbGVjdGVkSW5kZXggPSAwO1xuICAgICAgICB0aGlzLnNjcm9sbFRvcCA9IDA7XG4gICAgICAgIHRoaXMuX3dpbmRvdyA9IG5ldyBDb2RlQ2hlY2tPdXRwdXRFbGVtZW50O1xuICAgICAgICB0aGlzLnJlcXVpcmVkID0gdHJ1ZTtcbiAgICAgICAgdGhpcy50aXRsZSA9IFwiRGlhZ25vc3RpY3NcIjtcbiAgICAgICAgdGhpcy5kZXNjcmlwdGlvbiA9IFwiU3VwcG9ydCBmb3IgZGlhZ25vc3RpYyBlcnJvcnMuXCI7XG4gICAgfVxuICAgIGFjdGl2YXRlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICB0aGlzLl9mdWxsQ29kZUNoZWNrID0gbmV3IFN1YmplY3QoKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZCh0aGlzLl9mdWxsQ29kZUNoZWNrKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwib21uaXNoYXJwLWF0b206bmV4dC1kaWFnbm9zdGljXCIsICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuX3dpbmRvdy5uZXh0KCk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwib21uaXNoYXJwLWF0b206Z28tdG8tZGlhZ25vc3RpY1wiLCAoKSA9PiB7XG4gICAgICAgICAgICBPbW5pLm5hdmlnYXRlVG8odGhpcy5fd2luZG93LmN1cnJlbnQpO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcIm9tbmlzaGFycC1hdG9tOnByZXZpb3VzLWRpYWdub3N0aWNcIiwgKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5fd2luZG93LnByZXYoKTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTpnby10by1uZXh0LWRpYWdub3N0aWNcIiwgKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5fd2luZG93Lm5leHQoKTtcbiAgICAgICAgICAgIE9tbmkubmF2aWdhdGVUbyh0aGlzLl93aW5kb3cuY3VycmVudCk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwib21uaXNoYXJwLWF0b206Z28tdG8tcHJldmlvdXMtZGlhZ25vc3RpY1wiLCAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLl93aW5kb3cucHJldigpO1xuICAgICAgICAgICAgT21uaS5uYXZpZ2F0ZVRvKHRoaXMuX3dpbmRvdy5jdXJyZW50KTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuZGlhZ25vc3RpY3NcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoZGlhZ25vc3RpY3MgPT4ge1xuICAgICAgICAgICAgdGhpcy5kaXNwbGF5RGlhZ25vc3RpY3MgPSB0aGlzLmZpbHRlck9ubHlXYXJuaW5nc0FuZEVycm9ycyhkaWFnbm9zdGljcyk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmRpYWdub3N0aWNzLnN1YnNjcmliZShzID0+IHtcbiAgICAgICAgICAgIHRoaXMuc2Nyb2xsVG9wID0gMDtcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWRJbmRleCA9IDA7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmRpYWdub3N0aWNzXG4gICAgICAgICAgICAuZGVsYXkoMTAwKVxuICAgICAgICAgICAgLnN1YnNjcmliZShkaWFnbm9zdGljcyA9PiB0aGlzLl93aW5kb3cudXBkYXRlKGRpYWdub3N0aWNzKSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGRvY2suYWRkV2luZG93KFwiZXJyb3JzXCIsIFwiRXJyb3JzICYgV2FybmluZ3NcIiwgdGhpcy5fd2luZG93KSk7XG4gICAgICAgIGxldCBzdGFydGVkID0gMCwgZmluaXNoZWQgPSAwO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9ic2VydmFibGUuY29tYmluZUxhdGVzdChPbW5pLmxpc3RlbmVyLnBhY2thZ2VSZXN0b3JlU3RhcnRlZC5tYXAoeCA9PiBzdGFydGVkKyspLCBPbW5pLmxpc3RlbmVyLnBhY2thZ2VSZXN0b3JlRmluaXNoZWQubWFwKHggPT4gZmluaXNoZWQrKyksIChzLCBmKSA9PiBzID09PSBmKVxuICAgICAgICAgICAgLmZpbHRlcihyID0+IHIpXG4gICAgICAgICAgICAuZGVib3VuY2VUaW1lKDIwMDApXG4gICAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgICAgIHN0YXJ0ZWQgPSAwO1xuICAgICAgICAgICAgZmluaXNoZWQgPSAwO1xuICAgICAgICAgICAgdGhpcy5kb0Z1bGxDb2RlQ2hlY2soKTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkubGlzdGVuZXIucGFja2FnZVJlc3RvcmVGaW5pc2hlZC5kZWJvdW5jZVRpbWUoMzAwMCkuc3Vic2NyaWJlKCgpID0+IHRoaXMuZG9GdWxsQ29kZUNoZWNrKCkpKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwib21uaXNoYXJwLWF0b206Y29kZS1jaGVja1wiLCAoKSA9PiB0aGlzLmRvRnVsbENvZGVDaGVjaygpKSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQodGhpcy5fZnVsbENvZGVDaGVja1xuICAgICAgICAgICAgLmNvbmNhdE1hcCgoKSA9PiByZWxvYWRXb3Jrc3BhY2UucmVsb2FkV29ya3NwYWNlKClcbiAgICAgICAgICAgIC50b0FycmF5KClcbiAgICAgICAgICAgIC5jb25jYXRNYXAoeCA9PiBPbW5pLnNvbHV0aW9ucylcbiAgICAgICAgICAgIC5jb25jYXRNYXAoc29sdXRpb24gPT4gc29sdXRpb24ud2hlbkNvbm5lY3RlZCgpXG4gICAgICAgICAgICAuZG8oKCkgPT4gc29sdXRpb24uZGlhZ25vc3RpY3MoeyBGaWxlTmFtZTogbnVsbCB9KSkpKVxuICAgICAgICAgICAgLnN1YnNjcmliZSgpKTtcbiAgICAgICAgT21uaS5yZWdpc3RlckNvbmZpZ3VyYXRpb24oc29sdXRpb24gPT4gc29sdXRpb25cbiAgICAgICAgICAgIC53aGVuQ29ubmVjdGVkKClcbiAgICAgICAgICAgIC5kZWxheSgxMDAwKVxuICAgICAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB0aGlzLl9mdWxsQ29kZUNoZWNrLm5leHQodHJ1ZSkpKTtcbiAgICB9XG4gICAgZG9GdWxsQ29kZUNoZWNrKCkge1xuICAgICAgICB0aGlzLl9mdWxsQ29kZUNoZWNrLm5leHQodHJ1ZSk7XG4gICAgfVxuICAgIGZpbHRlck9ubHlXYXJuaW5nc0FuZEVycm9ycyhxdWlja0ZpeGVzKSB7XG4gICAgICAgIHJldHVybiBmaWx0ZXIocXVpY2tGaXhlcywgeCA9PiB4LkxvZ0xldmVsICE9PSBcIkhpZGRlblwiKTtcbiAgICB9XG4gICAgZGlzcG9zZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICB9XG59XG5leHBvcnQgY29uc3QgY29kZUNoZWNrID0gbmV3IENvZGVDaGVjaztcbiIsImltcG9ydCB7TW9kZWxzfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xyXG5pbXBvcnQge09ic2VydmFibGUsIFN1YmplY3R9IGZyb20gXCJyeGpzXCI7XHJcbmltcG9ydCB7Q29tcG9zaXRlRGlzcG9zYWJsZX0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcclxuaW1wb3J0IHtPbW5pfSBmcm9tIFwiLi4vc2VydmVyL29tbmlcIjtcclxuaW1wb3J0IHtkb2NrfSBmcm9tIFwiLi4vYXRvbS9kb2NrXCI7XHJcbmltcG9ydCB7Q29kZUNoZWNrT3V0cHV0RWxlbWVudH0gZnJvbSBcIi4uL3ZpZXdzL2NvZGVjaGVjay1vdXRwdXQtcGFuZS12aWV3XCI7XHJcbmltcG9ydCB7cmVsb2FkV29ya3NwYWNlfSBmcm9tIFwiLi9yZWxvYWQtd29ya3NwYWNlXCI7XHJcbmltcG9ydCB7ZmlsdGVyfSBmcm9tIFwibG9kYXNoXCI7XHJcblxyXG5jbGFzcyBDb2RlQ2hlY2sgaW1wbGVtZW50cyBJRmVhdHVyZSB7XHJcbiAgICBwcml2YXRlIGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XHJcblxyXG4gICAgcHVibGljIGRpc3BsYXlEaWFnbm9zdGljczogTW9kZWxzLkRpYWdub3N0aWNMb2NhdGlvbltdID0gW107XHJcbiAgICBwdWJsaWMgc2VsZWN0ZWRJbmRleDogbnVtYmVyID0gMDtcclxuICAgIHByaXZhdGUgc2Nyb2xsVG9wOiBudW1iZXIgPSAwO1xyXG4gICAgcHJpdmF0ZSBfZnVsbENvZGVDaGVjazogU3ViamVjdDxhbnk+O1xyXG4gICAgcHJpdmF0ZSBfd2luZG93ID0gbmV3IENvZGVDaGVja091dHB1dEVsZW1lbnQ7XHJcblxyXG4gICAgcHVibGljIGFjdGl2YXRlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcblxyXG4gICAgICAgIHRoaXMuX2Z1bGxDb2RlQ2hlY2sgPSBuZXcgU3ViamVjdDxhbnk+KCk7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZCh0aGlzLl9mdWxsQ29kZUNoZWNrKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwib21uaXNoYXJwLWF0b206bmV4dC1kaWFnbm9zdGljXCIsICgpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5fd2luZG93Lm5leHQoKTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcIm9tbmlzaGFycC1hdG9tOmdvLXRvLWRpYWdub3N0aWNcIiwgKCkgPT4ge1xyXG4gICAgICAgICAgICBPbW5pLm5hdmlnYXRlVG8odGhpcy5fd2luZG93LmN1cnJlbnQpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwib21uaXNoYXJwLWF0b206cHJldmlvdXMtZGlhZ25vc3RpY1wiLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuX3dpbmRvdy5wcmV2KCk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTpnby10by1uZXh0LWRpYWdub3N0aWNcIiwgKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLl93aW5kb3cubmV4dCgpO1xyXG4gICAgICAgICAgICBPbW5pLm5hdmlnYXRlVG8odGhpcy5fd2luZG93LmN1cnJlbnQpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwib21uaXNoYXJwLWF0b206Z28tdG8tcHJldmlvdXMtZGlhZ25vc3RpY1wiLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuX3dpbmRvdy5wcmV2KCk7XHJcbiAgICAgICAgICAgIE9tbmkubmF2aWdhdGVUbyh0aGlzLl93aW5kb3cuY3VycmVudCk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuZGlhZ25vc3RpY3NcclxuICAgICAgICAgICAgLnN1YnNjcmliZShkaWFnbm9zdGljcyA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRpc3BsYXlEaWFnbm9zdGljcyA9IHRoaXMuZmlsdGVyT25seVdhcm5pbmdzQW5kRXJyb3JzKGRpYWdub3N0aWNzKTtcclxuICAgICAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuZGlhZ25vc3RpY3Muc3Vic2NyaWJlKHMgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLnNjcm9sbFRvcCA9IDA7XHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWRJbmRleCA9IDA7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuZGlhZ25vc3RpY3NcclxuICAgICAgICAgICAgLmRlbGF5KDEwMClcclxuICAgICAgICAgICAgLnN1YnNjcmliZShkaWFnbm9zdGljcyA9PiB0aGlzLl93aW5kb3cudXBkYXRlKGRpYWdub3N0aWNzKSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGRvY2suYWRkV2luZG93KFwiZXJyb3JzXCIsIFwiRXJyb3JzICYgV2FybmluZ3NcIiwgdGhpcy5fd2luZG93KSk7XHJcblxyXG4gICAgICAgIGxldCBzdGFydGVkID0gMCwgZmluaXNoZWQgPSAwO1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT2JzZXJ2YWJsZS5jb21iaW5lTGF0ZXN0KFxyXG4gICAgICAgICAgICBPbW5pLmxpc3RlbmVyLnBhY2thZ2VSZXN0b3JlU3RhcnRlZC5tYXAoeCA9PiBzdGFydGVkKyspLFxyXG4gICAgICAgICAgICBPbW5pLmxpc3RlbmVyLnBhY2thZ2VSZXN0b3JlRmluaXNoZWQubWFwKHggPT4gZmluaXNoZWQrKyksXHJcbiAgICAgICAgICAgIChzLCBmKSA9PiBzID09PSBmKVxyXG4gICAgICAgICAgICAuZmlsdGVyKHIgPT4gcilcclxuICAgICAgICAgICAgLmRlYm91bmNlVGltZSgyMDAwKVxyXG4gICAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHtcclxuICAgICAgICAgICAgICAgIHN0YXJ0ZWQgPSAwO1xyXG4gICAgICAgICAgICAgICAgZmluaXNoZWQgPSAwO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kb0Z1bGxDb2RlQ2hlY2soKTtcclxuICAgICAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkubGlzdGVuZXIucGFja2FnZVJlc3RvcmVGaW5pc2hlZC5kZWJvdW5jZVRpbWUoMzAwMCkuc3Vic2NyaWJlKCgpID0+IHRoaXMuZG9GdWxsQ29kZUNoZWNrKCkpKTtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTpjb2RlLWNoZWNrXCIsICgpID0+IHRoaXMuZG9GdWxsQ29kZUNoZWNrKCkpKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZCh0aGlzLl9mdWxsQ29kZUNoZWNrXHJcbiAgICAgICAgICAgIC5jb25jYXRNYXAoKCkgPT4gcmVsb2FkV29ya3NwYWNlLnJlbG9hZFdvcmtzcGFjZSgpXHJcbiAgICAgICAgICAgICAgICAudG9BcnJheSgpXHJcbiAgICAgICAgICAgICAgICAuY29uY2F0TWFwKHggPT4gT21uaS5zb2x1dGlvbnMpXHJcbiAgICAgICAgICAgICAgICAuY29uY2F0TWFwKHNvbHV0aW9uID0+IHNvbHV0aW9uLndoZW5Db25uZWN0ZWQoKVxyXG4gICAgICAgICAgICAgICAgICAgIC5kbygoKSA9PiBzb2x1dGlvbi5kaWFnbm9zdGljcyh7IEZpbGVOYW1lOiBudWxsIH0pKSlcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAuc3Vic2NyaWJlKCkpO1xyXG5cclxuICAgICAgICBPbW5pLnJlZ2lzdGVyQ29uZmlndXJhdGlvbihzb2x1dGlvbiA9PiBzb2x1dGlvblxyXG4gICAgICAgICAgICAud2hlbkNvbm5lY3RlZCgpXHJcbiAgICAgICAgICAgIC5kZWxheSgxMDAwKVxyXG4gICAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHRoaXMuX2Z1bGxDb2RlQ2hlY2submV4dCh0cnVlKSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkb0Z1bGxDb2RlQ2hlY2soKSB7XHJcbiAgICAgICAgdGhpcy5fZnVsbENvZGVDaGVjay5uZXh0KHRydWUpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBmaWx0ZXJPbmx5V2FybmluZ3NBbmRFcnJvcnMocXVpY2tGaXhlczogTW9kZWxzLkRpYWdub3N0aWNMb2NhdGlvbltdKTogTW9kZWxzLkRpYWdub3N0aWNMb2NhdGlvbltdIHtcclxuICAgICAgICByZXR1cm4gZmlsdGVyKHF1aWNrRml4ZXMsIHggPT4geC5Mb2dMZXZlbCAhPT0gXCJIaWRkZW5cIik7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVxdWlyZWQgPSB0cnVlO1xyXG4gICAgcHVibGljIHRpdGxlID0gXCJEaWFnbm9zdGljc1wiO1xyXG4gICAgcHVibGljIGRlc2NyaXB0aW9uID0gXCJTdXBwb3J0IGZvciBkaWFnbm9zdGljIGVycm9ycy5cIjtcclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IGNvZGVDaGVjayA9IG5ldyBDb2RlQ2hlY2s7XHJcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
