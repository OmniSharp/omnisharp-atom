'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.codeLens = exports.Lens = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _rxjs = require('rxjs');

var _tsDisposables = require('ts-disposables');

var _omni = require('../server/omni');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var CodeLens = function () {
    function CodeLens() {
        _classCallCheck(this, CodeLens);

        this.required = false;
        this.title = 'Code Lens';
        this.description = 'Adds support for displaying references in the editor.';
        this.decorations = new WeakMap();
    }

    _createClass(CodeLens, [{
        key: 'activate',
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
                cd.add(atom.config.observe('editor.fontSize', function (size) {
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
                if (!items) {
                    _this.decorations.set(editor, new Set());
                }
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
                cd.add(editor.getBuffer().onDidStopChanging((0, _lodash.debounce)(function () {
                    if (!subject.closed) {
                        subject.next(true);
                    }
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
                    if ((0, _lodash.includes)(['omnisharp-atom:toggle-dock', 'omnisharp-atom:show-dock', 'omnisharp-atom:hide-dock'], event.type)) {
                        _this.updateDecoratorVisiblility(editor);
                    }
                }));
                cd.add(subject);
                _this.updateDecoratorVisiblility(editor);
            }));
        }
    }, {
        key: 'updateDecoratorVisiblility',
        value: function updateDecoratorVisiblility(editor) {
            if (!this.decorations.has(editor)) {
                this.decorations.set(editor, new Set());
            }
            var decorations = this.decorations.get(editor);
            decorations.forEach(function (decoration) {
                return decoration.updateVisible();
            });
        }
    }, {
        key: 'dispose',
        value: function dispose() {
            this.disposable.dispose();
        }
    }, {
        key: 'updateCodeLens',
        value: function updateCodeLens(editor) {
            if (!this.decorations.has(editor)) {
                this.decorations.set(editor, new Set());
            }
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
                var marker = editor.markBufferRange(range, { invalidate: 'inside' });
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
            }).do({
                complete: function complete() {
                    decorations.forEach(function (lens) {
                        if (lens && !updated.has(lens)) {
                            lens.dispose();
                        }
                    });
                }
            });
        }
    }]);

    return CodeLens;
}();

function isLineVisible(editor, line) {
    var element = atom.views.getView(editor);
    var top = element.getFirstVisibleScreenRow();
    var bottom = element.getLastVisibleScreenRow();
    if (line <= top || line >= bottom) {
        return false;
    }
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
        this.loaded = false;
        this._disposable = new _tsDisposables.CompositeDisposable();
        this._issueUpdate = (0, _lodash.debounce)(function (isVisible) {
            if (!_this2._update.closed) {
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
                return solution.findusages({
                    FileName: _this2._path,
                    Column: _this2._member.Column + 1,
                    Line: _this2._member.Line,
                    Buffer: null,
                    Changes: null
                }, { silent: true });
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
        key: 'updateVisible',
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
        key: 'updateTop',
        value: function updateTop(lineHeight) {
            if (this._element) {
                this._element.style.top = '-' + lineHeight + 'px';
            }
        }
    }, {
        key: 'invalidate',
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
        key: 'isEqual',
        value: function isEqual(marker) {
            return this._marker.isEqual(marker);
        }
    }, {
        key: 'dispose',
        value: function dispose() {
            return this._disposable.dispose();
        }
    }, {
        key: '_isVisible',
        value: function _isVisible() {
            return isLineVisible(this._editor, this._row);
        }
    }, {
        key: '_updateDecoration',
        value: function _updateDecoration(isVisible) {
            if (this._decoration && this._element) {
                var element = this._element;
                if (isVisible && element.style.display === 'none') {
                    element.style.display = '';
                } else if (element.style.display !== 'none') {
                    element.style.display = 'none';
                }
            }
        }
    }, {
        key: '_decorate',
        value: function _decorate(count) {
            var _this4 = this;

            var lineHeight = this._editor.getLineHeightInPixels();
            var element = this._element = document.createElement('div');
            element.style.position = 'relative';
            element.style.top = '-' + lineHeight + 'px';
            element.style.left = '16px';
            element.classList.add('highlight-info', 'badge', 'badge-small');
            element.textContent = count.toString();
            element.onclick = function () {
                return _omni.Omni.request(_this4._editor, function (s) {
                    return s.findusages({
                        FileName: _this4._path,
                        Column: _this4._member.Column + 1,
                        Line: _this4._member.Line,
                        Buffer: null,
                        Changes: null
                    });
                });
            };
            this._decoration = this._editor.decorateMarker(this._marker, {
                type: 'overlay',
                class: 'codelens',
                item: this._element,
                position: 'head'
            });
            this._disposable.add(_tsDisposables.Disposable.create(function () {
                _this4._element.remove();
                if (_this4._decoration) {
                    _this4._decoration.destroy();
                }
                _this4._element = null;
            }));
            var isVisible = isLineVisible(this._editor, this._row);
            if (!isVisible) {
                element.style.display = 'none';
            }
            return this._decoration;
        }
    }]);

    return Lens;
}();

var codeLens = exports.codeLens = new CodeLens();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9jb2RlLWxlbnMudHMiXSwibmFtZXMiOlsiQ29kZUxlbnMiLCJyZXF1aXJlZCIsInRpdGxlIiwiZGVzY3JpcHRpb24iLCJkZWNvcmF0aW9ucyIsIldlYWtNYXAiLCJkaXNwb3NhYmxlIiwiYWRkIiwiZWFjaEVkaXRvciIsImVkaXRvciIsImNkIiwiY3JlYXRlIiwibWFya2VycyIsImdldCIsImZvckVhY2giLCJtYXJrZXIiLCJkaXNwb3NlIiwiZGVsZXRlIiwiYXRvbSIsImNvbmZpZyIsIm9ic2VydmUiLCJzaXplIiwibGluZUhlaWdodCIsImdldExpbmVIZWlnaHRJblBpeGVscyIsImRlY29yYXRpb24iLCJ1cGRhdGVUb3AiLCJzd2l0Y2hBY3RpdmVFZGl0b3IiLCJpdGVtcyIsInNldCIsIlNldCIsInN1YmplY3QiLCJmaWx0ZXIiLCJ4IiwiaXNEZXN0cm95ZWQiLCJkaXN0aW5jdFVudGlsQ2hhbmdlZCIsImRlYm91bmNlVGltZSIsInN3aXRjaE1hcCIsInVwZGF0ZUNvZGVMZW5zIiwic3Vic2NyaWJlIiwiYmluZERpZENoYW5nZSIsImRpZENoYW5nZSIsImdldEJ1ZmZlciIsIm9uRGlkQ2hhbmdlIiwicmVtb3ZlIiwibmV4dCIsIm9uRGlkU3RvcENoYW5naW5nIiwiY2xvc2VkIiwib25EaWRTYXZlIiwib25EaWRSZWxvYWQiLCJ0aW1lciIsIm9uRGlkQ2hhbmdlU2Nyb2xsVG9wIiwidXBkYXRlRGVjb3JhdG9yVmlzaWJsaWxpdHkiLCJjb21tYW5kcyIsIm9uV2lsbERpc3BhdGNoIiwiZXZlbnQiLCJ0eXBlIiwiaGFzIiwidXBkYXRlVmlzaWJsZSIsInVwZGF0ZWQiLCJXZWFrU2V0IiwiZW1wdHkiLCJyZXF1ZXN0Iiwic29sdXRpb24iLCJjdXJyZW50ZmlsZW1lbWJlcnNhc2ZsYXQiLCJCdWZmZXIiLCJDaGFuZ2VzIiwiZmlsZU1lbWJlcnMiLCJmbGF0TWFwIiwiY29uY2F0TWFwIiwicmFuZ2UiLCJyYW5nZUZvclJvdyIsImZpbGVNZW1iZXIiLCJMaW5lIiwibWFya0J1ZmZlclJhbmdlIiwiaW52YWxpZGF0ZSIsImxlbnMiLCJpdGVyYXRlZSIsInZhbHVlcyIsImRvbmUiLCJ2YWx1ZSIsImlzRXF1YWwiLCJMZW5zIiwiZG8iLCJjb21wbGV0ZSIsImlzTGluZVZpc2libGUiLCJsaW5lIiwiZWxlbWVudCIsInZpZXdzIiwiZ2V0VmlldyIsInRvcCIsImdldEZpcnN0VmlzaWJsZVNjcmVlblJvdyIsImJvdHRvbSIsImdldExhc3RWaXNpYmxlU2NyZWVuUm93IiwiX2VkaXRvciIsIl9tZW1iZXIiLCJfbWFya2VyIiwiX3JhbmdlIiwiZGlzcG9zZXIiLCJsb2FkZWQiLCJfZGlzcG9zYWJsZSIsIl9pc3N1ZVVwZGF0ZSIsImlzVmlzaWJsZSIsIl91cGRhdGUiLCJfcm93IiwiZ2V0Um93cyIsIl9wYXRoIiwiZ2V0UGF0aCIsIl91cGRhdGVPYnNlcnZhYmxlIiwiZmluZHVzYWdlcyIsIkZpbGVOYW1lIiwiQ29sdW1uIiwic2lsZW50IiwiUXVpY2tGaXhlcyIsImxlbmd0aCIsIm1hcCIsInNoYXJlIiwidGFrZSIsIl9kZWNvcmF0ZSIsIm9uRGlkRGVzdHJveSIsIl9pc1Zpc2libGUiLCJfdXBkYXRlRGVjb3JhdGlvbiIsInJlc3VsdCIsIl9lbGVtZW50Iiwic3R5bGUiLCJzZWxmIiwidGV4dENvbnRlbnQiLCJ0b1N0cmluZyIsIl9kZWNvcmF0aW9uIiwiZGlzcGxheSIsImNvdW50IiwiZG9jdW1lbnQiLCJjcmVhdGVFbGVtZW50IiwicG9zaXRpb24iLCJsZWZ0IiwiY2xhc3NMaXN0Iiwib25jbGljayIsInMiLCJkZWNvcmF0ZU1hcmtlciIsImNsYXNzIiwiaXRlbSIsImRlc3Ryb3kiLCJjb2RlTGVucyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0FBRUE7O0FBQ0E7O0FBQ0E7Ozs7SUFTQUEsUTtBQUFBLHdCQUFBO0FBQUE7O0FBQ1csYUFBQUMsUUFBQSxHQUFXLEtBQVg7QUFDQSxhQUFBQyxLQUFBLEdBQVEsV0FBUjtBQUNBLGFBQUFD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RixDQUFhO0FBQ2RDLGtDQUFVLE9BQUtKLEtBREQ7QUFFZEssZ0NBQVEsT0FBS2hCLE9BQUwsQ0FBYWdCLE1BQWIsR0FBc0IsQ0FGaEI7QUFHZHRDLDhCQUFNLE9BQUtzQixPQUFMLENBQWF0QixJQUhMO0FBSWRSLGdDQUFRLElBSk07QUFLZEMsaUNBQVM7QUFMSyxxQkFBYixDQUFMO0FBQUEsaUJBRm9CLENBQU47QUFBQSxhQUFsQjtBQVlBLGlCQUFLOEQsV0FBTCxHQUF3QixLQUFLbEMsT0FBTCxDQUFhNEMsY0FBYixDQUE0QixLQUFLMUMsT0FBakMsRUFBMEM7QUFDOUR4QyxzQkFBTSxTQUR3RDtBQUU5RG1GLGlDQUY4RDtBQUc5REMsc0JBQU0sS0FBS2pCLFFBSG1EO0FBSTlEVSwwQkFBVTtBQUpvRCxhQUExQyxDQUF4QjtBQU1BLGlCQUFLakMsV0FBTCxDQUFpQjVGLEdBQWpCLENBQXFCLDBCQUFXSSxNQUFYLENBQWtCLFlBQUE7QUFDbkMsdUJBQUsrRyxRQUFMLENBQWMvRSxNQUFkO0FBQ0Esb0JBQUksT0FBS29GLFdBQVQsRUFBc0I7QUFDbEIsMkJBQUtBLFdBQUwsQ0FBaUJhLE9BQWpCO0FBQ0g7QUFDRCx1QkFBS2xCLFFBQUwsR0FBZ0IsSUFBaEI7QUFDSCxhQU5vQixDQUFyQjtBQVFBLGdCQUFNckIsWUFBWWpCLGNBQWMsS0FBS1MsT0FBbkIsRUFBNEIsS0FBS1UsSUFBakMsQ0FBbEI7QUFDQSxnQkFBSSxDQUFDRixTQUFMLEVBQWdCO0FBQ1pmLHdCQUFRcUMsS0FBUixDQUFjSyxPQUFkLEdBQXdCLE1BQXhCO0FBQ0g7QUFFRCxtQkFBTyxLQUFLRCxXQUFaO0FBQ0g7Ozs7OztBQUdFLElBQU1jLDhCQUFXLElBQUk3SSxRQUFKLEVBQWpCIiwiZmlsZSI6ImxpYi9mZWF0dXJlcy9jb2RlLWxlbnMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBkZWJvdW5jZSwgaW5jbHVkZXMgfSBmcm9tICdsb2Rhc2gnO1xyXG5pbXBvcnQgeyBNb2RlbHMgfSBmcm9tICdvbW5pc2hhcnAtY2xpZW50JztcclxuaW1wb3J0IHsgT2JzZXJ2YWJsZSwgU3ViamVjdCwgU3Vic2NyaXB0aW9uIH0gZnJvbSAncnhqcyc7XHJcbmltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUsIERpc3Bvc2FibGUsIElEaXNwb3NhYmxlIH0gZnJvbSAndHMtZGlzcG9zYWJsZXMnO1xyXG5pbXBvcnQgeyBPbW5pIH0gZnJvbSAnLi4vc2VydmVyL29tbmknO1xyXG5cclxuaW50ZXJmYWNlIElEZWNvcmF0aW9uIHtcclxuICAgIGRlc3Ryb3koKTogYW55O1xyXG4gICAgZ2V0TWFya2VyKCk6IEF0b20uTWFya2VyO1xyXG4gICAgZ2V0UHJvcGVydGllcygpOiBhbnk7XHJcbiAgICBzZXRQcm9wZXJ0aWVzKHByb3BzOiBhbnkpOiBhbnk7XHJcbn1cclxuXHJcbmNsYXNzIENvZGVMZW5zIGltcGxlbWVudHMgSUZlYXR1cmUge1xyXG4gICAgcHVibGljIHJlcXVpcmVkID0gZmFsc2U7XHJcbiAgICBwdWJsaWMgdGl0bGUgPSAnQ29kZSBMZW5zJztcclxuICAgIHB1YmxpYyBkZXNjcmlwdGlvbiA9ICdBZGRzIHN1cHBvcnQgZm9yIGRpc3BsYXlpbmcgcmVmZXJlbmNlcyBpbiB0aGUgZWRpdG9yLic7XHJcblxyXG4gICAgcHJpdmF0ZSBkaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xyXG4gICAgcHJpdmF0ZSBkZWNvcmF0aW9ucyA9IG5ldyBXZWFrTWFwPEF0b20uVGV4dEVkaXRvciwgU2V0PExlbnM+PigpO1xyXG5cclxuICAgIHB1YmxpYyBhY3RpdmF0ZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuZWFjaEVkaXRvcigoZWRpdG9yLCBjZCkgPT4ge1xyXG4gICAgICAgICAgICBjZC5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgbWFya2VycyA9IHRoaXMuZGVjb3JhdGlvbnMuZ2V0KGVkaXRvcik7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKG1hcmtlcnMpIHtcclxuICAgICAgICAgICAgICAgICAgICBtYXJrZXJzLmZvckVhY2gobWFya2VyID0+IG1hcmtlci5kaXNwb3NlKCkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMuZGVjb3JhdGlvbnMuZGVsZXRlKGVkaXRvcik7XHJcbiAgICAgICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgICAgIGNkLmFkZChhdG9tLmNvbmZpZy5vYnNlcnZlKCdlZGl0b3IuZm9udFNpemUnLCAoc2l6ZTogbnVtYmVyKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBkZWNvcmF0aW9ucyA9IHRoaXMuZGVjb3JhdGlvbnMuZ2V0KGVkaXRvcik7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBsaW5lSGVpZ2h0ID0gZWRpdG9yLmdldExpbmVIZWlnaHRJblBpeGVscygpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGRlY29yYXRpb25zICYmIGxpbmVIZWlnaHQpIHtcclxuICAgICAgICAgICAgICAgICAgICBkZWNvcmF0aW9ucy5mb3JFYWNoKGRlY29yYXRpb24gPT4gZGVjb3JhdGlvbi51cGRhdGVUb3AobGluZUhlaWdodCkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KSk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuc3dpdGNoQWN0aXZlRWRpdG9yKChlZGl0b3IsIGNkKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IGl0ZW1zID0gdGhpcy5kZWNvcmF0aW9ucy5nZXQoZWRpdG9yKTtcclxuICAgICAgICAgICAgaWYgKCFpdGVtcykgeyB0aGlzLmRlY29yYXRpb25zLnNldChlZGl0b3IsIG5ldyBTZXQ8TGVucz4oKSk7IH1cclxuXHJcbiAgICAgICAgICAgIGNvbnN0IHN1YmplY3QgPSBuZXcgU3ViamVjdDxib29sZWFuPigpO1xyXG5cclxuICAgICAgICAgICAgY2QuYWRkKHN1YmplY3RcclxuICAgICAgICAgICAgICAgIC5maWx0ZXIoeCA9PiAhIXggJiYgIWVkaXRvci5pc0Rlc3Ryb3llZCgpKVxyXG4gICAgICAgICAgICAgICAgLmRpc3RpbmN0VW50aWxDaGFuZ2VkKHggPT4gISF4KVxyXG4gICAgICAgICAgICAgICAgLmRlYm91bmNlVGltZSg1MDApXHJcbiAgICAgICAgICAgICAgICAuc3dpdGNoTWFwKCgpID0+IHRoaXMudXBkYXRlQ29kZUxlbnMoZWRpdG9yKSlcclxuICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoKVxyXG4gICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgYmluZERpZENoYW5nZSA9ICgpID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGRpZENoYW5nZSA9IGVkaXRvci5nZXRCdWZmZXIoKS5vbkRpZENoYW5nZSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgZGlkQ2hhbmdlLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgICAgICAgICBjZC5yZW1vdmUoZGlkQ2hhbmdlKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgc3ViamVjdC5uZXh0KGZhbHNlKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGNkLmFkZChkaWRDaGFuZ2UpO1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgY2QuYWRkKGVkaXRvci5nZXRCdWZmZXIoKS5vbkRpZFN0b3BDaGFuZ2luZyhkZWJvdW5jZSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXN1YmplY3QuY2xvc2VkKSB7IHN1YmplY3QubmV4dCh0cnVlKTsgfVxyXG4gICAgICAgICAgICAgICAgYmluZERpZENoYW5nZSgpO1xyXG4gICAgICAgICAgICB9LCA1MDAwKSkpO1xyXG5cclxuICAgICAgICAgICAgY2QuYWRkKGVkaXRvci5nZXRCdWZmZXIoKS5vbkRpZFNhdmUoKCkgPT4gc3ViamVjdC5uZXh0KHRydWUpKSk7XHJcbiAgICAgICAgICAgIGNkLmFkZChlZGl0b3IuZ2V0QnVmZmVyKCkub25EaWRSZWxvYWQoKCkgPT4gc3ViamVjdC5uZXh0KHRydWUpKSk7XHJcbiAgICAgICAgICAgIGNkLmFkZChPYnNlcnZhYmxlLnRpbWVyKDEwMDApLnN1YnNjcmliZSgoKSA9PiBzdWJqZWN0Lm5leHQodHJ1ZSkpKTtcclxuXHJcbiAgICAgICAgICAgIGNkLmFkZChlZGl0b3Iub25EaWRDaGFuZ2VTY3JvbGxUb3AoKCkgPT4gdGhpcy51cGRhdGVEZWNvcmF0b3JWaXNpYmxpbGl0eShlZGl0b3IpKSk7XHJcblxyXG4gICAgICAgICAgICBjZC5hZGQoYXRvbS5jb21tYW5kcy5vbldpbGxEaXNwYXRjaCgoZXZlbnQ6IEV2ZW50KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoaW5jbHVkZXMoWydvbW5pc2hhcnAtYXRvbTp0b2dnbGUtZG9jaycsICdvbW5pc2hhcnAtYXRvbTpzaG93LWRvY2snLCAnb21uaXNoYXJwLWF0b206aGlkZS1kb2NrJ10sIGV2ZW50LnR5cGUpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy51cGRhdGVEZWNvcmF0b3JWaXNpYmxpbGl0eShlZGl0b3IpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgICAgICBjZC5hZGQoc3ViamVjdCk7XHJcbiAgICAgICAgICAgIHRoaXMudXBkYXRlRGVjb3JhdG9yVmlzaWJsaWxpdHkoZWRpdG9yKTtcclxuICAgICAgICB9KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHVwZGF0ZURlY29yYXRvclZpc2libGlsaXR5KGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLmRlY29yYXRpb25zLmhhcyhlZGl0b3IpKSB7IHRoaXMuZGVjb3JhdGlvbnMuc2V0KGVkaXRvciwgbmV3IFNldDxMZW5zPigpKTsgfVxyXG4gICAgICAgIGNvbnN0IGRlY29yYXRpb25zID0gdGhpcy5kZWNvcmF0aW9ucy5nZXQoZWRpdG9yKTtcclxuICAgICAgICBkZWNvcmF0aW9ucy5mb3JFYWNoKGRlY29yYXRpb24gPT4gZGVjb3JhdGlvbi51cGRhdGVWaXNpYmxlKCkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkaXNwb3NlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHVwZGF0ZUNvZGVMZW5zKGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLmRlY29yYXRpb25zLmhhcyhlZGl0b3IpKSB7IHRoaXMuZGVjb3JhdGlvbnMuc2V0KGVkaXRvciwgbmV3IFNldDxMZW5zPigpKTsgfVxyXG4gICAgICAgIGNvbnN0IGRlY29yYXRpb25zID0gdGhpcy5kZWNvcmF0aW9ucy5nZXQoZWRpdG9yKTtcclxuXHJcbiAgICAgICAgY29uc3QgdXBkYXRlZCA9IG5ldyBXZWFrU2V0PExlbnM+KCk7XHJcblxyXG4gICAgICAgIGlmIChlZGl0b3IuaXNEZXN0cm95ZWQoKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5lbXB0eTxudW1iZXI+KCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gT21uaS5yZXF1ZXN0KGVkaXRvciwgc29sdXRpb24gPT4gc29sdXRpb24uY3VycmVudGZpbGVtZW1iZXJzYXNmbGF0KHsgQnVmZmVyOiBudWxsLCBDaGFuZ2VzOiBudWxsIH0pKVxyXG4gICAgICAgICAgICAuZmlsdGVyKGZpbGVNZW1iZXJzID0+ICEhZmlsZU1lbWJlcnMpXHJcbiAgICAgICAgICAgIC5mbGF0TWFwKGZpbGVNZW1iZXJzID0+IGZpbGVNZW1iZXJzKVxyXG4gICAgICAgICAgICAuY29uY2F0TWFwKGZpbGVNZW1iZXIgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcmFuZ2U6IFRleHRCdWZmZXIuUmFuZ2UgPSA8YW55PmVkaXRvci5nZXRCdWZmZXIoKS5yYW5nZUZvclJvdyhmaWxlTWVtYmVyLkxpbmUsIGZhbHNlKTtcclxuICAgICAgICAgICAgICAgIC8vIFRPRE86IEJsb2NrIGRlY29yYXRpb25zXHJcbiAgICAgICAgICAgICAgICAvLyBjb25zdCBtYXJrZXI6IEF0b20uTWFya2VyID0gKDxhbnk+ZWRpdG9yKS5tYXJrU2NyZWVuUG9zaXRpb24oW2ZpbGVNZW1iZXIuTGluZSwgMF0pO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgbWFya2VyOiBBdG9tLk1hcmtlciA9ICg8YW55PmVkaXRvcikubWFya0J1ZmZlclJhbmdlKHJhbmdlLCB7IGludmFsaWRhdGU6ICdpbnNpZGUnIH0pO1xyXG4gICAgICAgICAgICAgICAgbGV0IGxlbnM6IExlbnM7XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc3QgaXRlcmF0ZWUgPSBkZWNvcmF0aW9ucy52YWx1ZXMoKTtcclxuICAgICAgICAgICAgICAgIGxldCBkZWNvcmF0aW9uID0gaXRlcmF0ZWUubmV4dCgpO1xyXG4gICAgICAgICAgICAgICAgd2hpbGUgKCFkZWNvcmF0aW9uLmRvbmUpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZGVjb3JhdGlvbi52YWx1ZS5pc0VxdWFsKG1hcmtlcikpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGVucyA9IGRlY29yYXRpb24udmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBkZWNvcmF0aW9uID0gaXRlcmF0ZWUubmV4dCgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChsZW5zKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdXBkYXRlZC5hZGQobGVucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgbGVucy5pbnZhbGlkYXRlKCk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGxlbnMgPSBuZXcgTGVucyhlZGl0b3IsIGZpbGVNZW1iZXIsIG1hcmtlciwgcmFuZ2UsIERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGVjb3JhdGlvbnMuZGVsZXRlKGxlbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pKTtcclxuICAgICAgICAgICAgICAgICAgICB1cGRhdGVkLmFkZChsZW5zKTtcclxuICAgICAgICAgICAgICAgICAgICBkZWNvcmF0aW9ucy5hZGQobGVucyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGxlbnMudXBkYXRlVmlzaWJsZSgpO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAuZG8oe1xyXG4gICAgICAgICAgICAgICAgY29tcGxldGU6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBSZW1vdmUgYWxsIG9sZC9taXNzaW5nIGRlY29yYXRpb25zXHJcbiAgICAgICAgICAgICAgICAgICAgZGVjb3JhdGlvbnMuZm9yRWFjaChsZW5zID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGxlbnMgJiYgIXVwZGF0ZWQuaGFzKGxlbnMpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZW5zLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gaXNMaW5lVmlzaWJsZShlZGl0b3I6IEF0b20uVGV4dEVkaXRvciwgbGluZTogbnVtYmVyKSB7XHJcbiAgICBjb25zdCBlbGVtZW50OiBhbnkgPSBhdG9tLnZpZXdzLmdldFZpZXcoZWRpdG9yKTtcclxuICAgIGNvbnN0IHRvcCA9IGVsZW1lbnQuZ2V0Rmlyc3RWaXNpYmxlU2NyZWVuUm93KCk7XHJcbiAgICBjb25zdCBib3R0b20gPSBlbGVtZW50LmdldExhc3RWaXNpYmxlU2NyZWVuUm93KCk7XHJcblxyXG4gICAgaWYgKGxpbmUgPD0gdG9wIHx8IGxpbmUgPj0gYm90dG9tKSB7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRydWU7XHJcbn1cclxuXHJcbi8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTptYXgtY2xhc3Nlcy1wZXItZmlsZVxyXG5leHBvcnQgY2xhc3MgTGVucyBpbXBsZW1lbnRzIElEaXNwb3NhYmxlIHtcclxuICAgIHB1YmxpYyBsb2FkZWQ6IGJvb2xlYW4gPSBmYWxzZTtcclxuXHJcbiAgICBwcml2YXRlIF91cGRhdGU6IFN1YmplY3Q8Ym9vbGVhbj47XHJcbiAgICBwcml2YXRlIF9yb3c6IG51bWJlcjtcclxuICAgIHByaXZhdGUgX2RlY29yYXRpb246IElEZWNvcmF0aW9uO1xyXG4gICAgcHJpdmF0ZSBfZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcbiAgICBwcml2YXRlIF9lbGVtZW50OiBIVE1MRGl2RWxlbWVudDtcclxuICAgIHByaXZhdGUgX3VwZGF0ZU9ic2VydmFibGU6IE9ic2VydmFibGU8bnVtYmVyPjtcclxuICAgIHByaXZhdGUgX3BhdGg6IHN0cmluZztcclxuXHJcbiAgICBwcml2YXRlIF9pc3N1ZVVwZGF0ZSA9IGRlYm91bmNlKChpc1Zpc2libGU6IGJvb2xlYW4pID0+IHtcclxuICAgICAgICBpZiAoIXRoaXMuX3VwZGF0ZS5jbG9zZWQpIHtcclxuICAgICAgICAgICAgdGhpcy5fdXBkYXRlLm5leHQoaXNWaXNpYmxlKTtcclxuICAgICAgICB9XHJcbiAgICB9LCAyNTApO1xyXG5cclxuICAgIHB1YmxpYyBjb25zdHJ1Y3RvcihcclxuICAgICAgICBwcml2YXRlIF9lZGl0b3I6IEF0b20uVGV4dEVkaXRvcixcclxuICAgICAgICBwcml2YXRlIF9tZW1iZXI6IE1vZGVscy5RdWlja0ZpeCxcclxuICAgICAgICBwcml2YXRlIF9tYXJrZXI6IEF0b20uTWFya2VyLFxyXG4gICAgICAgIHByaXZhdGUgX3JhbmdlOiBUZXh0QnVmZmVyLlJhbmdlLFxyXG4gICAgICAgIGRpc3Bvc2VyOiBJRGlzcG9zYWJsZSkge1xyXG4gICAgICAgIHRoaXMuX3JvdyA9IF9yYW5nZS5nZXRSb3dzKClbMF07XHJcbiAgICAgICAgdGhpcy5fdXBkYXRlID0gbmV3IFN1YmplY3Q8YW55PigpO1xyXG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKHRoaXMuX3VwZGF0ZSk7XHJcbiAgICAgICAgdGhpcy5fcGF0aCA9IF9lZGl0b3IuZ2V0UGF0aCgpO1xyXG5cclxuICAgICAgICB0aGlzLl91cGRhdGVPYnNlcnZhYmxlID0gdGhpcy5fdXBkYXRlXHJcbiAgICAgICAgICAgIC5maWx0ZXIoeCA9PiAhIXgpXHJcbiAgICAgICAgICAgIC5mbGF0TWFwKCgpID0+IE9tbmkucmVxdWVzdCh0aGlzLl9lZGl0b3IsIHNvbHV0aW9uID0+XHJcbiAgICAgICAgICAgICAgICBzb2x1dGlvbi5maW5kdXNhZ2VzKHtcclxuICAgICAgICAgICAgICAgICAgICBGaWxlTmFtZTogdGhpcy5fcGF0aCxcclxuICAgICAgICAgICAgICAgICAgICBDb2x1bW46IHRoaXMuX21lbWJlci5Db2x1bW4gKyAxLFxyXG4gICAgICAgICAgICAgICAgICAgIExpbmU6IHRoaXMuX21lbWJlci5MaW5lLFxyXG4gICAgICAgICAgICAgICAgICAgIEJ1ZmZlcjogbnVsbCxcclxuICAgICAgICAgICAgICAgICAgICBDaGFuZ2VzOiBudWxsXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHsgc2lsZW50OiB0cnVlIH0pKVxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgICAgIC5maWx0ZXIoeCA9PiB4ICYmIHguUXVpY2tGaXhlcyAmJiAhIXguUXVpY2tGaXhlcy5sZW5ndGgpXHJcbiAgICAgICAgICAgIC5tYXAoeCA9PiB4ICYmIHguUXVpY2tGaXhlcyAmJiB4LlF1aWNrRml4ZXMubGVuZ3RoIC0gMSlcclxuICAgICAgICAgICAgLnNoYXJlKCk7XHJcblxyXG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKHRoaXMuX3VwZGF0ZU9ic2VydmFibGVcclxuICAgICAgICAgICAgLnRha2UoMSlcclxuICAgICAgICAgICAgLmZpbHRlcih4ID0+IHggPiAwKVxyXG4gICAgICAgICAgICAuZG8oKCkgPT4gdGhpcy5sb2FkZWQgPSB0cnVlKVxyXG4gICAgICAgICAgICAuc3Vic2NyaWJlKHggPT4gdGhpcy5fZGVjb3JhdGUoeCkpKTtcclxuXHJcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoZGlzcG9zZXIpO1xyXG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKHRoaXMuX21hcmtlci5vbkRpZERlc3Ryb3koKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLmRpc3Bvc2UoKTtcclxuICAgICAgICB9KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHVwZGF0ZVZpc2libGUoKSB7XHJcbiAgICAgICAgY29uc3QgaXNWaXNpYmxlID0gdGhpcy5faXNWaXNpYmxlKCk7XHJcbiAgICAgICAgdGhpcy5fdXBkYXRlRGVjb3JhdGlvbihpc1Zpc2libGUpO1xyXG5cclxuICAgICAgICBsZXQgcmVzdWx0OiBPYnNlcnZhYmxlPG51bWJlcj47XHJcbiAgICAgICAgaWYgKGlzVmlzaWJsZSkge1xyXG4gICAgICAgICAgICByZXN1bHQgPSB0aGlzLl91cGRhdGVPYnNlcnZhYmxlLnRha2UoMSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmVzdWx0ID0gT2JzZXJ2YWJsZS5lbXB0eTxudW1iZXI+KCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLl9pc3N1ZVVwZGF0ZShpc1Zpc2libGUpO1xyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHVwZGF0ZVRvcChsaW5lSGVpZ2h0OiBudW1iZXIpIHtcclxuICAgICAgICBpZiAodGhpcy5fZWxlbWVudCkge1xyXG4gICAgICAgICAgICB0aGlzLl9lbGVtZW50LnN0eWxlLnRvcCA9IGAtJHtsaW5lSGVpZ2h0fXB4YDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGludmFsaWRhdGUoKSB7XHJcbiAgICAgICAgY29uc3Qgc2VsZjogU3Vic2NyaXB0aW9uID0gdGhpcy5fdXBkYXRlT2JzZXJ2YWJsZVxyXG4gICAgICAgICAgICAudGFrZSgxKVxyXG4gICAgICAgICAgICAuZG8oKCkgPT4gdGhpcy5fZGlzcG9zYWJsZS5yZW1vdmUoc2VsZikpXHJcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoeCA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoeCA8PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9lbGVtZW50KSB7ICh0aGlzLl9lbGVtZW50LnRleHRDb250ZW50ID0geC50b1N0cmluZygpKTsgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChzZWxmKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgaXNFcXVhbChtYXJrZXI6IEF0b20uTWFya2VyKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX21hcmtlci5pc0VxdWFsKDxhbnk+bWFya2VyKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGlzcG9zZSgpIHsgcmV0dXJuIHRoaXMuX2Rpc3Bvc2FibGUuZGlzcG9zZSgpOyB9XHJcblxyXG4gICAgcHJpdmF0ZSBfaXNWaXNpYmxlKCkge1xyXG4gICAgICAgIHJldHVybiBpc0xpbmVWaXNpYmxlKHRoaXMuX2VkaXRvciwgdGhpcy5fcm93KTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF91cGRhdGVEZWNvcmF0aW9uKGlzVmlzaWJsZTogYm9vbGVhbikge1xyXG4gICAgICAgIGlmICh0aGlzLl9kZWNvcmF0aW9uICYmIHRoaXMuX2VsZW1lbnQpIHtcclxuICAgICAgICAgICAgY29uc3QgZWxlbWVudCA9IHRoaXMuX2VsZW1lbnQ7XHJcbiAgICAgICAgICAgIGlmIChpc1Zpc2libGUgJiYgZWxlbWVudC5zdHlsZS5kaXNwbGF5ID09PSAnbm9uZScpIHtcclxuICAgICAgICAgICAgICAgIGVsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICcnO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGVsZW1lbnQuc3R5bGUuZGlzcGxheSAhPT0gJ25vbmUnKSB7XHJcbiAgICAgICAgICAgICAgICBlbGVtZW50LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfZGVjb3JhdGUoY291bnQ6IG51bWJlcikge1xyXG4gICAgICAgIGNvbnN0IGxpbmVIZWlnaHQgPSB0aGlzLl9lZGl0b3IuZ2V0TGluZUhlaWdodEluUGl4ZWxzKCk7XHJcblxyXG4gICAgICAgIGNvbnN0IGVsZW1lbnQgPSB0aGlzLl9lbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICAgICAgZWxlbWVudC5zdHlsZS5wb3NpdGlvbiA9ICdyZWxhdGl2ZSc7XHJcbiAgICAgICAgZWxlbWVudC5zdHlsZS50b3AgPSBgLSR7bGluZUhlaWdodH1weGA7XHJcbiAgICAgICAgZWxlbWVudC5zdHlsZS5sZWZ0ID0gJzE2cHgnO1xyXG4gICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZCgnaGlnaGxpZ2h0LWluZm8nLCAnYmFkZ2UnLCAnYmFkZ2Utc21hbGwnKTtcclxuICAgICAgICBlbGVtZW50LnRleHRDb250ZW50ID0gY291bnQudG9TdHJpbmcoKTtcclxuICAgICAgICBlbGVtZW50Lm9uY2xpY2sgPSAoKSA9PiBPbW5pLnJlcXVlc3QoXHJcbiAgICAgICAgICAgIHRoaXMuX2VkaXRvcixcclxuICAgICAgICAgICAgcyA9PiBzLmZpbmR1c2FnZXMoe1xyXG4gICAgICAgICAgICAgICAgRmlsZU5hbWU6IHRoaXMuX3BhdGgsXHJcbiAgICAgICAgICAgICAgICBDb2x1bW46IHRoaXMuX21lbWJlci5Db2x1bW4gKyAxLFxyXG4gICAgICAgICAgICAgICAgTGluZTogdGhpcy5fbWVtYmVyLkxpbmUsXHJcbiAgICAgICAgICAgICAgICBCdWZmZXI6IG51bGwsXHJcbiAgICAgICAgICAgICAgICBDaGFuZ2VzOiBudWxsXHJcbiAgICAgICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgLy8gVE9ETzogQmxvY2sgZGVjb3JhdGlvbnNcclxuICAgICAgICAvLyB0aGlzLl9kZWNvcmF0aW9uID0gPGFueT50aGlzLl9lZGl0b3IuZGVjb3JhdGVNYXJrZXIodGhpcy5fbWFya2VyLCB7IHR5cGU6IFwiYmxvY2tcIiwgY2xhc3M6IGBjb2RlbGVuc2AsIGl0ZW06IHRoaXMuX2VsZW1lbnQsIHBvc2l0aW9uOiBcImJlZm9yZVwiIH0pO1xyXG4gICAgICAgIHRoaXMuX2RlY29yYXRpb24gPSA8YW55PnRoaXMuX2VkaXRvci5kZWNvcmF0ZU1hcmtlcih0aGlzLl9tYXJrZXIsIHtcclxuICAgICAgICAgICAgdHlwZTogJ292ZXJsYXknLFxyXG4gICAgICAgICAgICBjbGFzczogYGNvZGVsZW5zYCxcclxuICAgICAgICAgICAgaXRlbTogdGhpcy5fZWxlbWVudCxcclxuICAgICAgICAgICAgcG9zaXRpb246ICdoZWFkJ1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5fZWxlbWVudC5yZW1vdmUoKTtcclxuICAgICAgICAgICAgaWYgKHRoaXMuX2RlY29yYXRpb24pIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2RlY29yYXRpb24uZGVzdHJveSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuX2VsZW1lbnQgPSBudWxsO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgY29uc3QgaXNWaXNpYmxlID0gaXNMaW5lVmlzaWJsZSh0aGlzLl9lZGl0b3IsIHRoaXMuX3Jvdyk7XHJcbiAgICAgICAgaWYgKCFpc1Zpc2libGUpIHtcclxuICAgICAgICAgICAgZWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2RlY29yYXRpb247XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBjb2RlTGVucyA9IG5ldyBDb2RlTGVucygpO1xyXG4iXX0=
