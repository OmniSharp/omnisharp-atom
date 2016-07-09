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

        var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Solution).call(this, _lodash2.default.defaults(options, { runtime: _omnisharpClient.Runtime.CoreClr })));

        _this.temporary = false;
        _this._solutionDisposable = new _omnisharpClient.CompositeDisposable();
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
            _get(Object.getPrototypeOf(Solution.prototype), "connect", this).call(this);
            this.log("Starting OmniSharp server (pid:" + this.id + ")");
            this.log("OmniSharp Location: " + this.serverPath);
            this.log("Change the location that OmniSharp is loaded from by setting the OMNISHARP environment variable");
            this.log("OmniSharp Path: " + this.projectPath);
        }
    }, {
        key: "disconnect",
        value: function disconnect() {
            _get(Object.getPrototypeOf(Solution.prototype), "disconnect", this).call(this);
            this.log("Omnisharp server stopped.");
        }
    }, {
        key: "dispose",
        value: function dispose() {
            _get(Object.getPrototypeOf(Solution.prototype), "dispose", this).call(this);
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
            return _get(Object.getPrototypeOf(Solution.prototype), "request", this).call(this, action, _request, options);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9zZXJ2ZXIvc29sdXRpb24uanMiLCJsaWIvc2VydmVyL3NvbHV0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBQUE7Ozs7QUFDQTs7QUFDQTs7QUFFQTs7Ozs7Ozs7OztJQ1VBLFE7OztBQWtCSSxzQkFBWSxPQUFaLEVBQW9DO0FBQUE7O0FBQUEsZ0dBQzFCLGlCQUFFLFFBQUYsQ0FBVyxPQUFYLEVBQW9CLEVBQUUsU0FBUyx5QkFBUSxPQUFuQixFQUFwQixDQUQwQjs7QUFYN0IsY0FBQSxTQUFBLEdBQXFCLEtBQXJCO0FBQ0MsY0FBQSxtQkFBQSxHQUFzQiwwQ0FBdEI7QUFNQSxjQUFBLGdCQUFBLEdBQW1CLEtBQW5CO0FBTUosY0FBSyxpQkFBTDtBQUNBLGNBQUssU0FBTCxHQUFpQixRQUFRLFNBQXpCO0FBQ0EsY0FBSyxLQUFMLEdBQWEsK0JBQWI7QUFDQSxjQUFLLElBQUwsR0FBWSxRQUFRLFdBQXBCO0FBQ0EsY0FBSyxLQUFMLEdBQWEsUUFBUSxLQUFyQjtBQUNBLGNBQUssVUFBTCxHQUFrQixRQUFRLFVBQTFCO0FBQ0EsY0FBSyxlQUFMO0FBQ0EsY0FBSyxtQkFBTCxDQUF5QixHQUF6QixDQUE2QixNQUFLLEtBQWxDO0FBRUEsY0FBSyxhQUFMLENBQW1CLFVBQUMsTUFBRCxFQUFpQixPQUFqQixFQUErQixJQUEvQjtBQUFBLG1CQUF5RCxNQUFLLGFBQUwsQ0FBbUIsTUFBbkIsRUFBMkIsT0FBM0IsQ0FBekQ7QUFBQSxTQUFuQjtBQVhnQztBQVluQzs7OztrQ0FFYTtBQUNWLGdCQUFJLEtBQUssVUFBVCxFQUFxQjtBQUNyQixnQkFBSSxLQUFLLFlBQUwsSUFBcUIsNkJBQVksV0FBakMsSUFBZ0QsS0FBSyxZQUFMLElBQXFCLDZCQUFZLFNBQXJGLEVBQWdHO0FBQ2hHO0FBRUEsaUJBQUssR0FBTCxDQUFTLG9DQUFvQyxLQUFLLEVBQXpDLEdBQThDLEdBQXZEO0FBQ0EsaUJBQUssR0FBTCxDQUFTLHlCQUF5QixL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ZW50IjpbImltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcbmltcG9ydCB7IE9ic2VydmFibGUsIFN1YmplY3QgfSBmcm9tIFwicnhqc1wiO1xuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSB9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XG5pbXBvcnQgeyBSZWFjdGl2ZUNsaWVudCwgRHJpdmVyU3RhdGUsIFJ1bnRpbWUgfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xuaW1wb3J0IHsgVmlld01vZGVsIH0gZnJvbSBcIi4vdmlldy1tb2RlbFwiO1xuZXhwb3J0IGNsYXNzIFNvbHV0aW9uIGV4dGVuZHMgUmVhY3RpdmVDbGllbnQge1xuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnMpIHtcbiAgICAgICAgc3VwZXIoXy5kZWZhdWx0cyhvcHRpb25zLCB7IHJ1bnRpbWU6IFJ1bnRpbWUuQ29yZUNsciB9KSk7XG4gICAgICAgIHRoaXMudGVtcG9yYXJ5ID0gZmFsc2U7XG4gICAgICAgIHRoaXMuX3NvbHV0aW9uRGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIHRoaXMuX2lzRm9sZGVyUGVyRmlsZSA9IGZhbHNlO1xuICAgICAgICB0aGlzLmNvbmZpZ3VyZVNvbHV0aW9uKCk7XG4gICAgICAgIHRoaXMudGVtcG9yYXJ5ID0gb3B0aW9ucy50ZW1wb3Jhcnk7XG4gICAgICAgIHRoaXMubW9kZWwgPSBuZXcgVmlld01vZGVsKHRoaXMpO1xuICAgICAgICB0aGlzLnBhdGggPSBvcHRpb25zLnByb2plY3RQYXRoO1xuICAgICAgICB0aGlzLmluZGV4ID0gb3B0aW9ucy5pbmRleDtcbiAgICAgICAgdGhpcy5yZXBvc2l0b3J5ID0gb3B0aW9ucy5yZXBvc2l0b3J5O1xuICAgICAgICB0aGlzLnNldHVwUmVwb3NpdG9yeSgpO1xuICAgICAgICB0aGlzLl9zb2x1dGlvbkRpc3Bvc2FibGUuYWRkKHRoaXMubW9kZWwpO1xuICAgICAgICB0aGlzLnJlZ2lzdGVyRml4dXAoKGFjdGlvbiwgcmVxdWVzdCwgb3B0cykgPT4gdGhpcy5fZml4dXBSZXF1ZXN0KGFjdGlvbiwgcmVxdWVzdCkpO1xuICAgIH1cbiAgICBnZXQgZGlzcG9zYWJsZSgpIHsgcmV0dXJuIHRoaXMuX3NvbHV0aW9uRGlzcG9zYWJsZTsgfVxuICAgIGdldCBpc0Rpc3Bvc2VkKCkgeyByZXR1cm4gdGhpcy5fc29sdXRpb25EaXNwb3NhYmxlLmlzRGlzcG9zZWQ7IH1cbiAgICBnZXQgaXNGb2xkZXJQZXJGaWxlKCkgeyByZXR1cm4gdGhpcy5faXNGb2xkZXJQZXJGaWxlOyB9XG4gICAgc2V0IGlzRm9sZGVyUGVyRmlsZSh2YWx1ZSkgeyB0aGlzLl9pc0ZvbGRlclBlckZpbGUgPSB2YWx1ZTsgfVxuICAgIGNvbm5lY3QoKSB7XG4gICAgICAgIGlmICh0aGlzLmlzRGlzcG9zZWQpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnRTdGF0ZSA+PSBEcml2ZXJTdGF0ZS5Eb3dubG9hZGluZyAmJiB0aGlzLmN1cnJlbnRTdGF0ZSA8PSBEcml2ZXJTdGF0ZS5Db25uZWN0ZWQpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHN1cGVyLmNvbm5lY3QoKTtcbiAgICAgICAgdGhpcy5sb2coXCJTdGFydGluZyBPbW5pU2hhcnAgc2VydmVyIChwaWQ6XCIgKyB0aGlzLmlkICsgXCIpXCIpO1xuICAgICAgICB0aGlzLmxvZyhcIk9tbmlTaGFycCBMb2NhdGlvbjogXCIgKyB0aGlzLnNlcnZlclBhdGgpO1xuICAgICAgICB0aGlzLmxvZyhcIkNoYW5nZSB0aGUgbG9jYXRpb24gdGhhdCBPbW5pU2hhcnAgaXMgbG9hZGVkIGZyb20gYnkgc2V0dGluZyB0aGUgT01OSVNIQVJQIGVudmlyb25tZW50IHZhcmlhYmxlXCIpO1xuICAgICAgICB0aGlzLmxvZyhcIk9tbmlTaGFycCBQYXRoOiBcIiArIHRoaXMucHJvamVjdFBhdGgpO1xuICAgIH1cbiAgICBkaXNjb25uZWN0KCkge1xuICAgICAgICBzdXBlci5kaXNjb25uZWN0KCk7XG4gICAgICAgIHRoaXMubG9nKFwiT21uaXNoYXJwIHNlcnZlciBzdG9wcGVkLlwiKTtcbiAgICB9XG4gICAgZGlzcG9zZSgpIHtcbiAgICAgICAgc3VwZXIuZGlzcG9zZSgpO1xuICAgICAgICB0aGlzLl9zb2x1dGlvbkRpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgIH1cbiAgICBjb25maWd1cmVTb2x1dGlvbigpIHtcbiAgICAgICAgdGhpcy5sb2dzID0gdGhpcy5ldmVudHMubWFwKGV2ZW50ID0+ICh7XG4gICAgICAgICAgICBtZXNzYWdlOiBldmVudC5Cb2R5ICYmIGV2ZW50LkJvZHkuTWVzc2FnZSB8fCBldmVudC5FdmVudCB8fCBcIlwiLFxuICAgICAgICAgICAgbG9nTGV2ZWw6IGV2ZW50LkJvZHkgJiYgZXZlbnQuQm9keS5Mb2dMZXZlbCB8fCAoZXZlbnQuVHlwZSA9PT0gXCJlcnJvclwiICYmIFwiRVJST1JcIikgfHwgXCJJTkZPUk1BVElPTlwiXG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5fc29sdXRpb25EaXNwb3NhYmxlLmFkZCh0aGlzLmVycm9ycy5zdWJzY3JpYmUoZXhjZXB0aW9uID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXhjZXB0aW9uKTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLl9zb2x1dGlvbkRpc3Bvc2FibGUuYWRkKHRoaXMucmVzcG9uc2VzLnN1YnNjcmliZShkYXRhID0+IHtcbiAgICAgICAgICAgIGlmIChhdG9tLmNvbmZpZy5nZXQoXCJvbW5pc2hhcnAtYXRvbS5kZXZlbG9wZXJNb2RlXCIpKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJvbW5pOlwiICsgZGF0YS5jb21tYW5kLCBkYXRhLnJlcXVlc3QsIGRhdGEucmVzcG9uc2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KSk7XG4gICAgfVxuICAgIHdpdGhFZGl0b3IoZWRpdG9yKSB7XG4gICAgICAgIHRoaXMuX2N1cnJlbnRFZGl0b3IgPSBlZGl0b3I7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBfZml4dXBSZXF1ZXN0KGFjdGlvbiwgcmVxdWVzdCkge1xuICAgICAgICBpZiAodGhpcy5fY3VycmVudEVkaXRvciAmJiBfLmlzT2JqZWN0KHJlcXVlc3QpKSB7XG4gICAgICAgICAgICBjb25zdCBlZGl0b3IgPSB0aGlzLl9jdXJyZW50RWRpdG9yO1xuICAgICAgICAgICAgY29uc3QgbWFya2VyID0gZWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKCk7XG4gICAgICAgICAgICBsZXQgY29tcHV0ZWRDaGFuZ2VzID0gbnVsbDtcbiAgICAgICAgICAgIGlmICghXy5zb21lKFtcIi9nb3RvXCIsIFwiL25hdmlnYXRlXCIsIFwiL2ZpbmRcIiwgXCIvcGFja2FnZVwiXSwgeCA9PiBfLnN0YXJ0c1dpdGgoYWN0aW9uLCB4KSkpIHtcbiAgICAgICAgICAgICAgICBjb21wdXRlZENoYW5nZXMgPSBlZGl0b3Iub21uaXNoYXJwLnBvcENoYW5nZXMoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF8uZGVmYXVsdHMocmVxdWVzdCwgeyBDb2x1bW46IG1hcmtlci5jb2x1bW4sIExpbmU6IG1hcmtlci5yb3csIEZpbGVOYW1lOiBlZGl0b3IuZ2V0VVJJKCksIENoYW5nZXM6IGNvbXB1dGVkQ2hhbmdlcyB9KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocmVxdWVzdFtcIkJ1ZmZlclwiXSkge1xuICAgICAgICAgICAgcmVxdWVzdFtcIkJ1ZmZlclwiXSA9IHJlcXVlc3RbXCJCdWZmZXJcIl0ucmVwbGFjZShTb2x1dGlvbi5fcmVnZXgsIFwiXCIpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJlcXVlc3QoYWN0aW9uLCByZXF1ZXN0LCBvcHRpb25zKSB7XG4gICAgICAgIGlmICh0aGlzLl9jdXJyZW50RWRpdG9yKSB7XG4gICAgICAgICAgICBjb25zdCBlZGl0b3IgPSB0aGlzLl9jdXJyZW50RWRpdG9yO1xuICAgICAgICAgICAgdGhpcy5fY3VycmVudEVkaXRvciA9IG51bGw7XG4gICAgICAgICAgICBpZiAoZWRpdG9yLmlzRGVzdHJveWVkKCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5lbXB0eSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHRlbXBSID0gcmVxdWVzdDtcbiAgICAgICAgaWYgKHRlbXBSICYmIF8uZW5kc1dpdGgodGVtcFIuRmlsZU5hbWUsIFwiLmpzb25cIikpIHtcbiAgICAgICAgICAgIHRlbXBSLkJ1ZmZlciA9IG51bGw7XG4gICAgICAgICAgICB0ZW1wUi5DaGFuZ2VzID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc3VwZXIucmVxdWVzdChhY3Rpb24sIHJlcXVlc3QsIG9wdGlvbnMpO1xuICAgIH1cbiAgICBzZXR1cFJlcG9zaXRvcnkoKSB7XG4gICAgICAgIGlmICh0aGlzLnJlcG9zaXRvcnkpIHtcbiAgICAgICAgICAgIGNvbnN0IGJyYW5jaFN1YmplY3QgPSBuZXcgU3ViamVjdCgpO1xuICAgICAgICAgICAgdGhpcy5fc29sdXRpb25EaXNwb3NhYmxlLmFkZChicmFuY2hTdWJqZWN0XG4gICAgICAgICAgICAgICAgLmRpc3RpbmN0VW50aWxDaGFuZ2VkKClcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IGF0b20uY29tbWFuZHMuZGlzcGF0Y2goYXRvbS52aWV3cy5nZXRWaWV3KGF0b20ud29ya3NwYWNlKSwgXCJvbW5pc2hhcnAtYXRvbTpyZXN0YXJ0LXNlcnZlclwiKSkpO1xuICAgICAgICAgICAgdGhpcy5fc29sdXRpb25EaXNwb3NhYmxlLmFkZCh0aGlzLnJlcG9zaXRvcnkub25EaWRDaGFuZ2VTdGF0dXNlcygoKSA9PiB7XG4gICAgICAgICAgICAgICAgYnJhbmNoU3ViamVjdC5uZXh0KHRoaXMucmVwb3NpdG9yeS5icmFuY2gpO1xuICAgICAgICAgICAgfSkpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHdoZW5Db25uZWN0ZWQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnN0YXRlLnN0YXJ0V2l0aCh0aGlzLmN1cnJlbnRTdGF0ZSlcbiAgICAgICAgICAgIC5maWx0ZXIoeCA9PiB4ID09PSBEcml2ZXJTdGF0ZS5Db25uZWN0ZWQpXG4gICAgICAgICAgICAudGFrZSgxKTtcbiAgICB9XG59XG5Tb2x1dGlvbi5fcmVnZXggPSBuZXcgUmVnRXhwKFN0cmluZy5mcm9tQ2hhckNvZGUoMHhGRkZEKSwgXCJnXCIpO1xuIiwiaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xyXG5pbXBvcnQge09ic2VydmFibGUsIFN1YmplY3R9IGZyb20gXCJyeGpzXCI7XHJcbmltcG9ydCB7Q29tcG9zaXRlRGlzcG9zYWJsZX0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcclxuaW1wb3J0IHtNb2RlbHMsIFJlcXVlc3RPcHRpb25zLCBSZWFjdGl2ZUNsaWVudCwgRHJpdmVyU3RhdGUsIFJlYWN0aXZlQ2xpZW50T3B0aW9ucywgUnVudGltZX0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcclxuaW1wb3J0IHtPbW5pc2hhcnBUZXh0RWRpdG9yfSBmcm9tIFwiLi9vbW5pc2hhcnAtdGV4dC1lZGl0b3JcIjtcclxuXHJcbmludGVyZmFjZSBTb2x1dGlvbk9wdGlvbnMgZXh0ZW5kcyBSZWFjdGl2ZUNsaWVudE9wdGlvbnMge1xyXG4gICAgdGVtcG9yYXJ5OiBib29sZWFuO1xyXG4gICAgcmVwb3NpdG9yeTogQXRvbS5HaXRSZXBvc2l0b3J5O1xyXG4gICAgaW5kZXg6IG51bWJlcjtcclxufVxyXG5cclxuaW1wb3J0IHtWaWV3TW9kZWx9IGZyb20gXCIuL3ZpZXctbW9kZWxcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBTb2x1dGlvbiBleHRlbmRzIFJlYWN0aXZlQ2xpZW50IHtcclxuICAgIHByaXZhdGUgc3RhdGljIF9yZWdleCA9IG5ldyBSZWdFeHAoU3RyaW5nLmZyb21DaGFyQ29kZSgweEZGRkQpLCBcImdcIik7XHJcblxyXG4gICAgcHVibGljIG1vZGVsOiBWaWV3TW9kZWw7XHJcbiAgICBwdWJsaWMgbG9nczogT2JzZXJ2YWJsZTxPdXRwdXRNZXNzYWdlPjtcclxuICAgIHB1YmxpYyBwYXRoOiBzdHJpbmc7XHJcbiAgICBwdWJsaWMgaW5kZXg6IG51bWJlcjtcclxuICAgIHB1YmxpYyB0ZW1wb3Jhcnk6IGJvb2xlYW4gPSBmYWxzZTtcclxuICAgIHByaXZhdGUgX3NvbHV0aW9uRGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcbiAgICBwdWJsaWMgZ2V0IGRpc3Bvc2FibGUoKSB7IHJldHVybiB0aGlzLl9zb2x1dGlvbkRpc3Bvc2FibGU7IH1cclxuXHJcbiAgICBwcml2YXRlIHJlcG9zaXRvcnk6IEF0b20uR2l0UmVwb3NpdG9yeTtcclxuICAgIHB1YmxpYyBnZXQgaXNEaXNwb3NlZCgpIHsgcmV0dXJuIHRoaXMuX3NvbHV0aW9uRGlzcG9zYWJsZS5pc0Rpc3Bvc2VkOyB9XHJcblxyXG4gICAgcHJpdmF0ZSBfaXNGb2xkZXJQZXJGaWxlID0gZmFsc2U7XHJcbiAgICBwdWJsaWMgZ2V0IGlzRm9sZGVyUGVyRmlsZSgpIHsgcmV0dXJuIHRoaXMuX2lzRm9sZGVyUGVyRmlsZTsgfVxyXG4gICAgcHVibGljIHNldCBpc0ZvbGRlclBlckZpbGUodmFsdWUpIHsgdGhpcy5faXNGb2xkZXJQZXJGaWxlID0gdmFsdWU7IH1cclxuXHJcbiAgICBjb25zdHJ1Y3RvcihvcHRpb25zOiBTb2x1dGlvbk9wdGlvbnMpIHtcclxuICAgICAgICBzdXBlcihfLmRlZmF1bHRzKG9wdGlvbnMsIHsgcnVudGltZTogUnVudGltZS5Db3JlQ2xyIH0pKTtcclxuICAgICAgICB0aGlzLmNvbmZpZ3VyZVNvbHV0aW9uKCk7XHJcbiAgICAgICAgdGhpcy50ZW1wb3JhcnkgPSBvcHRpb25zLnRlbXBvcmFyeTtcclxuICAgICAgICB0aGlzLm1vZGVsID0gbmV3IFZpZXdNb2RlbCh0aGlzKTtcclxuICAgICAgICB0aGlzLnBhdGggPSBvcHRpb25zLnByb2plY3RQYXRoO1xyXG4gICAgICAgIHRoaXMuaW5kZXggPSBvcHRpb25zLmluZGV4O1xyXG4gICAgICAgIHRoaXMucmVwb3NpdG9yeSA9IG9wdGlvbnMucmVwb3NpdG9yeTtcclxuICAgICAgICB0aGlzLnNldHVwUmVwb3NpdG9yeSgpO1xyXG4gICAgICAgIHRoaXMuX3NvbHV0aW9uRGlzcG9zYWJsZS5hZGQodGhpcy5tb2RlbCk7XHJcblxyXG4gICAgICAgIHRoaXMucmVnaXN0ZXJGaXh1cCgoYWN0aW9uOiBzdHJpbmcsIHJlcXVlc3Q6IGFueSwgb3B0cz86IFJlcXVlc3RPcHRpb25zKSA9PiB0aGlzLl9maXh1cFJlcXVlc3QoYWN0aW9uLCByZXF1ZXN0KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNvbm5lY3QoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuaXNEaXNwb3NlZCkgcmV0dXJuO1xyXG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnRTdGF0ZSA+PSBEcml2ZXJTdGF0ZS5Eb3dubG9hZGluZyAmJiB0aGlzLmN1cnJlbnRTdGF0ZSA8PSBEcml2ZXJTdGF0ZS5Db25uZWN0ZWQpIHJldHVybjtcclxuICAgICAgICBzdXBlci5jb25uZWN0KCk7XHJcblxyXG4gICAgICAgIHRoaXMubG9nKFwiU3RhcnRpbmcgT21uaVNoYXJwIHNlcnZlciAocGlkOlwiICsgdGhpcy5pZCArIFwiKVwiKTtcclxuICAgICAgICB0aGlzLmxvZyhcIk9tbmlTaGFycCBMb2NhdGlvbjogXCIgKyB0aGlzLnNlcnZlclBhdGgpO1xyXG4gICAgICAgIHRoaXMubG9nKFwiQ2hhbmdlIHRoZSBsb2NhdGlvbiB0aGF0IE9tbmlTaGFycCBpcyBsb2FkZWQgZnJvbSBieSBzZXR0aW5nIHRoZSBPTU5JU0hBUlAgZW52aXJvbm1lbnQgdmFyaWFibGVcIik7XHJcbiAgICAgICAgdGhpcy5sb2coXCJPbW5pU2hhcnAgUGF0aDogXCIgKyB0aGlzLnByb2plY3RQYXRoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGlzY29ubmVjdCgpIHtcclxuICAgICAgICBzdXBlci5kaXNjb25uZWN0KCk7XHJcblxyXG4gICAgICAgIHRoaXMubG9nKFwiT21uaXNoYXJwIHNlcnZlciBzdG9wcGVkLlwiKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGlzcG9zZSgpIHtcclxuICAgICAgICBzdXBlci5kaXNwb3NlKCk7XHJcbiAgICAgICAgdGhpcy5fc29sdXRpb25EaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGNvbmZpZ3VyZVNvbHV0aW9uKCkge1xyXG4gICAgICAgIHRoaXMubG9ncyA9IHRoaXMuZXZlbnRzLm1hcChldmVudCA9PiAoe1xyXG4gICAgICAgICAgICBtZXNzYWdlOiBldmVudC5Cb2R5ICYmIGV2ZW50LkJvZHkuTWVzc2FnZSB8fCBldmVudC5FdmVudCB8fCBcIlwiLFxyXG4gICAgICAgICAgICBsb2dMZXZlbDogZXZlbnQuQm9keSAmJiBldmVudC5Cb2R5LkxvZ0xldmVsIHx8IChldmVudC5UeXBlID09PSBcImVycm9yXCIgJiYgXCJFUlJPUlwiKSB8fCBcIklORk9STUFUSU9OXCJcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuX3NvbHV0aW9uRGlzcG9zYWJsZS5hZGQodGhpcy5lcnJvcnMuc3Vic2NyaWJlKGV4Y2VwdGlvbiA9PiB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXhjZXB0aW9uKTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuX3NvbHV0aW9uRGlzcG9zYWJsZS5hZGQodGhpcy5yZXNwb25zZXMuc3Vic2NyaWJlKGRhdGEgPT4ge1xyXG4gICAgICAgICAgICBpZiAoYXRvbS5jb25maWcuZ2V0KFwib21uaXNoYXJwLWF0b20uZGV2ZWxvcGVyTW9kZVwiKSkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJvbW5pOlwiICsgZGF0YS5jb21tYW5kLCBkYXRhLnJlcXVlc3QsIGRhdGEucmVzcG9uc2UpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX2N1cnJlbnRFZGl0b3I6IE9tbmlzaGFycFRleHRFZGl0b3I7XHJcbiAgICBwdWJsaWMgd2l0aEVkaXRvcihlZGl0b3I6IE9tbmlzaGFycFRleHRFZGl0b3IpIHtcclxuICAgICAgICB0aGlzLl9jdXJyZW50RWRpdG9yID0gZWRpdG9yO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX2ZpeHVwUmVxdWVzdDxUUmVxdWVzdCwgVFJlc3BvbnNlPihhY3Rpb246IHN0cmluZywgcmVxdWVzdDogVFJlcXVlc3QpIHtcclxuICAgICAgICAvLyBPbmx5IHNlbmQgY2hhbmdlcyBmb3IgcmVxdWVzdHMgdGhhdCByZWFsbHkgbmVlZCB0aGVtLlxyXG4gICAgICAgIGlmICh0aGlzLl9jdXJyZW50RWRpdG9yICYmIF8uaXNPYmplY3QocmVxdWVzdCkpIHtcclxuICAgICAgICAgICAgY29uc3QgZWRpdG9yID0gdGhpcy5fY3VycmVudEVkaXRvcjtcclxuICAgICAgICAgICAgY29uc3QgbWFya2VyID0gZWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKCk7XHJcbiAgICAgICAgICAgIGxldCBjb21wdXRlZENoYW5nZXM6IE1vZGVscy5MaW5lUG9zaXRpb25TcGFuVGV4dENoYW5nZVtdID0gbnVsbDtcclxuICAgICAgICAgICAgaWYgKCFfLnNvbWUoW1wiL2dvdG9cIiwgXCIvbmF2aWdhdGVcIiwgXCIvZmluZFwiLCBcIi9wYWNrYWdlXCJdLCB4ID0+IF8uc3RhcnRzV2l0aChhY3Rpb24sIHgpKSkge1xyXG4gICAgICAgICAgICAgICAgY29tcHV0ZWRDaGFuZ2VzID0gZWRpdG9yLm9tbmlzaGFycC5wb3BDaGFuZ2VzKCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIF8uZGVmYXVsdHMocmVxdWVzdCwgeyBDb2x1bW46IG1hcmtlci5jb2x1bW4sIExpbmU6IG1hcmtlci5yb3csIEZpbGVOYW1lOiBlZGl0b3IuZ2V0VVJJKCksIENoYW5nZXM6IGNvbXB1dGVkQ2hhbmdlcyB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8qIHRzbGludDpkaXNhYmxlOm5vLXN0cmluZy1saXRlcmFsICovXHJcbiAgICAgICAgaWYgKHJlcXVlc3RbXCJCdWZmZXJcIl0pIHtcclxuICAgICAgICAgICAgcmVxdWVzdFtcIkJ1ZmZlclwiXSA9IHJlcXVlc3RbXCJCdWZmZXJcIl0ucmVwbGFjZShTb2x1dGlvbi5fcmVnZXgsIFwiXCIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvKiB0c2xpbnQ6ZW5hYmxlOm5vLXN0cmluZy1saXRlcmFsICovXHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlcXVlc3Q8VFJlcXVlc3QsIFRSZXNwb25zZT4oYWN0aW9uOiBzdHJpbmcsIHJlcXVlc3Q/OiBUUmVxdWVzdCwgb3B0aW9ucz86IFJlcXVlc3RPcHRpb25zKTogT2JzZXJ2YWJsZTxUUmVzcG9uc2U+IHtcclxuICAgICAgICBpZiAodGhpcy5fY3VycmVudEVkaXRvcikge1xyXG4gICAgICAgICAgICBjb25zdCBlZGl0b3IgPSB0aGlzLl9jdXJyZW50RWRpdG9yO1xyXG4gICAgICAgICAgICB0aGlzLl9jdXJyZW50RWRpdG9yID0gbnVsbDtcclxuICAgICAgICAgICAgLy8gVE9ETzogdXBkYXRlIGFuZCBhZGQgdG8gdHlwaW5ncy5cclxuICAgICAgICAgICAgaWYgKGVkaXRvci5pc0Rlc3Ryb3llZCgpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5lbXB0eTxUUmVzcG9uc2U+KCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHRlbXBSOiBNb2RlbHMuUmVxdWVzdCA9IHJlcXVlc3Q7XHJcbiAgICAgICAgaWYgKHRlbXBSICYmIF8uZW5kc1dpdGgodGVtcFIuRmlsZU5hbWUsIFwiLmpzb25cIikpIHtcclxuICAgICAgICAgICAgdGVtcFIuQnVmZmVyID0gbnVsbDtcclxuICAgICAgICAgICAgdGVtcFIuQ2hhbmdlcyA9IG51bGw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gPGFueT5zdXBlci5yZXF1ZXN0PFRSZXF1ZXN0LCBUUmVzcG9uc2U+KGFjdGlvbiwgcmVxdWVzdCwgb3B0aW9ucyk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBzZXR1cFJlcG9zaXRvcnkoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMucmVwb3NpdG9yeSkge1xyXG4gICAgICAgICAgICBjb25zdCBicmFuY2hTdWJqZWN0ID0gbmV3IFN1YmplY3Q8c3RyaW5nPigpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5fc29sdXRpb25EaXNwb3NhYmxlLmFkZChicmFuY2hTdWJqZWN0XHJcbiAgICAgICAgICAgICAgICAuZGlzdGluY3RVbnRpbENoYW5nZWQoKVxyXG4gICAgICAgICAgICAgICAgLnN1YnNjcmliZSgoKSA9PiBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSksIFwib21uaXNoYXJwLWF0b206cmVzdGFydC1zZXJ2ZXJcIikpKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuX3NvbHV0aW9uRGlzcG9zYWJsZS5hZGQodGhpcy5yZXBvc2l0b3J5Lm9uRGlkQ2hhbmdlU3RhdHVzZXMoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgYnJhbmNoU3ViamVjdC5uZXh0KCg8YW55PnRoaXMucmVwb3NpdG9yeSkuYnJhbmNoKTtcclxuICAgICAgICAgICAgfSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgd2hlbkNvbm5lY3RlZCgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5zdGF0ZS5zdGFydFdpdGgodGhpcy5jdXJyZW50U3RhdGUpXHJcbiAgICAgICAgICAgIC5maWx0ZXIoeCA9PiB4ID09PSBEcml2ZXJTdGF0ZS5Db25uZWN0ZWQpXHJcbiAgICAgICAgICAgIC50YWtlKDEpO1xyXG4gICAgfVxyXG59XHJcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
