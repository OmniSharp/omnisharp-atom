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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9ydW4tdGVzdHMuanMiLCJsaWIvZmVhdHVyZXMvcnVuLXRlc3RzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztJQ0NZOzs7Ozs7QUFHWixJQUFLLGVBQUw7QUFBQSxDQUFBLFVBQUssZUFBTCxFQUFvQjtBQUNoQixvQkFBQSxnQkFBQSxLQUFBLElBQUEsQ0FBQSxDQUFBLEdBQUEsS0FBQSxDQURnQjtBQUVoQixvQkFBQSxnQkFBQSxTQUFBLElBQUEsQ0FBQSxDQUFBLEdBQUEsU0FBQSxDQUZnQjtBQUdoQixvQkFBQSxnQkFBQSxRQUFBLElBQUEsQ0FBQSxDQUFBLEdBQUEsUUFBQSxDQUhnQjtDQUFwQixDQUFBLENBQUssb0JBQUEsa0JBQWUsRUFBZixDQUFBLENBQUw7O0lBTUE7QUFBQSx3QkFBQTs7O0FBR1csYUFBQSxXQUFBLEdBQStCLEVBQS9CLENBSFg7QUFtRlcsYUFBQSxRQUFBLEdBQVcsSUFBWCxDQW5GWDtBQW9GVyxhQUFBLEtBQUEsR0FBUSxhQUFSLENBcEZYO0FBcUZXLGFBQUEsV0FBQSxHQUFjLDZDQUFkLENBckZYO0tBQUE7Ozs7bUNBV21COzs7QUFDWCxpQkFBSyxVQUFMLEdBQWtCLHdDQUFsQixDQURXO0FBRVgsaUJBQUssV0FBTCxHQUFtQiwwQ0FBbkIsQ0FGVztBQUlYLGdCQUFNLFNBQVMsbUJBQVQsQ0FKSztBQUtYLGlCQUFLLE9BQUwsR0FBZTtBQUNYLHdCQUEwQyxNQUExQzthQURKLENBTFc7QUFTWCxpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLFdBQUssUUFBTCxDQUFjLGNBQWQsQ0FBNkIsU0FBN0IsQ0FBdUMsVUFBQyxJQUFELEVBQUs7QUFDNUQsc0JBQUsscUJBQUwsR0FENEQ7QUFFNUQsc0JBQUssWUFBTCxDQUFrQixLQUFLLFFBQUwsQ0FBbEIsQ0FGNEQ7YUFBTCxDQUEzRCxFQVRXO0FBY1gsaUJBQUssVUFB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cnQgeyBTdWJqZWN0IH0gZnJvbSBcInJ4anNcIjtcbmltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUsIERpc3Bvc2FibGUgfSBmcm9tIFwidHMtZGlzcG9zYWJsZXNcIjtcbmltcG9ydCB7IE9tbmkgfSBmcm9tIFwiLi4vc2VydmVyL29tbmlcIjtcbmltcG9ydCB7IGRvY2sgfSBmcm9tIFwiLi4vYXRvbS9kb2NrXCI7XG5pbXBvcnQgeyBUZXN0UmVzdWx0c1dpbmRvdyB9IGZyb20gXCIuLi92aWV3cy90ZXN0LXJlc3VsdHMtd2luZG93XCI7XG5pbXBvcnQgKiBhcyBjaGlsZFByb2Nlc3MgZnJvbSBcImNoaWxkX3Byb2Nlc3NcIjtcbnZhciBUZXN0Q29tbWFuZFR5cGU7XG4oZnVuY3Rpb24gKFRlc3RDb21tYW5kVHlwZSkge1xuICAgIFRlc3RDb21tYW5kVHlwZVtUZXN0Q29tbWFuZFR5cGVbXCJBbGxcIl0gPSAwXSA9IFwiQWxsXCI7XG4gICAgVGVzdENvbW1hbmRUeXBlW1Rlc3RDb21tYW5kVHlwZVtcIkZpeHR1cmVcIl0gPSAxXSA9IFwiRml4dHVyZVwiO1xuICAgIFRlc3RDb21tYW5kVHlwZVtUZXN0Q29tbWFuZFR5cGVbXCJTaW5nbGVcIl0gPSAyXSA9IFwiU2luZ2xlXCI7XG59KShUZXN0Q29tbWFuZFR5cGUgfHwgKFRlc3RDb21tYW5kVHlwZSA9IHt9KSk7XG5jbGFzcyBSdW5UZXN0cyB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMudGVzdFJlc3VsdHMgPSBbXTtcbiAgICAgICAgdGhpcy5yZXF1aXJlZCA9IHRydWU7XG4gICAgICAgIHRoaXMudGl0bGUgPSBcIlRlc3QgUnVubmVyXCI7XG4gICAgICAgIHRoaXMuZGVzY3JpcHRpb24gPSBcIkFkZHMgc3VwcG9ydCBmb3IgcnVubmluZyB0ZXN0cyB3aXRoaW4gYXRvbS5cIjtcbiAgICB9XG4gICAgYWN0aXZhdGUoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIHRoaXMuX3Rlc3RXaW5kb3cgPSBuZXcgVGVzdFJlc3VsdHNXaW5kb3c7XG4gICAgICAgIGNvbnN0IG91dHB1dCA9IG5ldyBTdWJqZWN0KCk7XG4gICAgICAgIHRoaXMub2JzZXJ2ZSA9IHtcbiAgICAgICAgICAgIG91dHB1dDogb3V0cHV0XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5saXN0ZW5lci5nZXR0ZXN0Y29udGV4dC5zdWJzY3JpYmUoKGRhdGEpID0+IHtcbiAgICAgICAgICAgIHRoaXMuZW5zdXJlV2luZG93SXNDcmVhdGVkKCk7XG4gICAgICAgICAgICB0aGlzLmV4ZWN1dGVUZXN0cyhkYXRhLnJlc3BvbnNlKTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuYWRkVGV4dEVkaXRvckNvbW1hbmQoXCJvbW5pc2hhcnAtYXRvbTpydW4tYWxsLXRlc3RzXCIsICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMubWFrZVJlcXVlc3QoVGVzdENvbW1hbmRUeXBlLkFsbCk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmFkZFRleHRFZGl0b3JDb21tYW5kKFwib21uaXNoYXJwLWF0b206cnVuLWZpeHR1cmUtdGVzdHNcIiwgKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5tYWtlUmVxdWVzdChUZXN0Q29tbWFuZFR5cGUuRml4dHVyZSk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmFkZFRleHRFZGl0b3JDb21tYW5kKFwib21uaXNoYXJwLWF0b206cnVuLXNpbmdsZS10ZXN0XCIsICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMubWFrZVJlcXVlc3QoVGVzdENvbW1hbmRUeXBlLlNpbmdsZSk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmFkZFRleHRFZGl0b3JDb21tYW5kKFwib21uaXNoYXJwLWF0b206cnVuLWxhc3QtdGVzdFwiLCAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmV4ZWN1dGVUZXN0cyh0aGlzLmxhc3RSdW4pO1xuICAgICAgICB9KSk7XG4gICAgfVxuICAgIGRpc3Bvc2UoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfVxuICAgIG1ha2VSZXF1ZXN0KHR5cGUpIHtcbiAgICAgICAgT21uaS5yZXF1ZXN0KHNvbHV0aW9uID0+IHNvbHV0aW9uLmdldHRlc3Rjb250ZXh0KHsgVHlwZTogdHlwZSB9KSk7XG4gICAgfVxuICAgIGV4ZWN1dGVUZXN0cyhyZXNwb25zZSkge1xuICAgICAgICB0aGlzLnRlc3RSZXN1bHRzLmxlbmd0aCA9IDA7XG4gICAgICAgIHRoaXMubGFzdFJ1biA9IHJlc3BvbnNlO1xuICAgICAgICB0aGlzLl90ZXN0V2luZG93LmNsZWFyKCk7XG4gICAgICAgIGNvbnN0IGNoaWxkID0gY2hpbGRQcm9jZXNzLmV4ZWMocmVzcG9uc2UuVGVzdENvbW1hbmQsIHsgY3dkOiByZXNwb25zZS5EaXJlY3RvcnkgfSk7XG4gICAgICAgIGNoaWxkLnN0ZG91dC5vbihcImRhdGFcIiwgKGRhdGEpID0+IHtcbiAgICAgICAgICAgIHRoaXMuX3Rlc3RXaW5kb3cuYWRkTWVzc2FnZSh7IG1lc3NhZ2U6IGRhdGEsIGxvZ0xldmVsOiBcIlwiIH0pO1xuICAgICAgICB9KTtcbiAgICAgICAgY2hpbGQuc3RkZXJyLm9uKFwiZGF0YVwiLCAoZGF0YSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5fdGVzdFdpbmRvdy5hZGRNZXNzYWdlKHsgbWVzc2FnZTogZGF0YSwgbG9nTGV2ZWw6IFwiZmFpbFwiIH0pO1xuICAgICAgICB9KTtcbiAgICAgICAgZG9jay5zZWxlY3RXaW5kb3coXCJ0ZXN0LW91dHB1dFwiKTtcbiAgICB9XG4gICAgZW5zdXJlV2luZG93SXNDcmVhdGVkKCkge1xuICAgICAgICBpZiAoIXRoaXMud2luZG93KSB7XG4gICAgICAgICAgICB0aGlzLndpbmRvdyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgICAgICBjb25zdCB3aW5kb3dEaXNwb3NhYmxlID0gZG9jay5hZGRXaW5kb3coXCJ0ZXN0LW91dHB1dFwiLCBcIlRlc3Qgb3V0cHV0XCIsIHRoaXMuX3Rlc3RXaW5kb3csIHsgcHJpb3JpdHk6IDIwMDAsIGNsb3NlYWJsZTogdHJ1ZSB9LCB0aGlzLndpbmRvdyk7XG4gICAgICAgICAgICB0aGlzLndpbmRvdy5hZGQod2luZG93RGlzcG9zYWJsZSk7XG4gICAgICAgICAgICB0aGlzLndpbmRvdy5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5yZW1vdmUodGhpcy53aW5kb3cpO1xuICAgICAgICAgICAgICAgIHRoaXMud2luZG93ID0gbnVsbDtcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQodGhpcy53aW5kb3cpO1xuICAgICAgICB9XG4gICAgfVxufVxuZXhwb3J0IGNvbnN0IHJ1blRlc3RzID0gbmV3IFJ1blRlc3RzO1xuIiwiaW1wb3J0IHtNb2RlbHN9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XHJcbmltcG9ydCB7T2JzZXJ2YWJsZSwgU3ViamVjdH0gZnJvbSBcInJ4anNcIjtcclxuaW1wb3J0IHtDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlfSBmcm9tIFwidHMtZGlzcG9zYWJsZXNcIjtcclxuaW1wb3J0IHtPbW5pfSBmcm9tIFwiLi4vc2VydmVyL29tbmlcIjtcclxuaW1wb3J0IHtkb2NrfSBmcm9tIFwiLi4vYXRvbS9kb2NrXCI7XHJcbmltcG9ydCB7VGVzdFJlc3VsdHNXaW5kb3d9IGZyb20gXCIuLi92aWV3cy90ZXN0LXJlc3VsdHMtd2luZG93XCI7XHJcbmltcG9ydCAqIGFzIGNoaWxkUHJvY2VzcyBmcm9tIFwiY2hpbGRfcHJvY2Vzc1wiO1xyXG5cclxuLy8gVXNpbmcgdGhpcyBlbnVtIGFzIHRoZSBPbW5pc2hhcnAgb25lIGlzIGZyZWFraW5nIG91dC5cclxuZW51bSBUZXN0Q29tbWFuZFR5cGUge1xyXG4gICAgQWxsID0gMCxcclxuICAgIEZpeHR1cmUgPSAxLFxyXG4gICAgU2luZ2xlID0gMlxyXG59XHJcblxyXG5jbGFzcyBSdW5UZXN0cyBpbXBsZW1lbnRzIElGZWF0dXJlIHtcclxuICAgIHByaXZhdGUgZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxuICAgIHByaXZhdGUgd2luZG93OiBDb21wb3NpdGVEaXNwb3NhYmxlO1xyXG4gICAgcHVibGljIHRlc3RSZXN1bHRzOiBPdXRwdXRNZXNzYWdlW10gPSBbXTtcclxuICAgIHByaXZhdGUgbGFzdFJ1bjogTW9kZWxzLkdldFRlc3RDb21tYW5kUmVzcG9uc2U7XHJcbiAgICBwcml2YXRlIF90ZXN0V2luZG93OiBUZXN0UmVzdWx0c1dpbmRvdztcclxuXHJcbiAgICBwdWJsaWMgb2JzZXJ2ZToge1xyXG4gICAgICAgIG91dHB1dDogT2JzZXJ2YWJsZTxPdXRwdXRNZXNzYWdlW10+O1xyXG4gICAgfTtcclxuXHJcbiAgICBwdWJsaWMgYWN0aXZhdGUoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgICAgICB0aGlzLl90ZXN0V2luZG93ID0gbmV3IFRlc3RSZXN1bHRzV2luZG93O1xyXG5cclxuICAgICAgICBjb25zdCBvdXRwdXQgPSBuZXcgU3ViamVjdDxPdXRwdXRNZXNzYWdlW10+KCk7XHJcbiAgICAgICAgdGhpcy5vYnNlcnZlID0ge1xyXG4gICAgICAgICAgICBvdXRwdXQ6IDxPYnNlcnZhYmxlPE91dHB1dE1lc3NhZ2VbXT4+PGFueT5vdXRwdXRcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkubGlzdGVuZXIuZ2V0dGVzdGNvbnRleHQuc3Vic2NyaWJlKChkYXRhKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuZW5zdXJlV2luZG93SXNDcmVhdGVkKCk7XHJcbiAgICAgICAgICAgIHRoaXMuZXhlY3V0ZVRlc3RzKGRhdGEucmVzcG9uc2UpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmFkZFRleHRFZGl0b3JDb21tYW5kKFwib21uaXNoYXJwLWF0b206cnVuLWFsbC10ZXN0c1wiLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMubWFrZVJlcXVlc3QoVGVzdENvbW1hbmRUeXBlLkFsbCk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuYWRkVGV4dEVkaXRvckNvbW1hbmQoXCJvbW5pc2hhcnAtYXRvbTpydW4tZml4dHVyZS10ZXN0c1wiLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMubWFrZVJlcXVlc3QoVGVzdENvbW1hbmRUeXBlLkZpeHR1cmUpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmFkZFRleHRFZGl0b3JDb21tYW5kKFwib21uaXNoYXJwLWF0b206cnVuLXNpbmdsZS10ZXN0XCIsICgpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5tYWtlUmVxdWVzdChUZXN0Q29tbWFuZFR5cGUuU2luZ2xlKTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5hZGRUZXh0RWRpdG9yQ29tbWFuZChcIm9tbmlzaGFycC1hdG9tOnJ1bi1sYXN0LXRlc3RcIiwgKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLmV4ZWN1dGVUZXN0cyh0aGlzLmxhc3RSdW4pO1xyXG4gICAgICAgIH0pKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGlzcG9zZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgbWFrZVJlcXVlc3QodHlwZTogVGVzdENvbW1hbmRUeXBlKSB7XHJcbiAgICAgICAgT21uaS5yZXF1ZXN0KHNvbHV0aW9uID0+IHNvbHV0aW9uLmdldHRlc3Rjb250ZXh0KHsgVHlwZTogPGFueT50eXBlIH0pKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGV4ZWN1dGVUZXN0cyhyZXNwb25zZTogTW9kZWxzLkdldFRlc3RDb21tYW5kUmVzcG9uc2UpIHtcclxuICAgICAgICB0aGlzLnRlc3RSZXN1bHRzLmxlbmd0aCA9IDA7XHJcbiAgICAgICAgdGhpcy5sYXN0UnVuID0gcmVzcG9uc2U7XHJcblxyXG4gICAgICAgIHRoaXMuX3Rlc3RXaW5kb3cuY2xlYXIoKTtcclxuXHJcbiAgICAgICAgY29uc3QgY2hpbGQgPSBjaGlsZFByb2Nlc3MuZXhlYyhyZXNwb25zZS5UZXN0Q29tbWFuZCwgeyBjd2Q6IHJlc3BvbnNlLkRpcmVjdG9yeSB9KTtcclxuXHJcbiAgICAgICAgY2hpbGQuc3Rkb3V0Lm9uKFwiZGF0YVwiLCAoZGF0YTogYW55KSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuX3Rlc3RXaW5kb3cuYWRkTWVzc2FnZSh7IG1lc3NhZ2U6IGRhdGEsIGxvZ0xldmVsOiBcIlwiIH0pO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBjaGlsZC5zdGRlcnIub24oXCJkYXRhXCIsIChkYXRhOiBhbnkpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5fdGVzdFdpbmRvdy5hZGRNZXNzYWdlKHsgbWVzc2FnZTogZGF0YSwgbG9nTGV2ZWw6IFwiZmFpbFwiIH0pO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBkb2NrLnNlbGVjdFdpbmRvdyhcInRlc3Qtb3V0cHV0XCIpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZW5zdXJlV2luZG93SXNDcmVhdGVkKCkge1xyXG4gICAgICAgIGlmICghdGhpcy53aW5kb3cpIHtcclxuICAgICAgICAgICAgdGhpcy53aW5kb3cgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG5cclxuICAgICAgICAgICAgY29uc3Qgd2luZG93RGlzcG9zYWJsZSA9IGRvY2suYWRkV2luZG93KFwidGVzdC1vdXRwdXRcIiwgXCJUZXN0IG91dHB1dFwiLCB0aGlzLl90ZXN0V2luZG93LCB7IHByaW9yaXR5OiAyMDAwLCBjbG9zZWFibGU6IHRydWUgfSwgdGhpcy53aW5kb3cpO1xyXG4gICAgICAgICAgICB0aGlzLndpbmRvdy5hZGQod2luZG93RGlzcG9zYWJsZSk7XHJcbiAgICAgICAgICAgIHRoaXMud2luZG93LmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUucmVtb3ZlKHRoaXMud2luZG93KTtcclxuICAgICAgICAgICAgICAgIHRoaXMud2luZG93ID0gbnVsbDtcclxuICAgICAgICAgICAgfSkpO1xyXG4gICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKHRoaXMud2luZG93KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlcXVpcmVkID0gdHJ1ZTtcclxuICAgIHB1YmxpYyB0aXRsZSA9IFwiVGVzdCBSdW5uZXJcIjtcclxuICAgIHB1YmxpYyBkZXNjcmlwdGlvbiA9IFwiQWRkcyBzdXBwb3J0IGZvciBydW5uaW5nIHRlc3RzIHdpdGhpbiBhdG9tLlwiO1xyXG59XHJcblxyXG5leHBvcnQgY29uc3QgcnVuVGVzdHMgPSBuZXcgUnVuVGVzdHM7XHJcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
