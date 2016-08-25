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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9hdG9tL2ZyYW1ld29yay1zZWxlY3Rvci5qcyIsImxpYi9hdG9tL2ZyYW1ld29yay1zZWxlY3Rvci50cyJdLCJuYW1lcyI6WyJGcmFtZXdvcmtTZWxlY3RvciIsIl9hY3RpdmUiLCJyZXF1aXJlZCIsInRpdGxlIiwiZGVzY3JpcHRpb24iLCJkaXNwb3NhYmxlIiwic3RhdHVzQmFyIiwiX2F0dGFjaCIsInZpZXciLCJkb2N1bWVudCIsImNyZWF0ZUVsZW1lbnQiLCJjbGFzc0xpc3QiLCJhZGQiLCJzdHlsZSIsImRpc3BsYXkiLCJ0aWxlIiwiYXRvbSIsImNvbmZpZyIsImdldCIsImFkZFJpZ2h0VGlsZSIsIml0ZW0iLCJwcmlvcml0eSIsImFkZExlZnRUaWxlIiwiX2NvbXBvbmVudCIsImFsaWduTGVmdCIsImFwcGVuZENoaWxkIiwiY3JlYXRlIiwiZGVzdHJveSIsInJlbW92ZSIsImFjdGl2ZUVkaXRvciIsImZpbHRlciIsInoiLCJzdWJzY3JpYmUiLCJhY3RpdmVQcm9qZWN0IiwiZnJhbWV3b3JrcyIsImxlbmd0aCIsInByb2plY3QiLCJhY3RpdmVGcmFtZXdvcmsiLCJjdHgiLCJmcmFtZXdvcmsiLCJkaXNwb3NlIiwiZnJhbWV3b3JrU2VsZWN0b3IiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQUNBOztBQUNBOzs7O0lDSUFBLGlCO0FBQUEsaUNBQUE7QUFBQTs7QUFJWSxhQUFBQyxPQUFBLEdBQVUsS0FBVjtBQXlGRCxhQUFBQyxRQUFBLEdBQVcsSUFBWDtBQUNBLGFBQUFDLEtBQUEsR0FBUSxvQkFBUjtBQUNBLGFBQUFDLFdBQUEsR0FBYyw0REFBZDtBQUNWOzs7O21DQXhGa0I7QUFDWCxpQkFBS0MsVUFBTCxHQUFrQix3Q0FBbEI7QUFDSDs7OzhCQUVZQyxTLEVBQWM7QUFDdkIsaUJBQUtBLFNBQUwsR0FBaUJBLFNBQWpCO0FBRUEsZ0JBQUksS0FBS0wsT0FBVCxFQUFrQjtBQUNkLHFCQUFLTSxPQUFMO0FBQ0g7QUFDSjs7O2lDQUVZO0FBQ1QsZ0JBQUksS0FBS0QsU0FBVCxFQUFvQjtBQUFFLHFCQUFLQyxPQUFMO0FBQWlCO0FBQ3ZDLGlCQUFLTixPQUFMLEdBQWUsSUFBZjtBQUNIOzs7a0NBRWM7QUFBQTs7QUFDWCxpQkFBS08sSUFBTCxHQUFZQyxTQUFTQyxhQUFULENBQXVCLE1BQXZCLENBQVo7QUFDQSxpQkFBS0YsSUFBTCxDQUFVRyxTQUFWLENBQW9CQyxHQUFwQixDQUF3QixjQUF4QjtBQUNBLGlCQUFLSixJQUFMLENBQVVHLFNBQVYsQ0FBb0JDLEdBQXBCLENBQXdCLG9CQUF4QjtBQUNBLGlCQUFLSixJQUFMLENBQVVLLEtBQVYsQ0FBZ0JDLE9BQWhCLEdBQTBCLE1BQTFCO0FBRUEsZ0JBQUlDLGFBQUo7QUFDQSxnQkFBSUMsS0FBS0MsTUFBTCxDQUFZQyxHQUFaLENBQWdCLDZDQUFoQixDQUFKLEVBQW9FO0FBQ2hFSCx1QkFBTyxLQUFLVCxTQUFMLENBQWVhLFlBQWYsQ0FBNEI7QUFDL0JDLDBCQUFNLEtBQUtaLElBRG9CO0FBRS9CYSw4QkFBVTtBQUZxQixpQkFBNUIsQ0FBUDtBQUlILGFBTEQsTUFLTztBQUNITix1QkFBTyxLQUFLVCxTQUFMLENBQWVnQixXQUFmLENBQTJCO0FBQzlCRiwwQkFBTSxLQUFLWixJQURtQjtBQUU5QmEsOEJBQVU7QUFGb0IsaUJBQTNCLENBQVA7QUFJSDtBQUVELGlCQUFLRSxVQUFMLEdBQWtCLHVEQUFsQjtBQUNBLGlCQUFLQSxVQUFMLENBQWdCQyxTQUFoQixHQUE0QixDQUFDUixLQUFLQyxNQUFMLENBQVlDLEdBQVosQ0FBZ0IsNkNBQWhCLENBQTdCO0FBQ0EsaUJBQUtWLElBQUwsQ0FBVWlCLFdBQVYsQ0FBc0IsS0FBS0YsVUFBM0I7QUFFQSxpQkFBS2xCLFVBQUwsQ0FBZ0JPLEdBQWhCLENBQW9CLDBCQUFXYyxNQUFYLENBQWtCLFlBQUE7QUFDbENYLHFCQUFLWSxPQUFMO0FBQ0Esc0JBQUtuQixJQUFMLENBQVVvQixNQUFWO0FBQ0gsYUFIbUIsQ0FBcEI7QUFLQSxpQkFBS3ZCLFVBQUwsQ0FBZ0JPLEdBQWhCLENBQW9CLFdBQUtpQixZQUFMLENBQ2ZDLE1BRGUsQ0FDUjtBQUFBLHVCQUFLLENBQUNDLENBQU47QUFBQSxhQURRLEVBRWZDLFNBRmUsQ0FFTDtBQUFBLHVCQUFNLE1BQUt4QixJQUFMLENBQVVLLEtBQVYsQ0FBZ0JDLE9BQWhCLEdBQTBCLE1BQWhDO0FBQUEsYUFGSyxDQUFwQjtBQUlBLGlCQUFLVCxVQUFMLENBQWdCTyxHQUFoQixDQUFvQixXQUFLcUIsYUFBTCxDQUNmSCxNQURlLENBQ1I7QUFBQSx1QkFBS0MsRUFBRUcsVUFBRixDQUFhQyxNQUFiLEtBQXdCLENBQTdCO0FBQUEsYUFEUSxFQUVmSCxTQUZlLENBRUw7QUFBQSx1QkFBTSxNQUFLeEIsSUFBTCxDQUFVSyxLQUFWLENBQWdCQyxPQUFoQixHQUEwQixNQUFoQztBQUFBLGFBRkssQ0FBcEI7QUFJQSxpQkFBS1QsVUFBTCxDQUFnQk8sR0FBaEIsQ0FBb0IsV0FBS3FCLGFBQUwsQ0FDZkQsU0FEZSxDQUNMLG1CQUFPO0FBQ2Qsc0JBQUt4QixJQUFMLENBQVVLLEtBQVYsQ0FBZ0JDLE9BQWhCLEdBQTBCLEVBQTFCO0FBRGMsb0JBR1BvQixVQUhPLEdBR3dCRSxPQUh4QixDQUdQRixVQUhPO0FBQUEsb0JBR0tHLGVBSEwsR0FHd0JELE9BSHhCLENBR0tDLGVBSEw7O0FBSWQsc0JBQUtELE9BQUwsR0FBZUEsT0FBZjtBQUNBLHNCQUFLYixVQUFMLENBQWdCVyxVQUFoQixHQUE2QkEsVUFBN0I7QUFDQSxzQkFBS1gsVUFBTCxDQUFnQmMsZUFBaEIsR0FBa0NBLGVBQWxDO0FBQ0gsYUFSZSxDQUFwQjtBQVVBLGlCQUFLaEMsVUFBTCxDQUFnQk8sR0FBaEIsQ0FBb0IsV0FBS3lCLGVBQUwsQ0FDZkwsU0FEZSxDQUNMLGVBQUc7QUFDVixzQkFBS3hCLElBQUwsQ0FBVUssS0FBVixDQUFnQkMsT0FBaEIsR0FBMEIsRUFBMUI7QUFEVSxvQkFHSHNCLE9BSEcsR0FHbUJFLEdBSG5CLENBR0hGLE9BSEc7QUFBQSxvQkFHTUcsU0FITixHQUdtQkQsR0FIbkIsQ0FHTUMsU0FITjs7QUFJVixzQkFBS0gsT0FBTCxHQUFlQSxPQUFmO0FBQ0Esc0JBQUtiLFVBQUwsQ0FBZ0JXLFVBQWhCLEdBQTZCRSxRQUFRRixVQUFyQztBQUNBLHNCQUFLWCxVQUFMLENBQWdCYyxlQUFoQixHQUFrQ0UsU0FBbEM7QUFDSCxhQVJlLENBQXBCO0FBU0g7OztrQ0FFYTtBQUNWLGlCQUFLbEMsVUFBTCxDQUFnQm1DLE9BQWhCO0FBQ0g7OzsyQ0FFeUJELFMsRUFBaUM7QUFDdkQsZ0JBQUksS0FBS0gsT0FBVCxFQUFrQjtBQUNkLHFCQUFLQSxPQUFMLENBQWFDLGVBQWIsR0FBK0JFLFNBQS9CO0FBQ0EscUJBQUtoQixVQUFMLENBQWdCYyxlQUFoQixHQUFrQ0UsU0FBbEM7QUFDSDtBQUNKOzs7Ozs7QUFPRSxJQUFNRSxnREFBb0IsSUFBSXpDLGlCQUFKLEVBQTFCIiwiZmlsZSI6ImxpYi9hdG9tL2ZyYW1ld29yay1zZWxlY3Rvci5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUsIERpc3Bvc2FibGUgfSBmcm9tIFwidHMtZGlzcG9zYWJsZXNcIjtcbmltcG9ydCB7IE9tbmkgfSBmcm9tIFwiLi4vc2VydmVyL29tbmlcIjtcbmltcG9ydCB7IEZyYW1ld29ya1NlbGVjdG9yQ29tcG9uZW50IH0gZnJvbSBcIi4uL3ZpZXdzL2ZyYW1ld29yay1zZWxlY3Rvci12aWV3XCI7XG5jbGFzcyBGcmFtZXdvcmtTZWxlY3RvciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuX2FjdGl2ZSA9IGZhbHNlO1xuICAgICAgICB0aGlzLnJlcXVpcmVkID0gdHJ1ZTtcbiAgICAgICAgdGhpcy50aXRsZSA9IFwiRnJhbWV3b3JrIFNlbGVjdG9yXCI7XG4gICAgICAgIHRoaXMuZGVzY3JpcHRpb24gPSBcIkxldHMgeW91IHNlbGVjdCB0aGUgZnJhbWV3b3JrIHlvdVxcXCJyZSBjdXJyZW50bHkgdGFyZ2V0aW5nLlwiO1xuICAgIH1cbiAgICBhY3RpdmF0ZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICB9XG4gICAgc2V0dXAoc3RhdHVzQmFyKSB7XG4gICAgICAgIHRoaXMuc3RhdHVzQmFyID0gc3RhdHVzQmFyO1xuICAgICAgICBpZiAodGhpcy5fYWN0aXZlKSB7XG4gICAgICAgICAgICB0aGlzLl9hdHRhY2goKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBhdHRhY2goKSB7XG4gICAgICAgIGlmICh0aGlzLnN0YXR1c0Jhcikge1xuICAgICAgICAgICAgdGhpcy5fYXR0YWNoKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fYWN0aXZlID0gdHJ1ZTtcbiAgICB9XG4gICAgX2F0dGFjaCgpIHtcbiAgICAgICAgdGhpcy52aWV3ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICAgIHRoaXMudmlldy5jbGFzc0xpc3QuYWRkKFwiaW5saW5lLWJsb2NrXCIpO1xuICAgICAgICB0aGlzLnZpZXcuY2xhc3NMaXN0LmFkZChcImZyYW1ld29yay1zZWxlY3RvclwiKTtcbiAgICAgICAgdGhpcy52aWV3LnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgbGV0IHRpbGU7XG4gICAgICAgIGlmIChhdG9tLmNvbmZpZy5nZXQoXCJncmFtbWFyLXNlbGVjdG9yLnNob3dPblJpZ2h0U2lkZU9mU3RhdHVzQmFyXCIpKSB7XG4gICAgICAgICAgICB0aWxlID0gdGhpcy5zdGF0dXNCYXIuYWRkUmlnaHRUaWxlKHtcbiAgICAgICAgICAgICAgICBpdGVtOiB0aGlzLnZpZXcsXG4gICAgICAgICAgICAgICAgcHJpb3JpdHk6IDlcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGlsZSA9IHRoaXMuc3RhdHVzQmFyLmFkZExlZnRUaWxlKHtcbiAgICAgICAgICAgICAgICBpdGVtOiB0aGlzLnZpZXcsXG4gICAgICAgICAgICAgICAgcHJpb3JpdHk6IDExXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9jb21wb25lbnQgPSBuZXcgRnJhbWV3b3JrU2VsZWN0b3JDb21wb25lbnQ7XG4gICAgICAgIHRoaXMuX2NvbXBvbmVudC5hbGlnbkxlZnQgPSAhYXRvbS5jb25maWcuZ2V0KFwiZ3JhbW1hci1zZWxlY3Rvci5zaG93T25SaWdodFNpZGVPZlN0YXR1c0JhclwiKTtcbiAgICAgICAgdGhpcy52aWV3LmFwcGVuZENoaWxkKHRoaXMuX2NvbXBvbmVudCk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xuICAgICAgICAgICAgdGlsZS5kZXN0cm95KCk7XG4gICAgICAgICAgICB0aGlzLnZpZXcucmVtb3ZlKCk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmFjdGl2ZUVkaXRvclxuICAgICAgICAgICAgLmZpbHRlcih6ID0+ICF6KVxuICAgICAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB0aGlzLnZpZXcuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiKSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5hY3RpdmVQcm9qZWN0XG4gICAgICAgICAgICAuZmlsdGVyKHogPT4gei5mcmFtZXdvcmtzLmxlbmd0aCA9PT0gMSlcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoKCkgPT4gdGhpcy52aWV3LnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIikpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuYWN0aXZlUHJvamVjdFxuICAgICAgICAgICAgLnN1YnNjcmliZShwcm9qZWN0ID0+IHtcbiAgICAgICAgICAgIHRoaXMudmlldy5zdHlsZS5kaXNwbGF5ID0gXCJcIjtcbiAgICAgICAgICAgIGNvbnN0IHsgZnJhbWV3b3JrcywgYWN0aXZlRnJhbWV3b3JrIH0gPSBwcm9qZWN0O1xuICAgICAgICAgICAgdGhpcy5wcm9qZWN0ID0gcHJvamVjdDtcbiAgICAgICAgICAgIHRoaXMuX2NvbXBvbmVudC5mcmFtZXdvcmtzID0gZnJhbWV3b3JrcztcbiAgICAgICAgICAgIHRoaXMuX2NvbXBvbmVudC5hY3RpdmVGcmFtZXdvcmsgPSBhY3RpdmVGcmFtZXdvcms7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmFjdGl2ZUZyYW1ld29ya1xuICAgICAgICAgICAgLnN1YnNjcmliZShjdHggPT4ge1xuICAgICAgICAgICAgdGhpcy52aWV3LnN0eWxlLmRpc3BsYXkgPSBcIlwiO1xuICAgICAgICAgICAgY29uc3QgeyBwcm9qZWN0LCBmcmFtZXdvcmsgfSA9IGN0eDtcbiAgICAgICAgICAgIHRoaXMucHJvamVjdCA9IHByb2plY3Q7XG4gICAgICAgICAgICB0aGlzLl9jb21wb25lbnQuZnJhbWV3b3JrcyA9IHByb2plY3QuZnJhbWV3b3JrcztcbiAgICAgICAgICAgIHRoaXMuX2NvbXBvbmVudC5hY3RpdmVGcmFtZXdvcmsgPSBmcmFtZXdvcms7XG4gICAgICAgIH0pKTtcbiAgICB9XG4gICAgZGlzcG9zZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICB9XG4gICAgc2V0QWN0aXZlRnJhbWV3b3JrKGZyYW1ld29yaykge1xuICAgICAgICBpZiAodGhpcy5wcm9qZWN0KSB7XG4gICAgICAgICAgICB0aGlzLnByb2plY3QuYWN0aXZlRnJhbWV3b3JrID0gZnJhbWV3b3JrO1xuICAgICAgICAgICAgdGhpcy5fY29tcG9uZW50LmFjdGl2ZUZyYW1ld29yayA9IGZyYW1ld29yaztcbiAgICAgICAgfVxuICAgIH1cbn1cbmV4cG9ydCBjb25zdCBmcmFtZXdvcmtTZWxlY3RvciA9IG5ldyBGcmFtZXdvcmtTZWxlY3RvcjtcbiIsImltcG9ydCB7TW9kZWxzfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xyXG5pbXBvcnQge0NvbXBvc2l0ZURpc3Bvc2FibGUsIERpc3Bvc2FibGV9IGZyb20gXCJ0cy1kaXNwb3NhYmxlc1wiO1xyXG5pbXBvcnQge1Byb2plY3RWaWV3TW9kZWx9IGZyb20gXCIuLi9zZXJ2ZXIvcHJvamVjdC12aWV3LW1vZGVsXCI7XHJcbmltcG9ydCB7T21uaX0gZnJvbSBcIi4uL3NlcnZlci9vbW5pXCI7XHJcbmltcG9ydCB7RnJhbWV3b3JrU2VsZWN0b3JDb21wb25lbnR9IGZyb20gXCIuLi92aWV3cy9mcmFtZXdvcmstc2VsZWN0b3Itdmlld1wiO1xyXG5cclxuY2xhc3MgRnJhbWV3b3JrU2VsZWN0b3IgaW1wbGVtZW50cyBJQXRvbUZlYXR1cmUge1xyXG4gICAgcHJpdmF0ZSBkaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xyXG4gICAgcHJpdmF0ZSB2aWV3OiBIVE1MU3BhbkVsZW1lbnQ7XHJcbiAgICBwcml2YXRlIHN0YXR1c0JhcjogYW55O1xyXG4gICAgcHJpdmF0ZSBfYWN0aXZlID0gZmFsc2U7XHJcbiAgICBwdWJsaWMgcHJvamVjdDogUHJvamVjdFZpZXdNb2RlbDxhbnk+O1xyXG4gICAgcHJpdmF0ZSBfY29tcG9uZW50OiBGcmFtZXdvcmtTZWxlY3RvckNvbXBvbmVudDtcclxuXHJcbiAgICBwdWJsaWMgYWN0aXZhdGUoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2V0dXAoc3RhdHVzQmFyOiBhbnkpIHtcclxuICAgICAgICB0aGlzLnN0YXR1c0JhciA9IHN0YXR1c0JhcjtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX2FjdGl2ZSkge1xyXG4gICAgICAgICAgICB0aGlzLl9hdHRhY2goKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGF0dGFjaCgpIHtcclxuICAgICAgICBpZiAodGhpcy5zdGF0dXNCYXIpIHsgdGhpcy5fYXR0YWNoKCk7IH1cclxuICAgICAgICB0aGlzLl9hY3RpdmUgPSB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX2F0dGFjaCgpIHtcclxuICAgICAgICB0aGlzLnZpZXcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcclxuICAgICAgICB0aGlzLnZpZXcuY2xhc3NMaXN0LmFkZChcImlubGluZS1ibG9ja1wiKTtcclxuICAgICAgICB0aGlzLnZpZXcuY2xhc3NMaXN0LmFkZChcImZyYW1ld29yay1zZWxlY3RvclwiKTtcclxuICAgICAgICB0aGlzLnZpZXcuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xyXG5cclxuICAgICAgICBsZXQgdGlsZTogYW55O1xyXG4gICAgICAgIGlmIChhdG9tLmNvbmZpZy5nZXQoXCJncmFtbWFyLXNlbGVjdG9yLnNob3dPblJpZ2h0U2lkZU9mU3RhdHVzQmFyXCIpKSB7XHJcbiAgICAgICAgICAgIHRpbGUgPSB0aGlzLnN0YXR1c0Jhci5hZGRSaWdodFRpbGUoe1xyXG4gICAgICAgICAgICAgICAgaXRlbTogdGhpcy52aWV3LFxyXG4gICAgICAgICAgICAgICAgcHJpb3JpdHk6IDlcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGlsZSA9IHRoaXMuc3RhdHVzQmFyLmFkZExlZnRUaWxlKHtcclxuICAgICAgICAgICAgICAgIGl0ZW06IHRoaXMudmlldyxcclxuICAgICAgICAgICAgICAgIHByaW9yaXR5OiAxMVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuX2NvbXBvbmVudCA9IG5ldyBGcmFtZXdvcmtTZWxlY3RvckNvbXBvbmVudDtcclxuICAgICAgICB0aGlzLl9jb21wb25lbnQuYWxpZ25MZWZ0ID0gIWF0b20uY29uZmlnLmdldChcImdyYW1tYXItc2VsZWN0b3Iuc2hvd09uUmlnaHRTaWRlT2ZTdGF0dXNCYXJcIik7XHJcbiAgICAgICAgdGhpcy52aWV3LmFwcGVuZENoaWxkKHRoaXMuX2NvbXBvbmVudCk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xyXG4gICAgICAgICAgICB0aWxlLmRlc3Ryb3koKTtcclxuICAgICAgICAgICAgdGhpcy52aWV3LnJlbW92ZSgpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmFjdGl2ZUVkaXRvclxyXG4gICAgICAgICAgICAuZmlsdGVyKHogPT4gIXopXHJcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoKCkgPT4gdGhpcy52aWV3LnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIikpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuYWN0aXZlUHJvamVjdFxyXG4gICAgICAgICAgICAuZmlsdGVyKHogPT4gei5mcmFtZXdvcmtzLmxlbmd0aCA9PT0gMSlcclxuICAgICAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB0aGlzLnZpZXcuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiKSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5hY3RpdmVQcm9qZWN0XHJcbiAgICAgICAgICAgIC5zdWJzY3JpYmUocHJvamVjdCA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnZpZXcuc3R5bGUuZGlzcGxheSA9IFwiXCI7XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc3Qge2ZyYW1ld29ya3MsIGFjdGl2ZUZyYW1ld29ya30gPSBwcm9qZWN0O1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wcm9qZWN0ID0gcHJvamVjdDtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2NvbXBvbmVudC5mcmFtZXdvcmtzID0gZnJhbWV3b3JrcztcclxuICAgICAgICAgICAgICAgIHRoaXMuX2NvbXBvbmVudC5hY3RpdmVGcmFtZXdvcmsgPSBhY3RpdmVGcmFtZXdvcms7XHJcbiAgICAgICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmFjdGl2ZUZyYW1ld29ya1xyXG4gICAgICAgICAgICAuc3Vic2NyaWJlKGN0eCA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnZpZXcuc3R5bGUuZGlzcGxheSA9IFwiXCI7XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc3Qge3Byb2plY3QsIGZyYW1ld29ya30gPSBjdHg7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnByb2plY3QgPSBwcm9qZWN0O1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fY29tcG9uZW50LmZyYW1ld29ya3MgPSBwcm9qZWN0LmZyYW1ld29ya3M7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9jb21wb25lbnQuYWN0aXZlRnJhbWV3b3JrID0gZnJhbWV3b3JrO1xyXG4gICAgICAgICAgICB9KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2V0QWN0aXZlRnJhbWV3b3JrKGZyYW1ld29yazogTW9kZWxzLkRvdE5ldEZyYW1ld29yaykge1xyXG4gICAgICAgIGlmICh0aGlzLnByb2plY3QpIHtcclxuICAgICAgICAgICAgdGhpcy5wcm9qZWN0LmFjdGl2ZUZyYW1ld29yayA9IGZyYW1ld29yaztcclxuICAgICAgICAgICAgdGhpcy5fY29tcG9uZW50LmFjdGl2ZUZyYW1ld29yayA9IGZyYW1ld29yaztcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlcXVpcmVkID0gdHJ1ZTtcclxuICAgIHB1YmxpYyB0aXRsZSA9IFwiRnJhbWV3b3JrIFNlbGVjdG9yXCI7XHJcbiAgICBwdWJsaWMgZGVzY3JpcHRpb24gPSBcIkxldHMgeW91IHNlbGVjdCB0aGUgZnJhbWV3b3JrIHlvdVxcXCJyZSBjdXJyZW50bHkgdGFyZ2V0aW5nLlwiO1xyXG59XHJcblxyXG5leHBvcnQgY29uc3QgZnJhbWV3b3JrU2VsZWN0b3IgPSBuZXcgRnJhbWV3b3JrU2VsZWN0b3I7XHJcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
