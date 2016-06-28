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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9ub3RpZmljYXRpb24taGFuZGxlci5qcyIsImxpYi9mZWF0dXJlcy9ub3RpZmljYXRpb24taGFuZGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7OztBQUNBOztBQUNBOztBQUNBOztJQ0NZOzs7Ozs7OztBQUNaLElBQU0sSUFBa0IsUUFBUSxRQUFSLENBQWxCOztJQUVOO0FBQUEsbUNBQUE7OztBQTZCVyxhQUFBLFFBQUEsR0FBVyxJQUFYLENBN0JYO0FBOEJXLGFBQUEsS0FBQSxHQUFRLCtCQUFSLENBOUJYO0FBK0JXLGFBQUEsV0FBQSxHQUFjLCtGQUFkLENBL0JYO0tBQUE7Ozs7bUNBSW1COzs7QUFDWCxpQkFBSyxVQUFMLEdBQWtCLDBDQUFsQixDQURXO0FBR1gsaUJBQUssMEJBQUwsR0FBa0MsSUFBSSwwQkFBSixFQUFsQyxDQUhXO0FBS1gsaUJBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQixXQUFLLFFBQUwsQ0FBYyxxQkFBZCxDQUFvQyxTQUFwQyxDQUE4Qzt1QkFDOUQsTUFBSywwQkFBTCxDQUFnQywyQkFBaEMsQ0FBNEQsQ0FBNUQ7YUFEOEQsQ0FBbEUsRUFMVztBQVFYLGlCQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsV0FBSyxRQUFMLENBQWMsc0JBQWQsQ0FBcUMsU0FBckMsQ0FBK0M7dUJBQy9ELE1BQUssMEJBQUwsQ0FBZ0MsNEJBQWhDLENBQTZELENBQTdEO2FBRCtELENBQW5FLEVBUlc7QUFXWCxpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLFdBQUssUUFBTCxDQUFjLHNCQUFkLENBQXFDLFNBQXJDLENBQStDO3VCQUMvRCxNQUFLLDBCQUFMLENBQWdDLDRCQUFoQyxDQUE2RCxDQUE3RDthQUQrRCxDQUFuRSxFQVhXO0FBY1gsaUJBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQixXQUFLLFFBQUwsQ0FBYyxNQUFkLENBQ2YsTUFEZSxDQUNSO3VCQUFLLEVBQUUsS0FB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IjoibGliL2ZlYXR1cmVzL25vdGlmaWNhdGlvbi1oYW5kbGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xuaW1wb3J0IHsgT21uaSB9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSB9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gXCJwYXRoXCI7XG5jb25zdCAkID0gcmVxdWlyZShcImpxdWVyeVwiKTtcbmNsYXNzIE5vdGlmaWNhdGlvbkhhbmRsZXIge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLnJlcXVpcmVkID0gdHJ1ZTtcbiAgICAgICAgdGhpcy50aXRsZSA9IFwiUGFja2FnZSBSZXN0b3JlIE5vdGlmaWNhdGlvbnNcIjtcbiAgICAgICAgdGhpcy5kZXNjcmlwdGlvbiA9IFwiQWRkcyBzdXBwb3J0IHRvIHNob3cgcGFja2FnZSByZXN0b3JlIHByb2dyZXNzLCB3aGVuIHRoZSBzZXJ2ZXIgaW5pdGlhdGVzIGEgcmVzdG9yZSBvcGVyYXRpb24uXCI7XG4gICAgfVxuICAgIGFjdGl2YXRlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICB0aGlzLnBhY2thZ2VSZXN0b3JlTm90aWZpY2F0aW9uID0gbmV3IFBhY2thZ2VSZXN0b3JlTm90aWZpY2F0aW9uKCk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5saXN0ZW5lci5wYWNrYWdlUmVzdG9yZVN0YXJ0ZWQuc3Vic2NyaWJlKGUgPT4gdGhpcy5wYWNrYWdlUmVzdG9yZU5vdGlmaWNhdGlvbi5oYW5kbGVQYWNrYWdlUmVzdG9yZVN0YXJ0ZWQoZSkpKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmxpc3RlbmVyLnBhY2thZ2VSZXN0b3JlRmluaXNoZWQuc3Vic2NyaWJlKGUgPT4gdGhpcy5wYWNrYWdlUmVzdG9yZU5vdGlmaWNhdGlvbi5oYW5kbGVQYWNrYWdlUmVzdG9yZUZpbmlzaGVkKGUpKSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5saXN0ZW5lci51bnJlc29sdmVkRGVwZW5kZW5jaWVzLnN1YnNjcmliZShlID0+IHRoaXMucGFja2FnZVJlc3RvcmVOb3RpZmljYXRpb24uaGFuZGxlVW5yZXNvbHZlZERlcGVuZGVuY2llcyhlKSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkubGlzdGVuZXIuZXZlbnRzXG4gICAgICAgICAgICAuZmlsdGVyKHogPT4gei5FdmVudCA9PT0gXCJsb2dcIilcbiAgICAgICAgICAgIC5maWx0ZXIoeiA9PiBfLmluY2x1ZGVzKHouQm9keS5OYW1lLCBcIlBhY2thZ2VzUmVzdG9yZVRvb2xcIikpXG4gICAgICAgICAgICAuZmlsdGVyKHogPT4gei5Cb2R5Lk1lc3NhZ2Uuc3RhcnRzV2l0aChcIkluc3RhbGxpbmdcIikpXG4gICAgICAgICAgICAuc3Vic2NyaWJlKGUgPT4gdGhpcy5wYWNrYWdlUmVzdG9yZU5vdGlmaWNhdGlvbi5oYW5kbGVFdmVudHMoZSkpKTtcbiAgICB9XG4gICAgZGlzcG9zZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICB9XG59XG5jbGFzcyBQYWNrYWdlUmVzdG9yZU5vdGlmaWNhdGlvbiB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuaGFuZGxlUGFja2FnZVJlc3RvcmVTdGFydGVkID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICB0aGlzLnBhY2thZ2VSZXN0b3JlU3RhcnRlZCsrO1xuICAgICAgICAgICAgaWYgKHRoaXMubm90aWZpY2F0aW9uLmlzRGlzbWlzc2VkKCkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm5vdGlmaWNhdGlvbi5zaG93KFwiUGFja2FnZSByZXN0b3JlIHN0YXJ0ZWRcIiwgXCJTdGFydGluZy4uXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICB0aGlzLmhhbmRsZVVucmVzb2x2ZWREZXBlbmRlbmNpZXMgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLm5vdGlmaWNhdGlvbi5pc0Rpc21pc3NlZCgpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5ub3RpZmljYXRpb24uc2hvdyhcIlBhY2thZ2UgcmVzdG9yZSBzdGFydGVkXCIsIFwiU3RhcnRpbmcuLlwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChldmVudC5GaWxlTmFtZSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHByb2plY3ROYW1lID0gdGhpcy5maW5kUHJvamVjdE5hbWVGcm9tRmlsZU5hbWUoZXZlbnQuRmlsZU5hbWUpO1xuICAgICAgICAgICAgICAgIGlmICghXy5zb21lKHRoaXMua25vd25Qcm9qZWN0cywgKGtub3duUHJvamVjdCkgPT4geyByZXR1cm4ga25vd25Qcm9qZWN0ID09PSBwcm9qZWN0TmFtZTsgfSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5rbm93blByb2plY3RzLnB1c2gocHJvamVjdE5hbWUpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm5vdGlmaWNhdGlvbi5hZGREZXRhaWwoYFVucmVzb2x2ZWQgZGVwZW5kZW5jaWVzIGZvciAke3Byb2plY3ROYW1lfTpgLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGV2ZW50LlVucmVzb2x2ZWREZXBlbmRlbmNpZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50LlVucmVzb2x2ZWREZXBlbmRlbmNpZXMuZm9yRWFjaChkZXAgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubm90aWZpY2F0aW9uLmFkZERldGFpbChgIC0gJHtkZXAuTmFtZX0gJHtkZXAuVmVyc2lvbn1gKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICB0aGlzLmhhbmRsZVBhY2thZ2VSZXN0b3JlRmluaXNoZWQgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIHRoaXMucGFja2FnZVJlc3RvcmVGaW5pc2hlZCsrO1xuICAgICAgICAgICAgaWYgKHRoaXMucGFja2FnZVJlc3RvcmVTdGFydGVkID09PSB0aGlzLnBhY2thZ2VSZXN0b3JlRmluaXNoZWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm5vdGlmaWNhdGlvbi5zZXRTdWNjZXNzZnVsQW5kRGlzbWlzcyhcIlBhY2thZ2UgcmVzdG9yZSBmaW5pc2hlZC5cIik7XG4gICAgICAgICAgICAgICAgdGhpcy5wYWNrYWdlUmVzdG9yZVN0YXJ0ZWQgPSAwO1xuICAgICAgICAgICAgICAgIHRoaXMucGFja2FnZVJlc3RvcmVGaW5pc2hlZCA9IDA7XG4gICAgICAgICAgICAgICAgdGhpcy5rbm93blByb2plY3RzID0gW107XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuaGFuZGxlRXZlbnRzID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICB0aGlzLnNldFBhY2thZ2VJbnN0YWxsZWQoZXZlbnQuQm9keS5NZXNzYWdlKTtcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5ub3RpZmljYXRpb24gPSBuZXcgT21uaU5vdGlmaWNhdGlvbigpO1xuICAgICAgICB0aGlzLnBhY2thZ2VSZXN0b3JlU3RhcnRlZCA9IDA7XG4gICAgICAgIHRoaXMucGFja2FnZVJlc3RvcmVGaW5pc2hlZCA9IDA7XG4gICAgICAgIHRoaXMua25vd25Qcm9qZWN0cyA9IFtdO1xuICAgIH1cbiAgICBmaW5kUHJvamVjdE5hbWVGcm9tRmlsZU5hbWUoZmlsZU5hbWUpIHtcbiAgICAgICAgY29uc3Qgc3BsaXQgPSBmaWxlTmFtZS5zcGxpdChwYXRoLnNlcCk7XG4gICAgICAgIGNvbnN0IHByb2plY3ROYW1lID0gc3BsaXRbc3BsaXQubGVuZ3RoIC0gMl07XG4gICAgICAgIHJldHVybiBwcm9qZWN0TmFtZTtcbiAgICB9XG4gICAgc2V0UGFja2FnZUluc3RhbGxlZChtZXNzYWdlKSB7XG4gICAgICAgIGNvbnN0IG1hdGNoID0gbWVzc2FnZS5tYXRjaCgvSW5zdGFsbGluZyAoW2EtekEtWi5dKikgKFtcXEQ/XFxkPy4/LT9dKikvKTtcbiAgICAgICAgY29uc3QgZGV0YWlsTGluZXMgPSB0aGlzLm5vdGlmaWNhdGlvbi5nZXREZXRhaWxFbGVtZW50KCkuY2hpbGRyZW4oXCIubGluZVwiKTtcbiAgICAgICAgaWYgKCFtYXRjaCB8fCBtYXRjaC5sZW5ndGggPCAzKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBfLmZvckVhY2goZGV0YWlsTGluZXMsIGxpbmUgPT4ge1xuICAgICAgICAgICAgaWYgKGxpbmUudGV4dENvbnRlbnQuc3RhcnRzV2l0aChgIC0gJHttYXRjaFsxXX0gYCkpIHtcbiAgICAgICAgICAgICAgICBsaW5lLnRleHRDb250ZW50ID0gYEluc3RhbGxlZCAke21hdGNoWzFdfSAke21hdGNoWzJdfWA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbn1cbmNsYXNzIE9tbmlOb3RpZmljYXRpb24ge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmRpc21pc3NlZCA9IHRydWU7XG4gICAgfVxuICAgIGFkZERldGFpbChkZXRhaWwsIG5ld2xpbmUpIHtcbiAgICAgICAgY29uc3QgZGV0YWlscyA9IHRoaXMuZ2V0RGV0YWlsRWxlbWVudCgpO1xuICAgICAgICBpZiAoIWRldGFpbClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgaWYgKG5ld2xpbmUpXG4gICAgICAgICAgICBkZXRhaWxzLmFwcGVuZChcIjxiciAvPlwiKTtcbiAgICAgICAgZGV0YWlscy5hcHBlbmQoYDxkaXYgY2xhc3M9XCJsaW5lXCI+JHtkZXRhaWx9PC9kaXY+YCk7XG4gICAgfVxuICAgIHNob3cobWVzc2FnZSwgZGV0YWlsKSB7XG4gICAgICAgIHRoaXMuYXRvbU5vdGlmaWNhdGlvbiA9IGF0b20ubm90aWZpY2F0aW9ucy5hZGRJbmZvKG1lc3NhZ2UsIHsgZGV0YWlsOiBkZXRhaWwsIGRpc21pc3NhYmxlOiB0cnVlIH0pO1xuICAgICAgICB0aGlzLmRpc21pc3NlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLmF0b21Ob3RpZmljYXRpb24ub25EaWREaXNtaXNzKG5vdGlmaWNhdGlvbiA9PiB7XG4gICAgICAgICAgICB0aGlzLmRpc21pc3NlZCA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLmlzQmVpbmdEaXNtaXNzZWQgPSBmYWxzZTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHNldFN1Y2Nlc3NmdWxBbmREaXNtaXNzKG1lc3NhZ2UpIHtcbiAgICAgICAgaWYgKHRoaXMuaXNCZWluZ0Rpc21pc3NlZClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdGhpcy5hZGREZXRhaWwobWVzc2FnZSwgdHJ1ZSk7XG4gICAgICAgIGNvbnN0IGRvbU5vdGlmaWNhdGlvbiA9ICQoYXRvbS52aWV3cy5nZXRWaWV3KHRoaXMuYXRvbU5vdGlmaWNhdGlvbikpO1xuICAgICAgICBkb21Ob3RpZmljYXRpb24ucmVtb3ZlQ2xhc3MoXCJpbmZvXCIpO1xuICAgICAgICBkb21Ob3RpZmljYXRpb24ucmVtb3ZlQ2xhc3MoXCJpY29uLWluZm9cIik7XG4gICAgICAgIGRvbU5vdGlmaWNhdGlvbi5hZGRDbGFzcyhcInN1Y2Nlc3NcIik7XG4gICAgICAgIGRvbU5vdGlmaWNhdGlvbi5hZGRDbGFzcyhcImljb24tY2hlY2tcIik7XG4gICAgICAgIHRoaXMuaXNCZWluZ0Rpc21pc3NlZCA9IHRydWU7XG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4geyB0aGlzLmRpc21pc3MoKTsgfSwgMjAwMCk7XG4gICAgfVxuICAgIGlzRGlzbWlzc2VkKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5kaXNtaXNzZWQ7XG4gICAgfVxuICAgIGRpc21pc3MoKSB7XG4gICAgICAgIHRoaXMuYXRvbU5vdGlmaWNhdGlvbi5kaXNtaXNzKCk7XG4gICAgfVxuICAgIGdldERldGFpbEVsZW1lbnQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldEZyb21Eb20oJChhdG9tLnZpZXdzLmdldFZpZXcodGhpcy5hdG9tTm90aWZpY2F0aW9uKSksIFwiLmNvbnRlbnQgLmRldGFpbCAuZGV0YWlsLWNvbnRlbnRcIik7XG4gICAgfVxuICAgIGdldEZyb21Eb20oZWxlbWVudCwgc2VsZWN0b3IpIHtcbiAgICAgICAgY29uc3QgZWwgPSBlbGVtZW50WzBdO1xuICAgICAgICBpZiAoIWVsKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zdCBmb3VuZCA9IGVsLnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpO1xuICAgICAgICByZXR1cm4gJChmb3VuZFswXSk7XG4gICAgfVxufVxuZXhwb3J0IGNvbnN0IG5vdGlmaWNhdGlvbkhhbmRsZXIgPSBuZXcgTm90aWZpY2F0aW9uSGFuZGxlcjtcbiIsImltcG9ydCB7TW9kZWxzLCBTdGRpb30gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcclxuaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xyXG5pbXBvcnQge09tbml9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xyXG5pbXBvcnQge0NvbXBvc2l0ZURpc3Bvc2FibGV9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XHJcbmltcG9ydCAqIGFzIHBhdGggZnJvbSBcInBhdGhcIjtcclxuY29uc3QgJDogSlF1ZXJ5U3RhdGljID0gcmVxdWlyZShcImpxdWVyeVwiKTtcclxuXHJcbmNsYXNzIE5vdGlmaWNhdGlvbkhhbmRsZXIgaW1wbGVtZW50cyBJRmVhdHVyZSB7XHJcbiAgICBwcml2YXRlIGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XHJcbiAgICBwcml2YXRlIHBhY2thZ2VSZXN0b3JlTm90aWZpY2F0aW9uOiBQYWNrYWdlUmVzdG9yZU5vdGlmaWNhdGlvbjtcclxuXHJcbiAgICBwdWJsaWMgYWN0aXZhdGUoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuXHJcbiAgICAgICAgdGhpcy5wYWNrYWdlUmVzdG9yZU5vdGlmaWNhdGlvbiA9IG5ldyBQYWNrYWdlUmVzdG9yZU5vdGlmaWNhdGlvbigpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkubGlzdGVuZXIucGFja2FnZVJlc3RvcmVTdGFydGVkLnN1YnNjcmliZShlID0+XHJcbiAgICAgICAgICAgIHRoaXMucGFja2FnZVJlc3RvcmVOb3RpZmljYXRpb24uaGFuZGxlUGFja2FnZVJlc3RvcmVTdGFydGVkKGUpKSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5saXN0ZW5lci5wYWNrYWdlUmVzdG9yZUZpbmlzaGVkLnN1YnNjcmliZShlID0+XHJcbiAgICAgICAgICAgIHRoaXMucGFja2FnZVJlc3RvcmVOb3RpZmljYXRpb24uaGFuZGxlUGFja2FnZVJlc3RvcmVGaW5pc2hlZChlKSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkubGlzdGVuZXIudW5yZXNvbHZlZERlcGVuZGVuY2llcy5zdWJzY3JpYmUoZSA9PlxyXG4gICAgICAgICAgICB0aGlzLnBhY2thZ2VSZXN0b3JlTm90aWZpY2F0aW9uLmhhbmRsZVVucmVzb2x2ZWREZXBlbmRlbmNpZXMoZSkpKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmxpc3RlbmVyLmV2ZW50c1xyXG4gICAgICAgICAgICAuZmlsdGVyKHogPT4gei5FdmVudCA9PT0gXCJsb2dcIilcclxuICAgICAgICAgICAgLmZpbHRlcih6ID0+IF8uaW5jbHVkZXMoei5Cb2R5Lk5hbWUsIFwiUGFja2FnZXNSZXN0b3JlVG9vbFwiKSlcclxuICAgICAgICAgICAgLmZpbHRlcih6ID0+IHouQm9keS5NZXNzYWdlLnN0YXJ0c1dpdGgoXCJJbnN0YWxsaW5nXCIpKVxyXG4gICAgICAgICAgICAuc3Vic2NyaWJlKGUgPT4gdGhpcy5wYWNrYWdlUmVzdG9yZU5vdGlmaWNhdGlvbi5oYW5kbGVFdmVudHMoZSkpKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGlzcG9zZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZXF1aXJlZCA9IHRydWU7XHJcbiAgICBwdWJsaWMgdGl0bGUgPSBcIlBhY2thZ2UgUmVzdG9yZSBOb3RpZmljYXRpb25zXCI7XHJcbiAgICBwdWJsaWMgZGVzY3JpcHRpb24gPSBcIkFkZHMgc3VwcG9ydCB0byBzaG93IHBhY2thZ2UgcmVzdG9yZSBwcm9ncmVzcywgd2hlbiB0aGUgc2VydmVyIGluaXRpYXRlcyBhIHJlc3RvcmUgb3BlcmF0aW9uLlwiO1xyXG59XHJcblxyXG5jbGFzcyBQYWNrYWdlUmVzdG9yZU5vdGlmaWNhdGlvbiB7XHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICB0aGlzLm5vdGlmaWNhdGlvbiA9IG5ldyBPbW5pTm90aWZpY2F0aW9uKCk7XHJcbiAgICAgICAgdGhpcy5wYWNrYWdlUmVzdG9yZVN0YXJ0ZWQgPSAwO1xyXG4gICAgICAgIHRoaXMucGFja2FnZVJlc3RvcmVGaW5pc2hlZCA9IDA7XHJcbiAgICAgICAgdGhpcy5rbm93blByb2plY3RzID0gW107XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBub3RpZmljYXRpb246IE9tbmlOb3RpZmljYXRpb247XHJcbiAgICBwcml2YXRlIHBhY2thZ2VSZXN0b3JlU3RhcnRlZDogbnVtYmVyO1xyXG4gICAgcHJpdmF0ZSBwYWNrYWdlUmVzdG9yZUZpbmlzaGVkOiBudW1iZXI7XHJcbiAgICBwcml2YXRlIGtub3duUHJvamVjdHM6IEFycmF5PHN0cmluZz47XHJcblxyXG4gICAgcHVibGljIGhhbmRsZVBhY2thZ2VSZXN0b3JlU3RhcnRlZCA9IChldmVudDogTW9kZWxzLlBhY2thZ2VSZXN0b3JlTWVzc2FnZSkgPT4ge1xyXG4gICAgICAgIC8vIENvdW50IGhvdyBtYW55IG9mIHRoZXNlIHdlIGdldCBzbyB3ZSBrbm93IHdoZW4gdG8gZGlzbWlzcyB0aGUgbm90aWZpY2F0aW9uXHJcbiAgICAgICAgdGhpcy5wYWNrYWdlUmVzdG9yZVN0YXJ0ZWQrKztcclxuICAgICAgICBpZiAodGhpcy5ub3RpZmljYXRpb24uaXNEaXNtaXNzZWQoKSkge1xyXG4gICAgICAgICAgICB0aGlzLm5vdGlmaWNhdGlvbi5zaG93KFwiUGFja2FnZSByZXN0b3JlIHN0YXJ0ZWRcIiwgXCJTdGFydGluZy4uXCIpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgcHVibGljIGhhbmRsZVVucmVzb2x2ZWREZXBlbmRlbmNpZXMgPSAoZXZlbnQ6IE1vZGVscy5VbnJlc29sdmVkRGVwZW5kZW5jaWVzTWVzc2FnZSkgPT4ge1xyXG4gICAgICAgIC8vIFNvbWV0aW1lcyBVbnJlc29sdmVkRGVwZW5kZW5jaWVzIGV2ZW50IGlzIHNlbnQgYmVmb3JlIFBhY2thZ2VSZXN0b3JlU3RhcnRlZFxyXG4gICAgICAgIGlmICh0aGlzLm5vdGlmaWNhdGlvbi5pc0Rpc21pc3NlZCgpKSB7XHJcbiAgICAgICAgICAgIHRoaXMubm90aWZpY2F0aW9uLnNob3coXCJQYWNrYWdlIHJlc3RvcmUgc3RhcnRlZFwiLCBcIlN0YXJ0aW5nLi5cIik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoZXZlbnQuRmlsZU5hbWUpIHtcclxuICAgICAgICAgICAgY29uc3QgcHJvamVjdE5hbWUgPSB0aGlzLmZpbmRQcm9qZWN0TmFtZUZyb21GaWxlTmFtZShldmVudC5GaWxlTmFtZSk7XHJcbiAgICAgICAgICAgIC8vIENsaWVudCBnZXRzIG1vcmUgdGhhbiBvbmUgb2YgZWFjaCBVbnJlc29sdmVkRGVwZW5kZW5jaWVzIGV2ZW50cyBmb3IgZWFjaCBwcm9qZWN0XHJcbiAgICAgICAgICAgIC8vIERvblwidCBzaG93IG11bHRpcGxlIGluc3RhbmNlcyBvZiBhIHByb2plY3QgaW4gdGhlIG5vdGlmaWNhdGlvblxyXG4gICAgICAgICAgICBpZiAoIV8uc29tZSh0aGlzLmtub3duUHJvamVjdHMsIChrbm93blByb2plY3QpID0+IHsgcmV0dXJuIGtub3duUHJvamVjdCA9PT0gcHJvamVjdE5hbWU7IH0pKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmtub3duUHJvamVjdHMucHVzaChwcm9qZWN0TmFtZSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm5vdGlmaWNhdGlvbi5hZGREZXRhaWwoYFVucmVzb2x2ZWQgZGVwZW5kZW5jaWVzIGZvciAke3Byb2plY3ROYW1lfTpgLCB0cnVlKTtcclxuICAgICAgICAgICAgICAgIGlmIChldmVudC5VbnJlc29sdmVkRGVwZW5kZW5jaWVzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQuVW5yZXNvbHZlZERlcGVuZGVuY2llcy5mb3JFYWNoKGRlcCA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubm90aWZpY2F0aW9uLmFkZERldGFpbChgIC0gJHtkZXAuTmFtZX0gJHtkZXAuVmVyc2lvbn1gKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgcHVibGljIGhhbmRsZVBhY2thZ2VSZXN0b3JlRmluaXNoZWQgPSAoZXZlbnQ6IE1vZGVscy5QYWNrYWdlUmVzdG9yZU1lc3NhZ2UpID0+IHtcclxuICAgICAgICAvLyBDb3VudCBob3cgbWFueSBvZiB0aGVzZSB3ZSBnZXQgc28gd2Uga25vdyB3aGVuIHRvIGRpc21pc3MgdGhlIG5vdGlmaWNhdGlvblxyXG4gICAgICAgIHRoaXMucGFja2FnZVJlc3RvcmVGaW5pc2hlZCsrO1xyXG4gICAgICAgIGlmICh0aGlzLnBhY2thZ2VSZXN0b3JlU3RhcnRlZCA9PT0gdGhpcy5wYWNrYWdlUmVzdG9yZUZpbmlzaGVkKSB7XHJcbiAgICAgICAgICAgIHRoaXMubm90aWZpY2F0aW9uLnNldFN1Y2Nlc3NmdWxBbmREaXNtaXNzKFwiUGFja2FnZSByZXN0b3JlIGZpbmlzaGVkLlwiKTtcclxuICAgICAgICAgICAgdGhpcy5wYWNrYWdlUmVzdG9yZVN0YXJ0ZWQgPSAwO1xyXG4gICAgICAgICAgICB0aGlzLnBhY2thZ2VSZXN0b3JlRmluaXNoZWQgPSAwO1xyXG4gICAgICAgICAgICB0aGlzLmtub3duUHJvamVjdHMgPSBbXTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIHB1YmxpYyBoYW5kbGVFdmVudHMgPSAoZXZlbnQ6IFN0ZGlvLlByb3RvY29sLkV2ZW50UGFja2V0KSA9PiB7XHJcbiAgICAgICAgdGhpcy5zZXRQYWNrYWdlSW5zdGFsbGVkKGV2ZW50LkJvZHkuTWVzc2FnZSk7XHJcbiAgICB9O1xyXG5cclxuICAgIHByaXZhdGUgZmluZFByb2plY3ROYW1lRnJvbUZpbGVOYW1lKGZpbGVOYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xyXG4gICAgICAgIGNvbnN0IHNwbGl0ID0gZmlsZU5hbWUuc3BsaXQocGF0aC5zZXApO1xyXG4gICAgICAgIGNvbnN0IHByb2plY3ROYW1lID0gc3BsaXRbc3BsaXQubGVuZ3RoIC0gMl07XHJcbiAgICAgICAgcmV0dXJuIHByb2plY3ROYW1lO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgc2V0UGFja2FnZUluc3RhbGxlZChtZXNzYWdlOiBzdHJpbmcpIHtcclxuICAgICAgICBjb25zdCBtYXRjaCA9IG1lc3NhZ2UubWF0Y2goL0luc3RhbGxpbmcgKFthLXpBLVouXSopIChbXFxEP1xcZD8uPy0/XSopLyk7XHJcbiAgICAgICAgY29uc3QgZGV0YWlsTGluZXMgPSB0aGlzLm5vdGlmaWNhdGlvbi5nZXREZXRhaWxFbGVtZW50KCkuY2hpbGRyZW4oXCIubGluZVwiKTtcclxuICAgICAgICBpZiAoIW1hdGNoIHx8IG1hdGNoLmxlbmd0aCA8IDMpIHJldHVybjtcclxuICAgICAgICBfLmZvckVhY2goZGV0YWlsTGluZXMsIGxpbmUgPT4ge1xyXG4gICAgICAgICAgICBpZiAobGluZS50ZXh0Q29udGVudC5zdGFydHNXaXRoKGAgLSAke21hdGNoWzFdfSBgKSkge1xyXG4gICAgICAgICAgICAgICAgbGluZS50ZXh0Q29udGVudCA9IGBJbnN0YWxsZWQgJHttYXRjaFsxXX0gJHttYXRjaFsyXX1gO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmNsYXNzIE9tbmlOb3RpZmljYXRpb24ge1xyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNtaXNzZWQgPSB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXRvbU5vdGlmaWNhdGlvbjogQXRvbS5Ob3RpZmljYXRpb247XHJcbiAgICBwcml2YXRlIGRpc21pc3NlZDogYm9vbGVhbjtcclxuICAgIHByaXZhdGUgaXNCZWluZ0Rpc21pc3NlZDogYm9vbGVhbjtcclxuXHJcbiAgICBwdWJsaWMgYWRkRGV0YWlsKGRldGFpbDogc3RyaW5nLCBuZXdsaW5lPzogYm9vbGVhbikge1xyXG4gICAgICAgIGNvbnN0IGRldGFpbHMgPSB0aGlzLmdldERldGFpbEVsZW1lbnQoKTtcclxuICAgICAgICBpZiAoIWRldGFpbCkgcmV0dXJuO1xyXG4gICAgICAgIGlmIChuZXdsaW5lKSBkZXRhaWxzLmFwcGVuZChcIjxiciAvPlwiKTtcclxuICAgICAgICBkZXRhaWxzLmFwcGVuZChgPGRpdiBjbGFzcz1cImxpbmVcIj4ke2RldGFpbH08L2Rpdj5gKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2hvdyhtZXNzYWdlOiBzdHJpbmcsIGRldGFpbDogc3RyaW5nKSB7XHJcbiAgICAgICAgdGhpcy5hdG9tTm90aWZpY2F0aW9uID0gYXRvbS5ub3RpZmljYXRpb25zLmFkZEluZm8obWVzc2FnZSwgeyBkZXRhaWw6IGRldGFpbCwgZGlzbWlzc2FibGU6IHRydWUgfSk7XHJcbiAgICAgICAgdGhpcy5kaXNtaXNzZWQgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLmF0b21Ob3RpZmljYXRpb24ub25EaWREaXNtaXNzKG5vdGlmaWNhdGlvbiA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuZGlzbWlzc2VkID0gdHJ1ZTtcclxuICAgICAgICAgICAgdGhpcy5pc0JlaW5nRGlzbWlzc2VkID0gZmFsc2U7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHNldFN1Y2Nlc3NmdWxBbmREaXNtaXNzKG1lc3NhZ2U6IHN0cmluZykge1xyXG4gICAgICAgIGlmICh0aGlzLmlzQmVpbmdEaXNtaXNzZWQpIHJldHVybjtcclxuICAgICAgICB0aGlzLmFkZERldGFpbChtZXNzYWdlLCB0cnVlKTtcclxuICAgICAgICBjb25zdCBkb21Ob3RpZmljYXRpb24gPSAkKGF0b20udmlld3MuZ2V0Vmlldyh0aGlzLmF0b21Ob3RpZmljYXRpb24pKTtcclxuICAgICAgICBkb21Ob3RpZmljYXRpb24ucmVtb3ZlQ2xhc3MoXCJpbmZvXCIpO1xyXG4gICAgICAgIGRvbU5vdGlmaWNhdGlvbi5yZW1vdmVDbGFzcyhcImljb24taW5mb1wiKTtcclxuICAgICAgICBkb21Ob3RpZmljYXRpb24uYWRkQ2xhc3MoXCJzdWNjZXNzXCIpO1xyXG4gICAgICAgIGRvbU5vdGlmaWNhdGlvbi5hZGRDbGFzcyhcImljb24tY2hlY2tcIik7XHJcbiAgICAgICAgdGhpcy5pc0JlaW5nRGlzbWlzc2VkID0gdHJ1ZTtcclxuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHsgdGhpcy5kaXNtaXNzKCk7IH0sIDIwMDApO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBpc0Rpc21pc3NlZCgpOiBib29sZWFuIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5kaXNtaXNzZWQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBkaXNtaXNzKCkge1xyXG4gICAgICAgIHRoaXMuYXRvbU5vdGlmaWNhdGlvbi5kaXNtaXNzKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldERldGFpbEVsZW1lbnQoKTogSlF1ZXJ5IHtcclxuICAgICAgICByZXR1cm4gdGhpcy5nZXRGcm9tRG9tKCQoYXRvbS52aWV3cy5nZXRWaWV3KHRoaXMuYXRvbU5vdGlmaWNhdGlvbikpLCBcIi5jb250ZW50IC5kZXRhaWwgLmRldGFpbC1jb250ZW50XCIpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZ2V0RnJvbURvbShlbGVtZW50OiBKUXVlcnksIHNlbGVjdG9yOiBzdHJpbmcpOiBKUXVlcnkge1xyXG4gICAgICAgIGNvbnN0IGVsID0gZWxlbWVudFswXTtcclxuICAgICAgICBpZiAoIWVsKSByZXR1cm47XHJcbiAgICAgICAgY29uc3QgZm91bmQgPSAoPGFueT5lbCkucXVlcnlTZWxlY3RvckFsbChzZWxlY3Rvcik7XHJcbiAgICAgICAgcmV0dXJuICQoZm91bmRbMF0pO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgY29uc3Qgbm90aWZpY2F0aW9uSGFuZGxlciA9IG5ldyBOb3RpZmljYXRpb25IYW5kbGVyO1xyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
