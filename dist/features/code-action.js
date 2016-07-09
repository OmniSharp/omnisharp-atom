"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.codeAction = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _rxjs = require("rxjs");

var _omnisharpClient = require("omnisharp-client");

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

            this.disposable = new _omnisharpClient.CompositeDisposable();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9jb2RlLWFjdGlvbi5qcyIsImxpYi9mZWF0dXJlcy9jb2RlLWFjdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7OztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOzs7Ozs7OztJQ0lBLFU7QUFBQSwwQkFBQTtBQUFBOztBQWlKVyxhQUFBLFFBQUEsR0FBVyxJQUFYO0FBQ0EsYUFBQSxLQUFBLEdBQVEsY0FBUjtBQUNBLGFBQUEsV0FBQSxHQUFjLDZDQUFkO0FBQ1Y7Ozs7bUNBL0lrQjtBQUFBOztBQUNYLGlCQUFLLFVBQUwsR0FBa0IsMENBQWxCO0FBRUEsaUJBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQixXQUFLLG9CQUFMLENBQTBCLGlDQUExQixFQUE2RCxZQUFBO0FBRTdFLG9CQUFNLFNBQVMsS0FBSyxTQUFMLENBQWUsbUJBQWYsRUFBZjtBQUNBLHNCQUFLLHFCQUFMLENBQTJCLE1BQTNCLEVBQ0ssU0FETCxDQUNlLGdCQUFvQjtBQUFBLHdCQUFsQixPQUFrQixRQUFsQixPQUFrQjtBQUFBLHdCQUFULFFBQVMsUUFBVCxRQUFTOztBQUUzQiwwQkFBSyxJQUFMLEdBQVksK0JBQWdCO0FBQ3hCLCtCQUFPLFNBQVMsV0FEUTtBQUV4QixtQ0FBVyxtQkFBQyxJQUFELEVBQUs7QUFDWixnQ0FBSSxDQUFDLE1BQUQsSUFBVyxPQUFPLFdBQVAsRUFBZixFQUFxQztBQUVyQyxrQ0FBSyxvQkFBTCxDQUEwQixNQUExQixFQUFrQyxPQUFsQyxFQUEyQyxLQUFLLFVBQWhELEVBQ0ssU0FETCxDQUNlLFVBQUMsSUFBRDtBQUFBLHVDQUFVLG1DQUFnQixLQUFLLE9BQXJCLENBQVY7QUFBQSw2QkFEZjtBQUVIO0FBUHVCLHFCQUFoQixFQVFULE1BUlMsQ0FBWjtBQVNILGlCQVpMO0FBYUgsYUFoQm1CLENBQXBCO0FBa0JBLGlCQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsV0FBSyxrQkFBTCxDQUF3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QixDQUFQO0FBQ0g7OzttQ0FJa0IsTSxFQUF5QixVLEVBQW1CO0FBQzNELGdCQUFNLFFBQWEsT0FBTyxzQkFBUCxFQUFuQjtBQUNBLGdCQUFNLFVBQTBDO0FBQzVDLGtDQUFrQixJQUQwQjtBQUU1QywyQkFBVztBQUNQLDJCQUFPO0FBQ0gsOEJBQU0sTUFBTSxLQUFOLENBQVksR0FEZjtBQUVILGdDQUFRLE1BQU0sS0FBTixDQUFZO0FBRmpCLHFCQURBO0FBS1AseUJBQUs7QUFDRCw4QkFBTSxNQUFNLEdBQU4sQ0FBVSxHQURmO0FBRUQsZ0NBQVEsTUFBTSxHQUFOLENBQVU7QUFGakI7QUFMRTtBQUZpQyxhQUFoRDtBQWNBLGdCQUFJLGVBQWUsU0FBbkIsRUFBOEI7QUFDMUIsd0JBQVEsVUFBUixHQUFxQixVQUFyQjtBQUNIO0FBRUQsbUJBQU8sT0FBUDtBQUNIOzs7a0NBRWE7QUFDVixpQkFBSyxVQUFMLENBQWdCLE9BQWhCO0FBQ0g7Ozs7OztBQU9FLElBQU0sa0NBQWEsSUFBSSxVQUFKLEVBQW5CIiwiZmlsZSI6ImxpYi9mZWF0dXJlcy9jb2RlLWFjdGlvbi5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcbmltcG9ydCB7IFN1YmplY3QsIE9ic2VydmFibGUgfSBmcm9tIFwicnhqc1wiO1xuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSB9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XG5pbXBvcnQgeyBPbW5pIH0gZnJvbSBcIi4uL3NlcnZlci9vbW5pXCI7XG5pbXBvcnQgeyBhcHBseUFsbENoYW5nZXMgfSBmcm9tIFwiLi4vc2VydmljZXMvYXBwbHktY2hhbmdlc1wiO1xuaW1wb3J0IGNvZGVBY3Rpb25zVmlldyBmcm9tIFwiLi4vdmlld3MvY29kZS1hY3Rpb25zLXZpZXdcIjtcbmNsYXNzIENvZGVBY3Rpb24ge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLnJlcXVpcmVkID0gdHJ1ZTtcbiAgICAgICAgdGhpcy50aXRsZSA9IFwiQ29kZSBBY3Rpb25zXCI7XG4gICAgICAgIHRoaXMuZGVzY3JpcHRpb24gPSBcIkFkZHMgY29kZSBhY3Rpb24gc3VwcG9ydCB0byBvbW5pc2hhcnAtYXRvbS5cIjtcbiAgICB9XG4gICAgYWN0aXZhdGUoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5hZGRUZXh0RWRpdG9yQ29tbWFuZChcIm9tbmlzaGFycC1hdG9tOmdldC1jb2RlLWFjdGlvbnNcIiwgKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgZWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpO1xuICAgICAgICAgICAgdGhpcy5nZXRDb2RlQWN0aW9uc1JlcXVlc3QoZWRpdG9yKVxuICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoKHsgcmVxdWVzdCwgcmVzcG9uc2UgfSkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMudmlldyA9IGNvZGVBY3Rpb25zVmlldyh7XG4gICAgICAgICAgICAgICAgICAgIGl0ZW1zOiByZXNwb25zZS5Db2RlQWN0aW9ucyxcbiAgICAgICAgICAgICAgICAgICAgY29uZmlybWVkOiAoaXRlbSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFlZGl0b3IgfHwgZWRpdG9yLmlzRGVzdHJveWVkKCkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5ydW5Db2RlQWN0aW9uUmVxdWVzdChlZGl0b3IsIHJlcXVlc3QsIGl0ZW0uSWRlbnRpZmllcilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKChyZXNwKSA9PiBhcHBseUFsbENoYW5nZXMocmVzcC5DaGFuZ2VzKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LCBlZGl0b3IpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLnN3aXRjaEFjdGl2ZUVkaXRvcigoZWRpdG9yLCBjZCkgPT4ge1xuICAgICAgICAgICAgbGV0IHdvcmQsIG1hcmtlciwgc3Vic2NyaXB0aW9uO1xuICAgICAgICAgICAgY2QuYWRkKE9tbmkubGlzdGVuZXIuZ2V0Y29kZWFjdGlvbnNcbiAgICAgICAgICAgICAgICAuZmlsdGVyKHogPT4gei5yZXF1ZXN0LkZpbGVOYW1lID09PSBlZGl0b3IuZ2V0UGF0aCgpKVxuICAgICAgICAgICAgICAgIC5maWx0ZXIoY3R4ID0+IGN0eC5yZXNwb25zZS5Db2RlQWN0aW9ucy5sZW5ndGggPiAwKVxuICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoKHsgcmVxdWVzdCB9KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKG1hcmtlcikge1xuICAgICAgICAgICAgICAgICAgICBtYXJrZXIuZGVzdHJveSgpO1xuICAgICAgICAgICAgICAgICAgICBtYXJrZXIgPSBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCByYW5nZSA9IFtbcmVxdWVzdC5MaW5lLCAwXSwgW3JlcXVlc3QuTGluZSwgMF1dO1xuICAgICAgICAgICAgICAgIG1hcmtlciA9IGVkaXRvci5tYXJrQnVmZmVyUmFuZ2UocmFuZ2UpO1xuICAgICAgICAgICAgICAgIGVkaXRvci5kZWNvcmF0ZU1hcmtlcihtYXJrZXIsIHsgdHlwZTogXCJsaW5lLW51bWJlclwiLCBjbGFzczogXCJxdWlja2ZpeFwiIH0pO1xuICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgY29uc3QgbWFrZUxpZ2h0YnVsYlJlcXVlc3QgPSAocG9zaXRpb24pID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoc3Vic2NyaXB0aW9uKVxuICAgICAgICAgICAgICAgICAgICBzdWJzY3JpcHRpb24uZGlzcG9zZSgpO1xuICAgICAgICAgICAgICAgIGlmICghZWRpdG9yIHx8IGVkaXRvci5pc0Rlc3Ryb3llZCgpKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgdGhpcy5nZXRDb2RlQWN0aW9uc1JlcXVlc3QoZWRpdG9yLCB0cnVlKVxuICAgICAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKGN0eCA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHsgcmVzcG9uc2UgfSA9IGN0eDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlLkNvZGVBY3Rpb25zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtYXJrZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXJrZXIuZGVzdHJveSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hcmtlciA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBybmcgPSBbW3Bvc2l0aW9uLnJvdywgMF0sIFtwb3NpdGlvbi5yb3csIDBdXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcmtlciA9IGVkaXRvci5tYXJrQnVmZmVyUmFuZ2Uocm5nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVkaXRvci5kZWNvcmF0ZU1hcmtlcihtYXJrZXIsIHsgdHlwZTogXCJsaW5lLW51bWJlclwiLCBjbGFzczogXCJxdWlja2ZpeFwiIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgY29uc3QgdXBkYXRlID0gKHBvcykgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChzdWJzY3JpcHRpb24pXG4gICAgICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbi5kaXNwb3NlKCk7XG4gICAgICAgICAgICAgICAgbWFrZUxpZ2h0YnVsYlJlcXVlc3QocG9zKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBjb25zdCBvbkRpZENoYW5nZUN1cnNvclBvc2l0aW9uID0gbmV3IFN1YmplY3QoKTtcbiAgICAgICAgICAgIGNkLmFkZChvbkRpZENoYW5nZUN1cnNvclBvc2l0aW9uKTtcbiAgICAgICAgICAgIGNvbnN0IG9uRGlkU3RvcENoYW5naW5nID0gbmV3IFN1YmplY3QoKTtcbiAgICAgICAgICAgIGNkLmFkZChPYnNlcnZhYmxlLmNvbWJpbmVMYXRlc3Qob25EaWRDaGFuZ2VDdXJzb3JQb3NpdGlvbiwgb25EaWRTdG9wQ2hhbmdpbmcsIChjdXJzb3IsIGNoYW5naW5nKSA9PiBjdXJzb3IpXG4gICAgICAgICAgICAgICAgLmRlYm91bmNlVGltZSgxMDAwKVxuICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoY3Vyc29yID0+IHVwZGF0ZShjdXJzb3IubmV3QnVmZmVyUG9zaXRpb24pKSk7XG4gICAgICAgICAgICBjZC5hZGQoZWRpdG9yLm9uRGlkU3RvcENoYW5naW5nKF8uZGVib3VuY2UoKCkgPT4gb25EaWRTdG9wQ2hhbmdpbmcubmV4dCh0cnVlKSwgMTAwMCkpKTtcbiAgICAgICAgICAgIGNkLmFkZChlZGl0b3Iub25EaWRDaGFuZ2VDdXJzb3JQb3NpdGlvbihfLmRlYm91bmNlKChlKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3Qgb2xkUG9zID0gZS5vbGRCdWZmZXJQb3NpdGlvbjtcbiAgICAgICAgICAgICAgICBjb25zdCBuZXdQb3MgPSBlLm5ld0J1ZmZlclBvc2l0aW9uO1xuICAgICAgICAgICAgICAgIGNvbnN0IG5ld1dvcmQgPSBlZGl0b3IuZ2V0V29yZFVuZGVyQ3Vyc29yKCk7XG4gICAgICAgICAgICAgICAgaWYgKHdvcmQgIT09IG5ld1dvcmQgfHwgb2xkUG9zLnJvdyAhPT0gbmV3UG9zLnJvdykge1xuICAgICAgICAgICAgICAgICAgICB3b3JkID0gbmV3V29yZDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG1hcmtlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWFya2VyLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcmtlciA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCFvbkRpZENoYW5nZUN1cnNvclBvc2l0aW9uLmlzVW5zdWJzY3JpYmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIG9uRGlkQ2hhbmdlQ3Vyc29yUG9zaXRpb24ubmV4dChlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCAxMDAwKSkpO1xuICAgICAgICB9KSk7XG4gICAgfVxuICAgIGdldENvZGVBY3Rpb25zUmVxdWVzdChlZGl0b3IsIHNpbGVudCA9IHRydWUpIHtcbiAgICAgICAgaWYgKCFlZGl0b3IgfHwgZWRpdG9yLmlzRGVzdHJveWVkKCkpXG4gICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5lbXB0eSgpO1xuICAgICAgICBjb25zdCByZXF1ZXN0ID0gdGhpcy5nZXRSZXF1ZXN0KGVkaXRvcik7XG4gICAgICAgIHJldHVybiBPbW5pLnJlcXVlc3QoZWRpdG9yLCBzb2x1dGlvbiA9PiBzb2x1dGlvbi5nZXRjb2RlYWN0aW9ucyhyZXF1ZXN0KSlcbiAgICAgICAgICAgIC5tYXAocmVzcG9uc2UgPT4gKHsgcmVxdWVzdCwgcmVzcG9uc2UgfSkpO1xuICAgIH1cbiAgICBydW5Db2RlQWN0aW9uUmVxdWVzdChlZGl0b3IsIGdldFJlcXVlc3QsIGNvZGVBY3Rpb24pIHtcbiAgICAgICAgaWYgKCFlZGl0b3IgfHwgZWRpdG9yLmlzRGVzdHJveWVkKCkpXG4gICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5lbXB0eSgpO1xuICAgICAgICBjb25zdCByZXF1ZXN0ID0gdGhpcy5nZXRSZXF1ZXN0KGVkaXRvciwgY29kZUFjdGlvbik7XG4gICAgICAgIHJlcXVlc3QuU2VsZWN0aW9uID0gZ2V0UmVxdWVzdC5TZWxlY3Rpb247XG4gICAgICAgIHJldHVybiBPbW5pLnJlcXVlc3QoZWRpdG9yLCBzb2x1dGlvbiA9PiBzb2x1dGlvbi5ydW5jb2RlYWN0aW9uKHJlcXVlc3QpKTtcbiAgICB9XG4gICAgZ2V0UmVxdWVzdChlZGl0b3IsIGNvZGVBY3Rpb24pIHtcbiAgICAgICAgY29uc3QgcmFuZ2UgPSBlZGl0b3IuZ2V0U2VsZWN0ZWRCdWZmZXJSYW5nZSgpO1xuICAgICAgICBjb25zdCByZXF1ZXN0ID0ge1xuICAgICAgICAgICAgV2FudHNUZXh0Q2hhbmdlczogdHJ1ZSxcbiAgICAgICAgICAgIFNlbGVjdGlvbjoge1xuICAgICAgICAgICAgICAgIFN0YXJ0OiB7XG4gICAgICAgICAgICAgICAgICAgIExpbmU6IHJhbmdlLnN0YXJ0LnJvdyxcbiAgICAgICAgICAgICAgICAgICAgQ29sdW1uOiByYW5nZS5zdGFydC5jb2x1bW5cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIEVuZDoge1xuICAgICAgICAgICAgICAgICAgICBMaW5lOiByYW5nZS5lbmQucm93LFxuICAgICAgICAgICAgICAgICAgICBDb2x1bW46IHJhbmdlLmVuZC5jb2x1bW5cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIGlmIChjb2RlQWN0aW9uICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJlcXVlc3QuSWRlbnRpZmllciA9IGNvZGVBY3Rpb247XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlcXVlc3Q7XG4gICAgfVxuICAgIGRpc3Bvc2UoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfVxufVxuZXhwb3J0IGNvbnN0IGNvZGVBY3Rpb24gPSBuZXcgQ29kZUFjdGlvbjtcbiIsImltcG9ydCB7TW9kZWxzfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xyXG5pbXBvcnQgXyBmcm9tIFwibG9kYXNoXCI7XHJcbmltcG9ydCB7U3ViamVjdCwgT2JzZXJ2YWJsZX0gZnJvbSBcInJ4anNcIjtcclxuaW1wb3J0IHtDb21wb3NpdGVEaXNwb3NhYmxlLCBJRGlzcG9zYWJsZX0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcclxuaW1wb3J0IHtPbW5pfSBmcm9tIFwiLi4vc2VydmVyL29tbmlcIjtcclxuaW1wb3J0ICogYXMgU3BhY2VQZW4gZnJvbSBcImF0b20tc3BhY2UtcGVuLXZpZXdzXCI7XHJcbmltcG9ydCB7YXBwbHlBbGxDaGFuZ2VzfSBmcm9tIFwiLi4vc2VydmljZXMvYXBwbHktY2hhbmdlc1wiO1xyXG5pbXBvcnQgY29kZUFjdGlvbnNWaWV3IGZyb20gXCIuLi92aWV3cy9jb2RlLWFjdGlvbnMtdmlld1wiO1xyXG5cclxuY2xhc3MgQ29kZUFjdGlvbiBpbXBsZW1lbnRzIElGZWF0dXJlIHtcclxuICAgIHByaXZhdGUgZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxuXHJcbiAgICBwcml2YXRlIHZpZXc6IFNwYWNlUGVuLlNlbGVjdExpc3RWaWV3O1xyXG5cclxuICAgIHB1YmxpYyBhY3RpdmF0ZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuYWRkVGV4dEVkaXRvckNvbW1hbmQoXCJvbW5pc2hhcnAtYXRvbTpnZXQtY29kZS1hY3Rpb25zXCIsICgpID0+IHtcclxuICAgICAgICAgICAgLy9zdG9yZSB0aGUgZWRpdG9yIHRoYXQgdGhpcyB3YXMgdHJpZ2dlcmVkIGJ5LlxyXG4gICAgICAgICAgICBjb25zdCBlZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKCk7XHJcbiAgICAgICAgICAgIHRoaXMuZ2V0Q29kZUFjdGlvbnNSZXF1ZXN0KGVkaXRvcilcclxuICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoKHtyZXF1ZXN0LCByZXNwb25zZX0pID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAvL3BvcCB1aSB0byB1c2VyLlxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudmlldyA9IGNvZGVBY3Rpb25zVmlldyh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW1zOiByZXNwb25zZS5Db2RlQWN0aW9ucyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlybWVkOiAoaXRlbSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFlZGl0b3IgfHwgZWRpdG9yLmlzRGVzdHJveWVkKCkpIHJldHVybjtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJ1bkNvZGVBY3Rpb25SZXF1ZXN0KGVkaXRvciwgcmVxdWVzdCwgaXRlbS5JZGVudGlmaWVyKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoKHJlc3ApID0+IGFwcGx5QWxsQ2hhbmdlcyhyZXNwLkNoYW5nZXMpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0sIGVkaXRvcik7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5zd2l0Y2hBY3RpdmVFZGl0b3IoKGVkaXRvciwgY2QpID0+IHtcclxuICAgICAgICAgICAgbGV0IHdvcmQ6IHN0cmluZywgbWFya2VyOiBBdG9tLk1hcmtlciwgc3Vic2NyaXB0aW9uOiBJRGlzcG9zYWJsZTtcclxuXHJcbiAgICAgICAgICAgIGNkLmFkZChPbW5pLmxpc3RlbmVyLmdldGNvZGVhY3Rpb25zXHJcbiAgICAgICAgICAgICAgICAuZmlsdGVyKHogPT4gei5yZXF1ZXN0LkZpbGVOYW1lID09PSBlZGl0b3IuZ2V0UGF0aCgpKVxyXG4gICAgICAgICAgICAgICAgLmZpbHRlcihjdHggPT4gY3R4LnJlc3BvbnNlLkNvZGVBY3Rpb25zLmxlbmd0aCA+IDApXHJcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKCh7cmVxdWVzdH0pID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobWFya2VyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcmtlci5kZXN0cm95KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcmtlciA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBjb25zdCByYW5nZSA9IFtbcmVxdWVzdC5MaW5lLCAwXSwgW3JlcXVlc3QuTGluZSwgMF1dO1xyXG4gICAgICAgICAgICAgICAgICAgIG1hcmtlciA9IGVkaXRvci5tYXJrQnVmZmVyUmFuZ2UocmFuZ2UpO1xyXG4gICAgICAgICAgICAgICAgICAgIGVkaXRvci5kZWNvcmF0ZU1hcmtlcihtYXJrZXIsIHsgdHlwZTogXCJsaW5lLW51bWJlclwiLCBjbGFzczogXCJxdWlja2ZpeFwiIH0pO1xyXG4gICAgICAgICAgICAgICAgfSkpO1xyXG4gICAgICAgICAgICBjb25zdCBtYWtlTGlnaHRidWxiUmVxdWVzdCA9IChwb3NpdGlvbjogVGV4dEJ1ZmZlci5Qb2ludCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKHN1YnNjcmlwdGlvbikgc3Vic2NyaXB0aW9uLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgICAgIGlmICghZWRpdG9yIHx8IGVkaXRvci5pc0Rlc3Ryb3llZCgpKSByZXR1cm47XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5nZXRDb2RlQWN0aW9uc1JlcXVlc3QoZWRpdG9yLCB0cnVlKVxyXG4gICAgICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoY3R4ID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qge3Jlc3BvbnNlfSA9IGN0eDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlLkNvZGVBY3Rpb25zLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtYXJrZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXJrZXIuZGVzdHJveSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hcmtlciA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgcm5nID0gW1twb3NpdGlvbi5yb3csIDBdLCBbcG9zaXRpb24ucm93LCAwXV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXJrZXIgPSBlZGl0b3IubWFya0J1ZmZlclJhbmdlKHJuZyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlZGl0b3IuZGVjb3JhdGVNYXJrZXIobWFya2VyLCB7IHR5cGU6IFwibGluZS1udW1iZXJcIiwgY2xhc3M6IFwicXVpY2tmaXhcIiB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgY29uc3QgdXBkYXRlID0gKHBvczogVGV4dEJ1ZmZlci5Qb2ludCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKHN1YnNjcmlwdGlvbikgc3Vic2NyaXB0aW9uLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgICAgIG1ha2VMaWdodGJ1bGJSZXF1ZXN0KHBvcyk7XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICBjb25zdCBvbkRpZENoYW5nZUN1cnNvclBvc2l0aW9uID0gbmV3IFN1YmplY3Q8eyBvbGRCdWZmZXJQb3NpdGlvbjogVGV4dEJ1ZmZlci5Qb2ludDsgb2xkU2NyZWVuUG9zaXRpb246IFRleHRCdWZmZXIuUG9pbnQ7IG5ld0J1ZmZlclBvc2l0aW9uOiBUZXh0QnVmZmVyLlBvaW50OyBuZXdTY3JlZW5Qb3NpdGlvbjogVGV4dEJ1ZmZlci5Qb2ludDsgdGV4dENoYW5nZWQ6IGJvb2xlYW47IGN1cnNvcjogQXRvbS5DdXJzb3I7IH0+KCk7XHJcbiAgICAgICAgICAgIGNkLmFkZChvbkRpZENoYW5nZUN1cnNvclBvc2l0aW9uKTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IG9uRGlkU3RvcENoYW5naW5nID0gbmV3IFN1YmplY3Q8YW55PigpO1xyXG5cclxuICAgICAgICAgICAgY2QuYWRkKE9ic2VydmFibGUuY29tYmluZUxhdGVzdChcclxuICAgICAgICAgICAgICAgIDxPYnNlcnZhYmxlPHsgb2xkQnVmZmVyUG9zaXRpb246IFRleHRCdWZmZXIuUG9pbnQ7IG9sZFNjcmVlblBvc2l0aW9uOiBUZXh0QnVmZmVyLlBvaW50OyBuZXdCdWZmZXJQb3NpdGlvbjogVGV4dEJ1ZmZlci5Qb2ludDsgbmV3U2NyZWVuUG9zaXRpb246IFRleHRCdWZmZXIuUG9pbnQ7IHRleHRDaGFuZ2VkOiBib29sZWFuOyBjdXJzb3I6IEF0b20uQ3Vyc29yOyB9Pj48YW55Pm9uRGlkQ2hhbmdlQ3Vyc29yUG9zaXRpb24sXHJcbiAgICAgICAgICAgICAgICA8T2JzZXJ2YWJsZTxhbnk+Pjxhbnk+b25EaWRTdG9wQ2hhbmdpbmcsXHJcbiAgICAgICAgICAgICAgICAoY3Vyc29yLCBjaGFuZ2luZykgPT4gY3Vyc29yKVxyXG4gICAgICAgICAgICAgICAgLmRlYm91bmNlVGltZSgxMDAwKVxyXG4gICAgICAgICAgICAgICAgLnN1YnNjcmliZShjdXJzb3IgPT4gdXBkYXRlKGN1cnNvci5uZXdCdWZmZXJQb3NpdGlvbikpKTtcclxuXHJcbiAgICAgICAgICAgIGNkLmFkZChlZGl0b3Iub25EaWRTdG9wQ2hhbmdpbmcoXy5kZWJvdW5jZSgoKSA9PiBvbkRpZFN0b3BDaGFuZ2luZy5uZXh0KHRydWUpLCAxMDAwKSkpO1xyXG4gICAgICAgICAgICBjZC5hZGQoZWRpdG9yLm9uRGlkQ2hhbmdlQ3Vyc29yUG9zaXRpb24oXy5kZWJvdW5jZSgoZTogYW55KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBvbGRQb3MgPSBlLm9sZEJ1ZmZlclBvc2l0aW9uO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgbmV3UG9zID0gZS5uZXdCdWZmZXJQb3NpdGlvbjtcclxuXHJcbiAgICAgICAgICAgICAgICBjb25zdCBuZXdXb3JkOiBzdHJpbmcgPSA8YW55PmVkaXRvci5nZXRXb3JkVW5kZXJDdXJzb3IoKTtcclxuICAgICAgICAgICAgICAgIGlmICh3b3JkICE9PSBuZXdXb3JkIHx8IG9sZFBvcy5yb3cgIT09IG5ld1Bvcy5yb3cpIHtcclxuICAgICAgICAgICAgICAgICAgICB3b3JkID0gbmV3V29yZDtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobWFya2VyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcmtlci5kZXN0cm95KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcmtlciA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmICghb25EaWRDaGFuZ2VDdXJzb3JQb3NpdGlvbi5pc1Vuc3Vic2NyaWJlZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIG9uRGlkQ2hhbmdlQ3Vyc29yUG9zaXRpb24ubmV4dChlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSwgMTAwMCkpKTtcclxuICAgICAgICB9KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBnZXRDb2RlQWN0aW9uc1JlcXVlc3QoZWRpdG9yOiBBdG9tLlRleHRFZGl0b3IsIHNpbGVudCA9IHRydWUpIHtcclxuICAgICAgICBpZiAoIWVkaXRvciB8fCBlZGl0b3IuaXNEZXN0cm95ZWQoKSkgcmV0dXJuIE9ic2VydmFibGUuZW1wdHk8eyByZXF1ZXN0OiBNb2RlbHMuVjIuR2V0Q29kZUFjdGlvbnNSZXF1ZXN0OyByZXNwb25zZTogTW9kZWxzLlYyLkdldENvZGVBY3Rpb25zUmVzcG9uc2UgfT4oKTtcclxuXHJcbiAgICAgICAgY29uc3QgcmVxdWVzdCA9IHRoaXMuZ2V0UmVxdWVzdChlZGl0b3IpO1xyXG4gICAgICAgIHJldHVybiBPbW5pLnJlcXVlc3QoZWRpdG9yLCBzb2x1dGlvbiA9PiBzb2x1dGlvbi5nZXRjb2RlYWN0aW9ucyhyZXF1ZXN0KSlcclxuICAgICAgICAgICAgLm1hcChyZXNwb25zZSA9PiAoeyByZXF1ZXN0LCByZXNwb25zZSB9KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBydW5Db2RlQWN0aW9uUmVxdWVzdChlZGl0b3I6IEF0b20uVGV4dEVkaXRvciwgZ2V0UmVxdWVzdDogTW9kZWxzLlYyLkdldENvZGVBY3Rpb25zUmVxdWVzdCwgY29kZUFjdGlvbjogc3RyaW5nKSB7XHJcbiAgICAgICAgaWYgKCFlZGl0b3IgfHwgZWRpdG9yLmlzRGVzdHJveWVkKCkpIHJldHVybiBPYnNlcnZhYmxlLmVtcHR5PE1vZGVscy5WMi5SdW5Db2RlQWN0aW9uUmVzcG9uc2U+KCk7XHJcblxyXG4gICAgICAgIGNvbnN0IHJlcXVlc3QgPSB0aGlzLmdldFJlcXVlc3QoZWRpdG9yLCBjb2RlQWN0aW9uKTtcclxuICAgICAgICByZXF1ZXN0LlNlbGVjdGlvbiA9IGdldFJlcXVlc3QuU2VsZWN0aW9uO1xyXG4gICAgICAgIHJldHVybiBPbW5pLnJlcXVlc3QoZWRpdG9yLCBzb2x1dGlvbiA9PiBzb2x1dGlvbi5ydW5jb2RlYWN0aW9uKHJlcXVlc3QpKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGdldFJlcXVlc3QoZWRpdG9yOiBBdG9tLlRleHRFZGl0b3IpOiBNb2RlbHMuVjIuR2V0Q29kZUFjdGlvbnNSZXF1ZXN0O1xyXG4gICAgcHJpdmF0ZSBnZXRSZXF1ZXN0KGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yLCBjb2RlQWN0aW9uOiBzdHJpbmcpOiBNb2RlbHMuVjIuUnVuQ29kZUFjdGlvblJlcXVlc3Q7XHJcbiAgICBwcml2YXRlIGdldFJlcXVlc3QoZWRpdG9yOiBBdG9tLlRleHRFZGl0b3IsIGNvZGVBY3Rpb24/OiBzdHJpbmcpIHtcclxuICAgICAgICBjb25zdCByYW5nZSA9IDxhbnk+ZWRpdG9yLmdldFNlbGVjdGVkQnVmZmVyUmFuZ2UoKTtcclxuICAgICAgICBjb25zdCByZXF1ZXN0OiBNb2RlbHMuVjIuUnVuQ29kZUFjdGlvblJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgIFdhbnRzVGV4dENoYW5nZXM6IHRydWUsXHJcbiAgICAgICAgICAgIFNlbGVjdGlvbjoge1xyXG4gICAgICAgICAgICAgICAgU3RhcnQ6IHtcclxuICAgICAgICAgICAgICAgICAgICBMaW5lOiByYW5nZS5zdGFydC5yb3csXHJcbiAgICAgICAgICAgICAgICAgICAgQ29sdW1uOiByYW5nZS5zdGFydC5jb2x1bW5cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBFbmQ6IHtcclxuICAgICAgICAgICAgICAgICAgICBMaW5lOiByYW5nZS5lbmQucm93LFxyXG4gICAgICAgICAgICAgICAgICAgIENvbHVtbjogcmFuZ2UuZW5kLmNvbHVtblxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgaWYgKGNvZGVBY3Rpb24gIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICByZXF1ZXN0LklkZW50aWZpZXIgPSBjb2RlQWN0aW9uO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHJlcXVlc3Q7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVxdWlyZWQgPSB0cnVlO1xyXG4gICAgcHVibGljIHRpdGxlID0gXCJDb2RlIEFjdGlvbnNcIjtcclxuICAgIHB1YmxpYyBkZXNjcmlwdGlvbiA9IFwiQWRkcyBjb2RlIGFjdGlvbiBzdXBwb3J0IHRvIG9tbmlzaGFycC1hdG9tLlwiO1xyXG59XHJcblxyXG5leHBvcnQgY29uc3QgY29kZUFjdGlvbiA9IG5ldyBDb2RlQWN0aW9uO1xyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
