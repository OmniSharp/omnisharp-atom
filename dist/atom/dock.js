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
var __metadata = undefined && undefined.__metadata || function (k, v) {
    if ((typeof Reflect === "undefined" ? "undefined" : _typeof(Reflect)) === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
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
        this.title = 'Dock';
        this.description = 'The dock window used to show logs and diagnostics and other things.';
    }

    _createClass(Dock, [{
        key: "activate",
        value: function activate() {
            var _this = this;

            this.disposable = new _tsDisposables.CompositeDisposable();
            this.disposable.add(atom.commands.add('atom-workspace', 'omnisharp-atom:toggle-dock', function () {
                return _this.toggle();
            }));
            this.disposable.add(atom.commands.add('atom-workspace', 'omnisharp-atom:show-dock', function () {
                return _this.show();
            }));
            this.disposable.add(atom.commands.add('atom-workspace', 'omnisharp-atom:hide-dock', function () {
                return _this.hide();
            }));
            this.disposable.add(atom.commands.add('atom-workspace', 'core:close', function () {
                return _this.hide();
            }));
            this.disposable.add(atom.commands.add('atom-workspace', 'core:cancel', function () {
                return _this.hide();
            }));
        }
    }, {
        key: "attach",
        value: function attach() {
            var _this2 = this;

            var p = atom.workspace.addBottomPanel({
                item: document.createElement('span'),
                visible: false,
                priority: 1000
            });
            this.view = p.item.parentElement;
            this.view.classList.add('omnisharp-atom-pane');
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
            throw new Error('');
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
            throw new Error('');
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

__decorate([fromDock('toggleView'), __metadata("design:type", Function), __metadata("design:paramtypes", []), __metadata("design:returntype", void 0)], Dock.prototype, "toggle", null);
__decorate([fromDock('showView'), __metadata("design:type", Function), __metadata("design:paramtypes", []), __metadata("design:returntype", void 0)], Dock.prototype, "show", null);
__decorate([fromDock('hideView'), __metadata("design:type", Function), __metadata("design:paramtypes", []), __metadata("design:returntype", void 0)], Dock.prototype, "hide", null);
__decorate([fromDock(), __metadata("design:type", Function), __metadata("design:paramtypes", [String, String, Element, Object, Object]), __metadata("design:returntype", Object)], Dock.prototype, "addWindow", null);
__decorate([fromDock(), __metadata("design:type", Function), __metadata("design:paramtypes", [String]), __metadata("design:returntype", void 0)], Dock.prototype, "toggleWindow", null);
__decorate([fromDock(), __metadata("design:type", Function), __metadata("design:paramtypes", [String]), __metadata("design:returntype", void 0)], Dock.prototype, "selectWindow", null);
__decorate([fromDock(), __metadata("design:type", Function), __metadata("design:paramtypes", [String, String, Element, Object, Object]), __metadata("design:returntype", Object)], Dock.prototype, "addButton", null);
var dock = exports.dock = new Dock();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9hdG9tL2RvY2sudHMiLCJsaWIvYXRvbS9kb2NrLmpzIl0sIm5hbWVzIjpbIl9fZGVjb3JhdGUiLCJkZWNvcmF0b3JzIiwidGFyZ2V0Iiwia2V5IiwiZGVzYyIsImMiLCJhcmd1bWVudHMiLCJsZW5ndGgiLCJyIiwiT2JqZWN0IiwiZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yIiwiZCIsIlJlZmxlY3QiLCJkZWNvcmF0ZSIsImkiLCJkZWZpbmVQcm9wZXJ0eSIsIl9fbWV0YWRhdGEiLCJrIiwidiIsIm1ldGFkYXRhIiwiZnJvbURvY2siLCJwcm9wZXJ0eUtleSIsImRlc2NyaXB0b3IiLCJpbnRlcm5hbEtleSIsInZhbHVlIiwiZG9jayIsImFwcGx5IiwiRG9jayIsInJlcXVpcmVkIiwidGl0bGUiLCJkZXNjcmlwdGlvbiIsImRpc3Bvc2FibGUiLCJhZGQiLCJhdG9tIiwiY29tbWFuZHMiLCJ0b2dnbGUiLCJzaG93IiwiaGlkZSIsInAiLCJ3b3Jrc3BhY2UiLCJhZGRCb3R0b21QYW5lbCIsIml0ZW0iLCJkb2N1bWVudCIsImNyZWF0ZUVsZW1lbnQiLCJ2aXNpYmxlIiwicHJpb3JpdHkiLCJ2aWV3IiwicGFyZW50RWxlbWVudCIsImNsYXNzTGlzdCIsInNldFBhbmVsIiwiYXBwZW5kQ2hpbGQiLCJjcmVhdGUiLCJkZXN0cm95IiwicmVtb3ZlIiwiZGlzcG9zZSIsImlkIiwib3B0aW9ucyIsInBhcmVudERpc3Bvc2FibGUiLCJFcnJvciIsInNlbGVjdGVkIiwiaXNPcGVuIiwiRnVuY3Rpb24iLCJwcm90b3R5cGUiLCJTdHJpbmciLCJFbGVtZW50Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUFBOztBQUNBOzs7O0FDREEsSUFBSUEsYUFBYyxhQUFRLFVBQUtBLFVBQWQsSUFBNkIsVUFBVUMsVUFBVixFQUFzQkMsTUFBdEIsRUFBOEJDLEdBQTlCLEVBQW1DQyxJQUFuQyxFQUF5QztBQUNuRixRQUFJQyxJQUFJQyxVQUFVQyxNQUFsQjtBQUFBLFFBQTBC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dkQsTUM4QnpCLEVEOUJ5QkEsTUM4QnpCLENBQWhDLENEOUJBLEVDK0JBTyxXQUFXLG1CQUFYLEVBQWdDUCxNQUFoQyxDRC9CQSxDQUFBLEVDZ0NEa0IsS0FBS21DLFNEaENKLEVDZ0NlLFdEaENmLEVDZ0M0QixJRGhDNUI7QUFPRyxJQUFNckMsc0JBQU8sSUFBSUUsSUFBSixFQUFiIiwiZmlsZSI6ImxpYi9hdG9tL2RvY2suanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge0NvbXBvc2l0ZURpc3Bvc2FibGUsIERpc3Bvc2FibGUsIElEaXNwb3NhYmxlfSBmcm9tICd0cy1kaXNwb3NhYmxlcyc7XHJcbmltcG9ydCB7RG9ja1dpbmRvdywgRG9jQnV0dG9uT3B0aW9ucywgUGFuZUJ1dHRvbk9wdGlvbnN9IGZyb20gJy4uL3ZpZXdzL2RvY2std2luZG93JztcclxuXHJcblxyXG5mdW5jdGlvbiBmcm9tRG9jayhrZXk/OiBzdHJpbmcpIHtcclxuICAgIHJldHVybiBmdW5jdGlvbiBmcm9tRG9jayh0YXJnZXQ6IE9iamVjdCwgcHJvcGVydHlLZXk6IHN0cmluZywgZGVzY3JpcHRvcjogVHlwZWRQcm9wZXJ0eURlc2NyaXB0b3I8YW55Pikge1xyXG4gICAgICAgIGNvbnN0IGludGVybmFsS2V5ID0gYCR7a2V5IHx8IHByb3BlcnR5S2V5fWA7XHJcbiAgICAgICAgZGVzY3JpcHRvci52YWx1ZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZG9ja1tpbnRlcm5hbEtleV0uYXBwbHkodGhpcy5kb2NrLCBhcmd1bWVudHMpO1xyXG4gICAgICAgIH07XHJcbiAgICB9O1xyXG59XHJcblxyXG5jbGFzcyBEb2NrIGltcGxlbWVudHMgSUF0b21GZWF0dXJlIHtcclxuICAgIHByaXZhdGUgZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxuICAgIHByaXZhdGUgdmlldzogRWxlbWVudDtcclxuICAgIHByaXZhdGUgZG9jazogRG9ja1dpbmRvdyA9IG5ldyBEb2NrV2luZG93O1xyXG5cclxuICAgIHB1YmxpYyBhY3RpdmF0ZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKCdhdG9tLXdvcmtzcGFjZScsICdvbW5pc2hhcnAtYXRvbTp0b2dnbGUtZG9jaycsICgpID0+IHRoaXMudG9nZ2xlKCkpKTtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKCdhdG9tLXdvcmtzcGFjZScsICdvbW5pc2hhcnAtYXRvbTpzaG93LWRvY2snLCAoKSA9PiB0aGlzLnNob3coKSkpO1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoJ2F0b20td29ya3NwYWNlJywgJ29tbmlzaGFycC1hdG9tOmhpZGUtZG9jaycsICgpID0+IHRoaXMuaGlkZSgpKSk7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZCgnYXRvbS13b3Jrc3BhY2UnLCAnY29yZTpjbG9zZScsICgpID0+IHRoaXMuaGlkZSgpKSk7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZCgnYXRvbS13b3Jrc3BhY2UnLCAnY29yZTpjYW5jZWwnLCAoKSA9PiB0aGlzLmhpZGUoKSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBhdHRhY2goKSB7XHJcbiAgICAgICAgY29uc3QgcCA9IGF0b20ud29ya3NwYWNlLmFkZEJvdHRvbVBhbmVsKHtcclxuICAgICAgICAgICAgaXRlbTogZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpLFxyXG4gICAgICAgICAgICB2aXNpYmxlOiBmYWxzZSxcclxuICAgICAgICAgICAgcHJpb3JpdHk6IDEwMDBcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdGhpcy52aWV3ID0gcC5pdGVtLnBhcmVudEVsZW1lbnQ7XHJcbiAgICAgICAgdGhpcy52aWV3LmNsYXNzTGlzdC5hZGQoJ29tbmlzaGFycC1hdG9tLXBhbmUnKTtcclxuICAgICAgICB0aGlzLmRvY2suc2V0UGFuZWwocCk7XHJcblxyXG4gICAgICAgIHRoaXMudmlldy5hcHBlbmRDaGlsZCh0aGlzLmRvY2spO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcclxuICAgICAgICAgICAgcC5kZXN0cm95KCk7XHJcbiAgICAgICAgICAgIHRoaXMudmlldy5yZW1vdmUoKTtcclxuICAgICAgICB9KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0IGlzT3BlbigpIHsgcmV0dXJuIHRoaXMuZG9jay5pc09wZW47IH1cclxuICAgIHB1YmxpYyBnZXQgc2VsZWN0ZWQoKSB7IHJldHVybiB0aGlzLmRvY2suc2VsZWN0ZWQ7IH1cclxuICAgIHB1YmxpYyBzZXQgc2VsZWN0ZWQodmFsdWUpIHsgdGhpcy5kb2NrLnNlbGVjdGVkID0gdmFsdWU7IH1cclxuXHJcbiAgICBAZnJvbURvY2soJ3RvZ2dsZVZpZXcnKVxyXG4gICAgcHVibGljIHRvZ2dsZSgpIHsgLyogKi8gfVxyXG5cclxuICAgIEBmcm9tRG9jaygnc2hvd1ZpZXcnKVxyXG4gICAgcHVibGljIHNob3coKSB7IC8qICovIH07XHJcblxyXG4gICAgQGZyb21Eb2NrKCdoaWRlVmlldycpXHJcbiAgICBwdWJsaWMgaGlkZSgpIHsgLyogKi8gfTtcclxuXHJcbiAgICBAZnJvbURvY2soKVxyXG4gICAgcHVibGljIGFkZFdpbmRvdyhpZDogc3RyaW5nLCB0aXRsZTogc3RyaW5nLCB2aWV3OiBFbGVtZW50LCBvcHRpb25zOiBQYW5lQnV0dG9uT3B0aW9ucyA9IHsgcHJpb3JpdHk6IDEwMDAgfSwgcGFyZW50RGlzcG9zYWJsZT86IElEaXNwb3NhYmxlKTogSURpc3Bvc2FibGUgeyB0aHJvdyBuZXcgRXJyb3IoJycpOyB9XHJcblxyXG4gICAgQGZyb21Eb2NrKClcclxuICAgIHB1YmxpYyB0b2dnbGVXaW5kb3coc2VsZWN0ZWQ6IHN0cmluZykgeyAvKiAqLyB9XHJcblxyXG4gICAgQGZyb21Eb2NrKClcclxuICAgIHB1YmxpYyBzZWxlY3RXaW5kb3coc2VsZWN0ZWQ6IHN0cmluZykgeyAvKiAqLyB9XHJcblxyXG4gICAgQGZyb21Eb2NrKClcclxuICAgIHB1YmxpYyBhZGRCdXR0b24oaWQ6IHN0cmluZywgdGl0bGU6IHN0cmluZywgdmlldzogRWxlbWVudCwgb3B0aW9uczogRG9jQnV0dG9uT3B0aW9ucyA9IHsgcHJpb3JpdHk6IDEwMDAgfSwgcGFyZW50RGlzcG9zYWJsZT86IElEaXNwb3NhYmxlKTogSURpc3Bvc2FibGUgeyB0aHJvdyBuZXcgRXJyb3IoJycpOyB9XHJcblxyXG4gICAgcHVibGljIHJlcXVpcmVkID0gdHJ1ZTtcclxuICAgIHB1YmxpYyB0aXRsZSA9ICdEb2NrJztcclxuICAgIHB1YmxpYyBkZXNjcmlwdGlvbiA9ICdUaGUgZG9jayB3aW5kb3cgdXNlZCB0byBzaG93IGxvZ3MgYW5kIGRpYWdub3N0aWNzIGFuZCBvdGhlciB0aGluZ3MuJztcclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IGRvY2sgPSBuZXcgRG9jaztcclxuIiwidmFyIF9fZGVjb3JhdGUgPSAodGhpcyAmJiB0aGlzLl9fZGVjb3JhdGUpIHx8IGZ1bmN0aW9uIChkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYykge1xuICAgIHZhciBjID0gYXJndW1lbnRzLmxlbmd0aCwgciA9IGMgPCAzID8gdGFyZ2V0IDogZGVzYyA9PT0gbnVsbCA/IGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHRhcmdldCwga2V5KSA6IGRlc2MsIGQ7XG4gICAgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBSZWZsZWN0LmRlY29yYXRlID09PSBcImZ1bmN0aW9uXCIpIHIgPSBSZWZsZWN0LmRlY29yYXRlKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKTtcbiAgICBlbHNlIGZvciAodmFyIGkgPSBkZWNvcmF0b3JzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSBpZiAoZCA9IGRlY29yYXRvcnNbaV0pIHIgPSAoYyA8IDMgPyBkKHIpIDogYyA+IDMgPyBkKHRhcmdldCwga2V5LCByKSA6IGQodGFyZ2V0LCBrZXkpKSB8fCByO1xuICAgIHJldHVybiBjID4gMyAmJiByICYmIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGtleSwgciksIHI7XG59O1xudmFyIF9fbWV0YWRhdGEgPSAodGhpcyAmJiB0aGlzLl9fbWV0YWRhdGEpIHx8IGZ1bmN0aW9uIChrLCB2KSB7XG4gICAgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBSZWZsZWN0Lm1ldGFkYXRhID09PSBcImZ1bmN0aW9uXCIpIHJldHVybiBSZWZsZWN0Lm1ldGFkYXRhKGssIHYpO1xufTtcbmltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUsIERpc3Bvc2FibGUgfSBmcm9tICd0cy1kaXNwb3NhYmxlcyc7XG5pbXBvcnQgeyBEb2NrV2luZG93IH0gZnJvbSAnLi4vdmlld3MvZG9jay13aW5kb3cnO1xuZnVuY3Rpb24gZnJvbURvY2soa2V5KSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIGZyb21Eb2NrKHRhcmdldCwgcHJvcGVydHlLZXksIGRlc2NyaXB0b3IpIHtcbiAgICAgICAgY29uc3QgaW50ZXJuYWxLZXkgPSBgJHtrZXkgfHwgcHJvcGVydHlLZXl9YDtcbiAgICAgICAgZGVzY3JpcHRvci52YWx1ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmRvY2tbaW50ZXJuYWxLZXldLmFwcGx5KHRoaXMuZG9jaywgYXJndW1lbnRzKTtcbiAgICAgICAgfTtcbiAgICB9O1xufVxuY2xhc3MgRG9jayB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuZG9jayA9IG5ldyBEb2NrV2luZG93O1xuICAgICAgICB0aGlzLnJlcXVpcmVkID0gdHJ1ZTtcbiAgICAgICAgdGhpcy50aXRsZSA9ICdEb2NrJztcbiAgICAgICAgdGhpcy5kZXNjcmlwdGlvbiA9ICdUaGUgZG9jayB3aW5kb3cgdXNlZCB0byBzaG93IGxvZ3MgYW5kIGRpYWdub3N0aWNzIGFuZCBvdGhlciB0aGluZ3MuJztcbiAgICB9XG4gICAgYWN0aXZhdGUoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoJ2F0b20td29ya3NwYWNlJywgJ29tbmlzaGFycC1hdG9tOnRvZ2dsZS1kb2NrJywgKCkgPT4gdGhpcy50b2dnbGUoKSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKCdhdG9tLXdvcmtzcGFjZScsICdvbW5pc2hhcnAtYXRvbTpzaG93LWRvY2snLCAoKSA9PiB0aGlzLnNob3coKSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKCdhdG9tLXdvcmtzcGFjZScsICdvbW5pc2hhcnAtYXRvbTpoaWRlLWRvY2snLCAoKSA9PiB0aGlzLmhpZGUoKSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKCdhdG9tLXdvcmtzcGFjZScsICdjb3JlOmNsb3NlJywgKCkgPT4gdGhpcy5oaWRlKCkpKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZCgnYXRvbS13b3Jrc3BhY2UnLCAnY29yZTpjYW5jZWwnLCAoKSA9PiB0aGlzLmhpZGUoKSkpO1xuICAgIH1cbiAgICBhdHRhY2goKSB7XG4gICAgICAgIGNvbnN0IHAgPSBhdG9tLndvcmtzcGFjZS5hZGRCb3R0b21QYW5lbCh7XG4gICAgICAgICAgICBpdGVtOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyksXG4gICAgICAgICAgICB2aXNpYmxlOiBmYWxzZSxcbiAgICAgICAgICAgIHByaW9yaXR5OiAxMDAwXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLnZpZXcgPSBwLml0ZW0ucGFyZW50RWxlbWVudDtcbiAgICAgICAgdGhpcy52aWV3LmNsYXNzTGlzdC5hZGQoJ29tbmlzaGFycC1hdG9tLXBhbmUnKTtcbiAgICAgICAgdGhpcy5kb2NrLnNldFBhbmVsKHApO1xuICAgICAgICB0aGlzLnZpZXcuYXBwZW5kQ2hpbGQodGhpcy5kb2NrKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XG4gICAgICAgICAgICBwLmRlc3Ryb3koKTtcbiAgICAgICAgICAgIHRoaXMudmlldy5yZW1vdmUoKTtcbiAgICAgICAgfSkpO1xuICAgIH1cbiAgICBkaXNwb3NlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgIH1cbiAgICBnZXQgaXNPcGVuKCkgeyByZXR1cm4gdGhpcy5kb2NrLmlzT3BlbjsgfVxuICAgIGdldCBzZWxlY3RlZCgpIHsgcmV0dXJuIHRoaXMuZG9jay5zZWxlY3RlZDsgfVxuICAgIHNldCBzZWxlY3RlZCh2YWx1ZSkgeyB0aGlzLmRvY2suc2VsZWN0ZWQgPSB2YWx1ZTsgfVxuICAgIHRvZ2dsZSgpIHsgfVxuICAgIHNob3coKSB7IH1cbiAgICA7XG4gICAgaGlkZSgpIHsgfVxuICAgIDtcbiAgICBhZGRXaW5kb3coaWQsIHRpdGxlLCB2aWV3LCBvcHRpb25zID0geyBwcmlvcml0eTogMTAwMCB9LCBwYXJlbnREaXNwb3NhYmxlKSB7IHRocm93IG5ldyBFcnJvcignJyk7IH1cbiAgICB0b2dnbGVXaW5kb3coc2VsZWN0ZWQpIHsgfVxuICAgIHNlbGVjdFdpbmRvdyhzZWxlY3RlZCkgeyB9XG4gICAgYWRkQnV0dG9uKGlkLCB0aXRsZSwgdmlldywgb3B0aW9ucyA9IHsgcHJpb3JpdHk6IDEwMDAgfSwgcGFyZW50RGlzcG9zYWJsZSkgeyB0aHJvdyBuZXcgRXJyb3IoJycpOyB9XG59XG5fX2RlY29yYXRlKFtcbiAgICBmcm9tRG9jaygndG9nZ2xlVmlldycpLFxuICAgIF9fbWV0YWRhdGEoXCJkZXNpZ246dHlwZVwiLCBGdW5jdGlvbiksXG4gICAgX19tZXRhZGF0YShcImRlc2lnbjpwYXJhbXR5cGVzXCIsIFtdKSxcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnJldHVybnR5cGVcIiwgdm9pZCAwKVxuXSwgRG9jay5wcm90b3R5cGUsIFwidG9nZ2xlXCIsIG51bGwpO1xuX19kZWNvcmF0ZShbXG4gICAgZnJvbURvY2soJ3Nob3dWaWV3JyksXG4gICAgX19tZXRhZGF0YShcImRlc2lnbjp0eXBlXCIsIEZ1bmN0aW9uKSxcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnBhcmFtdHlwZXNcIiwgW10pLFxuICAgIF9fbWV0YWRhdGEoXCJkZXNpZ246cmV0dXJudHlwZVwiLCB2b2lkIDApXG5dLCBEb2NrLnByb3RvdHlwZSwgXCJzaG93XCIsIG51bGwpO1xuX19kZWNvcmF0ZShbXG4gICAgZnJvbURvY2soJ2hpZGVWaWV3JyksXG4gICAgX19tZXRhZGF0YShcImRlc2lnbjp0eXBlXCIsIEZ1bmN0aW9uKSxcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnBhcmFtdHlwZXNcIiwgW10pLFxuICAgIF9fbWV0YWRhdGEoXCJkZXNpZ246cmV0dXJudHlwZVwiLCB2b2lkIDApXG5dLCBEb2NrLnByb3RvdHlwZSwgXCJoaWRlXCIsIG51bGwpO1xuX19kZWNvcmF0ZShbXG4gICAgZnJvbURvY2soKSxcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnR5cGVcIiwgRnVuY3Rpb24pLFxuICAgIF9fbWV0YWRhdGEoXCJkZXNpZ246cGFyYW10eXBlc1wiLCBbU3RyaW5nLCBTdHJpbmcsIEVsZW1lbnQsIE9iamVjdCwgT2JqZWN0XSksXG4gICAgX19tZXRhZGF0YShcImRlc2lnbjpyZXR1cm50eXBlXCIsIE9iamVjdClcbl0sIERvY2sucHJvdG90eXBlLCBcImFkZFdpbmRvd1wiLCBudWxsKTtcbl9fZGVjb3JhdGUoW1xuICAgIGZyb21Eb2NrKCksXG4gICAgX19tZXRhZGF0YShcImRlc2lnbjp0eXBlXCIsIEZ1bmN0aW9uKSxcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnBhcmFtdHlwZXNcIiwgW1N0cmluZ10pLFxuICAgIF9fbWV0YWRhdGEoXCJkZXNpZ246cmV0dXJudHlwZVwiLCB2b2lkIDApXG5dLCBEb2NrLnByb3RvdHlwZSwgXCJ0b2dnbGVXaW5kb3dcIiwgbnVsbCk7XG5fX2RlY29yYXRlKFtcbiAgICBmcm9tRG9jaygpLFxuICAgIF9fbWV0YWRhdGEoXCJkZXNpZ246dHlwZVwiLCBGdW5jdGlvbiksXG4gICAgX19tZXRhZGF0YShcImRlc2lnbjpwYXJhbXR5cGVzXCIsIFtTdHJpbmddKSxcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnJldHVybnR5cGVcIiwgdm9pZCAwKVxuXSwgRG9jay5wcm90b3R5cGUsIFwic2VsZWN0V2luZG93XCIsIG51bGwpO1xuX19kZWNvcmF0ZShbXG4gICAgZnJvbURvY2soKSxcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnR5cGVcIiwgRnVuY3Rpb24pLFxuICAgIF9fbWV0YWRhdGEoXCJkZXNpZ246cGFyYW10eXBlc1wiLCBbU3RyaW5nLCBTdHJpbmcsIEVsZW1lbnQsIE9iamVjdCwgT2JqZWN0XSksXG4gICAgX19tZXRhZGF0YShcImRlc2lnbjpyZXR1cm50eXBlXCIsIE9iamVjdClcbl0sIERvY2sucHJvdG90eXBlLCBcImFkZEJ1dHRvblwiLCBudWxsKTtcbmV4cG9ydCBjb25zdCBkb2NrID0gbmV3IERvY2s7XG4iXX0=
