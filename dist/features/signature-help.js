'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.signatureHelp = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _rxjs = require('rxjs');

var _tsDisposables = require('ts-disposables');

var _omni = require('../server/omni');

var _signatureHelpView = require('../views/signature-help-view');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var SignatureHelp = function () {
    function SignatureHelp() {
        _classCallCheck(this, SignatureHelp);

        this.required = false;
        this.default = false;
        this.title = 'Signature Help';
        this.description = 'Adds signature help to method calls.';
    }

    _createClass(SignatureHelp, [{
        key: 'activate',
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
            this.disposable.add(_omni.Omni.addTextEditorCommand('omnisharp-atom:signature-help', function (e) {
                return delayIssueRequest.next(null);
            }));
            this.disposable.add(atom.commands.onWillDispatch(function (event) {
                if (event.type === 'autocomplete-plus:activate' || event.type === 'autocomplete-plus:confirm') {
                    delayIssueRequest.next(null);
                }
            }));
            var shouldContinue = _rxjs.Observable.zip(_omni.Omni.listener.signatureHelp, _omni.Omni.listener.signatureHelp.skip(1).startWith(null), function (current, previous) {
                if (previous === null) {
                    return true;
                }
                if (!current.response || !current.response.Signatures || current.response.Signatures.length === 0) {
                    return false;
                }
                if (current.response && current.response.Signatures && previous.response && previous.response.Signatures) {
                    if (!(0, _lodash.isEqual)(current.response.Signatures, previous.response.Signatures)) {
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
        key: 'dispose',
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
        editorView.classList.add('signature-help-active');
        this._disposable.add(_tsDisposables.Disposable.create(function () {
            editorView.classList.remove('signature-help-active');
        }));
        this._disposable.add(atom.commands.add('atom-text-editor:not(.autocomplete-active).signature-help-active', 'core:move-up', function (event) {
            _this2._element.moveIndex(-1);
            event.stopImmediatePropagation();
        }));
        this._disposable.add(atom.commands.add('atom-text-editor:not(.autocomplete-active).signature-help-active', 'core:move-down', function (event) {
            _this2._element.moveIndex(1);
            event.stopImmediatePropagation();
        }));
        this._disposable.add(atom.commands.add('atom-text-editor:not(.autocomplete-active).signature-help-active', 'core:cancel', function (event) {
            _this2.dispose();
            event.stopImmediatePropagation();
        }));
        this._disposable.add(atom.config.observe('editor.fontSize', function (size) {
            (0, _lodash.defer)(function () {
                _this2._lineHeight = _editor.getLineHeightInPixels();
                if (_this2._element) {
                    _this2._element.setLineHeight(_this2._lineHeight);
                }
            });
        }));
    }

    _createClass(SignatureBubble, [{
        key: 'update',
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
                this._decoration = this._editor.decorateMarker(this._marker, {
                    type: 'overlay',
                    class: 'signature-help',
                    item: this._element,
                    position: 'head'
                });
            }
            if (!this._member) {
                this._updateMember(member);
            }
            if (member && this._member.Signatures && member.Signatures) {
                if (!(0, _lodash.isEqual)(member.Signatures, this._member.Signatures)) {
                    this.dispose();
                    return;
                }
                if (!(0, _lodash.isEqual)(member, this._member)) {
                    this._updateMember(member);
                }
            }
        }
    }, {
        key: 'dispose',
        value: function dispose() {
            this._disposable.dispose();
        }
    }, {
        key: '_updateMember',
        value: function _updateMember(member) {
            this._member = member;
            this._element.updateMember(member);
        }
    }]);

    return SignatureBubble;
}();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9zaWduYXR1cmUtaGVscC50cyJdLCJuYW1lcyI6WyJTaWduYXR1cmVIZWxwIiwicmVxdWlyZWQiLCJkZWZhdWx0IiwidGl0bGUiLCJkZXNjcmlwdGlvbiIsImRpc3Bvc2FibGUiLCJpc3N1ZVJlcXVlc3QiLCJkZWxheUlzc3VlUmVxdWVzdCIsImFkZCIsImRlYm91bmNlVGltZSIsInN1YnNjcmliZSIsImVkaXRvciIsImF0b20iLCJ3b3Jrc3BhY2UiLCJnZXRBY3RpdmVUZXh0RWRpdG9yIiwicG9zaXRpb24iLCJnZXRDdXJzb3JCdWZmZXJQb3NpdGlvbiIsIm5leHQiLCJhZGRUZXh0RWRpdG9yQ29tbWFuZCIsImNvbW1hbmRzIiwib25XaWxsRGlzcGF0Y2giLCJldmVudCIsInR5cGUiLCJzaG91bGRDb250aW51ZSIsInppcCIsImxpc3RlbmVyIiwic2lnbmF0dXJlSGVscCIsInNraXAiLCJzdGFydFdpdGgiLCJjdXJyZW50IiwicHJldmlvdXMiLCJyZXNwb25zZSIsIlNpZ25hdHVyZXMiLCJsZW5ndGgiLCJwdWJsaXNoUmVwbGF5IiwicmVmQ291bnQiLCJmaWx0ZXIiLCJ6IiwiX2J1YmJsZSIsImRpc3Bvc2UiLCJzd2l0Y2hBY3RpdmVFZGl0b3IiLCJjZCIsImZsYXRNYXAiLCJyZXF1ZXN0Iiwic29sdXRpb24iLCJMaW5lIiwicm93IiwiQ29sdW1uIiwiY29sdW1uIiwic3dpdGNoTWFwIiwieCIsIm9uRGlkQ2hhbmdlQ3Vyc29yUG9zaXRpb24iLCJuZXdCdWZmZXJQb3NpdGlvbiIsImRpc3Bvc2VyIiwiY3JlYXRlIiwiU2lnbmF0dXJlQnViYmxlIiwidXBkYXRlIiwiZW1wdHkiLCJfZWRpdG9yIiwiX2Rpc3Bvc2FibGUiLCJlZGl0b3JWaWV3Iiwidmlld3MiLCJnZXRWaWV3IiwiY2xhc3NMaXN0IiwicmVtb3ZlIiwiX2VsZW1lbnQiLCJtb3ZlSW5kZXgiLCJzdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24iLCJjb25maWciLCJvYnNlcnZlIiwic2l6ZSIsIl9saW5lSGVpZ2h0IiwiZ2V0TGluZUhlaWdodEluUGl4ZWxzIiwic2V0TGluZUhlaWdodCIsIm1lbWJlciIsIl9wb3NpdGlvbiIsInJhbmdlIiwiX21hcmtlciIsIm1hcmtCdWZmZXJSYW5nZSIsImRlc3Ryb3kiLCJzZXRCdWZmZXJSYW5nZSIsIl9kZWNvcmF0aW9uIiwiZGVjb3JhdGVNYXJrZXIiLCJjbGFzcyIsIml0ZW0iLCJfbWVtYmVyIiwiX3VwZGF0ZU1lbWJlciIsInVwZGF0ZU1lbWJlciJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0FBRUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7SUFTQUEsYTtBQUFBLDZCQUFBO0FBQUE7O0FBQ1csYUFBQUMsUUFBQSxHQUFXLEtBQVg7QUFDQSxhQUFBQyxPQUFBLEdBQVUsS0FBVjtBQUNBLGFBQUFDLEtBQUEsR0FBUSxnQkFBUjtBQUNBLGFBQUFDLFdBQUEsR0FBYyxzQ0FBZDtBQThGVjs7OzttQ0F6RmtCO0FBQUE7O0FBQ1gsaUJBQUtDLFVBQUwsR0FBa0Isd0NBQWxCO0FBQ0EsZ0JBQU1DLGVBQWUsbUJBQXJCO0FBQ0EsZ0JBQU1DLG9CQUFvQixtQkFBMUI7QUFFQSxpQkFBS0YsVUFBTCxDQUFnQkcsR0FBaEIsQ0FBb0JELGtCQUNmRSxZQURlLENBQ0YsSUFERSxFQUVmQyxTQUZlLENBRUwsWUFBQTtBQUNQLG9CQUFNQyxTQUFTQyxLQUFLQyxTQUFMLENBQWVDLG1CQUFmLEVBQWY7QUFDQSxvQkFBTUMsV0FBV0osT0FBT0ssdUJBQVAsRUFBakI7QUFDQVYsNkJBQWFXLElBQWIsQ0FBa0JGLFFBQWxCO0FBQ0gsYUFOZSxDQUFwQjtBQVFBLGlCQUFLVixVQUFMLENBQWdCRyxHQUFoQixDQUFvQixXQUFLVSxvQkFBTCxDQUEwQiwrQkFBMUIsRUFDaEI7QUFBQSx1QkFBS1gsa0JBQWtCVSxJQUFsQixDQUF1QixJQUF2QixDQUFMO0FBQUEsYUFEZ0IsQ0FBcEI7QUFHQSxpQkFBS1osVUFBTCxDQUFnQkcsR0FBaEIsQ0FBb0JJLEtBQUtP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LE1BQVIsRUFBZ0IsS0FBS1csT0FBckIsQ0FBTCxFQUFvQztBQUNoQyx5QkFBS0MsYUFBTCxDQUFtQlosTUFBbkI7QUFDSDtBQUNKO0FBQ0o7OztrQ0FFYTtBQUNWLGlCQUFLZixXQUFMLENBQWlCcEIsT0FBakI7QUFDSDs7O3NDQUVxQm1DLE0sRUFBNEI7QUFDOUMsaUJBQUtXLE9BQUwsR0FBZVgsTUFBZjtBQUNBLGlCQUFLVCxRQUFMLENBQWNzQixZQUFkLENBQTJCYixNQUEzQjtBQUNIIiwiZmlsZSI6ImxpYi9mZWF0dXJlcy9zaWduYXR1cmUtaGVscC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGRlZmVyLCBpc0VxdWFsIH0gZnJvbSAnbG9kYXNoJztcclxuaW1wb3J0IHsgTW9kZWxzIH0gZnJvbSAnb21uaXNoYXJwLWNsaWVudCc7XHJcbmltcG9ydCB7IE9ic2VydmFibGUsIFN1YmplY3QgfSBmcm9tICdyeGpzJztcclxuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSwgRGlzcG9zYWJsZSwgSURpc3Bvc2FibGUgfSBmcm9tICd0cy1kaXNwb3NhYmxlcyc7XHJcbmltcG9ydCB7IE9tbmkgfSBmcm9tICcuLi9zZXJ2ZXIvb21uaSc7XHJcbmltcG9ydCB7IFNpZ25hdHVyZVZpZXcgfSBmcm9tICcuLi92aWV3cy9zaWduYXR1cmUtaGVscC12aWV3JztcclxuXHJcbmludGVyZmFjZSBJRGVjb3JhdGlvbiB7XHJcbiAgICBkZXN0cm95KCk6IHZvaWQ7XHJcbiAgICBnZXRNYXJrZXIoKTogQXRvbS5NYXJrZXI7XHJcbiAgICBnZXRQcm9wZXJ0aWVzKCk6IGFueTtcclxuICAgIHNldFByb3BlcnRpZXMocHJvcHM6IGFueSk6IGFueTtcclxufVxyXG5cclxuY2xhc3MgU2lnbmF0dXJlSGVscCBpbXBsZW1lbnRzIElGZWF0dXJlIHtcclxuICAgIHB1YmxpYyByZXF1aXJlZCA9IGZhbHNlO1xyXG4gICAgcHVibGljIGRlZmF1bHQgPSBmYWxzZTtcclxuICAgIHB1YmxpYyB0aXRsZSA9ICdTaWduYXR1cmUgSGVscCc7XHJcbiAgICBwdWJsaWMgZGVzY3JpcHRpb24gPSAnQWRkcyBzaWduYXR1cmUgaGVscCB0byBtZXRob2QgY2FsbHMuJztcclxuXHJcbiAgICBwcml2YXRlIGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XHJcbiAgICBwcml2YXRlIF9idWJibGU6IFNpZ25hdHVyZUJ1YmJsZTtcclxuXHJcbiAgICBwdWJsaWMgYWN0aXZhdGUoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgICAgICBjb25zdCBpc3N1ZVJlcXVlc3QgPSBuZXcgU3ViamVjdDxUZXh0QnVmZmVyLlBvaW50PigpO1xyXG4gICAgICAgIGNvbnN0IGRlbGF5SXNzdWVSZXF1ZXN0ID0gbmV3IFN1YmplY3Q8YW55PigpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGRlbGF5SXNzdWVSZXF1ZXN0XHJcbiAgICAgICAgICAgIC5kZWJvdW5jZVRpbWUoMTAwMClcclxuICAgICAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBlZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKCk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBwb3NpdGlvbiA9IGVkaXRvci5nZXRDdXJzb3JCdWZmZXJQb3NpdGlvbigpO1xyXG4gICAgICAgICAgICAgICAgaXNzdWVSZXF1ZXN0Lm5leHQocG9zaXRpb24pO1xyXG4gICAgICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5hZGRUZXh0RWRpdG9yQ29tbWFuZCgnb21uaXNoYXJwLWF0b206c2lnbmF0dXJlLWhlbHAnLFxyXG4gICAgICAgICAgICBlID0+IGRlbGF5SXNzdWVSZXF1ZXN0Lm5leHQobnVsbCkpKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLm9uV2lsbERpc3BhdGNoKChldmVudDogRXZlbnQpID0+IHtcclxuICAgICAgICAgICAgaWYgKGV2ZW50LnR5cGUgPT09ICdhdXRvY29tcGxldGUtcGx1czphY3RpdmF0ZScgfHwgZXZlbnQudHlwZSA9PT0gJ2F1dG9jb21wbGV0ZS1wbHVzOmNvbmZpcm0nKSB7XHJcbiAgICAgICAgICAgICAgICBkZWxheUlzc3VlUmVxdWVzdC5uZXh0KG51bGwpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICBjb25zdCBzaG91bGRDb250aW51ZSA9IE9ic2VydmFibGUuemlwKFxyXG4gICAgICAgICAgICBPbW5pLmxpc3RlbmVyLnNpZ25hdHVyZUhlbHAsXHJcbiAgICAgICAgICAgIE9tbmkubGlzdGVuZXIuc2lnbmF0dXJlSGVscC5za2lwKDEpLnN0YXJ0V2l0aChudWxsKSxcclxuICAgICAgICAgICAgKGN1cnJlbnQsIHByZXZpb3VzKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAocHJldmlvdXMgPT09IG51bGwpIHsgcmV0dXJuIHRydWU7IH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIWN1cnJlbnQucmVzcG9uc2UgfHwgIWN1cnJlbnQucmVzcG9uc2UuU2lnbmF0dXJlcyB8fCBjdXJyZW50LnJlc3BvbnNlLlNpZ25hdHVyZXMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChjdXJyZW50LnJlc3BvbnNlICYmIGN1cnJlbnQucmVzcG9uc2UuU2lnbmF0dXJlcyAmJiBwcmV2aW91cy5yZXNwb25zZSAmJiBwcmV2aW91cy5yZXNwb25zZS5TaWduYXR1cmVzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFpc0VxdWFsKGN1cnJlbnQucmVzcG9uc2UuU2lnbmF0dXJlcywgcHJldmlvdXMucmVzcG9uc2UuU2lnbmF0dXJlcykpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgLnB1Ymxpc2hSZXBsYXkoMSkucmVmQ291bnQoKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChzaG91bGRDb250aW51ZVxyXG4gICAgICAgICAgICAuZmlsdGVyKHogPT4gIXopXHJcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoKCkgPT4gdGhpcy5fYnViYmxlICYmIHRoaXMuX2J1YmJsZS5kaXNwb3NlKCkpKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLnN3aXRjaEFjdGl2ZUVkaXRvcigoZWRpdG9yLCBjZCkgPT4ge1xyXG4gICAgICAgICAgICBjZC5hZGQoaXNzdWVSZXF1ZXN0XHJcbiAgICAgICAgICAgICAgICAuZmxhdE1hcCgocG9zaXRpb246IFRleHRCdWZmZXIuUG9pbnQpID0+XHJcbiAgICAgICAgICAgICAgICAgICAgT21uaS5yZXF1ZXN0KGVkaXRvciwgc29sdXRpb24gPT4gc29sdXRpb24uc2lnbmF0dXJlSGVscCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIExpbmU6IHBvc2l0aW9uLnJvdyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgQ29sdW1uOiBwb3NpdGlvbi5jb2x1bW4sXHJcbiAgICAgICAgICAgICAgICAgICAgfSkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5zd2l0Y2hNYXAoeCA9PiBzaG91bGRDb250aW51ZS5maWx0ZXIoeiA9PiB6KSwgeCA9PiB4KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuZmxhdE1hcChyZXNwb25zZSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2UgJiYgcmVzcG9uc2UuU2lnbmF0dXJlcyAmJiByZXNwb25zZS5TaWduYXR1cmVzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMuX2J1YmJsZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBkaXNwb3NhYmxlID0gZWRpdG9yLm9uRGlkQ2hhbmdlQ3Vyc29yUG9zaXRpb24oZXZlbnQgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXNzdWVSZXF1ZXN0Lm5leHQoZXZlbnQubmV3QnVmZmVyUG9zaXRpb24pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2QuYWRkKGRpc3Bvc2FibGUpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZGlzcG9zZXIgPSBEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fYnViYmxlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fYnViYmxlLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9idWJibGUgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fYnViYmxlID0gbmV3IFNpZ25hdHVyZUJ1YmJsZShlZGl0b3IsIGRpc3Bvc2VyKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fYnViYmxlLnVwZGF0ZShwb3NpdGlvbiwgcmVzcG9uc2UpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fYnViYmxlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2J1YmJsZS5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmVtcHR5PGFueT4oKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSkpXHJcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKCkpO1xyXG4gICAgICAgIH0pKTtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGlzc3VlUmVxdWVzdCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgIH1cclxufVxyXG4vLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6ZXhwb3J0LW5hbWVcclxuZXhwb3J0IGNvbnN0IHNpZ25hdHVyZUhlbHAgPSBuZXcgU2lnbmF0dXJlSGVscCgpO1xyXG5cclxuLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm1heC1jbGFzc2VzLXBlci1maWxlXHJcbmNsYXNzIFNpZ25hdHVyZUJ1YmJsZSBpbXBsZW1lbnRzIElEaXNwb3NhYmxlIHtcclxuICAgIHByaXZhdGUgX2RlY29yYXRpb246IElEZWNvcmF0aW9uO1xyXG4gICAgcHJpdmF0ZSBfZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcbiAgICBwcml2YXRlIF9lbGVtZW50OiBTaWduYXR1cmVWaWV3O1xyXG4gICAgcHJpdmF0ZSBfbWFya2VyOiBBdG9tLk1hcmtlcjtcclxuICAgIHByaXZhdGUgX3Bvc2l0aW9uOiBUZXh0QnVmZmVyLlBvaW50O1xyXG4gICAgcHJpdmF0ZSBfbWVtYmVyOiBNb2RlbHMuU2lnbmF0dXJlSGVscDtcclxuICAgIHByaXZhdGUgX2xpbmVIZWlnaHQ6IG51bWJlcjtcclxuXHJcbiAgICBwdWJsaWMgY29uc3RydWN0b3IocHJpdmF0ZSBfZWRpdG9yOiBBdG9tLlRleHRFZGl0b3IsIGRpc3Bvc2VyOiBJRGlzcG9zYWJsZSkge1xyXG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKGRpc3Bvc2VyKTtcclxuXHJcbiAgICAgICAgY29uc3QgZWRpdG9yVmlldzogSFRNTEVsZW1lbnQgPSA8YW55PmF0b20udmlld3MuZ2V0VmlldyhfZWRpdG9yKTtcclxuICAgICAgICBlZGl0b3JWaWV3LmNsYXNzTGlzdC5hZGQoJ3NpZ25hdHVyZS1oZWxwLWFjdGl2ZScpO1xyXG5cclxuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XHJcbiAgICAgICAgICAgIGVkaXRvclZpZXcuY2xhc3NMaXN0LnJlbW92ZSgnc2lnbmF0dXJlLWhlbHAtYWN0aXZlJyk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChcclxuICAgICAgICAgICAgYXRvbS5jb21tYW5kcy5hZGQoJ2F0b20tdGV4dC1lZGl0b3I6bm90KC5hdXRvY29tcGxldGUtYWN0aXZlKS5zaWduYXR1cmUtaGVscC1hY3RpdmUnLFxyXG4gICAgICAgICAgICAgICAgJ2NvcmU6bW92ZS11cCcsIGV2ZW50ID0+IHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9lbGVtZW50Lm1vdmVJbmRleCgtMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKFxyXG4gICAgICAgICAgICBhdG9tLmNvbW1hbmRzLmFkZCgnYXRvbS10ZXh0LWVkaXRvcjpub3QoLmF1dG9jb21wbGV0ZS1hY3RpdmUpLnNpZ25hdHVyZS1oZWxwLWFjdGl2ZScsXHJcbiAgICAgICAgICAgICAgICAnY29yZTptb3ZlLWRvd24nLCBldmVudCA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZWxlbWVudC5tb3ZlSW5kZXgoMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKFxyXG4gICAgICAgICAgICBhdG9tLmNvbW1hbmRzLmFkZCgnYXRvbS10ZXh0LWVkaXRvcjpub3QoLmF1dG9jb21wbGV0ZS1hY3RpdmUpLnNpZ25hdHVyZS1oZWxwLWFjdGl2ZScsXHJcbiAgICAgICAgICAgICAgICAnY29yZTpjYW5jZWwnLCBldmVudCA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoJ2VkaXRvci5mb250U2l6ZScsIChzaXplOiBudW1iZXIpID0+IHtcclxuICAgICAgICAgICAgZGVmZXIoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fbGluZUhlaWdodCA9IF9lZGl0b3IuZ2V0TGluZUhlaWdodEluUGl4ZWxzKCk7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fZWxlbWVudCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2VsZW1lbnQuc2V0TGluZUhlaWdodCh0aGlzLl9saW5lSGVpZ2h0KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB1cGRhdGUocG9zaXRpb246IFRleHRCdWZmZXIuUG9pbnQsIG1lbWJlcjogTW9kZWxzLlNpZ25hdHVyZUhlbHApIHtcclxuICAgICAgICB0aGlzLl9wb3NpdGlvbiA9IHBvc2l0aW9uO1xyXG4gICAgICAgIGNvbnN0IHJhbmdlID0gW1twb3NpdGlvbi5yb3csIHBvc2l0aW9uLmNvbHVtbl0sIFtwb3NpdGlvbi5yb3csIHBvc2l0aW9uLmNvbHVtbl1dO1xyXG4gICAgICAgIGlmICghdGhpcy5fbWFya2VyKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX21hcmtlciA9ICg8YW55PnRoaXMuX2VkaXRvcikubWFya0J1ZmZlclJhbmdlKHJhbmdlLyosIHsgaW52YWxpZGF0ZTogXCJpbnNpZGVcIiB9Ki8pO1xyXG4gICAgICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9tYXJrZXIuZGVzdHJveSgpO1xyXG4gICAgICAgICAgICB9KSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5fbWFya2VyLnNldEJ1ZmZlclJhbmdlKDxhbnk+cmFuZ2UpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCF0aGlzLl9lbGVtZW50IHx8ICF0aGlzLl9kZWNvcmF0aW9uKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2VsZW1lbnQgPSBuZXcgU2lnbmF0dXJlVmlldygpO1xyXG4gICAgICAgICAgICB0aGlzLl9lbGVtZW50LnNldExpbmVIZWlnaHQodGhpcy5fbGluZUhlaWdodCk7XHJcbiAgICAgICAgICAgIHRoaXMuX2RlY29yYXRpb24gPSA8YW55PnRoaXMuX2VkaXRvci5kZWNvcmF0ZU1hcmtlcih0aGlzLl9tYXJrZXIsIHtcclxuICAgICAgICAgICAgICAgIHR5cGU6ICdvdmVybGF5JyxcclxuICAgICAgICAgICAgICAgIGNsYXNzOiBgc2lnbmF0dXJlLWhlbHBgLFxyXG4gICAgICAgICAgICAgICAgaXRlbTogdGhpcy5fZWxlbWVudCxcclxuICAgICAgICAgICAgICAgIHBvc2l0aW9uOiAnaGVhZCdcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIXRoaXMuX21lbWJlcikge1xyXG4gICAgICAgICAgICB0aGlzLl91cGRhdGVNZW1iZXIobWVtYmVyKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChtZW1iZXIgJiYgdGhpcy5fbWVtYmVyLlNpZ25hdHVyZXMgJiYgbWVtYmVyLlNpZ25hdHVyZXMpIHtcclxuICAgICAgICAgICAgaWYgKCFpc0VxdWFsKG1lbWJlci5TaWduYXR1cmVzLCB0aGlzLl9tZW1iZXIuU2lnbmF0dXJlcykpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIWlzRXF1YWwobWVtYmVyLCB0aGlzLl9tZW1iZXIpKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl91cGRhdGVNZW1iZXIobWVtYmVyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGlzcG9zZSgpIHtcclxuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF91cGRhdGVNZW1iZXIobWVtYmVyOiBNb2RlbHMuU2lnbmF0dXJlSGVscCkge1xyXG4gICAgICAgIHRoaXMuX21lbWJlciA9IG1lbWJlcjtcclxuICAgICAgICB0aGlzLl9lbGVtZW50LnVwZGF0ZU1lbWJlcihtZW1iZXIpO1xyXG4gICAgfVxyXG59XHJcbiJdfQ==
