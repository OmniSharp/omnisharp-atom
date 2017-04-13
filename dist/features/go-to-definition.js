'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.goToDefintion = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _rxjs = require('rxjs');

var _tsDisposables = require('ts-disposables');

var _omni = require('../server/omni');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var $ = require('jquery');
var Range = require('atom').Range;
var identifierRegex = /^identifier|identifier$|\.identifier\./;

var GoToDefinition = function () {
    function GoToDefinition() {
        _classCallCheck(this, GoToDefinition);

        this.required = true;
        this.title = 'Go To Definition';
        this.description = 'Adds support to goto definition, as well as display metadata returned by a goto definition metadata response';
    }

    _createClass(GoToDefinition, [{
        key: 'activate',
        value: function activate() {
            var _this = this;

            this.disposable = new _tsDisposables.CompositeDisposable();
            var altGotoDefinition = false;
            this.disposable.add(atom.config.observe('omnisharp-atom:altGotoDefinition', function (value) {
                return altGotoDefinition = value;
            }));
            this.disposable.add(_omni.Omni.switchActiveEditor(function (editor, cd) {
                var view = $(atom.views.getView(editor));
                var scroll = _this._getFromShadowDom(view, '.scroll-view');
                if (!scroll[0]) {
                    return;
                }
                var click = _rxjs.Observable.fromEvent(scroll[0], 'click');
                var mousemove = _rxjs.Observable.fromEvent(scroll[0], 'mousemove');
                var keyup = _rxjs.Observable.merge(_rxjs.Observable.fromEvent(view[0], 'focus'), _rxjs.Observable.fromEvent(view[0], 'blur'), _rxjs.Observable.fromEventPattern(function (x) {
                    atom.getCurrentWindow().on('focus', x);
                }, function (x) {
                    atom.getCurrentWindow().removeListener('focus', x);
                }), _rxjs.Observable.fromEventPattern(function (x) {
                    atom.getCurrentWindow().on('blur', x);
                }, function (x) {
                    atom.getCurrentWindow().removeListener('blur', x);
                }), _rxjs.Observable.fromEvent(view[0], 'keyup').filter(function (x) {
                    if (altGotoDefinition) {
                        return x.which === 18;
                    }
                    return x.which === 17 || x.which === 224 || x.which === 93 || x.which === 92 || x.which === 91;
                })).throttleTime(100);
                var keydown = _rxjs.Observable.fromEvent(view[0], 'keydown').filter(function (z) {
                    return !z.repeat;
                }).filter(function (e) {
                    return altGotoDefinition ? e.altKey : e.ctrlKey || e.metaKey;
                }).throttleTime(100);
                var specialKeyDown = keydown.switchMap(function (x) {
                    return mousemove.takeUntil(keyup).map(function (event) {
                        var pixelPt = _this._pixelPositionFromMouseEvent(editor, view, event);
                        if (!pixelPt) {
                            return;
                        }
                        var screenPt = editor.screenPositionForPixelPosition(pixelPt);
                        return editor.bufferPositionForScreenPosition(screenPt);
                    }).filter(function (a) {
                        return !!a;
                    }).startWith(editor.getCursorBufferPosition()).map(function (bufferPt) {
                        return { bufferPt: bufferPt, range: _this._getWordRange(editor, bufferPt) };
                    }).filter(function (z) {
                        return !!z.range;
                    }).distinctUntilChanged(function (current, next) {
                        return current.range.isEqual(next.range);
                    });
                });
                editor.onDidDestroy(function () {
                    return cd.dispose();
                });
                var eventDisposable = void 0;
                cd.add(atom.config.observe('omnisharp-atom.enhancedHighlighting', function (enabled) {
                    _this.enhancedHighlighting = enabled;
                    if (eventDisposable) {
                        eventDisposable.unsubscribe();
                        cd.remove(eventDisposable);
                    }
                    var observable = specialKeyDown;
                    if (!enabled) {
                        observable = observable.debounceTime(200);
                    }
                    eventDisposable = observable.subscribe(function (_ref) {
                        var bufferPt = _ref.bufferPt,
                            range = _ref.range;
                        return _this._underlineIfNavigable(editor, bufferPt, range);
                    });
                    cd.add(eventDisposable);
                }));
                cd.add(keyup.subscribe(function () {
                    return _this._removeMarker();
                }));
                cd.add(click.subscribe(function (e) {
                    if (!e.ctrlKey && !e.metaKey) {
                        return;
                    }
                    if (altGotoDefinition && !e.altKey) {
                        return;
                    }
                    _this._removeMarker();
                    _this.goToDefinition();
                }));
                _this.disposable.add(cd);
            }));
            this.disposable.add(atom.emitter.on('symbols-view:go-to-declaration', function () {
                return _this.goToDefinition();
            }));
            this.disposable.add(_omni.Omni.addTextEditorCommand('omnisharp-atom:go-to-definition', function () {
                return _this.goToDefinition();
            }));
            this.disposable.add(atom.config.observe('omnisharp-atom.wantMetadata', function (enabled) {
                _this.wantMetadata = enabled;
            }));
        }
    }, {
        key: 'dispose',
        value: function dispose() {
            this.disposable.dispose();
        }
    }, {
        key: 'goToDefinition',
        value: function goToDefinition() {
            var _this2 = this;

            var editor = atom.workspace.getActiveTextEditor();
            if (editor) {
                var word = editor.getWordUnderCursor();
                _omni.Omni.request(editor, function (solution) {
                    return solution.gotodefinition({
                        WantMetadata: _this2.wantMetadata
                    });
                }).subscribe(function (data) {
                    if (data.FileName != null) {
                        _omni.Omni.navigateTo(data);
                    } else if (data.MetadataSource) {
                        var _data$MetadataSource = data.MetadataSource,
                            AssemblyName = _data$MetadataSource.AssemblyName,
                            TypeName = _data$MetadataSource.TypeName;

                        atom.workspace.open('omnisharp://metadata/' + AssemblyName + '/' + TypeName, {
                            initialLine: data.Line,
                            initialColumn: data.Column,
                            searchAllPanes: true
                        });
                    } else {
                        atom.notifications.addWarning('Can\'t navigate to ' + word);
                    }
                });
            }
        }
    }, {
        key: '_getWordRange',
        value: function _getWordRange(editor, bufferPt) {
            var buffer = editor.getBuffer();
            var startColumn = bufferPt.column;
            var endColumn = bufferPt.column;
            var line = buffer.getLines()[bufferPt.row];
            if (!/[A-Z_0-9]/i.test(line[bufferPt.column])) {
                if (this.marker) {
                    this._removeMarker();
                }
                return;
            }
            while (startColumn > 0 && /[A-Z_0-9]/i.test(line[--startColumn])) {}
            while (endColumn < line.length && /[A-Z_0-9]/i.test(line[++endColumn])) {}
            return new Range([bufferPt.row, startColumn + 1], [bufferPt.row, endColumn]);
        }
    }, {
        key: '_underlineIfNavigable',
        value: function _underlineIfNavigable(editor, bufferPt, wordRange) {
            var _this3 = this;

            if (this.marker && this.marker.bufferMarker.range && this.marker.bufferMarker.range.compare(wordRange) === 0) {
                return;
            }
            var decoration = void 0;
            var addMark = function addMark() {
                _this3._removeMarker();
                _this3.marker = editor.markBufferRange(wordRange);
                decoration = editor.decorateMarker(_this3.marker, { type: 'highlight', class: 'gotodefinition-underline' });
            };
            if (this.enhancedHighlighting) {
                var scopes = editor.scopeDescriptorForBufferPosition(bufferPt).scopes;
                if (identifierRegex.test((0, _lodash.last)(scopes))) {
                    addMark();
                }
            } else {
                _omni.Omni.request(editor, function (solution) {
                    return solution.gotodefinition({
                        Line: bufferPt.row,
                        Column: bufferPt.column
                    });
                }).filter(function (data) {
                    return !!data.FileName || !!data.MetadataSource;
                }).subscribe(function (data) {
                    return addMark();
                });
            }
        }
    }, {
        key: '_pixelPositionFromMouseEvent',
        value: function _pixelPositionFromMouseEvent(editor, editorView, event) {
            var clientX = event.clientX;
            var clientY = event.clientY;
            var shadow = this._getFromShadowDom(editorView, '.lines')[0];
            if (!shadow) {
                return;
            }
            var linesClientRect = shadow.getBoundingClientRect();
            var top = clientY - linesClientRect.top;
            var left = clientX - linesClientRect.left;
            top += editor.getScrollTop();
            left += editor.getScrollLeft();
            return { top: top, left: left };
        }
    }, {
        key: '_getFromShadowDom',
        value: function _getFromShadowDom(element, selector) {
            try {
                var el = element[0];
                var found = el.rootElement.querySelectorAll(selector);
                return $(found[0]);
            } catch (e) {
                return $(document.createElement('div'));
            }
        }
    }, {
        key: '_removeMarker',
        value: function _removeMarker() {
            if (this.marker != null) {
                this.marker.destroy();
                this.marker = null;
            }
        }
    }]);

    return GoToDefinition;
}();

var goToDefintion = exports.goToDefintion = new GoToDefinition();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9nby10by1kZWZpbml0aW9uLnRzIl0sIm5hbWVzIjpbIiQiLCJyZXF1aXJlIiwiUmFuZ2UiLCJpZGVudGlmaWVyUmVnZXgiLCJHb1RvRGVmaW5pdGlvbiIsInJlcXVpcmVkIiwidGl0bGUiLCJkZXNjcmlwdGlvbiIsImRpc3Bvc2FibGUiLCJhbHRHb3RvRGVmaW5pdGlvbiIsImFkZCIsImF0b20iLCJjb25maWciLCJvYnNlcnZlIiwidmFsdWUiLCJzd2l0Y2hBY3RpdmVFZGl0b3IiLCJlZGl0b3IiLCJjZCIsInZpZXciLCJ2aWV3cyIsImdldFZpZXciLCJzY3JvbGwiLCJfZ2V0RnJvbVNoYWRvd0RvbSIsImNsaWNrIiwiZnJvbUV2ZW50IiwibW91c2Vtb3ZlIiwia2V5dXAiLCJtZXJnZSIsImZyb21FdmVudFBhdHRlcm4iLCJnZXRDdXJyZW50V2luZG93Iiwib24iLCJ4IiwicmVtb3ZlTGlzdGVuZXIiLCJmaWx0ZXIiLCJ3aGljaCIsInRocm90dGxlVGltZSIsImtleWRvd24iLCJ6IiwicmVwZWF0IiwiZSIsImFsdEtleSIsImN0cmxLZXkiLCJtZXRhS2V5Iiwic3BlY2lhbEtleURvd24iLCJzd2l0Y2hNYXAiLCJ0YWtlVW50aWwiLCJtYXAiLCJwaXhlbFB0IiwiX3BpeGVsUG9zaXRpb25Gcm9tTW91c2VFdmVudCIsImV2ZW50Iiwic2NyZWVuUHQiLCJzY3JlZW5Qb3NpdGlvbkZvclBpeGVsUG9zaXRpb24iLCJidWZmZXJQb3NpdGlvbkZvclNjcmVlblBvc2l0aW9uIiwiYSIsInN0YXJ0V2l0aCIsImdldEN1cnNvckJ1ZmZlclBvc2l0aW9uIiwiYnVmZmVyUHQiLCJyYW5nZSIsIl9nZXRXb3JkUmFuZ2UiLCJkaXN0aW5jdFVudGlsQ2hhbmdlZCIsImN1cnJlbnQiLCJuZXh0IiwiaXNFcXVhbCIsIm9uRGlkRGVzdHJveSIsImRpc3Bvc2UiLCJldmVudERpc3Bvc2FibGUiLCJlbmFibGVkIiwiZW5oYW5jZWRIaWdobGlnaHRpbmciLCJ1bnN1YnNjcmliZSIsInJlbW92ZSIsIm9ic2VydmFibGUiLCJkZWJvdW5jZVRpbWUiLCJzdWJzY3JpYmUiLCJfdW5kZXJsaW5lSWZOYXZpZ2FibGUiLCJfcmVtb3ZlTWFya2VyIiwiZ29Ub0RlZmluaXRpb24iLCJlbWl0dGVyIiwiYWRkVGV4dEVkaXRvckNvbW1hbmQiLCJ3YW50TWV0YWRhdGEiLCJ3b3Jrc3BhY2UiLCJnZXRBY3RpdmVUZXh0RWRpdG9yIiwid29yZCIsImdldFdvcmRVbmRlckN1cnNvciIsInJlcXVlc3QiLCJzb2x1dGlvbiIsImdvdG9kZWZpbml0aW9uIiwiV2FudE1ldGFkYXRhIiwiZGF0YSIsIkZpbGVOYW1lIiwibmF2aWdhdGVUbyIsIk1ldGFkYXRhU291cmNlIiwiQXNzZW1ibHlOYW1lIiwiVHlwZU5hbWUiLCJvcGVuIiwiaW5pdGlhbExpbmUiLCJMaW5lIiwiaW5pdGlhbENvbHVtbiIsIkNvbHVtbiIsInNlYXJjaEFsbFBhbmVzIiwibm90aWZpY2F0aW9ucyIsImFkZFdhcm5pbmciLCJidWZmZXIiLCJnZXRCdWZmZXIiLCJzdGFydENvbHVtbiIsImNvbHVtbiIsImVuZENvbHVtbiIsImxpbmUiLCJnZXRMaW5lcyIsInJvdyIsInRlc3QiLCJtYXJrZXIiLCJsZW5ndGgiLCJ3b3JkUmFuZ2UiLCJidWZmZXJNYXJrZXIiLCJjb21wYXJlIiwiZGVjb3JhdGlvbiIsImFkZE1hcmsiLCJtYXJrQnVmZmVyUmFuZ2UiLCJkZWNvcmF0ZU1hcmtlciIsInR5cGUiLCJjbGFzcyIsInNjb3BlcyIsInNjb3BlRGVzY3JpcHRvckZvckJ1ZmZlclBvc2l0aW9uIiwiZWRpdG9yVmlldyIsImNsaWVudFgiLCJjbGllbnRZIiwic2hhZG93IiwibGluZXNDbGllbnRSZWN0IiwiZ2V0Qm91bmRpbmdDbGllbnRSZWN0IiwidG9wIiwibGVmdCIsImdldFNjcm9sbFRvcCIsImdldFNjcm9sbExlZnQiLCJlbGVtZW50Iiwic2VsZWN0b3IiLCJlbCIsImZvdW5kIiwicm9vdEVsZW1lbnQiLCJxdWVyeVNlbGVj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QUFNZ0Msd0NBQWdCLElBQUkxSSxjQUFKLEVBQXRCIiwiZmlsZSI6ImxpYi9mZWF0dXJlcy9nby10by1kZWZpbml0aW9uLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgbGFzdCB9IGZyb20gJ2xvZGFzaCc7XHJcbmltcG9ydCB7IE1vZGVscyB9IGZyb20gJ29tbmlzaGFycC1jbGllbnQnO1xyXG5pbXBvcnQgeyBPYnNlcnZhYmxlLCBTdWJzY3JpcHRpb24gfSBmcm9tICdyeGpzJztcclxuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSB9IGZyb20gJ3RzLWRpc3Bvc2FibGVzJztcclxuaW1wb3J0IHsgT21uaSB9IGZyb20gJy4uL3NlcnZlci9vbW5pJztcclxuLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLXJlcXVpcmUtaW1wb3J0cyBuby12YXItcmVxdWlyZXNcclxuY29uc3QgJDogSlF1ZXJ5U3RhdGljID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbi8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby1yZXF1aXJlLWltcG9ydHMgbm8tdmFyLXJlcXVpcmVzXHJcbmNvbnN0IFJhbmdlOiB0eXBlb2YgVGV4dEJ1ZmZlci5SYW5nZSA9IHJlcXVpcmUoJ2F0b20nKS5SYW5nZTtcclxuY29uc3QgaWRlbnRpZmllclJlZ2V4ID0gL15pZGVudGlmaWVyfGlkZW50aWZpZXIkfFxcLmlkZW50aWZpZXJcXC4vO1xyXG5cclxuY2xhc3MgR29Ub0RlZmluaXRpb24gaW1wbGVtZW50cyBJRmVhdHVyZSB7XHJcbiAgICBwdWJsaWMgcmVxdWlyZWQgPSB0cnVlO1xyXG4gICAgcHVibGljIHRpdGxlID0gJ0dvIFRvIERlZmluaXRpb24nO1xyXG4gICAgcHVibGljIGRlc2NyaXB0aW9uID0gJ0FkZHMgc3VwcG9ydCB0byBnb3RvIGRlZmluaXRpb24sIGFzIHdlbGwgYXMgZGlzcGxheSBtZXRhZGF0YSByZXR1cm5lZCBieSBhIGdvdG8gZGVmaW5pdGlvbiBtZXRhZGF0YSByZXNwb25zZSc7XHJcblxyXG4gICAgcHJpdmF0ZSBkaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xyXG4gICAgcHJpdmF0ZSBlbmhhbmNlZEhpZ2hsaWdodGluZzogYm9vbGVhbjtcclxuICAgIHByaXZhdGUgbWFya2VyOiBBdG9tLk1hcmtlcjtcclxuICAgIHByaXZhdGUgd2FudE1ldGFkYXRhOiBib29sZWFuO1xyXG5cclxuICAgIHB1YmxpYyBhY3RpdmF0ZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG4gICAgICAgIGxldCBhbHRHb3RvRGVmaW5pdGlvbiA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb25maWcub2JzZXJ2ZSgnb21uaXNoYXJwLWF0b206YWx0R290b0RlZmluaXRpb24nLCB2YWx1ZSA9PiBhbHRHb3RvRGVmaW5pdGlvbiA9IHZhbHVlKSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5zd2l0Y2hBY3RpdmVFZGl0b3IoKGVkaXRvciwgY2QpID0+IHtcclxuICAgICAgICAgICAgY29uc3QgdmlldyA9ICQoYXRvbS52aWV3cy5nZXRWaWV3KGVkaXRvcikpO1xyXG4gICAgICAgICAgICBjb25zdCBzY3JvbGwgPSB0aGlzLl9nZXRGcm9tU2hhZG93RG9tKHZpZXcsICcuc2Nyb2xsLXZpZXcnKTtcclxuICAgICAgICAgICAgaWYgKCFzY3JvbGxbMF0pIHtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgY29uc3QgY2xpY2sgPSBPYnNlcnZhYmxlLmZyb21FdmVudDxNb3VzZUV2ZW50PihzY3JvbGxbMF0sICdjbGljaycpO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgbW91c2Vtb3ZlID0gT2JzZXJ2YWJsZS5mcm9tRXZlbnQ8TW91c2VFdmVudD4oc2Nyb2xsWzBdLCAnbW91c2Vtb3ZlJyk7XHJcblxyXG4gICAgICAgICAgICBjb25zdCBrZXl1cCA9IE9ic2VydmFibGUubWVyZ2UoXHJcbiAgICAgICAgICAgICAgICBPYnNlcnZhYmxlLmZyb21FdmVudDxhbnk+KHZpZXdbMF0sICdmb2N1cycpLFxyXG4gICAgICAgICAgICAgICAgT2JzZXJ2YWJsZS5mcm9tRXZlbnQ8YW55Pih2aWV3WzBdLCAnYmx1cicpLFxyXG4gICAgICAgICAgICAgICAgT2JzZXJ2YWJsZS5mcm9tRXZlbnRQYXR0ZXJuPGFueT4oXHJcbiAgICAgICAgICAgICAgICAgICAgeCA9PiB7ICg8YW55PmF0b20uZ2V0Q3VycmVudFdpbmRvdygpKS5vbignZm9jdXMnLCB4KTsgfSxcclxuICAgICAgICAgICAgICAgICAgICB4ID0+IHsgKDxhbnk+YXRvbS5nZXRDdXJyZW50V2luZG93KCkpLnJlbW92ZUxpc3RlbmVyKCdmb2N1cycsIHgpOyB9KSxcclxuICAgICAgICAgICAgICAgIE9ic2VydmFibGUuZnJvbUV2ZW50UGF0dGVybjxhbnk+KFxyXG4gICAgICAgICAgICAgICAgICAgIHggPT4geyAoPGFueT5hdG9tLmdldEN1cnJlbnRXaW5kb3coKSkub24oJ2JsdXInLCB4KTsgfSxcclxuICAgICAgICAgICAgICAgICAgICB4ID0+IHsgKDxhbnk+YXRvbS5nZXRDdXJyZW50V2luZG93KCkpLnJlbW92ZUxpc3RlbmVyKCdibHVyJywgeCk7IH0pLFxyXG4gICAgICAgICAgICAgICAgT2JzZXJ2YWJsZS5mcm9tRXZlbnQ8S2V5Ym9hcmRFdmVudD4odmlld1swXSwgJ2tleXVwJylcclxuICAgICAgICAgICAgICAgICAgICAuZmlsdGVyKHggPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYWx0R290b0RlZmluaXRpb24pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB4LndoaWNoID09PSAxODsgLy8gYWx0XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHgud2hpY2ggPT09IDE3IC8qY3RybCovIHx8IC8qbWV0YSAtLT4gKi8geC53aGljaCA9PT0gMjI0IHx8IHgud2hpY2ggPT09IDkzIHx8IHgud2hpY2ggPT09IDkyIHx8IHgud2hpY2ggPT09IDkxO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICAgICAgICAgIC50aHJvdHRsZVRpbWUoMTAwKTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IGtleWRvd24gPSBPYnNlcnZhYmxlLmZyb21FdmVudDxLZXlib2FyZEV2ZW50Pih2aWV3WzBdLCAna2V5ZG93bicpXHJcbiAgICAgICAgICAgICAgICAuZmlsdGVyKHogPT4gIXoucmVwZWF0KVxyXG4gICAgICAgICAgICAgICAgLmZpbHRlcihlID0+IGFsdEdvdG9EZWZpbml0aW9uID8gZS5hbHRLZXkgOiAoZS5jdHJsS2V5IHx8IGUubWV0YUtleSkpXHJcbiAgICAgICAgICAgICAgICAudGhyb3R0bGVUaW1lKDEwMCk7XHJcblxyXG4gICAgICAgICAgICBjb25zdCBzcGVjaWFsS2V5RG93biA9IGtleWRvd25cclxuICAgICAgICAgICAgICAgIC5zd2l0Y2hNYXAoeCA9PiBtb3VzZW1vdmVcclxuICAgICAgICAgICAgICAgICAgICAudGFrZVVudGlsKGtleXVwKVxyXG4gICAgICAgICAgICAgICAgICAgIC5tYXAoZXZlbnQgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwaXhlbFB0ID0gdGhpcy5fcGl4ZWxQb3NpdGlvbkZyb21Nb3VzZUV2ZW50KGVkaXRvciwgdmlldywgZXZlbnQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXBpeGVsUHQpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHNjcmVlblB0ID0gZWRpdG9yLnNjcmVlblBvc2l0aW9uRm9yUGl4ZWxQb3NpdGlvbihwaXhlbFB0KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVkaXRvci5idWZmZXJQb3NpdGlvbkZvclNjcmVlblBvc2l0aW9uKHNjcmVlblB0KTtcclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgICAgIC5maWx0ZXIoYSA9PiAhIWEpXHJcbiAgICAgICAgICAgICAgICAgICAgLnN0YXJ0V2l0aChlZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKSlcclxuICAgICAgICAgICAgICAgICAgICAubWFwKGJ1ZmZlclB0ID0+ICh7IGJ1ZmZlclB0LCByYW5nZTogdGhpcy5fZ2V0V29yZFJhbmdlKGVkaXRvciwgYnVmZmVyUHQpIH0pKVxyXG4gICAgICAgICAgICAgICAgICAgIC5maWx0ZXIoeiA9PiAhIXoucmFuZ2UpXHJcbiAgICAgICAgICAgICAgICAgICAgLmRpc3RpbmN0VW50aWxDaGFuZ2VkKChjdXJyZW50LCBuZXh0KSA9PiBjdXJyZW50LnJhbmdlLmlzRXF1YWwoPGFueT5uZXh0LnJhbmdlKSkpO1xyXG5cclxuICAgICAgICAgICAgZWRpdG9yLm9uRGlkRGVzdHJveSgoKSA9PiBjZC5kaXNwb3NlKCkpO1xyXG5cclxuICAgICAgICAgICAgbGV0IGV2ZW50RGlzcG9zYWJsZTogU3Vic2NyaXB0aW9uO1xyXG4gICAgICAgICAgICBjZC5hZGQoYXRvbS5jb25maWcub2JzZXJ2ZSgnb21uaXNoYXJwLWF0b20uZW5oYW5jZWRIaWdobGlnaHRpbmcnLCAoZW5hYmxlZDogYm9vbGVhbikgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5lbmhhbmNlZEhpZ2hsaWdodGluZyA9IGVuYWJsZWQ7XHJcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnREaXNwb3NhYmxlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZXZlbnREaXNwb3NhYmxlLnVuc3Vic2NyaWJlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgY2QucmVtb3ZlKGV2ZW50RGlzcG9zYWJsZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IG9ic2VydmFibGUgPSBzcGVjaWFsS2V5RG93bjtcclxuICAgICAgICAgICAgICAgIGlmICghZW5hYmxlZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIG9ic2VydmFibGUgPSBvYnNlcnZhYmxlLmRlYm91bmNlVGltZSgyMDApO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGV2ZW50RGlzcG9zYWJsZSA9IG9ic2VydmFibGVcclxuICAgICAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKCh7IGJ1ZmZlclB0LCByYW5nZSB9KSA9PiB0aGlzLl91bmRlcmxpbmVJZk5hdmlnYWJsZShlZGl0b3IsIGJ1ZmZlclB0LCByYW5nZSkpO1xyXG5cclxuICAgICAgICAgICAgICAgIGNkLmFkZChldmVudERpc3Bvc2FibGUpO1xyXG4gICAgICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgICAgICBjZC5hZGQoa2V5dXAuc3Vic2NyaWJlKCgpID0+IHRoaXMuX3JlbW92ZU1hcmtlcigpKSk7XHJcblxyXG4gICAgICAgICAgICBjZC5hZGQoY2xpY2suc3Vic2NyaWJlKGUgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFlLmN0cmxLZXkgJiYgIWUubWV0YUtleSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChhbHRHb3RvRGVmaW5pdGlvbiAmJiAhZS5hbHRLZXkpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5fcmVtb3ZlTWFya2VyKCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmdvVG9EZWZpbml0aW9uKCk7XHJcbiAgICAgICAgICAgIH0pKTtcclxuICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChjZCk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uZW1pdHRlci5vbignc3ltYm9scy12aWV3OmdvLXRvLWRlY2xhcmF0aW9uJywgKCkgPT4gdGhpcy5nb1RvRGVmaW5pdGlvbigpKSk7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmFkZFRleHRFZGl0b3JDb21tYW5kKCdvbW5pc2hhcnAtYXRvbTpnby10by1kZWZpbml0aW9uJywgKCkgPT4gdGhpcy5nb1RvRGVmaW5pdGlvbigpKSk7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbmZpZy5vYnNlcnZlKCdvbW5pc2hhcnAtYXRvbS53YW50TWV0YWRhdGEnLCBlbmFibGVkID0+IHtcclxuICAgICAgICAgICAgdGhpcy53YW50TWV0YWRhdGEgPSBlbmFibGVkO1xyXG4gICAgICAgIH0pKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGlzcG9zZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnb1RvRGVmaW5pdGlvbigpIHtcclxuICAgICAgICBjb25zdCBlZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKCk7XHJcbiAgICAgICAgaWYgKGVkaXRvcikge1xyXG4gICAgICAgICAgICBjb25zdCB3b3JkID0gPGFueT5lZGl0b3IuZ2V0V29yZFVuZGVyQ3Vyc29yKCk7XHJcbiAgICAgICAgICAgIE9tbmkucmVxdWVzdChlZGl0b3IsIHNvbHV0aW9uID0+IHNvbHV0aW9uLmdvdG9kZWZpbml0aW9uKHtcclxuICAgICAgICAgICAgICAgIFdhbnRNZXRhZGF0YTogdGhpcy53YW50TWV0YWRhdGFcclxuICAgICAgICAgICAgfSkpXHJcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKChkYXRhOiBNb2RlbHMuR290b0RlZmluaXRpb25SZXNwb25zZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTp0cmlwbGUtZXF1YWxzXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRhdGEuRmlsZU5hbWUgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBPbW5pLm5hdmlnYXRlVG8oZGF0YSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChkYXRhLk1ldGFkYXRhU291cmNlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIHRzbGludDpkaXNhYmxlOnZhcmlhYmxlLW5hbWUgKi9cclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgeyBBc3NlbWJseU5hbWUsIFR5cGVOYW1lIH0gPSBkYXRhLk1ldGFkYXRhU291cmNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiB0c2xpbnQ6ZW5hYmxlOnZhcmlhYmxlLW5hbWUgKi9cclxuICAgICAgICAgICAgICAgICAgICAgICAgYXRvbS53b3Jrc3BhY2Uub3Blbihgb21uaXNoYXJwOi8vbWV0YWRhdGEvJHtBc3NlbWJseU5hbWV9LyR7VHlwZU5hbWV9YCwgPGFueT57XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbml0aWFsTGluZTogZGF0YS5MaW5lLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5pdGlhbENvbHVtbjogZGF0YS5Db2x1bW4sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWFyY2hBbGxQYW5lczogdHJ1ZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkV2FybmluZyhgQ2FuJ3QgbmF2aWdhdGUgdG8gJHt3b3JkfWApO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9nZXRXb3JkUmFuZ2UoZWRpdG9yOiBBdG9tLlRleHRFZGl0b3IsIGJ1ZmZlclB0OiBUZXh0QnVmZmVyLlBvaW50KTogVGV4dEJ1ZmZlci5SYW5nZSB7XHJcbiAgICAgICAgY29uc3QgYnVmZmVyID0gZWRpdG9yLmdldEJ1ZmZlcigpO1xyXG4gICAgICAgIGxldCBzdGFydENvbHVtbiA9IGJ1ZmZlclB0LmNvbHVtbjtcclxuICAgICAgICBsZXQgZW5kQ29sdW1uID0gYnVmZmVyUHQuY29sdW1uO1xyXG4gICAgICAgIGNvbnN0IGxpbmUgPSBidWZmZXIuZ2V0TGluZXMoKVtidWZmZXJQdC5yb3ddO1xyXG5cclxuICAgICAgICBpZiAoIS9bQS1aXzAtOV0vaS50ZXN0KGxpbmVbYnVmZmVyUHQuY29sdW1uXSkpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMubWFya2VyKSB7IHRoaXMuX3JlbW92ZU1hcmtlcigpOyB9XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHdoaWxlIChzdGFydENvbHVtbiA+IDAgJiYgL1tBLVpfMC05XS9pLnRlc3QobGluZVstLXN0YXJ0Q29sdW1uXSkpIHsgLyogKi8gfVxyXG5cclxuICAgICAgICB3aGlsZSAoZW5kQ29sdW1uIDwgbGluZS5sZW5ndGggJiYgL1tBLVpfMC05XS9pLnRlc3QobGluZVsrK2VuZENvbHVtbl0pKSB7IC8qICovIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG5ldyBSYW5nZShbYnVmZmVyUHQucm93LCBzdGFydENvbHVtbiArIDFdLCBbYnVmZmVyUHQucm93LCBlbmRDb2x1bW5dKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF91bmRlcmxpbmVJZk5hdmlnYWJsZShlZGl0b3I6IEF0b20uVGV4dEVkaXRvciwgYnVmZmVyUHQ6IFRleHRCdWZmZXIuUG9pbnQsIHdvcmRSYW5nZTogVGV4dEJ1ZmZlci5SYW5nZSkge1xyXG4gICAgICAgIGlmICh0aGlzLm1hcmtlciAmJlxyXG4gICAgICAgICAgICAoPGFueT50aGlzLm1hcmtlci5idWZmZXJNYXJrZXIpLnJhbmdlICYmXHJcbiAgICAgICAgICAgICg8YW55PnRoaXMubWFya2VyLmJ1ZmZlck1hcmtlcikucmFuZ2UuY29tcGFyZSh3b3JkUmFuZ2UpID09PSAwKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBkZWNvcmF0aW9uOiBBdG9tLk1hcmtlcjtcclxuICAgICAgICBjb25zdCBhZGRNYXJrID0gKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLl9yZW1vdmVNYXJrZXIoKTtcclxuICAgICAgICAgICAgdGhpcy5tYXJrZXIgPSBlZGl0b3IubWFya0J1ZmZlclJhbmdlKHdvcmRSYW5nZSk7XHJcbiAgICAgICAgICAgIGRlY29yYXRpb24gPSBlZGl0b3IuZGVjb3JhdGVNYXJrZXIodGhpcy5tYXJrZXIsIHsgdHlwZTogJ2hpZ2hsaWdodCcsIGNsYXNzOiAnZ290b2RlZmluaXRpb24tdW5kZXJsaW5lJyB9KTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBpZiAodGhpcy5lbmhhbmNlZEhpZ2hsaWdodGluZykge1xyXG4gICAgICAgICAgICBjb25zdCBzY29wZXM6IHN0cmluZ1tdID0gKDxhbnk+ZWRpdG9yLnNjb3BlRGVzY3JpcHRvckZvckJ1ZmZlclBvc2l0aW9uKGJ1ZmZlclB0KSkuc2NvcGVzO1xyXG4gICAgICAgICAgICBpZiAoaWRlbnRpZmllclJlZ2V4LnRlc3QobGFzdChzY29wZXMpKSkge1xyXG4gICAgICAgICAgICAgICAgYWRkTWFyaygpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgLy8gSWYgZW5oYW5jZWQgaGlnaGxpZ2h0aW5nIGlzIG9mZiwgZmFsbGJhY2sgdG8gdGhlIG9sZCBtZXRob2QuXHJcbiAgICAgICAgICAgIE9tbmkucmVxdWVzdChlZGl0b3IsIHNvbHV0aW9uID0+IHNvbHV0aW9uLmdvdG9kZWZpbml0aW9uKHtcclxuICAgICAgICAgICAgICAgIExpbmU6IGJ1ZmZlclB0LnJvdyxcclxuICAgICAgICAgICAgICAgIENvbHVtbjogYnVmZmVyUHQuY29sdW1uXHJcbiAgICAgICAgICAgIH0pKS5maWx0ZXIoZGF0YSA9PiAhIWRhdGEuRmlsZU5hbWUgfHwgISFkYXRhLk1ldGFkYXRhU291cmNlKVxyXG4gICAgICAgICAgICAgICAgLnN1YnNjcmliZShkYXRhID0+IGFkZE1hcmsoKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX3BpeGVsUG9zaXRpb25Gcm9tTW91c2VFdmVudChlZGl0b3I6IEF0b20uVGV4dEVkaXRvciwgZWRpdG9yVmlldzogYW55LCBldmVudDogTW91c2VFdmVudCkge1xyXG4gICAgICAgIGNvbnN0IGNsaWVudFggPSBldmVudC5jbGllbnRYO1xyXG4gICAgICAgIGNvbnN0IGNsaWVudFkgPSBldmVudC5jbGllbnRZO1xyXG4gICAgICAgIGNvbnN0IHNoYWRvdyA9IHRoaXMuX2dldEZyb21TaGFkb3dEb20oZWRpdG9yVmlldywgJy5saW5lcycpWzBdO1xyXG4gICAgICAgIGlmICghc2hhZG93KSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IGxpbmVzQ2xpZW50UmVjdCA9IHNoYWRvdy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcclxuXHJcbiAgICAgICAgbGV0IHRvcCA9IGNsaWVudFkgLSBsaW5lc0NsaWVudFJlY3QudG9wO1xyXG4gICAgICAgIGxldCBsZWZ0ID0gY2xpZW50WCAtIGxpbmVzQ2xpZW50UmVjdC5sZWZ0O1xyXG4gICAgICAgIHRvcCArPSAoPGFueT5lZGl0b3IpLmdldFNjcm9sbFRvcCgpO1xyXG4gICAgICAgIGxlZnQgKz0gKDxhbnk+ZWRpdG9yKS5nZXRTY3JvbGxMZWZ0KCk7XHJcbiAgICAgICAgcmV0dXJuIHsgdG9wLCBsZWZ0IH07XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfZ2V0RnJvbVNoYWRvd0RvbShlbGVtZW50OiBKUXVlcnksIHNlbGVjdG9yOiBzdHJpbmcpOiBKUXVlcnkge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGVsID0gZWxlbWVudFswXTtcclxuICAgICAgICAgICAgY29uc3QgZm91bmQgPSAoPGFueT5lbCkucm9vdEVsZW1lbnQucXVlcnlTZWxlY3RvckFsbChzZWxlY3Rvcik7XHJcbiAgICAgICAgICAgIHJldHVybiAkKGZvdW5kWzBdKTtcclxuICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAkKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfcmVtb3ZlTWFya2VyKCkge1xyXG4gICAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTp0cmlwbGUtZXF1YWxzXHJcbiAgICAgICAgaWYgKHRoaXMubWFya2VyICE9IG51bGwpIHtcclxuICAgICAgICAgICAgdGhpcy5tYXJrZXIuZGVzdHJveSgpO1xyXG4gICAgICAgICAgICB0aGlzLm1hcmtlciA9IG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG4vLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6ZXhwb3J0LW5hbWVcclxuZXhwb3J0IGNvbnN0IGdvVG9EZWZpbnRpb24gPSBuZXcgR29Ub0RlZmluaXRpb24oKTtcclxuIl19
