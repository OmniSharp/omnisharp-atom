"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.OutputElement = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var fastdom = require("fastdom");

var $ = require("jquery");

var OutputElement = exports.OutputElement = function (_HTMLOListElement) {
    _inherits(OutputElement, _HTMLOListElement);

    function OutputElement() {
        _classCallCheck(this, OutputElement);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(OutputElement).apply(this, arguments));
    }

    _createClass(OutputElement, [{
        key: "createdCallback",
        value: function createdCallback() {
            var _this2 = this;

            this.output = [];
            this.classList.add("messages-container", "ol");
            var parent = this;
            var onclickHandler = function onclickHandler(e) {
                parent.selected = this.key;
                parent.handleClick(this.item);
            };
            this._update = _lodash2.default.throttle(function () {
                fastdom.measure(function () {
                    var _loop = function _loop(i, len) {
                        var item = _this2.output[i];
                        var child = _this2.children[i];
                        if (!item && child) {
                            _this2.removeChild(child);
                            return "continue";
                        }
                        fastdom.mutate(function () {
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
                        });
                    };

                    for (var i = 0, len = _this2.children.length > _this2.output.length ? _this2.children.length : _this2.output.length; i < len; i++) {
                        var _ret = _loop(i, len);

                        if (_ret === "continue") continue;
                    }
                    fastdom.mutate(function () {
                        _this2.scrollToItemView();
                        _this2._calculateInview();
                    });
                });
            }, 100, { leading: true, trailing: true });
            this.onkeydown = function (e) {
                return _this2.keydownPane(e);
            };
            this._scroll = _lodash2.default.throttle(function (e) {
                return _this2._calculateInview();
            }, 100, { leading: true, trailing: true });
        }
    }, {
        key: "attachedCallback",
        value: function attachedCallback() {
            this.parentElement.addEventListener("scroll", this._scroll);
            this._calculateInview();
        }
    }, {
        key: "attached",
        value: function attached() {
            var _this3 = this;

            fastdom.mutate(function () {
                _this3._update();
                _lodash2.default.each(_this3.children, function (x) {
                    return x.attached();
                });
                _this3._calculateInview();
            });
        }
    }, {
        key: "detached",
        value: function detached() {
            var _this4 = this;

            fastdom.mutate(function () {
                _lodash2.default.each(_this4.children, function (x) {
                    return x.detached();
                });
            });
        }
    }, {
        key: "_calculateInview",
        value: function _calculateInview() {
            var _this5 = this;

            var self = $(this);
            fastdom.measure(function () {
                var top = self.scrollTop();
                var bottom = top + _this5.parentElement.clientHeight * 2;

                var _loop2 = function _loop2(i, len) {
                    var child = _this5.children[i];
                    var $child = $(child);
                    var position = $child.position();
                    var height = child.clientHeight;
                    var inview = position.top + height > top && position.top < bottom;
                    if (child.inview !== inview) {
                        fastdom.mutate(function () {
                            child.inview = inview;
                        });
                    }
                };

                for (var i = 0, len = _this5.children.length; i < len; i++) {
                    _loop2(i, len);
                }
            });
        }
    }, {
        key: "next",
        value: function next() {
            this.selectedIndex = this._selectedIndex + 1;
        }
    }, {
        key: "prev",
        value: function prev() {
            this.selectedIndex = this._selectedIndex - 1;
        }
    }, {
        key: "updateOutput",
        value: function updateOutput(output) {
            this.output = _lodash2.default.toArray(output);
            this._update();
        }
    }, {
        key: "keydownPane",
        value: function keydownPane(e) {
            if (e.keyIdentifier === "Down") {
                atom.commands.dispatch(atom.views.getView(atom.workspace), "omnisharp-atom:next-" + this.eventName);
            } else if (e.keyIdentifier === "Up") {
                atom.commands.dispatch(atom.views.getView(atom.workspace), "omnisharp-atom:previous-" + this.eventName);
            } else if (e.keyIdentifier === "Enter") {
                atom.commands.dispatch(atom.views.getView(atom.workspace), "omnisharp-atom:go-to-" + this.eventName);
            }
        }
    }, {
        key: "scrollToItemView",
        value: function scrollToItemView() {
            var self = $(this);
            var item = self.find(".selected");
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
        key: "selected",
        get: function get() {
            return this._selectedKey;
        },
        set: function set(value) {
            var index = _lodash2.default.findIndex(this.children, function (e) {
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
        key: "selectedIndex",
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
        key: "current",
        get: function get() {
            return this.output[this._selectedIndex];
        }
    }]);

    return OutputElement;
}(HTMLOListElement);

exports.OutputElement = document.registerElement("omnisharp-output-list", { prototype: OutputElement.prototype });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy9vdXRwdXQtY29tcG9uZW50LmpzIiwibGliL3ZpZXdzL291dHB1dC1jb21wb25lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQ0E7Ozs7Ozs7Ozs7OztBQ0RBLElBQUksVUFBMEIsUUFBUSxTQUFSLENBQTlCOztBQUVBLElBQU0sSUFBa0IsUUFBUSxRQUFSLENBQXhCOztJQVlBLGEsV0FBQSxhOzs7Ozs7Ozs7OzswQ0FRMEI7QUFBQTs7QUFDbEIsaUJBQUssTUFBTCxHQUFjLEVBQWQ7QUFDQSxpQkFBSyxTQUFMLENBQWUsR0FBZixDQUFtQixvQkFBbkIsRUFBeUMsSUFBekM7QUFDQSxnQkFBTSxTQUFTLElBQWY7QUFDQSxnQkFBTSxpQkFBaUIsU0FBakIsY0FBaUIsQ0FBUyxDQUFULEVBQW1CO0FBQ3RDLHVCQUFPLFFBQVAsR0FBa0IsS0FBSyxHQUF2QjtBQUNBLHVCQUFPLFdBQVAsQ0FBbUIsS0FBSyxJQUF4QjtBQUNILGFBSEQ7QUFLQSxpQkFBSyxPQUFMLEdBQWUsaUJBQUUsUUFBRixDQUFXLFlBQUE7QUFDdEIsd0JBQVEsT0FBUixDQUFnQixZQUFBO0FBQUEsK0NBQ0gsQ0FERyxFQUNJLEdBREo7QUFFUiw0QkFBTSxPQUFPLE9BQUssTUFBTCxDQUFZLENBQVosQ0FBYjtBQUNBLDRCQUFJLFFBQXVCLE9BQUssUUFBTCxDQUFjLENBQWQsQ0FBM0I7QUFDQSw0QkFBSSxDQUFDLElBQUQsSUFBUyxLQUFiLEVBQW9CO0FBQ2hCLG1DQUFLLFdBQUwsQ0FBaUIsS0FBakI7QUFDQTtBQUNIO0FBQ0QsZ0NBQVEsTUFBUixDQUFlLFlBQUE7QUFDWCxnQ0FBSSxRQUFRLENBQUMsS0FBYixFQUFvQjtBQUNoQix3Q0FBUSxPQUFLLGNBQUwsRUFBUjtBQUNBLHNDQUFNLE9BQU4sR0FBZ0IsY0FBaEI7QUFDQSx1Q0FBSyxXQUFMLENBQWlCLEtBQWpCO0FBQ0g7QUFFRCxnQ0FBSSxRQUFRLEtBQVosRUFBbUI7QUFDZixvQ0FB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LElBQW1CLEtBQUssUUFBTCxDQUFjLEtBQWQsQ0FBekI7QUFDQSxnQkFBSSxDQUFKLEVBQU87QUFDSCxxQkFBSyxRQUFMLEdBQWdCLEVBQUUsR0FBbEI7QUFDSDtBQUNKOzs7NEJBRWlCO0FBQUssbUJBQU8sS0FBSyxNQUFMLENBQVksS0FBSyxjQUFqQixDQUFQO0FBQTBDOzs7O0VBbklhLGdCOztBQThLNUUsUUFBUyxhQUFULEdBQStCLFNBQVUsZUFBVixDQUEwQix1QkFBMUIsRUFBbUQsRUFBRSxXQUFXLGNBQWMsU0FBM0IsRUFBbkQsQ0FBL0IiLCJmaWxlIjoibGliL3ZpZXdzL291dHB1dC1jb21wb25lbnQuanMiLCJzb3VyY2VzQ29udGVudCI6WyJsZXQgZmFzdGRvbSA9IHJlcXVpcmUoXCJmYXN0ZG9tXCIpO1xuaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xuY29uc3QgJCA9IHJlcXVpcmUoXCJqcXVlcnlcIik7XG5leHBvcnQgY2xhc3MgT3V0cHV0RWxlbWVudCBleHRlbmRzIEhUTUxPTGlzdEVsZW1lbnQge1xuICAgIGNyZWF0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdGhpcy5vdXRwdXQgPSBbXTtcbiAgICAgICAgdGhpcy5jbGFzc0xpc3QuYWRkKFwibWVzc2FnZXMtY29udGFpbmVyXCIsIFwib2xcIik7XG4gICAgICAgIGNvbnN0IHBhcmVudCA9IHRoaXM7XG4gICAgICAgIGNvbnN0IG9uY2xpY2tIYW5kbGVyID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgIHBhcmVudC5zZWxlY3RlZCA9IHRoaXMua2V5O1xuICAgICAgICAgICAgcGFyZW50LmhhbmRsZUNsaWNrKHRoaXMuaXRlbSk7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuX3VwZGF0ZSA9IF8udGhyb3R0bGUoKCkgPT4ge1xuICAgICAgICAgICAgZmFzdGRvbS5tZWFzdXJlKCgpID0+IHtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMCwgbGVuID0gdGhpcy5jaGlsZHJlbi5sZW5ndGggPiB0aGlzLm91dHB1dC5sZW5ndGggPyB0aGlzLmNoaWxkcmVuLmxlbmd0aCA6IHRoaXMub3V0cHV0Lmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW0gPSB0aGlzLm91dHB1dFtpXTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGNoaWxkID0gdGhpcy5jaGlsZHJlbltpXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFpdGVtICYmIGNoaWxkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZUNoaWxkKGNoaWxkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGZhc3Rkb20ubXV0YXRlKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpdGVtICYmICFjaGlsZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkID0gdGhpcy5lbGVtZW50RmFjdG9yeSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkLm9uY2xpY2sgPSBvbmNsaWNrSGFuZGxlcjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFwcGVuZENoaWxkKGNoaWxkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpdGVtICYmIGNoaWxkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qga2V5ID0gdGhpcy5nZXRLZXkoaXRlbSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNoaWxkLmtleSAhPT0ga2V5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkLnNldE1lc3NhZ2Uoa2V5LCBpdGVtKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGQuaXRlbSA9IGl0ZW07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNoaWxkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNoaWxkLmtleSA9PT0gdGhpcy5fc2VsZWN0ZWRLZXkgJiYgIWNoaWxkLnNlbGVjdGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkLnNlbGVjdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoY2hpbGQuc2VsZWN0ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGQuc2VsZWN0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmYXN0ZG9tLm11dGF0ZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsVG9JdGVtVmlldygpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9jYWxjdWxhdGVJbnZpZXcoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LCAxMDAsIHsgbGVhZGluZzogdHJ1ZSwgdHJhaWxpbmc6IHRydWUgfSk7XG4gICAgICAgIHRoaXMub25rZXlkb3duID0gKGUpID0+IHRoaXMua2V5ZG93blBhbmUoZSk7XG4gICAgICAgIHRoaXMuX3Njcm9sbCA9IF8udGhyb3R0bGUoKGUpID0+IHRoaXMuX2NhbGN1bGF0ZUludmlldygpLCAxMDAsIHsgbGVhZGluZzogdHJ1ZSwgdHJhaWxpbmc6IHRydWUgfSk7XG4gICAgfVxuICAgIGF0dGFjaGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMucGFyZW50RWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwic2Nyb2xsXCIsIHRoaXMuX3Njcm9sbCk7XG4gICAgICAgIHRoaXMuX2NhbGN1bGF0ZUludmlldygpO1xuICAgIH1cbiAgICBhdHRhY2hlZCgpIHtcbiAgICAgICAgZmFzdGRvbS5tdXRhdGUoKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5fdXBkYXRlKCk7XG4gICAgICAgICAgICBfLmVhY2godGhpcy5jaGlsZHJlbiwgKHgpID0+IHguYXR0YWNoZWQoKSk7XG4gICAgICAgICAgICB0aGlzLl9jYWxjdWxhdGVJbnZpZXcoKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGRldGFjaGVkKCkge1xuICAgICAgICBmYXN0ZG9tLm11dGF0ZSgoKSA9PiB7XG4gICAgICAgICAgICBfLmVhY2godGhpcy5jaGlsZHJlbiwgKHgpID0+IHguZGV0YWNoZWQoKSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBfY2FsY3VsYXRlSW52aWV3KCkge1xuICAgICAgICBjb25zdCBzZWxmID0gJCh0aGlzKTtcbiAgICAgICAgZmFzdGRvbS5tZWFzdXJlKCgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHRvcCA9IHNlbGYuc2Nyb2xsVG9wKCk7XG4gICAgICAgICAgICBjb25zdCBib3R0b20gPSB0b3AgKyB0aGlzLnBhcmVudEVsZW1lbnQuY2xpZW50SGVpZ2h0ICogMjtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwLCBsZW4gPSB0aGlzLmNoaWxkcmVuLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY2hpbGQgPSB0aGlzLmNoaWxkcmVuW2ldO1xuICAgICAgICAgICAgICAgIGNvbnN0ICRjaGlsZCA9ICQoY2hpbGQpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHBvc2l0aW9uID0gJGNoaWxkLnBvc2l0aW9uKCk7XG4gICAgICAgICAgICAgICAgY29uc3QgaGVpZ2h0ID0gY2hpbGQuY2xpZW50SGVpZ2h0O1xuICAgICAgICAgICAgICAgIGNvbnN0IGludmlldyA9IHBvc2l0aW9uLnRvcCArIGhlaWdodCA+IHRvcCAmJiBwb3NpdGlvbi50b3AgPCBib3R0b207XG4gICAgICAgICAgICAgICAgaWYgKGNoaWxkLmludmlldyAhPT0gaW52aWV3KSB7XG4gICAgICAgICAgICAgICAgICAgIGZhc3Rkb20ubXV0YXRlKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkLmludmlldyA9IGludmlldztcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG4gICAgZ2V0IHNlbGVjdGVkKCkgeyByZXR1cm4gdGhpcy5fc2VsZWN0ZWRLZXk7IH1cbiAgICBzZXQgc2VsZWN0ZWQodmFsdWUpIHtcbiAgICAgICAgY29uc3QgaW5kZXggPSBfLmZpbmRJbmRleCh0aGlzLmNoaWxkcmVuLCAoZSkgPT4gZS5rZXkgPT09IHZhbHVlKTtcbiAgICAgICAgaWYgKGluZGV4KSB7XG4gICAgICAgICAgICBjb25zdCBlID0gdGhpcy5jaGlsZHJlbltpbmRleF07XG4gICAgICAgICAgICB0aGlzLl9zZWxlY3RlZEtleSA9IHZhbHVlO1xuICAgICAgICAgICAgdGhpcy5fc2VsZWN0ZWRJbmRleCA9IGluZGV4O1xuICAgICAgICAgICAgaWYgKHRoaXMuX3NlbGVjdGVkRWxlbWVudCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3NlbGVjdGVkRWxlbWVudC5zZWxlY3RlZCA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fc2VsZWN0ZWRFbGVtZW50ID0gZTtcbiAgICAgICAgICAgIGUuc2VsZWN0ZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIGdldCBzZWxlY3RlZEluZGV4KCkgeyByZXR1cm4gdGhpcy5fc2VsZWN0ZWRJbmRleDsgfVxuICAgIHNldCBzZWxlY3RlZEluZGV4KGluZGV4KSB7XG4gICAgICAgIGNvbnN0IGUgPSB0aGlzLmNoaWxkcmVuW2luZGV4XTtcbiAgICAgICAgaWYgKGUpIHtcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWQgPSBlLmtleTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBnZXQgY3VycmVudCgpIHsgcmV0dXJuIHRoaXMub3V0cHV0W3RoaXMuX3NlbGVjdGVkSW5kZXhdOyB9XG4gICAgbmV4dCgpIHtcbiAgICAgICAgdGhpcy5zZWxlY3RlZEluZGV4ID0gdGhpcy5fc2VsZWN0ZWRJbmRleCArIDE7XG4gICAgfVxuICAgIHByZXYoKSB7XG4gICAgICAgIHRoaXMuc2VsZWN0ZWRJbmRleCA9IHRoaXMuX3NlbGVjdGVkSW5kZXggLSAxO1xuICAgIH1cbiAgICB1cGRhdGVPdXRwdXQob3V0cHV0KSB7XG4gICAgICAgIHRoaXMub3V0cHV0ID0gXy50b0FycmF5KG91dHB1dCk7XG4gICAgICAgIHRoaXMuX3VwZGF0ZSgpO1xuICAgIH1cbiAgICBrZXlkb3duUGFuZShlKSB7XG4gICAgICAgIGlmIChlLmtleUlkZW50aWZpZXIgPT09IFwiRG93blwiKSB7XG4gICAgICAgICAgICBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSksIGBvbW5pc2hhcnAtYXRvbTpuZXh0LSR7dGhpcy5ldmVudE5hbWV9YCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoZS5rZXlJZGVudGlmaWVyID09PSBcIlVwXCIpIHtcbiAgICAgICAgICAgIGF0b20uY29tbWFuZHMuZGlzcGF0Y2goYXRvbS52aWV3cy5nZXRWaWV3KGF0b20ud29ya3NwYWNlKSwgYG9tbmlzaGFycC1hdG9tOnByZXZpb3VzLSR7dGhpcy5ldmVudE5hbWV9YCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoZS5rZXlJZGVudGlmaWVyID09PSBcIkVudGVyXCIpIHtcbiAgICAgICAgICAgIGF0b20uY29tbWFuZHMuZGlzcGF0Y2goYXRvbS52aWV3cy5nZXRWaWV3KGF0b20ud29ya3NwYWNlKSwgYG9tbmlzaGFycC1hdG9tOmdvLXRvLSR7dGhpcy5ldmVudE5hbWV9YCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgc2Nyb2xsVG9JdGVtVmlldygpIHtcbiAgICAgICAgY29uc3Qgc2VsZiA9ICQodGhpcyk7XG4gICAgICAgIGNvbnN0IGl0ZW0gPSBzZWxmLmZpbmQoYC5zZWxlY3RlZGApO1xuICAgICAgICBpZiAoIWl0ZW0gfHwgIWl0ZW0ucG9zaXRpb24oKSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3QgcGFuZSA9IHNlbGY7XG4gICAgICAgIGNvbnN0IHNjcm9sbFRvcCA9IHBhbmUuc2Nyb2xsVG9wKCk7XG4gICAgICAgIGNvbnN0IGRlc2lyZWRUb3AgPSBpdGVtLnBvc2l0aW9uKCkudG9wICsgc2Nyb2xsVG9wO1xuICAgICAgICBjb25zdCBkZXNpcmVkQm90dG9tID0gZGVzaXJlZFRvcCArIGl0ZW0ub3V0ZXJIZWlnaHQoKTtcbiAgICAgICAgaWYgKGRlc2lyZWRUb3AgPCBzY3JvbGxUb3ApIHtcbiAgICAgICAgICAgIHBhbmUuc2Nyb2xsVG9wKGRlc2lyZWRUb3ApO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGRlc2lyZWRCb3R0b20gPiBwYW5lLnNjcm9sbFRvcCgpICsgaXRlbS5vdXRlckhlaWdodCgpKSB7XG4gICAgICAgICAgICBwYW5lLnNjcm9sbFRvcChkZXNpcmVkQm90dG9tICsgaXRlbS5vdXRlckhlaWdodCgpKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbmV4cG9ydHMuT3V0cHV0RWxlbWVudCA9IGRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudChcIm9tbmlzaGFycC1vdXRwdXQtbGlzdFwiLCB7IHByb3RvdHlwZTogT3V0cHV0RWxlbWVudC5wcm90b3R5cGUgfSk7XG4iLCJsZXQgZmFzdGRvbTogdHlwZW9mIEZhc3Rkb20gPSByZXF1aXJlKFwiZmFzdGRvbVwiKTtcclxuaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xyXG5jb25zdCAkOiBKUXVlcnlTdGF0aWMgPSByZXF1aXJlKFwianF1ZXJ5XCIpO1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBNZXNzYWdlRWxlbWVudDxUSXRlbT4gZXh0ZW5kcyBIVE1MTElFbGVtZW50IHtcclxuICAgIGtleTogc3RyaW5nO1xyXG4gICAgc2VsZWN0ZWQ6IGJvb2xlYW47XHJcbiAgICBpbnZpZXc6IGJvb2xlYW47XHJcbiAgICBzZXRNZXNzYWdlKGtleTogc3RyaW5nLCBpdGVtOiBUSXRlbSk6IHZvaWQ7XHJcbiAgICBpdGVtOiBUSXRlbTtcclxuICAgIGF0dGFjaGVkKCk6IHZvaWQ7XHJcbiAgICBkZXRhY2hlZCgpOiB2b2lkO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgT3V0cHV0RWxlbWVudDxUSXRlbSwgVEVsZW1lbnQgZXh0ZW5kcyBNZXNzYWdlRWxlbWVudDxUSXRlbT4+IGV4dGVuZHMgSFRNTE9MaXN0RWxlbWVudCBpbXBsZW1lbnRzIFdlYkNvbXBvbmVudCB7XHJcbiAgICBwcml2YXRlIG91dHB1dDogVEl0ZW1bXTtcclxuICAgIHByaXZhdGUgX3NlbGVjdGVkS2V5OiBzdHJpbmc7XHJcbiAgICBwcml2YXRlIF9zZWxlY3RlZEluZGV4OiBudW1iZXI7XHJcbiAgICBwcml2YXRlIF9zZWxlY3RlZEVsZW1lbnQ6IFRFbGVtZW50O1xyXG4gICAgcHJpdmF0ZSBfdXBkYXRlOiAoKSA9PiB2b2lkO1xyXG4gICAgcHJpdmF0ZSBfc2Nyb2xsOiBhbnk7XHJcblxyXG4gICAgcHVibGljIGNyZWF0ZWRDYWxsYmFjaygpIHtcclxuICAgICAgICB0aGlzLm91dHB1dCA9IFtdO1xyXG4gICAgICAgIHRoaXMuY2xhc3NMaXN0LmFkZChcIm1lc3NhZ2VzLWNvbnRhaW5lclwiLCBcIm9sXCIpO1xyXG4gICAgICAgIGNvbnN0IHBhcmVudCA9IHRoaXM7XHJcbiAgICAgICAgY29uc3Qgb25jbGlja0hhbmRsZXIgPSBmdW5jdGlvbihlOiBVSUV2ZW50KSB7XHJcbiAgICAgICAgICAgIHBhcmVudC5zZWxlY3RlZCA9IHRoaXMua2V5O1xyXG4gICAgICAgICAgICBwYXJlbnQuaGFuZGxlQ2xpY2sodGhpcy5pdGVtKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLl91cGRhdGUgPSBfLnRocm90dGxlKCgpID0+IHtcclxuICAgICAgICAgICAgZmFzdGRvbS5tZWFzdXJlKCgpID0+IHtcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwLCBsZW4gPSB0aGlzLmNoaWxkcmVuLmxlbmd0aCA+IHRoaXMub3V0cHV0Lmxlbmd0aCA/IHRoaXMuY2hpbGRyZW4ubGVuZ3RoIDogdGhpcy5vdXRwdXQubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBpdGVtID0gdGhpcy5vdXRwdXRbaV07XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGNoaWxkOiBURWxlbWVudCA9IDxhbnk+dGhpcy5jaGlsZHJlbltpXTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIWl0ZW0gJiYgY2hpbGQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVDaGlsZChjaGlsZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBmYXN0ZG9tLm11dGF0ZSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpdGVtICYmICFjaGlsZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGQgPSB0aGlzLmVsZW1lbnRGYWN0b3J5KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGlsZC5vbmNsaWNrID0gb25jbGlja0hhbmRsZXI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFwcGVuZENoaWxkKGNoaWxkKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGl0ZW0gJiYgY2hpbGQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGtleSA9IHRoaXMuZ2V0S2V5KGl0ZW0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNoaWxkLmtleSAhPT0ga2V5KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGQuc2V0TWVzc2FnZShrZXksIGl0ZW0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkLml0ZW0gPSBpdGVtO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2hpbGQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjaGlsZC5rZXkgPT09IHRoaXMuX3NlbGVjdGVkS2V5ICYmICFjaGlsZC5zZWxlY3RlZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkLnNlbGVjdGVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY2hpbGQuc2VsZWN0ZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGlsZC5zZWxlY3RlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgZmFzdGRvbS5tdXRhdGUoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsVG9JdGVtVmlldygpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2NhbGN1bGF0ZUludmlldygpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0sIDEwMCwgeyBsZWFkaW5nOiB0cnVlLCB0cmFpbGluZzogdHJ1ZSB9KTtcclxuXHJcbiAgICAgICAgdGhpcy5vbmtleWRvd24gPSAoZTogYW55KSA9PiB0aGlzLmtleWRvd25QYW5lKGUpO1xyXG4gICAgICAgIHRoaXMuX3Njcm9sbCA9IF8udGhyb3R0bGUoKGU6IFVJRXZlbnQpID0+IHRoaXMuX2NhbGN1bGF0ZUludmlldygpLCAxMDAsIHsgbGVhZGluZzogdHJ1ZSwgdHJhaWxpbmc6IHRydWUgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGF0dGFjaGVkQ2FsbGJhY2soKSB7XHJcbiAgICAgICAgdGhpcy5wYXJlbnRFbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJzY3JvbGxcIiwgdGhpcy5fc2Nyb2xsKTtcclxuICAgICAgICB0aGlzLl9jYWxjdWxhdGVJbnZpZXcoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgYXR0YWNoZWQoKSB7XHJcbiAgICAgICAgZmFzdGRvbS5tdXRhdGUoKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLl91cGRhdGUoKTtcclxuICAgICAgICAgICAgXy5lYWNoKHRoaXMuY2hpbGRyZW4sICh4OiBURWxlbWVudCkgPT4geC5hdHRhY2hlZCgpKTtcclxuICAgICAgICAgICAgdGhpcy5fY2FsY3VsYXRlSW52aWV3KCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRldGFjaGVkKCkge1xyXG4gICAgICAgIGZhc3Rkb20ubXV0YXRlKCgpID0+IHtcclxuICAgICAgICAgICAgXy5lYWNoKHRoaXMuY2hpbGRyZW4sICh4OiBURWxlbWVudCkgPT4geC5kZXRhY2hlZCgpKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9jYWxjdWxhdGVJbnZpZXcoKSB7XHJcbiAgICAgICAgY29uc3Qgc2VsZiA9ICQodGhpcyk7XHJcbiAgICAgICAgZmFzdGRvbS5tZWFzdXJlKCgpID0+IHtcclxuICAgICAgICAgICAgY29uc3QgdG9wID0gc2VsZi5zY3JvbGxUb3AoKTtcclxuICAgICAgICAgICAgY29uc3QgYm90dG9tID0gdG9wICsgdGhpcy5wYXJlbnRFbGVtZW50LmNsaWVudEhlaWdodCAqIDI7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwLCBsZW4gPSB0aGlzLmNoaWxkcmVuLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBjaGlsZDogVEVsZW1lbnQgPSA8YW55PnRoaXMuY2hpbGRyZW5baV07XHJcbiAgICAgICAgICAgICAgICBjb25zdCAkY2hpbGQgPSAkKGNoaWxkKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHBvc2l0aW9uID0gJGNoaWxkLnBvc2l0aW9uKCk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBoZWlnaHQgPSBjaGlsZC5jbGllbnRIZWlnaHQ7XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc3QgaW52aWV3ID0gcG9zaXRpb24udG9wICsgaGVpZ2h0ID4gdG9wICYmIHBvc2l0aW9uLnRvcCA8IGJvdHRvbTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoY2hpbGQuaW52aWV3ICE9PSBpbnZpZXcpIHtcclxuICAgICAgICAgICAgICAgICAgICBmYXN0ZG9tLm11dGF0ZSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkLmludmlldyA9IGludmlldztcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXRLZXk6IChtZXNzYWdlOiBUSXRlbSkgPT4gc3RyaW5nO1xyXG4gICAgcHVibGljIGV2ZW50TmFtZTogc3RyaW5nO1xyXG4gICAgcHVibGljIGhhbmRsZUNsaWNrOiAoaXRlbTogVEl0ZW0pID0+IHZvaWQ7XHJcbiAgICBwdWJsaWMgZWxlbWVudEZhY3Rvcnk6ICgpID0+IFRFbGVtZW50O1xyXG5cclxuICAgIHB1YmxpYyBnZXQgc2VsZWN0ZWQoKSB7IHJldHVybiB0aGlzLl9zZWxlY3RlZEtleTsgfVxyXG4gICAgcHVibGljIHNldCBzZWxlY3RlZCh2YWx1ZTogc3RyaW5nKSB7XHJcbiAgICAgICAgY29uc3QgaW5kZXggPSBfLmZpbmRJbmRleCh0aGlzLmNoaWxkcmVuLCAoZTogVEVsZW1lbnQpID0+IGUua2V5ID09PSB2YWx1ZSk7XHJcbiAgICAgICAgaWYgKGluZGV4KSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGU6IFRFbGVtZW50ID0gPGFueT50aGlzLmNoaWxkcmVuW2luZGV4XTtcclxuICAgICAgICAgICAgdGhpcy5fc2VsZWN0ZWRLZXkgPSB2YWx1ZTtcclxuICAgICAgICAgICAgdGhpcy5fc2VsZWN0ZWRJbmRleCA9IGluZGV4O1xyXG4gICAgICAgICAgICBpZiAodGhpcy5fc2VsZWN0ZWRFbGVtZW50KSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9zZWxlY3RlZEVsZW1lbnQuc2VsZWN0ZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLl9zZWxlY3RlZEVsZW1lbnQgPSBlO1xyXG4gICAgICAgICAgICBlLnNlbGVjdGVkID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldCBzZWxlY3RlZEluZGV4KCkgeyByZXR1cm4gdGhpcy5fc2VsZWN0ZWRJbmRleDsgfVxyXG4gICAgcHVibGljIHNldCBzZWxlY3RlZEluZGV4KGluZGV4KSB7XHJcbiAgICAgICAgY29uc3QgZTogVEVsZW1lbnQgPSA8YW55PnRoaXMuY2hpbGRyZW5baW5kZXhdO1xyXG4gICAgICAgIGlmIChlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWQgPSBlLmtleTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldCBjdXJyZW50KCkgeyByZXR1cm4gdGhpcy5vdXRwdXRbdGhpcy5fc2VsZWN0ZWRJbmRleF07IH1cclxuXHJcbiAgICBwdWJsaWMgbmV4dCgpIHtcclxuICAgICAgICB0aGlzLnNlbGVjdGVkSW5kZXggPSB0aGlzLl9zZWxlY3RlZEluZGV4ICsgMTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcHJldigpIHtcclxuICAgICAgICB0aGlzLnNlbGVjdGVkSW5kZXggPSB0aGlzLl9zZWxlY3RlZEluZGV4IC0gMTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgdXBkYXRlT3V0cHV0KG91dHB1dDogVEl0ZW1bXSB8IEl0ZXJhYmxlSXRlcmF0b3I8VEl0ZW0+KSB7XHJcbiAgICAgICAgdGhpcy5vdXRwdXQgPSBfLnRvQXJyYXkob3V0cHV0KTtcclxuICAgICAgICB0aGlzLl91cGRhdGUoKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGtleWRvd25QYW5lKGU6IGFueSkge1xyXG4gICAgICAgIGlmIChlLmtleUlkZW50aWZpZXIgPT09IFwiRG93blwiKSB7XHJcbiAgICAgICAgICAgIGF0b20uY29tbWFuZHMuZGlzcGF0Y2goYXRvbS52aWV3cy5nZXRWaWV3KGF0b20ud29ya3NwYWNlKSwgYG9tbmlzaGFycC1hdG9tOm5leHQtJHt0aGlzLmV2ZW50TmFtZX1gKTtcclxuICAgICAgICB9IGVsc2UgaWYgKGUua2V5SWRlbnRpZmllciA9PT0gXCJVcFwiKSB7XHJcbiAgICAgICAgICAgIGF0b20uY29tbWFuZHMuZGlzcGF0Y2goYXRvbS52aWV3cy5nZXRWaWV3KGF0b20ud29ya3NwYWNlKSwgYG9tbmlzaGFycC1hdG9tOnByZXZpb3VzLSR7dGhpcy5ldmVudE5hbWV9YCk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChlLmtleUlkZW50aWZpZXIgPT09IFwiRW50ZXJcIikge1xyXG4gICAgICAgICAgICBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSksIGBvbW5pc2hhcnAtYXRvbTpnby10by0ke3RoaXMuZXZlbnROYW1lfWApO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHNjcm9sbFRvSXRlbVZpZXcoKSB7XHJcbiAgICAgICAgY29uc3Qgc2VsZiA9ICQodGhpcyk7XHJcbiAgICAgICAgY29uc3QgaXRlbSA9IHNlbGYuZmluZChgLnNlbGVjdGVkYCk7XHJcbiAgICAgICAgaWYgKCFpdGVtIHx8ICFpdGVtLnBvc2l0aW9uKCkpIHJldHVybjtcclxuXHJcbiAgICAgICAgY29uc3QgcGFuZSA9IHNlbGY7XHJcbiAgICAgICAgY29uc3Qgc2Nyb2xsVG9wID0gcGFuZS5zY3JvbGxUb3AoKTtcclxuICAgICAgICBjb25zdCBkZXNpcmVkVG9wID0gaXRlbS5wb3NpdGlvbigpLnRvcCArIHNjcm9sbFRvcDtcclxuICAgICAgICBjb25zdCBkZXNpcmVkQm90dG9tID0gZGVzaXJlZFRvcCArIGl0ZW0ub3V0ZXJIZWlnaHQoKTtcclxuXHJcbiAgICAgICAgaWYgKGRlc2lyZWRUb3AgPCBzY3JvbGxUb3ApIHtcclxuICAgICAgICAgICAgcGFuZS5zY3JvbGxUb3AoZGVzaXJlZFRvcCk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChkZXNpcmVkQm90dG9tID4gcGFuZS5zY3JvbGxUb3AoKSArIGl0ZW0ub3V0ZXJIZWlnaHQoKSkge1xyXG4gICAgICAgICAgICBwYW5lLnNjcm9sbFRvcChkZXNpcmVkQm90dG9tICsgaXRlbS5vdXRlckhlaWdodCgpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbig8YW55PmV4cG9ydHMpLk91dHB1dEVsZW1lbnQgPSAoPGFueT5kb2N1bWVudCkucmVnaXN0ZXJFbGVtZW50KFwib21uaXNoYXJwLW91dHB1dC1saXN0XCIsIHsgcHJvdG90eXBlOiBPdXRwdXRFbGVtZW50LnByb3RvdHlwZSB9KTtcclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
