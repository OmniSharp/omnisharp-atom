"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.frameworkSelector = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _tsDisposables = require("ts-disposables");

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
            this.disposable = new _tsDisposables.CompositeDisposable();
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
            this.disposable.add(_tsDisposables.Disposable.create(function () {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9hdG9tL2ZyYW1ld29yay1zZWxlY3Rvci5qcyIsImxpYi9hdG9tL2ZyYW1ld29yay1zZWxlY3Rvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7OztJQ0lBO0FBQUEsaUNBQUE7OztBQUlZLGFBQUEsT0FBQSxHQUFVLEtBQVYsQ0FKWjtBQTZGVyxhQUFBLFFBQUEsR0FBVyxJQUFYLENBN0ZYO0FBOEZXLGFBQUEsS0FBQSxHQUFRLG9CQUFSLENBOUZYO0FBK0ZXLGFBQUEsV0FBQSxHQUFjLDREQUFkLENBL0ZYO0tBQUE7Ozs7bUNBUW1CO0FBQ1gsaUJBQUssVUFBTCxHQUFrQix3Q0FBbEIsQ0FEVzs7Ozs4QkFJRixXQUFjO0FBQ3ZCLGlCQUFLLFNBQUwsR0FBaUIsU0FBakIsQ0FEdUI7QUFHdkIsZ0JBQUksS0FBSyxPQUFMLEVBQWM7QUFDZCxxQkFBSyxPQUFMLEdBRGM7YUFBbEI7Ozs7aUNBS1M7QUFDVCxnQkFBSSxLQUFLLFNBQUwsRUFBZ0I7QUFBRSxxQkFBSyxPQUFMLEdBQUY7YUFBcEI7QUFDQSxpQkFBSyxPQUFMLEdBQWUsSUFBZixDQUZTOzs7O2tDQUtFOzs7QUFDWCxpQkFBSyxJQUFMLEdBQVksU0FBUyxhQUFULENBQXVCLE1BQXZCLENBQVosQ0FEVztBQUVYLGlCQUFLLElBQUwsQ0FBVSxTQUFWLENBQW9CLEdBQXBCLENBQXdCLGNBQXhCLEVBRlc7QUFHWCxpQkFBSyxJQUFMLENBQVUsU0FBVixDQUFvQixHQUFwQixDQUF3QixvQkFBeEIsRUFIVztBQUlYLGlCQUFLLElBQUwsQ0FBVSxLQUFWLENBQWdCLE9BQWhCLEdBQTBCLE1BQTFCLENBSlc7QUFNWCxnQkFBSSxhQUFKLENBTlc7QUFPWCxnQkFBSSxLQUFLLE1BQUwsQ0FBWSxHQUFaLENBQWdCLDZDQUFoQixDQUFKLEVBQW9FO0FBQ2hFLHVCQUFPLEtBQUssU0FBTCxDQUFlLFlBQWYsQ0FBNEI7QUFDL0IsMEJBQU0sS0FBSyxJQUFMO0FBQ04sOEJBQVUsQ0FBVjtpQkFGRyxDQUFQLENBRGdFO2FBQXBFLE1BS087QUFDSCx1QkFBTyxLQUFLLFNBQUwsQ0FBZSxXQUFmLENBQTJCO0FBQzlCLDBCQUFNLEtBQUssSUFBTDtBQUNOLDhCQUFVLEVBQVY7aUJBRkcsQ0FBUCxDQURHO2FBTFA7QUFZQSxpQkFBSyxVQUFMLEdBQWtCLHVEQUFsQixDQW5CVztBQW9CWCxpQkFBSyxVQUFMLENBQWdCLFNBQWhCLEdBQTRCLENBQUMsS0FBSyxNQUFMLENBQVksR0FBWixDQUFnQiw2Q0FBaEIsQ0FBRCxDQXBCakI7QUFxQlgsaUJBQUssSUFBTCxDQUFVLFdBQVYsQ0FBc0IsS0FBSyxVQUFMLENBQXRCLENBckJXO0FBdUJYLGlCQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsMEJBQVcsTUFBWCxDQUFrQixZQUFBO0FBQ2xDLHFCQUFLLE9BQUwsR0FEa0M7QUFFbEMsc0JBQUssSUFBTCxDQUFVLE1BQVYsR0FGa0M7YUFBQSxDQUF0QyxFQXZCVztBQTRCWCxpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLFdBQUssWUFBTCxDQUNmLE1BRGUsQ0FDUjt1QkFBSyxDQUFDLENBQUQ7YUFBTCxDQURRLENBRWYsU0FGZSxDQUVMO3VCQUFNLE1BQUssSUFBTCxDQUFVLEtBQVYsQ0FBZ0IsT0FBaEIsR0FBMEIsTUFBMUI7YUFBTixDQUZmLEVBNUJXO0FBZ0NYLGlCQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsV0FBSyxhQUFMLENBQ2YsTUFEZSxDQUNSO3VCQUFLLEVBQUUsVUFBRixDQUFhLE1BQWIsS0FBd0IsQ0FBeEI7YUFBTCxDQURRLENBRWYsU0FGZSxDQUVMO3VCQUFNLE1BQUssSUFBTCxDQUFVLEtBQVYsQ0FBZ0IsT0FBaEIsR0FBMEIsTUFBMUI7YUFBTixDQUZmLEVBaENXO0FBb0NYLGlCQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsV0FBSyxhQUFMLENBQ2YsU0FEZSxDQUNMLG1CQUFPO0FBQ2Qsc0JBQUssSUFBTCxDQUFVLEtBQVYsQ0FBZ0IsT0FBaEIsR0FBMEIsRUFBMUIsQ0FEYztvQkFHUCxhQUErQixRQUEvQixXQUhPO29CQUdLLGtCQUFtQixRQUFuQixnQkFITDs7QUFJZCxzQkFBSyxPQUFMLEdBQWUsT0FBZixDQUpjO0FBS2Qsc0JBQUssVUFBTCxDQUFnQixVQUFoQixHQUE2QixVQUE3QixDQUxjO0FBTWQsc0JBQUssVUFBTCxDQUFnQixlQUFoQixHQUFrQyxlQUFsQyxDQU5jO2FBQVAsQ0FEZixFQXBDVztBQThDWCxpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLFdBQUssZUFBTCxDQUNmLFNBRGUsQ0FDTCxlQUFHO0FBQ1Ysc0JBQUssSUFBTCxDQUFVLEtBQVYsQ0FBZ0IsT0FBaEIsR0FBMEIsRUFBMUIsQ0FEVTtvQkFHSCxVQUFzQixJQUF0QixRQUhHO29CQUdNLFlBQWEsSUFBYixVQUhOOztBQUlWLHNCQUFLLE9BQUwsR0FBZSxPQUFmLENBSlU7QUFLVixzQkFBSyxVQUFMLENBQWdCLFVBQWhCLEdBQTZCLFFBQVEsVUFBUixDQUxuQjtBQU1WLHNCQUFLLFVBQUwsQ0FBZ0IsZUFBaEIsR0FBa0MsU0FBbEMsQ0FOVTthQUFILENBRGYsRUE5Q1c7Ozs7a0NBeUREO0FBQ1YsaUJBQUssVUFBTCxDQUFnQixPQUFoQixHQURVOzs7OzJDQUlZLFdBQWlDO0FBQ3ZELGdCQUFJLEtBQUssT0FBTCxFQUFjO0FBQ2QscUJBQUssT0FBTCxDQUFhLGVBQWIsR0FBK0IsU0FBL0IsQ0FEYztBQUVkLHFCQUFLLFVBQUwsQ0FBZ0IsZUFBaEIsR0FBa0MsU0FBbEMsQ0FGYzthQUFsQjs7Ozs7OztBQVdELElBQU0sZ0RBQW9CLElBQUksaUJBQUosRUFBcEIiLCJmaWxlIjoibGliL2F0b20vZnJhbWV3b3JrLXNlbGVjdG9yLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSwgRGlzcG9zYWJsZSB9IGZyb20gXCJ0cy1kaXNwb3NhYmxlc1wiO1xuaW1wb3J0IHsgT21uaSB9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xuaW1wb3J0IHsgRnJhbWV3b3JrU2VsZWN0b3JDb21wb25lbnQgfSBmcm9tIFwiLi4vdmlld3MvZnJhbWV3b3JrLXNlbGVjdG9yLXZpZXdcIjtcbmNsYXNzIEZyYW1ld29ya1NlbGVjdG9yIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5fYWN0aXZlID0gZmFsc2U7XG4gICAgICAgIHRoaXMucmVxdWlyZWQgPSB0cnVlO1xuICAgICAgICB0aGlzLnRpdGxlID0gXCJGcmFtZXdvcmsgU2VsZWN0b3JcIjtcbiAgICAgICAgdGhpcy5kZXNjcmlwdGlvbiA9IFwiTGV0cyB5b3Ugc2VsZWN0IHRoZSBmcmFtZXdvcmsgeW91XFxcInJlIGN1cnJlbnRseSB0YXJnZXRpbmcuXCI7XG4gICAgfVxuICAgIGFjdGl2YXRlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgIH1cbiAgICBzZXR1cChzdGF0dXNCYXIpIHtcbiAgICAgICAgdGhpcy5zdGF0dXNCYXIgPSBzdGF0dXNCYXI7XG4gICAgICAgIGlmICh0aGlzLl9hY3RpdmUpIHtcbiAgICAgICAgICAgIHRoaXMuX2F0dGFjaCgpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGF0dGFjaCgpIHtcbiAgICAgICAgaWYgKHRoaXMuc3RhdHVzQmFyKSB7XG4gICAgICAgICAgICB0aGlzLl9hdHRhY2goKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9hY3RpdmUgPSB0cnVlO1xuICAgIH1cbiAgICBfYXR0YWNoKCkge1xuICAgICAgICB0aGlzLnZpZXcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgdGhpcy52aWV3LmNsYXNzTGlzdC5hZGQoXCJpbmxpbmUtYmxvY2tcIik7XG4gICAgICAgIHRoaXMudmlldy5jbGFzc0xpc3QuYWRkKFwiZnJhbWV3b3JrLXNlbGVjdG9yXCIpO1xuICAgICAgICB0aGlzLnZpZXcuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICBsZXQgdGlsZTtcbiAgICAgICAgaWYgKGF0b20uY29uZmlnLmdldChcImdyYW1tYXItc2VsZWN0b3Iuc2hvd09uUmlnaHRTaWRlT2ZTdGF0dXNCYXJcIikpIHtcbiAgICAgICAgICAgIHRpbGUgPSB0aGlzLnN0YXR1c0Jhci5hZGRSaWdodFRpbGUoe1xuICAgICAgICAgICAgICAgIGl0ZW06IHRoaXMudmlldyxcbiAgICAgICAgICAgICAgICBwcmlvcml0eTogOVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aWxlID0gdGhpcy5zdGF0dXNCYXIuYWRkTGVmdFRpbGUoe1xuICAgICAgICAgICAgICAgIGl0ZW06IHRoaXMudmlldyxcbiAgICAgICAgICAgICAgICBwcmlvcml0eTogMTFcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2NvbXBvbmVudCA9IG5ldyBGcmFtZXdvcmtTZWxlY3RvckNvbXBvbmVudDtcbiAgICAgICAgdGhpcy5fY29tcG9uZW50LmFsaWduTGVmdCA9ICFhdG9tLmNvbmZpZy5nZXQoXCJncmFtbWFyLXNlbGVjdG9yLnNob3dPblJpZ2h0U2lkZU9mU3RhdHVzQmFyXCIpO1xuICAgICAgICB0aGlzLnZpZXcuYXBwZW5kQ2hpbGQodGhpcy5fY29tcG9uZW50KTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XG4gICAgICAgICAgICB0aWxlLmRlc3Ryb3koKTtcbiAgICAgICAgICAgIHRoaXMudmlldy5yZW1vdmUoKTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuYWN0aXZlRWRpdG9yXG4gICAgICAgICAgICAuZmlsdGVyKHogPT4gIXopXG4gICAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHRoaXMudmlldy5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCIpKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmFjdGl2ZVByb2plY3RcbiAgICAgICAgICAgIC5maWx0ZXIoeiA9PiB6LmZyYW1ld29ya3MubGVuZ3RoID09PSAxKVxuICAgICAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB0aGlzLnZpZXcuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiKSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5hY3RpdmVQcm9qZWN0XG4gICAgICAgICAgICAuc3Vic2NyaWJlKHByb2plY3QgPT4ge1xuICAgICAgICAgICAgdGhpcy52aWV3LnN0eWxlLmRpc3BsYXkgPSBcIlwiO1xuICAgICAgICAgICAgY29uc3QgeyBmcmFtZXdvcmtzLCBhY3RpdmVGcmFtZXdvcmsgfSA9IHByb2plY3Q7XG4gICAgICAgICAgICB0aGlzLnByb2plY3QgPSBwcm9qZWN0O1xuICAgICAgICAgICAgdGhpcy5fY29tcG9uZW50LmZyYW1ld29ya3MgPSBmcmFtZXdvcmtzO1xuICAgICAgICAgICAgdGhpcy5fY29tcG9uZW50LmFjdGl2ZUZyYW1ld29yayA9IGFjdGl2ZUZyYW1ld29yaztcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuYWN0aXZlRnJhbWV3b3JrXG4gICAgICAgICAgICAuc3Vic2NyaWJlKGN0eCA9PiB7XG4gICAgICAgICAgICB0aGlzLnZpZXcuc3R5bGUuZGlzcGxheSA9IFwiXCI7XG4gICAgICAgICAgICBjb25zdCB7IHByb2plY3QsIGZyYW1ld29yayB9ID0gY3R4O1xuICAgICAgICAgICAgdGhpcy5wcm9qZWN0ID0gcHJvamVjdDtcbiAgICAgICAgICAgIHRoaXMuX2NvbXBvbmVudC5mcmFtZXdvcmtzID0gcHJvamVjdC5mcmFtZXdvcmtzO1xuICAgICAgICAgICAgdGhpcy5fY29tcG9uZW50LmFjdGl2ZUZyYW1ld29yayA9IGZyYW1ld29yaztcbiAgICAgICAgfSkpO1xuICAgIH1cbiAgICBkaXNwb3NlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgIH1cbiAgICBzZXRBY3RpdmVGcmFtZXdvcmsoZnJhbWV3b3JrKSB7XG4gICAgICAgIGlmICh0aGlzLnByb2plY3QpIHtcbiAgICAgICAgICAgIHRoaXMucHJvamVjdC5hY3RpdmVGcmFtZXdvcmsgPSBmcmFtZXdvcms7XG4gICAgICAgICAgICB0aGlzLl9jb21wb25lbnQuYWN0aXZlRnJhbWV3b3JrID0gZnJhbWV3b3JrO1xuICAgICAgICB9XG4gICAgfVxufVxuZXhwb3J0IGNvbnN0IGZyYW1ld29ya1NlbGVjdG9yID0gbmV3IEZyYW1ld29ya1NlbGVjdG9yO1xuIiwiaW1wb3J0IHtNb2RlbHN9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XHJcbmltcG9ydCB7Q29tcG9zaXRlRGlzcG9zYWJsZSwgRGlzcG9zYWJsZX0gZnJvbSBcInRzLWRpc3Bvc2FibGVzXCI7XHJcbmltcG9ydCB7UHJvamVjdFZpZXdNb2RlbH0gZnJvbSBcIi4uL3NlcnZlci9wcm9qZWN0LXZpZXctbW9kZWxcIjtcclxuaW1wb3J0IHtPbW5pfSBmcm9tIFwiLi4vc2VydmVyL29tbmlcIjtcclxuaW1wb3J0IHtGcmFtZXdvcmtTZWxlY3RvckNvbXBvbmVudH0gZnJvbSBcIi4uL3ZpZXdzL2ZyYW1ld29yay1zZWxlY3Rvci12aWV3XCI7XHJcblxyXG5jbGFzcyBGcmFtZXdvcmtTZWxlY3RvciBpbXBsZW1lbnRzIElBdG9tRmVhdHVyZSB7XHJcbiAgICBwcml2YXRlIGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XHJcbiAgICBwcml2YXRlIHZpZXc6IEhUTUxTcGFuRWxlbWVudDtcclxuICAgIHByaXZhdGUgc3RhdHVzQmFyOiBhbnk7XHJcbiAgICBwcml2YXRlIF9hY3RpdmUgPSBmYWxzZTtcclxuICAgIHB1YmxpYyBwcm9qZWN0OiBQcm9qZWN0Vmlld01vZGVsPGFueT47XHJcbiAgICBwcml2YXRlIF9jb21wb25lbnQ6IEZyYW1ld29ya1NlbGVjdG9yQ29tcG9uZW50O1xyXG5cclxuICAgIHB1YmxpYyBhY3RpdmF0ZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzZXR1cChzdGF0dXNCYXI6IGFueSkge1xyXG4gICAgICAgIHRoaXMuc3RhdHVzQmFyID0gc3RhdHVzQmFyO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5fYWN0aXZlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2F0dGFjaCgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgYXR0YWNoKCkge1xyXG4gICAgICAgIGlmICh0aGlzLnN0YXR1c0JhcikgeyB0aGlzLl9hdHRhY2goKTsgfVxyXG4gICAgICAgIHRoaXMuX2FjdGl2ZSA9IHRydWU7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfYXR0YWNoKCkge1xyXG4gICAgICAgIHRoaXMudmlldyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xyXG4gICAgICAgIHRoaXMudmlldy5jbGFzc0xpc3QuYWRkKFwiaW5saW5lLWJsb2NrXCIpO1xyXG4gICAgICAgIHRoaXMudmlldy5jbGFzc0xpc3QuYWRkKFwiZnJhbWV3b3JrLXNlbGVjdG9yXCIpO1xyXG4gICAgICAgIHRoaXMudmlldy5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XHJcblxyXG4gICAgICAgIGxldCB0aWxlOiBhbnk7XHJcbiAgICAgICAgaWYgKGF0b20uY29uZmlnLmdldChcImdyYW1tYXItc2VsZWN0b3Iuc2hvd09uUmlnaHRTaWRlT2ZTdGF0dXNCYXJcIikpIHtcclxuICAgICAgICAgICAgdGlsZSA9IHRoaXMuc3RhdHVzQmFyLmFkZFJpZ2h0VGlsZSh7XHJcbiAgICAgICAgICAgICAgICBpdGVtOiB0aGlzLnZpZXcsXHJcbiAgICAgICAgICAgICAgICBwcmlvcml0eTogOVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aWxlID0gdGhpcy5zdGF0dXNCYXIuYWRkTGVmdFRpbGUoe1xyXG4gICAgICAgICAgICAgICAgaXRlbTogdGhpcy52aWV3LFxyXG4gICAgICAgICAgICAgICAgcHJpb3JpdHk6IDExXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5fY29tcG9uZW50ID0gbmV3IEZyYW1ld29ya1NlbGVjdG9yQ29tcG9uZW50O1xyXG4gICAgICAgIHRoaXMuX2NvbXBvbmVudC5hbGlnbkxlZnQgPSAhYXRvbS5jb25maWcuZ2V0KFwiZ3JhbW1hci1zZWxlY3Rvci5zaG93T25SaWdodFNpZGVPZlN0YXR1c0JhclwiKTtcclxuICAgICAgICB0aGlzLnZpZXcuYXBwZW5kQ2hpbGQodGhpcy5fY29tcG9uZW50KTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XHJcbiAgICAgICAgICAgIHRpbGUuZGVzdHJveSgpO1xyXG4gICAgICAgICAgICB0aGlzLnZpZXcucmVtb3ZlKCk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuYWN0aXZlRWRpdG9yXHJcbiAgICAgICAgICAgIC5maWx0ZXIoeiA9PiAheilcclxuICAgICAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB0aGlzLnZpZXcuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiKSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5hY3RpdmVQcm9qZWN0XHJcbiAgICAgICAgICAgIC5maWx0ZXIoeiA9PiB6LmZyYW1ld29ya3MubGVuZ3RoID09PSAxKVxyXG4gICAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHRoaXMudmlldy5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCIpKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmFjdGl2ZVByb2plY3RcclxuICAgICAgICAgICAgLnN1YnNjcmliZShwcm9qZWN0ID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMudmlldy5zdHlsZS5kaXNwbGF5ID0gXCJcIjtcclxuXHJcbiAgICAgICAgICAgICAgICBjb25zdCB7ZnJhbWV3b3JrcywgYWN0aXZlRnJhbWV3b3JrfSA9IHByb2plY3Q7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnByb2plY3QgPSBwcm9qZWN0O1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fY29tcG9uZW50LmZyYW1ld29ya3MgPSBmcmFtZXdvcmtzO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fY29tcG9uZW50LmFjdGl2ZUZyYW1ld29yayA9IGFjdGl2ZUZyYW1ld29yaztcclxuICAgICAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuYWN0aXZlRnJhbWV3b3JrXHJcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoY3R4ID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMudmlldy5zdHlsZS5kaXNwbGF5ID0gXCJcIjtcclxuXHJcbiAgICAgICAgICAgICAgICBjb25zdCB7cHJvamVjdCwgZnJhbWV3b3JrfSA9IGN0eDtcclxuICAgICAgICAgICAgICAgIHRoaXMucHJvamVjdCA9IHByb2plY3Q7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9jb21wb25lbnQuZnJhbWV3b3JrcyA9IHByb2plY3QuZnJhbWV3b3JrcztcclxuICAgICAgICAgICAgICAgIHRoaXMuX2NvbXBvbmVudC5hY3RpdmVGcmFtZXdvcmsgPSBmcmFtZXdvcms7XHJcbiAgICAgICAgICAgIH0pKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGlzcG9zZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzZXRBY3RpdmVGcmFtZXdvcmsoZnJhbWV3b3JrOiBNb2RlbHMuRG90TmV0RnJhbWV3b3JrKSB7XHJcbiAgICAgICAgaWYgKHRoaXMucHJvamVjdCkge1xyXG4gICAgICAgICAgICB0aGlzLnByb2plY3QuYWN0aXZlRnJhbWV3b3JrID0gZnJhbWV3b3JrO1xyXG4gICAgICAgICAgICB0aGlzLl9jb21wb25lbnQuYWN0aXZlRnJhbWV3b3JrID0gZnJhbWV3b3JrO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVxdWlyZWQgPSB0cnVlO1xyXG4gICAgcHVibGljIHRpdGxlID0gXCJGcmFtZXdvcmsgU2VsZWN0b3JcIjtcclxuICAgIHB1YmxpYyBkZXNjcmlwdGlvbiA9IFwiTGV0cyB5b3Ugc2VsZWN0IHRoZSBmcmFtZXdvcmsgeW91XFxcInJlIGN1cnJlbnRseSB0YXJnZXRpbmcuXCI7XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBmcmFtZXdvcmtTZWxlY3RvciA9IG5ldyBGcmFtZXdvcmtTZWxlY3RvcjtcclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
