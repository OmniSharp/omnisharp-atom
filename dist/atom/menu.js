"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.topMenu = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _tsDisposables = require("ts-disposables");

var _omni = require("../server/omni");

var _fs = require("fs");

var _path = require("path");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Menu = function () {
    function Menu() {
        _classCallCheck(this, Menu);

        this.required = false;
        this.title = "Show OmniSharp Menu";
        this.description = "Shows the Omnisharp Menu at the top of the window.";
        this.default = true;
    }

    _createClass(Menu, [{
        key: "activate",
        value: function activate() {
            var _this = this;

            this.disposable = new _tsDisposables.CompositeDisposable();
            if (!this._json) {
                var menuJsonFile = (0, _path.join)(_omni.Omni.packageDir, "omnisharp-atom/menus/omnisharp-menu.json");
                this._json = JSON.parse((0, _fs.readFileSync)(menuJsonFile, "utf8")).menu;
            }
            this.disposable.add(_omni.Omni.switchActiveSolution(function (solution, cd) {
                if (solution) {
                    cd.add(atom.menu.add(_this._json));
                }
            }));
        }
    }, {
        key: "dispose",
        value: function dispose() {
            this.disposable.dispose();
        }
    }]);

    return Menu;
}();

var topMenu = exports.topMenu = new Menu();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9hdG9tL21lbnUuanMiLCJsaWIvYXRvbS9tZW51LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQUNBOztBQUNBOztBQUNBOzs7O0lDRUE7QUFBQSxvQkFBQTs7O0FBc0JXLGFBQUEsUUFBQSxHQUFXLEtBQVgsQ0F0Qlg7QUF1QlcsYUFBQSxLQUFBLEdBQVEscUJBQVIsQ0F2Qlg7QUF3QlcsYUFBQSxXQUFBLEdBQWMsb0RBQWQsQ0F4Qlg7QUF5QlcsYUFBQSxPQUFBLEdBQVUsSUFBVixDQXpCWDtLQUFBOzs7O21DQUltQjs7O0FBQ1gsaUJBQUssVUFBTCxHQUFrQix3Q0FBbEIsQ0FEVztBQUVYLGdCQUFJLENBQUMsS0FBSyxLQUFMLEVBQVk7QUFDYixvQkFBTSxlQUFlLGdCQUFLLFdBQUssVUFBTCxFQUFpQiwwQ0FBdEIsQ0FBZixDQURPO0FBRWIscUJBQUssS0FBTCxHQUFhLEtBQUssS0FBTCxDQUFXLHNCQUFhLFlBQWIsRUFBMkIsTUFBM0IsQ0FBWCxFQUErQyxJQUEvQyxDQUZBO2FBQWpCO0FBS0EsaUJBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQixXQUFLLG9CQUFMLENBQTBCLFVBQUMsUUFBRCxFQUFXLEVBQVgsRUFBYTtBQUN2RCxvQkFBSSxRQUFKLEVBQWM7QUFDVix1QkFBRyxHQUFILENBQU8sS0FBSyxJQUFMLENBQVUsR0FBVixDQUFtQixNQUFLLEtBQUwsQ0FBMUIsRUFEVTtpQkFBZDthQUQwQyxDQUE5QyxFQVBXOzs7O2tDQWNEO0FBQ1YsaUJBQUssVUFBTCxDQUFnQixPQUFoQixHQURVOzs7Ozs7O0FBVVgsSUFBTSw0QkFBVSxJQUFJLElBQUosRUFBViIsImZpbGUiOiJsaWIvYXRvbS9tZW51LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSB9IGZyb20gXCJ0cy1kaXNwb3NhYmxlc1wiO1xuaW1wb3J0IHsgT21uaSB9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xuaW1wb3J0IHsgcmVhZEZpbGVTeW5jIH0gZnJvbSBcImZzXCI7XG5pbXBvcnQgeyBqb2luIH0gZnJvbSBcInBhdGhcIjtcbmNsYXNzIE1lbnUge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLnJlcXVpcmVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMudGl0bGUgPSBcIlNob3cgT21uaVNoYXJwIE1lbnVcIjtcbiAgICAgICAgdGhpcy5kZXNjcmlwdGlvbiA9IFwiU2hvd3MgdGhlIE9tbmlzaGFycCBNZW51IGF0IHRoZSB0b3Agb2YgdGhlIHdpbmRvdy5cIjtcbiAgICAgICAgdGhpcy5kZWZhdWx0ID0gdHJ1ZTtcbiAgICB9XG4gICAgYWN0aXZhdGUoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIGlmICghdGhpcy5fanNvbikge1xuICAgICAgICAgICAgY29uc3QgbWVudUpzb25GaWxlID0gam9pbihPbW5pLnBhY2thZ2VEaXIsIFwib21uaXNoYXJwLWF0b20vbWVudXMvb21uaXNoYXJwLW1lbnUuanNvblwiKTtcbiAgICAgICAgICAgIHRoaXMuX2pzb24gPSBKU09OLnBhcnNlKHJlYWRGaWxlU3luYyhtZW51SnNvbkZpbGUsIFwidXRmOFwiKSkubWVudTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuc3dpdGNoQWN0aXZlU29sdXRpb24oKHNvbHV0aW9uLCBjZCkgPT4ge1xuICAgICAgICAgICAgaWYgKHNvbHV0aW9uKSB7XG4gICAgICAgICAgICAgICAgY2QuYWRkKGF0b20ubWVudS5hZGQodGhpcy5fanNvbikpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KSk7XG4gICAgfVxuICAgIGRpc3Bvc2UoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfVxufVxuZXhwb3J0IGNvbnN0IHRvcE1lbnUgPSBuZXcgTWVudSgpO1xuIiwiaW1wb3J0IHtDb21wb3NpdGVEaXNwb3NhYmxlfSBmcm9tIFwidHMtZGlzcG9zYWJsZXNcIjtcclxuaW1wb3J0IHtPbW5pfSBmcm9tIFwiLi4vc2VydmVyL29tbmlcIjtcclxuaW1wb3J0IHtyZWFkRmlsZVN5bmN9IGZyb20gXCJmc1wiO1xyXG5pbXBvcnQge2pvaW59IGZyb20gXCJwYXRoXCI7XHJcblxyXG5jbGFzcyBNZW51IGltcGxlbWVudHMgSUZlYXR1cmUge1xyXG4gICAgcHJpdmF0ZSBkaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xyXG4gICAgcHJpdmF0ZSBfanNvbjogc3RyaW5nO1xyXG5cclxuICAgIHB1YmxpYyBhY3RpdmF0ZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG4gICAgICAgIGlmICghdGhpcy5fanNvbikge1xyXG4gICAgICAgICAgICBjb25zdCBtZW51SnNvbkZpbGUgPSBqb2luKE9tbmkucGFja2FnZURpciwgXCJvbW5pc2hhcnAtYXRvbS9tZW51cy9vbW5pc2hhcnAtbWVudS5qc29uXCIpO1xyXG4gICAgICAgICAgICB0aGlzLl9qc29uID0gSlNPTi5wYXJzZShyZWFkRmlsZVN5bmMobWVudUpzb25GaWxlLCBcInV0ZjhcIikpLm1lbnU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuc3dpdGNoQWN0aXZlU29sdXRpb24oKHNvbHV0aW9uLCBjZCkgPT4ge1xyXG4gICAgICAgICAgICBpZiAoc29sdXRpb24pIHtcclxuICAgICAgICAgICAgICAgIGNkLmFkZChhdG9tLm1lbnUuYWRkKDxhbnk+dGhpcy5fanNvbikpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkaXNwb3NlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlcXVpcmVkID0gZmFsc2U7XHJcbiAgICBwdWJsaWMgdGl0bGUgPSBcIlNob3cgT21uaVNoYXJwIE1lbnVcIjtcclxuICAgIHB1YmxpYyBkZXNjcmlwdGlvbiA9IFwiU2hvd3MgdGhlIE9tbmlzaGFycCBNZW51IGF0IHRoZSB0b3Agb2YgdGhlIHdpbmRvdy5cIjtcclxuICAgIHB1YmxpYyBkZWZhdWx0ID0gdHJ1ZTtcclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IHRvcE1lbnUgPSBuZXcgTWVudSgpO1xyXG4iXX0=
