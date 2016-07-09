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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9sb29rdXAuanMiLCJsaWIvZmVhdHVyZXMvbG9va3VwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQUNBOztBQUNBOztBQUNBOzs7O0FDS0EsSUFBTSxJQUFrQixRQUFRLFFBQVIsQ0FBeEI7QUFDQSxJQUFNLFNBQVMsUUFBUSxhQUFSLENBQWY7O0lBRUEsVTtBQUFBLDBCQUFBO0FBQUE7O0FBMkJXLGFBQUEsUUFBQSxHQUFXLEtBQVg7QUFDQSxhQUFBLEtBQUEsR0FBUSxnQkFBUjtBQUNBLGFBQUEsV0FBQSxHQUFjLHVEQUFkO0FBQ1Y7Ozs7bUNBM0JrQjtBQUNYLGdCQUFJLGdCQUFKO0FBRUEsaUJBQUssVUFBTCxHQUFrQiwwQ0FBbEI7QUFDQSxpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLFdBQUssa0JBQUwsQ0FBd0IsVUFBQyxNQUFELEVBQVMsRUFBVCxFQUFXO0FBR25ELG9CQUFNLGFBQWEsRUFBRSxLQUFLLEtBQUwsQ0FBVyxPQUFYLENBQW1CLE1BQW5CLENBQUYsQ0FBbkI7QUFDQSwwQkFBVSxJQUFJLE9BQUosQ0FBWSxVQUFaLEVBQXdCLE1BQXhCLENBQVY7QUFDQSxtQkFBRyxHQUFILENBQU8sT0FBUDtBQUNILGFBTm1CLENBQXBCO0FBUUEsaUJBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQixXQUFLLG9CQUFMLENBQTBCLDRCQUExQixFQUF3RCxZQUFBO0FBQ3hFLDJCQUFLLFlBQUwsQ0FBa0IsS0FBbEIsR0FBMEIsU0FBMUIsQ0FBb0Msa0JBQU07QUFDdEMsNEJBQVEsMkJBQVI7QUFDSCxpQkFGRDtBQUdILGFBSm1CLENBQXBCO0FBTUg7OztrQ0FFYTtBQUNWLGlCQUFLLFVBQUwsQ0FBZ0IsT0FBaEI7QUFDSDs7Ozs7O0lBT0wsTztBQU9JLHFCQUFvQixVQUFwQixFQUFnRCxNQUFoRCxFQUF1RTtBQUFBOztBQUFBOztBQUFuRCxhQUFBLFVBQUEsR0FBQSxVQUFBO0FBQTRCLGFB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LHFCQUFLLG1CQUFMLENBQXlCLFdBQXpCO0FBQ0EscUJBQUssbUJBQUwsR0FBMkIsSUFBM0I7QUFDSDtBQUNKOzs7eUNBRXdCLE8sRUFBaUIsUSxFQUFnQjtBQUN0RCxnQkFBTSxLQUFLLFFBQVEsQ0FBUixDQUFYO0FBQ0EsZ0JBQUksQ0FBTyxHQUFJLFdBQWYsRUFBNEIsT0FBTyxFQUFFLEVBQUYsQ0FBUDtBQUU1QixnQkFBTSxRQUFjLEdBQUksV0FBSixDQUFnQixnQkFBaEIsQ0FBaUMsUUFBakMsQ0FBcEI7QUFDQSxtQkFBTyxFQUFFLE1BQU0sQ0FBTixDQUFGLENBQVA7QUFDSDs7O29EQUVtQyxVLEVBQWlCLEssRUFBaUI7QUFDbEUsZ0JBQU0sVUFBVSxNQUFNLE9BQXRCO2dCQUErQixVQUFVLE1BQU0sT0FBL0M7QUFDQSxnQkFBTSxTQUFTLEtBQUssZ0JBQUwsQ0FBc0IsVUFBdEIsRUFBa0MsUUFBbEMsRUFBNEMsQ0FBNUMsQ0FBZjtBQUNBLGdCQUFJLENBQUMsTUFBTCxFQUFhO0FBQ2IsZ0JBQU0sa0JBQWtCLE9BQU8scUJBQVAsRUFBeEI7QUFDQSxnQkFBSSxNQUFNLFVBQVUsZ0JBQWdCLEdBQXBDO0FBQ0EsZ0JBQUksT0FBTyxVQUFVLGdCQUFnQixJQUFyQztBQUNBLG1CQUFhLEtBQUssTUFBTCxDQUFhLFlBQWIsRUFBYjtBQUNBLG9CQUFjLEtBQUssTUFBTCxDQUFhLGFBQWIsRUFBZDtBQUNBLG1CQUFPLEVBQUUsS0FBSyxHQUFQLEVBQVksTUFBTSxJQUFsQixFQUFQO0FBQ0g7Ozs7OztBQUdFLElBQU0sa0NBQWEsSUFBSSxVQUFKLEVBQW5CIiwiZmlsZSI6ImxpYi9mZWF0dXJlcy9sb29rdXAuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBPYnNlcnZhYmxlIH0gZnJvbSBcInJ4anNcIjtcbmltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUsIERpc3Bvc2FibGUgfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xuaW1wb3J0IHsgT21uaSB9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xuaW1wb3J0IHsgVG9vbHRpcFZpZXcgfSBmcm9tIFwiLi4vdmlld3MvdG9vbHRpcC12aWV3XCI7XG5jb25zdCAkID0gcmVxdWlyZShcImpxdWVyeVwiKTtcbmNvbnN0IGVzY2FwZSA9IHJlcXVpcmUoXCJlc2NhcGUtaHRtbFwiKTtcbmNsYXNzIFR5cGVMb29rdXAge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLnJlcXVpcmVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMudGl0bGUgPSBcIlRvb2x0aXAgTG9va3VwXCI7XG4gICAgICAgIHRoaXMuZGVzY3JpcHRpb24gPSBcIkFkZHMgaG92ZXIgdG9vbHRpcHMgdG8gdGhlIGVkaXRvciwgYWxzbyBoYXMgYSBrZXliaW5kXCI7XG4gICAgfVxuICAgIGFjdGl2YXRlKCkge1xuICAgICAgICBsZXQgdG9vbHRpcDtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLnN3aXRjaEFjdGl2ZUVkaXRvcigoZWRpdG9yLCBjZCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgZWRpdG9yVmlldyA9ICQoYXRvbS52aWV3cy5nZXRWaWV3KGVkaXRvcikpO1xuICAgICAgICAgICAgdG9vbHRpcCA9IG5ldyBUb29sdGlwKGVkaXRvclZpZXcsIGVkaXRvcik7XG4gICAgICAgICAgICBjZC5hZGQodG9vbHRpcCk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmFkZFRleHRFZGl0b3JDb21tYW5kKFwib21uaXNoYXJwLWF0b206dHlwZS1sb29rdXBcIiwgKCkgPT4ge1xuICAgICAgICAgICAgT21uaS5hY3RpdmVFZGl0b3IuZmlyc3QoKS5zdWJzY3JpYmUoZWRpdG9yID0+IHtcbiAgICAgICAgICAgICAgICB0b29sdGlwLnNob3dFeHByZXNzaW9uVHlwZU9uQ29tbWFuZCgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pKTtcbiAgICB9XG4gICAgZGlzcG9zZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICB9XG59XG5jbGFzcyBUb29sdGlwIHtcbiAgICBjb25zdHJ1Y3RvcihlZGl0b3JWaWV3LCBlZGl0b3IpIHtcbiAgICAgICAgdGhpcy5lZGl0b3JWaWV3ID0gZWRpdG9yVmlldztcbiAgICAgICAgdGhpcy5lZGl0b3IgPSBlZGl0b3I7XG4gICAgICAgIHRoaXMuZXhwclR5cGVUb29sdGlwID0gbnVsbDtcbiAgICAgICAgdGhpcy5yYXdWaWV3ID0gZWRpdG9yVmlld1swXTtcbiAgICAgICAgY29uc3QgY2QgPSB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICBjb25zdCBzY3JvbGwgPSB0aGlzLmdldEZyb21TaGFkb3dEb20oZWRpdG9yVmlldywgXCIuc2Nyb2xsLXZpZXdcIik7XG4gICAgICAgIGlmICghc2Nyb2xsWzBdKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBsZXQgbGFzdEV4cHJUeXBlQnVmZmVyUHQ7XG4gICAgICAgIGNvbnN0IG1vdXNlbW92ZSA9IE9ic2VydmFibGUuZnJvbUV2ZW50KHNjcm9sbFswXSwgXCJtb3VzZW1vdmVcIik7XG4gICAgICAgIGNvbnN0IG1vdXNlb3V0ID0gT2JzZXJ2YWJsZS5mcm9tRXZlbnQoc2Nyb2xsWzBdLCBcIm1vdXNlb3V0XCIpO1xuICAgICAgICB0aGlzLmtleWRvd24gPSBPYnNlcnZhYmxlLmZyb21FdmVudChzY3JvbGxbMF0sIFwia2V5ZG93blwiKTtcbiAgICAgICAgY2QuYWRkKG1vdXNlbW92ZVxuICAgICAgICAgICAgLmF1ZGl0VGltZSgyMDApXG4gICAgICAgICAgICAubWFwKGV2ZW50ID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHBpeGVsUHQgPSB0aGlzLnBpeGVsUG9zaXRpb25Gcm9tTW91c2VFdmVudChlZGl0b3JWaWV3LCBldmVudCk7XG4gICAgICAgICAgICBpZiAoIXBpeGVsUHQpXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgY29uc3Qgc2NyZWVuUHQgPSBlZGl0b3Iuc2NyZWVuUG9zaXRpb25Gb3JQaXhlbFBvc2l0aW9uKHBpeGVsUHQpO1xuICAgICAgICAgICAgY29uc3QgYnVmZmVyUHQgPSBlZGl0b3IuYnVmZmVyUG9zaXRpb25Gb3JTY3JlZW5Qb3NpdGlvbihzY3JlZW5QdCk7XG4gICAgICAgICAgICBpZiAobGFzdEV4cHJUeXBlQnVmZmVyUHQgJiYgbGFzdEV4cHJUeXBlQnVmZmVyUHQuaXNFcXVhbChidWZmZXJQdCkgJiYgdGhpcy5leHByVHlwZVRvb2x0aXApXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgbGFzdEV4cHJUeXBlQnVmZmVyUHQgPSBidWZmZXJQdDtcbiAgICAgICAgICAgIHJldHVybiB7IGJ1ZmZlclB0LCBldmVudCB9O1xuICAgICAgICB9KVxuICAgICAgICAgICAgLmZpbHRlcih6ID0+ICEheilcbiAgICAgICAgICAgIC5kbygoKSA9PiB0aGlzLmhpZGVFeHByZXNzaW9uVHlwZSgpKVxuICAgICAgICAgICAgLmZpbHRlcih4ID0+IHRoaXMuY2hlY2tQb3NpdGlvbih4LmJ1ZmZlclB0KSlcbiAgICAgICAgICAgIC5kbygoKSA9PiB0aGlzLnN1YmNyaWJlS2V5RG93bigpKVxuICAgICAgICAgICAgLnN1YnNjcmliZSgoeyBidWZmZXJQdCwgZXZlbnQgfSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5zaG93RXhwcmVzc2lvblR5cGVPbk1vdXNlT3ZlcihldmVudCwgYnVmZmVyUHQpO1xuICAgICAgICB9KSk7XG4gICAgICAgIGNkLmFkZChtb3VzZW91dC5zdWJzY3JpYmUoKGUpID0+IHRoaXMuaGlkZUV4cHJlc3Npb25UeXBlKCkpKTtcbiAgICAgICAgY2QuYWRkKE9tbmkuc3dpdGNoQWN0aXZlRWRpdG9yKChlZGl0LCBpbm5lckNkKSA9PiB7XG4gICAgICAgICAgICBpbm5lckNkLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB0aGlzLmhpZGVFeHByZXNzaW9uVHlwZSgpKSk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgY2QuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuaGlkZUV4cHJlc3Npb25UeXBlKCk7XG4gICAgICAgIH0pKTtcbiAgICB9XG4gICAgc3ViY3JpYmVLZXlEb3duKCkge1xuICAgICAgICB0aGlzLmtleWRvd25TdWJzY3JpcHRpb24gPSB0aGlzLmtleWRvd24uc3Vic2NyaWJlKChlKSA9PiB0aGlzLmhpZGVFeHByZXNzaW9uVHlwZSgpKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZCh0aGlzLmtleWRvd25TdWJzY3JpcHRpb24pO1xuICAgIH1cbiAgICBzaG93RXhwcmVzc2lvblR5cGVPbkNvbW1hbmQoKSB7XG4gICAgICAgIGlmICh0aGlzLmVkaXRvci5jdXJzb3JzLmxlbmd0aCA8IDEpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNvbnN0IGJ1ZmZlclB0ID0gdGhpcy5lZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKTtcbiAgICAgICAgaWYgKCF0aGlzLmNoZWNrUG9zaXRpb24oYnVmZmVyUHQpKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zdCBvZmZzZXQgPSAodGhpcy5yYXdWaWV3LmNvbXBvbmVudC5nZXRGb250U2l6ZSgpICogYnVmZmVyUHQuY29sdW1uKSAqIDAuNztcbiAgICAgICAgY29uc3Qgc2hhZG93ID0gdGhpcy5nZXRGcm9tU2hhZG93RG9tKHRoaXMuZWRpdG9yVmlldywgXCIuY3Vyc29yLWxpbmVcIilbMF07XG4gICAgICAgIGlmICghc2hhZG93KVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zdCByZWN0ID0gc2hhZG93LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICBjb25zdCB0b29sdGlwUmVjdCA9IHtcbiAgICAgICAgICAgIGxlZnQ6IHJlY3QubGVmdCAtIG9mZnNldCxcbiAgICAgICAgICAgIHJpZ2h0OiByZWN0LmxlZnQgKyBvZmZzZXQsXG4gICAgICAgICAgICB0b3A6IHJlY3QuYm90dG9tLFxuICAgICAgICAgICAgYm90dG9tOiByZWN0LmJvdHRvbVxuICAgICAgICB9O1xuICAgICAgICB0aGlzLmhpZGVFeHByZXNzaW9uVHlwZSgpO1xuICAgICAgICB0aGlzLnN1YmNyaWJlS2V5RG93bigpO1xuICAgICAgICB0aGlzLnNob3dUb29sVGlwKGJ1ZmZlclB0LCB0b29sdGlwUmVjdCk7XG4gICAgfVxuICAgIHNob3dFeHByZXNzaW9uVHlwZU9uTW91c2VPdmVyKGUsIGJ1ZmZlclB0KSB7XG4gICAgICAgIGlmICghT21uaS5pc09uKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuZXhwclR5cGVUb29sdGlwKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zdCBvZmZzZXQgPSB0aGlzLmVkaXRvci5nZXRMaW5lSGVpZ2h0SW5QaXhlbHMoKSAqIDAuNztcbiAgICAgICAgY29uc3QgdG9vbHRpcFJlY3QgPSB7XG4gICAgICAgICAgICBsZWZ0OiBlLmNsaWVudFgsXG4gICAgICAgICAgICByaWdodDogZS5jbGllbnRYLFxuICAgICAgICAgICAgdG9wOiBlLmNsaWVudFkgLSBvZmZzZXQsXG4gICAgICAgICAgICBib3R0b206IGUuY2xpZW50WSArIG9mZnNldFxuICAgICAgICB9O1xuICAgICAgICB0aGlzLnNob3dUb29sVGlwKGJ1ZmZlclB0LCB0b29sdGlwUmVjdCk7XG4gICAgfVxuICAgIGNoZWNrUG9zaXRpb24oYnVmZmVyUHQpIHtcbiAgICAgICAgY29uc3QgY3VyQ2hhclBpeGVsUHQgPSB0aGlzLnJhd1ZpZXcucGl4ZWxQb3NpdGlvbkZvckJ1ZmZlclBvc2l0aW9uKFtidWZmZXJQdC5yb3csIGJ1ZmZlclB0LmNvbHVtbl0pO1xuICAgICAgICBjb25zdCBuZXh0Q2hhclBpeGVsUHQgPSB0aGlzLnJhd1ZpZXcucGl4ZWxQb3NpdGlvbkZvckJ1ZmZlclBvc2l0aW9uKFtidWZmZXJQdC5yb3csIGJ1ZmZlclB0LmNvbHVtbiArIDFdKTtcbiAgICAgICAgaWYgKGN1ckNoYXJQaXhlbFB0LmxlZnQgPj0gbmV4dENoYXJQaXhlbFB0LmxlZnQpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHNob3dUb29sVGlwKGJ1ZmZlclB0LCB0b29sdGlwUmVjdCkge1xuICAgICAgICB0aGlzLmV4cHJUeXBlVG9vbHRpcCA9IG5ldyBUb29sdGlwVmlldyh0b29sdGlwUmVjdCk7XG4gICAgICAgIE9tbmkucmVxdWVzdChzb2x1dGlvbiA9PiBzb2x1dGlvbi50eXBlbG9va3VwKHtcbiAgICAgICAgICAgIEluY2x1ZGVEb2N1bWVudGF0aW9uOiB0cnVlLFxuICAgICAgICAgICAgTGluZTogYnVmZmVyUHQucm93LFxuICAgICAgICAgICAgQ29sdW1uOiBidWZmZXJQdC5jb2x1bW5cbiAgICAgICAgfSkpLnN1YnNjcmliZSgocmVzcG9uc2UpID0+IHtcbiAgICAgICAgICAgIGlmIChyZXNwb25zZS5UeXBlID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IG1lc3NhZ2UgPSBgPGI+JHtlc2NhcGUocmVzcG9uc2UuVHlwZSl9PC9iPmA7XG4gICAgICAgICAgICBpZiAocmVzcG9uc2UuRG9jdW1lbnRhdGlvbikge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSBtZXNzYWdlICsgYDxici8+PGk+JHtlc2NhcGUocmVzcG9uc2UuRG9jdW1lbnRhdGlvbil9PC9pPmA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5leHByVHlwZVRvb2x0aXApIHtcbiAgICAgICAgICAgICAgICB0aGlzLmV4cHJUeXBlVG9vbHRpcC51cGRhdGVUZXh0KG1lc3NhZ2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG4gICAgZGlzcG9zZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICB9XG4gICAgaGlkZUV4cHJlc3Npb25UeXBlKCkge1xuICAgICAgICBpZiAoIXRoaXMuZXhwclR5cGVUb29sdGlwKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB0aGlzLmV4cHJUeXBlVG9vbHRpcC5yZW1vdmUoKTtcbiAgICAgICAgdGhpcy5leHByVHlwZVRvb2x0aXAgPSBudWxsO1xuICAgICAgICBpZiAodGhpcy5rZXlkb3duU3Vic2NyaXB0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUucmVtb3ZlKHRoaXMua2V5ZG93blN1YnNjcmlwdGlvbik7XG4gICAgICAgICAgICB0aGlzLmtleWRvd25TdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICAgICAgICAgIHRoaXMua2V5ZG93blN1YnNjcmlwdGlvbiA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZ2V0RnJvbVNoYWRvd0RvbShlbGVtZW50LCBzZWxlY3Rvcikge1xuICAgICAgICBjb25zdCBlbCA9IGVsZW1lbnRbMF07XG4gICAgICAgIGlmICghZWwucm9vdEVsZW1lbnQpXG4gICAgICAgICAgICByZXR1cm4gJChlbCk7XG4gICAgICAgIGNvbnN0IGZvdW5kID0gZWwucm9vdEVsZW1lbnQucXVlcnlTZWxlY3RvckFsbChzZWxlY3Rvcik7XG4gICAgICAgIHJldHVybiAkKGZvdW5kWzBdKTtcbiAgICB9XG4gICAgcGl4ZWxQb3NpdGlvbkZyb21Nb3VzZUV2ZW50KGVkaXRvclZpZXcsIGV2ZW50KSB7XG4gICAgICAgIGNvbnN0IGNsaWVudFggPSBldmVudC5jbGllbnRYLCBjbGllbnRZID0gZXZlbnQuY2xpZW50WTtcbiAgICAgICAgY29uc3Qgc2hhZG93ID0gdGhpcy5nZXRGcm9tU2hhZG93RG9tKGVkaXRvclZpZXcsIFwiLmxpbmVzXCIpWzBdO1xuICAgICAgICBpZiAoIXNoYWRvdylcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3QgbGluZXNDbGllbnRSZWN0ID0gc2hhZG93LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICBsZXQgdG9wID0gY2xpZW50WSAtIGxpbmVzQ2xpZW50UmVjdC50b3A7XG4gICAgICAgIGxldCBsZWZ0ID0gY2xpZW50WCAtIGxpbmVzQ2xpZW50UmVjdC5sZWZ0O1xuICAgICAgICB0b3AgKz0gdGhpcy5lZGl0b3IuZ2V0U2Nyb2xsVG9wKCk7XG4gICAgICAgIGxlZnQgKz0gdGhpcy5lZGl0b3IuZ2V0U2Nyb2xsTGVmdCgpO1xuICAgICAgICByZXR1cm4geyB0b3A6IHRvcCwgbGVmdDogbGVmdCB9O1xuICAgIH1cbn1cbmV4cG9ydCBjb25zdCB0eXBlTG9va3VwID0gbmV3IFR5cGVMb29rdXA7XG4iLCIvLyBJbnNwaXJhdGlvbiA6IGh0dHBzOi8vYXRvbS5pby9wYWNrYWdlcy9pZGUtaGFza2VsbFxyXG4vLyBhbmQgaHR0cHM6Ly9hdG9tLmlvL3BhY2thZ2VzL2lkZS1mbG93XHJcbi8vIGh0dHBzOi8vYXRvbS5pby9wYWNrYWdlcy9hdG9tLXR5cGVzY3JpcHRcclxuaW1wb3J0IHtNb2RlbHN9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XHJcbmltcG9ydCB7T2JzZXJ2YWJsZSwgU3Vic2NyaXB0aW9ufSBmcm9tIFwicnhqc1wiO1xyXG5pbXBvcnQge0NvbXBvc2l0ZURpc3Bvc2FibGUsIERpc3Bvc2FibGUsIElEaXNwb3NhYmxlfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xyXG5pbXBvcnQge09tbml9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xyXG5pbXBvcnQge1Rvb2x0aXBWaWV3fSBmcm9tIFwiLi4vdmlld3MvdG9vbHRpcC12aWV3XCI7XHJcbmNvbnN0ICQ6IEpRdWVyeVN0YXRpYyA9IHJlcXVpcmUoXCJqcXVlcnlcIik7XHJcbmNvbnN0IGVzY2FwZSA9IHJlcXVpcmUoXCJlc2NhcGUtaHRtbFwiKTtcclxuXHJcbmNsYXNzIFR5cGVMb29rdXAgaW1wbGVtZW50cyBJRmVhdHVyZSB7XHJcbiAgICBwcml2YXRlIGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XHJcblxyXG4gICAgcHVibGljIGFjdGl2YXRlKCkge1xyXG4gICAgICAgIGxldCB0b29sdGlwOiBUb29sdGlwO1xyXG4gICAgICAgIC8qIHRzbGludDpkaXNhYmxlOm5vLXN0cmluZy1saXRlcmFsICovXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuc3dpdGNoQWN0aXZlRWRpdG9yKChlZGl0b3IsIGNkKSA9PiB7XHJcbiAgICAgICAgICAgIC8vIHN1YnNjcmliZSBmb3IgdG9vbHRpcHNcclxuICAgICAgICAgICAgLy8gaW5zcGlyYXRpb24gOiBodHRwczovL2dpdGh1Yi5jb20vY2hhaWthMjAxMy9pZGUtaGFza2VsbFxyXG4gICAgICAgICAgICBjb25zdCBlZGl0b3JWaWV3ID0gJChhdG9tLnZpZXdzLmdldFZpZXcoZWRpdG9yKSk7XHJcbiAgICAgICAgICAgIHRvb2x0aXAgPSBuZXcgVG9vbHRpcChlZGl0b3JWaWV3LCBlZGl0b3IpO1xyXG4gICAgICAgICAgICBjZC5hZGQodG9vbHRpcCk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuYWRkVGV4dEVkaXRvckNvbW1hbmQoXCJvbW5pc2hhcnAtYXRvbTp0eXBlLWxvb2t1cFwiLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIE9tbmkuYWN0aXZlRWRpdG9yLmZpcnN0KCkuc3Vic2NyaWJlKGVkaXRvciA9PiB7XHJcbiAgICAgICAgICAgICAgICB0b29sdGlwLnNob3dFeHByZXNzaW9uVHlwZU9uQ29tbWFuZCgpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KSk7XHJcbiAgICAgICAgLyogdHNsaW50OmVuYWJsZTpuby1zdHJpbmctbGl0ZXJhbCAqL1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkaXNwb3NlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlcXVpcmVkID0gZmFsc2U7XHJcbiAgICBwdWJsaWMgdGl0bGUgPSBcIlRvb2x0aXAgTG9va3VwXCI7XHJcbiAgICBwdWJsaWMgZGVzY3JpcHRpb24gPSBcIkFkZHMgaG92ZXIgdG9vbHRpcHMgdG8gdGhlIGVkaXRvciwgYWxzbyBoYXMgYSBrZXliaW5kXCI7XHJcbn1cclxuXHJcbmNsYXNzIFRvb2x0aXAgaW1wbGVtZW50cyBJRGlzcG9zYWJsZSB7XHJcbiAgICBwcml2YXRlIGV4cHJUeXBlVG9vbHRpcDogVG9vbHRpcFZpZXcgPSBudWxsO1xyXG4gICAgcHJpdmF0ZSBrZXlkb3duOiBPYnNlcnZhYmxlPEtleWJvYXJkRXZlbnQ+O1xyXG4gICAgcHJpdmF0ZSBrZXlkb3duU3Vic2NyaXB0aW9uOiBTdWJzY3JpcHRpb247XHJcbiAgICBwcml2YXRlIHJhd1ZpZXc6IGFueTtcclxuICAgIHByaXZhdGUgZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIGVkaXRvclZpZXc6IEpRdWVyeSwgcHJpdmF0ZSBlZGl0b3I6IEF0b20uVGV4dEVkaXRvcikge1xyXG4gICAgICAgIHRoaXMucmF3VmlldyA9IGVkaXRvclZpZXdbMF07XHJcblxyXG4gICAgICAgIGNvbnN0IGNkID0gdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuXHJcbiAgICAgICAgY29uc3Qgc2Nyb2xsID0gdGhpcy5nZXRGcm9tU2hhZG93RG9tKGVkaXRvclZpZXcsIFwiLnNjcm9sbC12aWV3XCIpO1xyXG4gICAgICAgIGlmICghc2Nyb2xsWzBdKSByZXR1cm47XHJcblxyXG4gICAgICAgIC8vIHRvIGRlYm91bmNlIG1vdXNlbW92ZSBldmVudFwicyBmaXJpbmcgZm9yIHNvbWUgcmVhc29uIG9uIHNvbWUgbWFjaGluZXNcclxuICAgICAgICBsZXQgbGFzdEV4cHJUeXBlQnVmZmVyUHQ6IGFueTtcclxuXHJcbiAgICAgICAgY29uc3QgbW91c2Vtb3ZlID0gT2JzZXJ2YWJsZS5mcm9tRXZlbnQ8TW91c2VFdmVudD4oc2Nyb2xsWzBdLCBcIm1vdXNlbW92ZVwiKTtcclxuICAgICAgICBjb25zdCBtb3VzZW91dCA9IE9ic2VydmFibGUuZnJvbUV2ZW50PE1vdXNlRXZlbnQ+KHNjcm9sbFswXSwgXCJtb3VzZW91dFwiKTtcclxuICAgICAgICB0aGlzLmtleWRvd24gPSBPYnNlcnZhYmxlLmZyb21FdmVudDxLZXlib2FyZEV2ZW50PihzY3JvbGxbMF0sIFwia2V5ZG93blwiKTtcclxuXHJcbiAgICAgICAgY2QuYWRkKG1vdXNlbW92ZVxyXG4gICAgICAgICAgICAuYXVkaXRUaW1lKDIwMClcclxuICAgICAgICAgICAgLm1hcChldmVudCA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBwaXhlbFB0ID0gdGhpcy5waXhlbFBvc2l0aW9uRnJvbU1vdXNlRXZlbnQoZWRpdG9yVmlldywgZXZlbnQpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFwaXhlbFB0KVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHNjcmVlblB0ID0gZWRpdG9yLnNjcmVlblBvc2l0aW9uRm9yUGl4ZWxQb3NpdGlvbihwaXhlbFB0KTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGJ1ZmZlclB0ID0gZWRpdG9yLmJ1ZmZlclBvc2l0aW9uRm9yU2NyZWVuUG9zaXRpb24oc2NyZWVuUHQpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGxhc3RFeHByVHlwZUJ1ZmZlclB0ICYmIGxhc3RFeHByVHlwZUJ1ZmZlclB0LmlzRXF1YWwoYnVmZmVyUHQpICYmIHRoaXMuZXhwclR5cGVUb29sdGlwKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgICAgICAgICBsYXN0RXhwclR5cGVCdWZmZXJQdCA9IGJ1ZmZlclB0O1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgYnVmZmVyUHQsIGV2ZW50IH07XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC5maWx0ZXIoeiA9PiAhIXopXHJcbiAgICAgICAgICAgIC5kbygoKSA9PiB0aGlzLmhpZGVFeHByZXNzaW9uVHlwZSgpKVxyXG4gICAgICAgICAgICAuZmlsdGVyKHggPT4gdGhpcy5jaGVja1Bvc2l0aW9uKHguYnVmZmVyUHQpKVxyXG4gICAgICAgICAgICAuZG8oKCkgPT4gdGhpcy5zdWJjcmliZUtleURvd24oKSlcclxuICAgICAgICAgICAgLnN1YnNjcmliZSgoe2J1ZmZlclB0LCBldmVudH0pID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2hvd0V4cHJlc3Npb25UeXBlT25Nb3VzZU92ZXIoZXZlbnQsIGJ1ZmZlclB0KTtcclxuICAgICAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICBjZC5hZGQobW91c2VvdXQuc3Vic2NyaWJlKChlKSA9PiB0aGlzLmhpZGVFeHByZXNzaW9uVHlwZSgpKSk7XHJcblxyXG4gICAgICAgIGNkLmFkZChPbW5pLnN3aXRjaEFjdGl2ZUVkaXRvcigoZWRpdCwgaW5uZXJDZCkgPT4ge1xyXG4gICAgICAgICAgICBpbm5lckNkLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB0aGlzLmhpZGVFeHByZXNzaW9uVHlwZSgpKSk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICBjZC5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLmhpZGVFeHByZXNzaW9uVHlwZSgpO1xyXG4gICAgICAgIH0pKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHN1YmNyaWJlS2V5RG93bigpIHtcclxuICAgICAgICB0aGlzLmtleWRvd25TdWJzY3JpcHRpb24gPSB0aGlzLmtleWRvd24uc3Vic2NyaWJlKChlKSA9PiB0aGlzLmhpZGVFeHByZXNzaW9uVHlwZSgpKTtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKHRoaXMua2V5ZG93blN1YnNjcmlwdGlvbik7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHNob3dFeHByZXNzaW9uVHlwZU9uQ29tbWFuZCgpIHtcclxuICAgICAgICBpZiAodGhpcy5lZGl0b3IuY3Vyc29ycy5sZW5ndGggPCAxKSByZXR1cm47XHJcblxyXG4gICAgICAgIGNvbnN0IGJ1ZmZlclB0ID0gdGhpcy5lZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKTtcclxuXHJcbiAgICAgICAgaWYgKCF0aGlzLmNoZWNrUG9zaXRpb24oYnVmZmVyUHQpKSByZXR1cm47XHJcblxyXG4gICAgICAgIC8vIGZpbmQgb3V0IHNob3cgcG9zaXRpb25cclxuICAgICAgICBjb25zdCBvZmZzZXQgPSAodGhpcy5yYXdWaWV3LmNvbXBvbmVudC5nZXRGb250U2l6ZSgpICogYnVmZmVyUHQuY29sdW1uKSAqIDAuNztcclxuICAgICAgICBjb25zdCBzaGFkb3cgPSB0aGlzLmdldEZyb21TaGFkb3dEb20odGhpcy5lZGl0b3JWaWV3LCBcIi5jdXJzb3ItbGluZVwiKVswXTtcclxuICAgICAgICBpZiAoIXNoYWRvdykgcmV0dXJuO1xyXG4gICAgICAgIGNvbnN0IHJlY3QgPSBzaGFkb3cuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XHJcblxyXG4gICAgICAgIGNvbnN0IHRvb2x0aXBSZWN0ID0ge1xyXG4gICAgICAgICAgICBsZWZ0OiByZWN0LmxlZnQgLSBvZmZzZXQsXHJcbiAgICAgICAgICAgIHJpZ2h0OiByZWN0LmxlZnQgKyBvZmZzZXQsXHJcbiAgICAgICAgICAgIHRvcDogcmVjdC5ib3R0b20sXHJcbiAgICAgICAgICAgIGJvdHRvbTogcmVjdC5ib3R0b21cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLmhpZGVFeHByZXNzaW9uVHlwZSgpO1xyXG4gICAgICAgIHRoaXMuc3ViY3JpYmVLZXlEb3duKCk7XHJcbiAgICAgICAgdGhpcy5zaG93VG9vbFRpcChidWZmZXJQdCwgdG9vbHRpcFJlY3QpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgc2hvd0V4cHJlc3Npb25UeXBlT25Nb3VzZU92ZXIoZTogTW91c2VFdmVudCwgYnVmZmVyUHQ6IFRleHRCdWZmZXIuUG9pbnQpIHtcclxuICAgICAgICBpZiAoIU9tbmkuaXNPbikge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBJZiB3ZSBhcmUgYWxyZWFkeSBzaG93aW5nIHdlIHNob3VsZCB3YWl0IGZvciB0aGF0IHRvIGNsZWFyXHJcbiAgICAgICAgaWYgKHRoaXMuZXhwclR5cGVUb29sdGlwKSByZXR1cm47XHJcblxyXG4gICAgICAgIC8vIGZpbmQgb3V0IHNob3cgcG9zaXRpb25cclxuICAgICAgICBjb25zdCBvZmZzZXQgPSAoPGFueT50aGlzLmVkaXRvcikuZ2V0TGluZUhlaWdodEluUGl4ZWxzKCkgKiAwLjc7XHJcbiAgICAgICAgY29uc3QgdG9vbHRpcFJlY3QgPSB7XHJcbiAgICAgICAgICAgIGxlZnQ6IGUuY2xpZW50WCxcclxuICAgICAgICAgICAgcmlnaHQ6IGUuY2xpZW50WCxcclxuICAgICAgICAgICAgdG9wOiBlLmNsaWVudFkgLSBvZmZzZXQsXHJcbiAgICAgICAgICAgIGJvdHRvbTogZS5jbGllbnRZICsgb2Zmc2V0XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5zaG93VG9vbFRpcChidWZmZXJQdCwgdG9vbHRpcFJlY3QpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgY2hlY2tQb3NpdGlvbihidWZmZXJQdDogVGV4dEJ1ZmZlci5Qb2ludCkge1xyXG4gICAgICAgIGNvbnN0IGN1ckNoYXJQaXhlbFB0ID0gdGhpcy5yYXdWaWV3LnBpeGVsUG9zaXRpb25Gb3JCdWZmZXJQb3NpdGlvbihbYnVmZmVyUHQucm93LCBidWZmZXJQdC5jb2x1bW5dKTtcclxuICAgICAgICBjb25zdCBuZXh0Q2hhclBpeGVsUHQgPSB0aGlzLnJhd1ZpZXcucGl4ZWxQb3NpdGlvbkZvckJ1ZmZlclBvc2l0aW9uKFtidWZmZXJQdC5yb3csIGJ1ZmZlclB0LmNvbHVtbiArIDFdKTtcclxuXHJcbiAgICAgICAgaWYgKGN1ckNoYXJQaXhlbFB0LmxlZnQgPj0gbmV4dENoYXJQaXhlbFB0LmxlZnQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHNob3dUb29sVGlwKGJ1ZmZlclB0OiBUZXh0QnVmZmVyLlBvaW50LCB0b29sdGlwUmVjdDogYW55KSB7XHJcbiAgICAgICAgdGhpcy5leHByVHlwZVRvb2x0aXAgPSBuZXcgVG9vbHRpcFZpZXcodG9vbHRpcFJlY3QpO1xyXG5cclxuICAgICAgICAvLyBBY3R1YWxseSBtYWtlIHRoZSBwcm9ncmFtIG1hbmFnZXIgcXVlcnlcclxuICAgICAgICBPbW5pLnJlcXVlc3Qoc29sdXRpb24gPT4gc29sdXRpb24udHlwZWxvb2t1cCh7XHJcbiAgICAgICAgICAgIEluY2x1ZGVEb2N1bWVudGF0aW9uOiB0cnVlLFxyXG4gICAgICAgICAgICBMaW5lOiBidWZmZXJQdC5yb3csXHJcbiAgICAgICAgICAgIENvbHVtbjogYnVmZmVyUHQuY29sdW1uXHJcbiAgICAgICAgfSkpLnN1YnNjcmliZSgocmVzcG9uc2U6IE1vZGVscy5UeXBlTG9va3VwUmVzcG9uc2UpID0+IHtcclxuICAgICAgICAgICAgaWYgKHJlc3BvbnNlLlR5cGUgPT09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBsZXQgbWVzc2FnZSA9IGA8Yj4ke2VzY2FwZShyZXNwb25zZS5UeXBlKX08L2I+YDtcclxuICAgICAgICAgICAgaWYgKHJlc3BvbnNlLkRvY3VtZW50YXRpb24pIHtcclxuICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSBtZXNzYWdlICsgYDxici8+PGk+JHtlc2NhcGUocmVzcG9uc2UuRG9jdW1lbnRhdGlvbil9PC9pPmA7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gU29ycnkgYWJvdXQgdGhpcyBcImlmXCIuIEl0XCJzIGluIHRoZSBjb2RlIEkgY29waWVkIHNvIEkgZ3Vlc3MgaXRzIHRoZXJlIGZvciBhIHJlYXNvblxyXG4gICAgICAgICAgICBpZiAodGhpcy5leHByVHlwZVRvb2x0aXApIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZXhwclR5cGVUb29sdGlwLnVwZGF0ZVRleHQobWVzc2FnZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGlzcG9zZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgaGlkZUV4cHJlc3Npb25UeXBlKCkge1xyXG4gICAgICAgIGlmICghdGhpcy5leHByVHlwZVRvb2x0aXApIHJldHVybjtcclxuICAgICAgICB0aGlzLmV4cHJUeXBlVG9vbHRpcC5yZW1vdmUoKTtcclxuICAgICAgICB0aGlzLmV4cHJUeXBlVG9vbHRpcCA9IG51bGw7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmtleWRvd25TdWJzY3JpcHRpb24pIHtcclxuICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLnJlbW92ZSh0aGlzLmtleWRvd25TdWJzY3JpcHRpb24pO1xyXG4gICAgICAgICAgICB0aGlzLmtleWRvd25TdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcclxuICAgICAgICAgICAgdGhpcy5rZXlkb3duU3Vic2NyaXB0aW9uID0gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBnZXRGcm9tU2hhZG93RG9tKGVsZW1lbnQ6IEpRdWVyeSwgc2VsZWN0b3I6IHN0cmluZyk6IEpRdWVyeSB7XHJcbiAgICAgICAgY29uc3QgZWwgPSBlbGVtZW50WzBdO1xyXG4gICAgICAgIGlmICghKDxhbnk+ZWwpLnJvb3RFbGVtZW50KSByZXR1cm4gJChlbCk7XHJcblxyXG4gICAgICAgIGNvbnN0IGZvdW5kID0gKDxhbnk+ZWwpLnJvb3RFbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpO1xyXG4gICAgICAgIHJldHVybiAkKGZvdW5kWzBdKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHBpeGVsUG9zaXRpb25Gcm9tTW91c2VFdmVudChlZGl0b3JWaWV3OiBhbnksIGV2ZW50OiBNb3VzZUV2ZW50KSB7XHJcbiAgICAgICAgY29uc3QgY2xpZW50WCA9IGV2ZW50LmNsaWVudFgsIGNsaWVudFkgPSBldmVudC5jbGllbnRZO1xyXG4gICAgICAgIGNvbnN0IHNoYWRvdyA9IHRoaXMuZ2V0RnJvbVNoYWRvd0RvbShlZGl0b3JWaWV3LCBcIi5saW5lc1wiKVswXTtcclxuICAgICAgICBpZiAoIXNoYWRvdykgcmV0dXJuO1xyXG4gICAgICAgIGNvbnN0IGxpbmVzQ2xpZW50UmVjdCA9IHNoYWRvdy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcclxuICAgICAgICBsZXQgdG9wID0gY2xpZW50WSAtIGxpbmVzQ2xpZW50UmVjdC50b3A7XHJcbiAgICAgICAgbGV0IGxlZnQgPSBjbGllbnRYIC0gbGluZXNDbGllbnRSZWN0LmxlZnQ7XHJcbiAgICAgICAgdG9wICs9ICg8YW55PnRoaXMuZWRpdG9yKS5nZXRTY3JvbGxUb3AoKTtcclxuICAgICAgICBsZWZ0ICs9ICg8YW55PnRoaXMuZWRpdG9yKS5nZXRTY3JvbGxMZWZ0KCk7XHJcbiAgICAgICAgcmV0dXJuIHsgdG9wOiB0b3AsIGxlZnQ6IGxlZnQgfTtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IHR5cGVMb29rdXAgPSBuZXcgVHlwZUxvb2t1cDtcclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
