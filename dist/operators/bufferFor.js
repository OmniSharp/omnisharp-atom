"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.bufferFor = bufferFor;

var _Subscriber2 = require("rxjs/Subscriber");

var _async = require("rxjs/scheduler/async");

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function bufferFor(observable, bufferDuration) {
    var scheduler = arguments.length <= 2 || arguments[2] === undefined ? _async.async : arguments[2];

    return observable.lift(new BufferForOperator(bufferDuration, scheduler));
}

var BufferForOperator = function () {
    function BufferForOperator(bufferDuration, scheduler) {
        _classCallCheck(this, BufferForOperator);

        this.bufferDuration = bufferDuration;
        this.scheduler = scheduler;
    }

    _createClass(BufferForOperator, [{
        key: "call",
        value: function call(subscriber, source) {
            return source._subscribe(new BufferForSubscriber(subscriber, this.bufferDuration, this.scheduler));
        }
    }]);

    return BufferForOperator;
}();

var BufferForSubscriber = function (_Subscriber) {
    _inherits(BufferForSubscriber, _Subscriber);

    function BufferForSubscriber(destination, bufferDuration, scheduler) {
        _classCallCheck(this, BufferForSubscriber);

        var _this = _possibleConstructorReturn(this, (BufferForSubscriber.__proto__ || Object.getPrototypeOf(BufferForSubscriber)).call(this, destination));

        _this.bufferDuration = bufferDuration;
        _this.scheduler = scheduler;
        _this.open = false;
        return _this;
    }

    _createClass(BufferForSubscriber, [{
        key: "_next",
        value: function _next(value) {
            if (!this.open) {
                this.openBuffer();
            }
            this.buffer.push(value);
        }
    }, {
        key: "_complete",
        value: function _complete() {
            var buffer = this.buffer;
            if (buffer) {
                this.destination.next(buffer);
            }
            _get(BufferForSubscriber.prototype.__proto__ || Object.getPrototypeOf(BufferForSubscriber.prototype), "_complete", this).call(this);
        }
    }, {
        key: "_unsubscribe",
        value: function _unsubscribe() {
            this.buffer = null;
        }
    }, {
        key: "closeBuffer",
        value: function closeBuffer() {
            this.open = false;
            var buffer = this.buffer;
            if (this.buffer) {
                this.destination.next(buffer);
            }
            this.buffer = null;
        }
    }, {
        key: "openBuffer",
        value: function openBuffer() {
            var _this2 = this;

            var schedule = this.scheduler.schedule(function () {
                _this2.remove(schedule);
                _this2.closeBuffer();
            }, this.bufferDuration);
            this.add(schedule);
            this.open = true;
            this.buffer = [];
        }
    }]);

    return BufferForSubscriber;
}(_Subscriber2.Subscriber);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9vcGVyYXRvcnMvYnVmZmVyRm9yLnRzIiwibGliL29wZXJhdG9ycy9idWZmZXJGb3IuanMiXSwibmFtZXMiOlsiYnVmZmVyRm9yIiwib2JzZXJ2YWJsZSIsImJ1ZmZlckR1cmF0aW9uIiwic2NoZWR1bGVyIiwibGlmdCIsIkJ1ZmZlckZvck9wZXJhdG9yIiwic3Vic2NyaWJlciIsInNvdXJjZSIsIl9zdWJzY3JpYmUiLCJCdWZmZXJGb3JTdWJzY3JpYmVyIiwiZGVzdGluYXRpb24iLCJvcGVuIiwidmFsdWUiLCJvcGVuQnVmZmVyIiwiYnVmZmVyIiwicHVzaCIsIm5leHQiLCJzY2hlZHVsZSIsInJlbW92ZSIsImNsb3NlQnVmZmVyIiwiYWRkIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O1FBTUFBLFMsR0FBQUEsUzs7QUNOQTs7QUFDQTs7Ozs7Ozs7QURLQSxTQUFBQSxTQUFBLENBQTZCQyxVQUE3QixFQUF3REMsY0FBeEQsRUFBaUc7QUFBQSxRQUFqQkMsU0FBaUI7O0FBQzdGLFdBQU9GLFdBQVdHLElBQVgsQ0FBZ0IsSUFBSUMsaUJBQUosQ0FBeUJILGNBQXpCLEVBQXlDQyxTQUF6QyxDQUFoQixDQUFQO0FBQ0g7O0lBRURFLGlCO0FBQ0ksK0JBQW9CSCxjQUFwQixFQUFvREMsU0FBcEQsRUFBd0U7QUFBQTs7QUFBcEQsYUFBQUQsY0FBQSxHQUFBQSxjQUFBO0FBQWdDLGFBQUFDLFNBQUEsR0FBQUEsU0FBQTtBQUNuRDs7Ozs2QkFFV0csVSxFQUE2QkMsTSxFQUFXO0FBQ2hELG1CQUFPQSxPQUFPQyxVQUFQLENBQWtCLElBQUlDLG1CQUFKLENBQXdCSCxVQUF4QixFQUFvQyxLQUFLSixjQUF6QyxFQUF5RCxLQUFLQyxTQUE5RCxDQUFsQixDQUFQO0FBQ0g7Ozs7OztJQUdMTSxtQjs7O0FBSUksaUNBQVlDLFdBQVosRUFBa0RSLGNBQWxELEVBQWtGQyxTQUFsRixFQUFzRztBQUFBOztBQUFBLDhJQUM1Rk8sV0FENEY7O0FBQXBELGNBQUFSLGNBQUEsR0FBQUEsY0FBQTtBQUFnQyxjQUFBQyxTQUFBLEdBQUFBLFNBQUE7QUFGMUUsY0FBQVEsSUFBQSxHQUFPLEtBQVA7QUFFOEY7QUFFckc7Ozs7OEJBRWVDLEssRUFBUTtBQUNwQixnQkFBSSxDQUFDLEtBQUtELElBQVYsRUFBZ0I7QUFDWixxQkFBS0UsVUFBTDtBQUNIO0FBQ0QsaUJBQUtDLE1BQUwsQ0FBWUMsSUFBWixDQUFpQkgsS0FBakI7QUFDSDs7O29DQUVrQjtBQUNmLGdCQUFNRSxTQUFTLEtBQUtBLE1BQXBCO0FBQ0EsZ0JBQUlBLE1BQUosRUFBWTtBQUNSLHFCQUFLSixXQUFMLENBQWlCTSxJQUFqQixDQUFzQkYsTUFBdEI7QUFDSDtBQUNEO0FBQ0g7Ozt1Q0FFcUI7QUFDbEIsaUJBQUtBLE1BQUwsR0FBYyxJQUFkO0FBQ0g7OztzQ0FFaUI7QUFDZCxpQkFBS0gsSUFBTCxHQUFZLEtBQVo7QUFFQSxnQkFBTUcsU0FBUyxLQUFLQSxNQUFwQjtBQUNBLGdCQUFJLEtBQUtBLE1BQVQsRUFBaUI7QUFDYixxQkFBS0osV0FBTCxDQUFpQk0sSUFBakIsQ0FBc0JGLE1BQXRCO0FBQ0g7QUFFRCxpQkFBS0EsTUFBTCxHQUFjLElBQWQ7QUFDSDs7O3FDQUVnQjtBQUFBOztBQUNiLGdCQUFNRyxXQUFXLEtBQUtkLFNBQUwsQ0FBZWMsUUFBZixDQUF3QixZQUFBO0FBQ3JDLHVCQUFLQyxNQUFMLENBQVlELFFBQVo7QUFDQSx1QkFBS0UsV0FBTDtBQUNILGFBSGdCLEVBR2QsS0FBS2pCLGNBSFMsQ0FBakI7QUFJQSxpQkFBS2tCLEdBQUwsQ0FBU0gsUUFBVDtBQUVBLGlCQUFLTixJQUFMLEdBQVksSUFBWjtBQUNBLGlCQUFLRyxNQUFMLEdBQWMsRUFBZDtBQUNIIiwiZmlsZSI6ImxpYi9vcGVyYXRvcnMvYnVmZmVyRm9yLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtPcGVyYXRvcn0gZnJvbSBcInJ4anMvT3BlcmF0b3JcIjtcclxuaW1wb3J0IHtTdWJzY3JpYmVyfSBmcm9tIFwicnhqcy9TdWJzY3JpYmVyXCI7XHJcbmltcG9ydCB7T2JzZXJ2YWJsZX0gZnJvbSBcInJ4anMvT2JzZXJ2YWJsZVwiO1xyXG5pbXBvcnQge1NjaGVkdWxlcn0gZnJvbSBcInJ4anMvU2NoZWR1bGVyXCI7XHJcbmltcG9ydCB7YXN5bmN9IGZyb20gXCJyeGpzL3NjaGVkdWxlci9hc3luY1wiO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGJ1ZmZlckZvcjxUPihvYnNlcnZhYmxlOiBPYnNlcnZhYmxlPFQ+LCBidWZmZXJEdXJhdGlvbjogbnVtYmVyLCBzY2hlZHVsZXIgPSBhc3luYyk6IE9ic2VydmFibGU8VFtdPiB7XHJcbiAgICByZXR1cm4gb2JzZXJ2YWJsZS5saWZ0KG5ldyBCdWZmZXJGb3JPcGVyYXRvcjxUPihidWZmZXJEdXJhdGlvbiwgc2NoZWR1bGVyKSk7XHJcbn1cclxuXHJcbmNsYXNzIEJ1ZmZlckZvck9wZXJhdG9yPFQ+IGltcGxlbWVudHMgT3BlcmF0b3I8VCwgVFtdPiB7XHJcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIGJ1ZmZlckR1cmF0aW9uOiBudW1iZXIsIHByaXZhdGUgc2NoZWR1bGVyOiBTY2hlZHVsZXIpIHtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgY2FsbChzdWJzY3JpYmVyOiBTdWJzY3JpYmVyPFRbXT4sIHNvdXJjZTogYW55KTogU3Vic2NyaWJlcjxUPiB7XHJcbiAgICAgICAgcmV0dXJuIHNvdXJjZS5fc3Vic2NyaWJlKG5ldyBCdWZmZXJGb3JTdWJzY3JpYmVyKHN1YnNjcmliZXIsIHRoaXMuYnVmZmVyRHVyYXRpb24sIHRoaXMuc2NoZWR1bGVyKSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmNsYXNzIEJ1ZmZlckZvclN1YnNjcmliZXI8VD4gZXh0ZW5kcyBTdWJzY3JpYmVyPFQ+IHtcclxuICAgIHByaXZhdGUgYnVmZmVyOiBUW107XHJcbiAgICBwcml2YXRlIG9wZW4gPSBmYWxzZTtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihkZXN0aW5hdGlvbjogU3Vic2NyaWJlcjxUW10+LCBwcml2YXRlIGJ1ZmZlckR1cmF0aW9uOiBudW1iZXIsIHByaXZhdGUgc2NoZWR1bGVyOiBTY2hlZHVsZXIpIHtcclxuICAgICAgICBzdXBlcihkZXN0aW5hdGlvbik7XHJcbiAgICB9XHJcblxyXG4gICAgcHJvdGVjdGVkIF9uZXh0KHZhbHVlOiBUKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLm9wZW4pIHtcclxuICAgICAgICAgICAgdGhpcy5vcGVuQnVmZmVyKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuYnVmZmVyLnB1c2godmFsdWUpO1xyXG4gICAgfVxyXG5cclxuICAgIHByb3RlY3RlZCBfY29tcGxldGUoKSB7XHJcbiAgICAgICAgY29uc3QgYnVmZmVyID0gdGhpcy5idWZmZXI7XHJcbiAgICAgICAgaWYgKGJ1ZmZlcikge1xyXG4gICAgICAgICAgICB0aGlzLmRlc3RpbmF0aW9uLm5leHQoYnVmZmVyKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgc3VwZXIuX2NvbXBsZXRlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJvdGVjdGVkIF91bnN1YnNjcmliZSgpIHtcclxuICAgICAgICB0aGlzLmJ1ZmZlciA9IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNsb3NlQnVmZmVyKCkge1xyXG4gICAgICAgIHRoaXMub3BlbiA9IGZhbHNlO1xyXG5cclxuICAgICAgICBjb25zdCBidWZmZXIgPSB0aGlzLmJ1ZmZlcjtcclxuICAgICAgICBpZiAodGhpcy5idWZmZXIpIHtcclxuICAgICAgICAgICAgdGhpcy5kZXN0aW5hdGlvbi5uZXh0KGJ1ZmZlcik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmJ1ZmZlciA9IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIG9wZW5CdWZmZXIoKSB7XHJcbiAgICAgICAgY29uc3Qgc2NoZWR1bGUgPSB0aGlzLnNjaGVkdWxlci5zY2hlZHVsZSgoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlKHNjaGVkdWxlKTtcclxuICAgICAgICAgICAgdGhpcy5jbG9zZUJ1ZmZlcigpO1xyXG4gICAgICAgIH0sIHRoaXMuYnVmZmVyRHVyYXRpb24pO1xyXG4gICAgICAgIHRoaXMuYWRkKHNjaGVkdWxlKTtcclxuXHJcbiAgICAgICAgdGhpcy5vcGVuID0gdHJ1ZTtcclxuICAgICAgICB0aGlzLmJ1ZmZlciA9IFtdO1xyXG4gICAgfVxyXG59XHJcbiIsImltcG9ydCB7IFN1YnNjcmliZXIgfSBmcm9tIFwicnhqcy9TdWJzY3JpYmVyXCI7XG5pbXBvcnQgeyBhc3luYyB9IGZyb20gXCJyeGpzL3NjaGVkdWxlci9hc3luY1wiO1xuZXhwb3J0IGZ1bmN0aW9uIGJ1ZmZlckZvcihvYnNlcnZhYmxlLCBidWZmZXJEdXJhdGlvbiwgc2NoZWR1bGVyID0gYXN5bmMpIHtcbiAgICByZXR1cm4gb2JzZXJ2YWJsZS5saWZ0KG5ldyBCdWZmZXJGb3JPcGVyYXRvcihidWZmZXJEdXJhdGlvbiwgc2NoZWR1bGVyKSk7XG59XG5jbGFzcyBCdWZmZXJGb3JPcGVyYXRvciB7XG4gICAgY29uc3RydWN0b3IoYnVmZmVyRHVyYXRpb24sIHNjaGVkdWxlcikge1xuICAgICAgICB0aGlzLmJ1ZmZlckR1cmF0aW9uID0gYnVmZmVyRHVyYXRpb247XG4gICAgICAgIHRoaXMuc2NoZWR1bGVyID0gc2NoZWR1bGVyO1xuICAgIH1cbiAgICBjYWxsKHN1YnNjcmliZXIsIHNvdXJjZSkge1xuICAgICAgICByZXR1cm4gc291cmNlLl9zdWJzY3JpYmUobmV3IEJ1ZmZlckZvclN1YnNjcmliZXIoc3Vic2NyaWJlciwgdGhpcy5idWZmZXJEdXJhdGlvbiwgdGhpcy5zY2hlZHVsZXIpKTtcbiAgICB9XG59XG5jbGFzcyBCdWZmZXJGb3JTdWJzY3JpYmVyIGV4dGVuZHMgU3Vic2NyaWJlciB7XG4gICAgY29uc3RydWN0b3IoZGVzdGluYXRpb24sIGJ1ZmZlckR1cmF0aW9uLCBzY2hlZHVsZXIpIHtcbiAgICAgICAgc3VwZXIoZGVzdGluYXRpb24pO1xuICAgICAgICB0aGlzLmJ1ZmZlckR1cmF0aW9uID0gYnVmZmVyRHVyYXRpb247XG4gICAgICAgIHRoaXMuc2NoZWR1bGVyID0gc2NoZWR1bGVyO1xuICAgICAgICB0aGlzLm9wZW4gPSBmYWxzZTtcbiAgICB9XG4gICAgX25leHQodmFsdWUpIHtcbiAgICAgICAgaWYgKCF0aGlzLm9wZW4pIHtcbiAgICAgICAgICAgIHRoaXMub3BlbkJ1ZmZlcigpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuYnVmZmVyLnB1c2godmFsdWUpO1xuICAgIH1cbiAgICBfY29tcGxldGUoKSB7XG4gICAgICAgIGNvbnN0IGJ1ZmZlciA9IHRoaXMuYnVmZmVyO1xuICAgICAgICBpZiAoYnVmZmVyKSB7XG4gICAgICAgICAgICB0aGlzLmRlc3RpbmF0aW9uLm5leHQoYnVmZmVyKTtcbiAgICAgICAgfVxuICAgICAgICBzdXBlci5fY29tcGxldGUoKTtcbiAgICB9XG4gICAgX3Vuc3Vic2NyaWJlKCkge1xuICAgICAgICB0aGlzLmJ1ZmZlciA9IG51bGw7XG4gICAgfVxuICAgIGNsb3NlQnVmZmVyKCkge1xuICAgICAgICB0aGlzLm9wZW4gPSBmYWxzZTtcbiAgICAgICAgY29uc3QgYnVmZmVyID0gdGhpcy5idWZmZXI7XG4gICAgICAgIGlmICh0aGlzLmJ1ZmZlcikge1xuICAgICAgICAgICAgdGhpcy5kZXN0aW5hdGlvbi5uZXh0KGJ1ZmZlcik7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5idWZmZXIgPSBudWxsO1xuICAgIH1cbiAgICBvcGVuQnVmZmVyKCkge1xuICAgICAgICBjb25zdCBzY2hlZHVsZSA9IHRoaXMuc2NoZWR1bGVyLnNjaGVkdWxlKCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlKHNjaGVkdWxlKTtcbiAgICAgICAgICAgIHRoaXMuY2xvc2VCdWZmZXIoKTtcbiAgICAgICAgfSwgdGhpcy5idWZmZXJEdXJhdGlvbik7XG4gICAgICAgIHRoaXMuYWRkKHNjaGVkdWxlKTtcbiAgICAgICAgdGhpcy5vcGVuID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5idWZmZXIgPSBbXTtcbiAgICB9XG59XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
