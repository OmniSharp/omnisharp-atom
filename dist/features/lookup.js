'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.typeLookup = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _rxjs = require('rxjs');

var _tsDisposables = require('ts-disposables');

var _omni = require('../server/omni');

var _tooltipView = require('../views/tooltip-view');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var $ = require('jquery');
var escape = require('escape-html');

var TypeLookup = function () {
    function TypeLookup() {
        _classCallCheck(this, TypeLookup);

        this.required = false;
        this.title = 'Tooltip Lookup';
        this.description = 'Adds hover tooltips to the editor, also has a keybind';
    }

    _createClass(TypeLookup, [{
        key: 'activate',
        value: function activate() {
            var tooltip = void 0;
            this.disposable = new _tsDisposables.CompositeDisposable();
            this.disposable.add(_omni.Omni.switchActiveEditor(function (editor, cd) {
                var editorView = $(atom.views.getView(editor));
                tooltip = new Tooltip(editorView, editor);
                cd.add(tooltip);
            }));
            this.disposable.add(_omni.Omni.addTextEditorCommand('omnisharp-atom:type-lookup', function () {
                _omni.Omni.activeEditor.first().subscribe(function (editor) {
                    tooltip.showExpressionTypeOnCommand();
                });
            }));
        }
    }, {
        key: 'dispose',
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
        var scroll = this.getFromShadowDom(editorView, '.scroll-view');
        if (!scroll[0]) return;
        var lastExprTypeBufferPt = void 0;
        var mousemove = _rxjs.Observable.fromEvent(scroll[0], 'mousemove');
        var mouseout = _rxjs.Observable.fromEvent(scroll[0], 'mouseout');
        this.keydown = _rxjs.Observable.fromEvent(scroll[0], 'keydown');
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
        key: 'subcribeKeyDown',
        value: function subcribeKeyDown() {
            var _this2 = this;

            this.keydownSubscription = this.keydown.subscribe(function (e) {
                return _this2.hideExpressionType();
            });
            this.disposable.add(this.keydownSubscription);
        }
    }, {
        key: 'showExpressionTypeOnCommand',
        value: function showExpressionTypeOnCommand() {
            if (this.editor.cursors.length < 1) return;
            var bufferPt = this.editor.getCursorBufferPosition();
            if (!this.checkPosition(bufferPt)) return;
            var offset = this.rawView.component.getFontSize() * bufferPt.column * 0.7;
            var shadow = this.getFromShadowDom(this.editorView, '.cursor-line')[0];
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
        key: 'showExpressionTypeOnMouseOver',
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
        key: 'checkPosition',
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
        key: 'showToolTip',
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
                var message = '<b>' + escape(response.Type) + '</b>';
                if (response.Documentation) {
                    message = message + ('<br/><i>' + escape(response.Documentation) + '</i>');
                }
                if (_this3.exprTypeTooltip) {
                    _this3.exprTypeTooltip.updateText(message);
                }
            });
        }
    }, {
        key: 'dispose',
        value: function dispose() {
            this.disposable.dispose();
        }
    }, {
        key: 'hideExpressionType',
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
        key: 'getFromShadowDom',
        value: function getFromShadowDom(element, selector) {
            var el = element[0];
            if (!el.rootElement) return $(el);
            var found = el.rootElement.querySelectorAll(selector);
            return $(found[0]);
        }
    }, {
        key: 'pixelPositionFromMouseEvent',
        value: function pixelPositionFromMouseEvent(editorView, event) {
            var clientX = event.clientX,
                clientY = event.clientY;
            var shadow = this.getFromShadowDom(editorView, '.lines')[0];
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9sb29rdXAudHMiXSwibmFtZXMiOlsiJCIsInJlcXVpcmUiLCJlc2NhcGUiLCJUeXBlTG9va3VwIiwicmVxdWlyZWQiLCJ0aXRsZSIsImRlc2NyaXB0aW9uIiwidG9vbHRpcCIsImRpc3Bvc2FibGUiLCJhZGQiLCJzd2l0Y2hBY3RpdmVFZGl0b3IiLCJlZGl0b3IiLCJjZCIsImVkaXRvclZpZXciLCJhdG9tIiwidmlld3MiLCJnZXRWaWV3IiwiVG9vbHRpcCIsImFkZFRleHRFZGl0b3JDb21tYW5kIiwiYWN0aXZlRWRpdG9yIiwiZmlyc3QiLCJzdWJzY3JpYmUiLCJzaG93RXhwcmVzc2lvblR5cGVPbkNvbW1hbmQiLCJkaXNwb3NlIiwiZXhwclR5cGVUb29sdGlwIiwicmF3VmlldyIsInNjcm9sbCIsImdldEZyb21TaGFkb3dEb20iLCJsYXN0RXhwclR5cGVCdWZmZXJQdCIsIm1vdXNlbW92ZSIsImZyb21FdmVudCIsIm1vdXNlb3V0Iiwia2V5ZG93biIsImF1ZGl0VGltZSIsIm1hcCIsInBpeGVsUHQiLCJwaXhlbFBvc2l0aW9uRnJvbU1vdXNlRXZlbnQiLCJldmVudCIsInNjcmVlblB0Iiwic2NyZWVuUG9zaXRpb25Gb3JQaXhlbFBvc2l0aW9uIiwiYnVmZmVyUHQiLCJidWZmZXJQb3NpdGlvbkZvclNjcmVlblBvc2l0aW9uIiwiaXNFcXVhbCIsImZpbHRlciIsInoiLCJkbyIsImhpZGVFeHByZXNzaW9uVHlwZSIsImNoZWNrUG9zaXRpb24iLCJ4Iiwic3ViY3JpYmVLZXlEb3duIiwic2hvd0V4cHJlc3Npb25UeXBlT25Nb3VzZU92ZXIiLCJlZGl0IiwiaW5uZXJDZCIsImNyZWF0ZSIsImtleWRvd25TdWJzY3JpcHRpb24iLCJjdXJzb3JzIiwibGVuZ3RoIiwiZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24iLCJvZmZzZXQiLCJjb21wb25lbnQiLCJnZXRGb250U2l6ZSIsImNvbHVtbiIsInNoYWRvdyIsInJlY3QiLCJnZXRCb3VuZGluZ0NsaWVudFJlY3QiLCJ0b29sdGlwUmVjdCIsImxlZnQiLCJyaWdodCIsInRvcCIsImJvdHRvbSIsInNob3dUb29sVGlwIiwiZSIsImlzT24iLCJnZXRMaW5lSGVpZ2h0SW5QaXhlbHMiLCJjbGllbnRYIiwiY2xpZW50WSIsImN1ckNoYXJQaXhlbFB0IiwicGl4ZWxQb3NpdGlvbkZvckJ1ZmZlclBvc2l0aW9uIiwicm93IiwibmV4dENoYXJQaXhlbFB0IiwicmVxdWVzdCIsInNvbHV0aW9uIiwidHlwZWxvb2t1cCIsIkluY2x1ZGVEb2N1bWVudGF0aW9uIiwiTGluZSIsIkNvbHVtbiIsInJlc3BvbnNlIiwiVHlwZSIsIm1lc3NhZ2UiLCJEb2N1bWVudGF0aW9uIiwidXBkYXRlVGV4dCIsInJlbW92ZSIsInVuc3Vic2NyaWJlIiwiZWxlbWVudCIsInNlbGVjdG9yIiwiZWwiLCJyb290RWxlbWVudCIsImZvdW5kIiwicXVlcnlTZWxlY3RvckFsbCIsImxpbmVzQ2xpZW50UmVjdCIsImdldFNjcm9sbFRvcCIsImdldFNjcm9sbExlZnQiLCJ0eXBlTG9va3VwIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFJQTs7QUFDQTs7QUFDQTs7QUFDQTs7OztBQUNBLElBQU1BLElBQWtCQyxRQUFRLFFBQVIsQ0FBeEI7QUFDQSxJQUFNQyxTQUFTRCxRQUFRLGFBQVIsQ0FBZjs7SUFFQUUsVTtBQUFBLDBCQUFBO0FBQUE7O0FBMkJXLGFBQUFDLFFBQUEsR0FBVyxLQUFYO0FBQ0EsYUFBQUMsS0FBQSxHQUFRLGdCQUFSO0FBQ0EsYUFBQUMsV0FBQSxHQUFjLHVEQUFkO0FBQ1Y7Ozs7bUNBM0JrQjtBQUNYLGdCQUFJQyxnQkFBSjtBQUVBLGlCQUFLQyxVQUFMLEdBQWtCLHdDQUFsQjtBQUNBLGlCQUFLQSxVQUFMLENBQWdCQyxHQUFoQixDQUFvQixXQUFLQyxrQkFBTCxDQUF3QixVQUFDQyxNQUFELEVBQVNDLEVBQVQsRUFBVztBQUduRCxvQkFBTUMsYUFBYWIsRUFBRWMsS0FBS0MsS0FBTCxDQUFXQyxPQUFYLENBQW1C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QUFFK0YsRUFBRixDQUFQO0FBRTVCLGdCQUFNRSxRQUFjRixHQUFJQyxXQUFKLENBQWdCRSxnQkFBaEIsQ0FBaUNKLFFBQWpDLENBQXBCO0FBQ0EsbUJBQU85RixFQUFFaUcsTUFBTSxDQUFOLENBQUYsQ0FBUDtBQUNIOzs7b0RBRW1DcEYsVSxFQUFpQndCLEssRUFBaUI7QUFDbEUsZ0JBQU1xQyxVQUFVckMsTUFBTXFDLE9BQXRCO0FBQUEsZ0JBQStCQyxVQUFVdEMsTUFBTXNDLE9BQS9DO0FBQ0EsZ0JBQU1iLFNBQVMsS0FBS25DLGdCQUFMLENBQXNCZCxVQUF0QixFQUFrQyxRQUFsQyxFQUE0QyxDQUE1QyxDQUFmO0FBQ0EsZ0JBQUksQ0FBQ2lELE1BQUwsRUFBYTtBQUNiLGdCQUFNcUMsa0JBQWtCckMsT0FBT0UscUJBQVAsRUFBeEI7QUFDQSxnQkFBSUksTUFBTU8sVUFBVXdCLGdCQUFnQi9CLEdBQXBDO0FBQ0EsZ0JBQUlGLE9BQU9RLFVBQVV5QixnQkFBZ0JqQyxJQUFyQztBQUNBRSxtQkFBYSxLQUFLekQsTUFBTCxDQUFheUYsWUFBYixFQUFiO0FBQ0FsQyxvQkFBYyxLQUFLdkQsTUFBTCxDQUFhMEYsYUFBYixFQUFkO0FBQ0EsbUJBQU8sRUFBRWpDLEtBQUtBLEdBQVAsRUFBWUYsTUFBTUEsSUFBbEIsRUFBUDtBQUNIOzs7Ozs7QUFHRSxJQUFNb0Msa0NBQWEsSUFBSW5HLFVBQUosRUFBbkIiLCJmaWxlIjoibGliL2ZlYXR1cmVzL2xvb2t1cC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIEluc3BpcmF0aW9uIDogaHR0cHM6Ly9hdG9tLmlvL3BhY2thZ2VzL2lkZS1oYXNrZWxsXHJcbi8vIGFuZCBodHRwczovL2F0b20uaW8vcGFja2FnZXMvaWRlLWZsb3dcclxuLy8gaHR0cHM6Ly9hdG9tLmlvL3BhY2thZ2VzL2F0b20tdHlwZXNjcmlwdFxyXG5pbXBvcnQge01vZGVsc30gZnJvbSAnb21uaXNoYXJwLWNsaWVudCc7XHJcbmltcG9ydCB7T2JzZXJ2YWJsZSwgU3Vic2NyaXB0aW9ufSBmcm9tICdyeGpzJztcclxuaW1wb3J0IHtDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlLCBJRGlzcG9zYWJsZX0gZnJvbSAndHMtZGlzcG9zYWJsZXMnO1xyXG5pbXBvcnQge09tbml9IGZyb20gJy4uL3NlcnZlci9vbW5pJztcclxuaW1wb3J0IHtUb29sdGlwVmlld30gZnJvbSAnLi4vdmlld3MvdG9vbHRpcC12aWV3JztcclxuY29uc3QgJDogSlF1ZXJ5U3RhdGljID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbmNvbnN0IGVzY2FwZSA9IHJlcXVpcmUoJ2VzY2FwZS1odG1sJyk7XHJcblxyXG5jbGFzcyBUeXBlTG9va3VwIGltcGxlbWVudHMgSUZlYXR1cmUge1xyXG4gICAgcHJpdmF0ZSBkaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xyXG5cclxuICAgIHB1YmxpYyBhY3RpdmF0ZSgpIHtcclxuICAgICAgICBsZXQgdG9vbHRpcDogVG9vbHRpcDtcclxuICAgICAgICAvKiB0c2xpbnQ6ZGlzYWJsZTpuby1zdHJpbmctbGl0ZXJhbCAqL1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLnN3aXRjaEFjdGl2ZUVkaXRvcigoZWRpdG9yLCBjZCkgPT4ge1xyXG4gICAgICAgICAgICAvLyBzdWJzY3JpYmUgZm9yIHRvb2x0aXBzXHJcbiAgICAgICAgICAgIC8vIGluc3BpcmF0aW9uIDogaHR0cHM6Ly9naXRodWIuY29tL2NoYWlrYTIwMTMvaWRlLWhhc2tlbGxcclxuICAgICAgICAgICAgY29uc3QgZWRpdG9yVmlldyA9ICQoYXRvbS52aWV3cy5nZXRWaWV3KGVkaXRvcikpO1xyXG4gICAgICAgICAgICB0b29sdGlwID0gbmV3IFRvb2x0aXAoZWRpdG9yVmlldywgZWRpdG9yKTtcclxuICAgICAgICAgICAgY2QuYWRkKHRvb2x0aXApO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmFkZFRleHRFZGl0b3JDb21tYW5kKCdvbW5pc2hhcnAtYXRvbTp0eXBlLWxvb2t1cCcsICgpID0+IHtcclxuICAgICAgICAgICAgT21uaS5hY3RpdmVFZGl0b3IuZmlyc3QoKS5zdWJzY3JpYmUoZWRpdG9yID0+IHtcclxuICAgICAgICAgICAgICAgIHRvb2x0aXAuc2hvd0V4cHJlc3Npb25UeXBlT25Db21tYW5kKCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pKTtcclxuICAgICAgICAvKiB0c2xpbnQ6ZW5hYmxlOm5vLXN0cmluZy1saXRlcmFsICovXHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVxdWlyZWQgPSBmYWxzZTtcclxuICAgIHB1YmxpYyB0aXRsZSA9ICdUb29sdGlwIExvb2t1cCc7XHJcbiAgICBwdWJsaWMgZGVzY3JpcHRpb24gPSAnQWRkcyBob3ZlciB0b29sdGlwcyB0byB0aGUgZWRpdG9yLCBhbHNvIGhhcyBhIGtleWJpbmQnO1xyXG59XHJcblxyXG5jbGFzcyBUb29sdGlwIGltcGxlbWVudHMgSURpc3Bvc2FibGUge1xyXG4gICAgcHJpdmF0ZSBleHByVHlwZVRvb2x0aXA6IFRvb2x0aXBWaWV3ID0gbnVsbDtcclxuICAgIHByaXZhdGUga2V5ZG93bjogT2JzZXJ2YWJsZTxLZXlib2FyZEV2ZW50PjtcclxuICAgIHByaXZhdGUga2V5ZG93blN1YnNjcmlwdGlvbjogU3Vic2NyaXB0aW9uO1xyXG4gICAgcHJpdmF0ZSByYXdWaWV3OiBhbnk7XHJcbiAgICBwcml2YXRlIGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XHJcblxyXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBlZGl0b3JWaWV3OiBKUXVlcnksIHByaXZhdGUgZWRpdG9yOiBBdG9tLlRleHRFZGl0b3IpIHtcclxuICAgICAgICB0aGlzLnJhd1ZpZXcgPSBlZGl0b3JWaWV3WzBdO1xyXG5cclxuICAgICAgICBjb25zdCBjZCA9IHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcblxyXG4gICAgICAgIGNvbnN0IHNjcm9sbCA9IHRoaXMuZ2V0RnJvbVNoYWRvd0RvbShlZGl0b3JWaWV3LCAnLnNjcm9sbC12aWV3Jyk7XHJcbiAgICAgICAgaWYgKCFzY3JvbGxbMF0pIHJldHVybjtcclxuXHJcbiAgICAgICAgLy8gdG8gZGVib3VuY2UgbW91c2Vtb3ZlIGV2ZW50XCJzIGZpcmluZyBmb3Igc29tZSByZWFzb24gb24gc29tZSBtYWNoaW5lc1xyXG4gICAgICAgIGxldCBsYXN0RXhwclR5cGVCdWZmZXJQdDogYW55O1xyXG5cclxuICAgICAgICBjb25zdCBtb3VzZW1vdmUgPSBPYnNlcnZhYmxlLmZyb21FdmVudDxNb3VzZUV2ZW50PihzY3JvbGxbMF0sICdtb3VzZW1vdmUnKTtcclxuICAgICAgICBjb25zdCBtb3VzZW91dCA9IE9ic2VydmFibGUuZnJvbUV2ZW50PE1vdXNlRXZlbnQ+KHNjcm9sbFswXSwgJ21vdXNlb3V0Jyk7XHJcbiAgICAgICAgdGhpcy5rZXlkb3duID0gT2JzZXJ2YWJsZS5mcm9tRXZlbnQ8S2V5Ym9hcmRFdmVudD4oc2Nyb2xsWzBdLCAna2V5ZG93bicpO1xyXG5cclxuICAgICAgICBjZC5hZGQobW91c2Vtb3ZlXHJcbiAgICAgICAgICAgIC5hdWRpdFRpbWUoMjAwKVxyXG4gICAgICAgICAgICAubWFwKGV2ZW50ID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHBpeGVsUHQgPSB0aGlzLnBpeGVsUG9zaXRpb25Gcm9tTW91c2VFdmVudChlZGl0b3JWaWV3LCBldmVudCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXBpeGVsUHQpXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgY29uc3Qgc2NyZWVuUHQgPSBlZGl0b3Iuc2NyZWVuUG9zaXRpb25Gb3JQaXhlbFBvc2l0aW9uKHBpeGVsUHQpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgYnVmZmVyUHQgPSBlZGl0b3IuYnVmZmVyUG9zaXRpb25Gb3JTY3JlZW5Qb3NpdGlvbihzY3JlZW5QdCk7XHJcbiAgICAgICAgICAgICAgICBpZiAobGFzdEV4cHJUeXBlQnVmZmVyUHQgJiYgbGFzdEV4cHJUeXBlQnVmZmVyUHQuaXNFcXVhbChidWZmZXJQdCkgJiYgdGhpcy5leHByVHlwZVRvb2x0aXApXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICAgICAgICAgIGxhc3RFeHByVHlwZUJ1ZmZlclB0ID0gYnVmZmVyUHQ7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4geyBidWZmZXJQdCwgZXZlbnQgfTtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgLmZpbHRlcih6ID0+ICEheilcclxuICAgICAgICAgICAgLmRvKCgpID0+IHRoaXMuaGlkZUV4cHJlc3Npb25UeXBlKCkpXHJcbiAgICAgICAgICAgIC5maWx0ZXIoeCA9PiB0aGlzLmNoZWNrUG9zaXRpb24oeC5idWZmZXJQdCkpXHJcbiAgICAgICAgICAgIC5kbygoKSA9PiB0aGlzLnN1YmNyaWJlS2V5RG93bigpKVxyXG4gICAgICAgICAgICAuc3Vic2NyaWJlKCh7YnVmZmVyUHQsIGV2ZW50fSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zaG93RXhwcmVzc2lvblR5cGVPbk1vdXNlT3ZlcihldmVudCwgYnVmZmVyUHQpO1xyXG4gICAgICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIGNkLmFkZChtb3VzZW91dC5zdWJzY3JpYmUoZSA9PiB0aGlzLmhpZGVFeHByZXNzaW9uVHlwZSgpKSk7XHJcblxyXG4gICAgICAgIGNkLmFkZChPbW5pLnN3aXRjaEFjdGl2ZUVkaXRvcigoZWRpdCwgaW5uZXJDZCkgPT4ge1xyXG4gICAgICAgICAgICBpbm5lckNkLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB0aGlzLmhpZGVFeHByZXNzaW9uVHlwZSgpKSk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICBjZC5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLmhpZGVFeHByZXNzaW9uVHlwZSgpO1xyXG4gICAgICAgIH0pKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHN1YmNyaWJlS2V5RG93bigpIHtcclxuICAgICAgICB0aGlzLmtleWRvd25TdWJzY3JpcHRpb24gPSB0aGlzLmtleWRvd24uc3Vic2NyaWJlKGUgPT4gdGhpcy5oaWRlRXhwcmVzc2lvblR5cGUoKSk7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZCh0aGlzLmtleWRvd25TdWJzY3JpcHRpb24pO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzaG93RXhwcmVzc2lvblR5cGVPbkNvbW1hbmQoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuZWRpdG9yLmN1cnNvcnMubGVuZ3RoIDwgMSkgcmV0dXJuO1xyXG5cclxuICAgICAgICBjb25zdCBidWZmZXJQdCA9IHRoaXMuZWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKCk7XHJcblxyXG4gICAgICAgIGlmICghdGhpcy5jaGVja1Bvc2l0aW9uKGJ1ZmZlclB0KSkgcmV0dXJuO1xyXG5cclxuICAgICAgICAvLyBmaW5kIG91dCBzaG93IHBvc2l0aW9uXHJcbiAgICAgICAgY29uc3Qgb2Zmc2V0ID0gKHRoaXMucmF3Vmlldy5jb21wb25lbnQuZ2V0Rm9udFNpemUoKSAqIGJ1ZmZlclB0LmNvbHVtbikgKiAwLjc7XHJcbiAgICAgICAgY29uc3Qgc2hhZG93ID0gdGhpcy5nZXRGcm9tU2hhZG93RG9tKHRoaXMuZWRpdG9yVmlldywgJy5jdXJzb3ItbGluZScpWzBdO1xyXG4gICAgICAgIGlmICghc2hhZG93KSByZXR1cm47XHJcbiAgICAgICAgY29uc3QgcmVjdCA9IHNoYWRvdy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcclxuXHJcbiAgICAgICAgY29uc3QgdG9vbHRpcFJlY3QgPSB7XHJcbiAgICAgICAgICAgIGxlZnQ6IHJlY3QubGVmdCAtIG9mZnNldCxcclxuICAgICAgICAgICAgcmlnaHQ6IHJlY3QubGVmdCArIG9mZnNldCxcclxuICAgICAgICAgICAgdG9wOiByZWN0LmJvdHRvbSxcclxuICAgICAgICAgICAgYm90dG9tOiByZWN0LmJvdHRvbVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuaGlkZUV4cHJlc3Npb25UeXBlKCk7XHJcbiAgICAgICAgdGhpcy5zdWJjcmliZUtleURvd24oKTtcclxuICAgICAgICB0aGlzLnNob3dUb29sVGlwKGJ1ZmZlclB0LCB0b29sdGlwUmVjdCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBzaG93RXhwcmVzc2lvblR5cGVPbk1vdXNlT3ZlcihlOiBNb3VzZUV2ZW50LCBidWZmZXJQdDogVGV4dEJ1ZmZlci5Qb2ludCkge1xyXG4gICAgICAgIGlmICghT21uaS5pc09uKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIElmIHdlIGFyZSBhbHJlYWR5IHNob3dpbmcgd2Ugc2hvdWxkIHdhaXQgZm9yIHRoYXQgdG8gY2xlYXJcclxuICAgICAgICBpZiAodGhpcy5leHByVHlwZVRvb2x0aXApIHJldHVybjtcclxuXHJcbiAgICAgICAgLy8gZmluZCBvdXQgc2hvdyBwb3NpdGlvblxyXG4gICAgICAgIGNvbnN0IG9mZnNldCA9ICg8YW55PnRoaXMuZWRpdG9yKS5nZXRMaW5lSGVpZ2h0SW5QaXhlbHMoKSAqIDAuNztcclxuICAgICAgICBjb25zdCB0b29sdGlwUmVjdCA9IHtcclxuICAgICAgICAgICAgbGVmdDogZS5jbGllbnRYLFxyXG4gICAgICAgICAgICByaWdodDogZS5jbGllbnRYLFxyXG4gICAgICAgICAgICB0b3A6IGUuY2xpZW50WSAtIG9mZnNldCxcclxuICAgICAgICAgICAgYm90dG9tOiBlLmNsaWVudFkgKyBvZmZzZXRcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLnNob3dUb29sVGlwKGJ1ZmZlclB0LCB0b29sdGlwUmVjdCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBjaGVja1Bvc2l0aW9uKGJ1ZmZlclB0OiBUZXh0QnVmZmVyLlBvaW50KSB7XHJcbiAgICAgICAgY29uc3QgY3VyQ2hhclBpeGVsUHQgPSB0aGlzLnJhd1ZpZXcucGl4ZWxQb3NpdGlvbkZvckJ1ZmZlclBvc2l0aW9uKFtidWZmZXJQdC5yb3csIGJ1ZmZlclB0LmNvbHVtbl0pO1xyXG4gICAgICAgIGNvbnN0IG5leHRDaGFyUGl4ZWxQdCA9IHRoaXMucmF3Vmlldy5waXhlbFBvc2l0aW9uRm9yQnVmZmVyUG9zaXRpb24oW2J1ZmZlclB0LnJvdywgYnVmZmVyUHQuY29sdW1uICsgMV0pO1xyXG5cclxuICAgICAgICBpZiAoY3VyQ2hhclBpeGVsUHQubGVmdCA+PSBuZXh0Q2hhclBpeGVsUHQubGVmdCkge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgc2hvd1Rvb2xUaXAoYnVmZmVyUHQ6IFRleHRCdWZmZXIuUG9pbnQsIHRvb2x0aXBSZWN0OiBhbnkpIHtcclxuICAgICAgICB0aGlzLmV4cHJUeXBlVG9vbHRpcCA9IG5ldyBUb29sdGlwVmlldyh0b29sdGlwUmVjdCk7XHJcblxyXG4gICAgICAgIC8vIEFjdHVhbGx5IG1ha2UgdGhlIHByb2dyYW0gbWFuYWdlciBxdWVyeVxyXG4gICAgICAgIE9tbmkucmVxdWVzdChzb2x1dGlvbiA9PiBzb2x1dGlvbi50eXBlbG9va3VwKHtcclxuICAgICAgICAgICAgSW5jbHVkZURvY3VtZW50YXRpb246IHRydWUsXHJcbiAgICAgICAgICAgIExpbmU6IGJ1ZmZlclB0LnJvdyxcclxuICAgICAgICAgICAgQ29sdW1uOiBidWZmZXJQdC5jb2x1bW5cclxuICAgICAgICB9KSkuc3Vic2NyaWJlKChyZXNwb25zZTogTW9kZWxzLlR5cGVMb29rdXBSZXNwb25zZSkgPT4ge1xyXG4gICAgICAgICAgICBpZiAocmVzcG9uc2UuVHlwZSA9PT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGxldCBtZXNzYWdlID0gYDxiPiR7ZXNjYXBlKHJlc3BvbnNlLlR5cGUpfTwvYj5gO1xyXG4gICAgICAgICAgICBpZiAocmVzcG9uc2UuRG9jdW1lbnRhdGlvbikge1xyXG4gICAgICAgICAgICAgICAgbWVzc2FnZSA9IG1lc3NhZ2UgKyBgPGJyLz48aT4ke2VzY2FwZShyZXNwb25zZS5Eb2N1bWVudGF0aW9uKX08L2k+YDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBTb3JyeSBhYm91dCB0aGlzIFwiaWZcIi4gSXRcInMgaW4gdGhlIGNvZGUgSSBjb3BpZWQgc28gSSBndWVzcyBpdHMgdGhlcmUgZm9yIGEgcmVhc29uXHJcbiAgICAgICAgICAgIGlmICh0aGlzLmV4cHJUeXBlVG9vbHRpcCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5leHByVHlwZVRvb2x0aXAudXBkYXRlVGV4dChtZXNzYWdlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkaXNwb3NlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBoaWRlRXhwcmVzc2lvblR5cGUoKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLmV4cHJUeXBlVG9vbHRpcCkgcmV0dXJuO1xyXG4gICAgICAgIHRoaXMuZXhwclR5cGVUb29sdGlwLnJlbW92ZSgpO1xyXG4gICAgICAgIHRoaXMuZXhwclR5cGVUb29sdGlwID0gbnVsbDtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMua2V5ZG93blN1YnNjcmlwdGlvbikge1xyXG4gICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUucmVtb3ZlKHRoaXMua2V5ZG93blN1YnNjcmlwdGlvbik7XHJcbiAgICAgICAgICAgIHRoaXMua2V5ZG93blN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xyXG4gICAgICAgICAgICB0aGlzLmtleWRvd25TdWJzY3JpcHRpb24gPSBudWxsO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGdldEZyb21TaGFkb3dEb20oZWxlbWVudDogSlF1ZXJ5LCBzZWxlY3Rvcjogc3RyaW5nKTogSlF1ZXJ5IHtcclxuICAgICAgICBjb25zdCBlbCA9IGVsZW1lbnRbMF07XHJcbiAgICAgICAgaWYgKCEoPGFueT5lbCkucm9vdEVsZW1lbnQpIHJldHVybiAkKGVsKTtcclxuXHJcbiAgICAgICAgY29uc3QgZm91bmQgPSAoPGFueT5lbCkucm9vdEVsZW1lbnQucXVlcnlTZWxlY3RvckFsbChzZWxlY3Rvcik7XHJcbiAgICAgICAgcmV0dXJuICQoZm91bmRbMF0pO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgcGl4ZWxQb3NpdGlvbkZyb21Nb3VzZUV2ZW50KGVkaXRvclZpZXc6IGFueSwgZXZlbnQ6IE1vdXNlRXZlbnQpIHtcclxuICAgICAgICBjb25zdCBjbGllbnRYID0gZXZlbnQuY2xpZW50WCwgY2xpZW50WSA9IGV2ZW50LmNsaWVudFk7XHJcbiAgICAgICAgY29uc3Qgc2hhZG93ID0gdGhpcy5nZXRGcm9tU2hhZG93RG9tKGVkaXRvclZpZXcsICcubGluZXMnKVswXTtcclxuICAgICAgICBpZiAoIXNoYWRvdykgcmV0dXJuO1xyXG4gICAgICAgIGNvbnN0IGxpbmVzQ2xpZW50UmVjdCA9IHNoYWRvdy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcclxuICAgICAgICBsZXQgdG9wID0gY2xpZW50WSAtIGxpbmVzQ2xpZW50UmVjdC50b3A7XHJcbiAgICAgICAgbGV0IGxlZnQgPSBjbGllbnRYIC0gbGluZXNDbGllbnRSZWN0LmxlZnQ7XHJcbiAgICAgICAgdG9wICs9ICg8YW55PnRoaXMuZWRpdG9yKS5nZXRTY3JvbGxUb3AoKTtcclxuICAgICAgICBsZWZ0ICs9ICg8YW55PnRoaXMuZWRpdG9yKS5nZXRTY3JvbGxMZWZ0KCk7XHJcbiAgICAgICAgcmV0dXJuIHsgdG9wOiB0b3AsIGxlZnQ6IGxlZnQgfTtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IHR5cGVMb29rdXAgPSBuZXcgVHlwZUxvb2t1cDtcclxuIl19
