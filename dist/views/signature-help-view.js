"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.SignatureParameterView = exports.SignatureView = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var fastdom = require("fastdom");

var parseString = function () {
    var parser = new DOMParser();
    return function (xml) {
        return parser.parseFromString(xml, "text/xml");
    };
}();

var SignatureView = exports.SignatureView = function (_HTMLDivElement) {
    _inherits(SignatureView, _HTMLDivElement);

    function SignatureView() {
        var _ref;

        _classCallCheck(this, SignatureView);

        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
        }

        var _this = _possibleConstructorReturn(this, (_ref = SignatureView.__proto__ || Object.getPrototypeOf(SignatureView)).call.apply(_ref, [this].concat(args)));

        _this._parametersList = [];
        return _this;
    }

    _createClass(SignatureView, [{
        key: "createdCallback",
        value: function createdCallback() {
            this._selectedIndex = -1;
            this._lastIndex = -1;
            this._editorLineHeight = 0;
            this._inner = document.createElement("div");
            this._label = document.createElement("span");
            this._documentation = document.createElement("div");
            this._parameterDocumentation = document.createElement("div");
            this._parameterDocumentation.style.marginLeft = "2.4em";
            this._arrows = document.createElement("span");
            this._parameters = document.createElement("span");
            this._count = document.createElement("span");
            this._parametersList = [];
            this.classList.add("tooltip");
            this._inner.classList.add("tooltip-inner");
            this._setupArrows();
            var open = document.createElement("span");
            open.innerText = "(";
            var close = document.createElement("span");
            close.innerText = ")";
            this.appendChild(this._inner);
            this._inner.appendChild(this._documentation);
            this._inner.appendChild(this._arrows);
            this._inner.appendChild(this._label);
            this._inner.appendChild(open);
            this._inner.appendChild(this._parameters);
            this._inner.appendChild(close);
            open = document.createElement("span");
            open.innerText = " [";
            close = document.createElement("span");
            close.innerText = "]";
            this._inner.appendChild(open);
            this._inner.appendChild(this._count);
            this._inner.appendChild(close);
            this._inner.appendChild(this._parameterDocumentation);
        }
    }, {
        key: "moveIndex",
        value: function moveIndex(direction) {
            var _this2 = this;

            if (!this._member) return;
            this._selectedIndex += direction;
            if (this._selectedIndex < 0) {
                this._selectedIndex = this._member.Signatures.length - 1;
            }
            if (this._selectedIndex > this._member.Signatures.length - 1) {
                this._selectedIndex = 0;
            }
            fastdom.mutate(function () {
                return _this2._count.innerText = (_this2._selectedIndex + 1).toString();
            });
            this.updateMember(this._member);
        }
    }, {
        key: "_setupArrows",
        value: function _setupArrows() {
            var _this3 = this;

            var up = document.createElement("a");
            up.classList.add("icon-arrow-up");
            up.onclick = function () {
                return _this3.moveIndex(-1);
            };
            var down = document.createElement("a");
            down.classList.add("icon-arrow-down");
            down.onclick = function () {
                return _this3.moveIndex(1);
            };
            this._arrows.appendChild(up);
            this._arrows.appendChild(down);
        }
    }, {
        key: "setLineHeight",
        value: function setLineHeight(height) {
            this._editorLineHeight = height;
            if (this._member) this.updateMember(this._member);
        }
    }, {
        key: "updateMember",
        value: function updateMember(member) {
            var _this4 = this;

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
                fastdom.mutate(function () {
                    _this4._count.innerText = (_this4._selectedIndex + 1).toString();
                    _this4._label.innerText = signature.Name;
                    _this4._documentation.innerText = signature.Documentation;
                    if (docs && signature.Documentation) {
                        var s = docs.getElementsByTagName("summary");
                        if (s.length) {
                            var summary = _lodash2.default.trim(s[0].innerHTML);
                            _this4._documentation.innerText = summary;
                        } else {
                            _this4._documentation.innerText = "";
                            _this4._documentation.style.display = "none";
                        }
                        _this4._documentation.style.display = "";
                    } else {
                        _this4._documentation.innerText = "";
                        _this4._documentation.style.display = "none";
                    }
                    if (member.Signatures.length > 1) {
                        _this4._arrows.style.display = "";
                    } else {
                        _this4._arrows.style.display = "none";
                    }
                });
                this._parametersList = [];
                fastdom.mutate(function () {
                    var parameters = signature.Parameters;
                    var parametersElement = document.createElement("span");
                    _lodash2.default.each(parameters, function (parameter, i) {
                        var view = new exports.SignatureParameterView();
                        view.setMember(parameter);
                        view.setCurrent(i === member.ActiveParameter);
                        if (i > 0) {
                            var comma = document.createElement("span");
                            comma.innerText = ", ";
                            parametersElement.appendChild(comma);
                        }
                        parametersElement.appendChild(view);
                        _this4._parametersList.push(view);
                    });
                    var currentElement = _this4._parameters;
                    _this4._inner.insertBefore(parametersElement, currentElement);
                    _this4._inner.removeChild(currentElement);
                    _this4._parameters = parametersElement;
                });
            } else {
                fastdom.mutate(function () {
                    _lodash2.default.each(signature.Parameters, function (param, i) {
                        return _this4._parametersList[i] && _this4._parametersList[i].setCurrent(i === member.ActiveParameter);
                    });
                });
            }
            var currentParameter = signature.Parameters[member.ActiveParameter];
            fastdom.measure(function () {
                if (!currentParameter) return;
                var summary = void 0;
                if (currentParameter.Documentation) {
                    var paramDocs = parseString(currentParameter.Documentation);
                    if (paramDocs) {
                        var s = paramDocs.getElementsByTagName("summary");
                        if (s.length) {
                            var summaryElement = s[0];
                            if (summaryElement) summary = _lodash2.default.trim(summaryElement.innerHTML);
                        }
                    }
                }
                if (docs && !summary) {
                    var _s = docs.getElementsByTagName("param");
                    if (_s.length) {
                        var param = _lodash2.default.find(_s, function (x) {
                            return x.attributes["name"] && x.attributes["name"].value === currentParameter.Name;
                        });
                        if (param) {
                            summary = _lodash2.default.trim(param.innerHTML);
                        }
                    }
                }
                if (_this4._parameterDocumentation.innerText !== summary) {
                    if (summary) {
                        _this4._parameterDocumentation.innerText = summary;
                    } else {
                        _this4._parameterDocumentation.innerText = "";
                    }
                }
            });
            fastdom.mutate(function () {
                return _this4.style.bottom = _this4.clientHeight + _this4._editorLineHeight + "px";
            });
        }
    }, {
        key: "detachedCallback",
        value: function detachedCallback() {
            _lodash2.default.each(this._parametersList, function (parameter) {
                return parameter.remove();
            });
            this._parametersList = [];
        }
    }]);

    return SignatureView;
}(HTMLDivElement);

exports.SignatureView = document.registerElement("omnisharp-signature-help", { prototype: SignatureView.prototype });

var SignatureParameterView = exports.SignatureParameterView = function (_HTMLSpanElement) {
    _inherits(SignatureParameterView, _HTMLSpanElement);

    function SignatureParameterView() {
        _classCallCheck(this, SignatureParameterView);

        return _possibleConstructorReturn(this, (SignatureParameterView.__proto__ || Object.getPrototypeOf(SignatureParameterView)).apply(this, arguments));
    }

    _createClass(SignatureParameterView, [{
        key: "createdCallback",
        value: function createdCallback() {
            this._label = document.createElement("span");
            this.appendChild(this._label);
        }
    }, {
        key: "setMember",
        value: function setMember(member) {
            this._member = member;
            this._label.innerText = member.Label;
        }
    }, {
        key: "setCurrent",
        value: function setCurrent(current) {
            var _this6 = this;

            fastdom.measure(function () {
                if (!current && _this6.style.fontWeight === "bold") {
                    fastdom.mutate(function () {
                        return _this6.style.fontWeight = "";
                    });
                } else if (current && _this6.style.fontWeight !== "bold") {
                    fastdom.mutate(function () {
                        return _this6.style.fontWeight = "bold";
                    });
                }
            });
        }
    }]);

    return SignatureParameterView;
}(HTMLSpanElement);

exports.SignatureParameterView = document.registerElement("omnisharp-signature-parameter", { prototype: SignatureParameterView.prototype });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy9zaWduYXR1cmUtaGVscC12aWV3LmpzIiwibGliL3ZpZXdzL3NpZ25hdHVyZS1oZWxwLXZpZXcudHMiXSwibmFtZXMiOlsiZmFzdGRvbSIsInJlcXVpcmUiLCJwYXJzZVN0cmluZyIsInBhcnNlciIsIkRPTVBhcnNlciIsInhtbCIsInBhcnNlRnJvbVN0cmluZyIsIlNpZ25hdHVyZVZpZXciLCJhcmdzIiwiX3BhcmFtZXRlcnNMaXN0IiwiX3NlbGVjdGVkSW5kZXgiLCJfbGFzdEluZGV4IiwiX2VkaXRvckxpbmVIZWlnaHQiLCJfaW5uZXIiLCJkb2N1bWVudCIsImNyZWF0ZUVsZW1lbnQiLCJfbGFiZWwiLCJfZG9jdW1lbnRhdGlvbiIsIl9wYXJhbWV0ZXJEb2N1bWVudGF0aW9uIiwic3R5bGUiLCJtYXJnaW5MZWZ0IiwiX2Fycm93cyIsIl9wYXJhbWV0ZXJzIiwiX2NvdW50IiwiY2xhc3NMaXN0IiwiYWRkIiwiX3NldHVwQXJyb3dzIiwib3BlbiIsImlubmVyVGV4dCIsImNsb3NlIiwiYXBwZW5kQ2hpbGQiLCJkaXJlY3Rpb24iLCJfbWVtYmVyIiwiU2lnbmF0dXJlcyIsImxlbmd0aCIsIm11dGF0ZSIsInRvU3RyaW5nIiwidXBkYXRlTWVtYmVyIiwidXAiLCJvbmNsaWNrIiwibW92ZUluZGV4IiwiZG93biIsImhlaWdodCIsIm1lbWJlciIsIkFjdGl2ZVNpZ25hdHVyZSIsInNpZ25hdHVyZSIsImRvY3MiLCJEb2N1bWVudGF0aW9uIiwiTmFtZSIsInMiLCJnZXRFbGVtZW50c0J5VGFnTmFtZSIsInN1bW1hcnkiLCJ0cmltIiwiaW5uZXJIVE1MIiwiZGlzcGxheSIsInBhcmFtZXRlcnMiLCJQYXJhbWV0ZXJzIiwicGFyYW1ldGVyc0VsZW1lbnQiLCJlYWNoIiwicGFyYW1ldGVyIiwiaSIsInZpZXciLCJleHBvcnRzIiwiU2lnbmF0dXJlUGFyYW1ldGVyVmlldyIsInNldE1lbWJlciIsInNldEN1cnJlbnQiLCJBY3RpdmVQYXJhbWV0ZXIiLCJjb21tYSIsInB1c2giLCJjdXJyZW50RWxlbWVudCIsImluc2VydEJlZm9yZSIsInJlbW92ZUNoaWxkIiwicGFyYW0iLCJjdXJyZW50UGFyYW1ldGVyIiwibWVhc3VyZSIsInBhcmFtRG9jcyIsInN1bW1hcnlFbGVtZW50IiwiZmluZCIsIngiLCJhdHRyaWJ1dGVzIiwidmFsdWUiLCJib3R0b20iLCJjbGllbnRIZWlnaHQiLCJyZW1vdmUiLCJIVE1MRGl2RWxlbWVudCIsInJlZ2lzdGVyRWxlbWVudCIsInByb3RvdHlwZSIsIkxhYmVsIiwiY3VycmVudCIsImZvbnRXZWlnaHQiLCJIVE1MU3BhbkVsZW1lbnQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUNBOzs7Ozs7Ozs7Ozs7QUNFQSxJQUFJQSxVQUEwQkMsUUFBUSxTQUFSLENBQTlCOztBQUdBLElBQU1DLGNBQWUsWUFBQTtBQUNqQixRQUFNQyxTQUFTLElBQUlDLFNBQUosRUFBZjtBQUVBLFdBQU8sVUFBU0MsR0FBVCxFQUFvQjtBQUN2QixlQUFPRixPQUFPRyxlQUFQLENBQXVCRCxHQUF2QixFQUE0QixVQUE1QixDQUFQO0FBQ0gsS0FGRDtBQUdILENBTm1CLEVBQXBCOztJQVFBRSxhLFdBQUFBLGE7OztBQUFBLDZCQUFBO0FBQUE7O0FBQUE7O0FBQUEsMENBQUFDLElBQUE7QUFBQUEsZ0JBQUE7QUFBQTs7QUFBQSw2SkFBbUNBLElBQW5DOztBQU9ZLGNBQUFDLGVBQUEsR0FBNEMsRUFBNUM7QUFQWjtBQWdPQzs7OzswQ0FsTnlCO0FBQ2xCLGlCQUFLQyxjQUFMLEdBQXNCLENBQUMsQ0FBdkI7QUFDQSxpQkFBS0MsVUFBTCxHQUFrQixDQUFDLENBQW5CO0FBQ0EsaUJBQUtDLGlCQUFMLEdBQXlCLENBQXpCO0FBRUEsaUJBQUtDLE1BQUwsR0FBY0MsU0FBU0MsYUFBVCxDQUF1QixLQUF2QixDQUFkO0FBQ0EsaUJBQUtDLE1BQUwsR0FBY0YsU0FBU0MsYUFBVCxDQUF1QixNQUF2QixDQUFkO0FBQ0EsaUJBQUtFLGNBQUwsR0FBc0JILFNBQVND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LG9CQUFJLENBQUNjLE9BQUQsSUFBWSxPQUFLckUsS0FBTCxDQUFXc0UsVUFBWCxLQUEwQixNQUExQyxFQUFrRDtBQUM5Q3pGLDRCQUFRbUMsTUFBUixDQUFlO0FBQUEsK0JBQU0sT0FBS2hCLEtBQUwsQ0FBV3NFLFVBQVgsR0FBd0IsRUFBOUI7QUFBQSxxQkFBZjtBQUNILGlCQUZELE1BRU8sSUFBSUQsV0FBVyxPQUFLckUsS0FBTCxDQUFXc0UsVUFBWCxLQUEwQixNQUF6QyxFQUFpRDtBQUNwRHpGLDRCQUFRbUMsTUFBUixDQUFlO0FBQUEsK0JBQU0sT0FBS2hCLEtBQUwsQ0FBV3NFLFVBQVgsR0FBd0IsTUFBOUI7QUFBQSxxQkFBZjtBQUNIO0FBQ0osYUFORDtBQU9IOzs7O0VBdEJ1Q0MsZTs7QUF5QnRDNUIsUUFBU0Msc0JBQVQsR0FBd0NqRCxTQUFVdUUsZUFBVixDQUEwQiwrQkFBMUIsRUFBMkQsRUFBRUMsV0FBV3ZCLHVCQUF1QnVCLFNBQXBDLEVBQTNELENBQXhDIiwiZmlsZSI6ImxpYi92aWV3cy9zaWduYXR1cmUtaGVscC12aWV3LmpzIiwic291cmNlc0NvbnRlbnQiOlsibGV0IGZhc3Rkb20gPSByZXF1aXJlKFwiZmFzdGRvbVwiKTtcbmltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcbmNvbnN0IHBhcnNlU3RyaW5nID0gKGZ1bmN0aW9uICgpIHtcbiAgICBjb25zdCBwYXJzZXIgPSBuZXcgRE9NUGFyc2VyKCk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh4bWwpIHtcbiAgICAgICAgcmV0dXJuIHBhcnNlci5wYXJzZUZyb21TdHJpbmcoeG1sLCBcInRleHQveG1sXCIpO1xuICAgIH07XG59KSgpO1xuZXhwb3J0IGNsYXNzIFNpZ25hdHVyZVZpZXcgZXh0ZW5kcyBIVE1MRGl2RWxlbWVudCB7XG4gICAgY29uc3RydWN0b3IoLi4uYXJncykge1xuICAgICAgICBzdXBlciguLi5hcmdzKTtcbiAgICAgICAgdGhpcy5fcGFyYW1ldGVyc0xpc3QgPSBbXTtcbiAgICB9XG4gICAgY3JlYXRlZENhbGxiYWNrKCkge1xuICAgICAgICB0aGlzLl9zZWxlY3RlZEluZGV4ID0gLTE7XG4gICAgICAgIHRoaXMuX2xhc3RJbmRleCA9IC0xO1xuICAgICAgICB0aGlzLl9lZGl0b3JMaW5lSGVpZ2h0ID0gMDtcbiAgICAgICAgdGhpcy5faW5uZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICB0aGlzLl9sYWJlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICB0aGlzLl9kb2N1bWVudGF0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgdGhpcy5fcGFyYW1ldGVyRG9jdW1lbnRhdGlvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgIHRoaXMuX3BhcmFtZXRlckRvY3VtZW50YXRpb24uc3R5bGUubWFyZ2luTGVmdCA9IFwiMi40ZW1cIjtcbiAgICAgICAgdGhpcy5fYXJyb3dzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICAgIHRoaXMuX3BhcmFtZXRlcnMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgdGhpcy5fY291bnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgdGhpcy5fcGFyYW1ldGVyc0xpc3QgPSBbXTtcbiAgICAgICAgdGhpcy5jbGFzc0xpc3QuYWRkKFwidG9vbHRpcFwiKTtcbiAgICAgICAgdGhpcy5faW5uZXIuY2xhc3NMaXN0LmFkZChcInRvb2x0aXAtaW5uZXJcIik7XG4gICAgICAgIHRoaXMuX3NldHVwQXJyb3dzKCk7XG4gICAgICAgIGxldCBvcGVuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICAgIG9wZW4uaW5uZXJUZXh0ID0gXCIoXCI7XG4gICAgICAgIGxldCBjbG9zZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICBjbG9zZS5pbm5lclRleHQgPSBcIilcIjtcbiAgICAgICAgdGhpcy5hcHBlbmRDaGlsZCh0aGlzLl9pbm5lcik7XG4gICAgICAgIHRoaXMuX2lubmVyLmFwcGVuZENoaWxkKHRoaXMuX2RvY3VtZW50YXRpb24pO1xuICAgICAgICB0aGlzLl9pbm5lci5hcHBlbmRDaGlsZCh0aGlzLl9hcnJvd3MpO1xuICAgICAgICB0aGlzLl9pbm5lci5hcHBlbmRDaGlsZCh0aGlzLl9sYWJlbCk7XG4gICAgICAgIHRoaXMuX2lubmVyLmFwcGVuZENoaWxkKG9wZW4pO1xuICAgICAgICB0aGlzLl9pbm5lci5hcHBlbmRDaGlsZCh0aGlzLl9wYXJhbWV0ZXJzKTtcbiAgICAgICAgdGhpcy5faW5uZXIuYXBwZW5kQ2hpbGQoY2xvc2UpO1xuICAgICAgICBvcGVuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICAgIG9wZW4uaW5uZXJUZXh0ID0gXCIgW1wiO1xuICAgICAgICBjbG9zZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICBjbG9zZS5pbm5lclRleHQgPSBcIl1cIjtcbiAgICAgICAgdGhpcy5faW5uZXIuYXBwZW5kQ2hpbGQob3Blbik7XG4gICAgICAgIHRoaXMuX2lubmVyLmFwcGVuZENoaWxkKHRoaXMuX2NvdW50KTtcbiAgICAgICAgdGhpcy5faW5uZXIuYXBwZW5kQ2hpbGQoY2xvc2UpO1xuICAgICAgICB0aGlzLl9pbm5lci5hcHBlbmRDaGlsZCh0aGlzLl9wYXJhbWV0ZXJEb2N1bWVudGF0aW9uKTtcbiAgICB9XG4gICAgbW92ZUluZGV4KGRpcmVjdGlvbikge1xuICAgICAgICBpZiAoIXRoaXMuX21lbWJlcilcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdGhpcy5fc2VsZWN0ZWRJbmRleCArPSBkaXJlY3Rpb247XG4gICAgICAgIGlmICh0aGlzLl9zZWxlY3RlZEluZGV4IDwgMCkge1xuICAgICAgICAgICAgdGhpcy5fc2VsZWN0ZWRJbmRleCA9IHRoaXMuX21lbWJlci5TaWduYXR1cmVzLmxlbmd0aCAtIDE7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuX3NlbGVjdGVkSW5kZXggPiB0aGlzLl9tZW1iZXIuU2lnbmF0dXJlcy5sZW5ndGggLSAxKSB7XG4gICAgICAgICAgICB0aGlzLl9zZWxlY3RlZEluZGV4ID0gMDtcbiAgICAgICAgfVxuICAgICAgICBmYXN0ZG9tLm11dGF0ZSgoKSA9PiB0aGlzLl9jb3VudC5pbm5lclRleHQgPSAodGhpcy5fc2VsZWN0ZWRJbmRleCArIDEpLnRvU3RyaW5nKCkpO1xuICAgICAgICB0aGlzLnVwZGF0ZU1lbWJlcih0aGlzLl9tZW1iZXIpO1xuICAgIH1cbiAgICBfc2V0dXBBcnJvd3MoKSB7XG4gICAgICAgIGNvbnN0IHVwID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImFcIik7XG4gICAgICAgIHVwLmNsYXNzTGlzdC5hZGQoXCJpY29uLWFycm93LXVwXCIpO1xuICAgICAgICB1cC5vbmNsaWNrID0gKCkgPT4gdGhpcy5tb3ZlSW5kZXgoLTEpO1xuICAgICAgICBjb25zdCBkb3duID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImFcIik7XG4gICAgICAgIGRvd24uY2xhc3NMaXN0LmFkZChcImljb24tYXJyb3ctZG93blwiKTtcbiAgICAgICAgZG93bi5vbmNsaWNrID0gKCkgPT4gdGhpcy5tb3ZlSW5kZXgoMSk7XG4gICAgICAgIHRoaXMuX2Fycm93cy5hcHBlbmRDaGlsZCh1cCk7XG4gICAgICAgIHRoaXMuX2Fycm93cy5hcHBlbmRDaGlsZChkb3duKTtcbiAgICB9XG4gICAgc2V0TGluZUhlaWdodChoZWlnaHQpIHtcbiAgICAgICAgdGhpcy5fZWRpdG9yTGluZUhlaWdodCA9IGhlaWdodDtcbiAgICAgICAgaWYgKHRoaXMuX21lbWJlcilcbiAgICAgICAgICAgIHRoaXMudXBkYXRlTWVtYmVyKHRoaXMuX21lbWJlcik7XG4gICAgfVxuICAgIHVwZGF0ZU1lbWJlcihtZW1iZXIpIHtcbiAgICAgICAgdGhpcy5fbWVtYmVyID0gbWVtYmVyO1xuICAgICAgICBpZiAodGhpcy5fc2VsZWN0ZWRJbmRleCA9PT0gLTEpIHtcbiAgICAgICAgICAgIHRoaXMuX3NlbGVjdGVkSW5kZXggPSBtZW1iZXIuQWN0aXZlU2lnbmF0dXJlO1xuICAgICAgICAgICAgaWYgKG1lbWJlci5BY3RpdmVTaWduYXR1cmUgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fc2VsZWN0ZWRJbmRleCA9IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgc2lnbmF0dXJlID0gbWVtYmVyLlNpZ25hdHVyZXNbdGhpcy5fc2VsZWN0ZWRJbmRleF07XG4gICAgICAgIGlmICghc2lnbmF0dXJlKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBsZXQgZG9jcztcbiAgICAgICAgaWYgKHNpZ25hdHVyZS5Eb2N1bWVudGF0aW9uKVxuICAgICAgICAgICAgZG9jcyA9IHBhcnNlU3RyaW5nKHNpZ25hdHVyZS5Eb2N1bWVudGF0aW9uKTtcbiAgICAgICAgaWYgKHRoaXMuX2xhc3RJbmRleCAhPT0gdGhpcy5fc2VsZWN0ZWRJbmRleCkge1xuICAgICAgICAgICAgdGhpcy5fbGFzdEluZGV4ID0gdGhpcy5fc2VsZWN0ZWRJbmRleDtcbiAgICAgICAgICAgIGZhc3Rkb20ubXV0YXRlKCgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLl9jb3VudC5pbm5lclRleHQgPSAodGhpcy5fc2VsZWN0ZWRJbmRleCArIDEpLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5fbGFiZWwuaW5uZXJUZXh0ID0gc2lnbmF0dXJlLk5hbWU7XG4gICAgICAgICAgICAgICAgdGhpcy5fZG9jdW1lbnRhdGlvbi5pbm5lclRleHQgPSBzaWduYXR1cmUuRG9jdW1lbnRhdGlvbjtcbiAgICAgICAgICAgICAgICBpZiAoZG9jcyAmJiBzaWduYXR1cmUuRG9jdW1lbnRhdGlvbikge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzID0gZG9jcy5nZXRFbGVtZW50c0J5VGFnTmFtZShcInN1bW1hcnlcIik7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3VtbWFyeSA9IF8udHJpbSgoc1swXSkuaW5uZXJIVE1MKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2RvY3VtZW50YXRpb24uaW5uZXJUZXh0ID0gc3VtbWFyeTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2RvY3VtZW50YXRpb24uaW5uZXJUZXh0ID0gXCJcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2RvY3VtZW50YXRpb24uc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2RvY3VtZW50YXRpb24uc3R5bGUuZGlzcGxheSA9IFwiXCI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9kb2N1bWVudGF0aW9uLmlubmVyVGV4dCA9IFwiXCI7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2RvY3VtZW50YXRpb24uc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAobWVtYmVyLlNpZ25hdHVyZXMubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9hcnJvd3Muc3R5bGUuZGlzcGxheSA9IFwiXCI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9hcnJvd3Muc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy5fcGFyYW1ldGVyc0xpc3QgPSBbXTtcbiAgICAgICAgICAgIGZhc3Rkb20ubXV0YXRlKCgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBwYXJhbWV0ZXJzID0gc2lnbmF0dXJlLlBhcmFtZXRlcnM7XG4gICAgICAgICAgICAgICAgY29uc3QgcGFyYW1ldGVyc0VsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgICAgICAgICBfLmVhY2gocGFyYW1ldGVycywgKHBhcmFtZXRlciwgaSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB2aWV3ID0gbmV3IGV4cG9ydHMuU2lnbmF0dXJlUGFyYW1ldGVyVmlldygpO1xuICAgICAgICAgICAgICAgICAgICB2aWV3LnNldE1lbWJlcihwYXJhbWV0ZXIpO1xuICAgICAgICAgICAgICAgICAgICB2aWV3LnNldEN1cnJlbnQoaSA9PT0gbWVtYmVyLkFjdGl2ZVBhcmFtZXRlcik7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgY29tbWEgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbW1hLmlubmVyVGV4dCA9IFwiLCBcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcmFtZXRlcnNFbGVtZW50LmFwcGVuZENoaWxkKGNvbW1hKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBwYXJhbWV0ZXJzRWxlbWVudC5hcHBlbmRDaGlsZCh2aWV3KTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcGFyYW1ldGVyc0xpc3QucHVzaCh2aWV3KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjb25zdCBjdXJyZW50RWxlbWVudCA9IHRoaXMuX3BhcmFtZXRlcnM7XG4gICAgICAgICAgICAgICAgdGhpcy5faW5uZXIuaW5zZXJ0QmVmb3JlKHBhcmFtZXRlcnNFbGVtZW50LCBjdXJyZW50RWxlbWVudCk7XG4gICAgICAgICAgICAgICAgdGhpcy5faW5uZXIucmVtb3ZlQ2hpbGQoY3VycmVudEVsZW1lbnQpO1xuICAgICAgICAgICAgICAgIHRoaXMuX3BhcmFtZXRlcnMgPSBwYXJhbWV0ZXJzRWxlbWVudDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZmFzdGRvbS5tdXRhdGUoKCkgPT4ge1xuICAgICAgICAgICAgICAgIF8uZWFjaChzaWduYXR1cmUuUGFyYW1ldGVycywgKHBhcmFtLCBpKSA9PiB0aGlzLl9wYXJhbWV0ZXJzTGlzdFtpXSAmJiB0aGlzLl9wYXJhbWV0ZXJzTGlzdFtpXS5zZXRDdXJyZW50KGkgPT09IG1lbWJlci5BY3RpdmVQYXJhbWV0ZXIpKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGN1cnJlbnRQYXJhbWV0ZXIgPSBzaWduYXR1cmUuUGFyYW1ldGVyc1ttZW1iZXIuQWN0aXZlUGFyYW1ldGVyXTtcbiAgICAgICAgZmFzdGRvbS5tZWFzdXJlKCgpID0+IHtcbiAgICAgICAgICAgIGlmICghY3VycmVudFBhcmFtZXRlcilcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICBsZXQgc3VtbWFyeTtcbiAgICAgICAgICAgIGlmIChjdXJyZW50UGFyYW1ldGVyLkRvY3VtZW50YXRpb24pIHtcbiAgICAgICAgICAgICAgICBjb25zdCBwYXJhbURvY3MgPSBwYXJzZVN0cmluZyhjdXJyZW50UGFyYW1ldGVyLkRvY3VtZW50YXRpb24pO1xuICAgICAgICAgICAgICAgIGlmIChwYXJhbURvY3MpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcyA9IHBhcmFtRG9jcy5nZXRFbGVtZW50c0J5VGFnTmFtZShcInN1bW1hcnlcIik7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3VtbWFyeUVsZW1lbnQgPSBzWzBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN1bW1hcnlFbGVtZW50KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1bW1hcnkgPSBfLnRyaW0oc3VtbWFyeUVsZW1lbnQuaW5uZXJIVE1MKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChkb2NzICYmICFzdW1tYXJ5KSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcyA9IGRvY3MuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJwYXJhbVwiKTtcbiAgICAgICAgICAgICAgICBpZiAocy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcGFyYW0gPSBfLmZpbmQocywgeCA9PiB4LmF0dHJpYnV0ZXNbXCJuYW1lXCJdICYmIHguYXR0cmlidXRlc1tcIm5hbWVcIl0udmFsdWUgPT09IGN1cnJlbnRQYXJhbWV0ZXIuTmFtZSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChwYXJhbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3VtbWFyeSA9IF8udHJpbShwYXJhbS5pbm5lckhUTUwpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMuX3BhcmFtZXRlckRvY3VtZW50YXRpb24uaW5uZXJUZXh0ICE9PSBzdW1tYXJ5KSB7XG4gICAgICAgICAgICAgICAgaWYgKHN1bW1hcnkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcGFyYW1ldGVyRG9jdW1lbnRhdGlvbi5pbm5lclRleHQgPSBzdW1tYXJ5O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcGFyYW1ldGVyRG9jdW1lbnRhdGlvbi5pbm5lclRleHQgPSBcIlwiO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGZhc3Rkb20ubXV0YXRlKCgpID0+IHRoaXMuc3R5bGUuYm90dG9tID0gYCR7dGhpcy5jbGllbnRIZWlnaHQgKyB0aGlzLl9lZGl0b3JMaW5lSGVpZ2h0fXB4YCk7XG4gICAgfVxuICAgIGRldGFjaGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIF8uZWFjaCh0aGlzLl9wYXJhbWV0ZXJzTGlzdCwgcGFyYW1ldGVyID0+IHBhcmFtZXRlci5yZW1vdmUoKSk7XG4gICAgICAgIHRoaXMuX3BhcmFtZXRlcnNMaXN0ID0gW107XG4gICAgfVxufVxuZXhwb3J0cy5TaWduYXR1cmVWaWV3ID0gZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50KFwib21uaXNoYXJwLXNpZ25hdHVyZS1oZWxwXCIsIHsgcHJvdG90eXBlOiBTaWduYXR1cmVWaWV3LnByb3RvdHlwZSB9KTtcbmV4cG9ydCBjbGFzcyBTaWduYXR1cmVQYXJhbWV0ZXJWaWV3IGV4dGVuZHMgSFRNTFNwYW5FbGVtZW50IHtcbiAgICBjcmVhdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMuX2xhYmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQodGhpcy5fbGFiZWwpO1xuICAgIH1cbiAgICBzZXRNZW1iZXIobWVtYmVyKSB7XG4gICAgICAgIHRoaXMuX21lbWJlciA9IG1lbWJlcjtcbiAgICAgICAgdGhpcy5fbGFiZWwuaW5uZXJUZXh0ID0gbWVtYmVyLkxhYmVsO1xuICAgIH1cbiAgICBzZXRDdXJyZW50KGN1cnJlbnQpIHtcbiAgICAgICAgZmFzdGRvbS5tZWFzdXJlKCgpID0+IHtcbiAgICAgICAgICAgIGlmICghY3VycmVudCAmJiB0aGlzLnN0eWxlLmZvbnRXZWlnaHQgPT09IFwiYm9sZFwiKSB7XG4gICAgICAgICAgICAgICAgZmFzdGRvbS5tdXRhdGUoKCkgPT4gdGhpcy5zdHlsZS5mb250V2VpZ2h0ID0gXCJcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChjdXJyZW50ICYmIHRoaXMuc3R5bGUuZm9udFdlaWdodCAhPT0gXCJib2xkXCIpIHtcbiAgICAgICAgICAgICAgICBmYXN0ZG9tLm11dGF0ZSgoKSA9PiB0aGlzLnN0eWxlLmZvbnRXZWlnaHQgPSBcImJvbGRcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbn1cbmV4cG9ydHMuU2lnbmF0dXJlUGFyYW1ldGVyVmlldyA9IGRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudChcIm9tbmlzaGFycC1zaWduYXR1cmUtcGFyYW1ldGVyXCIsIHsgcHJvdG90eXBlOiBTaWduYXR1cmVQYXJhbWV0ZXJWaWV3LnByb3RvdHlwZSB9KTtcbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi90eXBpbmdzLmQudHNcIiAvPlxyXG4vKiB0c2xpbnQ6ZGlzYWJsZTpuby1zdHJpbmctbGl0ZXJhbCAqL1xyXG5pbXBvcnQge01vZGVsc30gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcclxubGV0IGZhc3Rkb206IHR5cGVvZiBGYXN0ZG9tID0gcmVxdWlyZShcImZhc3Rkb21cIik7XHJcbmltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcclxuXHJcbmNvbnN0IHBhcnNlU3RyaW5nID0gKGZ1bmN0aW9uKCkge1xyXG4gICAgY29uc3QgcGFyc2VyID0gbmV3IERPTVBhcnNlcigpO1xyXG5cclxuICAgIHJldHVybiBmdW5jdGlvbih4bWw6IHN0cmluZykge1xyXG4gICAgICAgIHJldHVybiBwYXJzZXIucGFyc2VGcm9tU3RyaW5nKHhtbCwgXCJ0ZXh0L3htbFwiKTtcclxuICAgIH07XHJcbn0pKCk7XHJcblxyXG5leHBvcnQgY2xhc3MgU2lnbmF0dXJlVmlldyBleHRlbmRzIEhUTUxEaXZFbGVtZW50IHsgLyogaW1wbGVtZW50cyBXZWJDb21wb25lbnQgKi9cclxuICAgIHByaXZhdGUgX21lbWJlcjogTW9kZWxzLlNpZ25hdHVyZUhlbHA7XHJcbiAgICBwcml2YXRlIF9pbm5lcjogSFRNTERpdkVsZW1lbnQ7XHJcbiAgICBwcml2YXRlIF9sYWJlbDogSFRNTFNwYW5FbGVtZW50O1xyXG4gICAgcHJpdmF0ZSBfZG9jdW1lbnRhdGlvbjogSFRNTERpdkVsZW1lbnQ7XHJcbiAgICBwcml2YXRlIF9wYXJhbWV0ZXJEb2N1bWVudGF0aW9uOiBIVE1MRGl2RWxlbWVudDtcclxuICAgIHByaXZhdGUgX2Fycm93czogSFRNTFNwYW5FbGVtZW50O1xyXG4gICAgcHJpdmF0ZSBfcGFyYW1ldGVyc0xpc3Q6IFNpZ25hdHVyZVBhcmFtZXRlclZpZXdbXSA9IFtdO1xyXG4gICAgcHJpdmF0ZSBfcGFyYW1ldGVyczogSFRNTFNwYW5FbGVtZW50O1xyXG4gICAgcHJpdmF0ZSBfY291bnQ6IEhUTUxTcGFuRWxlbWVudDtcclxuICAgIHByaXZhdGUgX3NlbGVjdGVkSW5kZXg6IG51bWJlcjtcclxuICAgIHByaXZhdGUgX2xhc3RJbmRleDogbnVtYmVyO1xyXG4gICAgcHJpdmF0ZSBfZWRpdG9yTGluZUhlaWdodDogbnVtYmVyO1xyXG5cclxuICAgIHB1YmxpYyBjcmVhdGVkQ2FsbGJhY2soKSB7XHJcbiAgICAgICAgdGhpcy5fc2VsZWN0ZWRJbmRleCA9IC0xO1xyXG4gICAgICAgIHRoaXMuX2xhc3RJbmRleCA9IC0xO1xyXG4gICAgICAgIHRoaXMuX2VkaXRvckxpbmVIZWlnaHQgPSAwO1xyXG5cclxuICAgICAgICB0aGlzLl9pbm5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgICAgICAgdGhpcy5fbGFiZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcclxuICAgICAgICB0aGlzLl9kb2N1bWVudGF0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuICAgICAgICB0aGlzLl9wYXJhbWV0ZXJEb2N1bWVudGF0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuICAgICAgICB0aGlzLl9wYXJhbWV0ZXJEb2N1bWVudGF0aW9uLnN0eWxlLm1hcmdpbkxlZnQgPSBcIjIuNGVtXCI7XHJcbiAgICAgICAgdGhpcy5fYXJyb3dzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XHJcbiAgICAgICAgdGhpcy5fcGFyYW1ldGVycyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xyXG4gICAgICAgIHRoaXMuX2NvdW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XHJcbiAgICAgICAgdGhpcy5fcGFyYW1ldGVyc0xpc3QgPSBbXTtcclxuXHJcbiAgICAgICAgdGhpcy5jbGFzc0xpc3QuYWRkKFwidG9vbHRpcFwiKTtcclxuICAgICAgICB0aGlzLl9pbm5lci5jbGFzc0xpc3QuYWRkKFwidG9vbHRpcC1pbm5lclwiKTtcclxuXHJcbiAgICAgICAgdGhpcy5fc2V0dXBBcnJvd3MoKTtcclxuXHJcbiAgICAgICAgbGV0IG9wZW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcclxuICAgICAgICBvcGVuLmlubmVyVGV4dCA9IFwiKFwiO1xyXG5cclxuICAgICAgICBsZXQgY2xvc2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcclxuICAgICAgICBjbG9zZS5pbm5lclRleHQgPSBcIilcIjtcclxuXHJcbiAgICAgICAgdGhpcy5hcHBlbmRDaGlsZCh0aGlzLl9pbm5lcik7XHJcbiAgICAgICAgdGhpcy5faW5uZXIuYXBwZW5kQ2hpbGQodGhpcy5fZG9jdW1lbnRhdGlvbik7XHJcblxyXG4gICAgICAgIHRoaXMuX2lubmVyLmFwcGVuZENoaWxkKHRoaXMuX2Fycm93cyk7XHJcblxyXG4gICAgICAgIHRoaXMuX2lubmVyLmFwcGVuZENoaWxkKHRoaXMuX2xhYmVsKTtcclxuICAgICAgICB0aGlzLl9pbm5lci5hcHBlbmRDaGlsZChvcGVuKTtcclxuICAgICAgICB0aGlzLl9pbm5lci5hcHBlbmRDaGlsZCh0aGlzLl9wYXJhbWV0ZXJzKTtcclxuICAgICAgICB0aGlzLl9pbm5lci5hcHBlbmRDaGlsZChjbG9zZSk7XHJcblxyXG4gICAgICAgIG9wZW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcclxuICAgICAgICBvcGVuLmlubmVyVGV4dCA9IFwiIFtcIjtcclxuXHJcbiAgICAgICAgY2xvc2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcclxuICAgICAgICBjbG9zZS5pbm5lclRleHQgPSBcIl1cIjtcclxuXHJcbiAgICAgICAgdGhpcy5faW5uZXIuYXBwZW5kQ2hpbGQob3Blbik7XHJcbiAgICAgICAgdGhpcy5faW5uZXIuYXBwZW5kQ2hpbGQodGhpcy5fY291bnQpO1xyXG4gICAgICAgIHRoaXMuX2lubmVyLmFwcGVuZENoaWxkKGNsb3NlKTtcclxuXHJcbiAgICAgICAgdGhpcy5faW5uZXIuYXBwZW5kQ2hpbGQodGhpcy5fcGFyYW1ldGVyRG9jdW1lbnRhdGlvbik7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIG1vdmVJbmRleChkaXJlY3Rpb246IG51bWJlcikge1xyXG4gICAgICAgIGlmICghdGhpcy5fbWVtYmVyKSByZXR1cm47XHJcbiAgICAgICAgdGhpcy5fc2VsZWN0ZWRJbmRleCArPSBkaXJlY3Rpb247XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9zZWxlY3RlZEluZGV4IDwgMCkge1xyXG4gICAgICAgICAgICB0aGlzLl9zZWxlY3RlZEluZGV4ID0gdGhpcy5fbWVtYmVyLlNpZ25hdHVyZXMubGVuZ3RoIC0gMTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9zZWxlY3RlZEluZGV4ID4gdGhpcy5fbWVtYmVyLlNpZ25hdHVyZXMubGVuZ3RoIC0gMSkge1xyXG4gICAgICAgICAgICB0aGlzLl9zZWxlY3RlZEluZGV4ID0gMDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZhc3Rkb20ubXV0YXRlKCgpID0+IHRoaXMuX2NvdW50LmlubmVyVGV4dCA9ICh0aGlzLl9zZWxlY3RlZEluZGV4ICsgMSkudG9TdHJpbmcoKSk7XHJcbiAgICAgICAgdGhpcy51cGRhdGVNZW1iZXIodGhpcy5fbWVtYmVyKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9zZXR1cEFycm93cygpIHtcclxuICAgICAgICBjb25zdCB1cCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJhXCIpO1xyXG4gICAgICAgIHVwLmNsYXNzTGlzdC5hZGQoXCJpY29uLWFycm93LXVwXCIpO1xyXG4gICAgICAgIHVwLm9uY2xpY2sgPSAoKSA9PiB0aGlzLm1vdmVJbmRleCgtMSk7XHJcblxyXG4gICAgICAgIGNvbnN0IGRvd24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYVwiKTtcclxuICAgICAgICBkb3duLmNsYXNzTGlzdC5hZGQoXCJpY29uLWFycm93LWRvd25cIik7XHJcbiAgICAgICAgZG93bi5vbmNsaWNrID0gKCkgPT4gdGhpcy5tb3ZlSW5kZXgoMSk7XHJcblxyXG4gICAgICAgIHRoaXMuX2Fycm93cy5hcHBlbmRDaGlsZCh1cCk7XHJcbiAgICAgICAgdGhpcy5fYXJyb3dzLmFwcGVuZENoaWxkKGRvd24pO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzZXRMaW5lSGVpZ2h0KGhlaWdodDogbnVtYmVyKSB7XHJcbiAgICAgICAgdGhpcy5fZWRpdG9yTGluZUhlaWdodCA9IGhlaWdodDtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX21lbWJlcilcclxuICAgICAgICAgICAgdGhpcy51cGRhdGVNZW1iZXIodGhpcy5fbWVtYmVyKTtcclxuICAgIH1cclxuXHJcbiAgICAvL0BfZChtID0+IF8uZGVib3VuY2UobSwgMjAwLCB7IGxlYWRpbmc6IHRydWUsIHRyYWlsaW5nOiB0cnVlIH0pKVxyXG4gICAgcHVibGljIHVwZGF0ZU1lbWJlcihtZW1iZXI6IE1vZGVscy5TaWduYXR1cmVIZWxwKSB7XHJcbiAgICAgICAgdGhpcy5fbWVtYmVyID0gbWVtYmVyO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5fc2VsZWN0ZWRJbmRleCA9PT0gLTEpIHtcclxuICAgICAgICAgICAgdGhpcy5fc2VsZWN0ZWRJbmRleCA9IG1lbWJlci5BY3RpdmVTaWduYXR1cmU7XHJcbiAgICAgICAgICAgIGlmIChtZW1iZXIuQWN0aXZlU2lnbmF0dXJlID09PSAtMSkge1xyXG4gICAgICAgICAgICAgICAgLy8gVGhlIHNlcnZlciBiYXNpY2FsbHkgdGhyZXcgdXAgaXRzIGFybXMgYW5kIHNhaWQgZnVjayBpdC4uLlxyXG4gICAgICAgICAgICAgICAgdGhpcy5fc2VsZWN0ZWRJbmRleCA9IDA7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHNpZ25hdHVyZSA9IG1lbWJlci5TaWduYXR1cmVzW3RoaXMuX3NlbGVjdGVkSW5kZXhdO1xyXG4gICAgICAgIGlmICghc2lnbmF0dXJlKSByZXR1cm47XHJcblxyXG4gICAgICAgIGxldCBkb2NzOiBEb2N1bWVudDtcclxuICAgICAgICBpZiAoc2lnbmF0dXJlLkRvY3VtZW50YXRpb24pXHJcbiAgICAgICAgICAgIGRvY3MgPSBwYXJzZVN0cmluZyhzaWduYXR1cmUuRG9jdW1lbnRhdGlvbik7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9sYXN0SW5kZXggIT09IHRoaXMuX3NlbGVjdGVkSW5kZXgpIHtcclxuICAgICAgICAgICAgdGhpcy5fbGFzdEluZGV4ID0gdGhpcy5fc2VsZWN0ZWRJbmRleDtcclxuICAgICAgICAgICAgZmFzdGRvbS5tdXRhdGUoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fY291bnQuaW5uZXJUZXh0ID0gKHRoaXMuX3NlbGVjdGVkSW5kZXggKyAxKS50b1N0cmluZygpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fbGFiZWwuaW5uZXJUZXh0ID0gc2lnbmF0dXJlLk5hbWU7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9kb2N1bWVudGF0aW9uLmlubmVyVGV4dCA9IHNpZ25hdHVyZS5Eb2N1bWVudGF0aW9uO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChkb2NzICYmIHNpZ25hdHVyZS5Eb2N1bWVudGF0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgczogTm9kZUxpc3RPZjxIVE1MRWxlbWVudD4gPSA8YW55PmRvY3MuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJzdW1tYXJ5XCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBzdW1tYXJ5ID0gXy50cmltKChzWzBdKS5pbm5lckhUTUwpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9kb2N1bWVudGF0aW9uLmlubmVyVGV4dCA9IHN1bW1hcnk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fZG9jdW1lbnRhdGlvbi5pbm5lclRleHQgPSBcIlwiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9kb2N1bWVudGF0aW9uLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2RvY3VtZW50YXRpb24uc3R5bGUuZGlzcGxheSA9IFwiXCI7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2RvY3VtZW50YXRpb24uaW5uZXJUZXh0ID0gXCJcIjtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9kb2N1bWVudGF0aW9uLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAobWVtYmVyLlNpZ25hdHVyZXMubGVuZ3RoID4gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2Fycm93cy5zdHlsZS5kaXNwbGF5ID0gXCJcIjtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fYXJyb3dzLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLl9wYXJhbWV0ZXJzTGlzdCA9IFtdO1xyXG5cclxuICAgICAgICAgICAgZmFzdGRvbS5tdXRhdGUoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcGFyYW1ldGVycyA9IHNpZ25hdHVyZS5QYXJhbWV0ZXJzO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcGFyYW1ldGVyc0VsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcclxuICAgICAgICAgICAgICAgIF8uZWFjaChwYXJhbWV0ZXJzLCAocGFyYW1ldGVyLCBpKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdmlldzogU2lnbmF0dXJlUGFyYW1ldGVyVmlldyA9IDxhbnk+bmV3IGV4cG9ydHMuU2lnbmF0dXJlUGFyYW1ldGVyVmlldygpO1xyXG4gICAgICAgICAgICAgICAgICAgIHZpZXcuc2V0TWVtYmVyKHBhcmFtZXRlcik7XHJcbiAgICAgICAgICAgICAgICAgICAgdmlldy5zZXRDdXJyZW50KGkgPT09IG1lbWJlci5BY3RpdmVQYXJhbWV0ZXIpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoaSA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgY29tbWEgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29tbWEuaW5uZXJUZXh0ID0gXCIsIFwiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJhbWV0ZXJzRWxlbWVudC5hcHBlbmRDaGlsZChjb21tYSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBwYXJhbWV0ZXJzRWxlbWVudC5hcHBlbmRDaGlsZCh2aWV3KTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9wYXJhbWV0ZXJzTGlzdC5wdXNoKHZpZXcpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc3QgY3VycmVudEVsZW1lbnQgPSB0aGlzLl9wYXJhbWV0ZXJzO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5faW5uZXIuaW5zZXJ0QmVmb3JlKHBhcmFtZXRlcnNFbGVtZW50LCBjdXJyZW50RWxlbWVudCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9pbm5lci5yZW1vdmVDaGlsZChjdXJyZW50RWxlbWVudCk7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5fcGFyYW1ldGVycyA9IHBhcmFtZXRlcnNFbGVtZW50O1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBmYXN0ZG9tLm11dGF0ZSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBfLmVhY2goc2lnbmF0dXJlLlBhcmFtZXRlcnMsIChwYXJhbSwgaSkgPT5cclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9wYXJhbWV0ZXJzTGlzdFtpXSAmJiB0aGlzLl9wYXJhbWV0ZXJzTGlzdFtpXS5zZXRDdXJyZW50KGkgPT09IG1lbWJlci5BY3RpdmVQYXJhbWV0ZXIpKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBjdXJyZW50UGFyYW1ldGVyID0gc2lnbmF0dXJlLlBhcmFtZXRlcnNbbWVtYmVyLkFjdGl2ZVBhcmFtZXRlcl07XHJcbiAgICAgICAgZmFzdGRvbS5tZWFzdXJlKCgpID0+IHtcclxuICAgICAgICAgICAgaWYgKCFjdXJyZW50UGFyYW1ldGVyKSByZXR1cm47XHJcbiAgICAgICAgICAgIGxldCBzdW1tYXJ5OiBzdHJpbmc7XHJcbiAgICAgICAgICAgIGlmIChjdXJyZW50UGFyYW1ldGVyLkRvY3VtZW50YXRpb24pIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHBhcmFtRG9jcyA9IHBhcnNlU3RyaW5nKGN1cnJlbnRQYXJhbWV0ZXIuRG9jdW1lbnRhdGlvbik7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHBhcmFtRG9jcykge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHM6IE5vZGVMaXN0T2Y8SFRNTEVsZW1lbnQ+ID0gPGFueT5wYXJhbURvY3MuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJzdW1tYXJ5XCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBzdW1tYXJ5RWxlbWVudCA9IHNbMF07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzdW1tYXJ5RWxlbWVudClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1bW1hcnkgPSBfLnRyaW0oc3VtbWFyeUVsZW1lbnQuaW5uZXJIVE1MKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChkb2NzICYmICFzdW1tYXJ5KSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBzOiBOb2RlTGlzdE9mPEhUTUxFbGVtZW50PiA9IDxhbnk+ZG9jcy5nZXRFbGVtZW50c0J5VGFnTmFtZShcInBhcmFtXCIpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcGFyYW0gPSA8SFRNTEVsZW1lbnQ+Xy5maW5kKHMsIHggPT4geC5hdHRyaWJ1dGVzW1wibmFtZVwiXSAmJiB4LmF0dHJpYnV0ZXNbXCJuYW1lXCJdLnZhbHVlID09PSBjdXJyZW50UGFyYW1ldGVyLk5hbWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChwYXJhbSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdW1tYXJ5ID0gXy50cmltKHBhcmFtLmlubmVySFRNTCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy5fcGFyYW1ldGVyRG9jdW1lbnRhdGlvbi5pbm5lclRleHQgIT09IHN1bW1hcnkpIHtcclxuICAgICAgICAgICAgICAgIGlmIChzdW1tYXJ5KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcGFyYW1ldGVyRG9jdW1lbnRhdGlvbi5pbm5lclRleHQgPSBzdW1tYXJ5O1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9wYXJhbWV0ZXJEb2N1bWVudGF0aW9uLmlubmVyVGV4dCA9IFwiXCI7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgZmFzdGRvbS5tdXRhdGUoKCkgPT4gdGhpcy5zdHlsZS5ib3R0b20gPSBgJHt0aGlzLmNsaWVudEhlaWdodCArIHRoaXMuX2VkaXRvckxpbmVIZWlnaHR9cHhgKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGV0YWNoZWRDYWxsYmFjaygpIHtcclxuICAgICAgICBfLmVhY2godGhpcy5fcGFyYW1ldGVyc0xpc3QsIHBhcmFtZXRlciA9PiBwYXJhbWV0ZXIucmVtb3ZlKCkpO1xyXG4gICAgICAgIHRoaXMuX3BhcmFtZXRlcnNMaXN0ID0gW107XHJcbiAgICB9XHJcbn1cclxuXHJcbig8YW55PmV4cG9ydHMpLlNpZ25hdHVyZVZpZXcgPSAoPGFueT5kb2N1bWVudCkucmVnaXN0ZXJFbGVtZW50KFwib21uaXNoYXJwLXNpZ25hdHVyZS1oZWxwXCIsIHsgcHJvdG90eXBlOiBTaWduYXR1cmVWaWV3LnByb3RvdHlwZSB9KTtcclxuXHJcbmV4cG9ydCBjbGFzcyBTaWduYXR1cmVQYXJhbWV0ZXJWaWV3IGV4dGVuZHMgSFRNTFNwYW5FbGVtZW50IHsgLyogaW1wbGVtZW50cyBXZWJDb21wb25lbnQgKi9cclxuICAgIHByaXZhdGUgX21lbWJlcjogTW9kZWxzLlNpZ25hdHVyZUhlbHBQYXJhbWV0ZXI7XHJcbiAgICBwcml2YXRlIF9sYWJlbDogSFRNTFNwYW5FbGVtZW50O1xyXG5cclxuICAgIHB1YmxpYyBjcmVhdGVkQ2FsbGJhY2soKSB7XHJcbiAgICAgICAgdGhpcy5fbGFiZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcclxuICAgICAgICB0aGlzLmFwcGVuZENoaWxkKHRoaXMuX2xhYmVsKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2V0TWVtYmVyKG1lbWJlcjogTW9kZWxzLlNpZ25hdHVyZUhlbHBQYXJhbWV0ZXIpIHtcclxuICAgICAgICB0aGlzLl9tZW1iZXIgPSBtZW1iZXI7XHJcbiAgICAgICAgdGhpcy5fbGFiZWwuaW5uZXJUZXh0ID0gbWVtYmVyLkxhYmVsO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzZXRDdXJyZW50KGN1cnJlbnQ6IGJvb2xlYW4pIHtcclxuICAgICAgICBmYXN0ZG9tLm1lYXN1cmUoKCkgPT4ge1xyXG4gICAgICAgICAgICBpZiAoIWN1cnJlbnQgJiYgdGhpcy5zdHlsZS5mb250V2VpZ2h0ID09PSBcImJvbGRcIikge1xyXG4gICAgICAgICAgICAgICAgZmFzdGRvbS5tdXRhdGUoKCkgPT4gdGhpcy5zdHlsZS5mb250V2VpZ2h0ID0gXCJcIik7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY3VycmVudCAmJiB0aGlzLnN0eWxlLmZvbnRXZWlnaHQgIT09IFwiYm9sZFwiKSB7XHJcbiAgICAgICAgICAgICAgICBmYXN0ZG9tLm11dGF0ZSgoKSA9PiB0aGlzLnN0eWxlLmZvbnRXZWlnaHQgPSBcImJvbGRcIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxufVxyXG5cclxuKDxhbnk+ZXhwb3J0cykuU2lnbmF0dXJlUGFyYW1ldGVyVmlldyA9ICg8YW55PmRvY3VtZW50KS5yZWdpc3RlckVsZW1lbnQoXCJvbW5pc2hhcnAtc2lnbmF0dXJlLXBhcmFtZXRlclwiLCB7IHByb3RvdHlwZTogU2lnbmF0dXJlUGFyYW1ldGVyVmlldy5wcm90b3R5cGUgfSk7XHJcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
