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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9hdG9tL2RvY2suanMiLCJsaWIvYXRvbS9kb2NrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBTUE7O0FBQ0E7Ozs7QUFQQSxJQUFJLGFBQWMsYUFBUSxVQUFLLFVBQWQsSUFBNkIsVUFBVSxVQUFWLEVBQXNCLE1BQXRCLEVBQThCLEdBQTlCLEVBQW1DLElBQW5DLEVBQXlDO0FBQ25GLFFBQUksSUFBSSxVQUFVLE1BQWxCO1FBQTBCLElBQUksSUFBSSxDQUFKLEdBQVEsTUFBUixHQUFpQixTQUFTLElBQVQsR0FBZ0IsT0FBTyxPQUFPLHdCQUFQLENBQWdDLE1BQWhDLEVBQXdDLEdBQXhDLENBQXZCLEdBQXNFLElBQXJIO1FBQTJILENBQTNIO0FBQ0EsUUFBSSxRQUFPLE9BQVAseUNBQU8sT0FBUCxPQUFtQixRQUFuQixJQUErQixPQUFPLFFBQVEsUUFBZixLQUE0QixVQUEvRCxFQUEyRSxJQUFJLFFBQVEsUUFBUixDQUFpQixVQUFqQixFQUE2QixNQUE3QixFQUFxQyxHQUFyQyxFQUEwQyxJQUExQyxDQUFKLENBQTNFLEtBQ0ssS0FBSyxJQUFJLElBQUksV0FBVyxNQUFYLEdBQW9CLENBQWpDLEVBQW9DLEtBQUssQ0FBekMsRUFBNEMsR0FBNUM7QUFBaUQsWUFBSSxJQUFJLFdBQVcsQ0FBWCxDQUFSLEVBQXVCLElBQUksQ0FBQyxJQUFJLENBQUosR0FBUSxFQUFFLENBQUYsQ0FBUixHQUFlLElBQUksQ0FBSixHQUFRLEVBQUUsTUFBRixFQUFVLEdBQVYsRUFBZSxDQUFmLENBQVIsR0FBNEIsRUFBRSxNQUFGLEVBQVUsR0FBVixDQUE1QyxLQUErRCxDQUFuRTtBQUF4RSxLQUNMLE9BQU8sSUFBSSxDQUFKLElBQVMsQ0FBVCxJQUFjLE9BQU8sY0FBUCxDQUFzQixNQUF0QixFQUE4QixHQUE5QixFQUFtQyxDQUFuQyxDQUFkLEVBQXFELENBQTVEO0FBQ0gsQ0FMRDs7QUNJQSxTQUFBLFFBQUEsQ0FBa0IsR0FBbEIsRUFBOEI7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QThFLHlEQUFsRCxFQUFFLFVBQVUsSUFBWixFQUFrRDtBQUFBLGdCQUE5QixnQkFBOEI7QUFBaUIsa0JBQU0sSUFBSSxLQUFKLENBQVUsRUFBVixDQUFOO0FBQXNCOzs7NEJBdkIvSjtBQUFLLG1CQUFPLEtBQUssSUFBTCxDQUFVLE1BQWpCO0FBQTBCOzs7NEJBQzdCO0FBQUssbUJBQU8sS0FBSyxJQUFMLENBQVUsUUFBakI7QUFBNEIsUzswQkFDaEMsSyxFQUFLO0FBQUksaUJBQUssSUFBTCxDQUFVLFFBQVYsR0FBcUIsS0FBckI7QUFBNkI7Ozs7OztBQUUxRCxXQUFBLENBQUMsU0FBUyxZQUFULENBQUQsQ0FBQSxFRFNELEtBQUssU0NUSixFRFNlLFFDVGYsRURTeUIsSUNUekI7QUFHQSxXQUFBLENBQUMsU0FBUyxVQUFULENBQUQsQ0FBQSxFRFNELEtBQUssU0NUSixFRFNlLE1DVGYsRURTdUIsSUNUdkI7QUFHQSxXQUFBLENBQUMsU0FBUyxVQUFULENBQUQsQ0FBQSxFRFNELEtBQUssU0NUSixFRFNlLE1DVGYsRURTdUIsSUNUdkI7QUFHQSxXQUFBLENBQUMsVUFBRCxDQUFBLEVEU0QsS0FBSyxTQ1RKLEVEU2UsV0NUZixFRFM0QixJQ1Q1QjtBQUdBLFdBQUEsQ0FBQyxVQUFELENBQUEsRURTRCxLQUFLLFNDVEosRURTZSxjQ1RmLEVEUytCLElDVC9CO0FBR0EsV0FBQSxDQUFDLFVBQUQsQ0FBQSxFRFNELEtBQUssU0NUSixFRFNlLGNDVGYsRURTK0IsSUNUL0I7QUFHQSxXQUFBLENBQUMsVUFBRCxDQUFBLEVEU0QsS0FBSyxTQ1RKLEVEU2UsV0NUZixFRFM0QixJQ1Q1QjtBQVFHLElBQU0sc0JBQU8sSUFBSSxJQUFKLEVBQWIiLCJmaWxlIjoibGliL2F0b20vZG9jay5qcyIsInNvdXJjZXNDb250ZW50IjpbInZhciBfX2RlY29yYXRlID0gKHRoaXMgJiYgdGhpcy5fX2RlY29yYXRlKSB8fCBmdW5jdGlvbiAoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpIHtcbiAgICB2YXIgYyA9IGFyZ3VtZW50cy5sZW5ndGgsIHIgPSBjIDwgMyA/IHRhcmdldCA6IGRlc2MgPT09IG51bGwgPyBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih0YXJnZXQsIGtleSkgOiBkZXNjLCBkO1xuICAgIGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgUmVmbGVjdC5kZWNvcmF0ZSA9PT0gXCJmdW5jdGlvblwiKSByID0gUmVmbGVjdC5kZWNvcmF0ZShkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYyk7XG4gICAgZWxzZSBmb3IgKHZhciBpID0gZGVjb3JhdG9ycy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkgaWYgKGQgPSBkZWNvcmF0b3JzW2ldKSByID0gKGMgPCAzID8gZChyKSA6IGMgPiAzID8gZCh0YXJnZXQsIGtleSwgcikgOiBkKHRhcmdldCwga2V5KSkgfHwgcjtcbiAgICByZXR1cm4gYyA+IDMgJiYgciAmJiBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBrZXksIHIpLCByO1xufTtcbmltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUsIERpc3Bvc2FibGUgfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xuaW1wb3J0IHsgRG9ja1dpbmRvdyB9IGZyb20gXCIuLi92aWV3cy9kb2NrLXdpbmRvd1wiO1xuZnVuY3Rpb24gZnJvbURvY2soa2V5KSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIGZyb21Eb2NrKHRhcmdldCwgcHJvcGVydHlLZXksIGRlc2NyaXB0b3IpIHtcbiAgICAgICAgY29uc3QgaW50ZXJuYWxLZXkgPSBgJHtrZXkgfHwgcHJvcGVydHlLZXl9YDtcbiAgICAgICAgZGVzY3JpcHRvci52YWx1ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmRvY2tbaW50ZXJuYWxLZXldLmFwcGx5KHRoaXMuZG9jaywgYXJndW1lbnRzKTtcbiAgICAgICAgfTtcbiAgICB9O1xufVxuY2xhc3MgRG9jayB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuZG9jayA9IG5ldyBEb2NrV2luZG93O1xuICAgICAgICB0aGlzLnJlcXVpcmVkID0gdHJ1ZTtcbiAgICAgICAgdGhpcy50aXRsZSA9IFwiRG9ja1wiO1xuICAgICAgICB0aGlzLmRlc2NyaXB0aW9uID0gXCJUaGUgZG9jayB3aW5kb3cgdXNlZCB0byBzaG93IGxvZ3MgYW5kIGRpYWdub3N0aWNzIGFuZCBvdGhlciB0aGluZ3MuXCI7XG4gICAgfVxuICAgIGFjdGl2YXRlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTp0b2dnbGUtZG9ja1wiLCAoKSA9PiB0aGlzLnRvZ2dsZSgpKSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcIm9tbmlzaGFycC1hdG9tOnNob3ctZG9ja1wiLCAoKSA9PiB0aGlzLnNob3coKSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTpoaWRlLWRvY2tcIiwgKCkgPT4gdGhpcy5oaWRlKCkpKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwiY29yZTpjbG9zZVwiLCAoKSA9PiB0aGlzLmhpZGUoKSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJjb3JlOmNhbmNlbFwiLCAoKSA9PiB0aGlzLmhpZGUoKSkpO1xuICAgIH1cbiAgICBhdHRhY2goKSB7XG4gICAgICAgIGNvbnN0IHAgPSBhdG9tLndvcmtzcGFjZS5hZGRCb3R0b21QYW5lbCh7XG4gICAgICAgICAgICBpdGVtOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKSxcbiAgICAgICAgICAgIHZpc2libGU6IGZhbHNlLFxuICAgICAgICAgICAgcHJpb3JpdHk6IDEwMDBcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMudmlldyA9IHAuaXRlbS5wYXJlbnRFbGVtZW50O1xuICAgICAgICB0aGlzLnZpZXcuY2xhc3NMaXN0LmFkZChcIm9tbmlzaGFycC1hdG9tLXBhbmVcIik7XG4gICAgICAgIHRoaXMuZG9jay5zZXRQYW5lbChwKTtcbiAgICAgICAgdGhpcy52aWV3LmFwcGVuZENoaWxkKHRoaXMuZG9jayk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xuICAgICAgICAgICAgcC5kZXN0cm95KCk7XG4gICAgICAgICAgICB0aGlzLnZpZXcucmVtb3ZlKCk7XG4gICAgICAgIH0pKTtcbiAgICB9XG4gICAgZGlzcG9zZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICB9XG4gICAgZ2V0IGlzT3BlbigpIHsgcmV0dXJuIHRoaXMuZG9jay5pc09wZW47IH1cbiAgICBnZXQgc2VsZWN0ZWQoKSB7IHJldHVybiB0aGlzLmRvY2suc2VsZWN0ZWQ7IH1cbiAgICBzZXQgc2VsZWN0ZWQodmFsdWUpIHsgdGhpcy5kb2NrLnNlbGVjdGVkID0gdmFsdWU7IH1cbiAgICB0b2dnbGUoKSB7IH1cbiAgICBzaG93KCkgeyB9XG4gICAgO1xuICAgIGhpZGUoKSB7IH1cbiAgICA7XG4gICAgYWRkV2luZG93KGlkLCB0aXRsZSwgdmlldywgb3B0aW9ucyA9IHsgcHJpb3JpdHk6IDEwMDAgfSwgcGFyZW50RGlzcG9zYWJsZSkgeyB0aHJvdyBuZXcgRXJyb3IoXCJcIik7IH1cbiAgICB0b2dnbGVXaW5kb3coc2VsZWN0ZWQpIHsgfVxuICAgIHNlbGVjdFdpbmRvdyhzZWxlY3RlZCkgeyB9XG4gICAgYWRkQnV0dG9uKGlkLCB0aXRsZSwgdmlldywgb3B0aW9ucyA9IHsgcHJpb3JpdHk6IDEwMDAgfSwgcGFyZW50RGlzcG9zYWJsZSkgeyB0aHJvdyBuZXcgRXJyb3IoXCJcIik7IH1cbn1cbl9fZGVjb3JhdGUoW1xuICAgIGZyb21Eb2NrKFwidG9nZ2xlVmlld1wiKVxuXSwgRG9jay5wcm90b3R5cGUsIFwidG9nZ2xlXCIsIG51bGwpO1xuX19kZWNvcmF0ZShbXG4gICAgZnJvbURvY2soXCJzaG93Vmlld1wiKVxuXSwgRG9jay5wcm90b3R5cGUsIFwic2hvd1wiLCBudWxsKTtcbl9fZGVjb3JhdGUoW1xuICAgIGZyb21Eb2NrKFwiaGlkZVZpZXdcIilcbl0sIERvY2sucHJvdG90eXBlLCBcImhpZGVcIiwgbnVsbCk7XG5fX2RlY29yYXRlKFtcbiAgICBmcm9tRG9jaygpXG5dLCBEb2NrLnByb3RvdHlwZSwgXCJhZGRXaW5kb3dcIiwgbnVsbCk7XG5fX2RlY29yYXRlKFtcbiAgICBmcm9tRG9jaygpXG5dLCBEb2NrLnByb3RvdHlwZSwgXCJ0b2dnbGVXaW5kb3dcIiwgbnVsbCk7XG5fX2RlY29yYXRlKFtcbiAgICBmcm9tRG9jaygpXG5dLCBEb2NrLnByb3RvdHlwZSwgXCJzZWxlY3RXaW5kb3dcIiwgbnVsbCk7XG5fX2RlY29yYXRlKFtcbiAgICBmcm9tRG9jaygpXG5dLCBEb2NrLnByb3RvdHlwZSwgXCJhZGRCdXR0b25cIiwgbnVsbCk7XG5leHBvcnQgY29uc3QgZG9jayA9IG5ldyBEb2NrO1xuIiwiaW1wb3J0IHtDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlLCBJRGlzcG9zYWJsZX0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcclxuaW1wb3J0IHtEb2NrV2luZG93LCBEb2NCdXR0b25PcHRpb25zLCBQYW5lQnV0dG9uT3B0aW9uc30gZnJvbSBcIi4uL3ZpZXdzL2RvY2std2luZG93XCI7XHJcblxyXG5cclxuZnVuY3Rpb24gZnJvbURvY2soa2V5Pzogc3RyaW5nKSB7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24gZnJvbURvY2sodGFyZ2V0OiBPYmplY3QsIHByb3BlcnR5S2V5OiBzdHJpbmcsIGRlc2NyaXB0b3I6IFR5cGVkUHJvcGVydHlEZXNjcmlwdG9yPGFueT4pIHtcclxuICAgICAgICBjb25zdCBpbnRlcm5hbEtleSA9IGAke2tleSB8fCBwcm9wZXJ0eUtleX1gO1xyXG4gICAgICAgIGRlc2NyaXB0b3IudmFsdWUgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZG9ja1tpbnRlcm5hbEtleV0uYXBwbHkodGhpcy5kb2NrLCBhcmd1bWVudHMpO1xyXG4gICAgICAgIH07XHJcbiAgICB9O1xyXG59XHJcblxyXG5jbGFzcyBEb2NrIGltcGxlbWVudHMgSUF0b21GZWF0dXJlIHtcclxuICAgIHByaXZhdGUgZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxuICAgIHByaXZhdGUgdmlldzogRWxlbWVudDtcclxuICAgIHByaXZhdGUgZG9jazogRG9ja1dpbmRvdyA9IG5ldyBEb2NrV2luZG93O1xyXG5cclxuICAgIHB1YmxpYyBhY3RpdmF0ZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTp0b2dnbGUtZG9ja1wiLCAoKSA9PiB0aGlzLnRvZ2dsZSgpKSk7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwib21uaXNoYXJwLWF0b206c2hvdy1kb2NrXCIsICgpID0+IHRoaXMuc2hvdygpKSk7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwib21uaXNoYXJwLWF0b206aGlkZS1kb2NrXCIsICgpID0+IHRoaXMuaGlkZSgpKSk7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwiY29yZTpjbG9zZVwiLCAoKSA9PiB0aGlzLmhpZGUoKSkpO1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcImNvcmU6Y2FuY2VsXCIsICgpID0+IHRoaXMuaGlkZSgpKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGF0dGFjaCgpIHtcclxuICAgICAgICBjb25zdCBwID0gYXRvbS53b3Jrc3BhY2UuYWRkQm90dG9tUGFuZWwoe1xyXG4gICAgICAgICAgICBpdGVtOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKSxcclxuICAgICAgICAgICAgdmlzaWJsZTogZmFsc2UsXHJcbiAgICAgICAgICAgIHByaW9yaXR5OiAxMDAwXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHRoaXMudmlldyA9IHAuaXRlbS5wYXJlbnRFbGVtZW50O1xyXG4gICAgICAgIHRoaXMudmlldy5jbGFzc0xpc3QuYWRkKFwib21uaXNoYXJwLWF0b20tcGFuZVwiKTtcclxuICAgICAgICB0aGlzLmRvY2suc2V0UGFuZWwocCk7XHJcblxyXG4gICAgICAgIHRoaXMudmlldy5hcHBlbmRDaGlsZCh0aGlzLmRvY2spO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcclxuICAgICAgICAgICAgcC5kZXN0cm95KCk7XHJcbiAgICAgICAgICAgIHRoaXMudmlldy5yZW1vdmUoKTtcclxuICAgICAgICB9KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0IGlzT3BlbigpIHsgcmV0dXJuIHRoaXMuZG9jay5pc09wZW47IH1cclxuICAgIHB1YmxpYyBnZXQgc2VsZWN0ZWQoKSB7IHJldHVybiB0aGlzLmRvY2suc2VsZWN0ZWQ7IH1cclxuICAgIHB1YmxpYyBzZXQgc2VsZWN0ZWQodmFsdWUpIHsgdGhpcy5kb2NrLnNlbGVjdGVkID0gdmFsdWU7IH1cclxuXHJcbiAgICBAZnJvbURvY2soXCJ0b2dnbGVWaWV3XCIpXHJcbiAgICBwdWJsaWMgdG9nZ2xlKCkgeyAvKiAqLyB9XHJcblxyXG4gICAgQGZyb21Eb2NrKFwic2hvd1ZpZXdcIilcclxuICAgIHB1YmxpYyBzaG93KCkgeyAvKiAqLyB9O1xyXG5cclxuICAgIEBmcm9tRG9jayhcImhpZGVWaWV3XCIpXHJcbiAgICBwdWJsaWMgaGlkZSgpIHsgLyogKi8gfTtcclxuXHJcbiAgICBAZnJvbURvY2soKVxyXG4gICAgcHVibGljIGFkZFdpbmRvdyhpZDogc3RyaW5nLCB0aXRsZTogc3RyaW5nLCB2aWV3OiBFbGVtZW50LCBvcHRpb25zOiBQYW5lQnV0dG9uT3B0aW9ucyA9IHsgcHJpb3JpdHk6IDEwMDAgfSwgcGFyZW50RGlzcG9zYWJsZT86IElEaXNwb3NhYmxlKTogSURpc3Bvc2FibGUgeyB0aHJvdyBuZXcgRXJyb3IoXCJcIik7IH1cclxuXHJcbiAgICBAZnJvbURvY2soKVxyXG4gICAgcHVibGljIHRvZ2dsZVdpbmRvdyhzZWxlY3RlZDogc3RyaW5nKSB7IC8qICovIH1cclxuXHJcbiAgICBAZnJvbURvY2soKVxyXG4gICAgcHVibGljIHNlbGVjdFdpbmRvdyhzZWxlY3RlZDogc3RyaW5nKSB7IC8qICovIH1cclxuXHJcbiAgICBAZnJvbURvY2soKVxyXG4gICAgcHVibGljIGFkZEJ1dHRvbihpZDogc3RyaW5nLCB0aXRsZTogc3RyaW5nLCB2aWV3OiBFbGVtZW50LCBvcHRpb25zOiBEb2NCdXR0b25PcHRpb25zID0geyBwcmlvcml0eTogMTAwMCB9LCBwYXJlbnREaXNwb3NhYmxlPzogSURpc3Bvc2FibGUpOiBJRGlzcG9zYWJsZSB7IHRocm93IG5ldyBFcnJvcihcIlwiKTsgfVxyXG5cclxuICAgIHB1YmxpYyByZXF1aXJlZCA9IHRydWU7XHJcbiAgICBwdWJsaWMgdGl0bGUgPSBcIkRvY2tcIjtcclxuICAgIHB1YmxpYyBkZXNjcmlwdGlvbiA9IFwiVGhlIGRvY2sgd2luZG93IHVzZWQgdG8gc2hvdyBsb2dzIGFuZCBkaWFnbm9zdGljcyBhbmQgb3RoZXIgdGhpbmdzLlwiO1xyXG59XHJcblxyXG5leHBvcnQgY29uc3QgZG9jayA9IG5ldyBEb2NrO1xyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
