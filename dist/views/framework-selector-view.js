'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.FrameworkSelectorSelectListView = exports.FrameworkSelectorComponent = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _atomSpacePenViews = require('atom-space-pen-views');

var SpacePen = _interopRequireWildcard(_atomSpacePenViews);

var _frameworkSelector = require('../atom/framework-selector');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var $ = require('jquery');

var FrameworkSelectorComponent = exports.FrameworkSelectorComponent = function (_HTMLAnchorElement) {
    _inherits(FrameworkSelectorComponent, _HTMLAnchorElement);

    function FrameworkSelectorComponent() {
        _classCallCheck(this, FrameworkSelectorComponent);

        return _possibleConstructorReturn(this, (FrameworkSelectorComponent.__proto__ || Object.getPrototypeOf(FrameworkSelectorComponent)).apply(this, arguments));
    }

    _createClass(FrameworkSelectorComponent, [{
        key: 'createdCallback',
        value: function createdCallback() {
            var _this2 = this;

            this.onclick = function (e) {
                var view = new FrameworkSelectorSelectListView(atom.workspace.getActiveTextEditor(), {
                    attachTo: '.framework-selector',
                    alignLeft: _this2.alignLeft,
                    items: _this2.frameworks,
                    save: function save(framework) {
                        _frameworkSelector.frameworkSelector.setActiveFramework(framework);
                        view.hide();
                    }
                });
                view.appendTo(atom.views.getView(atom.workspace));
                view.setItems();
                view.show();
            };
        }
    }, {
        key: 'activeFramework',
        get: function get() {
            return this._activeFramework;
        },
        set: function set(value) {
            this._activeFramework = value;this.innerText = this.activeFramework.FriendlyName;
        }
    }]);

    return FrameworkSelectorComponent;
}(HTMLAnchorElement);

exports.FrameworkSelectorComponent = document.registerElement('omnisharp-framework-selector', { prototype: FrameworkSelectorComponent.prototype });

var FrameworkSelectorSelectListView = exports.FrameworkSelectorSelectListView = function (_SpacePen$SelectListV) {
    _inherits(FrameworkSelectorSelectListView, _SpacePen$SelectListV);

    function FrameworkSelectorSelectListView(editor, options) {
        _classCallCheck(this, FrameworkSelectorSelectListView);

        var _this3 = _possibleConstructorReturn(this, (FrameworkSelectorSelectListView.__proto__ || Object.getPrototypeOf(FrameworkSelectorSelectListView)).call(this));

        _this3.editor = editor;
        _this3.options = options;
        _this3.$.addClass('code-actions-overlay');
        _this3.filterEditorView.model.placeholderText = 'Filter list';
        return _this3;
    }

    _createClass(FrameworkSelectorSelectListView, [{
        key: 'setItems',
        value: function setItems() {
            SpacePen.SelectListView.prototype.setItems.call(this, this.options.items);
        }
    }, {
        key: 'confirmed',
        value: function confirmed(item) {
            this.cancel();
            this.options.save(item);
            return null;
        }
    }, {
        key: 'show',
        value: function show() {
            var _this4 = this;

            this.storeFocusedElement();
            setTimeout(function () {
                return _this4.focusFilterEditor();
            }, 100);
            var width = 180;
            var node = this[0];
            var attachTo = $(document.querySelectorAll(this.options.attachTo));
            var offset = attachTo.offset();
            if (offset) {
                if (this.options.alignLeft) {
                    $(node).css({
                        position: 'fixed',
                        top: offset.top - node.clientHeight - 18,
                        left: offset.left,
                        width: width
                    });
                } else {
                    $(node).css({
                        position: 'fixed',
                        top: offset.top - node.clientHeight - 18,
                        left: offset.left - width + attachTo[0].clientWidth,
                        width: width
                    });
                }
            }
        }
    }, {
        key: 'hide',
        value: function hide() {
            this.restoreFocus();
            this.remove();
        }
    }, {
        key: 'cancelled',
        value: function cancelled() {
            this.hide();
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
                var _this5 = this;

                return this.li({
                    'class': 'event',
                    'data-event-name': item.Name
                }, function () {
                    return _this5.span(item.FriendlyName, {
                        title: item.FriendlyName
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

    return FrameworkSelectorSelectListView;
}(SpacePen.SelectListView);
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy9mcmFtZXdvcmstc2VsZWN0b3Itdmlldy50cyJdLCJuYW1lcyI6WyJTcGFjZVBlbiIsIiQiLCJyZXF1aXJlIiwiRnJhbWV3b3JrU2VsZWN0b3JDb21wb25lbnQiLCJvbmNsaWNrIiwidmlldyIsIkZyYW1ld29ya1NlbGVjdG9yU2VsZWN0TGlzdFZpZXciLCJhdG9tIiwid29ya3NwYWNlIiwiZ2V0QWN0aXZlVGV4dEVkaXRvciIsImF0dGFjaFRvIiwiYWxpZ25MZWZ0IiwiaXRlbXMiLCJmcmFtZXdvcmtzIiwic2F2ZSIsImZyYW1ld29yayIsInNldEFjdGl2ZUZyYW1ld29yayIsImhpZGUiLCJhcHBlbmRUbyIsInZpZXdzIiwiZ2V0VmlldyIsInNldEl0ZW1zIiwic2hvdyIsIl9hY3RpdmVGcmFtZXdvcmsiLCJ2YWx1ZSIsImlubmVyVGV4dCIsImFjdGl2ZUZyYW1ld29yayIsIkZyaWVuZGx5TmFtZSIsIkhUTUxBbmNob3JFbGVtZW50IiwiZXhwb3J0cyIsImRvY3VtZW50IiwicmVnaXN0ZXJFbGVtZW50IiwicHJvdG90eXBlIiwiZWRpdG9yIiwib3B0aW9ucyIsImFkZENsYXNzIiwiZmlsdGVyRWRpdG9yVmlldyIsIm1vZGVsIiwicGxhY2Vob2xkZXJUZXh0IiwiU2VsZWN0TGlzdFZpZXciLCJjYWxsIiwiaXRlbSIsImNhbmNlbCIsInN0b3JlRm9jdXNlZEVsZW1lbnQiLCJzZXRUaW1lb3V0IiwiZm9jdXNGaWx0ZXJFZGl0b3IiLCJ3aWR0aCIsIm5vZGUiLCJxdWVyeVNlbGVjdG9yQWxsIiwib2Zmc2V0IiwiY3NzIiwicG9zaXRpb24iLCJ0b3AiLCJjbGllbnRIZWlnaHQiLCJsZWZ0IiwiY2xpZW50V2lkdGgiLCJyZXN0b3JlRm9jdXMiLCJyZW1vdmUiLCIkJCIsImxpIiwiTmFtZSIsInNwYW4iLCJ0aXRsZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0lBQVlBLFE7O0FBRVo7Ozs7Ozs7Ozs7QUFDQSxJQUFNQyxJQUFrQkMsUUFB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QUFkLEdBQXNCcEMsU0FBUyxDQUFULEVBQVk2QyxXQUhoQztBQUlSVCwrQkFBT0E7QUFKQyxxQkFBWjtBQU1IO0FBQ0o7QUFDSjs7OytCQUVVO0FBQ1AsaUJBQUtVLFlBQUw7QUFDQSxpQkFBS0MsTUFBTDtBQUNIOzs7b0NBRWU7QUFDWixpQkFBS3hDLElBQUw7QUFDSDs7O3VDQUVrQjtBQUFLLG1CQUFPLE1BQVA7QUFBZ0I7OztvQ0FFckJ3QixJLEVBQVM7QUFDeEIsbUJBQU96QyxTQUFTMEQsRUFBVCxDQUFZLFlBQUE7QUFBQTs7QUFDZix1QkFBTyxLQUFLQyxFQUFMLENBQVE7QUFDWCw2QkFBUyxPQURFO0FBRVgsdUNBQW1CbEIsS0FBS21CO0FBRmIsaUJBQVIsRUFHSixZQUFBO0FBQ0MsMkJBQU8sT0FBS0MsSUFBTCxDQUFVcEIsS0FBS2QsWUFBZixFQUE2QjtBQUNoQ21DLCtCQUFPckIsS0FBS2Q7QUFEb0IscUJBQTdCLENBQVA7QUFHSCxpQkFQTSxDQUFQO0FBUUgsYUFUTSxDQUFQO0FBVUg7Ozs0QkEvREk7QUFDRCxtQkFBWSxJQUFaO0FBQ0g7Ozs7RUFUZ0QzQixTQUFTdUMsYyIsImZpbGUiOiJsaWIvdmlld3MvZnJhbWV3b3JrLXNlbGVjdG9yLXZpZXcuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBTcGFjZVBlbiBmcm9tICdhdG9tLXNwYWNlLXBlbi12aWV3cyc7XHJcbmltcG9ydCB7TW9kZWxzfSBmcm9tICdvbW5pc2hhcnAtY2xpZW50JztcclxuaW1wb3J0IHtmcmFtZXdvcmtTZWxlY3Rvcn0gZnJvbSAnLi4vYXRvbS9mcmFtZXdvcmstc2VsZWN0b3InO1xyXG5jb25zdCAkOiBKUXVlcnlTdGF0aWMgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbmludGVyZmFjZSBGcmFtZXdvcmtTZWxlY3RvclN0YXRlIHtcclxuICAgIGZyYW1ld29ya3M/OiBNb2RlbHMuRG90TmV0RnJhbWV3b3JrW107XHJcbiAgICBhY3RpdmVGcmFtZXdvcms/OiBNb2RlbHMuRG90TmV0RnJhbWV3b3JrO1xyXG4gICAgYWxpZ25MZWZ0PzogYm9vbGVhbjtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIEZyYW1ld29ya1NlbGVjdG9yQ29tcG9uZW50IGV4dGVuZHMgSFRNTEFuY2hvckVsZW1lbnQgaW1wbGVtZW50cyBXZWJDb21wb25lbnQge1xyXG4gICAgcHVibGljIGZyYW1ld29ya3M6IE1vZGVscy5Eb3ROZXRGcmFtZXdvcmtbXTtcclxuICAgIHByaXZhdGUgX2FjdGl2ZUZyYW1ld29yazogTW9kZWxzLkRvdE5ldEZyYW1ld29yaztcclxuICAgIHB1YmxpYyBnZXQgYWN0aXZlRnJhbWV3b3JrKCkgeyByZXR1cm4gdGhpcy5fYWN0aXZlRnJhbWV3b3JrOyB9XHJcbiAgICBwdWJsaWMgc2V0IGFjdGl2ZUZyYW1ld29yayh2YWx1ZSkgeyB0aGlzLl9hY3RpdmVGcmFtZXdvcmsgPSB2YWx1ZTsgdGhpcy5pbm5lclRleHQgPSB0aGlzLmFjdGl2ZUZyYW1ld29yay5GcmllbmRseU5hbWU7IH1cclxuXHJcbiAgICBwdWJsaWMgYWxpZ25MZWZ0OiBib29sZWFuO1xyXG5cclxuICAgIHB1YmxpYyBjcmVhdGVkQ2FsbGJhY2soKSB7XHJcbiAgICAgICAgdGhpcy5vbmNsaWNrID0gZSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IHZpZXcgPSBuZXcgRnJhbWV3b3JrU2VsZWN0b3JTZWxlY3RMaXN0VmlldyhhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKCksIHtcclxuICAgICAgICAgICAgICAgIGF0dGFjaFRvOiAnLmZyYW1ld29yay1zZWxlY3RvcicsXHJcbiAgICAgICAgICAgICAgICBhbGlnbkxlZnQ6IHRoaXMuYWxpZ25MZWZ0LFxyXG4gICAgICAgICAgICAgICAgaXRlbXM6IHRoaXMuZnJhbWV3b3JrcyxcclxuICAgICAgICAgICAgICAgIHNhdmU6IChmcmFtZXdvcms6IE1vZGVscy5Eb3ROZXRGcmFtZXdvcmspID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBmcmFtZXdvcmtTZWxlY3Rvci5zZXRBY3RpdmVGcmFtZXdvcmsoZnJhbWV3b3JrKTtcclxuICAgICAgICAgICAgICAgICAgICB2aWV3LmhpZGUoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHZpZXcuYXBwZW5kVG8oPGFueT5hdG9tLnZpZXdzLmdldFZpZXcoYXRvbS53b3Jrc3BhY2UpKTtcclxuICAgICAgICAgICAgdmlldy5zZXRJdGVtcygpO1xyXG4gICAgICAgICAgICB2aWV3LnNob3coKTtcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG59XHJcblxyXG4oPGFueT5leHBvcnRzKS5GcmFtZXdvcmtTZWxlY3RvckNvbXBvbmVudCA9ICg8YW55PmRvY3VtZW50KS5yZWdpc3RlckVsZW1lbnQoJ29tbmlzaGFycC1mcmFtZXdvcmstc2VsZWN0b3InLCB7IHByb3RvdHlwZTogRnJhbWV3b3JrU2VsZWN0b3JDb21wb25lbnQucHJvdG90eXBlIH0pO1xyXG5cclxuZXhwb3J0IGNsYXNzIEZyYW1ld29ya1NlbGVjdG9yU2VsZWN0TGlzdFZpZXcgZXh0ZW5kcyBTcGFjZVBlbi5TZWxlY3RMaXN0VmlldyB7XHJcbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgZWRpdG9yOiBBdG9tLlRleHRFZGl0b3IsIHByaXZhdGUgb3B0aW9uczogeyBhbGlnbkxlZnQ6IGJvb2xlYW47IGF0dGFjaFRvOiBzdHJpbmc7IGl0ZW1zOiBNb2RlbHMuRG90TmV0RnJhbWV3b3JrW107IHNhdmUoaXRlbTogYW55KTogdm9pZCB9KSB7XHJcbiAgICAgICAgc3VwZXIoKTtcclxuICAgICAgICB0aGlzLiQuYWRkQ2xhc3MoJ2NvZGUtYWN0aW9ucy1vdmVybGF5Jyk7XHJcbiAgICAgICAgKDxhbnk+dGhpcykuZmlsdGVyRWRpdG9yVmlldy5tb2RlbC5wbGFjZWhvbGRlclRleHQgPSAnRmlsdGVyIGxpc3QnO1xyXG4gICAgfVxyXG5cclxuICAgIGdldCAkKCk6IEpRdWVyeSB7XHJcbiAgICAgICAgcmV0dXJuIDxhbnk+dGhpcztcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2V0SXRlbXMoKSB7XHJcbiAgICAgICAgU3BhY2VQZW4uU2VsZWN0TGlzdFZpZXcucHJvdG90eXBlLnNldEl0ZW1zLmNhbGwodGhpcywgdGhpcy5vcHRpb25zLml0ZW1zKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgY29uZmlybWVkKGl0ZW06IGFueSk6IGFueSB7XHJcbiAgICAgICAgdGhpcy5jYW5jZWwoKTsgLy93aWxsIGNsb3NlIHRoZSB2aWV3XHJcblxyXG4gICAgICAgIHRoaXMub3B0aW9ucy5zYXZlKGl0ZW0pO1xyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzaG93KCkge1xyXG4gICAgICAgIHRoaXMuc3RvcmVGb2N1c2VkRWxlbWVudCgpO1xyXG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4gdGhpcy5mb2N1c0ZpbHRlckVkaXRvcigpLCAxMDApO1xyXG4gICAgICAgIGNvbnN0IHdpZHRoID0gMTgwO1xyXG4gICAgICAgIGNvbnN0IG5vZGUgPSB0aGlzWzBdO1xyXG4gICAgICAgIGNvbnN0IGF0dGFjaFRvID0gJChkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHRoaXMub3B0aW9ucy5hdHRhY2hUbykpO1xyXG4gICAgICAgIGNvbnN0IG9mZnNldCA9IGF0dGFjaFRvLm9mZnNldCgpO1xyXG4gICAgICAgIGlmIChvZmZzZXQpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5hbGlnbkxlZnQpIHtcclxuICAgICAgICAgICAgICAgICQobm9kZSkuY3NzKHtcclxuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogJ2ZpeGVkJyxcclxuICAgICAgICAgICAgICAgICAgICB0b3A6IG9mZnNldC50b3AgLSBub2RlLmNsaWVudEhlaWdodCAtIDE4LFxyXG4gICAgICAgICAgICAgICAgICAgIGxlZnQ6IG9mZnNldC5sZWZ0LFxyXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiB3aWR0aFxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAkKG5vZGUpLmNzcyh7XHJcbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246ICdmaXhlZCcsXHJcbiAgICAgICAgICAgICAgICAgICAgdG9wOiBvZmZzZXQudG9wIC0gbm9kZS5jbGllbnRIZWlnaHQgLSAxOCxcclxuICAgICAgICAgICAgICAgICAgICBsZWZ0OiBvZmZzZXQubGVmdCAtIHdpZHRoICsgYXR0YWNoVG9bMF0uY2xpZW50V2lkdGgsXHJcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6IHdpZHRoXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgaGlkZSgpIHtcclxuICAgICAgICB0aGlzLnJlc3RvcmVGb2N1cygpO1xyXG4gICAgICAgIHRoaXMucmVtb3ZlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNhbmNlbGxlZCgpIHtcclxuICAgICAgICB0aGlzLmhpZGUoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0RmlsdGVyS2V5KCkgeyByZXR1cm4gJ05hbWUnOyB9XHJcblxyXG4gICAgcHVibGljIHZpZXdGb3JJdGVtKGl0ZW06IGFueSkge1xyXG4gICAgICAgIHJldHVybiBTcGFjZVBlbi4kJChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmxpKHtcclxuICAgICAgICAgICAgICAgICdjbGFzcyc6ICdldmVudCcsXHJcbiAgICAgICAgICAgICAgICAnZGF0YS1ldmVudC1uYW1lJzogaXRlbS5OYW1lXHJcbiAgICAgICAgICAgIH0sICgpID0+IHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnNwYW4oaXRlbS5GcmllbmRseU5hbWUsIHtcclxuICAgICAgICAgICAgICAgICAgICB0aXRsZTogaXRlbS5GcmllbmRseU5hbWVcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxufVxyXG4iXX0=
