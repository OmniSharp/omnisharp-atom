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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9zaWduYXR1cmUtaGVscC50cyJdLCJuYW1lcyI6WyJTaWduYXR1cmVIZWxwIiwicmVxdWlyZWQiLCJkZWZhdWx0IiwidGl0bGUiLCJkZXNjcmlwdGlvbiIsImRpc3Bvc2FibGUiLCJpc3N1ZVJlcXVlc3QiLCJkZWxheUlzc3VlUmVxdWVzdCIsImFkZCIsImRlYm91bmNlVGltZSIsInN1YnNjcmliZSIsImVkaXRvciIsImF0b20iLCJ3b3Jrc3BhY2UiLCJnZXRBY3RpdmVUZXh0RWRpdG9yIiwicG9zaXRpb24iLCJnZXRDdXJzb3JCdWZmZXJQb3NpdGlvbiIsIm5leHQiLCJhZGRUZXh0RWRpdG9yQ29tbWFuZCIsImNvbW1hbmRzIiwib25XaWxsRGlzcGF0Y2giLCJldmVudCIsInR5cGUiLCJzaG91bGRDb250aW51ZSIsInppcCIsImxpc3RlbmVyIiwic2lnbmF0dXJlSGVscCIsInNraXAiLCJzdGFydFdpdGgiLCJjdXJyZW50IiwicHJldmlvdXMiLCJyZXNwb25zZSIsIlNpZ25hdHVyZXMiLCJsZW5ndGgiLCJwdWJsaXNoUmVwbGF5IiwicmVmQ291bnQiLCJmaWx0ZXIiLCJ6IiwiX2J1YmJsZSIsImRpc3Bvc2UiLCJzd2l0Y2hBY3RpdmVFZGl0b3IiLCJjZCIsImZsYXRNYXAiLCJyZXF1ZXN0Iiwic29sdXRpb24iLCJMaW5lIiwicm93IiwiQ29sdW1uIiwiY29sdW1uIiwic3dpdGNoTWFwIiwieCIsIm9uRGlkQ2hhbmdlQ3Vyc29yUG9zaXRpb24iLCJuZXdCdWZmZXJQb3NpdGlvbiIsImRpc3Bvc2VyIiwiY3JlYXRlIiwiU2lnbmF0dXJlQnViYmxlIiwidXBkYXRlIiwiZW1wdHkiLCJfZWRpdG9yIiwiX2Rpc3Bvc2FibGUiLCJlZGl0b3JWaWV3Iiwidmlld3MiLCJnZXRWaWV3IiwiY2xhc3NMaXN0IiwicmVtb3ZlIiwiX2VsZW1lbnQiLCJtb3ZlSW5kZXgiLCJzdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24iLCJjb25maWciLCJvYnNlcnZlIiwic2l6ZSIsIl9saW5lSGVpZ2h0IiwiZ2V0TGluZUhlaWdodEluUGl4ZWxzIiwic2V0TGluZUhlaWdodCIsIm1lbWJlciIsIl9wb3NpdGlvbiIsInJhbmdlIiwiX21hcmtlciIsIm1hcmtCdWZmZXJSYW5nZSIsImRlc3Ryb3kiLCJzZXRCdWZmZXJSYW5nZSIsIl9kZWNvcmF0aW9uIiwiZGVjb3JhdGVNYXJrZXIiLCJjbGFzcyIsIml0ZW0iLCJfbWVtYmVyIiwiX3VwZGF0ZU1lbWJlciIsInVwZGF0ZU1lbWJlciJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0FBRUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7SUFTQUEsYTtBQUFBLDZCQUFBO0FBQUE7O0FBQ1csYUFBQUMsUUFBQSxHQUFXLEtBQVg7QUFDQSxhQUFBQyxPQUFBLEdBQVUsS0FBVjtBQUNBLGFBQUFDLEtBQUEsR0FBUSxnQkFBUjtBQUNBLGFBQUFDLFdBQUEsR0FBYyxzQ0FBZDtBQThGVjs7OzttQ0F6RmtCO0FBQUE7O0FBQ1gsaUJBQUtDLFVBQUwsR0FBa0Isd0NBQWxCO0FBQ0EsZ0JBQU1DLGVBQWUsbUJBQXJCO0FBQ0EsZ0JBQU1DLG9CQUFvQixtQkFBMUI7QUFFQSxpQkFBS0YsVUFBTCxDQUFnQkcsR0FBaEIsQ0FBb0JELGtCQUNmRSxZQURlLENBQ0YsSUFERSxFQUVmQyxTQUZlLENBRUwsWUFBQTtBQUNQLG9CQUFNQyxTQUFTQyxLQUFLQyxTQUFMLENBQWVDLG1CQUFmLEVBQWY7QUFDQSxvQkFBTUMsV0FBV0osT0FBT0ssdUJBQVAsRUFBakI7QUFDQVYsNkJBQWFXLElBQWIsQ0FBa0JGLFFBQWxCO0FBQ0gsYUFOZSxDQUFwQjtBQVFBLGlCQUFLVixVQUFMLENBQWdCRyxHQUFoQixDQUFvQixXQUFLVSxvQkFBTCxDQUEwQiwrQkFBMUIsRUFDaEI7QUFBQSx1QkFBS1gsa0JBQWtCVSxJQUFsQixDQUF1QixJQUF2QixDQUFMO0FBQUEsYUFEZ0IsQ0FBcEI7QUFHQSxpQkFBS1osVUFBTCxDQUFnQkcsR0FBaEIsQ0FBb0JJLEtBQUtP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QUFDLHFCQUFRbUMsTUFBUixFQUFnQixLQUFLVyxPQUFyQixDQUFMLEVBQW9DO0FBQ2hDLHlCQUFLQyxhQUFMLENBQW1CWixNQUFuQjtBQUNIO0FBQ0o7QUFDSjs7O2tDQUVhO0FBQ1YsaUJBQUtmLFdBQUwsQ0FBaUJwQixPQUFqQjtBQUNIOzs7c0NBRXFCbUMsTSxFQUE0QjtBQUM5QyxpQkFBS1csT0FBTCxHQUFlWCxNQUFmO0FBQ0EsaUJBQUtULFFBQUwsQ0FBY3NCLFlBQWQsQ0FBMkJiLE1BQTNCO0FBQ0giLCJmaWxlIjoibGliL2ZlYXR1cmVzL3NpZ25hdHVyZS1oZWxwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZGVmZXIsIGlzRXF1YWwgfSBmcm9tICdsb2Rhc2gnO1xyXG5pbXBvcnQgeyBNb2RlbHMgfSBmcm9tICdvbW5pc2hhcnAtY2xpZW50JztcclxuaW1wb3J0IHsgT2JzZXJ2YWJsZSwgU3ViamVjdCB9IGZyb20gJ3J4anMnO1xyXG5pbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlLCBJRGlzcG9zYWJsZSB9IGZyb20gJ3RzLWRpc3Bvc2FibGVzJztcclxuaW1wb3J0IHsgT21uaSB9IGZyb20gJy4uL3NlcnZlci9vbW5pJztcclxuaW1wb3J0IHsgU2lnbmF0dXJlVmlldyB9IGZyb20gJy4uL3ZpZXdzL3NpZ25hdHVyZS1oZWxwLXZpZXcnO1xyXG5cclxuaW50ZXJmYWNlIElEZWNvcmF0aW9uIHtcclxuICAgIGRlc3Ryb3koKTogdm9pZDtcclxuICAgIGdldE1hcmtlcigpOiBBdG9tLk1hcmtlcjtcclxuICAgIGdldFByb3BlcnRpZXMoKTogYW55O1xyXG4gICAgc2V0UHJvcGVydGllcyhwcm9wczogYW55KTogYW55O1xyXG59XHJcblxyXG5jbGFzcyBTaWduYXR1cmVIZWxwIGltcGxlbWVudHMgSUZlYXR1cmUge1xyXG4gICAgcHVibGljIHJlcXVpcmVkID0gZmFsc2U7XHJcbiAgICBwdWJsaWMgZGVmYXVsdCA9IGZhbHNlO1xyXG4gICAgcHVibGljIHRpdGxlID0gJ1NpZ25hdHVyZSBIZWxwJztcclxuICAgIHB1YmxpYyBkZXNjcmlwdGlvbiA9ICdBZGRzIHNpZ25hdHVyZSBoZWxwIHRvIG1ldGhvZCBjYWxscy4nO1xyXG5cclxuICAgIHByaXZhdGUgZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxuICAgIHByaXZhdGUgX2J1YmJsZTogU2lnbmF0dXJlQnViYmxlO1xyXG5cclxuICAgIHB1YmxpYyBhY3RpdmF0ZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG4gICAgICAgIGNvbnN0IGlzc3VlUmVxdWVzdCA9IG5ldyBTdWJqZWN0PFRleHRCdWZmZXIuUG9pbnQ+KCk7XHJcbiAgICAgICAgY29uc3QgZGVsYXlJc3N1ZVJlcXVlc3QgPSBuZXcgU3ViamVjdDxhbnk+KCk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoZGVsYXlJc3N1ZVJlcXVlc3RcclxuICAgICAgICAgICAgLmRlYm91bmNlVGltZSgxMDAwKVxyXG4gICAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGVkaXRvciA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHBvc2l0aW9uID0gZWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKCk7XHJcbiAgICAgICAgICAgICAgICBpc3N1ZVJlcXVlc3QubmV4dChwb3NpdGlvbik7XHJcbiAgICAgICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmFkZFRleHRFZGl0b3JDb21tYW5kKCdvbW5pc2hhcnAtYXRvbTpzaWduYXR1cmUtaGVscCcsXHJcbiAgICAgICAgICAgIGUgPT4gZGVsYXlJc3N1ZVJlcXVlc3QubmV4dChudWxsKSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMub25XaWxsRGlzcGF0Y2goKGV2ZW50OiBFdmVudCkgPT4ge1xyXG4gICAgICAgICAgICBpZiAoZXZlbnQudHlwZSA9PT0gJ2F1dG9jb21wbGV0ZS1wbHVzOmFjdGl2YXRlJyB8fCBldmVudC50eXBlID09PSAnYXV0b2NvbXBsZXRlLXBsdXM6Y29uZmlybScpIHtcclxuICAgICAgICAgICAgICAgIGRlbGF5SXNzdWVSZXF1ZXN0Lm5leHQobnVsbCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIGNvbnN0IHNob3VsZENvbnRpbnVlID0gT2JzZXJ2YWJsZS56aXAoXHJcbiAgICAgICAgICAgIE9tbmkubGlzdGVuZXIuc2lnbmF0dXJlSGVscCxcclxuICAgICAgICAgICAgT21uaS5saXN0ZW5lci5zaWduYXR1cmVIZWxwLnNraXAoMSkuc3RhcnRXaXRoKG51bGwpLFxyXG4gICAgICAgICAgICAoY3VycmVudCwgcHJldmlvdXMpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmIChwcmV2aW91cyA9PT0gbnVsbCkgeyByZXR1cm4gdHJ1ZTsgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmICghY3VycmVudC5yZXNwb25zZSB8fCAhY3VycmVudC5yZXNwb25zZS5TaWduYXR1cmVzIHx8IGN1cnJlbnQucmVzcG9uc2UuU2lnbmF0dXJlcy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGN1cnJlbnQucmVzcG9uc2UgJiYgY3VycmVudC5yZXNwb25zZS5TaWduYXR1cmVzICYmIHByZXZpb3VzLnJlc3BvbnNlICYmIHByZXZpb3VzLnJlc3BvbnNlLlNpZ25hdHVyZXMpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIWlzRXF1YWwoY3VycmVudC5yZXNwb25zZS5TaWduYXR1cmVzLCBwcmV2aW91cy5yZXNwb25zZS5TaWduYXR1cmVzKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAucHVibGlzaFJlcGxheSgxKS5yZWZDb3VudCgpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKHNob3VsZENvbnRpbnVlXHJcbiAgICAgICAgICAgIC5maWx0ZXIoeiA9PiAheilcclxuICAgICAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB0aGlzLl9idWJibGUgJiYgdGhpcy5fYnViYmxlLmRpc3Bvc2UoKSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuc3dpdGNoQWN0aXZlRWRpdG9yKChlZGl0b3IsIGNkKSA9PiB7XHJcbiAgICAgICAgICAgIGNkLmFkZChpc3N1ZVJlcXVlc3RcclxuICAgICAgICAgICAgICAgIC5mbGF0TWFwKChwb3NpdGlvbjogVGV4dEJ1ZmZlci5Qb2ludCkgPT5cclxuICAgICAgICAgICAgICAgICAgICBPbW5pLnJlcXVlc3QoZWRpdG9yLCBzb2x1dGlvbiA9PiBzb2x1dGlvbi5zaWduYXR1cmVIZWxwKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgTGluZTogcG9zaXRpb24ucm93LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBDb2x1bW46IHBvc2l0aW9uLmNvbHVtbixcclxuICAgICAgICAgICAgICAgICAgICB9KSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgLnN3aXRjaE1hcCh4ID0+IHNob3VsZENvbnRpbnVlLmZpbHRlcih6ID0+IHopLCB4ID0+IHgpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5mbGF0TWFwKHJlc3BvbnNlID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZSAmJiByZXNwb25zZS5TaWduYXR1cmVzICYmIHJlc3BvbnNlLlNpZ25hdHVyZXMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdGhpcy5fYnViYmxlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGRpc3Bvc2FibGUgPSBlZGl0b3Iub25EaWRDaGFuZ2VDdXJzb3JQb3NpdGlvbihldmVudCA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpc3N1ZVJlcXVlc3QubmV4dChldmVudC5uZXdCdWZmZXJQb3NpdGlvbik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjZC5hZGQoZGlzcG9zYWJsZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBkaXNwb3NlciA9IERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9idWJibGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9idWJibGUuZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2J1YmJsZSA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9idWJibGUgPSBuZXcgU2lnbmF0dXJlQnViYmxlKGVkaXRvciwgZGlzcG9zZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9idWJibGUudXBkYXRlKHBvc2l0aW9uLCByZXNwb25zZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9idWJibGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fYnViYmxlLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuZW1wdHk8YW55PigpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KSlcclxuICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoKSk7XHJcbiAgICAgICAgfSkpO1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoaXNzdWVSZXF1ZXN0KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGlzcG9zZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgfVxyXG59XHJcbi8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpleHBvcnQtbmFtZVxyXG5leHBvcnQgY29uc3Qgc2lnbmF0dXJlSGVscCA9IG5ldyBTaWduYXR1cmVIZWxwKCk7XHJcblxyXG4vLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bWF4LWNsYXNzZXMtcGVyLWZpbGVcclxuY2xhc3MgU2lnbmF0dXJlQnViYmxlIGltcGxlbWVudHMgSURpc3Bvc2FibGUge1xyXG4gICAgcHJpdmF0ZSBfZGVjb3JhdGlvbjogSURlY29yYXRpb247XHJcbiAgICBwcml2YXRlIF9kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgIHByaXZhdGUgX2VsZW1lbnQ6IFNpZ25hdHVyZVZpZXc7XHJcbiAgICBwcml2YXRlIF9tYXJrZXI6IEF0b20uTWFya2VyO1xyXG4gICAgcHJpdmF0ZSBfcG9zaXRpb246IFRleHRCdWZmZXIuUG9pbnQ7XHJcbiAgICBwcml2YXRlIF9tZW1iZXI6IE1vZGVscy5TaWduYXR1cmVIZWxwO1xyXG4gICAgcHJpdmF0ZSBfbGluZUhlaWdodDogbnVtYmVyO1xyXG5cclxuICAgIHB1YmxpYyBjb25zdHJ1Y3Rvcihwcml2YXRlIF9lZGl0b3I6IEF0b20uVGV4dEVkaXRvciwgZGlzcG9zZXI6IElEaXNwb3NhYmxlKSB7XHJcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoZGlzcG9zZXIpO1xyXG5cclxuICAgICAgICBjb25zdCBlZGl0b3JWaWV3OiBIVE1MRWxlbWVudCA9IDxhbnk+YXRvbS52aWV3cy5nZXRWaWV3KF9lZGl0b3IpO1xyXG4gICAgICAgIGVkaXRvclZpZXcuY2xhc3NMaXN0LmFkZCgnc2lnbmF0dXJlLWhlbHAtYWN0aXZlJyk7XHJcblxyXG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcclxuICAgICAgICAgICAgZWRpdG9yVmlldy5jbGFzc0xpc3QucmVtb3ZlKCdzaWduYXR1cmUtaGVscC1hY3RpdmUnKTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKFxyXG4gICAgICAgICAgICBhdG9tLmNvbW1hbmRzLmFkZCgnYXRvbS10ZXh0LWVkaXRvcjpub3QoLmF1dG9jb21wbGV0ZS1hY3RpdmUpLnNpZ25hdHVyZS1oZWxwLWFjdGl2ZScsXHJcbiAgICAgICAgICAgICAgICAnY29yZTptb3ZlLXVwJywgZXZlbnQgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2VsZW1lbnQubW92ZUluZGV4KC0xKTtcclxuICAgICAgICAgICAgICAgICAgICBldmVudC5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcclxuICAgICAgICAgICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoXHJcbiAgICAgICAgICAgIGF0b20uY29tbWFuZHMuYWRkKCdhdG9tLXRleHQtZWRpdG9yOm5vdCguYXV0b2NvbXBsZXRlLWFjdGl2ZSkuc2lnbmF0dXJlLWhlbHAtYWN0aXZlJyxcclxuICAgICAgICAgICAgICAgICdjb3JlOm1vdmUtZG93bicsIGV2ZW50ID0+IHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9lbGVtZW50Lm1vdmVJbmRleCgxKTtcclxuICAgICAgICAgICAgICAgICAgICBldmVudC5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcclxuICAgICAgICAgICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoXHJcbiAgICAgICAgICAgIGF0b20uY29tbWFuZHMuYWRkKCdhdG9tLXRleHQtZWRpdG9yOm5vdCguYXV0b2NvbXBsZXRlLWFjdGl2ZSkuc2lnbmF0dXJlLWhlbHAtYWN0aXZlJyxcclxuICAgICAgICAgICAgICAgICdjb3JlOmNhbmNlbCcsIGV2ZW50ID0+IHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgICAgICAgICBldmVudC5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcclxuICAgICAgICAgICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoYXRvbS5jb25maWcub2JzZXJ2ZSgnZWRpdG9yLmZvbnRTaXplJywgKHNpemU6IG51bWJlcikgPT4ge1xyXG4gICAgICAgICAgICBkZWZlcigoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9saW5lSGVpZ2h0ID0gX2VkaXRvci5nZXRMaW5lSGVpZ2h0SW5QaXhlbHMoKTtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9lbGVtZW50KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZWxlbWVudC5zZXRMaW5lSGVpZ2h0KHRoaXMuX2xpbmVIZWlnaHQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHVwZGF0ZShwb3NpdGlvbjogVGV4dEJ1ZmZlci5Qb2ludCwgbWVtYmVyOiBNb2RlbHMuU2lnbmF0dXJlSGVscCkge1xyXG4gICAgICAgIHRoaXMuX3Bvc2l0aW9uID0gcG9zaXRpb247XHJcbiAgICAgICAgY29uc3QgcmFuZ2UgPSBbW3Bvc2l0aW9uLnJvdywgcG9zaXRpb24uY29sdW1uXSwgW3Bvc2l0aW9uLnJvdywgcG9zaXRpb24uY29sdW1uXV07XHJcbiAgICAgICAgaWYgKCF0aGlzLl9tYXJrZXIpIHtcclxuICAgICAgICAgICAgdGhpcy5fbWFya2VyID0gKDxhbnk+dGhpcy5fZWRpdG9yKS5tYXJrQnVmZmVyUmFuZ2UocmFuZ2UvKiwgeyBpbnZhbGlkYXRlOiBcImluc2lkZVwiIH0qLyk7XHJcbiAgICAgICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX21hcmtlci5kZXN0cm95KCk7XHJcbiAgICAgICAgICAgIH0pKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLl9tYXJrZXIuc2V0QnVmZmVyUmFuZ2UoPGFueT5yYW5nZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIXRoaXMuX2VsZW1lbnQgfHwgIXRoaXMuX2RlY29yYXRpb24pIHtcclxuICAgICAgICAgICAgdGhpcy5fZWxlbWVudCA9IG5ldyBTaWduYXR1cmVWaWV3KCk7XHJcbiAgICAgICAgICAgIHRoaXMuX2VsZW1lbnQuc2V0TGluZUhlaWdodCh0aGlzLl9saW5lSGVpZ2h0KTtcclxuICAgICAgICAgICAgdGhpcy5fZGVjb3JhdGlvbiA9IDxhbnk+dGhpcy5fZWRpdG9yLmRlY29yYXRlTWFya2VyKHRoaXMuX21hcmtlciwge1xyXG4gICAgICAgICAgICAgICAgdHlwZTogJ292ZXJsYXknLFxyXG4gICAgICAgICAgICAgICAgY2xhc3M6IGBzaWduYXR1cmUtaGVscGAsXHJcbiAgICAgICAgICAgICAgICBpdGVtOiB0aGlzLl9lbGVtZW50LFxyXG4gICAgICAgICAgICAgICAgcG9zaXRpb246ICdoZWFkJ1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghdGhpcy5fbWVtYmVyKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3VwZGF0ZU1lbWJlcihtZW1iZXIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKG1lbWJlciAmJiB0aGlzLl9tZW1iZXIuU2lnbmF0dXJlcyAmJiBtZW1iZXIuU2lnbmF0dXJlcykge1xyXG4gICAgICAgICAgICBpZiAoIWlzRXF1YWwobWVtYmVyLlNpZ25hdHVyZXMsIHRoaXMuX21lbWJlci5TaWduYXR1cmVzKSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICghaXNFcXVhbChtZW1iZXIsIHRoaXMuX21lbWJlcikpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX3VwZGF0ZU1lbWJlcihtZW1iZXIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkaXNwb3NlKCkge1xyXG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX3VwZGF0ZU1lbWJlcihtZW1iZXI6IE1vZGVscy5TaWduYXR1cmVIZWxwKSB7XHJcbiAgICAgICAgdGhpcy5fbWVtYmVyID0gbWVtYmVyO1xyXG4gICAgICAgIHRoaXMuX2VsZW1lbnQudXBkYXRlTWVtYmVyKG1lbWJlcik7XHJcbiAgICB9XHJcbn1cclxuIl19
