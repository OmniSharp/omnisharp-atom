"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.featureEditorButtons = exports.featureButtons = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _omnisharpClient = require("omnisharp-client");

var _lodash = require("lodash");

var _omni = require("../server/omni");

var _dock = require("../atom/dock");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var buttons = [{
    name: "code-lens",
    config: "omnisharp-atom.codeLens",
    icon: "icon-telescope",
    tooltip: "Enable / Disable Code Lens"
}];
if (_omni.Omni.atomVersion.minor !== 1 || _omni.Omni.atomVersion.minor > 8) {
    buttons.unshift({
        name: "enhanced-highlighting",
        config: "omnisharp-atom.enhancedHighlighting19",
        icon: "icon-pencil",
        tooltip: "Enable / Disable Enhanced Highlighting"
    });
} else {
    buttons.unshift({
        name: "enhanced-highlighting",
        config: "omnisharp-atom.enhancedHighlighting",
        icon: "icon-pencil",
        tooltip: "Enable / Disable Enhanced Highlighting"
    });
}

var FeatureEditorButtons = function () {
    function FeatureEditorButtons() {
        _classCallCheck(this, FeatureEditorButtons);

        this._active = false;
        this.required = false;
        this.title = "Show Editor Feature Buttons";
        this.description = "Shows feature toggle buttons in the editor.";
        this.default = true;
    }

    _createClass(FeatureEditorButtons, [{
        key: "activate",
        value: function activate() {
            this.disposable = new _omnisharpClient.CompositeDisposable();
        }
    }, {
        key: "dispose",
        value: function dispose() {
            this.disposable.dispose();
        }
    }, {
        key: "setup",
        value: function setup(statusBar) {
            this.statusBar = statusBar;
            if (this._active) {
                this._attach();
            }
        }
    }, {
        key: "attach",
        value: function attach() {
            if (this.statusBar) {
                this._attach();
            }
            this._active = true;
        }
    }, {
        key: "_attach",
        value: function _attach() {
            var _this = this;

            (0, _lodash.each)(buttons, function (button, index) {
                return _this._button(button, index);
            });
        }
    }, {
        key: "_button",
        value: function _button(button, index) {
            var _this2 = this;

            var name = button.name;
            var config = button.config;
            var icon = button.icon;
            var tooltip = button.tooltip;

            var view = document.createElement("span");
            view.classList.add("inline-block", name + "-button", icon);
            view.style.display = "none";
            view.onclick = function () {
                return atom.config.set(config, !atom.config.get(config));
            };
            var tooltipDisposable = void 0;
            view.onmouseenter = function () {
                tooltipDisposable = atom.tooltips.add(view, { title: tooltip });
                _this2.disposable.add(tooltipDisposable);
            };
            view.onmouseleave = function () {
                if (tooltipDisposable) {
                    _this2.disposable.remove(tooltipDisposable);
                    tooltipDisposable.dispose();
                }
            };
            var tile = void 0;
            if (atom.config.get("grammar-selector.showOnRightSideOfStatusBar")) {
                tile = this.statusBar.addRightTile({
                    item: view,
                    priority: 9 - index - 1
                });
            } else {
                tile = this.statusBar.addLeftTile({
                    item: view,
                    priority: 11 + index + 1
                });
            }
            this.disposable.add(atom.config.observe(config, function (value) {
                if (value) {
                    view.classList.add("text-success");
                } else {
                    view.classList.remove("text-success");
                }
            }));
            this.disposable.add(_omnisharpClient.Disposable.create(function () {
                tile.destroy();
                view.remove();
            }));
            this.disposable.add(_omni.Omni.activeEditor.subscribe(function (editor) {
                return editor ? view.style.display = "" : view.style.display = "none";
            }));
        }
    }]);

    return FeatureEditorButtons;
}();

var FeatureButtons = function () {
    function FeatureButtons() {
        _classCallCheck(this, FeatureButtons);

        this.required = false;
        this.title = "Show Feature Toggles";
        this.description = "Shows feature toggle buttons in the omnisharp window.";
        this.default = true;
    }

    _createClass(FeatureButtons, [{
        key: "activate",
        value: function activate() {
            var _this3 = this;

            this.disposable = new _omnisharpClient.CompositeDisposable();
            (0, _lodash.each)(buttons, function (button, index) {
                return _this3._button(button, index);
            });
        }
    }, {
        key: "dispose",
        value: function dispose() {
            this.disposable.dispose();
        }
    }, {
        key: "_button",
        value: function _button(button, index) {
            var _this4 = this;

            var config = button.config;

            var buttonDisposable = void 0;
            this.disposable.add(atom.config.observe(config, function (value) {
                if (buttonDisposable) {
                    _this4.disposable.remove(buttonDisposable);
                    buttonDisposable.dispose();
                }
                buttonDisposable = _this4._makeButton(button, index, value);
                _this4.disposable.add(buttonDisposable);
            }));
            this.disposable.add(_omnisharpClient.Disposable.create(function () {
                buttonDisposable.dispose();
            }));
        }
    }, {
        key: "_makeButton",
        value: function _makeButton(button, index, enabled) {
            var _this5 = this;

            var name = button.name;
            var config = button.config;
            var icon = button.icon;
            var tooltip = button.tooltip;

            var tooltipDisposable = void 0;
            var htmlButton = document.createElement("a");
            htmlButton.id = icon + "-name";
            htmlButton.classList.add("btn", icon);
            if (enabled) {
                htmlButton.classList.add("btn-success");
            }
            htmlButton.onclick = function () {
                return atom.config.set(config, !atom.config.get(config));
            };
            htmlButton.onmouseenter = function (e) {
                tooltipDisposable = atom.tooltips.add(e.currentTarget, { title: tooltip });
                _this5.disposable.add(tooltipDisposable);
            };
            htmlButton.onmouseleave = function (e) {
                if (tooltipDisposable) {
                    _this5.disposable.remove(tooltipDisposable);
                    tooltipDisposable.dispose();
                }
            };
            var buttonDisposable = _dock.dock.addButton(name + "-button", tooltip, htmlButton, { priority: 500 + index });
            return buttonDisposable;
        }
    }]);

    return FeatureButtons;
}();

var featureButtons = exports.featureButtons = new FeatureButtons();
var featureEditorButtons = exports.featureEditorButtons = new FeatureEditorButtons();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9hdG9tL2ZlYXR1cmUtYnV0dG9ucy5qcyIsImxpYi9hdG9tL2ZlYXR1cmUtYnV0dG9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7QUFDQTs7OztBQ1NBLElBQU0sVUFBVSxDQUFDO0FBQ1QsVUFBTSxXQURHO0FBRVQsWUFBUSx5QkFGQztBQUdULFVBQU0sZ0JBSEc7QUFJVCxhQUFTO0FBSkEsQ0FBRCxDQUFoQjtBQU9BLElBQUksV0FBSyxXQUFMLENBQWlCLEtBQWpCLEtBQTJCLENBQTNCLElBQWdDLFdBQUssV0FBTCxDQUFpQixLQUFqQixHQUF5QixDQUE3RCxFQUFnRTtBQUM1RCxZQUFRLE9BQVIsQ0FBZ0I7QUFDWixjQUFNLHVCQURNO0FBRVosZ0JBQVEsdUNBRkk7QUFHWixjQUFNLGFBSE07QUFJWixpQkFBUztBQUpHLEtBQWhCO0FBTUgsQ0FQRCxNQU9PO0FBQ0gsWUFBUSxPQUFSLENBQWdCO0FBQ1osY0FBTSx1QkFETTtBQUVaLGdCQUFRLHFDQUZJO0FBR1osY0FBTSxhQUhNO0FBSVosaUJBQVM7QUFKRyxLQUFoQjtBQU1IOztJQUVELG9CO0FBQUEsb0NBQUE7QUFBQTs7QUFHWSxhQUFBLE9BQUEsR0FBVSxLQUFWO0FBNEVELGFBQUEsUUFBQSxHQUFXLEtBQVg7QUFDQSxhQUFBLEtBQUEsR0FBUSw2QkFBUjtBQUNBLGFBQUEsV0FBQSxHQUFjLDZDQUFkO0FBQ0EsYUFBQSxPQUFBLEdBQVUsSUFBVjtBQUNWOzs7O21DQTlFa0I7QUFDWCxpQkFBSyxVQUFMLEdBQWtCLDBDQUFsQjtBQUNIOzs7a0NBRWE7QUFDVixpQkFBSyxVQUFMLENBQWdCLE9BQWhCO0FBQ0g7Ozs4QkFFWSxTLEVBQWM7QUFDdkIsaUJBQUssU0FBTCxHQUFpQixTQUFqQjtBQUVBLGdCQUFJLEtBQUssT0FBVCxFQUFrQjtBQUNkLHFCQUFLLE9BQUw7QUFDSDtBQUNKOzs7aUNBRVk7QUFDVCxnQkFBSSxLQUFLLFNBQVQs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bGUiOiJsaWIvYXRvbS9mZWF0dXJlLWJ1dHRvbnMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlIH0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcbmltcG9ydCB7IGVhY2ggfSBmcm9tIFwibG9kYXNoXCI7XG5pbXBvcnQgeyBPbW5pIH0gZnJvbSBcIi4uL3NlcnZlci9vbW5pXCI7XG5pbXBvcnQgeyBkb2NrIH0gZnJvbSBcIi4uL2F0b20vZG9ja1wiO1xuY29uc3QgYnV0dG9ucyA9IFt7XG4gICAgICAgIG5hbWU6IFwiY29kZS1sZW5zXCIsXG4gICAgICAgIGNvbmZpZzogXCJvbW5pc2hhcnAtYXRvbS5jb2RlTGVuc1wiLFxuICAgICAgICBpY29uOiBcImljb24tdGVsZXNjb3BlXCIsXG4gICAgICAgIHRvb2x0aXA6IFwiRW5hYmxlIC8gRGlzYWJsZSBDb2RlIExlbnNcIlxuICAgIH1dO1xuaWYgKE9tbmkuYXRvbVZlcnNpb24ubWlub3IgIT09IDEgfHwgT21uaS5hdG9tVmVyc2lvbi5taW5vciA+IDgpIHtcbiAgICBidXR0b25zLnVuc2hpZnQoe1xuICAgICAgICBuYW1lOiBcImVuaGFuY2VkLWhpZ2hsaWdodGluZ1wiLFxuICAgICAgICBjb25maWc6IFwib21uaXNoYXJwLWF0b20uZW5oYW5jZWRIaWdobGlnaHRpbmcxOVwiLFxuICAgICAgICBpY29uOiBcImljb24tcGVuY2lsXCIsXG4gICAgICAgIHRvb2x0aXA6IFwiRW5hYmxlIC8gRGlzYWJsZSBFbmhhbmNlZCBIaWdobGlnaHRpbmdcIlxuICAgIH0pO1xufVxuZWxzZSB7XG4gICAgYnV0dG9ucy51bnNoaWZ0KHtcbiAgICAgICAgbmFtZTogXCJlbmhhbmNlZC1oaWdobGlnaHRpbmdcIixcbiAgICAgICAgY29uZmlnOiBcIm9tbmlzaGFycC1hdG9tLmVuaGFuY2VkSGlnaGxpZ2h0aW5nXCIsXG4gICAgICAgIGljb246IFwiaWNvbi1wZW5jaWxcIixcbiAgICAgICAgdG9vbHRpcDogXCJFbmFibGUgLyBEaXNhYmxlIEVuaGFuY2VkIEhpZ2hsaWdodGluZ1wiXG4gICAgfSk7XG59XG5jbGFzcyBGZWF0dXJlRWRpdG9yQnV0dG9ucyB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuX2FjdGl2ZSA9IGZhbHNlO1xuICAgICAgICB0aGlzLnJlcXVpcmVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMudGl0bGUgPSBcIlNob3cgRWRpdG9yIEZlYXR1cmUgQnV0dG9uc1wiO1xuICAgICAgICB0aGlzLmRlc2NyaXB0aW9uID0gXCJTaG93cyBmZWF0dXJlIHRvZ2dsZSBidXR0b25zIGluIHRoZSBlZGl0b3IuXCI7XG4gICAgICAgIHRoaXMuZGVmYXVsdCA9IHRydWU7XG4gICAgfVxuICAgIGFjdGl2YXRlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgIH1cbiAgICBkaXNwb3NlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgIH1cbiAgICBzZXR1cChzdGF0dXNCYXIpIHtcbiAgICAgICAgdGhpcy5zdGF0dXNCYXIgPSBzdGF0dXNCYXI7XG4gICAgICAgIGlmICh0aGlzLl9hY3RpdmUpIHtcbiAgICAgICAgICAgIHRoaXMuX2F0dGFjaCgpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGF0dGFjaCgpIHtcbiAgICAgICAgaWYgKHRoaXMuc3RhdHVzQmFyKSB7XG4gICAgICAgICAgICB0aGlzLl9hdHRhY2goKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9hY3RpdmUgPSB0cnVlO1xuICAgIH1cbiAgICBfYXR0YWNoKCkge1xuICAgICAgICBlYWNoKGJ1dHRvbnMsIChidXR0b24sIGluZGV4KSA9PiB0aGlzLl9idXR0b24oYnV0dG9uLCBpbmRleCkpO1xuICAgIH1cbiAgICBfYnV0dG9uKGJ1dHRvbiwgaW5kZXgpIHtcbiAgICAgICAgY29uc3QgeyBuYW1lLCBjb25maWcsIGljb24sIHRvb2x0aXAgfSA9IGJ1dHRvbjtcbiAgICAgICAgY29uc3QgdmlldyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICB2aWV3LmNsYXNzTGlzdC5hZGQoXCJpbmxpbmUtYmxvY2tcIiwgYCR7bmFtZX0tYnV0dG9uYCwgaWNvbik7XG4gICAgICAgIHZpZXcuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICB2aWV3Lm9uY2xpY2sgPSAoKSA9PiBhdG9tLmNvbmZpZy5zZXQoY29uZmlnLCAhYXRvbS5jb25maWcuZ2V0KGNvbmZpZykpO1xuICAgICAgICBsZXQgdG9vbHRpcERpc3Bvc2FibGU7XG4gICAgICAgIHZpZXcub25tb3VzZWVudGVyID0gKCkgPT4ge1xuICAgICAgICAgICAgdG9vbHRpcERpc3Bvc2FibGUgPSBhdG9tLnRvb2x0aXBzLmFkZCh2aWV3LCB7IHRpdGxlOiB0b29sdGlwIH0pO1xuICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZCh0b29sdGlwRGlzcG9zYWJsZSk7XG4gICAgICAgIH07XG4gICAgICAgIHZpZXcub25tb3VzZWxlYXZlID0gKCkgPT4ge1xuICAgICAgICAgICAgaWYgKHRvb2x0aXBEaXNwb3NhYmxlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLnJlbW92ZSh0b29sdGlwRGlzcG9zYWJsZSk7XG4gICAgICAgICAgICAgICAgdG9vbHRpcERpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBsZXQgdGlsZTtcbiAgICAgICAgaWYgKGF0b20uY29uZmlnLmdldChcImdyYW1tYXItc2VsZWN0b3Iuc2hvd09uUmlnaHRTaWRlT2ZTdGF0dXNCYXJcIikpIHtcbiAgICAgICAgICAgIHRpbGUgPSB0aGlzLnN0YXR1c0Jhci5hZGRSaWdodFRpbGUoe1xuICAgICAgICAgICAgICAgIGl0ZW06IHZpZXcsXG4gICAgICAgICAgICAgICAgcHJpb3JpdHk6IDkgLSBpbmRleCAtIDFcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGlsZSA9IHRoaXMuc3RhdHVzQmFyLmFkZExlZnRUaWxlKHtcbiAgICAgICAgICAgICAgICBpdGVtOiB2aWV3LFxuICAgICAgICAgICAgICAgIHByaW9yaXR5OiAxMSArIGluZGV4ICsgMVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbmZpZy5vYnNlcnZlKGNvbmZpZywgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICB2aWV3LmNsYXNzTGlzdC5hZGQoXCJ0ZXh0LXN1Y2Nlc3NcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB2aWV3LmNsYXNzTGlzdC5yZW1vdmUoXCJ0ZXh0LXN1Y2Nlc3NcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XG4gICAgICAgICAgICB0aWxlLmRlc3Ryb3koKTtcbiAgICAgICAgICAgIHZpZXcucmVtb3ZlKCk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmFjdGl2ZUVkaXRvclxuICAgICAgICAgICAgLnN1YnNjcmliZSgoZWRpdG9yKSA9PiBlZGl0b3IgPyAodmlldy5zdHlsZS5kaXNwbGF5ID0gXCJcIikgOiAodmlldy5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCIpKSk7XG4gICAgfVxufVxuY2xhc3MgRmVhdHVyZUJ1dHRvbnMge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLnJlcXVpcmVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMudGl0bGUgPSBcIlNob3cgRmVhdHVyZSBUb2dnbGVzXCI7XG4gICAgICAgIHRoaXMuZGVzY3JpcHRpb24gPSBcIlNob3dzIGZlYXR1cmUgdG9nZ2xlIGJ1dHRvbnMgaW4gdGhlIG9tbmlzaGFycCB3aW5kb3cuXCI7XG4gICAgICAgIHRoaXMuZGVmYXVsdCA9IHRydWU7XG4gICAgfVxuICAgIGFjdGl2YXRlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICBlYWNoKGJ1dHRvbnMsIChidXR0b24sIGluZGV4KSA9PiB0aGlzLl9idXR0b24oYnV0dG9uLCBpbmRleCkpO1xuICAgIH1cbiAgICBkaXNwb3NlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgIH1cbiAgICBfYnV0dG9uKGJ1dHRvbiwgaW5kZXgpIHtcbiAgICAgICAgY29uc3QgeyBjb25maWcgfSA9IGJ1dHRvbjtcbiAgICAgICAgbGV0IGJ1dHRvbkRpc3Bvc2FibGU7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb25maWcub2JzZXJ2ZShjb25maWcsICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgaWYgKGJ1dHRvbkRpc3Bvc2FibGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUucmVtb3ZlKGJ1dHRvbkRpc3Bvc2FibGUpO1xuICAgICAgICAgICAgICAgIGJ1dHRvbkRpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnV0dG9uRGlzcG9zYWJsZSA9IHRoaXMuX21ha2VCdXR0b24oYnV0dG9uLCBpbmRleCwgdmFsdWUpO1xuICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChidXR0b25EaXNwb3NhYmxlKTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcbiAgICAgICAgICAgIGJ1dHRvbkRpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgICAgICB9KSk7XG4gICAgfVxuICAgIF9tYWtlQnV0dG9uKGJ1dHRvbiwgaW5kZXgsIGVuYWJsZWQpIHtcbiAgICAgICAgY29uc3QgeyBuYW1lLCBjb25maWcsIGljb24sIHRvb2x0aXAgfSA9IGJ1dHRvbjtcbiAgICAgICAgbGV0IHRvb2x0aXBEaXNwb3NhYmxlO1xuICAgICAgICBjb25zdCBodG1sQnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImFcIik7XG4gICAgICAgIGh0bWxCdXR0b24uaWQgPSBgJHtpY29ufS1uYW1lYDtcbiAgICAgICAgaHRtbEJ1dHRvbi5jbGFzc0xpc3QuYWRkKFwiYnRuXCIsIGljb24pO1xuICAgICAgICBpZiAoZW5hYmxlZCkge1xuICAgICAgICAgICAgaHRtbEJ1dHRvbi5jbGFzc0xpc3QuYWRkKFwiYnRuLXN1Y2Nlc3NcIik7XG4gICAgICAgIH1cbiAgICAgICAgaHRtbEJ1dHRvbi5vbmNsaWNrID0gKCkgPT4gYXRvbS5jb25maWcuc2V0KGNvbmZpZywgIWF0b20uY29uZmlnLmdldChjb25maWcpKTtcbiAgICAgICAgaHRtbEJ1dHRvbi5vbm1vdXNlZW50ZXIgPSAoZSkgPT4ge1xuICAgICAgICAgICAgdG9vbHRpcERpc3Bvc2FibGUgPSBhdG9tLnRvb2x0aXBzLmFkZChlLmN1cnJlbnRUYXJnZXQsIHsgdGl0bGU6IHRvb2x0aXAgfSk7XG4gICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKHRvb2x0aXBEaXNwb3NhYmxlKTtcbiAgICAgICAgfTtcbiAgICAgICAgaHRtbEJ1dHRvbi5vbm1vdXNlbGVhdmUgPSAoZSkgPT4ge1xuICAgICAgICAgICAgaWYgKHRvb2x0aXBEaXNwb3NhYmxlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLnJlbW92ZSh0b29sdGlwRGlzcG9zYWJsZSk7XG4gICAgICAgICAgICAgICAgdG9vbHRpcERpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBjb25zdCBidXR0b25EaXNwb3NhYmxlID0gZG9jay5hZGRCdXR0b24oYCR7bmFtZX0tYnV0dG9uYCwgdG9vbHRpcCwgaHRtbEJ1dHRvbiwgeyBwcmlvcml0eTogNTAwICsgaW5kZXggfSk7XG4gICAgICAgIHJldHVybiBidXR0b25EaXNwb3NhYmxlO1xuICAgIH1cbn1cbmV4cG9ydCBjb25zdCBmZWF0dXJlQnV0dG9ucyA9IG5ldyBGZWF0dXJlQnV0dG9ucygpO1xuZXhwb3J0IGNvbnN0IGZlYXR1cmVFZGl0b3JCdXR0b25zID0gbmV3IEZlYXR1cmVFZGl0b3JCdXR0b25zKCk7XG4iLCJpbXBvcnQge0NvbXBvc2l0ZURpc3Bvc2FibGUsIERpc3Bvc2FibGUsIElEaXNwb3NhYmxlfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xyXG5pbXBvcnQge2VhY2h9IGZyb20gXCJsb2Rhc2hcIjtcclxuaW1wb3J0IHtPbW5pfSBmcm9tIFwiLi4vc2VydmVyL29tbmlcIjtcclxuaW1wb3J0IHtkb2NrfSBmcm9tIFwiLi4vYXRvbS9kb2NrXCI7XHJcblxyXG5pbnRlcmZhY2UgSUJ1dHRvbiB7XHJcbiAgICBuYW1lOiBzdHJpbmc7XHJcbiAgICBjb25maWc6IHN0cmluZztcclxuICAgIGljb246IHN0cmluZztcclxuICAgIHRvb2x0aXA6IHN0cmluZztcclxufVxyXG5cclxuY29uc3QgYnV0dG9ucyA9IFt7XHJcbiAgICAgICAgbmFtZTogXCJjb2RlLWxlbnNcIixcclxuICAgICAgICBjb25maWc6IFwib21uaXNoYXJwLWF0b20uY29kZUxlbnNcIixcclxuICAgICAgICBpY29uOiBcImljb24tdGVsZXNjb3BlXCIsXHJcbiAgICAgICAgdG9vbHRpcDogXCJFbmFibGUgLyBEaXNhYmxlIENvZGUgTGVuc1wiXHJcbiAgICB9XTtcclxuXHJcbmlmIChPbW5pLmF0b21WZXJzaW9uLm1pbm9yICE9PSAxIHx8IE9tbmkuYXRvbVZlcnNpb24ubWlub3IgPiA4KSB7XHJcbiAgICBidXR0b25zLnVuc2hpZnQoe1xyXG4gICAgICAgIG5hbWU6IFwiZW5oYW5jZWQtaGlnaGxpZ2h0aW5nXCIsXHJcbiAgICAgICAgY29uZmlnOiBcIm9tbmlzaGFycC1hdG9tLmVuaGFuY2VkSGlnaGxpZ2h0aW5nMTlcIixcclxuICAgICAgICBpY29uOiBcImljb24tcGVuY2lsXCIsXHJcbiAgICAgICAgdG9vbHRpcDogXCJFbmFibGUgLyBEaXNhYmxlIEVuaGFuY2VkIEhpZ2hsaWdodGluZ1wiXHJcbiAgICB9KTtcclxufSBlbHNlIHtcclxuICAgIGJ1dHRvbnMudW5zaGlmdCh7XHJcbiAgICAgICAgbmFtZTogXCJlbmhhbmNlZC1oaWdobGlnaHRpbmdcIixcclxuICAgICAgICBjb25maWc6IFwib21uaXNoYXJwLWF0b20uZW5oYW5jZWRIaWdobGlnaHRpbmdcIixcclxuICAgICAgICBpY29uOiBcImljb24tcGVuY2lsXCIsXHJcbiAgICAgICAgdG9vbHRpcDogXCJFbmFibGUgLyBEaXNhYmxlIEVuaGFuY2VkIEhpZ2hsaWdodGluZ1wiXHJcbiAgICB9KTtcclxufVxyXG5cclxuY2xhc3MgRmVhdHVyZUVkaXRvckJ1dHRvbnMgaW1wbGVtZW50cyBJQXRvbUZlYXR1cmUge1xyXG4gICAgcHJpdmF0ZSBkaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xyXG4gICAgcHJpdmF0ZSBzdGF0dXNCYXI6IGFueTtcclxuICAgIHByaXZhdGUgX2FjdGl2ZSA9IGZhbHNlO1xyXG5cclxuICAgIHB1YmxpYyBhY3RpdmF0ZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkaXNwb3NlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHNldHVwKHN0YXR1c0JhcjogYW55KSB7XHJcbiAgICAgICAgdGhpcy5zdGF0dXNCYXIgPSBzdGF0dXNCYXI7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9hY3RpdmUpIHtcclxuICAgICAgICAgICAgdGhpcy5fYXR0YWNoKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBhdHRhY2goKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuc3RhdHVzQmFyKSB7IHRoaXMuX2F0dGFjaCgpOyB9XHJcbiAgICAgICAgdGhpcy5fYWN0aXZlID0gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9hdHRhY2goKSB7XHJcbiAgICAgICAgZWFjaChidXR0b25zLCAoYnV0dG9uLCBpbmRleCkgPT4gdGhpcy5fYnV0dG9uKGJ1dHRvbiwgaW5kZXgpKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9idXR0b24oYnV0dG9uOiBJQnV0dG9uLCBpbmRleDogbnVtYmVyKSB7XHJcbiAgICAgICAgY29uc3Qge25hbWUsIGNvbmZpZywgaWNvbiwgdG9vbHRpcH0gPSBidXR0b247XHJcbiAgICAgICAgY29uc3QgdmlldyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xyXG4gICAgICAgIHZpZXcuY2xhc3NMaXN0LmFkZChcImlubGluZS1ibG9ja1wiLCBgJHtuYW1lfS1idXR0b25gLCBpY29uKTtcclxuICAgICAgICB2aWV3LnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcclxuICAgICAgICB2aWV3Lm9uY2xpY2sgPSAoKSA9PiBhdG9tLmNvbmZpZy5zZXQoY29uZmlnLCAhYXRvbS5jb25maWcuZ2V0KGNvbmZpZykpO1xyXG5cclxuICAgICAgICBsZXQgdG9vbHRpcERpc3Bvc2FibGU6IElEaXNwb3NhYmxlO1xyXG4gICAgICAgIHZpZXcub25tb3VzZWVudGVyID0gKCkgPT4ge1xyXG4gICAgICAgICAgICB0b29sdGlwRGlzcG9zYWJsZSA9IGF0b20udG9vbHRpcHMuYWRkKHZpZXcsIHsgdGl0bGU6IHRvb2x0aXAgfSk7XHJcbiAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQodG9vbHRpcERpc3Bvc2FibGUpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgdmlldy5vbm1vdXNlbGVhdmUgPSAoKSA9PiB7XHJcbiAgICAgICAgICAgIGlmICh0b29sdGlwRGlzcG9zYWJsZSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLnJlbW92ZSh0b29sdGlwRGlzcG9zYWJsZSk7XHJcbiAgICAgICAgICAgICAgICB0b29sdGlwRGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBsZXQgdGlsZTogYW55O1xyXG4gICAgICAgIGlmIChhdG9tLmNvbmZpZy5nZXQoXCJncmFtbWFyLXNlbGVjdG9yLnNob3dPblJpZ2h0U2lkZU9mU3RhdHVzQmFyXCIpKSB7XHJcbiAgICAgICAgICAgIHRpbGUgPSB0aGlzLnN0YXR1c0Jhci5hZGRSaWdodFRpbGUoe1xyXG4gICAgICAgICAgICAgICAgaXRlbTogdmlldyxcclxuICAgICAgICAgICAgICAgIHByaW9yaXR5OiA5IC0gaW5kZXggLSAxXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRpbGUgPSB0aGlzLnN0YXR1c0Jhci5hZGRMZWZ0VGlsZSh7XHJcbiAgICAgICAgICAgICAgICBpdGVtOiB2aWV3LFxyXG4gICAgICAgICAgICAgICAgcHJpb3JpdHk6IDExICsgaW5kZXggKyAxXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbmZpZy5vYnNlcnZlKGNvbmZpZywgKHZhbHVlOiBib29sZWFuKSA9PiB7XHJcbiAgICAgICAgICAgIGlmICh2YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgdmlldy5jbGFzc0xpc3QuYWRkKFwidGV4dC1zdWNjZXNzXCIpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdmlldy5jbGFzc0xpc3QucmVtb3ZlKFwidGV4dC1zdWNjZXNzXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcclxuICAgICAgICAgICAgdGlsZS5kZXN0cm95KCk7XHJcbiAgICAgICAgICAgIHZpZXcucmVtb3ZlKCk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuYWN0aXZlRWRpdG9yXHJcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoKGVkaXRvcikgPT4gZWRpdG9yID8gKHZpZXcuc3R5bGUuZGlzcGxheSA9IFwiXCIpIDogKHZpZXcuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiKSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZXF1aXJlZCA9IGZhbHNlO1xyXG4gICAgcHVibGljIHRpdGxlID0gXCJTaG93IEVkaXRvciBGZWF0dXJlIEJ1dHRvbnNcIjtcclxuICAgIHB1YmxpYyBkZXNjcmlwdGlvbiA9IFwiU2hvd3MgZmVhdHVyZSB0b2dnbGUgYnV0dG9ucyBpbiB0aGUgZWRpdG9yLlwiO1xyXG4gICAgcHVibGljIGRlZmF1bHQgPSB0cnVlO1xyXG59XHJcblxyXG5jbGFzcyBGZWF0dXJlQnV0dG9ucyBpbXBsZW1lbnRzIElGZWF0dXJlIHtcclxuICAgIHByaXZhdGUgZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxuXHJcbiAgICBwdWJsaWMgYWN0aXZhdGUoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgICAgICBlYWNoKGJ1dHRvbnMsIChidXR0b24sIGluZGV4KSA9PiB0aGlzLl9idXR0b24oYnV0dG9uLCBpbmRleCkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkaXNwb3NlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfYnV0dG9uKGJ1dHRvbjogSUJ1dHRvbiwgaW5kZXg6IG51bWJlcikge1xyXG4gICAgICAgIGNvbnN0IHtjb25maWd9ID0gYnV0dG9uO1xyXG5cclxuICAgICAgICBsZXQgYnV0dG9uRGlzcG9zYWJsZTogSURpc3Bvc2FibGU7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbmZpZy5vYnNlcnZlKGNvbmZpZywgKHZhbHVlOiBib29sZWFuKSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChidXR0b25EaXNwb3NhYmxlKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUucmVtb3ZlKGJ1dHRvbkRpc3Bvc2FibGUpO1xyXG4gICAgICAgICAgICAgICAgYnV0dG9uRGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGJ1dHRvbkRpc3Bvc2FibGUgPSB0aGlzLl9tYWtlQnV0dG9uKGJ1dHRvbiwgaW5kZXgsIHZhbHVlKTtcclxuICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChidXR0b25EaXNwb3NhYmxlKTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xyXG4gICAgICAgICAgICBidXR0b25EaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgICAgICB9KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfbWFrZUJ1dHRvbihidXR0b246IElCdXR0b24sIGluZGV4OiBudW1iZXIsIGVuYWJsZWQ6IGJvb2xlYW4pIHtcclxuICAgICAgICBjb25zdCB7bmFtZSwgY29uZmlnLCBpY29uLCB0b29sdGlwfSA9IGJ1dHRvbjtcclxuXHJcbiAgICAgICAgbGV0IHRvb2x0aXBEaXNwb3NhYmxlOiBJRGlzcG9zYWJsZTtcclxuICAgICAgICBjb25zdCBodG1sQnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImFcIik7XHJcbiAgICAgICAgaHRtbEJ1dHRvbi5pZCA9IGAke2ljb259LW5hbWVgO1xyXG4gICAgICAgIGh0bWxCdXR0b24uY2xhc3NMaXN0LmFkZChcImJ0blwiLGljb24pO1xyXG4gICAgICAgIGlmIChlbmFibGVkKSB7XHJcbiAgICAgICAgICAgIGh0bWxCdXR0b24uY2xhc3NMaXN0LmFkZChcImJ0bi1zdWNjZXNzXCIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaHRtbEJ1dHRvbi5vbmNsaWNrID0gKCkgPT4gYXRvbS5jb25maWcuc2V0KGNvbmZpZywgIWF0b20uY29uZmlnLmdldChjb25maWcpKTtcclxuICAgICAgICBodG1sQnV0dG9uLm9ubW91c2VlbnRlciA9IChlKSA9PiB7XHJcbiAgICAgICAgICAgIHRvb2x0aXBEaXNwb3NhYmxlID0gYXRvbS50b29sdGlwcy5hZGQoPGFueT5lLmN1cnJlbnRUYXJnZXQsIHsgdGl0bGU6IHRvb2x0aXAgfSk7XHJcbiAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQodG9vbHRpcERpc3Bvc2FibGUpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgaHRtbEJ1dHRvbi5vbm1vdXNlbGVhdmUgPSAoZSkgPT4ge1xyXG4gICAgICAgICAgICBpZiAodG9vbHRpcERpc3Bvc2FibGUpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5yZW1vdmUodG9vbHRpcERpc3Bvc2FibGUpO1xyXG4gICAgICAgICAgICAgICAgdG9vbHRpcERpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgY29uc3QgYnV0dG9uRGlzcG9zYWJsZSA9IGRvY2suYWRkQnV0dG9uKFxyXG4gICAgICAgICAgICBgJHtuYW1lfS1idXR0b25gLFxyXG4gICAgICAgICAgICB0b29sdGlwLFxyXG4gICAgICAgICAgICBodG1sQnV0dG9uLFxyXG4gICAgICAgICAgICB7IHByaW9yaXR5OiA1MDAgKyBpbmRleCB9XHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGJ1dHRvbkRpc3Bvc2FibGU7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlcXVpcmVkID0gZmFsc2U7XHJcbiAgICBwdWJsaWMgdGl0bGUgPSBcIlNob3cgRmVhdHVyZSBUb2dnbGVzXCI7XHJcbiAgICBwdWJsaWMgZGVzY3JpcHRpb24gPSBcIlNob3dzIGZlYXR1cmUgdG9nZ2xlIGJ1dHRvbnMgaW4gdGhlIG9tbmlzaGFycCB3aW5kb3cuXCI7XHJcbiAgICBwdWJsaWMgZGVmYXVsdCA9IHRydWU7XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBmZWF0dXJlQnV0dG9ucyA9IG5ldyBGZWF0dXJlQnV0dG9ucygpO1xyXG5leHBvcnQgY29uc3QgZmVhdHVyZUVkaXRvckJ1dHRvbnMgPSBuZXcgRmVhdHVyZUVkaXRvckJ1dHRvbnMoKTtcclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
