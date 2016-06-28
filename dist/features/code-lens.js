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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9jb2RlLWxlbnMuanMiLCJsaWIvZmVhdHVyZXMvY29kZS1sZW5zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOzs7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7OztBQ0dBLElBQUksVUFBMEIsUUFBUSxTQUFSLENBQTFCOztJQVNKO0FBQUEsd0JBQUE7OztBQUVZLGFBQUEsV0FBQSxHQUFjLElBQUksT0FBSixFQUFkLENBRlo7QUF5SVcsYUFBQSxRQUFBLEdBQVcsS0FBWCxDQXpJWDtBQTBJVyxhQUFBLEtBQUEsR0FBUSxXQUFSLENBMUlYO0FBMklXLGFBQUEsV0FBQSxHQUFjLHVEQUFkLENBM0lYO0tBQUE7Ozs7bUNBSW1COzs7QUFDWCxpQkFBSyxVQUFMLEdBQWtCLDBDQUFsQixDQURXO0FBR1gsaUJBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQixXQUFLLFVBQUwsQ0FBZ0IsVUFBQyxNQUFELEVBQVMsRUFBVCxFQUFXO0FBQzNDLG1CQUFHLEdBQUgsQ0FBTyw0QkFBVyxNQUFYLENBQWtCLFlBQUE7QUFDckIsd0JBQU0sVUFBVSxNQUFLLFdBQUwsQ0FBaUIsR0FBakIsQ0FBcUIsTUFBckIsQ0FBVixDQURlO0FBR3JCLHdCQUFJLE9BQUosRUFBYTtBQUNULGdDQUFRLE9BQVIsQ0FBZ0I7bUNBQVUsT0FBTyxPQUFQO3lCQUFWLENBQWhCLENBRFM7cUJBQWI7QUFJQSwwQkFBSyxXQUFMLENBQWlCLE1BQWpCLENBQXdCLE1BQXhCLEVBUHFCO2lCQUFBLENBQXpCLEVBRDJDO0FBVzNDLG1CQUFHLEdBQUgsQ0FBTyxLQUFLLE1BQUwsQ0FBWSxPQUFaLENBQW9CLGlCQUFwQixFQUF1QyxVQUFDLElBQUQsRUFBYTtBQUN2RCx3QkFBTSxjQUFjLE1BQUssV0FBTCxDQUFpQixHQUFqQixDQUFxQixNQUFyQixDQUFkLENBRGlEO0FBRXZELHdCQUFNLGFBQWEsT0FBTyxxQkFBUCxFQUFiLENBRmlEO0FBR3ZELHdCQUFJLGVBQWUsVUFBZixFQUEyQjtBQUMzQixvQ0FBWSxPQUFaLENBQW9CO21DQUFjLFdBQVcsU0FBWCxDQUFxQixVQUFyQjt5QkFBZCxDQUFwQixDQUQyQjtxQkFBL0I7aUJBSDBDLENBQTlDLEVBWDJDO2FBQVgsQ0FBcEMsRUFIVztBQXVCWCxpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLFdBQUssa0JBQUwsQ0FBd0IsVUFBQyxNQUFELEVBQVMsRUFBVCxFQUFXO0FBQ25ELG9CQUFNLFFBQVEsTUFBSyxXQUFMLENBQWlCLEdBQWpCLENBQXFCLE1BQXJCLENBQVIsQ0FENkM7QUFFbkQsb0JBQUksQ0FBQyxLQUFELEVBQVEsTUFBSyxXQUFMLENBQWlCLEdBQWpCLENBQXFCLE1BQXJCLEVBQTZCLElBQUksR0FBSixFQUE3QixFQUFaO0FBRUEsb0JBQU0sVUFBVSxtQkFBVixDQUo2QztBQU1uRCxtQkFBRyxHQUFILENBQU8sUUFDRixNQURFLENBQ0s7MkJBQUssQ0FBQyxDQUFDLENBQUQsSUFBTSxDQUFDLE9BQU8sV0FBUCxFQUFEO2lCQUFaLENBREwsQ0FFRixvQkFGRSxDQUVtQjsyQkFBSyxDQUFDLENBQUMsQ0FBRDtpQkFBTixDQUZuQixDQUdGLFlBSEUsQ0FHVyxHQUhYLEVBSUYsU0FKRSxDQUlROzJCQUFNLE1BQUssY0FBTCxDQUFvQixNQUFwQjtpQkFBTixDQUpSLENBS0YsU0FMRSxFQUFQLEVBTm1EO0FBY25ELG9CQUFNLGdCQUFnQixTQUFoQixhQUFnQixHQUFBO0FBQ2xCLHdCQUFNLFlBQVksT0FBTyxTQUFQLEdBQW1CLFdBQW5CLENBQStCLFlBQUE7QUFDN0Msa0NBQVUsT0FBVixHQUQ2QztBQUU3QywyQkFBRyxNQUFILENBQVUsU0FBVixFQUY2QztBQUk3QyxnQ0FBUSxJQUFSLENBQWEsS0FBYixFQUo2QztxQkFBQSxDQUEzQyxDQURZO0FBUWxCLHVCQUFHLEdBQUgsQ0FBTyxTQUFQLEVBUmtCO2lCQUFBLENBZDZCO0FBeUJuRCxtQkFBRyxHQUFILENBQU8sT0FBTyxTQUFQLEdBQW1CLGlCQUFuQixDQUFxQyxpQkFBRSxRQUFGLENBQVcsWUFBQTtBQUNuRCx3QkFBSSxDQUFDLFFBQVEsY0FBUixFQUF3QixRQUFRLElBQVIsQ0FBYSxJQUFiLEVBQTdCO0FBQ0Esb0NBRm1EO2lCQUFBLEVBR3BELElBSHlDLENBQXJDLENBQVAsRUF6Qm1EO0FBOEJuRCxtQkFBRyxHQUFILENBQU8sT0FBTyxTQUFQLEdBQW1CLFNBQW5CLENBQTZCOzJCQUFNLFFBQVEsSUFBUixDQUFhLElBQWI7aUJBQU4sQ0FBcEMsRUE5Qm1EO0FBK0JuRCxtQkFBRyxHQUFILENBQU8sT0FBTyxTQUFQLEdBQW1CLFdBQW5CLENBQStCOzJCQUFNLFFBQVEsSUFBUixDQUFhLElBQWI7aUJBQU4sQ0FBdEMsRUEvQm1EO0FBZ0NuRCxtQkFBRyxHQUFILENBQU8saUJBQVcsS0FBWCxDQUFpQixJQUFqQixFQUF1QixTQUF2QixDQUFpQzsyQkFBTSxRQUFRLElBQVIsQ0FBYSxJQUFiO2lCQUFOLENBQXhDLEVBaENtRDtBQWtDbkQsbUJBQUcsR0FBSCxDQUFPLE9BQU8sb0JBQVAsQ0FBNEI7MkJBQU0sTUFBSywwQkFBTCxDQUFnQyxNQUFoQztpQkFBTixDQUFuQyxFQWxDbUQ7QUFvQ25ELG1CQUFHLEdBQUgsQ0FBTyxLQUFLLFFBQUwsQ0FBYyxjQUFkLENBQTZCLFVBQUMsS0FBRCxFQUFhO0FBQzdDLHdCQUFJLGlCQUFFLFFBQUYsQ0FBVyxDQUFDLDRCQUFELEVBQStCLDBCQUEvQixFQUEyRCwwQkFBM0QsQ0FBWCxFQUFtRyxNQUFNLElBQU4sQ0FBdkcsRUFBb0g7QUFDaEgsOEJBQUssMEJBQUwsQ0FBZ0MsTUFBaEMsRUFEZ0g7cUJBQXBIO2lCQURnQyxDQUFwQyxFQXBDbUQ7QUEwQ25ELG1CQUFHLEdBQUgsQ0FBTyxPQUFQLEVBMUNtRDtBQTJDbkQsc0JBQUssMEJBQUwsQ0FBZ0MsTUFBaEMsRUEzQ21EO2FBQVgsQ0FBNUMsRUF2Qlc7Ozs7bURBc0VtQixRQUF1QjtBQUNyRCxnQkFBSSxDQUFDLEtBQUssV0FBTCxDQUFpQixHQUFqQixDQUFxQixNQUFyQixDQUFELEVBQStCLEtBQUssV0FBTCxDQUFpQixHQUFqQixDQUFxQixNQUFyQixFQUE2QixJQUFJLEdBQUosRUFBN0IsRUFBbkM7QUFDQSxnQkFBTSxjQUFjLEtBQUssV0FBTCxDQUFpQixHQUFqQixDQUFxQixNQUFyQixDQUFkLENBRitDO0FBR3JELHdCQUFZLE9BQVosQ0FBb0I7dUJBQWMsV0FBVyxhQUFYO2FBQWQsQ0FBcEIsQ0FIcUQ7Ozs7a0NBTTNDO0FBQ1YsaUJBQUssVUFBTCxDQUFnQixPQUFoQixHQURVOzs7O3VDQUlRLFFBQXVCO0FBQ3pDLGdCQUFJLENBQUMsS0FBSyxXQUFMLENBQWlCLEdBQWpCLENBQXFCLE1BQXJCLENBQUQsRUFBK0IsS0FBSyxXQUFMLENBQWlCLEdBQWpCLENBQXFCLE1BQXJCLEVBQTZCLElBQUksR0FBSixFQUE3QixFQUFuQztBQUNBLGdCQUFNLGNBQWMsS0FBSyxXQUFMLENBQWlCLEdBQWpCLENBQXFCLE1BQXJCLENBQWQsQ0FGbUM7QUFJekMsZ0JBQU0sVUFBVSxJQUFJLE9BQUosRUFBVixDQUptQztBQU16QyxnQkFBSSxPQUFPLFdBQVAsRUFBSixFQUEwQjtBQUN0Qix1QkFBTyxpQkFBVyxLQUFYLEVBQVAsQ0FEc0I7YUFBMUI7QUFJQSxtQkFBTyxXQUFLLE9BQUwsQ0FBYSxNQUFiLEVBQXFCO3VCQUFZLFNBQVMsd0JBQVQsQ0FBa0MsRUFBRSxRQUFRLElBQVIsRUFBYyxTQUFTLElBQVQsRUFBbEQ7YUFBWixDQUFyQixDQUNGLE1BREUsQ0FDSzt1QkFBZSxDQUFDLENBQUMsV0FBRDthQUFoQixDQURMLENBRUYsT0FGRSxDQUVNO3VCQUFlO2FBQWYsQ0FGTixDQUdGLFNBSEUsQ0FHUSxzQkFBVTtBQUNqQixvQkFBTSxRQUErQixPQUFPLFNBQVAsR0FBbUIsV0FBbkIsQ0FBK0IsV0FBVyxJQUFYLEVBQWlCLEtBQWhELENBQS9CLENBRFc7QUFJakIsb0JBQU0sU0FBNEIsT0FBUSxlQUFSLENBQXdCLEtBQXhCLEVBQStCLEVBQUUsWUFBWSxRQUFaLEVBQWpDLENBQTVCLENBSlc7QUFLakIsb0JBQUksYUFBSixDQUxpQjtBQU9qQixvQkFBTSxXQUFXLFlBQVksTUFBWixFQUFYLENBUFc7QUFRakIsb0JBQUksYUFBYSxTQUFTLElBQVQsRUFBYixDQVJhO0FBU2pCLHVCQUFPLENBQUMsV0FBVyxJQUFYLEVBQWlCO0FBQ3JCLHdCQUFJLFdBQVcsS0FBWCxDQUFpQixPQUFqQixDQUF5QixNQUF6QixDQUFKLEVBQXNDO0FBQ2xDLCtCQUFPLFdBQVcsS0FBWCxDQUQyQjtBQUVsQyw4QkFGa0M7cUJBQXRDO0FBSUEsaUNBQWEsU0FBUyxJQUFULEVBQWIsQ0FMcUI7aUJBQXpCO0FBUUEsb0JBQUksSUFBSixFQUFVO0FBQ04sNEJBQVEsR0FBUixDQUFZLElBQVosRUFETTtBQUVOLHlCQUFLLFVBQUwsR0FGTTtpQkFBVixNQUdPO0FBQ0gsMkJBQU8sSUFBSSxJQUFKLENBQVMsTUFBVCxFQUFpQixVQUFqQixFQUE2QixNQUE3QixFQUFxQyxLQUFyQyxFQUE0Qyw0QkFBVyxNQUFYLENBQWtCLFlBQUE7QUFDakUsb0NBQVksTUFBWixDQUFtQixJQUFuQixFQURpRTtxQkFBQSxDQUE5RCxDQUFQLENBREc7QUFJSCw0QkFBUSxHQUFSLENBQVksSUFBWixFQUpHO0FBS0gsZ0NBQVksR0FBWixDQUFnQixJQUFoQixFQUxHO2lCQUhQO0FBV0EsdUJBQU8sS0FBSyxhQUFMLEVBQVAsQ0E1QmlCO2FBQVYsQ0FIUixDQWlDRixFQWpDRSxDQWlDQyxFQUFFLFVBQVUsb0JBQUE7QUFFWixnQ0FBWSxPQUFaLENBQW9CLGdCQUFJO0FBQ3BCLDRCQUFJLFFBQVEsQ0FBQyxRQUFRLEdBQVIsQ0FBWSxJQUFaLENBQUQsRUFBb0I7QUFDNUIsaUNBQUssT0FBTCxHQUQ0Qjt5QkFBaEM7cUJBRGdCLENBQXBCLENBRlk7aUJBQUEsRUFqQ2IsQ0FBUCxDQVZ5Qzs7Ozs7OztBQTBEakQsU0FBQSxhQUFBLENBQXVCLE1BQXZCLEVBQWdELElBQWhELEVBQTREO0FBQ3hELFFBQU0sVUFBZSxLQUFLLEtBQUwsQ0FBVyxPQUFYLENBQW1CLE1BQW5CLENBQWYsQ0FEa0Q7QUFFeEQsUUFBTSxNQUFNLFFBQVEsd0JBQVIsRUFBTixDQUZrRDtBQUd4RCxRQUFNLFNBQVMsUUFBUSx1QkFBUixFQUFULENBSGtEO0FBS3hELFFBQUksUUFBUSxHQUFSLElBQWUsUUFBUSxNQUFSLEVBQ2YsT0FBTyxLQUFQLENBREo7QUFFQSxXQUFPLElBQVAsQ0FQd0Q7Q0FBNUQ7O0lBVUE7QUFXSSxrQkFBb0IsT0FBcEIsRUFBc0QsT0FBdEQsRUFBd0YsT0FBeEYsRUFBc0gsTUFBdEgsRUFBZ0osUUFBaEosRUFBcUs7Ozs7O0FBQWpKLGFBQUEsT0FBQSxHQUFBLE9BQUEsQ0FBaUo7QUFBL0csYUFBQSxPQUFBLEdBQUEsT0FBQSxDQUErRztBQUE3RSxhQUFBLE9BQUEsR0FBQSxPQUFBLENBQTZFO0FBQS9DLGFBQUEsTUFBQSxHQUFBLE1BQUEsQ0FBK0M7QUFQN0osYUFBQSxXQUFBLEdBQWMsMENBQWQsQ0FPNko7QUFGOUosYUFBQSxNQUFBLEdBQWtCLEtBQWxCLENBRThKO0FBeUM3SixhQUFBLFlBQUEsR0FBZSxpQkFBRSxRQUFGLENBQVcsVUFBQyxTQUFELEVBQW1CO0FBQ2pELGdCQUFJLENBQUMsT0FBSyxPQUFMLENBQWEsY0FBYixFQUE2QjtBQUFFLHVCQUFLLE9BQUwsQ0FBYSxJQUFiLENBQWtCLFNBQWxCLEVBQUY7YUFBbEM7U0FEOEIsRUFFL0IsR0FGb0IsQ0FBZixDQXpDNko7QUFDakssYUFBSyxJQUFMLEdBQVksT0FBTyxPQUFQLEdBQWlCLENBQWpCLENBQVosQ0FEaUs7QUFFakssYUFBSyxPQUFMLEdBQWUsbUJBQWYsQ0FGaUs7QUFHakssYUFBSyxXQUFMLENBQWlCLEdBQWpCLENBQXFCLEtBQUssT0FBTCxDQUFyQixDQUhpSztBQUlqSyxhQUFLLEtBQUwsR0FBYSxRQUFRLE9BQVIsRUFBYixDQUppSztBQU1qSyxhQUFLLGlCQUFMLEdBQXlCLEtBQUssT0FBTCxDQUNwQixNQURvQixDQUNiO21CQUFLLENBQUMsQ0FBQyxDQUFEO1NBQU4sQ0FEYSxDQUVwQixPQUZvQixDQUVaO21CQUFNLFdBQUssT0FBTCxDQUFhLE9BQUssT0FBTCxFQUFjO3VCQUN0QyxTQUFTLFVBQVQsQ0FBb0IsRUFBRSxVQUFVLE9BQUssS0FBTCxFQUFZLFFBQVEsT0FBSyxPQUFMLENBQWEsTUFBYixHQUFzQixDQUF0QixFQUF5QixNQUFNLE9BQUssT0FBTCxDQUFhLElBQWIsRUFBbUIsUUFBUSxJQUFSLEVBQWMsU0FBUyxJQUFULEVBQXBILEVBQXFJLEVBQUUsUUFBUSxJQUFSLEVBQXZJO2FBRHNDO1NBQWpDLENBRlksQ0FJcEIsTUFKb0IsQ0FJYjttQkFBSyxLQUFLLEVBQUUsVUFBRixJQUFnQixDQUFDLENBQUMsRUFBRSxVQUFGLENBQWEsTUFBYjtTQUE1QixDQUphLENBS3BCLEdBTG9CLENBS2hCO21CQUFLLEtBQUssRUFBRSxVQUFGLElBQWdCLEVBQUUsVUFBRixDQUFhLE1BQWIsR0FBc0IsQ0FBdEI7U0FBMUIsQ0FMZ0IsQ0FNcEIsS0FOb0IsRUFBekIsQ0FOaUs7QUFjakssYUFBSyxXQUFMLENBQWlCLEdBQWpCLENBQXFCLEtBQUssaUJBQUwsQ0FDaEIsSUFEZ0IsQ0FDWCxDQURXLEVBRWhCLE1BRmdCLENBRVQ7bUJBQUssSUFBSSxDQUFKO1NBQUwsQ0FGUyxDQUdoQixFQUhnQixDQUdiO21CQUFNLE9BQUssTUFBTCxHQUFjLElBQWQ7U0FBTixDQUhhLENBSWhCLFNBSmdCLENBSU4sVUFBQyxDQUFEO21CQUFPLE9BQUssU0FBTCxDQUFlLENBQWY7U0FBUCxDQUpmLEVBZGlLO0FBb0JqSyxhQUFLLFdBQUwsQ0FBaUIsR0FBakIsQ0FBcUIsUUFBckIsRUFwQmlLO0FBcUJqSyxhQUFLLFdBQUwsQ0FBaUIsR0FBakIsQ0FBcUIsS0FBSyxPQUFMLENBQWEsWUFBYixDQUEwQixZQUFBO0FBQzNDLG1CQUFLLE9BQUwsR0FEMkM7U0FBQSxDQUEvQyxFQXJCaUs7S0FBcks7Ozs7d0NBMEJvQjtBQUNoQixnQkFBTSxZQUFZLEtBQUssVUFBTCxFQUFaLENBRFU7QUFFaEIsaUJBQUssaUJBQUwsQ0FBdUIsU0FBdkIsRUFGZ0I7QUFJaEIsZ0JBQUksZUFBSixDQUpnQjtBQUtoQixnQkFBSSxTQUFKLEVBQWU7QUFDWCx5QkFBUyxLQUFLLGlCQUFMLENBQXVCLElBQXZCLENBQTRCLENBQTVCLENBQVQsQ0FEVzthQUFmLE1BRU87QUFDSCx5QkFBUyxpQkFBVyxLQUFYLEVBQVQsQ0FERzthQUZQO0FBTUEsaUJBQUssWUFBTCxDQUFrQixTQUFsQixFQVhnQjtBQVloQixtQkFBTyxNQUFQLENBWmdCOzs7O2tDQW1CSCxZQUFrQjtBQUMvQixnQkFBSSxLQUFLLFFBQUwsRUFDQSxLQUFLLFFBQUwsQ0FBYyxLQUFkLENBQW9CLEdBQXBCLFNBQThCLGlCQUE5QixDQURKOzs7O3FDQUlhOzs7QUFDYixnQkFBTSxPQUFzQixLQUFLLGlCQUFMLENBQ3ZCLElBRHVCLENBQ2xCLENBRGtCLEVBRXZCLEVBRnVCLENBRXBCO3VCQUFNLE9BQUssV0FBTCxDQUFpQixNQUFqQixDQUF3QixJQUF4QjthQUFOLENBRm9CLENBR3ZCLFNBSHVCLENBR2IsYUFBQztBQUNSLG9CQUFJLEtBQUssQ0FBTCxFQUFRO0FBQ1IsMkJBQUssT0FBTCxHQURRO2lCQUFaLE1BRU87QUFDSCx3QkFBSSxPQUFLLFFBQUwsRUFBZTtBQUFFLDhCQUFDLENBQUssUUFBTCxDQUFjLFdBQWQsR0FBNEIsRUFBRSxRQUFGLEVBQTVCLENBQUg7cUJBQW5CO2lCQUhKO2FBRE8sQ0FIVCxDQURPO0FBV2IsaUJBQUssV0FBTCxDQUFpQixHQUFqQixDQUFxQixJQUFyQixFQVhhOzs7O2dDQWNGLFFBQW1CO0FBQzlCLG1CQUFPLEtBQUssT0FBTCxDQUFhLE9BQWIsQ0FBMEIsTUFBMUIsQ0FBUCxDQUQ4Qjs7OztxQ0FJaEI7QUFDZCxtQkFBTyxjQUFjLEtBQUssT0FBTCxFQUFjLEtBQUssSUFBTCxDQUFuQyxDQURjOzs7OzBDQUlRLFdBQWtCOzs7QUFDeEMsZ0JBQUksS0FBSyxXQUFMLElBQW9CLEtBQUssUUFBTCxFQUFlOztBQUNuQyx3QkFBTSxVQUFVLE9BQUssUUFBTDtBQUNoQix3QkFBSSxTQUFKLEVBQWU7QUFDWCxnQ0FBUSxPQUFSLENBQWdCO21DQUFNLFFBQVEsS0FBUixDQUFjLE9BQWQsS0FBMEIsTUFBMUIsSUFBb0MsUUFBUSxNQUFSLENBQWU7dUNBQU0sUUFBUSxLQUFSLENBQWMsT0FBZCxHQUF3QixFQUF4Qjs2QkFBTixDQUFuRDt5QkFBTixDQUFoQixDQURXO3FCQUFmLE1BRU87QUFDSCxnQ0FBUSxPQUFSLENBQWdCO21DQUFNLFFBQVEsS0FBUixDQUFjLE9BQWQsS0FBMEIsTUFBMUIsSUFBb0MsUUFBUSxNQUFSLENBQWU7dUNBQU0sUUFBUSxLQUFSLENBQWMsT0FBZCxHQUF3QixNQUF4Qjs2QkFBTixDQUFuRDt5QkFBTixDQUFoQixDQURHO3FCQUZQO3FCQUZtQzthQUF2Qzs7OztrQ0FVYyxPQUFhOzs7QUFDM0IsZ0JBQU0sYUFBYSxLQUFLLE9BQUwsQ0FBYSxxQkFBYixFQUFiLENBRHFCO0FBRzNCLGdCQUFNLFVBQVUsS0FBSyxRQUFMLEdBQWdCLFNBQVMsYUFBVCxDQUF1QixLQUF2QixDQUFoQixDQUhXO0FBSTNCLG9CQUFRLEtBQVIsQ0FBYyxRQUFkLEdBQXlCLFVBQXpCLENBSjJCO0FBSzNCLG9CQUFRLEtBQVIsQ0FBYyxHQUFkLFNBQXdCLGlCQUF4QixDQUwyQjtBQU0zQixvQkFBUSxLQUFSLENBQWMsSUFBZCxHQUFxQixNQUFyQixDQU4yQjtBQU8zQixvQkFBUSxTQUFSLENBQWtCLEdBQWxCLENBQXNCLGdCQUF0QixFQUF3QyxPQUF4QyxFQUFpRCxhQUFqRCxFQVAyQjtBQVEzQixvQkFBUSxXQUFSLEdBQXNCLE1BQU0sUUFBTixFQUF0QixDQVIyQjtBQVMzQixvQkFBUSxPQUFSLEdBQWtCO3VCQUFNLFdBQUssT0FBTCxDQUFhLE9BQUssT0FBTCxFQUFjOzJCQUFLLEVBQUUsVUFBRixDQUFhLEVBQUUsVUFBVSxPQUFLLEtBQUwsRUFBWSxRQUFRLE9BQUssT0FBTCxDQUFhLE1BQWIsR0FBc0IsQ0FBdEIsRUFBeUIsTUFBTSxPQUFLLE9BQUwsQ0FBYSxJQUFiLEVBQW1CLFFBQVEsSUFBUixFQUFjLFNBQVMsSUFBVCxFQUE3RztpQkFBTDthQUFqQyxDQVRTO0FBYTNCLGlCQUFLLFdBQUwsR0FBd0IsS0FBSyxPQUFMLENBQWEsY0FBYixDQUE0QixLQUFLLE9BQUwsRUFBYyxFQUFFLE1BQU0sU0FBTixFQUFpQixpQkFBbkIsRUFBc0MsTUFBTSxLQUFLLFFBQUwsRUFBZSxVQUFVLE1BQVYsRUFBckcsQ0FBeEIsQ0FiMkI7QUFjM0IsaUJBQUssV0FBTCxDQUFpQixHQUFqQixDQUFxQiw0QkFBVyxNQUFYLENBQWtCLFlBQUE7QUFDbkMsdUJBQUssUUFBTCxDQUFjLE1BQWQsR0FEbUM7QUFFbkMsb0JBQUksT0FBSyxXQUFMLEVBQWtCO0FBQ2xCLDJCQUFLLFdBQUwsQ0FBaUIsT0FBakIsR0FEa0I7aUJBQXRCO0FBR0EsdUJBQUssUUFBTCxHQUFnQixJQUFoQixDQUxtQzthQUFBLENBQXZDLEVBZDJCO0FBc0IzQixnQkFBTSxZQUFZLGNBQWMsS0FBSyxPQUFMLEVBQWMsS0FBSyxJQUFMLENBQXhDLENBdEJxQjtBQXVCM0IsZ0JBQUksQ0FBQyxTQUFELEVBQVk7QUFDWix3QkFBUSxLQUFSLENBQWMsT0FBZCxHQUF3QixNQUF4QixDQURZO2FBQWhCO0FBSUEsbUJBQU8sS0FBSyxXQUFMLENBM0JvQjs7OztrQ0E4QmpCO0FBQUssbUJBQU8sS0FBSyxXQUFMLENBQWlCLE9BQWpCLEVBQVAsQ0FBTDs7Ozs7OztBQUdYLElBQU0sOEJBQVcsSUFBSSxRQUFKLEVBQVgiLCJmaWxlIjoibGliL2ZlYXR1cmVzL2NvZGUtbGVucy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcbmltcG9ydCB7IE9ic2VydmFibGUsIFN1YmplY3QgfSBmcm9tIFwicnhqc1wiO1xuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSwgRGlzcG9zYWJsZSB9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XG5pbXBvcnQgeyBPbW5pIH0gZnJvbSBcIi4uL3NlcnZlci9vbW5pXCI7XG5sZXQgZmFzdGRvbSA9IHJlcXVpcmUoXCJmYXN0ZG9tXCIpO1xuY2xhc3MgQ29kZUxlbnMge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmRlY29yYXRpb25zID0gbmV3IFdlYWtNYXAoKTtcbiAgICAgICAgdGhpcy5yZXF1aXJlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLnRpdGxlID0gXCJDb2RlIExlbnNcIjtcbiAgICAgICAgdGhpcy5kZXNjcmlwdGlvbiA9IFwiQWRkcyBzdXBwb3J0IGZvciBkaXNwbGF5aW5nIHJlZmVyZW5jZXMgaW4gdGhlIGVkaXRvci5cIjtcbiAgICB9XG4gICAgYWN0aXZhdGUoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5lYWNoRWRpdG9yKChlZGl0b3IsIGNkKSA9PiB7XG4gICAgICAgICAgICBjZC5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IG1hcmtlcnMgPSB0aGlzLmRlY29yYXRpb25zLmdldChlZGl0b3IpO1xuICAgICAgICAgICAgICAgIGlmIChtYXJrZXJzKSB7XG4gICAgICAgICAgICAgICAgICAgIG1hcmtlcnMuZm9yRWFjaChtYXJrZXIgPT4gbWFya2VyLmRpc3Bvc2UoKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuZGVjb3JhdGlvbnMuZGVsZXRlKGVkaXRvcik7XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICBjZC5hZGQoYXRvbS5jb25maWcub2JzZXJ2ZShcImVkaXRvci5mb250U2l6ZVwiLCAoc2l6ZSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGRlY29yYXRpb25zID0gdGhpcy5kZWNvcmF0aW9ucy5nZXQoZWRpdG9yKTtcbiAgICAgICAgICAgICAgICBjb25zdCBsaW5lSGVpZ2h0ID0gZWRpdG9yLmdldExpbmVIZWlnaHRJblBpeGVscygpO1xuICAgICAgICAgICAgICAgIGlmIChkZWNvcmF0aW9ucyAmJiBsaW5lSGVpZ2h0KSB7XG4gICAgICAgICAgICAgICAgICAgIGRlY29yYXRpb25zLmZvckVhY2goZGVjb3JhdGlvbiA9PiBkZWNvcmF0aW9uLnVwZGF0ZVRvcChsaW5lSGVpZ2h0KSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkpO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5zd2l0Y2hBY3RpdmVFZGl0b3IoKGVkaXRvciwgY2QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGl0ZW1zID0gdGhpcy5kZWNvcmF0aW9ucy5nZXQoZWRpdG9yKTtcbiAgICAgICAgICAgIGlmICghaXRlbXMpXG4gICAgICAgICAgICAgICAgdGhpcy5kZWNvcmF0aW9ucy5zZXQoZWRpdG9yLCBuZXcgU2V0KCkpO1xuICAgICAgICAgICAgY29uc3Qgc3ViamVjdCA9IG5ldyBTdWJqZWN0KCk7XG4gICAgICAgICAgICBjZC5hZGQoc3ViamVjdFxuICAgICAgICAgICAgICAgIC5maWx0ZXIoeCA9PiAhIXggJiYgIWVkaXRvci5pc0Rlc3Ryb3llZCgpKVxuICAgICAgICAgICAgICAgIC5kaXN0aW5jdFVudGlsQ2hhbmdlZCh4ID0+ICEheClcbiAgICAgICAgICAgICAgICAuZGVib3VuY2VUaW1lKDUwMClcbiAgICAgICAgICAgICAgICAuc3dpdGNoTWFwKCgpID0+IHRoaXMudXBkYXRlQ29kZUxlbnMoZWRpdG9yKSlcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKCkpO1xuICAgICAgICAgICAgY29uc3QgYmluZERpZENoYW5nZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBkaWRDaGFuZ2UgPSBlZGl0b3IuZ2V0QnVmZmVyKCkub25EaWRDaGFuZ2UoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBkaWRDaGFuZ2UuZGlzcG9zZSgpO1xuICAgICAgICAgICAgICAgICAgICBjZC5yZW1vdmUoZGlkQ2hhbmdlKTtcbiAgICAgICAgICAgICAgICAgICAgc3ViamVjdC5uZXh0KGZhbHNlKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjZC5hZGQoZGlkQ2hhbmdlKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBjZC5hZGQoZWRpdG9yLmdldEJ1ZmZlcigpLm9uRGlkU3RvcENoYW5naW5nKF8uZGVib3VuY2UoKCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICghc3ViamVjdC5pc1Vuc3Vic2NyaWJlZClcbiAgICAgICAgICAgICAgICAgICAgc3ViamVjdC5uZXh0KHRydWUpO1xuICAgICAgICAgICAgICAgIGJpbmREaWRDaGFuZ2UoKTtcbiAgICAgICAgICAgIH0sIDUwMDApKSk7XG4gICAgICAgICAgICBjZC5hZGQoZWRpdG9yLmdldEJ1ZmZlcigpLm9uRGlkU2F2ZSgoKSA9PiBzdWJqZWN0Lm5leHQodHJ1ZSkpKTtcbiAgICAgICAgICAgIGNkLmFkZChlZGl0b3IuZ2V0QnVmZmVyKCkub25EaWRSZWxvYWQoKCkgPT4gc3ViamVjdC5uZXh0KHRydWUpKSk7XG4gICAgICAgICAgICBjZC5hZGQoT2JzZXJ2YWJsZS50aW1lcigxMDAwKS5zdWJzY3JpYmUoKCkgPT4gc3ViamVjdC5uZXh0KHRydWUpKSk7XG4gICAgICAgICAgICBjZC5hZGQoZWRpdG9yLm9uRGlkQ2hhbmdlU2Nyb2xsVG9wKCgpID0+IHRoaXMudXBkYXRlRGVjb3JhdG9yVmlzaWJsaWxpdHkoZWRpdG9yKSkpO1xuICAgICAgICAgICAgY2QuYWRkKGF0b20uY29tbWFuZHMub25XaWxsRGlzcGF0Y2goKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKF8uaW5jbHVkZXMoW1wib21uaXNoYXJwLWF0b206dG9nZ2xlLWRvY2tcIiwgXCJvbW5pc2hhcnAtYXRvbTpzaG93LWRvY2tcIiwgXCJvbW5pc2hhcnAtYXRvbTpoaWRlLWRvY2tcIl0sIGV2ZW50LnR5cGUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlRGVjb3JhdG9yVmlzaWJsaWxpdHkoZWRpdG9yKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICBjZC5hZGQoc3ViamVjdCk7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZURlY29yYXRvclZpc2libGlsaXR5KGVkaXRvcik7XG4gICAgICAgIH0pKTtcbiAgICB9XG4gICAgdXBkYXRlRGVjb3JhdG9yVmlzaWJsaWxpdHkoZWRpdG9yKSB7XG4gICAgICAgIGlmICghdGhpcy5kZWNvcmF0aW9ucy5oYXMoZWRpdG9yKSlcbiAgICAgICAgICAgIHRoaXMuZGVjb3JhdGlvbnMuc2V0KGVkaXRvciwgbmV3IFNldCgpKTtcbiAgICAgICAgY29uc3QgZGVjb3JhdGlvbnMgPSB0aGlzLmRlY29yYXRpb25zLmdldChlZGl0b3IpO1xuICAgICAgICBkZWNvcmF0aW9ucy5mb3JFYWNoKGRlY29yYXRpb24gPT4gZGVjb3JhdGlvbi51cGRhdGVWaXNpYmxlKCkpO1xuICAgIH1cbiAgICBkaXNwb3NlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgIH1cbiAgICB1cGRhdGVDb2RlTGVucyhlZGl0b3IpIHtcbiAgICAgICAgaWYgKCF0aGlzLmRlY29yYXRpb25zLmhhcyhlZGl0b3IpKVxuICAgICAgICAgICAgdGhpcy5kZWNvcmF0aW9ucy5zZXQoZWRpdG9yLCBuZXcgU2V0KCkpO1xuICAgICAgICBjb25zdCBkZWNvcmF0aW9ucyA9IHRoaXMuZGVjb3JhdGlvbnMuZ2V0KGVkaXRvcik7XG4gICAgICAgIGNvbnN0IHVwZGF0ZWQgPSBuZXcgV2Vha1NldCgpO1xuICAgICAgICBpZiAoZWRpdG9yLmlzRGVzdHJveWVkKCkpIHtcbiAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmVtcHR5KCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIE9tbmkucmVxdWVzdChlZGl0b3IsIHNvbHV0aW9uID0+IHNvbHV0aW9uLmN1cnJlbnRmaWxlbWVtYmVyc2FzZmxhdCh7IEJ1ZmZlcjogbnVsbCwgQ2hhbmdlczogbnVsbCB9KSlcbiAgICAgICAgICAgIC5maWx0ZXIoZmlsZU1lbWJlcnMgPT4gISFmaWxlTWVtYmVycylcbiAgICAgICAgICAgIC5mbGF0TWFwKGZpbGVNZW1iZXJzID0+IGZpbGVNZW1iZXJzKVxuICAgICAgICAgICAgLmNvbmNhdE1hcChmaWxlTWVtYmVyID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJhbmdlID0gZWRpdG9yLmdldEJ1ZmZlcigpLnJhbmdlRm9yUm93KGZpbGVNZW1iZXIuTGluZSwgZmFsc2UpO1xuICAgICAgICAgICAgY29uc3QgbWFya2VyID0gZWRpdG9yLm1hcmtCdWZmZXJSYW5nZShyYW5nZSwgeyBpbnZhbGlkYXRlOiBcImluc2lkZVwiIH0pO1xuICAgICAgICAgICAgbGV0IGxlbnM7XG4gICAgICAgICAgICBjb25zdCBpdGVyYXRlZSA9IGRlY29yYXRpb25zLnZhbHVlcygpO1xuICAgICAgICAgICAgbGV0IGRlY29yYXRpb24gPSBpdGVyYXRlZS5uZXh0KCk7XG4gICAgICAgICAgICB3aGlsZSAoIWRlY29yYXRpb24uZG9uZSkge1xuICAgICAgICAgICAgICAgIGlmIChkZWNvcmF0aW9uLnZhbHVlLmlzRXF1YWwobWFya2VyKSkge1xuICAgICAgICAgICAgICAgICAgICBsZW5zID0gZGVjb3JhdGlvbi52YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGRlY29yYXRpb24gPSBpdGVyYXRlZS5uZXh0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAobGVucykge1xuICAgICAgICAgICAgICAgIHVwZGF0ZWQuYWRkKGxlbnMpO1xuICAgICAgICAgICAgICAgIGxlbnMuaW52YWxpZGF0ZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgbGVucyA9IG5ldyBMZW5zKGVkaXRvciwgZmlsZU1lbWJlciwgbWFya2VyLCByYW5nZSwgRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBkZWNvcmF0aW9ucy5kZWxldGUobGVucyk7XG4gICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgICAgIHVwZGF0ZWQuYWRkKGxlbnMpO1xuICAgICAgICAgICAgICAgIGRlY29yYXRpb25zLmFkZChsZW5zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBsZW5zLnVwZGF0ZVZpc2libGUoKTtcbiAgICAgICAgfSlcbiAgICAgICAgICAgIC5kbyh7IGNvbXBsZXRlOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgZGVjb3JhdGlvbnMuZm9yRWFjaChsZW5zID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxlbnMgJiYgIXVwZGF0ZWQuaGFzKGxlbnMpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZW5zLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSB9KTtcbiAgICB9XG59XG5mdW5jdGlvbiBpc0xpbmVWaXNpYmxlKGVkaXRvciwgbGluZSkge1xuICAgIGNvbnN0IGVsZW1lbnQgPSBhdG9tLnZpZXdzLmdldFZpZXcoZWRpdG9yKTtcbiAgICBjb25zdCB0b3AgPSBlbGVtZW50LmdldEZpcnN0VmlzaWJsZVNjcmVlblJvdygpO1xuICAgIGNvbnN0IGJvdHRvbSA9IGVsZW1lbnQuZ2V0TGFzdFZpc2libGVTY3JlZW5Sb3coKTtcbiAgICBpZiAobGluZSA8PSB0b3AgfHwgbGluZSA+PSBib3R0b20pXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICByZXR1cm4gdHJ1ZTtcbn1cbmV4cG9ydCBjbGFzcyBMZW5zIHtcbiAgICBjb25zdHJ1Y3RvcihfZWRpdG9yLCBfbWVtYmVyLCBfbWFya2VyLCBfcmFuZ2UsIGRpc3Bvc2VyKSB7XG4gICAgICAgIHRoaXMuX2VkaXRvciA9IF9lZGl0b3I7XG4gICAgICAgIHRoaXMuX21lbWJlciA9IF9tZW1iZXI7XG4gICAgICAgIHRoaXMuX21hcmtlciA9IF9tYXJrZXI7XG4gICAgICAgIHRoaXMuX3JhbmdlID0gX3JhbmdlO1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgdGhpcy5sb2FkZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5faXNzdWVVcGRhdGUgPSBfLmRlYm91bmNlKChpc1Zpc2libGUpID0+IHtcbiAgICAgICAgICAgIGlmICghdGhpcy5fdXBkYXRlLmlzVW5zdWJzY3JpYmVkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fdXBkYXRlLm5leHQoaXNWaXNpYmxlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgMjUwKTtcbiAgICAgICAgdGhpcy5fcm93ID0gX3JhbmdlLmdldFJvd3MoKVswXTtcbiAgICAgICAgdGhpcy5fdXBkYXRlID0gbmV3IFN1YmplY3QoKTtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQodGhpcy5fdXBkYXRlKTtcbiAgICAgICAgdGhpcy5fcGF0aCA9IF9lZGl0b3IuZ2V0UGF0aCgpO1xuICAgICAgICB0aGlzLl91cGRhdGVPYnNlcnZhYmxlID0gdGhpcy5fdXBkYXRlXG4gICAgICAgICAgICAuZmlsdGVyKHggPT4gISF4KVxuICAgICAgICAgICAgLmZsYXRNYXAoKCkgPT4gT21uaS5yZXF1ZXN0KHRoaXMuX2VkaXRvciwgc29sdXRpb24gPT4gc29sdXRpb24uZmluZHVzYWdlcyh7IEZpbGVOYW1lOiB0aGlzLl9wYXRoLCBDb2x1bW46IHRoaXMuX21lbWJlci5Db2x1bW4gKyAxLCBMaW5lOiB0aGlzLl9tZW1iZXIuTGluZSwgQnVmZmVyOiBudWxsLCBDaGFuZ2VzOiBudWxsIH0sIHsgc2lsZW50OiB0cnVlIH0pKSlcbiAgICAgICAgICAgIC5maWx0ZXIoeCA9PiB4ICYmIHguUXVpY2tGaXhlcyAmJiAhIXguUXVpY2tGaXhlcy5sZW5ndGgpXG4gICAgICAgICAgICAubWFwKHggPT4geCAmJiB4LlF1aWNrRml4ZXMgJiYgeC5RdWlja0ZpeGVzLmxlbmd0aCAtIDEpXG4gICAgICAgICAgICAuc2hhcmUoKTtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQodGhpcy5fdXBkYXRlT2JzZXJ2YWJsZVxuICAgICAgICAgICAgLnRha2UoMSlcbiAgICAgICAgICAgIC5maWx0ZXIoeCA9PiB4ID4gMClcbiAgICAgICAgICAgIC5kbygoKSA9PiB0aGlzLmxvYWRlZCA9IHRydWUpXG4gICAgICAgICAgICAuc3Vic2NyaWJlKCh4KSA9PiB0aGlzLl9kZWNvcmF0ZSh4KSkpO1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChkaXNwb3Nlcik7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKHRoaXMuX21hcmtlci5vbkRpZERlc3Ryb3koKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5kaXNwb3NlKCk7XG4gICAgICAgIH0pKTtcbiAgICB9XG4gICAgdXBkYXRlVmlzaWJsZSgpIHtcbiAgICAgICAgY29uc3QgaXNWaXNpYmxlID0gdGhpcy5faXNWaXNpYmxlKCk7XG4gICAgICAgIHRoaXMuX3VwZGF0ZURlY29yYXRpb24oaXNWaXNpYmxlKTtcbiAgICAgICAgbGV0IHJlc3VsdDtcbiAgICAgICAgaWYgKGlzVmlzaWJsZSkge1xuICAgICAgICAgICAgcmVzdWx0ID0gdGhpcy5fdXBkYXRlT2JzZXJ2YWJsZS50YWtlKDEpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmVzdWx0ID0gT2JzZXJ2YWJsZS5lbXB0eSgpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2lzc3VlVXBkYXRlKGlzVmlzaWJsZSk7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICAgIHVwZGF0ZVRvcChsaW5lSGVpZ2h0KSB7XG4gICAgICAgIGlmICh0aGlzLl9lbGVtZW50KVxuICAgICAgICAgICAgdGhpcy5fZWxlbWVudC5zdHlsZS50b3AgPSBgLSR7bGluZUhlaWdodH1weGA7XG4gICAgfVxuICAgIGludmFsaWRhdGUoKSB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzLl91cGRhdGVPYnNlcnZhYmxlXG4gICAgICAgICAgICAudGFrZSgxKVxuICAgICAgICAgICAgLmRvKCgpID0+IHRoaXMuX2Rpc3Bvc2FibGUucmVtb3ZlKHNlbGYpKVxuICAgICAgICAgICAgLnN1YnNjcmliZSh4ID0+IHtcbiAgICAgICAgICAgIGlmICh4IDw9IDApIHtcbiAgICAgICAgICAgICAgICB0aGlzLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9lbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICh0aGlzLl9lbGVtZW50LnRleHRDb250ZW50ID0geC50b1N0cmluZygpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChzZWxmKTtcbiAgICB9XG4gICAgaXNFcXVhbChtYXJrZXIpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX21hcmtlci5pc0VxdWFsKG1hcmtlcik7XG4gICAgfVxuICAgIF9pc1Zpc2libGUoKSB7XG4gICAgICAgIHJldHVybiBpc0xpbmVWaXNpYmxlKHRoaXMuX2VkaXRvciwgdGhpcy5fcm93KTtcbiAgICB9XG4gICAgX3VwZGF0ZURlY29yYXRpb24oaXNWaXNpYmxlKSB7XG4gICAgICAgIGlmICh0aGlzLl9kZWNvcmF0aW9uICYmIHRoaXMuX2VsZW1lbnQpIHtcbiAgICAgICAgICAgIGNvbnN0IGVsZW1lbnQgPSB0aGlzLl9lbGVtZW50O1xuICAgICAgICAgICAgaWYgKGlzVmlzaWJsZSkge1xuICAgICAgICAgICAgICAgIGZhc3Rkb20ubWVhc3VyZSgoKSA9PiBlbGVtZW50LnN0eWxlLmRpc3BsYXkgPT09IFwibm9uZVwiICYmIGZhc3Rkb20ubXV0YXRlKCgpID0+IGVsZW1lbnQuc3R5bGUuZGlzcGxheSA9IFwiXCIpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGZhc3Rkb20ubWVhc3VyZSgoKSA9PiBlbGVtZW50LnN0eWxlLmRpc3BsYXkgIT09IFwibm9uZVwiICYmIGZhc3Rkb20ubXV0YXRlKCgpID0+IGVsZW1lbnQuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgX2RlY29yYXRlKGNvdW50KSB7XG4gICAgICAgIGNvbnN0IGxpbmVIZWlnaHQgPSB0aGlzLl9lZGl0b3IuZ2V0TGluZUhlaWdodEluUGl4ZWxzKCk7XG4gICAgICAgIGNvbnN0IGVsZW1lbnQgPSB0aGlzLl9lbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgZWxlbWVudC5zdHlsZS5wb3NpdGlvbiA9IFwicmVsYXRpdmVcIjtcbiAgICAgICAgZWxlbWVudC5zdHlsZS50b3AgPSBgLSR7bGluZUhlaWdodH1weGA7XG4gICAgICAgIGVsZW1lbnQuc3R5bGUubGVmdCA9IFwiMTZweFwiO1xuICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5hZGQoXCJoaWdobGlnaHQtaW5mb1wiLCBcImJhZGdlXCIsIFwiYmFkZ2Utc21hbGxcIik7XG4gICAgICAgIGVsZW1lbnQudGV4dENvbnRlbnQgPSBjb3VudC50b1N0cmluZygpO1xuICAgICAgICBlbGVtZW50Lm9uY2xpY2sgPSAoKSA9PiBPbW5pLnJlcXVlc3QodGhpcy5fZWRpdG9yLCBzID0+IHMuZmluZHVzYWdlcyh7IEZpbGVOYW1lOiB0aGlzLl9wYXRoLCBDb2x1bW46IHRoaXMuX21lbWJlci5Db2x1bW4gKyAxLCBMaW5lOiB0aGlzLl9tZW1iZXIuTGluZSwgQnVmZmVyOiBudWxsLCBDaGFuZ2VzOiBudWxsIH0pKTtcbiAgICAgICAgdGhpcy5fZGVjb3JhdGlvbiA9IHRoaXMuX2VkaXRvci5kZWNvcmF0ZU1hcmtlcih0aGlzLl9tYXJrZXIsIHsgdHlwZTogXCJvdmVybGF5XCIsIGNsYXNzOiBgY29kZWxlbnNgLCBpdGVtOiB0aGlzLl9lbGVtZW50LCBwb3NpdGlvbjogXCJoZWFkXCIgfSk7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuX2VsZW1lbnQucmVtb3ZlKCk7XG4gICAgICAgICAgICBpZiAodGhpcy5fZGVjb3JhdGlvbikge1xuICAgICAgICAgICAgICAgIHRoaXMuX2RlY29yYXRpb24uZGVzdHJveSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fZWxlbWVudCA9IG51bGw7XG4gICAgICAgIH0pKTtcbiAgICAgICAgY29uc3QgaXNWaXNpYmxlID0gaXNMaW5lVmlzaWJsZSh0aGlzLl9lZGl0b3IsIHRoaXMuX3Jvdyk7XG4gICAgICAgIGlmICghaXNWaXNpYmxlKSB7XG4gICAgICAgICAgICBlbGVtZW50LnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5fZGVjb3JhdGlvbjtcbiAgICB9XG4gICAgZGlzcG9zZSgpIHsgcmV0dXJuIHRoaXMuX2Rpc3Bvc2FibGUuZGlzcG9zZSgpOyB9XG59XG5leHBvcnQgY29uc3QgY29kZUxlbnMgPSBuZXcgQ29kZUxlbnMoKTtcbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi90eXBpbmdzLmQudHNcIiAvPlxyXG5pbXBvcnQge01vZGVsc30gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcclxuaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xyXG5pbXBvcnQge09ic2VydmFibGUsIFN1YmplY3QsIFN1YnNjcmlwdGlvbn0gZnJvbSBcInJ4anNcIjtcclxuaW1wb3J0IHtDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlLCBJRGlzcG9zYWJsZX0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcclxuaW1wb3J0IHtPbW5pfSBmcm9tIFwiLi4vc2VydmVyL29tbmlcIjtcclxubGV0IGZhc3Rkb206IHR5cGVvZiBGYXN0ZG9tID0gcmVxdWlyZShcImZhc3Rkb21cIik7XHJcblxyXG5pbnRlcmZhY2UgSURlY29yYXRpb24ge1xyXG4gICAgZGVzdHJveSgpOiBhbnk7XHJcbiAgICBnZXRNYXJrZXIoKTogQXRvbS5NYXJrZXI7XHJcbiAgICBnZXRQcm9wZXJ0aWVzKCk6IGFueTtcclxuICAgIHNldFByb3BlcnRpZXMocHJvcHM6IGFueSk6IGFueTtcclxufVxyXG5cclxuY2xhc3MgQ29kZUxlbnMgaW1wbGVtZW50cyBJRmVhdHVyZSB7XHJcbiAgICBwcml2YXRlIGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XHJcbiAgICBwcml2YXRlIGRlY29yYXRpb25zID0gbmV3IFdlYWtNYXA8QXRvbS5UZXh0RWRpdG9yLCBTZXQ8TGVucz4+KCk7XHJcblxyXG4gICAgcHVibGljIGFjdGl2YXRlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5lYWNoRWRpdG9yKChlZGl0b3IsIGNkKSA9PiB7XHJcbiAgICAgICAgICAgIGNkLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBtYXJrZXJzID0gdGhpcy5kZWNvcmF0aW9ucy5nZXQoZWRpdG9yKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAobWFya2Vycykge1xyXG4gICAgICAgICAgICAgICAgICAgIG1hcmtlcnMuZm9yRWFjaChtYXJrZXIgPT4gbWFya2VyLmRpc3Bvc2UoKSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5kZWNvcmF0aW9ucy5kZWxldGUoZWRpdG9yKTtcclxuICAgICAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICAgICAgY2QuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoXCJlZGl0b3IuZm9udFNpemVcIiwgKHNpemU6IG51bWJlcikgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZGVjb3JhdGlvbnMgPSB0aGlzLmRlY29yYXRpb25zLmdldChlZGl0b3IpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgbGluZUhlaWdodCA9IGVkaXRvci5nZXRMaW5lSGVpZ2h0SW5QaXhlbHMoKTtcclxuICAgICAgICAgICAgICAgIGlmIChkZWNvcmF0aW9ucyAmJiBsaW5lSGVpZ2h0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZGVjb3JhdGlvbnMuZm9yRWFjaChkZWNvcmF0aW9uID0+IGRlY29yYXRpb24udXBkYXRlVG9wKGxpbmVIZWlnaHQpKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSkpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLnN3aXRjaEFjdGl2ZUVkaXRvcigoZWRpdG9yLCBjZCkgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBpdGVtcyA9IHRoaXMuZGVjb3JhdGlvbnMuZ2V0KGVkaXRvcik7XHJcbiAgICAgICAgICAgIGlmICghaXRlbXMpIHRoaXMuZGVjb3JhdGlvbnMuc2V0KGVkaXRvciwgbmV3IFNldDxMZW5zPigpKTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IHN1YmplY3QgPSBuZXcgU3ViamVjdDxib29sZWFuPigpO1xyXG5cclxuICAgICAgICAgICAgY2QuYWRkKHN1YmplY3RcclxuICAgICAgICAgICAgICAgIC5maWx0ZXIoeCA9PiAhIXggJiYgIWVkaXRvci5pc0Rlc3Ryb3llZCgpKVxyXG4gICAgICAgICAgICAgICAgLmRpc3RpbmN0VW50aWxDaGFuZ2VkKHggPT4gISF4KVxyXG4gICAgICAgICAgICAgICAgLmRlYm91bmNlVGltZSg1MDApXHJcbiAgICAgICAgICAgICAgICAuc3dpdGNoTWFwKCgpID0+IHRoaXMudXBkYXRlQ29kZUxlbnMoZWRpdG9yKSlcclxuICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoKVxyXG4gICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgYmluZERpZENoYW5nZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZGlkQ2hhbmdlID0gZWRpdG9yLmdldEJ1ZmZlcigpLm9uRGlkQ2hhbmdlKCgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBkaWRDaGFuZ2UuZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNkLnJlbW92ZShkaWRDaGFuZ2UpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBzdWJqZWN0Lm5leHQoZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgY2QuYWRkKGRpZENoYW5nZSk7XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICBjZC5hZGQoZWRpdG9yLmdldEJ1ZmZlcigpLm9uRGlkU3RvcENoYW5naW5nKF8uZGVib3VuY2UoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFzdWJqZWN0LmlzVW5zdWJzY3JpYmVkKSBzdWJqZWN0Lm5leHQodHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICBiaW5kRGlkQ2hhbmdlKCk7XHJcbiAgICAgICAgICAgIH0sIDUwMDApKSk7XHJcblxyXG4gICAgICAgICAgICBjZC5hZGQoZWRpdG9yLmdldEJ1ZmZlcigpLm9uRGlkU2F2ZSgoKSA9PiBzdWJqZWN0Lm5leHQodHJ1ZSkpKTtcclxuICAgICAgICAgICAgY2QuYWRkKGVkaXRvci5nZXRCdWZmZXIoKS5vbkRpZFJlbG9hZCgoKSA9PiBzdWJqZWN0Lm5leHQodHJ1ZSkpKTtcclxuICAgICAgICAgICAgY2QuYWRkKE9ic2VydmFibGUudGltZXIoMTAwMCkuc3Vic2NyaWJlKCgpID0+IHN1YmplY3QubmV4dCh0cnVlKSkpO1xyXG5cclxuICAgICAgICAgICAgY2QuYWRkKGVkaXRvci5vbkRpZENoYW5nZVNjcm9sbFRvcCgoKSA9PiB0aGlzLnVwZGF0ZURlY29yYXRvclZpc2libGlsaXR5KGVkaXRvcikpKTtcclxuXHJcbiAgICAgICAgICAgIGNkLmFkZChhdG9tLmNvbW1hbmRzLm9uV2lsbERpc3BhdGNoKChldmVudDogRXZlbnQpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmIChfLmluY2x1ZGVzKFtcIm9tbmlzaGFycC1hdG9tOnRvZ2dsZS1kb2NrXCIsIFwib21uaXNoYXJwLWF0b206c2hvdy1kb2NrXCIsIFwib21uaXNoYXJwLWF0b206aGlkZS1kb2NrXCJdLCBldmVudC50eXBlKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlRGVjb3JhdG9yVmlzaWJsaWxpdHkoZWRpdG9yKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICAgICAgY2QuYWRkKHN1YmplY3QpO1xyXG4gICAgICAgICAgICB0aGlzLnVwZGF0ZURlY29yYXRvclZpc2libGlsaXR5KGVkaXRvcik7XHJcbiAgICAgICAgfSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB1cGRhdGVEZWNvcmF0b3JWaXNpYmxpbGl0eShlZGl0b3I6IEF0b20uVGV4dEVkaXRvcikge1xyXG4gICAgICAgIGlmICghdGhpcy5kZWNvcmF0aW9ucy5oYXMoZWRpdG9yKSkgdGhpcy5kZWNvcmF0aW9ucy5zZXQoZWRpdG9yLCBuZXcgU2V0PExlbnM+KCkpO1xyXG4gICAgICAgIGNvbnN0IGRlY29yYXRpb25zID0gdGhpcy5kZWNvcmF0aW9ucy5nZXQoZWRpdG9yKTtcclxuICAgICAgICBkZWNvcmF0aW9ucy5mb3JFYWNoKGRlY29yYXRpb24gPT4gZGVjb3JhdGlvbi51cGRhdGVWaXNpYmxlKCkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkaXNwb3NlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHVwZGF0ZUNvZGVMZW5zKGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLmRlY29yYXRpb25zLmhhcyhlZGl0b3IpKSB0aGlzLmRlY29yYXRpb25zLnNldChlZGl0b3IsIG5ldyBTZXQ8TGVucz4oKSk7XHJcbiAgICAgICAgY29uc3QgZGVjb3JhdGlvbnMgPSB0aGlzLmRlY29yYXRpb25zLmdldChlZGl0b3IpO1xyXG5cclxuICAgICAgICBjb25zdCB1cGRhdGVkID0gbmV3IFdlYWtTZXQ8TGVucz4oKTtcclxuXHJcbiAgICAgICAgaWYgKGVkaXRvci5pc0Rlc3Ryb3llZCgpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmVtcHR5PG51bWJlcj4oKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBPbW5pLnJlcXVlc3QoZWRpdG9yLCBzb2x1dGlvbiA9PiBzb2x1dGlvbi5jdXJyZW50ZmlsZW1lbWJlcnNhc2ZsYXQoeyBCdWZmZXI6IG51bGwsIENoYW5nZXM6IG51bGwgfSkpXHJcbiAgICAgICAgICAgIC5maWx0ZXIoZmlsZU1lbWJlcnMgPT4gISFmaWxlTWVtYmVycylcclxuICAgICAgICAgICAgLmZsYXRNYXAoZmlsZU1lbWJlcnMgPT4gZmlsZU1lbWJlcnMpXHJcbiAgICAgICAgICAgIC5jb25jYXRNYXAoZmlsZU1lbWJlciA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCByYW5nZTogVGV4dEJ1ZmZlci5SYW5nZSA9IDxhbnk+ZWRpdG9yLmdldEJ1ZmZlcigpLnJhbmdlRm9yUm93KGZpbGVNZW1iZXIuTGluZSwgZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgLy8gVE9ETzogQmxvY2sgZGVjb3JhdGlvbnNcclxuICAgICAgICAgICAgICAgIC8vIGNvbnN0IG1hcmtlcjogQXRvbS5NYXJrZXIgPSAoPGFueT5lZGl0b3IpLm1hcmtTY3JlZW5Qb3NpdGlvbihbZmlsZU1lbWJlci5MaW5lLCAwXSk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBtYXJrZXI6IEF0b20uTWFya2VyID0gKDxhbnk+ZWRpdG9yKS5tYXJrQnVmZmVyUmFuZ2UocmFuZ2UsIHsgaW52YWxpZGF0ZTogXCJpbnNpZGVcIiB9KTtcclxuICAgICAgICAgICAgICAgIGxldCBsZW5zOiBMZW5zO1xyXG5cclxuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZXJhdGVlID0gZGVjb3JhdGlvbnMudmFsdWVzKCk7XHJcbiAgICAgICAgICAgICAgICBsZXQgZGVjb3JhdGlvbiA9IGl0ZXJhdGVlLm5leHQoKTtcclxuICAgICAgICAgICAgICAgIHdoaWxlICghZGVjb3JhdGlvbi5kb25lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRlY29yYXRpb24udmFsdWUuaXNFcXVhbChtYXJrZXIpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxlbnMgPSBkZWNvcmF0aW9uLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgZGVjb3JhdGlvbiA9IGl0ZXJhdGVlLm5leHQoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAobGVucykge1xyXG4gICAgICAgICAgICAgICAgICAgIHVwZGF0ZWQuYWRkKGxlbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGxlbnMuaW52YWxpZGF0ZSgpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBsZW5zID0gbmV3IExlbnMoZWRpdG9yLCBmaWxlTWVtYmVyLCBtYXJrZXIsIHJhbmdlLCBEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlY29yYXRpb25zLmRlbGV0ZShsZW5zKTtcclxuICAgICAgICAgICAgICAgICAgICB9KSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdXBkYXRlZC5hZGQobGVucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgZGVjb3JhdGlvbnMuYWRkKGxlbnMpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiBsZW5zLnVwZGF0ZVZpc2libGUoKTtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgLmRvKHsgY29tcGxldGU6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgIC8vIFJlbW92ZSBhbGwgb2xkL21pc3NpbmcgZGVjb3JhdGlvbnNcclxuICAgICAgICAgICAgICAgIGRlY29yYXRpb25zLmZvckVhY2gobGVucyA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxlbnMgJiYgIXVwZGF0ZWQuaGFzKGxlbnMpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxlbnMuZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9IH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZXF1aXJlZCA9IGZhbHNlO1xyXG4gICAgcHVibGljIHRpdGxlID0gXCJDb2RlIExlbnNcIjtcclxuICAgIHB1YmxpYyBkZXNjcmlwdGlvbiA9IFwiQWRkcyBzdXBwb3J0IGZvciBkaXNwbGF5aW5nIHJlZmVyZW5jZXMgaW4gdGhlIGVkaXRvci5cIjtcclxufVxyXG5cclxuZnVuY3Rpb24gaXNMaW5lVmlzaWJsZShlZGl0b3I6IEF0b20uVGV4dEVkaXRvciwgbGluZTogbnVtYmVyKSB7XHJcbiAgICBjb25zdCBlbGVtZW50OiBhbnkgPSBhdG9tLnZpZXdzLmdldFZpZXcoZWRpdG9yKTtcclxuICAgIGNvbnN0IHRvcCA9IGVsZW1lbnQuZ2V0Rmlyc3RWaXNpYmxlU2NyZWVuUm93KCk7XHJcbiAgICBjb25zdCBib3R0b20gPSBlbGVtZW50LmdldExhc3RWaXNpYmxlU2NyZWVuUm93KCk7XHJcblxyXG4gICAgaWYgKGxpbmUgPD0gdG9wIHx8IGxpbmUgPj0gYm90dG9tKVxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIHJldHVybiB0cnVlO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgTGVucyBpbXBsZW1lbnRzIElEaXNwb3NhYmxlIHtcclxuICAgIHByaXZhdGUgX3VwZGF0ZTogU3ViamVjdDxib29sZWFuPjtcclxuICAgIHByaXZhdGUgX3JvdzogbnVtYmVyO1xyXG4gICAgcHJpdmF0ZSBfZGVjb3JhdGlvbjogSURlY29yYXRpb247XHJcbiAgICBwcml2YXRlIF9kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgIHByaXZhdGUgX2VsZW1lbnQ6IEhUTUxEaXZFbGVtZW50O1xyXG4gICAgcHJpdmF0ZSBfdXBkYXRlT2JzZXJ2YWJsZTogT2JzZXJ2YWJsZTxudW1iZXI+O1xyXG4gICAgcHJpdmF0ZSBfcGF0aDogc3RyaW5nO1xyXG5cclxuICAgIHB1YmxpYyBsb2FkZWQ6IGJvb2xlYW4gPSBmYWxzZTtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9lZGl0b3I6IEF0b20uVGV4dEVkaXRvciwgcHJpdmF0ZSBfbWVtYmVyOiBNb2RlbHMuUXVpY2tGaXgsIHByaXZhdGUgX21hcmtlcjogQXRvbS5NYXJrZXIsIHByaXZhdGUgX3JhbmdlOiBUZXh0QnVmZmVyLlJhbmdlLCBkaXNwb3NlcjogSURpc3Bvc2FibGUpIHtcclxuICAgICAgICB0aGlzLl9yb3cgPSBfcmFuZ2UuZ2V0Um93cygpWzBdO1xyXG4gICAgICAgIHRoaXMuX3VwZGF0ZSA9IG5ldyBTdWJqZWN0PGFueT4oKTtcclxuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZCh0aGlzLl91cGRhdGUpO1xyXG4gICAgICAgIHRoaXMuX3BhdGggPSBfZWRpdG9yLmdldFBhdGgoKTtcclxuXHJcbiAgICAgICAgdGhpcy5fdXBkYXRlT2JzZXJ2YWJsZSA9IHRoaXMuX3VwZGF0ZVxyXG4gICAgICAgICAgICAuZmlsdGVyKHggPT4gISF4KVxyXG4gICAgICAgICAgICAuZmxhdE1hcCgoKSA9PiBPbW5pLnJlcXVlc3QodGhpcy5fZWRpdG9yLCBzb2x1dGlvbiA9PlxyXG4gICAgICAgICAgICAgICAgc29sdXRpb24uZmluZHVzYWdlcyh7IEZpbGVOYW1lOiB0aGlzLl9wYXRoLCBDb2x1bW46IHRoaXMuX21lbWJlci5Db2x1bW4gKyAxLCBMaW5lOiB0aGlzLl9tZW1iZXIuTGluZSwgQnVmZmVyOiBudWxsLCBDaGFuZ2VzOiBudWxsIH0sIHsgc2lsZW50OiB0cnVlIH0pKSlcclxuICAgICAgICAgICAgLmZpbHRlcih4ID0+IHggJiYgeC5RdWlja0ZpeGVzICYmICEheC5RdWlja0ZpeGVzLmxlbmd0aClcclxuICAgICAgICAgICAgLm1hcCh4ID0+IHggJiYgeC5RdWlja0ZpeGVzICYmIHguUXVpY2tGaXhlcy5sZW5ndGggLSAxKVxyXG4gICAgICAgICAgICAuc2hhcmUoKTtcclxuXHJcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQodGhpcy5fdXBkYXRlT2JzZXJ2YWJsZVxyXG4gICAgICAgICAgICAudGFrZSgxKVxyXG4gICAgICAgICAgICAuZmlsdGVyKHggPT4geCA+IDApXHJcbiAgICAgICAgICAgIC5kbygoKSA9PiB0aGlzLmxvYWRlZCA9IHRydWUpXHJcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoKHgpID0+IHRoaXMuX2RlY29yYXRlKHgpKSk7XHJcblxyXG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKGRpc3Bvc2VyKTtcclxuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZCh0aGlzLl9tYXJrZXIub25EaWREZXN0cm95KCgpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5kaXNwb3NlKCk7XHJcbiAgICAgICAgfSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB1cGRhdGVWaXNpYmxlKCkge1xyXG4gICAgICAgIGNvbnN0IGlzVmlzaWJsZSA9IHRoaXMuX2lzVmlzaWJsZSgpO1xyXG4gICAgICAgIHRoaXMuX3VwZGF0ZURlY29yYXRpb24oaXNWaXNpYmxlKTtcclxuXHJcbiAgICAgICAgbGV0IHJlc3VsdDogT2JzZXJ2YWJsZTxudW1iZXI+O1xyXG4gICAgICAgIGlmIChpc1Zpc2libGUpIHtcclxuICAgICAgICAgICAgcmVzdWx0ID0gdGhpcy5fdXBkYXRlT2JzZXJ2YWJsZS50YWtlKDEpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJlc3VsdCA9IE9ic2VydmFibGUuZW1wdHk8bnVtYmVyPigpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5faXNzdWVVcGRhdGUoaXNWaXNpYmxlKTtcclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX2lzc3VlVXBkYXRlID0gXy5kZWJvdW5jZSgoaXNWaXNpYmxlOiBib29sZWFuKSA9PiB7XHJcbiAgICAgICAgaWYgKCF0aGlzLl91cGRhdGUuaXNVbnN1YnNjcmliZWQpIHsgdGhpcy5fdXBkYXRlLm5leHQoaXNWaXNpYmxlKTsgfVxyXG4gICAgfSwgMjUwKTtcclxuXHJcbiAgICBwdWJsaWMgdXBkYXRlVG9wKGxpbmVIZWlnaHQ6IG51bWJlcikge1xyXG4gICAgICAgIGlmICh0aGlzLl9lbGVtZW50KVxyXG4gICAgICAgICAgICB0aGlzLl9lbGVtZW50LnN0eWxlLnRvcCA9IGAtJHtsaW5lSGVpZ2h0fXB4YDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgaW52YWxpZGF0ZSgpIHtcclxuICAgICAgICBjb25zdCBzZWxmIDogU3Vic2NyaXB0aW9uID0gdGhpcy5fdXBkYXRlT2JzZXJ2YWJsZVxyXG4gICAgICAgICAgICAudGFrZSgxKVxyXG4gICAgICAgICAgICAuZG8oKCkgPT4gdGhpcy5fZGlzcG9zYWJsZS5yZW1vdmUoc2VsZikpXHJcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoeCA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoeCA8PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9lbGVtZW50KSB7ICh0aGlzLl9lbGVtZW50LnRleHRDb250ZW50ID0geC50b1N0cmluZygpKTsgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChzZWxmKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgaXNFcXVhbChtYXJrZXI6IEF0b20uTWFya2VyKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX21hcmtlci5pc0VxdWFsKDxhbnk+bWFya2VyKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9pc1Zpc2libGUoKSB7XHJcbiAgICAgICAgcmV0dXJuIGlzTGluZVZpc2libGUodGhpcy5fZWRpdG9yLCB0aGlzLl9yb3cpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX3VwZGF0ZURlY29yYXRpb24oaXNWaXNpYmxlOiBib29sZWFuKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuX2RlY29yYXRpb24gJiYgdGhpcy5fZWxlbWVudCkge1xyXG4gICAgICAgICAgICBjb25zdCBlbGVtZW50ID0gdGhpcy5fZWxlbWVudDtcclxuICAgICAgICAgICAgaWYgKGlzVmlzaWJsZSkge1xyXG4gICAgICAgICAgICAgICAgZmFzdGRvbS5tZWFzdXJlKCgpID0+IGVsZW1lbnQuc3R5bGUuZGlzcGxheSA9PT0gXCJub25lXCIgJiYgZmFzdGRvbS5tdXRhdGUoKCkgPT4gZWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gXCJcIikpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgZmFzdGRvbS5tZWFzdXJlKCgpID0+IGVsZW1lbnQuc3R5bGUuZGlzcGxheSAhPT0gXCJub25lXCIgJiYgZmFzdGRvbS5tdXRhdGUoKCkgPT4gZWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCIpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9kZWNvcmF0ZShjb3VudDogbnVtYmVyKSB7XHJcbiAgICAgICAgY29uc3QgbGluZUhlaWdodCA9IHRoaXMuX2VkaXRvci5nZXRMaW5lSGVpZ2h0SW5QaXhlbHMoKTtcclxuXHJcbiAgICAgICAgY29uc3QgZWxlbWVudCA9IHRoaXMuX2VsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gICAgICAgIGVsZW1lbnQuc3R5bGUucG9zaXRpb24gPSBcInJlbGF0aXZlXCI7XHJcbiAgICAgICAgZWxlbWVudC5zdHlsZS50b3AgPSBgLSR7bGluZUhlaWdodH1weGA7XHJcbiAgICAgICAgZWxlbWVudC5zdHlsZS5sZWZ0ID0gXCIxNnB4XCI7XHJcbiAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkKFwiaGlnaGxpZ2h0LWluZm9cIiwgXCJiYWRnZVwiLCBcImJhZGdlLXNtYWxsXCIpO1xyXG4gICAgICAgIGVsZW1lbnQudGV4dENvbnRlbnQgPSBjb3VudC50b1N0cmluZygpO1xyXG4gICAgICAgIGVsZW1lbnQub25jbGljayA9ICgpID0+IE9tbmkucmVxdWVzdCh0aGlzLl9lZGl0b3IsIHMgPT4gcy5maW5kdXNhZ2VzKHsgRmlsZU5hbWU6IHRoaXMuX3BhdGgsIENvbHVtbjogdGhpcy5fbWVtYmVyLkNvbHVtbiArIDEsIExpbmU6IHRoaXMuX21lbWJlci5MaW5lLCBCdWZmZXI6IG51bGwsIENoYW5nZXM6IG51bGwgfSkpO1xyXG5cclxuICAgICAgICAvLyBUT0RPOiBCbG9jayBkZWNvcmF0aW9uc1xyXG4gICAgICAgIC8vIHRoaXMuX2RlY29yYXRpb24gPSA8YW55PnRoaXMuX2VkaXRvci5kZWNvcmF0ZU1hcmtlcih0aGlzLl9tYXJrZXIsIHsgdHlwZTogXCJibG9ja1wiLCBjbGFzczogYGNvZGVsZW5zYCwgaXRlbTogdGhpcy5fZWxlbWVudCwgcG9zaXRpb246IFwiYmVmb3JlXCIgfSk7XHJcbiAgICAgICAgdGhpcy5fZGVjb3JhdGlvbiA9IDxhbnk+dGhpcy5fZWRpdG9yLmRlY29yYXRlTWFya2VyKHRoaXMuX21hcmtlciwgeyB0eXBlOiBcIm92ZXJsYXlcIiwgY2xhc3M6IGBjb2RlbGVuc2AsIGl0ZW06IHRoaXMuX2VsZW1lbnQsIHBvc2l0aW9uOiBcImhlYWRcIiB9KTtcclxuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuX2VsZW1lbnQucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLl9kZWNvcmF0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9kZWNvcmF0aW9uLmRlc3Ryb3koKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLl9lbGVtZW50ID0gbnVsbDtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIGNvbnN0IGlzVmlzaWJsZSA9IGlzTGluZVZpc2libGUodGhpcy5fZWRpdG9yLCB0aGlzLl9yb3cpO1xyXG4gICAgICAgIGlmICghaXNWaXNpYmxlKSB7XHJcbiAgICAgICAgICAgIGVsZW1lbnQuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2RlY29yYXRpb247XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7IHJldHVybiB0aGlzLl9kaXNwb3NhYmxlLmRpc3Bvc2UoKTsgfVxyXG59XHJcblxyXG5leHBvcnQgY29uc3QgY29kZUxlbnMgPSBuZXcgQ29kZUxlbnMoKTtcclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
