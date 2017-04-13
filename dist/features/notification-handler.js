'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.notificationHandler = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _path = require('path');

var path = _interopRequireWildcard(_path);

var _tsDisposables = require('ts-disposables');

var _omni = require('../server/omni');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var $ = require('jquery');

var NotificationHandler = function () {
    function NotificationHandler() {
        _classCallCheck(this, NotificationHandler);

        this.required = true;
        this.title = 'Package Restore Notifications';
        this.description = 'Adds support to show package restore progress, when the server initiates a restore operation.';
    }

    _createClass(NotificationHandler, [{
        key: 'activate',
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
                return z.Event === 'log';
            }).filter(function (z) {
                return (0, _lodash.includes)(z.Body.Name, 'PackagesRestoreTool');
            }).filter(function (z) {
                return z.Body.Message.startsWith('Installing');
            }).subscribe(function (e) {
                return _this.packageRestoreNotification.handleEvents(e);
            }));
        }
    }, {
        key: 'dispose',
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
                _this2.notification.show('Package restore started', 'Starting..');
            }
        };
        this.handleUnresolvedDependencies = function (event) {
            if (_this2.notification.isDismissed()) {
                _this2.notification.show('Package restore started', 'Starting..');
            }
            if (event.FileName) {
                var projectName = _this2._findProjectNameFromFileName(event.FileName);
                if (!(0, _lodash.some)(_this2.knownProjects, function (knownProject) {
                    return knownProject === projectName;
                })) {
                    _this2.knownProjects.push(projectName);
                    _this2.notification.addDetail('Unresolved dependencies for ' + projectName + ':', true);
                    if (event.UnresolvedDependencies) {
                        event.UnresolvedDependencies.forEach(function (dep) {
                            _this2.notification.addDetail(' - ' + dep.Name + ' ' + dep.Version);
                        });
                    }
                }
            }
        };
        this.handlePackageRestoreFinished = function (event) {
            _this2.packageRestoreFinished++;
            if (_this2.packageRestoreStarted === _this2.packageRestoreFinished) {
                _this2.notification.setSuccessfulAndDismiss('Package restore finished.');
                _this2.packageRestoreStarted = 0;
                _this2.packageRestoreFinished = 0;
                _this2.knownProjects = [];
            }
        };
        this.handleEvents = function (event) {
            _this2._setPackageInstalled(event.Body.Message);
        };
        this.notification = new OmniNotification();
        this.packageRestoreStarted = 0;
        this.packageRestoreFinished = 0;
        this.knownProjects = [];
    }

    _createClass(PackageRestoreNotification, [{
        key: '_findProjectNameFromFileName',
        value: function _findProjectNameFromFileName(fileName) {
            var split = fileName.split(path.sep);
            return split[split.length - 2];
        }
    }, {
        key: '_setPackageInstalled',
        value: function _setPackageInstalled(message) {
            var match = message.match(/Installing ([a-zA-Z.]*) ([\D?\d?.?-?]*)/);
            var detailLines = this.notification.getDetailElement().children('.line');
            if (!match || match.length < 3) {
                return;
            }
            (0, _lodash.forEach)(detailLines, function (line) {
                if (line.textContent.startsWith(' - ' + match[1] + ' ')) {
                    line.textContent = 'Installed ' + match[1] + ' ' + match[2];
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
        key: 'addDetail',
        value: function addDetail(detail, newline) {
            var details = this.getDetailElement();
            if (!detail) {
                return;
            }
            if (newline) {
                details.append('<br />');
            }
            details.append('<div class="line">' + detail + '</div>');
        }
    }, {
        key: 'show',
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
        key: 'setSuccessfulAndDismiss',
        value: function setSuccessfulAndDismiss(message) {
            var _this4 = this;

            if (this.isBeingDismissed) {
                return;
            }
            this.addDetail(message, true);
            var domNotification = $(atom.views.getView(this.atomNotification));
            domNotification.removeClass('info');
            domNotification.removeClass('icon-info');
            domNotification.addClass('success');
            domNotification.addClass('icon-check');
            this.isBeingDismissed = true;
            setTimeout(function () {
                _this4._dismiss();
            }, 2000);
        }
    }, {
        key: 'isDismissed',
        value: function isDismissed() {
            return this.dismissed;
        }
    }, {
        key: 'getDetailElement',
        value: function getDetailElement() {
            return this._getFromDom($(atom.views.getView(this.atomNotification)), '.content .detail .detail-content');
        }
    }, {
        key: '_dismiss',
        value: function _dismiss() {
            this.atomNotification.dismiss();
        }
    }, {
        key: '_getFromDom',
        value: function _getFromDom(element, selector) {
            var el = element[0];
            if (!el) {
                return;
            }
            var found = el.querySelectorAll(selector);
            return $(found[0]);
        }
    }]);

    return OmniNotification;
}();

var notificationHandler = exports.notificationHandler = new NotificationHandler();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9ub3RpZmljYXRpb24taGFuZGxlci50cyJdLCJuYW1lcyI6WyJwYXRoIiwiJCIsInJlcXVpcmUiLCJOb3RpZmljYXRpb25IYW5kbGVyIiwicmVxdWlyZWQiLCJ0aXRsZSIsImRlc2NyaXB0aW9uIiwiZGlzcG9zYWJsZSIsInBhY2thZ2VSZXN0b3JlTm90aWZpY2F0aW9uIiwiUGFja2FnZVJlc3RvcmVOb3RpZmljYXRpb24iLCJhZGQiLCJsaXN0ZW5lciIsInBhY2thZ2VSZXN0b3JlU3RhcnRlZCIsInN1YnNjcmliZSIsImhhbmRsZVBhY2thZ2VSZXN0b3JlU3RhcnRlZCIsImUiLCJwYWNrYWdlUmVzdG9yZUZpbmlzaGVkIiwiaGFuZGxlUGFja2FnZVJlc3RvcmVGaW5pc2hlZCIsInVucmVzb2x2ZWREZXBlbmRlbmNpZXMiLCJoYW5kbGVVbnJlc29sdmVkRGVwZW5kZW5jaWVzIiwiZXZlbnRzIiwiZmlsdGVyIiwieiIsIkV2ZW50IiwiQm9keSIsIk5hbWUiLCJNZXNzYWdlIiwic3RhcnRzV2l0aCIsImhhbmRsZUV2ZW50cyIsImRpc3Bvc2UiLCJldmVudCIsIm5vdGlmaWNhdGlvbiIsImlzRGlzbWlzc2VkIiwic2hvdyIsIkZpbGVOYW1lIiwicHJvamVjdE5hbWUiLCJfZmluZFByb2plY3ROYW1lRnJvbUZpbGVOYW1lIiwia25vd25Qcm9qZWN0cyIsImtub3duUHJvamVjdCIsInB1c2giLCJhZGREZXRhaWwiLCJVbnJlc29sdmVkRGVwZW5kZW5jaWVzIiwiZm9yRWFjaCIsImRlcCIsIlZlcnNpb24iLCJzZXRTdWNjZXNzZnVsQW5kRGlzbWlzcyIsIl9zZXRQYWNrYWdlSW5zdGFsbGVkIiwiT21uaU5vdGlmaWNhdGlvbiIsImZpbGVOYW1lIiwic3BsaXQiLCJzZXAiLCJsZW5ndGgiLCJtZXNzYWdlIiwibWF0Y2giLCJkZXRhaWxMaW5lcyIsImdldERldGFpbEVsZW1lbnQiLCJjaGlsZHJlbiIsImxpbmUiLCJ0ZXh0Q29udGVudCIsImRpc21pc3NlZCIsImRldGFpbCIsIm5ld2xpbmUiLCJkZXRhaWxzIiwiYXBwZW5kIiwiYXRvbU5vdGlmaWNhdGlvbiIsImF0b20iLCJub3RpZmljYXRpb25zIiwiYWRkSW5mbyIsImRpc21pc3NhYmxlIiwib25EaWREaXNtaXNzIiwiaXNCZWluZ0Rpc21pc3NlZCIsImRvbU5vdGlmaWNhdGlvbiIsInZpZXdzIiwiZ2V0VmlldyIsInJlbW92ZUNsYXNzIiwiYWRkQ2xhc3MiLCJzZXRUaW1lb3V0IiwiX2Rpc21pc3MiLCJfZ2V0RnJvbURvbSIsImRpc21pc3MiLCJlbGVtZW50Iiwic2VsZWN0b3IiLCJlbCIsImZvdW5kIiwicXVlcnlTZWxlY3RvckFsbCIsIm5vdGlmaWNhdGlvbkhhbmRsZXIiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQUVBOztJQUFZQSxJOztBQUNaOztBQUNBOzs7Ozs7QUFFQSxJQUFNQyxJQUFrQkMsUUFBUSxRQUFSLENBQXhCOztJQUVBQyxtQjtBQUFBLG1DQUFBO0FBQUE7O0FBQ1csYUFBQUMsUUFBQSxHQUFXLElBQVg7QUFDQSxhQUFBQyxLQUFBLEdBQVEsK0JBQVI7QUFDQSxhQUFBQyxXQUFBLEdBQWMsK0ZBQWQ7QUE2QlY7Ozs7bUNBeEJrQjtBQUFBOztBQUNYLGlCQUFLQyxVQUFMLEdBQWtCLHdDQUFsQjtBQUVBLGlCQUFLQywwQkFBTCxHQUFrQyxJQUFJQywwQkFBSixFQUFsQztBQUVBLGlCQUFLRixVQUFMLENBQWdCRyxHQUFoQixDQUFvQixXQUFLQyxRQUFMLENBQWNDLHFCQUFkLENBQW9DQyxTQUFwQyxDQUE4QztBQUFBLHVCQUM5RCxNQUFLTCwwQkFBTCxDQUFnQ00sMkJBQWhDLENBQTREQyxDQUE1RCxDQUQ4RDtBQUFBLGFBQTlDLENBQXBCO0FBR0EsaUJBQUtSLFVBQUwsQ0FBZ0JHLEdBQWhCLENBQW9CLFdBQUtDLFFBQUwsQ0FBY0ssc0JBQWQsQ0FBcUNILFNBQXJDLENBQStDO0FBQUEsdUJBQy9ELE1BQUtMLDBCQUFMLENBQWdDUyw0QkFBaEMsQ0FBNkRG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QjtBQUNIOzs7b0NBRW1CQyxPLEVBQWlCQyxRLEVBQWdCO0FBQ2pELGdCQUFNQyxLQUFLRixRQUFRLENBQVIsQ0FBWDtBQUNBLGdCQUFJLENBQUNFLEVBQUwsRUFBUztBQUFFO0FBQVM7QUFDcEIsZ0JBQU1DLFFBQWNELEdBQUlFLGdCQUFKLENBQXFCSCxRQUFyQixDQUFwQjtBQUNBLG1CQUFPaEYsRUFBRWtGLE1BQU0sQ0FBTixDQUFGLENBQVA7QUFDSDs7Ozs7O0FBSUUsSUFBTUUsb0RBQXNCLElBQUlsRixtQkFBSixFQUE1QiIsImZpbGUiOiJsaWIvZmVhdHVyZXMvbm90aWZpY2F0aW9uLWhhbmRsZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBmb3JFYWNoLCBpbmNsdWRlcywgc29tZSB9IGZyb20gJ2xvZGFzaCc7XHJcbmltcG9ydCB7IE1vZGVscywgU3RkaW8gfSBmcm9tICdvbW5pc2hhcnAtY2xpZW50JztcclxuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcclxuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSB9IGZyb20gJ3RzLWRpc3Bvc2FibGVzJztcclxuaW1wb3J0IHsgT21uaSB9IGZyb20gJy4uL3NlcnZlci9vbW5pJztcclxuLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLXZhci1yZXF1aXJlcyBuby1yZXF1aXJlLWltcG9ydHNcclxuY29uc3QgJDogSlF1ZXJ5U3RhdGljID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcblxyXG5jbGFzcyBOb3RpZmljYXRpb25IYW5kbGVyIGltcGxlbWVudHMgSUZlYXR1cmUge1xyXG4gICAgcHVibGljIHJlcXVpcmVkID0gdHJ1ZTtcclxuICAgIHB1YmxpYyB0aXRsZSA9ICdQYWNrYWdlIFJlc3RvcmUgTm90aWZpY2F0aW9ucyc7XHJcbiAgICBwdWJsaWMgZGVzY3JpcHRpb24gPSAnQWRkcyBzdXBwb3J0IHRvIHNob3cgcGFja2FnZSByZXN0b3JlIHByb2dyZXNzLCB3aGVuIHRoZSBzZXJ2ZXIgaW5pdGlhdGVzIGEgcmVzdG9yZSBvcGVyYXRpb24uJztcclxuXHJcbiAgICBwcml2YXRlIGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XHJcbiAgICBwcml2YXRlIHBhY2thZ2VSZXN0b3JlTm90aWZpY2F0aW9uOiBQYWNrYWdlUmVzdG9yZU5vdGlmaWNhdGlvbjtcclxuXHJcbiAgICBwdWJsaWMgYWN0aXZhdGUoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuXHJcbiAgICAgICAgdGhpcy5wYWNrYWdlUmVzdG9yZU5vdGlmaWNhdGlvbiA9IG5ldyBQYWNrYWdlUmVzdG9yZU5vdGlmaWNhdGlvbigpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkubGlzdGVuZXIucGFja2FnZVJlc3RvcmVTdGFydGVkLnN1YnNjcmliZShlID0+XHJcbiAgICAgICAgICAgIHRoaXMucGFja2FnZVJlc3RvcmVOb3RpZmljYXRpb24uaGFuZGxlUGFja2FnZVJlc3RvcmVTdGFydGVkKGUpKSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5saXN0ZW5lci5wYWNrYWdlUmVzdG9yZUZpbmlzaGVkLnN1YnNjcmliZShlID0+XHJcbiAgICAgICAgICAgIHRoaXMucGFja2FnZVJlc3RvcmVOb3RpZmljYXRpb24uaGFuZGxlUGFja2FnZVJlc3RvcmVGaW5pc2hlZChlKSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkubGlzdGVuZXIudW5yZXNvbHZlZERlcGVuZGVuY2llcy5zdWJzY3JpYmUoZSA9PlxyXG4gICAgICAgICAgICB0aGlzLnBhY2thZ2VSZXN0b3JlTm90aWZpY2F0aW9uLmhhbmRsZVVucmVzb2x2ZWREZXBlbmRlbmNpZXMoZSkpKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmxpc3RlbmVyLmV2ZW50c1xyXG4gICAgICAgICAgICAuZmlsdGVyKHogPT4gei5FdmVudCA9PT0gJ2xvZycpXHJcbiAgICAgICAgICAgIC5maWx0ZXIoeiA9PiBpbmNsdWRlcyh6LkJvZHkuTmFtZSwgJ1BhY2thZ2VzUmVzdG9yZVRvb2wnKSlcclxuICAgICAgICAgICAgLmZpbHRlcih6ID0+IHouQm9keS5NZXNzYWdlLnN0YXJ0c1dpdGgoJ0luc3RhbGxpbmcnKSlcclxuICAgICAgICAgICAgLnN1YnNjcmliZShlID0+IHRoaXMucGFja2FnZVJlc3RvcmVOb3RpZmljYXRpb24uaGFuZGxlRXZlbnRzKGUpKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgIH1cclxufVxyXG5cclxuLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm1heC1jbGFzc2VzLXBlci1maWxlXHJcbmNsYXNzIFBhY2thZ2VSZXN0b3JlTm90aWZpY2F0aW9uIHtcclxuICAgIHByaXZhdGUgbm90aWZpY2F0aW9uOiBPbW5pTm90aWZpY2F0aW9uO1xyXG4gICAgcHJpdmF0ZSBwYWNrYWdlUmVzdG9yZVN0YXJ0ZWQ6IG51bWJlcjtcclxuICAgIHByaXZhdGUgcGFja2FnZVJlc3RvcmVGaW5pc2hlZDogbnVtYmVyO1xyXG4gICAgcHJpdmF0ZSBrbm93blByb2plY3RzOiBzdHJpbmdbXTtcclxuXHJcbiAgICBwdWJsaWMgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy5ub3RpZmljYXRpb24gPSBuZXcgT21uaU5vdGlmaWNhdGlvbigpO1xyXG4gICAgICAgIHRoaXMucGFja2FnZVJlc3RvcmVTdGFydGVkID0gMDtcclxuICAgICAgICB0aGlzLnBhY2thZ2VSZXN0b3JlRmluaXNoZWQgPSAwO1xyXG4gICAgICAgIHRoaXMua25vd25Qcm9qZWN0cyA9IFtdO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBoYW5kbGVQYWNrYWdlUmVzdG9yZVN0YXJ0ZWQgPSAoZXZlbnQ6IE1vZGVscy5QYWNrYWdlUmVzdG9yZU1lc3NhZ2UpID0+IHtcclxuICAgICAgICAvLyBDb3VudCBob3cgbWFueSBvZiB0aGVzZSB3ZSBnZXQgc28gd2Uga25vdyB3aGVuIHRvIGRpc21pc3MgdGhlIG5vdGlmaWNhdGlvblxyXG4gICAgICAgIHRoaXMucGFja2FnZVJlc3RvcmVTdGFydGVkKys7XHJcbiAgICAgICAgaWYgKHRoaXMubm90aWZpY2F0aW9uLmlzRGlzbWlzc2VkKCkpIHtcclxuICAgICAgICAgICAgdGhpcy5ub3RpZmljYXRpb24uc2hvdygnUGFja2FnZSByZXN0b3JlIHN0YXJ0ZWQnLCAnU3RhcnRpbmcuLicpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgcHVibGljIGhhbmRsZVVucmVzb2x2ZWREZXBlbmRlbmNpZXMgPSAoZXZlbnQ6IE1vZGVscy5VbnJlc29sdmVkRGVwZW5kZW5jaWVzTWVzc2FnZSkgPT4ge1xyXG4gICAgICAgIC8vIFNvbWV0aW1lcyBVbnJlc29sdmVkRGVwZW5kZW5jaWVzIGV2ZW50IGlzIHNlbnQgYmVmb3JlIFBhY2thZ2VSZXN0b3JlU3RhcnRlZFxyXG4gICAgICAgIGlmICh0aGlzLm5vdGlmaWNhdGlvbi5pc0Rpc21pc3NlZCgpKSB7XHJcbiAgICAgICAgICAgIHRoaXMubm90aWZpY2F0aW9uLnNob3coJ1BhY2thZ2UgcmVzdG9yZSBzdGFydGVkJywgJ1N0YXJ0aW5nLi4nKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChldmVudC5GaWxlTmFtZSkge1xyXG4gICAgICAgICAgICBjb25zdCBwcm9qZWN0TmFtZSA9IHRoaXMuX2ZpbmRQcm9qZWN0TmFtZUZyb21GaWxlTmFtZShldmVudC5GaWxlTmFtZSk7XHJcbiAgICAgICAgICAgIC8vIENsaWVudCBnZXRzIG1vcmUgdGhhbiBvbmUgb2YgZWFjaCBVbnJlc29sdmVkRGVwZW5kZW5jaWVzIGV2ZW50cyBmb3IgZWFjaCBwcm9qZWN0XHJcbiAgICAgICAgICAgIC8vIERvblwidCBzaG93IG11bHRpcGxlIGluc3RhbmNlcyBvZiBhIHByb2plY3QgaW4gdGhlIG5vdGlmaWNhdGlvblxyXG4gICAgICAgICAgICBpZiAoIXNvbWUodGhpcy5rbm93blByb2plY3RzLCBrbm93blByb2plY3QgPT4geyByZXR1cm4ga25vd25Qcm9qZWN0ID09PSBwcm9qZWN0TmFtZTsgfSkpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMua25vd25Qcm9qZWN0cy5wdXNoKHByb2plY3ROYW1lKTtcclxuICAgICAgICAgICAgICAgIHRoaXMubm90aWZpY2F0aW9uLmFkZERldGFpbChgVW5yZXNvbHZlZCBkZXBlbmRlbmNpZXMgZm9yICR7cHJvamVjdE5hbWV9OmAsIHRydWUpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LlVucmVzb2x2ZWREZXBlbmRlbmNpZXMpIHtcclxuICAgICAgICAgICAgICAgICAgICBldmVudC5VbnJlc29sdmVkRGVwZW5kZW5jaWVzLmZvckVhY2goZGVwID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5ub3RpZmljYXRpb24uYWRkRGV0YWlsKGAgLSAke2RlcC5OYW1lfSAke2RlcC5WZXJzaW9ufWApO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBwdWJsaWMgaGFuZGxlUGFja2FnZVJlc3RvcmVGaW5pc2hlZCA9IChldmVudDogTW9kZWxzLlBhY2thZ2VSZXN0b3JlTWVzc2FnZSkgPT4ge1xyXG4gICAgICAgIC8vIENvdW50IGhvdyBtYW55IG9mIHRoZXNlIHdlIGdldCBzbyB3ZSBrbm93IHdoZW4gdG8gZGlzbWlzcyB0aGUgbm90aWZpY2F0aW9uXHJcbiAgICAgICAgdGhpcy5wYWNrYWdlUmVzdG9yZUZpbmlzaGVkKys7XHJcbiAgICAgICAgaWYgKHRoaXMucGFja2FnZVJlc3RvcmVTdGFydGVkID09PSB0aGlzLnBhY2thZ2VSZXN0b3JlRmluaXNoZWQpIHtcclxuICAgICAgICAgICAgdGhpcy5ub3RpZmljYXRpb24uc2V0U3VjY2Vzc2Z1bEFuZERpc21pc3MoJ1BhY2thZ2UgcmVzdG9yZSBmaW5pc2hlZC4nKTtcclxuICAgICAgICAgICAgdGhpcy5wYWNrYWdlUmVzdG9yZVN0YXJ0ZWQgPSAwO1xyXG4gICAgICAgICAgICB0aGlzLnBhY2thZ2VSZXN0b3JlRmluaXNoZWQgPSAwO1xyXG4gICAgICAgICAgICB0aGlzLmtub3duUHJvamVjdHMgPSBbXTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIHB1YmxpYyBoYW5kbGVFdmVudHMgPSAoZXZlbnQ6IFN0ZGlvLlByb3RvY29sLkV2ZW50UGFja2V0KSA9PiB7XHJcbiAgICAgICAgdGhpcy5fc2V0UGFja2FnZUluc3RhbGxlZChldmVudC5Cb2R5Lk1lc3NhZ2UpO1xyXG4gICAgfTtcclxuXHJcbiAgICBwcml2YXRlIF9maW5kUHJvamVjdE5hbWVGcm9tRmlsZU5hbWUoZmlsZU5hbWU6IHN0cmluZyk6IHN0cmluZyB7XHJcbiAgICAgICAgY29uc3Qgc3BsaXQgPSBmaWxlTmFtZS5zcGxpdChwYXRoLnNlcCk7XHJcbiAgICAgICAgcmV0dXJuIHNwbGl0W3NwbGl0Lmxlbmd0aCAtIDJdO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX3NldFBhY2thZ2VJbnN0YWxsZWQobWVzc2FnZTogc3RyaW5nKSB7XHJcbiAgICAgICAgY29uc3QgbWF0Y2ggPSBtZXNzYWdlLm1hdGNoKC9JbnN0YWxsaW5nIChbYS16QS1aLl0qKSAoW1xcRD9cXGQ/Lj8tP10qKS8pO1xyXG4gICAgICAgIGNvbnN0IGRldGFpbExpbmVzID0gdGhpcy5ub3RpZmljYXRpb24uZ2V0RGV0YWlsRWxlbWVudCgpLmNoaWxkcmVuKCcubGluZScpO1xyXG4gICAgICAgIGlmICghbWF0Y2ggfHwgbWF0Y2gubGVuZ3RoIDwgMykgeyByZXR1cm47IH1cclxuICAgICAgICBmb3JFYWNoKGRldGFpbExpbmVzLCBsaW5lID0+IHtcclxuICAgICAgICAgICAgaWYgKGxpbmUudGV4dENvbnRlbnQuc3RhcnRzV2l0aChgIC0gJHttYXRjaFsxXX0gYCkpIHtcclxuICAgICAgICAgICAgICAgIGxpbmUudGV4dENvbnRlbnQgPSBgSW5zdGFsbGVkICR7bWF0Y2hbMV19ICR7bWF0Y2hbMl19YDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59XHJcblxyXG4vLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bWF4LWNsYXNzZXMtcGVyLWZpbGVcclxuY2xhc3MgT21uaU5vdGlmaWNhdGlvbiB7XHJcbiAgICBwcml2YXRlIGF0b21Ob3RpZmljYXRpb246IEF0b20uTm90aWZpY2F0aW9uO1xyXG4gICAgcHJpdmF0ZSBkaXNtaXNzZWQ6IGJvb2xlYW47XHJcbiAgICBwcml2YXRlIGlzQmVpbmdEaXNtaXNzZWQ6IGJvb2xlYW47XHJcblxyXG4gICAgcHVibGljIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHRoaXMuZGlzbWlzc2VkID0gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgYWRkRGV0YWlsKGRldGFpbDogc3RyaW5nLCBuZXdsaW5lPzogYm9vbGVhbikge1xyXG4gICAgICAgIGNvbnN0IGRldGFpbHMgPSB0aGlzLmdldERldGFpbEVsZW1lbnQoKTtcclxuICAgICAgICBpZiAoIWRldGFpbCkgeyByZXR1cm47IH1cclxuICAgICAgICBpZiAobmV3bGluZSkgeyBkZXRhaWxzLmFwcGVuZCgnPGJyIC8+Jyk7IH1cclxuICAgICAgICBkZXRhaWxzLmFwcGVuZChgPGRpdiBjbGFzcz1cImxpbmVcIj4ke2RldGFpbH08L2Rpdj5gKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2hvdyhtZXNzYWdlOiBzdHJpbmcsIGRldGFpbDogc3RyaW5nKSB7XHJcbiAgICAgICAgdGhpcy5hdG9tTm90aWZpY2F0aW9uID0gYXRvbS5ub3RpZmljYXRpb25zLmFkZEluZm8obWVzc2FnZSwgeyBkZXRhaWwsIGRpc21pc3NhYmxlOiB0cnVlIH0pO1xyXG4gICAgICAgIHRoaXMuZGlzbWlzc2VkID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5hdG9tTm90aWZpY2F0aW9uLm9uRGlkRGlzbWlzcyhub3RpZmljYXRpb24gPT4ge1xyXG4gICAgICAgICAgICB0aGlzLmRpc21pc3NlZCA9IHRydWU7XHJcbiAgICAgICAgICAgIHRoaXMuaXNCZWluZ0Rpc21pc3NlZCA9IGZhbHNlO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzZXRTdWNjZXNzZnVsQW5kRGlzbWlzcyhtZXNzYWdlOiBzdHJpbmcpIHtcclxuICAgICAgICBpZiAodGhpcy5pc0JlaW5nRGlzbWlzc2VkKSB7IHJldHVybjsgfVxyXG4gICAgICAgIHRoaXMuYWRkRGV0YWlsKG1lc3NhZ2UsIHRydWUpO1xyXG4gICAgICAgIGNvbnN0IGRvbU5vdGlmaWNhdGlvbiA9ICQoYXRvbS52aWV3cy5nZXRWaWV3KHRoaXMuYXRvbU5vdGlmaWNhdGlvbikpO1xyXG4gICAgICAgIGRvbU5vdGlmaWNhdGlvbi5yZW1vdmVDbGFzcygnaW5mbycpO1xyXG4gICAgICAgIGRvbU5vdGlmaWNhdGlvbi5yZW1vdmVDbGFzcygnaWNvbi1pbmZvJyk7XHJcbiAgICAgICAgZG9tTm90aWZpY2F0aW9uLmFkZENsYXNzKCdzdWNjZXNzJyk7XHJcbiAgICAgICAgZG9tTm90aWZpY2F0aW9uLmFkZENsYXNzKCdpY29uLWNoZWNrJyk7XHJcbiAgICAgICAgdGhpcy5pc0JlaW5nRGlzbWlzc2VkID0gdHJ1ZTtcclxuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHsgdGhpcy5fZGlzbWlzcygpOyB9LCAyMDAwKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgaXNEaXNtaXNzZWQoKTogYm9vbGVhbiB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZGlzbWlzc2VkO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXREZXRhaWxFbGVtZW50KCk6IEpRdWVyeSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2dldEZyb21Eb20oJChhdG9tLnZpZXdzLmdldFZpZXcodGhpcy5hdG9tTm90aWZpY2F0aW9uKSksICcuY29udGVudCAuZGV0YWlsIC5kZXRhaWwtY29udGVudCcpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX2Rpc21pc3MoKSB7XHJcbiAgICAgICAgdGhpcy5hdG9tTm90aWZpY2F0aW9uLmRpc21pc3MoKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9nZXRGcm9tRG9tKGVsZW1lbnQ6IEpRdWVyeSwgc2VsZWN0b3I6IHN0cmluZyk6IEpRdWVyeSB7XHJcbiAgICAgICAgY29uc3QgZWwgPSBlbGVtZW50WzBdO1xyXG4gICAgICAgIGlmICghZWwpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgY29uc3QgZm91bmQgPSAoPGFueT5lbCkucXVlcnlTZWxlY3RvckFsbChzZWxlY3Rvcik7XHJcbiAgICAgICAgcmV0dXJuICQoZm91bmRbMF0pO1xyXG4gICAgfVxyXG59XHJcblxyXG4vLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6ZXhwb3J0LW5hbWVcclxuZXhwb3J0IGNvbnN0IG5vdGlmaWNhdGlvbkhhbmRsZXIgPSBuZXcgTm90aWZpY2F0aW9uSGFuZGxlcigpO1xyXG4iXX0=
