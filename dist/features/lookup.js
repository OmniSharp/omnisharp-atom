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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9sb29rdXAuanMiLCJsaWIvZmVhdHVyZXMvbG9va3VwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQUNBOztBQUNBOztBQUNBOzs7O0FDS0EsSUFBTSxJQUFrQixRQUFRLFFBQVIsQ0FBbEI7QUFDTixJQUFNLFNBQVMsUUFBUSxhQUFSLENBQVQ7O0lBRU47QUFBQSwwQkFBQTs7O0FBMkJXLGFBQUEsUUFBQSxHQUFXLEtBQVgsQ0EzQlg7QUE0QlcsYUFBQSxLQUFBLEdBQVEsZ0JBQVIsQ0E1Qlg7QUE2QlcsYUFBQSxXQUFBLEdBQWMsdURBQWQsQ0E3Qlg7S0FBQTs7OzttQ0FHbUI7QUFDWCxnQkFBSSxnQkFBSixDQURXO0FBR1gsaUJBQUssVUFBTCxHQUFrQix3Q0FBbEIsQ0FIVztBQUlYLGlCQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsV0FBSyxrQkFBTCxDQUF3QixVQUFDLE1BQUQsRUFBUyxFQUFULEVBQVc7QUFHbkQsb0JBQU0sYUFBYSxFQUFFLEtBQUssS0FBTCxDQUFXLE9BQVgsQ0FBbUIsTUFBbkIsQ0FBRixDQUFiLENBSDZDO0FBSW5ELDBCQUFVLElBQUksT0FBSixDQUFZLFVBQVosRUFBd0IsTUFBeEIsQ0FBVixDQUptRDtBQUtuRCxtQkFBRyxHQUFILENBQU8sT0FBUCxFQUxtRDthQUFYLENBQTVDLEVBSlc7QUFZWCxpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLFdBQUssb0JBQUwsQ0FBMEIsNEJBQTFCLEVBQXdELFlBQUE7QUFDeEUsMkJBQUssWUFBTCxDQUFrQixLQUFsQixHQUEwQixTQUExQixDQUFvQyxrQkFBTTtBQUN0Qyw0QkFBUSwyQkFBUixHQURzQztpQkFBTixDQUFwQyxDQUR3RTthQUFBLENBQTVFLEVBWlc7Ozs7a0NBb0JEO0FBQ1YsaUJBQUssVUFBTCxDQUFnQixPQUFoQixHQURVOzs7Ozs7O0lBU2xCO0FBT0kscUJBQW9CLFVBQXBCLEVBQWdELE1BQWhELEVB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LEVBQWQsQ0FSa0U7QUFTbEUsbUJBQU8sRUFBRSxLQUFLLEdBQUwsRUFBVSxNQUFNLElBQU4sRUFBbkIsQ0FUa0U7Ozs7Ozs7QUFhbkUsSUFBTSxrQ0FBYSxJQUFJLFVBQUosRUFBYiIsImZpbGUiOiJsaWIvZmVhdHVyZXMvbG9va3VwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgT2JzZXJ2YWJsZSB9IGZyb20gXCJyeGpzXCI7XG5pbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlIH0gZnJvbSBcInRzLWRpc3Bvc2FibGVzXCI7XG5pbXBvcnQgeyBPbW5pIH0gZnJvbSBcIi4uL3NlcnZlci9vbW5pXCI7XG5pbXBvcnQgeyBUb29sdGlwVmlldyB9IGZyb20gXCIuLi92aWV3cy90b29sdGlwLXZpZXdcIjtcbmNvbnN0ICQgPSByZXF1aXJlKFwianF1ZXJ5XCIpO1xuY29uc3QgZXNjYXBlID0gcmVxdWlyZShcImVzY2FwZS1odG1sXCIpO1xuY2xhc3MgVHlwZUxvb2t1cCB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMucmVxdWlyZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy50aXRsZSA9IFwiVG9vbHRpcCBMb29rdXBcIjtcbiAgICAgICAgdGhpcy5kZXNjcmlwdGlvbiA9IFwiQWRkcyBob3ZlciB0b29sdGlwcyB0byB0aGUgZWRpdG9yLCBhbHNvIGhhcyBhIGtleWJpbmRcIjtcbiAgICB9XG4gICAgYWN0aXZhdGUoKSB7XG4gICAgICAgIGxldCB0b29sdGlwO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuc3dpdGNoQWN0aXZlRWRpdG9yKChlZGl0b3IsIGNkKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBlZGl0b3JWaWV3ID0gJChhdG9tLnZpZXdzLmdldFZpZXcoZWRpdG9yKSk7XG4gICAgICAgICAgICB0b29sdGlwID0gbmV3IFRvb2x0aXAoZWRpdG9yVmlldywgZWRpdG9yKTtcbiAgICAgICAgICAgIGNkLmFkZCh0b29sdGlwKTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuYWRkVGV4dEVkaXRvckNvbW1hbmQoXCJvbW5pc2hhcnAtYXRvbTp0eXBlLWxvb2t1cFwiLCAoKSA9PiB7XG4gICAgICAgICAgICBPbW5pLmFjdGl2ZUVkaXRvci5maXJzdCgpLnN1YnNjcmliZShlZGl0b3IgPT4ge1xuICAgICAgICAgICAgICAgIHRvb2x0aXAuc2hvd0V4cHJlc3Npb25UeXBlT25Db21tYW5kKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSkpO1xuICAgIH1cbiAgICBkaXNwb3NlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgIH1cbn1cbmNsYXNzIFRvb2x0aXAge1xuICAgIGNvbnN0cnVjdG9yKGVkaXRvclZpZXcsIGVkaXRvcikge1xuICAgICAgICB0aGlzLmVkaXRvclZpZXcgPSBlZGl0b3JWaWV3O1xuICAgICAgICB0aGlzLmVkaXRvciA9IGVkaXRvcjtcbiAgICAgICAgdGhpcy5leHByVHlwZVRvb2x0aXAgPSBudWxsO1xuICAgICAgICB0aGlzLnJhd1ZpZXcgPSBlZGl0b3JWaWV3WzBdO1xuICAgICAgICBjb25zdCBjZCA9IHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIGNvbnN0IHNjcm9sbCA9IHRoaXMuZ2V0RnJvbVNoYWRvd0RvbShlZGl0b3JWaWV3LCBcIi5zY3JvbGwtdmlld1wiKTtcbiAgICAgICAgaWYgKCFzY3JvbGxbMF0pXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGxldCBsYXN0RXhwclR5cGVCdWZmZXJQdDtcbiAgICAgICAgY29uc3QgbW91c2Vtb3ZlID0gT2JzZXJ2YWJsZS5mcm9tRXZlbnQoc2Nyb2xsWzBdLCBcIm1vdXNlbW92ZVwiKTtcbiAgICAgICAgY29uc3QgbW91c2VvdXQgPSBPYnNlcnZhYmxlLmZyb21FdmVudChzY3JvbGxbMF0sIFwibW91c2VvdXRcIik7XG4gICAgICAgIHRoaXMua2V5ZG93biA9IE9ic2VydmFibGUuZnJvbUV2ZW50KHNjcm9sbFswXSwgXCJrZXlkb3duXCIpO1xuICAgICAgICBjZC5hZGQobW91c2Vtb3ZlXG4gICAgICAgICAgICAuYXVkaXRUaW1lKDIwMClcbiAgICAgICAgICAgIC5tYXAoZXZlbnQgPT4ge1xuICAgICAgICAgICAgY29uc3QgcGl4ZWxQdCA9IHRoaXMucGl4ZWxQb3NpdGlvbkZyb21Nb3VzZUV2ZW50KGVkaXRvclZpZXcsIGV2ZW50KTtcbiAgICAgICAgICAgIGlmICghcGl4ZWxQdClcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICBjb25zdCBzY3JlZW5QdCA9IGVkaXRvci5zY3JlZW5Qb3NpdGlvbkZvclBpeGVsUG9zaXRpb24ocGl4ZWxQdCk7XG4gICAgICAgICAgICBjb25zdCBidWZmZXJQdCA9IGVkaXRvci5idWZmZXJQb3NpdGlvbkZvclNjcmVlblBvc2l0aW9uKHNjcmVlblB0KTtcbiAgICAgICAgICAgIGlmIChsYXN0RXhwclR5cGVCdWZmZXJQdCAmJiBsYXN0RXhwclR5cGVCdWZmZXJQdC5pc0VxdWFsKGJ1ZmZlclB0KSAmJiB0aGlzLmV4cHJUeXBlVG9vbHRpcClcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICBsYXN0RXhwclR5cGVCdWZmZXJQdCA9IGJ1ZmZlclB0O1xuICAgICAgICAgICAgcmV0dXJuIHsgYnVmZmVyUHQsIGV2ZW50IH07XG4gICAgICAgIH0pXG4gICAgICAgICAgICAuZmlsdGVyKHogPT4gISF6KVxuICAgICAgICAgICAgLmRvKCgpID0+IHRoaXMuaGlkZUV4cHJlc3Npb25UeXBlKCkpXG4gICAgICAgICAgICAuZmlsdGVyKHggPT4gdGhpcy5jaGVja1Bvc2l0aW9uKHguYnVmZmVyUHQpKVxuICAgICAgICAgICAgLmRvKCgpID0+IHRoaXMuc3ViY3JpYmVLZXlEb3duKCkpXG4gICAgICAgICAgICAuc3Vic2NyaWJlKCh7IGJ1ZmZlclB0LCBldmVudCB9KSA9PiB7XG4gICAgICAgICAgICB0aGlzLnNob3dFeHByZXNzaW9uVHlwZU9uTW91c2VPdmVyKGV2ZW50LCBidWZmZXJQdCk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgY2QuYWRkKG1vdXNlb3V0LnN1YnNjcmliZSgoZSkgPT4gdGhpcy5oaWRlRXhwcmVzc2lvblR5cGUoKSkpO1xuICAgICAgICBjZC5hZGQoT21uaS5zd2l0Y2hBY3RpdmVFZGl0b3IoKGVkaXQsIGlubmVyQ2QpID0+IHtcbiAgICAgICAgICAgIGlubmVyQ2QuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHRoaXMuaGlkZUV4cHJlc3Npb25UeXBlKCkpKTtcbiAgICAgICAgfSkpO1xuICAgICAgICBjZC5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5oaWRlRXhwcmVzc2lvblR5cGUoKTtcbiAgICAgICAgfSkpO1xuICAgIH1cbiAgICBzdWJjcmliZUtleURvd24oKSB7XG4gICAgICAgIHRoaXMua2V5ZG93blN1YnNjcmlwdGlvbiA9IHRoaXMua2V5ZG93bi5zdWJzY3JpYmUoKGUpID0+IHRoaXMuaGlkZUV4cHJlc3Npb25UeXBlKCkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKHRoaXMua2V5ZG93blN1YnNjcmlwdGlvbik7XG4gICAgfVxuICAgIHNob3dFeHByZXNzaW9uVHlwZU9uQ29tbWFuZCgpIHtcbiAgICAgICAgaWYgKHRoaXMuZWRpdG9yLmN1cnNvcnMubGVuZ3RoIDwgMSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3QgYnVmZmVyUHQgPSB0aGlzLmVkaXRvci5nZXRDdXJzb3JCdWZmZXJQb3NpdGlvbigpO1xuICAgICAgICBpZiAoIXRoaXMuY2hlY2tQb3NpdGlvbihidWZmZXJQdCkpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNvbnN0IG9mZnNldCA9ICh0aGlzLnJhd1ZpZXcuY29tcG9uZW50LmdldEZvbnRTaXplKCkgKiBidWZmZXJQdC5jb2x1bW4pICogMC43O1xuICAgICAgICBjb25zdCBzaGFkb3cgPSB0aGlzLmdldEZyb21TaGFkb3dEb20odGhpcy5lZGl0b3JWaWV3LCBcIi5jdXJzb3ItbGluZVwiKVswXTtcbiAgICAgICAgaWYgKCFzaGFkb3cpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNvbnN0IHJlY3QgPSBzaGFkb3cuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgIGNvbnN0IHRvb2x0aXBSZWN0ID0ge1xuICAgICAgICAgICAgbGVmdDogcmVjdC5sZWZ0IC0gb2Zmc2V0LFxuICAgICAgICAgICAgcmlnaHQ6IHJlY3QubGVmdCArIG9mZnNldCxcbiAgICAgICAgICAgIHRvcDogcmVjdC5ib3R0b20sXG4gICAgICAgICAgICBib3R0b206IHJlY3QuYm90dG9tXG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuaGlkZUV4cHJlc3Npb25UeXBlKCk7XG4gICAgICAgIHRoaXMuc3ViY3JpYmVLZXlEb3duKCk7XG4gICAgICAgIHRoaXMuc2hvd1Rvb2xUaXAoYnVmZmVyUHQsIHRvb2x0aXBSZWN0KTtcbiAgICB9XG4gICAgc2hvd0V4cHJlc3Npb25UeXBlT25Nb3VzZU92ZXIoZSwgYnVmZmVyUHQpIHtcbiAgICAgICAgaWYgKCFPbW5pLmlzT24pIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5leHByVHlwZVRvb2x0aXApXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNvbnN0IG9mZnNldCA9IHRoaXMuZWRpdG9yLmdldExpbmVIZWlnaHRJblBpeGVscygpICogMC43O1xuICAgICAgICBjb25zdCB0b29sdGlwUmVjdCA9IHtcbiAgICAgICAgICAgIGxlZnQ6IGUuY2xpZW50WCxcbiAgICAgICAgICAgIHJpZ2h0OiBlLmNsaWVudFgsXG4gICAgICAgICAgICB0b3A6IGUuY2xpZW50WSAtIG9mZnNldCxcbiAgICAgICAgICAgIGJvdHRvbTogZS5jbGllbnRZICsgb2Zmc2V0XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuc2hvd1Rvb2xUaXAoYnVmZmVyUHQsIHRvb2x0aXBSZWN0KTtcbiAgICB9XG4gICAgY2hlY2tQb3NpdGlvbihidWZmZXJQdCkge1xuICAgICAgICBjb25zdCBjdXJDaGFyUGl4ZWxQdCA9IHRoaXMucmF3Vmlldy5waXhlbFBvc2l0aW9uRm9yQnVmZmVyUG9zaXRpb24oW2J1ZmZlclB0LnJvdywgYnVmZmVyUHQuY29sdW1uXSk7XG4gICAgICAgIGNvbnN0IG5leHRDaGFyUGl4ZWxQdCA9IHRoaXMucmF3Vmlldy5waXhlbFBvc2l0aW9uRm9yQnVmZmVyUG9zaXRpb24oW2J1ZmZlclB0LnJvdywgYnVmZmVyUHQuY29sdW1uICsgMV0pO1xuICAgICAgICBpZiAoY3VyQ2hhclBpeGVsUHQubGVmdCA+PSBuZXh0Q2hhclBpeGVsUHQubGVmdCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgc2hvd1Rvb2xUaXAoYnVmZmVyUHQsIHRvb2x0aXBSZWN0KSB7XG4gICAgICAgIHRoaXMuZXhwclR5cGVUb29sdGlwID0gbmV3IFRvb2x0aXBWaWV3KHRvb2x0aXBSZWN0KTtcbiAgICAgICAgT21uaS5yZXF1ZXN0KHNvbHV0aW9uID0+IHNvbHV0aW9uLnR5cGVsb29rdXAoe1xuICAgICAgICAgICAgSW5jbHVkZURvY3VtZW50YXRpb246IHRydWUsXG4gICAgICAgICAgICBMaW5lOiBidWZmZXJQdC5yb3csXG4gICAgICAgICAgICBDb2x1bW46IGJ1ZmZlclB0LmNvbHVtblxuICAgICAgICB9KSkuc3Vic2NyaWJlKChyZXNwb25zZSkgPT4ge1xuICAgICAgICAgICAgaWYgKHJlc3BvbnNlLlR5cGUgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgbWVzc2FnZSA9IGA8Yj4ke2VzY2FwZShyZXNwb25zZS5UeXBlKX08L2I+YDtcbiAgICAgICAgICAgIGlmIChyZXNwb25zZS5Eb2N1bWVudGF0aW9uKSB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZSA9IG1lc3NhZ2UgKyBgPGJyLz48aT4ke2VzY2FwZShyZXNwb25zZS5Eb2N1bWVudGF0aW9uKX08L2k+YDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLmV4cHJUeXBlVG9vbHRpcCkge1xuICAgICAgICAgICAgICAgIHRoaXMuZXhwclR5cGVUb29sdGlwLnVwZGF0ZVRleHQobWVzc2FnZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBkaXNwb3NlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgIH1cbiAgICBoaWRlRXhwcmVzc2lvblR5cGUoKSB7XG4gICAgICAgIGlmICghdGhpcy5leHByVHlwZVRvb2x0aXApXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHRoaXMuZXhwclR5cGVUb29sdGlwLnJlbW92ZSgpO1xuICAgICAgICB0aGlzLmV4cHJUeXBlVG9vbHRpcCA9IG51bGw7XG4gICAgICAgIGlmICh0aGlzLmtleWRvd25TdWJzY3JpcHRpb24pIHtcbiAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5yZW1vdmUodGhpcy5rZXlkb3duU3Vic2NyaXB0aW9uKTtcbiAgICAgICAgICAgIHRoaXMua2V5ZG93blN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgICAgICAgICAgdGhpcy5rZXlkb3duU3Vic2NyaXB0aW9uID0gbnVsbDtcbiAgICAgICAgfVxuICAgIH1cbiAgICBnZXRGcm9tU2hhZG93RG9tKGVsZW1lbnQsIHNlbGVjdG9yKSB7XG4gICAgICAgIGNvbnN0IGVsID0gZWxlbWVudFswXTtcbiAgICAgICAgaWYgKCFlbC5yb290RWxlbWVudClcbiAgICAgICAgICAgIHJldHVybiAkKGVsKTtcbiAgICAgICAgY29uc3QgZm91bmQgPSBlbC5yb290RWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKTtcbiAgICAgICAgcmV0dXJuICQoZm91bmRbMF0pO1xuICAgIH1cbiAgICBwaXhlbFBvc2l0aW9uRnJvbU1vdXNlRXZlbnQoZWRpdG9yVmlldywgZXZlbnQpIHtcbiAgICAgICAgY29uc3QgY2xpZW50WCA9IGV2ZW50LmNsaWVudFgsIGNsaWVudFkgPSBldmVudC5jbGllbnRZO1xuICAgICAgICBjb25zdCBzaGFkb3cgPSB0aGlzLmdldEZyb21TaGFkb3dEb20oZWRpdG9yVmlldywgXCIubGluZXNcIilbMF07XG4gICAgICAgIGlmICghc2hhZG93KVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zdCBsaW5lc0NsaWVudFJlY3QgPSBzaGFkb3cuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgIGxldCB0b3AgPSBjbGllbnRZIC0gbGluZXNDbGllbnRSZWN0LnRvcDtcbiAgICAgICAgbGV0IGxlZnQgPSBjbGllbnRYIC0gbGluZXNDbGllbnRSZWN0LmxlZnQ7XG4gICAgICAgIHRvcCArPSB0aGlzLmVkaXRvci5nZXRTY3JvbGxUb3AoKTtcbiAgICAgICAgbGVmdCArPSB0aGlzLmVkaXRvci5nZXRTY3JvbGxMZWZ0KCk7XG4gICAgICAgIHJldHVybiB7IHRvcDogdG9wLCBsZWZ0OiBsZWZ0IH07XG4gICAgfVxufVxuZXhwb3J0IGNvbnN0IHR5cGVMb29rdXAgPSBuZXcgVHlwZUxvb2t1cDtcbiIsIi8vIEluc3BpcmF0aW9uIDogaHR0cHM6Ly9hdG9tLmlvL3BhY2thZ2VzL2lkZS1oYXNrZWxsXHJcbi8vIGFuZCBodHRwczovL2F0b20uaW8vcGFja2FnZXMvaWRlLWZsb3dcclxuLy8gaHR0cHM6Ly9hdG9tLmlvL3BhY2thZ2VzL2F0b20tdHlwZXNjcmlwdFxyXG5pbXBvcnQge01vZGVsc30gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcclxuaW1wb3J0IHtPYnNlcnZhYmxlLCBTdWJzY3JpcHRpb259IGZyb20gXCJyeGpzXCI7XHJcbmltcG9ydCB7Q29tcG9zaXRlRGlzcG9zYWJsZSwgRGlzcG9zYWJsZSwgSURpc3Bvc2FibGV9IGZyb20gXCJ0cy1kaXNwb3NhYmxlc1wiO1xyXG5pbXBvcnQge09tbml9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xyXG5pbXBvcnQge1Rvb2x0aXBWaWV3fSBmcm9tIFwiLi4vdmlld3MvdG9vbHRpcC12aWV3XCI7XHJcbmNvbnN0ICQ6IEpRdWVyeVN0YXRpYyA9IHJlcXVpcmUoXCJqcXVlcnlcIik7XHJcbmNvbnN0IGVzY2FwZSA9IHJlcXVpcmUoXCJlc2NhcGUtaHRtbFwiKTtcclxuXHJcbmNsYXNzIFR5cGVMb29rdXAgaW1wbGVtZW50cyBJRmVhdHVyZSB7XHJcbiAgICBwcml2YXRlIGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XHJcblxyXG4gICAgcHVibGljIGFjdGl2YXRlKCkge1xyXG4gICAgICAgIGxldCB0b29sdGlwOiBUb29sdGlwO1xyXG4gICAgICAgIC8qIHRzbGludDpkaXNhYmxlOm5vLXN0cmluZy1saXRlcmFsICovXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuc3dpdGNoQWN0aXZlRWRpdG9yKChlZGl0b3IsIGNkKSA9PiB7XHJcbiAgICAgICAgICAgIC8vIHN1YnNjcmliZSBmb3IgdG9vbHRpcHNcclxuICAgICAgICAgICAgLy8gaW5zcGlyYXRpb24gOiBodHRwczovL2dpdGh1Yi5jb20vY2hhaWthMjAxMy9pZGUtaGFza2VsbFxyXG4gICAgICAgICAgICBjb25zdCBlZGl0b3JWaWV3ID0gJChhdG9tLnZpZXdzLmdldFZpZXcoZWRpdG9yKSk7XHJcbiAgICAgICAgICAgIHRvb2x0aXAgPSBuZXcgVG9vbHRpcChlZGl0b3JWaWV3LCBlZGl0b3IpO1xyXG4gICAgICAgICAgICBjZC5hZGQodG9vbHRpcCk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuYWRkVGV4dEVkaXRvckNvbW1hbmQoXCJvbW5pc2hhcnAtYXRvbTp0eXBlLWxvb2t1cFwiLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIE9tbmkuYWN0aXZlRWRpdG9yLmZpcnN0KCkuc3Vic2NyaWJlKGVkaXRvciA9PiB7XHJcbiAgICAgICAgICAgICAgICB0b29sdGlwLnNob3dFeHByZXNzaW9uVHlwZU9uQ29tbWFuZCgpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KSk7XHJcbiAgICAgICAgLyogdHNsaW50OmVuYWJsZTpuby1zdHJpbmctbGl0ZXJhbCAqL1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkaXNwb3NlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlcXVpcmVkID0gZmFsc2U7XHJcbiAgICBwdWJsaWMgdGl0bGUgPSBcIlRvb2x0aXAgTG9va3VwXCI7XHJcbiAgICBwdWJsaWMgZGVzY3JpcHRpb24gPSBcIkFkZHMgaG92ZXIgdG9vbHRpcHMgdG8gdGhlIGVkaXRvciwgYWxzbyBoYXMgYSBrZXliaW5kXCI7XHJcbn1cclxuXHJcbmNsYXNzIFRvb2x0aXAgaW1wbGVtZW50cyBJRGlzcG9zYWJsZSB7XHJcbiAgICBwcml2YXRlIGV4cHJUeXBlVG9vbHRpcDogVG9vbHRpcFZpZXcgPSBudWxsO1xyXG4gICAgcHJpdmF0ZSBrZXlkb3duOiBPYnNlcnZhYmxlPEtleWJvYXJkRXZlbnQ+O1xyXG4gICAgcHJpdmF0ZSBrZXlkb3duU3Vic2NyaXB0aW9uOiBTdWJzY3JpcHRpb247XHJcbiAgICBwcml2YXRlIHJhd1ZpZXc6IGFueTtcclxuICAgIHByaXZhdGUgZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIGVkaXRvclZpZXc6IEpRdWVyeSwgcHJpdmF0ZSBlZGl0b3I6IEF0b20uVGV4dEVkaXRvcikge1xyXG4gICAgICAgIHRoaXMucmF3VmlldyA9IGVkaXRvclZpZXdbMF07XHJcblxyXG4gICAgICAgIGNvbnN0IGNkID0gdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuXHJcbiAgICAgICAgY29uc3Qgc2Nyb2xsID0gdGhpcy5nZXRGcm9tU2hhZG93RG9tKGVkaXRvclZpZXcsIFwiLnNjcm9sbC12aWV3XCIpO1xyXG4gICAgICAgIGlmICghc2Nyb2xsWzBdKSByZXR1cm47XHJcblxyXG4gICAgICAgIC8vIHRvIGRlYm91bmNlIG1vdXNlbW92ZSBldmVudFwicyBmaXJpbmcgZm9yIHNvbWUgcmVhc29uIG9uIHNvbWUgbWFjaGluZXNcclxuICAgICAgICBsZXQgbGFzdEV4cHJUeXBlQnVmZmVyUHQ6IGFueTtcclxuXHJcbiAgICAgICAgY29uc3QgbW91c2Vtb3ZlID0gT2JzZXJ2YWJsZS5mcm9tRXZlbnQ8TW91c2VFdmVudD4oc2Nyb2xsWzBdLCBcIm1vdXNlbW92ZVwiKTtcclxuICAgICAgICBjb25zdCBtb3VzZW91dCA9IE9ic2VydmFibGUuZnJvbUV2ZW50PE1vdXNlRXZlbnQ+KHNjcm9sbFswXSwgXCJtb3VzZW91dFwiKTtcclxuICAgICAgICB0aGlzLmtleWRvd24gPSBPYnNlcnZhYmxlLmZyb21FdmVudDxLZXlib2FyZEV2ZW50PihzY3JvbGxbMF0sIFwia2V5ZG93blwiKTtcclxuXHJcbiAgICAgICAgY2QuYWRkKG1vdXNlbW92ZVxyXG4gICAgICAgICAgICAuYXVkaXRUaW1lKDIwMClcclxuICAgICAgICAgICAgLm1hcChldmVudCA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBwaXhlbFB0ID0gdGhpcy5waXhlbFBvc2l0aW9uRnJvbU1vdXNlRXZlbnQoZWRpdG9yVmlldywgZXZlbnQpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFwaXhlbFB0KVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHNjcmVlblB0ID0gZWRpdG9yLnNjcmVlblBvc2l0aW9uRm9yUGl4ZWxQb3NpdGlvbihwaXhlbFB0KTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGJ1ZmZlclB0ID0gZWRpdG9yLmJ1ZmZlclBvc2l0aW9uRm9yU2NyZWVuUG9zaXRpb24oc2NyZWVuUHQpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGxhc3RFeHByVHlwZUJ1ZmZlclB0ICYmIGxhc3RFeHByVHlwZUJ1ZmZlclB0LmlzRXF1YWwoYnVmZmVyUHQpICYmIHRoaXMuZXhwclR5cGVUb29sdGlwKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgICAgICAgICBsYXN0RXhwclR5cGVCdWZmZXJQdCA9IGJ1ZmZlclB0O1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgYnVmZmVyUHQsIGV2ZW50IH07XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC5maWx0ZXIoeiA9PiAhIXopXHJcbiAgICAgICAgICAgIC5kbygoKSA9PiB0aGlzLmhpZGVFeHByZXNzaW9uVHlwZSgpKVxyXG4gICAgICAgICAgICAuZmlsdGVyKHggPT4gdGhpcy5jaGVja1Bvc2l0aW9uKHguYnVmZmVyUHQpKVxyXG4gICAgICAgICAgICAuZG8oKCkgPT4gdGhpcy5zdWJjcmliZUtleURvd24oKSlcclxuICAgICAgICAgICAgLnN1YnNjcmliZSgoe2J1ZmZlclB0LCBldmVudH0pID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2hvd0V4cHJlc3Npb25UeXBlT25Nb3VzZU92ZXIoZXZlbnQsIGJ1ZmZlclB0KTtcclxuICAgICAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICBjZC5hZGQobW91c2VvdXQuc3Vic2NyaWJlKChlKSA9PiB0aGlzLmhpZGVFeHByZXNzaW9uVHlwZSgpKSk7XHJcblxyXG4gICAgICAgIGNkLmFkZChPbW5pLnN3aXRjaEFjdGl2ZUVkaXRvcigoZWRpdCwgaW5uZXJDZCkgPT4ge1xyXG4gICAgICAgICAgICBpbm5lckNkLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB0aGlzLmhpZGVFeHByZXNzaW9uVHlwZSgpKSk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICBjZC5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLmhpZGVFeHByZXNzaW9uVHlwZSgpO1xyXG4gICAgICAgIH0pKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHN1YmNyaWJlS2V5RG93bigpIHtcclxuICAgICAgICB0aGlzLmtleWRvd25TdWJzY3JpcHRpb24gPSB0aGlzLmtleWRvd24uc3Vic2NyaWJlKChlKSA9PiB0aGlzLmhpZGVFeHByZXNzaW9uVHlwZSgpKTtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKHRoaXMua2V5ZG93blN1YnNjcmlwdGlvbik7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHNob3dFeHByZXNzaW9uVHlwZU9uQ29tbWFuZCgpIHtcclxuICAgICAgICBpZiAodGhpcy5lZGl0b3IuY3Vyc29ycy5sZW5ndGggPCAxKSByZXR1cm47XHJcblxyXG4gICAgICAgIGNvbnN0IGJ1ZmZlclB0ID0gdGhpcy5lZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKTtcclxuXHJcbiAgICAgICAgaWYgKCF0aGlzLmNoZWNrUG9zaXRpb24oYnVmZmVyUHQpKSByZXR1cm47XHJcblxyXG4gICAgICAgIC8vIGZpbmQgb3V0IHNob3cgcG9zaXRpb25cclxuICAgICAgICBjb25zdCBvZmZzZXQgPSAodGhpcy5yYXdWaWV3LmNvbXBvbmVudC5nZXRGb250U2l6ZSgpICogYnVmZmVyUHQuY29sdW1uKSAqIDAuNztcclxuICAgICAgICBjb25zdCBzaGFkb3cgPSB0aGlzLmdldEZyb21TaGFkb3dEb20odGhpcy5lZGl0b3JWaWV3LCBcIi5jdXJzb3ItbGluZVwiKVswXTtcclxuICAgICAgICBpZiAoIXNoYWRvdykgcmV0dXJuO1xyXG4gICAgICAgIGNvbnN0IHJlY3QgPSBzaGFkb3cuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XHJcblxyXG4gICAgICAgIGNvbnN0IHRvb2x0aXBSZWN0ID0ge1xyXG4gICAgICAgICAgICBsZWZ0OiByZWN0LmxlZnQgLSBvZmZzZXQsXHJcbiAgICAgICAgICAgIHJpZ2h0OiByZWN0LmxlZnQgKyBvZmZzZXQsXHJcbiAgICAgICAgICAgIHRvcDogcmVjdC5ib3R0b20sXHJcbiAgICAgICAgICAgIGJvdHRvbTogcmVjdC5ib3R0b21cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLmhpZGVFeHByZXNzaW9uVHlwZSgpO1xyXG4gICAgICAgIHRoaXMuc3ViY3JpYmVLZXlEb3duKCk7XHJcbiAgICAgICAgdGhpcy5zaG93VG9vbFRpcChidWZmZXJQdCwgdG9vbHRpcFJlY3QpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgc2hvd0V4cHJlc3Npb25UeXBlT25Nb3VzZU92ZXIoZTogTW91c2VFdmVudCwgYnVmZmVyUHQ6IFRleHRCdWZmZXIuUG9pbnQpIHtcclxuICAgICAgICBpZiAoIU9tbmkuaXNPbikge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBJZiB3ZSBhcmUgYWxyZWFkeSBzaG93aW5nIHdlIHNob3VsZCB3YWl0IGZvciB0aGF0IHRvIGNsZWFyXHJcbiAgICAgICAgaWYgKHRoaXMuZXhwclR5cGVUb29sdGlwKSByZXR1cm47XHJcblxyXG4gICAgICAgIC8vIGZpbmQgb3V0IHNob3cgcG9zaXRpb25cclxuICAgICAgICBjb25zdCBvZmZzZXQgPSAoPGFueT50aGlzLmVkaXRvcikuZ2V0TGluZUhlaWdodEluUGl4ZWxzKCkgKiAwLjc7XHJcbiAgICAgICAgY29uc3QgdG9vbHRpcFJlY3QgPSB7XHJcbiAgICAgICAgICAgIGxlZnQ6IGUuY2xpZW50WCxcclxuICAgICAgICAgICAgcmlnaHQ6IGUuY2xpZW50WCxcclxuICAgICAgICAgICAgdG9wOiBlLmNsaWVudFkgLSBvZmZzZXQsXHJcbiAgICAgICAgICAgIGJvdHRvbTogZS5jbGllbnRZICsgb2Zmc2V0XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5zaG93VG9vbFRpcChidWZmZXJQdCwgdG9vbHRpcFJlY3QpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgY2hlY2tQb3NpdGlvbihidWZmZXJQdDogVGV4dEJ1ZmZlci5Qb2ludCkge1xyXG4gICAgICAgIGNvbnN0IGN1ckNoYXJQaXhlbFB0ID0gdGhpcy5yYXdWaWV3LnBpeGVsUG9zaXRpb25Gb3JCdWZmZXJQb3NpdGlvbihbYnVmZmVyUHQucm93LCBidWZmZXJQdC5jb2x1bW5dKTtcclxuICAgICAgICBjb25zdCBuZXh0Q2hhclBpeGVsUHQgPSB0aGlzLnJhd1ZpZXcucGl4ZWxQb3NpdGlvbkZvckJ1ZmZlclBvc2l0aW9uKFtidWZmZXJQdC5yb3csIGJ1ZmZlclB0LmNvbHVtbiArIDFdKTtcclxuXHJcbiAgICAgICAgaWYgKGN1ckNoYXJQaXhlbFB0LmxlZnQgPj0gbmV4dENoYXJQaXhlbFB0LmxlZnQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHNob3dUb29sVGlwKGJ1ZmZlclB0OiBUZXh0QnVmZmVyLlBvaW50LCB0b29sdGlwUmVjdDogYW55KSB7XHJcbiAgICAgICAgdGhpcy5leHByVHlwZVRvb2x0aXAgPSBuZXcgVG9vbHRpcFZpZXcodG9vbHRpcFJlY3QpO1xyXG5cclxuICAgICAgICAvLyBBY3R1YWxseSBtYWtlIHRoZSBwcm9ncmFtIG1hbmFnZXIgcXVlcnlcclxuICAgICAgICBPbW5pLnJlcXVlc3Qoc29sdXRpb24gPT4gc29sdXRpb24udHlwZWxvb2t1cCh7XHJcbiAgICAgICAgICAgIEluY2x1ZGVEb2N1bWVudGF0aW9uOiB0cnVlLFxyXG4gICAgICAgICAgICBMaW5lOiBidWZmZXJQdC5yb3csXHJcbiAgICAgICAgICAgIENvbHVtbjogYnVmZmVyUHQuY29sdW1uXHJcbiAgICAgICAgfSkpLnN1YnNjcmliZSgocmVzcG9uc2U6IE1vZGVscy5UeXBlTG9va3VwUmVzcG9uc2UpID0+IHtcclxuICAgICAgICAgICAgaWYgKHJlc3BvbnNlLlR5cGUgPT09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBsZXQgbWVzc2FnZSA9IGA8Yj4ke2VzY2FwZShyZXNwb25zZS5UeXBlKX08L2I+YDtcclxuICAgICAgICAgICAgaWYgKHJlc3BvbnNlLkRvY3VtZW50YXRpb24pIHtcclxuICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSBtZXNzYWdlICsgYDxici8+PGk+JHtlc2NhcGUocmVzcG9uc2UuRG9jdW1lbnRhdGlvbil9PC9pPmA7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gU29ycnkgYWJvdXQgdGhpcyBcImlmXCIuIEl0XCJzIGluIHRoZSBjb2RlIEkgY29waWVkIHNvIEkgZ3Vlc3MgaXRzIHRoZXJlIGZvciBhIHJlYXNvblxyXG4gICAgICAgICAgICBpZiAodGhpcy5leHByVHlwZVRvb2x0aXApIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZXhwclR5cGVUb29sdGlwLnVwZGF0ZVRleHQobWVzc2FnZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGlzcG9zZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgaGlkZUV4cHJlc3Npb25UeXBlKCkge1xyXG4gICAgICAgIGlmICghdGhpcy5leHByVHlwZVRvb2x0aXApIHJldHVybjtcclxuICAgICAgICB0aGlzLmV4cHJUeXBlVG9vbHRpcC5yZW1vdmUoKTtcclxuICAgICAgICB0aGlzLmV4cHJUeXBlVG9vbHRpcCA9IG51bGw7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmtleWRvd25TdWJzY3JpcHRpb24pIHtcclxuICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLnJlbW92ZSh0aGlzLmtleWRvd25TdWJzY3JpcHRpb24pO1xyXG4gICAgICAgICAgICB0aGlzLmtleWRvd25TdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcclxuICAgICAgICAgICAgdGhpcy5rZXlkb3duU3Vic2NyaXB0aW9uID0gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBnZXRGcm9tU2hhZG93RG9tKGVsZW1lbnQ6IEpRdWVyeSwgc2VsZWN0b3I6IHN0cmluZyk6IEpRdWVyeSB7XHJcbiAgICAgICAgY29uc3QgZWwgPSBlbGVtZW50WzBdO1xyXG4gICAgICAgIGlmICghKDxhbnk+ZWwpLnJvb3RFbGVtZW50KSByZXR1cm4gJChlbCk7XHJcblxyXG4gICAgICAgIGNvbnN0IGZvdW5kID0gKDxhbnk+ZWwpLnJvb3RFbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpO1xyXG4gICAgICAgIHJldHVybiAkKGZvdW5kWzBdKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHBpeGVsUG9zaXRpb25Gcm9tTW91c2VFdmVudChlZGl0b3JWaWV3OiBhbnksIGV2ZW50OiBNb3VzZUV2ZW50KSB7XHJcbiAgICAgICAgY29uc3QgY2xpZW50WCA9IGV2ZW50LmNsaWVudFgsIGNsaWVudFkgPSBldmVudC5jbGllbnRZO1xyXG4gICAgICAgIGNvbnN0IHNoYWRvdyA9IHRoaXMuZ2V0RnJvbVNoYWRvd0RvbShlZGl0b3JWaWV3LCBcIi5saW5lc1wiKVswXTtcclxuICAgICAgICBpZiAoIXNoYWRvdykgcmV0dXJuO1xyXG4gICAgICAgIGNvbnN0IGxpbmVzQ2xpZW50UmVjdCA9IHNoYWRvdy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcclxuICAgICAgICBsZXQgdG9wID0gY2xpZW50WSAtIGxpbmVzQ2xpZW50UmVjdC50b3A7XHJcbiAgICAgICAgbGV0IGxlZnQgPSBjbGllbnRYIC0gbGluZXNDbGllbnRSZWN0LmxlZnQ7XHJcbiAgICAgICAgdG9wICs9ICg8YW55PnRoaXMuZWRpdG9yKS5nZXRTY3JvbGxUb3AoKTtcclxuICAgICAgICBsZWZ0ICs9ICg8YW55PnRoaXMuZWRpdG9yKS5nZXRTY3JvbGxMZWZ0KCk7XHJcbiAgICAgICAgcmV0dXJuIHsgdG9wOiB0b3AsIGxlZnQ6IGxlZnQgfTtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IHR5cGVMb29rdXAgPSBuZXcgVHlwZUxvb2t1cDtcclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
