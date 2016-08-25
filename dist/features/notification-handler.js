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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9ub3RpZmljYXRpb24taGFuZGxlci5qcyIsImxpYi9mZWF0dXJlcy9ub3RpZmljYXRpb24taGFuZGxlci50cyJdLCJuYW1lcyI6WyJwYXRoIiwiJCIsInJlcXVpcmUiLCJOb3RpZmljYXRpb25IYW5kbGVyIiwicmVxdWlyZWQiLCJ0aXRsZSIsImRlc2NyaXB0aW9uIiwiZGlzcG9zYWJsZSIsInBhY2thZ2VSZXN0b3JlTm90aWZpY2F0aW9uIiwiUGFja2FnZVJlc3RvcmVOb3RpZmljYXRpb24iLCJhZGQiLCJsaXN0ZW5lciIsInBhY2thZ2VSZXN0b3JlU3RhcnRlZCIsInN1YnNjcmliZSIsImhhbmRsZVBhY2thZ2VSZXN0b3JlU3RhcnRlZCIsImUiLCJwYWNrYWdlUmVzdG9yZUZpbmlzaGVkIiwiaGFuZGxlUGFja2FnZVJlc3RvcmVGaW5pc2hlZCIsInVucmVzb2x2ZWREZXBlbmRlbmNpZXMiLCJoYW5kbGVVbnJlc29sdmVkRGVwZW5kZW5jaWVzIiwiZXZlbnRzIiwiZmlsdGVyIiwieiIsIkV2ZW50IiwiaW5jbHVkZXMiLCJCb2R5IiwiTmFtZSIsIk1lc3NhZ2UiLCJzdGFydHNXaXRoIiwiaGFuZGxlRXZlbnRzIiwiZGlzcG9zZSIsImV2ZW50Iiwibm90aWZpY2F0aW9uIiwiaXNEaXNtaXNzZWQiLCJzaG93IiwiRmlsZU5hbWUiLCJwcm9qZWN0TmFtZSIsImZpbmRQcm9qZWN0TmFtZUZyb21GaWxlTmFtZSIsInNvbWUiLCJrbm93blByb2plY3RzIiwia25vd25Qcm9qZWN0IiwicHVzaCIsImFkZERldGFpbCIsIlVucmVzb2x2ZWREZXBlbmRlbmNpZXMiLCJmb3JFYWNoIiwiZGVwIiwiVmVyc2lvbiIsInNldFN1Y2Nlc3NmdWxBbmREaXNtaXNzIiwic2V0UGFja2FnZUluc3RhbGxlZCIsIk9tbmlOb3RpZmljYXRpb24iLCJmaWxlTmFtZSIsInNwbGl0Iiwic2VwIiwibGVuZ3RoIiwibWVzc2FnZSIsIm1hdGNoIiwiZGV0YWlsTGluZXMiLCJnZXREZXRhaWxFbGVtZW50IiwiY2hpbGRyZW4iLCJsaW5lIiwidGV4dENvbnRlbnQiLCJkaXNtaXNzZWQiLCJkZXRhaWwiLCJuZXdsaW5lIiwiZGV0YWlscyIsImFwcGVuZCIsImF0b21Ob3RpZmljYXRpb24iLCJhdG9tIiwibm90aWZpY2F0aW9ucyIsImFkZEluZm8iLCJkaXNtaXNzYWJsZSIsIm9uRGlkRGlzbWlzcyIsImlzQmVpbmdEaXNtaXNzZWQiLCJkb21Ob3RpZmljYXRpb24iLCJ2aWV3cyIsImdldFZpZXciLCJyZW1vdmVDbGFzcyIsImFkZENsYXNzIiwic2V0VGltZW91dCIsImRpc21pc3MiLCJnZXRGcm9tRG9tIiwiZWxlbWVudCIsInNlbGVjdG9yIiwiZWwiLCJmb3VuZCIsInF1ZXJ5U2VsZWN0b3JBbGwiLCJub3RpZmljYXRpb25IYW5kbGVyIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7OztBQUNBOztBQUNBOztBQUNBOztJQ0NZQSxJOzs7Ozs7OztBQUNaLElBQU1DLElBQWtCQyxRQUFRLFFBQVIsQ0FBeEI7O0lBRUFDLG1CO0FBQUEsbUNBQUE7QUFBQTs7QUE2QlcsYUFBQUMsUUFBQSxHQUFXLElBQVg7QUFDQSxhQUFBQyxLQUFBLEdBQVEsK0JBQVI7QUFDQSxhQUFBQyxXQUFBLEdBQWMsK0ZBQWQ7QUFDVjs7OzttQ0E1QmtCO0FBQUE7O0FBQ1gsaUJBQUtDLFVBQUwsR0FBa0Isd0NBQWxCO0FBRUEsaUJBQUtDLDBCQUFMLEdBQWtDLElBQUlDLDBCQUFKLEVBQWxDO0FBRUEsaUJBQUtGLFVBQUwsQ0FBZ0JHLEdBQWhCLENBQW9CLFdBQUtDLFFBQUwsQ0FBY0MscUJBQWQsQ0FBb0NDLFNBQXBDLENBQThDO0FBQUEsdUJBQzlELE1BQUtMLDBCQUFMLENBQWdDTSwyQkFBaEMsQ0FBNERDLENBQTVELENBRDhEO0FBQUEsYUFBOUMsQ0FBcEI7QUFHQSxpQkFBS1IsVUFBTCxDQUFnQkcsR0FBaEIsQ0FBb0IsV0FBS0MsUUFBTCxDQUFjSyxzQkFBZCxDQUFxQ0gsU0FBckMsQ0FB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S0MsVUFBTCxDQUFnQi9FLEVBQUVrRSxLQUFLTyxLQUFMLENBQVdDLE9BQVgsQ0FBbUIsS0FBS1QsZ0JBQXhCLENBQUYsQ0FBaEIsRUFBOEQsa0NBQTlELENBQVA7QUFDSDs7O21DQUVrQmUsTyxFQUFpQkMsUSxFQUFnQjtBQUNoRCxnQkFBTUMsS0FBS0YsUUFBUSxDQUFSLENBQVg7QUFDQSxnQkFBSSxDQUFDRSxFQUFMLEVBQVM7QUFDVCxnQkFBTUMsUUFBY0QsR0FBSUUsZ0JBQUosQ0FBcUJILFFBQXJCLENBQXBCO0FBQ0EsbUJBQU9qRixFQUFFbUYsTUFBTSxDQUFOLENBQUYsQ0FBUDtBQUNIOzs7Ozs7QUFHRSxJQUFNRSxvREFBc0IsSUFBSW5GLG1CQUFKLEVBQTVCIiwiZmlsZSI6ImxpYi9mZWF0dXJlcy9ub3RpZmljYXRpb24taGFuZGxlci5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcbmltcG9ydCB7IE9tbmkgfSBmcm9tIFwiLi4vc2VydmVyL29tbmlcIjtcbmltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUgfSBmcm9tIFwidHMtZGlzcG9zYWJsZXNcIjtcbmltcG9ydCAqIGFzIHBhdGggZnJvbSBcInBhdGhcIjtcbmNvbnN0ICQgPSByZXF1aXJlKFwianF1ZXJ5XCIpO1xuY2xhc3MgTm90aWZpY2F0aW9uSGFuZGxlciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMucmVxdWlyZWQgPSB0cnVlO1xuICAgICAgICB0aGlzLnRpdGxlID0gXCJQYWNrYWdlIFJlc3RvcmUgTm90aWZpY2F0aW9uc1wiO1xuICAgICAgICB0aGlzLmRlc2NyaXB0aW9uID0gXCJBZGRzIHN1cHBvcnQgdG8gc2hvdyBwYWNrYWdlIHJlc3RvcmUgcHJvZ3Jlc3MsIHdoZW4gdGhlIHNlcnZlciBpbml0aWF0ZXMgYSByZXN0b3JlIG9wZXJhdGlvbi5cIjtcbiAgICB9XG4gICAgYWN0aXZhdGUoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIHRoaXMucGFja2FnZVJlc3RvcmVOb3RpZmljYXRpb24gPSBuZXcgUGFja2FnZVJlc3RvcmVOb3RpZmljYXRpb24oKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmxpc3RlbmVyLnBhY2thZ2VSZXN0b3JlU3RhcnRlZC5zdWJzY3JpYmUoZSA9PiB0aGlzLnBhY2thZ2VSZXN0b3JlTm90aWZpY2F0aW9uLmhhbmRsZVBhY2thZ2VSZXN0b3JlU3RhcnRlZChlKSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkubGlzdGVuZXIucGFja2FnZVJlc3RvcmVGaW5pc2hlZC5zdWJzY3JpYmUoZSA9PiB0aGlzLnBhY2thZ2VSZXN0b3JlTm90aWZpY2F0aW9uLmhhbmRsZVBhY2thZ2VSZXN0b3JlRmluaXNoZWQoZSkpKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmxpc3RlbmVyLnVucmVzb2x2ZWREZXBlbmRlbmNpZXMuc3Vic2NyaWJlKGUgPT4gdGhpcy5wYWNrYWdlUmVzdG9yZU5vdGlmaWNhdGlvbi5oYW5kbGVVbnJlc29sdmVkRGVwZW5kZW5jaWVzKGUpKSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5saXN0ZW5lci5ldmVudHNcbiAgICAgICAgICAgIC5maWx0ZXIoeiA9PiB6LkV2ZW50ID09PSBcImxvZ1wiKVxuICAgICAgICAgICAgLmZpbHRlcih6ID0+IF8uaW5jbHVkZXMoei5Cb2R5Lk5hbWUsIFwiUGFja2FnZXNSZXN0b3JlVG9vbFwiKSlcbiAgICAgICAgICAgIC5maWx0ZXIoeiA9PiB6LkJvZHkuTWVzc2FnZS5zdGFydHNXaXRoKFwiSW5zdGFsbGluZ1wiKSlcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoZSA9PiB0aGlzLnBhY2thZ2VSZXN0b3JlTm90aWZpY2F0aW9uLmhhbmRsZUV2ZW50cyhlKSkpO1xuICAgIH1cbiAgICBkaXNwb3NlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgIH1cbn1cbmNsYXNzIFBhY2thZ2VSZXN0b3JlTm90aWZpY2F0aW9uIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5oYW5kbGVQYWNrYWdlUmVzdG9yZVN0YXJ0ZWQgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIHRoaXMucGFja2FnZVJlc3RvcmVTdGFydGVkKys7XG4gICAgICAgICAgICBpZiAodGhpcy5ub3RpZmljYXRpb24uaXNEaXNtaXNzZWQoKSkge1xuICAgICAgICAgICAgICAgIHRoaXMubm90aWZpY2F0aW9uLnNob3coXCJQYWNrYWdlIHJlc3RvcmUgc3RhcnRlZFwiLCBcIlN0YXJ0aW5nLi5cIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuaGFuZGxlVW5yZXNvbHZlZERlcGVuZGVuY2llcyA9IChldmVudCkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMubm90aWZpY2F0aW9uLmlzRGlzbWlzc2VkKCkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm5vdGlmaWNhdGlvbi5zaG93KFwiUGFja2FnZSByZXN0b3JlIHN0YXJ0ZWRcIiwgXCJTdGFydGluZy4uXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGV2ZW50LkZpbGVOYW1lKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcHJvamVjdE5hbWUgPSB0aGlzLmZpbmRQcm9qZWN0TmFtZUZyb21GaWxlTmFtZShldmVudC5GaWxlTmFtZSk7XG4gICAgICAgICAgICAgICAgaWYgKCFfLnNvbWUodGhpcy5rbm93blByb2plY3RzLCAoa25vd25Qcm9qZWN0KSA9PiB7IHJldHVybiBrbm93blByb2plY3QgPT09IHByb2plY3ROYW1lOyB9KSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmtub3duUHJvamVjdHMucHVzaChwcm9qZWN0TmFtZSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubm90aWZpY2F0aW9uLmFkZERldGFpbChgVW5yZXNvbHZlZCBkZXBlbmRlbmNpZXMgZm9yICR7cHJvamVjdE5hbWV9OmAsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXZlbnQuVW5yZXNvbHZlZERlcGVuZGVuY2llcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnQuVW5yZXNvbHZlZERlcGVuZGVuY2llcy5mb3JFYWNoKGRlcCA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5ub3RpZmljYXRpb24uYWRkRGV0YWlsKGAgLSAke2RlcC5OYW1lfSAke2RlcC5WZXJzaW9ufWApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuaGFuZGxlUGFja2FnZVJlc3RvcmVGaW5pc2hlZCA9IChldmVudCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5wYWNrYWdlUmVzdG9yZUZpbmlzaGVkKys7XG4gICAgICAgICAgICBpZiAodGhpcy5wYWNrYWdlUmVzdG9yZVN0YXJ0ZWQgPT09IHRoaXMucGFja2FnZVJlc3RvcmVGaW5pc2hlZCkge1xuICAgICAgICAgICAgICAgIHRoaXMubm90aWZpY2F0aW9uLnNldFN1Y2Nlc3NmdWxBbmREaXNtaXNzKFwiUGFja2FnZSByZXN0b3JlIGZpbmlzaGVkLlwiKTtcbiAgICAgICAgICAgICAgICB0aGlzLnBhY2thZ2VSZXN0b3JlU3RhcnRlZCA9IDA7XG4gICAgICAgICAgICAgICAgdGhpcy5wYWNrYWdlUmVzdG9yZUZpbmlzaGVkID0gMDtcbiAgICAgICAgICAgICAgICB0aGlzLmtub3duUHJvamVjdHMgPSBbXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5oYW5kbGVFdmVudHMgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIHRoaXMuc2V0UGFja2FnZUluc3RhbGxlZChldmVudC5Cb2R5Lk1lc3NhZ2UpO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLm5vdGlmaWNhdGlvbiA9IG5ldyBPbW5pTm90aWZpY2F0aW9uKCk7XG4gICAgICAgIHRoaXMucGFja2FnZVJlc3RvcmVTdGFydGVkID0gMDtcbiAgICAgICAgdGhpcy5wYWNrYWdlUmVzdG9yZUZpbmlzaGVkID0gMDtcbiAgICAgICAgdGhpcy5rbm93blByb2plY3RzID0gW107XG4gICAgfVxuICAgIGZpbmRQcm9qZWN0TmFtZUZyb21GaWxlTmFtZShmaWxlTmFtZSkge1xuICAgICAgICBjb25zdCBzcGxpdCA9IGZpbGVOYW1lLnNwbGl0KHBhdGguc2VwKTtcbiAgICAgICAgY29uc3QgcHJvamVjdE5hbWUgPSBzcGxpdFtzcGxpdC5sZW5ndGggLSAyXTtcbiAgICAgICAgcmV0dXJuIHByb2plY3ROYW1lO1xuICAgIH1cbiAgICBzZXRQYWNrYWdlSW5zdGFsbGVkKG1lc3NhZ2UpIHtcbiAgICAgICAgY29uc3QgbWF0Y2ggPSBtZXNzYWdlLm1hdGNoKC9JbnN0YWxsaW5nIChbYS16QS1aLl0qKSAoW1xcRD9cXGQ/Lj8tP10qKS8pO1xuICAgICAgICBjb25zdCBkZXRhaWxMaW5lcyA9IHRoaXMubm90aWZpY2F0aW9uLmdldERldGFpbEVsZW1lbnQoKS5jaGlsZHJlbihcIi5saW5lXCIpO1xuICAgICAgICBpZiAoIW1hdGNoIHx8IG1hdGNoLmxlbmd0aCA8IDMpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIF8uZm9yRWFjaChkZXRhaWxMaW5lcywgbGluZSA9PiB7XG4gICAgICAgICAgICBpZiAobGluZS50ZXh0Q29udGVudC5zdGFydHNXaXRoKGAgLSAke21hdGNoWzFdfSBgKSkge1xuICAgICAgICAgICAgICAgIGxpbmUudGV4dENvbnRlbnQgPSBgSW5zdGFsbGVkICR7bWF0Y2hbMV19ICR7bWF0Y2hbMl19YDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxufVxuY2xhc3MgT21uaU5vdGlmaWNhdGlvbiB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuZGlzbWlzc2VkID0gdHJ1ZTtcbiAgICB9XG4gICAgYWRkRGV0YWlsKGRldGFpbCwgbmV3bGluZSkge1xuICAgICAgICBjb25zdCBkZXRhaWxzID0gdGhpcy5nZXREZXRhaWxFbGVtZW50KCk7XG4gICAgICAgIGlmICghZGV0YWlsKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBpZiAobmV3bGluZSlcbiAgICAgICAgICAgIGRldGFpbHMuYXBwZW5kKFwiPGJyIC8+XCIpO1xuICAgICAgICBkZXRhaWxzLmFwcGVuZChgPGRpdiBjbGFzcz1cImxpbmVcIj4ke2RldGFpbH08L2Rpdj5gKTtcbiAgICB9XG4gICAgc2hvdyhtZXNzYWdlLCBkZXRhaWwpIHtcbiAgICAgICAgdGhpcy5hdG9tTm90aWZpY2F0aW9uID0gYXRvbS5ub3RpZmljYXRpb25zLmFkZEluZm8obWVzc2FnZSwgeyBkZXRhaWw6IGRldGFpbCwgZGlzbWlzc2FibGU6IHRydWUgfSk7XG4gICAgICAgIHRoaXMuZGlzbWlzc2VkID0gZmFsc2U7XG4gICAgICAgIHRoaXMuYXRvbU5vdGlmaWNhdGlvbi5vbkRpZERpc21pc3Mobm90aWZpY2F0aW9uID0+IHtcbiAgICAgICAgICAgIHRoaXMuZGlzbWlzc2VkID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuaXNCZWluZ0Rpc21pc3NlZCA9IGZhbHNlO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgc2V0U3VjY2Vzc2Z1bEFuZERpc21pc3MobWVzc2FnZSkge1xuICAgICAgICBpZiAodGhpcy5pc0JlaW5nRGlzbWlzc2VkKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB0aGlzLmFkZERldGFpbChtZXNzYWdlLCB0cnVlKTtcbiAgICAgICAgY29uc3QgZG9tTm90aWZpY2F0aW9uID0gJChhdG9tLnZpZXdzLmdldFZpZXcodGhpcy5hdG9tTm90aWZpY2F0aW9uKSk7XG4gICAgICAgIGRvbU5vdGlmaWNhdGlvbi5yZW1vdmVDbGFzcyhcImluZm9cIik7XG4gICAgICAgIGRvbU5vdGlmaWNhdGlvbi5yZW1vdmVDbGFzcyhcImljb24taW5mb1wiKTtcbiAgICAgICAgZG9tTm90aWZpY2F0aW9uLmFkZENsYXNzKFwic3VjY2Vzc1wiKTtcbiAgICAgICAgZG9tTm90aWZpY2F0aW9uLmFkZENsYXNzKFwiaWNvbi1jaGVja1wiKTtcbiAgICAgICAgdGhpcy5pc0JlaW5nRGlzbWlzc2VkID0gdHJ1ZTtcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7IHRoaXMuZGlzbWlzcygpOyB9LCAyMDAwKTtcbiAgICB9XG4gICAgaXNEaXNtaXNzZWQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmRpc21pc3NlZDtcbiAgICB9XG4gICAgZGlzbWlzcygpIHtcbiAgICAgICAgdGhpcy5hdG9tTm90aWZpY2F0aW9uLmRpc21pc3MoKTtcbiAgICB9XG4gICAgZ2V0RGV0YWlsRWxlbWVudCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0RnJvbURvbSgkKGF0b20udmlld3MuZ2V0Vmlldyh0aGlzLmF0b21Ob3RpZmljYXRpb24pKSwgXCIuY29udGVudCAuZGV0YWlsIC5kZXRhaWwtY29udGVudFwiKTtcbiAgICB9XG4gICAgZ2V0RnJvbURvbShlbGVtZW50LCBzZWxlY3Rvcikge1xuICAgICAgICBjb25zdCBlbCA9IGVsZW1lbnRbMF07XG4gICAgICAgIGlmICghZWwpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNvbnN0IGZvdW5kID0gZWwucXVlcnlTZWxlY3RvckFsbChzZWxlY3Rvcik7XG4gICAgICAgIHJldHVybiAkKGZvdW5kWzBdKTtcbiAgICB9XG59XG5leHBvcnQgY29uc3Qgbm90aWZpY2F0aW9uSGFuZGxlciA9IG5ldyBOb3RpZmljYXRpb25IYW5kbGVyO1xuIiwiaW1wb3J0IHtNb2RlbHMsIFN0ZGlvfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xyXG5pbXBvcnQgXyBmcm9tIFwibG9kYXNoXCI7XHJcbmltcG9ydCB7T21uaX0gZnJvbSBcIi4uL3NlcnZlci9vbW5pXCI7XHJcbmltcG9ydCB7Q29tcG9zaXRlRGlzcG9zYWJsZX0gZnJvbSBcInRzLWRpc3Bvc2FibGVzXCI7XHJcbmltcG9ydCAqIGFzIHBhdGggZnJvbSBcInBhdGhcIjtcclxuY29uc3QgJDogSlF1ZXJ5U3RhdGljID0gcmVxdWlyZShcImpxdWVyeVwiKTtcclxuXHJcbmNsYXNzIE5vdGlmaWNhdGlvbkhhbmRsZXIgaW1wbGVtZW50cyBJRmVhdHVyZSB7XHJcbiAgICBwcml2YXRlIGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XHJcbiAgICBwcml2YXRlIHBhY2thZ2VSZXN0b3JlTm90aWZpY2F0aW9uOiBQYWNrYWdlUmVzdG9yZU5vdGlmaWNhdGlvbjtcclxuXHJcbiAgICBwdWJsaWMgYWN0aXZhdGUoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuXHJcbiAgICAgICAgdGhpcy5wYWNrYWdlUmVzdG9yZU5vdGlmaWNhdGlvbiA9IG5ldyBQYWNrYWdlUmVzdG9yZU5vdGlmaWNhdGlvbigpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkubGlzdGVuZXIucGFja2FnZVJlc3RvcmVTdGFydGVkLnN1YnNjcmliZShlID0+XHJcbiAgICAgICAgICAgIHRoaXMucGFja2FnZVJlc3RvcmVOb3RpZmljYXRpb24uaGFuZGxlUGFja2FnZVJlc3RvcmVTdGFydGVkKGUpKSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5saXN0ZW5lci5wYWNrYWdlUmVzdG9yZUZpbmlzaGVkLnN1YnNjcmliZShlID0+XHJcbiAgICAgICAgICAgIHRoaXMucGFja2FnZVJlc3RvcmVOb3RpZmljYXRpb24uaGFuZGxlUGFja2FnZVJlc3RvcmVGaW5pc2hlZChlKSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkubGlzdGVuZXIudW5yZXNvbHZlZERlcGVuZGVuY2llcy5zdWJzY3JpYmUoZSA9PlxyXG4gICAgICAgICAgICB0aGlzLnBhY2thZ2VSZXN0b3JlTm90aWZpY2F0aW9uLmhhbmRsZVVucmVzb2x2ZWREZXBlbmRlbmNpZXMoZSkpKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmxpc3RlbmVyLmV2ZW50c1xyXG4gICAgICAgICAgICAuZmlsdGVyKHogPT4gei5FdmVudCA9PT0gXCJsb2dcIilcclxuICAgICAgICAgICAgLmZpbHRlcih6ID0+IF8uaW5jbHVkZXMoei5Cb2R5Lk5hbWUsIFwiUGFja2FnZXNSZXN0b3JlVG9vbFwiKSlcclxuICAgICAgICAgICAgLmZpbHRlcih6ID0+IHouQm9keS5NZXNzYWdlLnN0YXJ0c1dpdGgoXCJJbnN0YWxsaW5nXCIpKVxyXG4gICAgICAgICAgICAuc3Vic2NyaWJlKGUgPT4gdGhpcy5wYWNrYWdlUmVzdG9yZU5vdGlmaWNhdGlvbi5oYW5kbGVFdmVudHMoZSkpKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGlzcG9zZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZXF1aXJlZCA9IHRydWU7XHJcbiAgICBwdWJsaWMgdGl0bGUgPSBcIlBhY2thZ2UgUmVzdG9yZSBOb3RpZmljYXRpb25zXCI7XHJcbiAgICBwdWJsaWMgZGVzY3JpcHRpb24gPSBcIkFkZHMgc3VwcG9ydCB0byBzaG93IHBhY2thZ2UgcmVzdG9yZSBwcm9ncmVzcywgd2hlbiB0aGUgc2VydmVyIGluaXRpYXRlcyBhIHJlc3RvcmUgb3BlcmF0aW9uLlwiO1xyXG59XHJcblxyXG5jbGFzcyBQYWNrYWdlUmVzdG9yZU5vdGlmaWNhdGlvbiB7XHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICB0aGlzLm5vdGlmaWNhdGlvbiA9IG5ldyBPbW5pTm90aWZpY2F0aW9uKCk7XHJcbiAgICAgICAgdGhpcy5wYWNrYWdlUmVzdG9yZVN0YXJ0ZWQgPSAwO1xyXG4gICAgICAgIHRoaXMucGFja2FnZVJlc3RvcmVGaW5pc2hlZCA9IDA7XHJcbiAgICAgICAgdGhpcy5rbm93blByb2plY3RzID0gW107XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBub3RpZmljYXRpb246IE9tbmlOb3RpZmljYXRpb247XHJcbiAgICBwcml2YXRlIHBhY2thZ2VSZXN0b3JlU3RhcnRlZDogbnVtYmVyO1xyXG4gICAgcHJpdmF0ZSBwYWNrYWdlUmVzdG9yZUZpbmlzaGVkOiBudW1iZXI7XHJcbiAgICBwcml2YXRlIGtub3duUHJvamVjdHM6IEFycmF5PHN0cmluZz47XHJcblxyXG4gICAgcHVibGljIGhhbmRsZVBhY2thZ2VSZXN0b3JlU3RhcnRlZCA9IChldmVudDogTW9kZWxzLlBhY2thZ2VSZXN0b3JlTWVzc2FnZSkgPT4ge1xyXG4gICAgICAgIC8vIENvdW50IGhvdyBtYW55IG9mIHRoZXNlIHdlIGdldCBzbyB3ZSBrbm93IHdoZW4gdG8gZGlzbWlzcyB0aGUgbm90aWZpY2F0aW9uXHJcbiAgICAgICAgdGhpcy5wYWNrYWdlUmVzdG9yZVN0YXJ0ZWQrKztcclxuICAgICAgICBpZiAodGhpcy5ub3RpZmljYXRpb24uaXNEaXNtaXNzZWQoKSkge1xyXG4gICAgICAgICAgICB0aGlzLm5vdGlmaWNhdGlvbi5zaG93KFwiUGFja2FnZSByZXN0b3JlIHN0YXJ0ZWRcIiwgXCJTdGFydGluZy4uXCIpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgcHVibGljIGhhbmRsZVVucmVzb2x2ZWREZXBlbmRlbmNpZXMgPSAoZXZlbnQ6IE1vZGVscy5VbnJlc29sdmVkRGVwZW5kZW5jaWVzTWVzc2FnZSkgPT4ge1xyXG4gICAgICAgIC8vIFNvbWV0aW1lcyBVbnJlc29sdmVkRGVwZW5kZW5jaWVzIGV2ZW50IGlzIHNlbnQgYmVmb3JlIFBhY2thZ2VSZXN0b3JlU3RhcnRlZFxyXG4gICAgICAgIGlmICh0aGlzLm5vdGlmaWNhdGlvbi5pc0Rpc21pc3NlZCgpKSB7XHJcbiAgICAgICAgICAgIHRoaXMubm90aWZpY2F0aW9uLnNob3coXCJQYWNrYWdlIHJlc3RvcmUgc3RhcnRlZFwiLCBcIlN0YXJ0aW5nLi5cIik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoZXZlbnQuRmlsZU5hbWUpIHtcclxuICAgICAgICAgICAgY29uc3QgcHJvamVjdE5hbWUgPSB0aGlzLmZpbmRQcm9qZWN0TmFtZUZyb21GaWxlTmFtZShldmVudC5GaWxlTmFtZSk7XHJcbiAgICAgICAgICAgIC8vIENsaWVudCBnZXRzIG1vcmUgdGhhbiBvbmUgb2YgZWFjaCBVbnJlc29sdmVkRGVwZW5kZW5jaWVzIGV2ZW50cyBmb3IgZWFjaCBwcm9qZWN0XHJcbiAgICAgICAgICAgIC8vIERvblwidCBzaG93IG11bHRpcGxlIGluc3RhbmNlcyBvZiBhIHByb2plY3QgaW4gdGhlIG5vdGlmaWNhdGlvblxyXG4gICAgICAgICAgICBpZiAoIV8uc29tZSh0aGlzLmtub3duUHJvamVjdHMsIChrbm93blByb2plY3QpID0+IHsgcmV0dXJuIGtub3duUHJvamVjdCA9PT0gcHJvamVjdE5hbWU7IH0pKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmtub3duUHJvamVjdHMucHVzaChwcm9qZWN0TmFtZSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm5vdGlmaWNhdGlvbi5hZGREZXRhaWwoYFVucmVzb2x2ZWQgZGVwZW5kZW5jaWVzIGZvciAke3Byb2plY3ROYW1lfTpgLCB0cnVlKTtcclxuICAgICAgICAgICAgICAgIGlmIChldmVudC5VbnJlc29sdmVkRGVwZW5kZW5jaWVzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQuVW5yZXNvbHZlZERlcGVuZGVuY2llcy5mb3JFYWNoKGRlcCA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubm90aWZpY2F0aW9uLmFkZERldGFpbChgIC0gJHtkZXAuTmFtZX0gJHtkZXAuVmVyc2lvbn1gKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgcHVibGljIGhhbmRsZVBhY2thZ2VSZXN0b3JlRmluaXNoZWQgPSAoZXZlbnQ6IE1vZGVscy5QYWNrYWdlUmVzdG9yZU1lc3NhZ2UpID0+IHtcclxuICAgICAgICAvLyBDb3VudCBob3cgbWFueSBvZiB0aGVzZSB3ZSBnZXQgc28gd2Uga25vdyB3aGVuIHRvIGRpc21pc3MgdGhlIG5vdGlmaWNhdGlvblxyXG4gICAgICAgIHRoaXMucGFja2FnZVJlc3RvcmVGaW5pc2hlZCsrO1xyXG4gICAgICAgIGlmICh0aGlzLnBhY2thZ2VSZXN0b3JlU3RhcnRlZCA9PT0gdGhpcy5wYWNrYWdlUmVzdG9yZUZpbmlzaGVkKSB7XHJcbiAgICAgICAgICAgIHRoaXMubm90aWZpY2F0aW9uLnNldFN1Y2Nlc3NmdWxBbmREaXNtaXNzKFwiUGFja2FnZSByZXN0b3JlIGZpbmlzaGVkLlwiKTtcclxuICAgICAgICAgICAgdGhpcy5wYWNrYWdlUmVzdG9yZVN0YXJ0ZWQgPSAwO1xyXG4gICAgICAgICAgICB0aGlzLnBhY2thZ2VSZXN0b3JlRmluaXNoZWQgPSAwO1xyXG4gICAgICAgICAgICB0aGlzLmtub3duUHJvamVjdHMgPSBbXTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIHB1YmxpYyBoYW5kbGVFdmVudHMgPSAoZXZlbnQ6IFN0ZGlvLlByb3RvY29sLkV2ZW50UGFja2V0KSA9PiB7XHJcbiAgICAgICAgdGhpcy5zZXRQYWNrYWdlSW5zdGFsbGVkKGV2ZW50LkJvZHkuTWVzc2FnZSk7XHJcbiAgICB9O1xyXG5cclxuICAgIHByaXZhdGUgZmluZFByb2plY3ROYW1lRnJvbUZpbGVOYW1lKGZpbGVOYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xyXG4gICAgICAgIGNvbnN0IHNwbGl0ID0gZmlsZU5hbWUuc3BsaXQocGF0aC5zZXApO1xyXG4gICAgICAgIGNvbnN0IHByb2plY3ROYW1lID0gc3BsaXRbc3BsaXQubGVuZ3RoIC0gMl07XHJcbiAgICAgICAgcmV0dXJuIHByb2plY3ROYW1lO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgc2V0UGFja2FnZUluc3RhbGxlZChtZXNzYWdlOiBzdHJpbmcpIHtcclxuICAgICAgICBjb25zdCBtYXRjaCA9IG1lc3NhZ2UubWF0Y2goL0luc3RhbGxpbmcgKFthLXpBLVouXSopIChbXFxEP1xcZD8uPy0/XSopLyk7XHJcbiAgICAgICAgY29uc3QgZGV0YWlsTGluZXMgPSB0aGlzLm5vdGlmaWNhdGlvbi5nZXREZXRhaWxFbGVtZW50KCkuY2hpbGRyZW4oXCIubGluZVwiKTtcclxuICAgICAgICBpZiAoIW1hdGNoIHx8IG1hdGNoLmxlbmd0aCA8IDMpIHJldHVybjtcclxuICAgICAgICBfLmZvckVhY2goZGV0YWlsTGluZXMsIGxpbmUgPT4ge1xyXG4gICAgICAgICAgICBpZiAobGluZS50ZXh0Q29udGVudC5zdGFydHNXaXRoKGAgLSAke21hdGNoWzFdfSBgKSkge1xyXG4gICAgICAgICAgICAgICAgbGluZS50ZXh0Q29udGVudCA9IGBJbnN0YWxsZWQgJHttYXRjaFsxXX0gJHttYXRjaFsyXX1gO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmNsYXNzIE9tbmlOb3RpZmljYXRpb24ge1xyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNtaXNzZWQgPSB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXRvbU5vdGlmaWNhdGlvbjogQXRvbS5Ob3RpZmljYXRpb247XHJcbiAgICBwcml2YXRlIGRpc21pc3NlZDogYm9vbGVhbjtcclxuICAgIHByaXZhdGUgaXNCZWluZ0Rpc21pc3NlZDogYm9vbGVhbjtcclxuXHJcbiAgICBwdWJsaWMgYWRkRGV0YWlsKGRldGFpbDogc3RyaW5nLCBuZXdsaW5lPzogYm9vbGVhbikge1xyXG4gICAgICAgIGNvbnN0IGRldGFpbHMgPSB0aGlzLmdldERldGFpbEVsZW1lbnQoKTtcclxuICAgICAgICBpZiAoIWRldGFpbCkgcmV0dXJuO1xyXG4gICAgICAgIGlmIChuZXdsaW5lKSBkZXRhaWxzLmFwcGVuZChcIjxiciAvPlwiKTtcclxuICAgICAgICBkZXRhaWxzLmFwcGVuZChgPGRpdiBjbGFzcz1cImxpbmVcIj4ke2RldGFpbH08L2Rpdj5gKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2hvdyhtZXNzYWdlOiBzdHJpbmcsIGRldGFpbDogc3RyaW5nKSB7XHJcbiAgICAgICAgdGhpcy5hdG9tTm90aWZpY2F0aW9uID0gYXRvbS5ub3RpZmljYXRpb25zLmFkZEluZm8obWVzc2FnZSwgeyBkZXRhaWw6IGRldGFpbCwgZGlzbWlzc2FibGU6IHRydWUgfSk7XHJcbiAgICAgICAgdGhpcy5kaXNtaXNzZWQgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLmF0b21Ob3RpZmljYXRpb24ub25EaWREaXNtaXNzKG5vdGlmaWNhdGlvbiA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuZGlzbWlzc2VkID0gdHJ1ZTtcclxuICAgICAgICAgICAgdGhpcy5pc0JlaW5nRGlzbWlzc2VkID0gZmFsc2U7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHNldFN1Y2Nlc3NmdWxBbmREaXNtaXNzKG1lc3NhZ2U6IHN0cmluZykge1xyXG4gICAgICAgIGlmICh0aGlzLmlzQmVpbmdEaXNtaXNzZWQpIHJldHVybjtcclxuICAgICAgICB0aGlzLmFkZERldGFpbChtZXNzYWdlLCB0cnVlKTtcclxuICAgICAgICBjb25zdCBkb21Ob3RpZmljYXRpb24gPSAkKGF0b20udmlld3MuZ2V0Vmlldyh0aGlzLmF0b21Ob3RpZmljYXRpb24pKTtcclxuICAgICAgICBkb21Ob3RpZmljYXRpb24ucmVtb3ZlQ2xhc3MoXCJpbmZvXCIpO1xyXG4gICAgICAgIGRvbU5vdGlmaWNhdGlvbi5yZW1vdmVDbGFzcyhcImljb24taW5mb1wiKTtcclxuICAgICAgICBkb21Ob3RpZmljYXRpb24uYWRkQ2xhc3MoXCJzdWNjZXNzXCIpO1xyXG4gICAgICAgIGRvbU5vdGlmaWNhdGlvbi5hZGRDbGFzcyhcImljb24tY2hlY2tcIik7XHJcbiAgICAgICAgdGhpcy5pc0JlaW5nRGlzbWlzc2VkID0gdHJ1ZTtcclxuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHsgdGhpcy5kaXNtaXNzKCk7IH0sIDIwMDApO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBpc0Rpc21pc3NlZCgpOiBib29sZWFuIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5kaXNtaXNzZWQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBkaXNtaXNzKCkge1xyXG4gICAgICAgIHRoaXMuYXRvbU5vdGlmaWNhdGlvbi5kaXNtaXNzKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldERldGFpbEVsZW1lbnQoKTogSlF1ZXJ5IHtcclxuICAgICAgICByZXR1cm4gdGhpcy5nZXRGcm9tRG9tKCQoYXRvbS52aWV3cy5nZXRWaWV3KHRoaXMuYXRvbU5vdGlmaWNhdGlvbikpLCBcIi5jb250ZW50IC5kZXRhaWwgLmRldGFpbC1jb250ZW50XCIpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZ2V0RnJvbURvbShlbGVtZW50OiBKUXVlcnksIHNlbGVjdG9yOiBzdHJpbmcpOiBKUXVlcnkge1xyXG4gICAgICAgIGNvbnN0IGVsID0gZWxlbWVudFswXTtcclxuICAgICAgICBpZiAoIWVsKSByZXR1cm47XHJcbiAgICAgICAgY29uc3QgZm91bmQgPSAoPGFueT5lbCkucXVlcnlTZWxlY3RvckFsbChzZWxlY3Rvcik7XHJcbiAgICAgICAgcmV0dXJuICQoZm91bmRbMF0pO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgY29uc3Qgbm90aWZpY2F0aW9uSGFuZGxlciA9IG5ldyBOb3RpZmljYXRpb25IYW5kbGVyO1xyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
