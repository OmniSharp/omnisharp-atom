"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.solutionInformation = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _tsDisposables = require("ts-disposables");

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _solutionStatusView = require("../views/solution-status-view");

var _solutionManager = require("../server/solution-manager");

var _omnisharpClient = require("omnisharp-client");

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

            this.disposable = new _tsDisposables.CompositeDisposable();
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
                this.selectedDisposable = _tsDisposables.Disposable.of(_solutionManager.SolutionManager.activeSolutions[this.selectedIndex].state.subscribe(function () {
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

            var disposable = new _tsDisposables.CompositeDisposable();
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
                disposable.add(_tsDisposables.Disposable.create(function () {
                    if (_this3.card) _this3.card.remove();
                    _this3.card = null;
                    _this3.cardDisposable = null;
                }));
            } else {
                if (this.cardDisposable) {
                    this.cardDisposable.dispose();
                }
                disposable.add(_tsDisposables.Disposable.create(function () {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9hdG9tL3NvbHV0aW9uLWluZm9ybWF0aW9uLmpzIiwibGliL2F0b20vc29sdXRpb24taW5mb3JtYXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0FBQ0E7Ozs7QUFDQTs7QUFDQTs7QUFDQTs7Ozs7O0lDRUE7QUFBQSxtQ0FBQTs7O0FBRVcsYUFBQSxhQUFBLEdBQXdCLENBQXhCLENBRlg7QUE4SFcsYUFBQSxRQUFBLEdBQVcsSUFBWCxDQTlIWDtBQStIVyxhQUFBLEtBQUEsR0FBUSxzQkFBUixDQS9IWDtBQWdJVyxhQUFBLFdBQUEsR0FBYyx5RkFBZCxDQWhJWDtLQUFBOzs7O21DQVFtQjs7O0FBQ1gsaUJBQUssVUFBTCxHQUFrQix3Q0FBbEIsQ0FEVztBQUdYLGlCQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsaUNBQWdCLGNBQWhCLENBQStCLFNBQS9CLENBQXlDLGVBQUc7QUFDNUQsc0JBQUssYUFBTCxHQUFxQixpQkFBRSxTQUFGLENBQVksaUNBQWdCLGVBQWhCLEVBQWlDLEVBQUUsT0FBTyxJQUFJLEtBQUosQ0FBVSxLQUFWLEVBQXRELENBQXJCLENBRDREO0FBRTVELHNCQUFLLGtCQUFMLENBQXdCLE1BQUssYUFBTCxDQUF4QixDQUY0RDthQUFILENBQTdELEVBSFc7QUFRWCxpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLEtBQUssUUFBTCxDQUFjLEdBQWQsQ0FBa0IsZ0JBQWxCLEVBQW9DLHFDQUFwQyxFQUEyRSxZQUFBO0FBQzNGLHNCQUFLLGtCQUFMLENBQXdCLE1BQUssYUFBTCxHQUFxQixDQUFyQixDQUF4QixDQUQyRjthQUFBLENBQS9GLEVBUlc7QUFZWCxpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLEtBQUssUUFBTCxDQUFjLEdBQWQsQ0FBa0IsZ0JBQWxCLEVBQW9DLGdDQUFwQyxFQUFzRSxZQUFBO0FBQ3RGLG9CQUFJLE1BQUssY0FBTCxFQUFxQjtBQUNyQiwwQkFBSyxjQUFM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QSwyQkFBVyxHQUFYLENBQWUsMEJBQVcsTUFBWCxDQUFrQixZQUFBO0FBQzdCLHdCQUFJLE9BQUssSUFBTCxFQUNBLE9BQUssSUFBTCxDQUFVLE1BQVYsR0FESjtBQUVBLDJCQUFLLElBQUwsR0FBWSxJQUFaLENBSDZCO0FBSTdCLDJCQUFLLGNBQUwsR0FBc0IsSUFBdEIsQ0FKNkI7aUJBQUEsQ0FBakMsRUFMRzthQW5CUDtBQWlDQSxtQkFBTyxVQUFQLENBMUNzQjs7OztrQ0E2Q1o7QUFDVixpQkFBSyxVQUFMLENBQWdCLE9BQWhCLEdBRFU7Ozs7Ozs7QUFTWCxJQUFNLG9EQUFzQixJQUFJLG1CQUFKLEVBQXRCIiwiZmlsZSI6ImxpYi9hdG9tL3NvbHV0aW9uLWluZm9ybWF0aW9uLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSwgRGlzcG9zYWJsZSB9IGZyb20gXCJ0cy1kaXNwb3NhYmxlc1wiO1xuaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xuaW1wb3J0IHsgU29sdXRpb25TdGF0dXNDYXJkIH0gZnJvbSBcIi4uL3ZpZXdzL3NvbHV0aW9uLXN0YXR1cy12aWV3XCI7XG5pbXBvcnQgeyBTb2x1dGlvbk1hbmFnZXIgfSBmcm9tIFwiLi4vc2VydmVyL3NvbHV0aW9uLW1hbmFnZXJcIjtcbmltcG9ydCB7IERyaXZlclN0YXRlIH0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcbmNsYXNzIFNvbHV0aW9uSW5mb3JtYXRpb24ge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLnNlbGVjdGVkSW5kZXggPSAwO1xuICAgICAgICB0aGlzLnJlcXVpcmVkID0gdHJ1ZTtcbiAgICAgICAgdGhpcy50aXRsZSA9IFwiU29sdXRpb24gSW5mb3JtYXRpb25cIjtcbiAgICAgICAgdGhpcy5kZXNjcmlwdGlvbiA9IFwiTW9uaXRvcnMgZWFjaCBydW5uaW5nIHNvbHV0aW9uIGFuZCBvZmZlcnMgdGhlIGFiaWxpdHkgdG8gc3RhcnQvcmVzdGFydC9zdG9wIGEgc29sdXRpb24uXCI7XG4gICAgfVxuICAgIGFjdGl2YXRlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKFNvbHV0aW9uTWFuYWdlci5hY3RpdmVTb2x1dGlvbi5zdWJzY3JpYmUoc2xuID0+IHtcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWRJbmRleCA9IF8uZmluZEluZGV4KFNvbHV0aW9uTWFuYWdlci5hY3RpdmVTb2x1dGlvbnMsIHsgaW5kZXg6IHNsbi5tb2RlbC5pbmRleCB9KTtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlU2VsZWN0ZWRJdGVtKHRoaXMuc2VsZWN0ZWRJbmRleCk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwib21uaXNoYXJwLWF0b206bmV4dC1zb2x1dGlvbi1zdGF0dXNcIiwgKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy51cGRhdGVTZWxlY3RlZEl0ZW0odGhpcy5zZWxlY3RlZEluZGV4ICsgMSk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwib21uaXNoYXJwLWF0b206c29sdXRpb24tc3RhdHVzXCIsICgpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLmNhcmREaXNwb3NhYmxlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jYXJkRGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNhcmREaXNwb3NhYmxlID0gdGhpcy5jcmVhdGVTb2x1dGlvbkNhcmQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTpwcmV2aW91cy1zb2x1dGlvbi1zdGF0dXNcIiwgKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy51cGRhdGVTZWxlY3RlZEl0ZW0odGhpcy5zZWxlY3RlZEluZGV4IC0gMSk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwib21uaXNoYXJwLWF0b206c3RvcC1zZXJ2ZXJcIiwgKCkgPT4ge1xuICAgICAgICAgICAgU29sdXRpb25NYW5hZ2VyLmFjdGl2ZVNvbHV0aW9uc1t0aGlzLnNlbGVjdGVkSW5kZXhdLmRpc3Bvc2UoKTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTpzdGFydC1zZXJ2ZXJcIiwgKCkgPT4ge1xuICAgICAgICAgICAgU29sdXRpb25NYW5hZ2VyLmFjdGl2ZVNvbHV0aW9uc1t0aGlzLnNlbGVjdGVkSW5kZXhdLmNvbm5lY3QoKTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTpyZXN0YXJ0LXNlcnZlclwiLCAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBzb2x1dGlvbiA9IFNvbHV0aW9uTWFuYWdlci5hY3RpdmVTb2x1dGlvbnNbdGhpcy5zZWxlY3RlZEluZGV4XTtcbiAgICAgICAgICAgIHNvbHV0aW9uLnN0YXRlXG4gICAgICAgICAgICAgICAgLmZpbHRlcih6ID0+IHogPT09IERyaXZlclN0YXRlLkRpc2Nvbm5lY3RlZClcbiAgICAgICAgICAgICAgICAudGFrZSgxKVxuICAgICAgICAgICAgICAgIC5kZWxheSg1MDApXG4gICAgICAgICAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgc29sdXRpb24uY29ubmVjdCgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBzb2x1dGlvbi5kaXNwb3NlKCk7XG4gICAgICAgIH0pKTtcbiAgICB9XG4gICAgdXBkYXRlU2VsZWN0ZWRJdGVtKGluZGV4KSB7XG4gICAgICAgIGlmIChpbmRleCA8IDApXG4gICAgICAgICAgICBpbmRleCA9IFNvbHV0aW9uTWFuYWdlci5hY3RpdmVTb2x1dGlvbnMubGVuZ3RoIC0gMTtcbiAgICAgICAgaWYgKGluZGV4ID49IFNvbHV0aW9uTWFuYWdlci5hY3RpdmVTb2x1dGlvbnMubGVuZ3RoKVxuICAgICAgICAgICAgaW5kZXggPSAwO1xuICAgICAgICBpZiAodGhpcy5zZWxlY3RlZEluZGV4ICE9PSBpbmRleClcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWRJbmRleCA9IGluZGV4O1xuICAgICAgICBpZiAodGhpcy5jYXJkKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5zZWxlY3RlZERpc3Bvc2FibGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNlbGVjdGVkRGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmNhcmQudXBkYXRlQ2FyZChTb2x1dGlvbk1hbmFnZXIuYWN0aXZlU29sdXRpb25zW3RoaXMuc2VsZWN0ZWRJbmRleF0ubW9kZWwsIFNvbHV0aW9uTWFuYWdlci5hY3RpdmVTb2x1dGlvbnMubGVuZ3RoKTtcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWREaXNwb3NhYmxlID0gRGlzcG9zYWJsZS5vZihTb2x1dGlvbk1hbmFnZXIuYWN0aXZlU29sdXRpb25zW3RoaXMuc2VsZWN0ZWRJbmRleF0uc3RhdGVcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5jYXJkKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2FyZC51cGRhdGVDYXJkKFNvbHV0aW9uTWFuYWdlci5hY3RpdmVTb2x1dGlvbnNbdGhpcy5zZWxlY3RlZEluZGV4XS5tb2RlbCwgU29sdXRpb25NYW5hZ2VyLmFjdGl2ZVNvbHV0aW9ucy5sZW5ndGgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBjcmVhdGVTb2x1dGlvbkNhcmQoKSB7XG4gICAgICAgIGNvbnN0IGRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGRpc3Bvc2FibGUpO1xuICAgICAgICBjb25zdCB3b3Jrc3BhY2UgPSBhdG9tLnZpZXdzLmdldFZpZXcoYXRvbS53b3Jrc3BhY2UpO1xuICAgICAgICBpZiAoIXRoaXMuY29udGFpbmVyKSB7XG4gICAgICAgICAgICBjb25zdCBjb250YWluZXIgPSB0aGlzLmNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgICAgICB3b3Jrc3BhY2UuYXBwZW5kQ2hpbGQoY29udGFpbmVyKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoU29sdXRpb25NYW5hZ2VyLmFjdGl2ZVNvbHV0aW9ucy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGNvbnN0IGVsZW1lbnQgPSBuZXcgU29sdXRpb25TdGF0dXNDYXJkO1xuICAgICAgICAgICAgZWxlbWVudC5hdHRhY2hUbyA9IFwiLnByb2plY3RzLWljb25cIjtcbiAgICAgICAgICAgIGVsZW1lbnQudXBkYXRlQ2FyZChTb2x1dGlvbk1hbmFnZXIuYWN0aXZlU29sdXRpb25zW3RoaXMuc2VsZWN0ZWRJbmRleF0ubW9kZWwsIFNvbHV0aW9uTWFuYWdlci5hY3RpdmVTb2x1dGlvbnMubGVuZ3RoKTtcbiAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFwcGVuZENoaWxkKGVsZW1lbnQpO1xuICAgICAgICAgICAgdGhpcy5jYXJkID0gZWxlbWVudDtcbiAgICAgICAgICAgIGRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJjb3JlOmNhbmNlbFwiLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLnJlbW92ZShkaXNwb3NhYmxlKTtcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIGRpc3Bvc2FibGUuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5jYXJkKVxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNhcmQucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5jYXJkID0gbnVsbDtcbiAgICAgICAgICAgICAgICB0aGlzLmNhcmREaXNwb3NhYmxlID0gbnVsbDtcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmNhcmREaXNwb3NhYmxlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jYXJkRGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuY2FyZClcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jYXJkLnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgIHRoaXMuY2FyZCA9IG51bGw7XG4gICAgICAgICAgICAgICAgdGhpcy5jYXJkRGlzcG9zYWJsZSA9IG51bGw7XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGRpc3Bvc2FibGU7XG4gICAgfVxuICAgIGRpc3Bvc2UoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfVxufVxuZXhwb3J0IGNvbnN0IHNvbHV0aW9uSW5mb3JtYXRpb24gPSBuZXcgU29sdXRpb25JbmZvcm1hdGlvbjtcbiIsImltcG9ydCB7Q29tcG9zaXRlRGlzcG9zYWJsZSwgRGlzcG9zYWJsZSwgSURpc3Bvc2FibGV9IGZyb20gXCJ0cy1kaXNwb3NhYmxlc1wiO1xyXG5pbXBvcnQgXyBmcm9tIFwibG9kYXNoXCI7XHJcbmltcG9ydCB7U29sdXRpb25TdGF0dXNDYXJkfSBmcm9tIFwiLi4vdmlld3Mvc29sdXRpb24tc3RhdHVzLXZpZXdcIjtcclxuaW1wb3J0IHtTb2x1dGlvbk1hbmFnZXJ9IGZyb20gXCIuLi9zZXJ2ZXIvc29sdXRpb24tbWFuYWdlclwiO1xyXG5pbXBvcnQge0RyaXZlclN0YXRlfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xyXG5cclxuY2xhc3MgU29sdXRpb25JbmZvcm1hdGlvbiBpbXBsZW1lbnRzIElGZWF0dXJlIHtcclxuICAgIHByaXZhdGUgZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxuICAgIHB1YmxpYyBzZWxlY3RlZEluZGV4OiBudW1iZXIgPSAwO1xyXG4gICAgcHJpdmF0ZSBjYXJkOiBTb2x1dGlvblN0YXR1c0NhcmQ7XHJcbiAgICBwcml2YXRlIGNhcmREaXNwb3NhYmxlOiBJRGlzcG9zYWJsZTtcclxuICAgIHByaXZhdGUgc2VsZWN0ZWREaXNwb3NhYmxlOiBJRGlzcG9zYWJsZTtcclxuICAgIHByaXZhdGUgY29udGFpbmVyOiBFbGVtZW50O1xyXG5cclxuICAgIHB1YmxpYyBhY3RpdmF0ZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKFNvbHV0aW9uTWFuYWdlci5hY3RpdmVTb2x1dGlvbi5zdWJzY3JpYmUoc2xuID0+IHtcclxuICAgICAgICAgICAgdGhpcy5zZWxlY3RlZEluZGV4ID0gXy5maW5kSW5kZXgoU29sdXRpb25NYW5hZ2VyLmFjdGl2ZVNvbHV0aW9ucywgeyBpbmRleDogc2xuLm1vZGVsLmluZGV4IH0pO1xyXG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVNlbGVjdGVkSXRlbSh0aGlzLnNlbGVjdGVkSW5kZXgpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwib21uaXNoYXJwLWF0b206bmV4dC1zb2x1dGlvbi1zdGF0dXNcIiwgKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVNlbGVjdGVkSXRlbSh0aGlzLnNlbGVjdGVkSW5kZXggKyAxKTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcIm9tbmlzaGFycC1hdG9tOnNvbHV0aW9uLXN0YXR1c1wiLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmNhcmREaXNwb3NhYmxlKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNhcmREaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuY2FyZERpc3Bvc2FibGUgPSB0aGlzLmNyZWF0ZVNvbHV0aW9uQ2FyZCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTpwcmV2aW91cy1zb2x1dGlvbi1zdGF0dXNcIiwgKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVNlbGVjdGVkSXRlbSh0aGlzLnNlbGVjdGVkSW5kZXggLSAxKTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcIm9tbmlzaGFycC1hdG9tOnN0b3Atc2VydmVyXCIsICgpID0+IHtcclxuICAgICAgICAgICAgU29sdXRpb25NYW5hZ2VyLmFjdGl2ZVNvbHV0aW9uc1t0aGlzLnNlbGVjdGVkSW5kZXhdLmRpc3Bvc2UoKTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcIm9tbmlzaGFycC1hdG9tOnN0YXJ0LXNlcnZlclwiLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIFNvbHV0aW9uTWFuYWdlci5hY3RpdmVTb2x1dGlvbnNbdGhpcy5zZWxlY3RlZEluZGV4XS5jb25uZWN0KCk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTpyZXN0YXJ0LXNlcnZlclwiLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IHNvbHV0aW9uID0gU29sdXRpb25NYW5hZ2VyLmFjdGl2ZVNvbHV0aW9uc1t0aGlzLnNlbGVjdGVkSW5kZXhdO1xyXG4gICAgICAgICAgICBzb2x1dGlvbi5zdGF0ZVxyXG4gICAgICAgICAgICAgICAgLmZpbHRlcih6ID0+IHogPT09IERyaXZlclN0YXRlLkRpc2Nvbm5lY3RlZClcclxuICAgICAgICAgICAgICAgIC50YWtlKDEpXHJcbiAgICAgICAgICAgICAgICAuZGVsYXkoNTAwKVxyXG4gICAgICAgICAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgc29sdXRpb24uY29ubmVjdCgpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHNvbHV0aW9uLmRpc3Bvc2UoKTtcclxuICAgICAgICB9KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSB1cGRhdGVTZWxlY3RlZEl0ZW0oaW5kZXg6IG51bWJlcikge1xyXG4gICAgICAgIGlmIChpbmRleCA8IDApXHJcbiAgICAgICAgICAgIGluZGV4ID0gU29sdXRpb25NYW5hZ2VyLmFjdGl2ZVNvbHV0aW9ucy5sZW5ndGggLSAxO1xyXG4gICAgICAgIGlmIChpbmRleCA+PSBTb2x1dGlvbk1hbmFnZXIuYWN0aXZlU29sdXRpb25zLmxlbmd0aClcclxuICAgICAgICAgICAgaW5kZXggPSAwO1xyXG4gICAgICAgIGlmICh0aGlzLnNlbGVjdGVkSW5kZXggIT09IGluZGV4KVxyXG4gICAgICAgICAgICB0aGlzLnNlbGVjdGVkSW5kZXggPSBpbmRleDtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuY2FyZCkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5zZWxlY3RlZERpc3Bvc2FibGUpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWREaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmNhcmQudXBkYXRlQ2FyZChTb2x1dGlvbk1hbmFnZXIuYWN0aXZlU29sdXRpb25zW3RoaXMuc2VsZWN0ZWRJbmRleF0ubW9kZWwsIFNvbHV0aW9uTWFuYWdlci5hY3RpdmVTb2x1dGlvbnMubGVuZ3RoKTtcclxuICAgICAgICAgICAgdGhpcy5zZWxlY3RlZERpc3Bvc2FibGUgPSBEaXNwb3NhYmxlLm9mKFxyXG4gICAgICAgICAgICAgICAgU29sdXRpb25NYW5hZ2VyLmFjdGl2ZVNvbHV0aW9uc1t0aGlzLnNlbGVjdGVkSW5kZXhdLnN0YXRlXHJcbiAgICAgICAgICAgICAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmNhcmQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2FyZC51cGRhdGVDYXJkKFNvbHV0aW9uTWFuYWdlci5hY3RpdmVTb2x1dGlvbnNbdGhpcy5zZWxlY3RlZEluZGV4XS5tb2RlbCwgU29sdXRpb25NYW5hZ2VyLmFjdGl2ZVNvbHV0aW9ucy5sZW5ndGgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBjcmVhdGVTb2x1dGlvbkNhcmQoKSB7XHJcbiAgICAgICAgY29uc3QgZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChkaXNwb3NhYmxlKTtcclxuICAgICAgICBjb25zdCB3b3Jrc3BhY2UgPSA8YW55PmF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSk7XHJcbiAgICAgICAgaWYgKCF0aGlzLmNvbnRhaW5lcikge1xyXG4gICAgICAgICAgICBjb25zdCBjb250YWluZXIgPSB0aGlzLmNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgICAgICAgICAgIHdvcmtzcGFjZS5hcHBlbmRDaGlsZChjb250YWluZXIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKFNvbHV0aW9uTWFuYWdlci5hY3RpdmVTb2x1dGlvbnMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGVsZW1lbnQgPSBuZXcgU29sdXRpb25TdGF0dXNDYXJkO1xyXG4gICAgICAgICAgICBlbGVtZW50LmF0dGFjaFRvID0gXCIucHJvamVjdHMtaWNvblwiO1xyXG4gICAgICAgICAgICBlbGVtZW50LnVwZGF0ZUNhcmQoU29sdXRpb25NYW5hZ2VyLmFjdGl2ZVNvbHV0aW9uc1t0aGlzLnNlbGVjdGVkSW5kZXhdLm1vZGVsLCBTb2x1dGlvbk1hbmFnZXIuYWN0aXZlU29sdXRpb25zLmxlbmd0aCk7XHJcbiAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFwcGVuZENoaWxkKGVsZW1lbnQpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5jYXJkID0gZWxlbWVudDtcclxuXHJcbiAgICAgICAgICAgIGRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJjb3JlOmNhbmNlbFwiLCAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBkaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5yZW1vdmUoZGlzcG9zYWJsZSk7XHJcbiAgICAgICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgICAgIGRpc3Bvc2FibGUuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmNhcmQpXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jYXJkLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jYXJkID0gbnVsbDtcclxuICAgICAgICAgICAgICAgIHRoaXMuY2FyZERpc3Bvc2FibGUgPSBudWxsO1xyXG4gICAgICAgICAgICB9KSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuY2FyZERpc3Bvc2FibGUpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuY2FyZERpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBkaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5jYXJkKVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2FyZC5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuY2FyZCA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNhcmREaXNwb3NhYmxlID0gbnVsbDtcclxuICAgICAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBkaXNwb3NhYmxlO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkaXNwb3NlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlcXVpcmVkID0gdHJ1ZTtcclxuICAgIHB1YmxpYyB0aXRsZSA9IFwiU29sdXRpb24gSW5mb3JtYXRpb25cIjtcclxuICAgIHB1YmxpYyBkZXNjcmlwdGlvbiA9IFwiTW9uaXRvcnMgZWFjaCBydW5uaW5nIHNvbHV0aW9uIGFuZCBvZmZlcnMgdGhlIGFiaWxpdHkgdG8gc3RhcnQvcmVzdGFydC9zdG9wIGEgc29sdXRpb24uXCI7XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBzb2x1dGlvbkluZm9ybWF0aW9uID0gbmV3IFNvbHV0aW9uSW5mb3JtYXRpb247XHJcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
