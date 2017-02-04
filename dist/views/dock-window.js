'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Resizer = exports.DockWindow = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _rxjs = require('rxjs');

var _tsDisposables = require('ts-disposables');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var DockWindow = exports.DockWindow = function (_HTMLDivElement) {
    _inherits(DockWindow, _HTMLDivElement);

    function DockWindow() {
        _classCallCheck(this, DockWindow);

        return _possibleConstructorReturn(this, (DockWindow.__proto__ || Object.getPrototypeOf(DockWindow)).apply(this, arguments));
    }

    _createClass(DockWindow, [{
        key: 'createdCallback',
        value: function createdCallback() {
            var _this2 = this;

            this.disposable = new _tsDisposables.CompositeDisposable();
            this._panes = new Map();
            this._selected = 'output';
            this.visible = false;
            this.tempHeight = 0;
            this.fontSize = atom.config.get('editor.fontSize');
            var fontSize = this.fontSize - 1;
            if (fontSize <= 0) fontSize = 1;
            this.classList.add('inset-panel', 'font-size-' + fontSize);
            if (this.clientHeight || this.tempHeight) {
                this.style.height = this.clientHeight + this.tempHeight + 'px';
            }
            var resizer = new exports.Resizer();
            var _originalHeight = this.clientHeight;
            resizer.start = function () {
                _originalHeight = _this2.clientHeight;
            };
            resizer.update = function (_ref) {
                var top = _ref.top;

                console.log(top);
                _this2.style.height = _originalHeight + -top + 'px';
            };
            resizer.done = function () {};
            this.appendChild(resizer);
            var windows = document.createElement('div');
            windows.classList.add('panel-heading', 'clearfix');
            this.appendChild(windows);
            this._toolbar = document.createElement('div');
            this._toolbar.classList.add('btn-toolbar', 'pull-left');
            windows.appendChild(this._toolbar);
            this._paneButtons = document.createElement('div');
            this._paneButtons.classList.add('btn-group', 'btn-toggle');
            this._toolbar.appendChild(this._paneButtons);
            this._toggleButtons = document.createElement('div');
            this._toggleButtons.classList.add('btn-well', 'pull-right', 'btn-group');
            windows.appendChild(this._toggleButtons);
        }
    }, {
        key: 'attachedCallback',
        value: function attachedCallback() {
            var _this3 = this;

            this.disposable.add(atom.config.observe('editor.fontSize', function (size) {
                _this3.className = _this3.className.replace(/font-size-[\d]*/g, '');
                _this3.fontSize = size;
                _this3.classList.add('font-size-' + size);
            }));
        }
    }, {
        key: 'setPanel',
        value: function setPanel(panel) {
            this._panel = panel;
        }
    }, {
        key: '_addDockButton',
        value: function _addDockButton(button) {
            var _this4 = this;

            var id = button.id,
                title = button.title,
                options = button.options,
                disposable = button.disposable;

            var view = document.createElement('button');
            view.classList.add('btn', 'btn-default', 'btn-fix');
            view._id = id;
            view._priority = options.priority;
            disposable.add(_tsDisposables.Disposable.create(function () {
                if (view.classList.contains('selected')) {
                    _this4.selected = view.previousElementSibling._id;
                }
                view.remove();
            }));
            var text = document.createElement('span');
            text.innerHTML = title;
            text.classList.add('text');
            view.appendChild(text);
            if (options.closeable) {
                view.classList.add('closeable');
                var close = document.createElement('span');
                close.classList.add('fa', 'fa-times-circle', 'close-pane');
                close.onclick = function (e) {
                    disposable.dispose();
                };
                view.appendChild(close);
            }
            view.onclick = function (e) {
                e.stopPropagation();
                e.preventDefault();
                _this4.selected = id;
            };
            button._button = view;
            this._insertButton(this._paneButtons, view, options.priority, id);
        }
    }, {
        key: '_addToggleButton',
        value: function _addToggleButton(_ref2) {
            var _this5 = this;

            var id = _ref2.id,
                options = _ref2.options,
                view = _ref2.view,
                disposable = _ref2.disposable;

            disposable.add(_tsDisposables.Disposable.create(function () {
                view.remove();
                _this5.disposable.remove(disposable);
            }));
            this._insertButton(this._toggleButtons, view, options.priority, id);
        }
    }, {
        key: '_insertButton',
        value: function _insertButton(parent, element, priority, id) {
            var insertIndex = -1;
            for (var i = 0; i < parent.childNodes.length; i++) {
                var child = parent.childNodes[i];
                if (child._id <= id && child._priority <= priority) {
                    insertIndex = i + 1;
                    break;
                }
            }
            if (insertIndex > -1 && insertIndex < parent.childNodes.length) {
                parent.insertBefore(element, parent.childNodes[insertIndex]);
            } else {
                parent.appendChild(element);
            }
        }
    }, {
        key: 'updateAtom',
        value: function updateAtom(cb) {
            if (this._panel.visible !== this.visible) {
                if (this.visible) {
                    this._panel.show();
                } else {
                    this._panel.hide();
                }
            }
            if (cb) cb();
        }
    }, {
        key: 'showView',
        value: function showView() {
            this.visible = true;
            this.updateAtom();
        }
    }, {
        key: 'doShowView',
        value: function doShowView() {
            this.visible = true;
        }
    }, {
        key: 'hideView',
        value: function hideView() {
            this.doHideView();
            this.updateAtom();
        }
    }, {
        key: 'doHideView',
        value: function doHideView() {
            this.visible = false;
            atom.workspace.getActivePane().activate();
            atom.workspace.getActivePane().activateItem();
        }
    }, {
        key: 'toggleView',
        value: function toggleView() {
            if (this.visible) {
                this.doHideView();
            } else {
                this.doShowView();
            }
            this.updateAtom();
        }
    }, {
        key: 'toggleWindow',
        value: function toggleWindow(selected) {
            if (this.visible && this.selected === selected) {
                this.hideView();
                return;
            }
            this.selectWindow(selected);
        }
    }, {
        key: 'selectWindow',
        value: function selectWindow(selected) {
            var _this6 = this;

            if (!this.visible) this.doShowView();
            this.selected = selected;
            this.updateAtom(function () {
                var panel = _this6.querySelector('.omnisharp-atom-output.selected');
                if (panel) panel.focus();
            });
        }
    }, {
        key: 'addWindow',
        value: function addWindow(id, title, view) {
            var _this7 = this;

            var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : { priority: 1000 };
            var parentDisposable = arguments[4];

            var disposable = new _tsDisposables.SingleAssignmentDisposable();
            var cd = new _tsDisposables.CompositeDisposable();
            var context = { id: id, title: title, view: view, options: options, disposable: cd };
            this._panes.set(id, context);
            this.disposable.add(disposable);
            disposable.disposable = cd;
            if (parentDisposable) cd.add(parentDisposable);
            view.classList.add('omnisharp-atom-output', id + '-output', 'selected');
            cd.add(atom.commands.add('atom-workspace', 'omnisharp-atom:dock-show-' + id, function () {
                return _this7.selectWindow(id);
            }));
            cd.add(atom.commands.add('atom-workspace', 'omnisharp-atom:dock-toggle-' + id, function () {
                return _this7.toggleWindow(id);
            }));
            if (options.closeable) {
                cd.add(atom.commands.add('atom-workspace', 'omnisharp-atom:dock-close-' + id, function () {
                    _this7.disposable.remove(disposable);
                    disposable.dispose();
                    _this7.hideView();
                }));
            }
            cd.add(_tsDisposables.Disposable.create(function () {
                if (_this7.selected === id) {
                    _this7.selected = 'output';
                }
            }));
            cd.add(_tsDisposables.Disposable.create(function () {
                view.remove();
                _this7._panes.delete(id);
            }));
            this._addDockButton(context);
            if (!this.selected) this.selected = id;
            return disposable;
        }
    }, {
        key: 'addButton',
        value: function addButton(id, title, view) {
            var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : { priority: 1000 };
            var parentDisposable = arguments[4];

            var disposable = new _tsDisposables.SingleAssignmentDisposable();
            var cd = new _tsDisposables.CompositeDisposable();
            this.disposable.add(disposable);
            disposable.disposable = cd;
            if (parentDisposable) cd.add(parentDisposable);
            this._addToggleButton({ id: id, title: title, view: view, options: options, disposable: cd });
            return disposable;
        }
    }, {
        key: 'isOpen',
        get: function get() {
            return this.visible;
        }
    }, {
        key: 'selected',
        get: function get() {
            return this._selected;
        },
        set: function set(value) {
            var pane = this._panes.get(value);
            if (this._selectedPane) {
                this._selectedPane._button.classList.remove('selected');
                this._selectedPane.view.remove();
            }
            if (pane) {
                this._selectedPane = pane;
                pane._button.classList.add('selected');
                this.appendChild(pane.view);
            }
            this._selected = value;
        }
    }]);

    return DockWindow;
}(HTMLDivElement);

exports.DockWindow = document.registerElement('omnisharp-dock-window', { prototype: DockWindow.prototype });

var Resizer = exports.Resizer = function (_HTMLDivElement2) {
    _inherits(Resizer, _HTMLDivElement2);

    function Resizer() {
        _classCallCheck(this, Resizer);

        return _possibleConstructorReturn(this, (Resizer.__proto__ || Object.getPrototypeOf(Resizer)).apply(this, arguments));
    }

    _createClass(Resizer, [{
        key: 'createdCallback',
        value: function createdCallback() {
            this.classList.add('omnisharp-atom-output-resizer');
        }
    }, {
        key: 'detachedCallback',
        value: function detachedCallback() {
            this.disposable.dispose();
        }
    }, {
        key: 'attachedCallback',
        value: function attachedCallback() {
            var _this9 = this;

            this.disposable = new _tsDisposables.CompositeDisposable();
            var mousemove = _rxjs.Observable.fromEvent(document.body, 'mousemove').share();
            var mouseup = _rxjs.Observable.fromEvent(document.body, 'mouseup').share();
            var mousedown = _rxjs.Observable.fromEvent(this, 'mousedown').share();
            var mousedrag = mousedown.flatMap(function (md) {
                var startX = md.clientX + window.scrollX,
                    startY = md.clientY + window.scrollY;
                return mousemove.map(function (mm) {
                    mm.preventDefault();
                    return {
                        left: (parseInt(md.target.style.left, 10) || 0) + mm.clientX - startX,
                        top: (parseInt(md.target.style.top, 10) || 0) + mm.clientY - startY
                    };
                }).takeUntil(mouseup);
            });
            this.disposable.add(mousedown.subscribe(function (x) {
                return _this9.start();
            }));
            this.disposable.add(mousedrag.subscribe(function (x) {
                return _this9.update(x);
            }, null, function () {
                return _this9.done();
            }));
        }
    }]);

    return Resizer;
}(HTMLDivElement);

exports.Resizer = document.registerElement('omnisharp-resizer', { prototype: Resizer.prototype });
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy9kb2NrLXdpbmRvdy50cyJdLCJuYW1lcyI6WyJEb2NrV2luZG93IiwiZGlzcG9zYWJsZSIsIl9wYW5lcyIsIk1hcCIsIl9zZWxlY3RlZCIsInZpc2libGUiLCJ0ZW1wSGVpZ2h0IiwiZm9udFNpemUiLCJhdG9tIiwiY29uZmlnIiwiZ2V0IiwiY2xhc3NMaXN0IiwiYWRkIiwiY2xpZW50SGVpZ2h0Iiwic3R5bGUiLCJoZWlnaHQiLCJyZXNpemVyIiwiZXhwb3J0cyIsIlJlc2l6ZXIiLCJfb3JpZ2luYWxIZWlnaHQiLCJzdGFydCIsInVwZGF0ZSIsInRvcCIsImNvbnNvbGUiLCJsb2ciLCJkb25lIiwiYXBwZW5kQ2hpbGQiLCJ3aW5kb3dzIiwiZG9jdW1lbnQiLCJjcmVhdGVFbGVtZW50IiwiX3Rvb2xiYXIiLCJfcGFuZUJ1dHRvbnMiLCJfdG9nZ2xlQnV0dG9ucyIsIm9ic2VydmUiLCJzaXplIiwiY2xhc3NOYW1lIiwicmVwbGFjZSIsInBhbmVsIiwiX3BhbmVsIiwiYnV0dG9uIiwiaWQiLCJ0aXRsZSIsIm9wdGlvbnMiLCJ2aWV3IiwiX2lkIiwiX3ByaW9yaXR5IiwicHJpb3JpdHkiLCJjcmVhdGUiLCJjb250YWlucyIsInNlbGVjdGVkIiwicHJldmlvdXNFbGVtZW50U2libGluZyIsInJlbW92ZSIsInRleHQiLCJpbm5lckhUTUwiLCJjbG9zZWFibGUiLCJjbG9zZSIsIm9uY2xpY2siLCJkaXNwb3NlIiwiZSIsInN0b3BQcm9wYWdhdGlvbiIsInByZXZlbnREZWZhdWx0IiwiX2J1dHRvbiIsIl9pbnNlcnRCdXR0b24iLCJwYXJlbnQiLCJlbGVtZW50IiwiaW5zZXJ0SW5kZXgiLCJpIiwiY2hpbGROb2RlcyIsImxlbmd0aCIsImNoaWxkIiwiaW5zZXJ0QmVmb3JlIiwiY2IiLCJzaG93IiwiaGlkZSIsInVwZGF0ZUF0b20iLCJkb0hpZGVWaWV3Iiwid29ya3NwYWNlIiwiZ2V0QWN0aXZlUGFuZSIsImFjdGl2YXRlIiwiYWN0aXZhdGVJdGVtIiwiZG9TaG93VmlldyIsImhpZGVWaWV3Iiwic2VsZWN0V2luZG93IiwicXVlcnlTZWxlY3RvciIsImZvY3VzIiwicGFyZW50RGlzcG9zYWJsZSIsImNkIiwiY29udGV4dCIsInNldCIsImNvbW1hbmRzIiwidG9nZ2xlV2luZG93IiwiZGVsZXRlIiwiX2FkZERvY2tCdXR0b24iLCJfYWRkVG9nZ2xlQnV0dG9uIiwidmFsdWUiLCJwYW5lIiwiX3NlbGVjdGVkUGFuZSIsIkhUTUxEaXZFbGVtZW50IiwicmVnaXN0ZXJFbGVtZW50IiwicHJvdG90eXBlIiwibW91c2Vtb3ZlIiwiZnJvbUV2ZW50IiwiYm9keSIsInNoYXJlIiwibW91c2V1cCIsIm1vdXNlZG93biIsIm1vdXNlZHJhZyIsImZsYXRNYXAiLCJzdGFydFgiLCJtZCIsImNsaWVudFgiLCJ3aW5kb3ciLCJzY3JvbGxYIiwic3RhcnRZIiwiY2xpZW50WSIsInNjcm9sbFkiLCJtYXAiLCJtbSIsImxlZnQiLCJwYXJzZUludCIsInRhcmdldCIsInRha2VVbnRpbCIsInN1YnNjcmliZSIsIngiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQUNBOzs7Ozs7OztJQW1DTUEsVSxXQUFBQSxVOzs7Ozs7Ozs7OzswQ0FrQ29CO0FBQUE7O0FBQ2xCLGlCQUFLQyxVQUFMLEdBQWtCLHdDQUFsQjtBQUNBLGlCQUFLQyxNQUFMLEdBQWMsSUFBSUMsR0FBSixFQUFkO0FBQ0EsaUJBQUtDLFNBQUwsR0FBaUIsUUFBakI7QUFDQSxpQkFBS0MsT0FBTCxHQUFlLEtBQWY7QUFDQSxpQkFBS0MsVUFBTCxHQUFrQixDQUFsQjtBQUNBLGlCQUFLQyxRQUFMLEdBQWdCQyxLQUFLQyxNQUFMLENBQVlDLEdBQVosQ0FBd0IsaUJBQXhCLENBQWhCO0FBRUEsZ0JBQUlILFdBQVcsS0FBS0EsUUFBTCxHQUFnQixDQUEvQjtBQUNBLGdCQUFJQSxZQUFZLENBQWhCLEVBQ0lBLFdBQVcsQ0FBWDtBQUVKLGlCQUFLSSxTQUFMLENBQWVDLEdBQWYsQ0FBbUIsYUFBbkIsRUFBa0Ms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QUFZc0csQ0FBWixDQUFMO0FBQUEsYUFBcEIsRUFBeUMsSUFBekMsRUFBK0M7QUFBQSx1QkFBTSxPQUFLbEcsSUFBTCxFQUFOO0FBQUEsYUFBL0MsQ0FBcEI7QUFDSDs7OztFQXBDd0J3RSxjOztBQXVDdkJoRixRQUFTQyxPQUFULEdBQXlCVSxTQUFVc0UsZUFBVixDQUEwQixtQkFBMUIsRUFBK0MsRUFBRUMsV0FBV2pGLFFBQVFpRixTQUFyQixFQUEvQyxDQUF6QiIsImZpbGUiOiJsaWIvdmlld3MvZG9jay13aW5kb3cuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge09ic2VydmFibGV9IGZyb20gJ3J4anMnO1xyXG5pbXBvcnQge0NvbXBvc2l0ZURpc3Bvc2FibGUsIERpc3Bvc2FibGUsIElEaXNwb3NhYmxlLCBTaW5nbGVBc3NpZ25tZW50RGlzcG9zYWJsZX0gZnJvbSAndHMtZGlzcG9zYWJsZXMnO1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBUb2dnbGVCdXR0b24ge1xyXG4gICAgaWQ6IHN0cmluZztcclxuICAgIHRpdGxlOiBzdHJpbmc7XHJcbiAgICB2aWV3OiBIVE1MRWxlbWVudDtcclxuICAgIG9wdGlvbnM6IERvY0J1dHRvbk9wdGlvbnM7XHJcbiAgICBkaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIERvY0J1dHRvbk9wdGlvbnMge1xyXG4gICAgcHJpb3JpdHk/OiBudW1iZXI7XHJcbn1cclxuXHJcbmludGVyZmFjZSBJbnRlcm5hbFRvZ2dsZUJ1dHRvbiBleHRlbmRzIFRvZ2dsZUJ1dHRvbiB7XHJcblxyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFBhbmVCdXR0b24ge1xyXG4gICAgaWQ6IHN0cmluZztcclxuICAgIHRpdGxlOiBzdHJpbmc7XHJcbiAgICB2aWV3OiBIVE1MRWxlbWVudDtcclxuICAgIG9wdGlvbnM6IFBhbmVCdXR0b25PcHRpb25zO1xyXG4gICAgZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBQYW5lQnV0dG9uT3B0aW9ucyB7XHJcbiAgICBwcmlvcml0eT86IG51bWJlcjtcclxuICAgIGNsb3NlYWJsZT86IGJvb2xlYW47XHJcbn1cclxuXHJcbmludGVyZmFjZSBJbnRlcm5hbFBhbmVCdXR0b24gZXh0ZW5kcyBQYW5lQnV0dG9uIHtcclxuICAgIF9idXR0b24/OiBFbGVtZW50O1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgRG9ja1dpbmRvdyBleHRlbmRzIEhUTUxEaXZFbGVtZW50IGltcGxlbWVudHMgV2ViQ29tcG9uZW50IHtcclxuICAgIHByaXZhdGUgZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxuICAgIHByaXZhdGUgX3BhbmVsOiBBdG9tLlBhbmVsO1xyXG4gICAgcHJpdmF0ZSBfc2VsZWN0ZWRQYW5lOiBJbnRlcm5hbFBhbmVCdXR0b247XHJcbiAgICBwcml2YXRlIF90b29sYmFyOiBIVE1MRGl2RWxlbWVudDtcclxuICAgIHByaXZhdGUgX3BhbmVCdXR0b25zOiBIVE1MRGl2RWxlbWVudDtcclxuICAgIHByaXZhdGUgX3RvZ2dsZUJ1dHRvbnM6IEhUTUxEaXZFbGVtZW50O1xyXG4gICAgcHJpdmF0ZSBfcGFuZXM6IE1hcDxzdHJpbmcsIEludGVybmFsUGFuZUJ1dHRvbj47XHJcbiAgICBwcml2YXRlIHZpc2libGU6IGJvb2xlYW47XHJcbiAgICBwcml2YXRlIHRlbXBIZWlnaHQ6IG51bWJlcjtcclxuICAgIHByaXZhdGUgZm9udFNpemU6IGFueTtcclxuXHJcbiAgICBwdWJsaWMgZ2V0IGlzT3BlbigpIHsgcmV0dXJuIHRoaXMudmlzaWJsZTsgfVxyXG4gICAgLy9hdG9tLmNvbmZpZy5nZXQ8bnVtYmVyPihcImVkaXRvci5mb250U2l6ZVwiKVxyXG5cclxuICAgIHByaXZhdGUgX3NlbGVjdGVkOiBzdHJpbmc7XHJcbiAgICBwdWJsaWMgZ2V0IHNlbGVjdGVkKCkgeyByZXR1cm4gdGhpcy5fc2VsZWN0ZWQ7IH1cclxuICAgIHB1YmxpYyBzZXQgc2VsZWN0ZWQodmFsdWUpIHtcclxuICAgICAgICBjb25zdCBwYW5lID0gdGhpcy5fcGFuZXMuZ2V0KHZhbHVlKTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX3NlbGVjdGVkUGFuZSkge1xyXG4gICAgICAgICAgICB0aGlzLl9zZWxlY3RlZFBhbmUuX2J1dHRvbi5jbGFzc0xpc3QucmVtb3ZlKCdzZWxlY3RlZCcpO1xyXG4gICAgICAgICAgICB0aGlzLl9zZWxlY3RlZFBhbmUudmlldy5yZW1vdmUoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChwYW5lKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3NlbGVjdGVkUGFuZSA9IHBhbmU7XHJcbiAgICAgICAgICAgIHBhbmUuX2J1dHRvbi5jbGFzc0xpc3QuYWRkKCdzZWxlY3RlZCcpO1xyXG4gICAgICAgICAgICB0aGlzLmFwcGVuZENoaWxkKHBhbmUudmlldyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLl9zZWxlY3RlZCA9IHZhbHVlO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBjcmVhdGVkQ2FsbGJhY2soKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgICAgICB0aGlzLl9wYW5lcyA9IG5ldyBNYXA8c3RyaW5nLCBJbnRlcm5hbFBhbmVCdXR0b24+KCk7XHJcbiAgICAgICAgdGhpcy5fc2VsZWN0ZWQgPSAnb3V0cHV0JztcclxuICAgICAgICB0aGlzLnZpc2libGUgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLnRlbXBIZWlnaHQgPSAwO1xyXG4gICAgICAgIHRoaXMuZm9udFNpemUgPSBhdG9tLmNvbmZpZy5nZXQ8bnVtYmVyPignZWRpdG9yLmZvbnRTaXplJyk7XHJcblxyXG4gICAgICAgIGxldCBmb250U2l6ZSA9IHRoaXMuZm9udFNpemUgLSAxO1xyXG4gICAgICAgIGlmIChmb250U2l6ZSA8PSAwKVxyXG4gICAgICAgICAgICBmb250U2l6ZSA9IDE7XHJcblxyXG4gICAgICAgIHRoaXMuY2xhc3NMaXN0LmFkZCgnaW5zZXQtcGFuZWwnLCAnZm9udC1zaXplLScgKyBmb250U2l6ZSk7XHJcbiAgICAgICAgaWYgKHRoaXMuY2xpZW50SGVpZ2h0IHx8IHRoaXMudGVtcEhlaWdodCkge1xyXG4gICAgICAgICAgICB0aGlzLnN0eWxlLmhlaWdodCA9IHRoaXMuY2xpZW50SGVpZ2h0ICsgdGhpcy50ZW1wSGVpZ2h0ICsgJ3B4JztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHJlc2l6ZXIgPSBuZXcgZXhwb3J0cy5SZXNpemVyKCk7XHJcbiAgICAgICAgbGV0IF9vcmlnaW5hbEhlaWdodCA9IHRoaXMuY2xpZW50SGVpZ2h0O1xyXG4gICAgICAgIHJlc2l6ZXIuc3RhcnQgPSAoKSA9PiB7IF9vcmlnaW5hbEhlaWdodCA9IHRoaXMuY2xpZW50SGVpZ2h0OyB9O1xyXG4gICAgICAgIHJlc2l6ZXIudXBkYXRlID0gKHt0b3B9OiB7IGxlZnQ6IG51bWJlciwgdG9wOiBudW1iZXIgfSkgPT4ge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyh0b3ApO1xyXG4gICAgICAgICAgICB0aGlzLnN0eWxlLmhlaWdodCA9IGAke19vcmlnaW5hbEhlaWdodCArIC0odG9wKX1weGA7XHJcbiAgICAgICAgfTtcclxuICAgICAgICByZXNpemVyLmRvbmUgPSAoKSA9PiB7IC8qICovIH07XHJcbiAgICAgICAgdGhpcy5hcHBlbmRDaGlsZChyZXNpemVyKTtcclxuXHJcbiAgICAgICAgY29uc3Qgd2luZG93cyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICAgIHdpbmRvd3MuY2xhc3NMaXN0LmFkZCgncGFuZWwtaGVhZGluZycsICdjbGVhcmZpeCcpO1xyXG4gICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQod2luZG93cyk7XHJcblxyXG4gICAgICAgIHRoaXMuX3Rvb2xiYXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgICB0aGlzLl90b29sYmFyLmNsYXNzTGlzdC5hZGQoJ2J0bi10b29sYmFyJywgJ3B1bGwtbGVmdCcpO1xyXG4gICAgICAgIHdpbmRvd3MuYXBwZW5kQ2hpbGQodGhpcy5fdG9vbGJhcik7XHJcblxyXG4gICAgICAgIHRoaXMuX3BhbmVCdXR0b25zID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICAgICAgdGhpcy5fcGFuZUJ1dHRvbnMuY2xhc3NMaXN0LmFkZCgnYnRuLWdyb3VwJywgJ2J0bi10b2dnbGUnKTtcclxuICAgICAgICB0aGlzLl90b29sYmFyLmFwcGVuZENoaWxkKHRoaXMuX3BhbmVCdXR0b25zKTtcclxuXHJcbiAgICAgICAgdGhpcy5fdG9nZ2xlQnV0dG9ucyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICAgIHRoaXMuX3RvZ2dsZUJ1dHRvbnMuY2xhc3NMaXN0LmFkZCgnYnRuLXdlbGwnLCAncHVsbC1yaWdodCcsICdidG4tZ3JvdXAnKTtcclxuICAgICAgICB3aW5kb3dzLmFwcGVuZENoaWxkKHRoaXMuX3RvZ2dsZUJ1dHRvbnMpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBhdHRhY2hlZENhbGxiYWNrKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb25maWcub2JzZXJ2ZSgnZWRpdG9yLmZvbnRTaXplJywgKHNpemU6IG51bWJlcikgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLmNsYXNzTmFtZSA9IHRoaXMuY2xhc3NOYW1lLnJlcGxhY2UoL2ZvbnQtc2l6ZS1bXFxkXSovZywgJycpO1xyXG4gICAgICAgICAgICB0aGlzLmZvbnRTaXplID0gc2l6ZTtcclxuICAgICAgICAgICAgdGhpcy5jbGFzc0xpc3QuYWRkKCdmb250LXNpemUtJyArIHNpemUpO1xyXG4gICAgICAgIH0pKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2V0UGFuZWwocGFuZWw6IEF0b20uUGFuZWwpIHtcclxuICAgICAgICB0aGlzLl9wYW5lbCA9IHBhbmVsO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX2FkZERvY2tCdXR0b24oYnV0dG9uOiBJbnRlcm5hbFBhbmVCdXR0b24pIHtcclxuICAgICAgICBjb25zdCB7aWQsIHRpdGxlLCBvcHRpb25zLCBkaXNwb3NhYmxlfSA9IGJ1dHRvbjtcclxuXHJcbiAgICAgICAgY29uc3QgdmlldyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpO1xyXG4gICAgICAgIHZpZXcuY2xhc3NMaXN0LmFkZCgnYnRuJywgJ2J0bi1kZWZhdWx0JywgJ2J0bi1maXgnKTtcclxuICAgICAgICAodmlldyBhcyBhbnkpLl9pZCA9IGlkO1xyXG4gICAgICAgICh2aWV3IGFzIGFueSkuX3ByaW9yaXR5ID0gb3B0aW9ucy5wcmlvcml0eTtcclxuXHJcbiAgICAgICAgZGlzcG9zYWJsZS5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xyXG4gICAgICAgICAgICBpZiAodmlldy5jbGFzc0xpc3QuY29udGFpbnMoJ3NlbGVjdGVkJykpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWQgPSAodmlldy5wcmV2aW91c0VsZW1lbnRTaWJsaW5nIGFzIGFueSkuX2lkO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHZpZXcucmVtb3ZlKCk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICBjb25zdCB0ZXh0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xyXG4gICAgICAgIHRleHQuaW5uZXJIVE1MID0gdGl0bGU7XHJcbiAgICAgICAgdGV4dC5jbGFzc0xpc3QuYWRkKCd0ZXh0Jyk7XHJcbiAgICAgICAgdmlldy5hcHBlbmRDaGlsZCh0ZXh0KTtcclxuXHJcbiAgICAgICAgaWYgKG9wdGlvbnMuY2xvc2VhYmxlKSB7XHJcbiAgICAgICAgICAgIHZpZXcuY2xhc3NMaXN0LmFkZCgnY2xvc2VhYmxlJyk7XHJcblxyXG4gICAgICAgICAgICBjb25zdCBjbG9zZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcclxuICAgICAgICAgICAgY2xvc2UuY2xhc3NMaXN0LmFkZCgnZmEnLCAnZmEtdGltZXMtY2lyY2xlJywgJ2Nsb3NlLXBhbmUnKTtcclxuICAgICAgICAgICAgY2xvc2Uub25jbGljayA9IGUgPT4ge1xyXG4gICAgICAgICAgICAgICAgZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIHZpZXcuYXBwZW5kQ2hpbGQoY2xvc2UpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmlldy5vbmNsaWNrID0gZSA9PiB7XHJcbiAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgICAgdGhpcy5zZWxlY3RlZCA9IGlkO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGJ1dHRvbi5fYnV0dG9uID0gdmlldztcclxuXHJcbiAgICAgICAgdGhpcy5faW5zZXJ0QnV0dG9uKHRoaXMuX3BhbmVCdXR0b25zLCB2aWV3LCBvcHRpb25zLnByaW9yaXR5LCBpZCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfYWRkVG9nZ2xlQnV0dG9uKHtpZCwgb3B0aW9ucywgdmlldywgZGlzcG9zYWJsZX06IFRvZ2dsZUJ1dHRvbikge1xyXG4gICAgICAgIGRpc3Bvc2FibGUuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcclxuICAgICAgICAgICAgdmlldy5yZW1vdmUoKTtcclxuICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLnJlbW92ZShkaXNwb3NhYmxlKTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuX2luc2VydEJ1dHRvbih0aGlzLl90b2dnbGVCdXR0b25zLCB2aWV3LCBvcHRpb25zLnByaW9yaXR5LCBpZCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfaW5zZXJ0QnV0dG9uKHBhcmVudDogRWxlbWVudCwgZWxlbWVudDogRWxlbWVudCwgcHJpb3JpdHk6IG51bWJlciwgaWQ6IHN0cmluZykge1xyXG4gICAgICAgIGxldCBpbnNlcnRJbmRleCA9IC0xO1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGFyZW50LmNoaWxkTm9kZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgY29uc3QgY2hpbGQgPSA8YW55PnBhcmVudC5jaGlsZE5vZGVzW2ldO1xyXG4gICAgICAgICAgICBpZiAoY2hpbGQuX2lkIDw9IGlkICYmIGNoaWxkLl9wcmlvcml0eSA8PSBwcmlvcml0eSkge1xyXG4gICAgICAgICAgICAgICAgaW5zZXJ0SW5kZXggPSBpICsgMTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaW5zZXJ0SW5kZXggPiAtMSAmJiBpbnNlcnRJbmRleCA8IHBhcmVudC5jaGlsZE5vZGVzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICBwYXJlbnQuaW5zZXJ0QmVmb3JlKGVsZW1lbnQsIHBhcmVudC5jaGlsZE5vZGVzW2luc2VydEluZGV4XSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcGFyZW50LmFwcGVuZENoaWxkKGVsZW1lbnQpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHVwZGF0ZUF0b20oY2I/OiAoKSA9PiB2b2lkKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuX3BhbmVsLnZpc2libGUgIT09IHRoaXMudmlzaWJsZSkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy52aXNpYmxlKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9wYW5lbC5zaG93KCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9wYW5lbC5oaWRlKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGNiKSBjYigpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzaG93VmlldygpIHtcclxuICAgICAgICB0aGlzLnZpc2libGUgPSB0cnVlO1xyXG4gICAgICAgIHRoaXMudXBkYXRlQXRvbSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkb1Nob3dWaWV3KCkge1xyXG4gICAgICAgIHRoaXMudmlzaWJsZSA9IHRydWU7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGhpZGVWaWV3KCkge1xyXG4gICAgICAgIHRoaXMuZG9IaWRlVmlldygpO1xyXG4gICAgICAgIHRoaXMudXBkYXRlQXRvbSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZG9IaWRlVmlldygpIHtcclxuICAgICAgICB0aGlzLnZpc2libGUgPSBmYWxzZTtcclxuICAgICAgICBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVQYW5lKCkuYWN0aXZhdGUoKTtcclxuICAgICAgICBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVQYW5lKCkuYWN0aXZhdGVJdGVtKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHRvZ2dsZVZpZXcoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMudmlzaWJsZSkge1xyXG4gICAgICAgICAgICB0aGlzLmRvSGlkZVZpZXcoKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLmRvU2hvd1ZpZXcoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy51cGRhdGVBdG9tKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHRvZ2dsZVdpbmRvdyhzZWxlY3RlZDogc3RyaW5nKSB7XHJcbiAgICAgICAgaWYgKHRoaXMudmlzaWJsZSAmJiB0aGlzLnNlbGVjdGVkID09PSBzZWxlY3RlZCkge1xyXG4gICAgICAgICAgICB0aGlzLmhpZGVWaWV3KCk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuc2VsZWN0V2luZG93KHNlbGVjdGVkKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2VsZWN0V2luZG93KHNlbGVjdGVkOiBzdHJpbmcpIHtcclxuICAgICAgICBpZiAoIXRoaXMudmlzaWJsZSlcclxuICAgICAgICAgICAgdGhpcy5kb1Nob3dWaWV3KCk7XHJcblxyXG4gICAgICAgIHRoaXMuc2VsZWN0ZWQgPSBzZWxlY3RlZDtcclxuXHJcbiAgICAgICAgLy8gRm9jdXMgdGhlIHBhbmVsIVxyXG4gICAgICAgIHRoaXMudXBkYXRlQXRvbSgoKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IHBhbmVsOiBhbnkgPSB0aGlzLnF1ZXJ5U2VsZWN0b3IoJy5vbW5pc2hhcnAtYXRvbS1vdXRwdXQuc2VsZWN0ZWQnKTtcclxuICAgICAgICAgICAgaWYgKHBhbmVsKSBwYW5lbC5mb2N1cygpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBhZGRXaW5kb3coaWQ6IHN0cmluZywgdGl0bGU6IHN0cmluZywgdmlldzogSFRNTEVsZW1lbnQsIG9wdGlvbnM6IFBhbmVCdXR0b25PcHRpb25zID0geyBwcmlvcml0eTogMTAwMCB9LCBwYXJlbnREaXNwb3NhYmxlPzogRGlzcG9zYWJsZSkge1xyXG4gICAgICAgIGNvbnN0IGRpc3Bvc2FibGUgPSBuZXcgU2luZ2xlQXNzaWdubWVudERpc3Bvc2FibGUoKTtcclxuICAgICAgICBjb25zdCBjZCA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcbiAgICAgICAgY29uc3QgY29udGV4dCA9IHsgaWQsIHRpdGxlLCB2aWV3LCBvcHRpb25zLCBkaXNwb3NhYmxlOiBjZCB9O1xyXG5cclxuICAgICAgICB0aGlzLl9wYW5lcy5zZXQoaWQsIGNvbnRleHQpO1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoZGlzcG9zYWJsZSk7XHJcbiAgICAgICAgZGlzcG9zYWJsZS5kaXNwb3NhYmxlID0gY2Q7XHJcblxyXG4gICAgICAgIGlmIChwYXJlbnREaXNwb3NhYmxlKVxyXG4gICAgICAgICAgICBjZC5hZGQocGFyZW50RGlzcG9zYWJsZSk7XHJcblxyXG4gICAgICAgIHZpZXcuY2xhc3NMaXN0LmFkZCgnb21uaXNoYXJwLWF0b20tb3V0cHV0JywgYCR7aWR9LW91dHB1dGAsICdzZWxlY3RlZCcpO1xyXG5cclxuICAgICAgICBjZC5hZGQoYXRvbS5jb21tYW5kcy5hZGQoJ2F0b20td29ya3NwYWNlJywgJ29tbmlzaGFycC1hdG9tOmRvY2stc2hvdy0nICsgaWQsICgpID0+IHRoaXMuc2VsZWN0V2luZG93KGlkKSkpO1xyXG4gICAgICAgIGNkLmFkZChhdG9tLmNvbW1hbmRzLmFkZCgnYXRvbS13b3Jrc3BhY2UnLCAnb21uaXNoYXJwLWF0b206ZG9jay10b2dnbGUtJyArIGlkLCAoKSA9PiB0aGlzLnRvZ2dsZVdpbmRvdyhpZCkpKTtcclxuXHJcbiAgICAgICAgaWYgKG9wdGlvbnMuY2xvc2VhYmxlKSB7XHJcbiAgICAgICAgICAgIGNkLmFkZChhdG9tLmNvbW1hbmRzLmFkZCgnYXRvbS13b3Jrc3BhY2UnLCAnb21uaXNoYXJwLWF0b206ZG9jay1jbG9zZS0nICsgaWQsICgpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5yZW1vdmUoZGlzcG9zYWJsZSk7XHJcbiAgICAgICAgICAgICAgICBkaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuaGlkZVZpZXcoKTtcclxuICAgICAgICAgICAgfSkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY2QuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuc2VsZWN0ZWQgPT09IGlkKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNlbGVjdGVkID0gJ291dHB1dCc7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIGNkLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XHJcbiAgICAgICAgICAgIHZpZXcucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgIHRoaXMuX3BhbmVzLmRlbGV0ZShpZCk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLl9hZGREb2NrQnV0dG9uKGNvbnRleHQpO1xyXG5cclxuICAgICAgICBpZiAoIXRoaXMuc2VsZWN0ZWQpIHRoaXMuc2VsZWN0ZWQgPSBpZDtcclxuXHJcbiAgICAgICAgcmV0dXJuIDxJRGlzcG9zYWJsZT5kaXNwb3NhYmxlO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBhZGRCdXR0b24oaWQ6IHN0cmluZywgdGl0bGU6IHN0cmluZywgdmlldzogSFRNTEVsZW1lbnQsIG9wdGlvbnM6IERvY0J1dHRvbk9wdGlvbnMgPSB7IHByaW9yaXR5OiAxMDAwIH0sIHBhcmVudERpc3Bvc2FibGU/OiBEaXNwb3NhYmxlKSB7XHJcbiAgICAgICAgY29uc3QgZGlzcG9zYWJsZSA9IG5ldyBTaW5nbGVBc3NpZ25tZW50RGlzcG9zYWJsZSgpO1xyXG4gICAgICAgIGNvbnN0IGNkID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGRpc3Bvc2FibGUpO1xyXG4gICAgICAgIGRpc3Bvc2FibGUuZGlzcG9zYWJsZSA9IGNkO1xyXG5cclxuICAgICAgICBpZiAocGFyZW50RGlzcG9zYWJsZSlcclxuICAgICAgICAgICAgY2QuYWRkKHBhcmVudERpc3Bvc2FibGUpO1xyXG5cclxuICAgICAgICB0aGlzLl9hZGRUb2dnbGVCdXR0b24oeyBpZCwgdGl0bGUsIHZpZXcsIG9wdGlvbnMsIGRpc3Bvc2FibGU6IGNkIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gPElEaXNwb3NhYmxlPmRpc3Bvc2FibGU7XHJcbiAgICB9XHJcbn1cclxuXHJcbig8YW55PmV4cG9ydHMpLkRvY2tXaW5kb3cgPSAoPGFueT5kb2N1bWVudCkucmVnaXN0ZXJFbGVtZW50KCdvbW5pc2hhcnAtZG9jay13aW5kb3cnLCB7IHByb3RvdHlwZTogRG9ja1dpbmRvdy5wcm90b3R5cGUgfSk7XHJcblxyXG5leHBvcnQgY2xhc3MgUmVzaXplciBleHRlbmRzIEhUTUxEaXZFbGVtZW50IGltcGxlbWVudHMgV2ViQ29tcG9uZW50IHtcclxuICAgIHByaXZhdGUgZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxuICAgIHB1YmxpYyB1cGRhdGU6IChsb2NhdGlvbjogeyBsZWZ0OiBudW1iZXI7IHRvcDogbnVtYmVyIH0pID0+IHZvaWQ7XHJcbiAgICBwdWJsaWMgZG9uZTogKCkgPT4gdm9pZDtcclxuICAgIHB1YmxpYyBzdGFydDogKCkgPT4gdm9pZDtcclxuXHJcbiAgICBwdWJsaWMgY3JlYXRlZENhbGxiYWNrKCkge1xyXG4gICAgICAgIHRoaXMuY2xhc3NMaXN0LmFkZCgnb21uaXNoYXJwLWF0b20tb3V0cHV0LXJlc2l6ZXInKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGV0YWNoZWRDYWxsYmFjaygpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBhdHRhY2hlZENhbGxiYWNrKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcbiAgICAgICAgY29uc3QgbW91c2Vtb3ZlID0gT2JzZXJ2YWJsZS5mcm9tRXZlbnQ8TW91c2VFdmVudD4oZG9jdW1lbnQuYm9keSwgJ21vdXNlbW92ZScpLnNoYXJlKCk7XHJcbiAgICAgICAgY29uc3QgbW91c2V1cCA9IE9ic2VydmFibGUuZnJvbUV2ZW50PE1vdXNlRXZlbnQ+KGRvY3VtZW50LmJvZHksICdtb3VzZXVwJykuc2hhcmUoKTtcclxuICAgICAgICBjb25zdCBtb3VzZWRvd24gPSBPYnNlcnZhYmxlLmZyb21FdmVudDxNb3VzZUV2ZW50Pih0aGlzLCAnbW91c2Vkb3duJykuc2hhcmUoKTtcclxuXHJcbiAgICAgICAgY29uc3QgbW91c2VkcmFnID0gbW91c2Vkb3duLmZsYXRNYXAobWQgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBzdGFydFggPSBtZC5jbGllbnRYICsgd2luZG93LnNjcm9sbFgsXHJcbiAgICAgICAgICAgICAgICBzdGFydFkgPSBtZC5jbGllbnRZICsgd2luZG93LnNjcm9sbFk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gbW91c2Vtb3ZlLm1hcChtbSA9PiB7XHJcbiAgICAgICAgICAgICAgICBtbS5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGVmdDogKHBhcnNlSW50KCg8YW55Pm1kLnRhcmdldCkuc3R5bGUubGVmdCwgMTApIHx8IDApICsgbW0uY2xpZW50WCAtIHN0YXJ0WCxcclxuICAgICAgICAgICAgICAgICAgICB0b3A6IChwYXJzZUludCgoPGFueT5tZC50YXJnZXQpLnN0eWxlLnRvcCwgMTApIHx8IDApICsgbW0uY2xpZW50WSAtIHN0YXJ0WVxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgfSkudGFrZVVudGlsKG1vdXNldXApO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKG1vdXNlZG93bi5zdWJzY3JpYmUoeCA9PiB0aGlzLnN0YXJ0KCkpKTtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKG1vdXNlZHJhZy5zdWJzY3JpYmUoeCA9PiB0aGlzLnVwZGF0ZSh4KSwgbnVsbCwgKCkgPT4gdGhpcy5kb25lKCkpKTtcclxuICAgIH1cclxufVxyXG5cclxuKDxhbnk+ZXhwb3J0cykuUmVzaXplciA9ICg8YW55PmRvY3VtZW50KS5yZWdpc3RlckVsZW1lbnQoJ29tbmlzaGFycC1yZXNpemVyJywgeyBwcm90b3R5cGU6IFJlc2l6ZXIucHJvdG90eXBlIH0pO1xyXG4iXX0=
