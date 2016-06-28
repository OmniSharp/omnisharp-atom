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
                    return _this2.card.updateCard(_solutionManager.SolutionManager.activeSolutions[_this2.selectedIndex].model, _solutionManager.SolutionManager.activeSolutions.length);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9hdG9tL3NvbHV0aW9uLWluZm9ybWF0aW9uLmpzIiwibGliL2F0b20vc29sdXRpb24taW5mb3JtYXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0FBQ0E7Ozs7QUFDQTs7QUFDQTs7Ozs7O0lDR0E7QUFBQSxtQ0FBQTs7O0FBRVcsYUFBQSxhQUFBLEdBQXdCLENBQXhCLENBRlg7QUEwSFcsYUFBQSxRQUFBLEdBQVcsSUFBWCxDQTFIWDtBQTJIVyxhQUFBLEtBQUEsR0FBUSxzQkFBUixDQTNIWDtBQTRIVyxhQUFBLFdBQUEsR0FBYyx5RkFBZCxDQTVIWDtLQUFBOzs7O21DQVFtQjs7O0FBQ1gsaUJBQUssVUFBTCxHQUFrQiwwQ0FBbEIsQ0FEVztBQUdYLGlCQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsaUNBQWdCLGNBQWhCLENBQStCLFNBQS9CLENBQXlDLGVBQUc7QUFDNUQsc0JBQUssYUFBTCxHQUFxQixpQkFBRSxTQUFGLENBQVksaUNBQWdCLGVBQWhCLEVBQWlDLEVBQUUsT0FBTyxJQUFJLEtBQUosQ0FBVSxLQUFWLEVBQXRELENBQXJCLENBRDREO0FBRTVELHNCQUFLLGtCQUFMLENBQXdCLE1BQUssYUFBTCxDQUF4QixDQUY0RDthQUFILENBQTdELEVBSFc7QUFRWCxpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLEtBQUssUUFBTCxDQUFjLEdBQWQsQ0FBa0IsZ0JBQWxCLEVBQW9DLHFDQUFwQyxFQUEyRSxZQUFBO0FBQzNGLHNCQUFLLGtCQUFMLENBQXdCLE1BQUssYUFBTCxHQUFxQixDQUFyQixDQUF4QixDQUQyRjthQUFBLENBQS9GLEVBUlc7QUFZWCxpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLEtBQUssUUFBTCxDQUFjLEdBQWQsQ0FBa0IsZ0JBQWxCLEVBQW9DLGdDQUFwQyxFQUFzRSxZQUFBO0FBQ3RGLG9CQUFJLE1BQUssY0FBTCxFQUFxQjtBQUNyQiwwQkFBSyxjQUFMLENBQW9C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QUssSUFBTCxFQUNBLE9BQUssSUFBTCxDQUFVLE1BQVYsR0FESjtBQUVBLDJCQUFLLElBQUwsR0FBWSxJQUFaLENBSDZCO0FBSTdCLDJCQUFLLGNBQUwsR0FBc0IsSUFBdEIsQ0FKNkI7aUJBQUEsQ0FBakMsRUFMRzthQW5CUDtBQWlDQSxtQkFBTyxVQUFQLENBMUNzQjs7OztrQ0E2Q1o7QUFDVixpQkFBSyxVQUFMLENBQWdCLE9BQWhCLEdBRFU7Ozs7Ozs7QUFTWCxJQUFNLG9EQUFzQixJQUFJLG1CQUFKLEVBQXRCIiwiZmlsZSI6ImxpYi9hdG9tL3NvbHV0aW9uLWluZm9ybWF0aW9uLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSwgRGlzcG9zYWJsZSB9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XG5pbXBvcnQgXyBmcm9tIFwibG9kYXNoXCI7XG5pbXBvcnQgeyBTb2x1dGlvblN0YXR1c0NhcmQgfSBmcm9tIFwiLi4vdmlld3Mvc29sdXRpb24tc3RhdHVzLXZpZXdcIjtcbmltcG9ydCB7IFNvbHV0aW9uTWFuYWdlciB9IGZyb20gXCIuLi9zZXJ2ZXIvc29sdXRpb24tbWFuYWdlclwiO1xuaW1wb3J0IHsgRHJpdmVyU3RhdGUgfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xuY2xhc3MgU29sdXRpb25JbmZvcm1hdGlvbiB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuc2VsZWN0ZWRJbmRleCA9IDA7XG4gICAgICAgIHRoaXMucmVxdWlyZWQgPSB0cnVlO1xuICAgICAgICB0aGlzLnRpdGxlID0gXCJTb2x1dGlvbiBJbmZvcm1hdGlvblwiO1xuICAgICAgICB0aGlzLmRlc2NyaXB0aW9uID0gXCJNb25pdG9ycyBlYWNoIHJ1bm5pbmcgc29sdXRpb24gYW5kIG9mZmVycyB0aGUgYWJpbGl0eSB0byBzdGFydC9yZXN0YXJ0L3N0b3AgYSBzb2x1dGlvbi5cIjtcbiAgICB9XG4gICAgYWN0aXZhdGUoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoU29sdXRpb25NYW5hZ2VyLmFjdGl2ZVNvbHV0aW9uLnN1YnNjcmliZShzbG4gPT4ge1xuICAgICAgICAgICAgdGhpcy5zZWxlY3RlZEluZGV4ID0gXy5maW5kSW5kZXgoU29sdXRpb25NYW5hZ2VyLmFjdGl2ZVNvbHV0aW9ucywgeyBpbmRleDogc2xuLm1vZGVsLmluZGV4IH0pO1xuICAgICAgICAgICAgdGhpcy51cGRhdGVTZWxlY3RlZEl0ZW0odGhpcy5zZWxlY3RlZEluZGV4KTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTpuZXh0LXNvbHV0aW9uLXN0YXR1c1wiLCAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVNlbGVjdGVkSXRlbSh0aGlzLnNlbGVjdGVkSW5kZXggKyAxKTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTpzb2x1dGlvbi1zdGF0dXNcIiwgKCkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMuY2FyZERpc3Bvc2FibGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNhcmREaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuY2FyZERpc3Bvc2FibGUgPSB0aGlzLmNyZWF0ZVNvbHV0aW9uQ2FyZCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcIm9tbmlzaGFycC1hdG9tOnByZXZpb3VzLXNvbHV0aW9uLXN0YXR1c1wiLCAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVNlbGVjdGVkSXRlbSh0aGlzLnNlbGVjdGVkSW5kZXggLSAxKTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTpzdG9wLXNlcnZlclwiLCAoKSA9PiB7XG4gICAgICAgICAgICBTb2x1dGlvbk1hbmFnZXIuYWN0aXZlU29sdXRpb25zW3RoaXMuc2VsZWN0ZWRJbmRleF0uZGlzcG9zZSgpO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcIm9tbmlzaGFycC1hdG9tOnN0YXJ0LXNlcnZlclwiLCAoKSA9PiB7XG4gICAgICAgICAgICBTb2x1dGlvbk1hbmFnZXIuYWN0aXZlU29sdXRpb25zW3RoaXMuc2VsZWN0ZWRJbmRleF0uY29ubmVjdCgpO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcIm9tbmlzaGFycC1hdG9tOnJlc3RhcnQtc2VydmVyXCIsICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHNvbHV0aW9uID0gU29sdXRpb25NYW5hZ2VyLmFjdGl2ZVNvbHV0aW9uc1t0aGlzLnNlbGVjdGVkSW5kZXhdO1xuICAgICAgICAgICAgc29sdXRpb24uc3RhdGVcbiAgICAgICAgICAgICAgICAuZmlsdGVyKHogPT4geiA9PT0gRHJpdmVyU3RhdGUuRGlzY29ubmVjdGVkKVxuICAgICAgICAgICAgICAgIC50YWtlKDEpXG4gICAgICAgICAgICAgICAgLmRlbGF5KDUwMClcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgICAgICAgICBzb2x1dGlvbi5jb25uZWN0KCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHNvbHV0aW9uLmRpc3Bvc2UoKTtcbiAgICAgICAgfSkpO1xuICAgIH1cbiAgICB1cGRhdGVTZWxlY3RlZEl0ZW0oaW5kZXgpIHtcbiAgICAgICAgaWYgKGluZGV4IDwgMClcbiAgICAgICAgICAgIGluZGV4ID0gU29sdXRpb25NYW5hZ2VyLmFjdGl2ZVNvbHV0aW9ucy5sZW5ndGggLSAxO1xuICAgICAgICBpZiAoaW5kZXggPj0gU29sdXRpb25NYW5hZ2VyLmFjdGl2ZVNvbHV0aW9ucy5sZW5ndGgpXG4gICAgICAgICAgICBpbmRleCA9IDA7XG4gICAgICAgIGlmICh0aGlzLnNlbGVjdGVkSW5kZXggIT09IGluZGV4KVxuICAgICAgICAgICAgdGhpcy5zZWxlY3RlZEluZGV4ID0gaW5kZXg7XG4gICAgICAgIGlmICh0aGlzLmNhcmQpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnNlbGVjdGVkRGlzcG9zYWJsZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWREaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuY2FyZC51cGRhdGVDYXJkKFNvbHV0aW9uTWFuYWdlci5hY3RpdmVTb2x1dGlvbnNbdGhpcy5zZWxlY3RlZEluZGV4XS5tb2RlbCwgU29sdXRpb25NYW5hZ2VyLmFjdGl2ZVNvbHV0aW9ucy5sZW5ndGgpO1xuICAgICAgICAgICAgdGhpcy5zZWxlY3RlZERpc3Bvc2FibGUgPSBEaXNwb3NhYmxlLm9mKFNvbHV0aW9uTWFuYWdlci5hY3RpdmVTb2x1dGlvbnNbdGhpcy5zZWxlY3RlZEluZGV4XS5zdGF0ZVxuICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoKCkgPT4gdGhpcy5jYXJkLnVwZGF0ZUNhcmQoU29sdXRpb25NYW5hZ2VyLmFjdGl2ZVNvbHV0aW9uc1t0aGlzLnNlbGVjdGVkSW5kZXhdLm1vZGVsLCBTb2x1dGlvbk1hbmFnZXIuYWN0aXZlU29sdXRpb25zLmxlbmd0aCkpKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBjcmVhdGVTb2x1dGlvbkNhcmQoKSB7XG4gICAgICAgIGNvbnN0IGRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGRpc3Bvc2FibGUpO1xuICAgICAgICBjb25zdCB3b3Jrc3BhY2UgPSBhdG9tLnZpZXdzLmdldFZpZXcoYXRvbS53b3Jrc3BhY2UpO1xuICAgICAgICBpZiAoIXRoaXMuY29udGFpbmVyKSB7XG4gICAgICAgICAgICBjb25zdCBjb250YWluZXIgPSB0aGlzLmNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgICAgICB3b3Jrc3BhY2UuYXBwZW5kQ2hpbGQoY29udGFpbmVyKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoU29sdXRpb25NYW5hZ2VyLmFjdGl2ZVNvbHV0aW9ucy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGNvbnN0IGVsZW1lbnQgPSBuZXcgU29sdXRpb25TdGF0dXNDYXJkO1xuICAgICAgICAgICAgZWxlbWVudC5hdHRhY2hUbyA9IFwiLnByb2plY3RzLWljb25cIjtcbiAgICAgICAgICAgIGVsZW1lbnQudXBkYXRlQ2FyZChTb2x1dGlvbk1hbmFnZXIuYWN0aXZlU29sdXRpb25zW3RoaXMuc2VsZWN0ZWRJbmRleF0ubW9kZWwsIFNvbHV0aW9uTWFuYWdlci5hY3RpdmVTb2x1dGlvbnMubGVuZ3RoKTtcbiAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFwcGVuZENoaWxkKGVsZW1lbnQpO1xuICAgICAgICAgICAgdGhpcy5jYXJkID0gZWxlbWVudDtcbiAgICAgICAgICAgIGRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJjb3JlOmNhbmNlbFwiLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLnJlbW92ZShkaXNwb3NhYmxlKTtcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIGRpc3Bvc2FibGUuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5jYXJkKVxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNhcmQucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5jYXJkID0gbnVsbDtcbiAgICAgICAgICAgICAgICB0aGlzLmNhcmREaXNwb3NhYmxlID0gbnVsbDtcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmNhcmREaXNwb3NhYmxlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jYXJkRGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuY2FyZClcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jYXJkLnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgIHRoaXMuY2FyZCA9IG51bGw7XG4gICAgICAgICAgICAgICAgdGhpcy5jYXJkRGlzcG9zYWJsZSA9IG51bGw7XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGRpc3Bvc2FibGU7XG4gICAgfVxuICAgIGRpc3Bvc2UoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfVxufVxuZXhwb3J0IGNvbnN0IHNvbHV0aW9uSW5mb3JtYXRpb24gPSBuZXcgU29sdXRpb25JbmZvcm1hdGlvbjtcbiIsImltcG9ydCB7Q29tcG9zaXRlRGlzcG9zYWJsZSwgRGlzcG9zYWJsZSwgSURpc3Bvc2FibGV9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XHJcbmltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcclxuaW1wb3J0IHtTb2x1dGlvblN0YXR1c0NhcmR9IGZyb20gXCIuLi92aWV3cy9zb2x1dGlvbi1zdGF0dXMtdmlld1wiO1xyXG5pbXBvcnQge1NvbHV0aW9uTWFuYWdlcn0gZnJvbSBcIi4uL3NlcnZlci9zb2x1dGlvbi1tYW5hZ2VyXCI7XHJcbmltcG9ydCB7RHJpdmVyU3RhdGV9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XHJcblxyXG5jbGFzcyBTb2x1dGlvbkluZm9ybWF0aW9uIGltcGxlbWVudHMgSUZlYXR1cmUge1xyXG4gICAgcHJpdmF0ZSBkaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xyXG4gICAgcHVibGljIHNlbGVjdGVkSW5kZXg6IG51bWJlciA9IDA7XHJcbiAgICBwcml2YXRlIGNhcmQ6IFNvbHV0aW9uU3RhdHVzQ2FyZDtcclxuICAgIHByaXZhdGUgY2FyZERpc3Bvc2FibGU6IElEaXNwb3NhYmxlO1xyXG4gICAgcHJpdmF0ZSBzZWxlY3RlZERpc3Bvc2FibGU6IElEaXNwb3NhYmxlO1xyXG4gICAgcHJpdmF0ZSBjb250YWluZXI6IEVsZW1lbnQ7XHJcblxyXG4gICAgcHVibGljIGFjdGl2YXRlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoU29sdXRpb25NYW5hZ2VyLmFjdGl2ZVNvbHV0aW9uLnN1YnNjcmliZShzbG4gPT4ge1xyXG4gICAgICAgICAgICB0aGlzLnNlbGVjdGVkSW5kZXggPSBfLmZpbmRJbmRleChTb2x1dGlvbk1hbmFnZXIuYWN0aXZlU29sdXRpb25zLCB7IGluZGV4OiBzbG4ubW9kZWwuaW5kZXggfSk7XHJcbiAgICAgICAgICAgIHRoaXMudXBkYXRlU2VsZWN0ZWRJdGVtKHRoaXMuc2VsZWN0ZWRJbmRleCk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTpuZXh0LXNvbHV0aW9uLXN0YXR1c1wiLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMudXBkYXRlU2VsZWN0ZWRJdGVtKHRoaXMuc2VsZWN0ZWRJbmRleCArIDEpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwib21uaXNoYXJwLWF0b206c29sdXRpb24tc3RhdHVzXCIsICgpID0+IHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuY2FyZERpc3Bvc2FibGUpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuY2FyZERpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jYXJkRGlzcG9zYWJsZSA9IHRoaXMuY3JlYXRlU29sdXRpb25DYXJkKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcIm9tbmlzaGFycC1hdG9tOnByZXZpb3VzLXNvbHV0aW9uLXN0YXR1c1wiLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMudXBkYXRlU2VsZWN0ZWRJdGVtKHRoaXMuc2VsZWN0ZWRJbmRleCAtIDEpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwib21uaXNoYXJwLWF0b206c3RvcC1zZXJ2ZXJcIiwgKCkgPT4ge1xyXG4gICAgICAgICAgICBTb2x1dGlvbk1hbmFnZXIuYWN0aXZlU29sdXRpb25zW3RoaXMuc2VsZWN0ZWRJbmRleF0uZGlzcG9zZSgpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwib21uaXNoYXJwLWF0b206c3RhcnQtc2VydmVyXCIsICgpID0+IHtcclxuICAgICAgICAgICAgU29sdXRpb25NYW5hZ2VyLmFjdGl2ZVNvbHV0aW9uc1t0aGlzLnNlbGVjdGVkSW5kZXhdLmNvbm5lY3QoKTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcIm9tbmlzaGFycC1hdG9tOnJlc3RhcnQtc2VydmVyXCIsICgpID0+IHtcclxuICAgICAgICAgICAgY29uc3Qgc29sdXRpb24gPSBTb2x1dGlvbk1hbmFnZXIuYWN0aXZlU29sdXRpb25zW3RoaXMuc2VsZWN0ZWRJbmRleF07XHJcbiAgICAgICAgICAgIHNvbHV0aW9uLnN0YXRlXHJcbiAgICAgICAgICAgICAgICAuZmlsdGVyKHogPT4geiA9PT0gRHJpdmVyU3RhdGUuRGlzY29ubmVjdGVkKVxyXG4gICAgICAgICAgICAgICAgLnRha2UoMSlcclxuICAgICAgICAgICAgICAgIC5kZWxheSg1MDApXHJcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBzb2x1dGlvbi5jb25uZWN0KCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgc29sdXRpb24uZGlzcG9zZSgpO1xyXG4gICAgICAgIH0pKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHVwZGF0ZVNlbGVjdGVkSXRlbShpbmRleDogbnVtYmVyKSB7XHJcbiAgICAgICAgaWYgKGluZGV4IDwgMClcclxuICAgICAgICAgICAgaW5kZXggPSBTb2x1dGlvbk1hbmFnZXIuYWN0aXZlU29sdXRpb25zLmxlbmd0aCAtIDE7XHJcbiAgICAgICAgaWYgKGluZGV4ID49IFNvbHV0aW9uTWFuYWdlci5hY3RpdmVTb2x1dGlvbnMubGVuZ3RoKVxyXG4gICAgICAgICAgICBpbmRleCA9IDA7XHJcbiAgICAgICAgaWYgKHRoaXMuc2VsZWN0ZWRJbmRleCAhPT0gaW5kZXgpXHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWRJbmRleCA9IGluZGV4O1xyXG5cclxuICAgICAgICBpZiAodGhpcy5jYXJkKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLnNlbGVjdGVkRGlzcG9zYWJsZSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zZWxlY3RlZERpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuY2FyZC51cGRhdGVDYXJkKFNvbHV0aW9uTWFuYWdlci5hY3RpdmVTb2x1dGlvbnNbdGhpcy5zZWxlY3RlZEluZGV4XS5tb2RlbCwgU29sdXRpb25NYW5hZ2VyLmFjdGl2ZVNvbHV0aW9ucy5sZW5ndGgpO1xyXG4gICAgICAgICAgICB0aGlzLnNlbGVjdGVkRGlzcG9zYWJsZSA9IERpc3Bvc2FibGUub2YoXHJcbiAgICAgICAgICAgICAgICBTb2x1dGlvbk1hbmFnZXIuYWN0aXZlU29sdXRpb25zW3RoaXMuc2VsZWN0ZWRJbmRleF0uc3RhdGVcclxuICAgICAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHRoaXMuY2FyZC51cGRhdGVDYXJkKFNvbHV0aW9uTWFuYWdlci5hY3RpdmVTb2x1dGlvbnNbdGhpcy5zZWxlY3RlZEluZGV4XS5tb2RlbCwgU29sdXRpb25NYW5hZ2VyLmFjdGl2ZVNvbHV0aW9ucy5sZW5ndGgpKVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGNyZWF0ZVNvbHV0aW9uQ2FyZCgpIHtcclxuICAgICAgICBjb25zdCBkaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGRpc3Bvc2FibGUpO1xyXG4gICAgICAgIGNvbnN0IHdvcmtzcGFjZSA9IDxhbnk+YXRvbS52aWV3cy5nZXRWaWV3KGF0b20ud29ya3NwYWNlKTtcclxuICAgICAgICBpZiAoIXRoaXMuY29udGFpbmVyKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGNvbnRhaW5lciA9IHRoaXMuY29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuICAgICAgICAgICAgd29ya3NwYWNlLmFwcGVuZENoaWxkKGNvbnRhaW5lcik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoU29sdXRpb25NYW5hZ2VyLmFjdGl2ZVNvbHV0aW9ucy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgY29uc3QgZWxlbWVudCA9IG5ldyBTb2x1dGlvblN0YXR1c0NhcmQ7XHJcbiAgICAgICAgICAgIGVsZW1lbnQuYXR0YWNoVG8gPSBcIi5wcm9qZWN0cy1pY29uXCI7XHJcbiAgICAgICAgICAgIGVsZW1lbnQudXBkYXRlQ2FyZChTb2x1dGlvbk1hbmFnZXIuYWN0aXZlU29sdXRpb25zW3RoaXMuc2VsZWN0ZWRJbmRleF0ubW9kZWwsIFNvbHV0aW9uTWFuYWdlci5hY3RpdmVTb2x1dGlvbnMubGVuZ3RoKTtcclxuICAgICAgICAgICAgdGhpcy5jb250YWluZXIuYXBwZW5kQ2hpbGQoZWxlbWVudCk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmNhcmQgPSBlbGVtZW50O1xyXG5cclxuICAgICAgICAgICAgZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcImNvcmU6Y2FuY2VsXCIsICgpID0+IHtcclxuICAgICAgICAgICAgICAgIGRpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLnJlbW92ZShkaXNwb3NhYmxlKTtcclxuICAgICAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICAgICAgZGlzcG9zYWJsZS5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuY2FyZClcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNhcmQucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNhcmQgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jYXJkRGlzcG9zYWJsZSA9IG51bGw7XHJcbiAgICAgICAgICAgIH0pKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5jYXJkRGlzcG9zYWJsZSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jYXJkRGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGRpc3Bvc2FibGUuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmNhcmQpXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jYXJkLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jYXJkID0gbnVsbDtcclxuICAgICAgICAgICAgICAgIHRoaXMuY2FyZERpc3Bvc2FibGUgPSBudWxsO1xyXG4gICAgICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGRpc3Bvc2FibGU7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVxdWlyZWQgPSB0cnVlO1xyXG4gICAgcHVibGljIHRpdGxlID0gXCJTb2x1dGlvbiBJbmZvcm1hdGlvblwiO1xyXG4gICAgcHVibGljIGRlc2NyaXB0aW9uID0gXCJNb25pdG9ycyBlYWNoIHJ1bm5pbmcgc29sdXRpb24gYW5kIG9mZmVycyB0aGUgYWJpbGl0eSB0byBzdGFydC9yZXN0YXJ0L3N0b3AgYSBzb2x1dGlvbi5cIjtcclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IHNvbHV0aW9uSW5mb3JtYXRpb24gPSBuZXcgU29sdXRpb25JbmZvcm1hdGlvbjtcclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
