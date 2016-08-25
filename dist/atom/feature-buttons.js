"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.featureEditorButtons = exports.featureButtons = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _tsDisposables = require("ts-disposables");

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
            this.disposable = new _tsDisposables.CompositeDisposable();
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
            this.disposable.add(_tsDisposables.Disposable.create(function () {
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

            this.disposable = new _tsDisposables.CompositeDisposable();
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
            this.disposable.add(_tsDisposables.Disposable.create(function () {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9hdG9tL2ZlYXR1cmUtYnV0dG9ucy5qcyIsImxpYi9hdG9tL2ZlYXR1cmUtYnV0dG9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7QUFDQTs7OztBQ1NBLElBQU0sVUFBVSxDQUFDO0FBQ1QsVUFBTSxXQUFOO0FBQ0EsWUFBUSx5QkFBUjtBQUNBLFVBQU0sZ0JBQU47QUFDQSxhQUFTLDRCQUFUO0NBSlEsQ0FBVjtBQU9OLElBQUksV0FBSyxXQUFMLENBQWlCLEtBQWpCLEtBQTJCLENBQTNCLElBQWdDLFdBQUssV0FBTCxDQUFpQixLQUFqQixHQUF5QixDQUF6QixFQUE0QjtBQUM1RCxZQUFRLE9BQVIsQ0FBZ0I7QUFDWixjQUFNLHVCQUFOO0FBQ0EsZ0JBQVEsdUNBQVI7QUFDQSxjQUFNLGFBQU47QUFDQSxpQkFBUyx3Q0FBVDtLQUpKLEVBRDREO0NBQWhFLE1BT087QUFDSCxZQUFRLE9BQVIsQ0FBZ0I7QUFDWixjQUFNLHVCQUFOO0FBQ0EsZ0JBQVEscUNBQVI7QUFDQSxjQUFNLGFBQU47QUFDQSxpQkFBUyx3Q0FBVDtLQUpKLEVBREc7Q0FQUDs7SUFnQkE7QUFBQSxvQ0FBQTs7O0FBR1ksYUFBQSxPQUFBLEdBQVUsS0FBVixDQUhaO0FBK0VXLGFBQUEsUUFBQSxHQUFXLEtBQVgsQ0EvRVg7QUFnRlcsYUFBQSxLQUFBLEdBQVEsNkJBQVIsQ0FoRlg7QUFpRlcsYUFBQSxXQUFBLEdBQWMsNkNBQWQsQ0FqRlg7QUFrRlcsYUFBQSxPQUFBLEdBQVUsSUFBVixDQWxGWDtLQUFBOzs7O21DQUttQjtBQUNYLGlCQUFLLFVBQUwsR0FBa0Isd0NBQWxCLENBRFc7Ozs7a0NBSUQ7QUFDVixpQkFBSyxVQUFMLENBQWdCLE9BQWhCLEdBRFU7Ozs7OEJBSUQsV0FBYztBQUN2QixpQkFBSyxTQUFMLEdBQWlCLFNBQWpCLENBRHVCO0FBR3ZCLGdCQUFJLEtBQUssT0FBTCxFQUFjO0FBQ2QscUJBQUssT0FBTCxH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SUFBTSwwQ0FBaUIsSUFBSSxjQUFKLEVBQWpCO0FBQ04sSUFBTSxzREFBdUIsSUFBSSxvQkFBSixFQUF2QiIsImZpbGUiOiJsaWIvYXRvbS9mZWF0dXJlLWJ1dHRvbnMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlIH0gZnJvbSBcInRzLWRpc3Bvc2FibGVzXCI7XG5pbXBvcnQgeyBlYWNoIH0gZnJvbSBcImxvZGFzaFwiO1xuaW1wb3J0IHsgT21uaSB9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xuaW1wb3J0IHsgZG9jayB9IGZyb20gXCIuLi9hdG9tL2RvY2tcIjtcbmNvbnN0IGJ1dHRvbnMgPSBbe1xuICAgICAgICBuYW1lOiBcImNvZGUtbGVuc1wiLFxuICAgICAgICBjb25maWc6IFwib21uaXNoYXJwLWF0b20uY29kZUxlbnNcIixcbiAgICAgICAgaWNvbjogXCJpY29uLXRlbGVzY29wZVwiLFxuICAgICAgICB0b29sdGlwOiBcIkVuYWJsZSAvIERpc2FibGUgQ29kZSBMZW5zXCJcbiAgICB9XTtcbmlmIChPbW5pLmF0b21WZXJzaW9uLm1pbm9yICE9PSAxIHx8IE9tbmkuYXRvbVZlcnNpb24ubWlub3IgPiA4KSB7XG4gICAgYnV0dG9ucy51bnNoaWZ0KHtcbiAgICAgICAgbmFtZTogXCJlbmhhbmNlZC1oaWdobGlnaHRpbmdcIixcbiAgICAgICAgY29uZmlnOiBcIm9tbmlzaGFycC1hdG9tLmVuaGFuY2VkSGlnaGxpZ2h0aW5nMTlcIixcbiAgICAgICAgaWNvbjogXCJpY29uLXBlbmNpbFwiLFxuICAgICAgICB0b29sdGlwOiBcIkVuYWJsZSAvIERpc2FibGUgRW5oYW5jZWQgSGlnaGxpZ2h0aW5nXCJcbiAgICB9KTtcbn1cbmVsc2Uge1xuICAgIGJ1dHRvbnMudW5zaGlmdCh7XG4gICAgICAgIG5hbWU6IFwiZW5oYW5jZWQtaGlnaGxpZ2h0aW5nXCIsXG4gICAgICAgIGNvbmZpZzogXCJvbW5pc2hhcnAtYXRvbS5lbmhhbmNlZEhpZ2hsaWdodGluZ1wiLFxuICAgICAgICBpY29uOiBcImljb24tcGVuY2lsXCIsXG4gICAgICAgIHRvb2x0aXA6IFwiRW5hYmxlIC8gRGlzYWJsZSBFbmhhbmNlZCBIaWdobGlnaHRpbmdcIlxuICAgIH0pO1xufVxuY2xhc3MgRmVhdHVyZUVkaXRvckJ1dHRvbnMge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLl9hY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5yZXF1aXJlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLnRpdGxlID0gXCJTaG93IEVkaXRvciBGZWF0dXJlIEJ1dHRvbnNcIjtcbiAgICAgICAgdGhpcy5kZXNjcmlwdGlvbiA9IFwiU2hvd3MgZmVhdHVyZSB0b2dnbGUgYnV0dG9ucyBpbiB0aGUgZWRpdG9yLlwiO1xuICAgICAgICB0aGlzLmRlZmF1bHQgPSB0cnVlO1xuICAgIH1cbiAgICBhY3RpdmF0ZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICB9XG4gICAgZGlzcG9zZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICB9XG4gICAgc2V0dXAoc3RhdHVzQmFyKSB7XG4gICAgICAgIHRoaXMuc3RhdHVzQmFyID0gc3RhdHVzQmFyO1xuICAgICAgICBpZiAodGhpcy5fYWN0aXZlKSB7XG4gICAgICAgICAgICB0aGlzLl9hdHRhY2goKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBhdHRhY2goKSB7XG4gICAgICAgIGlmICh0aGlzLnN0YXR1c0Jhcikge1xuICAgICAgICAgICAgdGhpcy5fYXR0YWNoKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fYWN0aXZlID0gdHJ1ZTtcbiAgICB9XG4gICAgX2F0dGFjaCgpIHtcbiAgICAgICAgZWFjaChidXR0b25zLCAoYnV0dG9uLCBpbmRleCkgPT4gdGhpcy5fYnV0dG9uKGJ1dHRvbiwgaW5kZXgpKTtcbiAgICB9XG4gICAgX2J1dHRvbihidXR0b24sIGluZGV4KSB7XG4gICAgICAgIGNvbnN0IHsgbmFtZSwgY29uZmlnLCBpY29uLCB0b29sdGlwIH0gPSBidXR0b247XG4gICAgICAgIGNvbnN0IHZpZXcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgdmlldy5jbGFzc0xpc3QuYWRkKFwiaW5saW5lLWJsb2NrXCIsIGAke25hbWV9LWJ1dHRvbmAsIGljb24pO1xuICAgICAgICB2aWV3LnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgdmlldy5vbmNsaWNrID0gKCkgPT4gYXRvbS5jb25maWcuc2V0KGNvbmZpZywgIWF0b20uY29uZmlnLmdldChjb25maWcpKTtcbiAgICAgICAgbGV0IHRvb2x0aXBEaXNwb3NhYmxlO1xuICAgICAgICB2aWV3Lm9ubW91c2VlbnRlciA9ICgpID0+IHtcbiAgICAgICAgICAgIHRvb2x0aXBEaXNwb3NhYmxlID0gYXRvbS50b29sdGlwcy5hZGQodmlldywgeyB0aXRsZTogdG9vbHRpcCB9KTtcbiAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQodG9vbHRpcERpc3Bvc2FibGUpO1xuICAgICAgICB9O1xuICAgICAgICB2aWV3Lm9ubW91c2VsZWF2ZSA9ICgpID0+IHtcbiAgICAgICAgICAgIGlmICh0b29sdGlwRGlzcG9zYWJsZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5yZW1vdmUodG9vbHRpcERpc3Bvc2FibGUpO1xuICAgICAgICAgICAgICAgIHRvb2x0aXBEaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgbGV0IHRpbGU7XG4gICAgICAgIGlmIChhdG9tLmNvbmZpZy5nZXQoXCJncmFtbWFyLXNlbGVjdG9yLnNob3dPblJpZ2h0U2lkZU9mU3RhdHVzQmFyXCIpKSB7XG4gICAgICAgICAgICB0aWxlID0gdGhpcy5zdGF0dXNCYXIuYWRkUmlnaHRUaWxlKHtcbiAgICAgICAgICAgICAgICBpdGVtOiB2aWV3LFxuICAgICAgICAgICAgICAgIHByaW9yaXR5OiA5IC0gaW5kZXggLSAxXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRpbGUgPSB0aGlzLnN0YXR1c0Jhci5hZGRMZWZ0VGlsZSh7XG4gICAgICAgICAgICAgICAgaXRlbTogdmlldyxcbiAgICAgICAgICAgICAgICBwcmlvcml0eTogMTEgKyBpbmRleCArIDFcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb25maWcub2JzZXJ2ZShjb25maWcsICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgdmlldy5jbGFzc0xpc3QuYWRkKFwidGV4dC1zdWNjZXNzXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdmlldy5jbGFzc0xpc3QucmVtb3ZlKFwidGV4dC1zdWNjZXNzXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xuICAgICAgICAgICAgdGlsZS5kZXN0cm95KCk7XG4gICAgICAgICAgICB2aWV3LnJlbW92ZSgpO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5hY3RpdmVFZGl0b3JcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoKGVkaXRvcikgPT4gZWRpdG9yID8gKHZpZXcuc3R5bGUuZGlzcGxheSA9IFwiXCIpIDogKHZpZXcuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiKSkpO1xuICAgIH1cbn1cbmNsYXNzIEZlYXR1cmVCdXR0b25zIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5yZXF1aXJlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLnRpdGxlID0gXCJTaG93IEZlYXR1cmUgVG9nZ2xlc1wiO1xuICAgICAgICB0aGlzLmRlc2NyaXB0aW9uID0gXCJTaG93cyBmZWF0dXJlIHRvZ2dsZSBidXR0b25zIGluIHRoZSBvbW5pc2hhcnAgd2luZG93LlwiO1xuICAgICAgICB0aGlzLmRlZmF1bHQgPSB0cnVlO1xuICAgIH1cbiAgICBhY3RpdmF0ZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgZWFjaChidXR0b25zLCAoYnV0dG9uLCBpbmRleCkgPT4gdGhpcy5fYnV0dG9uKGJ1dHRvbiwgaW5kZXgpKTtcbiAgICB9XG4gICAgZGlzcG9zZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICB9XG4gICAgX2J1dHRvbihidXR0b24sIGluZGV4KSB7XG4gICAgICAgIGNvbnN0IHsgY29uZmlnIH0gPSBidXR0b247XG4gICAgICAgIGxldCBidXR0b25EaXNwb3NhYmxlO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoY29uZmlnLCAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIGlmIChidXR0b25EaXNwb3NhYmxlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLnJlbW92ZShidXR0b25EaXNwb3NhYmxlKTtcbiAgICAgICAgICAgICAgICBidXR0b25EaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJ1dHRvbkRpc3Bvc2FibGUgPSB0aGlzLl9tYWtlQnV0dG9uKGJ1dHRvbiwgaW5kZXgsIHZhbHVlKTtcbiAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYnV0dG9uRGlzcG9zYWJsZSk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XG4gICAgICAgICAgICBidXR0b25EaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICAgICAgfSkpO1xuICAgIH1cbiAgICBfbWFrZUJ1dHRvbihidXR0b24sIGluZGV4LCBlbmFibGVkKSB7XG4gICAgICAgIGNvbnN0IHsgbmFtZSwgY29uZmlnLCBpY29uLCB0b29sdGlwIH0gPSBidXR0b247XG4gICAgICAgIGxldCB0b29sdGlwRGlzcG9zYWJsZTtcbiAgICAgICAgY29uc3QgaHRtbEJ1dHRvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJhXCIpO1xuICAgICAgICBodG1sQnV0dG9uLmlkID0gYCR7aWNvbn0tbmFtZWA7XG4gICAgICAgIGh0bWxCdXR0b24uY2xhc3NMaXN0LmFkZChcImJ0blwiLCBpY29uKTtcbiAgICAgICAgaWYgKGVuYWJsZWQpIHtcbiAgICAgICAgICAgIGh0bWxCdXR0b24uY2xhc3NMaXN0LmFkZChcImJ0bi1zdWNjZXNzXCIpO1xuICAgICAgICB9XG4gICAgICAgIGh0bWxCdXR0b24ub25jbGljayA9ICgpID0+IGF0b20uY29uZmlnLnNldChjb25maWcsICFhdG9tLmNvbmZpZy5nZXQoY29uZmlnKSk7XG4gICAgICAgIGh0bWxCdXR0b24ub25tb3VzZWVudGVyID0gKGUpID0+IHtcbiAgICAgICAgICAgIHRvb2x0aXBEaXNwb3NhYmxlID0gYXRvbS50b29sdGlwcy5hZGQoZS5jdXJyZW50VGFyZ2V0LCB7IHRpdGxlOiB0b29sdGlwIH0pO1xuICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZCh0b29sdGlwRGlzcG9zYWJsZSk7XG4gICAgICAgIH07XG4gICAgICAgIGh0bWxCdXR0b24ub25tb3VzZWxlYXZlID0gKGUpID0+IHtcbiAgICAgICAgICAgIGlmICh0b29sdGlwRGlzcG9zYWJsZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5yZW1vdmUodG9vbHRpcERpc3Bvc2FibGUpO1xuICAgICAgICAgICAgICAgIHRvb2x0aXBEaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgYnV0dG9uRGlzcG9zYWJsZSA9IGRvY2suYWRkQnV0dG9uKGAke25hbWV9LWJ1dHRvbmAsIHRvb2x0aXAsIGh0bWxCdXR0b24sIHsgcHJpb3JpdHk6IDUwMCArIGluZGV4IH0pO1xuICAgICAgICByZXR1cm4gYnV0dG9uRGlzcG9zYWJsZTtcbiAgICB9XG59XG5leHBvcnQgY29uc3QgZmVhdHVyZUJ1dHRvbnMgPSBuZXcgRmVhdHVyZUJ1dHRvbnMoKTtcbmV4cG9ydCBjb25zdCBmZWF0dXJlRWRpdG9yQnV0dG9ucyA9IG5ldyBGZWF0dXJlRWRpdG9yQnV0dG9ucygpO1xuIiwiaW1wb3J0IHtDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlLCBJRGlzcG9zYWJsZX0gZnJvbSBcInRzLWRpc3Bvc2FibGVzXCI7XHJcbmltcG9ydCB7ZWFjaH0gZnJvbSBcImxvZGFzaFwiO1xyXG5pbXBvcnQge09tbml9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xyXG5pbXBvcnQge2RvY2t9IGZyb20gXCIuLi9hdG9tL2RvY2tcIjtcclxuXHJcbmludGVyZmFjZSBJQnV0dG9uIHtcclxuICAgIG5hbWU6IHN0cmluZztcclxuICAgIGNvbmZpZzogc3RyaW5nO1xyXG4gICAgaWNvbjogc3RyaW5nO1xyXG4gICAgdG9vbHRpcDogc3RyaW5nO1xyXG59XHJcblxyXG5jb25zdCBidXR0b25zID0gW3tcclxuICAgICAgICBuYW1lOiBcImNvZGUtbGVuc1wiLFxyXG4gICAgICAgIGNvbmZpZzogXCJvbW5pc2hhcnAtYXRvbS5jb2RlTGVuc1wiLFxyXG4gICAgICAgIGljb246IFwiaWNvbi10ZWxlc2NvcGVcIixcclxuICAgICAgICB0b29sdGlwOiBcIkVuYWJsZSAvIERpc2FibGUgQ29kZSBMZW5zXCJcclxuICAgIH1dO1xyXG5cclxuaWYgKE9tbmkuYXRvbVZlcnNpb24ubWlub3IgIT09IDEgfHwgT21uaS5hdG9tVmVyc2lvbi5taW5vciA+IDgpIHtcclxuICAgIGJ1dHRvbnMudW5zaGlmdCh7XHJcbiAgICAgICAgbmFtZTogXCJlbmhhbmNlZC1oaWdobGlnaHRpbmdcIixcclxuICAgICAgICBjb25maWc6IFwib21uaXNoYXJwLWF0b20uZW5oYW5jZWRIaWdobGlnaHRpbmcxOVwiLFxyXG4gICAgICAgIGljb246IFwiaWNvbi1wZW5jaWxcIixcclxuICAgICAgICB0b29sdGlwOiBcIkVuYWJsZSAvIERpc2FibGUgRW5oYW5jZWQgSGlnaGxpZ2h0aW5nXCJcclxuICAgIH0pO1xyXG59IGVsc2Uge1xyXG4gICAgYnV0dG9ucy51bnNoaWZ0KHtcclxuICAgICAgICBuYW1lOiBcImVuaGFuY2VkLWhpZ2hsaWdodGluZ1wiLFxyXG4gICAgICAgIGNvbmZpZzogXCJvbW5pc2hhcnAtYXRvbS5lbmhhbmNlZEhpZ2hsaWdodGluZ1wiLFxyXG4gICAgICAgIGljb246IFwiaWNvbi1wZW5jaWxcIixcclxuICAgICAgICB0b29sdGlwOiBcIkVuYWJsZSAvIERpc2FibGUgRW5oYW5jZWQgSGlnaGxpZ2h0aW5nXCJcclxuICAgIH0pO1xyXG59XHJcblxyXG5jbGFzcyBGZWF0dXJlRWRpdG9yQnV0dG9ucyBpbXBsZW1lbnRzIElBdG9tRmVhdHVyZSB7XHJcbiAgICBwcml2YXRlIGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XHJcbiAgICBwcml2YXRlIHN0YXR1c0JhcjogYW55O1xyXG4gICAgcHJpdmF0ZSBfYWN0aXZlID0gZmFsc2U7XHJcblxyXG4gICAgcHVibGljIGFjdGl2YXRlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2V0dXAoc3RhdHVzQmFyOiBhbnkpIHtcclxuICAgICAgICB0aGlzLnN0YXR1c0JhciA9IHN0YXR1c0JhcjtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX2FjdGl2ZSkge1xyXG4gICAgICAgICAgICB0aGlzLl9hdHRhY2goKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGF0dGFjaCgpIHtcclxuICAgICAgICBpZiAodGhpcy5zdGF0dXNCYXIpIHsgdGhpcy5fYXR0YWNoKCk7IH1cclxuICAgICAgICB0aGlzLl9hY3RpdmUgPSB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX2F0dGFjaCgpIHtcclxuICAgICAgICBlYWNoKGJ1dHRvbnMsIChidXR0b24sIGluZGV4KSA9PiB0aGlzLl9idXR0b24oYnV0dG9uLCBpbmRleCkpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX2J1dHRvbihidXR0b246IElCdXR0b24sIGluZGV4OiBudW1iZXIpIHtcclxuICAgICAgICBjb25zdCB7bmFtZSwgY29uZmlnLCBpY29uLCB0b29sdGlwfSA9IGJ1dHRvbjtcclxuICAgICAgICBjb25zdCB2aWV3ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XHJcbiAgICAgICAgdmlldy5jbGFzc0xpc3QuYWRkKFwiaW5saW5lLWJsb2NrXCIsIGAke25hbWV9LWJ1dHRvbmAsIGljb24pO1xyXG4gICAgICAgIHZpZXcuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xyXG4gICAgICAgIHZpZXcub25jbGljayA9ICgpID0+IGF0b20uY29uZmlnLnNldChjb25maWcsICFhdG9tLmNvbmZpZy5nZXQoY29uZmlnKSk7XHJcblxyXG4gICAgICAgIGxldCB0b29sdGlwRGlzcG9zYWJsZTogSURpc3Bvc2FibGU7XHJcbiAgICAgICAgdmlldy5vbm1vdXNlZW50ZXIgPSAoKSA9PiB7XHJcbiAgICAgICAgICAgIHRvb2x0aXBEaXNwb3NhYmxlID0gYXRvbS50b29sdGlwcy5hZGQodmlldywgeyB0aXRsZTogdG9vbHRpcCB9KTtcclxuICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZCh0b29sdGlwRGlzcG9zYWJsZSk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICB2aWV3Lm9ubW91c2VsZWF2ZSA9ICgpID0+IHtcclxuICAgICAgICAgICAgaWYgKHRvb2x0aXBEaXNwb3NhYmxlKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUucmVtb3ZlKHRvb2x0aXBEaXNwb3NhYmxlKTtcclxuICAgICAgICAgICAgICAgIHRvb2x0aXBEaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGxldCB0aWxlOiBhbnk7XHJcbiAgICAgICAgaWYgKGF0b20uY29uZmlnLmdldChcImdyYW1tYXItc2VsZWN0b3Iuc2hvd09uUmlnaHRTaWRlT2ZTdGF0dXNCYXJcIikpIHtcclxuICAgICAgICAgICAgdGlsZSA9IHRoaXMuc3RhdHVzQmFyLmFkZFJpZ2h0VGlsZSh7XHJcbiAgICAgICAgICAgICAgICBpdGVtOiB2aWV3LFxyXG4gICAgICAgICAgICAgICAgcHJpb3JpdHk6IDkgLSBpbmRleCAtIDFcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGlsZSA9IHRoaXMuc3RhdHVzQmFyLmFkZExlZnRUaWxlKHtcclxuICAgICAgICAgICAgICAgIGl0ZW06IHZpZXcsXHJcbiAgICAgICAgICAgICAgICBwcmlvcml0eTogMTEgKyBpbmRleCArIDFcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoY29uZmlnLCAodmFsdWU6IGJvb2xlYW4pID0+IHtcclxuICAgICAgICAgICAgaWYgKHZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICB2aWV3LmNsYXNzTGlzdC5hZGQoXCJ0ZXh0LXN1Y2Nlc3NcIik7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB2aWV3LmNsYXNzTGlzdC5yZW1vdmUoXCJ0ZXh0LXN1Y2Nlc3NcIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xyXG4gICAgICAgICAgICB0aWxlLmRlc3Ryb3koKTtcclxuICAgICAgICAgICAgdmlldy5yZW1vdmUoKTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5hY3RpdmVFZGl0b3JcclxuICAgICAgICAgICAgLnN1YnNjcmliZSgoZWRpdG9yKSA9PiBlZGl0b3IgPyAodmlldy5zdHlsZS5kaXNwbGF5ID0gXCJcIikgOiAodmlldy5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCIpKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlcXVpcmVkID0gZmFsc2U7XHJcbiAgICBwdWJsaWMgdGl0bGUgPSBcIlNob3cgRWRpdG9yIEZlYXR1cmUgQnV0dG9uc1wiO1xyXG4gICAgcHVibGljIGRlc2NyaXB0aW9uID0gXCJTaG93cyBmZWF0dXJlIHRvZ2dsZSBidXR0b25zIGluIHRoZSBlZGl0b3IuXCI7XHJcbiAgICBwdWJsaWMgZGVmYXVsdCA9IHRydWU7XHJcbn1cclxuXHJcbmNsYXNzIEZlYXR1cmVCdXR0b25zIGltcGxlbWVudHMgSUZlYXR1cmUge1xyXG4gICAgcHJpdmF0ZSBkaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xyXG5cclxuICAgIHB1YmxpYyBhY3RpdmF0ZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG4gICAgICAgIGVhY2goYnV0dG9ucywgKGJ1dHRvbiwgaW5kZXgpID0+IHRoaXMuX2J1dHRvbihidXR0b24sIGluZGV4KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9idXR0b24oYnV0dG9uOiBJQnV0dG9uLCBpbmRleDogbnVtYmVyKSB7XHJcbiAgICAgICAgY29uc3Qge2NvbmZpZ30gPSBidXR0b247XHJcblxyXG4gICAgICAgIGxldCBidXR0b25EaXNwb3NhYmxlOiBJRGlzcG9zYWJsZTtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoY29uZmlnLCAodmFsdWU6IGJvb2xlYW4pID0+IHtcclxuICAgICAgICAgICAgaWYgKGJ1dHRvbkRpc3Bvc2FibGUpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5yZW1vdmUoYnV0dG9uRGlzcG9zYWJsZSk7XHJcbiAgICAgICAgICAgICAgICBidXR0b25EaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgYnV0dG9uRGlzcG9zYWJsZSA9IHRoaXMuX21ha2VCdXR0b24oYnV0dG9uLCBpbmRleCwgdmFsdWUpO1xyXG4gICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGJ1dHRvbkRpc3Bvc2FibGUpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XHJcbiAgICAgICAgICAgIGJ1dHRvbkRpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgICAgIH0pKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9tYWtlQnV0dG9uKGJ1dHRvbjogSUJ1dHRvbiwgaW5kZXg6IG51bWJlciwgZW5hYmxlZDogYm9vbGVhbikge1xyXG4gICAgICAgIGNvbnN0IHtuYW1lLCBjb25maWcsIGljb24sIHRvb2x0aXB9ID0gYnV0dG9uO1xyXG5cclxuICAgICAgICBsZXQgdG9vbHRpcERpc3Bvc2FibGU6IElEaXNwb3NhYmxlO1xyXG4gICAgICAgIGNvbnN0IGh0bWxCdXR0b24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYVwiKTtcclxuICAgICAgICBodG1sQnV0dG9uLmlkID0gYCR7aWNvbn0tbmFtZWA7XHJcbiAgICAgICAgaHRtbEJ1dHRvbi5jbGFzc0xpc3QuYWRkKFwiYnRuXCIsaWNvbik7XHJcbiAgICAgICAgaWYgKGVuYWJsZWQpIHtcclxuICAgICAgICAgICAgaHRtbEJ1dHRvbi5jbGFzc0xpc3QuYWRkKFwiYnRuLXN1Y2Nlc3NcIik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBodG1sQnV0dG9uLm9uY2xpY2sgPSAoKSA9PiBhdG9tLmNvbmZpZy5zZXQoY29uZmlnLCAhYXRvbS5jb25maWcuZ2V0KGNvbmZpZykpO1xyXG4gICAgICAgIGh0bWxCdXR0b24ub25tb3VzZWVudGVyID0gKGUpID0+IHtcclxuICAgICAgICAgICAgdG9vbHRpcERpc3Bvc2FibGUgPSBhdG9tLnRvb2x0aXBzLmFkZCg8YW55PmUuY3VycmVudFRhcmdldCwgeyB0aXRsZTogdG9vbHRpcCB9KTtcclxuICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZCh0b29sdGlwRGlzcG9zYWJsZSk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICBodG1sQnV0dG9uLm9ubW91c2VsZWF2ZSA9IChlKSA9PiB7XHJcbiAgICAgICAgICAgIGlmICh0b29sdGlwRGlzcG9zYWJsZSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLnJlbW92ZSh0b29sdGlwRGlzcG9zYWJsZSk7XHJcbiAgICAgICAgICAgICAgICB0b29sdGlwRGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBjb25zdCBidXR0b25EaXNwb3NhYmxlID0gZG9jay5hZGRCdXR0b24oXHJcbiAgICAgICAgICAgIGAke25hbWV9LWJ1dHRvbmAsXHJcbiAgICAgICAgICAgIHRvb2x0aXAsXHJcbiAgICAgICAgICAgIGh0bWxCdXR0b24sXHJcbiAgICAgICAgICAgIHsgcHJpb3JpdHk6IDUwMCArIGluZGV4IH1cclxuICAgICAgICApO1xyXG5cclxuICAgICAgICByZXR1cm4gYnV0dG9uRGlzcG9zYWJsZTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVxdWlyZWQgPSBmYWxzZTtcclxuICAgIHB1YmxpYyB0aXRsZSA9IFwiU2hvdyBGZWF0dXJlIFRvZ2dsZXNcIjtcclxuICAgIHB1YmxpYyBkZXNjcmlwdGlvbiA9IFwiU2hvd3MgZmVhdHVyZSB0b2dnbGUgYnV0dG9ucyBpbiB0aGUgb21uaXNoYXJwIHdpbmRvdy5cIjtcclxuICAgIHB1YmxpYyBkZWZhdWx0ID0gdHJ1ZTtcclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IGZlYXR1cmVCdXR0b25zID0gbmV3IEZlYXR1cmVCdXR0b25zKCk7XHJcbmV4cG9ydCBjb25zdCBmZWF0dXJlRWRpdG9yQnV0dG9ucyA9IG5ldyBGZWF0dXJlRWRpdG9yQnV0dG9ucygpO1xyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
