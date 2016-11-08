"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Solution = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _rxjs = require("rxjs");

var _tsDisposables = require("ts-disposables");

var _omnisharpClient = require("omnisharp-client");

var _viewModel = require("./view-model");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Solution = function (_ReactiveClient) {
    _inherits(Solution, _ReactiveClient);

    function Solution(options) {
        _classCallCheck(this, Solution);

        var _this = _possibleConstructorReturn(this, (Solution.__proto__ || Object.getPrototypeOf(Solution)).call(this, _lodash2.default.defaults(options, { runtime: _omnisharpClient.Runtime.CoreClr })));

        _this.temporary = false;
        _this._solutionDisposable = new _tsDisposables.CompositeDisposable();
        _this._isFolderPerFile = false;
        _this.configureSolution();
        _this.temporary = options.temporary;
        _this.model = new _viewModel.ViewModel(_this);
        _this.path = options.projectPath;
        _this.index = options.index;
        _this.repository = options.repository;
        _this.setupRepository();
        _this._solutionDisposable.add(_this.model);
        _this.registerFixup(function (action, request, opts) {
            return _this._fixupRequest(action, request);
        });
        return _this;
    }

    _createClass(Solution, [{
        key: "connect",
        value: function connect() {
            if (this.isDisposed) return;
            if (this.currentState >= _omnisharpClient.DriverState.Downloading && this.currentState <= _omnisharpClient.DriverState.Connected) return;
            _get(Solution.prototype.__proto__ || Object.getPrototypeOf(Solution.prototype), "connect", this).call(this);
            this.log("Starting OmniSharp server (pid:" + this.id + ")");
            this.log("OmniSharp Location: " + this.serverPath);
            this.log("Change the location that OmniSharp is loaded from by setting the OMNISHARP environment variable");
            this.log("OmniSharp Path: " + this.projectPath);
        }
    }, {
        key: "disconnect",
        value: function disconnect() {
            _get(Solution.prototype.__proto__ || Object.getPrototypeOf(Solution.prototype), "disconnect", this).call(this);
            this.log("Omnisharp server stopped.");
        }
    }, {
        key: "dispose",
        value: function dispose() {
            _get(Solution.prototype.__proto__ || Object.getPrototypeOf(Solution.prototype), "dispose", this).call(this);
            this._solutionDisposable.dispose();
        }
    }, {
        key: "configureSolution",
        value: function configureSolution() {
            this.logs = this.events.map(function (event) {
                return {
                    message: event.Body && event.Body.Message || event.Event || "",
                    logLevel: event.Body && event.Body.LogLevel || event.Type === "error" && "ERROR" || "INFORMATION"
                };
            });
            this._solutionDisposable.add(this.errors.subscribe(function (exception) {
                console.error(exception);
            }));
            this._solutionDisposable.add(this.responses.subscribe(function (data) {
                if (atom.config.get("omnisharp-atom.developerMode")) {
                    console.log("omni:" + data.command, data.request, data.response);
                }
            }));
        }
    }, {
        key: "withEditor",
        value: function withEditor(editor) {
            this._currentEditor = editor;
            return this;
        }
    }, {
        key: "_fixupRequest",
        value: function _fixupRequest(action, request) {
            if (this._currentEditor && _lodash2.default.isObject(request)) {
                var editor = this._currentEditor;
                var marker = editor.getCursorBufferPosition();
                var computedChanges = null;
                if (!_lodash2.default.some(["/goto", "/navigate", "/find", "/package"], function (x) {
                    return _lodash2.default.startsWith(action, x);
                })) {
                    computedChanges = editor.omnisharp.popChanges();
                }
                _lodash2.default.defaults(request, { Column: marker.column, Line: marker.row, FileName: editor.getURI(), Changes: computedChanges });
            }
            if (request["Buffer"]) {
                request["Buffer"] = request["Buffer"].replace(Solution._regex, "");
            }
        }
    }, {
        key: "request",
        value: function request(action, _request, options) {
            if (this._currentEditor) {
                var editor = this._currentEditor;
                this._currentEditor = null;
                if (editor.isDestroyed()) {
                    return _rxjs.Observable.empty();
                }
            }
            var tempR = _request;
            if (tempR && _lodash2.default.endsWith(tempR.FileName, ".json")) {
                tempR.Buffer = null;
                tempR.Changes = null;
            }
            return _get(Solution.prototype.__proto__ || Object.getPrototypeOf(Solution.prototype), "request", this).call(this, action, _request, options);
        }
    }, {
        key: "setupRepository",
        value: function setupRepository() {
            var _this2 = this;

            if (this.repository) {
                (function () {
                    var branchSubject = new _rxjs.Subject();
                    _this2._solutionDisposable.add(branchSubject.distinctUntilChanged().subscribe(function () {
                        return atom.commands.dispatch(atom.views.getView(atom.workspace), "omnisharp-atom:restart-server");
                    }));
                    _this2._solutionDisposable.add(_this2.repository.onDidChangeStatuses(function () {
                        branchSubject.next(_this2.repository.branch);
                    }));
                })();
            }
        }
    }, {
        key: "whenConnected",
        value: function whenConnected() {
            return this.state.startWith(this.currentState).filter(function (x) {
                return x === _omnisharpClient.DriverState.Connected;
            }).take(1);
        }
    }, {
        key: "disposable",
        get: function get() {
            return this._solutionDisposable;
        }
    }, {
        key: "isDisposed",
        get: function get() {
            return this._solutionDisposable.isDisposed;
        }
    }, {
        key: "isFolderPerFile",
        get: function get() {
            return this._isFolderPerFile;
        },
        set: function set(value) {
            this._isFolderPerFile = value;
        }
    }]);

    return Solution;
}(_omnisharpClient.ReactiveClient);

exports.Solution = Solution;

Solution._regex = new RegExp(String.fromCharCode(0xFFFD), "g");
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9zZXJ2ZXIvc29sdXRpb24uanMiLCJsaWIvc2VydmVyL3NvbHV0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBQUE7Ozs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7Ozs7Ozs7OztJQ1VBOzs7QUFrQkksc0JBQVksT0FBWixFQUFvQzs7O3dIQUMxQixpQkFBRSxRQUFGLENBQVcsT0FBWCxFQUFvQixFQUFFLFNBQVMseUJBQVEsT0FBUixFQUEvQixJQUQwQjs7QUFYN0IsY0FBQSxTQUFBLEdBQXFCLEtBQXJCLENBVzZCO0FBVjVCLGNBQUEsbUJBQUEsR0FBc0Isd0NBQXRCLENBVTRCO0FBSjVCLGNBQUEsZ0JBQUEsR0FBbUIsS0FBbkIsQ0FJNEI7QUFFaEMsY0FBSyxpQkFBTCxHQUZnQztBQUdoQyxjQUFLLFNBQUwsR0FBaUIsUUFBUSxTQUFSLENBSGU7QUFJaEMsY0FBSyxLQUFMLEdBQWEsK0JBQWIsQ0FKZ0M7QUFLaEMsY0FBSyxJQUFMLEdBQVksUUFBUSxXQUFSLENBTG9CO0FBTWhDLGNBQUssS0FBTCxHQUFhLFFBQVEsS0FBUixDQU5tQjtBQU9oQyxjQUFLLFVBQUwsR0FBa0IsUUFBUSxVQUFSLENBUGM7QUFRaEMsY0FBSyxlQUFMLEdBUmdDO0FBU2hDLGNBQUssbUJBQUwsQ0FBeUIsR0FBekIsQ0FBNkIsTUFBSyxLQUFMLENBQTdCLENBVGdDO0FBV2hDLGNBQUssYUFBTCxDQUFtQixVQUFDLE1BQUQsRUFBaUIsT0FBakIsRUFBK0IsSUFBL0I7bUJBQXlELE1BQUssYUFBTCxDQUFtQixNQUFuQixFQUEyQixPQUEzQjtTQUF6RCxDQUFuQixDQVhnQzs7S0FBcEM7Ozs7a0NBY2M7QUFDVixnQkFBSSxLQUFLLFVBQUwsRUFBaUIsT0FBckI7QUFDQSxnQkFBSSxLQUFLLFlBQUwsSUFBcUIsNkJBQVksV0FBWixJQUEyQixLQUFLLFlBQUwsSUFBcUIsNkJBQVksU0FBWixFQUF1QixPQUFoRztBQUNBLHdIQUhVO0FBS1YsaUJBQUssR0FBTCxDQUFTLG9DQUFvQyxLQUFLLEVBQUwsR0FBVSxHQUE5QyxDQUFULENBTFU7QUFNVixpQkFBSyxHQUFMLENBQVMseUJBQXlCLEtBQUssVUFBTCxDQUFsQyxDQU5VO0FBT1YsaUJBQUssR0FBTCxDQUFTLGlHQUFULEVBUFU7QUFRVixpQkFBSyxHQUFMLENBQVMscUJBQXFCLEtBQUssV0FBTCxDQUE5QixDQVJVOzs7O3FDQVdHO0FBQ2IsMkhBRGE7QUFHYixpQkFBSyxHQUFMLENBQVMsMkJBQVQsRUFIYTs7OztrQ0FNSDtBQUNWLHdIQURVO0FBRVYsaUJBQUssbUJBQUwsQ0FBeUIsT0FBekIsR0FGVTs7Ozs0Q0FLVztBQUNyQixpQkFBSyxJQUFMLEdBQVksS0FBSyxNQUFMLENBQVksR0FBWixDQUFnQjt1QkFBVTtBQUNsQyw2QkFBUyxNQUFNLElBQU4sSUFBYyxNQUFNLElBQU4sQ0FBVyxPQUFYLElBQXNCLE1BQU0sS0FBTixJQUFlLEVBQW5EO0FBQ1QsOEJBQVUsTUFBTSxJQUFOLElBQWMsTUFBTSxJQUFOLENBQVcsUUFBWCxJQUF3QixNQUFNLElBQU4sS0FBZSxPQUFmLElBQTBCLE9BQTFCLElBQXNDLGFBQTVFOzthQUZjLENBQTVCLENBRHFCO0FBTXJCLGlCQUFLLG1CQUFMLENBQXlCLEdBQXpCLENBQTZCLEtBQUssTUFBTCxDQUFZLFNBQVosQ0FBc0IscUJBQVM7QUFDeEQsd0JBQVEsS0FBUixDQUFjLFNBQWQsRUFEd0Q7YUFBVCxDQUFuRCxFQU5xQjtBQVVyQixpQkFBSyxtQkFBTCxDQUF5QixHQUF6QixDQUE2QixLQUFLLFNBQUwsQ0FBZSxTQUFmLENBQXlCLGdCQUFJO0FBQ3RELG9CQUFJLEtBQUssTUFBTCxDQUFZLEdBQVosQ0FBZ0IsOEJBQWhCLENBQUosRUFBcUQ7QUFDakQsNEJBQVEsR0FBUixDQUFZLFVBQVUsS0FBSyxPQUFMLEVBQWMsS0FBSyxPQUFMLEVBQWMsS0FBSyxRQUFMLENBQWxELENBRGlEO2lCQUFyRDthQURrRCxDQUF0RCxFQVZxQjs7OzttQ0FrQlAsUUFBMkI7QUFDekMsaUJBQUssY0FBTCxHQUFzQixNQUF0QixDQUR5QztBQUV6QyxtQkFBTyxJQUFQLENBRnlDOzs7O3NDQUtGLFFBQWdCLFNBQWlCO0FBRXhFLGdCQUFJLEtBQUssY0FBTCxJQUF1QixpQkFBRSxRQUFGLENBQVcsT0FBWCxDQUF2QixFQUE0QztBQUM1QyxvQkFBTSxTQUFTLEtBQUssY0FBTCxDQUQ2QjtBQUU1QyxvQkFBTSxTQUFTLE9BQU8sdUJBQVAsRUFBVCxDQUZzQztBQUc1QyxvQkFBSSxrQkFBdUQsSUFBdkQsQ0FId0M7QUFJNUMsb0JBQUksQ0FBQyxpQkFBRSxJQUFGLENBQU8sQ0FBQyxPQUFELEVBQVUsV0FBVixFQUF1QixPQUF2QixFQUFnQyxVQUFoQyxDQUFQLEVBQW9EOzJCQUFLLGlCQUFFLFVBQUYsQ0FBYSxNQUFiLEVBQXFCLENBQXJCO2lCQUFMLENBQXJELEVBQW9GO0FBQ3BGLHNDQUFrQixPQUFPLFNBQVAsQ0FBaUIsVUFBakIsRUFBbEIsQ0FEb0Y7aUJBQXhGO0FBSUEsaUNBQUUsUUFBRixDQUFXLE9BQVgsRUFBb0IsRUFBRSxRQUFRLE9BQU8sTUFBUCxFQUFlLE1BQU0sT0FBTyxHQUFQLEVBQVksVUFBVSxPQUFPLE1BQVAsRUFBVixFQUEyQixTQUFTLGVBQVQsRUFBMUYsRUFSNEM7YUFBaEQ7QUFZQSxnQkFBSSxRQUFRLFFBQVIsQ0FBSixFQUF1QjtBQUNuQix3QkFBUSxRQUFSLElBQW9CLFFBQVEsUUFBUixFQUFrQixPQUFsQixDQUEwQixTQUFTLE1BQVQsRUFBaUIsRUFBM0MsQ0FBcEIsQ0FEbUI7YUFBdkI7Ozs7Z0NBTWdDLFFBQWdCLFVBQW9CLFNBQXdCO0FBQzVGLGdCQUFJLEtBQUssY0FBTCxFQUFxQjtBQUNyQixvQkFBTSxTQUFTLEtBQUssY0FBTCxDQURNO0FBRXJCLHFCQUFLLGNBQUwsR0FBc0IsSUFBdEIsQ0FGcUI7QUFJckIsb0JBQUksT0FBTyxXQUFQLEVBQUosRUFBMEI7QUFDdEIsMkJBQU8saUJBQVcsS0FBWCxFQUFQLENBRHNCO2lCQUExQjthQUpKO0FBU0EsZ0JBQU0sUUFBd0IsUUFBeEIsQ0FWc0Y7QUFXNUYsZ0JBQUksU0FBUyxpQkFBRSxRQUFGLENBQVcsTUFBTSxRQUFOLEVBQWdCLE9BQTNCLENBQVQsRUFBOEM7QUFDOUMsc0JBQU0sTUFBTixHQUFlLElBQWYsQ0FEOEM7QUFFOUMsc0JBQU0sT0FBTixHQUFnQixJQUFoQixDQUY4QzthQUFsRDtBQUtBLCtIQUErQyxRQUFRLFVBQVMsUUFBaEUsQ0FoQjRGOzs7OzBDQW1CekU7OztBQUNuQixnQkFBSSxLQUFLLFVBQUwsRUFBaUI7O0FBQ2pCLHdCQUFNLGdCQUFnQixtQkFBaEI7QUFFTiwyQkFBSyxtQkFBTCxDQUF5QixHQUF6QixDQUE2QixjQUN4QixvQkFEd0IsR0FFeEIsU0FGd0IsQ0FFZDsrQkFBTSxLQUFLLFFBQUwsQ0FBYyxRQUFkLENBQXVCLEtBQUssS0FBTCxDQUFXLE9BQVgsQ0FBbUIsS0FBSyxTQUFMLENBQTFDLEVBQTJELCtCQUEzRDtxQkFBTixDQUZmO0FBSUEsMkJBQUssbUJBQUwsQ0FBeUIsR0FBekIsQ0FBNkIsT0FBSyxVQUFMLENBQWdCLG1CQUFoQixDQUFvQyxZQUFBO0FBQzdELHNDQUFjLElBQWQsQ0FBeUIsT0FBSyxVQUFMLENBQWlCLE1BQWpCLENBQXpCLENBRDZEO3FCQUFBLENBQWpFO3FCQVBpQjthQUFyQjs7Ozt3Q0FhZ0I7QUFDaEIsbUJBQU8sS0FBSyxLQUFMLENBQVcsU0FBWCxDQUFxQixLQUFLLFlBQUwsQ0FBckIsQ0FDRixNQURFLENBQ0s7dUJBQUssTUFBTSw2QkFBWSxTQUFaO2FBQVgsQ0FETCxDQUVGLElBRkUsQ0FFRyxDQUZILENBQVAsQ0FEZ0I7Ozs7NEJBekhDO0FBQUssbUJBQU8sS0FBSyxtQkFBTCxDQUFaOzs7OzRCQUdBO0FBQUssbUJBQU8sS0FBSyxtQkFBTCxDQUF5QixVQUF6QixDQUFaOzs7OzRCQUdLO0FBQUssbUJBQU8sS0FBSyxnQkFBTCxDQUFaOzswQkFDQyxPQUFLO0FBQUksaUJBQUssZ0JBQUwsR0FBd0IsS0FBeEIsQ0FBSjs7Ozs7Ozs7O0FBZmpCLFNBQUEsTUFBQSxHQUFTLElBQUksTUFBSixDQUFXLE9BQU8sWUFBUCxDQUFvQixNQUFwQixDQUFYLEVBQXdDLEdBQXhDLENBQVQiLCJmaWxlIjoibGliL3NlcnZlci9zb2x1dGlvbi5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcbmltcG9ydCB7IE9ic2VydmFibGUsIFN1YmplY3QgfSBmcm9tIFwicnhqc1wiO1xuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSB9IGZyb20gXCJ0cy1kaXNwb3NhYmxlc1wiO1xuaW1wb3J0IHsgUmVhY3RpdmVDbGllbnQsIERyaXZlclN0YXRlLCBSdW50aW1lIH0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcbmltcG9ydCB7IFZpZXdNb2RlbCB9IGZyb20gXCIuL3ZpZXctbW9kZWxcIjtcbmV4cG9ydCBjbGFzcyBTb2x1dGlvbiBleHRlbmRzIFJlYWN0aXZlQ2xpZW50IHtcbiAgICBjb25zdHJ1Y3RvcihvcHRpb25zKSB7XG4gICAgICAgIHN1cGVyKF8uZGVmYXVsdHMob3B0aW9ucywgeyBydW50aW1lOiBSdW50aW1lLkNvcmVDbHIgfSkpO1xuICAgICAgICB0aGlzLnRlbXBvcmFyeSA9IGZhbHNlO1xuICAgICAgICB0aGlzLl9zb2x1dGlvbkRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICB0aGlzLl9pc0ZvbGRlclBlckZpbGUgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5jb25maWd1cmVTb2x1dGlvbigpO1xuICAgICAgICB0aGlzLnRlbXBvcmFyeSA9IG9wdGlvbnMudGVtcG9yYXJ5O1xuICAgICAgICB0aGlzLm1vZGVsID0gbmV3IFZpZXdNb2RlbCh0aGlzKTtcbiAgICAgICAgdGhpcy5wYXRoID0gb3B0aW9ucy5wcm9qZWN0UGF0aDtcbiAgICAgICAgdGhpcy5pbmRleCA9IG9wdGlvbnMuaW5kZXg7XG4gICAgICAgIHRoaXMucmVwb3NpdG9yeSA9IG9wdGlvbnMucmVwb3NpdG9yeTtcbiAgICAgICAgdGhpcy5zZXR1cFJlcG9zaXRvcnkoKTtcbiAgICAgICAgdGhpcy5fc29sdXRpb25EaXNwb3NhYmxlLmFkZCh0aGlzLm1vZGVsKTtcbiAgICAgICAgdGhpcy5yZWdpc3RlckZpeHVwKChhY3Rpb24sIHJlcXVlc3QsIG9wdHMpID0+IHRoaXMuX2ZpeHVwUmVxdWVzdChhY3Rpb24sIHJlcXVlc3QpKTtcbiAgICB9XG4gICAgZ2V0IGRpc3Bvc2FibGUoKSB7IHJldHVybiB0aGlzLl9zb2x1dGlvbkRpc3Bvc2FibGU7IH1cbiAgICBnZXQgaXNEaXNwb3NlZCgpIHsgcmV0dXJuIHRoaXMuX3NvbHV0aW9uRGlzcG9zYWJsZS5pc0Rpc3Bvc2VkOyB9XG4gICAgZ2V0IGlzRm9sZGVyUGVyRmlsZSgpIHsgcmV0dXJuIHRoaXMuX2lzRm9sZGVyUGVyRmlsZTsgfVxuICAgIHNldCBpc0ZvbGRlclBlckZpbGUodmFsdWUpIHsgdGhpcy5faXNGb2xkZXJQZXJGaWxlID0gdmFsdWU7IH1cbiAgICBjb25uZWN0KCkge1xuICAgICAgICBpZiAodGhpcy5pc0Rpc3Bvc2VkKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBpZiAodGhpcy5jdXJyZW50U3RhdGUgPj0gRHJpdmVyU3RhdGUuRG93bmxvYWRpbmcgJiYgdGhpcy5jdXJyZW50U3RhdGUgPD0gRHJpdmVyU3RhdGUuQ29ubmVjdGVkKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBzdXBlci5jb25uZWN0KCk7XG4gICAgICAgIHRoaXMubG9nKFwiU3RhcnRpbmcgT21uaVNoYXJwIHNlcnZlciAocGlkOlwiICsgdGhpcy5pZCArIFwiKVwiKTtcbiAgICAgICAgdGhpcy5sb2coXCJPbW5pU2hhcnAgTG9jYXRpb246IFwiICsgdGhpcy5zZXJ2ZXJQYXRoKTtcbiAgICAgICAgdGhpcy5sb2coXCJDaGFuZ2UgdGhlIGxvY2F0aW9uIHRoYXQgT21uaVNoYXJwIGlzIGxvYWRlZCBmcm9tIGJ5IHNldHRpbmcgdGhlIE9NTklTSEFSUCBlbnZpcm9ubWVudCB2YXJpYWJsZVwiKTtcbiAgICAgICAgdGhpcy5sb2coXCJPbW5pU2hhcnAgUGF0aDogXCIgKyB0aGlzLnByb2plY3RQYXRoKTtcbiAgICB9XG4gICAgZGlzY29ubmVjdCgpIHtcbiAgICAgICAgc3VwZXIuZGlzY29ubmVjdCgpO1xuICAgICAgICB0aGlzLmxvZyhcIk9tbmlzaGFycCBzZXJ2ZXIgc3RvcHBlZC5cIik7XG4gICAgfVxuICAgIGRpc3Bvc2UoKSB7XG4gICAgICAgIHN1cGVyLmRpc3Bvc2UoKTtcbiAgICAgICAgdGhpcy5fc29sdXRpb25EaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICB9XG4gICAgY29uZmlndXJlU29sdXRpb24oKSB7XG4gICAgICAgIHRoaXMubG9ncyA9IHRoaXMuZXZlbnRzLm1hcChldmVudCA9PiAoe1xuICAgICAgICAgICAgbWVzc2FnZTogZXZlbnQuQm9keSAmJiBldmVudC5Cb2R5Lk1lc3NhZ2UgfHwgZXZlbnQuRXZlbnQgfHwgXCJcIixcbiAgICAgICAgICAgIGxvZ0xldmVsOiBldmVudC5Cb2R5ICYmIGV2ZW50LkJvZHkuTG9nTGV2ZWwgfHwgKGV2ZW50LlR5cGUgPT09IFwiZXJyb3JcIiAmJiBcIkVSUk9SXCIpIHx8IFwiSU5GT1JNQVRJT05cIlxuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuX3NvbHV0aW9uRGlzcG9zYWJsZS5hZGQodGhpcy5lcnJvcnMuc3Vic2NyaWJlKGV4Y2VwdGlvbiA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGV4Y2VwdGlvbik7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5fc29sdXRpb25EaXNwb3NhYmxlLmFkZCh0aGlzLnJlc3BvbnNlcy5zdWJzY3JpYmUoZGF0YSA9PiB7XG4gICAgICAgICAgICBpZiAoYXRvbS5jb25maWcuZ2V0KFwib21uaXNoYXJwLWF0b20uZGV2ZWxvcGVyTW9kZVwiKSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwib21uaTpcIiArIGRhdGEuY29tbWFuZCwgZGF0YS5yZXF1ZXN0LCBkYXRhLnJlc3BvbnNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSkpO1xuICAgIH1cbiAgICB3aXRoRWRpdG9yKGVkaXRvcikge1xuICAgICAgICB0aGlzLl9jdXJyZW50RWRpdG9yID0gZWRpdG9yO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgX2ZpeHVwUmVxdWVzdChhY3Rpb24sIHJlcXVlc3QpIHtcbiAgICAgICAgaWYgKHRoaXMuX2N1cnJlbnRFZGl0b3IgJiYgXy5pc09iamVjdChyZXF1ZXN0KSkge1xuICAgICAgICAgICAgY29uc3QgZWRpdG9yID0gdGhpcy5fY3VycmVudEVkaXRvcjtcbiAgICAgICAgICAgIGNvbnN0IG1hcmtlciA9IGVkaXRvci5nZXRDdXJzb3JCdWZmZXJQb3NpdGlvbigpO1xuICAgICAgICAgICAgbGV0IGNvbXB1dGVkQ2hhbmdlcyA9IG51bGw7XG4gICAgICAgICAgICBpZiAoIV8uc29tZShbXCIvZ290b1wiLCBcIi9uYXZpZ2F0ZVwiLCBcIi9maW5kXCIsIFwiL3BhY2thZ2VcIl0sIHggPT4gXy5zdGFydHNXaXRoKGFjdGlvbiwgeCkpKSB7XG4gICAgICAgICAgICAgICAgY29tcHV0ZWRDaGFuZ2VzID0gZWRpdG9yLm9tbmlzaGFycC5wb3BDaGFuZ2VzKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBfLmRlZmF1bHRzKHJlcXVlc3QsIHsgQ29sdW1uOiBtYXJrZXIuY29sdW1uLCBMaW5lOiBtYXJrZXIucm93LCBGaWxlTmFtZTogZWRpdG9yLmdldFVSSSgpLCBDaGFuZ2VzOiBjb21wdXRlZENoYW5nZXMgfSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJlcXVlc3RbXCJCdWZmZXJcIl0pIHtcbiAgICAgICAgICAgIHJlcXVlc3RbXCJCdWZmZXJcIl0gPSByZXF1ZXN0W1wiQnVmZmVyXCJdLnJlcGxhY2UoU29sdXRpb24uX3JlZ2V4LCBcIlwiKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXF1ZXN0KGFjdGlvbiwgcmVxdWVzdCwgb3B0aW9ucykge1xuICAgICAgICBpZiAodGhpcy5fY3VycmVudEVkaXRvcikge1xuICAgICAgICAgICAgY29uc3QgZWRpdG9yID0gdGhpcy5fY3VycmVudEVkaXRvcjtcbiAgICAgICAgICAgIHRoaXMuX2N1cnJlbnRFZGl0b3IgPSBudWxsO1xuICAgICAgICAgICAgaWYgKGVkaXRvci5pc0Rlc3Ryb3llZCgpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuZW1wdHkoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb25zdCB0ZW1wUiA9IHJlcXVlc3Q7XG4gICAgICAgIGlmICh0ZW1wUiAmJiBfLmVuZHNXaXRoKHRlbXBSLkZpbGVOYW1lLCBcIi5qc29uXCIpKSB7XG4gICAgICAgICAgICB0ZW1wUi5CdWZmZXIgPSBudWxsO1xuICAgICAgICAgICAgdGVtcFIuQ2hhbmdlcyA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHN1cGVyLnJlcXVlc3QoYWN0aW9uLCByZXF1ZXN0LCBvcHRpb25zKTtcbiAgICB9XG4gICAgc2V0dXBSZXBvc2l0b3J5KCkge1xuICAgICAgICBpZiAodGhpcy5yZXBvc2l0b3J5KSB7XG4gICAgICAgICAgICBjb25zdCBicmFuY2hTdWJqZWN0ID0gbmV3IFN1YmplY3QoKTtcbiAgICAgICAgICAgIHRoaXMuX3NvbHV0aW9uRGlzcG9zYWJsZS5hZGQoYnJhbmNoU3ViamVjdFxuICAgICAgICAgICAgICAgIC5kaXN0aW5jdFVudGlsQ2hhbmdlZCgpXG4gICAgICAgICAgICAgICAgLnN1YnNjcmliZSgoKSA9PiBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSksIFwib21uaXNoYXJwLWF0b206cmVzdGFydC1zZXJ2ZXJcIikpKTtcbiAgICAgICAgICAgIHRoaXMuX3NvbHV0aW9uRGlzcG9zYWJsZS5hZGQodGhpcy5yZXBvc2l0b3J5Lm9uRGlkQ2hhbmdlU3RhdHVzZXMoKCkgPT4ge1xuICAgICAgICAgICAgICAgIGJyYW5jaFN1YmplY3QubmV4dCh0aGlzLnJlcG9zaXRvcnkuYnJhbmNoKTtcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICB3aGVuQ29ubmVjdGVkKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zdGF0ZS5zdGFydFdpdGgodGhpcy5jdXJyZW50U3RhdGUpXG4gICAgICAgICAgICAuZmlsdGVyKHggPT4geCA9PT0gRHJpdmVyU3RhdGUuQ29ubmVjdGVkKVxuICAgICAgICAgICAgLnRha2UoMSk7XG4gICAgfVxufVxuU29sdXRpb24uX3JlZ2V4ID0gbmV3IFJlZ0V4cChTdHJpbmcuZnJvbUNoYXJDb2RlKDB4RkZGRCksIFwiZ1wiKTtcbiIsImltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcclxuaW1wb3J0IHtPYnNlcnZhYmxlLCBTdWJqZWN0fSBmcm9tIFwicnhqc1wiO1xyXG5pbXBvcnQge0NvbXBvc2l0ZURpc3Bvc2FibGV9IGZyb20gXCJ0cy1kaXNwb3NhYmxlc1wiO1xyXG5pbXBvcnQge01vZGVscywgUmVxdWVzdE9wdGlvbnMsIFJlYWN0aXZlQ2xpZW50LCBEcml2ZXJTdGF0ZSwgUmVhY3RpdmVDbGllbnRPcHRpb25zLCBSdW50aW1lfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xyXG5pbXBvcnQge09tbmlzaGFycFRleHRFZGl0b3J9IGZyb20gXCIuL29tbmlzaGFycC10ZXh0LWVkaXRvclwiO1xyXG5cclxuaW50ZXJmYWNlIFNvbHV0aW9uT3B0aW9ucyBleHRlbmRzIFJlYWN0aXZlQ2xpZW50T3B0aW9ucyB7XHJcbiAgICB0ZW1wb3Jhcnk6IGJvb2xlYW47XHJcbiAgICByZXBvc2l0b3J5OiBBdG9tLkdpdFJlcG9zaXRvcnk7XHJcbiAgICBpbmRleDogbnVtYmVyO1xyXG59XHJcblxyXG5pbXBvcnQge1ZpZXdNb2RlbH0gZnJvbSBcIi4vdmlldy1tb2RlbFwiO1xyXG5cclxuZXhwb3J0IGNsYXNzIFNvbHV0aW9uIGV4dGVuZHMgUmVhY3RpdmVDbGllbnQge1xyXG4gICAgcHJpdmF0ZSBzdGF0aWMgX3JlZ2V4ID0gbmV3IFJlZ0V4cChTdHJpbmcuZnJvbUNoYXJDb2RlKDB4RkZGRCksIFwiZ1wiKTtcclxuXHJcbiAgICBwdWJsaWMgbW9kZWw6IFZpZXdNb2RlbDtcclxuICAgIHB1YmxpYyBsb2dzOiBPYnNlcnZhYmxlPE91dHB1dE1lc3NhZ2U+O1xyXG4gICAgcHVibGljIHBhdGg6IHN0cmluZztcclxuICAgIHB1YmxpYyBpbmRleDogbnVtYmVyO1xyXG4gICAgcHVibGljIHRlbXBvcmFyeTogYm9vbGVhbiA9IGZhbHNlO1xyXG4gICAgcHJpdmF0ZSBfc29sdXRpb25EaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgIHB1YmxpYyBnZXQgZGlzcG9zYWJsZSgpIHsgcmV0dXJuIHRoaXMuX3NvbHV0aW9uRGlzcG9zYWJsZTsgfVxyXG5cclxuICAgIHByaXZhdGUgcmVwb3NpdG9yeTogQXRvbS5HaXRSZXBvc2l0b3J5O1xyXG4gICAgcHVibGljIGdldCBpc0Rpc3Bvc2VkKCkgeyByZXR1cm4gdGhpcy5fc29sdXRpb25EaXNwb3NhYmxlLmlzRGlzcG9zZWQ7IH1cclxuXHJcbiAgICBwcml2YXRlIF9pc0ZvbGRlclBlckZpbGUgPSBmYWxzZTtcclxuICAgIHB1YmxpYyBnZXQgaXNGb2xkZXJQZXJGaWxlKCkgeyByZXR1cm4gdGhpcy5faXNGb2xkZXJQZXJGaWxlOyB9XHJcbiAgICBwdWJsaWMgc2V0IGlzRm9sZGVyUGVyRmlsZSh2YWx1ZSkgeyB0aGlzLl9pc0ZvbGRlclBlckZpbGUgPSB2YWx1ZTsgfVxyXG5cclxuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnM6IFNvbHV0aW9uT3B0aW9ucykge1xyXG4gICAgICAgIHN1cGVyKF8uZGVmYXVsdHMob3B0aW9ucywgeyBydW50aW1lOiBSdW50aW1lLkNvcmVDbHIgfSkpO1xyXG4gICAgICAgIHRoaXMuY29uZmlndXJlU29sdXRpb24oKTtcclxuICAgICAgICB0aGlzLnRlbXBvcmFyeSA9IG9wdGlvbnMudGVtcG9yYXJ5O1xyXG4gICAgICAgIHRoaXMubW9kZWwgPSBuZXcgVmlld01vZGVsKHRoaXMpO1xyXG4gICAgICAgIHRoaXMucGF0aCA9IG9wdGlvbnMucHJvamVjdFBhdGg7XHJcbiAgICAgICAgdGhpcy5pbmRleCA9IG9wdGlvbnMuaW5kZXg7XHJcbiAgICAgICAgdGhpcy5yZXBvc2l0b3J5ID0gb3B0aW9ucy5yZXBvc2l0b3J5O1xyXG4gICAgICAgIHRoaXMuc2V0dXBSZXBvc2l0b3J5KCk7XHJcbiAgICAgICAgdGhpcy5fc29sdXRpb25EaXNwb3NhYmxlLmFkZCh0aGlzLm1vZGVsKTtcclxuXHJcbiAgICAgICAgdGhpcy5yZWdpc3RlckZpeHVwKChhY3Rpb246IHN0cmluZywgcmVxdWVzdDogYW55LCBvcHRzPzogUmVxdWVzdE9wdGlvbnMpID0+IHRoaXMuX2ZpeHVwUmVxdWVzdChhY3Rpb24sIHJlcXVlc3QpKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgY29ubmVjdCgpIHtcclxuICAgICAgICBpZiAodGhpcy5pc0Rpc3Bvc2VkKSByZXR1cm47XHJcbiAgICAgICAgaWYgKHRoaXMuY3VycmVudFN0YXRlID49IERyaXZlclN0YXRlLkRvd25sb2FkaW5nICYmIHRoaXMuY3VycmVudFN0YXRlIDw9IERyaXZlclN0YXRlLkNvbm5lY3RlZCkgcmV0dXJuO1xyXG4gICAgICAgIHN1cGVyLmNvbm5lY3QoKTtcclxuXHJcbiAgICAgICAgdGhpcy5sb2coXCJTdGFydGluZyBPbW5pU2hhcnAgc2VydmVyIChwaWQ6XCIgKyB0aGlzLmlkICsgXCIpXCIpO1xyXG4gICAgICAgIHRoaXMubG9nKFwiT21uaVNoYXJwIExvY2F0aW9uOiBcIiArIHRoaXMuc2VydmVyUGF0aCk7XHJcbiAgICAgICAgdGhpcy5sb2coXCJDaGFuZ2UgdGhlIGxvY2F0aW9uIHRoYXQgT21uaVNoYXJwIGlzIGxvYWRlZCBmcm9tIGJ5IHNldHRpbmcgdGhlIE9NTklTSEFSUCBlbnZpcm9ubWVudCB2YXJpYWJsZVwiKTtcclxuICAgICAgICB0aGlzLmxvZyhcIk9tbmlTaGFycCBQYXRoOiBcIiArIHRoaXMucHJvamVjdFBhdGgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkaXNjb25uZWN0KCkge1xyXG4gICAgICAgIHN1cGVyLmRpc2Nvbm5lY3QoKTtcclxuXHJcbiAgICAgICAgdGhpcy5sb2coXCJPbW5pc2hhcnAgc2VydmVyIHN0b3BwZWQuXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkaXNwb3NlKCkge1xyXG4gICAgICAgIHN1cGVyLmRpc3Bvc2UoKTtcclxuICAgICAgICB0aGlzLl9zb2x1dGlvbkRpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgY29uZmlndXJlU29sdXRpb24oKSB7XHJcbiAgICAgICAgdGhpcy5sb2dzID0gdGhpcy5ldmVudHMubWFwKGV2ZW50ID0+ICh7XHJcbiAgICAgICAgICAgIG1lc3NhZ2U6IGV2ZW50LkJvZHkgJiYgZXZlbnQuQm9keS5NZXNzYWdlIHx8IGV2ZW50LkV2ZW50IHx8IFwiXCIsXHJcbiAgICAgICAgICAgIGxvZ0xldmVsOiBldmVudC5Cb2R5ICYmIGV2ZW50LkJvZHkuTG9nTGV2ZWwgfHwgKGV2ZW50LlR5cGUgPT09IFwiZXJyb3JcIiAmJiBcIkVSUk9SXCIpIHx8IFwiSU5GT1JNQVRJT05cIlxyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5fc29sdXRpb25EaXNwb3NhYmxlLmFkZCh0aGlzLmVycm9ycy5zdWJzY3JpYmUoZXhjZXB0aW9uID0+IHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihleGNlcHRpb24pO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5fc29sdXRpb25EaXNwb3NhYmxlLmFkZCh0aGlzLnJlc3BvbnNlcy5zdWJzY3JpYmUoZGF0YSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChhdG9tLmNvbmZpZy5nZXQoXCJvbW5pc2hhcnAtYXRvbS5kZXZlbG9wZXJNb2RlXCIpKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIm9tbmk6XCIgKyBkYXRhLmNvbW1hbmQsIGRhdGEucmVxdWVzdCwgZGF0YS5yZXNwb25zZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfY3VycmVudEVkaXRvcjogT21uaXNoYXJwVGV4dEVkaXRvcjtcclxuICAgIHB1YmxpYyB3aXRoRWRpdG9yKGVkaXRvcjogT21uaXNoYXJwVGV4dEVkaXRvcikge1xyXG4gICAgICAgIHRoaXMuX2N1cnJlbnRFZGl0b3IgPSBlZGl0b3I7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfZml4dXBSZXF1ZXN0PFRSZXF1ZXN0LCBUUmVzcG9uc2U+KGFjdGlvbjogc3RyaW5nLCByZXF1ZXN0OiBUUmVxdWVzdCkge1xyXG4gICAgICAgIC8vIE9ubHkgc2VuZCBjaGFuZ2VzIGZvciByZXF1ZXN0cyB0aGF0IHJlYWxseSBuZWVkIHRoZW0uXHJcbiAgICAgICAgaWYgKHRoaXMuX2N1cnJlbnRFZGl0b3IgJiYgXy5pc09iamVjdChyZXF1ZXN0KSkge1xyXG4gICAgICAgICAgICBjb25zdCBlZGl0b3IgPSB0aGlzLl9jdXJyZW50RWRpdG9yO1xyXG4gICAgICAgICAgICBjb25zdCBtYXJrZXIgPSBlZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKTtcclxuICAgICAgICAgICAgbGV0IGNvbXB1dGVkQ2hhbmdlczogTW9kZWxzLkxpbmVQb3NpdGlvblNwYW5UZXh0Q2hhbmdlW10gPSBudWxsO1xyXG4gICAgICAgICAgICBpZiAoIV8uc29tZShbXCIvZ290b1wiLCBcIi9uYXZpZ2F0ZVwiLCBcIi9maW5kXCIsIFwiL3BhY2thZ2VcIl0sIHggPT4gXy5zdGFydHNXaXRoKGFjdGlvbiwgeCkpKSB7XHJcbiAgICAgICAgICAgICAgICBjb21wdXRlZENoYW5nZXMgPSBlZGl0b3Iub21uaXNoYXJwLnBvcENoYW5nZXMoKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgXy5kZWZhdWx0cyhyZXF1ZXN0LCB7IENvbHVtbjogbWFya2VyLmNvbHVtbiwgTGluZTogbWFya2VyLnJvdywgRmlsZU5hbWU6IGVkaXRvci5nZXRVUkkoKSwgQ2hhbmdlczogY29tcHV0ZWRDaGFuZ2VzIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLyogdHNsaW50OmRpc2FibGU6bm8tc3RyaW5nLWxpdGVyYWwgKi9cclxuICAgICAgICBpZiAocmVxdWVzdFtcIkJ1ZmZlclwiXSkge1xyXG4gICAgICAgICAgICByZXF1ZXN0W1wiQnVmZmVyXCJdID0gcmVxdWVzdFtcIkJ1ZmZlclwiXS5yZXBsYWNlKFNvbHV0aW9uLl9yZWdleCwgXCJcIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8qIHRzbGludDplbmFibGU6bm8tc3RyaW5nLWxpdGVyYWwgKi9cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVxdWVzdDxUUmVxdWVzdCwgVFJlc3BvbnNlPihhY3Rpb246IHN0cmluZywgcmVxdWVzdD86IFRSZXF1ZXN0LCBvcHRpb25zPzogUmVxdWVzdE9wdGlvbnMpOiBPYnNlcnZhYmxlPFRSZXNwb25zZT4ge1xyXG4gICAgICAgIGlmICh0aGlzLl9jdXJyZW50RWRpdG9yKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGVkaXRvciA9IHRoaXMuX2N1cnJlbnRFZGl0b3I7XHJcbiAgICAgICAgICAgIHRoaXMuX2N1cnJlbnRFZGl0b3IgPSBudWxsO1xyXG4gICAgICAgICAgICAvLyBUT0RPOiB1cGRhdGUgYW5kIGFkZCB0byB0eXBpbmdzLlxyXG4gICAgICAgICAgICBpZiAoZWRpdG9yLmlzRGVzdHJveWVkKCkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmVtcHR5PFRSZXNwb25zZT4oKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgdGVtcFI6IE1vZGVscy5SZXF1ZXN0ID0gcmVxdWVzdDtcclxuICAgICAgICBpZiAodGVtcFIgJiYgXy5lbmRzV2l0aCh0ZW1wUi5GaWxlTmFtZSwgXCIuanNvblwiKSkge1xyXG4gICAgICAgICAgICB0ZW1wUi5CdWZmZXIgPSBudWxsO1xyXG4gICAgICAgICAgICB0ZW1wUi5DaGFuZ2VzID0gbnVsbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiA8YW55PnN1cGVyLnJlcXVlc3Q8VFJlcXVlc3QsIFRSZXNwb25zZT4oYWN0aW9uLCByZXF1ZXN0LCBvcHRpb25zKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHNldHVwUmVwb3NpdG9yeSgpIHtcclxuICAgICAgICBpZiAodGhpcy5yZXBvc2l0b3J5KSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGJyYW5jaFN1YmplY3QgPSBuZXcgU3ViamVjdDxzdHJpbmc+KCk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLl9zb2x1dGlvbkRpc3Bvc2FibGUuYWRkKGJyYW5jaFN1YmplY3RcclxuICAgICAgICAgICAgICAgIC5kaXN0aW5jdFVudGlsQ2hhbmdlZCgpXHJcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IGF0b20uY29tbWFuZHMuZGlzcGF0Y2goYXRvbS52aWV3cy5nZXRWaWV3KGF0b20ud29ya3NwYWNlKSwgXCJvbW5pc2hhcnAtYXRvbTpyZXN0YXJ0LXNlcnZlclwiKSkpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5fc29sdXRpb25EaXNwb3NhYmxlLmFkZCh0aGlzLnJlcG9zaXRvcnkub25EaWRDaGFuZ2VTdGF0dXNlcygoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBicmFuY2hTdWJqZWN0Lm5leHQoKDxhbnk+dGhpcy5yZXBvc2l0b3J5KS5icmFuY2gpO1xyXG4gICAgICAgICAgICB9KSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB3aGVuQ29ubmVjdGVkKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnN0YXRlLnN0YXJ0V2l0aCh0aGlzLmN1cnJlbnRTdGF0ZSlcclxuICAgICAgICAgICAgLmZpbHRlcih4ID0+IHggPT09IERyaXZlclN0YXRlLkNvbm5lY3RlZClcclxuICAgICAgICAgICAgLnRha2UoMSk7XHJcbiAgICB9XHJcbn1cclxuIl19
