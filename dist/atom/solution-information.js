"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.solutionInformation = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _omnisharpClient = require("omnisharp-client");

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _solutionStatusView = require("../views/solution-status-view");

var _solutionManager = require("../server/solution-manager");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var SolutionInformation = function () {
    function SolutionInformation() {
        _classCallCheck(this, SolutionInformation);

        this.selectedIndex = 0;
        this.required = true;
        this.title = "Solution Information";
        this.description = "Monitors each running solution and offers the ability to start/restart/stop a solution.";
    }

    _createClass(SolutionInformation, [{
        key: "activate",
        value: function activate() {
            var _this = this;

            this.disposable = new _omnisharpClient.CompositeDisposable();
            this.disposable.add(_solutionManager.SolutionManager.activeSolution.subscribe(function (sln) {
                _this.selectedIndex = _lodash2.default.findIndex(_solutionManager.SolutionManager.activeSolutions, { index: sln.model.index });
                _this.updateSelectedItem(_this.selectedIndex);
            }));
            this.disposable.add(atom.commands.add("atom-workspace", "omnisharp-atom:next-solution-status", function () {
                _this.updateSelectedItem(_this.selectedIndex + 1);
            }));
            this.disposable.add(atom.commands.add("atom-workspace", "omnisharp-atom:solution-status", function () {
                if (_this.cardDisposable) {
                    _this.cardDisposable.dispose();
                } else {
                    _this.cardDisposable = _this.createSolutionCard();
                }
            }));
            this.disposable.add(atom.commands.add("atom-workspace", "omnisharp-atom:previous-solution-status", function () {
                _this.updateSelectedItem(_this.selectedIndex - 1);
            }));
            this.disposable.add(atom.commands.add("atom-workspace", "omnisharp-atom:stop-server", function () {
                _solutionManager.SolutionManager.activeSolutions[_this.selectedIndex].dispose();
            }));
            this.disposable.add(atom.commands.add("atom-workspace", "omnisharp-atom:start-server", function () {
                _solutionManager.SolutionManager.activeSolutions[_this.selectedIndex].connect();
            }));
            this.disposable.add(atom.commands.add("atom-workspace", "omnisharp-atom:restart-server", function () {
                var solution = _solutionManager.SolutionManager.activeSolutions[_this.selectedIndex];
                solution.state.filter(function (z) {
                    return z === _omnisharpClient.DriverState.Disconnected;
                }).take(1).delay(500).subscribe(function () {
                    solution.connect();
                });
                solution.dispose();
            }));
        }
    }, {
        key: "updateSelectedItem",
        value: function updateSelectedItem(index) {
            var _this2 = this;

            if (index < 0) index = _solutionManager.SolutionManager.activeSolutions.length - 1;
            if (index >= _solutionManager.SolutionManager.activeSolutions.length) index = 0;
            if (this.selectedIndex !== index) this.selectedIndex = index;
            if (this.card) {
                if (this.selectedDisposable) {
                    this.selectedDisposable.dispose();
                }
                this.card.updateCard(_solutionManager.SolutionManager.activeSolutions[this.selectedIndex].model, _solutionManager.SolutionManager.activeSolutions.length);
                this.selectedDisposable = _omnisharpClient.Disposable.of(_solutionManager.SolutionManager.activeSolutions[this.selectedIndex].state.subscribe(function () {
                    if (_this2.card) {
                        _this2.card.updateCard(_solutionManager.SolutionManager.activeSolutions[_this2.selectedIndex].model, _solutionManager.SolutionManager.activeSolutions.length);
                    }
                }));
            }
        }
    }, {
        key: "createSolutionCard",
        value: function createSolutionCard() {
            var _this3 = this;

            var disposable = new _omnisharpClient.CompositeDisposable();
            this.disposable.add(disposable);
            var workspace = atom.views.getView(atom.workspace);
            if (!this.container) {
                var container = this.container = document.createElement("div");
                workspace.appendChild(container);
            }
            if (_solutionManager.SolutionManager.activeSolutions.length) {
                var element = new _solutionStatusView.SolutionStatusCard();
                element.attachTo = ".projects-icon";
                element.updateCard(_solutionManager.SolutionManager.activeSolutions[this.selectedIndex].model, _solutionManager.SolutionManager.activeSolutions.length);
                this.container.appendChild(element);
                this.card = element;
                disposable.add(atom.commands.add("atom-workspace", "core:cancel", function () {
                    disposable.dispose();
                    _this3.disposable.remove(disposable);
                }));
                disposable.add(_omnisharpClient.Disposable.create(function () {
                    if (_this3.card) _this3.card.remove();
                    _this3.card = null;
                    _this3.cardDisposable = null;
                }));
            } else {
                if (this.cardDisposable) {
                    this.cardDisposable.dispose();
                }
                disposable.add(_omnisharpClient.Disposable.create(function () {
                    if (_this3.card) _this3.card.remove();
                    _this3.card = null;
                    _this3.cardDisposable = null;
                }));
            }
            return disposable;
        }
    }, {
        key: "dispose",
        value: function dispose() {
            this.disposable.dispose();
        }
    }]);

    return SolutionInformation;
}();

var solutionInformation = exports.solutionInformation = new SolutionInformation();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9hdG9tL3NvbHV0aW9uLWluZm9ybWF0aW9uLmpzIiwibGliL2F0b20vc29sdXRpb24taW5mb3JtYXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0FBQ0E7Ozs7QUFDQTs7QUFDQTs7Ozs7O0lDR0EsbUI7QUFBQSxtQ0FBQTtBQUFBOztBQUVXLGFBQUEsYUFBQSxHQUF3QixDQUF4QjtBQTRIQSxhQUFBLFFBQUEsR0FBVyxJQUFYO0FBQ0EsYUFBQSxLQUFBLEdBQVEsc0JBQVI7QUFDQSxhQUFBLFdBQUEsR0FBYyx5RkFBZDtBQUNWOzs7O21DQXpIa0I7QUFBQTs7QUFDWCxpQkFBSyxVQUFMLEdBQWtCLDBDQUFsQjtBQUVBLGlCQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsaUNBQWdCLGNBQWhCLENBQStCLFNBQS9CLENBQXlDLGVBQUc7QUFDNUQsc0JBQUssYUFBTCxHQUFxQixpQkFBRSxTQUFGLENBQVksaUNBQWdCLGVBQTVCLEVBQTZDLEVBQUUsT0FBTyxJQUFJLEtBQUosQ0FBVSxLQUFuQixFQUE3QyxDQUFyQjtBQUNBLHNCQUFLLGtCQUFMLENBQXdCLE1BQUssYUFBN0I7QUFDSCxhQUhtQixDQUFwQjtBQUtBLGlCQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsS0FBSyxRQUFMLENBQWMsR0FBZCxDQUFrQixnQkFBbEIsRUFBb0MscUNBQXBDLEVBQTJFLFlBQUE7QUFDM0Ysc0JBQUssa0JBQUwsQ0FBd0IsTUFBSyxhQUFMLEdBQXFCLENBQTdDO0FBQ0gsYUFGbUIsQ0FBcEI7QUFJQSxpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLEtBQUssUUFBTCxDQUFjLEdBQWQsQ0FBa0IsZ0JBQWxCLEVBQW9DLGdDQUFwQyxFQUFzRSxZQUFBO0FBQ3RGLG9CQUFJLE1BQUssY0FBVCxFQUF5QjtBQUNyQiwwQkFBSyxjQUFMLENBQW9CLE9BQXBCO0FBQ0gsaUJBRkQsTUFFTztBQUNILDBCQUFLLGNBQUwsR0FBc0Is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Yi9hdG9tL3NvbHV0aW9uLWluZm9ybWF0aW9uLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSwgRGlzcG9zYWJsZSB9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XG5pbXBvcnQgXyBmcm9tIFwibG9kYXNoXCI7XG5pbXBvcnQgeyBTb2x1dGlvblN0YXR1c0NhcmQgfSBmcm9tIFwiLi4vdmlld3Mvc29sdXRpb24tc3RhdHVzLXZpZXdcIjtcbmltcG9ydCB7IFNvbHV0aW9uTWFuYWdlciB9IGZyb20gXCIuLi9zZXJ2ZXIvc29sdXRpb24tbWFuYWdlclwiO1xuaW1wb3J0IHsgRHJpdmVyU3RhdGUgfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xuY2xhc3MgU29sdXRpb25JbmZvcm1hdGlvbiB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuc2VsZWN0ZWRJbmRleCA9IDA7XG4gICAgICAgIHRoaXMucmVxdWlyZWQgPSB0cnVlO1xuICAgICAgICB0aGlzLnRpdGxlID0gXCJTb2x1dGlvbiBJbmZvcm1hdGlvblwiO1xuICAgICAgICB0aGlzLmRlc2NyaXB0aW9uID0gXCJNb25pdG9ycyBlYWNoIHJ1bm5pbmcgc29sdXRpb24gYW5kIG9mZmVycyB0aGUgYWJpbGl0eSB0byBzdGFydC9yZXN0YXJ0L3N0b3AgYSBzb2x1dGlvbi5cIjtcbiAgICB9XG4gICAgYWN0aXZhdGUoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoU29sdXRpb25NYW5hZ2VyLmFjdGl2ZVNvbHV0aW9uLnN1YnNjcmliZShzbG4gPT4ge1xuICAgICAgICAgICAgdGhpcy5zZWxlY3RlZEluZGV4ID0gXy5maW5kSW5kZXgoU29sdXRpb25NYW5hZ2VyLmFjdGl2ZVNvbHV0aW9ucywgeyBpbmRleDogc2xuLm1vZGVsLmluZGV4IH0pO1xuICAgICAgICAgICAgdGhpcy51cGRhdGVTZWxlY3RlZEl0ZW0odGhpcy5zZWxlY3RlZEluZGV4KTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTpuZXh0LXNvbHV0aW9uLXN0YXR1c1wiLCAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVNlbGVjdGVkSXRlbSh0aGlzLnNlbGVjdGVkSW5kZXggKyAxKTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTpzb2x1dGlvbi1zdGF0dXNcIiwgKCkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMuY2FyZERpc3Bvc2FibGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNhcmREaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuY2FyZERpc3Bvc2FibGUgPSB0aGlzLmNyZWF0ZVNvbHV0aW9uQ2FyZCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcIm9tbmlzaGFycC1hdG9tOnByZXZpb3VzLXNvbHV0aW9uLXN0YXR1c1wiLCAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVNlbGVjdGVkSXRlbSh0aGlzLnNlbGVjdGVkSW5kZXggLSAxKTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTpzdG9wLXNlcnZlclwiLCAoKSA9PiB7XG4gICAgICAgICAgICBTb2x1dGlvbk1hbmFnZXIuYWN0aXZlU29sdXRpb25zW3RoaXMuc2VsZWN0ZWRJbmRleF0uZGlzcG9zZSgpO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcIm9tbmlzaGFycC1hdG9tOnN0YXJ0LXNlcnZlclwiLCAoKSA9PiB7XG4gICAgICAgICAgICBTb2x1dGlvbk1hbmFnZXIuYWN0aXZlU29sdXRpb25zW3RoaXMuc2VsZWN0ZWRJbmRleF0uY29ubmVjdCgpO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcIm9tbmlzaGFycC1hdG9tOnJlc3RhcnQtc2VydmVyXCIsICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHNvbHV0aW9uID0gU29sdXRpb25NYW5hZ2VyLmFjdGl2ZVNvbHV0aW9uc1t0aGlzLnNlbGVjdGVkSW5kZXhdO1xuICAgICAgICAgICAgc29sdXRpb24uc3RhdGVcbiAgICAgICAgICAgICAgICAuZmlsdGVyKHogPT4geiA9PT0gRHJpdmVyU3RhdGUuRGlzY29ubmVjdGVkKVxuICAgICAgICAgICAgICAgIC50YWtlKDEpXG4gICAgICAgICAgICAgICAgLmRlbGF5KDUwMClcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgICAgICAgICBzb2x1dGlvbi5jb25uZWN0KCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHNvbHV0aW9uLmRpc3Bvc2UoKTtcbiAgICAgICAgfSkpO1xuICAgIH1cbiAgICB1cGRhdGVTZWxlY3RlZEl0ZW0oaW5kZXgpIHtcbiAgICAgICAgaWYgKGluZGV4IDwgMClcbiAgICAgICAgICAgIGluZGV4ID0gU29sdXRpb25NYW5hZ2VyLmFjdGl2ZVNvbHV0aW9ucy5sZW5ndGggLSAxO1xuICAgICAgICBpZiAoaW5kZXggPj0gU29sdXRpb25NYW5hZ2VyLmFjdGl2ZVNvbHV0aW9ucy5sZW5ndGgpXG4gICAgICAgICAgICBpbmRleCA9IDA7XG4gICAgICAgIGlmICh0aGlzLnNlbGVjdGVkSW5kZXggIT09IGluZGV4KVxuICAgICAgICAgICAgdGhpcy5zZWxlY3RlZEluZGV4ID0gaW5kZXg7XG4gICAgICAgIGlmICh0aGlzLmNhcmQpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnNlbGVjdGVkRGlzcG9zYWJsZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWREaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuY2FyZC51cGRhdGVDYXJkKFNvbHV0aW9uTWFuYWdlci5hY3RpdmVTb2x1dGlvbnNbdGhpcy5zZWxlY3RlZEluZGV4XS5tb2RlbCwgU29sdXRpb25NYW5hZ2VyLmFjdGl2ZVNvbHV0aW9ucy5sZW5ndGgpO1xuICAgICAgICAgICAgdGhpcy5zZWxlY3RlZERpc3Bvc2FibGUgPSBEaXNwb3NhYmxlLm9mKFNvbHV0aW9uTWFuYWdlci5hY3RpdmVTb2x1dGlvbnNbdGhpcy5zZWxlY3RlZEluZGV4XS5zdGF0ZVxuICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmNhcmQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jYXJkLnVwZGF0ZUNhcmQoU29sdXRpb25NYW5hZ2VyLmFjdGl2ZVNvbHV0aW9uc1t0aGlzLnNlbGVjdGVkSW5kZXhdLm1vZGVsLCBTb2x1dGlvbk1hbmFnZXIuYWN0aXZlU29sdXRpb25zLmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGNyZWF0ZVNvbHV0aW9uQ2FyZCgpIHtcbiAgICAgICAgY29uc3QgZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoZGlzcG9zYWJsZSk7XG4gICAgICAgIGNvbnN0IHdvcmtzcGFjZSA9IGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSk7XG4gICAgICAgIGlmICghdGhpcy5jb250YWluZXIpIHtcbiAgICAgICAgICAgIGNvbnN0IGNvbnRhaW5lciA9IHRoaXMuY29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgICAgIHdvcmtzcGFjZS5hcHBlbmRDaGlsZChjb250YWluZXIpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChTb2x1dGlvbk1hbmFnZXIuYWN0aXZlU29sdXRpb25zLmxlbmd0aCkge1xuICAgICAgICAgICAgY29uc3QgZWxlbWVudCA9IG5ldyBTb2x1dGlvblN0YXR1c0NhcmQ7XG4gICAgICAgICAgICBlbGVtZW50LmF0dGFjaFRvID0gXCIucHJvamVjdHMtaWNvblwiO1xuICAgICAgICAgICAgZWxlbWVudC51cGRhdGVDYXJkKFNvbHV0aW9uTWFuYWdlci5hY3RpdmVTb2x1dGlvbnNbdGhpcy5zZWxlY3RlZEluZGV4XS5tb2RlbCwgU29sdXRpb25NYW5hZ2VyLmFjdGl2ZVNvbHV0aW9ucy5sZW5ndGgpO1xuICAgICAgICAgICAgdGhpcy5jb250YWluZXIuYXBwZW5kQ2hpbGQoZWxlbWVudCk7XG4gICAgICAgICAgICB0aGlzLmNhcmQgPSBlbGVtZW50O1xuICAgICAgICAgICAgZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcImNvcmU6Y2FuY2VsXCIsICgpID0+IHtcbiAgICAgICAgICAgICAgICBkaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUucmVtb3ZlKGRpc3Bvc2FibGUpO1xuICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgZGlzcG9zYWJsZS5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmNhcmQpXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2FyZC5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmNhcmQgPSBudWxsO1xuICAgICAgICAgICAgICAgIHRoaXMuY2FyZERpc3Bvc2FibGUgPSBudWxsO1xuICAgICAgICAgICAgfSkpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgaWYgKHRoaXMuY2FyZERpc3Bvc2FibGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNhcmREaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRpc3Bvc2FibGUuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5jYXJkKVxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNhcmQucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5jYXJkID0gbnVsbDtcbiAgICAgICAgICAgICAgICB0aGlzLmNhcmREaXNwb3NhYmxlID0gbnVsbDtcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZGlzcG9zYWJsZTtcbiAgICB9XG4gICAgZGlzcG9zZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICB9XG59XG5leHBvcnQgY29uc3Qgc29sdXRpb25JbmZvcm1hdGlvbiA9IG5ldyBTb2x1dGlvbkluZm9ybWF0aW9uO1xuIiwiaW1wb3J0IHtDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlLCBJRGlzcG9zYWJsZX0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcclxuaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xyXG5pbXBvcnQge1NvbHV0aW9uU3RhdHVzQ2FyZH0gZnJvbSBcIi4uL3ZpZXdzL3NvbHV0aW9uLXN0YXR1cy12aWV3XCI7XHJcbmltcG9ydCB7U29sdXRpb25NYW5hZ2VyfSBmcm9tIFwiLi4vc2VydmVyL3NvbHV0aW9uLW1hbmFnZXJcIjtcclxuaW1wb3J0IHtEcml2ZXJTdGF0ZX0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcclxuXHJcbmNsYXNzIFNvbHV0aW9uSW5mb3JtYXRpb24gaW1wbGVtZW50cyBJRmVhdHVyZSB7XHJcbiAgICBwcml2YXRlIGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XHJcbiAgICBwdWJsaWMgc2VsZWN0ZWRJbmRleDogbnVtYmVyID0gMDtcclxuICAgIHByaXZhdGUgY2FyZDogU29sdXRpb25TdGF0dXNDYXJkO1xyXG4gICAgcHJpdmF0ZSBjYXJkRGlzcG9zYWJsZTogSURpc3Bvc2FibGU7XHJcbiAgICBwcml2YXRlIHNlbGVjdGVkRGlzcG9zYWJsZTogSURpc3Bvc2FibGU7XHJcbiAgICBwcml2YXRlIGNvbnRhaW5lcjogRWxlbWVudDtcclxuXHJcbiAgICBwdWJsaWMgYWN0aXZhdGUoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChTb2x1dGlvbk1hbmFnZXIuYWN0aXZlU29sdXRpb24uc3Vic2NyaWJlKHNsbiA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWRJbmRleCA9IF8uZmluZEluZGV4KFNvbHV0aW9uTWFuYWdlci5hY3RpdmVTb2x1dGlvbnMsIHsgaW5kZXg6IHNsbi5tb2RlbC5pbmRleCB9KTtcclxuICAgICAgICAgICAgdGhpcy51cGRhdGVTZWxlY3RlZEl0ZW0odGhpcy5zZWxlY3RlZEluZGV4KTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcIm9tbmlzaGFycC1hdG9tOm5leHQtc29sdXRpb24tc3RhdHVzXCIsICgpID0+IHtcclxuICAgICAgICAgICAgdGhpcy51cGRhdGVTZWxlY3RlZEl0ZW0odGhpcy5zZWxlY3RlZEluZGV4ICsgMSk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTpzb2x1dGlvbi1zdGF0dXNcIiwgKCkgPT4ge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5jYXJkRGlzcG9zYWJsZSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jYXJkRGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNhcmREaXNwb3NhYmxlID0gdGhpcy5jcmVhdGVTb2x1dGlvbkNhcmQoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwib21uaXNoYXJwLWF0b206cHJldmlvdXMtc29sdXRpb24tc3RhdHVzXCIsICgpID0+IHtcclxuICAgICAgICAgICAgdGhpcy51cGRhdGVTZWxlY3RlZEl0ZW0odGhpcy5zZWxlY3RlZEluZGV4IC0gMSk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTpzdG9wLXNlcnZlclwiLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIFNvbHV0aW9uTWFuYWdlci5hY3RpdmVTb2x1dGlvbnNbdGhpcy5zZWxlY3RlZEluZGV4XS5kaXNwb3NlKCk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTpzdGFydC1zZXJ2ZXJcIiwgKCkgPT4ge1xyXG4gICAgICAgICAgICBTb2x1dGlvbk1hbmFnZXIuYWN0aXZlU29sdXRpb25zW3RoaXMuc2VsZWN0ZWRJbmRleF0uY29ubmVjdCgpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwib21uaXNoYXJwLWF0b206cmVzdGFydC1zZXJ2ZXJcIiwgKCkgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBzb2x1dGlvbiA9IFNvbHV0aW9uTWFuYWdlci5hY3RpdmVTb2x1dGlvbnNbdGhpcy5zZWxlY3RlZEluZGV4XTtcclxuICAgICAgICAgICAgc29sdXRpb24uc3RhdGVcclxuICAgICAgICAgICAgICAgIC5maWx0ZXIoeiA9PiB6ID09PSBEcml2ZXJTdGF0ZS5EaXNjb25uZWN0ZWQpXHJcbiAgICAgICAgICAgICAgICAudGFrZSgxKVxyXG4gICAgICAgICAgICAgICAgLmRlbGF5KDUwMClcclxuICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHNvbHV0aW9uLmNvbm5lY3QoKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBzb2x1dGlvbi5kaXNwb3NlKCk7XHJcbiAgICAgICAgfSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgdXBkYXRlU2VsZWN0ZWRJdGVtKGluZGV4OiBudW1iZXIpIHtcclxuICAgICAgICBpZiAoaW5kZXggPCAwKVxyXG4gICAgICAgICAgICBpbmRleCA9IFNvbHV0aW9uTWFuYWdlci5hY3RpdmVTb2x1dGlvbnMubGVuZ3RoIC0gMTtcclxuICAgICAgICBpZiAoaW5kZXggPj0gU29sdXRpb25NYW5hZ2VyLmFjdGl2ZVNvbHV0aW9ucy5sZW5ndGgpXHJcbiAgICAgICAgICAgIGluZGV4ID0gMDtcclxuICAgICAgICBpZiAodGhpcy5zZWxlY3RlZEluZGV4ICE9PSBpbmRleClcclxuICAgICAgICAgICAgdGhpcy5zZWxlY3RlZEluZGV4ID0gaW5kZXg7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmNhcmQpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuc2VsZWN0ZWREaXNwb3NhYmxlKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNlbGVjdGVkRGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5jYXJkLnVwZGF0ZUNhcmQoU29sdXRpb25NYW5hZ2VyLmFjdGl2ZVNvbHV0aW9uc1t0aGlzLnNlbGVjdGVkSW5kZXhdLm1vZGVsLCBTb2x1dGlvbk1hbmFnZXIuYWN0aXZlU29sdXRpb25zLmxlbmd0aCk7XHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWREaXNwb3NhYmxlID0gRGlzcG9zYWJsZS5vZihcclxuICAgICAgICAgICAgICAgIFNvbHV0aW9uTWFuYWdlci5hY3RpdmVTb2x1dGlvbnNbdGhpcy5zZWxlY3RlZEluZGV4XS5zdGF0ZVxyXG4gICAgICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5jYXJkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNhcmQudXBkYXRlQ2FyZChTb2x1dGlvbk1hbmFnZXIuYWN0aXZlU29sdXRpb25zW3RoaXMuc2VsZWN0ZWRJbmRleF0ubW9kZWwsIFNvbHV0aW9uTWFuYWdlci5hY3RpdmVTb2x1dGlvbnMubGVuZ3RoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgY3JlYXRlU29sdXRpb25DYXJkKCkge1xyXG4gICAgICAgIGNvbnN0IGRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoZGlzcG9zYWJsZSk7XHJcbiAgICAgICAgY29uc3Qgd29ya3NwYWNlID0gPGFueT5hdG9tLnZpZXdzLmdldFZpZXcoYXRvbS53b3Jrc3BhY2UpO1xyXG4gICAgICAgIGlmICghdGhpcy5jb250YWluZXIpIHtcclxuICAgICAgICAgICAgY29uc3QgY29udGFpbmVyID0gdGhpcy5jb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gICAgICAgICAgICB3b3Jrc3BhY2UuYXBwZW5kQ2hpbGQoY29udGFpbmVyKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChTb2x1dGlvbk1hbmFnZXIuYWN0aXZlU29sdXRpb25zLmxlbmd0aCkge1xyXG4gICAgICAgICAgICBjb25zdCBlbGVtZW50ID0gbmV3IFNvbHV0aW9uU3RhdHVzQ2FyZDtcclxuICAgICAgICAgICAgZWxlbWVudC5hdHRhY2hUbyA9IFwiLnByb2plY3RzLWljb25cIjtcclxuICAgICAgICAgICAgZWxlbWVudC51cGRhdGVDYXJkKFNvbHV0aW9uTWFuYWdlci5hY3RpdmVTb2x1dGlvbnNbdGhpcy5zZWxlY3RlZEluZGV4XS5tb2RlbCwgU29sdXRpb25NYW5hZ2VyLmFjdGl2ZVNvbHV0aW9ucy5sZW5ndGgpO1xyXG4gICAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hcHBlbmRDaGlsZChlbGVtZW50KTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuY2FyZCA9IGVsZW1lbnQ7XHJcblxyXG4gICAgICAgICAgICBkaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwiY29yZTpjYW5jZWxcIiwgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUucmVtb3ZlKGRpc3Bvc2FibGUpO1xyXG4gICAgICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgICAgICBkaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5jYXJkKVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2FyZC5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuY2FyZCA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNhcmREaXNwb3NhYmxlID0gbnVsbDtcclxuICAgICAgICAgICAgfSkpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmNhcmREaXNwb3NhYmxlKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNhcmREaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZGlzcG9zYWJsZS5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuY2FyZClcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNhcmQucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNhcmQgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jYXJkRGlzcG9zYWJsZSA9IG51bGw7XHJcbiAgICAgICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZGlzcG9zYWJsZTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGlzcG9zZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZXF1aXJlZCA9IHRydWU7XHJcbiAgICBwdWJsaWMgdGl0bGUgPSBcIlNvbHV0aW9uIEluZm9ybWF0aW9uXCI7XHJcbiAgICBwdWJsaWMgZGVzY3JpcHRpb24gPSBcIk1vbml0b3JzIGVhY2ggcnVubmluZyBzb2x1dGlvbiBhbmQgb2ZmZXJzIHRoZSBhYmlsaXR5IHRvIHN0YXJ0L3Jlc3RhcnQvc3RvcCBhIHNvbHV0aW9uLlwiO1xyXG59XHJcblxyXG5leHBvcnQgY29uc3Qgc29sdXRpb25JbmZvcm1hdGlvbiA9IG5ldyBTb2x1dGlvbkluZm9ybWF0aW9uO1xyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
