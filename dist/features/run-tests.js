"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.runTests = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _rxjs = require("rxjs");

var _omnisharpClient = require("omnisharp-client");

var _omni = require("../server/omni");

var _dock = require("../atom/dock");

var _testResultsWindow = require("../views/test-results-window");

var _child_process = require("child_process");

var childProcess = _interopRequireWildcard(_child_process);

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

        this.testResults = [];
        this.required = true;
        this.title = "Test Runner";
        this.description = "Adds support for running tests within atom.";
    }

    _createClass(RunTests, [{
        key: "activate",
        value: function activate() {
            var _this = this;

            this.disposable = new _omnisharpClient.CompositeDisposable();
            this._testWindow = new _testResultsWindow.TestResultsWindow();
            var output = new _rxjs.Subject();
            this.observe = {
                output: output
            };
            this.disposable.add(_omni.Omni.listener.gettestcontext.subscribe(function (data) {
                _this.ensureWindowIsCreated();
                _this.executeTests(data.response);
            }));
            this.disposable.add(_omni.Omni.addTextEditorCommand("omnisharp-atom:run-all-tests", function () {
                _this.makeRequest(TestCommandType.All);
            }));
            this.disposable.add(_omni.Omni.addTextEditorCommand("omnisharp-atom:run-fixture-tests", function () {
                _this.makeRequest(TestCommandType.Fixture);
            }));
            this.disposable.add(_omni.Omni.addTextEditorCommand("omnisharp-atom:run-single-test", function () {
                _this.makeRequest(TestCommandType.Single);
            }));
            this.disposable.add(_omni.Omni.addTextEditorCommand("omnisharp-atom:run-last-test", function () {
                _this.executeTests(_this.lastRun);
            }));
        }
    }, {
        key: "dispose",
        value: function dispose() {
            this.disposable.dispose();
        }
    }, {
        key: "makeRequest",
        value: function makeRequest(type) {
            _omni.Omni.request(function (solution) {
                return solution.gettestcontext({ Type: type });
            });
        }
    }, {
        key: "executeTests",
        value: function executeTests(response) {
            var _this2 = this;

            this.testResults.length = 0;
            this.lastRun = response;
            this._testWindow.clear();
            var child = childProcess.exec(response.TestCommand, { cwd: response.Directory });
            child.stdout.on("data", function (data) {
                _this2._testWindow.addMessage({ message: data, logLevel: "" });
            });
            child.stderr.on("data", function (data) {
                _this2._testWindow.addMessage({ message: data, logLevel: "fail" });
            });
            _dock.dock.selectWindow("test-output");
        }
    }, {
        key: "ensureWindowIsCreated",
        value: function ensureWindowIsCreated() {
            var _this3 = this;

            if (!this.window) {
                this.window = new _omnisharpClient.CompositeDisposable();
                var windowDisposable = _dock.dock.addWindow("test-output", "Test output", this._testWindow, { priority: 2000, closeable: true }, this.window);
                this.window.add(windowDisposable);
                this.window.add(_omnisharpClient.Disposable.create(function () {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9ydW4tdGVzdHMuanMiLCJsaWIvZmVhdHVyZXMvcnVuLXRlc3RzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztJQ0NZOzs7Ozs7QUFHWixJQUFLLGVBQUw7QUFBQSxDQUFBLFVBQUssZUFBTCxFQUFvQjtBQUNoQixvQkFBQSxnQkFBQSxLQUFBLElBQUEsQ0FBQSxDQUFBLEdBQUEsS0FBQSxDQURnQjtBQUVoQixvQkFBQSxnQkFBQSxTQUFBLElBQUEsQ0FBQSxDQUFBLEdBQUEsU0FBQSxDQUZnQjtBQUdoQixvQkFBQSxnQkFBQSxRQUFBLElBQUEsQ0FBQSxDQUFBLEdBQUEsUUFBQSxDQUhnQjtDQUFwQixDQUFBLENBQUssb0JBQUEsa0JBQWUsRUFBZixDQUFBLENBQUw7O0lBTUE7QUFBQSx3QkFBQTs7O0FBR1csYUFBQSxXQUFBLEdBQStCLEVBQS9CLENBSFg7QUFtRlcsYUFBQSxRQUFBLEdBQVcsSUFBWCxDQW5GWDtBQW9GVyxhQUFBLEtBQUEsR0FBUSxhQUFSLENBcEZYO0FBcUZXLGFBQUEsV0FBQSxHQUFjLDZDQUFkLENBckZYO0tBQUE7Ozs7bUNBV21COzs7QUFDWCxpQkFBSyxVQUFMLEdBQWtCLDBDQUFsQixDQURXO0FBRVgsaUJBQUssV0FBTCxHQUFtQiwwQ0FBbkIsQ0FGVztBQUlYLGdCQUFNLFNBQVMsbUJBQVQsQ0FKSztBQUtYLGlCQUFLLE9BQUwsR0FBZTtBQUNYLHdCQUEwQyxNQUExQzthQURKLENBTFc7QUFTWCxpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLFdBQUssUUFBTCxDQUFjLGNBQWQsQ0FBNkIsU0FBN0IsQ0FBdUMsVUFBQyxJQUFELEVBQUs7QUFDNUQsc0JBQUsscUJBQUwsR0FENEQ7QUFFNUQsc0JBQUssWUFBTCxDQUFrQixLQUFLLFFBQUwsQ0FBbEIsQ0FGNEQ7YUFBTCxDQUEzRCxFQVRXO0FBY1gsaUJBQUssVUFB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cnQgeyBTdWJqZWN0IH0gZnJvbSBcInJ4anNcIjtcbmltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUsIERpc3Bvc2FibGUgfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xuaW1wb3J0IHsgT21uaSB9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xuaW1wb3J0IHsgZG9jayB9IGZyb20gXCIuLi9hdG9tL2RvY2tcIjtcbmltcG9ydCB7IFRlc3RSZXN1bHRzV2luZG93IH0gZnJvbSBcIi4uL3ZpZXdzL3Rlc3QtcmVzdWx0cy13aW5kb3dcIjtcbmltcG9ydCAqIGFzIGNoaWxkUHJvY2VzcyBmcm9tIFwiY2hpbGRfcHJvY2Vzc1wiO1xudmFyIFRlc3RDb21tYW5kVHlwZTtcbihmdW5jdGlvbiAoVGVzdENvbW1hbmRUeXBlKSB7XG4gICAgVGVzdENvbW1hbmRUeXBlW1Rlc3RDb21tYW5kVHlwZVtcIkFsbFwiXSA9IDBdID0gXCJBbGxcIjtcbiAgICBUZXN0Q29tbWFuZFR5cGVbVGVzdENvbW1hbmRUeXBlW1wiRml4dHVyZVwiXSA9IDFdID0gXCJGaXh0dXJlXCI7XG4gICAgVGVzdENvbW1hbmRUeXBlW1Rlc3RDb21tYW5kVHlwZVtcIlNpbmdsZVwiXSA9IDJdID0gXCJTaW5nbGVcIjtcbn0pKFRlc3RDb21tYW5kVHlwZSB8fCAoVGVzdENvbW1hbmRUeXBlID0ge30pKTtcbmNsYXNzIFJ1blRlc3RzIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy50ZXN0UmVzdWx0cyA9IFtdO1xuICAgICAgICB0aGlzLnJlcXVpcmVkID0gdHJ1ZTtcbiAgICAgICAgdGhpcy50aXRsZSA9IFwiVGVzdCBSdW5uZXJcIjtcbiAgICAgICAgdGhpcy5kZXNjcmlwdGlvbiA9IFwiQWRkcyBzdXBwb3J0IGZvciBydW5uaW5nIHRlc3RzIHdpdGhpbiBhdG9tLlwiO1xuICAgIH1cbiAgICBhY3RpdmF0ZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgdGhpcy5fdGVzdFdpbmRvdyA9IG5ldyBUZXN0UmVzdWx0c1dpbmRvdztcbiAgICAgICAgY29uc3Qgb3V0cHV0ID0gbmV3IFN1YmplY3QoKTtcbiAgICAgICAgdGhpcy5vYnNlcnZlID0ge1xuICAgICAgICAgICAgb3V0cHV0OiBvdXRwdXRcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmxpc3RlbmVyLmdldHRlc3Rjb250ZXh0LnN1YnNjcmliZSgoZGF0YSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5lbnN1cmVXaW5kb3dJc0NyZWF0ZWQoKTtcbiAgICAgICAgICAgIHRoaXMuZXhlY3V0ZVRlc3RzKGRhdGEucmVzcG9uc2UpO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5hZGRUZXh0RWRpdG9yQ29tbWFuZChcIm9tbmlzaGFycC1hdG9tOnJ1bi1hbGwtdGVzdHNcIiwgKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5tYWtlUmVxdWVzdChUZXN0Q29tbWFuZFR5cGUuQWxsKTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuYWRkVGV4dEVkaXRvckNvbW1hbmQoXCJvbW5pc2hhcnAtYXRvbTpydW4tZml4dHVyZS10ZXN0c1wiLCAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm1ha2VSZXF1ZXN0KFRlc3RDb21tYW5kVHlwZS5GaXh0dXJlKTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuYWRkVGV4dEVkaXRvckNvbW1hbmQoXCJvbW5pc2hhcnAtYXRvbTpydW4tc2luZ2xlLXRlc3RcIiwgKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5tYWtlUmVxdWVzdChUZXN0Q29tbWFuZFR5cGUuU2luZ2xlKTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuYWRkVGV4dEVkaXRvckNvbW1hbmQoXCJvbW5pc2hhcnAtYXRvbTpydW4tbGFzdC10ZXN0XCIsICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuZXhlY3V0ZVRlc3RzKHRoaXMubGFzdFJ1bik7XG4gICAgICAgIH0pKTtcbiAgICB9XG4gICAgZGlzcG9zZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICB9XG4gICAgbWFrZVJlcXVlc3QodHlwZSkge1xuICAgICAgICBPbW5pLnJlcXVlc3Qoc29sdXRpb24gPT4gc29sdXRpb24uZ2V0dGVzdGNvbnRleHQoeyBUeXBlOiB0eXBlIH0pKTtcbiAgICB9XG4gICAgZXhlY3V0ZVRlc3RzKHJlc3BvbnNlKSB7XG4gICAgICAgIHRoaXMudGVzdFJlc3VsdHMubGVuZ3RoID0gMDtcbiAgICAgICAgdGhpcy5sYXN0UnVuID0gcmVzcG9uc2U7XG4gICAgICAgIHRoaXMuX3Rlc3RXaW5kb3cuY2xlYXIoKTtcbiAgICAgICAgY29uc3QgY2hpbGQgPSBjaGlsZFByb2Nlc3MuZXhlYyhyZXNwb25zZS5UZXN0Q29tbWFuZCwgeyBjd2Q6IHJlc3BvbnNlLkRpcmVjdG9yeSB9KTtcbiAgICAgICAgY2hpbGQuc3Rkb3V0Lm9uKFwiZGF0YVwiLCAoZGF0YSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5fdGVzdFdpbmRvdy5hZGRNZXNzYWdlKHsgbWVzc2FnZTogZGF0YSwgbG9nTGV2ZWw6IFwiXCIgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICBjaGlsZC5zdGRlcnIub24oXCJkYXRhXCIsIChkYXRhKSA9PiB7XG4gICAgICAgICAgICB0aGlzLl90ZXN0V2luZG93LmFkZE1lc3NhZ2UoeyBtZXNzYWdlOiBkYXRhLCBsb2dMZXZlbDogXCJmYWlsXCIgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICBkb2NrLnNlbGVjdFdpbmRvdyhcInRlc3Qtb3V0cHV0XCIpO1xuICAgIH1cbiAgICBlbnN1cmVXaW5kb3dJc0NyZWF0ZWQoKSB7XG4gICAgICAgIGlmICghdGhpcy53aW5kb3cpIHtcbiAgICAgICAgICAgIHRoaXMud2luZG93ID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgICAgIGNvbnN0IHdpbmRvd0Rpc3Bvc2FibGUgPSBkb2NrLmFkZFdpbmRvdyhcInRlc3Qtb3V0cHV0XCIsIFwiVGVzdCBvdXRwdXRcIiwgdGhpcy5fdGVzdFdpbmRvdywgeyBwcmlvcml0eTogMjAwMCwgY2xvc2VhYmxlOiB0cnVlIH0sIHRoaXMud2luZG93KTtcbiAgICAgICAgICAgIHRoaXMud2luZG93LmFkZCh3aW5kb3dEaXNwb3NhYmxlKTtcbiAgICAgICAgICAgIHRoaXMud2luZG93LmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLnJlbW92ZSh0aGlzLndpbmRvdyk7XG4gICAgICAgICAgICAgICAgdGhpcy53aW5kb3cgPSBudWxsO1xuICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZCh0aGlzLndpbmRvdyk7XG4gICAgICAgIH1cbiAgICB9XG59XG5leHBvcnQgY29uc3QgcnVuVGVzdHMgPSBuZXcgUnVuVGVzdHM7XG4iLCJpbXBvcnQge01vZGVsc30gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcclxuaW1wb3J0IHtPYnNlcnZhYmxlLCBTdWJqZWN0fSBmcm9tIFwicnhqc1wiO1xyXG5pbXBvcnQge0NvbXBvc2l0ZURpc3Bvc2FibGUsIERpc3Bvc2FibGV9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XHJcbmltcG9ydCB7T21uaX0gZnJvbSBcIi4uL3NlcnZlci9vbW5pXCI7XHJcbmltcG9ydCB7ZG9ja30gZnJvbSBcIi4uL2F0b20vZG9ja1wiO1xyXG5pbXBvcnQge1Rlc3RSZXN1bHRzV2luZG93fSBmcm9tIFwiLi4vdmlld3MvdGVzdC1yZXN1bHRzLXdpbmRvd1wiO1xyXG5pbXBvcnQgKiBhcyBjaGlsZFByb2Nlc3MgZnJvbSBcImNoaWxkX3Byb2Nlc3NcIjtcclxuXHJcbi8vIFVzaW5nIHRoaXMgZW51bSBhcyB0aGUgT21uaXNoYXJwIG9uZSBpcyBmcmVha2luZyBvdXQuXHJcbmVudW0gVGVzdENvbW1hbmRUeXBlIHtcclxuICAgIEFsbCA9IDAsXHJcbiAgICBGaXh0dXJlID0gMSxcclxuICAgIFNpbmdsZSA9IDJcclxufVxyXG5cclxuY2xhc3MgUnVuVGVzdHMgaW1wbGVtZW50cyBJRmVhdHVyZSB7XHJcbiAgICBwcml2YXRlIGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XHJcbiAgICBwcml2YXRlIHdpbmRvdzogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxuICAgIHB1YmxpYyB0ZXN0UmVzdWx0czogT3V0cHV0TWVzc2FnZVtdID0gW107XHJcbiAgICBwcml2YXRlIGxhc3RSdW46IE1vZGVscy5HZXRUZXN0Q29tbWFuZFJlc3BvbnNlO1xyXG4gICAgcHJpdmF0ZSBfdGVzdFdpbmRvdzogVGVzdFJlc3VsdHNXaW5kb3c7XHJcblxyXG4gICAgcHVibGljIG9ic2VydmU6IHtcclxuICAgICAgICBvdXRwdXQ6IE9ic2VydmFibGU8T3V0cHV0TWVzc2FnZVtdPjtcclxuICAgIH07XHJcblxyXG4gICAgcHVibGljIGFjdGl2YXRlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcbiAgICAgICAgdGhpcy5fdGVzdFdpbmRvdyA9IG5ldyBUZXN0UmVzdWx0c1dpbmRvdztcclxuXHJcbiAgICAgICAgY29uc3Qgb3V0cHV0ID0gbmV3IFN1YmplY3Q8T3V0cHV0TWVzc2FnZVtdPigpO1xyXG4gICAgICAgIHRoaXMub2JzZXJ2ZSA9IHtcclxuICAgICAgICAgICAgb3V0cHV0OiA8T2JzZXJ2YWJsZTxPdXRwdXRNZXNzYWdlW10+Pjxhbnk+b3V0cHV0XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmxpc3RlbmVyLmdldHRlc3Rjb250ZXh0LnN1YnNjcmliZSgoZGF0YSkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLmVuc3VyZVdpbmRvd0lzQ3JlYXRlZCgpO1xyXG4gICAgICAgICAgICB0aGlzLmV4ZWN1dGVUZXN0cyhkYXRhLnJlc3BvbnNlKTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5hZGRUZXh0RWRpdG9yQ29tbWFuZChcIm9tbmlzaGFycC1hdG9tOnJ1bi1hbGwtdGVzdHNcIiwgKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLm1ha2VSZXF1ZXN0KFRlc3RDb21tYW5kVHlwZS5BbGwpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmFkZFRleHRFZGl0b3JDb21tYW5kKFwib21uaXNoYXJwLWF0b206cnVuLWZpeHR1cmUtdGVzdHNcIiwgKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLm1ha2VSZXF1ZXN0KFRlc3RDb21tYW5kVHlwZS5GaXh0dXJlKTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5hZGRUZXh0RWRpdG9yQ29tbWFuZChcIm9tbmlzaGFycC1hdG9tOnJ1bi1zaW5nbGUtdGVzdFwiLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMubWFrZVJlcXVlc3QoVGVzdENvbW1hbmRUeXBlLlNpbmdsZSk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuYWRkVGV4dEVkaXRvckNvbW1hbmQoXCJvbW5pc2hhcnAtYXRvbTpydW4tbGFzdC10ZXN0XCIsICgpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5leGVjdXRlVGVzdHModGhpcy5sYXN0UnVuKTtcclxuICAgICAgICB9KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIG1ha2VSZXF1ZXN0KHR5cGU6IFRlc3RDb21tYW5kVHlwZSkge1xyXG4gICAgICAgIE9tbmkucmVxdWVzdChzb2x1dGlvbiA9PiBzb2x1dGlvbi5nZXR0ZXN0Y29udGV4dCh7IFR5cGU6IDxhbnk+dHlwZSB9KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBleGVjdXRlVGVzdHMocmVzcG9uc2U6IE1vZGVscy5HZXRUZXN0Q29tbWFuZFJlc3BvbnNlKSB7XHJcbiAgICAgICAgdGhpcy50ZXN0UmVzdWx0cy5sZW5ndGggPSAwO1xyXG4gICAgICAgIHRoaXMubGFzdFJ1biA9IHJlc3BvbnNlO1xyXG5cclxuICAgICAgICB0aGlzLl90ZXN0V2luZG93LmNsZWFyKCk7XHJcblxyXG4gICAgICAgIGNvbnN0IGNoaWxkID0gY2hpbGRQcm9jZXNzLmV4ZWMocmVzcG9uc2UuVGVzdENvbW1hbmQsIHsgY3dkOiByZXNwb25zZS5EaXJlY3RvcnkgfSk7XHJcblxyXG4gICAgICAgIGNoaWxkLnN0ZG91dC5vbihcImRhdGFcIiwgKGRhdGE6IGFueSkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLl90ZXN0V2luZG93LmFkZE1lc3NhZ2UoeyBtZXNzYWdlOiBkYXRhLCBsb2dMZXZlbDogXCJcIiB9KTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgY2hpbGQuc3RkZXJyLm9uKFwiZGF0YVwiLCAoZGF0YTogYW55KSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuX3Rlc3RXaW5kb3cuYWRkTWVzc2FnZSh7IG1lc3NhZ2U6IGRhdGEsIGxvZ0xldmVsOiBcImZhaWxcIiB9KTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgZG9jay5zZWxlY3RXaW5kb3coXCJ0ZXN0LW91dHB1dFwiKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGVuc3VyZVdpbmRvd0lzQ3JlYXRlZCgpIHtcclxuICAgICAgICBpZiAoIXRoaXMud2luZG93KSB7XHJcbiAgICAgICAgICAgIHRoaXMud2luZG93ID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IHdpbmRvd0Rpc3Bvc2FibGUgPSBkb2NrLmFkZFdpbmRvdyhcInRlc3Qtb3V0cHV0XCIsIFwiVGVzdCBvdXRwdXRcIiwgdGhpcy5fdGVzdFdpbmRvdywgeyBwcmlvcml0eTogMjAwMCwgY2xvc2VhYmxlOiB0cnVlIH0sIHRoaXMud2luZG93KTtcclxuICAgICAgICAgICAgdGhpcy53aW5kb3cuYWRkKHdpbmRvd0Rpc3Bvc2FibGUpO1xyXG4gICAgICAgICAgICB0aGlzLndpbmRvdy5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLnJlbW92ZSh0aGlzLndpbmRvdyk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLndpbmRvdyA9IG51bGw7XHJcbiAgICAgICAgICAgIH0pKTtcclxuICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZCh0aGlzLndpbmRvdyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZXF1aXJlZCA9IHRydWU7XHJcbiAgICBwdWJsaWMgdGl0bGUgPSBcIlRlc3QgUnVubmVyXCI7XHJcbiAgICBwdWJsaWMgZGVzY3JpcHRpb24gPSBcIkFkZHMgc3VwcG9ydCBmb3IgcnVubmluZyB0ZXN0cyB3aXRoaW4gYXRvbS5cIjtcclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IHJ1blRlc3RzID0gbmV3IFJ1blRlc3RzO1xyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
