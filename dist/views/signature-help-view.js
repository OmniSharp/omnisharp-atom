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
        var _Object$getPrototypeO;

        _classCallCheck(this, SignatureView);

        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
        }

        var _this = _possibleConstructorReturn(this, (_Object$getPrototypeO = Object.getPrototypeOf(SignatureView)).call.apply(_Object$getPrototypeO, [this].concat(args)));

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

        return _possibleConstructorReturn(this, Object.getPrototypeOf(SignatureParameterView).apply(this, arguments));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy9zaWduYXR1cmUtaGVscC12aWV3LmpzIiwibGliL3ZpZXdzL3NpZ25hdHVyZS1oZWxwLXZpZXcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQ0E7Ozs7Ozs7Ozs7OztBQ0VBLElBQUksVUFBMEIsUUFBUSxTQUFSLENBQTFCOztBQUdKLElBQU0sY0FBYyxZQUFDO0FBQ2pCLFFBQU0sU0FBUyxJQUFJLFNBQUosRUFBVCxDQURXO0FBR2pCLFdBQU8sVUFBUyxHQUFULEVBQW9CO0FBQ3ZCLGVBQU8sT0FBTyxlQUFQLENBQXVCLEdBQXZCLEVBQTRCLFVBQTVCLENBQVAsQ0FEdUI7S0FBcEIsQ0FIVTtDQUFBLEVBQWY7O0lBUU47OztBQUFBLDZCQUFBOzs7OzswQ0FBQTs7U0FBQTs7b0tBQW1DLFFBQW5DOztBQU9ZLGNBQUEsZUFBQSxHQUE0QyxFQUE1QyxDQVBaOztLQUFBOzs7OzBDQWMwQjtBQUNsQixpQkFBSyxjQUFMLEdBQXNCLENBQUMsQ0FBRCxDQURKO0FBRWxCLGlCQUFLLFVBQUwsR0FBa0IsQ0FBQyxDQUFELENBRkE7QUFHbEIsaUJBQUssaUJBQUwsR0FBeUIsQ0FBekIsQ0FIa0I7QUFLbEIsaUJBQUssTUFBTCxHQUFjLFNBQVMsYUFBVCxDQUF1QixLQUF2QixDQUFkLENBTGtCO0FBTWxCLGlCQUFLLE1BQUwsR0FBYyxTQUFTLGFBQVQsQ0FBdUIsTUFBdkIsQ0FBZCxDQU5rQjtBQU9sQixpQkFBSyxjQUFMLEdBQXNCLFNBQVMsYUFBVCxDQUF1QixLQUF2QixDQUF0QixDQVBrQjtBQVFsQixpQkFBSyx1QkFBTCxHQUErQixTQUFTLGFBQVQsQ0FBdUIsS0FBdkIsQ0FBL0IsQ0FSa0I7QUFTbEIsaUJBQUssdUJBQUwsQ0FBNkIsS0FBN0IsQ0FBbUMsVUFBbkMsR0FBZ0QsT0FBaEQsQ0FUa0I7QUFVbEIsaUJBQUssT0FBTCxHQUFlLFNBQVMsYUFBVCxDQUF1QixNQUF2QixDQUFmLENBVmtCO0FBV2xCLGlCQUFLLFdB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QixFQUF4QjtxQkFBTixDQUFmLENBRDhDO2lCQUFsRCxNQUVPLElBQUksV0FBVyxPQUFLLEtBQUwsQ0FBVyxVQUFYLEtBQTBCLE1BQTFCLEVBQWtDO0FBQ3BELDRCQUFRLE1BQVIsQ0FBZTsrQkFBTSxPQUFLLEtBQUwsQ0FBVyxVQUFYLEdBQXdCLE1BQXhCO3FCQUFOLENBQWYsQ0FEb0Q7aUJBQWpEO2FBSEssQ0FBaEIsQ0FEOEI7Ozs7O0VBZE07O0FBeUJ0QyxRQUFTLHNCQUFULEdBQXdDLFNBQVUsZUFBVixDQUEwQiwrQkFBMUIsRUFBMkQsRUFBRSxXQUFXLHVCQUF1QixTQUF2QixFQUF4RSxDQUF4QyIsImZpbGUiOiJsaWIvdmlld3Mvc2lnbmF0dXJlLWhlbHAtdmlldy5qcyIsInNvdXJjZXNDb250ZW50IjpbImxldCBmYXN0ZG9tID0gcmVxdWlyZShcImZhc3Rkb21cIik7XG5pbXBvcnQgXyBmcm9tIFwibG9kYXNoXCI7XG5jb25zdCBwYXJzZVN0cmluZyA9IChmdW5jdGlvbiAoKSB7XG4gICAgY29uc3QgcGFyc2VyID0gbmV3IERPTVBhcnNlcigpO1xuICAgIHJldHVybiBmdW5jdGlvbiAoeG1sKSB7XG4gICAgICAgIHJldHVybiBwYXJzZXIucGFyc2VGcm9tU3RyaW5nKHhtbCwgXCJ0ZXh0L3htbFwiKTtcbiAgICB9O1xufSkoKTtcbmV4cG9ydCBjbGFzcyBTaWduYXR1cmVWaWV3IGV4dGVuZHMgSFRNTERpdkVsZW1lbnQge1xuICAgIGNvbnN0cnVjdG9yKC4uLmFyZ3MpIHtcbiAgICAgICAgc3VwZXIoLi4uYXJncyk7XG4gICAgICAgIHRoaXMuX3BhcmFtZXRlcnNMaXN0ID0gW107XG4gICAgfVxuICAgIGNyZWF0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdGhpcy5fc2VsZWN0ZWRJbmRleCA9IC0xO1xuICAgICAgICB0aGlzLl9sYXN0SW5kZXggPSAtMTtcbiAgICAgICAgdGhpcy5fZWRpdG9yTGluZUhlaWdodCA9IDA7XG4gICAgICAgIHRoaXMuX2lubmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgdGhpcy5fbGFiZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgdGhpcy5fZG9jdW1lbnRhdGlvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgIHRoaXMuX3BhcmFtZXRlckRvY3VtZW50YXRpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICB0aGlzLl9wYXJhbWV0ZXJEb2N1bWVudGF0aW9uLnN0eWxlLm1hcmdpbkxlZnQgPSBcIjIuNGVtXCI7XG4gICAgICAgIHRoaXMuX2Fycm93cyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICB0aGlzLl9wYXJhbWV0ZXJzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICAgIHRoaXMuX2NvdW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICAgIHRoaXMuX3BhcmFtZXRlcnNMaXN0ID0gW107XG4gICAgICAgIHRoaXMuY2xhc3NMaXN0LmFkZChcInRvb2x0aXBcIik7XG4gICAgICAgIHRoaXMuX2lubmVyLmNsYXNzTGlzdC5hZGQoXCJ0b29sdGlwLWlubmVyXCIpO1xuICAgICAgICB0aGlzLl9zZXR1cEFycm93cygpO1xuICAgICAgICBsZXQgb3BlbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICBvcGVuLmlubmVyVGV4dCA9IFwiKFwiO1xuICAgICAgICBsZXQgY2xvc2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgY2xvc2UuaW5uZXJUZXh0ID0gXCIpXCI7XG4gICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQodGhpcy5faW5uZXIpO1xuICAgICAgICB0aGlzLl9pbm5lci5hcHBlbmRDaGlsZCh0aGlzLl9kb2N1bWVudGF0aW9uKTtcbiAgICAgICAgdGhpcy5faW5uZXIuYXBwZW5kQ2hpbGQodGhpcy5fYXJyb3dzKTtcbiAgICAgICAgdGhpcy5faW5uZXIuYXBwZW5kQ2hpbGQodGhpcy5fbGFiZWwpO1xuICAgICAgICB0aGlzLl9pbm5lci5hcHBlbmRDaGlsZChvcGVuKTtcbiAgICAgICAgdGhpcy5faW5uZXIuYXBwZW5kQ2hpbGQodGhpcy5fcGFyYW1ldGVycyk7XG4gICAgICAgIHRoaXMuX2lubmVyLmFwcGVuZENoaWxkKGNsb3NlKTtcbiAgICAgICAgb3BlbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICBvcGVuLmlubmVyVGV4dCA9IFwiIFtcIjtcbiAgICAgICAgY2xvc2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgY2xvc2UuaW5uZXJUZXh0ID0gXCJdXCI7XG4gICAgICAgIHRoaXMuX2lubmVyLmFwcGVuZENoaWxkKG9wZW4pO1xuICAgICAgICB0aGlzLl9pbm5lci5hcHBlbmRDaGlsZCh0aGlzLl9jb3VudCk7XG4gICAgICAgIHRoaXMuX2lubmVyLmFwcGVuZENoaWxkKGNsb3NlKTtcbiAgICAgICAgdGhpcy5faW5uZXIuYXBwZW5kQ2hpbGQodGhpcy5fcGFyYW1ldGVyRG9jdW1lbnRhdGlvbik7XG4gICAgfVxuICAgIG1vdmVJbmRleChkaXJlY3Rpb24pIHtcbiAgICAgICAgaWYgKCF0aGlzLl9tZW1iZXIpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHRoaXMuX3NlbGVjdGVkSW5kZXggKz0gZGlyZWN0aW9uO1xuICAgICAgICBpZiAodGhpcy5fc2VsZWN0ZWRJbmRleCA8IDApIHtcbiAgICAgICAgICAgIHRoaXMuX3NlbGVjdGVkSW5kZXggPSB0aGlzLl9tZW1iZXIuU2lnbmF0dXJlcy5sZW5ndGggLSAxO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLl9zZWxlY3RlZEluZGV4ID4gdGhpcy5fbWVtYmVyLlNpZ25hdHVyZXMubGVuZ3RoIC0gMSkge1xuICAgICAgICAgICAgdGhpcy5fc2VsZWN0ZWRJbmRleCA9IDA7XG4gICAgICAgIH1cbiAgICAgICAgZmFzdGRvbS5tdXRhdGUoKCkgPT4gdGhpcy5fY291bnQuaW5uZXJUZXh0ID0gKHRoaXMuX3NlbGVjdGVkSW5kZXggKyAxKS50b1N0cmluZygpKTtcbiAgICAgICAgdGhpcy51cGRhdGVNZW1iZXIodGhpcy5fbWVtYmVyKTtcbiAgICB9XG4gICAgX3NldHVwQXJyb3dzKCkge1xuICAgICAgICBjb25zdCB1cCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJhXCIpO1xuICAgICAgICB1cC5jbGFzc0xpc3QuYWRkKFwiaWNvbi1hcnJvdy11cFwiKTtcbiAgICAgICAgdXAub25jbGljayA9ICgpID0+IHRoaXMubW92ZUluZGV4KC0xKTtcbiAgICAgICAgY29uc3QgZG93biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJhXCIpO1xuICAgICAgICBkb3duLmNsYXNzTGlzdC5hZGQoXCJpY29uLWFycm93LWRvd25cIik7XG4gICAgICAgIGRvd24ub25jbGljayA9ICgpID0+IHRoaXMubW92ZUluZGV4KDEpO1xuICAgICAgICB0aGlzLl9hcnJvd3MuYXBwZW5kQ2hpbGQodXApO1xuICAgICAgICB0aGlzLl9hcnJvd3MuYXBwZW5kQ2hpbGQoZG93bik7XG4gICAgfVxuICAgIHNldExpbmVIZWlnaHQoaGVpZ2h0KSB7XG4gICAgICAgIHRoaXMuX2VkaXRvckxpbmVIZWlnaHQgPSBoZWlnaHQ7XG4gICAgICAgIGlmICh0aGlzLl9tZW1iZXIpXG4gICAgICAgICAgICB0aGlzLnVwZGF0ZU1lbWJlcih0aGlzLl9tZW1iZXIpO1xuICAgIH1cbiAgICB1cGRhdGVNZW1iZXIobWVtYmVyKSB7XG4gICAgICAgIHRoaXMuX21lbWJlciA9IG1lbWJlcjtcbiAgICAgICAgaWYgKHRoaXMuX3NlbGVjdGVkSW5kZXggPT09IC0xKSB7XG4gICAgICAgICAgICB0aGlzLl9zZWxlY3RlZEluZGV4ID0gbWVtYmVyLkFjdGl2ZVNpZ25hdHVyZTtcbiAgICAgICAgICAgIGlmIChtZW1iZXIuQWN0aXZlU2lnbmF0dXJlID09PSAtMSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3NlbGVjdGVkSW5kZXggPSAwO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHNpZ25hdHVyZSA9IG1lbWJlci5TaWduYXR1cmVzW3RoaXMuX3NlbGVjdGVkSW5kZXhdO1xuICAgICAgICBpZiAoIXNpZ25hdHVyZSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgbGV0IGRvY3M7XG4gICAgICAgIGlmIChzaWduYXR1cmUuRG9jdW1lbnRhdGlvbilcbiAgICAgICAgICAgIGRvY3MgPSBwYXJzZVN0cmluZyhzaWduYXR1cmUuRG9jdW1lbnRhdGlvbik7XG4gICAgICAgIGlmICh0aGlzLl9sYXN0SW5kZXggIT09IHRoaXMuX3NlbGVjdGVkSW5kZXgpIHtcbiAgICAgICAgICAgIHRoaXMuX2xhc3RJbmRleCA9IHRoaXMuX3NlbGVjdGVkSW5kZXg7XG4gICAgICAgICAgICBmYXN0ZG9tLm11dGF0ZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5fY291bnQuaW5uZXJUZXh0ID0gKHRoaXMuX3NlbGVjdGVkSW5kZXggKyAxKS50b1N0cmluZygpO1xuICAgICAgICAgICAgICAgIHRoaXMuX2xhYmVsLmlubmVyVGV4dCA9IHNpZ25hdHVyZS5OYW1lO1xuICAgICAgICAgICAgICAgIHRoaXMuX2RvY3VtZW50YXRpb24uaW5uZXJUZXh0ID0gc2lnbmF0dXJlLkRvY3VtZW50YXRpb247XG4gICAgICAgICAgICAgICAgaWYgKGRvY3MgJiYgc2lnbmF0dXJlLkRvY3VtZW50YXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcyA9IGRvY3MuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJzdW1tYXJ5XCIpO1xuICAgICAgICAgICAgICAgICAgICBpZiAocy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHN1bW1hcnkgPSBfLnRyaW0oKHNbMF0pLmlubmVySFRNTCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9kb2N1bWVudGF0aW9uLmlubmVyVGV4dCA9IHN1bW1hcnk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9kb2N1bWVudGF0aW9uLmlubmVyVGV4dCA9IFwiXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9kb2N1bWVudGF0aW9uLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9kb2N1bWVudGF0aW9uLnN0eWxlLmRpc3BsYXkgPSBcIlwiO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZG9jdW1lbnRhdGlvbi5pbm5lclRleHQgPSBcIlwiO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9kb2N1bWVudGF0aW9uLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKG1lbWJlci5TaWduYXR1cmVzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fYXJyb3dzLnN0eWxlLmRpc3BsYXkgPSBcIlwiO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fYXJyb3dzLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRoaXMuX3BhcmFtZXRlcnNMaXN0ID0gW107XG4gICAgICAgICAgICBmYXN0ZG9tLm11dGF0ZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgcGFyYW1ldGVycyA9IHNpZ25hdHVyZS5QYXJhbWV0ZXJzO1xuICAgICAgICAgICAgICAgIGNvbnN0IHBhcmFtZXRlcnNFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICAgICAgICAgICAgXy5lYWNoKHBhcmFtZXRlcnMsIChwYXJhbWV0ZXIsIGkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdmlldyA9IG5ldyBleHBvcnRzLlNpZ25hdHVyZVBhcmFtZXRlclZpZXcoKTtcbiAgICAgICAgICAgICAgICAgICAgdmlldy5zZXRNZW1iZXIocGFyYW1ldGVyKTtcbiAgICAgICAgICAgICAgICAgICAgdmlldy5zZXRDdXJyZW50KGkgPT09IG1lbWJlci5BY3RpdmVQYXJhbWV0ZXIpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaSA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbW1hID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb21tYS5pbm5lclRleHQgPSBcIiwgXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJhbWV0ZXJzRWxlbWVudC5hcHBlbmRDaGlsZChjb21tYSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcGFyYW1ldGVyc0VsZW1lbnQuYXBwZW5kQ2hpbGQodmlldyk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3BhcmFtZXRlcnNMaXN0LnB1c2godmlldyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY29uc3QgY3VycmVudEVsZW1lbnQgPSB0aGlzLl9wYXJhbWV0ZXJzO1xuICAgICAgICAgICAgICAgIHRoaXMuX2lubmVyLmluc2VydEJlZm9yZShwYXJhbWV0ZXJzRWxlbWVudCwgY3VycmVudEVsZW1lbnQpO1xuICAgICAgICAgICAgICAgIHRoaXMuX2lubmVyLnJlbW92ZUNoaWxkKGN1cnJlbnRFbGVtZW50KTtcbiAgICAgICAgICAgICAgICB0aGlzLl9wYXJhbWV0ZXJzID0gcGFyYW1ldGVyc0VsZW1lbnQ7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGZhc3Rkb20ubXV0YXRlKCgpID0+IHtcbiAgICAgICAgICAgICAgICBfLmVhY2goc2lnbmF0dXJlLlBhcmFtZXRlcnMsIChwYXJhbSwgaSkgPT4gdGhpcy5fcGFyYW1ldGVyc0xpc3RbaV0gJiYgdGhpcy5fcGFyYW1ldGVyc0xpc3RbaV0uc2V0Q3VycmVudChpID09PSBtZW1iZXIuQWN0aXZlUGFyYW1ldGVyKSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBjdXJyZW50UGFyYW1ldGVyID0gc2lnbmF0dXJlLlBhcmFtZXRlcnNbbWVtYmVyLkFjdGl2ZVBhcmFtZXRlcl07XG4gICAgICAgIGZhc3Rkb20ubWVhc3VyZSgoKSA9PiB7XG4gICAgICAgICAgICBpZiAoIWN1cnJlbnRQYXJhbWV0ZXIpXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgbGV0IHN1bW1hcnk7XG4gICAgICAgICAgICBpZiAoY3VycmVudFBhcmFtZXRlci5Eb2N1bWVudGF0aW9uKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcGFyYW1Eb2NzID0gcGFyc2VTdHJpbmcoY3VycmVudFBhcmFtZXRlci5Eb2N1bWVudGF0aW9uKTtcbiAgICAgICAgICAgICAgICBpZiAocGFyYW1Eb2NzKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHMgPSBwYXJhbURvY3MuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJzdW1tYXJ5XCIpO1xuICAgICAgICAgICAgICAgICAgICBpZiAocy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHN1bW1hcnlFbGVtZW50ID0gc1swXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzdW1tYXJ5RWxlbWVudClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdW1tYXJ5ID0gXy50cmltKHN1bW1hcnlFbGVtZW50LmlubmVySFRNTCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZG9jcyAmJiAhc3VtbWFyeSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHMgPSBkb2NzLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwicGFyYW1cIik7XG4gICAgICAgICAgICAgICAgaWYgKHMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHBhcmFtID0gXy5maW5kKHMsIHggPT4geC5hdHRyaWJ1dGVzW1wibmFtZVwiXSAmJiB4LmF0dHJpYnV0ZXNbXCJuYW1lXCJdLnZhbHVlID09PSBjdXJyZW50UGFyYW1ldGVyLk5hbWUpO1xuICAgICAgICAgICAgICAgICAgICBpZiAocGFyYW0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1bW1hcnkgPSBfLnRyaW0ocGFyYW0uaW5uZXJIVE1MKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLl9wYXJhbWV0ZXJEb2N1bWVudGF0aW9uLmlubmVyVGV4dCAhPT0gc3VtbWFyeSkge1xuICAgICAgICAgICAgICAgIGlmIChzdW1tYXJ5KSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3BhcmFtZXRlckRvY3VtZW50YXRpb24uaW5uZXJUZXh0ID0gc3VtbWFyeTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3BhcmFtZXRlckRvY3VtZW50YXRpb24uaW5uZXJUZXh0ID0gXCJcIjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBmYXN0ZG9tLm11dGF0ZSgoKSA9PiB0aGlzLnN0eWxlLmJvdHRvbSA9IGAke3RoaXMuY2xpZW50SGVpZ2h0ICsgdGhpcy5fZWRpdG9yTGluZUhlaWdodH1weGApO1xuICAgIH1cbiAgICBkZXRhY2hlZENhbGxiYWNrKCkge1xuICAgICAgICBfLmVhY2godGhpcy5fcGFyYW1ldGVyc0xpc3QsIHBhcmFtZXRlciA9PiBwYXJhbWV0ZXIucmVtb3ZlKCkpO1xuICAgICAgICB0aGlzLl9wYXJhbWV0ZXJzTGlzdCA9IFtdO1xuICAgIH1cbn1cbmV4cG9ydHMuU2lnbmF0dXJlVmlldyA9IGRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudChcIm9tbmlzaGFycC1zaWduYXR1cmUtaGVscFwiLCB7IHByb3RvdHlwZTogU2lnbmF0dXJlVmlldy5wcm90b3R5cGUgfSk7XG5leHBvcnQgY2xhc3MgU2lnbmF0dXJlUGFyYW1ldGVyVmlldyBleHRlbmRzIEhUTUxTcGFuRWxlbWVudCB7XG4gICAgY3JlYXRlZENhbGxiYWNrKCkge1xuICAgICAgICB0aGlzLl9sYWJlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICB0aGlzLmFwcGVuZENoaWxkKHRoaXMuX2xhYmVsKTtcbiAgICB9XG4gICAgc2V0TWVtYmVyKG1lbWJlcikge1xuICAgICAgICB0aGlzLl9tZW1iZXIgPSBtZW1iZXI7XG4gICAgICAgIHRoaXMuX2xhYmVsLmlubmVyVGV4dCA9IG1lbWJlci5MYWJlbDtcbiAgICB9XG4gICAgc2V0Q3VycmVudChjdXJyZW50KSB7XG4gICAgICAgIGZhc3Rkb20ubWVhc3VyZSgoKSA9PiB7XG4gICAgICAgICAgICBpZiAoIWN1cnJlbnQgJiYgdGhpcy5zdHlsZS5mb250V2VpZ2h0ID09PSBcImJvbGRcIikge1xuICAgICAgICAgICAgICAgIGZhc3Rkb20ubXV0YXRlKCgpID0+IHRoaXMuc3R5bGUuZm9udFdlaWdodCA9IFwiXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoY3VycmVudCAmJiB0aGlzLnN0eWxlLmZvbnRXZWlnaHQgIT09IFwiYm9sZFwiKSB7XG4gICAgICAgICAgICAgICAgZmFzdGRvbS5tdXRhdGUoKCkgPT4gdGhpcy5zdHlsZS5mb250V2VpZ2h0ID0gXCJib2xkXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG59XG5leHBvcnRzLlNpZ25hdHVyZVBhcmFtZXRlclZpZXcgPSBkb2N1bWVudC5yZWdpc3RlckVsZW1lbnQoXCJvbW5pc2hhcnAtc2lnbmF0dXJlLXBhcmFtZXRlclwiLCB7IHByb3RvdHlwZTogU2lnbmF0dXJlUGFyYW1ldGVyVmlldy5wcm90b3R5cGUgfSk7XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vdHlwaW5ncy5kLnRzXCIgLz5cclxuLyogdHNsaW50OmRpc2FibGU6bm8tc3RyaW5nLWxpdGVyYWwgKi9cclxuaW1wb3J0IHtNb2RlbHN9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XHJcbmxldCBmYXN0ZG9tOiB0eXBlb2YgRmFzdGRvbSA9IHJlcXVpcmUoXCJmYXN0ZG9tXCIpO1xyXG5pbXBvcnQgXyBmcm9tIFwibG9kYXNoXCI7XHJcblxyXG5jb25zdCBwYXJzZVN0cmluZyA9IChmdW5jdGlvbigpIHtcclxuICAgIGNvbnN0IHBhcnNlciA9IG5ldyBET01QYXJzZXIoKTtcclxuXHJcbiAgICByZXR1cm4gZnVuY3Rpb24oeG1sOiBzdHJpbmcpIHtcclxuICAgICAgICByZXR1cm4gcGFyc2VyLnBhcnNlRnJvbVN0cmluZyh4bWwsIFwidGV4dC94bWxcIik7XHJcbiAgICB9O1xyXG59KSgpO1xyXG5cclxuZXhwb3J0IGNsYXNzIFNpZ25hdHVyZVZpZXcgZXh0ZW5kcyBIVE1MRGl2RWxlbWVudCB7IC8qIGltcGxlbWVudHMgV2ViQ29tcG9uZW50ICovXHJcbiAgICBwcml2YXRlIF9tZW1iZXI6IE1vZGVscy5TaWduYXR1cmVIZWxwO1xyXG4gICAgcHJpdmF0ZSBfaW5uZXI6IEhUTUxEaXZFbGVtZW50O1xyXG4gICAgcHJpdmF0ZSBfbGFiZWw6IEhUTUxTcGFuRWxlbWVudDtcclxuICAgIHByaXZhdGUgX2RvY3VtZW50YXRpb246IEhUTUxEaXZFbGVtZW50O1xyXG4gICAgcHJpdmF0ZSBfcGFyYW1ldGVyRG9jdW1lbnRhdGlvbjogSFRNTERpdkVsZW1lbnQ7XHJcbiAgICBwcml2YXRlIF9hcnJvd3M6IEhUTUxTcGFuRWxlbWVudDtcclxuICAgIHByaXZhdGUgX3BhcmFtZXRlcnNMaXN0OiBTaWduYXR1cmVQYXJhbWV0ZXJWaWV3W10gPSBbXTtcclxuICAgIHByaXZhdGUgX3BhcmFtZXRlcnM6IEhUTUxTcGFuRWxlbWVudDtcclxuICAgIHByaXZhdGUgX2NvdW50OiBIVE1MU3BhbkVsZW1lbnQ7XHJcbiAgICBwcml2YXRlIF9zZWxlY3RlZEluZGV4OiBudW1iZXI7XHJcbiAgICBwcml2YXRlIF9sYXN0SW5kZXg6IG51bWJlcjtcclxuICAgIHByaXZhdGUgX2VkaXRvckxpbmVIZWlnaHQ6IG51bWJlcjtcclxuXHJcbiAgICBwdWJsaWMgY3JlYXRlZENhbGxiYWNrKCkge1xyXG4gICAgICAgIHRoaXMuX3NlbGVjdGVkSW5kZXggPSAtMTtcclxuICAgICAgICB0aGlzLl9sYXN0SW5kZXggPSAtMTtcclxuICAgICAgICB0aGlzLl9lZGl0b3JMaW5lSGVpZ2h0ID0gMDtcclxuXHJcbiAgICAgICAgdGhpcy5faW5uZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gICAgICAgIHRoaXMuX2xhYmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XHJcbiAgICAgICAgdGhpcy5fZG9jdW1lbnRhdGlvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgICAgICAgdGhpcy5fcGFyYW1ldGVyRG9jdW1lbnRhdGlvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgICAgICAgdGhpcy5fcGFyYW1ldGVyRG9jdW1lbnRhdGlvbi5zdHlsZS5tYXJnaW5MZWZ0ID0gXCIyLjRlbVwiO1xyXG4gICAgICAgIHRoaXMuX2Fycm93cyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xyXG4gICAgICAgIHRoaXMuX3BhcmFtZXRlcnMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcclxuICAgICAgICB0aGlzLl9jb3VudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xyXG4gICAgICAgIHRoaXMuX3BhcmFtZXRlcnNMaXN0ID0gW107XHJcblxyXG4gICAgICAgIHRoaXMuY2xhc3NMaXN0LmFkZChcInRvb2x0aXBcIik7XHJcbiAgICAgICAgdGhpcy5faW5uZXIuY2xhc3NMaXN0LmFkZChcInRvb2x0aXAtaW5uZXJcIik7XHJcblxyXG4gICAgICAgIHRoaXMuX3NldHVwQXJyb3dzKCk7XHJcblxyXG4gICAgICAgIGxldCBvcGVuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XHJcbiAgICAgICAgb3Blbi5pbm5lclRleHQgPSBcIihcIjtcclxuXHJcbiAgICAgICAgbGV0IGNsb3NlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XHJcbiAgICAgICAgY2xvc2UuaW5uZXJUZXh0ID0gXCIpXCI7XHJcblxyXG4gICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQodGhpcy5faW5uZXIpO1xyXG4gICAgICAgIHRoaXMuX2lubmVyLmFwcGVuZENoaWxkKHRoaXMuX2RvY3VtZW50YXRpb24pO1xyXG5cclxuICAgICAgICB0aGlzLl9pbm5lci5hcHBlbmRDaGlsZCh0aGlzLl9hcnJvd3MpO1xyXG5cclxuICAgICAgICB0aGlzLl9pbm5lci5hcHBlbmRDaGlsZCh0aGlzLl9sYWJlbCk7XHJcbiAgICAgICAgdGhpcy5faW5uZXIuYXBwZW5kQ2hpbGQob3Blbik7XHJcbiAgICAgICAgdGhpcy5faW5uZXIuYXBwZW5kQ2hpbGQodGhpcy5fcGFyYW1ldGVycyk7XHJcbiAgICAgICAgdGhpcy5faW5uZXIuYXBwZW5kQ2hpbGQoY2xvc2UpO1xyXG5cclxuICAgICAgICBvcGVuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XHJcbiAgICAgICAgb3Blbi5pbm5lclRleHQgPSBcIiBbXCI7XHJcblxyXG4gICAgICAgIGNsb3NlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XHJcbiAgICAgICAgY2xvc2UuaW5uZXJUZXh0ID0gXCJdXCI7XHJcblxyXG4gICAgICAgIHRoaXMuX2lubmVyLmFwcGVuZENoaWxkKG9wZW4pO1xyXG4gICAgICAgIHRoaXMuX2lubmVyLmFwcGVuZENoaWxkKHRoaXMuX2NvdW50KTtcclxuICAgICAgICB0aGlzLl9pbm5lci5hcHBlbmRDaGlsZChjbG9zZSk7XHJcblxyXG4gICAgICAgIHRoaXMuX2lubmVyLmFwcGVuZENoaWxkKHRoaXMuX3BhcmFtZXRlckRvY3VtZW50YXRpb24pO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBtb3ZlSW5kZXgoZGlyZWN0aW9uOiBudW1iZXIpIHtcclxuICAgICAgICBpZiAoIXRoaXMuX21lbWJlcikgcmV0dXJuO1xyXG4gICAgICAgIHRoaXMuX3NlbGVjdGVkSW5kZXggKz0gZGlyZWN0aW9uO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5fc2VsZWN0ZWRJbmRleCA8IDApIHtcclxuICAgICAgICAgICAgdGhpcy5fc2VsZWN0ZWRJbmRleCA9IHRoaXMuX21lbWJlci5TaWduYXR1cmVzLmxlbmd0aCAtIDE7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5fc2VsZWN0ZWRJbmRleCA+IHRoaXMuX21lbWJlci5TaWduYXR1cmVzLmxlbmd0aCAtIDEpIHtcclxuICAgICAgICAgICAgdGhpcy5fc2VsZWN0ZWRJbmRleCA9IDA7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmYXN0ZG9tLm11dGF0ZSgoKSA9PiB0aGlzLl9jb3VudC5pbm5lclRleHQgPSAodGhpcy5fc2VsZWN0ZWRJbmRleCArIDEpLnRvU3RyaW5nKCkpO1xyXG4gICAgICAgIHRoaXMudXBkYXRlTWVtYmVyKHRoaXMuX21lbWJlcik7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfc2V0dXBBcnJvd3MoKSB7XHJcbiAgICAgICAgY29uc3QgdXAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYVwiKTtcclxuICAgICAgICB1cC5jbGFzc0xpc3QuYWRkKFwiaWNvbi1hcnJvdy11cFwiKTtcclxuICAgICAgICB1cC5vbmNsaWNrID0gKCkgPT4gdGhpcy5tb3ZlSW5kZXgoLTEpO1xyXG5cclxuICAgICAgICBjb25zdCBkb3duID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImFcIik7XHJcbiAgICAgICAgZG93bi5jbGFzc0xpc3QuYWRkKFwiaWNvbi1hcnJvdy1kb3duXCIpO1xyXG4gICAgICAgIGRvd24ub25jbGljayA9ICgpID0+IHRoaXMubW92ZUluZGV4KDEpO1xyXG5cclxuICAgICAgICB0aGlzLl9hcnJvd3MuYXBwZW5kQ2hpbGQodXApO1xyXG4gICAgICAgIHRoaXMuX2Fycm93cy5hcHBlbmRDaGlsZChkb3duKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2V0TGluZUhlaWdodChoZWlnaHQ6IG51bWJlcikge1xyXG4gICAgICAgIHRoaXMuX2VkaXRvckxpbmVIZWlnaHQgPSBoZWlnaHQ7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9tZW1iZXIpXHJcbiAgICAgICAgICAgIHRoaXMudXBkYXRlTWVtYmVyKHRoaXMuX21lbWJlcik7XHJcbiAgICB9XHJcblxyXG4gICAgLy9AX2QobSA9PiBfLmRlYm91bmNlKG0sIDIwMCwgeyBsZWFkaW5nOiB0cnVlLCB0cmFpbGluZzogdHJ1ZSB9KSlcclxuICAgIHB1YmxpYyB1cGRhdGVNZW1iZXIobWVtYmVyOiBNb2RlbHMuU2lnbmF0dXJlSGVscCkge1xyXG4gICAgICAgIHRoaXMuX21lbWJlciA9IG1lbWJlcjtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX3NlbGVjdGVkSW5kZXggPT09IC0xKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3NlbGVjdGVkSW5kZXggPSBtZW1iZXIuQWN0aXZlU2lnbmF0dXJlO1xyXG4gICAgICAgICAgICBpZiAobWVtYmVyLkFjdGl2ZVNpZ25hdHVyZSA9PT0gLTEpIHtcclxuICAgICAgICAgICAgICAgIC8vIFRoZSBzZXJ2ZXIgYmFzaWNhbGx5IHRocmV3IHVwIGl0cyBhcm1zIGFuZCBzYWlkIGZ1Y2sgaXQuLi5cclxuICAgICAgICAgICAgICAgIHRoaXMuX3NlbGVjdGVkSW5kZXggPSAwO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBzaWduYXR1cmUgPSBtZW1iZXIuU2lnbmF0dXJlc1t0aGlzLl9zZWxlY3RlZEluZGV4XTtcclxuICAgICAgICBpZiAoIXNpZ25hdHVyZSkgcmV0dXJuO1xyXG5cclxuICAgICAgICBsZXQgZG9jczogRG9jdW1lbnQ7XHJcbiAgICAgICAgaWYgKHNpZ25hdHVyZS5Eb2N1bWVudGF0aW9uKVxyXG4gICAgICAgICAgICBkb2NzID0gcGFyc2VTdHJpbmcoc2lnbmF0dXJlLkRvY3VtZW50YXRpb24pO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5fbGFzdEluZGV4ICE9PSB0aGlzLl9zZWxlY3RlZEluZGV4KSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2xhc3RJbmRleCA9IHRoaXMuX3NlbGVjdGVkSW5kZXg7XHJcbiAgICAgICAgICAgIGZhc3Rkb20ubXV0YXRlKCgpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2NvdW50LmlubmVyVGV4dCA9ICh0aGlzLl9zZWxlY3RlZEluZGV4ICsgMSkudG9TdHJpbmcoKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2xhYmVsLmlubmVyVGV4dCA9IHNpZ25hdHVyZS5OYW1lO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fZG9jdW1lbnRhdGlvbi5pbm5lclRleHQgPSBzaWduYXR1cmUuRG9jdW1lbnRhdGlvbjtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoZG9jcyAmJiBzaWduYXR1cmUuRG9jdW1lbnRhdGlvbikge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHM6IE5vZGVMaXN0T2Y8SFRNTEVsZW1lbnQ+ID0gPGFueT5kb2NzLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwic3VtbWFyeVwiKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAocy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3VtbWFyeSA9IF8udHJpbSgoc1swXSkuaW5uZXJIVE1MKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fZG9jdW1lbnRhdGlvbi5pbm5lclRleHQgPSBzdW1tYXJ5O1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2RvY3VtZW50YXRpb24uaW5uZXJUZXh0ID0gXCJcIjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fZG9jdW1lbnRhdGlvbi5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9kb2N1bWVudGF0aW9uLnN0eWxlLmRpc3BsYXkgPSBcIlwiO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9kb2N1bWVudGF0aW9uLmlubmVyVGV4dCA9IFwiXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZG9jdW1lbnRhdGlvbi5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKG1lbWJlci5TaWduYXR1cmVzLmxlbmd0aCA+IDEpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9hcnJvd3Muc3R5bGUuZGlzcGxheSA9IFwiXCI7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2Fycm93cy5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5fcGFyYW1ldGVyc0xpc3QgPSBbXTtcclxuXHJcbiAgICAgICAgICAgIGZhc3Rkb20ubXV0YXRlKCgpID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHBhcmFtZXRlcnMgPSBzaWduYXR1cmUuUGFyYW1ldGVycztcclxuICAgICAgICAgICAgICAgIGNvbnN0IHBhcmFtZXRlcnNFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XHJcbiAgICAgICAgICAgICAgICBfLmVhY2gocGFyYW1ldGVycywgKHBhcmFtZXRlciwgaSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHZpZXc6IFNpZ25hdHVyZVBhcmFtZXRlclZpZXcgPSA8YW55Pm5ldyBleHBvcnRzLlNpZ25hdHVyZVBhcmFtZXRlclZpZXcoKTtcclxuICAgICAgICAgICAgICAgICAgICB2aWV3LnNldE1lbWJlcihwYXJhbWV0ZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHZpZXcuc2V0Q3VycmVudChpID09PSBtZW1iZXIuQWN0aXZlUGFyYW1ldGVyKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGkgPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbW1hID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbW1hLmlubmVyVGV4dCA9IFwiLCBcIjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGFyYW1ldGVyc0VsZW1lbnQuYXBwZW5kQ2hpbGQoY29tbWEpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgcGFyYW1ldGVyc0VsZW1lbnQuYXBwZW5kQ2hpbGQodmlldyk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcGFyYW1ldGVyc0xpc3QucHVzaCh2aWV3KTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRFbGVtZW50ID0gdGhpcy5fcGFyYW1ldGVycztcclxuICAgICAgICAgICAgICAgIHRoaXMuX2lubmVyLmluc2VydEJlZm9yZShwYXJhbWV0ZXJzRWxlbWVudCwgY3VycmVudEVsZW1lbnQpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5faW5uZXIucmVtb3ZlQ2hpbGQoY3VycmVudEVsZW1lbnQpO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMuX3BhcmFtZXRlcnMgPSBwYXJhbWV0ZXJzRWxlbWVudDtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgZmFzdGRvbS5tdXRhdGUoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgXy5lYWNoKHNpZ25hdHVyZS5QYXJhbWV0ZXJzLCAocGFyYW0sIGkpID0+XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcGFyYW1ldGVyc0xpc3RbaV0gJiYgdGhpcy5fcGFyYW1ldGVyc0xpc3RbaV0uc2V0Q3VycmVudChpID09PSBtZW1iZXIuQWN0aXZlUGFyYW1ldGVyKSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgY3VycmVudFBhcmFtZXRlciA9IHNpZ25hdHVyZS5QYXJhbWV0ZXJzW21lbWJlci5BY3RpdmVQYXJhbWV0ZXJdO1xyXG4gICAgICAgIGZhc3Rkb20ubWVhc3VyZSgoKSA9PiB7XHJcbiAgICAgICAgICAgIGlmICghY3VycmVudFBhcmFtZXRlcikgcmV0dXJuO1xyXG4gICAgICAgICAgICBsZXQgc3VtbWFyeTogc3RyaW5nO1xyXG4gICAgICAgICAgICBpZiAoY3VycmVudFBhcmFtZXRlci5Eb2N1bWVudGF0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBwYXJhbURvY3MgPSBwYXJzZVN0cmluZyhjdXJyZW50UGFyYW1ldGVyLkRvY3VtZW50YXRpb24pO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChwYXJhbURvY3MpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBzOiBOb2RlTGlzdE9mPEhUTUxFbGVtZW50PiA9IDxhbnk+cGFyYW1Eb2NzLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwic3VtbWFyeVwiKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAocy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3VtbWFyeUVsZW1lbnQgPSBzWzBdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3VtbWFyeUVsZW1lbnQpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdW1tYXJ5ID0gXy50cmltKHN1bW1hcnlFbGVtZW50LmlubmVySFRNTCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoZG9jcyAmJiAhc3VtbWFyeSkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgczogTm9kZUxpc3RPZjxIVE1MRWxlbWVudD4gPSA8YW55PmRvY3MuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJwYXJhbVwiKTtcclxuICAgICAgICAgICAgICAgIGlmIChzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHBhcmFtID0gPEhUTUxFbGVtZW50Pl8uZmluZChzLCB4ID0+IHguYXR0cmlidXRlc1tcIm5hbWVcIl0gJiYgeC5hdHRyaWJ1dGVzW1wibmFtZVwiXS52YWx1ZSA9PT0gY3VycmVudFBhcmFtZXRlci5OYW1lKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAocGFyYW0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3VtbWFyeSA9IF8udHJpbShwYXJhbS5pbm5lckhUTUwpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHRoaXMuX3BhcmFtZXRlckRvY3VtZW50YXRpb24uaW5uZXJUZXh0ICE9PSBzdW1tYXJ5KSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoc3VtbWFyeSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3BhcmFtZXRlckRvY3VtZW50YXRpb24uaW5uZXJUZXh0ID0gc3VtbWFyeTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcGFyYW1ldGVyRG9jdW1lbnRhdGlvbi5pbm5lclRleHQgPSBcIlwiO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGZhc3Rkb20ubXV0YXRlKCgpID0+IHRoaXMuc3R5bGUuYm90dG9tID0gYCR7dGhpcy5jbGllbnRIZWlnaHQgKyB0aGlzLl9lZGl0b3JMaW5lSGVpZ2h0fXB4YCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRldGFjaGVkQ2FsbGJhY2soKSB7XHJcbiAgICAgICAgXy5lYWNoKHRoaXMuX3BhcmFtZXRlcnNMaXN0LCBwYXJhbWV0ZXIgPT4gcGFyYW1ldGVyLnJlbW92ZSgpKTtcclxuICAgICAgICB0aGlzLl9wYXJhbWV0ZXJzTGlzdCA9IFtdO1xyXG4gICAgfVxyXG59XHJcblxyXG4oPGFueT5leHBvcnRzKS5TaWduYXR1cmVWaWV3ID0gKDxhbnk+ZG9jdW1lbnQpLnJlZ2lzdGVyRWxlbWVudChcIm9tbmlzaGFycC1zaWduYXR1cmUtaGVscFwiLCB7IHByb3RvdHlwZTogU2lnbmF0dXJlVmlldy5wcm90b3R5cGUgfSk7XHJcblxyXG5leHBvcnQgY2xhc3MgU2lnbmF0dXJlUGFyYW1ldGVyVmlldyBleHRlbmRzIEhUTUxTcGFuRWxlbWVudCB7IC8qIGltcGxlbWVudHMgV2ViQ29tcG9uZW50ICovXHJcbiAgICBwcml2YXRlIF9tZW1iZXI6IE1vZGVscy5TaWduYXR1cmVIZWxwUGFyYW1ldGVyO1xyXG4gICAgcHJpdmF0ZSBfbGFiZWw6IEhUTUxTcGFuRWxlbWVudDtcclxuXHJcbiAgICBwdWJsaWMgY3JlYXRlZENhbGxiYWNrKCkge1xyXG4gICAgICAgIHRoaXMuX2xhYmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XHJcbiAgICAgICAgdGhpcy5hcHBlbmRDaGlsZCh0aGlzLl9sYWJlbCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHNldE1lbWJlcihtZW1iZXI6IE1vZGVscy5TaWduYXR1cmVIZWxwUGFyYW1ldGVyKSB7XHJcbiAgICAgICAgdGhpcy5fbWVtYmVyID0gbWVtYmVyO1xyXG4gICAgICAgIHRoaXMuX2xhYmVsLmlubmVyVGV4dCA9IG1lbWJlci5MYWJlbDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2V0Q3VycmVudChjdXJyZW50OiBib29sZWFuKSB7XHJcbiAgICAgICAgZmFzdGRvbS5tZWFzdXJlKCgpID0+IHtcclxuICAgICAgICAgICAgaWYgKCFjdXJyZW50ICYmIHRoaXMuc3R5bGUuZm9udFdlaWdodCA9PT0gXCJib2xkXCIpIHtcclxuICAgICAgICAgICAgICAgIGZhc3Rkb20ubXV0YXRlKCgpID0+IHRoaXMuc3R5bGUuZm9udFdlaWdodCA9IFwiXCIpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGN1cnJlbnQgJiYgdGhpcy5zdHlsZS5mb250V2VpZ2h0ICE9PSBcImJvbGRcIikge1xyXG4gICAgICAgICAgICAgICAgZmFzdGRvbS5tdXRhdGUoKCkgPT4gdGhpcy5zdHlsZS5mb250V2VpZ2h0ID0gXCJib2xkXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbig8YW55PmV4cG9ydHMpLlNpZ25hdHVyZVBhcmFtZXRlclZpZXcgPSAoPGFueT5kb2N1bWVudCkucmVnaXN0ZXJFbGVtZW50KFwib21uaXNoYXJwLXNpZ25hdHVyZS1wYXJhbWV0ZXJcIiwgeyBwcm90b3R5cGU6IFNpZ25hdHVyZVBhcmFtZXRlclZpZXcucHJvdG90eXBlIH0pO1xyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
