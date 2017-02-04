'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.frameworkSelector = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _tsDisposables = require('ts-disposables');

var _omni = require('../server/omni');

var _frameworkSelectorView = require('../views/framework-selector-view');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var FrameworkSelector = function () {
    function FrameworkSelector() {
        _classCallCheck(this, FrameworkSelector);

        this._active = false;
        this.required = true;
        this.title = 'Framework Selector';
        this.description = 'Lets you select the framework you\"re currently targeting.';
    }

    _createClass(FrameworkSelector, [{
        key: 'activate',
        value: function activate() {
            this.disposable = new _tsDisposables.CompositeDisposable();
        }
    }, {
        key: 'setup',
        value: function setup(statusBar) {
            this.statusBar = statusBar;
            if (this._active) {
                this._attach();
            }
        }
    }, {
        key: 'attach',
        value: function attach() {
            if (this.statusBar) {
                this._attach();
            }
            this._active = true;
        }
    }, {
        key: '_attach',
        value: function _attach() {
            var _this = this;

            this.view = document.createElement('span');
            this.view.classList.add('inline-block');
            this.view.classList.add('framework-selector');
            this.view.style.display = 'none';
            var tile = void 0;
            if (atom.config.get('grammar-selector.showOnRightSideOfStatusBar')) {
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
            this._component.alignLeft = !atom.config.get('grammar-selector.showOnRightSideOfStatusBar');
            this.view.appendChild(this._component);
            this.disposable.add(_tsDisposables.Disposable.create(function () {
                tile.destroy();
                _this.view.remove();
            }));
            this.disposable.add(_omni.Omni.activeEditor.filter(function (z) {
                return !z;
            }).subscribe(function () {
                return _this.view.style.display = 'none';
            }));
            this.disposable.add(_omni.Omni.activeProject.filter(function (z) {
                return z.frameworks.length === 1;
            }).subscribe(function () {
                return _this.view.style.display = 'none';
            }));
            this.disposable.add(_omni.Omni.activeProject.subscribe(function (project) {
                _this.view.style.display = '';
                var frameworks = project.frameworks,
                    activeFramework = project.activeFramework;

                _this.project = project;
                _this._component.frameworks = frameworks;
                _this._component.activeFramework = activeFramework;
            }));
            this.disposable.add(_omni.Omni.activeFramework.subscribe(function (ctx) {
                _this.view.style.display = '';
                var project = ctx.project,
                    framework = ctx.framework;

                _this.project = project;
                _this._component.frameworks = project.frameworks;
                _this._component.activeFramework = framework;
            }));
        }
    }, {
        key: 'dispose',
        value: function dispose() {
            this.disposable.dispose();
        }
    }, {
        key: 'setActiveFramework',
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9hdG9tL2ZyYW1ld29yay1zZWxlY3Rvci50cyJdLCJuYW1lcyI6WyJGcmFtZXdvcmtTZWxlY3RvciIsIl9hY3RpdmUiLCJyZXF1aXJlZCIsInRpdGxlIiwiZGVzY3JpcHRpb24iLCJkaXNwb3NhYmxlIiwic3RhdHVzQmFyIiwiX2F0dGFjaCIsInZpZXciLCJkb2N1bWVudCIsImNyZWF0ZUVsZW1lbnQiLCJjbGFzc0xpc3QiLCJhZGQiLCJzdHlsZSIsImRpc3BsYXkiLCJ0aWxlIiwiYXRvbSIsImNvbmZpZyIsImdldCIsImFkZFJpZ2h0VGlsZSIsIml0ZW0iLCJwcmlvcml0eSIsImFkZExlZnRUaWxlIiwiX2NvbXBvbmVudCIsImFsaWduTGVmdCIsImFwcGVuZENoaWxkIiwiY3JlYXRlIiwiZGVzdHJveSIsInJlbW92ZSIsImFjdGl2ZUVkaXRvciIsImZpbHRlciIsInoiLCJzdWJzY3JpYmUiLCJhY3RpdmVQcm9qZWN0IiwiZnJhbWV3b3JrcyIsImxlbmd0aCIsInByb2plY3QiLCJhY3RpdmVGcmFtZXdvcmsiLCJjdHgiLCJmcmFtZXdvcmsiLCJkaXNwb3NlIiwiZnJhbWV3b3JrU2VsZWN0b3IiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUNBOztBQUNBOztBQUVBOzs7O0lBRUFBLGlCO0FBQUEsaUNBQUE7QUFBQTs7QUFJWSxhQUFBQyxPQUFBLEdBQVUsS0FBVjtBQXlGRCxhQUFBQyxRQUFBLEdBQVcsSUFBWDtBQUNBLGFBQUFDLEtBQUEsR0FBUSxvQkFBUjtBQUNBLGFBQUFDLFdBQUEsR0FBYyw0REFBZDtBQUNWOzs7O21DQXhGa0I7QUFDWCxpQkFBS0MsVUFBTCxHQUFrQix3Q0FBbEI7QUFDSDs7OzhCQUVZQyxTLEVBQWM7QUFDdkIsaUJBQUtBLFNBQUwsR0FBaUJBLFNBQWpCO0FBRUEsZ0JBQUksS0FBS0wsT0FBVCxFQUFrQjtBQUNkLHFCQUFLTSxPQUFMO0FBQ0g7QUFDSjs7O2lDQUVZO0FBQ1QsZ0JBQUksS0FBS0QsU0FBVCxFQUFvQjtBQUFF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VixzQkFBS0gsT0FBTCxHQUFlQSxPQUFmO0FBQ0Esc0JBQUtiLFVBQUwsQ0FBZ0JXLFVBQWhCLEdBQTZCRSxRQUFRRixVQUFyQztBQUNBLHNCQUFLWCxVQUFMLENBQWdCYyxlQUFoQixHQUFrQ0UsU0FBbEM7QUFDSCxhQVJlLENBQXBCO0FBU0g7OztrQ0FFYTtBQUNWLGlCQUFLbEMsVUFBTCxDQUFnQm1DLE9BQWhCO0FBQ0g7OzsyQ0FFeUJELFMsRUFBaUM7QUFDdkQsZ0JBQUksS0FBS0gsT0FBVCxFQUFrQjtBQUNkLHFCQUFLQSxPQUFMLENBQWFDLGVBQWIsR0FBK0JFLFNBQS9CO0FBQ0EscUJBQUtoQixVQUFMLENBQWdCYyxlQUFoQixHQUFrQ0UsU0FBbEM7QUFDSDtBQUNKOzs7Ozs7QUFPRSxJQUFNRSxnREFBb0IsSUFBSXpDLGlCQUFKLEVBQTFCIiwiZmlsZSI6ImxpYi9hdG9tL2ZyYW1ld29yay1zZWxlY3Rvci5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE1vZGVscyB9IGZyb20gJ29tbmlzaGFycC1jbGllbnQnO1xyXG5pbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlIH0gZnJvbSAndHMtZGlzcG9zYWJsZXMnO1xyXG5pbXBvcnQgeyBPbW5pIH0gZnJvbSAnLi4vc2VydmVyL29tbmknO1xyXG5pbXBvcnQgeyBQcm9qZWN0Vmlld01vZGVsIH0gZnJvbSAnLi4vc2VydmVyL3Byb2plY3Qtdmlldy1tb2RlbCc7XHJcbmltcG9ydCB7IEZyYW1ld29ya1NlbGVjdG9yQ29tcG9uZW50IH0gZnJvbSAnLi4vdmlld3MvZnJhbWV3b3JrLXNlbGVjdG9yLXZpZXcnO1xyXG5cclxuY2xhc3MgRnJhbWV3b3JrU2VsZWN0b3IgaW1wbGVtZW50cyBJQXRvbUZlYXR1cmUge1xyXG4gICAgcHJpdmF0ZSBkaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xyXG4gICAgcHJpdmF0ZSB2aWV3OiBIVE1MU3BhbkVsZW1lbnQ7XHJcbiAgICBwcml2YXRlIHN0YXR1c0JhcjogYW55O1xyXG4gICAgcHJpdmF0ZSBfYWN0aXZlID0gZmFsc2U7XHJcbiAgICBwdWJsaWMgcHJvamVjdDogUHJvamVjdFZpZXdNb2RlbDxhbnk+O1xyXG4gICAgcHJpdmF0ZSBfY29tcG9uZW50OiBGcmFtZXdvcmtTZWxlY3RvckNvbXBvbmVudDtcclxuXHJcbiAgICBwdWJsaWMgYWN0aXZhdGUoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2V0dXAoc3RhdHVzQmFyOiBhbnkpIHtcclxuICAgICAgICB0aGlzLnN0YXR1c0JhciA9IHN0YXR1c0JhcjtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX2FjdGl2ZSkge1xyXG4gICAgICAgICAgICB0aGlzLl9hdHRhY2goKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGF0dGFjaCgpIHtcclxuICAgICAgICBpZiAodGhpcy5zdGF0dXNCYXIpIHsgdGhpcy5fYXR0YWNoKCk7IH1cclxuICAgICAgICB0aGlzLl9hY3RpdmUgPSB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX2F0dGFjaCgpIHtcclxuICAgICAgICB0aGlzLnZpZXcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XHJcbiAgICAgICAgdGhpcy52aWV3LmNsYXNzTGlzdC5hZGQoJ2lubGluZS1ibG9jaycpO1xyXG4gICAgICAgIHRoaXMudmlldy5jbGFzc0xpc3QuYWRkKCdmcmFtZXdvcmstc2VsZWN0b3InKTtcclxuICAgICAgICB0aGlzLnZpZXcuc3R5bGUuZGlzcGxheSA9ICdub25lJztcclxuXHJcbiAgICAgICAgbGV0IHRpbGU6IGFueTtcclxuICAgICAgICBpZiAoYXRvbS5jb25maWcuZ2V0KCdncmFtbWFyLXNlbGVjdG9yLnNob3dPblJpZ2h0U2lkZU9mU3RhdHVzQmFyJykpIHtcclxuICAgICAgICAgICAgdGlsZSA9IHRoaXMuc3RhdHVzQmFyLmFkZFJpZ2h0VGlsZSh7XHJcbiAgICAgICAgICAgICAgICBpdGVtOiB0aGlzLnZpZXcsXHJcbiAgICAgICAgICAgICAgICBwcmlvcml0eTogOVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aWxlID0gdGhpcy5zdGF0dXNCYXIuYWRkTGVmdFRpbGUoe1xyXG4gICAgICAgICAgICAgICAgaXRlbTogdGhpcy52aWV3LFxyXG4gICAgICAgICAgICAgICAgcHJpb3JpdHk6IDExXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5fY29tcG9uZW50ID0gbmV3IEZyYW1ld29ya1NlbGVjdG9yQ29tcG9uZW50O1xyXG4gICAgICAgIHRoaXMuX2NvbXBvbmVudC5hbGlnbkxlZnQgPSAhYXRvbS5jb25maWcuZ2V0KCdncmFtbWFyLXNlbGVjdG9yLnNob3dPblJpZ2h0U2lkZU9mU3RhdHVzQmFyJyk7XHJcbiAgICAgICAgdGhpcy52aWV3LmFwcGVuZENoaWxkKHRoaXMuX2NvbXBvbmVudCk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xyXG4gICAgICAgICAgICB0aWxlLmRlc3Ryb3koKTtcclxuICAgICAgICAgICAgdGhpcy52aWV3LnJlbW92ZSgpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmFjdGl2ZUVkaXRvclxyXG4gICAgICAgICAgICAuZmlsdGVyKHogPT4gIXopXHJcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoKCkgPT4gdGhpcy52aWV3LnN0eWxlLmRpc3BsYXkgPSAnbm9uZScpKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmFjdGl2ZVByb2plY3RcclxuICAgICAgICAgICAgLmZpbHRlcih6ID0+IHouZnJhbWV3b3Jrcy5sZW5ndGggPT09IDEpXHJcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoKCkgPT4gdGhpcy52aWV3LnN0eWxlLmRpc3BsYXkgPSAnbm9uZScpKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmFjdGl2ZVByb2plY3RcclxuICAgICAgICAgICAgLnN1YnNjcmliZShwcm9qZWN0ID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMudmlldy5zdHlsZS5kaXNwbGF5ID0gJyc7XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc3Qge2ZyYW1ld29ya3MsIGFjdGl2ZUZyYW1ld29ya30gPSBwcm9qZWN0O1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wcm9qZWN0ID0gcHJvamVjdDtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2NvbXBvbmVudC5mcmFtZXdvcmtzID0gZnJhbWV3b3JrcztcclxuICAgICAgICAgICAgICAgIHRoaXMuX2NvbXBvbmVudC5hY3RpdmVGcmFtZXdvcmsgPSBhY3RpdmVGcmFtZXdvcms7XHJcbiAgICAgICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmFjdGl2ZUZyYW1ld29ya1xyXG4gICAgICAgICAgICAuc3Vic2NyaWJlKGN0eCA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnZpZXcuc3R5bGUuZGlzcGxheSA9ICcnO1xyXG5cclxuICAgICAgICAgICAgICAgIGNvbnN0IHtwcm9qZWN0LCBmcmFtZXdvcmt9ID0gY3R4O1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wcm9qZWN0ID0gcHJvamVjdDtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2NvbXBvbmVudC5mcmFtZXdvcmtzID0gcHJvamVjdC5mcmFtZXdvcmtzO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fY29tcG9uZW50LmFjdGl2ZUZyYW1ld29yayA9IGZyYW1ld29yaztcclxuICAgICAgICAgICAgfSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkaXNwb3NlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHNldEFjdGl2ZUZyYW1ld29yayhmcmFtZXdvcms6IE1vZGVscy5Eb3ROZXRGcmFtZXdvcmspIHtcclxuICAgICAgICBpZiAodGhpcy5wcm9qZWN0KSB7XHJcbiAgICAgICAgICAgIHRoaXMucHJvamVjdC5hY3RpdmVGcmFtZXdvcmsgPSBmcmFtZXdvcms7XHJcbiAgICAgICAgICAgIHRoaXMuX2NvbXBvbmVudC5hY3RpdmVGcmFtZXdvcmsgPSBmcmFtZXdvcms7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZXF1aXJlZCA9IHRydWU7XHJcbiAgICBwdWJsaWMgdGl0bGUgPSAnRnJhbWV3b3JrIFNlbGVjdG9yJztcclxuICAgIHB1YmxpYyBkZXNjcmlwdGlvbiA9ICdMZXRzIHlvdSBzZWxlY3QgdGhlIGZyYW1ld29yayB5b3VcXFwicmUgY3VycmVudGx5IHRhcmdldGluZy4nO1xyXG59XHJcblxyXG5leHBvcnQgY29uc3QgZnJhbWV3b3JrU2VsZWN0b3IgPSBuZXcgRnJhbWV3b3JrU2VsZWN0b3I7XHJcbiJdfQ==
