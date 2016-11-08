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

            var name = button.name,
                config = button.config,
                icon = button.icon,
                tooltip = button.tooltip;

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

            var name = button.name,
                config = button.config,
                icon = button.icon,
                tooltip = button.tooltip;

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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9hdG9tL2ZlYXR1cmUtYnV0dG9ucy5qcyIsImxpYi9hdG9tL2ZlYXR1cmUtYnV0dG9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7QUFDQTs7OztBQ1NBLElBQU0sVUFBVSxDQUFDO0FBQ1QsVUFBTSxXQUFOO0FBQ0EsWUFBUSx5QkFBUjtBQUNBLFVBQU0sZ0JBQU47QUFDQSxhQUFTLDRCQUFUO0NBSlEsQ0FBVjtBQU9OLElBQUksV0FBSyxXQUFMLENBQWlCLEtBQWpCLEtBQTJCLENBQTNCLElBQWdDLFdBQUssV0FBTCxDQUFpQixLQUFqQixHQUF5QixDQUF6QixFQUE0QjtBQUM1RCxZQUFRLE9BQVIsQ0FBZ0I7QUFDWixjQUFNLHVCQUFOO0FBQ0EsZ0JBQVEsdUNBQVI7QUFDQSxjQUFNLGFBQU47QUFDQSxpQkFBUyx3Q0FBVDtLQUpKLEVBRDREO0NBQWhFLE1BT087QUFDSCxZQUFRLE9BQVIsQ0FBZ0I7QUFDWixjQUFNLHVCQUFOO0FBQ0EsZ0JBQVEscUNBQVI7QUFDQSxjQUFNLGFBQU47QUFDQSxpQkFBUyx3Q0FBVDtLQUpKLEVBREc7Q0FQUDs7SUFnQkE7QUFBQSxvQ0FBQTs7O0FBR1ksYUFBQSxPQUFBLEdBQVUsS0FBVixDQUhaO0FBK0VXLGFBQUEsUUFBQSxHQUFXLEtBQVgsQ0EvRVg7QUFnRlcsYUFBQSxLQUFBLEdBQVEsNkJBQVIsQ0FoRlg7QUFpRlcsYUFBQSxXQUFBLEdBQWMsNkNBQWQsQ0FqRlg7QUFrRlcsYUFBQSxPQUFBLEdBQVUsSUFBVixDQWxGWDtLQUFBOzs7O21DQUttQjtBQUNYLGlCQUFLLFVBQUwsR0FBa0Isd0NBQWxCLENBRFc7Ozs7a0NBSUQ7QUFDVixpQkFBSyxVQUFMLENBQWdCLE9BQWhCLEdBRFU7Ozs7OEJBSUQsV0FBYztBQUN2QixpQkFBSyxTQUFMLEdBQWlCLFNBQWpCLENBRHVCO0FBR3ZCLGdCQUFJLEtBQUssT0FBTCxFQUFjO0FBQ2QscUJBQUssT0FBTCxHQURjO2FBQWxCOzs7O2lDQUtTO0FBQ1QsZ0JBQUksS0FBSyxTQUFMLEVBQWdCO0FBQUUscUJBQUssT0FBTCxHQUFGO2FBQXBCO0FBQ0EsaUJBQUssT0FBTCxHQUFlLElBQWYsQ0FGUzs7OztrQ0FLRTs7O0FBQ1gsOEJBQUssT0FBTCxFQUFjLFVBQUMsTUFBRCxFQUFTLEtBQVQ7dUJBQW1CLE1BQUssT0FBTCxDQUFhLE1BQWIsRUFBcUIsS0FBckI7YUFBbkIsQ0FBZCxDQURXOzs7O2dDQUlDLFFBQWlCLE9BQWE7OztnQkFDbkMsT0FBK0IsT0FBL0I7Z0JBQU0sU0FBeUIsT0FBekI7Z0JBQVEsT0FBaUIsT0FBakI7Z0JBQU0sVUFBVyxPQUFYLFFBRGU7O0FBRTFDLGdCQUFNLE9BQU8sU0FBUyxhQUFULENBQXVCLE1BQXZCLENBQVAsQ0FGb0M7QUFHMUMsaUJBQUssU0FBTCxDQUFlLEdBQWYsQ0FBbUIsY0FBbkIsRUFBc0MsZ0JBQXRDLEVBQXFELElBQXJELEVBSDBDO0FBSTFDLGlCQUFLLEtBQUwsQ0FBVyxPQUFYLEdBQXFCLE1BQXJCLENBSjBDO0FBSzFDLGlCQUFLLE9BQUwsR0FBZTt1QkFBTSxLQUFLLE1BQUwsQ0FBWSxHQUFaLENBQWdCLE1BQWhCLEVBQXdCLENBQUMsS0FBSyxNQUFMLENBQVksR0FBWixDQUFnQixNQUFoQixDQUFEO2FBQTlCLENBTDJCO0FBTzFDLGdCQUFJLDBCQUFKLENBUDBDO0FBUTFDLGlCQUFLLFlBQUwsR0FBb0IsWUFBQTtBQUNoQixvQ0FBb0IsS0FBSyxRQUFMLENBQWMsR0FBZCxDQUFrQixJQUFsQixFQUF3QixFQUFFLE9BQU8sT0FBUCxFQUExQixDQUFwQixDQURnQjtBQUVoQix1QkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLGlCQUFwQixFQUZnQjthQUFBLENBUnNCO0FBWTFDLGlCQUFLLFlBQUwsR0FBb0IsWUFBQTtBQUNoQixvQkFBSSxpQkFBSixFQUF1QjtBQUNuQiwyQkFBSyxVQUFMLENBQWdCLE1BQWhCLENBQXVCLGlCQUF2QixFQURtQjtBQUVuQixzQ0FBa0IsT0FBbEIsR0FGbUI7aUJBQXZCO2FBRGdCLENBWnNCO0FBbUIxQyxnQkFBSSxhQUFKLENBbkIwQztBQW9CMUMsZ0JBQUksS0FBSyxNQUFMLENBQVksR0FBWixDQUFnQiw2Q0FBaEIsQ0FBSixFQUFvRTtBQUNoRSx1QkFBTyxLQUFLLFNBQUwsQ0FBZSxZQUFmLENBQTRCO0FBQy9CLDBCQUFNLElBQU47QUFDQSw4QkFBVSxJQUFJLEtBQUosR0FBWSxDQUFaO2lCQUZQLENBQVAsQ0FEZ0U7YUFBcEUsTUFLTztBQUNILHVCQUFPLEtBQUssU0FBTCxDQUFlLFdBQWYsQ0FBMkI7QUFDOUIsMEJBQU0sSUFBTjtBQUNBLDhCQUFVLEtBQUssS0FBTCxHQUFhLENBQWI7aUJBRlAsQ0FBUCxDQURHO2FBTFA7QUFZQSxpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLEtBQUssTUFBTCxDQUFZLE9BQVosQ0FBb0IsTUFBcEIsRUFBNEIsVUFBQyxLQUFELEVBQWU7QUFDM0Qsb0JBQUksS0FBSixFQUFXO0FBQ1AseUJBQUssU0FBTCxDQUFlLEdBQWYsQ0FBbUIsY0FBbkIsRUFETztpQkFBWCxNQUVPO0FBQ0gseUJBQUssU0FBTCxDQUFlLE1BQWYsQ0FBc0IsY0FBdEIsRUFERztpQkFGUDthQUQ0QyxDQUFoRCxFQWhDMEM7QUF3QzFDLGlCQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsMEJBQVcsTUFBWCxDQUFrQixZQUFBO0FBQ2xDLHFCQUFLLE9BQUwsR0FEa0M7QUFFbEMscUJBQUssTUFBTCxHQUZrQzthQUFBLENBQXRDLEVBeEMwQztBQTZDMUMsaUJBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQixXQUFLLFlBQUwsQ0FDZixTQURlLENBQ0wsVUFBQyxNQUFEO3VCQUFZLFNBQVUsS0FBSyxLQUFMLENBQVcsT0FBWCxHQUFxQixFQUFyQixHQUE0QixLQUFLLEtBQUwsQ0FBVyxPQUFYLEdBQXFCLE1BQXJCO2FBQWxELENBRGYsRUE3QzBDOzs7Ozs7O0lBdURsRDtBQUFBLDhCQUFBOzs7QUFnRVcsYUFBQSxRQUFBLEdBQVcsS0FBWCxDQWhFWDtBQWlFVyxhQUFBLEtBQUEsR0FBUSxzQkFBUixDQWpFWDtBQWtFVyxhQUFBLFdBQUEsR0FBYyx1REFBZCxDQWxFWDtBQW1FVyxhQUFBLE9BQUEsR0FBVSxJQUFWLENBbkVYO0tBQUE7Ozs7bUNBR21COzs7QUFDWCxpQkFBSyxVQUFMLEdBQWtCLHdDQUFsQixDQURXO0FBRVgsOEJBQUssT0FBTCxFQUFjLFVBQUMsTUFBRCxFQUFTLEtBQVQ7dUJBQW1CLE9BQUssT0FBTCxDQUFhLE1BQWIsRUFBcUIsS0FBckI7YUFBbkIsQ0FBZCxDQUZXOzs7O2tDQUtEO0FBQ1YsaUJBQUssVUFBTCxDQUFnQixPQUFoQixHQURVOzs7O2dDQUlFLFFBQWlCLE9BQWE7OztnQkFDbkMsU0FBVSxPQUFWLE9BRG1DOztBQUcxQyxnQkFBSSx5QkFBSixDQUgwQztBQUkxQyxpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLEtBQUssTUFBTCxDQUFZLE9BQVosQ0FBb0IsTUFBcEIsRUFBNEIsVUFBQyxLQUFELEVBQWU7QUFDM0Qsb0JBQUksZ0JBQUosRUFBc0I7QUFDbEIsMkJBQUssVUFBTCxDQUFnQixNQUFoQixDQUF1QixnQkFBdkIsRUFEa0I7QUFFbEIscUNBQWlCLE9BQWpCLEdBRmtCO2lCQUF0QjtBQUtBLG1DQUFtQixPQUFLLFdBQUwsQ0FBaUIsTUFBakIsRUFBeUIsS0FBekIsRUFBZ0MsS0FBaEMsQ0FBbkIsQ0FOMkQ7QUFPM0QsdUJBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQixnQkFBcEIsRUFQMkQ7YUFBZixDQUFoRCxFQUowQztBQWMxQyxpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLDBCQUFXLE1BQVgsQ0FBa0IsWUFBQTtBQUNsQyxpQ0FBaUIsT0FBakIsR0FEa0M7YUFBQSxDQUF0QyxFQWQwQzs7OztvQ0FtQjFCLFFBQWlCLE9BQWUsU0FBZ0I7OztnQkFDekQsT0FBK0IsT0FBL0I7Z0JBQU0sU0FBeUIsT0FBekI7Z0JBQVEsT0FBaUIsT0FBakI7Z0JBQU0sVUFBVyxPQUFYLFFBRHFDOztBQUdoRSxnQkFBSSwwQkFBSixDQUhnRTtBQUloRSxnQkFBTSxhQUFhLFNBQVMsYUFBVCxDQUF1QixHQUF2QixDQUFiLENBSjBEO0FBS2hFLHVCQUFXLEVBQVgsR0FBbUIsY0FBbkIsQ0FMZ0U7QUFNaEUsdUJBQVcsU0FBWCxDQUFxQixHQUFyQixDQUF5QixLQUF6QixFQUErQixJQUEvQixFQU5nRTtBQU9oRSxnQkFBSSxPQUFKLEVBQWE7QUFDVCwyQkFBVyxTQUFYLENBQXFCLEdBQXJCLENBQXlCLGFBQXpCLEVBRFM7YUFBYjtBQUlBLHVCQUFXLE9BQVgsR0FBcUI7dUJBQU0sS0FBSyxNQUFMLENBQVksR0FBWixDQUFnQixNQUFoQixFQUF3QixDQUFDLEtBQUssTUFBTCxDQUFZLEdBQVosQ0FBZ0IsTUFBaEIsQ0FBRDthQUE5QixDQVgyQztBQVloRSx1QkFBVyxZQUFYLEdBQTBCLFVBQUMsQ0FBRCxFQUFFO0FBQ3hCLG9DQUFvQixLQUFLLFFBQUwsQ0FBYyxHQUFkLENBQXVCLEVBQUUsYUFBRixFQUFpQixFQUFFLE9BQU8sT0FBUCxFQUExQyxDQUFwQixDQUR3QjtBQUV4Qix1QkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLGlCQUFwQixFQUZ3QjthQUFGLENBWnNDO0FBZ0JoRSx1QkFBVyxZQUFYLEdBQTBCLFVBQUMsQ0FBRCxFQUFFO0FBQ3hCLG9CQUFJLGlCQUFKLEVBQXVCO0FBQ25CLDJCQUFLLFVBQUwsQ0FBZ0IsTUFBaEIsQ0FBdUIsaUJBQXZCLEVBRG1CO0FBRW5CLHNDQUFrQixPQUFsQixHQUZtQjtpQkFBdkI7YUFEc0IsQ0FoQnNDO0FBdUJoRSxnQkFBTSxtQkFBbUIsV0FBSyxTQUFMLENBQ2xCLGdCQURrQixFQUVyQixPQUZxQixFQUdyQixVQUhxQixFQUlyQixFQUFFLFVBQVUsTUFBTSxLQUFOLEVBSlMsQ0FBbkIsQ0F2QjBEO0FBOEJoRSxtQkFBTyxnQkFBUCxDQTlCZ0U7Ozs7Ozs7QUF1Q2pFLElBQU0sMENBQWlCLElBQUksY0FBSixFQUFqQjtBQUNOLElBQU0sc0RBQXVCLElBQUksb0JBQUosRUFBdkIiLCJmaWxlIjoibGliL2F0b20vZmVhdHVyZS1idXR0b25zLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSwgRGlzcG9zYWJsZSB9IGZyb20gXCJ0cy1kaXNwb3NhYmxlc1wiO1xuaW1wb3J0IHsgZWFjaCB9IGZyb20gXCJsb2Rhc2hcIjtcbmltcG9ydCB7IE9tbmkgfSBmcm9tIFwiLi4vc2VydmVyL29tbmlcIjtcbmltcG9ydCB7IGRvY2sgfSBmcm9tIFwiLi4vYXRvbS9kb2NrXCI7XG5jb25zdCBidXR0b25zID0gW3tcbiAgICAgICAgbmFtZTogXCJjb2RlLWxlbnNcIixcbiAgICAgICAgY29uZmlnOiBcIm9tbmlzaGFycC1hdG9tLmNvZGVMZW5zXCIsXG4gICAgICAgIGljb246IFwiaWNvbi10ZWxlc2NvcGVcIixcbiAgICAgICAgdG9vbHRpcDogXCJFbmFibGUgLyBEaXNhYmxlIENvZGUgTGVuc1wiXG4gICAgfV07XG5pZiAoT21uaS5hdG9tVmVyc2lvbi5taW5vciAhPT0gMSB8fCBPbW5pLmF0b21WZXJzaW9uLm1pbm9yID4gOCkge1xuICAgIGJ1dHRvbnMudW5zaGlmdCh7XG4gICAgICAgIG5hbWU6IFwiZW5oYW5jZWQtaGlnaGxpZ2h0aW5nXCIsXG4gICAgICAgIGNvbmZpZzogXCJvbW5pc2hhcnAtYXRvbS5lbmhhbmNlZEhpZ2hsaWdodGluZzE5XCIsXG4gICAgICAgIGljb246IFwiaWNvbi1wZW5jaWxcIixcbiAgICAgICAgdG9vbHRpcDogXCJFbmFibGUgLyBEaXNhYmxlIEVuaGFuY2VkIEhpZ2hsaWdodGluZ1wiXG4gICAgfSk7XG59XG5lbHNlIHtcbiAgICBidXR0b25zLnVuc2hpZnQoe1xuICAgICAgICBuYW1lOiBcImVuaGFuY2VkLWhpZ2hsaWdodGluZ1wiLFxuICAgICAgICBjb25maWc6IFwib21uaXNoYXJwLWF0b20uZW5oYW5jZWRIaWdobGlnaHRpbmdcIixcbiAgICAgICAgaWNvbjogXCJpY29uLXBlbmNpbFwiLFxuICAgICAgICB0b29sdGlwOiBcIkVuYWJsZSAvIERpc2FibGUgRW5oYW5jZWQgSGlnaGxpZ2h0aW5nXCJcbiAgICB9KTtcbn1cbmNsYXNzIEZlYXR1cmVFZGl0b3JCdXR0b25zIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5fYWN0aXZlID0gZmFsc2U7XG4gICAgICAgIHRoaXMucmVxdWlyZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy50aXRsZSA9IFwiU2hvdyBFZGl0b3IgRmVhdHVyZSBCdXR0b25zXCI7XG4gICAgICAgIHRoaXMuZGVzY3JpcHRpb24gPSBcIlNob3dzIGZlYXR1cmUgdG9nZ2xlIGJ1dHRvbnMgaW4gdGhlIGVkaXRvci5cIjtcbiAgICAgICAgdGhpcy5kZWZhdWx0ID0gdHJ1ZTtcbiAgICB9XG4gICAgYWN0aXZhdGUoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgfVxuICAgIGRpc3Bvc2UoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfVxuICAgIHNldHVwKHN0YXR1c0Jhcikge1xuICAgICAgICB0aGlzLnN0YXR1c0JhciA9IHN0YXR1c0JhcjtcbiAgICAgICAgaWYgKHRoaXMuX2FjdGl2ZSkge1xuICAgICAgICAgICAgdGhpcy5fYXR0YWNoKCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgYXR0YWNoKCkge1xuICAgICAgICBpZiAodGhpcy5zdGF0dXNCYXIpIHtcbiAgICAgICAgICAgIHRoaXMuX2F0dGFjaCgpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2FjdGl2ZSA9IHRydWU7XG4gICAgfVxuICAgIF9hdHRhY2goKSB7XG4gICAgICAgIGVhY2goYnV0dG9ucywgKGJ1dHRvbiwgaW5kZXgpID0+IHRoaXMuX2J1dHRvbihidXR0b24sIGluZGV4KSk7XG4gICAgfVxuICAgIF9idXR0b24oYnV0dG9uLCBpbmRleCkge1xuICAgICAgICBjb25zdCB7IG5hbWUsIGNvbmZpZywgaWNvbiwgdG9vbHRpcCB9ID0gYnV0dG9uO1xuICAgICAgICBjb25zdCB2aWV3ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICAgIHZpZXcuY2xhc3NMaXN0LmFkZChcImlubGluZS1ibG9ja1wiLCBgJHtuYW1lfS1idXR0b25gLCBpY29uKTtcbiAgICAgICAgdmlldy5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgIHZpZXcub25jbGljayA9ICgpID0+IGF0b20uY29uZmlnLnNldChjb25maWcsICFhdG9tLmNvbmZpZy5nZXQoY29uZmlnKSk7XG4gICAgICAgIGxldCB0b29sdGlwRGlzcG9zYWJsZTtcbiAgICAgICAgdmlldy5vbm1vdXNlZW50ZXIgPSAoKSA9PiB7XG4gICAgICAgICAgICB0b29sdGlwRGlzcG9zYWJsZSA9IGF0b20udG9vbHRpcHMuYWRkKHZpZXcsIHsgdGl0bGU6IHRvb2x0aXAgfSk7XG4gICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKHRvb2x0aXBEaXNwb3NhYmxlKTtcbiAgICAgICAgfTtcbiAgICAgICAgdmlldy5vbm1vdXNlbGVhdmUgPSAoKSA9PiB7XG4gICAgICAgICAgICBpZiAodG9vbHRpcERpc3Bvc2FibGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUucmVtb3ZlKHRvb2x0aXBEaXNwb3NhYmxlKTtcbiAgICAgICAgICAgICAgICB0b29sdGlwRGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIGxldCB0aWxlO1xuICAgICAgICBpZiAoYXRvbS5jb25maWcuZ2V0KFwiZ3JhbW1hci1zZWxlY3Rvci5zaG93T25SaWdodFNpZGVPZlN0YXR1c0JhclwiKSkge1xuICAgICAgICAgICAgdGlsZSA9IHRoaXMuc3RhdHVzQmFyLmFkZFJpZ2h0VGlsZSh7XG4gICAgICAgICAgICAgICAgaXRlbTogdmlldyxcbiAgICAgICAgICAgICAgICBwcmlvcml0eTogOSAtIGluZGV4IC0gMVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aWxlID0gdGhpcy5zdGF0dXNCYXIuYWRkTGVmdFRpbGUoe1xuICAgICAgICAgICAgICAgIGl0ZW06IHZpZXcsXG4gICAgICAgICAgICAgICAgcHJpb3JpdHk6IDExICsgaW5kZXggKyAxXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoY29uZmlnLCAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgIHZpZXcuY2xhc3NMaXN0LmFkZChcInRleHQtc3VjY2Vzc1wiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHZpZXcuY2xhc3NMaXN0LnJlbW92ZShcInRleHQtc3VjY2Vzc1wiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcbiAgICAgICAgICAgIHRpbGUuZGVzdHJveSgpO1xuICAgICAgICAgICAgdmlldy5yZW1vdmUoKTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuYWN0aXZlRWRpdG9yXG4gICAgICAgICAgICAuc3Vic2NyaWJlKChlZGl0b3IpID0+IGVkaXRvciA/ICh2aWV3LnN0eWxlLmRpc3BsYXkgPSBcIlwiKSA6ICh2aWV3LnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIikpKTtcbiAgICB9XG59XG5jbGFzcyBGZWF0dXJlQnV0dG9ucyB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMucmVxdWlyZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy50aXRsZSA9IFwiU2hvdyBGZWF0dXJlIFRvZ2dsZXNcIjtcbiAgICAgICAgdGhpcy5kZXNjcmlwdGlvbiA9IFwiU2hvd3MgZmVhdHVyZSB0b2dnbGUgYnV0dG9ucyBpbiB0aGUgb21uaXNoYXJwIHdpbmRvdy5cIjtcbiAgICAgICAgdGhpcy5kZWZhdWx0ID0gdHJ1ZTtcbiAgICB9XG4gICAgYWN0aXZhdGUoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIGVhY2goYnV0dG9ucywgKGJ1dHRvbiwgaW5kZXgpID0+IHRoaXMuX2J1dHRvbihidXR0b24sIGluZGV4KSk7XG4gICAgfVxuICAgIGRpc3Bvc2UoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfVxuICAgIF9idXR0b24oYnV0dG9uLCBpbmRleCkge1xuICAgICAgICBjb25zdCB7IGNvbmZpZyB9ID0gYnV0dG9uO1xuICAgICAgICBsZXQgYnV0dG9uRGlzcG9zYWJsZTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbmZpZy5vYnNlcnZlKGNvbmZpZywgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICBpZiAoYnV0dG9uRGlzcG9zYWJsZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5yZW1vdmUoYnV0dG9uRGlzcG9zYWJsZSk7XG4gICAgICAgICAgICAgICAgYnV0dG9uRGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBidXR0b25EaXNwb3NhYmxlID0gdGhpcy5fbWFrZUJ1dHRvbihidXR0b24sIGluZGV4LCB2YWx1ZSk7XG4gICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGJ1dHRvbkRpc3Bvc2FibGUpO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xuICAgICAgICAgICAgYnV0dG9uRGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgICAgIH0pKTtcbiAgICB9XG4gICAgX21ha2VCdXR0b24oYnV0dG9uLCBpbmRleCwgZW5hYmxlZCkge1xuICAgICAgICBjb25zdCB7IG5hbWUsIGNvbmZpZywgaWNvbiwgdG9vbHRpcCB9ID0gYnV0dG9uO1xuICAgICAgICBsZXQgdG9vbHRpcERpc3Bvc2FibGU7XG4gICAgICAgIGNvbnN0IGh0bWxCdXR0b24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYVwiKTtcbiAgICAgICAgaHRtbEJ1dHRvbi5pZCA9IGAke2ljb259LW5hbWVgO1xuICAgICAgICBodG1sQnV0dG9uLmNsYXNzTGlzdC5hZGQoXCJidG5cIiwgaWNvbik7XG4gICAgICAgIGlmIChlbmFibGVkKSB7XG4gICAgICAgICAgICBodG1sQnV0dG9uLmNsYXNzTGlzdC5hZGQoXCJidG4tc3VjY2Vzc1wiKTtcbiAgICAgICAgfVxuICAgICAgICBodG1sQnV0dG9uLm9uY2xpY2sgPSAoKSA9PiBhdG9tLmNvbmZpZy5zZXQoY29uZmlnLCAhYXRvbS5jb25maWcuZ2V0KGNvbmZpZykpO1xuICAgICAgICBodG1sQnV0dG9uLm9ubW91c2VlbnRlciA9IChlKSA9PiB7XG4gICAgICAgICAgICB0b29sdGlwRGlzcG9zYWJsZSA9IGF0b20udG9vbHRpcHMuYWRkKGUuY3VycmVudFRhcmdldCwgeyB0aXRsZTogdG9vbHRpcCB9KTtcbiAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQodG9vbHRpcERpc3Bvc2FibGUpO1xuICAgICAgICB9O1xuICAgICAgICBodG1sQnV0dG9uLm9ubW91c2VsZWF2ZSA9IChlKSA9PiB7XG4gICAgICAgICAgICBpZiAodG9vbHRpcERpc3Bvc2FibGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUucmVtb3ZlKHRvb2x0aXBEaXNwb3NhYmxlKTtcbiAgICAgICAgICAgICAgICB0b29sdGlwRGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IGJ1dHRvbkRpc3Bvc2FibGUgPSBkb2NrLmFkZEJ1dHRvbihgJHtuYW1lfS1idXR0b25gLCB0b29sdGlwLCBodG1sQnV0dG9uLCB7IHByaW9yaXR5OiA1MDAgKyBpbmRleCB9KTtcbiAgICAgICAgcmV0dXJuIGJ1dHRvbkRpc3Bvc2FibGU7XG4gICAgfVxufVxuZXhwb3J0IGNvbnN0IGZlYXR1cmVCdXR0b25zID0gbmV3IEZlYXR1cmVCdXR0b25zKCk7XG5leHBvcnQgY29uc3QgZmVhdHVyZUVkaXRvckJ1dHRvbnMgPSBuZXcgRmVhdHVyZUVkaXRvckJ1dHRvbnMoKTtcbiIsImltcG9ydCB7Q29tcG9zaXRlRGlzcG9zYWJsZSwgRGlzcG9zYWJsZSwgSURpc3Bvc2FibGV9IGZyb20gXCJ0cy1kaXNwb3NhYmxlc1wiO1xyXG5pbXBvcnQge2VhY2h9IGZyb20gXCJsb2Rhc2hcIjtcclxuaW1wb3J0IHtPbW5pfSBmcm9tIFwiLi4vc2VydmVyL29tbmlcIjtcclxuaW1wb3J0IHtkb2NrfSBmcm9tIFwiLi4vYXRvbS9kb2NrXCI7XHJcblxyXG5pbnRlcmZhY2UgSUJ1dHRvbiB7XHJcbiAgICBuYW1lOiBzdHJpbmc7XHJcbiAgICBjb25maWc6IHN0cmluZztcclxuICAgIGljb246IHN0cmluZztcclxuICAgIHRvb2x0aXA6IHN0cmluZztcclxufVxyXG5cclxuY29uc3QgYnV0dG9ucyA9IFt7XHJcbiAgICAgICAgbmFtZTogXCJjb2RlLWxlbnNcIixcclxuICAgICAgICBjb25maWc6IFwib21uaXNoYXJwLWF0b20uY29kZUxlbnNcIixcclxuICAgICAgICBpY29uOiBcImljb24tdGVsZXNjb3BlXCIsXHJcbiAgICAgICAgdG9vbHRpcDogXCJFbmFibGUgLyBEaXNhYmxlIENvZGUgTGVuc1wiXHJcbiAgICB9XTtcclxuXHJcbmlmIChPbW5pLmF0b21WZXJzaW9uLm1pbm9yICE9PSAxIHx8IE9tbmkuYXRvbVZlcnNpb24ubWlub3IgPiA4KSB7XHJcbiAgICBidXR0b25zLnVuc2hpZnQoe1xyXG4gICAgICAgIG5hbWU6IFwiZW5oYW5jZWQtaGlnaGxpZ2h0aW5nXCIsXHJcbiAgICAgICAgY29uZmlnOiBcIm9tbmlzaGFycC1hdG9tLmVuaGFuY2VkSGlnaGxpZ2h0aW5nMTlcIixcclxuICAgICAgICBpY29uOiBcImljb24tcGVuY2lsXCIsXHJcbiAgICAgICAgdG9vbHRpcDogXCJFbmFibGUgLyBEaXNhYmxlIEVuaGFuY2VkIEhpZ2hsaWdodGluZ1wiXHJcbiAgICB9KTtcclxufSBlbHNlIHtcclxuICAgIGJ1dHRvbnMudW5zaGlmdCh7XHJcbiAgICAgICAgbmFtZTogXCJlbmhhbmNlZC1oaWdobGlnaHRpbmdcIixcclxuICAgICAgICBjb25maWc6IFwib21uaXNoYXJwLWF0b20uZW5oYW5jZWRIaWdobGlnaHRpbmdcIixcclxuICAgICAgICBpY29uOiBcImljb24tcGVuY2lsXCIsXHJcbiAgICAgICAgdG9vbHRpcDogXCJFbmFibGUgLyBEaXNhYmxlIEVuaGFuY2VkIEhpZ2hsaWdodGluZ1wiXHJcbiAgICB9KTtcclxufVxyXG5cclxuY2xhc3MgRmVhdHVyZUVkaXRvckJ1dHRvbnMgaW1wbGVtZW50cyBJQXRvbUZlYXR1cmUge1xyXG4gICAgcHJpdmF0ZSBkaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xyXG4gICAgcHJpdmF0ZSBzdGF0dXNCYXI6IGFueTtcclxuICAgIHByaXZhdGUgX2FjdGl2ZSA9IGZhbHNlO1xyXG5cclxuICAgIHB1YmxpYyBhY3RpdmF0ZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkaXNwb3NlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHNldHVwKHN0YXR1c0JhcjogYW55KSB7XHJcbiAgICAgICAgdGhpcy5zdGF0dXNCYXIgPSBzdGF0dXNCYXI7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9hY3RpdmUpIHtcclxuICAgICAgICAgICAgdGhpcy5fYXR0YWNoKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBhdHRhY2goKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuc3RhdHVzQmFyKSB7IHRoaXMuX2F0dGFjaCgpOyB9XHJcbiAgICAgICAgdGhpcy5fYWN0aXZlID0gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9hdHRhY2goKSB7XHJcbiAgICAgICAgZWFjaChidXR0b25zLCAoYnV0dG9uLCBpbmRleCkgPT4gdGhpcy5fYnV0dG9uKGJ1dHRvbiwgaW5kZXgpKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9idXR0b24oYnV0dG9uOiBJQnV0dG9uLCBpbmRleDogbnVtYmVyKSB7XHJcbiAgICAgICAgY29uc3Qge25hbWUsIGNvbmZpZywgaWNvbiwgdG9vbHRpcH0gPSBidXR0b247XHJcbiAgICAgICAgY29uc3QgdmlldyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xyXG4gICAgICAgIHZpZXcuY2xhc3NMaXN0LmFkZChcImlubGluZS1ibG9ja1wiLCBgJHtuYW1lfS1idXR0b25gLCBpY29uKTtcclxuICAgICAgICB2aWV3LnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcclxuICAgICAgICB2aWV3Lm9uY2xpY2sgPSAoKSA9PiBhdG9tLmNvbmZpZy5zZXQoY29uZmlnLCAhYXRvbS5jb25maWcuZ2V0KGNvbmZpZykpO1xyXG5cclxuICAgICAgICBsZXQgdG9vbHRpcERpc3Bvc2FibGU6IElEaXNwb3NhYmxlO1xyXG4gICAgICAgIHZpZXcub25tb3VzZWVudGVyID0gKCkgPT4ge1xyXG4gICAgICAgICAgICB0b29sdGlwRGlzcG9zYWJsZSA9IGF0b20udG9vbHRpcHMuYWRkKHZpZXcsIHsgdGl0bGU6IHRvb2x0aXAgfSk7XHJcbiAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQodG9vbHRpcERpc3Bvc2FibGUpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgdmlldy5vbm1vdXNlbGVhdmUgPSAoKSA9PiB7XHJcbiAgICAgICAgICAgIGlmICh0b29sdGlwRGlzcG9zYWJsZSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLnJlbW92ZSh0b29sdGlwRGlzcG9zYWJsZSk7XHJcbiAgICAgICAgICAgICAgICB0b29sdGlwRGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBsZXQgdGlsZTogYW55O1xyXG4gICAgICAgIGlmIChhdG9tLmNvbmZpZy5nZXQoXCJncmFtbWFyLXNlbGVjdG9yLnNob3dPblJpZ2h0U2lkZU9mU3RhdHVzQmFyXCIpKSB7XHJcbiAgICAgICAgICAgIHRpbGUgPSB0aGlzLnN0YXR1c0Jhci5hZGRSaWdodFRpbGUoe1xyXG4gICAgICAgICAgICAgICAgaXRlbTogdmlldyxcclxuICAgICAgICAgICAgICAgIHByaW9yaXR5OiA5IC0gaW5kZXggLSAxXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRpbGUgPSB0aGlzLnN0YXR1c0Jhci5hZGRMZWZ0VGlsZSh7XHJcbiAgICAgICAgICAgICAgICBpdGVtOiB2aWV3LFxyXG4gICAgICAgICAgICAgICAgcHJpb3JpdHk6IDExICsgaW5kZXggKyAxXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbmZpZy5vYnNlcnZlKGNvbmZpZywgKHZhbHVlOiBib29sZWFuKSA9PiB7XHJcbiAgICAgICAgICAgIGlmICh2YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgdmlldy5jbGFzc0xpc3QuYWRkKFwidGV4dC1zdWNjZXNzXCIpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdmlldy5jbGFzc0xpc3QucmVtb3ZlKFwidGV4dC1zdWNjZXNzXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcclxuICAgICAgICAgICAgdGlsZS5kZXN0cm95KCk7XHJcbiAgICAgICAgICAgIHZpZXcucmVtb3ZlKCk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuYWN0aXZlRWRpdG9yXHJcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoKGVkaXRvcikgPT4gZWRpdG9yID8gKHZpZXcuc3R5bGUuZGlzcGxheSA9IFwiXCIpIDogKHZpZXcuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiKSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZXF1aXJlZCA9IGZhbHNlO1xyXG4gICAgcHVibGljIHRpdGxlID0gXCJTaG93IEVkaXRvciBGZWF0dXJlIEJ1dHRvbnNcIjtcclxuICAgIHB1YmxpYyBkZXNjcmlwdGlvbiA9IFwiU2hvd3MgZmVhdHVyZSB0b2dnbGUgYnV0dG9ucyBpbiB0aGUgZWRpdG9yLlwiO1xyXG4gICAgcHVibGljIGRlZmF1bHQgPSB0cnVlO1xyXG59XHJcblxyXG5jbGFzcyBGZWF0dXJlQnV0dG9ucyBpbXBsZW1lbnRzIElGZWF0dXJlIHtcclxuICAgIHByaXZhdGUgZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxuXHJcbiAgICBwdWJsaWMgYWN0aXZhdGUoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgICAgICBlYWNoKGJ1dHRvbnMsIChidXR0b24sIGluZGV4KSA9PiB0aGlzLl9idXR0b24oYnV0dG9uLCBpbmRleCkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkaXNwb3NlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfYnV0dG9uKGJ1dHRvbjogSUJ1dHRvbiwgaW5kZXg6IG51bWJlcikge1xyXG4gICAgICAgIGNvbnN0IHtjb25maWd9ID0gYnV0dG9uO1xyXG5cclxuICAgICAgICBsZXQgYnV0dG9uRGlzcG9zYWJsZTogSURpc3Bvc2FibGU7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbmZpZy5vYnNlcnZlKGNvbmZpZywgKHZhbHVlOiBib29sZWFuKSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChidXR0b25EaXNwb3NhYmxlKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUucmVtb3ZlKGJ1dHRvbkRpc3Bvc2FibGUpO1xyXG4gICAgICAgICAgICAgICAgYnV0dG9uRGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGJ1dHRvbkRpc3Bvc2FibGUgPSB0aGlzLl9tYWtlQnV0dG9uKGJ1dHRvbiwgaW5kZXgsIHZhbHVlKTtcclxuICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChidXR0b25EaXNwb3NhYmxlKTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xyXG4gICAgICAgICAgICBidXR0b25EaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgICAgICB9KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfbWFrZUJ1dHRvbihidXR0b246IElCdXR0b24sIGluZGV4OiBudW1iZXIsIGVuYWJsZWQ6IGJvb2xlYW4pIHtcclxuICAgICAgICBjb25zdCB7bmFtZSwgY29uZmlnLCBpY29uLCB0b29sdGlwfSA9IGJ1dHRvbjtcclxuXHJcbiAgICAgICAgbGV0IHRvb2x0aXBEaXNwb3NhYmxlOiBJRGlzcG9zYWJsZTtcclxuICAgICAgICBjb25zdCBodG1sQnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImFcIik7XHJcbiAgICAgICAgaHRtbEJ1dHRvbi5pZCA9IGAke2ljb259LW5hbWVgO1xyXG4gICAgICAgIGh0bWxCdXR0b24uY2xhc3NMaXN0LmFkZChcImJ0blwiLGljb24pO1xyXG4gICAgICAgIGlmIChlbmFibGVkKSB7XHJcbiAgICAgICAgICAgIGh0bWxCdXR0b24uY2xhc3NMaXN0LmFkZChcImJ0bi1zdWNjZXNzXCIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaHRtbEJ1dHRvbi5vbmNsaWNrID0gKCkgPT4gYXRvbS5jb25maWcuc2V0KGNvbmZpZywgIWF0b20uY29uZmlnLmdldChjb25maWcpKTtcclxuICAgICAgICBodG1sQnV0dG9uLm9ubW91c2VlbnRlciA9IChlKSA9PiB7XHJcbiAgICAgICAgICAgIHRvb2x0aXBEaXNwb3NhYmxlID0gYXRvbS50b29sdGlwcy5hZGQoPGFueT5lLmN1cnJlbnRUYXJnZXQsIHsgdGl0bGU6IHRvb2x0aXAgfSk7XHJcbiAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQodG9vbHRpcERpc3Bvc2FibGUpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgaHRtbEJ1dHRvbi5vbm1vdXNlbGVhdmUgPSAoZSkgPT4ge1xyXG4gICAgICAgICAgICBpZiAodG9vbHRpcERpc3Bvc2FibGUpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5yZW1vdmUodG9vbHRpcERpc3Bvc2FibGUpO1xyXG4gICAgICAgICAgICAgICAgdG9vbHRpcERpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgY29uc3QgYnV0dG9uRGlzcG9zYWJsZSA9IGRvY2suYWRkQnV0dG9uKFxyXG4gICAgICAgICAgICBgJHtuYW1lfS1idXR0b25gLFxyXG4gICAgICAgICAgICB0b29sdGlwLFxyXG4gICAgICAgICAgICBodG1sQnV0dG9uLFxyXG4gICAgICAgICAgICB7IHByaW9yaXR5OiA1MDAgKyBpbmRleCB9XHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGJ1dHRvbkRpc3Bvc2FibGU7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlcXVpcmVkID0gZmFsc2U7XHJcbiAgICBwdWJsaWMgdGl0bGUgPSBcIlNob3cgRmVhdHVyZSBUb2dnbGVzXCI7XHJcbiAgICBwdWJsaWMgZGVzY3JpcHRpb24gPSBcIlNob3dzIGZlYXR1cmUgdG9nZ2xlIGJ1dHRvbnMgaW4gdGhlIG9tbmlzaGFycCB3aW5kb3cuXCI7XHJcbiAgICBwdWJsaWMgZGVmYXVsdCA9IHRydWU7XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBmZWF0dXJlQnV0dG9ucyA9IG5ldyBGZWF0dXJlQnV0dG9ucygpO1xyXG5leHBvcnQgY29uc3QgZmVhdHVyZUVkaXRvckJ1dHRvbnMgPSBuZXcgRmVhdHVyZUVkaXRvckJ1dHRvbnMoKTtcclxuIl19
