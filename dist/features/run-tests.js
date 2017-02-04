'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.runTests = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _child_process = require('child_process');

var childProcess = _interopRequireWildcard(_child_process);

var _rxjs = require('rxjs');

var _tsDisposables = require('ts-disposables');

var _dock = require('../atom/dock');

var _omni = require('../server/omni');

var _testResultsWindow = require('../views/test-results-window');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var TestCommandType;
(function (TestCommandType) {
    TestCommandType[TestCommandType["All"] = 0] = "All";
    TestCommandType[TestCommandType["Fixture"] = 1] = "Fixture";
    TestCommandType[TestCommandType["Single"] = 2] = "Single";
})(TestCommandType || (TestCommandType = {}));

var RunTests = function () {
    function RunTests() {
        _classCallCheck(this, RunTests);

        this.required = true;
        this.title = 'Test Runner';
        this.description = 'Adds support for running tests within atom.';
        this.testResults = [];
    }

    _createClass(RunTests, [{
        key: 'activate',
        value: function activate() {
            var _this = this;

            this.disposable = new _tsDisposables.CompositeDisposable();
            this._testWindow = new _testResultsWindow.TestResultsWindow();
            var output = new _rxjs.Subject();
            this.observe = {
                output: output
            };
            this.disposable.add(_omni.Omni.listener.gettestcontext.subscribe(function (data) {
                _this._ensureWindowIsCreated();
                _this._executeTests(data.response);
            }));
            this.disposable.add(_omni.Omni.addTextEditorCommand('omnisharp-atom:run-all-tests', function () {
                _this._makeRequest(TestCommandType.All);
            }));
            this.disposable.add(_omni.Omni.addTextEditorCommand('omnisharp-atom:run-fixture-tests', function () {
                _this._makeRequest(TestCommandType.Fixture);
            }));
            this.disposable.add(_omni.Omni.addTextEditorCommand('omnisharp-atom:run-single-test', function () {
                _this._makeRequest(TestCommandType.Single);
            }));
            this.disposable.add(_omni.Omni.addTextEditorCommand('omnisharp-atom:run-last-test', function () {
                _this._executeTests(_this.lastRun);
            }));
        }
    }, {
        key: 'dispose',
        value: function dispose() {
            this.disposable.dispose();
        }
    }, {
        key: '_makeRequest',
        value: function _makeRequest(type) {
            _omni.Omni.request(function (solution) {
                return solution.gettestcontext({ Type: type });
            });
        }
    }, {
        key: '_executeTests',
        value: function _executeTests(response) {
            var _this2 = this;

            this.testResults.length = 0;
            this.lastRun = response;
            this._testWindow.clear();
            var child = childProcess.exec(response.TestCommand, { cwd: response.Directory });
            child.stdout.on('data', function (data) {
                _this2._testWindow.addMessage({ message: data, logLevel: '' });
            });
            child.stderr.on('data', function (data) {
                _this2._testWindow.addMessage({ message: data, logLevel: 'fail' });
            });
            _dock.dock.selectWindow('test-output');
        }
    }, {
        key: '_ensureWindowIsCreated',
        value: function _ensureWindowIsCreated() {
            var _this3 = this;

            if (!this.window) {
                this.window = new _tsDisposables.CompositeDisposable();
                var windowDisposable = _dock.dock.addWindow('test-output', 'Test output', this._testWindow, { priority: 2000, closeable: true }, this.window);
                this.window.add(windowDisposable);
                this.window.add(_tsDisposables.Disposable.create(function () {
                    _this3.disposable.remove(_this3.window);
                    _this3.window = null;
                }));
                this.disposable.add(this.window);
            }
        }
    }]);

    return RunTests;
}();

var runTests = exports.runTests = new RunTests();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9ydW4tdGVzdHMudHMiXSwibmFtZXMiOlsiY2hpbGRQcm9jZXNzIiwiVGVzdENvbW1hbmRUeXBlIiwiUnVuVGVzdHMiLCJyZXF1aXJlZCIsInRpdGxlIiwiZGVzY3JpcHRpb24iLCJ0ZXN0UmVzdWx0cyIsImRpc3Bvc2FibGUiLCJfdGVzdFdpbmRvdyIsIm91dHB1dCIsIm9ic2VydmUiLCJhZGQiLCJsaXN0ZW5lciIsImdldHRlc3Rjb250ZXh0Iiwic3Vic2NyaWJlIiwiX2Vuc3VyZVdpbmRvd0lzQ3JlYXRlZCIsIl9leGVjdXRlVGVzdHMiLCJkYXRhIiwicmVzcG9uc2UiLCJhZGRUZXh0RWRpdG9yQ29tbWFuZCIsIl9tYWtlUmVxdWVzdCIsIkFsbCIsIkZpeHR1cmUiLCJTaW5nbGUiLCJsYXN0UnVuIiwiZGlzcG9zZSIsInR5cGUiLCJyZXF1ZXN0Iiwic29sdXRpb24iLCJUeXBlIiwibGVuZ3RoIiwiY2xlYXIiLCJjaGlsZCIsImV4ZWMiLCJUZXN0Q29tbWFuZCIsImN3ZCIsIkRpcmVjdG9yeSIsInN0ZG91dCIsIm9uIiwiYWRkTWVzc2FnZSIsIm1lc3NhZ2UiLCJsb2dMZXZlbCIsInN0ZGVyciIsInNlbGVjdFdpbmRvdyIsIndpbmRvdyIsIndpbmRvd0Rpc3Bvc2FibGUiLCJhZGRXaW5kb3ciLCJwcmlvcml0eSIsImNsb3NlYWJsZSIsImNyZWF0ZSIsInJlbW92ZSIsInJ1blRlc3RzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7SUFBWUEsWTs7QUFFWjs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7Ozs7O0FBR0EsSUFBS0MsZUFBTDtBQUFBLENBQUEsVUFBS0EsZUFBTCxFQUFvQjtBQUNoQkEsb0JBQUFBLGdCQUFBLEtBQUEsSUFBQSxDQUFBLElBQUEsS0FBQTtBQUNBQSxvQkFBQUEsZ0JBQUEsU0FBQSxJQUFBLENBQUEsSUFBQSxTQUFBO0FBQ0FBLG9CQUFBQSxnQkFBQSxRQUFBLElBQUEsQ0FBQSxJQUFBLFFBQUE7QUFD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QUVBLG9CQUFNQyxtQkFBbUIsV0FBS0MsU0FBTCxDQUFlLGFBQWYsRUFBOEIsYUFBOUIsRUFBNkMsS0FBS3RDLFdBQWxELEVBQStELEVBQUV1QyxVQUFVLElBQVosRUFBa0JDLFdBQVcsSUFBN0IsRUFBL0QsRUFBb0csS0FBS0osTUFBekcsQ0FBekI7QUFDQSxxQkFBS0EsTUFBTCxDQUFZakMsR0FBWixDQUFnQmtDLGdCQUFoQjtBQUNBLHFCQUFLRCxNQUFMLENBQVlqQyxHQUFaLENBQWdCLDBCQUFXc0MsTUFBWCxDQUFrQixZQUFBO0FBQzlCLDJCQUFLMUMsVUFBTCxDQUFnQjJDLE1BQWhCLENBQXVCLE9BQUtOLE1BQTVCO0FBQ0EsMkJBQUtBLE1BQUwsR0FBYyxJQUFkO0FBQ0gsaUJBSGUsQ0FBaEI7QUFJQSxxQkFBS3JDLFVBQUwsQ0FBZ0JJLEdBQWhCLENBQW9CLEtBQUtpQyxNQUF6QjtBQUNIO0FBQ0o7Ozs7OztBQUlFLElBQU1PLDhCQUFXLElBQUlqRCxRQUFKLEVBQWpCIiwiZmlsZSI6ImxpYi9mZWF0dXJlcy9ydW4tdGVzdHMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjaGlsZFByb2Nlc3MgZnJvbSAnY2hpbGRfcHJvY2Vzcyc7XHJcbmltcG9ydCB7TW9kZWxzfSBmcm9tICdvbW5pc2hhcnAtY2xpZW50JztcclxuaW1wb3J0IHtPYnNlcnZhYmxlLCBTdWJqZWN0fSBmcm9tICdyeGpzJztcclxuaW1wb3J0IHtDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlfSBmcm9tICd0cy1kaXNwb3NhYmxlcyc7XHJcbmltcG9ydCB7ZG9ja30gZnJvbSAnLi4vYXRvbS9kb2NrJztcclxuaW1wb3J0IHtPbW5pfSBmcm9tICcuLi9zZXJ2ZXIvb21uaSc7XHJcbmltcG9ydCB7VGVzdFJlc3VsdHNXaW5kb3d9IGZyb20gJy4uL3ZpZXdzL3Rlc3QtcmVzdWx0cy13aW5kb3cnO1xyXG5cclxuLy8gVXNpbmcgdGhpcyBlbnVtIGFzIHRoZSBPbW5pc2hhcnAgb25lIGlzIGZyZWFraW5nIG91dC5cclxuZW51bSBUZXN0Q29tbWFuZFR5cGUge1xyXG4gICAgQWxsID0gMCxcclxuICAgIEZpeHR1cmUgPSAxLFxyXG4gICAgU2luZ2xlID0gMlxyXG59XHJcblxyXG5jbGFzcyBSdW5UZXN0cyBpbXBsZW1lbnRzIElGZWF0dXJlIHtcclxuICAgIHB1YmxpYyByZXF1aXJlZCA9IHRydWU7XHJcbiAgICBwdWJsaWMgdGl0bGUgPSAnVGVzdCBSdW5uZXInO1xyXG4gICAgcHVibGljIGRlc2NyaXB0aW9uID0gJ0FkZHMgc3VwcG9ydCBmb3IgcnVubmluZyB0ZXN0cyB3aXRoaW4gYXRvbS4nO1xyXG5cclxuICAgIHB1YmxpYyB0ZXN0UmVzdWx0czogT3V0cHV0TWVzc2FnZVtdID0gW107XHJcbiAgICBwdWJsaWMgb2JzZXJ2ZToge1xyXG4gICAgICAgIG91dHB1dDogT2JzZXJ2YWJsZTxPdXRwdXRNZXNzYWdlW10+O1xyXG4gICAgfTtcclxuXHJcbiAgICBwcml2YXRlIGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XHJcbiAgICBwcml2YXRlIHdpbmRvdzogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxuICAgIHByaXZhdGUgbGFzdFJ1bjogTW9kZWxzLkdldFRlc3RDb21tYW5kUmVzcG9uc2U7XHJcbiAgICBwcml2YXRlIF90ZXN0V2luZG93OiBUZXN0UmVzdWx0c1dpbmRvdztcclxuXHJcbiAgICBwdWJsaWMgYWN0aXZhdGUoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgICAgICB0aGlzLl90ZXN0V2luZG93ID0gbmV3IFRlc3RSZXN1bHRzV2luZG93KCk7XHJcblxyXG4gICAgICAgIGNvbnN0IG91dHB1dCA9IG5ldyBTdWJqZWN0PE91dHB1dE1lc3NhZ2VbXT4oKTtcclxuICAgICAgICB0aGlzLm9ic2VydmUgPSB7XHJcbiAgICAgICAgICAgIG91dHB1dDogPE9ic2VydmFibGU8T3V0cHV0TWVzc2FnZVtdPj48YW55Pm91dHB1dFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5saXN0ZW5lci5nZXR0ZXN0Y29udGV4dC5zdWJzY3JpYmUoZGF0YSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuX2Vuc3VyZVdpbmRvd0lzQ3JlYXRlZCgpO1xyXG4gICAgICAgICAgICB0aGlzLl9leGVjdXRlVGVzdHMoZGF0YS5yZXNwb25zZSk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuYWRkVGV4dEVkaXRvckNvbW1hbmQoJ29tbmlzaGFycC1hdG9tOnJ1bi1hbGwtdGVzdHMnLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuX21ha2VSZXF1ZXN0KFRlc3RDb21tYW5kVHlwZS5BbGwpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmFkZFRleHRFZGl0b3JDb21tYW5kKCdvbW5pc2hhcnAtYXRvbTpydW4tZml4dHVyZS10ZXN0cycsICgpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5fbWFrZVJlcXVlc3QoVGVzdENvbW1hbmRUeXBlLkZpeHR1cmUpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmFkZFRleHRFZGl0b3JDb21tYW5kKCdvbW5pc2hhcnAtYXRvbTpydW4tc2luZ2xlLXRlc3QnLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuX21ha2VSZXF1ZXN0KFRlc3RDb21tYW5kVHlwZS5TaW5nbGUpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmFkZFRleHRFZGl0b3JDb21tYW5kKCdvbW5pc2hhcnAtYXRvbTpydW4tbGFzdC10ZXN0JywgKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLl9leGVjdXRlVGVzdHModGhpcy5sYXN0UnVuKTtcclxuICAgICAgICB9KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9tYWtlUmVxdWVzdCh0eXBlOiBUZXN0Q29tbWFuZFR5cGUpIHtcclxuICAgICAgICBPbW5pLnJlcXVlc3Qoc29sdXRpb24gPT4gc29sdXRpb24uZ2V0dGVzdGNvbnRleHQoeyBUeXBlOiA8YW55PnR5cGUgfSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX2V4ZWN1dGVUZXN0cyhyZXNwb25zZTogTW9kZWxzLkdldFRlc3RDb21tYW5kUmVzcG9uc2UpIHtcclxuICAgICAgICB0aGlzLnRlc3RSZXN1bHRzLmxlbmd0aCA9IDA7XHJcbiAgICAgICAgdGhpcy5sYXN0UnVuID0gcmVzcG9uc2U7XHJcblxyXG4gICAgICAgIHRoaXMuX3Rlc3RXaW5kb3cuY2xlYXIoKTtcclxuXHJcbiAgICAgICAgY29uc3QgY2hpbGQgPSBjaGlsZFByb2Nlc3MuZXhlYyhyZXNwb25zZS5UZXN0Q29tbWFuZCwgeyBjd2Q6IHJlc3BvbnNlLkRpcmVjdG9yeSB9KTtcclxuXHJcbiAgICAgICAgY2hpbGQuc3Rkb3V0Lm9uKCdkYXRhJywgKGRhdGE6IGFueSkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLl90ZXN0V2luZG93LmFkZE1lc3NhZ2UoeyBtZXNzYWdlOiBkYXRhLCBsb2dMZXZlbDogJycgfSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGNoaWxkLnN0ZGVyci5vbignZGF0YScsIChkYXRhOiBhbnkpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5fdGVzdFdpbmRvdy5hZGRNZXNzYWdlKHsgbWVzc2FnZTogZGF0YSwgbG9nTGV2ZWw6ICdmYWlsJyB9KTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgZG9jay5zZWxlY3RXaW5kb3coJ3Rlc3Qtb3V0cHV0Jyk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfZW5zdXJlV2luZG93SXNDcmVhdGVkKCkge1xyXG4gICAgICAgIGlmICghdGhpcy53aW5kb3cpIHtcclxuICAgICAgICAgICAgdGhpcy53aW5kb3cgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG5cclxuICAgICAgICAgICAgY29uc3Qgd2luZG93RGlzcG9zYWJsZSA9IGRvY2suYWRkV2luZG93KCd0ZXN0LW91dHB1dCcsICdUZXN0IG91dHB1dCcsIHRoaXMuX3Rlc3RXaW5kb3csIHsgcHJpb3JpdHk6IDIwMDAsIGNsb3NlYWJsZTogdHJ1ZSB9LCB0aGlzLndpbmRvdyk7XHJcbiAgICAgICAgICAgIHRoaXMud2luZG93LmFkZCh3aW5kb3dEaXNwb3NhYmxlKTtcclxuICAgICAgICAgICAgdGhpcy53aW5kb3cuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5yZW1vdmUodGhpcy53aW5kb3cpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy53aW5kb3cgPSBudWxsO1xyXG4gICAgICAgICAgICB9KSk7XHJcbiAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQodGhpcy53aW5kb3cpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOmV4cG9ydC1uYW1lXHJcbmV4cG9ydCBjb25zdCBydW5UZXN0cyA9IG5ldyBSdW5UZXN0cygpO1xyXG4iXX0=
