"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Resizer = exports.DockWindow = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _rxjs = require("rxjs");

var _omnisharpClient = require("omnisharp-client");

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

            this.disposable = new _omnisharpClient.CompositeDisposable();
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
            disposable.add(_omnisharpClient.Disposable.create(function () {
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

            disposable.add(_omnisharpClient.Disposable.create(function () {
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

            var disposable = new _omnisharpClient.SingleAssignmentDisposable();
            var cd = new _omnisharpClient.CompositeDisposable();
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
            cd.add(_omnisharpClient.Disposable.create(function () {
                if (_this7.selected === id) {
                    _this7.selected = "output";
                }
            }));
            cd.add(_omnisharpClient.Disposable.create(function () {
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

            var disposable = new _omnisharpClient.SingleAssignmentDisposable();
            var cd = new _omnisharpClient.CompositeDisposable();
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

            this.disposable = new _omnisharpClient.CompositeDisposable();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy9kb2NrLXdpbmRvdy5qcyIsImxpYi92aWV3cy9kb2NrLXdpbmRvdy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7QUFDQTs7Ozs7Ozs7SUNtQ0E7Ozs7Ozs7Ozs7OzBDQWtDMEI7OztBQUNsQixpQkFBSyxVQUFMLEdBQWtCLDBDQUFsQixDQURrQjtBQUVsQixpQkFBSyxNQUFMLEdBQWMsSUFBSSxHQUFKLEVBQWQsQ0FGa0I7QUFHbEIsaUJBQUssU0FBTCxHQUFpQixRQUFqQixDQUhrQjtBQUlsQixpQkFBSyxPQUFMLEdBQWUsS0FBZixDQUprQjtBQUtsQixpQkFBSyxVQUFMLEdBQWtCLENBQWxCLENBTGtCO0FBTWxCLGlCQUFLLFFBQUwsR0FBZ0IsS0FBSyxNQUFMLENBQVksR0FBWixDQUF3QixpQkFBeEIsQ0FBaEIsQ0FOa0I7QUFRbEIsZ0JBQUksV0FBVyxLQUFLLFFBQUwsR0FBZ0IsQ0FBaEIsQ0FSRztBQVNsQixnQkFBSSxZQUFZLENBQVosRUFDQSxXQUFXLENBQVgsQ0FESjtBQUdBLGlCQUFLLFNBQUwsQ0FBZSxHQUFmLENBQW1CLGFBQW5CLEVBQWtDLGVBQWUsUUFBZixDQUFsQyxDQVprQjtBQWFsQixnQkFBSSxLQUFLLFlBQUwsSUFBcUIsS0FBSyxVQUFMLEVBQWlCO0FBQ3RDLHFCQUFLLEtBQUwsQ0FBVyxNQUFYLEdBQW9CLEtBQUssWUFBTCxHQUFvQixLQUFLLFVBQUwsR0FBa0IsSUFBdEMsQ0FEa0I7YUFBMUM7QUFJQSxnQkFBTSxVQUFVLElBQUksUUFBUSxPQUFSLEVBQWQsQ0FqQlk7QUFrQmxCLGdCQUFJLGtCQUFrQixLQUFLLFlBQUwsQ0FsQko7QUFtQmxCLG9CQUFRLEtBQVIsR0FBZ0IsWUFBQTtBQUFRLGtDQUFrQixPQUFLLFlBQUwsQ0FBMUI7YUFBQSxDQW5CRTtBQW9CbEIsb0JBQVEsTUFBUixHQUFpQixnQkFBcUM7b0JBQW5DLGVBQW1DOztBQUNsRCx3QkFBUSxHQUFSLENBQVksR0FB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QUFDTiw2QkFBSyxDQUFDLFNBQWUsR0FBRyxNQUFILENBQVcsS0FBWCxDQUFpQixHQUFqQixFQUFzQixFQUFyQyxLQUE0QyxDQUE1QyxDQUFELEdBQWtELEdBQUcsT0FBSCxHQUFhLE1BQS9EO3FCQUZULENBSG9CO2lCQUFILENBQWQsQ0FPSixTQVBJLENBT00sT0FQTixDQUFQLENBSm1DO2FBQUgsQ0FBOUIsQ0FOYTtBQW9CbkIsaUJBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQixVQUFVLFNBQVYsQ0FBb0I7dUJBQUssT0FBSyxLQUFMO2FBQUwsQ0FBeEMsRUFwQm1CO0FBcUJuQixpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLFVBQVUsU0FBVixDQUFvQixVQUFDLENBQUQ7dUJBQU8sT0FBSyxNQUFMLENBQVksQ0FBWjthQUFQLEVBQXVCLElBQTNDLEVBQWlEO3VCQUFNLE9BQUssSUFBTDthQUFOLENBQXJFLEVBckJtQjs7Ozs7RUFkRTs7QUF1Q3ZCLFFBQVMsT0FBVCxHQUF5QixTQUFVLGVBQVYsQ0FBMEIsbUJBQTFCLEVBQStDLEVBQUUsV0FBVyxRQUFRLFNBQVIsRUFBNUQsQ0FBekIiLCJmaWxlIjoibGliL3ZpZXdzL2RvY2std2luZG93LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgT2JzZXJ2YWJsZSB9IGZyb20gXCJyeGpzXCI7XG5pbXBvcnQgeyBEaXNwb3NhYmxlLCBDb21wb3NpdGVEaXNwb3NhYmxlLCBTaW5nbGVBc3NpZ25tZW50RGlzcG9zYWJsZSB9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XG5leHBvcnQgY2xhc3MgRG9ja1dpbmRvdyBleHRlbmRzIEhUTUxEaXZFbGVtZW50IHtcbiAgICBnZXQgaXNPcGVuKCkgeyByZXR1cm4gdGhpcy52aXNpYmxlOyB9XG4gICAgZ2V0IHNlbGVjdGVkKCkgeyByZXR1cm4gdGhpcy5fc2VsZWN0ZWQ7IH1cbiAgICBzZXQgc2VsZWN0ZWQodmFsdWUpIHtcbiAgICAgICAgY29uc3QgcGFuZSA9IHRoaXMuX3BhbmVzLmdldCh2YWx1ZSk7XG4gICAgICAgIGlmICh0aGlzLl9zZWxlY3RlZFBhbmUpIHtcbiAgICAgICAgICAgIHRoaXMuX3NlbGVjdGVkUGFuZS5fYnV0dG9uLmNsYXNzTGlzdC5yZW1vdmUoXCJzZWxlY3RlZFwiKTtcbiAgICAgICAgICAgIHRoaXMuX3NlbGVjdGVkUGFuZS52aWV3LnJlbW92ZSgpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChwYW5lKSB7XG4gICAgICAgICAgICB0aGlzLl9zZWxlY3RlZFBhbmUgPSBwYW5lO1xuICAgICAgICAgICAgcGFuZS5fYnV0dG9uLmNsYXNzTGlzdC5hZGQoXCJzZWxlY3RlZFwiKTtcbiAgICAgICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQocGFuZS52aWV3KTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9zZWxlY3RlZCA9IHZhbHVlO1xuICAgIH1cbiAgICBjcmVhdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIHRoaXMuX3BhbmVzID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLl9zZWxlY3RlZCA9IFwib3V0cHV0XCI7XG4gICAgICAgIHRoaXMudmlzaWJsZSA9IGZhbHNlO1xuICAgICAgICB0aGlzLnRlbXBIZWlnaHQgPSAwO1xuICAgICAgICB0aGlzLmZvbnRTaXplID0gYXRvbS5jb25maWcuZ2V0KFwiZWRpdG9yLmZvbnRTaXplXCIpO1xuICAgICAgICBsZXQgZm9udFNpemUgPSB0aGlzLmZvbnRTaXplIC0gMTtcbiAgICAgICAgaWYgKGZvbnRTaXplIDw9IDApXG4gICAgICAgICAgICBmb250U2l6ZSA9IDE7XG4gICAgICAgIHRoaXMuY2xhc3NMaXN0LmFkZChcImluc2V0LXBhbmVsXCIsIFwiZm9udC1zaXplLVwiICsgZm9udFNpemUpO1xuICAgICAgICBpZiAodGhpcy5jbGllbnRIZWlnaHQgfHwgdGhpcy50ZW1wSGVpZ2h0KSB7XG4gICAgICAgICAgICB0aGlzLnN0eWxlLmhlaWdodCA9IHRoaXMuY2xpZW50SGVpZ2h0ICsgdGhpcy50ZW1wSGVpZ2h0ICsgXCJweFwiO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHJlc2l6ZXIgPSBuZXcgZXhwb3J0cy5SZXNpemVyKCk7XG4gICAgICAgIGxldCBfb3JpZ2luYWxIZWlnaHQgPSB0aGlzLmNsaWVudEhlaWdodDtcbiAgICAgICAgcmVzaXplci5zdGFydCA9ICgpID0+IHsgX29yaWdpbmFsSGVpZ2h0ID0gdGhpcy5jbGllbnRIZWlnaHQ7IH07XG4gICAgICAgIHJlc2l6ZXIudXBkYXRlID0gKHsgdG9wIH0pID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHRvcCk7XG4gICAgICAgICAgICB0aGlzLnN0eWxlLmhlaWdodCA9IGAke19vcmlnaW5hbEhlaWdodCArIC0odG9wKX1weGA7XG4gICAgICAgIH07XG4gICAgICAgIHJlc2l6ZXIuZG9uZSA9ICgpID0+IHsgfTtcbiAgICAgICAgdGhpcy5hcHBlbmRDaGlsZChyZXNpemVyKTtcbiAgICAgICAgY29uc3Qgd2luZG93cyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgIHdpbmRvd3MuY2xhc3NMaXN0LmFkZChcInBhbmVsLWhlYWRpbmdcIiwgXCJjbGVhcmZpeFwiKTtcbiAgICAgICAgdGhpcy5hcHBlbmRDaGlsZCh3aW5kb3dzKTtcbiAgICAgICAgdGhpcy5fdG9vbGJhciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgIHRoaXMuX3Rvb2xiYXIuY2xhc3NMaXN0LmFkZChcImJ0bi10b29sYmFyXCIsIFwicHVsbC1sZWZ0XCIpO1xuICAgICAgICB3aW5kb3dzLmFwcGVuZENoaWxkKHRoaXMuX3Rvb2xiYXIpO1xuICAgICAgICB0aGlzLl9wYW5lQnV0dG9ucyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgIHRoaXMuX3BhbmVCdXR0b25zLmNsYXNzTGlzdC5hZGQoXCJidG4tZ3JvdXBcIiwgXCJidG4tdG9nZ2xlXCIpO1xuICAgICAgICB0aGlzLl90b29sYmFyLmFwcGVuZENoaWxkKHRoaXMuX3BhbmVCdXR0b25zKTtcbiAgICAgICAgdGhpcy5fdG9nZ2xlQnV0dG9ucyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgIHRoaXMuX3RvZ2dsZUJ1dHRvbnMuY2xhc3NMaXN0LmFkZChcImJ0bi13ZWxsXCIsIFwicHVsbC1yaWdodFwiLCBcImJ0bi1ncm91cFwiKTtcbiAgICAgICAgd2luZG93cy5hcHBlbmRDaGlsZCh0aGlzLl90b2dnbGVCdXR0b25zKTtcbiAgICB9XG4gICAgYXR0YWNoZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbmZpZy5vYnNlcnZlKFwiZWRpdG9yLmZvbnRTaXplXCIsIChzaXplKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmNsYXNzTmFtZSA9IHRoaXMuY2xhc3NOYW1lLnJlcGxhY2UoL2ZvbnQtc2l6ZS1bXFxkXSovZywgXCJcIik7XG4gICAgICAgICAgICB0aGlzLmZvbnRTaXplID0gc2l6ZTtcbiAgICAgICAgICAgIHRoaXMuY2xhc3NMaXN0LmFkZChcImZvbnQtc2l6ZS1cIiArIHNpemUpO1xuICAgICAgICB9KSk7XG4gICAgfVxuICAgIHNldFBhbmVsKHBhbmVsKSB7XG4gICAgICAgIHRoaXMuX3BhbmVsID0gcGFuZWw7XG4gICAgfVxuICAgIF9hZGREb2NrQnV0dG9uKGJ1dHRvbikge1xuICAgICAgICBjb25zdCB7IGlkLCB0aXRsZSwgb3B0aW9ucywgZGlzcG9zYWJsZSB9ID0gYnV0dG9uO1xuICAgICAgICBjb25zdCB2aWV3ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImJ1dHRvblwiKTtcbiAgICAgICAgdmlldy5jbGFzc0xpc3QuYWRkKFwiYnRuXCIsIFwiYnRuLWRlZmF1bHRcIiwgXCJidG4tZml4XCIpO1xuICAgICAgICB2aWV3Ll9pZCA9IGlkO1xuICAgICAgICB2aWV3Ll9wcmlvcml0eSA9IG9wdGlvbnMucHJpb3JpdHk7XG4gICAgICAgIGRpc3Bvc2FibGUuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcbiAgICAgICAgICAgIGlmICh2aWV3LmNsYXNzTGlzdC5jb250YWlucyhcInNlbGVjdGVkXCIpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZWxlY3RlZCA9IHZpZXcucHJldmlvdXNFbGVtZW50U2libGluZy5faWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2aWV3LnJlbW92ZSgpO1xuICAgICAgICB9KSk7XG4gICAgICAgIGNvbnN0IHRleHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgdGV4dC5pbm5lckhUTUwgPSB0aXRsZTtcbiAgICAgICAgdGV4dC5jbGFzc0xpc3QuYWRkKFwidGV4dFwiKTtcbiAgICAgICAgdmlldy5hcHBlbmRDaGlsZCh0ZXh0KTtcbiAgICAgICAgaWYgKG9wdGlvbnMuY2xvc2VhYmxlKSB7XG4gICAgICAgICAgICB2aWV3LmNsYXNzTGlzdC5hZGQoXCJjbG9zZWFibGVcIik7XG4gICAgICAgICAgICBjb25zdCBjbG9zZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICAgICAgY2xvc2UuY2xhc3NMaXN0LmFkZChcImZhXCIsIFwiZmEtdGltZXMtY2lyY2xlXCIsIFwiY2xvc2UtcGFuZVwiKTtcbiAgICAgICAgICAgIGNsb3NlLm9uY2xpY2sgPSAoZSkgPT4ge1xuICAgICAgICAgICAgICAgIGRpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHZpZXcuYXBwZW5kQ2hpbGQoY2xvc2UpO1xuICAgICAgICB9XG4gICAgICAgIHZpZXcub25jbGljayA9IChlKSA9PiB7XG4gICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgdGhpcy5zZWxlY3RlZCA9IGlkO1xuICAgICAgICB9O1xuICAgICAgICBidXR0b24uX2J1dHRvbiA9IHZpZXc7XG4gICAgICAgIHRoaXMuX2luc2VydEJ1dHRvbih0aGlzLl9wYW5lQnV0dG9ucywgdmlldywgb3B0aW9ucy5wcmlvcml0eSwgaWQpO1xuICAgIH1cbiAgICBfYWRkVG9nZ2xlQnV0dG9uKHsgaWQsIG9wdGlvbnMsIHZpZXcsIGRpc3Bvc2FibGUgfSkge1xuICAgICAgICBkaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XG4gICAgICAgICAgICB2aWV3LnJlbW92ZSgpO1xuICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLnJlbW92ZShkaXNwb3NhYmxlKTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLl9pbnNlcnRCdXR0b24odGhpcy5fdG9nZ2xlQnV0dG9ucywgdmlldywgb3B0aW9ucy5wcmlvcml0eSwgaWQpO1xuICAgIH1cbiAgICBfaW5zZXJ0QnV0dG9uKHBhcmVudCwgZWxlbWVudCwgcHJpb3JpdHksIGlkKSB7XG4gICAgICAgIGxldCBpbnNlcnRJbmRleCA9IC0xO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBhcmVudC5jaGlsZE5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBjaGlsZCA9IHBhcmVudC5jaGlsZE5vZGVzW2ldO1xuICAgICAgICAgICAgaWYgKGNoaWxkLl9pZCA8PSBpZCAmJiBjaGlsZC5fcHJpb3JpdHkgPD0gcHJpb3JpdHkpIHtcbiAgICAgICAgICAgICAgICBpbnNlcnRJbmRleCA9IGkgKyAxO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChpbnNlcnRJbmRleCA+IC0xICYmIGluc2VydEluZGV4IDwgcGFyZW50LmNoaWxkTm9kZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICBwYXJlbnQuaW5zZXJ0QmVmb3JlKGVsZW1lbnQsIHBhcmVudC5jaGlsZE5vZGVzW2luc2VydEluZGV4XSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBwYXJlbnQuYXBwZW5kQ2hpbGQoZWxlbWVudCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgdXBkYXRlQXRvbShjYikge1xuICAgICAgICBpZiAodGhpcy5fcGFuZWwudmlzaWJsZSAhPT0gdGhpcy52aXNpYmxlKSB7XG4gICAgICAgICAgICBpZiAodGhpcy52aXNpYmxlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fcGFuZWwuc2hvdygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fcGFuZWwuaGlkZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChjYilcbiAgICAgICAgICAgIGNiKCk7XG4gICAgfVxuICAgIHNob3dWaWV3KCkge1xuICAgICAgICB0aGlzLnZpc2libGUgPSB0cnVlO1xuICAgICAgICB0aGlzLnVwZGF0ZUF0b20oKTtcbiAgICB9XG4gICAgZG9TaG93VmlldygpIHtcbiAgICAgICAgdGhpcy52aXNpYmxlID0gdHJ1ZTtcbiAgICB9XG4gICAgaGlkZVZpZXcoKSB7XG4gICAgICAgIHRoaXMuZG9IaWRlVmlldygpO1xuICAgICAgICB0aGlzLnVwZGF0ZUF0b20oKTtcbiAgICB9XG4gICAgZG9IaWRlVmlldygpIHtcbiAgICAgICAgdGhpcy52aXNpYmxlID0gZmFsc2U7XG4gICAgICAgIGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVBhbmUoKS5hY3RpdmF0ZSgpO1xuICAgICAgICBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVQYW5lKCkuYWN0aXZhdGVJdGVtKCk7XG4gICAgfVxuICAgIHRvZ2dsZVZpZXcoKSB7XG4gICAgICAgIGlmICh0aGlzLnZpc2libGUpIHtcbiAgICAgICAgICAgIHRoaXMuZG9IaWRlVmlldygpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5kb1Nob3dWaWV3KCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy51cGRhdGVBdG9tKCk7XG4gICAgfVxuICAgIHRvZ2dsZVdpbmRvdyhzZWxlY3RlZCkge1xuICAgICAgICBpZiAodGhpcy52aXNpYmxlICYmIHRoaXMuc2VsZWN0ZWQgPT09IHNlbGVjdGVkKSB7XG4gICAgICAgICAgICB0aGlzLmhpZGVWaWV3KCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zZWxlY3RXaW5kb3coc2VsZWN0ZWQpO1xuICAgIH1cbiAgICBzZWxlY3RXaW5kb3coc2VsZWN0ZWQpIHtcbiAgICAgICAgaWYgKCF0aGlzLnZpc2libGUpXG4gICAgICAgICAgICB0aGlzLmRvU2hvd1ZpZXcoKTtcbiAgICAgICAgdGhpcy5zZWxlY3RlZCA9IHNlbGVjdGVkO1xuICAgICAgICB0aGlzLnVwZGF0ZUF0b20oKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcGFuZWwgPSB0aGlzLnF1ZXJ5U2VsZWN0b3IoXCIub21uaXNoYXJwLWF0b20tb3V0cHV0LnNlbGVjdGVkXCIpO1xuICAgICAgICAgICAgaWYgKHBhbmVsKVxuICAgICAgICAgICAgICAgIHBhbmVsLmZvY3VzKCk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBhZGRXaW5kb3coaWQsIHRpdGxlLCB2aWV3LCBvcHRpb25zID0geyBwcmlvcml0eTogMTAwMCB9LCBwYXJlbnREaXNwb3NhYmxlKSB7XG4gICAgICAgIGNvbnN0IGRpc3Bvc2FibGUgPSBuZXcgU2luZ2xlQXNzaWdubWVudERpc3Bvc2FibGUoKTtcbiAgICAgICAgY29uc3QgY2QgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICBjb25zdCBjb250ZXh0ID0geyBpZCwgdGl0bGUsIHZpZXcsIG9wdGlvbnMsIGRpc3Bvc2FibGU6IGNkIH07XG4gICAgICAgIHRoaXMuX3BhbmVzLnNldChpZCwgY29udGV4dCk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoZGlzcG9zYWJsZSk7XG4gICAgICAgIGRpc3Bvc2FibGUuZGlzcG9zYWJsZSA9IGNkO1xuICAgICAgICBpZiAocGFyZW50RGlzcG9zYWJsZSlcbiAgICAgICAgICAgIGNkLmFkZChwYXJlbnREaXNwb3NhYmxlKTtcbiAgICAgICAgdmlldy5jbGFzc0xpc3QuYWRkKFwib21uaXNoYXJwLWF0b20tb3V0cHV0XCIsIGAke2lkfS1vdXRwdXRgLCBcInNlbGVjdGVkXCIpO1xuICAgICAgICBjZC5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcIm9tbmlzaGFycC1hdG9tOmRvY2stc2hvdy1cIiArIGlkLCAoKSA9PiB0aGlzLnNlbGVjdFdpbmRvdyhpZCkpKTtcbiAgICAgICAgY2QuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTpkb2NrLXRvZ2dsZS1cIiArIGlkLCAoKSA9PiB0aGlzLnRvZ2dsZVdpbmRvdyhpZCkpKTtcbiAgICAgICAgaWYgKG9wdGlvbnMuY2xvc2VhYmxlKSB7XG4gICAgICAgICAgICBjZC5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcIm9tbmlzaGFycC1hdG9tOmRvY2stY2xvc2UtXCIgKyBpZCwgKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5yZW1vdmUoZGlzcG9zYWJsZSk7XG4gICAgICAgICAgICAgICAgZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5oaWRlVmlldygpO1xuICAgICAgICAgICAgfSkpO1xuICAgICAgICB9XG4gICAgICAgIGNkLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5zZWxlY3RlZCA9PT0gaWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNlbGVjdGVkID0gXCJvdXRwdXRcIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSkpO1xuICAgICAgICBjZC5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xuICAgICAgICAgICAgdmlldy5yZW1vdmUoKTtcbiAgICAgICAgICAgIHRoaXMuX3BhbmVzLmRlbGV0ZShpZCk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5fYWRkRG9ja0J1dHRvbihjb250ZXh0KTtcbiAgICAgICAgaWYgKCF0aGlzLnNlbGVjdGVkKVxuICAgICAgICAgICAgdGhpcy5zZWxlY3RlZCA9IGlkO1xuICAgICAgICByZXR1cm4gZGlzcG9zYWJsZTtcbiAgICB9XG4gICAgYWRkQnV0dG9uKGlkLCB0aXRsZSwgdmlldywgb3B0aW9ucyA9IHsgcHJpb3JpdHk6IDEwMDAgfSwgcGFyZW50RGlzcG9zYWJsZSkge1xuICAgICAgICBjb25zdCBkaXNwb3NhYmxlID0gbmV3IFNpbmdsZUFzc2lnbm1lbnREaXNwb3NhYmxlKCk7XG4gICAgICAgIGNvbnN0IGNkID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChkaXNwb3NhYmxlKTtcbiAgICAgICAgZGlzcG9zYWJsZS5kaXNwb3NhYmxlID0gY2Q7XG4gICAgICAgIGlmIChwYXJlbnREaXNwb3NhYmxlKVxuICAgICAgICAgICAgY2QuYWRkKHBhcmVudERpc3Bvc2FibGUpO1xuICAgICAgICB0aGlzLl9hZGRUb2dnbGVCdXR0b24oeyBpZCwgdGl0bGUsIHZpZXcsIG9wdGlvbnMsIGRpc3Bvc2FibGU6IGNkIH0pO1xuICAgICAgICByZXR1cm4gZGlzcG9zYWJsZTtcbiAgICB9XG59XG5leHBvcnRzLkRvY2tXaW5kb3cgPSBkb2N1bWVudC5yZWdpc3RlckVsZW1lbnQoXCJvbW5pc2hhcnAtZG9jay13aW5kb3dcIiwgeyBwcm90b3R5cGU6IERvY2tXaW5kb3cucHJvdG90eXBlIH0pO1xuZXhwb3J0IGNsYXNzIFJlc2l6ZXIgZXh0ZW5kcyBIVE1MRGl2RWxlbWVudCB7XG4gICAgY3JlYXRlZENhbGxiYWNrKCkge1xuICAgICAgICB0aGlzLmNsYXNzTGlzdC5hZGQoXCJvbW5pc2hhcnAtYXRvbS1vdXRwdXQtcmVzaXplclwiKTtcbiAgICB9XG4gICAgZGV0YWNoZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICB9XG4gICAgYXR0YWNoZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgY29uc3QgbW91c2Vtb3ZlID0gT2JzZXJ2YWJsZS5mcm9tRXZlbnQoZG9jdW1lbnQuYm9keSwgXCJtb3VzZW1vdmVcIikuc2hhcmUoKTtcbiAgICAgICAgY29uc3QgbW91c2V1cCA9IE9ic2VydmFibGUuZnJvbUV2ZW50KGRvY3VtZW50LmJvZHksIFwibW91c2V1cFwiKS5zaGFyZSgpO1xuICAgICAgICBjb25zdCBtb3VzZWRvd24gPSBPYnNlcnZhYmxlLmZyb21FdmVudCh0aGlzLCBcIm1vdXNlZG93blwiKS5zaGFyZSgpO1xuICAgICAgICBjb25zdCBtb3VzZWRyYWcgPSBtb3VzZWRvd24uZmxhdE1hcCgobWQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHN0YXJ0WCA9IG1kLmNsaWVudFggKyB3aW5kb3cuc2Nyb2xsWCwgc3RhcnRZID0gbWQuY2xpZW50WSArIHdpbmRvdy5zY3JvbGxZO1xuICAgICAgICAgICAgcmV0dXJuIG1vdXNlbW92ZS5tYXAoKG1tKSA9PiB7XG4gICAgICAgICAgICAgICAgbW0ucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBsZWZ0OiAocGFyc2VJbnQobWQudGFyZ2V0LnN0eWxlLmxlZnQsIDEwKSB8fCAwKSArIG1tLmNsaWVudFggLSBzdGFydFgsXG4gICAgICAgICAgICAgICAgICAgIHRvcDogKHBhcnNlSW50KG1kLnRhcmdldC5zdHlsZS50b3AsIDEwKSB8fCAwKSArIG1tLmNsaWVudFkgLSBzdGFydFlcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSkudGFrZVVudGlsKG1vdXNldXApO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChtb3VzZWRvd24uc3Vic2NyaWJlKHggPT4gdGhpcy5zdGFydCgpKSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQobW91c2VkcmFnLnN1YnNjcmliZSgoeCkgPT4gdGhpcy51cGRhdGUoeCksIG51bGwsICgpID0+IHRoaXMuZG9uZSgpKSk7XG4gICAgfVxufVxuZXhwb3J0cy5SZXNpemVyID0gZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50KFwib21uaXNoYXJwLXJlc2l6ZXJcIiwgeyBwcm90b3R5cGU6IFJlc2l6ZXIucHJvdG90eXBlIH0pO1xuIiwiaW1wb3J0IHtPYnNlcnZhYmxlfSBmcm9tIFwicnhqc1wiO1xyXG5pbXBvcnQge0Rpc3Bvc2FibGUsIENvbXBvc2l0ZURpc3Bvc2FibGUsIFNpbmdsZUFzc2lnbm1lbnREaXNwb3NhYmxlLCBJRGlzcG9zYWJsZX0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgVG9nZ2xlQnV0dG9uIHtcclxuICAgIGlkOiBzdHJpbmc7XHJcbiAgICB0aXRsZTogc3RyaW5nO1xyXG4gICAgdmlldzogSFRNTEVsZW1lbnQ7XHJcbiAgICBvcHRpb25zOiBEb2NCdXR0b25PcHRpb25zO1xyXG4gICAgZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBEb2NCdXR0b25PcHRpb25zIHtcclxuICAgIHByaW9yaXR5PzogbnVtYmVyO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgSW50ZXJuYWxUb2dnbGVCdXR0b24gZXh0ZW5kcyBUb2dnbGVCdXR0b24ge1xyXG5cclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBQYW5lQnV0dG9uIHtcclxuICAgIGlkOiBzdHJpbmc7XHJcbiAgICB0aXRsZTogc3RyaW5nO1xyXG4gICAgdmlldzogSFRNTEVsZW1lbnQ7XHJcbiAgICBvcHRpb25zOiBQYW5lQnV0dG9uT3B0aW9ucztcclxuICAgIGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgUGFuZUJ1dHRvbk9wdGlvbnMge1xyXG4gICAgcHJpb3JpdHk/OiBudW1iZXI7XHJcbiAgICBjbG9zZWFibGU/OiBib29sZWFuO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgSW50ZXJuYWxQYW5lQnV0dG9uIGV4dGVuZHMgUGFuZUJ1dHRvbiB7XHJcbiAgICBfYnV0dG9uPzogRWxlbWVudDtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIERvY2tXaW5kb3cgZXh0ZW5kcyBIVE1MRGl2RWxlbWVudCBpbXBsZW1lbnRzIFdlYkNvbXBvbmVudCB7XHJcbiAgICBwcml2YXRlIGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XHJcbiAgICBwcml2YXRlIF9wYW5lbDogQXRvbS5QYW5lbDtcclxuICAgIHByaXZhdGUgX3NlbGVjdGVkUGFuZTogSW50ZXJuYWxQYW5lQnV0dG9uO1xyXG4gICAgcHJpdmF0ZSBfdG9vbGJhcjogSFRNTERpdkVsZW1lbnQ7XHJcbiAgICBwcml2YXRlIF9wYW5lQnV0dG9uczogSFRNTERpdkVsZW1lbnQ7XHJcbiAgICBwcml2YXRlIF90b2dnbGVCdXR0b25zOiBIVE1MRGl2RWxlbWVudDtcclxuICAgIHByaXZhdGUgX3BhbmVzOiBNYXA8c3RyaW5nLCBJbnRlcm5hbFBhbmVCdXR0b24+O1xyXG4gICAgcHJpdmF0ZSB2aXNpYmxlOiBib29sZWFuO1xyXG4gICAgcHJpdmF0ZSB0ZW1wSGVpZ2h0OiBudW1iZXI7XHJcbiAgICBwcml2YXRlIGZvbnRTaXplOiBhbnk7XHJcblxyXG4gICAgcHVibGljIGdldCBpc09wZW4oKSB7IHJldHVybiB0aGlzLnZpc2libGU7IH1cclxuICAgIC8vYXRvbS5jb25maWcuZ2V0PG51bWJlcj4oXCJlZGl0b3IuZm9udFNpemVcIilcclxuXHJcbiAgICBwcml2YXRlIF9zZWxlY3RlZDogc3RyaW5nO1xyXG4gICAgcHVibGljIGdldCBzZWxlY3RlZCgpIHsgcmV0dXJuIHRoaXMuX3NlbGVjdGVkOyB9XHJcbiAgICBwdWJsaWMgc2V0IHNlbGVjdGVkKHZhbHVlKSB7XHJcbiAgICAgICAgY29uc3QgcGFuZSA9IHRoaXMuX3BhbmVzLmdldCh2YWx1ZSk7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9zZWxlY3RlZFBhbmUpIHtcclxuICAgICAgICAgICAgdGhpcy5fc2VsZWN0ZWRQYW5lLl9idXR0b24uY2xhc3NMaXN0LnJlbW92ZShcInNlbGVjdGVkXCIpO1xyXG4gICAgICAgICAgICB0aGlzLl9zZWxlY3RlZFBhbmUudmlldy5yZW1vdmUoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChwYW5lKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3NlbGVjdGVkUGFuZSA9IHBhbmU7XHJcbiAgICAgICAgICAgIHBhbmUuX2J1dHRvbi5jbGFzc0xpc3QuYWRkKFwic2VsZWN0ZWRcIik7XHJcbiAgICAgICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQocGFuZS52aWV3KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuX3NlbGVjdGVkID0gdmFsdWU7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNyZWF0ZWRDYWxsYmFjaygpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG4gICAgICAgIHRoaXMuX3BhbmVzID0gbmV3IE1hcDxzdHJpbmcsIEludGVybmFsUGFuZUJ1dHRvbj4oKTtcclxuICAgICAgICB0aGlzLl9zZWxlY3RlZCA9IFwib3V0cHV0XCI7XHJcbiAgICAgICAgdGhpcy52aXNpYmxlID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy50ZW1wSGVpZ2h0ID0gMDtcclxuICAgICAgICB0aGlzLmZvbnRTaXplID0gYXRvbS5jb25maWcuZ2V0PG51bWJlcj4oXCJlZGl0b3IuZm9udFNpemVcIik7XHJcblxyXG4gICAgICAgIGxldCBmb250U2l6ZSA9IHRoaXMuZm9udFNpemUgLSAxO1xyXG4gICAgICAgIGlmIChmb250U2l6ZSA8PSAwKVxyXG4gICAgICAgICAgICBmb250U2l6ZSA9IDE7XHJcblxyXG4gICAgICAgIHRoaXMuY2xhc3NMaXN0LmFkZChcImluc2V0LXBhbmVsXCIsIFwiZm9udC1zaXplLVwiICsgZm9udFNpemUpO1xyXG4gICAgICAgIGlmICh0aGlzLmNsaWVudEhlaWdodCB8fCB0aGlzLnRlbXBIZWlnaHQpIHtcclxuICAgICAgICAgICAgdGhpcy5zdHlsZS5oZWlnaHQgPSB0aGlzLmNsaWVudEhlaWdodCArIHRoaXMudGVtcEhlaWdodCArIFwicHhcIjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHJlc2l6ZXIgPSBuZXcgZXhwb3J0cy5SZXNpemVyKCk7XHJcbiAgICAgICAgbGV0IF9vcmlnaW5hbEhlaWdodCA9IHRoaXMuY2xpZW50SGVpZ2h0O1xyXG4gICAgICAgIHJlc2l6ZXIuc3RhcnQgPSAoKSA9PiB7IF9vcmlnaW5hbEhlaWdodCA9IHRoaXMuY2xpZW50SGVpZ2h0OyB9O1xyXG4gICAgICAgIHJlc2l6ZXIudXBkYXRlID0gKHt0b3B9OiB7IGxlZnQ6IG51bWJlciwgdG9wOiBudW1iZXIgfSkgPT4ge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyh0b3ApO1xyXG4gICAgICAgICAgICB0aGlzLnN0eWxlLmhlaWdodCA9IGAke19vcmlnaW5hbEhlaWdodCArIC0odG9wKX1weGA7XHJcbiAgICAgICAgfTtcclxuICAgICAgICByZXNpemVyLmRvbmUgPSAoKSA9PiB7IC8qICovIH07XHJcbiAgICAgICAgdGhpcy5hcHBlbmRDaGlsZChyZXNpemVyKTtcclxuXHJcbiAgICAgICAgY29uc3Qgd2luZG93cyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgICAgICAgd2luZG93cy5jbGFzc0xpc3QuYWRkKFwicGFuZWwtaGVhZGluZ1wiLCBcImNsZWFyZml4XCIpO1xyXG4gICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQod2luZG93cyk7XHJcblxyXG4gICAgICAgIHRoaXMuX3Rvb2xiYXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gICAgICAgIHRoaXMuX3Rvb2xiYXIuY2xhc3NMaXN0LmFkZChcImJ0bi10b29sYmFyXCIsIFwicHVsbC1sZWZ0XCIpO1xyXG4gICAgICAgIHdpbmRvd3MuYXBwZW5kQ2hpbGQodGhpcy5fdG9vbGJhcik7XHJcblxyXG4gICAgICAgIHRoaXMuX3BhbmVCdXR0b25zID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuICAgICAgICB0aGlzLl9wYW5lQnV0dG9ucy5jbGFzc0xpc3QuYWRkKFwiYnRuLWdyb3VwXCIsIFwiYnRuLXRvZ2dsZVwiKTtcclxuICAgICAgICB0aGlzLl90b29sYmFyLmFwcGVuZENoaWxkKHRoaXMuX3BhbmVCdXR0b25zKTtcclxuXHJcbiAgICAgICAgdGhpcy5fdG9nZ2xlQnV0dG9ucyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgICAgICAgdGhpcy5fdG9nZ2xlQnV0dG9ucy5jbGFzc0xpc3QuYWRkKFwiYnRuLXdlbGxcIiwgXCJwdWxsLXJpZ2h0XCIsIFwiYnRuLWdyb3VwXCIpO1xyXG4gICAgICAgIHdpbmRvd3MuYXBwZW5kQ2hpbGQodGhpcy5fdG9nZ2xlQnV0dG9ucyk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGF0dGFjaGVkQ2FsbGJhY2soKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbmZpZy5vYnNlcnZlKFwiZWRpdG9yLmZvbnRTaXplXCIsIChzaXplOiBudW1iZXIpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5jbGFzc05hbWUgPSB0aGlzLmNsYXNzTmFtZS5yZXBsYWNlKC9mb250LXNpemUtW1xcZF0qL2csIFwiXCIpO1xyXG4gICAgICAgICAgICB0aGlzLmZvbnRTaXplID0gc2l6ZTtcclxuICAgICAgICAgICAgdGhpcy5jbGFzc0xpc3QuYWRkKFwiZm9udC1zaXplLVwiICsgc2l6ZSk7XHJcbiAgICAgICAgfSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzZXRQYW5lbChwYW5lbDogQXRvbS5QYW5lbCkge1xyXG4gICAgICAgIHRoaXMuX3BhbmVsID0gcGFuZWw7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfYWRkRG9ja0J1dHRvbihidXR0b246IEludGVybmFsUGFuZUJ1dHRvbikge1xyXG4gICAgICAgIGNvbnN0IHtpZCwgdGl0bGUsIG9wdGlvbnMsIGRpc3Bvc2FibGV9ID0gYnV0dG9uO1xyXG5cclxuICAgICAgICBjb25zdCB2aWV3ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImJ1dHRvblwiKTtcclxuICAgICAgICB2aWV3LmNsYXNzTGlzdC5hZGQoXCJidG5cIiwgXCJidG4tZGVmYXVsdFwiLCBcImJ0bi1maXhcIik7XHJcbiAgICAgICAgKHZpZXcgYXMgYW55KS5faWQgPSBpZDtcclxuICAgICAgICAodmlldyBhcyBhbnkpLl9wcmlvcml0eSA9IG9wdGlvbnMucHJpb3JpdHk7XHJcblxyXG4gICAgICAgIGRpc3Bvc2FibGUuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcclxuICAgICAgICAgICAgaWYgKHZpZXcuY2xhc3NMaXN0LmNvbnRhaW5zKFwic2VsZWN0ZWRcIikpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWQgPSAodmlldy5wcmV2aW91c0VsZW1lbnRTaWJsaW5nIGFzIGFueSkuX2lkO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHZpZXcucmVtb3ZlKCk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICBjb25zdCB0ZXh0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XHJcbiAgICAgICAgdGV4dC5pbm5lckhUTUwgPSB0aXRsZTtcclxuICAgICAgICB0ZXh0LmNsYXNzTGlzdC5hZGQoXCJ0ZXh0XCIpO1xyXG4gICAgICAgIHZpZXcuYXBwZW5kQ2hpbGQodGV4dCk7XHJcblxyXG4gICAgICAgIGlmIChvcHRpb25zLmNsb3NlYWJsZSkge1xyXG4gICAgICAgICAgICB2aWV3LmNsYXNzTGlzdC5hZGQoXCJjbG9zZWFibGVcIik7XHJcblxyXG4gICAgICAgICAgICBjb25zdCBjbG9zZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xyXG4gICAgICAgICAgICBjbG9zZS5jbGFzc0xpc3QuYWRkKFwiZmFcIiwgXCJmYS10aW1lcy1jaXJjbGVcIiwgXCJjbG9zZS1wYW5lXCIpO1xyXG4gICAgICAgICAgICBjbG9zZS5vbmNsaWNrID0gKGUpID0+IHtcclxuICAgICAgICAgICAgICAgIGRpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICB2aWV3LmFwcGVuZENoaWxkKGNsb3NlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZpZXcub25jbGljayA9IChlKSA9PiB7XHJcbiAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgICAgdGhpcy5zZWxlY3RlZCA9IGlkO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGJ1dHRvbi5fYnV0dG9uID0gdmlldztcclxuXHJcbiAgICAgICAgdGhpcy5faW5zZXJ0QnV0dG9uKHRoaXMuX3BhbmVCdXR0b25zLCB2aWV3LCBvcHRpb25zLnByaW9yaXR5LCBpZCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfYWRkVG9nZ2xlQnV0dG9uKHtpZCwgb3B0aW9ucywgdmlldywgZGlzcG9zYWJsZX06IFRvZ2dsZUJ1dHRvbikge1xyXG4gICAgICAgIGRpc3Bvc2FibGUuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcclxuICAgICAgICAgICAgdmlldy5yZW1vdmUoKTtcclxuICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLnJlbW92ZShkaXNwb3NhYmxlKTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuX2luc2VydEJ1dHRvbih0aGlzLl90b2dnbGVCdXR0b25zLCB2aWV3LCBvcHRpb25zLnByaW9yaXR5LCBpZCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfaW5zZXJ0QnV0dG9uKHBhcmVudDogRWxlbWVudCwgZWxlbWVudDogRWxlbWVudCwgcHJpb3JpdHk6IG51bWJlciwgaWQ6IHN0cmluZykge1xyXG4gICAgICAgIGxldCBpbnNlcnRJbmRleCA9IC0xO1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGFyZW50LmNoaWxkTm9kZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgY29uc3QgY2hpbGQgPSA8YW55PnBhcmVudC5jaGlsZE5vZGVzW2ldO1xyXG4gICAgICAgICAgICBpZiAoY2hpbGQuX2lkIDw9IGlkICYmIGNoaWxkLl9wcmlvcml0eSA8PSBwcmlvcml0eSkge1xyXG4gICAgICAgICAgICAgICAgaW5zZXJ0SW5kZXggPSBpICsgMTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaW5zZXJ0SW5kZXggPiAtMSAmJiBpbnNlcnRJbmRleCA8IHBhcmVudC5jaGlsZE5vZGVzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICBwYXJlbnQuaW5zZXJ0QmVmb3JlKGVsZW1lbnQsIHBhcmVudC5jaGlsZE5vZGVzW2luc2VydEluZGV4XSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcGFyZW50LmFwcGVuZENoaWxkKGVsZW1lbnQpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHVwZGF0ZUF0b20oY2I/OiAoKSA9PiB2b2lkKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuX3BhbmVsLnZpc2libGUgIT09IHRoaXMudmlzaWJsZSkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy52aXNpYmxlKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9wYW5lbC5zaG93KCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9wYW5lbC5oaWRlKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGNiKSBjYigpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzaG93VmlldygpIHtcclxuICAgICAgICB0aGlzLnZpc2libGUgPSB0cnVlO1xyXG4gICAgICAgIHRoaXMudXBkYXRlQXRvbSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkb1Nob3dWaWV3KCkge1xyXG4gICAgICAgIHRoaXMudmlzaWJsZSA9IHRydWU7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGhpZGVWaWV3KCkge1xyXG4gICAgICAgIHRoaXMuZG9IaWRlVmlldygpO1xyXG4gICAgICAgIHRoaXMudXBkYXRlQXRvbSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZG9IaWRlVmlldygpIHtcclxuICAgICAgICB0aGlzLnZpc2libGUgPSBmYWxzZTtcclxuICAgICAgICBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVQYW5lKCkuYWN0aXZhdGUoKTtcclxuICAgICAgICBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVQYW5lKCkuYWN0aXZhdGVJdGVtKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHRvZ2dsZVZpZXcoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMudmlzaWJsZSkge1xyXG4gICAgICAgICAgICB0aGlzLmRvSGlkZVZpZXcoKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLmRvU2hvd1ZpZXcoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy51cGRhdGVBdG9tKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHRvZ2dsZVdpbmRvdyhzZWxlY3RlZDogc3RyaW5nKSB7XHJcbiAgICAgICAgaWYgKHRoaXMudmlzaWJsZSAmJiB0aGlzLnNlbGVjdGVkID09PSBzZWxlY3RlZCkge1xyXG4gICAgICAgICAgICB0aGlzLmhpZGVWaWV3KCk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuc2VsZWN0V2luZG93KHNlbGVjdGVkKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2VsZWN0V2luZG93KHNlbGVjdGVkOiBzdHJpbmcpIHtcclxuICAgICAgICBpZiAoIXRoaXMudmlzaWJsZSlcclxuICAgICAgICAgICAgdGhpcy5kb1Nob3dWaWV3KCk7XHJcblxyXG4gICAgICAgIHRoaXMuc2VsZWN0ZWQgPSBzZWxlY3RlZDtcclxuXHJcbiAgICAgICAgLy8gRm9jdXMgdGhlIHBhbmVsIVxyXG4gICAgICAgIHRoaXMudXBkYXRlQXRvbSgoKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IHBhbmVsOiBhbnkgPSB0aGlzLnF1ZXJ5U2VsZWN0b3IoXCIub21uaXNoYXJwLWF0b20tb3V0cHV0LnNlbGVjdGVkXCIpO1xyXG4gICAgICAgICAgICBpZiAocGFuZWwpIHBhbmVsLmZvY3VzKCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGFkZFdpbmRvdyhpZDogc3RyaW5nLCB0aXRsZTogc3RyaW5nLCB2aWV3OiBIVE1MRWxlbWVudCwgb3B0aW9uczogUGFuZUJ1dHRvbk9wdGlvbnMgPSB7IHByaW9yaXR5OiAxMDAwIH0sIHBhcmVudERpc3Bvc2FibGU/OiBEaXNwb3NhYmxlKSB7XHJcbiAgICAgICAgY29uc3QgZGlzcG9zYWJsZSA9IG5ldyBTaW5nbGVBc3NpZ25tZW50RGlzcG9zYWJsZSgpO1xyXG4gICAgICAgIGNvbnN0IGNkID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgICAgICBjb25zdCBjb250ZXh0ID0geyBpZCwgdGl0bGUsIHZpZXcsIG9wdGlvbnMsIGRpc3Bvc2FibGU6IGNkIH07XHJcblxyXG4gICAgICAgIHRoaXMuX3BhbmVzLnNldChpZCwgY29udGV4dCk7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChkaXNwb3NhYmxlKTtcclxuICAgICAgICBkaXNwb3NhYmxlLmRpc3Bvc2FibGUgPSBjZDtcclxuXHJcbiAgICAgICAgaWYgKHBhcmVudERpc3Bvc2FibGUpXHJcbiAgICAgICAgICAgIGNkLmFkZChwYXJlbnREaXNwb3NhYmxlKTtcclxuXHJcbiAgICAgICAgdmlldy5jbGFzc0xpc3QuYWRkKFwib21uaXNoYXJwLWF0b20tb3V0cHV0XCIsIGAke2lkfS1vdXRwdXRgLCBcInNlbGVjdGVkXCIpO1xyXG5cclxuICAgICAgICBjZC5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcIm9tbmlzaGFycC1hdG9tOmRvY2stc2hvdy1cIiArIGlkLCAoKSA9PiB0aGlzLnNlbGVjdFdpbmRvdyhpZCkpKTtcclxuICAgICAgICBjZC5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcIm9tbmlzaGFycC1hdG9tOmRvY2stdG9nZ2xlLVwiICsgaWQsICgpID0+IHRoaXMudG9nZ2xlV2luZG93KGlkKSkpO1xyXG5cclxuICAgICAgICBpZiAob3B0aW9ucy5jbG9zZWFibGUpIHtcclxuICAgICAgICAgICAgY2QuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTpkb2NrLWNsb3NlLVwiICsgaWQsICgpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5yZW1vdmUoZGlzcG9zYWJsZSk7XHJcbiAgICAgICAgICAgICAgICBkaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuaGlkZVZpZXcoKTtcclxuICAgICAgICAgICAgfSkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY2QuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuc2VsZWN0ZWQgPT09IGlkKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNlbGVjdGVkID0gXCJvdXRwdXRcIjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgY2QuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcclxuICAgICAgICAgICAgdmlldy5yZW1vdmUoKTtcclxuICAgICAgICAgICAgdGhpcy5fcGFuZXMuZGVsZXRlKGlkKTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuX2FkZERvY2tCdXR0b24oY29udGV4dCk7XHJcblxyXG4gICAgICAgIGlmICghdGhpcy5zZWxlY3RlZCkgdGhpcy5zZWxlY3RlZCA9IGlkO1xyXG5cclxuICAgICAgICByZXR1cm4gPElEaXNwb3NhYmxlPmRpc3Bvc2FibGU7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGFkZEJ1dHRvbihpZDogc3RyaW5nLCB0aXRsZTogc3RyaW5nLCB2aWV3OiBIVE1MRWxlbWVudCwgb3B0aW9uczogRG9jQnV0dG9uT3B0aW9ucyA9IHsgcHJpb3JpdHk6IDEwMDAgfSwgcGFyZW50RGlzcG9zYWJsZT86IERpc3Bvc2FibGUpIHtcclxuICAgICAgICBjb25zdCBkaXNwb3NhYmxlID0gbmV3IFNpbmdsZUFzc2lnbm1lbnREaXNwb3NhYmxlKCk7XHJcbiAgICAgICAgY29uc3QgY2QgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoZGlzcG9zYWJsZSk7XHJcbiAgICAgICAgZGlzcG9zYWJsZS5kaXNwb3NhYmxlID0gY2Q7XHJcblxyXG4gICAgICAgIGlmIChwYXJlbnREaXNwb3NhYmxlKVxyXG4gICAgICAgICAgICBjZC5hZGQocGFyZW50RGlzcG9zYWJsZSk7XHJcblxyXG4gICAgICAgIHRoaXMuX2FkZFRvZ2dsZUJ1dHRvbih7IGlkLCB0aXRsZSwgdmlldywgb3B0aW9ucywgZGlzcG9zYWJsZTogY2QgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiA8SURpc3Bvc2FibGU+ZGlzcG9zYWJsZTtcclxuICAgIH1cclxufVxyXG5cclxuKDxhbnk+ZXhwb3J0cykuRG9ja1dpbmRvdyA9ICg8YW55PmRvY3VtZW50KS5yZWdpc3RlckVsZW1lbnQoXCJvbW5pc2hhcnAtZG9jay13aW5kb3dcIiwgeyBwcm90b3R5cGU6IERvY2tXaW5kb3cucHJvdG90eXBlIH0pO1xyXG5cclxuZXhwb3J0IGNsYXNzIFJlc2l6ZXIgZXh0ZW5kcyBIVE1MRGl2RWxlbWVudCBpbXBsZW1lbnRzIFdlYkNvbXBvbmVudCB7XHJcbiAgICBwcml2YXRlIGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XHJcbiAgICBwdWJsaWMgdXBkYXRlOiAobG9jYXRpb246IHsgbGVmdDogbnVtYmVyOyB0b3A6IG51bWJlciB9KSA9PiB2b2lkO1xyXG4gICAgcHVibGljIGRvbmU6ICgpID0+IHZvaWQ7XHJcbiAgICBwdWJsaWMgc3RhcnQ6ICgpID0+IHZvaWQ7XHJcblxyXG4gICAgcHVibGljIGNyZWF0ZWRDYWxsYmFjaygpIHtcclxuICAgICAgICB0aGlzLmNsYXNzTGlzdC5hZGQoXCJvbW5pc2hhcnAtYXRvbS1vdXRwdXQtcmVzaXplclwiKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGV0YWNoZWRDYWxsYmFjaygpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBhdHRhY2hlZENhbGxiYWNrKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcbiAgICAgICAgY29uc3QgbW91c2Vtb3ZlID0gT2JzZXJ2YWJsZS5mcm9tRXZlbnQ8TW91c2VFdmVudD4oZG9jdW1lbnQuYm9keSwgXCJtb3VzZW1vdmVcIikuc2hhcmUoKTtcclxuICAgICAgICBjb25zdCBtb3VzZXVwID0gT2JzZXJ2YWJsZS5mcm9tRXZlbnQ8TW91c2VFdmVudD4oZG9jdW1lbnQuYm9keSwgXCJtb3VzZXVwXCIpLnNoYXJlKCk7XHJcbiAgICAgICAgY29uc3QgbW91c2Vkb3duID0gT2JzZXJ2YWJsZS5mcm9tRXZlbnQ8TW91c2VFdmVudD4odGhpcywgXCJtb3VzZWRvd25cIikuc2hhcmUoKTtcclxuXHJcbiAgICAgICAgY29uc3QgbW91c2VkcmFnID0gbW91c2Vkb3duLmZsYXRNYXAoKG1kKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IHN0YXJ0WCA9IG1kLmNsaWVudFggKyB3aW5kb3cuc2Nyb2xsWCxcclxuICAgICAgICAgICAgICAgIHN0YXJ0WSA9IG1kLmNsaWVudFkgKyB3aW5kb3cuc2Nyb2xsWTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBtb3VzZW1vdmUubWFwKChtbSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgbW0ucHJldmVudERlZmF1bHQoKTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGxlZnQ6IChwYXJzZUludCgoPGFueT5tZC50YXJnZXQpLnN0eWxlLmxlZnQsIDEwKSB8fCAwKSArIG1tLmNsaWVudFggLSBzdGFydFgsXHJcbiAgICAgICAgICAgICAgICAgICAgdG9wOiAocGFyc2VJbnQoKDxhbnk+bWQudGFyZ2V0KS5zdHlsZS50b3AsIDEwKSB8fCAwKSArIG1tLmNsaWVudFkgLSBzdGFydFlcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIH0pLnRha2VVbnRpbChtb3VzZXVwKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChtb3VzZWRvd24uc3Vic2NyaWJlKHggPT4gdGhpcy5zdGFydCgpKSk7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChtb3VzZWRyYWcuc3Vic2NyaWJlKCh4KSA9PiB0aGlzLnVwZGF0ZSh4KSwgbnVsbCwgKCkgPT4gdGhpcy5kb25lKCkpKTtcclxuICAgIH1cclxufVxyXG5cclxuKDxhbnk+ZXhwb3J0cykuUmVzaXplciA9ICg8YW55PmRvY3VtZW50KS5yZWdpc3RlckVsZW1lbnQoXCJvbW5pc2hhcnAtcmVzaXplclwiLCB7IHByb3RvdHlwZTogUmVzaXplci5wcm90b3R5cGUgfSk7XHJcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
