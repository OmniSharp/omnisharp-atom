"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.SolutionAggregateObserver = exports.SolutionObserver = undefined;

var _omnisharpClient = require("omnisharp-client");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var SolutionObserver = exports.SolutionObserver = function (_ReactiveObservationC) {
    _inherits(SolutionObserver, _ReactiveObservationC);

    function SolutionObserver() {
        var solutions = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];

        _classCallCheck(this, SolutionObserver);

        var _this = _possibleConstructorReturn(this, (SolutionObserver.__proto__ || Object.getPrototypeOf(SolutionObserver)).call(this, solutions));

        _this.model = {
            diagnostics: _this.makeObservable(function (solution) {
                return solution.model.observe.diagnostics;
            }),
            diagnosticsCounts: _this.makeObservable(function (solution) {
                return solution.model.observe.diagnosticsCounts;
            }),
            diagnosticsByFile: _this.makeObservable(function (solution) {
                return solution.model.observe.diagnosticsByFile;
            }),
            output: _this.makeObservable(function (solution) {
                return solution.model.observe.output;
            }),
            status: _this.makeObservable(function (solution) {
                return solution.model.observe.status;
            }),
            state: _this.makeObservable(function (solution) {
                return solution.model.observe.state;
            }),
            projectAdded: _this.makeObservable(function (solution) {
                return solution.model.observe.projectAdded;
            }),
            projectRemoved: _this.makeObservable(function (solution) {
                return solution.model.observe.projectRemoved;
            }),
            projectChanged: _this.makeObservable(function (solution) {
                return solution.model.observe.projectChanged;
            }),
            projects: _this.makeObservable(function (solution) {
                return solution.model.observe.projects;
            })
        };
        return _this;
    }

    return SolutionObserver;
}(_omnisharpClient.ReactiveObservationClient);

var SolutionAggregateObserver = exports.SolutionAggregateObserver = function (_ReactiveCombinationC) {
    _inherits(SolutionAggregateObserver, _ReactiveCombinationC);

    function SolutionAggregateObserver() {
        _classCallCheck(this, SolutionAggregateObserver);

        return _possibleConstructorReturn(this, (SolutionAggregateObserver.__proto__ || Object.getPrototypeOf(SolutionAggregateObserver)).apply(this, arguments));
    }

    return SolutionAggregateObserver;
}(_omnisharpClient.ReactiveCombinationClient);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9zZXJ2ZXIvY29tcG9zaXRlLXNvbHV0aW9uLmpzIiwibGliL3NlcnZlci9jb21wb3NpdGUtc29sdXRpb24udHMiXSwibmFtZXMiOlsiU29sdXRpb25PYnNlcnZlciIsInNvbHV0aW9ucyIsIm1vZGVsIiwiZGlhZ25vc3RpY3MiLCJtYWtlT2JzZXJ2YWJsZSIsInNvbHV0aW9uIiwib2JzZXJ2ZSIsImRpYWdub3N0aWNzQ291bnRzIiwiZGlhZ25vc3RpY3NCeUZpbGUiLCJvdXRwdXQiLCJzdGF0dXMiLCJzdGF0ZSIsInByb2plY3RBZGRlZCIsInByb2plY3RSZW1vdmVkIiwicHJvamVjdENoYW5nZWQiLCJwcm9qZWN0cyIsIlNvbHV0aW9uQWdncmVnYXRlT2JzZXJ2ZXIiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFBQTs7Ozs7Ozs7SUNJQUEsZ0IsV0FBQUEsZ0I7OztBQUdJLGdDQUFzQztBQUFBLFlBQTFCQyxTQUEwQix5REFBRixFQUFFOztBQUFBOztBQUFBLHdJQUM1QkEsU0FENEI7O0FBR2xDLGNBQUtDLEtBQUwsR0FBYTtBQUNUQyx5QkFBYSxNQUFLQyxjQUFMLENBQW9CLFVBQUNDLFFBQUQ7QUFBQSx1QkFBd0JBLFNBQVNILEtBQVQsQ0FBZUksT0FBZixDQUF1QkgsV0FBL0M7QUFBQSxhQUFwQixDQURKO0FBRVRJLCtCQUFtQixNQUFLSCxjQUFMLENBQW9CLFVBQUNDLFFBQUQ7QUFBQSx1QkFBd0JBLFNBQVNILEtBQVQsQ0FBZUksT0FBZixDQUF1QkMsaUJBQS9DO0FBQUEsYUFBcEIsQ0FGVjtBQUdUQywrQkFBbUIsTUFBS0osY0FBTCxDQUFvQixVQUFDQyxRQUFEO0FBQUEsdUJBQXdCQSxTQUFTSCxLQUFULENBQWVJLE9BQWYsQ0FBdUJFLGlCQUEvQztBQUFBLGFBQXBCLENBSFY7QUFJVEMsb0JBQVEsTUFBS0wsY0FBTCxDQUFvQixVQUFDQyxRQUFEO0FBQUEsdUJBQXdCQSxTQUFTSCxLQUFULENBQWVJLE9BQWYsQ0FBdUJHLE1BQS9DO0FBQUEsYUFBcEIsQ0FKQztBQUtUQyxvQkFBUSxNQUFLTixjQUFMLENBQW9CLFVBQUNDLFFBQUQ7QUFBQSx1QkFBd0JBLFNBQVNILEtBQVQsQ0FBZUksT0FBZixDQUF1QkksTUFBL0M7QUFBQSxhQUFwQixDQUxDO0FBTVRDLG1CQUFPLE1BQUtQLGNBQUwsQ0FBb0IsVUFBQ0MsUUFBRDtBQUFBLHVCQUF3QkEsU0FBU0gsS0FBVCxDQUFlSSxPQUFmLENBQXVCSyxLQUEvQztBQUFBLGFBQXBCLENBTkU7QUFPVEMsMEJBQWMsTUFBS1IsY0FBTCxDQUFvQixVQUFDQyxRQUFEO0FBQUEsdUJBQXdCQSxTQUFTSCxLQUFULENBQWVJLE9BQWYsQ0FBdUJNLFlBQS9DO0FBQUEsYUFBcEIsQ0FQTDtBQVFUQyw0QkFBZ0IsTUFBS1QsY0FBTCxDQUFvQixVQUFDQyxRQUFEO0FBQUEsdUJBQXdCQSxTQUFTSCxLQUFULENBQWVJLE9BQWYsQ0FBdUJPLGNBQS9DO0FBQUEsYUFBcEIsQ0FSUDtBQVNUQyw0QkFBZ0IsTUFBS1YsY0FBTCxDQUFvQixVQUFDQyxRQUFEO0FBQUEsdUJBQXdCQSxTQUFTSCxLQUFULENBQWVJLE9BQWYsQ0FBdUJRLGNBQS9DO0FBQUEsYUFBcEIsQ0FUUDtBQVVUQyxzQkFBVSxNQUFLWCxjQUFMLENBQW9CLFVBQUNDLFFBQUQ7QUFBQSx1QkFBd0JBLFNBQVNILEtBQVQsQ0FBZUksT0FBZixDQUF1QlMsUUFBL0M7QUFBQSxhQUFwQjtBQVZELFNBQWI7QUFIa0M7QUFlckM7Ozs7O0lBR0xDLHlCLFdBQUFBLHlCIiwiZmlsZSI6ImxpYi9zZXJ2ZXIvY29tcG9zaXRlLXNvbHV0aW9uLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgUmVhY3RpdmVPYnNlcnZhdGlvbkNsaWVudCwgUmVhY3RpdmVDb21iaW5hdGlvbkNsaWVudCB9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XG5leHBvcnQgY2xhc3MgU29sdXRpb25PYnNlcnZlciBleHRlbmRzIFJlYWN0aXZlT2JzZXJ2YXRpb25DbGllbnQge1xuICAgIGNvbnN0cnVjdG9yKHNvbHV0aW9ucyA9IFtdKSB7XG4gICAgICAgIHN1cGVyKHNvbHV0aW9ucyk7XG4gICAgICAgIHRoaXMubW9kZWwgPSB7XG4gICAgICAgICAgICBkaWFnbm9zdGljczogdGhpcy5tYWtlT2JzZXJ2YWJsZSgoc29sdXRpb24pID0+IHNvbHV0aW9uLm1vZGVsLm9ic2VydmUuZGlhZ25vc3RpY3MpLFxuICAgICAgICAgICAgZGlhZ25vc3RpY3NDb3VudHM6IHRoaXMubWFrZU9ic2VydmFibGUoKHNvbHV0aW9uKSA9PiBzb2x1dGlvbi5tb2RlbC5vYnNlcnZlLmRpYWdub3N0aWNzQ291bnRzKSxcbiAgICAgICAgICAgIGRpYWdub3N0aWNzQnlGaWxlOiB0aGlzLm1ha2VPYnNlcnZhYmxlKChzb2x1dGlvbikgPT4gc29sdXRpb24ubW9kZWwub2JzZXJ2ZS5kaWFnbm9zdGljc0J5RmlsZSksXG4gICAgICAgICAgICBvdXRwdXQ6IHRoaXMubWFrZU9ic2VydmFibGUoKHNvbHV0aW9uKSA9PiBzb2x1dGlvbi5tb2RlbC5vYnNlcnZlLm91dHB1dCksXG4gICAgICAgICAgICBzdGF0dXM6IHRoaXMubWFrZU9ic2VydmFibGUoKHNvbHV0aW9uKSA9PiBzb2x1dGlvbi5tb2RlbC5vYnNlcnZlLnN0YXR1cyksXG4gICAgICAgICAgICBzdGF0ZTogdGhpcy5tYWtlT2JzZXJ2YWJsZSgoc29sdXRpb24pID0+IHNvbHV0aW9uLm1vZGVsLm9ic2VydmUuc3RhdGUpLFxuICAgICAgICAgICAgcHJvamVjdEFkZGVkOiB0aGlzLm1ha2VPYnNlcnZhYmxlKChzb2x1dGlvbikgPT4gc29sdXRpb24ubW9kZWwub2JzZXJ2ZS5wcm9qZWN0QWRkZWQpLFxuICAgICAgICAgICAgcHJvamVjdFJlbW92ZWQ6IHRoaXMubWFrZU9ic2VydmFibGUoKHNvbHV0aW9uKSA9PiBzb2x1dGlvbi5tb2RlbC5vYnNlcnZlLnByb2plY3RSZW1vdmVkKSxcbiAgICAgICAgICAgIHByb2plY3RDaGFuZ2VkOiB0aGlzLm1ha2VPYnNlcnZhYmxlKChzb2x1dGlvbikgPT4gc29sdXRpb24ubW9kZWwub2JzZXJ2ZS5wcm9qZWN0Q2hhbmdlZCksXG4gICAgICAgICAgICBwcm9qZWN0czogdGhpcy5tYWtlT2JzZXJ2YWJsZSgoc29sdXRpb24pID0+IHNvbHV0aW9uLm1vZGVsLm9ic2VydmUucHJvamVjdHMpXG4gICAgICAgIH07XG4gICAgfVxufVxuZXhwb3J0IGNsYXNzIFNvbHV0aW9uQWdncmVnYXRlT2JzZXJ2ZXIgZXh0ZW5kcyBSZWFjdGl2ZUNvbWJpbmF0aW9uQ2xpZW50IHtcbn1cbiIsImltcG9ydCB7UmVhY3RpdmVPYnNlcnZhdGlvbkNsaWVudCwgUmVhY3RpdmVDb21iaW5hdGlvbkNsaWVudH0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcclxuaW1wb3J0IHtTb2x1dGlvbn0gZnJvbSBcIi4vc29sdXRpb25cIjtcclxuaW1wb3J0IHtWaWV3TW9kZWx9IGZyb20gXCIuL3ZpZXctbW9kZWxcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBTb2x1dGlvbk9ic2VydmVyIGV4dGVuZHMgUmVhY3RpdmVPYnNlcnZhdGlvbkNsaWVudDxTb2x1dGlvbj4ge1xyXG4gICAgcHVibGljIG1vZGVsOiB0eXBlb2YgVmlld01vZGVsLnByb3RvdHlwZS5vYnNlcnZlO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHNvbHV0aW9uczogU29sdXRpb25bXSA9IFtdKSB7XHJcbiAgICAgICAgc3VwZXIoc29sdXRpb25zKTtcclxuXHJcbiAgICAgICAgdGhpcy5tb2RlbCA9IHtcclxuICAgICAgICAgICAgZGlhZ25vc3RpY3M6IHRoaXMubWFrZU9ic2VydmFibGUoKHNvbHV0aW9uOiBTb2x1dGlvbikgPT4gc29sdXRpb24ubW9kZWwub2JzZXJ2ZS5kaWFnbm9zdGljcyksXHJcbiAgICAgICAgICAgIGRpYWdub3N0aWNzQ291bnRzOiB0aGlzLm1ha2VPYnNlcnZhYmxlKChzb2x1dGlvbjogU29sdXRpb24pID0+IHNvbHV0aW9uLm1vZGVsLm9ic2VydmUuZGlhZ25vc3RpY3NDb3VudHMpLFxyXG4gICAgICAgICAgICBkaWFnbm9zdGljc0J5RmlsZTogdGhpcy5tYWtlT2JzZXJ2YWJsZSgoc29sdXRpb246IFNvbHV0aW9uKSA9PiBzb2x1dGlvbi5tb2RlbC5vYnNlcnZlLmRpYWdub3N0aWNzQnlGaWxlKSxcclxuICAgICAgICAgICAgb3V0cHV0OiB0aGlzLm1ha2VPYnNlcnZhYmxlKChzb2x1dGlvbjogU29sdXRpb24pID0+IHNvbHV0aW9uLm1vZGVsLm9ic2VydmUub3V0cHV0KSxcclxuICAgICAgICAgICAgc3RhdHVzOiB0aGlzLm1ha2VPYnNlcnZhYmxlKChzb2x1dGlvbjogU29sdXRpb24pID0+IHNvbHV0aW9uLm1vZGVsLm9ic2VydmUuc3RhdHVzKSxcclxuICAgICAgICAgICAgc3RhdGU6IHRoaXMubWFrZU9ic2VydmFibGUoKHNvbHV0aW9uOiBTb2x1dGlvbikgPT4gc29sdXRpb24ubW9kZWwub2JzZXJ2ZS5zdGF0ZSksXHJcbiAgICAgICAgICAgIHByb2plY3RBZGRlZDogdGhpcy5tYWtlT2JzZXJ2YWJsZSgoc29sdXRpb246IFNvbHV0aW9uKSA9PiBzb2x1dGlvbi5tb2RlbC5vYnNlcnZlLnByb2plY3RBZGRlZCksXHJcbiAgICAgICAgICAgIHByb2plY3RSZW1vdmVkOiB0aGlzLm1ha2VPYnNlcnZhYmxlKChzb2x1dGlvbjogU29sdXRpb24pID0+IHNvbHV0aW9uLm1vZGVsLm9ic2VydmUucHJvamVjdFJlbW92ZWQpLFxyXG4gICAgICAgICAgICBwcm9qZWN0Q2hhbmdlZDogdGhpcy5tYWtlT2JzZXJ2YWJsZSgoc29sdXRpb246IFNvbHV0aW9uKSA9PiBzb2x1dGlvbi5tb2RlbC5vYnNlcnZlLnByb2plY3RDaGFuZ2VkKSxcclxuICAgICAgICAgICAgcHJvamVjdHM6IHRoaXMubWFrZU9ic2VydmFibGUoKHNvbHV0aW9uOiBTb2x1dGlvbikgPT4gc29sdXRpb24ubW9kZWwub2JzZXJ2ZS5wcm9qZWN0cylcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgU29sdXRpb25BZ2dyZWdhdGVPYnNlcnZlciBleHRlbmRzIFJlYWN0aXZlQ29tYmluYXRpb25DbGllbnQ8U29sdXRpb24+IHsgfVxyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
