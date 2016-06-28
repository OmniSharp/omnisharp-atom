"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.signatureHelp = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _rxjs = require("rxjs");

var _omnisharpClient = require("omnisharp-client");

var _omni = require("../server/omni");

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _signatureHelpView = require("../views/signature-help-view");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var SignatureHelp = function () {
    function SignatureHelp() {
        _classCallCheck(this, SignatureHelp);

        this.required = false;
        this.default = false;
        this.title = "Signature Help";
        this.description = "Adds signature help to method calls.";
    }

    _createClass(SignatureHelp, [{
        key: "activate",
        value: function activate() {
            var _this = this;

            this.disposable = new _omnisharpClient.CompositeDisposable();
            var issueRequest = new _rxjs.Subject();
            var delayIssueRequest = new _rxjs.Subject();
            this.disposable.add(delayIssueRequest.debounceTime(1000).subscribe(function () {
                var editor = atom.workspace.getActiveTextEditor();
                var position = editor.getCursorBufferPosition();
                issueRequest.next(position);
            }));
            this.disposable.add(_omni.Omni.addTextEditorCommand("omnisharp-atom:signature-help", function (e) {
                return delayIssueRequest.next(null);
            }));
            this.disposable.add(atom.commands.onWillDispatch(function (event) {
                if (event.type === "autocomplete-plus:activate" || event.type === "autocomplete-plus:confirm") {
                    delayIssueRequest.next(null);
                }
            }));
            var shouldContinue = _rxjs.Observable.zip(_omni.Omni.listener.signatureHelp, _omni.Omni.listener.signatureHelp.skip(1).startWith(null), function (current, previous) {
                if (previous === null) return true;
                if (!current.response || !current.response.Signatures || current.response.Signatures.length === 0) {
                    return false;
                }
                if (current.response && current.response.Signatures && previous.response && previous.response.Signatures) {
                    if (!_lodash2.default.isEqual(current.response.Signatures, previous.response.Signatures)) {
                        return false;
                    }
                }
                return true;
            }).publishReplay(1).refCount();
            this.disposable.add(shouldContinue.filter(function (z) {
                return !z;
            }).subscribe(function () {
                return _this._bubble && _this._bubble.dispose();
            }));
            this.disposable.add(_omni.Omni.switchActiveEditor(function (editor, cd) {
                cd.add(issueRequest.flatMap(function (position) {
                    return _omni.Omni.request(editor, function (solution) {
                        return solution.signatureHelp({
                            Line: position.row,
                            Column: position.column
                        });
                    }).switchMap(function (x) {
                        return shouldContinue.filter(function (z) {
                            return z;
                        });
                    }, function (x) {
                        return x;
                    }).flatMap(function (response) {
                        if (response && response.Signatures && response.Signatures.length > 0) {
                            if (!_this._bubble) {
                                (function () {
                                    var disposable = editor.onDidChangeCursorPosition(function (event) {
                                        issueRequest.next(event.newBufferPosition);
                                    });
                                    cd.add(disposable);
                                    var disposer = _omnisharpClient.Disposable.create(function () {
                                        if (_this._bubble) {
                                            _this._bubble.dispose();
                                            _this._bubble = null;
                                        }
                                        disposable.dispose();
                                    });
                                    _this._bubble = new SignatureBubble(editor, disposer);
                                })();
                            }
                            _this._bubble.update(position, response);
                        } else {
                            if (_this._bubble) {
                                _this._bubble.dispose();
                            }
                        }
                        return _rxjs.Observable.empty();
                    });
                }).subscribe());
            }));
            this.disposable.add(issueRequest);
        }
    }, {
        key: "dispose",
        value: function dispose() {
            this.disposable.dispose();
        }
    }]);

    return SignatureHelp;
}();

var signatureHelp = exports.signatureHelp = new SignatureHelp();

var SignatureBubble = function () {
    function SignatureBubble(_editor, disposer) {
        var _this2 = this;

        _classCallCheck(this, SignatureBubble);

        this._editor = _editor;
        this._disposable = new _omnisharpClient.CompositeDisposable();
        this._disposable.add(disposer);
        var editorView = atom.views.getView(_editor);
        editorView.classList.add("signature-help-active");
        this._disposable.add(_omnisharpClient.Disposable.create(function () {
            editorView.classList.remove("signature-help-active");
        }));
        this._disposable.add(atom.commands.add("atom-text-editor:not(.autocomplete-active).signature-help-active", "core:move-up", function (event) {
            _this2._element.moveIndex(-1);
            event.stopImmediatePropagation();
        }));
        this._disposable.add(atom.commands.add("atom-text-editor:not(.autocomplete-active).signature-help-active", "core:move-down", function (event) {
            _this2._element.moveIndex(1);
            event.stopImmediatePropagation();
        }));
        this._disposable.add(atom.commands.add("atom-text-editor:not(.autocomplete-active).signature-help-active", "core:cancel", function (event) {
            _this2.dispose();
            event.stopImmediatePropagation();
        }));
        this._disposable.add(atom.config.observe("editor.fontSize", function (size) {
            _lodash2.default.defer(function () {
                _this2._lineHeight = _editor.getLineHeightInPixels();
                if (_this2._element) _this2._element.setLineHeight(_this2._lineHeight);
            });
        }));
    }

    _createClass(SignatureBubble, [{
        key: "update",
        value: function update(position, member) {
            var _this3 = this;

            this._position = position;
            var range = [[position.row, position.column], [position.row, position.column]];
            if (!this._marker) {
                this._marker = this._editor.markBufferRange(range);
                this._disposable.add(_omnisharpClient.Disposable.create(function () {
                    _this3._marker.destroy();
                }));
            } else {
                this._marker.setBufferRange(range);
            }
            if (!this._element || !this._decoration) {
                this._element = new _signatureHelpView.SignatureView();
                this._element.setLineHeight(this._lineHeight);
                this._decoration = this._editor.decorateMarker(this._marker, { type: "overlay", class: "signature-help", item: this._element, position: "head" });
            }
            if (!this._member) {
                this._updateMember(member);
            }
            if (member && this._member.Signatures && member.Signatures) {
                if (!_lodash2.default.isEqual(member.Signatures, this._member.Signatures)) {
                    this.dispose();
                    return;
                }
                if (!_lodash2.default.isEqual(member, this._member)) {
                    this._updateMember(member);
                }
            }
        }
    }, {
        key: "_updateMember",
        value: function _updateMember(member) {
            this._member = member;
            this._element.updateMember(member);
        }
    }, {
        key: "dispose",
        value: function dispose() {
            this._disposable.dispose();
        }
    }]);

    return SignatureBubble;
}();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9zaWduYXR1cmUtaGVscC5qcyIsImxpYi9mZWF0dXJlcy9zaWduYXR1cmUtaGVscC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7QUFDQTs7OztBQUNBOzs7Ozs7SUNVQTtBQUFBLDZCQUFBOzs7QUE4RlcsYUFBQSxRQUFBLEdBQVcsS0FBWCxDQTlGWDtBQStGVyxhQUFBLE9BQUEsR0FBVSxLQUFWLENBL0ZYO0FBZ0dXLGFBQUEsS0FBQSxHQUFRLGdCQUFSLENBaEdYO0FBaUdXLGFBQUEsV0FBQSxHQUFjLHNDQUFkLENBakdYO0tBQUE7Ozs7bUNBSW1COzs7QUFDWCxpQkFBSyxVQUFMLEdBQWtCLDBDQUFsQixDQURXO0FBRVgsZ0JBQU0sZUFBZSxtQkFBZixDQUZLO0FBR1gsZ0JBQU0sb0JBQW9CLG1CQUFwQixDQUhLO0FBS1gsaUJBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQixrQkFDZixZQURlLENBQ0YsSUFERSxFQUVmLFNBRmUsQ0FFTCxZQUFBO0FBQ1Asb0JBQU0sU0FBUyxLQUFLLFNBQUwsQ0FBZSxtQkFBZixFQUFULENBREM7QUFFUCxvQkFBTSxXQUFXLE9BQU8sdUJBQVAsRUFBWCxDQUZDO0FBR1AsNkJBQWEsSUFBYixDQUFrQixRQUFsQixFQUhPO2FBQUEsQ0FGZixFQUxXO0FBYVgsaUJBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQixXQUFLLG9CQUFMLENBQTBCLCtCQUExQixFQUNoQixVQUFDLENBQUQ7dUJBQU8sa0JBQWtCLElBQWxCLENBQXVCLElBQXZCO2FBQVAsQ0FESixFQWJXO0FBZ0JYLGlCQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsS0FBSyxRQUFMLENBQWMsY0FBZCxDQUE2QixVQUFTLEtBQVQsRUFBcUI7QUFDbEUsb0JBQUksTUFBTSxJQUFOLEtBQWUsNEJBQWYsSUFBK0MsTUFBTSxJQUFOLEtBQWUsMkJBQWYsRUFBNEM7QUFDM0Ysc0NBQWtCLElBQWxCLENBQXVCLElBQXZCLEVBRDJGO2lCQUEvRjthQUQ2QyxDQUFqRCxFQWhCVztBQXNCWCxnQkFBTSxpQkFBaUIsaUJBQVcsR0FBWCxDQUNuQixXQUFLLFFBQUwsQ0FBYyxhQUFkLEVBQ0EsV0FBSyxRQUFMLENBQWMsYUFBZCxDQUE0QixJQUE1QixDQUFpQyxDQUFqQyxFQUFvQyxTQUFwQyxDQUE4QyxJQUE5QyxDQUZtQixFQUduQixVQUFDLE9BQUQsRUFBVSxRQUFWLEVBQWtCO0FBQ2Qsb0JBQUksYUFBYSxJQUFiLEVBQW1CLE9BQU8sSUFBUCxDQUF2QjtBQUVBLG9CQUFJLENBQUMsUUFBUSxRQUFSLElBQW9CLENBQUMsUUFBUSxRQUFSLENBQWlCLFVBQWpCLElBQStCLFFBQVEsUUFBUixDQUFpQixVQUFqQixDQUE0QixNQUE1QixLQUF1QyxDQUF2QyxFQUEwQztBQUMvRiwyQkFBTyxLQUFQLENBRCtGO2lCQUFuRztBQUlBLG9CQUFJLFFBQVEsUUFBUixJQUFvQixRQUFRLFFBQVIsQ0FBaUIsVUFBakIsSUFBK0IsU0FBUyxRQUFULElBQXFCLFNBQVMsUUFBVCxDQUFrQixVQUFsQixFQUE4QjtBQUN0Ryx3QkFBSSxDQUFDLGlCQUFFLE9BQUYsQ0FBVSxRQUFRLFFBQVIsQ0FBaUIsVUFBakIsRUFBNkIsU0FBUyxRQUFULENBQWtCLFVBQWxCLENBQXhDLEVBQXVFO0FBQ3ZFLCtCQUFPLEtBQVAsQ0FEdUU7cUJBQTNFO2lCQURKO0FBTUEsdUJBQU8sSUFBUCxDQWJjO2FBQWxCLENBSG1CLENBa0JsQixhQWxCa0IsQ0FrQkosQ0FsQkksRUFrQkQsUUFsQkMsRUFBakIsQ0F0Qks7QUEwQ1gsaUJBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQixlQUNmLE1BRGUsQ0FDUjt1QkFBSyxDQUFDLENBQUQ7YUFBTCxDQURRLENBRWYsU0FGZSxDQUVMO3VCQUFNLE1BQUssT0FBTCxJQUFnQixNQUFLLE9BQUwsQ0FBYSxPQUFiLEVBQWhCO2FBQU4sQ0FGZixFQTFDVztBQThDWCxpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLFdBQUssa0JBQUwsQ0FBd0IsVUFBQyxNQUFELEVBQVMsRUFBVCxFQUFXO0FBQ25ELG1CQUFHLEdBQUgsQ0FBTyxhQUNGLE9BREUsQ0FDTSxVQUFDLFFBQUQ7MkJBQ0wsV0FBSyxPQUFMLENBQWEsTUFBYixFQUFxQjsrQkFBWSxTQUFTLGFBQVQsQ0FBdUI7QUFDcEQsa0NBQU0sU0FBUyxHQUFUO0FBQ04sb0NBQVEsU0FBUyxNQUFUO3lCQUZxQjtxQkFBWixDQUFyQixDQUlLLFNBSkwsQ0FJZTsrQkFBSyxlQUFlLE1BQWYsQ0FBc0I7bUNBQUs7eUJBQUw7cUJBQTNCLEVBQW9DOytCQUFLO3FCQUFMLENBSm5ELENBS0ssT0FMTCxDQUthLG9CQUFRO0FBQ2IsNEJBQUksWUFBWSxTQUFTLFVBQVQsSUFBdUIsU0FBUyxVQUFULENBQW9CLE1BQXBCLEdBQTZCLENBQTdCLEVBQWdDO0FBQ25FLGdDQUFJLENBQUMsTUFBSyxPQUFMLEVBQWM7O0FBQ2Ysd0NBQU0sYUFBYSxPQUFPLHlCQUFQLENBQWlDLGlCQUFLO0FBQ3JELHFEQUFhLElBQWIsQ0FBa0IsTUFBTSxpQkFBTixDQUFsQixDQURxRDtxQ0FBTCxDQUE5QztBQUdOLHVDQUFHLEdBQUgsQ0FBTyxVQUFQO0FBRUEsd0NBQU0sV0FBVyw0QkFBVyxNQUFYLENBQWtCLFlBQUE7QUFDL0IsNENBQUksTUFBSyxPQUFMLEVBQWM7QUFDZCxrREFBSyxPQUFMLENBQWEsT0FBYixHQURjO0FBRWQsa0RBQUssT0FBTCxHQUFlLElBQWYsQ0FGYzt5Q0FBbEI7QUFJQSxtREFBVyxPQUFYLEdBTCtCO3FDQUFBLENBQTdCO0FBUU4sMENBQUssT0FBTCxHQUFlLElBQUksZUFBSixDQUFvQixNQUFwQixFQUE0QixRQUE1QixDQUFmO3FDQWRlOzZCQUFuQjtBQWdCQSxrQ0FBSyxPQUFMLENBQWEsTUFBYixDQUFvQixRQUFwQixFQUE4QixRQUE5QixFQWpCbUU7eUJBQXZFLE1Ba0JPO0FBQ0gsZ0NBQUksTUFBSyxPQUFMLEVBQWM7QUFDZCxzQ0FBSyxPQUFMLENBQWEsT0FBYixHQURjOzZCQUFsQjt5QkFuQko7QUF3QkEsK0JBQU8saUJBQVcsS0FBWCxFQUFQLENBekJhO3FCQUFSO2lCQU5SLENBRE4sQ0FrQ0YsU0FsQ0UsRUFBUCxFQURtRDthQUFYLENBQTVDLEVBOUNXO0FBbUZYLGlCQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsWUFBcEIsRUFuRlc7Ozs7a0NBc0ZEO0FBQ1YsaUJBQUssVUFBTCxDQUFnQixPQUFoQixHQURVOzs7Ozs7O0FBU1gsSUFBTSx3Q0FBZ0IsSUFBSSxhQUFKLEVBQWhCOztJQUViO0FBU0ksNkJBQW9CLE9BQXBCLEVBQThDLFFBQTlDLEVBQW1FOzs7OztBQUEvQyxhQUFBLE9BQUEsR0FBQSxPQUFBLENBQStDO0FBUDNELGFBQUEsV0FBQSxHQUFjLDBDQUFkLENBTzJEO0FBQy9ELGFBQUssV0FBTCxDQUFpQixHQUFqQixDQUFxQixRQUFyQixFQUQrRDtBQUcvRCxZQUFNLGFBQStCLEtBQUssS0FBTCxDQUFXLE9BQVgsQ0FBbUIsT0FBbkIsQ0FBL0IsQ0FIeUQ7QUFJL0QsbUJBQVcsU0FBWCxDQUFxQixHQUFyQixDQUF5Qix1QkFBekIsRUFKK0Q7QUFNL0QsYUFBSyxXQUFMLENBQWlCLEdBQWpCLENBQXFCLDRCQUFXLE1BQVgsQ0FBa0IsWUFBQTtBQUNuQyx1QkFBVyxTQUFYLENBQXFCLE1BQXJCLENBQTRCLHVCQUE1QixFQURtQztTQUFBLENBQXZDLEVBTitEO0FBVS9ELGFBQUssV0FBTCxDQUFpQixHQUFqQixDQUNJLEtBQUssUUFBTCxDQUFjLEdBQWQsQ0FBa0Isa0VBQWxCLEVBQ0ksY0FESixFQUNvQixVQUFDLEtBQUQsRUFBTTtBQUNsQixtQkFBSyxRQUFMLENBQWMsU0FBZCxDQUF3QixDQUFDLENBQUQsQ0FBeEIsQ0FEa0I7QUFFbEIsa0JBQU0sd0JBQU4sR0FGa0I7U0FBTixDQUZ4QixFQVYrRDtBQWlCL0QsYUFBSyxXQUFMLENBQWlCLEdBQWpCLENBQ0ksS0FBSyxRQUFMLENBQWMsR0FBZCxDQUFrQixrRUFBbEIsRUFDSSxnQkFESixFQUNzQixVQUFDLEtBQUQsRUFBTTtBQUNwQixtQkFBSyxRQUFMLENBQWMsU0FBZCxDQUF3QixDQUF4QixFQURvQjtBQUVwQixrQkFBTSx3QkFBTixHQUZvQjtTQUFOLENBRjFCLEVBakIrRDtBQXdCL0QsYUFBSyxXQUFMLENBQWlCLEdBQWpCLENBQ0ksS0FBSyxRQUFMLENBQWMsR0FBZCxDQUFrQixrRUFBbEIsRUFDSSxhQURKLEVBQ21CLFVBQUMsS0FBRCxFQUFNO0FBQ2pCLG1CQUFLLE9BQUwsR0FEaUI7QUFFakIsa0JBQU0sd0JBQU4sR0FGaUI7U0FBTixDQUZ2QixFQXhCK0Q7QUErQi9ELGFBQUssV0FBTCxDQUFpQixHQUFqQixDQUFxQixLQUFLLE1BQUwsQ0FBWSxPQUFaLENBQW9CLGlCQUFwQixFQUF1QyxVQUFDLElBQUQsRUFBYTtBQUNyRSw2QkFBRSxLQUFGLENBQVEsWUFBQTtBQUNKLHVCQUFLLFdBQUwsR0FBbUIsUUFBUSxxQkFBUixFQUFuQixDQURJO0FBRUosb0JBQUksT0FBSyxRQUFMLEVBQ0EsT0FBSyxRQUFMLENBQWMsYUFBZCxDQUE0QixPQUFLLFdBQUwsQ0FBNUIsQ0FESjthQUZJLENBQVIsQ0FEcUU7U0FBYixDQUE1RCxFQS9CK0Q7S0FBbkU7Ozs7K0JBd0NjLFVBQTRCLFFBQTRCOzs7QUFDbEUsaUJBQUssU0FBTCxHQUFpQixRQUFqQixDQURrRTtBQUVsRSxnQkFBTSxRQUFRLENBQUMsQ0FBQyxTQUFTLEdBQVQsRUFBYyxTQUFTLE1BQVQsQ0FBaEIsRUFBa0MsQ0FBQyxTQUFTLEdBQVQsRUFBYyxTQUFTLE1BQVQsQ0FBakQsQ0FBUixDQUY0RDtBQUdsRSxnQkFBSSxDQUFDLEtBQUssT0FBTCxFQUFjO0FBQ2YscUJBQUssT0FBTCxHQUFxQixLQUFLLE9BQUwsQ0FBYyxlQUFkLENBQThCLEtBQTlCLENBQXJCLENBRGU7QUFFZixxQkFBSyxXQUFMLENBQWlCLEdBQWpCLENBQXFCLDRCQUFXLE1BQVgsQ0FBa0IsWUFBQTtBQUNuQywyQkFBSyxPQUFMLENBQWEsT0FBYixHQURtQztpQkFBQSxDQUF2QyxFQUZlO2FBQW5CLE1BS087QUFDSCxxQkFBSyxPQUFMLENBQWEsY0FBYixDQUFpQyxLQUFqQyxFQURHO2FBTFA7QUFTQSxnQkFBSSxDQUFDLEtBQUssUUFBTCxJQUFpQixDQUFDLEtBQUssV0FBTCxFQUFrQjtBQUNyQyxxQkFBSyxRQUFMLEdBQWdCLHNDQUFoQixDQURxQztBQUVyQyxxQkFBSyxRQUFMLENBQWMsYUFBZCxDQUE0QixLQUFLLFdBQUwsQ0FBNUIsQ0FGcUM7QUFHckMscUJBQUssV0FBTCxHQUF3QixLQUFLLE9BQUwsQ0FBYSxjQUFiLENBQTRCLEtBQUssT0FBTCxFQUFjLEVBQUUsTUFBTSxTQUFOLEVBQWlCLHVCQUFuQixFQUE0QyxNQUFNLEtBQUssUUFBTCxFQUFlLFVBQVUsTUFBVixFQUEzRyxDQUF4QixDQUhxQzthQUF6QztBQU1BLGdCQUFJLENBQUMsS0FBSyxPQUFMLEVBQWM7QUFDZixxQkFBSyxhQUFMLENBQW1CLE1BQW5CLEVBRGU7YUFBbkI7QUFJQSxnQkFBSSxVQUFVLEtBQUssT0FBTCxDQUFhLFVBQWIsSUFBMkIsT0FBTyxVQUFQLEVBQW1CO0FBQ3hELG9CQUFJLENBQUMsaUJBQUUsT0FBRixDQUFVLE9BQU8sVUFBUCxFQUFtQixLQUFLLE9BQUwsQ0FBYSxVQUFiLENBQTlCLEVBQXdEO0FBQ3hELHlCQUFLLE9BQUwsR0FEd0Q7QUFFeEQsMkJBRndEO2lCQUE1RDtBQUtBLG9CQUFJLENBQUMsaUJBQUUsT0FBRixDQUFVLE1BQVYsRUFBa0IsS0FBSyxPQUFMLENBQW5CLEVBQWtDO0FBQ2xDLHlCQUFLLGFBQUwsQ0FBbUIsTUFBbkIsRUFEa0M7aUJBQXRDO2FBTko7Ozs7c0NBYWtCLFFBQTRCO0FBQzlDLGlCQUFLLE9BQUwsR0FBZSxNQUFmLENBRDhDO0FBRTlDLGlCQUFLLFFBQUwsQ0FBYyxZQUFkLENBQTJCLE1BQTNCLEVBRjhDOzs7O2tDQUtwQztBQUNWLGlCQUFLLFdBQUwsQ0FBaUIsT0FBakIsR0FEVSIsImZpbGUiOiJsaWIvZmVhdHVyZXMvc2lnbmF0dXJlLWhlbHAuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBPYnNlcnZhYmxlLCBTdWJqZWN0IH0gZnJvbSBcInJ4anNcIjtcbmltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUsIERpc3Bvc2FibGUgfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xuaW1wb3J0IHsgT21uaSB9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xuaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xuaW1wb3J0IHsgU2lnbmF0dXJlVmlldyB9IGZyb20gXCIuLi92aWV3cy9zaWduYXR1cmUtaGVscC12aWV3XCI7XG5jbGFzcyBTaWduYXR1cmVIZWxwIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5yZXF1aXJlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLmRlZmF1bHQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy50aXRsZSA9IFwiU2lnbmF0dXJlIEhlbHBcIjtcbiAgICAgICAgdGhpcy5kZXNjcmlwdGlvbiA9IFwiQWRkcyBzaWduYXR1cmUgaGVscCB0byBtZXRob2QgY2FsbHMuXCI7XG4gICAgfVxuICAgIGFjdGl2YXRlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICBjb25zdCBpc3N1ZVJlcXVlc3QgPSBuZXcgU3ViamVjdCgpO1xuICAgICAgICBjb25zdCBkZWxheUlzc3VlUmVxdWVzdCA9IG5ldyBTdWJqZWN0KCk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoZGVsYXlJc3N1ZVJlcXVlc3RcbiAgICAgICAgICAgIC5kZWJvdW5jZVRpbWUoMTAwMClcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgZWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpO1xuICAgICAgICAgICAgY29uc3QgcG9zaXRpb24gPSBlZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKTtcbiAgICAgICAgICAgIGlzc3VlUmVxdWVzdC5uZXh0KHBvc2l0aW9uKTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuYWRkVGV4dEVkaXRvckNvbW1hbmQoXCJvbW5pc2hhcnAtYXRvbTpzaWduYXR1cmUtaGVscFwiLCAoZSkgPT4gZGVsYXlJc3N1ZVJlcXVlc3QubmV4dChudWxsKSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMub25XaWxsRGlzcGF0Y2goZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICBpZiAoZXZlbnQudHlwZSA9PT0gXCJhdXRvY29tcGxldGUtcGx1czphY3RpdmF0ZVwiIHx8IGV2ZW50LnR5cGUgPT09IFwiYXV0b2NvbXBsZXRlLXBsdXM6Y29uZmlybVwiKSB7XG4gICAgICAgICAgICAgICAgZGVsYXlJc3N1ZVJlcXVlc3QubmV4dChudWxsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSkpO1xuICAgICAgICBjb25zdCBzaG91bGRDb250aW51ZSA9IE9ic2VydmFibGUuemlwKE9tbmkubGlzdGVuZXIuc2lnbmF0dXJlSGVscCwgT21uaS5saXN0ZW5lci5zaWduYXR1cmVIZWxwLnNraXAoMSkuc3RhcnRXaXRoKG51bGwpLCAoY3VycmVudCwgcHJldmlvdXMpID0+IHtcbiAgICAgICAgICAgIGlmIChwcmV2aW91cyA9PT0gbnVsbClcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIGlmICghY3VycmVudC5yZXNwb25zZSB8fCAhY3VycmVudC5yZXNwb25zZS5TaWduYXR1cmVzIHx8IGN1cnJlbnQucmVzcG9uc2UuU2lnbmF0dXJlcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoY3VycmVudC5yZXNwb25zZSAmJiBjdXJyZW50LnJlc3BvbnNlLlNpZ25hdHVyZXMgJiYgcHJldmlvdXMucmVzcG9uc2UgJiYgcHJldmlvdXMucmVzcG9uc2UuU2lnbmF0dXJlcykge1xuICAgICAgICAgICAgICAgIGlmICghXy5pc0VxdWFsKGN1cnJlbnQucmVzcG9uc2UuU2lnbmF0dXJlcywgcHJldmlvdXMucmVzcG9uc2UuU2lnbmF0dXJlcykpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9KVxuICAgICAgICAgICAgLnB1Ymxpc2hSZXBsYXkoMSkucmVmQ291bnQoKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChzaG91bGRDb250aW51ZVxuICAgICAgICAgICAgLmZpbHRlcih6ID0+ICF6KVxuICAgICAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB0aGlzLl9idWJibGUgJiYgdGhpcy5fYnViYmxlLmRpc3Bvc2UoKSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuc3dpdGNoQWN0aXZlRWRpdG9yKChlZGl0b3IsIGNkKSA9PiB7XG4gICAgICAgICAgICBjZC5hZGQoaXNzdWVSZXF1ZXN0XG4gICAgICAgICAgICAgICAgLmZsYXRNYXAoKHBvc2l0aW9uKSA9PiBPbW5pLnJlcXVlc3QoZWRpdG9yLCBzb2x1dGlvbiA9PiBzb2x1dGlvbi5zaWduYXR1cmVIZWxwKHtcbiAgICAgICAgICAgICAgICBMaW5lOiBwb3NpdGlvbi5yb3csXG4gICAgICAgICAgICAgICAgQ29sdW1uOiBwb3NpdGlvbi5jb2x1bW4sXG4gICAgICAgICAgICB9KSlcbiAgICAgICAgICAgICAgICAuc3dpdGNoTWFwKHggPT4gc2hvdWxkQ29udGludWUuZmlsdGVyKHogPT4geiksIHggPT4geClcbiAgICAgICAgICAgICAgICAuZmxhdE1hcChyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlICYmIHJlc3BvbnNlLlNpZ25hdHVyZXMgJiYgcmVzcG9uc2UuU2lnbmF0dXJlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghdGhpcy5fYnViYmxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBkaXNwb3NhYmxlID0gZWRpdG9yLm9uRGlkQ2hhbmdlQ3Vyc29yUG9zaXRpb24oZXZlbnQgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzc3VlUmVxdWVzdC5uZXh0KGV2ZW50Lm5ld0J1ZmZlclBvc2l0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2QuYWRkKGRpc3Bvc2FibGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZGlzcG9zZXIgPSBEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX2J1YmJsZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9idWJibGUuZGlzcG9zZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9idWJibGUgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fYnViYmxlID0gbmV3IFNpZ25hdHVyZUJ1YmJsZShlZGl0b3IsIGRpc3Bvc2VyKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9idWJibGUudXBkYXRlKHBvc2l0aW9uLCByZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fYnViYmxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9idWJibGUuZGlzcG9zZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmVtcHR5KCk7XG4gICAgICAgICAgICB9KSlcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKCkpO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoaXNzdWVSZXF1ZXN0KTtcbiAgICB9XG4gICAgZGlzcG9zZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICB9XG59XG5leHBvcnQgY29uc3Qgc2lnbmF0dXJlSGVscCA9IG5ldyBTaWduYXR1cmVIZWxwO1xuY2xhc3MgU2lnbmF0dXJlQnViYmxlIHtcbiAgICBjb25zdHJ1Y3RvcihfZWRpdG9yLCBkaXNwb3Nlcikge1xuICAgICAgICB0aGlzLl9lZGl0b3IgPSBfZWRpdG9yO1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoZGlzcG9zZXIpO1xuICAgICAgICBjb25zdCBlZGl0b3JWaWV3ID0gYXRvbS52aWV3cy5nZXRWaWV3KF9lZGl0b3IpO1xuICAgICAgICBlZGl0b3JWaWV3LmNsYXNzTGlzdC5hZGQoXCJzaWduYXR1cmUtaGVscC1hY3RpdmVcIik7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcbiAgICAgICAgICAgIGVkaXRvclZpZXcuY2xhc3NMaXN0LnJlbW92ZShcInNpZ25hdHVyZS1oZWxwLWFjdGl2ZVwiKTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20tdGV4dC1lZGl0b3I6bm90KC5hdXRvY29tcGxldGUtYWN0aXZlKS5zaWduYXR1cmUtaGVscC1hY3RpdmVcIiwgXCJjb3JlOm1vdmUtdXBcIiwgKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICB0aGlzLl9lbGVtZW50Lm1vdmVJbmRleCgtMSk7XG4gICAgICAgICAgICBldmVudC5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20tdGV4dC1lZGl0b3I6bm90KC5hdXRvY29tcGxldGUtYWN0aXZlKS5zaWduYXR1cmUtaGVscC1hY3RpdmVcIiwgXCJjb3JlOm1vdmUtZG93blwiLCAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIHRoaXMuX2VsZW1lbnQubW92ZUluZGV4KDEpO1xuICAgICAgICAgICAgZXZlbnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXRleHQtZWRpdG9yOm5vdCguYXV0b2NvbXBsZXRlLWFjdGl2ZSkuc2lnbmF0dXJlLWhlbHAtYWN0aXZlXCIsIFwiY29yZTpjYW5jZWxcIiwgKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICB0aGlzLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgIGV2ZW50LnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoXCJlZGl0b3IuZm9udFNpemVcIiwgKHNpemUpID0+IHtcbiAgICAgICAgICAgIF8uZGVmZXIoKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuX2xpbmVIZWlnaHQgPSBfZWRpdG9yLmdldExpbmVIZWlnaHRJblBpeGVscygpO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9lbGVtZW50KVxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9lbGVtZW50LnNldExpbmVIZWlnaHQodGhpcy5fbGluZUhlaWdodCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSkpO1xuICAgIH1cbiAgICB1cGRhdGUocG9zaXRpb24sIG1lbWJlcikge1xuICAgICAgICB0aGlzLl9wb3NpdGlvbiA9IHBvc2l0aW9uO1xuICAgICAgICBjb25zdCByYW5nZSA9IFtbcG9zaXRpb24ucm93LCBwb3NpdGlvbi5jb2x1bW5dLCBbcG9zaXRpb24ucm93LCBwb3NpdGlvbi5jb2x1bW5dXTtcbiAgICAgICAgaWYgKCF0aGlzLl9tYXJrZXIpIHtcbiAgICAgICAgICAgIHRoaXMuX21hcmtlciA9IHRoaXMuX2VkaXRvci5tYXJrQnVmZmVyUmFuZ2UocmFuZ2UpO1xuICAgICAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuX21hcmtlci5kZXN0cm95KCk7XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9tYXJrZXIuc2V0QnVmZmVyUmFuZ2UocmFuZ2UpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdGhpcy5fZWxlbWVudCB8fCAhdGhpcy5fZGVjb3JhdGlvbikge1xuICAgICAgICAgICAgdGhpcy5fZWxlbWVudCA9IG5ldyBTaWduYXR1cmVWaWV3KCk7XG4gICAgICAgICAgICB0aGlzLl9lbGVtZW50LnNldExpbmVIZWlnaHQodGhpcy5fbGluZUhlaWdodCk7XG4gICAgICAgICAgICB0aGlzLl9kZWNvcmF0aW9uID0gdGhpcy5fZWRpdG9yLmRlY29yYXRlTWFya2VyKHRoaXMuX21hcmtlciwgeyB0eXBlOiBcIm92ZXJsYXlcIiwgY2xhc3M6IGBzaWduYXR1cmUtaGVscGAsIGl0ZW06IHRoaXMuX2VsZW1lbnQsIHBvc2l0aW9uOiBcImhlYWRcIiB9KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRoaXMuX21lbWJlcikge1xuICAgICAgICAgICAgdGhpcy5fdXBkYXRlTWVtYmVyKG1lbWJlcik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG1lbWJlciAmJiB0aGlzLl9tZW1iZXIuU2lnbmF0dXJlcyAmJiBtZW1iZXIuU2lnbmF0dXJlcykge1xuICAgICAgICAgICAgaWYgKCFfLmlzRXF1YWwobWVtYmVyLlNpZ25hdHVyZXMsIHRoaXMuX21lbWJlci5TaWduYXR1cmVzKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zZSgpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghXy5pc0VxdWFsKG1lbWJlciwgdGhpcy5fbWVtYmVyKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3VwZGF0ZU1lbWJlcihtZW1iZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIF91cGRhdGVNZW1iZXIobWVtYmVyKSB7XG4gICAgICAgIHRoaXMuX21lbWJlciA9IG1lbWJlcjtcbiAgICAgICAgdGhpcy5fZWxlbWVudC51cGRhdGVNZW1iZXIobWVtYmVyKTtcbiAgICB9XG4gICAgZGlzcG9zZSgpIHtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfVxufVxuIiwiaW1wb3J0IHtNb2RlbHN9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XHJcbmltcG9ydCB7T2JzZXJ2YWJsZSwgU3ViamVjdH0gZnJvbSBcInJ4anNcIjtcclxuaW1wb3J0IHtDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlLCBJRGlzcG9zYWJsZX0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcclxuaW1wb3J0IHtPbW5pfSBmcm9tIFwiLi4vc2VydmVyL29tbmlcIjtcclxuaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xyXG5pbXBvcnQge1NpZ25hdHVyZVZpZXd9IGZyb20gXCIuLi92aWV3cy9zaWduYXR1cmUtaGVscC12aWV3XCI7XHJcblxyXG5pbnRlcmZhY2UgSURlY29yYXRpb24ge1xyXG4gICAgZGVzdHJveSgpOiB2b2lkO1xyXG4gICAgZ2V0TWFya2VyKCk6IEF0b20uTWFya2VyO1xyXG4gICAgZ2V0UHJvcGVydGllcygpOiBhbnk7XHJcbiAgICBzZXRQcm9wZXJ0aWVzKHByb3BzOiBhbnkpOiBhbnk7XHJcbn1cclxuXHJcbmNsYXNzIFNpZ25hdHVyZUhlbHAgaW1wbGVtZW50cyBJRmVhdHVyZSB7XHJcbiAgICBwcml2YXRlIGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XHJcbiAgICBwcml2YXRlIF9idWJibGU6IFNpZ25hdHVyZUJ1YmJsZTtcclxuXHJcbiAgICBwdWJsaWMgYWN0aXZhdGUoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgICAgICBjb25zdCBpc3N1ZVJlcXVlc3QgPSBuZXcgU3ViamVjdDxUZXh0QnVmZmVyLlBvaW50PigpO1xyXG4gICAgICAgIGNvbnN0IGRlbGF5SXNzdWVSZXF1ZXN0ID0gbmV3IFN1YmplY3Q8YW55PigpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGRlbGF5SXNzdWVSZXF1ZXN0XHJcbiAgICAgICAgICAgIC5kZWJvdW5jZVRpbWUoMTAwMClcclxuICAgICAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBlZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKCk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBwb3NpdGlvbiA9IGVkaXRvci5nZXRDdXJzb3JCdWZmZXJQb3NpdGlvbigpO1xyXG4gICAgICAgICAgICAgICAgaXNzdWVSZXF1ZXN0Lm5leHQocG9zaXRpb24pO1xyXG4gICAgICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5hZGRUZXh0RWRpdG9yQ29tbWFuZChcIm9tbmlzaGFycC1hdG9tOnNpZ25hdHVyZS1oZWxwXCIsXHJcbiAgICAgICAgICAgIChlKSA9PiBkZWxheUlzc3VlUmVxdWVzdC5uZXh0KG51bGwpKSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5vbldpbGxEaXNwYXRjaChmdW5jdGlvbihldmVudDogRXZlbnQpIHtcclxuICAgICAgICAgICAgaWYgKGV2ZW50LnR5cGUgPT09IFwiYXV0b2NvbXBsZXRlLXBsdXM6YWN0aXZhdGVcIiB8fCBldmVudC50eXBlID09PSBcImF1dG9jb21wbGV0ZS1wbHVzOmNvbmZpcm1cIikge1xyXG4gICAgICAgICAgICAgICAgZGVsYXlJc3N1ZVJlcXVlc3QubmV4dChudWxsKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgY29uc3Qgc2hvdWxkQ29udGludWUgPSBPYnNlcnZhYmxlLnppcChcclxuICAgICAgICAgICAgT21uaS5saXN0ZW5lci5zaWduYXR1cmVIZWxwLFxyXG4gICAgICAgICAgICBPbW5pLmxpc3RlbmVyLnNpZ25hdHVyZUhlbHAuc2tpcCgxKS5zdGFydFdpdGgobnVsbCksXHJcbiAgICAgICAgICAgIChjdXJyZW50LCBwcmV2aW91cykgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKHByZXZpb3VzID09PSBudWxsKSByZXR1cm4gdHJ1ZTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIWN1cnJlbnQucmVzcG9uc2UgfHwgIWN1cnJlbnQucmVzcG9uc2UuU2lnbmF0dXJlcyB8fCBjdXJyZW50LnJlc3BvbnNlLlNpZ25hdHVyZXMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChjdXJyZW50LnJlc3BvbnNlICYmIGN1cnJlbnQucmVzcG9uc2UuU2lnbmF0dXJlcyAmJiBwcmV2aW91cy5yZXNwb25zZSAmJiBwcmV2aW91cy5yZXNwb25zZS5TaWduYXR1cmVzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFfLmlzRXF1YWwoY3VycmVudC5yZXNwb25zZS5TaWduYXR1cmVzLCBwcmV2aW91cy5yZXNwb25zZS5TaWduYXR1cmVzKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAucHVibGlzaFJlcGxheSgxKS5yZWZDb3VudCgpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKHNob3VsZENvbnRpbnVlXHJcbiAgICAgICAgICAgIC5maWx0ZXIoeiA9PiAheilcclxuICAgICAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB0aGlzLl9idWJibGUgJiYgdGhpcy5fYnViYmxlLmRpc3Bvc2UoKSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuc3dpdGNoQWN0aXZlRWRpdG9yKChlZGl0b3IsIGNkKSA9PiB7XHJcbiAgICAgICAgICAgIGNkLmFkZChpc3N1ZVJlcXVlc3RcclxuICAgICAgICAgICAgICAgIC5mbGF0TWFwKChwb3NpdGlvbjogVGV4dEJ1ZmZlci5Qb2ludCkgPT5cclxuICAgICAgICAgICAgICAgICAgICBPbW5pLnJlcXVlc3QoZWRpdG9yLCBzb2x1dGlvbiA9PiBzb2x1dGlvbi5zaWduYXR1cmVIZWxwKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgTGluZTogcG9zaXRpb24ucm93LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBDb2x1bW46IHBvc2l0aW9uLmNvbHVtbixcclxuICAgICAgICAgICAgICAgICAgICB9KSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgLnN3aXRjaE1hcCh4ID0+IHNob3VsZENvbnRpbnVlLmZpbHRlcih6ID0+IHopLCB4ID0+IHgpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5mbGF0TWFwKHJlc3BvbnNlID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZSAmJiByZXNwb25zZS5TaWduYXR1cmVzICYmIHJlc3BvbnNlLlNpZ25hdHVyZXMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdGhpcy5fYnViYmxlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGRpc3Bvc2FibGUgPSBlZGl0b3Iub25EaWRDaGFuZ2VDdXJzb3JQb3NpdGlvbihldmVudCA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpc3N1ZVJlcXVlc3QubmV4dChldmVudC5uZXdCdWZmZXJQb3NpdGlvbik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjZC5hZGQoZGlzcG9zYWJsZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBkaXNwb3NlciA9IERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9idWJibGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9idWJibGUuZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2J1YmJsZSA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9idWJibGUgPSBuZXcgU2lnbmF0dXJlQnViYmxlKGVkaXRvciwgZGlzcG9zZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9idWJibGUudXBkYXRlKHBvc2l0aW9uLCByZXNwb25zZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9idWJibGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fYnViYmxlLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuZW1wdHk8YW55PigpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KSlcclxuICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoKSk7XHJcbiAgICAgICAgfSkpO1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoaXNzdWVSZXF1ZXN0KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGlzcG9zZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZXF1aXJlZCA9IGZhbHNlO1xyXG4gICAgcHVibGljIGRlZmF1bHQgPSBmYWxzZTtcclxuICAgIHB1YmxpYyB0aXRsZSA9IFwiU2lnbmF0dXJlIEhlbHBcIjtcclxuICAgIHB1YmxpYyBkZXNjcmlwdGlvbiA9IFwiQWRkcyBzaWduYXR1cmUgaGVscCB0byBtZXRob2QgY2FsbHMuXCI7XHJcbn1cclxuZXhwb3J0IGNvbnN0IHNpZ25hdHVyZUhlbHAgPSBuZXcgU2lnbmF0dXJlSGVscDtcclxuXHJcbmNsYXNzIFNpZ25hdHVyZUJ1YmJsZSBpbXBsZW1lbnRzIElEaXNwb3NhYmxlIHtcclxuICAgIHByaXZhdGUgX2RlY29yYXRpb246IElEZWNvcmF0aW9uO1xyXG4gICAgcHJpdmF0ZSBfZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcbiAgICBwcml2YXRlIF9lbGVtZW50OiBTaWduYXR1cmVWaWV3O1xyXG4gICAgcHJpdmF0ZSBfbWFya2VyOiBBdG9tLk1hcmtlcjtcclxuICAgIHByaXZhdGUgX3Bvc2l0aW9uOiBUZXh0QnVmZmVyLlBvaW50O1xyXG4gICAgcHJpdmF0ZSBfbWVtYmVyOiBNb2RlbHMuU2lnbmF0dXJlSGVscDtcclxuICAgIHByaXZhdGUgX2xpbmVIZWlnaHQ6IG51bWJlcjtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9lZGl0b3I6IEF0b20uVGV4dEVkaXRvciwgZGlzcG9zZXI6IElEaXNwb3NhYmxlKSB7XHJcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoZGlzcG9zZXIpO1xyXG5cclxuICAgICAgICBjb25zdCBlZGl0b3JWaWV3OiBIVE1MRWxlbWVudCA9IDxhbnk+YXRvbS52aWV3cy5nZXRWaWV3KF9lZGl0b3IpO1xyXG4gICAgICAgIGVkaXRvclZpZXcuY2xhc3NMaXN0LmFkZChcInNpZ25hdHVyZS1oZWxwLWFjdGl2ZVwiKTtcclxuXHJcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xyXG4gICAgICAgICAgICBlZGl0b3JWaWV3LmNsYXNzTGlzdC5yZW1vdmUoXCJzaWduYXR1cmUtaGVscC1hY3RpdmVcIik7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChcclxuICAgICAgICAgICAgYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXRleHQtZWRpdG9yOm5vdCguYXV0b2NvbXBsZXRlLWFjdGl2ZSkuc2lnbmF0dXJlLWhlbHAtYWN0aXZlXCIsXHJcbiAgICAgICAgICAgICAgICBcImNvcmU6bW92ZS11cFwiLCAoZXZlbnQpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9lbGVtZW50Lm1vdmVJbmRleCgtMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKFxyXG4gICAgICAgICAgICBhdG9tLmNvbW1hbmRzLmFkZChcImF0b20tdGV4dC1lZGl0b3I6bm90KC5hdXRvY29tcGxldGUtYWN0aXZlKS5zaWduYXR1cmUtaGVscC1hY3RpdmVcIixcclxuICAgICAgICAgICAgICAgIFwiY29yZTptb3ZlLWRvd25cIiwgKGV2ZW50KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZWxlbWVudC5tb3ZlSW5kZXgoMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKFxyXG4gICAgICAgICAgICBhdG9tLmNvbW1hbmRzLmFkZChcImF0b20tdGV4dC1lZGl0b3I6bm90KC5hdXRvY29tcGxldGUtYWN0aXZlKS5zaWduYXR1cmUtaGVscC1hY3RpdmVcIixcclxuICAgICAgICAgICAgICAgIFwiY29yZTpjYW5jZWxcIiwgKGV2ZW50KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoXCJlZGl0b3IuZm9udFNpemVcIiwgKHNpemU6IG51bWJlcikgPT4ge1xyXG4gICAgICAgICAgICBfLmRlZmVyKCgpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2xpbmVIZWlnaHQgPSBfZWRpdG9yLmdldExpbmVIZWlnaHRJblBpeGVscygpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX2VsZW1lbnQpXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZWxlbWVudC5zZXRMaW5lSGVpZ2h0KHRoaXMuX2xpbmVIZWlnaHQpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHVwZGF0ZShwb3NpdGlvbjogVGV4dEJ1ZmZlci5Qb2ludCwgbWVtYmVyOiBNb2RlbHMuU2lnbmF0dXJlSGVscCkge1xyXG4gICAgICAgIHRoaXMuX3Bvc2l0aW9uID0gcG9zaXRpb247XHJcbiAgICAgICAgY29uc3QgcmFuZ2UgPSBbW3Bvc2l0aW9uLnJvdywgcG9zaXRpb24uY29sdW1uXSwgW3Bvc2l0aW9uLnJvdywgcG9zaXRpb24uY29sdW1uXV07XHJcbiAgICAgICAgaWYgKCF0aGlzLl9tYXJrZXIpIHtcclxuICAgICAgICAgICAgdGhpcy5fbWFya2VyID0gKDxhbnk+dGhpcy5fZWRpdG9yKS5tYXJrQnVmZmVyUmFuZ2UocmFuZ2UvKiwgeyBpbnZhbGlkYXRlOiBcImluc2lkZVwiIH0qLyk7XHJcbiAgICAgICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX21hcmtlci5kZXN0cm95KCk7XHJcbiAgICAgICAgICAgIH0pKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLl9tYXJrZXIuc2V0QnVmZmVyUmFuZ2UoPGFueT5yYW5nZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIXRoaXMuX2VsZW1lbnQgfHwgIXRoaXMuX2RlY29yYXRpb24pIHtcclxuICAgICAgICAgICAgdGhpcy5fZWxlbWVudCA9IG5ldyBTaWduYXR1cmVWaWV3KCk7XHJcbiAgICAgICAgICAgIHRoaXMuX2VsZW1lbnQuc2V0TGluZUhlaWdodCh0aGlzLl9saW5lSGVpZ2h0KTtcclxuICAgICAgICAgICAgdGhpcy5fZGVjb3JhdGlvbiA9IDxhbnk+dGhpcy5fZWRpdG9yLmRlY29yYXRlTWFya2VyKHRoaXMuX21hcmtlciwgeyB0eXBlOiBcIm92ZXJsYXlcIiwgY2xhc3M6IGBzaWduYXR1cmUtaGVscGAsIGl0ZW06IHRoaXMuX2VsZW1lbnQsIHBvc2l0aW9uOiBcImhlYWRcIiB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghdGhpcy5fbWVtYmVyKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3VwZGF0ZU1lbWJlcihtZW1iZXIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKG1lbWJlciAmJiB0aGlzLl9tZW1iZXIuU2lnbmF0dXJlcyAmJiBtZW1iZXIuU2lnbmF0dXJlcykge1xyXG4gICAgICAgICAgICBpZiAoIV8uaXNFcXVhbChtZW1iZXIuU2lnbmF0dXJlcywgdGhpcy5fbWVtYmVyLlNpZ25hdHVyZXMpKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCFfLmlzRXF1YWwobWVtYmVyLCB0aGlzLl9tZW1iZXIpKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl91cGRhdGVNZW1iZXIobWVtYmVyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfdXBkYXRlTWVtYmVyKG1lbWJlcjogTW9kZWxzLlNpZ25hdHVyZUhlbHApIHtcclxuICAgICAgICB0aGlzLl9tZW1iZXIgPSBtZW1iZXI7XHJcbiAgICAgICAgdGhpcy5fZWxlbWVudC51cGRhdGVNZW1iZXIobWVtYmVyKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGlzcG9zZSgpIHtcclxuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgIH1cclxufVxyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
