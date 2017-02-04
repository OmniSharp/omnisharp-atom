'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.topMenu = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _fs = require('fs');

var _path = require('path');

var _tsDisposables = require('ts-disposables');

var _omni = require('../server/omni');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Menu = function () {
    function Menu() {
        _classCallCheck(this, Menu);

        this.required = false;
        this.title = 'Show OmniSharp Menu';
        this.description = 'Shows the Omnisharp Menu at the top of the window.';
        this.default = true;
    }

    _createClass(Menu, [{
        key: 'activate',
        value: function activate() {
            var _this = this;

            this.disposable = new _tsDisposables.CompositeDisposable();
            if (!this._json) {
                var menuJsonFile = (0, _path.join)(_omni.Omni.packageDir, 'omnisharp-atom/menus/omnisharp-menu.json');
                this._json = JSON.parse((0, _fs.readFileSync)(menuJsonFile, 'utf8')).menu;
            }
            this.disposable.add(_omni.Omni.switchActiveSolution(function (solution, cd) {
                if (solution) {
                    cd.add(atom.menu.add(_this._json));
                }
            }));
        }
    }, {
        key: 'dispose',
        value: function dispose() {
            this.disposable.dispose();
        }
    }]);

    return Menu;
}();

var topMenu = exports.topMenu = new Menu();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9hdG9tL21lbnUudHMiXSwibmFtZXMiOlsiTWVudSIsInJlcXVpcmVkIiwidGl0bGUiLCJkZXNjcmlwdGlvbiIsImRlZmF1bHQiLCJkaXNwb3NhYmxlIiwiX2pzb24iLCJtZW51SnNvbkZpbGUiLCJwYWNrYWdlRGlyIiwiSlNPTiIsInBhcnNlIiwibWVudSIsImFkZCIsInN3aXRjaEFjdGl2ZVNvbHV0aW9uIiwic29sdXRpb24iLCJjZCIsImF0b20iLCJkaXNwb3NlIiwidG9wTWVudSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7SUFFQUEsSTtBQUFBLG9CQUFBO0FBQUE7O0FBc0JXLGFBQUFDLFFBQUEsR0FBVyxLQUFYO0FBQ0EsYUFBQUMsS0FBQSxHQUFRLHFCQUFSO0FBQ0EsYUFBQUMsV0FBQSxHQUFjLG9EQUFkO0FBQ0EsYUFBQUMsT0FBQSxHQUFVLElBQVY7QUFDVjs7OzttQ0F0QmtCO0FBQUE7O0FBQ1gsaUJBQUtDLFVBQUwsR0FBa0Isd0NBQWxCO0FBQ0EsZ0JBQUksQ0FBQyxLQUFLQyxLQUFWLEVBQWlCO0FBQ2Isb0JBQU1DLGVBQWUsZ0JBQUssV0FBS0MsVUFBVixFQUFzQiwwQ0FBdEIsQ0FBckI7QUFDQSxxQkFBS0YsS0FBTCxHQUFhRyxLQUFLQyxLQUFMLENBQVcsc0JBQWFILFlBQWIsRUFBMkIsTUFBM0IsQ0FBWCxFQUErQ0ksSUFBNUQ7QUFDSDtBQUVELGlCQUFLTixVQUFMLENBQWdCTyxHQUFoQixDQUFvQixXQUFLQyxvQkFBTCxDQUEwQixVQUFDQyxRQUFELEVBQVdDLEVBQVgsRUFBYTtBQUN2RCxvQkFBSUQsUUFBSixFQUFjO0FBQ1ZDLHVCQUFHSCxHQUFILENBQU9JLEtBQUtMLElBQUwsQ0FBVUMsR0FBVixDQUFtQixNQUFLTixLQUF4QixDQUFQO0FBQ0g7QUFDSixhQUptQixDQUFwQjtBQUtIOzs7a0NBRWE7QUFDVixpQkFBS0QsVUFBTCxDQUFnQlksT0FBaEI7QUFDSDs7Ozs7O0FBUUUsSUFBTUMsNEJBQVUsSUFBSWxCLElBQUosRUFBaEIiLCJmaWxlIjoibGliL2F0b20vbWVudS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7cmVhZEZpbGVTeW5jfSBmcm9tICdmcyc7XHJcbmltcG9ydCB7am9pbn0gZnJvbSAncGF0aCc7XHJcbmltcG9ydCB7Q29tcG9zaXRlRGlzcG9zYWJsZX0gZnJvbSAndHMtZGlzcG9zYWJsZXMnO1xyXG5pbXBvcnQge09tbml9IGZyb20gJy4uL3NlcnZlci9vbW5pJztcclxuXHJcbmNsYXNzIE1lbnUgaW1wbGVtZW50cyBJRmVhdHVyZSB7XHJcbiAgICBwcml2YXRlIGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XHJcbiAgICBwcml2YXRlIF9qc29uOiBzdHJpbmc7XHJcblxyXG4gICAgcHVibGljIGFjdGl2YXRlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcbiAgICAgICAgaWYgKCF0aGlzLl9qc29uKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IG1lbnVKc29uRmlsZSA9IGpvaW4oT21uaS5wYWNrYWdlRGlyLCAnb21uaXNoYXJwLWF0b20vbWVudXMvb21uaXNoYXJwLW1lbnUuanNvbicpO1xyXG4gICAgICAgICAgICB0aGlzLl9qc29uID0gSlNPTi5wYXJzZShyZWFkRmlsZVN5bmMobWVudUpzb25GaWxlLCAndXRmOCcpKS5tZW51O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLnN3aXRjaEFjdGl2ZVNvbHV0aW9uKChzb2x1dGlvbiwgY2QpID0+IHtcclxuICAgICAgICAgICAgaWYgKHNvbHV0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICBjZC5hZGQoYXRvbS5tZW51LmFkZCg8YW55PnRoaXMuX2pzb24pKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGlzcG9zZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZXF1aXJlZCA9IGZhbHNlO1xyXG4gICAgcHVibGljIHRpdGxlID0gJ1Nob3cgT21uaVNoYXJwIE1lbnUnO1xyXG4gICAgcHVibGljIGRlc2NyaXB0aW9uID0gJ1Nob3dzIHRoZSBPbW5pc2hhcnAgTWVudSBhdCB0aGUgdG9wIG9mIHRoZSB3aW5kb3cuJztcclxuICAgIHB1YmxpYyBkZWZhdWx0ID0gdHJ1ZTtcclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IHRvcE1lbnUgPSBuZXcgTWVudSgpO1xyXG4iXX0=
