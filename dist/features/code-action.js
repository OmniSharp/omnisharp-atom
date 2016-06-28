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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9jb2RlLWFjdGlvbi5qcyIsImxpYi9mZWF0dXJlcy9jb2RlLWFjdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7OztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOzs7Ozs7OztJQ0lBO0FBQUEsMEJBQUE7OztBQWlKVyxhQUFBLFFBQUEsR0FBVyxJQUFYLENBakpYO0FBa0pXLGFBQUEsS0FBQSxHQUFRLGNBQVIsQ0FsSlg7QUFtSlcsYUFBQSxXQUFBLEdBQWMsNkNBQWQsQ0FuSlg7S0FBQTs7OzttQ0FLbUI7OztBQUNYLGlCQUFLLFVBQUwsR0FBa0IsMENBQWxCLENBRFc7QUFHWCxpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLFdBQUssb0JBQUwsQ0FBMEIsaUNBQTFCLEVBQTZELFlBQUE7QUFFN0Usb0JBQU0sU0FBUyxLQUFLLFNBQUwsQ0FBZSxtQkFBZixFQUFULENBRnVFO0FBRzdFLHNCQUFLLHFCQUFMLENBQTJCLE1BQTNCLEVBQ0ssU0FETCxDQUNlLGdCQUFvQjt3QkFBbEIsdUJBQWtCO3dCQUFULHlCQUFTOztBQUUzQiwwQkFBSyxJQUFMLEdBQVksK0JBQWdCO0FBQ3hCLCtCQUFPLFNBQVMsV0FBVDtBQUNQLG1DQUFXLG1CQUFDLElBQUQsRUFBSztBQUNaLGdDQUFJLENBQUMsTUFBRCxJQUFXLE9BQU8sV0FBUCxFQUFYLEVBQWlDLE9BQXJDO0FBRUEsa0NBQUssb0JBQUwsQ0FBMEIsTUFBMUIsRUFBa0MsT0FBbEMsRUFBMkMsS0FBSyxVQUFMLENBQTNDLENBQ0ssU0FETCxDQUNlLFVBQUMsSUFBRDt1Q0FBVSxtQ0FBZ0IsS0FBSyxPQUFMOzZCQUExQixDQURmLENBSFk7eUJBQUw7cUJBRkgsRUFRVCxNQVJTLENBQVosQ0FGMkI7aUJBQXBCLENBRGYsQ0FINkU7YUFBQSxDQUFqRixFQUhXO0FBcUJYLGlCQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsV0FBSyxrQkFBTCxDQUF3QixVQUFDLE1BQUQsRUFBUyxFQUFULEVBQVc7QUFDbkQsb0JBQUksYUFBSjtvQkFBa0IsZUFBbEI7b0JBQXVDLHFCQUF2QyxDQURtRDtBQUduRCxtQkFBRyxHQUFILENBQU8sV0FBSyxRQUFMLENBQWMsY0FBZCxDQUNGLE1BREUsQ0FDSzsyQkFBSyxFQUFFLE9BQUYsQ0FBVSxRQUFWLEtBQXVCLE9BQU8sT0FBUCxFQUF2QjtpQkFBTCxDQURMLENBRUYsTUFGRSxDQUVLOzJCQUFPLElBQUksUUFBSixDQUFhLFdBQWIsQ0FBeUIsTUFBekIsR0FBa0MsQ0FBbEM7aUJBQVAsQ0FGTCxDQUdGLFNBSEUsQ0FHUSxpQkFBVTt3QkFBUix3QkFBUTs7QUFDakIsd0JBQUksTUFBSixFQUFZO0FBQ1IsK0JBQU8sT0FBUCxHQURRO0FBRVIsaUNBQVMsSUFBVCxDQUZRO3FCQUFaO0FBS0Esd0JBQU0sUUFBUSxDQUFDLENBQUMsUUFBUSxJQUFSLEVBQWMsQ0FBZixDQUFELEVBQW9CLENBQUMsUUFBUSxJQUFSLEVBQWMsQ0FBZixDQUFwQixDQUFSLENBTlc7QUFPakIsNkJBQVMsT0FBTyxlQUFQLENBQXVCLEtBQXZCLENBQVQsQ0FQaUI7QUFRakIsMkJBQU8sY0FBUCxDQUFzQixNQUF0QixFQUE4QixFQUFFLE1BQU0sYUFBTixFQUFxQixPQUFPLFVBQVAsRUFBckQsRUFSaUI7aUJBQVYsQ0FIZixFQUhtRDtBQWdCbkQsb0JBQU0sdUJBQXVCLFNBQXZCLG9CQUF1QixDQUFDLFFBQUQsRUFBMkI7QUFDcEQsd0JBQUksWUFBSixFQUFrQixhQUFhLE9BQWIsR0FBbEI7QUFDQSx3QkFBSSxDQUFDLE1BQUQsSUFBVyxPQUFPLFdBQVAsRUFBWCxFQUFpQyxPQUFyQztBQUVBLDBCQUFLLHFCQUFMLENBQTJCLE1BQTNCLEVBQW1DLElBQW5DLEVBQ0ssU0FETCxDQUNlLGVBQUc7NEJBQ0gsV0FBWSxJQUFaLFNBREc7O0FBRVYsNEJBQUksU0FBUyxXQUFULENBQXFCLE1BQXJCLEdBQThCLENBQTlCLEVBQWlDO0FBQ2pDLGdDQUFJLE1BQUosRUFBWTtBQUNSLHVDQUFPLE9BQVAsR0FEUTtBQUVSLHlDQUFTLElBQVQsQ0FGUTs2QkFBWjtBQUtBLGdDQUFNLE1BQU0sQ0FBQyxDQUFDLFNBQVMsR0FBVCxFQUFjLENBQWYsQ0FBRCxFQUFvQixDQUFDLFNBQVMsR0FBVCxFQUFjLENBQWYsQ0FBcEIsQ0FBTixDQU4yQjtBQU9qQyxxQ0FBUyxPQUFPLGVBQVAsQ0FBdUIsR0FBdkIsQ0FBVCxDQVBpQztBQVFqQyxtQ0FBTyxjQUFQLENBQXNCLE1BQXRCLEVBQThCLEVBQUUsTUFBTSxhQUFOLEVBQXFCLE9BQU8sVUFBUCxFQUFyRCxFQVJpQzt5QkFBckM7cUJBRk8sQ0FEZixDQUpvRDtpQkFBM0IsQ0FoQnNCO0FBb0NuRCxvQkFBTSxTQUFTLFNBQVQsTUFBUyxDQUFDLEdBQUQsRUFBc0I7QUFDakMsd0JBQUksWUFBSixFQUFrQixhQUFhLE9BQWIsR0FBbEI7QUFDQSx5Q0FBcUIsR0FBckIsRUFGaUM7aUJBQXRCLENBcENvQztBQXlDbkQsb0JBQU0sNEJBQTRCLG1CQUE1QixDQXpDNkM7QUEwQ25ELG1CQUFHLEdBQUgsQ0FBTyx5QkFBUCxFQTFDbUQ7QUE0Q25ELG9CQUFNLG9CQUFvQixtQkFBcEIsQ0E1QzZDO0FBOENuRCxtQkFBRyxHQUFILENBQU8saUJBQVcsYUFBWCxDQUNrTix5QkFEbE4sRUFFbUIsaUJBRm5CLEVBR0gsVUFBQyxNQUFELEVBQVMsUUFBVDsyQkFBc0I7aUJBQXRCLENBSEcsQ0FJRixZQUpFLENBSVcsSUFKWCxFQUtGLFNBTEUsQ0FLUTsyQkFBVSxPQUFPLE9BQU8saUJBQVA7aUJBQWpCLENBTGYsRUE5Q21EO0FBcURuRCxtQkFBRyxHQUFILENBQU8sT0FBTyxpQkFBUCxDQUF5QixpQkFBRSxRQUFGLENBQVc7MkJBQU0sa0JBQWtCLElBQWxCLENBQXVCLElBQXZCO2lCQUFOLEVBQW9DLElBQS9DLENBQXpCLENBQVAsRUFyRG1EO0FBc0RuRCxtQkFBRyxHQUFILENBQU8sT0FBTyx5QkFBUCxDQUFpQyxpQkFBRSxRQUFGLENBQVcsVUFBQyxDQUFELEVBQU87QUFDdEQsd0JBQU0sU0FBUyxFQUFFLGlCQUFGLENBRHVDO0FBRXRELHdCQUFNLFNBQVMsRUFBRSxpQkFBRixDQUZ1QztBQUl0RCx3QkFBTSxVQUF1QixPQUFPLGtCQUFQLEVBQXZCLENBSmdEO0FBS3RELHdCQUFJLFNBQVMsT0FBVCxJQUFvQixPQUFPLEdBQVAsS0FBZSxPQUFPLEdBQVAsRUFBWTtBQUMvQywrQkFBTyxPQUFQLENBRCtDO0FBRS9DLDRCQUFJLE1BQUosRUFBWTtBQUNSLG1DQUFPLE9BQVAsR0FEUTtBQUVSLHFDQUFTLElBQVQsQ0FGUTt5QkFBWjtxQkFGSjtBQVFBLHdCQUFJLENBQUMsMEJBQTBCLGNBQTFCLEVBQTBDO0FBQzNDLGtEQUEwQixJQUExQixDQUErQixDQUEvQixFQUQyQztxQkFBL0M7aUJBYitDLEVBZ0JoRCxJQWhCcUMsQ0FBakMsQ0FBUCxFQXREbUQ7YUFBWCxDQUE1QyxFQXJCVzs7Ozs4Q0ErRmUsUUFBc0M7Z0JBQWIsK0RBQVMsb0JBQUk7O0FBQ2hFLGdCQUFJLENBQUMsTUFBRCxJQUFXLE9BQU8sV0FBUCxFQUFYLEVBQWlDLE9BQU8saUJBQVcsS0FBWCxFQUFQLENBQXJDO0FBRUEsZ0JBQU0sVUFBVSxLQUFLLFVBQUwsQ0FBZ0IsTUFBaEIsQ0FBVixDQUgwRDtBQUloRSxtQkFBTyxXQUFLLE9BQUwsQ0FBYSxNQUFiLEVBQXFCO3VCQUFZLFNBQVMsY0FBVCxDQUF3QixPQUF4QjthQUFaLENBQXJCLENBQ0YsR0FERSxDQUNFO3VCQUFhLEVBQUUsZ0JBQUYsRUFBVyxrQkFBWDthQUFiLENBRFQsQ0FKZ0U7Ozs7NkNBUXZDLFFBQXlCLFlBQTZDLFlBQWtCO0FBQ2pILGdCQUFJLENBQUMsTUFBRCxJQUFXLE9BQU8sV0FBUCxFQUFYLEVBQWlDLE9BQU8saUJBQVcsS0FBWCxFQUFQLENBQXJDO0FBRUEsZ0JBQU0sVUFBVSxLQUFLLFVBQUwsQ0FBZ0IsTUFBaEIsRUFBd0IsVUFBeEIsQ0FBVixDQUgyRztBQUlqSCxvQkFBUSxTQUFSLEdBQW9CLFdBQVcsU0FBWCxDQUo2RjtBQUtqSCxtQkFBTyxXQUFLLE9BQUwsQ0FBYSxNQUFiLEVBQXFCO3VCQUFZLFNBQVMsYUFBVCxDQUF1QixPQUF2QjthQUFaLENBQTVCLENBTGlIOzs7O21DQVVsRyxRQUF5QixZQUFtQjtBQUMzRCxnQkFBTSxRQUFhLE9BQU8sc0JBQVAsRUFBYixDQURxRDtBQUUzRCxnQkFBTSxVQUEwQztBQUM1QyxrQ0FBa0IsSUFBbEI7QUFDQSwyQkFBVztBQUNQLDJCQUFPO0FBQ0gsOEJBQU0sTUFBTSxLQUFOLENBQVksR0FBWjtBQUNOLGdDQUFRLE1BQU0sS0FBTixDQUFZLE1BQVo7cUJBRlo7QUFJQSx5QkFBSztBQUNELDhCQUFNLE1BQU0sR0FBTixDQUFVLEdBQVY7QUFDTixnQ0FBUSxNQUFNLEdBQU4sQ0FBVSxNQUFWO3FCQUZaO2lCQUxKO2FBRkUsQ0FGcUQ7QUFnQjNELGdCQUFJLGVBQWUsU0FBZixFQUEwQjtBQUMxQix3QkFBUSxVQUFSLEdBQXFCLFVBQXJCLENBRDBCO2FBQTlCO0FBSUEsbUJBQU8sT0FBUCxDQXBCMkQ7Ozs7a0NBdUJqRDtBQUNWLGlCQUFLLFVBQUwsQ0FBZ0IsT0FBaEIsR0FEVTs7Ozs7OztBQVNYLElBQU0sa0NBQWEsSUFBSSxVQUFKLEVBQWIiLCJmaWxlIjoibGliL2ZlYXR1cmVzL2NvZGUtYWN0aW9uLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xuaW1wb3J0IHsgU3ViamVjdCwgT2JzZXJ2YWJsZSB9IGZyb20gXCJyeGpzXCI7XG5pbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlIH0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcbmltcG9ydCB7IE9tbmkgfSBmcm9tIFwiLi4vc2VydmVyL29tbmlcIjtcbmltcG9ydCB7IGFwcGx5QWxsQ2hhbmdlcyB9IGZyb20gXCIuLi9zZXJ2aWNlcy9hcHBseS1jaGFuZ2VzXCI7XG5pbXBvcnQgY29kZUFjdGlvbnNWaWV3IGZyb20gXCIuLi92aWV3cy9jb2RlLWFjdGlvbnMtdmlld1wiO1xuY2xhc3MgQ29kZUFjdGlvbiB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMucmVxdWlyZWQgPSB0cnVlO1xuICAgICAgICB0aGlzLnRpdGxlID0gXCJDb2RlIEFjdGlvbnNcIjtcbiAgICAgICAgdGhpcy5kZXNjcmlwdGlvbiA9IFwiQWRkcyBjb2RlIGFjdGlvbiBzdXBwb3J0IHRvIG9tbmlzaGFycC1hdG9tLlwiO1xuICAgIH1cbiAgICBhY3RpdmF0ZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmFkZFRleHRFZGl0b3JDb21tYW5kKFwib21uaXNoYXJwLWF0b206Z2V0LWNvZGUtYWN0aW9uc1wiLCAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBlZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKCk7XG4gICAgICAgICAgICB0aGlzLmdldENvZGVBY3Rpb25zUmVxdWVzdChlZGl0b3IpXG4gICAgICAgICAgICAgICAgLnN1YnNjcmliZSgoeyByZXF1ZXN0LCByZXNwb25zZSB9KSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy52aWV3ID0gY29kZUFjdGlvbnNWaWV3KHtcbiAgICAgICAgICAgICAgICAgICAgaXRlbXM6IHJlc3BvbnNlLkNvZGVBY3Rpb25zLFxuICAgICAgICAgICAgICAgICAgICBjb25maXJtZWQ6IChpdGVtKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWVkaXRvciB8fCBlZGl0b3IuaXNEZXN0cm95ZWQoKSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJ1bkNvZGVBY3Rpb25SZXF1ZXN0KGVkaXRvciwgcmVxdWVzdCwgaXRlbS5JZGVudGlmaWVyKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoKHJlc3ApID0+IGFwcGx5QWxsQ2hhbmdlcyhyZXNwLkNoYW5nZXMpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sIGVkaXRvcik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuc3dpdGNoQWN0aXZlRWRpdG9yKChlZGl0b3IsIGNkKSA9PiB7XG4gICAgICAgICAgICBsZXQgd29yZCwgbWFya2VyLCBzdWJzY3JpcHRpb247XG4gICAgICAgICAgICBjZC5hZGQoT21uaS5saXN0ZW5lci5nZXRjb2RlYWN0aW9uc1xuICAgICAgICAgICAgICAgIC5maWx0ZXIoeiA9PiB6LnJlcXVlc3QuRmlsZU5hbWUgPT09IGVkaXRvci5nZXRQYXRoKCkpXG4gICAgICAgICAgICAgICAgLmZpbHRlcihjdHggPT4gY3R4LnJlc3BvbnNlLkNvZGVBY3Rpb25zLmxlbmd0aCA+IDApXG4gICAgICAgICAgICAgICAgLnN1YnNjcmliZSgoeyByZXF1ZXN0IH0pID0+IHtcbiAgICAgICAgICAgICAgICBpZiAobWFya2VyKSB7XG4gICAgICAgICAgICAgICAgICAgIG1hcmtlci5kZXN0cm95KCk7XG4gICAgICAgICAgICAgICAgICAgIG1hcmtlciA9IG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IHJhbmdlID0gW1tyZXF1ZXN0LkxpbmUsIDBdLCBbcmVxdWVzdC5MaW5lLCAwXV07XG4gICAgICAgICAgICAgICAgbWFya2VyID0gZWRpdG9yLm1hcmtCdWZmZXJSYW5nZShyYW5nZSk7XG4gICAgICAgICAgICAgICAgZWRpdG9yLmRlY29yYXRlTWFya2VyKG1hcmtlciwgeyB0eXBlOiBcImxpbmUtbnVtYmVyXCIsIGNsYXNzOiBcInF1aWNrZml4XCIgfSk7XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICBjb25zdCBtYWtlTGlnaHRidWxiUmVxdWVzdCA9IChwb3NpdGlvbikgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChzdWJzY3JpcHRpb24pXG4gICAgICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbi5kaXNwb3NlKCk7XG4gICAgICAgICAgICAgICAgaWYgKCFlZGl0b3IgfHwgZWRpdG9yLmlzRGVzdHJveWVkKCkpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB0aGlzLmdldENvZGVBY3Rpb25zUmVxdWVzdChlZGl0b3IsIHRydWUpXG4gICAgICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoY3R4ID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgeyByZXNwb25zZSB9ID0gY3R4O1xuICAgICAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2UuQ29kZUFjdGlvbnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1hcmtlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hcmtlci5kZXN0cm95KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFya2VyID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJuZyA9IFtbcG9zaXRpb24ucm93LCAwXSwgW3Bvc2l0aW9uLnJvdywgMF1dO1xuICAgICAgICAgICAgICAgICAgICAgICAgbWFya2VyID0gZWRpdG9yLm1hcmtCdWZmZXJSYW5nZShybmcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZWRpdG9yLmRlY29yYXRlTWFya2VyKG1hcmtlciwgeyB0eXBlOiBcImxpbmUtbnVtYmVyXCIsIGNsYXNzOiBcInF1aWNrZml4XCIgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBjb25zdCB1cGRhdGUgPSAocG9zKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHN1YnNjcmlwdGlvbilcbiAgICAgICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9uLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgICAgICBtYWtlTGlnaHRidWxiUmVxdWVzdChwb3MpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGNvbnN0IG9uRGlkQ2hhbmdlQ3Vyc29yUG9zaXRpb24gPSBuZXcgU3ViamVjdCgpO1xuICAgICAgICAgICAgY2QuYWRkKG9uRGlkQ2hhbmdlQ3Vyc29yUG9zaXRpb24pO1xuICAgICAgICAgICAgY29uc3Qgb25EaWRTdG9wQ2hhbmdpbmcgPSBuZXcgU3ViamVjdCgpO1xuICAgICAgICAgICAgY2QuYWRkKE9ic2VydmFibGUuY29tYmluZUxhdGVzdChvbkRpZENoYW5nZUN1cnNvclBvc2l0aW9uLCBvbkRpZFN0b3BDaGFuZ2luZywgKGN1cnNvciwgY2hhbmdpbmcpID0+IGN1cnNvcilcbiAgICAgICAgICAgICAgICAuZGVib3VuY2VUaW1lKDEwMDApXG4gICAgICAgICAgICAgICAgLnN1YnNjcmliZShjdXJzb3IgPT4gdXBkYXRlKGN1cnNvci5uZXdCdWZmZXJQb3NpdGlvbikpKTtcbiAgICAgICAgICAgIGNkLmFkZChlZGl0b3Iub25EaWRTdG9wQ2hhbmdpbmcoXy5kZWJvdW5jZSgoKSA9PiBvbkRpZFN0b3BDaGFuZ2luZy5uZXh0KHRydWUpLCAxMDAwKSkpO1xuICAgICAgICAgICAgY2QuYWRkKGVkaXRvci5vbkRpZENoYW5nZUN1cnNvclBvc2l0aW9uKF8uZGVib3VuY2UoKGUpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBvbGRQb3MgPSBlLm9sZEJ1ZmZlclBvc2l0aW9uO1xuICAgICAgICAgICAgICAgIGNvbnN0IG5ld1BvcyA9IGUubmV3QnVmZmVyUG9zaXRpb247XG4gICAgICAgICAgICAgICAgY29uc3QgbmV3V29yZCA9IGVkaXRvci5nZXRXb3JkVW5kZXJDdXJzb3IoKTtcbiAgICAgICAgICAgICAgICBpZiAod29yZCAhPT0gbmV3V29yZCB8fCBvbGRQb3Mucm93ICE9PSBuZXdQb3Mucm93KSB7XG4gICAgICAgICAgICAgICAgICAgIHdvcmQgPSBuZXdXb3JkO1xuICAgICAgICAgICAgICAgICAgICBpZiAobWFya2VyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXJrZXIuZGVzdHJveSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbWFya2VyID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIW9uRGlkQ2hhbmdlQ3Vyc29yUG9zaXRpb24uaXNVbnN1YnNjcmliZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgb25EaWRDaGFuZ2VDdXJzb3JQb3NpdGlvbi5uZXh0KGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIDEwMDApKSk7XG4gICAgICAgIH0pKTtcbiAgICB9XG4gICAgZ2V0Q29kZUFjdGlvbnNSZXF1ZXN0KGVkaXRvciwgc2lsZW50ID0gdHJ1ZSkge1xuICAgICAgICBpZiAoIWVkaXRvciB8fCBlZGl0b3IuaXNEZXN0cm95ZWQoKSlcbiAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmVtcHR5KCk7XG4gICAgICAgIGNvbnN0IHJlcXVlc3QgPSB0aGlzLmdldFJlcXVlc3QoZWRpdG9yKTtcbiAgICAgICAgcmV0dXJuIE9tbmkucmVxdWVzdChlZGl0b3IsIHNvbHV0aW9uID0+IHNvbHV0aW9uLmdldGNvZGVhY3Rpb25zKHJlcXVlc3QpKVxuICAgICAgICAgICAgLm1hcChyZXNwb25zZSA9PiAoeyByZXF1ZXN0LCByZXNwb25zZSB9KSk7XG4gICAgfVxuICAgIHJ1bkNvZGVBY3Rpb25SZXF1ZXN0KGVkaXRvciwgZ2V0UmVxdWVzdCwgY29kZUFjdGlvbikge1xuICAgICAgICBpZiAoIWVkaXRvciB8fCBlZGl0b3IuaXNEZXN0cm95ZWQoKSlcbiAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmVtcHR5KCk7XG4gICAgICAgIGNvbnN0IHJlcXVlc3QgPSB0aGlzLmdldFJlcXVlc3QoZWRpdG9yLCBjb2RlQWN0aW9uKTtcbiAgICAgICAgcmVxdWVzdC5TZWxlY3Rpb24gPSBnZXRSZXF1ZXN0LlNlbGVjdGlvbjtcbiAgICAgICAgcmV0dXJuIE9tbmkucmVxdWVzdChlZGl0b3IsIHNvbHV0aW9uID0+IHNvbHV0aW9uLnJ1bmNvZGVhY3Rpb24ocmVxdWVzdCkpO1xuICAgIH1cbiAgICBnZXRSZXF1ZXN0KGVkaXRvciwgY29kZUFjdGlvbikge1xuICAgICAgICBjb25zdCByYW5nZSA9IGVkaXRvci5nZXRTZWxlY3RlZEJ1ZmZlclJhbmdlKCk7XG4gICAgICAgIGNvbnN0IHJlcXVlc3QgPSB7XG4gICAgICAgICAgICBXYW50c1RleHRDaGFuZ2VzOiB0cnVlLFxuICAgICAgICAgICAgU2VsZWN0aW9uOiB7XG4gICAgICAgICAgICAgICAgU3RhcnQ6IHtcbiAgICAgICAgICAgICAgICAgICAgTGluZTogcmFuZ2Uuc3RhcnQucm93LFxuICAgICAgICAgICAgICAgICAgICBDb2x1bW46IHJhbmdlLnN0YXJ0LmNvbHVtblxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgRW5kOiB7XG4gICAgICAgICAgICAgICAgICAgIExpbmU6IHJhbmdlLmVuZC5yb3csXG4gICAgICAgICAgICAgICAgICAgIENvbHVtbjogcmFuZ2UuZW5kLmNvbHVtblxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgaWYgKGNvZGVBY3Rpb24gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmVxdWVzdC5JZGVudGlmaWVyID0gY29kZUFjdGlvbjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVxdWVzdDtcbiAgICB9XG4gICAgZGlzcG9zZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICB9XG59XG5leHBvcnQgY29uc3QgY29kZUFjdGlvbiA9IG5ldyBDb2RlQWN0aW9uO1xuIiwiaW1wb3J0IHtNb2RlbHN9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XHJcbmltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcclxuaW1wb3J0IHtTdWJqZWN0LCBPYnNlcnZhYmxlfSBmcm9tIFwicnhqc1wiO1xyXG5pbXBvcnQge0NvbXBvc2l0ZURpc3Bvc2FibGUsIElEaXNwb3NhYmxlfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xyXG5pbXBvcnQge09tbml9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xyXG5pbXBvcnQgKiBhcyBTcGFjZVBlbiBmcm9tIFwiYXRvbS1zcGFjZS1wZW4tdmlld3NcIjtcclxuaW1wb3J0IHthcHBseUFsbENoYW5nZXN9IGZyb20gXCIuLi9zZXJ2aWNlcy9hcHBseS1jaGFuZ2VzXCI7XHJcbmltcG9ydCBjb2RlQWN0aW9uc1ZpZXcgZnJvbSBcIi4uL3ZpZXdzL2NvZGUtYWN0aW9ucy12aWV3XCI7XHJcblxyXG5jbGFzcyBDb2RlQWN0aW9uIGltcGxlbWVudHMgSUZlYXR1cmUge1xyXG4gICAgcHJpdmF0ZSBkaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xyXG5cclxuICAgIHByaXZhdGUgdmlldzogU3BhY2VQZW4uU2VsZWN0TGlzdFZpZXc7XHJcblxyXG4gICAgcHVibGljIGFjdGl2YXRlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5hZGRUZXh0RWRpdG9yQ29tbWFuZChcIm9tbmlzaGFycC1hdG9tOmdldC1jb2RlLWFjdGlvbnNcIiwgKCkgPT4ge1xyXG4gICAgICAgICAgICAvL3N0b3JlIHRoZSBlZGl0b3IgdGhhdCB0aGlzIHdhcyB0cmlnZ2VyZWQgYnkuXHJcbiAgICAgICAgICAgIGNvbnN0IGVkaXRvciA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKTtcclxuICAgICAgICAgICAgdGhpcy5nZXRDb2RlQWN0aW9uc1JlcXVlc3QoZWRpdG9yKVxyXG4gICAgICAgICAgICAgICAgLnN1YnNjcmliZSgoe3JlcXVlc3QsIHJlc3BvbnNlfSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vcG9wIHVpIHRvIHVzZXIuXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy52aWV3ID0gY29kZUFjdGlvbnNWaWV3KHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbXM6IHJlc3BvbnNlLkNvZGVBY3Rpb25zLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25maXJtZWQ6IChpdGVtKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWVkaXRvciB8fCBlZGl0b3IuaXNEZXN0cm95ZWQoKSkgcmV0dXJuO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucnVuQ29kZUFjdGlvblJlcXVlc3QoZWRpdG9yLCByZXF1ZXN0LCBpdGVtLklkZW50aWZpZXIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnN1YnNjcmliZSgocmVzcCkgPT4gYXBwbHlBbGxDaGFuZ2VzKHJlc3AuQ2hhbmdlcykpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSwgZWRpdG9yKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLnN3aXRjaEFjdGl2ZUVkaXRvcigoZWRpdG9yLCBjZCkgPT4ge1xyXG4gICAgICAgICAgICBsZXQgd29yZDogc3RyaW5nLCBtYXJrZXI6IEF0b20uTWFya2VyLCBzdWJzY3JpcHRpb246IElEaXNwb3NhYmxlO1xyXG5cclxuICAgICAgICAgICAgY2QuYWRkKE9tbmkubGlzdGVuZXIuZ2V0Y29kZWFjdGlvbnNcclxuICAgICAgICAgICAgICAgIC5maWx0ZXIoeiA9PiB6LnJlcXVlc3QuRmlsZU5hbWUgPT09IGVkaXRvci5nZXRQYXRoKCkpXHJcbiAgICAgICAgICAgICAgICAuZmlsdGVyKGN0eCA9PiBjdHgucmVzcG9uc2UuQ29kZUFjdGlvbnMubGVuZ3RoID4gMClcclxuICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoKHtyZXF1ZXN0fSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChtYXJrZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWFya2VyLmRlc3Ryb3koKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWFya2VyID0gbnVsbDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJhbmdlID0gW1tyZXF1ZXN0LkxpbmUsIDBdLCBbcmVxdWVzdC5MaW5lLCAwXV07XHJcbiAgICAgICAgICAgICAgICAgICAgbWFya2VyID0gZWRpdG9yLm1hcmtCdWZmZXJSYW5nZShyYW5nZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgZWRpdG9yLmRlY29yYXRlTWFya2VyKG1hcmtlciwgeyB0eXBlOiBcImxpbmUtbnVtYmVyXCIsIGNsYXNzOiBcInF1aWNrZml4XCIgfSk7XHJcbiAgICAgICAgICAgICAgICB9KSk7XHJcbiAgICAgICAgICAgIGNvbnN0IG1ha2VMaWdodGJ1bGJSZXF1ZXN0ID0gKHBvc2l0aW9uOiBUZXh0QnVmZmVyLlBvaW50KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoc3Vic2NyaXB0aW9uKSBzdWJzY3JpcHRpb24uZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFlZGl0b3IgfHwgZWRpdG9yLmlzRGVzdHJveWVkKCkpIHJldHVybjtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLmdldENvZGVBY3Rpb25zUmVxdWVzdChlZGl0b3IsIHRydWUpXHJcbiAgICAgICAgICAgICAgICAgICAgLnN1YnNjcmliZShjdHggPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB7cmVzcG9uc2V9ID0gY3R4O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2UuQ29kZUFjdGlvbnMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1hcmtlcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hcmtlci5kZXN0cm95KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFya2VyID0gbnVsbDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBybmcgPSBbW3Bvc2l0aW9uLnJvdywgMF0sIFtwb3NpdGlvbi5yb3csIDBdXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hcmtlciA9IGVkaXRvci5tYXJrQnVmZmVyUmFuZ2Uocm5nKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVkaXRvci5kZWNvcmF0ZU1hcmtlcihtYXJrZXIsIHsgdHlwZTogXCJsaW5lLW51bWJlclwiLCBjbGFzczogXCJxdWlja2ZpeFwiIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICBjb25zdCB1cGRhdGUgPSAocG9zOiBUZXh0QnVmZmVyLlBvaW50KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoc3Vic2NyaXB0aW9uKSBzdWJzY3JpcHRpb24uZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgbWFrZUxpZ2h0YnVsYlJlcXVlc3QocG9zKTtcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IG9uRGlkQ2hhbmdlQ3Vyc29yUG9zaXRpb24gPSBuZXcgU3ViamVjdDx7IG9sZEJ1ZmZlclBvc2l0aW9uOiBUZXh0QnVmZmVyLlBvaW50OyBvbGRTY3JlZW5Qb3NpdGlvbjogVGV4dEJ1ZmZlci5Qb2ludDsgbmV3QnVmZmVyUG9zaXRpb246IFRleHRCdWZmZXIuUG9pbnQ7IG5ld1NjcmVlblBvc2l0aW9uOiBUZXh0QnVmZmVyLlBvaW50OyB0ZXh0Q2hhbmdlZDogYm9vbGVhbjsgY3Vyc29yOiBBdG9tLkN1cnNvcjsgfT4oKTtcclxuICAgICAgICAgICAgY2QuYWRkKG9uRGlkQ2hhbmdlQ3Vyc29yUG9zaXRpb24pO1xyXG5cclxuICAgICAgICAgICAgY29uc3Qgb25EaWRTdG9wQ2hhbmdpbmcgPSBuZXcgU3ViamVjdDxhbnk+KCk7XHJcblxyXG4gICAgICAgICAgICBjZC5hZGQoT2JzZXJ2YWJsZS5jb21iaW5lTGF0ZXN0KFxyXG4gICAgICAgICAgICAgICAgPE9ic2VydmFibGU8eyBvbGRCdWZmZXJQb3NpdGlvbjogVGV4dEJ1ZmZlci5Qb2ludDsgb2xkU2NyZWVuUG9zaXRpb246IFRleHRCdWZmZXIuUG9pbnQ7IG5ld0J1ZmZlclBvc2l0aW9uOiBUZXh0QnVmZmVyLlBvaW50OyBuZXdTY3JlZW5Qb3NpdGlvbjogVGV4dEJ1ZmZlci5Qb2ludDsgdGV4dENoYW5nZWQ6IGJvb2xlYW47IGN1cnNvcjogQXRvbS5DdXJzb3I7IH0+Pjxhbnk+b25EaWRDaGFuZ2VDdXJzb3JQb3NpdGlvbixcclxuICAgICAgICAgICAgICAgIDxPYnNlcnZhYmxlPGFueT4+PGFueT5vbkRpZFN0b3BDaGFuZ2luZyxcclxuICAgICAgICAgICAgICAgIChjdXJzb3IsIGNoYW5naW5nKSA9PiBjdXJzb3IpXHJcbiAgICAgICAgICAgICAgICAuZGVib3VuY2VUaW1lKDEwMDApXHJcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKGN1cnNvciA9PiB1cGRhdGUoY3Vyc29yLm5ld0J1ZmZlclBvc2l0aW9uKSkpO1xyXG5cclxuICAgICAgICAgICAgY2QuYWRkKGVkaXRvci5vbkRpZFN0b3BDaGFuZ2luZyhfLmRlYm91bmNlKCgpID0+IG9uRGlkU3RvcENoYW5naW5nLm5leHQodHJ1ZSksIDEwMDApKSk7XHJcbiAgICAgICAgICAgIGNkLmFkZChlZGl0b3Iub25EaWRDaGFuZ2VDdXJzb3JQb3NpdGlvbihfLmRlYm91bmNlKChlOiBhbnkpID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IG9sZFBvcyA9IGUub2xkQnVmZmVyUG9zaXRpb247XHJcbiAgICAgICAgICAgICAgICBjb25zdCBuZXdQb3MgPSBlLm5ld0J1ZmZlclBvc2l0aW9uO1xyXG5cclxuICAgICAgICAgICAgICAgIGNvbnN0IG5ld1dvcmQ6IHN0cmluZyA9IDxhbnk+ZWRpdG9yLmdldFdvcmRVbmRlckN1cnNvcigpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHdvcmQgIT09IG5ld1dvcmQgfHwgb2xkUG9zLnJvdyAhPT0gbmV3UG9zLnJvdykge1xyXG4gICAgICAgICAgICAgICAgICAgIHdvcmQgPSBuZXdXb3JkO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChtYXJrZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWFya2VyLmRlc3Ryb3koKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWFya2VyID0gbnVsbDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCFvbkRpZENoYW5nZUN1cnNvclBvc2l0aW9uLmlzVW5zdWJzY3JpYmVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgb25EaWRDaGFuZ2VDdXJzb3JQb3NpdGlvbi5uZXh0KGUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LCAxMDAwKSkpO1xyXG4gICAgICAgIH0pKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGdldENvZGVBY3Rpb25zUmVxdWVzdChlZGl0b3I6IEF0b20uVGV4dEVkaXRvciwgc2lsZW50ID0gdHJ1ZSkge1xyXG4gICAgICAgIGlmICghZWRpdG9yIHx8IGVkaXRvci5pc0Rlc3Ryb3llZCgpKSByZXR1cm4gT2JzZXJ2YWJsZS5lbXB0eTx7IHJlcXVlc3Q6IE1vZGVscy5WMi5HZXRDb2RlQWN0aW9uc1JlcXVlc3Q7IHJlc3BvbnNlOiBNb2RlbHMuVjIuR2V0Q29kZUFjdGlvbnNSZXNwb25zZSB9PigpO1xyXG5cclxuICAgICAgICBjb25zdCByZXF1ZXN0ID0gdGhpcy5nZXRSZXF1ZXN0KGVkaXRvcik7XHJcbiAgICAgICAgcmV0dXJuIE9tbmkucmVxdWVzdChlZGl0b3IsIHNvbHV0aW9uID0+IHNvbHV0aW9uLmdldGNvZGVhY3Rpb25zKHJlcXVlc3QpKVxyXG4gICAgICAgICAgICAubWFwKHJlc3BvbnNlID0+ICh7IHJlcXVlc3QsIHJlc3BvbnNlIH0pKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHJ1bkNvZGVBY3Rpb25SZXF1ZXN0KGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yLCBnZXRSZXF1ZXN0OiBNb2RlbHMuVjIuR2V0Q29kZUFjdGlvbnNSZXF1ZXN0LCBjb2RlQWN0aW9uOiBzdHJpbmcpIHtcclxuICAgICAgICBpZiAoIWVkaXRvciB8fCBlZGl0b3IuaXNEZXN0cm95ZWQoKSkgcmV0dXJuIE9ic2VydmFibGUuZW1wdHk8TW9kZWxzLlYyLlJ1bkNvZGVBY3Rpb25SZXNwb25zZT4oKTtcclxuXHJcbiAgICAgICAgY29uc3QgcmVxdWVzdCA9IHRoaXMuZ2V0UmVxdWVzdChlZGl0b3IsIGNvZGVBY3Rpb24pO1xyXG4gICAgICAgIHJlcXVlc3QuU2VsZWN0aW9uID0gZ2V0UmVxdWVzdC5TZWxlY3Rpb247XHJcbiAgICAgICAgcmV0dXJuIE9tbmkucmVxdWVzdChlZGl0b3IsIHNvbHV0aW9uID0+IHNvbHV0aW9uLnJ1bmNvZGVhY3Rpb24ocmVxdWVzdCkpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZ2V0UmVxdWVzdChlZGl0b3I6IEF0b20uVGV4dEVkaXRvcik6IE1vZGVscy5WMi5HZXRDb2RlQWN0aW9uc1JlcXVlc3Q7XHJcbiAgICBwcml2YXRlIGdldFJlcXVlc3QoZWRpdG9yOiBBdG9tLlRleHRFZGl0b3IsIGNvZGVBY3Rpb246IHN0cmluZyk6IE1vZGVscy5WMi5SdW5Db2RlQWN0aW9uUmVxdWVzdDtcclxuICAgIHByaXZhdGUgZ2V0UmVxdWVzdChlZGl0b3I6IEF0b20uVGV4dEVkaXRvciwgY29kZUFjdGlvbj86IHN0cmluZykge1xyXG4gICAgICAgIGNvbnN0IHJhbmdlID0gPGFueT5lZGl0b3IuZ2V0U2VsZWN0ZWRCdWZmZXJSYW5nZSgpO1xyXG4gICAgICAgIGNvbnN0IHJlcXVlc3Q6IE1vZGVscy5WMi5SdW5Db2RlQWN0aW9uUmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgV2FudHNUZXh0Q2hhbmdlczogdHJ1ZSxcclxuICAgICAgICAgICAgU2VsZWN0aW9uOiB7XHJcbiAgICAgICAgICAgICAgICBTdGFydDoge1xyXG4gICAgICAgICAgICAgICAgICAgIExpbmU6IHJhbmdlLnN0YXJ0LnJvdyxcclxuICAgICAgICAgICAgICAgICAgICBDb2x1bW46IHJhbmdlLnN0YXJ0LmNvbHVtblxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIEVuZDoge1xyXG4gICAgICAgICAgICAgICAgICAgIExpbmU6IHJhbmdlLmVuZC5yb3csXHJcbiAgICAgICAgICAgICAgICAgICAgQ29sdW1uOiByYW5nZS5lbmQuY29sdW1uXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBpZiAoY29kZUFjdGlvbiAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIHJlcXVlc3QuSWRlbnRpZmllciA9IGNvZGVBY3Rpb247XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcmVxdWVzdDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGlzcG9zZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZXF1aXJlZCA9IHRydWU7XHJcbiAgICBwdWJsaWMgdGl0bGUgPSBcIkNvZGUgQWN0aW9uc1wiO1xyXG4gICAgcHVibGljIGRlc2NyaXB0aW9uID0gXCJBZGRzIGNvZGUgYWN0aW9uIHN1cHBvcnQgdG8gb21uaXNoYXJwLWF0b20uXCI7XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBjb2RlQWN0aW9uID0gbmV3IENvZGVBY3Rpb247XHJcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
