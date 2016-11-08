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
            var bufferPt = _ref.bufferPt,
                event = _ref.event;

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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9sb29rdXAuanMiLCJsaWIvZmVhdHVyZXMvbG9va3VwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQUNBOztBQUNBOztBQUNBOzs7O0FDS0EsSUFBTSxJQUFrQixRQUFRLFFBQVIsQ0FBbEI7QUFDTixJQUFNLFNBQVMsUUFBUSxhQUFSLENBQVQ7O0lBRU47QUFBQSwwQkFBQTs7O0FBMkJXLGFBQUEsUUFBQSxHQUFXLEtBQVgsQ0EzQlg7QUE0QlcsYUFBQSxLQUFBLEdBQVEsZ0JBQVIsQ0E1Qlg7QUE2QlcsYUFBQSxXQUFBLEdBQWMsdURBQWQsQ0E3Qlg7S0FBQTs7OzttQ0FHbUI7QUFDWCxnQkFBSSxnQkFBSixDQURXO0FBR1gsaUJBQUssVUFBTCxHQUFrQix3Q0FBbEIsQ0FIVztBQUlYLGlCQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsV0FBSyxrQkFBTCxDQUF3QixVQUFDLE1BQUQsRUFBUyxFQUFULEVBQVc7QUFHbkQsb0JBQU0sYUFBYSxFQUFFLEtBQUssS0FBTCxDQUFXLE9BQVgsQ0FBbUIsTUFBbkIsQ0FBRixDQUFiLENBSDZDO0FBSW5ELDBCQUFVLElBQUksT0FBSixDQUFZLFVBQVosRUFBd0IsTUFBeEIsQ0FBVixDQUptRDtBQUtuRCxtQkFBRyxHQUFILENBQU8sT0FBUCxFQUxtRDthQUFYLENBQTVDLEVBSlc7QUFZWCxpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLFdBQUssb0JBQUwsQ0FBMEIsNEJBQTFCLEVBQXdELFlBQUE7QUFDeEUsMkJBQUssWUFBTCxDQUFrQixLQUFsQixHQUEwQixTQUExQixDQUFvQyxrQkFBTTtBQUN0Qyw0QkFBUSwyQkFBUixHQURzQztpQkFBTixDQUFwQyxDQUR3RTthQUFBLENBQTVFLEVBWlc7Ozs7a0NBb0JEO0FBQ1YsaUJBQUssVUFBTCxDQUFnQixPQUFoQixHQURVOzs7Ozs7O0lBU2xCO0FBT0kscUJBQW9CLFVBQXBCLEVBQWdELE1BQWhELEVB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QVJrRTtBQVNsRSxtQkFBTyxFQUFFLEtBQUssR0FBTCxFQUFVLE1BQU0sSUFBTixFQUFuQixDQVRrRTs7Ozs7OztBQWFuRSxJQUFNLGtDQUFhLElBQUksVUFBSixFQUFiIiwiZmlsZSI6ImxpYi9mZWF0dXJlcy9sb29rdXAuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBPYnNlcnZhYmxlIH0gZnJvbSBcInJ4anNcIjtcbmltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUsIERpc3Bvc2FibGUgfSBmcm9tIFwidHMtZGlzcG9zYWJsZXNcIjtcbmltcG9ydCB7IE9tbmkgfSBmcm9tIFwiLi4vc2VydmVyL29tbmlcIjtcbmltcG9ydCB7IFRvb2x0aXBWaWV3IH0gZnJvbSBcIi4uL3ZpZXdzL3Rvb2x0aXAtdmlld1wiO1xuY29uc3QgJCA9IHJlcXVpcmUoXCJqcXVlcnlcIik7XG5jb25zdCBlc2NhcGUgPSByZXF1aXJlKFwiZXNjYXBlLWh0bWxcIik7XG5jbGFzcyBUeXBlTG9va3VwIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5yZXF1aXJlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLnRpdGxlID0gXCJUb29sdGlwIExvb2t1cFwiO1xuICAgICAgICB0aGlzLmRlc2NyaXB0aW9uID0gXCJBZGRzIGhvdmVyIHRvb2x0aXBzIHRvIHRoZSBlZGl0b3IsIGFsc28gaGFzIGEga2V5YmluZFwiO1xuICAgIH1cbiAgICBhY3RpdmF0ZSgpIHtcbiAgICAgICAgbGV0IHRvb2x0aXA7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5zd2l0Y2hBY3RpdmVFZGl0b3IoKGVkaXRvciwgY2QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGVkaXRvclZpZXcgPSAkKGF0b20udmlld3MuZ2V0VmlldyhlZGl0b3IpKTtcbiAgICAgICAgICAgIHRvb2x0aXAgPSBuZXcgVG9vbHRpcChlZGl0b3JWaWV3LCBlZGl0b3IpO1xuICAgICAgICAgICAgY2QuYWRkKHRvb2x0aXApO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5hZGRUZXh0RWRpdG9yQ29tbWFuZChcIm9tbmlzaGFycC1hdG9tOnR5cGUtbG9va3VwXCIsICgpID0+IHtcbiAgICAgICAgICAgIE9tbmkuYWN0aXZlRWRpdG9yLmZpcnN0KCkuc3Vic2NyaWJlKGVkaXRvciA9PiB7XG4gICAgICAgICAgICAgICAgdG9vbHRpcC5zaG93RXhwcmVzc2lvblR5cGVPbkNvbW1hbmQoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KSk7XG4gICAgfVxuICAgIGRpc3Bvc2UoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfVxufVxuY2xhc3MgVG9vbHRpcCB7XG4gICAgY29uc3RydWN0b3IoZWRpdG9yVmlldywgZWRpdG9yKSB7XG4gICAgICAgIHRoaXMuZWRpdG9yVmlldyA9IGVkaXRvclZpZXc7XG4gICAgICAgIHRoaXMuZWRpdG9yID0gZWRpdG9yO1xuICAgICAgICB0aGlzLmV4cHJUeXBlVG9vbHRpcCA9IG51bGw7XG4gICAgICAgIHRoaXMucmF3VmlldyA9IGVkaXRvclZpZXdbMF07XG4gICAgICAgIGNvbnN0IGNkID0gdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgY29uc3Qgc2Nyb2xsID0gdGhpcy5nZXRGcm9tU2hhZG93RG9tKGVkaXRvclZpZXcsIFwiLnNjcm9sbC12aWV3XCIpO1xuICAgICAgICBpZiAoIXNjcm9sbFswXSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgbGV0IGxhc3RFeHByVHlwZUJ1ZmZlclB0O1xuICAgICAgICBjb25zdCBtb3VzZW1vdmUgPSBPYnNlcnZhYmxlLmZyb21FdmVudChzY3JvbGxbMF0sIFwibW91c2Vtb3ZlXCIpO1xuICAgICAgICBjb25zdCBtb3VzZW91dCA9IE9ic2VydmFibGUuZnJvbUV2ZW50KHNjcm9sbFswXSwgXCJtb3VzZW91dFwiKTtcbiAgICAgICAgdGhpcy5rZXlkb3duID0gT2JzZXJ2YWJsZS5mcm9tRXZlbnQoc2Nyb2xsWzBdLCBcImtleWRvd25cIik7XG4gICAgICAgIGNkLmFkZChtb3VzZW1vdmVcbiAgICAgICAgICAgIC5hdWRpdFRpbWUoMjAwKVxuICAgICAgICAgICAgLm1hcChldmVudCA9PiB7XG4gICAgICAgICAgICBjb25zdCBwaXhlbFB0ID0gdGhpcy5waXhlbFBvc2l0aW9uRnJvbU1vdXNlRXZlbnQoZWRpdG9yVmlldywgZXZlbnQpO1xuICAgICAgICAgICAgaWYgKCFwaXhlbFB0KVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIGNvbnN0IHNjcmVlblB0ID0gZWRpdG9yLnNjcmVlblBvc2l0aW9uRm9yUGl4ZWxQb3NpdGlvbihwaXhlbFB0KTtcbiAgICAgICAgICAgIGNvbnN0IGJ1ZmZlclB0ID0gZWRpdG9yLmJ1ZmZlclBvc2l0aW9uRm9yU2NyZWVuUG9zaXRpb24oc2NyZWVuUHQpO1xuICAgICAgICAgICAgaWYgKGxhc3RFeHByVHlwZUJ1ZmZlclB0ICYmIGxhc3RFeHByVHlwZUJ1ZmZlclB0LmlzRXF1YWwoYnVmZmVyUHQpICYmIHRoaXMuZXhwclR5cGVUb29sdGlwKVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIGxhc3RFeHByVHlwZUJ1ZmZlclB0ID0gYnVmZmVyUHQ7XG4gICAgICAgICAgICByZXR1cm4geyBidWZmZXJQdCwgZXZlbnQgfTtcbiAgICAgICAgfSlcbiAgICAgICAgICAgIC5maWx0ZXIoeiA9PiAhIXopXG4gICAgICAgICAgICAuZG8oKCkgPT4gdGhpcy5oaWRlRXhwcmVzc2lvblR5cGUoKSlcbiAgICAgICAgICAgIC5maWx0ZXIoeCA9PiB0aGlzLmNoZWNrUG9zaXRpb24oeC5idWZmZXJQdCkpXG4gICAgICAgICAgICAuZG8oKCkgPT4gdGhpcy5zdWJjcmliZUtleURvd24oKSlcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoKHsgYnVmZmVyUHQsIGV2ZW50IH0pID0+IHtcbiAgICAgICAgICAgIHRoaXMuc2hvd0V4cHJlc3Npb25UeXBlT25Nb3VzZU92ZXIoZXZlbnQsIGJ1ZmZlclB0KTtcbiAgICAgICAgfSkpO1xuICAgICAgICBjZC5hZGQobW91c2VvdXQuc3Vic2NyaWJlKChlKSA9PiB0aGlzLmhpZGVFeHByZXNzaW9uVHlwZSgpKSk7XG4gICAgICAgIGNkLmFkZChPbW5pLnN3aXRjaEFjdGl2ZUVkaXRvcigoZWRpdCwgaW5uZXJDZCkgPT4ge1xuICAgICAgICAgICAgaW5uZXJDZC5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4gdGhpcy5oaWRlRXhwcmVzc2lvblR5cGUoKSkpO1xuICAgICAgICB9KSk7XG4gICAgICAgIGNkLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmhpZGVFeHByZXNzaW9uVHlwZSgpO1xuICAgICAgICB9KSk7XG4gICAgfVxuICAgIHN1YmNyaWJlS2V5RG93bigpIHtcbiAgICAgICAgdGhpcy5rZXlkb3duU3Vic2NyaXB0aW9uID0gdGhpcy5rZXlkb3duLnN1YnNjcmliZSgoZSkgPT4gdGhpcy5oaWRlRXhwcmVzc2lvblR5cGUoKSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQodGhpcy5rZXlkb3duU3Vic2NyaXB0aW9uKTtcbiAgICB9XG4gICAgc2hvd0V4cHJlc3Npb25UeXBlT25Db21tYW5kKCkge1xuICAgICAgICBpZiAodGhpcy5lZGl0b3IuY3Vyc29ycy5sZW5ndGggPCAxKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zdCBidWZmZXJQdCA9IHRoaXMuZWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKCk7XG4gICAgICAgIGlmICghdGhpcy5jaGVja1Bvc2l0aW9uKGJ1ZmZlclB0KSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3Qgb2Zmc2V0ID0gKHRoaXMucmF3Vmlldy5jb21wb25lbnQuZ2V0Rm9udFNpemUoKSAqIGJ1ZmZlclB0LmNvbHVtbikgKiAwLjc7XG4gICAgICAgIGNvbnN0IHNoYWRvdyA9IHRoaXMuZ2V0RnJvbVNoYWRvd0RvbSh0aGlzLmVkaXRvclZpZXcsIFwiLmN1cnNvci1saW5lXCIpWzBdO1xuICAgICAgICBpZiAoIXNoYWRvdylcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3QgcmVjdCA9IHNoYWRvdy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgY29uc3QgdG9vbHRpcFJlY3QgPSB7XG4gICAgICAgICAgICBsZWZ0OiByZWN0LmxlZnQgLSBvZmZzZXQsXG4gICAgICAgICAgICByaWdodDogcmVjdC5sZWZ0ICsgb2Zmc2V0LFxuICAgICAgICAgICAgdG9wOiByZWN0LmJvdHRvbSxcbiAgICAgICAgICAgIGJvdHRvbTogcmVjdC5ib3R0b21cbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5oaWRlRXhwcmVzc2lvblR5cGUoKTtcbiAgICAgICAgdGhpcy5zdWJjcmliZUtleURvd24oKTtcbiAgICAgICAgdGhpcy5zaG93VG9vbFRpcChidWZmZXJQdCwgdG9vbHRpcFJlY3QpO1xuICAgIH1cbiAgICBzaG93RXhwcmVzc2lvblR5cGVPbk1vdXNlT3ZlcihlLCBidWZmZXJQdCkge1xuICAgICAgICBpZiAoIU9tbmkuaXNPbikge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmV4cHJUeXBlVG9vbHRpcClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3Qgb2Zmc2V0ID0gdGhpcy5lZGl0b3IuZ2V0TGluZUhlaWdodEluUGl4ZWxzKCkgKiAwLjc7XG4gICAgICAgIGNvbnN0IHRvb2x0aXBSZWN0ID0ge1xuICAgICAgICAgICAgbGVmdDogZS5jbGllbnRYLFxuICAgICAgICAgICAgcmlnaHQ6IGUuY2xpZW50WCxcbiAgICAgICAgICAgIHRvcDogZS5jbGllbnRZIC0gb2Zmc2V0LFxuICAgICAgICAgICAgYm90dG9tOiBlLmNsaWVudFkgKyBvZmZzZXRcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5zaG93VG9vbFRpcChidWZmZXJQdCwgdG9vbHRpcFJlY3QpO1xuICAgIH1cbiAgICBjaGVja1Bvc2l0aW9uKGJ1ZmZlclB0KSB7XG4gICAgICAgIGNvbnN0IGN1ckNoYXJQaXhlbFB0ID0gdGhpcy5yYXdWaWV3LnBpeGVsUG9zaXRpb25Gb3JCdWZmZXJQb3NpdGlvbihbYnVmZmVyUHQucm93LCBidWZmZXJQdC5jb2x1bW5dKTtcbiAgICAgICAgY29uc3QgbmV4dENoYXJQaXhlbFB0ID0gdGhpcy5yYXdWaWV3LnBpeGVsUG9zaXRpb25Gb3JCdWZmZXJQb3NpdGlvbihbYnVmZmVyUHQucm93LCBidWZmZXJQdC5jb2x1bW4gKyAxXSk7XG4gICAgICAgIGlmIChjdXJDaGFyUGl4ZWxQdC5sZWZ0ID49IG5leHRDaGFyUGl4ZWxQdC5sZWZ0KSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBzaG93VG9vbFRpcChidWZmZXJQdCwgdG9vbHRpcFJlY3QpIHtcbiAgICAgICAgdGhpcy5leHByVHlwZVRvb2x0aXAgPSBuZXcgVG9vbHRpcFZpZXcodG9vbHRpcFJlY3QpO1xuICAgICAgICBPbW5pLnJlcXVlc3Qoc29sdXRpb24gPT4gc29sdXRpb24udHlwZWxvb2t1cCh7XG4gICAgICAgICAgICBJbmNsdWRlRG9jdW1lbnRhdGlvbjogdHJ1ZSxcbiAgICAgICAgICAgIExpbmU6IGJ1ZmZlclB0LnJvdyxcbiAgICAgICAgICAgIENvbHVtbjogYnVmZmVyUHQuY29sdW1uXG4gICAgICAgIH0pKS5zdWJzY3JpYmUoKHJlc3BvbnNlKSA9PiB7XG4gICAgICAgICAgICBpZiAocmVzcG9uc2UuVHlwZSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldCBtZXNzYWdlID0gYDxiPiR7ZXNjYXBlKHJlc3BvbnNlLlR5cGUpfTwvYj5gO1xuICAgICAgICAgICAgaWYgKHJlc3BvbnNlLkRvY3VtZW50YXRpb24pIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlID0gbWVzc2FnZSArIGA8YnIvPjxpPiR7ZXNjYXBlKHJlc3BvbnNlLkRvY3VtZW50YXRpb24pfTwvaT5gO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMuZXhwclR5cGVUb29sdGlwKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5leHByVHlwZVRvb2x0aXAudXBkYXRlVGV4dChtZXNzYWdlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGRpc3Bvc2UoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfVxuICAgIGhpZGVFeHByZXNzaW9uVHlwZSgpIHtcbiAgICAgICAgaWYgKCF0aGlzLmV4cHJUeXBlVG9vbHRpcClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdGhpcy5leHByVHlwZVRvb2x0aXAucmVtb3ZlKCk7XG4gICAgICAgIHRoaXMuZXhwclR5cGVUb29sdGlwID0gbnVsbDtcbiAgICAgICAgaWYgKHRoaXMua2V5ZG93blN1YnNjcmlwdGlvbikge1xuICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLnJlbW92ZSh0aGlzLmtleWRvd25TdWJzY3JpcHRpb24pO1xuICAgICAgICAgICAgdGhpcy5rZXlkb3duU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgICAgICAgICB0aGlzLmtleWRvd25TdWJzY3JpcHRpb24gPSBudWxsO1xuICAgICAgICB9XG4gICAgfVxuICAgIGdldEZyb21TaGFkb3dEb20oZWxlbWVudCwgc2VsZWN0b3IpIHtcbiAgICAgICAgY29uc3QgZWwgPSBlbGVtZW50WzBdO1xuICAgICAgICBpZiAoIWVsLnJvb3RFbGVtZW50KVxuICAgICAgICAgICAgcmV0dXJuICQoZWwpO1xuICAgICAgICBjb25zdCBmb3VuZCA9IGVsLnJvb3RFbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpO1xuICAgICAgICByZXR1cm4gJChmb3VuZFswXSk7XG4gICAgfVxuICAgIHBpeGVsUG9zaXRpb25Gcm9tTW91c2VFdmVudChlZGl0b3JWaWV3LCBldmVudCkge1xuICAgICAgICBjb25zdCBjbGllbnRYID0gZXZlbnQuY2xpZW50WCwgY2xpZW50WSA9IGV2ZW50LmNsaWVudFk7XG4gICAgICAgIGNvbnN0IHNoYWRvdyA9IHRoaXMuZ2V0RnJvbVNoYWRvd0RvbShlZGl0b3JWaWV3LCBcIi5saW5lc1wiKVswXTtcbiAgICAgICAgaWYgKCFzaGFkb3cpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNvbnN0IGxpbmVzQ2xpZW50UmVjdCA9IHNoYWRvdy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgbGV0IHRvcCA9IGNsaWVudFkgLSBsaW5lc0NsaWVudFJlY3QudG9wO1xuICAgICAgICBsZXQgbGVmdCA9IGNsaWVudFggLSBsaW5lc0NsaWVudFJlY3QubGVmdDtcbiAgICAgICAgdG9wICs9IHRoaXMuZWRpdG9yLmdldFNjcm9sbFRvcCgpO1xuICAgICAgICBsZWZ0ICs9IHRoaXMuZWRpdG9yLmdldFNjcm9sbExlZnQoKTtcbiAgICAgICAgcmV0dXJuIHsgdG9wOiB0b3AsIGxlZnQ6IGxlZnQgfTtcbiAgICB9XG59XG5leHBvcnQgY29uc3QgdHlwZUxvb2t1cCA9IG5ldyBUeXBlTG9va3VwO1xuIiwiLy8gSW5zcGlyYXRpb24gOiBodHRwczovL2F0b20uaW8vcGFja2FnZXMvaWRlLWhhc2tlbGxcclxuLy8gYW5kIGh0dHBzOi8vYXRvbS5pby9wYWNrYWdlcy9pZGUtZmxvd1xyXG4vLyBodHRwczovL2F0b20uaW8vcGFja2FnZXMvYXRvbS10eXBlc2NyaXB0XHJcbmltcG9ydCB7TW9kZWxzfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xyXG5pbXBvcnQge09ic2VydmFibGUsIFN1YnNjcmlwdGlvbn0gZnJvbSBcInJ4anNcIjtcclxuaW1wb3J0IHtDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlLCBJRGlzcG9zYWJsZX0gZnJvbSBcInRzLWRpc3Bvc2FibGVzXCI7XHJcbmltcG9ydCB7T21uaX0gZnJvbSBcIi4uL3NlcnZlci9vbW5pXCI7XHJcbmltcG9ydCB7VG9vbHRpcFZpZXd9IGZyb20gXCIuLi92aWV3cy90b29sdGlwLXZpZXdcIjtcclxuY29uc3QgJDogSlF1ZXJ5U3RhdGljID0gcmVxdWlyZShcImpxdWVyeVwiKTtcclxuY29uc3QgZXNjYXBlID0gcmVxdWlyZShcImVzY2FwZS1odG1sXCIpO1xyXG5cclxuY2xhc3MgVHlwZUxvb2t1cCBpbXBsZW1lbnRzIElGZWF0dXJlIHtcclxuICAgIHByaXZhdGUgZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxuXHJcbiAgICBwdWJsaWMgYWN0aXZhdGUoKSB7XHJcbiAgICAgICAgbGV0IHRvb2x0aXA6IFRvb2x0aXA7XHJcbiAgICAgICAgLyogdHNsaW50OmRpc2FibGU6bm8tc3RyaW5nLWxpdGVyYWwgKi9cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5zd2l0Y2hBY3RpdmVFZGl0b3IoKGVkaXRvciwgY2QpID0+IHtcclxuICAgICAgICAgICAgLy8gc3Vic2NyaWJlIGZvciB0b29sdGlwc1xyXG4gICAgICAgICAgICAvLyBpbnNwaXJhdGlvbiA6IGh0dHBzOi8vZ2l0aHViLmNvbS9jaGFpa2EyMDEzL2lkZS1oYXNrZWxsXHJcbiAgICAgICAgICAgIGNvbnN0IGVkaXRvclZpZXcgPSAkKGF0b20udmlld3MuZ2V0VmlldyhlZGl0b3IpKTtcclxuICAgICAgICAgICAgdG9vbHRpcCA9IG5ldyBUb29sdGlwKGVkaXRvclZpZXcsIGVkaXRvcik7XHJcbiAgICAgICAgICAgIGNkLmFkZCh0b29sdGlwKTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5hZGRUZXh0RWRpdG9yQ29tbWFuZChcIm9tbmlzaGFycC1hdG9tOnR5cGUtbG9va3VwXCIsICgpID0+IHtcclxuICAgICAgICAgICAgT21uaS5hY3RpdmVFZGl0b3IuZmlyc3QoKS5zdWJzY3JpYmUoZWRpdG9yID0+IHtcclxuICAgICAgICAgICAgICAgIHRvb2x0aXAuc2hvd0V4cHJlc3Npb25UeXBlT25Db21tYW5kKCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pKTtcclxuICAgICAgICAvKiB0c2xpbnQ6ZW5hYmxlOm5vLXN0cmluZy1saXRlcmFsICovXHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVxdWlyZWQgPSBmYWxzZTtcclxuICAgIHB1YmxpYyB0aXRsZSA9IFwiVG9vbHRpcCBMb29rdXBcIjtcclxuICAgIHB1YmxpYyBkZXNjcmlwdGlvbiA9IFwiQWRkcyBob3ZlciB0b29sdGlwcyB0byB0aGUgZWRpdG9yLCBhbHNvIGhhcyBhIGtleWJpbmRcIjtcclxufVxyXG5cclxuY2xhc3MgVG9vbHRpcCBpbXBsZW1lbnRzIElEaXNwb3NhYmxlIHtcclxuICAgIHByaXZhdGUgZXhwclR5cGVUb29sdGlwOiBUb29sdGlwVmlldyA9IG51bGw7XHJcbiAgICBwcml2YXRlIGtleWRvd246IE9ic2VydmFibGU8S2V5Ym9hcmRFdmVudD47XHJcbiAgICBwcml2YXRlIGtleWRvd25TdWJzY3JpcHRpb246IFN1YnNjcmlwdGlvbjtcclxuICAgIHByaXZhdGUgcmF3VmlldzogYW55O1xyXG4gICAgcHJpdmF0ZSBkaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgZWRpdG9yVmlldzogSlF1ZXJ5LCBwcml2YXRlIGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yKSB7XHJcbiAgICAgICAgdGhpcy5yYXdWaWV3ID0gZWRpdG9yVmlld1swXTtcclxuXHJcbiAgICAgICAgY29uc3QgY2QgPSB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG5cclxuICAgICAgICBjb25zdCBzY3JvbGwgPSB0aGlzLmdldEZyb21TaGFkb3dEb20oZWRpdG9yVmlldywgXCIuc2Nyb2xsLXZpZXdcIik7XHJcbiAgICAgICAgaWYgKCFzY3JvbGxbMF0pIHJldHVybjtcclxuXHJcbiAgICAgICAgLy8gdG8gZGVib3VuY2UgbW91c2Vtb3ZlIGV2ZW50XCJzIGZpcmluZyBmb3Igc29tZSByZWFzb24gb24gc29tZSBtYWNoaW5lc1xyXG4gICAgICAgIGxldCBsYXN0RXhwclR5cGVCdWZmZXJQdDogYW55O1xyXG5cclxuICAgICAgICBjb25zdCBtb3VzZW1vdmUgPSBPYnNlcnZhYmxlLmZyb21FdmVudDxNb3VzZUV2ZW50PihzY3JvbGxbMF0sIFwibW91c2Vtb3ZlXCIpO1xyXG4gICAgICAgIGNvbnN0IG1vdXNlb3V0ID0gT2JzZXJ2YWJsZS5mcm9tRXZlbnQ8TW91c2VFdmVudD4oc2Nyb2xsWzBdLCBcIm1vdXNlb3V0XCIpO1xyXG4gICAgICAgIHRoaXMua2V5ZG93biA9IE9ic2VydmFibGUuZnJvbUV2ZW50PEtleWJvYXJkRXZlbnQ+KHNjcm9sbFswXSwgXCJrZXlkb3duXCIpO1xyXG5cclxuICAgICAgICBjZC5hZGQobW91c2Vtb3ZlXHJcbiAgICAgICAgICAgIC5hdWRpdFRpbWUoMjAwKVxyXG4gICAgICAgICAgICAubWFwKGV2ZW50ID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHBpeGVsUHQgPSB0aGlzLnBpeGVsUG9zaXRpb25Gcm9tTW91c2VFdmVudChlZGl0b3JWaWV3LCBldmVudCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXBpeGVsUHQpXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgY29uc3Qgc2NyZWVuUHQgPSBlZGl0b3Iuc2NyZWVuUG9zaXRpb25Gb3JQaXhlbFBvc2l0aW9uKHBpeGVsUHQpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgYnVmZmVyUHQgPSBlZGl0b3IuYnVmZmVyUG9zaXRpb25Gb3JTY3JlZW5Qb3NpdGlvbihzY3JlZW5QdCk7XHJcbiAgICAgICAgICAgICAgICBpZiAobGFzdEV4cHJUeXBlQnVmZmVyUHQgJiYgbGFzdEV4cHJUeXBlQnVmZmVyUHQuaXNFcXVhbChidWZmZXJQdCkgJiYgdGhpcy5leHByVHlwZVRvb2x0aXApXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICAgICAgICAgIGxhc3RFeHByVHlwZUJ1ZmZlclB0ID0gYnVmZmVyUHQ7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4geyBidWZmZXJQdCwgZXZlbnQgfTtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgLmZpbHRlcih6ID0+ICEheilcclxuICAgICAgICAgICAgLmRvKCgpID0+IHRoaXMuaGlkZUV4cHJlc3Npb25UeXBlKCkpXHJcbiAgICAgICAgICAgIC5maWx0ZXIoeCA9PiB0aGlzLmNoZWNrUG9zaXRpb24oeC5idWZmZXJQdCkpXHJcbiAgICAgICAgICAgIC5kbygoKSA9PiB0aGlzLnN1YmNyaWJlS2V5RG93bigpKVxyXG4gICAgICAgICAgICAuc3Vic2NyaWJlKCh7YnVmZmVyUHQsIGV2ZW50fSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zaG93RXhwcmVzc2lvblR5cGVPbk1vdXNlT3ZlcihldmVudCwgYnVmZmVyUHQpO1xyXG4gICAgICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIGNkLmFkZChtb3VzZW91dC5zdWJzY3JpYmUoKGUpID0+IHRoaXMuaGlkZUV4cHJlc3Npb25UeXBlKCkpKTtcclxuXHJcbiAgICAgICAgY2QuYWRkKE9tbmkuc3dpdGNoQWN0aXZlRWRpdG9yKChlZGl0LCBpbm5lckNkKSA9PiB7XHJcbiAgICAgICAgICAgIGlubmVyQ2QuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHRoaXMuaGlkZUV4cHJlc3Npb25UeXBlKCkpKTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIGNkLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuaGlkZUV4cHJlc3Npb25UeXBlKCk7XHJcbiAgICAgICAgfSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgc3ViY3JpYmVLZXlEb3duKCkge1xyXG4gICAgICAgIHRoaXMua2V5ZG93blN1YnNjcmlwdGlvbiA9IHRoaXMua2V5ZG93bi5zdWJzY3JpYmUoKGUpID0+IHRoaXMuaGlkZUV4cHJlc3Npb25UeXBlKCkpO1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQodGhpcy5rZXlkb3duU3Vic2NyaXB0aW9uKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2hvd0V4cHJlc3Npb25UeXBlT25Db21tYW5kKCkge1xyXG4gICAgICAgIGlmICh0aGlzLmVkaXRvci5jdXJzb3JzLmxlbmd0aCA8IDEpIHJldHVybjtcclxuXHJcbiAgICAgICAgY29uc3QgYnVmZmVyUHQgPSB0aGlzLmVkaXRvci5nZXRDdXJzb3JCdWZmZXJQb3NpdGlvbigpO1xyXG5cclxuICAgICAgICBpZiAoIXRoaXMuY2hlY2tQb3NpdGlvbihidWZmZXJQdCkpIHJldHVybjtcclxuXHJcbiAgICAgICAgLy8gZmluZCBvdXQgc2hvdyBwb3NpdGlvblxyXG4gICAgICAgIGNvbnN0IG9mZnNldCA9ICh0aGlzLnJhd1ZpZXcuY29tcG9uZW50LmdldEZvbnRTaXplKCkgKiBidWZmZXJQdC5jb2x1bW4pICogMC43O1xyXG4gICAgICAgIGNvbnN0IHNoYWRvdyA9IHRoaXMuZ2V0RnJvbVNoYWRvd0RvbSh0aGlzLmVkaXRvclZpZXcsIFwiLmN1cnNvci1saW5lXCIpWzBdO1xyXG4gICAgICAgIGlmICghc2hhZG93KSByZXR1cm47XHJcbiAgICAgICAgY29uc3QgcmVjdCA9IHNoYWRvdy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcclxuXHJcbiAgICAgICAgY29uc3QgdG9vbHRpcFJlY3QgPSB7XHJcbiAgICAgICAgICAgIGxlZnQ6IHJlY3QubGVmdCAtIG9mZnNldCxcclxuICAgICAgICAgICAgcmlnaHQ6IHJlY3QubGVmdCArIG9mZnNldCxcclxuICAgICAgICAgICAgdG9wOiByZWN0LmJvdHRvbSxcclxuICAgICAgICAgICAgYm90dG9tOiByZWN0LmJvdHRvbVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuaGlkZUV4cHJlc3Npb25UeXBlKCk7XHJcbiAgICAgICAgdGhpcy5zdWJjcmliZUtleURvd24oKTtcclxuICAgICAgICB0aGlzLnNob3dUb29sVGlwKGJ1ZmZlclB0LCB0b29sdGlwUmVjdCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBzaG93RXhwcmVzc2lvblR5cGVPbk1vdXNlT3ZlcihlOiBNb3VzZUV2ZW50LCBidWZmZXJQdDogVGV4dEJ1ZmZlci5Qb2ludCkge1xyXG4gICAgICAgIGlmICghT21uaS5pc09uKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIElmIHdlIGFyZSBhbHJlYWR5IHNob3dpbmcgd2Ugc2hvdWxkIHdhaXQgZm9yIHRoYXQgdG8gY2xlYXJcclxuICAgICAgICBpZiAodGhpcy5leHByVHlwZVRvb2x0aXApIHJldHVybjtcclxuXHJcbiAgICAgICAgLy8gZmluZCBvdXQgc2hvdyBwb3NpdGlvblxyXG4gICAgICAgIGNvbnN0IG9mZnNldCA9ICg8YW55PnRoaXMuZWRpdG9yKS5nZXRMaW5lSGVpZ2h0SW5QaXhlbHMoKSAqIDAuNztcclxuICAgICAgICBjb25zdCB0b29sdGlwUmVjdCA9IHtcclxuICAgICAgICAgICAgbGVmdDogZS5jbGllbnRYLFxyXG4gICAgICAgICAgICByaWdodDogZS5jbGllbnRYLFxyXG4gICAgICAgICAgICB0b3A6IGUuY2xpZW50WSAtIG9mZnNldCxcclxuICAgICAgICAgICAgYm90dG9tOiBlLmNsaWVudFkgKyBvZmZzZXRcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLnNob3dUb29sVGlwKGJ1ZmZlclB0LCB0b29sdGlwUmVjdCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBjaGVja1Bvc2l0aW9uKGJ1ZmZlclB0OiBUZXh0QnVmZmVyLlBvaW50KSB7XHJcbiAgICAgICAgY29uc3QgY3VyQ2hhclBpeGVsUHQgPSB0aGlzLnJhd1ZpZXcucGl4ZWxQb3NpdGlvbkZvckJ1ZmZlclBvc2l0aW9uKFtidWZmZXJQdC5yb3csIGJ1ZmZlclB0LmNvbHVtbl0pO1xyXG4gICAgICAgIGNvbnN0IG5leHRDaGFyUGl4ZWxQdCA9IHRoaXMucmF3Vmlldy5waXhlbFBvc2l0aW9uRm9yQnVmZmVyUG9zaXRpb24oW2J1ZmZlclB0LnJvdywgYnVmZmVyUHQuY29sdW1uICsgMV0pO1xyXG5cclxuICAgICAgICBpZiAoY3VyQ2hhclBpeGVsUHQubGVmdCA+PSBuZXh0Q2hhclBpeGVsUHQubGVmdCkge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgc2hvd1Rvb2xUaXAoYnVmZmVyUHQ6IFRleHRCdWZmZXIuUG9pbnQsIHRvb2x0aXBSZWN0OiBhbnkpIHtcclxuICAgICAgICB0aGlzLmV4cHJUeXBlVG9vbHRpcCA9IG5ldyBUb29sdGlwVmlldyh0b29sdGlwUmVjdCk7XHJcblxyXG4gICAgICAgIC8vIEFjdHVhbGx5IG1ha2UgdGhlIHByb2dyYW0gbWFuYWdlciBxdWVyeVxyXG4gICAgICAgIE9tbmkucmVxdWVzdChzb2x1dGlvbiA9PiBzb2x1dGlvbi50eXBlbG9va3VwKHtcclxuICAgICAgICAgICAgSW5jbHVkZURvY3VtZW50YXRpb246IHRydWUsXHJcbiAgICAgICAgICAgIExpbmU6IGJ1ZmZlclB0LnJvdyxcclxuICAgICAgICAgICAgQ29sdW1uOiBidWZmZXJQdC5jb2x1bW5cclxuICAgICAgICB9KSkuc3Vic2NyaWJlKChyZXNwb25zZTogTW9kZWxzLlR5cGVMb29rdXBSZXNwb25zZSkgPT4ge1xyXG4gICAgICAgICAgICBpZiAocmVzcG9uc2UuVHlwZSA9PT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGxldCBtZXNzYWdlID0gYDxiPiR7ZXNjYXBlKHJlc3BvbnNlLlR5cGUpfTwvYj5gO1xyXG4gICAgICAgICAgICBpZiAocmVzcG9uc2UuRG9jdW1lbnRhdGlvbikge1xyXG4gICAgICAgICAgICAgICAgbWVzc2FnZSA9IG1lc3NhZ2UgKyBgPGJyLz48aT4ke2VzY2FwZShyZXNwb25zZS5Eb2N1bWVudGF0aW9uKX08L2k+YDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBTb3JyeSBhYm91dCB0aGlzIFwiaWZcIi4gSXRcInMgaW4gdGhlIGNvZGUgSSBjb3BpZWQgc28gSSBndWVzcyBpdHMgdGhlcmUgZm9yIGEgcmVhc29uXHJcbiAgICAgICAgICAgIGlmICh0aGlzLmV4cHJUeXBlVG9vbHRpcCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5leHByVHlwZVRvb2x0aXAudXBkYXRlVGV4dChtZXNzYWdlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkaXNwb3NlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBoaWRlRXhwcmVzc2lvblR5cGUoKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLmV4cHJUeXBlVG9vbHRpcCkgcmV0dXJuO1xyXG4gICAgICAgIHRoaXMuZXhwclR5cGVUb29sdGlwLnJlbW92ZSgpO1xyXG4gICAgICAgIHRoaXMuZXhwclR5cGVUb29sdGlwID0gbnVsbDtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMua2V5ZG93blN1YnNjcmlwdGlvbikge1xyXG4gICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUucmVtb3ZlKHRoaXMua2V5ZG93blN1YnNjcmlwdGlvbik7XHJcbiAgICAgICAgICAgIHRoaXMua2V5ZG93blN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xyXG4gICAgICAgICAgICB0aGlzLmtleWRvd25TdWJzY3JpcHRpb24gPSBudWxsO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGdldEZyb21TaGFkb3dEb20oZWxlbWVudDogSlF1ZXJ5LCBzZWxlY3Rvcjogc3RyaW5nKTogSlF1ZXJ5IHtcclxuICAgICAgICBjb25zdCBlbCA9IGVsZW1lbnRbMF07XHJcbiAgICAgICAgaWYgKCEoPGFueT5lbCkucm9vdEVsZW1lbnQpIHJldHVybiAkKGVsKTtcclxuXHJcbiAgICAgICAgY29uc3QgZm91bmQgPSAoPGFueT5lbCkucm9vdEVsZW1lbnQucXVlcnlTZWxlY3RvckFsbChzZWxlY3Rvcik7XHJcbiAgICAgICAgcmV0dXJuICQoZm91bmRbMF0pO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgcGl4ZWxQb3NpdGlvbkZyb21Nb3VzZUV2ZW50KGVkaXRvclZpZXc6IGFueSwgZXZlbnQ6IE1vdXNlRXZlbnQpIHtcclxuICAgICAgICBjb25zdCBjbGllbnRYID0gZXZlbnQuY2xpZW50WCwgY2xpZW50WSA9IGV2ZW50LmNsaWVudFk7XHJcbiAgICAgICAgY29uc3Qgc2hhZG93ID0gdGhpcy5nZXRGcm9tU2hhZG93RG9tKGVkaXRvclZpZXcsIFwiLmxpbmVzXCIpWzBdO1xyXG4gICAgICAgIGlmICghc2hhZG93KSByZXR1cm47XHJcbiAgICAgICAgY29uc3QgbGluZXNDbGllbnRSZWN0ID0gc2hhZG93LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xyXG4gICAgICAgIGxldCB0b3AgPSBjbGllbnRZIC0gbGluZXNDbGllbnRSZWN0LnRvcDtcclxuICAgICAgICBsZXQgbGVmdCA9IGNsaWVudFggLSBsaW5lc0NsaWVudFJlY3QubGVmdDtcclxuICAgICAgICB0b3AgKz0gKDxhbnk+dGhpcy5lZGl0b3IpLmdldFNjcm9sbFRvcCgpO1xyXG4gICAgICAgIGxlZnQgKz0gKDxhbnk+dGhpcy5lZGl0b3IpLmdldFNjcm9sbExlZnQoKTtcclxuICAgICAgICByZXR1cm4geyB0b3A6IHRvcCwgbGVmdDogbGVmdCB9O1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgY29uc3QgdHlwZUxvb2t1cCA9IG5ldyBUeXBlTG9va3VwO1xyXG4iXX0=
