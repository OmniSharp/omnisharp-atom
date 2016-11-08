"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.goToDefintion = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _rxjs = require("rxjs");

var _tsDisposables = require("ts-disposables");

var _omni = require("../server/omni");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var $ = require("jquery");
var Range = require("atom").Range;
var identifierRegex = /^identifier|identifier$|\.identifier\./;

var GoToDefinition = function () {
    function GoToDefinition() {
        _classCallCheck(this, GoToDefinition);

        this.required = true;
        this.title = "Go To Definition";
        this.description = "Adds support to goto definition, as well as display metadata returned by a goto definition metadata response";
    }

    _createClass(GoToDefinition, [{
        key: "activate",
        value: function activate() {
            var _this = this;

            this.disposable = new _tsDisposables.CompositeDisposable();
            var altGotoDefinition = false;
            this.disposable.add(atom.config.observe("omnisharp-atom:altGotoDefinition", function (value) {
                return altGotoDefinition = value;
            }));
            this.disposable.add(_omni.Omni.switchActiveEditor(function (editor, cd) {
                var view = $(atom.views.getView(editor));
                var scroll = _this.getFromShadowDom(view, ".scroll-view");
                if (!scroll[0]) {
                    return;
                }
                var click = _rxjs.Observable.fromEvent(scroll[0], "click");
                var mousemove = _rxjs.Observable.fromEvent(scroll[0], "mousemove");
                var keyup = _rxjs.Observable.merge(_rxjs.Observable.fromEvent(view[0], "focus"), _rxjs.Observable.fromEvent(view[0], "blur"), _rxjs.Observable.fromEventPattern(function (x) {
                    atom.getCurrentWindow().on("focus", x);
                }, function (x) {
                    atom.getCurrentWindow().removeListener("focus", x);
                }), _rxjs.Observable.fromEventPattern(function (x) {
                    atom.getCurrentWindow().on("blur", x);
                }, function (x) {
                    atom.getCurrentWindow().removeListener("blur", x);
                }), _rxjs.Observable.fromEvent(view[0], "keyup").filter(function (x) {
                    return altGotoDefinition ? x.which === 18 : x.which === 17 || x.which === 224 || x.which === 93 || x.which === 92 || x.which === 91;
                })).throttleTime(100);
                var keydown = _rxjs.Observable.fromEvent(view[0], "keydown").filter(function (z) {
                    return !z.repeat;
                }).filter(function (e) {
                    return altGotoDefinition ? e.altKey : e.ctrlKey || e.metaKey;
                }).throttleTime(100);
                var specialKeyDown = keydown.switchMap(function (x) {
                    return mousemove.takeUntil(keyup).map(function (event) {
                        var pixelPt = _this.pixelPositionFromMouseEvent(editor, view, event);
                        if (!pixelPt) return;
                        var screenPt = editor.screenPositionForPixelPosition(pixelPt);
                        return editor.bufferPositionForScreenPosition(screenPt);
                    }).filter(function (a) {
                        return !!a;
                    }).startWith(editor.getCursorBufferPosition()).map(function (bufferPt) {
                        return { bufferPt: bufferPt, range: _this.getWordRange(editor, bufferPt) };
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
                cd.add(atom.config.observe("omnisharp-atom.enhancedHighlighting", function (enabled) {
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
                        return _this.underlineIfNavigable(editor, bufferPt, range);
                    });
                    cd.add(eventDisposable);
                }));
                cd.add(keyup.subscribe(function () {
                    return _this.removeMarker();
                }));
                cd.add(click.subscribe(function (e) {
                    if (!e.ctrlKey && !e.metaKey) {
                        return;
                    }
                    if (altGotoDefinition && !e.altKey) {
                        return;
                    }
                    _this.removeMarker();
                    _this.goToDefinition();
                }));
                _this.disposable.add(cd);
            }));
            this.disposable.add(atom.emitter.on("symbols-view:go-to-declaration", function () {
                return _this.goToDefinition();
            }));
            this.disposable.add(_omni.Omni.addTextEditorCommand("omnisharp-atom:go-to-definition", function () {
                return _this.goToDefinition();
            }));
            this.disposable.add(atom.config.observe("omnisharp-atom.wantMetadata", function (enabled) {
                _this.wantMetadata = enabled;
            }));
        }
    }, {
        key: "dispose",
        value: function dispose() {
            this.disposable.dispose();
        }
    }, {
        key: "goToDefinition",
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

                            atom.workspace.open("omnisharp://metadata/" + AssemblyName + "/" + TypeName, {
                                initialLine: data.Line,
                                initialColumn: data.Column,
                                searchAllPanes: true
                            });
                        } else {
                            atom.notifications.addWarning("Can't navigate to " + word);
                        }
                    });
                })();
            }
        }
    }, {
        key: "getWordRange",
        value: function getWordRange(editor, bufferPt) {
            var buffer = editor.getBuffer();
            var startColumn = bufferPt.column;
            var endColumn = bufferPt.column;
            var line = buffer.getLines()[bufferPt.row];
            if (!/[A-Z_0-9]/i.test(line[bufferPt.column])) {
                if (this.marker) this.removeMarker();
                return;
            }
            while (startColumn > 0 && /[A-Z_0-9]/i.test(line[--startColumn])) {}
            while (endColumn < line.length && /[A-Z_0-9]/i.test(line[++endColumn])) {}
            return new Range([bufferPt.row, startColumn + 1], [bufferPt.row, endColumn]);
        }
    }, {
        key: "underlineIfNavigable",
        value: function underlineIfNavigable(editor, bufferPt, wordRange) {
            var _this3 = this;

            if (this.marker && this.marker.bufferMarker.range && this.marker.bufferMarker.range.compare(wordRange) === 0) return;
            var decoration = void 0;
            var addMark = function addMark() {
                _this3.removeMarker();
                _this3.marker = editor.markBufferRange(wordRange);
                decoration = editor.decorateMarker(_this3.marker, { type: "highlight", class: "gotodefinition-underline" });
            };
            if (this.enhancedHighlighting) {
                var scopes = editor.scopeDescriptorForBufferPosition(bufferPt).scopes;
                if (identifierRegex.test(_lodash2.default.last(scopes))) {
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
        key: "pixelPositionFromMouseEvent",
        value: function pixelPositionFromMouseEvent(editor, editorView, event) {
            var clientX = event.clientX,
                clientY = event.clientY;
            var shadow = this.getFromShadowDom(editorView, ".lines")[0];
            if (!shadow) return;
            var linesClientRect = shadow.getBoundingClientRect();
            var top = clientY - linesClientRect.top;
            var left = clientX - linesClientRect.left;
            top += editor.getScrollTop();
            left += editor.getScrollLeft();
            return { top: top, left: left };
        }
    }, {
        key: "getFromShadowDom",
        value: function getFromShadowDom(element, selector) {
            try {
                var el = element[0];
                var found = el.rootElement.querySelectorAll(selector);
                return $(found[0]);
            } catch (e) {
                return $(document.createElement("div"));
            }
        }
    }, {
        key: "removeMarker",
        value: function removeMarker() {
            if (this.marker != null) {
                this.marker.destroy();
                this.marker = null;
            }
        }
    }]);

    return GoToDefinition;
}();

var goToDefintion = exports.goToDefintion = new GoToDefinition();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9nby10by1kZWZpbml0aW9uLmpzIiwibGliL2ZlYXR1cmVzL2dvLXRvLWRlZmluaXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7Ozs7QUFDQTs7QUFDQTs7QUFDQTs7Ozs7O0FDRUEsSUFBTSxJQUFrQixRQUFRLFFBQVIsQ0FBbEI7QUFFTixJQUFNLFFBQWlDLFFBQVEsTUFBUixFQUFnQixLQUFoQjtBQUV2QyxJQUFNLGtCQUFrQix3Q0FBbEI7O0lBRU47QUFBQSw4QkFBQTs7O0FBMk1XLGFBQUEsUUFBQSxHQUFXLElBQVgsQ0EzTVg7QUE0TVcsYUFBQSxLQUFBLEdBQVEsa0JBQVIsQ0E1TVg7QUE2TVcsYUFBQSxXQUFBLEdBQWMsOEdBQWQsQ0E3TVg7S0FBQTs7OzttQ0FNbUI7OztBQUNYLGlCQUFLLFVBQUwsR0FBa0Isd0NBQWxCLENBRFc7QUFFWCxnQkFBSSxvQkFBb0IsS0FBcEIsQ0FGTztBQUdYLGlCQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsS0FBSyxNQUFMLENBQVksT0FBWixDQUFvQixrQ0FBcEIsRUFBd0Q7dUJBQVMsb0JBQW9CLEtBQXBCO2FBQVQsQ0FBNUUsRUFIVztBQUtYLGlCQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsV0FBSyxrQkFBTCxDQUF3QixVQUFDLE1BQUQsRUFBUyxFQUFULEVBQVc7QUFDbkQsb0JBQU0sT0FBTyxFQUFFLEtBQUssS0FBTCxDQUFXLE9BQVgsQ0FBbUIsTUFBbkIsQ0FBRixDQUFQLENBRDZDO0FBRW5ELG9CQUFNLFNBQVMsTUFBSyxnQkFBTCxDQUFzQixJQUF0QixFQUE0QixjQUE1QixDQUFULENBRjZDO0FBR25ELG9CQUFJLENBQUMsT0FBTyxDQUFQLENBQUQsRUFBWTtBQUNaLDJCQURZO2lCQUFoQjtBQUlBLG9CQUFNLFFBQVEsaUJBQVcsU0FBWCxDQUFpQyxPQUFPLENBQVAsQ0FBakMsRUFBNEMsT0FBNUMsQ0FBUixDQVA2QztBQVNuRCxv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QUFNLElBQU4sRUFBbkIsQ0FYMkY7Ozs7eUNBY3RFLFNBQWlCLFVBQWdCO0FBQ3RELGdCQUFJO0FBQ0Esb0JBQU0sS0FBSyxRQUFRLENBQVIsQ0FBTCxDQUROO0FBRUEsb0JBQU0sUUFBYyxHQUFJLFdBQUosQ0FBZ0IsZ0JBQWhCLENBQWlDLFFBQWpDLENBQWQsQ0FGTjtBQUdBLHVCQUFPLEVBQUUsTUFBTSxDQUFOLENBQUYsQ0FBUCxDQUhBO2FBQUosQ0FJRSxPQUFPLENBQVAsRUFBVTtBQUNSLHVCQUFPLEVBQUUsU0FBUyxhQUFULENBQXVCLEtBQXZCLENBQUYsQ0FBUCxDQURRO2FBQVY7Ozs7dUNBS2M7QUFDaEIsZ0JBQUksS0FBSyxNQUFMLElBQWUsSUFBZixFQUFxQjtBQUNyQixxQkFBSyxNQUFMLENBQVksT0FBWixHQURxQjtBQUVyQixxQkFBSyxNQUFMLEdBQWMsSUFBZCxDQUZxQjthQUF6Qjs7Ozs7OztBQVdELElBQU0sd0NBQWdCLElBQUksY0FBSixFQUFoQiIsImZpbGUiOiJsaWIvZmVhdHVyZXMvZ28tdG8tZGVmaW5pdGlvbi5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcbmltcG9ydCB7IE9ic2VydmFibGUgfSBmcm9tIFwicnhqc1wiO1xuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSB9IGZyb20gXCJ0cy1kaXNwb3NhYmxlc1wiO1xuaW1wb3J0IHsgT21uaSB9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xuY29uc3QgJCA9IHJlcXVpcmUoXCJqcXVlcnlcIik7XG5jb25zdCBSYW5nZSA9IHJlcXVpcmUoXCJhdG9tXCIpLlJhbmdlO1xuY29uc3QgaWRlbnRpZmllclJlZ2V4ID0gL15pZGVudGlmaWVyfGlkZW50aWZpZXIkfFxcLmlkZW50aWZpZXJcXC4vO1xuY2xhc3MgR29Ub0RlZmluaXRpb24ge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLnJlcXVpcmVkID0gdHJ1ZTtcbiAgICAgICAgdGhpcy50aXRsZSA9IFwiR28gVG8gRGVmaW5pdGlvblwiO1xuICAgICAgICB0aGlzLmRlc2NyaXB0aW9uID0gXCJBZGRzIHN1cHBvcnQgdG8gZ290byBkZWZpbml0aW9uLCBhcyB3ZWxsIGFzIGRpc3BsYXkgbWV0YWRhdGEgcmV0dXJuZWQgYnkgYSBnb3RvIGRlZmluaXRpb24gbWV0YWRhdGEgcmVzcG9uc2VcIjtcbiAgICB9XG4gICAgYWN0aXZhdGUoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIGxldCBhbHRHb3RvRGVmaW5pdGlvbiA9IGZhbHNlO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoXCJvbW5pc2hhcnAtYXRvbTphbHRHb3RvRGVmaW5pdGlvblwiLCB2YWx1ZSA9PiBhbHRHb3RvRGVmaW5pdGlvbiA9IHZhbHVlKSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5zd2l0Y2hBY3RpdmVFZGl0b3IoKGVkaXRvciwgY2QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHZpZXcgPSAkKGF0b20udmlld3MuZ2V0VmlldyhlZGl0b3IpKTtcbiAgICAgICAgICAgIGNvbnN0IHNjcm9sbCA9IHRoaXMuZ2V0RnJvbVNoYWRvd0RvbSh2aWV3LCBcIi5zY3JvbGwtdmlld1wiKTtcbiAgICAgICAgICAgIGlmICghc2Nyb2xsWzBdKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgY2xpY2sgPSBPYnNlcnZhYmxlLmZyb21FdmVudChzY3JvbGxbMF0sIFwiY2xpY2tcIik7XG4gICAgICAgICAgICBjb25zdCBtb3VzZW1vdmUgPSBPYnNlcnZhYmxlLmZyb21FdmVudChzY3JvbGxbMF0sIFwibW91c2Vtb3ZlXCIpO1xuICAgICAgICAgICAgY29uc3Qga2V5dXAgPSBPYnNlcnZhYmxlLm1lcmdlKE9ic2VydmFibGUuZnJvbUV2ZW50KHZpZXdbMF0sIFwiZm9jdXNcIiksIE9ic2VydmFibGUuZnJvbUV2ZW50KHZpZXdbMF0sIFwiYmx1clwiKSwgT2JzZXJ2YWJsZS5mcm9tRXZlbnRQYXR0ZXJuKHggPT4geyBhdG9tLmdldEN1cnJlbnRXaW5kb3coKS5vbihcImZvY3VzXCIsIHgpOyB9LCB4ID0+IHsgYXRvbS5nZXRDdXJyZW50V2luZG93KCkucmVtb3ZlTGlzdGVuZXIoXCJmb2N1c1wiLCB4KTsgfSksIE9ic2VydmFibGUuZnJvbUV2ZW50UGF0dGVybih4ID0+IHsgYXRvbS5nZXRDdXJyZW50V2luZG93KCkub24oXCJibHVyXCIsIHgpOyB9LCB4ID0+IHsgYXRvbS5nZXRDdXJyZW50V2luZG93KCkucmVtb3ZlTGlzdGVuZXIoXCJibHVyXCIsIHgpOyB9KSwgT2JzZXJ2YWJsZS5mcm9tRXZlbnQodmlld1swXSwgXCJrZXl1cFwiKVxuICAgICAgICAgICAgICAgIC5maWx0ZXIoeCA9PiBhbHRHb3RvRGVmaW5pdGlvbiA/IHgud2hpY2ggPT09IDE4IDogKHgud2hpY2ggPT09IDE3IHx8IHgud2hpY2ggPT09IDIyNCB8fCB4LndoaWNoID09PSA5MyB8fCB4LndoaWNoID09PSA5MiB8fCB4LndoaWNoID09PSA5MSkpKVxuICAgICAgICAgICAgICAgIC50aHJvdHRsZVRpbWUoMTAwKTtcbiAgICAgICAgICAgIGNvbnN0IGtleWRvd24gPSBPYnNlcnZhYmxlLmZyb21FdmVudCh2aWV3WzBdLCBcImtleWRvd25cIilcbiAgICAgICAgICAgICAgICAuZmlsdGVyKHogPT4gIXoucmVwZWF0KVxuICAgICAgICAgICAgICAgIC5maWx0ZXIoZSA9PiBhbHRHb3RvRGVmaW5pdGlvbiA/IGUuYWx0S2V5IDogKGUuY3RybEtleSB8fCBlLm1ldGFLZXkpKVxuICAgICAgICAgICAgICAgIC50aHJvdHRsZVRpbWUoMTAwKTtcbiAgICAgICAgICAgIGNvbnN0IHNwZWNpYWxLZXlEb3duID0ga2V5ZG93blxuICAgICAgICAgICAgICAgIC5zd2l0Y2hNYXAoeCA9PiBtb3VzZW1vdmVcbiAgICAgICAgICAgICAgICAudGFrZVVudGlsKGtleXVwKVxuICAgICAgICAgICAgICAgIC5tYXAoZXZlbnQgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHBpeGVsUHQgPSB0aGlzLnBpeGVsUG9zaXRpb25Gcm9tTW91c2VFdmVudChlZGl0b3IsIHZpZXcsIGV2ZW50KTtcbiAgICAgICAgICAgICAgICBpZiAoIXBpeGVsUHQpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICBjb25zdCBzY3JlZW5QdCA9IGVkaXRvci5zY3JlZW5Qb3NpdGlvbkZvclBpeGVsUG9zaXRpb24ocGl4ZWxQdCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGVkaXRvci5idWZmZXJQb3NpdGlvbkZvclNjcmVlblBvc2l0aW9uKHNjcmVlblB0KTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmZpbHRlcihhID0+ICEhYSlcbiAgICAgICAgICAgICAgICAuc3RhcnRXaXRoKGVkaXRvci5nZXRDdXJzb3JCdWZmZXJQb3NpdGlvbigpKVxuICAgICAgICAgICAgICAgIC5tYXAoYnVmZmVyUHQgPT4gKHsgYnVmZmVyUHQsIHJhbmdlOiB0aGlzLmdldFdvcmRSYW5nZShlZGl0b3IsIGJ1ZmZlclB0KSB9KSlcbiAgICAgICAgICAgICAgICAuZmlsdGVyKHogPT4gISF6LnJhbmdlKVxuICAgICAgICAgICAgICAgIC5kaXN0aW5jdFVudGlsQ2hhbmdlZCgoY3VycmVudCwgbmV4dCkgPT4gY3VycmVudC5yYW5nZS5pc0VxdWFsKG5leHQucmFuZ2UpKSk7XG4gICAgICAgICAgICBlZGl0b3Iub25EaWREZXN0cm95KCgpID0+IGNkLmRpc3Bvc2UoKSk7XG4gICAgICAgICAgICBsZXQgZXZlbnREaXNwb3NhYmxlO1xuICAgICAgICAgICAgY2QuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoXCJvbW5pc2hhcnAtYXRvbS5lbmhhbmNlZEhpZ2hsaWdodGluZ1wiLCAoZW5hYmxlZCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuZW5oYW5jZWRIaWdobGlnaHRpbmcgPSBlbmFibGVkO1xuICAgICAgICAgICAgICAgIGlmIChldmVudERpc3Bvc2FibGUpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnREaXNwb3NhYmxlLnVuc3Vic2NyaWJlKCk7XG4gICAgICAgICAgICAgICAgICAgIGNkLnJlbW92ZShldmVudERpc3Bvc2FibGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBsZXQgb2JzZXJ2YWJsZSA9IHNwZWNpYWxLZXlEb3duO1xuICAgICAgICAgICAgICAgIGlmICghZW5hYmxlZCkge1xuICAgICAgICAgICAgICAgICAgICBvYnNlcnZhYmxlID0gb2JzZXJ2YWJsZS5kZWJvdW5jZVRpbWUoMjAwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZXZlbnREaXNwb3NhYmxlID0gb2JzZXJ2YWJsZVxuICAgICAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKCh7IGJ1ZmZlclB0LCByYW5nZSB9KSA9PiB0aGlzLnVuZGVybGluZUlmTmF2aWdhYmxlKGVkaXRvciwgYnVmZmVyUHQsIHJhbmdlKSk7XG4gICAgICAgICAgICAgICAgY2QuYWRkKGV2ZW50RGlzcG9zYWJsZSk7XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICBjZC5hZGQoa2V5dXAuc3Vic2NyaWJlKCgpID0+IHRoaXMucmVtb3ZlTWFya2VyKCkpKTtcbiAgICAgICAgICAgIGNkLmFkZChjbGljay5zdWJzY3JpYmUoKGUpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoIWUuY3RybEtleSAmJiAhZS5tZXRhS2V5KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGFsdEdvdG9EZWZpbml0aW9uICYmICFlLmFsdEtleSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlTWFya2VyKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5nb1RvRGVmaW5pdGlvbigpO1xuICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChjZCk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmVtaXR0ZXIub24oXCJzeW1ib2xzLXZpZXc6Z28tdG8tZGVjbGFyYXRpb25cIiwgKCkgPT4gdGhpcy5nb1RvRGVmaW5pdGlvbigpKSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5hZGRUZXh0RWRpdG9yQ29tbWFuZChcIm9tbmlzaGFycC1hdG9tOmdvLXRvLWRlZmluaXRpb25cIiwgKCkgPT4gdGhpcy5nb1RvRGVmaW5pdGlvbigpKSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb25maWcub2JzZXJ2ZShcIm9tbmlzaGFycC1hdG9tLndhbnRNZXRhZGF0YVwiLCBlbmFibGVkID0+IHtcbiAgICAgICAgICAgIHRoaXMud2FudE1ldGFkYXRhID0gZW5hYmxlZDtcbiAgICAgICAgfSkpO1xuICAgIH1cbiAgICBkaXNwb3NlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgIH1cbiAgICBnb1RvRGVmaW5pdGlvbigpIHtcbiAgICAgICAgY29uc3QgZWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpO1xuICAgICAgICBpZiAoZWRpdG9yKSB7XG4gICAgICAgICAgICBjb25zdCB3b3JkID0gZWRpdG9yLmdldFdvcmRVbmRlckN1cnNvcigpO1xuICAgICAgICAgICAgT21uaS5yZXF1ZXN0KGVkaXRvciwgc29sdXRpb24gPT4gc29sdXRpb24uZ290b2RlZmluaXRpb24oe1xuICAgICAgICAgICAgICAgIFdhbnRNZXRhZGF0YTogdGhpcy53YW50TWV0YWRhdGFcbiAgICAgICAgICAgIH0pKVxuICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoKGRhdGEpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZGF0YS5GaWxlTmFtZSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIE9tbmkubmF2aWdhdGVUbyhkYXRhKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoZGF0YS5NZXRhZGF0YVNvdXJjZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB7IEFzc2VtYmx5TmFtZSwgVHlwZU5hbWUgfSA9IGRhdGEuTWV0YWRhdGFTb3VyY2U7XG4gICAgICAgICAgICAgICAgICAgIGF0b20ud29ya3NwYWNlLm9wZW4oYG9tbmlzaGFycDovL21ldGFkYXRhLyR7QXNzZW1ibHlOYW1lfS8ke1R5cGVOYW1lfWAsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluaXRpYWxMaW5lOiBkYXRhLkxpbmUsXG4gICAgICAgICAgICAgICAgICAgICAgICBpbml0aWFsQ29sdW1uOiBkYXRhLkNvbHVtbixcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlYXJjaEFsbFBhbmVzOiB0cnVlXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZFdhcm5pbmcoYENhbid0IG5hdmlnYXRlIHRvICR7d29yZH1gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBnZXRXb3JkUmFuZ2UoZWRpdG9yLCBidWZmZXJQdCkge1xuICAgICAgICBjb25zdCBidWZmZXIgPSBlZGl0b3IuZ2V0QnVmZmVyKCk7XG4gICAgICAgIGxldCBzdGFydENvbHVtbiA9IGJ1ZmZlclB0LmNvbHVtbjtcbiAgICAgICAgbGV0IGVuZENvbHVtbiA9IGJ1ZmZlclB0LmNvbHVtbjtcbiAgICAgICAgY29uc3QgbGluZSA9IGJ1ZmZlci5nZXRMaW5lcygpW2J1ZmZlclB0LnJvd107XG4gICAgICAgIGlmICghL1tBLVpfMC05XS9pLnRlc3QobGluZVtidWZmZXJQdC5jb2x1bW5dKSkge1xuICAgICAgICAgICAgaWYgKHRoaXMubWFya2VyKVxuICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlTWFya2VyKCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgd2hpbGUgKHN0YXJ0Q29sdW1uID4gMCAmJiAvW0EtWl8wLTldL2kudGVzdChsaW5lWy0tc3RhcnRDb2x1bW5dKSkgeyB9XG4gICAgICAgIHdoaWxlIChlbmRDb2x1bW4gPCBsaW5lLmxlbmd0aCAmJiAvW0EtWl8wLTldL2kudGVzdChsaW5lWysrZW5kQ29sdW1uXSkpIHsgfVxuICAgICAgICByZXR1cm4gbmV3IFJhbmdlKFtidWZmZXJQdC5yb3csIHN0YXJ0Q29sdW1uICsgMV0sIFtidWZmZXJQdC5yb3csIGVuZENvbHVtbl0pO1xuICAgIH1cbiAgICB1bmRlcmxpbmVJZk5hdmlnYWJsZShlZGl0b3IsIGJ1ZmZlclB0LCB3b3JkUmFuZ2UpIHtcbiAgICAgICAgaWYgKHRoaXMubWFya2VyICYmXG4gICAgICAgICAgICB0aGlzLm1hcmtlci5idWZmZXJNYXJrZXIucmFuZ2UgJiZcbiAgICAgICAgICAgIHRoaXMubWFya2VyLmJ1ZmZlck1hcmtlci5yYW5nZS5jb21wYXJlKHdvcmRSYW5nZSkgPT09IDApXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGxldCBkZWNvcmF0aW9uO1xuICAgICAgICBjb25zdCBhZGRNYXJrID0gKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5yZW1vdmVNYXJrZXIoKTtcbiAgICAgICAgICAgIHRoaXMubWFya2VyID0gZWRpdG9yLm1hcmtCdWZmZXJSYW5nZSh3b3JkUmFuZ2UpO1xuICAgICAgICAgICAgZGVjb3JhdGlvbiA9IGVkaXRvci5kZWNvcmF0ZU1hcmtlcih0aGlzLm1hcmtlciwgeyB0eXBlOiBcImhpZ2hsaWdodFwiLCBjbGFzczogXCJnb3RvZGVmaW5pdGlvbi11bmRlcmxpbmVcIiB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKHRoaXMuZW5oYW5jZWRIaWdobGlnaHRpbmcpIHtcbiAgICAgICAgICAgIGNvbnN0IHNjb3BlcyA9IGVkaXRvci5zY29wZURlc2NyaXB0b3JGb3JCdWZmZXJQb3NpdGlvbihidWZmZXJQdCkuc2NvcGVzO1xuICAgICAgICAgICAgaWYgKGlkZW50aWZpZXJSZWdleC50ZXN0KF8ubGFzdChzY29wZXMpKSkge1xuICAgICAgICAgICAgICAgIGFkZE1hcmsoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIE9tbmkucmVxdWVzdChlZGl0b3IsIHNvbHV0aW9uID0+IHNvbHV0aW9uLmdvdG9kZWZpbml0aW9uKHtcbiAgICAgICAgICAgICAgICBMaW5lOiBidWZmZXJQdC5yb3csXG4gICAgICAgICAgICAgICAgQ29sdW1uOiBidWZmZXJQdC5jb2x1bW5cbiAgICAgICAgICAgIH0pKS5maWx0ZXIoZGF0YSA9PiAhIWRhdGEuRmlsZU5hbWUgfHwgISFkYXRhLk1ldGFkYXRhU291cmNlKVxuICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoZGF0YSA9PiBhZGRNYXJrKCkpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHBpeGVsUG9zaXRpb25Gcm9tTW91c2VFdmVudChlZGl0b3IsIGVkaXRvclZpZXcsIGV2ZW50KSB7XG4gICAgICAgIGNvbnN0IGNsaWVudFggPSBldmVudC5jbGllbnRYLCBjbGllbnRZID0gZXZlbnQuY2xpZW50WTtcbiAgICAgICAgY29uc3Qgc2hhZG93ID0gdGhpcy5nZXRGcm9tU2hhZG93RG9tKGVkaXRvclZpZXcsIFwiLmxpbmVzXCIpWzBdO1xuICAgICAgICBpZiAoIXNoYWRvdylcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3QgbGluZXNDbGllbnRSZWN0ID0gc2hhZG93LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICBsZXQgdG9wID0gY2xpZW50WSAtIGxpbmVzQ2xpZW50UmVjdC50b3A7XG4gICAgICAgIGxldCBsZWZ0ID0gY2xpZW50WCAtIGxpbmVzQ2xpZW50UmVjdC5sZWZ0O1xuICAgICAgICB0b3AgKz0gZWRpdG9yLmdldFNjcm9sbFRvcCgpO1xuICAgICAgICBsZWZ0ICs9IGVkaXRvci5nZXRTY3JvbGxMZWZ0KCk7XG4gICAgICAgIHJldHVybiB7IHRvcDogdG9wLCBsZWZ0OiBsZWZ0IH07XG4gICAgfVxuICAgIGdldEZyb21TaGFkb3dEb20oZWxlbWVudCwgc2VsZWN0b3IpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGVsID0gZWxlbWVudFswXTtcbiAgICAgICAgICAgIGNvbnN0IGZvdW5kID0gZWwucm9vdEVsZW1lbnQucXVlcnlTZWxlY3RvckFsbChzZWxlY3Rvcik7XG4gICAgICAgICAgICByZXR1cm4gJChmb3VuZFswXSk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHJldHVybiAkKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIikpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJlbW92ZU1hcmtlcigpIHtcbiAgICAgICAgaWYgKHRoaXMubWFya2VyICE9IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMubWFya2VyLmRlc3Ryb3koKTtcbiAgICAgICAgICAgIHRoaXMubWFya2VyID0gbnVsbDtcbiAgICAgICAgfVxuICAgIH1cbn1cbmV4cG9ydCBjb25zdCBnb1RvRGVmaW50aW9uID0gbmV3IEdvVG9EZWZpbml0aW9uO1xuIiwiaW1wb3J0IHtNb2RlbHN9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XHJcbmltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcclxuaW1wb3J0IHtPYnNlcnZhYmxlLCBTdWJzY3JpcHRpb259IGZyb20gXCJyeGpzXCI7XHJcbmltcG9ydCB7Q29tcG9zaXRlRGlzcG9zYWJsZX0gZnJvbSBcInRzLWRpc3Bvc2FibGVzXCI7XHJcbmltcG9ydCB7T21uaX0gZnJvbSBcIi4uL3NlcnZlci9vbW5pXCI7XHJcbmNvbnN0ICQ6IEpRdWVyeVN0YXRpYyA9IHJlcXVpcmUoXCJqcXVlcnlcIik7XHJcbi8qIHRzbGludDpkaXNhYmxlOnZhcmlhYmxlLW5hbWUgKi9cclxuY29uc3QgUmFuZ2U6IHR5cGVvZiBUZXh0QnVmZmVyLlJhbmdlID0gcmVxdWlyZShcImF0b21cIikuUmFuZ2U7XHJcbi8qIHRzbGludDplbmFibGU6dmFyaWFibGUtbmFtZSAqL1xyXG5jb25zdCBpZGVudGlmaWVyUmVnZXggPSAvXmlkZW50aWZpZXJ8aWRlbnRpZmllciR8XFwuaWRlbnRpZmllclxcLi87XHJcblxyXG5jbGFzcyBHb1RvRGVmaW5pdGlvbiBpbXBsZW1lbnRzIElGZWF0dXJlIHtcclxuICAgIHByaXZhdGUgZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxuICAgIHByaXZhdGUgZW5oYW5jZWRIaWdobGlnaHRpbmc6IGJvb2xlYW47XHJcbiAgICBwcml2YXRlIG1hcmtlcjogQXRvbS5NYXJrZXI7XHJcbiAgICBwcml2YXRlIHdhbnRNZXRhZGF0YTogYm9vbGVhbjtcclxuXHJcbiAgICBwdWJsaWMgYWN0aXZhdGUoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgICAgICBsZXQgYWx0R290b0RlZmluaXRpb24gPSBmYWxzZTtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoXCJvbW5pc2hhcnAtYXRvbTphbHRHb3RvRGVmaW5pdGlvblwiLCB2YWx1ZSA9PiBhbHRHb3RvRGVmaW5pdGlvbiA9IHZhbHVlKSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5zd2l0Y2hBY3RpdmVFZGl0b3IoKGVkaXRvciwgY2QpID0+IHtcclxuICAgICAgICAgICAgY29uc3QgdmlldyA9ICQoYXRvbS52aWV3cy5nZXRWaWV3KGVkaXRvcikpO1xyXG4gICAgICAgICAgICBjb25zdCBzY3JvbGwgPSB0aGlzLmdldEZyb21TaGFkb3dEb20odmlldywgXCIuc2Nyb2xsLXZpZXdcIik7XHJcbiAgICAgICAgICAgIGlmICghc2Nyb2xsWzBdKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGNvbnN0IGNsaWNrID0gT2JzZXJ2YWJsZS5mcm9tRXZlbnQ8TW91c2VFdmVudD4oc2Nyb2xsWzBdLCBcImNsaWNrXCIpO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgbW91c2Vtb3ZlID0gT2JzZXJ2YWJsZS5mcm9tRXZlbnQ8TW91c2VFdmVudD4oc2Nyb2xsWzBdLCBcIm1vdXNlbW92ZVwiKTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IGtleXVwID0gT2JzZXJ2YWJsZS5tZXJnZShcclxuICAgICAgICAgICAgICAgIE9ic2VydmFibGUuZnJvbUV2ZW50PGFueT4odmlld1swXSwgXCJmb2N1c1wiKSxcclxuICAgICAgICAgICAgICAgIE9ic2VydmFibGUuZnJvbUV2ZW50PGFueT4odmlld1swXSwgXCJibHVyXCIpLFxyXG4gICAgICAgICAgICAgICAgPGFueT5PYnNlcnZhYmxlLmZyb21FdmVudFBhdHRlcm48YW55Pih4ID0+IHsgKDxhbnk+YXRvbS5nZXRDdXJyZW50V2luZG93KCkpLm9uKFwiZm9jdXNcIiwgeCk7IH0sIHggPT4geyAoPGFueT5hdG9tLmdldEN1cnJlbnRXaW5kb3coKSkucmVtb3ZlTGlzdGVuZXIoXCJmb2N1c1wiLCB4KTsgfSksXHJcbiAgICAgICAgICAgICAgICA8YW55Pk9ic2VydmFibGUuZnJvbUV2ZW50UGF0dGVybjxhbnk+KHggPT4geyAoPGFueT5hdG9tLmdldEN1cnJlbnRXaW5kb3coKSkub24oXCJibHVyXCIsIHgpOyB9LCB4ID0+IHsgKDxhbnk+YXRvbS5nZXRDdXJyZW50V2luZG93KCkpLnJlbW92ZUxpc3RlbmVyKFwiYmx1clwiLCB4KTsgfSksXHJcbiAgICAgICAgICAgICAgICBPYnNlcnZhYmxlLmZyb21FdmVudDxLZXlib2FyZEV2ZW50Pih2aWV3WzBdLCBcImtleXVwXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgLmZpbHRlcih4ID0+IGFsdEdvdG9EZWZpbml0aW9uID8geC53aGljaCA9PT0gMTggLyphbHQqLyA6ICh4LndoaWNoID09PSAxNyAvKmN0cmwqLyB8fCAvKm1ldGEgLS0+ICovIHgud2hpY2ggPT09IDIyNCB8fCB4LndoaWNoID09PSA5MyB8fCB4LndoaWNoID09PSA5MiB8fCB4LndoaWNoID09PSA5MSkpXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICAgICAgICAgIC50aHJvdHRsZVRpbWUoMTAwKTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IGtleWRvd24gPSBPYnNlcnZhYmxlLmZyb21FdmVudDxLZXlib2FyZEV2ZW50Pih2aWV3WzBdLCBcImtleWRvd25cIilcclxuICAgICAgICAgICAgICAgIC5maWx0ZXIoeiA9PiAhei5yZXBlYXQpXHJcbiAgICAgICAgICAgICAgICAuZmlsdGVyKGUgPT4gYWx0R290b0RlZmluaXRpb24gPyBlLmFsdEtleSA6IChlLmN0cmxLZXkgfHwgZS5tZXRhS2V5KSlcclxuICAgICAgICAgICAgICAgIC50aHJvdHRsZVRpbWUoMTAwKTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IHNwZWNpYWxLZXlEb3duID0ga2V5ZG93blxyXG4gICAgICAgICAgICAgICAgLnN3aXRjaE1hcCh4ID0+IG1vdXNlbW92ZVxyXG4gICAgICAgICAgICAgICAgICAgIC50YWtlVW50aWwoa2V5dXApXHJcbiAgICAgICAgICAgICAgICAgICAgLm1hcChldmVudCA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHBpeGVsUHQgPSB0aGlzLnBpeGVsUG9zaXRpb25Gcm9tTW91c2VFdmVudChlZGl0b3IsIHZpZXcsIGV2ZW50KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFwaXhlbFB0KSByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHNjcmVlblB0ID0gZWRpdG9yLnNjcmVlblBvc2l0aW9uRm9yUGl4ZWxQb3NpdGlvbihwaXhlbFB0KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVkaXRvci5idWZmZXJQb3NpdGlvbkZvclNjcmVlblBvc2l0aW9uKHNjcmVlblB0KTtcclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgICAgIC5maWx0ZXIoYSA9PiAhIWEpXHJcbiAgICAgICAgICAgICAgICAgICAgLnN0YXJ0V2l0aChlZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKSlcclxuICAgICAgICAgICAgICAgICAgICAubWFwKGJ1ZmZlclB0ID0+ICh7IGJ1ZmZlclB0LCByYW5nZTogdGhpcy5nZXRXb3JkUmFuZ2UoZWRpdG9yLCBidWZmZXJQdCkgfSkpXHJcbiAgICAgICAgICAgICAgICAgICAgLmZpbHRlcih6ID0+ICEhei5yYW5nZSlcclxuICAgICAgICAgICAgICAgICAgICAuZGlzdGluY3RVbnRpbENoYW5nZWQoKGN1cnJlbnQsIG5leHQpID0+IGN1cnJlbnQucmFuZ2UuaXNFcXVhbCg8YW55Pm5leHQucmFuZ2UpKSk7XHJcblxyXG4gICAgICAgICAgICBlZGl0b3Iub25EaWREZXN0cm95KCgpID0+IGNkLmRpc3Bvc2UoKSk7XHJcblxyXG4gICAgICAgICAgICBsZXQgZXZlbnREaXNwb3NhYmxlOiBTdWJzY3JpcHRpb247XHJcbiAgICAgICAgICAgIGNkLmFkZChhdG9tLmNvbmZpZy5vYnNlcnZlKFwib21uaXNoYXJwLWF0b20uZW5oYW5jZWRIaWdobGlnaHRpbmdcIiwgKGVuYWJsZWQ6IGJvb2xlYW4pID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZW5oYW5jZWRIaWdobGlnaHRpbmcgPSBlbmFibGVkO1xyXG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50RGlzcG9zYWJsZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50RGlzcG9zYWJsZS51bnN1YnNjcmliZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNkLnJlbW92ZShldmVudERpc3Bvc2FibGUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGxldCBvYnNlcnZhYmxlID0gc3BlY2lhbEtleURvd247XHJcbiAgICAgICAgICAgICAgICBpZiAoIWVuYWJsZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICBvYnNlcnZhYmxlID0gb2JzZXJ2YWJsZS5kZWJvdW5jZVRpbWUoMjAwKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBldmVudERpc3Bvc2FibGUgPSBvYnNlcnZhYmxlXHJcbiAgICAgICAgICAgICAgICAgICAgLnN1YnNjcmliZSgoe2J1ZmZlclB0LCByYW5nZX0pID0+IHRoaXMudW5kZXJsaW5lSWZOYXZpZ2FibGUoZWRpdG9yLCBidWZmZXJQdCwgcmFuZ2UpKTtcclxuXHJcbiAgICAgICAgICAgICAgICBjZC5hZGQoZXZlbnREaXNwb3NhYmxlKTtcclxuICAgICAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICAgICAgY2QuYWRkKGtleXVwLnN1YnNjcmliZSgoKSA9PiB0aGlzLnJlbW92ZU1hcmtlcigpKSk7XHJcblxyXG4gICAgICAgICAgICBjZC5hZGQoY2xpY2suc3Vic2NyaWJlKChlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWUuY3RybEtleSAmJiAhZS5tZXRhS2V5KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKGFsdEdvdG9EZWZpbml0aW9uICYmICFlLmFsdEtleSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZU1hcmtlcigpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5nb1RvRGVmaW5pdGlvbigpO1xyXG4gICAgICAgICAgICB9KSk7XHJcbiAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoY2QpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmVtaXR0ZXIub24oXCJzeW1ib2xzLXZpZXc6Z28tdG8tZGVjbGFyYXRpb25cIiwgKCkgPT4gdGhpcy5nb1RvRGVmaW5pdGlvbigpKSk7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmFkZFRleHRFZGl0b3JDb21tYW5kKFwib21uaXNoYXJwLWF0b206Z28tdG8tZGVmaW5pdGlvblwiLCAoKSA9PiB0aGlzLmdvVG9EZWZpbml0aW9uKCkpKTtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoXCJvbW5pc2hhcnAtYXRvbS53YW50TWV0YWRhdGFcIiwgZW5hYmxlZCA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMud2FudE1ldGFkYXRhID0gZW5hYmxlZDtcclxuICAgICAgICB9KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ29Ub0RlZmluaXRpb24oKSB7XHJcbiAgICAgICAgY29uc3QgZWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpO1xyXG4gICAgICAgIGlmIChlZGl0b3IpIHtcclxuICAgICAgICAgICAgY29uc3Qgd29yZCA9IDxhbnk+ZWRpdG9yLmdldFdvcmRVbmRlckN1cnNvcigpO1xyXG4gICAgICAgICAgICBPbW5pLnJlcXVlc3QoZWRpdG9yLCBzb2x1dGlvbiA9PiBzb2x1dGlvbi5nb3RvZGVmaW5pdGlvbih7XHJcbiAgICAgICAgICAgICAgICBXYW50TWV0YWRhdGE6IHRoaXMud2FudE1ldGFkYXRhXHJcbiAgICAgICAgICAgIH0pKVxyXG4gICAgICAgICAgICAgICAgLnN1YnNjcmliZSgoZGF0YTogTW9kZWxzLkdvdG9EZWZpbml0aW9uUmVzcG9uc2UpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZGF0YS5GaWxlTmFtZSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIE9tbmkubmF2aWdhdGVUbyhkYXRhKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGRhdGEuTWV0YWRhdGFTb3VyY2UpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLyogdHNsaW50OmRpc2FibGU6dmFyaWFibGUtbmFtZSAqL1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB7QXNzZW1ibHlOYW1lLCBUeXBlTmFtZX0gPSBkYXRhLk1ldGFkYXRhU291cmNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiB0c2xpbnQ6ZW5hYmxlOnZhcmlhYmxlLW5hbWUgKi9cclxuICAgICAgICAgICAgICAgICAgICAgICAgYXRvbS53b3Jrc3BhY2Uub3Blbihgb21uaXNoYXJwOi8vbWV0YWRhdGEvJHtBc3NlbWJseU5hbWV9LyR7VHlwZU5hbWV9YCwgPGFueT57XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbml0aWFsTGluZTogZGF0YS5MaW5lLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5pdGlhbENvbHVtbjogZGF0YS5Db2x1bW4sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWFyY2hBbGxQYW5lczogdHJ1ZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkV2FybmluZyhgQ2FuJ3QgbmF2aWdhdGUgdG8gJHt3b3JkfWApO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGdldFdvcmRSYW5nZShlZGl0b3I6IEF0b20uVGV4dEVkaXRvciwgYnVmZmVyUHQ6IFRleHRCdWZmZXIuUG9pbnQpOiBUZXh0QnVmZmVyLlJhbmdlIHtcclxuICAgICAgICBjb25zdCBidWZmZXIgPSBlZGl0b3IuZ2V0QnVmZmVyKCk7XHJcbiAgICAgICAgbGV0IHN0YXJ0Q29sdW1uID0gYnVmZmVyUHQuY29sdW1uO1xyXG4gICAgICAgIGxldCBlbmRDb2x1bW4gPSBidWZmZXJQdC5jb2x1bW47XHJcbiAgICAgICAgY29uc3QgbGluZSA9IGJ1ZmZlci5nZXRMaW5lcygpW2J1ZmZlclB0LnJvd107XHJcblxyXG4gICAgICAgIGlmICghL1tBLVpfMC05XS9pLnRlc3QobGluZVtidWZmZXJQdC5jb2x1bW5dKSkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5tYXJrZXIpIHRoaXMucmVtb3ZlTWFya2VyKCk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHdoaWxlIChzdGFydENvbHVtbiA+IDAgJiYgL1tBLVpfMC05XS9pLnRlc3QobGluZVstLXN0YXJ0Q29sdW1uXSkpIHsgLyogKi8gfVxyXG5cclxuICAgICAgICB3aGlsZSAoZW5kQ29sdW1uIDwgbGluZS5sZW5ndGggJiYgL1tBLVpfMC05XS9pLnRlc3QobGluZVsrK2VuZENvbHVtbl0pKSB7IC8qICovIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG5ldyBSYW5nZShbYnVmZmVyUHQucm93LCBzdGFydENvbHVtbiArIDFdLCBbYnVmZmVyUHQucm93LCBlbmRDb2x1bW5dKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHVuZGVybGluZUlmTmF2aWdhYmxlKGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yLCBidWZmZXJQdDogVGV4dEJ1ZmZlci5Qb2ludCwgd29yZFJhbmdlOiBUZXh0QnVmZmVyLlJhbmdlKSB7XHJcbiAgICAgICAgaWYgKHRoaXMubWFya2VyICYmXHJcbiAgICAgICAgICAgICh0aGlzLm1hcmtlci5idWZmZXJNYXJrZXIgYXMgYW55KS5yYW5nZSAmJlxyXG4gICAgICAgICAgICAodGhpcy5tYXJrZXIuYnVmZmVyTWFya2VyIGFzIGFueSkucmFuZ2UuY29tcGFyZSh3b3JkUmFuZ2UpID09PSAwKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgIGxldCBkZWNvcmF0aW9uOiBBdG9tLk1hcmtlcjtcclxuICAgICAgICBjb25zdCBhZGRNYXJrID0gKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLnJlbW92ZU1hcmtlcigpO1xyXG4gICAgICAgICAgICB0aGlzLm1hcmtlciA9IGVkaXRvci5tYXJrQnVmZmVyUmFuZ2Uod29yZFJhbmdlKTtcclxuICAgICAgICAgICAgZGVjb3JhdGlvbiA9IGVkaXRvci5kZWNvcmF0ZU1hcmtlcih0aGlzLm1hcmtlciwgeyB0eXBlOiBcImhpZ2hsaWdodFwiLCBjbGFzczogXCJnb3RvZGVmaW5pdGlvbi11bmRlcmxpbmVcIiB9KTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBpZiAodGhpcy5lbmhhbmNlZEhpZ2hsaWdodGluZykge1xyXG4gICAgICAgICAgICBjb25zdCBzY29wZXM6IHN0cmluZ1tdID0gKDxhbnk+ZWRpdG9yLnNjb3BlRGVzY3JpcHRvckZvckJ1ZmZlclBvc2l0aW9uKGJ1ZmZlclB0KSkuc2NvcGVzO1xyXG4gICAgICAgICAgICBpZiAoaWRlbnRpZmllclJlZ2V4LnRlc3QoXy5sYXN0KHNjb3BlcykpKSB7XHJcbiAgICAgICAgICAgICAgICBhZGRNYXJrKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAvLyBJZiBlbmhhbmNlZCBoaWdobGlnaHRpbmcgaXMgb2ZmLCBmYWxsYmFjayB0byB0aGUgb2xkIG1ldGhvZC5cclxuICAgICAgICAgICAgT21uaS5yZXF1ZXN0KGVkaXRvciwgc29sdXRpb24gPT4gc29sdXRpb24uZ290b2RlZmluaXRpb24oe1xyXG4gICAgICAgICAgICAgICAgTGluZTogYnVmZmVyUHQucm93LFxyXG4gICAgICAgICAgICAgICAgQ29sdW1uOiBidWZmZXJQdC5jb2x1bW5cclxuICAgICAgICAgICAgfSkpLmZpbHRlcihkYXRhID0+ICEhZGF0YS5GaWxlTmFtZSB8fCAhIWRhdGEuTWV0YWRhdGFTb3VyY2UpXHJcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKGRhdGEgPT4gYWRkTWFyaygpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBwaXhlbFBvc2l0aW9uRnJvbU1vdXNlRXZlbnQoZWRpdG9yOiBBdG9tLlRleHRFZGl0b3IsIGVkaXRvclZpZXc6IGFueSwgZXZlbnQ6IE1vdXNlRXZlbnQpIHtcclxuICAgICAgICBjb25zdCBjbGllbnRYID0gZXZlbnQuY2xpZW50WCwgY2xpZW50WSA9IGV2ZW50LmNsaWVudFk7XHJcbiAgICAgICAgY29uc3Qgc2hhZG93ID0gdGhpcy5nZXRGcm9tU2hhZG93RG9tKGVkaXRvclZpZXcsIFwiLmxpbmVzXCIpWzBdO1xyXG4gICAgICAgIGlmICghc2hhZG93KVxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgY29uc3QgbGluZXNDbGllbnRSZWN0ID0gc2hhZG93LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xyXG5cclxuICAgICAgICBsZXQgdG9wID0gY2xpZW50WSAtIGxpbmVzQ2xpZW50UmVjdC50b3A7XHJcbiAgICAgICAgbGV0IGxlZnQgPSBjbGllbnRYIC0gbGluZXNDbGllbnRSZWN0LmxlZnQ7XHJcbiAgICAgICAgdG9wICs9ICg8YW55PmVkaXRvcikuZ2V0U2Nyb2xsVG9wKCk7XHJcbiAgICAgICAgbGVmdCArPSAoPGFueT5lZGl0b3IpLmdldFNjcm9sbExlZnQoKTtcclxuICAgICAgICByZXR1cm4geyB0b3A6IHRvcCwgbGVmdDogbGVmdCB9O1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZ2V0RnJvbVNoYWRvd0RvbShlbGVtZW50OiBKUXVlcnksIHNlbGVjdG9yOiBzdHJpbmcpOiBKUXVlcnkge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGVsID0gZWxlbWVudFswXTtcclxuICAgICAgICAgICAgY29uc3QgZm91bmQgPSAoPGFueT5lbCkucm9vdEVsZW1lbnQucXVlcnlTZWxlY3RvckFsbChzZWxlY3Rvcik7XHJcbiAgICAgICAgICAgIHJldHVybiAkKGZvdW5kWzBdKTtcclxuICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAkKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIikpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHJlbW92ZU1hcmtlcigpIHtcclxuICAgICAgICBpZiAodGhpcy5tYXJrZXIgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICB0aGlzLm1hcmtlci5kZXN0cm95KCk7XHJcbiAgICAgICAgICAgIHRoaXMubWFya2VyID0gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlcXVpcmVkID0gdHJ1ZTtcclxuICAgIHB1YmxpYyB0aXRsZSA9IFwiR28gVG8gRGVmaW5pdGlvblwiO1xyXG4gICAgcHVibGljIGRlc2NyaXB0aW9uID0gXCJBZGRzIHN1cHBvcnQgdG8gZ290byBkZWZpbml0aW9uLCBhcyB3ZWxsIGFzIGRpc3BsYXkgbWV0YWRhdGEgcmV0dXJuZWQgYnkgYSBnb3RvIGRlZmluaXRpb24gbWV0YWRhdGEgcmVzcG9uc2VcIjtcclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IGdvVG9EZWZpbnRpb24gPSBuZXcgR29Ub0RlZmluaXRpb247XHJcbiJdfQ==
