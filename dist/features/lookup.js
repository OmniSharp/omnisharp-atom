"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.typeLookup = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _rxjs = require("rxjs");

var _tsDisposables = require("ts-disposables");

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
            this.disposable = new _tsDisposables.CompositeDisposable();
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
        var cd = this.disposable = new _tsDisposables.CompositeDisposable();
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
            innerCd.add(_tsDisposables.Disposable.create(function () {
                return _this.hideExpressionType();
            }));
        }));
        cd.add(_tsDisposables.Disposable.create(function () {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9sb29rdXAuanMiLCJsaWIvZmVhdHVyZXMvbG9va3VwLnRzIl0sIm5hbWVzIjpbIiQiLCJyZXF1aXJlIiwiZXNjYXBlIiwiVHlwZUxvb2t1cCIsInJlcXVpcmVkIiwidGl0bGUiLCJkZXNjcmlwdGlvbiIsInRvb2x0aXAiLCJkaXNwb3NhYmxlIiwiYWRkIiwic3dpdGNoQWN0aXZlRWRpdG9yIiwiZWRpdG9yIiwiY2QiLCJlZGl0b3JWaWV3IiwiYXRvbSIsInZpZXdzIiwiZ2V0VmlldyIsIlRvb2x0aXAiLCJhZGRUZXh0RWRpdG9yQ29tbWFuZCIsImFjdGl2ZUVkaXRvciIsImZpcnN0Iiwic3Vic2NyaWJlIiwic2hvd0V4cHJlc3Npb25UeXBlT25Db21tYW5kIiwiZGlzcG9zZSIsImV4cHJUeXBlVG9vbHRpcCIsInJhd1ZpZXciLCJzY3JvbGwiLCJnZXRGcm9tU2hhZG93RG9tIiwibGFzdEV4cHJUeXBlQnVmZmVyUHQiLCJtb3VzZW1vdmUiLCJmcm9tRXZlbnQiLCJtb3VzZW91dCIsImtleWRvd24iLCJhdWRpdFRpbWUiLCJtYXAiLCJwaXhlbFB0IiwicGl4ZWxQb3NpdGlvbkZyb21Nb3VzZUV2ZW50IiwiZXZlbnQiLCJzY3JlZW5QdCIsInNjcmVlblBvc2l0aW9uRm9yUGl4ZWxQb3NpdGlvbiIsImJ1ZmZlclB0IiwiYnVmZmVyUG9zaXRpb25Gb3JTY3JlZW5Qb3NpdGlvbiIsImlzRXF1YWwiLCJmaWx0ZXIiLCJ6IiwiZG8iLCJoaWRlRXhwcmVzc2lvblR5cGUiLCJjaGVja1Bvc2l0aW9uIiwieCIsInN1YmNyaWJlS2V5RG93biIsInNob3dFeHByZXNzaW9uVHlwZU9uTW91c2VPdmVyIiwiZSIsImVkaXQiLCJpbm5lckNkIiwiY3JlYXRlIiwia2V5ZG93blN1YnNjcmlwdGlvbiIsImN1cnNvcnMiLCJsZW5ndGgiLCJnZXRDdXJzb3JCdWZmZXJQb3NpdGlvbiIsIm9mZnNldCIsImNvbXBvbmVudCIsImdldEZvbnRTaXplIiwiY29sdW1uIiwic2hhZG93IiwicmVjdCIsImdldEJvdW5kaW5nQ2xpZW50UmVjdCIsInRvb2x0aXBSZWN0IiwibGVmdCIsInJpZ2h0IiwidG9wIiwiYm90dG9tIiwic2hvd1Rvb2xUaXAiLCJpc09uIiwiZ2V0TGluZUhlaWdodEluUGl4ZWxzIiwiY2xpZW50WCIsImNsaWVudFkiLCJjdXJDaGFyUGl4ZWxQdCIsInBpeGVsUG9zaXRpb25Gb3JCdWZmZXJQb3NpdGlvbiIsInJvdyIsIm5leHRDaGFyUGl4ZWxQdCIsInJlcXVlc3QiLCJzb2x1dGlvbiIsInR5cGVsb29rdXAiLCJJbmNsdWRlRG9jdW1lbnRhdGlvbiIsIkxpbmUiLCJDb2x1bW4iLCJyZXNwb25zZSIsIlR5cGUiLCJtZXNzYWdlIiwiRG9jdW1lbnRhdGlvbiIsInVwZGF0ZVRleHQiLCJyZW1vdmUiLCJ1bnN1YnNjcmliZSIsImVsZW1lbnQiLCJzZWxlY3RvciIsImVsIiwicm9vdEVsZW1lbnQiLCJmb3VuZCIsInF1ZXJ5U2VsZWN0b3JBbGwiLCJsaW5lc0NsaWVudFJlY3QiLCJnZXRTY3JvbGxUb3AiLCJnZXRTY3JvbGxMZWZ0IiwidHlwZUxvb2t1cCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7QUNLQSxJQUFNQSxJQUFrQkMsUUFBUSxRQUFSLENBQXhCO0FBQ0EsSUFBTUMsU0FBU0QsUUFBUSxhQUFSLENBQWY7O0lBRUFFLFU7QUFBQSwwQkFBQTtBQUFBOztBQTJCVyxhQUFBQyxRQUFBLEdBQVcsS0FBWDtBQUNBLGFBQUFDLEtBQUEsR0FBUSxnQkFBUjtBQUNBLGFBQUFDLFdBQUEsR0FBYyx1REFBZDtBQUNWOzs7O21DQTNCa0I7QUFDWCxnQkFBSUMsZ0JBQUo7QUFFQSxpQkFBS0MsVUFBTCxHQUFrQix3Q0FBbEI7QUFDQSxpQkFBS0EsVUFBTCxDQUFnQkMsR0FBaEIsQ0FBb0IsV0FBS0Msa0JBQUwsQ0FBd0IsVUFBQ0MsTUFBRCxFQUFTQyxFQUFULEVBQVc7QUFHbkQsb0JBQU1DLGFBQWFiLEVBQUVjLEtB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USxDQUFSLENBQVg7QUFDQSxnQkFBSSxDQUFPRSxHQUFJQyxXQUFmLEVBQTRCLE9BQU9oRyxFQUFFK0YsRUFBRixDQUFQO0FBRTVCLGdCQUFNRSxRQUFjRixHQUFJQyxXQUFKLENBQWdCRSxnQkFBaEIsQ0FBaUNKLFFBQWpDLENBQXBCO0FBQ0EsbUJBQU85RixFQUFFaUcsTUFBTSxDQUFOLENBQUYsQ0FBUDtBQUNIOzs7b0RBRW1DcEYsVSxFQUFpQndCLEssRUFBaUI7QUFDbEUsZ0JBQU1xQyxVQUFVckMsTUFBTXFDLE9BQXRCO0FBQUEsZ0JBQStCQyxVQUFVdEMsTUFBTXNDLE9BQS9DO0FBQ0EsZ0JBQU1aLFNBQVMsS0FBS3BDLGdCQUFMLENBQXNCZCxVQUF0QixFQUFrQyxRQUFsQyxFQUE0QyxDQUE1QyxDQUFmO0FBQ0EsZ0JBQUksQ0FBQ2tELE1BQUwsRUFBYTtBQUNiLGdCQUFNb0Msa0JBQWtCcEMsT0FBT0UscUJBQVAsRUFBeEI7QUFDQSxnQkFBSUksTUFBTU0sVUFBVXdCLGdCQUFnQjlCLEdBQXBDO0FBQ0EsZ0JBQUlGLE9BQU9PLFVBQVV5QixnQkFBZ0JoQyxJQUFyQztBQUNBRSxtQkFBYSxLQUFLMUQsTUFBTCxDQUFheUYsWUFBYixFQUFiO0FBQ0FqQyxvQkFBYyxLQUFLeEQsTUFBTCxDQUFhMEYsYUFBYixFQUFkO0FBQ0EsbUJBQU8sRUFBRWhDLEtBQUtBLEdBQVAsRUFBWUYsTUFBTUEsSUFBbEIsRUFBUDtBQUNIOzs7Ozs7QUFHRSxJQUFNbUMsa0NBQWEsSUFBSW5HLFVBQUosRUFBbkIiLCJmaWxlIjoibGliL2ZlYXR1cmVzL2xvb2t1cC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE9ic2VydmFibGUgfSBmcm9tIFwicnhqc1wiO1xuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSwgRGlzcG9zYWJsZSB9IGZyb20gXCJ0cy1kaXNwb3NhYmxlc1wiO1xuaW1wb3J0IHsgT21uaSB9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xuaW1wb3J0IHsgVG9vbHRpcFZpZXcgfSBmcm9tIFwiLi4vdmlld3MvdG9vbHRpcC12aWV3XCI7XG5jb25zdCAkID0gcmVxdWlyZShcImpxdWVyeVwiKTtcbmNvbnN0IGVzY2FwZSA9IHJlcXVpcmUoXCJlc2NhcGUtaHRtbFwiKTtcbmNsYXNzIFR5cGVMb29rdXAge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLnJlcXVpcmVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMudGl0bGUgPSBcIlRvb2x0aXAgTG9va3VwXCI7XG4gICAgICAgIHRoaXMuZGVzY3JpcHRpb24gPSBcIkFkZHMgaG92ZXIgdG9vbHRpcHMgdG8gdGhlIGVkaXRvciwgYWxzbyBoYXMgYSBrZXliaW5kXCI7XG4gICAgfVxuICAgIGFjdGl2YXRlKCkge1xuICAgICAgICBsZXQgdG9vbHRpcDtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLnN3aXRjaEFjdGl2ZUVkaXRvcigoZWRpdG9yLCBjZCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgZWRpdG9yVmlldyA9ICQoYXRvbS52aWV3cy5nZXRWaWV3KGVkaXRvcikpO1xuICAgICAgICAgICAgdG9vbHRpcCA9IG5ldyBUb29sdGlwKGVkaXRvclZpZXcsIGVkaXRvcik7XG4gICAgICAgICAgICBjZC5hZGQodG9vbHRpcCk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmFkZFRleHRFZGl0b3JDb21tYW5kKFwib21uaXNoYXJwLWF0b206dHlwZS1sb29rdXBcIiwgKCkgPT4ge1xuICAgICAgICAgICAgT21uaS5hY3RpdmVFZGl0b3IuZmlyc3QoKS5zdWJzY3JpYmUoZWRpdG9yID0+IHtcbiAgICAgICAgICAgICAgICB0b29sdGlwLnNob3dFeHByZXNzaW9uVHlwZU9uQ29tbWFuZCgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pKTtcbiAgICB9XG4gICAgZGlzcG9zZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICB9XG59XG5jbGFzcyBUb29sdGlwIHtcbiAgICBjb25zdHJ1Y3RvcihlZGl0b3JWaWV3LCBlZGl0b3IpIHtcbiAgICAgICAgdGhpcy5lZGl0b3JWaWV3ID0gZWRpdG9yVmlldztcbiAgICAgICAgdGhpcy5lZGl0b3IgPSBlZGl0b3I7XG4gICAgICAgIHRoaXMuZXhwclR5cGVUb29sdGlwID0gbnVsbDtcbiAgICAgICAgdGhpcy5yYXdWaWV3ID0gZWRpdG9yVmlld1swXTtcbiAgICAgICAgY29uc3QgY2QgPSB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICBjb25zdCBzY3JvbGwgPSB0aGlzLmdldEZyb21TaGFkb3dEb20oZWRpdG9yVmlldywgXCIuc2Nyb2xsLXZpZXdcIik7XG4gICAgICAgIGlmICghc2Nyb2xsWzBdKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBsZXQgbGFzdEV4cHJUeXBlQnVmZmVyUHQ7XG4gICAgICAgIGNvbnN0IG1vdXNlbW92ZSA9IE9ic2VydmFibGUuZnJvbUV2ZW50KHNjcm9sbFswXSwgXCJtb3VzZW1vdmVcIik7XG4gICAgICAgIGNvbnN0IG1vdXNlb3V0ID0gT2JzZXJ2YWJsZS5mcm9tRXZlbnQoc2Nyb2xsWzBdLCBcIm1vdXNlb3V0XCIpO1xuICAgICAgICB0aGlzLmtleWRvd24gPSBPYnNlcnZhYmxlLmZyb21FdmVudChzY3JvbGxbMF0sIFwia2V5ZG93blwiKTtcbiAgICAgICAgY2QuYWRkKG1vdXNlbW92ZVxuICAgICAgICAgICAgLmF1ZGl0VGltZSgyMDApXG4gICAgICAgICAgICAubWFwKGV2ZW50ID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHBpeGVsUHQgPSB0aGlzLnBpeGVsUG9zaXRpb25Gcm9tTW91c2VFdmVudChlZGl0b3JWaWV3LCBldmVudCk7XG4gICAgICAgICAgICBpZiAoIXBpeGVsUHQpXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgY29uc3Qgc2NyZWVuUHQgPSBlZGl0b3Iuc2NyZWVuUG9zaXRpb25Gb3JQaXhlbFBvc2l0aW9uKHBpeGVsUHQpO1xuICAgICAgICAgICAgY29uc3QgYnVmZmVyUHQgPSBlZGl0b3IuYnVmZmVyUG9zaXRpb25Gb3JTY3JlZW5Qb3NpdGlvbihzY3JlZW5QdCk7XG4gICAgICAgICAgICBpZiAobGFzdEV4cHJUeXBlQnVmZmVyUHQgJiYgbGFzdEV4cHJUeXBlQnVmZmVyUHQuaXNFcXVhbChidWZmZXJQdCkgJiYgdGhpcy5leHByVHlwZVRvb2x0aXApXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgbGFzdEV4cHJUeXBlQnVmZmVyUHQgPSBidWZmZXJQdDtcbiAgICAgICAgICAgIHJldHVybiB7IGJ1ZmZlclB0LCBldmVudCB9O1xuICAgICAgICB9KVxuICAgICAgICAgICAgLmZpbHRlcih6ID0+ICEheilcbiAgICAgICAgICAgIC5kbygoKSA9PiB0aGlzLmhpZGVFeHByZXNzaW9uVHlwZSgpKVxuICAgICAgICAgICAgLmZpbHRlcih4ID0+IHRoaXMuY2hlY2tQb3NpdGlvbih4LmJ1ZmZlclB0KSlcbiAgICAgICAgICAgIC5kbygoKSA9PiB0aGlzLnN1YmNyaWJlS2V5RG93bigpKVxuICAgICAgICAgICAgLnN1YnNjcmliZSgoeyBidWZmZXJQdCwgZXZlbnQgfSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5zaG93RXhwcmVzc2lvblR5cGVPbk1vdXNlT3ZlcihldmVudCwgYnVmZmVyUHQpO1xuICAgICAgICB9KSk7XG4gICAgICAgIGNkLmFkZChtb3VzZW91dC5zdWJzY3JpYmUoKGUpID0+IHRoaXMuaGlkZUV4cHJlc3Npb25UeXBlKCkpKTtcbiAgICAgICAgY2QuYWRkKE9tbmkuc3dpdGNoQWN0aXZlRWRpdG9yKChlZGl0LCBpbm5lckNkKSA9PiB7XG4gICAgICAgICAgICBpbm5lckNkLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB0aGlzLmhpZGVFeHByZXNzaW9uVHlwZSgpKSk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgY2QuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuaGlkZUV4cHJlc3Npb25UeXBlKCk7XG4gICAgICAgIH0pKTtcbiAgICB9XG4gICAgc3ViY3JpYmVLZXlEb3duKCkge1xuICAgICAgICB0aGlzLmtleWRvd25TdWJzY3JpcHRpb24gPSB0aGlzLmtleWRvd24uc3Vic2NyaWJlKChlKSA9PiB0aGlzLmhpZGVFeHByZXNzaW9uVHlwZSgpKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZCh0aGlzLmtleWRvd25TdWJzY3JpcHRpb24pO1xuICAgIH1cbiAgICBzaG93RXhwcmVzc2lvblR5cGVPbkNvbW1hbmQoKSB7XG4gICAgICAgIGlmICh0aGlzLmVkaXRvci5jdXJzb3JzLmxlbmd0aCA8IDEpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNvbnN0IGJ1ZmZlclB0ID0gdGhpcy5lZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKTtcbiAgICAgICAgaWYgKCF0aGlzLmNoZWNrUG9zaXRpb24oYnVmZmVyUHQpKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zdCBvZmZzZXQgPSAodGhpcy5yYXdWaWV3LmNvbXBvbmVudC5nZXRGb250U2l6ZSgpICogYnVmZmVyUHQuY29sdW1uKSAqIDAuNztcbiAgICAgICAgY29uc3Qgc2hhZG93ID0gdGhpcy5nZXRGcm9tU2hhZG93RG9tKHRoaXMuZWRpdG9yVmlldywgXCIuY3Vyc29yLWxpbmVcIilbMF07XG4gICAgICAgIGlmICghc2hhZG93KVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zdCByZWN0ID0gc2hhZG93LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICBjb25zdCB0b29sdGlwUmVjdCA9IHtcbiAgICAgICAgICAgIGxlZnQ6IHJlY3QubGVmdCAtIG9mZnNldCxcbiAgICAgICAgICAgIHJpZ2h0OiByZWN0LmxlZnQgKyBvZmZzZXQsXG4gICAgICAgICAgICB0b3A6IHJlY3QuYm90dG9tLFxuICAgICAgICAgICAgYm90dG9tOiByZWN0LmJvdHRvbVxuICAgICAgICB9O1xuICAgICAgICB0aGlzLmhpZGVFeHByZXNzaW9uVHlwZSgpO1xuICAgICAgICB0aGlzLnN1YmNyaWJlS2V5RG93bigpO1xuICAgICAgICB0aGlzLnNob3dUb29sVGlwKGJ1ZmZlclB0LCB0b29sdGlwUmVjdCk7XG4gICAgfVxuICAgIHNob3dFeHByZXNzaW9uVHlwZU9uTW91c2VPdmVyKGUsIGJ1ZmZlclB0KSB7XG4gICAgICAgIGlmICghT21uaS5pc09uKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuZXhwclR5cGVUb29sdGlwKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zdCBvZmZzZXQgPSB0aGlzLmVkaXRvci5nZXRMaW5lSGVpZ2h0SW5QaXhlbHMoKSAqIDAuNztcbiAgICAgICAgY29uc3QgdG9vbHRpcFJlY3QgPSB7XG4gICAgICAgICAgICBsZWZ0OiBlLmNsaWVudFgsXG4gICAgICAgICAgICByaWdodDogZS5jbGllbnRYLFxuICAgICAgICAgICAgdG9wOiBlLmNsaWVudFkgLSBvZmZzZXQsXG4gICAgICAgICAgICBib3R0b206IGUuY2xpZW50WSArIG9mZnNldFxuICAgICAgICB9O1xuICAgICAgICB0aGlzLnNob3dUb29sVGlwKGJ1ZmZlclB0LCB0b29sdGlwUmVjdCk7XG4gICAgfVxuICAgIGNoZWNrUG9zaXRpb24oYnVmZmVyUHQpIHtcbiAgICAgICAgY29uc3QgY3VyQ2hhclBpeGVsUHQgPSB0aGlzLnJhd1ZpZXcucGl4ZWxQb3NpdGlvbkZvckJ1ZmZlclBvc2l0aW9uKFtidWZmZXJQdC5yb3csIGJ1ZmZlclB0LmNvbHVtbl0pO1xuICAgICAgICBjb25zdCBuZXh0Q2hhclBpeGVsUHQgPSB0aGlzLnJhd1ZpZXcucGl4ZWxQb3NpdGlvbkZvckJ1ZmZlclBvc2l0aW9uKFtidWZmZXJQdC5yb3csIGJ1ZmZlclB0LmNvbHVtbiArIDFdKTtcbiAgICAgICAgaWYgKGN1ckNoYXJQaXhlbFB0LmxlZnQgPj0gbmV4dENoYXJQaXhlbFB0LmxlZnQpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHNob3dUb29sVGlwKGJ1ZmZlclB0LCB0b29sdGlwUmVjdCkge1xuICAgICAgICB0aGlzLmV4cHJUeXBlVG9vbHRpcCA9IG5ldyBUb29sdGlwVmlldyh0b29sdGlwUmVjdCk7XG4gICAgICAgIE9tbmkucmVxdWVzdChzb2x1dGlvbiA9PiBzb2x1dGlvbi50eXBlbG9va3VwKHtcbiAgICAgICAgICAgIEluY2x1ZGVEb2N1bWVudGF0aW9uOiB0cnVlLFxuICAgICAgICAgICAgTGluZTogYnVmZmVyUHQucm93LFxuICAgICAgICAgICAgQ29sdW1uOiBidWZmZXJQdC5jb2x1bW5cbiAgICAgICAgfSkpLnN1YnNjcmliZSgocmVzcG9uc2UpID0+IHtcbiAgICAgICAgICAgIGlmIChyZXNwb25zZS5UeXBlID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IG1lc3NhZ2UgPSBgPGI+JHtlc2NhcGUocmVzcG9uc2UuVHlwZSl9PC9iPmA7XG4gICAgICAgICAgICBpZiAocmVzcG9uc2UuRG9jdW1lbnRhdGlvbikge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSBtZXNzYWdlICsgYDxici8+PGk+JHtlc2NhcGUocmVzcG9uc2UuRG9jdW1lbnRhdGlvbil9PC9pPmA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5leHByVHlwZVRvb2x0aXApIHtcbiAgICAgICAgICAgICAgICB0aGlzLmV4cHJUeXBlVG9vbHRpcC51cGRhdGVUZXh0KG1lc3NhZ2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG4gICAgZGlzcG9zZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICB9XG4gICAgaGlkZUV4cHJlc3Npb25UeXBlKCkge1xuICAgICAgICBpZiAoIXRoaXMuZXhwclR5cGVUb29sdGlwKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB0aGlzLmV4cHJUeXBlVG9vbHRpcC5yZW1vdmUoKTtcbiAgICAgICAgdGhpcy5leHByVHlwZVRvb2x0aXAgPSBudWxsO1xuICAgICAgICBpZiAodGhpcy5rZXlkb3duU3Vic2NyaXB0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUucmVtb3ZlKHRoaXMua2V5ZG93blN1YnNjcmlwdGlvbik7XG4gICAgICAgICAgICB0aGlzLmtleWRvd25TdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICAgICAgICAgIHRoaXMua2V5ZG93blN1YnNjcmlwdGlvbiA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZ2V0RnJvbVNoYWRvd0RvbShlbGVtZW50LCBzZWxlY3Rvcikge1xuICAgICAgICBjb25zdCBlbCA9IGVsZW1lbnRbMF07XG4gICAgICAgIGlmICghZWwucm9vdEVsZW1lbnQpXG4gICAgICAgICAgICByZXR1cm4gJChlbCk7XG4gICAgICAgIGNvbnN0IGZvdW5kID0gZWwucm9vdEVsZW1lbnQucXVlcnlTZWxlY3RvckFsbChzZWxlY3Rvcik7XG4gICAgICAgIHJldHVybiAkKGZvdW5kWzBdKTtcbiAgICB9XG4gICAgcGl4ZWxQb3NpdGlvbkZyb21Nb3VzZUV2ZW50KGVkaXRvclZpZXcsIGV2ZW50KSB7XG4gICAgICAgIGNvbnN0IGNsaWVudFggPSBldmVudC5jbGllbnRYLCBjbGllbnRZID0gZXZlbnQuY2xpZW50WTtcbiAgICAgICAgY29uc3Qgc2hhZG93ID0gdGhpcy5nZXRGcm9tU2hhZG93RG9tKGVkaXRvclZpZXcsIFwiLmxpbmVzXCIpWzBdO1xuICAgICAgICBpZiAoIXNoYWRvdylcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3QgbGluZXNDbGllbnRSZWN0ID0gc2hhZG93LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICBsZXQgdG9wID0gY2xpZW50WSAtIGxpbmVzQ2xpZW50UmVjdC50b3A7XG4gICAgICAgIGxldCBsZWZ0ID0gY2xpZW50WCAtIGxpbmVzQ2xpZW50UmVjdC5sZWZ0O1xuICAgICAgICB0b3AgKz0gdGhpcy5lZGl0b3IuZ2V0U2Nyb2xsVG9wKCk7XG4gICAgICAgIGxlZnQgKz0gdGhpcy5lZGl0b3IuZ2V0U2Nyb2xsTGVmdCgpO1xuICAgICAgICByZXR1cm4geyB0b3A6IHRvcCwgbGVmdDogbGVmdCB9O1xuICAgIH1cbn1cbmV4cG9ydCBjb25zdCB0eXBlTG9va3VwID0gbmV3IFR5cGVMb29rdXA7XG4iLCIvLyBJbnNwaXJhdGlvbiA6IGh0dHBzOi8vYXRvbS5pby9wYWNrYWdlcy9pZGUtaGFza2VsbFxyXG4vLyBhbmQgaHR0cHM6Ly9hdG9tLmlvL3BhY2thZ2VzL2lkZS1mbG93XHJcbi8vIGh0dHBzOi8vYXRvbS5pby9wYWNrYWdlcy9hdG9tLXR5cGVzY3JpcHRcclxuaW1wb3J0IHtNb2RlbHN9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XHJcbmltcG9ydCB7T2JzZXJ2YWJsZSwgU3Vic2NyaXB0aW9ufSBmcm9tIFwicnhqc1wiO1xyXG5pbXBvcnQge0NvbXBvc2l0ZURpc3Bvc2FibGUsIERpc3Bvc2FibGUsIElEaXNwb3NhYmxlfSBmcm9tIFwidHMtZGlzcG9zYWJsZXNcIjtcclxuaW1wb3J0IHtPbW5pfSBmcm9tIFwiLi4vc2VydmVyL29tbmlcIjtcclxuaW1wb3J0IHtUb29sdGlwVmlld30gZnJvbSBcIi4uL3ZpZXdzL3Rvb2x0aXAtdmlld1wiO1xyXG5jb25zdCAkOiBKUXVlcnlTdGF0aWMgPSByZXF1aXJlKFwianF1ZXJ5XCIpO1xyXG5jb25zdCBlc2NhcGUgPSByZXF1aXJlKFwiZXNjYXBlLWh0bWxcIik7XHJcblxyXG5jbGFzcyBUeXBlTG9va3VwIGltcGxlbWVudHMgSUZlYXR1cmUge1xyXG4gICAgcHJpdmF0ZSBkaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xyXG5cclxuICAgIHB1YmxpYyBhY3RpdmF0ZSgpIHtcclxuICAgICAgICBsZXQgdG9vbHRpcDogVG9vbHRpcDtcclxuICAgICAgICAvKiB0c2xpbnQ6ZGlzYWJsZTpuby1zdHJpbmctbGl0ZXJhbCAqL1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLnN3aXRjaEFjdGl2ZUVkaXRvcigoZWRpdG9yLCBjZCkgPT4ge1xyXG4gICAgICAgICAgICAvLyBzdWJzY3JpYmUgZm9yIHRvb2x0aXBzXHJcbiAgICAgICAgICAgIC8vIGluc3BpcmF0aW9uIDogaHR0cHM6Ly9naXRodWIuY29tL2NoYWlrYTIwMTMvaWRlLWhhc2tlbGxcclxuICAgICAgICAgICAgY29uc3QgZWRpdG9yVmlldyA9ICQoYXRvbS52aWV3cy5nZXRWaWV3KGVkaXRvcikpO1xyXG4gICAgICAgICAgICB0b29sdGlwID0gbmV3IFRvb2x0aXAoZWRpdG9yVmlldywgZWRpdG9yKTtcclxuICAgICAgICAgICAgY2QuYWRkKHRvb2x0aXApO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmFkZFRleHRFZGl0b3JDb21tYW5kKFwib21uaXNoYXJwLWF0b206dHlwZS1sb29rdXBcIiwgKCkgPT4ge1xyXG4gICAgICAgICAgICBPbW5pLmFjdGl2ZUVkaXRvci5maXJzdCgpLnN1YnNjcmliZShlZGl0b3IgPT4ge1xyXG4gICAgICAgICAgICAgICAgdG9vbHRpcC5zaG93RXhwcmVzc2lvblR5cGVPbkNvbW1hbmQoKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSkpO1xyXG4gICAgICAgIC8qIHRzbGludDplbmFibGU6bm8tc3RyaW5nLWxpdGVyYWwgKi9cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGlzcG9zZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZXF1aXJlZCA9IGZhbHNlO1xyXG4gICAgcHVibGljIHRpdGxlID0gXCJUb29sdGlwIExvb2t1cFwiO1xyXG4gICAgcHVibGljIGRlc2NyaXB0aW9uID0gXCJBZGRzIGhvdmVyIHRvb2x0aXBzIHRvIHRoZSBlZGl0b3IsIGFsc28gaGFzIGEga2V5YmluZFwiO1xyXG59XHJcblxyXG5jbGFzcyBUb29sdGlwIGltcGxlbWVudHMgSURpc3Bvc2FibGUge1xyXG4gICAgcHJpdmF0ZSBleHByVHlwZVRvb2x0aXA6IFRvb2x0aXBWaWV3ID0gbnVsbDtcclxuICAgIHByaXZhdGUga2V5ZG93bjogT2JzZXJ2YWJsZTxLZXlib2FyZEV2ZW50PjtcclxuICAgIHByaXZhdGUga2V5ZG93blN1YnNjcmlwdGlvbjogU3Vic2NyaXB0aW9uO1xyXG4gICAgcHJpdmF0ZSByYXdWaWV3OiBhbnk7XHJcbiAgICBwcml2YXRlIGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XHJcblxyXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBlZGl0b3JWaWV3OiBKUXVlcnksIHByaXZhdGUgZWRpdG9yOiBBdG9tLlRleHRFZGl0b3IpIHtcclxuICAgICAgICB0aGlzLnJhd1ZpZXcgPSBlZGl0b3JWaWV3WzBdO1xyXG5cclxuICAgICAgICBjb25zdCBjZCA9IHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcblxyXG4gICAgICAgIGNvbnN0IHNjcm9sbCA9IHRoaXMuZ2V0RnJvbVNoYWRvd0RvbShlZGl0b3JWaWV3LCBcIi5zY3JvbGwtdmlld1wiKTtcclxuICAgICAgICBpZiAoIXNjcm9sbFswXSkgcmV0dXJuO1xyXG5cclxuICAgICAgICAvLyB0byBkZWJvdW5jZSBtb3VzZW1vdmUgZXZlbnRcInMgZmlyaW5nIGZvciBzb21lIHJlYXNvbiBvbiBzb21lIG1hY2hpbmVzXHJcbiAgICAgICAgbGV0IGxhc3RFeHByVHlwZUJ1ZmZlclB0OiBhbnk7XHJcblxyXG4gICAgICAgIGNvbnN0IG1vdXNlbW92ZSA9IE9ic2VydmFibGUuZnJvbUV2ZW50PE1vdXNlRXZlbnQ+KHNjcm9sbFswXSwgXCJtb3VzZW1vdmVcIik7XHJcbiAgICAgICAgY29uc3QgbW91c2VvdXQgPSBPYnNlcnZhYmxlLmZyb21FdmVudDxNb3VzZUV2ZW50PihzY3JvbGxbMF0sIFwibW91c2VvdXRcIik7XHJcbiAgICAgICAgdGhpcy5rZXlkb3duID0gT2JzZXJ2YWJsZS5mcm9tRXZlbnQ8S2V5Ym9hcmRFdmVudD4oc2Nyb2xsWzBdLCBcImtleWRvd25cIik7XHJcblxyXG4gICAgICAgIGNkLmFkZChtb3VzZW1vdmVcclxuICAgICAgICAgICAgLmF1ZGl0VGltZSgyMDApXHJcbiAgICAgICAgICAgIC5tYXAoZXZlbnQgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcGl4ZWxQdCA9IHRoaXMucGl4ZWxQb3NpdGlvbkZyb21Nb3VzZUV2ZW50KGVkaXRvclZpZXcsIGV2ZW50KTtcclxuICAgICAgICAgICAgICAgIGlmICghcGl4ZWxQdClcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICBjb25zdCBzY3JlZW5QdCA9IGVkaXRvci5zY3JlZW5Qb3NpdGlvbkZvclBpeGVsUG9zaXRpb24ocGl4ZWxQdCk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBidWZmZXJQdCA9IGVkaXRvci5idWZmZXJQb3NpdGlvbkZvclNjcmVlblBvc2l0aW9uKHNjcmVlblB0KTtcclxuICAgICAgICAgICAgICAgIGlmIChsYXN0RXhwclR5cGVCdWZmZXJQdCAmJiBsYXN0RXhwclR5cGVCdWZmZXJQdC5pc0VxdWFsKGJ1ZmZlclB0KSAmJiB0aGlzLmV4cHJUeXBlVG9vbHRpcClcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgICAgICAgICAgbGFzdEV4cHJUeXBlQnVmZmVyUHQgPSBidWZmZXJQdDtcclxuICAgICAgICAgICAgICAgIHJldHVybiB7IGJ1ZmZlclB0LCBldmVudCB9O1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAuZmlsdGVyKHogPT4gISF6KVxyXG4gICAgICAgICAgICAuZG8oKCkgPT4gdGhpcy5oaWRlRXhwcmVzc2lvblR5cGUoKSlcclxuICAgICAgICAgICAgLmZpbHRlcih4ID0+IHRoaXMuY2hlY2tQb3NpdGlvbih4LmJ1ZmZlclB0KSlcclxuICAgICAgICAgICAgLmRvKCgpID0+IHRoaXMuc3ViY3JpYmVLZXlEb3duKCkpXHJcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoKHtidWZmZXJQdCwgZXZlbnR9KSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNob3dFeHByZXNzaW9uVHlwZU9uTW91c2VPdmVyKGV2ZW50LCBidWZmZXJQdCk7XHJcbiAgICAgICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgY2QuYWRkKG1vdXNlb3V0LnN1YnNjcmliZSgoZSkgPT4gdGhpcy5oaWRlRXhwcmVzc2lvblR5cGUoKSkpO1xyXG5cclxuICAgICAgICBjZC5hZGQoT21uaS5zd2l0Y2hBY3RpdmVFZGl0b3IoKGVkaXQsIGlubmVyQ2QpID0+IHtcclxuICAgICAgICAgICAgaW5uZXJDZC5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4gdGhpcy5oaWRlRXhwcmVzc2lvblR5cGUoKSkpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgY2QuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5oaWRlRXhwcmVzc2lvblR5cGUoKTtcclxuICAgICAgICB9KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBzdWJjcmliZUtleURvd24oKSB7XHJcbiAgICAgICAgdGhpcy5rZXlkb3duU3Vic2NyaXB0aW9uID0gdGhpcy5rZXlkb3duLnN1YnNjcmliZSgoZSkgPT4gdGhpcy5oaWRlRXhwcmVzc2lvblR5cGUoKSk7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZCh0aGlzLmtleWRvd25TdWJzY3JpcHRpb24pO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzaG93RXhwcmVzc2lvblR5cGVPbkNvbW1hbmQoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuZWRpdG9yLmN1cnNvcnMubGVuZ3RoIDwgMSkgcmV0dXJuO1xyXG5cclxuICAgICAgICBjb25zdCBidWZmZXJQdCA9IHRoaXMuZWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKCk7XHJcblxyXG4gICAgICAgIGlmICghdGhpcy5jaGVja1Bvc2l0aW9uKGJ1ZmZlclB0KSkgcmV0dXJuO1xyXG5cclxuICAgICAgICAvLyBmaW5kIG91dCBzaG93IHBvc2l0aW9uXHJcbiAgICAgICAgY29uc3Qgb2Zmc2V0ID0gKHRoaXMucmF3Vmlldy5jb21wb25lbnQuZ2V0Rm9udFNpemUoKSAqIGJ1ZmZlclB0LmNvbHVtbikgKiAwLjc7XHJcbiAgICAgICAgY29uc3Qgc2hhZG93ID0gdGhpcy5nZXRGcm9tU2hhZG93RG9tKHRoaXMuZWRpdG9yVmlldywgXCIuY3Vyc29yLWxpbmVcIilbMF07XHJcbiAgICAgICAgaWYgKCFzaGFkb3cpIHJldHVybjtcclxuICAgICAgICBjb25zdCByZWN0ID0gc2hhZG93LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xyXG5cclxuICAgICAgICBjb25zdCB0b29sdGlwUmVjdCA9IHtcclxuICAgICAgICAgICAgbGVmdDogcmVjdC5sZWZ0IC0gb2Zmc2V0LFxyXG4gICAgICAgICAgICByaWdodDogcmVjdC5sZWZ0ICsgb2Zmc2V0LFxyXG4gICAgICAgICAgICB0b3A6IHJlY3QuYm90dG9tLFxyXG4gICAgICAgICAgICBib3R0b206IHJlY3QuYm90dG9tXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5oaWRlRXhwcmVzc2lvblR5cGUoKTtcclxuICAgICAgICB0aGlzLnN1YmNyaWJlS2V5RG93bigpO1xyXG4gICAgICAgIHRoaXMuc2hvd1Rvb2xUaXAoYnVmZmVyUHQsIHRvb2x0aXBSZWN0KTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHNob3dFeHByZXNzaW9uVHlwZU9uTW91c2VPdmVyKGU6IE1vdXNlRXZlbnQsIGJ1ZmZlclB0OiBUZXh0QnVmZmVyLlBvaW50KSB7XHJcbiAgICAgICAgaWYgKCFPbW5pLmlzT24pIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gSWYgd2UgYXJlIGFscmVhZHkgc2hvd2luZyB3ZSBzaG91bGQgd2FpdCBmb3IgdGhhdCB0byBjbGVhclxyXG4gICAgICAgIGlmICh0aGlzLmV4cHJUeXBlVG9vbHRpcCkgcmV0dXJuO1xyXG5cclxuICAgICAgICAvLyBmaW5kIG91dCBzaG93IHBvc2l0aW9uXHJcbiAgICAgICAgY29uc3Qgb2Zmc2V0ID0gKDxhbnk+dGhpcy5lZGl0b3IpLmdldExpbmVIZWlnaHRJblBpeGVscygpICogMC43O1xyXG4gICAgICAgIGNvbnN0IHRvb2x0aXBSZWN0ID0ge1xyXG4gICAgICAgICAgICBsZWZ0OiBlLmNsaWVudFgsXHJcbiAgICAgICAgICAgIHJpZ2h0OiBlLmNsaWVudFgsXHJcbiAgICAgICAgICAgIHRvcDogZS5jbGllbnRZIC0gb2Zmc2V0LFxyXG4gICAgICAgICAgICBib3R0b206IGUuY2xpZW50WSArIG9mZnNldFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuc2hvd1Rvb2xUaXAoYnVmZmVyUHQsIHRvb2x0aXBSZWN0KTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGNoZWNrUG9zaXRpb24oYnVmZmVyUHQ6IFRleHRCdWZmZXIuUG9pbnQpIHtcclxuICAgICAgICBjb25zdCBjdXJDaGFyUGl4ZWxQdCA9IHRoaXMucmF3Vmlldy5waXhlbFBvc2l0aW9uRm9yQnVmZmVyUG9zaXRpb24oW2J1ZmZlclB0LnJvdywgYnVmZmVyUHQuY29sdW1uXSk7XHJcbiAgICAgICAgY29uc3QgbmV4dENoYXJQaXhlbFB0ID0gdGhpcy5yYXdWaWV3LnBpeGVsUG9zaXRpb25Gb3JCdWZmZXJQb3NpdGlvbihbYnVmZmVyUHQucm93LCBidWZmZXJQdC5jb2x1bW4gKyAxXSk7XHJcblxyXG4gICAgICAgIGlmIChjdXJDaGFyUGl4ZWxQdC5sZWZ0ID49IG5leHRDaGFyUGl4ZWxQdC5sZWZ0KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBzaG93VG9vbFRpcChidWZmZXJQdDogVGV4dEJ1ZmZlci5Qb2ludCwgdG9vbHRpcFJlY3Q6IGFueSkge1xyXG4gICAgICAgIHRoaXMuZXhwclR5cGVUb29sdGlwID0gbmV3IFRvb2x0aXBWaWV3KHRvb2x0aXBSZWN0KTtcclxuXHJcbiAgICAgICAgLy8gQWN0dWFsbHkgbWFrZSB0aGUgcHJvZ3JhbSBtYW5hZ2VyIHF1ZXJ5XHJcbiAgICAgICAgT21uaS5yZXF1ZXN0KHNvbHV0aW9uID0+IHNvbHV0aW9uLnR5cGVsb29rdXAoe1xyXG4gICAgICAgICAgICBJbmNsdWRlRG9jdW1lbnRhdGlvbjogdHJ1ZSxcclxuICAgICAgICAgICAgTGluZTogYnVmZmVyUHQucm93LFxyXG4gICAgICAgICAgICBDb2x1bW46IGJ1ZmZlclB0LmNvbHVtblxyXG4gICAgICAgIH0pKS5zdWJzY3JpYmUoKHJlc3BvbnNlOiBNb2RlbHMuVHlwZUxvb2t1cFJlc3BvbnNlKSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChyZXNwb25zZS5UeXBlID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgbGV0IG1lc3NhZ2UgPSBgPGI+JHtlc2NhcGUocmVzcG9uc2UuVHlwZSl9PC9iPmA7XHJcbiAgICAgICAgICAgIGlmIChyZXNwb25zZS5Eb2N1bWVudGF0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICBtZXNzYWdlID0gbWVzc2FnZSArIGA8YnIvPjxpPiR7ZXNjYXBlKHJlc3BvbnNlLkRvY3VtZW50YXRpb24pfTwvaT5gO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIFNvcnJ5IGFib3V0IHRoaXMgXCJpZlwiLiBJdFwicyBpbiB0aGUgY29kZSBJIGNvcGllZCBzbyBJIGd1ZXNzIGl0cyB0aGVyZSBmb3IgYSByZWFzb25cclxuICAgICAgICAgICAgaWYgKHRoaXMuZXhwclR5cGVUb29sdGlwKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmV4cHJUeXBlVG9vbHRpcC51cGRhdGVUZXh0KG1lc3NhZ2UpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGhpZGVFeHByZXNzaW9uVHlwZSgpIHtcclxuICAgICAgICBpZiAoIXRoaXMuZXhwclR5cGVUb29sdGlwKSByZXR1cm47XHJcbiAgICAgICAgdGhpcy5leHByVHlwZVRvb2x0aXAucmVtb3ZlKCk7XHJcbiAgICAgICAgdGhpcy5leHByVHlwZVRvb2x0aXAgPSBudWxsO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5rZXlkb3duU3Vic2NyaXB0aW9uKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5yZW1vdmUodGhpcy5rZXlkb3duU3Vic2NyaXB0aW9uKTtcclxuICAgICAgICAgICAgdGhpcy5rZXlkb3duU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XHJcbiAgICAgICAgICAgIHRoaXMua2V5ZG93blN1YnNjcmlwdGlvbiA9IG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZ2V0RnJvbVNoYWRvd0RvbShlbGVtZW50OiBKUXVlcnksIHNlbGVjdG9yOiBzdHJpbmcpOiBKUXVlcnkge1xyXG4gICAgICAgIGNvbnN0IGVsID0gZWxlbWVudFswXTtcclxuICAgICAgICBpZiAoISg8YW55PmVsKS5yb290RWxlbWVudCkgcmV0dXJuICQoZWwpO1xyXG5cclxuICAgICAgICBjb25zdCBmb3VuZCA9ICg8YW55PmVsKS5yb290RWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKTtcclxuICAgICAgICByZXR1cm4gJChmb3VuZFswXSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBwaXhlbFBvc2l0aW9uRnJvbU1vdXNlRXZlbnQoZWRpdG9yVmlldzogYW55LCBldmVudDogTW91c2VFdmVudCkge1xyXG4gICAgICAgIGNvbnN0IGNsaWVudFggPSBldmVudC5jbGllbnRYLCBjbGllbnRZID0gZXZlbnQuY2xpZW50WTtcclxuICAgICAgICBjb25zdCBzaGFkb3cgPSB0aGlzLmdldEZyb21TaGFkb3dEb20oZWRpdG9yVmlldywgXCIubGluZXNcIilbMF07XHJcbiAgICAgICAgaWYgKCFzaGFkb3cpIHJldHVybjtcclxuICAgICAgICBjb25zdCBsaW5lc0NsaWVudFJlY3QgPSBzaGFkb3cuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XHJcbiAgICAgICAgbGV0IHRvcCA9IGNsaWVudFkgLSBsaW5lc0NsaWVudFJlY3QudG9wO1xyXG4gICAgICAgIGxldCBsZWZ0ID0gY2xpZW50WCAtIGxpbmVzQ2xpZW50UmVjdC5sZWZ0O1xyXG4gICAgICAgIHRvcCArPSAoPGFueT50aGlzLmVkaXRvcikuZ2V0U2Nyb2xsVG9wKCk7XHJcbiAgICAgICAgbGVmdCArPSAoPGFueT50aGlzLmVkaXRvcikuZ2V0U2Nyb2xsTGVmdCgpO1xyXG4gICAgICAgIHJldHVybiB7IHRvcDogdG9wLCBsZWZ0OiBsZWZ0IH07XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCB0eXBlTG9va3VwID0gbmV3IFR5cGVMb29rdXA7XHJcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
