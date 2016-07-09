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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy9kb2NrLXdpbmRvdy5qcyIsImxpYi92aWV3cy9kb2NrLXdpbmRvdy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7QUFDQTs7Ozs7Ozs7SUNtQ0EsVSxXQUFBLFU7Ozs7Ozs7Ozs7OzBDQWtDMEI7QUFBQTs7QUFDbEIsaUJBQUssVUFBTCxHQUFrQiwwQ0FBbEI7QUFDQSxpQkFBSyxNQUFMLEdBQWMsSUFBSSxHQUFKLEVBQWQ7QUFDQSxpQkFBSyxTQUFMLEdBQWlCLFFBQWpCO0FBQ0EsaUJBQUssT0FBTCxHQUFlLEtBQWY7QUFDQSxpQkFBSyxVQUFMLEdBQWtCLENBQWxCO0FBQ0EsaUJBQUssUUFBTCxHQUFnQixLQUFLLE1BQUwsQ0FBWSxHQUFaLENBQXdCLGlCQUF4QixDQUFoQjtBQUVBLGdCQUFJLFdBQVcsS0FBSyxRQUFMLEdBQWdCLENBQS9CO0FBQ0EsZ0JBQUksWUFBWSxDQUFoQixFQUNJLFdBQVcsQ0FBWDtBQUVKLGlCQUFLLFNBQUwsQ0FBZSxHQUFmLENBQW1CLGFBQW5CLEVBQWtDLGVBQWUsUUFBakQ7QUFDQSxnQkFBSSxLQUFLLFlBQUwsSUFBcUIsS0FBSyxVQUE5QixFQUEwQztBQUN0QyxxQkFBSyxLQUFMLENBQVcsTUFBWCxHQUFvQixLQUFLLFlBQUwsR0FBb0IsS0FBSyxVQUF6QixHQUFzQyxJQUExRDtBQUNIO0FBRUQsZ0JBQU0sVUFBVSxJQUFJLFFBQVEsT0FBWixFQUFoQjtBQUNBLGdCQUFJLGtCQUFrQixLQUFLLFlBQTNCO0FBQ0Esb0JBQVEsS0FBUixHQUFnQixZQUFBO0FBQVEsa0NBQWtCLE9BQUssWUFBdkI7QUFBc0MsYUFBOUQ7QUFDQSxvQkFBUSxNQUFSLEdBQWlCLGdCQUFxQztBQUFBLG9CQUFuQyxHQUFtQyxRQUFuQyxHQUFtQzs7QUFDbEQsd0JBQVEsR0FBUixDQUFZLEdBQVo7QUFDQSx1QkFBSyxLQUFMLENBQVcsTUFBWCxHQUF1QixrQkFBa0IsQ0FBRSxHQUEzQztBQUNILGFBSEQ7QUFJQSxvQkFBUSxJQUFSLEdBQWUsWUFBQSxDQUFlLENBQTlCO0FBQ0EsaUJBQUssV0FBTCxDQUFpQixPQUFqQjtBQUVBLGdCQUFNLFVBQVUsU0FBUyxhQUFULENBQXVCLEtBQXZCLENBQWhCO0FBQ0Esb0JBQVEsU0FBUixDQUFrQixHQUFsQixDQUFzQixlQUF0QixFQUF1QyxVQUF2QztBQUNBLGlCQUFLLFdBQUwsQ0FBaUIsT0FBakI7QUFFQSxpQkFBSyxRQUFMLEdBQWdCLFNBQVMsYUFBVCxDQUF1QixLQUF2QixDQUFoQjtBQUNBLGlCQUFLLFFBQUwsQ0FBYyxTQUFkLENBQXdCLEdBQXhCLENBQTRCLGFBQTVCLEVBQTJDLFdBQTNDO0FBQ0Esb0JBQVEsV0FBUixDQUFvQixLQUFLLFFBQXpCO0FBRUEsaUJBQUssWUFBTCxHQUFvQixTQUFTLGFBQVQsQ0FBdUIsS0FBdkIsQ0FBcEI7QUFDQSxpQkFBSyxZQUFMLENBQWtCLFNBQWxCLENBQTRCLEdBQTVCLENBQWdDLFdBQWhDLEVBQTZDLFlBQTdDO0FBQ0EsaUJBQUssUUFBTCxDQUFjLFdBQWQsQ0FBMEIsS0FBSyxZQUEvQjtBQUVBLGlCQUFLLGNBQUwsR0FBc0IsU0FBUyxhQUFULENBQXVCLEtBQXZCLENBQXRCO0FBQ0EsaUJBQUssY0FBTCxDQUFvQixTQUFwQixDQUE4QixHQUE5QixDQUFrQyxVQUFsQyxFQUE4QyxZQUE5QyxFQUE0RCxXQUE1RDtBQUNBLG9CQUFRLFdBQVIsQ0FBb0IsS0FBSyxjQUF6QjtBQUNIOzs7MkNBRXNCO0FBQUE7O0FBQ25CLGlCQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsS0FBSyxNQUFMLENBQVksT0FBWixDQUFvQixpQkFBcEIsRUFBdUMsVUFBQyxJQUFELEVBQWE7QUFDcEUsdUJBQUssU0FBTCxHQUFpQixPQUFLLFNBQUwsQ0FBZSxPQUFmLENBQXVCLGtCQUF2QixFQUEyQyxFQUEzQyxDQUFqQjtBQUNBLHVCQUFLLFFBQUwsR0FBZ0IsSUFBaEI7QUFDQSx1QkFBSyxTQUFMLENBQWUsR0FBZixDQUFtQixlQUFlLElBQWxDO0FBQ0gsYUFKbUIsQ0FBcEI7QUFLSDs7O2lDQUVlLEssRUFBaUI7QUFDN0IsaUJBQUssTUFBTCxHQUFjLEtBQWQ7QUFDSDs7O3VDQUVzQixNLEVBQTBCO0FBQUE7O0FBQUEsZ0JBQ3RDLEVBRHNDLEdBQ0osTUFESSxDQUN0QyxFQURzQztBQUFBLGdCQUNsQyxLQURrQyxHQUNKLE1BREksQ0FDbEMsS0FEa0M7QUFBQSxnQkFDM0IsT0FEMkIsR0FDSixNQURJLENBQzNCLE9BRDJCO0FBQUEsZ0JBQ2xCLFVBRGtCLEdBQ0osTUFESSxDQUNsQixVQURrQjs7QUFHN0MsZ0JBQU0sT0FBTyxTQUFTLGFBQVQsQ0FBdUIsUUFBdkIsQ0FBYjtBQUNBLGlCQUFLLFNBQUwsQ0FBZSxHQUFmLENBQW1CLEtBQW5CLEVBQTBCLGFBQTFCLEVBQXlDLFNBQXpDO0FBQ0MsaUJBQWEsR0FBYixHQUFtQixFQUFuQjtBQUNBLGlCQUFhLFNBQWIsR0FBeUIsUUFBUSxRQUFqQztBQUVELHVCQUFXLEdBQVgsQ0FBZSw0QkFBVyxNQUFYLENBQWtCLFlBQUE7QUFDN0Isb0JBQUksS0FBSyxTQUFMLENBQWUsUUFBZixDQUF3QixVQUF4QixDQUFKLEVBQXlDO0FBQ3JDLDJCQUFLLFFBQUwsR0FBaUIsS0FBSyxzQkFBTCxDQUFvQyxHQUFyRDtBQUNIO0FBQ0QscUJBQUssTUFBTDtBQUNILGFBTGMsQ0FBZjtBQU9BLGdCQUFNLE9BQU8sU0FBUyxhQUFULENBQXVCLE1BQXZCLENBQWI7QUFDQSxpQkFBSyxTQUFMLEdBQWlCLEtBQWpCO0FBQ0EsaUJBQUssU0FBTCxDQUFlLEdBQWYsQ0FBbUIsTUFBbkI7QUFDQSxpQkFBSyxXQUFMLENBQWlCLElBQWpCO0FBRUEsZ0JBQUksUUFBUSxTQUFaLEVBQXVCO0FBQ25CLHFCQUFLLFNBQUwsQ0FBZSxHQUFmLENBQW1CLFdBQW5CO0FBRUEsb0JBQU0sUUFBUSxTQUFTLGFBQVQsQ0FBdUIsTUFBdkIsQ0FBZDtBQUNBLHNCQUFNLFNBQU4sQ0FBZ0IsR0FBaEIsQ0FBb0IsSUFBcEIsRUFBMEIsaUJBQTFCLEVBQTZDLFlBQTdDO0FBQ0Esc0JBQU0sT0FBTixHQUFnQixVQUFDLENBQUQsRUFBRTtBQUNkLCtCQUFXLE9BQVg7QUFDSCxpQkFGRDtBQUdBLHFCQUFLLFdBQUwsQ0FBaUIsS0FBakI7QUFDSDtBQUVELGlCQUFLLE9BQUwsR0FBZSxVQUFDLENBQUQsRUFBRTtBQUNiLGtCQUFFLGVBQUY7QUFDQSxrQkFBRSxjQUFGO0FBQ0EsdUJBQUssUUFBTCxHQUFnQixFQUFoQjtBQUNILGFBSkQ7QUFNQSxtQkFBTyxPQUFQLEdBQWlCLElBQWpCO0FBRUEsaUJBQUssYUFBTCxDQUFtQixLQUFLLFlBQXhCLEVBQXNDLElBQXRDLEVBQTRDLFFBQVEsUUFBcEQsRUFBOEQsRUFBOUQ7QUFDSDs7O2dEQUVxRTtBQUFBOztBQUFBLGdCQUE1QyxFQUE0QyxTQUE1QyxFQUE0QztBQUFBLGdCQUF4QyxPQUF3QyxTQUF4QyxPQUF3QztBQUFBLGdCQUEvQixJQUErQixTQUEvQixJQUErQjtBQUFBLGdCQUF6QixVQUF5QixTQUF6QixVQUF5Qjs7QUFDbEUsdUJBQVcsR0FBWCxDQUFlLDRCQUFXLE1BQVgsQ0FBa0IsWUFBQTtBQUM3QixxQkFBSyxNQUFMO0FBQ0EsdUJBQUssVUFBTCxDQUFnQixNQUFoQixDQUF1QixVQUF2QjtBQUNILGFBSGMsQ0FBZjtBQUtBLGlCQUFLLGFBQUwsQ0FBbUIsS0FBSyxjQUF4QixFQUF3QyxJQUF4QyxFQUE4QyxRQUFRLFFBQXRELEVBQWdFLEVBQWhFO0FBQ0g7OztzQ0FFcUIsTSxFQUFpQixPLEVBQWtCLFEsRUFBa0IsRSxFQUFVO0FBQ2pGLGdCQUFJLGNBQWMsQ0FBQyxDQUFuQjtBQUNBLGlCQUFLLElBQUksSUFBSSxDQUFiLEVBQWdCLElBQUksT0FBTyxVQUFQLENBQWtCLE1BQXRDLEVBQThDLEdBQTlDLEVBQW1EO0FBQy9DLG9CQUFNLFFBQWEsT0FBTyxVQUFQLENBQWtCLENBQWxCLENBQW5CO0FBQ0Esb0JBQUksTUFBTSxHQUFOLElBQWEsRUFBYixJQUFtQixNQUFNLFNBQU4sSUFBbUIsUUFBMUMsRUFBb0Q7QUFDaEQsa0NBQWMsSUFBSSxDQUFsQjtBQUNBO0FBQ0g7QUFDSjtBQUVELGdCQUFJLGNBQWMsQ0FBQyxDQUFmLElBQW9CLGNBQWMsT0FBTyxVQUFQLENBQWtCLE1BQXhELEVBQWdFO0FBQzVELHVCQUFPLFlBQVAsQ0FBb0IsT0FBcEIsRUFBNkIsT0FBTyxVQUFQLENBQWtCLFdBQWxCLENBQTdCO0FBQ0gsYUFGRCxNQUVPO0FBQ0gsdUJBQU8sV0FBUCxDQUFtQixPQUFuQjtBQUNIO0FBQ0o7OzttQ0FFa0IsRSxFQUFlO0FBQzlCLGdCQUFJLEtBQUssTUFBTCxDQUFZLE9BQVosS0FBd0IsS0FBSyxPQUFqQyxFQUEwQztBQUN0QyxvQkFBSSxLQUFLLE9BQVQsRUFBa0I7QUFDZCx5QkFBSyxNQUFMLENBQVksSUFBWjtBQUNILGlCQUZELE1BRU87QUFDSCx5QkFBSyxNQUFMLENBQVksSUFBWjtBQUNIO0FBQ0o7QUFDRCxnQkFBSSxFQUFKLEVBQVE7QUFDWDs7O21DQUVjO0FBQ1gsaUJBQUssT0FBTCxHQUFlLElBQWY7QUFDQSxpQkFBSyxVQUFMO0FBQ0g7OztxQ0FFZ0I7QUFDYixpQkFBSyxPQUFMLEdBQWUsSUFBZjtBQUNIOzs7bUNBRWM7QUFDWCxpQkFBSyxVQUFMO0FBQ0EsaUJBQUssVUFBTDtBQUNIOzs7cUNBRWlCO0FBQ2QsaUJBQUssT0FBTCxHQUFlLEtBQWY7QUFDQSxpQkFBSyxTQUFMLENBQWUsYUFBZixHQUErQixRQUEvQjtBQUNBLGlCQUFLLFNBQUwsQ0FBZSxhQUFmLEdBQStCLFlBQS9CO0FBQ0g7OztxQ0FFZ0I7QUFDYixnQkFBSSxLQUFLLE9BQVQsRUFBa0I7QUFDZCxxQkFBSyxVQUFMO0FBQ0gsYUFGRCxNQUVPO0FBQ0gscUJBQUssVUFBTDtBQUNIO0FBQ0QsaUJBQUssVUFBTDtBQUNIOzs7cUNBRW1CLFEsRUFBZ0I7QUFDaEMsZ0JBQUksS0FBSyxPQUFMLElBQWdCLEtBQUssUUFBTCxLQUFrQixRQUF0QyxFQUFnRDtBQUM1QyxxQkFBSyxRQUFMO0FBQ0E7QUFDSDtBQUVELGlCQUFLLFlBQUwsQ0FBa0IsUUFBbEI7QUFDSDs7O3FDQUVtQixRLEVBQWdCO0FBQUE7O0FBQ2hDLGdCQUFJLENBQUMsS0FBSyxPQUFWLEVBQ0ksS0FBSyxVQUFMO0FBRUosaUJBQUssUUFBTCxHQUFnQixRQUFoQjtBQUdBLGlCQUFLLFVBQUwsQ0FBZ0IsWUFBQTtBQUNaLG9CQUFNLFFBQWEsT0FBSyxhQUFMLENBQW1CLGlDQUFuQixDQUFuQjtBQUNBLG9CQUFJLEtBQUosRUFBVyxNQUFNLEtBQU47QUFDZCxhQUhEO0FBSUg7OztrQ0FFZ0IsRSxFQUFZLEssRUFBZSxJLEVBQWlHO0FBQUE7O0FBQUEsZ0JBQTlFLE9BQThFLHlEQUFqRCxFQUFFLFVBQVUsSUFBWixFQUFpRDtBQUFBLGdCQUE3QixnQkFBNkI7O0FBQ3pJLGdCQUFNLGFBQWEsaURBQW5CO0FBQ0EsZ0JBQU0sS0FBSywwQ0FBWDtBQUNBLGdCQUFNLFVBQVUsRUFBRSxNQUFGLEVBQU0sWUFBTixFQUFhLFVBQWIsRUFBbUIsZ0JBQW5CLEVBQTRCLFlBQVksRUFBeEMsRUFBaEI7QUFFQSxpQkFBSyxNQUFMLENBQVksR0FBWixDQUFnQixFQUFoQixFQUFvQixPQUFwQjtBQUNBLGlCQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsVUFBcEI7QUFDQSx1QkFBVyxVQUFYLEdBQXdCLEVBQXhCO0FBRUEsZ0JBQUksZ0JBQUosRUFDSSxHQUFHLEdBQUgsQ0FBTyxnQkFBUDtBQUVKLGlCQUFLLFNBQUwsQ0FBZSxHQUFmLENBQW1CLHVCQUFuQixFQUErQyxFQUEvQyxjQUE0RCxVQUE1RDtBQUVBLGVBQUcsR0FBSCxDQUFPLEtBQUssUUFBTCxDQUFjLEdBQWQsQ0FBa0IsZ0JBQWxCLEVBQW9DLDhCQUE4QixFQUFsRSxFQUFzRTtBQUFBLHVCQUFNLE9BQUssWUFBTCxDQUFrQixFQUFsQixDQUFOO0FBQUEsYUFBdEUsQ0FBUDtBQUNBLGVBQUcsR0FBSCxDQUFPLEtBQUssUUFBTCxDQUFjLEdBQWQsQ0FBa0IsZ0JBQWxCLEVBQW9DLGdDQUFnQyxFQUFwRSxFQUF3RTtBQUFBLHVCQUFNLE9BQUssWUFBTCxDQUFrQixFQUFsQixDQUFOO0FBQUEsYUFBeEUsQ0FBUDtBQUVBLGdCQUFJLFFBQVEsU0FBWixFQUF1QjtBQUNuQixtQkFBRyxHQUFILENBQU8sS0FBSyxRQUFMLENBQWMsR0FBZCxDQUFrQixnQkFBbEIsRUFBb0MsK0JBQStCLEVBQW5FLEVBQXVFLFlBQUE7QUFDMUUsMkJBQUssVUFBTCxDQUFnQixNQUFoQixDQUF1QixVQUF2QjtBQUNBLCtCQUFXLE9BQVg7QUFDQSwyQkFBSyxRQUFMO0FBQ0gsaUJBSk0sQ0FBUDtBQUtIO0FBRUQsZUFBRyxHQUFILENBQU8sNEJBQVcsTUFBWCxDQUFrQixZQUFBO0FBQ3JCLG9CQUFJLE9BQUssUUFBTCxLQUFrQixFQUF0QixFQUEwQjtBQUN0QiwyQkFBSyxRQUFMLEdBQWdCLFFBQWhCO0FBQ0g7QUFDSixhQUpNLENBQVA7QUFNQSxlQUFHLEdBQUgsQ0FBTyw0QkFBVyxNQUFYLENBQWtCLFlBQUE7QUFDckIscUJBQUssTUFBTDtBQUNBLHVCQUFLLE1BQUwsQ0FBWSxNQUFaLENBQW1CLEVBQW5CO0FBQ0gsYUFITSxDQUFQO0FBS0EsaUJBQUssY0FBTCxDQUFvQixPQUFwQjtBQUVBLGdCQUFJLENBQUMsS0FBSyxRQUFWLEVBQW9CLEtBQUssUUFBTCxHQUFnQixFQUFoQjtBQUVwQixtQkFBb0IsVUFBcEI7QUFDSDs7O2tDQUVnQixFLEVBQVksSyxFQUFlLEksRUFBZ0c7QUFBQSxnQkFBN0UsT0FBNkUseURBQWpELEVBQUUsVUFBVSxJQUFaLEVBQWlEO0FBQUEsZ0JBQTdCLGdCQUE2Qjs7QUFDeEksZ0JBQU0sYUFBYSxpREFBbkI7QUFDQSxnQkFBTSxLQUFLLDBDQUFYO0FBQ0EsaUJBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQixVQUFwQjtBQUNBLHVCQUFXLFVBQVgsR0FBd0IsRUFBeEI7QUFFQSxnQkFBSSxnQkFBSixFQUNJLEdBQUcsR0FBSCxDQUFPLGdCQUFQO0FBRUosaUJBQUssZ0JBQUwsQ0FBc0IsRUFBRSxNQUFGLEVBQU0sWUFBTixFQUFhLFVBQWIsRUFBbUIsZ0JBQW5CLEVBQTRCLFlBQVksRUFBeEMsRUFBdEI7QUFFQSxtQkFBb0IsVUFBcEI7QUFDSDs7OzRCQXZRZ0I7QUFBSyxtQkFBTyxLQUFLLE9BQVo7QUFBc0I7Ozs0QkFJekI7QUFBSyxtQkFBTyxLQUFLLFNBQVo7QUFBd0IsUzswQkFDNUIsSyxFQUFLO0FBQ3JCLGdCQUFNLE9BQU8sS0FBSyxNQUFMLENBQVksR0FBWixDQUFnQixLQUFoQixDQUFiO0FBRUEsZ0JBQUksS0FBSyxhQUFULEVBQXdCO0FBQ3BCLHFCQUFLLGFBQUwsQ0FBbUIsT0FBbkIsQ0FBMkIsU0FBM0IsQ0FBcUMsTUFBckMsQ0FBNEMsVUFBNUM7QUFDQSxxQkFBSyxhQUFMLENBQW1CLElBQW5CLENBQXdCLE1BQXhCO0FBQ0g7QUFFRCxnQkFBSSxJQUFKLEVBQVU7QUFDTixxQkFBSyxhQUFMLEdBQXFCLElBQXJCO0FBQ0EscUJBQUssT0FBTCxDQUFhLFNBQWIsQ0FBdUIsR0FBdkIsQ0FBMkIsVUFBM0I7QUFDQSxxQkFBSyxXQUFMLENBQWlCLEtBQUssSUFBdEI7QUFDSDtBQUVELGlCQUFLLFNBQUwsR0FBaUIsS0FBakI7QUFDSDs7OztFQWhDMkIsYzs7QUFzUjFCLFFBQVMsVUFBVCxHQUE0QixTQUFVLGVBQVYsQ0FBMEIsdUJBQTFCLEVBQW1ELEVBQUUsV0FBVyxXQUFXLFNBQXhCLEVBQW5ELENBQTVCOztJQUVOLE8sV0FBQSxPOzs7Ozs7Ozs7OzswQ0FNMEI7QUFDbEIsaUJBQUssU0FBTCxDQUFlLEdBQWYsQ0FBbUIsK0JBQW5CO0FBQ0g7OzsyQ0FFc0I7QUFDbkIsaUJBQUssVUFBTCxDQUFnQixPQUFoQjtBQUNIOzs7MkNBRXNCO0FBQUE7O0FBQ25CLGlCQUFLLFVBQUwsR0FBa0IsMENBQWxCO0FBQ0EsZ0JBQU0sWUFBWSxpQkFBVyxTQUFYLENBQWlDLFNBQVMsSUFBMUMsRUFBZ0QsV0FBaEQsRUFBNkQsS0FBN0QsRUFBbEI7QUFDQSxnQkFBTSxVQUFVLGlCQUFXLFNBQVgsQ0FBaUMsU0FBUyxJQUExQyxFQUFnRCxTQUFoRCxFQUEyRCxLQUEzRCxFQUFoQjtBQUNBLGdCQUFNLFlBQVksaUJBQVcsU0FBWCxDQUFpQyxJQUFqQyxFQUF1QyxXQUF2QyxFQUFvRCxLQUFwRCxFQUFsQjtBQUVBLGdCQUFNLFlBQVksVUFBVSxPQUFWLENBQWtCLFVBQUMsRUFBRCxFQUFHO0FBQ25DLG9CQUFNLFNBQVMsR0FBRyxPQUFILEdBQWEsT0FBTyxPQUFuQztvQkFDSSxTQUFTLEdBQUcsT0FBSCxHQUFhLE9BQU8sT0FEakM7QUFHQSx1QkFBTyxVQUFVLEdBQVYsQ0FBYyxVQUFDLEVBQUQsRUFBRztBQUNwQix1QkFBRyxjQUFIO0FBRUEsMkJBQU87QUFDSCw4QkFBTSxDQUFDLFNBQWUsR0FBRyxNQUFILENBQVcsS0FBWCxDQUFpQixJQUFoQyxFQUFzQyxFQUF0QyxLQUE2QyxDQUE5QyxJQUFtRCxHQUFHLE9BQXRELEdBQWdFLE1BRG5FO0FBRUgsNkJBQUssQ0FBQyxTQUFlLEdBQUcsTUFBSCxDQUFXLEtBQVgsQ0FBaUIsR0FBaEMsRUFBcUMsRUFBckMsS0FBNEMsQ0FBN0MsSUFBa0QsR0FBRyxPQUFyRCxHQUErRDtBQUZqRSxxQkFBUDtBQUlILGlCQVBNLEVBT0osU0FQSSxDQU9NLE9BUE4sQ0FBUDtBQVFILGFBWmlCLENBQWxCO0FBY0EsaUJBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQixVQUFVLFNBQVYsQ0FBb0I7QUFBQSx1QkFBSyxPQUFLLEtBQUwsRUFBTDtBQUFBLGFBQXBCLENBQXBCO0FBQ0EsaUJBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQixVQUFVLFNBQVYsQ0FBb0IsVUFBQyxDQUFEO0FBQUEsdUJBQU8sT0FBSyxNQUFMLENBQVksQ0FBWixDQUFQO0FBQUEsYUFBcEIsRUFBMkMsSUFBM0MsRUFBaUQ7QUFBQSx1QkFBTSxPQUFLLElBQUwsRUFBTjtBQUFBLGFBQWpELENBQXBCO0FBQ0g7Ozs7RUFwQ3dCLGM7O0FBdUN2QixRQUFTLE9BQVQsR0FBeUIsU0FBVSxlQUFWLENBQTBCLG1CQUExQixFQUErQyxFQUFFLFdBQVcsUUFBUSxTQUFyQixFQUEvQyxDQUF6QiIsImZpbGUiOiJsaWIvdmlld3MvZG9jay13aW5kb3cuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBPYnNlcnZhYmxlIH0gZnJvbSBcInJ4anNcIjtcbmltcG9ydCB7IERpc3Bvc2FibGUsIENvbXBvc2l0ZURpc3Bvc2FibGUsIFNpbmdsZUFzc2lnbm1lbnREaXNwb3NhYmxlIH0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcbmV4cG9ydCBjbGFzcyBEb2NrV2luZG93IGV4dGVuZHMgSFRNTERpdkVsZW1lbnQge1xuICAgIGdldCBpc09wZW4oKSB7IHJldHVybiB0aGlzLnZpc2libGU7IH1cbiAgICBnZXQgc2VsZWN0ZWQoKSB7IHJldHVybiB0aGlzLl9zZWxlY3RlZDsgfVxuICAgIHNldCBzZWxlY3RlZCh2YWx1ZSkge1xuICAgICAgICBjb25zdCBwYW5lID0gdGhpcy5fcGFuZXMuZ2V0KHZhbHVlKTtcbiAgICAgICAgaWYgKHRoaXMuX3NlbGVjdGVkUGFuZSkge1xuICAgICAgICAgICAgdGhpcy5fc2VsZWN0ZWRQYW5lLl9idXR0b24uY2xhc3NMaXN0LnJlbW92ZShcInNlbGVjdGVkXCIpO1xuICAgICAgICAgICAgdGhpcy5fc2VsZWN0ZWRQYW5lLnZpZXcucmVtb3ZlKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHBhbmUpIHtcbiAgICAgICAgICAgIHRoaXMuX3NlbGVjdGVkUGFuZSA9IHBhbmU7XG4gICAgICAgICAgICBwYW5lLl9idXR0b24uY2xhc3NMaXN0LmFkZChcInNlbGVjdGVkXCIpO1xuICAgICAgICAgICAgdGhpcy5hcHBlbmRDaGlsZChwYW5lLnZpZXcpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3NlbGVjdGVkID0gdmFsdWU7XG4gICAgfVxuICAgIGNyZWF0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgdGhpcy5fcGFuZXMgPSBuZXcgTWFwKCk7XG4gICAgICAgIHRoaXMuX3NlbGVjdGVkID0gXCJvdXRwdXRcIjtcbiAgICAgICAgdGhpcy52aXNpYmxlID0gZmFsc2U7XG4gICAgICAgIHRoaXMudGVtcEhlaWdodCA9IDA7XG4gICAgICAgIHRoaXMuZm9udFNpemUgPSBhdG9tLmNvbmZpZy5nZXQoXCJlZGl0b3IuZm9udFNpemVcIik7XG4gICAgICAgIGxldCBmb250U2l6ZSA9IHRoaXMuZm9udFNpemUgLSAxO1xuICAgICAgICBpZiAoZm9udFNpemUgPD0gMClcbiAgICAgICAgICAgIGZvbnRTaXplID0gMTtcbiAgICAgICAgdGhpcy5jbGFzc0xpc3QuYWRkKFwiaW5zZXQtcGFuZWxcIiwgXCJmb250LXNpemUtXCIgKyBmb250U2l6ZSk7XG4gICAgICAgIGlmICh0aGlzLmNsaWVudEhlaWdodCB8fCB0aGlzLnRlbXBIZWlnaHQpIHtcbiAgICAgICAgICAgIHRoaXMuc3R5bGUuaGVpZ2h0ID0gdGhpcy5jbGllbnRIZWlnaHQgKyB0aGlzLnRlbXBIZWlnaHQgKyBcInB4XCI7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcmVzaXplciA9IG5ldyBleHBvcnRzLlJlc2l6ZXIoKTtcbiAgICAgICAgbGV0IF9vcmlnaW5hbEhlaWdodCA9IHRoaXMuY2xpZW50SGVpZ2h0O1xuICAgICAgICByZXNpemVyLnN0YXJ0ID0gKCkgPT4geyBfb3JpZ2luYWxIZWlnaHQgPSB0aGlzLmNsaWVudEhlaWdodDsgfTtcbiAgICAgICAgcmVzaXplci51cGRhdGUgPSAoeyB0b3AgfSkgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5sb2codG9wKTtcbiAgICAgICAgICAgIHRoaXMuc3R5bGUuaGVpZ2h0ID0gYCR7X29yaWdpbmFsSGVpZ2h0ICsgLSh0b3ApfXB4YDtcbiAgICAgICAgfTtcbiAgICAgICAgcmVzaXplci5kb25lID0gKCkgPT4geyB9O1xuICAgICAgICB0aGlzLmFwcGVuZENoaWxkKHJlc2l6ZXIpO1xuICAgICAgICBjb25zdCB3aW5kb3dzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgd2luZG93cy5jbGFzc0xpc3QuYWRkKFwicGFuZWwtaGVhZGluZ1wiLCBcImNsZWFyZml4XCIpO1xuICAgICAgICB0aGlzLmFwcGVuZENoaWxkKHdpbmRvd3MpO1xuICAgICAgICB0aGlzLl90b29sYmFyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgdGhpcy5fdG9vbGJhci5jbGFzc0xpc3QuYWRkKFwiYnRuLXRvb2xiYXJcIiwgXCJwdWxsLWxlZnRcIik7XG4gICAgICAgIHdpbmRvd3MuYXBwZW5kQ2hpbGQodGhpcy5fdG9vbGJhcik7XG4gICAgICAgIHRoaXMuX3BhbmVCdXR0b25zID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgdGhpcy5fcGFuZUJ1dHRvbnMuY2xhc3NMaXN0LmFkZChcImJ0bi1ncm91cFwiLCBcImJ0bi10b2dnbGVcIik7XG4gICAgICAgIHRoaXMuX3Rvb2xiYXIuYXBwZW5kQ2hpbGQodGhpcy5fcGFuZUJ1dHRvbnMpO1xuICAgICAgICB0aGlzLl90b2dnbGVCdXR0b25zID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgdGhpcy5fdG9nZ2xlQnV0dG9ucy5jbGFzc0xpc3QuYWRkKFwiYnRuLXdlbGxcIiwgXCJwdWxsLXJpZ2h0XCIsIFwiYnRuLWdyb3VwXCIpO1xuICAgICAgICB3aW5kb3dzLmFwcGVuZENoaWxkKHRoaXMuX3RvZ2dsZUJ1dHRvbnMpO1xuICAgIH1cbiAgICBhdHRhY2hlZENhbGxiYWNrKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoXCJlZGl0b3IuZm9udFNpemVcIiwgKHNpemUpID0+IHtcbiAgICAgICAgICAgIHRoaXMuY2xhc3NOYW1lID0gdGhpcy5jbGFzc05hbWUucmVwbGFjZSgvZm9udC1zaXplLVtcXGRdKi9nLCBcIlwiKTtcbiAgICAgICAgICAgIHRoaXMuZm9udFNpemUgPSBzaXplO1xuICAgICAgICAgICAgdGhpcy5jbGFzc0xpc3QuYWRkKFwiZm9udC1zaXplLVwiICsgc2l6ZSk7XG4gICAgICAgIH0pKTtcbiAgICB9XG4gICAgc2V0UGFuZWwocGFuZWwpIHtcbiAgICAgICAgdGhpcy5fcGFuZWwgPSBwYW5lbDtcbiAgICB9XG4gICAgX2FkZERvY2tCdXR0b24oYnV0dG9uKSB7XG4gICAgICAgIGNvbnN0IHsgaWQsIHRpdGxlLCBvcHRpb25zLCBkaXNwb3NhYmxlIH0gPSBidXR0b247XG4gICAgICAgIGNvbnN0IHZpZXcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpO1xuICAgICAgICB2aWV3LmNsYXNzTGlzdC5hZGQoXCJidG5cIiwgXCJidG4tZGVmYXVsdFwiLCBcImJ0bi1maXhcIik7XG4gICAgICAgIHZpZXcuX2lkID0gaWQ7XG4gICAgICAgIHZpZXcuX3ByaW9yaXR5ID0gb3B0aW9ucy5wcmlvcml0eTtcbiAgICAgICAgZGlzcG9zYWJsZS5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xuICAgICAgICAgICAgaWYgKHZpZXcuY2xhc3NMaXN0LmNvbnRhaW5zKFwic2VsZWN0ZWRcIikpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNlbGVjdGVkID0gdmlldy5wcmV2aW91c0VsZW1lbnRTaWJsaW5nLl9pZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZpZXcucmVtb3ZlKCk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgY29uc3QgdGV4dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICB0ZXh0LmlubmVySFRNTCA9IHRpdGxlO1xuICAgICAgICB0ZXh0LmNsYXNzTGlzdC5hZGQoXCJ0ZXh0XCIpO1xuICAgICAgICB2aWV3LmFwcGVuZENoaWxkKHRleHQpO1xuICAgICAgICBpZiAob3B0aW9ucy5jbG9zZWFibGUpIHtcbiAgICAgICAgICAgIHZpZXcuY2xhc3NMaXN0LmFkZChcImNsb3NlYWJsZVwiKTtcbiAgICAgICAgICAgIGNvbnN0IGNsb3NlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICAgICAgICBjbG9zZS5jbGFzc0xpc3QuYWRkKFwiZmFcIiwgXCJmYS10aW1lcy1jaXJjbGVcIiwgXCJjbG9zZS1wYW5lXCIpO1xuICAgICAgICAgICAgY2xvc2Uub25jbGljayA9IChlKSA9PiB7XG4gICAgICAgICAgICAgICAgZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdmlldy5hcHBlbmRDaGlsZChjbG9zZSk7XG4gICAgICAgIH1cbiAgICAgICAgdmlldy5vbmNsaWNrID0gKGUpID0+IHtcbiAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB0aGlzLnNlbGVjdGVkID0gaWQ7XG4gICAgICAgIH07XG4gICAgICAgIGJ1dHRvbi5fYnV0dG9uID0gdmlldztcbiAgICAgICAgdGhpcy5faW5zZXJ0QnV0dG9uKHRoaXMuX3BhbmVCdXR0b25zLCB2aWV3LCBvcHRpb25zLnByaW9yaXR5LCBpZCk7XG4gICAgfVxuICAgIF9hZGRUb2dnbGVCdXR0b24oeyBpZCwgb3B0aW9ucywgdmlldywgZGlzcG9zYWJsZSB9KSB7XG4gICAgICAgIGRpc3Bvc2FibGUuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcbiAgICAgICAgICAgIHZpZXcucmVtb3ZlKCk7XG4gICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUucmVtb3ZlKGRpc3Bvc2FibGUpO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuX2luc2VydEJ1dHRvbih0aGlzLl90b2dnbGVCdXR0b25zLCB2aWV3LCBvcHRpb25zLnByaW9yaXR5LCBpZCk7XG4gICAgfVxuICAgIF9pbnNlcnRCdXR0b24ocGFyZW50LCBlbGVtZW50LCBwcmlvcml0eSwgaWQpIHtcbiAgICAgICAgbGV0IGluc2VydEluZGV4ID0gLTE7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGFyZW50LmNoaWxkTm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IGNoaWxkID0gcGFyZW50LmNoaWxkTm9kZXNbaV07XG4gICAgICAgICAgICBpZiAoY2hpbGQuX2lkIDw9IGlkICYmIGNoaWxkLl9wcmlvcml0eSA8PSBwcmlvcml0eSkge1xuICAgICAgICAgICAgICAgIGluc2VydEluZGV4ID0gaSArIDE7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGluc2VydEluZGV4ID4gLTEgJiYgaW5zZXJ0SW5kZXggPCBwYXJlbnQuY2hpbGROb2Rlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHBhcmVudC5pbnNlcnRCZWZvcmUoZWxlbWVudCwgcGFyZW50LmNoaWxkTm9kZXNbaW5zZXJ0SW5kZXhdKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHBhcmVudC5hcHBlbmRDaGlsZChlbGVtZW50KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICB1cGRhdGVBdG9tKGNiKSB7XG4gICAgICAgIGlmICh0aGlzLl9wYW5lbC52aXNpYmxlICE9PSB0aGlzLnZpc2libGUpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnZpc2libGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9wYW5lbC5zaG93KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9wYW5lbC5oaWRlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNiKVxuICAgICAgICAgICAgY2IoKTtcbiAgICB9XG4gICAgc2hvd1ZpZXcoKSB7XG4gICAgICAgIHRoaXMudmlzaWJsZSA9IHRydWU7XG4gICAgICAgIHRoaXMudXBkYXRlQXRvbSgpO1xuICAgIH1cbiAgICBkb1Nob3dWaWV3KCkge1xuICAgICAgICB0aGlzLnZpc2libGUgPSB0cnVlO1xuICAgIH1cbiAgICBoaWRlVmlldygpIHtcbiAgICAgICAgdGhpcy5kb0hpZGVWaWV3KCk7XG4gICAgICAgIHRoaXMudXBkYXRlQXRvbSgpO1xuICAgIH1cbiAgICBkb0hpZGVWaWV3KCkge1xuICAgICAgICB0aGlzLnZpc2libGUgPSBmYWxzZTtcbiAgICAgICAgYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlUGFuZSgpLmFjdGl2YXRlKCk7XG4gICAgICAgIGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVBhbmUoKS5hY3RpdmF0ZUl0ZW0oKTtcbiAgICB9XG4gICAgdG9nZ2xlVmlldygpIHtcbiAgICAgICAgaWYgKHRoaXMudmlzaWJsZSkge1xuICAgICAgICAgICAgdGhpcy5kb0hpZGVWaWV3KCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmRvU2hvd1ZpZXcoKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnVwZGF0ZUF0b20oKTtcbiAgICB9XG4gICAgdG9nZ2xlV2luZG93KHNlbGVjdGVkKSB7XG4gICAgICAgIGlmICh0aGlzLnZpc2libGUgJiYgdGhpcy5zZWxlY3RlZCA9PT0gc2VsZWN0ZWQpIHtcbiAgICAgICAgICAgIHRoaXMuaGlkZVZpZXcoKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnNlbGVjdFdpbmRvdyhzZWxlY3RlZCk7XG4gICAgfVxuICAgIHNlbGVjdFdpbmRvdyhzZWxlY3RlZCkge1xuICAgICAgICBpZiAoIXRoaXMudmlzaWJsZSlcbiAgICAgICAgICAgIHRoaXMuZG9TaG93VmlldygpO1xuICAgICAgICB0aGlzLnNlbGVjdGVkID0gc2VsZWN0ZWQ7XG4gICAgICAgIHRoaXMudXBkYXRlQXRvbSgoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBwYW5lbCA9IHRoaXMucXVlcnlTZWxlY3RvcihcIi5vbW5pc2hhcnAtYXRvbS1vdXRwdXQuc2VsZWN0ZWRcIik7XG4gICAgICAgICAgICBpZiAocGFuZWwpXG4gICAgICAgICAgICAgICAgcGFuZWwuZm9jdXMoKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGFkZFdpbmRvdyhpZCwgdGl0bGUsIHZpZXcsIG9wdGlvbnMgPSB7IHByaW9yaXR5OiAxMDAwIH0sIHBhcmVudERpc3Bvc2FibGUpIHtcbiAgICAgICAgY29uc3QgZGlzcG9zYWJsZSA9IG5ldyBTaW5nbGVBc3NpZ25tZW50RGlzcG9zYWJsZSgpO1xuICAgICAgICBjb25zdCBjZCA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIGNvbnN0IGNvbnRleHQgPSB7IGlkLCB0aXRsZSwgdmlldywgb3B0aW9ucywgZGlzcG9zYWJsZTogY2QgfTtcbiAgICAgICAgdGhpcy5fcGFuZXMuc2V0KGlkLCBjb250ZXh0KTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChkaXNwb3NhYmxlKTtcbiAgICAgICAgZGlzcG9zYWJsZS5kaXNwb3NhYmxlID0gY2Q7XG4gICAgICAgIGlmIChwYXJlbnREaXNwb3NhYmxlKVxuICAgICAgICAgICAgY2QuYWRkKHBhcmVudERpc3Bvc2FibGUpO1xuICAgICAgICB2aWV3LmNsYXNzTGlzdC5hZGQoXCJvbW5pc2hhcnAtYXRvbS1vdXRwdXRcIiwgYCR7aWR9LW91dHB1dGAsIFwic2VsZWN0ZWRcIik7XG4gICAgICAgIGNkLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwib21uaXNoYXJwLWF0b206ZG9jay1zaG93LVwiICsgaWQsICgpID0+IHRoaXMuc2VsZWN0V2luZG93KGlkKSkpO1xuICAgICAgICBjZC5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcIm9tbmlzaGFycC1hdG9tOmRvY2stdG9nZ2xlLVwiICsgaWQsICgpID0+IHRoaXMudG9nZ2xlV2luZG93KGlkKSkpO1xuICAgICAgICBpZiAob3B0aW9ucy5jbG9zZWFibGUpIHtcbiAgICAgICAgICAgIGNkLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwib21uaXNoYXJwLWF0b206ZG9jay1jbG9zZS1cIiArIGlkLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLnJlbW92ZShkaXNwb3NhYmxlKTtcbiAgICAgICAgICAgICAgICBkaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmhpZGVWaWV3KCk7XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgIH1cbiAgICAgICAgY2QuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLnNlbGVjdGVkID09PSBpZCkge1xuICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWQgPSBcIm91dHB1dFwiO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KSk7XG4gICAgICAgIGNkLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XG4gICAgICAgICAgICB2aWV3LnJlbW92ZSgpO1xuICAgICAgICAgICAgdGhpcy5fcGFuZXMuZGVsZXRlKGlkKTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLl9hZGREb2NrQnV0dG9uKGNvbnRleHQpO1xuICAgICAgICBpZiAoIXRoaXMuc2VsZWN0ZWQpXG4gICAgICAgICAgICB0aGlzLnNlbGVjdGVkID0gaWQ7XG4gICAgICAgIHJldHVybiBkaXNwb3NhYmxlO1xuICAgIH1cbiAgICBhZGRCdXR0b24oaWQsIHRpdGxlLCB2aWV3LCBvcHRpb25zID0geyBwcmlvcml0eTogMTAwMCB9LCBwYXJlbnREaXNwb3NhYmxlKSB7XG4gICAgICAgIGNvbnN0IGRpc3Bvc2FibGUgPSBuZXcgU2luZ2xlQXNzaWdubWVudERpc3Bvc2FibGUoKTtcbiAgICAgICAgY29uc3QgY2QgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGRpc3Bvc2FibGUpO1xuICAgICAgICBkaXNwb3NhYmxlLmRpc3Bvc2FibGUgPSBjZDtcbiAgICAgICAgaWYgKHBhcmVudERpc3Bvc2FibGUpXG4gICAgICAgICAgICBjZC5hZGQocGFyZW50RGlzcG9zYWJsZSk7XG4gICAgICAgIHRoaXMuX2FkZFRvZ2dsZUJ1dHRvbih7IGlkLCB0aXRsZSwgdmlldywgb3B0aW9ucywgZGlzcG9zYWJsZTogY2QgfSk7XG4gICAgICAgIHJldHVybiBkaXNwb3NhYmxlO1xuICAgIH1cbn1cbmV4cG9ydHMuRG9ja1dpbmRvdyA9IGRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudChcIm9tbmlzaGFycC1kb2NrLXdpbmRvd1wiLCB7IHByb3RvdHlwZTogRG9ja1dpbmRvdy5wcm90b3R5cGUgfSk7XG5leHBvcnQgY2xhc3MgUmVzaXplciBleHRlbmRzIEhUTUxEaXZFbGVtZW50IHtcbiAgICBjcmVhdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMuY2xhc3NMaXN0LmFkZChcIm9tbmlzaGFycC1hdG9tLW91dHB1dC1yZXNpemVyXCIpO1xuICAgIH1cbiAgICBkZXRhY2hlZENhbGxiYWNrKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgIH1cbiAgICBhdHRhY2hlZENhbGxiYWNrKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICBjb25zdCBtb3VzZW1vdmUgPSBPYnNlcnZhYmxlLmZyb21FdmVudChkb2N1bWVudC5ib2R5LCBcIm1vdXNlbW92ZVwiKS5zaGFyZSgpO1xuICAgICAgICBjb25zdCBtb3VzZXVwID0gT2JzZXJ2YWJsZS5mcm9tRXZlbnQoZG9jdW1lbnQuYm9keSwgXCJtb3VzZXVwXCIpLnNoYXJlKCk7XG4gICAgICAgIGNvbnN0IG1vdXNlZG93biA9IE9ic2VydmFibGUuZnJvbUV2ZW50KHRoaXMsIFwibW91c2Vkb3duXCIpLnNoYXJlKCk7XG4gICAgICAgIGNvbnN0IG1vdXNlZHJhZyA9IG1vdXNlZG93bi5mbGF0TWFwKChtZCkgPT4ge1xuICAgICAgICAgICAgY29uc3Qgc3RhcnRYID0gbWQuY2xpZW50WCArIHdpbmRvdy5zY3JvbGxYLCBzdGFydFkgPSBtZC5jbGllbnRZICsgd2luZG93LnNjcm9sbFk7XG4gICAgICAgICAgICByZXR1cm4gbW91c2Vtb3ZlLm1hcCgobW0pID0+IHtcbiAgICAgICAgICAgICAgICBtbS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIGxlZnQ6IChwYXJzZUludChtZC50YXJnZXQuc3R5bGUubGVmdCwgMTApIHx8IDApICsgbW0uY2xpZW50WCAtIHN0YXJ0WCxcbiAgICAgICAgICAgICAgICAgICAgdG9wOiAocGFyc2VJbnQobWQudGFyZ2V0LnN0eWxlLnRvcCwgMTApIHx8IDApICsgbW0uY2xpZW50WSAtIHN0YXJ0WVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9KS50YWtlVW50aWwobW91c2V1cCk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKG1vdXNlZG93bi5zdWJzY3JpYmUoeCA9PiB0aGlzLnN0YXJ0KCkpKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChtb3VzZWRyYWcuc3Vic2NyaWJlKCh4KSA9PiB0aGlzLnVwZGF0ZSh4KSwgbnVsbCwgKCkgPT4gdGhpcy5kb25lKCkpKTtcbiAgICB9XG59XG5leHBvcnRzLlJlc2l6ZXIgPSBkb2N1bWVudC5yZWdpc3RlckVsZW1lbnQoXCJvbW5pc2hhcnAtcmVzaXplclwiLCB7IHByb3RvdHlwZTogUmVzaXplci5wcm90b3R5cGUgfSk7XG4iLCJpbXBvcnQge09ic2VydmFibGV9IGZyb20gXCJyeGpzXCI7XHJcbmltcG9ydCB7RGlzcG9zYWJsZSwgQ29tcG9zaXRlRGlzcG9zYWJsZSwgU2luZ2xlQXNzaWdubWVudERpc3Bvc2FibGUsIElEaXNwb3NhYmxlfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBUb2dnbGVCdXR0b24ge1xyXG4gICAgaWQ6IHN0cmluZztcclxuICAgIHRpdGxlOiBzdHJpbmc7XHJcbiAgICB2aWV3OiBIVE1MRWxlbWVudDtcclxuICAgIG9wdGlvbnM6IERvY0J1dHRvbk9wdGlvbnM7XHJcbiAgICBkaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIERvY0J1dHRvbk9wdGlvbnMge1xyXG4gICAgcHJpb3JpdHk/OiBudW1iZXI7XHJcbn1cclxuXHJcbmludGVyZmFjZSBJbnRlcm5hbFRvZ2dsZUJ1dHRvbiBleHRlbmRzIFRvZ2dsZUJ1dHRvbiB7XHJcblxyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFBhbmVCdXR0b24ge1xyXG4gICAgaWQ6IHN0cmluZztcclxuICAgIHRpdGxlOiBzdHJpbmc7XHJcbiAgICB2aWV3OiBIVE1MRWxlbWVudDtcclxuICAgIG9wdGlvbnM6IFBhbmVCdXR0b25PcHRpb25zO1xyXG4gICAgZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBQYW5lQnV0dG9uT3B0aW9ucyB7XHJcbiAgICBwcmlvcml0eT86IG51bWJlcjtcclxuICAgIGNsb3NlYWJsZT86IGJvb2xlYW47XHJcbn1cclxuXHJcbmludGVyZmFjZSBJbnRlcm5hbFBhbmVCdXR0b24gZXh0ZW5kcyBQYW5lQnV0dG9uIHtcclxuICAgIF9idXR0b24/OiBFbGVtZW50O1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgRG9ja1dpbmRvdyBleHRlbmRzIEhUTUxEaXZFbGVtZW50IGltcGxlbWVudHMgV2ViQ29tcG9uZW50IHtcclxuICAgIHByaXZhdGUgZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxuICAgIHByaXZhdGUgX3BhbmVsOiBBdG9tLlBhbmVsO1xyXG4gICAgcHJpdmF0ZSBfc2VsZWN0ZWRQYW5lOiBJbnRlcm5hbFBhbmVCdXR0b247XHJcbiAgICBwcml2YXRlIF90b29sYmFyOiBIVE1MRGl2RWxlbWVudDtcclxuICAgIHByaXZhdGUgX3BhbmVCdXR0b25zOiBIVE1MRGl2RWxlbWVudDtcclxuICAgIHByaXZhdGUgX3RvZ2dsZUJ1dHRvbnM6IEhUTUxEaXZFbGVtZW50O1xyXG4gICAgcHJpdmF0ZSBfcGFuZXM6IE1hcDxzdHJpbmcsIEludGVybmFsUGFuZUJ1dHRvbj47XHJcbiAgICBwcml2YXRlIHZpc2libGU6IGJvb2xlYW47XHJcbiAgICBwcml2YXRlIHRlbXBIZWlnaHQ6IG51bWJlcjtcclxuICAgIHByaXZhdGUgZm9udFNpemU6IGFueTtcclxuXHJcbiAgICBwdWJsaWMgZ2V0IGlzT3BlbigpIHsgcmV0dXJuIHRoaXMudmlzaWJsZTsgfVxyXG4gICAgLy9hdG9tLmNvbmZpZy5nZXQ8bnVtYmVyPihcImVkaXRvci5mb250U2l6ZVwiKVxyXG5cclxuICAgIHByaXZhdGUgX3NlbGVjdGVkOiBzdHJpbmc7XHJcbiAgICBwdWJsaWMgZ2V0IHNlbGVjdGVkKCkgeyByZXR1cm4gdGhpcy5fc2VsZWN0ZWQ7IH1cclxuICAgIHB1YmxpYyBzZXQgc2VsZWN0ZWQodmFsdWUpIHtcclxuICAgICAgICBjb25zdCBwYW5lID0gdGhpcy5fcGFuZXMuZ2V0KHZhbHVlKTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX3NlbGVjdGVkUGFuZSkge1xyXG4gICAgICAgICAgICB0aGlzLl9zZWxlY3RlZFBhbmUuX2J1dHRvbi5jbGFzc0xpc3QucmVtb3ZlKFwic2VsZWN0ZWRcIik7XHJcbiAgICAgICAgICAgIHRoaXMuX3NlbGVjdGVkUGFuZS52aWV3LnJlbW92ZSgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHBhbmUpIHtcclxuICAgICAgICAgICAgdGhpcy5fc2VsZWN0ZWRQYW5lID0gcGFuZTtcclxuICAgICAgICAgICAgcGFuZS5fYnV0dG9uLmNsYXNzTGlzdC5hZGQoXCJzZWxlY3RlZFwiKTtcclxuICAgICAgICAgICAgdGhpcy5hcHBlbmRDaGlsZChwYW5lLnZpZXcpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5fc2VsZWN0ZWQgPSB2YWx1ZTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgY3JlYXRlZENhbGxiYWNrKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcbiAgICAgICAgdGhpcy5fcGFuZXMgPSBuZXcgTWFwPHN0cmluZywgSW50ZXJuYWxQYW5lQnV0dG9uPigpO1xyXG4gICAgICAgIHRoaXMuX3NlbGVjdGVkID0gXCJvdXRwdXRcIjtcclxuICAgICAgICB0aGlzLnZpc2libGUgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLnRlbXBIZWlnaHQgPSAwO1xyXG4gICAgICAgIHRoaXMuZm9udFNpemUgPSBhdG9tLmNvbmZpZy5nZXQ8bnVtYmVyPihcImVkaXRvci5mb250U2l6ZVwiKTtcclxuXHJcbiAgICAgICAgbGV0IGZvbnRTaXplID0gdGhpcy5mb250U2l6ZSAtIDE7XHJcbiAgICAgICAgaWYgKGZvbnRTaXplIDw9IDApXHJcbiAgICAgICAgICAgIGZvbnRTaXplID0gMTtcclxuXHJcbiAgICAgICAgdGhpcy5jbGFzc0xpc3QuYWRkKFwiaW5zZXQtcGFuZWxcIiwgXCJmb250LXNpemUtXCIgKyBmb250U2l6ZSk7XHJcbiAgICAgICAgaWYgKHRoaXMuY2xpZW50SGVpZ2h0IHx8IHRoaXMudGVtcEhlaWdodCkge1xyXG4gICAgICAgICAgICB0aGlzLnN0eWxlLmhlaWdodCA9IHRoaXMuY2xpZW50SGVpZ2h0ICsgdGhpcy50ZW1wSGVpZ2h0ICsgXCJweFwiO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgcmVzaXplciA9IG5ldyBleHBvcnRzLlJlc2l6ZXIoKTtcclxuICAgICAgICBsZXQgX29yaWdpbmFsSGVpZ2h0ID0gdGhpcy5jbGllbnRIZWlnaHQ7XHJcbiAgICAgICAgcmVzaXplci5zdGFydCA9ICgpID0+IHsgX29yaWdpbmFsSGVpZ2h0ID0gdGhpcy5jbGllbnRIZWlnaHQ7IH07XHJcbiAgICAgICAgcmVzaXplci51cGRhdGUgPSAoe3RvcH06IHsgbGVmdDogbnVtYmVyLCB0b3A6IG51bWJlciB9KSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHRvcCk7XHJcbiAgICAgICAgICAgIHRoaXMuc3R5bGUuaGVpZ2h0ID0gYCR7X29yaWdpbmFsSGVpZ2h0ICsgLSh0b3ApfXB4YDtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHJlc2l6ZXIuZG9uZSA9ICgpID0+IHsgLyogKi8gfTtcclxuICAgICAgICB0aGlzLmFwcGVuZENoaWxkKHJlc2l6ZXIpO1xyXG5cclxuICAgICAgICBjb25zdCB3aW5kb3dzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuICAgICAgICB3aW5kb3dzLmNsYXNzTGlzdC5hZGQoXCJwYW5lbC1oZWFkaW5nXCIsIFwiY2xlYXJmaXhcIik7XHJcbiAgICAgICAgdGhpcy5hcHBlbmRDaGlsZCh3aW5kb3dzKTtcclxuXHJcbiAgICAgICAgdGhpcy5fdG9vbGJhciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgICAgICAgdGhpcy5fdG9vbGJhci5jbGFzc0xpc3QuYWRkKFwiYnRuLXRvb2xiYXJcIiwgXCJwdWxsLWxlZnRcIik7XHJcbiAgICAgICAgd2luZG93cy5hcHBlbmRDaGlsZCh0aGlzLl90b29sYmFyKTtcclxuXHJcbiAgICAgICAgdGhpcy5fcGFuZUJ1dHRvbnMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gICAgICAgIHRoaXMuX3BhbmVCdXR0b25zLmNsYXNzTGlzdC5hZGQoXCJidG4tZ3JvdXBcIiwgXCJidG4tdG9nZ2xlXCIpO1xyXG4gICAgICAgIHRoaXMuX3Rvb2xiYXIuYXBwZW5kQ2hpbGQodGhpcy5fcGFuZUJ1dHRvbnMpO1xyXG5cclxuICAgICAgICB0aGlzLl90b2dnbGVCdXR0b25zID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuICAgICAgICB0aGlzLl90b2dnbGVCdXR0b25zLmNsYXNzTGlzdC5hZGQoXCJidG4td2VsbFwiLCBcInB1bGwtcmlnaHRcIiwgXCJidG4tZ3JvdXBcIik7XHJcbiAgICAgICAgd2luZG93cy5hcHBlbmRDaGlsZCh0aGlzLl90b2dnbGVCdXR0b25zKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgYXR0YWNoZWRDYWxsYmFjaygpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoXCJlZGl0b3IuZm9udFNpemVcIiwgKHNpemU6IG51bWJlcikgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLmNsYXNzTmFtZSA9IHRoaXMuY2xhc3NOYW1lLnJlcGxhY2UoL2ZvbnQtc2l6ZS1bXFxkXSovZywgXCJcIik7XHJcbiAgICAgICAgICAgIHRoaXMuZm9udFNpemUgPSBzaXplO1xyXG4gICAgICAgICAgICB0aGlzLmNsYXNzTGlzdC5hZGQoXCJmb250LXNpemUtXCIgKyBzaXplKTtcclxuICAgICAgICB9KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHNldFBhbmVsKHBhbmVsOiBBdG9tLlBhbmVsKSB7XHJcbiAgICAgICAgdGhpcy5fcGFuZWwgPSBwYW5lbDtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9hZGREb2NrQnV0dG9uKGJ1dHRvbjogSW50ZXJuYWxQYW5lQnV0dG9uKSB7XHJcbiAgICAgICAgY29uc3Qge2lkLCB0aXRsZSwgb3B0aW9ucywgZGlzcG9zYWJsZX0gPSBidXR0b247XHJcblxyXG4gICAgICAgIGNvbnN0IHZpZXcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpO1xyXG4gICAgICAgIHZpZXcuY2xhc3NMaXN0LmFkZChcImJ0blwiLCBcImJ0bi1kZWZhdWx0XCIsIFwiYnRuLWZpeFwiKTtcclxuICAgICAgICAodmlldyBhcyBhbnkpLl9pZCA9IGlkO1xyXG4gICAgICAgICh2aWV3IGFzIGFueSkuX3ByaW9yaXR5ID0gb3B0aW9ucy5wcmlvcml0eTtcclxuXHJcbiAgICAgICAgZGlzcG9zYWJsZS5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xyXG4gICAgICAgICAgICBpZiAodmlldy5jbGFzc0xpc3QuY29udGFpbnMoXCJzZWxlY3RlZFwiKSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zZWxlY3RlZCA9ICh2aWV3LnByZXZpb3VzRWxlbWVudFNpYmxpbmcgYXMgYW55KS5faWQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdmlldy5yZW1vdmUoKTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIGNvbnN0IHRleHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcclxuICAgICAgICB0ZXh0LmlubmVySFRNTCA9IHRpdGxlO1xyXG4gICAgICAgIHRleHQuY2xhc3NMaXN0LmFkZChcInRleHRcIik7XHJcbiAgICAgICAgdmlldy5hcHBlbmRDaGlsZCh0ZXh0KTtcclxuXHJcbiAgICAgICAgaWYgKG9wdGlvbnMuY2xvc2VhYmxlKSB7XHJcbiAgICAgICAgICAgIHZpZXcuY2xhc3NMaXN0LmFkZChcImNsb3NlYWJsZVwiKTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IGNsb3NlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XHJcbiAgICAgICAgICAgIGNsb3NlLmNsYXNzTGlzdC5hZGQoXCJmYVwiLCBcImZhLXRpbWVzLWNpcmNsZVwiLCBcImNsb3NlLXBhbmVcIik7XHJcbiAgICAgICAgICAgIGNsb3NlLm9uY2xpY2sgPSAoZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIHZpZXcuYXBwZW5kQ2hpbGQoY2xvc2UpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmlldy5vbmNsaWNrID0gKGUpID0+IHtcclxuICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICB0aGlzLnNlbGVjdGVkID0gaWQ7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgYnV0dG9uLl9idXR0b24gPSB2aWV3O1xyXG5cclxuICAgICAgICB0aGlzLl9pbnNlcnRCdXR0b24odGhpcy5fcGFuZUJ1dHRvbnMsIHZpZXcsIG9wdGlvbnMucHJpb3JpdHksIGlkKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9hZGRUb2dnbGVCdXR0b24oe2lkLCBvcHRpb25zLCB2aWV3LCBkaXNwb3NhYmxlfTogVG9nZ2xlQnV0dG9uKSB7XHJcbiAgICAgICAgZGlzcG9zYWJsZS5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xyXG4gICAgICAgICAgICB2aWV3LnJlbW92ZSgpO1xyXG4gICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUucmVtb3ZlKGRpc3Bvc2FibGUpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5faW5zZXJ0QnV0dG9uKHRoaXMuX3RvZ2dsZUJ1dHRvbnMsIHZpZXcsIG9wdGlvbnMucHJpb3JpdHksIGlkKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9pbnNlcnRCdXR0b24ocGFyZW50OiBFbGVtZW50LCBlbGVtZW50OiBFbGVtZW50LCBwcmlvcml0eTogbnVtYmVyLCBpZDogc3RyaW5nKSB7XHJcbiAgICAgICAgbGV0IGluc2VydEluZGV4ID0gLTE7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYXJlbnQuY2hpbGROb2Rlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBjb25zdCBjaGlsZCA9IDxhbnk+cGFyZW50LmNoaWxkTm9kZXNbaV07XHJcbiAgICAgICAgICAgIGlmIChjaGlsZC5faWQgPD0gaWQgJiYgY2hpbGQuX3ByaW9yaXR5IDw9IHByaW9yaXR5KSB7XHJcbiAgICAgICAgICAgICAgICBpbnNlcnRJbmRleCA9IGkgKyAxO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpbnNlcnRJbmRleCA+IC0xICYmIGluc2VydEluZGV4IDwgcGFyZW50LmNoaWxkTm9kZXMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHBhcmVudC5pbnNlcnRCZWZvcmUoZWxlbWVudCwgcGFyZW50LmNoaWxkTm9kZXNbaW5zZXJ0SW5kZXhdKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBwYXJlbnQuYXBwZW5kQ2hpbGQoZWxlbWVudCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgdXBkYXRlQXRvbShjYj86ICgpID0+IHZvaWQpIHtcclxuICAgICAgICBpZiAodGhpcy5fcGFuZWwudmlzaWJsZSAhPT0gdGhpcy52aXNpYmxlKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLnZpc2libGUpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX3BhbmVsLnNob3coKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX3BhbmVsLmhpZGUoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoY2IpIGNiKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHNob3dWaWV3KCkge1xyXG4gICAgICAgIHRoaXMudmlzaWJsZSA9IHRydWU7XHJcbiAgICAgICAgdGhpcy51cGRhdGVBdG9tKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRvU2hvd1ZpZXcoKSB7XHJcbiAgICAgICAgdGhpcy52aXNpYmxlID0gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgaGlkZVZpZXcoKSB7XHJcbiAgICAgICAgdGhpcy5kb0hpZGVWaWV3KCk7XHJcbiAgICAgICAgdGhpcy51cGRhdGVBdG9tKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBkb0hpZGVWaWV3KCkge1xyXG4gICAgICAgIHRoaXMudmlzaWJsZSA9IGZhbHNlO1xyXG4gICAgICAgIGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVBhbmUoKS5hY3RpdmF0ZSgpO1xyXG4gICAgICAgIGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVBhbmUoKS5hY3RpdmF0ZUl0ZW0oKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgdG9nZ2xlVmlldygpIHtcclxuICAgICAgICBpZiAodGhpcy52aXNpYmxlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZG9IaWRlVmlldygpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuZG9TaG93VmlldygpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnVwZGF0ZUF0b20oKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgdG9nZ2xlV2luZG93KHNlbGVjdGVkOiBzdHJpbmcpIHtcclxuICAgICAgICBpZiAodGhpcy52aXNpYmxlICYmIHRoaXMuc2VsZWN0ZWQgPT09IHNlbGVjdGVkKSB7XHJcbiAgICAgICAgICAgIHRoaXMuaGlkZVZpZXcoKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5zZWxlY3RXaW5kb3coc2VsZWN0ZWQpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzZWxlY3RXaW5kb3coc2VsZWN0ZWQ6IHN0cmluZykge1xyXG4gICAgICAgIGlmICghdGhpcy52aXNpYmxlKVxyXG4gICAgICAgICAgICB0aGlzLmRvU2hvd1ZpZXcoKTtcclxuXHJcbiAgICAgICAgdGhpcy5zZWxlY3RlZCA9IHNlbGVjdGVkO1xyXG5cclxuICAgICAgICAvLyBGb2N1cyB0aGUgcGFuZWwhXHJcbiAgICAgICAgdGhpcy51cGRhdGVBdG9tKCgpID0+IHtcclxuICAgICAgICAgICAgY29uc3QgcGFuZWw6IGFueSA9IHRoaXMucXVlcnlTZWxlY3RvcihcIi5vbW5pc2hhcnAtYXRvbS1vdXRwdXQuc2VsZWN0ZWRcIik7XHJcbiAgICAgICAgICAgIGlmIChwYW5lbCkgcGFuZWwuZm9jdXMoKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgYWRkV2luZG93KGlkOiBzdHJpbmcsIHRpdGxlOiBzdHJpbmcsIHZpZXc6IEhUTUxFbGVtZW50LCBvcHRpb25zOiBQYW5lQnV0dG9uT3B0aW9ucyA9IHsgcHJpb3JpdHk6IDEwMDAgfSwgcGFyZW50RGlzcG9zYWJsZT86IERpc3Bvc2FibGUpIHtcclxuICAgICAgICBjb25zdCBkaXNwb3NhYmxlID0gbmV3IFNpbmdsZUFzc2lnbm1lbnREaXNwb3NhYmxlKCk7XHJcbiAgICAgICAgY29uc3QgY2QgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG4gICAgICAgIGNvbnN0IGNvbnRleHQgPSB7IGlkLCB0aXRsZSwgdmlldywgb3B0aW9ucywgZGlzcG9zYWJsZTogY2QgfTtcclxuXHJcbiAgICAgICAgdGhpcy5fcGFuZXMuc2V0KGlkLCBjb250ZXh0KTtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGRpc3Bvc2FibGUpO1xyXG4gICAgICAgIGRpc3Bvc2FibGUuZGlzcG9zYWJsZSA9IGNkO1xyXG5cclxuICAgICAgICBpZiAocGFyZW50RGlzcG9zYWJsZSlcclxuICAgICAgICAgICAgY2QuYWRkKHBhcmVudERpc3Bvc2FibGUpO1xyXG5cclxuICAgICAgICB2aWV3LmNsYXNzTGlzdC5hZGQoXCJvbW5pc2hhcnAtYXRvbS1vdXRwdXRcIiwgYCR7aWR9LW91dHB1dGAsIFwic2VsZWN0ZWRcIik7XHJcblxyXG4gICAgICAgIGNkLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwib21uaXNoYXJwLWF0b206ZG9jay1zaG93LVwiICsgaWQsICgpID0+IHRoaXMuc2VsZWN0V2luZG93KGlkKSkpO1xyXG4gICAgICAgIGNkLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwib21uaXNoYXJwLWF0b206ZG9jay10b2dnbGUtXCIgKyBpZCwgKCkgPT4gdGhpcy50b2dnbGVXaW5kb3coaWQpKSk7XHJcblxyXG4gICAgICAgIGlmIChvcHRpb25zLmNsb3NlYWJsZSkge1xyXG4gICAgICAgICAgICBjZC5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcIm9tbmlzaGFycC1hdG9tOmRvY2stY2xvc2UtXCIgKyBpZCwgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLnJlbW92ZShkaXNwb3NhYmxlKTtcclxuICAgICAgICAgICAgICAgIGRpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5oaWRlVmlldygpO1xyXG4gICAgICAgICAgICB9KSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjZC5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5zZWxlY3RlZCA9PT0gaWQpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWQgPSBcIm91dHB1dFwiO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICBjZC5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xyXG4gICAgICAgICAgICB2aWV3LnJlbW92ZSgpO1xyXG4gICAgICAgICAgICB0aGlzLl9wYW5lcy5kZWxldGUoaWQpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5fYWRkRG9ja0J1dHRvbihjb250ZXh0KTtcclxuXHJcbiAgICAgICAgaWYgKCF0aGlzLnNlbGVjdGVkKSB0aGlzLnNlbGVjdGVkID0gaWQ7XHJcblxyXG4gICAgICAgIHJldHVybiA8SURpc3Bvc2FibGU+ZGlzcG9zYWJsZTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgYWRkQnV0dG9uKGlkOiBzdHJpbmcsIHRpdGxlOiBzdHJpbmcsIHZpZXc6IEhUTUxFbGVtZW50LCBvcHRpb25zOiBEb2NCdXR0b25PcHRpb25zID0geyBwcmlvcml0eTogMTAwMCB9LCBwYXJlbnREaXNwb3NhYmxlPzogRGlzcG9zYWJsZSkge1xyXG4gICAgICAgIGNvbnN0IGRpc3Bvc2FibGUgPSBuZXcgU2luZ2xlQXNzaWdubWVudERpc3Bvc2FibGUoKTtcclxuICAgICAgICBjb25zdCBjZCA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChkaXNwb3NhYmxlKTtcclxuICAgICAgICBkaXNwb3NhYmxlLmRpc3Bvc2FibGUgPSBjZDtcclxuXHJcbiAgICAgICAgaWYgKHBhcmVudERpc3Bvc2FibGUpXHJcbiAgICAgICAgICAgIGNkLmFkZChwYXJlbnREaXNwb3NhYmxlKTtcclxuXHJcbiAgICAgICAgdGhpcy5fYWRkVG9nZ2xlQnV0dG9uKHsgaWQsIHRpdGxlLCB2aWV3LCBvcHRpb25zLCBkaXNwb3NhYmxlOiBjZCB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIDxJRGlzcG9zYWJsZT5kaXNwb3NhYmxlO1xyXG4gICAgfVxyXG59XHJcblxyXG4oPGFueT5leHBvcnRzKS5Eb2NrV2luZG93ID0gKDxhbnk+ZG9jdW1lbnQpLnJlZ2lzdGVyRWxlbWVudChcIm9tbmlzaGFycC1kb2NrLXdpbmRvd1wiLCB7IHByb3RvdHlwZTogRG9ja1dpbmRvdy5wcm90b3R5cGUgfSk7XHJcblxyXG5leHBvcnQgY2xhc3MgUmVzaXplciBleHRlbmRzIEhUTUxEaXZFbGVtZW50IGltcGxlbWVudHMgV2ViQ29tcG9uZW50IHtcclxuICAgIHByaXZhdGUgZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxuICAgIHB1YmxpYyB1cGRhdGU6IChsb2NhdGlvbjogeyBsZWZ0OiBudW1iZXI7IHRvcDogbnVtYmVyIH0pID0+IHZvaWQ7XHJcbiAgICBwdWJsaWMgZG9uZTogKCkgPT4gdm9pZDtcclxuICAgIHB1YmxpYyBzdGFydDogKCkgPT4gdm9pZDtcclxuXHJcbiAgICBwdWJsaWMgY3JlYXRlZENhbGxiYWNrKCkge1xyXG4gICAgICAgIHRoaXMuY2xhc3NMaXN0LmFkZChcIm9tbmlzaGFycC1hdG9tLW91dHB1dC1yZXNpemVyXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkZXRhY2hlZENhbGxiYWNrKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGF0dGFjaGVkQ2FsbGJhY2soKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgICAgICBjb25zdCBtb3VzZW1vdmUgPSBPYnNlcnZhYmxlLmZyb21FdmVudDxNb3VzZUV2ZW50Pihkb2N1bWVudC5ib2R5LCBcIm1vdXNlbW92ZVwiKS5zaGFyZSgpO1xyXG4gICAgICAgIGNvbnN0IG1vdXNldXAgPSBPYnNlcnZhYmxlLmZyb21FdmVudDxNb3VzZUV2ZW50Pihkb2N1bWVudC5ib2R5LCBcIm1vdXNldXBcIikuc2hhcmUoKTtcclxuICAgICAgICBjb25zdCBtb3VzZWRvd24gPSBPYnNlcnZhYmxlLmZyb21FdmVudDxNb3VzZUV2ZW50Pih0aGlzLCBcIm1vdXNlZG93blwiKS5zaGFyZSgpO1xyXG5cclxuICAgICAgICBjb25zdCBtb3VzZWRyYWcgPSBtb3VzZWRvd24uZmxhdE1hcCgobWQpID0+IHtcclxuICAgICAgICAgICAgY29uc3Qgc3RhcnRYID0gbWQuY2xpZW50WCArIHdpbmRvdy5zY3JvbGxYLFxyXG4gICAgICAgICAgICAgICAgc3RhcnRZID0gbWQuY2xpZW50WSArIHdpbmRvdy5zY3JvbGxZO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIG1vdXNlbW92ZS5tYXAoKG1tKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBtbS5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGVmdDogKHBhcnNlSW50KCg8YW55Pm1kLnRhcmdldCkuc3R5bGUubGVmdCwgMTApIHx8IDApICsgbW0uY2xpZW50WCAtIHN0YXJ0WCxcclxuICAgICAgICAgICAgICAgICAgICB0b3A6IChwYXJzZUludCgoPGFueT5tZC50YXJnZXQpLnN0eWxlLnRvcCwgMTApIHx8IDApICsgbW0uY2xpZW50WSAtIHN0YXJ0WVxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgfSkudGFrZVVudGlsKG1vdXNldXApO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKG1vdXNlZG93bi5zdWJzY3JpYmUoeCA9PiB0aGlzLnN0YXJ0KCkpKTtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKG1vdXNlZHJhZy5zdWJzY3JpYmUoKHgpID0+IHRoaXMudXBkYXRlKHgpLCBudWxsLCAoKSA9PiB0aGlzLmRvbmUoKSkpO1xyXG4gICAgfVxyXG59XHJcblxyXG4oPGFueT5leHBvcnRzKS5SZXNpemVyID0gKDxhbnk+ZG9jdW1lbnQpLnJlZ2lzdGVyRWxlbWVudChcIm9tbmlzaGFycC1yZXNpemVyXCIsIHsgcHJvdG90eXBlOiBSZXNpemVyLnByb3RvdHlwZSB9KTtcclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
