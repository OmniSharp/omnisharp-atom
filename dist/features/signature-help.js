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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9zaWduYXR1cmUtaGVscC5qcyIsImxpYi9mZWF0dXJlcy9zaWduYXR1cmUtaGVscC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7QUFDQTs7OztBQUNBOzs7Ozs7SUNVQSxhO0FBQUEsNkJBQUE7QUFBQTs7QUE4RlcsYUFBQSxRQUFBLEdBQVcsS0FBWDtBQUNBLGFBQUEsT0FBQSxHQUFVLEtBQVY7QUFDQSxhQUFBLEtBQUEsR0FBUSxnQkFBUjtBQUNBLGFBQUEsV0FBQSxHQUFjLHNDQUFkO0FBQ1Y7Ozs7bUNBOUZrQjtBQUFBOztBQUNYLGlCQUFLLFVBQUwsR0FBa0IsMENBQWxCO0FBQ0EsZ0JBQU0sZUFBZSxtQkFBckI7QUFDQSxnQkFBTSxvQkFBb0IsbUJBQTFCO0FBRUEsaUJBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQixrQkFDZixZQURlLENBQ0YsSUFERSxFQUVmLFNBRmUsQ0FFTCxZQUFBO0FBQ1Asb0JBQU0sU0FBUyxLQUFLLFNBQUwsQ0FBZSxtQkFBZixFQUFmO0FBQ0Esb0JBQU0sV0FBVyxPQUFPLHVCQUFQLEVBQWpCO0FBQ0EsNkJBQWEsSUFBYixDQUFrQixRQUFsQjtBQUNILGFBTmUsQ0FBcEI7QUFRQSxpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLFdBQUssb0JBQUwsQ0FBMEIsK0JBQTFCLEVBQ2hCLFVBQUMsQ0FBRDtBQUFBLHVCQUFPLGtCQUFrQixJQUFsQixDQUF1QixJQUF2QixDQUFQO0FBQUEsYUFEZ0IsQ0FBcEI7QUFHQSxpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLEtBQUssUUFBTCxDQUFjLGNBQWQsQ0FBNkIsVUFBUyxLQUFULEVBQXFCO0FBQ2xFLG9CQUFJLE1BQU0sSUFBTixLQUFlLDRCQUFmLElBQStDLE1BQU0sSUFBTixLQUFlLDJCQUFsRSxFQUErRjtBQUMzRixzQ0FBa0IsSUFBbEIsQ0FBdUIsSUFBdkI7QUFDSDtBQUNKLGFBSm1CLENBQXBCO0FBTUEsZ0JBQU0saUJBQWlCLGlCQUFXLEdBQVgsQ0FDbkIsV0FBSyxRQUFMLENBQWMsYUFESyxFQUVuQixXQUFLLFFBQUwsQ0FBYyxhQUFkLENBQTRCLElBQTVCLENBQWlDLENBQWpDLEVBQW9DLFNBQXBDLENBQThDLElBQTlDLENBRm1CLEVBR25CLFVBQUMsT0FBRCxFQUFVLFFBQVYsRUFBa0I7QUFDZCxvQkFBSSxhQUFhLElBQWpCLEVBQXVCLE9BQU8sSUFBUDtBQUV2QixvQkFBSSxDQUFDLFFBQVEsUUFBVCxJQUFxQixDQUFDLFFBQVEsUUFBUixDQUFpQixVQUF2QyxJQUFxRCxRQUFRLFFBQVIsQ0FBaUIsVUFBakIsQ0FBNEIsTUFBNUIsS0FBdUMsQ0FBaEcsRUFBbUc7QUFDL0YsMkJBQU8sS0FBUDtBQUNIO0FBRUQsb0JBQUksUUFBUSxRQUFSLElBQW9CLFFBQVEsUUFBUixDQUFpQixVQUFyQyxJQUFtRCxTQUFTLFFBQTVELElBQXdFLFNBQVMsUUFBVCxDQUFrQixVQUE5RixFQUEwRztBQUN0Ryx3QkFBSSxDQUFDLGlCQUFFLE9BQUYsQ0FBVSxRQUFRLFFBQVIsQ0FBaUIsVUFBM0IsRUFBdUMsU0FBUyxRQUFULENBQWtCLFVBQXpELENBQUwsRUFBMkU7QUFDdkUsK0JBQU8sS0FBUDtBQUNIO0FBQ0o7QUFFRCx1QkFBTyxJQUFQO0FBQ0gsYUFqQmtCLEVBa0JsQixhQWxCa0IsQ0FrQkosQ0FsQkksRUFrQkQsUUFsQkMsRUFBdkI7QUFvQkEsaUJBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQixlQUNmLE1BRGUsQ0FDUjtBQUFBLHVCQUFLLENBQUMsQ0FBTjtBQUFBLGFBRFEsRUFFZixTQUZlLENBRUw7QUFBQSx1QkFBTSxNQUFLLE9BQUwsSUFBZ0IsTUFBSyxPQUFMLENBQWEsT0FBYixFQUF0QjtBQUFBLGFBRkssQ0FBcEI7QUFJQSxpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLFdBQUssa0JBQUwsQ0FBd0IsVUFBQyxNQUFELEVBQVMsRUFBVCxFQUFXO0FBQ25ELG1CQUFHLEdBQUgsQ0FBTyxhQUNGLE9BREUsQ0FDTSxVQUFDLFFBQUQ7QUFBQSwyQkFDTCxXQUFLLE9BQUwsQ0FBYSxNQUFiLEVBQXFCO0FBQUEsK0JBQVksU0FBUyxhQUFULENBQXVCO0FBQ3BELGtDQUFNLFNBQVMsR0FEcUM7QUFFcEQsb0NBQVEsU0FBUztBQUZtQyx5QkFBdkIsQ0FBWjtBQUFBLHFCQUFyQixFQUlLLFNBSkwsQ0FJZTtBQUFBLCtCQUFLLGVBQWUsTUFBZixDQUFzQjtBQUFBLG1DQUFLLENBQUw7QUFBQSx5QkFBdEIsQ0FBTDtBQUFBLHFCQUpmLEVBSW1EO0FBQUEsK0JBQUssQ0FBTDtBQUFBLHFCQUpuRCxFQUtLLE9BTEwsQ0FLYSxvQkFBUTtBQUNiLDRCQUFJLFlBQVksU0FBUyxVQUFyQixJQUFtQyxTQUFTLFVBQVQsQ0FBb0IsTUFBcEIsR0FBNkIsQ0FBcEUsRUFBdUU7QUFDbkUsZ0NBQUksQ0FBQyxNQUFLLE9BQVYsRUFBbUI7QUFBQTtBQUNmLHdDQUFNLGFBQWEsT0FBTyx5QkFBUCxDQUFpQyxpQkFBSztBQUNyRCxxREFBYSxJQUFiLENBQWtCLE1BQU0saUJBQXhCO0FBQ0gscUNBRmtCLENBQW5CO0FBR0EsdUNBQUcsR0FBSCxDQUFPLFVBQVA7QUFFQSx3Q0FBTSxXQUFXLDRCQUFXLE1BQVgsQ0FBa0IsWUFBQTtBQUMvQiw0Q0FBSSxNQUFLLE9BQVQsRUFBa0I7QUFDZCxrREFBSyxPQUFMLENBQWEsT0FBYjtBQUNBLGtEQUFLLE9BQUwsR0FBZSxJQUFmO0FBQ0g7QUFDRCxtREFBVyxPQUFYO0FBQ0gscUNBTmdCLENBQWpCO0FBUUEsMENBQUssT0FBTCxHQUFlLElBQUksZUFBSixDQUFvQixNQUFwQixFQUE0QixRQUE1QixDQUFmO0FBZGU7QUFlbEI7QUFDRCxrQ0FBSyxPQUFMLENBQWEsTUFBYixDQUFvQixRQUFwQixFQUE4QixRQUE5QjtBQUNILHlCQWxCRCxNQWtCTztBQUNILGdDQUFJLE1BQUssT0FBVCxFQUFrQjtBQUNkLHNDQUFLLE9BQUwsQ0FBYSxPQUFiO0FBQ0g7QUFDSjtBQUVELCtCQUFPLGlCQUFXLEtBQVgsRUFBUDtBQUNILHFCQS9CTCxDQURLO0FBQUEsaUJBRE4sRUFrQ0YsU0FsQ0UsRUFBUDtBQW1DSCxhQXBDbUIsQ0FBcEI7QUFxQ0EsaUJBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQixZQUFwQjtBQUNIOzs7a0NBRWE7QUFDVixpQkFBSyxVQUFMLENBQWdCLE9BQWhCO0FBQ0g7Ozs7OztBQU9FLElBQU0sd0NBQWdCLElBQUksYUFBSixFQUF0Qjs7SUFFUCxlO0FBU0ksNkJBQW9CLE9BQXBCLEVBQThDLFFBQTlDLEVBQW1FO0FBQUE7O0FBQUE7O0FBQS9DLGFBQUEsT0FBQSxHQUFBLE9BQUE7QUFQWixhQUFBLFdBQUEsR0FBYywwQ0FBZDtBQVFKLGFBQUssV0FBTCxDQUFpQixHQUFqQixDQUFxQixRQUFyQjtBQUVBLFlBQU0sYUFBK0IsS0FBSyxLQUFMLENBQVcsT0FBWCxDQUFtQixPQUFuQixDQUFyQztBQUNBLG1CQUFXLFNBQVgsQ0FBcUIsR0FBckIsQ0FBeUIsdUJBQXpCO0FBRUEsYUFBSyxXQUFMLENBQWlCLEdBQWpCLENBQXFCLDRCQUFXLE1BQVgsQ0FBa0IsWUFBQTtBQUNuQyx1QkFBVyxTQUFYLENBQXFCLE1BQXJCLENBQTRCLHVCQUE1QjtBQUNILFNBRm9CLENBQXJCO0FBSUEsYUFBSyxXQUFMLENBQWlCLEdBQWpCLENBQ0ksS0FBSyxRQUFMLENBQWMsR0FBZCxDQUFrQixrRUFBbEIsRUFDSSxjQURKLEVBQ29CLFVBQUMsS0FBRCxFQUFNO0FBQ2xCLG1CQUFLLFFBQUwsQ0FBYyxTQUFkLENBQXdCLENBQUMsQ0FBekI7QUFDQSxrQkFBTSx3QkFBTjtBQUNILFNBSkwsQ0FESjtBQU9BLGFBQUssV0FBTCxDQUFpQixHQUFqQixDQUNJLEtBQUssUUFBTCxDQUFjLEdBQWQsQ0FBa0Isa0VBQWxCLEVBQ0ksZ0JBREosRUFDc0IsVUFBQyxLQUFELEVBQU07QUFDcEIsbUJBQUssUUFBTCxDQUFjLFNBQWQsQ0FBd0IsQ0FBeEI7QUFDQSxrQkFBTSx3QkFBTjtBQUNILFNBSkwsQ0FESjtBQU9BLGFBQUssV0FBTCxDQUFpQixHQUFqQixDQUNJLEtBQUssUUFBTCxDQUFjLEdBQWQsQ0FBa0Isa0VBQWxCLEVBQ0ksYUFESixFQUNtQixVQUFDLEtBQUQsRUFBTTtBQUNqQixtQkFBSyxPQUFMO0FBQ0Esa0JBQU0sd0JBQU47QUFDSCxTQUpMLENBREo7QUFPQSxhQUFLLFdBQUwsQ0FBaUIsR0FBakIsQ0FBcUIsS0FBSyxNQUFMLENBQVksT0FBWixDQUFvQixpQkFBcEIsRUFBdUMsVUFBQyxJQUFELEVBQWE7QUFDckUsNkJBQUUsS0FBRixDQUFRLFlBQUE7QUFDSix1QkFBSyxXQUFMLEdBQW1CLFFBQVEscUJBQVIsRUFBbkI7QUFDQSxvQkFBSSxPQUFLLFFBQVQsRUFDSSxPQUFLLFFBQUwsQ0FBYyxhQUFkLENBQTRCLE9BQUssV0FBakM7QUFDUCxhQUpEO0FBS0gsU0FOb0IsQ0FBckI7QUFPSDs7OzsrQkFFYSxRLEVBQTRCLE0sRUFBNEI7QUFBQTs7QUFDbEUsaUJBQUssU0FBTCxHQUFpQixRQUFqQjtBQUNBLGdCQUFNLFFBQVEsQ0FBQyxDQUFDLFNBQVMsR0FBVixFQUFlLFNBQVMsTUFBeEIsQ0FBRCxFQUFrQyxDQUFDLFNBQVMsR0FBVixFQUFlLFNBQVMsTUFBeEIsQ0FBbEMsQ0FBZDtBQUNBLGdCQUFJLENBQUMsS0FBSyxPQUFWLEVBQW1CO0FBQ2YscUJBQUssT0FBTCxHQUFxQixLQUFLLE9BQUwsQ0FBYyxlQUFkLENBQThCLEtBQTlCLENBQXJCO0FBQ0EscUJBQUssV0FBTCxDQUFpQixHQUFqQixDQUFxQiw0QkFBVyxNQUFYLENBQWtCLFlBQUE7QUFDbkMsMkJBQUssT0FBTCxDQUFhLE9BQWI7QUFDSCxpQkFGb0IsQ0FBckI7QUFHSCxhQUxELE1BS087QUFDSCxxQkFBSyxPQUFMLENBQWEsY0FBYixDQUFpQyxLQUFqQztBQUNIO0FBRUQsZ0JBQUksQ0FBQyxLQUFLLFFBQU4sSUFBa0IsQ0FBQyxLQUFLLFdBQTVCLEVBQXlDO0FBQ3JDLHFCQUFLLFFBQUwsR0FBZ0Isc0NBQWhCO0FBQ0EscUJBQUssUUFBTCxDQUFjLGFBQWQsQ0FBNEIsS0FBSyxXQUFqQztBQUNBLHFCQUFLLFdBQUwsR0FBd0IsS0FBSyxPQUFMLENBQWEsY0FBYixDQUE0QixLQUFLLE9BQWpDLEVBQTBDLEVBQUUsTUFBTSxTQUFSLEVBQW1CLHVCQUFuQixFQUE0QyxNQUFNLEtBQUssUUFBdkQsRUFBaUUsVUFBVSxNQUEzRSxFQUExQyxDQUF4QjtBQUNIO0FBRUQsZ0JBQUksQ0FBQyxLQUFLLE9BQVYsRUFBbUI7QUFDZixxQkFBSyxhQUFMLENBQW1CLE1BQW5CO0FBQ0g7QUFFRCxnQkFBSSxVQUFVLEtBQUssT0FBTCxDQUFhLFVBQXZCLElBQXFDLE9BQU8sVUFBaEQsRUFBNEQ7QUFDeEQsb0JBQUksQ0FBQyxpQkFBRSxPQUFGLENBQVUsT0FBTyxVQUFqQixFQUE2QixLQUFLLE9BQUwsQ0FBYSxVQUExQyxDQUFMLEVBQTREO0FBQ3hELHlCQUFLLE9BQUw7QUFDQTtBQUNIO0FBRUQsb0JBQUksQ0FBQyxpQkFBRSxPQUFGLENBQVUsTUFBVixFQUFrQixLQUFLLE9BQXZCLENBQUwsRUFBc0M7QUFDbEMseUJBQUssYUFBTCxDQUFtQixNQUFuQjtBQUNIO0FBQ0o7QUFFSjs7O3NDQUVxQixNLEVBQTRCO0FBQzlDLGlCQUFLLE9BQUwsR0FBZSxNQUFmO0FBQ0EsaUJBQUssUUFBTCxDQUFjLFlBQWQsQ0FBMkIsTUFBM0I7QUFDSDs7O2tDQUVhO0FBQ1YsaUJBQUssV0FBTCxDQUFpQixPQUFqQjtBQUNIIiwiZmlsZSI6ImxpYi9mZWF0dXJlcy9zaWduYXR1cmUtaGVscC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE9ic2VydmFibGUsIFN1YmplY3QgfSBmcm9tIFwicnhqc1wiO1xuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSwgRGlzcG9zYWJsZSB9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XG5pbXBvcnQgeyBPbW5pIH0gZnJvbSBcIi4uL3NlcnZlci9vbW5pXCI7XG5pbXBvcnQgXyBmcm9tIFwibG9kYXNoXCI7XG5pbXBvcnQgeyBTaWduYXR1cmVWaWV3IH0gZnJvbSBcIi4uL3ZpZXdzL3NpZ25hdHVyZS1oZWxwLXZpZXdcIjtcbmNsYXNzIFNpZ25hdHVyZUhlbHAge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLnJlcXVpcmVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMuZGVmYXVsdCA9IGZhbHNlO1xuICAgICAgICB0aGlzLnRpdGxlID0gXCJTaWduYXR1cmUgSGVscFwiO1xuICAgICAgICB0aGlzLmRlc2NyaXB0aW9uID0gXCJBZGRzIHNpZ25hdHVyZSBoZWxwIHRvIG1ldGhvZCBjYWxscy5cIjtcbiAgICB9XG4gICAgYWN0aXZhdGUoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIGNvbnN0IGlzc3VlUmVxdWVzdCA9IG5ldyBTdWJqZWN0KCk7XG4gICAgICAgIGNvbnN0IGRlbGF5SXNzdWVSZXF1ZXN0ID0gbmV3IFN1YmplY3QoKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChkZWxheUlzc3VlUmVxdWVzdFxuICAgICAgICAgICAgLmRlYm91bmNlVGltZSgxMDAwKVxuICAgICAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBlZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKCk7XG4gICAgICAgICAgICBjb25zdCBwb3NpdGlvbiA9IGVkaXRvci5nZXRDdXJzb3JCdWZmZXJQb3NpdGlvbigpO1xuICAgICAgICAgICAgaXNzdWVSZXF1ZXN0Lm5leHQocG9zaXRpb24pO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5hZGRUZXh0RWRpdG9yQ29tbWFuZChcIm9tbmlzaGFycC1hdG9tOnNpZ25hdHVyZS1oZWxwXCIsIChlKSA9PiBkZWxheUlzc3VlUmVxdWVzdC5uZXh0KG51bGwpKSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5vbldpbGxEaXNwYXRjaChmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgIGlmIChldmVudC50eXBlID09PSBcImF1dG9jb21wbGV0ZS1wbHVzOmFjdGl2YXRlXCIgfHwgZXZlbnQudHlwZSA9PT0gXCJhdXRvY29tcGxldGUtcGx1czpjb25maXJtXCIpIHtcbiAgICAgICAgICAgICAgICBkZWxheUlzc3VlUmVxdWVzdC5uZXh0KG51bGwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KSk7XG4gICAgICAgIGNvbnN0IHNob3VsZENvbnRpbnVlID0gT2JzZXJ2YWJsZS56aXAoT21uaS5saXN0ZW5lci5zaWduYXR1cmVIZWxwLCBPbW5pLmxpc3RlbmVyLnNpZ25hdHVyZUhlbHAuc2tpcCgxKS5zdGFydFdpdGgobnVsbCksIChjdXJyZW50LCBwcmV2aW91cykgPT4ge1xuICAgICAgICAgICAgaWYgKHByZXZpb3VzID09PSBudWxsKVxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgaWYgKCFjdXJyZW50LnJlc3BvbnNlIHx8ICFjdXJyZW50LnJlc3BvbnNlLlNpZ25hdHVyZXMgfHwgY3VycmVudC5yZXNwb25zZS5TaWduYXR1cmVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChjdXJyZW50LnJlc3BvbnNlICYmIGN1cnJlbnQucmVzcG9uc2UuU2lnbmF0dXJlcyAmJiBwcmV2aW91cy5yZXNwb25zZSAmJiBwcmV2aW91cy5yZXNwb25zZS5TaWduYXR1cmVzKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFfLmlzRXF1YWwoY3VycmVudC5yZXNwb25zZS5TaWduYXR1cmVzLCBwcmV2aW91cy5yZXNwb25zZS5TaWduYXR1cmVzKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0pXG4gICAgICAgICAgICAucHVibGlzaFJlcGxheSgxKS5yZWZDb3VudCgpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKHNob3VsZENvbnRpbnVlXG4gICAgICAgICAgICAuZmlsdGVyKHogPT4gIXopXG4gICAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHRoaXMuX2J1YmJsZSAmJiB0aGlzLl9idWJibGUuZGlzcG9zZSgpKSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5zd2l0Y2hBY3RpdmVFZGl0b3IoKGVkaXRvciwgY2QpID0+IHtcbiAgICAgICAgICAgIGNkLmFkZChpc3N1ZVJlcXVlc3RcbiAgICAgICAgICAgICAgICAuZmxhdE1hcCgocG9zaXRpb24pID0+IE9tbmkucmVxdWVzdChlZGl0b3IsIHNvbHV0aW9uID0+IHNvbHV0aW9uLnNpZ25hdHVyZUhlbHAoe1xuICAgICAgICAgICAgICAgIExpbmU6IHBvc2l0aW9uLnJvdyxcbiAgICAgICAgICAgICAgICBDb2x1bW46IHBvc2l0aW9uLmNvbHVtbixcbiAgICAgICAgICAgIH0pKVxuICAgICAgICAgICAgICAgIC5zd2l0Y2hNYXAoeCA9PiBzaG91bGRDb250aW51ZS5maWx0ZXIoeiA9PiB6KSwgeCA9PiB4KVxuICAgICAgICAgICAgICAgIC5mbGF0TWFwKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2UgJiYgcmVzcG9uc2UuU2lnbmF0dXJlcyAmJiByZXNwb25zZS5TaWduYXR1cmVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGlzLl9idWJibGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGRpc3Bvc2FibGUgPSBlZGl0b3Iub25EaWRDaGFuZ2VDdXJzb3JQb3NpdGlvbihldmVudCA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXNzdWVSZXF1ZXN0Lm5leHQoZXZlbnQubmV3QnVmZmVyUG9zaXRpb24pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjZC5hZGQoZGlzcG9zYWJsZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBkaXNwb3NlciA9IERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fYnViYmxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2J1YmJsZS5kaXNwb3NlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2J1YmJsZSA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9idWJibGUgPSBuZXcgU2lnbmF0dXJlQnViYmxlKGVkaXRvciwgZGlzcG9zZXIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2J1YmJsZS51cGRhdGUocG9zaXRpb24sIHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9idWJibGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2J1YmJsZS5kaXNwb3NlKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuZW1wdHkoKTtcbiAgICAgICAgICAgIH0pKVxuICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoKSk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChpc3N1ZVJlcXVlc3QpO1xuICAgIH1cbiAgICBkaXNwb3NlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgIH1cbn1cbmV4cG9ydCBjb25zdCBzaWduYXR1cmVIZWxwID0gbmV3IFNpZ25hdHVyZUhlbHA7XG5jbGFzcyBTaWduYXR1cmVCdWJibGUge1xuICAgIGNvbnN0cnVjdG9yKF9lZGl0b3IsIGRpc3Bvc2VyKSB7XG4gICAgICAgIHRoaXMuX2VkaXRvciA9IF9lZGl0b3I7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChkaXNwb3Nlcik7XG4gICAgICAgIGNvbnN0IGVkaXRvclZpZXcgPSBhdG9tLnZpZXdzLmdldFZpZXcoX2VkaXRvcik7XG4gICAgICAgIGVkaXRvclZpZXcuY2xhc3NMaXN0LmFkZChcInNpZ25hdHVyZS1oZWxwLWFjdGl2ZVwiKTtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xuICAgICAgICAgICAgZWRpdG9yVmlldy5jbGFzc0xpc3QucmVtb3ZlKFwic2lnbmF0dXJlLWhlbHAtYWN0aXZlXCIpO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS10ZXh0LWVkaXRvcjpub3QoLmF1dG9jb21wbGV0ZS1hY3RpdmUpLnNpZ25hdHVyZS1oZWxwLWFjdGl2ZVwiLCBcImNvcmU6bW92ZS11cFwiLCAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIHRoaXMuX2VsZW1lbnQubW92ZUluZGV4KC0xKTtcbiAgICAgICAgICAgIGV2ZW50LnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS10ZXh0LWVkaXRvcjpub3QoLmF1dG9jb21wbGV0ZS1hY3RpdmUpLnNpZ25hdHVyZS1oZWxwLWFjdGl2ZVwiLCBcImNvcmU6bW92ZS1kb3duXCIsIChldmVudCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5fZWxlbWVudC5tb3ZlSW5kZXgoMSk7XG4gICAgICAgICAgICBldmVudC5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20tdGV4dC1lZGl0b3I6bm90KC5hdXRvY29tcGxldGUtYWN0aXZlKS5zaWduYXR1cmUtaGVscC1hY3RpdmVcIiwgXCJjb3JlOmNhbmNlbFwiLCAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIHRoaXMuZGlzcG9zZSgpO1xuICAgICAgICAgICAgZXZlbnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoYXRvbS5jb25maWcub2JzZXJ2ZShcImVkaXRvci5mb250U2l6ZVwiLCAoc2l6ZSkgPT4ge1xuICAgICAgICAgICAgXy5kZWZlcigoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5fbGluZUhlaWdodCA9IF9lZGl0b3IuZ2V0TGluZUhlaWdodEluUGl4ZWxzKCk7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX2VsZW1lbnQpXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2VsZW1lbnQuc2V0TGluZUhlaWdodCh0aGlzLl9saW5lSGVpZ2h0KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KSk7XG4gICAgfVxuICAgIHVwZGF0ZShwb3NpdGlvbiwgbWVtYmVyKSB7XG4gICAgICAgIHRoaXMuX3Bvc2l0aW9uID0gcG9zaXRpb247XG4gICAgICAgIGNvbnN0IHJhbmdlID0gW1twb3NpdGlvbi5yb3csIHBvc2l0aW9uLmNvbHVtbl0sIFtwb3NpdGlvbi5yb3csIHBvc2l0aW9uLmNvbHVtbl1dO1xuICAgICAgICBpZiAoIXRoaXMuX21hcmtlcikge1xuICAgICAgICAgICAgdGhpcy5fbWFya2VyID0gdGhpcy5fZWRpdG9yLm1hcmtCdWZmZXJSYW5nZShyYW5nZSk7XG4gICAgICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5fbWFya2VyLmRlc3Ryb3koKTtcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX21hcmtlci5zZXRCdWZmZXJSYW5nZShyYW5nZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLl9lbGVtZW50IHx8ICF0aGlzLl9kZWNvcmF0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLl9lbGVtZW50ID0gbmV3IFNpZ25hdHVyZVZpZXcoKTtcbiAgICAgICAgICAgIHRoaXMuX2VsZW1lbnQuc2V0TGluZUhlaWdodCh0aGlzLl9saW5lSGVpZ2h0KTtcbiAgICAgICAgICAgIHRoaXMuX2RlY29yYXRpb24gPSB0aGlzLl9lZGl0b3IuZGVjb3JhdGVNYXJrZXIodGhpcy5fbWFya2VyLCB7IHR5cGU6IFwib3ZlcmxheVwiLCBjbGFzczogYHNpZ25hdHVyZS1oZWxwYCwgaXRlbTogdGhpcy5fZWxlbWVudCwgcG9zaXRpb246IFwiaGVhZFwiIH0pO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdGhpcy5fbWVtYmVyKSB7XG4gICAgICAgICAgICB0aGlzLl91cGRhdGVNZW1iZXIobWVtYmVyKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobWVtYmVyICYmIHRoaXMuX21lbWJlci5TaWduYXR1cmVzICYmIG1lbWJlci5TaWduYXR1cmVzKSB7XG4gICAgICAgICAgICBpZiAoIV8uaXNFcXVhbChtZW1iZXIuU2lnbmF0dXJlcywgdGhpcy5fbWVtYmVyLlNpZ25hdHVyZXMpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NlKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFfLmlzRXF1YWwobWVtYmVyLCB0aGlzLl9tZW1iZXIpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fdXBkYXRlTWVtYmVyKG1lbWJlcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgX3VwZGF0ZU1lbWJlcihtZW1iZXIpIHtcbiAgICAgICAgdGhpcy5fbWVtYmVyID0gbWVtYmVyO1xuICAgICAgICB0aGlzLl9lbGVtZW50LnVwZGF0ZU1lbWJlcihtZW1iZXIpO1xuICAgIH1cbiAgICBkaXNwb3NlKCkge1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICB9XG59XG4iLCJpbXBvcnQge01vZGVsc30gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcclxuaW1wb3J0IHtPYnNlcnZhYmxlLCBTdWJqZWN0fSBmcm9tIFwicnhqc1wiO1xyXG5pbXBvcnQge0NvbXBvc2l0ZURpc3Bvc2FibGUsIERpc3Bvc2FibGUsIElEaXNwb3NhYmxlfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xyXG5pbXBvcnQge09tbml9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xyXG5pbXBvcnQgXyBmcm9tIFwibG9kYXNoXCI7XHJcbmltcG9ydCB7U2lnbmF0dXJlVmlld30gZnJvbSBcIi4uL3ZpZXdzL3NpZ25hdHVyZS1oZWxwLXZpZXdcIjtcclxuXHJcbmludGVyZmFjZSBJRGVjb3JhdGlvbiB7XHJcbiAgICBkZXN0cm95KCk6IHZvaWQ7XHJcbiAgICBnZXRNYXJrZXIoKTogQXRvbS5NYXJrZXI7XHJcbiAgICBnZXRQcm9wZXJ0aWVzKCk6IGFueTtcclxuICAgIHNldFByb3BlcnRpZXMocHJvcHM6IGFueSk6IGFueTtcclxufVxyXG5cclxuY2xhc3MgU2lnbmF0dXJlSGVscCBpbXBsZW1lbnRzIElGZWF0dXJlIHtcclxuICAgIHByaXZhdGUgZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxuICAgIHByaXZhdGUgX2J1YmJsZTogU2lnbmF0dXJlQnViYmxlO1xyXG5cclxuICAgIHB1YmxpYyBhY3RpdmF0ZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG4gICAgICAgIGNvbnN0IGlzc3VlUmVxdWVzdCA9IG5ldyBTdWJqZWN0PFRleHRCdWZmZXIuUG9pbnQ+KCk7XHJcbiAgICAgICAgY29uc3QgZGVsYXlJc3N1ZVJlcXVlc3QgPSBuZXcgU3ViamVjdDxhbnk+KCk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoZGVsYXlJc3N1ZVJlcXVlc3RcclxuICAgICAgICAgICAgLmRlYm91bmNlVGltZSgxMDAwKVxyXG4gICAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGVkaXRvciA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHBvc2l0aW9uID0gZWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKCk7XHJcbiAgICAgICAgICAgICAgICBpc3N1ZVJlcXVlc3QubmV4dChwb3NpdGlvbik7XHJcbiAgICAgICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmFkZFRleHRFZGl0b3JDb21tYW5kKFwib21uaXNoYXJwLWF0b206c2lnbmF0dXJlLWhlbHBcIixcclxuICAgICAgICAgICAgKGUpID0+IGRlbGF5SXNzdWVSZXF1ZXN0Lm5leHQobnVsbCkpKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLm9uV2lsbERpc3BhdGNoKGZ1bmN0aW9uKGV2ZW50OiBFdmVudCkge1xyXG4gICAgICAgICAgICBpZiAoZXZlbnQudHlwZSA9PT0gXCJhdXRvY29tcGxldGUtcGx1czphY3RpdmF0ZVwiIHx8IGV2ZW50LnR5cGUgPT09IFwiYXV0b2NvbXBsZXRlLXBsdXM6Y29uZmlybVwiKSB7XHJcbiAgICAgICAgICAgICAgICBkZWxheUlzc3VlUmVxdWVzdC5uZXh0KG51bGwpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICBjb25zdCBzaG91bGRDb250aW51ZSA9IE9ic2VydmFibGUuemlwKFxyXG4gICAgICAgICAgICBPbW5pLmxpc3RlbmVyLnNpZ25hdHVyZUhlbHAsXHJcbiAgICAgICAgICAgIE9tbmkubGlzdGVuZXIuc2lnbmF0dXJlSGVscC5za2lwKDEpLnN0YXJ0V2l0aChudWxsKSxcclxuICAgICAgICAgICAgKGN1cnJlbnQsIHByZXZpb3VzKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAocHJldmlvdXMgPT09IG51bGwpIHJldHVybiB0cnVlO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICghY3VycmVudC5yZXNwb25zZSB8fCAhY3VycmVudC5yZXNwb25zZS5TaWduYXR1cmVzIHx8IGN1cnJlbnQucmVzcG9uc2UuU2lnbmF0dXJlcy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGN1cnJlbnQucmVzcG9uc2UgJiYgY3VycmVudC5yZXNwb25zZS5TaWduYXR1cmVzICYmIHByZXZpb3VzLnJlc3BvbnNlICYmIHByZXZpb3VzLnJlc3BvbnNlLlNpZ25hdHVyZXMpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIV8uaXNFcXVhbChjdXJyZW50LnJlc3BvbnNlLlNpZ25hdHVyZXMsIHByZXZpb3VzLnJlc3BvbnNlLlNpZ25hdHVyZXMpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC5wdWJsaXNoUmVwbGF5KDEpLnJlZkNvdW50KCk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoc2hvdWxkQ29udGludWVcclxuICAgICAgICAgICAgLmZpbHRlcih6ID0+ICF6KVxyXG4gICAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHRoaXMuX2J1YmJsZSAmJiB0aGlzLl9idWJibGUuZGlzcG9zZSgpKSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5zd2l0Y2hBY3RpdmVFZGl0b3IoKGVkaXRvciwgY2QpID0+IHtcclxuICAgICAgICAgICAgY2QuYWRkKGlzc3VlUmVxdWVzdFxyXG4gICAgICAgICAgICAgICAgLmZsYXRNYXAoKHBvc2l0aW9uOiBUZXh0QnVmZmVyLlBvaW50KSA9PlxyXG4gICAgICAgICAgICAgICAgICAgIE9tbmkucmVxdWVzdChlZGl0b3IsIHNvbHV0aW9uID0+IHNvbHV0aW9uLnNpZ25hdHVyZUhlbHAoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBMaW5lOiBwb3NpdGlvbi5yb3csXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIENvbHVtbjogcG9zaXRpb24uY29sdW1uLFxyXG4gICAgICAgICAgICAgICAgICAgIH0pKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuc3dpdGNoTWFwKHggPT4gc2hvdWxkQ29udGludWUuZmlsdGVyKHogPT4geiksIHggPT4geClcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmZsYXRNYXAocmVzcG9uc2UgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlICYmIHJlc3BvbnNlLlNpZ25hdHVyZXMgJiYgcmVzcG9uc2UuU2lnbmF0dXJlcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGlzLl9idWJibGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZGlzcG9zYWJsZSA9IGVkaXRvci5vbkRpZENoYW5nZUN1cnNvclBvc2l0aW9uKGV2ZW50ID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzc3VlUmVxdWVzdC5uZXh0KGV2ZW50Lm5ld0J1ZmZlclBvc2l0aW9uKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNkLmFkZChkaXNwb3NhYmxlKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGRpc3Bvc2VyID0gRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX2J1YmJsZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2J1YmJsZS5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fYnViYmxlID0gbnVsbDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2J1YmJsZSA9IG5ldyBTaWduYXR1cmVCdWJibGUoZWRpdG9yLCBkaXNwb3Nlcik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2J1YmJsZS51cGRhdGUocG9zaXRpb24sIHJlc3BvbnNlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX2J1YmJsZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9idWJibGUuZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5lbXB0eTxhbnk+KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pKVxyXG4gICAgICAgICAgICAgICAgLnN1YnNjcmliZSgpKTtcclxuICAgICAgICB9KSk7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChpc3N1ZVJlcXVlc3QpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkaXNwb3NlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlcXVpcmVkID0gZmFsc2U7XHJcbiAgICBwdWJsaWMgZGVmYXVsdCA9IGZhbHNlO1xyXG4gICAgcHVibGljIHRpdGxlID0gXCJTaWduYXR1cmUgSGVscFwiO1xyXG4gICAgcHVibGljIGRlc2NyaXB0aW9uID0gXCJBZGRzIHNpZ25hdHVyZSBoZWxwIHRvIG1ldGhvZCBjYWxscy5cIjtcclxufVxyXG5leHBvcnQgY29uc3Qgc2lnbmF0dXJlSGVscCA9IG5ldyBTaWduYXR1cmVIZWxwO1xyXG5cclxuY2xhc3MgU2lnbmF0dXJlQnViYmxlIGltcGxlbWVudHMgSURpc3Bvc2FibGUge1xyXG4gICAgcHJpdmF0ZSBfZGVjb3JhdGlvbjogSURlY29yYXRpb247XHJcbiAgICBwcml2YXRlIF9kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgIHByaXZhdGUgX2VsZW1lbnQ6IFNpZ25hdHVyZVZpZXc7XHJcbiAgICBwcml2YXRlIF9tYXJrZXI6IEF0b20uTWFya2VyO1xyXG4gICAgcHJpdmF0ZSBfcG9zaXRpb246IFRleHRCdWZmZXIuUG9pbnQ7XHJcbiAgICBwcml2YXRlIF9tZW1iZXI6IE1vZGVscy5TaWduYXR1cmVIZWxwO1xyXG4gICAgcHJpdmF0ZSBfbGluZUhlaWdodDogbnVtYmVyO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgX2VkaXRvcjogQXRvbS5UZXh0RWRpdG9yLCBkaXNwb3NlcjogSURpc3Bvc2FibGUpIHtcclxuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChkaXNwb3Nlcik7XHJcblxyXG4gICAgICAgIGNvbnN0IGVkaXRvclZpZXc6IEhUTUxFbGVtZW50ID0gPGFueT5hdG9tLnZpZXdzLmdldFZpZXcoX2VkaXRvcik7XHJcbiAgICAgICAgZWRpdG9yVmlldy5jbGFzc0xpc3QuYWRkKFwic2lnbmF0dXJlLWhlbHAtYWN0aXZlXCIpO1xyXG5cclxuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XHJcbiAgICAgICAgICAgIGVkaXRvclZpZXcuY2xhc3NMaXN0LnJlbW92ZShcInNpZ25hdHVyZS1oZWxwLWFjdGl2ZVwiKTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKFxyXG4gICAgICAgICAgICBhdG9tLmNvbW1hbmRzLmFkZChcImF0b20tdGV4dC1lZGl0b3I6bm90KC5hdXRvY29tcGxldGUtYWN0aXZlKS5zaWduYXR1cmUtaGVscC1hY3RpdmVcIixcclxuICAgICAgICAgICAgICAgIFwiY29yZTptb3ZlLXVwXCIsIChldmVudCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2VsZW1lbnQubW92ZUluZGV4KC0xKTtcclxuICAgICAgICAgICAgICAgICAgICBldmVudC5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcclxuICAgICAgICAgICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoXHJcbiAgICAgICAgICAgIGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS10ZXh0LWVkaXRvcjpub3QoLmF1dG9jb21wbGV0ZS1hY3RpdmUpLnNpZ25hdHVyZS1oZWxwLWFjdGl2ZVwiLFxyXG4gICAgICAgICAgICAgICAgXCJjb3JlOm1vdmUtZG93blwiLCAoZXZlbnQpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9lbGVtZW50Lm1vdmVJbmRleCgxKTtcclxuICAgICAgICAgICAgICAgICAgICBldmVudC5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcclxuICAgICAgICAgICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoXHJcbiAgICAgICAgICAgIGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS10ZXh0LWVkaXRvcjpub3QoLmF1dG9jb21wbGV0ZS1hY3RpdmUpLnNpZ25hdHVyZS1oZWxwLWFjdGl2ZVwiLFxyXG4gICAgICAgICAgICAgICAgXCJjb3JlOmNhbmNlbFwiLCAoZXZlbnQpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgICAgICAgICBldmVudC5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcclxuICAgICAgICAgICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoYXRvbS5jb25maWcub2JzZXJ2ZShcImVkaXRvci5mb250U2l6ZVwiLCAoc2l6ZTogbnVtYmVyKSA9PiB7XHJcbiAgICAgICAgICAgIF8uZGVmZXIoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fbGluZUhlaWdodCA9IF9lZGl0b3IuZ2V0TGluZUhlaWdodEluUGl4ZWxzKCk7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fZWxlbWVudClcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9lbGVtZW50LnNldExpbmVIZWlnaHQodGhpcy5fbGluZUhlaWdodCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgdXBkYXRlKHBvc2l0aW9uOiBUZXh0QnVmZmVyLlBvaW50LCBtZW1iZXI6IE1vZGVscy5TaWduYXR1cmVIZWxwKSB7XHJcbiAgICAgICAgdGhpcy5fcG9zaXRpb24gPSBwb3NpdGlvbjtcclxuICAgICAgICBjb25zdCByYW5nZSA9IFtbcG9zaXRpb24ucm93LCBwb3NpdGlvbi5jb2x1bW5dLCBbcG9zaXRpb24ucm93LCBwb3NpdGlvbi5jb2x1bW5dXTtcclxuICAgICAgICBpZiAoIXRoaXMuX21hcmtlcikge1xyXG4gICAgICAgICAgICB0aGlzLl9tYXJrZXIgPSAoPGFueT50aGlzLl9lZGl0b3IpLm1hcmtCdWZmZXJSYW5nZShyYW5nZS8qLCB7IGludmFsaWRhdGU6IFwiaW5zaWRlXCIgfSovKTtcclxuICAgICAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fbWFya2VyLmRlc3Ryb3koKTtcclxuICAgICAgICAgICAgfSkpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuX21hcmtlci5zZXRCdWZmZXJSYW5nZSg8YW55PnJhbmdlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghdGhpcy5fZWxlbWVudCB8fCAhdGhpcy5fZGVjb3JhdGlvbikge1xyXG4gICAgICAgICAgICB0aGlzLl9lbGVtZW50ID0gbmV3IFNpZ25hdHVyZVZpZXcoKTtcclxuICAgICAgICAgICAgdGhpcy5fZWxlbWVudC5zZXRMaW5lSGVpZ2h0KHRoaXMuX2xpbmVIZWlnaHQpO1xyXG4gICAgICAgICAgICB0aGlzLl9kZWNvcmF0aW9uID0gPGFueT50aGlzLl9lZGl0b3IuZGVjb3JhdGVNYXJrZXIodGhpcy5fbWFya2VyLCB7IHR5cGU6IFwib3ZlcmxheVwiLCBjbGFzczogYHNpZ25hdHVyZS1oZWxwYCwgaXRlbTogdGhpcy5fZWxlbWVudCwgcG9zaXRpb246IFwiaGVhZFwiIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCF0aGlzLl9tZW1iZXIpIHtcclxuICAgICAgICAgICAgdGhpcy5fdXBkYXRlTWVtYmVyKG1lbWJlcik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAobWVtYmVyICYmIHRoaXMuX21lbWJlci5TaWduYXR1cmVzICYmIG1lbWJlci5TaWduYXR1cmVzKSB7XHJcbiAgICAgICAgICAgIGlmICghXy5pc0VxdWFsKG1lbWJlci5TaWduYXR1cmVzLCB0aGlzLl9tZW1iZXIuU2lnbmF0dXJlcykpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIV8uaXNFcXVhbChtZW1iZXIsIHRoaXMuX21lbWJlcikpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX3VwZGF0ZU1lbWJlcihtZW1iZXIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF91cGRhdGVNZW1iZXIobWVtYmVyOiBNb2RlbHMuU2lnbmF0dXJlSGVscCkge1xyXG4gICAgICAgIHRoaXMuX21lbWJlciA9IG1lbWJlcjtcclxuICAgICAgICB0aGlzLl9lbGVtZW50LnVwZGF0ZU1lbWJlcihtZW1iZXIpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkaXNwb3NlKCkge1xyXG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgfVxyXG59XHJcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
