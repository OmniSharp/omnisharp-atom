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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9zZXJ2ZXIvc29sdXRpb24uanMiLCJsaWIvc2VydmVyL3NvbHV0aW9uLnRzIl0sIm5hbWVzIjpbIlNvbHV0aW9uIiwib3B0aW9ucyIsImRlZmF1bHRzIiwicnVudGltZSIsIkNvcmVDbHIiLCJ0ZW1wb3JhcnkiLCJfc29sdXRpb25EaXNwb3NhYmxlIiwiX2lzRm9sZGVyUGVyRmlsZSIsImNvbmZpZ3VyZVNvbHV0aW9uIiwibW9kZWwiLCJwYXRoIiwicHJvamVjdFBhdGgiLCJpbmRleCIsInJlcG9zaXRvcnkiLCJzZXR1cFJlcG9zaXRvcnkiLCJhZGQiLCJyZWdpc3RlckZpeHVwIiwiYWN0aW9uIiwicmVxdWVzdCIsIm9wdHMiLCJfZml4dXBSZXF1ZXN0IiwiaXNEaXNwb3NlZCIsImN1cnJlbnRTdGF0ZSIsIkRvd25sb2FkaW5nIiwiQ29ubmVjdGVkIiwibG9nIiwiaWQiLCJzZXJ2ZXJQYXRoIiwiZGlzcG9zZSIsImxvZ3MiLCJldmVudHMiLCJtYXAiLCJtZXNzYWdlIiwiZXZlbnQiLCJCb2R5IiwiTWVzc2FnZSIsIkV2ZW50IiwibG9nTGV2ZWwiLCJMb2dMZXZlbCIsIlR5cGUiLCJlcnJvcnMiLCJzdWJzY3JpYmUiLCJjb25zb2xlIiwiZXJyb3IiLCJleGNlcHRpb24iLCJyZXNwb25zZXMiLCJhdG9tIiwiY29uZmlnIiwiZ2V0IiwiZGF0YSIsImNvbW1hbmQiLCJyZXNwb25zZSIsImVkaXRvciIsIl9jdXJyZW50RWRpdG9yIiwiaXNPYmplY3QiLCJtYXJrZXIiLCJnZXRDdXJzb3JCdWZmZXJQb3NpdGlvbiIsImNvbXB1dGVkQ2hhbmdlcyIsInNvbWUiLCJzdGFydHNXaXRoIiwieCIsIm9tbmlzaGFycCIsInBvcENoYW5nZXMiLCJDb2x1bW4iLCJjb2x1bW4iLCJMaW5lIiwicm93IiwiRmlsZU5hbWUiLCJnZXRVUkkiLCJDaGFuZ2VzIiwicmVwbGFjZSIsIl9yZWdleCIsImlzRGVzdHJveWVkIiwiZW1wdHkiLCJ0ZW1wUiIsImVuZHNXaXRoIiwiQnVmZmVyIiwiYnJhbmNoU3ViamVjdCIsImRpc3RpbmN0VW50aWxDaGFuZ2VkIiwiY29tbWFuZHMiLCJkaXNwYXRjaCIsInZpZXdzIiwiZ2V0VmlldyIsIndvcmtzcGFjZSIsIm9uRGlkQ2hhbmdlU3RhdHVzZXMiLCJuZXh0IiwiYnJhbmNoIiwic3RhdGUiLCJzdGFydFdpdGgiLCJmaWx0ZXIiLCJ0YWtlIiwidmFsdWUiLCJSZWdFeHAiLCJTdHJpbmciLCJmcm9tQ2hhckNvZGUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBQUE7Ozs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7Ozs7Ozs7OztJQ1VBQSxROzs7QUFrQkksc0JBQVlDLE9BQVosRUFBb0M7QUFBQTs7QUFBQSx3SEFDMUIsaUJBQUVDLFFBQUYsQ0FBV0QsT0FBWCxFQUFvQixFQUFFRSxTQUFTLHlCQUFRQyxPQUFuQixFQUFwQixDQUQwQjs7QUFYN0IsY0FBQUMsU0FBQSxHQUFxQixLQUFyQjtBQUNDLGNBQUFDLG1CQUFBLEdBQXNCLHdDQUF0QjtBQU1BLGNBQUFDLGdCQUFBLEdBQW1CLEtBQW5CO0FBTUosY0FBS0MsaUJBQUw7QUFDQSxjQUFLSCxTQUFMLEdBQWlCSixRQUFRSSxTQUF6QjtBQUNBLGNBQUtJLEtBQUwsR0FBYSwrQkFBYjtBQUNBLGNBQUtDLElBQUwsR0FBWVQsUUFBUVUsV0FBcEI7QUFDQSxjQUFLQyxLQUFMLEdBQWFYLFFBQVFXLEtBQXJCO0FBQ0EsY0FBS0MsVUFBTCxHQUFrQlosUUFBUVksVUFBMUI7QUFDQSxjQUFLQyxlQUFMO0FBQ0EsY0FBS1IsbUJBQUwsQ0FBeUJTLEdBQXpCLENBQTZCLE1BQUtOLEtBQWxDO0FBRUEsY0FBS08sYUFBTCxDQUFtQixVQUFDQyxNQUFELEVBQWlCQyxPQUFqQixFQUErQkMsSUFBL0I7QUFBQSxtQkFBeUQsTUFBS0MsYUFBTCxDQUFtQkgsTUFBbkIsRUFBMkJDLE9BQTNCLENBQXpEO0FBQUEsU0FBbkI7QUFYZ0M7QUFZbkM7Ozs7a0NBRWE7QUFDVixnQkFBSSxLQUFLRyxVQUFULEVBQXFC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QU0sNkJBQVlwQyxTQUF2QjtBQUFBLGFBREwsRUFFRmtFLElBRkUsQ0FFRyxDQUZILENBQVA7QUFHSDs7OzRCQTdIb0I7QUFBSyxtQkFBTyxLQUFLcEYsbUJBQVo7QUFBa0M7Ozs0QkFHdkM7QUFBSyxtQkFBTyxLQUFLQSxtQkFBTCxDQUF5QmUsVUFBaEM7QUFBNkM7Ozs0QkFHN0M7QUFBSyxtQkFBTyxLQUFLZCxnQkFBWjtBQUErQixTOzBCQUNuQ29GLEssRUFBSztBQUFJLGlCQUFLcEYsZ0JBQUwsR0FBd0JvRixLQUF4QjtBQUFnQzs7Ozs7Ozs7QUFmckQzRixTQUFBdUUsTUFBQSxHQUFTLElBQUlxQixNQUFKLENBQVdDLE9BQU9DLFlBQVAsQ0FBb0IsTUFBcEIsQ0FBWCxFQUF3QyxHQUF4QyxDQUFUIiwiZmlsZSI6ImxpYi9zZXJ2ZXIvc29sdXRpb24uanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgXyBmcm9tIFwibG9kYXNoXCI7XG5pbXBvcnQgeyBPYnNlcnZhYmxlLCBTdWJqZWN0IH0gZnJvbSBcInJ4anNcIjtcbmltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUgfSBmcm9tIFwidHMtZGlzcG9zYWJsZXNcIjtcbmltcG9ydCB7IFJlYWN0aXZlQ2xpZW50LCBEcml2ZXJTdGF0ZSwgUnVudGltZSB9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XG5pbXBvcnQgeyBWaWV3TW9kZWwgfSBmcm9tIFwiLi92aWV3LW1vZGVsXCI7XG5leHBvcnQgY2xhc3MgU29sdXRpb24gZXh0ZW5kcyBSZWFjdGl2ZUNsaWVudCB7XG4gICAgY29uc3RydWN0b3Iob3B0aW9ucykge1xuICAgICAgICBzdXBlcihfLmRlZmF1bHRzKG9wdGlvbnMsIHsgcnVudGltZTogUnVudGltZS5Db3JlQ2xyIH0pKTtcbiAgICAgICAgdGhpcy50ZW1wb3JhcnkgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5fc29sdXRpb25EaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgdGhpcy5faXNGb2xkZXJQZXJGaWxlID0gZmFsc2U7XG4gICAgICAgIHRoaXMuY29uZmlndXJlU29sdXRpb24oKTtcbiAgICAgICAgdGhpcy50ZW1wb3JhcnkgPSBvcHRpb25zLnRlbXBvcmFyeTtcbiAgICAgICAgdGhpcy5tb2RlbCA9IG5ldyBWaWV3TW9kZWwodGhpcyk7XG4gICAgICAgIHRoaXMucGF0aCA9IG9wdGlvbnMucHJvamVjdFBhdGg7XG4gICAgICAgIHRoaXMuaW5kZXggPSBvcHRpb25zLmluZGV4O1xuICAgICAgICB0aGlzLnJlcG9zaXRvcnkgPSBvcHRpb25zLnJlcG9zaXRvcnk7XG4gICAgICAgIHRoaXMuc2V0dXBSZXBvc2l0b3J5KCk7XG4gICAgICAgIHRoaXMuX3NvbHV0aW9uRGlzcG9zYWJsZS5hZGQodGhpcy5tb2RlbCk7XG4gICAgICAgIHRoaXMucmVnaXN0ZXJGaXh1cCgoYWN0aW9uLCByZXF1ZXN0LCBvcHRzKSA9PiB0aGlzLl9maXh1cFJlcXVlc3QoYWN0aW9uLCByZXF1ZXN0KSk7XG4gICAgfVxuICAgIGdldCBkaXNwb3NhYmxlKCkgeyByZXR1cm4gdGhpcy5fc29sdXRpb25EaXNwb3NhYmxlOyB9XG4gICAgZ2V0IGlzRGlzcG9zZWQoKSB7IHJldHVybiB0aGlzLl9zb2x1dGlvbkRpc3Bvc2FibGUuaXNEaXNwb3NlZDsgfVxuICAgIGdldCBpc0ZvbGRlclBlckZpbGUoKSB7IHJldHVybiB0aGlzLl9pc0ZvbGRlclBlckZpbGU7IH1cbiAgICBzZXQgaXNGb2xkZXJQZXJGaWxlKHZhbHVlKSB7IHRoaXMuX2lzRm9sZGVyUGVyRmlsZSA9IHZhbHVlOyB9XG4gICAgY29ubmVjdCgpIHtcbiAgICAgICAgaWYgKHRoaXMuaXNEaXNwb3NlZClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgaWYgKHRoaXMuY3VycmVudFN0YXRlID49IERyaXZlclN0YXRlLkRvd25sb2FkaW5nICYmIHRoaXMuY3VycmVudFN0YXRlIDw9IERyaXZlclN0YXRlLkNvbm5lY3RlZClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgc3VwZXIuY29ubmVjdCgpO1xuICAgICAgICB0aGlzLmxvZyhcIlN0YXJ0aW5nIE9tbmlTaGFycCBzZXJ2ZXIgKHBpZDpcIiArIHRoaXMuaWQgKyBcIilcIik7XG4gICAgICAgIHRoaXMubG9nKFwiT21uaVNoYXJwIExvY2F0aW9uOiBcIiArIHRoaXMuc2VydmVyUGF0aCk7XG4gICAgICAgIHRoaXMubG9nKFwiQ2hhbmdlIHRoZSBsb2NhdGlvbiB0aGF0IE9tbmlTaGFycCBpcyBsb2FkZWQgZnJvbSBieSBzZXR0aW5nIHRoZSBPTU5JU0hBUlAgZW52aXJvbm1lbnQgdmFyaWFibGVcIik7XG4gICAgICAgIHRoaXMubG9nKFwiT21uaVNoYXJwIFBhdGg6IFwiICsgdGhpcy5wcm9qZWN0UGF0aCk7XG4gICAgfVxuICAgIGRpc2Nvbm5lY3QoKSB7XG4gICAgICAgIHN1cGVyLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgdGhpcy5sb2coXCJPbW5pc2hhcnAgc2VydmVyIHN0b3BwZWQuXCIpO1xuICAgIH1cbiAgICBkaXNwb3NlKCkge1xuICAgICAgICBzdXBlci5kaXNwb3NlKCk7XG4gICAgICAgIHRoaXMuX3NvbHV0aW9uRGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfVxuICAgIGNvbmZpZ3VyZVNvbHV0aW9uKCkge1xuICAgICAgICB0aGlzLmxvZ3MgPSB0aGlzLmV2ZW50cy5tYXAoZXZlbnQgPT4gKHtcbiAgICAgICAgICAgIG1lc3NhZ2U6IGV2ZW50LkJvZHkgJiYgZXZlbnQuQm9keS5NZXNzYWdlIHx8IGV2ZW50LkV2ZW50IHx8IFwiXCIsXG4gICAgICAgICAgICBsb2dMZXZlbDogZXZlbnQuQm9keSAmJiBldmVudC5Cb2R5LkxvZ0xldmVsIHx8IChldmVudC5UeXBlID09PSBcImVycm9yXCIgJiYgXCJFUlJPUlwiKSB8fCBcIklORk9STUFUSU9OXCJcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLl9zb2x1dGlvbkRpc3Bvc2FibGUuYWRkKHRoaXMuZXJyb3JzLnN1YnNjcmliZShleGNlcHRpb24gPT4ge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihleGNlcHRpb24pO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuX3NvbHV0aW9uRGlzcG9zYWJsZS5hZGQodGhpcy5yZXNwb25zZXMuc3Vic2NyaWJlKGRhdGEgPT4ge1xuICAgICAgICAgICAgaWYgKGF0b20uY29uZmlnLmdldChcIm9tbmlzaGFycC1hdG9tLmRldmVsb3Blck1vZGVcIikpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIm9tbmk6XCIgKyBkYXRhLmNvbW1hbmQsIGRhdGEucmVxdWVzdCwgZGF0YS5yZXNwb25zZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pKTtcbiAgICB9XG4gICAgd2l0aEVkaXRvcihlZGl0b3IpIHtcbiAgICAgICAgdGhpcy5fY3VycmVudEVkaXRvciA9IGVkaXRvcjtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIF9maXh1cFJlcXVlc3QoYWN0aW9uLCByZXF1ZXN0KSB7XG4gICAgICAgIGlmICh0aGlzLl9jdXJyZW50RWRpdG9yICYmIF8uaXNPYmplY3QocmVxdWVzdCkpIHtcbiAgICAgICAgICAgIGNvbnN0IGVkaXRvciA9IHRoaXMuX2N1cnJlbnRFZGl0b3I7XG4gICAgICAgICAgICBjb25zdCBtYXJrZXIgPSBlZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKTtcbiAgICAgICAgICAgIGxldCBjb21wdXRlZENoYW5nZXMgPSBudWxsO1xuICAgICAgICAgICAgaWYgKCFfLnNvbWUoW1wiL2dvdG9cIiwgXCIvbmF2aWdhdGVcIiwgXCIvZmluZFwiLCBcIi9wYWNrYWdlXCJdLCB4ID0+IF8uc3RhcnRzV2l0aChhY3Rpb24sIHgpKSkge1xuICAgICAgICAgICAgICAgIGNvbXB1dGVkQ2hhbmdlcyA9IGVkaXRvci5vbW5pc2hhcnAucG9wQ2hhbmdlcygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXy5kZWZhdWx0cyhyZXF1ZXN0LCB7IENvbHVtbjogbWFya2VyLmNvbHVtbiwgTGluZTogbWFya2VyLnJvdywgRmlsZU5hbWU6IGVkaXRvci5nZXRVUkkoKSwgQ2hhbmdlczogY29tcHV0ZWRDaGFuZ2VzIH0pO1xuICAgICAgICB9XG4gICAgICAgIGlmIChyZXF1ZXN0W1wiQnVmZmVyXCJdKSB7XG4gICAgICAgICAgICByZXF1ZXN0W1wiQnVmZmVyXCJdID0gcmVxdWVzdFtcIkJ1ZmZlclwiXS5yZXBsYWNlKFNvbHV0aW9uLl9yZWdleCwgXCJcIik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmVxdWVzdChhY3Rpb24sIHJlcXVlc3QsIG9wdGlvbnMpIHtcbiAgICAgICAgaWYgKHRoaXMuX2N1cnJlbnRFZGl0b3IpIHtcbiAgICAgICAgICAgIGNvbnN0IGVkaXRvciA9IHRoaXMuX2N1cnJlbnRFZGl0b3I7XG4gICAgICAgICAgICB0aGlzLl9jdXJyZW50RWRpdG9yID0gbnVsbDtcbiAgICAgICAgICAgIGlmIChlZGl0b3IuaXNEZXN0cm95ZWQoKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmVtcHR5KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdGVtcFIgPSByZXF1ZXN0O1xuICAgICAgICBpZiAodGVtcFIgJiYgXy5lbmRzV2l0aCh0ZW1wUi5GaWxlTmFtZSwgXCIuanNvblwiKSkge1xuICAgICAgICAgICAgdGVtcFIuQnVmZmVyID0gbnVsbDtcbiAgICAgICAgICAgIHRlbXBSLkNoYW5nZXMgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzdXBlci5yZXF1ZXN0KGFjdGlvbiwgcmVxdWVzdCwgb3B0aW9ucyk7XG4gICAgfVxuICAgIHNldHVwUmVwb3NpdG9yeSgpIHtcbiAgICAgICAgaWYgKHRoaXMucmVwb3NpdG9yeSkge1xuICAgICAgICAgICAgY29uc3QgYnJhbmNoU3ViamVjdCA9IG5ldyBTdWJqZWN0KCk7XG4gICAgICAgICAgICB0aGlzLl9zb2x1dGlvbkRpc3Bvc2FibGUuYWRkKGJyYW5jaFN1YmplY3RcbiAgICAgICAgICAgICAgICAuZGlzdGluY3RVbnRpbENoYW5nZWQoKVxuICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoKCkgPT4gYXRvbS5jb21tYW5kcy5kaXNwYXRjaChhdG9tLnZpZXdzLmdldFZpZXcoYXRvbS53b3Jrc3BhY2UpLCBcIm9tbmlzaGFycC1hdG9tOnJlc3RhcnQtc2VydmVyXCIpKSk7XG4gICAgICAgICAgICB0aGlzLl9zb2x1dGlvbkRpc3Bvc2FibGUuYWRkKHRoaXMucmVwb3NpdG9yeS5vbkRpZENoYW5nZVN0YXR1c2VzKCgpID0+IHtcbiAgICAgICAgICAgICAgICBicmFuY2hTdWJqZWN0Lm5leHQodGhpcy5yZXBvc2l0b3J5LmJyYW5jaCk7XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgd2hlbkNvbm5lY3RlZCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3RhdGUuc3RhcnRXaXRoKHRoaXMuY3VycmVudFN0YXRlKVxuICAgICAgICAgICAgLmZpbHRlcih4ID0+IHggPT09IERyaXZlclN0YXRlLkNvbm5lY3RlZClcbiAgICAgICAgICAgIC50YWtlKDEpO1xuICAgIH1cbn1cblNvbHV0aW9uLl9yZWdleCA9IG5ldyBSZWdFeHAoU3RyaW5nLmZyb21DaGFyQ29kZSgweEZGRkQpLCBcImdcIik7XG4iLCJpbXBvcnQgXyBmcm9tIFwibG9kYXNoXCI7XHJcbmltcG9ydCB7T2JzZXJ2YWJsZSwgU3ViamVjdH0gZnJvbSBcInJ4anNcIjtcclxuaW1wb3J0IHtDb21wb3NpdGVEaXNwb3NhYmxlfSBmcm9tIFwidHMtZGlzcG9zYWJsZXNcIjtcclxuaW1wb3J0IHtNb2RlbHMsIFJlcXVlc3RPcHRpb25zLCBSZWFjdGl2ZUNsaWVudCwgRHJpdmVyU3RhdGUsIFJlYWN0aXZlQ2xpZW50T3B0aW9ucywgUnVudGltZX0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcclxuaW1wb3J0IHtPbW5pc2hhcnBUZXh0RWRpdG9yfSBmcm9tIFwiLi9vbW5pc2hhcnAtdGV4dC1lZGl0b3JcIjtcclxuXHJcbmludGVyZmFjZSBTb2x1dGlvbk9wdGlvbnMgZXh0ZW5kcyBSZWFjdGl2ZUNsaWVudE9wdGlvbnMge1xyXG4gICAgdGVtcG9yYXJ5OiBib29sZWFuO1xyXG4gICAgcmVwb3NpdG9yeTogQXRvbS5HaXRSZXBvc2l0b3J5O1xyXG4gICAgaW5kZXg6IG51bWJlcjtcclxufVxyXG5cclxuaW1wb3J0IHtWaWV3TW9kZWx9IGZyb20gXCIuL3ZpZXctbW9kZWxcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBTb2x1dGlvbiBleHRlbmRzIFJlYWN0aXZlQ2xpZW50IHtcclxuICAgIHByaXZhdGUgc3RhdGljIF9yZWdleCA9IG5ldyBSZWdFeHAoU3RyaW5nLmZyb21DaGFyQ29kZSgweEZGRkQpLCBcImdcIik7XHJcblxyXG4gICAgcHVibGljIG1vZGVsOiBWaWV3TW9kZWw7XHJcbiAgICBwdWJsaWMgbG9nczogT2JzZXJ2YWJsZTxPdXRwdXRNZXNzYWdlPjtcclxuICAgIHB1YmxpYyBwYXRoOiBzdHJpbmc7XHJcbiAgICBwdWJsaWMgaW5kZXg6IG51bWJlcjtcclxuICAgIHB1YmxpYyB0ZW1wb3Jhcnk6IGJvb2xlYW4gPSBmYWxzZTtcclxuICAgIHByaXZhdGUgX3NvbHV0aW9uRGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcbiAgICBwdWJsaWMgZ2V0IGRpc3Bvc2FibGUoKSB7IHJldHVybiB0aGlzLl9zb2x1dGlvbkRpc3Bvc2FibGU7IH1cclxuXHJcbiAgICBwcml2YXRlIHJlcG9zaXRvcnk6IEF0b20uR2l0UmVwb3NpdG9yeTtcclxuICAgIHB1YmxpYyBnZXQgaXNEaXNwb3NlZCgpIHsgcmV0dXJuIHRoaXMuX3NvbHV0aW9uRGlzcG9zYWJsZS5pc0Rpc3Bvc2VkOyB9XHJcblxyXG4gICAgcHJpdmF0ZSBfaXNGb2xkZXJQZXJGaWxlID0gZmFsc2U7XHJcbiAgICBwdWJsaWMgZ2V0IGlzRm9sZGVyUGVyRmlsZSgpIHsgcmV0dXJuIHRoaXMuX2lzRm9sZGVyUGVyRmlsZTsgfVxyXG4gICAgcHVibGljIHNldCBpc0ZvbGRlclBlckZpbGUodmFsdWUpIHsgdGhpcy5faXNGb2xkZXJQZXJGaWxlID0gdmFsdWU7IH1cclxuXHJcbiAgICBjb25zdHJ1Y3RvcihvcHRpb25zOiBTb2x1dGlvbk9wdGlvbnMpIHtcclxuICAgICAgICBzdXBlcihfLmRlZmF1bHRzKG9wdGlvbnMsIHsgcnVudGltZTogUnVudGltZS5Db3JlQ2xyIH0pKTtcclxuICAgICAgICB0aGlzLmNvbmZpZ3VyZVNvbHV0aW9uKCk7XHJcbiAgICAgICAgdGhpcy50ZW1wb3JhcnkgPSBvcHRpb25zLnRlbXBvcmFyeTtcclxuICAgICAgICB0aGlzLm1vZGVsID0gbmV3IFZpZXdNb2RlbCh0aGlzKTtcclxuICAgICAgICB0aGlzLnBhdGggPSBvcHRpb25zLnByb2plY3RQYXRoO1xyXG4gICAgICAgIHRoaXMuaW5kZXggPSBvcHRpb25zLmluZGV4O1xyXG4gICAgICAgIHRoaXMucmVwb3NpdG9yeSA9IG9wdGlvbnMucmVwb3NpdG9yeTtcclxuICAgICAgICB0aGlzLnNldHVwUmVwb3NpdG9yeSgpO1xyXG4gICAgICAgIHRoaXMuX3NvbHV0aW9uRGlzcG9zYWJsZS5hZGQodGhpcy5tb2RlbCk7XHJcblxyXG4gICAgICAgIHRoaXMucmVnaXN0ZXJGaXh1cCgoYWN0aW9uOiBzdHJpbmcsIHJlcXVlc3Q6IGFueSwgb3B0cz86IFJlcXVlc3RPcHRpb25zKSA9PiB0aGlzLl9maXh1cFJlcXVlc3QoYWN0aW9uLCByZXF1ZXN0KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNvbm5lY3QoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuaXNEaXNwb3NlZCkgcmV0dXJuO1xyXG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnRTdGF0ZSA+PSBEcml2ZXJTdGF0ZS5Eb3dubG9hZGluZyAmJiB0aGlzLmN1cnJlbnRTdGF0ZSA8PSBEcml2ZXJTdGF0ZS5Db25uZWN0ZWQpIHJldHVybjtcclxuICAgICAgICBzdXBlci5jb25uZWN0KCk7XHJcblxyXG4gICAgICAgIHRoaXMubG9nKFwiU3RhcnRpbmcgT21uaVNoYXJwIHNlcnZlciAocGlkOlwiICsgdGhpcy5pZCArIFwiKVwiKTtcclxuICAgICAgICB0aGlzLmxvZyhcIk9tbmlTaGFycCBMb2NhdGlvbjogXCIgKyB0aGlzLnNlcnZlclBhdGgpO1xyXG4gICAgICAgIHRoaXMubG9nKFwiQ2hhbmdlIHRoZSBsb2NhdGlvbiB0aGF0IE9tbmlTaGFycCBpcyBsb2FkZWQgZnJvbSBieSBzZXR0aW5nIHRoZSBPTU5JU0hBUlAgZW52aXJvbm1lbnQgdmFyaWFibGVcIik7XHJcbiAgICAgICAgdGhpcy5sb2coXCJPbW5pU2hhcnAgUGF0aDogXCIgKyB0aGlzLnByb2plY3RQYXRoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGlzY29ubmVjdCgpIHtcclxuICAgICAgICBzdXBlci5kaXNjb25uZWN0KCk7XHJcblxyXG4gICAgICAgIHRoaXMubG9nKFwiT21uaXNoYXJwIHNlcnZlciBzdG9wcGVkLlwiKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGlzcG9zZSgpIHtcclxuICAgICAgICBzdXBlci5kaXNwb3NlKCk7XHJcbiAgICAgICAgdGhpcy5fc29sdXRpb25EaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGNvbmZpZ3VyZVNvbHV0aW9uKCkge1xyXG4gICAgICAgIHRoaXMubG9ncyA9IHRoaXMuZXZlbnRzLm1hcChldmVudCA9PiAoe1xyXG4gICAgICAgICAgICBtZXNzYWdlOiBldmVudC5Cb2R5ICYmIGV2ZW50LkJvZHkuTWVzc2FnZSB8fCBldmVudC5FdmVudCB8fCBcIlwiLFxyXG4gICAgICAgICAgICBsb2dMZXZlbDogZXZlbnQuQm9keSAmJiBldmVudC5Cb2R5LkxvZ0xldmVsIHx8IChldmVudC5UeXBlID09PSBcImVycm9yXCIgJiYgXCJFUlJPUlwiKSB8fCBcIklORk9STUFUSU9OXCJcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuX3NvbHV0aW9uRGlzcG9zYWJsZS5hZGQodGhpcy5lcnJvcnMuc3Vic2NyaWJlKGV4Y2VwdGlvbiA9PiB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXhjZXB0aW9uKTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuX3NvbHV0aW9uRGlzcG9zYWJsZS5hZGQodGhpcy5yZXNwb25zZXMuc3Vic2NyaWJlKGRhdGEgPT4ge1xyXG4gICAgICAgICAgICBpZiAoYXRvbS5jb25maWcuZ2V0KFwib21uaXNoYXJwLWF0b20uZGV2ZWxvcGVyTW9kZVwiKSkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJvbW5pOlwiICsgZGF0YS5jb21tYW5kLCBkYXRhLnJlcXVlc3QsIGRhdGEucmVzcG9uc2UpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX2N1cnJlbnRFZGl0b3I6IE9tbmlzaGFycFRleHRFZGl0b3I7XHJcbiAgICBwdWJsaWMgd2l0aEVkaXRvcihlZGl0b3I6IE9tbmlzaGFycFRleHRFZGl0b3IpIHtcclxuICAgICAgICB0aGlzLl9jdXJyZW50RWRpdG9yID0gZWRpdG9yO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX2ZpeHVwUmVxdWVzdDxUUmVxdWVzdCwgVFJlc3BvbnNlPihhY3Rpb246IHN0cmluZywgcmVxdWVzdDogVFJlcXVlc3QpIHtcclxuICAgICAgICAvLyBPbmx5IHNlbmQgY2hhbmdlcyBmb3IgcmVxdWVzdHMgdGhhdCByZWFsbHkgbmVlZCB0aGVtLlxyXG4gICAgICAgIGlmICh0aGlzLl9jdXJyZW50RWRpdG9yICYmIF8uaXNPYmplY3QocmVxdWVzdCkpIHtcclxuICAgICAgICAgICAgY29uc3QgZWRpdG9yID0gdGhpcy5fY3VycmVudEVkaXRvcjtcclxuICAgICAgICAgICAgY29uc3QgbWFya2VyID0gZWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKCk7XHJcbiAgICAgICAgICAgIGxldCBjb21wdXRlZENoYW5nZXM6IE1vZGVscy5MaW5lUG9zaXRpb25TcGFuVGV4dENoYW5nZVtdID0gbnVsbDtcclxuICAgICAgICAgICAgaWYgKCFfLnNvbWUoW1wiL2dvdG9cIiwgXCIvbmF2aWdhdGVcIiwgXCIvZmluZFwiLCBcIi9wYWNrYWdlXCJdLCB4ID0+IF8uc3RhcnRzV2l0aChhY3Rpb24sIHgpKSkge1xyXG4gICAgICAgICAgICAgICAgY29tcHV0ZWRDaGFuZ2VzID0gZWRpdG9yLm9tbmlzaGFycC5wb3BDaGFuZ2VzKCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIF8uZGVmYXVsdHMocmVxdWVzdCwgeyBDb2x1bW46IG1hcmtlci5jb2x1bW4sIExpbmU6IG1hcmtlci5yb3csIEZpbGVOYW1lOiBlZGl0b3IuZ2V0VVJJKCksIENoYW5nZXM6IGNvbXB1dGVkQ2hhbmdlcyB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8qIHRzbGludDpkaXNhYmxlOm5vLXN0cmluZy1saXRlcmFsICovXHJcbiAgICAgICAgaWYgKHJlcXVlc3RbXCJCdWZmZXJcIl0pIHtcclxuICAgICAgICAgICAgcmVxdWVzdFtcIkJ1ZmZlclwiXSA9IHJlcXVlc3RbXCJCdWZmZXJcIl0ucmVwbGFjZShTb2x1dGlvbi5fcmVnZXgsIFwiXCIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvKiB0c2xpbnQ6ZW5hYmxlOm5vLXN0cmluZy1saXRlcmFsICovXHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlcXVlc3Q8VFJlcXVlc3QsIFRSZXNwb25zZT4oYWN0aW9uOiBzdHJpbmcsIHJlcXVlc3Q/OiBUUmVxdWVzdCwgb3B0aW9ucz86IFJlcXVlc3RPcHRpb25zKTogT2JzZXJ2YWJsZTxUUmVzcG9uc2U+IHtcclxuICAgICAgICBpZiAodGhpcy5fY3VycmVudEVkaXRvcikge1xyXG4gICAgICAgICAgICBjb25zdCBlZGl0b3IgPSB0aGlzLl9jdXJyZW50RWRpdG9yO1xyXG4gICAgICAgICAgICB0aGlzLl9jdXJyZW50RWRpdG9yID0gbnVsbDtcclxuICAgICAgICAgICAgLy8gVE9ETzogdXBkYXRlIGFuZCBhZGQgdG8gdHlwaW5ncy5cclxuICAgICAgICAgICAgaWYgKGVkaXRvci5pc0Rlc3Ryb3llZCgpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5lbXB0eTxUUmVzcG9uc2U+KCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHRlbXBSOiBNb2RlbHMuUmVxdWVzdCA9IHJlcXVlc3Q7XHJcbiAgICAgICAgaWYgKHRlbXBSICYmIF8uZW5kc1dpdGgodGVtcFIuRmlsZU5hbWUsIFwiLmpzb25cIikpIHtcclxuICAgICAgICAgICAgdGVtcFIuQnVmZmVyID0gbnVsbDtcclxuICAgICAgICAgICAgdGVtcFIuQ2hhbmdlcyA9IG51bGw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gPGFueT5zdXBlci5yZXF1ZXN0PFRSZXF1ZXN0LCBUUmVzcG9uc2U+KGFjdGlvbiwgcmVxdWVzdCwgb3B0aW9ucyk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBzZXR1cFJlcG9zaXRvcnkoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMucmVwb3NpdG9yeSkge1xyXG4gICAgICAgICAgICBjb25zdCBicmFuY2hTdWJqZWN0ID0gbmV3IFN1YmplY3Q8c3RyaW5nPigpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5fc29sdXRpb25EaXNwb3NhYmxlLmFkZChicmFuY2hTdWJqZWN0XHJcbiAgICAgICAgICAgICAgICAuZGlzdGluY3RVbnRpbENoYW5nZWQoKVxyXG4gICAgICAgICAgICAgICAgLnN1YnNjcmliZSgoKSA9PiBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSksIFwib21uaXNoYXJwLWF0b206cmVzdGFydC1zZXJ2ZXJcIikpKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuX3NvbHV0aW9uRGlzcG9zYWJsZS5hZGQodGhpcy5yZXBvc2l0b3J5Lm9uRGlkQ2hhbmdlU3RhdHVzZXMoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgYnJhbmNoU3ViamVjdC5uZXh0KCg8YW55PnRoaXMucmVwb3NpdG9yeSkuYnJhbmNoKTtcclxuICAgICAgICAgICAgfSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgd2hlbkNvbm5lY3RlZCgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5zdGF0ZS5zdGFydFdpdGgodGhpcy5jdXJyZW50U3RhdGUpXHJcbiAgICAgICAgICAgIC5maWx0ZXIoeCA9PiB4ID09PSBEcml2ZXJTdGF0ZS5Db25uZWN0ZWQpXHJcbiAgICAgICAgICAgIC50YWtlKDEpO1xyXG4gICAgfVxyXG59XHJcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
