'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.OutputElement = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var $ = require('jquery');

var OutputElement = exports.OutputElement = function (_HTMLOListElement) {
    _inherits(OutputElement, _HTMLOListElement);

    function OutputElement() {
        _classCallCheck(this, OutputElement);

        return _possibleConstructorReturn(this, (OutputElement.__proto__ || Object.getPrototypeOf(OutputElement)).apply(this, arguments));
    }

    _createClass(OutputElement, [{
        key: 'createdCallback',
        value: function createdCallback() {
            var _this2 = this;

            this.output = [];
            this.classList.add('messages-container', 'ol');
            var parent = this;
            var onclickHandler = function onclickHandler(e) {
                parent.selected = this.key;
                parent.handleClick(this.item);
            };
            this._update = (0, _lodash.throttle)(function () {
                for (var i = 0, len = _this2.children.length > _this2.output.length ? _this2.children.length : _this2.output.length; i < len; i++) {
                    var item = _this2.output[i];
                    var child = _this2.children[i];
                    if (!item && child) {
                        _this2.removeChild(child);
                        continue;
                    }
                    if (item && !child) {
                        child = _this2.elementFactory();
                        child.onclick = onclickHandler;
                        _this2.appendChild(child);
                    }
                    if (item && child) {
                        var key = _this2.getKey(item);
                        if (child.key !== key) {
                            child.setMessage(key, item);
                            child.item = item;
                        }
                    }
                    if (child) {
                        if (child.key === _this2._selectedKey && !child.selected) {
                            child.selected = true;
                        } else if (child.selected) {
                            child.selected = false;
                        }
                    }
                }
                _this2.scrollToItemView();
                _this2._calculateInview();
            }, 100, { leading: true, trailing: true });
            this.onkeydown = function (e) {
                return _this2.keydownPane(e);
            };
            this._scroll = (0, _lodash.throttle)(function (e) {
                return _this2._calculateInview();
            }, 100, { leading: true, trailing: true });
        }
    }, {
        key: 'attachedCallback',
        value: function attachedCallback() {
            this.parentElement.addEventListener('scroll', this._scroll);
            this._calculateInview();
        }
    }, {
        key: 'attached',
        value: function attached() {
            this._update();
            (0, _lodash.each)(this.children, function (x) {
                return x.attached();
            });
            this._calculateInview();
        }
    }, {
        key: 'detached',
        value: function detached() {
            (0, _lodash.each)(this.children, function (x) {
                return x.detached();
            });
        }
    }, {
        key: '_calculateInview',
        value: function _calculateInview() {
            var self = $(this);
            var top = self.scrollTop();
            var bottom = top + this.parentElement.clientHeight * 2;
            for (var i = 0, len = this.children.length; i < len; i++) {
                var child = this.children[i];
                var $child = $(child);
                var position = $child.position();
                var height = child.clientHeight;
                var inview = position.top + height > top && position.top < bottom;
                if (child.inview !== inview) {
                    child.inview = inview;
                }
            }
        }
    }, {
        key: 'next',
        value: function next() {
            this.selectedIndex = this._selectedIndex + 1;
        }
    }, {
        key: 'prev',
        value: function prev() {
            this.selectedIndex = this._selectedIndex - 1;
        }
    }, {
        key: 'updateOutput',
        value: function updateOutput(output) {
            this.output = (0, _lodash.toArray)(output);
            this._update();
        }
    }, {
        key: 'keydownPane',
        value: function keydownPane(e) {
            if (e.keyIdentifier === 'Down') {
                atom.commands.dispatch(atom.views.getView(atom.workspace), 'omnisharp-atom:next-' + this.eventName);
            } else if (e.keyIdentifier === 'Up') {
                atom.commands.dispatch(atom.views.getView(atom.workspace), 'omnisharp-atom:previous-' + this.eventName);
            } else if (e.keyIdentifier === 'Enter') {
                atom.commands.dispatch(atom.views.getView(atom.workspace), 'omnisharp-atom:go-to-' + this.eventName);
            }
        }
    }, {
        key: 'scrollToItemView',
        value: function scrollToItemView() {
            var self = $(this);
            var item = self.find('.selected');
            if (!item || !item.position()) return;
            var pane = self;
            var scrollTop = pane.scrollTop();
            var desiredTop = item.position().top + scrollTop;
            var desiredBottom = desiredTop + item.outerHeight();
            if (desiredTop < scrollTop) {
                pane.scrollTop(desiredTop);
            } else if (desiredBottom > pane.scrollTop() + item.outerHeight()) {
                pane.scrollTop(desiredBottom + item.outerHeight());
            }
        }
    }, {
        key: 'selected',
        get: function get() {
            return this._selectedKey;
        },
        set: function set(value) {
            var index = (0, _lodash.findIndex)(this.children, function (e) {
                return e.key === value;
            });
            if (index) {
                var e = this.children[index];
                this._selectedKey = value;
                this._selectedIndex = index;
                if (this._selectedElement) {
                    this._selectedElement.selected = false;
                }
                this._selectedElement = e;
                e.selected = true;
            }
        }
    }, {
        key: 'selectedIndex',
        get: function get() {
            return this._selectedIndex;
        },
        set: function set(index) {
            var e = this.children[index];
            if (e) {
                this.selected = e.key;
            }
        }
    }, {
        key: 'current',
        get: function get() {
            return this.output[this._selectedIndex];
        }
    }]);

    return OutputElement;
}(HTMLOListElement);

exports.OutputElement = document.registerElement('omnisharp-output-list', { prototype: OutputElement.prototype });
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy9vdXRwdXQtY29tcG9uZW50LnRzIl0sIm5hbWVzIjpbIiQiLCJyZXF1aXJlIiwiT3V0cHV0RWxlbWVudCIsIm91dHB1dCIsImNsYXNzTGlzdCIsImFkZCIsInBhcmVudCIsIm9uY2xpY2tIYW5kbGVyIiwiZSIsInNlbGVjdGVkIiwia2V5IiwiaGFuZGxlQ2xpY2siLCJpdGVtIiwiX3VwZGF0ZSIsImkiLCJsZW4iLCJjaGlsZHJlbiIsImxlbmd0aCIsImNoaWxkIiwicmVtb3ZlQ2hpbGQiLCJlbGVtZW50RmFjdG9yeSIsIm9uY2xpY2siLCJhcHBlbmRDaGlsZCIsImdldEtleSIsInNldE1lc3NhZ2UiLCJfc2VsZWN0ZWRLZXkiLCJzY3JvbGxUb0l0ZW1WaWV3IiwiX2NhbGN1bGF0ZUludmlldyIsImxlYWRpbmciLCJ0cmFpbGluZyIsIm9ua2V5ZG93biIsImtleWRvd25QYW5lIiwiX3Njcm9sbCIsInBhcmVudEVsZW1lbnQiLCJhZGRFdmVudExpc3RlbmVyIiwieCIsImF0dGFjaGVkIiwiZGV0YWNoZWQiLCJzZWxmIiwidG9wIiwic2Nyb2xsVG9wIiwiYm90dG9tIiwiY2xpZW50SGVpZ2h0IiwiJGNoaWxkIiwicG9zaXRpb24iLCJoZWlnaHQiLCJpbnZpZXciLCJzZWxlY3RlZEluZGV4IiwiX3NlbGVjdGVkSW5kZXgiLCJrZXlJZGVudGlmaWVyIiwiYXRvbSIsImNvbW1hbmRzIiwiZGlzcGF0Y2giLCJ2aWV3cyIsImdldFZpZXciLCJ3b3Jrc3BhY2UiLCJldmVudE5hbWUiLCJmaW5kIiwicGFuZSIsImRlc2lyZWRUb3AiLCJkZXNpcmVkQm90dG9tIiwib3V0ZXJIZWlnaHQiLCJ2YWx1ZSIsImluZGV4IiwiX3NlbGVjdGVkRWxlbWVudCIsIkhUTUxPTGlzdEVsZW1lbnQiLCJleHBvcnRzIiwiZG9jdW1lbnQiLCJyZWdpc3RlckVsZW1lbnQiLCJwcm90b3R5cGUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOzs7Ozs7OztBQUNBLElBQU1B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dGhyb3R0bGUsIGVhY2gsIGZpbmRJbmRleCwgdG9BcnJheSB9IGZyb20gJ2xvZGFzaCc7XHJcbmNvbnN0ICQ6IEpRdWVyeVN0YXRpYyA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBNZXNzYWdlRWxlbWVudDxUSXRlbT4gZXh0ZW5kcyBIVE1MTElFbGVtZW50IHtcclxuICAgIGtleTogc3RyaW5nO1xyXG4gICAgc2VsZWN0ZWQ6IGJvb2xlYW47XHJcbiAgICBpbnZpZXc6IGJvb2xlYW47XHJcbiAgICBzZXRNZXNzYWdlKGtleTogc3RyaW5nLCBpdGVtOiBUSXRlbSk6IHZvaWQ7XHJcbiAgICBpdGVtOiBUSXRlbTtcclxuICAgIGF0dGFjaGVkKCk6IHZvaWQ7XHJcbiAgICBkZXRhY2hlZCgpOiB2b2lkO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgT3V0cHV0RWxlbWVudDxUSXRlbSwgVEVsZW1lbnQgZXh0ZW5kcyBNZXNzYWdlRWxlbWVudDxUSXRlbT4+IGV4dGVuZHMgSFRNTE9MaXN0RWxlbWVudCBpbXBsZW1lbnRzIFdlYkNvbXBvbmVudCB7XHJcbiAgICBwcml2YXRlIG91dHB1dDogVEl0ZW1bXTtcclxuICAgIHByaXZhdGUgX3NlbGVjdGVkS2V5OiBzdHJpbmc7XHJcbiAgICBwcml2YXRlIF9zZWxlY3RlZEluZGV4OiBudW1iZXI7XHJcbiAgICBwcml2YXRlIF9zZWxlY3RlZEVsZW1lbnQ6IFRFbGVtZW50O1xyXG4gICAgcHJpdmF0ZSBfdXBkYXRlOiAoKSA9PiB2b2lkO1xyXG4gICAgcHJpdmF0ZSBfc2Nyb2xsOiBhbnk7XHJcblxyXG4gICAgcHVibGljIGNyZWF0ZWRDYWxsYmFjaygpIHtcclxuICAgICAgICB0aGlzLm91dHB1dCA9IFtdO1xyXG4gICAgICAgIHRoaXMuY2xhc3NMaXN0LmFkZCgnbWVzc2FnZXMtY29udGFpbmVyJywgJ29sJyk7XHJcbiAgICAgICAgY29uc3QgcGFyZW50ID0gdGhpcztcclxuICAgICAgICBjb25zdCBvbmNsaWNrSGFuZGxlciA9IGZ1bmN0aW9uIChlOiBVSUV2ZW50KSB7XHJcbiAgICAgICAgICAgIHBhcmVudC5zZWxlY3RlZCA9IHRoaXMua2V5O1xyXG4gICAgICAgICAgICBwYXJlbnQuaGFuZGxlQ2xpY2sodGhpcy5pdGVtKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLl91cGRhdGUgPSB0aHJvdHRsZSgoKSA9PiB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwLCBsZW4gPSB0aGlzLmNoaWxkcmVuLmxlbmd0aCA+IHRoaXMub3V0cHV0Lmxlbmd0aCA/IHRoaXMuY2hpbGRyZW4ubGVuZ3RoIDogdGhpcy5vdXRwdXQubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW0gPSB0aGlzLm91dHB1dFtpXTtcclxuICAgICAgICAgICAgICAgIGxldCBjaGlsZDogVEVsZW1lbnQgPSA8YW55PnRoaXMuY2hpbGRyZW5baV07XHJcbiAgICAgICAgICAgICAgICBpZiAoIWl0ZW0gJiYgY2hpbGQpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZUNoaWxkKGNoaWxkKTtcclxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChpdGVtICYmICFjaGlsZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNoaWxkID0gdGhpcy5lbGVtZW50RmFjdG9yeSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNoaWxkLm9uY2xpY2sgPSBvbmNsaWNrSGFuZGxlcjtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmFwcGVuZENoaWxkKGNoaWxkKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoaXRlbSAmJiBjaGlsZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGtleSA9IHRoaXMuZ2V0S2V5KGl0ZW0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChjaGlsZC5rZXkgIT09IGtleSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGlsZC5zZXRNZXNzYWdlKGtleSwgaXRlbSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkLml0ZW0gPSBpdGVtO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoY2hpbGQpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoY2hpbGQua2V5ID09PSB0aGlzLl9zZWxlY3RlZEtleSAmJiAhY2hpbGQuc2VsZWN0ZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGQuc2VsZWN0ZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY2hpbGQuc2VsZWN0ZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGQuc2VsZWN0ZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoaXMuc2Nyb2xsVG9JdGVtVmlldygpO1xyXG4gICAgICAgICAgICB0aGlzLl9jYWxjdWxhdGVJbnZpZXcoKTtcclxuICAgICAgICB9LCAxMDAsIHsgbGVhZGluZzogdHJ1ZSwgdHJhaWxpbmc6IHRydWUgfSk7XHJcblxyXG4gICAgICAgIHRoaXMub25rZXlkb3duID0gKGU6IGFueSkgPT4gdGhpcy5rZXlkb3duUGFuZShlKTtcclxuICAgICAgICB0aGlzLl9zY3JvbGwgPSB0aHJvdHRsZSgoZTogVUlFdmVudCkgPT4gdGhpcy5fY2FsY3VsYXRlSW52aWV3KCksIDEwMCwgeyBsZWFkaW5nOiB0cnVlLCB0cmFpbGluZzogdHJ1ZSB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgYXR0YWNoZWRDYWxsYmFjaygpIHtcclxuICAgICAgICB0aGlzLnBhcmVudEVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignc2Nyb2xsJywgdGhpcy5fc2Nyb2xsKTtcclxuICAgICAgICB0aGlzLl9jYWxjdWxhdGVJbnZpZXcoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgYXR0YWNoZWQoKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3VwZGF0ZSgpO1xyXG4gICAgICAgICAgICBlYWNoKHRoaXMuY2hpbGRyZW4sICh4OiBURWxlbWVudCkgPT4geC5hdHRhY2hlZCgpKTtcclxuICAgICAgICAgICAgdGhpcy5fY2FsY3VsYXRlSW52aWV3KCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRldGFjaGVkKCkge1xyXG4gICAgICAgICAgICBlYWNoKHRoaXMuY2hpbGRyZW4sICh4OiBURWxlbWVudCkgPT4geC5kZXRhY2hlZCgpKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9jYWxjdWxhdGVJbnZpZXcoKSB7XHJcbiAgICAgICAgY29uc3Qgc2VsZiA9ICQodGhpcyk7XHJcbiAgICAgICAgICAgIGNvbnN0IHRvcCA9IHNlbGYuc2Nyb2xsVG9wKCk7XHJcbiAgICAgICAgICAgIGNvbnN0IGJvdHRvbSA9IHRvcCArIHRoaXMucGFyZW50RWxlbWVudC5jbGllbnRIZWlnaHQgKiAyO1xyXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMCwgbGVuID0gdGhpcy5jaGlsZHJlbi5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgY2hpbGQ6IFRFbGVtZW50ID0gPGFueT50aGlzLmNoaWxkcmVuW2ldO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgJGNoaWxkID0gJChjaGlsZCk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBwb3NpdGlvbiA9ICRjaGlsZC5wb3NpdGlvbigpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgaGVpZ2h0ID0gY2hpbGQuY2xpZW50SGVpZ2h0O1xyXG5cclxuICAgICAgICAgICAgICAgIGNvbnN0IGludmlldyA9IHBvc2l0aW9uLnRvcCArIGhlaWdodCA+IHRvcCAmJiBwb3NpdGlvbi50b3AgPCBib3R0b207XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGNoaWxkLmludmlldyAhPT0gaW52aWV3KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkLmludmlldyA9IGludmlldztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXRLZXk6IChtZXNzYWdlOiBUSXRlbSkgPT4gc3RyaW5nO1xyXG4gICAgcHVibGljIGV2ZW50TmFtZTogc3RyaW5nO1xyXG4gICAgcHVibGljIGhhbmRsZUNsaWNrOiAoaXRlbTogVEl0ZW0pID0+IHZvaWQ7XHJcbiAgICBwdWJsaWMgZWxlbWVudEZhY3Rvcnk6ICgpID0+IFRFbGVtZW50O1xyXG5cclxuICAgIHB1YmxpYyBnZXQgc2VsZWN0ZWQoKSB7IHJldHVybiB0aGlzLl9zZWxlY3RlZEtleTsgfVxyXG4gICAgcHVibGljIHNldCBzZWxlY3RlZCh2YWx1ZTogc3RyaW5nKSB7XHJcbiAgICAgICAgY29uc3QgaW5kZXggPSBmaW5kSW5kZXgodGhpcy5jaGlsZHJlbiwgKGU6IFRFbGVtZW50KSA9PiBlLmtleSA9PT0gdmFsdWUpO1xyXG4gICAgICAgIGlmIChpbmRleCkge1xyXG4gICAgICAgICAgICBjb25zdCBlOiBURWxlbWVudCA9IDxhbnk+dGhpcy5jaGlsZHJlbltpbmRleF07XHJcbiAgICAgICAgICAgIHRoaXMuX3NlbGVjdGVkS2V5ID0gdmFsdWU7XHJcbiAgICAgICAgICAgIHRoaXMuX3NlbGVjdGVkSW5kZXggPSBpbmRleDtcclxuICAgICAgICAgICAgaWYgKHRoaXMuX3NlbGVjdGVkRWxlbWVudCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fc2VsZWN0ZWRFbGVtZW50LnNlbGVjdGVkID0gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5fc2VsZWN0ZWRFbGVtZW50ID0gZTtcclxuICAgICAgICAgICAgZS5zZWxlY3RlZCA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgc2VsZWN0ZWRJbmRleCgpIHsgcmV0dXJuIHRoaXMuX3NlbGVjdGVkSW5kZXg7IH1cclxuICAgIHB1YmxpYyBzZXQgc2VsZWN0ZWRJbmRleChpbmRleCkge1xyXG4gICAgICAgIGNvbnN0IGU6IFRFbGVtZW50ID0gPGFueT50aGlzLmNoaWxkcmVuW2luZGV4XTtcclxuICAgICAgICBpZiAoZSkge1xyXG4gICAgICAgICAgICB0aGlzLnNlbGVjdGVkID0gZS5rZXk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgY3VycmVudCgpIHsgcmV0dXJuIHRoaXMub3V0cHV0W3RoaXMuX3NlbGVjdGVkSW5kZXhdOyB9XHJcblxyXG4gICAgcHVibGljIG5leHQoKSB7XHJcbiAgICAgICAgdGhpcy5zZWxlY3RlZEluZGV4ID0gdGhpcy5fc2VsZWN0ZWRJbmRleCArIDE7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHByZXYoKSB7XHJcbiAgICAgICAgdGhpcy5zZWxlY3RlZEluZGV4ID0gdGhpcy5fc2VsZWN0ZWRJbmRleCAtIDE7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHVwZGF0ZU91dHB1dChvdXRwdXQ6IFRJdGVtW10gfCBJdGVyYWJsZUl0ZXJhdG9yPFRJdGVtPikge1xyXG4gICAgICAgIHRoaXMub3V0cHV0ID0gdG9BcnJheShvdXRwdXQpO1xyXG4gICAgICAgIHRoaXMuX3VwZGF0ZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUga2V5ZG93blBhbmUoZTogYW55KSB7XHJcbiAgICAgICAgaWYgKGUua2V5SWRlbnRpZmllciA9PT0gJ0Rvd24nKSB7XHJcbiAgICAgICAgICAgIGF0b20uY29tbWFuZHMuZGlzcGF0Y2goYXRvbS52aWV3cy5nZXRWaWV3KGF0b20ud29ya3NwYWNlKSwgYG9tbmlzaGFycC1hdG9tOm5leHQtJHt0aGlzLmV2ZW50TmFtZX1gKTtcclxuICAgICAgICB9IGVsc2UgaWYgKGUua2V5SWRlbnRpZmllciA9PT0gJ1VwJykge1xyXG4gICAgICAgICAgICBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSksIGBvbW5pc2hhcnAtYXRvbTpwcmV2aW91cy0ke3RoaXMuZXZlbnROYW1lfWApO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoZS5rZXlJZGVudGlmaWVyID09PSAnRW50ZXInKSB7XHJcbiAgICAgICAgICAgIGF0b20uY29tbWFuZHMuZGlzcGF0Y2goYXRvbS52aWV3cy5nZXRWaWV3KGF0b20ud29ya3NwYWNlKSwgYG9tbmlzaGFycC1hdG9tOmdvLXRvLSR7dGhpcy5ldmVudE5hbWV9YCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgc2Nyb2xsVG9JdGVtVmlldygpIHtcclxuICAgICAgICBjb25zdCBzZWxmID0gJCh0aGlzKTtcclxuICAgICAgICBjb25zdCBpdGVtID0gc2VsZi5maW5kKGAuc2VsZWN0ZWRgKTtcclxuICAgICAgICBpZiAoIWl0ZW0gfHwgIWl0ZW0ucG9zaXRpb24oKSkgcmV0dXJuO1xyXG5cclxuICAgICAgICBjb25zdCBwYW5lID0gc2VsZjtcclxuICAgICAgICBjb25zdCBzY3JvbGxUb3AgPSBwYW5lLnNjcm9sbFRvcCgpO1xyXG4gICAgICAgIGNvbnN0IGRlc2lyZWRUb3AgPSBpdGVtLnBvc2l0aW9uKCkudG9wICsgc2Nyb2xsVG9wO1xyXG4gICAgICAgIGNvbnN0IGRlc2lyZWRCb3R0b20gPSBkZXNpcmVkVG9wICsgaXRlbS5vdXRlckhlaWdodCgpO1xyXG5cclxuICAgICAgICBpZiAoZGVzaXJlZFRvcCA8IHNjcm9sbFRvcCkge1xyXG4gICAgICAgICAgICBwYW5lLnNjcm9sbFRvcChkZXNpcmVkVG9wKTtcclxuICAgICAgICB9IGVsc2UgaWYgKGRlc2lyZWRCb3R0b20gPiBwYW5lLnNjcm9sbFRvcCgpICsgaXRlbS5vdXRlckhlaWdodCgpKSB7XHJcbiAgICAgICAgICAgIHBhbmUuc2Nyb2xsVG9wKGRlc2lyZWRCb3R0b20gKyBpdGVtLm91dGVySGVpZ2h0KCkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuKDxhbnk+ZXhwb3J0cykuT3V0cHV0RWxlbWVudCA9ICg8YW55PmRvY3VtZW50KS5yZWdpc3RlckVsZW1lbnQoJ29tbmlzaGFycC1vdXRwdXQtbGlzdCcsIHsgcHJvdG90eXBlOiBPdXRwdXRFbGVtZW50LnByb3RvdHlwZSB9KTtcclxuIl19
