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
                (function () {
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
                })();
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9ub3RpZmljYXRpb24taGFuZGxlci50cyJdLCJuYW1lcyI6WyJwYXRoIiwiJCIsInJlcXVpcmUiLCJOb3RpZmljYXRpb25IYW5kbGVyIiwicmVxdWlyZWQiLCJ0aXRsZSIsImRlc2NyaXB0aW9uIiwiZGlzcG9zYWJsZSIsInBhY2thZ2VSZXN0b3JlTm90aWZpY2F0aW9uIiwiUGFja2FnZVJlc3RvcmVOb3RpZmljYXRpb24iLCJhZGQiLCJsaXN0ZW5lciIsInBhY2thZ2VSZXN0b3JlU3RhcnRlZCIsInN1YnNjcmliZSIsImhhbmRsZVBhY2thZ2VSZXN0b3JlU3RhcnRlZCIsImUiLCJwYWNrYWdlUmVzdG9yZUZpbmlzaGVkIiwiaGFuZGxlUGFja2FnZVJlc3RvcmVGaW5pc2hlZCIsInVucmVzb2x2ZWREZXBlbmRlbmNpZXMiLCJoYW5kbGVVbnJlc29sdmVkRGVwZW5kZW5jaWVzIiwiZXZlbnRzIiwiZmlsdGVyIiwieiIsIkV2ZW50IiwiQm9keSIsIk5hbWUiLCJNZXNzYWdlIiwic3RhcnRzV2l0aCIsImhhbmRsZUV2ZW50cyIsImRpc3Bvc2UiLCJldmVudCIsIm5vdGlmaWNhdGlvbiIsImlzRGlzbWlzc2VkIiwic2hvdyIsIkZpbGVOYW1lIiwicHJvamVjdE5hbWUiLCJfZmluZFByb2plY3ROYW1lRnJvbUZpbGVOYW1lIiwia25vd25Qcm9qZWN0cyIsImtub3duUHJvamVjdCIsInB1c2giLCJhZGREZXRhaWwiLCJVbnJlc29sdmVkRGVwZW5kZW5jaWVzIiwiZm9yRWFjaCIsImRlcCIsIlZlcnNpb24iLCJzZXRTdWNjZXNzZnVsQW5kRGlzbWlzcyIsIl9zZXRQYWNrYWdlSW5zdGFsbGVkIiwiT21uaU5vdGlmaWNhdGlvbiIsImZpbGVOYW1lIiwic3BsaXQiLCJzZXAiLCJsZW5ndGgiLCJtZXNzYWdlIiwibWF0Y2giLCJkZXRhaWxMaW5lcyIsImdldERldGFpbEVsZW1lbnQiLCJjaGlsZHJlbiIsImxpbmUiLCJ0ZXh0Q29udGVudCIsImRpc21pc3NlZCIsImRldGFpbCIsIm5ld2xpbmUiLCJkZXRhaWxzIiwiYXBwZW5kIiwiYXRvbU5vdGlmaWNhdGlvbiIsImF0b20iLCJub3RpZmljYXRpb25zIiwiYWRkSW5mbyIsImRpc21pc3NhYmxlIiwib25EaWREaXNtaXNzIiwiaXNCZWluZ0Rpc21pc3NlZCIsImRvbU5vdGlmaWNhdGlvbiIsInZpZXdzIiwiZ2V0VmlldyIsInJlbW92ZUNsYXNzIiwiYWRkQ2xhc3MiLCJzZXRUaW1lb3V0IiwiX2Rpc21pc3MiLCJfZ2V0RnJvbURvbSIsImRpc21pc3MiLCJlbGVtZW50Iiwic2VsZWN0b3IiLCJlbCIsImZvdW5kIiwicXVlcnlTZWxlY3RvckFsbCIsIm5vdGlmaWNhdGlvbkhhbmRsZXIiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQUVBOztJQUFZQSxJOztBQUNaOztBQUNBOzs7Ozs7QUFFQSxJQUFNQyxJQUFrQkMsUUFBUSxRQUFSLENBQXhCOztJQUVBQyxtQjtBQUFBLG1DQUFBO0FBQUE7O0FBQ1csYUFBQUMsUUFBQSxHQUFXLElBQVg7QUFDQSxhQUFBQyxLQUFBLEdBQVEsK0JBQVI7QUFDQSxhQUFBQyxXQUFBLEdBQWMsK0ZBQWQ7QUE2QlY7Ozs7bUNBeEJrQjtBQUFBOztBQUNYLGlCQUFLQyxVQUFMLEdBQWtCLHdDQUFsQjtBQUVBLGlCQUFLQywwQkFBTCxHQUFrQyxJQUFJQywwQkFBSixFQUFsQztBQUVBLGlCQUFLRixVQUFMLENBQWdCRyxHQUFoQixDQUFvQixXQUFLQyxRQUFMLENBQWNDLHFCQUFkLENBQW9DQyxTQUFwQyxDQUE4QztBQUFBLHVCQUM5RCxNQUFLTCwwQkFBTCxDQUFnQ00sMkJBQWhDLENBQTREQyxDQUE1RCxDQUQ4RDtBQUFBLGFBQTlDLENBQXBCO0FBR0EsaUJBQUtSLFVBQUwsQ0FBZ0JHLEdBQWhCLENBQW9CLFdBQUtDLFFBQUwsQ0FBY0ssc0JBQWQsQ0FBcUNILFNBQXJDLENBQStDO0FBQUEsdUJBQy9ELE1BQUtMLDBCQUFMLENBQWdDUyw0QkFBaEMsQ0FBNkRG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Q0FBc0JlLE9BQXRCO0FBQ0g7OztvQ0FFbUJDLE8sRUFBaUJDLFEsRUFBZ0I7QUFDakQsZ0JBQU1DLEtBQUtGLFFBQVEsQ0FBUixDQUFYO0FBQ0EsZ0JBQUksQ0FBQ0UsRUFBTCxFQUFTO0FBQUU7QUFBUztBQUNwQixnQkFBTUMsUUFBY0QsR0FBSUUsZ0JBQUosQ0FBcUJILFFBQXJCLENBQXBCO0FBQ0EsbUJBQU9oRixFQUFFa0YsTUFBTSxDQUFOLENBQUYsQ0FBUDtBQUNIOzs7Ozs7QUFJRSxJQUFNRSxvREFBc0IsSUFBSWxGLG1CQUFKLEVBQTVCIiwiZmlsZSI6ImxpYi9mZWF0dXJlcy9ub3RpZmljYXRpb24taGFuZGxlci5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGZvckVhY2gsIGluY2x1ZGVzLCBzb21lIH0gZnJvbSAnbG9kYXNoJztcclxuaW1wb3J0IHsgTW9kZWxzLCBTdGRpbyB9IGZyb20gJ29tbmlzaGFycC1jbGllbnQnO1xyXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlIH0gZnJvbSAndHMtZGlzcG9zYWJsZXMnO1xyXG5pbXBvcnQgeyBPbW5pIH0gZnJvbSAnLi4vc2VydmVyL29tbmknO1xyXG4vLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8tdmFyLXJlcXVpcmVzIG5vLXJlcXVpcmUtaW1wb3J0c1xyXG5jb25zdCAkOiBKUXVlcnlTdGF0aWMgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbmNsYXNzIE5vdGlmaWNhdGlvbkhhbmRsZXIgaW1wbGVtZW50cyBJRmVhdHVyZSB7XHJcbiAgICBwdWJsaWMgcmVxdWlyZWQgPSB0cnVlO1xyXG4gICAgcHVibGljIHRpdGxlID0gJ1BhY2thZ2UgUmVzdG9yZSBOb3RpZmljYXRpb25zJztcclxuICAgIHB1YmxpYyBkZXNjcmlwdGlvbiA9ICdBZGRzIHN1cHBvcnQgdG8gc2hvdyBwYWNrYWdlIHJlc3RvcmUgcHJvZ3Jlc3MsIHdoZW4gdGhlIHNlcnZlciBpbml0aWF0ZXMgYSByZXN0b3JlIG9wZXJhdGlvbi4nO1xyXG5cclxuICAgIHByaXZhdGUgZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxuICAgIHByaXZhdGUgcGFja2FnZVJlc3RvcmVOb3RpZmljYXRpb246IFBhY2thZ2VSZXN0b3JlTm90aWZpY2F0aW9uO1xyXG5cclxuICAgIHB1YmxpYyBhY3RpdmF0ZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG5cclxuICAgICAgICB0aGlzLnBhY2thZ2VSZXN0b3JlTm90aWZpY2F0aW9uID0gbmV3IFBhY2thZ2VSZXN0b3JlTm90aWZpY2F0aW9uKCk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5saXN0ZW5lci5wYWNrYWdlUmVzdG9yZVN0YXJ0ZWQuc3Vic2NyaWJlKGUgPT5cclxuICAgICAgICAgICAgdGhpcy5wYWNrYWdlUmVzdG9yZU5vdGlmaWNhdGlvbi5oYW5kbGVQYWNrYWdlUmVzdG9yZVN0YXJ0ZWQoZSkpKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmxpc3RlbmVyLnBhY2thZ2VSZXN0b3JlRmluaXNoZWQuc3Vic2NyaWJlKGUgPT5cclxuICAgICAgICAgICAgdGhpcy5wYWNrYWdlUmVzdG9yZU5vdGlmaWNhdGlvbi5oYW5kbGVQYWNrYWdlUmVzdG9yZUZpbmlzaGVkKGUpKSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5saXN0ZW5lci51bnJlc29sdmVkRGVwZW5kZW5jaWVzLnN1YnNjcmliZShlID0+XHJcbiAgICAgICAgICAgIHRoaXMucGFja2FnZVJlc3RvcmVOb3RpZmljYXRpb24uaGFuZGxlVW5yZXNvbHZlZERlcGVuZGVuY2llcyhlKSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkubGlzdGVuZXIuZXZlbnRzXHJcbiAgICAgICAgICAgIC5maWx0ZXIoeiA9PiB6LkV2ZW50ID09PSAnbG9nJylcclxuICAgICAgICAgICAgLmZpbHRlcih6ID0+IGluY2x1ZGVzKHouQm9keS5OYW1lLCAnUGFja2FnZXNSZXN0b3JlVG9vbCcpKVxyXG4gICAgICAgICAgICAuZmlsdGVyKHogPT4gei5Cb2R5Lk1lc3NhZ2Uuc3RhcnRzV2l0aCgnSW5zdGFsbGluZycpKVxyXG4gICAgICAgICAgICAuc3Vic2NyaWJlKGUgPT4gdGhpcy5wYWNrYWdlUmVzdG9yZU5vdGlmaWNhdGlvbi5oYW5kbGVFdmVudHMoZSkpKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGlzcG9zZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgfVxyXG59XHJcblxyXG4vLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bWF4LWNsYXNzZXMtcGVyLWZpbGVcclxuY2xhc3MgUGFja2FnZVJlc3RvcmVOb3RpZmljYXRpb24ge1xyXG4gICAgcHJpdmF0ZSBub3RpZmljYXRpb246IE9tbmlOb3RpZmljYXRpb247XHJcbiAgICBwcml2YXRlIHBhY2thZ2VSZXN0b3JlU3RhcnRlZDogbnVtYmVyO1xyXG4gICAgcHJpdmF0ZSBwYWNrYWdlUmVzdG9yZUZpbmlzaGVkOiBudW1iZXI7XHJcbiAgICBwcml2YXRlIGtub3duUHJvamVjdHM6IHN0cmluZ1tdO1xyXG5cclxuICAgIHB1YmxpYyBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICB0aGlzLm5vdGlmaWNhdGlvbiA9IG5ldyBPbW5pTm90aWZpY2F0aW9uKCk7XHJcbiAgICAgICAgdGhpcy5wYWNrYWdlUmVzdG9yZVN0YXJ0ZWQgPSAwO1xyXG4gICAgICAgIHRoaXMucGFja2FnZVJlc3RvcmVGaW5pc2hlZCA9IDA7XHJcbiAgICAgICAgdGhpcy5rbm93blByb2plY3RzID0gW107XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGhhbmRsZVBhY2thZ2VSZXN0b3JlU3RhcnRlZCA9IChldmVudDogTW9kZWxzLlBhY2thZ2VSZXN0b3JlTWVzc2FnZSkgPT4ge1xyXG4gICAgICAgIC8vIENvdW50IGhvdyBtYW55IG9mIHRoZXNlIHdlIGdldCBzbyB3ZSBrbm93IHdoZW4gdG8gZGlzbWlzcyB0aGUgbm90aWZpY2F0aW9uXHJcbiAgICAgICAgdGhpcy5wYWNrYWdlUmVzdG9yZVN0YXJ0ZWQrKztcclxuICAgICAgICBpZiAodGhpcy5ub3RpZmljYXRpb24uaXNEaXNtaXNzZWQoKSkge1xyXG4gICAgICAgICAgICB0aGlzLm5vdGlmaWNhdGlvbi5zaG93KCdQYWNrYWdlIHJlc3RvcmUgc3RhcnRlZCcsICdTdGFydGluZy4uJyk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBwdWJsaWMgaGFuZGxlVW5yZXNvbHZlZERlcGVuZGVuY2llcyA9IChldmVudDogTW9kZWxzLlVucmVzb2x2ZWREZXBlbmRlbmNpZXNNZXNzYWdlKSA9PiB7XHJcbiAgICAgICAgLy8gU29tZXRpbWVzIFVucmVzb2x2ZWREZXBlbmRlbmNpZXMgZXZlbnQgaXMgc2VudCBiZWZvcmUgUGFja2FnZVJlc3RvcmVTdGFydGVkXHJcbiAgICAgICAgaWYgKHRoaXMubm90aWZpY2F0aW9uLmlzRGlzbWlzc2VkKCkpIHtcclxuICAgICAgICAgICAgdGhpcy5ub3RpZmljYXRpb24uc2hvdygnUGFja2FnZSByZXN0b3JlIHN0YXJ0ZWQnLCAnU3RhcnRpbmcuLicpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGV2ZW50LkZpbGVOYW1lKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHByb2plY3ROYW1lID0gdGhpcy5fZmluZFByb2plY3ROYW1lRnJvbUZpbGVOYW1lKGV2ZW50LkZpbGVOYW1lKTtcclxuICAgICAgICAgICAgLy8gQ2xpZW50IGdldHMgbW9yZSB0aGFuIG9uZSBvZiBlYWNoIFVucmVzb2x2ZWREZXBlbmRlbmNpZXMgZXZlbnRzIGZvciBlYWNoIHByb2plY3RcclxuICAgICAgICAgICAgLy8gRG9uXCJ0IHNob3cgbXVsdGlwbGUgaW5zdGFuY2VzIG9mIGEgcHJvamVjdCBpbiB0aGUgbm90aWZpY2F0aW9uXHJcbiAgICAgICAgICAgIGlmICghc29tZSh0aGlzLmtub3duUHJvamVjdHMsIGtub3duUHJvamVjdCA9PiB7IHJldHVybiBrbm93blByb2plY3QgPT09IHByb2plY3ROYW1lOyB9KSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5rbm93blByb2plY3RzLnB1c2gocHJvamVjdE5hbWUpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5ub3RpZmljYXRpb24uYWRkRGV0YWlsKGBVbnJlc29sdmVkIGRlcGVuZGVuY2llcyBmb3IgJHtwcm9qZWN0TmFtZX06YCwgdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQuVW5yZXNvbHZlZERlcGVuZGVuY2llcykge1xyXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LlVucmVzb2x2ZWREZXBlbmRlbmNpZXMuZm9yRWFjaChkZXAgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm5vdGlmaWNhdGlvbi5hZGREZXRhaWwoYCAtICR7ZGVwLk5hbWV9ICR7ZGVwLlZlcnNpb259YCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIHB1YmxpYyBoYW5kbGVQYWNrYWdlUmVzdG9yZUZpbmlzaGVkID0gKGV2ZW50OiBNb2RlbHMuUGFja2FnZVJlc3RvcmVNZXNzYWdlKSA9PiB7XHJcbiAgICAgICAgLy8gQ291bnQgaG93IG1hbnkgb2YgdGhlc2Ugd2UgZ2V0IHNvIHdlIGtub3cgd2hlbiB0byBkaXNtaXNzIHRoZSBub3RpZmljYXRpb25cclxuICAgICAgICB0aGlzLnBhY2thZ2VSZXN0b3JlRmluaXNoZWQrKztcclxuICAgICAgICBpZiAodGhpcy5wYWNrYWdlUmVzdG9yZVN0YXJ0ZWQgPT09IHRoaXMucGFja2FnZVJlc3RvcmVGaW5pc2hlZCkge1xyXG4gICAgICAgICAgICB0aGlzLm5vdGlmaWNhdGlvbi5zZXRTdWNjZXNzZnVsQW5kRGlzbWlzcygnUGFja2FnZSByZXN0b3JlIGZpbmlzaGVkLicpO1xyXG4gICAgICAgICAgICB0aGlzLnBhY2thZ2VSZXN0b3JlU3RhcnRlZCA9IDA7XHJcbiAgICAgICAgICAgIHRoaXMucGFja2FnZVJlc3RvcmVGaW5pc2hlZCA9IDA7XHJcbiAgICAgICAgICAgIHRoaXMua25vd25Qcm9qZWN0cyA9IFtdO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgcHVibGljIGhhbmRsZUV2ZW50cyA9IChldmVudDogU3RkaW8uUHJvdG9jb2wuRXZlbnRQYWNrZXQpID0+IHtcclxuICAgICAgICB0aGlzLl9zZXRQYWNrYWdlSW5zdGFsbGVkKGV2ZW50LkJvZHkuTWVzc2FnZSk7XHJcbiAgICB9O1xyXG5cclxuICAgIHByaXZhdGUgX2ZpbmRQcm9qZWN0TmFtZUZyb21GaWxlTmFtZShmaWxlTmFtZTogc3RyaW5nKTogc3RyaW5nIHtcclxuICAgICAgICBjb25zdCBzcGxpdCA9IGZpbGVOYW1lLnNwbGl0KHBhdGguc2VwKTtcclxuICAgICAgICByZXR1cm4gc3BsaXRbc3BsaXQubGVuZ3RoIC0gMl07XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfc2V0UGFja2FnZUluc3RhbGxlZChtZXNzYWdlOiBzdHJpbmcpIHtcclxuICAgICAgICBjb25zdCBtYXRjaCA9IG1lc3NhZ2UubWF0Y2goL0luc3RhbGxpbmcgKFthLXpBLVouXSopIChbXFxEP1xcZD8uPy0/XSopLyk7XHJcbiAgICAgICAgY29uc3QgZGV0YWlsTGluZXMgPSB0aGlzLm5vdGlmaWNhdGlvbi5nZXREZXRhaWxFbGVtZW50KCkuY2hpbGRyZW4oJy5saW5lJyk7XHJcbiAgICAgICAgaWYgKCFtYXRjaCB8fCBtYXRjaC5sZW5ndGggPCAzKSB7IHJldHVybjsgfVxyXG4gICAgICAgIGZvckVhY2goZGV0YWlsTGluZXMsIGxpbmUgPT4ge1xyXG4gICAgICAgICAgICBpZiAobGluZS50ZXh0Q29udGVudC5zdGFydHNXaXRoKGAgLSAke21hdGNoWzFdfSBgKSkge1xyXG4gICAgICAgICAgICAgICAgbGluZS50ZXh0Q29udGVudCA9IGBJbnN0YWxsZWQgJHttYXRjaFsxXX0gJHttYXRjaFsyXX1gO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTptYXgtY2xhc3Nlcy1wZXItZmlsZVxyXG5jbGFzcyBPbW5pTm90aWZpY2F0aW9uIHtcclxuICAgIHByaXZhdGUgYXRvbU5vdGlmaWNhdGlvbjogQXRvbS5Ob3RpZmljYXRpb247XHJcbiAgICBwcml2YXRlIGRpc21pc3NlZDogYm9vbGVhbjtcclxuICAgIHByaXZhdGUgaXNCZWluZ0Rpc21pc3NlZDogYm9vbGVhbjtcclxuXHJcbiAgICBwdWJsaWMgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNtaXNzZWQgPSB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBhZGREZXRhaWwoZGV0YWlsOiBzdHJpbmcsIG5ld2xpbmU/OiBib29sZWFuKSB7XHJcbiAgICAgICAgY29uc3QgZGV0YWlscyA9IHRoaXMuZ2V0RGV0YWlsRWxlbWVudCgpO1xyXG4gICAgICAgIGlmICghZGV0YWlsKSB7IHJldHVybjsgfVxyXG4gICAgICAgIGlmIChuZXdsaW5lKSB7IGRldGFpbHMuYXBwZW5kKCc8YnIgLz4nKTsgfVxyXG4gICAgICAgIGRldGFpbHMuYXBwZW5kKGA8ZGl2IGNsYXNzPVwibGluZVwiPiR7ZGV0YWlsfTwvZGl2PmApO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzaG93KG1lc3NhZ2U6IHN0cmluZywgZGV0YWlsOiBzdHJpbmcpIHtcclxuICAgICAgICB0aGlzLmF0b21Ob3RpZmljYXRpb24gPSBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkSW5mbyhtZXNzYWdlLCB7IGRldGFpbCwgZGlzbWlzc2FibGU6IHRydWUgfSk7XHJcbiAgICAgICAgdGhpcy5kaXNtaXNzZWQgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLmF0b21Ob3RpZmljYXRpb24ub25EaWREaXNtaXNzKG5vdGlmaWNhdGlvbiA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuZGlzbWlzc2VkID0gdHJ1ZTtcclxuICAgICAgICAgICAgdGhpcy5pc0JlaW5nRGlzbWlzc2VkID0gZmFsc2U7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHNldFN1Y2Nlc3NmdWxBbmREaXNtaXNzKG1lc3NhZ2U6IHN0cmluZykge1xyXG4gICAgICAgIGlmICh0aGlzLmlzQmVpbmdEaXNtaXNzZWQpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgdGhpcy5hZGREZXRhaWwobWVzc2FnZSwgdHJ1ZSk7XHJcbiAgICAgICAgY29uc3QgZG9tTm90aWZpY2F0aW9uID0gJChhdG9tLnZpZXdzLmdldFZpZXcodGhpcy5hdG9tTm90aWZpY2F0aW9uKSk7XHJcbiAgICAgICAgZG9tTm90aWZpY2F0aW9uLnJlbW92ZUNsYXNzKCdpbmZvJyk7XHJcbiAgICAgICAgZG9tTm90aWZpY2F0aW9uLnJlbW92ZUNsYXNzKCdpY29uLWluZm8nKTtcclxuICAgICAgICBkb21Ob3RpZmljYXRpb24uYWRkQ2xhc3MoJ3N1Y2Nlc3MnKTtcclxuICAgICAgICBkb21Ob3RpZmljYXRpb24uYWRkQ2xhc3MoJ2ljb24tY2hlY2snKTtcclxuICAgICAgICB0aGlzLmlzQmVpbmdEaXNtaXNzZWQgPSB0cnVlO1xyXG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4geyB0aGlzLl9kaXNtaXNzKCk7IH0sIDIwMDApO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBpc0Rpc21pc3NlZCgpOiBib29sZWFuIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5kaXNtaXNzZWQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldERldGFpbEVsZW1lbnQoKTogSlF1ZXJ5IHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fZ2V0RnJvbURvbSgkKGF0b20udmlld3MuZ2V0Vmlldyh0aGlzLmF0b21Ob3RpZmljYXRpb24pKSwgJy5jb250ZW50IC5kZXRhaWwgLmRldGFpbC1jb250ZW50Jyk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfZGlzbWlzcygpIHtcclxuICAgICAgICB0aGlzLmF0b21Ob3RpZmljYXRpb24uZGlzbWlzcygpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX2dldEZyb21Eb20oZWxlbWVudDogSlF1ZXJ5LCBzZWxlY3Rvcjogc3RyaW5nKTogSlF1ZXJ5IHtcclxuICAgICAgICBjb25zdCBlbCA9IGVsZW1lbnRbMF07XHJcbiAgICAgICAgaWYgKCFlbCkgeyByZXR1cm47IH1cclxuICAgICAgICBjb25zdCBmb3VuZCA9ICg8YW55PmVsKS5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKTtcclxuICAgICAgICByZXR1cm4gJChmb3VuZFswXSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpleHBvcnQtbmFtZVxyXG5leHBvcnQgY29uc3Qgbm90aWZpY2F0aW9uSGFuZGxlciA9IG5ldyBOb3RpZmljYXRpb25IYW5kbGVyKCk7XHJcbiJdfQ==
