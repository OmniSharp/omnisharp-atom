'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.FindWindow = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _path = require('path');

var path = _interopRequireWildcard(_path);

var _omni = require('../server/omni');

var _highlightElement = require('./highlight-element');

var _outputComponent = require('./output-component');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var getMessageElement = function () {
    var selectedProps = {
        get: function selected() {
            return this.classList.contains('selected');
        },
        set: function selected(value) {
            if (value) this.classList.add('selected');else this.classList.remove('selected');
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
        this._location.innerText = path.basename(item.FileName) + '(' + item.Line + ',' + item.Column + ')';
        this._filename.innerText = path.dirname(item.FileName);
    }
    function attached() {
        this._text.usage = this._usage;
    }
    function detached() {
        this._inview = false;
    }
    return function getMessageElement() {
        var element = document.createElement('li');
        element.classList.add('find-usages');
        var text = element._text = new _highlightElement.HighlightElement();
        text.classList.add('text-highlight');
        element.appendChild(text);
        var location = element._location = document.createElement('pre');
        location.classList.add('inline-block');
        element.appendChild(location);
        var filename = element._filename = document.createElement('pre');
        filename.classList.add('text-subtle', 'inline-block');
        element.appendChild(filename);
        Object.defineProperty(element, 'key', keyProps);
        Object.defineProperty(element, 'selected', selectedProps);
        Object.defineProperty(element, 'inview', inviewProps);
        element.setMessage = setMessage;
        element.attached = attached;
        element.detached = detached;
        return element;
    };
}();

var FindWindow = exports.FindWindow = function (_HTMLDivElement) {
    _inherits(FindWindow, _HTMLDivElement);

    function FindWindow() {
        _classCallCheck(this, FindWindow);

        var _this = _possibleConstructorReturn(this, (FindWindow.__proto__ || Object.getPrototypeOf(FindWindow)).apply(this, arguments));

        _this.displayName = 'FindPaneWindow';
        return _this;
    }

    _createClass(FindWindow, [{
        key: 'createdCallback',
        value: function createdCallback() {
            var _this2 = this;

            this.classList.add('find-output-pane');
            this._list = new _outputComponent.OutputElement();
            this.appendChild(this._list);
            this._list.getKey = function (usage) {
                return 'quick-fix-' + usage.FileName + '-(' + usage.Line + '-' + usage.Column + ')-(' + usage.EndLine + '-' + usage.EndColumn + ')-(' + usage.Projects.join('-') + ')';
            };
            this._list.handleClick = function (item) {
                _this2.gotoUsage(item);
            };
            this._list.eventName = 'usage';
            this._list.elementFactory = getMessageElement;
        }
    }, {
        key: 'attachedCallback',
        value: function attachedCallback() {
            this._list.attached();
        }
    }, {
        key: 'detachedCallback',
        value: function detachedCallback() {
            this._list.detached();
        }
    }, {
        key: 'update',
        value: function update(output) {
            this._list.updateOutput(output);
        }
    }, {
        key: 'next',
        value: function next() {
            this._list.next();
        }
    }, {
        key: 'prev',
        value: function prev() {
            this._list.prev();
        }
    }, {
        key: 'gotoUsage',
        value: function gotoUsage(quickfix) {
            _omni.Omni.navigateTo(quickfix);
        }
    }, {
        key: 'selectedIndex',
        get: function get() {
            return this._list.selectedIndex;
        },
        set: function set(value) {
            this._list.selectedIndex = value;
        }
    }, {
        key: 'current',
        get: function get() {
            return this._list.current;
        }
    }]);

    return FindWindow;
}(HTMLDivElement);

exports.FindWindow = document.registerElement('omnisharp-find-window', { prototype: FindWindow.prototype });
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy9maW5kLXBhbmUtdmlldy50cyIsImxpYi92aWV3cy9maW5kLXBhbmUtdmlldy5qcyJdLCJuYW1lcyI6WyJwYXRoIiwiZ2V0TWVzc2FnZUVsZW1lbnQiLCJzZWxlY3RlZFByb3BzIiwiZ2V0Iiwic2VsZWN0ZWQiLCJjbGFzc0xpc3QiLCJjb250YWlucyIsInNldCIsInZhbHVlIiwiYWRkIiwicmVtb3ZlIiwia2V5UHJvcHMiLCJrZXkiLCJfa2V5IiwiaW52aWV3UHJvcHMiLCJpbnZpZXciLCJfaW52aWV3IiwiX3RleHQiLCJlbmhhbmNlIiwic2V0TWVzc2FnZSIsIml0ZW0iLCJMb2dMZXZlbCIsIl91c2FnZSIsInVzYWdlIiwiX2xvY2F0aW9uIiwiaW5uZXJUZXh0IiwiYmFzZW5hbWUiLCJGaWxlTmFtZSIsIkxpbmUiLCJDb2x1bW4iLCJfZmlsZW5hbWUiLCJkaXJuYW1lIiwiYXR0YWNoZWQiLCJkZXRhY2hlZCIsImVsZW1lbnQiLCJkb2N1bWVudCIsImNyZWF0ZUVsZW1lbnQiLCJ0ZXh0IiwiYXBwZW5kQ2hpbGQiLCJsb2NhdGlvbiIsImZpbGVuYW1lIiwiT2JqZWN0IiwiZGVmaW5lUHJvcGVydHkiLCJGaW5kV2luZG93IiwiYXJndW1lbnRzIiwiZGlzcGxheU5hbWUiLCJfbGlzdCIsImdldEtleSIsIkVuZExpbmUiLCJFbmRDb2x1bW4iLCJQcm9qZWN0cyIsImpvaW4iLCJoYW5kbGVDbGljayIsImdvdG9Vc2FnZSIsImV2ZW50TmFtZSIsImVsZW1lbnRGYWN0b3J5Iiwib3V0cHV0IiwidXBkYXRlT3V0cHV0IiwibmV4dCIsInByZXYiLCJxdWlja2ZpeCIsIm5hdmlnYXRlVG8iLCJzZWxlY3RlZEluZGV4IiwiY3VycmVudCIsIkhUTUxEaXZFbGVtZW50IiwiZXhwb3J0cyIsInJlZ2lzdGVyRWxlbWVudCIsInByb3RvdHlwZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBRUE7O0lBQVlBLEk7O0FBQ1o7O0FBQ0E7O0FBQ0E7Ozs7Ozs7Ozs7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OzsrQkFFYXVCLE0sRUFBeUI7QUFDbkMsaUJBQUtWLEtBQUwsQ0FBV1csWUFBWCxDQUF3QkQsTUFBeEI7QUFDSDs7OytCQUVVO0FBQ1AsaUJBQUtWLEtBQUwsQ0FBV1ksSUFBWDtBQUNIOzs7K0JBRVU7QUFDUCxpQkFBS1osS0FBTCxDQUFXYSxJQUFYO0FBQ0g7OztrQ0FNaUJDLFEsRUFBeUI7QUFDdkMsdUJBQUtDLFVBQUwsQ0FBZ0JELFFBQWhCO0FBQ0g7Ozs0QkFOdUI7QUFBSyxtQkFBTyxLQUFLZCxLQUFMLENBQVdnQixhQUFsQjtBQUFrQyxTOzBCQUN0Q3RELEssRUFBSztBQUFJLGlCQUFLc0MsS0FBTCxDQUFXZ0IsYUFBWCxHQUEyQnRELEtBQTNCO0FBQW1DOzs7NEJBQ25EO0FBQUssbUJBQU8sS0FBS3NDLEtBQUwsQ0FBV2lCLE9BQWxCO0FBQTRCOzs7O0VBeEN2QkMsYzs7QUErQzFCQyxRQUFTdEIsVUFBVCxHQUE0QlIsU0FBVStCLGVBQVYsQ0FBMEIsdUJBQTFCLEVBQW1ELEVBQUVDLFdBQVd4QixXQUFXd0IsU0FBeEIsRUFBbkQsQ0FBNUIiLCJmaWxlIjoibGliL3ZpZXdzL2ZpbmQtcGFuZS12aWV3LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogdHNsaW50OmRpc2FibGU6bm8tc3RyaW5nLWxpdGVyYWwgKi9cclxuaW1wb3J0IHtNb2RlbHN9IGZyb20gJ29tbmlzaGFycC1jbGllbnQnO1xyXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQge09tbml9IGZyb20gJy4uL3NlcnZlci9vbW5pJztcclxuaW1wb3J0IHtIaWdobGlnaHRFbGVtZW50fSBmcm9tICcuL2hpZ2hsaWdodC1lbGVtZW50JztcclxuaW1wb3J0IHtNZXNzYWdlRWxlbWVudCwgT3V0cHV0RWxlbWVudH0gZnJvbSAnLi9vdXRwdXQtY29tcG9uZW50JztcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgRmluZE1lc3NhZ2VFbGVtZW50IGV4dGVuZHMgTWVzc2FnZUVsZW1lbnQ8TW9kZWxzLkRpYWdub3N0aWNMb2NhdGlvbj4geyB9XHJcblxyXG5jb25zdCBnZXRNZXNzYWdlRWxlbWVudCA9IChmdW5jdGlvbiAoKSB7XHJcbiAgICBjb25zdCBzZWxlY3RlZFByb3BzID0ge1xyXG4gICAgICAgIGdldDogZnVuY3Rpb24gc2VsZWN0ZWQoKSB7IHJldHVybiB0aGlzLmNsYXNzTGlzdC5jb250YWlucygnc2VsZWN0ZWQnKTsgfSxcclxuICAgICAgICBzZXQ6IGZ1bmN0aW9uIHNlbGVjdGVkKHZhbHVlOiBib29sZWFuKSB7IGlmICh2YWx1ZSkgdGhpcy5jbGFzc0xpc3QuYWRkKCdzZWxlY3RlZCcpOyBlbHNlIHRoaXMuY2xhc3NMaXN0LnJlbW92ZSgnc2VsZWN0ZWQnKTsgfVxyXG4gICAgfTtcclxuXHJcbiAgICBjb25zdCBrZXlQcm9wcyA9IHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uIGtleSgpIHsgcmV0dXJuIHRoaXMuX2tleTsgfVxyXG4gICAgfTtcclxuXHJcbiAgICBjb25zdCBpbnZpZXdQcm9wcyA9IHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uIGludmlldygpIHsgcmV0dXJuIHRoaXMuX2ludmlldzsgfSxcclxuICAgICAgICBzZXQ6IGZ1bmN0aW9uIGludmlldyh2YWx1ZTogYm9vbGVhbikge1xyXG4gICAgICAgICAgICBpZiAoIXRoaXMuX2ludmlldyAmJiB2YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fdGV4dC5lbmhhbmNlKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5faW52aWV3ID0gdmFsdWU7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBmdW5jdGlvbiBzZXRNZXNzYWdlKGtleTogc3RyaW5nLCBpdGVtOiBNb2RlbHMuRGlhZ25vc3RpY0xvY2F0aW9uKSB7XHJcbiAgICAgICAgdGhpcy5fa2V5ID0ga2V5O1xyXG4gICAgICAgIHRoaXMuX2ludmlldyA9IGZhbHNlO1xyXG5cclxuICAgICAgICB0aGlzLmNsYXNzTGlzdC5hZGQoaXRlbS5Mb2dMZXZlbCk7XHJcbiAgICAgICAgdGhpcy5fdXNhZ2UgPSBpdGVtO1xyXG4gICAgICAgIHRoaXMuX3RleHQudXNhZ2UgPSBpdGVtO1xyXG4gICAgICAgIHRoaXMuX2xvY2F0aW9uLmlubmVyVGV4dCA9IGAke3BhdGguYmFzZW5hbWUoaXRlbS5GaWxlTmFtZSl9KCR7aXRlbS5MaW5lfSwke2l0ZW0uQ29sdW1ufSlgO1xyXG4gICAgICAgIHRoaXMuX2ZpbGVuYW1lLmlubmVyVGV4dCA9IHBhdGguZGlybmFtZShpdGVtLkZpbGVOYW1lKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBhdHRhY2hlZCgpIHtcclxuICAgICAgICB0aGlzLl90ZXh0LnVzYWdlID0gdGhpcy5fdXNhZ2U7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZGV0YWNoZWQoKSB7IHRoaXMuX2ludmlldyA9IGZhbHNlOyB9XHJcblxyXG4gICAgcmV0dXJuIGZ1bmN0aW9uIGdldE1lc3NhZ2VFbGVtZW50KCk6IEZpbmRNZXNzYWdlRWxlbWVudCB7XHJcbiAgICAgICAgY29uc3QgZWxlbWVudDogRmluZE1lc3NhZ2VFbGVtZW50ID0gPGFueT5kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xyXG4gICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZCgnZmluZC11c2FnZXMnKTtcclxuXHJcbiAgICAgICAgY29uc3QgdGV4dCA9IChlbGVtZW50IGFzIGFueSkuX3RleHQgPSBuZXcgSGlnaGxpZ2h0RWxlbWVudCgpO1xyXG4gICAgICAgIHRleHQuY2xhc3NMaXN0LmFkZCgndGV4dC1oaWdobGlnaHQnKTtcclxuICAgICAgICBlbGVtZW50LmFwcGVuZENoaWxkKHRleHQpO1xyXG5cclxuICAgICAgICBjb25zdCBsb2NhdGlvbiA9IChlbGVtZW50IGFzIGFueSkuX2xvY2F0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncHJlJyk7XHJcbiAgICAgICAgbG9jYXRpb24uY2xhc3NMaXN0LmFkZCgnaW5saW5lLWJsb2NrJyk7XHJcbiAgICAgICAgZWxlbWVudC5hcHBlbmRDaGlsZChsb2NhdGlvbik7XHJcblxyXG4gICAgICAgIGNvbnN0IGZpbGVuYW1lID0gKGVsZW1lbnQgYXMgYW55KS5fZmlsZW5hbWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwcmUnKTtcclxuICAgICAgICBmaWxlbmFtZS5jbGFzc0xpc3QuYWRkKCd0ZXh0LXN1YnRsZScsICdpbmxpbmUtYmxvY2snKTtcclxuICAgICAgICBlbGVtZW50LmFwcGVuZENoaWxkKGZpbGVuYW1lKTtcclxuXHJcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGVsZW1lbnQsICdrZXknLCBrZXlQcm9wcyk7XHJcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGVsZW1lbnQsICdzZWxlY3RlZCcsIHNlbGVjdGVkUHJvcHMpO1xyXG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShlbGVtZW50LCAnaW52aWV3JywgaW52aWV3UHJvcHMpO1xyXG4gICAgICAgIGVsZW1lbnQuc2V0TWVzc2FnZSA9IHNldE1lc3NhZ2U7XHJcbiAgICAgICAgZWxlbWVudC5hdHRhY2hlZCA9IGF0dGFjaGVkO1xyXG4gICAgICAgIGVsZW1lbnQuZGV0YWNoZWQgPSBkZXRhY2hlZDtcclxuXHJcbiAgICAgICAgcmV0dXJuIGVsZW1lbnQ7XHJcbiAgICB9O1xyXG59KSgpO1xyXG5cclxuZXhwb3J0IGNsYXNzIEZpbmRXaW5kb3cgZXh0ZW5kcyBIVE1MRGl2RWxlbWVudCBpbXBsZW1lbnRzIFdlYkNvbXBvbmVudCB7XHJcbiAgICBwdWJsaWMgZGlzcGxheU5hbWUgPSAnRmluZFBhbmVXaW5kb3cnO1xyXG4gICAgcHJpdmF0ZSBfbGlzdDogT3V0cHV0RWxlbWVudDxNb2RlbHMuUXVpY2tGaXgsIEZpbmRNZXNzYWdlRWxlbWVudD47XHJcblxyXG4gICAgcHVibGljIGNyZWF0ZWRDYWxsYmFjaygpIHtcclxuICAgICAgICB0aGlzLmNsYXNzTGlzdC5hZGQoJ2ZpbmQtb3V0cHV0LXBhbmUnKTtcclxuICAgICAgICB0aGlzLl9saXN0ID0gbmV3IE91dHB1dEVsZW1lbnQ8TW9kZWxzLlF1aWNrRml4LCBGaW5kTWVzc2FnZUVsZW1lbnQ+KCk7XHJcbiAgICAgICAgdGhpcy5hcHBlbmRDaGlsZCh0aGlzLl9saXN0KTtcclxuICAgICAgICB0aGlzLl9saXN0LmdldEtleSA9ICh1c2FnZTogTW9kZWxzLlF1aWNrRml4KSA9PiB7XHJcbiAgICAgICAgICAgIHJldHVybiBgcXVpY2stZml4LSR7dXNhZ2UuRmlsZU5hbWV9LSgke3VzYWdlLkxpbmV9LSR7dXNhZ2UuQ29sdW1ufSktKCR7dXNhZ2UuRW5kTGluZX0tJHt1c2FnZS5FbmRDb2x1bW59KS0oJHt1c2FnZS5Qcm9qZWN0cy5qb2luKCctJyl9KWA7XHJcbiAgICAgICAgfTtcclxuICAgICAgICB0aGlzLl9saXN0LmhhbmRsZUNsaWNrID0gKGl0ZW06IE1vZGVscy5RdWlja0ZpeCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLmdvdG9Vc2FnZShpdGVtKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHRoaXMuX2xpc3QuZXZlbnROYW1lID0gJ3VzYWdlJztcclxuICAgICAgICB0aGlzLl9saXN0LmVsZW1lbnRGYWN0b3J5ID0gZ2V0TWVzc2FnZUVsZW1lbnQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGF0dGFjaGVkQ2FsbGJhY2soKSB7XHJcbiAgICAgICAgdGhpcy5fbGlzdC5hdHRhY2hlZCgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkZXRhY2hlZENhbGxiYWNrKCkge1xyXG4gICAgICAgIHRoaXMuX2xpc3QuZGV0YWNoZWQoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgdXBkYXRlKG91dHB1dDogTW9kZWxzLlF1aWNrRml4W10pIHtcclxuICAgICAgICB0aGlzLl9saXN0LnVwZGF0ZU91dHB1dChvdXRwdXQpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBuZXh0KCkge1xyXG4gICAgICAgIHRoaXMuX2xpc3QubmV4dCgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBwcmV2KCkge1xyXG4gICAgICAgIHRoaXMuX2xpc3QucHJldigpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgc2VsZWN0ZWRJbmRleCgpIHsgcmV0dXJuIHRoaXMuX2xpc3Quc2VsZWN0ZWRJbmRleDsgfVxyXG4gICAgcHVibGljIHNldCBzZWxlY3RlZEluZGV4KHZhbHVlKSB7IHRoaXMuX2xpc3Quc2VsZWN0ZWRJbmRleCA9IHZhbHVlOyB9XHJcbiAgICBwdWJsaWMgZ2V0IGN1cnJlbnQoKSB7IHJldHVybiB0aGlzLl9saXN0LmN1cnJlbnQ7IH1cclxuXHJcbiAgICBwcml2YXRlIGdvdG9Vc2FnZShxdWlja2ZpeDogTW9kZWxzLlF1aWNrRml4KSB7XHJcbiAgICAgICAgT21uaS5uYXZpZ2F0ZVRvKHF1aWNrZml4KTtcclxuICAgIH1cclxufVxyXG5cclxuKDxhbnk+ZXhwb3J0cykuRmluZFdpbmRvdyA9ICg8YW55PmRvY3VtZW50KS5yZWdpc3RlckVsZW1lbnQoJ29tbmlzaGFycC1maW5kLXdpbmRvdycsIHsgcHJvdG90eXBlOiBGaW5kV2luZG93LnByb3RvdHlwZSB9KTtcclxuIiwiaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7IE9tbmkgfSBmcm9tICcuLi9zZXJ2ZXIvb21uaSc7XG5pbXBvcnQgeyBIaWdobGlnaHRFbGVtZW50IH0gZnJvbSAnLi9oaWdobGlnaHQtZWxlbWVudCc7XG5pbXBvcnQgeyBPdXRwdXRFbGVtZW50IH0gZnJvbSAnLi9vdXRwdXQtY29tcG9uZW50JztcbmNvbnN0IGdldE1lc3NhZ2VFbGVtZW50ID0gKGZ1bmN0aW9uICgpIHtcbiAgICBjb25zdCBzZWxlY3RlZFByb3BzID0ge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uIHNlbGVjdGVkKCkgeyByZXR1cm4gdGhpcy5jbGFzc0xpc3QuY29udGFpbnMoJ3NlbGVjdGVkJyk7IH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gc2VsZWN0ZWQodmFsdWUpIHsgaWYgKHZhbHVlKVxuICAgICAgICAgICAgdGhpcy5jbGFzc0xpc3QuYWRkKCdzZWxlY3RlZCcpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICB0aGlzLmNsYXNzTGlzdC5yZW1vdmUoJ3NlbGVjdGVkJyk7IH1cbiAgICB9O1xuICAgIGNvbnN0IGtleVByb3BzID0ge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uIGtleSgpIHsgcmV0dXJuIHRoaXMuX2tleTsgfVxuICAgIH07XG4gICAgY29uc3QgaW52aWV3UHJvcHMgPSB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gaW52aWV3KCkgeyByZXR1cm4gdGhpcy5faW52aWV3OyB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uIGludmlldyh2YWx1ZSkge1xuICAgICAgICAgICAgaWYgKCF0aGlzLl9pbnZpZXcgJiYgdmFsdWUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl90ZXh0LmVuaGFuY2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX2ludmlldyA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBmdW5jdGlvbiBzZXRNZXNzYWdlKGtleSwgaXRlbSkge1xuICAgICAgICB0aGlzLl9rZXkgPSBrZXk7XG4gICAgICAgIHRoaXMuX2ludmlldyA9IGZhbHNlO1xuICAgICAgICB0aGlzLmNsYXNzTGlzdC5hZGQoaXRlbS5Mb2dMZXZlbCk7XG4gICAgICAgIHRoaXMuX3VzYWdlID0gaXRlbTtcbiAgICAgICAgdGhpcy5fdGV4dC51c2FnZSA9IGl0ZW07XG4gICAgICAgIHRoaXMuX2xvY2F0aW9uLmlubmVyVGV4dCA9IGAke3BhdGguYmFzZW5hbWUoaXRlbS5GaWxlTmFtZSl9KCR7aXRlbS5MaW5lfSwke2l0ZW0uQ29sdW1ufSlgO1xuICAgICAgICB0aGlzLl9maWxlbmFtZS5pbm5lclRleHQgPSBwYXRoLmRpcm5hbWUoaXRlbS5GaWxlTmFtZSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGF0dGFjaGVkKCkge1xuICAgICAgICB0aGlzLl90ZXh0LnVzYWdlID0gdGhpcy5fdXNhZ2U7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGRldGFjaGVkKCkgeyB0aGlzLl9pbnZpZXcgPSBmYWxzZTsgfVxuICAgIHJldHVybiBmdW5jdGlvbiBnZXRNZXNzYWdlRWxlbWVudCgpIHtcbiAgICAgICAgY29uc3QgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJyk7XG4gICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZCgnZmluZC11c2FnZXMnKTtcbiAgICAgICAgY29uc3QgdGV4dCA9IGVsZW1lbnQuX3RleHQgPSBuZXcgSGlnaGxpZ2h0RWxlbWVudCgpO1xuICAgICAgICB0ZXh0LmNsYXNzTGlzdC5hZGQoJ3RleHQtaGlnaGxpZ2h0Jyk7XG4gICAgICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQodGV4dCk7XG4gICAgICAgIGNvbnN0IGxvY2F0aW9uID0gZWxlbWVudC5fbG9jYXRpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwcmUnKTtcbiAgICAgICAgbG9jYXRpb24uY2xhc3NMaXN0LmFkZCgnaW5saW5lLWJsb2NrJyk7XG4gICAgICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQobG9jYXRpb24pO1xuICAgICAgICBjb25zdCBmaWxlbmFtZSA9IGVsZW1lbnQuX2ZpbGVuYW1lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncHJlJyk7XG4gICAgICAgIGZpbGVuYW1lLmNsYXNzTGlzdC5hZGQoJ3RleHQtc3VidGxlJywgJ2lubGluZS1ibG9jaycpO1xuICAgICAgICBlbGVtZW50LmFwcGVuZENoaWxkKGZpbGVuYW1lKTtcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGVsZW1lbnQsICdrZXknLCBrZXlQcm9wcyk7XG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShlbGVtZW50LCAnc2VsZWN0ZWQnLCBzZWxlY3RlZFByb3BzKTtcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGVsZW1lbnQsICdpbnZpZXcnLCBpbnZpZXdQcm9wcyk7XG4gICAgICAgIGVsZW1lbnQuc2V0TWVzc2FnZSA9IHNldE1lc3NhZ2U7XG4gICAgICAgIGVsZW1lbnQuYXR0YWNoZWQgPSBhdHRhY2hlZDtcbiAgICAgICAgZWxlbWVudC5kZXRhY2hlZCA9IGRldGFjaGVkO1xuICAgICAgICByZXR1cm4gZWxlbWVudDtcbiAgICB9O1xufSkoKTtcbmV4cG9ydCBjbGFzcyBGaW5kV2luZG93IGV4dGVuZHMgSFRNTERpdkVsZW1lbnQge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlciguLi5hcmd1bWVudHMpO1xuICAgICAgICB0aGlzLmRpc3BsYXlOYW1lID0gJ0ZpbmRQYW5lV2luZG93JztcbiAgICB9XG4gICAgY3JlYXRlZENhbGxiYWNrKCkge1xuICAgICAgICB0aGlzLmNsYXNzTGlzdC5hZGQoJ2ZpbmQtb3V0cHV0LXBhbmUnKTtcbiAgICAgICAgdGhpcy5fbGlzdCA9IG5ldyBPdXRwdXRFbGVtZW50KCk7XG4gICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQodGhpcy5fbGlzdCk7XG4gICAgICAgIHRoaXMuX2xpc3QuZ2V0S2V5ID0gKHVzYWdlKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gYHF1aWNrLWZpeC0ke3VzYWdlLkZpbGVOYW1lfS0oJHt1c2FnZS5MaW5lfS0ke3VzYWdlLkNvbHVtbn0pLSgke3VzYWdlLkVuZExpbmV9LSR7dXNhZ2UuRW5kQ29sdW1ufSktKCR7dXNhZ2UuUHJvamVjdHMuam9pbignLScpfSlgO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLl9saXN0LmhhbmRsZUNsaWNrID0gKGl0ZW0pID0+IHtcbiAgICAgICAgICAgIHRoaXMuZ290b1VzYWdlKGl0ZW0pO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLl9saXN0LmV2ZW50TmFtZSA9ICd1c2FnZSc7XG4gICAgICAgIHRoaXMuX2xpc3QuZWxlbWVudEZhY3RvcnkgPSBnZXRNZXNzYWdlRWxlbWVudDtcbiAgICB9XG4gICAgYXR0YWNoZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdGhpcy5fbGlzdC5hdHRhY2hlZCgpO1xuICAgIH1cbiAgICBkZXRhY2hlZENhbGxiYWNrKCkge1xuICAgICAgICB0aGlzLl9saXN0LmRldGFjaGVkKCk7XG4gICAgfVxuICAgIHVwZGF0ZShvdXRwdXQpIHtcbiAgICAgICAgdGhpcy5fbGlzdC51cGRhdGVPdXRwdXQob3V0cHV0KTtcbiAgICB9XG4gICAgbmV4dCgpIHtcbiAgICAgICAgdGhpcy5fbGlzdC5uZXh0KCk7XG4gICAgfVxuICAgIHByZXYoKSB7XG4gICAgICAgIHRoaXMuX2xpc3QucHJldigpO1xuICAgIH1cbiAgICBnZXQgc2VsZWN0ZWRJbmRleCgpIHsgcmV0dXJuIHRoaXMuX2xpc3Quc2VsZWN0ZWRJbmRleDsgfVxuICAgIHNldCBzZWxlY3RlZEluZGV4KHZhbHVlKSB7IHRoaXMuX2xpc3Quc2VsZWN0ZWRJbmRleCA9IHZhbHVlOyB9XG4gICAgZ2V0IGN1cnJlbnQoKSB7IHJldHVybiB0aGlzLl9saXN0LmN1cnJlbnQ7IH1cbiAgICBnb3RvVXNhZ2UocXVpY2tmaXgpIHtcbiAgICAgICAgT21uaS5uYXZpZ2F0ZVRvKHF1aWNrZml4KTtcbiAgICB9XG59XG5leHBvcnRzLkZpbmRXaW5kb3cgPSBkb2N1bWVudC5yZWdpc3RlckVsZW1lbnQoJ29tbmlzaGFycC1maW5kLXdpbmRvdycsIHsgcHJvdG90eXBlOiBGaW5kV2luZG93LnByb3RvdHlwZSB9KTtcbiJdfQ==
