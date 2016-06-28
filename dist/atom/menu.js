"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.topMenu = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _omnisharpClient = require("omnisharp-client");

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

            this.disposable = new _omnisharpClient.CompositeDisposable();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9hdG9tL21lbnUuanMiLCJsaWIvYXRvbS9tZW51LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQUNBOztBQUNBOztBQUNBOzs7O0lDRUE7QUFBQSxvQkFBQTs7O0FBc0JXLGFBQUEsUUFBQSxHQUFXLEtBQVgsQ0F0Qlg7QUF1QlcsYUFBQSxLQUFBLEdBQVEscUJBQVIsQ0F2Qlg7QUF3QlcsYUFBQSxXQUFBLEdBQWMsb0RBQWQsQ0F4Qlg7QUF5QlcsYUFBQSxPQUFBLEdBQVUsSUFBVixDQXpCWDtLQUFBOzs7O21DQUltQjs7O0FBQ1gsaUJBQUssVUFBTCxHQUFrQiwwQ0FBbEIsQ0FEVztBQUVYLGdCQUFJLENBQUMsS0FBSyxLQUFMLEVBQVk7QUFDYixvQkFBTSxlQUFlLGdCQUFLLFdBQUssVUFBTCxFQUFpQiwwQ0FBdEIsQ0FBZixDQURPO0FBRWIscUJBQUssS0FBTCxHQUFhLEtBQUssS0FBTCxDQUFXLHNCQUFhLFlBQWIsRUFBMkIsTUFBM0IsQ0FBWCxFQUErQyxJQUEvQyxDQUZBO2FBQWpCO0FBS0EsaUJBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQixXQUFLLG9CQUFMLENBQTBCLFVBQUMsUUFBRCxFQUFXLEVBQVgsRUFBYTtBQUN2RCxvQkFBSSxRQUFKLEVBQWM7QUFDVix1QkFBRyxHQUFILENBQU8sS0FBSyxJQUFMLENBQVUsR0FBVixDQUFtQixNQUFLLEtBQUwsQ0FBMUIsRUFEVTtpQkFBZDthQUQwQyxDQUE5QyxFQVBXOzs7O2tDQWNEO0FBQ1YsaUJBQUssVUFBTCxDQUFnQixPQUFoQixHQURVOzs7Ozs7O0FBVVgsSUFBTSw0QkFBVSxJQUFJLElBQUosRUFBViIsImZpbGUiOiJsaWIvYXRvbS9tZW51LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSB9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XG5pbXBvcnQgeyBPbW5pIH0gZnJvbSBcIi4uL3NlcnZlci9vbW5pXCI7XG5pbXBvcnQgeyByZWFkRmlsZVN5bmMgfSBmcm9tIFwiZnNcIjtcbmltcG9ydCB7IGpvaW4gfSBmcm9tIFwicGF0aFwiO1xuY2xhc3MgTWVudSB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMucmVxdWlyZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy50aXRsZSA9IFwiU2hvdyBPbW5pU2hhcnAgTWVudVwiO1xuICAgICAgICB0aGlzLmRlc2NyaXB0aW9uID0gXCJTaG93cyB0aGUgT21uaXNoYXJwIE1lbnUgYXQgdGhlIHRvcCBvZiB0aGUgd2luZG93LlwiO1xuICAgICAgICB0aGlzLmRlZmF1bHQgPSB0cnVlO1xuICAgIH1cbiAgICBhY3RpdmF0ZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgaWYgKCF0aGlzLl9qc29uKSB7XG4gICAgICAgICAgICBjb25zdCBtZW51SnNvbkZpbGUgPSBqb2luKE9tbmkucGFja2FnZURpciwgXCJvbW5pc2hhcnAtYXRvbS9tZW51cy9vbW5pc2hhcnAtbWVudS5qc29uXCIpO1xuICAgICAgICAgICAgdGhpcy5fanNvbiA9IEpTT04ucGFyc2UocmVhZEZpbGVTeW5jKG1lbnVKc29uRmlsZSwgXCJ1dGY4XCIpKS5tZW51O1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5zd2l0Y2hBY3RpdmVTb2x1dGlvbigoc29sdXRpb24sIGNkKSA9PiB7XG4gICAgICAgICAgICBpZiAoc29sdXRpb24pIHtcbiAgICAgICAgICAgICAgICBjZC5hZGQoYXRvbS5tZW51LmFkZCh0aGlzLl9qc29uKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pKTtcbiAgICB9XG4gICAgZGlzcG9zZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICB9XG59XG5leHBvcnQgY29uc3QgdG9wTWVudSA9IG5ldyBNZW51KCk7XG4iLCJpbXBvcnQge0NvbXBvc2l0ZURpc3Bvc2FibGV9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XHJcbmltcG9ydCB7T21uaX0gZnJvbSBcIi4uL3NlcnZlci9vbW5pXCI7XHJcbmltcG9ydCB7cmVhZEZpbGVTeW5jfSBmcm9tIFwiZnNcIjtcclxuaW1wb3J0IHtqb2lufSBmcm9tIFwicGF0aFwiO1xyXG5cclxuY2xhc3MgTWVudSBpbXBsZW1lbnRzIElGZWF0dXJlIHtcclxuICAgIHByaXZhdGUgZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxuICAgIHByaXZhdGUgX2pzb246IHN0cmluZztcclxuXHJcbiAgICBwdWJsaWMgYWN0aXZhdGUoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgICAgICBpZiAoIXRoaXMuX2pzb24pIHtcclxuICAgICAgICAgICAgY29uc3QgbWVudUpzb25GaWxlID0gam9pbihPbW5pLnBhY2thZ2VEaXIsIFwib21uaXNoYXJwLWF0b20vbWVudXMvb21uaXNoYXJwLW1lbnUuanNvblwiKTtcclxuICAgICAgICAgICAgdGhpcy5fanNvbiA9IEpTT04ucGFyc2UocmVhZEZpbGVTeW5jKG1lbnVKc29uRmlsZSwgXCJ1dGY4XCIpKS5tZW51O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLnN3aXRjaEFjdGl2ZVNvbHV0aW9uKChzb2x1dGlvbiwgY2QpID0+IHtcclxuICAgICAgICAgICAgaWYgKHNvbHV0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICBjZC5hZGQoYXRvbS5tZW51LmFkZCg8YW55PnRoaXMuX2pzb24pKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGlzcG9zZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZXF1aXJlZCA9IGZhbHNlO1xyXG4gICAgcHVibGljIHRpdGxlID0gXCJTaG93IE9tbmlTaGFycCBNZW51XCI7XHJcbiAgICBwdWJsaWMgZGVzY3JpcHRpb24gPSBcIlNob3dzIHRoZSBPbW5pc2hhcnAgTWVudSBhdCB0aGUgdG9wIG9mIHRoZSB3aW5kb3cuXCI7XHJcbiAgICBwdWJsaWMgZGVmYXVsdCA9IHRydWU7XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCB0b3BNZW51ID0gbmV3IE1lbnUoKTtcclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
