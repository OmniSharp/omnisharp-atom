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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9hdG9tL2ZyYW1ld29yay1zZWxlY3Rvci5qcyIsImxpYi9hdG9tL2ZyYW1ld29yay1zZWxlY3Rvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7OztJQ0lBO0FBQUEsaUNBQUE7OztBQUlZLGFBQUEsT0FBQSxHQUFVLEtBQVYsQ0FKWjtBQTZGVyxhQUFBLFFBQUEsR0FBVyxJQUFYLENBN0ZYO0FBOEZXLGFBQUEsS0FBQSxHQUFRLG9CQUFSLENBOUZYO0FBK0ZXLGFBQUEsV0FBQSxHQUFjLDREQUFkLENBL0ZYO0tBQUE7Ozs7bUNBUW1CO0FBQ1gsaUJBQUssVUFBTCxHQUFrQiwwQ0FBbEIsQ0FEVzs7Ozs4QkFJRixXQUFjO0FBQ3ZCLGlCQUFLLFNBQUwsR0FBaUIsU0FBakIsQ0FEdUI7QUFHdkIsZ0JBQUksS0FBSyxPQUFMLEVBQWM7QUFDZCxxQkFBSyxPQUFMLEdBRGM7YUFBbEI7Ozs7aUNBS1M7QUFDVCxnQkFBSSxLQUFLLFNBQUwsRUFBZ0I7QUFBRSxxQkFBSyxPQUFMLEdBQUY7YUFBcEI7QUFDQSxpQkFBSyxPQUFMLEdBQWUsSUFBZixDQUZTOzs7O2tDQUtFOzs7QUFDWCxpQkFBSyxJQUFMLEdBQVksU0FBUyxhQUFULENBQXVCLE1BQXZCLENBQVosQ0FEVztBQUVYLGlCQUFLLElBQUwsQ0FBVSxTQUFWLENBQW9CLEdBQXBCLENBQXdCLGNBQXhCLEVBRlc7QUFHWCxpQkFBSyxJQUFMLENBQVUsU0FBVixDQUFvQixHQUFwQixDQUF3QixvQkFBeEIsRUFIVztBQUlYLGlCQUFLLElBQUwsQ0FBVSxLQUFWLENBQWdCLE9BQWhCLEdBQTBCLE1BQTFCLENBSlc7QUFNWCxnQkFBSSxhQUFKLENBTlc7QUFPWCxnQkFBSSxLQUFLLE1BQUwsQ0FBWSxHQUFaLENBQWdCLDZDQUFoQixDQUFKLEVBQW9FO0FBQ2hFLHVCQUFPLEtBQUssU0FBTCxDQUFlLFlBQWYsQ0FBNEI7QUFDL0IsMEJBQU0sS0FBSyxJQUFMO0FBQ04sOEJBQVUsQ0FBVjtpQkFGRyxDQUFQLENBRGdFO2FBQXBFLE1BS087QUFDSCx1QkFBTyxLQUFLLFNBQUwsQ0FBZSxXQUFmLENBQTJCO0FBQzlCLDBCQUFNLEtBQUssSUFBTDtBQUNOLDhCQUFVLEVBQVY7aUJBRkcsQ0FBUCxDQURHO2FBTFA7QUFZQSxpQkFBSyxVQUFMLEdBQWtCLHVEQUFsQixDQW5CVztBQW9CWCxpQkFBSyxVQUFMLENBQWdCLFNBQWhCLEdBQTRCLENBQUMsS0FBSyxNQUFMLENBQVksR0FBWixDQUFnQiw2Q0FBaEIsQ0FBRCxDQXBCakI7QUFxQlgsaUJBQUssSUFBTCxDQUFVLFdBQVYsQ0FBc0IsS0FBSyxVQUFMLENBQXRCLENBckJXO0FBdUJYLGlCQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsNEJBQVcsTUFBWCxDQUFrQixZQUFBO0FBQ2xDLHFCQUFLLE9BQUwsR0FEa0M7QUFFbEMsc0JBQUssSUFBTCxDQUFVLE1BQVYsR0FGa0M7YUFBQSxDQUF0QyxFQXZCVztBQTRCWCxpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLFdBQUssWUFBTCxDQUNmLE1BRGUsQ0FDUjt1QkFBSyxDQUFDLENBQUQ7YUFBTCxDQURRLENBRWYsU0FGZSxDQUVMO3VCQUFNLE1BQUssSUFBTCxDQUFVLEtBQVYsQ0FBZ0IsT0FBaEIsR0FBMEIsTUFBMUI7YUFBTixDQUZmLEVBNUJXO0FBZ0NYLGlCQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsV0FBSyxhQUFMLENBQ2YsTUFEZSxDQUNSO3VCQUFLLEVBQUUsVUFBRixDQUFhLE1BQWIsS0FBd0IsQ0FBeEI7YUFBTCxDQURRLENBRWYsU0FGZSxDQUVMO3VCQUFNLE1BQUssSUFBTCxDQUFVLEtBQVYsQ0FBZ0IsT0FBaEIsR0FBMEIsTUFBMUI7YUFBTixDQUZmLEVBaENXO0FBb0NYLGlCQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsV0FBSyxhQUFMLENBQ2YsU0FEZSxDQUNMLG1CQUFPO0FBQ2Qsc0JBQUssSUFBTCxDQUFVLEtBQVYsQ0FBZ0IsT0FBaEIsR0FBMEIsRUFBMUIsQ0FEYztvQkFHUCxhQUErQixRQUEvQixXQUhPO29CQUdLLGtCQUFtQixRQUFuQixnQkFITDs7QUFJZCxzQkFBSyxPQUFMLEdBQWUsT0FBZixDQUpjO0FBS2Qsc0JBQUssVUFBTCxDQUFnQixVQUFoQixHQUE2QixVQUE3QixDQUxjO0FBTWQsc0JBQUssVUFBTCxDQUFnQixlQUFoQixHQUFrQyxlQUFsQyxDQU5jO2FBQVAsQ0FEZixFQXBDVztBQThDWCxpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLFdBQUssZUFBTCxDQUNmLFNBRGUsQ0FDTCxlQUFHO0FBQ1Ysc0JBQUssSUFBTCxDQUFVLEtBQVYsQ0FBZ0IsT0FBaEIsR0FBMEIsRUFBMUIsQ0FEVTtvQkFHSCxVQUFzQixJQUF0QixRQUhHO29CQUdNLFlBQWEsSUFBYixVQUhOOztBQUlWLHNCQUFLLE9BQUwsR0FBZSxPQUFmLENBSlU7QUFLVixzQkFBSyxVQUFMLENBQWdCLFVBQWhCLEdBQTZCLFFBQVEsVUFBUixDQUxuQjtBQU1WLHNCQUFLLFVBQUwsQ0FBZ0IsZUFBaEIsR0FBa0MsU0FBbEMsQ0FOVTthQUFILENBRGYsRUE5Q1c7Ozs7a0NBeUREO0FBQ1YsaUJBQUssVUFBTCxDQUFnQixPQUFoQixHQURVOzs7OzJDQUlZLFdBQWlDO0FBQ3ZELGdCQUFJLEtBQUssT0FBTCxFQUFjO0FBQ2QscUJBQUssT0FBTCxDQUFhLGVBQWIsR0FBK0IsU0FBL0IsQ0FEYztBQUVkLHFCQUFLLFVBQUwsQ0FBZ0IsZUFBaEIsR0FBa0MsU0FBbEMsQ0FGYzthQUFsQjs7Ozs7OztBQVdELElBQU0sZ0RBQW9CLElBQUksaUJBQUosRUFBcEIiLCJmaWxlIjoibGliL2F0b20vZnJhbWV3b3JrLXNlbGVjdG9yLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSwgRGlzcG9zYWJsZSB9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XG5pbXBvcnQgeyBPbW5pIH0gZnJvbSBcIi4uL3NlcnZlci9vbW5pXCI7XG5pbXBvcnQgeyBGcmFtZXdvcmtTZWxlY3RvckNvbXBvbmVudCB9IGZyb20gXCIuLi92aWV3cy9mcmFtZXdvcmstc2VsZWN0b3Itdmlld1wiO1xuY2xhc3MgRnJhbWV3b3JrU2VsZWN0b3Ige1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLl9hY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5yZXF1aXJlZCA9IHRydWU7XG4gICAgICAgIHRoaXMudGl0bGUgPSBcIkZyYW1ld29yayBTZWxlY3RvclwiO1xuICAgICAgICB0aGlzLmRlc2NyaXB0aW9uID0gXCJMZXRzIHlvdSBzZWxlY3QgdGhlIGZyYW1ld29yayB5b3VcXFwicmUgY3VycmVudGx5IHRhcmdldGluZy5cIjtcbiAgICB9XG4gICAgYWN0aXZhdGUoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgfVxuICAgIHNldHVwKHN0YXR1c0Jhcikge1xuICAgICAgICB0aGlzLnN0YXR1c0JhciA9IHN0YXR1c0JhcjtcbiAgICAgICAgaWYgKHRoaXMuX2FjdGl2ZSkge1xuICAgICAgICAgICAgdGhpcy5fYXR0YWNoKCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgYXR0YWNoKCkge1xuICAgICAgICBpZiAodGhpcy5zdGF0dXNCYXIpIHtcbiAgICAgICAgICAgIHRoaXMuX2F0dGFjaCgpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2FjdGl2ZSA9IHRydWU7XG4gICAgfVxuICAgIF9hdHRhY2goKSB7XG4gICAgICAgIHRoaXMudmlldyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICB0aGlzLnZpZXcuY2xhc3NMaXN0LmFkZChcImlubGluZS1ibG9ja1wiKTtcbiAgICAgICAgdGhpcy52aWV3LmNsYXNzTGlzdC5hZGQoXCJmcmFtZXdvcmstc2VsZWN0b3JcIik7XG4gICAgICAgIHRoaXMudmlldy5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgIGxldCB0aWxlO1xuICAgICAgICBpZiAoYXRvbS5jb25maWcuZ2V0KFwiZ3JhbW1hci1zZWxlY3Rvci5zaG93T25SaWdodFNpZGVPZlN0YXR1c0JhclwiKSkge1xuICAgICAgICAgICAgdGlsZSA9IHRoaXMuc3RhdHVzQmFyLmFkZFJpZ2h0VGlsZSh7XG4gICAgICAgICAgICAgICAgaXRlbTogdGhpcy52aWV3LFxuICAgICAgICAgICAgICAgIHByaW9yaXR5OiA5XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRpbGUgPSB0aGlzLnN0YXR1c0Jhci5hZGRMZWZ0VGlsZSh7XG4gICAgICAgICAgICAgICAgaXRlbTogdGhpcy52aWV3LFxuICAgICAgICAgICAgICAgIHByaW9yaXR5OiAxMVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fY29tcG9uZW50ID0gbmV3IEZyYW1ld29ya1NlbGVjdG9yQ29tcG9uZW50O1xuICAgICAgICB0aGlzLl9jb21wb25lbnQuYWxpZ25MZWZ0ID0gIWF0b20uY29uZmlnLmdldChcImdyYW1tYXItc2VsZWN0b3Iuc2hvd09uUmlnaHRTaWRlT2ZTdGF0dXNCYXJcIik7XG4gICAgICAgIHRoaXMudmlldy5hcHBlbmRDaGlsZCh0aGlzLl9jb21wb25lbnQpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcbiAgICAgICAgICAgIHRpbGUuZGVzdHJveSgpO1xuICAgICAgICAgICAgdGhpcy52aWV3LnJlbW92ZSgpO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5hY3RpdmVFZGl0b3JcbiAgICAgICAgICAgIC5maWx0ZXIoeiA9PiAheilcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoKCkgPT4gdGhpcy52aWV3LnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIikpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuYWN0aXZlUHJvamVjdFxuICAgICAgICAgICAgLmZpbHRlcih6ID0+IHouZnJhbWV3b3Jrcy5sZW5ndGggPT09IDEpXG4gICAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHRoaXMudmlldy5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCIpKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmFjdGl2ZVByb2plY3RcbiAgICAgICAgICAgIC5zdWJzY3JpYmUocHJvamVjdCA9PiB7XG4gICAgICAgICAgICB0aGlzLnZpZXcuc3R5bGUuZGlzcGxheSA9IFwiXCI7XG4gICAgICAgICAgICBjb25zdCB7IGZyYW1ld29ya3MsIGFjdGl2ZUZyYW1ld29yayB9ID0gcHJvamVjdDtcbiAgICAgICAgICAgIHRoaXMucHJvamVjdCA9IHByb2plY3Q7XG4gICAgICAgICAgICB0aGlzLl9jb21wb25lbnQuZnJhbWV3b3JrcyA9IGZyYW1ld29ya3M7XG4gICAgICAgICAgICB0aGlzLl9jb21wb25lbnQuYWN0aXZlRnJhbWV3b3JrID0gYWN0aXZlRnJhbWV3b3JrO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5hY3RpdmVGcmFtZXdvcmtcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoY3R4ID0+IHtcbiAgICAgICAgICAgIHRoaXMudmlldy5zdHlsZS5kaXNwbGF5ID0gXCJcIjtcbiAgICAgICAgICAgIGNvbnN0IHsgcHJvamVjdCwgZnJhbWV3b3JrIH0gPSBjdHg7XG4gICAgICAgICAgICB0aGlzLnByb2plY3QgPSBwcm9qZWN0O1xuICAgICAgICAgICAgdGhpcy5fY29tcG9uZW50LmZyYW1ld29ya3MgPSBwcm9qZWN0LmZyYW1ld29ya3M7XG4gICAgICAgICAgICB0aGlzLl9jb21wb25lbnQuYWN0aXZlRnJhbWV3b3JrID0gZnJhbWV3b3JrO1xuICAgICAgICB9KSk7XG4gICAgfVxuICAgIGRpc3Bvc2UoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfVxuICAgIHNldEFjdGl2ZUZyYW1ld29yayhmcmFtZXdvcmspIHtcbiAgICAgICAgaWYgKHRoaXMucHJvamVjdCkge1xuICAgICAgICAgICAgdGhpcy5wcm9qZWN0LmFjdGl2ZUZyYW1ld29yayA9IGZyYW1ld29yaztcbiAgICAgICAgICAgIHRoaXMuX2NvbXBvbmVudC5hY3RpdmVGcmFtZXdvcmsgPSBmcmFtZXdvcms7XG4gICAgICAgIH1cbiAgICB9XG59XG5leHBvcnQgY29uc3QgZnJhbWV3b3JrU2VsZWN0b3IgPSBuZXcgRnJhbWV3b3JrU2VsZWN0b3I7XG4iLCJpbXBvcnQge01vZGVsc30gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcclxuaW1wb3J0IHtDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xyXG5pbXBvcnQge1Byb2plY3RWaWV3TW9kZWx9IGZyb20gXCIuLi9zZXJ2ZXIvcHJvamVjdC12aWV3LW1vZGVsXCI7XHJcbmltcG9ydCB7T21uaX0gZnJvbSBcIi4uL3NlcnZlci9vbW5pXCI7XHJcbmltcG9ydCB7RnJhbWV3b3JrU2VsZWN0b3JDb21wb25lbnR9IGZyb20gXCIuLi92aWV3cy9mcmFtZXdvcmstc2VsZWN0b3Itdmlld1wiO1xyXG5cclxuY2xhc3MgRnJhbWV3b3JrU2VsZWN0b3IgaW1wbGVtZW50cyBJQXRvbUZlYXR1cmUge1xyXG4gICAgcHJpdmF0ZSBkaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xyXG4gICAgcHJpdmF0ZSB2aWV3OiBIVE1MU3BhbkVsZW1lbnQ7XHJcbiAgICBwcml2YXRlIHN0YXR1c0JhcjogYW55O1xyXG4gICAgcHJpdmF0ZSBfYWN0aXZlID0gZmFsc2U7XHJcbiAgICBwdWJsaWMgcHJvamVjdDogUHJvamVjdFZpZXdNb2RlbDxhbnk+O1xyXG4gICAgcHJpdmF0ZSBfY29tcG9uZW50OiBGcmFtZXdvcmtTZWxlY3RvckNvbXBvbmVudDtcclxuXHJcbiAgICBwdWJsaWMgYWN0aXZhdGUoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2V0dXAoc3RhdHVzQmFyOiBhbnkpIHtcclxuICAgICAgICB0aGlzLnN0YXR1c0JhciA9IHN0YXR1c0JhcjtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX2FjdGl2ZSkge1xyXG4gICAgICAgICAgICB0aGlzLl9hdHRhY2goKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGF0dGFjaCgpIHtcclxuICAgICAgICBpZiAodGhpcy5zdGF0dXNCYXIpIHsgdGhpcy5fYXR0YWNoKCk7IH1cclxuICAgICAgICB0aGlzLl9hY3RpdmUgPSB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX2F0dGFjaCgpIHtcclxuICAgICAgICB0aGlzLnZpZXcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcclxuICAgICAgICB0aGlzLnZpZXcuY2xhc3NMaXN0LmFkZChcImlubGluZS1ibG9ja1wiKTtcclxuICAgICAgICB0aGlzLnZpZXcuY2xhc3NMaXN0LmFkZChcImZyYW1ld29yay1zZWxlY3RvclwiKTtcclxuICAgICAgICB0aGlzLnZpZXcuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xyXG5cclxuICAgICAgICBsZXQgdGlsZTogYW55O1xyXG4gICAgICAgIGlmIChhdG9tLmNvbmZpZy5nZXQoXCJncmFtbWFyLXNlbGVjdG9yLnNob3dPblJpZ2h0U2lkZU9mU3RhdHVzQmFyXCIpKSB7XHJcbiAgICAgICAgICAgIHRpbGUgPSB0aGlzLnN0YXR1c0Jhci5hZGRSaWdodFRpbGUoe1xyXG4gICAgICAgICAgICAgICAgaXRlbTogdGhpcy52aWV3LFxyXG4gICAgICAgICAgICAgICAgcHJpb3JpdHk6IDlcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGlsZSA9IHRoaXMuc3RhdHVzQmFyLmFkZExlZnRUaWxlKHtcclxuICAgICAgICAgICAgICAgIGl0ZW06IHRoaXMudmlldyxcclxuICAgICAgICAgICAgICAgIHByaW9yaXR5OiAxMVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuX2NvbXBvbmVudCA9IG5ldyBGcmFtZXdvcmtTZWxlY3RvckNvbXBvbmVudDtcclxuICAgICAgICB0aGlzLl9jb21wb25lbnQuYWxpZ25MZWZ0ID0gIWF0b20uY29uZmlnLmdldChcImdyYW1tYXItc2VsZWN0b3Iuc2hvd09uUmlnaHRTaWRlT2ZTdGF0dXNCYXJcIik7XHJcbiAgICAgICAgdGhpcy52aWV3LmFwcGVuZENoaWxkKHRoaXMuX2NvbXBvbmVudCk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xyXG4gICAgICAgICAgICB0aWxlLmRlc3Ryb3koKTtcclxuICAgICAgICAgICAgdGhpcy52aWV3LnJlbW92ZSgpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmFjdGl2ZUVkaXRvclxyXG4gICAgICAgICAgICAuZmlsdGVyKHogPT4gIXopXHJcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoKCkgPT4gdGhpcy52aWV3LnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIikpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuYWN0aXZlUHJvamVjdFxyXG4gICAgICAgICAgICAuZmlsdGVyKHogPT4gei5mcmFtZXdvcmtzLmxlbmd0aCA9PT0gMSlcclxuICAgICAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB0aGlzLnZpZXcuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiKSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5hY3RpdmVQcm9qZWN0XHJcbiAgICAgICAgICAgIC5zdWJzY3JpYmUocHJvamVjdCA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnZpZXcuc3R5bGUuZGlzcGxheSA9IFwiXCI7XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc3Qge2ZyYW1ld29ya3MsIGFjdGl2ZUZyYW1ld29ya30gPSBwcm9qZWN0O1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wcm9qZWN0ID0gcHJvamVjdDtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2NvbXBvbmVudC5mcmFtZXdvcmtzID0gZnJhbWV3b3JrcztcclxuICAgICAgICAgICAgICAgIHRoaXMuX2NvbXBvbmVudC5hY3RpdmVGcmFtZXdvcmsgPSBhY3RpdmVGcmFtZXdvcms7XHJcbiAgICAgICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmFjdGl2ZUZyYW1ld29ya1xyXG4gICAgICAgICAgICAuc3Vic2NyaWJlKGN0eCA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnZpZXcuc3R5bGUuZGlzcGxheSA9IFwiXCI7XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc3Qge3Byb2plY3QsIGZyYW1ld29ya30gPSBjdHg7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnByb2plY3QgPSBwcm9qZWN0O1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fY29tcG9uZW50LmZyYW1ld29ya3MgPSBwcm9qZWN0LmZyYW1ld29ya3M7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9jb21wb25lbnQuYWN0aXZlRnJhbWV3b3JrID0gZnJhbWV3b3JrO1xyXG4gICAgICAgICAgICB9KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2V0QWN0aXZlRnJhbWV3b3JrKGZyYW1ld29yazogTW9kZWxzLkRvdE5ldEZyYW1ld29yaykge1xyXG4gICAgICAgIGlmICh0aGlzLnByb2plY3QpIHtcclxuICAgICAgICAgICAgdGhpcy5wcm9qZWN0LmFjdGl2ZUZyYW1ld29yayA9IGZyYW1ld29yaztcclxuICAgICAgICAgICAgdGhpcy5fY29tcG9uZW50LmFjdGl2ZUZyYW1ld29yayA9IGZyYW1ld29yaztcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlcXVpcmVkID0gdHJ1ZTtcclxuICAgIHB1YmxpYyB0aXRsZSA9IFwiRnJhbWV3b3JrIFNlbGVjdG9yXCI7XHJcbiAgICBwdWJsaWMgZGVzY3JpcHRpb24gPSBcIkxldHMgeW91IHNlbGVjdCB0aGUgZnJhbWV3b3JrIHlvdVxcXCJyZSBjdXJyZW50bHkgdGFyZ2V0aW5nLlwiO1xyXG59XHJcblxyXG5leHBvcnQgY29uc3QgZnJhbWV3b3JrU2VsZWN0b3IgPSBuZXcgRnJhbWV3b3JrU2VsZWN0b3I7XHJcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
