"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.FrameworkSelectorSelectListView = exports.FrameworkSelectorComponent = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _atomSpacePenViews = require("atom-space-pen-views");

var SpacePen = _interopRequireWildcard(_atomSpacePenViews);

var _frameworkSelector = require("../atom/framework-selector");

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var $ = require("jquery");

var FrameworkSelectorComponent = exports.FrameworkSelectorComponent = function (_HTMLAnchorElement) {
    _inherits(FrameworkSelectorComponent, _HTMLAnchorElement);

    function FrameworkSelectorComponent() {
        _classCallCheck(this, FrameworkSelectorComponent);

        return _possibleConstructorReturn(this, (FrameworkSelectorComponent.__proto__ || Object.getPrototypeOf(FrameworkSelectorComponent)).apply(this, arguments));
    }

    _createClass(FrameworkSelectorComponent, [{
        key: "createdCallback",
        value: function createdCallback() {
            var _this2 = this;

            this.onclick = function (e) {
                var view = new FrameworkSelectorSelectListView(atom.workspace.getActiveTextEditor(), {
                    attachTo: ".framework-selector",
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
        key: "activeFramework",
        get: function get() {
            return this._activeFramework;
        },
        set: function set(value) {
            this._activeFramework = value;this.innerText = this.activeFramework.FriendlyName;
        }
    }]);

    return FrameworkSelectorComponent;
}(HTMLAnchorElement);

exports.FrameworkSelectorComponent = document.registerElement("omnisharp-framework-selector", { prototype: FrameworkSelectorComponent.prototype });

var FrameworkSelectorSelectListView = exports.FrameworkSelectorSelectListView = function (_SpacePen$SelectListV) {
    _inherits(FrameworkSelectorSelectListView, _SpacePen$SelectListV);

    function FrameworkSelectorSelectListView(editor, options) {
        _classCallCheck(this, FrameworkSelectorSelectListView);

        var _this3 = _possibleConstructorReturn(this, (FrameworkSelectorSelectListView.__proto__ || Object.getPrototypeOf(FrameworkSelectorSelectListView)).call(this));

        _this3.editor = editor;
        _this3.options = options;
        _this3.$.addClass("code-actions-overlay");
        _this3.filterEditorView.model.placeholderText = "Filter list";
        return _this3;
    }

    _createClass(FrameworkSelectorSelectListView, [{
        key: "setItems",
        value: function setItems() {
            SpacePen.SelectListView.prototype.setItems.call(this, this.options.items);
        }
    }, {
        key: "confirmed",
        value: function confirmed(item) {
            this.cancel();
            this.options.save(item);
            return null;
        }
    }, {
        key: "show",
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
                        position: "fixed",
                        top: offset.top - node.clientHeight - 18,
                        left: offset.left,
                        width: width
                    });
                } else {
                    $(node).css({
                        position: "fixed",
                        top: offset.top - node.clientHeight - 18,
                        left: offset.left - width + attachTo[0].clientWidth,
                        width: width
                    });
                }
            }
        }
    }, {
        key: "hide",
        value: function hide() {
            this.restoreFocus();
            this.remove();
        }
    }, {
        key: "cancelled",
        value: function cancelled() {
            this.hide();
        }
    }, {
        key: "getFilterKey",
        value: function getFilterKey() {
            return "Name";
        }
    }, {
        key: "viewForItem",
        value: function viewForItem(item) {
            return SpacePen.$$(function () {
                var _this5 = this;

                return this.li({
                    "class": "event",
                    "data-event-name": item.Name
                }, function () {
                    return _this5.span(item.FriendlyName, {
                        title: item.FriendlyName
                    });
                });
            });
        }
    }, {
        key: "$",
        get: function get() {
            return this;
        }
    }]);

    return FrameworkSelectorSelectListView;
}(SpacePen.SelectListView);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy9mcmFtZXdvcmstc2VsZWN0b3Itdmlldy5qcyIsImxpYi92aWV3cy9mcmFtZXdvcmstc2VsZWN0b3Itdmlldy50cyJdLCJuYW1lcyI6WyJTcGFjZVBlbiIsIiQiLCJyZXF1aXJlIiwiRnJhbWV3b3JrU2VsZWN0b3JDb21wb25lbnQiLCJvbmNsaWNrIiwiZSIsInZpZXciLCJGcmFtZXdvcmtTZWxlY3RvclNlbGVjdExpc3RWaWV3IiwiYXRvbSIsIndvcmtzcGFjZSIsImdldEFjdGl2ZVRleHRFZGl0b3IiLCJhdHRhY2hUbyIsImFsaWduTGVmdCIsIml0ZW1zIiwiZnJhbWV3b3JrcyIsInNhdmUiLCJmcmFtZXdvcmsiLCJzZXRBY3RpdmVGcmFtZXdvcmsiLCJoaWRlIiwiYXBwZW5kVG8iLCJ2aWV3cyIsImdldFZpZXciLCJzZXRJdGVtcyIsInNob3ciLCJfYWN0aXZlRnJhbWV3b3JrIiwidmFsdWUiLCJpbm5lclRleHQiLCJhY3RpdmVGcmFtZXdvcmsiLCJGcmllbmRseU5hbWUiLCJIVE1MQW5jaG9yRWxlbWVudCIsImV4cG9ydHMiLCJkb2N1bWVudCIsInJlZ2lzdGVyRWxlbWVudCIsInByb3RvdHlwZSIsImVkaXRvciIsIm9wdGlvbnMiLCJhZGRDbGFzcyIsImZpbHRlckVkaXRvclZpZXciLCJtb2RlbCIsInBsYWNlaG9sZGVyVGV4dCIsIlNlbGVjdExpc3RWaWV3IiwiY2FsbCIsIml0ZW0iLCJjYW5jZWwiLCJzdG9yZUZvY3VzZWRFbGVtZW50Iiwic2V0VGltZW91dCIsImZvY3VzRmlsdGVyRWRpdG9yIiwid2lkdGgiLCJub2RlIiwicXVlcnlTZWxlY3RvckFsbCIsIm9mZnNldCIsImNzcyIsInBvc2l0aW9uIiwidG9wIiwiY2xpZW50SGVpZ2h0IiwibGVmdCIsImNsaWVudFdpZHRoIiwicmVzdG9yZUZvY3VzIiwicmVtb3ZlIiwiJCQiLCJsaSIsIk5hbWUiLCJzcGFuIiwidGl0bGUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztJ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QUFLTSxZQUFsQixHQUFpQyxFQUY5QjtBQUdSQyw4QkFBTUwsT0FBT0ssSUFBUCxHQUFjUixLQUFkLEdBQXNCcEMsU0FBUyxDQUFULEVBQVk2QyxXQUhoQztBQUlSVCwrQkFBT0E7QUFKQyxxQkFBWjtBQU1IO0FBQ0o7QUFDSjs7OytCQUVVO0FBQ1AsaUJBQUtVLFlBQUw7QUFDQSxpQkFBS0MsTUFBTDtBQUNIOzs7b0NBRWU7QUFDWixpQkFBS3hDLElBQUw7QUFDSDs7O3VDQUVrQjtBQUFLLG1CQUFPLE1BQVA7QUFBZ0I7OztvQ0FFckJ3QixJLEVBQVM7QUFDeEIsbUJBQU8xQyxTQUFTMkQsRUFBVCxDQUFZLFlBQUE7QUFBQTs7QUFDZix1QkFBTyxLQUFLQyxFQUFMLENBQVE7QUFDWCw2QkFBUyxPQURFO0FBRVgsdUNBQW1CbEIsS0FBS21CO0FBRmIsaUJBQVIsRUFHSixZQUFBO0FBQ0MsMkJBQU8sT0FBS0MsSUFBTCxDQUFVcEIsS0FBS2QsWUFBZixFQUE2QjtBQUNoQ21DLCtCQUFPckIsS0FBS2Q7QUFEb0IscUJBQTdCLENBQVA7QUFHSCxpQkFQTSxDQUFQO0FBUUgsYUFUTSxDQUFQO0FBVUg7Ozs0QkEvREk7QUFDRCxtQkFBWSxJQUFaO0FBQ0g7Ozs7RUFUZ0Q1QixTQUFTd0MsYyIsImZpbGUiOiJsaWIvdmlld3MvZnJhbWV3b3JrLXNlbGVjdG9yLXZpZXcuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBTcGFjZVBlbiBmcm9tIFwiYXRvbS1zcGFjZS1wZW4tdmlld3NcIjtcbmltcG9ydCB7IGZyYW1ld29ya1NlbGVjdG9yIH0gZnJvbSBcIi4uL2F0b20vZnJhbWV3b3JrLXNlbGVjdG9yXCI7XG5jb25zdCAkID0gcmVxdWlyZShcImpxdWVyeVwiKTtcbmV4cG9ydCBjbGFzcyBGcmFtZXdvcmtTZWxlY3RvckNvbXBvbmVudCBleHRlbmRzIEhUTUxBbmNob3JFbGVtZW50IHtcbiAgICBnZXQgYWN0aXZlRnJhbWV3b3JrKCkgeyByZXR1cm4gdGhpcy5fYWN0aXZlRnJhbWV3b3JrOyB9XG4gICAgc2V0IGFjdGl2ZUZyYW1ld29yayh2YWx1ZSkgeyB0aGlzLl9hY3RpdmVGcmFtZXdvcmsgPSB2YWx1ZTsgdGhpcy5pbm5lclRleHQgPSB0aGlzLmFjdGl2ZUZyYW1ld29yay5GcmllbmRseU5hbWU7IH1cbiAgICBjcmVhdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMub25jbGljayA9IChlKSA9PiB7XG4gICAgICAgICAgICBjb25zdCB2aWV3ID0gbmV3IEZyYW1ld29ya1NlbGVjdG9yU2VsZWN0TGlzdFZpZXcoYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpLCB7XG4gICAgICAgICAgICAgICAgYXR0YWNoVG86IFwiLmZyYW1ld29yay1zZWxlY3RvclwiLFxuICAgICAgICAgICAgICAgIGFsaWduTGVmdDogdGhpcy5hbGlnbkxlZnQsXG4gICAgICAgICAgICAgICAgaXRlbXM6IHRoaXMuZnJhbWV3b3JrcyxcbiAgICAgICAgICAgICAgICBzYXZlOiAoZnJhbWV3b3JrKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGZyYW1ld29ya1NlbGVjdG9yLnNldEFjdGl2ZUZyYW1ld29yayhmcmFtZXdvcmspO1xuICAgICAgICAgICAgICAgICAgICB2aWV3LmhpZGUoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHZpZXcuYXBwZW5kVG8oYXRvbS52aWV3cy5nZXRWaWV3KGF0b20ud29ya3NwYWNlKSk7XG4gICAgICAgICAgICB2aWV3LnNldEl0ZW1zKCk7XG4gICAgICAgICAgICB2aWV3LnNob3coKTtcbiAgICAgICAgfTtcbiAgICB9XG59XG5leHBvcnRzLkZyYW1ld29ya1NlbGVjdG9yQ29tcG9uZW50ID0gZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50KFwib21uaXNoYXJwLWZyYW1ld29yay1zZWxlY3RvclwiLCB7IHByb3RvdHlwZTogRnJhbWV3b3JrU2VsZWN0b3JDb21wb25lbnQucHJvdG90eXBlIH0pO1xuZXhwb3J0IGNsYXNzIEZyYW1ld29ya1NlbGVjdG9yU2VsZWN0TGlzdFZpZXcgZXh0ZW5kcyBTcGFjZVBlbi5TZWxlY3RMaXN0VmlldyB7XG4gICAgY29uc3RydWN0b3IoZWRpdG9yLCBvcHRpb25zKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMuZWRpdG9yID0gZWRpdG9yO1xuICAgICAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuICAgICAgICB0aGlzLiQuYWRkQ2xhc3MoXCJjb2RlLWFjdGlvbnMtb3ZlcmxheVwiKTtcbiAgICAgICAgdGhpcy5maWx0ZXJFZGl0b3JWaWV3Lm1vZGVsLnBsYWNlaG9sZGVyVGV4dCA9IFwiRmlsdGVyIGxpc3RcIjtcbiAgICB9XG4gICAgZ2V0ICQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBzZXRJdGVtcygpIHtcbiAgICAgICAgU3BhY2VQZW4uU2VsZWN0TGlzdFZpZXcucHJvdG90eXBlLnNldEl0ZW1zLmNhbGwodGhpcywgdGhpcy5vcHRpb25zLml0ZW1zKTtcbiAgICB9XG4gICAgY29uZmlybWVkKGl0ZW0pIHtcbiAgICAgICAgdGhpcy5jYW5jZWwoKTtcbiAgICAgICAgdGhpcy5vcHRpb25zLnNhdmUoaXRlbSk7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBzaG93KCkge1xuICAgICAgICB0aGlzLnN0b3JlRm9jdXNlZEVsZW1lbnQoKTtcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLmZvY3VzRmlsdGVyRWRpdG9yKCksIDEwMCk7XG4gICAgICAgIGNvbnN0IHdpZHRoID0gMTgwO1xuICAgICAgICBjb25zdCBub2RlID0gdGhpc1swXTtcbiAgICAgICAgY29uc3QgYXR0YWNoVG8gPSAkKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwodGhpcy5vcHRpb25zLmF0dGFjaFRvKSk7XG4gICAgICAgIGNvbnN0IG9mZnNldCA9IGF0dGFjaFRvLm9mZnNldCgpO1xuICAgICAgICBpZiAob2Zmc2V0KSB7XG4gICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLmFsaWduTGVmdCkge1xuICAgICAgICAgICAgICAgICQobm9kZSkuY3NzKHtcbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IFwiZml4ZWRcIixcbiAgICAgICAgICAgICAgICAgICAgdG9wOiBvZmZzZXQudG9wIC0gbm9kZS5jbGllbnRIZWlnaHQgLSAxOCxcbiAgICAgICAgICAgICAgICAgICAgbGVmdDogb2Zmc2V0LmxlZnQsXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiB3aWR0aFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgJChub2RlKS5jc3Moe1xuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogXCJmaXhlZFwiLFxuICAgICAgICAgICAgICAgICAgICB0b3A6IG9mZnNldC50b3AgLSBub2RlLmNsaWVudEhlaWdodCAtIDE4LFxuICAgICAgICAgICAgICAgICAgICBsZWZ0OiBvZmZzZXQubGVmdCAtIHdpZHRoICsgYXR0YWNoVG9bMF0uY2xpZW50V2lkdGgsXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiB3aWR0aFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGhpZGUoKSB7XG4gICAgICAgIHRoaXMucmVzdG9yZUZvY3VzKCk7XG4gICAgICAgIHRoaXMucmVtb3ZlKCk7XG4gICAgfVxuICAgIGNhbmNlbGxlZCgpIHtcbiAgICAgICAgdGhpcy5oaWRlKCk7XG4gICAgfVxuICAgIGdldEZpbHRlcktleSgpIHsgcmV0dXJuIFwiTmFtZVwiOyB9XG4gICAgdmlld0Zvckl0ZW0oaXRlbSkge1xuICAgICAgICByZXR1cm4gU3BhY2VQZW4uJCQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMubGkoe1xuICAgICAgICAgICAgICAgIFwiY2xhc3NcIjogXCJldmVudFwiLFxuICAgICAgICAgICAgICAgIFwiZGF0YS1ldmVudC1uYW1lXCI6IGl0ZW0uTmFtZVxuICAgICAgICAgICAgfSwgKCkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnNwYW4oaXRlbS5GcmllbmRseU5hbWUsIHtcbiAgICAgICAgICAgICAgICAgICAgdGl0bGU6IGl0ZW0uRnJpZW5kbHlOYW1lXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxufVxuIiwiaW1wb3J0IHtNb2RlbHN9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XHJcbmltcG9ydCAqIGFzIFNwYWNlUGVuIGZyb20gXCJhdG9tLXNwYWNlLXBlbi12aWV3c1wiO1xyXG5pbXBvcnQge2ZyYW1ld29ya1NlbGVjdG9yfSBmcm9tIFwiLi4vYXRvbS9mcmFtZXdvcmstc2VsZWN0b3JcIjtcclxuY29uc3QgJDogSlF1ZXJ5U3RhdGljID0gcmVxdWlyZShcImpxdWVyeVwiKTtcclxuXHJcbmludGVyZmFjZSBGcmFtZXdvcmtTZWxlY3RvclN0YXRlIHtcclxuICAgIGZyYW1ld29ya3M/OiBNb2RlbHMuRG90TmV0RnJhbWV3b3JrW107XHJcbiAgICBhY3RpdmVGcmFtZXdvcms/OiBNb2RlbHMuRG90TmV0RnJhbWV3b3JrO1xyXG4gICAgYWxpZ25MZWZ0PzogYm9vbGVhbjtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIEZyYW1ld29ya1NlbGVjdG9yQ29tcG9uZW50IGV4dGVuZHMgSFRNTEFuY2hvckVsZW1lbnQgaW1wbGVtZW50cyBXZWJDb21wb25lbnQge1xyXG4gICAgcHVibGljIGZyYW1ld29ya3M6IE1vZGVscy5Eb3ROZXRGcmFtZXdvcmtbXTtcclxuICAgIHByaXZhdGUgX2FjdGl2ZUZyYW1ld29yazogTW9kZWxzLkRvdE5ldEZyYW1ld29yaztcclxuICAgIHB1YmxpYyBnZXQgYWN0aXZlRnJhbWV3b3JrKCkgeyByZXR1cm4gdGhpcy5fYWN0aXZlRnJhbWV3b3JrOyB9XHJcbiAgICBwdWJsaWMgc2V0IGFjdGl2ZUZyYW1ld29yayh2YWx1ZSkgeyB0aGlzLl9hY3RpdmVGcmFtZXdvcmsgPSB2YWx1ZTsgdGhpcy5pbm5lclRleHQgPSB0aGlzLmFjdGl2ZUZyYW1ld29yay5GcmllbmRseU5hbWU7IH1cclxuXHJcbiAgICBwdWJsaWMgYWxpZ25MZWZ0OiBib29sZWFuO1xyXG5cclxuICAgIHB1YmxpYyBjcmVhdGVkQ2FsbGJhY2soKSB7XHJcbiAgICAgICAgdGhpcy5vbmNsaWNrID0gKGUpID0+IHtcclxuICAgICAgICAgICAgY29uc3QgdmlldyA9IG5ldyBGcmFtZXdvcmtTZWxlY3RvclNlbGVjdExpc3RWaWV3KGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKSwge1xyXG4gICAgICAgICAgICAgICAgYXR0YWNoVG86IFwiLmZyYW1ld29yay1zZWxlY3RvclwiLFxyXG4gICAgICAgICAgICAgICAgYWxpZ25MZWZ0OiB0aGlzLmFsaWduTGVmdCxcclxuICAgICAgICAgICAgICAgIGl0ZW1zOiB0aGlzLmZyYW1ld29ya3MsXHJcbiAgICAgICAgICAgICAgICBzYXZlOiAoZnJhbWV3b3JrOiBNb2RlbHMuRG90TmV0RnJhbWV3b3JrKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgZnJhbWV3b3JrU2VsZWN0b3Iuc2V0QWN0aXZlRnJhbWV3b3JrKGZyYW1ld29yayk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmlldy5oaWRlKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB2aWV3LmFwcGVuZFRvKDxhbnk+YXRvbS52aWV3cy5nZXRWaWV3KGF0b20ud29ya3NwYWNlKSk7XHJcbiAgICAgICAgICAgIHZpZXcuc2V0SXRlbXMoKTtcclxuICAgICAgICAgICAgdmlldy5zaG93KCk7XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxufVxyXG5cclxuKDxhbnk+ZXhwb3J0cykuRnJhbWV3b3JrU2VsZWN0b3JDb21wb25lbnQgPSAoPGFueT5kb2N1bWVudCkucmVnaXN0ZXJFbGVtZW50KFwib21uaXNoYXJwLWZyYW1ld29yay1zZWxlY3RvclwiLCB7IHByb3RvdHlwZTogRnJhbWV3b3JrU2VsZWN0b3JDb21wb25lbnQucHJvdG90eXBlIH0pO1xyXG5cclxuZXhwb3J0IGNsYXNzIEZyYW1ld29ya1NlbGVjdG9yU2VsZWN0TGlzdFZpZXcgZXh0ZW5kcyBTcGFjZVBlbi5TZWxlY3RMaXN0VmlldyB7XHJcbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgZWRpdG9yOiBBdG9tLlRleHRFZGl0b3IsIHByaXZhdGUgb3B0aW9uczogeyBhbGlnbkxlZnQ6IGJvb2xlYW47IGF0dGFjaFRvOiBzdHJpbmc7IGl0ZW1zOiBNb2RlbHMuRG90TmV0RnJhbWV3b3JrW107IHNhdmUoaXRlbTogYW55KTogdm9pZCB9KSB7XHJcbiAgICAgICAgc3VwZXIoKTtcclxuICAgICAgICB0aGlzLiQuYWRkQ2xhc3MoXCJjb2RlLWFjdGlvbnMtb3ZlcmxheVwiKTtcclxuICAgICAgICAoPGFueT50aGlzKS5maWx0ZXJFZGl0b3JWaWV3Lm1vZGVsLnBsYWNlaG9sZGVyVGV4dCA9IFwiRmlsdGVyIGxpc3RcIjtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgJCgpOiBKUXVlcnkge1xyXG4gICAgICAgIHJldHVybiA8YW55PnRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHNldEl0ZW1zKCkge1xyXG4gICAgICAgIFNwYWNlUGVuLlNlbGVjdExpc3RWaWV3LnByb3RvdHlwZS5zZXRJdGVtcy5jYWxsKHRoaXMsIHRoaXMub3B0aW9ucy5pdGVtcyk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNvbmZpcm1lZChpdGVtOiBhbnkpOiBhbnkge1xyXG4gICAgICAgIHRoaXMuY2FuY2VsKCk7IC8vd2lsbCBjbG9zZSB0aGUgdmlld1xyXG5cclxuICAgICAgICB0aGlzLm9wdGlvbnMuc2F2ZShpdGVtKTtcclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2hvdygpIHtcclxuICAgICAgICB0aGlzLnN0b3JlRm9jdXNlZEVsZW1lbnQoKTtcclxuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHRoaXMuZm9jdXNGaWx0ZXJFZGl0b3IoKSwgMTAwKTtcclxuICAgICAgICBjb25zdCB3aWR0aCA9IDE4MDtcclxuICAgICAgICBjb25zdCBub2RlID0gdGhpc1swXTtcclxuICAgICAgICBjb25zdCBhdHRhY2hUbyA9ICQoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCh0aGlzLm9wdGlvbnMuYXR0YWNoVG8pKTtcclxuICAgICAgICBjb25zdCBvZmZzZXQgPSBhdHRhY2hUby5vZmZzZXQoKTtcclxuICAgICAgICBpZiAob2Zmc2V0KSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuYWxpZ25MZWZ0KSB7XHJcbiAgICAgICAgICAgICAgICAkKG5vZGUpLmNzcyh7XHJcbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IFwiZml4ZWRcIixcclxuICAgICAgICAgICAgICAgICAgICB0b3A6IG9mZnNldC50b3AgLSBub2RlLmNsaWVudEhlaWdodCAtIDE4LFxyXG4gICAgICAgICAgICAgICAgICAgIGxlZnQ6IG9mZnNldC5sZWZ0LFxyXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiB3aWR0aFxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAkKG5vZGUpLmNzcyh7XHJcbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IFwiZml4ZWRcIixcclxuICAgICAgICAgICAgICAgICAgICB0b3A6IG9mZnNldC50b3AgLSBub2RlLmNsaWVudEhlaWdodCAtIDE4LFxyXG4gICAgICAgICAgICAgICAgICAgIGxlZnQ6IG9mZnNldC5sZWZ0IC0gd2lkdGggKyBhdHRhY2hUb1swXS5jbGllbnRXaWR0aCxcclxuICAgICAgICAgICAgICAgICAgICB3aWR0aDogd2lkdGhcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBoaWRlKCkge1xyXG4gICAgICAgIHRoaXMucmVzdG9yZUZvY3VzKCk7XHJcbiAgICAgICAgdGhpcy5yZW1vdmUoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgY2FuY2VsbGVkKCkge1xyXG4gICAgICAgIHRoaXMuaGlkZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXRGaWx0ZXJLZXkoKSB7IHJldHVybiBcIk5hbWVcIjsgfVxyXG5cclxuICAgIHB1YmxpYyB2aWV3Rm9ySXRlbShpdGVtOiBhbnkpIHtcclxuICAgICAgICByZXR1cm4gU3BhY2VQZW4uJCQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmxpKHtcclxuICAgICAgICAgICAgICAgIFwiY2xhc3NcIjogXCJldmVudFwiLFxyXG4gICAgICAgICAgICAgICAgXCJkYXRhLWV2ZW50LW5hbWVcIjogaXRlbS5OYW1lXHJcbiAgICAgICAgICAgIH0sICgpID0+IHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnNwYW4oaXRlbS5GcmllbmRseU5hbWUsIHtcclxuICAgICAgICAgICAgICAgICAgICB0aXRsZTogaXRlbS5GcmllbmRseU5hbWVcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxufVxyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
