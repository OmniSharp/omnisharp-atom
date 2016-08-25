"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _omni = require("../server/omni");

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _tsDisposables = require("ts-disposables");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var filter = require("fuzzaldrin").filter;
function calcuateMovement(previous, current) {
    if (!current) return { reset: true, current: current, previous: null };
    var row = Math.abs(current.bufferPosition.row - previous.bufferPosition.row) > 0;
    var column = Math.abs(current.bufferPosition.column - previous.bufferPosition.column) > 3;
    return { reset: row || column || false, previous: previous, current: current };
}
var autoCompleteOptions = {
    WordToComplete: "",
    WantDocumentationForEveryCompletionResult: false,
    WantKind: true,
    WantSnippet: true,
    WantReturnType: true
};
function renderReturnType(returnType) {
    if (returnType === null) {
        return;
    }
    return "Returns: " + returnType;
}
function renderIcon(item) {
    return "<img height=\"16px\" width=\"16px\" src=\"atom://omnisharp-atom/styles/icons/autocomplete_" + item.Kind.toLowerCase() + "@3x.png\" />";
}

var CompletionProvider = function () {
    function CompletionProvider() {
        _classCallCheck(this, CompletionProvider);

        this._initialized = false;
        this.selector = ".source.omnisharp";
        this.disableForSelector = ".source.omnisharp .comment";
        this.inclusionPriority = 1;
        this.suggestionPriority = 10;
        this.excludeLowerPriority = false;
    }

    _createClass(CompletionProvider, [{
        key: "getSuggestions",
        value: function getSuggestions(options) {
            var _this = this;

            if (!this._initialized) this._setupSubscriptions();
            if (this.results && this.previous && calcuateMovement(this.previous, options).reset) {
                this.results = null;
            }
            if (this.results && options.prefix === "." || options.prefix && !_lodash2.default.trim(options.prefix) || !options.prefix || options.activatedManually) {
                this.results = null;
            }
            this.previous = options;
            var buffer = options.editor.getBuffer();
            var end = options.bufferPosition.column;
            var data = buffer.getLines()[options.bufferPosition.row].substring(0, end + 1);
            var lastCharacterTyped = data[end - 1];
            if (!/[A-Z_0-9.]+/i.test(lastCharacterTyped)) {
                return;
            }
            var search = options.prefix;
            if (search === ".") search = "";
            if (!this.results) this.results = _omni.Omni.request(function (solution) {
                return solution.autocomplete(_lodash2.default.clone(autoCompleteOptions));
            }).toPromise();
            var p = this.results;
            if (search) p = p.then(function (s) {
                return filter(s, search, { key: "CompletionText" });
            });
            return p.then(function (response) {
                return response.map(function (s) {
                    return _this._makeSuggestion(s);
                });
            });
        }
    }, {
        key: "onDidInsertSuggestion",
        value: function onDidInsertSuggestion(editor, triggerPosition, suggestion) {
            this.results = null;
        }
    }, {
        key: "dispose",
        value: function dispose() {
            if (this._disposable) this._disposable.dispose();
            this._disposable = null;
            this._initialized = false;
        }
    }, {
        key: "_setupSubscriptions",
        value: function _setupSubscriptions() {
            var _this2 = this;

            if (this._initialized) return;
            var disposable = this._disposable = new _tsDisposables.CompositeDisposable();
            disposable.add(atom.commands.onWillDispatch(function (event) {
                if (event.type === "autocomplete-plus:activate" || event.type === "autocomplete-plus:confirm" || event.type === "autocomplete-plus:cancel") {
                    _this2.results = null;
                }
            }));
            disposable.add(atom.config.observe("omnisharp-atom.useIcons", function (value) {
                _this2._useIcons = value;
            }));
            disposable.add(atom.config.observe("omnisharp-atom.useLeftLabelColumnForSuggestions", function (value) {
                _this2._useLeftLabelColumnForSuggestions = value;
            }));
            this._initialized = true;
        }
    }, {
        key: "_makeSuggestion",
        value: function _makeSuggestion(item) {
            var description = void 0,
                leftLabel = void 0,
                iconHTML = void 0,
                type = void 0;
            if (this._useLeftLabelColumnForSuggestions === true) {
                description = item.RequiredNamespaceImport;
                leftLabel = item.ReturnType;
            } else {
                description = renderReturnType(item.ReturnType);
                leftLabel = "";
            }
            if (this._useIcons === true) {
                iconHTML = renderIcon(item);
                type = item.Kind;
            } else {
                iconHTML = null;
                type = item.Kind.toLowerCase();
            }
            return {
                _search: item.CompletionText,
                snippet: item.Snippet,
                type: type,
                iconHTML: iconHTML,
                displayText: item.DisplayText,
                className: "autocomplete-omnisharp-atom",
                description: description,
                leftLabel: leftLabel
            };
        }
    }]);

    return CompletionProvider;
}();

module.exports = [new CompletionProvider()];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9zZXJ2aWNlcy9jb21wbGV0aW9uLXByb3ZpZGVyLmpzIiwibGliL3NlcnZpY2VzL2NvbXBsZXRpb24tcHJvdmlkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQUFBOztBQUNBOzs7O0FBQ0E7Ozs7OztBQ0VBLElBQU0sU0FBUyxRQUFRLFlBQVIsRUFBc0IsTUFBdEI7QUEyQmYsU0FBQSxnQkFBQSxDQUEwQixRQUExQixFQUFvRCxPQUFwRCxFQUEyRTtBQUN2RSxRQUFJLENBQUMsT0FBRCxFQUFVLE9BQU8sRUFBRSxPQUFPLElBQVAsRUFBYSxTQUFTLE9BQVQsRUFBa0IsVUFBVSxJQUFWLEVBQXhDLENBQWQ7QUFHQSxRQUFNLE1BQU0sS0FBSyxHQUFMLENBQVMsUUFBUSxjQUFSLENBQXVCLEdBQXZCLEdBQTZCLFNBQVMsY0FBVCxDQUF3QixHQUF4QixDQUF0QyxHQUFxRSxDQUFyRSxDQUoyRDtBQU12RSxRQUFNLFNBQVMsS0FBSyxHQUFMLENBQVMsUUFBUSxjQUFSLENBQXVCLE1BQXZCLEdBQWdDLFNBQVMsY0FBVCxDQUF3QixNQUF4QixDQUF6QyxHQUEyRSxDQUEzRSxDQU53RDtBQU92RSxXQUFPLEVBQUUsT0FBTyxPQUFPLE1BQVAsSUFBaUIsS0FBakIsRUFBd0IsVUFBVSxRQUFWLEVBQW9CLFNBQVMsT0FBVCxFQUE1RCxDQVB1RTtDQUEzRTtBQVVBLElBQU0sc0JBQWtEO0FBQ3BELG9CQUFnQixFQUFoQjtBQUNBLCtDQUEyQyxLQUEzQztBQUNBLGNBQVUsSUFBVjtBQUNBLGlCQUFhLElBQWI7QUFDQSxvQkFBZ0IsSUFBaEI7Q0FMRTtBQVFOLFNBQUEsZ0JBQUEsQ0FBMEIsVUFBMUIsRUFBNEM7QUFDeEMsUUFBSSxlQUFlLElBQWYsRUFBcUI7QUFDckIsZUFEcUI7S0FBekI7QUFHQSx5QkFBbUIsVUFBbkIsQ0FKd0M7Q0FBNUM7QUFPQSxTQUFBLFVBQUEsQ0FBb0IsSUFBcEIsRUFBcUQ7QUFFakQsMEdBQStGLEtBQUssSUFBTCxDQUFVLFdBQVYsbUJBQS9GLENBRmlEO0NBQXJEOztJQUtBO0FBQUEsa0NBQUE7OztBQUdZLGFBQUEsWUFBQSxHQUFlLEtBQWYsQ0FIWjtBQVdXLGFBQUEsUUFBQSxHQUFXLG1CQUFYLENBWFg7QUFZVyxhQUFBLGtCQUFBLEdBQXFCLDRCQUFyQixDQVpYO0FBYVcsYUFBQSxpQkFBQSxHQUFvQixDQUFwQixDQWJYO0FBY1csYUFBQSxrQkFBQSxHQUFxQixFQUFyQixDQWRYO0FBZVcsYUFBQSxvQkFBQSxHQUF1QixLQUF2QixDQWZYO0tBQUE7Ozs7dUNBaUIwQixTQUF1Qjs7O0FBQ3pDLGdCQUFJLENBQUMsS0FBSyxZQUFMLEVBQW1CLEtBQUssbUJBQUwsR0FBeEI7QUFFQSxnQkFBSSxLQUFLLE9BQUwsSUFBZ0IsS0FBSyxRQUFMLElBQWlCLGlCQUFpQixLQUFLLFFBQUwsRUFBZSxPQUFoQyxFQUF5QyxLQUF6QyxFQUFnRDtBQUNqRixxQkFBSyxPQUFMLEdBQWUsSUFBZixDQURpRjthQUFyRjtBQUlBLGdCQUFJLEtBQUssT0FBTCxJQUFnQixRQUFRLE1BQVIsS0FBbUIsR0FBbkIsSUFBMkIsUUFBUSxNQUFSLElBQWtCLENBQUMsaUJBQUUsSUFBRixDQUFPLFFBQVEsTUFBUixDQUFSLElBQTRCLENBQUMsUUFBUSxNQUFSLElBQWtCLFFBQVEsaUJBQVIsRUFBMkI7QUFDdkkscUJBQUssT0FBTCxHQUFlLElBQWYsQ0FEdUk7YUFBM0k7QUFJQSxpQkFBSyxRQUFMLEdBQWdCLE9BQWhCLENBWHlDO0FBYXpDLGdCQUFNLFNBQVMsUUFBUSxNQUFSLENBQWUsU0FBZixFQUFULENBYm1DO0FBY3pDLGdCQUFNLE1BQU0sUUFBUSxjQUFSLENBQXVCLE1BQXZCLENBZDZCO0FBZ0J6QyxnQkFBTSxPQUFPLE9BQU8sUUFBUCxHQUFrQixRQUFRLGNBQVIsQ0FBdUIsR0FBdkIsQ0FBbEIsQ0FBOEMsU0FBOUMsQ0FBd0QsQ0FBeEQsRUFBMkQsTUFBTSxDQUFOLENBQWxFLENBaEJtQztBQWlCekMsZ0JBQU0scUJBQXFCLEtBQUssTUFBTSxDQUFOLENBQTFCLENBakJtQztBQW1CekMsZ0JBQUksQ0FBQyxlQUFlLElBQWYsQ0FBb0Isa0JBQXBCLENBQUQsRUFBMEM7QUFDMUMsdUJBRDBDO2FBQTlDO0FBSUEsZ0JBQUksU0FBUyxRQUFRLE1BQVIsQ0F2QjRCO0FBd0J6QyxnQkFBSSxXQUFXLEdBQVgsRUFDQSxTQUFTLEVBQVQsQ0FESjtBQUdBLGdCQUFJLENBQUMsS0FBSyxPQUFMLEVBQWMsS0FBSyxPQUFMLEdBQWUsV0FBSyxPQUFMLENBQWE7dUJBQVksU0FBUyxZQUFULENBQXNCLGlCQUFFLEtBQUYsQ0FBUSxtQkFBUixDQUF0QjthQUFaLENBQWIsQ0FBOEUsU0FBOUUsRUFBZixDQUFuQjtBQUVBLGdCQUFJLElBQUksS0FBSyxPQUFMLENBN0JpQztBQThCekMsZ0JBQUksTUFBSixFQUNJLElBQUksRUFBRSxJQUFGLENBQU87dUJBQUssT0FBTyxDQUFQLEVBQVUsTUFBVixFQUFrQixFQUFFLEtBQUssZ0JBQUwsRUFBcEI7YUFBTCxDQUFYLENBREo7QUFHQSxtQkFBTyxFQUFFLElBQUYsQ0FBTzt1QkFBWSxTQUFTLEdBQVQsQ0FBYTsyQkFBSyxNQUFLLGVBQUwsQ0FBcUIsQ0FBckI7aUJBQUw7YUFBekIsQ0FBZCxDQWpDeUM7Ozs7OENBb0NoQixRQUF5QixpQkFBbUMsWUFBZTtBQUNwRyxpQkFBSyxPQUFMLEdBQWUsSUFBZixDQURvRzs7OztrQ0FJMUY7QUFDVixnQkFBSSxLQUFLLFdBQUwsRUFDQSxLQUFLLFdBQUwsQ0FBaUIsT0FBakIsR0FESjtBQUdBLGlCQUFLLFdBQUwsR0FBbUIsSUFBbkIsQ0FKVTtBQUtWLGlCQUFLLFlBQUwsR0FBb0IsS0FBcEIsQ0FMVTs7Ozs4Q0FRYTs7O0FBQ3ZCLGdCQUFJLEtBQUssWUFBTCxFQUFtQixPQUF2QjtBQUVBLGdCQUFNLGFBQWEsS0FBSyxXQUFMLEdBQW1CLHdDQUFuQixDQUhJO0FBT3ZCLHVCQUFXLEdBQVgsQ0FBZSxLQUFLLFFBQUwsQ0FBYyxjQUFkLENBQTZCLFVBQUMsS0FBRCxFQUFhO0FBQ3JELG9CQUFJLE1BQU0sSUFBTixLQUFlLDRCQUFmLElBQStDLE1BQU0sSUFBTixLQUFlLDJCQUFmLElBQThDLE1BQU0sSUFBTixLQUFlLDBCQUFmLEVBQTJDO0FBQ3hJLDJCQUFLLE9BQUwsR0FBZSxJQUFmLENBRHdJO2lCQUE1STthQUR3QyxDQUE1QyxFQVB1QjtBQWN2Qix1QkFBVyxHQUFYLENBQWUsS0FBSyxNQUFMLENBQVksT0FBWixDQUFvQix5QkFBcEIsRUFBK0MsVUFBQyxLQUFELEVBQU07QUFDaEUsdUJBQUssU0FBTCxHQUFpQixLQUFqQixDQURnRTthQUFOLENBQTlELEVBZHVCO0FBa0J2Qix1QkFBVyxHQUFYLENBQWUsS0FBSyxNQUFMLENBQVksT0FBWixDQUFvQixpREFBcEIsRUFBdUUsVUFBQyxLQUFELEVBQU07QUFDeEYsdUJBQUssaUNBQUwsR0FBeUMsS0FBekMsQ0FEd0Y7YUFBTixDQUF0RixFQWxCdUI7QUFzQnZCLGlCQUFLLFlBQUwsR0FBb0IsSUFBcEIsQ0F0QnVCOzs7O3dDQXlCSCxNQUFpQztBQUNyRCxnQkFBSSxvQkFBSjtnQkFBc0Isa0JBQXRCO2dCQUFzQyxpQkFBdEM7Z0JBQXFELGFBQXJELENBRHFEO0FBR3JELGdCQUFJLEtBQUssaUNBQUwsS0FBMkMsSUFBM0MsRUFBaUQ7QUFDakQsOEJBQWMsS0FBSyx1QkFBTCxDQURtQztBQUVqRCw0QkFBWSxLQUFLLFVBQUwsQ0FGcUM7YUFBckQsTUFHTztBQUNILDhCQUFjLGlCQUFpQixLQUFLLFVBQUwsQ0FBL0IsQ0FERztBQUVILDRCQUFZLEVBQVosQ0FGRzthQUhQO0FBUUEsZ0JBQUksS0FBSyxTQUFMLEtBQW1CLElBQW5CLEVBQXlCO0FBQ3pCLDJCQUFXLFdBQVcsSUFBWCxDQUFYLENBRHlCO0FBRXpCLHVCQUFPLEtBQUssSUFBTCxDQUZrQjthQUE3QixNQUdPO0FBQ0gsMkJBQVcsSUFBWCxDQURHO0FBRUgsdUJBQU8sS0FBSyxJQUFMLENBQVUsV0FBVixFQUFQLENBRkc7YUFIUDtBQVFBLG1CQUFPO0FBQ0gseUJBQVMsS0FBSyxjQUFMO0FBQ1QseUJBQVMsS0FBSyxPQUFMO0FBQ1Qsc0JBQU0sSUFBTjtBQUNBLDBCQUFVLFFBQVY7QUFDQSw2QkFBYSxLQUFLLFdBQUw7QUFDYiwyQkFBVyw2QkFBWDtBQUNBLDZCQUFhLFdBQWI7QUFDQSwyQkFBVyxTQUFYO2FBUkosQ0FuQnFEOzs7Ozs7O0FBZ0M3RCxPQUFPLE9BQVAsR0FBaUIsQ0FBQyxJQUFJLGtCQUFKLEVBQUQsQ0FBakIiLCJmaWxlIjoibGliL3NlcnZpY2VzL2NvbXBsZXRpb24tcHJvdmlkZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBPbW5pIH0gZnJvbSBcIi4uL3NlcnZlci9vbW5pXCI7XG5pbXBvcnQgXyBmcm9tIFwibG9kYXNoXCI7XG5pbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlIH0gZnJvbSBcInRzLWRpc3Bvc2FibGVzXCI7XG5jb25zdCBmaWx0ZXIgPSByZXF1aXJlKFwiZnV6emFsZHJpblwiKS5maWx0ZXI7XG5mdW5jdGlvbiBjYWxjdWF0ZU1vdmVtZW50KHByZXZpb3VzLCBjdXJyZW50KSB7XG4gICAgaWYgKCFjdXJyZW50KVxuICAgICAgICByZXR1cm4geyByZXNldDogdHJ1ZSwgY3VycmVudDogY3VycmVudCwgcHJldmlvdXM6IG51bGwgfTtcbiAgICBjb25zdCByb3cgPSBNYXRoLmFicyhjdXJyZW50LmJ1ZmZlclBvc2l0aW9uLnJvdyAtIHByZXZpb3VzLmJ1ZmZlclBvc2l0aW9uLnJvdykgPiAwO1xuICAgIGNvbnN0IGNvbHVtbiA9IE1hdGguYWJzKGN1cnJlbnQuYnVmZmVyUG9zaXRpb24uY29sdW1uIC0gcHJldmlvdXMuYnVmZmVyUG9zaXRpb24uY29sdW1uKSA+IDM7XG4gICAgcmV0dXJuIHsgcmVzZXQ6IHJvdyB8fCBjb2x1bW4gfHwgZmFsc2UsIHByZXZpb3VzOiBwcmV2aW91cywgY3VycmVudDogY3VycmVudCB9O1xufVxuY29uc3QgYXV0b0NvbXBsZXRlT3B0aW9ucyA9IHtcbiAgICBXb3JkVG9Db21wbGV0ZTogXCJcIixcbiAgICBXYW50RG9jdW1lbnRhdGlvbkZvckV2ZXJ5Q29tcGxldGlvblJlc3VsdDogZmFsc2UsXG4gICAgV2FudEtpbmQ6IHRydWUsXG4gICAgV2FudFNuaXBwZXQ6IHRydWUsXG4gICAgV2FudFJldHVyblR5cGU6IHRydWVcbn07XG5mdW5jdGlvbiByZW5kZXJSZXR1cm5UeXBlKHJldHVyblR5cGUpIHtcbiAgICBpZiAocmV0dXJuVHlwZSA9PT0gbnVsbCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHJldHVybiBgUmV0dXJuczogJHtyZXR1cm5UeXBlfWA7XG59XG5mdW5jdGlvbiByZW5kZXJJY29uKGl0ZW0pIHtcbiAgICByZXR1cm4gYDxpbWcgaGVpZ2h0PVwiMTZweFwiIHdpZHRoPVwiMTZweFwiIHNyYz1cImF0b206Ly9vbW5pc2hhcnAtYXRvbS9zdHlsZXMvaWNvbnMvYXV0b2NvbXBsZXRlXyR7aXRlbS5LaW5kLnRvTG93ZXJDYXNlKCl9QDN4LnBuZ1wiIC8+YDtcbn1cbmNsYXNzIENvbXBsZXRpb25Qcm92aWRlciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuX2luaXRpYWxpemVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMuc2VsZWN0b3IgPSBcIi5zb3VyY2Uub21uaXNoYXJwXCI7XG4gICAgICAgIHRoaXMuZGlzYWJsZUZvclNlbGVjdG9yID0gXCIuc291cmNlLm9tbmlzaGFycCAuY29tbWVudFwiO1xuICAgICAgICB0aGlzLmluY2x1c2lvblByaW9yaXR5ID0gMTtcbiAgICAgICAgdGhpcy5zdWdnZXN0aW9uUHJpb3JpdHkgPSAxMDtcbiAgICAgICAgdGhpcy5leGNsdWRlTG93ZXJQcmlvcml0eSA9IGZhbHNlO1xuICAgIH1cbiAgICBnZXRTdWdnZXN0aW9ucyhvcHRpb25zKSB7XG4gICAgICAgIGlmICghdGhpcy5faW5pdGlhbGl6ZWQpXG4gICAgICAgICAgICB0aGlzLl9zZXR1cFN1YnNjcmlwdGlvbnMoKTtcbiAgICAgICAgaWYgKHRoaXMucmVzdWx0cyAmJiB0aGlzLnByZXZpb3VzICYmIGNhbGN1YXRlTW92ZW1lbnQodGhpcy5wcmV2aW91cywgb3B0aW9ucykucmVzZXQpIHtcbiAgICAgICAgICAgIHRoaXMucmVzdWx0cyA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMucmVzdWx0cyAmJiBvcHRpb25zLnByZWZpeCA9PT0gXCIuXCIgfHwgKG9wdGlvbnMucHJlZml4ICYmICFfLnRyaW0ob3B0aW9ucy5wcmVmaXgpKSB8fCAhb3B0aW9ucy5wcmVmaXggfHwgb3B0aW9ucy5hY3RpdmF0ZWRNYW51YWxseSkge1xuICAgICAgICAgICAgdGhpcy5yZXN1bHRzID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnByZXZpb3VzID0gb3B0aW9ucztcbiAgICAgICAgY29uc3QgYnVmZmVyID0gb3B0aW9ucy5lZGl0b3IuZ2V0QnVmZmVyKCk7XG4gICAgICAgIGNvbnN0IGVuZCA9IG9wdGlvbnMuYnVmZmVyUG9zaXRpb24uY29sdW1uO1xuICAgICAgICBjb25zdCBkYXRhID0gYnVmZmVyLmdldExpbmVzKClbb3B0aW9ucy5idWZmZXJQb3NpdGlvbi5yb3ddLnN1YnN0cmluZygwLCBlbmQgKyAxKTtcbiAgICAgICAgY29uc3QgbGFzdENoYXJhY3RlclR5cGVkID0gZGF0YVtlbmQgLSAxXTtcbiAgICAgICAgaWYgKCEvW0EtWl8wLTkuXSsvaS50ZXN0KGxhc3RDaGFyYWN0ZXJUeXBlZCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBsZXQgc2VhcmNoID0gb3B0aW9ucy5wcmVmaXg7XG4gICAgICAgIGlmIChzZWFyY2ggPT09IFwiLlwiKVxuICAgICAgICAgICAgc2VhcmNoID0gXCJcIjtcbiAgICAgICAgaWYgKCF0aGlzLnJlc3VsdHMpXG4gICAgICAgICAgICB0aGlzLnJlc3VsdHMgPSBPbW5pLnJlcXVlc3Qoc29sdXRpb24gPT4gc29sdXRpb24uYXV0b2NvbXBsZXRlKF8uY2xvbmUoYXV0b0NvbXBsZXRlT3B0aW9ucykpKS50b1Byb21pc2UoKTtcbiAgICAgICAgbGV0IHAgPSB0aGlzLnJlc3VsdHM7XG4gICAgICAgIGlmIChzZWFyY2gpXG4gICAgICAgICAgICBwID0gcC50aGVuKHMgPT4gZmlsdGVyKHMsIHNlYXJjaCwgeyBrZXk6IFwiQ29tcGxldGlvblRleHRcIiB9KSk7XG4gICAgICAgIHJldHVybiBwLnRoZW4ocmVzcG9uc2UgPT4gcmVzcG9uc2UubWFwKHMgPT4gdGhpcy5fbWFrZVN1Z2dlc3Rpb24ocykpKTtcbiAgICB9XG4gICAgb25EaWRJbnNlcnRTdWdnZXN0aW9uKGVkaXRvciwgdHJpZ2dlclBvc2l0aW9uLCBzdWdnZXN0aW9uKSB7XG4gICAgICAgIHRoaXMucmVzdWx0cyA9IG51bGw7XG4gICAgfVxuICAgIGRpc3Bvc2UoKSB7XG4gICAgICAgIGlmICh0aGlzLl9kaXNwb3NhYmxlKVxuICAgICAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUgPSBudWxsO1xuICAgICAgICB0aGlzLl9pbml0aWFsaXplZCA9IGZhbHNlO1xuICAgIH1cbiAgICBfc2V0dXBTdWJzY3JpcHRpb25zKCkge1xuICAgICAgICBpZiAodGhpcy5faW5pdGlhbGl6ZWQpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNvbnN0IGRpc3Bvc2FibGUgPSB0aGlzLl9kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5vbldpbGxEaXNwYXRjaCgoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIGlmIChldmVudC50eXBlID09PSBcImF1dG9jb21wbGV0ZS1wbHVzOmFjdGl2YXRlXCIgfHwgZXZlbnQudHlwZSA9PT0gXCJhdXRvY29tcGxldGUtcGx1czpjb25maXJtXCIgfHwgZXZlbnQudHlwZSA9PT0gXCJhdXRvY29tcGxldGUtcGx1czpjYW5jZWxcIikge1xuICAgICAgICAgICAgICAgIHRoaXMucmVzdWx0cyA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pKTtcbiAgICAgICAgZGlzcG9zYWJsZS5hZGQoYXRvbS5jb25maWcub2JzZXJ2ZShcIm9tbmlzaGFycC1hdG9tLnVzZUljb25zXCIsICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5fdXNlSWNvbnMgPSB2YWx1ZTtcbiAgICAgICAgfSkpO1xuICAgICAgICBkaXNwb3NhYmxlLmFkZChhdG9tLmNvbmZpZy5vYnNlcnZlKFwib21uaXNoYXJwLWF0b20udXNlTGVmdExhYmVsQ29sdW1uRm9yU3VnZ2VzdGlvbnNcIiwgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLl91c2VMZWZ0TGFiZWxDb2x1bW5Gb3JTdWdnZXN0aW9ucyA9IHZhbHVlO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuX2luaXRpYWxpemVkID0gdHJ1ZTtcbiAgICB9XG4gICAgX21ha2VTdWdnZXN0aW9uKGl0ZW0pIHtcbiAgICAgICAgbGV0IGRlc2NyaXB0aW9uLCBsZWZ0TGFiZWwsIGljb25IVE1MLCB0eXBlO1xuICAgICAgICBpZiAodGhpcy5fdXNlTGVmdExhYmVsQ29sdW1uRm9yU3VnZ2VzdGlvbnMgPT09IHRydWUpIHtcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uID0gaXRlbS5SZXF1aXJlZE5hbWVzcGFjZUltcG9ydDtcbiAgICAgICAgICAgIGxlZnRMYWJlbCA9IGl0ZW0uUmV0dXJuVHlwZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uID0gcmVuZGVyUmV0dXJuVHlwZShpdGVtLlJldHVyblR5cGUpO1xuICAgICAgICAgICAgbGVmdExhYmVsID0gXCJcIjtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5fdXNlSWNvbnMgPT09IHRydWUpIHtcbiAgICAgICAgICAgIGljb25IVE1MID0gcmVuZGVySWNvbihpdGVtKTtcbiAgICAgICAgICAgIHR5cGUgPSBpdGVtLktpbmQ7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBpY29uSFRNTCA9IG51bGw7XG4gICAgICAgICAgICB0eXBlID0gaXRlbS5LaW5kLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIF9zZWFyY2g6IGl0ZW0uQ29tcGxldGlvblRleHQsXG4gICAgICAgICAgICBzbmlwcGV0OiBpdGVtLlNuaXBwZXQsXG4gICAgICAgICAgICB0eXBlOiB0eXBlLFxuICAgICAgICAgICAgaWNvbkhUTUw6IGljb25IVE1MLFxuICAgICAgICAgICAgZGlzcGxheVRleHQ6IGl0ZW0uRGlzcGxheVRleHQsXG4gICAgICAgICAgICBjbGFzc05hbWU6IFwiYXV0b2NvbXBsZXRlLW9tbmlzaGFycC1hdG9tXCIsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogZGVzY3JpcHRpb24sXG4gICAgICAgICAgICBsZWZ0TGFiZWw6IGxlZnRMYWJlbCxcbiAgICAgICAgfTtcbiAgICB9XG59XG5tb2R1bGUuZXhwb3J0cyA9IFtuZXcgQ29tcGxldGlvblByb3ZpZGVyKCldO1xuIiwiaW1wb3J0IHtPbW5pfSBmcm9tIFwiLi4vc2VydmVyL29tbmlcIjtcclxuaW1wb3J0IHtNb2RlbHN9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XHJcbmltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcclxuaW1wb3J0IHtDb21wb3NpdGVEaXNwb3NhYmxlLCBJRGlzcG9zYWJsZX0gZnJvbSBcInRzLWRpc3Bvc2FibGVzXCI7XHJcbmNvbnN0IGZpbHRlciA9IHJlcXVpcmUoXCJmdXp6YWxkcmluXCIpLmZpbHRlcjtcclxuXHJcbmludGVyZmFjZSBSZXF1ZXN0T3B0aW9ucyB7XHJcbiAgICBlZGl0b3I6IEF0b20uVGV4dEVkaXRvcjtcclxuICAgIGJ1ZmZlclBvc2l0aW9uOiBUZXh0QnVmZmVyLlBvaW50OyAvLyB0aGUgcG9zaXRpb24gb2YgdGhlIGN1cnNvclxyXG4gICAgcHJlZml4OiBzdHJpbmc7XHJcbiAgICBzY29wZURlc2NyaXB0b3I6IHsgc2NvcGVzOiBzdHJpbmdbXSB9O1xyXG4gICAgYWN0aXZhdGVkTWFudWFsbHk6IGJvb2xlYW47XHJcbn1cclxuXHJcbmludGVyZmFjZSBTdWdnZXN0aW9uIHtcclxuICAgIC8vRWl0aGVyIHRleHQgb3Igc25pcHBldCBpcyByZXF1aXJlZFxyXG4gICAgdGV4dD86IHN0cmluZztcclxuICAgIHNuaXBwZXQ/OiBzdHJpbmc7XHJcbiAgICBkaXNwbGF5VGV4dD86IHN0cmluZztcclxuICAgIHJlcGxhY2VtZW50UHJlZml4Pzogc3RyaW5nO1xyXG4gICAgdHlwZTogc3RyaW5nO1xyXG4gICAgbGVmdExhYmVsPzogc3RyaW5nO1xyXG4gICAgbGVmdExhYmVsSFRNTD86IHN0cmluZztcclxuICAgIHJpZ2h0TGFiZWw/OiBzdHJpbmc7XHJcbiAgICByaWdodExhYmVsSFRNTD86IHN0cmluZztcclxuICAgIGljb25IVE1MPzogc3RyaW5nO1xyXG4gICAgZGVzY3JpcHRpb24/OiBzdHJpbmc7XHJcbiAgICBkZXNjcmlwdGlvbk1vcmVVUkw/OiBzdHJpbmc7XHJcbiAgICBjbGFzc05hbWU/OiBzdHJpbmc7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNhbGN1YXRlTW92ZW1lbnQocHJldmlvdXM6IFJlcXVlc3RPcHRpb25zLCBjdXJyZW50OiBSZXF1ZXN0T3B0aW9ucykge1xyXG4gICAgaWYgKCFjdXJyZW50KSByZXR1cm4geyByZXNldDogdHJ1ZSwgY3VycmVudDogY3VycmVudCwgcHJldmlvdXM6IG51bGwgfTtcclxuICAgIC8vIElmIHRoZSByb3cgY2hhbmdlcyB3ZSBtb3ZlZCBsaW5lcywgd2Ugc2hvdWxkIHJlZmV0Y2ggdGhlIGNvbXBsZXRpb25zXHJcbiAgICAvLyAoSXMgaXQgcG9zc2libGUgaXQgd2lsbCBiZSB0aGUgc2FtZSBzZXQ/KVxyXG4gICAgY29uc3Qgcm93ID0gTWF0aC5hYnMoY3VycmVudC5idWZmZXJQb3NpdGlvbi5yb3cgLSBwcmV2aW91cy5idWZmZXJQb3NpdGlvbi5yb3cpID4gMDtcclxuICAgIC8vIElmIHRoZSBjb2x1bW4ganVtcGVkLCBsZXRzIGdldCB0aGVtIGFnYWluIHRvIGJlIHNhZmUuXHJcbiAgICBjb25zdCBjb2x1bW4gPSBNYXRoLmFicyhjdXJyZW50LmJ1ZmZlclBvc2l0aW9uLmNvbHVtbiAtIHByZXZpb3VzLmJ1ZmZlclBvc2l0aW9uLmNvbHVtbikgPiAzO1xyXG4gICAgcmV0dXJuIHsgcmVzZXQ6IHJvdyB8fCBjb2x1bW4gfHwgZmFsc2UsIHByZXZpb3VzOiBwcmV2aW91cywgY3VycmVudDogY3VycmVudCB9O1xyXG59XHJcblxyXG5jb25zdCBhdXRvQ29tcGxldGVPcHRpb25zID0gPE1vZGVscy5BdXRvQ29tcGxldGVSZXF1ZXN0PntcclxuICAgIFdvcmRUb0NvbXBsZXRlOiBcIlwiLFxyXG4gICAgV2FudERvY3VtZW50YXRpb25Gb3JFdmVyeUNvbXBsZXRpb25SZXN1bHQ6IGZhbHNlLFxyXG4gICAgV2FudEtpbmQ6IHRydWUsXHJcbiAgICBXYW50U25pcHBldDogdHJ1ZSxcclxuICAgIFdhbnRSZXR1cm5UeXBlOiB0cnVlXHJcbn07XHJcblxyXG5mdW5jdGlvbiByZW5kZXJSZXR1cm5UeXBlKHJldHVyblR5cGU6IHN0cmluZykge1xyXG4gICAgaWYgKHJldHVyblR5cGUgPT09IG51bGwpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICByZXR1cm4gYFJldHVybnM6ICR7cmV0dXJuVHlwZX1gO1xyXG59XHJcblxyXG5mdW5jdGlvbiByZW5kZXJJY29uKGl0ZW06IE1vZGVscy5BdXRvQ29tcGxldGVSZXNwb25zZSkge1xyXG4gICAgLy8gdG9kbzogbW92ZSBhZGRpdGlvbmFsIHN0eWxpbmcgdG8gY3NzXHJcbiAgICByZXR1cm4gYDxpbWcgaGVpZ2h0PVwiMTZweFwiIHdpZHRoPVwiMTZweFwiIHNyYz1cImF0b206Ly9vbW5pc2hhcnAtYXRvbS9zdHlsZXMvaWNvbnMvYXV0b2NvbXBsZXRlXyR7aXRlbS5LaW5kLnRvTG93ZXJDYXNlKCl9QDN4LnBuZ1wiIC8+YDtcclxufVxyXG5cclxuY2xhc3MgQ29tcGxldGlvblByb3ZpZGVyIGltcGxlbWVudHMgSURpc3Bvc2FibGUge1xyXG4gICAgcHJpdmF0ZSBfZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxuXHJcbiAgICBwcml2YXRlIF9pbml0aWFsaXplZCA9IGZhbHNlO1xyXG5cclxuICAgIHByaXZhdGUgX3VzZUljb25zOiBib29sZWFuO1xyXG4gICAgcHJpdmF0ZSBfdXNlTGVmdExhYmVsQ29sdW1uRm9yU3VnZ2VzdGlvbnM6IGJvb2xlYW47XHJcblxyXG4gICAgcHJpdmF0ZSBwcmV2aW91czogUmVxdWVzdE9wdGlvbnM7XHJcbiAgICBwcml2YXRlIHJlc3VsdHM6IFByb21pc2U8TW9kZWxzLkF1dG9Db21wbGV0ZVJlc3BvbnNlW10+O1xyXG5cclxuICAgIHB1YmxpYyBzZWxlY3RvciA9IFwiLnNvdXJjZS5vbW5pc2hhcnBcIjtcclxuICAgIHB1YmxpYyBkaXNhYmxlRm9yU2VsZWN0b3IgPSBcIi5zb3VyY2Uub21uaXNoYXJwIC5jb21tZW50XCI7XHJcbiAgICBwdWJsaWMgaW5jbHVzaW9uUHJpb3JpdHkgPSAxO1xyXG4gICAgcHVibGljIHN1Z2dlc3Rpb25Qcmlvcml0eSA9IDEwO1xyXG4gICAgcHVibGljIGV4Y2x1ZGVMb3dlclByaW9yaXR5ID0gZmFsc2U7XHJcblxyXG4gICAgcHVibGljIGdldFN1Z2dlc3Rpb25zKG9wdGlvbnM6IFJlcXVlc3RPcHRpb25zKTogUHJvbWlzZTxTdWdnZXN0aW9uW10+IHtcclxuICAgICAgICBpZiAoIXRoaXMuX2luaXRpYWxpemVkKSB0aGlzLl9zZXR1cFN1YnNjcmlwdGlvbnMoKTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMucmVzdWx0cyAmJiB0aGlzLnByZXZpb3VzICYmIGNhbGN1YXRlTW92ZW1lbnQodGhpcy5wcmV2aW91cywgb3B0aW9ucykucmVzZXQpIHtcclxuICAgICAgICAgICAgdGhpcy5yZXN1bHRzID0gbnVsbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLnJlc3VsdHMgJiYgb3B0aW9ucy5wcmVmaXggPT09IFwiLlwiIHx8IChvcHRpb25zLnByZWZpeCAmJiAhXy50cmltKG9wdGlvbnMucHJlZml4KSkgfHwgIW9wdGlvbnMucHJlZml4IHx8IG9wdGlvbnMuYWN0aXZhdGVkTWFudWFsbHkpIHtcclxuICAgICAgICAgICAgdGhpcy5yZXN1bHRzID0gbnVsbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMucHJldmlvdXMgPSBvcHRpb25zO1xyXG5cclxuICAgICAgICBjb25zdCBidWZmZXIgPSBvcHRpb25zLmVkaXRvci5nZXRCdWZmZXIoKTtcclxuICAgICAgICBjb25zdCBlbmQgPSBvcHRpb25zLmJ1ZmZlclBvc2l0aW9uLmNvbHVtbjtcclxuXHJcbiAgICAgICAgY29uc3QgZGF0YSA9IGJ1ZmZlci5nZXRMaW5lcygpW29wdGlvbnMuYnVmZmVyUG9zaXRpb24ucm93XS5zdWJzdHJpbmcoMCwgZW5kICsgMSk7XHJcbiAgICAgICAgY29uc3QgbGFzdENoYXJhY3RlclR5cGVkID0gZGF0YVtlbmQgLSAxXTtcclxuXHJcbiAgICAgICAgaWYgKCEvW0EtWl8wLTkuXSsvaS50ZXN0KGxhc3RDaGFyYWN0ZXJUeXBlZCkpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IHNlYXJjaCA9IG9wdGlvbnMucHJlZml4O1xyXG4gICAgICAgIGlmIChzZWFyY2ggPT09IFwiLlwiKVxyXG4gICAgICAgICAgICBzZWFyY2ggPSBcIlwiO1xyXG5cclxuICAgICAgICBpZiAoIXRoaXMucmVzdWx0cykgdGhpcy5yZXN1bHRzID0gT21uaS5yZXF1ZXN0KHNvbHV0aW9uID0+IHNvbHV0aW9uLmF1dG9jb21wbGV0ZShfLmNsb25lKGF1dG9Db21wbGV0ZU9wdGlvbnMpKSkudG9Qcm9taXNlKCk7XHJcblxyXG4gICAgICAgIGxldCBwID0gdGhpcy5yZXN1bHRzO1xyXG4gICAgICAgIGlmIChzZWFyY2gpXHJcbiAgICAgICAgICAgIHAgPSBwLnRoZW4ocyA9PiBmaWx0ZXIocywgc2VhcmNoLCB7IGtleTogXCJDb21wbGV0aW9uVGV4dFwiIH0pKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHAudGhlbihyZXNwb25zZSA9PiByZXNwb25zZS5tYXAocyA9PiB0aGlzLl9tYWtlU3VnZ2VzdGlvbihzKSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBvbkRpZEluc2VydFN1Z2dlc3Rpb24oZWRpdG9yOiBBdG9tLlRleHRFZGl0b3IsIHRyaWdnZXJQb3NpdGlvbjogVGV4dEJ1ZmZlci5Qb2ludCwgc3VnZ2VzdGlvbjogYW55KSB7XHJcbiAgICAgICAgdGhpcy5yZXN1bHRzID0gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGlzcG9zZSgpIHtcclxuICAgICAgICBpZiAodGhpcy5fZGlzcG9zYWJsZSlcclxuICAgICAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcblxyXG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUgPSBudWxsO1xyXG4gICAgICAgIHRoaXMuX2luaXRpYWxpemVkID0gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfc2V0dXBTdWJzY3JpcHRpb25zKCkge1xyXG4gICAgICAgIGlmICh0aGlzLl9pbml0aWFsaXplZCkgcmV0dXJuO1xyXG5cclxuICAgICAgICBjb25zdCBkaXNwb3NhYmxlID0gdGhpcy5fZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcblxyXG4gICAgICAgIC8vIENsZWFyIHdoZW4gYXV0by1jb21wbGV0ZSBpcyBvcGVuaW5nLlxyXG4gICAgICAgIC8vIFRPRE86IFVwZGF0ZSBhdG9tIHR5cGluZ3NcclxuICAgICAgICBkaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLm9uV2lsbERpc3BhdGNoKChldmVudDogRXZlbnQpID0+IHtcclxuICAgICAgICAgICAgaWYgKGV2ZW50LnR5cGUgPT09IFwiYXV0b2NvbXBsZXRlLXBsdXM6YWN0aXZhdGVcIiB8fCBldmVudC50eXBlID09PSBcImF1dG9jb21wbGV0ZS1wbHVzOmNvbmZpcm1cIiB8fCBldmVudC50eXBlID09PSBcImF1dG9jb21wbGV0ZS1wbHVzOmNhbmNlbFwiKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlc3VsdHMgPSBudWxsO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICAvLyBUT0RPOiBEaXNwb3NlIG9mIHRoZXNlIHdoZW4gbm90IG5lZWRlZFxyXG4gICAgICAgIGRpc3Bvc2FibGUuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoXCJvbW5pc2hhcnAtYXRvbS51c2VJY29uc1wiLCAodmFsdWUpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5fdXNlSWNvbnMgPSB2YWx1ZTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIGRpc3Bvc2FibGUuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoXCJvbW5pc2hhcnAtYXRvbS51c2VMZWZ0TGFiZWxDb2x1bW5Gb3JTdWdnZXN0aW9uc1wiLCAodmFsdWUpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5fdXNlTGVmdExhYmVsQ29sdW1uRm9yU3VnZ2VzdGlvbnMgPSB2YWx1ZTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuX2luaXRpYWxpemVkID0gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9tYWtlU3VnZ2VzdGlvbihpdGVtOiBNb2RlbHMuQXV0b0NvbXBsZXRlUmVzcG9uc2UpIHtcclxuICAgICAgICBsZXQgZGVzY3JpcHRpb246IGFueSwgbGVmdExhYmVsOiBhbnksIGljb25IVE1MOiBhbnksIHR5cGU6IGFueTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX3VzZUxlZnRMYWJlbENvbHVtbkZvclN1Z2dlc3Rpb25zID09PSB0cnVlKSB7XHJcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uID0gaXRlbS5SZXF1aXJlZE5hbWVzcGFjZUltcG9ydDtcclxuICAgICAgICAgICAgbGVmdExhYmVsID0gaXRlbS5SZXR1cm5UeXBlO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uID0gcmVuZGVyUmV0dXJuVHlwZShpdGVtLlJldHVyblR5cGUpO1xyXG4gICAgICAgICAgICBsZWZ0TGFiZWwgPSBcIlwiO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX3VzZUljb25zID09PSB0cnVlKSB7XHJcbiAgICAgICAgICAgIGljb25IVE1MID0gcmVuZGVySWNvbihpdGVtKTtcclxuICAgICAgICAgICAgdHlwZSA9IGl0ZW0uS2luZDtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBpY29uSFRNTCA9IG51bGw7XHJcbiAgICAgICAgICAgIHR5cGUgPSBpdGVtLktpbmQudG9Mb3dlckNhc2UoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIF9zZWFyY2g6IGl0ZW0uQ29tcGxldGlvblRleHQsXHJcbiAgICAgICAgICAgIHNuaXBwZXQ6IGl0ZW0uU25pcHBldCxcclxuICAgICAgICAgICAgdHlwZTogdHlwZSxcclxuICAgICAgICAgICAgaWNvbkhUTUw6IGljb25IVE1MLFxyXG4gICAgICAgICAgICBkaXNwbGF5VGV4dDogaXRlbS5EaXNwbGF5VGV4dCxcclxuICAgICAgICAgICAgY2xhc3NOYW1lOiBcImF1dG9jb21wbGV0ZS1vbW5pc2hhcnAtYXRvbVwiLFxyXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogZGVzY3JpcHRpb24sXHJcbiAgICAgICAgICAgIGxlZnRMYWJlbDogbGVmdExhYmVsLFxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gW25ldyBDb21wbGV0aW9uUHJvdmlkZXIoKV07XHJcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
