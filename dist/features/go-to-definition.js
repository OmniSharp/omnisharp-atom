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
                        var bufferPt = _ref.bufferPt;
                        var range = _ref.range;
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
                            var _data$MetadataSource = data.MetadataSource;
                            var AssemblyName = _data$MetadataSource.AssemblyName;
                            var TypeName = _data$MetadataSource.TypeName;

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9nby10by1kZWZpbml0aW9uLmpzIiwibGliL2ZlYXR1cmVzL2dvLXRvLWRlZmluaXRpb24udHMiXSwibmFtZXMiOlsiJCIsInJlcXVpcmUiLCJSYW5nZSIsImlkZW50aWZpZXJSZWdleCIsIkdvVG9EZWZpbml0aW9uIiwicmVxdWlyZWQiLCJ0aXRsZSIsImRlc2NyaXB0aW9uIiwiZGlzcG9zYWJsZSIsImFsdEdvdG9EZWZpbml0aW9uIiwiYWRkIiwiYXRvbSIsImNvbmZpZyIsIm9ic2VydmUiLCJ2YWx1ZSIsInN3aXRjaEFjdGl2ZUVkaXRvciIsImVkaXRvciIsImNkIiwidmlldyIsInZpZXdzIiwiZ2V0VmlldyIsInNjcm9sbCIsImdldEZyb21TaGFkb3dEb20iLCJjbGljayIsImZyb21FdmVudCIsIm1vdXNlbW92ZSIsImtleXVwIiwibWVyZ2UiLCJmcm9tRXZlbnRQYXR0ZXJuIiwiZ2V0Q3VycmVudFdpbmRvdyIsIm9uIiwieCIsInJlbW92ZUxpc3RlbmVyIiwiZmlsdGVyIiwid2hpY2giLCJ0aHJvdHRsZVRpbWUiLCJrZXlkb3duIiwieiIsInJlcGVhdCIsImUiLCJhbHRLZXkiLCJjdHJsS2V5IiwibWV0YUtleSIsInNwZWNpYWxLZXlEb3duIiwic3dpdGNoTWFwIiwidGFrZVVudGlsIiwibWFwIiwicGl4ZWxQdCIsInBpeGVsUG9zaXRpb25Gcm9tTW91c2VFdmVudCIsImV2ZW50Iiwic2NyZWVuUHQiLCJzY3JlZW5Qb3NpdGlvbkZvclBpeGVsUG9zaXRpb24iLCJidWZmZXJQb3NpdGlvbkZvclNjcmVlblBvc2l0aW9uIiwiYSIsInN0YXJ0V2l0aCIsImdldEN1cnNvckJ1ZmZlclBvc2l0aW9uIiwiYnVmZmVyUHQiLCJyYW5nZSIsImdldFdvcmRSYW5nZSIsImRpc3RpbmN0VW50aWxDaGFuZ2VkIiwiY3VycmVudCIsIm5leHQiLCJpc0VxdWFsIiwib25EaWREZXN0cm95IiwiZGlzcG9zZSIsImV2ZW50RGlzcG9zYWJsZSIsImVuYWJsZWQiLCJlbmhhbmNlZEhpZ2hsaWdodGluZyIsInVuc3Vic2NyaWJlIiwicmVtb3ZlIiwib2JzZXJ2YWJsZSIsImRlYm91bmNlVGltZSIsInN1YnNjcmliZSIsInVuZGVybGluZUlmTmF2aWdhYmxlIiwicmVtb3ZlTWFya2VyIiwiZ29Ub0RlZmluaXRpb24iLCJlbWl0dGVyIiwiYWRkVGV4dEVkaXRvckNvbW1hbmQiLCJ3YW50TWV0YWRhdGEiLCJ3b3Jrc3BhY2UiLCJnZXRBY3RpdmVUZXh0RWRpdG9yIiwid29yZCIsImdldFdvcmRVbmRlckN1cnNvciIsInJlcXVlc3QiLCJzb2x1dGlvbiIsImdvdG9kZWZpbml0aW9uIiwiV2FudE1ldGFkYXRhIiwiZGF0YSIsIkZpbGVOYW1lIiwibmF2aWdhdGVUbyIsIk1ldGFkYXRhU291cmNlIiwiQXNzZW1ibHlOYW1lIiwiVHlwZU5hbWUiLCJvcGVuIiwiaW5pdGlhbExpbmUiLCJMaW5lIiwiaW5pdGlhbENvbHVtbiIsIkNvbHVtbiIsInNlYXJjaEFsbFBhbmVzIiwibm90aWZpY2F0aW9ucyIsImFkZFdhcm5pbmciLCJidWZmZXIiLCJnZXRCdWZmZXIiLCJzdGFydENvbHVtbiIsImNvbHVtbiIsImVuZENvbHVtbiIsImxpbmUiLCJnZXRMaW5lcyIsInJvdyIsInRlc3QiLCJtYXJrZXIiLCJsZW5ndGgiLCJ3b3JkUmFuZ2UiLCJidWZmZXJNYXJrZXIiLCJjb21wYXJlIiwiZGVjb3JhdGlvbiIsImFkZE1hcmsiLCJtYXJrQnVmZmVyUmFuZ2UiLCJkZWNvcmF0ZU1hcmtlciIsInR5cGUiLCJjbGFzcyIsInNjb3BlcyIsInNjb3BlRGVzY3JpcHRvckZvckJ1ZmZlclBvc2l0aW9uIiwibGFzdCIsImVkaXRvclZpZXciLCJjbGllbnRYIiwiY2xpZW50WSIsInNoYWRvdyIsImxpbmVzQ2xpZW50UmVjdCIsImdldEJvdW5kaW5nQ2xpZW50UmVjdCIsInRvcCIsImxlZnQiLCJnZXRTY3JvbGxUb3AiLCJnZXRTY3JvbGxMZWZ0IiwiZWxlbWVudCIsInNlbGVjdG9yIiwiZWwiLCJmb3VuZCIsInJvb3RFbGVtZW50IiwicXVlcnlTZWxlY3RvckFsbCIsImRvY3VtZW50IiwiY3JlYXRlRWxlbWVudCIsImRlc3Ryb3kiLCJnb1RvRGVmaW50aW9uIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7OztBQUNBOztBQUNBOztBQUNBOzs7Ozs7QUNFQSxJQUFNQSxJQUFrQkMsUUFBUSxRQUFSLENBQXhCO0FBRUEsSUFBTUMsUUFBaUNELFFBQVEsTUFBUixFQUFnQkMsS0FBdkQ7QUFFQSxJQUFNQyxrQkFBa0Isd0NBQXhCOztJQUVBQyxjO0FBQUEsOEJBQUE7QUFBQTs7QUEyTVcsYUFBQUMsUUFBQSxHQUFXLElBQVg7QUFDQSxhQUFBQyxLQUFBLEdBQVEsa0JBQVI7QUFDQSxhQUFBQyxXQUFBLEdBQWMsOEdBQWQ7QUFDVjs7OzttQ0F4TWtCO0FBQUE7O0FBQ1gsaUJBQUtDLFVBQUwsR0FBa0Isd0NBQWxCO0FBQ0EsZ0JBQUlDLG9CQUFvQixLQUF4QjtBQUNBLGlCQUFLRCxVQUFMLENBQWdCRSxHQUFoQixDQUFvQkMsS0FBS0MsTUFBTCxDQUFZQyxPQUFaLENBQW9CLGtDQUFwQixFQUF3RDtBQUFBLHVCQUFTSixvQkFBb0JLLEtBQTdCO0FBQUEsYUFBeEQsQ0FBcEI7QUFFQSxpQkFBS04sVUFBTCxDQUFnQkUsR0FBaEIsQ0FBb0IsV0FBS0ssa0JBQUwsQ0FBd0IsVUFBQ0MsTUFBRCxFQUFTQyxFQUFULEVBQVc7QUFDbkQsb0JBQU1DLE9BQU9sQixFQUFFVyxLQUFLUSxLQUFMLENBQVdDLE9BQVgsQ0FBbUJKLE1BQW5CLENBQUYsQ0FBYjtBQUNBLG9CQUFNSyxTQUFTLE1BQUtDLGdCQUFMLENBQXNCSixJQUF0QixFQUE0QixjQUE1QixDQUFmO0FBQ0Esb0JBQUksQ0FBQ0csT0FBTyxDQUFQLENBQUwsRUFBZ0I7QUFDWjtBQUNIO0FBRUQsb0JBQU1FLFFBQVEsaUJBQVdDLFNBQVgsQ0FBaUNILE9BQU8sQ0FBUCxDQUFqQyxFQUE0QyxPQUE1QyxDQUFkO0FBRUEsb0JBQU1JLFlBQVks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Ozs7QUFPRSxJQUFNaUMsd0NBQWdCLElBQUkzSSxjQUFKLEVBQXRCIiwiZmlsZSI6ImxpYi9mZWF0dXJlcy9nby10by1kZWZpbml0aW9uLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xuaW1wb3J0IHsgT2JzZXJ2YWJsZSB9IGZyb20gXCJyeGpzXCI7XG5pbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlIH0gZnJvbSBcInRzLWRpc3Bvc2FibGVzXCI7XG5pbXBvcnQgeyBPbW5pIH0gZnJvbSBcIi4uL3NlcnZlci9vbW5pXCI7XG5jb25zdCAkID0gcmVxdWlyZShcImpxdWVyeVwiKTtcbmNvbnN0IFJhbmdlID0gcmVxdWlyZShcImF0b21cIikuUmFuZ2U7XG5jb25zdCBpZGVudGlmaWVyUmVnZXggPSAvXmlkZW50aWZpZXJ8aWRlbnRpZmllciR8XFwuaWRlbnRpZmllclxcLi87XG5jbGFzcyBHb1RvRGVmaW5pdGlvbiB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMucmVxdWlyZWQgPSB0cnVlO1xuICAgICAgICB0aGlzLnRpdGxlID0gXCJHbyBUbyBEZWZpbml0aW9uXCI7XG4gICAgICAgIHRoaXMuZGVzY3JpcHRpb24gPSBcIkFkZHMgc3VwcG9ydCB0byBnb3RvIGRlZmluaXRpb24sIGFzIHdlbGwgYXMgZGlzcGxheSBtZXRhZGF0YSByZXR1cm5lZCBieSBhIGdvdG8gZGVmaW5pdGlvbiBtZXRhZGF0YSByZXNwb25zZVwiO1xuICAgIH1cbiAgICBhY3RpdmF0ZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgbGV0IGFsdEdvdG9EZWZpbml0aW9uID0gZmFsc2U7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb25maWcub2JzZXJ2ZShcIm9tbmlzaGFycC1hdG9tOmFsdEdvdG9EZWZpbml0aW9uXCIsIHZhbHVlID0+IGFsdEdvdG9EZWZpbml0aW9uID0gdmFsdWUpKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLnN3aXRjaEFjdGl2ZUVkaXRvcigoZWRpdG9yLCBjZCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgdmlldyA9ICQoYXRvbS52aWV3cy5nZXRWaWV3KGVkaXRvcikpO1xuICAgICAgICAgICAgY29uc3Qgc2Nyb2xsID0gdGhpcy5nZXRGcm9tU2hhZG93RG9tKHZpZXcsIFwiLnNjcm9sbC12aWV3XCIpO1xuICAgICAgICAgICAgaWYgKCFzY3JvbGxbMF0pIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBjbGljayA9IE9ic2VydmFibGUuZnJvbUV2ZW50KHNjcm9sbFswXSwgXCJjbGlja1wiKTtcbiAgICAgICAgICAgIGNvbnN0IG1vdXNlbW92ZSA9IE9ic2VydmFibGUuZnJvbUV2ZW50KHNjcm9sbFswXSwgXCJtb3VzZW1vdmVcIik7XG4gICAgICAgICAgICBjb25zdCBrZXl1cCA9IE9ic2VydmFibGUubWVyZ2UoT2JzZXJ2YWJsZS5mcm9tRXZlbnQodmlld1swXSwgXCJmb2N1c1wiKSwgT2JzZXJ2YWJsZS5mcm9tRXZlbnQodmlld1swXSwgXCJibHVyXCIpLCBPYnNlcnZhYmxlLmZyb21FdmVudFBhdHRlcm4oeCA9PiB7IGF0b20uZ2V0Q3VycmVudFdpbmRvdygpLm9uKFwiZm9jdXNcIiwgeCk7IH0sIHggPT4geyBhdG9tLmdldEN1cnJlbnRXaW5kb3coKS5yZW1vdmVMaXN0ZW5lcihcImZvY3VzXCIsIHgpOyB9KSwgT2JzZXJ2YWJsZS5mcm9tRXZlbnRQYXR0ZXJuKHggPT4geyBhdG9tLmdldEN1cnJlbnRXaW5kb3coKS5vbihcImJsdXJcIiwgeCk7IH0sIHggPT4geyBhdG9tLmdldEN1cnJlbnRXaW5kb3coKS5yZW1vdmVMaXN0ZW5lcihcImJsdXJcIiwgeCk7IH0pLCBPYnNlcnZhYmxlLmZyb21FdmVudCh2aWV3WzBdLCBcImtleXVwXCIpXG4gICAgICAgICAgICAgICAgLmZpbHRlcih4ID0+IGFsdEdvdG9EZWZpbml0aW9uID8geC53aGljaCA9PT0gMTggOiAoeC53aGljaCA9PT0gMTcgfHwgeC53aGljaCA9PT0gMjI0IHx8IHgud2hpY2ggPT09IDkzIHx8IHgud2hpY2ggPT09IDkyIHx8IHgud2hpY2ggPT09IDkxKSkpXG4gICAgICAgICAgICAgICAgLnRocm90dGxlVGltZSgxMDApO1xuICAgICAgICAgICAgY29uc3Qga2V5ZG93biA9IE9ic2VydmFibGUuZnJvbUV2ZW50KHZpZXdbMF0sIFwia2V5ZG93blwiKVxuICAgICAgICAgICAgICAgIC5maWx0ZXIoeiA9PiAhei5yZXBlYXQpXG4gICAgICAgICAgICAgICAgLmZpbHRlcihlID0+IGFsdEdvdG9EZWZpbml0aW9uID8gZS5hbHRLZXkgOiAoZS5jdHJsS2V5IHx8IGUubWV0YUtleSkpXG4gICAgICAgICAgICAgICAgLnRocm90dGxlVGltZSgxMDApO1xuICAgICAgICAgICAgY29uc3Qgc3BlY2lhbEtleURvd24gPSBrZXlkb3duXG4gICAgICAgICAgICAgICAgLnN3aXRjaE1hcCh4ID0+IG1vdXNlbW92ZVxuICAgICAgICAgICAgICAgIC50YWtlVW50aWwoa2V5dXApXG4gICAgICAgICAgICAgICAgLm1hcChldmVudCA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgcGl4ZWxQdCA9IHRoaXMucGl4ZWxQb3NpdGlvbkZyb21Nb3VzZUV2ZW50KGVkaXRvciwgdmlldywgZXZlbnQpO1xuICAgICAgICAgICAgICAgIGlmICghcGl4ZWxQdClcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIGNvbnN0IHNjcmVlblB0ID0gZWRpdG9yLnNjcmVlblBvc2l0aW9uRm9yUGl4ZWxQb3NpdGlvbihwaXhlbFB0KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZWRpdG9yLmJ1ZmZlclBvc2l0aW9uRm9yU2NyZWVuUG9zaXRpb24oc2NyZWVuUHQpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuZmlsdGVyKGEgPT4gISFhKVxuICAgICAgICAgICAgICAgIC5zdGFydFdpdGgoZWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKCkpXG4gICAgICAgICAgICAgICAgLm1hcChidWZmZXJQdCA9PiAoeyBidWZmZXJQdCwgcmFuZ2U6IHRoaXMuZ2V0V29yZFJhbmdlKGVkaXRvciwgYnVmZmVyUHQpIH0pKVxuICAgICAgICAgICAgICAgIC5maWx0ZXIoeiA9PiAhIXoucmFuZ2UpXG4gICAgICAgICAgICAgICAgLmRpc3RpbmN0VW50aWxDaGFuZ2VkKChjdXJyZW50LCBuZXh0KSA9PiBjdXJyZW50LnJhbmdlLmlzRXF1YWwobmV4dC5yYW5nZSkpKTtcbiAgICAgICAgICAgIGVkaXRvci5vbkRpZERlc3Ryb3koKCkgPT4gY2QuZGlzcG9zZSgpKTtcbiAgICAgICAgICAgIGxldCBldmVudERpc3Bvc2FibGU7XG4gICAgICAgICAgICBjZC5hZGQoYXRvbS5jb25maWcub2JzZXJ2ZShcIm9tbmlzaGFycC1hdG9tLmVuaGFuY2VkSGlnaGxpZ2h0aW5nXCIsIChlbmFibGVkKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5lbmhhbmNlZEhpZ2hsaWdodGluZyA9IGVuYWJsZWQ7XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50RGlzcG9zYWJsZSkge1xuICAgICAgICAgICAgICAgICAgICBldmVudERpc3Bvc2FibGUudW5zdWJzY3JpYmUoKTtcbiAgICAgICAgICAgICAgICAgICAgY2QucmVtb3ZlKGV2ZW50RGlzcG9zYWJsZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGxldCBvYnNlcnZhYmxlID0gc3BlY2lhbEtleURvd247XG4gICAgICAgICAgICAgICAgaWYgKCFlbmFibGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIG9ic2VydmFibGUgPSBvYnNlcnZhYmxlLmRlYm91bmNlVGltZSgyMDApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBldmVudERpc3Bvc2FibGUgPSBvYnNlcnZhYmxlXG4gICAgICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoKHsgYnVmZmVyUHQsIHJhbmdlIH0pID0+IHRoaXMudW5kZXJsaW5lSWZOYXZpZ2FibGUoZWRpdG9yLCBidWZmZXJQdCwgcmFuZ2UpKTtcbiAgICAgICAgICAgICAgICBjZC5hZGQoZXZlbnREaXNwb3NhYmxlKTtcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIGNkLmFkZChrZXl1cC5zdWJzY3JpYmUoKCkgPT4gdGhpcy5yZW1vdmVNYXJrZXIoKSkpO1xuICAgICAgICAgICAgY2QuYWRkKGNsaWNrLnN1YnNjcmliZSgoZSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICghZS5jdHJsS2V5ICYmICFlLm1ldGFLZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoYWx0R290b0RlZmluaXRpb24gJiYgIWUuYWx0S2V5KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVNYXJrZXIoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmdvVG9EZWZpbml0aW9uKCk7XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGNkKTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uZW1pdHRlci5vbihcInN5bWJvbHMtdmlldzpnby10by1kZWNsYXJhdGlvblwiLCAoKSA9PiB0aGlzLmdvVG9EZWZpbml0aW9uKCkpKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmFkZFRleHRFZGl0b3JDb21tYW5kKFwib21uaXNoYXJwLWF0b206Z28tdG8tZGVmaW5pdGlvblwiLCAoKSA9PiB0aGlzLmdvVG9EZWZpbml0aW9uKCkpKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbmZpZy5vYnNlcnZlKFwib21uaXNoYXJwLWF0b20ud2FudE1ldGFkYXRhXCIsIGVuYWJsZWQgPT4ge1xuICAgICAgICAgICAgdGhpcy53YW50TWV0YWRhdGEgPSBlbmFibGVkO1xuICAgICAgICB9KSk7XG4gICAgfVxuICAgIGRpc3Bvc2UoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfVxuICAgIGdvVG9EZWZpbml0aW9uKCkge1xuICAgICAgICBjb25zdCBlZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKCk7XG4gICAgICAgIGlmIChlZGl0b3IpIHtcbiAgICAgICAgICAgIGNvbnN0IHdvcmQgPSBlZGl0b3IuZ2V0V29yZFVuZGVyQ3Vyc29yKCk7XG4gICAgICAgICAgICBPbW5pLnJlcXVlc3QoZWRpdG9yLCBzb2x1dGlvbiA9PiBzb2x1dGlvbi5nb3RvZGVmaW5pdGlvbih7XG4gICAgICAgICAgICAgICAgV2FudE1ldGFkYXRhOiB0aGlzLndhbnRNZXRhZGF0YVxuICAgICAgICAgICAgfSkpXG4gICAgICAgICAgICAgICAgLnN1YnNjcmliZSgoZGF0YSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChkYXRhLkZpbGVOYW1lICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgT21uaS5uYXZpZ2F0ZVRvKGRhdGEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChkYXRhLk1ldGFkYXRhU291cmNlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHsgQXNzZW1ibHlOYW1lLCBUeXBlTmFtZSB9ID0gZGF0YS5NZXRhZGF0YVNvdXJjZTtcbiAgICAgICAgICAgICAgICAgICAgYXRvbS53b3Jrc3BhY2Uub3Blbihgb21uaXNoYXJwOi8vbWV0YWRhdGEvJHtBc3NlbWJseU5hbWV9LyR7VHlwZU5hbWV9YCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5pdGlhbExpbmU6IGRhdGEuTGluZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGluaXRpYWxDb2x1bW46IGRhdGEuQ29sdW1uLFxuICAgICAgICAgICAgICAgICAgICAgICAgc2VhcmNoQWxsUGFuZXM6IHRydWVcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkV2FybmluZyhgQ2FuJ3QgbmF2aWdhdGUgdG8gJHt3b3JkfWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIGdldFdvcmRSYW5nZShlZGl0b3IsIGJ1ZmZlclB0KSB7XG4gICAgICAgIGNvbnN0IGJ1ZmZlciA9IGVkaXRvci5nZXRCdWZmZXIoKTtcbiAgICAgICAgbGV0IHN0YXJ0Q29sdW1uID0gYnVmZmVyUHQuY29sdW1uO1xuICAgICAgICBsZXQgZW5kQ29sdW1uID0gYnVmZmVyUHQuY29sdW1uO1xuICAgICAgICBjb25zdCBsaW5lID0gYnVmZmVyLmdldExpbmVzKClbYnVmZmVyUHQucm93XTtcbiAgICAgICAgaWYgKCEvW0EtWl8wLTldL2kudGVzdChsaW5lW2J1ZmZlclB0LmNvbHVtbl0pKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5tYXJrZXIpXG4gICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVNYXJrZXIoKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB3aGlsZSAoc3RhcnRDb2x1bW4gPiAwICYmIC9bQS1aXzAtOV0vaS50ZXN0KGxpbmVbLS1zdGFydENvbHVtbl0pKSB7IH1cbiAgICAgICAgd2hpbGUgKGVuZENvbHVtbiA8IGxpbmUubGVuZ3RoICYmIC9bQS1aXzAtOV0vaS50ZXN0KGxpbmVbKytlbmRDb2x1bW5dKSkgeyB9XG4gICAgICAgIHJldHVybiBuZXcgUmFuZ2UoW2J1ZmZlclB0LnJvdywgc3RhcnRDb2x1bW4gKyAxXSwgW2J1ZmZlclB0LnJvdywgZW5kQ29sdW1uXSk7XG4gICAgfVxuICAgIHVuZGVybGluZUlmTmF2aWdhYmxlKGVkaXRvciwgYnVmZmVyUHQsIHdvcmRSYW5nZSkge1xuICAgICAgICBpZiAodGhpcy5tYXJrZXIgJiZcbiAgICAgICAgICAgIHRoaXMubWFya2VyLmJ1ZmZlck1hcmtlci5yYW5nZSAmJlxuICAgICAgICAgICAgdGhpcy5tYXJrZXIuYnVmZmVyTWFya2VyLnJhbmdlLmNvbXBhcmUod29yZFJhbmdlKSA9PT0gMClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgbGV0IGRlY29yYXRpb247XG4gICAgICAgIGNvbnN0IGFkZE1hcmsgPSAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnJlbW92ZU1hcmtlcigpO1xuICAgICAgICAgICAgdGhpcy5tYXJrZXIgPSBlZGl0b3IubWFya0J1ZmZlclJhbmdlKHdvcmRSYW5nZSk7XG4gICAgICAgICAgICBkZWNvcmF0aW9uID0gZWRpdG9yLmRlY29yYXRlTWFya2VyKHRoaXMubWFya2VyLCB7IHR5cGU6IFwiaGlnaGxpZ2h0XCIsIGNsYXNzOiBcImdvdG9kZWZpbml0aW9uLXVuZGVybGluZVwiIH0pO1xuICAgICAgICB9O1xuICAgICAgICBpZiAodGhpcy5lbmhhbmNlZEhpZ2hsaWdodGluZykge1xuICAgICAgICAgICAgY29uc3Qgc2NvcGVzID0gZWRpdG9yLnNjb3BlRGVzY3JpcHRvckZvckJ1ZmZlclBvc2l0aW9uKGJ1ZmZlclB0KS5zY29wZXM7XG4gICAgICAgICAgICBpZiAoaWRlbnRpZmllclJlZ2V4LnRlc3QoXy5sYXN0KHNjb3BlcykpKSB7XG4gICAgICAgICAgICAgICAgYWRkTWFyaygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgT21uaS5yZXF1ZXN0KGVkaXRvciwgc29sdXRpb24gPT4gc29sdXRpb24uZ290b2RlZmluaXRpb24oe1xuICAgICAgICAgICAgICAgIExpbmU6IGJ1ZmZlclB0LnJvdyxcbiAgICAgICAgICAgICAgICBDb2x1bW46IGJ1ZmZlclB0LmNvbHVtblxuICAgICAgICAgICAgfSkpLmZpbHRlcihkYXRhID0+ICEhZGF0YS5GaWxlTmFtZSB8fCAhIWRhdGEuTWV0YWRhdGFTb3VyY2UpXG4gICAgICAgICAgICAgICAgLnN1YnNjcmliZShkYXRhID0+IGFkZE1hcmsoKSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcGl4ZWxQb3NpdGlvbkZyb21Nb3VzZUV2ZW50KGVkaXRvciwgZWRpdG9yVmlldywgZXZlbnQpIHtcbiAgICAgICAgY29uc3QgY2xpZW50WCA9IGV2ZW50LmNsaWVudFgsIGNsaWVudFkgPSBldmVudC5jbGllbnRZO1xuICAgICAgICBjb25zdCBzaGFkb3cgPSB0aGlzLmdldEZyb21TaGFkb3dEb20oZWRpdG9yVmlldywgXCIubGluZXNcIilbMF07XG4gICAgICAgIGlmICghc2hhZG93KVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zdCBsaW5lc0NsaWVudFJlY3QgPSBzaGFkb3cuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgIGxldCB0b3AgPSBjbGllbnRZIC0gbGluZXNDbGllbnRSZWN0LnRvcDtcbiAgICAgICAgbGV0IGxlZnQgPSBjbGllbnRYIC0gbGluZXNDbGllbnRSZWN0LmxlZnQ7XG4gICAgICAgIHRvcCArPSBlZGl0b3IuZ2V0U2Nyb2xsVG9wKCk7XG4gICAgICAgIGxlZnQgKz0gZWRpdG9yLmdldFNjcm9sbExlZnQoKTtcbiAgICAgICAgcmV0dXJuIHsgdG9wOiB0b3AsIGxlZnQ6IGxlZnQgfTtcbiAgICB9XG4gICAgZ2V0RnJvbVNoYWRvd0RvbShlbGVtZW50LCBzZWxlY3Rvcikge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgZWwgPSBlbGVtZW50WzBdO1xuICAgICAgICAgICAgY29uc3QgZm91bmQgPSBlbC5yb290RWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKTtcbiAgICAgICAgICAgIHJldHVybiAkKGZvdW5kWzBdKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgcmV0dXJuICQoZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmVtb3ZlTWFya2VyKCkge1xuICAgICAgICBpZiAodGhpcy5tYXJrZXIgIT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5tYXJrZXIuZGVzdHJveSgpO1xuICAgICAgICAgICAgdGhpcy5tYXJrZXIgPSBudWxsO1xuICAgICAgICB9XG4gICAgfVxufVxuZXhwb3J0IGNvbnN0IGdvVG9EZWZpbnRpb24gPSBuZXcgR29Ub0RlZmluaXRpb247XG4iLCJpbXBvcnQge01vZGVsc30gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcclxuaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xyXG5pbXBvcnQge09ic2VydmFibGUsIFN1YnNjcmlwdGlvbn0gZnJvbSBcInJ4anNcIjtcclxuaW1wb3J0IHtDb21wb3NpdGVEaXNwb3NhYmxlfSBmcm9tIFwidHMtZGlzcG9zYWJsZXNcIjtcclxuaW1wb3J0IHtPbW5pfSBmcm9tIFwiLi4vc2VydmVyL29tbmlcIjtcclxuY29uc3QgJDogSlF1ZXJ5U3RhdGljID0gcmVxdWlyZShcImpxdWVyeVwiKTtcclxuLyogdHNsaW50OmRpc2FibGU6dmFyaWFibGUtbmFtZSAqL1xyXG5jb25zdCBSYW5nZTogdHlwZW9mIFRleHRCdWZmZXIuUmFuZ2UgPSByZXF1aXJlKFwiYXRvbVwiKS5SYW5nZTtcclxuLyogdHNsaW50OmVuYWJsZTp2YXJpYWJsZS1uYW1lICovXHJcbmNvbnN0IGlkZW50aWZpZXJSZWdleCA9IC9eaWRlbnRpZmllcnxpZGVudGlmaWVyJHxcXC5pZGVudGlmaWVyXFwuLztcclxuXHJcbmNsYXNzIEdvVG9EZWZpbml0aW9uIGltcGxlbWVudHMgSUZlYXR1cmUge1xyXG4gICAgcHJpdmF0ZSBkaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xyXG4gICAgcHJpdmF0ZSBlbmhhbmNlZEhpZ2hsaWdodGluZzogYm9vbGVhbjtcclxuICAgIHByaXZhdGUgbWFya2VyOiBBdG9tLk1hcmtlcjtcclxuICAgIHByaXZhdGUgd2FudE1ldGFkYXRhOiBib29sZWFuO1xyXG5cclxuICAgIHB1YmxpYyBhY3RpdmF0ZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG4gICAgICAgIGxldCBhbHRHb3RvRGVmaW5pdGlvbiA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb25maWcub2JzZXJ2ZShcIm9tbmlzaGFycC1hdG9tOmFsdEdvdG9EZWZpbml0aW9uXCIsIHZhbHVlID0+IGFsdEdvdG9EZWZpbml0aW9uID0gdmFsdWUpKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLnN3aXRjaEFjdGl2ZUVkaXRvcigoZWRpdG9yLCBjZCkgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCB2aWV3ID0gJChhdG9tLnZpZXdzLmdldFZpZXcoZWRpdG9yKSk7XHJcbiAgICAgICAgICAgIGNvbnN0IHNjcm9sbCA9IHRoaXMuZ2V0RnJvbVNoYWRvd0RvbSh2aWV3LCBcIi5zY3JvbGwtdmlld1wiKTtcclxuICAgICAgICAgICAgaWYgKCFzY3JvbGxbMF0pIHtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgY29uc3QgY2xpY2sgPSBPYnNlcnZhYmxlLmZyb21FdmVudDxNb3VzZUV2ZW50PihzY3JvbGxbMF0sIFwiY2xpY2tcIik7XHJcblxyXG4gICAgICAgICAgICBjb25zdCBtb3VzZW1vdmUgPSBPYnNlcnZhYmxlLmZyb21FdmVudDxNb3VzZUV2ZW50PihzY3JvbGxbMF0sIFwibW91c2Vtb3ZlXCIpO1xyXG5cclxuICAgICAgICAgICAgY29uc3Qga2V5dXAgPSBPYnNlcnZhYmxlLm1lcmdlKFxyXG4gICAgICAgICAgICAgICAgT2JzZXJ2YWJsZS5mcm9tRXZlbnQ8YW55Pih2aWV3WzBdLCBcImZvY3VzXCIpLFxyXG4gICAgICAgICAgICAgICAgT2JzZXJ2YWJsZS5mcm9tRXZlbnQ8YW55Pih2aWV3WzBdLCBcImJsdXJcIiksXHJcbiAgICAgICAgICAgICAgICA8YW55Pk9ic2VydmFibGUuZnJvbUV2ZW50UGF0dGVybjxhbnk+KHggPT4geyAoPGFueT5hdG9tLmdldEN1cnJlbnRXaW5kb3coKSkub24oXCJmb2N1c1wiLCB4KTsgfSwgeCA9PiB7ICg8YW55PmF0b20uZ2V0Q3VycmVudFdpbmRvdygpKS5yZW1vdmVMaXN0ZW5lcihcImZvY3VzXCIsIHgpOyB9KSxcclxuICAgICAgICAgICAgICAgIDxhbnk+T2JzZXJ2YWJsZS5mcm9tRXZlbnRQYXR0ZXJuPGFueT4oeCA9PiB7ICg8YW55PmF0b20uZ2V0Q3VycmVudFdpbmRvdygpKS5vbihcImJsdXJcIiwgeCk7IH0sIHggPT4geyAoPGFueT5hdG9tLmdldEN1cnJlbnRXaW5kb3coKSkucmVtb3ZlTGlzdGVuZXIoXCJibHVyXCIsIHgpOyB9KSxcclxuICAgICAgICAgICAgICAgIE9ic2VydmFibGUuZnJvbUV2ZW50PEtleWJvYXJkRXZlbnQ+KHZpZXdbMF0sIFwia2V5dXBcIilcclxuICAgICAgICAgICAgICAgICAgICAuZmlsdGVyKHggPT4gYWx0R290b0RlZmluaXRpb24gPyB4LndoaWNoID09PSAxOCAvKmFsdCovIDogKHgud2hpY2ggPT09IDE3IC8qY3RybCovIHx8IC8qbWV0YSAtLT4gKi8geC53aGljaCA9PT0gMjI0IHx8IHgud2hpY2ggPT09IDkzIHx8IHgud2hpY2ggPT09IDkyIHx8IHgud2hpY2ggPT09IDkxKSlcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAgICAgLnRocm90dGxlVGltZSgxMDApO1xyXG5cclxuICAgICAgICAgICAgY29uc3Qga2V5ZG93biA9IE9ic2VydmFibGUuZnJvbUV2ZW50PEtleWJvYXJkRXZlbnQ+KHZpZXdbMF0sIFwia2V5ZG93blwiKVxyXG4gICAgICAgICAgICAgICAgLmZpbHRlcih6ID0+ICF6LnJlcGVhdClcclxuICAgICAgICAgICAgICAgIC5maWx0ZXIoZSA9PiBhbHRHb3RvRGVmaW5pdGlvbiA/IGUuYWx0S2V5IDogKGUuY3RybEtleSB8fCBlLm1ldGFLZXkpKVxyXG4gICAgICAgICAgICAgICAgLnRocm90dGxlVGltZSgxMDApO1xyXG5cclxuICAgICAgICAgICAgY29uc3Qgc3BlY2lhbEtleURvd24gPSBrZXlkb3duXHJcbiAgICAgICAgICAgICAgICAuc3dpdGNoTWFwKHggPT4gbW91c2Vtb3ZlXHJcbiAgICAgICAgICAgICAgICAgICAgLnRha2VVbnRpbChrZXl1cClcclxuICAgICAgICAgICAgICAgICAgICAubWFwKGV2ZW50ID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcGl4ZWxQdCA9IHRoaXMucGl4ZWxQb3NpdGlvbkZyb21Nb3VzZUV2ZW50KGVkaXRvciwgdmlldywgZXZlbnQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXBpeGVsUHQpIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2NyZWVuUHQgPSBlZGl0b3Iuc2NyZWVuUG9zaXRpb25Gb3JQaXhlbFBvc2l0aW9uKHBpeGVsUHQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZWRpdG9yLmJ1ZmZlclBvc2l0aW9uRm9yU2NyZWVuUG9zaXRpb24oc2NyZWVuUHQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgLmZpbHRlcihhID0+ICEhYSlcclxuICAgICAgICAgICAgICAgICAgICAuc3RhcnRXaXRoKGVkaXRvci5nZXRDdXJzb3JCdWZmZXJQb3NpdGlvbigpKVxyXG4gICAgICAgICAgICAgICAgICAgIC5tYXAoYnVmZmVyUHQgPT4gKHsgYnVmZmVyUHQsIHJhbmdlOiB0aGlzLmdldFdvcmRSYW5nZShlZGl0b3IsIGJ1ZmZlclB0KSB9KSlcclxuICAgICAgICAgICAgICAgICAgICAuZmlsdGVyKHogPT4gISF6LnJhbmdlKVxyXG4gICAgICAgICAgICAgICAgICAgIC5kaXN0aW5jdFVudGlsQ2hhbmdlZCgoY3VycmVudCwgbmV4dCkgPT4gY3VycmVudC5yYW5nZS5pc0VxdWFsKDxhbnk+bmV4dC5yYW5nZSkpKTtcclxuXHJcbiAgICAgICAgICAgIGVkaXRvci5vbkRpZERlc3Ryb3koKCkgPT4gY2QuZGlzcG9zZSgpKTtcclxuXHJcbiAgICAgICAgICAgIGxldCBldmVudERpc3Bvc2FibGU6IFN1YnNjcmlwdGlvbjtcclxuICAgICAgICAgICAgY2QuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoXCJvbW5pc2hhcnAtYXRvbS5lbmhhbmNlZEhpZ2hsaWdodGluZ1wiLCAoZW5hYmxlZDogYm9vbGVhbikgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5lbmhhbmNlZEhpZ2hsaWdodGluZyA9IGVuYWJsZWQ7XHJcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnREaXNwb3NhYmxlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZXZlbnREaXNwb3NhYmxlLnVuc3Vic2NyaWJlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgY2QucmVtb3ZlKGV2ZW50RGlzcG9zYWJsZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IG9ic2VydmFibGUgPSBzcGVjaWFsS2V5RG93bjtcclxuICAgICAgICAgICAgICAgIGlmICghZW5hYmxlZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIG9ic2VydmFibGUgPSBvYnNlcnZhYmxlLmRlYm91bmNlVGltZSgyMDApO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGV2ZW50RGlzcG9zYWJsZSA9IG9ic2VydmFibGVcclxuICAgICAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKCh7YnVmZmVyUHQsIHJhbmdlfSkgPT4gdGhpcy51bmRlcmxpbmVJZk5hdmlnYWJsZShlZGl0b3IsIGJ1ZmZlclB0LCByYW5nZSkpO1xyXG5cclxuICAgICAgICAgICAgICAgIGNkLmFkZChldmVudERpc3Bvc2FibGUpO1xyXG4gICAgICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgICAgICBjZC5hZGQoa2V5dXAuc3Vic2NyaWJlKCgpID0+IHRoaXMucmVtb3ZlTWFya2VyKCkpKTtcclxuXHJcbiAgICAgICAgICAgIGNkLmFkZChjbGljay5zdWJzY3JpYmUoKGUpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmICghZS5jdHJsS2V5ICYmICFlLm1ldGFLZXkpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoYWx0R290b0RlZmluaXRpb24gJiYgIWUuYWx0S2V5KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlTWFya2VyKCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmdvVG9EZWZpbml0aW9uKCk7XHJcbiAgICAgICAgICAgIH0pKTtcclxuICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChjZCk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uZW1pdHRlci5vbihcInN5bWJvbHMtdmlldzpnby10by1kZWNsYXJhdGlvblwiLCAoKSA9PiB0aGlzLmdvVG9EZWZpbml0aW9uKCkpKTtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuYWRkVGV4dEVkaXRvckNvbW1hbmQoXCJvbW5pc2hhcnAtYXRvbTpnby10by1kZWZpbml0aW9uXCIsICgpID0+IHRoaXMuZ29Ub0RlZmluaXRpb24oKSkpO1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb25maWcub2JzZXJ2ZShcIm9tbmlzaGFycC1hdG9tLndhbnRNZXRhZGF0YVwiLCBlbmFibGVkID0+IHtcclxuICAgICAgICAgICAgdGhpcy53YW50TWV0YWRhdGEgPSBlbmFibGVkO1xyXG4gICAgICAgIH0pKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGlzcG9zZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnb1RvRGVmaW5pdGlvbigpIHtcclxuICAgICAgICBjb25zdCBlZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKCk7XHJcbiAgICAgICAgaWYgKGVkaXRvcikge1xyXG4gICAgICAgICAgICBjb25zdCB3b3JkID0gPGFueT5lZGl0b3IuZ2V0V29yZFVuZGVyQ3Vyc29yKCk7XHJcbiAgICAgICAgICAgIE9tbmkucmVxdWVzdChlZGl0b3IsIHNvbHV0aW9uID0+IHNvbHV0aW9uLmdvdG9kZWZpbml0aW9uKHtcclxuICAgICAgICAgICAgICAgIFdhbnRNZXRhZGF0YTogdGhpcy53YW50TWV0YWRhdGFcclxuICAgICAgICAgICAgfSkpXHJcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKChkYXRhOiBNb2RlbHMuR290b0RlZmluaXRpb25SZXNwb25zZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChkYXRhLkZpbGVOYW1lICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgT21uaS5uYXZpZ2F0ZVRvKGRhdGEpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZGF0YS5NZXRhZGF0YVNvdXJjZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiB0c2xpbnQ6ZGlzYWJsZTp2YXJpYWJsZS1uYW1lICovXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHtBc3NlbWJseU5hbWUsIFR5cGVOYW1lfSA9IGRhdGEuTWV0YWRhdGFTb3VyY2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIHRzbGludDplbmFibGU6dmFyaWFibGUtbmFtZSAqL1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhdG9tLndvcmtzcGFjZS5vcGVuKGBvbW5pc2hhcnA6Ly9tZXRhZGF0YS8ke0Fzc2VtYmx5TmFtZX0vJHtUeXBlTmFtZX1gLCA8YW55PntcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluaXRpYWxMaW5lOiBkYXRhLkxpbmUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbml0aWFsQ29sdW1uOiBkYXRhLkNvbHVtbixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlYXJjaEFsbFBhbmVzOiB0cnVlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRXYXJuaW5nKGBDYW4ndCBuYXZpZ2F0ZSB0byAke3dvcmR9YCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZ2V0V29yZFJhbmdlKGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yLCBidWZmZXJQdDogVGV4dEJ1ZmZlci5Qb2ludCk6IFRleHRCdWZmZXIuUmFuZ2Uge1xyXG4gICAgICAgIGNvbnN0IGJ1ZmZlciA9IGVkaXRvci5nZXRCdWZmZXIoKTtcclxuICAgICAgICBsZXQgc3RhcnRDb2x1bW4gPSBidWZmZXJQdC5jb2x1bW47XHJcbiAgICAgICAgbGV0IGVuZENvbHVtbiA9IGJ1ZmZlclB0LmNvbHVtbjtcclxuICAgICAgICBjb25zdCBsaW5lID0gYnVmZmVyLmdldExpbmVzKClbYnVmZmVyUHQucm93XTtcclxuXHJcbiAgICAgICAgaWYgKCEvW0EtWl8wLTldL2kudGVzdChsaW5lW2J1ZmZlclB0LmNvbHVtbl0pKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLm1hcmtlcikgdGhpcy5yZW1vdmVNYXJrZXIoKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgd2hpbGUgKHN0YXJ0Q29sdW1uID4gMCAmJiAvW0EtWl8wLTldL2kudGVzdChsaW5lWy0tc3RhcnRDb2x1bW5dKSkgeyAvKiAqLyB9XHJcblxyXG4gICAgICAgIHdoaWxlIChlbmRDb2x1bW4gPCBsaW5lLmxlbmd0aCAmJiAvW0EtWl8wLTldL2kudGVzdChsaW5lWysrZW5kQ29sdW1uXSkpIHsgLyogKi8gfVxyXG5cclxuICAgICAgICByZXR1cm4gbmV3IFJhbmdlKFtidWZmZXJQdC5yb3csIHN0YXJ0Q29sdW1uICsgMV0sIFtidWZmZXJQdC5yb3csIGVuZENvbHVtbl0pO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgdW5kZXJsaW5lSWZOYXZpZ2FibGUoZWRpdG9yOiBBdG9tLlRleHRFZGl0b3IsIGJ1ZmZlclB0OiBUZXh0QnVmZmVyLlBvaW50LCB3b3JkUmFuZ2U6IFRleHRCdWZmZXIuUmFuZ2UpIHtcclxuICAgICAgICBpZiAodGhpcy5tYXJrZXIgJiZcclxuICAgICAgICAgICAgKHRoaXMubWFya2VyLmJ1ZmZlck1hcmtlciBhcyBhbnkpLnJhbmdlICYmXHJcbiAgICAgICAgICAgICh0aGlzLm1hcmtlci5idWZmZXJNYXJrZXIgYXMgYW55KS5yYW5nZS5jb21wYXJlKHdvcmRSYW5nZSkgPT09IDApXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgbGV0IGRlY29yYXRpb246IEF0b20uTWFya2VyO1xyXG4gICAgICAgIGNvbnN0IGFkZE1hcmsgPSAoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlTWFya2VyKCk7XHJcbiAgICAgICAgICAgIHRoaXMubWFya2VyID0gZWRpdG9yLm1hcmtCdWZmZXJSYW5nZSh3b3JkUmFuZ2UpO1xyXG4gICAgICAgICAgICBkZWNvcmF0aW9uID0gZWRpdG9yLmRlY29yYXRlTWFya2VyKHRoaXMubWFya2VyLCB7IHR5cGU6IFwiaGlnaGxpZ2h0XCIsIGNsYXNzOiBcImdvdG9kZWZpbml0aW9uLXVuZGVybGluZVwiIH0pO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmVuaGFuY2VkSGlnaGxpZ2h0aW5nKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHNjb3Blczogc3RyaW5nW10gPSAoPGFueT5lZGl0b3Iuc2NvcGVEZXNjcmlwdG9yRm9yQnVmZmVyUG9zaXRpb24oYnVmZmVyUHQpKS5zY29wZXM7XHJcbiAgICAgICAgICAgIGlmIChpZGVudGlmaWVyUmVnZXgudGVzdChfLmxhc3Qoc2NvcGVzKSkpIHtcclxuICAgICAgICAgICAgICAgIGFkZE1hcmsoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIElmIGVuaGFuY2VkIGhpZ2hsaWdodGluZyBpcyBvZmYsIGZhbGxiYWNrIHRvIHRoZSBvbGQgbWV0aG9kLlxyXG4gICAgICAgICAgICBPbW5pLnJlcXVlc3QoZWRpdG9yLCBzb2x1dGlvbiA9PiBzb2x1dGlvbi5nb3RvZGVmaW5pdGlvbih7XHJcbiAgICAgICAgICAgICAgICBMaW5lOiBidWZmZXJQdC5yb3csXHJcbiAgICAgICAgICAgICAgICBDb2x1bW46IGJ1ZmZlclB0LmNvbHVtblxyXG4gICAgICAgICAgICB9KSkuZmlsdGVyKGRhdGEgPT4gISFkYXRhLkZpbGVOYW1lIHx8ICEhZGF0YS5NZXRhZGF0YVNvdXJjZSlcclxuICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoZGF0YSA9PiBhZGRNYXJrKCkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHBpeGVsUG9zaXRpb25Gcm9tTW91c2VFdmVudChlZGl0b3I6IEF0b20uVGV4dEVkaXRvciwgZWRpdG9yVmlldzogYW55LCBldmVudDogTW91c2VFdmVudCkge1xyXG4gICAgICAgIGNvbnN0IGNsaWVudFggPSBldmVudC5jbGllbnRYLCBjbGllbnRZID0gZXZlbnQuY2xpZW50WTtcclxuICAgICAgICBjb25zdCBzaGFkb3cgPSB0aGlzLmdldEZyb21TaGFkb3dEb20oZWRpdG9yVmlldywgXCIubGluZXNcIilbMF07XHJcbiAgICAgICAgaWYgKCFzaGFkb3cpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICBjb25zdCBsaW5lc0NsaWVudFJlY3QgPSBzaGFkb3cuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XHJcblxyXG4gICAgICAgIGxldCB0b3AgPSBjbGllbnRZIC0gbGluZXNDbGllbnRSZWN0LnRvcDtcclxuICAgICAgICBsZXQgbGVmdCA9IGNsaWVudFggLSBsaW5lc0NsaWVudFJlY3QubGVmdDtcclxuICAgICAgICB0b3AgKz0gKDxhbnk+ZWRpdG9yKS5nZXRTY3JvbGxUb3AoKTtcclxuICAgICAgICBsZWZ0ICs9ICg8YW55PmVkaXRvcikuZ2V0U2Nyb2xsTGVmdCgpO1xyXG4gICAgICAgIHJldHVybiB7IHRvcDogdG9wLCBsZWZ0OiBsZWZ0IH07XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBnZXRGcm9tU2hhZG93RG9tKGVsZW1lbnQ6IEpRdWVyeSwgc2VsZWN0b3I6IHN0cmluZyk6IEpRdWVyeSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgZWwgPSBlbGVtZW50WzBdO1xyXG4gICAgICAgICAgICBjb25zdCBmb3VuZCA9ICg8YW55PmVsKS5yb290RWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKTtcclxuICAgICAgICAgICAgcmV0dXJuICQoZm91bmRbMF0pO1xyXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgcmV0dXJuICQoZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgcmVtb3ZlTWFya2VyKCkge1xyXG4gICAgICAgIGlmICh0aGlzLm1hcmtlciAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIHRoaXMubWFya2VyLmRlc3Ryb3koKTtcclxuICAgICAgICAgICAgdGhpcy5tYXJrZXIgPSBudWxsO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVxdWlyZWQgPSB0cnVlO1xyXG4gICAgcHVibGljIHRpdGxlID0gXCJHbyBUbyBEZWZpbml0aW9uXCI7XHJcbiAgICBwdWJsaWMgZGVzY3JpcHRpb24gPSBcIkFkZHMgc3VwcG9ydCB0byBnb3RvIGRlZmluaXRpb24sIGFzIHdlbGwgYXMgZGlzcGxheSBtZXRhZGF0YSByZXR1cm5lZCBieSBhIGdvdG8gZGVmaW5pdGlvbiBtZXRhZGF0YSByZXNwb25zZVwiO1xyXG59XHJcblxyXG5leHBvcnQgY29uc3QgZ29Ub0RlZmludGlvbiA9IG5ldyBHb1RvRGVmaW5pdGlvbjtcclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
