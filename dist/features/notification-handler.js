"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.notificationHandler = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _omni = require("../server/omni");

var _omnisharpClient = require("omnisharp-client");

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

            this.disposable = new _omnisharpClient.CompositeDisposable();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9ub3RpZmljYXRpb24taGFuZGxlci5qcyIsImxpYi9mZWF0dXJlcy9ub3RpZmljYXRpb24taGFuZGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7OztBQUNBOztBQUNBOztBQUNBOztJQ0NZLEk7Ozs7Ozs7O0FBQ1osSUFBTSxJQUFrQixRQUFRLFFBQVIsQ0FBeEI7O0lBRUEsbUI7QUFBQSxtQ0FBQTtBQUFBOztBQTZCVyxhQUFBLFFBQUEsR0FBVyxJQUFYO0FBQ0EsYUFBQSxLQUFBLEdBQVEsK0JBQVI7QUFDQSxhQUFBLFdBQUEsR0FBYywrRkFBZDtBQUNWOzs7O21DQTVCa0I7QUFBQTs7QUFDWCxpQkFBSyxVQUFMLEdBQWtCLDBDQUFsQjtBQUVBLGlCQUFLLDBCQUFMLEdBQWtDLElBQUksMEJBQUosRUFBbEM7QUFFQSxpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLFdBQUssUUFBTCxDQUFjLHFCQUFkLENBQW9DLFNBQXBDLENBQThDO0FBQUEsdUJBQzlELE1BQUssMEJBQUwsQ0FBZ0MsMkJBQWhDLENBQTRELENBQTVELENBRDhEO0FBQUEsYUFBOUMsQ0FBcEI7QUFHQSxpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLFdBQUssUUFBTCxDQUFjLHNCQUFkLENBQXFDLFNBQXJDLENBQStDO0FBQUEsdUJBQy9ELE1BQUssMEJBQUwsQ0FBZ0MsNEJBQWhDLENBQTZELENBQTdELENBRCtEO0FBQUEsYUFBL0MsQ0FBcEI7QUFHQSxpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLFdBQUssUUFBTCxDQUFjLHNCQUFkLENBQXFDLFNBQXJDLENBQStDO0FBQUEsdUJBQy9ELE1BQUssMEJBQUwsQ0FBZ0MsNEJBQWhDLENBQTZELENBQTdELENBRCtEO0FBQUEsYUFBL0MsQ0FBcEI7QUFHQSxpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLFdBQUssUUFBTCxDQUFjLE1BQWQsQ0FDZixNQURlLENB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ZSxPQUFmLEVBQXdCLElBQXhCO0FBQ0EsZ0JBQU0sa0JBQWtCLEVBQUUsS0FBSyxLQUFMLENBQVcsT0FBWCxDQUFtQixLQUFLLGdCQUF4QixDQUFGLENBQXhCO0FBQ0EsNEJBQWdCLFdBQWhCLENBQTRCLE1BQTVCO0FBQ0EsNEJBQWdCLFdBQWhCLENBQTRCLFdBQTVCO0FBQ0EsNEJBQWdCLFFBQWhCLENBQXlCLFNBQXpCO0FBQ0EsNEJBQWdCLFFBQWhCLENBQXlCLFlBQXpCO0FBQ0EsaUJBQUssZ0JBQUwsR0FBd0IsSUFBeEI7QUFDQSx1QkFBVyxZQUFBO0FBQVEsdUJBQUssT0FBTDtBQUFpQixhQUFwQyxFQUFzQyxJQUF0QztBQUNIOzs7c0NBRWlCO0FBQ2QsbUJBQU8sS0FBSyxTQUFaO0FBQ0g7OztrQ0FFYztBQUNYLGlCQUFLLGdCQUFMLENBQXNCLE9BQXRCO0FBQ0g7OzsyQ0FFc0I7QUFDbkIsbUJBQU8sS0FBSyxVQUFMLENBQWdCLEVBQUUsS0FBSyxLQUFMLENBQVcsT0FBWCxDQUFtQixLQUFLLGdCQUF4QixDQUFGLENBQWhCLEVBQThELGtDQUE5RCxDQUFQO0FBQ0g7OzttQ0FFa0IsTyxFQUFpQixRLEVBQWdCO0FBQ2hELGdCQUFNLEtBQUssUUFBUSxDQUFSLENBQVg7QUFDQSxnQkFBSSxDQUFDLEVBQUwsRUFBUztBQUNULGdCQUFNLFFBQWMsR0FBSSxnQkFBSixDQUFxQixRQUFyQixDQUFwQjtBQUNBLG1CQUFPLEVBQUUsTUFBTSxDQUFOLENBQUYsQ0FBUDtBQUNIOzs7Ozs7QUFHRSxJQUFNLG9EQUFzQixJQUFJLG1CQUFKLEVBQTVCIiwiZmlsZSI6ImxpYi9mZWF0dXJlcy9ub3RpZmljYXRpb24taGFuZGxlci5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcbmltcG9ydCB7IE9tbmkgfSBmcm9tIFwiLi4vc2VydmVyL29tbmlcIjtcbmltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUgfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tIFwicGF0aFwiO1xuY29uc3QgJCA9IHJlcXVpcmUoXCJqcXVlcnlcIik7XG5jbGFzcyBOb3RpZmljYXRpb25IYW5kbGVyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5yZXF1aXJlZCA9IHRydWU7XG4gICAgICAgIHRoaXMudGl0bGUgPSBcIlBhY2thZ2UgUmVzdG9yZSBOb3RpZmljYXRpb25zXCI7XG4gICAgICAgIHRoaXMuZGVzY3JpcHRpb24gPSBcIkFkZHMgc3VwcG9ydCB0byBzaG93IHBhY2thZ2UgcmVzdG9yZSBwcm9ncmVzcywgd2hlbiB0aGUgc2VydmVyIGluaXRpYXRlcyBhIHJlc3RvcmUgb3BlcmF0aW9uLlwiO1xuICAgIH1cbiAgICBhY3RpdmF0ZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgdGhpcy5wYWNrYWdlUmVzdG9yZU5vdGlmaWNhdGlvbiA9IG5ldyBQYWNrYWdlUmVzdG9yZU5vdGlmaWNhdGlvbigpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkubGlzdGVuZXIucGFja2FnZVJlc3RvcmVTdGFydGVkLnN1YnNjcmliZShlID0+IHRoaXMucGFja2FnZVJlc3RvcmVOb3RpZmljYXRpb24uaGFuZGxlUGFja2FnZVJlc3RvcmVTdGFydGVkKGUpKSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5saXN0ZW5lci5wYWNrYWdlUmVzdG9yZUZpbmlzaGVkLnN1YnNjcmliZShlID0+IHRoaXMucGFja2FnZVJlc3RvcmVOb3RpZmljYXRpb24uaGFuZGxlUGFja2FnZVJlc3RvcmVGaW5pc2hlZChlKSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkubGlzdGVuZXIudW5yZXNvbHZlZERlcGVuZGVuY2llcy5zdWJzY3JpYmUoZSA9PiB0aGlzLnBhY2thZ2VSZXN0b3JlTm90aWZpY2F0aW9uLmhhbmRsZVVucmVzb2x2ZWREZXBlbmRlbmNpZXMoZSkpKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmxpc3RlbmVyLmV2ZW50c1xuICAgICAgICAgICAgLmZpbHRlcih6ID0+IHouRXZlbnQgPT09IFwibG9nXCIpXG4gICAgICAgICAgICAuZmlsdGVyKHogPT4gXy5pbmNsdWRlcyh6LkJvZHkuTmFtZSwgXCJQYWNrYWdlc1Jlc3RvcmVUb29sXCIpKVxuICAgICAgICAgICAgLmZpbHRlcih6ID0+IHouQm9keS5NZXNzYWdlLnN0YXJ0c1dpdGgoXCJJbnN0YWxsaW5nXCIpKVxuICAgICAgICAgICAgLnN1YnNjcmliZShlID0+IHRoaXMucGFja2FnZVJlc3RvcmVOb3RpZmljYXRpb24uaGFuZGxlRXZlbnRzKGUpKSk7XG4gICAgfVxuICAgIGRpc3Bvc2UoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfVxufVxuY2xhc3MgUGFja2FnZVJlc3RvcmVOb3RpZmljYXRpb24ge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmhhbmRsZVBhY2thZ2VSZXN0b3JlU3RhcnRlZCA9IChldmVudCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5wYWNrYWdlUmVzdG9yZVN0YXJ0ZWQrKztcbiAgICAgICAgICAgIGlmICh0aGlzLm5vdGlmaWNhdGlvbi5pc0Rpc21pc3NlZCgpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5ub3RpZmljYXRpb24uc2hvdyhcIlBhY2thZ2UgcmVzdG9yZSBzdGFydGVkXCIsIFwiU3RhcnRpbmcuLlwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5oYW5kbGVVbnJlc29sdmVkRGVwZW5kZW5jaWVzID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5ub3RpZmljYXRpb24uaXNEaXNtaXNzZWQoKSkge1xuICAgICAgICAgICAgICAgIHRoaXMubm90aWZpY2F0aW9uLnNob3coXCJQYWNrYWdlIHJlc3RvcmUgc3RhcnRlZFwiLCBcIlN0YXJ0aW5nLi5cIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZXZlbnQuRmlsZU5hbWUpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBwcm9qZWN0TmFtZSA9IHRoaXMuZmluZFByb2plY3ROYW1lRnJvbUZpbGVOYW1lKGV2ZW50LkZpbGVOYW1lKTtcbiAgICAgICAgICAgICAgICBpZiAoIV8uc29tZSh0aGlzLmtub3duUHJvamVjdHMsIChrbm93blByb2plY3QpID0+IHsgcmV0dXJuIGtub3duUHJvamVjdCA9PT0gcHJvamVjdE5hbWU7IH0pKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMua25vd25Qcm9qZWN0cy5wdXNoKHByb2plY3ROYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5ub3RpZmljYXRpb24uYWRkRGV0YWlsKGBVbnJlc29sdmVkIGRlcGVuZGVuY2llcyBmb3IgJHtwcm9qZWN0TmFtZX06YCwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChldmVudC5VbnJlc29sdmVkRGVwZW5kZW5jaWVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBldmVudC5VbnJlc29sdmVkRGVwZW5kZW5jaWVzLmZvckVhY2goZGVwID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm5vdGlmaWNhdGlvbi5hZGREZXRhaWwoYCAtICR7ZGVwLk5hbWV9ICR7ZGVwLlZlcnNpb259YCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5oYW5kbGVQYWNrYWdlUmVzdG9yZUZpbmlzaGVkID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICB0aGlzLnBhY2thZ2VSZXN0b3JlRmluaXNoZWQrKztcbiAgICAgICAgICAgIGlmICh0aGlzLnBhY2thZ2VSZXN0b3JlU3RhcnRlZCA9PT0gdGhpcy5wYWNrYWdlUmVzdG9yZUZpbmlzaGVkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5ub3RpZmljYXRpb24uc2V0U3VjY2Vzc2Z1bEFuZERpc21pc3MoXCJQYWNrYWdlIHJlc3RvcmUgZmluaXNoZWQuXCIpO1xuICAgICAgICAgICAgICAgIHRoaXMucGFja2FnZVJlc3RvcmVTdGFydGVkID0gMDtcbiAgICAgICAgICAgICAgICB0aGlzLnBhY2thZ2VSZXN0b3JlRmluaXNoZWQgPSAwO1xuICAgICAgICAgICAgICAgIHRoaXMua25vd25Qcm9qZWN0cyA9IFtdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICB0aGlzLmhhbmRsZUV2ZW50cyA9IChldmVudCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5zZXRQYWNrYWdlSW5zdGFsbGVkKGV2ZW50LkJvZHkuTWVzc2FnZSk7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMubm90aWZpY2F0aW9uID0gbmV3IE9tbmlOb3RpZmljYXRpb24oKTtcbiAgICAgICAgdGhpcy5wYWNrYWdlUmVzdG9yZVN0YXJ0ZWQgPSAwO1xuICAgICAgICB0aGlzLnBhY2thZ2VSZXN0b3JlRmluaXNoZWQgPSAwO1xuICAgICAgICB0aGlzLmtub3duUHJvamVjdHMgPSBbXTtcbiAgICB9XG4gICAgZmluZFByb2plY3ROYW1lRnJvbUZpbGVOYW1lKGZpbGVOYW1lKSB7XG4gICAgICAgIGNvbnN0IHNwbGl0ID0gZmlsZU5hbWUuc3BsaXQocGF0aC5zZXApO1xuICAgICAgICBjb25zdCBwcm9qZWN0TmFtZSA9IHNwbGl0W3NwbGl0Lmxlbmd0aCAtIDJdO1xuICAgICAgICByZXR1cm4gcHJvamVjdE5hbWU7XG4gICAgfVxuICAgIHNldFBhY2thZ2VJbnN0YWxsZWQobWVzc2FnZSkge1xuICAgICAgICBjb25zdCBtYXRjaCA9IG1lc3NhZ2UubWF0Y2goL0luc3RhbGxpbmcgKFthLXpBLVouXSopIChbXFxEP1xcZD8uPy0/XSopLyk7XG4gICAgICAgIGNvbnN0IGRldGFpbExpbmVzID0gdGhpcy5ub3RpZmljYXRpb24uZ2V0RGV0YWlsRWxlbWVudCgpLmNoaWxkcmVuKFwiLmxpbmVcIik7XG4gICAgICAgIGlmICghbWF0Y2ggfHwgbWF0Y2gubGVuZ3RoIDwgMylcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgXy5mb3JFYWNoKGRldGFpbExpbmVzLCBsaW5lID0+IHtcbiAgICAgICAgICAgIGlmIChsaW5lLnRleHRDb250ZW50LnN0YXJ0c1dpdGgoYCAtICR7bWF0Y2hbMV19IGApKSB7XG4gICAgICAgICAgICAgICAgbGluZS50ZXh0Q29udGVudCA9IGBJbnN0YWxsZWQgJHttYXRjaFsxXX0gJHttYXRjaFsyXX1gO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG59XG5jbGFzcyBPbW5pTm90aWZpY2F0aW9uIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5kaXNtaXNzZWQgPSB0cnVlO1xuICAgIH1cbiAgICBhZGREZXRhaWwoZGV0YWlsLCBuZXdsaW5lKSB7XG4gICAgICAgIGNvbnN0IGRldGFpbHMgPSB0aGlzLmdldERldGFpbEVsZW1lbnQoKTtcbiAgICAgICAgaWYgKCFkZXRhaWwpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGlmIChuZXdsaW5lKVxuICAgICAgICAgICAgZGV0YWlscy5hcHBlbmQoXCI8YnIgLz5cIik7XG4gICAgICAgIGRldGFpbHMuYXBwZW5kKGA8ZGl2IGNsYXNzPVwibGluZVwiPiR7ZGV0YWlsfTwvZGl2PmApO1xuICAgIH1cbiAgICBzaG93KG1lc3NhZ2UsIGRldGFpbCkge1xuICAgICAgICB0aGlzLmF0b21Ob3RpZmljYXRpb24gPSBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkSW5mbyhtZXNzYWdlLCB7IGRldGFpbDogZGV0YWlsLCBkaXNtaXNzYWJsZTogdHJ1ZSB9KTtcbiAgICAgICAgdGhpcy5kaXNtaXNzZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5hdG9tTm90aWZpY2F0aW9uLm9uRGlkRGlzbWlzcyhub3RpZmljYXRpb24gPT4ge1xuICAgICAgICAgICAgdGhpcy5kaXNtaXNzZWQgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5pc0JlaW5nRGlzbWlzc2VkID0gZmFsc2U7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBzZXRTdWNjZXNzZnVsQW5kRGlzbWlzcyhtZXNzYWdlKSB7XG4gICAgICAgIGlmICh0aGlzLmlzQmVpbmdEaXNtaXNzZWQpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHRoaXMuYWRkRGV0YWlsKG1lc3NhZ2UsIHRydWUpO1xuICAgICAgICBjb25zdCBkb21Ob3RpZmljYXRpb24gPSAkKGF0b20udmlld3MuZ2V0Vmlldyh0aGlzLmF0b21Ob3RpZmljYXRpb24pKTtcbiAgICAgICAgZG9tTm90aWZpY2F0aW9uLnJlbW92ZUNsYXNzKFwiaW5mb1wiKTtcbiAgICAgICAgZG9tTm90aWZpY2F0aW9uLnJlbW92ZUNsYXNzKFwiaWNvbi1pbmZvXCIpO1xuICAgICAgICBkb21Ob3RpZmljYXRpb24uYWRkQ2xhc3MoXCJzdWNjZXNzXCIpO1xuICAgICAgICBkb21Ob3RpZmljYXRpb24uYWRkQ2xhc3MoXCJpY29uLWNoZWNrXCIpO1xuICAgICAgICB0aGlzLmlzQmVpbmdEaXNtaXNzZWQgPSB0cnVlO1xuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHsgdGhpcy5kaXNtaXNzKCk7IH0sIDIwMDApO1xuICAgIH1cbiAgICBpc0Rpc21pc3NlZCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGlzbWlzc2VkO1xuICAgIH1cbiAgICBkaXNtaXNzKCkge1xuICAgICAgICB0aGlzLmF0b21Ob3RpZmljYXRpb24uZGlzbWlzcygpO1xuICAgIH1cbiAgICBnZXREZXRhaWxFbGVtZW50KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRGcm9tRG9tKCQoYXRvbS52aWV3cy5nZXRWaWV3KHRoaXMuYXRvbU5vdGlmaWNhdGlvbikpLCBcIi5jb250ZW50IC5kZXRhaWwgLmRldGFpbC1jb250ZW50XCIpO1xuICAgIH1cbiAgICBnZXRGcm9tRG9tKGVsZW1lbnQsIHNlbGVjdG9yKSB7XG4gICAgICAgIGNvbnN0IGVsID0gZWxlbWVudFswXTtcbiAgICAgICAgaWYgKCFlbClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3QgZm91bmQgPSBlbC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKTtcbiAgICAgICAgcmV0dXJuICQoZm91bmRbMF0pO1xuICAgIH1cbn1cbmV4cG9ydCBjb25zdCBub3RpZmljYXRpb25IYW5kbGVyID0gbmV3IE5vdGlmaWNhdGlvbkhhbmRsZXI7XG4iLCJpbXBvcnQge01vZGVscywgU3RkaW99IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XHJcbmltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcclxuaW1wb3J0IHtPbW5pfSBmcm9tIFwiLi4vc2VydmVyL29tbmlcIjtcclxuaW1wb3J0IHtDb21wb3NpdGVEaXNwb3NhYmxlfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xyXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gXCJwYXRoXCI7XHJcbmNvbnN0ICQ6IEpRdWVyeVN0YXRpYyA9IHJlcXVpcmUoXCJqcXVlcnlcIik7XHJcblxyXG5jbGFzcyBOb3RpZmljYXRpb25IYW5kbGVyIGltcGxlbWVudHMgSUZlYXR1cmUge1xyXG4gICAgcHJpdmF0ZSBkaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xyXG4gICAgcHJpdmF0ZSBwYWNrYWdlUmVzdG9yZU5vdGlmaWNhdGlvbjogUGFja2FnZVJlc3RvcmVOb3RpZmljYXRpb247XHJcblxyXG4gICAgcHVibGljIGFjdGl2YXRlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcblxyXG4gICAgICAgIHRoaXMucGFja2FnZVJlc3RvcmVOb3RpZmljYXRpb24gPSBuZXcgUGFja2FnZVJlc3RvcmVOb3RpZmljYXRpb24oKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmxpc3RlbmVyLnBhY2thZ2VSZXN0b3JlU3RhcnRlZC5zdWJzY3JpYmUoZSA9PlxyXG4gICAgICAgICAgICB0aGlzLnBhY2thZ2VSZXN0b3JlTm90aWZpY2F0aW9uLmhhbmRsZVBhY2thZ2VSZXN0b3JlU3RhcnRlZChlKSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkubGlzdGVuZXIucGFja2FnZVJlc3RvcmVGaW5pc2hlZC5zdWJzY3JpYmUoZSA9PlxyXG4gICAgICAgICAgICB0aGlzLnBhY2thZ2VSZXN0b3JlTm90aWZpY2F0aW9uLmhhbmRsZVBhY2thZ2VSZXN0b3JlRmluaXNoZWQoZSkpKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmxpc3RlbmVyLnVucmVzb2x2ZWREZXBlbmRlbmNpZXMuc3Vic2NyaWJlKGUgPT5cclxuICAgICAgICAgICAgdGhpcy5wYWNrYWdlUmVzdG9yZU5vdGlmaWNhdGlvbi5oYW5kbGVVbnJlc29sdmVkRGVwZW5kZW5jaWVzKGUpKSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5saXN0ZW5lci5ldmVudHNcclxuICAgICAgICAgICAgLmZpbHRlcih6ID0+IHouRXZlbnQgPT09IFwibG9nXCIpXHJcbiAgICAgICAgICAgIC5maWx0ZXIoeiA9PiBfLmluY2x1ZGVzKHouQm9keS5OYW1lLCBcIlBhY2thZ2VzUmVzdG9yZVRvb2xcIikpXHJcbiAgICAgICAgICAgIC5maWx0ZXIoeiA9PiB6LkJvZHkuTWVzc2FnZS5zdGFydHNXaXRoKFwiSW5zdGFsbGluZ1wiKSlcclxuICAgICAgICAgICAgLnN1YnNjcmliZShlID0+IHRoaXMucGFja2FnZVJlc3RvcmVOb3RpZmljYXRpb24uaGFuZGxlRXZlbnRzKGUpKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVxdWlyZWQgPSB0cnVlO1xyXG4gICAgcHVibGljIHRpdGxlID0gXCJQYWNrYWdlIFJlc3RvcmUgTm90aWZpY2F0aW9uc1wiO1xyXG4gICAgcHVibGljIGRlc2NyaXB0aW9uID0gXCJBZGRzIHN1cHBvcnQgdG8gc2hvdyBwYWNrYWdlIHJlc3RvcmUgcHJvZ3Jlc3MsIHdoZW4gdGhlIHNlcnZlciBpbml0aWF0ZXMgYSByZXN0b3JlIG9wZXJhdGlvbi5cIjtcclxufVxyXG5cclxuY2xhc3MgUGFja2FnZVJlc3RvcmVOb3RpZmljYXRpb24ge1xyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy5ub3RpZmljYXRpb24gPSBuZXcgT21uaU5vdGlmaWNhdGlvbigpO1xyXG4gICAgICAgIHRoaXMucGFja2FnZVJlc3RvcmVTdGFydGVkID0gMDtcclxuICAgICAgICB0aGlzLnBhY2thZ2VSZXN0b3JlRmluaXNoZWQgPSAwO1xyXG4gICAgICAgIHRoaXMua25vd25Qcm9qZWN0cyA9IFtdO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgbm90aWZpY2F0aW9uOiBPbW5pTm90aWZpY2F0aW9uO1xyXG4gICAgcHJpdmF0ZSBwYWNrYWdlUmVzdG9yZVN0YXJ0ZWQ6IG51bWJlcjtcclxuICAgIHByaXZhdGUgcGFja2FnZVJlc3RvcmVGaW5pc2hlZDogbnVtYmVyO1xyXG4gICAgcHJpdmF0ZSBrbm93blByb2plY3RzOiBBcnJheTxzdHJpbmc+O1xyXG5cclxuICAgIHB1YmxpYyBoYW5kbGVQYWNrYWdlUmVzdG9yZVN0YXJ0ZWQgPSAoZXZlbnQ6IE1vZGVscy5QYWNrYWdlUmVzdG9yZU1lc3NhZ2UpID0+IHtcclxuICAgICAgICAvLyBDb3VudCBob3cgbWFueSBvZiB0aGVzZSB3ZSBnZXQgc28gd2Uga25vdyB3aGVuIHRvIGRpc21pc3MgdGhlIG5vdGlmaWNhdGlvblxyXG4gICAgICAgIHRoaXMucGFja2FnZVJlc3RvcmVTdGFydGVkKys7XHJcbiAgICAgICAgaWYgKHRoaXMubm90aWZpY2F0aW9uLmlzRGlzbWlzc2VkKCkpIHtcclxuICAgICAgICAgICAgdGhpcy5ub3RpZmljYXRpb24uc2hvdyhcIlBhY2thZ2UgcmVzdG9yZSBzdGFydGVkXCIsIFwiU3RhcnRpbmcuLlwiKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIHB1YmxpYyBoYW5kbGVVbnJlc29sdmVkRGVwZW5kZW5jaWVzID0gKGV2ZW50OiBNb2RlbHMuVW5yZXNvbHZlZERlcGVuZGVuY2llc01lc3NhZ2UpID0+IHtcclxuICAgICAgICAvLyBTb21ldGltZXMgVW5yZXNvbHZlZERlcGVuZGVuY2llcyBldmVudCBpcyBzZW50IGJlZm9yZSBQYWNrYWdlUmVzdG9yZVN0YXJ0ZWRcclxuICAgICAgICBpZiAodGhpcy5ub3RpZmljYXRpb24uaXNEaXNtaXNzZWQoKSkge1xyXG4gICAgICAgICAgICB0aGlzLm5vdGlmaWNhdGlvbi5zaG93KFwiUGFja2FnZSByZXN0b3JlIHN0YXJ0ZWRcIiwgXCJTdGFydGluZy4uXCIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGV2ZW50LkZpbGVOYW1lKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHByb2plY3ROYW1lID0gdGhpcy5maW5kUHJvamVjdE5hbWVGcm9tRmlsZU5hbWUoZXZlbnQuRmlsZU5hbWUpO1xyXG4gICAgICAgICAgICAvLyBDbGllbnQgZ2V0cyBtb3JlIHRoYW4gb25lIG9mIGVhY2ggVW5yZXNvbHZlZERlcGVuZGVuY2llcyBldmVudHMgZm9yIGVhY2ggcHJvamVjdFxyXG4gICAgICAgICAgICAvLyBEb25cInQgc2hvdyBtdWx0aXBsZSBpbnN0YW5jZXMgb2YgYSBwcm9qZWN0IGluIHRoZSBub3RpZmljYXRpb25cclxuICAgICAgICAgICAgaWYgKCFfLnNvbWUodGhpcy5rbm93blByb2plY3RzLCAoa25vd25Qcm9qZWN0KSA9PiB7IHJldHVybiBrbm93blByb2plY3QgPT09IHByb2plY3ROYW1lOyB9KSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5rbm93blByb2plY3RzLnB1c2gocHJvamVjdE5hbWUpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5ub3RpZmljYXRpb24uYWRkRGV0YWlsKGBVbnJlc29sdmVkIGRlcGVuZGVuY2llcyBmb3IgJHtwcm9qZWN0TmFtZX06YCwgdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQuVW5yZXNvbHZlZERlcGVuZGVuY2llcykge1xyXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LlVucmVzb2x2ZWREZXBlbmRlbmNpZXMuZm9yRWFjaChkZXAgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm5vdGlmaWNhdGlvbi5hZGREZXRhaWwoYCAtICR7ZGVwLk5hbWV9ICR7ZGVwLlZlcnNpb259YCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIHB1YmxpYyBoYW5kbGVQYWNrYWdlUmVzdG9yZUZpbmlzaGVkID0gKGV2ZW50OiBNb2RlbHMuUGFja2FnZVJlc3RvcmVNZXNzYWdlKSA9PiB7XHJcbiAgICAgICAgLy8gQ291bnQgaG93IG1hbnkgb2YgdGhlc2Ugd2UgZ2V0IHNvIHdlIGtub3cgd2hlbiB0byBkaXNtaXNzIHRoZSBub3RpZmljYXRpb25cclxuICAgICAgICB0aGlzLnBhY2thZ2VSZXN0b3JlRmluaXNoZWQrKztcclxuICAgICAgICBpZiAodGhpcy5wYWNrYWdlUmVzdG9yZVN0YXJ0ZWQgPT09IHRoaXMucGFja2FnZVJlc3RvcmVGaW5pc2hlZCkge1xyXG4gICAgICAgICAgICB0aGlzLm5vdGlmaWNhdGlvbi5zZXRTdWNjZXNzZnVsQW5kRGlzbWlzcyhcIlBhY2thZ2UgcmVzdG9yZSBmaW5pc2hlZC5cIik7XHJcbiAgICAgICAgICAgIHRoaXMucGFja2FnZVJlc3RvcmVTdGFydGVkID0gMDtcclxuICAgICAgICAgICAgdGhpcy5wYWNrYWdlUmVzdG9yZUZpbmlzaGVkID0gMDtcclxuICAgICAgICAgICAgdGhpcy5rbm93blByb2plY3RzID0gW107XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBwdWJsaWMgaGFuZGxlRXZlbnRzID0gKGV2ZW50OiBTdGRpby5Qcm90b2NvbC5FdmVudFBhY2tldCkgPT4ge1xyXG4gICAgICAgIHRoaXMuc2V0UGFja2FnZUluc3RhbGxlZChldmVudC5Cb2R5Lk1lc3NhZ2UpO1xyXG4gICAgfTtcclxuXHJcbiAgICBwcml2YXRlIGZpbmRQcm9qZWN0TmFtZUZyb21GaWxlTmFtZShmaWxlTmFtZTogc3RyaW5nKTogc3RyaW5nIHtcclxuICAgICAgICBjb25zdCBzcGxpdCA9IGZpbGVOYW1lLnNwbGl0KHBhdGguc2VwKTtcclxuICAgICAgICBjb25zdCBwcm9qZWN0TmFtZSA9IHNwbGl0W3NwbGl0Lmxlbmd0aCAtIDJdO1xyXG4gICAgICAgIHJldHVybiBwcm9qZWN0TmFtZTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHNldFBhY2thZ2VJbnN0YWxsZWQobWVzc2FnZTogc3RyaW5nKSB7XHJcbiAgICAgICAgY29uc3QgbWF0Y2ggPSBtZXNzYWdlLm1hdGNoKC9JbnN0YWxsaW5nIChbYS16QS1aLl0qKSAoW1xcRD9cXGQ/Lj8tP10qKS8pO1xyXG4gICAgICAgIGNvbnN0IGRldGFpbExpbmVzID0gdGhpcy5ub3RpZmljYXRpb24uZ2V0RGV0YWlsRWxlbWVudCgpLmNoaWxkcmVuKFwiLmxpbmVcIik7XHJcbiAgICAgICAgaWYgKCFtYXRjaCB8fCBtYXRjaC5sZW5ndGggPCAzKSByZXR1cm47XHJcbiAgICAgICAgXy5mb3JFYWNoKGRldGFpbExpbmVzLCBsaW5lID0+IHtcclxuICAgICAgICAgICAgaWYgKGxpbmUudGV4dENvbnRlbnQuc3RhcnRzV2l0aChgIC0gJHttYXRjaFsxXX0gYCkpIHtcclxuICAgICAgICAgICAgICAgIGxpbmUudGV4dENvbnRlbnQgPSBgSW5zdGFsbGVkICR7bWF0Y2hbMV19ICR7bWF0Y2hbMl19YDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59XHJcblxyXG5jbGFzcyBPbW5pTm90aWZpY2F0aW9uIHtcclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHRoaXMuZGlzbWlzc2VkID0gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGF0b21Ob3RpZmljYXRpb246IEF0b20uTm90aWZpY2F0aW9uO1xyXG4gICAgcHJpdmF0ZSBkaXNtaXNzZWQ6IGJvb2xlYW47XHJcbiAgICBwcml2YXRlIGlzQmVpbmdEaXNtaXNzZWQ6IGJvb2xlYW47XHJcblxyXG4gICAgcHVibGljIGFkZERldGFpbChkZXRhaWw6IHN0cmluZywgbmV3bGluZT86IGJvb2xlYW4pIHtcclxuICAgICAgICBjb25zdCBkZXRhaWxzID0gdGhpcy5nZXREZXRhaWxFbGVtZW50KCk7XHJcbiAgICAgICAgaWYgKCFkZXRhaWwpIHJldHVybjtcclxuICAgICAgICBpZiAobmV3bGluZSkgZGV0YWlscy5hcHBlbmQoXCI8YnIgLz5cIik7XHJcbiAgICAgICAgZGV0YWlscy5hcHBlbmQoYDxkaXYgY2xhc3M9XCJsaW5lXCI+JHtkZXRhaWx9PC9kaXY+YCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHNob3cobWVzc2FnZTogc3RyaW5nLCBkZXRhaWw6IHN0cmluZykge1xyXG4gICAgICAgIHRoaXMuYXRvbU5vdGlmaWNhdGlvbiA9IGF0b20ubm90aWZpY2F0aW9ucy5hZGRJbmZvKG1lc3NhZ2UsIHsgZGV0YWlsOiBkZXRhaWwsIGRpc21pc3NhYmxlOiB0cnVlIH0pO1xyXG4gICAgICAgIHRoaXMuZGlzbWlzc2VkID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5hdG9tTm90aWZpY2F0aW9uLm9uRGlkRGlzbWlzcyhub3RpZmljYXRpb24gPT4ge1xyXG4gICAgICAgICAgICB0aGlzLmRpc21pc3NlZCA9IHRydWU7XHJcbiAgICAgICAgICAgIHRoaXMuaXNCZWluZ0Rpc21pc3NlZCA9IGZhbHNlO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzZXRTdWNjZXNzZnVsQW5kRGlzbWlzcyhtZXNzYWdlOiBzdHJpbmcpIHtcclxuICAgICAgICBpZiAodGhpcy5pc0JlaW5nRGlzbWlzc2VkKSByZXR1cm47XHJcbiAgICAgICAgdGhpcy5hZGREZXRhaWwobWVzc2FnZSwgdHJ1ZSk7XHJcbiAgICAgICAgY29uc3QgZG9tTm90aWZpY2F0aW9uID0gJChhdG9tLnZpZXdzLmdldFZpZXcodGhpcy5hdG9tTm90aWZpY2F0aW9uKSk7XHJcbiAgICAgICAgZG9tTm90aWZpY2F0aW9uLnJlbW92ZUNsYXNzKFwiaW5mb1wiKTtcclxuICAgICAgICBkb21Ob3RpZmljYXRpb24ucmVtb3ZlQ2xhc3MoXCJpY29uLWluZm9cIik7XHJcbiAgICAgICAgZG9tTm90aWZpY2F0aW9uLmFkZENsYXNzKFwic3VjY2Vzc1wiKTtcclxuICAgICAgICBkb21Ob3RpZmljYXRpb24uYWRkQ2xhc3MoXCJpY29uLWNoZWNrXCIpO1xyXG4gICAgICAgIHRoaXMuaXNCZWluZ0Rpc21pc3NlZCA9IHRydWU7XHJcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7IHRoaXMuZGlzbWlzcygpOyB9LCAyMDAwKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgaXNEaXNtaXNzZWQoKTogYm9vbGVhbiB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZGlzbWlzc2VkO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZGlzbWlzcygpIHtcclxuICAgICAgICB0aGlzLmF0b21Ob3RpZmljYXRpb24uZGlzbWlzcygpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXREZXRhaWxFbGVtZW50KCk6IEpRdWVyeSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0RnJvbURvbSgkKGF0b20udmlld3MuZ2V0Vmlldyh0aGlzLmF0b21Ob3RpZmljYXRpb24pKSwgXCIuY29udGVudCAuZGV0YWlsIC5kZXRhaWwtY29udGVudFwiKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGdldEZyb21Eb20oZWxlbWVudDogSlF1ZXJ5LCBzZWxlY3Rvcjogc3RyaW5nKTogSlF1ZXJ5IHtcclxuICAgICAgICBjb25zdCBlbCA9IGVsZW1lbnRbMF07XHJcbiAgICAgICAgaWYgKCFlbCkgcmV0dXJuO1xyXG4gICAgICAgIGNvbnN0IGZvdW5kID0gKDxhbnk+ZWwpLnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpO1xyXG4gICAgICAgIHJldHVybiAkKGZvdW5kWzBdKTtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IG5vdGlmaWNhdGlvbkhhbmRsZXIgPSBuZXcgTm90aWZpY2F0aW9uSGFuZGxlcjtcclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
