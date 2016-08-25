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

        return _possibleConstructorReturn(this, Object.getPrototypeOf(DockWindow).apply(this, arguments));
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

            var id = button.id;
            var title = button.title;
            var options = button.options;
            var disposable = button.disposable;

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

            var id = _ref2.id;
            var options = _ref2.options;
            var view = _ref2.view;
            var disposable = _ref2.disposable;

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

            var options = arguments.length <= 3 || arguments[3] === undefined ? { priority: 1000 } : arguments[3];
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
            var options = arguments.length <= 3 || arguments[3] === undefined ? { priority: 1000 } : arguments[3];
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

        return _possibleConstructorReturn(this, Object.getPrototypeOf(Resizer).apply(this, arguments));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy9kb2NrLXdpbmRvdy5qcyIsImxpYi92aWV3cy9kb2NrLXdpbmRvdy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7QUFDQTs7Ozs7Ozs7SUNtQ0E7Ozs7Ozs7Ozs7OzBDQWtDMEI7OztBQUNsQixpQkFBSyxVQUFMLEdBQWtCLHdDQUFsQixDQURrQjtBQUVsQixpQkFBSyxNQUFMLEdBQWMsSUFBSSxHQUFKLEVBQWQsQ0FGa0I7QUFHbEIsaUJBQUssU0FBTCxHQUFpQixRQUFqQixDQUhrQjtBQUlsQixpQkFBSyxPQUFMLEdBQWUsS0FBZixDQUprQjtBQUtsQixpQkFBSyxVQUFMLEdBQWtCLENBQWxCLENBTGtCO0FBTWxCLGlCQUFLLFFBQUwsR0FBZ0IsS0FBSyxNQUFMLENBQVksR0FBWixDQUF3QixpQkFBeEIsQ0FBaEIsQ0FOa0I7QUFRbEIsZ0JBQUksV0FBVyxLQUFLLFFBQUwsR0FBZ0IsQ0FBaEIsQ0FSRztBQVNsQixnQkFBSSxZQUFZLENBQVosRUFDQSxXQUFXLENBQVgsQ0FESjtBQUdBLGlCQUFLLFNBQUwsQ0FBZSxHQUFmLENBQW1CLGFBQW5CLEVBQWtDLGVBQWUsUUFBZixDQUFsQyxDQVprQjtBQWFsQixnQkFBSSxLQUFLLFlBQUwsSUFBcUIsS0FBSyxVQUFMLEVBQWlCO0FBQ3RDLHFCQUFLLEtBQUwsQ0FBVyxNQUFYLEdBQW9CLEtBQUssWUFBTCxHQUFvQixLQUFLLFVBQUwsR0FBa0IsSUFBdEMsQ0FEa0I7YUFBMUM7QUFJQSxnQkFBTSxVQUFVLElBQUksUUFBUSxPQUFSLEVBQWQsQ0FqQlk7QUFrQmxCLGdCQUFJLGtCQUFrQixLQUFLLFlBQUwsQ0FsQko7QUFtQmxCLG9CQUFRLEtBQVIsR0FBZ0IsWUFBQTtBQUFRLGtDQUFrQixPQUFLLFlBQUwsQ0FBMUI7YUFBQSxDQW5CRTtBQW9CbEIsb0JBQVEsTUFBUixHQUFpQixnQkFBcUM7b0JBQW5DLGVBQW1DOztBQUNsRCx3QkFBUSxHQUFSLENBQVksR0FB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QUFDTiw2QkFBSyxDQUFDLFNBQWUsR0FBRyxNQUFILENBQVcsS0FBWCxDQUFpQixHQUFqQixFQUFzQixFQUFyQyxLQUE0QyxDQUE1QyxDQUFELEdBQWtELEdBQUcsT0FBSCxHQUFhLE1BQS9EO3FCQUZULENBSG9CO2lCQUFILENBQWQsQ0FPSixTQVBJLENBT00sT0FQTixDQUFQLENBSm1DO2FBQUgsQ0FBOUIsQ0FOYTtBQW9CbkIsaUJBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQixVQUFVLFNBQVYsQ0FBb0I7dUJBQUssT0FBSyxLQUFMO2FBQUwsQ0FBeEMsRUFwQm1CO0FBcUJuQixpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLFVBQVUsU0FBVixDQUFvQixVQUFDLENBQUQ7dUJBQU8sT0FBSyxNQUFMLENBQVksQ0FBWjthQUFQLEVBQXVCLElBQTNDLEVBQWlEO3VCQUFNLE9BQUssSUFBTDthQUFOLENBQXJFLEVBckJtQjs7Ozs7RUFkRTs7QUF1Q3ZCLFFBQVMsT0FBVCxHQUF5QixTQUFVLGVBQVYsQ0FBMEIsbUJBQTFCLEVBQStDLEVBQUUsV0FBVyxRQUFRLFNBQVIsRUFBNUQsQ0FBekIiLCJmaWxlIjoibGliL3ZpZXdzL2RvY2std2luZG93LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgT2JzZXJ2YWJsZSB9IGZyb20gXCJyeGpzXCI7XG5pbXBvcnQgeyBEaXNwb3NhYmxlLCBDb21wb3NpdGVEaXNwb3NhYmxlLCBTaW5nbGVBc3NpZ25tZW50RGlzcG9zYWJsZSB9IGZyb20gXCJ0cy1kaXNwb3NhYmxlc1wiO1xuZXhwb3J0IGNsYXNzIERvY2tXaW5kb3cgZXh0ZW5kcyBIVE1MRGl2RWxlbWVudCB7XG4gICAgZ2V0IGlzT3BlbigpIHsgcmV0dXJuIHRoaXMudmlzaWJsZTsgfVxuICAgIGdldCBzZWxlY3RlZCgpIHsgcmV0dXJuIHRoaXMuX3NlbGVjdGVkOyB9XG4gICAgc2V0IHNlbGVjdGVkKHZhbHVlKSB7XG4gICAgICAgIGNvbnN0IHBhbmUgPSB0aGlzLl9wYW5lcy5nZXQodmFsdWUpO1xuICAgICAgICBpZiAodGhpcy5fc2VsZWN0ZWRQYW5lKSB7XG4gICAgICAgICAgICB0aGlzLl9zZWxlY3RlZFBhbmUuX2J1dHRvbi5jbGFzc0xpc3QucmVtb3ZlKFwic2VsZWN0ZWRcIik7XG4gICAgICAgICAgICB0aGlzLl9zZWxlY3RlZFBhbmUudmlldy5yZW1vdmUoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocGFuZSkge1xuICAgICAgICAgICAgdGhpcy5fc2VsZWN0ZWRQYW5lID0gcGFuZTtcbiAgICAgICAgICAgIHBhbmUuX2J1dHRvbi5jbGFzc0xpc3QuYWRkKFwic2VsZWN0ZWRcIik7XG4gICAgICAgICAgICB0aGlzLmFwcGVuZENoaWxkKHBhbmUudmlldyk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fc2VsZWN0ZWQgPSB2YWx1ZTtcbiAgICB9XG4gICAgY3JlYXRlZENhbGxiYWNrKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICB0aGlzLl9wYW5lcyA9IG5ldyBNYXAoKTtcbiAgICAgICAgdGhpcy5fc2VsZWN0ZWQgPSBcIm91dHB1dFwiO1xuICAgICAgICB0aGlzLnZpc2libGUgPSBmYWxzZTtcbiAgICAgICAgdGhpcy50ZW1wSGVpZ2h0ID0gMDtcbiAgICAgICAgdGhpcy5mb250U2l6ZSA9IGF0b20uY29uZmlnLmdldChcImVkaXRvci5mb250U2l6ZVwiKTtcbiAgICAgICAgbGV0IGZvbnRTaXplID0gdGhpcy5mb250U2l6ZSAtIDE7XG4gICAgICAgIGlmIChmb250U2l6ZSA8PSAwKVxuICAgICAgICAgICAgZm9udFNpemUgPSAxO1xuICAgICAgICB0aGlzLmNsYXNzTGlzdC5hZGQoXCJpbnNldC1wYW5lbFwiLCBcImZvbnQtc2l6ZS1cIiArIGZvbnRTaXplKTtcbiAgICAgICAgaWYgKHRoaXMuY2xpZW50SGVpZ2h0IHx8IHRoaXMudGVtcEhlaWdodCkge1xuICAgICAgICAgICAgdGhpcy5zdHlsZS5oZWlnaHQgPSB0aGlzLmNsaWVudEhlaWdodCArIHRoaXMudGVtcEhlaWdodCArIFwicHhcIjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCByZXNpemVyID0gbmV3IGV4cG9ydHMuUmVzaXplcigpO1xuICAgICAgICBsZXQgX29yaWdpbmFsSGVpZ2h0ID0gdGhpcy5jbGllbnRIZWlnaHQ7XG4gICAgICAgIHJlc2l6ZXIuc3RhcnQgPSAoKSA9PiB7IF9vcmlnaW5hbEhlaWdodCA9IHRoaXMuY2xpZW50SGVpZ2h0OyB9O1xuICAgICAgICByZXNpemVyLnVwZGF0ZSA9ICh7IHRvcCB9KSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyh0b3ApO1xuICAgICAgICAgICAgdGhpcy5zdHlsZS5oZWlnaHQgPSBgJHtfb3JpZ2luYWxIZWlnaHQgKyAtKHRvcCl9cHhgO1xuICAgICAgICB9O1xuICAgICAgICByZXNpemVyLmRvbmUgPSAoKSA9PiB7IH07XG4gICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQocmVzaXplcik7XG4gICAgICAgIGNvbnN0IHdpbmRvd3MgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICB3aW5kb3dzLmNsYXNzTGlzdC5hZGQoXCJwYW5lbC1oZWFkaW5nXCIsIFwiY2xlYXJmaXhcIik7XG4gICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQod2luZG93cyk7XG4gICAgICAgIHRoaXMuX3Rvb2xiYXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICB0aGlzLl90b29sYmFyLmNsYXNzTGlzdC5hZGQoXCJidG4tdG9vbGJhclwiLCBcInB1bGwtbGVmdFwiKTtcbiAgICAgICAgd2luZG93cy5hcHBlbmRDaGlsZCh0aGlzLl90b29sYmFyKTtcbiAgICAgICAgdGhpcy5fcGFuZUJ1dHRvbnMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICB0aGlzLl9wYW5lQnV0dG9ucy5jbGFzc0xpc3QuYWRkKFwiYnRuLWdyb3VwXCIsIFwiYnRuLXRvZ2dsZVwiKTtcbiAgICAgICAgdGhpcy5fdG9vbGJhci5hcHBlbmRDaGlsZCh0aGlzLl9wYW5lQnV0dG9ucyk7XG4gICAgICAgIHRoaXMuX3RvZ2dsZUJ1dHRvbnMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICB0aGlzLl90b2dnbGVCdXR0b25zLmNsYXNzTGlzdC5hZGQoXCJidG4td2VsbFwiLCBcInB1bGwtcmlnaHRcIiwgXCJidG4tZ3JvdXBcIik7XG4gICAgICAgIHdpbmRvd3MuYXBwZW5kQ2hpbGQodGhpcy5fdG9nZ2xlQnV0dG9ucyk7XG4gICAgfVxuICAgIGF0dGFjaGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb25maWcub2JzZXJ2ZShcImVkaXRvci5mb250U2l6ZVwiLCAoc2l6ZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5jbGFzc05hbWUgPSB0aGlzLmNsYXNzTmFtZS5yZXBsYWNlKC9mb250LXNpemUtW1xcZF0qL2csIFwiXCIpO1xuICAgICAgICAgICAgdGhpcy5mb250U2l6ZSA9IHNpemU7XG4gICAgICAgICAgICB0aGlzLmNsYXNzTGlzdC5hZGQoXCJmb250LXNpemUtXCIgKyBzaXplKTtcbiAgICAgICAgfSkpO1xuICAgIH1cbiAgICBzZXRQYW5lbChwYW5lbCkge1xuICAgICAgICB0aGlzLl9wYW5lbCA9IHBhbmVsO1xuICAgIH1cbiAgICBfYWRkRG9ja0J1dHRvbihidXR0b24pIHtcbiAgICAgICAgY29uc3QgeyBpZCwgdGl0bGUsIG9wdGlvbnMsIGRpc3Bvc2FibGUgfSA9IGJ1dHRvbjtcbiAgICAgICAgY29uc3QgdmlldyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XG4gICAgICAgIHZpZXcuY2xhc3NMaXN0LmFkZChcImJ0blwiLCBcImJ0bi1kZWZhdWx0XCIsIFwiYnRuLWZpeFwiKTtcbiAgICAgICAgdmlldy5faWQgPSBpZDtcbiAgICAgICAgdmlldy5fcHJpb3JpdHkgPSBvcHRpb25zLnByaW9yaXR5O1xuICAgICAgICBkaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XG4gICAgICAgICAgICBpZiAodmlldy5jbGFzc0xpc3QuY29udGFpbnMoXCJzZWxlY3RlZFwiKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWQgPSB2aWV3LnByZXZpb3VzRWxlbWVudFNpYmxpbmcuX2lkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmlldy5yZW1vdmUoKTtcbiAgICAgICAgfSkpO1xuICAgICAgICBjb25zdCB0ZXh0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICAgIHRleHQuaW5uZXJIVE1MID0gdGl0bGU7XG4gICAgICAgIHRleHQuY2xhc3NMaXN0LmFkZChcInRleHRcIik7XG4gICAgICAgIHZpZXcuYXBwZW5kQ2hpbGQodGV4dCk7XG4gICAgICAgIGlmIChvcHRpb25zLmNsb3NlYWJsZSkge1xuICAgICAgICAgICAgdmlldy5jbGFzc0xpc3QuYWRkKFwiY2xvc2VhYmxlXCIpO1xuICAgICAgICAgICAgY29uc3QgY2xvc2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgICAgIGNsb3NlLmNsYXNzTGlzdC5hZGQoXCJmYVwiLCBcImZhLXRpbWVzLWNpcmNsZVwiLCBcImNsb3NlLXBhbmVcIik7XG4gICAgICAgICAgICBjbG9zZS5vbmNsaWNrID0gKGUpID0+IHtcbiAgICAgICAgICAgICAgICBkaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB2aWV3LmFwcGVuZENoaWxkKGNsb3NlKTtcbiAgICAgICAgfVxuICAgICAgICB2aWV3Lm9uY2xpY2sgPSAoZSkgPT4ge1xuICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWQgPSBpZDtcbiAgICAgICAgfTtcbiAgICAgICAgYnV0dG9uLl9idXR0b24gPSB2aWV3O1xuICAgICAgICB0aGlzLl9pbnNlcnRCdXR0b24odGhpcy5fcGFuZUJ1dHRvbnMsIHZpZXcsIG9wdGlvbnMucHJpb3JpdHksIGlkKTtcbiAgICB9XG4gICAgX2FkZFRvZ2dsZUJ1dHRvbih7IGlkLCBvcHRpb25zLCB2aWV3LCBkaXNwb3NhYmxlIH0pIHtcbiAgICAgICAgZGlzcG9zYWJsZS5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xuICAgICAgICAgICAgdmlldy5yZW1vdmUoKTtcbiAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5yZW1vdmUoZGlzcG9zYWJsZSk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5faW5zZXJ0QnV0dG9uKHRoaXMuX3RvZ2dsZUJ1dHRvbnMsIHZpZXcsIG9wdGlvbnMucHJpb3JpdHksIGlkKTtcbiAgICB9XG4gICAgX2luc2VydEJ1dHRvbihwYXJlbnQsIGVsZW1lbnQsIHByaW9yaXR5LCBpZCkge1xuICAgICAgICBsZXQgaW5zZXJ0SW5kZXggPSAtMTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYXJlbnQuY2hpbGROb2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgY2hpbGQgPSBwYXJlbnQuY2hpbGROb2Rlc1tpXTtcbiAgICAgICAgICAgIGlmIChjaGlsZC5faWQgPD0gaWQgJiYgY2hpbGQuX3ByaW9yaXR5IDw9IHByaW9yaXR5KSB7XG4gICAgICAgICAgICAgICAgaW5zZXJ0SW5kZXggPSBpICsgMTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoaW5zZXJ0SW5kZXggPiAtMSAmJiBpbnNlcnRJbmRleCA8IHBhcmVudC5jaGlsZE5vZGVzLmxlbmd0aCkge1xuICAgICAgICAgICAgcGFyZW50Lmluc2VydEJlZm9yZShlbGVtZW50LCBwYXJlbnQuY2hpbGROb2Rlc1tpbnNlcnRJbmRleF0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcGFyZW50LmFwcGVuZENoaWxkKGVsZW1lbnQpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHVwZGF0ZUF0b20oY2IpIHtcbiAgICAgICAgaWYgKHRoaXMuX3BhbmVsLnZpc2libGUgIT09IHRoaXMudmlzaWJsZSkge1xuICAgICAgICAgICAgaWYgKHRoaXMudmlzaWJsZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3BhbmVsLnNob3coKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuX3BhbmVsLmhpZGUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoY2IpXG4gICAgICAgICAgICBjYigpO1xuICAgIH1cbiAgICBzaG93VmlldygpIHtcbiAgICAgICAgdGhpcy52aXNpYmxlID0gdHJ1ZTtcbiAgICAgICAgdGhpcy51cGRhdGVBdG9tKCk7XG4gICAgfVxuICAgIGRvU2hvd1ZpZXcoKSB7XG4gICAgICAgIHRoaXMudmlzaWJsZSA9IHRydWU7XG4gICAgfVxuICAgIGhpZGVWaWV3KCkge1xuICAgICAgICB0aGlzLmRvSGlkZVZpZXcoKTtcbiAgICAgICAgdGhpcy51cGRhdGVBdG9tKCk7XG4gICAgfVxuICAgIGRvSGlkZVZpZXcoKSB7XG4gICAgICAgIHRoaXMudmlzaWJsZSA9IGZhbHNlO1xuICAgICAgICBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVQYW5lKCkuYWN0aXZhdGUoKTtcbiAgICAgICAgYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlUGFuZSgpLmFjdGl2YXRlSXRlbSgpO1xuICAgIH1cbiAgICB0b2dnbGVWaWV3KCkge1xuICAgICAgICBpZiAodGhpcy52aXNpYmxlKSB7XG4gICAgICAgICAgICB0aGlzLmRvSGlkZVZpZXcoKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZG9TaG93VmlldygpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMudXBkYXRlQXRvbSgpO1xuICAgIH1cbiAgICB0b2dnbGVXaW5kb3coc2VsZWN0ZWQpIHtcbiAgICAgICAgaWYgKHRoaXMudmlzaWJsZSAmJiB0aGlzLnNlbGVjdGVkID09PSBzZWxlY3RlZCkge1xuICAgICAgICAgICAgdGhpcy5oaWRlVmlldygpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuc2VsZWN0V2luZG93KHNlbGVjdGVkKTtcbiAgICB9XG4gICAgc2VsZWN0V2luZG93KHNlbGVjdGVkKSB7XG4gICAgICAgIGlmICghdGhpcy52aXNpYmxlKVxuICAgICAgICAgICAgdGhpcy5kb1Nob3dWaWV3KCk7XG4gICAgICAgIHRoaXMuc2VsZWN0ZWQgPSBzZWxlY3RlZDtcbiAgICAgICAgdGhpcy51cGRhdGVBdG9tKCgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHBhbmVsID0gdGhpcy5xdWVyeVNlbGVjdG9yKFwiLm9tbmlzaGFycC1hdG9tLW91dHB1dC5zZWxlY3RlZFwiKTtcbiAgICAgICAgICAgIGlmIChwYW5lbClcbiAgICAgICAgICAgICAgICBwYW5lbC5mb2N1cygpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgYWRkV2luZG93KGlkLCB0aXRsZSwgdmlldywgb3B0aW9ucyA9IHsgcHJpb3JpdHk6IDEwMDAgfSwgcGFyZW50RGlzcG9zYWJsZSkge1xuICAgICAgICBjb25zdCBkaXNwb3NhYmxlID0gbmV3IFNpbmdsZUFzc2lnbm1lbnREaXNwb3NhYmxlKCk7XG4gICAgICAgIGNvbnN0IGNkID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgY29uc3QgY29udGV4dCA9IHsgaWQsIHRpdGxlLCB2aWV3LCBvcHRpb25zLCBkaXNwb3NhYmxlOiBjZCB9O1xuICAgICAgICB0aGlzLl9wYW5lcy5zZXQoaWQsIGNvbnRleHQpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGRpc3Bvc2FibGUpO1xuICAgICAgICBkaXNwb3NhYmxlLmRpc3Bvc2FibGUgPSBjZDtcbiAgICAgICAgaWYgKHBhcmVudERpc3Bvc2FibGUpXG4gICAgICAgICAgICBjZC5hZGQocGFyZW50RGlzcG9zYWJsZSk7XG4gICAgICAgIHZpZXcuY2xhc3NMaXN0LmFkZChcIm9tbmlzaGFycC1hdG9tLW91dHB1dFwiLCBgJHtpZH0tb3V0cHV0YCwgXCJzZWxlY3RlZFwiKTtcbiAgICAgICAgY2QuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTpkb2NrLXNob3ctXCIgKyBpZCwgKCkgPT4gdGhpcy5zZWxlY3RXaW5kb3coaWQpKSk7XG4gICAgICAgIGNkLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwib21uaXNoYXJwLWF0b206ZG9jay10b2dnbGUtXCIgKyBpZCwgKCkgPT4gdGhpcy50b2dnbGVXaW5kb3coaWQpKSk7XG4gICAgICAgIGlmIChvcHRpb25zLmNsb3NlYWJsZSkge1xuICAgICAgICAgICAgY2QuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTpkb2NrLWNsb3NlLVwiICsgaWQsICgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUucmVtb3ZlKGRpc3Bvc2FibGUpO1xuICAgICAgICAgICAgICAgIGRpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgICAgICAgICAgICAgIHRoaXMuaGlkZVZpZXcoKTtcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfVxuICAgICAgICBjZC5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMuc2VsZWN0ZWQgPT09IGlkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZWxlY3RlZCA9IFwib3V0cHV0XCI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pKTtcbiAgICAgICAgY2QuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcbiAgICAgICAgICAgIHZpZXcucmVtb3ZlKCk7XG4gICAgICAgICAgICB0aGlzLl9wYW5lcy5kZWxldGUoaWQpO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuX2FkZERvY2tCdXR0b24oY29udGV4dCk7XG4gICAgICAgIGlmICghdGhpcy5zZWxlY3RlZClcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWQgPSBpZDtcbiAgICAgICAgcmV0dXJuIGRpc3Bvc2FibGU7XG4gICAgfVxuICAgIGFkZEJ1dHRvbihpZCwgdGl0bGUsIHZpZXcsIG9wdGlvbnMgPSB7IHByaW9yaXR5OiAxMDAwIH0sIHBhcmVudERpc3Bvc2FibGUpIHtcbiAgICAgICAgY29uc3QgZGlzcG9zYWJsZSA9IG5ldyBTaW5nbGVBc3NpZ25tZW50RGlzcG9zYWJsZSgpO1xuICAgICAgICBjb25zdCBjZCA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoZGlzcG9zYWJsZSk7XG4gICAgICAgIGRpc3Bvc2FibGUuZGlzcG9zYWJsZSA9IGNkO1xuICAgICAgICBpZiAocGFyZW50RGlzcG9zYWJsZSlcbiAgICAgICAgICAgIGNkLmFkZChwYXJlbnREaXNwb3NhYmxlKTtcbiAgICAgICAgdGhpcy5fYWRkVG9nZ2xlQnV0dG9uKHsgaWQsIHRpdGxlLCB2aWV3LCBvcHRpb25zLCBkaXNwb3NhYmxlOiBjZCB9KTtcbiAgICAgICAgcmV0dXJuIGRpc3Bvc2FibGU7XG4gICAgfVxufVxuZXhwb3J0cy5Eb2NrV2luZG93ID0gZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50KFwib21uaXNoYXJwLWRvY2std2luZG93XCIsIHsgcHJvdG90eXBlOiBEb2NrV2luZG93LnByb3RvdHlwZSB9KTtcbmV4cG9ydCBjbGFzcyBSZXNpemVyIGV4dGVuZHMgSFRNTERpdkVsZW1lbnQge1xuICAgIGNyZWF0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdGhpcy5jbGFzc0xpc3QuYWRkKFwib21uaXNoYXJwLWF0b20tb3V0cHV0LXJlc2l6ZXJcIik7XG4gICAgfVxuICAgIGRldGFjaGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfVxuICAgIGF0dGFjaGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIGNvbnN0IG1vdXNlbW92ZSA9IE9ic2VydmFibGUuZnJvbUV2ZW50KGRvY3VtZW50LmJvZHksIFwibW91c2Vtb3ZlXCIpLnNoYXJlKCk7XG4gICAgICAgIGNvbnN0IG1vdXNldXAgPSBPYnNlcnZhYmxlLmZyb21FdmVudChkb2N1bWVudC5ib2R5LCBcIm1vdXNldXBcIikuc2hhcmUoKTtcbiAgICAgICAgY29uc3QgbW91c2Vkb3duID0gT2JzZXJ2YWJsZS5mcm9tRXZlbnQodGhpcywgXCJtb3VzZWRvd25cIikuc2hhcmUoKTtcbiAgICAgICAgY29uc3QgbW91c2VkcmFnID0gbW91c2Vkb3duLmZsYXRNYXAoKG1kKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBzdGFydFggPSBtZC5jbGllbnRYICsgd2luZG93LnNjcm9sbFgsIHN0YXJ0WSA9IG1kLmNsaWVudFkgKyB3aW5kb3cuc2Nyb2xsWTtcbiAgICAgICAgICAgIHJldHVybiBtb3VzZW1vdmUubWFwKChtbSkgPT4ge1xuICAgICAgICAgICAgICAgIG1tLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgbGVmdDogKHBhcnNlSW50KG1kLnRhcmdldC5zdHlsZS5sZWZ0LCAxMCkgfHwgMCkgKyBtbS5jbGllbnRYIC0gc3RhcnRYLFxuICAgICAgICAgICAgICAgICAgICB0b3A6IChwYXJzZUludChtZC50YXJnZXQuc3R5bGUudG9wLCAxMCkgfHwgMCkgKyBtbS5jbGllbnRZIC0gc3RhcnRZXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0pLnRha2VVbnRpbChtb3VzZXVwKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQobW91c2Vkb3duLnN1YnNjcmliZSh4ID0+IHRoaXMuc3RhcnQoKSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKG1vdXNlZHJhZy5zdWJzY3JpYmUoKHgpID0+IHRoaXMudXBkYXRlKHgpLCBudWxsLCAoKSA9PiB0aGlzLmRvbmUoKSkpO1xuICAgIH1cbn1cbmV4cG9ydHMuUmVzaXplciA9IGRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudChcIm9tbmlzaGFycC1yZXNpemVyXCIsIHsgcHJvdG90eXBlOiBSZXNpemVyLnByb3RvdHlwZSB9KTtcbiIsImltcG9ydCB7T2JzZXJ2YWJsZX0gZnJvbSBcInJ4anNcIjtcclxuaW1wb3J0IHtEaXNwb3NhYmxlLCBDb21wb3NpdGVEaXNwb3NhYmxlLCBTaW5nbGVBc3NpZ25tZW50RGlzcG9zYWJsZSwgSURpc3Bvc2FibGV9IGZyb20gXCJ0cy1kaXNwb3NhYmxlc1wiO1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBUb2dnbGVCdXR0b24ge1xyXG4gICAgaWQ6IHN0cmluZztcclxuICAgIHRpdGxlOiBzdHJpbmc7XHJcbiAgICB2aWV3OiBIVE1MRWxlbWVudDtcclxuICAgIG9wdGlvbnM6IERvY0J1dHRvbk9wdGlvbnM7XHJcbiAgICBkaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIERvY0J1dHRvbk9wdGlvbnMge1xyXG4gICAgcHJpb3JpdHk/OiBudW1iZXI7XHJcbn1cclxuXHJcbmludGVyZmFjZSBJbnRlcm5hbFRvZ2dsZUJ1dHRvbiBleHRlbmRzIFRvZ2dsZUJ1dHRvbiB7XHJcblxyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFBhbmVCdXR0b24ge1xyXG4gICAgaWQ6IHN0cmluZztcclxuICAgIHRpdGxlOiBzdHJpbmc7XHJcbiAgICB2aWV3OiBIVE1MRWxlbWVudDtcclxuICAgIG9wdGlvbnM6IFBhbmVCdXR0b25PcHRpb25zO1xyXG4gICAgZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBQYW5lQnV0dG9uT3B0aW9ucyB7XHJcbiAgICBwcmlvcml0eT86IG51bWJlcjtcclxuICAgIGNsb3NlYWJsZT86IGJvb2xlYW47XHJcbn1cclxuXHJcbmludGVyZmFjZSBJbnRlcm5hbFBhbmVCdXR0b24gZXh0ZW5kcyBQYW5lQnV0dG9uIHtcclxuICAgIF9idXR0b24/OiBFbGVtZW50O1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgRG9ja1dpbmRvdyBleHRlbmRzIEhUTUxEaXZFbGVtZW50IGltcGxlbWVudHMgV2ViQ29tcG9uZW50IHtcclxuICAgIHByaXZhdGUgZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxuICAgIHByaXZhdGUgX3BhbmVsOiBBdG9tLlBhbmVsO1xyXG4gICAgcHJpdmF0ZSBfc2VsZWN0ZWRQYW5lOiBJbnRlcm5hbFBhbmVCdXR0b247XHJcbiAgICBwcml2YXRlIF90b29sYmFyOiBIVE1MRGl2RWxlbWVudDtcclxuICAgIHByaXZhdGUgX3BhbmVCdXR0b25zOiBIVE1MRGl2RWxlbWVudDtcclxuICAgIHByaXZhdGUgX3RvZ2dsZUJ1dHRvbnM6IEhUTUxEaXZFbGVtZW50O1xyXG4gICAgcHJpdmF0ZSBfcGFuZXM6IE1hcDxzdHJpbmcsIEludGVybmFsUGFuZUJ1dHRvbj47XHJcbiAgICBwcml2YXRlIHZpc2libGU6IGJvb2xlYW47XHJcbiAgICBwcml2YXRlIHRlbXBIZWlnaHQ6IG51bWJlcjtcclxuICAgIHByaXZhdGUgZm9udFNpemU6IGFueTtcclxuXHJcbiAgICBwdWJsaWMgZ2V0IGlzT3BlbigpIHsgcmV0dXJuIHRoaXMudmlzaWJsZTsgfVxyXG4gICAgLy9hdG9tLmNvbmZpZy5nZXQ8bnVtYmVyPihcImVkaXRvci5mb250U2l6ZVwiKVxyXG5cclxuICAgIHByaXZhdGUgX3NlbGVjdGVkOiBzdHJpbmc7XHJcbiAgICBwdWJsaWMgZ2V0IHNlbGVjdGVkKCkgeyByZXR1cm4gdGhpcy5fc2VsZWN0ZWQ7IH1cclxuICAgIHB1YmxpYyBzZXQgc2VsZWN0ZWQodmFsdWUpIHtcclxuICAgICAgICBjb25zdCBwYW5lID0gdGhpcy5fcGFuZXMuZ2V0KHZhbHVlKTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX3NlbGVjdGVkUGFuZSkge1xyXG4gICAgICAgICAgICB0aGlzLl9zZWxlY3RlZFBhbmUuX2J1dHRvbi5jbGFzc0xpc3QucmVtb3ZlKFwic2VsZWN0ZWRcIik7XHJcbiAgICAgICAgICAgIHRoaXMuX3NlbGVjdGVkUGFuZS52aWV3LnJlbW92ZSgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHBhbmUpIHtcclxuICAgICAgICAgICAgdGhpcy5fc2VsZWN0ZWRQYW5lID0gcGFuZTtcclxuICAgICAgICAgICAgcGFuZS5fYnV0dG9uLmNsYXNzTGlzdC5hZGQoXCJzZWxlY3RlZFwiKTtcclxuICAgICAgICAgICAgdGhpcy5hcHBlbmRDaGlsZChwYW5lLnZpZXcpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5fc2VsZWN0ZWQgPSB2YWx1ZTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgY3JlYXRlZENhbGxiYWNrKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcbiAgICAgICAgdGhpcy5fcGFuZXMgPSBuZXcgTWFwPHN0cmluZywgSW50ZXJuYWxQYW5lQnV0dG9uPigpO1xyXG4gICAgICAgIHRoaXMuX3NlbGVjdGVkID0gXCJvdXRwdXRcIjtcclxuICAgICAgICB0aGlzLnZpc2libGUgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLnRlbXBIZWlnaHQgPSAwO1xyXG4gICAgICAgIHRoaXMuZm9udFNpemUgPSBhdG9tLmNvbmZpZy5nZXQ8bnVtYmVyPihcImVkaXRvci5mb250U2l6ZVwiKTtcclxuXHJcbiAgICAgICAgbGV0IGZvbnRTaXplID0gdGhpcy5mb250U2l6ZSAtIDE7XHJcbiAgICAgICAgaWYgKGZvbnRTaXplIDw9IDApXHJcbiAgICAgICAgICAgIGZvbnRTaXplID0gMTtcclxuXHJcbiAgICAgICAgdGhpcy5jbGFzc0xpc3QuYWRkKFwiaW5zZXQtcGFuZWxcIiwgXCJmb250LXNpemUtXCIgKyBmb250U2l6ZSk7XHJcbiAgICAgICAgaWYgKHRoaXMuY2xpZW50SGVpZ2h0IHx8IHRoaXMudGVtcEhlaWdodCkge1xyXG4gICAgICAgICAgICB0aGlzLnN0eWxlLmhlaWdodCA9IHRoaXMuY2xpZW50SGVpZ2h0ICsgdGhpcy50ZW1wSGVpZ2h0ICsgXCJweFwiO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgcmVzaXplciA9IG5ldyBleHBvcnRzLlJlc2l6ZXIoKTtcclxuICAgICAgICBsZXQgX29yaWdpbmFsSGVpZ2h0ID0gdGhpcy5jbGllbnRIZWlnaHQ7XHJcbiAgICAgICAgcmVzaXplci5zdGFydCA9ICgpID0+IHsgX29yaWdpbmFsSGVpZ2h0ID0gdGhpcy5jbGllbnRIZWlnaHQ7IH07XHJcbiAgICAgICAgcmVzaXplci51cGRhdGUgPSAoe3RvcH06IHsgbGVmdDogbnVtYmVyLCB0b3A6IG51bWJlciB9KSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHRvcCk7XHJcbiAgICAgICAgICAgIHRoaXMuc3R5bGUuaGVpZ2h0ID0gYCR7X29yaWdpbmFsSGVpZ2h0ICsgLSh0b3ApfXB4YDtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHJlc2l6ZXIuZG9uZSA9ICgpID0+IHsgLyogKi8gfTtcclxuICAgICAgICB0aGlzLmFwcGVuZENoaWxkKHJlc2l6ZXIpO1xyXG5cclxuICAgICAgICBjb25zdCB3aW5kb3dzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuICAgICAgICB3aW5kb3dzLmNsYXNzTGlzdC5hZGQoXCJwYW5lbC1oZWFkaW5nXCIsIFwiY2xlYXJmaXhcIik7XHJcbiAgICAgICAgdGhpcy5hcHBlbmRDaGlsZCh3aW5kb3dzKTtcclxuXHJcbiAgICAgICAgdGhpcy5fdG9vbGJhciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgICAgICAgdGhpcy5fdG9vbGJhci5jbGFzc0xpc3QuYWRkKFwiYnRuLXRvb2xiYXJcIiwgXCJwdWxsLWxlZnRcIik7XHJcbiAgICAgICAgd2luZG93cy5hcHBlbmRDaGlsZCh0aGlzLl90b29sYmFyKTtcclxuXHJcbiAgICAgICAgdGhpcy5fcGFuZUJ1dHRvbnMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gICAgICAgIHRoaXMuX3BhbmVCdXR0b25zLmNsYXNzTGlzdC5hZGQoXCJidG4tZ3JvdXBcIiwgXCJidG4tdG9nZ2xlXCIpO1xyXG4gICAgICAgIHRoaXMuX3Rvb2xiYXIuYXBwZW5kQ2hpbGQodGhpcy5fcGFuZUJ1dHRvbnMpO1xyXG5cclxuICAgICAgICB0aGlzLl90b2dnbGVCdXR0b25zID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuICAgICAgICB0aGlzLl90b2dnbGVCdXR0b25zLmNsYXNzTGlzdC5hZGQoXCJidG4td2VsbFwiLCBcInB1bGwtcmlnaHRcIiwgXCJidG4tZ3JvdXBcIik7XHJcbiAgICAgICAgd2luZG93cy5hcHBlbmRDaGlsZCh0aGlzLl90b2dnbGVCdXR0b25zKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgYXR0YWNoZWRDYWxsYmFjaygpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoXCJlZGl0b3IuZm9udFNpemVcIiwgKHNpemU6IG51bWJlcikgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLmNsYXNzTmFtZSA9IHRoaXMuY2xhc3NOYW1lLnJlcGxhY2UoL2ZvbnQtc2l6ZS1bXFxkXSovZywgXCJcIik7XHJcbiAgICAgICAgICAgIHRoaXMuZm9udFNpemUgPSBzaXplO1xyXG4gICAgICAgICAgICB0aGlzLmNsYXNzTGlzdC5hZGQoXCJmb250LXNpemUtXCIgKyBzaXplKTtcclxuICAgICAgICB9KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHNldFBhbmVsKHBhbmVsOiBBdG9tLlBhbmVsKSB7XHJcbiAgICAgICAgdGhpcy5fcGFuZWwgPSBwYW5lbDtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9hZGREb2NrQnV0dG9uKGJ1dHRvbjogSW50ZXJuYWxQYW5lQnV0dG9uKSB7XHJcbiAgICAgICAgY29uc3Qge2lkLCB0aXRsZSwgb3B0aW9ucywgZGlzcG9zYWJsZX0gPSBidXR0b247XHJcblxyXG4gICAgICAgIGNvbnN0IHZpZXcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpO1xyXG4gICAgICAgIHZpZXcuY2xhc3NMaXN0LmFkZChcImJ0blwiLCBcImJ0bi1kZWZhdWx0XCIsIFwiYnRuLWZpeFwiKTtcclxuICAgICAgICAodmlldyBhcyBhbnkpLl9pZCA9IGlkO1xyXG4gICAgICAgICh2aWV3IGFzIGFueSkuX3ByaW9yaXR5ID0gb3B0aW9ucy5wcmlvcml0eTtcclxuXHJcbiAgICAgICAgZGlzcG9zYWJsZS5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xyXG4gICAgICAgICAgICBpZiAodmlldy5jbGFzc0xpc3QuY29udGFpbnMoXCJzZWxlY3RlZFwiKSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zZWxlY3RlZCA9ICh2aWV3LnByZXZpb3VzRWxlbWVudFNpYmxpbmcgYXMgYW55KS5faWQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdmlldy5yZW1vdmUoKTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIGNvbnN0IHRleHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcclxuICAgICAgICB0ZXh0LmlubmVySFRNTCA9IHRpdGxlO1xyXG4gICAgICAgIHRleHQuY2xhc3NMaXN0LmFkZChcInRleHRcIik7XHJcbiAgICAgICAgdmlldy5hcHBlbmRDaGlsZCh0ZXh0KTtcclxuXHJcbiAgICAgICAgaWYgKG9wdGlvbnMuY2xvc2VhYmxlKSB7XHJcbiAgICAgICAgICAgIHZpZXcuY2xhc3NMaXN0LmFkZChcImNsb3NlYWJsZVwiKTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IGNsb3NlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XHJcbiAgICAgICAgICAgIGNsb3NlLmNsYXNzTGlzdC5hZGQoXCJmYVwiLCBcImZhLXRpbWVzLWNpcmNsZVwiLCBcImNsb3NlLXBhbmVcIik7XHJcbiAgICAgICAgICAgIGNsb3NlLm9uY2xpY2sgPSAoZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIHZpZXcuYXBwZW5kQ2hpbGQoY2xvc2UpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmlldy5vbmNsaWNrID0gKGUpID0+IHtcclxuICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICB0aGlzLnNlbGVjdGVkID0gaWQ7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgYnV0dG9uLl9idXR0b24gPSB2aWV3O1xyXG5cclxuICAgICAgICB0aGlzLl9pbnNlcnRCdXR0b24odGhpcy5fcGFuZUJ1dHRvbnMsIHZpZXcsIG9wdGlvbnMucHJpb3JpdHksIGlkKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9hZGRUb2dnbGVCdXR0b24oe2lkLCBvcHRpb25zLCB2aWV3LCBkaXNwb3NhYmxlfTogVG9nZ2xlQnV0dG9uKSB7XHJcbiAgICAgICAgZGlzcG9zYWJsZS5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xyXG4gICAgICAgICAgICB2aWV3LnJlbW92ZSgpO1xyXG4gICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUucmVtb3ZlKGRpc3Bvc2FibGUpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5faW5zZXJ0QnV0dG9uKHRoaXMuX3RvZ2dsZUJ1dHRvbnMsIHZpZXcsIG9wdGlvbnMucHJpb3JpdHksIGlkKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9pbnNlcnRCdXR0b24ocGFyZW50OiBFbGVtZW50LCBlbGVtZW50OiBFbGVtZW50LCBwcmlvcml0eTogbnVtYmVyLCBpZDogc3RyaW5nKSB7XHJcbiAgICAgICAgbGV0IGluc2VydEluZGV4ID0gLTE7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYXJlbnQuY2hpbGROb2Rlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBjb25zdCBjaGlsZCA9IDxhbnk+cGFyZW50LmNoaWxkTm9kZXNbaV07XHJcbiAgICAgICAgICAgIGlmIChjaGlsZC5faWQgPD0gaWQgJiYgY2hpbGQuX3ByaW9yaXR5IDw9IHByaW9yaXR5KSB7XHJcbiAgICAgICAgICAgICAgICBpbnNlcnRJbmRleCA9IGkgKyAxO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpbnNlcnRJbmRleCA+IC0xICYmIGluc2VydEluZGV4IDwgcGFyZW50LmNoaWxkTm9kZXMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHBhcmVudC5pbnNlcnRCZWZvcmUoZWxlbWVudCwgcGFyZW50LmNoaWxkTm9kZXNbaW5zZXJ0SW5kZXhdKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBwYXJlbnQuYXBwZW5kQ2hpbGQoZWxlbWVudCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgdXBkYXRlQXRvbShjYj86ICgpID0+IHZvaWQpIHtcclxuICAgICAgICBpZiAodGhpcy5fcGFuZWwudmlzaWJsZSAhPT0gdGhpcy52aXNpYmxlKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLnZpc2libGUpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX3BhbmVsLnNob3coKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX3BhbmVsLmhpZGUoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoY2IpIGNiKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHNob3dWaWV3KCkge1xyXG4gICAgICAgIHRoaXMudmlzaWJsZSA9IHRydWU7XHJcbiAgICAgICAgdGhpcy51cGRhdGVBdG9tKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRvU2hvd1ZpZXcoKSB7XHJcbiAgICAgICAgdGhpcy52aXNpYmxlID0gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgaGlkZVZpZXcoKSB7XHJcbiAgICAgICAgdGhpcy5kb0hpZGVWaWV3KCk7XHJcbiAgICAgICAgdGhpcy51cGRhdGVBdG9tKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBkb0hpZGVWaWV3KCkge1xyXG4gICAgICAgIHRoaXMudmlzaWJsZSA9IGZhbHNlO1xyXG4gICAgICAgIGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVBhbmUoKS5hY3RpdmF0ZSgpO1xyXG4gICAgICAgIGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVBhbmUoKS5hY3RpdmF0ZUl0ZW0oKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgdG9nZ2xlVmlldygpIHtcclxuICAgICAgICBpZiAodGhpcy52aXNpYmxlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZG9IaWRlVmlldygpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuZG9TaG93VmlldygpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnVwZGF0ZUF0b20oKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgdG9nZ2xlV2luZG93KHNlbGVjdGVkOiBzdHJpbmcpIHtcclxuICAgICAgICBpZiAodGhpcy52aXNpYmxlICYmIHRoaXMuc2VsZWN0ZWQgPT09IHNlbGVjdGVkKSB7XHJcbiAgICAgICAgICAgIHRoaXMuaGlkZVZpZXcoKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5zZWxlY3RXaW5kb3coc2VsZWN0ZWQpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzZWxlY3RXaW5kb3coc2VsZWN0ZWQ6IHN0cmluZykge1xyXG4gICAgICAgIGlmICghdGhpcy52aXNpYmxlKVxyXG4gICAgICAgICAgICB0aGlzLmRvU2hvd1ZpZXcoKTtcclxuXHJcbiAgICAgICAgdGhpcy5zZWxlY3RlZCA9IHNlbGVjdGVkO1xyXG5cclxuICAgICAgICAvLyBGb2N1cyB0aGUgcGFuZWwhXHJcbiAgICAgICAgdGhpcy51cGRhdGVBdG9tKCgpID0+IHtcclxuICAgICAgICAgICAgY29uc3QgcGFuZWw6IGFueSA9IHRoaXMucXVlcnlTZWxlY3RvcihcIi5vbW5pc2hhcnAtYXRvbS1vdXRwdXQuc2VsZWN0ZWRcIik7XHJcbiAgICAgICAgICAgIGlmIChwYW5lbCkgcGFuZWwuZm9jdXMoKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgYWRkV2luZG93KGlkOiBzdHJpbmcsIHRpdGxlOiBzdHJpbmcsIHZpZXc6IEhUTUxFbGVtZW50LCBvcHRpb25zOiBQYW5lQnV0dG9uT3B0aW9ucyA9IHsgcHJpb3JpdHk6IDEwMDAgfSwgcGFyZW50RGlzcG9zYWJsZT86IERpc3Bvc2FibGUpIHtcclxuICAgICAgICBjb25zdCBkaXNwb3NhYmxlID0gbmV3IFNpbmdsZUFzc2lnbm1lbnREaXNwb3NhYmxlKCk7XHJcbiAgICAgICAgY29uc3QgY2QgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG4gICAgICAgIGNvbnN0IGNvbnRleHQgPSB7IGlkLCB0aXRsZSwgdmlldywgb3B0aW9ucywgZGlzcG9zYWJsZTogY2QgfTtcclxuXHJcbiAgICAgICAgdGhpcy5fcGFuZXMuc2V0KGlkLCBjb250ZXh0KTtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGRpc3Bvc2FibGUpO1xyXG4gICAgICAgIGRpc3Bvc2FibGUuZGlzcG9zYWJsZSA9IGNkO1xyXG5cclxuICAgICAgICBpZiAocGFyZW50RGlzcG9zYWJsZSlcclxuICAgICAgICAgICAgY2QuYWRkKHBhcmVudERpc3Bvc2FibGUpO1xyXG5cclxuICAgICAgICB2aWV3LmNsYXNzTGlzdC5hZGQoXCJvbW5pc2hhcnAtYXRvbS1vdXRwdXRcIiwgYCR7aWR9LW91dHB1dGAsIFwic2VsZWN0ZWRcIik7XHJcblxyXG4gICAgICAgIGNkLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwib21uaXNoYXJwLWF0b206ZG9jay1zaG93LVwiICsgaWQsICgpID0+IHRoaXMuc2VsZWN0V2luZG93KGlkKSkpO1xyXG4gICAgICAgIGNkLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwib21uaXNoYXJwLWF0b206ZG9jay10b2dnbGUtXCIgKyBpZCwgKCkgPT4gdGhpcy50b2dnbGVXaW5kb3coaWQpKSk7XHJcblxyXG4gICAgICAgIGlmIChvcHRpb25zLmNsb3NlYWJsZSkge1xyXG4gICAgICAgICAgICBjZC5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcIm9tbmlzaGFycC1hdG9tOmRvY2stY2xvc2UtXCIgKyBpZCwgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLnJlbW92ZShkaXNwb3NhYmxlKTtcclxuICAgICAgICAgICAgICAgIGRpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5oaWRlVmlldygpO1xyXG4gICAgICAgICAgICB9KSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjZC5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5zZWxlY3RlZCA9PT0gaWQpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWQgPSBcIm91dHB1dFwiO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICBjZC5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xyXG4gICAgICAgICAgICB2aWV3LnJlbW92ZSgpO1xyXG4gICAgICAgICAgICB0aGlzLl9wYW5lcy5kZWxldGUoaWQpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5fYWRkRG9ja0J1dHRvbihjb250ZXh0KTtcclxuXHJcbiAgICAgICAgaWYgKCF0aGlzLnNlbGVjdGVkKSB0aGlzLnNlbGVjdGVkID0gaWQ7XHJcblxyXG4gICAgICAgIHJldHVybiA8SURpc3Bvc2FibGU+ZGlzcG9zYWJsZTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgYWRkQnV0dG9uKGlkOiBzdHJpbmcsIHRpdGxlOiBzdHJpbmcsIHZpZXc6IEhUTUxFbGVtZW50LCBvcHRpb25zOiBEb2NCdXR0b25PcHRpb25zID0geyBwcmlvcml0eTogMTAwMCB9LCBwYXJlbnREaXNwb3NhYmxlPzogRGlzcG9zYWJsZSkge1xyXG4gICAgICAgIGNvbnN0IGRpc3Bvc2FibGUgPSBuZXcgU2luZ2xlQXNzaWdubWVudERpc3Bvc2FibGUoKTtcclxuICAgICAgICBjb25zdCBjZCA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChkaXNwb3NhYmxlKTtcclxuICAgICAgICBkaXNwb3NhYmxlLmRpc3Bvc2FibGUgPSBjZDtcclxuXHJcbiAgICAgICAgaWYgKHBhcmVudERpc3Bvc2FibGUpXHJcbiAgICAgICAgICAgIGNkLmFkZChwYXJlbnREaXNwb3NhYmxlKTtcclxuXHJcbiAgICAgICAgdGhpcy5fYWRkVG9nZ2xlQnV0dG9uKHsgaWQsIHRpdGxlLCB2aWV3LCBvcHRpb25zLCBkaXNwb3NhYmxlOiBjZCB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIDxJRGlzcG9zYWJsZT5kaXNwb3NhYmxlO1xyXG4gICAgfVxyXG59XHJcblxyXG4oPGFueT5leHBvcnRzKS5Eb2NrV2luZG93ID0gKDxhbnk+ZG9jdW1lbnQpLnJlZ2lzdGVyRWxlbWVudChcIm9tbmlzaGFycC1kb2NrLXdpbmRvd1wiLCB7IHByb3RvdHlwZTogRG9ja1dpbmRvdy5wcm90b3R5cGUgfSk7XHJcblxyXG5leHBvcnQgY2xhc3MgUmVzaXplciBleHRlbmRzIEhUTUxEaXZFbGVtZW50IGltcGxlbWVudHMgV2ViQ29tcG9uZW50IHtcclxuICAgIHByaXZhdGUgZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxuICAgIHB1YmxpYyB1cGRhdGU6IChsb2NhdGlvbjogeyBsZWZ0OiBudW1iZXI7IHRvcDogbnVtYmVyIH0pID0+IHZvaWQ7XHJcbiAgICBwdWJsaWMgZG9uZTogKCkgPT4gdm9pZDtcclxuICAgIHB1YmxpYyBzdGFydDogKCkgPT4gdm9pZDtcclxuXHJcbiAgICBwdWJsaWMgY3JlYXRlZENhbGxiYWNrKCkge1xyXG4gICAgICAgIHRoaXMuY2xhc3NMaXN0LmFkZChcIm9tbmlzaGFycC1hdG9tLW91dHB1dC1yZXNpemVyXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkZXRhY2hlZENhbGxiYWNrKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGF0dGFjaGVkQ2FsbGJhY2soKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgICAgICBjb25zdCBtb3VzZW1vdmUgPSBPYnNlcnZhYmxlLmZyb21FdmVudDxNb3VzZUV2ZW50Pihkb2N1bWVudC5ib2R5LCBcIm1vdXNlbW92ZVwiKS5zaGFyZSgpO1xyXG4gICAgICAgIGNvbnN0IG1vdXNldXAgPSBPYnNlcnZhYmxlLmZyb21FdmVudDxNb3VzZUV2ZW50Pihkb2N1bWVudC5ib2R5LCBcIm1vdXNldXBcIikuc2hhcmUoKTtcclxuICAgICAgICBjb25zdCBtb3VzZWRvd24gPSBPYnNlcnZhYmxlLmZyb21FdmVudDxNb3VzZUV2ZW50Pih0aGlzLCBcIm1vdXNlZG93blwiKS5zaGFyZSgpO1xyXG5cclxuICAgICAgICBjb25zdCBtb3VzZWRyYWcgPSBtb3VzZWRvd24uZmxhdE1hcCgobWQpID0+IHtcclxuICAgICAgICAgICAgY29uc3Qgc3RhcnRYID0gbWQuY2xpZW50WCArIHdpbmRvdy5zY3JvbGxYLFxyXG4gICAgICAgICAgICAgICAgc3RhcnRZID0gbWQuY2xpZW50WSArIHdpbmRvdy5zY3JvbGxZO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIG1vdXNlbW92ZS5tYXAoKG1tKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBtbS5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGVmdDogKHBhcnNlSW50KCg8YW55Pm1kLnRhcmdldCkuc3R5bGUubGVmdCwgMTApIHx8IDApICsgbW0uY2xpZW50WCAtIHN0YXJ0WCxcclxuICAgICAgICAgICAgICAgICAgICB0b3A6IChwYXJzZUludCgoPGFueT5tZC50YXJnZXQpLnN0eWxlLnRvcCwgMTApIHx8IDApICsgbW0uY2xpZW50WSAtIHN0YXJ0WVxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgfSkudGFrZVVudGlsKG1vdXNldXApO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKG1vdXNlZG93bi5zdWJzY3JpYmUoeCA9PiB0aGlzLnN0YXJ0KCkpKTtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKG1vdXNlZHJhZy5zdWJzY3JpYmUoKHgpID0+IHRoaXMudXBkYXRlKHgpLCBudWxsLCAoKSA9PiB0aGlzLmRvbmUoKSkpO1xyXG4gICAgfVxyXG59XHJcblxyXG4oPGFueT5leHBvcnRzKS5SZXNpemVyID0gKDxhbnk+ZG9jdW1lbnQpLnJlZ2lzdGVyRWxlbWVudChcIm9tbmlzaGFycC1yZXNpemVyXCIsIHsgcHJvdG90eXBlOiBSZXNpemVyLnByb3RvdHlwZSB9KTtcclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
