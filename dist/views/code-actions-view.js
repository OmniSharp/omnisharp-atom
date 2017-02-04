'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.factory = factory;

var _atomSpacePenViews = require('atom-space-pen-views');

var SpacePen = _interopRequireWildcard(_atomSpacePenViews);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function factory(options, editor) {
    var codeActionView = editor.codeActionView;
    if (!codeActionView) {
        editor.codeActionView = codeActionView = new CodeActionsView(options, editor);
    } else {
        codeActionView.options = options;
    }
    codeActionView.setItems();
    codeActionView.show();
    return codeActionView;
}

var CodeActionsView = function (_SpacePen$SelectListV) {
    _inherits(CodeActionsView, _SpacePen$SelectListV);

    function CodeActionsView(options, editor) {
        _classCallCheck(this, CodeActionsView);

        var _this = _possibleConstructorReturn(this, (CodeActionsView.__proto__ || Object.getPrototypeOf(CodeActionsView)).call(this));

        _this.options = options;
        _this.editor = editor;
        _this._editorElement = atom.views.getView(editor);
        _this._vimMode = atom.packages.isPackageActive('vim-mode');
        _this.$.addClass('code-actions-overlay');
        _this.filterEditorView.model.placeholderText = 'Filter list';
        return _this;
    }

    _createClass(CodeActionsView, [{
        key: 'setItems',
        value: function setItems() {
            SpacePen.SelectListView.prototype.setItems.call(this, this.options.items);
        }
    }, {
        key: 'confirmed',
        value: function confirmed(item) {
            this.cancel();
            this.options.confirmed(item);
            this.enableVimMode();
            return null;
        }
    }, {
        key: 'show',
        value: function show() {
            var _this2 = this;

            this.storeFocusedElement();
            this.disableVimMode();
            this.destroyOverlay();
            this._overlayDecoration = this.editor.decorateMarker(this.editor.getLastCursor().getMarker(), { type: 'overlay', position: 'tail', item: this });
            setTimeout(function () {
                return _this2.focusFilterEditor();
            }, 100);
        }
    }, {
        key: 'hide',
        value: function hide() {
            this.restoreFocus();
            this.enableVimMode();
            this.destroyOverlay();
        }
    }, {
        key: 'destroyOverlay',
        value: function destroyOverlay() {
            if (this._overlayDecoration) this._overlayDecoration.destroy();
        }
    }, {
        key: 'cancelled',
        value: function cancelled() {
            this.hide();
        }
    }, {
        key: 'enableVimMode',
        value: function enableVimMode() {
            if (this._vimMode) {
                this._editorElement.classList.add('vim-mode');
            }
        }
    }, {
        key: 'disableVimMode',
        value: function disableVimMode() {
            if (this._vimMode) {
                this._editorElement.classList.remove('vim-mode');
            }
        }
    }, {
        key: 'getFilterKey',
        value: function getFilterKey() {
            return 'Name';
        }
    }, {
        key: 'viewForItem',
        value: function viewForItem(item) {
            return SpacePen.$$(function () {
                var _this3 = this;

                return this.li({
                    'class': 'event',
                    'data-event-name': item.Name
                }, function () {
                    return _this3.span(item.Name, {
                        title: item.Name
                    });
                });
            });
        }
    }, {
        key: '$',
        get: function get() {
            return this;
        }
    }]);

    return CodeActionsView;
}(SpacePen.SelectListView);
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy9jb2RlLWFjdGlvbnMtdmlldy50cyJdLCJuYW1lcyI6WyJmYWN0b3J5IiwiU3BhY2VQZW4iLCJvcHRpb25zIiwiZWRpdG9yIiwiY29kZUFjdGlvblZpZXciLCJDb2RlQWN0aW9uc1ZpZXciLCJzZXRJdGVtcyIsInNob3ciLCJfZWRpdG9yRWxlbWVudCIsImF0b20iLCJ2aWV3cyIsImdldFZpZXciLCJfdmltTW9kZSIsInBhY2thZ2VzIiwiaXNQYWNrYWdlQWN0aXZlIiwiJCIsImFkZENsYXNzIiwiZmlsdGVyRWRpdG9yVmlldyIsIm1vZGVsIiwicGxhY2Vob2xkZXJUZXh0IiwiU2VsZWN0TGlzdFZpZXciLCJwcm90b3R5cGUiLCJjYWxsIiwiaXRlbXMiLCJpdGVtIiwiY2FuY2VsIiwiY29uZmlybWVkIiwiZW5hYmxlVmltTW9kZSIsInN0b3JlRm9jdXNlZEVsZW1lbnQiLCJkaXNhYmxlVmltTW9kZSIsImRlc3Ryb3lPdmVybGF5IiwiX292ZXJsYXlEZWNvcmF0aW9uIiwiZGVjb3JhdGVNYXJrZXIiLCJnZXRMYXN0Q3Vyc29yIiwiZ2V0TWFya2VyIiwidHlwZSIsInBvc2l0aW9uIiwic2V0VGltZW91dCIsImZvY3VzRmlsdGVyRWRpdG9yIiwicmVzdG9yZUZvY3VzIiwiZGVzdHJveSIsImhpZGUiLCJjbGFzc0xpc3QiLCJhZGQiLCJyZW1vdmUiLCIkJCIsImxpIiwiTmFtZSIsInNwYW4iLCJ0aXRsZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7UUFPTUEsTyxHQUFBQSxPOztBQVBOOztJQUFZQyxROzs7Ozs7Ozs7O0FBT04sU0FBQUQsT0FBQSxDQUF3QkUsT0FBeEIsRUFBMkRDLE1BQTNELEVBQWtGO0FBQ3BGLFFBQUlDLGlCQUF1QkQsT0FBUUMsY0FBbkM7QUFDQSxRQUFJLENBQUNBLGNBQUwsRUFBcUI7QUFDWEQsZUFBUUMsY0FBUixHQUF5QkEsaUJBQWlCLElBQUlDLGVBQUosQ0FBdUJILE9BQXZCLEVBQWdDQyxNQUFoQyxDQUExQztBQUNULEtBRkQsTUFFTztBQUNIQyx1QkFBZUYsT0FBZixHQUF5QkEsT0FBekI7QUFDSDtBQUVERSxtQkFBZUUsUUFBZjtBQUNBRixtQkFBZUcsSUFBZjtBQUNBLFdBQU9ILGNBQVA7QUFDSDs7SUFFREMsZTs7O0FBTUksNkJBQW1CSCxPQUFuQixFQUE2REMsTUFBN0QsRUFBb0Y7QUFBQTs7QUFBQTs7QUFBakUsY0FBQUQsT0FBQSxHQUFBQSxPQUFBO0FBQTBDLGNBQUFDLE1BQUEsR0FBQUEsTUFBQTtBQUV6RCxjQUFLSyxjQUFMLEdBQXNCQyxLQUFLQyxLQUFMLENBQVdDLE9BQVgsQ0FBbUJSLE1BQW5CLENBQXRCO0FBQ0EsY0FBS1MsUUFBTCxHQUFnQkgsS0FBS0ksUUFBTCxDQUFjQyxlQUFkLENBQThCLFVBQTlCLENBQWhCO0FBQ0EsY0FBS0MsQ0FBTCxDQUFPQyxRQUFQLENBQWdCLHNCQUFoQjtBQUNNLGNBQU1DLGdCQUFOLENBQXVCQyxLQUF2QixDQUE2QkMsZUFBN0IsR0FBK0MsYUFBL0M7QUFMMEU7QUFNbkY7Ozs7bUNBTWM7QUFFWGxCLHFCQUFTbUIsY0FBVCxDQUF3QkMsU0FBeEIsQ0FBa0NmLFFBQWxDLENBQTJDZ0IsSUFBM0MsQ0FBZ0QsSUFBaEQsRUFBc0QsS0FBS3BCLE9BQUwsQ0FBYXFCLEtBQW5FO0FBQ0g7OztrQ0FFZ0JDLEksRUFBUztBQUN0QixpQkFBS0MsTUFBTDtBQUVBLGlCQUFLdkIsT0FBTCxDQUFhd0IsU0FBYixDQUF1QkYsSUFBdkI7QUFFQSxpQkFBS0csYUFBTDtBQUNBLG1CQUFPLElBQVA7QUFDSDs7OytCQUVVO0FBQUE7O0FBQ1AsaUJBQUtDLG1CQUFMO0FBQ0EsaUJBQUtDLGNBQUw7QUFDQSxpQkFBS0MsY0FBTDtBQUNBLGlCQUFLQyxrQkFBTCxHQUEwQixLQUFLNUIsTUFBTCxDQUFZNkIsY0FBWixDQUEyQixLQUFLN0IsTUFBTCxDQUFZOEIsYUFBWixHQUE0QkMsU0FBNUIsRUFBM0IsRUFDdEIsRUFBRUMsTUFBTSxTQUFSLEVBQW1CQyxVQUFVLE1BQTdCLEVBQXFDWixNQUFNLElBQTNDLEVBRHNCLENBQTFCO0FBR0FhLHVCQUFXO0FBQUEsdUJBQU0sT0FBS0MsaUJBQUwsRUFBTjtBQUFBLGFBQVgsRUFBMkMsR0FBM0M7QUFDSDs7OytCQUVVO0FBQ1AsaUJBQUtDLFlBQUw7QUFDQSxpQkFBS1osYUFBTDtBQUNBLGlCQUFLRyxjQUFMO0FBQ0g7Ozt5Q0FFb0I7QUFDakIsZ0JBQUksS0FBS0Msa0JBQVQsRUFDSSxLQUFLQSxrQkFBTCxDQUF3QlMsT0FBeEI7QUFDUDs7O29DQUdlO0FBQ1osaUJBQUtDLElBQUw7QUFDSDs7O3dDQUVtQjtBQUNoQixnQkFBSSxLQUFLN0IsUUFBVCxFQUFtQjtBQUNmLHFCQUFLSixjQUFMLENBQW9Ca0MsU0FBcEIsQ0FBOEJDLEdBQTlCLENBQWtDLFVBQWxDO0FBQ0g7QUFDSjs7O3lDQUVvQjtBQUNqQixnQkFBSSxLQUFLL0IsUUFBVCxFQUFtQjtBQUNmLHFCQUFLSixjQUFMLENBQW9Ca0MsU0FBcEIsQ0FBOEJFLE1BQTlCLENBQXFDLFVBQXJDO0FBQ0g7QUFDSjs7O3VDQUVrQjtBQUFLLG1CQUFPLE1BQVA7QUFBZ0I7OztvQ0FFckJwQixJLEVBQVM7QUFFeEIsbUJBQU92QixTQUFTNEMsRUFBVCxDQUFZLFlBQUE7QUFBQTs7QUFDZix1QkFBTyxLQUFLQyxFQUFMLENBQVE7QUFDWCw2QkFBUyxPQURFO0FBRVgsdUNBQW1CdEIsS0FBS3VCO0FBRmIsaUJBQVIsRUFHSixZQUFBO0FBQ0MsMkJBQU8sT0FBS0MsSUFBTCxDQUFVeEIsS0FBS3VCLElBQWYsRUFBcUI7QUFDeEJFLCtCQUFPekIsS0FBS3VCO0FBRFkscUJBQXJCLENBQVA7QUFHSCxpQkFQTSxDQUFQO0FBUUgsYUFUTSxDQUFQO0FBVUg7Ozs0QkF0RUk7QUFDRCxtQkFBWSxJQUFaO0FBQ0g7Ozs7RUFoQjRCOUMsU0FBU21CLGMiLCJmaWxlIjoibGliL3ZpZXdzL2NvZGUtYWN0aW9ucy12aWV3LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgU3BhY2VQZW4gZnJvbSAnYXRvbS1zcGFjZS1wZW4tdmlld3MnO1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBTZWxlY3RMaXN0Vmlld09wdGlvbnM8VD4ge1xyXG4gICAgaXRlbXM6IFRbXTtcclxuICAgIGNvbmZpcm1lZDogKGl0ZW06IFQpID0+IGFueTtcclxufVxyXG5cclxuZXhwb3J0ICBmdW5jdGlvbiBmYWN0b3J5IDxUPiAob3B0aW9uczogU2VsZWN0TGlzdFZpZXdPcHRpb25zPFQ+LCBlZGl0b3I6IEF0b20uVGV4dEVkaXRvcik6IENvZGVBY3Rpb25zVmlldzxUPiB7XHJcbiAgICBsZXQgY29kZUFjdGlvblZpZXcgPSAoPGFueT5lZGl0b3IpLmNvZGVBY3Rpb25WaWV3O1xyXG4gICAgaWYgKCFjb2RlQWN0aW9uVmlldykge1xyXG4gICAgICAgICg8YW55PmVkaXRvcikuY29kZUFjdGlvblZpZXcgPSBjb2RlQWN0aW9uVmlldyA9IG5ldyBDb2RlQWN0aW9uc1ZpZXc8VD4ob3B0aW9ucywgZWRpdG9yKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgY29kZUFjdGlvblZpZXcub3B0aW9ucyA9IG9wdGlvbnM7XHJcbiAgICB9XHJcblxyXG4gICAgY29kZUFjdGlvblZpZXcuc2V0SXRlbXMoKTtcclxuICAgIGNvZGVBY3Rpb25WaWV3LnNob3coKTtcclxuICAgIHJldHVybiBjb2RlQWN0aW9uVmlldztcclxufVxyXG5cclxuY2xhc3MgQ29kZUFjdGlvbnNWaWV3PFQ+IGV4dGVuZHMgU3BhY2VQZW4uU2VsZWN0TGlzdFZpZXcge1xyXG5cclxuICAgIHByaXZhdGUgX292ZXJsYXlEZWNvcmF0aW9uOiBhbnk7XHJcbiAgICBwcml2YXRlIF92aW1Nb2RlOiBib29sZWFuO1xyXG4gICAgcHJpdmF0ZSBfZWRpdG9yRWxlbWVudDogYW55O1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHB1YmxpYyBvcHRpb25zOiBTZWxlY3RMaXN0Vmlld09wdGlvbnM8VD4sIHB1YmxpYyBlZGl0b3I6IEF0b20uVGV4dEVkaXRvcikge1xyXG4gICAgICAgIHN1cGVyKCk7XHJcbiAgICAgICAgdGhpcy5fZWRpdG9yRWxlbWVudCA9IGF0b20udmlld3MuZ2V0VmlldyhlZGl0b3IpO1xyXG4gICAgICAgIHRoaXMuX3ZpbU1vZGUgPSBhdG9tLnBhY2thZ2VzLmlzUGFja2FnZUFjdGl2ZSgndmltLW1vZGUnKTtcclxuICAgICAgICB0aGlzLiQuYWRkQ2xhc3MoJ2NvZGUtYWN0aW9ucy1vdmVybGF5Jyk7XHJcbiAgICAgICAgKDxhbnk+dGhpcykuZmlsdGVyRWRpdG9yVmlldy5tb2RlbC5wbGFjZWhvbGRlclRleHQgPSAnRmlsdGVyIGxpc3QnO1xyXG4gICAgfVxyXG5cclxuICAgIGdldCAkKCk6IEpRdWVyeSB7XHJcbiAgICAgICAgcmV0dXJuIDxhbnk+dGhpcztcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2V0SXRlbXMoKSB7XHJcbiAgICAgICAgLy9zdXBlci5zZXRJdGVtcyh0aGlzLm9wdGlvbnMuaXRlbXMpXHJcbiAgICAgICAgU3BhY2VQZW4uU2VsZWN0TGlzdFZpZXcucHJvdG90eXBlLnNldEl0ZW1zLmNhbGwodGhpcywgdGhpcy5vcHRpb25zLml0ZW1zKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgY29uZmlybWVkKGl0ZW06IGFueSk6IGFueSB7XHJcbiAgICAgICAgdGhpcy5jYW5jZWwoKTsgLy93aWxsIGNsb3NlIHRoZSB2aWV3XHJcblxyXG4gICAgICAgIHRoaXMub3B0aW9ucy5jb25maXJtZWQoaXRlbSk7XHJcblxyXG4gICAgICAgIHRoaXMuZW5hYmxlVmltTW9kZSgpO1xyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzaG93KCkge1xyXG4gICAgICAgIHRoaXMuc3RvcmVGb2N1c2VkRWxlbWVudCgpO1xyXG4gICAgICAgIHRoaXMuZGlzYWJsZVZpbU1vZGUoKTtcclxuICAgICAgICB0aGlzLmRlc3Ryb3lPdmVybGF5KCk7XHJcbiAgICAgICAgdGhpcy5fb3ZlcmxheURlY29yYXRpb24gPSB0aGlzLmVkaXRvci5kZWNvcmF0ZU1hcmtlcih0aGlzLmVkaXRvci5nZXRMYXN0Q3Vyc29yKCkuZ2V0TWFya2VyKCksXHJcbiAgICAgICAgICAgIHsgdHlwZTogJ292ZXJsYXknLCBwb3NpdGlvbjogJ3RhaWwnLCBpdGVtOiB0aGlzIH0pO1xyXG5cclxuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHRoaXMuZm9jdXNGaWx0ZXJFZGl0b3IoKSwgMTAwKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgaGlkZSgpIHtcclxuICAgICAgICB0aGlzLnJlc3RvcmVGb2N1cygpO1xyXG4gICAgICAgIHRoaXMuZW5hYmxlVmltTW9kZSgpO1xyXG4gICAgICAgIHRoaXMuZGVzdHJveU92ZXJsYXkoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGVzdHJveU92ZXJsYXkoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuX292ZXJsYXlEZWNvcmF0aW9uKVxyXG4gICAgICAgICAgICB0aGlzLl9vdmVybGF5RGVjb3JhdGlvbi5kZXN0cm95KCk7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIHB1YmxpYyBjYW5jZWxsZWQoKSB7XHJcbiAgICAgICAgdGhpcy5oaWRlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGVuYWJsZVZpbU1vZGUoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuX3ZpbU1vZGUpIHtcclxuICAgICAgICAgICAgdGhpcy5fZWRpdG9yRWxlbWVudC5jbGFzc0xpc3QuYWRkKCd2aW0tbW9kZScpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGlzYWJsZVZpbU1vZGUoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuX3ZpbU1vZGUpIHtcclxuICAgICAgICAgICAgdGhpcy5fZWRpdG9yRWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKCd2aW0tbW9kZScpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0RmlsdGVyS2V5KCkgeyByZXR1cm4gJ05hbWUnOyB9XHJcblxyXG4gICAgcHVibGljIHZpZXdGb3JJdGVtKGl0ZW06IGFueSkge1xyXG5cclxuICAgICAgICByZXR1cm4gU3BhY2VQZW4uJCQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5saSh7XHJcbiAgICAgICAgICAgICAgICAnY2xhc3MnOiAnZXZlbnQnLFxyXG4gICAgICAgICAgICAgICAgJ2RhdGEtZXZlbnQtbmFtZSc6IGl0ZW0uTmFtZVxyXG4gICAgICAgICAgICB9LCAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zcGFuKGl0ZW0uTmFtZSwge1xyXG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOiBpdGVtLk5hbWVcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxufVxyXG4iXX0=
