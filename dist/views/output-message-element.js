"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.OutputMessageElement = undefined;

var _ansiToHtml = require("../services/ansi-to-html");

var convert = new _ansiToHtml.Convert();
var props = {
    set: function message(value) {
        this.innerHTML = convert.toHtml(value.message).trim();
        this.classList.add(value.logLevel);
    }
};
var OutputMessageElement = exports.OutputMessageElement = undefined;
(function (OutputMessageElement) {
    function create(value) {
        var pre = document.createElement("pre");
        Object.defineProperty(pre, "message", props);
        pre.message = value;
        return pre;
    }
    OutputMessageElement.create = create;
})(OutputMessageElement || (exports.OutputMessageElement = OutputMessageElement = {}));
;
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy9vdXRwdXQtbWVzc2FnZS1lbGVtZW50LmpzIiwibGliL3ZpZXdzL291dHB1dC1tZXNzYWdlLWVsZW1lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUFBOztBQ0NBLElBQU0sVUFBVSx5QkFBVjtBQUVOLElBQU0sUUFBUTtBQUNWLFNBQUssU0FBQSxPQUFBLENBQWlCLEtBQWpCLEVBQXFDO0FBQ3RDLGFBQUssU0FBTCxHQUFpQixRQUFRLE1BQVIsQ0FBZSxNQUFNLE9BQU4sQ0FBZixDQUE4QixJQUE5QixFQUFqQixDQURzQztBQUV0QyxhQUFLLFNBQUwsQ0FBZSxHQUFmLENBQW1CLE1BQU0sUUFBTixDQUFuQixDQUZzQztLQUFyQztDQURIO0FBT04sSUFBaUIsK0RBQWpCO0FBQUEsQ0FBQSxVQUFpQixvQkFBakIsRUFBc0M7QUFDbEMsYUFBQSxNQUFBLENBQXVCLEtBQXZCLEVBQTJDO0FBQ3ZDLFlBQU0sTUFBTSxTQUFTLGFBQVQsQ0FBdUIsS0FBdkIsQ0FBTixDQURpQztBQUV2QyxlQUFPLGNBQVAsQ0FBc0IsR0FBdEIsRUFBMkIsU0FBM0IsRUFBc0MsS0FBdEMsRUFGdUM7QUFHdEMsWUFBWSxPQUFaLEdBQXNCLEtBQXRCLENBSHNDO0FBS3ZDLGVBQU8sR0FBUCxDQUx1QztLQUEzQztBQUFnQix5QkFBQSxNQUFBLEdBQU0sTUFBTixDQURrQjtDQUF0QyxDQUFBLENBQWlCLGlDQUFBLHVCQUFBLHVCQUFvQixFQUFwQixDQUFBLENBQWpCO0FBUUMiLCJmaWxlIjoibGliL3ZpZXdzL291dHB1dC1tZXNzYWdlLWVsZW1lbnQuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb252ZXJ0IH0gZnJvbSBcIi4uL3NlcnZpY2VzL2Fuc2ktdG8taHRtbFwiO1xuY29uc3QgY29udmVydCA9IG5ldyBDb252ZXJ0KCk7XG5jb25zdCBwcm9wcyA9IHtcbiAgICBzZXQ6IGZ1bmN0aW9uIG1lc3NhZ2UodmFsdWUpIHtcbiAgICAgICAgdGhpcy5pbm5lckhUTUwgPSBjb252ZXJ0LnRvSHRtbCh2YWx1ZS5tZXNzYWdlKS50cmltKCk7XG4gICAgICAgIHRoaXMuY2xhc3NMaXN0LmFkZCh2YWx1ZS5sb2dMZXZlbCk7XG4gICAgfVxufTtcbmV4cG9ydCB2YXIgT3V0cHV0TWVzc2FnZUVsZW1lbnQ7XG4oZnVuY3Rpb24gKE91dHB1dE1lc3NhZ2VFbGVtZW50KSB7XG4gICAgZnVuY3Rpb24gY3JlYXRlKHZhbHVlKSB7XG4gICAgICAgIGNvbnN0IHByZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJwcmVcIik7XG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShwcmUsIFwibWVzc2FnZVwiLCBwcm9wcyk7XG4gICAgICAgIHByZS5tZXNzYWdlID0gdmFsdWU7XG4gICAgICAgIHJldHVybiBwcmU7XG4gICAgfVxuICAgIE91dHB1dE1lc3NhZ2VFbGVtZW50LmNyZWF0ZSA9IGNyZWF0ZTtcbn0pKE91dHB1dE1lc3NhZ2VFbGVtZW50IHx8IChPdXRwdXRNZXNzYWdlRWxlbWVudCA9IHt9KSk7XG47XG4iLCJpbXBvcnQge0NvbnZlcnR9IGZyb20gXCIuLi9zZXJ2aWNlcy9hbnNpLXRvLWh0bWxcIjtcclxuY29uc3QgY29udmVydCA9IG5ldyBDb252ZXJ0KCk7XHJcblxyXG5jb25zdCBwcm9wcyA9IHtcclxuICAgIHNldDogZnVuY3Rpb24gbWVzc2FnZSh2YWx1ZTogT3V0cHV0TWVzc2FnZSkge1xyXG4gICAgICAgIHRoaXMuaW5uZXJIVE1MID0gY29udmVydC50b0h0bWwodmFsdWUubWVzc2FnZSkudHJpbSgpO1xyXG4gICAgICAgIHRoaXMuY2xhc3NMaXN0LmFkZCh2YWx1ZS5sb2dMZXZlbCk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5leHBvcnQgbmFtZXNwYWNlIE91dHB1dE1lc3NhZ2VFbGVtZW50IHtcclxuICAgIGV4cG9ydCBmdW5jdGlvbiBjcmVhdGUodmFsdWU6IE91dHB1dE1lc3NhZ2UpIHtcclxuICAgICAgICBjb25zdCBwcmUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwicHJlXCIpO1xyXG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShwcmUsIFwibWVzc2FnZVwiLCBwcm9wcyk7XHJcbiAgICAgICAgKHByZSBhcyBhbnkpLm1lc3NhZ2UgPSB2YWx1ZTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHByZTtcclxuICAgIH1cclxufTtcclxuIl19
