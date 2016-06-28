"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.typeLookup = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _rxjs = require("rxjs");

var _omnisharpClient = require("omnisharp-client");

var _omni = require("../server/omni");

var _tooltipView = require("../views/tooltip-view");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var $ = require("jquery");
var escape = require("escape-html");

var TypeLookup = function () {
    function TypeLookup() {
        _classCallCheck(this, TypeLookup);

        this.required = false;
        this.title = "Tooltip Lookup";
        this.description = "Adds hover tooltips to the editor, also has a keybind";
    }

    _createClass(TypeLookup, [{
        key: "activate",
        value: function activate() {
            var tooltip = void 0;
            this.disposable = new _omnisharpClient.CompositeDisposable();
            this.disposable.add(_omni.Omni.switchActiveEditor(function (editor, cd) {
                var editorView = $(atom.views.getView(editor));
                tooltip = new Tooltip(editorView, editor);
                cd.add(tooltip);
            }));
            this.disposable.add(_omni.Omni.addTextEditorCommand("omnisharp-atom:type-lookup", function () {
                _omni.Omni.activeEditor.first().subscribe(function (editor) {
                    tooltip.showExpressionTypeOnCommand();
                });
            }));
        }
    }, {
        key: "dispose",
        value: function dispose() {
            this.disposable.dispose();
        }
    }]);

    return TypeLookup;
}();

var Tooltip = function () {
    function Tooltip(editorView, editor) {
        var _this = this;

        _classCallCheck(this, Tooltip);

        this.editorView = editorView;
        this.editor = editor;
        this.exprTypeTooltip = null;
        this.rawView = editorView[0];
        var cd = this.disposable = new _omnisharpClient.CompositeDisposable();
        var scroll = this.getFromShadowDom(editorView, ".scroll-view");
        if (!scroll[0]) return;
        var lastExprTypeBufferPt = void 0;
        var mousemove = _rxjs.Observable.fromEvent(scroll[0], "mousemove");
        var mouseout = _rxjs.Observable.fromEvent(scroll[0], "mouseout");
        this.keydown = _rxjs.Observable.fromEvent(scroll[0], "keydown");
        cd.add(mousemove.auditTime(200).map(function (event) {
            var pixelPt = _this.pixelPositionFromMouseEvent(editorView, event);
            if (!pixelPt) return;
            var screenPt = editor.screenPositionForPixelPosition(pixelPt);
            var bufferPt = editor.bufferPositionForScreenPosition(screenPt);
            if (lastExprTypeBufferPt && lastExprTypeBufferPt.isEqual(bufferPt) && _this.exprTypeTooltip) return;
            lastExprTypeBufferPt = bufferPt;
            return { bufferPt: bufferPt, event: event };
        }).filter(function (z) {
            return !!z;
        }).do(function () {
            return _this.hideExpressionType();
        }).filter(function (x) {
            return _this.checkPosition(x.bufferPt);
        }).do(function () {
            return _this.subcribeKeyDown();
        }).subscribe(function (_ref) {
            var bufferPt = _ref.bufferPt;
            var event = _ref.event;

            _this.showExpressionTypeOnMouseOver(event, bufferPt);
        }));
        cd.add(mouseout.subscribe(function (e) {
            return _this.hideExpressionType();
        }));
        cd.add(_omni.Omni.switchActiveEditor(function (edit, innerCd) {
            innerCd.add(_omnisharpClient.Disposable.create(function () {
                return _this.hideExpressionType();
            }));
        }));
        cd.add(_omnisharpClient.Disposable.create(function () {
            _this.hideExpressionType();
        }));
    }

    _createClass(Tooltip, [{
        key: "subcribeKeyDown",
        value: function subcribeKeyDown() {
            var _this2 = this;

            this.keydownSubscription = this.keydown.subscribe(function (e) {
                return _this2.hideExpressionType();
            });
            this.disposable.add(this.keydownSubscription);
        }
    }, {
        key: "showExpressionTypeOnCommand",
        value: function showExpressionTypeOnCommand() {
            if (this.editor.cursors.length < 1) return;
            var bufferPt = this.editor.getCursorBufferPosition();
            if (!this.checkPosition(bufferPt)) return;
            var offset = this.rawView.component.getFontSize() * bufferPt.column * 0.7;
            var shadow = this.getFromShadowDom(this.editorView, ".cursor-line")[0];
            if (!shadow) return;
            var rect = shadow.getBoundingClientRect();
            var tooltipRect = {
                left: rect.left - offset,
                right: rect.left + offset,
                top: rect.bottom,
                bottom: rect.bottom
            };
            this.hideExpressionType();
            this.subcribeKeyDown();
            this.showToolTip(bufferPt, tooltipRect);
        }
    }, {
        key: "showExpressionTypeOnMouseOver",
        value: function showExpressionTypeOnMouseOver(e, bufferPt) {
            if (!_omni.Omni.isOn) {
                return;
            }
            if (this.exprTypeTooltip) return;
            var offset = this.editor.getLineHeightInPixels() * 0.7;
            var tooltipRect = {
                left: e.clientX,
                right: e.clientX,
                top: e.clientY - offset,
                bottom: e.clientY + offset
            };
            this.showToolTip(bufferPt, tooltipRect);
        }
    }, {
        key: "checkPosition",
        value: function checkPosition(bufferPt) {
            var curCharPixelPt = this.rawView.pixelPositionForBufferPosition([bufferPt.row, bufferPt.column]);
            var nextCharPixelPt = this.rawView.pixelPositionForBufferPosition([bufferPt.row, bufferPt.column + 1]);
            if (curCharPixelPt.left >= nextCharPixelPt.left) {
                return false;
            } else {
                return true;
            }
        }
    }, {
        key: "showToolTip",
        value: function showToolTip(bufferPt, tooltipRect) {
            var _this3 = this;

            this.exprTypeTooltip = new _tooltipView.TooltipView(tooltipRect);
            _omni.Omni.request(function (solution) {
                return solution.typelookup({
                    IncludeDocumentation: true,
                    Line: bufferPt.row,
                    Column: bufferPt.column
                });
            }).subscribe(function (response) {
                if (response.Type === null) {
                    return;
                }
                var message = "<b>" + escape(response.Type) + "</b>";
                if (response.Documentation) {
                    message = message + ("<br/><i>" + escape(response.Documentation) + "</i>");
                }
                if (_this3.exprTypeTooltip) {
                    _this3.exprTypeTooltip.updateText(message);
                }
            });
        }
    }, {
        key: "dispose",
        value: function dispose() {
            this.disposable.dispose();
        }
    }, {
        key: "hideExpressionType",
        value: function hideExpressionType() {
            if (!this.exprTypeTooltip) return;
            this.exprTypeTooltip.remove();
            this.exprTypeTooltip = null;
            if (this.keydownSubscription) {
                this.disposable.remove(this.keydownSubscription);
                this.keydownSubscription.unsubscribe();
                this.keydownSubscription = null;
            }
        }
    }, {
        key: "getFromShadowDom",
        value: function getFromShadowDom(element, selector) {
            var el = element[0];
            if (!el.rootElement) return $(el);
            var found = el.rootElement.querySelectorAll(selector);
            return $(found[0]);
        }
    }, {
        key: "pixelPositionFromMouseEvent",
        value: function pixelPositionFromMouseEvent(editorView, event) {
            var clientX = event.clientX,
                clientY = event.clientY;
            var shadow = this.getFromShadowDom(editorView, ".lines")[0];
            if (!shadow) return;
            var linesClientRect = shadow.getBoundingClientRect();
            var top = clientY - linesClientRect.top;
            var left = clientX - linesClientRect.left;
            top += this.editor.getScrollTop();
            left += this.editor.getScrollLeft();
            return { top: top, left: left };
        }
    }]);

    return Tooltip;
}();

var typeLookup = exports.typeLookup = new TypeLookup();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9sb29rdXAuanMiLCJsaWIvZmVhdHVyZXMvbG9va3VwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQUNBOztBQUNBOztBQUNBOzs7O0FDS0EsSUFBTSxJQUFrQixRQUFRLFFBQVIsQ0FBbEI7QUFDTixJQUFNLFNBQVMsUUFBUSxhQUFSLENBQVQ7O0lBRU47QUFBQSwwQkFBQTs7O0FBMkJXLGFBQUEsUUFBQSxHQUFXLEtBQVgsQ0EzQlg7QUE0QlcsYUFBQSxLQUFBLEdBQVEsZ0JBQVIsQ0E1Qlg7QUE2QlcsYUFBQSxXQUFBLEdBQWMsdURBQWQsQ0E3Qlg7S0FBQTs7OzttQ0FHbUI7QUFDWCxnQkFBSSxnQkFBSixDQURXO0FBR1gsaUJBQUssVUFBTCxHQUFrQiwwQ0FBbEIsQ0FIVztBQUlYLGlCQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsV0FBSyxrQkFBTCxDQUF3QixVQUFDLE1BQUQsRUFBUyxFQUFULEVBQVc7QUFHbkQsb0JBQU0sYUFBYSxFQUFFLEtBQUssS0FBTCxDQUFXLE9BQVgsQ0FBbUIsTUFBbkIsQ0FBRixDQUFiLENBSDZDO0FBSW5ELDBCQUFVLElBQUksT0FBSixDQUFZLFVBQVosRUFBd0IsTUFBeEIsQ0FBVixDQUptRDtBQUtuRCxtQkFBRyxHQUFILENBQU8sT0FBUCxFQUxtRDthQUFYLENBQTVDLEVBSlc7QUFZWCxpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLFdBQUssb0JBQUwsQ0FBMEIsNEJBQTFCLEVBQXdELFlBQUE7QUFDeEUsMkJBQUssWUFBTCxDQUFrQixLQUFsQixHQUEwQixTQUExQixDQUFvQyxrQkFBTTtBQUN0Qyw0QkFBUSwyQkFBUixHQURzQztpQkFBTixDQUFwQyxDQUR3RTthQUFBLENBQTVFLEVBWlc7Ozs7a0NBb0JEO0FBQ1YsaUJBQUssVUFBTCxDQUFnQixPQUFoQixHQURVOzs7Ozs7O0lBU2xCO0FBT0kscUJBQW9CLFVBQXBCLEVBQWdELE1BQWhELEVB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LEVBQWQsQ0FSa0U7QUFTbEUsbUJBQU8sRUFBRSxLQUFLLEdBQUwsRUFBVSxNQUFNLElBQU4sRUFBbkIsQ0FUa0U7Ozs7Ozs7QUFhbkUsSUFBTSxrQ0FBYSxJQUFJLFVBQUosRUFBYiIsImZpbGUiOiJsaWIvZmVhdHVyZXMvbG9va3VwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgT2JzZXJ2YWJsZSB9IGZyb20gXCJyeGpzXCI7XG5pbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlIH0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcbmltcG9ydCB7IE9tbmkgfSBmcm9tIFwiLi4vc2VydmVyL29tbmlcIjtcbmltcG9ydCB7IFRvb2x0aXBWaWV3IH0gZnJvbSBcIi4uL3ZpZXdzL3Rvb2x0aXAtdmlld1wiO1xuY29uc3QgJCA9IHJlcXVpcmUoXCJqcXVlcnlcIik7XG5jb25zdCBlc2NhcGUgPSByZXF1aXJlKFwiZXNjYXBlLWh0bWxcIik7XG5jbGFzcyBUeXBlTG9va3VwIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5yZXF1aXJlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLnRpdGxlID0gXCJUb29sdGlwIExvb2t1cFwiO1xuICAgICAgICB0aGlzLmRlc2NyaXB0aW9uID0gXCJBZGRzIGhvdmVyIHRvb2x0aXBzIHRvIHRoZSBlZGl0b3IsIGFsc28gaGFzIGEga2V5YmluZFwiO1xuICAgIH1cbiAgICBhY3RpdmF0ZSgpIHtcbiAgICAgICAgbGV0IHRvb2x0aXA7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5zd2l0Y2hBY3RpdmVFZGl0b3IoKGVkaXRvciwgY2QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGVkaXRvclZpZXcgPSAkKGF0b20udmlld3MuZ2V0VmlldyhlZGl0b3IpKTtcbiAgICAgICAgICAgIHRvb2x0aXAgPSBuZXcgVG9vbHRpcChlZGl0b3JWaWV3LCBlZGl0b3IpO1xuICAgICAgICAgICAgY2QuYWRkKHRvb2x0aXApO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5hZGRUZXh0RWRpdG9yQ29tbWFuZChcIm9tbmlzaGFycC1hdG9tOnR5cGUtbG9va3VwXCIsICgpID0+IHtcbiAgICAgICAgICAgIE9tbmkuYWN0aXZlRWRpdG9yLmZpcnN0KCkuc3Vic2NyaWJlKGVkaXRvciA9PiB7XG4gICAgICAgICAgICAgICAgdG9vbHRpcC5zaG93RXhwcmVzc2lvblR5cGVPbkNvbW1hbmQoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KSk7XG4gICAgfVxuICAgIGRpc3Bvc2UoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfVxufVxuY2xhc3MgVG9vbHRpcCB7XG4gICAgY29uc3RydWN0b3IoZWRpdG9yVmlldywgZWRpdG9yKSB7XG4gICAgICAgIHRoaXMuZWRpdG9yVmlldyA9IGVkaXRvclZpZXc7XG4gICAgICAgIHRoaXMuZWRpdG9yID0gZWRpdG9yO1xuICAgICAgICB0aGlzLmV4cHJUeXBlVG9vbHRpcCA9IG51bGw7XG4gICAgICAgIHRoaXMucmF3VmlldyA9IGVkaXRvclZpZXdbMF07XG4gICAgICAgIGNvbnN0IGNkID0gdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgY29uc3Qgc2Nyb2xsID0gdGhpcy5nZXRGcm9tU2hhZG93RG9tKGVkaXRvclZpZXcsIFwiLnNjcm9sbC12aWV3XCIpO1xuICAgICAgICBpZiAoIXNjcm9sbFswXSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgbGV0IGxhc3RFeHByVHlwZUJ1ZmZlclB0O1xuICAgICAgICBjb25zdCBtb3VzZW1vdmUgPSBPYnNlcnZhYmxlLmZyb21FdmVudChzY3JvbGxbMF0sIFwibW91c2Vtb3ZlXCIpO1xuICAgICAgICBjb25zdCBtb3VzZW91dCA9IE9ic2VydmFibGUuZnJvbUV2ZW50KHNjcm9sbFswXSwgXCJtb3VzZW91dFwiKTtcbiAgICAgICAgdGhpcy5rZXlkb3duID0gT2JzZXJ2YWJsZS5mcm9tRXZlbnQoc2Nyb2xsWzBdLCBcImtleWRvd25cIik7XG4gICAgICAgIGNkLmFkZChtb3VzZW1vdmVcbiAgICAgICAgICAgIC5hdWRpdFRpbWUoMjAwKVxuICAgICAgICAgICAgLm1hcChldmVudCA9PiB7XG4gICAgICAgICAgICBjb25zdCBwaXhlbFB0ID0gdGhpcy5waXhlbFBvc2l0aW9uRnJvbU1vdXNlRXZlbnQoZWRpdG9yVmlldywgZXZlbnQpO1xuICAgICAgICAgICAgaWYgKCFwaXhlbFB0KVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIGNvbnN0IHNjcmVlblB0ID0gZWRpdG9yLnNjcmVlblBvc2l0aW9uRm9yUGl4ZWxQb3NpdGlvbihwaXhlbFB0KTtcbiAgICAgICAgICAgIGNvbnN0IGJ1ZmZlclB0ID0gZWRpdG9yLmJ1ZmZlclBvc2l0aW9uRm9yU2NyZWVuUG9zaXRpb24oc2NyZWVuUHQpO1xuICAgICAgICAgICAgaWYgKGxhc3RFeHByVHlwZUJ1ZmZlclB0ICYmIGxhc3RFeHByVHlwZUJ1ZmZlclB0LmlzRXF1YWwoYnVmZmVyUHQpICYmIHRoaXMuZXhwclR5cGVUb29sdGlwKVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIGxhc3RFeHByVHlwZUJ1ZmZlclB0ID0gYnVmZmVyUHQ7XG4gICAgICAgICAgICByZXR1cm4geyBidWZmZXJQdCwgZXZlbnQgfTtcbiAgICAgICAgfSlcbiAgICAgICAgICAgIC5maWx0ZXIoeiA9PiAhIXopXG4gICAgICAgICAgICAuZG8oKCkgPT4gdGhpcy5oaWRlRXhwcmVzc2lvblR5cGUoKSlcbiAgICAgICAgICAgIC5maWx0ZXIoeCA9PiB0aGlzLmNoZWNrUG9zaXRpb24oeC5idWZmZXJQdCkpXG4gICAgICAgICAgICAuZG8oKCkgPT4gdGhpcy5zdWJjcmliZUtleURvd24oKSlcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoKHsgYnVmZmVyUHQsIGV2ZW50IH0pID0+IHtcbiAgICAgICAgICAgIHRoaXMuc2hvd0V4cHJlc3Npb25UeXBlT25Nb3VzZU92ZXIoZXZlbnQsIGJ1ZmZlclB0KTtcbiAgICAgICAgfSkpO1xuICAgICAgICBjZC5hZGQobW91c2VvdXQuc3Vic2NyaWJlKChlKSA9PiB0aGlzLmhpZGVFeHByZXNzaW9uVHlwZSgpKSk7XG4gICAgICAgIGNkLmFkZChPbW5pLnN3aXRjaEFjdGl2ZUVkaXRvcigoZWRpdCwgaW5uZXJDZCkgPT4ge1xuICAgICAgICAgICAgaW5uZXJDZC5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4gdGhpcy5oaWRlRXhwcmVzc2lvblR5cGUoKSkpO1xuICAgICAgICB9KSk7XG4gICAgICAgIGNkLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmhpZGVFeHByZXNzaW9uVHlwZSgpO1xuICAgICAgICB9KSk7XG4gICAgfVxuICAgIHN1YmNyaWJlS2V5RG93bigpIHtcbiAgICAgICAgdGhpcy5rZXlkb3duU3Vic2NyaXB0aW9uID0gdGhpcy5rZXlkb3duLnN1YnNjcmliZSgoZSkgPT4gdGhpcy5oaWRlRXhwcmVzc2lvblR5cGUoKSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQodGhpcy5rZXlkb3duU3Vic2NyaXB0aW9uKTtcbiAgICB9XG4gICAgc2hvd0V4cHJlc3Npb25UeXBlT25Db21tYW5kKCkge1xuICAgICAgICBpZiAodGhpcy5lZGl0b3IuY3Vyc29ycy5sZW5ndGggPCAxKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zdCBidWZmZXJQdCA9IHRoaXMuZWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKCk7XG4gICAgICAgIGlmICghdGhpcy5jaGVja1Bvc2l0aW9uKGJ1ZmZlclB0KSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3Qgb2Zmc2V0ID0gKHRoaXMucmF3Vmlldy5jb21wb25lbnQuZ2V0Rm9udFNpemUoKSAqIGJ1ZmZlclB0LmNvbHVtbikgKiAwLjc7XG4gICAgICAgIGNvbnN0IHNoYWRvdyA9IHRoaXMuZ2V0RnJvbVNoYWRvd0RvbSh0aGlzLmVkaXRvclZpZXcsIFwiLmN1cnNvci1saW5lXCIpWzBdO1xuICAgICAgICBpZiAoIXNoYWRvdylcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3QgcmVjdCA9IHNoYWRvdy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgY29uc3QgdG9vbHRpcFJlY3QgPSB7XG4gICAgICAgICAgICBsZWZ0OiByZWN0LmxlZnQgLSBvZmZzZXQsXG4gICAgICAgICAgICByaWdodDogcmVjdC5sZWZ0ICsgb2Zmc2V0LFxuICAgICAgICAgICAgdG9wOiByZWN0LmJvdHRvbSxcbiAgICAgICAgICAgIGJvdHRvbTogcmVjdC5ib3R0b21cbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5oaWRlRXhwcmVzc2lvblR5cGUoKTtcbiAgICAgICAgdGhpcy5zdWJjcmliZUtleURvd24oKTtcbiAgICAgICAgdGhpcy5zaG93VG9vbFRpcChidWZmZXJQdCwgdG9vbHRpcFJlY3QpO1xuICAgIH1cbiAgICBzaG93RXhwcmVzc2lvblR5cGVPbk1vdXNlT3ZlcihlLCBidWZmZXJQdCkge1xuICAgICAgICBpZiAoIU9tbmkuaXNPbikge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmV4cHJUeXBlVG9vbHRpcClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3Qgb2Zmc2V0ID0gdGhpcy5lZGl0b3IuZ2V0TGluZUhlaWdodEluUGl4ZWxzKCkgKiAwLjc7XG4gICAgICAgIGNvbnN0IHRvb2x0aXBSZWN0ID0ge1xuICAgICAgICAgICAgbGVmdDogZS5jbGllbnRYLFxuICAgICAgICAgICAgcmlnaHQ6IGUuY2xpZW50WCxcbiAgICAgICAgICAgIHRvcDogZS5jbGllbnRZIC0gb2Zmc2V0LFxuICAgICAgICAgICAgYm90dG9tOiBlLmNsaWVudFkgKyBvZmZzZXRcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5zaG93VG9vbFRpcChidWZmZXJQdCwgdG9vbHRpcFJlY3QpO1xuICAgIH1cbiAgICBjaGVja1Bvc2l0aW9uKGJ1ZmZlclB0KSB7XG4gICAgICAgIGNvbnN0IGN1ckNoYXJQaXhlbFB0ID0gdGhpcy5yYXdWaWV3LnBpeGVsUG9zaXRpb25Gb3JCdWZmZXJQb3NpdGlvbihbYnVmZmVyUHQucm93LCBidWZmZXJQdC5jb2x1bW5dKTtcbiAgICAgICAgY29uc3QgbmV4dENoYXJQaXhlbFB0ID0gdGhpcy5yYXdWaWV3LnBpeGVsUG9zaXRpb25Gb3JCdWZmZXJQb3NpdGlvbihbYnVmZmVyUHQucm93LCBidWZmZXJQdC5jb2x1bW4gKyAxXSk7XG4gICAgICAgIGlmIChjdXJDaGFyUGl4ZWxQdC5sZWZ0ID49IG5leHRDaGFyUGl4ZWxQdC5sZWZ0KSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBzaG93VG9vbFRpcChidWZmZXJQdCwgdG9vbHRpcFJlY3QpIHtcbiAgICAgICAgdGhpcy5leHByVHlwZVRvb2x0aXAgPSBuZXcgVG9vbHRpcFZpZXcodG9vbHRpcFJlY3QpO1xuICAgICAgICBPbW5pLnJlcXVlc3Qoc29sdXRpb24gPT4gc29sdXRpb24udHlwZWxvb2t1cCh7XG4gICAgICAgICAgICBJbmNsdWRlRG9jdW1lbnRhdGlvbjogdHJ1ZSxcbiAgICAgICAgICAgIExpbmU6IGJ1ZmZlclB0LnJvdyxcbiAgICAgICAgICAgIENvbHVtbjogYnVmZmVyUHQuY29sdW1uXG4gICAgICAgIH0pKS5zdWJzY3JpYmUoKHJlc3BvbnNlKSA9PiB7XG4gICAgICAgICAgICBpZiAocmVzcG9uc2UuVHlwZSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldCBtZXNzYWdlID0gYDxiPiR7ZXNjYXBlKHJlc3BvbnNlLlR5cGUpfTwvYj5gO1xuICAgICAgICAgICAgaWYgKHJlc3BvbnNlLkRvY3VtZW50YXRpb24pIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlID0gbWVzc2FnZSArIGA8YnIvPjxpPiR7ZXNjYXBlKHJlc3BvbnNlLkRvY3VtZW50YXRpb24pfTwvaT5gO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMuZXhwclR5cGVUb29sdGlwKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5leHByVHlwZVRvb2x0aXAudXBkYXRlVGV4dChtZXNzYWdlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGRpc3Bvc2UoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfVxuICAgIGhpZGVFeHByZXNzaW9uVHlwZSgpIHtcbiAgICAgICAgaWYgKCF0aGlzLmV4cHJUeXBlVG9vbHRpcClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdGhpcy5leHByVHlwZVRvb2x0aXAucmVtb3ZlKCk7XG4gICAgICAgIHRoaXMuZXhwclR5cGVUb29sdGlwID0gbnVsbDtcbiAgICAgICAgaWYgKHRoaXMua2V5ZG93blN1YnNjcmlwdGlvbikge1xuICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLnJlbW92ZSh0aGlzLmtleWRvd25TdWJzY3JpcHRpb24pO1xuICAgICAgICAgICAgdGhpcy5rZXlkb3duU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgICAgICAgICB0aGlzLmtleWRvd25TdWJzY3JpcHRpb24gPSBudWxsO1xuICAgICAgICB9XG4gICAgfVxuICAgIGdldEZyb21TaGFkb3dEb20oZWxlbWVudCwgc2VsZWN0b3IpIHtcbiAgICAgICAgY29uc3QgZWwgPSBlbGVtZW50WzBdO1xuICAgICAgICBpZiAoIWVsLnJvb3RFbGVtZW50KVxuICAgICAgICAgICAgcmV0dXJuICQoZWwpO1xuICAgICAgICBjb25zdCBmb3VuZCA9IGVsLnJvb3RFbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpO1xuICAgICAgICByZXR1cm4gJChmb3VuZFswXSk7XG4gICAgfVxuICAgIHBpeGVsUG9zaXRpb25Gcm9tTW91c2VFdmVudChlZGl0b3JWaWV3LCBldmVudCkge1xuICAgICAgICBjb25zdCBjbGllbnRYID0gZXZlbnQuY2xpZW50WCwgY2xpZW50WSA9IGV2ZW50LmNsaWVudFk7XG4gICAgICAgIGNvbnN0IHNoYWRvdyA9IHRoaXMuZ2V0RnJvbVNoYWRvd0RvbShlZGl0b3JWaWV3LCBcIi5saW5lc1wiKVswXTtcbiAgICAgICAgaWYgKCFzaGFkb3cpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNvbnN0IGxpbmVzQ2xpZW50UmVjdCA9IHNoYWRvdy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgbGV0IHRvcCA9IGNsaWVudFkgLSBsaW5lc0NsaWVudFJlY3QudG9wO1xuICAgICAgICBsZXQgbGVmdCA9IGNsaWVudFggLSBsaW5lc0NsaWVudFJlY3QubGVmdDtcbiAgICAgICAgdG9wICs9IHRoaXMuZWRpdG9yLmdldFNjcm9sbFRvcCgpO1xuICAgICAgICBsZWZ0ICs9IHRoaXMuZWRpdG9yLmdldFNjcm9sbExlZnQoKTtcbiAgICAgICAgcmV0dXJuIHsgdG9wOiB0b3AsIGxlZnQ6IGxlZnQgfTtcbiAgICB9XG59XG5leHBvcnQgY29uc3QgdHlwZUxvb2t1cCA9IG5ldyBUeXBlTG9va3VwO1xuIiwiLy8gSW5zcGlyYXRpb24gOiBodHRwczovL2F0b20uaW8vcGFja2FnZXMvaWRlLWhhc2tlbGxcclxuLy8gYW5kIGh0dHBzOi8vYXRvbS5pby9wYWNrYWdlcy9pZGUtZmxvd1xyXG4vLyBodHRwczovL2F0b20uaW8vcGFja2FnZXMvYXRvbS10eXBlc2NyaXB0XHJcbmltcG9ydCB7TW9kZWxzfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xyXG5pbXBvcnQge09ic2VydmFibGUsIFN1YnNjcmlwdGlvbn0gZnJvbSBcInJ4anNcIjtcclxuaW1wb3J0IHtDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlLCBJRGlzcG9zYWJsZX0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcclxuaW1wb3J0IHtPbW5pfSBmcm9tIFwiLi4vc2VydmVyL29tbmlcIjtcclxuaW1wb3J0IHtUb29sdGlwVmlld30gZnJvbSBcIi4uL3ZpZXdzL3Rvb2x0aXAtdmlld1wiO1xyXG5jb25zdCAkOiBKUXVlcnlTdGF0aWMgPSByZXF1aXJlKFwianF1ZXJ5XCIpO1xyXG5jb25zdCBlc2NhcGUgPSByZXF1aXJlKFwiZXNjYXBlLWh0bWxcIik7XHJcblxyXG5jbGFzcyBUeXBlTG9va3VwIGltcGxlbWVudHMgSUZlYXR1cmUge1xyXG4gICAgcHJpdmF0ZSBkaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xyXG5cclxuICAgIHB1YmxpYyBhY3RpdmF0ZSgpIHtcclxuICAgICAgICBsZXQgdG9vbHRpcDogVG9vbHRpcDtcclxuICAgICAgICAvKiB0c2xpbnQ6ZGlzYWJsZTpuby1zdHJpbmctbGl0ZXJhbCAqL1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLnN3aXRjaEFjdGl2ZUVkaXRvcigoZWRpdG9yLCBjZCkgPT4ge1xyXG4gICAgICAgICAgICAvLyBzdWJzY3JpYmUgZm9yIHRvb2x0aXBzXHJcbiAgICAgICAgICAgIC8vIGluc3BpcmF0aW9uIDogaHR0cHM6Ly9naXRodWIuY29tL2NoYWlrYTIwMTMvaWRlLWhhc2tlbGxcclxuICAgICAgICAgICAgY29uc3QgZWRpdG9yVmlldyA9ICQoYXRvbS52aWV3cy5nZXRWaWV3KGVkaXRvcikpO1xyXG4gICAgICAgICAgICB0b29sdGlwID0gbmV3IFRvb2x0aXAoZWRpdG9yVmlldywgZWRpdG9yKTtcclxuICAgICAgICAgICAgY2QuYWRkKHRvb2x0aXApO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmFkZFRleHRFZGl0b3JDb21tYW5kKFwib21uaXNoYXJwLWF0b206dHlwZS1sb29rdXBcIiwgKCkgPT4ge1xyXG4gICAgICAgICAgICBPbW5pLmFjdGl2ZUVkaXRvci5maXJzdCgpLnN1YnNjcmliZShlZGl0b3IgPT4ge1xyXG4gICAgICAgICAgICAgICAgdG9vbHRpcC5zaG93RXhwcmVzc2lvblR5cGVPbkNvbW1hbmQoKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSkpO1xyXG4gICAgICAgIC8qIHRzbGludDplbmFibGU6bm8tc3RyaW5nLWxpdGVyYWwgKi9cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGlzcG9zZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZXF1aXJlZCA9IGZhbHNlO1xyXG4gICAgcHVibGljIHRpdGxlID0gXCJUb29sdGlwIExvb2t1cFwiO1xyXG4gICAgcHVibGljIGRlc2NyaXB0aW9uID0gXCJBZGRzIGhvdmVyIHRvb2x0aXBzIHRvIHRoZSBlZGl0b3IsIGFsc28gaGFzIGEga2V5YmluZFwiO1xyXG59XHJcblxyXG5jbGFzcyBUb29sdGlwIGltcGxlbWVudHMgSURpc3Bvc2FibGUge1xyXG4gICAgcHJpdmF0ZSBleHByVHlwZVRvb2x0aXA6IFRvb2x0aXBWaWV3ID0gbnVsbDtcclxuICAgIHByaXZhdGUga2V5ZG93bjogT2JzZXJ2YWJsZTxLZXlib2FyZEV2ZW50PjtcclxuICAgIHByaXZhdGUga2V5ZG93blN1YnNjcmlwdGlvbjogU3Vic2NyaXB0aW9uO1xyXG4gICAgcHJpdmF0ZSByYXdWaWV3OiBhbnk7XHJcbiAgICBwcml2YXRlIGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XHJcblxyXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBlZGl0b3JWaWV3OiBKUXVlcnksIHByaXZhdGUgZWRpdG9yOiBBdG9tLlRleHRFZGl0b3IpIHtcclxuICAgICAgICB0aGlzLnJhd1ZpZXcgPSBlZGl0b3JWaWV3WzBdO1xyXG5cclxuICAgICAgICBjb25zdCBjZCA9IHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcblxyXG4gICAgICAgIGNvbnN0IHNjcm9sbCA9IHRoaXMuZ2V0RnJvbVNoYWRvd0RvbShlZGl0b3JWaWV3LCBcIi5zY3JvbGwtdmlld1wiKTtcclxuICAgICAgICBpZiAoIXNjcm9sbFswXSkgcmV0dXJuO1xyXG5cclxuICAgICAgICAvLyB0byBkZWJvdW5jZSBtb3VzZW1vdmUgZXZlbnRcInMgZmlyaW5nIGZvciBzb21lIHJlYXNvbiBvbiBzb21lIG1hY2hpbmVzXHJcbiAgICAgICAgbGV0IGxhc3RFeHByVHlwZUJ1ZmZlclB0OiBhbnk7XHJcblxyXG4gICAgICAgIGNvbnN0IG1vdXNlbW92ZSA9IE9ic2VydmFibGUuZnJvbUV2ZW50PE1vdXNlRXZlbnQ+KHNjcm9sbFswXSwgXCJtb3VzZW1vdmVcIik7XHJcbiAgICAgICAgY29uc3QgbW91c2VvdXQgPSBPYnNlcnZhYmxlLmZyb21FdmVudDxNb3VzZUV2ZW50PihzY3JvbGxbMF0sIFwibW91c2VvdXRcIik7XHJcbiAgICAgICAgdGhpcy5rZXlkb3duID0gT2JzZXJ2YWJsZS5mcm9tRXZlbnQ8S2V5Ym9hcmRFdmVudD4oc2Nyb2xsWzBdLCBcImtleWRvd25cIik7XHJcblxyXG4gICAgICAgIGNkLmFkZChtb3VzZW1vdmVcclxuICAgICAgICAgICAgLmF1ZGl0VGltZSgyMDApXHJcbiAgICAgICAgICAgIC5tYXAoZXZlbnQgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcGl4ZWxQdCA9IHRoaXMucGl4ZWxQb3NpdGlvbkZyb21Nb3VzZUV2ZW50KGVkaXRvclZpZXcsIGV2ZW50KTtcclxuICAgICAgICAgICAgICAgIGlmICghcGl4ZWxQdClcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICBjb25zdCBzY3JlZW5QdCA9IGVkaXRvci5zY3JlZW5Qb3NpdGlvbkZvclBpeGVsUG9zaXRpb24ocGl4ZWxQdCk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBidWZmZXJQdCA9IGVkaXRvci5idWZmZXJQb3NpdGlvbkZvclNjcmVlblBvc2l0aW9uKHNjcmVlblB0KTtcclxuICAgICAgICAgICAgICAgIGlmIChsYXN0RXhwclR5cGVCdWZmZXJQdCAmJiBsYXN0RXhwclR5cGVCdWZmZXJQdC5pc0VxdWFsKGJ1ZmZlclB0KSAmJiB0aGlzLmV4cHJUeXBlVG9vbHRpcClcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgICAgICAgICAgbGFzdEV4cHJUeXBlQnVmZmVyUHQgPSBidWZmZXJQdDtcclxuICAgICAgICAgICAgICAgIHJldHVybiB7IGJ1ZmZlclB0LCBldmVudCB9O1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAuZmlsdGVyKHogPT4gISF6KVxyXG4gICAgICAgICAgICAuZG8oKCkgPT4gdGhpcy5oaWRlRXhwcmVzc2lvblR5cGUoKSlcclxuICAgICAgICAgICAgLmZpbHRlcih4ID0+IHRoaXMuY2hlY2tQb3NpdGlvbih4LmJ1ZmZlclB0KSlcclxuICAgICAgICAgICAgLmRvKCgpID0+IHRoaXMuc3ViY3JpYmVLZXlEb3duKCkpXHJcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoKHtidWZmZXJQdCwgZXZlbnR9KSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNob3dFeHByZXNzaW9uVHlwZU9uTW91c2VPdmVyKGV2ZW50LCBidWZmZXJQdCk7XHJcbiAgICAgICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgY2QuYWRkKG1vdXNlb3V0LnN1YnNjcmliZSgoZSkgPT4gdGhpcy5oaWRlRXhwcmVzc2lvblR5cGUoKSkpO1xyXG5cclxuICAgICAgICBjZC5hZGQoT21uaS5zd2l0Y2hBY3RpdmVFZGl0b3IoKGVkaXQsIGlubmVyQ2QpID0+IHtcclxuICAgICAgICAgICAgaW5uZXJDZC5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4gdGhpcy5oaWRlRXhwcmVzc2lvblR5cGUoKSkpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgY2QuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5oaWRlRXhwcmVzc2lvblR5cGUoKTtcclxuICAgICAgICB9KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBzdWJjcmliZUtleURvd24oKSB7XHJcbiAgICAgICAgdGhpcy5rZXlkb3duU3Vic2NyaXB0aW9uID0gdGhpcy5rZXlkb3duLnN1YnNjcmliZSgoZSkgPT4gdGhpcy5oaWRlRXhwcmVzc2lvblR5cGUoKSk7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZCh0aGlzLmtleWRvd25TdWJzY3JpcHRpb24pO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzaG93RXhwcmVzc2lvblR5cGVPbkNvbW1hbmQoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuZWRpdG9yLmN1cnNvcnMubGVuZ3RoIDwgMSkgcmV0dXJuO1xyXG5cclxuICAgICAgICBjb25zdCBidWZmZXJQdCA9IHRoaXMuZWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKCk7XHJcblxyXG4gICAgICAgIGlmICghdGhpcy5jaGVja1Bvc2l0aW9uKGJ1ZmZlclB0KSkgcmV0dXJuO1xyXG5cclxuICAgICAgICAvLyBmaW5kIG91dCBzaG93IHBvc2l0aW9uXHJcbiAgICAgICAgY29uc3Qgb2Zmc2V0ID0gKHRoaXMucmF3Vmlldy5jb21wb25lbnQuZ2V0Rm9udFNpemUoKSAqIGJ1ZmZlclB0LmNvbHVtbikgKiAwLjc7XHJcbiAgICAgICAgY29uc3Qgc2hhZG93ID0gdGhpcy5nZXRGcm9tU2hhZG93RG9tKHRoaXMuZWRpdG9yVmlldywgXCIuY3Vyc29yLWxpbmVcIilbMF07XHJcbiAgICAgICAgaWYgKCFzaGFkb3cpIHJldHVybjtcclxuICAgICAgICBjb25zdCByZWN0ID0gc2hhZG93LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xyXG5cclxuICAgICAgICBjb25zdCB0b29sdGlwUmVjdCA9IHtcclxuICAgICAgICAgICAgbGVmdDogcmVjdC5sZWZ0IC0gb2Zmc2V0LFxyXG4gICAgICAgICAgICByaWdodDogcmVjdC5sZWZ0ICsgb2Zmc2V0LFxyXG4gICAgICAgICAgICB0b3A6IHJlY3QuYm90dG9tLFxyXG4gICAgICAgICAgICBib3R0b206IHJlY3QuYm90dG9tXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5oaWRlRXhwcmVzc2lvblR5cGUoKTtcclxuICAgICAgICB0aGlzLnN1YmNyaWJlS2V5RG93bigpO1xyXG4gICAgICAgIHRoaXMuc2hvd1Rvb2xUaXAoYnVmZmVyUHQsIHRvb2x0aXBSZWN0KTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHNob3dFeHByZXNzaW9uVHlwZU9uTW91c2VPdmVyKGU6IE1vdXNlRXZlbnQsIGJ1ZmZlclB0OiBUZXh0QnVmZmVyLlBvaW50KSB7XHJcbiAgICAgICAgaWYgKCFPbW5pLmlzT24pIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gSWYgd2UgYXJlIGFscmVhZHkgc2hvd2luZyB3ZSBzaG91bGQgd2FpdCBmb3IgdGhhdCB0byBjbGVhclxyXG4gICAgICAgIGlmICh0aGlzLmV4cHJUeXBlVG9vbHRpcCkgcmV0dXJuO1xyXG5cclxuICAgICAgICAvLyBmaW5kIG91dCBzaG93IHBvc2l0aW9uXHJcbiAgICAgICAgY29uc3Qgb2Zmc2V0ID0gKDxhbnk+dGhpcy5lZGl0b3IpLmdldExpbmVIZWlnaHRJblBpeGVscygpICogMC43O1xyXG4gICAgICAgIGNvbnN0IHRvb2x0aXBSZWN0ID0ge1xyXG4gICAgICAgICAgICBsZWZ0OiBlLmNsaWVudFgsXHJcbiAgICAgICAgICAgIHJpZ2h0OiBlLmNsaWVudFgsXHJcbiAgICAgICAgICAgIHRvcDogZS5jbGllbnRZIC0gb2Zmc2V0LFxyXG4gICAgICAgICAgICBib3R0b206IGUuY2xpZW50WSArIG9mZnNldFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuc2hvd1Rvb2xUaXAoYnVmZmVyUHQsIHRvb2x0aXBSZWN0KTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGNoZWNrUG9zaXRpb24oYnVmZmVyUHQ6IFRleHRCdWZmZXIuUG9pbnQpIHtcclxuICAgICAgICBjb25zdCBjdXJDaGFyUGl4ZWxQdCA9IHRoaXMucmF3Vmlldy5waXhlbFBvc2l0aW9uRm9yQnVmZmVyUG9zaXRpb24oW2J1ZmZlclB0LnJvdywgYnVmZmVyUHQuY29sdW1uXSk7XHJcbiAgICAgICAgY29uc3QgbmV4dENoYXJQaXhlbFB0ID0gdGhpcy5yYXdWaWV3LnBpeGVsUG9zaXRpb25Gb3JCdWZmZXJQb3NpdGlvbihbYnVmZmVyUHQucm93LCBidWZmZXJQdC5jb2x1bW4gKyAxXSk7XHJcblxyXG4gICAgICAgIGlmIChjdXJDaGFyUGl4ZWxQdC5sZWZ0ID49IG5leHRDaGFyUGl4ZWxQdC5sZWZ0KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBzaG93VG9vbFRpcChidWZmZXJQdDogVGV4dEJ1ZmZlci5Qb2ludCwgdG9vbHRpcFJlY3Q6IGFueSkge1xyXG4gICAgICAgIHRoaXMuZXhwclR5cGVUb29sdGlwID0gbmV3IFRvb2x0aXBWaWV3KHRvb2x0aXBSZWN0KTtcclxuXHJcbiAgICAgICAgLy8gQWN0dWFsbHkgbWFrZSB0aGUgcHJvZ3JhbSBtYW5hZ2VyIHF1ZXJ5XHJcbiAgICAgICAgT21uaS5yZXF1ZXN0KHNvbHV0aW9uID0+IHNvbHV0aW9uLnR5cGVsb29rdXAoe1xyXG4gICAgICAgICAgICBJbmNsdWRlRG9jdW1lbnRhdGlvbjogdHJ1ZSxcclxuICAgICAgICAgICAgTGluZTogYnVmZmVyUHQucm93LFxyXG4gICAgICAgICAgICBDb2x1bW46IGJ1ZmZlclB0LmNvbHVtblxyXG4gICAgICAgIH0pKS5zdWJzY3JpYmUoKHJlc3BvbnNlOiBNb2RlbHMuVHlwZUxvb2t1cFJlc3BvbnNlKSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChyZXNwb25zZS5UeXBlID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgbGV0IG1lc3NhZ2UgPSBgPGI+JHtlc2NhcGUocmVzcG9uc2UuVHlwZSl9PC9iPmA7XHJcbiAgICAgICAgICAgIGlmIChyZXNwb25zZS5Eb2N1bWVudGF0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICBtZXNzYWdlID0gbWVzc2FnZSArIGA8YnIvPjxpPiR7ZXNjYXBlKHJlc3BvbnNlLkRvY3VtZW50YXRpb24pfTwvaT5gO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIFNvcnJ5IGFib3V0IHRoaXMgXCJpZlwiLiBJdFwicyBpbiB0aGUgY29kZSBJIGNvcGllZCBzbyBJIGd1ZXNzIGl0cyB0aGVyZSBmb3IgYSByZWFzb25cclxuICAgICAgICAgICAgaWYgKHRoaXMuZXhwclR5cGVUb29sdGlwKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmV4cHJUeXBlVG9vbHRpcC51cGRhdGVUZXh0KG1lc3NhZ2UpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGhpZGVFeHByZXNzaW9uVHlwZSgpIHtcclxuICAgICAgICBpZiAoIXRoaXMuZXhwclR5cGVUb29sdGlwKSByZXR1cm47XHJcbiAgICAgICAgdGhpcy5leHByVHlwZVRvb2x0aXAucmVtb3ZlKCk7XHJcbiAgICAgICAgdGhpcy5leHByVHlwZVRvb2x0aXAgPSBudWxsO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5rZXlkb3duU3Vic2NyaXB0aW9uKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5yZW1vdmUodGhpcy5rZXlkb3duU3Vic2NyaXB0aW9uKTtcclxuICAgICAgICAgICAgdGhpcy5rZXlkb3duU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XHJcbiAgICAgICAgICAgIHRoaXMua2V5ZG93blN1YnNjcmlwdGlvbiA9IG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZ2V0RnJvbVNoYWRvd0RvbShlbGVtZW50OiBKUXVlcnksIHNlbGVjdG9yOiBzdHJpbmcpOiBKUXVlcnkge1xyXG4gICAgICAgIGNvbnN0IGVsID0gZWxlbWVudFswXTtcclxuICAgICAgICBpZiAoISg8YW55PmVsKS5yb290RWxlbWVudCkgcmV0dXJuICQoZWwpO1xyXG5cclxuICAgICAgICBjb25zdCBmb3VuZCA9ICg8YW55PmVsKS5yb290RWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKTtcclxuICAgICAgICByZXR1cm4gJChmb3VuZFswXSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBwaXhlbFBvc2l0aW9uRnJvbU1vdXNlRXZlbnQoZWRpdG9yVmlldzogYW55LCBldmVudDogTW91c2VFdmVudCkge1xyXG4gICAgICAgIGNvbnN0IGNsaWVudFggPSBldmVudC5jbGllbnRYLCBjbGllbnRZID0gZXZlbnQuY2xpZW50WTtcclxuICAgICAgICBjb25zdCBzaGFkb3cgPSB0aGlzLmdldEZyb21TaGFkb3dEb20oZWRpdG9yVmlldywgXCIubGluZXNcIilbMF07XHJcbiAgICAgICAgaWYgKCFzaGFkb3cpIHJldHVybjtcclxuICAgICAgICBjb25zdCBsaW5lc0NsaWVudFJlY3QgPSBzaGFkb3cuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XHJcbiAgICAgICAgbGV0IHRvcCA9IGNsaWVudFkgLSBsaW5lc0NsaWVudFJlY3QudG9wO1xyXG4gICAgICAgIGxldCBsZWZ0ID0gY2xpZW50WCAtIGxpbmVzQ2xpZW50UmVjdC5sZWZ0O1xyXG4gICAgICAgIHRvcCArPSAoPGFueT50aGlzLmVkaXRvcikuZ2V0U2Nyb2xsVG9wKCk7XHJcbiAgICAgICAgbGVmdCArPSAoPGFueT50aGlzLmVkaXRvcikuZ2V0U2Nyb2xsTGVmdCgpO1xyXG4gICAgICAgIHJldHVybiB7IHRvcDogdG9wLCBsZWZ0OiBsZWZ0IH07XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCB0eXBlTG9va3VwID0gbmV3IFR5cGVMb29rdXA7XHJcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
