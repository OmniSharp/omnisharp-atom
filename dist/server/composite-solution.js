'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.SolutionAggregateObserver = exports.SolutionObserver = undefined;

var _omnisharpClient = require('omnisharp-client');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var SolutionObserver = exports.SolutionObserver = function (_ReactiveObservationC) {
    _inherits(SolutionObserver, _ReactiveObservationC);

    function SolutionObserver() {
        var solutions = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9zZXJ2ZXIvY29tcG9zaXRlLXNvbHV0aW9uLnRzIl0sIm5hbWVzIjpbIlNvbHV0aW9uT2JzZXJ2ZXIiLCJzb2x1dGlvbnMiLCJtb2RlbCIsImRpYWdub3N0aWNzIiwibWFrZU9ic2VydmFibGUiLCJzb2x1dGlvbiIsIm9ic2VydmUiLCJkaWFnbm9zdGljc0NvdW50cyIsImRpYWdub3N0aWNzQnlGaWxlIiwib3V0cHV0Iiwic3RhdHVzIiwic3RhdGUiLCJwcm9qZWN0QWRkZWQiLCJwcm9qZWN0UmVtb3ZlZCIsInByb2plY3RDaGFuZ2VkIiwicHJvamVjdHMiLCJTb2x1dGlvbkFnZ3JlZ2F0ZU9ic2VydmVyIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBQUE7Ozs7Ozs7O0lBSU1BLGdCLFdBQUFBLGdCOzs7QUFHRixnQ0FBc0M7QUFBQSxZQUExQkMsU0FBMEIsdUVBQUYsRUFBRTs7QUFBQTs7QUFBQSx3SUFDNUJBLFNBRDRCOztBQUdsQyxjQUFLQyxLQUFMLEdBQWE7QUFDVEMseUJBQWEsTUFBS0MsY0FBTCxDQUFvQixVQUFDQyxRQUFEO0FBQUEsdUJBQXdCQSxTQUFTSCxLQUFULENBQWVJLE9BQWYsQ0FBdUJILFdBQS9DO0FBQUEsYUFBcEIsQ0FESjtBQUVUSSwrQkFBbUIsTUFBS0gsY0FBTCxDQUFvQixVQUFDQyxRQUFEO0FBQUEsdUJBQXdCQSxTQUFTSCxLQUFULENBQWVJLE9BQWYsQ0FBdUJDLGlCQUEvQztBQUFBLGFBQXBCLENBRlY7QUFHVEMsK0JBQW1CLE1BQUtKLGNBQUwsQ0FBb0IsVUFBQ0MsUUFBRDtBQUFBLHVCQUF3QkEsU0FBU0gsS0FBVCxDQUFlSSxPQUFmLENBQXVCRSxpQkFBL0M7QUFBQSxhQUFwQixDQUhWO0FBSVRDLG9CQUFRLE1BQUtMLGNBQUwsQ0FBb0IsVUFBQ0MsUUFBRDtBQUFBLHVCQUF3QkEsU0FBU0gsS0FBVCxDQUFlSSxPQUFmLENBQXVCRyxNQUEvQztBQUFBLGFBQXBCLENBSkM7QUFLVEMsb0JBQVEsTUFBS04sY0FBTCxDQUFvQixVQUFDQyxRQUFEO0FBQUEsdUJBQXdCQSxTQUFTSCxLQUFULENBQWVJLE9BQWYsQ0FBdUJJLE1BQS9DO0FBQUEsYUFBcEIsQ0FMQztBQU1UQyxtQkFBTyxNQUFLUCxjQUFMLENBQW9CLFVBQUNDLFFBQUQ7QUFBQSx1QkFBd0JBLFNBQVNILEtBQVQsQ0FBZUksT0FBZixDQUF1QkssS0FBL0M7QUFBQSxhQUFwQixDQU5FO0FBT1RDLDBCQUFjLE1BQUtSLGNBQUwsQ0FBb0IsVUFBQ0MsUUFBRDtBQUFBLHVCQUF3QkEsU0FBU0gsS0FBVCxDQUFlSSxPQUFmLENBQXVCTSxZQUEvQztBQUFBLGFBQXBCLENBUEw7QUFRVEMsNEJBQWdCLE1BQUtULGNBQUwsQ0FBb0IsVUFBQ0MsUUFBRDtBQUFBLHVCQUF3QkEsU0FBU0gsS0FBVCxDQUFlSSxPQUFmLENBQXVCTyxjQUEvQztBQUFBLGFBQXBCLENBUlA7QUFTVEMsNEJBQWdCLE1BQUtWLGNBQUwsQ0FBb0IsVUFBQ0MsUUFBRDtBQUFBLHVCQUF3QkEsU0FBU0gsS0FBVCxDQUFlSSxPQUFmLENBQXVCUSxjQUEvQztBQUFBLGFBQXBCLENBVFA7QUFVVEMsc0JBQVUsTUFBS1gsY0FBTCxDQUFvQixVQUFDQyxRQUFEO0FBQUEsdUJBQXdCQSxTQUFTSCxLQUFULENBQWVJLE9BQWYsQ0FBdUJTLFFBQS9DO0FBQUEsYUFBcEI7QUFWRCxTQUFiO0FBSGtDO0FBZXJDOzs7OztJQUdDQyx5QixXQUFBQSx5QiIsImZpbGUiOiJsaWIvc2VydmVyL2NvbXBvc2l0ZS1zb2x1dGlvbi5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7UmVhY3RpdmVDb21iaW5hdGlvbkNsaWVudCwgUmVhY3RpdmVPYnNlcnZhdGlvbkNsaWVudH0gZnJvbSAnb21uaXNoYXJwLWNsaWVudCc7XHJcbmltcG9ydCB7U29sdXRpb259IGZyb20gJy4vc29sdXRpb24nO1xyXG5pbXBvcnQge1ZpZXdNb2RlbH0gZnJvbSAnLi92aWV3LW1vZGVsJztcclxuXHJcbmV4cG9ydCBjbGFzcyBTb2x1dGlvbk9ic2VydmVyIGV4dGVuZHMgUmVhY3RpdmVPYnNlcnZhdGlvbkNsaWVudDxTb2x1dGlvbj4ge1xyXG4gICAgcHVibGljIG1vZGVsOiB0eXBlb2YgVmlld01vZGVsLnByb3RvdHlwZS5vYnNlcnZlO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHNvbHV0aW9uczogU29sdXRpb25bXSA9IFtdKSB7XHJcbiAgICAgICAgc3VwZXIoc29sdXRpb25zKTtcclxuXHJcbiAgICAgICAgdGhpcy5tb2RlbCA9IHtcclxuICAgICAgICAgICAgZGlhZ25vc3RpY3M6IHRoaXMubWFrZU9ic2VydmFibGUoKHNvbHV0aW9uOiBTb2x1dGlvbikgPT4gc29sdXRpb24ubW9kZWwub2JzZXJ2ZS5kaWFnbm9zdGljcyksXHJcbiAgICAgICAgICAgIGRpYWdub3N0aWNzQ291bnRzOiB0aGlzLm1ha2VPYnNlcnZhYmxlKChzb2x1dGlvbjogU29sdXRpb24pID0+IHNvbHV0aW9uLm1vZGVsLm9ic2VydmUuZGlhZ25vc3RpY3NDb3VudHMpLFxyXG4gICAgICAgICAgICBkaWFnbm9zdGljc0J5RmlsZTogdGhpcy5tYWtlT2JzZXJ2YWJsZSgoc29sdXRpb246IFNvbHV0aW9uKSA9PiBzb2x1dGlvbi5tb2RlbC5vYnNlcnZlLmRpYWdub3N0aWNzQnlGaWxlKSxcclxuICAgICAgICAgICAgb3V0cHV0OiB0aGlzLm1ha2VPYnNlcnZhYmxlKChzb2x1dGlvbjogU29sdXRpb24pID0+IHNvbHV0aW9uLm1vZGVsLm9ic2VydmUub3V0cHV0KSxcclxuICAgICAgICAgICAgc3RhdHVzOiB0aGlzLm1ha2VPYnNlcnZhYmxlKChzb2x1dGlvbjogU29sdXRpb24pID0+IHNvbHV0aW9uLm1vZGVsLm9ic2VydmUuc3RhdHVzKSxcclxuICAgICAgICAgICAgc3RhdGU6IHRoaXMubWFrZU9ic2VydmFibGUoKHNvbHV0aW9uOiBTb2x1dGlvbikgPT4gc29sdXRpb24ubW9kZWwub2JzZXJ2ZS5zdGF0ZSksXHJcbiAgICAgICAgICAgIHByb2plY3RBZGRlZDogdGhpcy5tYWtlT2JzZXJ2YWJsZSgoc29sdXRpb246IFNvbHV0aW9uKSA9PiBzb2x1dGlvbi5tb2RlbC5vYnNlcnZlLnByb2plY3RBZGRlZCksXHJcbiAgICAgICAgICAgIHByb2plY3RSZW1vdmVkOiB0aGlzLm1ha2VPYnNlcnZhYmxlKChzb2x1dGlvbjogU29sdXRpb24pID0+IHNvbHV0aW9uLm1vZGVsLm9ic2VydmUucHJvamVjdFJlbW92ZWQpLFxyXG4gICAgICAgICAgICBwcm9qZWN0Q2hhbmdlZDogdGhpcy5tYWtlT2JzZXJ2YWJsZSgoc29sdXRpb246IFNvbHV0aW9uKSA9PiBzb2x1dGlvbi5tb2RlbC5vYnNlcnZlLnByb2plY3RDaGFuZ2VkKSxcclxuICAgICAgICAgICAgcHJvamVjdHM6IHRoaXMubWFrZU9ic2VydmFibGUoKHNvbHV0aW9uOiBTb2x1dGlvbikgPT4gc29sdXRpb24ubW9kZWwub2JzZXJ2ZS5wcm9qZWN0cylcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgU29sdXRpb25BZ2dyZWdhdGVPYnNlcnZlciBleHRlbmRzIFJlYWN0aXZlQ29tYmluYXRpb25DbGllbnQ8U29sdXRpb24+IHsgfVxyXG4iXX0=
