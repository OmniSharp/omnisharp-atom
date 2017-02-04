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
                (function () {
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
                })();
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9nby10by1kZWZpbml0aW9uLnRzIl0sIm5hbWVzIjpbIiQiLCJyZXF1aXJlIiwiUmFuZ2UiLCJpZGVudGlmaWVyUmVnZXgiLCJHb1RvRGVmaW5pdGlvbiIsInJlcXVpcmVkIiwidGl0bGUiLCJkZXNjcmlwdGlvbiIsImRpc3Bvc2FibGUiLCJhbHRHb3RvRGVmaW5pdGlvbiIsImFkZCIsImF0b20iLCJjb25maWciLCJvYnNlcnZlIiwidmFsdWUiLCJzd2l0Y2hBY3RpdmVFZGl0b3IiLCJlZGl0b3IiLCJjZCIsInZpZXciLCJ2aWV3cyIsImdldFZpZXciLCJzY3JvbGwiLCJfZ2V0RnJvbVNoYWRvd0RvbSIsImNsaWNrIiwiZnJvbUV2ZW50IiwibW91c2Vtb3ZlIiwia2V5dXAiLCJtZXJnZSIsImZyb21FdmVudFBhdHRlcm4iLCJnZXRDdXJyZW50V2luZG93Iiwib24iLCJ4IiwicmVtb3ZlTGlzdGVuZXIiLCJmaWx0ZXIiLCJ3aGljaCIsInRocm90dGxlVGltZSIsImtleWRvd24iLCJ6IiwicmVwZWF0IiwiZSIsImFsdEtleSIsImN0cmxLZXkiLCJtZXRhS2V5Iiwic3BlY2lhbEtleURvd24iLCJzd2l0Y2hNYXAiLCJ0YWtlVW50aWwiLCJtYXAiLCJwaXhlbFB0IiwiX3BpeGVsUG9zaXRpb25Gcm9tTW91c2VFdmVudCIsImV2ZW50Iiwic2NyZWVuUHQiLCJzY3JlZW5Qb3NpdGlvbkZvclBpeGVsUG9zaXRpb24iLCJidWZmZXJQb3NpdGlvbkZvclNjcmVlblBvc2l0aW9uIiwiYSIsInN0YXJ0V2l0aCIsImdldEN1cnNvckJ1ZmZlclBvc2l0aW9uIiwiYnVmZmVyUHQiLCJyYW5nZSIsIl9nZXRXb3JkUmFuZ2UiLCJkaXN0aW5jdFVudGlsQ2hhbmdlZCIsImN1cnJlbnQiLCJuZXh0IiwiaXNFcXVhbCIsIm9uRGlkRGVzdHJveSIsImRpc3Bvc2UiLCJldmVudERpc3Bvc2FibGUiLCJlbmFibGVkIiwiZW5oYW5jZWRIaWdobGlnaHRpbmciLCJ1bnN1YnNjcmliZSIsInJlbW92ZSIsIm9ic2VydmFibGUiLCJkZWJvdW5jZVRpbWUiLCJzdWJzY3JpYmUiLCJfdW5kZXJsaW5lSWZOYXZpZ2FibGUiLCJfcmVtb3ZlTWFya2VyIiwiZ29Ub0RlZmluaXRpb24iLCJlbWl0dGVyIiwiYWRkVGV4dEVkaXRvckNvbW1hbmQiLCJ3YW50TWV0YWRhdGEiLCJ3b3Jrc3BhY2UiLCJnZXRBY3RpdmVUZXh0RWRpdG9yIiwid29yZCIsImdldFdvcmRVbmRlckN1cnNvciIsInJlcXVlc3QiLCJzb2x1dGlvbiIsImdvdG9kZWZpbml0aW9uIiwiV2FudE1ldGFkYXRhIiwiZGF0YSIsIkZpbGVOYW1lIiwibmF2aWdhdGVUbyIsIk1ldGFkYXRhU291cmNlIiwiQXNzZW1ibHlOYW1lIiwiVHlwZU5hbWUiLCJvcGVuIiwiaW5pdGlhbExpbmUiLCJMaW5lIiwiaW5pdGlhbENvbHVtbiIsIkNvbHVtbiIsInNlYXJjaEFsbFBhbmVzIiwibm90aWZpY2F0aW9ucyIsImFkZFdhcm5pbmciLCJidWZmZXIiLCJnZXRCdWZmZXIiLCJzdGFydENvbHVtbiIsImNvbHVtbiIsImVuZENvbHVtbiIsImxpbmUiLCJnZXRMaW5lcyIsInJvdyIsInRlc3QiLCJtYXJrZXIiLCJsZW5ndGgiLCJ3b3JkUmFuZ2UiLCJidWZmZXJNYXJrZXIiLCJjb21wYXJlIiwiZGVjb3JhdGlvbiIsImFkZE1hcmsiLCJtYXJrQnVmZmVyUmFuZ2UiLCJkZWNvcmF0ZU1hcmtlciIsInR5cGUiLCJjbGFzcyIsInNjb3BlcyIsInNjb3BlRGVzY3JpcHRvckZvckJ1ZmZlclBvc2l0aW9uIiwiZWRpdG9yVmlldyIsImNsaWVudFgiLCJjbGllbnRZIiwic2hhZG93IiwibGluZXNDbGllbnRSZWN0IiwiZ2V0Qm91bmRpbmdDbGllbnRSZWN0IiwidG9wIiwibGVmdCIsImdldFNjcm9sbFRvcCIsImdldFNjcm9sbExlZnQiLCJlbGVtZW50Iiwic2VsZWN0b3IiLCJlbCIsImZvdW5kIiwicm9vdEVsZW1lbnQiLCJxdWVyeVNlbGVj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Ozs7O0FBSUUsSUFBTWdDLHdDQUFnQixJQUFJMUksY0FBSixFQUF0QiIsImZpbGUiOiJsaWIvZmVhdHVyZXMvZ28tdG8tZGVmaW5pdGlvbi5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGxhc3QgfSBmcm9tICdsb2Rhc2gnO1xyXG5pbXBvcnQgeyBNb2RlbHMgfSBmcm9tICdvbW5pc2hhcnAtY2xpZW50JztcclxuaW1wb3J0IHsgT2JzZXJ2YWJsZSwgU3Vic2NyaXB0aW9uIH0gZnJvbSAncnhqcyc7XHJcbmltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUgfSBmcm9tICd0cy1kaXNwb3NhYmxlcyc7XHJcbmltcG9ydCB7IE9tbmkgfSBmcm9tICcuLi9zZXJ2ZXIvb21uaSc7XHJcbi8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby1yZXF1aXJlLWltcG9ydHMgbm8tdmFyLXJlcXVpcmVzXHJcbmNvbnN0ICQ6IEpRdWVyeVN0YXRpYyA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG4vLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8tcmVxdWlyZS1pbXBvcnRzIG5vLXZhci1yZXF1aXJlc1xyXG5jb25zdCBSYW5nZTogdHlwZW9mIFRleHRCdWZmZXIuUmFuZ2UgPSByZXF1aXJlKCdhdG9tJykuUmFuZ2U7XHJcbmNvbnN0IGlkZW50aWZpZXJSZWdleCA9IC9eaWRlbnRpZmllcnxpZGVudGlmaWVyJHxcXC5pZGVudGlmaWVyXFwuLztcclxuXHJcbmNsYXNzIEdvVG9EZWZpbml0aW9uIGltcGxlbWVudHMgSUZlYXR1cmUge1xyXG4gICAgcHVibGljIHJlcXVpcmVkID0gdHJ1ZTtcclxuICAgIHB1YmxpYyB0aXRsZSA9ICdHbyBUbyBEZWZpbml0aW9uJztcclxuICAgIHB1YmxpYyBkZXNjcmlwdGlvbiA9ICdBZGRzIHN1cHBvcnQgdG8gZ290byBkZWZpbml0aW9uLCBhcyB3ZWxsIGFzIGRpc3BsYXkgbWV0YWRhdGEgcmV0dXJuZWQgYnkgYSBnb3RvIGRlZmluaXRpb24gbWV0YWRhdGEgcmVzcG9uc2UnO1xyXG5cclxuICAgIHByaXZhdGUgZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxuICAgIHByaXZhdGUgZW5oYW5jZWRIaWdobGlnaHRpbmc6IGJvb2xlYW47XHJcbiAgICBwcml2YXRlIG1hcmtlcjogQXRvbS5NYXJrZXI7XHJcbiAgICBwcml2YXRlIHdhbnRNZXRhZGF0YTogYm9vbGVhbjtcclxuXHJcbiAgICBwdWJsaWMgYWN0aXZhdGUoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgICAgICBsZXQgYWx0R290b0RlZmluaXRpb24gPSBmYWxzZTtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoJ29tbmlzaGFycC1hdG9tOmFsdEdvdG9EZWZpbml0aW9uJywgdmFsdWUgPT4gYWx0R290b0RlZmluaXRpb24gPSB2YWx1ZSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuc3dpdGNoQWN0aXZlRWRpdG9yKChlZGl0b3IsIGNkKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IHZpZXcgPSAkKGF0b20udmlld3MuZ2V0VmlldyhlZGl0b3IpKTtcclxuICAgICAgICAgICAgY29uc3Qgc2Nyb2xsID0gdGhpcy5fZ2V0RnJvbVNoYWRvd0RvbSh2aWV3LCAnLnNjcm9sbC12aWV3Jyk7XHJcbiAgICAgICAgICAgIGlmICghc2Nyb2xsWzBdKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGNvbnN0IGNsaWNrID0gT2JzZXJ2YWJsZS5mcm9tRXZlbnQ8TW91c2VFdmVudD4oc2Nyb2xsWzBdLCAnY2xpY2snKTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IG1vdXNlbW92ZSA9IE9ic2VydmFibGUuZnJvbUV2ZW50PE1vdXNlRXZlbnQ+KHNjcm9sbFswXSwgJ21vdXNlbW92ZScpO1xyXG5cclxuICAgICAgICAgICAgY29uc3Qga2V5dXAgPSBPYnNlcnZhYmxlLm1lcmdlKFxyXG4gICAgICAgICAgICAgICAgT2JzZXJ2YWJsZS5mcm9tRXZlbnQ8YW55Pih2aWV3WzBdLCAnZm9jdXMnKSxcclxuICAgICAgICAgICAgICAgIE9ic2VydmFibGUuZnJvbUV2ZW50PGFueT4odmlld1swXSwgJ2JsdXInKSxcclxuICAgICAgICAgICAgICAgIE9ic2VydmFibGUuZnJvbUV2ZW50UGF0dGVybjxhbnk+KFxyXG4gICAgICAgICAgICAgICAgICAgIHggPT4geyAoPGFueT5hdG9tLmdldEN1cnJlbnRXaW5kb3coKSkub24oJ2ZvY3VzJywgeCk7IH0sXHJcbiAgICAgICAgICAgICAgICAgICAgeCA9PiB7ICg8YW55PmF0b20uZ2V0Q3VycmVudFdpbmRvdygpKS5yZW1vdmVMaXN0ZW5lcignZm9jdXMnLCB4KTsgfSksXHJcbiAgICAgICAgICAgICAgICBPYnNlcnZhYmxlLmZyb21FdmVudFBhdHRlcm48YW55PihcclxuICAgICAgICAgICAgICAgICAgICB4ID0+IHsgKDxhbnk+YXRvbS5nZXRDdXJyZW50V2luZG93KCkpLm9uKCdibHVyJywgeCk7IH0sXHJcbiAgICAgICAgICAgICAgICAgICAgeCA9PiB7ICg8YW55PmF0b20uZ2V0Q3VycmVudFdpbmRvdygpKS5yZW1vdmVMaXN0ZW5lcignYmx1cicsIHgpOyB9KSxcclxuICAgICAgICAgICAgICAgIE9ic2VydmFibGUuZnJvbUV2ZW50PEtleWJvYXJkRXZlbnQ+KHZpZXdbMF0sICdrZXl1cCcpXHJcbiAgICAgICAgICAgICAgICAgICAgLmZpbHRlcih4ID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFsdEdvdG9EZWZpbml0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4geC53aGljaCA9PT0gMTg7IC8vIGFsdFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB4LndoaWNoID09PSAxNyAvKmN0cmwqLyB8fCAvKm1ldGEgLS0+ICovIHgud2hpY2ggPT09IDIyNCB8fCB4LndoaWNoID09PSA5MyB8fCB4LndoaWNoID09PSA5MiB8fCB4LndoaWNoID09PSA5MTtcclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgICAgICAgICAudGhyb3R0bGVUaW1lKDEwMCk7XHJcblxyXG4gICAgICAgICAgICBjb25zdCBrZXlkb3duID0gT2JzZXJ2YWJsZS5mcm9tRXZlbnQ8S2V5Ym9hcmRFdmVudD4odmlld1swXSwgJ2tleWRvd24nKVxyXG4gICAgICAgICAgICAgICAgLmZpbHRlcih6ID0+ICF6LnJlcGVhdClcclxuICAgICAgICAgICAgICAgIC5maWx0ZXIoZSA9PiBhbHRHb3RvRGVmaW5pdGlvbiA/IGUuYWx0S2V5IDogKGUuY3RybEtleSB8fCBlLm1ldGFLZXkpKVxyXG4gICAgICAgICAgICAgICAgLnRocm90dGxlVGltZSgxMDApO1xyXG5cclxuICAgICAgICAgICAgY29uc3Qgc3BlY2lhbEtleURvd24gPSBrZXlkb3duXHJcbiAgICAgICAgICAgICAgICAuc3dpdGNoTWFwKHggPT4gbW91c2Vtb3ZlXHJcbiAgICAgICAgICAgICAgICAgICAgLnRha2VVbnRpbChrZXl1cClcclxuICAgICAgICAgICAgICAgICAgICAubWFwKGV2ZW50ID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcGl4ZWxQdCA9IHRoaXMuX3BpeGVsUG9zaXRpb25Gcm9tTW91c2VFdmVudChlZGl0b3IsIHZpZXcsIGV2ZW50KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFwaXhlbFB0KSB7IHJldHVybjsgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBzY3JlZW5QdCA9IGVkaXRvci5zY3JlZW5Qb3NpdGlvbkZvclBpeGVsUG9zaXRpb24ocGl4ZWxQdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBlZGl0b3IuYnVmZmVyUG9zaXRpb25Gb3JTY3JlZW5Qb3NpdGlvbihzY3JlZW5QdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgICAgICAuZmlsdGVyKGEgPT4gISFhKVxyXG4gICAgICAgICAgICAgICAgICAgIC5zdGFydFdpdGgoZWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKCkpXHJcbiAgICAgICAgICAgICAgICAgICAgLm1hcChidWZmZXJQdCA9PiAoeyBidWZmZXJQdCwgcmFuZ2U6IHRoaXMuX2dldFdvcmRSYW5nZShlZGl0b3IsIGJ1ZmZlclB0KSB9KSlcclxuICAgICAgICAgICAgICAgICAgICAuZmlsdGVyKHogPT4gISF6LnJhbmdlKVxyXG4gICAgICAgICAgICAgICAgICAgIC5kaXN0aW5jdFVudGlsQ2hhbmdlZCgoY3VycmVudCwgbmV4dCkgPT4gY3VycmVudC5yYW5nZS5pc0VxdWFsKDxhbnk+bmV4dC5yYW5nZSkpKTtcclxuXHJcbiAgICAgICAgICAgIGVkaXRvci5vbkRpZERlc3Ryb3koKCkgPT4gY2QuZGlzcG9zZSgpKTtcclxuXHJcbiAgICAgICAgICAgIGxldCBldmVudERpc3Bvc2FibGU6IFN1YnNjcmlwdGlvbjtcclxuICAgICAgICAgICAgY2QuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoJ29tbmlzaGFycC1hdG9tLmVuaGFuY2VkSGlnaGxpZ2h0aW5nJywgKGVuYWJsZWQ6IGJvb2xlYW4pID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZW5oYW5jZWRIaWdobGlnaHRpbmcgPSBlbmFibGVkO1xyXG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50RGlzcG9zYWJsZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50RGlzcG9zYWJsZS51bnN1YnNjcmliZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNkLnJlbW92ZShldmVudERpc3Bvc2FibGUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGxldCBvYnNlcnZhYmxlID0gc3BlY2lhbEtleURvd247XHJcbiAgICAgICAgICAgICAgICBpZiAoIWVuYWJsZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICBvYnNlcnZhYmxlID0gb2JzZXJ2YWJsZS5kZWJvdW5jZVRpbWUoMjAwKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBldmVudERpc3Bvc2FibGUgPSBvYnNlcnZhYmxlXHJcbiAgICAgICAgICAgICAgICAgICAgLnN1YnNjcmliZSgoeyBidWZmZXJQdCwgcmFuZ2UgfSkgPT4gdGhpcy5fdW5kZXJsaW5lSWZOYXZpZ2FibGUoZWRpdG9yLCBidWZmZXJQdCwgcmFuZ2UpKTtcclxuXHJcbiAgICAgICAgICAgICAgICBjZC5hZGQoZXZlbnREaXNwb3NhYmxlKTtcclxuICAgICAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICAgICAgY2QuYWRkKGtleXVwLnN1YnNjcmliZSgoKSA9PiB0aGlzLl9yZW1vdmVNYXJrZXIoKSkpO1xyXG5cclxuICAgICAgICAgICAgY2QuYWRkKGNsaWNrLnN1YnNjcmliZShlID0+IHtcclxuICAgICAgICAgICAgICAgIGlmICghZS5jdHJsS2V5ICYmICFlLm1ldGFLZXkpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoYWx0R290b0RlZmluaXRpb24gJiYgIWUuYWx0S2V5KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMuX3JlbW92ZU1hcmtlcigpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5nb1RvRGVmaW5pdGlvbigpO1xyXG4gICAgICAgICAgICB9KSk7XHJcbiAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoY2QpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmVtaXR0ZXIub24oJ3N5bWJvbHMtdmlldzpnby10by1kZWNsYXJhdGlvbicsICgpID0+IHRoaXMuZ29Ub0RlZmluaXRpb24oKSkpO1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5hZGRUZXh0RWRpdG9yQ29tbWFuZCgnb21uaXNoYXJwLWF0b206Z28tdG8tZGVmaW5pdGlvbicsICgpID0+IHRoaXMuZ29Ub0RlZmluaXRpb24oKSkpO1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb25maWcub2JzZXJ2ZSgnb21uaXNoYXJwLWF0b20ud2FudE1ldGFkYXRhJywgZW5hYmxlZCA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMud2FudE1ldGFkYXRhID0gZW5hYmxlZDtcclxuICAgICAgICB9KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ29Ub0RlZmluaXRpb24oKSB7XHJcbiAgICAgICAgY29uc3QgZWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpO1xyXG4gICAgICAgIGlmIChlZGl0b3IpIHtcclxuICAgICAgICAgICAgY29uc3Qgd29yZCA9IDxhbnk+ZWRpdG9yLmdldFdvcmRVbmRlckN1cnNvcigpO1xyXG4gICAgICAgICAgICBPbW5pLnJlcXVlc3QoZWRpdG9yLCBzb2x1dGlvbiA9PiBzb2x1dGlvbi5nb3RvZGVmaW5pdGlvbih7XHJcbiAgICAgICAgICAgICAgICBXYW50TWV0YWRhdGE6IHRoaXMud2FudE1ldGFkYXRhXHJcbiAgICAgICAgICAgIH0pKVxyXG4gICAgICAgICAgICAgICAgLnN1YnNjcmliZSgoZGF0YTogTW9kZWxzLkdvdG9EZWZpbml0aW9uUmVzcG9uc2UpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6dHJpcGxlLWVxdWFsc1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChkYXRhLkZpbGVOYW1lICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgT21uaS5uYXZpZ2F0ZVRvKGRhdGEpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZGF0YS5NZXRhZGF0YVNvdXJjZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiB0c2xpbnQ6ZGlzYWJsZTp2YXJpYWJsZS1uYW1lICovXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHsgQXNzZW1ibHlOYW1lLCBUeXBlTmFtZSB9ID0gZGF0YS5NZXRhZGF0YVNvdXJjZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLyogdHNsaW50OmVuYWJsZTp2YXJpYWJsZS1uYW1lICovXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGF0b20ud29ya3NwYWNlLm9wZW4oYG9tbmlzaGFycDovL21ldGFkYXRhLyR7QXNzZW1ibHlOYW1lfS8ke1R5cGVOYW1lfWAsIDxhbnk+e1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5pdGlhbExpbmU6IGRhdGEuTGluZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluaXRpYWxDb2x1bW46IGRhdGEuQ29sdW1uLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VhcmNoQWxsUGFuZXM6IHRydWVcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZFdhcm5pbmcoYENhbid0IG5hdmlnYXRlIHRvICR7d29yZH1gKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfZ2V0V29yZFJhbmdlKGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yLCBidWZmZXJQdDogVGV4dEJ1ZmZlci5Qb2ludCk6IFRleHRCdWZmZXIuUmFuZ2Uge1xyXG4gICAgICAgIGNvbnN0IGJ1ZmZlciA9IGVkaXRvci5nZXRCdWZmZXIoKTtcclxuICAgICAgICBsZXQgc3RhcnRDb2x1bW4gPSBidWZmZXJQdC5jb2x1bW47XHJcbiAgICAgICAgbGV0IGVuZENvbHVtbiA9IGJ1ZmZlclB0LmNvbHVtbjtcclxuICAgICAgICBjb25zdCBsaW5lID0gYnVmZmVyLmdldExpbmVzKClbYnVmZmVyUHQucm93XTtcclxuXHJcbiAgICAgICAgaWYgKCEvW0EtWl8wLTldL2kudGVzdChsaW5lW2J1ZmZlclB0LmNvbHVtbl0pKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLm1hcmtlcikgeyB0aGlzLl9yZW1vdmVNYXJrZXIoKTsgfVxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB3aGlsZSAoc3RhcnRDb2x1bW4gPiAwICYmIC9bQS1aXzAtOV0vaS50ZXN0KGxpbmVbLS1zdGFydENvbHVtbl0pKSB7IC8qICovIH1cclxuXHJcbiAgICAgICAgd2hpbGUgKGVuZENvbHVtbiA8IGxpbmUubGVuZ3RoICYmIC9bQS1aXzAtOV0vaS50ZXN0KGxpbmVbKytlbmRDb2x1bW5dKSkgeyAvKiAqLyB9XHJcblxyXG4gICAgICAgIHJldHVybiBuZXcgUmFuZ2UoW2J1ZmZlclB0LnJvdywgc3RhcnRDb2x1bW4gKyAxXSwgW2J1ZmZlclB0LnJvdywgZW5kQ29sdW1uXSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfdW5kZXJsaW5lSWZOYXZpZ2FibGUoZWRpdG9yOiBBdG9tLlRleHRFZGl0b3IsIGJ1ZmZlclB0OiBUZXh0QnVmZmVyLlBvaW50LCB3b3JkUmFuZ2U6IFRleHRCdWZmZXIuUmFuZ2UpIHtcclxuICAgICAgICBpZiAodGhpcy5tYXJrZXIgJiZcclxuICAgICAgICAgICAgKDxhbnk+dGhpcy5tYXJrZXIuYnVmZmVyTWFya2VyKS5yYW5nZSAmJlxyXG4gICAgICAgICAgICAoPGFueT50aGlzLm1hcmtlci5idWZmZXJNYXJrZXIpLnJhbmdlLmNvbXBhcmUod29yZFJhbmdlKSA9PT0gMCkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgZGVjb3JhdGlvbjogQXRvbS5NYXJrZXI7XHJcbiAgICAgICAgY29uc3QgYWRkTWFyayA9ICgpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5fcmVtb3ZlTWFya2VyKCk7XHJcbiAgICAgICAgICAgIHRoaXMubWFya2VyID0gZWRpdG9yLm1hcmtCdWZmZXJSYW5nZSh3b3JkUmFuZ2UpO1xyXG4gICAgICAgICAgICBkZWNvcmF0aW9uID0gZWRpdG9yLmRlY29yYXRlTWFya2VyKHRoaXMubWFya2VyLCB7IHR5cGU6ICdoaWdobGlnaHQnLCBjbGFzczogJ2dvdG9kZWZpbml0aW9uLXVuZGVybGluZScgfSk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuZW5oYW5jZWRIaWdobGlnaHRpbmcpIHtcclxuICAgICAgICAgICAgY29uc3Qgc2NvcGVzOiBzdHJpbmdbXSA9ICg8YW55PmVkaXRvci5zY29wZURlc2NyaXB0b3JGb3JCdWZmZXJQb3NpdGlvbihidWZmZXJQdCkpLnNjb3BlcztcclxuICAgICAgICAgICAgaWYgKGlkZW50aWZpZXJSZWdleC50ZXN0KGxhc3Qoc2NvcGVzKSkpIHtcclxuICAgICAgICAgICAgICAgIGFkZE1hcmsoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIElmIGVuaGFuY2VkIGhpZ2hsaWdodGluZyBpcyBvZmYsIGZhbGxiYWNrIHRvIHRoZSBvbGQgbWV0aG9kLlxyXG4gICAgICAgICAgICBPbW5pLnJlcXVlc3QoZWRpdG9yLCBzb2x1dGlvbiA9PiBzb2x1dGlvbi5nb3RvZGVmaW5pdGlvbih7XHJcbiAgICAgICAgICAgICAgICBMaW5lOiBidWZmZXJQdC5yb3csXHJcbiAgICAgICAgICAgICAgICBDb2x1bW46IGJ1ZmZlclB0LmNvbHVtblxyXG4gICAgICAgICAgICB9KSkuZmlsdGVyKGRhdGEgPT4gISFkYXRhLkZpbGVOYW1lIHx8ICEhZGF0YS5NZXRhZGF0YVNvdXJjZSlcclxuICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoZGF0YSA9PiBhZGRNYXJrKCkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9waXhlbFBvc2l0aW9uRnJvbU1vdXNlRXZlbnQoZWRpdG9yOiBBdG9tLlRleHRFZGl0b3IsIGVkaXRvclZpZXc6IGFueSwgZXZlbnQ6IE1vdXNlRXZlbnQpIHtcclxuICAgICAgICBjb25zdCBjbGllbnRYID0gZXZlbnQuY2xpZW50WDtcclxuICAgICAgICBjb25zdCBjbGllbnRZID0gZXZlbnQuY2xpZW50WTtcclxuICAgICAgICBjb25zdCBzaGFkb3cgPSB0aGlzLl9nZXRGcm9tU2hhZG93RG9tKGVkaXRvclZpZXcsICcubGluZXMnKVswXTtcclxuICAgICAgICBpZiAoIXNoYWRvdykge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBsaW5lc0NsaWVudFJlY3QgPSBzaGFkb3cuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XHJcblxyXG4gICAgICAgIGxldCB0b3AgPSBjbGllbnRZIC0gbGluZXNDbGllbnRSZWN0LnRvcDtcclxuICAgICAgICBsZXQgbGVmdCA9IGNsaWVudFggLSBsaW5lc0NsaWVudFJlY3QubGVmdDtcclxuICAgICAgICB0b3AgKz0gKDxhbnk+ZWRpdG9yKS5nZXRTY3JvbGxUb3AoKTtcclxuICAgICAgICBsZWZ0ICs9ICg8YW55PmVkaXRvcikuZ2V0U2Nyb2xsTGVmdCgpO1xyXG4gICAgICAgIHJldHVybiB7IHRvcCwgbGVmdCB9O1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX2dldEZyb21TaGFkb3dEb20oZWxlbWVudDogSlF1ZXJ5LCBzZWxlY3Rvcjogc3RyaW5nKTogSlF1ZXJ5IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCBlbCA9IGVsZW1lbnRbMF07XHJcbiAgICAgICAgICAgIGNvbnN0IGZvdW5kID0gKDxhbnk+ZWwpLnJvb3RFbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpO1xyXG4gICAgICAgICAgICByZXR1cm4gJChmb3VuZFswXSk7XHJcbiAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gJChkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX3JlbW92ZU1hcmtlcigpIHtcclxuICAgICAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6dHJpcGxlLWVxdWFsc1xyXG4gICAgICAgIGlmICh0aGlzLm1hcmtlciAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIHRoaXMubWFya2VyLmRlc3Ryb3koKTtcclxuICAgICAgICAgICAgdGhpcy5tYXJrZXIgPSBudWxsO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOmV4cG9ydC1uYW1lXHJcbmV4cG9ydCBjb25zdCBnb1RvRGVmaW50aW9uID0gbmV3IEdvVG9EZWZpbml0aW9uKCk7XHJcbiJdfQ==
