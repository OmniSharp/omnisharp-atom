'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Solution = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _lodash = require('lodash');

var _omnisharpClient = require('omnisharp-client');

var _rxjs = require('rxjs');

var _tsDisposables = require('ts-disposables');

var _viewModel = require('./view-model');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Solution = function (_ReactiveClient) {
    _inherits(Solution, _ReactiveClient);

    function Solution(options) {
        _classCallCheck(this, Solution);

        var _this = _possibleConstructorReturn(this, (Solution.__proto__ || Object.getPrototypeOf(Solution)).call(this, (0, _lodash.defaults)(options, { runtime: _omnisharpClient.Runtime.ClrOrMono })));

        _this.temporary = false;
        _this._solutionDisposable = new _tsDisposables.CompositeDisposable();
        _this._isFolderPerFile = false;
        _this._configureSolution();
        _this.temporary = options.temporary;
        _this.model = new _viewModel.ViewModel(_this);
        _this.path = options.projectPath;
        _this.index = options.index;
        _this.repository = options.repository;
        _this._setupRepository();
        _this._solutionDisposable.add(_this.model);
        _this.registerFixup(function (action, request, opts) {
            return _this._fixupRequest(action, request);
        });
        return _this;
    }

    _createClass(Solution, [{
        key: 'connect',
        value: function connect() {
            if (this.isDisposed) {
                return;
            }
            if (this.currentState >= _omnisharpClient.DriverState.Downloading && this.currentState <= _omnisharpClient.DriverState.Connected) {
                return;
            }
            _get(Solution.prototype.__proto__ || Object.getPrototypeOf(Solution.prototype), 'connect', this).call(this);
            this.log('Starting OmniSharp server (pid:' + this.id + ')');
            this.log('OmniSharp Location: ' + this.serverPath);
            this.log('Change the location that OmniSharp is loaded from by setting the OMNISHARP environment variable');
            this.log('OmniSharp Path: ' + this.projectPath);
        }
    }, {
        key: 'disconnect',
        value: function disconnect() {
            _get(Solution.prototype.__proto__ || Object.getPrototypeOf(Solution.prototype), 'disconnect', this).call(this);
            this.log('Omnisharp server stopped.');
        }
    }, {
        key: 'dispose',
        value: function dispose() {
            _get(Solution.prototype.__proto__ || Object.getPrototypeOf(Solution.prototype), 'dispose', this).call(this);
            this._solutionDisposable.dispose();
        }
    }, {
        key: 'withEditor',
        value: function withEditor(editor) {
            this._currentEditor = editor;
            return this;
        }
    }, {
        key: 'request',
        value: function request(action, _request, options) {
            if (this._currentEditor) {
                var editor = this._currentEditor;
                this._currentEditor = null;
                if (editor.isDestroyed()) {
                    return _rxjs.Observable.empty();
                }
            }
            var tempR = _request;
            if (tempR && (0, _lodash.endsWith)(tempR.FileName, '.json')) {
                tempR.Buffer = null;
                tempR.Changes = null;
            }
            return _get(Solution.prototype.__proto__ || Object.getPrototypeOf(Solution.prototype), 'request', this).call(this, action, _request, options);
        }
    }, {
        key: 'whenConnected',
        value: function whenConnected() {
            return this.state.startWith(this.currentState).filter(function (x) {
                return x === _omnisharpClient.DriverState.Connected;
            }).take(1);
        }
    }, {
        key: '_setupRepository',
        value: function _setupRepository() {
            var _this2 = this;

            if (this.repository) {
                (function () {
                    var branchSubject = new _rxjs.Subject();
                    _this2._solutionDisposable.add(branchSubject.distinctUntilChanged().subscribe(function () {
                        return atom.commands.dispatch(atom.views.getView(atom.workspace), 'omnisharp-atom:restart-server');
                    }));
                    _this2._solutionDisposable.add(_this2.repository.onDidChangeStatuses(function () {
                        branchSubject.next(_this2.repository.branch);
                    }));
                })();
            }
        }
    }, {
        key: '_configureSolution',
        value: function _configureSolution() {
            this.logs = this.events.map(function (event) {
                return {
                    message: event.Body && event.Body.Message || event.Event || '',
                    logLevel: event.Body && event.Body.LogLevel || event.Type === 'error' && 'ERROR' || 'INFORMATION'
                };
            });
            this._solutionDisposable.add(this.errors.subscribe(function (exception) {
                console.error(exception);
            }));
            this._solutionDisposable.add(this.responses.subscribe(function (data) {
                if (atom.config.get('omnisharp-atom.developerMode')) {
                    console.log('omni:' + data.command, data.request, data.response);
                }
            }));
        }
    }, {
        key: '_fixupRequest',
        value: function _fixupRequest(action, request) {
            if (this._currentEditor && (0, _lodash.isObject)(request)) {
                var editor = this._currentEditor;
                var marker = editor.getCursorBufferPosition();
                var computedChanges = null;
                if (!(0, _lodash.some)(['/goto', '/navigate', '/find', '/package'], function (x) {
                    return (0, _lodash.startsWith)(action, x);
                })) {
                    computedChanges = editor.omnisharp.popChanges();
                }
                (0, _lodash.defaults)(request, { Column: marker.column, Line: marker.row, FileName: editor.getURI(), Changes: computedChanges });
            }
            if (request['Buffer']) {
                request['Buffer'] = request['Buffer'].replace(Solution._regex, '');
            }
        }
    }, {
        key: 'disposable',
        get: function get() {
            return this._solutionDisposable;
        }
    }, {
        key: 'isDisposed',
        get: function get() {
            return this._solutionDisposable.isDisposed;
        }
    }, {
        key: 'isFolderPerFile',
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

Solution._regex = new RegExp(String.fromCharCode(0xFFFD), 'g');
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9zZXJ2ZXIvc29sdXRpb24udHMiXSwibmFtZXMiOlsiU29sdXRpb24iLCJvcHRpb25zIiwicnVudGltZSIsIkNsck9yTW9ubyIsInRlbXBvcmFyeSIsIl9zb2x1dGlvbkRpc3Bvc2FibGUiLCJfaXNGb2xkZXJQZXJGaWxlIiwiX2NvbmZpZ3VyZVNvbHV0aW9uIiwibW9kZWwiLCJwYXRoIiwicHJvamVjdFBhdGgiLCJpbmRleCIsInJlcG9zaXRvcnkiLCJfc2V0dXBSZXBvc2l0b3J5IiwiYWRkIiwicmVnaXN0ZXJGaXh1cCIsImFjdGlvbiIsInJlcXVlc3QiLCJvcHRzIiwiX2ZpeHVwUmVxdWVzdCIsImlzRGlzcG9zZWQiLCJjdXJyZW50U3RhdGUiLCJEb3dubG9hZGluZyIsIkNvbm5lY3RlZCIsImxvZyIsImlkIiwic2VydmVyUGF0aCIsImRpc3Bvc2UiLCJlZGl0b3IiLCJfY3VycmVudEVkaXRvciIsImlzRGVzdHJveWVkIiwiZW1wdHkiLCJ0ZW1wUiIsIkZpbGVOYW1lIiwiQnVmZmVyIiwiQ2hhbmdlcyIsInN0YXRlIiwic3RhcnRXaXRoIiwiZmlsdGVyIiwieCIsInRha2UiLCJicmFuY2hTdWJqZWN0IiwiZGlzdGluY3RVbnRpbENoYW5nZWQiLCJzdWJzY3JpYmUiLCJhdG9tIiwiY29tbWFuZHMiLCJkaXNwYXRjaCIsInZpZXdzIiwiZ2V0VmlldyIsIndvcmtzcGFjZSIsIm9uRGlkQ2hhbmdlU3RhdHVzZXMiLCJuZXh0IiwiYnJhbmNoIiwibG9ncyIsImV2ZW50cyIsIm1hcCIsIm1lc3NhZ2UiLCJldmVudCIsIkJvZHkiLCJNZXNzYWdlIiwiRXZlbnQiLCJsb2dMZXZlbCIsIkxvZ0xldmVsIiwiVHlwZSIsImVycm9ycyIsImNvbnNvbGUiLCJlcnJvciIsImV4Y2VwdGlvbiIsInJlc3BvbnNlcyIsImNvbmZpZyIsImdldCIsImRhdGEiLCJjb21tYW5kIiwicmVzcG9uc2UiLCJtYXJrZXIiLCJnZXRDdXJzb3JCdWZmZXJQb3NpdGlvbiIsImNvbXB1dGVkQ2hhbmdlcyIsIm9tbmlzaGFycCIsInBvcENoYW5nZXMiLCJDb2x1bW4iLCJjb2x1bW4iLCJMaW5lIiwicm93IiwiZ2V0VVJJIiwicmVwbGFjZSIsIl9yZWdleCIsInZhbHVlIiwiUmVnRXhwIiwiU3RyaW5nIiwiZnJvbUNoYXJDb2RlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUFBOztBQUNBOztBQUNBOztBQUNBOztBQUVBOzs7Ozs7OztJQVNNQSxROzs7QUFvQkYsc0JBQW1CQyxPQUFuQixFQUFxRDtBQUFBOztBQUFBLHdIQUMzQyxzQkFBU0EsT0FBVCxFQUFrQixFQUFFQyxTQUFTLHlCQUFRQyxTQUFuQixFQUFsQixDQUQyQzs7QUFiOUMsY0FBQUMsU0FBQSxHQUFxQixLQUFyQjtBQUNDLGNBQUFDLG1CQUFBLEdBQXNCLHdDQUF0QjtBQVFBLGNBQUFDLGdCQUFBLEdBQW1CLEtBQW5CO0FBTUosY0FBS0Msa0JBQUw7QUFDQSxjQUFLSCxTQUFMLEdBQWlCSCxRQUFRRyxTQUF6QjtBQUNBLGNBQUtJLEtBQUwsR0FBYSwrQkFBYjtBQUNBLGNBQUtDLElBQUwsR0FBWVIsUUFBUVMsV0FBcEI7QUFDQSxjQUFLQyxLQUFMLEdBQWFWLFFBQVFVLEtBQXJCO0FBQ0EsY0FBS0MsVUFBTCxHQUFrQlgsUUFBUVcsVUFBMUI7QUFDQSxjQUFLQyxnQkFBTDtBQUNBLGNBQUtSLG1CQUFMLENBQXlCUyxHQUF6QixDQUE2QixNQUFLTixLQUFsQztBQUVBLGNBQUtPLGFBQUwsQ0FBbUIsVUFBQ0MsTUFBRCxFQUFpQkMsT0FBakIsRUFBK0JDLElBQS9CO0FBQUEsbUJBQXlELE1BQUtDLGFBQUwsQ0FBbUJILE1BQW5CLEVBQTJCQyxPQUEzQixDQUF6RDtBQUFBLFNBQW5CO0FBWGlEO0FBWXBEOzs7O2tDQUVhO0FBQ1YsZ0JBQUksS0FBS0csVUFBVCxFQUFxQjtBQUFFO0FBQVM7QUFDaEMsZ0JBQUksS0FBS0MsWUFBTCxJQUFxQiw2QkFBWUMsV0FBakMsSUFBZ0QsS0FBS0QsWUFBTCxJQUFxQiw2QkFBWUUsU0FB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S0EsbUJBQUwsQ0FBeUJlLFVBQWhDO0FBQTZDOzs7NEJBRzdDO0FBQUssbUJBQU8sS0FBS2QsZ0JBQVo7QUFBK0IsUzswQkFDbkNnRixLLEVBQUs7QUFBSSxpQkFBS2hGLGdCQUFMLEdBQXdCZ0YsS0FBeEI7QUFBZ0M7Ozs7Ozs7O0FBakJyRHRGLFNBQUFxRixNQUFBLEdBQVMsSUFBSUUsTUFBSixDQUFXQyxPQUFPQyxZQUFQLENBQW9CLE1BQXBCLENBQVgsRUFBd0MsR0FBeEMsQ0FBVCIsImZpbGUiOiJsaWIvc2VydmVyL3NvbHV0aW9uLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZGVmYXVsdHMsIGVuZHNXaXRoLCBpc09iamVjdCwgc29tZSwgc3RhcnRzV2l0aCB9IGZyb20gJ2xvZGFzaCc7XHJcbmltcG9ydCB7IERyaXZlclN0YXRlLCBNb2RlbHMsIFJlYWN0aXZlQ2xpZW50LCBJUmVhY3RpdmVDbGllbnRPcHRpb25zLCBSZXF1ZXN0T3B0aW9ucywgUnVudGltZSB9IGZyb20gJ29tbmlzaGFycC1jbGllbnQnO1xyXG5pbXBvcnQgeyBPYnNlcnZhYmxlLCBTdWJqZWN0IH0gZnJvbSAncnhqcyc7XHJcbmltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUgfSBmcm9tICd0cy1kaXNwb3NhYmxlcyc7XHJcbmltcG9ydCB7IElPbW5pc2hhcnBUZXh0RWRpdG9yIH0gZnJvbSAnLi9vbW5pc2hhcnAtdGV4dC1lZGl0b3InO1xyXG5pbXBvcnQgeyBWaWV3TW9kZWwgfSBmcm9tICcuL3ZpZXctbW9kZWwnO1xyXG5cclxuaW50ZXJmYWNlIElTb2x1dGlvbk9wdGlvbnMgZXh0ZW5kcyBJUmVhY3RpdmVDbGllbnRPcHRpb25zIHtcclxuICAgIHRlbXBvcmFyeTogYm9vbGVhbjtcclxuICAgIHJlcG9zaXRvcnk6IEF0b20uR2l0UmVwb3NpdG9yeTtcclxuICAgIGluZGV4OiBudW1iZXI7XHJcbn1cclxuXHJcbi8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpleHBvcnQtbmFtZVxyXG5leHBvcnQgY2xhc3MgU29sdXRpb24gZXh0ZW5kcyBSZWFjdGl2ZUNsaWVudCB7XHJcbiAgICBwcml2YXRlIHN0YXRpYyBfcmVnZXggPSBuZXcgUmVnRXhwKFN0cmluZy5mcm9tQ2hhckNvZGUoMHhGRkZEKSwgJ2cnKTtcclxuXHJcbiAgICBwdWJsaWMgbW9kZWw6IFZpZXdNb2RlbDtcclxuICAgIHB1YmxpYyBsb2dzOiBPYnNlcnZhYmxlPE91dHB1dE1lc3NhZ2U+O1xyXG4gICAgcHVibGljIHBhdGg6IHN0cmluZztcclxuICAgIHB1YmxpYyBpbmRleDogbnVtYmVyO1xyXG4gICAgcHVibGljIHRlbXBvcmFyeTogYm9vbGVhbiA9IGZhbHNlO1xyXG4gICAgcHJpdmF0ZSBfc29sdXRpb25EaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgIHByaXZhdGUgX2N1cnJlbnRFZGl0b3I6IElPbW5pc2hhcnBUZXh0RWRpdG9yO1xyXG5cclxuICAgIHB1YmxpYyBnZXQgZGlzcG9zYWJsZSgpIHsgcmV0dXJuIHRoaXMuX3NvbHV0aW9uRGlzcG9zYWJsZTsgfVxyXG5cclxuICAgIHByaXZhdGUgcmVwb3NpdG9yeTogQXRvbS5HaXRSZXBvc2l0b3J5O1xyXG4gICAgcHVibGljIGdldCBpc0Rpc3Bvc2VkKCkgeyByZXR1cm4gdGhpcy5fc29sdXRpb25EaXNwb3NhYmxlLmlzRGlzcG9zZWQ7IH1cclxuXHJcbiAgICBwcml2YXRlIF9pc0ZvbGRlclBlckZpbGUgPSBmYWxzZTtcclxuICAgIHB1YmxpYyBnZXQgaXNGb2xkZXJQZXJGaWxlKCkgeyByZXR1cm4gdGhpcy5faXNGb2xkZXJQZXJGaWxlOyB9XHJcbiAgICBwdWJsaWMgc2V0IGlzRm9sZGVyUGVyRmlsZSh2YWx1ZSkgeyB0aGlzLl9pc0ZvbGRlclBlckZpbGUgPSB2YWx1ZTsgfVxyXG5cclxuICAgIHB1YmxpYyBjb25zdHJ1Y3RvcihvcHRpb25zOiBQYXJ0aWFsPElTb2x1dGlvbk9wdGlvbnM+KSB7XHJcbiAgICAgICAgc3VwZXIoZGVmYXVsdHMob3B0aW9ucywgeyBydW50aW1lOiBSdW50aW1lLkNsck9yTW9ubyB9KSk7XHJcbiAgICAgICAgdGhpcy5fY29uZmlndXJlU29sdXRpb24oKTtcclxuICAgICAgICB0aGlzLnRlbXBvcmFyeSA9IG9wdGlvbnMudGVtcG9yYXJ5O1xyXG4gICAgICAgIHRoaXMubW9kZWwgPSBuZXcgVmlld01vZGVsKHRoaXMpO1xyXG4gICAgICAgIHRoaXMucGF0aCA9IG9wdGlvbnMucHJvamVjdFBhdGg7XHJcbiAgICAgICAgdGhpcy5pbmRleCA9IG9wdGlvbnMuaW5kZXg7XHJcbiAgICAgICAgdGhpcy5yZXBvc2l0b3J5ID0gb3B0aW9ucy5yZXBvc2l0b3J5O1xyXG4gICAgICAgIHRoaXMuX3NldHVwUmVwb3NpdG9yeSgpO1xyXG4gICAgICAgIHRoaXMuX3NvbHV0aW9uRGlzcG9zYWJsZS5hZGQodGhpcy5tb2RlbCk7XHJcblxyXG4gICAgICAgIHRoaXMucmVnaXN0ZXJGaXh1cCgoYWN0aW9uOiBzdHJpbmcsIHJlcXVlc3Q6IGFueSwgb3B0cz86IFJlcXVlc3RPcHRpb25zKSA9PiB0aGlzLl9maXh1cFJlcXVlc3QoYWN0aW9uLCByZXF1ZXN0KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNvbm5lY3QoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuaXNEaXNwb3NlZCkgeyByZXR1cm47IH1cclxuICAgICAgICBpZiAodGhpcy5jdXJyZW50U3RhdGUgPj0gRHJpdmVyU3RhdGUuRG93bmxvYWRpbmcgJiYgdGhpcy5jdXJyZW50U3RhdGUgPD0gRHJpdmVyU3RhdGUuQ29ubmVjdGVkKSB7IHJldHVybjsgfVxyXG4gICAgICAgIHN1cGVyLmNvbm5lY3QoKTtcclxuXHJcbiAgICAgICAgdGhpcy5sb2coJ1N0YXJ0aW5nIE9tbmlTaGFycCBzZXJ2ZXIgKHBpZDonICsgdGhpcy5pZCArICcpJyk7XHJcbiAgICAgICAgdGhpcy5sb2coJ09tbmlTaGFycCBMb2NhdGlvbjogJyArIHRoaXMuc2VydmVyUGF0aCk7XHJcbiAgICAgICAgdGhpcy5sb2coJ0NoYW5nZSB0aGUgbG9jYXRpb24gdGhhdCBPbW5pU2hhcnAgaXMgbG9hZGVkIGZyb20gYnkgc2V0dGluZyB0aGUgT01OSVNIQVJQIGVudmlyb25tZW50IHZhcmlhYmxlJyk7XHJcbiAgICAgICAgdGhpcy5sb2coJ09tbmlTaGFycCBQYXRoOiAnICsgdGhpcy5wcm9qZWN0UGF0aCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRpc2Nvbm5lY3QoKSB7XHJcbiAgICAgICAgc3VwZXIuZGlzY29ubmVjdCgpO1xyXG5cclxuICAgICAgICB0aGlzLmxvZygnT21uaXNoYXJwIHNlcnZlciBzdG9wcGVkLicpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkaXNwb3NlKCkge1xyXG4gICAgICAgIHN1cGVyLmRpc3Bvc2UoKTtcclxuICAgICAgICB0aGlzLl9zb2x1dGlvbkRpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB3aXRoRWRpdG9yKGVkaXRvcjogSU9tbmlzaGFycFRleHRFZGl0b3IpIHtcclxuICAgICAgICB0aGlzLl9jdXJyZW50RWRpdG9yID0gZWRpdG9yO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZXF1ZXN0PFRSZXF1ZXN0LCBUUmVzcG9uc2U+KGFjdGlvbjogc3RyaW5nLCByZXF1ZXN0PzogVFJlcXVlc3QsIG9wdGlvbnM/OiBSZXF1ZXN0T3B0aW9ucyk6IE9ic2VydmFibGU8VFJlc3BvbnNlPiB7XHJcbiAgICAgICAgaWYgKHRoaXMuX2N1cnJlbnRFZGl0b3IpIHtcclxuICAgICAgICAgICAgY29uc3QgZWRpdG9yID0gdGhpcy5fY3VycmVudEVkaXRvcjtcclxuICAgICAgICAgICAgdGhpcy5fY3VycmVudEVkaXRvciA9IG51bGw7XHJcbiAgICAgICAgICAgIC8vIFRPRE86IHVwZGF0ZSBhbmQgYWRkIHRvIHR5cGluZ3MuXHJcbiAgICAgICAgICAgIGlmIChlZGl0b3IuaXNEZXN0cm95ZWQoKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuZW1wdHk8VFJlc3BvbnNlPigpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCB0ZW1wUjogTW9kZWxzLlJlcXVlc3QgPSByZXF1ZXN0O1xyXG4gICAgICAgIGlmICh0ZW1wUiAmJiBlbmRzV2l0aCh0ZW1wUi5GaWxlTmFtZSwgJy5qc29uJykpIHtcclxuICAgICAgICAgICAgdGVtcFIuQnVmZmVyID0gbnVsbDtcclxuICAgICAgICAgICAgdGVtcFIuQ2hhbmdlcyA9IG51bGw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gPGFueT5zdXBlci5yZXF1ZXN0PFRSZXF1ZXN0LCBUUmVzcG9uc2U+KGFjdGlvbiwgcmVxdWVzdCwgb3B0aW9ucyk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHdoZW5Db25uZWN0ZWQoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc3RhdGUuc3RhcnRXaXRoKHRoaXMuY3VycmVudFN0YXRlKVxyXG4gICAgICAgICAgICAuZmlsdGVyKHggPT4geCA9PT0gRHJpdmVyU3RhdGUuQ29ubmVjdGVkKVxyXG4gICAgICAgICAgICAudGFrZSgxKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9zZXR1cFJlcG9zaXRvcnkoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMucmVwb3NpdG9yeSkge1xyXG4gICAgICAgICAgICBjb25zdCBicmFuY2hTdWJqZWN0ID0gbmV3IFN1YmplY3Q8c3RyaW5nPigpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5fc29sdXRpb25EaXNwb3NhYmxlLmFkZChicmFuY2hTdWJqZWN0XHJcbiAgICAgICAgICAgICAgICAuZGlzdGluY3RVbnRpbENoYW5nZWQoKVxyXG4gICAgICAgICAgICAgICAgLnN1YnNjcmliZSgoKSA9PiBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSksICdvbW5pc2hhcnAtYXRvbTpyZXN0YXJ0LXNlcnZlcicpKSk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLl9zb2x1dGlvbkRpc3Bvc2FibGUuYWRkKHRoaXMucmVwb3NpdG9yeS5vbkRpZENoYW5nZVN0YXR1c2VzKCgpID0+IHtcclxuICAgICAgICAgICAgICAgIGJyYW5jaFN1YmplY3QubmV4dCgoPGFueT50aGlzLnJlcG9zaXRvcnkpLmJyYW5jaCk7XHJcbiAgICAgICAgICAgIH0pKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfY29uZmlndXJlU29sdXRpb24oKSB7XHJcbiAgICAgICAgdGhpcy5sb2dzID0gdGhpcy5ldmVudHMubWFwKGV2ZW50ID0+ICh7XHJcbiAgICAgICAgICAgIG1lc3NhZ2U6IGV2ZW50LkJvZHkgJiYgZXZlbnQuQm9keS5NZXNzYWdlIHx8IGV2ZW50LkV2ZW50IHx8ICcnLFxyXG4gICAgICAgICAgICBsb2dMZXZlbDogZXZlbnQuQm9keSAmJiBldmVudC5Cb2R5LkxvZ0xldmVsIHx8IChldmVudC5UeXBlID09PSAnZXJyb3InICYmICdFUlJPUicpIHx8ICdJTkZPUk1BVElPTidcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuX3NvbHV0aW9uRGlzcG9zYWJsZS5hZGQodGhpcy5lcnJvcnMuc3Vic2NyaWJlKGV4Y2VwdGlvbiA9PiB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXhjZXB0aW9uKTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuX3NvbHV0aW9uRGlzcG9zYWJsZS5hZGQodGhpcy5yZXNwb25zZXMuc3Vic2NyaWJlKGRhdGEgPT4ge1xyXG4gICAgICAgICAgICBpZiAoYXRvbS5jb25maWcuZ2V0KCdvbW5pc2hhcnAtYXRvbS5kZXZlbG9wZXJNb2RlJykpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdvbW5pOicgKyBkYXRhLmNvbW1hbmQsIGRhdGEucmVxdWVzdCwgZGF0YS5yZXNwb25zZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfZml4dXBSZXF1ZXN0PFRSZXF1ZXN0LCBUUmVzcG9uc2U+KGFjdGlvbjogc3RyaW5nLCByZXF1ZXN0OiBUUmVxdWVzdCkge1xyXG4gICAgICAgIC8vIE9ubHkgc2VuZCBjaGFuZ2VzIGZvciByZXF1ZXN0cyB0aGF0IHJlYWxseSBuZWVkIHRoZW0uXHJcbiAgICAgICAgaWYgKHRoaXMuX2N1cnJlbnRFZGl0b3IgJiYgaXNPYmplY3QocmVxdWVzdCkpIHtcclxuICAgICAgICAgICAgY29uc3QgZWRpdG9yID0gdGhpcy5fY3VycmVudEVkaXRvcjtcclxuICAgICAgICAgICAgY29uc3QgbWFya2VyID0gZWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKCk7XHJcbiAgICAgICAgICAgIGxldCBjb21wdXRlZENoYW5nZXM6IE1vZGVscy5MaW5lUG9zaXRpb25TcGFuVGV4dENoYW5nZVtdID0gbnVsbDtcclxuICAgICAgICAgICAgaWYgKCFzb21lKFsnL2dvdG8nLCAnL25hdmlnYXRlJywgJy9maW5kJywgJy9wYWNrYWdlJ10sIHggPT4gc3RhcnRzV2l0aChhY3Rpb24sIHgpKSkge1xyXG4gICAgICAgICAgICAgICAgY29tcHV0ZWRDaGFuZ2VzID0gZWRpdG9yLm9tbmlzaGFycC5wb3BDaGFuZ2VzKCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGRlZmF1bHRzKHJlcXVlc3QsIHsgQ29sdW1uOiBtYXJrZXIuY29sdW1uLCBMaW5lOiBtYXJrZXIucm93LCBGaWxlTmFtZTogZWRpdG9yLmdldFVSSSgpLCBDaGFuZ2VzOiBjb21wdXRlZENoYW5nZXMgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvKiB0c2xpbnQ6ZGlzYWJsZTpuby1zdHJpbmctbGl0ZXJhbCAqL1xyXG4gICAgICAgIGlmIChyZXF1ZXN0WydCdWZmZXInXSkge1xyXG4gICAgICAgICAgICByZXF1ZXN0WydCdWZmZXInXSA9IHJlcXVlc3RbJ0J1ZmZlciddLnJlcGxhY2UoU29sdXRpb24uX3JlZ2V4LCAnJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8qIHRzbGludDplbmFibGU6bm8tc3RyaW5nLWxpdGVyYWwgKi9cclxuICAgIH1cclxufVxyXG4iXX0=
