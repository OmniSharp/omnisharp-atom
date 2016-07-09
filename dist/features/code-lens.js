"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.codeLens = exports.Lens = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _rxjs = require("rxjs");

var _omnisharpClient = require("omnisharp-client");

var _omni = require("../server/omni");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var fastdom = require("fastdom");

var CodeLens = function () {
    function CodeLens() {
        _classCallCheck(this, CodeLens);

        this.decorations = new WeakMap();
        this.required = false;
        this.title = "Code Lens";
        this.description = "Adds support for displaying references in the editor.";
    }

    _createClass(CodeLens, [{
        key: "activate",
        value: function activate() {
            var _this = this;

            this.disposable = new _omnisharpClient.CompositeDisposable();
            this.disposable.add(_omni.Omni.eachEditor(function (editor, cd) {
                cd.add(_omnisharpClient.Disposable.create(function () {
                    var markers = _this.decorations.get(editor);
                    if (markers) {
                        markers.forEach(function (marker) {
                            return marker.dispose();
                        });
                    }
                    _this.decorations.delete(editor);
                }));
                cd.add(atom.config.observe("editor.fontSize", function (size) {
                    var decorations = _this.decorations.get(editor);
                    var lineHeight = editor.getLineHeightInPixels();
                    if (decorations && lineHeight) {
                        decorations.forEach(function (decoration) {
                            return decoration.updateTop(lineHeight);
                        });
                    }
                }));
            }));
            this.disposable.add(_omni.Omni.switchActiveEditor(function (editor, cd) {
                var items = _this.decorations.get(editor);
                if (!items) _this.decorations.set(editor, new Set());
                var subject = new _rxjs.Subject();
                cd.add(subject.filter(function (x) {
                    return !!x && !editor.isDestroyed();
                }).distinctUntilChanged(function (x) {
                    return !!x;
                }).debounceTime(500).switchMap(function () {
                    return _this.updateCodeLens(editor);
                }).subscribe());
                var bindDidChange = function bindDidChange() {
                    var didChange = editor.getBuffer().onDidChange(function () {
                        didChange.dispose();
                        cd.remove(didChange);
                        subject.next(false);
                    });
                    cd.add(didChange);
                };
                cd.add(editor.getBuffer().onDidStopChanging(_lodash2.default.debounce(function () {
                    if (!subject.isUnsubscribed) subject.next(true);
                    bindDidChange();
                }, 5000)));
                cd.add(editor.getBuffer().onDidSave(function () {
                    return subject.next(true);
                }));
                cd.add(editor.getBuffer().onDidReload(function () {
                    return subject.next(true);
                }));
                cd.add(_rxjs.Observable.timer(1000).subscribe(function () {
                    return subject.next(true);
                }));
                cd.add(editor.onDidChangeScrollTop(function () {
                    return _this.updateDecoratorVisiblility(editor);
                }));
                cd.add(atom.commands.onWillDispatch(function (event) {
                    if (_lodash2.default.includes(["omnisharp-atom:toggle-dock", "omnisharp-atom:show-dock", "omnisharp-atom:hide-dock"], event.type)) {
                        _this.updateDecoratorVisiblility(editor);
                    }
                }));
                cd.add(subject);
                _this.updateDecoratorVisiblility(editor);
            }));
        }
    }, {
        key: "updateDecoratorVisiblility",
        value: function updateDecoratorVisiblility(editor) {
            if (!this.decorations.has(editor)) this.decorations.set(editor, new Set());
            var decorations = this.decorations.get(editor);
            decorations.forEach(function (decoration) {
                return decoration.updateVisible();
            });
        }
    }, {
        key: "dispose",
        value: function dispose() {
            this.disposable.dispose();
        }
    }, {
        key: "updateCodeLens",
        value: function updateCodeLens(editor) {
            if (!this.decorations.has(editor)) this.decorations.set(editor, new Set());
            var decorations = this.decorations.get(editor);
            var updated = new WeakSet();
            if (editor.isDestroyed()) {
                return _rxjs.Observable.empty();
            }
            return _omni.Omni.request(editor, function (solution) {
                return solution.currentfilemembersasflat({ Buffer: null, Changes: null });
            }).filter(function (fileMembers) {
                return !!fileMembers;
            }).flatMap(function (fileMembers) {
                return fileMembers;
            }).concatMap(function (fileMember) {
                var range = editor.getBuffer().rangeForRow(fileMember.Line, false);
                var marker = editor.markBufferRange(range, { invalidate: "inside" });
                var lens = void 0;
                var iteratee = decorations.values();
                var decoration = iteratee.next();
                while (!decoration.done) {
                    if (decoration.value.isEqual(marker)) {
                        lens = decoration.value;
                        break;
                    }
                    decoration = iteratee.next();
                }
                if (lens) {
                    updated.add(lens);
                    lens.invalidate();
                } else {
                    lens = new Lens(editor, fileMember, marker, range, _omnisharpClient.Disposable.create(function () {
                        decorations.delete(lens);
                    }));
                    updated.add(lens);
                    decorations.add(lens);
                }
                return lens.updateVisible();
            }).do({ complete: function complete() {
                    decorations.forEach(function (lens) {
                        if (lens && !updated.has(lens)) {
                            lens.dispose();
                        }
                    });
                } });
        }
    }]);

    return CodeLens;
}();

function isLineVisible(editor, line) {
    var element = atom.views.getView(editor);
    var top = element.getFirstVisibleScreenRow();
    var bottom = element.getLastVisibleScreenRow();
    if (line <= top || line >= bottom) return false;
    return true;
}

var Lens = exports.Lens = function () {
    function Lens(_editor, _member, _marker, _range, disposer) {
        var _this2 = this;

        _classCallCheck(this, Lens);

        this._editor = _editor;
        this._member = _member;
        this._marker = _marker;
        this._range = _range;
        this._disposable = new _omnisharpClient.CompositeDisposable();
        this.loaded = false;
        this._issueUpdate = _lodash2.default.debounce(function (isVisible) {
            if (!_this2._update.isUnsubscribed) {
                _this2._update.next(isVisible);
            }
        }, 250);
        this._row = _range.getRows()[0];
        this._update = new _rxjs.Subject();
        this._disposable.add(this._update);
        this._path = _editor.getPath();
        this._updateObservable = this._update.filter(function (x) {
            return !!x;
        }).flatMap(function () {
            return _omni.Omni.request(_this2._editor, function (solution) {
                return solution.findusages({ FileName: _this2._path, Column: _this2._member.Column + 1, Line: _this2._member.Line, Buffer: null, Changes: null }, { silent: true });
            });
        }).filter(function (x) {
            return x && x.QuickFixes && !!x.QuickFixes.length;
        }).map(function (x) {
            return x && x.QuickFixes && x.QuickFixes.length - 1;
        }).share();
        this._disposable.add(this._updateObservable.take(1).filter(function (x) {
            return x > 0;
        }).do(function () {
            return _this2.loaded = true;
        }).subscribe(function (x) {
            return _this2._decorate(x);
        }));
        this._disposable.add(disposer);
        this._disposable.add(this._marker.onDidDestroy(function () {
            _this2.dispose();
        }));
    }

    _createClass(Lens, [{
        key: "updateVisible",
        value: function updateVisible() {
            var isVisible = this._isVisible();
            this._updateDecoration(isVisible);
            var result = void 0;
            if (isVisible) {
                result = this._updateObservable.take(1);
            } else {
                result = _rxjs.Observable.empty();
            }
            this._issueUpdate(isVisible);
            return result;
        }
    }, {
        key: "updateTop",
        value: function updateTop(lineHeight) {
            if (this._element) this._element.style.top = "-" + lineHeight + "px";
        }
    }, {
        key: "invalidate",
        value: function invalidate() {
            var _this3 = this;

            var self = this._updateObservable.take(1).do(function () {
                return _this3._disposable.remove(self);
            }).subscribe(function (x) {
                if (x <= 0) {
                    _this3.dispose();
                } else {
                    if (_this3._element) {
                        _this3._element.textContent = x.toString();
                    }
                }
            });
            this._disposable.add(self);
        }
    }, {
        key: "isEqual",
        value: function isEqual(marker) {
            return this._marker.isEqual(marker);
        }
    }, {
        key: "_isVisible",
        value: function _isVisible() {
            return isLineVisible(this._editor, this._row);
        }
    }, {
        key: "_updateDecoration",
        value: function _updateDecoration(isVisible) {
            var _this4 = this;

            if (this._decoration && this._element) {
                (function () {
                    var element = _this4._element;
                    if (isVisible) {
                        fastdom.measure(function () {
                            return element.style.display === "none" && fastdom.mutate(function () {
                                return element.style.display = "";
                            });
                        });
                    } else {
                        fastdom.measure(function () {
                            return element.style.display !== "none" && fastdom.mutate(function () {
                                return element.style.display = "none";
                            });
                        });
                    }
                })();
            }
        }
    }, {
        key: "_decorate",
        value: function _decorate(count) {
            var _this5 = this;

            var lineHeight = this._editor.getLineHeightInPixels();
            var element = this._element = document.createElement("div");
            element.style.position = "relative";
            element.style.top = "-" + lineHeight + "px";
            element.style.left = "16px";
            element.classList.add("highlight-info", "badge", "badge-small");
            element.textContent = count.toString();
            element.onclick = function () {
                return _omni.Omni.request(_this5._editor, function (s) {
                    return s.findusages({ FileName: _this5._path, Column: _this5._member.Column + 1, Line: _this5._member.Line, Buffer: null, Changes: null });
                });
            };
            this._decoration = this._editor.decorateMarker(this._marker, { type: "overlay", class: "codelens", item: this._element, position: "head" });
            this._disposable.add(_omnisharpClient.Disposable.create(function () {
                _this5._element.remove();
                if (_this5._decoration) {
                    _this5._decoration.destroy();
                }
                _this5._element = null;
            }));
            var isVisible = isLineVisible(this._editor, this._row);
            if (!isVisible) {
                element.style.display = "none";
            }
            return this._decoration;
        }
    }, {
        key: "dispose",
        value: function dispose() {
            return this._disposable.dispose();
        }
    }]);

    return Lens;
}();

var codeLens = exports.codeLens = new CodeLens();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9jb2RlLWxlbnMuanMiLCJsaWIvZmVhdHVyZXMvY29kZS1sZW5zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOzs7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7OztBQ0dBLElBQUksVUFBMEIsUUFBUSxTQUFSLENBQTlCOztJQVNBLFE7QUFBQSx3QkFBQTtBQUFBOztBQUVZLGFBQUEsV0FBQSxHQUFjLElBQUksT0FBSixFQUFkO0FBdUlELGFBQUEsUUFBQSxHQUFXLEtBQVg7QUFDQSxhQUFBLEtBQUEsR0FBUSxXQUFSO0FBQ0EsYUFBQSxXQUFBLEdBQWMsdURBQWQ7QUFDVjs7OzttQ0F4SWtCO0FBQUE7O0FBQ1gsaUJBQUssVUFBTCxHQUFrQiwwQ0FBbEI7QUFFQSxpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLFdBQUssVUFBTCxDQUFnQixVQUFDLE1BQUQsRUFBUyxFQUFULEVBQVc7QUFDM0MsbUJBQUcsR0FBSCxDQUFPLDRCQUFXLE1BQVgsQ0FBa0IsWUFBQTtBQUNyQix3QkFBTSxVQUFVLE1BQUssV0FBTCxDQUFpQixHQUFqQixDQUFxQixNQUFyQixDQUFoQjtBQUVBLHdCQUFJLE9BQUosRUFBYTtBQUNULGdDQUFRLE9BQVIsQ0FBZ0I7QUFBQSxtQ0FBVSxPQUFPLE9BQVAsRUFBVjtBQUFBLHlCQUFoQjtBQUNIO0FBRUQsMEJBQUssV0FBTCxDQUFpQixNQUFqQixDQUF3QixNQUF4QjtBQUNILGlCQVJNLENBQVA7QUFVQSxtQkFBRyxHQUFILENBQU8sS0FBSyxNQUFMLENBQVksT0FBWixDQUFvQixpQkFBcEIsRUFBdUMsVUFBQyxJQUFELEVBQWE7QUFDdkQsd0JBQU0sY0FBYyxNQUFLLFdBQUwsQ0FBaUIsR0FBakIsQ0FBcUIsTUFBckIsQ0FBcEI7QUFDQSx3QkFBTSxhQUFhLE9BQU8scUJBQVAsRUFBbkI7QUFDQSx3QkFBSSxlQUFlLFVBQW5CLEVBQStCO0FBQzNCLG9DQUFZLE9BQVosQ0FBb0I7QUFB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QTFDLENBQXhCO0FBQ0EsaUJBQUssV0FBTCxDQUFpQixHQUFqQixDQUFxQiw0QkFBVyxNQUFYLENBQWtCLFlBQUE7QUFDbkMsdUJBQUssUUFBTCxDQUFjLE1BQWQ7QUFDQSxvQkFBSSxPQUFLLFdBQVQsRUFBc0I7QUFDbEIsMkJBQUssV0FBTCxDQUFpQixPQUFqQjtBQUNIO0FBQ0QsdUJBQUssUUFBTCxHQUFnQixJQUFoQjtBQUNILGFBTm9CLENBQXJCO0FBUUEsZ0JBQU0sWUFBWSxjQUFjLEtBQUssT0FBbkIsRUFBNEIsS0FBSyxJQUFqQyxDQUFsQjtBQUNBLGdCQUFJLENBQUMsU0FBTCxFQUFnQjtBQUNaLHdCQUFRLEtBQVIsQ0FBYyxPQUFkLEdBQXdCLE1BQXhCO0FBQ0g7QUFFRCxtQkFBTyxLQUFLLFdBQVo7QUFDSDs7O2tDQUVhO0FBQUssbUJBQU8sS0FBSyxXQUFMLENBQWlCLE9BQWpCLEVBQVA7QUFBb0M7Ozs7OztBQUdwRCxJQUFNLDhCQUFXLElBQUksUUFBSixFQUFqQiIsImZpbGUiOiJsaWIvZmVhdHVyZXMvY29kZS1sZW5zLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xuaW1wb3J0IHsgT2JzZXJ2YWJsZSwgU3ViamVjdCB9IGZyb20gXCJyeGpzXCI7XG5pbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlIH0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcbmltcG9ydCB7IE9tbmkgfSBmcm9tIFwiLi4vc2VydmVyL29tbmlcIjtcbmxldCBmYXN0ZG9tID0gcmVxdWlyZShcImZhc3Rkb21cIik7XG5jbGFzcyBDb2RlTGVucyB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuZGVjb3JhdGlvbnMgPSBuZXcgV2Vha01hcCgpO1xuICAgICAgICB0aGlzLnJlcXVpcmVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMudGl0bGUgPSBcIkNvZGUgTGVuc1wiO1xuICAgICAgICB0aGlzLmRlc2NyaXB0aW9uID0gXCJBZGRzIHN1cHBvcnQgZm9yIGRpc3BsYXlpbmcgcmVmZXJlbmNlcyBpbiB0aGUgZWRpdG9yLlwiO1xuICAgIH1cbiAgICBhY3RpdmF0ZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmVhY2hFZGl0b3IoKGVkaXRvciwgY2QpID0+IHtcbiAgICAgICAgICAgIGNkLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgbWFya2VycyA9IHRoaXMuZGVjb3JhdGlvbnMuZ2V0KGVkaXRvcik7XG4gICAgICAgICAgICAgICAgaWYgKG1hcmtlcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgbWFya2Vycy5mb3JFYWNoKG1hcmtlciA9PiBtYXJrZXIuZGlzcG9zZSgpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5kZWNvcmF0aW9ucy5kZWxldGUoZWRpdG9yKTtcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIGNkLmFkZChhdG9tLmNvbmZpZy5vYnNlcnZlKFwiZWRpdG9yLmZvbnRTaXplXCIsIChzaXplKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZGVjb3JhdGlvbnMgPSB0aGlzLmRlY29yYXRpb25zLmdldChlZGl0b3IpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGxpbmVIZWlnaHQgPSBlZGl0b3IuZ2V0TGluZUhlaWdodEluUGl4ZWxzKCk7XG4gICAgICAgICAgICAgICAgaWYgKGRlY29yYXRpb25zICYmIGxpbmVIZWlnaHQpIHtcbiAgICAgICAgICAgICAgICAgICAgZGVjb3JhdGlvbnMuZm9yRWFjaChkZWNvcmF0aW9uID0+IGRlY29yYXRpb24udXBkYXRlVG9wKGxpbmVIZWlnaHQpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLnN3aXRjaEFjdGl2ZUVkaXRvcigoZWRpdG9yLCBjZCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgaXRlbXMgPSB0aGlzLmRlY29yYXRpb25zLmdldChlZGl0b3IpO1xuICAgICAgICAgICAgaWYgKCFpdGVtcylcbiAgICAgICAgICAgICAgICB0aGlzLmRlY29yYXRpb25zLnNldChlZGl0b3IsIG5ldyBTZXQoKSk7XG4gICAgICAgICAgICBjb25zdCBzdWJqZWN0ID0gbmV3IFN1YmplY3QoKTtcbiAgICAgICAgICAgIGNkLmFkZChzdWJqZWN0XG4gICAgICAgICAgICAgICAgLmZpbHRlcih4ID0+ICEheCAmJiAhZWRpdG9yLmlzRGVzdHJveWVkKCkpXG4gICAgICAgICAgICAgICAgLmRpc3RpbmN0VW50aWxDaGFuZ2VkKHggPT4gISF4KVxuICAgICAgICAgICAgICAgIC5kZWJvdW5jZVRpbWUoNTAwKVxuICAgICAgICAgICAgICAgIC5zd2l0Y2hNYXAoKCkgPT4gdGhpcy51cGRhdGVDb2RlTGVucyhlZGl0b3IpKVxuICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoKSk7XG4gICAgICAgICAgICBjb25zdCBiaW5kRGlkQ2hhbmdlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGRpZENoYW5nZSA9IGVkaXRvci5nZXRCdWZmZXIoKS5vbkRpZENoYW5nZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGRpZENoYW5nZS5kaXNwb3NlKCk7XG4gICAgICAgICAgICAgICAgICAgIGNkLnJlbW92ZShkaWRDaGFuZ2UpO1xuICAgICAgICAgICAgICAgICAgICBzdWJqZWN0Lm5leHQoZmFsc2UpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNkLmFkZChkaWRDaGFuZ2UpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGNkLmFkZChlZGl0b3IuZ2V0QnVmZmVyKCkub25EaWRTdG9wQ2hhbmdpbmcoXy5kZWJvdW5jZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKCFzdWJqZWN0LmlzVW5zdWJzY3JpYmVkKVxuICAgICAgICAgICAgICAgICAgICBzdWJqZWN0Lm5leHQodHJ1ZSk7XG4gICAgICAgICAgICAgICAgYmluZERpZENoYW5nZSgpO1xuICAgICAgICAgICAgfSwgNTAwMCkpKTtcbiAgICAgICAgICAgIGNkLmFkZChlZGl0b3IuZ2V0QnVmZmVyKCkub25EaWRTYXZlKCgpID0+IHN1YmplY3QubmV4dCh0cnVlKSkpO1xuICAgICAgICAgICAgY2QuYWRkKGVkaXRvci5nZXRCdWZmZXIoKS5vbkRpZFJlbG9hZCgoKSA9PiBzdWJqZWN0Lm5leHQodHJ1ZSkpKTtcbiAgICAgICAgICAgIGNkLmFkZChPYnNlcnZhYmxlLnRpbWVyKDEwMDApLnN1YnNjcmliZSgoKSA9PiBzdWJqZWN0Lm5leHQodHJ1ZSkpKTtcbiAgICAgICAgICAgIGNkLmFkZChlZGl0b3Iub25EaWRDaGFuZ2VTY3JvbGxUb3AoKCkgPT4gdGhpcy51cGRhdGVEZWNvcmF0b3JWaXNpYmxpbGl0eShlZGl0b3IpKSk7XG4gICAgICAgICAgICBjZC5hZGQoYXRvbS5jb21tYW5kcy5vbldpbGxEaXNwYXRjaCgoZXZlbnQpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoXy5pbmNsdWRlcyhbXCJvbW5pc2hhcnAtYXRvbTp0b2dnbGUtZG9ja1wiLCBcIm9tbmlzaGFycC1hdG9tOnNob3ctZG9ja1wiLCBcIm9tbmlzaGFycC1hdG9tOmhpZGUtZG9ja1wiXSwgZXZlbnQudHlwZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy51cGRhdGVEZWNvcmF0b3JWaXNpYmxpbGl0eShlZGl0b3IpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIGNkLmFkZChzdWJqZWN0KTtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlRGVjb3JhdG9yVmlzaWJsaWxpdHkoZWRpdG9yKTtcbiAgICAgICAgfSkpO1xuICAgIH1cbiAgICB1cGRhdGVEZWNvcmF0b3JWaXNpYmxpbGl0eShlZGl0b3IpIHtcbiAgICAgICAgaWYgKCF0aGlzLmRlY29yYXRpb25zLmhhcyhlZGl0b3IpKVxuICAgICAgICAgICAgdGhpcy5kZWNvcmF0aW9ucy5zZXQoZWRpdG9yLCBuZXcgU2V0KCkpO1xuICAgICAgICBjb25zdCBkZWNvcmF0aW9ucyA9IHRoaXMuZGVjb3JhdGlvbnMuZ2V0KGVkaXRvcik7XG4gICAgICAgIGRlY29yYXRpb25zLmZvckVhY2goZGVjb3JhdGlvbiA9PiBkZWNvcmF0aW9uLnVwZGF0ZVZpc2libGUoKSk7XG4gICAgfVxuICAgIGRpc3Bvc2UoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfVxuICAgIHVwZGF0ZUNvZGVMZW5zKGVkaXRvcikge1xuICAgICAgICBpZiAoIXRoaXMuZGVjb3JhdGlvbnMuaGFzKGVkaXRvcikpXG4gICAgICAgICAgICB0aGlzLmRlY29yYXRpb25zLnNldChlZGl0b3IsIG5ldyBTZXQoKSk7XG4gICAgICAgIGNvbnN0IGRlY29yYXRpb25zID0gdGhpcy5kZWNvcmF0aW9ucy5nZXQoZWRpdG9yKTtcbiAgICAgICAgY29uc3QgdXBkYXRlZCA9IG5ldyBXZWFrU2V0KCk7XG4gICAgICAgIGlmIChlZGl0b3IuaXNEZXN0cm95ZWQoKSkge1xuICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuZW1wdHkoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gT21uaS5yZXF1ZXN0KGVkaXRvciwgc29sdXRpb24gPT4gc29sdXRpb24uY3VycmVudGZpbGVtZW1iZXJzYXNmbGF0KHsgQnVmZmVyOiBudWxsLCBDaGFuZ2VzOiBudWxsIH0pKVxuICAgICAgICAgICAgLmZpbHRlcihmaWxlTWVtYmVycyA9PiAhIWZpbGVNZW1iZXJzKVxuICAgICAgICAgICAgLmZsYXRNYXAoZmlsZU1lbWJlcnMgPT4gZmlsZU1lbWJlcnMpXG4gICAgICAgICAgICAuY29uY2F0TWFwKGZpbGVNZW1iZXIgPT4ge1xuICAgICAgICAgICAgY29uc3QgcmFuZ2UgPSBlZGl0b3IuZ2V0QnVmZmVyKCkucmFuZ2VGb3JSb3coZmlsZU1lbWJlci5MaW5lLCBmYWxzZSk7XG4gICAgICAgICAgICBjb25zdCBtYXJrZXIgPSBlZGl0b3IubWFya0J1ZmZlclJhbmdlKHJhbmdlLCB7IGludmFsaWRhdGU6IFwiaW5zaWRlXCIgfSk7XG4gICAgICAgICAgICBsZXQgbGVucztcbiAgICAgICAgICAgIGNvbnN0IGl0ZXJhdGVlID0gZGVjb3JhdGlvbnMudmFsdWVzKCk7XG4gICAgICAgICAgICBsZXQgZGVjb3JhdGlvbiA9IGl0ZXJhdGVlLm5leHQoKTtcbiAgICAgICAgICAgIHdoaWxlICghZGVjb3JhdGlvbi5kb25lKSB7XG4gICAgICAgICAgICAgICAgaWYgKGRlY29yYXRpb24udmFsdWUuaXNFcXVhbChtYXJrZXIpKSB7XG4gICAgICAgICAgICAgICAgICAgIGxlbnMgPSBkZWNvcmF0aW9uLnZhbHVlO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZGVjb3JhdGlvbiA9IGl0ZXJhdGVlLm5leHQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChsZW5zKSB7XG4gICAgICAgICAgICAgICAgdXBkYXRlZC5hZGQobGVucyk7XG4gICAgICAgICAgICAgICAgbGVucy5pbnZhbGlkYXRlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBsZW5zID0gbmV3IExlbnMoZWRpdG9yLCBmaWxlTWVtYmVyLCBtYXJrZXIsIHJhbmdlLCBEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGRlY29yYXRpb25zLmRlbGV0ZShsZW5zKTtcbiAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICAgICAgdXBkYXRlZC5hZGQobGVucyk7XG4gICAgICAgICAgICAgICAgZGVjb3JhdGlvbnMuYWRkKGxlbnMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGxlbnMudXBkYXRlVmlzaWJsZSgpO1xuICAgICAgICB9KVxuICAgICAgICAgICAgLmRvKHsgY29tcGxldGU6ICgpID0+IHtcbiAgICAgICAgICAgICAgICBkZWNvcmF0aW9ucy5mb3JFYWNoKGxlbnMgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAobGVucyAmJiAhdXBkYXRlZC5oYXMobGVucykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxlbnMuZGlzcG9zZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IH0pO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGlzTGluZVZpc2libGUoZWRpdG9yLCBsaW5lKSB7XG4gICAgY29uc3QgZWxlbWVudCA9IGF0b20udmlld3MuZ2V0VmlldyhlZGl0b3IpO1xuICAgIGNvbnN0IHRvcCA9IGVsZW1lbnQuZ2V0Rmlyc3RWaXNpYmxlU2NyZWVuUm93KCk7XG4gICAgY29uc3QgYm90dG9tID0gZWxlbWVudC5nZXRMYXN0VmlzaWJsZVNjcmVlblJvdygpO1xuICAgIGlmIChsaW5lIDw9IHRvcCB8fCBsaW5lID49IGJvdHRvbSlcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIHJldHVybiB0cnVlO1xufVxuZXhwb3J0IGNsYXNzIExlbnMge1xuICAgIGNvbnN0cnVjdG9yKF9lZGl0b3IsIF9tZW1iZXIsIF9tYXJrZXIsIF9yYW5nZSwgZGlzcG9zZXIpIHtcbiAgICAgICAgdGhpcy5fZWRpdG9yID0gX2VkaXRvcjtcbiAgICAgICAgdGhpcy5fbWVtYmVyID0gX21lbWJlcjtcbiAgICAgICAgdGhpcy5fbWFya2VyID0gX21hcmtlcjtcbiAgICAgICAgdGhpcy5fcmFuZ2UgPSBfcmFuZ2U7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICB0aGlzLmxvYWRlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLl9pc3N1ZVVwZGF0ZSA9IF8uZGVib3VuY2UoKGlzVmlzaWJsZSkgPT4ge1xuICAgICAgICAgICAgaWYgKCF0aGlzLl91cGRhdGUuaXNVbnN1YnNjcmliZWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl91cGRhdGUubmV4dChpc1Zpc2libGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCAyNTApO1xuICAgICAgICB0aGlzLl9yb3cgPSBfcmFuZ2UuZ2V0Um93cygpWzBdO1xuICAgICAgICB0aGlzLl91cGRhdGUgPSBuZXcgU3ViamVjdCgpO1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZCh0aGlzLl91cGRhdGUpO1xuICAgICAgICB0aGlzLl9wYXRoID0gX2VkaXRvci5nZXRQYXRoKCk7XG4gICAgICAgIHRoaXMuX3VwZGF0ZU9ic2VydmFibGUgPSB0aGlzLl91cGRhdGVcbiAgICAgICAgICAgIC5maWx0ZXIoeCA9PiAhIXgpXG4gICAgICAgICAgICAuZmxhdE1hcCgoKSA9PiBPbW5pLnJlcXVlc3QodGhpcy5fZWRpdG9yLCBzb2x1dGlvbiA9PiBzb2x1dGlvbi5maW5kdXNhZ2VzKHsgRmlsZU5hbWU6IHRoaXMuX3BhdGgsIENvbHVtbjogdGhpcy5fbWVtYmVyLkNvbHVtbiArIDEsIExpbmU6IHRoaXMuX21lbWJlci5MaW5lLCBCdWZmZXI6IG51bGwsIENoYW5nZXM6IG51bGwgfSwgeyBzaWxlbnQ6IHRydWUgfSkpKVxuICAgICAgICAgICAgLmZpbHRlcih4ID0+IHggJiYgeC5RdWlja0ZpeGVzICYmICEheC5RdWlja0ZpeGVzLmxlbmd0aClcbiAgICAgICAgICAgIC5tYXAoeCA9PiB4ICYmIHguUXVpY2tGaXhlcyAmJiB4LlF1aWNrRml4ZXMubGVuZ3RoIC0gMSlcbiAgICAgICAgICAgIC5zaGFyZSgpO1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZCh0aGlzLl91cGRhdGVPYnNlcnZhYmxlXG4gICAgICAgICAgICAudGFrZSgxKVxuICAgICAgICAgICAgLmZpbHRlcih4ID0+IHggPiAwKVxuICAgICAgICAgICAgLmRvKCgpID0+IHRoaXMubG9hZGVkID0gdHJ1ZSlcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoKHgpID0+IHRoaXMuX2RlY29yYXRlKHgpKSk7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKGRpc3Bvc2VyKTtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQodGhpcy5fbWFya2VyLm9uRGlkRGVzdHJveSgoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmRpc3Bvc2UoKTtcbiAgICAgICAgfSkpO1xuICAgIH1cbiAgICB1cGRhdGVWaXNpYmxlKCkge1xuICAgICAgICBjb25zdCBpc1Zpc2libGUgPSB0aGlzLl9pc1Zpc2libGUoKTtcbiAgICAgICAgdGhpcy5fdXBkYXRlRGVjb3JhdGlvbihpc1Zpc2libGUpO1xuICAgICAgICBsZXQgcmVzdWx0O1xuICAgICAgICBpZiAoaXNWaXNpYmxlKSB7XG4gICAgICAgICAgICByZXN1bHQgPSB0aGlzLl91cGRhdGVPYnNlcnZhYmxlLnRha2UoMSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXN1bHQgPSBPYnNlcnZhYmxlLmVtcHR5KCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5faXNzdWVVcGRhdGUoaXNWaXNpYmxlKTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG4gICAgdXBkYXRlVG9wKGxpbmVIZWlnaHQpIHtcbiAgICAgICAgaWYgKHRoaXMuX2VsZW1lbnQpXG4gICAgICAgICAgICB0aGlzLl9lbGVtZW50LnN0eWxlLnRvcCA9IGAtJHtsaW5lSGVpZ2h0fXB4YDtcbiAgICB9XG4gICAgaW52YWxpZGF0ZSgpIHtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXMuX3VwZGF0ZU9ic2VydmFibGVcbiAgICAgICAgICAgIC50YWtlKDEpXG4gICAgICAgICAgICAuZG8oKCkgPT4gdGhpcy5fZGlzcG9zYWJsZS5yZW1vdmUoc2VsZikpXG4gICAgICAgICAgICAuc3Vic2NyaWJlKHggPT4ge1xuICAgICAgICAgICAgaWYgKHggPD0gMCkge1xuICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX2VsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgKHRoaXMuX2VsZW1lbnQudGV4dENvbnRlbnQgPSB4LnRvU3RyaW5nKCkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKHNlbGYpO1xuICAgIH1cbiAgICBpc0VxdWFsKG1hcmtlcikge1xuICAgICAgICByZXR1cm4gdGhpcy5fbWFya2VyLmlzRXF1YWwobWFya2VyKTtcbiAgICB9XG4gICAgX2lzVmlzaWJsZSgpIHtcbiAgICAgICAgcmV0dXJuIGlzTGluZVZpc2libGUodGhpcy5fZWRpdG9yLCB0aGlzLl9yb3cpO1xuICAgIH1cbiAgICBfdXBkYXRlRGVjb3JhdGlvbihpc1Zpc2libGUpIHtcbiAgICAgICAgaWYgKHRoaXMuX2RlY29yYXRpb24gJiYgdGhpcy5fZWxlbWVudCkge1xuICAgICAgICAgICAgY29uc3QgZWxlbWVudCA9IHRoaXMuX2VsZW1lbnQ7XG4gICAgICAgICAgICBpZiAoaXNWaXNpYmxlKSB7XG4gICAgICAgICAgICAgICAgZmFzdGRvbS5tZWFzdXJlKCgpID0+IGVsZW1lbnQuc3R5bGUuZGlzcGxheSA9PT0gXCJub25lXCIgJiYgZmFzdGRvbS5tdXRhdGUoKCkgPT4gZWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gXCJcIikpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZmFzdGRvbS5tZWFzdXJlKCgpID0+IGVsZW1lbnQuc3R5bGUuZGlzcGxheSAhPT0gXCJub25lXCIgJiYgZmFzdGRvbS5tdXRhdGUoKCkgPT4gZWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCIpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBfZGVjb3JhdGUoY291bnQpIHtcbiAgICAgICAgY29uc3QgbGluZUhlaWdodCA9IHRoaXMuX2VkaXRvci5nZXRMaW5lSGVpZ2h0SW5QaXhlbHMoKTtcbiAgICAgICAgY29uc3QgZWxlbWVudCA9IHRoaXMuX2VsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICBlbGVtZW50LnN0eWxlLnBvc2l0aW9uID0gXCJyZWxhdGl2ZVwiO1xuICAgICAgICBlbGVtZW50LnN0eWxlLnRvcCA9IGAtJHtsaW5lSGVpZ2h0fXB4YDtcbiAgICAgICAgZWxlbWVudC5zdHlsZS5sZWZ0ID0gXCIxNnB4XCI7XG4gICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZChcImhpZ2hsaWdodC1pbmZvXCIsIFwiYmFkZ2VcIiwgXCJiYWRnZS1zbWFsbFwiKTtcbiAgICAgICAgZWxlbWVudC50ZXh0Q29udGVudCA9IGNvdW50LnRvU3RyaW5nKCk7XG4gICAgICAgIGVsZW1lbnQub25jbGljayA9ICgpID0+IE9tbmkucmVxdWVzdCh0aGlzLl9lZGl0b3IsIHMgPT4gcy5maW5kdXNhZ2VzKHsgRmlsZU5hbWU6IHRoaXMuX3BhdGgsIENvbHVtbjogdGhpcy5fbWVtYmVyLkNvbHVtbiArIDEsIExpbmU6IHRoaXMuX21lbWJlci5MaW5lLCBCdWZmZXI6IG51bGwsIENoYW5nZXM6IG51bGwgfSkpO1xuICAgICAgICB0aGlzLl9kZWNvcmF0aW9uID0gdGhpcy5fZWRpdG9yLmRlY29yYXRlTWFya2VyKHRoaXMuX21hcmtlciwgeyB0eXBlOiBcIm92ZXJsYXlcIiwgY2xhc3M6IGBjb2RlbGVuc2AsIGl0ZW06IHRoaXMuX2VsZW1lbnQsIHBvc2l0aW9uOiBcImhlYWRcIiB9KTtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5fZWxlbWVudC5yZW1vdmUoKTtcbiAgICAgICAgICAgIGlmICh0aGlzLl9kZWNvcmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fZGVjb3JhdGlvbi5kZXN0cm95KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9lbGVtZW50ID0gbnVsbDtcbiAgICAgICAgfSkpO1xuICAgICAgICBjb25zdCBpc1Zpc2libGUgPSBpc0xpbmVWaXNpYmxlKHRoaXMuX2VkaXRvciwgdGhpcy5fcm93KTtcbiAgICAgICAgaWYgKCFpc1Zpc2libGUpIHtcbiAgICAgICAgICAgIGVsZW1lbnQuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLl9kZWNvcmF0aW9uO1xuICAgIH1cbiAgICBkaXNwb3NlKCkgeyByZXR1cm4gdGhpcy5fZGlzcG9zYWJsZS5kaXNwb3NlKCk7IH1cbn1cbmV4cG9ydCBjb25zdCBjb2RlTGVucyA9IG5ldyBDb2RlTGVucygpO1xuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL3R5cGluZ3MuZC50c1wiIC8+XHJcbmltcG9ydCB7TW9kZWxzfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xyXG5pbXBvcnQgXyBmcm9tIFwibG9kYXNoXCI7XHJcbmltcG9ydCB7T2JzZXJ2YWJsZSwgU3ViamVjdCwgU3Vic2NyaXB0aW9ufSBmcm9tIFwicnhqc1wiO1xyXG5pbXBvcnQge0NvbXBvc2l0ZURpc3Bvc2FibGUsIERpc3Bvc2FibGUsIElEaXNwb3NhYmxlfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xyXG5pbXBvcnQge09tbml9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xyXG5sZXQgZmFzdGRvbTogdHlwZW9mIEZhc3Rkb20gPSByZXF1aXJlKFwiZmFzdGRvbVwiKTtcclxuXHJcbmludGVyZmFjZSBJRGVjb3JhdGlvbiB7XHJcbiAgICBkZXN0cm95KCk6IGFueTtcclxuICAgIGdldE1hcmtlcigpOiBBdG9tLk1hcmtlcjtcclxuICAgIGdldFByb3BlcnRpZXMoKTogYW55O1xyXG4gICAgc2V0UHJvcGVydGllcyhwcm9wczogYW55KTogYW55O1xyXG59XHJcblxyXG5jbGFzcyBDb2RlTGVucyBpbXBsZW1lbnRzIElGZWF0dXJlIHtcclxuICAgIHByaXZhdGUgZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxuICAgIHByaXZhdGUgZGVjb3JhdGlvbnMgPSBuZXcgV2Vha01hcDxBdG9tLlRleHRFZGl0b3IsIFNldDxMZW5zPj4oKTtcclxuXHJcbiAgICBwdWJsaWMgYWN0aXZhdGUoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmVhY2hFZGl0b3IoKGVkaXRvciwgY2QpID0+IHtcclxuICAgICAgICAgICAgY2QuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IG1hcmtlcnMgPSB0aGlzLmRlY29yYXRpb25zLmdldChlZGl0b3IpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChtYXJrZXJzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbWFya2Vycy5mb3JFYWNoKG1hcmtlciA9PiBtYXJrZXIuZGlzcG9zZSgpKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLmRlY29yYXRpb25zLmRlbGV0ZShlZGl0b3IpO1xyXG4gICAgICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgICAgICBjZC5hZGQoYXRvbS5jb25maWcub2JzZXJ2ZShcImVkaXRvci5mb250U2l6ZVwiLCAoc2l6ZTogbnVtYmVyKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBkZWNvcmF0aW9ucyA9IHRoaXMuZGVjb3JhdGlvbnMuZ2V0KGVkaXRvcik7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBsaW5lSGVpZ2h0ID0gZWRpdG9yLmdldExpbmVIZWlnaHRJblBpeGVscygpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGRlY29yYXRpb25zICYmIGxpbmVIZWlnaHQpIHtcclxuICAgICAgICAgICAgICAgICAgICBkZWNvcmF0aW9ucy5mb3JFYWNoKGRlY29yYXRpb24gPT4gZGVjb3JhdGlvbi51cGRhdGVUb3AobGluZUhlaWdodCkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KSk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuc3dpdGNoQWN0aXZlRWRpdG9yKChlZGl0b3IsIGNkKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IGl0ZW1zID0gdGhpcy5kZWNvcmF0aW9ucy5nZXQoZWRpdG9yKTtcclxuICAgICAgICAgICAgaWYgKCFpdGVtcykgdGhpcy5kZWNvcmF0aW9ucy5zZXQoZWRpdG9yLCBuZXcgU2V0PExlbnM+KCkpO1xyXG5cclxuICAgICAgICAgICAgY29uc3Qgc3ViamVjdCA9IG5ldyBTdWJqZWN0PGJvb2xlYW4+KCk7XHJcblxyXG4gICAgICAgICAgICBjZC5hZGQoc3ViamVjdFxyXG4gICAgICAgICAgICAgICAgLmZpbHRlcih4ID0+ICEheCAmJiAhZWRpdG9yLmlzRGVzdHJveWVkKCkpXHJcbiAgICAgICAgICAgICAgICAuZGlzdGluY3RVbnRpbENoYW5nZWQoeCA9PiAhIXgpXHJcbiAgICAgICAgICAgICAgICAuZGVib3VuY2VUaW1lKDUwMClcclxuICAgICAgICAgICAgICAgIC5zd2l0Y2hNYXAoKCkgPT4gdGhpcy51cGRhdGVDb2RlTGVucyhlZGl0b3IpKVxyXG4gICAgICAgICAgICAgICAgLnN1YnNjcmliZSgpXHJcbiAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICBjb25zdCBiaW5kRGlkQ2hhbmdlID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBkaWRDaGFuZ2UgPSBlZGl0b3IuZ2V0QnVmZmVyKCkub25EaWRDaGFuZ2UoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGRpZENoYW5nZS5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgY2QucmVtb3ZlKGRpZENoYW5nZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHN1YmplY3QubmV4dChmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBjZC5hZGQoZGlkQ2hhbmdlKTtcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIGNkLmFkZChlZGl0b3IuZ2V0QnVmZmVyKCkub25EaWRTdG9wQ2hhbmdpbmcoXy5kZWJvdW5jZSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXN1YmplY3QuaXNVbnN1YnNjcmliZWQpIHN1YmplY3QubmV4dCh0cnVlKTtcclxuICAgICAgICAgICAgICAgIGJpbmREaWRDaGFuZ2UoKTtcclxuICAgICAgICAgICAgfSwgNTAwMCkpKTtcclxuXHJcbiAgICAgICAgICAgIGNkLmFkZChlZGl0b3IuZ2V0QnVmZmVyKCkub25EaWRTYXZlKCgpID0+IHN1YmplY3QubmV4dCh0cnVlKSkpO1xyXG4gICAgICAgICAgICBjZC5hZGQoZWRpdG9yLmdldEJ1ZmZlcigpLm9uRGlkUmVsb2FkKCgpID0+IHN1YmplY3QubmV4dCh0cnVlKSkpO1xyXG4gICAgICAgICAgICBjZC5hZGQoT2JzZXJ2YWJsZS50aW1lcigxMDAwKS5zdWJzY3JpYmUoKCkgPT4gc3ViamVjdC5uZXh0KHRydWUpKSk7XHJcblxyXG4gICAgICAgICAgICBjZC5hZGQoZWRpdG9yLm9uRGlkQ2hhbmdlU2Nyb2xsVG9wKCgpID0+IHRoaXMudXBkYXRlRGVjb3JhdG9yVmlzaWJsaWxpdHkoZWRpdG9yKSkpO1xyXG5cclxuICAgICAgICAgICAgY2QuYWRkKGF0b20uY29tbWFuZHMub25XaWxsRGlzcGF0Y2goKGV2ZW50OiBFdmVudCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKF8uaW5jbHVkZXMoW1wib21uaXNoYXJwLWF0b206dG9nZ2xlLWRvY2tcIiwgXCJvbW5pc2hhcnAtYXRvbTpzaG93LWRvY2tcIiwgXCJvbW5pc2hhcnAtYXRvbTpoaWRlLWRvY2tcIl0sIGV2ZW50LnR5cGUpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy51cGRhdGVEZWNvcmF0b3JWaXNpYmxpbGl0eShlZGl0b3IpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgICAgICBjZC5hZGQoc3ViamVjdCk7XHJcbiAgICAgICAgICAgIHRoaXMudXBkYXRlRGVjb3JhdG9yVmlzaWJsaWxpdHkoZWRpdG9yKTtcclxuICAgICAgICB9KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHVwZGF0ZURlY29yYXRvclZpc2libGlsaXR5KGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLmRlY29yYXRpb25zLmhhcyhlZGl0b3IpKSB0aGlzLmRlY29yYXRpb25zLnNldChlZGl0b3IsIG5ldyBTZXQ8TGVucz4oKSk7XHJcbiAgICAgICAgY29uc3QgZGVjb3JhdGlvbnMgPSB0aGlzLmRlY29yYXRpb25zLmdldChlZGl0b3IpO1xyXG4gICAgICAgIGRlY29yYXRpb25zLmZvckVhY2goZGVjb3JhdGlvbiA9PiBkZWNvcmF0aW9uLnVwZGF0ZVZpc2libGUoKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgdXBkYXRlQ29kZUxlbnMoZWRpdG9yOiBBdG9tLlRleHRFZGl0b3IpIHtcclxuICAgICAgICBpZiAoIXRoaXMuZGVjb3JhdGlvbnMuaGFzKGVkaXRvcikpIHRoaXMuZGVjb3JhdGlvbnMuc2V0KGVkaXRvciwgbmV3IFNldDxMZW5zPigpKTtcclxuICAgICAgICBjb25zdCBkZWNvcmF0aW9ucyA9IHRoaXMuZGVjb3JhdGlvbnMuZ2V0KGVkaXRvcik7XHJcblxyXG4gICAgICAgIGNvbnN0IHVwZGF0ZWQgPSBuZXcgV2Vha1NldDxMZW5zPigpO1xyXG5cclxuICAgICAgICBpZiAoZWRpdG9yLmlzRGVzdHJveWVkKCkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuZW1wdHk8bnVtYmVyPigpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIE9tbmkucmVxdWVzdChlZGl0b3IsIHNvbHV0aW9uID0+IHNvbHV0aW9uLmN1cnJlbnRmaWxlbWVtYmVyc2FzZmxhdCh7IEJ1ZmZlcjogbnVsbCwgQ2hhbmdlczogbnVsbCB9KSlcclxuICAgICAgICAgICAgLmZpbHRlcihmaWxlTWVtYmVycyA9PiAhIWZpbGVNZW1iZXJzKVxyXG4gICAgICAgICAgICAuZmxhdE1hcChmaWxlTWVtYmVycyA9PiBmaWxlTWVtYmVycylcclxuICAgICAgICAgICAgLmNvbmNhdE1hcChmaWxlTWVtYmVyID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHJhbmdlOiBUZXh0QnVmZmVyLlJhbmdlID0gPGFueT5lZGl0b3IuZ2V0QnVmZmVyKCkucmFuZ2VGb3JSb3coZmlsZU1lbWJlci5MaW5lLCBmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICAvLyBUT0RPOiBCbG9jayBkZWNvcmF0aW9uc1xyXG4gICAgICAgICAgICAgICAgLy8gY29uc3QgbWFya2VyOiBBdG9tLk1hcmtlciA9ICg8YW55PmVkaXRvcikubWFya1NjcmVlblBvc2l0aW9uKFtmaWxlTWVtYmVyLkxpbmUsIDBdKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IG1hcmtlcjogQXRvbS5NYXJrZXIgPSAoPGFueT5lZGl0b3IpLm1hcmtCdWZmZXJSYW5nZShyYW5nZSwgeyBpbnZhbGlkYXRlOiBcImluc2lkZVwiIH0pO1xyXG4gICAgICAgICAgICAgICAgbGV0IGxlbnM6IExlbnM7XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc3QgaXRlcmF0ZWUgPSBkZWNvcmF0aW9ucy52YWx1ZXMoKTtcclxuICAgICAgICAgICAgICAgIGxldCBkZWNvcmF0aW9uID0gaXRlcmF0ZWUubmV4dCgpO1xyXG4gICAgICAgICAgICAgICAgd2hpbGUgKCFkZWNvcmF0aW9uLmRvbmUpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZGVjb3JhdGlvbi52YWx1ZS5pc0VxdWFsKG1hcmtlcikpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGVucyA9IGRlY29yYXRpb24udmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBkZWNvcmF0aW9uID0gaXRlcmF0ZWUubmV4dCgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChsZW5zKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdXBkYXRlZC5hZGQobGVucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgbGVucy5pbnZhbGlkYXRlKCk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGxlbnMgPSBuZXcgTGVucyhlZGl0b3IsIGZpbGVNZW1iZXIsIG1hcmtlciwgcmFuZ2UsIERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGVjb3JhdGlvbnMuZGVsZXRlKGxlbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pKTtcclxuICAgICAgICAgICAgICAgICAgICB1cGRhdGVkLmFkZChsZW5zKTtcclxuICAgICAgICAgICAgICAgICAgICBkZWNvcmF0aW9ucy5hZGQobGVucyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGxlbnMudXBkYXRlVmlzaWJsZSgpO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAuZG8oeyBjb21wbGV0ZTogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgLy8gUmVtb3ZlIGFsbCBvbGQvbWlzc2luZyBkZWNvcmF0aW9uc1xyXG4gICAgICAgICAgICAgICAgZGVjb3JhdGlvbnMuZm9yRWFjaChsZW5zID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobGVucyAmJiAhdXBkYXRlZC5oYXMobGVucykpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGVucy5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0gfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlcXVpcmVkID0gZmFsc2U7XHJcbiAgICBwdWJsaWMgdGl0bGUgPSBcIkNvZGUgTGVuc1wiO1xyXG4gICAgcHVibGljIGRlc2NyaXB0aW9uID0gXCJBZGRzIHN1cHBvcnQgZm9yIGRpc3BsYXlpbmcgcmVmZXJlbmNlcyBpbiB0aGUgZWRpdG9yLlwiO1xyXG59XHJcblxyXG5mdW5jdGlvbiBpc0xpbmVWaXNpYmxlKGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yLCBsaW5lOiBudW1iZXIpIHtcclxuICAgIGNvbnN0IGVsZW1lbnQ6IGFueSA9IGF0b20udmlld3MuZ2V0VmlldyhlZGl0b3IpO1xyXG4gICAgY29uc3QgdG9wID0gZWxlbWVudC5nZXRGaXJzdFZpc2libGVTY3JlZW5Sb3coKTtcclxuICAgIGNvbnN0IGJvdHRvbSA9IGVsZW1lbnQuZ2V0TGFzdFZpc2libGVTY3JlZW5Sb3coKTtcclxuXHJcbiAgICBpZiAobGluZSA8PSB0b3AgfHwgbGluZSA+PSBib3R0b20pXHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgcmV0dXJuIHRydWU7XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBMZW5zIGltcGxlbWVudHMgSURpc3Bvc2FibGUge1xyXG4gICAgcHJpdmF0ZSBfdXBkYXRlOiBTdWJqZWN0PGJvb2xlYW4+O1xyXG4gICAgcHJpdmF0ZSBfcm93OiBudW1iZXI7XHJcbiAgICBwcml2YXRlIF9kZWNvcmF0aW9uOiBJRGVjb3JhdGlvbjtcclxuICAgIHByaXZhdGUgX2Rpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG4gICAgcHJpdmF0ZSBfZWxlbWVudDogSFRNTERpdkVsZW1lbnQ7XHJcbiAgICBwcml2YXRlIF91cGRhdGVPYnNlcnZhYmxlOiBPYnNlcnZhYmxlPG51bWJlcj47XHJcbiAgICBwcml2YXRlIF9wYXRoOiBzdHJpbmc7XHJcblxyXG4gICAgcHVibGljIGxvYWRlZDogYm9vbGVhbiA9IGZhbHNlO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgX2VkaXRvcjogQXRvbS5UZXh0RWRpdG9yLCBwcml2YXRlIF9tZW1iZXI6IE1vZGVscy5RdWlja0ZpeCwgcHJpdmF0ZSBfbWFya2VyOiBBdG9tLk1hcmtlciwgcHJpdmF0ZSBfcmFuZ2U6IFRleHRCdWZmZXIuUmFuZ2UsIGRpc3Bvc2VyOiBJRGlzcG9zYWJsZSkge1xyXG4gICAgICAgIHRoaXMuX3JvdyA9IF9yYW5nZS5nZXRSb3dzKClbMF07XHJcbiAgICAgICAgdGhpcy5fdXBkYXRlID0gbmV3IFN1YmplY3Q8YW55PigpO1xyXG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKHRoaXMuX3VwZGF0ZSk7XHJcbiAgICAgICAgdGhpcy5fcGF0aCA9IF9lZGl0b3IuZ2V0UGF0aCgpO1xyXG5cclxuICAgICAgICB0aGlzLl91cGRhdGVPYnNlcnZhYmxlID0gdGhpcy5fdXBkYXRlXHJcbiAgICAgICAgICAgIC5maWx0ZXIoeCA9PiAhIXgpXHJcbiAgICAgICAgICAgIC5mbGF0TWFwKCgpID0+IE9tbmkucmVxdWVzdCh0aGlzLl9lZGl0b3IsIHNvbHV0aW9uID0+XHJcbiAgICAgICAgICAgICAgICBzb2x1dGlvbi5maW5kdXNhZ2VzKHsgRmlsZU5hbWU6IHRoaXMuX3BhdGgsIENvbHVtbjogdGhpcy5fbWVtYmVyLkNvbHVtbiArIDEsIExpbmU6IHRoaXMuX21lbWJlci5MaW5lLCBCdWZmZXI6IG51bGwsIENoYW5nZXM6IG51bGwgfSwgeyBzaWxlbnQ6IHRydWUgfSkpKVxyXG4gICAgICAgICAgICAuZmlsdGVyKHggPT4geCAmJiB4LlF1aWNrRml4ZXMgJiYgISF4LlF1aWNrRml4ZXMubGVuZ3RoKVxyXG4gICAgICAgICAgICAubWFwKHggPT4geCAmJiB4LlF1aWNrRml4ZXMgJiYgeC5RdWlja0ZpeGVzLmxlbmd0aCAtIDEpXHJcbiAgICAgICAgICAgIC5zaGFyZSgpO1xyXG5cclxuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZCh0aGlzLl91cGRhdGVPYnNlcnZhYmxlXHJcbiAgICAgICAgICAgIC50YWtlKDEpXHJcbiAgICAgICAgICAgIC5maWx0ZXIoeCA9PiB4ID4gMClcclxuICAgICAgICAgICAgLmRvKCgpID0+IHRoaXMubG9hZGVkID0gdHJ1ZSlcclxuICAgICAgICAgICAgLnN1YnNjcmliZSgoeCkgPT4gdGhpcy5fZGVjb3JhdGUoeCkpKTtcclxuXHJcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoZGlzcG9zZXIpO1xyXG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKHRoaXMuX21hcmtlci5vbkRpZERlc3Ryb3koKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLmRpc3Bvc2UoKTtcclxuICAgICAgICB9KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHVwZGF0ZVZpc2libGUoKSB7XHJcbiAgICAgICAgY29uc3QgaXNWaXNpYmxlID0gdGhpcy5faXNWaXNpYmxlKCk7XHJcbiAgICAgICAgdGhpcy5fdXBkYXRlRGVjb3JhdGlvbihpc1Zpc2libGUpO1xyXG5cclxuICAgICAgICBsZXQgcmVzdWx0OiBPYnNlcnZhYmxlPG51bWJlcj47XHJcbiAgICAgICAgaWYgKGlzVmlzaWJsZSkge1xyXG4gICAgICAgICAgICByZXN1bHQgPSB0aGlzLl91cGRhdGVPYnNlcnZhYmxlLnRha2UoMSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmVzdWx0ID0gT2JzZXJ2YWJsZS5lbXB0eTxudW1iZXI+KCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLl9pc3N1ZVVwZGF0ZShpc1Zpc2libGUpO1xyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfaXNzdWVVcGRhdGUgPSBfLmRlYm91bmNlKChpc1Zpc2libGU6IGJvb2xlYW4pID0+IHtcclxuICAgICAgICBpZiAoIXRoaXMuX3VwZGF0ZS5pc1Vuc3Vic2NyaWJlZCkgeyB0aGlzLl91cGRhdGUubmV4dChpc1Zpc2libGUpOyB9XHJcbiAgICB9LCAyNTApO1xyXG5cclxuICAgIHB1YmxpYyB1cGRhdGVUb3AobGluZUhlaWdodDogbnVtYmVyKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuX2VsZW1lbnQpXHJcbiAgICAgICAgICAgIHRoaXMuX2VsZW1lbnQuc3R5bGUudG9wID0gYC0ke2xpbmVIZWlnaHR9cHhgO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBpbnZhbGlkYXRlKCkge1xyXG4gICAgICAgIGNvbnN0IHNlbGYgOiBTdWJzY3JpcHRpb24gPSB0aGlzLl91cGRhdGVPYnNlcnZhYmxlXHJcbiAgICAgICAgICAgIC50YWtlKDEpXHJcbiAgICAgICAgICAgIC5kbygoKSA9PiB0aGlzLl9kaXNwb3NhYmxlLnJlbW92ZShzZWxmKSlcclxuICAgICAgICAgICAgLnN1YnNjcmliZSh4ID0+IHtcclxuICAgICAgICAgICAgICAgIGlmICh4IDw9IDApIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX2VsZW1lbnQpIHsgKHRoaXMuX2VsZW1lbnQudGV4dENvbnRlbnQgPSB4LnRvU3RyaW5nKCkpOyB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKHNlbGYpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBpc0VxdWFsKG1hcmtlcjogQXRvbS5NYXJrZXIpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fbWFya2VyLmlzRXF1YWwoPGFueT5tYXJrZXIpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX2lzVmlzaWJsZSgpIHtcclxuICAgICAgICByZXR1cm4gaXNMaW5lVmlzaWJsZSh0aGlzLl9lZGl0b3IsIHRoaXMuX3Jvdyk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfdXBkYXRlRGVjb3JhdGlvbihpc1Zpc2libGU6IGJvb2xlYW4pIHtcclxuICAgICAgICBpZiAodGhpcy5fZGVjb3JhdGlvbiAmJiB0aGlzLl9lbGVtZW50KSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGVsZW1lbnQgPSB0aGlzLl9lbGVtZW50O1xyXG4gICAgICAgICAgICBpZiAoaXNWaXNpYmxlKSB7XHJcbiAgICAgICAgICAgICAgICBmYXN0ZG9tLm1lYXN1cmUoKCkgPT4gZWxlbWVudC5zdHlsZS5kaXNwbGF5ID09PSBcIm5vbmVcIiAmJiBmYXN0ZG9tLm11dGF0ZSgoKSA9PiBlbGVtZW50LnN0eWxlLmRpc3BsYXkgPSBcIlwiKSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBmYXN0ZG9tLm1lYXN1cmUoKCkgPT4gZWxlbWVudC5zdHlsZS5kaXNwbGF5ICE9PSBcIm5vbmVcIiAmJiBmYXN0ZG9tLm11dGF0ZSgoKSA9PiBlbGVtZW50LnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIikpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX2RlY29yYXRlKGNvdW50OiBudW1iZXIpIHtcclxuICAgICAgICBjb25zdCBsaW5lSGVpZ2h0ID0gdGhpcy5fZWRpdG9yLmdldExpbmVIZWlnaHRJblBpeGVscygpO1xyXG5cclxuICAgICAgICBjb25zdCBlbGVtZW50ID0gdGhpcy5fZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgICAgICAgZWxlbWVudC5zdHlsZS5wb3NpdGlvbiA9IFwicmVsYXRpdmVcIjtcclxuICAgICAgICBlbGVtZW50LnN0eWxlLnRvcCA9IGAtJHtsaW5lSGVpZ2h0fXB4YDtcclxuICAgICAgICBlbGVtZW50LnN0eWxlLmxlZnQgPSBcIjE2cHhcIjtcclxuICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5hZGQoXCJoaWdobGlnaHQtaW5mb1wiLCBcImJhZGdlXCIsIFwiYmFkZ2Utc21hbGxcIik7XHJcbiAgICAgICAgZWxlbWVudC50ZXh0Q29udGVudCA9IGNvdW50LnRvU3RyaW5nKCk7XHJcbiAgICAgICAgZWxlbWVudC5vbmNsaWNrID0gKCkgPT4gT21uaS5yZXF1ZXN0KHRoaXMuX2VkaXRvciwgcyA9PiBzLmZpbmR1c2FnZXMoeyBGaWxlTmFtZTogdGhpcy5fcGF0aCwgQ29sdW1uOiB0aGlzLl9tZW1iZXIuQ29sdW1uICsgMSwgTGluZTogdGhpcy5fbWVtYmVyLkxpbmUsIEJ1ZmZlcjogbnVsbCwgQ2hhbmdlczogbnVsbCB9KSk7XHJcblxyXG4gICAgICAgIC8vIFRPRE86IEJsb2NrIGRlY29yYXRpb25zXHJcbiAgICAgICAgLy8gdGhpcy5fZGVjb3JhdGlvbiA9IDxhbnk+dGhpcy5fZWRpdG9yLmRlY29yYXRlTWFya2VyKHRoaXMuX21hcmtlciwgeyB0eXBlOiBcImJsb2NrXCIsIGNsYXNzOiBgY29kZWxlbnNgLCBpdGVtOiB0aGlzLl9lbGVtZW50LCBwb3NpdGlvbjogXCJiZWZvcmVcIiB9KTtcclxuICAgICAgICB0aGlzLl9kZWNvcmF0aW9uID0gPGFueT50aGlzLl9lZGl0b3IuZGVjb3JhdGVNYXJrZXIodGhpcy5fbWFya2VyLCB7IHR5cGU6IFwib3ZlcmxheVwiLCBjbGFzczogYGNvZGVsZW5zYCwgaXRlbTogdGhpcy5fZWxlbWVudCwgcG9zaXRpb246IFwiaGVhZFwiIH0pO1xyXG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5fZWxlbWVudC5yZW1vdmUoKTtcclxuICAgICAgICAgICAgaWYgKHRoaXMuX2RlY29yYXRpb24pIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2RlY29yYXRpb24uZGVzdHJveSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuX2VsZW1lbnQgPSBudWxsO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgY29uc3QgaXNWaXNpYmxlID0gaXNMaW5lVmlzaWJsZSh0aGlzLl9lZGl0b3IsIHRoaXMuX3Jvdyk7XHJcbiAgICAgICAgaWYgKCFpc1Zpc2libGUpIHtcclxuICAgICAgICAgICAgZWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy5fZGVjb3JhdGlvbjtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGlzcG9zZSgpIHsgcmV0dXJuIHRoaXMuX2Rpc3Bvc2FibGUuZGlzcG9zZSgpOyB9XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBjb2RlTGVucyA9IG5ldyBDb2RlTGVucygpO1xyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
