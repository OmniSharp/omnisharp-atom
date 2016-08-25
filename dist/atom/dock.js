"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.dock = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _tsDisposables = require("ts-disposables");

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

            this.disposable = new _tsDisposables.CompositeDisposable();
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
            this.disposable.add(_tsDisposables.Disposable.create(function () {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9hdG9tL2RvY2suanMiLCJsaWIvYXRvbS9kb2NrLnRzIl0sIm5hbWVzIjpbIl9fZGVjb3JhdGUiLCJkZWNvcmF0b3JzIiwidGFyZ2V0Iiwia2V5IiwiZGVzYyIsImMiLCJhcmd1bWVudHMiLCJsZW5ndGgiLCJyIiwiT2JqZWN0IiwiZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yIiwiZCIsIlJlZmxlY3QiLCJkZWNvcmF0ZSIsImkiLCJkZWZpbmVQcm9wZXJ0eSIsImZyb21Eb2NrIiwicHJvcGVydHlLZXkiLCJkZXNjcmlwdG9yIiwiaW50ZXJuYWxLZXkiLCJ2YWx1ZSIsImRvY2siLCJhcHBseSIsIkRvY2siLCJyZXF1aXJlZCIsInRpdGxlIiwiZGVzY3JpcHRpb24iLCJkaXNwb3NhYmxlIiwiYWRkIiwiYXRvbSIsImNvbW1hbmRzIiwidG9nZ2xlIiwic2hvdyIsImhpZGUiLCJwIiwid29ya3NwYWNlIiwiYWRkQm90dG9tUGFuZWwiLCJpdGVtIiwiZG9jdW1lbnQiLCJjcmVhdGVFbGVtZW50IiwidmlzaWJsZSIsInByaW9yaXR5IiwidmlldyIsInBhcmVudEVsZW1lbnQiLCJjbGFzc0xpc3QiLCJzZXRQYW5lbCIsImFwcGVuZENoaWxkIiwiY3JlYXRlIiwiZGVzdHJveSIsInJlbW92ZSIsImRpc3Bvc2UiLCJpZCIsIm9wdGlvbnMiLCJwYXJlbnREaXNwb3NhYmxlIiwiRXJyb3IiLCJzZWxlY3RlZCIsImlzT3BlbiIsInByb3RvdHlwZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFNQTs7QUFDQTs7OztBQVBBLElBQUlBLGFBQWMsYUFBUSxVQUFLQSxVQUFkLElBQTZCLFVBQVVDLFVBQVYsRUFBc0JDLE1BQXRCLEVBQThCQyxHQUE5QixFQUFtQ0MsSUFBbkMsRUFBeUM7QUFDbkYsUUFBSUMsSUFBSUMsVUFBVUMsTUFBbEI7QUFBQSxRQUEwQkMsSUFBSUgsSUFBSSxDQUFKLEdBQVFILE1BQVIsR0FBaUJFLFNBQVMsSUFBVCxHQUFnQkEsT0FBT0ssT0FB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LENBQVVtQyxNQUFqQjtBQUEwQjs7OzRCQUM3QjtBQUFLLG1CQUFPLEtBQUtuQyxJQUFMLENBQVVrQyxRQUFqQjtBQUE0QixTOzBCQUNoQ25DLEssRUFBSztBQUFJLGlCQUFLQyxJQUFMLENBQVVrQyxRQUFWLEdBQXFCbkMsS0FBckI7QUFBNkI7Ozs7OztBQUUxRHBCLFdBQUEsQ0FBQ2dCLFNBQVMsWUFBVCxDQUFELENBQUEsRURTRE8sS0FBS2tDLFNDVEosRURTZSxRQ1RmLEVEU3lCLElDVHpCO0FBR0F6RCxXQUFBLENBQUNnQixTQUFTLFVBQVQsQ0FBRCxDQUFBLEVEU0RPLEtBQUtrQyxTQ1RKLEVEU2UsTUNUZixFRFN1QixJQ1R2QjtBQUdBekQsV0FBQSxDQUFDZ0IsU0FBUyxVQUFULENBQUQsQ0FBQSxFRFNETyxLQUFLa0MsU0NUSixFRFNlLE1DVGYsRURTdUIsSUNUdkI7QUFHQXpELFdBQUEsQ0FBQ2dCLFVBQUQsQ0FBQSxFRFNETyxLQUFLa0MsU0NUSixFRFNlLFdDVGYsRURTNEIsSUNUNUI7QUFHQXpELFdBQUEsQ0FBQ2dCLFVBQUQsQ0FBQSxFRFNETyxLQUFLa0MsU0NUSixFRFNlLGNDVGYsRURTK0IsSUNUL0I7QUFHQXpELFdBQUEsQ0FBQ2dCLFVBQUQsQ0FBQSxFRFNETyxLQUFLa0MsU0NUSixFRFNlLGNDVGYsRURTK0IsSUNUL0I7QUFHQXpELFdBQUEsQ0FBQ2dCLFVBQUQsQ0FBQSxFRFNETyxLQUFLa0MsU0NUSixFRFNlLFdDVGYsRURTNEIsSUNUNUI7QUFRRyxJQUFNcEMsc0JBQU8sSUFBSUUsSUFBSixFQUFiIiwiZmlsZSI6ImxpYi9hdG9tL2RvY2suanMiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgX19kZWNvcmF0ZSA9ICh0aGlzICYmIHRoaXMuX19kZWNvcmF0ZSkgfHwgZnVuY3Rpb24gKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKSB7XG4gICAgdmFyIGMgPSBhcmd1bWVudHMubGVuZ3RoLCByID0gYyA8IDMgPyB0YXJnZXQgOiBkZXNjID09PSBudWxsID8gZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodGFyZ2V0LCBrZXkpIDogZGVzYywgZDtcbiAgICBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIFJlZmxlY3QuZGVjb3JhdGUgPT09IFwiZnVuY3Rpb25cIikgciA9IFJlZmxlY3QuZGVjb3JhdGUoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpO1xuICAgIGVsc2UgZm9yICh2YXIgaSA9IGRlY29yYXRvcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIGlmIChkID0gZGVjb3JhdG9yc1tpXSkgciA9IChjIDwgMyA/IGQocikgOiBjID4gMyA/IGQodGFyZ2V0LCBrZXksIHIpIDogZCh0YXJnZXQsIGtleSkpIHx8IHI7XG4gICAgcmV0dXJuIGMgPiAzICYmIHIgJiYgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwga2V5LCByKSwgcjtcbn07XG5pbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlIH0gZnJvbSBcInRzLWRpc3Bvc2FibGVzXCI7XG5pbXBvcnQgeyBEb2NrV2luZG93IH0gZnJvbSBcIi4uL3ZpZXdzL2RvY2std2luZG93XCI7XG5mdW5jdGlvbiBmcm9tRG9jayhrZXkpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gZnJvbURvY2sodGFyZ2V0LCBwcm9wZXJ0eUtleSwgZGVzY3JpcHRvcikge1xuICAgICAgICBjb25zdCBpbnRlcm5hbEtleSA9IGAke2tleSB8fCBwcm9wZXJ0eUtleX1gO1xuICAgICAgICBkZXNjcmlwdG9yLnZhbHVlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZG9ja1tpbnRlcm5hbEtleV0uYXBwbHkodGhpcy5kb2NrLCBhcmd1bWVudHMpO1xuICAgICAgICB9O1xuICAgIH07XG59XG5jbGFzcyBEb2NrIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5kb2NrID0gbmV3IERvY2tXaW5kb3c7XG4gICAgICAgIHRoaXMucmVxdWlyZWQgPSB0cnVlO1xuICAgICAgICB0aGlzLnRpdGxlID0gXCJEb2NrXCI7XG4gICAgICAgIHRoaXMuZGVzY3JpcHRpb24gPSBcIlRoZSBkb2NrIHdpbmRvdyB1c2VkIHRvIHNob3cgbG9ncyBhbmQgZGlhZ25vc3RpY3MgYW5kIG90aGVyIHRoaW5ncy5cIjtcbiAgICB9XG4gICAgYWN0aXZhdGUoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcIm9tbmlzaGFycC1hdG9tOnRvZ2dsZS1kb2NrXCIsICgpID0+IHRoaXMudG9nZ2xlKCkpKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwib21uaXNoYXJwLWF0b206c2hvdy1kb2NrXCIsICgpID0+IHRoaXMuc2hvdygpKSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcIm9tbmlzaGFycC1hdG9tOmhpZGUtZG9ja1wiLCAoKSA9PiB0aGlzLmhpZGUoKSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJjb3JlOmNsb3NlXCIsICgpID0+IHRoaXMuaGlkZSgpKSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcImNvcmU6Y2FuY2VsXCIsICgpID0+IHRoaXMuaGlkZSgpKSk7XG4gICAgfVxuICAgIGF0dGFjaCgpIHtcbiAgICAgICAgY29uc3QgcCA9IGF0b20ud29ya3NwYWNlLmFkZEJvdHRvbVBhbmVsKHtcbiAgICAgICAgICAgIGl0ZW06IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpLFxuICAgICAgICAgICAgdmlzaWJsZTogZmFsc2UsXG4gICAgICAgICAgICBwcmlvcml0eTogMTAwMFxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy52aWV3ID0gcC5pdGVtLnBhcmVudEVsZW1lbnQ7XG4gICAgICAgIHRoaXMudmlldy5jbGFzc0xpc3QuYWRkKFwib21uaXNoYXJwLWF0b20tcGFuZVwiKTtcbiAgICAgICAgdGhpcy5kb2NrLnNldFBhbmVsKHApO1xuICAgICAgICB0aGlzLnZpZXcuYXBwZW5kQ2hpbGQodGhpcy5kb2NrKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XG4gICAgICAgICAgICBwLmRlc3Ryb3koKTtcbiAgICAgICAgICAgIHRoaXMudmlldy5yZW1vdmUoKTtcbiAgICAgICAgfSkpO1xuICAgIH1cbiAgICBkaXNwb3NlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgIH1cbiAgICBnZXQgaXNPcGVuKCkgeyByZXR1cm4gdGhpcy5kb2NrLmlzT3BlbjsgfVxuICAgIGdldCBzZWxlY3RlZCgpIHsgcmV0dXJuIHRoaXMuZG9jay5zZWxlY3RlZDsgfVxuICAgIHNldCBzZWxlY3RlZCh2YWx1ZSkgeyB0aGlzLmRvY2suc2VsZWN0ZWQgPSB2YWx1ZTsgfVxuICAgIHRvZ2dsZSgpIHsgfVxuICAgIHNob3coKSB7IH1cbiAgICA7XG4gICAgaGlkZSgpIHsgfVxuICAgIDtcbiAgICBhZGRXaW5kb3coaWQsIHRpdGxlLCB2aWV3LCBvcHRpb25zID0geyBwcmlvcml0eTogMTAwMCB9LCBwYXJlbnREaXNwb3NhYmxlKSB7IHRocm93IG5ldyBFcnJvcihcIlwiKTsgfVxuICAgIHRvZ2dsZVdpbmRvdyhzZWxlY3RlZCkgeyB9XG4gICAgc2VsZWN0V2luZG93KHNlbGVjdGVkKSB7IH1cbiAgICBhZGRCdXR0b24oaWQsIHRpdGxlLCB2aWV3LCBvcHRpb25zID0geyBwcmlvcml0eTogMTAwMCB9LCBwYXJlbnREaXNwb3NhYmxlKSB7IHRocm93IG5ldyBFcnJvcihcIlwiKTsgfVxufVxuX19kZWNvcmF0ZShbXG4gICAgZnJvbURvY2soXCJ0b2dnbGVWaWV3XCIpXG5dLCBEb2NrLnByb3RvdHlwZSwgXCJ0b2dnbGVcIiwgbnVsbCk7XG5fX2RlY29yYXRlKFtcbiAgICBmcm9tRG9jayhcInNob3dWaWV3XCIpXG5dLCBEb2NrLnByb3RvdHlwZSwgXCJzaG93XCIsIG51bGwpO1xuX19kZWNvcmF0ZShbXG4gICAgZnJvbURvY2soXCJoaWRlVmlld1wiKVxuXSwgRG9jay5wcm90b3R5cGUsIFwiaGlkZVwiLCBudWxsKTtcbl9fZGVjb3JhdGUoW1xuICAgIGZyb21Eb2NrKClcbl0sIERvY2sucHJvdG90eXBlLCBcImFkZFdpbmRvd1wiLCBudWxsKTtcbl9fZGVjb3JhdGUoW1xuICAgIGZyb21Eb2NrKClcbl0sIERvY2sucHJvdG90eXBlLCBcInRvZ2dsZVdpbmRvd1wiLCBudWxsKTtcbl9fZGVjb3JhdGUoW1xuICAgIGZyb21Eb2NrKClcbl0sIERvY2sucHJvdG90eXBlLCBcInNlbGVjdFdpbmRvd1wiLCBudWxsKTtcbl9fZGVjb3JhdGUoW1xuICAgIGZyb21Eb2NrKClcbl0sIERvY2sucHJvdG90eXBlLCBcImFkZEJ1dHRvblwiLCBudWxsKTtcbmV4cG9ydCBjb25zdCBkb2NrID0gbmV3IERvY2s7XG4iLCJpbXBvcnQge0NvbXBvc2l0ZURpc3Bvc2FibGUsIERpc3Bvc2FibGUsIElEaXNwb3NhYmxlfSBmcm9tIFwidHMtZGlzcG9zYWJsZXNcIjtcclxuaW1wb3J0IHtEb2NrV2luZG93LCBEb2NCdXR0b25PcHRpb25zLCBQYW5lQnV0dG9uT3B0aW9uc30gZnJvbSBcIi4uL3ZpZXdzL2RvY2std2luZG93XCI7XHJcblxyXG5cclxuZnVuY3Rpb24gZnJvbURvY2soa2V5Pzogc3RyaW5nKSB7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24gZnJvbURvY2sodGFyZ2V0OiBPYmplY3QsIHByb3BlcnR5S2V5OiBzdHJpbmcsIGRlc2NyaXB0b3I6IFR5cGVkUHJvcGVydHlEZXNjcmlwdG9yPGFueT4pIHtcclxuICAgICAgICBjb25zdCBpbnRlcm5hbEtleSA9IGAke2tleSB8fCBwcm9wZXJ0eUtleX1gO1xyXG4gICAgICAgIGRlc2NyaXB0b3IudmFsdWUgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZG9ja1tpbnRlcm5hbEtleV0uYXBwbHkodGhpcy5kb2NrLCBhcmd1bWVudHMpO1xyXG4gICAgICAgIH07XHJcbiAgICB9O1xyXG59XHJcblxyXG5jbGFzcyBEb2NrIGltcGxlbWVudHMgSUF0b21GZWF0dXJlIHtcclxuICAgIHByaXZhdGUgZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxuICAgIHByaXZhdGUgdmlldzogRWxlbWVudDtcclxuICAgIHByaXZhdGUgZG9jazogRG9ja1dpbmRvdyA9IG5ldyBEb2NrV2luZG93O1xyXG5cclxuICAgIHB1YmxpYyBhY3RpdmF0ZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTp0b2dnbGUtZG9ja1wiLCAoKSA9PiB0aGlzLnRvZ2dsZSgpKSk7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwib21uaXNoYXJwLWF0b206c2hvdy1kb2NrXCIsICgpID0+IHRoaXMuc2hvdygpKSk7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwib21uaXNoYXJwLWF0b206aGlkZS1kb2NrXCIsICgpID0+IHRoaXMuaGlkZSgpKSk7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwiY29yZTpjbG9zZVwiLCAoKSA9PiB0aGlzLmhpZGUoKSkpO1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcImNvcmU6Y2FuY2VsXCIsICgpID0+IHRoaXMuaGlkZSgpKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGF0dGFjaCgpIHtcclxuICAgICAgICBjb25zdCBwID0gYXRvbS53b3Jrc3BhY2UuYWRkQm90dG9tUGFuZWwoe1xyXG4gICAgICAgICAgICBpdGVtOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKSxcclxuICAgICAgICAgICAgdmlzaWJsZTogZmFsc2UsXHJcbiAgICAgICAgICAgIHByaW9yaXR5OiAxMDAwXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHRoaXMudmlldyA9IHAuaXRlbS5wYXJlbnRFbGVtZW50O1xyXG4gICAgICAgIHRoaXMudmlldy5jbGFzc0xpc3QuYWRkKFwib21uaXNoYXJwLWF0b20tcGFuZVwiKTtcclxuICAgICAgICB0aGlzLmRvY2suc2V0UGFuZWwocCk7XHJcblxyXG4gICAgICAgIHRoaXMudmlldy5hcHBlbmRDaGlsZCh0aGlzLmRvY2spO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcclxuICAgICAgICAgICAgcC5kZXN0cm95KCk7XHJcbiAgICAgICAgICAgIHRoaXMudmlldy5yZW1vdmUoKTtcclxuICAgICAgICB9KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0IGlzT3BlbigpIHsgcmV0dXJuIHRoaXMuZG9jay5pc09wZW47IH1cclxuICAgIHB1YmxpYyBnZXQgc2VsZWN0ZWQoKSB7IHJldHVybiB0aGlzLmRvY2suc2VsZWN0ZWQ7IH1cclxuICAgIHB1YmxpYyBzZXQgc2VsZWN0ZWQodmFsdWUpIHsgdGhpcy5kb2NrLnNlbGVjdGVkID0gdmFsdWU7IH1cclxuXHJcbiAgICBAZnJvbURvY2soXCJ0b2dnbGVWaWV3XCIpXHJcbiAgICBwdWJsaWMgdG9nZ2xlKCkgeyAvKiAqLyB9XHJcblxyXG4gICAgQGZyb21Eb2NrKFwic2hvd1ZpZXdcIilcclxuICAgIHB1YmxpYyBzaG93KCkgeyAvKiAqLyB9O1xyXG5cclxuICAgIEBmcm9tRG9jayhcImhpZGVWaWV3XCIpXHJcbiAgICBwdWJsaWMgaGlkZSgpIHsgLyogKi8gfTtcclxuXHJcbiAgICBAZnJvbURvY2soKVxyXG4gICAgcHVibGljIGFkZFdpbmRvdyhpZDogc3RyaW5nLCB0aXRsZTogc3RyaW5nLCB2aWV3OiBFbGVtZW50LCBvcHRpb25zOiBQYW5lQnV0dG9uT3B0aW9ucyA9IHsgcHJpb3JpdHk6IDEwMDAgfSwgcGFyZW50RGlzcG9zYWJsZT86IElEaXNwb3NhYmxlKTogSURpc3Bvc2FibGUgeyB0aHJvdyBuZXcgRXJyb3IoXCJcIik7IH1cclxuXHJcbiAgICBAZnJvbURvY2soKVxyXG4gICAgcHVibGljIHRvZ2dsZVdpbmRvdyhzZWxlY3RlZDogc3RyaW5nKSB7IC8qICovIH1cclxuXHJcbiAgICBAZnJvbURvY2soKVxyXG4gICAgcHVibGljIHNlbGVjdFdpbmRvdyhzZWxlY3RlZDogc3RyaW5nKSB7IC8qICovIH1cclxuXHJcbiAgICBAZnJvbURvY2soKVxyXG4gICAgcHVibGljIGFkZEJ1dHRvbihpZDogc3RyaW5nLCB0aXRsZTogc3RyaW5nLCB2aWV3OiBFbGVtZW50LCBvcHRpb25zOiBEb2NCdXR0b25PcHRpb25zID0geyBwcmlvcml0eTogMTAwMCB9LCBwYXJlbnREaXNwb3NhYmxlPzogSURpc3Bvc2FibGUpOiBJRGlzcG9zYWJsZSB7IHRocm93IG5ldyBFcnJvcihcIlwiKTsgfVxyXG5cclxuICAgIHB1YmxpYyByZXF1aXJlZCA9IHRydWU7XHJcbiAgICBwdWJsaWMgdGl0bGUgPSBcIkRvY2tcIjtcclxuICAgIHB1YmxpYyBkZXNjcmlwdGlvbiA9IFwiVGhlIGRvY2sgd2luZG93IHVzZWQgdG8gc2hvdyBsb2dzIGFuZCBkaWFnbm9zdGljcyBhbmQgb3RoZXIgdGhpbmdzLlwiO1xyXG59XHJcblxyXG5leHBvcnQgY29uc3QgZG9jayA9IG5ldyBEb2NrO1xyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
