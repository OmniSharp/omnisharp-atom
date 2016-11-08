"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Resizer = exports.DockWindow = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _rxjs = require("rxjs");

var _tsDisposables = require("ts-disposables");

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
        key: "createdCallback",
        value: function createdCallback() {
            var _this2 = this;

            this.disposable = new _tsDisposables.CompositeDisposable();
            this._panes = new Map();
            this._selected = "output";
            this.visible = false;
            this.tempHeight = 0;
            this.fontSize = atom.config.get("editor.fontSize");
            var fontSize = this.fontSize - 1;
            if (fontSize <= 0) fontSize = 1;
            this.classList.add("inset-panel", "font-size-" + fontSize);
            if (this.clientHeight || this.tempHeight) {
                this.style.height = this.clientHeight + this.tempHeight + "px";
            }
            var resizer = new exports.Resizer();
            var _originalHeight = this.clientHeight;
            resizer.start = function () {
                _originalHeight = _this2.clientHeight;
            };
            resizer.update = function (_ref) {
                var top = _ref.top;

                console.log(top);
                _this2.style.height = _originalHeight + -top + "px";
            };
            resizer.done = function () {};
            this.appendChild(resizer);
            var windows = document.createElement("div");
            windows.classList.add("panel-heading", "clearfix");
            this.appendChild(windows);
            this._toolbar = document.createElement("div");
            this._toolbar.classList.add("btn-toolbar", "pull-left");
            windows.appendChild(this._toolbar);
            this._paneButtons = document.createElement("div");
            this._paneButtons.classList.add("btn-group", "btn-toggle");
            this._toolbar.appendChild(this._paneButtons);
            this._toggleButtons = document.createElement("div");
            this._toggleButtons.classList.add("btn-well", "pull-right", "btn-group");
            windows.appendChild(this._toggleButtons);
        }
    }, {
        key: "attachedCallback",
        value: function attachedCallback() {
            var _this3 = this;

            this.disposable.add(atom.config.observe("editor.fontSize", function (size) {
                _this3.className = _this3.className.replace(/font-size-[\d]*/g, "");
                _this3.fontSize = size;
                _this3.classList.add("font-size-" + size);
            }));
        }
    }, {
        key: "setPanel",
        value: function setPanel(panel) {
            this._panel = panel;
        }
    }, {
        key: "_addDockButton",
        value: function _addDockButton(button) {
            var _this4 = this;

            var id = button.id,
                title = button.title,
                options = button.options,
                disposable = button.disposable;

            var view = document.createElement("button");
            view.classList.add("btn", "btn-default", "btn-fix");
            view._id = id;
            view._priority = options.priority;
            disposable.add(_tsDisposables.Disposable.create(function () {
                if (view.classList.contains("selected")) {
                    _this4.selected = view.previousElementSibling._id;
                }
                view.remove();
            }));
            var text = document.createElement("span");
            text.innerHTML = title;
            text.classList.add("text");
            view.appendChild(text);
            if (options.closeable) {
                view.classList.add("closeable");
                var close = document.createElement("span");
                close.classList.add("fa", "fa-times-circle", "close-pane");
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
        key: "_addToggleButton",
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
        key: "_insertButton",
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
        key: "updateAtom",
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
        key: "showView",
        value: function showView() {
            this.visible = true;
            this.updateAtom();
        }
    }, {
        key: "doShowView",
        value: function doShowView() {
            this.visible = true;
        }
    }, {
        key: "hideView",
        value: function hideView() {
            this.doHideView();
            this.updateAtom();
        }
    }, {
        key: "doHideView",
        value: function doHideView() {
            this.visible = false;
            atom.workspace.getActivePane().activate();
            atom.workspace.getActivePane().activateItem();
        }
    }, {
        key: "toggleView",
        value: function toggleView() {
            if (this.visible) {
                this.doHideView();
            } else {
                this.doShowView();
            }
            this.updateAtom();
        }
    }, {
        key: "toggleWindow",
        value: function toggleWindow(selected) {
            if (this.visible && this.selected === selected) {
                this.hideView();
                return;
            }
            this.selectWindow(selected);
        }
    }, {
        key: "selectWindow",
        value: function selectWindow(selected) {
            var _this6 = this;

            if (!this.visible) this.doShowView();
            this.selected = selected;
            this.updateAtom(function () {
                var panel = _this6.querySelector(".omnisharp-atom-output.selected");
                if (panel) panel.focus();
            });
        }
    }, {
        key: "addWindow",
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
            view.classList.add("omnisharp-atom-output", id + "-output", "selected");
            cd.add(atom.commands.add("atom-workspace", "omnisharp-atom:dock-show-" + id, function () {
                return _this7.selectWindow(id);
            }));
            cd.add(atom.commands.add("atom-workspace", "omnisharp-atom:dock-toggle-" + id, function () {
                return _this7.toggleWindow(id);
            }));
            if (options.closeable) {
                cd.add(atom.commands.add("atom-workspace", "omnisharp-atom:dock-close-" + id, function () {
                    _this7.disposable.remove(disposable);
                    disposable.dispose();
                    _this7.hideView();
                }));
            }
            cd.add(_tsDisposables.Disposable.create(function () {
                if (_this7.selected === id) {
                    _this7.selected = "output";
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
        key: "addButton",
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
        key: "isOpen",
        get: function get() {
            return this.visible;
        }
    }, {
        key: "selected",
        get: function get() {
            return this._selected;
        },
        set: function set(value) {
            var pane = this._panes.get(value);
            if (this._selectedPane) {
                this._selectedPane._button.classList.remove("selected");
                this._selectedPane.view.remove();
            }
            if (pane) {
                this._selectedPane = pane;
                pane._button.classList.add("selected");
                this.appendChild(pane.view);
            }
            this._selected = value;
        }
    }]);

    return DockWindow;
}(HTMLDivElement);

exports.DockWindow = document.registerElement("omnisharp-dock-window", { prototype: DockWindow.prototype });

var Resizer = exports.Resizer = function (_HTMLDivElement2) {
    _inherits(Resizer, _HTMLDivElement2);

    function Resizer() {
        _classCallCheck(this, Resizer);

        return _possibleConstructorReturn(this, (Resizer.__proto__ || Object.getPrototypeOf(Resizer)).apply(this, arguments));
    }

    _createClass(Resizer, [{
        key: "createdCallback",
        value: function createdCallback() {
            this.classList.add("omnisharp-atom-output-resizer");
        }
    }, {
        key: "detachedCallback",
        value: function detachedCallback() {
            this.disposable.dispose();
        }
    }, {
        key: "attachedCallback",
        value: function attachedCallback() {
            var _this9 = this;

            this.disposable = new _tsDisposables.CompositeDisposable();
            var mousemove = _rxjs.Observable.fromEvent(document.body, "mousemove").share();
            var mouseup = _rxjs.Observable.fromEvent(document.body, "mouseup").share();
            var mousedown = _rxjs.Observable.fromEvent(this, "mousedown").share();
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

exports.Resizer = document.registerElement("omnisharp-resizer", { prototype: Resizer.prototype });
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy9kb2NrLXdpbmRvdy5qcyIsImxpYi92aWV3cy9kb2NrLXdpbmRvdy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7QUFDQTs7Ozs7Ozs7SUNtQ0E7Ozs7Ozs7Ozs7OzBDQWtDMEI7OztBQUNsQixpQkFBSyxVQUFMLEdBQWtCLHdDQUFsQixDQURrQjtBQUVsQixpQkFBSyxNQUFMLEdBQWMsSUFBSSxHQUFKLEVBQWQsQ0FGa0I7QUFHbEIsaUJBQUssU0FBTCxHQUFpQixRQUFqQixDQUhrQjtBQUlsQixpQkFBSyxPQUFMLEdBQWUsS0FBZixDQUprQjtBQUtsQixpQkFBSyxVQUFMLEdBQWtCLENBQWxCLENBTGtCO0FBTWxCLGlCQUFLLFFBQUwsR0FBZ0IsS0FBSyxNQUFMLENBQVksR0FBWixDQUF3QixpQkFBeEIsQ0FBaEIsQ0FOa0I7QUFRbEIsZ0JBQUksV0FBVyxLQUFLLFFBQUwsR0FBZ0IsQ0FBaEIsQ0FSRztBQVNsQixnQkFBSSxZQUFZLENBQVosRUFDQSxXQUFXLENBQVgsQ0FESjtBQUdBLGlCQUFLLFNBQUwsQ0FBZSxHQUFmLENBQW1CLGFBQW5CLEVBQWtDLGVBQWUsUUFBZixDQUFsQyxDQVprQjtBQWFsQixnQkFBSSxLQUFLLFlBQUwsSUFBcUIsS0FBSyxVQUFMLEVBQWlCO0FBQ3RDLHFCQUFLLEtBQUwsQ0FBVyxNQUFYLEdBQW9CLEtBQUssWUFBTCxHQUFvQixLQUFLLFVBQUwsR0FBa0IsSUFBdEMsQ0FEa0I7YUFBMUM7QUFJQSxnQkFBTSxVQUFVLElBQUksUUFBUSxPQUFSLEVBQWQsQ0FqQlk7QUFrQmxCLGdCQUFJLGtCQUFrQixLQUFLLFlBQUwsQ0FsQko7QUFtQmxCLG9CQUFRLEtBQVIsR0FBZ0IsWUFBQTtBQUFRLGtDQUFrQixPQUFLLFlBQUwsQ0FBMUI7YUFBQSxDQW5CRTtBQW9CbEIsb0JBQVEsTUFBUixHQUFpQixnQkFBcUM7b0JBQW5DLGVBQW1DOztBQUNsRCx3QkFBUSxHQUFSLENBQVksR0FB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LEdBQWpCLEVBQXNCLEVBQXJDLEtBQTRDLENBQTVDLENBQUQsR0FBa0QsR0FBRyxPQUFILEdBQWEsTUFBL0Q7cUJBRlQsQ0FIb0I7aUJBQUgsQ0FBZCxDQU9KLFNBUEksQ0FPTSxPQVBOLENBQVAsQ0FKbUM7YUFBSCxDQUE5QixDQU5hO0FBb0JuQixpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLFVBQVUsU0FBVixDQUFvQjt1QkFBSyxPQUFLLEtBQUw7YUFBTCxDQUF4QyxFQXBCbUI7QUFxQm5CLGlCQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsVUFBVSxTQUFWLENBQW9CLFVBQUMsQ0FBRDt1QkFBTyxPQUFLLE1BQUwsQ0FBWSxDQUFaO2FBQVAsRUFBdUIsSUFBM0MsRUFBaUQ7dUJBQU0sT0FBSyxJQUFMO2FBQU4sQ0FBckUsRUFyQm1COzs7OztFQWRFOztBQXVDdkIsUUFBUyxPQUFULEdBQXlCLFNBQVUsZUFBVixDQUEwQixtQkFBMUIsRUFBK0MsRUFBRSxXQUFXLFFBQVEsU0FBUixFQUE1RCxDQUF6QiIsImZpbGUiOiJsaWIvdmlld3MvZG9jay13aW5kb3cuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBPYnNlcnZhYmxlIH0gZnJvbSBcInJ4anNcIjtcbmltcG9ydCB7IERpc3Bvc2FibGUsIENvbXBvc2l0ZURpc3Bvc2FibGUsIFNpbmdsZUFzc2lnbm1lbnREaXNwb3NhYmxlIH0gZnJvbSBcInRzLWRpc3Bvc2FibGVzXCI7XG5leHBvcnQgY2xhc3MgRG9ja1dpbmRvdyBleHRlbmRzIEhUTUxEaXZFbGVtZW50IHtcbiAgICBnZXQgaXNPcGVuKCkgeyByZXR1cm4gdGhpcy52aXNpYmxlOyB9XG4gICAgZ2V0IHNlbGVjdGVkKCkgeyByZXR1cm4gdGhpcy5fc2VsZWN0ZWQ7IH1cbiAgICBzZXQgc2VsZWN0ZWQodmFsdWUpIHtcbiAgICAgICAgY29uc3QgcGFuZSA9IHRoaXMuX3BhbmVzLmdldCh2YWx1ZSk7XG4gICAgICAgIGlmICh0aGlzLl9zZWxlY3RlZFBhbmUpIHtcbiAgICAgICAgICAgIHRoaXMuX3NlbGVjdGVkUGFuZS5fYnV0dG9uLmNsYXNzTGlzdC5yZW1vdmUoXCJzZWxlY3RlZFwiKTtcbiAgICAgICAgICAgIHRoaXMuX3NlbGVjdGVkUGFuZS52aWV3LnJlbW92ZSgpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChwYW5lKSB7XG4gICAgICAgICAgICB0aGlzLl9zZWxlY3RlZFBhbmUgPSBwYW5lO1xuICAgICAgICAgICAgcGFuZS5fYnV0dG9uLmNsYXNzTGlzdC5hZGQoXCJzZWxlY3RlZFwiKTtcbiAgICAgICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQocGFuZS52aWV3KTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9zZWxlY3RlZCA9IHZhbHVlO1xuICAgIH1cbiAgICBjcmVhdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIHRoaXMuX3BhbmVzID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLl9zZWxlY3RlZCA9IFwib3V0cHV0XCI7XG4gICAgICAgIHRoaXMudmlzaWJsZSA9IGZhbHNlO1xuICAgICAgICB0aGlzLnRlbXBIZWlnaHQgPSAwO1xuICAgICAgICB0aGlzLmZvbnRTaXplID0gYXRvbS5jb25maWcuZ2V0KFwiZWRpdG9yLmZvbnRTaXplXCIpO1xuICAgICAgICBsZXQgZm9udFNpemUgPSB0aGlzLmZvbnRTaXplIC0gMTtcbiAgICAgICAgaWYgKGZvbnRTaXplIDw9IDApXG4gICAgICAgICAgICBmb250U2l6ZSA9IDE7XG4gICAgICAgIHRoaXMuY2xhc3NMaXN0LmFkZChcImluc2V0LXBhbmVsXCIsIFwiZm9udC1zaXplLVwiICsgZm9udFNpemUpO1xuICAgICAgICBpZiAodGhpcy5jbGllbnRIZWlnaHQgfHwgdGhpcy50ZW1wSGVpZ2h0KSB7XG4gICAgICAgICAgICB0aGlzLnN0eWxlLmhlaWdodCA9IHRoaXMuY2xpZW50SGVpZ2h0ICsgdGhpcy50ZW1wSGVpZ2h0ICsgXCJweFwiO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHJlc2l6ZXIgPSBuZXcgZXhwb3J0cy5SZXNpemVyKCk7XG4gICAgICAgIGxldCBfb3JpZ2luYWxIZWlnaHQgPSB0aGlzLmNsaWVudEhlaWdodDtcbiAgICAgICAgcmVzaXplci5zdGFydCA9ICgpID0+IHsgX29yaWdpbmFsSGVpZ2h0ID0gdGhpcy5jbGllbnRIZWlnaHQ7IH07XG4gICAgICAgIHJlc2l6ZXIudXBkYXRlID0gKHsgdG9wIH0pID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHRvcCk7XG4gICAgICAgICAgICB0aGlzLnN0eWxlLmhlaWdodCA9IGAke19vcmlnaW5hbEhlaWdodCArIC0odG9wKX1weGA7XG4gICAgICAgIH07XG4gICAgICAgIHJlc2l6ZXIuZG9uZSA9ICgpID0+IHsgfTtcbiAgICAgICAgdGhpcy5hcHBlbmRDaGlsZChyZXNpemVyKTtcbiAgICAgICAgY29uc3Qgd2luZG93cyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgIHdpbmRvd3MuY2xhc3NMaXN0LmFkZChcInBhbmVsLWhlYWRpbmdcIiwgXCJjbGVhcmZpeFwiKTtcbiAgICAgICAgdGhpcy5hcHBlbmRDaGlsZCh3aW5kb3dzKTtcbiAgICAgICAgdGhpcy5fdG9vbGJhciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgIHRoaXMuX3Rvb2xiYXIuY2xhc3NMaXN0LmFkZChcImJ0bi10b29sYmFyXCIsIFwicHVsbC1sZWZ0XCIpO1xuICAgICAgICB3aW5kb3dzLmFwcGVuZENoaWxkKHRoaXMuX3Rvb2xiYXIpO1xuICAgICAgICB0aGlzLl9wYW5lQnV0dG9ucyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgIHRoaXMuX3BhbmVCdXR0b25zLmNsYXNzTGlzdC5hZGQoXCJidG4tZ3JvdXBcIiwgXCJidG4tdG9nZ2xlXCIpO1xuICAgICAgICB0aGlzLl90b29sYmFyLmFwcGVuZENoaWxkKHRoaXMuX3BhbmVCdXR0b25zKTtcbiAgICAgICAgdGhpcy5fdG9nZ2xlQnV0dG9ucyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgIHRoaXMuX3RvZ2dsZUJ1dHRvbnMuY2xhc3NMaXN0LmFkZChcImJ0bi13ZWxsXCIsIFwicHVsbC1yaWdodFwiLCBcImJ0bi1ncm91cFwiKTtcbiAgICAgICAgd2luZG93cy5hcHBlbmRDaGlsZCh0aGlzLl90b2dnbGVCdXR0b25zKTtcbiAgICB9XG4gICAgYXR0YWNoZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbmZpZy5vYnNlcnZlKFwiZWRpdG9yLmZvbnRTaXplXCIsIChzaXplKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmNsYXNzTmFtZSA9IHRoaXMuY2xhc3NOYW1lLnJlcGxhY2UoL2ZvbnQtc2l6ZS1bXFxkXSovZywgXCJcIik7XG4gICAgICAgICAgICB0aGlzLmZvbnRTaXplID0gc2l6ZTtcbiAgICAgICAgICAgIHRoaXMuY2xhc3NMaXN0LmFkZChcImZvbnQtc2l6ZS1cIiArIHNpemUpO1xuICAgICAgICB9KSk7XG4gICAgfVxuICAgIHNldFBhbmVsKHBhbmVsKSB7XG4gICAgICAgIHRoaXMuX3BhbmVsID0gcGFuZWw7XG4gICAgfVxuICAgIF9hZGREb2NrQnV0dG9uKGJ1dHRvbikge1xuICAgICAgICBjb25zdCB7IGlkLCB0aXRsZSwgb3B0aW9ucywgZGlzcG9zYWJsZSB9ID0gYnV0dG9uO1xuICAgICAgICBjb25zdCB2aWV3ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImJ1dHRvblwiKTtcbiAgICAgICAgdmlldy5jbGFzc0xpc3QuYWRkKFwiYnRuXCIsIFwiYnRuLWRlZmF1bHRcIiwgXCJidG4tZml4XCIpO1xuICAgICAgICB2aWV3Ll9pZCA9IGlkO1xuICAgICAgICB2aWV3Ll9wcmlvcml0eSA9IG9wdGlvbnMucHJpb3JpdHk7XG4gICAgICAgIGRpc3Bvc2FibGUuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcbiAgICAgICAgICAgIGlmICh2aWV3LmNsYXNzTGlzdC5jb250YWlucyhcInNlbGVjdGVkXCIpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZWxlY3RlZCA9IHZpZXcucHJldmlvdXNFbGVtZW50U2libGluZy5faWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2aWV3LnJlbW92ZSgpO1xuICAgICAgICB9KSk7XG4gICAgICAgIGNvbnN0IHRleHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgdGV4dC5pbm5lckhUTUwgPSB0aXRsZTtcbiAgICAgICAgdGV4dC5jbGFzc0xpc3QuYWRkKFwidGV4dFwiKTtcbiAgICAgICAgdmlldy5hcHBlbmRDaGlsZCh0ZXh0KTtcbiAgICAgICAgaWYgKG9wdGlvbnMuY2xvc2VhYmxlKSB7XG4gICAgICAgICAgICB2aWV3LmNsYXNzTGlzdC5hZGQoXCJjbG9zZWFibGVcIik7XG4gICAgICAgICAgICBjb25zdCBjbG9zZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICAgICAgY2xvc2UuY2xhc3NMaXN0LmFkZChcImZhXCIsIFwiZmEtdGltZXMtY2lyY2xlXCIsIFwiY2xvc2UtcGFuZVwiKTtcbiAgICAgICAgICAgIGNsb3NlLm9uY2xpY2sgPSAoZSkgPT4ge1xuICAgICAgICAgICAgICAgIGRpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHZpZXcuYXBwZW5kQ2hpbGQoY2xvc2UpO1xuICAgICAgICB9XG4gICAgICAgIHZpZXcub25jbGljayA9IChlKSA9PiB7XG4gICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgdGhpcy5zZWxlY3RlZCA9IGlkO1xuICAgICAgICB9O1xuICAgICAgICBidXR0b24uX2J1dHRvbiA9IHZpZXc7XG4gICAgICAgIHRoaXMuX2luc2VydEJ1dHRvbih0aGlzLl9wYW5lQnV0dG9ucywgdmlldywgb3B0aW9ucy5wcmlvcml0eSwgaWQpO1xuICAgIH1cbiAgICBfYWRkVG9nZ2xlQnV0dG9uKHsgaWQsIG9wdGlvbnMsIHZpZXcsIGRpc3Bvc2FibGUgfSkge1xuICAgICAgICBkaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XG4gICAgICAgICAgICB2aWV3LnJlbW92ZSgpO1xuICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLnJlbW92ZShkaXNwb3NhYmxlKTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLl9pbnNlcnRCdXR0b24odGhpcy5fdG9nZ2xlQnV0dG9ucywgdmlldywgb3B0aW9ucy5wcmlvcml0eSwgaWQpO1xuICAgIH1cbiAgICBfaW5zZXJ0QnV0dG9uKHBhcmVudCwgZWxlbWVudCwgcHJpb3JpdHksIGlkKSB7XG4gICAgICAgIGxldCBpbnNlcnRJbmRleCA9IC0xO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBhcmVudC5jaGlsZE5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBjaGlsZCA9IHBhcmVudC5jaGlsZE5vZGVzW2ldO1xuICAgICAgICAgICAgaWYgKGNoaWxkLl9pZCA8PSBpZCAmJiBjaGlsZC5fcHJpb3JpdHkgPD0gcHJpb3JpdHkpIHtcbiAgICAgICAgICAgICAgICBpbnNlcnRJbmRleCA9IGkgKyAxO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChpbnNlcnRJbmRleCA+IC0xICYmIGluc2VydEluZGV4IDwgcGFyZW50LmNoaWxkTm9kZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICBwYXJlbnQuaW5zZXJ0QmVmb3JlKGVsZW1lbnQsIHBhcmVudC5jaGlsZE5vZGVzW2luc2VydEluZGV4XSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBwYXJlbnQuYXBwZW5kQ2hpbGQoZWxlbWVudCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgdXBkYXRlQXRvbShjYikge1xuICAgICAgICBpZiAodGhpcy5fcGFuZWwudmlzaWJsZSAhPT0gdGhpcy52aXNpYmxlKSB7XG4gICAgICAgICAgICBpZiAodGhpcy52aXNpYmxlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fcGFuZWwuc2hvdygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fcGFuZWwuaGlkZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChjYilcbiAgICAgICAgICAgIGNiKCk7XG4gICAgfVxuICAgIHNob3dWaWV3KCkge1xuICAgICAgICB0aGlzLnZpc2libGUgPSB0cnVlO1xuICAgICAgICB0aGlzLnVwZGF0ZUF0b20oKTtcbiAgICB9XG4gICAgZG9TaG93VmlldygpIHtcbiAgICAgICAgdGhpcy52aXNpYmxlID0gdHJ1ZTtcbiAgICB9XG4gICAgaGlkZVZpZXcoKSB7XG4gICAgICAgIHRoaXMuZG9IaWRlVmlldygpO1xuICAgICAgICB0aGlzLnVwZGF0ZUF0b20oKTtcbiAgICB9XG4gICAgZG9IaWRlVmlldygpIHtcbiAgICAgICAgdGhpcy52aXNpYmxlID0gZmFsc2U7XG4gICAgICAgIGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVBhbmUoKS5hY3RpdmF0ZSgpO1xuICAgICAgICBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVQYW5lKCkuYWN0aXZhdGVJdGVtKCk7XG4gICAgfVxuICAgIHRvZ2dsZVZpZXcoKSB7XG4gICAgICAgIGlmICh0aGlzLnZpc2libGUpIHtcbiAgICAgICAgICAgIHRoaXMuZG9IaWRlVmlldygpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5kb1Nob3dWaWV3KCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy51cGRhdGVBdG9tKCk7XG4gICAgfVxuICAgIHRvZ2dsZVdpbmRvdyhzZWxlY3RlZCkge1xuICAgICAgICBpZiAodGhpcy52aXNpYmxlICYmIHRoaXMuc2VsZWN0ZWQgPT09IHNlbGVjdGVkKSB7XG4gICAgICAgICAgICB0aGlzLmhpZGVWaWV3KCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zZWxlY3RXaW5kb3coc2VsZWN0ZWQpO1xuICAgIH1cbiAgICBzZWxlY3RXaW5kb3coc2VsZWN0ZWQpIHtcbiAgICAgICAgaWYgKCF0aGlzLnZpc2libGUpXG4gICAgICAgICAgICB0aGlzLmRvU2hvd1ZpZXcoKTtcbiAgICAgICAgdGhpcy5zZWxlY3RlZCA9IHNlbGVjdGVkO1xuICAgICAgICB0aGlzLnVwZGF0ZUF0b20oKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcGFuZWwgPSB0aGlzLnF1ZXJ5U2VsZWN0b3IoXCIub21uaXNoYXJwLWF0b20tb3V0cHV0LnNlbGVjdGVkXCIpO1xuICAgICAgICAgICAgaWYgKHBhbmVsKVxuICAgICAgICAgICAgICAgIHBhbmVsLmZvY3VzKCk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBhZGRXaW5kb3coaWQsIHRpdGxlLCB2aWV3LCBvcHRpb25zID0geyBwcmlvcml0eTogMTAwMCB9LCBwYXJlbnREaXNwb3NhYmxlKSB7XG4gICAgICAgIGNvbnN0IGRpc3Bvc2FibGUgPSBuZXcgU2luZ2xlQXNzaWdubWVudERpc3Bvc2FibGUoKTtcbiAgICAgICAgY29uc3QgY2QgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICBjb25zdCBjb250ZXh0ID0geyBpZCwgdGl0bGUsIHZpZXcsIG9wdGlvbnMsIGRpc3Bvc2FibGU6IGNkIH07XG4gICAgICAgIHRoaXMuX3BhbmVzLnNldChpZCwgY29udGV4dCk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoZGlzcG9zYWJsZSk7XG4gICAgICAgIGRpc3Bvc2FibGUuZGlzcG9zYWJsZSA9IGNkO1xuICAgICAgICBpZiAocGFyZW50RGlzcG9zYWJsZSlcbiAgICAgICAgICAgIGNkLmFkZChwYXJlbnREaXNwb3NhYmxlKTtcbiAgICAgICAgdmlldy5jbGFzc0xpc3QuYWRkKFwib21uaXNoYXJwLWF0b20tb3V0cHV0XCIsIGAke2lkfS1vdXRwdXRgLCBcInNlbGVjdGVkXCIpO1xuICAgICAgICBjZC5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcIm9tbmlzaGFycC1hdG9tOmRvY2stc2hvdy1cIiArIGlkLCAoKSA9PiB0aGlzLnNlbGVjdFdpbmRvdyhpZCkpKTtcbiAgICAgICAgY2QuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTpkb2NrLXRvZ2dsZS1cIiArIGlkLCAoKSA9PiB0aGlzLnRvZ2dsZVdpbmRvdyhpZCkpKTtcbiAgICAgICAgaWYgKG9wdGlvbnMuY2xvc2VhYmxlKSB7XG4gICAgICAgICAgICBjZC5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcIm9tbmlzaGFycC1hdG9tOmRvY2stY2xvc2UtXCIgKyBpZCwgKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5yZW1vdmUoZGlzcG9zYWJsZSk7XG4gICAgICAgICAgICAgICAgZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5oaWRlVmlldygpO1xuICAgICAgICAgICAgfSkpO1xuICAgICAgICB9XG4gICAgICAgIGNkLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5zZWxlY3RlZCA9PT0gaWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNlbGVjdGVkID0gXCJvdXRwdXRcIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSkpO1xuICAgICAgICBjZC5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xuICAgICAgICAgICAgdmlldy5yZW1vdmUoKTtcbiAgICAgICAgICAgIHRoaXMuX3BhbmVzLmRlbGV0ZShpZCk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5fYWRkRG9ja0J1dHRvbihjb250ZXh0KTtcbiAgICAgICAgaWYgKCF0aGlzLnNlbGVjdGVkKVxuICAgICAgICAgICAgdGhpcy5zZWxlY3RlZCA9IGlkO1xuICAgICAgICByZXR1cm4gZGlzcG9zYWJsZTtcbiAgICB9XG4gICAgYWRkQnV0dG9uKGlkLCB0aXRsZSwgdmlldywgb3B0aW9ucyA9IHsgcHJpb3JpdHk6IDEwMDAgfSwgcGFyZW50RGlzcG9zYWJsZSkge1xuICAgICAgICBjb25zdCBkaXNwb3NhYmxlID0gbmV3IFNpbmdsZUFzc2lnbm1lbnREaXNwb3NhYmxlKCk7XG4gICAgICAgIGNvbnN0IGNkID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChkaXNwb3NhYmxlKTtcbiAgICAgICAgZGlzcG9zYWJsZS5kaXNwb3NhYmxlID0gY2Q7XG4gICAgICAgIGlmIChwYXJlbnREaXNwb3NhYmxlKVxuICAgICAgICAgICAgY2QuYWRkKHBhcmVudERpc3Bvc2FibGUpO1xuICAgICAgICB0aGlzLl9hZGRUb2dnbGVCdXR0b24oeyBpZCwgdGl0bGUsIHZpZXcsIG9wdGlvbnMsIGRpc3Bvc2FibGU6IGNkIH0pO1xuICAgICAgICByZXR1cm4gZGlzcG9zYWJsZTtcbiAgICB9XG59XG5leHBvcnRzLkRvY2tXaW5kb3cgPSBkb2N1bWVudC5yZWdpc3RlckVsZW1lbnQoXCJvbW5pc2hhcnAtZG9jay13aW5kb3dcIiwgeyBwcm90b3R5cGU6IERvY2tXaW5kb3cucHJvdG90eXBlIH0pO1xuZXhwb3J0IGNsYXNzIFJlc2l6ZXIgZXh0ZW5kcyBIVE1MRGl2RWxlbWVudCB7XG4gICAgY3JlYXRlZENhbGxiYWNrKCkge1xuICAgICAgICB0aGlzLmNsYXNzTGlzdC5hZGQoXCJvbW5pc2hhcnAtYXRvbS1vdXRwdXQtcmVzaXplclwiKTtcbiAgICB9XG4gICAgZGV0YWNoZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICB9XG4gICAgYXR0YWNoZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgY29uc3QgbW91c2Vtb3ZlID0gT2JzZXJ2YWJsZS5mcm9tRXZlbnQoZG9jdW1lbnQuYm9keSwgXCJtb3VzZW1vdmVcIikuc2hhcmUoKTtcbiAgICAgICAgY29uc3QgbW91c2V1cCA9IE9ic2VydmFibGUuZnJvbUV2ZW50KGRvY3VtZW50LmJvZHksIFwibW91c2V1cFwiKS5zaGFyZSgpO1xuICAgICAgICBjb25zdCBtb3VzZWRvd24gPSBPYnNlcnZhYmxlLmZyb21FdmVudCh0aGlzLCBcIm1vdXNlZG93blwiKS5zaGFyZSgpO1xuICAgICAgICBjb25zdCBtb3VzZWRyYWcgPSBtb3VzZWRvd24uZmxhdE1hcCgobWQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHN0YXJ0WCA9IG1kLmNsaWVudFggKyB3aW5kb3cuc2Nyb2xsWCwgc3RhcnRZID0gbWQuY2xpZW50WSArIHdpbmRvdy5zY3JvbGxZO1xuICAgICAgICAgICAgcmV0dXJuIG1vdXNlbW92ZS5tYXAoKG1tKSA9PiB7XG4gICAgICAgICAgICAgICAgbW0ucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBsZWZ0OiAocGFyc2VJbnQobWQudGFyZ2V0LnN0eWxlLmxlZnQsIDEwKSB8fCAwKSArIG1tLmNsaWVudFggLSBzdGFydFgsXG4gICAgICAgICAgICAgICAgICAgIHRvcDogKHBhcnNlSW50KG1kLnRhcmdldC5zdHlsZS50b3AsIDEwKSB8fCAwKSArIG1tLmNsaWVudFkgLSBzdGFydFlcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSkudGFrZVVudGlsKG1vdXNldXApO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChtb3VzZWRvd24uc3Vic2NyaWJlKHggPT4gdGhpcy5zdGFydCgpKSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQobW91c2VkcmFnLnN1YnNjcmliZSgoeCkgPT4gdGhpcy51cGRhdGUoeCksIG51bGwsICgpID0+IHRoaXMuZG9uZSgpKSk7XG4gICAgfVxufVxuZXhwb3J0cy5SZXNpemVyID0gZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50KFwib21uaXNoYXJwLXJlc2l6ZXJcIiwgeyBwcm90b3R5cGU6IFJlc2l6ZXIucHJvdG90eXBlIH0pO1xuIiwiaW1wb3J0IHtPYnNlcnZhYmxlfSBmcm9tIFwicnhqc1wiO1xyXG5pbXBvcnQge0Rpc3Bvc2FibGUsIENvbXBvc2l0ZURpc3Bvc2FibGUsIFNpbmdsZUFzc2lnbm1lbnREaXNwb3NhYmxlLCBJRGlzcG9zYWJsZX0gZnJvbSBcInRzLWRpc3Bvc2FibGVzXCI7XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFRvZ2dsZUJ1dHRvbiB7XHJcbiAgICBpZDogc3RyaW5nO1xyXG4gICAgdGl0bGU6IHN0cmluZztcclxuICAgIHZpZXc6IEhUTUxFbGVtZW50O1xyXG4gICAgb3B0aW9uczogRG9jQnV0dG9uT3B0aW9ucztcclxuICAgIGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgRG9jQnV0dG9uT3B0aW9ucyB7XHJcbiAgICBwcmlvcml0eT86IG51bWJlcjtcclxufVxyXG5cclxuaW50ZXJmYWNlIEludGVybmFsVG9nZ2xlQnV0dG9uIGV4dGVuZHMgVG9nZ2xlQnV0dG9uIHtcclxuXHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgUGFuZUJ1dHRvbiB7XHJcbiAgICBpZDogc3RyaW5nO1xyXG4gICAgdGl0bGU6IHN0cmluZztcclxuICAgIHZpZXc6IEhUTUxFbGVtZW50O1xyXG4gICAgb3B0aW9uczogUGFuZUJ1dHRvbk9wdGlvbnM7XHJcbiAgICBkaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFBhbmVCdXR0b25PcHRpb25zIHtcclxuICAgIHByaW9yaXR5PzogbnVtYmVyO1xyXG4gICAgY2xvc2VhYmxlPzogYm9vbGVhbjtcclxufVxyXG5cclxuaW50ZXJmYWNlIEludGVybmFsUGFuZUJ1dHRvbiBleHRlbmRzIFBhbmVCdXR0b24ge1xyXG4gICAgX2J1dHRvbj86IEVsZW1lbnQ7XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBEb2NrV2luZG93IGV4dGVuZHMgSFRNTERpdkVsZW1lbnQgaW1wbGVtZW50cyBXZWJDb21wb25lbnQge1xyXG4gICAgcHJpdmF0ZSBkaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xyXG4gICAgcHJpdmF0ZSBfcGFuZWw6IEF0b20uUGFuZWw7XHJcbiAgICBwcml2YXRlIF9zZWxlY3RlZFBhbmU6IEludGVybmFsUGFuZUJ1dHRvbjtcclxuICAgIHByaXZhdGUgX3Rvb2xiYXI6IEhUTUxEaXZFbGVtZW50O1xyXG4gICAgcHJpdmF0ZSBfcGFuZUJ1dHRvbnM6IEhUTUxEaXZFbGVtZW50O1xyXG4gICAgcHJpdmF0ZSBfdG9nZ2xlQnV0dG9uczogSFRNTERpdkVsZW1lbnQ7XHJcbiAgICBwcml2YXRlIF9wYW5lczogTWFwPHN0cmluZywgSW50ZXJuYWxQYW5lQnV0dG9uPjtcclxuICAgIHByaXZhdGUgdmlzaWJsZTogYm9vbGVhbjtcclxuICAgIHByaXZhdGUgdGVtcEhlaWdodDogbnVtYmVyO1xyXG4gICAgcHJpdmF0ZSBmb250U2l6ZTogYW55O1xyXG5cclxuICAgIHB1YmxpYyBnZXQgaXNPcGVuKCkgeyByZXR1cm4gdGhpcy52aXNpYmxlOyB9XHJcbiAgICAvL2F0b20uY29uZmlnLmdldDxudW1iZXI+KFwiZWRpdG9yLmZvbnRTaXplXCIpXHJcblxyXG4gICAgcHJpdmF0ZSBfc2VsZWN0ZWQ6IHN0cmluZztcclxuICAgIHB1YmxpYyBnZXQgc2VsZWN0ZWQoKSB7IHJldHVybiB0aGlzLl9zZWxlY3RlZDsgfVxyXG4gICAgcHVibGljIHNldCBzZWxlY3RlZCh2YWx1ZSkge1xyXG4gICAgICAgIGNvbnN0IHBhbmUgPSB0aGlzLl9wYW5lcy5nZXQodmFsdWUpO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5fc2VsZWN0ZWRQYW5lKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3NlbGVjdGVkUGFuZS5fYnV0dG9uLmNsYXNzTGlzdC5yZW1vdmUoXCJzZWxlY3RlZFwiKTtcclxuICAgICAgICAgICAgdGhpcy5fc2VsZWN0ZWRQYW5lLnZpZXcucmVtb3ZlKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAocGFuZSkge1xyXG4gICAgICAgICAgICB0aGlzLl9zZWxlY3RlZFBhbmUgPSBwYW5lO1xyXG4gICAgICAgICAgICBwYW5lLl9idXR0b24uY2xhc3NMaXN0LmFkZChcInNlbGVjdGVkXCIpO1xyXG4gICAgICAgICAgICB0aGlzLmFwcGVuZENoaWxkKHBhbmUudmlldyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLl9zZWxlY3RlZCA9IHZhbHVlO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBjcmVhdGVkQ2FsbGJhY2soKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgICAgICB0aGlzLl9wYW5lcyA9IG5ldyBNYXA8c3RyaW5nLCBJbnRlcm5hbFBhbmVCdXR0b24+KCk7XHJcbiAgICAgICAgdGhpcy5fc2VsZWN0ZWQgPSBcIm91dHB1dFwiO1xyXG4gICAgICAgIHRoaXMudmlzaWJsZSA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMudGVtcEhlaWdodCA9IDA7XHJcbiAgICAgICAgdGhpcy5mb250U2l6ZSA9IGF0b20uY29uZmlnLmdldDxudW1iZXI+KFwiZWRpdG9yLmZvbnRTaXplXCIpO1xyXG5cclxuICAgICAgICBsZXQgZm9udFNpemUgPSB0aGlzLmZvbnRTaXplIC0gMTtcclxuICAgICAgICBpZiAoZm9udFNpemUgPD0gMClcclxuICAgICAgICAgICAgZm9udFNpemUgPSAxO1xyXG5cclxuICAgICAgICB0aGlzLmNsYXNzTGlzdC5hZGQoXCJpbnNldC1wYW5lbFwiLCBcImZvbnQtc2l6ZS1cIiArIGZvbnRTaXplKTtcclxuICAgICAgICBpZiAodGhpcy5jbGllbnRIZWlnaHQgfHwgdGhpcy50ZW1wSGVpZ2h0KSB7XHJcbiAgICAgICAgICAgIHRoaXMuc3R5bGUuaGVpZ2h0ID0gdGhpcy5jbGllbnRIZWlnaHQgKyB0aGlzLnRlbXBIZWlnaHQgKyBcInB4XCI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCByZXNpemVyID0gbmV3IGV4cG9ydHMuUmVzaXplcigpO1xyXG4gICAgICAgIGxldCBfb3JpZ2luYWxIZWlnaHQgPSB0aGlzLmNsaWVudEhlaWdodDtcclxuICAgICAgICByZXNpemVyLnN0YXJ0ID0gKCkgPT4geyBfb3JpZ2luYWxIZWlnaHQgPSB0aGlzLmNsaWVudEhlaWdodDsgfTtcclxuICAgICAgICByZXNpemVyLnVwZGF0ZSA9ICh7dG9wfTogeyBsZWZ0OiBudW1iZXIsIHRvcDogbnVtYmVyIH0pID0+IHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2codG9wKTtcclxuICAgICAgICAgICAgdGhpcy5zdHlsZS5oZWlnaHQgPSBgJHtfb3JpZ2luYWxIZWlnaHQgKyAtKHRvcCl9cHhgO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgcmVzaXplci5kb25lID0gKCkgPT4geyAvKiAqLyB9O1xyXG4gICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQocmVzaXplcik7XHJcblxyXG4gICAgICAgIGNvbnN0IHdpbmRvd3MgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gICAgICAgIHdpbmRvd3MuY2xhc3NMaXN0LmFkZChcInBhbmVsLWhlYWRpbmdcIiwgXCJjbGVhcmZpeFwiKTtcclxuICAgICAgICB0aGlzLmFwcGVuZENoaWxkKHdpbmRvd3MpO1xyXG5cclxuICAgICAgICB0aGlzLl90b29sYmFyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuICAgICAgICB0aGlzLl90b29sYmFyLmNsYXNzTGlzdC5hZGQoXCJidG4tdG9vbGJhclwiLCBcInB1bGwtbGVmdFwiKTtcclxuICAgICAgICB3aW5kb3dzLmFwcGVuZENoaWxkKHRoaXMuX3Rvb2xiYXIpO1xyXG5cclxuICAgICAgICB0aGlzLl9wYW5lQnV0dG9ucyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgICAgICAgdGhpcy5fcGFuZUJ1dHRvbnMuY2xhc3NMaXN0LmFkZChcImJ0bi1ncm91cFwiLCBcImJ0bi10b2dnbGVcIik7XHJcbiAgICAgICAgdGhpcy5fdG9vbGJhci5hcHBlbmRDaGlsZCh0aGlzLl9wYW5lQnV0dG9ucyk7XHJcblxyXG4gICAgICAgIHRoaXMuX3RvZ2dsZUJ1dHRvbnMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gICAgICAgIHRoaXMuX3RvZ2dsZUJ1dHRvbnMuY2xhc3NMaXN0LmFkZChcImJ0bi13ZWxsXCIsIFwicHVsbC1yaWdodFwiLCBcImJ0bi1ncm91cFwiKTtcclxuICAgICAgICB3aW5kb3dzLmFwcGVuZENoaWxkKHRoaXMuX3RvZ2dsZUJ1dHRvbnMpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBhdHRhY2hlZENhbGxiYWNrKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb25maWcub2JzZXJ2ZShcImVkaXRvci5mb250U2l6ZVwiLCAoc2l6ZTogbnVtYmVyKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuY2xhc3NOYW1lID0gdGhpcy5jbGFzc05hbWUucmVwbGFjZSgvZm9udC1zaXplLVtcXGRdKi9nLCBcIlwiKTtcclxuICAgICAgICAgICAgdGhpcy5mb250U2l6ZSA9IHNpemU7XHJcbiAgICAgICAgICAgIHRoaXMuY2xhc3NMaXN0LmFkZChcImZvbnQtc2l6ZS1cIiArIHNpemUpO1xyXG4gICAgICAgIH0pKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2V0UGFuZWwocGFuZWw6IEF0b20uUGFuZWwpIHtcclxuICAgICAgICB0aGlzLl9wYW5lbCA9IHBhbmVsO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX2FkZERvY2tCdXR0b24oYnV0dG9uOiBJbnRlcm5hbFBhbmVCdXR0b24pIHtcclxuICAgICAgICBjb25zdCB7aWQsIHRpdGxlLCBvcHRpb25zLCBkaXNwb3NhYmxlfSA9IGJ1dHRvbjtcclxuXHJcbiAgICAgICAgY29uc3QgdmlldyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XHJcbiAgICAgICAgdmlldy5jbGFzc0xpc3QuYWRkKFwiYnRuXCIsIFwiYnRuLWRlZmF1bHRcIiwgXCJidG4tZml4XCIpO1xyXG4gICAgICAgICh2aWV3IGFzIGFueSkuX2lkID0gaWQ7XHJcbiAgICAgICAgKHZpZXcgYXMgYW55KS5fcHJpb3JpdHkgPSBvcHRpb25zLnByaW9yaXR5O1xyXG5cclxuICAgICAgICBkaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XHJcbiAgICAgICAgICAgIGlmICh2aWV3LmNsYXNzTGlzdC5jb250YWlucyhcInNlbGVjdGVkXCIpKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNlbGVjdGVkID0gKHZpZXcucHJldmlvdXNFbGVtZW50U2libGluZyBhcyBhbnkpLl9pZDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB2aWV3LnJlbW92ZSgpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgY29uc3QgdGV4dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xyXG4gICAgICAgIHRleHQuaW5uZXJIVE1MID0gdGl0bGU7XHJcbiAgICAgICAgdGV4dC5jbGFzc0xpc3QuYWRkKFwidGV4dFwiKTtcclxuICAgICAgICB2aWV3LmFwcGVuZENoaWxkKHRleHQpO1xyXG5cclxuICAgICAgICBpZiAob3B0aW9ucy5jbG9zZWFibGUpIHtcclxuICAgICAgICAgICAgdmlldy5jbGFzc0xpc3QuYWRkKFwiY2xvc2VhYmxlXCIpO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgY2xvc2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcclxuICAgICAgICAgICAgY2xvc2UuY2xhc3NMaXN0LmFkZChcImZhXCIsIFwiZmEtdGltZXMtY2lyY2xlXCIsIFwiY2xvc2UtcGFuZVwiKTtcclxuICAgICAgICAgICAgY2xvc2Uub25jbGljayA9IChlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBkaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgdmlldy5hcHBlbmRDaGlsZChjbG9zZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2aWV3Lm9uY2xpY2sgPSAoZSkgPT4ge1xyXG4gICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWQgPSBpZDtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBidXR0b24uX2J1dHRvbiA9IHZpZXc7XHJcblxyXG4gICAgICAgIHRoaXMuX2luc2VydEJ1dHRvbih0aGlzLl9wYW5lQnV0dG9ucywgdmlldywgb3B0aW9ucy5wcmlvcml0eSwgaWQpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX2FkZFRvZ2dsZUJ1dHRvbih7aWQsIG9wdGlvbnMsIHZpZXcsIGRpc3Bvc2FibGV9OiBUb2dnbGVCdXR0b24pIHtcclxuICAgICAgICBkaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XHJcbiAgICAgICAgICAgIHZpZXcucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5yZW1vdmUoZGlzcG9zYWJsZSk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLl9pbnNlcnRCdXR0b24odGhpcy5fdG9nZ2xlQnV0dG9ucywgdmlldywgb3B0aW9ucy5wcmlvcml0eSwgaWQpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX2luc2VydEJ1dHRvbihwYXJlbnQ6IEVsZW1lbnQsIGVsZW1lbnQ6IEVsZW1lbnQsIHByaW9yaXR5OiBudW1iZXIsIGlkOiBzdHJpbmcpIHtcclxuICAgICAgICBsZXQgaW5zZXJ0SW5kZXggPSAtMTtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBhcmVudC5jaGlsZE5vZGVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGNoaWxkID0gPGFueT5wYXJlbnQuY2hpbGROb2Rlc1tpXTtcclxuICAgICAgICAgICAgaWYgKGNoaWxkLl9pZCA8PSBpZCAmJiBjaGlsZC5fcHJpb3JpdHkgPD0gcHJpb3JpdHkpIHtcclxuICAgICAgICAgICAgICAgIGluc2VydEluZGV4ID0gaSArIDE7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGluc2VydEluZGV4ID4gLTEgJiYgaW5zZXJ0SW5kZXggPCBwYXJlbnQuY2hpbGROb2Rlcy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgcGFyZW50Lmluc2VydEJlZm9yZShlbGVtZW50LCBwYXJlbnQuY2hpbGROb2Rlc1tpbnNlcnRJbmRleF0pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHBhcmVudC5hcHBlbmRDaGlsZChlbGVtZW50KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSB1cGRhdGVBdG9tKGNiPzogKCkgPT4gdm9pZCkge1xyXG4gICAgICAgIGlmICh0aGlzLl9wYW5lbC52aXNpYmxlICE9PSB0aGlzLnZpc2libGUpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMudmlzaWJsZSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fcGFuZWwuc2hvdygpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fcGFuZWwuaGlkZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChjYikgY2IoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2hvd1ZpZXcoKSB7XHJcbiAgICAgICAgdGhpcy52aXNpYmxlID0gdHJ1ZTtcclxuICAgICAgICB0aGlzLnVwZGF0ZUF0b20oKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZG9TaG93VmlldygpIHtcclxuICAgICAgICB0aGlzLnZpc2libGUgPSB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBoaWRlVmlldygpIHtcclxuICAgICAgICB0aGlzLmRvSGlkZVZpZXcoKTtcclxuICAgICAgICB0aGlzLnVwZGF0ZUF0b20oKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGRvSGlkZVZpZXcoKSB7XHJcbiAgICAgICAgdGhpcy52aXNpYmxlID0gZmFsc2U7XHJcbiAgICAgICAgYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlUGFuZSgpLmFjdGl2YXRlKCk7XHJcbiAgICAgICAgYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlUGFuZSgpLmFjdGl2YXRlSXRlbSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB0b2dnbGVWaWV3KCkge1xyXG4gICAgICAgIGlmICh0aGlzLnZpc2libGUpIHtcclxuICAgICAgICAgICAgdGhpcy5kb0hpZGVWaWV3KCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5kb1Nob3dWaWV3KCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMudXBkYXRlQXRvbSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB0b2dnbGVXaW5kb3coc2VsZWN0ZWQ6IHN0cmluZykge1xyXG4gICAgICAgIGlmICh0aGlzLnZpc2libGUgJiYgdGhpcy5zZWxlY3RlZCA9PT0gc2VsZWN0ZWQpIHtcclxuICAgICAgICAgICAgdGhpcy5oaWRlVmlldygpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLnNlbGVjdFdpbmRvdyhzZWxlY3RlZCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHNlbGVjdFdpbmRvdyhzZWxlY3RlZDogc3RyaW5nKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLnZpc2libGUpXHJcbiAgICAgICAgICAgIHRoaXMuZG9TaG93VmlldygpO1xyXG5cclxuICAgICAgICB0aGlzLnNlbGVjdGVkID0gc2VsZWN0ZWQ7XHJcblxyXG4gICAgICAgIC8vIEZvY3VzIHRoZSBwYW5lbCFcclxuICAgICAgICB0aGlzLnVwZGF0ZUF0b20oKCkgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBwYW5lbDogYW55ID0gdGhpcy5xdWVyeVNlbGVjdG9yKFwiLm9tbmlzaGFycC1hdG9tLW91dHB1dC5zZWxlY3RlZFwiKTtcclxuICAgICAgICAgICAgaWYgKHBhbmVsKSBwYW5lbC5mb2N1cygpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBhZGRXaW5kb3coaWQ6IHN0cmluZywgdGl0bGU6IHN0cmluZywgdmlldzogSFRNTEVsZW1lbnQsIG9wdGlvbnM6IFBhbmVCdXR0b25PcHRpb25zID0geyBwcmlvcml0eTogMTAwMCB9LCBwYXJlbnREaXNwb3NhYmxlPzogRGlzcG9zYWJsZSkge1xyXG4gICAgICAgIGNvbnN0IGRpc3Bvc2FibGUgPSBuZXcgU2luZ2xlQXNzaWdubWVudERpc3Bvc2FibGUoKTtcclxuICAgICAgICBjb25zdCBjZCA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcbiAgICAgICAgY29uc3QgY29udGV4dCA9IHsgaWQsIHRpdGxlLCB2aWV3LCBvcHRpb25zLCBkaXNwb3NhYmxlOiBjZCB9O1xyXG5cclxuICAgICAgICB0aGlzLl9wYW5lcy5zZXQoaWQsIGNvbnRleHQpO1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoZGlzcG9zYWJsZSk7XHJcbiAgICAgICAgZGlzcG9zYWJsZS5kaXNwb3NhYmxlID0gY2Q7XHJcblxyXG4gICAgICAgIGlmIChwYXJlbnREaXNwb3NhYmxlKVxyXG4gICAgICAgICAgICBjZC5hZGQocGFyZW50RGlzcG9zYWJsZSk7XHJcblxyXG4gICAgICAgIHZpZXcuY2xhc3NMaXN0LmFkZChcIm9tbmlzaGFycC1hdG9tLW91dHB1dFwiLCBgJHtpZH0tb3V0cHV0YCwgXCJzZWxlY3RlZFwiKTtcclxuXHJcbiAgICAgICAgY2QuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTpkb2NrLXNob3ctXCIgKyBpZCwgKCkgPT4gdGhpcy5zZWxlY3RXaW5kb3coaWQpKSk7XHJcbiAgICAgICAgY2QuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTpkb2NrLXRvZ2dsZS1cIiArIGlkLCAoKSA9PiB0aGlzLnRvZ2dsZVdpbmRvdyhpZCkpKTtcclxuXHJcbiAgICAgICAgaWYgKG9wdGlvbnMuY2xvc2VhYmxlKSB7XHJcbiAgICAgICAgICAgIGNkLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwib21uaXNoYXJwLWF0b206ZG9jay1jbG9zZS1cIiArIGlkLCAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUucmVtb3ZlKGRpc3Bvc2FibGUpO1xyXG4gICAgICAgICAgICAgICAgZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmhpZGVWaWV3KCk7XHJcbiAgICAgICAgICAgIH0pKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNkLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLnNlbGVjdGVkID09PSBpZCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zZWxlY3RlZCA9IFwib3V0cHV0XCI7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIGNkLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XHJcbiAgICAgICAgICAgIHZpZXcucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgIHRoaXMuX3BhbmVzLmRlbGV0ZShpZCk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLl9hZGREb2NrQnV0dG9uKGNvbnRleHQpO1xyXG5cclxuICAgICAgICBpZiAoIXRoaXMuc2VsZWN0ZWQpIHRoaXMuc2VsZWN0ZWQgPSBpZDtcclxuXHJcbiAgICAgICAgcmV0dXJuIDxJRGlzcG9zYWJsZT5kaXNwb3NhYmxlO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBhZGRCdXR0b24oaWQ6IHN0cmluZywgdGl0bGU6IHN0cmluZywgdmlldzogSFRNTEVsZW1lbnQsIG9wdGlvbnM6IERvY0J1dHRvbk9wdGlvbnMgPSB7IHByaW9yaXR5OiAxMDAwIH0sIHBhcmVudERpc3Bvc2FibGU/OiBEaXNwb3NhYmxlKSB7XHJcbiAgICAgICAgY29uc3QgZGlzcG9zYWJsZSA9IG5ldyBTaW5nbGVBc3NpZ25tZW50RGlzcG9zYWJsZSgpO1xyXG4gICAgICAgIGNvbnN0IGNkID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGRpc3Bvc2FibGUpO1xyXG4gICAgICAgIGRpc3Bvc2FibGUuZGlzcG9zYWJsZSA9IGNkO1xyXG5cclxuICAgICAgICBpZiAocGFyZW50RGlzcG9zYWJsZSlcclxuICAgICAgICAgICAgY2QuYWRkKHBhcmVudERpc3Bvc2FibGUpO1xyXG5cclxuICAgICAgICB0aGlzLl9hZGRUb2dnbGVCdXR0b24oeyBpZCwgdGl0bGUsIHZpZXcsIG9wdGlvbnMsIGRpc3Bvc2FibGU6IGNkIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gPElEaXNwb3NhYmxlPmRpc3Bvc2FibGU7XHJcbiAgICB9XHJcbn1cclxuXHJcbig8YW55PmV4cG9ydHMpLkRvY2tXaW5kb3cgPSAoPGFueT5kb2N1bWVudCkucmVnaXN0ZXJFbGVtZW50KFwib21uaXNoYXJwLWRvY2std2luZG93XCIsIHsgcHJvdG90eXBlOiBEb2NrV2luZG93LnByb3RvdHlwZSB9KTtcclxuXHJcbmV4cG9ydCBjbGFzcyBSZXNpemVyIGV4dGVuZHMgSFRNTERpdkVsZW1lbnQgaW1wbGVtZW50cyBXZWJDb21wb25lbnQge1xyXG4gICAgcHJpdmF0ZSBkaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xyXG4gICAgcHVibGljIHVwZGF0ZTogKGxvY2F0aW9uOiB7IGxlZnQ6IG51bWJlcjsgdG9wOiBudW1iZXIgfSkgPT4gdm9pZDtcclxuICAgIHB1YmxpYyBkb25lOiAoKSA9PiB2b2lkO1xyXG4gICAgcHVibGljIHN0YXJ0OiAoKSA9PiB2b2lkO1xyXG5cclxuICAgIHB1YmxpYyBjcmVhdGVkQ2FsbGJhY2soKSB7XHJcbiAgICAgICAgdGhpcy5jbGFzc0xpc3QuYWRkKFwib21uaXNoYXJwLWF0b20tb3V0cHV0LXJlc2l6ZXJcIik7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRldGFjaGVkQ2FsbGJhY2soKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgYXR0YWNoZWRDYWxsYmFjaygpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG4gICAgICAgIGNvbnN0IG1vdXNlbW92ZSA9IE9ic2VydmFibGUuZnJvbUV2ZW50PE1vdXNlRXZlbnQ+KGRvY3VtZW50LmJvZHksIFwibW91c2Vtb3ZlXCIpLnNoYXJlKCk7XHJcbiAgICAgICAgY29uc3QgbW91c2V1cCA9IE9ic2VydmFibGUuZnJvbUV2ZW50PE1vdXNlRXZlbnQ+KGRvY3VtZW50LmJvZHksIFwibW91c2V1cFwiKS5zaGFyZSgpO1xyXG4gICAgICAgIGNvbnN0IG1vdXNlZG93biA9IE9ic2VydmFibGUuZnJvbUV2ZW50PE1vdXNlRXZlbnQ+KHRoaXMsIFwibW91c2Vkb3duXCIpLnNoYXJlKCk7XHJcblxyXG4gICAgICAgIGNvbnN0IG1vdXNlZHJhZyA9IG1vdXNlZG93bi5mbGF0TWFwKChtZCkgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBzdGFydFggPSBtZC5jbGllbnRYICsgd2luZG93LnNjcm9sbFgsXHJcbiAgICAgICAgICAgICAgICBzdGFydFkgPSBtZC5jbGllbnRZICsgd2luZG93LnNjcm9sbFk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gbW91c2Vtb3ZlLm1hcCgobW0pID0+IHtcclxuICAgICAgICAgICAgICAgIG1tLnByZXZlbnREZWZhdWx0KCk7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgICAgICBsZWZ0OiAocGFyc2VJbnQoKDxhbnk+bWQudGFyZ2V0KS5zdHlsZS5sZWZ0LCAxMCkgfHwgMCkgKyBtbS5jbGllbnRYIC0gc3RhcnRYLFxyXG4gICAgICAgICAgICAgICAgICAgIHRvcDogKHBhcnNlSW50KCg8YW55Pm1kLnRhcmdldCkuc3R5bGUudG9wLCAxMCkgfHwgMCkgKyBtbS5jbGllbnRZIC0gc3RhcnRZXHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICB9KS50YWtlVW50aWwobW91c2V1cCk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQobW91c2Vkb3duLnN1YnNjcmliZSh4ID0+IHRoaXMuc3RhcnQoKSkpO1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQobW91c2VkcmFnLnN1YnNjcmliZSgoeCkgPT4gdGhpcy51cGRhdGUoeCksIG51bGwsICgpID0+IHRoaXMuZG9uZSgpKSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbig8YW55PmV4cG9ydHMpLlJlc2l6ZXIgPSAoPGFueT5kb2N1bWVudCkucmVnaXN0ZXJFbGVtZW50KFwib21uaXNoYXJwLXJlc2l6ZXJcIiwgeyBwcm90b3R5cGU6IFJlc2l6ZXIucHJvdG90eXBlIH0pO1xyXG4iXX0=
