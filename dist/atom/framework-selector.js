"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.frameworkSelector = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _omnisharpClient = require("omnisharp-client");

var _omni = require("../server/omni");

var _frameworkSelectorView = require("../views/framework-selector-view");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var FrameworkSelector = function () {
    function FrameworkSelector() {
        _classCallCheck(this, FrameworkSelector);

        this._active = false;
        this.required = true;
        this.title = "Framework Selector";
        this.description = "Lets you select the framework you\"re currently targeting.";
    }

    _createClass(FrameworkSelector, [{
        key: "activate",
        value: function activate() {
            this.disposable = new _omnisharpClient.CompositeDisposable();
        }
    }, {
        key: "setup",
        value: function setup(statusBar) {
            this.statusBar = statusBar;
            if (this._active) {
                this._attach();
            }
        }
    }, {
        key: "attach",
        value: function attach() {
            if (this.statusBar) {
                this._attach();
            }
            this._active = true;
        }
    }, {
        key: "_attach",
        value: function _attach() {
            var _this = this;

            this.view = document.createElement("span");
            this.view.classList.add("inline-block");
            this.view.classList.add("framework-selector");
            this.view.style.display = "none";
            var tile = void 0;
            if (atom.config.get("grammar-selector.showOnRightSideOfStatusBar")) {
                tile = this.statusBar.addRightTile({
                    item: this.view,
                    priority: 9
                });
            } else {
                tile = this.statusBar.addLeftTile({
                    item: this.view,
                    priority: 11
                });
            }
            this._component = new _frameworkSelectorView.FrameworkSelectorComponent();
            this._component.alignLeft = !atom.config.get("grammar-selector.showOnRightSideOfStatusBar");
            this.view.appendChild(this._component);
            this.disposable.add(_omnisharpClient.Disposable.create(function () {
                tile.destroy();
                _this.view.remove();
            }));
            this.disposable.add(_omni.Omni.activeEditor.filter(function (z) {
                return !z;
            }).subscribe(function () {
                return _this.view.style.display = "none";
            }));
            this.disposable.add(_omni.Omni.activeProject.filter(function (z) {
                return z.frameworks.length === 1;
            }).subscribe(function () {
                return _this.view.style.display = "none";
            }));
            this.disposable.add(_omni.Omni.activeProject.subscribe(function (project) {
                _this.view.style.display = "";
                var frameworks = project.frameworks;
                var activeFramework = project.activeFramework;

                _this.project = project;
                _this._component.frameworks = frameworks;
                _this._component.activeFramework = activeFramework;
            }));
            this.disposable.add(_omni.Omni.activeFramework.subscribe(function (ctx) {
                _this.view.style.display = "";
                var project = ctx.project;
                var framework = ctx.framework;

                _this.project = project;
                _this._component.frameworks = project.frameworks;
                _this._component.activeFramework = framework;
            }));
        }
    }, {
        key: "dispose",
        value: function dispose() {
            this.disposable.dispose();
        }
    }, {
        key: "setActiveFramework",
        value: function setActiveFramework(framework) {
            if (this.project) {
                this.project.activeFramework = framework;
                this._component.activeFramework = framework;
            }
        }
    }]);

    return FrameworkSelector;
}();

var frameworkSelector = exports.frameworkSelector = new FrameworkSelector();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9hdG9tL2ZyYW1ld29yay1zZWxlY3Rvci5qcyIsImxpYi9hdG9tL2ZyYW1ld29yay1zZWxlY3Rvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7OztJQ0lBLGlCO0FBQUEsaUNBQUE7QUFBQTs7QUFJWSxhQUFBLE9BQUEsR0FBVSxLQUFWO0FBeUZELGFBQUEsUUFBQSxHQUFXLElBQVg7QUFDQSxhQUFBLEtBQUEsR0FBUSxvQkFBUjtBQUNBLGFBQUEsV0FBQSxHQUFjLDREQUFkO0FBQ1Y7Ozs7bUNBeEZrQjtBQUNYLGlCQUFLLFVBQUwsR0FBa0IsMENBQWxCO0FBQ0g7Ozs4QkFFWSxTLEVBQWM7QUFDdkIsaUJBQUssU0FBTCxHQUFpQixTQUFqQjtBQUVBLGdCQUFJLEtBQUssT0FBVCxFQUFrQjtBQUNkLHFCQUFLLE9BQUw7QUFDSDtBQUNKOzs7aUNBRVk7QUFDVCxnQkFBSSxLQUFLLFNBQVQsRUFBb0I7QUFBRSxxQkFBSyxPQUFMO0FBQWlCO0FBQ3ZDLGlCQUFLLE9BQUwsR0FBZSxJQUFmO0FBQ0g7OztrQ0FFYztBQUFBOztBQUNYLGlCQUFLLElBQUwsR0FBWSxTQUFTLGFBQVQsQ0FBdUIsTUFBdkIsQ0FBWjtBQUNBLGlCQUFLLElBQUwsQ0FBVSxTQUFWLENBQW9CLEdBQXBCLENBQXdCLGNBQXhCO0FBQ0EsaUJBQUssSUFBTCxDQUFVLFNBQVYsQ0FBb0IsR0FBcEIsQ0FBd0Isb0JBQXhCO0FBQ0EsaUJBQUssSUFBTCxDQUFVLEtBQVYsQ0FBZ0IsT0FBaEIsR0FBMEIsTUFBMUI7QUFFQSxnQkFBSSxhQUFKO0FBQ0EsZ0JBQUksS0FBSyxNQUFMLENBQVksR0FBWixDQUFnQiw2Q0FBaEIsQ0FBSixFQUFvRTtBQUNoRSx1QkFBTyxLQUFLLFNBQUwsQ0FBZSxZQUFmLENBQTRCO0FBQy9CLDBCQUFNLEtBQUssSUFEb0I7QUFFL0IsOEJBQVU7QUFGcUIsaUJBQTVCLENBQVA7QUFJSCxhQUxELE1BS087QUFDSCx1QkFBTyxLQUFLLFNBQUwsQ0FBZSxXQUFmLENBQTJCO0FBQzlCLDBCQUFNLEtBQUssSUFEbUI7QUFFOUIsOEJBQVU7QUFGb0IsaUJBQTNCLENBQVA7QUFJSDtBQUVELGlCQUFLLFVBQUwsR0FBa0IsdURBQWxCO0FBQ0EsaUJBQUssVUFBTCxDQUFnQixTQUFoQixHQUE0QixDQUFDLEtBQUssTUFBTCxDQUFZLEdBQVosQ0FBZ0IsNkNBQWhCLENBQTdCO0FBQ0EsaUJBQUssSUFBTCxDQUFVLFdBQVYsQ0FBc0IsS0FBSyxVQUEzQjtBQUVBLGlCQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsNEJBQVcsTUFBWCxDQUFrQixZQUFBO0FBQ2xDLHFCQUFLLE9BQUw7QUFDQSxzQkFBSyxJQUFMLENBQVUsTUFBVjtBQUNILGFBSG1CLENBQXBCO0FBS0EsaUJBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQixXQUFLLFlBQUwsQ0FDZixNQURlLENBQ1I7QUFBQSx1QkFBSyxDQUFDLENBQU47QUFBQSxhQURRLEVBRWYsU0FGZSxDQUVMO0FBQUEsdUJBQU0sTUFBSyxJQUFMLENBQVUsS0FBVixDQUFnQixPQUFoQixHQUEwQixNQUFoQztBQUFBLGFBRkssQ0FBcEI7QUFJQSxpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLFdBQUssYUFBTCxDQUNmLE1BRGUsQ0FDUjtBQUFBLHVCQUFLLEVBQUUsVUFBRixDQUFhLE1BQWIsS0FBd0IsQ0FBN0I7QUFBQSxhQURRLEVBRWYsU0FGZSxDQUVMO0FBQUEsdUJBQU0sTUFBSyxJQUFMLENBQVUsS0FBVixDQUFnQixPQUFoQixHQUEwQixNQUFoQztBQUFBLGFBRkssQ0FBcEI7QUFJQSxpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLFdBQUssYUFBTCxDQUNmLFNBRGUsQ0FDTCxtQkFBTztBQUNkLHNCQUFLLElBQUwsQ0FBVSxLQUFWLENBQWdCLE9BQWhCLEdBQTBCLEVBQTFCO0FBRGMsb0JBR1AsVUFITyxHQUd3QixPQUh4QixDQUdQLFVBSE87QUFBQSxvQkFHSyxlQUhMLEdBR3dCLE9BSHhCLENBR0ssZUFITDs7QUFJZCxzQkFBSyxPQUFMLEdBQWUsT0FBZjtBQUNBLHNCQUFLLFVBQUwsQ0FBZ0IsVUFBaEIsR0FBNkIsVUFBN0I7QUFDQSxzQkFBSyxVQUFMLENBQWdCLGVBQWhCLEdBQWtDLGVBQWxDO0FBQ0gsYUFSZSxDQUFwQjtBQVVBLGlCQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsV0FBSyxlQUFMLENBQ2YsU0FEZSxDQUNMLGVBQUc7QUFDVixzQkFBSyxJQUFMLENBQVUsS0FBVixDQUFnQixPQUFoQixHQUEwQixFQUExQjtBQURVLG9CQUdILE9BSEcsR0FHbUIsR0FIbkIsQ0FHSCxPQUhHO0FBQUEsb0JBR00sU0FITixHQUdtQixHQUhuQixDQUdNLFNBSE47O0FBSVYsc0JBQUssT0FBTCxHQUFlLE9BQWY7QUFDQSxzQkFBSyxVQUFMLENBQWdCLFVBQWhCLEdBQTZCLFFBQVEsVUFBckM7QUFDQSxzQkFBSyxVQUFMLENBQWdCLGVBQWhCLEdBQWtDLFNBQWxDO0FBQ0gsYUFSZSxDQUFwQjtBQVNIOzs7a0NBRWE7QUFDVixpQkFBSyxVQUFMLENBQWdCLE9BQWhCO0FBQ0g7OzsyQ0FFeUIsUyxFQUFpQztBQUN2RCxnQkFBSSxLQUFLLE9BQVQsRUFBa0I7QUFDZCxxQkFBSyxPQUFMLENBQWEsZUFBYixHQUErQixTQUEvQjtBQUNBLHFCQUFLLFVBQUwsQ0FBZ0IsZUFBaEIsR0FBa0MsU0FBbEM7QUFDSDtBQUNKOzs7Ozs7QUFPRSxJQUFNLGdEQUFvQixJQUFJLGlCQUFKLEVBQTFCIiwiZmlsZSI6ImxpYi9hdG9tL2ZyYW1ld29yay1zZWxlY3Rvci5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUsIERpc3Bvc2FibGUgfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xuaW1wb3J0IHsgT21uaSB9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xuaW1wb3J0IHsgRnJhbWV3b3JrU2VsZWN0b3JDb21wb25lbnQgfSBmcm9tIFwiLi4vdmlld3MvZnJhbWV3b3JrLXNlbGVjdG9yLXZpZXdcIjtcbmNsYXNzIEZyYW1ld29ya1NlbGVjdG9yIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5fYWN0aXZlID0gZmFsc2U7XG4gICAgICAgIHRoaXMucmVxdWlyZWQgPSB0cnVlO1xuICAgICAgICB0aGlzLnRpdGxlID0gXCJGcmFtZXdvcmsgU2VsZWN0b3JcIjtcbiAgICAgICAgdGhpcy5kZXNjcmlwdGlvbiA9IFwiTGV0cyB5b3Ugc2VsZWN0IHRoZSBmcmFtZXdvcmsgeW91XFxcInJlIGN1cnJlbnRseSB0YXJnZXRpbmcuXCI7XG4gICAgfVxuICAgIGFjdGl2YXRlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgIH1cbiAgICBzZXR1cChzdGF0dXNCYXIpIHtcbiAgICAgICAgdGhpcy5zdGF0dXNCYXIgPSBzdGF0dXNCYXI7XG4gICAgICAgIGlmICh0aGlzLl9hY3RpdmUpIHtcbiAgICAgICAgICAgIHRoaXMuX2F0dGFjaCgpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGF0dGFjaCgpIHtcbiAgICAgICAgaWYgKHRoaXMuc3RhdHVzQmFyKSB7XG4gICAgICAgICAgICB0aGlzLl9hdHRhY2goKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9hY3RpdmUgPSB0cnVlO1xuICAgIH1cbiAgICBfYXR0YWNoKCkge1xuICAgICAgICB0aGlzLnZpZXcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgdGhpcy52aWV3LmNsYXNzTGlzdC5hZGQoXCJpbmxpbmUtYmxvY2tcIik7XG4gICAgICAgIHRoaXMudmlldy5jbGFzc0xpc3QuYWRkKFwiZnJhbWV3b3JrLXNlbGVjdG9yXCIpO1xuICAgICAgICB0aGlzLnZpZXcuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICBsZXQgdGlsZTtcbiAgICAgICAgaWYgKGF0b20uY29uZmlnLmdldChcImdyYW1tYXItc2VsZWN0b3Iuc2hvd09uUmlnaHRTaWRlT2ZTdGF0dXNCYXJcIikpIHtcbiAgICAgICAgICAgIHRpbGUgPSB0aGlzLnN0YXR1c0Jhci5hZGRSaWdodFRpbGUoe1xuICAgICAgICAgICAgICAgIGl0ZW06IHRoaXMudmlldyxcbiAgICAgICAgICAgICAgICBwcmlvcml0eTogOVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aWxlID0gdGhpcy5zdGF0dXNCYXIuYWRkTGVmdFRpbGUoe1xuICAgICAgICAgICAgICAgIGl0ZW06IHRoaXMudmlldyxcbiAgICAgICAgICAgICAgICBwcmlvcml0eTogMTFcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2NvbXBvbmVudCA9IG5ldyBGcmFtZXdvcmtTZWxlY3RvckNvbXBvbmVudDtcbiAgICAgICAgdGhpcy5fY29tcG9uZW50LmFsaWduTGVmdCA9ICFhdG9tLmNvbmZpZy5nZXQoXCJncmFtbWFyLXNlbGVjdG9yLnNob3dPblJpZ2h0U2lkZU9mU3RhdHVzQmFyXCIpO1xuICAgICAgICB0aGlzLnZpZXcuYXBwZW5kQ2hpbGQodGhpcy5fY29tcG9uZW50KTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XG4gICAgICAgICAgICB0aWxlLmRlc3Ryb3koKTtcbiAgICAgICAgICAgIHRoaXMudmlldy5yZW1vdmUoKTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuYWN0aXZlRWRpdG9yXG4gICAgICAgICAgICAuZmlsdGVyKHogPT4gIXopXG4gICAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHRoaXMudmlldy5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCIpKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmFjdGl2ZVByb2plY3RcbiAgICAgICAgICAgIC5maWx0ZXIoeiA9PiB6LmZyYW1ld29ya3MubGVuZ3RoID09PSAxKVxuICAgICAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB0aGlzLnZpZXcuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiKSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5hY3RpdmVQcm9qZWN0XG4gICAgICAgICAgICAuc3Vic2NyaWJlKHByb2plY3QgPT4ge1xuICAgICAgICAgICAgdGhpcy52aWV3LnN0eWxlLmRpc3BsYXkgPSBcIlwiO1xuICAgICAgICAgICAgY29uc3QgeyBmcmFtZXdvcmtzLCBhY3RpdmVGcmFtZXdvcmsgfSA9IHByb2plY3Q7XG4gICAgICAgICAgICB0aGlzLnByb2plY3QgPSBwcm9qZWN0O1xuICAgICAgICAgICAgdGhpcy5fY29tcG9uZW50LmZyYW1ld29ya3MgPSBmcmFtZXdvcmtzO1xuICAgICAgICAgICAgdGhpcy5fY29tcG9uZW50LmFjdGl2ZUZyYW1ld29yayA9IGFjdGl2ZUZyYW1ld29yaztcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuYWN0aXZlRnJhbWV3b3JrXG4gICAgICAgICAgICAuc3Vic2NyaWJlKGN0eCA9PiB7XG4gICAgICAgICAgICB0aGlzLnZpZXcuc3R5bGUuZGlzcGxheSA9IFwiXCI7XG4gICAgICAgICAgICBjb25zdCB7IHByb2plY3QsIGZyYW1ld29yayB9ID0gY3R4O1xuICAgICAgICAgICAgdGhpcy5wcm9qZWN0ID0gcHJvamVjdDtcbiAgICAgICAgICAgIHRoaXMuX2NvbXBvbmVudC5mcmFtZXdvcmtzID0gcHJvamVjdC5mcmFtZXdvcmtzO1xuICAgICAgICAgICAgdGhpcy5fY29tcG9uZW50LmFjdGl2ZUZyYW1ld29yayA9IGZyYW1ld29yaztcbiAgICAgICAgfSkpO1xuICAgIH1cbiAgICBkaXNwb3NlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgIH1cbiAgICBzZXRBY3RpdmVGcmFtZXdvcmsoZnJhbWV3b3JrKSB7XG4gICAgICAgIGlmICh0aGlzLnByb2plY3QpIHtcbiAgICAgICAgICAgIHRoaXMucHJvamVjdC5hY3RpdmVGcmFtZXdvcmsgPSBmcmFtZXdvcms7XG4gICAgICAgICAgICB0aGlzLl9jb21wb25lbnQuYWN0aXZlRnJhbWV3b3JrID0gZnJhbWV3b3JrO1xuICAgICAgICB9XG4gICAgfVxufVxuZXhwb3J0IGNvbnN0IGZyYW1ld29ya1NlbGVjdG9yID0gbmV3IEZyYW1ld29ya1NlbGVjdG9yO1xuIiwiaW1wb3J0IHtNb2RlbHN9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XHJcbmltcG9ydCB7Q29tcG9zaXRlRGlzcG9zYWJsZSwgRGlzcG9zYWJsZX0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcclxuaW1wb3J0IHtQcm9qZWN0Vmlld01vZGVsfSBmcm9tIFwiLi4vc2VydmVyL3Byb2plY3Qtdmlldy1tb2RlbFwiO1xyXG5pbXBvcnQge09tbml9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xyXG5pbXBvcnQge0ZyYW1ld29ya1NlbGVjdG9yQ29tcG9uZW50fSBmcm9tIFwiLi4vdmlld3MvZnJhbWV3b3JrLXNlbGVjdG9yLXZpZXdcIjtcclxuXHJcbmNsYXNzIEZyYW1ld29ya1NlbGVjdG9yIGltcGxlbWVudHMgSUF0b21GZWF0dXJlIHtcclxuICAgIHByaXZhdGUgZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxuICAgIHByaXZhdGUgdmlldzogSFRNTFNwYW5FbGVtZW50O1xyXG4gICAgcHJpdmF0ZSBzdGF0dXNCYXI6IGFueTtcclxuICAgIHByaXZhdGUgX2FjdGl2ZSA9IGZhbHNlO1xyXG4gICAgcHVibGljIHByb2plY3Q6IFByb2plY3RWaWV3TW9kZWw8YW55PjtcclxuICAgIHByaXZhdGUgX2NvbXBvbmVudDogRnJhbWV3b3JrU2VsZWN0b3JDb21wb25lbnQ7XHJcblxyXG4gICAgcHVibGljIGFjdGl2YXRlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHNldHVwKHN0YXR1c0JhcjogYW55KSB7XHJcbiAgICAgICAgdGhpcy5zdGF0dXNCYXIgPSBzdGF0dXNCYXI7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9hY3RpdmUpIHtcclxuICAgICAgICAgICAgdGhpcy5fYXR0YWNoKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBhdHRhY2goKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuc3RhdHVzQmFyKSB7IHRoaXMuX2F0dGFjaCgpOyB9XHJcbiAgICAgICAgdGhpcy5fYWN0aXZlID0gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9hdHRhY2goKSB7XHJcbiAgICAgICAgdGhpcy52aWV3ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XHJcbiAgICAgICAgdGhpcy52aWV3LmNsYXNzTGlzdC5hZGQoXCJpbmxpbmUtYmxvY2tcIik7XHJcbiAgICAgICAgdGhpcy52aWV3LmNsYXNzTGlzdC5hZGQoXCJmcmFtZXdvcmstc2VsZWN0b3JcIik7XHJcbiAgICAgICAgdGhpcy52aWV3LnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcclxuXHJcbiAgICAgICAgbGV0IHRpbGU6IGFueTtcclxuICAgICAgICBpZiAoYXRvbS5jb25maWcuZ2V0KFwiZ3JhbW1hci1zZWxlY3Rvci5zaG93T25SaWdodFNpZGVPZlN0YXR1c0JhclwiKSkge1xyXG4gICAgICAgICAgICB0aWxlID0gdGhpcy5zdGF0dXNCYXIuYWRkUmlnaHRUaWxlKHtcclxuICAgICAgICAgICAgICAgIGl0ZW06IHRoaXMudmlldyxcclxuICAgICAgICAgICAgICAgIHByaW9yaXR5OiA5XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRpbGUgPSB0aGlzLnN0YXR1c0Jhci5hZGRMZWZ0VGlsZSh7XHJcbiAgICAgICAgICAgICAgICBpdGVtOiB0aGlzLnZpZXcsXHJcbiAgICAgICAgICAgICAgICBwcmlvcml0eTogMTFcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLl9jb21wb25lbnQgPSBuZXcgRnJhbWV3b3JrU2VsZWN0b3JDb21wb25lbnQ7XHJcbiAgICAgICAgdGhpcy5fY29tcG9uZW50LmFsaWduTGVmdCA9ICFhdG9tLmNvbmZpZy5nZXQoXCJncmFtbWFyLXNlbGVjdG9yLnNob3dPblJpZ2h0U2lkZU9mU3RhdHVzQmFyXCIpO1xyXG4gICAgICAgIHRoaXMudmlldy5hcHBlbmRDaGlsZCh0aGlzLl9jb21wb25lbnQpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcclxuICAgICAgICAgICAgdGlsZS5kZXN0cm95KCk7XHJcbiAgICAgICAgICAgIHRoaXMudmlldy5yZW1vdmUoKTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5hY3RpdmVFZGl0b3JcclxuICAgICAgICAgICAgLmZpbHRlcih6ID0+ICF6KVxyXG4gICAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHRoaXMudmlldy5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCIpKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmFjdGl2ZVByb2plY3RcclxuICAgICAgICAgICAgLmZpbHRlcih6ID0+IHouZnJhbWV3b3Jrcy5sZW5ndGggPT09IDEpXHJcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoKCkgPT4gdGhpcy52aWV3LnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIikpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuYWN0aXZlUHJvamVjdFxyXG4gICAgICAgICAgICAuc3Vic2NyaWJlKHByb2plY3QgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy52aWV3LnN0eWxlLmRpc3BsYXkgPSBcIlwiO1xyXG5cclxuICAgICAgICAgICAgICAgIGNvbnN0IHtmcmFtZXdvcmtzLCBhY3RpdmVGcmFtZXdvcmt9ID0gcHJvamVjdDtcclxuICAgICAgICAgICAgICAgIHRoaXMucHJvamVjdCA9IHByb2plY3Q7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9jb21wb25lbnQuZnJhbWV3b3JrcyA9IGZyYW1ld29ya3M7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9jb21wb25lbnQuYWN0aXZlRnJhbWV3b3JrID0gYWN0aXZlRnJhbWV3b3JrO1xyXG4gICAgICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5hY3RpdmVGcmFtZXdvcmtcclxuICAgICAgICAgICAgLnN1YnNjcmliZShjdHggPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy52aWV3LnN0eWxlLmRpc3BsYXkgPSBcIlwiO1xyXG5cclxuICAgICAgICAgICAgICAgIGNvbnN0IHtwcm9qZWN0LCBmcmFtZXdvcmt9ID0gY3R4O1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wcm9qZWN0ID0gcHJvamVjdDtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2NvbXBvbmVudC5mcmFtZXdvcmtzID0gcHJvamVjdC5mcmFtZXdvcmtzO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fY29tcG9uZW50LmFjdGl2ZUZyYW1ld29yayA9IGZyYW1ld29yaztcclxuICAgICAgICAgICAgfSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkaXNwb3NlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHNldEFjdGl2ZUZyYW1ld29yayhmcmFtZXdvcms6IE1vZGVscy5Eb3ROZXRGcmFtZXdvcmspIHtcclxuICAgICAgICBpZiAodGhpcy5wcm9qZWN0KSB7XHJcbiAgICAgICAgICAgIHRoaXMucHJvamVjdC5hY3RpdmVGcmFtZXdvcmsgPSBmcmFtZXdvcms7XHJcbiAgICAgICAgICAgIHRoaXMuX2NvbXBvbmVudC5hY3RpdmVGcmFtZXdvcmsgPSBmcmFtZXdvcms7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZXF1aXJlZCA9IHRydWU7XHJcbiAgICBwdWJsaWMgdGl0bGUgPSBcIkZyYW1ld29yayBTZWxlY3RvclwiO1xyXG4gICAgcHVibGljIGRlc2NyaXB0aW9uID0gXCJMZXRzIHlvdSBzZWxlY3QgdGhlIGZyYW1ld29yayB5b3VcXFwicmUgY3VycmVudGx5IHRhcmdldGluZy5cIjtcclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IGZyYW1ld29ya1NlbGVjdG9yID0gbmV3IEZyYW1ld29ya1NlbGVjdG9yO1xyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
