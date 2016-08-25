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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9zaWduYXR1cmUtaGVscC5qcyIsImxpYi9mZWF0dXJlcy9zaWduYXR1cmUtaGVscC50cyJdLCJuYW1lcyI6WyJTaWduYXR1cmVIZWxwIiwicmVxdWlyZWQiLCJkZWZhdWx0IiwidGl0bGUiLCJkZXNjcmlwdGlvbiIsImRpc3Bvc2FibGUiLCJpc3N1ZVJlcXVlc3QiLCJkZWxheUlzc3VlUmVxdWVzdCIsImFkZCIsImRlYm91bmNlVGltZSIsInN1YnNjcmliZSIsImVkaXRvciIsImF0b20iLCJ3b3Jrc3BhY2UiLCJnZXRBY3RpdmVUZXh0RWRpdG9yIiwicG9zaXRpb24iLCJnZXRDdXJzb3JCdWZmZXJQb3NpdGlvbiIsIm5leHQiLCJhZGRUZXh0RWRpdG9yQ29tbWFuZCIsImUiLCJjb21tYW5kcyIsIm9uV2lsbERpc3BhdGNoIiwiZXZlbnQiLCJ0eXBlIiwic2hvdWxkQ29udGludWUiLCJ6aXAiLCJsaXN0ZW5lciIsInNpZ25hdHVyZUhlbHAiLCJza2lwIiwic3RhcnRXaXRoIiwiY3VycmVudCIsInByZXZpb3VzIiwicmVzcG9uc2UiLCJTaWduYXR1cmVzIiwibGVuZ3RoIiwiaXNFcXVhbCIsInB1Ymxpc2hSZXBsYXkiLCJyZWZDb3VudCIsImZpbHRlciIsInoiLCJfYnViYmxlIiwiZGlzcG9zZSIsInN3aXRjaEFjdGl2ZUVkaXRvciIsImNkIiwiZmxhdE1hcCIsInJlcXVlc3QiLCJzb2x1dGlvbiIsIkxpbmUiLCJyb3ciLCJDb2x1bW4iLCJjb2x1bW4iLCJzd2l0Y2hNYXAiLCJ4Iiwib25EaWRDaGFuZ2VDdXJzb3JQb3NpdGlvbiIsIm5ld0J1ZmZlclBvc2l0aW9uIiwiZGlzcG9zZXIiLCJjcmVhdGUiLCJTaWduYXR1cmVCdWJibGUiLCJ1cGRhdGUiLCJlbXB0eSIsIl9lZGl0b3IiLCJfZGlzcG9zYWJsZSIsImVkaXRvclZpZXciLCJ2aWV3cyIsImdldFZpZXciLCJjbGFzc0xpc3QiLCJyZW1vdmUiLCJfZWxlbWVudCIsIm1vdmVJbmRleCIsInN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbiIsImNvbmZpZyIsIm9ic2VydmUiLCJzaXplIiwiZGVmZXIiLCJfbGluZUhlaWdodCIsImdldExpbmVIZWlnaHRJblBpeGVscyIsInNldExpbmVIZWlnaHQiLCJtZW1iZXIiLCJfcG9zaXRpb24iLCJyYW5nZSIsIl9tYXJrZXIiLCJtYXJrQnVmZmVyUmFuZ2UiLCJkZXN0cm95Iiwic2V0QnVmZmVyUmFuZ2UiLCJfZGVjb3JhdGlvbiIsImRlY29yYXRlTWFya2VyIiwiY2xhc3MiLCJpdGVtIiwiX21lbWJlciIsIl91cGRhdGVNZW1iZXIiLCJ1cGRhdGVNZW1iZXIiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQUNBOztBQUNBOztBQUNBOzs7O0FBQ0E7Ozs7OztJQ1VBQSxhO0FBQUEsNkJBQUE7QUFBQTs7QUE4RlcsYUFBQUMsUUFBQSxHQUFXLEtBQVg7QUFDQSxhQUFBQyxPQUFBLEdBQVUsS0FBVjtBQUNBLGFBQUFDLEtBQUEsR0FBUSxnQkFBUjtBQUNBLGFBQUFDLFdBQUEsR0FBYyxzQ0FBZDtBQUNWOzs7O21DQTlGa0I7QUFBQTs7QUFDWCxpQkFBS0MsVUFBTCxHQUFrQix3Q0FBbEI7QUFDQSxnQkFBTUMsZUFBZSxtQkFBckI7QUFDQSxnQkFBTUMsb0JBQW9CLG1CQUExQjtBQUVBLGlCQUFLRixVQUFMLENBQWdCRyxHQUFoQixDQUFvQkQsa0JBQ2ZFLFlBRGUsQ0FDRixJQURFLEVBRWZDLFNBRmUsQ0FFTCxZQUFBO0FBQ1Asb0JBQU1DLFNBQVNDLEtBQUtDLFNBQUwsQ0FBZUMsbUJBQWYsRUFBZjtBQUNBLG9CQUFNQyxXQUFXSixPQUFPSyx1QkFBUCxFQUFqQjtBQUNBViw2QkFBYVcsSUFBYixDQUFrQkYsUUFBbEI7QUFDSCxhQU5lLENBQXBCO0FBUUEsaUJBQUtWLFVBQUwsQ0FBZ0JHLEdBQWhCLENBQW9CLFdBQUtVLG9CQUFMLENBQTBCLCtCQUExQixFQUNoQixVQUFDQyxDQUFEO0FBQUEsdUJBQU9aLGtCQUFrQlUsSUFBbEIsQ0FBdUIs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T0FBRixDQUFVMEMsT0FBTzVDLFVBQWpCLEVBQTZCLEtBQUt1RCxPQUFMLENBQWF2RCxVQUExQyxDQUFMLEVBQTREO0FBQ3hELHlCQUFLUSxPQUFMO0FBQ0E7QUFDSDtBQUVELG9CQUFJLENBQUMsaUJBQUVOLE9BQUYsQ0FBVTBDLE1BQVYsRUFBa0IsS0FBS1csT0FBdkIsQ0FBTCxFQUFzQztBQUNsQyx5QkFBS0MsYUFBTCxDQUFtQlosTUFBbkI7QUFDSDtBQUNKO0FBRUo7OztzQ0FFcUJBLE0sRUFBNEI7QUFDOUMsaUJBQUtXLE9BQUwsR0FBZVgsTUFBZjtBQUNBLGlCQUFLVixRQUFMLENBQWN1QixZQUFkLENBQTJCYixNQUEzQjtBQUNIOzs7a0NBRWE7QUFDVixpQkFBS2hCLFdBQUwsQ0FBaUJwQixPQUFqQjtBQUNIIiwiZmlsZSI6ImxpYi9mZWF0dXJlcy9zaWduYXR1cmUtaGVscC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE9ic2VydmFibGUsIFN1YmplY3QgfSBmcm9tIFwicnhqc1wiO1xuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSwgRGlzcG9zYWJsZSB9IGZyb20gXCJ0cy1kaXNwb3NhYmxlc1wiO1xuaW1wb3J0IHsgT21uaSB9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xuaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xuaW1wb3J0IHsgU2lnbmF0dXJlVmlldyB9IGZyb20gXCIuLi92aWV3cy9zaWduYXR1cmUtaGVscC12aWV3XCI7XG5jbGFzcyBTaWduYXR1cmVIZWxwIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5yZXF1aXJlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLmRlZmF1bHQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy50aXRsZSA9IFwiU2lnbmF0dXJlIEhlbHBcIjtcbiAgICAgICAgdGhpcy5kZXNjcmlwdGlvbiA9IFwiQWRkcyBzaWduYXR1cmUgaGVscCB0byBtZXRob2QgY2FsbHMuXCI7XG4gICAgfVxuICAgIGFjdGl2YXRlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICBjb25zdCBpc3N1ZVJlcXVlc3QgPSBuZXcgU3ViamVjdCgpO1xuICAgICAgICBjb25zdCBkZWxheUlzc3VlUmVxdWVzdCA9IG5ldyBTdWJqZWN0KCk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoZGVsYXlJc3N1ZVJlcXVlc3RcbiAgICAgICAgICAgIC5kZWJvdW5jZVRpbWUoMTAwMClcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgZWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpO1xuICAgICAgICAgICAgY29uc3QgcG9zaXRpb24gPSBlZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKTtcbiAgICAgICAgICAgIGlzc3VlUmVxdWVzdC5uZXh0KHBvc2l0aW9uKTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuYWRkVGV4dEVkaXRvckNvbW1hbmQoXCJvbW5pc2hhcnAtYXRvbTpzaWduYXR1cmUtaGVscFwiLCAoZSkgPT4gZGVsYXlJc3N1ZVJlcXVlc3QubmV4dChudWxsKSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMub25XaWxsRGlzcGF0Y2goZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICBpZiAoZXZlbnQudHlwZSA9PT0gXCJhdXRvY29tcGxldGUtcGx1czphY3RpdmF0ZVwiIHx8IGV2ZW50LnR5cGUgPT09IFwiYXV0b2NvbXBsZXRlLXBsdXM6Y29uZmlybVwiKSB7XG4gICAgICAgICAgICAgICAgZGVsYXlJc3N1ZVJlcXVlc3QubmV4dChudWxsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSkpO1xuICAgICAgICBjb25zdCBzaG91bGRDb250aW51ZSA9IE9ic2VydmFibGUuemlwKE9tbmkubGlzdGVuZXIuc2lnbmF0dXJlSGVscCwgT21uaS5saXN0ZW5lci5zaWduYXR1cmVIZWxwLnNraXAoMSkuc3RhcnRXaXRoKG51bGwpLCAoY3VycmVudCwgcHJldmlvdXMpID0+IHtcbiAgICAgICAgICAgIGlmIChwcmV2aW91cyA9PT0gbnVsbClcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIGlmICghY3VycmVudC5yZXNwb25zZSB8fCAhY3VycmVudC5yZXNwb25zZS5TaWduYXR1cmVzIHx8IGN1cnJlbnQucmVzcG9uc2UuU2lnbmF0dXJlcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoY3VycmVudC5yZXNwb25zZSAmJiBjdXJyZW50LnJlc3BvbnNlLlNpZ25hdHVyZXMgJiYgcHJldmlvdXMucmVzcG9uc2UgJiYgcHJldmlvdXMucmVzcG9uc2UuU2lnbmF0dXJlcykge1xuICAgICAgICAgICAgICAgIGlmICghXy5pc0VxdWFsKGN1cnJlbnQucmVzcG9uc2UuU2lnbmF0dXJlcywgcHJldmlvdXMucmVzcG9uc2UuU2lnbmF0dXJlcykpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9KVxuICAgICAgICAgICAgLnB1Ymxpc2hSZXBsYXkoMSkucmVmQ291bnQoKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChzaG91bGRDb250aW51ZVxuICAgICAgICAgICAgLmZpbHRlcih6ID0+ICF6KVxuICAgICAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB0aGlzLl9idWJibGUgJiYgdGhpcy5fYnViYmxlLmRpc3Bvc2UoKSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuc3dpdGNoQWN0aXZlRWRpdG9yKChlZGl0b3IsIGNkKSA9PiB7XG4gICAgICAgICAgICBjZC5hZGQoaXNzdWVSZXF1ZXN0XG4gICAgICAgICAgICAgICAgLmZsYXRNYXAoKHBvc2l0aW9uKSA9PiBPbW5pLnJlcXVlc3QoZWRpdG9yLCBzb2x1dGlvbiA9PiBzb2x1dGlvbi5zaWduYXR1cmVIZWxwKHtcbiAgICAgICAgICAgICAgICBMaW5lOiBwb3NpdGlvbi5yb3csXG4gICAgICAgICAgICAgICAgQ29sdW1uOiBwb3NpdGlvbi5jb2x1bW4sXG4gICAgICAgICAgICB9KSlcbiAgICAgICAgICAgICAgICAuc3dpdGNoTWFwKHggPT4gc2hvdWxkQ29udGludWUuZmlsdGVyKHogPT4geiksIHggPT4geClcbiAgICAgICAgICAgICAgICAuZmxhdE1hcChyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlICYmIHJlc3BvbnNlLlNpZ25hdHVyZXMgJiYgcmVzcG9uc2UuU2lnbmF0dXJlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghdGhpcy5fYnViYmxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBkaXNwb3NhYmxlID0gZWRpdG9yLm9uRGlkQ2hhbmdlQ3Vyc29yUG9zaXRpb24oZXZlbnQgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzc3VlUmVxdWVzdC5uZXh0KGV2ZW50Lm5ld0J1ZmZlclBvc2l0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2QuYWRkKGRpc3Bvc2FibGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZGlzcG9zZXIgPSBEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX2J1YmJsZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9idWJibGUuZGlzcG9zZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9idWJibGUgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fYnViYmxlID0gbmV3IFNpZ25hdHVyZUJ1YmJsZShlZGl0b3IsIGRpc3Bvc2VyKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9idWJibGUudXBkYXRlKHBvc2l0aW9uLCByZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fYnViYmxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9idWJibGUuZGlzcG9zZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmVtcHR5KCk7XG4gICAgICAgICAgICB9KSlcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKCkpO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoaXNzdWVSZXF1ZXN0KTtcbiAgICB9XG4gICAgZGlzcG9zZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICB9XG59XG5leHBvcnQgY29uc3Qgc2lnbmF0dXJlSGVscCA9IG5ldyBTaWduYXR1cmVIZWxwO1xuY2xhc3MgU2lnbmF0dXJlQnViYmxlIHtcbiAgICBjb25zdHJ1Y3RvcihfZWRpdG9yLCBkaXNwb3Nlcikge1xuICAgICAgICB0aGlzLl9lZGl0b3IgPSBfZWRpdG9yO1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoZGlzcG9zZXIpO1xuICAgICAgICBjb25zdCBlZGl0b3JWaWV3ID0gYXRvbS52aWV3cy5nZXRWaWV3KF9lZGl0b3IpO1xuICAgICAgICBlZGl0b3JWaWV3LmNsYXNzTGlzdC5hZGQoXCJzaWduYXR1cmUtaGVscC1hY3RpdmVcIik7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcbiAgICAgICAgICAgIGVkaXRvclZpZXcuY2xhc3NMaXN0LnJlbW92ZShcInNpZ25hdHVyZS1oZWxwLWFjdGl2ZVwiKTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20tdGV4dC1lZGl0b3I6bm90KC5hdXRvY29tcGxldGUtYWN0aXZlKS5zaWduYXR1cmUtaGVscC1hY3RpdmVcIiwgXCJjb3JlOm1vdmUtdXBcIiwgKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICB0aGlzLl9lbGVtZW50Lm1vdmVJbmRleCgtMSk7XG4gICAgICAgICAgICBldmVudC5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20tdGV4dC1lZGl0b3I6bm90KC5hdXRvY29tcGxldGUtYWN0aXZlKS5zaWduYXR1cmUtaGVscC1hY3RpdmVcIiwgXCJjb3JlOm1vdmUtZG93blwiLCAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIHRoaXMuX2VsZW1lbnQubW92ZUluZGV4KDEpO1xuICAgICAgICAgICAgZXZlbnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXRleHQtZWRpdG9yOm5vdCguYXV0b2NvbXBsZXRlLWFjdGl2ZSkuc2lnbmF0dXJlLWhlbHAtYWN0aXZlXCIsIFwiY29yZTpjYW5jZWxcIiwgKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICB0aGlzLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgIGV2ZW50LnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoXCJlZGl0b3IuZm9udFNpemVcIiwgKHNpemUpID0+IHtcbiAgICAgICAgICAgIF8uZGVmZXIoKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuX2xpbmVIZWlnaHQgPSBfZWRpdG9yLmdldExpbmVIZWlnaHRJblBpeGVscygpO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9lbGVtZW50KVxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9lbGVtZW50LnNldExpbmVIZWlnaHQodGhpcy5fbGluZUhlaWdodCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSkpO1xuICAgIH1cbiAgICB1cGRhdGUocG9zaXRpb24sIG1lbWJlcikge1xuICAgICAgICB0aGlzLl9wb3NpdGlvbiA9IHBvc2l0aW9uO1xuICAgICAgICBjb25zdCByYW5nZSA9IFtbcG9zaXRpb24ucm93LCBwb3NpdGlvbi5jb2x1bW5dLCBbcG9zaXRpb24ucm93LCBwb3NpdGlvbi5jb2x1bW5dXTtcbiAgICAgICAgaWYgKCF0aGlzLl9tYXJrZXIpIHtcbiAgICAgICAgICAgIHRoaXMuX21hcmtlciA9IHRoaXMuX2VkaXRvci5tYXJrQnVmZmVyUmFuZ2UocmFuZ2UpO1xuICAgICAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuX21hcmtlci5kZXN0cm95KCk7XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9tYXJrZXIuc2V0QnVmZmVyUmFuZ2UocmFuZ2UpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdGhpcy5fZWxlbWVudCB8fCAhdGhpcy5fZGVjb3JhdGlvbikge1xuICAgICAgICAgICAgdGhpcy5fZWxlbWVudCA9IG5ldyBTaWduYXR1cmVWaWV3KCk7XG4gICAgICAgICAgICB0aGlzLl9lbGVtZW50LnNldExpbmVIZWlnaHQodGhpcy5fbGluZUhlaWdodCk7XG4gICAgICAgICAgICB0aGlzLl9kZWNvcmF0aW9uID0gdGhpcy5fZWRpdG9yLmRlY29yYXRlTWFya2VyKHRoaXMuX21hcmtlciwgeyB0eXBlOiBcIm92ZXJsYXlcIiwgY2xhc3M6IGBzaWduYXR1cmUtaGVscGAsIGl0ZW06IHRoaXMuX2VsZW1lbnQsIHBvc2l0aW9uOiBcImhlYWRcIiB9KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRoaXMuX21lbWJlcikge1xuICAgICAgICAgICAgdGhpcy5fdXBkYXRlTWVtYmVyKG1lbWJlcik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG1lbWJlciAmJiB0aGlzLl9tZW1iZXIuU2lnbmF0dXJlcyAmJiBtZW1iZXIuU2lnbmF0dXJlcykge1xuICAgICAgICAgICAgaWYgKCFfLmlzRXF1YWwobWVtYmVyLlNpZ25hdHVyZXMsIHRoaXMuX21lbWJlci5TaWduYXR1cmVzKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zZSgpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghXy5pc0VxdWFsKG1lbWJlciwgdGhpcy5fbWVtYmVyKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3VwZGF0ZU1lbWJlcihtZW1iZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIF91cGRhdGVNZW1iZXIobWVtYmVyKSB7XG4gICAgICAgIHRoaXMuX21lbWJlciA9IG1lbWJlcjtcbiAgICAgICAgdGhpcy5fZWxlbWVudC51cGRhdGVNZW1iZXIobWVtYmVyKTtcbiAgICB9XG4gICAgZGlzcG9zZSgpIHtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfVxufVxuIiwiaW1wb3J0IHtNb2RlbHN9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XHJcbmltcG9ydCB7T2JzZXJ2YWJsZSwgU3ViamVjdH0gZnJvbSBcInJ4anNcIjtcclxuaW1wb3J0IHtDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlLCBJRGlzcG9zYWJsZX0gZnJvbSBcInRzLWRpc3Bvc2FibGVzXCI7XHJcbmltcG9ydCB7T21uaX0gZnJvbSBcIi4uL3NlcnZlci9vbW5pXCI7XHJcbmltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcclxuaW1wb3J0IHtTaWduYXR1cmVWaWV3fSBmcm9tIFwiLi4vdmlld3Mvc2lnbmF0dXJlLWhlbHAtdmlld1wiO1xyXG5cclxuaW50ZXJmYWNlIElEZWNvcmF0aW9uIHtcclxuICAgIGRlc3Ryb3koKTogdm9pZDtcclxuICAgIGdldE1hcmtlcigpOiBBdG9tLk1hcmtlcjtcclxuICAgIGdldFByb3BlcnRpZXMoKTogYW55O1xyXG4gICAgc2V0UHJvcGVydGllcyhwcm9wczogYW55KTogYW55O1xyXG59XHJcblxyXG5jbGFzcyBTaWduYXR1cmVIZWxwIGltcGxlbWVudHMgSUZlYXR1cmUge1xyXG4gICAgcHJpdmF0ZSBkaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xyXG4gICAgcHJpdmF0ZSBfYnViYmxlOiBTaWduYXR1cmVCdWJibGU7XHJcblxyXG4gICAgcHVibGljIGFjdGl2YXRlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcbiAgICAgICAgY29uc3QgaXNzdWVSZXF1ZXN0ID0gbmV3IFN1YmplY3Q8VGV4dEJ1ZmZlci5Qb2ludD4oKTtcclxuICAgICAgICBjb25zdCBkZWxheUlzc3VlUmVxdWVzdCA9IG5ldyBTdWJqZWN0PGFueT4oKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChkZWxheUlzc3VlUmVxdWVzdFxyXG4gICAgICAgICAgICAuZGVib3VuY2VUaW1lKDEwMDApXHJcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcG9zaXRpb24gPSBlZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKTtcclxuICAgICAgICAgICAgICAgIGlzc3VlUmVxdWVzdC5uZXh0KHBvc2l0aW9uKTtcclxuICAgICAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuYWRkVGV4dEVkaXRvckNvbW1hbmQoXCJvbW5pc2hhcnAtYXRvbTpzaWduYXR1cmUtaGVscFwiLFxyXG4gICAgICAgICAgICAoZSkgPT4gZGVsYXlJc3N1ZVJlcXVlc3QubmV4dChudWxsKSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMub25XaWxsRGlzcGF0Y2goZnVuY3Rpb24oZXZlbnQ6IEV2ZW50KSB7XHJcbiAgICAgICAgICAgIGlmIChldmVudC50eXBlID09PSBcImF1dG9jb21wbGV0ZS1wbHVzOmFjdGl2YXRlXCIgfHwgZXZlbnQudHlwZSA9PT0gXCJhdXRvY29tcGxldGUtcGx1czpjb25maXJtXCIpIHtcclxuICAgICAgICAgICAgICAgIGRlbGF5SXNzdWVSZXF1ZXN0Lm5leHQobnVsbCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIGNvbnN0IHNob3VsZENvbnRpbnVlID0gT2JzZXJ2YWJsZS56aXAoXHJcbiAgICAgICAgICAgIE9tbmkubGlzdGVuZXIuc2lnbmF0dXJlSGVscCxcclxuICAgICAgICAgICAgT21uaS5saXN0ZW5lci5zaWduYXR1cmVIZWxwLnNraXAoMSkuc3RhcnRXaXRoKG51bGwpLFxyXG4gICAgICAgICAgICAoY3VycmVudCwgcHJldmlvdXMpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmIChwcmV2aW91cyA9PT0gbnVsbCkgcmV0dXJuIHRydWU7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCFjdXJyZW50LnJlc3BvbnNlIHx8ICFjdXJyZW50LnJlc3BvbnNlLlNpZ25hdHVyZXMgfHwgY3VycmVudC5yZXNwb25zZS5TaWduYXR1cmVzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoY3VycmVudC5yZXNwb25zZSAmJiBjdXJyZW50LnJlc3BvbnNlLlNpZ25hdHVyZXMgJiYgcHJldmlvdXMucmVzcG9uc2UgJiYgcHJldmlvdXMucmVzcG9uc2UuU2lnbmF0dXJlcykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghXy5pc0VxdWFsKGN1cnJlbnQucmVzcG9uc2UuU2lnbmF0dXJlcywgcHJldmlvdXMucmVzcG9uc2UuU2lnbmF0dXJlcykpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgLnB1Ymxpc2hSZXBsYXkoMSkucmVmQ291bnQoKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChzaG91bGRDb250aW51ZVxyXG4gICAgICAgICAgICAuZmlsdGVyKHogPT4gIXopXHJcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoKCkgPT4gdGhpcy5fYnViYmxlICYmIHRoaXMuX2J1YmJsZS5kaXNwb3NlKCkpKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLnN3aXRjaEFjdGl2ZUVkaXRvcigoZWRpdG9yLCBjZCkgPT4ge1xyXG4gICAgICAgICAgICBjZC5hZGQoaXNzdWVSZXF1ZXN0XHJcbiAgICAgICAgICAgICAgICAuZmxhdE1hcCgocG9zaXRpb246IFRleHRCdWZmZXIuUG9pbnQpID0+XHJcbiAgICAgICAgICAgICAgICAgICAgT21uaS5yZXF1ZXN0KGVkaXRvciwgc29sdXRpb24gPT4gc29sdXRpb24uc2lnbmF0dXJlSGVscCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIExpbmU6IHBvc2l0aW9uLnJvdyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgQ29sdW1uOiBwb3NpdGlvbi5jb2x1bW4sXHJcbiAgICAgICAgICAgICAgICAgICAgfSkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5zd2l0Y2hNYXAoeCA9PiBzaG91bGRDb250aW51ZS5maWx0ZXIoeiA9PiB6KSwgeCA9PiB4KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuZmxhdE1hcChyZXNwb25zZSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2UgJiYgcmVzcG9uc2UuU2lnbmF0dXJlcyAmJiByZXNwb25zZS5TaWduYXR1cmVzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMuX2J1YmJsZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBkaXNwb3NhYmxlID0gZWRpdG9yLm9uRGlkQ2hhbmdlQ3Vyc29yUG9zaXRpb24oZXZlbnQgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXNzdWVSZXF1ZXN0Lm5leHQoZXZlbnQubmV3QnVmZmVyUG9zaXRpb24pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2QuYWRkKGRpc3Bvc2FibGUpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZGlzcG9zZXIgPSBEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fYnViYmxlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fYnViYmxlLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9idWJibGUgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fYnViYmxlID0gbmV3IFNpZ25hdHVyZUJ1YmJsZShlZGl0b3IsIGRpc3Bvc2VyKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fYnViYmxlLnVwZGF0ZShwb3NpdGlvbiwgcmVzcG9uc2UpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fYnViYmxlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2J1YmJsZS5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmVtcHR5PGFueT4oKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSkpXHJcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKCkpO1xyXG4gICAgICAgIH0pKTtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGlzc3VlUmVxdWVzdCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVxdWlyZWQgPSBmYWxzZTtcclxuICAgIHB1YmxpYyBkZWZhdWx0ID0gZmFsc2U7XHJcbiAgICBwdWJsaWMgdGl0bGUgPSBcIlNpZ25hdHVyZSBIZWxwXCI7XHJcbiAgICBwdWJsaWMgZGVzY3JpcHRpb24gPSBcIkFkZHMgc2lnbmF0dXJlIGhlbHAgdG8gbWV0aG9kIGNhbGxzLlwiO1xyXG59XHJcbmV4cG9ydCBjb25zdCBzaWduYXR1cmVIZWxwID0gbmV3IFNpZ25hdHVyZUhlbHA7XHJcblxyXG5jbGFzcyBTaWduYXR1cmVCdWJibGUgaW1wbGVtZW50cyBJRGlzcG9zYWJsZSB7XHJcbiAgICBwcml2YXRlIF9kZWNvcmF0aW9uOiBJRGVjb3JhdGlvbjtcclxuICAgIHByaXZhdGUgX2Rpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG4gICAgcHJpdmF0ZSBfZWxlbWVudDogU2lnbmF0dXJlVmlldztcclxuICAgIHByaXZhdGUgX21hcmtlcjogQXRvbS5NYXJrZXI7XHJcbiAgICBwcml2YXRlIF9wb3NpdGlvbjogVGV4dEJ1ZmZlci5Qb2ludDtcclxuICAgIHByaXZhdGUgX21lbWJlcjogTW9kZWxzLlNpZ25hdHVyZUhlbHA7XHJcbiAgICBwcml2YXRlIF9saW5lSGVpZ2h0OiBudW1iZXI7XHJcblxyXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBfZWRpdG9yOiBBdG9tLlRleHRFZGl0b3IsIGRpc3Bvc2VyOiBJRGlzcG9zYWJsZSkge1xyXG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKGRpc3Bvc2VyKTtcclxuXHJcbiAgICAgICAgY29uc3QgZWRpdG9yVmlldzogSFRNTEVsZW1lbnQgPSA8YW55PmF0b20udmlld3MuZ2V0VmlldyhfZWRpdG9yKTtcclxuICAgICAgICBlZGl0b3JWaWV3LmNsYXNzTGlzdC5hZGQoXCJzaWduYXR1cmUtaGVscC1hY3RpdmVcIik7XHJcblxyXG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcclxuICAgICAgICAgICAgZWRpdG9yVmlldy5jbGFzc0xpc3QucmVtb3ZlKFwic2lnbmF0dXJlLWhlbHAtYWN0aXZlXCIpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoXHJcbiAgICAgICAgICAgIGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS10ZXh0LWVkaXRvcjpub3QoLmF1dG9jb21wbGV0ZS1hY3RpdmUpLnNpZ25hdHVyZS1oZWxwLWFjdGl2ZVwiLFxyXG4gICAgICAgICAgICAgICAgXCJjb3JlOm1vdmUtdXBcIiwgKGV2ZW50KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZWxlbWVudC5tb3ZlSW5kZXgoLTEpO1xyXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgICAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChcclxuICAgICAgICAgICAgYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXRleHQtZWRpdG9yOm5vdCguYXV0b2NvbXBsZXRlLWFjdGl2ZSkuc2lnbmF0dXJlLWhlbHAtYWN0aXZlXCIsXHJcbiAgICAgICAgICAgICAgICBcImNvcmU6bW92ZS1kb3duXCIsIChldmVudCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2VsZW1lbnQubW92ZUluZGV4KDEpO1xyXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgICAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChcclxuICAgICAgICAgICAgYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXRleHQtZWRpdG9yOm5vdCguYXV0b2NvbXBsZXRlLWFjdGl2ZSkuc2lnbmF0dXJlLWhlbHAtYWN0aXZlXCIsXHJcbiAgICAgICAgICAgICAgICBcImNvcmU6Y2FuY2VsXCIsIChldmVudCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgICAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChhdG9tLmNvbmZpZy5vYnNlcnZlKFwiZWRpdG9yLmZvbnRTaXplXCIsIChzaXplOiBudW1iZXIpID0+IHtcclxuICAgICAgICAgICAgXy5kZWZlcigoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9saW5lSGVpZ2h0ID0gX2VkaXRvci5nZXRMaW5lSGVpZ2h0SW5QaXhlbHMoKTtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9lbGVtZW50KVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2VsZW1lbnQuc2V0TGluZUhlaWdodCh0aGlzLl9saW5lSGVpZ2h0KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB1cGRhdGUocG9zaXRpb246IFRleHRCdWZmZXIuUG9pbnQsIG1lbWJlcjogTW9kZWxzLlNpZ25hdHVyZUhlbHApIHtcclxuICAgICAgICB0aGlzLl9wb3NpdGlvbiA9IHBvc2l0aW9uO1xyXG4gICAgICAgIGNvbnN0IHJhbmdlID0gW1twb3NpdGlvbi5yb3csIHBvc2l0aW9uLmNvbHVtbl0sIFtwb3NpdGlvbi5yb3csIHBvc2l0aW9uLmNvbHVtbl1dO1xyXG4gICAgICAgIGlmICghdGhpcy5fbWFya2VyKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX21hcmtlciA9ICg8YW55PnRoaXMuX2VkaXRvcikubWFya0J1ZmZlclJhbmdlKHJhbmdlLyosIHsgaW52YWxpZGF0ZTogXCJpbnNpZGVcIiB9Ki8pO1xyXG4gICAgICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9tYXJrZXIuZGVzdHJveSgpO1xyXG4gICAgICAgICAgICB9KSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5fbWFya2VyLnNldEJ1ZmZlclJhbmdlKDxhbnk+cmFuZ2UpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCF0aGlzLl9lbGVtZW50IHx8ICF0aGlzLl9kZWNvcmF0aW9uKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2VsZW1lbnQgPSBuZXcgU2lnbmF0dXJlVmlldygpO1xyXG4gICAgICAgICAgICB0aGlzLl9lbGVtZW50LnNldExpbmVIZWlnaHQodGhpcy5fbGluZUhlaWdodCk7XHJcbiAgICAgICAgICAgIHRoaXMuX2RlY29yYXRpb24gPSA8YW55PnRoaXMuX2VkaXRvci5kZWNvcmF0ZU1hcmtlcih0aGlzLl9tYXJrZXIsIHsgdHlwZTogXCJvdmVybGF5XCIsIGNsYXNzOiBgc2lnbmF0dXJlLWhlbHBgLCBpdGVtOiB0aGlzLl9lbGVtZW50LCBwb3NpdGlvbjogXCJoZWFkXCIgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIXRoaXMuX21lbWJlcikge1xyXG4gICAgICAgICAgICB0aGlzLl91cGRhdGVNZW1iZXIobWVtYmVyKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChtZW1iZXIgJiYgdGhpcy5fbWVtYmVyLlNpZ25hdHVyZXMgJiYgbWVtYmVyLlNpZ25hdHVyZXMpIHtcclxuICAgICAgICAgICAgaWYgKCFfLmlzRXF1YWwobWVtYmVyLlNpZ25hdHVyZXMsIHRoaXMuX21lbWJlci5TaWduYXR1cmVzKSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICghXy5pc0VxdWFsKG1lbWJlciwgdGhpcy5fbWVtYmVyKSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fdXBkYXRlTWVtYmVyKG1lbWJlcik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX3VwZGF0ZU1lbWJlcihtZW1iZXI6IE1vZGVscy5TaWduYXR1cmVIZWxwKSB7XHJcbiAgICAgICAgdGhpcy5fbWVtYmVyID0gbWVtYmVyO1xyXG4gICAgICAgIHRoaXMuX2VsZW1lbnQudXBkYXRlTWVtYmVyKG1lbWJlcik7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICB9XHJcbn1cclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
