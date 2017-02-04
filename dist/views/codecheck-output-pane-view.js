'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.CodeCheckOutputElement = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _path = require('path');

var path = _interopRequireWildcard(_path);

var _omni = require('../server/omni');

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
            this._inview = value;
        }
    };
    function setMessage(key, item) {
        this._key = key;
        this.classList.add('' + item.LogLevel);
        if (item.LogLevel === 'Error') {
            this._icon.classList.add('fa-times-circle');
            this._icon.classList.remove('fa-exclamation-triangle');
            this._icon.classList.remove('fa-info');
        } else if (item.LogLevel === 'Warning') {
            this._icon.classList.add('fa-exclamation-triangle');
            this._icon.classList.remove('fa-times-circle');
            this._icon.classList.remove('fa-info');
        } else {
            this._icon.classList.add('fa-info');
            this._icon.classList.remove('fa-exclamation-triangle');
            this._icon.classList.remove('fa-times-circle');
        }
        this._text.innerText = item.Text;
        this._location.innerText = path.basename(item.FileName) + '(' + item.Line + ',' + item.Column + ')';
        this._filename.innerText = path.dirname(item.FileName);
    }
    function attached() {}
    function detached() {}
    return function getMessageElement() {
        var element = document.createElement('li');
        element.classList.add('codecheck');
        var icon = element._icon = document.createElement('span');
        icon.classList.add('fa');
        element.appendChild(icon);
        var text = element._text = document.createElement('pre');
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

var CodeCheckOutputElement = exports.CodeCheckOutputElement = function (_HTMLDivElement) {
    _inherits(CodeCheckOutputElement, _HTMLDivElement);

    function CodeCheckOutputElement() {
        _classCallCheck(this, CodeCheckOutputElement);

        var _this = _possibleConstructorReturn(this, (CodeCheckOutputElement.__proto__ || Object.getPrototypeOf(CodeCheckOutputElement)).apply(this, arguments));

        _this.displayName = 'FindPaneWindow';
        return _this;
    }

    _createClass(CodeCheckOutputElement, [{
        key: 'createdCallback',
        value: function createdCallback() {
            var _this2 = this;

            this.classList.add('codecheck-output-pane');
            this._list = new _outputComponent.OutputElement();
            this.appendChild(this._list);
            this._list.getKey = function (error) {
                return 'code-check-' + error.LogLevel + '-' + error.FileName + '-(' + error.Line + '-' + error.Column + ')-(' + error.EndLine + '-' + error.EndColumn + ')-(' + (error.Projects || []).join('-') + ')';
            };
            this._list.handleClick = function (item) {
                _this2.goToLine(item);
            };
            this._list.eventName = 'diagnostic';
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
        key: 'goToLine',
        value: function goToLine(location) {
            _omni.Omni.navigateTo(location);
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

    return CodeCheckOutputElement;
}(HTMLDivElement);

exports.CodeCheckOutputElement = document.registerElement('omnisharp-codecheck-output', { prototype: CodeCheckOutputElement.prototype });
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy9jb2RlY2hlY2stb3V0cHV0LXBhbmUtdmlldy50cyIsImxpYi92aWV3cy9jb2RlY2hlY2stb3V0cHV0LXBhbmUtdmlldy5qcyJdLCJuYW1lcyI6WyJwYXRoIiwiZ2V0TWVzc2FnZUVsZW1lbnQiLCJzZWxlY3RlZFByb3BzIiwiZ2V0Iiwic2VsZWN0ZWQiLCJjbGFzc0xpc3QiLCJjb250YWlucyIsInNldCIsInZhbHVlIiwiYWRkIiwicmVtb3ZlIiwia2V5UHJvcHMiLCJrZXkiLCJfa2V5IiwiaW52aWV3UHJvcHMiLCJpbnZpZXciLCJfaW52aWV3Iiwic2V0TWVzc2FnZSIsIml0ZW0iLCJMb2dMZXZlbCIsIl9pY29uIiwiX3RleHQiLCJpbm5lclRleHQiLCJUZXh0IiwiX2xvY2F0aW9uIiwiYmFzZW5hbWUiLCJGaWxlTmFtZSIsIkxpbmUiLCJDb2x1bW4iLCJfZmlsZW5hbWUiLCJkaXJuYW1lIiwiYXR0YWNoZWQiLCJkZXRhY2hlZCIsImVsZW1lbnQiLCJkb2N1bWVudCIsImNyZWF0ZUVsZW1lbnQiLCJpY29uIiwiYXBwZW5kQ2hpbGQiLCJ0ZXh0IiwibG9jYXRpb24iLCJmaWxlbmFtZSIsIk9iamVjdCIsImRlZmluZVByb3BlcnR5IiwiQ29kZUNoZWNrT3V0cHV0RWxlbWVudCIsImFyZ3VtZW50cyIsImRpc3BsYXlOYW1lIiwiX2xpc3QiLCJnZXRLZXkiLCJlcnJvciIsIkVuZExpbmUiLCJFbmRDb2x1bW4iLCJQcm9qZWN0cyIsImpvaW4iLCJoYW5kbGVDbGljayIsImdvVG9MaW5lIiwiZXZlbnROYW1lIiwiZWxlbWVudEZhY3RvcnkiLCJvdXRwdXQiLCJ1cGRhdGVPdXRwdXQiLCJuZXh0IiwicHJldiIsIm5hdmlnYXRlVG8iLCJzZWxlY3RlZEluZGV4IiwiY3VycmVudCIsIkhUTUxEaXZFbGVtZW50IiwiZXhwb3J0cyIsInJlZ2lzdGVyRWxlbWVudCIsInByb3RvdHlwZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQ0E7O0lBQVlBLEk7O0FBQ1o7O0FBQ0E7Ozs7Ozs7Ozs7QUFJQSxJQUFNQyxvQkFBcUIsWUFBQTtBQUN2QixRQUFNQyxnQkFBZ0I7QUFDbEJDLGFBQUssU0FBQUMsUUFBQSxHQUFBO0FBQXNCLG1CQUFPLEtBQUtDLFNBQUwsQ0FBZUMsUUFBZixDQUF3QixVQUF4QixDQUFQO0FBQTZDLFNBRHREO0FBRWxCQyxhQUFLLFNBQUFILFFBQUEsQ0FBa0JJLEtBQWxCLEVBQWdDO0FBQUksZ0JBQUlBLEtBQUosRUFBVyxLQUFLSCxTQUFMLENBQWVJLEdBQWYsQ0FBbUIsVUFBbkIsRUFBWCxLQUFnRCxLQUFLSixTQUFMLENBQWVLLE1BQWYsQ0FBc0IsVUFBdEI7QUFBb0M7QUFGM0csS0FBdEI7QUFLQSxRQUFNQyxXQUFXO0FBQ2JSLGFBQUssU0FBQVMsR0FBQSxHQUFBO0FBQWlCLG1CQUFPLEtBQUtDLElBQVo7QUFBbUI7QUFENUIsS0FBakI7QUFJQSxRQUFNQyxjQUFjO0FBQ2hCWCxhQUFLLFNBQUFZLE1BQUEsR0FBQTtBQUFvQixtQkFBTyxLQUFLQyxPQUFaO0FBQXNCLFNBRC9CO0FBRWhCVCxhQUFLLFNBQUFRLE1BQUEsQ0FBZ0JQLEtBQWhCLEVBQThCO0FBQUksaUJBQUtRLE9BQUwsR0FBZVIsS0FBZjtBQUF1QjtBQUY5QyxLQUFwQjtBQUtBLGFBQUFTLFVBQUEsQ0FBb0JMLEdBQXBCLEVBQWlDTSxJQUFqQyxFQUFnRTtBQUM1RCxhQUFLTCxJQUFMLEdBQVlELEdBQVo7QUFFQSxhQUFLUCxTQUFMLENBQWVJLEdBQWYsTUFBc0JTLEtBQUtDLFFBQTNCO0FBRUEsWUFBSUQsS0FBS0MsUUFBTCxLQUFrQixPQUF0QixFQUErQjtBQUMzQixpQkFBS0MsS0FBTCxDQUFXZixTQUFYLENBQXFCSSxHQUFyQixDQUF5QixpQkFBekI7QUFDQSxpQkFBS1csS0FBTCxDQUFXZixTQUFYLENBQXFCSyxNQUFyQixDQUE0Qix5QkFBNUI7QUFDQSxpQkFBS1UsS0FBTCxDQUFXZixTQUFYLENBQXFCSyxNQUFyQixDQUE0QixTQUE1QjtBQUNILFNBSkQsTUFJTyxJQUFJUSxLQUFLQyxRQUFMLEtBQWtCLFNBQXRCLEVBQWlDO0FBQ3BDLGlCQUFLQyxLQUFMLENBQVdmLFNBQVgsQ0FBcUJJLEdBQXJCLENBQXlCLHlCQUF6QjtBQUNBLGlCQUFLVyxLQUFMLENBQVdmLFNBQVgsQ0FBcUJLLE1BQXJCLENBQTRCLGlCQUE1QjtBQUNBLGlCQUFLVSxLQUFMLENBQVdmLFNBQVgsQ0FBcUJLLE1BQXJCLENBQTRCLFNBQTVCO0FBQ0gsU0FKTSxNQUlBO0FBQ0gsaUJBQUtVLEtBQUwsQ0FBV2YsU0FBWCxDQUFxQkksR0FBckIsQ0FBeUIsU0FBekI7QUFDQSxpQkFBS1csS0FBTCxDQUFXZixTQUFYLENBQXFCSyxNQUFyQixDQUE0Qix5QkFBNUI7QUFDQSxpQkFBS1UsS0FBTCxDQUFXZixTQUFYLENBQXFCSyxNQUFyQixDQUE0QixpQkFBNUI7QUFDSDtBQUVELGFBQUtXLEtBQUwsQ0FBV0MsU0FBWCxHQUF1QkosS0FBS0ssSUFBNUI7QUFDQSxhQUFLQyxTQUFMLENBQWVGLFNBQWYsR0FBOEJ0QixLQUFLeUIsUUFBTCxDQUFjUCxLQUFLUSxRQUFuQixDQUE5QixTQUE4RFIsS0FBS1MsSUFBbkUsU0FBMkVULEtBQUtVLE1BQWhGO0FBQ0EsYUFBS0MsU0FBTCxDQUFlUCxTQUFmLEdBQTJCdEIsS0FBSzhCLE9BQUwsQ0FBYVosS0FBS1EsUUFBbEIsQ0FBM0I7QUFDSDtBQUVELGFBQUFLLFFBQUEsR0FBQSxDQUE2QjtBQUU3QixhQUFBQyxRQUFBLEdBQUEsQ0FBNkI7QUFFN0IsV0FBTyxTQUFBL0IsaUJBQUEsR0FBQTtBQUNILFlBQU1nQyxVQUF3Q0MsU0FBU0MsYUFBVCxDQUF1QixJQUF2QixDQUE5QztBQUNBRixnQkFBUTVCLFNBQVIsQ0FBa0JJLEdBQWxCLENBQXNCLFdBQXRCO0FBRUEsWUFBTTJCLE9BQVFILFFBQWdCYixLQUFoQixHQUF3QmMsU0FBU0MsYUFBVCxDQUF1QixNQUF2QixDQUF0QztBQUNBQyxhQUFLL0IsU0FBTCxDQUFlSSxHQUFmLENBQW1CLElBQW5CO0FBQ0F3QixnQkFBUUksV0FBUixDQUFvQkQsSUFBcEI7QUFFQSxZQUFNRSxPQUFRTCxRQUFnQlosS0FBaEIsR0FBd0JhLFNBQVNDLGFBQVQsQ0FBdUIsS0FBdkIsQ0FBdEM7QUFDQUcsYUFBS2pDLFNBQUwsQ0FBZUksR0FBZixDQUFtQixnQkFBbkI7QUFDQXdCLGdCQUFRSSxXQUFSLENBQW9CQyxJQUFwQjtBQUVBLFlBQU1DLFdBQVlOLFFBQWdCVCxTQUFoQixHQUE0QlUsU0FBU0MsYUFBVCxDQUF1QixLQUF2QixDQUE5QztBQUNBSSxpQkFBU2xDLFNBQVQsQ0FBbUJJLEdBQW5CLENBQXVCLGNBQXZCO0FBQ0F3QixnQkFBUUksV0FBUixDQUFvQkUsUUFBcEI7QUFFQSxZQUFNQyxXQUFZUCxRQUFnQkosU0FBaEIsR0FBNEJLLFNBQVNDLGFBQVQsQ0FBdUIsS0FBdkIsQ0FBOUM7QUFDQUssaUJBQVNuQyxTQUFULENBQW1CSSxHQUFuQixDQUF1QixhQUF2QixFQUFzQyxjQUF0QztBQUNBd0IsZ0JBQVFJLFdBQVIsQ0FBb0JHLFFBQXBCO0FBRUFDLGVBQU9DLGNBQVAsQ0FBc0JULE9BQXRCLEVBQStCLEtBQS9CLEVBQXNDdEIsUUFBdEM7QUFDQThCLGVBQU9DLGNBQVAsQ0FBc0JULE9BQXRCLEVBQStCLFVBQS9CLEVBQTJDL0IsYUFBM0M7QUFDQXVDLGVBQU9DLGNBQVAsQ0FBc0JULE9BQXRCLEVBQStCLFFBQS9CLEVBQXlDbkIsV0FBekM7QUFDQW1CLGdCQUFRaEIsVUFBUixHQUFxQkEsVUFBckI7QUFDQWdCLGdCQUFRRixRQUFSLEdBQW1CQSxRQUFuQjtBQUNBRSxnQkFBUUQsUUFBUixHQUFtQkEsUUFBbkI7QUFFQSxlQUFPQyxPQUFQO0FBQ0gsS0E1QkQ7QUE2QkgsQ0F4RXlCLEVBQTFCOztJQTBFTVUsc0IsV0FBQUEsc0I7OztBQUFOLHNDQUFBO0FBQUE7O0FBQUEscUpDYmlCQyxTRGFqQjs7QUFDVyxjQUFBQyxXQUFBLEdBQWMsZ0JBQWQ7QUFEWDtBQTZDQzs7OzswQ0F6Q3lCO0FBQUE7O0FBQ2xCLGlCQUFLeEMsU0FBTCxDQUFlSSxHQUFmLENBQW1CLHVCQUFuQjtBQUNBLGlCQUFLcUMsS0FBTCxHQUFhLG9DQUFiO0FBQ0EsaUJBQUtULFdBQUwsQ0FBaUIsS0FBS1MsS0FBdEI7QUFDQSxpQkFBS0EsS0FBTCxDQUFXQyxNQUFYLEdBQW9CLFVBQUNDLEtBQUQsRUFBaUM7QUFDakQsdUNBQXFCQSxNQUFNN0IsUUFBM0IsU0FBdUM2QixNQUFNdEIsUUFBN0MsVUFBMERzQixNQUFNckIsSUFBaEUsU0FBd0VxQixNQUFNcEIsTUFBOUUsV0FBMEZvQixNQUFNQyxPQUFoRyxTQUEyR0QsTUFBTUUsU0FBakgsV0FBZ0ksQ0FBQ0YsTUFBTUcsUUFBTixJQUFrQixFQUFuQixFQUF1QkMsSUFBdkIsQ0FBNEIsR0FBNUIsQ0FBaEk7QUFDSCxhQUZEO0FBR0EsaUJBQUtOLEtBQUwsQ0FBV08sV0FBWCxHQUF5QixVQUFDbkMsSUFBRCxFQUFnQztBQUNyRCx1QkFBS29DLFFBQUwsQ0FBY3BDLElBQWQ7QUFDSCxhQUZEO0FBR0EsaUJBQUs0QixLQUFMLENBQVdTLFNBQVgsR0FBdUIsWUFBdkI7QUFDQSxpQkFBS1QsS0FBTCxDQUFXVSxjQUFYLEdBQTRCdkQsaUJBQTVCO0FBQ0g7OzsyQ0FFc0I7QUFDbkIsaUJBQUs2QyxLQUFMLENBQVdmLFFBQVg7QUFDSDs7OzJDQUVzQjtBQUNuQixpQkFBS2UsS0FBTCxDQUFXZCxRQUFYO0FBQ0g7OzsrQkFFYXlCLE0sRUFBbUM7QUFDN0MsaUJBQUtYLEtBQUwsQ0FBV1ksWUFBWCxDQUF3QkQsTUFBeEI7QUFDSDs7OytCQUVVO0FBQ1AsaUJBQUtYLEtBQUwsQ0FBV2EsSUFBWDtBQUNIOzs7K0JBRVU7QUFDUCxpQkFBS2IsS0FBTCxDQUFXYyxJQUFYO0FBQ0g7OztpQ0FNZ0JyQixRLEVBQW1DO0FBQ2hELHVCQUFLc0IsVUFBTCxDQUFnQnRCLFFBQWhCO0FBQ0g7Ozs0QkFOdUI7QUFBSyxtQkFBTyxLQUFLTyxLQUFMLENBQVdnQixhQUFsQjtBQUFrQyxTOzBCQUN0Q3RELEssRUFBSztBQUFJLGlCQUFLc0MsS0FBTCxDQUFXZ0IsYUFBWCxHQUEyQnRELEtBQTNCO0FBQW1DOzs7NEJBQ25EO0FBQUssbUJBQU8sS0FBS3NDLEtBQUwsQ0FBV2lCLE9BQWxCO0FBQTRCOzs7O0VBeENYQyxjOztBQStDdENDLFFBQVN0QixzQkFBVCxHQUF3Q1QsU0FBVWdDLGVBQVYsQ0FBMEIsNEJBQTFCLEVBQXdELEVBQUVDLFdBQVd4Qix1QkFBdUJ3QixTQUFwQyxFQUF4RCxDQUF4QyIsImZpbGUiOiJsaWIvdmlld3MvY29kZWNoZWNrLW91dHB1dC1wYW5lLXZpZXcuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge01vZGVsc30gZnJvbSAnb21uaXNoYXJwLWNsaWVudCc7XHJcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCB7T21uaX0gZnJvbSAnLi4vc2VydmVyL29tbmknO1xyXG5pbXBvcnQge01lc3NhZ2VFbGVtZW50LCBPdXRwdXRFbGVtZW50fSBmcm9tICcuL291dHB1dC1jb21wb25lbnQnO1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBDb2RlQ2hlY2tNZXNzYWdlRWxlbWVudCBleHRlbmRzIE1lc3NhZ2VFbGVtZW50PE1vZGVscy5EaWFnbm9zdGljTG9jYXRpb24+IHsgfVxyXG5cclxuY29uc3QgZ2V0TWVzc2FnZUVsZW1lbnQgPSAoZnVuY3Rpb24gKCkge1xyXG4gICAgY29uc3Qgc2VsZWN0ZWRQcm9wcyA9IHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uIHNlbGVjdGVkKCkgeyByZXR1cm4gdGhpcy5jbGFzc0xpc3QuY29udGFpbnMoJ3NlbGVjdGVkJyk7IH0sXHJcbiAgICAgICAgc2V0OiBmdW5jdGlvbiBzZWxlY3RlZCh2YWx1ZTogYm9vbGVhbikgeyBpZiAodmFsdWUpIHRoaXMuY2xhc3NMaXN0LmFkZCgnc2VsZWN0ZWQnKTsgZWxzZSB0aGlzLmNsYXNzTGlzdC5yZW1vdmUoJ3NlbGVjdGVkJyk7IH1cclxuICAgIH07XHJcblxyXG4gICAgY29uc3Qga2V5UHJvcHMgPSB7XHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiBrZXkoKSB7IHJldHVybiB0aGlzLl9rZXk7IH1cclxuICAgIH07XHJcblxyXG4gICAgY29uc3QgaW52aWV3UHJvcHMgPSB7XHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiBpbnZpZXcoKSB7IHJldHVybiB0aGlzLl9pbnZpZXc7IH0sXHJcbiAgICAgICAgc2V0OiBmdW5jdGlvbiBpbnZpZXcodmFsdWU6IGJvb2xlYW4pIHsgdGhpcy5faW52aWV3ID0gdmFsdWU7IH1cclxuICAgIH07XHJcblxyXG4gICAgZnVuY3Rpb24gc2V0TWVzc2FnZShrZXk6IHN0cmluZywgaXRlbTogTW9kZWxzLkRpYWdub3N0aWNMb2NhdGlvbikge1xyXG4gICAgICAgIHRoaXMuX2tleSA9IGtleTtcclxuXHJcbiAgICAgICAgdGhpcy5jbGFzc0xpc3QuYWRkKGAke2l0ZW0uTG9nTGV2ZWx9YCk7XHJcblxyXG4gICAgICAgIGlmIChpdGVtLkxvZ0xldmVsID09PSAnRXJyb3InKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2ljb24uY2xhc3NMaXN0LmFkZCgnZmEtdGltZXMtY2lyY2xlJyk7XHJcbiAgICAgICAgICAgIHRoaXMuX2ljb24uY2xhc3NMaXN0LnJlbW92ZSgnZmEtZXhjbGFtYXRpb24tdHJpYW5nbGUnKTtcclxuICAgICAgICAgICAgdGhpcy5faWNvbi5jbGFzc0xpc3QucmVtb3ZlKCdmYS1pbmZvJyk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChpdGVtLkxvZ0xldmVsID09PSAnV2FybmluZycpIHtcclxuICAgICAgICAgICAgdGhpcy5faWNvbi5jbGFzc0xpc3QuYWRkKCdmYS1leGNsYW1hdGlvbi10cmlhbmdsZScpO1xyXG4gICAgICAgICAgICB0aGlzLl9pY29uLmNsYXNzTGlzdC5yZW1vdmUoJ2ZhLXRpbWVzLWNpcmNsZScpO1xyXG4gICAgICAgICAgICB0aGlzLl9pY29uLmNsYXNzTGlzdC5yZW1vdmUoJ2ZhLWluZm8nKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLl9pY29uLmNsYXNzTGlzdC5hZGQoJ2ZhLWluZm8nKTtcclxuICAgICAgICAgICAgdGhpcy5faWNvbi5jbGFzc0xpc3QucmVtb3ZlKCdmYS1leGNsYW1hdGlvbi10cmlhbmdsZScpO1xyXG4gICAgICAgICAgICB0aGlzLl9pY29uLmNsYXNzTGlzdC5yZW1vdmUoJ2ZhLXRpbWVzLWNpcmNsZScpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5fdGV4dC5pbm5lclRleHQgPSBpdGVtLlRleHQ7XHJcbiAgICAgICAgdGhpcy5fbG9jYXRpb24uaW5uZXJUZXh0ID0gYCR7cGF0aC5iYXNlbmFtZShpdGVtLkZpbGVOYW1lKX0oJHtpdGVtLkxpbmV9LCR7aXRlbS5Db2x1bW59KWA7XHJcbiAgICAgICAgdGhpcy5fZmlsZW5hbWUuaW5uZXJUZXh0ID0gcGF0aC5kaXJuYW1lKGl0ZW0uRmlsZU5hbWUpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGF0dGFjaGVkKCkgeyAvKiAqLyB9XHJcblxyXG4gICAgZnVuY3Rpb24gZGV0YWNoZWQoKSB7IC8qICovIH1cclxuXHJcbiAgICByZXR1cm4gZnVuY3Rpb24gZ2V0TWVzc2FnZUVsZW1lbnQoKTogQ29kZUNoZWNrTWVzc2FnZUVsZW1lbnQge1xyXG4gICAgICAgIGNvbnN0IGVsZW1lbnQ6IENvZGVDaGVja01lc3NhZ2VFbGVtZW50ID0gPGFueT5kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xyXG4gICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZCgnY29kZWNoZWNrJyk7XHJcblxyXG4gICAgICAgIGNvbnN0IGljb24gPSAoZWxlbWVudCBhcyBhbnkpLl9pY29uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xyXG4gICAgICAgIGljb24uY2xhc3NMaXN0LmFkZCgnZmEnKTtcclxuICAgICAgICBlbGVtZW50LmFwcGVuZENoaWxkKGljb24pO1xyXG5cclxuICAgICAgICBjb25zdCB0ZXh0ID0gKGVsZW1lbnQgYXMgYW55KS5fdGV4dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3ByZScpO1xyXG4gICAgICAgIHRleHQuY2xhc3NMaXN0LmFkZCgndGV4dC1oaWdobGlnaHQnKTtcclxuICAgICAgICBlbGVtZW50LmFwcGVuZENoaWxkKHRleHQpO1xyXG5cclxuICAgICAgICBjb25zdCBsb2NhdGlvbiA9IChlbGVtZW50IGFzIGFueSkuX2xvY2F0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncHJlJyk7XHJcbiAgICAgICAgbG9jYXRpb24uY2xhc3NMaXN0LmFkZCgnaW5saW5lLWJsb2NrJyk7XHJcbiAgICAgICAgZWxlbWVudC5hcHBlbmRDaGlsZChsb2NhdGlvbik7XHJcblxyXG4gICAgICAgIGNvbnN0IGZpbGVuYW1lID0gKGVsZW1lbnQgYXMgYW55KS5fZmlsZW5hbWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwcmUnKTtcclxuICAgICAgICBmaWxlbmFtZS5jbGFzc0xpc3QuYWRkKCd0ZXh0LXN1YnRsZScsICdpbmxpbmUtYmxvY2snKTtcclxuICAgICAgICBlbGVtZW50LmFwcGVuZENoaWxkKGZpbGVuYW1lKTtcclxuXHJcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGVsZW1lbnQsICdrZXknLCBrZXlQcm9wcyk7XHJcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGVsZW1lbnQsICdzZWxlY3RlZCcsIHNlbGVjdGVkUHJvcHMpO1xyXG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShlbGVtZW50LCAnaW52aWV3JywgaW52aWV3UHJvcHMpO1xyXG4gICAgICAgIGVsZW1lbnQuc2V0TWVzc2FnZSA9IHNldE1lc3NhZ2U7XHJcbiAgICAgICAgZWxlbWVudC5hdHRhY2hlZCA9IGF0dGFjaGVkO1xyXG4gICAgICAgIGVsZW1lbnQuZGV0YWNoZWQgPSBkZXRhY2hlZDtcclxuXHJcbiAgICAgICAgcmV0dXJuIGVsZW1lbnQ7XHJcbiAgICB9O1xyXG59KSgpO1xyXG5cclxuZXhwb3J0IGNsYXNzIENvZGVDaGVja091dHB1dEVsZW1lbnQgZXh0ZW5kcyBIVE1MRGl2RWxlbWVudCBpbXBsZW1lbnRzIFdlYkNvbXBvbmVudCB7XHJcbiAgICBwdWJsaWMgZGlzcGxheU5hbWUgPSAnRmluZFBhbmVXaW5kb3cnO1xyXG4gICAgcHJpdmF0ZSBfbGlzdDogT3V0cHV0RWxlbWVudDxNb2RlbHMuRGlhZ25vc3RpY0xvY2F0aW9uLCBDb2RlQ2hlY2tNZXNzYWdlRWxlbWVudD47XHJcblxyXG4gICAgcHVibGljIGNyZWF0ZWRDYWxsYmFjaygpIHtcclxuICAgICAgICB0aGlzLmNsYXNzTGlzdC5hZGQoJ2NvZGVjaGVjay1vdXRwdXQtcGFuZScpO1xyXG4gICAgICAgIHRoaXMuX2xpc3QgPSBuZXcgT3V0cHV0RWxlbWVudDxNb2RlbHMuRGlhZ25vc3RpY0xvY2F0aW9uLCBDb2RlQ2hlY2tNZXNzYWdlRWxlbWVudD4oKTtcclxuICAgICAgICB0aGlzLmFwcGVuZENoaWxkKHRoaXMuX2xpc3QpO1xyXG4gICAgICAgIHRoaXMuX2xpc3QuZ2V0S2V5ID0gKGVycm9yOiBNb2RlbHMuRGlhZ25vc3RpY0xvY2F0aW9uKSA9PiB7XHJcbiAgICAgICAgICAgIHJldHVybiBgY29kZS1jaGVjay0ke2Vycm9yLkxvZ0xldmVsfS0ke2Vycm9yLkZpbGVOYW1lfS0oJHtlcnJvci5MaW5lfS0ke2Vycm9yLkNvbHVtbn0pLSgke2Vycm9yLkVuZExpbmV9LSR7ZXJyb3IuRW5kQ29sdW1ufSktKCR7KGVycm9yLlByb2plY3RzIHx8IFtdKS5qb2luKCctJyl9KWA7XHJcbiAgICAgICAgfTtcclxuICAgICAgICB0aGlzLl9saXN0LmhhbmRsZUNsaWNrID0gKGl0ZW06IE1vZGVscy5EaWFnbm9zdGljTG9jYXRpb24pID0+IHtcclxuICAgICAgICAgICAgdGhpcy5nb1RvTGluZShpdGVtKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHRoaXMuX2xpc3QuZXZlbnROYW1lID0gJ2RpYWdub3N0aWMnO1xyXG4gICAgICAgIHRoaXMuX2xpc3QuZWxlbWVudEZhY3RvcnkgPSBnZXRNZXNzYWdlRWxlbWVudDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgYXR0YWNoZWRDYWxsYmFjaygpIHtcclxuICAgICAgICB0aGlzLl9saXN0LmF0dGFjaGVkKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRldGFjaGVkQ2FsbGJhY2soKSB7XHJcbiAgICAgICAgdGhpcy5fbGlzdC5kZXRhY2hlZCgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB1cGRhdGUob3V0cHV0OiBNb2RlbHMuRGlhZ25vc3RpY0xvY2F0aW9uW10pIHtcclxuICAgICAgICB0aGlzLl9saXN0LnVwZGF0ZU91dHB1dChvdXRwdXQpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBuZXh0KCkge1xyXG4gICAgICAgIHRoaXMuX2xpc3QubmV4dCgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBwcmV2KCkge1xyXG4gICAgICAgIHRoaXMuX2xpc3QucHJldigpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgc2VsZWN0ZWRJbmRleCgpIHsgcmV0dXJuIHRoaXMuX2xpc3Quc2VsZWN0ZWRJbmRleDsgfVxyXG4gICAgcHVibGljIHNldCBzZWxlY3RlZEluZGV4KHZhbHVlKSB7IHRoaXMuX2xpc3Quc2VsZWN0ZWRJbmRleCA9IHZhbHVlOyB9XHJcbiAgICBwdWJsaWMgZ2V0IGN1cnJlbnQoKSB7IHJldHVybiB0aGlzLl9saXN0LmN1cnJlbnQ7IH1cclxuXHJcbiAgICBwcml2YXRlIGdvVG9MaW5lKGxvY2F0aW9uOiBNb2RlbHMuRGlhZ25vc3RpY0xvY2F0aW9uKSB7XHJcbiAgICAgICAgT21uaS5uYXZpZ2F0ZVRvKGxvY2F0aW9uKTtcclxuICAgIH1cclxufVxyXG5cclxuKDxhbnk+ZXhwb3J0cykuQ29kZUNoZWNrT3V0cHV0RWxlbWVudCA9ICg8YW55PmRvY3VtZW50KS5yZWdpc3RlckVsZW1lbnQoJ29tbmlzaGFycC1jb2RlY2hlY2stb3V0cHV0JywgeyBwcm90b3R5cGU6IENvZGVDaGVja091dHB1dEVsZW1lbnQucHJvdG90eXBlIH0pO1xyXG4iLCJpbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgT21uaSB9IGZyb20gJy4uL3NlcnZlci9vbW5pJztcbmltcG9ydCB7IE91dHB1dEVsZW1lbnQgfSBmcm9tICcuL291dHB1dC1jb21wb25lbnQnO1xuY29uc3QgZ2V0TWVzc2FnZUVsZW1lbnQgPSAoZnVuY3Rpb24gKCkge1xuICAgIGNvbnN0IHNlbGVjdGVkUHJvcHMgPSB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gc2VsZWN0ZWQoKSB7IHJldHVybiB0aGlzLmNsYXNzTGlzdC5jb250YWlucygnc2VsZWN0ZWQnKTsgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiBzZWxlY3RlZCh2YWx1ZSkgeyBpZiAodmFsdWUpXG4gICAgICAgICAgICB0aGlzLmNsYXNzTGlzdC5hZGQoJ3NlbGVjdGVkJyk7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHRoaXMuY2xhc3NMaXN0LnJlbW92ZSgnc2VsZWN0ZWQnKTsgfVxuICAgIH07XG4gICAgY29uc3Qga2V5UHJvcHMgPSB7XG4gICAgICAgIGdldDogZnVuY3Rpb24ga2V5KCkgeyByZXR1cm4gdGhpcy5fa2V5OyB9XG4gICAgfTtcbiAgICBjb25zdCBpbnZpZXdQcm9wcyA9IHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiBpbnZpZXcoKSB7IHJldHVybiB0aGlzLl9pbnZpZXc7IH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gaW52aWV3KHZhbHVlKSB7IHRoaXMuX2ludmlldyA9IHZhbHVlOyB9XG4gICAgfTtcbiAgICBmdW5jdGlvbiBzZXRNZXNzYWdlKGtleSwgaXRlbSkge1xuICAgICAgICB0aGlzLl9rZXkgPSBrZXk7XG4gICAgICAgIHRoaXMuY2xhc3NMaXN0LmFkZChgJHtpdGVtLkxvZ0xldmVsfWApO1xuICAgICAgICBpZiAoaXRlbS5Mb2dMZXZlbCA9PT0gJ0Vycm9yJykge1xuICAgICAgICAgICAgdGhpcy5faWNvbi5jbGFzc0xpc3QuYWRkKCdmYS10aW1lcy1jaXJjbGUnKTtcbiAgICAgICAgICAgIHRoaXMuX2ljb24uY2xhc3NMaXN0LnJlbW92ZSgnZmEtZXhjbGFtYXRpb24tdHJpYW5nbGUnKTtcbiAgICAgICAgICAgIHRoaXMuX2ljb24uY2xhc3NMaXN0LnJlbW92ZSgnZmEtaW5mbycpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGl0ZW0uTG9nTGV2ZWwgPT09ICdXYXJuaW5nJykge1xuICAgICAgICAgICAgdGhpcy5faWNvbi5jbGFzc0xpc3QuYWRkKCdmYS1leGNsYW1hdGlvbi10cmlhbmdsZScpO1xuICAgICAgICAgICAgdGhpcy5faWNvbi5jbGFzc0xpc3QucmVtb3ZlKCdmYS10aW1lcy1jaXJjbGUnKTtcbiAgICAgICAgICAgIHRoaXMuX2ljb24uY2xhc3NMaXN0LnJlbW92ZSgnZmEtaW5mbycpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5faWNvbi5jbGFzc0xpc3QuYWRkKCdmYS1pbmZvJyk7XG4gICAgICAgICAgICB0aGlzLl9pY29uLmNsYXNzTGlzdC5yZW1vdmUoJ2ZhLWV4Y2xhbWF0aW9uLXRyaWFuZ2xlJyk7XG4gICAgICAgICAgICB0aGlzLl9pY29uLmNsYXNzTGlzdC5yZW1vdmUoJ2ZhLXRpbWVzLWNpcmNsZScpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3RleHQuaW5uZXJUZXh0ID0gaXRlbS5UZXh0O1xuICAgICAgICB0aGlzLl9sb2NhdGlvbi5pbm5lclRleHQgPSBgJHtwYXRoLmJhc2VuYW1lKGl0ZW0uRmlsZU5hbWUpfSgke2l0ZW0uTGluZX0sJHtpdGVtLkNvbHVtbn0pYDtcbiAgICAgICAgdGhpcy5fZmlsZW5hbWUuaW5uZXJUZXh0ID0gcGF0aC5kaXJuYW1lKGl0ZW0uRmlsZU5hbWUpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBhdHRhY2hlZCgpIHsgfVxuICAgIGZ1bmN0aW9uIGRldGFjaGVkKCkgeyB9XG4gICAgcmV0dXJuIGZ1bmN0aW9uIGdldE1lc3NhZ2VFbGVtZW50KCkge1xuICAgICAgICBjb25zdCBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcbiAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkKCdjb2RlY2hlY2snKTtcbiAgICAgICAgY29uc3QgaWNvbiA9IGVsZW1lbnQuX2ljb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgICAgIGljb24uY2xhc3NMaXN0LmFkZCgnZmEnKTtcbiAgICAgICAgZWxlbWVudC5hcHBlbmRDaGlsZChpY29uKTtcbiAgICAgICAgY29uc3QgdGV4dCA9IGVsZW1lbnQuX3RleHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwcmUnKTtcbiAgICAgICAgdGV4dC5jbGFzc0xpc3QuYWRkKCd0ZXh0LWhpZ2hsaWdodCcpO1xuICAgICAgICBlbGVtZW50LmFwcGVuZENoaWxkKHRleHQpO1xuICAgICAgICBjb25zdCBsb2NhdGlvbiA9IGVsZW1lbnQuX2xvY2F0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncHJlJyk7XG4gICAgICAgIGxvY2F0aW9uLmNsYXNzTGlzdC5hZGQoJ2lubGluZS1ibG9jaycpO1xuICAgICAgICBlbGVtZW50LmFwcGVuZENoaWxkKGxvY2F0aW9uKTtcbiAgICAgICAgY29uc3QgZmlsZW5hbWUgPSBlbGVtZW50Ll9maWxlbmFtZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3ByZScpO1xuICAgICAgICBmaWxlbmFtZS5jbGFzc0xpc3QuYWRkKCd0ZXh0LXN1YnRsZScsICdpbmxpbmUtYmxvY2snKTtcbiAgICAgICAgZWxlbWVudC5hcHBlbmRDaGlsZChmaWxlbmFtZSk7XG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShlbGVtZW50LCAna2V5Jywga2V5UHJvcHMpO1xuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZWxlbWVudCwgJ3NlbGVjdGVkJywgc2VsZWN0ZWRQcm9wcyk7XG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShlbGVtZW50LCAnaW52aWV3JywgaW52aWV3UHJvcHMpO1xuICAgICAgICBlbGVtZW50LnNldE1lc3NhZ2UgPSBzZXRNZXNzYWdlO1xuICAgICAgICBlbGVtZW50LmF0dGFjaGVkID0gYXR0YWNoZWQ7XG4gICAgICAgIGVsZW1lbnQuZGV0YWNoZWQgPSBkZXRhY2hlZDtcbiAgICAgICAgcmV0dXJuIGVsZW1lbnQ7XG4gICAgfTtcbn0pKCk7XG5leHBvcnQgY2xhc3MgQ29kZUNoZWNrT3V0cHV0RWxlbWVudCBleHRlbmRzIEhUTUxEaXZFbGVtZW50IHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoLi4uYXJndW1lbnRzKTtcbiAgICAgICAgdGhpcy5kaXNwbGF5TmFtZSA9ICdGaW5kUGFuZVdpbmRvdyc7XG4gICAgfVxuICAgIGNyZWF0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdGhpcy5jbGFzc0xpc3QuYWRkKCdjb2RlY2hlY2stb3V0cHV0LXBhbmUnKTtcbiAgICAgICAgdGhpcy5fbGlzdCA9IG5ldyBPdXRwdXRFbGVtZW50KCk7XG4gICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQodGhpcy5fbGlzdCk7XG4gICAgICAgIHRoaXMuX2xpc3QuZ2V0S2V5ID0gKGVycm9yKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gYGNvZGUtY2hlY2stJHtlcnJvci5Mb2dMZXZlbH0tJHtlcnJvci5GaWxlTmFtZX0tKCR7ZXJyb3IuTGluZX0tJHtlcnJvci5Db2x1bW59KS0oJHtlcnJvci5FbmRMaW5lfS0ke2Vycm9yLkVuZENvbHVtbn0pLSgkeyhlcnJvci5Qcm9qZWN0cyB8fCBbXSkuam9pbignLScpfSlgO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLl9saXN0LmhhbmRsZUNsaWNrID0gKGl0ZW0pID0+IHtcbiAgICAgICAgICAgIHRoaXMuZ29Ub0xpbmUoaXRlbSk7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuX2xpc3QuZXZlbnROYW1lID0gJ2RpYWdub3N0aWMnO1xuICAgICAgICB0aGlzLl9saXN0LmVsZW1lbnRGYWN0b3J5ID0gZ2V0TWVzc2FnZUVsZW1lbnQ7XG4gICAgfVxuICAgIGF0dGFjaGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMuX2xpc3QuYXR0YWNoZWQoKTtcbiAgICB9XG4gICAgZGV0YWNoZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdGhpcy5fbGlzdC5kZXRhY2hlZCgpO1xuICAgIH1cbiAgICB1cGRhdGUob3V0cHV0KSB7XG4gICAgICAgIHRoaXMuX2xpc3QudXBkYXRlT3V0cHV0KG91dHB1dCk7XG4gICAgfVxuICAgIG5leHQoKSB7XG4gICAgICAgIHRoaXMuX2xpc3QubmV4dCgpO1xuICAgIH1cbiAgICBwcmV2KCkge1xuICAgICAgICB0aGlzLl9saXN0LnByZXYoKTtcbiAgICB9XG4gICAgZ2V0IHNlbGVjdGVkSW5kZXgoKSB7IHJldHVybiB0aGlzLl9saXN0LnNlbGVjdGVkSW5kZXg7IH1cbiAgICBzZXQgc2VsZWN0ZWRJbmRleCh2YWx1ZSkgeyB0aGlzLl9saXN0LnNlbGVjdGVkSW5kZXggPSB2YWx1ZTsgfVxuICAgIGdldCBjdXJyZW50KCkgeyByZXR1cm4gdGhpcy5fbGlzdC5jdXJyZW50OyB9XG4gICAgZ29Ub0xpbmUobG9jYXRpb24pIHtcbiAgICAgICAgT21uaS5uYXZpZ2F0ZVRvKGxvY2F0aW9uKTtcbiAgICB9XG59XG5leHBvcnRzLkNvZGVDaGVja091dHB1dEVsZW1lbnQgPSBkb2N1bWVudC5yZWdpc3RlckVsZW1lbnQoJ29tbmlzaGFycC1jb2RlY2hlY2stb3V0cHV0JywgeyBwcm90b3R5cGU6IENvZGVDaGVja091dHB1dEVsZW1lbnQucHJvdG90eXBlIH0pO1xuIl19
