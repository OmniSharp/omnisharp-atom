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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9hdG9tL2ZlYXR1cmUtYnV0dG9ucy5qcyIsImxpYi9hdG9tL2ZlYXR1cmUtYnV0dG9ucy50cyJdLCJuYW1lcyI6WyJidXR0b25zIiwibmFtZSIsImNvbmZpZyIsImljb24iLCJ0b29sdGlwIiwiYXRvbVZlcnNpb24iLCJtaW5vciIsInVuc2hpZnQiLCJGZWF0dXJlRWRpdG9yQnV0dG9ucyIsIl9hY3RpdmUiLCJyZXF1aXJlZCIsInRpdGxlIiwiZGVzY3JpcHRpb24iLCJkZWZhdWx0IiwiZGlzcG9zYWJsZSIsImRpc3Bvc2UiLCJzdGF0dXNCYXIiLCJfYXR0YWNoIiwiYnV0dG9uIiwiaW5kZXgiLCJfYnV0dG9uIiwidmlldyIsImRvY3VtZW50IiwiY3JlYXRlRWxlbWVudCIsImNsYXNzTGlzdCIsImFkZCIsInN0eWxlIiwiZGlzcGxheSIsIm9uY2xpY2siLCJhdG9tIiwic2V0IiwiZ2V0IiwidG9vbHRpcERpc3Bvc2FibGUiLCJvbm1vdXNlZW50ZXIiLCJ0b29sdGlwcyIsIm9ubW91c2VsZWF2ZSIsInJlbW92ZSIsInRpbGUiLCJhZGRSaWdodFRpbGUiLCJpdGVtIiwicHJpb3JpdHkiLCJhZGRMZWZ0VGlsZSIsIm9ic2VydmUiLCJ2YWx1ZSIsImNyZWF0ZSIsImRlc3Ryb3kiLCJhY3RpdmVFZGl0b3IiLCJzdWJzY3JpYmUiLCJlZGl0b3IiLCJGZWF0dXJlQnV0dG9ucyIsImJ1dHRvbkRpc3Bvc2FibGUiLCJfbWFrZUJ1dHRvbiIsImVuYWJsZWQiLCJodG1sQnV0dG9uIiwiaWQiLCJlIiwiY3VycmVudFRhcmdldCIsImFkZEJ1dHRvbiIsImZlYXR1cmVCdXR0b25zIiwiZmVhdHVyZUVkaXRvckJ1dHRvbnMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQUNBOztBQUNBOztBQUNBOzs7O0FDU0EsSUFBTUEsVUFBVSxDQUFDO0FBQ1RDLFVBQU0sV0FERztBQUVUQyxZQUFRLHlCQUZDO0FBR1RDLFVBQU0sZ0JBSEc7QUFJVEMsYUFBUztBQUpBLENBQUQsQ0FBaEI7QUFPQSxJQUFJLFdBQUtDLFdBQUwsQ0FBaUJDLEtBQWpCLEtBQTJCLENBQTNCLElBQWdDLFdBQUtELFdBQUwsQ0FBaUJDLEtBQWpCLEdBQXlCLENBQTdELEVBQWdFO0FBQzVETixZQUFRTyxPQUFSLENBQWdCO0FBQ1pOLGNBQU0sdUJBRE07QUFFWkMsZ0JBQVEsdUNBRkk7QUFHWkMsY0FBTSxhQUhNO0FBSVpDLGlCQUFTO0FBSkcsS0FBaEI7QUFNSCxDQVBELE1BT087QUFDSEosWUFBUU8sT0FBUixDQUFnQjtBQUNaTixjQUFNLHVCQURNO0FBRVpDLGdCQUFRLHFDQUZJO0FBR1pDLGNBQU0sYUFITTtBQUlaQyxpQkFBUztBQUpHLEtBQWhCO0FBTUg7O0lBRURJLG9CO0FBQUEsb0NBQUE7QUFBQTs7QUFHWSxhQUFBQyxPQUFBLEdBQVUsS0FBVjtBQTRFRCxhQUFBQyxRQUFBLEdBQVcsS0FBWDtBQUNBLGFBQUFDLEtBQUEsR0FBUSw2QkFBUjtBQUNBLGFBQUFDLFdBQUEsR0FBYyw2Q0FBZDtBQUNBLGFBQUFDLE9BQUEsR0FBVSxJQUFWO0FBQ1Y7Ozs7bUNBOUVrQjtBQUNYLGlCQUFLQyxVQUFMLEdBQWtCLHdDQUFsQjtBQUNIOzs7a0NBRWE7QUFDVixpQkFBS0EsVUFBTCxDQUFnQkMsT0FBaEI7QUFDSDs7OzhCQUVZQyxTLEVBQWM7QUFDdkIsaUJBQUtBLFNBQUwsR0FBaUJBLFNBQWpCO0FBRUEsZ0JBQUksS0FBS1AsT0FBVCxFQUFrQjtBQUNkLHFCQUFLUSxPQUFMO0FBQ0g7QUFDSjs7O2lDQUVZO0FBQ1QsZ0JBQUksS0FBS0QsU0FBVCxFQUFvQjtBQUFFLHFCQUFLQyxPQUFMO0FBQWlCO0FBQ3ZDLGlCQUFLUixPQUFMLEdBQWUsSUFBZjtBQUNIOzs7a0NBRWM7QUFBQTs7QUFDWCw4QkFBS1QsT0FBTCxFQUFjLFVBQUNrQixNQUFELEVBQVNDLEtBQVQ7QUFBQSx1QkFBbUIsTUFBS0MsT0FBTCxDQUFhRixNQUFiLEVBQXFCQyxLQUFyQixDQUFuQjtBQUFBLGFBQWQ7QUFDSDs7O2dDQUVlRCxNLEVBQWlCQyxLLEVBQWE7QUFBQTs7QUFBQSxnQkFDbkNsQixJQURtQyxHQUNKaUIsTUFESSxDQUNuQ2pCLElBRG1DO0FBQUEsZ0JBQzdCQyxNQUQ2QixHQUNKZ0IsTUFESSxDQUM3QmhCLE1BRDZCO0FBQUEsZ0JBQ3JCQyxJQURxQixHQUNKZSxNQURJLENBQ3JCZixJQURxQjtBQUFBLGdCQUNmQyxPQURlLEdBQ0pjLE1BREksQ0FDZmQsT0FEZTs7QUFFMUMsZ0JBQU1pQixPQUFPQyxTQUFTQyxhQUFULENBQXVCLE1BQXZCLENBQWI7QUFDQUYsaUJBQUtHLFNBQUwsQ0FBZUMsR0FBZixDQUFtQixjQUFuQixFQUFzQ3hCLElBQXRDLGNBQXFERSxJQUFyRDtBQUNBa0IsaUJBQUtLLEtBQUwsQ0FBV0MsT0FBWCxHQUFxQixNQUFyQjtBQUNBTixpQkFBS08sT0FBTCxHQUFlO0FBQUEsdUJBQU1DLEtBQUszQixNQUFMLENBQVk0QixHQUFaLENBQWdCNUIsTUFBaEIsRUFBd0IsQ0FBQzJCLEtBQUszQixNQUFMLENBQVk2QixHQUFaLENBQWdCN0IsTUFBaEIsQ0FBekIsQ0FBTjtBQUFBLGFBQWY7QUFFQSxnQkFBSThCLDBCQUFKO0FBQ0FYLGlCQUFLWSxZQUFMLEdBQW9CLFlBQUE7QUFDaEJELG9DQUFvQkgsS0FBS0ssUUFBTCxDQUFjVCxHQUFkLENBQWtCSixJQUFsQixFQUF3QixFQUFFVixPQUFPUCxPQUFULEVBQXhCLENBQXBCO0FBQ0EsdUJBQUtVLFVBQUwsQ0FBZ0JXLEdBQWhCLENBQW9CTyxpQkFBcEI7QUFDSCxhQUhEO0FBSUFYLGlCQUFLYyxZQUFMLEdBQW9CLFlBQUE7QUFDaEIsb0JBQUlILGlCQUFKLEVBQXVCO0FBQ25CLDJCQUFLbEIsVUFBTCxDQUFnQnNCLE1BQWhCLENBQXVCSixpQkFBdkI7QUFDQUEsc0NBQWtCakIsT0FBbEI7QUFDSDtBQUNKLGFBTEQ7QUFPQSxnQkFBSXNCLGFBQUo7QUFDQSxnQkFBSVIsS0FBSzNCLE1BQUwsQ0FBWTZCLEdBQVosQ0FBZ0IsNkNBQWhCLENBQUosRUFBb0U7QUFDaEVNLHVCQUFPLEtBQUtyQixTQUFMLENBQWVzQixZQUFmLENBQTRCO0FBQy9CQywwQkFBTWxCLElBRHlCO0FBRS9CbUIsOEJBQVUsSUFBSXJCLEtBQUosR0FBWTtBQUZTLGlCQUE1QixDQUFQO0FBSUgsYUFMRCxNQUtPO0FBQ0hrQix1QkFBTyxLQUFLckIsU0FBTCxDQUFleUIsV0FBZixDQUEyQjtBQUM5QkYsMEJBQU1sQixJQUR3QjtBQUU5Qm1CLDhCQUFVLEtBQUtyQixLQUFMLEdBQWE7QUFGTyxpQkFBM0IsQ0FBUDtBQUlIO0FBRUQsaUJBQUtMLFVBQUwsQ0FBZ0JXLEdBQWhCLENBQW9CSSxLQUFLM0IsTUFBTCxDQUFZd0MsT0FBWixDQUFvQnhDLE1BQXBCLEVBQTRCLFVBQUN5QyxLQUFELEVBQWU7QUFDM0Qsb0JBQUlBLEtBQUosRUFBVztBQUNQdEIseUJBQUtHLFNBQUwsQ0FBZUMsR0FBZixDQUFtQixjQUFuQjtBQUNILGlCQUZELE1BRU87QUFDSEoseUJBQUtHLFNBQUwsQ0FBZVksTUFBZixDQUFzQixjQUF0QjtBQUNIO0FBQ0osYUFObUIsQ0FBcEI7QUFRQSxpQkFBS3RCLFVBQUwsQ0FBZ0JXLEdBQWhCLENBQW9CLDBCQUFXbUIsTUFBWCxDQUFrQixZQUFBO0FBQ2xDUCxxQkFBS1EsT0FBTDtBQUNBeEIscUJBQUtlLE1BQUw7QUFDSCxhQUhtQixDQUFwQjtBQUtBLGlCQUFLdEIsVUFBTCxDQUFnQlcsR0FBaEIsQ0FBb0IsV0FBS3FCLFlBQUwsQ0FDZkMsU0FEZSxDQUNMLFVBQUNDLE1BQUQ7QUFBQSx1QkFBWUEsU0FBVTNCLEtBQUtLLEtBQUwsQ0FBV0MsT0FBWCxHQUFxQixFQUEvQixHQUFzQ04sS0FBS0ssS0FBTCxDQUFXQyxPQUFYLEdBQXFCLE1BQXZFO0FBQUEsYUFESyxDQUFwQjtBQUVIOzs7Ozs7SUFRTHNCLGM7QUFBQSw4QkFBQTtBQUFBOztBQWdFVyxhQUFBdkMsUUFBQSxHQUFXLEtBQVg7QUFDQSxhQUFBQyxLQUFBLEdBQVEsc0JBQVI7QUFDQSxhQUFBQyxXQUFBLEdBQWMsdURBQWQ7QUFDQSxhQUFBQyxPQUFBLEdBQVUsSUFBVjtBQUNWOzs7O21DQWpFa0I7QUFBQTs7QUFDWCxpQkFBS0MsVUFBTCxHQUFrQix3Q0FBbEI7QUFDQSw4QkFBS2QsT0FBTCxFQUFjLFVBQUNrQixNQUFELEVBQVNDLEtBQVQ7QUFBQSx1QkFBbUIsT0FBS0MsT0FBTCxDQUFhRixNQUFiLEVBQXFCQyxLQUFyQixDQUFuQjtBQUFBLGFBQWQ7QUFDSDs7O2tDQUVhO0FBQ1YsaUJBQUtMLFVBQUwsQ0FBZ0JDLE9BQWhCO0FBQ0g7OztnQ0FFZUcsTSxFQUFpQkMsSyxFQUFhO0FBQUE7O0FBQUEsZ0JBQ25DakIsTUFEbUMsR0FDekJnQixNQUR5QixDQUNuQ2hCLE1BRG1DOztBQUcxQyxnQkFBSWdELHlCQUFKO0FBQ0EsaUJBQUtwQyxVQUFMLENBQWdCVyxHQUFoQixDQUFvQkksS0FBSzNCLE1BQUwsQ0FBWXdDLE9BQVosQ0FBb0J4QyxNQUFwQixFQUE0QixVQUFDeUMsS0FBRCxFQUFlO0FBQzNELG9CQUFJTyxnQkFBSixFQUFzQjtBQUNsQiwyQkFBS3BDLFVBQUwsQ0FBZ0JzQixNQUFoQixDQUF1QmMsZ0JBQXZCO0FBQ0FBLHFDQUFpQm5DLE9BQWpCO0FBQ0g7QUFFRG1DLG1DQUFtQixPQUFLQyxXQUFMLENBQWlCakMsTUFBakIsRUFBeUJDLEtBQXpCLEVBQWdDd0IsS0FBaEMsQ0FBbkI7QUFDQSx1QkFBSzdCLFVBQUwsQ0FBZ0JXLEdBQWhCLENBQW9CeUIsZ0JBQXBCO0FBQ0gsYUFSbUIsQ0FBcEI7QUFVQSxpQkFBS3BDLFVBQUwsQ0FBZ0JXLEdBQWhCLENBQW9CLDBCQUFXbUIsTUFBWCxDQUFrQixZQUFBO0FBQ2xDTSxpQ0FBaUJuQyxPQUFqQjtBQUNILGFBRm1CLENBQXBCO0FBR0g7OztvQ0FFbUJHLE0sRUFBaUJDLEssRUFBZWlDLE8sRUFBZ0I7QUFBQTs7QUFBQSxnQkFDekRuRCxJQUR5RCxHQUMxQmlCLE1BRDBCLENBQ3pEakIsSUFEeUQ7QUFBQSxnQkFDbkRDLE1BRG1ELEdBQzFCZ0IsTUFEMEIsQ0FDbkRoQixNQURtRDtBQUFBLGdCQUMzQ0MsSUFEMkMsR0FDMUJlLE1BRDBCLENBQzNDZixJQUQyQztBQUFBLGdCQUNyQ0MsT0FEcUMsR0FDMUJjLE1BRDBCLENBQ3JDZCxPQURxQzs7QUFHaEUsZ0JBQUk0QiwwQkFBSjtBQUNBLGdCQUFNcUIsYUFBYS9CLFNBQVNDLGFBQVQsQ0FBdUIsR0FBdkIsQ0FBbkI7QUFDQThCLHVCQUFXQyxFQUFYLEdBQW1CbkQsSUFBbkI7QUFDQWtELHVCQUFXN0IsU0FBWCxDQUFxQkMsR0FBckIsQ0FBeUIsS0FBekIsRUFBK0J0QixJQUEvQjtBQUNBLGdCQUFJaUQsT0FBSixFQUFhO0FBQ1RDLDJCQUFXN0IsU0FBWCxDQUFxQkMsR0FBckIsQ0FBeUIsYUFBekI7QUFDSDtBQUVENEIsdUJBQVd6QixPQUFYLEdBQXFCO0FBQUEsdUJBQU1DLEtBQUszQixNQUFMLENBQVk0QixHQUFaLENBQWdCNUIsTUFBaEIsRUFBd0IsQ0FBQzJCLEtBQUszQixNQUFMLENBQVk2QixHQUFaLENBQWdCN0IsTUFBaEIsQ0FBekIsQ0FBTjtBQUFBLGFBQXJCO0FBQ0FtRCx1QkFBV3BCLFlBQVgsR0FBMEIsVUFBQ3NCLENBQUQsRUFBRTtBQUN4QnZCLG9DQUFvQkgsS0FBS0ssUUFBTCxDQUFjVCxHQUFkLENBQXVCOEIsRUFBRUMsYUFBekIsRUFBd0MsRUFBRTdDLE9BQU9QLE9BQVQsRUFBeEMsQ0FBcEI7QUFDQSx1QkFBS1UsVUFBTCxDQUFnQlcsR0FBaEIsQ0FBb0JPLGlCQUFwQjtBQUNILGFBSEQ7QUFJQXFCLHVCQUFXbEIsWUFBWCxHQUEwQixVQUFDb0IsQ0FBRCxFQUFFO0FBQ3hCLG9CQUFJdkIsaUJBQUosRUFBdUI7QUFDbkIsMkJBQUtsQixVQUFMLENBQWdCc0IsTUFBaEIsQ0FBdUJKLGlCQUF2QjtBQUNBQSxzQ0FBa0JqQixPQUFsQjtBQUNIO0FBQ0osYUFMRDtBQU9BLGdCQUFNbUMsbUJBQW1CLFdBQUtPLFNBQUwsQ0FDbEJ4RCxJQURrQixjQUVyQkcsT0FGcUIsRUFHckJpRCxVQUhxQixFQUlyQixFQUFFYixVQUFVLE1BQU1yQixLQUFsQixFQUpxQixDQUF6QjtBQU9BLG1CQUFPK0IsZ0JBQVA7QUFDSDs7Ozs7O0FBUUUsSUFBTVEsMENBQWlCLElBQUlULGNBQUosRUFBdkI7QUFDQSxJQUFNVSxzREFBdUIsSUFBSW5ELG9CQUFKLEVBQTdCIiwiZmlsZSI6ImxpYi9hdG9tL2ZlYXR1cmUtYnV0dG9ucy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUsIERpc3Bvc2FibGUgfSBmcm9tIFwidHMtZGlzcG9zYWJsZXNcIjtcbmltcG9ydCB7IGVhY2ggfSBmcm9tIFwibG9kYXNoXCI7XG5pbXBvcnQgeyBPbW5pIH0gZnJvbSBcIi4uL3NlcnZlci9vbW5pXCI7XG5pbXBvcnQgeyBkb2NrIH0gZnJvbSBcIi4uL2F0b20vZG9ja1wiO1xuY29uc3QgYnV0dG9ucyA9IFt7XG4gICAgICAgIG5hbWU6IFwiY29kZS1sZW5zXCIsXG4gICAgICAgIGNvbmZpZzogXCJvbW5pc2hhcnAtYXRvbS5jb2RlTGVuc1wiLFxuICAgICAgICBpY29uOiBcImljb24tdGVsZXNjb3BlXCIsXG4gICAgICAgIHRvb2x0aXA6IFwiRW5hYmxlIC8gRGlzYWJsZSBDb2RlIExlbnNcIlxuICAgIH1dO1xuaWYgKE9tbmkuYXRvbVZlcnNpb24ubWlub3IgIT09IDEgfHwgT21uaS5hdG9tVmVyc2lvbi5taW5vciA+IDgpIHtcbiAgICBidXR0b25zLnVuc2hpZnQoe1xuICAgICAgICBuYW1lOiBcImVuaGFuY2VkLWhpZ2hsaWdodGluZ1wiLFxuICAgICAgICBjb25maWc6IFwib21uaXNoYXJwLWF0b20uZW5oYW5jZWRIaWdobGlnaHRpbmcxOVwiLFxuICAgICAgICBpY29uOiBcImljb24tcGVuY2lsXCIsXG4gICAgICAgIHRvb2x0aXA6IFwiRW5hYmxlIC8gRGlzYWJsZSBFbmhhbmNlZCBIaWdobGlnaHRpbmdcIlxuICAgIH0pO1xufVxuZWxzZSB7XG4gICAgYnV0dG9ucy51bnNoaWZ0KHtcbiAgICAgICAgbmFtZTogXCJlbmhhbmNlZC1oaWdobGlnaHRpbmdcIixcbiAgICAgICAgY29uZmlnOiBcIm9tbmlzaGFycC1hdG9tLmVuaGFuY2VkSGlnaGxpZ2h0aW5nXCIsXG4gICAgICAgIGljb246IFwiaWNvbi1wZW5jaWxcIixcbiAgICAgICAgdG9vbHRpcDogXCJFbmFibGUgLyBEaXNhYmxlIEVuaGFuY2VkIEhpZ2hsaWdodGluZ1wiXG4gICAgfSk7XG59XG5jbGFzcyBGZWF0dXJlRWRpdG9yQnV0dG9ucyB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuX2FjdGl2ZSA9IGZhbHNlO1xuICAgICAgICB0aGlzLnJlcXVpcmVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMudGl0bGUgPSBcIlNob3cgRWRpdG9yIEZlYXR1cmUgQnV0dG9uc1wiO1xuICAgICAgICB0aGlzLmRlc2NyaXB0aW9uID0gXCJTaG93cyBmZWF0dXJlIHRvZ2dsZSBidXR0b25zIGluIHRoZSBlZGl0b3IuXCI7XG4gICAgICAgIHRoaXMuZGVmYXVsdCA9IHRydWU7XG4gICAgfVxuICAgIGFjdGl2YXRlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgIH1cbiAgICBkaXNwb3NlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgIH1cbiAgICBzZXR1cChzdGF0dXNCYXIpIHtcbiAgICAgICAgdGhpcy5zdGF0dXNCYXIgPSBzdGF0dXNCYXI7XG4gICAgICAgIGlmICh0aGlzLl9hY3RpdmUpIHtcbiAgICAgICAgICAgIHRoaXMuX2F0dGFjaCgpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGF0dGFjaCgpIHtcbiAgICAgICAgaWYgKHRoaXMuc3RhdHVzQmFyKSB7XG4gICAgICAgICAgICB0aGlzLl9hdHRhY2goKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9hY3RpdmUgPSB0cnVlO1xuICAgIH1cbiAgICBfYXR0YWNoKCkge1xuICAgICAgICBlYWNoKGJ1dHRvbnMsIChidXR0b24sIGluZGV4KSA9PiB0aGlzLl9idXR0b24oYnV0dG9uLCBpbmRleCkpO1xuICAgIH1cbiAgICBfYnV0dG9uKGJ1dHRvbiwgaW5kZXgpIHtcbiAgICAgICAgY29uc3QgeyBuYW1lLCBjb25maWcsIGljb24sIHRvb2x0aXAgfSA9IGJ1dHRvbjtcbiAgICAgICAgY29uc3QgdmlldyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICB2aWV3LmNsYXNzTGlzdC5hZGQoXCJpbmxpbmUtYmxvY2tcIiwgYCR7bmFtZX0tYnV0dG9uYCwgaWNvbik7XG4gICAgICAgIHZpZXcuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICB2aWV3Lm9uY2xpY2sgPSAoKSA9PiBhdG9tLmNvbmZpZy5zZXQoY29uZmlnLCAhYXRvbS5jb25maWcuZ2V0KGNvbmZpZykpO1xuICAgICAgICBsZXQgdG9vbHRpcERpc3Bvc2FibGU7XG4gICAgICAgIHZpZXcub25tb3VzZWVudGVyID0gKCkgPT4ge1xuICAgICAgICAgICAgdG9vbHRpcERpc3Bvc2FibGUgPSBhdG9tLnRvb2x0aXBzLmFkZCh2aWV3LCB7IHRpdGxlOiB0b29sdGlwIH0pO1xuICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZCh0b29sdGlwRGlzcG9zYWJsZSk7XG4gICAgICAgIH07XG4gICAgICAgIHZpZXcub25tb3VzZWxlYXZlID0gKCkgPT4ge1xuICAgICAgICAgICAgaWYgKHRvb2x0aXBEaXNwb3NhYmxlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLnJlbW92ZSh0b29sdGlwRGlzcG9zYWJsZSk7XG4gICAgICAgICAgICAgICAgdG9vbHRpcERpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBsZXQgdGlsZTtcbiAgICAgICAgaWYgKGF0b20uY29uZmlnLmdldChcImdyYW1tYXItc2VsZWN0b3Iuc2hvd09uUmlnaHRTaWRlT2ZTdGF0dXNCYXJcIikpIHtcbiAgICAgICAgICAgIHRpbGUgPSB0aGlzLnN0YXR1c0Jhci5hZGRSaWdodFRpbGUoe1xuICAgICAgICAgICAgICAgIGl0ZW06IHZpZXcsXG4gICAgICAgICAgICAgICAgcHJpb3JpdHk6IDkgLSBpbmRleCAtIDFcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGlsZSA9IHRoaXMuc3RhdHVzQmFyLmFkZExlZnRUaWxlKHtcbiAgICAgICAgICAgICAgICBpdGVtOiB2aWV3LFxuICAgICAgICAgICAgICAgIHByaW9yaXR5OiAxMSArIGluZGV4ICsgMVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbmZpZy5vYnNlcnZlKGNvbmZpZywgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICB2aWV3LmNsYXNzTGlzdC5hZGQoXCJ0ZXh0LXN1Y2Nlc3NcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB2aWV3LmNsYXNzTGlzdC5yZW1vdmUoXCJ0ZXh0LXN1Y2Nlc3NcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XG4gICAgICAgICAgICB0aWxlLmRlc3Ryb3koKTtcbiAgICAgICAgICAgIHZpZXcucmVtb3ZlKCk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmFjdGl2ZUVkaXRvclxuICAgICAgICAgICAgLnN1YnNjcmliZSgoZWRpdG9yKSA9PiBlZGl0b3IgPyAodmlldy5zdHlsZS5kaXNwbGF5ID0gXCJcIikgOiAodmlldy5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCIpKSk7XG4gICAgfVxufVxuY2xhc3MgRmVhdHVyZUJ1dHRvbnMge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLnJlcXVpcmVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMudGl0bGUgPSBcIlNob3cgRmVhdHVyZSBUb2dnbGVzXCI7XG4gICAgICAgIHRoaXMuZGVzY3JpcHRpb24gPSBcIlNob3dzIGZlYXR1cmUgdG9nZ2xlIGJ1dHRvbnMgaW4gdGhlIG9tbmlzaGFycCB3aW5kb3cuXCI7XG4gICAgICAgIHRoaXMuZGVmYXVsdCA9IHRydWU7XG4gICAgfVxuICAgIGFjdGl2YXRlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICBlYWNoKGJ1dHRvbnMsIChidXR0b24sIGluZGV4KSA9PiB0aGlzLl9idXR0b24oYnV0dG9uLCBpbmRleCkpO1xuICAgIH1cbiAgICBkaXNwb3NlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgIH1cbiAgICBfYnV0dG9uKGJ1dHRvbiwgaW5kZXgpIHtcbiAgICAgICAgY29uc3QgeyBjb25maWcgfSA9IGJ1dHRvbjtcbiAgICAgICAgbGV0IGJ1dHRvbkRpc3Bvc2FibGU7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb25maWcub2JzZXJ2ZShjb25maWcsICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgaWYgKGJ1dHRvbkRpc3Bvc2FibGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUucmVtb3ZlKGJ1dHRvbkRpc3Bvc2FibGUpO1xuICAgICAgICAgICAgICAgIGJ1dHRvbkRpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnV0dG9uRGlzcG9zYWJsZSA9IHRoaXMuX21ha2VCdXR0b24oYnV0dG9uLCBpbmRleCwgdmFsdWUpO1xuICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChidXR0b25EaXNwb3NhYmxlKTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcbiAgICAgICAgICAgIGJ1dHRvbkRpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgICAgICB9KSk7XG4gICAgfVxuICAgIF9tYWtlQnV0dG9uKGJ1dHRvbiwgaW5kZXgsIGVuYWJsZWQpIHtcbiAgICAgICAgY29uc3QgeyBuYW1lLCBjb25maWcsIGljb24sIHRvb2x0aXAgfSA9IGJ1dHRvbjtcbiAgICAgICAgbGV0IHRvb2x0aXBEaXNwb3NhYmxlO1xuICAgICAgICBjb25zdCBodG1sQnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImFcIik7XG4gICAgICAgIGh0bWxCdXR0b24uaWQgPSBgJHtpY29ufS1uYW1lYDtcbiAgICAgICAgaHRtbEJ1dHRvbi5jbGFzc0xpc3QuYWRkKFwiYnRuXCIsIGljb24pO1xuICAgICAgICBpZiAoZW5hYmxlZCkge1xuICAgICAgICAgICAgaHRtbEJ1dHRvbi5jbGFzc0xpc3QuYWRkKFwiYnRuLXN1Y2Nlc3NcIik7XG4gICAgICAgIH1cbiAgICAgICAgaHRtbEJ1dHRvbi5vbmNsaWNrID0gKCkgPT4gYXRvbS5jb25maWcuc2V0KGNvbmZpZywgIWF0b20uY29uZmlnLmdldChjb25maWcpKTtcbiAgICAgICAgaHRtbEJ1dHRvbi5vbm1vdXNlZW50ZXIgPSAoZSkgPT4ge1xuICAgICAgICAgICAgdG9vbHRpcERpc3Bvc2FibGUgPSBhdG9tLnRvb2x0aXBzLmFkZChlLmN1cnJlbnRUYXJnZXQsIHsgdGl0bGU6IHRvb2x0aXAgfSk7XG4gICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKHRvb2x0aXBEaXNwb3NhYmxlKTtcbiAgICAgICAgfTtcbiAgICAgICAgaHRtbEJ1dHRvbi5vbm1vdXNlbGVhdmUgPSAoZSkgPT4ge1xuICAgICAgICAgICAgaWYgKHRvb2x0aXBEaXNwb3NhYmxlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLnJlbW92ZSh0b29sdGlwRGlzcG9zYWJsZSk7XG4gICAgICAgICAgICAgICAgdG9vbHRpcERpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBjb25zdCBidXR0b25EaXNwb3NhYmxlID0gZG9jay5hZGRCdXR0b24oYCR7bmFtZX0tYnV0dG9uYCwgdG9vbHRpcCwgaHRtbEJ1dHRvbiwgeyBwcmlvcml0eTogNTAwICsgaW5kZXggfSk7XG4gICAgICAgIHJldHVybiBidXR0b25EaXNwb3NhYmxlO1xuICAgIH1cbn1cbmV4cG9ydCBjb25zdCBmZWF0dXJlQnV0dG9ucyA9IG5ldyBGZWF0dXJlQnV0dG9ucygpO1xuZXhwb3J0IGNvbnN0IGZlYXR1cmVFZGl0b3JCdXR0b25zID0gbmV3IEZlYXR1cmVFZGl0b3JCdXR0b25zKCk7XG4iLCJpbXBvcnQge0NvbXBvc2l0ZURpc3Bvc2FibGUsIERpc3Bvc2FibGUsIElEaXNwb3NhYmxlfSBmcm9tIFwidHMtZGlzcG9zYWJsZXNcIjtcclxuaW1wb3J0IHtlYWNofSBmcm9tIFwibG9kYXNoXCI7XHJcbmltcG9ydCB7T21uaX0gZnJvbSBcIi4uL3NlcnZlci9vbW5pXCI7XHJcbmltcG9ydCB7ZG9ja30gZnJvbSBcIi4uL2F0b20vZG9ja1wiO1xyXG5cclxuaW50ZXJmYWNlIElCdXR0b24ge1xyXG4gICAgbmFtZTogc3RyaW5nO1xyXG4gICAgY29uZmlnOiBzdHJpbmc7XHJcbiAgICBpY29uOiBzdHJpbmc7XHJcbiAgICB0b29sdGlwOiBzdHJpbmc7XHJcbn1cclxuXHJcbmNvbnN0IGJ1dHRvbnMgPSBbe1xyXG4gICAgICAgIG5hbWU6IFwiY29kZS1sZW5zXCIsXHJcbiAgICAgICAgY29uZmlnOiBcIm9tbmlzaGFycC1hdG9tLmNvZGVMZW5zXCIsXHJcbiAgICAgICAgaWNvbjogXCJpY29uLXRlbGVzY29wZVwiLFxyXG4gICAgICAgIHRvb2x0aXA6IFwiRW5hYmxlIC8gRGlzYWJsZSBDb2RlIExlbnNcIlxyXG4gICAgfV07XHJcblxyXG5pZiAoT21uaS5hdG9tVmVyc2lvbi5taW5vciAhPT0gMSB8fCBPbW5pLmF0b21WZXJzaW9uLm1pbm9yID4gOCkge1xyXG4gICAgYnV0dG9ucy51bnNoaWZ0KHtcclxuICAgICAgICBuYW1lOiBcImVuaGFuY2VkLWhpZ2hsaWdodGluZ1wiLFxyXG4gICAgICAgIGNvbmZpZzogXCJvbW5pc2hhcnAtYXRvbS5lbmhhbmNlZEhpZ2hsaWdodGluZzE5XCIsXHJcbiAgICAgICAgaWNvbjogXCJpY29uLXBlbmNpbFwiLFxyXG4gICAgICAgIHRvb2x0aXA6IFwiRW5hYmxlIC8gRGlzYWJsZSBFbmhhbmNlZCBIaWdobGlnaHRpbmdcIlxyXG4gICAgfSk7XHJcbn0gZWxzZSB7XHJcbiAgICBidXR0b25zLnVuc2hpZnQoe1xyXG4gICAgICAgIG5hbWU6IFwiZW5oYW5jZWQtaGlnaGxpZ2h0aW5nXCIsXHJcbiAgICAgICAgY29uZmlnOiBcIm9tbmlzaGFycC1hdG9tLmVuaGFuY2VkSGlnaGxpZ2h0aW5nXCIsXHJcbiAgICAgICAgaWNvbjogXCJpY29uLXBlbmNpbFwiLFxyXG4gICAgICAgIHRvb2x0aXA6IFwiRW5hYmxlIC8gRGlzYWJsZSBFbmhhbmNlZCBIaWdobGlnaHRpbmdcIlxyXG4gICAgfSk7XHJcbn1cclxuXHJcbmNsYXNzIEZlYXR1cmVFZGl0b3JCdXR0b25zIGltcGxlbWVudHMgSUF0b21GZWF0dXJlIHtcclxuICAgIHByaXZhdGUgZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxuICAgIHByaXZhdGUgc3RhdHVzQmFyOiBhbnk7XHJcbiAgICBwcml2YXRlIF9hY3RpdmUgPSBmYWxzZTtcclxuXHJcbiAgICBwdWJsaWMgYWN0aXZhdGUoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGlzcG9zZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzZXR1cChzdGF0dXNCYXI6IGFueSkge1xyXG4gICAgICAgIHRoaXMuc3RhdHVzQmFyID0gc3RhdHVzQmFyO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5fYWN0aXZlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2F0dGFjaCgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgYXR0YWNoKCkge1xyXG4gICAgICAgIGlmICh0aGlzLnN0YXR1c0JhcikgeyB0aGlzLl9hdHRhY2goKTsgfVxyXG4gICAgICAgIHRoaXMuX2FjdGl2ZSA9IHRydWU7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfYXR0YWNoKCkge1xyXG4gICAgICAgIGVhY2goYnV0dG9ucywgKGJ1dHRvbiwgaW5kZXgpID0+IHRoaXMuX2J1dHRvbihidXR0b24sIGluZGV4KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfYnV0dG9uKGJ1dHRvbjogSUJ1dHRvbiwgaW5kZXg6IG51bWJlcikge1xyXG4gICAgICAgIGNvbnN0IHtuYW1lLCBjb25maWcsIGljb24sIHRvb2x0aXB9ID0gYnV0dG9uO1xyXG4gICAgICAgIGNvbnN0IHZpZXcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcclxuICAgICAgICB2aWV3LmNsYXNzTGlzdC5hZGQoXCJpbmxpbmUtYmxvY2tcIiwgYCR7bmFtZX0tYnV0dG9uYCwgaWNvbik7XHJcbiAgICAgICAgdmlldy5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XHJcbiAgICAgICAgdmlldy5vbmNsaWNrID0gKCkgPT4gYXRvbS5jb25maWcuc2V0KGNvbmZpZywgIWF0b20uY29uZmlnLmdldChjb25maWcpKTtcclxuXHJcbiAgICAgICAgbGV0IHRvb2x0aXBEaXNwb3NhYmxlOiBJRGlzcG9zYWJsZTtcclxuICAgICAgICB2aWV3Lm9ubW91c2VlbnRlciA9ICgpID0+IHtcclxuICAgICAgICAgICAgdG9vbHRpcERpc3Bvc2FibGUgPSBhdG9tLnRvb2x0aXBzLmFkZCh2aWV3LCB7IHRpdGxlOiB0b29sdGlwIH0pO1xyXG4gICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKHRvb2x0aXBEaXNwb3NhYmxlKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHZpZXcub25tb3VzZWxlYXZlID0gKCkgPT4ge1xyXG4gICAgICAgICAgICBpZiAodG9vbHRpcERpc3Bvc2FibGUpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5yZW1vdmUodG9vbHRpcERpc3Bvc2FibGUpO1xyXG4gICAgICAgICAgICAgICAgdG9vbHRpcERpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgbGV0IHRpbGU6IGFueTtcclxuICAgICAgICBpZiAoYXRvbS5jb25maWcuZ2V0KFwiZ3JhbW1hci1zZWxlY3Rvci5zaG93T25SaWdodFNpZGVPZlN0YXR1c0JhclwiKSkge1xyXG4gICAgICAgICAgICB0aWxlID0gdGhpcy5zdGF0dXNCYXIuYWRkUmlnaHRUaWxlKHtcclxuICAgICAgICAgICAgICAgIGl0ZW06IHZpZXcsXHJcbiAgICAgICAgICAgICAgICBwcmlvcml0eTogOSAtIGluZGV4IC0gMVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aWxlID0gdGhpcy5zdGF0dXNCYXIuYWRkTGVmdFRpbGUoe1xyXG4gICAgICAgICAgICAgICAgaXRlbTogdmlldyxcclxuICAgICAgICAgICAgICAgIHByaW9yaXR5OiAxMSArIGluZGV4ICsgMVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb25maWcub2JzZXJ2ZShjb25maWcsICh2YWx1ZTogYm9vbGVhbikgPT4ge1xyXG4gICAgICAgICAgICBpZiAodmFsdWUpIHtcclxuICAgICAgICAgICAgICAgIHZpZXcuY2xhc3NMaXN0LmFkZChcInRleHQtc3VjY2Vzc1wiKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHZpZXcuY2xhc3NMaXN0LnJlbW92ZShcInRleHQtc3VjY2Vzc1wiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XHJcbiAgICAgICAgICAgIHRpbGUuZGVzdHJveSgpO1xyXG4gICAgICAgICAgICB2aWV3LnJlbW92ZSgpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmFjdGl2ZUVkaXRvclxyXG4gICAgICAgICAgICAuc3Vic2NyaWJlKChlZGl0b3IpID0+IGVkaXRvciA/ICh2aWV3LnN0eWxlLmRpc3BsYXkgPSBcIlwiKSA6ICh2aWV3LnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIikpKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVxdWlyZWQgPSBmYWxzZTtcclxuICAgIHB1YmxpYyB0aXRsZSA9IFwiU2hvdyBFZGl0b3IgRmVhdHVyZSBCdXR0b25zXCI7XHJcbiAgICBwdWJsaWMgZGVzY3JpcHRpb24gPSBcIlNob3dzIGZlYXR1cmUgdG9nZ2xlIGJ1dHRvbnMgaW4gdGhlIGVkaXRvci5cIjtcclxuICAgIHB1YmxpYyBkZWZhdWx0ID0gdHJ1ZTtcclxufVxyXG5cclxuY2xhc3MgRmVhdHVyZUJ1dHRvbnMgaW1wbGVtZW50cyBJRmVhdHVyZSB7XHJcbiAgICBwcml2YXRlIGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XHJcblxyXG4gICAgcHVibGljIGFjdGl2YXRlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcbiAgICAgICAgZWFjaChidXR0b25zLCAoYnV0dG9uLCBpbmRleCkgPT4gdGhpcy5fYnV0dG9uKGJ1dHRvbiwgaW5kZXgpKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGlzcG9zZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX2J1dHRvbihidXR0b246IElCdXR0b24sIGluZGV4OiBudW1iZXIpIHtcclxuICAgICAgICBjb25zdCB7Y29uZmlnfSA9IGJ1dHRvbjtcclxuXHJcbiAgICAgICAgbGV0IGJ1dHRvbkRpc3Bvc2FibGU6IElEaXNwb3NhYmxlO1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb25maWcub2JzZXJ2ZShjb25maWcsICh2YWx1ZTogYm9vbGVhbikgPT4ge1xyXG4gICAgICAgICAgICBpZiAoYnV0dG9uRGlzcG9zYWJsZSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLnJlbW92ZShidXR0b25EaXNwb3NhYmxlKTtcclxuICAgICAgICAgICAgICAgIGJ1dHRvbkRpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBidXR0b25EaXNwb3NhYmxlID0gdGhpcy5fbWFrZUJ1dHRvbihidXR0b24sIGluZGV4LCB2YWx1ZSk7XHJcbiAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYnV0dG9uRGlzcG9zYWJsZSk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcclxuICAgICAgICAgICAgYnV0dG9uRGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICAgICAgfSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX21ha2VCdXR0b24oYnV0dG9uOiBJQnV0dG9uLCBpbmRleDogbnVtYmVyLCBlbmFibGVkOiBib29sZWFuKSB7XHJcbiAgICAgICAgY29uc3Qge25hbWUsIGNvbmZpZywgaWNvbiwgdG9vbHRpcH0gPSBidXR0b247XHJcblxyXG4gICAgICAgIGxldCB0b29sdGlwRGlzcG9zYWJsZTogSURpc3Bvc2FibGU7XHJcbiAgICAgICAgY29uc3QgaHRtbEJ1dHRvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJhXCIpO1xyXG4gICAgICAgIGh0bWxCdXR0b24uaWQgPSBgJHtpY29ufS1uYW1lYDtcclxuICAgICAgICBodG1sQnV0dG9uLmNsYXNzTGlzdC5hZGQoXCJidG5cIixpY29uKTtcclxuICAgICAgICBpZiAoZW5hYmxlZCkge1xyXG4gICAgICAgICAgICBodG1sQnV0dG9uLmNsYXNzTGlzdC5hZGQoXCJidG4tc3VjY2Vzc1wiKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGh0bWxCdXR0b24ub25jbGljayA9ICgpID0+IGF0b20uY29uZmlnLnNldChjb25maWcsICFhdG9tLmNvbmZpZy5nZXQoY29uZmlnKSk7XHJcbiAgICAgICAgaHRtbEJ1dHRvbi5vbm1vdXNlZW50ZXIgPSAoZSkgPT4ge1xyXG4gICAgICAgICAgICB0b29sdGlwRGlzcG9zYWJsZSA9IGF0b20udG9vbHRpcHMuYWRkKDxhbnk+ZS5jdXJyZW50VGFyZ2V0LCB7IHRpdGxlOiB0b29sdGlwIH0pO1xyXG4gICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKHRvb2x0aXBEaXNwb3NhYmxlKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIGh0bWxCdXR0b24ub25tb3VzZWxlYXZlID0gKGUpID0+IHtcclxuICAgICAgICAgICAgaWYgKHRvb2x0aXBEaXNwb3NhYmxlKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUucmVtb3ZlKHRvb2x0aXBEaXNwb3NhYmxlKTtcclxuICAgICAgICAgICAgICAgIHRvb2x0aXBEaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGNvbnN0IGJ1dHRvbkRpc3Bvc2FibGUgPSBkb2NrLmFkZEJ1dHRvbihcclxuICAgICAgICAgICAgYCR7bmFtZX0tYnV0dG9uYCxcclxuICAgICAgICAgICAgdG9vbHRpcCxcclxuICAgICAgICAgICAgaHRtbEJ1dHRvbixcclxuICAgICAgICAgICAgeyBwcmlvcml0eTogNTAwICsgaW5kZXggfVxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIHJldHVybiBidXR0b25EaXNwb3NhYmxlO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZXF1aXJlZCA9IGZhbHNlO1xyXG4gICAgcHVibGljIHRpdGxlID0gXCJTaG93IEZlYXR1cmUgVG9nZ2xlc1wiO1xyXG4gICAgcHVibGljIGRlc2NyaXB0aW9uID0gXCJTaG93cyBmZWF0dXJlIHRvZ2dsZSBidXR0b25zIGluIHRoZSBvbW5pc2hhcnAgd2luZG93LlwiO1xyXG4gICAgcHVibGljIGRlZmF1bHQgPSB0cnVlO1xyXG59XHJcblxyXG5leHBvcnQgY29uc3QgZmVhdHVyZUJ1dHRvbnMgPSBuZXcgRmVhdHVyZUJ1dHRvbnMoKTtcclxuZXhwb3J0IGNvbnN0IGZlYXR1cmVFZGl0b3JCdXR0b25zID0gbmV3IEZlYXR1cmVFZGl0b3JCdXR0b25zKCk7XHJcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
