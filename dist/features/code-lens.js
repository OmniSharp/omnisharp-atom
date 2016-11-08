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
                    if (!subject.isStopped) subject.next(true);
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
            if (!_this2._update.isStopped) {
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9jb2RlLWxlbnMuanMiLCJsaWIvZmVhdHVyZXMvY29kZS1sZW5zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOzs7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7OztBQ0dBLElBQUksVUFBMEIsUUFBUSxTQUFSLENBQTFCOztJQVNKO0FBQUEsd0JBQUE7OztBQUVZLGFBQUEsV0FBQSxHQUFjLElBQUksT0FBSixFQUFkLENBRlo7QUF5SVcsYUFBQSxRQUFBLEdBQVcsS0FBWCxDQXpJWDtBQTBJVyxhQUFBLEtBQUEsR0FBUSxXQUFSLENBMUlYO0FBMklXLGFBQUEsV0FBQSxHQUFjLHVEQUFkLENBM0lYO0tBQUE7Ozs7bUNBSW1COzs7QUFDWCxpQkFBSyxVQUFMLEdBQWtCLHdDQUFsQixDQURXO0FBR1gsaUJBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQixXQUFLLFVBQUwsQ0FBZ0IsVUFBQyxNQUFELEVBQVMsRUFBVCxFQUFXO0FBQzNDLG1CQUFHLEdBQUgsQ0FBTywwQkFBVyxNQUFYLENBQWtCLFlBQUE7QUFDckIsd0JBQU0sVUFBVSxNQUFLLFdBQUwsQ0FBaUIsR0FBakIsQ0FBcUIsTUFBckIsQ0FBVixDQURlO0FBR3JCLHdCQUFJLE9BQUosRUFBYTtBQUNULGdDQUFRLE9BQVIsQ0FBZ0I7bUNBQVUsT0FBTyxPQUFQO3lCQUFWLENBQWhCLENBRFM7cUJBQWI7QUFJQSwwQkFBSyxXQUFMLENBQWlCLE1BQWpCLENBQXdCLE1BQXhCLEVBUHFCO2lCQUFBLENBQXpCLEVBRDJDO0FBVzNDLG1CQUFHLEdBQUgsQ0FBTyxLQUFLLE1BQUwsQ0FBWSxPQUFaLENBQW9CLGlCQUFwQixFQUF1QyxVQUFDLElBQUQsRUFBYTtBQUN2RCx3QkFBTSxjQUFjLE1BQUssV0FBTCxDQUFpQixHQUFqQixDQUFxQixNQUFyQixDQUFkLENBRGlEO0FBRXZELHdCQUFNLGFBQWEsT0FBTyxxQkFBUCxFQUFiLENBRmlEO0FBR3ZELHdCQUFJLGVBQWUsVUFBZixFQUEyQjtBQUMzQixvQ0FBWSxPQUFaLENBQW9CO21DQUFjLFdBQVcsU0FBWCxDQUFxQixVQUFyQjt5QkFBZCxDQUFwQixDQUQyQjtxQkFBL0I7aUJBSDBDLENBQTlDLEVBWDJDO2FBQVgsQ0FBcEMsRUFIVztBQXVCWCxpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLFdBQUssa0JBQUwsQ0FBd0IsVUFBQyxNQUFELEVBQVMsRUFBVCxFQUFXO0FBQ25ELG9CQUFNLFFBQVEsTUFBSyxXQUFMLENBQWlCLEdBQWpCLENBQXFCLE1BQXJCLENBQVIsQ0FENkM7QUFFbkQsb0JBQUksQ0FBQyxLQUFELEVBQVEsTUFBSyxXQUFMLENBQWlCLEdBQWpCLENBQXFCLE1BQXJCLEVBQTZCLElBQUksR0FBSixFQUE3QixFQUFaO0FBRUEsb0JBQU0sVUFBVSxtQkFBVixDQUo2QztBQU1uRCxtQkFBRyxHQUFILENBQU8sUUFDRixNQURFLENBQ0s7MkJBQUssQ0FBQyxDQUFDLENBQUQsSUFBTSxDQUFDLE9BQU8sV0FBUCxFQUFEO2lCQUFaLENBREwsQ0FFRixvQkFGRSxDQUVtQjsyQkFBSyxDQUFDLENBQUMsQ0FBRDtpQkFBTixDQUZuQixDQUdGLFlBSEUsQ0FHVyxHQUhYLEVBSUYsU0FKRSxDQUlROzJCQUFNLE1BQUssY0FBTCxDQUFvQixNQUFwQjtpQkFBTixDQUpSLENBS0YsU0FMRSxFQUFQLEVBTm1EO0FBY25ELG9CQUFNLGdCQUFnQixTQUFoQixhQUFnQixHQUFBO0FBQ2xCLHdCQUFNLFlBQVksT0FBTyxTQUFQLEdBQW1CLFdBQW5CLENBQStCLFlBQUE7QUFDN0Msa0NBQVUsT0FBVixHQUQ2QztBQUU3QywyQkFBRyxNQUFILENBQVUsU0FBVixFQUY2QztBQUk3QyxnQ0FBUSxJQUFSLENBQWEsS0FBYixFQUo2QztxQkFBQSxDQUEzQyxDQURZO0FBUWxCLHVCQUFHLEdBQUgsQ0FBTyxTQUFQLEVBUmtCO2lCQUFBLENBZDZCO0FBeUJuRCxtQkFBRyxHQUFILENBQU8sT0FBTyxTQUFQLEdBQW1CLGlCQUFuQixDQUFxQyxpQkFBRSxRQUFGLENBQVcsWUFBQTtBQUNuRCx3QkFBSSxDQUFDLFFBQVEsU0FBUixFQUFtQixRQUFRLElBQVIsQ0FBYSxJQUFiLEVBQXhCO0FBQ0Esb0NBRm1EO2lCQUFBLEVBR3BELElBSHlDLENBQXJDLENBQVAsRUF6Qm1EO0FBOEJuRCxtQkFBRyxHQUFILENBQU8sT0FBTyxTQUFQLEdBQW1CLFNBQW5CLENBQTZCOzJCQUFNLFFBQVEsSUFBUixDQUFhLElBQWI7aUJBQU4sQ0FBcEMsRUE5Qm1EO0FBK0JuRCxtQkFBRyxHQUFILENBQU8sT0FBTyxTQUFQLEdBQW1CLFdBQW5CLENBQStCOzJCQUFNLFFBQVEsSUFBUixDQUFhLElBQWI7aUJBQU4sQ0FBdEMsRUEvQm1EO0FBZ0NuRCxtQkFBRyxHQUFILENBQU8saUJBQVcsS0FBWCxDQUFpQixJQUFqQixFQUF1QixTQUF2QixDQUFpQzsyQkFBTSxRQUFRLElBQVIsQ0FBYSxJQUFiO2lCQUFOLENBQXhDLEVBaENtRDtBQWtDbkQsbUJBQUcsR0FBSCxDQUFPLE9BQU8sb0JBQVAsQ0FBNEI7MkJBQU0sTUFBSywwQkFBTCxDQUFnQyxNQUFoQztpQkFBTixDQUFuQyxFQWxDbUQ7QUFvQ25ELG1CQUFHLEdBQUgsQ0FBTyxLQUFLLFFBQUwsQ0FBYyxjQUFkLENBQTZCLFVBQUMsS0FBRCxFQUFhO0FBQzdDLHdCQUFJLGlCQUFFLFFBQUYsQ0FBVyxDQUFDLDRCQUFELEVBQStCLDBCQUEvQixFQUEyRCwwQkFBM0QsQ0FBWCxFQUFtRyxNQUFNLElBQU4sQ0FBdkcsRUFBb0g7QUFDaEgsOEJBQUssMEJBQUwsQ0FBZ0MsTUFBaEMsRUFEZ0g7cUJBQXBIO2lCQURnQyxDQUFwQyxFQXBDbUQ7QUEwQ25ELG1CQUFHLEdBQUgsQ0FBTyxPQUFQLEVBMUNtRDtBQTJDbkQsc0JBQUssMEJBQUwsQ0FBZ0MsTUFBaEMsRUEzQ21EO2FBQVgsQ0FBNUMsRUF2Qlc7Ozs7bURBc0VtQixRQUF1QjtBQUNyRCxnQkFBSSxDQUFDLEtBQUssV0FBTCxDQUFpQixHQUFqQixDQUFxQixNQUFyQixDQUFELEVBQStCLEtBQUssV0FBTCxDQUFpQixHQUFqQixDQUFxQixNQUFyQixFQUE2QixJQUFJLEdBQUosRUFBN0IsRUFBbkM7QUFDQSxnQkFBTSxjQUFjLEtBQUssV0FBTCxDQUFpQixHQUFqQixDQUFxQixNQUFyQixDQUFkLENBRitDO0FBR3JELHdCQUFZLE9BQVosQ0FBb0I7dUJBQWMsV0FBVyxhQUFYO2FBQWQsQ0FBcEIsQ0FIcUQ7Ozs7a0NBTTNDO0FBQ1YsaUJBQUssVUFBTCxDQUFnQixPQUFoQixHQURVOzs7O3VDQUlRLFFBQXVCO0FBQ3pDLGdCQUFJLENBQUMsS0FBSyxXQUFMLENBQWlCLEdBQWpCLENBQXFCLE1BQXJCLENBQUQsRUFBK0IsS0FBSyxXQUFMLENBQWlCLEdBQWpCLENBQXFCLE1BQXJCLEVBQTZCLElBQUksR0FBSixFQUE3QixFQUFuQztBQUNBLGdCQUFNLGNBQWMsS0FBSyxXQUFMLENBQWlCLEdBQWpCLENBQXFCLE1BQXJCLENBQWQsQ0FGbUM7QUFJekMsZ0JBQU0sVUFBVSxJQUFJLE9BQUosRUFBVixDQUptQztBQU16QyxnQkFBSSxPQUFPLFdBQVAsRUFBSixFQUEwQjtBQUN0Qix1QkFBTyxpQkFBVyxLQUFYLEVBQVAsQ0FEc0I7YUFBMUI7QUFJQSxtQkFBTyxXQUFLLE9BQUwsQ0FBYSxNQUFiLEVBQXFCO3VCQUFZLFNBQVMsd0JBQVQsQ0FBa0MsRUFBRSxRQUFRLElBQVIsRUFBYyxTQUFTLElBQVQsRUFBbEQ7YUFBWixDQUFyQixDQUNGLE1BREUsQ0FDSzt1QkFBZSxDQUFDLENBQUMsV0FBRDthQUFoQixDQURMLENBRUYsT0FGRSxDQUVNO3VCQUFlO2FBQWYsQ0FGTixDQUdGLFNBSEUsQ0FHUSxzQkFBVTtBQUNqQixvQkFBTSxRQUErQixPQUFPLFNBQVAsR0FBbUIsV0FBbkIsQ0FBK0IsV0FBVyxJQUFYLEVBQWlCLEtBQWhELENBQS9CLENBRFc7QUFJakIsb0JBQU0sU0FBNEIsT0FBUSxlQUFSLENBQXdCLEtBQXhCLEVBQStCLEVBQUUsWUFBWSxRQUFaLEVBQWpDLENBQTVCLENBSlc7QUFLakIsb0JBQUksYUFBSixDQUxpQjtBQU9qQixvQkFBTSxXQUFXLFlBQVksTUFBWixFQUFYLENBUFc7QUFRakIsb0JBQUksYUFBYSxTQUFTLElBQVQsRUFBYixDQVJhO0FBU2pCLHVCQUFPLENBQUMsV0FBVyxJQUFYLEVBQWlCO0FBQ3JCLHdCQUFJLFdBQVcsS0FBWCxDQUFpQixPQUFqQixDQUF5QixNQUF6QixDQUFKLEVBQXNDO0FBQ2xDLCtCQUFPLFdBQVcsS0FBWCxDQUQyQjtBQUVsQyw4QkFGa0M7cUJBQXRDO0FBSUEsaUNBQWEsU0FBUyxJQUFULEVBQWIsQ0FMcUI7aUJBQXpCO0FBUUEsb0JBQUksSUFBSixFQUFVO0FBQ04sNEJBQVEsR0FBUixDQUFZLElBQVosRUFETTtBQUVOLHlCQUFLLFVBQUwsR0FGTTtpQkFBVixNQUdPO0FBQ0gsMkJBQU8sSUFBSSxJQUFKLENBQVMsTUFBVCxFQUFpQixVQUFqQixFQUE2QixNQUE3QixFQUFxQyxLQUFyQyxFQUE0QywwQkFBVyxNQUFYLENBQWtCLFlBQUE7QUFDakUsb0NBQVksTUFBWixDQUFtQixJQUFuQixFQURpRTtxQkFBQSxDQUE5RCxDQUFQLENBREc7QUFJSCw0QkFBUSxHQUFSLENBQVksSUFBWixFQUpHO0FBS0gsZ0NBQVksR0FBWixDQUFnQixJQUFoQixFQUxHO2lCQUhQO0FBV0EsdUJBQU8sS0FBSyxhQUFMLEVBQVAsQ0E1QmlCO2FBQVYsQ0FIUixDQWlDRixFQWpDRSxDQWlDQyxFQUFFLFVBQVUsb0JBQUE7QUFFWixnQ0FBWSxPQUFaLENBQW9CLGdCQUFJO0FBQ3BCLDRCQUFJLFFBQVEsQ0FBQyxRQUFRLEdBQVIsQ0FBWSxJQUFaLENBQUQsRUFBb0I7QUFDNUIsaUNBQUssT0FBTCxHQUQ0Qjt5QkFBaEM7cUJBRGdCLENBQXBCLENBRlk7aUJBQUEsRUFqQ2IsQ0FBUCxDQVZ5Qzs7Ozs7OztBQTBEakQsU0FBQSxhQUFBLENBQXVCLE1BQXZCLEVBQWdELElBQWhELEVBQTREO0FBQ3hELFFBQU0sVUFBZSxLQUFLLEtBQUwsQ0FBVyxPQUFYLENBQW1CLE1BQW5CLENBQWYsQ0FEa0Q7QUFFeEQsUUFBTSxNQUFNLFFBQVEsd0JBQVIsRUFBTixDQUZrRDtBQUd4RCxRQUFNLFNBQVMsUUFBUSx1QkFBUixFQUFULENBSGtEO0FBS3hELFFBQUksUUFBUSxHQUFSLElBQWUsUUFBUSxNQUFSLEVBQ2YsT0FBTyxLQUFQLENBREo7QUFFQSxXQUFPLElBQVAsQ0FQd0Q7Q0FBNUQ7O0lBVUE7QUFXSSxrQkFBb0IsT0FBcEIsRUFBc0QsT0FBdEQsRUFBd0YsT0FBeEYsRUFBc0gsTUFBdEgsRUFBZ0osUUFBaEosRUFBcUs7Ozs7O0FBQWpKLGFBQUEsT0FBQSxHQUFBLE9BQUEsQ0FBaUo7QUFBL0csYUFBQSxPQUFBLEdBQUEsT0FBQSxDQUErRztBQUE3RSxhQUFBLE9BQUEsR0FBQSxPQUFBLENBQTZFO0FBQS9DLGFBQUEsTUFBQSxHQUFBLE1BQUEsQ0FBK0M7QUFQN0osYUFBQSxXQUFBLEdBQWMsd0NBQWQsQ0FPNko7QUFGOUosYUFBQSxNQUFBLEdBQWtCLEtBQWxCLENBRThKO0FBeUM3SixhQUFBLFlBQUEsR0FBZSxpQkFBRSxRQUFGLENBQVcsVUFBQyxTQUFELEVBQW1CO0FBQ2pELGdCQUFJLENBQUMsT0FBSyxPQUFMLENBQWEsU0FBYixFQUF3QjtBQUFFLHVCQUFLLE9BQUwsQ0FBYSxJQUFiLENBQWtCLFNBQWxCLEVBQUY7YUFBN0I7U0FEOEIsRUFFL0IsR0FGb0IsQ0FBZixDQXpDNko7QUFDakssYUFBSyxJQUFMLEdBQVksT0FBTyxPQUFQLEdBQWlCLENBQWpCLENBQVosQ0FEaUs7QUFFakssYUFBSyxPQUFMLEdBQWUsbUJBQWYsQ0FGaUs7QUFHakssYUFBSyxXQUFMLENBQWlCLEdBQWpCLENBQXFCLEtBQUssT0FBTCxDQUFyQixDQUhpSztBQUlqSyxhQUFLLEtBQUwsR0FBYSxRQUFRLE9BQVIsRUFBYixDQUppSztBQU1qSyxhQUFLLGlCQUFMLEdBQXlCLEtBQUssT0FBTCxDQUNwQixNQURvQixDQUNiO21CQUFLLENBQUMsQ0FBQyxDQUFEO1NBQU4sQ0FEYSxDQUVwQixPQUZvQixDQUVaO21CQUFNLFdBQUssT0FBTCxDQUFhLE9BQUssT0FBTCxFQUFjO3VCQUN0QyxTQUFTLFVBQVQsQ0FBb0IsRUFBRSxVQUFVLE9BQUssS0FBTCxFQUFZLFFBQVEsT0FBSyxPQUFMLENBQWEsTUFBYixHQUFzQixDQUF0QixFQUF5QixNQUFNLE9BQUssT0FBTCxDQUFhLElBQWIsRUFBbUIsUUFBUSxJQUFSLEVBQWMsU0FBUyxJQUFULEVBQXBILEVBQXFJLEVBQUUsUUFBUSxJQUFSLEVBQXZJO2FBRHNDO1NBQWpDLENBRlksQ0FJcEIsTUFKb0IsQ0FJYjttQkFBSyxLQUFLLEVBQUUsVUFBRixJQUFnQixDQUFDLENBQUMsRUFBRSxVQUFGLENBQWEsTUFBYjtTQUE1QixDQUphLENBS3BCLEdBTG9CLENBS2hCO21CQUFLLEtBQUssRUFBRSxVQUFGLElBQWdCLEVBQUUsVUFBRixDQUFhLE1BQWIsR0FBc0IsQ0FBdEI7U0FBMUIsQ0FMZ0IsQ0FNcEIsS0FOb0IsRUFBekIsQ0FOaUs7QUFjakssYUFBSyxXQUFMLENBQWlCLEdBQWpCLENBQXFCLEtBQUssaUJBQUwsQ0FDaEIsSUFEZ0IsQ0FDWCxDQURXLEVBRWhCLE1BRmdCLENBRVQ7bUJBQUssSUFBSSxDQUFKO1NBQUwsQ0FGUyxDQUdoQixFQUhnQixDQUdiO21CQUFNLE9BQUssTUFBTCxHQUFjLElBQWQ7U0FBTixDQUhhLENBSWhCLFNBSmdCLENBSU4sVUFBQyxDQUFEO21CQUFPLE9BQUssU0FBTCxDQUFlLENBQWY7U0FBUCxDQUpmLEVBZGlLO0FBb0JqSyxhQUFLLFdBQUwsQ0FBaUIsR0FBakIsQ0FBcUIsUUFBckIsRUFwQmlLO0FBcUJqSyxhQUFLLFdBQUwsQ0FBaUIsR0FBakIsQ0FBcUIsS0FBSyxPQUFMLENBQWEsWUFBYixDQUEwQixZQUFBO0FBQzNDLG1CQUFLLE9BQUwsR0FEMkM7U0FBQSxDQUEvQyxFQXJCaUs7S0FBcks7Ozs7d0NBMEJvQjtBQUNoQixnQkFBTSxZQUFZLEtBQUssVUFBTCxFQUFaLENBRFU7QUFFaEIsaUJBQUssaUJBQUwsQ0FBdUIsU0FBdkIsRUFGZ0I7QUFJaEIsZ0JBQUksZUFBSixDQUpnQjtBQUtoQixnQkFBSSxTQUFKLEVBQWU7QUFDWCx5QkFBUyxLQUFLLGlCQUFMLENBQXVCLElBQXZCLENBQTRCLENBQTVCLENBQVQsQ0FEVzthQUFmLE1BRU87QUFDSCx5QkFBUyxpQkFBVyxLQUFYLEVBQVQsQ0FERzthQUZQO0FBTUEsaUJBQUssWUFBTCxDQUFrQixTQUFsQixFQVhnQjtBQVloQixtQkFBTyxNQUFQLENBWmdCOzs7O2tDQW1CSCxZQUFrQjtBQUMvQixnQkFBSSxLQUFLLFFBQUwsRUFDQSxLQUFLLFFBQUwsQ0FBYyxLQUFkLENBQW9CLEdBQXBCLFNBQThCLGlCQUE5QixDQURKOzs7O3FDQUlhOzs7QUFDYixnQkFBTSxPQUFzQixLQUFLLGlCQUFMLENBQ3ZCLElBRHVCLENBQ2xCLENBRGtCLEVBRXZCLEVBRnVCLENBRXBCO3VCQUFNLE9BQUssV0FBTCxDQUFpQixNQUFqQixDQUF3QixJQUF4QjthQUFOLENBRm9CLENBR3ZCLFNBSHVCLENBR2IsYUFBQztBQUNSLG9CQUFJLEtBQUssQ0FBTCxFQUFRO0FBQ1IsMkJBQUssT0FBTCxHQURRO2lCQUFaLE1BRU87QUFDSCx3QkFBSSxPQUFLLFFBQUwsRUFBZTtBQUFFLDhCQUFDLENBQUssUUFBTCxDQUFjLFdBQWQsR0FBNEIsRUFBRSxRQUFGLEVBQTVCLENBQUg7cUJBQW5CO2lCQUhKO2FBRE8sQ0FIVCxDQURPO0FBV2IsaUJBQUssV0FBTCxDQUFpQixHQUFqQixDQUFxQixJQUFyQixFQVhhOzs7O2dDQWNGLFFBQW1CO0FBQzlCLG1CQUFPLEtBQUssT0FBTCxDQUFhLE9BQWIsQ0FBMEIsTUFBMUIsQ0FBUCxDQUQ4Qjs7OztxQ0FJaEI7QUFDZCxtQkFBTyxjQUFjLEtBQUssT0FBTCxFQUFjLEtBQUssSUFBTCxDQUFuQyxDQURjOzs7OzBDQUlRLFdBQWtCOzs7QUFDeEMsZ0JBQUksS0FBSyxXQUFMLElBQW9CLEtBQUssUUFBTCxFQUFlOztBQUNuQyx3QkFBTSxVQUFVLE9BQUssUUFBTDtBQUNoQix3QkFBSSxTQUFKLEVBQWU7QUFDWCxnQ0FBUSxPQUFSLENBQWdCO21DQUFNLFFBQVEsS0FBUixDQUFjLE9BQWQsS0FBMEIsTUFBMUIsSUFBb0MsUUFBUSxNQUFSLENBQWU7dUNBQU0sUUFBUSxLQUFSLENBQWMsT0FBZCxHQUF3QixFQUF4Qjs2QkFBTixDQUFuRDt5QkFBTixDQUFoQixDQURXO3FCQUFmLE1BRU87QUFDSCxnQ0FBUSxPQUFSLENBQWdCO21DQUFNLFFBQVEsS0FBUixDQUFjLE9BQWQsS0FBMEIsTUFBMUIsSUFBb0MsUUFBUSxNQUFSLENBQWU7dUNBQU0sUUFBUSxLQUFSLENBQWMsT0FBZCxHQUF3QixNQUF4Qjs2QkFBTixDQUFuRDt5QkFBTixDQUFoQixDQURHO3FCQUZQO3FCQUZtQzthQUF2Qzs7OztrQ0FVYyxPQUFhOzs7QUFDM0IsZ0JBQU0sYUFBYSxLQUFLLE9BQUwsQ0FBYSxxQkFBYixFQUFiLENBRHFCO0FBRzNCLGdCQUFNLFVBQVUsS0FBSyxRQUFMLEdBQWdCLFNBQVMsYUFBVCxDQUF1QixLQUF2QixDQUFoQixDQUhXO0FBSTNCLG9CQUFRLEtBQVIsQ0FBYyxRQUFkLEdBQXlCLFVBQXpCLENBSjJCO0FBSzNCLG9CQUFRLEtBQVIsQ0FBYyxHQUFkLFNBQXdCLGlCQUF4QixDQUwyQjtBQU0zQixvQkFBUSxLQUFSLENBQWMsSUFBZCxHQUFxQixNQUFyQixDQU4yQjtBQU8zQixvQkFBUSxTQUFSLENBQWtCLEdBQWxCLENBQXNCLGdCQUF0QixFQUF3QyxPQUF4QyxFQUFpRCxhQUFqRCxFQVAyQjtBQVEzQixvQkFBUSxXQUFSLEdBQXNCLE1BQU0sUUFBTixFQUF0QixDQVIyQjtBQVMzQixvQkFBUSxPQUFSLEdBQWtCO3VCQUFNLFdBQUssT0FBTCxDQUFhLE9BQUssT0FBTCxFQUFjOzJCQUFLLEVBQUUsVUFBRixDQUFhLEVBQUUsVUFBVSxPQUFLLEtBQUwsRUFBWSxRQUFRLE9BQUssT0FBTCxDQUFhLE1BQWIsR0FBc0IsQ0FBdEIsRUFBeUIsTUFBTSxPQUFLLE9BQUwsQ0FBYSxJQUFiLEVBQW1CLFFBQVEsSUFBUixFQUFjLFNBQVMsSUFBVCxFQUE3RztpQkFBTDthQUFqQyxDQVRTO0FBYTNCLGlCQUFLLFdBQUwsR0FBd0IsS0FBSyxPQUFMLENBQWEsY0FBYixDQUE0QixLQUFLLE9BQUwsRUFBYyxFQUFFLE1BQU0sU0FBTixFQUFpQixpQkFBbkIsRUFBc0MsTUFBTSxLQUFLLFFBQUwsRUFBZSxVQUFVLE1BQVYsRUFBckcsQ0FBeEIsQ0FiMkI7QUFjM0IsaUJBQUssV0FBTCxDQUFpQixHQUFqQixDQUFxQiwwQkFBVyxNQUFYLENBQWtCLFlBQUE7QUFDbkMsdUJBQUssUUFBTCxDQUFjLE1BQWQsR0FEbUM7QUFFbkMsb0JBQUksT0FBSyxXQUFMLEVBQWtCO0FBQ2xCLDJCQUFLLFdBQUwsQ0FBaUIsT0FBakIsR0FEa0I7aUJBQXRCO0FBR0EsdUJBQUssUUFBTCxHQUFnQixJQUFoQixDQUxtQzthQUFBLENBQXZDLEVBZDJCO0FBc0IzQixnQkFBTSxZQUFZLGNBQWMsS0FBSyxPQUFMLEVBQWMsS0FBSyxJQUFMLENBQXhDLENBdEJxQjtBQXVCM0IsZ0JBQUksQ0FBQyxTQUFELEVBQVk7QUFDWix3QkFBUSxLQUFSLENBQWMsT0FBZCxHQUF3QixNQUF4QixDQURZO2FBQWhCO0FBSUEsbUJBQU8sS0FBSyxXQUFMLENBM0JvQjs7OztrQ0E4QmpCO0FBQUssbUJBQU8sS0FBSyxXQUFMLENBQWlCLE9BQWpCLEVBQVAsQ0FBTDs7Ozs7OztBQUdYLElBQU0sOEJBQVcsSUFBSSxRQUFKLEVBQVgiLCJmaWxlIjoibGliL2ZlYXR1cmVzL2NvZGUtbGVucy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcbmltcG9ydCB7IE9ic2VydmFibGUsIFN1YmplY3QgfSBmcm9tIFwicnhqc1wiO1xuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSwgRGlzcG9zYWJsZSB9IGZyb20gXCJ0cy1kaXNwb3NhYmxlc1wiO1xuaW1wb3J0IHsgT21uaSB9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xubGV0IGZhc3Rkb20gPSByZXF1aXJlKFwiZmFzdGRvbVwiKTtcbmNsYXNzIENvZGVMZW5zIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5kZWNvcmF0aW9ucyA9IG5ldyBXZWFrTWFwKCk7XG4gICAgICAgIHRoaXMucmVxdWlyZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy50aXRsZSA9IFwiQ29kZSBMZW5zXCI7XG4gICAgICAgIHRoaXMuZGVzY3JpcHRpb24gPSBcIkFkZHMgc3VwcG9ydCBmb3IgZGlzcGxheWluZyByZWZlcmVuY2VzIGluIHRoZSBlZGl0b3IuXCI7XG4gICAgfVxuICAgIGFjdGl2YXRlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuZWFjaEVkaXRvcigoZWRpdG9yLCBjZCkgPT4ge1xuICAgICAgICAgICAgY2QuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBtYXJrZXJzID0gdGhpcy5kZWNvcmF0aW9ucy5nZXQoZWRpdG9yKTtcbiAgICAgICAgICAgICAgICBpZiAobWFya2Vycykge1xuICAgICAgICAgICAgICAgICAgICBtYXJrZXJzLmZvckVhY2gobWFya2VyID0+IG1hcmtlci5kaXNwb3NlKCkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLmRlY29yYXRpb25zLmRlbGV0ZShlZGl0b3IpO1xuICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgY2QuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoXCJlZGl0b3IuZm9udFNpemVcIiwgKHNpemUpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBkZWNvcmF0aW9ucyA9IHRoaXMuZGVjb3JhdGlvbnMuZ2V0KGVkaXRvcik7XG4gICAgICAgICAgICAgICAgY29uc3QgbGluZUhlaWdodCA9IGVkaXRvci5nZXRMaW5lSGVpZ2h0SW5QaXhlbHMoKTtcbiAgICAgICAgICAgICAgICBpZiAoZGVjb3JhdGlvbnMgJiYgbGluZUhlaWdodCkge1xuICAgICAgICAgICAgICAgICAgICBkZWNvcmF0aW9ucy5mb3JFYWNoKGRlY29yYXRpb24gPT4gZGVjb3JhdGlvbi51cGRhdGVUb3AobGluZUhlaWdodCkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuc3dpdGNoQWN0aXZlRWRpdG9yKChlZGl0b3IsIGNkKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBpdGVtcyA9IHRoaXMuZGVjb3JhdGlvbnMuZ2V0KGVkaXRvcik7XG4gICAgICAgICAgICBpZiAoIWl0ZW1zKVxuICAgICAgICAgICAgICAgIHRoaXMuZGVjb3JhdGlvbnMuc2V0KGVkaXRvciwgbmV3IFNldCgpKTtcbiAgICAgICAgICAgIGNvbnN0IHN1YmplY3QgPSBuZXcgU3ViamVjdCgpO1xuICAgICAgICAgICAgY2QuYWRkKHN1YmplY3RcbiAgICAgICAgICAgICAgICAuZmlsdGVyKHggPT4gISF4ICYmICFlZGl0b3IuaXNEZXN0cm95ZWQoKSlcbiAgICAgICAgICAgICAgICAuZGlzdGluY3RVbnRpbENoYW5nZWQoeCA9PiAhIXgpXG4gICAgICAgICAgICAgICAgLmRlYm91bmNlVGltZSg1MDApXG4gICAgICAgICAgICAgICAgLnN3aXRjaE1hcCgoKSA9PiB0aGlzLnVwZGF0ZUNvZGVMZW5zKGVkaXRvcikpXG4gICAgICAgICAgICAgICAgLnN1YnNjcmliZSgpKTtcbiAgICAgICAgICAgIGNvbnN0IGJpbmREaWRDaGFuZ2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZGlkQ2hhbmdlID0gZWRpdG9yLmdldEJ1ZmZlcigpLm9uRGlkQ2hhbmdlKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgZGlkQ2hhbmdlLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgY2QucmVtb3ZlKGRpZENoYW5nZSk7XG4gICAgICAgICAgICAgICAgICAgIHN1YmplY3QubmV4dChmYWxzZSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY2QuYWRkKGRpZENoYW5nZSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgY2QuYWRkKGVkaXRvci5nZXRCdWZmZXIoKS5vbkRpZFN0b3BDaGFuZ2luZyhfLmRlYm91bmNlKCgpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoIXN1YmplY3QuaXNTdG9wcGVkKVxuICAgICAgICAgICAgICAgICAgICBzdWJqZWN0Lm5leHQodHJ1ZSk7XG4gICAgICAgICAgICAgICAgYmluZERpZENoYW5nZSgpO1xuICAgICAgICAgICAgfSwgNTAwMCkpKTtcbiAgICAgICAgICAgIGNkLmFkZChlZGl0b3IuZ2V0QnVmZmVyKCkub25EaWRTYXZlKCgpID0+IHN1YmplY3QubmV4dCh0cnVlKSkpO1xuICAgICAgICAgICAgY2QuYWRkKGVkaXRvci5nZXRCdWZmZXIoKS5vbkRpZFJlbG9hZCgoKSA9PiBzdWJqZWN0Lm5leHQodHJ1ZSkpKTtcbiAgICAgICAgICAgIGNkLmFkZChPYnNlcnZhYmxlLnRpbWVyKDEwMDApLnN1YnNjcmliZSgoKSA9PiBzdWJqZWN0Lm5leHQodHJ1ZSkpKTtcbiAgICAgICAgICAgIGNkLmFkZChlZGl0b3Iub25EaWRDaGFuZ2VTY3JvbGxUb3AoKCkgPT4gdGhpcy51cGRhdGVEZWNvcmF0b3JWaXNpYmxpbGl0eShlZGl0b3IpKSk7XG4gICAgICAgICAgICBjZC5hZGQoYXRvbS5jb21tYW5kcy5vbldpbGxEaXNwYXRjaCgoZXZlbnQpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoXy5pbmNsdWRlcyhbXCJvbW5pc2hhcnAtYXRvbTp0b2dnbGUtZG9ja1wiLCBcIm9tbmlzaGFycC1hdG9tOnNob3ctZG9ja1wiLCBcIm9tbmlzaGFycC1hdG9tOmhpZGUtZG9ja1wiXSwgZXZlbnQudHlwZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy51cGRhdGVEZWNvcmF0b3JWaXNpYmxpbGl0eShlZGl0b3IpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIGNkLmFkZChzdWJqZWN0KTtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlRGVjb3JhdG9yVmlzaWJsaWxpdHkoZWRpdG9yKTtcbiAgICAgICAgfSkpO1xuICAgIH1cbiAgICB1cGRhdGVEZWNvcmF0b3JWaXNpYmxpbGl0eShlZGl0b3IpIHtcbiAgICAgICAgaWYgKCF0aGlzLmRlY29yYXRpb25zLmhhcyhlZGl0b3IpKVxuICAgICAgICAgICAgdGhpcy5kZWNvcmF0aW9ucy5zZXQoZWRpdG9yLCBuZXcgU2V0KCkpO1xuICAgICAgICBjb25zdCBkZWNvcmF0aW9ucyA9IHRoaXMuZGVjb3JhdGlvbnMuZ2V0KGVkaXRvcik7XG4gICAgICAgIGRlY29yYXRpb25zLmZvckVhY2goZGVjb3JhdGlvbiA9PiBkZWNvcmF0aW9uLnVwZGF0ZVZpc2libGUoKSk7XG4gICAgfVxuICAgIGRpc3Bvc2UoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfVxuICAgIHVwZGF0ZUNvZGVMZW5zKGVkaXRvcikge1xuICAgICAgICBpZiAoIXRoaXMuZGVjb3JhdGlvbnMuaGFzKGVkaXRvcikpXG4gICAgICAgICAgICB0aGlzLmRlY29yYXRpb25zLnNldChlZGl0b3IsIG5ldyBTZXQoKSk7XG4gICAgICAgIGNvbnN0IGRlY29yYXRpb25zID0gdGhpcy5kZWNvcmF0aW9ucy5nZXQoZWRpdG9yKTtcbiAgICAgICAgY29uc3QgdXBkYXRlZCA9IG5ldyBXZWFrU2V0KCk7XG4gICAgICAgIGlmIChlZGl0b3IuaXNEZXN0cm95ZWQoKSkge1xuICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuZW1wdHkoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gT21uaS5yZXF1ZXN0KGVkaXRvciwgc29sdXRpb24gPT4gc29sdXRpb24uY3VycmVudGZpbGVtZW1iZXJzYXNmbGF0KHsgQnVmZmVyOiBudWxsLCBDaGFuZ2VzOiBudWxsIH0pKVxuICAgICAgICAgICAgLmZpbHRlcihmaWxlTWVtYmVycyA9PiAhIWZpbGVNZW1iZXJzKVxuICAgICAgICAgICAgLmZsYXRNYXAoZmlsZU1lbWJlcnMgPT4gZmlsZU1lbWJlcnMpXG4gICAgICAgICAgICAuY29uY2F0TWFwKGZpbGVNZW1iZXIgPT4ge1xuICAgICAgICAgICAgY29uc3QgcmFuZ2UgPSBlZGl0b3IuZ2V0QnVmZmVyKCkucmFuZ2VGb3JSb3coZmlsZU1lbWJlci5MaW5lLCBmYWxzZSk7XG4gICAgICAgICAgICBjb25zdCBtYXJrZXIgPSBlZGl0b3IubWFya0J1ZmZlclJhbmdlKHJhbmdlLCB7IGludmFsaWRhdGU6IFwiaW5zaWRlXCIgfSk7XG4gICAgICAgICAgICBsZXQgbGVucztcbiAgICAgICAgICAgIGNvbnN0IGl0ZXJhdGVlID0gZGVjb3JhdGlvbnMudmFsdWVzKCk7XG4gICAgICAgICAgICBsZXQgZGVjb3JhdGlvbiA9IGl0ZXJhdGVlLm5leHQoKTtcbiAgICAgICAgICAgIHdoaWxlICghZGVjb3JhdGlvbi5kb25lKSB7XG4gICAgICAgICAgICAgICAgaWYgKGRlY29yYXRpb24udmFsdWUuaXNFcXVhbChtYXJrZXIpKSB7XG4gICAgICAgICAgICAgICAgICAgIGxlbnMgPSBkZWNvcmF0aW9uLnZhbHVlO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZGVjb3JhdGlvbiA9IGl0ZXJhdGVlLm5leHQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChsZW5zKSB7XG4gICAgICAgICAgICAgICAgdXBkYXRlZC5hZGQobGVucyk7XG4gICAgICAgICAgICAgICAgbGVucy5pbnZhbGlkYXRlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBsZW5zID0gbmV3IExlbnMoZWRpdG9yLCBmaWxlTWVtYmVyLCBtYXJrZXIsIHJhbmdlLCBEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGRlY29yYXRpb25zLmRlbGV0ZShsZW5zKTtcbiAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICAgICAgdXBkYXRlZC5hZGQobGVucyk7XG4gICAgICAgICAgICAgICAgZGVjb3JhdGlvbnMuYWRkKGxlbnMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGxlbnMudXBkYXRlVmlzaWJsZSgpO1xuICAgICAgICB9KVxuICAgICAgICAgICAgLmRvKHsgY29tcGxldGU6ICgpID0+IHtcbiAgICAgICAgICAgICAgICBkZWNvcmF0aW9ucy5mb3JFYWNoKGxlbnMgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAobGVucyAmJiAhdXBkYXRlZC5oYXMobGVucykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxlbnMuZGlzcG9zZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IH0pO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGlzTGluZVZpc2libGUoZWRpdG9yLCBsaW5lKSB7XG4gICAgY29uc3QgZWxlbWVudCA9IGF0b20udmlld3MuZ2V0VmlldyhlZGl0b3IpO1xuICAgIGNvbnN0IHRvcCA9IGVsZW1lbnQuZ2V0Rmlyc3RWaXNpYmxlU2NyZWVuUm93KCk7XG4gICAgY29uc3QgYm90dG9tID0gZWxlbWVudC5nZXRMYXN0VmlzaWJsZVNjcmVlblJvdygpO1xuICAgIGlmIChsaW5lIDw9IHRvcCB8fCBsaW5lID49IGJvdHRvbSlcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIHJldHVybiB0cnVlO1xufVxuZXhwb3J0IGNsYXNzIExlbnMge1xuICAgIGNvbnN0cnVjdG9yKF9lZGl0b3IsIF9tZW1iZXIsIF9tYXJrZXIsIF9yYW5nZSwgZGlzcG9zZXIpIHtcbiAgICAgICAgdGhpcy5fZWRpdG9yID0gX2VkaXRvcjtcbiAgICAgICAgdGhpcy5fbWVtYmVyID0gX21lbWJlcjtcbiAgICAgICAgdGhpcy5fbWFya2VyID0gX21hcmtlcjtcbiAgICAgICAgdGhpcy5fcmFuZ2UgPSBfcmFuZ2U7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICB0aGlzLmxvYWRlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLl9pc3N1ZVVwZGF0ZSA9IF8uZGVib3VuY2UoKGlzVmlzaWJsZSkgPT4ge1xuICAgICAgICAgICAgaWYgKCF0aGlzLl91cGRhdGUuaXNTdG9wcGVkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fdXBkYXRlLm5leHQoaXNWaXNpYmxlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgMjUwKTtcbiAgICAgICAgdGhpcy5fcm93ID0gX3JhbmdlLmdldFJvd3MoKVswXTtcbiAgICAgICAgdGhpcy5fdXBkYXRlID0gbmV3IFN1YmplY3QoKTtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQodGhpcy5fdXBkYXRlKTtcbiAgICAgICAgdGhpcy5fcGF0aCA9IF9lZGl0b3IuZ2V0UGF0aCgpO1xuICAgICAgICB0aGlzLl91cGRhdGVPYnNlcnZhYmxlID0gdGhpcy5fdXBkYXRlXG4gICAgICAgICAgICAuZmlsdGVyKHggPT4gISF4KVxuICAgICAgICAgICAgLmZsYXRNYXAoKCkgPT4gT21uaS5yZXF1ZXN0KHRoaXMuX2VkaXRvciwgc29sdXRpb24gPT4gc29sdXRpb24uZmluZHVzYWdlcyh7IEZpbGVOYW1lOiB0aGlzLl9wYXRoLCBDb2x1bW46IHRoaXMuX21lbWJlci5Db2x1bW4gKyAxLCBMaW5lOiB0aGlzLl9tZW1iZXIuTGluZSwgQnVmZmVyOiBudWxsLCBDaGFuZ2VzOiBudWxsIH0sIHsgc2lsZW50OiB0cnVlIH0pKSlcbiAgICAgICAgICAgIC5maWx0ZXIoeCA9PiB4ICYmIHguUXVpY2tGaXhlcyAmJiAhIXguUXVpY2tGaXhlcy5sZW5ndGgpXG4gICAgICAgICAgICAubWFwKHggPT4geCAmJiB4LlF1aWNrRml4ZXMgJiYgeC5RdWlja0ZpeGVzLmxlbmd0aCAtIDEpXG4gICAgICAgICAgICAuc2hhcmUoKTtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQodGhpcy5fdXBkYXRlT2JzZXJ2YWJsZVxuICAgICAgICAgICAgLnRha2UoMSlcbiAgICAgICAgICAgIC5maWx0ZXIoeCA9PiB4ID4gMClcbiAgICAgICAgICAgIC5kbygoKSA9PiB0aGlzLmxvYWRlZCA9IHRydWUpXG4gICAgICAgICAgICAuc3Vic2NyaWJlKCh4KSA9PiB0aGlzLl9kZWNvcmF0ZSh4KSkpO1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChkaXNwb3Nlcik7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKHRoaXMuX21hcmtlci5vbkRpZERlc3Ryb3koKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5kaXNwb3NlKCk7XG4gICAgICAgIH0pKTtcbiAgICB9XG4gICAgdXBkYXRlVmlzaWJsZSgpIHtcbiAgICAgICAgY29uc3QgaXNWaXNpYmxlID0gdGhpcy5faXNWaXNpYmxlKCk7XG4gICAgICAgIHRoaXMuX3VwZGF0ZURlY29yYXRpb24oaXNWaXNpYmxlKTtcbiAgICAgICAgbGV0IHJlc3VsdDtcbiAgICAgICAgaWYgKGlzVmlzaWJsZSkge1xuICAgICAgICAgICAgcmVzdWx0ID0gdGhpcy5fdXBkYXRlT2JzZXJ2YWJsZS50YWtlKDEpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmVzdWx0ID0gT2JzZXJ2YWJsZS5lbXB0eSgpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2lzc3VlVXBkYXRlKGlzVmlzaWJsZSk7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICAgIHVwZGF0ZVRvcChsaW5lSGVpZ2h0KSB7XG4gICAgICAgIGlmICh0aGlzLl9lbGVtZW50KVxuICAgICAgICAgICAgdGhpcy5fZWxlbWVudC5zdHlsZS50b3AgPSBgLSR7bGluZUhlaWdodH1weGA7XG4gICAgfVxuICAgIGludmFsaWRhdGUoKSB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzLl91cGRhdGVPYnNlcnZhYmxlXG4gICAgICAgICAgICAudGFrZSgxKVxuICAgICAgICAgICAgLmRvKCgpID0+IHRoaXMuX2Rpc3Bvc2FibGUucmVtb3ZlKHNlbGYpKVxuICAgICAgICAgICAgLnN1YnNjcmliZSh4ID0+IHtcbiAgICAgICAgICAgIGlmICh4IDw9IDApIHtcbiAgICAgICAgICAgICAgICB0aGlzLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9lbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICh0aGlzLl9lbGVtZW50LnRleHRDb250ZW50ID0geC50b1N0cmluZygpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChzZWxmKTtcbiAgICB9XG4gICAgaXNFcXVhbChtYXJrZXIpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX21hcmtlci5pc0VxdWFsKG1hcmtlcik7XG4gICAgfVxuICAgIF9pc1Zpc2libGUoKSB7XG4gICAgICAgIHJldHVybiBpc0xpbmVWaXNpYmxlKHRoaXMuX2VkaXRvciwgdGhpcy5fcm93KTtcbiAgICB9XG4gICAgX3VwZGF0ZURlY29yYXRpb24oaXNWaXNpYmxlKSB7XG4gICAgICAgIGlmICh0aGlzLl9kZWNvcmF0aW9uICYmIHRoaXMuX2VsZW1lbnQpIHtcbiAgICAgICAgICAgIGNvbnN0IGVsZW1lbnQgPSB0aGlzLl9lbGVtZW50O1xuICAgICAgICAgICAgaWYgKGlzVmlzaWJsZSkge1xuICAgICAgICAgICAgICAgIGZhc3Rkb20ubWVhc3VyZSgoKSA9PiBlbGVtZW50LnN0eWxlLmRpc3BsYXkgPT09IFwibm9uZVwiICYmIGZhc3Rkb20ubXV0YXRlKCgpID0+IGVsZW1lbnQuc3R5bGUuZGlzcGxheSA9IFwiXCIpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGZhc3Rkb20ubWVhc3VyZSgoKSA9PiBlbGVtZW50LnN0eWxlLmRpc3BsYXkgIT09IFwibm9uZVwiICYmIGZhc3Rkb20ubXV0YXRlKCgpID0+IGVsZW1lbnQuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgX2RlY29yYXRlKGNvdW50KSB7XG4gICAgICAgIGNvbnN0IGxpbmVIZWlnaHQgPSB0aGlzLl9lZGl0b3IuZ2V0TGluZUhlaWdodEluUGl4ZWxzKCk7XG4gICAgICAgIGNvbnN0IGVsZW1lbnQgPSB0aGlzLl9lbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgZWxlbWVudC5zdHlsZS5wb3NpdGlvbiA9IFwicmVsYXRpdmVcIjtcbiAgICAgICAgZWxlbWVudC5zdHlsZS50b3AgPSBgLSR7bGluZUhlaWdodH1weGA7XG4gICAgICAgIGVsZW1lbnQuc3R5bGUubGVmdCA9IFwiMTZweFwiO1xuICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5hZGQoXCJoaWdobGlnaHQtaW5mb1wiLCBcImJhZGdlXCIsIFwiYmFkZ2Utc21hbGxcIik7XG4gICAgICAgIGVsZW1lbnQudGV4dENvbnRlbnQgPSBjb3VudC50b1N0cmluZygpO1xuICAgICAgICBlbGVtZW50Lm9uY2xpY2sgPSAoKSA9PiBPbW5pLnJlcXVlc3QodGhpcy5fZWRpdG9yLCBzID0+IHMuZmluZHVzYWdlcyh7IEZpbGVOYW1lOiB0aGlzLl9wYXRoLCBDb2x1bW46IHRoaXMuX21lbWJlci5Db2x1bW4gKyAxLCBMaW5lOiB0aGlzLl9tZW1iZXIuTGluZSwgQnVmZmVyOiBudWxsLCBDaGFuZ2VzOiBudWxsIH0pKTtcbiAgICAgICAgdGhpcy5fZGVjb3JhdGlvbiA9IHRoaXMuX2VkaXRvci5kZWNvcmF0ZU1hcmtlcih0aGlzLl9tYXJrZXIsIHsgdHlwZTogXCJvdmVybGF5XCIsIGNsYXNzOiBgY29kZWxlbnNgLCBpdGVtOiB0aGlzLl9lbGVtZW50LCBwb3NpdGlvbjogXCJoZWFkXCIgfSk7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuX2VsZW1lbnQucmVtb3ZlKCk7XG4gICAgICAgICAgICBpZiAodGhpcy5fZGVjb3JhdGlvbikge1xuICAgICAgICAgICAgICAgIHRoaXMuX2RlY29yYXRpb24uZGVzdHJveSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fZWxlbWVudCA9IG51bGw7XG4gICAgICAgIH0pKTtcbiAgICAgICAgY29uc3QgaXNWaXNpYmxlID0gaXNMaW5lVmlzaWJsZSh0aGlzLl9lZGl0b3IsIHRoaXMuX3Jvdyk7XG4gICAgICAgIGlmICghaXNWaXNpYmxlKSB7XG4gICAgICAgICAgICBlbGVtZW50LnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5fZGVjb3JhdGlvbjtcbiAgICB9XG4gICAgZGlzcG9zZSgpIHsgcmV0dXJuIHRoaXMuX2Rpc3Bvc2FibGUuZGlzcG9zZSgpOyB9XG59XG5leHBvcnQgY29uc3QgY29kZUxlbnMgPSBuZXcgQ29kZUxlbnMoKTtcbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi90eXBpbmdzLmQudHNcIiAvPlxyXG5pbXBvcnQge01vZGVsc30gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcclxuaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xyXG5pbXBvcnQge09ic2VydmFibGUsIFN1YmplY3QsIFN1YnNjcmlwdGlvbn0gZnJvbSBcInJ4anNcIjtcclxuaW1wb3J0IHtDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlLCBJRGlzcG9zYWJsZX0gZnJvbSBcInRzLWRpc3Bvc2FibGVzXCI7XHJcbmltcG9ydCB7T21uaX0gZnJvbSBcIi4uL3NlcnZlci9vbW5pXCI7XHJcbmxldCBmYXN0ZG9tOiB0eXBlb2YgRmFzdGRvbSA9IHJlcXVpcmUoXCJmYXN0ZG9tXCIpO1xyXG5cclxuaW50ZXJmYWNlIElEZWNvcmF0aW9uIHtcclxuICAgIGRlc3Ryb3koKTogYW55O1xyXG4gICAgZ2V0TWFya2VyKCk6IEF0b20uTWFya2VyO1xyXG4gICAgZ2V0UHJvcGVydGllcygpOiBhbnk7XHJcbiAgICBzZXRQcm9wZXJ0aWVzKHByb3BzOiBhbnkpOiBhbnk7XHJcbn1cclxuXHJcbmNsYXNzIENvZGVMZW5zIGltcGxlbWVudHMgSUZlYXR1cmUge1xyXG4gICAgcHJpdmF0ZSBkaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xyXG4gICAgcHJpdmF0ZSBkZWNvcmF0aW9ucyA9IG5ldyBXZWFrTWFwPEF0b20uVGV4dEVkaXRvciwgU2V0PExlbnM+PigpO1xyXG5cclxuICAgIHB1YmxpYyBhY3RpdmF0ZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuZWFjaEVkaXRvcigoZWRpdG9yLCBjZCkgPT4ge1xyXG4gICAgICAgICAgICBjZC5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgbWFya2VycyA9IHRoaXMuZGVjb3JhdGlvbnMuZ2V0KGVkaXRvcik7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKG1hcmtlcnMpIHtcclxuICAgICAgICAgICAgICAgICAgICBtYXJrZXJzLmZvckVhY2gobWFya2VyID0+IG1hcmtlci5kaXNwb3NlKCkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMuZGVjb3JhdGlvbnMuZGVsZXRlKGVkaXRvcik7XHJcbiAgICAgICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgICAgIGNkLmFkZChhdG9tLmNvbmZpZy5vYnNlcnZlKFwiZWRpdG9yLmZvbnRTaXplXCIsIChzaXplOiBudW1iZXIpID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGRlY29yYXRpb25zID0gdGhpcy5kZWNvcmF0aW9ucy5nZXQoZWRpdG9yKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGxpbmVIZWlnaHQgPSBlZGl0b3IuZ2V0TGluZUhlaWdodEluUGl4ZWxzKCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoZGVjb3JhdGlvbnMgJiYgbGluZUhlaWdodCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGRlY29yYXRpb25zLmZvckVhY2goZGVjb3JhdGlvbiA9PiBkZWNvcmF0aW9uLnVwZGF0ZVRvcChsaW5lSGVpZ2h0KSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pKTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5zd2l0Y2hBY3RpdmVFZGl0b3IoKGVkaXRvciwgY2QpID0+IHtcclxuICAgICAgICAgICAgY29uc3QgaXRlbXMgPSB0aGlzLmRlY29yYXRpb25zLmdldChlZGl0b3IpO1xyXG4gICAgICAgICAgICBpZiAoIWl0ZW1zKSB0aGlzLmRlY29yYXRpb25zLnNldChlZGl0b3IsIG5ldyBTZXQ8TGVucz4oKSk7XHJcblxyXG4gICAgICAgICAgICBjb25zdCBzdWJqZWN0ID0gbmV3IFN1YmplY3Q8Ym9vbGVhbj4oKTtcclxuXHJcbiAgICAgICAgICAgIGNkLmFkZChzdWJqZWN0XHJcbiAgICAgICAgICAgICAgICAuZmlsdGVyKHggPT4gISF4ICYmICFlZGl0b3IuaXNEZXN0cm95ZWQoKSlcclxuICAgICAgICAgICAgICAgIC5kaXN0aW5jdFVudGlsQ2hhbmdlZCh4ID0+ICEheClcclxuICAgICAgICAgICAgICAgIC5kZWJvdW5jZVRpbWUoNTAwKVxyXG4gICAgICAgICAgICAgICAgLnN3aXRjaE1hcCgoKSA9PiB0aGlzLnVwZGF0ZUNvZGVMZW5zKGVkaXRvcikpXHJcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKClcclxuICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IGJpbmREaWRDaGFuZ2UgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGRpZENoYW5nZSA9IGVkaXRvci5nZXRCdWZmZXIoKS5vbkRpZENoYW5nZSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgZGlkQ2hhbmdlLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgICAgICAgICBjZC5yZW1vdmUoZGlkQ2hhbmdlKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgc3ViamVjdC5uZXh0KGZhbHNlKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGNkLmFkZChkaWRDaGFuZ2UpO1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgY2QuYWRkKGVkaXRvci5nZXRCdWZmZXIoKS5vbkRpZFN0b3BDaGFuZ2luZyhfLmRlYm91bmNlKCgpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmICghc3ViamVjdC5pc1N0b3BwZWQpIHN1YmplY3QubmV4dCh0cnVlKTtcclxuICAgICAgICAgICAgICAgIGJpbmREaWRDaGFuZ2UoKTtcclxuICAgICAgICAgICAgfSwgNTAwMCkpKTtcclxuXHJcbiAgICAgICAgICAgIGNkLmFkZChlZGl0b3IuZ2V0QnVmZmVyKCkub25EaWRTYXZlKCgpID0+IHN1YmplY3QubmV4dCh0cnVlKSkpO1xyXG4gICAgICAgICAgICBjZC5hZGQoZWRpdG9yLmdldEJ1ZmZlcigpLm9uRGlkUmVsb2FkKCgpID0+IHN1YmplY3QubmV4dCh0cnVlKSkpO1xyXG4gICAgICAgICAgICBjZC5hZGQoT2JzZXJ2YWJsZS50aW1lcigxMDAwKS5zdWJzY3JpYmUoKCkgPT4gc3ViamVjdC5uZXh0KHRydWUpKSk7XHJcblxyXG4gICAgICAgICAgICBjZC5hZGQoZWRpdG9yLm9uRGlkQ2hhbmdlU2Nyb2xsVG9wKCgpID0+IHRoaXMudXBkYXRlRGVjb3JhdG9yVmlzaWJsaWxpdHkoZWRpdG9yKSkpO1xyXG5cclxuICAgICAgICAgICAgY2QuYWRkKGF0b20uY29tbWFuZHMub25XaWxsRGlzcGF0Y2goKGV2ZW50OiBFdmVudCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKF8uaW5jbHVkZXMoW1wib21uaXNoYXJwLWF0b206dG9nZ2xlLWRvY2tcIiwgXCJvbW5pc2hhcnAtYXRvbTpzaG93LWRvY2tcIiwgXCJvbW5pc2hhcnAtYXRvbTpoaWRlLWRvY2tcIl0sIGV2ZW50LnR5cGUpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy51cGRhdGVEZWNvcmF0b3JWaXNpYmxpbGl0eShlZGl0b3IpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgICAgICBjZC5hZGQoc3ViamVjdCk7XHJcbiAgICAgICAgICAgIHRoaXMudXBkYXRlRGVjb3JhdG9yVmlzaWJsaWxpdHkoZWRpdG9yKTtcclxuICAgICAgICB9KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHVwZGF0ZURlY29yYXRvclZpc2libGlsaXR5KGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLmRlY29yYXRpb25zLmhhcyhlZGl0b3IpKSB0aGlzLmRlY29yYXRpb25zLnNldChlZGl0b3IsIG5ldyBTZXQ8TGVucz4oKSk7XHJcbiAgICAgICAgY29uc3QgZGVjb3JhdGlvbnMgPSB0aGlzLmRlY29yYXRpb25zLmdldChlZGl0b3IpO1xyXG4gICAgICAgIGRlY29yYXRpb25zLmZvckVhY2goZGVjb3JhdGlvbiA9PiBkZWNvcmF0aW9uLnVwZGF0ZVZpc2libGUoKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgdXBkYXRlQ29kZUxlbnMoZWRpdG9yOiBBdG9tLlRleHRFZGl0b3IpIHtcclxuICAgICAgICBpZiAoIXRoaXMuZGVjb3JhdGlvbnMuaGFzKGVkaXRvcikpIHRoaXMuZGVjb3JhdGlvbnMuc2V0KGVkaXRvciwgbmV3IFNldDxMZW5zPigpKTtcclxuICAgICAgICBjb25zdCBkZWNvcmF0aW9ucyA9IHRoaXMuZGVjb3JhdGlvbnMuZ2V0KGVkaXRvcik7XHJcblxyXG4gICAgICAgIGNvbnN0IHVwZGF0ZWQgPSBuZXcgV2Vha1NldDxMZW5zPigpO1xyXG5cclxuICAgICAgICBpZiAoZWRpdG9yLmlzRGVzdHJveWVkKCkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuZW1wdHk8bnVtYmVyPigpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIE9tbmkucmVxdWVzdChlZGl0b3IsIHNvbHV0aW9uID0+IHNvbHV0aW9uLmN1cnJlbnRmaWxlbWVtYmVyc2FzZmxhdCh7IEJ1ZmZlcjogbnVsbCwgQ2hhbmdlczogbnVsbCB9KSlcclxuICAgICAgICAgICAgLmZpbHRlcihmaWxlTWVtYmVycyA9PiAhIWZpbGVNZW1iZXJzKVxyXG4gICAgICAgICAgICAuZmxhdE1hcChmaWxlTWVtYmVycyA9PiBmaWxlTWVtYmVycylcclxuICAgICAgICAgICAgLmNvbmNhdE1hcChmaWxlTWVtYmVyID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHJhbmdlOiBUZXh0QnVmZmVyLlJhbmdlID0gPGFueT5lZGl0b3IuZ2V0QnVmZmVyKCkucmFuZ2VGb3JSb3coZmlsZU1lbWJlci5MaW5lLCBmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICAvLyBUT0RPOiBCbG9jayBkZWNvcmF0aW9uc1xyXG4gICAgICAgICAgICAgICAgLy8gY29uc3QgbWFya2VyOiBBdG9tLk1hcmtlciA9ICg8YW55PmVkaXRvcikubWFya1NjcmVlblBvc2l0aW9uKFtmaWxlTWVtYmVyLkxpbmUsIDBdKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IG1hcmtlcjogQXRvbS5NYXJrZXIgPSAoPGFueT5lZGl0b3IpLm1hcmtCdWZmZXJSYW5nZShyYW5nZSwgeyBpbnZhbGlkYXRlOiBcImluc2lkZVwiIH0pO1xyXG4gICAgICAgICAgICAgICAgbGV0IGxlbnM6IExlbnM7XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc3QgaXRlcmF0ZWUgPSBkZWNvcmF0aW9ucy52YWx1ZXMoKTtcclxuICAgICAgICAgICAgICAgIGxldCBkZWNvcmF0aW9uID0gaXRlcmF0ZWUubmV4dCgpO1xyXG4gICAgICAgICAgICAgICAgd2hpbGUgKCFkZWNvcmF0aW9uLmRvbmUpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZGVjb3JhdGlvbi52YWx1ZS5pc0VxdWFsKG1hcmtlcikpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGVucyA9IGRlY29yYXRpb24udmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBkZWNvcmF0aW9uID0gaXRlcmF0ZWUubmV4dCgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChsZW5zKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdXBkYXRlZC5hZGQobGVucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgbGVucy5pbnZhbGlkYXRlKCk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGxlbnMgPSBuZXcgTGVucyhlZGl0b3IsIGZpbGVNZW1iZXIsIG1hcmtlciwgcmFuZ2UsIERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGVjb3JhdGlvbnMuZGVsZXRlKGxlbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pKTtcclxuICAgICAgICAgICAgICAgICAgICB1cGRhdGVkLmFkZChsZW5zKTtcclxuICAgICAgICAgICAgICAgICAgICBkZWNvcmF0aW9ucy5hZGQobGVucyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGxlbnMudXBkYXRlVmlzaWJsZSgpO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAuZG8oeyBjb21wbGV0ZTogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgLy8gUmVtb3ZlIGFsbCBvbGQvbWlzc2luZyBkZWNvcmF0aW9uc1xyXG4gICAgICAgICAgICAgICAgZGVjb3JhdGlvbnMuZm9yRWFjaChsZW5zID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobGVucyAmJiAhdXBkYXRlZC5oYXMobGVucykpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGVucy5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0gfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlcXVpcmVkID0gZmFsc2U7XHJcbiAgICBwdWJsaWMgdGl0bGUgPSBcIkNvZGUgTGVuc1wiO1xyXG4gICAgcHVibGljIGRlc2NyaXB0aW9uID0gXCJBZGRzIHN1cHBvcnQgZm9yIGRpc3BsYXlpbmcgcmVmZXJlbmNlcyBpbiB0aGUgZWRpdG9yLlwiO1xyXG59XHJcblxyXG5mdW5jdGlvbiBpc0xpbmVWaXNpYmxlKGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yLCBsaW5lOiBudW1iZXIpIHtcclxuICAgIGNvbnN0IGVsZW1lbnQ6IGFueSA9IGF0b20udmlld3MuZ2V0VmlldyhlZGl0b3IpO1xyXG4gICAgY29uc3QgdG9wID0gZWxlbWVudC5nZXRGaXJzdFZpc2libGVTY3JlZW5Sb3coKTtcclxuICAgIGNvbnN0IGJvdHRvbSA9IGVsZW1lbnQuZ2V0TGFzdFZpc2libGVTY3JlZW5Sb3coKTtcclxuXHJcbiAgICBpZiAobGluZSA8PSB0b3AgfHwgbGluZSA+PSBib3R0b20pXHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgcmV0dXJuIHRydWU7XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBMZW5zIGltcGxlbWVudHMgSURpc3Bvc2FibGUge1xyXG4gICAgcHJpdmF0ZSBfdXBkYXRlOiBTdWJqZWN0PGJvb2xlYW4+O1xyXG4gICAgcHJpdmF0ZSBfcm93OiBudW1iZXI7XHJcbiAgICBwcml2YXRlIF9kZWNvcmF0aW9uOiBJRGVjb3JhdGlvbjtcclxuICAgIHByaXZhdGUgX2Rpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG4gICAgcHJpdmF0ZSBfZWxlbWVudDogSFRNTERpdkVsZW1lbnQ7XHJcbiAgICBwcml2YXRlIF91cGRhdGVPYnNlcnZhYmxlOiBPYnNlcnZhYmxlPG51bWJlcj47XHJcbiAgICBwcml2YXRlIF9wYXRoOiBzdHJpbmc7XHJcblxyXG4gICAgcHVibGljIGxvYWRlZDogYm9vbGVhbiA9IGZhbHNlO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgX2VkaXRvcjogQXRvbS5UZXh0RWRpdG9yLCBwcml2YXRlIF9tZW1iZXI6IE1vZGVscy5RdWlja0ZpeCwgcHJpdmF0ZSBfbWFya2VyOiBBdG9tLk1hcmtlciwgcHJpdmF0ZSBfcmFuZ2U6IFRleHRCdWZmZXIuUmFuZ2UsIGRpc3Bvc2VyOiBJRGlzcG9zYWJsZSkge1xyXG4gICAgICAgIHRoaXMuX3JvdyA9IF9yYW5nZS5nZXRSb3dzKClbMF07XHJcbiAgICAgICAgdGhpcy5fdXBkYXRlID0gbmV3IFN1YmplY3Q8YW55PigpO1xyXG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKHRoaXMuX3VwZGF0ZSk7XHJcbiAgICAgICAgdGhpcy5fcGF0aCA9IF9lZGl0b3IuZ2V0UGF0aCgpO1xyXG5cclxuICAgICAgICB0aGlzLl91cGRhdGVPYnNlcnZhYmxlID0gdGhpcy5fdXBkYXRlXHJcbiAgICAgICAgICAgIC5maWx0ZXIoeCA9PiAhIXgpXHJcbiAgICAgICAgICAgIC5mbGF0TWFwKCgpID0+IE9tbmkucmVxdWVzdCh0aGlzLl9lZGl0b3IsIHNvbHV0aW9uID0+XHJcbiAgICAgICAgICAgICAgICBzb2x1dGlvbi5maW5kdXNhZ2VzKHsgRmlsZU5hbWU6IHRoaXMuX3BhdGgsIENvbHVtbjogdGhpcy5fbWVtYmVyLkNvbHVtbiArIDEsIExpbmU6IHRoaXMuX21lbWJlci5MaW5lLCBCdWZmZXI6IG51bGwsIENoYW5nZXM6IG51bGwgfSwgeyBzaWxlbnQ6IHRydWUgfSkpKVxyXG4gICAgICAgICAgICAuZmlsdGVyKHggPT4geCAmJiB4LlF1aWNrRml4ZXMgJiYgISF4LlF1aWNrRml4ZXMubGVuZ3RoKVxyXG4gICAgICAgICAgICAubWFwKHggPT4geCAmJiB4LlF1aWNrRml4ZXMgJiYgeC5RdWlja0ZpeGVzLmxlbmd0aCAtIDEpXHJcbiAgICAgICAgICAgIC5zaGFyZSgpO1xyXG5cclxuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZCh0aGlzLl91cGRhdGVPYnNlcnZhYmxlXHJcbiAgICAgICAgICAgIC50YWtlKDEpXHJcbiAgICAgICAgICAgIC5maWx0ZXIoeCA9PiB4ID4gMClcclxuICAgICAgICAgICAgLmRvKCgpID0+IHRoaXMubG9hZGVkID0gdHJ1ZSlcclxuICAgICAgICAgICAgLnN1YnNjcmliZSgoeCkgPT4gdGhpcy5fZGVjb3JhdGUoeCkpKTtcclxuXHJcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoZGlzcG9zZXIpO1xyXG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKHRoaXMuX21hcmtlci5vbkRpZERlc3Ryb3koKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLmRpc3Bvc2UoKTtcclxuICAgICAgICB9KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHVwZGF0ZVZpc2libGUoKSB7XHJcbiAgICAgICAgY29uc3QgaXNWaXNpYmxlID0gdGhpcy5faXNWaXNpYmxlKCk7XHJcbiAgICAgICAgdGhpcy5fdXBkYXRlRGVjb3JhdGlvbihpc1Zpc2libGUpO1xyXG5cclxuICAgICAgICBsZXQgcmVzdWx0OiBPYnNlcnZhYmxlPG51bWJlcj47XHJcbiAgICAgICAgaWYgKGlzVmlzaWJsZSkge1xyXG4gICAgICAgICAgICByZXN1bHQgPSB0aGlzLl91cGRhdGVPYnNlcnZhYmxlLnRha2UoMSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmVzdWx0ID0gT2JzZXJ2YWJsZS5lbXB0eTxudW1iZXI+KCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLl9pc3N1ZVVwZGF0ZShpc1Zpc2libGUpO1xyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfaXNzdWVVcGRhdGUgPSBfLmRlYm91bmNlKChpc1Zpc2libGU6IGJvb2xlYW4pID0+IHtcclxuICAgICAgICBpZiAoIXRoaXMuX3VwZGF0ZS5pc1N0b3BwZWQpIHsgdGhpcy5fdXBkYXRlLm5leHQoaXNWaXNpYmxlKTsgfVxyXG4gICAgfSwgMjUwKTtcclxuXHJcbiAgICBwdWJsaWMgdXBkYXRlVG9wKGxpbmVIZWlnaHQ6IG51bWJlcikge1xyXG4gICAgICAgIGlmICh0aGlzLl9lbGVtZW50KVxyXG4gICAgICAgICAgICB0aGlzLl9lbGVtZW50LnN0eWxlLnRvcCA9IGAtJHtsaW5lSGVpZ2h0fXB4YDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgaW52YWxpZGF0ZSgpIHtcclxuICAgICAgICBjb25zdCBzZWxmIDogU3Vic2NyaXB0aW9uID0gdGhpcy5fdXBkYXRlT2JzZXJ2YWJsZVxyXG4gICAgICAgICAgICAudGFrZSgxKVxyXG4gICAgICAgICAgICAuZG8oKCkgPT4gdGhpcy5fZGlzcG9zYWJsZS5yZW1vdmUoc2VsZikpXHJcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoeCA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoeCA8PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9lbGVtZW50KSB7ICh0aGlzLl9lbGVtZW50LnRleHRDb250ZW50ID0geC50b1N0cmluZygpKTsgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChzZWxmKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgaXNFcXVhbChtYXJrZXI6IEF0b20uTWFya2VyKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX21hcmtlci5pc0VxdWFsKDxhbnk+bWFya2VyKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9pc1Zpc2libGUoKSB7XHJcbiAgICAgICAgcmV0dXJuIGlzTGluZVZpc2libGUodGhpcy5fZWRpdG9yLCB0aGlzLl9yb3cpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX3VwZGF0ZURlY29yYXRpb24oaXNWaXNpYmxlOiBib29sZWFuKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuX2RlY29yYXRpb24gJiYgdGhpcy5fZWxlbWVudCkge1xyXG4gICAgICAgICAgICBjb25zdCBlbGVtZW50ID0gdGhpcy5fZWxlbWVudDtcclxuICAgICAgICAgICAgaWYgKGlzVmlzaWJsZSkge1xyXG4gICAgICAgICAgICAgICAgZmFzdGRvbS5tZWFzdXJlKCgpID0+IGVsZW1lbnQuc3R5bGUuZGlzcGxheSA9PT0gXCJub25lXCIgJiYgZmFzdGRvbS5tdXRhdGUoKCkgPT4gZWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gXCJcIikpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgZmFzdGRvbS5tZWFzdXJlKCgpID0+IGVsZW1lbnQuc3R5bGUuZGlzcGxheSAhPT0gXCJub25lXCIgJiYgZmFzdGRvbS5tdXRhdGUoKCkgPT4gZWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCIpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9kZWNvcmF0ZShjb3VudDogbnVtYmVyKSB7XHJcbiAgICAgICAgY29uc3QgbGluZUhlaWdodCA9IHRoaXMuX2VkaXRvci5nZXRMaW5lSGVpZ2h0SW5QaXhlbHMoKTtcclxuXHJcbiAgICAgICAgY29uc3QgZWxlbWVudCA9IHRoaXMuX2VsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gICAgICAgIGVsZW1lbnQuc3R5bGUucG9zaXRpb24gPSBcInJlbGF0aXZlXCI7XHJcbiAgICAgICAgZWxlbWVudC5zdHlsZS50b3AgPSBgLSR7bGluZUhlaWdodH1weGA7XHJcbiAgICAgICAgZWxlbWVudC5zdHlsZS5sZWZ0ID0gXCIxNnB4XCI7XHJcbiAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkKFwiaGlnaGxpZ2h0LWluZm9cIiwgXCJiYWRnZVwiLCBcImJhZGdlLXNtYWxsXCIpO1xyXG4gICAgICAgIGVsZW1lbnQudGV4dENvbnRlbnQgPSBjb3VudC50b1N0cmluZygpO1xyXG4gICAgICAgIGVsZW1lbnQub25jbGljayA9ICgpID0+IE9tbmkucmVxdWVzdCh0aGlzLl9lZGl0b3IsIHMgPT4gcy5maW5kdXNhZ2VzKHsgRmlsZU5hbWU6IHRoaXMuX3BhdGgsIENvbHVtbjogdGhpcy5fbWVtYmVyLkNvbHVtbiArIDEsIExpbmU6IHRoaXMuX21lbWJlci5MaW5lLCBCdWZmZXI6IG51bGwsIENoYW5nZXM6IG51bGwgfSkpO1xyXG5cclxuICAgICAgICAvLyBUT0RPOiBCbG9jayBkZWNvcmF0aW9uc1xyXG4gICAgICAgIC8vIHRoaXMuX2RlY29yYXRpb24gPSA8YW55PnRoaXMuX2VkaXRvci5kZWNvcmF0ZU1hcmtlcih0aGlzLl9tYXJrZXIsIHsgdHlwZTogXCJibG9ja1wiLCBjbGFzczogYGNvZGVsZW5zYCwgaXRlbTogdGhpcy5fZWxlbWVudCwgcG9zaXRpb246IFwiYmVmb3JlXCIgfSk7XHJcbiAgICAgICAgdGhpcy5fZGVjb3JhdGlvbiA9IDxhbnk+dGhpcy5fZWRpdG9yLmRlY29yYXRlTWFya2VyKHRoaXMuX21hcmtlciwgeyB0eXBlOiBcIm92ZXJsYXlcIiwgY2xhc3M6IGBjb2RlbGVuc2AsIGl0ZW06IHRoaXMuX2VsZW1lbnQsIHBvc2l0aW9uOiBcImhlYWRcIiB9KTtcclxuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuX2VsZW1lbnQucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLl9kZWNvcmF0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9kZWNvcmF0aW9uLmRlc3Ryb3koKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLl9lbGVtZW50ID0gbnVsbDtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIGNvbnN0IGlzVmlzaWJsZSA9IGlzTGluZVZpc2libGUodGhpcy5fZWRpdG9yLCB0aGlzLl9yb3cpO1xyXG4gICAgICAgIGlmICghaXNWaXNpYmxlKSB7XHJcbiAgICAgICAgICAgIGVsZW1lbnQuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2RlY29yYXRpb247XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7IHJldHVybiB0aGlzLl9kaXNwb3NhYmxlLmRpc3Bvc2UoKTsgfVxyXG59XHJcblxyXG5leHBvcnQgY29uc3QgY29kZUxlbnMgPSBuZXcgQ29kZUxlbnMoKTtcclxuIl19
