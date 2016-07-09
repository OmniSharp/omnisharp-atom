"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.FindWindow = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _omni = require("../server/omni");

var _path = require("path");

var path = _interopRequireWildcard(_path);

var _outputComponent = require("./output-component");

var _highlightElement = require("./highlight-element");

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var getMessageElement = function () {
    var selectedProps = {
        get: function selected() {
            return this.classList.contains("selected");
        },
        set: function selected(value) {
            if (value) this.classList.add("selected");else this.classList.remove("selected");
        }
    };
    var keyProps = {
        get: function key() {
            return this._key;
        }
    };
    var inviewProps = {
        get: function inview() {
            return this._inview;
        },
        set: function inview(value) {
            if (!this._inview && value) {
                this._text.enhance();
            }
            this._inview = value;
        }
    };
    function setMessage(key, item) {
        this._key = key;
        this._inview = false;
        this.classList.add(item.LogLevel);
        this._usage = item;
        this._text.usage = item;
        this._location.innerText = path.basename(item.FileName) + "(" + item.Line + "," + item.Column + ")";
        this._filename.innerText = path.dirname(item.FileName);
    }
    function attached() {
        this._text.usage = this._usage;
    }
    function detached() {
        this._inview = false;
    }
    return function getMessageElement() {
        var element = document.createElement("li");
        element.classList.add("find-usages");
        var text = element._text = new _highlightElement.HighlightElement();
        text.classList.add("text-highlight");
        element.appendChild(text);
        var location = element._location = document.createElement("pre");
        location.classList.add("inline-block");
        element.appendChild(location);
        var filename = element._filename = document.createElement("pre");
        filename.classList.add("text-subtle", "inline-block");
        element.appendChild(filename);
        Object.defineProperty(element, "key", keyProps);
        Object.defineProperty(element, "selected", selectedProps);
        Object.defineProperty(element, "inview", inviewProps);
        element.setMessage = setMessage;
        element.attached = attached;
        element.detached = detached;
        return element;
    };
}();

var FindWindow = exports.FindWindow = function (_HTMLDivElement) {
    _inherits(FindWindow, _HTMLDivElement);

    function FindWindow() {
        var _Object$getPrototypeO;

        _classCallCheck(this, FindWindow);

        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
        }

        var _this = _possibleConstructorReturn(this, (_Object$getPrototypeO = Object.getPrototypeOf(FindWindow)).call.apply(_Object$getPrototypeO, [this].concat(args)));

        _this.displayName = "FindPaneWindow";
        return _this;
    }

    _createClass(FindWindow, [{
        key: "createdCallback",
        value: function createdCallback() {
            var _this2 = this;

            this.classList.add("find-output-pane");
            this._list = new _outputComponent.OutputElement();
            this.appendChild(this._list);
            this._list.getKey = function (usage) {
                return "quick-fix-" + usage.FileName + "-(" + usage.Line + "-" + usage.Column + ")-(" + usage.EndLine + "-" + usage.EndColumn + ")-(" + usage.Projects.join("-") + ")";
            };
            this._list.handleClick = function (item) {
                _this2.gotoUsage(item);
            };
            this._list.eventName = "usage";
            this._list.elementFactory = getMessageElement;
        }
    }, {
        key: "attachedCallback",
        value: function attachedCallback() {
            this._list.attached();
        }
    }, {
        key: "detachedCallback",
        value: function detachedCallback() {
            this._list.detached();
        }
    }, {
        key: "update",
        value: function update(output) {
            this._list.updateOutput(output);
        }
    }, {
        key: "next",
        value: function next() {
            this._list.next();
        }
    }, {
        key: "prev",
        value: function prev() {
            this._list.prev();
        }
    }, {
        key: "gotoUsage",
        value: function gotoUsage(quickfix) {
            _omni.Omni.navigateTo(quickfix);
        }
    }, {
        key: "selectedIndex",
        get: function get() {
            return this._list.selectedIndex;
        },
        set: function set(value) {
            this._list.selectedIndex = value;
        }
    }, {
        key: "current",
        get: function get() {
            return this._list.current;
        }
    }]);

    return FindWindow;
}(HTMLDivElement);

exports.FindWindow = document.registerElement("omnisharp-find-window", { prototype: FindWindow.prototype });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy9maW5kLXBhbmUtdmlldy5qcyIsImxpYi92aWV3cy9maW5kLXBhbmUtdmlldy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7QUFDQTs7SUNFWSxJOztBRERaOztBQUNBOzs7Ozs7Ozs7O0FDTUEsSUFBTSxvQkFBcUIsWUFBQTtBQUN2QixRQUFNLGdCQUFnQjtBQUNsQixhQUFLLFNBQUEsUUFBQSxHQUFBO0FBQXNCLG1CQUFPLEtBQUssU0FBTCxDQUFlLFFBQWYsQ0FBd0IsVUFBeEIsQ0FBUDtBQUE2QyxTQUR0RDtBQUVsQixhQUFLLFNBQUEsUUFBQSxDQUFrQixLQUFsQixFQUFnQztBQUFJLGdCQUFJLEtBQUosRUFBVyxLQUFLLFNBQUwsQ0FBZSxHQUFmLENBQW1CLFVBQW5CLEVBQVgsS0FBZ0QsS0FBSyxTQUFMLENBQWUsTUFBZixDQUFzQixVQUF0QjtBQUFvQztBQUYzRyxLQUF0QjtBQUtBLFFBQU0sV0FBVztBQUNiLGFBQUssU0FBQSxHQUFBLEdBQUE7QUFBaUIsbUJBQU8sS0FBSyxJQUFaO0FBQW1CO0FBRDVCLEtBQWpCO0FBSUEsUUFBTSxjQUFjO0FBQ2hCLGFBQUssU0FBQSxNQUFBLEdBQUE7QUFBb0IsbUJBQU8sS0FBSyxPQUFaO0FBQXNCLFNBRC9CO0FBRWhCLGFBQUssU0FBQSxNQUFBLENBQWdCLEtBQWhCLEVBQThCO0FBQy9CLGdCQUFJLENBQUMsS0FBSyxPQUFOLElBQWlCLEtBQXJCLEVBQTRCO0FBQ3hCLHFCQUFLLEtBQUwsQ0FBVyxPQUFYO0FBQ0g7QUFDRCxpQkFBSyxPQUFMLEdBQWUsS0FBZjtBQUNIO0FBUGUsS0FBcEI7QUFVQSxhQUFBLFVBQUEsQ0FBb0IsR0FBcEIsRUFBaUMsSUFBakMsRUFBZ0U7QUFDNUQsYUFBSyxJQUFMLEdBQVksR0FBWjtBQUNBLGFBQUssT0FBTCxHQUFlLEtBQWY7QUFFQSxhQUFLLFNBQUwsQ0FBZSxHQUFmLENBQW1CLEtBQUssUUFBeEI7QUFDQSxhQUFLLE1B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LE0sRUFBeUI7QUFDbkMsaUJBQUssS0FBTCxDQUFXLFlBQVgsQ0FBd0IsTUFBeEI7QUFDSDs7OytCQUVVO0FBQ1AsaUJBQUssS0FBTCxDQUFXLElBQVg7QUFDSDs7OytCQUVVO0FBQ1AsaUJBQUssS0FBTCxDQUFXLElBQVg7QUFDSDs7O2tDQU1pQixRLEVBQXlCO0FBQ3ZDLHVCQUFLLFVBQUwsQ0FBZ0IsUUFBaEI7QUFDSDs7OzRCQU51QjtBQUFLLG1CQUFPLEtBQUssS0FBTCxDQUFXLGFBQWxCO0FBQWtDLFM7MEJBQ3RDLEssRUFBSztBQUFJLGlCQUFLLEtBQUwsQ0FBVyxhQUFYLEdBQTJCLEtBQTNCO0FBQW1DOzs7NEJBQ25EO0FBQUssbUJBQU8sS0FBSyxLQUFMLENBQVcsT0FBbEI7QUFBNEI7Ozs7RUF4Q3ZCLGM7O0FBK0MxQixRQUFTLFVBQVQsR0FBNEIsU0FBVSxlQUFWLENBQTBCLHVCQUExQixFQUFtRCxFQUFFLFdBQVcsV0FBVyxTQUF4QixFQUFuRCxDQUE1QiIsImZpbGUiOiJsaWIvdmlld3MvZmluZC1wYW5lLXZpZXcuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBPbW5pIH0gZnJvbSBcIi4uL3NlcnZlci9vbW5pXCI7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgeyBPdXRwdXRFbGVtZW50IH0gZnJvbSBcIi4vb3V0cHV0LWNvbXBvbmVudFwiO1xuaW1wb3J0IHsgSGlnaGxpZ2h0RWxlbWVudCB9IGZyb20gXCIuL2hpZ2hsaWdodC1lbGVtZW50XCI7XG5jb25zdCBnZXRNZXNzYWdlRWxlbWVudCA9IChmdW5jdGlvbiAoKSB7XG4gICAgY29uc3Qgc2VsZWN0ZWRQcm9wcyA9IHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiBzZWxlY3RlZCgpIHsgcmV0dXJuIHRoaXMuY2xhc3NMaXN0LmNvbnRhaW5zKFwic2VsZWN0ZWRcIik7IH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gc2VsZWN0ZWQodmFsdWUpIHsgaWYgKHZhbHVlKVxuICAgICAgICAgICAgdGhpcy5jbGFzc0xpc3QuYWRkKFwic2VsZWN0ZWRcIik7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHRoaXMuY2xhc3NMaXN0LnJlbW92ZShcInNlbGVjdGVkXCIpOyB9XG4gICAgfTtcbiAgICBjb25zdCBrZXlQcm9wcyA9IHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiBrZXkoKSB7IHJldHVybiB0aGlzLl9rZXk7IH1cbiAgICB9O1xuICAgIGNvbnN0IGludmlld1Byb3BzID0ge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uIGludmlldygpIHsgcmV0dXJuIHRoaXMuX2ludmlldzsgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiBpbnZpZXcodmFsdWUpIHtcbiAgICAgICAgICAgIGlmICghdGhpcy5faW52aWV3ICYmIHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fdGV4dC5lbmhhbmNlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9pbnZpZXcgPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgZnVuY3Rpb24gc2V0TWVzc2FnZShrZXksIGl0ZW0pIHtcbiAgICAgICAgdGhpcy5fa2V5ID0ga2V5O1xuICAgICAgICB0aGlzLl9pbnZpZXcgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5jbGFzc0xpc3QuYWRkKGl0ZW0uTG9nTGV2ZWwpO1xuICAgICAgICB0aGlzLl91c2FnZSA9IGl0ZW07XG4gICAgICAgIHRoaXMuX3RleHQudXNhZ2UgPSBpdGVtO1xuICAgICAgICB0aGlzLl9sb2NhdGlvbi5pbm5lclRleHQgPSBgJHtwYXRoLmJhc2VuYW1lKGl0ZW0uRmlsZU5hbWUpfSgke2l0ZW0uTGluZX0sJHtpdGVtLkNvbHVtbn0pYDtcbiAgICAgICAgdGhpcy5fZmlsZW5hbWUuaW5uZXJUZXh0ID0gcGF0aC5kaXJuYW1lKGl0ZW0uRmlsZU5hbWUpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBhdHRhY2hlZCgpIHtcbiAgICAgICAgdGhpcy5fdGV4dC51c2FnZSA9IHRoaXMuX3VzYWdlO1xuICAgIH1cbiAgICBmdW5jdGlvbiBkZXRhY2hlZCgpIHsgdGhpcy5faW52aWV3ID0gZmFsc2U7IH1cbiAgICByZXR1cm4gZnVuY3Rpb24gZ2V0TWVzc2FnZUVsZW1lbnQoKSB7XG4gICAgICAgIGNvbnN0IGVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwibGlcIik7XG4gICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZChcImZpbmQtdXNhZ2VzXCIpO1xuICAgICAgICBjb25zdCB0ZXh0ID0gZWxlbWVudC5fdGV4dCA9IG5ldyBIaWdobGlnaHRFbGVtZW50KCk7XG4gICAgICAgIHRleHQuY2xhc3NMaXN0LmFkZChcInRleHQtaGlnaGxpZ2h0XCIpO1xuICAgICAgICBlbGVtZW50LmFwcGVuZENoaWxkKHRleHQpO1xuICAgICAgICBjb25zdCBsb2NhdGlvbiA9IGVsZW1lbnQuX2xvY2F0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInByZVwiKTtcbiAgICAgICAgbG9jYXRpb24uY2xhc3NMaXN0LmFkZChcImlubGluZS1ibG9ja1wiKTtcbiAgICAgICAgZWxlbWVudC5hcHBlbmRDaGlsZChsb2NhdGlvbik7XG4gICAgICAgIGNvbnN0IGZpbGVuYW1lID0gZWxlbWVudC5fZmlsZW5hbWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwicHJlXCIpO1xuICAgICAgICBmaWxlbmFtZS5jbGFzc0xpc3QuYWRkKFwidGV4dC1zdWJ0bGVcIiwgXCJpbmxpbmUtYmxvY2tcIik7XG4gICAgICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQoZmlsZW5hbWUpO1xuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZWxlbWVudCwgXCJrZXlcIiwga2V5UHJvcHMpO1xuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZWxlbWVudCwgXCJzZWxlY3RlZFwiLCBzZWxlY3RlZFByb3BzKTtcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGVsZW1lbnQsIFwiaW52aWV3XCIsIGludmlld1Byb3BzKTtcbiAgICAgICAgZWxlbWVudC5zZXRNZXNzYWdlID0gc2V0TWVzc2FnZTtcbiAgICAgICAgZWxlbWVudC5hdHRhY2hlZCA9IGF0dGFjaGVkO1xuICAgICAgICBlbGVtZW50LmRldGFjaGVkID0gZGV0YWNoZWQ7XG4gICAgICAgIHJldHVybiBlbGVtZW50O1xuICAgIH07XG59KSgpO1xuZXhwb3J0IGNsYXNzIEZpbmRXaW5kb3cgZXh0ZW5kcyBIVE1MRGl2RWxlbWVudCB7XG4gICAgY29uc3RydWN0b3IoLi4uYXJncykge1xuICAgICAgICBzdXBlciguLi5hcmdzKTtcbiAgICAgICAgdGhpcy5kaXNwbGF5TmFtZSA9IFwiRmluZFBhbmVXaW5kb3dcIjtcbiAgICB9XG4gICAgY3JlYXRlZENhbGxiYWNrKCkge1xuICAgICAgICB0aGlzLmNsYXNzTGlzdC5hZGQoXCJmaW5kLW91dHB1dC1wYW5lXCIpO1xuICAgICAgICB0aGlzLl9saXN0ID0gbmV3IE91dHB1dEVsZW1lbnQoKTtcbiAgICAgICAgdGhpcy5hcHBlbmRDaGlsZCh0aGlzLl9saXN0KTtcbiAgICAgICAgdGhpcy5fbGlzdC5nZXRLZXkgPSAodXNhZ2UpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBgcXVpY2stZml4LSR7dXNhZ2UuRmlsZU5hbWV9LSgke3VzYWdlLkxpbmV9LSR7dXNhZ2UuQ29sdW1ufSktKCR7dXNhZ2UuRW5kTGluZX0tJHt1c2FnZS5FbmRDb2x1bW59KS0oJHt1c2FnZS5Qcm9qZWN0cy5qb2luKFwiLVwiKX0pYDtcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5fbGlzdC5oYW5kbGVDbGljayA9IChpdGVtKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmdvdG9Vc2FnZShpdGVtKTtcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5fbGlzdC5ldmVudE5hbWUgPSBcInVzYWdlXCI7XG4gICAgICAgIHRoaXMuX2xpc3QuZWxlbWVudEZhY3RvcnkgPSBnZXRNZXNzYWdlRWxlbWVudDtcbiAgICB9XG4gICAgYXR0YWNoZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdGhpcy5fbGlzdC5hdHRhY2hlZCgpO1xuICAgIH1cbiAgICBkZXRhY2hlZENhbGxiYWNrKCkge1xuICAgICAgICB0aGlzLl9saXN0LmRldGFjaGVkKCk7XG4gICAgfVxuICAgIHVwZGF0ZShvdXRwdXQpIHtcbiAgICAgICAgdGhpcy5fbGlzdC51cGRhdGVPdXRwdXQob3V0cHV0KTtcbiAgICB9XG4gICAgbmV4dCgpIHtcbiAgICAgICAgdGhpcy5fbGlzdC5uZXh0KCk7XG4gICAgfVxuICAgIHByZXYoKSB7XG4gICAgICAgIHRoaXMuX2xpc3QucHJldigpO1xuICAgIH1cbiAgICBnZXQgc2VsZWN0ZWRJbmRleCgpIHsgcmV0dXJuIHRoaXMuX2xpc3Quc2VsZWN0ZWRJbmRleDsgfVxuICAgIHNldCBzZWxlY3RlZEluZGV4KHZhbHVlKSB7IHRoaXMuX2xpc3Quc2VsZWN0ZWRJbmRleCA9IHZhbHVlOyB9XG4gICAgZ2V0IGN1cnJlbnQoKSB7IHJldHVybiB0aGlzLl9saXN0LmN1cnJlbnQ7IH1cbiAgICBnb3RvVXNhZ2UocXVpY2tmaXgpIHtcbiAgICAgICAgT21uaS5uYXZpZ2F0ZVRvKHF1aWNrZml4KTtcbiAgICB9XG59XG5leHBvcnRzLkZpbmRXaW5kb3cgPSBkb2N1bWVudC5yZWdpc3RlckVsZW1lbnQoXCJvbW5pc2hhcnAtZmluZC13aW5kb3dcIiwgeyBwcm90b3R5cGU6IEZpbmRXaW5kb3cucHJvdG90eXBlIH0pO1xuIiwiLyogdHNsaW50OmRpc2FibGU6bm8tc3RyaW5nLWxpdGVyYWwgKi9cclxuaW1wb3J0IHtNb2RlbHN9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XHJcbmltcG9ydCB7T21uaX0gZnJvbSBcIi4uL3NlcnZlci9vbW5pXCI7XHJcbmltcG9ydCAqIGFzIHBhdGggZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0IHtPdXRwdXRFbGVtZW50LCBNZXNzYWdlRWxlbWVudH0gZnJvbSBcIi4vb3V0cHV0LWNvbXBvbmVudFwiO1xyXG5pbXBvcnQge0hpZ2hsaWdodEVsZW1lbnR9IGZyb20gXCIuL2hpZ2hsaWdodC1lbGVtZW50XCI7XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEZpbmRNZXNzYWdlRWxlbWVudCBleHRlbmRzIE1lc3NhZ2VFbGVtZW50PE1vZGVscy5EaWFnbm9zdGljTG9jYXRpb24+IHsgfVxyXG5cclxuY29uc3QgZ2V0TWVzc2FnZUVsZW1lbnQgPSAoZnVuY3Rpb24oKSB7XHJcbiAgICBjb25zdCBzZWxlY3RlZFByb3BzID0ge1xyXG4gICAgICAgIGdldDogZnVuY3Rpb24gc2VsZWN0ZWQoKSB7IHJldHVybiB0aGlzLmNsYXNzTGlzdC5jb250YWlucyhcInNlbGVjdGVkXCIpOyB9LFxyXG4gICAgICAgIHNldDogZnVuY3Rpb24gc2VsZWN0ZWQodmFsdWU6IGJvb2xlYW4pIHsgaWYgKHZhbHVlKSB0aGlzLmNsYXNzTGlzdC5hZGQoXCJzZWxlY3RlZFwiKTsgZWxzZSB0aGlzLmNsYXNzTGlzdC5yZW1vdmUoXCJzZWxlY3RlZFwiKTsgfVxyXG4gICAgfTtcclxuXHJcbiAgICBjb25zdCBrZXlQcm9wcyA9IHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uIGtleSgpIHsgcmV0dXJuIHRoaXMuX2tleTsgfVxyXG4gICAgfTtcclxuXHJcbiAgICBjb25zdCBpbnZpZXdQcm9wcyA9IHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uIGludmlldygpIHsgcmV0dXJuIHRoaXMuX2ludmlldzsgfSxcclxuICAgICAgICBzZXQ6IGZ1bmN0aW9uIGludmlldyh2YWx1ZTogYm9vbGVhbikge1xyXG4gICAgICAgICAgICBpZiAoIXRoaXMuX2ludmlldyAmJiB2YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fdGV4dC5lbmhhbmNlKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5faW52aWV3ID0gdmFsdWU7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBmdW5jdGlvbiBzZXRNZXNzYWdlKGtleTogc3RyaW5nLCBpdGVtOiBNb2RlbHMuRGlhZ25vc3RpY0xvY2F0aW9uKSB7XHJcbiAgICAgICAgdGhpcy5fa2V5ID0ga2V5O1xyXG4gICAgICAgIHRoaXMuX2ludmlldyA9IGZhbHNlO1xyXG5cclxuICAgICAgICB0aGlzLmNsYXNzTGlzdC5hZGQoaXRlbS5Mb2dMZXZlbCk7XHJcbiAgICAgICAgdGhpcy5fdXNhZ2UgPSBpdGVtO1xyXG4gICAgICAgIHRoaXMuX3RleHQudXNhZ2UgPSBpdGVtO1xyXG4gICAgICAgIHRoaXMuX2xvY2F0aW9uLmlubmVyVGV4dCA9IGAke3BhdGguYmFzZW5hbWUoaXRlbS5GaWxlTmFtZSl9KCR7aXRlbS5MaW5lfSwke2l0ZW0uQ29sdW1ufSlgO1xyXG4gICAgICAgIHRoaXMuX2ZpbGVuYW1lLmlubmVyVGV4dCA9IHBhdGguZGlybmFtZShpdGVtLkZpbGVOYW1lKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBhdHRhY2hlZCgpIHtcclxuICAgICAgICB0aGlzLl90ZXh0LnVzYWdlID0gdGhpcy5fdXNhZ2U7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZGV0YWNoZWQoKSB7IHRoaXMuX2ludmlldyA9IGZhbHNlOyB9XHJcblxyXG4gICAgcmV0dXJuIGZ1bmN0aW9uIGdldE1lc3NhZ2VFbGVtZW50KCk6IEZpbmRNZXNzYWdlRWxlbWVudCB7XHJcbiAgICAgICAgY29uc3QgZWxlbWVudDogRmluZE1lc3NhZ2VFbGVtZW50ID0gPGFueT5kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwibGlcIik7XHJcbiAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkKFwiZmluZC11c2FnZXNcIik7XHJcblxyXG4gICAgICAgIGNvbnN0IHRleHQgPSAoZWxlbWVudCBhcyBhbnkpLl90ZXh0ID0gbmV3IEhpZ2hsaWdodEVsZW1lbnQoKTtcclxuICAgICAgICB0ZXh0LmNsYXNzTGlzdC5hZGQoXCJ0ZXh0LWhpZ2hsaWdodFwiKTtcclxuICAgICAgICBlbGVtZW50LmFwcGVuZENoaWxkKHRleHQpO1xyXG5cclxuICAgICAgICBjb25zdCBsb2NhdGlvbiA9IChlbGVtZW50IGFzIGFueSkuX2xvY2F0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInByZVwiKTtcclxuICAgICAgICBsb2NhdGlvbi5jbGFzc0xpc3QuYWRkKFwiaW5saW5lLWJsb2NrXCIpO1xyXG4gICAgICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQobG9jYXRpb24pO1xyXG5cclxuICAgICAgICBjb25zdCBmaWxlbmFtZSA9IChlbGVtZW50IGFzIGFueSkuX2ZpbGVuYW1lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInByZVwiKTtcclxuICAgICAgICBmaWxlbmFtZS5jbGFzc0xpc3QuYWRkKFwidGV4dC1zdWJ0bGVcIiwgXCJpbmxpbmUtYmxvY2tcIik7XHJcbiAgICAgICAgZWxlbWVudC5hcHBlbmRDaGlsZChmaWxlbmFtZSk7XHJcblxyXG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShlbGVtZW50LCBcImtleVwiLCBrZXlQcm9wcyk7XHJcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGVsZW1lbnQsIFwic2VsZWN0ZWRcIiwgc2VsZWN0ZWRQcm9wcyk7XHJcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGVsZW1lbnQsIFwiaW52aWV3XCIsIGludmlld1Byb3BzKTtcclxuICAgICAgICBlbGVtZW50LnNldE1lc3NhZ2UgPSBzZXRNZXNzYWdlO1xyXG4gICAgICAgIGVsZW1lbnQuYXR0YWNoZWQgPSBhdHRhY2hlZDtcclxuICAgICAgICBlbGVtZW50LmRldGFjaGVkID0gZGV0YWNoZWQ7XHJcblxyXG4gICAgICAgIHJldHVybiBlbGVtZW50O1xyXG4gICAgfTtcclxufSkoKTtcclxuXHJcbmV4cG9ydCBjbGFzcyBGaW5kV2luZG93IGV4dGVuZHMgSFRNTERpdkVsZW1lbnQgaW1wbGVtZW50cyBXZWJDb21wb25lbnQge1xyXG4gICAgcHVibGljIGRpc3BsYXlOYW1lID0gXCJGaW5kUGFuZVdpbmRvd1wiO1xyXG4gICAgcHJpdmF0ZSBfbGlzdDogT3V0cHV0RWxlbWVudDxNb2RlbHMuUXVpY2tGaXgsIEZpbmRNZXNzYWdlRWxlbWVudD47XHJcblxyXG4gICAgcHVibGljIGNyZWF0ZWRDYWxsYmFjaygpIHtcclxuICAgICAgICB0aGlzLmNsYXNzTGlzdC5hZGQoXCJmaW5kLW91dHB1dC1wYW5lXCIpO1xyXG4gICAgICAgIHRoaXMuX2xpc3QgPSBuZXcgT3V0cHV0RWxlbWVudDxNb2RlbHMuUXVpY2tGaXgsIEZpbmRNZXNzYWdlRWxlbWVudD4oKTtcclxuICAgICAgICB0aGlzLmFwcGVuZENoaWxkKHRoaXMuX2xpc3QpO1xyXG4gICAgICAgIHRoaXMuX2xpc3QuZ2V0S2V5ID0gKHVzYWdlOiBNb2RlbHMuUXVpY2tGaXgpID0+IHtcclxuICAgICAgICAgICAgcmV0dXJuIGBxdWljay1maXgtJHt1c2FnZS5GaWxlTmFtZX0tKCR7dXNhZ2UuTGluZX0tJHt1c2FnZS5Db2x1bW59KS0oJHt1c2FnZS5FbmRMaW5lfS0ke3VzYWdlLkVuZENvbHVtbn0pLSgke3VzYWdlLlByb2plY3RzLmpvaW4oXCItXCIpfSlgO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgdGhpcy5fbGlzdC5oYW5kbGVDbGljayA9IChpdGVtOiBNb2RlbHMuUXVpY2tGaXgpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5nb3RvVXNhZ2UoaXRlbSk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICB0aGlzLl9saXN0LmV2ZW50TmFtZSA9IFwidXNhZ2VcIjtcclxuICAgICAgICB0aGlzLl9saXN0LmVsZW1lbnRGYWN0b3J5ID0gZ2V0TWVzc2FnZUVsZW1lbnQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGF0dGFjaGVkQ2FsbGJhY2soKSB7XHJcbiAgICAgICAgdGhpcy5fbGlzdC5hdHRhY2hlZCgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkZXRhY2hlZENhbGxiYWNrKCkge1xyXG4gICAgICAgIHRoaXMuX2xpc3QuZGV0YWNoZWQoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgdXBkYXRlKG91dHB1dDogTW9kZWxzLlF1aWNrRml4W10pIHtcclxuICAgICAgICB0aGlzLl9saXN0LnVwZGF0ZU91dHB1dChvdXRwdXQpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBuZXh0KCkge1xyXG4gICAgICAgIHRoaXMuX2xpc3QubmV4dCgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBwcmV2KCkge1xyXG4gICAgICAgIHRoaXMuX2xpc3QucHJldigpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgc2VsZWN0ZWRJbmRleCgpIHsgcmV0dXJuIHRoaXMuX2xpc3Quc2VsZWN0ZWRJbmRleDsgfVxyXG4gICAgcHVibGljIHNldCBzZWxlY3RlZEluZGV4KHZhbHVlKSB7IHRoaXMuX2xpc3Quc2VsZWN0ZWRJbmRleCA9IHZhbHVlOyB9XHJcbiAgICBwdWJsaWMgZ2V0IGN1cnJlbnQoKSB7IHJldHVybiB0aGlzLl9saXN0LmN1cnJlbnQ7IH1cclxuXHJcbiAgICBwcml2YXRlIGdvdG9Vc2FnZShxdWlja2ZpeDogTW9kZWxzLlF1aWNrRml4KSB7XHJcbiAgICAgICAgT21uaS5uYXZpZ2F0ZVRvKHF1aWNrZml4KTtcclxuICAgIH1cclxufVxyXG5cclxuKDxhbnk+ZXhwb3J0cykuRmluZFdpbmRvdyA9ICg8YW55PmRvY3VtZW50KS5yZWdpc3RlckVsZW1lbnQoXCJvbW5pc2hhcnAtZmluZC13aW5kb3dcIiwgeyBwcm90b3R5cGU6IEZpbmRXaW5kb3cucHJvdG90eXBlIH0pO1xyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
