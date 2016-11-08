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
            var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : { priority: 1000 };
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
            var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : { priority: 1000 };
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9hdG9tL2RvY2suanMiLCJsaWIvYXRvbS9kb2NrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBTUE7O0FBQ0E7Ozs7QUFQQSxJQUFJLGFBQWEsU0FBQyxJQUFRLFVBQUssVUFBTCxJQUFvQixVQUFVLFVBQVYsRUFBc0IsTUFBdEIsRUFBOEIsR0FBOUIsRUFBbUMsSUFBbkMsRUFBeUM7QUFDbkYsUUFBSSxJQUFJLFVBQVUsTUFBVjtRQUFrQixJQUFJLElBQUksQ0FBSixHQUFRLE1BQVIsR0FBaUIsU0FBUyxJQUFULEdBQWdCLE9BQU8sT0FBTyx3QkFBUCxDQUFnQyxNQUFoQyxFQUF3QyxHQUF4QyxDQUFQLEdBQXNELElBQXRFO1FBQTRFLENBQTNILENBRG1GO0FBRW5GLFFBQUksUUFBTyx5REFBUCxLQUFtQixRQUFuQixJQUErQixPQUFPLFFBQVEsUUFBUixLQUFxQixVQUE1QixFQUF3QyxJQUFJLFFBQVEsUUFBUixDQUFpQixVQUFqQixFQUE2QixNQUE3QixFQUFxQyxHQUFyQyxFQUEwQyxJQUExQyxDQUFKLENBQTNFLEtBQ0ssS0FBSyxJQUFJLElBQUksV0FBVyxNQUFYLEdBQW9CLENBQXBCLEVBQXVCLEtBQUssQ0FBTCxFQUFRLEdBQTVDO0FBQWlELFlBQUksSUFBSSxXQUFXLENBQVgsQ0FBSixFQUFtQixJQUFJLENBQUMsSUFBSSxDQUFKLEdBQVEsRUFBRSxDQUFGLENBQVIsR0FBZSxJQUFJLENBQUosR0FBUSxFQUFFLE1BQUYsRUFBVSxHQUFWLEVBQWUsQ0FBZixDQUFSLEdBQTRCLEVBQUUsTUFBRixFQUFVLEdBQVYsQ0FBNUIsQ0FBaEIsSUFBK0QsQ0FBL0QsQ0FBM0I7S0FBakQsT0FDRSxJQUFJLENBQUosSUFBUyxDQUFULElBQWMsT0FBTyxjQUFQLENBQXNCLE1BQXRCLEVBQThCLEdBQTlCLEVBQW1DLENBQW5DLENBQWQsRUFBcUQsQ0FBckQsQ0FKNEU7Q0FBekM7O0FDSTlDLFNBQUEsUUFBQSxDQUFrQixHQUFs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TSxJQUFJLEtBQUosQ0FBVSxFQUFWLENBQU4sQ0FBakI7Ozs7NEJBdkJ4SDtBQUFLLG1CQUFPLEtBQUssSUFBTCxDQUFVLE1BQVYsQ0FBWjs7Ozs0QkFDRTtBQUFLLG1CQUFPLEtBQUssSUFBTCxDQUFVLFFBQVYsQ0FBWjs7MEJBQ0MsT0FBSztBQUFJLGlCQUFLLElBQUwsQ0FBVSxRQUFWLEdBQXFCLEtBQXJCLENBQUo7Ozs7Ozs7QUFFekIsV0FBQSxDQUFDLFNBQVMsWUFBVCxDQUFELENBQUEsRURTRCxLQUFLLFNBQUwsRUFBZ0IsUUNUZixFRFN5QixJQ1R6QjtBQUdBLFdBQUEsQ0FBQyxTQUFTLFVBQVQsQ0FBRCxDQUFBLEVEU0QsS0FBSyxTQUFMLEVBQWdCLE1DVGYsRURTdUIsSUNUdkI7QUFHQSxXQUFBLENBQUMsU0FBUyxVQUFULENBQUQsQ0FBQSxFRFNELEtBQUssU0FBTCxFQUFnQixNQ1RmLEVEU3VCLElDVHZCO0FBR0EsV0FBQSxDQUFDLFVBQUQsQ0FBQSxFRFNELEtBQUssU0FBTCxFQUFnQixXQ1RmLEVEUzRCLElDVDVCO0FBR0EsV0FBQSxDQUFDLFVBQUQsQ0FBQSxFRFNELEtBQUssU0FBTCxFQUFnQixjQ1RmLEVEUytCLElDVC9CO0FBR0EsV0FBQSxDQUFDLFVBQUQsQ0FBQSxFRFNELEtBQUssU0FBTCxFQUFnQixjQ1RmLEVEUytCLElDVC9CO0FBR0EsV0FBQSxDQUFDLFVBQUQsQ0FBQSxFRFNELEtBQUssU0FBTCxFQUFnQixXQ1RmLEVEUzRCLElDVDVCO0FBUUcsSUFBTSxzQkFBTyxJQUFJLElBQUosRUFBUCIsImZpbGUiOiJsaWIvYXRvbS9kb2NrLmpzIiwic291cmNlc0NvbnRlbnQiOlsidmFyIF9fZGVjb3JhdGUgPSAodGhpcyAmJiB0aGlzLl9fZGVjb3JhdGUpIHx8IGZ1bmN0aW9uIChkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYykge1xuICAgIHZhciBjID0gYXJndW1lbnRzLmxlbmd0aCwgciA9IGMgPCAzID8gdGFyZ2V0IDogZGVzYyA9PT0gbnVsbCA/IGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHRhcmdldCwga2V5KSA6IGRlc2MsIGQ7XG4gICAgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBSZWZsZWN0LmRlY29yYXRlID09PSBcImZ1bmN0aW9uXCIpIHIgPSBSZWZsZWN0LmRlY29yYXRlKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKTtcbiAgICBlbHNlIGZvciAodmFyIGkgPSBkZWNvcmF0b3JzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSBpZiAoZCA9IGRlY29yYXRvcnNbaV0pIHIgPSAoYyA8IDMgPyBkKHIpIDogYyA+IDMgPyBkKHRhcmdldCwga2V5LCByKSA6IGQodGFyZ2V0LCBrZXkpKSB8fCByO1xuICAgIHJldHVybiBjID4gMyAmJiByICYmIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGtleSwgciksIHI7XG59O1xuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSwgRGlzcG9zYWJsZSB9IGZyb20gXCJ0cy1kaXNwb3NhYmxlc1wiO1xuaW1wb3J0IHsgRG9ja1dpbmRvdyB9IGZyb20gXCIuLi92aWV3cy9kb2NrLXdpbmRvd1wiO1xuZnVuY3Rpb24gZnJvbURvY2soa2V5KSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIGZyb21Eb2NrKHRhcmdldCwgcHJvcGVydHlLZXksIGRlc2NyaXB0b3IpIHtcbiAgICAgICAgY29uc3QgaW50ZXJuYWxLZXkgPSBgJHtrZXkgfHwgcHJvcGVydHlLZXl9YDtcbiAgICAgICAgZGVzY3JpcHRvci52YWx1ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmRvY2tbaW50ZXJuYWxLZXldLmFwcGx5KHRoaXMuZG9jaywgYXJndW1lbnRzKTtcbiAgICAgICAgfTtcbiAgICB9O1xufVxuY2xhc3MgRG9jayB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuZG9jayA9IG5ldyBEb2NrV2luZG93O1xuICAgICAgICB0aGlzLnJlcXVpcmVkID0gdHJ1ZTtcbiAgICAgICAgdGhpcy50aXRsZSA9IFwiRG9ja1wiO1xuICAgICAgICB0aGlzLmRlc2NyaXB0aW9uID0gXCJUaGUgZG9jayB3aW5kb3cgdXNlZCB0byBzaG93IGxvZ3MgYW5kIGRpYWdub3N0aWNzIGFuZCBvdGhlciB0aGluZ3MuXCI7XG4gICAgfVxuICAgIGFjdGl2YXRlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTp0b2dnbGUtZG9ja1wiLCAoKSA9PiB0aGlzLnRvZ2dsZSgpKSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcIm9tbmlzaGFycC1hdG9tOnNob3ctZG9ja1wiLCAoKSA9PiB0aGlzLnNob3coKSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTpoaWRlLWRvY2tcIiwgKCkgPT4gdGhpcy5oaWRlKCkpKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwiY29yZTpjbG9zZVwiLCAoKSA9PiB0aGlzLmhpZGUoKSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJjb3JlOmNhbmNlbFwiLCAoKSA9PiB0aGlzLmhpZGUoKSkpO1xuICAgIH1cbiAgICBhdHRhY2goKSB7XG4gICAgICAgIGNvbnN0IHAgPSBhdG9tLndvcmtzcGFjZS5hZGRCb3R0b21QYW5lbCh7XG4gICAgICAgICAgICBpdGVtOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKSxcbiAgICAgICAgICAgIHZpc2libGU6IGZhbHNlLFxuICAgICAgICAgICAgcHJpb3JpdHk6IDEwMDBcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMudmlldyA9IHAuaXRlbS5wYXJlbnRFbGVtZW50O1xuICAgICAgICB0aGlzLnZpZXcuY2xhc3NMaXN0LmFkZChcIm9tbmlzaGFycC1hdG9tLXBhbmVcIik7XG4gICAgICAgIHRoaXMuZG9jay5zZXRQYW5lbChwKTtcbiAgICAgICAgdGhpcy52aWV3LmFwcGVuZENoaWxkKHRoaXMuZG9jayk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xuICAgICAgICAgICAgcC5kZXN0cm95KCk7XG4gICAgICAgICAgICB0aGlzLnZpZXcucmVtb3ZlKCk7XG4gICAgICAgIH0pKTtcbiAgICB9XG4gICAgZGlzcG9zZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICB9XG4gICAgZ2V0IGlzT3BlbigpIHsgcmV0dXJuIHRoaXMuZG9jay5pc09wZW47IH1cbiAgICBnZXQgc2VsZWN0ZWQoKSB7IHJldHVybiB0aGlzLmRvY2suc2VsZWN0ZWQ7IH1cbiAgICBzZXQgc2VsZWN0ZWQodmFsdWUpIHsgdGhpcy5kb2NrLnNlbGVjdGVkID0gdmFsdWU7IH1cbiAgICB0b2dnbGUoKSB7IH1cbiAgICBzaG93KCkgeyB9XG4gICAgO1xuICAgIGhpZGUoKSB7IH1cbiAgICA7XG4gICAgYWRkV2luZG93KGlkLCB0aXRsZSwgdmlldywgb3B0aW9ucyA9IHsgcHJpb3JpdHk6IDEwMDAgfSwgcGFyZW50RGlzcG9zYWJsZSkgeyB0aHJvdyBuZXcgRXJyb3IoXCJcIik7IH1cbiAgICB0b2dnbGVXaW5kb3coc2VsZWN0ZWQpIHsgfVxuICAgIHNlbGVjdFdpbmRvdyhzZWxlY3RlZCkgeyB9XG4gICAgYWRkQnV0dG9uKGlkLCB0aXRsZSwgdmlldywgb3B0aW9ucyA9IHsgcHJpb3JpdHk6IDEwMDAgfSwgcGFyZW50RGlzcG9zYWJsZSkgeyB0aHJvdyBuZXcgRXJyb3IoXCJcIik7IH1cbn1cbl9fZGVjb3JhdGUoW1xuICAgIGZyb21Eb2NrKFwidG9nZ2xlVmlld1wiKVxuXSwgRG9jay5wcm90b3R5cGUsIFwidG9nZ2xlXCIsIG51bGwpO1xuX19kZWNvcmF0ZShbXG4gICAgZnJvbURvY2soXCJzaG93Vmlld1wiKVxuXSwgRG9jay5wcm90b3R5cGUsIFwic2hvd1wiLCBudWxsKTtcbl9fZGVjb3JhdGUoW1xuICAgIGZyb21Eb2NrKFwiaGlkZVZpZXdcIilcbl0sIERvY2sucHJvdG90eXBlLCBcImhpZGVcIiwgbnVsbCk7XG5fX2RlY29yYXRlKFtcbiAgICBmcm9tRG9jaygpXG5dLCBEb2NrLnByb3RvdHlwZSwgXCJhZGRXaW5kb3dcIiwgbnVsbCk7XG5fX2RlY29yYXRlKFtcbiAgICBmcm9tRG9jaygpXG5dLCBEb2NrLnByb3RvdHlwZSwgXCJ0b2dnbGVXaW5kb3dcIiwgbnVsbCk7XG5fX2RlY29yYXRlKFtcbiAgICBmcm9tRG9jaygpXG5dLCBEb2NrLnByb3RvdHlwZSwgXCJzZWxlY3RXaW5kb3dcIiwgbnVsbCk7XG5fX2RlY29yYXRlKFtcbiAgICBmcm9tRG9jaygpXG5dLCBEb2NrLnByb3RvdHlwZSwgXCJhZGRCdXR0b25cIiwgbnVsbCk7XG5leHBvcnQgY29uc3QgZG9jayA9IG5ldyBEb2NrO1xuIiwiaW1wb3J0IHtDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlLCBJRGlzcG9zYWJsZX0gZnJvbSBcInRzLWRpc3Bvc2FibGVzXCI7XHJcbmltcG9ydCB7RG9ja1dpbmRvdywgRG9jQnV0dG9uT3B0aW9ucywgUGFuZUJ1dHRvbk9wdGlvbnN9IGZyb20gXCIuLi92aWV3cy9kb2NrLXdpbmRvd1wiO1xyXG5cclxuXHJcbmZ1bmN0aW9uIGZyb21Eb2NrKGtleT86IHN0cmluZykge1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uIGZyb21Eb2NrKHRhcmdldDogT2JqZWN0LCBwcm9wZXJ0eUtleTogc3RyaW5nLCBkZXNjcmlwdG9yOiBUeXBlZFByb3BlcnR5RGVzY3JpcHRvcjxhbnk+KSB7XHJcbiAgICAgICAgY29uc3QgaW50ZXJuYWxLZXkgPSBgJHtrZXkgfHwgcHJvcGVydHlLZXl9YDtcclxuICAgICAgICBkZXNjcmlwdG9yLnZhbHVlID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmRvY2tbaW50ZXJuYWxLZXldLmFwcGx5KHRoaXMuZG9jaywgYXJndW1lbnRzKTtcclxuICAgICAgICB9O1xyXG4gICAgfTtcclxufVxyXG5cclxuY2xhc3MgRG9jayBpbXBsZW1lbnRzIElBdG9tRmVhdHVyZSB7XHJcbiAgICBwcml2YXRlIGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XHJcbiAgICBwcml2YXRlIHZpZXc6IEVsZW1lbnQ7XHJcbiAgICBwcml2YXRlIGRvY2s6IERvY2tXaW5kb3cgPSBuZXcgRG9ja1dpbmRvdztcclxuXHJcbiAgICBwdWJsaWMgYWN0aXZhdGUoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwib21uaXNoYXJwLWF0b206dG9nZ2xlLWRvY2tcIiwgKCkgPT4gdGhpcy50b2dnbGUoKSkpO1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcIm9tbmlzaGFycC1hdG9tOnNob3ctZG9ja1wiLCAoKSA9PiB0aGlzLnNob3coKSkpO1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcIm9tbmlzaGFycC1hdG9tOmhpZGUtZG9ja1wiLCAoKSA9PiB0aGlzLmhpZGUoKSkpO1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcImNvcmU6Y2xvc2VcIiwgKCkgPT4gdGhpcy5oaWRlKCkpKTtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJjb3JlOmNhbmNlbFwiLCAoKSA9PiB0aGlzLmhpZGUoKSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBhdHRhY2goKSB7XHJcbiAgICAgICAgY29uc3QgcCA9IGF0b20ud29ya3NwYWNlLmFkZEJvdHRvbVBhbmVsKHtcclxuICAgICAgICAgICAgaXRlbTogZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIiksXHJcbiAgICAgICAgICAgIHZpc2libGU6IGZhbHNlLFxyXG4gICAgICAgICAgICBwcmlvcml0eTogMTAwMFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB0aGlzLnZpZXcgPSBwLml0ZW0ucGFyZW50RWxlbWVudDtcclxuICAgICAgICB0aGlzLnZpZXcuY2xhc3NMaXN0LmFkZChcIm9tbmlzaGFycC1hdG9tLXBhbmVcIik7XHJcbiAgICAgICAgdGhpcy5kb2NrLnNldFBhbmVsKHApO1xyXG5cclxuICAgICAgICB0aGlzLnZpZXcuYXBwZW5kQ2hpbGQodGhpcy5kb2NrKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XHJcbiAgICAgICAgICAgIHAuZGVzdHJveSgpO1xyXG4gICAgICAgICAgICB0aGlzLnZpZXcucmVtb3ZlKCk7XHJcbiAgICAgICAgfSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkaXNwb3NlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldCBpc09wZW4oKSB7IHJldHVybiB0aGlzLmRvY2suaXNPcGVuOyB9XHJcbiAgICBwdWJsaWMgZ2V0IHNlbGVjdGVkKCkgeyByZXR1cm4gdGhpcy5kb2NrLnNlbGVjdGVkOyB9XHJcbiAgICBwdWJsaWMgc2V0IHNlbGVjdGVkKHZhbHVlKSB7IHRoaXMuZG9jay5zZWxlY3RlZCA9IHZhbHVlOyB9XHJcblxyXG4gICAgQGZyb21Eb2NrKFwidG9nZ2xlVmlld1wiKVxyXG4gICAgcHVibGljIHRvZ2dsZSgpIHsgLyogKi8gfVxyXG5cclxuICAgIEBmcm9tRG9jayhcInNob3dWaWV3XCIpXHJcbiAgICBwdWJsaWMgc2hvdygpIHsgLyogKi8gfTtcclxuXHJcbiAgICBAZnJvbURvY2soXCJoaWRlVmlld1wiKVxyXG4gICAgcHVibGljIGhpZGUoKSB7IC8qICovIH07XHJcblxyXG4gICAgQGZyb21Eb2NrKClcclxuICAgIHB1YmxpYyBhZGRXaW5kb3coaWQ6IHN0cmluZywgdGl0bGU6IHN0cmluZywgdmlldzogRWxlbWVudCwgb3B0aW9uczogUGFuZUJ1dHRvbk9wdGlvbnMgPSB7IHByaW9yaXR5OiAxMDAwIH0sIHBhcmVudERpc3Bvc2FibGU/OiBJRGlzcG9zYWJsZSk6IElEaXNwb3NhYmxlIHsgdGhyb3cgbmV3IEVycm9yKFwiXCIpOyB9XHJcblxyXG4gICAgQGZyb21Eb2NrKClcclxuICAgIHB1YmxpYyB0b2dnbGVXaW5kb3coc2VsZWN0ZWQ6IHN0cmluZykgeyAvKiAqLyB9XHJcblxyXG4gICAgQGZyb21Eb2NrKClcclxuICAgIHB1YmxpYyBzZWxlY3RXaW5kb3coc2VsZWN0ZWQ6IHN0cmluZykgeyAvKiAqLyB9XHJcblxyXG4gICAgQGZyb21Eb2NrKClcclxuICAgIHB1YmxpYyBhZGRCdXR0b24oaWQ6IHN0cmluZywgdGl0bGU6IHN0cmluZywgdmlldzogRWxlbWVudCwgb3B0aW9uczogRG9jQnV0dG9uT3B0aW9ucyA9IHsgcHJpb3JpdHk6IDEwMDAgfSwgcGFyZW50RGlzcG9zYWJsZT86IElEaXNwb3NhYmxlKTogSURpc3Bvc2FibGUgeyB0aHJvdyBuZXcgRXJyb3IoXCJcIik7IH1cclxuXHJcbiAgICBwdWJsaWMgcmVxdWlyZWQgPSB0cnVlO1xyXG4gICAgcHVibGljIHRpdGxlID0gXCJEb2NrXCI7XHJcbiAgICBwdWJsaWMgZGVzY3JpcHRpb24gPSBcIlRoZSBkb2NrIHdpbmRvdyB1c2VkIHRvIHNob3cgbG9ncyBhbmQgZGlhZ25vc3RpY3MgYW5kIG90aGVyIHRoaW5ncy5cIjtcclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IGRvY2sgPSBuZXcgRG9jaztcclxuIl19
