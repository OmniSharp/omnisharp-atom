"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.codeLens = exports.Lens = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _rxjs = require("rxjs");

var _tsDisposables = require("ts-disposables");

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

            this.disposable = new _tsDisposables.CompositeDisposable();
            this.disposable.add(_omni.Omni.eachEditor(function (editor, cd) {
                cd.add(_tsDisposables.Disposable.create(function () {
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
                    lens = new Lens(editor, fileMember, marker, range, _tsDisposables.Disposable.create(function () {
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
        this._disposable = new _tsDisposables.CompositeDisposable();
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
            this._disposable.add(_tsDisposables.Disposable.create(function () {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9jb2RlLWxlbnMuanMiLCJsaWIvZmVhdHVyZXMvY29kZS1sZW5zLnRzIl0sIm5hbWVzIjpbImZhc3Rkb20iLCJyZXF1aXJlIiwiQ29kZUxlbnMiLCJkZWNvcmF0aW9ucyIsIldlYWtNYXAiLCJyZXF1aXJlZCIsInRpdGxlIiwiZGVzY3JpcHRpb24iLCJkaXNwb3NhYmxlIiwiYWRkIiwiZWFjaEVkaXRvciIsImVkaXRvciIsImNkIiwiY3JlYXRlIiwibWFya2VycyIsImdldCIsImZvckVhY2giLCJtYXJrZXIiLCJkaXNwb3NlIiwiZGVsZXRlIiwiYXRvbSIsImNvbmZpZyIsIm9ic2VydmUiLCJzaXplIiwibGluZUhlaWdodCIsImdldExpbmVIZWlnaHRJblBpeGVscyIsImRlY29yYXRpb24iLCJ1cGRhdGVUb3AiLCJzd2l0Y2hBY3RpdmVFZGl0b3IiLCJpdGVtcyIsInNldCIsIlNldCIsInN1YmplY3QiLCJmaWx0ZXIiLCJ4IiwiaXNEZXN0cm95ZWQiLCJkaXN0aW5jdFVudGlsQ2hhbmdlZCIsImRlYm91bmNlVGltZSIsInN3aXRjaE1hcCIsInVwZGF0ZUNvZGVMZW5zIiwic3Vic2NyaWJlIiwiYmluZERpZENoYW5nZSIsImRpZENoYW5nZSIsImdldEJ1ZmZlciIsIm9uRGlkQ2hhbmdlIiwicmVtb3ZlIiwibmV4dCIsIm9uRGlkU3RvcENoYW5naW5nIiwiZGVib3VuY2UiLCJpc1Vuc3Vic2NyaWJlZCIsIm9uRGlkU2F2ZSIsIm9uRGlkUmVsb2FkIiwidGltZXIiLCJvbkRpZENoYW5nZVNjcm9sbFRvcCIsInVwZGF0ZURlY29yYXRvclZpc2libGlsaXR5IiwiY29tbWFuZHMiLCJvbldpbGxEaXNwYXRjaCIsImV2ZW50IiwiaW5jbHVkZXMiLCJ0eXBlIiwiaGFzIiwidXBkYXRlVmlzaWJsZSIsInVwZGF0ZWQiLCJXZWFrU2V0IiwiZW1wdHkiLCJyZXF1ZXN0Iiwic29sdXRpb24iLCJjdXJyZW50ZmlsZW1lbWJlcnNhc2ZsYXQiLCJCdWZmZXIiLCJDaGFuZ2VzIiwiZmlsZU1lbWJlcnMiLCJmbGF0TWFwIiwiY29uY2F0TWFwIiwicmFuZ2UiLCJyYW5nZUZvclJvdyIsImZpbGVNZW1iZXIiLCJMaW5lIiwibWFya0J1ZmZlclJhbmdlIiwiaW52YWxpZGF0ZSIsImxlbnMiLCJpdGVyYXRlZSIsInZhbHVlcyIsImRvbmUiLCJ2YWx1ZSIsImlzRXF1YWwiLCJMZW5zIiwiZG8iLCJjb21wbGV0ZSIsImlzTGluZVZpc2libGUiLCJsaW5lIiwiZWxlbWVudCIsInZpZXdzIiwiZ2V0VmlldyIsInRvcCIsImdldEZpcnN0VmlzaWJsZVNjcmVlblJvdyIsImJvdHRvbSIsImdldExhc3RWaXNpYmxlU2NyZWVuUm93IiwiX2VkaXRvciIsIl9tZW1iZXIiLCJfbWFya2VyIiwiX3JhbmdlIiwiZGlzcG9zZXIiLCJfZGlzcG9zYWJsZSIsImxvYWRlZCIsIl9pc3N1ZVVwZGF0ZSIsImlzVmlzaWJsZSIsIl91cGRhdGUiLCJfcm93IiwiZ2V0Um93cyIsIl9wYXRoIiwiZ2V0UGF0aCIsIl91cGRhdGVPYnNlcnZhYmxlIiwiZmluZHVzYWdlcyIsIkZpbGVOYW1lIiwiQ29sdW1uIiwic2lsZW50IiwiUXVpY2tGaXhlcyIsImxlbmd0aCIsIm1hcCIsInNoYXJlIiwidGFrZSIsIl9kZWNvcmF0ZSIsIm9uRGlkRGVzdHJveSIsIl9pc1Zpc2libGUiLCJfdXBkYXRlRGVjb3JhdGlvbiIsInJlc3VsdCIsIl9lbGVtZW50Iiwic3R5bGUiLCJzZWxmIiwidGV4dENvbnRlbnQiLCJ0b1N0cmluZyIsIl9kZWNvcmF0aW9uIiwibWVhc3VyZSIsImRpc3BsYXkiLCJtdXRhdGUiLCJjb3VudCIsImRvY3VtZW50IiwiY3JlYXRlRWxlbWVudCIsInBvc2l0aW9uIiwibGVmdCIsImNsYXNzTGlzdCIsIm9uY2xpY2siLCJzIiwiZGVjb3JhdGVNYXJrZXIiLCJjbGFzcyIsIml0ZW0iLCJkZXN0cm95IiwiY29kZUxlbnMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOzs7O0FBQ0E7O0FB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U0FBTCxFQUFnQjtBQUNaZix3QkFBUXFDLEtBQVIsQ0FBY00sT0FBZCxHQUF3QixNQUF4QjtBQUNIO0FBRUQsbUJBQU8sS0FBS0YsV0FBWjtBQUNIOzs7a0NBRWE7QUFBSyxtQkFBTyxLQUFLN0IsV0FBTCxDQUFpQnBGLE9BQWpCLEVBQVA7QUFBb0M7Ozs7OztBQUdwRCxJQUFNaUksOEJBQVcsSUFBSWpKLFFBQUosRUFBakIiLCJmaWxlIjoibGliL2ZlYXR1cmVzL2NvZGUtbGVucy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcbmltcG9ydCB7IE9ic2VydmFibGUsIFN1YmplY3QgfSBmcm9tIFwicnhqc1wiO1xuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSwgRGlzcG9zYWJsZSB9IGZyb20gXCJ0cy1kaXNwb3NhYmxlc1wiO1xuaW1wb3J0IHsgT21uaSB9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xubGV0IGZhc3Rkb20gPSByZXF1aXJlKFwiZmFzdGRvbVwiKTtcbmNsYXNzIENvZGVMZW5zIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5kZWNvcmF0aW9ucyA9IG5ldyBXZWFrTWFwKCk7XG4gICAgICAgIHRoaXMucmVxdWlyZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy50aXRsZSA9IFwiQ29kZSBMZW5zXCI7XG4gICAgICAgIHRoaXMuZGVzY3JpcHRpb24gPSBcIkFkZHMgc3VwcG9ydCBmb3IgZGlzcGxheWluZyByZWZlcmVuY2VzIGluIHRoZSBlZGl0b3IuXCI7XG4gICAgfVxuICAgIGFjdGl2YXRlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuZWFjaEVkaXRvcigoZWRpdG9yLCBjZCkgPT4ge1xuICAgICAgICAgICAgY2QuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBtYXJrZXJzID0gdGhpcy5kZWNvcmF0aW9ucy5nZXQoZWRpdG9yKTtcbiAgICAgICAgICAgICAgICBpZiAobWFya2Vycykge1xuICAgICAgICAgICAgICAgICAgICBtYXJrZXJzLmZvckVhY2gobWFya2VyID0+IG1hcmtlci5kaXNwb3NlKCkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLmRlY29yYXRpb25zLmRlbGV0ZShlZGl0b3IpO1xuICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgY2QuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoXCJlZGl0b3IuZm9udFNpemVcIiwgKHNpemUpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBkZWNvcmF0aW9ucyA9IHRoaXMuZGVjb3JhdGlvbnMuZ2V0KGVkaXRvcik7XG4gICAgICAgICAgICAgICAgY29uc3QgbGluZUhlaWdodCA9IGVkaXRvci5nZXRMaW5lSGVpZ2h0SW5QaXhlbHMoKTtcbiAgICAgICAgICAgICAgICBpZiAoZGVjb3JhdGlvbnMgJiYgbGluZUhlaWdodCkge1xuICAgICAgICAgICAgICAgICAgICBkZWNvcmF0aW9ucy5mb3JFYWNoKGRlY29yYXRpb24gPT4gZGVjb3JhdGlvbi51cGRhdGVUb3AobGluZUhlaWdodCkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuc3dpdGNoQWN0aXZlRWRpdG9yKChlZGl0b3IsIGNkKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBpdGVtcyA9IHRoaXMuZGVjb3JhdGlvbnMuZ2V0KGVkaXRvcik7XG4gICAgICAgICAgICBpZiAoIWl0ZW1zKVxuICAgICAgICAgICAgICAgIHRoaXMuZGVjb3JhdGlvbnMuc2V0KGVkaXRvciwgbmV3IFNldCgpKTtcbiAgICAgICAgICAgIGNvbnN0IHN1YmplY3QgPSBuZXcgU3ViamVjdCgpO1xuICAgICAgICAgICAgY2QuYWRkKHN1YmplY3RcbiAgICAgICAgICAgICAgICAuZmlsdGVyKHggPT4gISF4ICYmICFlZGl0b3IuaXNEZXN0cm95ZWQoKSlcbiAgICAgICAgICAgICAgICAuZGlzdGluY3RVbnRpbENoYW5nZWQoeCA9PiAhIXgpXG4gICAgICAgICAgICAgICAgLmRlYm91bmNlVGltZSg1MDApXG4gICAgICAgICAgICAgICAgLnN3aXRjaE1hcCgoKSA9PiB0aGlzLnVwZGF0ZUNvZGVMZW5zKGVkaXRvcikpXG4gICAgICAgICAgICAgICAgLnN1YnNjcmliZSgpKTtcbiAgICAgICAgICAgIGNvbnN0IGJpbmREaWRDaGFuZ2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZGlkQ2hhbmdlID0gZWRpdG9yLmdldEJ1ZmZlcigpLm9uRGlkQ2hhbmdlKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgZGlkQ2hhbmdlLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgY2QucmVtb3ZlKGRpZENoYW5nZSk7XG4gICAgICAgICAgICAgICAgICAgIHN1YmplY3QubmV4dChmYWxzZSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY2QuYWRkKGRpZENoYW5nZSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgY2QuYWRkKGVkaXRvci5nZXRCdWZmZXIoKS5vbkRpZFN0b3BDaGFuZ2luZyhfLmRlYm91bmNlKCgpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoIXN1YmplY3QuaXNVbnN1YnNjcmliZWQpXG4gICAgICAgICAgICAgICAgICAgIHN1YmplY3QubmV4dCh0cnVlKTtcbiAgICAgICAgICAgICAgICBiaW5kRGlkQ2hhbmdlKCk7XG4gICAgICAgICAgICB9LCA1MDAwKSkpO1xuICAgICAgICAgICAgY2QuYWRkKGVkaXRvci5nZXRCdWZmZXIoKS5vbkRpZFNhdmUoKCkgPT4gc3ViamVjdC5uZXh0KHRydWUpKSk7XG4gICAgICAgICAgICBjZC5hZGQoZWRpdG9yLmdldEJ1ZmZlcigpLm9uRGlkUmVsb2FkKCgpID0+IHN1YmplY3QubmV4dCh0cnVlKSkpO1xuICAgICAgICAgICAgY2QuYWRkKE9ic2VydmFibGUudGltZXIoMTAwMCkuc3Vic2NyaWJlKCgpID0+IHN1YmplY3QubmV4dCh0cnVlKSkpO1xuICAgICAgICAgICAgY2QuYWRkKGVkaXRvci5vbkRpZENoYW5nZVNjcm9sbFRvcCgoKSA9PiB0aGlzLnVwZGF0ZURlY29yYXRvclZpc2libGlsaXR5KGVkaXRvcikpKTtcbiAgICAgICAgICAgIGNkLmFkZChhdG9tLmNvbW1hbmRzLm9uV2lsbERpc3BhdGNoKChldmVudCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChfLmluY2x1ZGVzKFtcIm9tbmlzaGFycC1hdG9tOnRvZ2dsZS1kb2NrXCIsIFwib21uaXNoYXJwLWF0b206c2hvdy1kb2NrXCIsIFwib21uaXNoYXJwLWF0b206aGlkZS1kb2NrXCJdLCBldmVudC50eXBlKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZURlY29yYXRvclZpc2libGlsaXR5KGVkaXRvcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgY2QuYWRkKHN1YmplY3QpO1xuICAgICAgICAgICAgdGhpcy51cGRhdGVEZWNvcmF0b3JWaXNpYmxpbGl0eShlZGl0b3IpO1xuICAgICAgICB9KSk7XG4gICAgfVxuICAgIHVwZGF0ZURlY29yYXRvclZpc2libGlsaXR5KGVkaXRvcikge1xuICAgICAgICBpZiAoIXRoaXMuZGVjb3JhdGlvbnMuaGFzKGVkaXRvcikpXG4gICAgICAgICAgICB0aGlzLmRlY29yYXRpb25zLnNldChlZGl0b3IsIG5ldyBTZXQoKSk7XG4gICAgICAgIGNvbnN0IGRlY29yYXRpb25zID0gdGhpcy5kZWNvcmF0aW9ucy5nZXQoZWRpdG9yKTtcbiAgICAgICAgZGVjb3JhdGlvbnMuZm9yRWFjaChkZWNvcmF0aW9uID0+IGRlY29yYXRpb24udXBkYXRlVmlzaWJsZSgpKTtcbiAgICB9XG4gICAgZGlzcG9zZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICB9XG4gICAgdXBkYXRlQ29kZUxlbnMoZWRpdG9yKSB7XG4gICAgICAgIGlmICghdGhpcy5kZWNvcmF0aW9ucy5oYXMoZWRpdG9yKSlcbiAgICAgICAgICAgIHRoaXMuZGVjb3JhdGlvbnMuc2V0KGVkaXRvciwgbmV3IFNldCgpKTtcbiAgICAgICAgY29uc3QgZGVjb3JhdGlvbnMgPSB0aGlzLmRlY29yYXRpb25zLmdldChlZGl0b3IpO1xuICAgICAgICBjb25zdCB1cGRhdGVkID0gbmV3IFdlYWtTZXQoKTtcbiAgICAgICAgaWYgKGVkaXRvci5pc0Rlc3Ryb3llZCgpKSB7XG4gICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5lbXB0eSgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBPbW5pLnJlcXVlc3QoZWRpdG9yLCBzb2x1dGlvbiA9PiBzb2x1dGlvbi5jdXJyZW50ZmlsZW1lbWJlcnNhc2ZsYXQoeyBCdWZmZXI6IG51bGwsIENoYW5nZXM6IG51bGwgfSkpXG4gICAgICAgICAgICAuZmlsdGVyKGZpbGVNZW1iZXJzID0+ICEhZmlsZU1lbWJlcnMpXG4gICAgICAgICAgICAuZmxhdE1hcChmaWxlTWVtYmVycyA9PiBmaWxlTWVtYmVycylcbiAgICAgICAgICAgIC5jb25jYXRNYXAoZmlsZU1lbWJlciA9PiB7XG4gICAgICAgICAgICBjb25zdCByYW5nZSA9IGVkaXRvci5nZXRCdWZmZXIoKS5yYW5nZUZvclJvdyhmaWxlTWVtYmVyLkxpbmUsIGZhbHNlKTtcbiAgICAgICAgICAgIGNvbnN0IG1hcmtlciA9IGVkaXRvci5tYXJrQnVmZmVyUmFuZ2UocmFuZ2UsIHsgaW52YWxpZGF0ZTogXCJpbnNpZGVcIiB9KTtcbiAgICAgICAgICAgIGxldCBsZW5zO1xuICAgICAgICAgICAgY29uc3QgaXRlcmF0ZWUgPSBkZWNvcmF0aW9ucy52YWx1ZXMoKTtcbiAgICAgICAgICAgIGxldCBkZWNvcmF0aW9uID0gaXRlcmF0ZWUubmV4dCgpO1xuICAgICAgICAgICAgd2hpbGUgKCFkZWNvcmF0aW9uLmRvbmUpIHtcbiAgICAgICAgICAgICAgICBpZiAoZGVjb3JhdGlvbi52YWx1ZS5pc0VxdWFsKG1hcmtlcikpIHtcbiAgICAgICAgICAgICAgICAgICAgbGVucyA9IGRlY29yYXRpb24udmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBkZWNvcmF0aW9uID0gaXRlcmF0ZWUubmV4dCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGxlbnMpIHtcbiAgICAgICAgICAgICAgICB1cGRhdGVkLmFkZChsZW5zKTtcbiAgICAgICAgICAgICAgICBsZW5zLmludmFsaWRhdGUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGxlbnMgPSBuZXcgTGVucyhlZGl0b3IsIGZpbGVNZW1iZXIsIG1hcmtlciwgcmFuZ2UsIERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgZGVjb3JhdGlvbnMuZGVsZXRlKGxlbnMpO1xuICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgICAgICB1cGRhdGVkLmFkZChsZW5zKTtcbiAgICAgICAgICAgICAgICBkZWNvcmF0aW9ucy5hZGQobGVucyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbGVucy51cGRhdGVWaXNpYmxlKCk7XG4gICAgICAgIH0pXG4gICAgICAgICAgICAuZG8oeyBjb21wbGV0ZTogKCkgPT4ge1xuICAgICAgICAgICAgICAgIGRlY29yYXRpb25zLmZvckVhY2gobGVucyA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChsZW5zICYmICF1cGRhdGVkLmhhcyhsZW5zKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGVucy5kaXNwb3NlKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gfSk7XG4gICAgfVxufVxuZnVuY3Rpb24gaXNMaW5lVmlzaWJsZShlZGl0b3IsIGxpbmUpIHtcbiAgICBjb25zdCBlbGVtZW50ID0gYXRvbS52aWV3cy5nZXRWaWV3KGVkaXRvcik7XG4gICAgY29uc3QgdG9wID0gZWxlbWVudC5nZXRGaXJzdFZpc2libGVTY3JlZW5Sb3coKTtcbiAgICBjb25zdCBib3R0b20gPSBlbGVtZW50LmdldExhc3RWaXNpYmxlU2NyZWVuUm93KCk7XG4gICAgaWYgKGxpbmUgPD0gdG9wIHx8IGxpbmUgPj0gYm90dG9tKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgcmV0dXJuIHRydWU7XG59XG5leHBvcnQgY2xhc3MgTGVucyB7XG4gICAgY29uc3RydWN0b3IoX2VkaXRvciwgX21lbWJlciwgX21hcmtlciwgX3JhbmdlLCBkaXNwb3Nlcikge1xuICAgICAgICB0aGlzLl9lZGl0b3IgPSBfZWRpdG9yO1xuICAgICAgICB0aGlzLl9tZW1iZXIgPSBfbWVtYmVyO1xuICAgICAgICB0aGlzLl9tYXJrZXIgPSBfbWFya2VyO1xuICAgICAgICB0aGlzLl9yYW5nZSA9IF9yYW5nZTtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIHRoaXMubG9hZGVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMuX2lzc3VlVXBkYXRlID0gXy5kZWJvdW5jZSgoaXNWaXNpYmxlKSA9PiB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuX3VwZGF0ZS5pc1Vuc3Vic2NyaWJlZCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3VwZGF0ZS5uZXh0KGlzVmlzaWJsZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIDI1MCk7XG4gICAgICAgIHRoaXMuX3JvdyA9IF9yYW5nZS5nZXRSb3dzKClbMF07XG4gICAgICAgIHRoaXMuX3VwZGF0ZSA9IG5ldyBTdWJqZWN0KCk7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKHRoaXMuX3VwZGF0ZSk7XG4gICAgICAgIHRoaXMuX3BhdGggPSBfZWRpdG9yLmdldFBhdGgoKTtcbiAgICAgICAgdGhpcy5fdXBkYXRlT2JzZXJ2YWJsZSA9IHRoaXMuX3VwZGF0ZVxuICAgICAgICAgICAgLmZpbHRlcih4ID0+ICEheClcbiAgICAgICAgICAgIC5mbGF0TWFwKCgpID0+IE9tbmkucmVxdWVzdCh0aGlzLl9lZGl0b3IsIHNvbHV0aW9uID0+IHNvbHV0aW9uLmZpbmR1c2FnZXMoeyBGaWxlTmFtZTogdGhpcy5fcGF0aCwgQ29sdW1uOiB0aGlzLl9tZW1iZXIuQ29sdW1uICsgMSwgTGluZTogdGhpcy5fbWVtYmVyLkxpbmUsIEJ1ZmZlcjogbnVsbCwgQ2hhbmdlczogbnVsbCB9LCB7IHNpbGVudDogdHJ1ZSB9KSkpXG4gICAgICAgICAgICAuZmlsdGVyKHggPT4geCAmJiB4LlF1aWNrRml4ZXMgJiYgISF4LlF1aWNrRml4ZXMubGVuZ3RoKVxuICAgICAgICAgICAgLm1hcCh4ID0+IHggJiYgeC5RdWlja0ZpeGVzICYmIHguUXVpY2tGaXhlcy5sZW5ndGggLSAxKVxuICAgICAgICAgICAgLnNoYXJlKCk7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKHRoaXMuX3VwZGF0ZU9ic2VydmFibGVcbiAgICAgICAgICAgIC50YWtlKDEpXG4gICAgICAgICAgICAuZmlsdGVyKHggPT4geCA+IDApXG4gICAgICAgICAgICAuZG8oKCkgPT4gdGhpcy5sb2FkZWQgPSB0cnVlKVxuICAgICAgICAgICAgLnN1YnNjcmliZSgoeCkgPT4gdGhpcy5fZGVjb3JhdGUoeCkpKTtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoZGlzcG9zZXIpO1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZCh0aGlzLl9tYXJrZXIub25EaWREZXN0cm95KCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuZGlzcG9zZSgpO1xuICAgICAgICB9KSk7XG4gICAgfVxuICAgIHVwZGF0ZVZpc2libGUoKSB7XG4gICAgICAgIGNvbnN0IGlzVmlzaWJsZSA9IHRoaXMuX2lzVmlzaWJsZSgpO1xuICAgICAgICB0aGlzLl91cGRhdGVEZWNvcmF0aW9uKGlzVmlzaWJsZSk7XG4gICAgICAgIGxldCByZXN1bHQ7XG4gICAgICAgIGlmIChpc1Zpc2libGUpIHtcbiAgICAgICAgICAgIHJlc3VsdCA9IHRoaXMuX3VwZGF0ZU9ic2VydmFibGUudGFrZSgxKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJlc3VsdCA9IE9ic2VydmFibGUuZW1wdHkoKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9pc3N1ZVVwZGF0ZShpc1Zpc2libGUpO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgICB1cGRhdGVUb3AobGluZUhlaWdodCkge1xuICAgICAgICBpZiAodGhpcy5fZWxlbWVudClcbiAgICAgICAgICAgIHRoaXMuX2VsZW1lbnQuc3R5bGUudG9wID0gYC0ke2xpbmVIZWlnaHR9cHhgO1xuICAgIH1cbiAgICBpbnZhbGlkYXRlKCkge1xuICAgICAgICBjb25zdCBzZWxmID0gdGhpcy5fdXBkYXRlT2JzZXJ2YWJsZVxuICAgICAgICAgICAgLnRha2UoMSlcbiAgICAgICAgICAgIC5kbygoKSA9PiB0aGlzLl9kaXNwb3NhYmxlLnJlbW92ZShzZWxmKSlcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoeCA9PiB7XG4gICAgICAgICAgICBpZiAoeCA8PSAwKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fZWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICAodGhpcy5fZWxlbWVudC50ZXh0Q29udGVudCA9IHgudG9TdHJpbmcoKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoc2VsZik7XG4gICAgfVxuICAgIGlzRXF1YWwobWFya2VyKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9tYXJrZXIuaXNFcXVhbChtYXJrZXIpO1xuICAgIH1cbiAgICBfaXNWaXNpYmxlKCkge1xuICAgICAgICByZXR1cm4gaXNMaW5lVmlzaWJsZSh0aGlzLl9lZGl0b3IsIHRoaXMuX3Jvdyk7XG4gICAgfVxuICAgIF91cGRhdGVEZWNvcmF0aW9uKGlzVmlzaWJsZSkge1xuICAgICAgICBpZiAodGhpcy5fZGVjb3JhdGlvbiAmJiB0aGlzLl9lbGVtZW50KSB7XG4gICAgICAgICAgICBjb25zdCBlbGVtZW50ID0gdGhpcy5fZWxlbWVudDtcbiAgICAgICAgICAgIGlmIChpc1Zpc2libGUpIHtcbiAgICAgICAgICAgICAgICBmYXN0ZG9tLm1lYXN1cmUoKCkgPT4gZWxlbWVudC5zdHlsZS5kaXNwbGF5ID09PSBcIm5vbmVcIiAmJiBmYXN0ZG9tLm11dGF0ZSgoKSA9PiBlbGVtZW50LnN0eWxlLmRpc3BsYXkgPSBcIlwiKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBmYXN0ZG9tLm1lYXN1cmUoKCkgPT4gZWxlbWVudC5zdHlsZS5kaXNwbGF5ICE9PSBcIm5vbmVcIiAmJiBmYXN0ZG9tLm11dGF0ZSgoKSA9PiBlbGVtZW50LnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIikpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIF9kZWNvcmF0ZShjb3VudCkge1xuICAgICAgICBjb25zdCBsaW5lSGVpZ2h0ID0gdGhpcy5fZWRpdG9yLmdldExpbmVIZWlnaHRJblBpeGVscygpO1xuICAgICAgICBjb25zdCBlbGVtZW50ID0gdGhpcy5fZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgIGVsZW1lbnQuc3R5bGUucG9zaXRpb24gPSBcInJlbGF0aXZlXCI7XG4gICAgICAgIGVsZW1lbnQuc3R5bGUudG9wID0gYC0ke2xpbmVIZWlnaHR9cHhgO1xuICAgICAgICBlbGVtZW50LnN0eWxlLmxlZnQgPSBcIjE2cHhcIjtcbiAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkKFwiaGlnaGxpZ2h0LWluZm9cIiwgXCJiYWRnZVwiLCBcImJhZGdlLXNtYWxsXCIpO1xuICAgICAgICBlbGVtZW50LnRleHRDb250ZW50ID0gY291bnQudG9TdHJpbmcoKTtcbiAgICAgICAgZWxlbWVudC5vbmNsaWNrID0gKCkgPT4gT21uaS5yZXF1ZXN0KHRoaXMuX2VkaXRvciwgcyA9PiBzLmZpbmR1c2FnZXMoeyBGaWxlTmFtZTogdGhpcy5fcGF0aCwgQ29sdW1uOiB0aGlzLl9tZW1iZXIuQ29sdW1uICsgMSwgTGluZTogdGhpcy5fbWVtYmVyLkxpbmUsIEJ1ZmZlcjogbnVsbCwgQ2hhbmdlczogbnVsbCB9KSk7XG4gICAgICAgIHRoaXMuX2RlY29yYXRpb24gPSB0aGlzLl9lZGl0b3IuZGVjb3JhdGVNYXJrZXIodGhpcy5fbWFya2VyLCB7IHR5cGU6IFwib3ZlcmxheVwiLCBjbGFzczogYGNvZGVsZW5zYCwgaXRlbTogdGhpcy5fZWxlbWVudCwgcG9zaXRpb246IFwiaGVhZFwiIH0pO1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLl9lbGVtZW50LnJlbW92ZSgpO1xuICAgICAgICAgICAgaWYgKHRoaXMuX2RlY29yYXRpb24pIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9kZWNvcmF0aW9uLmRlc3Ryb3koKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX2VsZW1lbnQgPSBudWxsO1xuICAgICAgICB9KSk7XG4gICAgICAgIGNvbnN0IGlzVmlzaWJsZSA9IGlzTGluZVZpc2libGUodGhpcy5fZWRpdG9yLCB0aGlzLl9yb3cpO1xuICAgICAgICBpZiAoIWlzVmlzaWJsZSkge1xuICAgICAgICAgICAgZWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuX2RlY29yYXRpb247XG4gICAgfVxuICAgIGRpc3Bvc2UoKSB7IHJldHVybiB0aGlzLl9kaXNwb3NhYmxlLmRpc3Bvc2UoKTsgfVxufVxuZXhwb3J0IGNvbnN0IGNvZGVMZW5zID0gbmV3IENvZGVMZW5zKCk7XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vdHlwaW5ncy5kLnRzXCIgLz5cclxuaW1wb3J0IHtNb2RlbHN9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XHJcbmltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcclxuaW1wb3J0IHtPYnNlcnZhYmxlLCBTdWJqZWN0LCBTdWJzY3JpcHRpb259IGZyb20gXCJyeGpzXCI7XHJcbmltcG9ydCB7Q29tcG9zaXRlRGlzcG9zYWJsZSwgRGlzcG9zYWJsZSwgSURpc3Bvc2FibGV9IGZyb20gXCJ0cy1kaXNwb3NhYmxlc1wiO1xyXG5pbXBvcnQge09tbml9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xyXG5sZXQgZmFzdGRvbTogdHlwZW9mIEZhc3Rkb20gPSByZXF1aXJlKFwiZmFzdGRvbVwiKTtcclxuXHJcbmludGVyZmFjZSBJRGVjb3JhdGlvbiB7XHJcbiAgICBkZXN0cm95KCk6IGFueTtcclxuICAgIGdldE1hcmtlcigpOiBBdG9tLk1hcmtlcjtcclxuICAgIGdldFByb3BlcnRpZXMoKTogYW55O1xyXG4gICAgc2V0UHJvcGVydGllcyhwcm9wczogYW55KTogYW55O1xyXG59XHJcblxyXG5jbGFzcyBDb2RlTGVucyBpbXBsZW1lbnRzIElGZWF0dXJlIHtcclxuICAgIHByaXZhdGUgZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxuICAgIHByaXZhdGUgZGVjb3JhdGlvbnMgPSBuZXcgV2Vha01hcDxBdG9tLlRleHRFZGl0b3IsIFNldDxMZW5zPj4oKTtcclxuXHJcbiAgICBwdWJsaWMgYWN0aXZhdGUoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmVhY2hFZGl0b3IoKGVkaXRvciwgY2QpID0+IHtcclxuICAgICAgICAgICAgY2QuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IG1hcmtlcnMgPSB0aGlzLmRlY29yYXRpb25zLmdldChlZGl0b3IpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChtYXJrZXJzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbWFya2Vycy5mb3JFYWNoKG1hcmtlciA9PiBtYXJrZXIuZGlzcG9zZSgpKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLmRlY29yYXRpb25zLmRlbGV0ZShlZGl0b3IpO1xyXG4gICAgICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgICAgICBjZC5hZGQoYXRvbS5jb25maWcub2JzZXJ2ZShcImVkaXRvci5mb250U2l6ZVwiLCAoc2l6ZTogbnVtYmVyKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBkZWNvcmF0aW9ucyA9IHRoaXMuZGVjb3JhdGlvbnMuZ2V0KGVkaXRvcik7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBsaW5lSGVpZ2h0ID0gZWRpdG9yLmdldExpbmVIZWlnaHRJblBpeGVscygpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGRlY29yYXRpb25zICYmIGxpbmVIZWlnaHQpIHtcclxuICAgICAgICAgICAgICAgICAgICBkZWNvcmF0aW9ucy5mb3JFYWNoKGRlY29yYXRpb24gPT4gZGVjb3JhdGlvbi51cGRhdGVUb3AobGluZUhlaWdodCkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KSk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuc3dpdGNoQWN0aXZlRWRpdG9yKChlZGl0b3IsIGNkKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IGl0ZW1zID0gdGhpcy5kZWNvcmF0aW9ucy5nZXQoZWRpdG9yKTtcclxuICAgICAgICAgICAgaWYgKCFpdGVtcykgdGhpcy5kZWNvcmF0aW9ucy5zZXQoZWRpdG9yLCBuZXcgU2V0PExlbnM+KCkpO1xyXG5cclxuICAgICAgICAgICAgY29uc3Qgc3ViamVjdCA9IG5ldyBTdWJqZWN0PGJvb2xlYW4+KCk7XHJcblxyXG4gICAgICAgICAgICBjZC5hZGQoc3ViamVjdFxyXG4gICAgICAgICAgICAgICAgLmZpbHRlcih4ID0+ICEheCAmJiAhZWRpdG9yLmlzRGVzdHJveWVkKCkpXHJcbiAgICAgICAgICAgICAgICAuZGlzdGluY3RVbnRpbENoYW5nZWQoeCA9PiAhIXgpXHJcbiAgICAgICAgICAgICAgICAuZGVib3VuY2VUaW1lKDUwMClcclxuICAgICAgICAgICAgICAgIC5zd2l0Y2hNYXAoKCkgPT4gdGhpcy51cGRhdGVDb2RlTGVucyhlZGl0b3IpKVxyXG4gICAgICAgICAgICAgICAgLnN1YnNjcmliZSgpXHJcbiAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICBjb25zdCBiaW5kRGlkQ2hhbmdlID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBkaWRDaGFuZ2UgPSBlZGl0b3IuZ2V0QnVmZmVyKCkub25EaWRDaGFuZ2UoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGRpZENoYW5nZS5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgY2QucmVtb3ZlKGRpZENoYW5nZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHN1YmplY3QubmV4dChmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBjZC5hZGQoZGlkQ2hhbmdlKTtcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIGNkLmFkZChlZGl0b3IuZ2V0QnVmZmVyKCkub25EaWRTdG9wQ2hhbmdpbmcoXy5kZWJvdW5jZSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXN1YmplY3QuaXNVbnN1YnNjcmliZWQpIHN1YmplY3QubmV4dCh0cnVlKTtcclxuICAgICAgICAgICAgICAgIGJpbmREaWRDaGFuZ2UoKTtcclxuICAgICAgICAgICAgfSwgNTAwMCkpKTtcclxuXHJcbiAgICAgICAgICAgIGNkLmFkZChlZGl0b3IuZ2V0QnVmZmVyKCkub25EaWRTYXZlKCgpID0+IHN1YmplY3QubmV4dCh0cnVlKSkpO1xyXG4gICAgICAgICAgICBjZC5hZGQoZWRpdG9yLmdldEJ1ZmZlcigpLm9uRGlkUmVsb2FkKCgpID0+IHN1YmplY3QubmV4dCh0cnVlKSkpO1xyXG4gICAgICAgICAgICBjZC5hZGQoT2JzZXJ2YWJsZS50aW1lcigxMDAwKS5zdWJzY3JpYmUoKCkgPT4gc3ViamVjdC5uZXh0KHRydWUpKSk7XHJcblxyXG4gICAgICAgICAgICBjZC5hZGQoZWRpdG9yLm9uRGlkQ2hhbmdlU2Nyb2xsVG9wKCgpID0+IHRoaXMudXBkYXRlRGVjb3JhdG9yVmlzaWJsaWxpdHkoZWRpdG9yKSkpO1xyXG5cclxuICAgICAgICAgICAgY2QuYWRkKGF0b20uY29tbWFuZHMub25XaWxsRGlzcGF0Y2goKGV2ZW50OiBFdmVudCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKF8uaW5jbHVkZXMoW1wib21uaXNoYXJwLWF0b206dG9nZ2xlLWRvY2tcIiwgXCJvbW5pc2hhcnAtYXRvbTpzaG93LWRvY2tcIiwgXCJvbW5pc2hhcnAtYXRvbTpoaWRlLWRvY2tcIl0sIGV2ZW50LnR5cGUpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy51cGRhdGVEZWNvcmF0b3JWaXNpYmxpbGl0eShlZGl0b3IpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgICAgICBjZC5hZGQoc3ViamVjdCk7XHJcbiAgICAgICAgICAgIHRoaXMudXBkYXRlRGVjb3JhdG9yVmlzaWJsaWxpdHkoZWRpdG9yKTtcclxuICAgICAgICB9KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHVwZGF0ZURlY29yYXRvclZpc2libGlsaXR5KGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLmRlY29yYXRpb25zLmhhcyhlZGl0b3IpKSB0aGlzLmRlY29yYXRpb25zLnNldChlZGl0b3IsIG5ldyBTZXQ8TGVucz4oKSk7XHJcbiAgICAgICAgY29uc3QgZGVjb3JhdGlvbnMgPSB0aGlzLmRlY29yYXRpb25zLmdldChlZGl0b3IpO1xyXG4gICAgICAgIGRlY29yYXRpb25zLmZvckVhY2goZGVjb3JhdGlvbiA9PiBkZWNvcmF0aW9uLnVwZGF0ZVZpc2libGUoKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgdXBkYXRlQ29kZUxlbnMoZWRpdG9yOiBBdG9tLlRleHRFZGl0b3IpIHtcclxuICAgICAgICBpZiAoIXRoaXMuZGVjb3JhdGlvbnMuaGFzKGVkaXRvcikpIHRoaXMuZGVjb3JhdGlvbnMuc2V0KGVkaXRvciwgbmV3IFNldDxMZW5zPigpKTtcclxuICAgICAgICBjb25zdCBkZWNvcmF0aW9ucyA9IHRoaXMuZGVjb3JhdGlvbnMuZ2V0KGVkaXRvcik7XHJcblxyXG4gICAgICAgIGNvbnN0IHVwZGF0ZWQgPSBuZXcgV2Vha1NldDxMZW5zPigpO1xyXG5cclxuICAgICAgICBpZiAoZWRpdG9yLmlzRGVzdHJveWVkKCkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuZW1wdHk8bnVtYmVyPigpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIE9tbmkucmVxdWVzdChlZGl0b3IsIHNvbHV0aW9uID0+IHNvbHV0aW9uLmN1cnJlbnRmaWxlbWVtYmVyc2FzZmxhdCh7IEJ1ZmZlcjogbnVsbCwgQ2hhbmdlczogbnVsbCB9KSlcclxuICAgICAgICAgICAgLmZpbHRlcihmaWxlTWVtYmVycyA9PiAhIWZpbGVNZW1iZXJzKVxyXG4gICAgICAgICAgICAuZmxhdE1hcChmaWxlTWVtYmVycyA9PiBmaWxlTWVtYmVycylcclxuICAgICAgICAgICAgLmNvbmNhdE1hcChmaWxlTWVtYmVyID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHJhbmdlOiBUZXh0QnVmZmVyLlJhbmdlID0gPGFueT5lZGl0b3IuZ2V0QnVmZmVyKCkucmFuZ2VGb3JSb3coZmlsZU1lbWJlci5MaW5lLCBmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICAvLyBUT0RPOiBCbG9jayBkZWNvcmF0aW9uc1xyXG4gICAgICAgICAgICAgICAgLy8gY29uc3QgbWFya2VyOiBBdG9tLk1hcmtlciA9ICg8YW55PmVkaXRvcikubWFya1NjcmVlblBvc2l0aW9uKFtmaWxlTWVtYmVyLkxpbmUsIDBdKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IG1hcmtlcjogQXRvbS5NYXJrZXIgPSAoPGFueT5lZGl0b3IpLm1hcmtCdWZmZXJSYW5nZShyYW5nZSwgeyBpbnZhbGlkYXRlOiBcImluc2lkZVwiIH0pO1xyXG4gICAgICAgICAgICAgICAgbGV0IGxlbnM6IExlbnM7XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc3QgaXRlcmF0ZWUgPSBkZWNvcmF0aW9ucy52YWx1ZXMoKTtcclxuICAgICAgICAgICAgICAgIGxldCBkZWNvcmF0aW9uID0gaXRlcmF0ZWUubmV4dCgpO1xyXG4gICAgICAgICAgICAgICAgd2hpbGUgKCFkZWNvcmF0aW9uLmRvbmUpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZGVjb3JhdGlvbi52YWx1ZS5pc0VxdWFsKG1hcmtlcikpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGVucyA9IGRlY29yYXRpb24udmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBkZWNvcmF0aW9uID0gaXRlcmF0ZWUubmV4dCgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChsZW5zKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdXBkYXRlZC5hZGQobGVucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgbGVucy5pbnZhbGlkYXRlKCk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGxlbnMgPSBuZXcgTGVucyhlZGl0b3IsIGZpbGVNZW1iZXIsIG1hcmtlciwgcmFuZ2UsIERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGVjb3JhdGlvbnMuZGVsZXRlKGxlbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pKTtcclxuICAgICAgICAgICAgICAgICAgICB1cGRhdGVkLmFkZChsZW5zKTtcclxuICAgICAgICAgICAgICAgICAgICBkZWNvcmF0aW9ucy5hZGQobGVucyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGxlbnMudXBkYXRlVmlzaWJsZSgpO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAuZG8oeyBjb21wbGV0ZTogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgLy8gUmVtb3ZlIGFsbCBvbGQvbWlzc2luZyBkZWNvcmF0aW9uc1xyXG4gICAgICAgICAgICAgICAgZGVjb3JhdGlvbnMuZm9yRWFjaChsZW5zID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobGVucyAmJiAhdXBkYXRlZC5oYXMobGVucykpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGVucy5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0gfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlcXVpcmVkID0gZmFsc2U7XHJcbiAgICBwdWJsaWMgdGl0bGUgPSBcIkNvZGUgTGVuc1wiO1xyXG4gICAgcHVibGljIGRlc2NyaXB0aW9uID0gXCJBZGRzIHN1cHBvcnQgZm9yIGRpc3BsYXlpbmcgcmVmZXJlbmNlcyBpbiB0aGUgZWRpdG9yLlwiO1xyXG59XHJcblxyXG5mdW5jdGlvbiBpc0xpbmVWaXNpYmxlKGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yLCBsaW5lOiBudW1iZXIpIHtcclxuICAgIGNvbnN0IGVsZW1lbnQ6IGFueSA9IGF0b20udmlld3MuZ2V0VmlldyhlZGl0b3IpO1xyXG4gICAgY29uc3QgdG9wID0gZWxlbWVudC5nZXRGaXJzdFZpc2libGVTY3JlZW5Sb3coKTtcclxuICAgIGNvbnN0IGJvdHRvbSA9IGVsZW1lbnQuZ2V0TGFzdFZpc2libGVTY3JlZW5Sb3coKTtcclxuXHJcbiAgICBpZiAobGluZSA8PSB0b3AgfHwgbGluZSA+PSBib3R0b20pXHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgcmV0dXJuIHRydWU7XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBMZW5zIGltcGxlbWVudHMgSURpc3Bvc2FibGUge1xyXG4gICAgcHJpdmF0ZSBfdXBkYXRlOiBTdWJqZWN0PGJvb2xlYW4+O1xyXG4gICAgcHJpdmF0ZSBfcm93OiBudW1iZXI7XHJcbiAgICBwcml2YXRlIF9kZWNvcmF0aW9uOiBJRGVjb3JhdGlvbjtcclxuICAgIHByaXZhdGUgX2Rpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG4gICAgcHJpdmF0ZSBfZWxlbWVudDogSFRNTERpdkVsZW1lbnQ7XHJcbiAgICBwcml2YXRlIF91cGRhdGVPYnNlcnZhYmxlOiBPYnNlcnZhYmxlPG51bWJlcj47XHJcbiAgICBwcml2YXRlIF9wYXRoOiBzdHJpbmc7XHJcblxyXG4gICAgcHVibGljIGxvYWRlZDogYm9vbGVhbiA9IGZhbHNlO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgX2VkaXRvcjogQXRvbS5UZXh0RWRpdG9yLCBwcml2YXRlIF9tZW1iZXI6IE1vZGVscy5RdWlja0ZpeCwgcHJpdmF0ZSBfbWFya2VyOiBBdG9tLk1hcmtlciwgcHJpdmF0ZSBfcmFuZ2U6IFRleHRCdWZmZXIuUmFuZ2UsIGRpc3Bvc2VyOiBJRGlzcG9zYWJsZSkge1xyXG4gICAgICAgIHRoaXMuX3JvdyA9IF9yYW5nZS5nZXRSb3dzKClbMF07XHJcbiAgICAgICAgdGhpcy5fdXBkYXRlID0gbmV3IFN1YmplY3Q8YW55PigpO1xyXG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKHRoaXMuX3VwZGF0ZSk7XHJcbiAgICAgICAgdGhpcy5fcGF0aCA9IF9lZGl0b3IuZ2V0UGF0aCgpO1xyXG5cclxuICAgICAgICB0aGlzLl91cGRhdGVPYnNlcnZhYmxlID0gdGhpcy5fdXBkYXRlXHJcbiAgICAgICAgICAgIC5maWx0ZXIoeCA9PiAhIXgpXHJcbiAgICAgICAgICAgIC5mbGF0TWFwKCgpID0+IE9tbmkucmVxdWVzdCh0aGlzLl9lZGl0b3IsIHNvbHV0aW9uID0+XHJcbiAgICAgICAgICAgICAgICBzb2x1dGlvbi5maW5kdXNhZ2VzKHsgRmlsZU5hbWU6IHRoaXMuX3BhdGgsIENvbHVtbjogdGhpcy5fbWVtYmVyLkNvbHVtbiArIDEsIExpbmU6IHRoaXMuX21lbWJlci5MaW5lLCBCdWZmZXI6IG51bGwsIENoYW5nZXM6IG51bGwgfSwgeyBzaWxlbnQ6IHRydWUgfSkpKVxyXG4gICAgICAgICAgICAuZmlsdGVyKHggPT4geCAmJiB4LlF1aWNrRml4ZXMgJiYgISF4LlF1aWNrRml4ZXMubGVuZ3RoKVxyXG4gICAgICAgICAgICAubWFwKHggPT4geCAmJiB4LlF1aWNrRml4ZXMgJiYgeC5RdWlja0ZpeGVzLmxlbmd0aCAtIDEpXHJcbiAgICAgICAgICAgIC5zaGFyZSgpO1xyXG5cclxuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZCh0aGlzLl91cGRhdGVPYnNlcnZhYmxlXHJcbiAgICAgICAgICAgIC50YWtlKDEpXHJcbiAgICAgICAgICAgIC5maWx0ZXIoeCA9PiB4ID4gMClcclxuICAgICAgICAgICAgLmRvKCgpID0+IHRoaXMubG9hZGVkID0gdHJ1ZSlcclxuICAgICAgICAgICAgLnN1YnNjcmliZSgoeCkgPT4gdGhpcy5fZGVjb3JhdGUoeCkpKTtcclxuXHJcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoZGlzcG9zZXIpO1xyXG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKHRoaXMuX21hcmtlci5vbkRpZERlc3Ryb3koKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLmRpc3Bvc2UoKTtcclxuICAgICAgICB9KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHVwZGF0ZVZpc2libGUoKSB7XHJcbiAgICAgICAgY29uc3QgaXNWaXNpYmxlID0gdGhpcy5faXNWaXNpYmxlKCk7XHJcbiAgICAgICAgdGhpcy5fdXBkYXRlRGVjb3JhdGlvbihpc1Zpc2libGUpO1xyXG5cclxuICAgICAgICBsZXQgcmVzdWx0OiBPYnNlcnZhYmxlPG51bWJlcj47XHJcbiAgICAgICAgaWYgKGlzVmlzaWJsZSkge1xyXG4gICAgICAgICAgICByZXN1bHQgPSB0aGlzLl91cGRhdGVPYnNlcnZhYmxlLnRha2UoMSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmVzdWx0ID0gT2JzZXJ2YWJsZS5lbXB0eTxudW1iZXI+KCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLl9pc3N1ZVVwZGF0ZShpc1Zpc2libGUpO1xyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfaXNzdWVVcGRhdGUgPSBfLmRlYm91bmNlKChpc1Zpc2libGU6IGJvb2xlYW4pID0+IHtcclxuICAgICAgICBpZiAoIXRoaXMuX3VwZGF0ZS5pc1Vuc3Vic2NyaWJlZCkgeyB0aGlzLl91cGRhdGUubmV4dChpc1Zpc2libGUpOyB9XHJcbiAgICB9LCAyNTApO1xyXG5cclxuICAgIHB1YmxpYyB1cGRhdGVUb3AobGluZUhlaWdodDogbnVtYmVyKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuX2VsZW1lbnQpXHJcbiAgICAgICAgICAgIHRoaXMuX2VsZW1lbnQuc3R5bGUudG9wID0gYC0ke2xpbmVIZWlnaHR9cHhgO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBpbnZhbGlkYXRlKCkge1xyXG4gICAgICAgIGNvbnN0IHNlbGYgOiBTdWJzY3JpcHRpb24gPSB0aGlzLl91cGRhdGVPYnNlcnZhYmxlXHJcbiAgICAgICAgICAgIC50YWtlKDEpXHJcbiAgICAgICAgICAgIC5kbygoKSA9PiB0aGlzLl9kaXNwb3NhYmxlLnJlbW92ZShzZWxmKSlcclxuICAgICAgICAgICAgLnN1YnNjcmliZSh4ID0+IHtcclxuICAgICAgICAgICAgICAgIGlmICh4IDw9IDApIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX2VsZW1lbnQpIHsgKHRoaXMuX2VsZW1lbnQudGV4dENvbnRlbnQgPSB4LnRvU3RyaW5nKCkpOyB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKHNlbGYpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBpc0VxdWFsKG1hcmtlcjogQXRvbS5NYXJrZXIpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fbWFya2VyLmlzRXF1YWwoPGFueT5tYXJrZXIpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX2lzVmlzaWJsZSgpIHtcclxuICAgICAgICByZXR1cm4gaXNMaW5lVmlzaWJsZSh0aGlzLl9lZGl0b3IsIHRoaXMuX3Jvdyk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfdXBkYXRlRGVjb3JhdGlvbihpc1Zpc2libGU6IGJvb2xlYW4pIHtcclxuICAgICAgICBpZiAodGhpcy5fZGVjb3JhdGlvbiAmJiB0aGlzLl9lbGVtZW50KSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGVsZW1lbnQgPSB0aGlzLl9lbGVtZW50O1xyXG4gICAgICAgICAgICBpZiAoaXNWaXNpYmxlKSB7XHJcbiAgICAgICAgICAgICAgICBmYXN0ZG9tLm1lYXN1cmUoKCkgPT4gZWxlbWVudC5zdHlsZS5kaXNwbGF5ID09PSBcIm5vbmVcIiAmJiBmYXN0ZG9tLm11dGF0ZSgoKSA9PiBlbGVtZW50LnN0eWxlLmRpc3BsYXkgPSBcIlwiKSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBmYXN0ZG9tLm1lYXN1cmUoKCkgPT4gZWxlbWVudC5zdHlsZS5kaXNwbGF5ICE9PSBcIm5vbmVcIiAmJiBmYXN0ZG9tLm11dGF0ZSgoKSA9PiBlbGVtZW50LnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIikpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX2RlY29yYXRlKGNvdW50OiBudW1iZXIpIHtcclxuICAgICAgICBjb25zdCBsaW5lSGVpZ2h0ID0gdGhpcy5fZWRpdG9yLmdldExpbmVIZWlnaHRJblBpeGVscygpO1xyXG5cclxuICAgICAgICBjb25zdCBlbGVtZW50ID0gdGhpcy5fZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgICAgICAgZWxlbWVudC5zdHlsZS5wb3NpdGlvbiA9IFwicmVsYXRpdmVcIjtcclxuICAgICAgICBlbGVtZW50LnN0eWxlLnRvcCA9IGAtJHtsaW5lSGVpZ2h0fXB4YDtcclxuICAgICAgICBlbGVtZW50LnN0eWxlLmxlZnQgPSBcIjE2cHhcIjtcclxuICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5hZGQoXCJoaWdobGlnaHQtaW5mb1wiLCBcImJhZGdlXCIsIFwiYmFkZ2Utc21hbGxcIik7XHJcbiAgICAgICAgZWxlbWVudC50ZXh0Q29udGVudCA9IGNvdW50LnRvU3RyaW5nKCk7XHJcbiAgICAgICAgZWxlbWVudC5vbmNsaWNrID0gKCkgPT4gT21uaS5yZXF1ZXN0KHRoaXMuX2VkaXRvciwgcyA9PiBzLmZpbmR1c2FnZXMoeyBGaWxlTmFtZTogdGhpcy5fcGF0aCwgQ29sdW1uOiB0aGlzLl9tZW1iZXIuQ29sdW1uICsgMSwgTGluZTogdGhpcy5fbWVtYmVyLkxpbmUsIEJ1ZmZlcjogbnVsbCwgQ2hhbmdlczogbnVsbCB9KSk7XHJcblxyXG4gICAgICAgIC8vIFRPRE86IEJsb2NrIGRlY29yYXRpb25zXHJcbiAgICAgICAgLy8gdGhpcy5fZGVjb3JhdGlvbiA9IDxhbnk+dGhpcy5fZWRpdG9yLmRlY29yYXRlTWFya2VyKHRoaXMuX21hcmtlciwgeyB0eXBlOiBcImJsb2NrXCIsIGNsYXNzOiBgY29kZWxlbnNgLCBpdGVtOiB0aGlzLl9lbGVtZW50LCBwb3NpdGlvbjogXCJiZWZvcmVcIiB9KTtcclxuICAgICAgICB0aGlzLl9kZWNvcmF0aW9uID0gPGFueT50aGlzLl9lZGl0b3IuZGVjb3JhdGVNYXJrZXIodGhpcy5fbWFya2VyLCB7IHR5cGU6IFwib3ZlcmxheVwiLCBjbGFzczogYGNvZGVsZW5zYCwgaXRlbTogdGhpcy5fZWxlbWVudCwgcG9zaXRpb246IFwiaGVhZFwiIH0pO1xyXG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5fZWxlbWVudC5yZW1vdmUoKTtcclxuICAgICAgICAgICAgaWYgKHRoaXMuX2RlY29yYXRpb24pIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2RlY29yYXRpb24uZGVzdHJveSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuX2VsZW1lbnQgPSBudWxsO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgY29uc3QgaXNWaXNpYmxlID0gaXNMaW5lVmlzaWJsZSh0aGlzLl9lZGl0b3IsIHRoaXMuX3Jvdyk7XHJcbiAgICAgICAgaWYgKCFpc1Zpc2libGUpIHtcclxuICAgICAgICAgICAgZWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy5fZGVjb3JhdGlvbjtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGlzcG9zZSgpIHsgcmV0dXJuIHRoaXMuX2Rpc3Bvc2FibGUuZGlzcG9zZSgpOyB9XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBjb2RlTGVucyA9IG5ldyBDb2RlTGVucygpO1xyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
