"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.notificationHandler = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _omni = require("../server/omni");

var _tsDisposables = require("ts-disposables");

var _path = require("path");

var path = _interopRequireWildcard(_path);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var $ = require("jquery");

var NotificationHandler = function () {
    function NotificationHandler() {
        _classCallCheck(this, NotificationHandler);

        this.required = true;
        this.title = "Package Restore Notifications";
        this.description = "Adds support to show package restore progress, when the server initiates a restore operation.";
    }

    _createClass(NotificationHandler, [{
        key: "activate",
        value: function activate() {
            var _this = this;

            this.disposable = new _tsDisposables.CompositeDisposable();
            this.packageRestoreNotification = new PackageRestoreNotification();
            this.disposable.add(_omni.Omni.listener.packageRestoreStarted.subscribe(function (e) {
                return _this.packageRestoreNotification.handlePackageRestoreStarted(e);
            }));
            this.disposable.add(_omni.Omni.listener.packageRestoreFinished.subscribe(function (e) {
                return _this.packageRestoreNotification.handlePackageRestoreFinished(e);
            }));
            this.disposable.add(_omni.Omni.listener.unresolvedDependencies.subscribe(function (e) {
                return _this.packageRestoreNotification.handleUnresolvedDependencies(e);
            }));
            this.disposable.add(_omni.Omni.listener.events.filter(function (z) {
                return z.Event === "log";
            }).filter(function (z) {
                return _lodash2.default.includes(z.Body.Name, "PackagesRestoreTool");
            }).filter(function (z) {
                return z.Body.Message.startsWith("Installing");
            }).subscribe(function (e) {
                return _this.packageRestoreNotification.handleEvents(e);
            }));
        }
    }, {
        key: "dispose",
        value: function dispose() {
            this.disposable.dispose();
        }
    }]);

    return NotificationHandler;
}();

var PackageRestoreNotification = function () {
    function PackageRestoreNotification() {
        var _this2 = this;

        _classCallCheck(this, PackageRestoreNotification);

        this.handlePackageRestoreStarted = function (event) {
            _this2.packageRestoreStarted++;
            if (_this2.notification.isDismissed()) {
                _this2.notification.show("Package restore started", "Starting..");
            }
        };
        this.handleUnresolvedDependencies = function (event) {
            if (_this2.notification.isDismissed()) {
                _this2.notification.show("Package restore started", "Starting..");
            }
            if (event.FileName) {
                (function () {
                    var projectName = _this2.findProjectNameFromFileName(event.FileName);
                    if (!_lodash2.default.some(_this2.knownProjects, function (knownProject) {
                        return knownProject === projectName;
                    })) {
                        _this2.knownProjects.push(projectName);
                        _this2.notification.addDetail("Unresolved dependencies for " + projectName + ":", true);
                        if (event.UnresolvedDependencies) {
                            event.UnresolvedDependencies.forEach(function (dep) {
                                _this2.notification.addDetail(" - " + dep.Name + " " + dep.Version);
                            });
                        }
                    }
                })();
            }
        };
        this.handlePackageRestoreFinished = function (event) {
            _this2.packageRestoreFinished++;
            if (_this2.packageRestoreStarted === _this2.packageRestoreFinished) {
                _this2.notification.setSuccessfulAndDismiss("Package restore finished.");
                _this2.packageRestoreStarted = 0;
                _this2.packageRestoreFinished = 0;
                _this2.knownProjects = [];
            }
        };
        this.handleEvents = function (event) {
            _this2.setPackageInstalled(event.Body.Message);
        };
        this.notification = new OmniNotification();
        this.packageRestoreStarted = 0;
        this.packageRestoreFinished = 0;
        this.knownProjects = [];
    }

    _createClass(PackageRestoreNotification, [{
        key: "findProjectNameFromFileName",
        value: function findProjectNameFromFileName(fileName) {
            var split = fileName.split(path.sep);
            var projectName = split[split.length - 2];
            return projectName;
        }
    }, {
        key: "setPackageInstalled",
        value: function setPackageInstalled(message) {
            var match = message.match(/Installing ([a-zA-Z.]*) ([\D?\d?.?-?]*)/);
            var detailLines = this.notification.getDetailElement().children(".line");
            if (!match || match.length < 3) return;
            _lodash2.default.forEach(detailLines, function (line) {
                if (line.textContent.startsWith(" - " + match[1] + " ")) {
                    line.textContent = "Installed " + match[1] + " " + match[2];
                }
            });
        }
    }]);

    return PackageRestoreNotification;
}();

var OmniNotification = function () {
    function OmniNotification() {
        _classCallCheck(this, OmniNotification);

        this.dismissed = true;
    }

    _createClass(OmniNotification, [{
        key: "addDetail",
        value: function addDetail(detail, newline) {
            var details = this.getDetailElement();
            if (!detail) return;
            if (newline) details.append("<br />");
            details.append("<div class=\"line\">" + detail + "</div>");
        }
    }, {
        key: "show",
        value: function show(message, detail) {
            var _this3 = this;

            this.atomNotification = atom.notifications.addInfo(message, { detail: detail, dismissable: true });
            this.dismissed = false;
            this.atomNotification.onDidDismiss(function (notification) {
                _this3.dismissed = true;
                _this3.isBeingDismissed = false;
            });
        }
    }, {
        key: "setSuccessfulAndDismiss",
        value: function setSuccessfulAndDismiss(message) {
            var _this4 = this;

            if (this.isBeingDismissed) return;
            this.addDetail(message, true);
            var domNotification = $(atom.views.getView(this.atomNotification));
            domNotification.removeClass("info");
            domNotification.removeClass("icon-info");
            domNotification.addClass("success");
            domNotification.addClass("icon-check");
            this.isBeingDismissed = true;
            setTimeout(function () {
                _this4.dismiss();
            }, 2000);
        }
    }, {
        key: "isDismissed",
        value: function isDismissed() {
            return this.dismissed;
        }
    }, {
        key: "dismiss",
        value: function dismiss() {
            this.atomNotification.dismiss();
        }
    }, {
        key: "getDetailElement",
        value: function getDetailElement() {
            return this.getFromDom($(atom.views.getView(this.atomNotification)), ".content .detail .detail-content");
        }
    }, {
        key: "getFromDom",
        value: function getFromDom(element, selector) {
            var el = element[0];
            if (!el) return;
            var found = el.querySelectorAll(selector);
            return $(found[0]);
        }
    }]);

    return OmniNotification;
}();

var notificationHandler = exports.notificationHandler = new NotificationHandler();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9ub3RpZmljYXRpb24taGFuZGxlci5qcyIsImxpYi9mZWF0dXJlcy9ub3RpZmljYXRpb24taGFuZGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7OztBQUNBOztBQUNBOztBQUNBOztJQ0NZOzs7Ozs7OztBQUNaLElBQU0sSUFBa0IsUUFBUSxRQUFSLENBQWxCOztJQUVOO0FBQUEsbUNBQUE7OztBQTZCVyxhQUFBLFFBQUEsR0FBVyxJQUFYLENBN0JYO0FBOEJXLGFBQUEsS0FBQSxHQUFRLCtCQUFSLENBOUJYO0FBK0JXLGFBQUEsV0FBQSxHQUFjLCtGQUFkLENBL0JYO0tBQUE7Ozs7bUNBSW1COzs7QUFDWCxpQkFBSyxVQUFMLEdBQWtCLHdDQUFsQixDQURXO0FBR1gsaUJBQUssMEJBQUwsR0FBa0MsSUFBSSwwQkFBSixFQUFsQyxDQUhXO0FBS1gsaUJBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQixXQUFLLFFBQUwsQ0FBYyxxQkFBZCxDQUFvQyxTQUFwQyxDQUE4Qzt1QkFDOUQsTUFBSywwQkFBTCxDQUFnQywyQkFBaEMsQ0FBNEQsQ0FBNUQ7YUFEOEQsQ0FBbEUsRUFMVztBQVFYLGlCQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsV0FBSyxRQUFMLENBQWMsc0JBQWQsQ0FBcUMsU0FBckMsQ0FBK0M7dUJBQy9ELE1BQUssMEJBQUwsQ0FBZ0MsNEJBQWhDLENBQTZELENBQTdEO2FBRCtELENBQW5FLEVBUlc7QUFXWCxpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLFdBQUssUUFBTCxDQUFjLHNCQUFkLENBQXFDLFNBQXJDLENBQStDO3VCQUMvRCxNQUFLLDBCQUFMLENBQWdDLDRCQUFoQyxDQUE2RCxDQUE3RDthQUQrRCxDQUFuRSxFQVhXO0FBY1gsaUJBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQixXQUFLLFFBQUwsQ0FBYyxNQUFkLENBQ2YsTUFEZSxDQUNSO3VCQUFLLEVBQUUsS0FBRixLQUFZLEtBQVo7YUFBTCxDQURRLENBRWYsTUFGZSxDQUVSO3VCQUFLLGlCQUFFLFFBQUYsQ0FBVyxFQUFFLElBQUYsQ0FBTyxJQUFQLEVBQWEscUJBQXhCO2FBQUwsQ0FGUSxDQUdmLE1BSGUsQ0FHUjt1QkFBSyxFQUFFLElBQUYsQ0FBTyxPQUFQLENBQWUsVUFBZixDQUEwQixZQUExQjthQUFMLENBSFEsQ0FJZixTQUplLENBSUw7dUJBQUssTUFBSywwQkFBTCxDQUFnQyxZQUFoQyxDQUE2QyxDQUE3QzthQUFMLENBSmYsRUFkVzs7OztrQ0FxQkQ7QUFDVixpQkFBSyxVQUFMLENBQWdCLE9BQWhCLEdBRFU7Ozs7Ozs7SUFTbEI7QUFDSSwwQ0FBQTs7Ozs7QUFZTyxhQUFBLDJCQUFBLEdBQThCLFVBQUMsS0FBRCxFQUFvQztBQUVyRSxtQkFBSyxxQkFBTCxHQUZxRTtBQUdyRSxnQkFBSSxPQUFLLFlBQUwsQ0FBa0IsV0FBbEIsRUFBSixFQUFxQztBQUNqQyx1QkFBSyxZQUFMLENBQWtCLElBQWxCLENBQXVCLHlCQUF2QixFQUFrRCxZQUFsRCxFQURpQzthQUFyQztTQUhpQyxDQVpyQztBQW9CTyxhQUFBLDRCQUFBLEdBQStCLFVBQUMsS0FBRCxFQUE0QztBQUU5RSxnQkFBSSxPQUFLLFlBQUwsQ0FBa0IsV0FBbEIsRUFBSixFQUFxQztBQUNqQyx1QkFBSyxZQUFMLENBQWtCLElBQWxCLENBQXVCLHlCQUF2QixFQUFrRCxZQUFsRCxFQURpQzthQUFyQztBQUlBLGdCQUFJLE1BQU0sUUFBTixFQUFnQjs7QUFDaEIsd0JBQU0sY0FBYyxPQUFLLDJCQUFMLENBQWlDLE1BQU0sUUFBTixDQUEvQztBQUdOLHdCQUFJLENBQUMsaUJBQUUsSUFBRixDQUFPLE9BQUssYUFBTCxFQUFvQixVQUFDLFlBQUQsRUFBYTtBQUFPLCtCQUFPLGlCQUFpQixXQUFqQixDQUFkO3FCQUFiLENBQTVCLEVBQXlGO0FBQ3pGLCtCQUFLLGFBQUwsQ0FBbUIsSUFBbkIsQ0FBd0IsV0FBeEIsRUFEeUY7QUFFekYsK0JBQUssWUFBTCxDQUFrQixTQUFsQixrQ0FBMkQsaUJBQTNELEVBQTJFLElBQTNFLEVBRnlGO0FBR3pGLDRCQUFJLE1BQU0sc0JBQU4sRUFBOEI7QUFDOUIsa0NBQU0sc0JBQU4sQ0FBNkIsT0FBN0IsQ0FBcUMsZUFBRztBQUNwQyx1Q0FBSyxZQUFMLENBQWtCLFNBQWxCLFNBQWtDLElBQUksSUFBSixTQUFZLElBQUksT0FBSixDQUE5QyxDQURvQzs2QkFBSCxDQUFyQyxDQUQ4Qjt5QkFBbEM7cUJBSEo7cUJBSmdCO2FBQXBCO1NBTmtDLENBcEJ0QztBQTBDTyxhQUFBLDRCQUFBLEdBQStCLFVBQUMsS0FBRCxFQUFvQztBQUV0RSxtQkFBSyxzQkFBTCxHQUZzRTtBQUd0RSxnQkFBSSxPQUFLLHFCQUFMLEtBQStCLE9BQUssc0JBQUwsRUFBNkI7QUFDNUQsdUJBQUssWUFBTCxDQUFrQix1QkFBbEIsQ0FBMEMsMkJBQTFDLEVBRDREO0FBRTVELHVCQUFLLHFCQUFMLEdBQTZCLENBQTdCLENBRjREO0FBRzVELHVCQUFLLHNCQUFMLEdBQThCLENBQTlCLENBSDREO0FBSTVELHVCQUFLLGFBQUwsR0FBcUIsRUFBckIsQ0FKNEQ7YUFBaEU7U0FIa0MsQ0ExQ3RDO0FBcURPLGFBQUEsWUFBQSxHQUFlLFVBQUMsS0FBRCxFQUFrQztBQUNwRCxtQkFBSyxtQkFBTCxDQUF5QixNQUFNLElBQU4sQ0FBVyxPQUFYLENBQXpCLENBRG9EO1NBQWxDLENBckR0QjtBQUNJLGFBQUssWUFBTCxHQUFvQixJQUFJLGdCQUFKLEVBQXBCLENBREo7QUFFSSxhQUFLLHFCQUFMLEdBQTZCLENBQTdCLENBRko7QUFHSSxhQUFLLHNCQUFMLEdBQThCLENBQTlCLENBSEo7QUFJSSxhQUFLLGFBQUwsR0FBcUIsRUFBckIsQ0FKSjtLQUFBOzs7O29EQXlEb0MsVUFBZ0I7QUFDaEQsZ0JBQU0sUUFBUSxTQUFTLEtBQVQsQ0FBZSxLQUFLLEdBQUwsQ0FBdkIsQ0FEMEM7QUFFaEQsZ0JBQU0sY0FBYyxNQUFNLE1BQU0sTUFBTixHQUFlLENBQWYsQ0FBcEIsQ0FGMEM7QUFHaEQsbUJBQU8sV0FBUCxDQUhnRDs7Ozs0Q0FNeEIsU0FBZTtBQUN2QyxnQkFBTSxRQUFRLFFBQVEsS0FBUixDQUFjLHlDQUFkLENBQVIsQ0FEaUM7QUFFdkMsZ0JBQU0sY0FBYyxLQUFLLFlBQUwsQ0FBa0IsZ0JBQWxCLEdBQXFDLFFBQXJDLENBQThDLE9BQTlDLENBQWQsQ0FGaUM7QUFHdkMsZ0JBQUksQ0FBQyxLQUFELElBQVUsTUFBTSxNQUFOLEdBQWUsQ0FBZixFQUFrQixPQUFoQztBQUNBLDZCQUFFLE9BQUYsQ0FBVSxXQUFWLEVBQXVCLGdCQUFJO0FBQ3ZCLG9CQUFJLEtBQUssV0FBTCxDQUFpQixVQUFqQixTQUFrQyxNQUFNLENBQU4sT0FBbEMsQ0FBSixFQUFvRDtBQUNoRCx5QkFBSyxXQUFMLGtCQUFnQyxNQUFNLENBQU4sVUFBWSxNQUFNLENBQU4sQ0FBNUMsQ0FEZ0Q7aUJBQXBEO2FBRG1CLENBQXZCLENBSnVDOzs7Ozs7O0lBWS9DO0FBQ0ksZ0NBQUE7OztBQUNJLGFBQUssU0FBTCxHQUFpQixJQUFqQixDQURKO0tBQUE7Ozs7a0NBUWlCLFFBQWdCLFNBQWlCO0FBQzlDLGdCQUFNLFVBQVUsS0FBSyxnQkFBTCxFQUFWLENBRHdDO0FBRTlDLGdCQUFJLENBQUMsTUFBRCxFQUFTLE9BQWI7QUFDQSxnQkFBSSxPQUFKLEVBQWEsUUFBUSxNQUFSLENBQWUsUUFBZixFQUFiO0FBQ0Esb0JBQVEsTUFBUiwwQkFBb0MsaUJBQXBDLEVBSjhDOzs7OzZCQU90QyxTQUFpQixRQUFjOzs7QUFDdkMsaUJBQUssZ0JBQUwsR0FBd0IsS0FBSyxhQUFMLENBQW1CLE9BQW5CLENBQTJCLE9BQTNCLEVBQW9DLEVBQUUsUUFBUSxNQUFSLEVBQWdCLGFBQWEsSUFBYixFQUF0RCxDQUF4QixDQUR1QztBQUV2QyxpQkFBSyxTQUFMLEdBQWlCLEtBQWpCLENBRnVDO0FBR3ZDLGlCQUFLLGdCQUFMLENBQXNCLFlBQXRCLENBQW1DLHdCQUFZO0FBQzNDLHVCQUFLLFNBQUwsR0FBaUIsSUFBakIsQ0FEMkM7QUFFM0MsdUJBQUssZ0JBQUwsR0FBd0IsS0FBeEIsQ0FGMkM7YUFBWixDQUFuQyxDQUh1Qzs7OztnREFTWixTQUFlOzs7QUFDMUMsZ0JBQUksS0FBSyxnQkFBTCxFQUF1QixPQUEzQjtBQUNBLGlCQUFLLFNBQUwsQ0FBZSxPQUFmLEVBQXdCLElBQXhCLEVBRjBDO0FBRzFDLGdCQUFNLGtCQUFrQixFQUFFLEtBQUssS0FBTCxDQUFXLE9BQVgsQ0FBbUIsS0FBSyxnQkFBTCxDQUFyQixDQUFsQixDQUhvQztBQUkxQyw0QkFBZ0IsV0FBaEIsQ0FBNEIsTUFBNUIsRUFKMEM7QUFLMUMsNEJBQWdCLFdBQWhCLENBQTRCLFdBQTVCLEVBTDBDO0FBTTFDLDRCQUFnQixRQUFoQixDQUF5QixTQUF6QixFQU4wQztBQU8xQyw0QkFBZ0IsUUFBaEIsQ0FBeUIsWUFBekIsRUFQMEM7QUFRMUMsaUJBQUssZ0JBQUwsR0FBd0IsSUFBeEIsQ0FSMEM7QUFTMUMsdUJBQVcsWUFBQTtBQUFRLHVCQUFLLE9BQUwsR0FBUjthQUFBLEVBQTJCLElBQXRDLEVBVDBDOzs7O3NDQVk1QjtBQUNkLG1CQUFPLEtBQUssU0FBTCxDQURPOzs7O2tDQUlIO0FBQ1gsaUJBQUssZ0JBQUwsQ0FBc0IsT0FBdEIsR0FEVzs7OzsyQ0FJUTtBQUNuQixtQkFBTyxLQUFLLFVBQUwsQ0FBZ0IsRUFBRSxLQUFLLEtBQUwsQ0FBVyxPQUFYLENBQW1CLEtBQUssZ0JBQUwsQ0FBckIsQ0FBaEIsRUFBOEQsa0NBQTlELENBQVAsQ0FEbUI7Ozs7bUNBSUosU0FBaUIsVUFBZ0I7QUFDaEQsZ0JBQU0sS0FBSyxRQUFRLENBQVIsQ0FBTCxDQUQwQztBQUVoRCxnQkFBSSxDQUFDLEVBQUQsRUFBSyxPQUFUO0FBQ0EsZ0JBQU0sUUFBYyxHQUFJLGdCQUFKLENBQXFCLFFBQXJCLENBQWQsQ0FIMEM7QUFJaEQsbUJBQU8sRUFBRSxNQUFNLENBQU4sQ0FBRixDQUFQLENBSmdEOzs7Ozs7O0FBUWpELElBQU0sb0RBQXNCLElBQUksbUJBQUosRUFBdEIiLCJmaWxlIjoibGliL2ZlYXR1cmVzL25vdGlmaWNhdGlvbi1oYW5kbGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xuaW1wb3J0IHsgT21uaSB9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSB9IGZyb20gXCJ0cy1kaXNwb3NhYmxlc1wiO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tIFwicGF0aFwiO1xuY29uc3QgJCA9IHJlcXVpcmUoXCJqcXVlcnlcIik7XG5jbGFzcyBOb3RpZmljYXRpb25IYW5kbGVyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5yZXF1aXJlZCA9IHRydWU7XG4gICAgICAgIHRoaXMudGl0bGUgPSBcIlBhY2thZ2UgUmVzdG9yZSBOb3RpZmljYXRpb25zXCI7XG4gICAgICAgIHRoaXMuZGVzY3JpcHRpb24gPSBcIkFkZHMgc3VwcG9ydCB0byBzaG93IHBhY2thZ2UgcmVzdG9yZSBwcm9ncmVzcywgd2hlbiB0aGUgc2VydmVyIGluaXRpYXRlcyBhIHJlc3RvcmUgb3BlcmF0aW9uLlwiO1xuICAgIH1cbiAgICBhY3RpdmF0ZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgdGhpcy5wYWNrYWdlUmVzdG9yZU5vdGlmaWNhdGlvbiA9IG5ldyBQYWNrYWdlUmVzdG9yZU5vdGlmaWNhdGlvbigpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkubGlzdGVuZXIucGFja2FnZVJlc3RvcmVTdGFydGVkLnN1YnNjcmliZShlID0+IHRoaXMucGFja2FnZVJlc3RvcmVOb3RpZmljYXRpb24uaGFuZGxlUGFja2FnZVJlc3RvcmVTdGFydGVkKGUpKSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5saXN0ZW5lci5wYWNrYWdlUmVzdG9yZUZpbmlzaGVkLnN1YnNjcmliZShlID0+IHRoaXMucGFja2FnZVJlc3RvcmVOb3RpZmljYXRpb24uaGFuZGxlUGFja2FnZVJlc3RvcmVGaW5pc2hlZChlKSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkubGlzdGVuZXIudW5yZXNvbHZlZERlcGVuZGVuY2llcy5zdWJzY3JpYmUoZSA9PiB0aGlzLnBhY2thZ2VSZXN0b3JlTm90aWZpY2F0aW9uLmhhbmRsZVVucmVzb2x2ZWREZXBlbmRlbmNpZXMoZSkpKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmxpc3RlbmVyLmV2ZW50c1xuICAgICAgICAgICAgLmZpbHRlcih6ID0+IHouRXZlbnQgPT09IFwibG9nXCIpXG4gICAgICAgICAgICAuZmlsdGVyKHogPT4gXy5pbmNsdWRlcyh6LkJvZHkuTmFtZSwgXCJQYWNrYWdlc1Jlc3RvcmVUb29sXCIpKVxuICAgICAgICAgICAgLmZpbHRlcih6ID0+IHouQm9keS5NZXNzYWdlLnN0YXJ0c1dpdGgoXCJJbnN0YWxsaW5nXCIpKVxuICAgICAgICAgICAgLnN1YnNjcmliZShlID0+IHRoaXMucGFja2FnZVJlc3RvcmVOb3RpZmljYXRpb24uaGFuZGxlRXZlbnRzKGUpKSk7XG4gICAgfVxuICAgIGRpc3Bvc2UoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfVxufVxuY2xhc3MgUGFja2FnZVJlc3RvcmVOb3RpZmljYXRpb24ge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmhhbmRsZVBhY2thZ2VSZXN0b3JlU3RhcnRlZCA9IChldmVudCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5wYWNrYWdlUmVzdG9yZVN0YXJ0ZWQrKztcbiAgICAgICAgICAgIGlmICh0aGlzLm5vdGlmaWNhdGlvbi5pc0Rpc21pc3NlZCgpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5ub3RpZmljYXRpb24uc2hvdyhcIlBhY2thZ2UgcmVzdG9yZSBzdGFydGVkXCIsIFwiU3RhcnRpbmcuLlwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5oYW5kbGVVbnJlc29sdmVkRGVwZW5kZW5jaWVzID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5ub3RpZmljYXRpb24uaXNEaXNtaXNzZWQoKSkge1xuICAgICAgICAgICAgICAgIHRoaXMubm90aWZpY2F0aW9uLnNob3coXCJQYWNrYWdlIHJlc3RvcmUgc3RhcnRlZFwiLCBcIlN0YXJ0aW5nLi5cIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZXZlbnQuRmlsZU5hbWUpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBwcm9qZWN0TmFtZSA9IHRoaXMuZmluZFByb2plY3ROYW1lRnJvbUZpbGVOYW1lKGV2ZW50LkZpbGVOYW1lKTtcbiAgICAgICAgICAgICAgICBpZiAoIV8uc29tZSh0aGlzLmtub3duUHJvamVjdHMsIChrbm93blByb2plY3QpID0+IHsgcmV0dXJuIGtub3duUHJvamVjdCA9PT0gcHJvamVjdE5hbWU7IH0pKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMua25vd25Qcm9qZWN0cy5wdXNoKHByb2plY3ROYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5ub3RpZmljYXRpb24uYWRkRGV0YWlsKGBVbnJlc29sdmVkIGRlcGVuZGVuY2llcyBmb3IgJHtwcm9qZWN0TmFtZX06YCwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChldmVudC5VbnJlc29sdmVkRGVwZW5kZW5jaWVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBldmVudC5VbnJlc29sdmVkRGVwZW5kZW5jaWVzLmZvckVhY2goZGVwID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm5vdGlmaWNhdGlvbi5hZGREZXRhaWwoYCAtICR7ZGVwLk5hbWV9ICR7ZGVwLlZlcnNpb259YCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5oYW5kbGVQYWNrYWdlUmVzdG9yZUZpbmlzaGVkID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICB0aGlzLnBhY2thZ2VSZXN0b3JlRmluaXNoZWQrKztcbiAgICAgICAgICAgIGlmICh0aGlzLnBhY2thZ2VSZXN0b3JlU3RhcnRlZCA9PT0gdGhpcy5wYWNrYWdlUmVzdG9yZUZpbmlzaGVkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5ub3RpZmljYXRpb24uc2V0U3VjY2Vzc2Z1bEFuZERpc21pc3MoXCJQYWNrYWdlIHJlc3RvcmUgZmluaXNoZWQuXCIpO1xuICAgICAgICAgICAgICAgIHRoaXMucGFja2FnZVJlc3RvcmVTdGFydGVkID0gMDtcbiAgICAgICAgICAgICAgICB0aGlzLnBhY2thZ2VSZXN0b3JlRmluaXNoZWQgPSAwO1xuICAgICAgICAgICAgICAgIHRoaXMua25vd25Qcm9qZWN0cyA9IFtdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICB0aGlzLmhhbmRsZUV2ZW50cyA9IChldmVudCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5zZXRQYWNrYWdlSW5zdGFsbGVkKGV2ZW50LkJvZHkuTWVzc2FnZSk7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMubm90aWZpY2F0aW9uID0gbmV3IE9tbmlOb3RpZmljYXRpb24oKTtcbiAgICAgICAgdGhpcy5wYWNrYWdlUmVzdG9yZVN0YXJ0ZWQgPSAwO1xuICAgICAgICB0aGlzLnBhY2thZ2VSZXN0b3JlRmluaXNoZWQgPSAwO1xuICAgICAgICB0aGlzLmtub3duUHJvamVjdHMgPSBbXTtcbiAgICB9XG4gICAgZmluZFByb2plY3ROYW1lRnJvbUZpbGVOYW1lKGZpbGVOYW1lKSB7XG4gICAgICAgIGNvbnN0IHNwbGl0ID0gZmlsZU5hbWUuc3BsaXQocGF0aC5zZXApO1xuICAgICAgICBjb25zdCBwcm9qZWN0TmFtZSA9IHNwbGl0W3NwbGl0Lmxlbmd0aCAtIDJdO1xuICAgICAgICByZXR1cm4gcHJvamVjdE5hbWU7XG4gICAgfVxuICAgIHNldFBhY2thZ2VJbnN0YWxsZWQobWVzc2FnZSkge1xuICAgICAgICBjb25zdCBtYXRjaCA9IG1lc3NhZ2UubWF0Y2goL0luc3RhbGxpbmcgKFthLXpBLVouXSopIChbXFxEP1xcZD8uPy0/XSopLyk7XG4gICAgICAgIGNvbnN0IGRldGFpbExpbmVzID0gdGhpcy5ub3RpZmljYXRpb24uZ2V0RGV0YWlsRWxlbWVudCgpLmNoaWxkcmVuKFwiLmxpbmVcIik7XG4gICAgICAgIGlmICghbWF0Y2ggfHwgbWF0Y2gubGVuZ3RoIDwgMylcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgXy5mb3JFYWNoKGRldGFpbExpbmVzLCBsaW5lID0+IHtcbiAgICAgICAgICAgIGlmIChsaW5lLnRleHRDb250ZW50LnN0YXJ0c1dpdGgoYCAtICR7bWF0Y2hbMV19IGApKSB7XG4gICAgICAgICAgICAgICAgbGluZS50ZXh0Q29udGVudCA9IGBJbnN0YWxsZWQgJHttYXRjaFsxXX0gJHttYXRjaFsyXX1gO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG59XG5jbGFzcyBPbW5pTm90aWZpY2F0aW9uIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5kaXNtaXNzZWQgPSB0cnVlO1xuICAgIH1cbiAgICBhZGREZXRhaWwoZGV0YWlsLCBuZXdsaW5lKSB7XG4gICAgICAgIGNvbnN0IGRldGFpbHMgPSB0aGlzLmdldERldGFpbEVsZW1lbnQoKTtcbiAgICAgICAgaWYgKCFkZXRhaWwpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGlmIChuZXdsaW5lKVxuICAgICAgICAgICAgZGV0YWlscy5hcHBlbmQoXCI8YnIgLz5cIik7XG4gICAgICAgIGRldGFpbHMuYXBwZW5kKGA8ZGl2IGNsYXNzPVwibGluZVwiPiR7ZGV0YWlsfTwvZGl2PmApO1xuICAgIH1cbiAgICBzaG93KG1lc3NhZ2UsIGRldGFpbCkge1xuICAgICAgICB0aGlzLmF0b21Ob3RpZmljYXRpb24gPSBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkSW5mbyhtZXNzYWdlLCB7IGRldGFpbDogZGV0YWlsLCBkaXNtaXNzYWJsZTogdHJ1ZSB9KTtcbiAgICAgICAgdGhpcy5kaXNtaXNzZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5hdG9tTm90aWZpY2F0aW9uLm9uRGlkRGlzbWlzcyhub3RpZmljYXRpb24gPT4ge1xuICAgICAgICAgICAgdGhpcy5kaXNtaXNzZWQgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5pc0JlaW5nRGlzbWlzc2VkID0gZmFsc2U7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBzZXRTdWNjZXNzZnVsQW5kRGlzbWlzcyhtZXNzYWdlKSB7XG4gICAgICAgIGlmICh0aGlzLmlzQmVpbmdEaXNtaXNzZWQpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHRoaXMuYWRkRGV0YWlsKG1lc3NhZ2UsIHRydWUpO1xuICAgICAgICBjb25zdCBkb21Ob3RpZmljYXRpb24gPSAkKGF0b20udmlld3MuZ2V0Vmlldyh0aGlzLmF0b21Ob3RpZmljYXRpb24pKTtcbiAgICAgICAgZG9tTm90aWZpY2F0aW9uLnJlbW92ZUNsYXNzKFwiaW5mb1wiKTtcbiAgICAgICAgZG9tTm90aWZpY2F0aW9uLnJlbW92ZUNsYXNzKFwiaWNvbi1pbmZvXCIpO1xuICAgICAgICBkb21Ob3RpZmljYXRpb24uYWRkQ2xhc3MoXCJzdWNjZXNzXCIpO1xuICAgICAgICBkb21Ob3RpZmljYXRpb24uYWRkQ2xhc3MoXCJpY29uLWNoZWNrXCIpO1xuICAgICAgICB0aGlzLmlzQmVpbmdEaXNtaXNzZWQgPSB0cnVlO1xuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHsgdGhpcy5kaXNtaXNzKCk7IH0sIDIwMDApO1xuICAgIH1cbiAgICBpc0Rpc21pc3NlZCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGlzbWlzc2VkO1xuICAgIH1cbiAgICBkaXNtaXNzKCkge1xuICAgICAgICB0aGlzLmF0b21Ob3RpZmljYXRpb24uZGlzbWlzcygpO1xuICAgIH1cbiAgICBnZXREZXRhaWxFbGVtZW50KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRGcm9tRG9tKCQoYXRvbS52aWV3cy5nZXRWaWV3KHRoaXMuYXRvbU5vdGlmaWNhdGlvbikpLCBcIi5jb250ZW50IC5kZXRhaWwgLmRldGFpbC1jb250ZW50XCIpO1xuICAgIH1cbiAgICBnZXRGcm9tRG9tKGVsZW1lbnQsIHNlbGVjdG9yKSB7XG4gICAgICAgIGNvbnN0IGVsID0gZWxlbWVudFswXTtcbiAgICAgICAgaWYgKCFlbClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3QgZm91bmQgPSBlbC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKTtcbiAgICAgICAgcmV0dXJuICQoZm91bmRbMF0pO1xuICAgIH1cbn1cbmV4cG9ydCBjb25zdCBub3RpZmljYXRpb25IYW5kbGVyID0gbmV3IE5vdGlmaWNhdGlvbkhhbmRsZXI7XG4iLCJpbXBvcnQge01vZGVscywgU3RkaW99IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XHJcbmltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcclxuaW1wb3J0IHtPbW5pfSBmcm9tIFwiLi4vc2VydmVyL29tbmlcIjtcclxuaW1wb3J0IHtDb21wb3NpdGVEaXNwb3NhYmxlfSBmcm9tIFwidHMtZGlzcG9zYWJsZXNcIjtcclxuaW1wb3J0ICogYXMgcGF0aCBmcm9tIFwicGF0aFwiO1xyXG5jb25zdCAkOiBKUXVlcnlTdGF0aWMgPSByZXF1aXJlKFwianF1ZXJ5XCIpO1xyXG5cclxuY2xhc3MgTm90aWZpY2F0aW9uSGFuZGxlciBpbXBsZW1lbnRzIElGZWF0dXJlIHtcclxuICAgIHByaXZhdGUgZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxuICAgIHByaXZhdGUgcGFja2FnZVJlc3RvcmVOb3RpZmljYXRpb246IFBhY2thZ2VSZXN0b3JlTm90aWZpY2F0aW9uO1xyXG5cclxuICAgIHB1YmxpYyBhY3RpdmF0ZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG5cclxuICAgICAgICB0aGlzLnBhY2thZ2VSZXN0b3JlTm90aWZpY2F0aW9uID0gbmV3IFBhY2thZ2VSZXN0b3JlTm90aWZpY2F0aW9uKCk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5saXN0ZW5lci5wYWNrYWdlUmVzdG9yZVN0YXJ0ZWQuc3Vic2NyaWJlKGUgPT5cclxuICAgICAgICAgICAgdGhpcy5wYWNrYWdlUmVzdG9yZU5vdGlmaWNhdGlvbi5oYW5kbGVQYWNrYWdlUmVzdG9yZVN0YXJ0ZWQoZSkpKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmxpc3RlbmVyLnBhY2thZ2VSZXN0b3JlRmluaXNoZWQuc3Vic2NyaWJlKGUgPT5cclxuICAgICAgICAgICAgdGhpcy5wYWNrYWdlUmVzdG9yZU5vdGlmaWNhdGlvbi5oYW5kbGVQYWNrYWdlUmVzdG9yZUZpbmlzaGVkKGUpKSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5saXN0ZW5lci51bnJlc29sdmVkRGVwZW5kZW5jaWVzLnN1YnNjcmliZShlID0+XHJcbiAgICAgICAgICAgIHRoaXMucGFja2FnZVJlc3RvcmVOb3RpZmljYXRpb24uaGFuZGxlVW5yZXNvbHZlZERlcGVuZGVuY2llcyhlKSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkubGlzdGVuZXIuZXZlbnRzXHJcbiAgICAgICAgICAgIC5maWx0ZXIoeiA9PiB6LkV2ZW50ID09PSBcImxvZ1wiKVxyXG4gICAgICAgICAgICAuZmlsdGVyKHogPT4gXy5pbmNsdWRlcyh6LkJvZHkuTmFtZSwgXCJQYWNrYWdlc1Jlc3RvcmVUb29sXCIpKVxyXG4gICAgICAgICAgICAuZmlsdGVyKHogPT4gei5Cb2R5Lk1lc3NhZ2Uuc3RhcnRzV2l0aChcIkluc3RhbGxpbmdcIikpXHJcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoZSA9PiB0aGlzLnBhY2thZ2VSZXN0b3JlTm90aWZpY2F0aW9uLmhhbmRsZUV2ZW50cyhlKSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkaXNwb3NlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlcXVpcmVkID0gdHJ1ZTtcclxuICAgIHB1YmxpYyB0aXRsZSA9IFwiUGFja2FnZSBSZXN0b3JlIE5vdGlmaWNhdGlvbnNcIjtcclxuICAgIHB1YmxpYyBkZXNjcmlwdGlvbiA9IFwiQWRkcyBzdXBwb3J0IHRvIHNob3cgcGFja2FnZSByZXN0b3JlIHByb2dyZXNzLCB3aGVuIHRoZSBzZXJ2ZXIgaW5pdGlhdGVzIGEgcmVzdG9yZSBvcGVyYXRpb24uXCI7XHJcbn1cclxuXHJcbmNsYXNzIFBhY2thZ2VSZXN0b3JlTm90aWZpY2F0aW9uIHtcclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHRoaXMubm90aWZpY2F0aW9uID0gbmV3IE9tbmlOb3RpZmljYXRpb24oKTtcclxuICAgICAgICB0aGlzLnBhY2thZ2VSZXN0b3JlU3RhcnRlZCA9IDA7XHJcbiAgICAgICAgdGhpcy5wYWNrYWdlUmVzdG9yZUZpbmlzaGVkID0gMDtcclxuICAgICAgICB0aGlzLmtub3duUHJvamVjdHMgPSBbXTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIG5vdGlmaWNhdGlvbjogT21uaU5vdGlmaWNhdGlvbjtcclxuICAgIHByaXZhdGUgcGFja2FnZVJlc3RvcmVTdGFydGVkOiBudW1iZXI7XHJcbiAgICBwcml2YXRlIHBhY2thZ2VSZXN0b3JlRmluaXNoZWQ6IG51bWJlcjtcclxuICAgIHByaXZhdGUga25vd25Qcm9qZWN0czogQXJyYXk8c3RyaW5nPjtcclxuXHJcbiAgICBwdWJsaWMgaGFuZGxlUGFja2FnZVJlc3RvcmVTdGFydGVkID0gKGV2ZW50OiBNb2RlbHMuUGFja2FnZVJlc3RvcmVNZXNzYWdlKSA9PiB7XHJcbiAgICAgICAgLy8gQ291bnQgaG93IG1hbnkgb2YgdGhlc2Ugd2UgZ2V0IHNvIHdlIGtub3cgd2hlbiB0byBkaXNtaXNzIHRoZSBub3RpZmljYXRpb25cclxuICAgICAgICB0aGlzLnBhY2thZ2VSZXN0b3JlU3RhcnRlZCsrO1xyXG4gICAgICAgIGlmICh0aGlzLm5vdGlmaWNhdGlvbi5pc0Rpc21pc3NlZCgpKSB7XHJcbiAgICAgICAgICAgIHRoaXMubm90aWZpY2F0aW9uLnNob3coXCJQYWNrYWdlIHJlc3RvcmUgc3RhcnRlZFwiLCBcIlN0YXJ0aW5nLi5cIik7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBwdWJsaWMgaGFuZGxlVW5yZXNvbHZlZERlcGVuZGVuY2llcyA9IChldmVudDogTW9kZWxzLlVucmVzb2x2ZWREZXBlbmRlbmNpZXNNZXNzYWdlKSA9PiB7XHJcbiAgICAgICAgLy8gU29tZXRpbWVzIFVucmVzb2x2ZWREZXBlbmRlbmNpZXMgZXZlbnQgaXMgc2VudCBiZWZvcmUgUGFja2FnZVJlc3RvcmVTdGFydGVkXHJcbiAgICAgICAgaWYgKHRoaXMubm90aWZpY2F0aW9uLmlzRGlzbWlzc2VkKCkpIHtcclxuICAgICAgICAgICAgdGhpcy5ub3RpZmljYXRpb24uc2hvdyhcIlBhY2thZ2UgcmVzdG9yZSBzdGFydGVkXCIsIFwiU3RhcnRpbmcuLlwiKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChldmVudC5GaWxlTmFtZSkge1xyXG4gICAgICAgICAgICBjb25zdCBwcm9qZWN0TmFtZSA9IHRoaXMuZmluZFByb2plY3ROYW1lRnJvbUZpbGVOYW1lKGV2ZW50LkZpbGVOYW1lKTtcclxuICAgICAgICAgICAgLy8gQ2xpZW50IGdldHMgbW9yZSB0aGFuIG9uZSBvZiBlYWNoIFVucmVzb2x2ZWREZXBlbmRlbmNpZXMgZXZlbnRzIGZvciBlYWNoIHByb2plY3RcclxuICAgICAgICAgICAgLy8gRG9uXCJ0IHNob3cgbXVsdGlwbGUgaW5zdGFuY2VzIG9mIGEgcHJvamVjdCBpbiB0aGUgbm90aWZpY2F0aW9uXHJcbiAgICAgICAgICAgIGlmICghXy5zb21lKHRoaXMua25vd25Qcm9qZWN0cywgKGtub3duUHJvamVjdCkgPT4geyByZXR1cm4ga25vd25Qcm9qZWN0ID09PSBwcm9qZWN0TmFtZTsgfSkpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMua25vd25Qcm9qZWN0cy5wdXNoKHByb2plY3ROYW1lKTtcclxuICAgICAgICAgICAgICAgIHRoaXMubm90aWZpY2F0aW9uLmFkZERldGFpbChgVW5yZXNvbHZlZCBkZXBlbmRlbmNpZXMgZm9yICR7cHJvamVjdE5hbWV9OmAsIHRydWUpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LlVucmVzb2x2ZWREZXBlbmRlbmNpZXMpIHtcclxuICAgICAgICAgICAgICAgICAgICBldmVudC5VbnJlc29sdmVkRGVwZW5kZW5jaWVzLmZvckVhY2goZGVwID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5ub3RpZmljYXRpb24uYWRkRGV0YWlsKGAgLSAke2RlcC5OYW1lfSAke2RlcC5WZXJzaW9ufWApO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBwdWJsaWMgaGFuZGxlUGFja2FnZVJlc3RvcmVGaW5pc2hlZCA9IChldmVudDogTW9kZWxzLlBhY2thZ2VSZXN0b3JlTWVzc2FnZSkgPT4ge1xyXG4gICAgICAgIC8vIENvdW50IGhvdyBtYW55IG9mIHRoZXNlIHdlIGdldCBzbyB3ZSBrbm93IHdoZW4gdG8gZGlzbWlzcyB0aGUgbm90aWZpY2F0aW9uXHJcbiAgICAgICAgdGhpcy5wYWNrYWdlUmVzdG9yZUZpbmlzaGVkKys7XHJcbiAgICAgICAgaWYgKHRoaXMucGFja2FnZVJlc3RvcmVTdGFydGVkID09PSB0aGlzLnBhY2thZ2VSZXN0b3JlRmluaXNoZWQpIHtcclxuICAgICAgICAgICAgdGhpcy5ub3RpZmljYXRpb24uc2V0U3VjY2Vzc2Z1bEFuZERpc21pc3MoXCJQYWNrYWdlIHJlc3RvcmUgZmluaXNoZWQuXCIpO1xyXG4gICAgICAgICAgICB0aGlzLnBhY2thZ2VSZXN0b3JlU3RhcnRlZCA9IDA7XHJcbiAgICAgICAgICAgIHRoaXMucGFja2FnZVJlc3RvcmVGaW5pc2hlZCA9IDA7XHJcbiAgICAgICAgICAgIHRoaXMua25vd25Qcm9qZWN0cyA9IFtdO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgcHVibGljIGhhbmRsZUV2ZW50cyA9IChldmVudDogU3RkaW8uUHJvdG9jb2wuRXZlbnRQYWNrZXQpID0+IHtcclxuICAgICAgICB0aGlzLnNldFBhY2thZ2VJbnN0YWxsZWQoZXZlbnQuQm9keS5NZXNzYWdlKTtcclxuICAgIH07XHJcblxyXG4gICAgcHJpdmF0ZSBmaW5kUHJvamVjdE5hbWVGcm9tRmlsZU5hbWUoZmlsZU5hbWU6IHN0cmluZyk6IHN0cmluZyB7XHJcbiAgICAgICAgY29uc3Qgc3BsaXQgPSBmaWxlTmFtZS5zcGxpdChwYXRoLnNlcCk7XHJcbiAgICAgICAgY29uc3QgcHJvamVjdE5hbWUgPSBzcGxpdFtzcGxpdC5sZW5ndGggLSAyXTtcclxuICAgICAgICByZXR1cm4gcHJvamVjdE5hbWU7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBzZXRQYWNrYWdlSW5zdGFsbGVkKG1lc3NhZ2U6IHN0cmluZykge1xyXG4gICAgICAgIGNvbnN0IG1hdGNoID0gbWVzc2FnZS5tYXRjaCgvSW5zdGFsbGluZyAoW2EtekEtWi5dKikgKFtcXEQ/XFxkPy4/LT9dKikvKTtcclxuICAgICAgICBjb25zdCBkZXRhaWxMaW5lcyA9IHRoaXMubm90aWZpY2F0aW9uLmdldERldGFpbEVsZW1lbnQoKS5jaGlsZHJlbihcIi5saW5lXCIpO1xyXG4gICAgICAgIGlmICghbWF0Y2ggfHwgbWF0Y2gubGVuZ3RoIDwgMykgcmV0dXJuO1xyXG4gICAgICAgIF8uZm9yRWFjaChkZXRhaWxMaW5lcywgbGluZSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChsaW5lLnRleHRDb250ZW50LnN0YXJ0c1dpdGgoYCAtICR7bWF0Y2hbMV19IGApKSB7XHJcbiAgICAgICAgICAgICAgICBsaW5lLnRleHRDb250ZW50ID0gYEluc3RhbGxlZCAke21hdGNoWzFdfSAke21hdGNoWzJdfWA7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxufVxyXG5cclxuY2xhc3MgT21uaU5vdGlmaWNhdGlvbiB7XHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICB0aGlzLmRpc21pc3NlZCA9IHRydWU7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhdG9tTm90aWZpY2F0aW9uOiBBdG9tLk5vdGlmaWNhdGlvbjtcclxuICAgIHByaXZhdGUgZGlzbWlzc2VkOiBib29sZWFuO1xyXG4gICAgcHJpdmF0ZSBpc0JlaW5nRGlzbWlzc2VkOiBib29sZWFuO1xyXG5cclxuICAgIHB1YmxpYyBhZGREZXRhaWwoZGV0YWlsOiBzdHJpbmcsIG5ld2xpbmU/OiBib29sZWFuKSB7XHJcbiAgICAgICAgY29uc3QgZGV0YWlscyA9IHRoaXMuZ2V0RGV0YWlsRWxlbWVudCgpO1xyXG4gICAgICAgIGlmICghZGV0YWlsKSByZXR1cm47XHJcbiAgICAgICAgaWYgKG5ld2xpbmUpIGRldGFpbHMuYXBwZW5kKFwiPGJyIC8+XCIpO1xyXG4gICAgICAgIGRldGFpbHMuYXBwZW5kKGA8ZGl2IGNsYXNzPVwibGluZVwiPiR7ZGV0YWlsfTwvZGl2PmApO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzaG93KG1lc3NhZ2U6IHN0cmluZywgZGV0YWlsOiBzdHJpbmcpIHtcclxuICAgICAgICB0aGlzLmF0b21Ob3RpZmljYXRpb24gPSBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkSW5mbyhtZXNzYWdlLCB7IGRldGFpbDogZGV0YWlsLCBkaXNtaXNzYWJsZTogdHJ1ZSB9KTtcclxuICAgICAgICB0aGlzLmRpc21pc3NlZCA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuYXRvbU5vdGlmaWNhdGlvbi5vbkRpZERpc21pc3Mobm90aWZpY2F0aW9uID0+IHtcclxuICAgICAgICAgICAgdGhpcy5kaXNtaXNzZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICB0aGlzLmlzQmVpbmdEaXNtaXNzZWQgPSBmYWxzZTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2V0U3VjY2Vzc2Z1bEFuZERpc21pc3MobWVzc2FnZTogc3RyaW5nKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuaXNCZWluZ0Rpc21pc3NlZCkgcmV0dXJuO1xyXG4gICAgICAgIHRoaXMuYWRkRGV0YWlsKG1lc3NhZ2UsIHRydWUpO1xyXG4gICAgICAgIGNvbnN0IGRvbU5vdGlmaWNhdGlvbiA9ICQoYXRvbS52aWV3cy5nZXRWaWV3KHRoaXMuYXRvbU5vdGlmaWNhdGlvbikpO1xyXG4gICAgICAgIGRvbU5vdGlmaWNhdGlvbi5yZW1vdmVDbGFzcyhcImluZm9cIik7XHJcbiAgICAgICAgZG9tTm90aWZpY2F0aW9uLnJlbW92ZUNsYXNzKFwiaWNvbi1pbmZvXCIpO1xyXG4gICAgICAgIGRvbU5vdGlmaWNhdGlvbi5hZGRDbGFzcyhcInN1Y2Nlc3NcIik7XHJcbiAgICAgICAgZG9tTm90aWZpY2F0aW9uLmFkZENsYXNzKFwiaWNvbi1jaGVja1wiKTtcclxuICAgICAgICB0aGlzLmlzQmVpbmdEaXNtaXNzZWQgPSB0cnVlO1xyXG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4geyB0aGlzLmRpc21pc3MoKTsgfSwgMjAwMCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGlzRGlzbWlzc2VkKCk6IGJvb2xlYW4ge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmRpc21pc3NlZDtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGRpc21pc3MoKSB7XHJcbiAgICAgICAgdGhpcy5hdG9tTm90aWZpY2F0aW9uLmRpc21pc3MoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0RGV0YWlsRWxlbWVudCgpOiBKUXVlcnkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmdldEZyb21Eb20oJChhdG9tLnZpZXdzLmdldFZpZXcodGhpcy5hdG9tTm90aWZpY2F0aW9uKSksIFwiLmNvbnRlbnQgLmRldGFpbCAuZGV0YWlsLWNvbnRlbnRcIik7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBnZXRGcm9tRG9tKGVsZW1lbnQ6IEpRdWVyeSwgc2VsZWN0b3I6IHN0cmluZyk6IEpRdWVyeSB7XHJcbiAgICAgICAgY29uc3QgZWwgPSBlbGVtZW50WzBdO1xyXG4gICAgICAgIGlmICghZWwpIHJldHVybjtcclxuICAgICAgICBjb25zdCBmb3VuZCA9ICg8YW55PmVsKS5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKTtcclxuICAgICAgICByZXR1cm4gJChmb3VuZFswXSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBub3RpZmljYXRpb25IYW5kbGVyID0gbmV3IE5vdGlmaWNhdGlvbkhhbmRsZXI7XHJcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
