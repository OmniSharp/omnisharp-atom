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

        var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(SolutionObserver).call(this, solutions));

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

        return _possibleConstructorReturn(this, Object.getPrototypeOf(SolutionAggregateObserver).apply(this, arguments));
    }

    return SolutionAggregateObserver;
}(_omnisharpClient.ReactiveCombinationClient);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9zZXJ2ZXIvY29tcG9zaXRlLXNvbHV0aW9uLmpzIiwibGliL3NlcnZlci9jb21wb3NpdGUtc29sdXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUFBOzs7Ozs7OztJQ0lBOzs7QUFHSSxnQ0FBc0M7WUFBMUIsa0VBQXdCLGtCQUFFOzs7O3dHQUM1QixZQUQ0Qjs7QUFHbEMsY0FBSyxLQUFMLEdBQWE7QUFDVCx5QkFBYSxNQUFLLGNBQUwsQ0FBb0IsVUFBQyxRQUFEO3VCQUF3QixTQUFTLEtBQVQsQ0FBZSxPQUFmLENBQXVCLFdBQXZCO2FBQXhCLENBQWpDO0FBQ0EsK0JBQW1CLE1BQUssY0FBTCxDQUFvQixVQUFDLFFBQUQ7dUJBQXdCLFNBQVMsS0FBVCxDQUFlLE9BQWYsQ0FBdUIsaUJBQXZCO2FBQXhCLENBQXZDO0FBQ0EsK0JBQW1CLE1BQUssY0FBTCxDQUFvQixVQUFDLFFBQUQ7dUJBQXdCLFNBQVMsS0FBVCxDQUFlLE9BQWYsQ0FBdUIsaUJBQXZCO2FBQXhCLENBQXZDO0FBQ0Esb0JBQVEsTUFBSyxjQUFMLENBQW9CLFVBQUMsUUFBRDt1QkFBd0IsU0FBUyxLQUFULENBQWUsT0FBZixDQUF1QixNQUF2QjthQUF4QixDQUE1QjtBQUNBLG9CQUFRLE1BQUssY0FBTCxDQUFvQixVQUFDLFFBQUQ7dUJBQXdCLFNBQVMsS0FBVCxDQUFlLE9BQWYsQ0FBdUIsTUFBdkI7YUFBeEIsQ0FBNUI7QUFDQSxtQkFBTyxNQUFLLGNBQUwsQ0FBb0IsVUFBQyxRQUFEO3VCQUF3QixTQUFTLEtBQVQsQ0FBZSxPQUFmLENBQXVCLEtBQXZCO2FBQXhCLENBQTNCO0FBQ0EsMEJBQWMsTUFBSyxjQUFMLENBQW9CLFVBQUMsUUFBRDt1QkFBd0IsU0FBUyxLQUFULENBQWUsT0FBZixDQUF1QixZQUF2QjthQUF4QixDQUFsQztBQUNBLDRCQUFnQixNQUFLLGNBQUwsQ0FBb0IsVUFBQyxRQUFEO3VCQUF3QixTQUFTLEtBQVQsQ0FBZSxPQUFmLENBQXVCLGNBQXZCO2FBQXhCLENBQXBDO0FBQ0EsNEJBQWdCLE1BQUssY0FBTCxDQUFvQixVQUFDLFFBQUQ7dUJBQXdCLFNBQVMsS0FBVCxDQUFlLE9BQWYsQ0FBdUIsY0FBdkI7YUFBeEIsQ0FBcEM7QUFDQSxzQkFBVSxNQUFLLGNBQUwsQ0FBb0IsVUFBQyxRQUFEO3VCQUF3QixTQUFTLEtBQVQsQ0FBZSxPQUFmLENBQXVCLFFBQXZCO2FBQXhCLENBQTlCO1NBVkosQ0FIa0M7O0tBQXRDOzs7OztJQWtCSiIsImZpbGUiOiJsaWIvc2VydmVyL2NvbXBvc2l0ZS1zb2x1dGlvbi5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFJlYWN0aXZlT2JzZXJ2YXRpb25DbGllbnQsIFJlYWN0aXZlQ29tYmluYXRpb25DbGllbnQgfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xuZXhwb3J0IGNsYXNzIFNvbHV0aW9uT2JzZXJ2ZXIgZXh0ZW5kcyBSZWFjdGl2ZU9ic2VydmF0aW9uQ2xpZW50IHtcbiAgICBjb25zdHJ1Y3Rvcihzb2x1dGlvbnMgPSBbXSkge1xuICAgICAgICBzdXBlcihzb2x1dGlvbnMpO1xuICAgICAgICB0aGlzLm1vZGVsID0ge1xuICAgICAgICAgICAgZGlhZ25vc3RpY3M6IHRoaXMubWFrZU9ic2VydmFibGUoKHNvbHV0aW9uKSA9PiBzb2x1dGlvbi5tb2RlbC5vYnNlcnZlLmRpYWdub3N0aWNzKSxcbiAgICAgICAgICAgIGRpYWdub3N0aWNzQ291bnRzOiB0aGlzLm1ha2VPYnNlcnZhYmxlKChzb2x1dGlvbikgPT4gc29sdXRpb24ubW9kZWwub2JzZXJ2ZS5kaWFnbm9zdGljc0NvdW50cyksXG4gICAgICAgICAgICBkaWFnbm9zdGljc0J5RmlsZTogdGhpcy5tYWtlT2JzZXJ2YWJsZSgoc29sdXRpb24pID0+IHNvbHV0aW9uLm1vZGVsLm9ic2VydmUuZGlhZ25vc3RpY3NCeUZpbGUpLFxuICAgICAgICAgICAgb3V0cHV0OiB0aGlzLm1ha2VPYnNlcnZhYmxlKChzb2x1dGlvbikgPT4gc29sdXRpb24ubW9kZWwub2JzZXJ2ZS5vdXRwdXQpLFxuICAgICAgICAgICAgc3RhdHVzOiB0aGlzLm1ha2VPYnNlcnZhYmxlKChzb2x1dGlvbikgPT4gc29sdXRpb24ubW9kZWwub2JzZXJ2ZS5zdGF0dXMpLFxuICAgICAgICAgICAgc3RhdGU6IHRoaXMubWFrZU9ic2VydmFibGUoKHNvbHV0aW9uKSA9PiBzb2x1dGlvbi5tb2RlbC5vYnNlcnZlLnN0YXRlKSxcbiAgICAgICAgICAgIHByb2plY3RBZGRlZDogdGhpcy5tYWtlT2JzZXJ2YWJsZSgoc29sdXRpb24pID0+IHNvbHV0aW9uLm1vZGVsLm9ic2VydmUucHJvamVjdEFkZGVkKSxcbiAgICAgICAgICAgIHByb2plY3RSZW1vdmVkOiB0aGlzLm1ha2VPYnNlcnZhYmxlKChzb2x1dGlvbikgPT4gc29sdXRpb24ubW9kZWwub2JzZXJ2ZS5wcm9qZWN0UmVtb3ZlZCksXG4gICAgICAgICAgICBwcm9qZWN0Q2hhbmdlZDogdGhpcy5tYWtlT2JzZXJ2YWJsZSgoc29sdXRpb24pID0+IHNvbHV0aW9uLm1vZGVsLm9ic2VydmUucHJvamVjdENoYW5nZWQpLFxuICAgICAgICAgICAgcHJvamVjdHM6IHRoaXMubWFrZU9ic2VydmFibGUoKHNvbHV0aW9uKSA9PiBzb2x1dGlvbi5tb2RlbC5vYnNlcnZlLnByb2plY3RzKVxuICAgICAgICB9O1xuICAgIH1cbn1cbmV4cG9ydCBjbGFzcyBTb2x1dGlvbkFnZ3JlZ2F0ZU9ic2VydmVyIGV4dGVuZHMgUmVhY3RpdmVDb21iaW5hdGlvbkNsaWVudCB7XG59XG4iLCJpbXBvcnQge1JlYWN0aXZlT2JzZXJ2YXRpb25DbGllbnQsIFJlYWN0aXZlQ29tYmluYXRpb25DbGllbnR9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XHJcbmltcG9ydCB7U29sdXRpb259IGZyb20gXCIuL3NvbHV0aW9uXCI7XHJcbmltcG9ydCB7Vmlld01vZGVsfSBmcm9tIFwiLi92aWV3LW1vZGVsXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgU29sdXRpb25PYnNlcnZlciBleHRlbmRzIFJlYWN0aXZlT2JzZXJ2YXRpb25DbGllbnQ8U29sdXRpb24+IHtcclxuICAgIHB1YmxpYyBtb2RlbDogdHlwZW9mIFZpZXdNb2RlbC5wcm90b3R5cGUub2JzZXJ2ZTtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihzb2x1dGlvbnM6IFNvbHV0aW9uW10gPSBbXSkge1xyXG4gICAgICAgIHN1cGVyKHNvbHV0aW9ucyk7XHJcblxyXG4gICAgICAgIHRoaXMubW9kZWwgPSB7XHJcbiAgICAgICAgICAgIGRpYWdub3N0aWNzOiB0aGlzLm1ha2VPYnNlcnZhYmxlKChzb2x1dGlvbjogU29sdXRpb24pID0+IHNvbHV0aW9uLm1vZGVsLm9ic2VydmUuZGlhZ25vc3RpY3MpLFxyXG4gICAgICAgICAgICBkaWFnbm9zdGljc0NvdW50czogdGhpcy5tYWtlT2JzZXJ2YWJsZSgoc29sdXRpb246IFNvbHV0aW9uKSA9PiBzb2x1dGlvbi5tb2RlbC5vYnNlcnZlLmRpYWdub3N0aWNzQ291bnRzKSxcclxuICAgICAgICAgICAgZGlhZ25vc3RpY3NCeUZpbGU6IHRoaXMubWFrZU9ic2VydmFibGUoKHNvbHV0aW9uOiBTb2x1dGlvbikgPT4gc29sdXRpb24ubW9kZWwub2JzZXJ2ZS5kaWFnbm9zdGljc0J5RmlsZSksXHJcbiAgICAgICAgICAgIG91dHB1dDogdGhpcy5tYWtlT2JzZXJ2YWJsZSgoc29sdXRpb246IFNvbHV0aW9uKSA9PiBzb2x1dGlvbi5tb2RlbC5vYnNlcnZlLm91dHB1dCksXHJcbiAgICAgICAgICAgIHN0YXR1czogdGhpcy5tYWtlT2JzZXJ2YWJsZSgoc29sdXRpb246IFNvbHV0aW9uKSA9PiBzb2x1dGlvbi5tb2RlbC5vYnNlcnZlLnN0YXR1cyksXHJcbiAgICAgICAgICAgIHN0YXRlOiB0aGlzLm1ha2VPYnNlcnZhYmxlKChzb2x1dGlvbjogU29sdXRpb24pID0+IHNvbHV0aW9uLm1vZGVsLm9ic2VydmUuc3RhdGUpLFxyXG4gICAgICAgICAgICBwcm9qZWN0QWRkZWQ6IHRoaXMubWFrZU9ic2VydmFibGUoKHNvbHV0aW9uOiBTb2x1dGlvbikgPT4gc29sdXRpb24ubW9kZWwub2JzZXJ2ZS5wcm9qZWN0QWRkZWQpLFxyXG4gICAgICAgICAgICBwcm9qZWN0UmVtb3ZlZDogdGhpcy5tYWtlT2JzZXJ2YWJsZSgoc29sdXRpb246IFNvbHV0aW9uKSA9PiBzb2x1dGlvbi5tb2RlbC5vYnNlcnZlLnByb2plY3RSZW1vdmVkKSxcclxuICAgICAgICAgICAgcHJvamVjdENoYW5nZWQ6IHRoaXMubWFrZU9ic2VydmFibGUoKHNvbHV0aW9uOiBTb2x1dGlvbikgPT4gc29sdXRpb24ubW9kZWwub2JzZXJ2ZS5wcm9qZWN0Q2hhbmdlZCksXHJcbiAgICAgICAgICAgIHByb2plY3RzOiB0aGlzLm1ha2VPYnNlcnZhYmxlKChzb2x1dGlvbjogU29sdXRpb24pID0+IHNvbHV0aW9uLm1vZGVsLm9ic2VydmUucHJvamVjdHMpXHJcbiAgICAgICAgfTtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIFNvbHV0aW9uQWdncmVnYXRlT2JzZXJ2ZXIgZXh0ZW5kcyBSZWFjdGl2ZUNvbWJpbmF0aW9uQ2xpZW50PFNvbHV0aW9uPiB7IH1cclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
