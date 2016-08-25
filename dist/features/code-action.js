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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9jb2RlLWFjdGlvbi5qcyIsImxpYi9mZWF0dXJlcy9jb2RlLWFjdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7OztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOzs7Ozs7OztJQ0lBO0FBQUEsMEJBQUE7OztBQWlKVyxhQUFBLFFBQUEsR0FBVyxJQUFYLENBakpYO0FBa0pXLGFBQUEsS0FBQSxHQUFRLGNBQVIsQ0FsSlg7QUFtSlcsYUFBQSxXQUFBLEdBQWMsNkNBQWQsQ0FuSlg7S0FBQTs7OzttQ0FLbUI7OztBQUNYLGlCQUFLLFVBQUwsR0FBa0Isd0NBQWxCLENBRFc7QUFHWCxpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLFdBQUssb0JBQUwsQ0FBMEIsaUNBQTFCLEVBQTZELFlBQUE7QUFFN0Usb0JBQU0sU0FBUyxLQUFLLFNBQUwsQ0FBZSxtQkFBZixFQUFULENBRnVFO0FBRzdFLHNCQUFLLHFCQUFMLENBQTJCLE1BQTNCLEVBQ0ssU0FETCxDQUNlLGdCQUFvQjt3QkFBbEIsdUJBQWtCO3dCQUFULHlCQUFTOztBQUUzQiwwQkFBSyxJQUFMLEdBQVksK0JBQWdCO0FBQ3hCLCtCQUFPLFNBQVMsV0FBVDtBQUNQLG1DQUFXLG1CQUFDLElBQUQsRUFBSztBQUNaLGdDQUFJLENBQUMsTUFBRCxJQUFXLE9BQU8sV0FBUCxFQUFYLEVBQWlDLE9BQXJDO0FBRUEsa0NBQUssb0JBQUwsQ0FBMEIsTUFBMUIsRUFBa0MsT0FBbEMsRUFBMkMsS0FBSyxVQUFMLENBQTNDLENBQ0ssU0FETCxDQUNlLFVBQUMsSUFBRDt1Q0FBVSxtQ0FBZ0IsS0FBSyxPQUFMOzZCQUExQixDQURmLENBSFk7eUJBQUw7cUJBRkgsRUFRVCxNQVJTLENBQVosQ0FGMkI7aUJBQXBCLENBRGYsQ0FINkU7YUFBQSxDQUFqRixFQUhXO0FBcUJYLGlCQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsV0FBSyxrQkFBTCxDQUF3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QVcsU0FBWCxDQUo2RjtBQUtqSCxtQkFBTyxXQUFLLE9BQUwsQ0FBYSxNQUFiLEVBQXFCO3VCQUFZLFNBQVMsYUFBVCxDQUF1QixPQUF2QjthQUFaLENBQTVCLENBTGlIOzs7O21DQVVsRyxRQUF5QixZQUFtQjtBQUMzRCxnQkFBTSxRQUFhLE9BQU8sc0JBQVAsRUFBYixDQURxRDtBQUUzRCxnQkFBTSxVQUEwQztBQUM1QyxrQ0FBa0IsSUFBbEI7QUFDQSwyQkFBVztBQUNQLDJCQUFPO0FBQ0gsOEJBQU0sTUFBTSxLQUFOLENBQVksR0FBWjtBQUNOLGdDQUFRLE1BQU0sS0FBTixDQUFZLE1BQVo7cUJBRlo7QUFJQSx5QkFBSztBQUNELDhCQUFNLE1BQU0sR0FBTixDQUFVLEdBQVY7QUFDTixnQ0FBUSxNQUFNLEdBQU4sQ0FBVSxNQUFWO3FCQUZaO2lCQUxKO2FBRkUsQ0FGcUQ7QUFnQjNELGdCQUFJLGVBQWUsU0FBZixFQUEwQjtBQUMxQix3QkFBUSxVQUFSLEdBQXFCLFVBQXJCLENBRDBCO2FBQTlCO0FBSUEsbUJBQU8sT0FBUCxDQXBCMkQ7Ozs7a0NBdUJqRDtBQUNWLGlCQUFLLFVBQUwsQ0FBZ0IsT0FBaEIsR0FEVTs7Ozs7OztBQVNYLElBQU0sa0NBQWEsSUFBSSxVQUFKLEVBQWIiLCJmaWxlIjoibGliL2ZlYXR1cmVzL2NvZGUtYWN0aW9uLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xuaW1wb3J0IHsgU3ViamVjdCwgT2JzZXJ2YWJsZSB9IGZyb20gXCJyeGpzXCI7XG5pbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlIH0gZnJvbSBcInRzLWRpc3Bvc2FibGVzXCI7XG5pbXBvcnQgeyBPbW5pIH0gZnJvbSBcIi4uL3NlcnZlci9vbW5pXCI7XG5pbXBvcnQgeyBhcHBseUFsbENoYW5nZXMgfSBmcm9tIFwiLi4vc2VydmljZXMvYXBwbHktY2hhbmdlc1wiO1xuaW1wb3J0IGNvZGVBY3Rpb25zVmlldyBmcm9tIFwiLi4vdmlld3MvY29kZS1hY3Rpb25zLXZpZXdcIjtcbmNsYXNzIENvZGVBY3Rpb24ge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLnJlcXVpcmVkID0gdHJ1ZTtcbiAgICAgICAgdGhpcy50aXRsZSA9IFwiQ29kZSBBY3Rpb25zXCI7XG4gICAgICAgIHRoaXMuZGVzY3JpcHRpb24gPSBcIkFkZHMgY29kZSBhY3Rpb24gc3VwcG9ydCB0byBvbW5pc2hhcnAtYXRvbS5cIjtcbiAgICB9XG4gICAgYWN0aXZhdGUoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5hZGRUZXh0RWRpdG9yQ29tbWFuZChcIm9tbmlzaGFycC1hdG9tOmdldC1jb2RlLWFjdGlvbnNcIiwgKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgZWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpO1xuICAgICAgICAgICAgdGhpcy5nZXRDb2RlQWN0aW9uc1JlcXVlc3QoZWRpdG9yKVxuICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoKHsgcmVxdWVzdCwgcmVzcG9uc2UgfSkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMudmlldyA9IGNvZGVBY3Rpb25zVmlldyh7XG4gICAgICAgICAgICAgICAgICAgIGl0ZW1zOiByZXNwb25zZS5Db2RlQWN0aW9ucyxcbiAgICAgICAgICAgICAgICAgICAgY29uZmlybWVkOiAoaXRlbSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFlZGl0b3IgfHwgZWRpdG9yLmlzRGVzdHJveWVkKCkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5ydW5Db2RlQWN0aW9uUmVxdWVzdChlZGl0b3IsIHJlcXVlc3QsIGl0ZW0uSWRlbnRpZmllcilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKChyZXNwKSA9PiBhcHBseUFsbENoYW5nZXMocmVzcC5DaGFuZ2VzKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LCBlZGl0b3IpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLnN3aXRjaEFjdGl2ZUVkaXRvcigoZWRpdG9yLCBjZCkgPT4ge1xuICAgICAgICAgICAgbGV0IHdvcmQsIG1hcmtlciwgc3Vic2NyaXB0aW9uO1xuICAgICAgICAgICAgY2QuYWRkKE9tbmkubGlzdGVuZXIuZ2V0Y29kZWFjdGlvbnNcbiAgICAgICAgICAgICAgICAuZmlsdGVyKHogPT4gei5yZXF1ZXN0LkZpbGVOYW1lID09PSBlZGl0b3IuZ2V0UGF0aCgpKVxuICAgICAgICAgICAgICAgIC5maWx0ZXIoY3R4ID0+IGN0eC5yZXNwb25zZS5Db2RlQWN0aW9ucy5sZW5ndGggPiAwKVxuICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoKHsgcmVxdWVzdCB9KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKG1hcmtlcikge1xuICAgICAgICAgICAgICAgICAgICBtYXJrZXIuZGVzdHJveSgpO1xuICAgICAgICAgICAgICAgICAgICBtYXJrZXIgPSBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCByYW5nZSA9IFtbcmVxdWVzdC5MaW5lLCAwXSwgW3JlcXVlc3QuTGluZSwgMF1dO1xuICAgICAgICAgICAgICAgIG1hcmtlciA9IGVkaXRvci5tYXJrQnVmZmVyUmFuZ2UocmFuZ2UpO1xuICAgICAgICAgICAgICAgIGVkaXRvci5kZWNvcmF0ZU1hcmtlcihtYXJrZXIsIHsgdHlwZTogXCJsaW5lLW51bWJlclwiLCBjbGFzczogXCJxdWlja2ZpeFwiIH0pO1xuICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgY29uc3QgbWFrZUxpZ2h0YnVsYlJlcXVlc3QgPSAocG9zaXRpb24pID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoc3Vic2NyaXB0aW9uKVxuICAgICAgICAgICAgICAgICAgICBzdWJzY3JpcHRpb24uZGlzcG9zZSgpO1xuICAgICAgICAgICAgICAgIGlmICghZWRpdG9yIHx8IGVkaXRvci5pc0Rlc3Ryb3llZCgpKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgdGhpcy5nZXRDb2RlQWN0aW9uc1JlcXVlc3QoZWRpdG9yLCB0cnVlKVxuICAgICAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKGN0eCA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHsgcmVzcG9uc2UgfSA9IGN0eDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlLkNvZGVBY3Rpb25zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtYXJrZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXJrZXIuZGVzdHJveSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hcmtlciA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBybmcgPSBbW3Bvc2l0aW9uLnJvdywgMF0sIFtwb3NpdGlvbi5yb3csIDBdXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcmtlciA9IGVkaXRvci5tYXJrQnVmZmVyUmFuZ2Uocm5nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVkaXRvci5kZWNvcmF0ZU1hcmtlcihtYXJrZXIsIHsgdHlwZTogXCJsaW5lLW51bWJlclwiLCBjbGFzczogXCJxdWlja2ZpeFwiIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgY29uc3QgdXBkYXRlID0gKHBvcykgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChzdWJzY3JpcHRpb24pXG4gICAgICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbi5kaXNwb3NlKCk7XG4gICAgICAgICAgICAgICAgbWFrZUxpZ2h0YnVsYlJlcXVlc3QocG9zKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBjb25zdCBvbkRpZENoYW5nZUN1cnNvclBvc2l0aW9uID0gbmV3IFN1YmplY3QoKTtcbiAgICAgICAgICAgIGNkLmFkZChvbkRpZENoYW5nZUN1cnNvclBvc2l0aW9uKTtcbiAgICAgICAgICAgIGNvbnN0IG9uRGlkU3RvcENoYW5naW5nID0gbmV3IFN1YmplY3QoKTtcbiAgICAgICAgICAgIGNkLmFkZChPYnNlcnZhYmxlLmNvbWJpbmVMYXRlc3Qob25EaWRDaGFuZ2VDdXJzb3JQb3NpdGlvbiwgb25EaWRTdG9wQ2hhbmdpbmcsIChjdXJzb3IsIGNoYW5naW5nKSA9PiBjdXJzb3IpXG4gICAgICAgICAgICAgICAgLmRlYm91bmNlVGltZSgxMDAwKVxuICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoY3Vyc29yID0+IHVwZGF0ZShjdXJzb3IubmV3QnVmZmVyUG9zaXRpb24pKSk7XG4gICAgICAgICAgICBjZC5hZGQoZWRpdG9yLm9uRGlkU3RvcENoYW5naW5nKF8uZGVib3VuY2UoKCkgPT4gb25EaWRTdG9wQ2hhbmdpbmcubmV4dCh0cnVlKSwgMTAwMCkpKTtcbiAgICAgICAgICAgIGNkLmFkZChlZGl0b3Iub25EaWRDaGFuZ2VDdXJzb3JQb3NpdGlvbihfLmRlYm91bmNlKChlKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3Qgb2xkUG9zID0gZS5vbGRCdWZmZXJQb3NpdGlvbjtcbiAgICAgICAgICAgICAgICBjb25zdCBuZXdQb3MgPSBlLm5ld0J1ZmZlclBvc2l0aW9uO1xuICAgICAgICAgICAgICAgIGNvbnN0IG5ld1dvcmQgPSBlZGl0b3IuZ2V0V29yZFVuZGVyQ3Vyc29yKCk7XG4gICAgICAgICAgICAgICAgaWYgKHdvcmQgIT09IG5ld1dvcmQgfHwgb2xkUG9zLnJvdyAhPT0gbmV3UG9zLnJvdykge1xuICAgICAgICAgICAgICAgICAgICB3b3JkID0gbmV3V29yZDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG1hcmtlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWFya2VyLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcmtlciA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCFvbkRpZENoYW5nZUN1cnNvclBvc2l0aW9uLmlzVW5zdWJzY3JpYmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIG9uRGlkQ2hhbmdlQ3Vyc29yUG9zaXRpb24ubmV4dChlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCAxMDAwKSkpO1xuICAgICAgICB9KSk7XG4gICAgfVxuICAgIGdldENvZGVBY3Rpb25zUmVxdWVzdChlZGl0b3IsIHNpbGVudCA9IHRydWUpIHtcbiAgICAgICAgaWYgKCFlZGl0b3IgfHwgZWRpdG9yLmlzRGVzdHJveWVkKCkpXG4gICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5lbXB0eSgpO1xuICAgICAgICBjb25zdCByZXF1ZXN0ID0gdGhpcy5nZXRSZXF1ZXN0KGVkaXRvcik7XG4gICAgICAgIHJldHVybiBPbW5pLnJlcXVlc3QoZWRpdG9yLCBzb2x1dGlvbiA9PiBzb2x1dGlvbi5nZXRjb2RlYWN0aW9ucyhyZXF1ZXN0KSlcbiAgICAgICAgICAgIC5tYXAocmVzcG9uc2UgPT4gKHsgcmVxdWVzdCwgcmVzcG9uc2UgfSkpO1xuICAgIH1cbiAgICBydW5Db2RlQWN0aW9uUmVxdWVzdChlZGl0b3IsIGdldFJlcXVlc3QsIGNvZGVBY3Rpb24pIHtcbiAgICAgICAgaWYgKCFlZGl0b3IgfHwgZWRpdG9yLmlzRGVzdHJveWVkKCkpXG4gICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5lbXB0eSgpO1xuICAgICAgICBjb25zdCByZXF1ZXN0ID0gdGhpcy5nZXRSZXF1ZXN0KGVkaXRvciwgY29kZUFjdGlvbik7XG4gICAgICAgIHJlcXVlc3QuU2VsZWN0aW9uID0gZ2V0UmVxdWVzdC5TZWxlY3Rpb247XG4gICAgICAgIHJldHVybiBPbW5pLnJlcXVlc3QoZWRpdG9yLCBzb2x1dGlvbiA9PiBzb2x1dGlvbi5ydW5jb2RlYWN0aW9uKHJlcXVlc3QpKTtcbiAgICB9XG4gICAgZ2V0UmVxdWVzdChlZGl0b3IsIGNvZGVBY3Rpb24pIHtcbiAgICAgICAgY29uc3QgcmFuZ2UgPSBlZGl0b3IuZ2V0U2VsZWN0ZWRCdWZmZXJSYW5nZSgpO1xuICAgICAgICBjb25zdCByZXF1ZXN0ID0ge1xuICAgICAgICAgICAgV2FudHNUZXh0Q2hhbmdlczogdHJ1ZSxcbiAgICAgICAgICAgIFNlbGVjdGlvbjoge1xuICAgICAgICAgICAgICAgIFN0YXJ0OiB7XG4gICAgICAgICAgICAgICAgICAgIExpbmU6IHJhbmdlLnN0YXJ0LnJvdyxcbiAgICAgICAgICAgICAgICAgICAgQ29sdW1uOiByYW5nZS5zdGFydC5jb2x1bW5cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIEVuZDoge1xuICAgICAgICAgICAgICAgICAgICBMaW5lOiByYW5nZS5lbmQucm93LFxuICAgICAgICAgICAgICAgICAgICBDb2x1bW46IHJhbmdlLmVuZC5jb2x1bW5cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIGlmIChjb2RlQWN0aW9uICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJlcXVlc3QuSWRlbnRpZmllciA9IGNvZGVBY3Rpb247XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlcXVlc3Q7XG4gICAgfVxuICAgIGRpc3Bvc2UoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfVxufVxuZXhwb3J0IGNvbnN0IGNvZGVBY3Rpb24gPSBuZXcgQ29kZUFjdGlvbjtcbiIsImltcG9ydCB7TW9kZWxzfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xyXG5pbXBvcnQgXyBmcm9tIFwibG9kYXNoXCI7XHJcbmltcG9ydCB7U3ViamVjdCwgT2JzZXJ2YWJsZX0gZnJvbSBcInJ4anNcIjtcclxuaW1wb3J0IHtDb21wb3NpdGVEaXNwb3NhYmxlLCBJRGlzcG9zYWJsZX0gZnJvbSBcInRzLWRpc3Bvc2FibGVzXCI7XHJcbmltcG9ydCB7T21uaX0gZnJvbSBcIi4uL3NlcnZlci9vbW5pXCI7XHJcbmltcG9ydCAqIGFzIFNwYWNlUGVuIGZyb20gXCJhdG9tLXNwYWNlLXBlbi12aWV3c1wiO1xyXG5pbXBvcnQge2FwcGx5QWxsQ2hhbmdlc30gZnJvbSBcIi4uL3NlcnZpY2VzL2FwcGx5LWNoYW5nZXNcIjtcclxuaW1wb3J0IGNvZGVBY3Rpb25zVmlldyBmcm9tIFwiLi4vdmlld3MvY29kZS1hY3Rpb25zLXZpZXdcIjtcclxuXHJcbmNsYXNzIENvZGVBY3Rpb24gaW1wbGVtZW50cyBJRmVhdHVyZSB7XHJcbiAgICBwcml2YXRlIGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XHJcblxyXG4gICAgcHJpdmF0ZSB2aWV3OiBTcGFjZVBlbi5TZWxlY3RMaXN0VmlldztcclxuXHJcbiAgICBwdWJsaWMgYWN0aXZhdGUoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmFkZFRleHRFZGl0b3JDb21tYW5kKFwib21uaXNoYXJwLWF0b206Z2V0LWNvZGUtYWN0aW9uc1wiLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIC8vc3RvcmUgdGhlIGVkaXRvciB0aGF0IHRoaXMgd2FzIHRyaWdnZXJlZCBieS5cclxuICAgICAgICAgICAgY29uc3QgZWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpO1xyXG4gICAgICAgICAgICB0aGlzLmdldENvZGVBY3Rpb25zUmVxdWVzdChlZGl0b3IpXHJcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKCh7cmVxdWVzdCwgcmVzcG9uc2V9KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy9wb3AgdWkgdG8gdXNlci5cclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnZpZXcgPSBjb2RlQWN0aW9uc1ZpZXcoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVtczogcmVzcG9uc2UuQ29kZUFjdGlvbnMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpcm1lZDogKGl0ZW0pID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghZWRpdG9yIHx8IGVkaXRvci5pc0Rlc3Ryb3llZCgpKSByZXR1cm47XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5ydW5Db2RlQWN0aW9uUmVxdWVzdChlZGl0b3IsIHJlcXVlc3QsIGl0ZW0uSWRlbnRpZmllcilcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKChyZXNwKSA9PiBhcHBseUFsbENoYW5nZXMocmVzcC5DaGFuZ2VzKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9LCBlZGl0b3IpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuc3dpdGNoQWN0aXZlRWRpdG9yKChlZGl0b3IsIGNkKSA9PiB7XHJcbiAgICAgICAgICAgIGxldCB3b3JkOiBzdHJpbmcsIG1hcmtlcjogQXRvbS5NYXJrZXIsIHN1YnNjcmlwdGlvbjogSURpc3Bvc2FibGU7XHJcblxyXG4gICAgICAgICAgICBjZC5hZGQoT21uaS5saXN0ZW5lci5nZXRjb2RlYWN0aW9uc1xyXG4gICAgICAgICAgICAgICAgLmZpbHRlcih6ID0+IHoucmVxdWVzdC5GaWxlTmFtZSA9PT0gZWRpdG9yLmdldFBhdGgoKSlcclxuICAgICAgICAgICAgICAgIC5maWx0ZXIoY3R4ID0+IGN0eC5yZXNwb25zZS5Db2RlQWN0aW9ucy5sZW5ndGggPiAwKVxyXG4gICAgICAgICAgICAgICAgLnN1YnNjcmliZSgoe3JlcXVlc3R9KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG1hcmtlcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXJrZXIuZGVzdHJveSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXJrZXIgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmFuZ2UgPSBbW3JlcXVlc3QuTGluZSwgMF0sIFtyZXF1ZXN0LkxpbmUsIDBdXTtcclxuICAgICAgICAgICAgICAgICAgICBtYXJrZXIgPSBlZGl0b3IubWFya0J1ZmZlclJhbmdlKHJhbmdlKTtcclxuICAgICAgICAgICAgICAgICAgICBlZGl0b3IuZGVjb3JhdGVNYXJrZXIobWFya2VyLCB7IHR5cGU6IFwibGluZS1udW1iZXJcIiwgY2xhc3M6IFwicXVpY2tmaXhcIiB9KTtcclxuICAgICAgICAgICAgICAgIH0pKTtcclxuICAgICAgICAgICAgY29uc3QgbWFrZUxpZ2h0YnVsYlJlcXVlc3QgPSAocG9zaXRpb246IFRleHRCdWZmZXIuUG9pbnQpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmIChzdWJzY3JpcHRpb24pIHN1YnNjcmlwdGlvbi5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWVkaXRvciB8fCBlZGl0b3IuaXNEZXN0cm95ZWQoKSkgcmV0dXJuO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMuZ2V0Q29kZUFjdGlvbnNSZXF1ZXN0KGVkaXRvciwgdHJ1ZSlcclxuICAgICAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKGN0eCA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHtyZXNwb25zZX0gPSBjdHg7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZS5Db2RlQWN0aW9ucy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobWFya2VyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFya2VyLmRlc3Ryb3koKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXJrZXIgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJuZyA9IFtbcG9zaXRpb24ucm93LCAwXSwgW3Bvc2l0aW9uLnJvdywgMF1dO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFya2VyID0gZWRpdG9yLm1hcmtCdWZmZXJSYW5nZShybmcpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWRpdG9yLmRlY29yYXRlTWFya2VyKG1hcmtlciwgeyB0eXBlOiBcImxpbmUtbnVtYmVyXCIsIGNsYXNzOiBcInF1aWNrZml4XCIgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IHVwZGF0ZSA9IChwb3M6IFRleHRCdWZmZXIuUG9pbnQpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmIChzdWJzY3JpcHRpb24pIHN1YnNjcmlwdGlvbi5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgICAgICBtYWtlTGlnaHRidWxiUmVxdWVzdChwb3MpO1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgY29uc3Qgb25EaWRDaGFuZ2VDdXJzb3JQb3NpdGlvbiA9IG5ldyBTdWJqZWN0PHsgb2xkQnVmZmVyUG9zaXRpb246IFRleHRCdWZmZXIuUG9pbnQ7IG9sZFNjcmVlblBvc2l0aW9uOiBUZXh0QnVmZmVyLlBvaW50OyBuZXdCdWZmZXJQb3NpdGlvbjogVGV4dEJ1ZmZlci5Qb2ludDsgbmV3U2NyZWVuUG9zaXRpb246IFRleHRCdWZmZXIuUG9pbnQ7IHRleHRDaGFuZ2VkOiBib29sZWFuOyBjdXJzb3I6IEF0b20uQ3Vyc29yOyB9PigpO1xyXG4gICAgICAgICAgICBjZC5hZGQob25EaWRDaGFuZ2VDdXJzb3JQb3NpdGlvbik7XHJcblxyXG4gICAgICAgICAgICBjb25zdCBvbkRpZFN0b3BDaGFuZ2luZyA9IG5ldyBTdWJqZWN0PGFueT4oKTtcclxuXHJcbiAgICAgICAgICAgIGNkLmFkZChPYnNlcnZhYmxlLmNvbWJpbmVMYXRlc3QoXHJcbiAgICAgICAgICAgICAgICA8T2JzZXJ2YWJsZTx7IG9sZEJ1ZmZlclBvc2l0aW9uOiBUZXh0QnVmZmVyLlBvaW50OyBvbGRTY3JlZW5Qb3NpdGlvbjogVGV4dEJ1ZmZlci5Qb2ludDsgbmV3QnVmZmVyUG9zaXRpb246IFRleHRCdWZmZXIuUG9pbnQ7IG5ld1NjcmVlblBvc2l0aW9uOiBUZXh0QnVmZmVyLlBvaW50OyB0ZXh0Q2hhbmdlZDogYm9vbGVhbjsgY3Vyc29yOiBBdG9tLkN1cnNvcjsgfT4+PGFueT5vbkRpZENoYW5nZUN1cnNvclBvc2l0aW9uLFxyXG4gICAgICAgICAgICAgICAgPE9ic2VydmFibGU8YW55Pj48YW55Pm9uRGlkU3RvcENoYW5naW5nLFxyXG4gICAgICAgICAgICAgICAgKGN1cnNvciwgY2hhbmdpbmcpID0+IGN1cnNvcilcclxuICAgICAgICAgICAgICAgIC5kZWJvdW5jZVRpbWUoMTAwMClcclxuICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoY3Vyc29yID0+IHVwZGF0ZShjdXJzb3IubmV3QnVmZmVyUG9zaXRpb24pKSk7XHJcblxyXG4gICAgICAgICAgICBjZC5hZGQoZWRpdG9yLm9uRGlkU3RvcENoYW5naW5nKF8uZGVib3VuY2UoKCkgPT4gb25EaWRTdG9wQ2hhbmdpbmcubmV4dCh0cnVlKSwgMTAwMCkpKTtcclxuICAgICAgICAgICAgY2QuYWRkKGVkaXRvci5vbkRpZENoYW5nZUN1cnNvclBvc2l0aW9uKF8uZGVib3VuY2UoKGU6IGFueSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc3Qgb2xkUG9zID0gZS5vbGRCdWZmZXJQb3NpdGlvbjtcclxuICAgICAgICAgICAgICAgIGNvbnN0IG5ld1BvcyA9IGUubmV3QnVmZmVyUG9zaXRpb247XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc3QgbmV3V29yZDogc3RyaW5nID0gPGFueT5lZGl0b3IuZ2V0V29yZFVuZGVyQ3Vyc29yKCk7XHJcbiAgICAgICAgICAgICAgICBpZiAod29yZCAhPT0gbmV3V29yZCB8fCBvbGRQb3Mucm93ICE9PSBuZXdQb3Mucm93KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgd29yZCA9IG5ld1dvcmQ7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG1hcmtlcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXJrZXIuZGVzdHJveSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXJrZXIgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIW9uRGlkQ2hhbmdlQ3Vyc29yUG9zaXRpb24uaXNVbnN1YnNjcmliZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICBvbkRpZENoYW5nZUN1cnNvclBvc2l0aW9uLm5leHQoZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sIDEwMDApKSk7XHJcbiAgICAgICAgfSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZ2V0Q29kZUFjdGlvbnNSZXF1ZXN0KGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yLCBzaWxlbnQgPSB0cnVlKSB7XHJcbiAgICAgICAgaWYgKCFlZGl0b3IgfHwgZWRpdG9yLmlzRGVzdHJveWVkKCkpIHJldHVybiBPYnNlcnZhYmxlLmVtcHR5PHsgcmVxdWVzdDogTW9kZWxzLlYyLkdldENvZGVBY3Rpb25zUmVxdWVzdDsgcmVzcG9uc2U6IE1vZGVscy5WMi5HZXRDb2RlQWN0aW9uc1Jlc3BvbnNlIH0+KCk7XHJcblxyXG4gICAgICAgIGNvbnN0IHJlcXVlc3QgPSB0aGlzLmdldFJlcXVlc3QoZWRpdG9yKTtcclxuICAgICAgICByZXR1cm4gT21uaS5yZXF1ZXN0KGVkaXRvciwgc29sdXRpb24gPT4gc29sdXRpb24uZ2V0Y29kZWFjdGlvbnMocmVxdWVzdCkpXHJcbiAgICAgICAgICAgIC5tYXAocmVzcG9uc2UgPT4gKHsgcmVxdWVzdCwgcmVzcG9uc2UgfSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgcnVuQ29kZUFjdGlvblJlcXVlc3QoZWRpdG9yOiBBdG9tLlRleHRFZGl0b3IsIGdldFJlcXVlc3Q6IE1vZGVscy5WMi5HZXRDb2RlQWN0aW9uc1JlcXVlc3QsIGNvZGVBY3Rpb246IHN0cmluZykge1xyXG4gICAgICAgIGlmICghZWRpdG9yIHx8IGVkaXRvci5pc0Rlc3Ryb3llZCgpKSByZXR1cm4gT2JzZXJ2YWJsZS5lbXB0eTxNb2RlbHMuVjIuUnVuQ29kZUFjdGlvblJlc3BvbnNlPigpO1xyXG5cclxuICAgICAgICBjb25zdCByZXF1ZXN0ID0gdGhpcy5nZXRSZXF1ZXN0KGVkaXRvciwgY29kZUFjdGlvbik7XHJcbiAgICAgICAgcmVxdWVzdC5TZWxlY3Rpb24gPSBnZXRSZXF1ZXN0LlNlbGVjdGlvbjtcclxuICAgICAgICByZXR1cm4gT21uaS5yZXF1ZXN0KGVkaXRvciwgc29sdXRpb24gPT4gc29sdXRpb24ucnVuY29kZWFjdGlvbihyZXF1ZXN0KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBnZXRSZXF1ZXN0KGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yKTogTW9kZWxzLlYyLkdldENvZGVBY3Rpb25zUmVxdWVzdDtcclxuICAgIHByaXZhdGUgZ2V0UmVxdWVzdChlZGl0b3I6IEF0b20uVGV4dEVkaXRvciwgY29kZUFjdGlvbjogc3RyaW5nKTogTW9kZWxzLlYyLlJ1bkNvZGVBY3Rpb25SZXF1ZXN0O1xyXG4gICAgcHJpdmF0ZSBnZXRSZXF1ZXN0KGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yLCBjb2RlQWN0aW9uPzogc3RyaW5nKSB7XHJcbiAgICAgICAgY29uc3QgcmFuZ2UgPSA8YW55PmVkaXRvci5nZXRTZWxlY3RlZEJ1ZmZlclJhbmdlKCk7XHJcbiAgICAgICAgY29uc3QgcmVxdWVzdDogTW9kZWxzLlYyLlJ1bkNvZGVBY3Rpb25SZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICBXYW50c1RleHRDaGFuZ2VzOiB0cnVlLFxyXG4gICAgICAgICAgICBTZWxlY3Rpb246IHtcclxuICAgICAgICAgICAgICAgIFN0YXJ0OiB7XHJcbiAgICAgICAgICAgICAgICAgICAgTGluZTogcmFuZ2Uuc3RhcnQucm93LFxyXG4gICAgICAgICAgICAgICAgICAgIENvbHVtbjogcmFuZ2Uuc3RhcnQuY29sdW1uXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgRW5kOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgTGluZTogcmFuZ2UuZW5kLnJvdyxcclxuICAgICAgICAgICAgICAgICAgICBDb2x1bW46IHJhbmdlLmVuZC5jb2x1bW5cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGlmIChjb2RlQWN0aW9uICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgcmVxdWVzdC5JZGVudGlmaWVyID0gY29kZUFjdGlvbjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXF1ZXN0O1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkaXNwb3NlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlcXVpcmVkID0gdHJ1ZTtcclxuICAgIHB1YmxpYyB0aXRsZSA9IFwiQ29kZSBBY3Rpb25zXCI7XHJcbiAgICBwdWJsaWMgZGVzY3JpcHRpb24gPSBcIkFkZHMgY29kZSBhY3Rpb24gc3VwcG9ydCB0byBvbW5pc2hhcnAtYXRvbS5cIjtcclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IGNvZGVBY3Rpb24gPSBuZXcgQ29kZUFjdGlvbjtcclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
