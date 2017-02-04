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
                (function () {
                    _this3._lastIndex = _this3._selectedIndex;
                    _this3._count.innerText = (_this3._selectedIndex + 1).toString();
                    _this3._label.innerText = signature.Name;
                    _this3._documentation.innerText = signature.Documentation;
                    if (docs && signature.Documentation) {
                        var s = docs.getElementsByTagName('summary');
                        if (s.length) {
                            var _summary = (0, _lodash.trim)(s[0].innerHTML);
                            _this3._documentation.innerText = _summary;
                        } else {
                            _this3._documentation.innerText = '';
                            _this3._documentation.style.display = 'none';
                        }
                        _this3._documentation.style.display = '';
                    } else {
                        _this3._documentation.innerText = '';
                        _this3._documentation.style.display = 'none';
                    }
                    if (member.Signatures.length > 1) {
                        _this3._arrows.style.display = '';
                    } else {
                        _this3._arrows.style.display = 'none';
                    }
                    _this3._parametersList = [];
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
                    var currentElement = _this3._parameters;
                    _this3._inner.insertBefore(parametersElement, currentElement);
                    _this3._inner.removeChild(currentElement);
                    _this3._parameters = parametersElement;
                })();
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
                    var s = paramDocs.getElementsByTagName('summary');
                    if (s.length) {
                        var summaryElement = s[0];
                        if (summaryElement) summary = (0, _lodash.trim)(summaryElement.innerHTML);
                    }
                }
            }
            if (docs && !summary) {
                var _s = docs.getElementsByTagName('param');
                if (_s.length) {
                    var param = (0, _lodash.find)(_s, function (x) {
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy9zaWduYXR1cmUtaGVscC12aWV3LnRzIiwibGliL3ZpZXdzL3NpZ25hdHVyZS1oZWxwLXZpZXcuanMiXSwibmFtZXMiOlsicGFyc2VTdHJpbmciLCJwYXJzZXIiLCJET01QYXJzZXIiLCJ4bWwiLCJwYXJzZUZyb21TdHJpbmciLCJTaWduYXR1cmVWaWV3IiwiYXJndW1lbnRzIiwiX3BhcmFtZXRlcnNMaXN0IiwiX3NlbGVjdGVkSW5kZXgiLCJfbGFzdEluZGV4IiwiX2VkaXRvckxpbmVIZWlnaHQiLCJfaW5uZXIiLCJkb2N1bWVudCIsImNyZWF0ZUVsZW1lbnQiLCJfbGFiZWwiLCJfZG9jdW1lbnRhdGlvbiIsIl9wYXJhbWV0ZXJEb2N1bWVudGF0aW9uIiwic3R5bGUiLCJtYXJnaW5MZWZ0IiwiX2Fycm93cyIsIl9wYXJhbWV0ZXJzIiwiX2NvdW50IiwiY2xhc3NMaXN0IiwiYWRkIiwiX3NldHVwQXJyb3dzIiwib3BlbiIsImlubmVyVGV4dCIsImNsb3NlIiwiYXBwZW5kQ2hpbGQiLCJkaXJlY3Rpb24iLCJfbWVtYmVyIiwiU2lnbmF0dXJlcyIsImxlbmd0aCIsInRvU3RyaW5nIiwidXBkYXRlTWVtYmVyIiwidXAiLCJvbmNsaWNrIiwibW92ZUluZGV4IiwiZG93biIsImhlaWdodCIsIm1lbWJlciIsIkFjdGl2ZVNpZ25hdHVyZSIsInNpZ25hdHVyZSIsImRvY3MiLCJEb2N1bWVudGF0aW9uIiwiTmFtZSIsInMiLCJnZXRFbGVtZW50c0J5VGFnTmFtZSIsInN1bW1hcnkiLCJpbm5lckhUTUwiLCJkaXNwbGF5IiwicGFyYW1ldGVycyIsIlBhcmFtZXRlcnMiLCJwYXJhbWV0ZXJzRWxlbWVudCIsInBhcmFtZXRlciIsImkiLCJ2aWV3IiwiZXhwb3J0cyIsIlNpZ25hdHVyZVBhcmFtZXRlclZpZXciLCJzZXRNZW1iZXIiLCJzZXRDdXJyZW50IiwiQWN0aXZlUGFyYW1ldGVyIiwiY29tbWEiLCJwdXNoIiwiY3VycmVudEVsZW1lbnQiLCJpbnNlcnRCZWZvcmUiLCJyZW1vdmVDaGlsZCIsInBhcmFtIiwiY3VycmVudFBhcmFtZXRlciIsInBhcmFtRG9jcyIsInN1bW1hcnlFbGVtZW50IiwieCIsImF0dHJpYnV0ZXMiLCJ2YWx1ZSIsImJvdHRvbSIsImNsaWVudEhlaWdodCIsInJlbW92ZSIsIkhUTUxEaXZFbGVtZW50IiwicmVnaXN0ZXJFbGVtZW50IiwicHJvdG90eXBlIiwiTGFiZWwiLCJjdXJyZW50IiwiZm9udFdlaWdodCIsIkhUTUxTcGFuRWxlbWVudCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBR0E7Ozs7Ozs7O0FBRUEsSUFBTUEsY0FBZSxZQUFBO0FBQ2pCLFFBQU1DLFNBQVMsSUFBSUMsU0FBSixFQUFmO0FBRUEsV0FBTyxVQUFVQyxHQUFWLEVBQXFCO0FBQ3hCLGVBQU9GLE9BQU9HLGVBQVAsQ0FBdUJELEdBQXZCLEVBQTRCLFVBQTVCLENBQVA7QUFDSCxLQUZEO0FBR0gsQ0FObUIsRUFBcEI7O0lBUU1FLGEsV0FBQUEsYTs7O0FBQU4sNkJBQUE7QUFBQTs7QUFBQSxtSUNKaUJDLFNESWpCOztBQU9ZLGNBQUFDLGVBQUEsR0FBNEMsRUFBNUM7QUFQWjtBQXVOQzs7OzswQ0F6TXlCO0FBQ2xCLGlCQUFLQyxjQUFMLEdBQXNCLENBQUMsQ0FBdkI7QUFDQSxpQkFBS0MsVUFBTCxHQUFrQixDQUFDLENBQW5CO0FBQ0EsaUJBQUtDLGlCQUFMLEdBQXlCLENBQXpCO0FBRUEsaUJBQUtDLE1BQUwsR0FBY0MsU0FBU0MsYUFBVCxDQUF1QixLQUF2QixDQUFkO0FBQ0EsaUJBQUtDLE1BQUwsR0FBY0YsU0FBU0MsYUFBVCxDQUF1QixNQUF2QixDQUFkO0FBQ0EsaUJBQUtFLGNBQUwsR0FBc0JILFNBQVNDLGFBQVQsQ0FBdUIsS0FBdkIsQ0FBdEI7QUFDQSxpQkFBS0csdUJBQUwsR0FBK0JKLFNBQVNDLGFBQVQsQ0FBdUIsS0FBdkIsQ0FBL0I7QUFDQSxpQkFBS0csdUJBQUwsQ0FBNkJDLEtBQTdCLENBQW1DQyxVQUFuQyxHQUFnRCxPQUFoRDtB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LGlCQUFLckUsZUFBTCxHQUF1QixFQUF2QjtBQUNIOzs7O0VBdE44QnNFLGM7O0FBeU43QnBCLFFBQVNwRCxhQUFULEdBQStCTyxTQUFVa0UsZUFBVixDQUEwQiwwQkFBMUIsRUFBc0QsRUFBRUMsV0FBVzFFLGNBQWMwRSxTQUEzQixFQUF0RCxDQUEvQjs7SUFFQXJCLHNCLFdBQUFBLHNCOzs7Ozs7Ozs7OzswQ0FJb0I7QUFDbEIsaUJBQUs1QyxNQUFMLEdBQWNGLFNBQVNDLGFBQVQsQ0FBdUIsTUFBdkIsQ0FBZDtBQUNBLGlCQUFLZSxXQUFMLENBQWlCLEtBQUtkLE1BQXRCO0FBQ0g7OztrQ0FFZ0IwQixNLEVBQXFDO0FBQ2xELGlCQUFLVixPQUFMLEdBQWVVLE1BQWY7QUFDQSxpQkFBSzFCLE1BQUwsQ0FBWVksU0FBWixHQUF3QmMsT0FBT3dDLEtBQS9CO0FBQ0g7OzttQ0FFaUJDLE8sRUFBZ0I7QUFDOUIsZ0JBQUksQ0FBQ0EsT0FBRCxJQUFZLEtBQUtoRSxLQUFMLENBQVdpRSxVQUFYLEtBQTBCLE1BQTFDLEVBQWtEO0FBQzlDLHFCQUFLakUsS0FBTCxDQUFXaUUsVUFBWCxHQUF3QixFQUF4QjtBQUNILGFBRkQsTUFFTyxJQUFJRCxXQUFXLEtBQUtoRSxLQUFMLENBQVdpRSxVQUFYLEtBQTBCLE1BQXpDLEVBQWlEO0FBQ3BELHFCQUFLakUsS0FBTCxDQUFXaUUsVUFBWCxHQUF3QixNQUF4QjtBQUNIO0FBQ0o7Ozs7RUFwQnVDQyxlOztBQXVCdEMxQixRQUFTQyxzQkFBVCxHQUF3QzlDLFNBQVVrRSxlQUFWLENBQTBCLCtCQUExQixFQUEyRCxFQUFFQyxXQUFXckIsdUJBQXVCcUIsU0FBcEMsRUFBM0QsQ0FBeEMiLCJmaWxlIjoibGliL3ZpZXdzL3NpZ25hdHVyZS1oZWxwLXZpZXcuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vdHlwaW5ncy5kLnRzXCIgLz5cclxuLyogdHNsaW50OmRpc2FibGU6bm8tc3RyaW5nLWxpdGVyYWwgKi9cclxuaW1wb3J0IHsgTW9kZWxzIH0gZnJvbSAnb21uaXNoYXJwLWNsaWVudCc7XHJcbmltcG9ydCB7IHRyaW0sIGVhY2gsIGZpbmQgfSBmcm9tICdsb2Rhc2gnO1xyXG5cclxuY29uc3QgcGFyc2VTdHJpbmcgPSAoZnVuY3Rpb24gKCkge1xyXG4gICAgY29uc3QgcGFyc2VyID0gbmV3IERPTVBhcnNlcigpO1xyXG5cclxuICAgIHJldHVybiBmdW5jdGlvbiAoeG1sOiBzdHJpbmcpIHtcclxuICAgICAgICByZXR1cm4gcGFyc2VyLnBhcnNlRnJvbVN0cmluZyh4bWwsICd0ZXh0L3htbCcpO1xyXG4gICAgfTtcclxufSkoKTtcclxuXHJcbmV4cG9ydCBjbGFzcyBTaWduYXR1cmVWaWV3IGV4dGVuZHMgSFRNTERpdkVsZW1lbnQgeyAvKiBpbXBsZW1lbnRzIFdlYkNvbXBvbmVudCAqL1xyXG4gICAgcHJpdmF0ZSBfbWVtYmVyOiBNb2RlbHMuU2lnbmF0dXJlSGVscDtcclxuICAgIHByaXZhdGUgX2lubmVyOiBIVE1MRGl2RWxlbWVudDtcclxuICAgIHByaXZhdGUgX2xhYmVsOiBIVE1MU3BhbkVsZW1lbnQ7XHJcbiAgICBwcml2YXRlIF9kb2N1bWVudGF0aW9uOiBIVE1MRGl2RWxlbWVudDtcclxuICAgIHByaXZhdGUgX3BhcmFtZXRlckRvY3VtZW50YXRpb246IEhUTUxEaXZFbGVtZW50O1xyXG4gICAgcHJpdmF0ZSBfYXJyb3dzOiBIVE1MU3BhbkVsZW1lbnQ7XHJcbiAgICBwcml2YXRlIF9wYXJhbWV0ZXJzTGlzdDogU2lnbmF0dXJlUGFyYW1ldGVyVmlld1tdID0gW107XHJcbiAgICBwcml2YXRlIF9wYXJhbWV0ZXJzOiBIVE1MU3BhbkVsZW1lbnQ7XHJcbiAgICBwcml2YXRlIF9jb3VudDogSFRNTFNwYW5FbGVtZW50O1xyXG4gICAgcHJpdmF0ZSBfc2VsZWN0ZWRJbmRleDogbnVtYmVyO1xyXG4gICAgcHJpdmF0ZSBfbGFzdEluZGV4OiBudW1iZXI7XHJcbiAgICBwcml2YXRlIF9lZGl0b3JMaW5lSGVpZ2h0OiBudW1iZXI7XHJcblxyXG4gICAgcHVibGljIGNyZWF0ZWRDYWxsYmFjaygpIHtcclxuICAgICAgICB0aGlzLl9zZWxlY3RlZEluZGV4ID0gLTE7XHJcbiAgICAgICAgdGhpcy5fbGFzdEluZGV4ID0gLTE7XHJcbiAgICAgICAgdGhpcy5fZWRpdG9yTGluZUhlaWdodCA9IDA7XHJcblxyXG4gICAgICAgIHRoaXMuX2lubmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICAgICAgdGhpcy5fbGFiZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XHJcbiAgICAgICAgdGhpcy5fZG9jdW1lbnRhdGlvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICAgIHRoaXMuX3BhcmFtZXRlckRvY3VtZW50YXRpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgICB0aGlzLl9wYXJhbWV0ZXJEb2N1bWVudGF0aW9uLnN0eWxlLm1hcmdpbkxlZnQgPSAnMi40ZW0nO1xyXG4gICAgICAgIHRoaXMuX2Fycm93cyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcclxuICAgICAgICB0aGlzLl9wYXJhbWV0ZXJzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xyXG4gICAgICAgIHRoaXMuX2NvdW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xyXG4gICAgICAgIHRoaXMuX3BhcmFtZXRlcnNMaXN0ID0gW107XHJcblxyXG4gICAgICAgIHRoaXMuY2xhc3NMaXN0LmFkZCgndG9vbHRpcCcpO1xyXG4gICAgICAgIHRoaXMuX2lubmVyLmNsYXNzTGlzdC5hZGQoJ3Rvb2x0aXAtaW5uZXInKTtcclxuXHJcbiAgICAgICAgdGhpcy5fc2V0dXBBcnJvd3MoKTtcclxuXHJcbiAgICAgICAgbGV0IG9wZW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XHJcbiAgICAgICAgb3Blbi5pbm5lclRleHQgPSAnKCc7XHJcblxyXG4gICAgICAgIGxldCBjbG9zZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcclxuICAgICAgICBjbG9zZS5pbm5lclRleHQgPSAnKSc7XHJcblxyXG4gICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQodGhpcy5faW5uZXIpO1xyXG4gICAgICAgIHRoaXMuX2lubmVyLmFwcGVuZENoaWxkKHRoaXMuX2RvY3VtZW50YXRpb24pO1xyXG5cclxuICAgICAgICB0aGlzLl9pbm5lci5hcHBlbmRDaGlsZCh0aGlzLl9hcnJvd3MpO1xyXG5cclxuICAgICAgICB0aGlzLl9pbm5lci5hcHBlbmRDaGlsZCh0aGlzLl9sYWJlbCk7XHJcbiAgICAgICAgdGhpcy5faW5uZXIuYXBwZW5kQ2hpbGQob3Blbik7XHJcbiAgICAgICAgdGhpcy5faW5uZXIuYXBwZW5kQ2hpbGQodGhpcy5fcGFyYW1ldGVycyk7XHJcbiAgICAgICAgdGhpcy5faW5uZXIuYXBwZW5kQ2hpbGQoY2xvc2UpO1xyXG5cclxuICAgICAgICBvcGVuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xyXG4gICAgICAgIG9wZW4uaW5uZXJUZXh0ID0gJyBbJztcclxuXHJcbiAgICAgICAgY2xvc2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XHJcbiAgICAgICAgY2xvc2UuaW5uZXJUZXh0ID0gJ10nO1xyXG5cclxuICAgICAgICB0aGlzLl9pbm5lci5hcHBlbmRDaGlsZChvcGVuKTtcclxuICAgICAgICB0aGlzLl9pbm5lci5hcHBlbmRDaGlsZCh0aGlzLl9jb3VudCk7XHJcbiAgICAgICAgdGhpcy5faW5uZXIuYXBwZW5kQ2hpbGQoY2xvc2UpO1xyXG5cclxuICAgICAgICB0aGlzLl9pbm5lci5hcHBlbmRDaGlsZCh0aGlzLl9wYXJhbWV0ZXJEb2N1bWVudGF0aW9uKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgbW92ZUluZGV4KGRpcmVjdGlvbjogbnVtYmVyKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLl9tZW1iZXIpIHJldHVybjtcclxuICAgICAgICB0aGlzLl9zZWxlY3RlZEluZGV4ICs9IGRpcmVjdGlvbjtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX3NlbGVjdGVkSW5kZXggPCAwKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3NlbGVjdGVkSW5kZXggPSB0aGlzLl9tZW1iZXIuU2lnbmF0dXJlcy5sZW5ndGggLSAxO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX3NlbGVjdGVkSW5kZXggPiB0aGlzLl9tZW1iZXIuU2lnbmF0dXJlcy5sZW5ndGggLSAxKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3NlbGVjdGVkSW5kZXggPSAwO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5fY291bnQuaW5uZXJUZXh0ID0gKHRoaXMuX3NlbGVjdGVkSW5kZXggKyAxKS50b1N0cmluZygpO1xyXG4gICAgICAgIHRoaXMudXBkYXRlTWVtYmVyKHRoaXMuX21lbWJlcik7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfc2V0dXBBcnJvd3MoKSB7XHJcbiAgICAgICAgY29uc3QgdXAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XHJcbiAgICAgICAgdXAuY2xhc3NMaXN0LmFkZCgnaWNvbi1hcnJvdy11cCcpO1xyXG4gICAgICAgIHVwLm9uY2xpY2sgPSAoKSA9PiB0aGlzLm1vdmVJbmRleCgtMSk7XHJcblxyXG4gICAgICAgIGNvbnN0IGRvd24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XHJcbiAgICAgICAgZG93bi5jbGFzc0xpc3QuYWRkKCdpY29uLWFycm93LWRvd24nKTtcclxuICAgICAgICBkb3duLm9uY2xpY2sgPSAoKSA9PiB0aGlzLm1vdmVJbmRleCgxKTtcclxuXHJcbiAgICAgICAgdGhpcy5fYXJyb3dzLmFwcGVuZENoaWxkKHVwKTtcclxuICAgICAgICB0aGlzLl9hcnJvd3MuYXBwZW5kQ2hpbGQoZG93bik7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHNldExpbmVIZWlnaHQoaGVpZ2h0OiBudW1iZXIpIHtcclxuICAgICAgICB0aGlzLl9lZGl0b3JMaW5lSGVpZ2h0ID0gaGVpZ2h0O1xyXG5cclxuICAgICAgICBpZiAodGhpcy5fbWVtYmVyKVxyXG4gICAgICAgICAgICB0aGlzLnVwZGF0ZU1lbWJlcih0aGlzLl9tZW1iZXIpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vQF9kKG0gPT4gZGVib3VuY2UobSwgMjAwLCB7IGxlYWRpbmc6IHRydWUsIHRyYWlsaW5nOiB0cnVlIH0pKVxyXG4gICAgcHVibGljIHVwZGF0ZU1lbWJlcihtZW1iZXI6IE1vZGVscy5TaWduYXR1cmVIZWxwKSB7XHJcbiAgICAgICAgdGhpcy5fbWVtYmVyID0gbWVtYmVyO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5fc2VsZWN0ZWRJbmRleCA9PT0gLTEpIHtcclxuICAgICAgICAgICAgdGhpcy5fc2VsZWN0ZWRJbmRleCA9IG1lbWJlci5BY3RpdmVTaWduYXR1cmU7XHJcbiAgICAgICAgICAgIGlmIChtZW1iZXIuQWN0aXZlU2lnbmF0dXJlID09PSAtMSkge1xyXG4gICAgICAgICAgICAgICAgLy8gVGhlIHNlcnZlciBiYXNpY2FsbHkgdGhyZXcgdXAgaXRzIGFybXMgYW5kIHNhaWQgZnVjayBpdC4uLlxyXG4gICAgICAgICAgICAgICAgdGhpcy5fc2VsZWN0ZWRJbmRleCA9IDA7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHNpZ25hdHVyZSA9IG1lbWJlci5TaWduYXR1cmVzW3RoaXMuX3NlbGVjdGVkSW5kZXhdO1xyXG4gICAgICAgIGlmICghc2lnbmF0dXJlKSByZXR1cm47XHJcblxyXG4gICAgICAgIGxldCBkb2NzOiBEb2N1bWVudDtcclxuICAgICAgICBpZiAoc2lnbmF0dXJlLkRvY3VtZW50YXRpb24pXHJcbiAgICAgICAgICAgIGRvY3MgPSBwYXJzZVN0cmluZyhzaWduYXR1cmUuRG9jdW1lbnRhdGlvbik7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9sYXN0SW5kZXggIT09IHRoaXMuX3NlbGVjdGVkSW5kZXgpIHtcclxuICAgICAgICAgICAgdGhpcy5fbGFzdEluZGV4ID0gdGhpcy5fc2VsZWN0ZWRJbmRleDtcclxuICAgICAgICAgICAgdGhpcy5fY291bnQuaW5uZXJUZXh0ID0gKHRoaXMuX3NlbGVjdGVkSW5kZXggKyAxKS50b1N0cmluZygpO1xyXG4gICAgICAgICAgICB0aGlzLl9sYWJlbC5pbm5lclRleHQgPSBzaWduYXR1cmUuTmFtZTtcclxuICAgICAgICAgICAgdGhpcy5fZG9jdW1lbnRhdGlvbi5pbm5lclRleHQgPSBzaWduYXR1cmUuRG9jdW1lbnRhdGlvbjtcclxuXHJcbiAgICAgICAgICAgIGlmIChkb2NzICYmIHNpZ25hdHVyZS5Eb2N1bWVudGF0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBzOiBOb2RlTGlzdE9mPEhUTUxFbGVtZW50PiA9IDxhbnk+ZG9jcy5nZXRFbGVtZW50c0J5VGFnTmFtZSgnc3VtbWFyeScpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3VtbWFyeSA9IHRyaW0oKHNbMF0pLmlubmVySFRNTCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZG9jdW1lbnRhdGlvbi5pbm5lclRleHQgPSBzdW1tYXJ5O1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9kb2N1bWVudGF0aW9uLmlubmVyVGV4dCA9ICcnO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2RvY3VtZW50YXRpb24uc3R5bGUuZGlzcGxheSA9ICdub25lJztcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLl9kb2N1bWVudGF0aW9uLnN0eWxlLmRpc3BsYXkgPSAnJztcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2RvY3VtZW50YXRpb24uaW5uZXJUZXh0ID0gJyc7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9kb2N1bWVudGF0aW9uLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChtZW1iZXIuU2lnbmF0dXJlcy5sZW5ndGggPiAxKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9hcnJvd3Muc3R5bGUuZGlzcGxheSA9ICcnO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fYXJyb3dzLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoaXMuX3BhcmFtZXRlcnNMaXN0ID0gW107XHJcblxyXG4gICAgICAgICAgICBjb25zdCBwYXJhbWV0ZXJzID0gc2lnbmF0dXJlLlBhcmFtZXRlcnM7XHJcbiAgICAgICAgICAgIGNvbnN0IHBhcmFtZXRlcnNFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xyXG4gICAgICAgICAgICBlYWNoKHBhcmFtZXRlcnMsIChwYXJhbWV0ZXIsIGkpID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHZpZXc6IFNpZ25hdHVyZVBhcmFtZXRlclZpZXcgPSA8YW55Pm5ldyBleHBvcnRzLlNpZ25hdHVyZVBhcmFtZXRlclZpZXcoKTtcclxuICAgICAgICAgICAgICAgIHZpZXcuc2V0TWVtYmVyKHBhcmFtZXRlcik7XHJcbiAgICAgICAgICAgICAgICB2aWV3LnNldEN1cnJlbnQoaSA9PT0gbWVtYmVyLkFjdGl2ZVBhcmFtZXRlcik7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGkgPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY29tbWEgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29tbWEuaW5uZXJUZXh0ID0gJywgJztcclxuICAgICAgICAgICAgICAgICAgICBwYXJhbWV0ZXJzRWxlbWVudC5hcHBlbmRDaGlsZChjb21tYSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgcGFyYW1ldGVyc0VsZW1lbnQuYXBwZW5kQ2hpbGQodmlldyk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9wYXJhbWV0ZXJzTGlzdC5wdXNoKHZpZXcpO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRFbGVtZW50ID0gdGhpcy5fcGFyYW1ldGVycztcclxuICAgICAgICAgICAgdGhpcy5faW5uZXIuaW5zZXJ0QmVmb3JlKHBhcmFtZXRlcnNFbGVtZW50LCBjdXJyZW50RWxlbWVudCk7XHJcbiAgICAgICAgICAgIHRoaXMuX2lubmVyLnJlbW92ZUNoaWxkKGN1cnJlbnRFbGVtZW50KTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuX3BhcmFtZXRlcnMgPSBwYXJhbWV0ZXJzRWxlbWVudDtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBlYWNoKHNpZ25hdHVyZS5QYXJhbWV0ZXJzLCAocGFyYW0sIGkpID0+XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9wYXJhbWV0ZXJzTGlzdFtpXSAmJiB0aGlzLl9wYXJhbWV0ZXJzTGlzdFtpXS5zZXRDdXJyZW50KGkgPT09IG1lbWJlci5BY3RpdmVQYXJhbWV0ZXIpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IGN1cnJlbnRQYXJhbWV0ZXIgPSBzaWduYXR1cmUuUGFyYW1ldGVyc1ttZW1iZXIuQWN0aXZlUGFyYW1ldGVyXTtcclxuICAgICAgICBpZiAoIWN1cnJlbnRQYXJhbWV0ZXIpIHJldHVybjtcclxuICAgICAgICBsZXQgc3VtbWFyeTogc3RyaW5nO1xyXG4gICAgICAgIGlmIChjdXJyZW50UGFyYW1ldGVyLkRvY3VtZW50YXRpb24pIHtcclxuICAgICAgICAgICAgY29uc3QgcGFyYW1Eb2NzID0gcGFyc2VTdHJpbmcoY3VycmVudFBhcmFtZXRlci5Eb2N1bWVudGF0aW9uKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChwYXJhbURvY3MpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHM6IE5vZGVMaXN0T2Y8SFRNTEVsZW1lbnQ+ID0gPGFueT5wYXJhbURvY3MuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ3N1bW1hcnknKTtcclxuICAgICAgICAgICAgICAgIGlmIChzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHN1bW1hcnlFbGVtZW50ID0gc1swXTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoc3VtbWFyeUVsZW1lbnQpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1bW1hcnkgPSB0cmltKHN1bW1hcnlFbGVtZW50LmlubmVySFRNTCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChkb2NzICYmICFzdW1tYXJ5KSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHM6IE5vZGVMaXN0T2Y8SFRNTEVsZW1lbnQ+ID0gPGFueT5kb2NzLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdwYXJhbScpO1xyXG4gICAgICAgICAgICBpZiAocy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHBhcmFtID0gPEhUTUxFbGVtZW50PmZpbmQocywgeCA9PiB4LmF0dHJpYnV0ZXNbJ25hbWUnXSAmJiB4LmF0dHJpYnV0ZXNbJ25hbWUnXS52YWx1ZSA9PT0gY3VycmVudFBhcmFtZXRlci5OYW1lKTtcclxuICAgICAgICAgICAgICAgIGlmIChwYXJhbSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHN1bW1hcnkgPSB0cmltKHBhcmFtLmlubmVySFRNTCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9wYXJhbWV0ZXJEb2N1bWVudGF0aW9uLmlubmVyVGV4dCAhPT0gc3VtbWFyeSkge1xyXG4gICAgICAgICAgICBpZiAoc3VtbWFyeSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fcGFyYW1ldGVyRG9jdW1lbnRhdGlvbi5pbm5lclRleHQgPSBzdW1tYXJ5O1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fcGFyYW1ldGVyRG9jdW1lbnRhdGlvbi5pbm5lclRleHQgPSAnJztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnN0eWxlLmJvdHRvbSA9IGAke3RoaXMuY2xpZW50SGVpZ2h0ICsgdGhpcy5fZWRpdG9yTGluZUhlaWdodH1weGA7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRldGFjaGVkQ2FsbGJhY2soKSB7XHJcbiAgICAgICAgZWFjaCh0aGlzLl9wYXJhbWV0ZXJzTGlzdCwgcGFyYW1ldGVyID0+IHBhcmFtZXRlci5yZW1vdmUoKSk7XHJcbiAgICAgICAgdGhpcy5fcGFyYW1ldGVyc0xpc3QgPSBbXTtcclxuICAgIH1cclxufVxyXG5cclxuKDxhbnk+ZXhwb3J0cykuU2lnbmF0dXJlVmlldyA9ICg8YW55PmRvY3VtZW50KS5yZWdpc3RlckVsZW1lbnQoJ29tbmlzaGFycC1zaWduYXR1cmUtaGVscCcsIHsgcHJvdG90eXBlOiBTaWduYXR1cmVWaWV3LnByb3RvdHlwZSB9KTtcclxuXHJcbmV4cG9ydCBjbGFzcyBTaWduYXR1cmVQYXJhbWV0ZXJWaWV3IGV4dGVuZHMgSFRNTFNwYW5FbGVtZW50IHsgLyogaW1wbGVtZW50cyBXZWJDb21wb25lbnQgKi9cclxuICAgIHByaXZhdGUgX21lbWJlcjogTW9kZWxzLlNpZ25hdHVyZUhlbHBQYXJhbWV0ZXI7XHJcbiAgICBwcml2YXRlIF9sYWJlbDogSFRNTFNwYW5FbGVtZW50O1xyXG5cclxuICAgIHB1YmxpYyBjcmVhdGVkQ2FsbGJhY2soKSB7XHJcbiAgICAgICAgdGhpcy5fbGFiZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XHJcbiAgICAgICAgdGhpcy5hcHBlbmRDaGlsZCh0aGlzLl9sYWJlbCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHNldE1lbWJlcihtZW1iZXI6IE1vZGVscy5TaWduYXR1cmVIZWxwUGFyYW1ldGVyKSB7XHJcbiAgICAgICAgdGhpcy5fbWVtYmVyID0gbWVtYmVyO1xyXG4gICAgICAgIHRoaXMuX2xhYmVsLmlubmVyVGV4dCA9IG1lbWJlci5MYWJlbDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2V0Q3VycmVudChjdXJyZW50OiBib29sZWFuKSB7XHJcbiAgICAgICAgaWYgKCFjdXJyZW50ICYmIHRoaXMuc3R5bGUuZm9udFdlaWdodCA9PT0gJ2JvbGQnKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc3R5bGUuZm9udFdlaWdodCA9ICcnO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoY3VycmVudCAmJiB0aGlzLnN0eWxlLmZvbnRXZWlnaHQgIT09ICdib2xkJykge1xyXG4gICAgICAgICAgICB0aGlzLnN0eWxlLmZvbnRXZWlnaHQgPSAnYm9sZCc7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG4oPGFueT5leHBvcnRzKS5TaWduYXR1cmVQYXJhbWV0ZXJWaWV3ID0gKDxhbnk+ZG9jdW1lbnQpLnJlZ2lzdGVyRWxlbWVudCgnb21uaXNoYXJwLXNpZ25hdHVyZS1wYXJhbWV0ZXInLCB7IHByb3RvdHlwZTogU2lnbmF0dXJlUGFyYW1ldGVyVmlldy5wcm90b3R5cGUgfSk7XHJcbiIsImltcG9ydCB7IHRyaW0sIGVhY2gsIGZpbmQgfSBmcm9tICdsb2Rhc2gnO1xuY29uc3QgcGFyc2VTdHJpbmcgPSAoZnVuY3Rpb24gKCkge1xuICAgIGNvbnN0IHBhcnNlciA9IG5ldyBET01QYXJzZXIoKTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHhtbCkge1xuICAgICAgICByZXR1cm4gcGFyc2VyLnBhcnNlRnJvbVN0cmluZyh4bWwsICd0ZXh0L3htbCcpO1xuICAgIH07XG59KSgpO1xuZXhwb3J0IGNsYXNzIFNpZ25hdHVyZVZpZXcgZXh0ZW5kcyBIVE1MRGl2RWxlbWVudCB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKC4uLmFyZ3VtZW50cyk7XG4gICAgICAgIHRoaXMuX3BhcmFtZXRlcnNMaXN0ID0gW107XG4gICAgfVxuICAgIGNyZWF0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdGhpcy5fc2VsZWN0ZWRJbmRleCA9IC0xO1xuICAgICAgICB0aGlzLl9sYXN0SW5kZXggPSAtMTtcbiAgICAgICAgdGhpcy5fZWRpdG9yTGluZUhlaWdodCA9IDA7XG4gICAgICAgIHRoaXMuX2lubmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIHRoaXMuX2xhYmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgICAgICB0aGlzLl9kb2N1bWVudGF0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIHRoaXMuX3BhcmFtZXRlckRvY3VtZW50YXRpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgdGhpcy5fcGFyYW1ldGVyRG9jdW1lbnRhdGlvbi5zdHlsZS5tYXJnaW5MZWZ0ID0gJzIuNGVtJztcbiAgICAgICAgdGhpcy5fYXJyb3dzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgICAgICB0aGlzLl9wYXJhbWV0ZXJzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgICAgICB0aGlzLl9jb3VudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICAgICAgdGhpcy5fcGFyYW1ldGVyc0xpc3QgPSBbXTtcbiAgICAgICAgdGhpcy5jbGFzc0xpc3QuYWRkKCd0b29sdGlwJyk7XG4gICAgICAgIHRoaXMuX2lubmVyLmNsYXNzTGlzdC5hZGQoJ3Rvb2x0aXAtaW5uZXInKTtcbiAgICAgICAgdGhpcy5fc2V0dXBBcnJvd3MoKTtcbiAgICAgICAgbGV0IG9wZW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgICAgIG9wZW4uaW5uZXJUZXh0ID0gJygnO1xuICAgICAgICBsZXQgY2xvc2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgICAgIGNsb3NlLmlubmVyVGV4dCA9ICcpJztcbiAgICAgICAgdGhpcy5hcHBlbmRDaGlsZCh0aGlzLl9pbm5lcik7XG4gICAgICAgIHRoaXMuX2lubmVyLmFwcGVuZENoaWxkKHRoaXMuX2RvY3VtZW50YXRpb24pO1xuICAgICAgICB0aGlzLl9pbm5lci5hcHBlbmRDaGlsZCh0aGlzLl9hcnJvd3MpO1xuICAgICAgICB0aGlzLl9pbm5lci5hcHBlbmRDaGlsZCh0aGlzLl9sYWJlbCk7XG4gICAgICAgIHRoaXMuX2lubmVyLmFwcGVuZENoaWxkKG9wZW4pO1xuICAgICAgICB0aGlzLl9pbm5lci5hcHBlbmRDaGlsZCh0aGlzLl9wYXJhbWV0ZXJzKTtcbiAgICAgICAgdGhpcy5faW5uZXIuYXBwZW5kQ2hpbGQoY2xvc2UpO1xuICAgICAgICBvcGVuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgICAgICBvcGVuLmlubmVyVGV4dCA9ICcgWyc7XG4gICAgICAgIGNsb3NlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgICAgICBjbG9zZS5pbm5lclRleHQgPSAnXSc7XG4gICAgICAgIHRoaXMuX2lubmVyLmFwcGVuZENoaWxkKG9wZW4pO1xuICAgICAgICB0aGlzLl9pbm5lci5hcHBlbmRDaGlsZCh0aGlzLl9jb3VudCk7XG4gICAgICAgIHRoaXMuX2lubmVyLmFwcGVuZENoaWxkKGNsb3NlKTtcbiAgICAgICAgdGhpcy5faW5uZXIuYXBwZW5kQ2hpbGQodGhpcy5fcGFyYW1ldGVyRG9jdW1lbnRhdGlvbik7XG4gICAgfVxuICAgIG1vdmVJbmRleChkaXJlY3Rpb24pIHtcbiAgICAgICAgaWYgKCF0aGlzLl9tZW1iZXIpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHRoaXMuX3NlbGVjdGVkSW5kZXggKz0gZGlyZWN0aW9uO1xuICAgICAgICBpZiAodGhpcy5fc2VsZWN0ZWRJbmRleCA8IDApIHtcbiAgICAgICAgICAgIHRoaXMuX3NlbGVjdGVkSW5kZXggPSB0aGlzLl9tZW1iZXIuU2lnbmF0dXJlcy5sZW5ndGggLSAxO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLl9zZWxlY3RlZEluZGV4ID4gdGhpcy5fbWVtYmVyLlNpZ25hdHVyZXMubGVuZ3RoIC0gMSkge1xuICAgICAgICAgICAgdGhpcy5fc2VsZWN0ZWRJbmRleCA9IDA7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fY291bnQuaW5uZXJUZXh0ID0gKHRoaXMuX3NlbGVjdGVkSW5kZXggKyAxKS50b1N0cmluZygpO1xuICAgICAgICB0aGlzLnVwZGF0ZU1lbWJlcih0aGlzLl9tZW1iZXIpO1xuICAgIH1cbiAgICBfc2V0dXBBcnJvd3MoKSB7XG4gICAgICAgIGNvbnN0IHVwID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuICAgICAgICB1cC5jbGFzc0xpc3QuYWRkKCdpY29uLWFycm93LXVwJyk7XG4gICAgICAgIHVwLm9uY2xpY2sgPSAoKSA9PiB0aGlzLm1vdmVJbmRleCgtMSk7XG4gICAgICAgIGNvbnN0IGRvd24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG4gICAgICAgIGRvd24uY2xhc3NMaXN0LmFkZCgnaWNvbi1hcnJvdy1kb3duJyk7XG4gICAgICAgIGRvd24ub25jbGljayA9ICgpID0+IHRoaXMubW92ZUluZGV4KDEpO1xuICAgICAgICB0aGlzLl9hcnJvd3MuYXBwZW5kQ2hpbGQodXApO1xuICAgICAgICB0aGlzLl9hcnJvd3MuYXBwZW5kQ2hpbGQoZG93bik7XG4gICAgfVxuICAgIHNldExpbmVIZWlnaHQoaGVpZ2h0KSB7XG4gICAgICAgIHRoaXMuX2VkaXRvckxpbmVIZWlnaHQgPSBoZWlnaHQ7XG4gICAgICAgIGlmICh0aGlzLl9tZW1iZXIpXG4gICAgICAgICAgICB0aGlzLnVwZGF0ZU1lbWJlcih0aGlzLl9tZW1iZXIpO1xuICAgIH1cbiAgICB1cGRhdGVNZW1iZXIobWVtYmVyKSB7XG4gICAgICAgIHRoaXMuX21lbWJlciA9IG1lbWJlcjtcbiAgICAgICAgaWYgKHRoaXMuX3NlbGVjdGVkSW5kZXggPT09IC0xKSB7XG4gICAgICAgICAgICB0aGlzLl9zZWxlY3RlZEluZGV4ID0gbWVtYmVyLkFjdGl2ZVNpZ25hdHVyZTtcbiAgICAgICAgICAgIGlmIChtZW1iZXIuQWN0aXZlU2lnbmF0dXJlID09PSAtMSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3NlbGVjdGVkSW5kZXggPSAwO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHNpZ25hdHVyZSA9IG1lbWJlci5TaWduYXR1cmVzW3RoaXMuX3NlbGVjdGVkSW5kZXhdO1xuICAgICAgICBpZiAoIXNpZ25hdHVyZSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgbGV0IGRvY3M7XG4gICAgICAgIGlmIChzaWduYXR1cmUuRG9jdW1lbnRhdGlvbilcbiAgICAgICAgICAgIGRvY3MgPSBwYXJzZVN0cmluZyhzaWduYXR1cmUuRG9jdW1lbnRhdGlvbik7XG4gICAgICAgIGlmICh0aGlzLl9sYXN0SW5kZXggIT09IHRoaXMuX3NlbGVjdGVkSW5kZXgpIHtcbiAgICAgICAgICAgIHRoaXMuX2xhc3RJbmRleCA9IHRoaXMuX3NlbGVjdGVkSW5kZXg7XG4gICAgICAgICAgICB0aGlzLl9jb3VudC5pbm5lclRleHQgPSAodGhpcy5fc2VsZWN0ZWRJbmRleCArIDEpLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICB0aGlzLl9sYWJlbC5pbm5lclRleHQgPSBzaWduYXR1cmUuTmFtZTtcbiAgICAgICAgICAgIHRoaXMuX2RvY3VtZW50YXRpb24uaW5uZXJUZXh0ID0gc2lnbmF0dXJlLkRvY3VtZW50YXRpb247XG4gICAgICAgICAgICBpZiAoZG9jcyAmJiBzaWduYXR1cmUuRG9jdW1lbnRhdGlvbikge1xuICAgICAgICAgICAgICAgIGNvbnN0IHMgPSBkb2NzLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdzdW1tYXJ5Jyk7XG4gICAgICAgICAgICAgICAgaWYgKHMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHN1bW1hcnkgPSB0cmltKChzWzBdKS5pbm5lckhUTUwpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9kb2N1bWVudGF0aW9uLmlubmVyVGV4dCA9IHN1bW1hcnk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9kb2N1bWVudGF0aW9uLmlubmVyVGV4dCA9ICcnO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9kb2N1bWVudGF0aW9uLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuX2RvY3VtZW50YXRpb24uc3R5bGUuZGlzcGxheSA9ICcnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fZG9jdW1lbnRhdGlvbi5pbm5lclRleHQgPSAnJztcbiAgICAgICAgICAgICAgICB0aGlzLl9kb2N1bWVudGF0aW9uLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAobWVtYmVyLlNpZ25hdHVyZXMubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2Fycm93cy5zdHlsZS5kaXNwbGF5ID0gJyc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9hcnJvd3Muc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX3BhcmFtZXRlcnNMaXN0ID0gW107XG4gICAgICAgICAgICBjb25zdCBwYXJhbWV0ZXJzID0gc2lnbmF0dXJlLlBhcmFtZXRlcnM7XG4gICAgICAgICAgICBjb25zdCBwYXJhbWV0ZXJzRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICAgICAgICAgIGVhY2gocGFyYW1ldGVycywgKHBhcmFtZXRlciwgaSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHZpZXcgPSBuZXcgZXhwb3J0cy5TaWduYXR1cmVQYXJhbWV0ZXJWaWV3KCk7XG4gICAgICAgICAgICAgICAgdmlldy5zZXRNZW1iZXIocGFyYW1ldGVyKTtcbiAgICAgICAgICAgICAgICB2aWV3LnNldEN1cnJlbnQoaSA9PT0gbWVtYmVyLkFjdGl2ZVBhcmFtZXRlcik7XG4gICAgICAgICAgICAgICAgaWYgKGkgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbW1hID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgICAgICAgICAgICAgICAgICBjb21tYS5pbm5lclRleHQgPSAnLCAnO1xuICAgICAgICAgICAgICAgICAgICBwYXJhbWV0ZXJzRWxlbWVudC5hcHBlbmRDaGlsZChjb21tYSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHBhcmFtZXRlcnNFbGVtZW50LmFwcGVuZENoaWxkKHZpZXcpO1xuICAgICAgICAgICAgICAgIHRoaXMuX3BhcmFtZXRlcnNMaXN0LnB1c2godmlldyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRFbGVtZW50ID0gdGhpcy5fcGFyYW1ldGVycztcbiAgICAgICAgICAgIHRoaXMuX2lubmVyLmluc2VydEJlZm9yZShwYXJhbWV0ZXJzRWxlbWVudCwgY3VycmVudEVsZW1lbnQpO1xuICAgICAgICAgICAgdGhpcy5faW5uZXIucmVtb3ZlQ2hpbGQoY3VycmVudEVsZW1lbnQpO1xuICAgICAgICAgICAgdGhpcy5fcGFyYW1ldGVycyA9IHBhcmFtZXRlcnNFbGVtZW50O1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZWFjaChzaWduYXR1cmUuUGFyYW1ldGVycywgKHBhcmFtLCBpKSA9PiB0aGlzLl9wYXJhbWV0ZXJzTGlzdFtpXSAmJiB0aGlzLl9wYXJhbWV0ZXJzTGlzdFtpXS5zZXRDdXJyZW50KGkgPT09IG1lbWJlci5BY3RpdmVQYXJhbWV0ZXIpKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBjdXJyZW50UGFyYW1ldGVyID0gc2lnbmF0dXJlLlBhcmFtZXRlcnNbbWVtYmVyLkFjdGl2ZVBhcmFtZXRlcl07XG4gICAgICAgIGlmICghY3VycmVudFBhcmFtZXRlcilcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgbGV0IHN1bW1hcnk7XG4gICAgICAgIGlmIChjdXJyZW50UGFyYW1ldGVyLkRvY3VtZW50YXRpb24pIHtcbiAgICAgICAgICAgIGNvbnN0IHBhcmFtRG9jcyA9IHBhcnNlU3RyaW5nKGN1cnJlbnRQYXJhbWV0ZXIuRG9jdW1lbnRhdGlvbik7XG4gICAgICAgICAgICBpZiAocGFyYW1Eb2NzKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcyA9IHBhcmFtRG9jcy5nZXRFbGVtZW50c0J5VGFnTmFtZSgnc3VtbWFyeScpO1xuICAgICAgICAgICAgICAgIGlmIChzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzdW1tYXJ5RWxlbWVudCA9IHNbMF07XG4gICAgICAgICAgICAgICAgICAgIGlmIChzdW1tYXJ5RWxlbWVudClcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1bW1hcnkgPSB0cmltKHN1bW1hcnlFbGVtZW50LmlubmVySFRNTCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChkb2NzICYmICFzdW1tYXJ5KSB7XG4gICAgICAgICAgICBjb25zdCBzID0gZG9jcy5nZXRFbGVtZW50c0J5VGFnTmFtZSgncGFyYW0nKTtcbiAgICAgICAgICAgIGlmIChzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHBhcmFtID0gZmluZChzLCB4ID0+IHguYXR0cmlidXRlc1snbmFtZSddICYmIHguYXR0cmlidXRlc1snbmFtZSddLnZhbHVlID09PSBjdXJyZW50UGFyYW1ldGVyLk5hbWUpO1xuICAgICAgICAgICAgICAgIGlmIChwYXJhbSkge1xuICAgICAgICAgICAgICAgICAgICBzdW1tYXJ5ID0gdHJpbShwYXJhbS5pbm5lckhUTUwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5fcGFyYW1ldGVyRG9jdW1lbnRhdGlvbi5pbm5lclRleHQgIT09IHN1bW1hcnkpIHtcbiAgICAgICAgICAgIGlmIChzdW1tYXJ5KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fcGFyYW1ldGVyRG9jdW1lbnRhdGlvbi5pbm5lclRleHQgPSBzdW1tYXJ5O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fcGFyYW1ldGVyRG9jdW1lbnRhdGlvbi5pbm5lclRleHQgPSAnJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLnN0eWxlLmJvdHRvbSA9IGAke3RoaXMuY2xpZW50SGVpZ2h0ICsgdGhpcy5fZWRpdG9yTGluZUhlaWdodH1weGA7XG4gICAgfVxuICAgIGRldGFjaGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIGVhY2godGhpcy5fcGFyYW1ldGVyc0xpc3QsIHBhcmFtZXRlciA9PiBwYXJhbWV0ZXIucmVtb3ZlKCkpO1xuICAgICAgICB0aGlzLl9wYXJhbWV0ZXJzTGlzdCA9IFtdO1xuICAgIH1cbn1cbmV4cG9ydHMuU2lnbmF0dXJlVmlldyA9IGRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudCgnb21uaXNoYXJwLXNpZ25hdHVyZS1oZWxwJywgeyBwcm90b3R5cGU6IFNpZ25hdHVyZVZpZXcucHJvdG90eXBlIH0pO1xuZXhwb3J0IGNsYXNzIFNpZ25hdHVyZVBhcmFtZXRlclZpZXcgZXh0ZW5kcyBIVE1MU3BhbkVsZW1lbnQge1xuICAgIGNyZWF0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdGhpcy5fbGFiZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQodGhpcy5fbGFiZWwpO1xuICAgIH1cbiAgICBzZXRNZW1iZXIobWVtYmVyKSB7XG4gICAgICAgIHRoaXMuX21lbWJlciA9IG1lbWJlcjtcbiAgICAgICAgdGhpcy5fbGFiZWwuaW5uZXJUZXh0ID0gbWVtYmVyLkxhYmVsO1xuICAgIH1cbiAgICBzZXRDdXJyZW50KGN1cnJlbnQpIHtcbiAgICAgICAgaWYgKCFjdXJyZW50ICYmIHRoaXMuc3R5bGUuZm9udFdlaWdodCA9PT0gJ2JvbGQnKSB7XG4gICAgICAgICAgICB0aGlzLnN0eWxlLmZvbnRXZWlnaHQgPSAnJztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChjdXJyZW50ICYmIHRoaXMuc3R5bGUuZm9udFdlaWdodCAhPT0gJ2JvbGQnKSB7XG4gICAgICAgICAgICB0aGlzLnN0eWxlLmZvbnRXZWlnaHQgPSAnYm9sZCc7XG4gICAgICAgIH1cbiAgICB9XG59XG5leHBvcnRzLlNpZ25hdHVyZVBhcmFtZXRlclZpZXcgPSBkb2N1bWVudC5yZWdpc3RlckVsZW1lbnQoJ29tbmlzaGFycC1zaWduYXR1cmUtcGFyYW1ldGVyJywgeyBwcm90b3R5cGU6IFNpZ25hdHVyZVBhcmFtZXRlclZpZXcucHJvdG90eXBlIH0pO1xuIl19
