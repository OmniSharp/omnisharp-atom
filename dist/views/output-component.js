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

        return _possibleConstructorReturn(this, (OutputElement.__proto__ || Object.getPrototypeOf(OutputElement)).apply(this, arguments));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy9vdXRwdXQtY29tcG9uZW50LmpzIiwibGliL3ZpZXdzL291dHB1dC1jb21wb25lbnQudHMiXSwibmFtZXMiOlsiZmFzdGRvbSIsInJlcXVpcmUiLCIkIiwiT3V0cHV0RWxlbWVudCIsIm91dHB1dCIsImNsYXNzTGlzdCIsImFkZCIsInBhcmVudCIsIm9uY2xpY2tIYW5kbGVyIiwiZSIsInNlbGVjdGVkIiwia2V5IiwiaGFuZGxlQ2xpY2siLCJpdGVtIiwiX3VwZGF0ZSIsInRocm90dGxlIiwibWVhc3VyZSIsImkiLCJsZW4iLCJjaGlsZCIsImNoaWxkcmVuIiwicmVtb3ZlQ2hpbGQiLCJtdXRhdGUiLCJlbGVtZW50RmFjdG9yeSIsIm9uY2xpY2siLCJhcHBlbmRDaGlsZCIsImdldEtleSIsInNldE1lc3NhZ2UiLCJfc2VsZWN0ZWRLZXkiLCJsZW5ndGgiLCJzY3JvbGxUb0l0ZW1WaWV3IiwiX2NhbGN1bGF0ZUludmlldyIsImxlYWRpbmciLCJ0cmFpbGluZyIsIm9ua2V5ZG93biIsImtleWRvd25QYW5lIiwiX3Njcm9sbCIsInBhcmVudEVsZW1lbnQiLCJhZGRFdmVudExpc3RlbmVyIiwiZWFjaCIsIngiLCJhdHRhY2hlZCIsImRldGFjaGVkIiwic2VsZiIsInRvcCIsInNjcm9sbFRvcCIsImJvdHRvbSIsImNsaWVudEhlaWdodCIsIiRjaGlsZCIsInBvc2l0aW9uIiwiaGVpZ2h0IiwiaW52aWV3Iiwic2VsZWN0ZWRJbmRleCIsIl9zZWxlY3RlZEluZGV4IiwidG9BcnJheSIsImtleUlkZW50aWZpZXIiLCJhdG9tIiwiY29tbWFuZHMiLCJkaXNwYXRjaCIsInZpZXdzIiwiZ2V0VmlldyIsIndvcmtzcGFjZSIsImV2ZW50TmFtZSIsImZpbmQiLCJwYW5lIiwiZGVzaXJlZFRvcCIsImRlc2lyZWRCb3R0b20iLCJvdXRlckhlaWdodCIsInZhbHVlIiwiaW5kZXgiLCJmaW5kSW5kZXgiLCJfc2VsZWN0ZWRFbGVtZW50IiwiSFRNTE9MaXN0RWxl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QUFXO0FBQ1Asb0JBQU01RCxJQUFtQixLQUFLVyxRQUFMLENBQWNpRCxLQUFkLENBQXpCO0FBQ0EscUJBQUt6QyxZQUFMLEdBQW9Cd0MsS0FBcEI7QUFDQSxxQkFBS2YsY0FBTCxHQUFzQmdCLEtBQXRCO0FBQ0Esb0JBQUksS0FBS0UsZ0JBQVQsRUFBMkI7QUFDdkIseUJBQUtBLGdCQUFMLENBQXNCN0QsUUFBdEIsR0FBaUMsS0FBakM7QUFDSDtBQUNELHFCQUFLNkQsZ0JBQUwsR0FBd0I5RCxDQUF4QjtBQUNBQSxrQkFBRUMsUUFBRixHQUFhLElBQWI7QUFDSDtBQUNKOzs7NEJBRXVCO0FBQUssbUJBQU8sS0FBSzJDLGNBQVo7QUFBNkIsUzswQkFDakNnQixLLEVBQUs7QUFDMUIsZ0JBQU01RCxJQUFtQixLQUFLVyxRQUFMLENBQWNpRCxLQUFkLENBQXpCO0FBQ0EsZ0JBQUk1RCxDQUFKLEVBQU87QUFDSCxxQkFBS0MsUUFBTCxHQUFnQkQsRUFBRUUsR0FBbEI7QUFDSDtBQUNKOzs7NEJBRWlCO0FBQUssbUJBQU8sS0FBS1AsTUFBTCxDQUFZLEtBQUtpRCxjQUFqQixDQUFQO0FBQTBDOzs7O0VBbklhbUIsZ0I7O0FBOEs1RUMsUUFBU3RFLGFBQVQsR0FBK0J1RSxTQUFVQyxlQUFWLENBQTBCLHVCQUExQixFQUFtRCxFQUFFQyxXQUFXekUsY0FBY3lFLFNBQTNCLEVBQW5ELENBQS9CIiwiZmlsZSI6ImxpYi92aWV3cy9vdXRwdXQtY29tcG9uZW50LmpzIiwic291cmNlc0NvbnRlbnQiOlsibGV0IGZhc3Rkb20gPSByZXF1aXJlKFwiZmFzdGRvbVwiKTtcbmltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcbmNvbnN0ICQgPSByZXF1aXJlKFwianF1ZXJ5XCIpO1xuZXhwb3J0IGNsYXNzIE91dHB1dEVsZW1lbnQgZXh0ZW5kcyBIVE1MT0xpc3RFbGVtZW50IHtcbiAgICBjcmVhdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMub3V0cHV0ID0gW107XG4gICAgICAgIHRoaXMuY2xhc3NMaXN0LmFkZChcIm1lc3NhZ2VzLWNvbnRhaW5lclwiLCBcIm9sXCIpO1xuICAgICAgICBjb25zdCBwYXJlbnQgPSB0aGlzO1xuICAgICAgICBjb25zdCBvbmNsaWNrSGFuZGxlciA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICBwYXJlbnQuc2VsZWN0ZWQgPSB0aGlzLmtleTtcbiAgICAgICAgICAgIHBhcmVudC5oYW5kbGVDbGljayh0aGlzLml0ZW0pO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLl91cGRhdGUgPSBfLnRocm90dGxlKCgpID0+IHtcbiAgICAgICAgICAgIGZhc3Rkb20ubWVhc3VyZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDAsIGxlbiA9IHRoaXMuY2hpbGRyZW4ubGVuZ3RoID4gdGhpcy5vdXRwdXQubGVuZ3RoID8gdGhpcy5jaGlsZHJlbi5sZW5ndGggOiB0aGlzLm91dHB1dC5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBpdGVtID0gdGhpcy5vdXRwdXRbaV07XG4gICAgICAgICAgICAgICAgICAgIGxldCBjaGlsZCA9IHRoaXMuY2hpbGRyZW5baV07XG4gICAgICAgICAgICAgICAgICAgIGlmICghaXRlbSAmJiBjaGlsZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVDaGlsZChjaGlsZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBmYXN0ZG9tLm11dGF0ZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXRlbSAmJiAhY2hpbGQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGlsZCA9IHRoaXMuZWxlbWVudEZhY3RvcnkoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGlsZC5vbmNsaWNrID0gb25jbGlja0hhbmRsZXI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hcHBlbmRDaGlsZChjaGlsZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXRlbSAmJiBjaGlsZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGtleSA9IHRoaXMuZ2V0S2V5KGl0ZW0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjaGlsZC5rZXkgIT09IGtleSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGlsZC5zZXRNZXNzYWdlKGtleSwgaXRlbSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkLml0ZW0gPSBpdGVtO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjaGlsZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjaGlsZC5rZXkgPT09IHRoaXMuX3NlbGVjdGVkS2V5ICYmICFjaGlsZC5zZWxlY3RlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGlsZC5zZWxlY3RlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKGNoaWxkLnNlbGVjdGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkLnNlbGVjdGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZmFzdGRvbS5tdXRhdGUoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbFRvSXRlbVZpZXcoKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fY2FsY3VsYXRlSW52aWV3KCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSwgMTAwLCB7IGxlYWRpbmc6IHRydWUsIHRyYWlsaW5nOiB0cnVlIH0pO1xuICAgICAgICB0aGlzLm9ua2V5ZG93biA9IChlKSA9PiB0aGlzLmtleWRvd25QYW5lKGUpO1xuICAgICAgICB0aGlzLl9zY3JvbGwgPSBfLnRocm90dGxlKChlKSA9PiB0aGlzLl9jYWxjdWxhdGVJbnZpZXcoKSwgMTAwLCB7IGxlYWRpbmc6IHRydWUsIHRyYWlsaW5nOiB0cnVlIH0pO1xuICAgIH1cbiAgICBhdHRhY2hlZENhbGxiYWNrKCkge1xuICAgICAgICB0aGlzLnBhcmVudEVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcInNjcm9sbFwiLCB0aGlzLl9zY3JvbGwpO1xuICAgICAgICB0aGlzLl9jYWxjdWxhdGVJbnZpZXcoKTtcbiAgICB9XG4gICAgYXR0YWNoZWQoKSB7XG4gICAgICAgIGZhc3Rkb20ubXV0YXRlKCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuX3VwZGF0ZSgpO1xuICAgICAgICAgICAgXy5lYWNoKHRoaXMuY2hpbGRyZW4sICh4KSA9PiB4LmF0dGFjaGVkKCkpO1xuICAgICAgICAgICAgdGhpcy5fY2FsY3VsYXRlSW52aWV3KCk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBkZXRhY2hlZCgpIHtcbiAgICAgICAgZmFzdGRvbS5tdXRhdGUoKCkgPT4ge1xuICAgICAgICAgICAgXy5lYWNoKHRoaXMuY2hpbGRyZW4sICh4KSA9PiB4LmRldGFjaGVkKCkpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgX2NhbGN1bGF0ZUludmlldygpIHtcbiAgICAgICAgY29uc3Qgc2VsZiA9ICQodGhpcyk7XG4gICAgICAgIGZhc3Rkb20ubWVhc3VyZSgoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCB0b3AgPSBzZWxmLnNjcm9sbFRvcCgpO1xuICAgICAgICAgICAgY29uc3QgYm90dG9tID0gdG9wICsgdGhpcy5wYXJlbnRFbGVtZW50LmNsaWVudEhlaWdodCAqIDI7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMCwgbGVuID0gdGhpcy5jaGlsZHJlbi5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNoaWxkID0gdGhpcy5jaGlsZHJlbltpXTtcbiAgICAgICAgICAgICAgICBjb25zdCAkY2hpbGQgPSAkKGNoaWxkKTtcbiAgICAgICAgICAgICAgICBjb25zdCBwb3NpdGlvbiA9ICRjaGlsZC5wb3NpdGlvbigpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGhlaWdodCA9IGNoaWxkLmNsaWVudEhlaWdodDtcbiAgICAgICAgICAgICAgICBjb25zdCBpbnZpZXcgPSBwb3NpdGlvbi50b3AgKyBoZWlnaHQgPiB0b3AgJiYgcG9zaXRpb24udG9wIDwgYm90dG9tO1xuICAgICAgICAgICAgICAgIGlmIChjaGlsZC5pbnZpZXcgIT09IGludmlldykge1xuICAgICAgICAgICAgICAgICAgICBmYXN0ZG9tLm11dGF0ZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjaGlsZC5pbnZpZXcgPSBpbnZpZXc7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGdldCBzZWxlY3RlZCgpIHsgcmV0dXJuIHRoaXMuX3NlbGVjdGVkS2V5OyB9XG4gICAgc2V0IHNlbGVjdGVkKHZhbHVlKSB7XG4gICAgICAgIGNvbnN0IGluZGV4ID0gXy5maW5kSW5kZXgodGhpcy5jaGlsZHJlbiwgKGUpID0+IGUua2V5ID09PSB2YWx1ZSk7XG4gICAgICAgIGlmIChpbmRleCkge1xuICAgICAgICAgICAgY29uc3QgZSA9IHRoaXMuY2hpbGRyZW5baW5kZXhdO1xuICAgICAgICAgICAgdGhpcy5fc2VsZWN0ZWRLZXkgPSB2YWx1ZTtcbiAgICAgICAgICAgIHRoaXMuX3NlbGVjdGVkSW5kZXggPSBpbmRleDtcbiAgICAgICAgICAgIGlmICh0aGlzLl9zZWxlY3RlZEVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9zZWxlY3RlZEVsZW1lbnQuc2VsZWN0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX3NlbGVjdGVkRWxlbWVudCA9IGU7XG4gICAgICAgICAgICBlLnNlbGVjdGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBnZXQgc2VsZWN0ZWRJbmRleCgpIHsgcmV0dXJuIHRoaXMuX3NlbGVjdGVkSW5kZXg7IH1cbiAgICBzZXQgc2VsZWN0ZWRJbmRleChpbmRleCkge1xuICAgICAgICBjb25zdCBlID0gdGhpcy5jaGlsZHJlbltpbmRleF07XG4gICAgICAgIGlmIChlKSB7XG4gICAgICAgICAgICB0aGlzLnNlbGVjdGVkID0gZS5rZXk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZ2V0IGN1cnJlbnQoKSB7IHJldHVybiB0aGlzLm91dHB1dFt0aGlzLl9zZWxlY3RlZEluZGV4XTsgfVxuICAgIG5leHQoKSB7XG4gICAgICAgIHRoaXMuc2VsZWN0ZWRJbmRleCA9IHRoaXMuX3NlbGVjdGVkSW5kZXggKyAxO1xuICAgIH1cbiAgICBwcmV2KCkge1xuICAgICAgICB0aGlzLnNlbGVjdGVkSW5kZXggPSB0aGlzLl9zZWxlY3RlZEluZGV4IC0gMTtcbiAgICB9XG4gICAgdXBkYXRlT3V0cHV0KG91dHB1dCkge1xuICAgICAgICB0aGlzLm91dHB1dCA9IF8udG9BcnJheShvdXRwdXQpO1xuICAgICAgICB0aGlzLl91cGRhdGUoKTtcbiAgICB9XG4gICAga2V5ZG93blBhbmUoZSkge1xuICAgICAgICBpZiAoZS5rZXlJZGVudGlmaWVyID09PSBcIkRvd25cIikge1xuICAgICAgICAgICAgYXRvbS5jb21tYW5kcy5kaXNwYXRjaChhdG9tLnZpZXdzLmdldFZpZXcoYXRvbS53b3Jrc3BhY2UpLCBgb21uaXNoYXJwLWF0b206bmV4dC0ke3RoaXMuZXZlbnROYW1lfWApO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGUua2V5SWRlbnRpZmllciA9PT0gXCJVcFwiKSB7XG4gICAgICAgICAgICBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSksIGBvbW5pc2hhcnAtYXRvbTpwcmV2aW91cy0ke3RoaXMuZXZlbnROYW1lfWApO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGUua2V5SWRlbnRpZmllciA9PT0gXCJFbnRlclwiKSB7XG4gICAgICAgICAgICBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSksIGBvbW5pc2hhcnAtYXRvbTpnby10by0ke3RoaXMuZXZlbnROYW1lfWApO1xuICAgICAgICB9XG4gICAgfVxuICAgIHNjcm9sbFRvSXRlbVZpZXcoKSB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSAkKHRoaXMpO1xuICAgICAgICBjb25zdCBpdGVtID0gc2VsZi5maW5kKGAuc2VsZWN0ZWRgKTtcbiAgICAgICAgaWYgKCFpdGVtIHx8ICFpdGVtLnBvc2l0aW9uKCkpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNvbnN0IHBhbmUgPSBzZWxmO1xuICAgICAgICBjb25zdCBzY3JvbGxUb3AgPSBwYW5lLnNjcm9sbFRvcCgpO1xuICAgICAgICBjb25zdCBkZXNpcmVkVG9wID0gaXRlbS5wb3NpdGlvbigpLnRvcCArIHNjcm9sbFRvcDtcbiAgICAgICAgY29uc3QgZGVzaXJlZEJvdHRvbSA9IGRlc2lyZWRUb3AgKyBpdGVtLm91dGVySGVpZ2h0KCk7XG4gICAgICAgIGlmIChkZXNpcmVkVG9wIDwgc2Nyb2xsVG9wKSB7XG4gICAgICAgICAgICBwYW5lLnNjcm9sbFRvcChkZXNpcmVkVG9wKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChkZXNpcmVkQm90dG9tID4gcGFuZS5zY3JvbGxUb3AoKSArIGl0ZW0ub3V0ZXJIZWlnaHQoKSkge1xuICAgICAgICAgICAgcGFuZS5zY3JvbGxUb3AoZGVzaXJlZEJvdHRvbSArIGl0ZW0ub3V0ZXJIZWlnaHQoKSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5leHBvcnRzLk91dHB1dEVsZW1lbnQgPSBkb2N1bWVudC5yZWdpc3RlckVsZW1lbnQoXCJvbW5pc2hhcnAtb3V0cHV0LWxpc3RcIiwgeyBwcm90b3R5cGU6IE91dHB1dEVsZW1lbnQucHJvdG90eXBlIH0pO1xuIiwibGV0IGZhc3Rkb206IHR5cGVvZiBGYXN0ZG9tID0gcmVxdWlyZShcImZhc3Rkb21cIik7XHJcbmltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcclxuY29uc3QgJDogSlF1ZXJ5U3RhdGljID0gcmVxdWlyZShcImpxdWVyeVwiKTtcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgTWVzc2FnZUVsZW1lbnQ8VEl0ZW0+IGV4dGVuZHMgSFRNTExJRWxlbWVudCB7XHJcbiAgICBrZXk6IHN0cmluZztcclxuICAgIHNlbGVjdGVkOiBib29sZWFuO1xyXG4gICAgaW52aWV3OiBib29sZWFuO1xyXG4gICAgc2V0TWVzc2FnZShrZXk6IHN0cmluZywgaXRlbTogVEl0ZW0pOiB2b2lkO1xyXG4gICAgaXRlbTogVEl0ZW07XHJcbiAgICBhdHRhY2hlZCgpOiB2b2lkO1xyXG4gICAgZGV0YWNoZWQoKTogdm9pZDtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIE91dHB1dEVsZW1lbnQ8VEl0ZW0sIFRFbGVtZW50IGV4dGVuZHMgTWVzc2FnZUVsZW1lbnQ8VEl0ZW0+PiBleHRlbmRzIEhUTUxPTGlzdEVsZW1lbnQgaW1wbGVtZW50cyBXZWJDb21wb25lbnQge1xyXG4gICAgcHJpdmF0ZSBvdXRwdXQ6IFRJdGVtW107XHJcbiAgICBwcml2YXRlIF9zZWxlY3RlZEtleTogc3RyaW5nO1xyXG4gICAgcHJpdmF0ZSBfc2VsZWN0ZWRJbmRleDogbnVtYmVyO1xyXG4gICAgcHJpdmF0ZSBfc2VsZWN0ZWRFbGVtZW50OiBURWxlbWVudDtcclxuICAgIHByaXZhdGUgX3VwZGF0ZTogKCkgPT4gdm9pZDtcclxuICAgIHByaXZhdGUgX3Njcm9sbDogYW55O1xyXG5cclxuICAgIHB1YmxpYyBjcmVhdGVkQ2FsbGJhY2soKSB7XHJcbiAgICAgICAgdGhpcy5vdXRwdXQgPSBbXTtcclxuICAgICAgICB0aGlzLmNsYXNzTGlzdC5hZGQoXCJtZXNzYWdlcy1jb250YWluZXJcIiwgXCJvbFwiKTtcclxuICAgICAgICBjb25zdCBwYXJlbnQgPSB0aGlzO1xyXG4gICAgICAgIGNvbnN0IG9uY2xpY2tIYW5kbGVyID0gZnVuY3Rpb24oZTogVUlFdmVudCkge1xyXG4gICAgICAgICAgICBwYXJlbnQuc2VsZWN0ZWQgPSB0aGlzLmtleTtcclxuICAgICAgICAgICAgcGFyZW50LmhhbmRsZUNsaWNrKHRoaXMuaXRlbSk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5fdXBkYXRlID0gXy50aHJvdHRsZSgoKSA9PiB7XHJcbiAgICAgICAgICAgIGZhc3Rkb20ubWVhc3VyZSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMCwgbGVuID0gdGhpcy5jaGlsZHJlbi5sZW5ndGggPiB0aGlzLm91dHB1dC5sZW5ndGggPyB0aGlzLmNoaWxkcmVuLmxlbmd0aCA6IHRoaXMub3V0cHV0Lmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaXRlbSA9IHRoaXMub3V0cHV0W2ldO1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBjaGlsZDogVEVsZW1lbnQgPSA8YW55PnRoaXMuY2hpbGRyZW5baV07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFpdGVtICYmIGNoaWxkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlQ2hpbGQoY2hpbGQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgZmFzdGRvbS5tdXRhdGUoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXRlbSAmJiAhY2hpbGQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkID0gdGhpcy5lbGVtZW50RmFjdG9yeSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGQub25jbGljayA9IG9uY2xpY2tIYW5kbGVyO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hcHBlbmRDaGlsZChjaGlsZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpdGVtICYmIGNoaWxkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBrZXkgPSB0aGlzLmdldEtleShpdGVtKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjaGlsZC5rZXkgIT09IGtleSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkLnNldE1lc3NhZ2Uoa2V5LCBpdGVtKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGlsZC5pdGVtID0gaXRlbTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNoaWxkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2hpbGQua2V5ID09PSB0aGlzLl9zZWxlY3RlZEtleSAmJiAhY2hpbGQuc2VsZWN0ZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGlsZC5zZWxlY3RlZCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGNoaWxkLnNlbGVjdGVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGQuc2VsZWN0ZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGZhc3Rkb20ubXV0YXRlKCgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbFRvSXRlbVZpZXcoKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9jYWxjdWxhdGVJbnZpZXcoKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9LCAxMDAsIHsgbGVhZGluZzogdHJ1ZSwgdHJhaWxpbmc6IHRydWUgfSk7XHJcblxyXG4gICAgICAgIHRoaXMub25rZXlkb3duID0gKGU6IGFueSkgPT4gdGhpcy5rZXlkb3duUGFuZShlKTtcclxuICAgICAgICB0aGlzLl9zY3JvbGwgPSBfLnRocm90dGxlKChlOiBVSUV2ZW50KSA9PiB0aGlzLl9jYWxjdWxhdGVJbnZpZXcoKSwgMTAwLCB7IGxlYWRpbmc6IHRydWUsIHRyYWlsaW5nOiB0cnVlIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBhdHRhY2hlZENhbGxiYWNrKCkge1xyXG4gICAgICAgIHRoaXMucGFyZW50RWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwic2Nyb2xsXCIsIHRoaXMuX3Njcm9sbCk7XHJcbiAgICAgICAgdGhpcy5fY2FsY3VsYXRlSW52aWV3KCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGF0dGFjaGVkKCkge1xyXG4gICAgICAgIGZhc3Rkb20ubXV0YXRlKCgpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5fdXBkYXRlKCk7XHJcbiAgICAgICAgICAgIF8uZWFjaCh0aGlzLmNoaWxkcmVuLCAoeDogVEVsZW1lbnQpID0+IHguYXR0YWNoZWQoKSk7XHJcbiAgICAgICAgICAgIHRoaXMuX2NhbGN1bGF0ZUludmlldygpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkZXRhY2hlZCgpIHtcclxuICAgICAgICBmYXN0ZG9tLm11dGF0ZSgoKSA9PiB7XHJcbiAgICAgICAgICAgIF8uZWFjaCh0aGlzLmNoaWxkcmVuLCAoeDogVEVsZW1lbnQpID0+IHguZGV0YWNoZWQoKSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfY2FsY3VsYXRlSW52aWV3KCkge1xyXG4gICAgICAgIGNvbnN0IHNlbGYgPSAkKHRoaXMpO1xyXG4gICAgICAgIGZhc3Rkb20ubWVhc3VyZSgoKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IHRvcCA9IHNlbGYuc2Nyb2xsVG9wKCk7XHJcbiAgICAgICAgICAgIGNvbnN0IGJvdHRvbSA9IHRvcCArIHRoaXMucGFyZW50RWxlbWVudC5jbGllbnRIZWlnaHQgKiAyO1xyXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMCwgbGVuID0gdGhpcy5jaGlsZHJlbi5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgY2hpbGQ6IFRFbGVtZW50ID0gPGFueT50aGlzLmNoaWxkcmVuW2ldO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgJGNoaWxkID0gJChjaGlsZCk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBwb3NpdGlvbiA9ICRjaGlsZC5wb3NpdGlvbigpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgaGVpZ2h0ID0gY2hpbGQuY2xpZW50SGVpZ2h0O1xyXG5cclxuICAgICAgICAgICAgICAgIGNvbnN0IGludmlldyA9IHBvc2l0aW9uLnRvcCArIGhlaWdodCA+IHRvcCAmJiBwb3NpdGlvbi50b3AgPCBib3R0b207XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGNoaWxkLmludmlldyAhPT0gaW52aWV3KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZmFzdGRvbS5tdXRhdGUoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGlsZC5pbnZpZXcgPSBpbnZpZXc7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0S2V5OiAobWVzc2FnZTogVEl0ZW0pID0+IHN0cmluZztcclxuICAgIHB1YmxpYyBldmVudE5hbWU6IHN0cmluZztcclxuICAgIHB1YmxpYyBoYW5kbGVDbGljazogKGl0ZW06IFRJdGVtKSA9PiB2b2lkO1xyXG4gICAgcHVibGljIGVsZW1lbnRGYWN0b3J5OiAoKSA9PiBURWxlbWVudDtcclxuXHJcbiAgICBwdWJsaWMgZ2V0IHNlbGVjdGVkKCkgeyByZXR1cm4gdGhpcy5fc2VsZWN0ZWRLZXk7IH1cclxuICAgIHB1YmxpYyBzZXQgc2VsZWN0ZWQodmFsdWU6IHN0cmluZykge1xyXG4gICAgICAgIGNvbnN0IGluZGV4ID0gXy5maW5kSW5kZXgodGhpcy5jaGlsZHJlbiwgKGU6IFRFbGVtZW50KSA9PiBlLmtleSA9PT0gdmFsdWUpO1xyXG4gICAgICAgIGlmIChpbmRleCkge1xyXG4gICAgICAgICAgICBjb25zdCBlOiBURWxlbWVudCA9IDxhbnk+dGhpcy5jaGlsZHJlbltpbmRleF07XHJcbiAgICAgICAgICAgIHRoaXMuX3NlbGVjdGVkS2V5ID0gdmFsdWU7XHJcbiAgICAgICAgICAgIHRoaXMuX3NlbGVjdGVkSW5kZXggPSBpbmRleDtcclxuICAgICAgICAgICAgaWYgKHRoaXMuX3NlbGVjdGVkRWxlbWVudCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fc2VsZWN0ZWRFbGVtZW50LnNlbGVjdGVkID0gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5fc2VsZWN0ZWRFbGVtZW50ID0gZTtcclxuICAgICAgICAgICAgZS5zZWxlY3RlZCA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgc2VsZWN0ZWRJbmRleCgpIHsgcmV0dXJuIHRoaXMuX3NlbGVjdGVkSW5kZXg7IH1cclxuICAgIHB1YmxpYyBzZXQgc2VsZWN0ZWRJbmRleChpbmRleCkge1xyXG4gICAgICAgIGNvbnN0IGU6IFRFbGVtZW50ID0gPGFueT50aGlzLmNoaWxkcmVuW2luZGV4XTtcclxuICAgICAgICBpZiAoZSkge1xyXG4gICAgICAgICAgICB0aGlzLnNlbGVjdGVkID0gZS5rZXk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgY3VycmVudCgpIHsgcmV0dXJuIHRoaXMub3V0cHV0W3RoaXMuX3NlbGVjdGVkSW5kZXhdOyB9XHJcblxyXG4gICAgcHVibGljIG5leHQoKSB7XHJcbiAgICAgICAgdGhpcy5zZWxlY3RlZEluZGV4ID0gdGhpcy5fc2VsZWN0ZWRJbmRleCArIDE7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHByZXYoKSB7XHJcbiAgICAgICAgdGhpcy5zZWxlY3RlZEluZGV4ID0gdGhpcy5fc2VsZWN0ZWRJbmRleCAtIDE7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHVwZGF0ZU91dHB1dChvdXRwdXQ6IFRJdGVtW10gfCBJdGVyYWJsZUl0ZXJhdG9yPFRJdGVtPikge1xyXG4gICAgICAgIHRoaXMub3V0cHV0ID0gXy50b0FycmF5KG91dHB1dCk7XHJcbiAgICAgICAgdGhpcy5fdXBkYXRlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBrZXlkb3duUGFuZShlOiBhbnkpIHtcclxuICAgICAgICBpZiAoZS5rZXlJZGVudGlmaWVyID09PSBcIkRvd25cIikge1xyXG4gICAgICAgICAgICBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSksIGBvbW5pc2hhcnAtYXRvbTpuZXh0LSR7dGhpcy5ldmVudE5hbWV9YCk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChlLmtleUlkZW50aWZpZXIgPT09IFwiVXBcIikge1xyXG4gICAgICAgICAgICBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSksIGBvbW5pc2hhcnAtYXRvbTpwcmV2aW91cy0ke3RoaXMuZXZlbnROYW1lfWApO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoZS5rZXlJZGVudGlmaWVyID09PSBcIkVudGVyXCIpIHtcclxuICAgICAgICAgICAgYXRvbS5jb21tYW5kcy5kaXNwYXRjaChhdG9tLnZpZXdzLmdldFZpZXcoYXRvbS53b3Jrc3BhY2UpLCBgb21uaXNoYXJwLWF0b206Z28tdG8tJHt0aGlzLmV2ZW50TmFtZX1gKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBzY3JvbGxUb0l0ZW1WaWV3KCkge1xyXG4gICAgICAgIGNvbnN0IHNlbGYgPSAkKHRoaXMpO1xyXG4gICAgICAgIGNvbnN0IGl0ZW0gPSBzZWxmLmZpbmQoYC5zZWxlY3RlZGApO1xyXG4gICAgICAgIGlmICghaXRlbSB8fCAhaXRlbS5wb3NpdGlvbigpKSByZXR1cm47XHJcblxyXG4gICAgICAgIGNvbnN0IHBhbmUgPSBzZWxmO1xyXG4gICAgICAgIGNvbnN0IHNjcm9sbFRvcCA9IHBhbmUuc2Nyb2xsVG9wKCk7XHJcbiAgICAgICAgY29uc3QgZGVzaXJlZFRvcCA9IGl0ZW0ucG9zaXRpb24oKS50b3AgKyBzY3JvbGxUb3A7XHJcbiAgICAgICAgY29uc3QgZGVzaXJlZEJvdHRvbSA9IGRlc2lyZWRUb3AgKyBpdGVtLm91dGVySGVpZ2h0KCk7XHJcblxyXG4gICAgICAgIGlmIChkZXNpcmVkVG9wIDwgc2Nyb2xsVG9wKSB7XHJcbiAgICAgICAgICAgIHBhbmUuc2Nyb2xsVG9wKGRlc2lyZWRUb3ApO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoZGVzaXJlZEJvdHRvbSA+IHBhbmUuc2Nyb2xsVG9wKCkgKyBpdGVtLm91dGVySGVpZ2h0KCkpIHtcclxuICAgICAgICAgICAgcGFuZS5zY3JvbGxUb3AoZGVzaXJlZEJvdHRvbSArIGl0ZW0ub3V0ZXJIZWlnaHQoKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG4oPGFueT5leHBvcnRzKS5PdXRwdXRFbGVtZW50ID0gKDxhbnk+ZG9jdW1lbnQpLnJlZ2lzdGVyRWxlbWVudChcIm9tbmlzaGFycC1vdXRwdXQtbGlzdFwiLCB7IHByb3RvdHlwZTogT3V0cHV0RWxlbWVudC5wcm90b3R5cGUgfSk7XHJcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
