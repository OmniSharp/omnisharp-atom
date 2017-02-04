'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.featureEditorButtons = exports.featureButtons = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _tsDisposables = require('ts-disposables');

var _dock = require('../atom/dock');

var _omni = require('../server/omni');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var buttons = [{
    name: 'code-lens',
    config: 'omnisharp-atom.codeLens',
    icon: 'icon-telescope',
    tooltip: 'Enable / Disable Code Lens'
}];
if (_omni.Omni.atomVersion.minor !== 1 || _omni.Omni.atomVersion.minor > 8) {
    buttons.unshift({
        name: 'enhanced-highlighting',
        config: 'omnisharp-atom.enhancedHighlighting19',
        icon: 'icon-pencil',
        tooltip: 'Enable / Disable Enhanced Highlighting'
    });
} else {
    buttons.unshift({
        name: 'enhanced-highlighting',
        config: 'omnisharp-atom.enhancedHighlighting',
        icon: 'icon-pencil',
        tooltip: 'Enable / Disable Enhanced Highlighting'
    });
}

var FeatureEditorButtons = function () {
    function FeatureEditorButtons() {
        _classCallCheck(this, FeatureEditorButtons);

        this._active = false;
        this.required = false;
        this.title = 'Show Editor Feature Buttons';
        this.description = 'Shows feature toggle buttons in the editor.';
        this.default = true;
    }

    _createClass(FeatureEditorButtons, [{
        key: 'activate',
        value: function activate() {
            this.disposable = new _tsDisposables.CompositeDisposable();
        }
    }, {
        key: 'dispose',
        value: function dispose() {
            this.disposable.dispose();
        }
    }, {
        key: 'setup',
        value: function setup(statusBar) {
            this.statusBar = statusBar;
            if (this._active) {
                this._attach();
            }
        }
    }, {
        key: 'attach',
        value: function attach() {
            if (this.statusBar) {
                this._attach();
            }
            this._active = true;
        }
    }, {
        key: '_attach',
        value: function _attach() {
            var _this = this;

            (0, _lodash.each)(buttons, function (button, index) {
                return _this._button(button, index);
            });
        }
    }, {
        key: '_button',
        value: function _button(button, index) {
            var _this2 = this;

            var name = button.name,
                config = button.config,
                icon = button.icon,
                tooltip = button.tooltip;

            var view = document.createElement('span');
            view.classList.add('inline-block', name + '-button', icon);
            view.style.display = 'none';
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
            if (atom.config.get('grammar-selector.showOnRightSideOfStatusBar')) {
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
                    view.classList.add('text-success');
                } else {
                    view.classList.remove('text-success');
                }
            }));
            this.disposable.add(_tsDisposables.Disposable.create(function () {
                tile.destroy();
                view.remove();
            }));
            this.disposable.add(_omni.Omni.activeEditor.subscribe(function (editor) {
                return editor ? view.style.display = '' : view.style.display = 'none';
            }));
        }
    }]);

    return FeatureEditorButtons;
}();

var FeatureButtons = function () {
    function FeatureButtons() {
        _classCallCheck(this, FeatureButtons);

        this.required = false;
        this.title = 'Show Feature Toggles';
        this.description = 'Shows feature toggle buttons in the omnisharp window.';
        this.default = true;
    }

    _createClass(FeatureButtons, [{
        key: 'activate',
        value: function activate() {
            var _this3 = this;

            this.disposable = new _tsDisposables.CompositeDisposable();
            (0, _lodash.each)(buttons, function (button, index) {
                return _this3._button(button, index);
            });
        }
    }, {
        key: 'dispose',
        value: function dispose() {
            this.disposable.dispose();
        }
    }, {
        key: '_button',
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
        key: '_makeButton',
        value: function _makeButton(button, index, enabled) {
            var _this5 = this;

            var name = button.name,
                config = button.config,
                icon = button.icon,
                tooltip = button.tooltip;

            var tooltipDisposable = void 0;
            var htmlButton = document.createElement('a');
            htmlButton.id = icon + '-name';
            htmlButton.classList.add('btn', icon);
            if (enabled) {
                htmlButton.classList.add('btn-success');
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
            var buttonDisposable = _dock.dock.addButton(name + '-button', tooltip, htmlButton, { priority: 500 + index });
            return buttonDisposable;
        }
    }]);

    return FeatureButtons;
}();

var featureButtons = exports.featureButtons = new FeatureButtons();
var featureEditorButtons = exports.featureEditorButtons = new FeatureEditorButtons();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9hdG9tL2ZlYXR1cmUtYnV0dG9ucy50cyJdLCJuYW1lcyI6WyJidXR0b25zIiwibmFtZSIsImNvbmZpZyIsImljb24iLCJ0b29sdGlwIiwiYXRvbVZlcnNpb24iLCJtaW5vciIsInVuc2hpZnQiLCJGZWF0dXJlRWRpdG9yQnV0dG9ucyIsIl9hY3RpdmUiLCJyZXF1aXJlZCIsInRpdGxlIiwiZGVzY3JpcHRpb24iLCJkZWZhdWx0IiwiZGlzcG9zYWJsZSIsImRpc3Bvc2UiLCJzdGF0dXNCYXIiLCJfYXR0YWNoIiwiYnV0dG9uIiwiaW5kZXgiLCJfYnV0dG9uIiwidmlldyIsImRvY3VtZW50IiwiY3JlYXRlRWxlbWVudCIsImNsYXNzTGlzdCIsImFkZCIsInN0eWxlIiwiZGlzcGxheSIsIm9uY2xpY2siLCJhdG9tIiwic2V0IiwiZ2V0IiwidG9vbHRpcERpc3Bvc2FibGUiLCJvbm1vdXNlZW50ZXIiLCJ0b29sdGlwcyIsIm9ubW91c2VsZWF2ZSIsInJlbW92ZSIsInRpbGUiLCJhZGRSaWdodFRpbGUiLCJpdGVtIiwicHJpb3JpdHkiLCJhZGRMZWZ0VGlsZSIsIm9ic2VydmUiLCJ2YWx1ZSIsImNyZWF0ZSIsImRlc3Ryb3kiLCJhY3RpdmVFZGl0b3IiLCJzdWJzY3JpYmUiLCJlZGl0b3IiLCJGZWF0dXJlQnV0dG9ucyIsImJ1dHRvbkRpc3Bvc2FibGUiLCJfbWFrZUJ1dHRvbiIsImVuYWJsZWQiLCJodG1sQnV0dG9uIiwiaWQiLCJlIiwiY3VycmVudFRhcmdldCIsImFkZEJ1dHRvbiIsImZlYXR1cmVCdXR0b25zIiwiZmVhdHVyZUVkaXRvckJ1dHRvbnMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQUNBOztBQUNBOztBQUNBOzs7O0FBU0EsSUFBTUEsVUFBVSxDQUFDO0FBQ1RDLFVBQU0sV0FERztBQUVUQyxZQUFRLHlCQUZDO0FBR1RDLFVBQU0sZ0JBSEc7QUFJVEMsYUFBUztBQUpBLENBQUQsQ0FBaEI7QUFPQSxJQUFJLFdBQUtDLFdBQUws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QUNIOzs7Ozs7QUFRRSxJQUFNUSwwQ0FBaUIsSUFBSVQsY0FBSixFQUF2QjtBQUNBLElBQU1VLHNEQUF1QixJQUFJbkQsb0JBQUosRUFBN0IiLCJmaWxlIjoibGliL2F0b20vZmVhdHVyZS1idXR0b25zLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtlYWNofSBmcm9tICdsb2Rhc2gnO1xyXG5pbXBvcnQge0NvbXBvc2l0ZURpc3Bvc2FibGUsIERpc3Bvc2FibGUsIElEaXNwb3NhYmxlfSBmcm9tICd0cy1kaXNwb3NhYmxlcyc7XHJcbmltcG9ydCB7ZG9ja30gZnJvbSAnLi4vYXRvbS9kb2NrJztcclxuaW1wb3J0IHtPbW5pfSBmcm9tICcuLi9zZXJ2ZXIvb21uaSc7XHJcblxyXG5pbnRlcmZhY2UgSUJ1dHRvbiB7XHJcbiAgICBuYW1lOiBzdHJpbmc7XHJcbiAgICBjb25maWc6IHN0cmluZztcclxuICAgIGljb246IHN0cmluZztcclxuICAgIHRvb2x0aXA6IHN0cmluZztcclxufVxyXG5cclxuY29uc3QgYnV0dG9ucyA9IFt7XHJcbiAgICAgICAgbmFtZTogJ2NvZGUtbGVucycsXHJcbiAgICAgICAgY29uZmlnOiAnb21uaXNoYXJwLWF0b20uY29kZUxlbnMnLFxyXG4gICAgICAgIGljb246ICdpY29uLXRlbGVzY29wZScsXHJcbiAgICAgICAgdG9vbHRpcDogJ0VuYWJsZSAvIERpc2FibGUgQ29kZSBMZW5zJ1xyXG4gICAgfV07XHJcblxyXG5pZiAoT21uaS5hdG9tVmVyc2lvbi5taW5vciAhPT0gMSB8fCBPbW5pLmF0b21WZXJzaW9uLm1pbm9yID4gOCkge1xyXG4gICAgYnV0dG9ucy51bnNoaWZ0KHtcclxuICAgICAgICBuYW1lOiAnZW5oYW5jZWQtaGlnaGxpZ2h0aW5nJyxcclxuICAgICAgICBjb25maWc6ICdvbW5pc2hhcnAtYXRvbS5lbmhhbmNlZEhpZ2hsaWdodGluZzE5JyxcclxuICAgICAgICBpY29uOiAnaWNvbi1wZW5jaWwnLFxyXG4gICAgICAgIHRvb2x0aXA6ICdFbmFibGUgLyBEaXNhYmxlIEVuaGFuY2VkIEhpZ2hsaWdodGluZydcclxuICAgIH0pO1xyXG59IGVsc2Uge1xyXG4gICAgYnV0dG9ucy51bnNoaWZ0KHtcclxuICAgICAgICBuYW1lOiAnZW5oYW5jZWQtaGlnaGxpZ2h0aW5nJyxcclxuICAgICAgICBjb25maWc6ICdvbW5pc2hhcnAtYXRvbS5lbmhhbmNlZEhpZ2hsaWdodGluZycsXHJcbiAgICAgICAgaWNvbjogJ2ljb24tcGVuY2lsJyxcclxuICAgICAgICB0b29sdGlwOiAnRW5hYmxlIC8gRGlzYWJsZSBFbmhhbmNlZCBIaWdobGlnaHRpbmcnXHJcbiAgICB9KTtcclxufVxyXG5cclxuY2xhc3MgRmVhdHVyZUVkaXRvckJ1dHRvbnMgaW1wbGVtZW50cyBJQXRvbUZlYXR1cmUge1xyXG4gICAgcHJpdmF0ZSBkaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xyXG4gICAgcHJpdmF0ZSBzdGF0dXNCYXI6IGFueTtcclxuICAgIHByaXZhdGUgX2FjdGl2ZSA9IGZhbHNlO1xyXG5cclxuICAgIHB1YmxpYyBhY3RpdmF0ZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkaXNwb3NlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHNldHVwKHN0YXR1c0JhcjogYW55KSB7XHJcbiAgICAgICAgdGhpcy5zdGF0dXNCYXIgPSBzdGF0dXNCYXI7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9hY3RpdmUpIHtcclxuICAgICAgICAgICAgdGhpcy5fYXR0YWNoKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBhdHRhY2goKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuc3RhdHVzQmFyKSB7IHRoaXMuX2F0dGFjaCgpOyB9XHJcbiAgICAgICAgdGhpcy5fYWN0aXZlID0gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9hdHRhY2goKSB7XHJcbiAgICAgICAgZWFjaChidXR0b25zLCAoYnV0dG9uLCBpbmRleCkgPT4gdGhpcy5fYnV0dG9uKGJ1dHRvbiwgaW5kZXgpKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9idXR0b24oYnV0dG9uOiBJQnV0dG9uLCBpbmRleDogbnVtYmVyKSB7XHJcbiAgICAgICAgY29uc3Qge25hbWUsIGNvbmZpZywgaWNvbiwgdG9vbHRpcH0gPSBidXR0b247XHJcbiAgICAgICAgY29uc3QgdmlldyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcclxuICAgICAgICB2aWV3LmNsYXNzTGlzdC5hZGQoJ2lubGluZS1ibG9jaycsIGAke25hbWV9LWJ1dHRvbmAsIGljb24pO1xyXG4gICAgICAgIHZpZXcuc3R5bGUuZGlzcGxheSA9ICdub25lJztcclxuICAgICAgICB2aWV3Lm9uY2xpY2sgPSAoKSA9PiBhdG9tLmNvbmZpZy5zZXQoY29uZmlnLCAhYXRvbS5jb25maWcuZ2V0KGNvbmZpZykpO1xyXG5cclxuICAgICAgICBsZXQgdG9vbHRpcERpc3Bvc2FibGU6IElEaXNwb3NhYmxlO1xyXG4gICAgICAgIHZpZXcub25tb3VzZWVudGVyID0gKCkgPT4ge1xyXG4gICAgICAgICAgICB0b29sdGlwRGlzcG9zYWJsZSA9IGF0b20udG9vbHRpcHMuYWRkKHZpZXcsIHsgdGl0bGU6IHRvb2x0aXAgfSk7XHJcbiAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQodG9vbHRpcERpc3Bvc2FibGUpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgdmlldy5vbm1vdXNlbGVhdmUgPSAoKSA9PiB7XHJcbiAgICAgICAgICAgIGlmICh0b29sdGlwRGlzcG9zYWJsZSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLnJlbW92ZSh0b29sdGlwRGlzcG9zYWJsZSk7XHJcbiAgICAgICAgICAgICAgICB0b29sdGlwRGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBsZXQgdGlsZTogYW55O1xyXG4gICAgICAgIGlmIChhdG9tLmNvbmZpZy5nZXQoJ2dyYW1tYXItc2VsZWN0b3Iuc2hvd09uUmlnaHRTaWRlT2ZTdGF0dXNCYXInKSkge1xyXG4gICAgICAgICAgICB0aWxlID0gdGhpcy5zdGF0dXNCYXIuYWRkUmlnaHRUaWxlKHtcclxuICAgICAgICAgICAgICAgIGl0ZW06IHZpZXcsXHJcbiAgICAgICAgICAgICAgICBwcmlvcml0eTogOSAtIGluZGV4IC0gMVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aWxlID0gdGhpcy5zdGF0dXNCYXIuYWRkTGVmdFRpbGUoe1xyXG4gICAgICAgICAgICAgICAgaXRlbTogdmlldyxcclxuICAgICAgICAgICAgICAgIHByaW9yaXR5OiAxMSArIGluZGV4ICsgMVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb25maWcub2JzZXJ2ZShjb25maWcsICh2YWx1ZTogYm9vbGVhbikgPT4ge1xyXG4gICAgICAgICAgICBpZiAodmFsdWUpIHtcclxuICAgICAgICAgICAgICAgIHZpZXcuY2xhc3NMaXN0LmFkZCgndGV4dC1zdWNjZXNzJyk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB2aWV3LmNsYXNzTGlzdC5yZW1vdmUoJ3RleHQtc3VjY2VzcycpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcclxuICAgICAgICAgICAgdGlsZS5kZXN0cm95KCk7XHJcbiAgICAgICAgICAgIHZpZXcucmVtb3ZlKCk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuYWN0aXZlRWRpdG9yXHJcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoZWRpdG9yID0+IGVkaXRvciA/ICh2aWV3LnN0eWxlLmRpc3BsYXkgPSAnJykgOiAodmlldy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnKSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZXF1aXJlZCA9IGZhbHNlO1xyXG4gICAgcHVibGljIHRpdGxlID0gJ1Nob3cgRWRpdG9yIEZlYXR1cmUgQnV0dG9ucyc7XHJcbiAgICBwdWJsaWMgZGVzY3JpcHRpb24gPSAnU2hvd3MgZmVhdHVyZSB0b2dnbGUgYnV0dG9ucyBpbiB0aGUgZWRpdG9yLic7XHJcbiAgICBwdWJsaWMgZGVmYXVsdCA9IHRydWU7XHJcbn1cclxuXHJcbmNsYXNzIEZlYXR1cmVCdXR0b25zIGltcGxlbWVudHMgSUZlYXR1cmUge1xyXG4gICAgcHJpdmF0ZSBkaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xyXG5cclxuICAgIHB1YmxpYyBhY3RpdmF0ZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG4gICAgICAgIGVhY2goYnV0dG9ucywgKGJ1dHRvbiwgaW5kZXgpID0+IHRoaXMuX2J1dHRvbihidXR0b24sIGluZGV4KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9idXR0b24oYnV0dG9uOiBJQnV0dG9uLCBpbmRleDogbnVtYmVyKSB7XHJcbiAgICAgICAgY29uc3Qge2NvbmZpZ30gPSBidXR0b247XHJcblxyXG4gICAgICAgIGxldCBidXR0b25EaXNwb3NhYmxlOiBJRGlzcG9zYWJsZTtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoY29uZmlnLCAodmFsdWU6IGJvb2xlYW4pID0+IHtcclxuICAgICAgICAgICAgaWYgKGJ1dHRvbkRpc3Bvc2FibGUpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5yZW1vdmUoYnV0dG9uRGlzcG9zYWJsZSk7XHJcbiAgICAgICAgICAgICAgICBidXR0b25EaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgYnV0dG9uRGlzcG9zYWJsZSA9IHRoaXMuX21ha2VCdXR0b24oYnV0dG9uLCBpbmRleCwgdmFsdWUpO1xyXG4gICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGJ1dHRvbkRpc3Bvc2FibGUpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XHJcbiAgICAgICAgICAgIGJ1dHRvbkRpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgICAgIH0pKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9tYWtlQnV0dG9uKGJ1dHRvbjogSUJ1dHRvbiwgaW5kZXg6IG51bWJlciwgZW5hYmxlZDogYm9vbGVhbikge1xyXG4gICAgICAgIGNvbnN0IHtuYW1lLCBjb25maWcsIGljb24sIHRvb2x0aXB9ID0gYnV0dG9uO1xyXG5cclxuICAgICAgICBsZXQgdG9vbHRpcERpc3Bvc2FibGU6IElEaXNwb3NhYmxlO1xyXG4gICAgICAgIGNvbnN0IGh0bWxCdXR0b24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XHJcbiAgICAgICAgaHRtbEJ1dHRvbi5pZCA9IGAke2ljb259LW5hbWVgO1xyXG4gICAgICAgIGh0bWxCdXR0b24uY2xhc3NMaXN0LmFkZCgnYnRuJyxpY29uKTtcclxuICAgICAgICBpZiAoZW5hYmxlZCkge1xyXG4gICAgICAgICAgICBodG1sQnV0dG9uLmNsYXNzTGlzdC5hZGQoJ2J0bi1zdWNjZXNzJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBodG1sQnV0dG9uLm9uY2xpY2sgPSAoKSA9PiBhdG9tLmNvbmZpZy5zZXQoY29uZmlnLCAhYXRvbS5jb25maWcuZ2V0KGNvbmZpZykpO1xyXG4gICAgICAgIGh0bWxCdXR0b24ub25tb3VzZWVudGVyID0gZSA9PiB7XHJcbiAgICAgICAgICAgIHRvb2x0aXBEaXNwb3NhYmxlID0gYXRvbS50b29sdGlwcy5hZGQoPGFueT5lLmN1cnJlbnRUYXJnZXQsIHsgdGl0bGU6IHRvb2x0aXAgfSk7XHJcbiAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQodG9vbHRpcERpc3Bvc2FibGUpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgaHRtbEJ1dHRvbi5vbm1vdXNlbGVhdmUgPSBlID0+IHtcclxuICAgICAgICAgICAgaWYgKHRvb2x0aXBEaXNwb3NhYmxlKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUucmVtb3ZlKHRvb2x0aXBEaXNwb3NhYmxlKTtcclxuICAgICAgICAgICAgICAgIHRvb2x0aXBEaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGNvbnN0IGJ1dHRvbkRpc3Bvc2FibGUgPSBkb2NrLmFkZEJ1dHRvbihcclxuICAgICAgICAgICAgYCR7bmFtZX0tYnV0dG9uYCxcclxuICAgICAgICAgICAgdG9vbHRpcCxcclxuICAgICAgICAgICAgaHRtbEJ1dHRvbixcclxuICAgICAgICAgICAgeyBwcmlvcml0eTogNTAwICsgaW5kZXggfVxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIHJldHVybiBidXR0b25EaXNwb3NhYmxlO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZXF1aXJlZCA9IGZhbHNlO1xyXG4gICAgcHVibGljIHRpdGxlID0gJ1Nob3cgRmVhdHVyZSBUb2dnbGVzJztcclxuICAgIHB1YmxpYyBkZXNjcmlwdGlvbiA9ICdTaG93cyBmZWF0dXJlIHRvZ2dsZSBidXR0b25zIGluIHRoZSBvbW5pc2hhcnAgd2luZG93Lic7XHJcbiAgICBwdWJsaWMgZGVmYXVsdCA9IHRydWU7XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBmZWF0dXJlQnV0dG9ucyA9IG5ldyBGZWF0dXJlQnV0dG9ucygpO1xyXG5leHBvcnQgY29uc3QgZmVhdHVyZUVkaXRvckJ1dHRvbnMgPSBuZXcgRmVhdHVyZUVkaXRvckJ1dHRvbnMoKTtcclxuIl19
