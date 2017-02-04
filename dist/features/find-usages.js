'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.findUsages = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _rxjs = require('rxjs');

var _tsDisposables = require('ts-disposables');

var _dock = require('../atom/dock');

var _omni = require('../server/omni');

var _findPaneView = require('../views/find-pane-view');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var FindUsages = function () {
    function FindUsages() {
        _classCallCheck(this, FindUsages);

        this._findWindow = new _findPaneView.FindWindow();
        this.scrollTop = 0;
        this.usages = [];
        this.required = true;
        this.title = 'Find Usages / Go To Implementations';
        this.description = 'Adds support to find usages, and go to implementations';
    }

    _createClass(FindUsages, [{
        key: 'activate',
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
                    return !z.silent && z.command === 'findusages';
                }).map(function () {
                    return true;
                }),
                reset: _omni.Omni.listener.requests.filter(function (z) {
                    return !z.silent && (z.command === 'findimplementations' || z.command === 'findusages');
                }).map(function () {
                    return true;
                }),
                selected: selected.asObservable()
            };
            this.disposable.add(_omni.Omni.addTextEditorCommand('omnisharp-atom:find-usages', function () {
                _omni.Omni.request(function (solution) {
                    return solution.findusages({});
                });
            }));
            this.disposable.add(_omni.Omni.addTextEditorCommand('omnisharp-atom:go-to-implementation', function () {
                _omni.Omni.request(function (solution) {
                    return solution.findimplementations({});
                });
            }));
            this.disposable.add(atom.commands.add('atom-workspace', 'omnisharp-atom:next-usage', function () {
                _this._findWindow.next();
            }));
            this.disposable.add(atom.commands.add('atom-workspace', 'omnisharp-atom:go-to-usage', function () {
                _omni.Omni.navigateTo(_this._findWindow.current);
            }));
            this.disposable.add(atom.commands.add('atom-workspace', 'omnisharp-atom:previous-usage', function () {
                _this._findWindow.prev();
            }));
            this.disposable.add(atom.commands.add('atom-workspace', 'omnisharp-atom:go-to-next-usage', function () {
                _this._findWindow.next();
                _omni.Omni.navigateTo(_this._findWindow.current);
            }));
            this.disposable.add(atom.commands.add('atom-workspace', 'omnisharp-atom:go-to-previous-usage', function () {
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
                _dock.dock.selectWindow('find');
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
        key: 'ensureWindowIsCreated',
        value: function ensureWindowIsCreated() {
            var _this2 = this;

            if (!this.window) {
                this.window = new _tsDisposables.CompositeDisposable();
                var windowDisposable = _dock.dock.addWindow('find', 'Find', this._findWindow, { priority: 2000, closeable: true }, this.window);
                this.window.add(windowDisposable);
                this.window.add(_tsDisposables.Disposable.create(function () {
                    _this2.disposable.remove(_this2.window);
                    _this2.window = null;
                }));
                this.disposable.add(this.window);
            }
        }
    }, {
        key: 'dispose',
        value: function dispose() {
            this.disposable.dispose();
        }
    }, {
        key: 'navigateToSelectedItem',
        value: function navigateToSelectedItem() {
            _omni.Omni.navigateTo(this.usages[this._findWindow.selectedIndex]);
        }
    }]);

    return FindUsages;
}();

var findUsages = exports.findUsages = new FindUsages();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9maW5kLXVzYWdlcy50cyJdLCJuYW1lcyI6WyJGaW5kVXNhZ2VzIiwiX2ZpbmRXaW5kb3ciLCJzY3JvbGxUb3AiLCJ1c2FnZXMiLCJyZXF1aXJlZCIsInRpdGxlIiwiZGVzY3JpcHRpb24iLCJkaXNwb3NhYmxlIiwib2JzZXJ2YWJsZSIsIm1lcmdlIiwibGlzdGVuZXIiLCJmaW5kdXNhZ2VzIiwiZmluZGltcGxlbWVudGF0aW9ucyIsImZpbHRlciIsInoiLCJyZXNwb25zZSIsIlF1aWNrRml4ZXMiLCJsZW5ndGgiLCJtYXAiLCJzaGFyZSIsInNlbGVjdGVkIiwib2JzZXJ2ZSIsImZpbmQiLCJvcGVuIiwicmVxdWVzdHMiLCJzaWxlbnQiLCJjb21tYW5kIiwicmVzZXQiLCJhc09ic2VydmFibGUiLCJhZGQiLCJhZGRUZXh0RWRpdG9yQ29tbWFuZCIsInJlcXVlc3QiLCJzb2x1dGlvbiIsImF0b20iLCJjb21tYW5kcyIsIm5leHQiLCJuYXZpZ2F0ZVRvIiwiY3VycmVudCIsInByZXYiLCJzdWJzY3JpYmUiLCJzIiwidXBkYXRlIiwiZW5zdXJlV2luZG93SXNDcmVhdGVkIiwic2VsZWN0V2luZG93Iiwic2VsZWN0ZWRJbmRleCIsImRhdGEiLCJ3aW5kb3ciLCJ3aW5kb3dEaXNwb3NhYmxlIiwiYWRkV2luZG93IiwicHJpb3JpdHkiLCJjbG9zZWFibGUiLCJjcmVhdGUiLCJyZW1vdmUiLCJkaXNwb3NlIiwiZmluZFVzYWdlcyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7SUFFQUEsVTtBQUFBLDBCQUFBO0FBQUE7O0FBR1ksYUFBQUMsV0FBQSxHQUFjLDhCQUFkO0FBQ0EsYUFBQUMsU0FBQSxHQUFvQixDQUFwQjtBQUNELGFBQUFDLE1BQUEsR0FBc0MsRUFBdEM7QUE2R0EsYUFBQUMsUUFBQSxHQUFXLElBQVg7QUFDQSxhQUFBQyxLQUFBLEdBQVEscUNBQVI7QUFDQSxhQUFBQyxXQUFB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bkIiLCJmaWxlIjoibGliL2ZlYXR1cmVzL2ZpbmQtdXNhZ2VzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtNb2RlbHN9IGZyb20gJ29tbmlzaGFycC1jbGllbnQnO1xyXG5pbXBvcnQge09ic2VydmFibGUsIFN1YmplY3R9IGZyb20gJ3J4anMnO1xyXG5pbXBvcnQge0NvbXBvc2l0ZURpc3Bvc2FibGUsIERpc3Bvc2FibGV9IGZyb20gJ3RzLWRpc3Bvc2FibGVzJztcclxuaW1wb3J0IHtkb2NrfSBmcm9tICcuLi9hdG9tL2RvY2snO1xyXG5pbXBvcnQge09tbml9IGZyb20gJy4uL3NlcnZlci9vbW5pJztcclxuaW1wb3J0IHtGaW5kV2luZG93fSBmcm9tICcuLi92aWV3cy9maW5kLXBhbmUtdmlldyc7XHJcblxyXG5jbGFzcyBGaW5kVXNhZ2VzIGltcGxlbWVudHMgSUZlYXR1cmUge1xyXG4gICAgcHJpdmF0ZSBkaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xyXG4gICAgcHJpdmF0ZSB3aW5kb3c6IENvbXBvc2l0ZURpc3Bvc2FibGU7XHJcbiAgICBwcml2YXRlIF9maW5kV2luZG93ID0gbmV3IEZpbmRXaW5kb3c7XHJcbiAgICBwcml2YXRlIHNjcm9sbFRvcDogbnVtYmVyID0gMDtcclxuICAgIHB1YmxpYyB1c2FnZXM6IE1vZGVscy5EaWFnbm9zdGljTG9jYXRpb25bXSA9IFtdO1xyXG5cclxuICAgIHB1YmxpYyBvYnNlcnZlOiB7XHJcbiAgICAgICAgZmluZDogT2JzZXJ2YWJsZTxNb2RlbHMuRGlhZ25vc3RpY0xvY2F0aW9uW10+O1xyXG4gICAgICAgIG9wZW46IE9ic2VydmFibGU8Ym9vbGVhbj47XHJcbiAgICAgICAgcmVzZXQ6IE9ic2VydmFibGU8Ym9vbGVhbj47XHJcbiAgICAgICAgc2VsZWN0ZWQ6IE9ic2VydmFibGU8bnVtYmVyPjtcclxuICAgIH07XHJcblxyXG4gICAgcHVibGljIGFjdGl2YXRlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcblxyXG4gICAgICAgIGNvbnN0IG9ic2VydmFibGUgPSBPYnNlcnZhYmxlLm1lcmdlKFxyXG4gICAgICAgICAgICAvLyBMaXN0ZW4gdG8gZmluZCB1c2FnZXNcclxuICAgICAgICAgICAgT21uaS5saXN0ZW5lci5maW5kdXNhZ2VzLFxyXG4gICAgICAgICAgICAvLyBXZSBhbHNvIHdhbnQgZmluZCBpbXBsZW1lbnRhdGlvbnMsIHdoZXJlIHdlIGZvdW5kIG1vcmUgdGhhbiBvbmVcclxuICAgICAgICAgICAgT21uaS5saXN0ZW5lci5maW5kaW1wbGVtZW50YXRpb25zXHJcbiAgICAgICAgICAgICAgICAuZmlsdGVyKHogPT4gei5yZXNwb25zZS5RdWlja0ZpeGVzICYmIHoucmVzcG9uc2UuUXVpY2tGaXhlcy5sZW5ndGggPiAxKVxyXG4gICAgICAgIClcclxuICAgICAgICAgICAgLy8gRm9yIHRoZSBVSSB3ZSBvbmx5IG5lZWQgdGhlIHF1Y2lrIGZpeGVzLlxyXG4gICAgICAgICAgICAubWFwKHogPT4gPE1vZGVscy5EaWFnbm9zdGljTG9jYXRpb25bXT56LnJlc3BvbnNlLlF1aWNrRml4ZXMgfHwgW10pXHJcbiAgICAgICAgICAgIC5zaGFyZSgpO1xyXG5cclxuICAgICAgICBjb25zdCBzZWxlY3RlZCA9IG5ldyBTdWJqZWN0PG51bWJlcj4oKTtcclxuXHJcbiAgICAgICAgdGhpcy5vYnNlcnZlID0ge1xyXG4gICAgICAgICAgICBmaW5kOiBvYnNlcnZhYmxlLFxyXG4gICAgICAgICAgICAvLyBOT1RFOiBXZSBjYW5ub3QgZG8gdGhlIHNhbWUgZm9yIGZpbmQgaW1wbGVtZW50YXRpb25zIGJlY2F1c2UgZmluZCBpbXBsZW1lbnRhdGlvblxyXG4gICAgICAgICAgICAvLyAgICAgIGp1c3QgZ29lcyB0byB0aGUgaXRlbSBpZiBvbmx5IG9uZSBjb21lcyBiYWNrLlxyXG4gICAgICAgICAgICBvcGVuOiBPbW5pLmxpc3RlbmVyLnJlcXVlc3RzLmZpbHRlcih6ID0+ICF6LnNpbGVudCAmJiB6LmNvbW1hbmQgPT09ICdmaW5kdXNhZ2VzJykubWFwKCgpID0+IHRydWUpLFxyXG4gICAgICAgICAgICByZXNldDogT21uaS5saXN0ZW5lci5yZXF1ZXN0cy5maWx0ZXIoeiA9PiAhei5zaWxlbnQgJiYgKHouY29tbWFuZCA9PT0gJ2ZpbmRpbXBsZW1lbnRhdGlvbnMnIHx8IHouY29tbWFuZCA9PT0gJ2ZpbmR1c2FnZXMnKSkubWFwKCgpID0+IHRydWUpLFxyXG4gICAgICAgICAgICBzZWxlY3RlZDogc2VsZWN0ZWQuYXNPYnNlcnZhYmxlKClcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuYWRkVGV4dEVkaXRvckNvbW1hbmQoJ29tbmlzaGFycC1hdG9tOmZpbmQtdXNhZ2VzJywgKCkgPT4ge1xyXG4gICAgICAgICAgICBPbW5pLnJlcXVlc3Qoc29sdXRpb24gPT4gc29sdXRpb24uZmluZHVzYWdlcyh7fSkpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmFkZFRleHRFZGl0b3JDb21tYW5kKCdvbW5pc2hhcnAtYXRvbTpnby10by1pbXBsZW1lbnRhdGlvbicsICgpID0+IHtcclxuICAgICAgICAgICAgT21uaS5yZXF1ZXN0KHNvbHV0aW9uID0+IHNvbHV0aW9uLmZpbmRpbXBsZW1lbnRhdGlvbnMoe30pKTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoJ2F0b20td29ya3NwYWNlJywgJ29tbmlzaGFycC1hdG9tOm5leHQtdXNhZ2UnLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuX2ZpbmRXaW5kb3cubmV4dCgpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZCgnYXRvbS13b3Jrc3BhY2UnLCAnb21uaXNoYXJwLWF0b206Z28tdG8tdXNhZ2UnLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIE9tbmkubmF2aWdhdGVUbyh0aGlzLl9maW5kV2luZG93LmN1cnJlbnQpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZCgnYXRvbS13b3Jrc3BhY2UnLCAnb21uaXNoYXJwLWF0b206cHJldmlvdXMtdXNhZ2UnLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuX2ZpbmRXaW5kb3cucHJldigpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZCgnYXRvbS13b3Jrc3BhY2UnLCAnb21uaXNoYXJwLWF0b206Z28tdG8tbmV4dC11c2FnZScsICgpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5fZmluZFdpbmRvdy5uZXh0KCk7XHJcbiAgICAgICAgICAgIE9tbmkubmF2aWdhdGVUbyh0aGlzLl9maW5kV2luZG93LmN1cnJlbnQpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZCgnYXRvbS13b3Jrc3BhY2UnLCAnb21uaXNoYXJwLWF0b206Z28tdG8tcHJldmlvdXMtdXNhZ2UnLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuX2ZpbmRXaW5kb3cucHJldigpO1xyXG4gICAgICAgICAgICBPbW5pLm5hdmlnYXRlVG8odGhpcy5fZmluZFdpbmRvdy5jdXJyZW50KTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQodGhpcy5vYnNlcnZlLmZpbmQuc3Vic2NyaWJlKHMgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLnVzYWdlcyA9IHM7XHJcbiAgICAgICAgICAgIHRoaXMuX2ZpbmRXaW5kb3cudXBkYXRlKHMpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPYnNlcnZhYmxlLm1lcmdlKHRoaXMub2JzZXJ2ZS5maW5kLm1hcCh6ID0+IHRydWUpLCB0aGlzLm9ic2VydmUub3Blbi5tYXAoeiA9PiB0cnVlKSkuc3Vic2NyaWJlKCgpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5lbnN1cmVXaW5kb3dJc0NyZWF0ZWQoKTtcclxuICAgICAgICAgICAgZG9jay5zZWxlY3RXaW5kb3coJ2ZpbmQnKTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQodGhpcy5vYnNlcnZlLnJlc2V0LnN1YnNjcmliZSgoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMudXNhZ2VzID0gW107XHJcbiAgICAgICAgICAgIHRoaXMuc2Nyb2xsVG9wID0gMDtcclxuICAgICAgICAgICAgdGhpcy5fZmluZFdpbmRvdy5zZWxlY3RlZEluZGV4ID0gMDtcclxuICAgICAgICB9KSk7XHJcblxyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkubGlzdGVuZXIuZmluZGltcGxlbWVudGF0aW9ucy5zdWJzY3JpYmUoZGF0YSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChkYXRhLnJlc3BvbnNlLlF1aWNrRml4ZXMubGVuZ3RoID09PSAxKSB7XHJcbiAgICAgICAgICAgICAgICBPbW5pLm5hdmlnYXRlVG8oZGF0YS5yZXNwb25zZS5RdWlja0ZpeGVzWzBdKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGVuc3VyZVdpbmRvd0lzQ3JlYXRlZCgpIHtcclxuICAgICAgICBpZiAoIXRoaXMud2luZG93KSB7XHJcbiAgICAgICAgICAgIHRoaXMud2luZG93ID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgICAgICAgICAgY29uc3Qgd2luZG93RGlzcG9zYWJsZSA9IGRvY2suYWRkV2luZG93KCdmaW5kJywgJ0ZpbmQnLCB0aGlzLl9maW5kV2luZG93LCB7IHByaW9yaXR5OiAyMDAwLCBjbG9zZWFibGU6IHRydWUgfSwgdGhpcy53aW5kb3cpO1xyXG4gICAgICAgICAgICB0aGlzLndpbmRvdy5hZGQod2luZG93RGlzcG9zYWJsZSk7XHJcbiAgICAgICAgICAgIHRoaXMud2luZG93LmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUucmVtb3ZlKHRoaXMud2luZG93KTtcclxuICAgICAgICAgICAgICAgIHRoaXMud2luZG93ID0gbnVsbDtcclxuICAgICAgICAgICAgfSkpO1xyXG4gICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKHRoaXMud2luZG93KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgbmF2aWdhdGVUb1NlbGVjdGVkSXRlbSgpIHtcclxuICAgICAgICBPbW5pLm5hdmlnYXRlVG8odGhpcy51c2FnZXNbdGhpcy5fZmluZFdpbmRvdy5zZWxlY3RlZEluZGV4XSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlcXVpcmVkID0gdHJ1ZTtcclxuICAgIHB1YmxpYyB0aXRsZSA9ICdGaW5kIFVzYWdlcyAvIEdvIFRvIEltcGxlbWVudGF0aW9ucyc7XHJcbiAgICBwdWJsaWMgZGVzY3JpcHRpb24gPSAnQWRkcyBzdXBwb3J0IHRvIGZpbmQgdXNhZ2VzLCBhbmQgZ28gdG8gaW1wbGVtZW50YXRpb25zJztcclxufVxyXG5leHBvcnQgY29uc3QgZmluZFVzYWdlcyA9IG5ldyBGaW5kVXNhZ2VzO1xyXG4iXX0=
