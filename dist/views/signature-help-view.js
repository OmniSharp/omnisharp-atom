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
        _classCallCheck(this, SignatureView);

        var _this = _possibleConstructorReturn(this, (SignatureView.__proto__ || Object.getPrototypeOf(SignatureView)).apply(this, arguments));

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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy9zaWduYXR1cmUtaGVscC12aWV3LmpzIiwibGliL3ZpZXdzL3NpZ25hdHVyZS1oZWxwLXZpZXcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQ0E7Ozs7Ozs7Ozs7OztBQ0VBLElBQUksVUFBMEIsUUFBUSxTQUFSLENBQTFCOztBQUdKLElBQU0sY0FBYyxZQUFDO0FBQ2pCLFFBQU0sU0FBUyxJQUFJLFNBQUosRUFBVCxDQURXO0FBR2pCLFdBQU8sVUFBUyxHQUFULEVBQW9CO0FBQ3ZCLGVBQU8sT0FBTyxlQUFQLENBQXVCLEdBQXZCLEVBQTRCLFVBQTVCLENBQVAsQ0FEdUI7S0FBcEIsQ0FIVTtDQUFBLEVBQWY7O0lBUU47OztBQUFBLDZCQUFBOzs7bUlBQW1DLFlBQW5DOztBQU9ZLGNBQUEsZUFBQSxHQUE0QyxFQUE1QyxDQVBaOztLQUFBOzs7OzBDQWMwQjtBQUNsQixpQkFBSyxjQUFMLEdBQXNCLENBQUMsQ0FBRCxDQURKO0FBRWxCLGlCQUFLLFVBQUwsR0FBa0IsQ0FBQyxDQUFELENBRkE7QUFHbEIsaUJBQUssaUJBQUwsR0FBeUIsQ0FBekIsQ0FIa0I7QUFLbEIsaUJBQUssTUFBTCxHQUFjLFNBQVMsYUFBVCxDQUF1QixLQUF2QixDQUFkLENBTGtCO0FBTWxCLGlCQUFLLE1BQUwsR0FBYyxTQUFTLGFBQVQsQ0FBdUIsTUFBdkIsQ0FBZCxDQU5rQjtBQU9sQixpQkFBSyxjQUFMLEdBQXNCLFNBQVMsYUFBVCxDQUF1QixLQUF2QixDQUF0QixDQVBrQjtBQVFsQixpQkFBSyx1QkFBTCxHQUErQixTQUFTLGFBQVQsQ0FBdUIsS0FBdkIsQ0FBL0IsQ0FSa0I7QUFTbEIsaUJBQUssdUJBQUwsQ0FBNkIsS0FBN0IsQ0FBbUMsVUFBbkMsR0FBZ0QsT0FBaEQsQ0FUa0I7QUFVbEIsaUJBQUssT0FBTCxHQUFlLFNBQVMsYUFBVCxDQUF1QixNQUF2QixDQUFmLENBVmtCO0FBV2xCLGlCQUFLLFdBQUwsR0FBbUIsU0FBUyxh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QUFmLENBRDhDO2lCQUFsRCxNQUVPLElBQUksV0FBVyxPQUFLLEtBQUwsQ0FBVyxVQUFYLEtBQTBCLE1BQTFCLEVBQWtDO0FBQ3BELDRCQUFRLE1BQVIsQ0FBZTsrQkFBTSxPQUFLLEtBQUwsQ0FBVyxVQUFYLEdBQXdCLE1BQXhCO3FCQUFOLENBQWYsQ0FEb0Q7aUJBQWpEO2FBSEssQ0FBaEIsQ0FEOEI7Ozs7O0VBZE07O0FBeUJ0QyxRQUFTLHNCQUFULEdBQXdDLFNBQVUsZUFBVixDQUEwQiwrQkFBMUIsRUFBMkQsRUFBRSxXQUFXLHVCQUF1QixTQUF2QixFQUF4RSxDQUF4QyIsImZpbGUiOiJsaWIvdmlld3Mvc2lnbmF0dXJlLWhlbHAtdmlldy5qcyIsInNvdXJjZXNDb250ZW50IjpbImxldCBmYXN0ZG9tID0gcmVxdWlyZShcImZhc3Rkb21cIik7XG5pbXBvcnQgXyBmcm9tIFwibG9kYXNoXCI7XG5jb25zdCBwYXJzZVN0cmluZyA9IChmdW5jdGlvbiAoKSB7XG4gICAgY29uc3QgcGFyc2VyID0gbmV3IERPTVBhcnNlcigpO1xuICAgIHJldHVybiBmdW5jdGlvbiAoeG1sKSB7XG4gICAgICAgIHJldHVybiBwYXJzZXIucGFyc2VGcm9tU3RyaW5nKHhtbCwgXCJ0ZXh0L3htbFwiKTtcbiAgICB9O1xufSkoKTtcbmV4cG9ydCBjbGFzcyBTaWduYXR1cmVWaWV3IGV4dGVuZHMgSFRNTERpdkVsZW1lbnQge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlciguLi5hcmd1bWVudHMpO1xuICAgICAgICB0aGlzLl9wYXJhbWV0ZXJzTGlzdCA9IFtdO1xuICAgIH1cbiAgICBjcmVhdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMuX3NlbGVjdGVkSW5kZXggPSAtMTtcbiAgICAgICAgdGhpcy5fbGFzdEluZGV4ID0gLTE7XG4gICAgICAgIHRoaXMuX2VkaXRvckxpbmVIZWlnaHQgPSAwO1xuICAgICAgICB0aGlzLl9pbm5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgIHRoaXMuX2xhYmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICAgIHRoaXMuX2RvY3VtZW50YXRpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICB0aGlzLl9wYXJhbWV0ZXJEb2N1bWVudGF0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgdGhpcy5fcGFyYW1ldGVyRG9jdW1lbnRhdGlvbi5zdHlsZS5tYXJnaW5MZWZ0ID0gXCIyLjRlbVwiO1xuICAgICAgICB0aGlzLl9hcnJvd3MgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgdGhpcy5fcGFyYW1ldGVycyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICB0aGlzLl9jb3VudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICB0aGlzLl9wYXJhbWV0ZXJzTGlzdCA9IFtdO1xuICAgICAgICB0aGlzLmNsYXNzTGlzdC5hZGQoXCJ0b29sdGlwXCIpO1xuICAgICAgICB0aGlzLl9pbm5lci5jbGFzc0xpc3QuYWRkKFwidG9vbHRpcC1pbm5lclwiKTtcbiAgICAgICAgdGhpcy5fc2V0dXBBcnJvd3MoKTtcbiAgICAgICAgbGV0IG9wZW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgb3Blbi5pbm5lclRleHQgPSBcIihcIjtcbiAgICAgICAgbGV0IGNsb3NlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICAgIGNsb3NlLmlubmVyVGV4dCA9IFwiKVwiO1xuICAgICAgICB0aGlzLmFwcGVuZENoaWxkKHRoaXMuX2lubmVyKTtcbiAgICAgICAgdGhpcy5faW5uZXIuYXBwZW5kQ2hpbGQodGhpcy5fZG9jdW1lbnRhdGlvbik7XG4gICAgICAgIHRoaXMuX2lubmVyLmFwcGVuZENoaWxkKHRoaXMuX2Fycm93cyk7XG4gICAgICAgIHRoaXMuX2lubmVyLmFwcGVuZENoaWxkKHRoaXMuX2xhYmVsKTtcbiAgICAgICAgdGhpcy5faW5uZXIuYXBwZW5kQ2hpbGQob3Blbik7XG4gICAgICAgIHRoaXMuX2lubmVyLmFwcGVuZENoaWxkKHRoaXMuX3BhcmFtZXRlcnMpO1xuICAgICAgICB0aGlzLl9pbm5lci5hcHBlbmRDaGlsZChjbG9zZSk7XG4gICAgICAgIG9wZW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgb3Blbi5pbm5lclRleHQgPSBcIiBbXCI7XG4gICAgICAgIGNsb3NlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICAgIGNsb3NlLmlubmVyVGV4dCA9IFwiXVwiO1xuICAgICAgICB0aGlzLl9pbm5lci5hcHBlbmRDaGlsZChvcGVuKTtcbiAgICAgICAgdGhpcy5faW5uZXIuYXBwZW5kQ2hpbGQodGhpcy5fY291bnQpO1xuICAgICAgICB0aGlzLl9pbm5lci5hcHBlbmRDaGlsZChjbG9zZSk7XG4gICAgICAgIHRoaXMuX2lubmVyLmFwcGVuZENoaWxkKHRoaXMuX3BhcmFtZXRlckRvY3VtZW50YXRpb24pO1xuICAgIH1cbiAgICBtb3ZlSW5kZXgoZGlyZWN0aW9uKSB7XG4gICAgICAgIGlmICghdGhpcy5fbWVtYmVyKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB0aGlzLl9zZWxlY3RlZEluZGV4ICs9IGRpcmVjdGlvbjtcbiAgICAgICAgaWYgKHRoaXMuX3NlbGVjdGVkSW5kZXggPCAwKSB7XG4gICAgICAgICAgICB0aGlzLl9zZWxlY3RlZEluZGV4ID0gdGhpcy5fbWVtYmVyLlNpZ25hdHVyZXMubGVuZ3RoIC0gMTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5fc2VsZWN0ZWRJbmRleCA+IHRoaXMuX21lbWJlci5TaWduYXR1cmVzLmxlbmd0aCAtIDEpIHtcbiAgICAgICAgICAgIHRoaXMuX3NlbGVjdGVkSW5kZXggPSAwO1xuICAgICAgICB9XG4gICAgICAgIGZhc3Rkb20ubXV0YXRlKCgpID0+IHRoaXMuX2NvdW50LmlubmVyVGV4dCA9ICh0aGlzLl9zZWxlY3RlZEluZGV4ICsgMSkudG9TdHJpbmcoKSk7XG4gICAgICAgIHRoaXMudXBkYXRlTWVtYmVyKHRoaXMuX21lbWJlcik7XG4gICAgfVxuICAgIF9zZXR1cEFycm93cygpIHtcbiAgICAgICAgY29uc3QgdXAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYVwiKTtcbiAgICAgICAgdXAuY2xhc3NMaXN0LmFkZChcImljb24tYXJyb3ctdXBcIik7XG4gICAgICAgIHVwLm9uY2xpY2sgPSAoKSA9PiB0aGlzLm1vdmVJbmRleCgtMSk7XG4gICAgICAgIGNvbnN0IGRvd24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYVwiKTtcbiAgICAgICAgZG93bi5jbGFzc0xpc3QuYWRkKFwiaWNvbi1hcnJvdy1kb3duXCIpO1xuICAgICAgICBkb3duLm9uY2xpY2sgPSAoKSA9PiB0aGlzLm1vdmVJbmRleCgxKTtcbiAgICAgICAgdGhpcy5fYXJyb3dzLmFwcGVuZENoaWxkKHVwKTtcbiAgICAgICAgdGhpcy5fYXJyb3dzLmFwcGVuZENoaWxkKGRvd24pO1xuICAgIH1cbiAgICBzZXRMaW5lSGVpZ2h0KGhlaWdodCkge1xuICAgICAgICB0aGlzLl9lZGl0b3JMaW5lSGVpZ2h0ID0gaGVpZ2h0O1xuICAgICAgICBpZiAodGhpcy5fbWVtYmVyKVxuICAgICAgICAgICAgdGhpcy51cGRhdGVNZW1iZXIodGhpcy5fbWVtYmVyKTtcbiAgICB9XG4gICAgdXBkYXRlTWVtYmVyKG1lbWJlcikge1xuICAgICAgICB0aGlzLl9tZW1iZXIgPSBtZW1iZXI7XG4gICAgICAgIGlmICh0aGlzLl9zZWxlY3RlZEluZGV4ID09PSAtMSkge1xuICAgICAgICAgICAgdGhpcy5fc2VsZWN0ZWRJbmRleCA9IG1lbWJlci5BY3RpdmVTaWduYXR1cmU7XG4gICAgICAgICAgICBpZiAobWVtYmVyLkFjdGl2ZVNpZ25hdHVyZSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9zZWxlY3RlZEluZGV4ID0gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb25zdCBzaWduYXR1cmUgPSBtZW1iZXIuU2lnbmF0dXJlc1t0aGlzLl9zZWxlY3RlZEluZGV4XTtcbiAgICAgICAgaWYgKCFzaWduYXR1cmUpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGxldCBkb2NzO1xuICAgICAgICBpZiAoc2lnbmF0dXJlLkRvY3VtZW50YXRpb24pXG4gICAgICAgICAgICBkb2NzID0gcGFyc2VTdHJpbmcoc2lnbmF0dXJlLkRvY3VtZW50YXRpb24pO1xuICAgICAgICBpZiAodGhpcy5fbGFzdEluZGV4ICE9PSB0aGlzLl9zZWxlY3RlZEluZGV4KSB7XG4gICAgICAgICAgICB0aGlzLl9sYXN0SW5kZXggPSB0aGlzLl9zZWxlY3RlZEluZGV4O1xuICAgICAgICAgICAgZmFzdGRvbS5tdXRhdGUoKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuX2NvdW50LmlubmVyVGV4dCA9ICh0aGlzLl9zZWxlY3RlZEluZGV4ICsgMSkudG9TdHJpbmcoKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9sYWJlbC5pbm5lclRleHQgPSBzaWduYXR1cmUuTmFtZTtcbiAgICAgICAgICAgICAgICB0aGlzLl9kb2N1bWVudGF0aW9uLmlubmVyVGV4dCA9IHNpZ25hdHVyZS5Eb2N1bWVudGF0aW9uO1xuICAgICAgICAgICAgICAgIGlmIChkb2NzICYmIHNpZ25hdHVyZS5Eb2N1bWVudGF0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHMgPSBkb2NzLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwic3VtbWFyeVwiKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBzdW1tYXJ5ID0gXy50cmltKChzWzBdKS5pbm5lckhUTUwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fZG9jdW1lbnRhdGlvbi5pbm5lclRleHQgPSBzdW1tYXJ5O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fZG9jdW1lbnRhdGlvbi5pbm5lclRleHQgPSBcIlwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fZG9jdW1lbnRhdGlvbi5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZG9jdW1lbnRhdGlvbi5zdHlsZS5kaXNwbGF5ID0gXCJcIjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2RvY3VtZW50YXRpb24uaW5uZXJUZXh0ID0gXCJcIjtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZG9jdW1lbnRhdGlvbi5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChtZW1iZXIuU2lnbmF0dXJlcy5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2Fycm93cy5zdHlsZS5kaXNwbGF5ID0gXCJcIjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2Fycm93cy5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aGlzLl9wYXJhbWV0ZXJzTGlzdCA9IFtdO1xuICAgICAgICAgICAgZmFzdGRvbS5tdXRhdGUoKCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHBhcmFtZXRlcnMgPSBzaWduYXR1cmUuUGFyYW1ldGVycztcbiAgICAgICAgICAgICAgICBjb25zdCBwYXJhbWV0ZXJzRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICAgICAgICAgIF8uZWFjaChwYXJhbWV0ZXJzLCAocGFyYW1ldGVyLCBpKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHZpZXcgPSBuZXcgZXhwb3J0cy5TaWduYXR1cmVQYXJhbWV0ZXJWaWV3KCk7XG4gICAgICAgICAgICAgICAgICAgIHZpZXcuc2V0TWVtYmVyKHBhcmFtZXRlcik7XG4gICAgICAgICAgICAgICAgICAgIHZpZXcuc2V0Q3VycmVudChpID09PSBtZW1iZXIuQWN0aXZlUGFyYW1ldGVyKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGkgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjb21tYSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29tbWEuaW5uZXJUZXh0ID0gXCIsIFwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgcGFyYW1ldGVyc0VsZW1lbnQuYXBwZW5kQ2hpbGQoY29tbWEpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHBhcmFtZXRlcnNFbGVtZW50LmFwcGVuZENoaWxkKHZpZXcpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9wYXJhbWV0ZXJzTGlzdC5wdXNoKHZpZXcpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRFbGVtZW50ID0gdGhpcy5fcGFyYW1ldGVycztcbiAgICAgICAgICAgICAgICB0aGlzLl9pbm5lci5pbnNlcnRCZWZvcmUocGFyYW1ldGVyc0VsZW1lbnQsIGN1cnJlbnRFbGVtZW50KTtcbiAgICAgICAgICAgICAgICB0aGlzLl9pbm5lci5yZW1vdmVDaGlsZChjdXJyZW50RWxlbWVudCk7XG4gICAgICAgICAgICAgICAgdGhpcy5fcGFyYW1ldGVycyA9IHBhcmFtZXRlcnNFbGVtZW50O1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBmYXN0ZG9tLm11dGF0ZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgXy5lYWNoKHNpZ25hdHVyZS5QYXJhbWV0ZXJzLCAocGFyYW0sIGkpID0+IHRoaXMuX3BhcmFtZXRlcnNMaXN0W2ldICYmIHRoaXMuX3BhcmFtZXRlcnNMaXN0W2ldLnNldEN1cnJlbnQoaSA9PT0gbWVtYmVyLkFjdGl2ZVBhcmFtZXRlcikpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgY3VycmVudFBhcmFtZXRlciA9IHNpZ25hdHVyZS5QYXJhbWV0ZXJzW21lbWJlci5BY3RpdmVQYXJhbWV0ZXJdO1xuICAgICAgICBmYXN0ZG9tLm1lYXN1cmUoKCkgPT4ge1xuICAgICAgICAgICAgaWYgKCFjdXJyZW50UGFyYW1ldGVyKVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIGxldCBzdW1tYXJ5O1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRQYXJhbWV0ZXIuRG9jdW1lbnRhdGlvbikge1xuICAgICAgICAgICAgICAgIGNvbnN0IHBhcmFtRG9jcyA9IHBhcnNlU3RyaW5nKGN1cnJlbnRQYXJhbWV0ZXIuRG9jdW1lbnRhdGlvbik7XG4gICAgICAgICAgICAgICAgaWYgKHBhcmFtRG9jcykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzID0gcGFyYW1Eb2NzLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwic3VtbWFyeVwiKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBzdW1tYXJ5RWxlbWVudCA9IHNbMF07XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3VtbWFyeUVsZW1lbnQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VtbWFyeSA9IF8udHJpbShzdW1tYXJ5RWxlbWVudC5pbm5lckhUTUwpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGRvY3MgJiYgIXN1bW1hcnkpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBzID0gZG9jcy5nZXRFbGVtZW50c0J5VGFnTmFtZShcInBhcmFtXCIpO1xuICAgICAgICAgICAgICAgIGlmIChzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBwYXJhbSA9IF8uZmluZChzLCB4ID0+IHguYXR0cmlidXRlc1tcIm5hbWVcIl0gJiYgeC5hdHRyaWJ1dGVzW1wibmFtZVwiXS52YWx1ZSA9PT0gY3VycmVudFBhcmFtZXRlci5OYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHBhcmFtKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdW1tYXJ5ID0gXy50cmltKHBhcmFtLmlubmVySFRNTCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5fcGFyYW1ldGVyRG9jdW1lbnRhdGlvbi5pbm5lclRleHQgIT09IHN1bW1hcnkpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3VtbWFyeSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9wYXJhbWV0ZXJEb2N1bWVudGF0aW9uLmlubmVyVGV4dCA9IHN1bW1hcnk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9wYXJhbWV0ZXJEb2N1bWVudGF0aW9uLmlubmVyVGV4dCA9IFwiXCI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgZmFzdGRvbS5tdXRhdGUoKCkgPT4gdGhpcy5zdHlsZS5ib3R0b20gPSBgJHt0aGlzLmNsaWVudEhlaWdodCArIHRoaXMuX2VkaXRvckxpbmVIZWlnaHR9cHhgKTtcbiAgICB9XG4gICAgZGV0YWNoZWRDYWxsYmFjaygpIHtcbiAgICAgICAgXy5lYWNoKHRoaXMuX3BhcmFtZXRlcnNMaXN0LCBwYXJhbWV0ZXIgPT4gcGFyYW1ldGVyLnJlbW92ZSgpKTtcbiAgICAgICAgdGhpcy5fcGFyYW1ldGVyc0xpc3QgPSBbXTtcbiAgICB9XG59XG5leHBvcnRzLlNpZ25hdHVyZVZpZXcgPSBkb2N1bWVudC5yZWdpc3RlckVsZW1lbnQoXCJvbW5pc2hhcnAtc2lnbmF0dXJlLWhlbHBcIiwgeyBwcm90b3R5cGU6IFNpZ25hdHVyZVZpZXcucHJvdG90eXBlIH0pO1xuZXhwb3J0IGNsYXNzIFNpZ25hdHVyZVBhcmFtZXRlclZpZXcgZXh0ZW5kcyBIVE1MU3BhbkVsZW1lbnQge1xuICAgIGNyZWF0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdGhpcy5fbGFiZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgdGhpcy5hcHBlbmRDaGlsZCh0aGlzLl9sYWJlbCk7XG4gICAgfVxuICAgIHNldE1lbWJlcihtZW1iZXIpIHtcbiAgICAgICAgdGhpcy5fbWVtYmVyID0gbWVtYmVyO1xuICAgICAgICB0aGlzLl9sYWJlbC5pbm5lclRleHQgPSBtZW1iZXIuTGFiZWw7XG4gICAgfVxuICAgIHNldEN1cnJlbnQoY3VycmVudCkge1xuICAgICAgICBmYXN0ZG9tLm1lYXN1cmUoKCkgPT4ge1xuICAgICAgICAgICAgaWYgKCFjdXJyZW50ICYmIHRoaXMuc3R5bGUuZm9udFdlaWdodCA9PT0gXCJib2xkXCIpIHtcbiAgICAgICAgICAgICAgICBmYXN0ZG9tLm11dGF0ZSgoKSA9PiB0aGlzLnN0eWxlLmZvbnRXZWlnaHQgPSBcIlwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGN1cnJlbnQgJiYgdGhpcy5zdHlsZS5mb250V2VpZ2h0ICE9PSBcImJvbGRcIikge1xuICAgICAgICAgICAgICAgIGZhc3Rkb20ubXV0YXRlKCgpID0+IHRoaXMuc3R5bGUuZm9udFdlaWdodCA9IFwiYm9sZFwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxufVxuZXhwb3J0cy5TaWduYXR1cmVQYXJhbWV0ZXJWaWV3ID0gZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50KFwib21uaXNoYXJwLXNpZ25hdHVyZS1wYXJhbWV0ZXJcIiwgeyBwcm90b3R5cGU6IFNpZ25hdHVyZVBhcmFtZXRlclZpZXcucHJvdG90eXBlIH0pO1xuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL3R5cGluZ3MuZC50c1wiIC8+XHJcbi8qIHRzbGludDpkaXNhYmxlOm5vLXN0cmluZy1saXRlcmFsICovXHJcbmltcG9ydCB7TW9kZWxzfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xyXG5sZXQgZmFzdGRvbTogdHlwZW9mIEZhc3Rkb20gPSByZXF1aXJlKFwiZmFzdGRvbVwiKTtcclxuaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xyXG5cclxuY29uc3QgcGFyc2VTdHJpbmcgPSAoZnVuY3Rpb24oKSB7XHJcbiAgICBjb25zdCBwYXJzZXIgPSBuZXcgRE9NUGFyc2VyKCk7XHJcblxyXG4gICAgcmV0dXJuIGZ1bmN0aW9uKHhtbDogc3RyaW5nKSB7XHJcbiAgICAgICAgcmV0dXJuIHBhcnNlci5wYXJzZUZyb21TdHJpbmcoeG1sLCBcInRleHQveG1sXCIpO1xyXG4gICAgfTtcclxufSkoKTtcclxuXHJcbmV4cG9ydCBjbGFzcyBTaWduYXR1cmVWaWV3IGV4dGVuZHMgSFRNTERpdkVsZW1lbnQgeyAvKiBpbXBsZW1lbnRzIFdlYkNvbXBvbmVudCAqL1xyXG4gICAgcHJpdmF0ZSBfbWVtYmVyOiBNb2RlbHMuU2lnbmF0dXJlSGVscDtcclxuICAgIHByaXZhdGUgX2lubmVyOiBIVE1MRGl2RWxlbWVudDtcclxuICAgIHByaXZhdGUgX2xhYmVsOiBIVE1MU3BhbkVsZW1lbnQ7XHJcbiAgICBwcml2YXRlIF9kb2N1bWVudGF0aW9uOiBIVE1MRGl2RWxlbWVudDtcclxuICAgIHByaXZhdGUgX3BhcmFtZXRlckRvY3VtZW50YXRpb246IEhUTUxEaXZFbGVtZW50O1xyXG4gICAgcHJpdmF0ZSBfYXJyb3dzOiBIVE1MU3BhbkVsZW1lbnQ7XHJcbiAgICBwcml2YXRlIF9wYXJhbWV0ZXJzTGlzdDogU2lnbmF0dXJlUGFyYW1ldGVyVmlld1tdID0gW107XHJcbiAgICBwcml2YXRlIF9wYXJhbWV0ZXJzOiBIVE1MU3BhbkVsZW1lbnQ7XHJcbiAgICBwcml2YXRlIF9jb3VudDogSFRNTFNwYW5FbGVtZW50O1xyXG4gICAgcHJpdmF0ZSBfc2VsZWN0ZWRJbmRleDogbnVtYmVyO1xyXG4gICAgcHJpdmF0ZSBfbGFzdEluZGV4OiBudW1iZXI7XHJcbiAgICBwcml2YXRlIF9lZGl0b3JMaW5lSGVpZ2h0OiBudW1iZXI7XHJcblxyXG4gICAgcHVibGljIGNyZWF0ZWRDYWxsYmFjaygpIHtcclxuICAgICAgICB0aGlzLl9zZWxlY3RlZEluZGV4ID0gLTE7XHJcbiAgICAgICAgdGhpcy5fbGFzdEluZGV4ID0gLTE7XHJcbiAgICAgICAgdGhpcy5fZWRpdG9yTGluZUhlaWdodCA9IDA7XHJcblxyXG4gICAgICAgIHRoaXMuX2lubmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuICAgICAgICB0aGlzLl9sYWJlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xyXG4gICAgICAgIHRoaXMuX2RvY3VtZW50YXRpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gICAgICAgIHRoaXMuX3BhcmFtZXRlckRvY3VtZW50YXRpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gICAgICAgIHRoaXMuX3BhcmFtZXRlckRvY3VtZW50YXRpb24uc3R5bGUubWFyZ2luTGVmdCA9IFwiMi40ZW1cIjtcclxuICAgICAgICB0aGlzLl9hcnJvd3MgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcclxuICAgICAgICB0aGlzLl9wYXJhbWV0ZXJzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XHJcbiAgICAgICAgdGhpcy5fY291bnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcclxuICAgICAgICB0aGlzLl9wYXJhbWV0ZXJzTGlzdCA9IFtdO1xyXG5cclxuICAgICAgICB0aGlzLmNsYXNzTGlzdC5hZGQoXCJ0b29sdGlwXCIpO1xyXG4gICAgICAgIHRoaXMuX2lubmVyLmNsYXNzTGlzdC5hZGQoXCJ0b29sdGlwLWlubmVyXCIpO1xyXG5cclxuICAgICAgICB0aGlzLl9zZXR1cEFycm93cygpO1xyXG5cclxuICAgICAgICBsZXQgb3BlbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xyXG4gICAgICAgIG9wZW4uaW5uZXJUZXh0ID0gXCIoXCI7XHJcblxyXG4gICAgICAgIGxldCBjbG9zZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xyXG4gICAgICAgIGNsb3NlLmlubmVyVGV4dCA9IFwiKVwiO1xyXG5cclxuICAgICAgICB0aGlzLmFwcGVuZENoaWxkKHRoaXMuX2lubmVyKTtcclxuICAgICAgICB0aGlzLl9pbm5lci5hcHBlbmRDaGlsZCh0aGlzLl9kb2N1bWVudGF0aW9uKTtcclxuXHJcbiAgICAgICAgdGhpcy5faW5uZXIuYXBwZW5kQ2hpbGQodGhpcy5fYXJyb3dzKTtcclxuXHJcbiAgICAgICAgdGhpcy5faW5uZXIuYXBwZW5kQ2hpbGQodGhpcy5fbGFiZWwpO1xyXG4gICAgICAgIHRoaXMuX2lubmVyLmFwcGVuZENoaWxkKG9wZW4pO1xyXG4gICAgICAgIHRoaXMuX2lubmVyLmFwcGVuZENoaWxkKHRoaXMuX3BhcmFtZXRlcnMpO1xyXG4gICAgICAgIHRoaXMuX2lubmVyLmFwcGVuZENoaWxkKGNsb3NlKTtcclxuXHJcbiAgICAgICAgb3BlbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xyXG4gICAgICAgIG9wZW4uaW5uZXJUZXh0ID0gXCIgW1wiO1xyXG5cclxuICAgICAgICBjbG9zZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xyXG4gICAgICAgIGNsb3NlLmlubmVyVGV4dCA9IFwiXVwiO1xyXG5cclxuICAgICAgICB0aGlzLl9pbm5lci5hcHBlbmRDaGlsZChvcGVuKTtcclxuICAgICAgICB0aGlzLl9pbm5lci5hcHBlbmRDaGlsZCh0aGlzLl9jb3VudCk7XHJcbiAgICAgICAgdGhpcy5faW5uZXIuYXBwZW5kQ2hpbGQoY2xvc2UpO1xyXG5cclxuICAgICAgICB0aGlzLl9pbm5lci5hcHBlbmRDaGlsZCh0aGlzLl9wYXJhbWV0ZXJEb2N1bWVudGF0aW9uKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgbW92ZUluZGV4KGRpcmVjdGlvbjogbnVtYmVyKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLl9tZW1iZXIpIHJldHVybjtcclxuICAgICAgICB0aGlzLl9zZWxlY3RlZEluZGV4ICs9IGRpcmVjdGlvbjtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX3NlbGVjdGVkSW5kZXggPCAwKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3NlbGVjdGVkSW5kZXggPSB0aGlzLl9tZW1iZXIuU2lnbmF0dXJlcy5sZW5ndGggLSAxO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX3NlbGVjdGVkSW5kZXggPiB0aGlzLl9tZW1iZXIuU2lnbmF0dXJlcy5sZW5ndGggLSAxKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3NlbGVjdGVkSW5kZXggPSAwO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZmFzdGRvbS5tdXRhdGUoKCkgPT4gdGhpcy5fY291bnQuaW5uZXJUZXh0ID0gKHRoaXMuX3NlbGVjdGVkSW5kZXggKyAxKS50b1N0cmluZygpKTtcclxuICAgICAgICB0aGlzLnVwZGF0ZU1lbWJlcih0aGlzLl9tZW1iZXIpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX3NldHVwQXJyb3dzKCkge1xyXG4gICAgICAgIGNvbnN0IHVwID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImFcIik7XHJcbiAgICAgICAgdXAuY2xhc3NMaXN0LmFkZChcImljb24tYXJyb3ctdXBcIik7XHJcbiAgICAgICAgdXAub25jbGljayA9ICgpID0+IHRoaXMubW92ZUluZGV4KC0xKTtcclxuXHJcbiAgICAgICAgY29uc3QgZG93biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJhXCIpO1xyXG4gICAgICAgIGRvd24uY2xhc3NMaXN0LmFkZChcImljb24tYXJyb3ctZG93blwiKTtcclxuICAgICAgICBkb3duLm9uY2xpY2sgPSAoKSA9PiB0aGlzLm1vdmVJbmRleCgxKTtcclxuXHJcbiAgICAgICAgdGhpcy5fYXJyb3dzLmFwcGVuZENoaWxkKHVwKTtcclxuICAgICAgICB0aGlzLl9hcnJvd3MuYXBwZW5kQ2hpbGQoZG93bik7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHNldExpbmVIZWlnaHQoaGVpZ2h0OiBudW1iZXIpIHtcclxuICAgICAgICB0aGlzLl9lZGl0b3JMaW5lSGVpZ2h0ID0gaGVpZ2h0O1xyXG5cclxuICAgICAgICBpZiAodGhpcy5fbWVtYmVyKVxyXG4gICAgICAgICAgICB0aGlzLnVwZGF0ZU1lbWJlcih0aGlzLl9tZW1iZXIpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vQF9kKG0gPT4gXy5kZWJvdW5jZShtLCAyMDAsIHsgbGVhZGluZzogdHJ1ZSwgdHJhaWxpbmc6IHRydWUgfSkpXHJcbiAgICBwdWJsaWMgdXBkYXRlTWVtYmVyKG1lbWJlcjogTW9kZWxzLlNpZ25hdHVyZUhlbHApIHtcclxuICAgICAgICB0aGlzLl9tZW1iZXIgPSBtZW1iZXI7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9zZWxlY3RlZEluZGV4ID09PSAtMSkge1xyXG4gICAgICAgICAgICB0aGlzLl9zZWxlY3RlZEluZGV4ID0gbWVtYmVyLkFjdGl2ZVNpZ25hdHVyZTtcclxuICAgICAgICAgICAgaWYgKG1lbWJlci5BY3RpdmVTaWduYXR1cmUgPT09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBUaGUgc2VydmVyIGJhc2ljYWxseSB0aHJldyB1cCBpdHMgYXJtcyBhbmQgc2FpZCBmdWNrIGl0Li4uXHJcbiAgICAgICAgICAgICAgICB0aGlzLl9zZWxlY3RlZEluZGV4ID0gMDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3Qgc2lnbmF0dXJlID0gbWVtYmVyLlNpZ25hdHVyZXNbdGhpcy5fc2VsZWN0ZWRJbmRleF07XHJcbiAgICAgICAgaWYgKCFzaWduYXR1cmUpIHJldHVybjtcclxuXHJcbiAgICAgICAgbGV0IGRvY3M6IERvY3VtZW50O1xyXG4gICAgICAgIGlmIChzaWduYXR1cmUuRG9jdW1lbnRhdGlvbilcclxuICAgICAgICAgICAgZG9jcyA9IHBhcnNlU3RyaW5nKHNpZ25hdHVyZS5Eb2N1bWVudGF0aW9uKTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX2xhc3RJbmRleCAhPT0gdGhpcy5fc2VsZWN0ZWRJbmRleCkge1xyXG4gICAgICAgICAgICB0aGlzLl9sYXN0SW5kZXggPSB0aGlzLl9zZWxlY3RlZEluZGV4O1xyXG4gICAgICAgICAgICBmYXN0ZG9tLm11dGF0ZSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9jb3VudC5pbm5lclRleHQgPSAodGhpcy5fc2VsZWN0ZWRJbmRleCArIDEpLnRvU3RyaW5nKCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9sYWJlbC5pbm5lclRleHQgPSBzaWduYXR1cmUuTmFtZTtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2RvY3VtZW50YXRpb24uaW5uZXJUZXh0ID0gc2lnbmF0dXJlLkRvY3VtZW50YXRpb247XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGRvY3MgJiYgc2lnbmF0dXJlLkRvY3VtZW50YXRpb24pIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBzOiBOb2RlTGlzdE9mPEhUTUxFbGVtZW50PiA9IDxhbnk+ZG9jcy5nZXRFbGVtZW50c0J5VGFnTmFtZShcInN1bW1hcnlcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHN1bW1hcnkgPSBfLnRyaW0oKHNbMF0pLmlubmVySFRNTCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2RvY3VtZW50YXRpb24uaW5uZXJUZXh0ID0gc3VtbWFyeTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9kb2N1bWVudGF0aW9uLmlubmVyVGV4dCA9IFwiXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2RvY3VtZW50YXRpb24uc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZG9jdW1lbnRhdGlvbi5zdHlsZS5kaXNwbGF5ID0gXCJcIjtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZG9jdW1lbnRhdGlvbi5pbm5lclRleHQgPSBcIlwiO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2RvY3VtZW50YXRpb24uc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChtZW1iZXIuU2lnbmF0dXJlcy5sZW5ndGggPiAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fYXJyb3dzLnN0eWxlLmRpc3BsYXkgPSBcIlwiO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9hcnJvd3Muc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuX3BhcmFtZXRlcnNMaXN0ID0gW107XHJcblxyXG4gICAgICAgICAgICBmYXN0ZG9tLm11dGF0ZSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBwYXJhbWV0ZXJzID0gc2lnbmF0dXJlLlBhcmFtZXRlcnM7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBwYXJhbWV0ZXJzRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xyXG4gICAgICAgICAgICAgICAgXy5lYWNoKHBhcmFtZXRlcnMsIChwYXJhbWV0ZXIsIGkpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCB2aWV3OiBTaWduYXR1cmVQYXJhbWV0ZXJWaWV3ID0gPGFueT5uZXcgZXhwb3J0cy5TaWduYXR1cmVQYXJhbWV0ZXJWaWV3KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmlldy5zZXRNZW1iZXIocGFyYW1ldGVyKTtcclxuICAgICAgICAgICAgICAgICAgICB2aWV3LnNldEN1cnJlbnQoaSA9PT0gbWVtYmVyLkFjdGl2ZVBhcmFtZXRlcik7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChpID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjb21tYSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb21tYS5pbm5lclRleHQgPSBcIiwgXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcmFtZXRlcnNFbGVtZW50LmFwcGVuZENoaWxkKGNvbW1hKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHBhcmFtZXRlcnNFbGVtZW50LmFwcGVuZENoaWxkKHZpZXcpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3BhcmFtZXRlcnNMaXN0LnB1c2godmlldyk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBjb25zdCBjdXJyZW50RWxlbWVudCA9IHRoaXMuX3BhcmFtZXRlcnM7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9pbm5lci5pbnNlcnRCZWZvcmUocGFyYW1ldGVyc0VsZW1lbnQsIGN1cnJlbnRFbGVtZW50KTtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2lubmVyLnJlbW92ZUNoaWxkKGN1cnJlbnRFbGVtZW50KTtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLl9wYXJhbWV0ZXJzID0gcGFyYW1ldGVyc0VsZW1lbnQ7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGZhc3Rkb20ubXV0YXRlKCgpID0+IHtcclxuICAgICAgICAgICAgICAgIF8uZWFjaChzaWduYXR1cmUuUGFyYW1ldGVycywgKHBhcmFtLCBpKSA9PlxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3BhcmFtZXRlcnNMaXN0W2ldICYmIHRoaXMuX3BhcmFtZXRlcnNMaXN0W2ldLnNldEN1cnJlbnQoaSA9PT0gbWVtYmVyLkFjdGl2ZVBhcmFtZXRlcikpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IGN1cnJlbnRQYXJhbWV0ZXIgPSBzaWduYXR1cmUuUGFyYW1ldGVyc1ttZW1iZXIuQWN0aXZlUGFyYW1ldGVyXTtcclxuICAgICAgICBmYXN0ZG9tLm1lYXN1cmUoKCkgPT4ge1xyXG4gICAgICAgICAgICBpZiAoIWN1cnJlbnRQYXJhbWV0ZXIpIHJldHVybjtcclxuICAgICAgICAgICAgbGV0IHN1bW1hcnk6IHN0cmluZztcclxuICAgICAgICAgICAgaWYgKGN1cnJlbnRQYXJhbWV0ZXIuRG9jdW1lbnRhdGlvbikge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcGFyYW1Eb2NzID0gcGFyc2VTdHJpbmcoY3VycmVudFBhcmFtZXRlci5Eb2N1bWVudGF0aW9uKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAocGFyYW1Eb2NzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgczogTm9kZUxpc3RPZjxIVE1MRWxlbWVudD4gPSA8YW55PnBhcmFtRG9jcy5nZXRFbGVtZW50c0J5VGFnTmFtZShcInN1bW1hcnlcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHN1bW1hcnlFbGVtZW50ID0gc1swXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN1bW1hcnlFbGVtZW50KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VtbWFyeSA9IF8udHJpbShzdW1tYXJ5RWxlbWVudC5pbm5lckhUTUwpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGRvY3MgJiYgIXN1bW1hcnkpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHM6IE5vZGVMaXN0T2Y8SFRNTEVsZW1lbnQ+ID0gPGFueT5kb2NzLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwicGFyYW1cIik7XHJcbiAgICAgICAgICAgICAgICBpZiAocy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBwYXJhbSA9IDxIVE1MRWxlbWVudD5fLmZpbmQocywgeCA9PiB4LmF0dHJpYnV0ZXNbXCJuYW1lXCJdICYmIHguYXR0cmlidXRlc1tcIm5hbWVcIl0udmFsdWUgPT09IGN1cnJlbnRQYXJhbWV0ZXIuTmFtZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHBhcmFtKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1bW1hcnkgPSBfLnRyaW0ocGFyYW0uaW5uZXJIVE1MKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLl9wYXJhbWV0ZXJEb2N1bWVudGF0aW9uLmlubmVyVGV4dCAhPT0gc3VtbWFyeSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHN1bW1hcnkpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9wYXJhbWV0ZXJEb2N1bWVudGF0aW9uLmlubmVyVGV4dCA9IHN1bW1hcnk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3BhcmFtZXRlckRvY3VtZW50YXRpb24uaW5uZXJUZXh0ID0gXCJcIjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBmYXN0ZG9tLm11dGF0ZSgoKSA9PiB0aGlzLnN0eWxlLmJvdHRvbSA9IGAke3RoaXMuY2xpZW50SGVpZ2h0ICsgdGhpcy5fZWRpdG9yTGluZUhlaWdodH1weGApO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkZXRhY2hlZENhbGxiYWNrKCkge1xyXG4gICAgICAgIF8uZWFjaCh0aGlzLl9wYXJhbWV0ZXJzTGlzdCwgcGFyYW1ldGVyID0+IHBhcmFtZXRlci5yZW1vdmUoKSk7XHJcbiAgICAgICAgdGhpcy5fcGFyYW1ldGVyc0xpc3QgPSBbXTtcclxuICAgIH1cclxufVxyXG5cclxuKDxhbnk+ZXhwb3J0cykuU2lnbmF0dXJlVmlldyA9ICg8YW55PmRvY3VtZW50KS5yZWdpc3RlckVsZW1lbnQoXCJvbW5pc2hhcnAtc2lnbmF0dXJlLWhlbHBcIiwgeyBwcm90b3R5cGU6IFNpZ25hdHVyZVZpZXcucHJvdG90eXBlIH0pO1xyXG5cclxuZXhwb3J0IGNsYXNzIFNpZ25hdHVyZVBhcmFtZXRlclZpZXcgZXh0ZW5kcyBIVE1MU3BhbkVsZW1lbnQgeyAvKiBpbXBsZW1lbnRzIFdlYkNvbXBvbmVudCAqL1xyXG4gICAgcHJpdmF0ZSBfbWVtYmVyOiBNb2RlbHMuU2lnbmF0dXJlSGVscFBhcmFtZXRlcjtcclxuICAgIHByaXZhdGUgX2xhYmVsOiBIVE1MU3BhbkVsZW1lbnQ7XHJcblxyXG4gICAgcHVibGljIGNyZWF0ZWRDYWxsYmFjaygpIHtcclxuICAgICAgICB0aGlzLl9sYWJlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xyXG4gICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQodGhpcy5fbGFiZWwpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzZXRNZW1iZXIobWVtYmVyOiBNb2RlbHMuU2lnbmF0dXJlSGVscFBhcmFtZXRlcikge1xyXG4gICAgICAgIHRoaXMuX21lbWJlciA9IG1lbWJlcjtcclxuICAgICAgICB0aGlzLl9sYWJlbC5pbm5lclRleHQgPSBtZW1iZXIuTGFiZWw7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHNldEN1cnJlbnQoY3VycmVudDogYm9vbGVhbikge1xyXG4gICAgICAgIGZhc3Rkb20ubWVhc3VyZSgoKSA9PiB7XHJcbiAgICAgICAgICAgIGlmICghY3VycmVudCAmJiB0aGlzLnN0eWxlLmZvbnRXZWlnaHQgPT09IFwiYm9sZFwiKSB7XHJcbiAgICAgICAgICAgICAgICBmYXN0ZG9tLm11dGF0ZSgoKSA9PiB0aGlzLnN0eWxlLmZvbnRXZWlnaHQgPSBcIlwiKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChjdXJyZW50ICYmIHRoaXMuc3R5bGUuZm9udFdlaWdodCAhPT0gXCJib2xkXCIpIHtcclxuICAgICAgICAgICAgICAgIGZhc3Rkb20ubXV0YXRlKCgpID0+IHRoaXMuc3R5bGUuZm9udFdlaWdodCA9IFwiYm9sZFwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59XHJcblxyXG4oPGFueT5leHBvcnRzKS5TaWduYXR1cmVQYXJhbWV0ZXJWaWV3ID0gKDxhbnk+ZG9jdW1lbnQpLnJlZ2lzdGVyRWxlbWVudChcIm9tbmlzaGFycC1zaWduYXR1cmUtcGFyYW1ldGVyXCIsIHsgcHJvdG90eXBlOiBTaWduYXR1cmVQYXJhbWV0ZXJWaWV3LnByb3RvdHlwZSB9KTtcclxuIl19
