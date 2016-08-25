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
                    var request = _ref.request;
                    var response = _ref.response;

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
                    if (!onDidChangeCursorPosition.isUnsubscribed) {
                        onDidChangeCursorPosition.next(e);
                    }
                }, 1000)));
            }));
        }
    }, {
        key: "getCodeActionsRequest",
        value: function getCodeActionsRequest(editor) {
            var silent = arguments.length <= 1 || arguments[1] === undefined ? true : arguments[1];

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9jb2RlLWFjdGlvbi5qcyIsImxpYi9mZWF0dXJlcy9jb2RlLWFjdGlvbi50cyJdLCJuYW1lcyI6WyJDb2RlQWN0aW9uIiwicmVxdWlyZWQiLCJ0aXRsZSIsImRlc2NyaXB0aW9uIiwiZGlzcG9zYWJsZSIsImFkZCIsImFkZFRleHRFZGl0b3JDb21tYW5kIiwiZWRpdG9yIiwiYXRvbSIsIndvcmtzcGFjZSIsImdldEFjdGl2ZVRleHRFZGl0b3IiLCJnZXRDb2RlQWN0aW9uc1JlcXVlc3QiLCJzdWJzY3JpYmUiLCJyZXF1ZXN0IiwicmVzcG9uc2UiLCJ2aWV3IiwiaXRlbXMiLCJDb2RlQWN0aW9ucyIsImNvbmZpcm1lZCIsIml0ZW0iLCJpc0Rlc3Ryb3llZCIsInJ1bkNvZGVBY3Rpb25SZXF1ZXN0IiwiSWRlbnRpZmllciIsInJlc3AiLCJDaGFuZ2VzIiwic3dpdGNoQWN0aXZlRWRpdG9yIiwiY2QiLCJ3b3JkIiwibWFya2VyIiwic3Vic2NyaXB0aW9uIiwibGlzdGVuZXIiLCJnZXRjb2RlYWN0aW9ucyIsImZpbHRlciIsInoiLCJGaWxlTmFtZSIsImdldFBhdGgiLCJjdHgiLCJsZW5ndGgiLCJkZXN0cm95IiwicmFuZ2UiLCJMaW5lIiwibWFya0J1ZmZlclJhbmdlIiwiZGVjb3JhdGVNYXJrZXIiLCJ0eXBlIiwiY2xhc3MiLCJtYWtlTGlnaHRidWxiUmVxdWVzdCIsInBvc2l0aW9uIiwiZGlzcG9zZSIsInJuZyIsInJvdyIsInVwZGF0ZSIsInBvcyIsIm9uRGlkQ2hhbmdlQ3Vyc29yUG9zaXRpb24iLCJvbkRpZFN0b3BDaGFuZ2luZyIsImNvbWJpbmVMYXRlc3QiLCJjdXJzb3IiLCJjaGFuZ2luZyIsImRlYm91bmNlVGltZSIsIm5ld0J1ZmZlclBvc2l0aW9uIiwiZGVib3VuY2UiLCJuZXh0IiwiZSIsIm9sZFBvcyIsIm9sZEJ1ZmZlclBvc2l0aW9uIiwibmV3UG9zIiwibmV3V29yZCIsImdldFdvcmRVbmRlckN1cnNvciIsImlzVW5zdWJzY3JpYmVkIiwic2lsZW50IiwiZW1wdHkiLCJnZXRSZXF1ZXN0Iiwic29sdXRpb24iLCJtYXAiLCJjb2RlQWN0aW9uIiwiU2VsZWN0aW9uIiwicnVuY29kZWFjdGlvbiIsImdldFNlbGVjdGVkQnVmZmVyUmFuZ2UiLCJXYW50c1RleHRDaGFuZ2VzIiwiU3RhcnQiLCJzdGFydCIsIkNvbHVtbiIsImNvbHVtbiIsIkVuZCIsImVuZCIsInVuZGVmaW5lZCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7Ozs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7Ozs7Ozs7SUNJQUEsVTtBQUFBLDBCQUFBO0FBQUE7O0FBaUpXLGFBQUFDLFFBQUEsR0FBVyxJQUFYO0FBQ0EsYUFBQUMsS0FBQSxHQUFRLGNBQVI7QUFDQSxhQUFBQyxXQUFBLEdBQWMsNkNBQWQ7QUFDVjs7OzttQ0EvSWtCO0FBQUE7O0FBQ1gsaUJBQUtDLFVBQUwsR0FBa0Isd0NBQWxCO0FBRUEsaUJBQUtBLFVBQUwsQ0FBZ0JDLEdBQWhCLENBQW9CLFdBQUtDLG9CQUFMLENBQTBCLGlDQUExQixFQUE2RCxZQUFBO0FBRTdFLG9CQUFNQyxTQUFTQyxLQUFLQyxTQUFMLENBQWVDLG1CQUFmLEVBQWY7QUFDQSxzQkFBS0MscUJBQUwsQ0FBMkJKLE1BQTNCLEVBQ0tLLFNBREwsQ0FDZSxnQkFBb0I7QUFBQSx3QkFBbEJDLE9BQWtCLFFBQWxCQSxPQUFrQjtBQUFBLHdCQUFUQyxRQUFTLFFBQVRBLFFBQVM7O0FBRTNCLDBCQUFLQyxJQUFMLEdBQVksK0JBQWdCO0FBQ3hCQywrQkFBT0YsU0FBU0csV0FEUTtBQUV4QkMsbUNBQVcsbUJBQUNDLElBQUQsRUFBSztBQUNaLGdDQUFJLENBQUNaLE1BQUQsSUFBV0EsT0FBT2EsV0FBUCxFQUFmLEVBQXFDO0FBRXJDLGtDQUFLQyxvQkFBTCxDQUEwQmQsTUFBMUIsRUFBa0NNLE9BQWxDLEVBQTJDTSxLQUFLRyxVQUFoRCxFQUNLVixTQURMLENBQ2UsVUFBQ1csSUFBRDtBQUFBLHVDQUFVLG1DQUFn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TTBCLGtDQUFhLElBQUl6RSxVQUFKLEVBQW5CIiwiZmlsZSI6ImxpYi9mZWF0dXJlcy9jb2RlLWFjdGlvbi5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcbmltcG9ydCB7IFN1YmplY3QsIE9ic2VydmFibGUgfSBmcm9tIFwicnhqc1wiO1xuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSB9IGZyb20gXCJ0cy1kaXNwb3NhYmxlc1wiO1xuaW1wb3J0IHsgT21uaSB9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xuaW1wb3J0IHsgYXBwbHlBbGxDaGFuZ2VzIH0gZnJvbSBcIi4uL3NlcnZpY2VzL2FwcGx5LWNoYW5nZXNcIjtcbmltcG9ydCBjb2RlQWN0aW9uc1ZpZXcgZnJvbSBcIi4uL3ZpZXdzL2NvZGUtYWN0aW9ucy12aWV3XCI7XG5jbGFzcyBDb2RlQWN0aW9uIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5yZXF1aXJlZCA9IHRydWU7XG4gICAgICAgIHRoaXMudGl0bGUgPSBcIkNvZGUgQWN0aW9uc1wiO1xuICAgICAgICB0aGlzLmRlc2NyaXB0aW9uID0gXCJBZGRzIGNvZGUgYWN0aW9uIHN1cHBvcnQgdG8gb21uaXNoYXJwLWF0b20uXCI7XG4gICAgfVxuICAgIGFjdGl2YXRlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuYWRkVGV4dEVkaXRvckNvbW1hbmQoXCJvbW5pc2hhcnAtYXRvbTpnZXQtY29kZS1hY3Rpb25zXCIsICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGVkaXRvciA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKTtcbiAgICAgICAgICAgIHRoaXMuZ2V0Q29kZUFjdGlvbnNSZXF1ZXN0KGVkaXRvcilcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKCh7IHJlcXVlc3QsIHJlc3BvbnNlIH0pID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLnZpZXcgPSBjb2RlQWN0aW9uc1ZpZXcoe1xuICAgICAgICAgICAgICAgICAgICBpdGVtczogcmVzcG9uc2UuQ29kZUFjdGlvbnMsXG4gICAgICAgICAgICAgICAgICAgIGNvbmZpcm1lZDogKGl0ZW0pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghZWRpdG9yIHx8IGVkaXRvci5pc0Rlc3Ryb3llZCgpKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucnVuQ29kZUFjdGlvblJlcXVlc3QoZWRpdG9yLCByZXF1ZXN0LCBpdGVtLklkZW50aWZpZXIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLnN1YnNjcmliZSgocmVzcCkgPT4gYXBwbHlBbGxDaGFuZ2VzKHJlc3AuQ2hhbmdlcykpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSwgZWRpdG9yKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5zd2l0Y2hBY3RpdmVFZGl0b3IoKGVkaXRvciwgY2QpID0+IHtcbiAgICAgICAgICAgIGxldCB3b3JkLCBtYXJrZXIsIHN1YnNjcmlwdGlvbjtcbiAgICAgICAgICAgIGNkLmFkZChPbW5pLmxpc3RlbmVyLmdldGNvZGVhY3Rpb25zXG4gICAgICAgICAgICAgICAgLmZpbHRlcih6ID0+IHoucmVxdWVzdC5GaWxlTmFtZSA9PT0gZWRpdG9yLmdldFBhdGgoKSlcbiAgICAgICAgICAgICAgICAuZmlsdGVyKGN0eCA9PiBjdHgucmVzcG9uc2UuQ29kZUFjdGlvbnMubGVuZ3RoID4gMClcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKCh7IHJlcXVlc3QgfSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChtYXJrZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgbWFya2VyLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICAgICAgbWFya2VyID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3QgcmFuZ2UgPSBbW3JlcXVlc3QuTGluZSwgMF0sIFtyZXF1ZXN0LkxpbmUsIDBdXTtcbiAgICAgICAgICAgICAgICBtYXJrZXIgPSBlZGl0b3IubWFya0J1ZmZlclJhbmdlKHJhbmdlKTtcbiAgICAgICAgICAgICAgICBlZGl0b3IuZGVjb3JhdGVNYXJrZXIobWFya2VyLCB7IHR5cGU6IFwibGluZS1udW1iZXJcIiwgY2xhc3M6IFwicXVpY2tmaXhcIiB9KTtcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIGNvbnN0IG1ha2VMaWdodGJ1bGJSZXF1ZXN0ID0gKHBvc2l0aW9uKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHN1YnNjcmlwdGlvbilcbiAgICAgICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9uLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgICAgICBpZiAoIWVkaXRvciB8fCBlZGl0b3IuaXNEZXN0cm95ZWQoKSlcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIHRoaXMuZ2V0Q29kZUFjdGlvbnNSZXF1ZXN0KGVkaXRvciwgdHJ1ZSlcbiAgICAgICAgICAgICAgICAgICAgLnN1YnNjcmliZShjdHggPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB7IHJlc3BvbnNlIH0gPSBjdHg7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZS5Db2RlQWN0aW9ucy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobWFya2VyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFya2VyLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXJrZXIgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgcm5nID0gW1twb3NpdGlvbi5yb3csIDBdLCBbcG9zaXRpb24ucm93LCAwXV07XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXJrZXIgPSBlZGl0b3IubWFya0J1ZmZlclJhbmdlKHJuZyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBlZGl0b3IuZGVjb3JhdGVNYXJrZXIobWFya2VyLCB7IHR5cGU6IFwibGluZS1udW1iZXJcIiwgY2xhc3M6IFwicXVpY2tmaXhcIiB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGNvbnN0IHVwZGF0ZSA9IChwb3MpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoc3Vic2NyaXB0aW9uKVxuICAgICAgICAgICAgICAgICAgICBzdWJzY3JpcHRpb24uZGlzcG9zZSgpO1xuICAgICAgICAgICAgICAgIG1ha2VMaWdodGJ1bGJSZXF1ZXN0KHBvcyk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgY29uc3Qgb25EaWRDaGFuZ2VDdXJzb3JQb3NpdGlvbiA9IG5ldyBTdWJqZWN0KCk7XG4gICAgICAgICAgICBjZC5hZGQob25EaWRDaGFuZ2VDdXJzb3JQb3NpdGlvbik7XG4gICAgICAgICAgICBjb25zdCBvbkRpZFN0b3BDaGFuZ2luZyA9IG5ldyBTdWJqZWN0KCk7XG4gICAgICAgICAgICBjZC5hZGQoT2JzZXJ2YWJsZS5jb21iaW5lTGF0ZXN0KG9uRGlkQ2hhbmdlQ3Vyc29yUG9zaXRpb24sIG9uRGlkU3RvcENoYW5naW5nLCAoY3Vyc29yLCBjaGFuZ2luZykgPT4gY3Vyc29yKVxuICAgICAgICAgICAgICAgIC5kZWJvdW5jZVRpbWUoMTAwMClcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKGN1cnNvciA9PiB1cGRhdGUoY3Vyc29yLm5ld0J1ZmZlclBvc2l0aW9uKSkpO1xuICAgICAgICAgICAgY2QuYWRkKGVkaXRvci5vbkRpZFN0b3BDaGFuZ2luZyhfLmRlYm91bmNlKCgpID0+IG9uRGlkU3RvcENoYW5naW5nLm5leHQodHJ1ZSksIDEwMDApKSk7XG4gICAgICAgICAgICBjZC5hZGQoZWRpdG9yLm9uRGlkQ2hhbmdlQ3Vyc29yUG9zaXRpb24oXy5kZWJvdW5jZSgoZSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IG9sZFBvcyA9IGUub2xkQnVmZmVyUG9zaXRpb247XG4gICAgICAgICAgICAgICAgY29uc3QgbmV3UG9zID0gZS5uZXdCdWZmZXJQb3NpdGlvbjtcbiAgICAgICAgICAgICAgICBjb25zdCBuZXdXb3JkID0gZWRpdG9yLmdldFdvcmRVbmRlckN1cnNvcigpO1xuICAgICAgICAgICAgICAgIGlmICh3b3JkICE9PSBuZXdXb3JkIHx8IG9sZFBvcy5yb3cgIT09IG5ld1Bvcy5yb3cpIHtcbiAgICAgICAgICAgICAgICAgICAgd29yZCA9IG5ld1dvcmQ7XG4gICAgICAgICAgICAgICAgICAgIGlmIChtYXJrZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcmtlci5kZXN0cm95KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXJrZXIgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICghb25EaWRDaGFuZ2VDdXJzb3JQb3NpdGlvbi5pc1Vuc3Vic2NyaWJlZCkge1xuICAgICAgICAgICAgICAgICAgICBvbkRpZENoYW5nZUN1cnNvclBvc2l0aW9uLm5leHQoZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgMTAwMCkpKTtcbiAgICAgICAgfSkpO1xuICAgIH1cbiAgICBnZXRDb2RlQWN0aW9uc1JlcXVlc3QoZWRpdG9yLCBzaWxlbnQgPSB0cnVlKSB7XG4gICAgICAgIGlmICghZWRpdG9yIHx8IGVkaXRvci5pc0Rlc3Ryb3llZCgpKVxuICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuZW1wdHkoKTtcbiAgICAgICAgY29uc3QgcmVxdWVzdCA9IHRoaXMuZ2V0UmVxdWVzdChlZGl0b3IpO1xuICAgICAgICByZXR1cm4gT21uaS5yZXF1ZXN0KGVkaXRvciwgc29sdXRpb24gPT4gc29sdXRpb24uZ2V0Y29kZWFjdGlvbnMocmVxdWVzdCkpXG4gICAgICAgICAgICAubWFwKHJlc3BvbnNlID0+ICh7IHJlcXVlc3QsIHJlc3BvbnNlIH0pKTtcbiAgICB9XG4gICAgcnVuQ29kZUFjdGlvblJlcXVlc3QoZWRpdG9yLCBnZXRSZXF1ZXN0LCBjb2RlQWN0aW9uKSB7XG4gICAgICAgIGlmICghZWRpdG9yIHx8IGVkaXRvci5pc0Rlc3Ryb3llZCgpKVxuICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuZW1wdHkoKTtcbiAgICAgICAgY29uc3QgcmVxdWVzdCA9IHRoaXMuZ2V0UmVxdWVzdChlZGl0b3IsIGNvZGVBY3Rpb24pO1xuICAgICAgICByZXF1ZXN0LlNlbGVjdGlvbiA9IGdldFJlcXVlc3QuU2VsZWN0aW9uO1xuICAgICAgICByZXR1cm4gT21uaS5yZXF1ZXN0KGVkaXRvciwgc29sdXRpb24gPT4gc29sdXRpb24ucnVuY29kZWFjdGlvbihyZXF1ZXN0KSk7XG4gICAgfVxuICAgIGdldFJlcXVlc3QoZWRpdG9yLCBjb2RlQWN0aW9uKSB7XG4gICAgICAgIGNvbnN0IHJhbmdlID0gZWRpdG9yLmdldFNlbGVjdGVkQnVmZmVyUmFuZ2UoKTtcbiAgICAgICAgY29uc3QgcmVxdWVzdCA9IHtcbiAgICAgICAgICAgIFdhbnRzVGV4dENoYW5nZXM6IHRydWUsXG4gICAgICAgICAgICBTZWxlY3Rpb246IHtcbiAgICAgICAgICAgICAgICBTdGFydDoge1xuICAgICAgICAgICAgICAgICAgICBMaW5lOiByYW5nZS5zdGFydC5yb3csXG4gICAgICAgICAgICAgICAgICAgIENvbHVtbjogcmFuZ2Uuc3RhcnQuY29sdW1uXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBFbmQ6IHtcbiAgICAgICAgICAgICAgICAgICAgTGluZTogcmFuZ2UuZW5kLnJvdyxcbiAgICAgICAgICAgICAgICAgICAgQ29sdW1uOiByYW5nZS5lbmQuY29sdW1uXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBpZiAoY29kZUFjdGlvbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXF1ZXN0LklkZW50aWZpZXIgPSBjb2RlQWN0aW9uO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXF1ZXN0O1xuICAgIH1cbiAgICBkaXNwb3NlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgIH1cbn1cbmV4cG9ydCBjb25zdCBjb2RlQWN0aW9uID0gbmV3IENvZGVBY3Rpb247XG4iLCJpbXBvcnQge01vZGVsc30gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcclxuaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xyXG5pbXBvcnQge1N1YmplY3QsIE9ic2VydmFibGV9IGZyb20gXCJyeGpzXCI7XHJcbmltcG9ydCB7Q29tcG9zaXRlRGlzcG9zYWJsZSwgSURpc3Bvc2FibGV9IGZyb20gXCJ0cy1kaXNwb3NhYmxlc1wiO1xyXG5pbXBvcnQge09tbml9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xyXG5pbXBvcnQgKiBhcyBTcGFjZVBlbiBmcm9tIFwiYXRvbS1zcGFjZS1wZW4tdmlld3NcIjtcclxuaW1wb3J0IHthcHBseUFsbENoYW5nZXN9IGZyb20gXCIuLi9zZXJ2aWNlcy9hcHBseS1jaGFuZ2VzXCI7XHJcbmltcG9ydCBjb2RlQWN0aW9uc1ZpZXcgZnJvbSBcIi4uL3ZpZXdzL2NvZGUtYWN0aW9ucy12aWV3XCI7XHJcblxyXG5jbGFzcyBDb2RlQWN0aW9uIGltcGxlbWVudHMgSUZlYXR1cmUge1xyXG4gICAgcHJpdmF0ZSBkaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xyXG5cclxuICAgIHByaXZhdGUgdmlldzogU3BhY2VQZW4uU2VsZWN0TGlzdFZpZXc7XHJcblxyXG4gICAgcHVibGljIGFjdGl2YXRlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5hZGRUZXh0RWRpdG9yQ29tbWFuZChcIm9tbmlzaGFycC1hdG9tOmdldC1jb2RlLWFjdGlvbnNcIiwgKCkgPT4ge1xyXG4gICAgICAgICAgICAvL3N0b3JlIHRoZSBlZGl0b3IgdGhhdCB0aGlzIHdhcyB0cmlnZ2VyZWQgYnkuXHJcbiAgICAgICAgICAgIGNvbnN0IGVkaXRvciA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKTtcclxuICAgICAgICAgICAgdGhpcy5nZXRDb2RlQWN0aW9uc1JlcXVlc3QoZWRpdG9yKVxyXG4gICAgICAgICAgICAgICAgLnN1YnNjcmliZSgoe3JlcXVlc3QsIHJlc3BvbnNlfSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vcG9wIHVpIHRvIHVzZXIuXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy52aWV3ID0gY29kZUFjdGlvbnNWaWV3KHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbXM6IHJlc3BvbnNlLkNvZGVBY3Rpb25zLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25maXJtZWQ6IChpdGVtKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWVkaXRvciB8fCBlZGl0b3IuaXNEZXN0cm95ZWQoKSkgcmV0dXJuO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucnVuQ29kZUFjdGlvblJlcXVlc3QoZWRpdG9yLCByZXF1ZXN0LCBpdGVtLklkZW50aWZpZXIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnN1YnNjcmliZSgocmVzcCkgPT4gYXBwbHlBbGxDaGFuZ2VzKHJlc3AuQ2hhbmdlcykpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSwgZWRpdG9yKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLnN3aXRjaEFjdGl2ZUVkaXRvcigoZWRpdG9yLCBjZCkgPT4ge1xyXG4gICAgICAgICAgICBsZXQgd29yZDogc3RyaW5nLCBtYXJrZXI6IEF0b20uTWFya2VyLCBzdWJzY3JpcHRpb246IElEaXNwb3NhYmxlO1xyXG5cclxuICAgICAgICAgICAgY2QuYWRkKE9tbmkubGlzdGVuZXIuZ2V0Y29kZWFjdGlvbnNcclxuICAgICAgICAgICAgICAgIC5maWx0ZXIoeiA9PiB6LnJlcXVlc3QuRmlsZU5hbWUgPT09IGVkaXRvci5nZXRQYXRoKCkpXHJcbiAgICAgICAgICAgICAgICAuZmlsdGVyKGN0eCA9PiBjdHgucmVzcG9uc2UuQ29kZUFjdGlvbnMubGVuZ3RoID4gMClcclxuICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoKHtyZXF1ZXN0fSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChtYXJrZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWFya2VyLmRlc3Ryb3koKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWFya2VyID0gbnVsbDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJhbmdlID0gW1tyZXF1ZXN0LkxpbmUsIDBdLCBbcmVxdWVzdC5MaW5lLCAwXV07XHJcbiAgICAgICAgICAgICAgICAgICAgbWFya2VyID0gZWRpdG9yLm1hcmtCdWZmZXJSYW5nZShyYW5nZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgZWRpdG9yLmRlY29yYXRlTWFya2VyKG1hcmtlciwgeyB0eXBlOiBcImxpbmUtbnVtYmVyXCIsIGNsYXNzOiBcInF1aWNrZml4XCIgfSk7XHJcbiAgICAgICAgICAgICAgICB9KSk7XHJcbiAgICAgICAgICAgIGNvbnN0IG1ha2VMaWdodGJ1bGJSZXF1ZXN0ID0gKHBvc2l0aW9uOiBUZXh0QnVmZmVyLlBvaW50KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoc3Vic2NyaXB0aW9uKSBzdWJzY3JpcHRpb24uZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFlZGl0b3IgfHwgZWRpdG9yLmlzRGVzdHJveWVkKCkpIHJldHVybjtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLmdldENvZGVBY3Rpb25zUmVxdWVzdChlZGl0b3IsIHRydWUpXHJcbiAgICAgICAgICAgICAgICAgICAgLnN1YnNjcmliZShjdHggPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB7cmVzcG9uc2V9ID0gY3R4O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2UuQ29kZUFjdGlvbnMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1hcmtlcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hcmtlci5kZXN0cm95KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFya2VyID0gbnVsbDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBybmcgPSBbW3Bvc2l0aW9uLnJvdywgMF0sIFtwb3NpdGlvbi5yb3csIDBdXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hcmtlciA9IGVkaXRvci5tYXJrQnVmZmVyUmFuZ2Uocm5nKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVkaXRvci5kZWNvcmF0ZU1hcmtlcihtYXJrZXIsIHsgdHlwZTogXCJsaW5lLW51bWJlclwiLCBjbGFzczogXCJxdWlja2ZpeFwiIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICBjb25zdCB1cGRhdGUgPSAocG9zOiBUZXh0QnVmZmVyLlBvaW50KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoc3Vic2NyaXB0aW9uKSBzdWJzY3JpcHRpb24uZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgbWFrZUxpZ2h0YnVsYlJlcXVlc3QocG9zKTtcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IG9uRGlkQ2hhbmdlQ3Vyc29yUG9zaXRpb24gPSBuZXcgU3ViamVjdDx7IG9sZEJ1ZmZlclBvc2l0aW9uOiBUZXh0QnVmZmVyLlBvaW50OyBvbGRTY3JlZW5Qb3NpdGlvbjogVGV4dEJ1ZmZlci5Qb2ludDsgbmV3QnVmZmVyUG9zaXRpb246IFRleHRCdWZmZXIuUG9pbnQ7IG5ld1NjcmVlblBvc2l0aW9uOiBUZXh0QnVmZmVyLlBvaW50OyB0ZXh0Q2hhbmdlZDogYm9vbGVhbjsgY3Vyc29yOiBBdG9tLkN1cnNvcjsgfT4oKTtcclxuICAgICAgICAgICAgY2QuYWRkKG9uRGlkQ2hhbmdlQ3Vyc29yUG9zaXRpb24pO1xyXG5cclxuICAgICAgICAgICAgY29uc3Qgb25EaWRTdG9wQ2hhbmdpbmcgPSBuZXcgU3ViamVjdDxhbnk+KCk7XHJcblxyXG4gICAgICAgICAgICBjZC5hZGQoT2JzZXJ2YWJsZS5jb21iaW5lTGF0ZXN0KFxyXG4gICAgICAgICAgICAgICAgPE9ic2VydmFibGU8eyBvbGRCdWZmZXJQb3NpdGlvbjogVGV4dEJ1ZmZlci5Qb2ludDsgb2xkU2NyZWVuUG9zaXRpb246IFRleHRCdWZmZXIuUG9pbnQ7IG5ld0J1ZmZlclBvc2l0aW9uOiBUZXh0QnVmZmVyLlBvaW50OyBuZXdTY3JlZW5Qb3NpdGlvbjogVGV4dEJ1ZmZlci5Qb2ludDsgdGV4dENoYW5nZWQ6IGJvb2xlYW47IGN1cnNvcjogQXRvbS5DdXJzb3I7IH0+Pjxhbnk+b25EaWRDaGFuZ2VDdXJzb3JQb3NpdGlvbixcclxuICAgICAgICAgICAgICAgIDxPYnNlcnZhYmxlPGFueT4+PGFueT5vbkRpZFN0b3BDaGFuZ2luZyxcclxuICAgICAgICAgICAgICAgIChjdXJzb3IsIGNoYW5naW5nKSA9PiBjdXJzb3IpXHJcbiAgICAgICAgICAgICAgICAuZGVib3VuY2VUaW1lKDEwMDApXHJcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKGN1cnNvciA9PiB1cGRhdGUoY3Vyc29yLm5ld0J1ZmZlclBvc2l0aW9uKSkpO1xyXG5cclxuICAgICAgICAgICAgY2QuYWRkKGVkaXRvci5vbkRpZFN0b3BDaGFuZ2luZyhfLmRlYm91bmNlKCgpID0+IG9uRGlkU3RvcENoYW5naW5nLm5leHQodHJ1ZSksIDEwMDApKSk7XHJcbiAgICAgICAgICAgIGNkLmFkZChlZGl0b3Iub25EaWRDaGFuZ2VDdXJzb3JQb3NpdGlvbihfLmRlYm91bmNlKChlOiBhbnkpID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IG9sZFBvcyA9IGUub2xkQnVmZmVyUG9zaXRpb247XHJcbiAgICAgICAgICAgICAgICBjb25zdCBuZXdQb3MgPSBlLm5ld0J1ZmZlclBvc2l0aW9uO1xyXG5cclxuICAgICAgICAgICAgICAgIGNvbnN0IG5ld1dvcmQ6IHN0cmluZyA9IDxhbnk+ZWRpdG9yLmdldFdvcmRVbmRlckN1cnNvcigpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHdvcmQgIT09IG5ld1dvcmQgfHwgb2xkUG9zLnJvdyAhPT0gbmV3UG9zLnJvdykge1xyXG4gICAgICAgICAgICAgICAgICAgIHdvcmQgPSBuZXdXb3JkO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChtYXJrZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWFya2VyLmRlc3Ryb3koKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWFya2VyID0gbnVsbDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCFvbkRpZENoYW5nZUN1cnNvclBvc2l0aW9uLmlzVW5zdWJzY3JpYmVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgb25EaWRDaGFuZ2VDdXJzb3JQb3NpdGlvbi5uZXh0KGUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LCAxMDAwKSkpO1xyXG4gICAgICAgIH0pKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGdldENvZGVBY3Rpb25zUmVxdWVzdChlZGl0b3I6IEF0b20uVGV4dEVkaXRvciwgc2lsZW50ID0gdHJ1ZSkge1xyXG4gICAgICAgIGlmICghZWRpdG9yIHx8IGVkaXRvci5pc0Rlc3Ryb3llZCgpKSByZXR1cm4gT2JzZXJ2YWJsZS5lbXB0eTx7IHJlcXVlc3Q6IE1vZGVscy5WMi5HZXRDb2RlQWN0aW9uc1JlcXVlc3Q7IHJlc3BvbnNlOiBNb2RlbHMuVjIuR2V0Q29kZUFjdGlvbnNSZXNwb25zZSB9PigpO1xyXG5cclxuICAgICAgICBjb25zdCByZXF1ZXN0ID0gdGhpcy5nZXRSZXF1ZXN0KGVkaXRvcik7XHJcbiAgICAgICAgcmV0dXJuIE9tbmkucmVxdWVzdChlZGl0b3IsIHNvbHV0aW9uID0+IHNvbHV0aW9uLmdldGNvZGVhY3Rpb25zKHJlcXVlc3QpKVxyXG4gICAgICAgICAgICAubWFwKHJlc3BvbnNlID0+ICh7IHJlcXVlc3QsIHJlc3BvbnNlIH0pKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHJ1bkNvZGVBY3Rpb25SZXF1ZXN0KGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yLCBnZXRSZXF1ZXN0OiBNb2RlbHMuVjIuR2V0Q29kZUFjdGlvbnNSZXF1ZXN0LCBjb2RlQWN0aW9uOiBzdHJpbmcpIHtcclxuICAgICAgICBpZiAoIWVkaXRvciB8fCBlZGl0b3IuaXNEZXN0cm95ZWQoKSkgcmV0dXJuIE9ic2VydmFibGUuZW1wdHk8TW9kZWxzLlYyLlJ1bkNvZGVBY3Rpb25SZXNwb25zZT4oKTtcclxuXHJcbiAgICAgICAgY29uc3QgcmVxdWVzdCA9IHRoaXMuZ2V0UmVxdWVzdChlZGl0b3IsIGNvZGVBY3Rpb24pO1xyXG4gICAgICAgIHJlcXVlc3QuU2VsZWN0aW9uID0gZ2V0UmVxdWVzdC5TZWxlY3Rpb247XHJcbiAgICAgICAgcmV0dXJuIE9tbmkucmVxdWVzdChlZGl0b3IsIHNvbHV0aW9uID0+IHNvbHV0aW9uLnJ1bmNvZGVhY3Rpb24ocmVxdWVzdCkpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZ2V0UmVxdWVzdChlZGl0b3I6IEF0b20uVGV4dEVkaXRvcik6IE1vZGVscy5WMi5HZXRDb2RlQWN0aW9uc1JlcXVlc3Q7XHJcbiAgICBwcml2YXRlIGdldFJlcXVlc3QoZWRpdG9yOiBBdG9tLlRleHRFZGl0b3IsIGNvZGVBY3Rpb246IHN0cmluZyk6IE1vZGVscy5WMi5SdW5Db2RlQWN0aW9uUmVxdWVzdDtcclxuICAgIHByaXZhdGUgZ2V0UmVxdWVzdChlZGl0b3I6IEF0b20uVGV4dEVkaXRvciwgY29kZUFjdGlvbj86IHN0cmluZykge1xyXG4gICAgICAgIGNvbnN0IHJhbmdlID0gPGFueT5lZGl0b3IuZ2V0U2VsZWN0ZWRCdWZmZXJSYW5nZSgpO1xyXG4gICAgICAgIGNvbnN0IHJlcXVlc3Q6IE1vZGVscy5WMi5SdW5Db2RlQWN0aW9uUmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgV2FudHNUZXh0Q2hhbmdlczogdHJ1ZSxcclxuICAgICAgICAgICAgU2VsZWN0aW9uOiB7XHJcbiAgICAgICAgICAgICAgICBTdGFydDoge1xyXG4gICAgICAgICAgICAgICAgICAgIExpbmU6IHJhbmdlLnN0YXJ0LnJvdyxcclxuICAgICAgICAgICAgICAgICAgICBDb2x1bW46IHJhbmdlLnN0YXJ0LmNvbHVtblxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIEVuZDoge1xyXG4gICAgICAgICAgICAgICAgICAgIExpbmU6IHJhbmdlLmVuZC5yb3csXHJcbiAgICAgICAgICAgICAgICAgICAgQ29sdW1uOiByYW5nZS5lbmQuY29sdW1uXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBpZiAoY29kZUFjdGlvbiAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIHJlcXVlc3QuSWRlbnRpZmllciA9IGNvZGVBY3Rpb247XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcmVxdWVzdDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGlzcG9zZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZXF1aXJlZCA9IHRydWU7XHJcbiAgICBwdWJsaWMgdGl0bGUgPSBcIkNvZGUgQWN0aW9uc1wiO1xyXG4gICAgcHVibGljIGRlc2NyaXB0aW9uID0gXCJBZGRzIGNvZGUgYWN0aW9uIHN1cHBvcnQgdG8gb21uaXNoYXJwLWF0b20uXCI7XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBjb2RlQWN0aW9uID0gbmV3IENvZGVBY3Rpb247XHJcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
