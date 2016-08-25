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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9hdG9tL21lbnUuanMiLCJsaWIvYXRvbS9tZW51LnRzIl0sIm5hbWVzIjpbIk1lbnUiLCJyZXF1aXJlZCIsInRpdGxlIiwiZGVzY3JpcHRpb24iLCJkZWZhdWx0IiwiZGlzcG9zYWJsZSIsIl9qc29uIiwibWVudUpzb25GaWxlIiwicGFja2FnZURpciIsIkpTT04iLCJwYXJzZSIsIm1lbnUiLCJhZGQiLCJzd2l0Y2hBY3RpdmVTb2x1dGlvbiIsInNvbHV0aW9uIiwiY2QiLCJhdG9tIiwiZGlzcG9zZSIsInRvcE1lbnUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQUNBOztBQUNBOztBQUNBOzs7O0lDRUFBLEk7QUFBQSxvQkFBQTtBQUFBOztBQXNCVyxhQUFBQyxRQUFBLEdBQVcsS0FBWDtBQUNBLGFBQUFDLEtBQUEsR0FBUSxxQkFBUjtBQUNBLGFBQUFDLFdBQUEsR0FBYyxvREFBZDtBQUNBLGFBQUFDLE9BQUEsR0FBVSxJQUFWO0FBQ1Y7Ozs7bUNBdEJrQjtBQUFBOztBQUNYLGlCQUFLQyxVQUFMLEdBQWtCLHdDQUFsQjtBQUNBLGdCQUFJLENBQUMsS0FBS0MsS0FBVixFQUFpQjtBQUNiLG9CQUFNQyxlQUFlLGdCQUFLLFdBQUtDLFVBQVYsRUFBc0IsMENBQXRCLENBQXJCO0FBQ0EscUJBQUtGLEtBQUwsR0FBYUcsS0FBS0MsS0FBTCxDQUFXLHNCQUFhSCxZQUFiLEVBQTJCLE1BQTNCLENBQVgsRUFBK0NJLElBQTVEO0FBQ0g7QUFFRCxpQkFBS04sVUFBTCxDQUFnQk8sR0FBaEIsQ0FBb0IsV0FBS0Msb0JBQUwsQ0FBMEIsVUFBQ0MsUUFBRCxFQUFXQyxFQUFYLEVBQWE7QUFDdkQsb0JBQUlELFFBQUosRUFBYztBQUNWQyx1QkFBR0gsR0FBSCxDQUFPSSxLQUFLTCxJQUFMLENBQVVDLEdBQVYsQ0FBbUIsTUFBS04sS0FBeEIsQ0FBUDtBQUNIO0FBQ0osYUFKbUIsQ0FBcEI7QUFLSDs7O2tDQUVhO0FBQ1YsaUJBQUtELFVBQUwsQ0FBZ0JZLE9BQWhCO0FBQ0g7Ozs7OztBQVFFLElBQU1DLDRCQUFVLElBQUlsQixJQUFKLEVBQWhCIiwiZmlsZSI6ImxpYi9hdG9tL21lbnUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlIH0gZnJvbSBcInRzLWRpc3Bvc2FibGVzXCI7XG5pbXBvcnQgeyBPbW5pIH0gZnJvbSBcIi4uL3NlcnZlci9vbW5pXCI7XG5pbXBvcnQgeyByZWFkRmlsZVN5bmMgfSBmcm9tIFwiZnNcIjtcbmltcG9ydCB7IGpvaW4gfSBmcm9tIFwicGF0aFwiO1xuY2xhc3MgTWVudSB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMucmVxdWlyZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy50aXRsZSA9IFwiU2hvdyBPbW5pU2hhcnAgTWVudVwiO1xuICAgICAgICB0aGlzLmRlc2NyaXB0aW9uID0gXCJTaG93cyB0aGUgT21uaXNoYXJwIE1lbnUgYXQgdGhlIHRvcCBvZiB0aGUgd2luZG93LlwiO1xuICAgICAgICB0aGlzLmRlZmF1bHQgPSB0cnVlO1xuICAgIH1cbiAgICBhY3RpdmF0ZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgaWYgKCF0aGlzLl9qc29uKSB7XG4gICAgICAgICAgICBjb25zdCBtZW51SnNvbkZpbGUgPSBqb2luKE9tbmkucGFja2FnZURpciwgXCJvbW5pc2hhcnAtYXRvbS9tZW51cy9vbW5pc2hhcnAtbWVudS5qc29uXCIpO1xuICAgICAgICAgICAgdGhpcy5fanNvbiA9IEpTT04ucGFyc2UocmVhZEZpbGVTeW5jKG1lbnVKc29uRmlsZSwgXCJ1dGY4XCIpKS5tZW51O1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5zd2l0Y2hBY3RpdmVTb2x1dGlvbigoc29sdXRpb24sIGNkKSA9PiB7XG4gICAgICAgICAgICBpZiAoc29sdXRpb24pIHtcbiAgICAgICAgICAgICAgICBjZC5hZGQoYXRvbS5tZW51LmFkZCh0aGlzLl9qc29uKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pKTtcbiAgICB9XG4gICAgZGlzcG9zZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICB9XG59XG5leHBvcnQgY29uc3QgdG9wTWVudSA9IG5ldyBNZW51KCk7XG4iLCJpbXBvcnQge0NvbXBvc2l0ZURpc3Bvc2FibGV9IGZyb20gXCJ0cy1kaXNwb3NhYmxlc1wiO1xyXG5pbXBvcnQge09tbml9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xyXG5pbXBvcnQge3JlYWRGaWxlU3luY30gZnJvbSBcImZzXCI7XHJcbmltcG9ydCB7am9pbn0gZnJvbSBcInBhdGhcIjtcclxuXHJcbmNsYXNzIE1lbnUgaW1wbGVtZW50cyBJRmVhdHVyZSB7XHJcbiAgICBwcml2YXRlIGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XHJcbiAgICBwcml2YXRlIF9qc29uOiBzdHJpbmc7XHJcblxyXG4gICAgcHVibGljIGFjdGl2YXRlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcbiAgICAgICAgaWYgKCF0aGlzLl9qc29uKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IG1lbnVKc29uRmlsZSA9IGpvaW4oT21uaS5wYWNrYWdlRGlyLCBcIm9tbmlzaGFycC1hdG9tL21lbnVzL29tbmlzaGFycC1tZW51Lmpzb25cIik7XHJcbiAgICAgICAgICAgIHRoaXMuX2pzb24gPSBKU09OLnBhcnNlKHJlYWRGaWxlU3luYyhtZW51SnNvbkZpbGUsIFwidXRmOFwiKSkubWVudTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5zd2l0Y2hBY3RpdmVTb2x1dGlvbigoc29sdXRpb24sIGNkKSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChzb2x1dGlvbikge1xyXG4gICAgICAgICAgICAgICAgY2QuYWRkKGF0b20ubWVudS5hZGQoPGFueT50aGlzLl9qc29uKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVxdWlyZWQgPSBmYWxzZTtcclxuICAgIHB1YmxpYyB0aXRsZSA9IFwiU2hvdyBPbW5pU2hhcnAgTWVudVwiO1xyXG4gICAgcHVibGljIGRlc2NyaXB0aW9uID0gXCJTaG93cyB0aGUgT21uaXNoYXJwIE1lbnUgYXQgdGhlIHRvcCBvZiB0aGUgd2luZG93LlwiO1xyXG4gICAgcHVibGljIGRlZmF1bHQgPSB0cnVlO1xyXG59XHJcblxyXG5leHBvcnQgY29uc3QgdG9wTWVudSA9IG5ldyBNZW51KCk7XHJcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
