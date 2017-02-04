'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.solutionInformation = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _omnisharpClient = require('omnisharp-client');

var _tsDisposables = require('ts-disposables');

var _solutionManager = require('../server/solution-manager');

var _solutionStatusView = require('../views/solution-status-view');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var SolutionInformation = function () {
    function SolutionInformation() {
        _classCallCheck(this, SolutionInformation);

        this.required = true;
        this.title = 'Solution Information';
        this.description = 'Monitors each running solution and offers the ability to start/restart/stop a solution.';
        this.selectedIndex = 0;
    }

    _createClass(SolutionInformation, [{
        key: 'activate',
        value: function activate() {
            var _this = this;

            this.disposable = new _tsDisposables.CompositeDisposable();
            this.disposable.add(_solutionManager.SolutionManager.activeSolution.subscribe(function (sln) {
                _this.selectedIndex = (0, _lodash.findIndex)(_solutionManager.SolutionManager.activeSolutions, { index: sln.model.index });
                _this._updateSelectedItem(_this.selectedIndex);
            }));
            this.disposable.add(atom.commands.add('atom-workspace', 'omnisharp-atom:next-solution-status', function () {
                _this._updateSelectedItem(_this.selectedIndex + 1);
            }));
            this.disposable.add(atom.commands.add('atom-workspace', 'omnisharp-atom:solution-status', function () {
                if (_this.cardDisposable) {
                    _this.cardDisposable.dispose();
                } else {
                    _this.cardDisposable = _this._createSolutionCard();
                }
            }));
            this.disposable.add(atom.commands.add('atom-workspace', 'omnisharp-atom:previous-solution-status', function () {
                _this._updateSelectedItem(_this.selectedIndex - 1);
            }));
            this.disposable.add(atom.commands.add('atom-workspace', 'omnisharp-atom:stop-server', function () {
                _solutionManager.SolutionManager.activeSolutions[_this.selectedIndex].dispose();
            }));
            this.disposable.add(atom.commands.add('atom-workspace', 'omnisharp-atom:start-server', function () {
                _solutionManager.SolutionManager.activeSolutions[_this.selectedIndex].connect();
            }));
            this.disposable.add(atom.commands.add('atom-workspace', 'omnisharp-atom:restart-server', function () {
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
        key: 'dispose',
        value: function dispose() {
            this.disposable.dispose();
        }
    }, {
        key: '_updateSelectedItem',
        value: function _updateSelectedItem(index) {
            var _this2 = this;

            if (index < 0) {
                index = _solutionManager.SolutionManager.activeSolutions.length - 1;
            }
            if (index >= _solutionManager.SolutionManager.activeSolutions.length) {
                index = 0;
            }
            if (this.selectedIndex !== index) {
                this.selectedIndex = index;
            }
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
        key: '_createSolutionCard',
        value: function _createSolutionCard() {
            var _this3 = this;

            var disposable = new _tsDisposables.CompositeDisposable();
            this.disposable.add(disposable);
            var workspace = atom.views.getView(atom.workspace);
            if (!this.container) {
                var container = this.container = document.createElement('div');
                workspace.appendChild(container);
            }
            if (_solutionManager.SolutionManager.activeSolutions.length) {
                var element = new _solutionStatusView.SolutionStatusCard();
                element.attachTo = '.projects-icon';
                element.updateCard(_solutionManager.SolutionManager.activeSolutions[this.selectedIndex].model, _solutionManager.SolutionManager.activeSolutions.length);
                this.container.appendChild(element);
                this.card = element;
                disposable.add(atom.commands.add('atom-workspace', 'core:cancel', function () {
                    disposable.dispose();
                    _this3.disposable.remove(disposable);
                }));
                disposable.add(_tsDisposables.Disposable.create(function () {
                    if (_this3.card) {
                        _this3.card.remove();
                    }
                    _this3.card = null;
                    _this3.cardDisposable = null;
                }));
            } else {
                if (this.cardDisposable) {
                    this.cardDisposable.dispose();
                }
                disposable.add(_tsDisposables.Disposable.create(function () {
                    if (_this3.card) {
                        _this3.card.remove();
                    }
                    _this3.card = null;
                    _this3.cardDisposable = null;
                }));
            }
            return disposable;
        }
    }]);

    return SolutionInformation;
}();

var solutionInformation = exports.solutionInformation = new SolutionInformation();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9hdG9tL3NvbHV0aW9uLWluZm9ybWF0aW9uLnRzIl0sIm5hbWVzIjpbIlNvbHV0aW9uSW5mb3JtYXRpb24iLCJyZXF1aXJlZCIsInRpdGxlIiwiZGVzY3JpcHRpb24iLCJzZWxlY3RlZEluZGV4IiwiZGlzcG9zYWJsZSIsImFkZCIsImFjdGl2ZVNvbHV0aW9uIiwic3Vic2NyaWJlIiwiYWN0aXZlU29sdXRpb25zIiwiaW5kZXgiLCJzbG4iLCJtb2RlbCIsIl91cGRhdGVTZWxlY3RlZEl0ZW0iLCJhdG9tIiwiY29tbWFuZHMiLCJjYXJkRGlzcG9zYWJsZSIsImRpc3Bvc2UiLCJfY3JlYXRlU29sdXRpb25DYXJkIiwiY29ubmVjdCIsInNvbHV0aW9uIiwic3RhdGUiLCJmaWx0ZXIiLCJ6IiwiRGlzY29ubmVjdGVkIiwidGFrZSIsImRlbGF5IiwibGVuZ3RoIiwiY2FyZCIsInNlbGVjdGVkRGlzcG9zYWJsZSIsInVwZGF0ZUNhcmQiLCJvZiIsIndvcmtzcGFjZSIsInZpZXdzIiwiZ2V0VmlldyIsImNvbnRhaW5lciIsImRvY3VtZW50IiwiY3JlYXRlRWxlbWVudCIsImFwcGVuZENoaWxkIiwiZWxlbWVudCIsImF0dGFjaFRvIiwicmVtb3ZlIiwiY3JlYXRlIiwic29sdXRpb25JbmZvcm1hdGlvbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7SUFFQUEsbUI7QUFBQSxtQ0FBQTtBQUFBOztBQUNXLGFBQUFDLFFBQUEsR0FBVyxJQUFYO0FBQ0EsYUFBQUMsS0FBQSxHQUFRLHNCQUFSO0FBQ0EsYUFBQUMsV0FBQSxHQUFjLHlGQUFkO0FBQ0EsYUFBQUMsYUFBQSxHQUF3QixDQUF4QjtBQWlJVjs7OzttQ0ExSGtCO0FBQUE7O0FBQ1gsaUJBQUtDLFVBQUwsR0FBa0Isd0NBQWxCO0FBRUEsaUJBQUtBLFVBQUwsQ0FBZ0JDLEdBQWhCLENBQW9CLGlDQUFnQkMsY0FBaEIsQ0FBK0JDLFNBQS9CLENBQXlDLGVB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LHFCQUFLUSxTQUFMLENBQWVHLFdBQWYsQ0FBMkJDLE9BQTNCO0FBRUEscUJBQUtYLElBQUwsR0FBWVcsT0FBWjtBQUVBbEMsMkJBQVdDLEdBQVgsQ0FBZVEsS0FBS0MsUUFBTCxDQUFjVCxHQUFkLENBQWtCLGdCQUFsQixFQUFvQyxhQUFwQyxFQUFtRCxZQUFBO0FBQzlERCwrQkFBV1ksT0FBWDtBQUNBLDJCQUFLWixVQUFMLENBQWdCb0MsTUFBaEIsQ0FBdUJwQyxVQUF2QjtBQUNILGlCQUhjLENBQWY7QUFLQUEsMkJBQVdDLEdBQVgsQ0FBZSwwQkFBV29DLE1BQVgsQ0FBa0IsWUFBQTtBQUM3Qix3QkFBSSxPQUFLZCxJQUFULEVBQWU7QUFDWCwrQkFBS0EsSUFBTCxDQUFVYSxNQUFWO0FBQ0g7QUFDRCwyQkFBS2IsSUFBTCxHQUFZLElBQVo7QUFDQSwyQkFBS1osY0FBTCxHQUFzQixJQUF0QjtBQUNILGlCQU5jLENBQWY7QUFPSCxhQXBCRCxNQW9CTztBQUNILG9CQUFJLEtBQUtBLGNBQVQsRUFBeUI7QUFDckIseUJBQUtBLGNBQUwsQ0FBb0JDLE9BQXBCO0FBQ0g7QUFFRFosMkJBQVdDLEdBQVgsQ0FBZSwwQkFBV29DLE1BQVgsQ0FBa0IsWUFBQTtBQUM3Qix3QkFBSSxPQUFLZCxJQUFULEVBQWU7QUFDWCwrQkFBS0EsSUFBTCxDQUFVYSxNQUFWO0FBQ0g7QUFDRCwyQkFBS2IsSUFBTCxHQUFZLElBQVo7QUFDQSwyQkFBS1osY0FBTCxHQUFzQixJQUF0QjtBQUNILGlCQU5jLENBQWY7QUFRSDtBQUVELG1CQUFPWCxVQUFQO0FBQ0g7Ozs7OztBQUlFLElBQU1zQyxvREFBc0IsSUFBSTNDLG1CQUFKLEVBQTVCIiwiZmlsZSI6ImxpYi9hdG9tL3NvbHV0aW9uLWluZm9ybWF0aW9uLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZmluZEluZGV4IH0gZnJvbSAnbG9kYXNoJztcclxuaW1wb3J0IHsgRHJpdmVyU3RhdGUgfSBmcm9tICdvbW5pc2hhcnAtY2xpZW50JztcclxuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSwgRGlzcG9zYWJsZSwgSURpc3Bvc2FibGUgfSBmcm9tICd0cy1kaXNwb3NhYmxlcyc7XHJcbmltcG9ydCB7IFNvbHV0aW9uTWFuYWdlciB9IGZyb20gJy4uL3NlcnZlci9zb2x1dGlvbi1tYW5hZ2VyJztcclxuaW1wb3J0IHsgU29sdXRpb25TdGF0dXNDYXJkIH0gZnJvbSAnLi4vdmlld3Mvc29sdXRpb24tc3RhdHVzLXZpZXcnO1xyXG5cclxuY2xhc3MgU29sdXRpb25JbmZvcm1hdGlvbiBpbXBsZW1lbnRzIElGZWF0dXJlIHtcclxuICAgIHB1YmxpYyByZXF1aXJlZCA9IHRydWU7XHJcbiAgICBwdWJsaWMgdGl0bGUgPSAnU29sdXRpb24gSW5mb3JtYXRpb24nO1xyXG4gICAgcHVibGljIGRlc2NyaXB0aW9uID0gJ01vbml0b3JzIGVhY2ggcnVubmluZyBzb2x1dGlvbiBhbmQgb2ZmZXJzIHRoZSBhYmlsaXR5IHRvIHN0YXJ0L3Jlc3RhcnQvc3RvcCBhIHNvbHV0aW9uLic7XHJcbiAgICBwdWJsaWMgc2VsZWN0ZWRJbmRleDogbnVtYmVyID0gMDtcclxuICAgIHByaXZhdGUgZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxuICAgIHByaXZhdGUgY2FyZDogU29sdXRpb25TdGF0dXNDYXJkO1xyXG4gICAgcHJpdmF0ZSBjYXJkRGlzcG9zYWJsZTogSURpc3Bvc2FibGU7XHJcbiAgICBwcml2YXRlIHNlbGVjdGVkRGlzcG9zYWJsZTogSURpc3Bvc2FibGU7XHJcbiAgICBwcml2YXRlIGNvbnRhaW5lcjogRWxlbWVudDtcclxuXHJcbiAgICBwdWJsaWMgYWN0aXZhdGUoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChTb2x1dGlvbk1hbmFnZXIuYWN0aXZlU29sdXRpb24uc3Vic2NyaWJlKHNsbiA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWRJbmRleCA9IGZpbmRJbmRleChTb2x1dGlvbk1hbmFnZXIuYWN0aXZlU29sdXRpb25zLCB7IGluZGV4OiBzbG4ubW9kZWwuaW5kZXggfSk7XHJcbiAgICAgICAgICAgIHRoaXMuX3VwZGF0ZVNlbGVjdGVkSXRlbSh0aGlzLnNlbGVjdGVkSW5kZXgpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZCgnYXRvbS13b3Jrc3BhY2UnLCAnb21uaXNoYXJwLWF0b206bmV4dC1zb2x1dGlvbi1zdGF0dXMnLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuX3VwZGF0ZVNlbGVjdGVkSXRlbSh0aGlzLnNlbGVjdGVkSW5kZXggKyAxKTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoJ2F0b20td29ya3NwYWNlJywgJ29tbmlzaGFycC1hdG9tOnNvbHV0aW9uLXN0YXR1cycsICgpID0+IHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuY2FyZERpc3Bvc2FibGUpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuY2FyZERpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jYXJkRGlzcG9zYWJsZSA9IHRoaXMuX2NyZWF0ZVNvbHV0aW9uQ2FyZCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKCdhdG9tLXdvcmtzcGFjZScsICdvbW5pc2hhcnAtYXRvbTpwcmV2aW91cy1zb2x1dGlvbi1zdGF0dXMnLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuX3VwZGF0ZVNlbGVjdGVkSXRlbSh0aGlzLnNlbGVjdGVkSW5kZXggLSAxKTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoJ2F0b20td29ya3NwYWNlJywgJ29tbmlzaGFycC1hdG9tOnN0b3Atc2VydmVyJywgKCkgPT4ge1xyXG4gICAgICAgICAgICBTb2x1dGlvbk1hbmFnZXIuYWN0aXZlU29sdXRpb25zW3RoaXMuc2VsZWN0ZWRJbmRleF0uZGlzcG9zZSgpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZCgnYXRvbS13b3Jrc3BhY2UnLCAnb21uaXNoYXJwLWF0b206c3RhcnQtc2VydmVyJywgKCkgPT4ge1xyXG4gICAgICAgICAgICBTb2x1dGlvbk1hbmFnZXIuYWN0aXZlU29sdXRpb25zW3RoaXMuc2VsZWN0ZWRJbmRleF0uY29ubmVjdCgpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZCgnYXRvbS13b3Jrc3BhY2UnLCAnb21uaXNoYXJwLWF0b206cmVzdGFydC1zZXJ2ZXInLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IHNvbHV0aW9uID0gU29sdXRpb25NYW5hZ2VyLmFjdGl2ZVNvbHV0aW9uc1t0aGlzLnNlbGVjdGVkSW5kZXhdO1xyXG4gICAgICAgICAgICBzb2x1dGlvbi5zdGF0ZVxyXG4gICAgICAgICAgICAgICAgLmZpbHRlcih6ID0+IHogPT09IERyaXZlclN0YXRlLkRpc2Nvbm5lY3RlZClcclxuICAgICAgICAgICAgICAgIC50YWtlKDEpXHJcbiAgICAgICAgICAgICAgICAuZGVsYXkoNTAwKVxyXG4gICAgICAgICAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgc29sdXRpb24uY29ubmVjdCgpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHNvbHV0aW9uLmRpc3Bvc2UoKTtcclxuICAgICAgICB9KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF91cGRhdGVTZWxlY3RlZEl0ZW0oaW5kZXg6IG51bWJlcikge1xyXG4gICAgICAgIGlmIChpbmRleCA8IDApIHtcclxuICAgICAgICAgICAgaW5kZXggPSBTb2x1dGlvbk1hbmFnZXIuYWN0aXZlU29sdXRpb25zLmxlbmd0aCAtIDE7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChpbmRleCA+PSBTb2x1dGlvbk1hbmFnZXIuYWN0aXZlU29sdXRpb25zLmxlbmd0aCkge1xyXG4gICAgICAgICAgICBpbmRleCA9IDA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLnNlbGVjdGVkSW5kZXggIT09IGluZGV4KSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWRJbmRleCA9IGluZGV4O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuY2FyZCkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5zZWxlY3RlZERpc3Bvc2FibGUpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWREaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmNhcmQudXBkYXRlQ2FyZChTb2x1dGlvbk1hbmFnZXIuYWN0aXZlU29sdXRpb25zW3RoaXMuc2VsZWN0ZWRJbmRleF0ubW9kZWwsIFNvbHV0aW9uTWFuYWdlci5hY3RpdmVTb2x1dGlvbnMubGVuZ3RoKTtcclxuICAgICAgICAgICAgdGhpcy5zZWxlY3RlZERpc3Bvc2FibGUgPSBEaXNwb3NhYmxlLm9mKFxyXG4gICAgICAgICAgICAgICAgU29sdXRpb25NYW5hZ2VyLmFjdGl2ZVNvbHV0aW9uc1t0aGlzLnNlbGVjdGVkSW5kZXhdLnN0YXRlXHJcbiAgICAgICAgICAgICAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmNhcmQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2FyZC51cGRhdGVDYXJkKFNvbHV0aW9uTWFuYWdlci5hY3RpdmVTb2x1dGlvbnNbdGhpcy5zZWxlY3RlZEluZGV4XS5tb2RlbCwgU29sdXRpb25NYW5hZ2VyLmFjdGl2ZVNvbHV0aW9ucy5sZW5ndGgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfY3JlYXRlU29sdXRpb25DYXJkKCkge1xyXG4gICAgICAgIGNvbnN0IGRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoZGlzcG9zYWJsZSk7XHJcbiAgICAgICAgY29uc3Qgd29ya3NwYWNlID0gPGFueT5hdG9tLnZpZXdzLmdldFZpZXcoYXRvbS53b3Jrc3BhY2UpO1xyXG4gICAgICAgIGlmICghdGhpcy5jb250YWluZXIpIHtcclxuICAgICAgICAgICAgY29uc3QgY29udGFpbmVyID0gdGhpcy5jb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgICAgICAgd29ya3NwYWNlLmFwcGVuZENoaWxkKGNvbnRhaW5lcik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoU29sdXRpb25NYW5hZ2VyLmFjdGl2ZVNvbHV0aW9ucy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgY29uc3QgZWxlbWVudCA9IG5ldyBTb2x1dGlvblN0YXR1c0NhcmQoKTtcclxuICAgICAgICAgICAgZWxlbWVudC5hdHRhY2hUbyA9ICcucHJvamVjdHMtaWNvbic7XHJcbiAgICAgICAgICAgIGVsZW1lbnQudXBkYXRlQ2FyZChTb2x1dGlvbk1hbmFnZXIuYWN0aXZlU29sdXRpb25zW3RoaXMuc2VsZWN0ZWRJbmRleF0ubW9kZWwsIFNvbHV0aW9uTWFuYWdlci5hY3RpdmVTb2x1dGlvbnMubGVuZ3RoKTtcclxuICAgICAgICAgICAgdGhpcy5jb250YWluZXIuYXBwZW5kQ2hpbGQoZWxlbWVudCk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmNhcmQgPSBlbGVtZW50O1xyXG5cclxuICAgICAgICAgICAgZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoJ2F0b20td29ya3NwYWNlJywgJ2NvcmU6Y2FuY2VsJywgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUucmVtb3ZlKGRpc3Bvc2FibGUpO1xyXG4gICAgICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgICAgICBkaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5jYXJkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jYXJkLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdGhpcy5jYXJkID0gbnVsbDtcclxuICAgICAgICAgICAgICAgIHRoaXMuY2FyZERpc3Bvc2FibGUgPSBudWxsO1xyXG4gICAgICAgICAgICB9KSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuY2FyZERpc3Bvc2FibGUpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuY2FyZERpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBkaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5jYXJkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jYXJkLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdGhpcy5jYXJkID0gbnVsbDtcclxuICAgICAgICAgICAgICAgIHRoaXMuY2FyZERpc3Bvc2FibGUgPSBudWxsO1xyXG4gICAgICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGRpc3Bvc2FibGU7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpleHBvcnQtbmFtZVxyXG5leHBvcnQgY29uc3Qgc29sdXRpb25JbmZvcm1hdGlvbiA9IG5ldyBTb2x1dGlvbkluZm9ybWF0aW9uKCk7XHJcbiJdfQ==
