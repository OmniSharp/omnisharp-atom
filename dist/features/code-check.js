'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.codeCheck = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _rxjs = require('rxjs');

var _tsDisposables = require('ts-disposables');

var _dock = require('../atom/dock');

var _omni = require('../server/omni');

var _codecheckOutputPaneView = require('../views/codecheck-output-pane-view');

var _reloadWorkspace = require('./reload-workspace');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var CodeCheck = function () {
    function CodeCheck() {
        _classCallCheck(this, CodeCheck);

        this.displayDiagnostics = [];
        this.selectedIndex = 0;
        this.scrollTop = 0;
        this._window = new _codecheckOutputPaneView.CodeCheckOutputElement();
        this.required = true;
        this.title = 'Diagnostics';
        this.description = 'Support for diagnostic errors.';
    }

    _createClass(CodeCheck, [{
        key: 'activate',
        value: function activate() {
            var _this = this;

            this.disposable = new _tsDisposables.CompositeDisposable();
            this._fullCodeCheck = new _rxjs.Subject();
            this.disposable.add(this._fullCodeCheck);
            this.disposable.add(atom.commands.add('atom-workspace', 'omnisharp-atom:next-diagnostic', function () {
                _this._window.next();
            }));
            this.disposable.add(atom.commands.add('atom-workspace', 'omnisharp-atom:go-to-diagnostic', function () {
                _omni.Omni.navigateTo(_this._window.current);
            }));
            this.disposable.add(atom.commands.add('atom-workspace', 'omnisharp-atom:previous-diagnostic', function () {
                _this._window.prev();
            }));
            this.disposable.add(atom.commands.add('atom-workspace', 'omnisharp-atom:go-to-next-diagnostic', function () {
                _this._window.next();
                _omni.Omni.navigateTo(_this._window.current);
            }));
            this.disposable.add(atom.commands.add('atom-workspace', 'omnisharp-atom:go-to-previous-diagnostic', function () {
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
            this.disposable.add(_dock.dock.addWindow('errors', 'Errors & Warnings', this._window));
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
            this.disposable.add(atom.commands.add('atom-workspace', 'omnisharp-atom:code-check', function () {
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
        key: 'doFullCodeCheck',
        value: function doFullCodeCheck() {
            this._fullCodeCheck.next(true);
        }
    }, {
        key: 'filterOnlyWarningsAndErrors',
        value: function filterOnlyWarningsAndErrors(quickFixes) {
            return (0, _lodash.filter)(quickFixes, function (x) {
                return x.LogLevel !== 'Hidden';
            });
        }
    }, {
        key: 'dispose',
        value: function dispose() {
            this.disposable.dispose();
        }
    }]);

    return CodeCheck;
}();

var codeCheck = exports.codeCheck = new CodeCheck();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9jb2RlLWNoZWNrLnRzIl0sIm5hbWVzIjpbIkNvZGVDaGVjayIsImRpc3BsYXlEaWFnbm9zdGljcyIsInNlbGVjdGVkSW5kZXgiLCJzY3JvbGxUb3AiLCJfd2luZG93IiwicmVxdWlyZWQiLCJ0aXRsZSIsImRlc2NyaXB0aW9uIiwiZGlzcG9zYWJsZSIsIl9mdWxsQ29kZUNoZWNrIiwiYWRkIiwiYXRvbSIsImNvbW1hbmRzIiwibmV4dCIsIm5hdmlnYXRlVG8iLCJjdXJyZW50IiwicHJldiIsImRpYWdub3N0aWNzIiwic3Vic2NyaWJlIiwiZmlsdGVyT25seVdhcm5pbmdzQW5kRXJyb3JzIiwiZGVsYXkiLCJ1cGRhdGUiLCJhZGRXaW5kb3ciLCJzdGFydGVkIiwiZmluaXNoZWQiLCJjb21iaW5lTGF0ZXN0IiwibGlzdGVuZXIiLCJwYWNrYWdlUmVzdG9yZVN0YXJ0ZWQiLCJtYXAiLCJwYWNrYWdlUmVzdG9yZUZpbmlzaGVkIiwicyIsImYiLCJmaWx0ZXIiLCJyIiwiZGVib3VuY2VUaW1lIiwiZG9GdWxsQ29kZUNoZWNrIiwiY29uY2F0TWFwIiwicmVsb2FkV29ya3NwYWNlIiwidG9BcnJheSIsInNvbHV0aW9ucyIsInNvbHV0aW9uIiwid2hlbkNvbm5lY3RlZCIsImRvIiwiRmlsZU5hbWUiLCJyZWdpc3RlckNvbmZpZ3VyYXRpb24iLCJxdWlja0ZpeGVzIiwieCIsIkxvZ0xldmVsIiwiZGlzcG9zZSIsImNvZGVDaGVjayJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0FBRUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7SUFFQUEsUztBQUFBLHlCQUFBO0FBQUE7O0FBR1csYUFBQUMsa0JBQUEsR0FBa0QsRUFBbEQ7QUFDQSxhQUFBQyxhQUFBLEdBQXdCLENBQXhCO0FBQ0MsYUFBQUMsU0FBQSxHQUFvQixDQUFwQjtBQUVBLGFBQUFDLE9BQUEsR0FBVSxxREFBVjtBQXlGRCxhQUFBQyxRQUFBLEdBQVcsSUFBWDtB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RjRCLEVBR2xDRixTQUhrQyxDQUd4QjtBQUFBLDJCQUFNLE1BQUtULGNBQUwsQ0FBb0JJLElBQXBCLENBQXlCLElBQXpCLENBQU47QUFBQSxpQkFId0IsQ0FBWjtBQUFBLGFBQTNCO0FBSUg7OzswQ0FFcUI7QUFDbEIsaUJBQUtKLGNBQUwsQ0FBb0JJLElBQXBCLENBQXlCLElBQXpCO0FBQ0g7OztvREFFa0NnQyxVLEVBQXVDO0FBQ3RFLG1CQUFPLG9CQUFPQSxVQUFQLEVBQW1CO0FBQUEsdUJBQUtDLEVBQUVDLFFBQUYsS0FBZSxRQUFwQjtBQUFBLGFBQW5CLENBQVA7QUFDSDs7O2tDQUVhO0FBQ1YsaUJBQUt2QyxVQUFMLENBQWdCd0MsT0FBaEI7QUFDSDs7Ozs7O0FBT0UsSUFBTUMsZ0NBQVksSUFBSWpELFNBQUosRUFBbEIiLCJmaWxlIjoibGliL2ZlYXR1cmVzL2NvZGUtY2hlY2suanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge2ZpbHRlcn0gZnJvbSAnbG9kYXNoJztcclxuaW1wb3J0IHtNb2RlbHN9IGZyb20gJ29tbmlzaGFycC1jbGllbnQnO1xyXG5pbXBvcnQge09ic2VydmFibGUsIFN1YmplY3R9IGZyb20gJ3J4anMnO1xyXG5pbXBvcnQge0NvbXBvc2l0ZURpc3Bvc2FibGV9IGZyb20gJ3RzLWRpc3Bvc2FibGVzJztcclxuaW1wb3J0IHtkb2NrfSBmcm9tICcuLi9hdG9tL2RvY2snO1xyXG5pbXBvcnQge09tbml9IGZyb20gJy4uL3NlcnZlci9vbW5pJztcclxuaW1wb3J0IHtDb2RlQ2hlY2tPdXRwdXRFbGVtZW50fSBmcm9tICcuLi92aWV3cy9jb2RlY2hlY2stb3V0cHV0LXBhbmUtdmlldyc7XHJcbmltcG9ydCB7cmVsb2FkV29ya3NwYWNlfSBmcm9tICcuL3JlbG9hZC13b3Jrc3BhY2UnO1xyXG5cclxuY2xhc3MgQ29kZUNoZWNrIGltcGxlbWVudHMgSUZlYXR1cmUge1xyXG4gICAgcHJpdmF0ZSBkaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xyXG5cclxuICAgIHB1YmxpYyBkaXNwbGF5RGlhZ25vc3RpY3M6IE1vZGVscy5EaWFnbm9zdGljTG9jYXRpb25bXSA9IFtdO1xyXG4gICAgcHVibGljIHNlbGVjdGVkSW5kZXg6IG51bWJlciA9IDA7XHJcbiAgICBwcml2YXRlIHNjcm9sbFRvcDogbnVtYmVyID0gMDtcclxuICAgIHByaXZhdGUgX2Z1bGxDb2RlQ2hlY2s6IFN1YmplY3Q8YW55PjtcclxuICAgIHByaXZhdGUgX3dpbmRvdyA9IG5ldyBDb2RlQ2hlY2tPdXRwdXRFbGVtZW50O1xyXG5cclxuICAgIHB1YmxpYyBhY3RpdmF0ZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG5cclxuICAgICAgICB0aGlzLl9mdWxsQ29kZUNoZWNrID0gbmV3IFN1YmplY3Q8YW55PigpO1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQodGhpcy5fZnVsbENvZGVDaGVjayk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoJ2F0b20td29ya3NwYWNlJywgJ29tbmlzaGFycC1hdG9tOm5leHQtZGlhZ25vc3RpYycsICgpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5fd2luZG93Lm5leHQoKTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoJ2F0b20td29ya3NwYWNlJywgJ29tbmlzaGFycC1hdG9tOmdvLXRvLWRpYWdub3N0aWMnLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIE9tbmkubmF2aWdhdGVUbyh0aGlzLl93aW5kb3cuY3VycmVudCk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKCdhdG9tLXdvcmtzcGFjZScsICdvbW5pc2hhcnAtYXRvbTpwcmV2aW91cy1kaWFnbm9zdGljJywgKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLl93aW5kb3cucHJldigpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZCgnYXRvbS13b3Jrc3BhY2UnLCAnb21uaXNoYXJwLWF0b206Z28tdG8tbmV4dC1kaWFnbm9zdGljJywgKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLl93aW5kb3cubmV4dCgpO1xyXG4gICAgICAgICAgICBPbW5pLm5hdmlnYXRlVG8odGhpcy5fd2luZG93LmN1cnJlbnQpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZCgnYXRvbS13b3Jrc3BhY2UnLCAnb21uaXNoYXJwLWF0b206Z28tdG8tcHJldmlvdXMtZGlhZ25vc3RpYycsICgpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5fd2luZG93LnByZXYoKTtcclxuICAgICAgICAgICAgT21uaS5uYXZpZ2F0ZVRvKHRoaXMuX3dpbmRvdy5jdXJyZW50KTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5kaWFnbm9zdGljc1xyXG4gICAgICAgICAgICAuc3Vic2NyaWJlKGRpYWdub3N0aWNzID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZGlzcGxheURpYWdub3N0aWNzID0gdGhpcy5maWx0ZXJPbmx5V2FybmluZ3NBbmRFcnJvcnMoZGlhZ25vc3RpY3MpO1xyXG4gICAgICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5kaWFnbm9zdGljcy5zdWJzY3JpYmUocyA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuc2Nyb2xsVG9wID0gMDtcclxuICAgICAgICAgICAgdGhpcy5zZWxlY3RlZEluZGV4ID0gMDtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5kaWFnbm9zdGljc1xyXG4gICAgICAgICAgICAuZGVsYXkoMTAwKVxyXG4gICAgICAgICAgICAuc3Vic2NyaWJlKGRpYWdub3N0aWNzID0+IHRoaXMuX3dpbmRvdy51cGRhdGUoZGlhZ25vc3RpY3MpKSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoZG9jay5hZGRXaW5kb3coJ2Vycm9ycycsICdFcnJvcnMgJiBXYXJuaW5ncycsIHRoaXMuX3dpbmRvdykpO1xyXG5cclxuICAgICAgICBsZXQgc3RhcnRlZCA9IDAsIGZpbmlzaGVkID0gMDtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9ic2VydmFibGUuY29tYmluZUxhdGVzdChcclxuICAgICAgICAgICAgT21uaS5saXN0ZW5lci5wYWNrYWdlUmVzdG9yZVN0YXJ0ZWQubWFwKHggPT4gc3RhcnRlZCsrKSxcclxuICAgICAgICAgICAgT21uaS5saXN0ZW5lci5wYWNrYWdlUmVzdG9yZUZpbmlzaGVkLm1hcCh4ID0+IGZpbmlzaGVkKyspLFxyXG4gICAgICAgICAgICAocywgZikgPT4gcyA9PT0gZilcclxuICAgICAgICAgICAgLmZpbHRlcihyID0+IHIpXHJcbiAgICAgICAgICAgIC5kZWJvdW5jZVRpbWUoMjAwMClcclxuICAgICAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBzdGFydGVkID0gMDtcclxuICAgICAgICAgICAgICAgIGZpbmlzaGVkID0gMDtcclxuICAgICAgICAgICAgICAgIHRoaXMuZG9GdWxsQ29kZUNoZWNrKCk7XHJcbiAgICAgICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmxpc3RlbmVyLnBhY2thZ2VSZXN0b3JlRmluaXNoZWQuZGVib3VuY2VUaW1lKDMwMDApLnN1YnNjcmliZSgoKSA9PiB0aGlzLmRvRnVsbENvZGVDaGVjaygpKSk7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZCgnYXRvbS13b3Jrc3BhY2UnLCAnb21uaXNoYXJwLWF0b206Y29kZS1jaGVjaycsICgpID0+IHRoaXMuZG9GdWxsQ29kZUNoZWNrKCkpKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZCh0aGlzLl9mdWxsQ29kZUNoZWNrXHJcbiAgICAgICAgICAgIC5jb25jYXRNYXAoKCkgPT4gcmVsb2FkV29ya3NwYWNlLnJlbG9hZFdvcmtzcGFjZSgpXHJcbiAgICAgICAgICAgICAgICAudG9BcnJheSgpXHJcbiAgICAgICAgICAgICAgICAuY29uY2F0TWFwKHggPT4gT21uaS5zb2x1dGlvbnMpXHJcbiAgICAgICAgICAgICAgICAuY29uY2F0TWFwKHNvbHV0aW9uID0+IHNvbHV0aW9uLndoZW5Db25uZWN0ZWQoKVxyXG4gICAgICAgICAgICAgICAgICAgIC5kbygoKSA9PiBzb2x1dGlvbi5kaWFnbm9zdGljcyh7IEZpbGVOYW1lOiBudWxsIH0pKSlcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAuc3Vic2NyaWJlKCkpO1xyXG5cclxuICAgICAgICBPbW5pLnJlZ2lzdGVyQ29uZmlndXJhdGlvbihzb2x1dGlvbiA9PiBzb2x1dGlvblxyXG4gICAgICAgICAgICAud2hlbkNvbm5lY3RlZCgpXHJcbiAgICAgICAgICAgIC5kZWxheSgxMDAwKVxyXG4gICAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHRoaXMuX2Z1bGxDb2RlQ2hlY2submV4dCh0cnVlKSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkb0Z1bGxDb2RlQ2hlY2soKSB7XHJcbiAgICAgICAgdGhpcy5fZnVsbENvZGVDaGVjay5uZXh0KHRydWUpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBmaWx0ZXJPbmx5V2FybmluZ3NBbmRFcnJvcnMocXVpY2tGaXhlczogTW9kZWxzLkRpYWdub3N0aWNMb2NhdGlvbltdKTogTW9kZWxzLkRpYWdub3N0aWNMb2NhdGlvbltdIHtcclxuICAgICAgICByZXR1cm4gZmlsdGVyKHF1aWNrRml4ZXMsIHggPT4geC5Mb2dMZXZlbCAhPT0gJ0hpZGRlbicpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkaXNwb3NlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlcXVpcmVkID0gdHJ1ZTtcclxuICAgIHB1YmxpYyB0aXRsZSA9ICdEaWFnbm9zdGljcyc7XHJcbiAgICBwdWJsaWMgZGVzY3JpcHRpb24gPSAnU3VwcG9ydCBmb3IgZGlhZ25vc3RpYyBlcnJvcnMuJztcclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IGNvZGVDaGVjayA9IG5ldyBDb2RlQ2hlY2s7XHJcbiJdfQ==
