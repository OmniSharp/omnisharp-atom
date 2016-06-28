"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.dock = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _omnisharpClient = require("omnisharp-client");

var _dockWindow = require("../views/dock-window");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var __decorate = undefined && undefined.__decorate || function (decorators, target, key, desc) {
    var c = arguments.length,
        r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
        d;
    if ((typeof Reflect === "undefined" ? "undefined" : _typeof(Reflect)) === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) {
        if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    }return c > 3 && r && Object.defineProperty(target, key, r), r;
};

function fromDock(key) {
    return function fromDock(target, propertyKey, descriptor) {
        var internalKey = "" + (key || propertyKey);
        descriptor.value = function () {
            return this.dock[internalKey].apply(this.dock, arguments);
        };
    };
}

var Dock = function () {
    function Dock() {
        _classCallCheck(this, Dock);

        this.dock = new _dockWindow.DockWindow();
        this.required = true;
        this.title = "Dock";
        this.description = "The dock window used to show logs and diagnostics and other things.";
    }

    _createClass(Dock, [{
        key: "activate",
        value: function activate() {
            var _this = this;

            this.disposable = new _omnisharpClient.CompositeDisposable();
            this.disposable.add(atom.commands.add("atom-workspace", "omnisharp-atom:toggle-dock", function () {
                return _this.toggle();
            }));
            this.disposable.add(atom.commands.add("atom-workspace", "omnisharp-atom:show-dock", function () {
                return _this.show();
            }));
            this.disposable.add(atom.commands.add("atom-workspace", "omnisharp-atom:hide-dock", function () {
                return _this.hide();
            }));
            this.disposable.add(atom.commands.add("atom-workspace", "core:close", function () {
                return _this.hide();
            }));
            this.disposable.add(atom.commands.add("atom-workspace", "core:cancel", function () {
                return _this.hide();
            }));
        }
    }, {
        key: "attach",
        value: function attach() {
            var _this2 = this;

            var p = atom.workspace.addBottomPanel({
                item: document.createElement("span"),
                visible: false,
                priority: 1000
            });
            this.view = p.item.parentElement;
            this.view.classList.add("omnisharp-atom-pane");
            this.dock.setPanel(p);
            this.view.appendChild(this.dock);
            this.disposable.add(_omnisharpClient.Disposable.create(function () {
                p.destroy();
                _this2.view.remove();
            }));
        }
    }, {
        key: "dispose",
        value: function dispose() {
            this.disposable.dispose();
        }
    }, {
        key: "toggle",
        value: function toggle() {}
    }, {
        key: "show",
        value: function show() {}
    }, {
        key: "hide",
        value: function hide() {}
    }, {
        key: "addWindow",
        value: function addWindow(id, title, view) {
            var options = arguments.length <= 3 || arguments[3] === undefined ? { priority: 1000 } : arguments[3];
            var parentDisposable = arguments[4];
            throw new Error("");
        }
    }, {
        key: "toggleWindow",
        value: function toggleWindow(selected) {}
    }, {
        key: "selectWindow",
        value: function selectWindow(selected) {}
    }, {
        key: "addButton",
        value: function addButton(id, title, view) {
            var options = arguments.length <= 3 || arguments[3] === undefined ? { priority: 1000 } : arguments[3];
            var parentDisposable = arguments[4];
            throw new Error("");
        }
    }, {
        key: "isOpen",
        get: function get() {
            return this.dock.isOpen;
        }
    }, {
        key: "selected",
        get: function get() {
            return this.dock.selected;
        },
        set: function set(value) {
            this.dock.selected = value;
        }
    }]);

    return Dock;
}();

__decorate([fromDock("toggleView")], Dock.prototype, "toggle", null);
__decorate([fromDock("showView")], Dock.prototype, "show", null);
__decorate([fromDock("hideView")], Dock.prototype, "hide", null);
__decorate([fromDock()], Dock.prototype, "addWindow", null);
__decorate([fromDock()], Dock.prototype, "toggleWindow", null);
__decorate([fromDock()], Dock.prototype, "selectWindow", null);
__decorate([fromDock()], Dock.prototype, "addButton", null);
var dock = exports.dock = new Dock();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9hdG9tL2RvY2suanMiLCJsaWIvYXRvbS9kb2NrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBTUE7O0FBQ0E7Ozs7QUFQQSxJQUFJLGFBQWEsU0FBQyxJQUFRLFVBQUssVUFBTCxJQUFvQixVQUFVLFVBQVYsRUFBc0IsTUFBdEIsRUFBOEIsR0FBOUIsRUFBbUMsSUFBbkMsRUFBeUM7QUFDbkYsUUFBSSxJQUFJLFVBQVUsTUFBVjtRQUFrQixJQUFJLElBQUksQ0FBSixHQUFRLE1BQVIsR0FBaUIsU0FBUyxJQUFULEdBQWdCLE9BQU8sT0FBTyx3QkFBUCxDQUFnQyxNQUFoQyxFQUF3QyxHQUF4QyxDQUFQLEdBQXNELElBQXRFO1FBQTRFLENBQTNILENBRG1GO0FBRW5GLFFBQUksUUFBTyx5REFBUCxLQUFtQixRQUFuQixJQUErQixPQUFPLFFBQVEsUUFBUixLQUFxQixVQUE1QixFQUF3QyxJQUFJLFFBQVEsUUFBUixDQUFpQixVQUFqQixFQUE2QixNQUE3QixFQUFxQyxHQUFyQyxFQUEwQyxJQUExQyxDQUFKLENBQTNFLEtBQ0ssS0FBSyxJQUFJLElBQUksV0FBVyxNQUFYLEdBQW9CLENBQXBCLEVBQXVCLEtBQUssQ0FBTCxFQUFRLEdBQTVDO0FBQWlELFlBQUksSUFBSSxXQUFXLENBQVgsQ0FBSixFQUFtQixJQUFJLENBQUMsSUFBSSxDQUFKLEdBQVEsRUFBRSxDQUFGLENBQVIsR0FBZSxJQUFJLENBQUosR0FBUSxFQUFFLE1BQUYsRUFBVSxHQUFWLEVBQWUsQ0FBZixDQUFSLEdBQTRCLEVBQUUsTUFBRixFQUFVLEdBQVYsQ0FBNUIsQ0FBaEIsSUFBK0QsQ0FBL0QsQ0FBM0I7S0FBakQsT0FDRSxJQUFJLENBQUosSUFBUyxDQUFULElBQWMsT0FBTyxjQUFQLENBQXNCLE1BQXRCLEVBQThCLEdBQTlCLEVBQW1DLENBQW5DLENBQWQsRUFBcUQsQ0FBckQsQ0FKNEU7Q0FBekM7O0FDSTlDLFNBQUEsUUFBQSxDQUFrQixHQUFs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QUFNLElBQUksS0FBSixDQUFVLEVBQVYsQ0FBTixDQUFqQjs7Ozs0QkF2QnhIO0FBQUssbUJBQU8sS0FBSyxJQUFMLENBQVUsTUFBVixDQUFaOzs7OzRCQUNFO0FBQUssbUJBQU8sS0FBSyxJQUFMLENBQVUsUUFBVixDQUFaOzswQkFDQyxPQUFLO0FBQUksaUJBQUssSUFBTCxDQUFVLFFBQVYsR0FBcUIsS0FBckIsQ0FBSjs7Ozs7OztBQUV6QixXQUFBLENBQUMsU0FBUyxZQUFULENBQUQsQ0FBQSxFRFNELEtBQUssU0FBTCxFQUFnQixRQ1RmLEVEU3lCLElDVHpCO0FBR0EsV0FBQSxDQUFDLFNBQVMsVUFBVCxDQUFELENBQUEsRURTRCxLQUFLLFNBQUwsRUFBZ0IsTUNUZixFRFN1QixJQ1R2QjtBQUdBLFdBQUEsQ0FBQyxTQUFTLFVBQVQsQ0FBRCxDQUFBLEVEU0QsS0FBSyxTQUFMLEVBQWdCLE1DVGYsRURTdUIsSUNUdkI7QUFHQSxXQUFBLENBQUMsVUFBRCxDQUFBLEVEU0QsS0FBSyxTQUFMLEVBQWdCLFdDVGYsRURTNEIsSUNUNUI7QUFHQSxXQUFBLENBQUMsVUFBRCxDQUFBLEVEU0QsS0FBSyxTQUFMLEVBQWdCLGNDVGYsRURTK0IsSUNUL0I7QUFHQSxXQUFBLENBQUMsVUFBRCxDQUFBLEVEU0QsS0FBSyxTQUFMLEVBQWdCLGNDVGYsRURTK0IsSUNUL0I7QUFHQSxXQUFBLENBQUMsVUFBRCxDQUFBLEVEU0QsS0FBSyxTQUFMLEVBQWdCLFdDVGYsRURTNEIsSUNUNUI7QUFRRyxJQUFNLHNCQUFPLElBQUksSUFBSixFQUFQIiwiZmlsZSI6ImxpYi9hdG9tL2RvY2suanMiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgX19kZWNvcmF0ZSA9ICh0aGlzICYmIHRoaXMuX19kZWNvcmF0ZSkgfHwgZnVuY3Rpb24gKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKSB7XG4gICAgdmFyIGMgPSBhcmd1bWVudHMubGVuZ3RoLCByID0gYyA8IDMgPyB0YXJnZXQgOiBkZXNjID09PSBudWxsID8gZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodGFyZ2V0LCBrZXkpIDogZGVzYywgZDtcbiAgICBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIFJlZmxlY3QuZGVjb3JhdGUgPT09IFwiZnVuY3Rpb25cIikgciA9IFJlZmxlY3QuZGVjb3JhdGUoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpO1xuICAgIGVsc2UgZm9yICh2YXIgaSA9IGRlY29yYXRvcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIGlmIChkID0gZGVjb3JhdG9yc1tpXSkgciA9IChjIDwgMyA/IGQocikgOiBjID4gMyA/IGQodGFyZ2V0LCBrZXksIHIpIDogZCh0YXJnZXQsIGtleSkpIHx8IHI7XG4gICAgcmV0dXJuIGMgPiAzICYmIHIgJiYgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwga2V5LCByKSwgcjtcbn07XG5pbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlIH0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcbmltcG9ydCB7IERvY2tXaW5kb3cgfSBmcm9tIFwiLi4vdmlld3MvZG9jay13aW5kb3dcIjtcbmZ1bmN0aW9uIGZyb21Eb2NrKGtleSkge1xuICAgIHJldHVybiBmdW5jdGlvbiBmcm9tRG9jayh0YXJnZXQsIHByb3BlcnR5S2V5LCBkZXNjcmlwdG9yKSB7XG4gICAgICAgIGNvbnN0IGludGVybmFsS2V5ID0gYCR7a2V5IHx8IHByb3BlcnR5S2V5fWA7XG4gICAgICAgIGRlc2NyaXB0b3IudmFsdWUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5kb2NrW2ludGVybmFsS2V5XS5hcHBseSh0aGlzLmRvY2ssIGFyZ3VtZW50cyk7XG4gICAgICAgIH07XG4gICAgfTtcbn1cbmNsYXNzIERvY2sge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmRvY2sgPSBuZXcgRG9ja1dpbmRvdztcbiAgICAgICAgdGhpcy5yZXF1aXJlZCA9IHRydWU7XG4gICAgICAgIHRoaXMudGl0bGUgPSBcIkRvY2tcIjtcbiAgICAgICAgdGhpcy5kZXNjcmlwdGlvbiA9IFwiVGhlIGRvY2sgd2luZG93IHVzZWQgdG8gc2hvdyBsb2dzIGFuZCBkaWFnbm9zdGljcyBhbmQgb3RoZXIgdGhpbmdzLlwiO1xuICAgIH1cbiAgICBhY3RpdmF0ZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwib21uaXNoYXJwLWF0b206dG9nZ2xlLWRvY2tcIiwgKCkgPT4gdGhpcy50b2dnbGUoKSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTpzaG93LWRvY2tcIiwgKCkgPT4gdGhpcy5zaG93KCkpKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwib21uaXNoYXJwLWF0b206aGlkZS1kb2NrXCIsICgpID0+IHRoaXMuaGlkZSgpKSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcImNvcmU6Y2xvc2VcIiwgKCkgPT4gdGhpcy5oaWRlKCkpKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwiY29yZTpjYW5jZWxcIiwgKCkgPT4gdGhpcy5oaWRlKCkpKTtcbiAgICB9XG4gICAgYXR0YWNoKCkge1xuICAgICAgICBjb25zdCBwID0gYXRvbS53b3Jrc3BhY2UuYWRkQm90dG9tUGFuZWwoe1xuICAgICAgICAgICAgaXRlbTogZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIiksXG4gICAgICAgICAgICB2aXNpYmxlOiBmYWxzZSxcbiAgICAgICAgICAgIHByaW9yaXR5OiAxMDAwXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLnZpZXcgPSBwLml0ZW0ucGFyZW50RWxlbWVudDtcbiAgICAgICAgdGhpcy52aWV3LmNsYXNzTGlzdC5hZGQoXCJvbW5pc2hhcnAtYXRvbS1wYW5lXCIpO1xuICAgICAgICB0aGlzLmRvY2suc2V0UGFuZWwocCk7XG4gICAgICAgIHRoaXMudmlldy5hcHBlbmRDaGlsZCh0aGlzLmRvY2spO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcbiAgICAgICAgICAgIHAuZGVzdHJveSgpO1xuICAgICAgICAgICAgdGhpcy52aWV3LnJlbW92ZSgpO1xuICAgICAgICB9KSk7XG4gICAgfVxuICAgIGRpc3Bvc2UoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfVxuICAgIGdldCBpc09wZW4oKSB7IHJldHVybiB0aGlzLmRvY2suaXNPcGVuOyB9XG4gICAgZ2V0IHNlbGVjdGVkKCkgeyByZXR1cm4gdGhpcy5kb2NrLnNlbGVjdGVkOyB9XG4gICAgc2V0IHNlbGVjdGVkKHZhbHVlKSB7IHRoaXMuZG9jay5zZWxlY3RlZCA9IHZhbHVlOyB9XG4gICAgdG9nZ2xlKCkgeyB9XG4gICAgc2hvdygpIHsgfVxuICAgIDtcbiAgICBoaWRlKCkgeyB9XG4gICAgO1xuICAgIGFkZFdpbmRvdyhpZCwgdGl0bGUsIHZpZXcsIG9wdGlvbnMgPSB7IHByaW9yaXR5OiAxMDAwIH0sIHBhcmVudERpc3Bvc2FibGUpIHsgdGhyb3cgbmV3IEVycm9yKFwiXCIpOyB9XG4gICAgdG9nZ2xlV2luZG93KHNlbGVjdGVkKSB7IH1cbiAgICBzZWxlY3RXaW5kb3coc2VsZWN0ZWQpIHsgfVxuICAgIGFkZEJ1dHRvbihpZCwgdGl0bGUsIHZpZXcsIG9wdGlvbnMgPSB7IHByaW9yaXR5OiAxMDAwIH0sIHBhcmVudERpc3Bvc2FibGUpIHsgdGhyb3cgbmV3IEVycm9yKFwiXCIpOyB9XG59XG5fX2RlY29yYXRlKFtcbiAgICBmcm9tRG9jayhcInRvZ2dsZVZpZXdcIilcbl0sIERvY2sucHJvdG90eXBlLCBcInRvZ2dsZVwiLCBudWxsKTtcbl9fZGVjb3JhdGUoW1xuICAgIGZyb21Eb2NrKFwic2hvd1ZpZXdcIilcbl0sIERvY2sucHJvdG90eXBlLCBcInNob3dcIiwgbnVsbCk7XG5fX2RlY29yYXRlKFtcbiAgICBmcm9tRG9jayhcImhpZGVWaWV3XCIpXG5dLCBEb2NrLnByb3RvdHlwZSwgXCJoaWRlXCIsIG51bGwpO1xuX19kZWNvcmF0ZShbXG4gICAgZnJvbURvY2soKVxuXSwgRG9jay5wcm90b3R5cGUsIFwiYWRkV2luZG93XCIsIG51bGwpO1xuX19kZWNvcmF0ZShbXG4gICAgZnJvbURvY2soKVxuXSwgRG9jay5wcm90b3R5cGUsIFwidG9nZ2xlV2luZG93XCIsIG51bGwpO1xuX19kZWNvcmF0ZShbXG4gICAgZnJvbURvY2soKVxuXSwgRG9jay5wcm90b3R5cGUsIFwic2VsZWN0V2luZG93XCIsIG51bGwpO1xuX19kZWNvcmF0ZShbXG4gICAgZnJvbURvY2soKVxuXSwgRG9jay5wcm90b3R5cGUsIFwiYWRkQnV0dG9uXCIsIG51bGwpO1xuZXhwb3J0IGNvbnN0IGRvY2sgPSBuZXcgRG9jaztcbiIsImltcG9ydCB7Q29tcG9zaXRlRGlzcG9zYWJsZSwgRGlzcG9zYWJsZSwgSURpc3Bvc2FibGV9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XHJcbmltcG9ydCB7RG9ja1dpbmRvdywgRG9jQnV0dG9uT3B0aW9ucywgUGFuZUJ1dHRvbk9wdGlvbnN9IGZyb20gXCIuLi92aWV3cy9kb2NrLXdpbmRvd1wiO1xyXG5cclxuXHJcbmZ1bmN0aW9uIGZyb21Eb2NrKGtleT86IHN0cmluZykge1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uIGZyb21Eb2NrKHRhcmdldDogT2JqZWN0LCBwcm9wZXJ0eUtleTogc3RyaW5nLCBkZXNjcmlwdG9yOiBUeXBlZFByb3BlcnR5RGVzY3JpcHRvcjxhbnk+KSB7XHJcbiAgICAgICAgY29uc3QgaW50ZXJuYWxLZXkgPSBgJHtrZXkgfHwgcHJvcGVydHlLZXl9YDtcclxuICAgICAgICBkZXNjcmlwdG9yLnZhbHVlID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmRvY2tbaW50ZXJuYWxLZXldLmFwcGx5KHRoaXMuZG9jaywgYXJndW1lbnRzKTtcclxuICAgICAgICB9O1xyXG4gICAgfTtcclxufVxyXG5cclxuY2xhc3MgRG9jayBpbXBsZW1lbnRzIElBdG9tRmVhdHVyZSB7XHJcbiAgICBwcml2YXRlIGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XHJcbiAgICBwcml2YXRlIHZpZXc6IEVsZW1lbnQ7XHJcbiAgICBwcml2YXRlIGRvY2s6IERvY2tXaW5kb3cgPSBuZXcgRG9ja1dpbmRvdztcclxuXHJcbiAgICBwdWJsaWMgYWN0aXZhdGUoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwib21uaXNoYXJwLWF0b206dG9nZ2xlLWRvY2tcIiwgKCkgPT4gdGhpcy50b2dnbGUoKSkpO1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcIm9tbmlzaGFycC1hdG9tOnNob3ctZG9ja1wiLCAoKSA9PiB0aGlzLnNob3coKSkpO1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcIm9tbmlzaGFycC1hdG9tOmhpZGUtZG9ja1wiLCAoKSA9PiB0aGlzLmhpZGUoKSkpO1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcImNvcmU6Y2xvc2VcIiwgKCkgPT4gdGhpcy5oaWRlKCkpKTtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJjb3JlOmNhbmNlbFwiLCAoKSA9PiB0aGlzLmhpZGUoKSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBhdHRhY2goKSB7XHJcbiAgICAgICAgY29uc3QgcCA9IGF0b20ud29ya3NwYWNlLmFkZEJvdHRvbVBhbmVsKHtcclxuICAgICAgICAgICAgaXRlbTogZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIiksXHJcbiAgICAgICAgICAgIHZpc2libGU6IGZhbHNlLFxyXG4gICAgICAgICAgICBwcmlvcml0eTogMTAwMFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB0aGlzLnZpZXcgPSBwLml0ZW0ucGFyZW50RWxlbWVudDtcclxuICAgICAgICB0aGlzLnZpZXcuY2xhc3NMaXN0LmFkZChcIm9tbmlzaGFycC1hdG9tLXBhbmVcIik7XHJcbiAgICAgICAgdGhpcy5kb2NrLnNldFBhbmVsKHApO1xyXG5cclxuICAgICAgICB0aGlzLnZpZXcuYXBwZW5kQ2hpbGQodGhpcy5kb2NrKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XHJcbiAgICAgICAgICAgIHAuZGVzdHJveSgpO1xyXG4gICAgICAgICAgICB0aGlzLnZpZXcucmVtb3ZlKCk7XHJcbiAgICAgICAgfSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkaXNwb3NlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldCBpc09wZW4oKSB7IHJldHVybiB0aGlzLmRvY2suaXNPcGVuOyB9XHJcbiAgICBwdWJsaWMgZ2V0IHNlbGVjdGVkKCkgeyByZXR1cm4gdGhpcy5kb2NrLnNlbGVjdGVkOyB9XHJcbiAgICBwdWJsaWMgc2V0IHNlbGVjdGVkKHZhbHVlKSB7IHRoaXMuZG9jay5zZWxlY3RlZCA9IHZhbHVlOyB9XHJcblxyXG4gICAgQGZyb21Eb2NrKFwidG9nZ2xlVmlld1wiKVxyXG4gICAgcHVibGljIHRvZ2dsZSgpIHsgLyogKi8gfVxyXG5cclxuICAgIEBmcm9tRG9jayhcInNob3dWaWV3XCIpXHJcbiAgICBwdWJsaWMgc2hvdygpIHsgLyogKi8gfTtcclxuXHJcbiAgICBAZnJvbURvY2soXCJoaWRlVmlld1wiKVxyXG4gICAgcHVibGljIGhpZGUoKSB7IC8qICovIH07XHJcblxyXG4gICAgQGZyb21Eb2NrKClcclxuICAgIHB1YmxpYyBhZGRXaW5kb3coaWQ6IHN0cmluZywgdGl0bGU6IHN0cmluZywgdmlldzogRWxlbWVudCwgb3B0aW9uczogUGFuZUJ1dHRvbk9wdGlvbnMgPSB7IHByaW9yaXR5OiAxMDAwIH0sIHBhcmVudERpc3Bvc2FibGU/OiBJRGlzcG9zYWJsZSk6IElEaXNwb3NhYmxlIHsgdGhyb3cgbmV3IEVycm9yKFwiXCIpOyB9XHJcblxyXG4gICAgQGZyb21Eb2NrKClcclxuICAgIHB1YmxpYyB0b2dnbGVXaW5kb3coc2VsZWN0ZWQ6IHN0cmluZykgeyAvKiAqLyB9XHJcblxyXG4gICAgQGZyb21Eb2NrKClcclxuICAgIHB1YmxpYyBzZWxlY3RXaW5kb3coc2VsZWN0ZWQ6IHN0cmluZykgeyAvKiAqLyB9XHJcblxyXG4gICAgQGZyb21Eb2NrKClcclxuICAgIHB1YmxpYyBhZGRCdXR0b24oaWQ6IHN0cmluZywgdGl0bGU6IHN0cmluZywgdmlldzogRWxlbWVudCwgb3B0aW9uczogRG9jQnV0dG9uT3B0aW9ucyA9IHsgcHJpb3JpdHk6IDEwMDAgfSwgcGFyZW50RGlzcG9zYWJsZT86IElEaXNwb3NhYmxlKTogSURpc3Bvc2FibGUgeyB0aHJvdyBuZXcgRXJyb3IoXCJcIik7IH1cclxuXHJcbiAgICBwdWJsaWMgcmVxdWlyZWQgPSB0cnVlO1xyXG4gICAgcHVibGljIHRpdGxlID0gXCJEb2NrXCI7XHJcbiAgICBwdWJsaWMgZGVzY3JpcHRpb24gPSBcIlRoZSBkb2NrIHdpbmRvdyB1c2VkIHRvIHNob3cgbG9ncyBhbmQgZGlhZ25vc3RpY3MgYW5kIG90aGVyIHRoaW5ncy5cIjtcclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IGRvY2sgPSBuZXcgRG9jaztcclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
