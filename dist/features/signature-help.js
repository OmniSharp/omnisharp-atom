"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.signatureHelp = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _rxjs = require("rxjs");

var _tsDisposables = require("ts-disposables");

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

            this.disposable = new _tsDisposables.CompositeDisposable();
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
                                    var disposer = _tsDisposables.Disposable.create(function () {
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
        this._disposable = new _tsDisposables.CompositeDisposable();
        this._disposable.add(disposer);
        var editorView = atom.views.getView(_editor);
        editorView.classList.add("signature-help-active");
        this._disposable.add(_tsDisposables.Disposable.create(function () {
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
                this._disposable.add(_tsDisposables.Disposable.create(function () {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9zaWduYXR1cmUtaGVscC5qcyIsImxpYi9mZWF0dXJlcy9zaWduYXR1cmUtaGVscC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7QUFDQTs7OztBQUNBOzs7Ozs7SUNVQTtBQUFBLDZCQUFBOzs7QUE4RlcsYUFBQSxRQUFBLEdBQVcsS0FBWCxDQTlGWDtBQStGVyxhQUFBLE9BQUEsR0FBVSxLQUFWLENBL0ZYO0FBZ0dXLGFBQUEsS0FBQSxHQUFRLGdCQUFSLENBaEdYO0FBaUdXLGFBQUEsV0FBQSxHQUFjLHNDQUFkLENBakdYO0tBQUE7Ozs7bUNBSW1COzs7QUFDWCxpQkFBSyxVQUFMLEdBQWtCLHdDQUFsQixDQURXO0FBRVgsZ0JBQU0sZUFBZSxtQkFBZixDQUZLO0FBR1gsZ0JBQU0sb0JBQW9CLG1CQUFwQixDQUhLO0FBS1gsaUJBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQixrQkFDZixZQURlLENBQ0YsSUFERSxFQUVmLFNBRmUsQ0FFTCxZQUFBO0FBQ1Asb0JBQU0sU0FBUyxLQUFLLFNBQUwsQ0FBZSxtQkFBZixFQUFULENBREM7QUFFUCxvQkFBTSxXQUFXLE9BQU8sdUJBQVAsRUFBWCxDQUZDO0FBR1AsNkJBQWEsSUFBYixDQUFrQixRQUFsQixFQUhPO2FBQUEsQ0FGZixFQUxXO0FBYVgsaUJBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQixXQUFLLG9CQUFMLENBQTBCLCtCQUExQixFQUNoQixVQUFDLENBQUQ7dUJBQU8sa0JBQWtCLElBQWxCLENBQXVCLElBQXZCO2FBQVAsQ0FESixFQWJXO0FBZ0JYLGlCQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsS0FBSyxRQUFMLENBQWMsY0FBZCxDQUE2QixVQUFTLEtBQVQsRUFBcUI7QUFDbEUsb0JBQUksTUFBTSxJQUFOLEtBQWUsNEJBQWYsSUFBK0MsTUFBTSxJQUFOLEtBQWUsMkJBQWYsRUFBNEM7QUFDM0Ysc0NBQWtCLElB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bmF0dXJlLWhlbHAuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBPYnNlcnZhYmxlLCBTdWJqZWN0IH0gZnJvbSBcInJ4anNcIjtcbmltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUsIERpc3Bvc2FibGUgfSBmcm9tIFwidHMtZGlzcG9zYWJsZXNcIjtcbmltcG9ydCB7IE9tbmkgfSBmcm9tIFwiLi4vc2VydmVyL29tbmlcIjtcbmltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcbmltcG9ydCB7IFNpZ25hdHVyZVZpZXcgfSBmcm9tIFwiLi4vdmlld3Mvc2lnbmF0dXJlLWhlbHAtdmlld1wiO1xuY2xhc3MgU2lnbmF0dXJlSGVscCB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMucmVxdWlyZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5kZWZhdWx0ID0gZmFsc2U7XG4gICAgICAgIHRoaXMudGl0bGUgPSBcIlNpZ25hdHVyZSBIZWxwXCI7XG4gICAgICAgIHRoaXMuZGVzY3JpcHRpb24gPSBcIkFkZHMgc2lnbmF0dXJlIGhlbHAgdG8gbWV0aG9kIGNhbGxzLlwiO1xuICAgIH1cbiAgICBhY3RpdmF0ZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgY29uc3QgaXNzdWVSZXF1ZXN0ID0gbmV3IFN1YmplY3QoKTtcbiAgICAgICAgY29uc3QgZGVsYXlJc3N1ZVJlcXVlc3QgPSBuZXcgU3ViamVjdCgpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGRlbGF5SXNzdWVSZXF1ZXN0XG4gICAgICAgICAgICAuZGVib3VuY2VUaW1lKDEwMDApXG4gICAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGVkaXRvciA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKTtcbiAgICAgICAgICAgIGNvbnN0IHBvc2l0aW9uID0gZWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKCk7XG4gICAgICAgICAgICBpc3N1ZVJlcXVlc3QubmV4dChwb3NpdGlvbik7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmFkZFRleHRFZGl0b3JDb21tYW5kKFwib21uaXNoYXJwLWF0b206c2lnbmF0dXJlLWhlbHBcIiwgKGUpID0+IGRlbGF5SXNzdWVSZXF1ZXN0Lm5leHQobnVsbCkpKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLm9uV2lsbERpc3BhdGNoKGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgaWYgKGV2ZW50LnR5cGUgPT09IFwiYXV0b2NvbXBsZXRlLXBsdXM6YWN0aXZhdGVcIiB8fCBldmVudC50eXBlID09PSBcImF1dG9jb21wbGV0ZS1wbHVzOmNvbmZpcm1cIikge1xuICAgICAgICAgICAgICAgIGRlbGF5SXNzdWVSZXF1ZXN0Lm5leHQobnVsbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pKTtcbiAgICAgICAgY29uc3Qgc2hvdWxkQ29udGludWUgPSBPYnNlcnZhYmxlLnppcChPbW5pLmxpc3RlbmVyLnNpZ25hdHVyZUhlbHAsIE9tbmkubGlzdGVuZXIuc2lnbmF0dXJlSGVscC5za2lwKDEpLnN0YXJ0V2l0aChudWxsKSwgKGN1cnJlbnQsIHByZXZpb3VzKSA9PiB7XG4gICAgICAgICAgICBpZiAocHJldmlvdXMgPT09IG51bGwpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICBpZiAoIWN1cnJlbnQucmVzcG9uc2UgfHwgIWN1cnJlbnQucmVzcG9uc2UuU2lnbmF0dXJlcyB8fCBjdXJyZW50LnJlc3BvbnNlLlNpZ25hdHVyZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGN1cnJlbnQucmVzcG9uc2UgJiYgY3VycmVudC5yZXNwb25zZS5TaWduYXR1cmVzICYmIHByZXZpb3VzLnJlc3BvbnNlICYmIHByZXZpb3VzLnJlc3BvbnNlLlNpZ25hdHVyZXMpIHtcbiAgICAgICAgICAgICAgICBpZiAoIV8uaXNFcXVhbChjdXJyZW50LnJlc3BvbnNlLlNpZ25hdHVyZXMsIHByZXZpb3VzLnJlc3BvbnNlLlNpZ25hdHVyZXMpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSlcbiAgICAgICAgICAgIC5wdWJsaXNoUmVwbGF5KDEpLnJlZkNvdW50KCk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoc2hvdWxkQ29udGludWVcbiAgICAgICAgICAgIC5maWx0ZXIoeiA9PiAheilcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoKCkgPT4gdGhpcy5fYnViYmxlICYmIHRoaXMuX2J1YmJsZS5kaXNwb3NlKCkpKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLnN3aXRjaEFjdGl2ZUVkaXRvcigoZWRpdG9yLCBjZCkgPT4ge1xuICAgICAgICAgICAgY2QuYWRkKGlzc3VlUmVxdWVzdFxuICAgICAgICAgICAgICAgIC5mbGF0TWFwKChwb3NpdGlvbikgPT4gT21uaS5yZXF1ZXN0KGVkaXRvciwgc29sdXRpb24gPT4gc29sdXRpb24uc2lnbmF0dXJlSGVscCh7XG4gICAgICAgICAgICAgICAgTGluZTogcG9zaXRpb24ucm93LFxuICAgICAgICAgICAgICAgIENvbHVtbjogcG9zaXRpb24uY29sdW1uLFxuICAgICAgICAgICAgfSkpXG4gICAgICAgICAgICAgICAgLnN3aXRjaE1hcCh4ID0+IHNob3VsZENvbnRpbnVlLmZpbHRlcih6ID0+IHopLCB4ID0+IHgpXG4gICAgICAgICAgICAgICAgLmZsYXRNYXAocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZSAmJiByZXNwb25zZS5TaWduYXR1cmVzICYmIHJlc3BvbnNlLlNpZ25hdHVyZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMuX2J1YmJsZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZGlzcG9zYWJsZSA9IGVkaXRvci5vbkRpZENoYW5nZUN1cnNvclBvc2l0aW9uKGV2ZW50ID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpc3N1ZVJlcXVlc3QubmV4dChldmVudC5uZXdCdWZmZXJQb3NpdGlvbik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNkLmFkZChkaXNwb3NhYmxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGRpc3Bvc2VyID0gRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9idWJibGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fYnViYmxlLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fYnViYmxlID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2J1YmJsZSA9IG5ldyBTaWduYXR1cmVCdWJibGUoZWRpdG9yLCBkaXNwb3Nlcik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fYnViYmxlLnVwZGF0ZShwb3NpdGlvbiwgcmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX2J1YmJsZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fYnViYmxlLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5lbXB0eSgpO1xuICAgICAgICAgICAgfSkpXG4gICAgICAgICAgICAgICAgLnN1YnNjcmliZSgpKTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGlzc3VlUmVxdWVzdCk7XG4gICAgfVxuICAgIGRpc3Bvc2UoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfVxufVxuZXhwb3J0IGNvbnN0IHNpZ25hdHVyZUhlbHAgPSBuZXcgU2lnbmF0dXJlSGVscDtcbmNsYXNzIFNpZ25hdHVyZUJ1YmJsZSB7XG4gICAgY29uc3RydWN0b3IoX2VkaXRvciwgZGlzcG9zZXIpIHtcbiAgICAgICAgdGhpcy5fZWRpdG9yID0gX2VkaXRvcjtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKGRpc3Bvc2VyKTtcbiAgICAgICAgY29uc3QgZWRpdG9yVmlldyA9IGF0b20udmlld3MuZ2V0VmlldyhfZWRpdG9yKTtcbiAgICAgICAgZWRpdG9yVmlldy5jbGFzc0xpc3QuYWRkKFwic2lnbmF0dXJlLWhlbHAtYWN0aXZlXCIpO1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XG4gICAgICAgICAgICBlZGl0b3JWaWV3LmNsYXNzTGlzdC5yZW1vdmUoXCJzaWduYXR1cmUtaGVscC1hY3RpdmVcIik7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXRleHQtZWRpdG9yOm5vdCguYXV0b2NvbXBsZXRlLWFjdGl2ZSkuc2lnbmF0dXJlLWhlbHAtYWN0aXZlXCIsIFwiY29yZTptb3ZlLXVwXCIsIChldmVudCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5fZWxlbWVudC5tb3ZlSW5kZXgoLTEpO1xuICAgICAgICAgICAgZXZlbnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXRleHQtZWRpdG9yOm5vdCguYXV0b2NvbXBsZXRlLWFjdGl2ZSkuc2lnbmF0dXJlLWhlbHAtYWN0aXZlXCIsIFwiY29yZTptb3ZlLWRvd25cIiwgKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICB0aGlzLl9lbGVtZW50Lm1vdmVJbmRleCgxKTtcbiAgICAgICAgICAgIGV2ZW50LnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS10ZXh0LWVkaXRvcjpub3QoLmF1dG9jb21wbGV0ZS1hY3RpdmUpLnNpZ25hdHVyZS1oZWxwLWFjdGl2ZVwiLCBcImNvcmU6Y2FuY2VsXCIsIChldmVudCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5kaXNwb3NlKCk7XG4gICAgICAgICAgICBldmVudC5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChhdG9tLmNvbmZpZy5vYnNlcnZlKFwiZWRpdG9yLmZvbnRTaXplXCIsIChzaXplKSA9PiB7XG4gICAgICAgICAgICBfLmRlZmVyKCgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLl9saW5lSGVpZ2h0ID0gX2VkaXRvci5nZXRMaW5lSGVpZ2h0SW5QaXhlbHMoKTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fZWxlbWVudClcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZWxlbWVudC5zZXRMaW5lSGVpZ2h0KHRoaXMuX2xpbmVIZWlnaHQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pKTtcbiAgICB9XG4gICAgdXBkYXRlKHBvc2l0aW9uLCBtZW1iZXIpIHtcbiAgICAgICAgdGhpcy5fcG9zaXRpb24gPSBwb3NpdGlvbjtcbiAgICAgICAgY29uc3QgcmFuZ2UgPSBbW3Bvc2l0aW9uLnJvdywgcG9zaXRpb24uY29sdW1uXSwgW3Bvc2l0aW9uLnJvdywgcG9zaXRpb24uY29sdW1uXV07XG4gICAgICAgIGlmICghdGhpcy5fbWFya2VyKSB7XG4gICAgICAgICAgICB0aGlzLl9tYXJrZXIgPSB0aGlzLl9lZGl0b3IubWFya0J1ZmZlclJhbmdlKHJhbmdlKTtcbiAgICAgICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLl9tYXJrZXIuZGVzdHJveSgpO1xuICAgICAgICAgICAgfSkpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fbWFya2VyLnNldEJ1ZmZlclJhbmdlKHJhbmdlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRoaXMuX2VsZW1lbnQgfHwgIXRoaXMuX2RlY29yYXRpb24pIHtcbiAgICAgICAgICAgIHRoaXMuX2VsZW1lbnQgPSBuZXcgU2lnbmF0dXJlVmlldygpO1xuICAgICAgICAgICAgdGhpcy5fZWxlbWVudC5zZXRMaW5lSGVpZ2h0KHRoaXMuX2xpbmVIZWlnaHQpO1xuICAgICAgICAgICAgdGhpcy5fZGVjb3JhdGlvbiA9IHRoaXMuX2VkaXRvci5kZWNvcmF0ZU1hcmtlcih0aGlzLl9tYXJrZXIsIHsgdHlwZTogXCJvdmVybGF5XCIsIGNsYXNzOiBgc2lnbmF0dXJlLWhlbHBgLCBpdGVtOiB0aGlzLl9lbGVtZW50LCBwb3NpdGlvbjogXCJoZWFkXCIgfSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLl9tZW1iZXIpIHtcbiAgICAgICAgICAgIHRoaXMuX3VwZGF0ZU1lbWJlcihtZW1iZXIpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChtZW1iZXIgJiYgdGhpcy5fbWVtYmVyLlNpZ25hdHVyZXMgJiYgbWVtYmVyLlNpZ25hdHVyZXMpIHtcbiAgICAgICAgICAgIGlmICghXy5pc0VxdWFsKG1lbWJlci5TaWduYXR1cmVzLCB0aGlzLl9tZW1iZXIuU2lnbmF0dXJlcykpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIV8uaXNFcXVhbChtZW1iZXIsIHRoaXMuX21lbWJlcikpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl91cGRhdGVNZW1iZXIobWVtYmVyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBfdXBkYXRlTWVtYmVyKG1lbWJlcikge1xuICAgICAgICB0aGlzLl9tZW1iZXIgPSBtZW1iZXI7XG4gICAgICAgIHRoaXMuX2VsZW1lbnQudXBkYXRlTWVtYmVyKG1lbWJlcik7XG4gICAgfVxuICAgIGRpc3Bvc2UoKSB7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgIH1cbn1cbiIsImltcG9ydCB7TW9kZWxzfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xyXG5pbXBvcnQge09ic2VydmFibGUsIFN1YmplY3R9IGZyb20gXCJyeGpzXCI7XHJcbmltcG9ydCB7Q29tcG9zaXRlRGlzcG9zYWJsZSwgRGlzcG9zYWJsZSwgSURpc3Bvc2FibGV9IGZyb20gXCJ0cy1kaXNwb3NhYmxlc1wiO1xyXG5pbXBvcnQge09tbml9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xyXG5pbXBvcnQgXyBmcm9tIFwibG9kYXNoXCI7XHJcbmltcG9ydCB7U2lnbmF0dXJlVmlld30gZnJvbSBcIi4uL3ZpZXdzL3NpZ25hdHVyZS1oZWxwLXZpZXdcIjtcclxuXHJcbmludGVyZmFjZSBJRGVjb3JhdGlvbiB7XHJcbiAgICBkZXN0cm95KCk6IHZvaWQ7XHJcbiAgICBnZXRNYXJrZXIoKTogQXRvbS5NYXJrZXI7XHJcbiAgICBnZXRQcm9wZXJ0aWVzKCk6IGFueTtcclxuICAgIHNldFByb3BlcnRpZXMocHJvcHM6IGFueSk6IGFueTtcclxufVxyXG5cclxuY2xhc3MgU2lnbmF0dXJlSGVscCBpbXBsZW1lbnRzIElGZWF0dXJlIHtcclxuICAgIHByaXZhdGUgZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxuICAgIHByaXZhdGUgX2J1YmJsZTogU2lnbmF0dXJlQnViYmxlO1xyXG5cclxuICAgIHB1YmxpYyBhY3RpdmF0ZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG4gICAgICAgIGNvbnN0IGlzc3VlUmVxdWVzdCA9IG5ldyBTdWJqZWN0PFRleHRCdWZmZXIuUG9pbnQ+KCk7XHJcbiAgICAgICAgY29uc3QgZGVsYXlJc3N1ZVJlcXVlc3QgPSBuZXcgU3ViamVjdDxhbnk+KCk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoZGVsYXlJc3N1ZVJlcXVlc3RcclxuICAgICAgICAgICAgLmRlYm91bmNlVGltZSgxMDAwKVxyXG4gICAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGVkaXRvciA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHBvc2l0aW9uID0gZWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKCk7XHJcbiAgICAgICAgICAgICAgICBpc3N1ZVJlcXVlc3QubmV4dChwb3NpdGlvbik7XHJcbiAgICAgICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmFkZFRleHRFZGl0b3JDb21tYW5kKFwib21uaXNoYXJwLWF0b206c2lnbmF0dXJlLWhlbHBcIixcclxuICAgICAgICAgICAgKGUpID0+IGRlbGF5SXNzdWVSZXF1ZXN0Lm5leHQobnVsbCkpKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLm9uV2lsbERpc3BhdGNoKGZ1bmN0aW9uKGV2ZW50OiBFdmVudCkge1xyXG4gICAgICAgICAgICBpZiAoZXZlbnQudHlwZSA9PT0gXCJhdXRvY29tcGxldGUtcGx1czphY3RpdmF0ZVwiIHx8IGV2ZW50LnR5cGUgPT09IFwiYXV0b2NvbXBsZXRlLXBsdXM6Y29uZmlybVwiKSB7XHJcbiAgICAgICAgICAgICAgICBkZWxheUlzc3VlUmVxdWVzdC5uZXh0KG51bGwpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICBjb25zdCBzaG91bGRDb250aW51ZSA9IE9ic2VydmFibGUuemlwKFxyXG4gICAgICAgICAgICBPbW5pLmxpc3RlbmVyLnNpZ25hdHVyZUhlbHAsXHJcbiAgICAgICAgICAgIE9tbmkubGlzdGVuZXIuc2lnbmF0dXJlSGVscC5za2lwKDEpLnN0YXJ0V2l0aChudWxsKSxcclxuICAgICAgICAgICAgKGN1cnJlbnQsIHByZXZpb3VzKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAocHJldmlvdXMgPT09IG51bGwpIHJldHVybiB0cnVlO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICghY3VycmVudC5yZXNwb25zZSB8fCAhY3VycmVudC5yZXNwb25zZS5TaWduYXR1cmVzIHx8IGN1cnJlbnQucmVzcG9uc2UuU2lnbmF0dXJlcy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGN1cnJlbnQucmVzcG9uc2UgJiYgY3VycmVudC5yZXNwb25zZS5TaWduYXR1cmVzICYmIHByZXZpb3VzLnJlc3BvbnNlICYmIHByZXZpb3VzLnJlc3BvbnNlLlNpZ25hdHVyZXMpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIV8uaXNFcXVhbChjdXJyZW50LnJlc3BvbnNlLlNpZ25hdHVyZXMsIHByZXZpb3VzLnJlc3BvbnNlLlNpZ25hdHVyZXMpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC5wdWJsaXNoUmVwbGF5KDEpLnJlZkNvdW50KCk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoc2hvdWxkQ29udGludWVcclxuICAgICAgICAgICAgLmZpbHRlcih6ID0+ICF6KVxyXG4gICAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHRoaXMuX2J1YmJsZSAmJiB0aGlzLl9idWJibGUuZGlzcG9zZSgpKSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5zd2l0Y2hBY3RpdmVFZGl0b3IoKGVkaXRvciwgY2QpID0+IHtcclxuICAgICAgICAgICAgY2QuYWRkKGlzc3VlUmVxdWVzdFxyXG4gICAgICAgICAgICAgICAgLmZsYXRNYXAoKHBvc2l0aW9uOiBUZXh0QnVmZmVyLlBvaW50KSA9PlxyXG4gICAgICAgICAgICAgICAgICAgIE9tbmkucmVxdWVzdChlZGl0b3IsIHNvbHV0aW9uID0+IHNvbHV0aW9uLnNpZ25hdHVyZUhlbHAoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBMaW5lOiBwb3NpdGlvbi5yb3csXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIENvbHVtbjogcG9zaXRpb24uY29sdW1uLFxyXG4gICAgICAgICAgICAgICAgICAgIH0pKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuc3dpdGNoTWFwKHggPT4gc2hvdWxkQ29udGludWUuZmlsdGVyKHogPT4geiksIHggPT4geClcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmZsYXRNYXAocmVzcG9uc2UgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlICYmIHJlc3BvbnNlLlNpZ25hdHVyZXMgJiYgcmVzcG9uc2UuU2lnbmF0dXJlcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGlzLl9idWJibGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZGlzcG9zYWJsZSA9IGVkaXRvci5vbkRpZENoYW5nZUN1cnNvclBvc2l0aW9uKGV2ZW50ID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzc3VlUmVxdWVzdC5uZXh0KGV2ZW50Lm5ld0J1ZmZlclBvc2l0aW9uKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNkLmFkZChkaXNwb3NhYmxlKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGRpc3Bvc2VyID0gRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX2J1YmJsZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2J1YmJsZS5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fYnViYmxlID0gbnVsbDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2J1YmJsZSA9IG5ldyBTaWduYXR1cmVCdWJibGUoZWRpdG9yLCBkaXNwb3Nlcik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2J1YmJsZS51cGRhdGUocG9zaXRpb24sIHJlc3BvbnNlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX2J1YmJsZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9idWJibGUuZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5lbXB0eTxhbnk+KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pKVxyXG4gICAgICAgICAgICAgICAgLnN1YnNjcmliZSgpKTtcclxuICAgICAgICB9KSk7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChpc3N1ZVJlcXVlc3QpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkaXNwb3NlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlcXVpcmVkID0gZmFsc2U7XHJcbiAgICBwdWJsaWMgZGVmYXVsdCA9IGZhbHNlO1xyXG4gICAgcHVibGljIHRpdGxlID0gXCJTaWduYXR1cmUgSGVscFwiO1xyXG4gICAgcHVibGljIGRlc2NyaXB0aW9uID0gXCJBZGRzIHNpZ25hdHVyZSBoZWxwIHRvIG1ldGhvZCBjYWxscy5cIjtcclxufVxyXG5leHBvcnQgY29uc3Qgc2lnbmF0dXJlSGVscCA9IG5ldyBTaWduYXR1cmVIZWxwO1xyXG5cclxuY2xhc3MgU2lnbmF0dXJlQnViYmxlIGltcGxlbWVudHMgSURpc3Bvc2FibGUge1xyXG4gICAgcHJpdmF0ZSBfZGVjb3JhdGlvbjogSURlY29yYXRpb247XHJcbiAgICBwcml2YXRlIF9kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgIHByaXZhdGUgX2VsZW1lbnQ6IFNpZ25hdHVyZVZpZXc7XHJcbiAgICBwcml2YXRlIF9tYXJrZXI6IEF0b20uTWFya2VyO1xyXG4gICAgcHJpdmF0ZSBfcG9zaXRpb246IFRleHRCdWZmZXIuUG9pbnQ7XHJcbiAgICBwcml2YXRlIF9tZW1iZXI6IE1vZGVscy5TaWduYXR1cmVIZWxwO1xyXG4gICAgcHJpdmF0ZSBfbGluZUhlaWdodDogbnVtYmVyO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgX2VkaXRvcjogQXRvbS5UZXh0RWRpdG9yLCBkaXNwb3NlcjogSURpc3Bvc2FibGUpIHtcclxuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChkaXNwb3Nlcik7XHJcblxyXG4gICAgICAgIGNvbnN0IGVkaXRvclZpZXc6IEhUTUxFbGVtZW50ID0gPGFueT5hdG9tLnZpZXdzLmdldFZpZXcoX2VkaXRvcik7XHJcbiAgICAgICAgZWRpdG9yVmlldy5jbGFzc0xpc3QuYWRkKFwic2lnbmF0dXJlLWhlbHAtYWN0aXZlXCIpO1xyXG5cclxuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XHJcbiAgICAgICAgICAgIGVkaXRvclZpZXcuY2xhc3NMaXN0LnJlbW92ZShcInNpZ25hdHVyZS1oZWxwLWFjdGl2ZVwiKTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKFxyXG4gICAgICAgICAgICBhdG9tLmNvbW1hbmRzLmFkZChcImF0b20tdGV4dC1lZGl0b3I6bm90KC5hdXRvY29tcGxldGUtYWN0aXZlKS5zaWduYXR1cmUtaGVscC1hY3RpdmVcIixcclxuICAgICAgICAgICAgICAgIFwiY29yZTptb3ZlLXVwXCIsIChldmVudCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2VsZW1lbnQubW92ZUluZGV4KC0xKTtcclxuICAgICAgICAgICAgICAgICAgICBldmVudC5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcclxuICAgICAgICAgICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoXHJcbiAgICAgICAgICAgIGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS10ZXh0LWVkaXRvcjpub3QoLmF1dG9jb21wbGV0ZS1hY3RpdmUpLnNpZ25hdHVyZS1oZWxwLWFjdGl2ZVwiLFxyXG4gICAgICAgICAgICAgICAgXCJjb3JlOm1vdmUtZG93blwiLCAoZXZlbnQpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9lbGVtZW50Lm1vdmVJbmRleCgxKTtcclxuICAgICAgICAgICAgICAgICAgICBldmVudC5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcclxuICAgICAgICAgICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoXHJcbiAgICAgICAgICAgIGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS10ZXh0LWVkaXRvcjpub3QoLmF1dG9jb21wbGV0ZS1hY3RpdmUpLnNpZ25hdHVyZS1oZWxwLWFjdGl2ZVwiLFxyXG4gICAgICAgICAgICAgICAgXCJjb3JlOmNhbmNlbFwiLCAoZXZlbnQpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgICAgICAgICBldmVudC5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcclxuICAgICAgICAgICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoYXRvbS5jb25maWcub2JzZXJ2ZShcImVkaXRvci5mb250U2l6ZVwiLCAoc2l6ZTogbnVtYmVyKSA9PiB7XHJcbiAgICAgICAgICAgIF8uZGVmZXIoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fbGluZUhlaWdodCA9IF9lZGl0b3IuZ2V0TGluZUhlaWdodEluUGl4ZWxzKCk7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fZWxlbWVudClcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9lbGVtZW50LnNldExpbmVIZWlnaHQodGhpcy5fbGluZUhlaWdodCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgdXBkYXRlKHBvc2l0aW9uOiBUZXh0QnVmZmVyLlBvaW50LCBtZW1iZXI6IE1vZGVscy5TaWduYXR1cmVIZWxwKSB7XHJcbiAgICAgICAgdGhpcy5fcG9zaXRpb24gPSBwb3NpdGlvbjtcclxuICAgICAgICBjb25zdCByYW5nZSA9IFtbcG9zaXRpb24ucm93LCBwb3NpdGlvbi5jb2x1bW5dLCBbcG9zaXRpb24ucm93LCBwb3NpdGlvbi5jb2x1bW5dXTtcclxuICAgICAgICBpZiAoIXRoaXMuX21hcmtlcikge1xyXG4gICAgICAgICAgICB0aGlzLl9tYXJrZXIgPSAoPGFueT50aGlzLl9lZGl0b3IpLm1hcmtCdWZmZXJSYW5nZShyYW5nZS8qLCB7IGludmFsaWRhdGU6IFwiaW5zaWRlXCIgfSovKTtcclxuICAgICAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fbWFya2VyLmRlc3Ryb3koKTtcclxuICAgICAgICAgICAgfSkpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuX21hcmtlci5zZXRCdWZmZXJSYW5nZSg8YW55PnJhbmdlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghdGhpcy5fZWxlbWVudCB8fCAhdGhpcy5fZGVjb3JhdGlvbikge1xyXG4gICAgICAgICAgICB0aGlzLl9lbGVtZW50ID0gbmV3IFNpZ25hdHVyZVZpZXcoKTtcclxuICAgICAgICAgICAgdGhpcy5fZWxlbWVudC5zZXRMaW5lSGVpZ2h0KHRoaXMuX2xpbmVIZWlnaHQpO1xyXG4gICAgICAgICAgICB0aGlzLl9kZWNvcmF0aW9uID0gPGFueT50aGlzLl9lZGl0b3IuZGVjb3JhdGVNYXJrZXIodGhpcy5fbWFya2VyLCB7IHR5cGU6IFwib3ZlcmxheVwiLCBjbGFzczogYHNpZ25hdHVyZS1oZWxwYCwgaXRlbTogdGhpcy5fZWxlbWVudCwgcG9zaXRpb246IFwiaGVhZFwiIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCF0aGlzLl9tZW1iZXIpIHtcclxuICAgICAgICAgICAgdGhpcy5fdXBkYXRlTWVtYmVyKG1lbWJlcik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAobWVtYmVyICYmIHRoaXMuX21lbWJlci5TaWduYXR1cmVzICYmIG1lbWJlci5TaWduYXR1cmVzKSB7XHJcbiAgICAgICAgICAgIGlmICghXy5pc0VxdWFsKG1lbWJlci5TaWduYXR1cmVzLCB0aGlzLl9tZW1iZXIuU2lnbmF0dXJlcykpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIV8uaXNFcXVhbChtZW1iZXIsIHRoaXMuX21lbWJlcikpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX3VwZGF0ZU1lbWJlcihtZW1iZXIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF91cGRhdGVNZW1iZXIobWVtYmVyOiBNb2RlbHMuU2lnbmF0dXJlSGVscCkge1xyXG4gICAgICAgIHRoaXMuX21lbWJlciA9IG1lbWJlcjtcclxuICAgICAgICB0aGlzLl9lbGVtZW50LnVwZGF0ZU1lbWJlcihtZW1iZXIpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkaXNwb3NlKCkge1xyXG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgfVxyXG59XHJcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
