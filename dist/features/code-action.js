'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.codeAction = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _rxjs = require('rxjs');

var _tsDisposables = require('ts-disposables');

var _omni = require('../server/omni');

var _applyChanges = require('../services/apply-changes');

var _codeActionsView = require('../views/code-actions-view');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var CodeAction = function () {
    function CodeAction() {
        _classCallCheck(this, CodeAction);

        this.required = true;
        this.title = 'Code Actions';
        this.description = 'Adds code action support to omnisharp-atom.';
    }

    _createClass(CodeAction, [{
        key: 'activate',
        value: function activate() {
            var _this = this;

            this.disposable = new _tsDisposables.CompositeDisposable();
            this.disposable.add(_omni.Omni.addTextEditorCommand('omnisharp-atom:get-code-actions', function () {
                var editor = atom.workspace.getActiveTextEditor();
                _this._getCodeActionsRequest(editor).subscribe(function (_ref) {
                    var request = _ref.request,
                        response = _ref.response;

                    _this.view = (0, _codeActionsView.factory)({
                        items: response.CodeActions,
                        confirmed: function confirmed(item) {
                            if (!editor || editor.isDestroyed()) {
                                return;
                            }
                            _this._runCodeActionRequest(editor, request, item.Identifier).subscribe(function (resp) {
                                return (0, _applyChanges.applyAllChanges)(resp.Changes);
                            });
                        }
                    }, editor);
                });
            }));
            this.disposable.add(_omni.Omni.switchActiveEditor(function (editor, cd) {
                var word = void 0;
                var marker = void 0;
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
                    editor.decorateMarker(marker, { type: 'line-number', class: 'quickfix' });
                }));
                var makeLightbulbRequest = function makeLightbulbRequest(position) {
                    if (!editor || editor.isDestroyed()) {
                        return;
                    }
                    _this._getCodeActionsRequest(editor, true).subscribe(function (ctx) {
                        var response = ctx.response;

                        if (response.CodeActions.length > 0) {
                            if (marker) {
                                marker.destroy();
                                marker = null;
                            }
                            var rng = [[position.row, 0], [position.row, 0]];
                            marker = editor.markBufferRange(rng);
                            editor.decorateMarker(marker, { type: 'line-number', class: 'quickfix' });
                        }
                    });
                };
                var update = function update(pos) {
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
                cd.add(editor.onDidStopChanging((0, _lodash.debounce)(function () {
                    return onDidStopChanging.next(true);
                }, 1000)));
                cd.add(editor.onDidChangeCursorPosition((0, _lodash.debounce)(function (e) {
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
                    if (!onDidChangeCursorPosition.closed) {
                        onDidChangeCursorPosition.next(e);
                    }
                }, 1000)));
            }));
        }
    }, {
        key: 'dispose',
        value: function dispose() {
            this.disposable.dispose();
        }
    }, {
        key: '_getCodeActionsRequest',
        value: function _getCodeActionsRequest(editor) {
            var silent = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

            if (!editor || editor.isDestroyed()) {
                return _rxjs.Observable.empty();
            }
            var request = this._getRequest(editor);
            return _omni.Omni.request(editor, function (solution) {
                return solution.getcodeactions(request);
            }).map(function (response) {
                return { request: request, response: response };
            });
        }
    }, {
        key: '_runCodeActionRequest',
        value: function _runCodeActionRequest(editor, getRequest, codeAction) {
            if (!editor || editor.isDestroyed()) {
                return _rxjs.Observable.empty();
            }
            var request = this._getRequest(editor, codeAction);
            request.Selection = getRequest.Selection;
            return _omni.Omni.request(editor, function (solution) {
                return solution.runcodeaction(request);
            });
        }
    }, {
        key: '_getRequest',
        value: function _getRequest(editor, codeAction) {
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
    }]);

    return CodeAction;
}();

var codeAction = exports.codeAction = new CodeAction();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9jb2RlLWFjdGlvbi50cyJdLCJuYW1lcyI6WyJDb2RlQWN0aW9uIiwicmVxdWlyZWQiLCJ0aXRsZSIsImRlc2NyaXB0aW9uIiwiZGlzcG9zYWJsZSIsImFkZCIsImFkZFRleHRFZGl0b3JDb21tYW5kIiwiZWRpdG9yIiwiYXRvbSIsIndvcmtzcGFjZSIsImdldEFjdGl2ZVRleHRFZGl0b3IiLCJfZ2V0Q29kZUFjdGlvbnNSZXF1ZXN0Iiwic3Vic2NyaWJlIiwicmVxdWVzdCIsInJlc3BvbnNlIiwidmlldyIsIml0ZW1zIiwiQ29kZUFjdGlvbnMiLCJjb25maXJtZWQiLCJpc0Rlc3Ryb3llZCIsIl9ydW5Db2RlQWN0aW9uUmVxdWVzdCIsIml0ZW0iLCJJZGVudGlmaWVyIiwicmVzcCIsIkNoYW5nZXMiLCJzd2l0Y2hBY3RpdmVFZGl0b3IiLCJjZCIsIndvcmQiLCJtYXJrZXIiLCJsaXN0ZW5lciIsImdldGNvZGVhY3Rpb25zIiwiZmlsdGVyIiwieiIsIkZpbGVOYW1lIiwiZ2V0UGF0aCIsImN0eCIsImxlbmd0aCIsImRlc3Ryb3kiLCJyYW5nZSIsIkxpbmUiLCJtYXJrQnVmZmVyUmFuZ2UiLCJkZWNvcmF0ZU1hcmtlciIsInR5cGUiLCJjbGFzcyIsIm1ha2VMaWdodGJ1bGJSZXF1ZXN0IiwicG9zaXRpb24iLCJybmciLCJyb3ciLCJ1cGRhdGUiLCJwb3MiLCJvbkRpZENoYW5nZUN1cnNvclBvc2l0aW9uIiwib25EaWRTdG9wQ2hhbmdpbmciLCJjb21iaW5lTGF0ZXN0IiwiY3Vyc29yIiwiY2hhbmdpbmciLCJkZWJvdW5jZVRpbWUiLCJuZXdCdWZmZXJQb3NpdGlvbiIsIm5leHQiLCJlIiwib2xkUG9zIiwib2xkQnVmZmVyUG9zaXRpb24iLCJuZXdQb3MiLCJuZXdXb3JkIiwiZ2V0V29yZFVuZGVyQ3Vyc29yIiwiY2xvc2VkIiwiZGlzcG9zZSIsInNpbGVudCIsImVtcHR5IiwiX2dldFJlcXVlc3QiLCJzb2x1dGlvbiIsIm1hcCIsImdldFJlcXVlc3QiLCJjb2RlQWN0aW9uIiwiU2VsZWN0aW9uIiwicnVuY29kZWFjdGlvbiIsImdldFNlbGVjdGVkQnVmZmVyUmFuZ2UiLCJXYW50c1RleHRDaGFuZ2VzIiwiU3RhcnQiLCJzdGFydCIsIkNvbHVtbiIsImNvbHVtbiIsIkVuZCIsImVuZCIsInVuZGVmaW5lZCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQ0E7O0FBRUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7SUFXQUEsVTtBQUFBLDBCQUFBO0FBQUE7O0FBQ1csYUFBQUMsUUFBQSxHQUFXLElBQVg7QUFDQSxhQUFBQyxLQUFBLEdBQVEsY0FBUjtBQUNBLGFBQUFDLFdBQUEsR0FBYyw2Q0FBZDtBQXFKVjs7OzttQ0FoSmtCO0FBQUE7O0FBQ1gsaUJBQUtDLFVBQUwsR0FBa0Isd0NBQWxCO0FBRUEsaUJBQUtBLFVBQUwsQ0FBZ0JDLEdBQWhCLENBQW9CLFdBQUtDLG9CQUFMLENBQTBCLGlDQUExQixFQUE2RCxZQUFBO0FBRTdFLG9CQUFNQyxTQUFTQyxLQUFLQyxTQUFMLENBQWVDLG1CQUFmLEVBQWY7QUFDQSxzQkFBS0Msc0JBQUwsQ0FBNEJKLE1BQTVCLEVBQ0tLLFNBREwsQ0FDZSxnQkFBc0I7QUFBQSx3QkFBbkJDLE9BQW1CLFFBQW5CQSxPQUFtQjtBQUFBLHdCQUFWQyxRQUFVLFFBQVZBLFFBQVU7O0FBRTdCLDBCQUFLQyxJQUFMLEdBQVksOEJBQVE7QUFDaEJDLCtCQUFPRixTQUFTRyxXQURBO0FBRWhCQyxtQ0FBVyx5QkFBSTtBQUNYLGdDQUFJLENBQUNYLE1BQUQsSUFBV0EsT0FBT1ksV0FBUCxFQUFmLEVBQXFDO0FBQ2pDO0FBQ0g7QUFFRCxrQ0FBS0MscUJBQUwsQ0FBMkJiLE1BQTNCLEVBQW1DTSxPQUFuQyxFQUE0Q1EsS0FBS0MsVUFBakQsRUFDS1YsU0FETCxDQUNlO0FBQUEsdUNBQVEsbUNBQWdCVyxLQUFLQyxPQUFyQixDQUFSO0FBQUEsNkJBRGY7QUFFSDtBQVRlLHFCQUFSLEVBVVRqQixNQVZTLENBQVo7QUFX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QXlCZ0UsVSxFQUE2Q0MsVSxFQUFrQjtBQUNsSCxnQkFBSSxDQUFDakUsTUFBRCxJQUFXQSxPQUFPWSxXQUFQLEVBQWYsRUFBcUM7QUFDakMsdUJBQU8saUJBQVdnRCxLQUFYLEVBQVA7QUFDSDtBQUVELGdCQUFNdEQsVUFBVSxLQUFLdUQsV0FBTCxDQUFpQjdELE1BQWpCLEVBQXlCaUUsVUFBekIsQ0FBaEI7QUFDQTNELG9CQUFRNEQsU0FBUixHQUFvQkYsV0FBV0UsU0FBL0I7QUFDQSxtQkFBTyxXQUFLNUQsT0FBTCxDQUFhTixNQUFiLEVBQXFCO0FBQUEsdUJBQVk4RCxTQUFTSyxhQUFULENBQXVCN0QsT0FBdkIsQ0FBWjtBQUFBLGFBQXJCLENBQVA7QUFDSDs7O29DQUltQk4sTSxFQUF5QmlFLFUsRUFBbUI7QUFDNUQsZ0JBQU1sQyxRQUFhL0IsT0FBT29FLHNCQUFQLEVBQW5CO0FBQ0EsZ0JBQU05RCxVQUEwQztBQUM1QytELGtDQUFrQixJQUQwQjtBQUU1Q0gsMkJBQVc7QUFDUEksMkJBQU87QUFDSHRDLDhCQUFNRCxNQUFNd0MsS0FBTixDQUFZL0IsR0FEZjtBQUVIZ0MsZ0NBQVF6QyxNQUFNd0MsS0FBTixDQUFZRTtBQUZqQixxQkFEQTtBQUtQQyx5QkFBSztBQUNEMUMsOEJBQU1ELE1BQU00QyxHQUFOLENBQVVuQyxHQURmO0FBRURnQyxnQ0FBUXpDLE1BQU00QyxHQUFOLENBQVVGO0FBRmpCO0FBTEU7QUFGaUMsYUFBaEQ7QUFjQSxnQkFBSVIsZUFBZVcsU0FBbkIsRUFBOEI7QUFDMUJ0RSx3QkFBUVMsVUFBUixHQUFxQmtELFVBQXJCO0FBQ0g7QUFFRCxtQkFBTzNELE9BQVA7QUFDSDs7Ozs7O0FBSUUsSUFBTTJELGtDQUFhLElBQUl4RSxVQUFKLEVBQW5CIiwiZmlsZSI6ImxpYi9mZWF0dXJlcy9jb2RlLWFjdGlvbi5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIFNwYWNlUGVuIGZyb20gJ2F0b20tc3BhY2UtcGVuLXZpZXdzJztcclxuaW1wb3J0IHsgZGVib3VuY2UgfSBmcm9tICdsb2Rhc2gnO1xyXG5pbXBvcnQgeyBNb2RlbHMgfSBmcm9tICdvbW5pc2hhcnAtY2xpZW50JztcclxuaW1wb3J0IHsgT2JzZXJ2YWJsZSwgU3ViamVjdCB9IGZyb20gJ3J4anMnO1xyXG5pbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlLCBJRGlzcG9zYWJsZSB9IGZyb20gJ3RzLWRpc3Bvc2FibGVzJztcclxuaW1wb3J0IHsgT21uaSB9IGZyb20gJy4uL3NlcnZlci9vbW5pJztcclxuaW1wb3J0IHsgYXBwbHlBbGxDaGFuZ2VzIH0gZnJvbSAnLi4vc2VydmljZXMvYXBwbHktY2hhbmdlcyc7XHJcbmltcG9ydCB7IGZhY3RvcnkgfSBmcm9tICcuLi92aWV3cy9jb2RlLWFjdGlvbnMtdmlldyc7XHJcblxyXG5pbnRlcmZhY2UgSU9uRGlkQ2hhbmdlQ3Vyc29yUG9zaXRpb25Db250ZXh0IHtcclxuICAgIG9sZEJ1ZmZlclBvc2l0aW9uOiBUZXh0QnVmZmVyLlBvaW50O1xyXG4gICAgb2xkU2NyZWVuUG9zaXRpb246IFRleHRCdWZmZXIuUG9pbnQ7XHJcbiAgICBuZXdCdWZmZXJQb3NpdGlvbjogVGV4dEJ1ZmZlci5Qb2ludDtcclxuICAgIG5ld1NjcmVlblBvc2l0aW9uOiBUZXh0QnVmZmVyLlBvaW50O1xyXG4gICAgdGV4dENoYW5nZWQ6IGJvb2xlYW47XHJcbiAgICBjdXJzb3I6IEF0b20uQ3Vyc29yO1xyXG59XHJcblxyXG5jbGFzcyBDb2RlQWN0aW9uIGltcGxlbWVudHMgSUZlYXR1cmUge1xyXG4gICAgcHVibGljIHJlcXVpcmVkID0gdHJ1ZTtcclxuICAgIHB1YmxpYyB0aXRsZSA9ICdDb2RlIEFjdGlvbnMnO1xyXG4gICAgcHVibGljIGRlc2NyaXB0aW9uID0gJ0FkZHMgY29kZSBhY3Rpb24gc3VwcG9ydCB0byBvbW5pc2hhcnAtYXRvbS4nO1xyXG5cclxuICAgIHByaXZhdGUgZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxuICAgIHByaXZhdGUgdmlldzogU3BhY2VQZW4uU2VsZWN0TGlzdFZpZXc7XHJcblxyXG4gICAgcHVibGljIGFjdGl2YXRlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5hZGRUZXh0RWRpdG9yQ29tbWFuZCgnb21uaXNoYXJwLWF0b206Z2V0LWNvZGUtYWN0aW9ucycsICgpID0+IHtcclxuICAgICAgICAgICAgLy9zdG9yZSB0aGUgZWRpdG9yIHRoYXQgdGhpcyB3YXMgdHJpZ2dlcmVkIGJ5LlxyXG4gICAgICAgICAgICBjb25zdCBlZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKCk7XHJcbiAgICAgICAgICAgIHRoaXMuX2dldENvZGVBY3Rpb25zUmVxdWVzdChlZGl0b3IpXHJcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKCh7IHJlcXVlc3QsIHJlc3BvbnNlIH0pID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAvL3BvcCB1aSB0byB1c2VyLlxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudmlldyA9IGZhY3Rvcnkoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVtczogcmVzcG9uc2UuQ29kZUFjdGlvbnMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpcm1lZDogaXRlbSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWVkaXRvciB8fCBlZGl0b3IuaXNEZXN0cm95ZWQoKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9ydW5Db2RlQWN0aW9uUmVxdWVzdChlZGl0b3IsIHJlcXVlc3QsIGl0ZW0uSWRlbnRpZmllcilcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKHJlc3AgPT4gYXBwbHlBbGxDaGFuZ2VzKHJlc3AuQ2hhbmdlcykpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSwgZWRpdG9yKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLnN3aXRjaEFjdGl2ZUVkaXRvcigoZWRpdG9yLCBjZCkgPT4ge1xyXG4gICAgICAgICAgICBsZXQgd29yZDogc3RyaW5nO1xyXG4gICAgICAgICAgICBsZXQgbWFya2VyOiBBdG9tLk1hcmtlcjtcclxuXHJcbiAgICAgICAgICAgIGNkLmFkZChPbW5pLmxpc3RlbmVyLmdldGNvZGVhY3Rpb25zXHJcbiAgICAgICAgICAgICAgICAuZmlsdGVyKHogPT4gei5yZXF1ZXN0LkZpbGVOYW1lID09PSBlZGl0b3IuZ2V0UGF0aCgpKVxyXG4gICAgICAgICAgICAgICAgLmZpbHRlcihjdHggPT4gY3R4LnJlc3BvbnNlLkNvZGVBY3Rpb25zLmxlbmd0aCA+IDApXHJcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKCh7IHJlcXVlc3QgfSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChtYXJrZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWFya2VyLmRlc3Ryb3koKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWFya2VyID0gbnVsbDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJhbmdlID0gW1tyZXF1ZXN0LkxpbmUsIDBdLCBbcmVxdWVzdC5MaW5lLCAwXV07XHJcbiAgICAgICAgICAgICAgICAgICAgbWFya2VyID0gZWRpdG9yLm1hcmtCdWZmZXJSYW5nZShyYW5nZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgZWRpdG9yLmRlY29yYXRlTWFya2VyKG1hcmtlciwgeyB0eXBlOiAnbGluZS1udW1iZXInLCBjbGFzczogJ3F1aWNrZml4JyB9KTtcclxuICAgICAgICAgICAgICAgIH0pKTtcclxuICAgICAgICAgICAgY29uc3QgbWFrZUxpZ2h0YnVsYlJlcXVlc3QgPSAocG9zaXRpb246IFRleHRCdWZmZXIuUG9pbnQpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmICghZWRpdG9yIHx8IGVkaXRvci5pc0Rlc3Ryb3llZCgpKSB7IHJldHVybjsgfVxyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMuX2dldENvZGVBY3Rpb25zUmVxdWVzdChlZGl0b3IsIHRydWUpXHJcbiAgICAgICAgICAgICAgICAgICAgLnN1YnNjcmliZShjdHggPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB7IHJlc3BvbnNlIH0gPSBjdHg7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZS5Db2RlQWN0aW9ucy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobWFya2VyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFya2VyLmRlc3Ryb3koKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXJrZXIgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJuZyA9IFtbcG9zaXRpb24ucm93LCAwXSwgW3Bvc2l0aW9uLnJvdywgMF1dO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFya2VyID0gZWRpdG9yLm1hcmtCdWZmZXJSYW5nZShybmcpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWRpdG9yLmRlY29yYXRlTWFya2VyKG1hcmtlciwgeyB0eXBlOiAnbGluZS1udW1iZXInLCBjbGFzczogJ3F1aWNrZml4JyB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgY29uc3QgdXBkYXRlID0gKHBvczogVGV4dEJ1ZmZlci5Qb2ludCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgbWFrZUxpZ2h0YnVsYlJlcXVlc3QocG9zKTtcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IG9uRGlkQ2hhbmdlQ3Vyc29yUG9zaXRpb24gPSBuZXcgU3ViamVjdDxJT25EaWRDaGFuZ2VDdXJzb3JQb3NpdGlvbkNvbnRleHQ+KCk7XHJcbiAgICAgICAgICAgIGNkLmFkZChvbkRpZENoYW5nZUN1cnNvclBvc2l0aW9uKTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IG9uRGlkU3RvcENoYW5naW5nID0gbmV3IFN1YmplY3Q8YW55PigpO1xyXG5cclxuICAgICAgICAgICAgY2QuYWRkKE9ic2VydmFibGUuY29tYmluZUxhdGVzdChcclxuICAgICAgICAgICAgICAgIDxPYnNlcnZhYmxlPElPbkRpZENoYW5nZUN1cnNvclBvc2l0aW9uQ29udGV4dD4+PGFueT5vbkRpZENoYW5nZUN1cnNvclBvc2l0aW9uLFxyXG4gICAgICAgICAgICAgICAgPE9ic2VydmFibGU8YW55Pj48YW55Pm9uRGlkU3RvcENoYW5naW5nLFxyXG4gICAgICAgICAgICAgICAgKGN1cnNvciwgY2hhbmdpbmcpID0+IGN1cnNvcilcclxuICAgICAgICAgICAgICAgIC5kZWJvdW5jZVRpbWUoMTAwMClcclxuICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoY3Vyc29yID0+IHVwZGF0ZShjdXJzb3IubmV3QnVmZmVyUG9zaXRpb24pKSk7XHJcblxyXG4gICAgICAgICAgICBjZC5hZGQoZWRpdG9yLm9uRGlkU3RvcENoYW5naW5nKGRlYm91bmNlKCgpID0+IG9uRGlkU3RvcENoYW5naW5nLm5leHQodHJ1ZSksIDEwMDApKSk7XHJcbiAgICAgICAgICAgIGNkLmFkZChlZGl0b3Iub25EaWRDaGFuZ2VDdXJzb3JQb3NpdGlvbihkZWJvdW5jZSgoZTogYW55KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBvbGRQb3MgPSBlLm9sZEJ1ZmZlclBvc2l0aW9uO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgbmV3UG9zID0gZS5uZXdCdWZmZXJQb3NpdGlvbjtcclxuXHJcbiAgICAgICAgICAgICAgICBjb25zdCBuZXdXb3JkOiBzdHJpbmcgPSA8YW55PmVkaXRvci5nZXRXb3JkVW5kZXJDdXJzb3IoKTtcclxuICAgICAgICAgICAgICAgIGlmICh3b3JkICE9PSBuZXdXb3JkIHx8IG9sZFBvcy5yb3cgIT09IG5ld1Bvcy5yb3cpIHtcclxuICAgICAgICAgICAgICAgICAgICB3b3JkID0gbmV3V29yZDtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobWFya2VyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcmtlci5kZXN0cm95KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcmtlciA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmICghb25EaWRDaGFuZ2VDdXJzb3JQb3NpdGlvbi5jbG9zZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICBvbkRpZENoYW5nZUN1cnNvclBvc2l0aW9uLm5leHQoZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sIDEwMDApKSk7XHJcbiAgICAgICAgfSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkaXNwb3NlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfZ2V0Q29kZUFjdGlvbnNSZXF1ZXN0KGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yLCBzaWxlbnQgPSB0cnVlKSB7XHJcbiAgICAgICAgaWYgKCFlZGl0b3IgfHwgZWRpdG9yLmlzRGVzdHJveWVkKCkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuZW1wdHk8eyByZXF1ZXN0OiBNb2RlbHMuVjIuR2V0Q29kZUFjdGlvbnNSZXF1ZXN0OyByZXNwb25zZTogTW9kZWxzLlYyLkdldENvZGVBY3Rpb25zUmVzcG9uc2UgfT4oKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHJlcXVlc3QgPSB0aGlzLl9nZXRSZXF1ZXN0KGVkaXRvcik7XHJcbiAgICAgICAgcmV0dXJuIE9tbmkucmVxdWVzdChlZGl0b3IsIHNvbHV0aW9uID0+IHNvbHV0aW9uLmdldGNvZGVhY3Rpb25zKHJlcXVlc3QpKVxyXG4gICAgICAgICAgICAubWFwKHJlc3BvbnNlID0+ICh7IHJlcXVlc3QsIHJlc3BvbnNlIH0pKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9ydW5Db2RlQWN0aW9uUmVxdWVzdChlZGl0b3I6IEF0b20uVGV4dEVkaXRvciwgZ2V0UmVxdWVzdDogTW9kZWxzLlYyLkdldENvZGVBY3Rpb25zUmVxdWVzdCwgY29kZUFjdGlvbjogc3RyaW5nKSB7XHJcbiAgICAgICAgaWYgKCFlZGl0b3IgfHwgZWRpdG9yLmlzRGVzdHJveWVkKCkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuZW1wdHk8TW9kZWxzLlYyLlJ1bkNvZGVBY3Rpb25SZXNwb25zZT4oKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHJlcXVlc3QgPSB0aGlzLl9nZXRSZXF1ZXN0KGVkaXRvciwgY29kZUFjdGlvbik7XHJcbiAgICAgICAgcmVxdWVzdC5TZWxlY3Rpb24gPSBnZXRSZXF1ZXN0LlNlbGVjdGlvbjtcclxuICAgICAgICByZXR1cm4gT21uaS5yZXF1ZXN0KGVkaXRvciwgc29sdXRpb24gPT4gc29sdXRpb24ucnVuY29kZWFjdGlvbihyZXF1ZXN0KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfZ2V0UmVxdWVzdChlZGl0b3I6IEF0b20uVGV4dEVkaXRvcik6IE1vZGVscy5WMi5HZXRDb2RlQWN0aW9uc1JlcXVlc3Q7XHJcbiAgICBwcml2YXRlIF9nZXRSZXF1ZXN0KGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yLCBjb2RlQWN0aW9uOiBzdHJpbmcpOiBNb2RlbHMuVjIuUnVuQ29kZUFjdGlvblJlcXVlc3Q7XHJcbiAgICBwcml2YXRlIF9nZXRSZXF1ZXN0KGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yLCBjb2RlQWN0aW9uPzogc3RyaW5nKSB7XHJcbiAgICAgICAgY29uc3QgcmFuZ2UgPSA8YW55PmVkaXRvci5nZXRTZWxlY3RlZEJ1ZmZlclJhbmdlKCk7XHJcbiAgICAgICAgY29uc3QgcmVxdWVzdDogTW9kZWxzLlYyLlJ1bkNvZGVBY3Rpb25SZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICBXYW50c1RleHRDaGFuZ2VzOiB0cnVlLFxyXG4gICAgICAgICAgICBTZWxlY3Rpb246IHtcclxuICAgICAgICAgICAgICAgIFN0YXJ0OiB7XHJcbiAgICAgICAgICAgICAgICAgICAgTGluZTogcmFuZ2Uuc3RhcnQucm93LFxyXG4gICAgICAgICAgICAgICAgICAgIENvbHVtbjogcmFuZ2Uuc3RhcnQuY29sdW1uXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgRW5kOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgTGluZTogcmFuZ2UuZW5kLnJvdyxcclxuICAgICAgICAgICAgICAgICAgICBDb2x1bW46IHJhbmdlLmVuZC5jb2x1bW5cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGlmIChjb2RlQWN0aW9uICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgcmVxdWVzdC5JZGVudGlmaWVyID0gY29kZUFjdGlvbjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXF1ZXN0O1xyXG4gICAgfVxyXG59XHJcblxyXG4vLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6ZXhwb3J0LW5hbWVcclxuZXhwb3J0IGNvbnN0IGNvZGVBY3Rpb24gPSBuZXcgQ29kZUFjdGlvbigpO1xyXG4iXX0=
