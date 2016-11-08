"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.codeAction = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _rxjs = require("rxjs");

var _tsDisposables = require("ts-disposables");

var _omni = require("../server/omni");

var _applyChanges = require("../services/apply-changes");

var _codeActionsView = require("../views/code-actions-view");

var _codeActionsView2 = _interopRequireDefault(_codeActionsView);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var CodeAction = function () {
    function CodeAction() {
        _classCallCheck(this, CodeAction);

        this.required = true;
        this.title = "Code Actions";
        this.description = "Adds code action support to omnisharp-atom.";
    }

    _createClass(CodeAction, [{
        key: "activate",
        value: function activate() {
            var _this = this;

            this.disposable = new _tsDisposables.CompositeDisposable();
            this.disposable.add(_omni.Omni.addTextEditorCommand("omnisharp-atom:get-code-actions", function () {
                var editor = atom.workspace.getActiveTextEditor();
                _this.getCodeActionsRequest(editor).subscribe(function (_ref) {
                    var request = _ref.request,
                        response = _ref.response;

                    _this.view = (0, _codeActionsView2.default)({
                        items: response.CodeActions,
                        confirmed: function confirmed(item) {
                            if (!editor || editor.isDestroyed()) return;
                            _this.runCodeActionRequest(editor, request, item.Identifier).subscribe(function (resp) {
                                return (0, _applyChanges.applyAllChanges)(resp.Changes);
                            });
                        }
                    }, editor);
                });
            }));
            this.disposable.add(_omni.Omni.switchActiveEditor(function (editor, cd) {
                var word = void 0,
                    marker = void 0,
                    subscription = void 0;
                cd.add(_omni.Omni.listener.getcodeactions.filter(function (z) {
                    return z.request.FileName === editor.getPath();
                }).filter(function (ctx) {
                    return ctx.response.CodeActions.length > 0;
                }).subscribe(function (_ref2) {
                    var request = _ref2.request;

                    if (marker) {
                        marker.destroy();
                        marker = null;
                    }
                    var range = [[request.Line, 0], [request.Line, 0]];
                    marker = editor.markBufferRange(range);
                    editor.decorateMarker(marker, { type: "line-number", class: "quickfix" });
                }));
                var makeLightbulbRequest = function makeLightbulbRequest(position) {
                    if (subscription) subscription.dispose();
                    if (!editor || editor.isDestroyed()) return;
                    _this.getCodeActionsRequest(editor, true).subscribe(function (ctx) {
                        var response = ctx.response;

                        if (response.CodeActions.length > 0) {
                            if (marker) {
                                marker.destroy();
                                marker = null;
                            }
                            var rng = [[position.row, 0], [position.row, 0]];
                            marker = editor.markBufferRange(rng);
                            editor.decorateMarker(marker, { type: "line-number", class: "quickfix" });
                        }
                    });
                };
                var update = function update(pos) {
                    if (subscription) subscription.dispose();
                    makeLightbulbRequest(pos);
                };
                var onDidChangeCursorPosition = new _rxjs.Subject();
                cd.add(onDidChangeCursorPosition);
                var onDidStopChanging = new _rxjs.Subject();
                cd.add(_rxjs.Observable.combineLatest(onDidChangeCursorPosition, onDidStopChanging, function (cursor, changing) {
                    return cursor;
                }).debounceTime(1000).subscribe(function (cursor) {
                    return update(cursor.newBufferPosition);
                }));
                cd.add(editor.onDidStopChanging(_lodash2.default.debounce(function () {
                    return onDidStopChanging.next(true);
                }, 1000)));
                cd.add(editor.onDidChangeCursorPosition(_lodash2.default.debounce(function (e) {
                    var oldPos = e.oldBufferPosition;
                    var newPos = e.newBufferPosition;
                    var newWord = editor.getWordUnderCursor();
                    if (word !== newWord || oldPos.row !== newPos.row) {
                        word = newWord;
                        if (marker) {
                            marker.destroy();
                            marker = null;
                        }
                    }
                    if (!onDidChangeCursorPosition.isStopped) {
                        onDidChangeCursorPosition.next(e);
                    }
                }, 1000)));
            }));
        }
    }, {
        key: "getCodeActionsRequest",
        value: function getCodeActionsRequest(editor) {
            var silent = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

            if (!editor || editor.isDestroyed()) return _rxjs.Observable.empty();
            var request = this.getRequest(editor);
            return _omni.Omni.request(editor, function (solution) {
                return solution.getcodeactions(request);
            }).map(function (response) {
                return { request: request, response: response };
            });
        }
    }, {
        key: "runCodeActionRequest",
        value: function runCodeActionRequest(editor, getRequest, codeAction) {
            if (!editor || editor.isDestroyed()) return _rxjs.Observable.empty();
            var request = this.getRequest(editor, codeAction);
            request.Selection = getRequest.Selection;
            return _omni.Omni.request(editor, function (solution) {
                return solution.runcodeaction(request);
            });
        }
    }, {
        key: "getRequest",
        value: function getRequest(editor, codeAction) {
            var range = editor.getSelectedBufferRange();
            var request = {
                WantsTextChanges: true,
                Selection: {
                    Start: {
                        Line: range.start.row,
                        Column: range.start.column
                    },
                    End: {
                        Line: range.end.row,
                        Column: range.end.column
                    }
                }
            };
            if (codeAction !== undefined) {
                request.Identifier = codeAction;
            }
            return request;
        }
    }, {
        key: "dispose",
        value: function dispose() {
            this.disposable.dispose();
        }
    }]);

    return CodeAction;
}();

var codeAction = exports.codeAction = new CodeAction();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9jb2RlLWFjdGlvbi5qcyIsImxpYi9mZWF0dXJlcy9jb2RlLWFjdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7OztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOzs7Ozs7OztJQ0lBO0FBQUEsMEJBQUE7OztBQWlKVyxhQUFBLFFBQUEsR0FBVyxJQUFYLENBakpYO0FBa0pXLGFBQUEsS0FBQSxHQUFRLGNBQVIsQ0FsSlg7QUFtSlcsYUFBQSxXQUFBLEdBQWMsNkNBQWQsQ0FuSlg7S0FBQTs7OzttQ0FLbUI7OztBQUNYLGlCQUFLLFVBQUwsR0FBa0Isd0NBQWxCLENBRFc7QUFHWCxpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLFdBQUssb0JBQUwsQ0FBMEIsaUNBQTFCLEVBQTZELFlBQUE7QUFFN0Usb0JBQU0sU0FBUyxLQUFLLFNBQUwsQ0FBZSxtQkFBZixFQUFULENBRnVFO0FBRzdFLHNCQUFLLHFCQUFMLENBQTJCLE1BQTNCLEVBQ0ssU0FETCxDQUNlLGdCQUFvQjt3QkFBbEI7d0JBQVMseUJBQVM7O0FBRTNCLDBCQUFLLElBQUwsR0FBWSwrQkFBZ0I7QUFDeEIsK0JBQU8sU0FBUyxXQUFUO0FBQ1AsbUNBQVcsbUJBQUMsSUFBRCxFQUFLO0FBQ1osZ0NBQUksQ0FBQyxNQUFELElBQVcsT0FBTyxXQUFQLEVBQVgsRUFBaUMsT0FBckM7QUFFQSxrQ0FBSyxvQkFBTCxDQUEwQixNQUExQixFQUFrQyxPQUFsQyxFQUEyQyxLQUFLLFVBQUwsQ0FBM0MsQ0FDSyxTQURMLENBQ2UsVUFBQyxJQUFEO3VDQUFVLG1DQUFnQixLQUFLLE9BQUw7NkJBQTFCLENBRGYsQ0FIWTt5QkFBTDtxQkFGSCxFQVFULE1BUlMsQ0FBWixDQUYyQjtpQkFBcEIsQ0FEZixDQUg2RTthQUFBLENBQWpGLEVBSFc7QUFxQlgsaUJBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQixXQUFLLGtCQUFMLENBQXdCLFVBQUMs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Q0FKNkY7QUFLakgsbUJBQU8sV0FBSyxPQUFMLENBQWEsTUFBYixFQUFxQjt1QkFBWSxTQUFTLGFBQVQsQ0FBdUIsT0FBdkI7YUFBWixDQUE1QixDQUxpSDs7OzttQ0FVbEcsUUFBeUIsWUFBbUI7QUFDM0QsZ0JBQU0sUUFBYSxPQUFPLHNCQUFQLEVBQWIsQ0FEcUQ7QUFFM0QsZ0JBQU0sVUFBMEM7QUFDNUMsa0NBQWtCLElBQWxCO0FBQ0EsMkJBQVc7QUFDUCwyQkFBTztBQUNILDhCQUFNLE1BQU0sS0FBTixDQUFZLEdBQVo7QUFDTixnQ0FBUSxNQUFNLEtBQU4sQ0FBWSxNQUFaO3FCQUZaO0FBSUEseUJBQUs7QUFDRCw4QkFBTSxNQUFNLEdBQU4sQ0FBVSxHQUFWO0FBQ04sZ0NBQVEsTUFBTSxHQUFOLENBQVUsTUFBVjtxQkFGWjtpQkFMSjthQUZFLENBRnFEO0FBZ0IzRCxnQkFBSSxlQUFlLFNBQWYsRUFBMEI7QUFDMUIsd0JBQVEsVUFBUixHQUFxQixVQUFyQixDQUQwQjthQUE5QjtBQUlBLG1CQUFPLE9BQVAsQ0FwQjJEOzs7O2tDQXVCakQ7QUFDVixpQkFBSyxVQUFMLENBQWdCLE9BQWhCLEdBRFU7Ozs7Ozs7QUFTWCxJQUFNLGtDQUFhLElBQUksVUFBSixFQUFiIiwiZmlsZSI6ImxpYi9mZWF0dXJlcy9jb2RlLWFjdGlvbi5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcbmltcG9ydCB7IFN1YmplY3QsIE9ic2VydmFibGUgfSBmcm9tIFwicnhqc1wiO1xuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSB9IGZyb20gXCJ0cy1kaXNwb3NhYmxlc1wiO1xuaW1wb3J0IHsgT21uaSB9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xuaW1wb3J0IHsgYXBwbHlBbGxDaGFuZ2VzIH0gZnJvbSBcIi4uL3NlcnZpY2VzL2FwcGx5LWNoYW5nZXNcIjtcbmltcG9ydCBjb2RlQWN0aW9uc1ZpZXcgZnJvbSBcIi4uL3ZpZXdzL2NvZGUtYWN0aW9ucy12aWV3XCI7XG5jbGFzcyBDb2RlQWN0aW9uIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5yZXF1aXJlZCA9IHRydWU7XG4gICAgICAgIHRoaXMudGl0bGUgPSBcIkNvZGUgQWN0aW9uc1wiO1xuICAgICAgICB0aGlzLmRlc2NyaXB0aW9uID0gXCJBZGRzIGNvZGUgYWN0aW9uIHN1cHBvcnQgdG8gb21uaXNoYXJwLWF0b20uXCI7XG4gICAgfVxuICAgIGFjdGl2YXRlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuYWRkVGV4dEVkaXRvckNvbW1hbmQoXCJvbW5pc2hhcnAtYXRvbTpnZXQtY29kZS1hY3Rpb25zXCIsICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGVkaXRvciA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKTtcbiAgICAgICAgICAgIHRoaXMuZ2V0Q29kZUFjdGlvbnNSZXF1ZXN0KGVkaXRvcilcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKCh7IHJlcXVlc3QsIHJlc3BvbnNlIH0pID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLnZpZXcgPSBjb2RlQWN0aW9uc1ZpZXcoe1xuICAgICAgICAgICAgICAgICAgICBpdGVtczogcmVzcG9uc2UuQ29kZUFjdGlvbnMsXG4gICAgICAgICAgICAgICAgICAgIGNvbmZpcm1lZDogKGl0ZW0pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghZWRpdG9yIHx8IGVkaXRvci5pc0Rlc3Ryb3llZCgpKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucnVuQ29kZUFjdGlvblJlcXVlc3QoZWRpdG9yLCByZXF1ZXN0LCBpdGVtLklkZW50aWZpZXIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLnN1YnNjcmliZSgocmVzcCkgPT4gYXBwbHlBbGxDaGFuZ2VzKHJlc3AuQ2hhbmdlcykpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSwgZWRpdG9yKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5zd2l0Y2hBY3RpdmVFZGl0b3IoKGVkaXRvciwgY2QpID0+IHtcbiAgICAgICAgICAgIGxldCB3b3JkLCBtYXJrZXIsIHN1YnNjcmlwdGlvbjtcbiAgICAgICAgICAgIGNkLmFkZChPbW5pLmxpc3RlbmVyLmdldGNvZGVhY3Rpb25zXG4gICAgICAgICAgICAgICAgLmZpbHRlcih6ID0+IHoucmVxdWVzdC5GaWxlTmFtZSA9PT0gZWRpdG9yLmdldFBhdGgoKSlcbiAgICAgICAgICAgICAgICAuZmlsdGVyKGN0eCA9PiBjdHgucmVzcG9uc2UuQ29kZUFjdGlvbnMubGVuZ3RoID4gMClcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKCh7IHJlcXVlc3QgfSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChtYXJrZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgbWFya2VyLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICAgICAgbWFya2VyID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3QgcmFuZ2UgPSBbW3JlcXVlc3QuTGluZSwgMF0sIFtyZXF1ZXN0LkxpbmUsIDBdXTtcbiAgICAgICAgICAgICAgICBtYXJrZXIgPSBlZGl0b3IubWFya0J1ZmZlclJhbmdlKHJhbmdlKTtcbiAgICAgICAgICAgICAgICBlZGl0b3IuZGVjb3JhdGVNYXJrZXIobWFya2VyLCB7IHR5cGU6IFwibGluZS1udW1iZXJcIiwgY2xhc3M6IFwicXVpY2tmaXhcIiB9KTtcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIGNvbnN0IG1ha2VMaWdodGJ1bGJSZXF1ZXN0ID0gKHBvc2l0aW9uKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHN1YnNjcmlwdGlvbilcbiAgICAgICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9uLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgICAgICBpZiAoIWVkaXRvciB8fCBlZGl0b3IuaXNEZXN0cm95ZWQoKSlcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIHRoaXMuZ2V0Q29kZUFjdGlvbnNSZXF1ZXN0KGVkaXRvciwgdHJ1ZSlcbiAgICAgICAgICAgICAgICAgICAgLnN1YnNjcmliZShjdHggPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB7IHJlc3BvbnNlIH0gPSBjdHg7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZS5Db2RlQWN0aW9ucy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobWFya2VyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFya2VyLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXJrZXIgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgcm5nID0gW1twb3NpdGlvbi5yb3csIDBdLCBbcG9zaXRpb24ucm93LCAwXV07XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXJrZXIgPSBlZGl0b3IubWFya0J1ZmZlclJhbmdlKHJuZyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBlZGl0b3IuZGVjb3JhdGVNYXJrZXIobWFya2VyLCB7IHR5cGU6IFwibGluZS1udW1iZXJcIiwgY2xhc3M6IFwicXVpY2tmaXhcIiB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGNvbnN0IHVwZGF0ZSA9IChwb3MpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoc3Vic2NyaXB0aW9uKVxuICAgICAgICAgICAgICAgICAgICBzdWJzY3JpcHRpb24uZGlzcG9zZSgpO1xuICAgICAgICAgICAgICAgIG1ha2VMaWdodGJ1bGJSZXF1ZXN0KHBvcyk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgY29uc3Qgb25EaWRDaGFuZ2VDdXJzb3JQb3NpdGlvbiA9IG5ldyBTdWJqZWN0KCk7XG4gICAgICAgICAgICBjZC5hZGQob25EaWRDaGFuZ2VDdXJzb3JQb3NpdGlvbik7XG4gICAgICAgICAgICBjb25zdCBvbkRpZFN0b3BDaGFuZ2luZyA9IG5ldyBTdWJqZWN0KCk7XG4gICAgICAgICAgICBjZC5hZGQoT2JzZXJ2YWJsZS5jb21iaW5lTGF0ZXN0KG9uRGlkQ2hhbmdlQ3Vyc29yUG9zaXRpb24sIG9uRGlkU3RvcENoYW5naW5nLCAoY3Vyc29yLCBjaGFuZ2luZykgPT4gY3Vyc29yKVxuICAgICAgICAgICAgICAgIC5kZWJvdW5jZVRpbWUoMTAwMClcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKGN1cnNvciA9PiB1cGRhdGUoY3Vyc29yLm5ld0J1ZmZlclBvc2l0aW9uKSkpO1xuICAgICAgICAgICAgY2QuYWRkKGVkaXRvci5vbkRpZFN0b3BDaGFuZ2luZyhfLmRlYm91bmNlKCgpID0+IG9uRGlkU3RvcENoYW5naW5nLm5leHQodHJ1ZSksIDEwMDApKSk7XG4gICAgICAgICAgICBjZC5hZGQoZWRpdG9yLm9uRGlkQ2hhbmdlQ3Vyc29yUG9zaXRpb24oXy5kZWJvdW5jZSgoZSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IG9sZFBvcyA9IGUub2xkQnVmZmVyUG9zaXRpb247XG4gICAgICAgICAgICAgICAgY29uc3QgbmV3UG9zID0gZS5uZXdCdWZmZXJQb3NpdGlvbjtcbiAgICAgICAgICAgICAgICBjb25zdCBuZXdXb3JkID0gZWRpdG9yLmdldFdvcmRVbmRlckN1cnNvcigpO1xuICAgICAgICAgICAgICAgIGlmICh3b3JkICE9PSBuZXdXb3JkIHx8IG9sZFBvcy5yb3cgIT09IG5ld1Bvcy5yb3cpIHtcbiAgICAgICAgICAgICAgICAgICAgd29yZCA9IG5ld1dvcmQ7XG4gICAgICAgICAgICAgICAgICAgIGlmIChtYXJrZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcmtlci5kZXN0cm95KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXJrZXIgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICghb25EaWRDaGFuZ2VDdXJzb3JQb3NpdGlvbi5pc1N0b3BwZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgb25EaWRDaGFuZ2VDdXJzb3JQb3NpdGlvbi5uZXh0KGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIDEwMDApKSk7XG4gICAgICAgIH0pKTtcbiAgICB9XG4gICAgZ2V0Q29kZUFjdGlvbnNSZXF1ZXN0KGVkaXRvciwgc2lsZW50ID0gdHJ1ZSkge1xuICAgICAgICBpZiAoIWVkaXRvciB8fCBlZGl0b3IuaXNEZXN0cm95ZWQoKSlcbiAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmVtcHR5KCk7XG4gICAgICAgIGNvbnN0IHJlcXVlc3QgPSB0aGlzLmdldFJlcXVlc3QoZWRpdG9yKTtcbiAgICAgICAgcmV0dXJuIE9tbmkucmVxdWVzdChlZGl0b3IsIHNvbHV0aW9uID0+IHNvbHV0aW9uLmdldGNvZGVhY3Rpb25zKHJlcXVlc3QpKVxuICAgICAgICAgICAgLm1hcChyZXNwb25zZSA9PiAoeyByZXF1ZXN0LCByZXNwb25zZSB9KSk7XG4gICAgfVxuICAgIHJ1bkNvZGVBY3Rpb25SZXF1ZXN0KGVkaXRvciwgZ2V0UmVxdWVzdCwgY29kZUFjdGlvbikge1xuICAgICAgICBpZiAoIWVkaXRvciB8fCBlZGl0b3IuaXNEZXN0cm95ZWQoKSlcbiAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmVtcHR5KCk7XG4gICAgICAgIGNvbnN0IHJlcXVlc3QgPSB0aGlzLmdldFJlcXVlc3QoZWRpdG9yLCBjb2RlQWN0aW9uKTtcbiAgICAgICAgcmVxdWVzdC5TZWxlY3Rpb24gPSBnZXRSZXF1ZXN0LlNlbGVjdGlvbjtcbiAgICAgICAgcmV0dXJuIE9tbmkucmVxdWVzdChlZGl0b3IsIHNvbHV0aW9uID0+IHNvbHV0aW9uLnJ1bmNvZGVhY3Rpb24ocmVxdWVzdCkpO1xuICAgIH1cbiAgICBnZXRSZXF1ZXN0KGVkaXRvciwgY29kZUFjdGlvbikge1xuICAgICAgICBjb25zdCByYW5nZSA9IGVkaXRvci5nZXRTZWxlY3RlZEJ1ZmZlclJhbmdlKCk7XG4gICAgICAgIGNvbnN0IHJlcXVlc3QgPSB7XG4gICAgICAgICAgICBXYW50c1RleHRDaGFuZ2VzOiB0cnVlLFxuICAgICAgICAgICAgU2VsZWN0aW9uOiB7XG4gICAgICAgICAgICAgICAgU3RhcnQ6IHtcbiAgICAgICAgICAgICAgICAgICAgTGluZTogcmFuZ2Uuc3RhcnQucm93LFxuICAgICAgICAgICAgICAgICAgICBDb2x1bW46IHJhbmdlLnN0YXJ0LmNvbHVtblxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgRW5kOiB7XG4gICAgICAgICAgICAgICAgICAgIExpbmU6IHJhbmdlLmVuZC5yb3csXG4gICAgICAgICAgICAgICAgICAgIENvbHVtbjogcmFuZ2UuZW5kLmNvbHVtblxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgaWYgKGNvZGVBY3Rpb24gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmVxdWVzdC5JZGVudGlmaWVyID0gY29kZUFjdGlvbjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVxdWVzdDtcbiAgICB9XG4gICAgZGlzcG9zZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICB9XG59XG5leHBvcnQgY29uc3QgY29kZUFjdGlvbiA9IG5ldyBDb2RlQWN0aW9uO1xuIiwiaW1wb3J0IHtNb2RlbHN9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XHJcbmltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcclxuaW1wb3J0IHtTdWJqZWN0LCBPYnNlcnZhYmxlfSBmcm9tIFwicnhqc1wiO1xyXG5pbXBvcnQge0NvbXBvc2l0ZURpc3Bvc2FibGUsIElEaXNwb3NhYmxlfSBmcm9tIFwidHMtZGlzcG9zYWJsZXNcIjtcclxuaW1wb3J0IHtPbW5pfSBmcm9tIFwiLi4vc2VydmVyL29tbmlcIjtcclxuaW1wb3J0ICogYXMgU3BhY2VQZW4gZnJvbSBcImF0b20tc3BhY2UtcGVuLXZpZXdzXCI7XHJcbmltcG9ydCB7YXBwbHlBbGxDaGFuZ2VzfSBmcm9tIFwiLi4vc2VydmljZXMvYXBwbHktY2hhbmdlc1wiO1xyXG5pbXBvcnQgY29kZUFjdGlvbnNWaWV3IGZyb20gXCIuLi92aWV3cy9jb2RlLWFjdGlvbnMtdmlld1wiO1xyXG5cclxuY2xhc3MgQ29kZUFjdGlvbiBpbXBsZW1lbnRzIElGZWF0dXJlIHtcclxuICAgIHByaXZhdGUgZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxuXHJcbiAgICBwcml2YXRlIHZpZXc6IFNwYWNlUGVuLlNlbGVjdExpc3RWaWV3O1xyXG5cclxuICAgIHB1YmxpYyBhY3RpdmF0ZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuYWRkVGV4dEVkaXRvckNvbW1hbmQoXCJvbW5pc2hhcnAtYXRvbTpnZXQtY29kZS1hY3Rpb25zXCIsICgpID0+IHtcclxuICAgICAgICAgICAgLy9zdG9yZSB0aGUgZWRpdG9yIHRoYXQgdGhpcyB3YXMgdHJpZ2dlcmVkIGJ5LlxyXG4gICAgICAgICAgICBjb25zdCBlZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKCk7XHJcbiAgICAgICAgICAgIHRoaXMuZ2V0Q29kZUFjdGlvbnNSZXF1ZXN0KGVkaXRvcilcclxuICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoKHtyZXF1ZXN0LCByZXNwb25zZX0pID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAvL3BvcCB1aSB0byB1c2VyLlxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudmlldyA9IGNvZGVBY3Rpb25zVmlldyh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW1zOiByZXNwb25zZS5Db2RlQWN0aW9ucyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlybWVkOiAoaXRlbSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFlZGl0b3IgfHwgZWRpdG9yLmlzRGVzdHJveWVkKCkpIHJldHVybjtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJ1bkNvZGVBY3Rpb25SZXF1ZXN0KGVkaXRvciwgcmVxdWVzdCwgaXRlbS5JZGVudGlmaWVyKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoKHJlc3ApID0+IGFwcGx5QWxsQ2hhbmdlcyhyZXNwLkNoYW5nZXMpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0sIGVkaXRvcik7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5zd2l0Y2hBY3RpdmVFZGl0b3IoKGVkaXRvciwgY2QpID0+IHtcclxuICAgICAgICAgICAgbGV0IHdvcmQ6IHN0cmluZywgbWFya2VyOiBBdG9tLk1hcmtlciwgc3Vic2NyaXB0aW9uOiBJRGlzcG9zYWJsZTtcclxuXHJcbiAgICAgICAgICAgIGNkLmFkZChPbW5pLmxpc3RlbmVyLmdldGNvZGVhY3Rpb25zXHJcbiAgICAgICAgICAgICAgICAuZmlsdGVyKHogPT4gei5yZXF1ZXN0LkZpbGVOYW1lID09PSBlZGl0b3IuZ2V0UGF0aCgpKVxyXG4gICAgICAgICAgICAgICAgLmZpbHRlcihjdHggPT4gY3R4LnJlc3BvbnNlLkNvZGVBY3Rpb25zLmxlbmd0aCA+IDApXHJcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKCh7cmVxdWVzdH0pID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobWFya2VyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcmtlci5kZXN0cm95KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcmtlciA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBjb25zdCByYW5nZSA9IFtbcmVxdWVzdC5MaW5lLCAwXSwgW3JlcXVlc3QuTGluZSwgMF1dO1xyXG4gICAgICAgICAgICAgICAgICAgIG1hcmtlciA9IGVkaXRvci5tYXJrQnVmZmVyUmFuZ2UocmFuZ2UpO1xyXG4gICAgICAgICAgICAgICAgICAgIGVkaXRvci5kZWNvcmF0ZU1hcmtlcihtYXJrZXIsIHsgdHlwZTogXCJsaW5lLW51bWJlclwiLCBjbGFzczogXCJxdWlja2ZpeFwiIH0pO1xyXG4gICAgICAgICAgICAgICAgfSkpO1xyXG4gICAgICAgICAgICBjb25zdCBtYWtlTGlnaHRidWxiUmVxdWVzdCA9IChwb3NpdGlvbjogVGV4dEJ1ZmZlci5Qb2ludCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKHN1YnNjcmlwdGlvbikgc3Vic2NyaXB0aW9uLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgICAgIGlmICghZWRpdG9yIHx8IGVkaXRvci5pc0Rlc3Ryb3llZCgpKSByZXR1cm47XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5nZXRDb2RlQWN0aW9uc1JlcXVlc3QoZWRpdG9yLCB0cnVlKVxyXG4gICAgICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoY3R4ID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qge3Jlc3BvbnNlfSA9IGN0eDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlLkNvZGVBY3Rpb25zLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtYXJrZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXJrZXIuZGVzdHJveSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hcmtlciA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgcm5nID0gW1twb3NpdGlvbi5yb3csIDBdLCBbcG9zaXRpb24ucm93LCAwXV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXJrZXIgPSBlZGl0b3IubWFya0J1ZmZlclJhbmdlKHJuZyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlZGl0b3IuZGVjb3JhdGVNYXJrZXIobWFya2VyLCB7IHR5cGU6IFwibGluZS1udW1iZXJcIiwgY2xhc3M6IFwicXVpY2tmaXhcIiB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgY29uc3QgdXBkYXRlID0gKHBvczogVGV4dEJ1ZmZlci5Qb2ludCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKHN1YnNjcmlwdGlvbikgc3Vic2NyaXB0aW9uLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgICAgIG1ha2VMaWdodGJ1bGJSZXF1ZXN0KHBvcyk7XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICBjb25zdCBvbkRpZENoYW5nZUN1cnNvclBvc2l0aW9uID0gbmV3IFN1YmplY3Q8eyBvbGRCdWZmZXJQb3NpdGlvbjogVGV4dEJ1ZmZlci5Qb2ludDsgb2xkU2NyZWVuUG9zaXRpb246IFRleHRCdWZmZXIuUG9pbnQ7IG5ld0J1ZmZlclBvc2l0aW9uOiBUZXh0QnVmZmVyLlBvaW50OyBuZXdTY3JlZW5Qb3NpdGlvbjogVGV4dEJ1ZmZlci5Qb2ludDsgdGV4dENoYW5nZWQ6IGJvb2xlYW47IGN1cnNvcjogQXRvbS5DdXJzb3I7IH0+KCk7XHJcbiAgICAgICAgICAgIGNkLmFkZChvbkRpZENoYW5nZUN1cnNvclBvc2l0aW9uKTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IG9uRGlkU3RvcENoYW5naW5nID0gbmV3IFN1YmplY3Q8YW55PigpO1xyXG5cclxuICAgICAgICAgICAgY2QuYWRkKE9ic2VydmFibGUuY29tYmluZUxhdGVzdChcclxuICAgICAgICAgICAgICAgIDxPYnNlcnZhYmxlPHsgb2xkQnVmZmVyUG9zaXRpb246IFRleHRCdWZmZXIuUG9pbnQ7IG9sZFNjcmVlblBvc2l0aW9uOiBUZXh0QnVmZmVyLlBvaW50OyBuZXdCdWZmZXJQb3NpdGlvbjogVGV4dEJ1ZmZlci5Qb2ludDsgbmV3U2NyZWVuUG9zaXRpb246IFRleHRCdWZmZXIuUG9pbnQ7IHRleHRDaGFuZ2VkOiBib29sZWFuOyBjdXJzb3I6IEF0b20uQ3Vyc29yOyB9Pj48YW55Pm9uRGlkQ2hhbmdlQ3Vyc29yUG9zaXRpb24sXHJcbiAgICAgICAgICAgICAgICA8T2JzZXJ2YWJsZTxhbnk+Pjxhbnk+b25EaWRTdG9wQ2hhbmdpbmcsXHJcbiAgICAgICAgICAgICAgICAoY3Vyc29yLCBjaGFuZ2luZykgPT4gY3Vyc29yKVxyXG4gICAgICAgICAgICAgICAgLmRlYm91bmNlVGltZSgxMDAwKVxyXG4gICAgICAgICAgICAgICAgLnN1YnNjcmliZShjdXJzb3IgPT4gdXBkYXRlKGN1cnNvci5uZXdCdWZmZXJQb3NpdGlvbikpKTtcclxuXHJcbiAgICAgICAgICAgIGNkLmFkZChlZGl0b3Iub25EaWRTdG9wQ2hhbmdpbmcoXy5kZWJvdW5jZSgoKSA9PiBvbkRpZFN0b3BDaGFuZ2luZy5uZXh0KHRydWUpLCAxMDAwKSkpO1xyXG4gICAgICAgICAgICBjZC5hZGQoZWRpdG9yLm9uRGlkQ2hhbmdlQ3Vyc29yUG9zaXRpb24oXy5kZWJvdW5jZSgoZTogYW55KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBvbGRQb3MgPSBlLm9sZEJ1ZmZlclBvc2l0aW9uO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgbmV3UG9zID0gZS5uZXdCdWZmZXJQb3NpdGlvbjtcclxuXHJcbiAgICAgICAgICAgICAgICBjb25zdCBuZXdXb3JkOiBzdHJpbmcgPSA8YW55PmVkaXRvci5nZXRXb3JkVW5kZXJDdXJzb3IoKTtcclxuICAgICAgICAgICAgICAgIGlmICh3b3JkICE9PSBuZXdXb3JkIHx8IG9sZFBvcy5yb3cgIT09IG5ld1Bvcy5yb3cpIHtcclxuICAgICAgICAgICAgICAgICAgICB3b3JkID0gbmV3V29yZDtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobWFya2VyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcmtlci5kZXN0cm95KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcmtlciA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmICghb25EaWRDaGFuZ2VDdXJzb3JQb3NpdGlvbi5pc1N0b3BwZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICBvbkRpZENoYW5nZUN1cnNvclBvc2l0aW9uLm5leHQoZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sIDEwMDApKSk7XHJcbiAgICAgICAgfSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZ2V0Q29kZUFjdGlvbnNSZXF1ZXN0KGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yLCBzaWxlbnQgPSB0cnVlKSB7XHJcbiAgICAgICAgaWYgKCFlZGl0b3IgfHwgZWRpdG9yLmlzRGVzdHJveWVkKCkpIHJldHVybiBPYnNlcnZhYmxlLmVtcHR5PHsgcmVxdWVzdDogTW9kZWxzLlYyLkdldENvZGVBY3Rpb25zUmVxdWVzdDsgcmVzcG9uc2U6IE1vZGVscy5WMi5HZXRDb2RlQWN0aW9uc1Jlc3BvbnNlIH0+KCk7XHJcblxyXG4gICAgICAgIGNvbnN0IHJlcXVlc3QgPSB0aGlzLmdldFJlcXVlc3QoZWRpdG9yKTtcclxuICAgICAgICByZXR1cm4gT21uaS5yZXF1ZXN0KGVkaXRvciwgc29sdXRpb24gPT4gc29sdXRpb24uZ2V0Y29kZWFjdGlvbnMocmVxdWVzdCkpXHJcbiAgICAgICAgICAgIC5tYXAocmVzcG9uc2UgPT4gKHsgcmVxdWVzdCwgcmVzcG9uc2UgfSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgcnVuQ29kZUFjdGlvblJlcXVlc3QoZWRpdG9yOiBBdG9tLlRleHRFZGl0b3IsIGdldFJlcXVlc3Q6IE1vZGVscy5WMi5HZXRDb2RlQWN0aW9uc1JlcXVlc3QsIGNvZGVBY3Rpb246IHN0cmluZykge1xyXG4gICAgICAgIGlmICghZWRpdG9yIHx8IGVkaXRvci5pc0Rlc3Ryb3llZCgpKSByZXR1cm4gT2JzZXJ2YWJsZS5lbXB0eTxNb2RlbHMuVjIuUnVuQ29kZUFjdGlvblJlc3BvbnNlPigpO1xyXG5cclxuICAgICAgICBjb25zdCByZXF1ZXN0ID0gdGhpcy5nZXRSZXF1ZXN0KGVkaXRvciwgY29kZUFjdGlvbik7XHJcbiAgICAgICAgcmVxdWVzdC5TZWxlY3Rpb24gPSBnZXRSZXF1ZXN0LlNlbGVjdGlvbjtcclxuICAgICAgICByZXR1cm4gT21uaS5yZXF1ZXN0KGVkaXRvciwgc29sdXRpb24gPT4gc29sdXRpb24ucnVuY29kZWFjdGlvbihyZXF1ZXN0KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBnZXRSZXF1ZXN0KGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yKTogTW9kZWxzLlYyLkdldENvZGVBY3Rpb25zUmVxdWVzdDtcclxuICAgIHByaXZhdGUgZ2V0UmVxdWVzdChlZGl0b3I6IEF0b20uVGV4dEVkaXRvciwgY29kZUFjdGlvbjogc3RyaW5nKTogTW9kZWxzLlYyLlJ1bkNvZGVBY3Rpb25SZXF1ZXN0O1xyXG4gICAgcHJpdmF0ZSBnZXRSZXF1ZXN0KGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yLCBjb2RlQWN0aW9uPzogc3RyaW5nKSB7XHJcbiAgICAgICAgY29uc3QgcmFuZ2UgPSA8YW55PmVkaXRvci5nZXRTZWxlY3RlZEJ1ZmZlclJhbmdlKCk7XHJcbiAgICAgICAgY29uc3QgcmVxdWVzdDogTW9kZWxzLlYyLlJ1bkNvZGVBY3Rpb25SZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICBXYW50c1RleHRDaGFuZ2VzOiB0cnVlLFxyXG4gICAgICAgICAgICBTZWxlY3Rpb246IHtcclxuICAgICAgICAgICAgICAgIFN0YXJ0OiB7XHJcbiAgICAgICAgICAgICAgICAgICAgTGluZTogcmFuZ2Uuc3RhcnQucm93LFxyXG4gICAgICAgICAgICAgICAgICAgIENvbHVtbjogcmFuZ2Uuc3RhcnQuY29sdW1uXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgRW5kOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgTGluZTogcmFuZ2UuZW5kLnJvdyxcclxuICAgICAgICAgICAgICAgICAgICBDb2x1bW46IHJhbmdlLmVuZC5jb2x1bW5cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGlmIChjb2RlQWN0aW9uICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgcmVxdWVzdC5JZGVudGlmaWVyID0gY29kZUFjdGlvbjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXF1ZXN0O1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkaXNwb3NlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlcXVpcmVkID0gdHJ1ZTtcclxuICAgIHB1YmxpYyB0aXRsZSA9IFwiQ29kZSBBY3Rpb25zXCI7XHJcbiAgICBwdWJsaWMgZGVzY3JpcHRpb24gPSBcIkFkZHMgY29kZSBhY3Rpb24gc3VwcG9ydCB0byBvbW5pc2hhcnAtYXRvbS5cIjtcclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IGNvZGVBY3Rpb24gPSBuZXcgQ29kZUFjdGlvbjtcclxuIl19
