'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.SignatureParameterView = exports.SignatureView = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var parseString = function () {
    var parser = new DOMParser();
    return function (xml) {
        return parser.parseFromString(xml, 'text/xml');
    };
}();

var SignatureView = exports.SignatureView = function (_HTMLDivElement) {
    _inherits(SignatureView, _HTMLDivElement);

    function SignatureView() {
        _classCallCheck(this, SignatureView);

        var _this = _possibleConstructorReturn(this, (SignatureView.__proto__ || Object.getPrototypeOf(SignatureView)).apply(this, arguments));

        _this._parametersList = [];
        return _this;
    }

    _createClass(SignatureView, [{
        key: 'createdCallback',
        value: function createdCallback() {
            this._selectedIndex = -1;
            this._lastIndex = -1;
            this._editorLineHeight = 0;
            this._inner = document.createElement('div');
            this._label = document.createElement('span');
            this._documentation = document.createElement('div');
            this._parameterDocumentation = document.createElement('div');
            this._parameterDocumentation.style.marginLeft = '2.4em';
            this._arrows = document.createElement('span');
            this._parameters = document.createElement('span');
            this._count = document.createElement('span');
            this._parametersList = [];
            this.classList.add('tooltip');
            this._inner.classList.add('tooltip-inner');
            this._setupArrows();
            var open = document.createElement('span');
            open.innerText = '(';
            var close = document.createElement('span');
            close.innerText = ')';
            this.appendChild(this._inner);
            this._inner.appendChild(this._documentation);
            this._inner.appendChild(this._arrows);
            this._inner.appendChild(this._label);
            this._inner.appendChild(open);
            this._inner.appendChild(this._parameters);
            this._inner.appendChild(close);
            open = document.createElement('span');
            open.innerText = ' [';
            close = document.createElement('span');
            close.innerText = ']';
            this._inner.appendChild(open);
            this._inner.appendChild(this._count);
            this._inner.appendChild(close);
            this._inner.appendChild(this._parameterDocumentation);
        }
    }, {
        key: 'moveIndex',
        value: function moveIndex(direction) {
            if (!this._member) return;
            this._selectedIndex += direction;
            if (this._selectedIndex < 0) {
                this._selectedIndex = this._member.Signatures.length - 1;
            }
            if (this._selectedIndex > this._member.Signatures.length - 1) {
                this._selectedIndex = 0;
            }
            this._count.innerText = (this._selectedIndex + 1).toString();
            this.updateMember(this._member);
        }
    }, {
        key: '_setupArrows',
        value: function _setupArrows() {
            var _this2 = this;

            var up = document.createElement('a');
            up.classList.add('icon-arrow-up');
            up.onclick = function () {
                return _this2.moveIndex(-1);
            };
            var down = document.createElement('a');
            down.classList.add('icon-arrow-down');
            down.onclick = function () {
                return _this2.moveIndex(1);
            };
            this._arrows.appendChild(up);
            this._arrows.appendChild(down);
        }
    }, {
        key: 'setLineHeight',
        value: function setLineHeight(height) {
            this._editorLineHeight = height;
            if (this._member) this.updateMember(this._member);
        }
    }, {
        key: 'updateMember',
        value: function updateMember(member) {
            var _this3 = this;

            this._member = member;
            if (this._selectedIndex === -1) {
                this._selectedIndex = member.ActiveSignature;
                if (member.ActiveSignature === -1) {
                    this._selectedIndex = 0;
                }
            }
            var signature = member.Signatures[this._selectedIndex];
            if (!signature) return;
            var docs = void 0;
            if (signature.Documentation) docs = parseString(signature.Documentation);
            if (this._lastIndex !== this._selectedIndex) {
                this._lastIndex = this._selectedIndex;
                this._count.innerText = (this._selectedIndex + 1).toString();
                this._label.innerText = signature.Name;
                this._documentation.innerText = signature.Documentation;
                if (docs && signature.Documentation) {
                    var s = docs.getElementsByTagName('summary');
                    if (s.length) {
                        var _summary = (0, _lodash.trim)(s[0].innerHTML);
                        this._documentation.innerText = _summary;
                    } else {
                        this._documentation.innerText = '';
                        this._documentation.style.display = 'none';
                    }
                    this._documentation.style.display = '';
                } else {
                    this._documentation.innerText = '';
                    this._documentation.style.display = 'none';
                }
                if (member.Signatures.length > 1) {
                    this._arrows.style.display = '';
                } else {
                    this._arrows.style.display = 'none';
                }
                this._parametersList = [];
                var parameters = signature.Parameters;
                var parametersElement = document.createElement('span');
                (0, _lodash.each)(parameters, function (parameter, i) {
                    var view = new exports.SignatureParameterView();
                    view.setMember(parameter);
                    view.setCurrent(i === member.ActiveParameter);
                    if (i > 0) {
                        var comma = document.createElement('span');
                        comma.innerText = ', ';
                        parametersElement.appendChild(comma);
                    }
                    parametersElement.appendChild(view);
                    _this3._parametersList.push(view);
                });
                var currentElement = this._parameters;
                this._inner.insertBefore(parametersElement, currentElement);
                this._inner.removeChild(currentElement);
                this._parameters = parametersElement;
            } else {
                (0, _lodash.each)(signature.Parameters, function (param, i) {
                    return _this3._parametersList[i] && _this3._parametersList[i].setCurrent(i === member.ActiveParameter);
                });
            }
            var currentParameter = signature.Parameters[member.ActiveParameter];
            if (!currentParameter) return;
            var summary = void 0;
            if (currentParameter.Documentation) {
                var paramDocs = parseString(currentParameter.Documentation);
                if (paramDocs) {
                    var _s = paramDocs.getElementsByTagName('summary');
                    if (_s.length) {
                        var summaryElement = _s[0];
                        if (summaryElement) summary = (0, _lodash.trim)(summaryElement.innerHTML);
                    }
                }
            }
            if (docs && !summary) {
                var _s2 = docs.getElementsByTagName('param');
                if (_s2.length) {
                    var param = (0, _lodash.find)(_s2, function (x) {
                        return x.attributes['name'] && x.attributes['name'].value === currentParameter.Name;
                    });
                    if (param) {
                        summary = (0, _lodash.trim)(param.innerHTML);
                    }
                }
            }
            if (this._parameterDocumentation.innerText !== summary) {
                if (summary) {
                    this._parameterDocumentation.innerText = summary;
                } else {
                    this._parameterDocumentation.innerText = '';
                }
            }
            this.style.bottom = this.clientHeight + this._editorLineHeight + 'px';
        }
    }, {
        key: 'detachedCallback',
        value: function detachedCallback() {
            (0, _lodash.each)(this._parametersList, function (parameter) {
                return parameter.remove();
            });
            this._parametersList = [];
        }
    }]);

    return SignatureView;
}(HTMLDivElement);

exports.SignatureView = document.registerElement('omnisharp-signature-help', { prototype: SignatureView.prototype });

var SignatureParameterView = exports.SignatureParameterView = function (_HTMLSpanElement) {
    _inherits(SignatureParameterView, _HTMLSpanElement);

    function SignatureParameterView() {
        _classCallCheck(this, SignatureParameterView);

        return _possibleConstructorReturn(this, (SignatureParameterView.__proto__ || Object.getPrototypeOf(SignatureParameterView)).apply(this, arguments));
    }

    _createClass(SignatureParameterView, [{
        key: 'createdCallback',
        value: function createdCallback() {
            this._label = document.createElement('span');
            this.appendChild(this._label);
        }
    }, {
        key: 'setMember',
        value: function setMember(member) {
            this._member = member;
            this._label.innerText = member.Label;
        }
    }, {
        key: 'setCurrent',
        value: function setCurrent(current) {
            if (!current && this.style.fontWeight === 'bold') {
                this.style.fontWeight = '';
            } else if (current && this.style.fontWeight !== 'bold') {
                this.style.fontWeight = 'bold';
            }
        }
    }]);

    return SignatureParameterView;
}(HTMLSpanElement);

exports.SignatureParameterView = document.registerElement('omnisharp-signature-parameter', { prototype: SignatureParameterView.prototype });
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy9zaWduYXR1cmUtaGVscC12aWV3LnRzIiwibGliL3ZpZXdzL3NpZ25hdHVyZS1oZWxwLXZpZXcuanMiXSwibmFtZXMiOlsicGFyc2VTdHJpbmciLCJwYXJzZXIiLCJET01QYXJzZXIiLCJ4bWwiLCJwYXJzZUZyb21TdHJpbmciLCJTaWduYXR1cmVWaWV3IiwiYXJndW1lbnRzIiwiX3BhcmFtZXRlcnNMaXN0IiwiX3NlbGVjdGVkSW5kZXgiLCJfbGFzdEluZGV4IiwiX2VkaXRvckxpbmVIZWlnaHQiLCJfaW5uZXIiLCJkb2N1bWVudCIsImNyZWF0ZUVsZW1lbnQiLCJfbGFiZWwiLCJfZG9jdW1lbnRhdGlvbiIsIl9wYXJhbWV0ZXJEb2N1bWVudGF0aW9uIiwic3R5bGUiLCJtYXJnaW5MZWZ0IiwiX2Fycm93cyIsIl9wYXJhbWV0ZXJzIiwiX2NvdW50IiwiY2xhc3NMaXN0IiwiYWRkIiwiX3NldHVwQXJyb3dzIiwib3BlbiIsImlubmVyVGV4dCIsImNsb3NlIiwiYXBwZW5kQ2hpbGQiLCJkaXJlY3Rpb24iLCJfbWVtYmVyIiwiU2lnbmF0dXJlcyIsImxlbmd0aCIsInRvU3RyaW5nIiwidXBkYXRlTWVtYmVyIiwidXAiLCJvbmNsaWNrIiwibW92ZUluZGV4IiwiZG93biIsImhlaWdodCIsIm1lbWJlciIsIkFjdGl2ZVNpZ25hdHVyZSIsInNpZ25hdHVyZSIsImRvY3MiLCJEb2N1bWVudGF0aW9uIiwiTmFtZSIsInMiLCJnZXRFbGVtZW50c0J5VGFnTmFtZSIsInN1bW1hcnkiLCJpbm5lckhUTUwiLCJkaXNwbGF5IiwicGFyYW1ldGVycyIsIlBhcmFtZXRlcnMiLCJwYXJhbWV0ZXJzRWxlbWVudCIsInBhcmFtZXRlciIsImkiLCJ2aWV3IiwiZXhwb3J0cyIsIlNpZ25hdHVyZVBhcmFtZXRlclZpZXciLCJzZXRNZW1iZXIiLCJzZXRDdXJyZW50IiwiQWN0aXZlUGFyYW1ldGVyIiwiY29tbWEiLCJwdXNoIiwiY3VycmVudEVsZW1lbnQiLCJpbnNlcnRCZWZvcmUiLCJyZW1vdmVDaGlsZCIsInBhcmFtIiwiY3VycmVudFBhcmFtZXRlciIsInBhcmFtRG9jcyIsInN1bW1hcnlFbGVtZW50IiwieCIsImF0dHJpYnV0ZXMiLCJ2YWx1ZSIsImJvdHRvbSIsImNsaWVudEhlaWdodCIsInJlbW92ZSIsIkhUTUxEaXZFbGVtZW50IiwicmVnaXN0ZXJFbGVtZW50IiwicHJvdG90eXBlIiwiTGFiZWwiLCJjdXJyZW50IiwiZm9udFdlaWdodCIsIkhUTUxTcGFuRWxlbWVudCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBR0E7Ozs7Ozs7O0FBRUEsSUFBTUEsY0FBZSxZQUFBO0FBQ2pCLFFBQU1DLFNBQVMsSUFBSUMsU0FBSixFQUFmO0FBRUEsV0FBTyxVQUFVQyxHQUFWLEVBQXFCO0FBQ3hCLGVBQU9GLE9BQU9HLGVBQVAsQ0FBdUJELEdBQXZCLEVBQTRCLFVBQTVCLENBQVA7QUFDSCxLQUZEO0FBR0gsQ0FObUIsRUFBcEI7O0lBUU1FLGEsV0FBQUEsYTs7O0FBQU4sNkJBQUE7QUFBQTs7QUFBQSxtSUNKaUJDLFNESWpCOztBQU9ZLGNBQUFDLGVBQUEsR0FBNEMsRUFBNUM7QUFQWjtBQXVOQzs7OzswQ0F6TXlCO0FBQ2xCLGlCQUFLQyxjQUFMLEdBQXNCLENBQUMsQ0FBdkI7QUFDQSxpQkFBS0MsVUFBTCxHQUFrQixDQUFDLENBQW5CO0FBQ0EsaUJBQUtDLGlCQUFMLEdBQXlCLENBQXpCO0FBRUEsaUJBQUtDLE1BQUwsR0FBY0MsU0FBU0MsYUFBVCxDQUF1QixLQUF2QixDQUFkO0FBQ0EsaUJBQUtDLE1BQUwsR0FBY0YsU0FBU0MsYUFBVCxDQUF1QixNQUF2QixDQUFkO0FBQ0EsaUJBQUtFLGNBQUwsR0FBc0JILFNBQVNDLGFBQVQsQ0FBdUIsS0FBdkIsQ0FBdEI7QUFDQSxpQkFBS0csdUJBQUwsR0FBK0JKLFNBQVNDLGFBQVQsQ0FBdUIsS0FBdkIsQ0FBL0I7QUFDQSxpQkFBS0csdUJBQUwsQ0FBNkJDLEtBQTdCLENBQW1DQyxVQUFuQyxHQUFnRCxPQUFoRDtB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R0FBdUIsRUFBdkI7QUFDSDs7OztFQXROOEJzRSxjOztBQXlON0JwQixRQUFTcEQsYUFBVCxHQUErQk8sU0FBVWtFLGVBQVYsQ0FBMEIsMEJBQTFCLEVBQXNELEVBQUVDLFdBQVcxRSxjQUFjMEUsU0FBM0IsRUFBdEQsQ0FBL0I7O0lBRUFyQixzQixXQUFBQSxzQjs7Ozs7Ozs7Ozs7MENBSW9CO0FBQ2xCLGlCQUFLNUMsTUFBTCxHQUFjRixTQUFTQyxhQUFULENBQXVCLE1BQXZCLENBQWQ7QUFDQSxpQkFBS2UsV0FBTCxDQUFpQixLQUFLZCxNQUF0QjtBQUNIOzs7a0NBRWdCMEIsTSxFQUFxQztBQUNsRCxpQkFBS1YsT0FBTCxHQUFlVSxNQUFmO0FBQ0EsaUJBQUsxQixNQUFMLENBQVlZLFNBQVosR0FBd0JjLE9BQU93QyxLQUEvQjtBQUNIOzs7bUNBRWlCQyxPLEVBQWdCO0FBQzlCLGdCQUFJLENBQUNBLE9BQUQsSUFBWSxLQUFLaEUsS0FBTCxDQUFXaUUsVUFBWCxLQUEwQixNQUExQyxFQUFrRDtBQUM5QyxxQkFBS2pFLEtBQUwsQ0FBV2lFLFVBQVgsR0FBd0IsRUFBeEI7QUFDSCxhQUZELE1BRU8sSUFBSUQsV0FBVyxLQUFLaEUsS0FBTCxDQUFXaUUsVUFBWCxLQUEwQixNQUF6QyxFQUFpRDtBQUNwRCxxQkFBS2pFLEtBQUwsQ0FBV2lFLFVBQVgsR0FBd0IsTUFBeEI7QUFDSDtBQUNKOzs7O0VBcEJ1Q0MsZTs7QUF1QnRDMUIsUUFBU0Msc0JBQVQsR0FBd0M5QyxTQUFVa0UsZUFBVixDQUEwQiwrQkFBMUIsRUFBMkQsRUFBRUMsV0FBV3JCLHVCQUF1QnFCLFNBQXBDLEVBQTNELENBQXhDIiwiZmlsZSI6ImxpYi92aWV3cy9zaWduYXR1cmUtaGVscC12aWV3LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL3R5cGluZ3MuZC50c1wiIC8+XHJcbi8qIHRzbGludDpkaXNhYmxlOm5vLXN0cmluZy1saXRlcmFsICovXHJcbmltcG9ydCB7IE1vZGVscyB9IGZyb20gJ29tbmlzaGFycC1jbGllbnQnO1xyXG5pbXBvcnQgeyB0cmltLCBlYWNoLCBmaW5kIH0gZnJvbSAnbG9kYXNoJztcclxuXHJcbmNvbnN0IHBhcnNlU3RyaW5nID0gKGZ1bmN0aW9uICgpIHtcclxuICAgIGNvbnN0IHBhcnNlciA9IG5ldyBET01QYXJzZXIoKTtcclxuXHJcbiAgICByZXR1cm4gZnVuY3Rpb24gKHhtbDogc3RyaW5nKSB7XHJcbiAgICAgICAgcmV0dXJuIHBhcnNlci5wYXJzZUZyb21TdHJpbmcoeG1sLCAndGV4dC94bWwnKTtcclxuICAgIH07XHJcbn0pKCk7XHJcblxyXG5leHBvcnQgY2xhc3MgU2lnbmF0dXJlVmlldyBleHRlbmRzIEhUTUxEaXZFbGVtZW50IHsgLyogaW1wbGVtZW50cyBXZWJDb21wb25lbnQgKi9cclxuICAgIHByaXZhdGUgX21lbWJlcjogTW9kZWxzLlNpZ25hdHVyZUhlbHA7XHJcbiAgICBwcml2YXRlIF9pbm5lcjogSFRNTERpdkVsZW1lbnQ7XHJcbiAgICBwcml2YXRlIF9sYWJlbDogSFRNTFNwYW5FbGVtZW50O1xyXG4gICAgcHJpdmF0ZSBfZG9jdW1lbnRhdGlvbjogSFRNTERpdkVsZW1lbnQ7XHJcbiAgICBwcml2YXRlIF9wYXJhbWV0ZXJEb2N1bWVudGF0aW9uOiBIVE1MRGl2RWxlbWVudDtcclxuICAgIHByaXZhdGUgX2Fycm93czogSFRNTFNwYW5FbGVtZW50O1xyXG4gICAgcHJpdmF0ZSBfcGFyYW1ldGVyc0xpc3Q6IFNpZ25hdHVyZVBhcmFtZXRlclZpZXdbXSA9IFtdO1xyXG4gICAgcHJpdmF0ZSBfcGFyYW1ldGVyczogSFRNTFNwYW5FbGVtZW50O1xyXG4gICAgcHJpdmF0ZSBfY291bnQ6IEhUTUxTcGFuRWxlbWVudDtcclxuICAgIHByaXZhdGUgX3NlbGVjdGVkSW5kZXg6IG51bWJlcjtcclxuICAgIHByaXZhdGUgX2xhc3RJbmRleDogbnVtYmVyO1xyXG4gICAgcHJpdmF0ZSBfZWRpdG9yTGluZUhlaWdodDogbnVtYmVyO1xyXG5cclxuICAgIHB1YmxpYyBjcmVhdGVkQ2FsbGJhY2soKSB7XHJcbiAgICAgICAgdGhpcy5fc2VsZWN0ZWRJbmRleCA9IC0xO1xyXG4gICAgICAgIHRoaXMuX2xhc3RJbmRleCA9IC0xO1xyXG4gICAgICAgIHRoaXMuX2VkaXRvckxpbmVIZWlnaHQgPSAwO1xyXG5cclxuICAgICAgICB0aGlzLl9pbm5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICAgIHRoaXMuX2xhYmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xyXG4gICAgICAgIHRoaXMuX2RvY3VtZW50YXRpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgICB0aGlzLl9wYXJhbWV0ZXJEb2N1bWVudGF0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICAgICAgdGhpcy5fcGFyYW1ldGVyRG9jdW1lbnRhdGlvbi5zdHlsZS5tYXJnaW5MZWZ0ID0gJzIuNGVtJztcclxuICAgICAgICB0aGlzLl9hcnJvd3MgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XHJcbiAgICAgICAgdGhpcy5fcGFyYW1ldGVycyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcclxuICAgICAgICB0aGlzLl9jb3VudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcclxuICAgICAgICB0aGlzLl9wYXJhbWV0ZXJzTGlzdCA9IFtdO1xyXG5cclxuICAgICAgICB0aGlzLmNsYXNzTGlzdC5hZGQoJ3Rvb2x0aXAnKTtcclxuICAgICAgICB0aGlzLl9pbm5lci5jbGFzc0xpc3QuYWRkKCd0b29sdGlwLWlubmVyJyk7XHJcblxyXG4gICAgICAgIHRoaXMuX3NldHVwQXJyb3dzKCk7XHJcblxyXG4gICAgICAgIGxldCBvcGVuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xyXG4gICAgICAgIG9wZW4uaW5uZXJUZXh0ID0gJygnO1xyXG5cclxuICAgICAgICBsZXQgY2xvc2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XHJcbiAgICAgICAgY2xvc2UuaW5uZXJUZXh0ID0gJyknO1xyXG5cclxuICAgICAgICB0aGlzLmFwcGVuZENoaWxkKHRoaXMuX2lubmVyKTtcclxuICAgICAgICB0aGlzLl9pbm5lci5hcHBlbmRDaGlsZCh0aGlzLl9kb2N1bWVudGF0aW9uKTtcclxuXHJcbiAgICAgICAgdGhpcy5faW5uZXIuYXBwZW5kQ2hpbGQodGhpcy5fYXJyb3dzKTtcclxuXHJcbiAgICAgICAgdGhpcy5faW5uZXIuYXBwZW5kQ2hpbGQodGhpcy5fbGFiZWwpO1xyXG4gICAgICAgIHRoaXMuX2lubmVyLmFwcGVuZENoaWxkKG9wZW4pO1xyXG4gICAgICAgIHRoaXMuX2lubmVyLmFwcGVuZENoaWxkKHRoaXMuX3BhcmFtZXRlcnMpO1xyXG4gICAgICAgIHRoaXMuX2lubmVyLmFwcGVuZENoaWxkKGNsb3NlKTtcclxuXHJcbiAgICAgICAgb3BlbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcclxuICAgICAgICBvcGVuLmlubmVyVGV4dCA9ICcgWyc7XHJcblxyXG4gICAgICAgIGNsb3NlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xyXG4gICAgICAgIGNsb3NlLmlubmVyVGV4dCA9ICddJztcclxuXHJcbiAgICAgICAgdGhpcy5faW5uZXIuYXBwZW5kQ2hpbGQob3Blbik7XHJcbiAgICAgICAgdGhpcy5faW5uZXIuYXBwZW5kQ2hpbGQodGhpcy5fY291bnQpO1xyXG4gICAgICAgIHRoaXMuX2lubmVyLmFwcGVuZENoaWxkKGNsb3NlKTtcclxuXHJcbiAgICAgICAgdGhpcy5faW5uZXIuYXBwZW5kQ2hpbGQodGhpcy5fcGFyYW1ldGVyRG9jdW1lbnRhdGlvbik7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIG1vdmVJbmRleChkaXJlY3Rpb246IG51bWJlcikge1xyXG4gICAgICAgIGlmICghdGhpcy5fbWVtYmVyKSByZXR1cm47XHJcbiAgICAgICAgdGhpcy5fc2VsZWN0ZWRJbmRleCArPSBkaXJlY3Rpb247XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9zZWxlY3RlZEluZGV4IDwgMCkge1xyXG4gICAgICAgICAgICB0aGlzLl9zZWxlY3RlZEluZGV4ID0gdGhpcy5fbWVtYmVyLlNpZ25hdHVyZXMubGVuZ3RoIC0gMTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9zZWxlY3RlZEluZGV4ID4gdGhpcy5fbWVtYmVyLlNpZ25hdHVyZXMubGVuZ3RoIC0gMSkge1xyXG4gICAgICAgICAgICB0aGlzLl9zZWxlY3RlZEluZGV4ID0gMDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuX2NvdW50LmlubmVyVGV4dCA9ICh0aGlzLl9zZWxlY3RlZEluZGV4ICsgMSkudG9TdHJpbmcoKTtcclxuICAgICAgICB0aGlzLnVwZGF0ZU1lbWJlcih0aGlzLl9tZW1iZXIpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX3NldHVwQXJyb3dzKCkge1xyXG4gICAgICAgIGNvbnN0IHVwID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xyXG4gICAgICAgIHVwLmNsYXNzTGlzdC5hZGQoJ2ljb24tYXJyb3ctdXAnKTtcclxuICAgICAgICB1cC5vbmNsaWNrID0gKCkgPT4gdGhpcy5tb3ZlSW5kZXgoLTEpO1xyXG5cclxuICAgICAgICBjb25zdCBkb3duID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xyXG4gICAgICAgIGRvd24uY2xhc3NMaXN0LmFkZCgnaWNvbi1hcnJvdy1kb3duJyk7XHJcbiAgICAgICAgZG93bi5vbmNsaWNrID0gKCkgPT4gdGhpcy5tb3ZlSW5kZXgoMSk7XHJcblxyXG4gICAgICAgIHRoaXMuX2Fycm93cy5hcHBlbmRDaGlsZCh1cCk7XHJcbiAgICAgICAgdGhpcy5fYXJyb3dzLmFwcGVuZENoaWxkKGRvd24pO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzZXRMaW5lSGVpZ2h0KGhlaWdodDogbnVtYmVyKSB7XHJcbiAgICAgICAgdGhpcy5fZWRpdG9yTGluZUhlaWdodCA9IGhlaWdodDtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX21lbWJlcilcclxuICAgICAgICAgICAgdGhpcy51cGRhdGVNZW1iZXIodGhpcy5fbWVtYmVyKTtcclxuICAgIH1cclxuXHJcbiAgICAvL0BfZChtID0+IGRlYm91bmNlKG0sIDIwMCwgeyBsZWFkaW5nOiB0cnVlLCB0cmFpbGluZzogdHJ1ZSB9KSlcclxuICAgIHB1YmxpYyB1cGRhdGVNZW1iZXIobWVtYmVyOiBNb2RlbHMuU2lnbmF0dXJlSGVscCkge1xyXG4gICAgICAgIHRoaXMuX21lbWJlciA9IG1lbWJlcjtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX3NlbGVjdGVkSW5kZXggPT09IC0xKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3NlbGVjdGVkSW5kZXggPSBtZW1iZXIuQWN0aXZlU2lnbmF0dXJlO1xyXG4gICAgICAgICAgICBpZiAobWVtYmVyLkFjdGl2ZVNpZ25hdHVyZSA9PT0gLTEpIHtcclxuICAgICAgICAgICAgICAgIC8vIFRoZSBzZXJ2ZXIgYmFzaWNhbGx5IHRocmV3IHVwIGl0cyBhcm1zIGFuZCBzYWlkIGZ1Y2sgaXQuLi5cclxuICAgICAgICAgICAgICAgIHRoaXMuX3NlbGVjdGVkSW5kZXggPSAwO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBzaWduYXR1cmUgPSBtZW1iZXIuU2lnbmF0dXJlc1t0aGlzLl9zZWxlY3RlZEluZGV4XTtcclxuICAgICAgICBpZiAoIXNpZ25hdHVyZSkgcmV0dXJuO1xyXG5cclxuICAgICAgICBsZXQgZG9jczogRG9jdW1lbnQ7XHJcbiAgICAgICAgaWYgKHNpZ25hdHVyZS5Eb2N1bWVudGF0aW9uKVxyXG4gICAgICAgICAgICBkb2NzID0gcGFyc2VTdHJpbmcoc2lnbmF0dXJlLkRvY3VtZW50YXRpb24pO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5fbGFzdEluZGV4ICE9PSB0aGlzLl9zZWxlY3RlZEluZGV4KSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2xhc3RJbmRleCA9IHRoaXMuX3NlbGVjdGVkSW5kZXg7XHJcbiAgICAgICAgICAgIHRoaXMuX2NvdW50LmlubmVyVGV4dCA9ICh0aGlzLl9zZWxlY3RlZEluZGV4ICsgMSkudG9TdHJpbmcoKTtcclxuICAgICAgICAgICAgdGhpcy5fbGFiZWwuaW5uZXJUZXh0ID0gc2lnbmF0dXJlLk5hbWU7XHJcbiAgICAgICAgICAgIHRoaXMuX2RvY3VtZW50YXRpb24uaW5uZXJUZXh0ID0gc2lnbmF0dXJlLkRvY3VtZW50YXRpb247XHJcblxyXG4gICAgICAgICAgICBpZiAoZG9jcyAmJiBzaWduYXR1cmUuRG9jdW1lbnRhdGlvbikge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgczogTm9kZUxpc3RPZjxIVE1MRWxlbWVudD4gPSA8YW55PmRvY3MuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ3N1bW1hcnknKTtcclxuICAgICAgICAgICAgICAgIGlmIChzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHN1bW1hcnkgPSB0cmltKChzWzBdKS5pbm5lckhUTUwpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2RvY3VtZW50YXRpb24uaW5uZXJUZXh0ID0gc3VtbWFyeTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZG9jdW1lbnRhdGlvbi5pbm5lclRleHQgPSAnJztcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9kb2N1bWVudGF0aW9uLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5fZG9jdW1lbnRhdGlvbi5zdHlsZS5kaXNwbGF5ID0gJyc7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9kb2N1bWVudGF0aW9uLmlubmVyVGV4dCA9ICcnO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fZG9jdW1lbnRhdGlvbi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAobWVtYmVyLlNpZ25hdHVyZXMubGVuZ3RoID4gMSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fYXJyb3dzLnN0eWxlLmRpc3BsYXkgPSAnJztcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2Fycm93cy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLl9wYXJhbWV0ZXJzTGlzdCA9IFtdO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgcGFyYW1ldGVycyA9IHNpZ25hdHVyZS5QYXJhbWV0ZXJzO1xyXG4gICAgICAgICAgICBjb25zdCBwYXJhbWV0ZXJzRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcclxuICAgICAgICAgICAgZWFjaChwYXJhbWV0ZXJzLCAocGFyYW1ldGVyLCBpKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB2aWV3OiBTaWduYXR1cmVQYXJhbWV0ZXJWaWV3ID0gPGFueT5uZXcgZXhwb3J0cy5TaWduYXR1cmVQYXJhbWV0ZXJWaWV3KCk7XHJcbiAgICAgICAgICAgICAgICB2aWV3LnNldE1lbWJlcihwYXJhbWV0ZXIpO1xyXG4gICAgICAgICAgICAgICAgdmlldy5zZXRDdXJyZW50KGkgPT09IG1lbWJlci5BY3RpdmVQYXJhbWV0ZXIpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChpID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbW1hID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbW1hLmlubmVyVGV4dCA9ICcsICc7XHJcbiAgICAgICAgICAgICAgICAgICAgcGFyYW1ldGVyc0VsZW1lbnQuYXBwZW5kQ2hpbGQoY29tbWEpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHBhcmFtZXRlcnNFbGVtZW50LmFwcGVuZENoaWxkKHZpZXcpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fcGFyYW1ldGVyc0xpc3QucHVzaCh2aWV3KTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICBjb25zdCBjdXJyZW50RWxlbWVudCA9IHRoaXMuX3BhcmFtZXRlcnM7XHJcbiAgICAgICAgICAgIHRoaXMuX2lubmVyLmluc2VydEJlZm9yZShwYXJhbWV0ZXJzRWxlbWVudCwgY3VycmVudEVsZW1lbnQpO1xyXG4gICAgICAgICAgICB0aGlzLl9pbm5lci5yZW1vdmVDaGlsZChjdXJyZW50RWxlbWVudCk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLl9wYXJhbWV0ZXJzID0gcGFyYW1ldGVyc0VsZW1lbnQ7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgZWFjaChzaWduYXR1cmUuUGFyYW1ldGVycywgKHBhcmFtLCBpKSA9PlxyXG4gICAgICAgICAgICAgICAgdGhpcy5fcGFyYW1ldGVyc0xpc3RbaV0gJiYgdGhpcy5fcGFyYW1ldGVyc0xpc3RbaV0uc2V0Q3VycmVudChpID09PSBtZW1iZXIuQWN0aXZlUGFyYW1ldGVyKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBjdXJyZW50UGFyYW1ldGVyID0gc2lnbmF0dXJlLlBhcmFtZXRlcnNbbWVtYmVyLkFjdGl2ZVBhcmFtZXRlcl07XHJcbiAgICAgICAgaWYgKCFjdXJyZW50UGFyYW1ldGVyKSByZXR1cm47XHJcbiAgICAgICAgbGV0IHN1bW1hcnk6IHN0cmluZztcclxuICAgICAgICBpZiAoY3VycmVudFBhcmFtZXRlci5Eb2N1bWVudGF0aW9uKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHBhcmFtRG9jcyA9IHBhcnNlU3RyaW5nKGN1cnJlbnRQYXJhbWV0ZXIuRG9jdW1lbnRhdGlvbik7XHJcblxyXG4gICAgICAgICAgICBpZiAocGFyYW1Eb2NzKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBzOiBOb2RlTGlzdE9mPEhUTUxFbGVtZW50PiA9IDxhbnk+cGFyYW1Eb2NzLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdzdW1tYXJ5Jyk7XHJcbiAgICAgICAgICAgICAgICBpZiAocy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBzdW1tYXJ5RWxlbWVudCA9IHNbMF07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN1bW1hcnlFbGVtZW50KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdW1tYXJ5ID0gdHJpbShzdW1tYXJ5RWxlbWVudC5pbm5lckhUTUwpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoZG9jcyAmJiAhc3VtbWFyeSkge1xyXG4gICAgICAgICAgICBjb25zdCBzOiBOb2RlTGlzdE9mPEhUTUxFbGVtZW50PiA9IDxhbnk+ZG9jcy5nZXRFbGVtZW50c0J5VGFnTmFtZSgncGFyYW0nKTtcclxuICAgICAgICAgICAgaWYgKHMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBwYXJhbSA9IDxIVE1MRWxlbWVudD5maW5kKHMsIHggPT4geC5hdHRyaWJ1dGVzWyduYW1lJ10gJiYgeC5hdHRyaWJ1dGVzWyduYW1lJ10udmFsdWUgPT09IGN1cnJlbnRQYXJhbWV0ZXIuTmFtZSk7XHJcbiAgICAgICAgICAgICAgICBpZiAocGFyYW0pIHtcclxuICAgICAgICAgICAgICAgICAgICBzdW1tYXJ5ID0gdHJpbShwYXJhbS5pbm5lckhUTUwpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5fcGFyYW1ldGVyRG9jdW1lbnRhdGlvbi5pbm5lclRleHQgIT09IHN1bW1hcnkpIHtcclxuICAgICAgICAgICAgaWYgKHN1bW1hcnkpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX3BhcmFtZXRlckRvY3VtZW50YXRpb24uaW5uZXJUZXh0ID0gc3VtbWFyeTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX3BhcmFtZXRlckRvY3VtZW50YXRpb24uaW5uZXJUZXh0ID0gJyc7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5zdHlsZS5ib3R0b20gPSBgJHt0aGlzLmNsaWVudEhlaWdodCArIHRoaXMuX2VkaXRvckxpbmVIZWlnaHR9cHhgO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkZXRhY2hlZENhbGxiYWNrKCkge1xyXG4gICAgICAgIGVhY2godGhpcy5fcGFyYW1ldGVyc0xpc3QsIHBhcmFtZXRlciA9PiBwYXJhbWV0ZXIucmVtb3ZlKCkpO1xyXG4gICAgICAgIHRoaXMuX3BhcmFtZXRlcnNMaXN0ID0gW107XHJcbiAgICB9XHJcbn1cclxuXHJcbig8YW55PmV4cG9ydHMpLlNpZ25hdHVyZVZpZXcgPSAoPGFueT5kb2N1bWVudCkucmVnaXN0ZXJFbGVtZW50KCdvbW5pc2hhcnAtc2lnbmF0dXJlLWhlbHAnLCB7IHByb3RvdHlwZTogU2lnbmF0dXJlVmlldy5wcm90b3R5cGUgfSk7XHJcblxyXG5leHBvcnQgY2xhc3MgU2lnbmF0dXJlUGFyYW1ldGVyVmlldyBleHRlbmRzIEhUTUxTcGFuRWxlbWVudCB7IC8qIGltcGxlbWVudHMgV2ViQ29tcG9uZW50ICovXHJcbiAgICBwcml2YXRlIF9tZW1iZXI6IE1vZGVscy5TaWduYXR1cmVIZWxwUGFyYW1ldGVyO1xyXG4gICAgcHJpdmF0ZSBfbGFiZWw6IEhUTUxTcGFuRWxlbWVudDtcclxuXHJcbiAgICBwdWJsaWMgY3JlYXRlZENhbGxiYWNrKCkge1xyXG4gICAgICAgIHRoaXMuX2xhYmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xyXG4gICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQodGhpcy5fbGFiZWwpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzZXRNZW1iZXIobWVtYmVyOiBNb2RlbHMuU2lnbmF0dXJlSGVscFBhcmFtZXRlcikge1xyXG4gICAgICAgIHRoaXMuX21lbWJlciA9IG1lbWJlcjtcclxuICAgICAgICB0aGlzLl9sYWJlbC5pbm5lclRleHQgPSBtZW1iZXIuTGFiZWw7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHNldEN1cnJlbnQoY3VycmVudDogYm9vbGVhbikge1xyXG4gICAgICAgIGlmICghY3VycmVudCAmJiB0aGlzLnN0eWxlLmZvbnRXZWlnaHQgPT09ICdib2xkJykge1xyXG4gICAgICAgICAgICB0aGlzLnN0eWxlLmZvbnRXZWlnaHQgPSAnJztcclxuICAgICAgICB9IGVsc2UgaWYgKGN1cnJlbnQgJiYgdGhpcy5zdHlsZS5mb250V2VpZ2h0ICE9PSAnYm9sZCcpIHtcclxuICAgICAgICAgICAgdGhpcy5zdHlsZS5mb250V2VpZ2h0ID0gJ2JvbGQnO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuKDxhbnk+ZXhwb3J0cykuU2lnbmF0dXJlUGFyYW1ldGVyVmlldyA9ICg8YW55PmRvY3VtZW50KS5yZWdpc3RlckVsZW1lbnQoJ29tbmlzaGFycC1zaWduYXR1cmUtcGFyYW1ldGVyJywgeyBwcm90b3R5cGU6IFNpZ25hdHVyZVBhcmFtZXRlclZpZXcucHJvdG90eXBlIH0pO1xyXG4iLCJpbXBvcnQgeyB0cmltLCBlYWNoLCBmaW5kIH0gZnJvbSAnbG9kYXNoJztcbmNvbnN0IHBhcnNlU3RyaW5nID0gKGZ1bmN0aW9uICgpIHtcbiAgICBjb25zdCBwYXJzZXIgPSBuZXcgRE9NUGFyc2VyKCk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh4bWwpIHtcbiAgICAgICAgcmV0dXJuIHBhcnNlci5wYXJzZUZyb21TdHJpbmcoeG1sLCAndGV4dC94bWwnKTtcbiAgICB9O1xufSkoKTtcbmV4cG9ydCBjbGFzcyBTaWduYXR1cmVWaWV3IGV4dGVuZHMgSFRNTERpdkVsZW1lbnQge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlciguLi5hcmd1bWVudHMpO1xuICAgICAgICB0aGlzLl9wYXJhbWV0ZXJzTGlzdCA9IFtdO1xuICAgIH1cbiAgICBjcmVhdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMuX3NlbGVjdGVkSW5kZXggPSAtMTtcbiAgICAgICAgdGhpcy5fbGFzdEluZGV4ID0gLTE7XG4gICAgICAgIHRoaXMuX2VkaXRvckxpbmVIZWlnaHQgPSAwO1xuICAgICAgICB0aGlzLl9pbm5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICB0aGlzLl9sYWJlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICAgICAgdGhpcy5fZG9jdW1lbnRhdGlvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICB0aGlzLl9wYXJhbWV0ZXJEb2N1bWVudGF0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIHRoaXMuX3BhcmFtZXRlckRvY3VtZW50YXRpb24uc3R5bGUubWFyZ2luTGVmdCA9ICcyLjRlbSc7XG4gICAgICAgIHRoaXMuX2Fycm93cyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICAgICAgdGhpcy5fcGFyYW1ldGVycyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICAgICAgdGhpcy5fY291bnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgICAgIHRoaXMuX3BhcmFtZXRlcnNMaXN0ID0gW107XG4gICAgICAgIHRoaXMuY2xhc3NMaXN0LmFkZCgndG9vbHRpcCcpO1xuICAgICAgICB0aGlzLl9pbm5lci5jbGFzc0xpc3QuYWRkKCd0b29sdGlwLWlubmVyJyk7XG4gICAgICAgIHRoaXMuX3NldHVwQXJyb3dzKCk7XG4gICAgICAgIGxldCBvcGVuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgICAgICBvcGVuLmlubmVyVGV4dCA9ICcoJztcbiAgICAgICAgbGV0IGNsb3NlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgICAgICBjbG9zZS5pbm5lclRleHQgPSAnKSc7XG4gICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQodGhpcy5faW5uZXIpO1xuICAgICAgICB0aGlzLl9pbm5lci5hcHBlbmRDaGlsZCh0aGlzLl9kb2N1bWVudGF0aW9uKTtcbiAgICAgICAgdGhpcy5faW5uZXIuYXBwZW5kQ2hpbGQodGhpcy5fYXJyb3dzKTtcbiAgICAgICAgdGhpcy5faW5uZXIuYXBwZW5kQ2hpbGQodGhpcy5fbGFiZWwpO1xuICAgICAgICB0aGlzLl9pbm5lci5hcHBlbmRDaGlsZChvcGVuKTtcbiAgICAgICAgdGhpcy5faW5uZXIuYXBwZW5kQ2hpbGQodGhpcy5fcGFyYW1ldGVycyk7XG4gICAgICAgIHRoaXMuX2lubmVyLmFwcGVuZENoaWxkKGNsb3NlKTtcbiAgICAgICAgb3BlbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICAgICAgb3Blbi5pbm5lclRleHQgPSAnIFsnO1xuICAgICAgICBjbG9zZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICAgICAgY2xvc2UuaW5uZXJUZXh0ID0gJ10nO1xuICAgICAgICB0aGlzLl9pbm5lci5hcHBlbmRDaGlsZChvcGVuKTtcbiAgICAgICAgdGhpcy5faW5uZXIuYXBwZW5kQ2hpbGQodGhpcy5fY291bnQpO1xuICAgICAgICB0aGlzLl9pbm5lci5hcHBlbmRDaGlsZChjbG9zZSk7XG4gICAgICAgIHRoaXMuX2lubmVyLmFwcGVuZENoaWxkKHRoaXMuX3BhcmFtZXRlckRvY3VtZW50YXRpb24pO1xuICAgIH1cbiAgICBtb3ZlSW5kZXgoZGlyZWN0aW9uKSB7XG4gICAgICAgIGlmICghdGhpcy5fbWVtYmVyKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB0aGlzLl9zZWxlY3RlZEluZGV4ICs9IGRpcmVjdGlvbjtcbiAgICAgICAgaWYgKHRoaXMuX3NlbGVjdGVkSW5kZXggPCAwKSB7XG4gICAgICAgICAgICB0aGlzLl9zZWxlY3RlZEluZGV4ID0gdGhpcy5fbWVtYmVyLlNpZ25hdHVyZXMubGVuZ3RoIC0gMTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5fc2VsZWN0ZWRJbmRleCA+IHRoaXMuX21lbWJlci5TaWduYXR1cmVzLmxlbmd0aCAtIDEpIHtcbiAgICAgICAgICAgIHRoaXMuX3NlbGVjdGVkSW5kZXggPSAwO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2NvdW50LmlubmVyVGV4dCA9ICh0aGlzLl9zZWxlY3RlZEluZGV4ICsgMSkudG9TdHJpbmcoKTtcbiAgICAgICAgdGhpcy51cGRhdGVNZW1iZXIodGhpcy5fbWVtYmVyKTtcbiAgICB9XG4gICAgX3NldHVwQXJyb3dzKCkge1xuICAgICAgICBjb25zdCB1cCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcbiAgICAgICAgdXAuY2xhc3NMaXN0LmFkZCgnaWNvbi1hcnJvdy11cCcpO1xuICAgICAgICB1cC5vbmNsaWNrID0gKCkgPT4gdGhpcy5tb3ZlSW5kZXgoLTEpO1xuICAgICAgICBjb25zdCBkb3duID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuICAgICAgICBkb3duLmNsYXNzTGlzdC5hZGQoJ2ljb24tYXJyb3ctZG93bicpO1xuICAgICAgICBkb3duLm9uY2xpY2sgPSAoKSA9PiB0aGlzLm1vdmVJbmRleCgxKTtcbiAgICAgICAgdGhpcy5fYXJyb3dzLmFwcGVuZENoaWxkKHVwKTtcbiAgICAgICAgdGhpcy5fYXJyb3dzLmFwcGVuZENoaWxkKGRvd24pO1xuICAgIH1cbiAgICBzZXRMaW5lSGVpZ2h0KGhlaWdodCkge1xuICAgICAgICB0aGlzLl9lZGl0b3JMaW5lSGVpZ2h0ID0gaGVpZ2h0O1xuICAgICAgICBpZiAodGhpcy5fbWVtYmVyKVxuICAgICAgICAgICAgdGhpcy51cGRhdGVNZW1iZXIodGhpcy5fbWVtYmVyKTtcbiAgICB9XG4gICAgdXBkYXRlTWVtYmVyKG1lbWJlcikge1xuICAgICAgICB0aGlzLl9tZW1iZXIgPSBtZW1iZXI7XG4gICAgICAgIGlmICh0aGlzLl9zZWxlY3RlZEluZGV4ID09PSAtMSkge1xuICAgICAgICAgICAgdGhpcy5fc2VsZWN0ZWRJbmRleCA9IG1lbWJlci5BY3RpdmVTaWduYXR1cmU7XG4gICAgICAgICAgICBpZiAobWVtYmVyLkFjdGl2ZVNpZ25hdHVyZSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9zZWxlY3RlZEluZGV4ID0gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb25zdCBzaWduYXR1cmUgPSBtZW1iZXIuU2lnbmF0dXJlc1t0aGlzLl9zZWxlY3RlZEluZGV4XTtcbiAgICAgICAgaWYgKCFzaWduYXR1cmUpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGxldCBkb2NzO1xuICAgICAgICBpZiAoc2lnbmF0dXJlLkRvY3VtZW50YXRpb24pXG4gICAgICAgICAgICBkb2NzID0gcGFyc2VTdHJpbmcoc2lnbmF0dXJlLkRvY3VtZW50YXRpb24pO1xuICAgICAgICBpZiAodGhpcy5fbGFzdEluZGV4ICE9PSB0aGlzLl9zZWxlY3RlZEluZGV4KSB7XG4gICAgICAgICAgICB0aGlzLl9sYXN0SW5kZXggPSB0aGlzLl9zZWxlY3RlZEluZGV4O1xuICAgICAgICAgICAgdGhpcy5fY291bnQuaW5uZXJUZXh0ID0gKHRoaXMuX3NlbGVjdGVkSW5kZXggKyAxKS50b1N0cmluZygpO1xuICAgICAgICAgICAgdGhpcy5fbGFiZWwuaW5uZXJUZXh0ID0gc2lnbmF0dXJlLk5hbWU7XG4gICAgICAgICAgICB0aGlzLl9kb2N1bWVudGF0aW9uLmlubmVyVGV4dCA9IHNpZ25hdHVyZS5Eb2N1bWVudGF0aW9uO1xuICAgICAgICAgICAgaWYgKGRvY3MgJiYgc2lnbmF0dXJlLkRvY3VtZW50YXRpb24pIHtcbiAgICAgICAgICAgICAgICBjb25zdCBzID0gZG9jcy5nZXRFbGVtZW50c0J5VGFnTmFtZSgnc3VtbWFyeScpO1xuICAgICAgICAgICAgICAgIGlmIChzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzdW1tYXJ5ID0gdHJpbSgoc1swXSkuaW5uZXJIVE1MKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZG9jdW1lbnRhdGlvbi5pbm5lclRleHQgPSBzdW1tYXJ5O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZG9jdW1lbnRhdGlvbi5pbm5lclRleHQgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZG9jdW1lbnRhdGlvbi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLl9kb2N1bWVudGF0aW9uLnN0eWxlLmRpc3BsYXkgPSAnJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuX2RvY3VtZW50YXRpb24uaW5uZXJUZXh0ID0gJyc7XG4gICAgICAgICAgICAgICAgdGhpcy5fZG9jdW1lbnRhdGlvbi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG1lbWJlci5TaWduYXR1cmVzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9hcnJvd3Muc3R5bGUuZGlzcGxheSA9ICcnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fYXJyb3dzLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9wYXJhbWV0ZXJzTGlzdCA9IFtdO1xuICAgICAgICAgICAgY29uc3QgcGFyYW1ldGVycyA9IHNpZ25hdHVyZS5QYXJhbWV0ZXJzO1xuICAgICAgICAgICAgY29uc3QgcGFyYW1ldGVyc0VsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgICAgICAgICBlYWNoKHBhcmFtZXRlcnMsIChwYXJhbWV0ZXIsIGkpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCB2aWV3ID0gbmV3IGV4cG9ydHMuU2lnbmF0dXJlUGFyYW1ldGVyVmlldygpO1xuICAgICAgICAgICAgICAgIHZpZXcuc2V0TWVtYmVyKHBhcmFtZXRlcik7XG4gICAgICAgICAgICAgICAgdmlldy5zZXRDdXJyZW50KGkgPT09IG1lbWJlci5BY3RpdmVQYXJhbWV0ZXIpO1xuICAgICAgICAgICAgICAgIGlmIChpID4gMCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb21tYSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICAgICAgICAgICAgICAgICAgY29tbWEuaW5uZXJUZXh0ID0gJywgJztcbiAgICAgICAgICAgICAgICAgICAgcGFyYW1ldGVyc0VsZW1lbnQuYXBwZW5kQ2hpbGQoY29tbWEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBwYXJhbWV0ZXJzRWxlbWVudC5hcHBlbmRDaGlsZCh2aWV3KTtcbiAgICAgICAgICAgICAgICB0aGlzLl9wYXJhbWV0ZXJzTGlzdC5wdXNoKHZpZXcpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjb25zdCBjdXJyZW50RWxlbWVudCA9IHRoaXMuX3BhcmFtZXRlcnM7XG4gICAgICAgICAgICB0aGlzLl9pbm5lci5pbnNlcnRCZWZvcmUocGFyYW1ldGVyc0VsZW1lbnQsIGN1cnJlbnRFbGVtZW50KTtcbiAgICAgICAgICAgIHRoaXMuX2lubmVyLnJlbW92ZUNoaWxkKGN1cnJlbnRFbGVtZW50KTtcbiAgICAgICAgICAgIHRoaXMuX3BhcmFtZXRlcnMgPSBwYXJhbWV0ZXJzRWxlbWVudDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGVhY2goc2lnbmF0dXJlLlBhcmFtZXRlcnMsIChwYXJhbSwgaSkgPT4gdGhpcy5fcGFyYW1ldGVyc0xpc3RbaV0gJiYgdGhpcy5fcGFyYW1ldGVyc0xpc3RbaV0uc2V0Q3VycmVudChpID09PSBtZW1iZXIuQWN0aXZlUGFyYW1ldGVyKSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgY3VycmVudFBhcmFtZXRlciA9IHNpZ25hdHVyZS5QYXJhbWV0ZXJzW21lbWJlci5BY3RpdmVQYXJhbWV0ZXJdO1xuICAgICAgICBpZiAoIWN1cnJlbnRQYXJhbWV0ZXIpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGxldCBzdW1tYXJ5O1xuICAgICAgICBpZiAoY3VycmVudFBhcmFtZXRlci5Eb2N1bWVudGF0aW9uKSB7XG4gICAgICAgICAgICBjb25zdCBwYXJhbURvY3MgPSBwYXJzZVN0cmluZyhjdXJyZW50UGFyYW1ldGVyLkRvY3VtZW50YXRpb24pO1xuICAgICAgICAgICAgaWYgKHBhcmFtRG9jcykge1xuICAgICAgICAgICAgICAgIGNvbnN0IHMgPSBwYXJhbURvY3MuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ3N1bW1hcnknKTtcbiAgICAgICAgICAgICAgICBpZiAocy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3VtbWFyeUVsZW1lbnQgPSBzWzBdO1xuICAgICAgICAgICAgICAgICAgICBpZiAoc3VtbWFyeUVsZW1lbnQpXG4gICAgICAgICAgICAgICAgICAgICAgICBzdW1tYXJ5ID0gdHJpbShzdW1tYXJ5RWxlbWVudC5pbm5lckhUTUwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoZG9jcyAmJiAhc3VtbWFyeSkge1xuICAgICAgICAgICAgY29uc3QgcyA9IGRvY3MuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ3BhcmFtJyk7XG4gICAgICAgICAgICBpZiAocy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBwYXJhbSA9IGZpbmQocywgeCA9PiB4LmF0dHJpYnV0ZXNbJ25hbWUnXSAmJiB4LmF0dHJpYnV0ZXNbJ25hbWUnXS52YWx1ZSA9PT0gY3VycmVudFBhcmFtZXRlci5OYW1lKTtcbiAgICAgICAgICAgICAgICBpZiAocGFyYW0pIHtcbiAgICAgICAgICAgICAgICAgICAgc3VtbWFyeSA9IHRyaW0ocGFyYW0uaW5uZXJIVE1MKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuX3BhcmFtZXRlckRvY3VtZW50YXRpb24uaW5uZXJUZXh0ICE9PSBzdW1tYXJ5KSB7XG4gICAgICAgICAgICBpZiAoc3VtbWFyeSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3BhcmFtZXRlckRvY3VtZW50YXRpb24uaW5uZXJUZXh0ID0gc3VtbWFyeTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuX3BhcmFtZXRlckRvY3VtZW50YXRpb24uaW5uZXJUZXh0ID0gJyc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zdHlsZS5ib3R0b20gPSBgJHt0aGlzLmNsaWVudEhlaWdodCArIHRoaXMuX2VkaXRvckxpbmVIZWlnaHR9cHhgO1xuICAgIH1cbiAgICBkZXRhY2hlZENhbGxiYWNrKCkge1xuICAgICAgICBlYWNoKHRoaXMuX3BhcmFtZXRlcnNMaXN0LCBwYXJhbWV0ZXIgPT4gcGFyYW1ldGVyLnJlbW92ZSgpKTtcbiAgICAgICAgdGhpcy5fcGFyYW1ldGVyc0xpc3QgPSBbXTtcbiAgICB9XG59XG5leHBvcnRzLlNpZ25hdHVyZVZpZXcgPSBkb2N1bWVudC5yZWdpc3RlckVsZW1lbnQoJ29tbmlzaGFycC1zaWduYXR1cmUtaGVscCcsIHsgcHJvdG90eXBlOiBTaWduYXR1cmVWaWV3LnByb3RvdHlwZSB9KTtcbmV4cG9ydCBjbGFzcyBTaWduYXR1cmVQYXJhbWV0ZXJWaWV3IGV4dGVuZHMgSFRNTFNwYW5FbGVtZW50IHtcbiAgICBjcmVhdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMuX2xhYmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgICAgICB0aGlzLmFwcGVuZENoaWxkKHRoaXMuX2xhYmVsKTtcbiAgICB9XG4gICAgc2V0TWVtYmVyKG1lbWJlcikge1xuICAgICAgICB0aGlzLl9tZW1iZXIgPSBtZW1iZXI7XG4gICAgICAgIHRoaXMuX2xhYmVsLmlubmVyVGV4dCA9IG1lbWJlci5MYWJlbDtcbiAgICB9XG4gICAgc2V0Q3VycmVudChjdXJyZW50KSB7XG4gICAgICAgIGlmICghY3VycmVudCAmJiB0aGlzLnN0eWxlLmZvbnRXZWlnaHQgPT09ICdib2xkJykge1xuICAgICAgICAgICAgdGhpcy5zdHlsZS5mb250V2VpZ2h0ID0gJyc7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoY3VycmVudCAmJiB0aGlzLnN0eWxlLmZvbnRXZWlnaHQgIT09ICdib2xkJykge1xuICAgICAgICAgICAgdGhpcy5zdHlsZS5mb250V2VpZ2h0ID0gJ2JvbGQnO1xuICAgICAgICB9XG4gICAgfVxufVxuZXhwb3J0cy5TaWduYXR1cmVQYXJhbWV0ZXJWaWV3ID0gZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50KCdvbW5pc2hhcnAtc2lnbmF0dXJlLXBhcmFtZXRlcicsIHsgcHJvdG90eXBlOiBTaWduYXR1cmVQYXJhbWV0ZXJWaWV3LnByb3RvdHlwZSB9KTtcbiJdfQ==
