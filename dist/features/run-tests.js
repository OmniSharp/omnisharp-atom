"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.runTests = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _rxjs = require("rxjs");

var _tsDisposables = require("ts-disposables");

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

            this.disposable = new _tsDisposables.CompositeDisposable();
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
                this.window = new _tsDisposables.CompositeDisposable();
                var windowDisposable = _dock.dock.addWindow("test-output", "Test output", this._testWindow, { priority: 2000, closeable: true }, this.window);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9ydW4tdGVzdHMuanMiLCJsaWIvZmVhdHVyZXMvcnVuLXRlc3RzLnRzIl0sIm5hbWVzIjpbImNoaWxkUHJvY2VzcyIsIlRlc3RDb21tYW5kVHlwZSIsIlJ1blRlc3RzIiwidGVzdFJlc3VsdHMiLCJyZXF1aXJlZCIsInRpdGxlIiwiZGVzY3JpcHRpb24iLCJkaXNwb3NhYmxlIiwiX3Rlc3RXaW5kb3ciLCJvdXRwdXQiLCJvYnNlcnZlIiwiYWRkIiwibGlzdGVuZXIiLCJnZXR0ZXN0Y29udGV4dCIsInN1YnNjcmliZSIsImRhdGEiLCJlbnN1cmVXaW5kb3dJc0NyZWF0ZWQiLCJleGVjdXRlVGVzdHMiLCJyZXNwb25zZSIsImFkZFRleHRFZGl0b3JDb21tYW5kIiwibWFrZVJlcXVlc3QiLCJBbGwiLCJGaXh0dXJlIiwiU2luZ2xlIiwibGFzdFJ1biIsImRpc3Bvc2UiLCJ0eXBlIiwicmVxdWVzdCIsInNvbHV0aW9uIiwiVHlwZSIsImxlbmd0aCIsImNsZWFyIiwiY2hpbGQiLCJleGVjIiwiVGVzdENvbW1hbmQiLCJjd2QiLCJEaXJlY3RvcnkiLCJzdGRvdXQiLCJvbiIsImFkZE1lc3NhZ2UiLCJtZXNzYWdlIiwibG9nTGV2ZWwiLCJzdGRlcnIiLCJzZWxlY3RXaW5kb3ciLCJ3aW5kb3ciLCJ3aW5kb3dEaXNwb3NhYmxlIiwiYWRkV2luZG93IiwicHJpb3JpdHkiLCJjbG9zZWFibGUiLCJjcmVhdGUiLCJyZW1vdmUiLCJydW5UZXN0cyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0lDQ1lBLFk7Ozs7OztBQUdaLElBQUtDLGVBQUw7QUFBQSxDQUFBLFVBQUtBLGVBQUwsRUFBb0I7QUFDaEJBLG9CQUFBQSxnQkFBQSxLQUFBLElBQUEsQ0FBQSxJQUFBLEtBQUE7QUFDQUEsb0JBQUFBLGdCQUFBLFNBQUEsSUFBQSxDQUFBLElBQUEsU0FBQTtBQUNBQSxvQkFBQUEsZ0JBQUEsUUFB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RUFBa0I7QUFDZCxxQkFBS0EsTUFBTCxHQUFjLHdDQUFkO0FBRUEsb0JBQU1DLG1CQUFtQixXQUFLQyxTQUFMLENBQWUsYUFBZixFQUE4QixhQUE5QixFQUE2QyxLQUFLdEMsV0FBbEQsRUFBK0QsRUFBRXVDLFVBQVUsSUFBWixFQUFrQkMsV0FBVyxJQUE3QixFQUEvRCxFQUFvRyxLQUFLSixNQUF6RyxDQUF6QjtBQUNBLHFCQUFLQSxNQUFMLENBQVlqQyxHQUFaLENBQWdCa0MsZ0JBQWhCO0FBQ0EscUJBQUtELE1BQUwsQ0FBWWpDLEdBQVosQ0FBZ0IsMEJBQVdzQyxNQUFYLENBQWtCLFlBQUE7QUFDOUIsMkJBQUsxQyxVQUFMLENBQWdCMkMsTUFBaEIsQ0FBdUIsT0FBS04sTUFBNUI7QUFDQSwyQkFBS0EsTUFBTCxHQUFjLElBQWQ7QUFDSCxpQkFIZSxDQUFoQjtBQUlBLHFCQUFLckMsVUFBTCxDQUFnQkksR0FBaEIsQ0FBb0IsS0FBS2lDLE1BQXpCO0FBQ0g7QUFDSjs7Ozs7O0FBT0UsSUFBTU8sOEJBQVcsSUFBSWpELFFBQUosRUFBakIiLCJmaWxlIjoibGliL2ZlYXR1cmVzL3J1bi10ZXN0cy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFN1YmplY3QgfSBmcm9tIFwicnhqc1wiO1xuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSwgRGlzcG9zYWJsZSB9IGZyb20gXCJ0cy1kaXNwb3NhYmxlc1wiO1xuaW1wb3J0IHsgT21uaSB9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xuaW1wb3J0IHsgZG9jayB9IGZyb20gXCIuLi9hdG9tL2RvY2tcIjtcbmltcG9ydCB7IFRlc3RSZXN1bHRzV2luZG93IH0gZnJvbSBcIi4uL3ZpZXdzL3Rlc3QtcmVzdWx0cy13aW5kb3dcIjtcbmltcG9ydCAqIGFzIGNoaWxkUHJvY2VzcyBmcm9tIFwiY2hpbGRfcHJvY2Vzc1wiO1xudmFyIFRlc3RDb21tYW5kVHlwZTtcbihmdW5jdGlvbiAoVGVzdENvbW1hbmRUeXBlKSB7XG4gICAgVGVzdENvbW1hbmRUeXBlW1Rlc3RDb21tYW5kVHlwZVtcIkFsbFwiXSA9IDBdID0gXCJBbGxcIjtcbiAgICBUZXN0Q29tbWFuZFR5cGVbVGVzdENvbW1hbmRUeXBlW1wiRml4dHVyZVwiXSA9IDFdID0gXCJGaXh0dXJlXCI7XG4gICAgVGVzdENvbW1hbmRUeXBlW1Rlc3RDb21tYW5kVHlwZVtcIlNpbmdsZVwiXSA9IDJdID0gXCJTaW5nbGVcIjtcbn0pKFRlc3RDb21tYW5kVHlwZSB8fCAoVGVzdENvbW1hbmRUeXBlID0ge30pKTtcbmNsYXNzIFJ1blRlc3RzIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy50ZXN0UmVzdWx0cyA9IFtdO1xuICAgICAgICB0aGlzLnJlcXVpcmVkID0gdHJ1ZTtcbiAgICAgICAgdGhpcy50aXRsZSA9IFwiVGVzdCBSdW5uZXJcIjtcbiAgICAgICAgdGhpcy5kZXNjcmlwdGlvbiA9IFwiQWRkcyBzdXBwb3J0IGZvciBydW5uaW5nIHRlc3RzIHdpdGhpbiBhdG9tLlwiO1xuICAgIH1cbiAgICBhY3RpdmF0ZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgdGhpcy5fdGVzdFdpbmRvdyA9IG5ldyBUZXN0UmVzdWx0c1dpbmRvdztcbiAgICAgICAgY29uc3Qgb3V0cHV0ID0gbmV3IFN1YmplY3QoKTtcbiAgICAgICAgdGhpcy5vYnNlcnZlID0ge1xuICAgICAgICAgICAgb3V0cHV0OiBvdXRwdXRcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmxpc3RlbmVyLmdldHRlc3Rjb250ZXh0LnN1YnNjcmliZSgoZGF0YSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5lbnN1cmVXaW5kb3dJc0NyZWF0ZWQoKTtcbiAgICAgICAgICAgIHRoaXMuZXhlY3V0ZVRlc3RzKGRhdGEucmVzcG9uc2UpO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5hZGRUZXh0RWRpdG9yQ29tbWFuZChcIm9tbmlzaGFycC1hdG9tOnJ1bi1hbGwtdGVzdHNcIiwgKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5tYWtlUmVxdWVzdChUZXN0Q29tbWFuZFR5cGUuQWxsKTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuYWRkVGV4dEVkaXRvckNvbW1hbmQoXCJvbW5pc2hhcnAtYXRvbTpydW4tZml4dHVyZS10ZXN0c1wiLCAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm1ha2VSZXF1ZXN0KFRlc3RDb21tYW5kVHlwZS5GaXh0dXJlKTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuYWRkVGV4dEVkaXRvckNvbW1hbmQoXCJvbW5pc2hhcnAtYXRvbTpydW4tc2luZ2xlLXRlc3RcIiwgKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5tYWtlUmVxdWVzdChUZXN0Q29tbWFuZFR5cGUuU2luZ2xlKTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuYWRkVGV4dEVkaXRvckNvbW1hbmQoXCJvbW5pc2hhcnAtYXRvbTpydW4tbGFzdC10ZXN0XCIsICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuZXhlY3V0ZVRlc3RzKHRoaXMubGFzdFJ1bik7XG4gICAgICAgIH0pKTtcbiAgICB9XG4gICAgZGlzcG9zZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICB9XG4gICAgbWFrZVJlcXVlc3QodHlwZSkge1xuICAgICAgICBPbW5pLnJlcXVlc3Qoc29sdXRpb24gPT4gc29sdXRpb24uZ2V0dGVzdGNvbnRleHQoeyBUeXBlOiB0eXBlIH0pKTtcbiAgICB9XG4gICAgZXhlY3V0ZVRlc3RzKHJlc3BvbnNlKSB7XG4gICAgICAgIHRoaXMudGVzdFJlc3VsdHMubGVuZ3RoID0gMDtcbiAgICAgICAgdGhpcy5sYXN0UnVuID0gcmVzcG9uc2U7XG4gICAgICAgIHRoaXMuX3Rlc3RXaW5kb3cuY2xlYXIoKTtcbiAgICAgICAgY29uc3QgY2hpbGQgPSBjaGlsZFByb2Nlc3MuZXhlYyhyZXNwb25zZS5UZXN0Q29tbWFuZCwgeyBjd2Q6IHJlc3BvbnNlLkRpcmVjdG9yeSB9KTtcbiAgICAgICAgY2hpbGQuc3Rkb3V0Lm9uKFwiZGF0YVwiLCAoZGF0YSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5fdGVzdFdpbmRvdy5hZGRNZXNzYWdlKHsgbWVzc2FnZTogZGF0YSwgbG9nTGV2ZWw6IFwiXCIgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICBjaGlsZC5zdGRlcnIub24oXCJkYXRhXCIsIChkYXRhKSA9PiB7XG4gICAgICAgICAgICB0aGlzLl90ZXN0V2luZG93LmFkZE1lc3NhZ2UoeyBtZXNzYWdlOiBkYXRhLCBsb2dMZXZlbDogXCJmYWlsXCIgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICBkb2NrLnNlbGVjdFdpbmRvdyhcInRlc3Qtb3V0cHV0XCIpO1xuICAgIH1cbiAgICBlbnN1cmVXaW5kb3dJc0NyZWF0ZWQoKSB7XG4gICAgICAgIGlmICghdGhpcy53aW5kb3cpIHtcbiAgICAgICAgICAgIHRoaXMud2luZG93ID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgICAgIGNvbnN0IHdpbmRvd0Rpc3Bvc2FibGUgPSBkb2NrLmFkZFdpbmRvdyhcInRlc3Qtb3V0cHV0XCIsIFwiVGVzdCBvdXRwdXRcIiwgdGhpcy5fdGVzdFdpbmRvdywgeyBwcmlvcml0eTogMjAwMCwgY2xvc2VhYmxlOiB0cnVlIH0sIHRoaXMud2luZG93KTtcbiAgICAgICAgICAgIHRoaXMud2luZG93LmFkZCh3aW5kb3dEaXNwb3NhYmxlKTtcbiAgICAgICAgICAgIHRoaXMud2luZG93LmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLnJlbW92ZSh0aGlzLndpbmRvdyk7XG4gICAgICAgICAgICAgICAgdGhpcy53aW5kb3cgPSBudWxsO1xuICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZCh0aGlzLndpbmRvdyk7XG4gICAgICAgIH1cbiAgICB9XG59XG5leHBvcnQgY29uc3QgcnVuVGVzdHMgPSBuZXcgUnVuVGVzdHM7XG4iLCJpbXBvcnQge01vZGVsc30gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcclxuaW1wb3J0IHtPYnNlcnZhYmxlLCBTdWJqZWN0fSBmcm9tIFwicnhqc1wiO1xyXG5pbXBvcnQge0NvbXBvc2l0ZURpc3Bvc2FibGUsIERpc3Bvc2FibGV9IGZyb20gXCJ0cy1kaXNwb3NhYmxlc1wiO1xyXG5pbXBvcnQge09tbml9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xyXG5pbXBvcnQge2RvY2t9IGZyb20gXCIuLi9hdG9tL2RvY2tcIjtcclxuaW1wb3J0IHtUZXN0UmVzdWx0c1dpbmRvd30gZnJvbSBcIi4uL3ZpZXdzL3Rlc3QtcmVzdWx0cy13aW5kb3dcIjtcclxuaW1wb3J0ICogYXMgY2hpbGRQcm9jZXNzIGZyb20gXCJjaGlsZF9wcm9jZXNzXCI7XHJcblxyXG4vLyBVc2luZyB0aGlzIGVudW0gYXMgdGhlIE9tbmlzaGFycCBvbmUgaXMgZnJlYWtpbmcgb3V0LlxyXG5lbnVtIFRlc3RDb21tYW5kVHlwZSB7XHJcbiAgICBBbGwgPSAwLFxyXG4gICAgRml4dHVyZSA9IDEsXHJcbiAgICBTaW5nbGUgPSAyXHJcbn1cclxuXHJcbmNsYXNzIFJ1blRlc3RzIGltcGxlbWVudHMgSUZlYXR1cmUge1xyXG4gICAgcHJpdmF0ZSBkaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xyXG4gICAgcHJpdmF0ZSB3aW5kb3c6IENvbXBvc2l0ZURpc3Bvc2FibGU7XHJcbiAgICBwdWJsaWMgdGVzdFJlc3VsdHM6IE91dHB1dE1lc3NhZ2VbXSA9IFtdO1xyXG4gICAgcHJpdmF0ZSBsYXN0UnVuOiBNb2RlbHMuR2V0VGVzdENvbW1hbmRSZXNwb25zZTtcclxuICAgIHByaXZhdGUgX3Rlc3RXaW5kb3c6IFRlc3RSZXN1bHRzV2luZG93O1xyXG5cclxuICAgIHB1YmxpYyBvYnNlcnZlOiB7XHJcbiAgICAgICAgb3V0cHV0OiBPYnNlcnZhYmxlPE91dHB1dE1lc3NhZ2VbXT47XHJcbiAgICB9O1xyXG5cclxuICAgIHB1YmxpYyBhY3RpdmF0ZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG4gICAgICAgIHRoaXMuX3Rlc3RXaW5kb3cgPSBuZXcgVGVzdFJlc3VsdHNXaW5kb3c7XHJcblxyXG4gICAgICAgIGNvbnN0IG91dHB1dCA9IG5ldyBTdWJqZWN0PE91dHB1dE1lc3NhZ2VbXT4oKTtcclxuICAgICAgICB0aGlzLm9ic2VydmUgPSB7XHJcbiAgICAgICAgICAgIG91dHB1dDogPE9ic2VydmFibGU8T3V0cHV0TWVzc2FnZVtdPj48YW55Pm91dHB1dFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5saXN0ZW5lci5nZXR0ZXN0Y29udGV4dC5zdWJzY3JpYmUoKGRhdGEpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5lbnN1cmVXaW5kb3dJc0NyZWF0ZWQoKTtcclxuICAgICAgICAgICAgdGhpcy5leGVjdXRlVGVzdHMoZGF0YS5yZXNwb25zZSk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuYWRkVGV4dEVkaXRvckNvbW1hbmQoXCJvbW5pc2hhcnAtYXRvbTpydW4tYWxsLXRlc3RzXCIsICgpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5tYWtlUmVxdWVzdChUZXN0Q29tbWFuZFR5cGUuQWxsKTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5hZGRUZXh0RWRpdG9yQ29tbWFuZChcIm9tbmlzaGFycC1hdG9tOnJ1bi1maXh0dXJlLXRlc3RzXCIsICgpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5tYWtlUmVxdWVzdChUZXN0Q29tbWFuZFR5cGUuRml4dHVyZSk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuYWRkVGV4dEVkaXRvckNvbW1hbmQoXCJvbW5pc2hhcnAtYXRvbTpydW4tc2luZ2xlLXRlc3RcIiwgKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLm1ha2VSZXF1ZXN0KFRlc3RDb21tYW5kVHlwZS5TaW5nbGUpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmFkZFRleHRFZGl0b3JDb21tYW5kKFwib21uaXNoYXJwLWF0b206cnVuLWxhc3QtdGVzdFwiLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuZXhlY3V0ZVRlc3RzKHRoaXMubGFzdFJ1bik7XHJcbiAgICAgICAgfSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkaXNwb3NlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBtYWtlUmVxdWVzdCh0eXBlOiBUZXN0Q29tbWFuZFR5cGUpIHtcclxuICAgICAgICBPbW5pLnJlcXVlc3Qoc29sdXRpb24gPT4gc29sdXRpb24uZ2V0dGVzdGNvbnRleHQoeyBUeXBlOiA8YW55PnR5cGUgfSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZXhlY3V0ZVRlc3RzKHJlc3BvbnNlOiBNb2RlbHMuR2V0VGVzdENvbW1hbmRSZXNwb25zZSkge1xyXG4gICAgICAgIHRoaXMudGVzdFJlc3VsdHMubGVuZ3RoID0gMDtcclxuICAgICAgICB0aGlzLmxhc3RSdW4gPSByZXNwb25zZTtcclxuXHJcbiAgICAgICAgdGhpcy5fdGVzdFdpbmRvdy5jbGVhcigpO1xyXG5cclxuICAgICAgICBjb25zdCBjaGlsZCA9IGNoaWxkUHJvY2Vzcy5leGVjKHJlc3BvbnNlLlRlc3RDb21tYW5kLCB7IGN3ZDogcmVzcG9uc2UuRGlyZWN0b3J5IH0pO1xyXG5cclxuICAgICAgICBjaGlsZC5zdGRvdXQub24oXCJkYXRhXCIsIChkYXRhOiBhbnkpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5fdGVzdFdpbmRvdy5hZGRNZXNzYWdlKHsgbWVzc2FnZTogZGF0YSwgbG9nTGV2ZWw6IFwiXCIgfSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGNoaWxkLnN0ZGVyci5vbihcImRhdGFcIiwgKGRhdGE6IGFueSkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLl90ZXN0V2luZG93LmFkZE1lc3NhZ2UoeyBtZXNzYWdlOiBkYXRhLCBsb2dMZXZlbDogXCJmYWlsXCIgfSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGRvY2suc2VsZWN0V2luZG93KFwidGVzdC1vdXRwdXRcIik7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBlbnN1cmVXaW5kb3dJc0NyZWF0ZWQoKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLndpbmRvdykge1xyXG4gICAgICAgICAgICB0aGlzLndpbmRvdyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcblxyXG4gICAgICAgICAgICBjb25zdCB3aW5kb3dEaXNwb3NhYmxlID0gZG9jay5hZGRXaW5kb3coXCJ0ZXN0LW91dHB1dFwiLCBcIlRlc3Qgb3V0cHV0XCIsIHRoaXMuX3Rlc3RXaW5kb3csIHsgcHJpb3JpdHk6IDIwMDAsIGNsb3NlYWJsZTogdHJ1ZSB9LCB0aGlzLndpbmRvdyk7XHJcbiAgICAgICAgICAgIHRoaXMud2luZG93LmFkZCh3aW5kb3dEaXNwb3NhYmxlKTtcclxuICAgICAgICAgICAgdGhpcy53aW5kb3cuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5yZW1vdmUodGhpcy53aW5kb3cpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy53aW5kb3cgPSBudWxsO1xyXG4gICAgICAgICAgICB9KSk7XHJcbiAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQodGhpcy53aW5kb3cpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVxdWlyZWQgPSB0cnVlO1xyXG4gICAgcHVibGljIHRpdGxlID0gXCJUZXN0IFJ1bm5lclwiO1xyXG4gICAgcHVibGljIGRlc2NyaXB0aW9uID0gXCJBZGRzIHN1cHBvcnQgZm9yIHJ1bm5pbmcgdGVzdHMgd2l0aGluIGF0b20uXCI7XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBydW5UZXN0cyA9IG5ldyBSdW5UZXN0cztcclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
