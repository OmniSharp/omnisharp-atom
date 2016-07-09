"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _omni = require("../server/omni");

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _omnisharpClient = require("omnisharp-client");

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
            var disposable = this._disposable = new _omnisharpClient.CompositeDisposable();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9zZXJ2aWNlcy9jb21wbGV0aW9uLXByb3ZpZGVyLmpzIiwibGliL3NlcnZpY2VzL2NvbXBsZXRpb24tcHJvdmlkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQUFBOztBQUNBOzs7O0FBQ0E7Ozs7OztBQ0VBLElBQU0sU0FBUyxRQUFRLFlBQVIsRUFBc0IsTUFBckM7QUEyQkEsU0FBQSxnQkFBQSxDQUEwQixRQUExQixFQUFvRCxPQUFwRCxFQUEyRTtBQUN2RSxRQUFJLENBQUMsT0FBTCxFQUFjLE9BQU8sRUFBRSxPQUFPLElBQVQsRUFBZSxTQUFTLE9BQXhCLEVBQWlDLFVBQVUsSUFBM0MsRUFBUDtBQUdkLFFBQU0sTUFBTSxLQUFLLEdBQUwsQ0FBUyxRQUFRLGNBQVIsQ0FBdUIsR0FBdkIsR0FBNkIsU0FBUyxjQUFULENBQXdCLEdBQTlELElBQXFFLENBQWpGO0FBRUEsUUFBTSxTQUFTLEtBQUssR0FBTCxDQUFTLFFBQVEsY0FBUixDQUF1QixNQUF2QixHQUFnQyxTQUFTLGNBQVQsQ0FBd0IsTUFBakUsSUFBMkUsQ0FBMUY7QUFDQSxXQUFPLEVBQUUsT0FBTyxPQUFPLE1BQVAsSUFBaUIsS0FBMUIsRUFBaUMsVUFBVSxRQUEzQyxFQUFxRCxTQUFTLE9BQTlELEVBQVA7QUFDSDtBQUVELElBQU0sc0JBQWtEO0FBQ3BELG9CQUFnQixFQURvQztBQUVwRCwrQ0FBMkMsS0FGUztBQUdwRCxjQUFVLElBSDBDO0FBSXBELGlCQUFhLElBSnVDO0FBS3BELG9CQUFnQjtBQUxvQyxDQUF4RDtBQVFBLFNBQUEsZ0JBQUEsQ0FBMEIsVUFBMUIsRUFBNEM7QUFDeEMsUUFBSSxlQUFlLElBQW5CLEVBQXlCO0FBQ3JCO0FBQ0g7QUFDRCx5QkFBbUIsVUFBbkI7QUFDSDtBQUVELFNBQUEsVUFBQSxDQUFvQixJQUFwQixFQUFxRDtBQUVqRCwwR0FBK0YsS0FBSyxJQUFMLENBQVUsV0FBVixFQUEvRjtBQUNIOztJQUVELGtCO0FBQUEsa0NBQUE7QUFB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IjoibGliL3NlcnZpY2VzL2NvbXBsZXRpb24tcHJvdmlkZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBPbW5pIH0gZnJvbSBcIi4uL3NlcnZlci9vbW5pXCI7XG5pbXBvcnQgXyBmcm9tIFwibG9kYXNoXCI7XG5pbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlIH0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcbmNvbnN0IGZpbHRlciA9IHJlcXVpcmUoXCJmdXp6YWxkcmluXCIpLmZpbHRlcjtcbmZ1bmN0aW9uIGNhbGN1YXRlTW92ZW1lbnQocHJldmlvdXMsIGN1cnJlbnQpIHtcbiAgICBpZiAoIWN1cnJlbnQpXG4gICAgICAgIHJldHVybiB7IHJlc2V0OiB0cnVlLCBjdXJyZW50OiBjdXJyZW50LCBwcmV2aW91czogbnVsbCB9O1xuICAgIGNvbnN0IHJvdyA9IE1hdGguYWJzKGN1cnJlbnQuYnVmZmVyUG9zaXRpb24ucm93IC0gcHJldmlvdXMuYnVmZmVyUG9zaXRpb24ucm93KSA+IDA7XG4gICAgY29uc3QgY29sdW1uID0gTWF0aC5hYnMoY3VycmVudC5idWZmZXJQb3NpdGlvbi5jb2x1bW4gLSBwcmV2aW91cy5idWZmZXJQb3NpdGlvbi5jb2x1bW4pID4gMztcbiAgICByZXR1cm4geyByZXNldDogcm93IHx8IGNvbHVtbiB8fCBmYWxzZSwgcHJldmlvdXM6IHByZXZpb3VzLCBjdXJyZW50OiBjdXJyZW50IH07XG59XG5jb25zdCBhdXRvQ29tcGxldGVPcHRpb25zID0ge1xuICAgIFdvcmRUb0NvbXBsZXRlOiBcIlwiLFxuICAgIFdhbnREb2N1bWVudGF0aW9uRm9yRXZlcnlDb21wbGV0aW9uUmVzdWx0OiBmYWxzZSxcbiAgICBXYW50S2luZDogdHJ1ZSxcbiAgICBXYW50U25pcHBldDogdHJ1ZSxcbiAgICBXYW50UmV0dXJuVHlwZTogdHJ1ZVxufTtcbmZ1bmN0aW9uIHJlbmRlclJldHVyblR5cGUocmV0dXJuVHlwZSkge1xuICAgIGlmIChyZXR1cm5UeXBlID09PSBudWxsKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgcmV0dXJuIGBSZXR1cm5zOiAke3JldHVyblR5cGV9YDtcbn1cbmZ1bmN0aW9uIHJlbmRlckljb24oaXRlbSkge1xuICAgIHJldHVybiBgPGltZyBoZWlnaHQ9XCIxNnB4XCIgd2lkdGg9XCIxNnB4XCIgc3JjPVwiYXRvbTovL29tbmlzaGFycC1hdG9tL3N0eWxlcy9pY29ucy9hdXRvY29tcGxldGVfJHtpdGVtLktpbmQudG9Mb3dlckNhc2UoKX1AM3gucG5nXCIgLz5gO1xufVxuY2xhc3MgQ29tcGxldGlvblByb3ZpZGVyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5faW5pdGlhbGl6ZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5zZWxlY3RvciA9IFwiLnNvdXJjZS5vbW5pc2hhcnBcIjtcbiAgICAgICAgdGhpcy5kaXNhYmxlRm9yU2VsZWN0b3IgPSBcIi5zb3VyY2Uub21uaXNoYXJwIC5jb21tZW50XCI7XG4gICAgICAgIHRoaXMuaW5jbHVzaW9uUHJpb3JpdHkgPSAxO1xuICAgICAgICB0aGlzLnN1Z2dlc3Rpb25Qcmlvcml0eSA9IDEwO1xuICAgICAgICB0aGlzLmV4Y2x1ZGVMb3dlclByaW9yaXR5ID0gZmFsc2U7XG4gICAgfVxuICAgIGdldFN1Z2dlc3Rpb25zKG9wdGlvbnMpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9pbml0aWFsaXplZClcbiAgICAgICAgICAgIHRoaXMuX3NldHVwU3Vic2NyaXB0aW9ucygpO1xuICAgICAgICBpZiAodGhpcy5yZXN1bHRzICYmIHRoaXMucHJldmlvdXMgJiYgY2FsY3VhdGVNb3ZlbWVudCh0aGlzLnByZXZpb3VzLCBvcHRpb25zKS5yZXNldCkge1xuICAgICAgICAgICAgdGhpcy5yZXN1bHRzID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5yZXN1bHRzICYmIG9wdGlvbnMucHJlZml4ID09PSBcIi5cIiB8fCAob3B0aW9ucy5wcmVmaXggJiYgIV8udHJpbShvcHRpb25zLnByZWZpeCkpIHx8ICFvcHRpb25zLnByZWZpeCB8fCBvcHRpb25zLmFjdGl2YXRlZE1hbnVhbGx5KSB7XG4gICAgICAgICAgICB0aGlzLnJlc3VsdHMgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucHJldmlvdXMgPSBvcHRpb25zO1xuICAgICAgICBjb25zdCBidWZmZXIgPSBvcHRpb25zLmVkaXRvci5nZXRCdWZmZXIoKTtcbiAgICAgICAgY29uc3QgZW5kID0gb3B0aW9ucy5idWZmZXJQb3NpdGlvbi5jb2x1bW47XG4gICAgICAgIGNvbnN0IGRhdGEgPSBidWZmZXIuZ2V0TGluZXMoKVtvcHRpb25zLmJ1ZmZlclBvc2l0aW9uLnJvd10uc3Vic3RyaW5nKDAsIGVuZCArIDEpO1xuICAgICAgICBjb25zdCBsYXN0Q2hhcmFjdGVyVHlwZWQgPSBkYXRhW2VuZCAtIDFdO1xuICAgICAgICBpZiAoIS9bQS1aXzAtOS5dKy9pLnRlc3QobGFzdENoYXJhY3RlclR5cGVkKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGxldCBzZWFyY2ggPSBvcHRpb25zLnByZWZpeDtcbiAgICAgICAgaWYgKHNlYXJjaCA9PT0gXCIuXCIpXG4gICAgICAgICAgICBzZWFyY2ggPSBcIlwiO1xuICAgICAgICBpZiAoIXRoaXMucmVzdWx0cylcbiAgICAgICAgICAgIHRoaXMucmVzdWx0cyA9IE9tbmkucmVxdWVzdChzb2x1dGlvbiA9PiBzb2x1dGlvbi5hdXRvY29tcGxldGUoXy5jbG9uZShhdXRvQ29tcGxldGVPcHRpb25zKSkpLnRvUHJvbWlzZSgpO1xuICAgICAgICBsZXQgcCA9IHRoaXMucmVzdWx0cztcbiAgICAgICAgaWYgKHNlYXJjaClcbiAgICAgICAgICAgIHAgPSBwLnRoZW4ocyA9PiBmaWx0ZXIocywgc2VhcmNoLCB7IGtleTogXCJDb21wbGV0aW9uVGV4dFwiIH0pKTtcbiAgICAgICAgcmV0dXJuIHAudGhlbihyZXNwb25zZSA9PiByZXNwb25zZS5tYXAocyA9PiB0aGlzLl9tYWtlU3VnZ2VzdGlvbihzKSkpO1xuICAgIH1cbiAgICBvbkRpZEluc2VydFN1Z2dlc3Rpb24oZWRpdG9yLCB0cmlnZ2VyUG9zaXRpb24sIHN1Z2dlc3Rpb24pIHtcbiAgICAgICAgdGhpcy5yZXN1bHRzID0gbnVsbDtcbiAgICB9XG4gICAgZGlzcG9zZSgpIHtcbiAgICAgICAgaWYgKHRoaXMuX2Rpc3Bvc2FibGUpXG4gICAgICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZSA9IG51bGw7XG4gICAgICAgIHRoaXMuX2luaXRpYWxpemVkID0gZmFsc2U7XG4gICAgfVxuICAgIF9zZXR1cFN1YnNjcmlwdGlvbnMoKSB7XG4gICAgICAgIGlmICh0aGlzLl9pbml0aWFsaXplZClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3QgZGlzcG9zYWJsZSA9IHRoaXMuX2Rpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICBkaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLm9uV2lsbERpc3BhdGNoKChldmVudCkgPT4ge1xuICAgICAgICAgICAgaWYgKGV2ZW50LnR5cGUgPT09IFwiYXV0b2NvbXBsZXRlLXBsdXM6YWN0aXZhdGVcIiB8fCBldmVudC50eXBlID09PSBcImF1dG9jb21wbGV0ZS1wbHVzOmNvbmZpcm1cIiB8fCBldmVudC50eXBlID09PSBcImF1dG9jb21wbGV0ZS1wbHVzOmNhbmNlbFwiKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZXN1bHRzID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSkpO1xuICAgICAgICBkaXNwb3NhYmxlLmFkZChhdG9tLmNvbmZpZy5vYnNlcnZlKFwib21uaXNoYXJwLWF0b20udXNlSWNvbnNcIiwgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLl91c2VJY29ucyA9IHZhbHVlO1xuICAgICAgICB9KSk7XG4gICAgICAgIGRpc3Bvc2FibGUuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoXCJvbW5pc2hhcnAtYXRvbS51c2VMZWZ0TGFiZWxDb2x1bW5Gb3JTdWdnZXN0aW9uc1wiLCAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIHRoaXMuX3VzZUxlZnRMYWJlbENvbHVtbkZvclN1Z2dlc3Rpb25zID0gdmFsdWU7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5faW5pdGlhbGl6ZWQgPSB0cnVlO1xuICAgIH1cbiAgICBfbWFrZVN1Z2dlc3Rpb24oaXRlbSkge1xuICAgICAgICBsZXQgZGVzY3JpcHRpb24sIGxlZnRMYWJlbCwgaWNvbkhUTUwsIHR5cGU7XG4gICAgICAgIGlmICh0aGlzLl91c2VMZWZ0TGFiZWxDb2x1bW5Gb3JTdWdnZXN0aW9ucyA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgZGVzY3JpcHRpb24gPSBpdGVtLlJlcXVpcmVkTmFtZXNwYWNlSW1wb3J0O1xuICAgICAgICAgICAgbGVmdExhYmVsID0gaXRlbS5SZXR1cm5UeXBlO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZGVzY3JpcHRpb24gPSByZW5kZXJSZXR1cm5UeXBlKGl0ZW0uUmV0dXJuVHlwZSk7XG4gICAgICAgICAgICBsZWZ0TGFiZWwgPSBcIlwiO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLl91c2VJY29ucyA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgaWNvbkhUTUwgPSByZW5kZXJJY29uKGl0ZW0pO1xuICAgICAgICAgICAgdHlwZSA9IGl0ZW0uS2luZDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGljb25IVE1MID0gbnVsbDtcbiAgICAgICAgICAgIHR5cGUgPSBpdGVtLktpbmQudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgX3NlYXJjaDogaXRlbS5Db21wbGV0aW9uVGV4dCxcbiAgICAgICAgICAgIHNuaXBwZXQ6IGl0ZW0uU25pcHBldCxcbiAgICAgICAgICAgIHR5cGU6IHR5cGUsXG4gICAgICAgICAgICBpY29uSFRNTDogaWNvbkhUTUwsXG4gICAgICAgICAgICBkaXNwbGF5VGV4dDogaXRlbS5EaXNwbGF5VGV4dCxcbiAgICAgICAgICAgIGNsYXNzTmFtZTogXCJhdXRvY29tcGxldGUtb21uaXNoYXJwLWF0b21cIixcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBkZXNjcmlwdGlvbixcbiAgICAgICAgICAgIGxlZnRMYWJlbDogbGVmdExhYmVsLFxuICAgICAgICB9O1xuICAgIH1cbn1cbm1vZHVsZS5leHBvcnRzID0gW25ldyBDb21wbGV0aW9uUHJvdmlkZXIoKV07XG4iLCJpbXBvcnQge09tbml9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xyXG5pbXBvcnQge01vZGVsc30gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcclxuaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xyXG5pbXBvcnQge0NvbXBvc2l0ZURpc3Bvc2FibGUsIElEaXNwb3NhYmxlfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xyXG5jb25zdCBmaWx0ZXIgPSByZXF1aXJlKFwiZnV6emFsZHJpblwiKS5maWx0ZXI7XHJcblxyXG5pbnRlcmZhY2UgUmVxdWVzdE9wdGlvbnMge1xyXG4gICAgZWRpdG9yOiBBdG9tLlRleHRFZGl0b3I7XHJcbiAgICBidWZmZXJQb3NpdGlvbjogVGV4dEJ1ZmZlci5Qb2ludDsgLy8gdGhlIHBvc2l0aW9uIG9mIHRoZSBjdXJzb3JcclxuICAgIHByZWZpeDogc3RyaW5nO1xyXG4gICAgc2NvcGVEZXNjcmlwdG9yOiB7IHNjb3Blczogc3RyaW5nW10gfTtcclxuICAgIGFjdGl2YXRlZE1hbnVhbGx5OiBib29sZWFuO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgU3VnZ2VzdGlvbiB7XHJcbiAgICAvL0VpdGhlciB0ZXh0IG9yIHNuaXBwZXQgaXMgcmVxdWlyZWRcclxuICAgIHRleHQ/OiBzdHJpbmc7XHJcbiAgICBzbmlwcGV0Pzogc3RyaW5nO1xyXG4gICAgZGlzcGxheVRleHQ/OiBzdHJpbmc7XHJcbiAgICByZXBsYWNlbWVudFByZWZpeD86IHN0cmluZztcclxuICAgIHR5cGU6IHN0cmluZztcclxuICAgIGxlZnRMYWJlbD86IHN0cmluZztcclxuICAgIGxlZnRMYWJlbEhUTUw/OiBzdHJpbmc7XHJcbiAgICByaWdodExhYmVsPzogc3RyaW5nO1xyXG4gICAgcmlnaHRMYWJlbEhUTUw/OiBzdHJpbmc7XHJcbiAgICBpY29uSFRNTD86IHN0cmluZztcclxuICAgIGRlc2NyaXB0aW9uPzogc3RyaW5nO1xyXG4gICAgZGVzY3JpcHRpb25Nb3JlVVJMPzogc3RyaW5nO1xyXG4gICAgY2xhc3NOYW1lPzogc3RyaW5nO1xyXG59XHJcblxyXG5mdW5jdGlvbiBjYWxjdWF0ZU1vdmVtZW50KHByZXZpb3VzOiBSZXF1ZXN0T3B0aW9ucywgY3VycmVudDogUmVxdWVzdE9wdGlvbnMpIHtcclxuICAgIGlmICghY3VycmVudCkgcmV0dXJuIHsgcmVzZXQ6IHRydWUsIGN1cnJlbnQ6IGN1cnJlbnQsIHByZXZpb3VzOiBudWxsIH07XHJcbiAgICAvLyBJZiB0aGUgcm93IGNoYW5nZXMgd2UgbW92ZWQgbGluZXMsIHdlIHNob3VsZCByZWZldGNoIHRoZSBjb21wbGV0aW9uc1xyXG4gICAgLy8gKElzIGl0IHBvc3NpYmxlIGl0IHdpbGwgYmUgdGhlIHNhbWUgc2V0PylcclxuICAgIGNvbnN0IHJvdyA9IE1hdGguYWJzKGN1cnJlbnQuYnVmZmVyUG9zaXRpb24ucm93IC0gcHJldmlvdXMuYnVmZmVyUG9zaXRpb24ucm93KSA+IDA7XHJcbiAgICAvLyBJZiB0aGUgY29sdW1uIGp1bXBlZCwgbGV0cyBnZXQgdGhlbSBhZ2FpbiB0byBiZSBzYWZlLlxyXG4gICAgY29uc3QgY29sdW1uID0gTWF0aC5hYnMoY3VycmVudC5idWZmZXJQb3NpdGlvbi5jb2x1bW4gLSBwcmV2aW91cy5idWZmZXJQb3NpdGlvbi5jb2x1bW4pID4gMztcclxuICAgIHJldHVybiB7IHJlc2V0OiByb3cgfHwgY29sdW1uIHx8IGZhbHNlLCBwcmV2aW91czogcHJldmlvdXMsIGN1cnJlbnQ6IGN1cnJlbnQgfTtcclxufVxyXG5cclxuY29uc3QgYXV0b0NvbXBsZXRlT3B0aW9ucyA9IDxNb2RlbHMuQXV0b0NvbXBsZXRlUmVxdWVzdD57XHJcbiAgICBXb3JkVG9Db21wbGV0ZTogXCJcIixcclxuICAgIFdhbnREb2N1bWVudGF0aW9uRm9yRXZlcnlDb21wbGV0aW9uUmVzdWx0OiBmYWxzZSxcclxuICAgIFdhbnRLaW5kOiB0cnVlLFxyXG4gICAgV2FudFNuaXBwZXQ6IHRydWUsXHJcbiAgICBXYW50UmV0dXJuVHlwZTogdHJ1ZVxyXG59O1xyXG5cclxuZnVuY3Rpb24gcmVuZGVyUmV0dXJuVHlwZShyZXR1cm5UeXBlOiBzdHJpbmcpIHtcclxuICAgIGlmIChyZXR1cm5UeXBlID09PSBudWxsKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGBSZXR1cm5zOiAke3JldHVyblR5cGV9YDtcclxufVxyXG5cclxuZnVuY3Rpb24gcmVuZGVySWNvbihpdGVtOiBNb2RlbHMuQXV0b0NvbXBsZXRlUmVzcG9uc2UpIHtcclxuICAgIC8vIHRvZG86IG1vdmUgYWRkaXRpb25hbCBzdHlsaW5nIHRvIGNzc1xyXG4gICAgcmV0dXJuIGA8aW1nIGhlaWdodD1cIjE2cHhcIiB3aWR0aD1cIjE2cHhcIiBzcmM9XCJhdG9tOi8vb21uaXNoYXJwLWF0b20vc3R5bGVzL2ljb25zL2F1dG9jb21wbGV0ZV8ke2l0ZW0uS2luZC50b0xvd2VyQ2FzZSgpfUAzeC5wbmdcIiAvPmA7XHJcbn1cclxuXHJcbmNsYXNzIENvbXBsZXRpb25Qcm92aWRlciBpbXBsZW1lbnRzIElEaXNwb3NhYmxlIHtcclxuICAgIHByaXZhdGUgX2Rpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XHJcblxyXG4gICAgcHJpdmF0ZSBfaW5pdGlhbGl6ZWQgPSBmYWxzZTtcclxuXHJcbiAgICBwcml2YXRlIF91c2VJY29uczogYm9vbGVhbjtcclxuICAgIHByaXZhdGUgX3VzZUxlZnRMYWJlbENvbHVtbkZvclN1Z2dlc3Rpb25zOiBib29sZWFuO1xyXG5cclxuICAgIHByaXZhdGUgcHJldmlvdXM6IFJlcXVlc3RPcHRpb25zO1xyXG4gICAgcHJpdmF0ZSByZXN1bHRzOiBQcm9taXNlPE1vZGVscy5BdXRvQ29tcGxldGVSZXNwb25zZVtdPjtcclxuXHJcbiAgICBwdWJsaWMgc2VsZWN0b3IgPSBcIi5zb3VyY2Uub21uaXNoYXJwXCI7XHJcbiAgICBwdWJsaWMgZGlzYWJsZUZvclNlbGVjdG9yID0gXCIuc291cmNlLm9tbmlzaGFycCAuY29tbWVudFwiO1xyXG4gICAgcHVibGljIGluY2x1c2lvblByaW9yaXR5ID0gMTtcclxuICAgIHB1YmxpYyBzdWdnZXN0aW9uUHJpb3JpdHkgPSAxMDtcclxuICAgIHB1YmxpYyBleGNsdWRlTG93ZXJQcmlvcml0eSA9IGZhbHNlO1xyXG5cclxuICAgIHB1YmxpYyBnZXRTdWdnZXN0aW9ucyhvcHRpb25zOiBSZXF1ZXN0T3B0aW9ucyk6IFByb21pc2U8U3VnZ2VzdGlvbltdPiB7XHJcbiAgICAgICAgaWYgKCF0aGlzLl9pbml0aWFsaXplZCkgdGhpcy5fc2V0dXBTdWJzY3JpcHRpb25zKCk7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLnJlc3VsdHMgJiYgdGhpcy5wcmV2aW91cyAmJiBjYWxjdWF0ZU1vdmVtZW50KHRoaXMucHJldmlvdXMsIG9wdGlvbnMpLnJlc2V0KSB7XHJcbiAgICAgICAgICAgIHRoaXMucmVzdWx0cyA9IG51bGw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5yZXN1bHRzICYmIG9wdGlvbnMucHJlZml4ID09PSBcIi5cIiB8fCAob3B0aW9ucy5wcmVmaXggJiYgIV8udHJpbShvcHRpb25zLnByZWZpeCkpIHx8ICFvcHRpb25zLnByZWZpeCB8fCBvcHRpb25zLmFjdGl2YXRlZE1hbnVhbGx5KSB7XHJcbiAgICAgICAgICAgIHRoaXMucmVzdWx0cyA9IG51bGw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLnByZXZpb3VzID0gb3B0aW9ucztcclxuXHJcbiAgICAgICAgY29uc3QgYnVmZmVyID0gb3B0aW9ucy5lZGl0b3IuZ2V0QnVmZmVyKCk7XHJcbiAgICAgICAgY29uc3QgZW5kID0gb3B0aW9ucy5idWZmZXJQb3NpdGlvbi5jb2x1bW47XHJcblxyXG4gICAgICAgIGNvbnN0IGRhdGEgPSBidWZmZXIuZ2V0TGluZXMoKVtvcHRpb25zLmJ1ZmZlclBvc2l0aW9uLnJvd10uc3Vic3RyaW5nKDAsIGVuZCArIDEpO1xyXG4gICAgICAgIGNvbnN0IGxhc3RDaGFyYWN0ZXJUeXBlZCA9IGRhdGFbZW5kIC0gMV07XHJcblxyXG4gICAgICAgIGlmICghL1tBLVpfMC05Ll0rL2kudGVzdChsYXN0Q2hhcmFjdGVyVHlwZWQpKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBzZWFyY2ggPSBvcHRpb25zLnByZWZpeDtcclxuICAgICAgICBpZiAoc2VhcmNoID09PSBcIi5cIilcclxuICAgICAgICAgICAgc2VhcmNoID0gXCJcIjtcclxuXHJcbiAgICAgICAgaWYgKCF0aGlzLnJlc3VsdHMpIHRoaXMucmVzdWx0cyA9IE9tbmkucmVxdWVzdChzb2x1dGlvbiA9PiBzb2x1dGlvbi5hdXRvY29tcGxldGUoXy5jbG9uZShhdXRvQ29tcGxldGVPcHRpb25zKSkpLnRvUHJvbWlzZSgpO1xyXG5cclxuICAgICAgICBsZXQgcCA9IHRoaXMucmVzdWx0cztcclxuICAgICAgICBpZiAoc2VhcmNoKVxyXG4gICAgICAgICAgICBwID0gcC50aGVuKHMgPT4gZmlsdGVyKHMsIHNlYXJjaCwgeyBrZXk6IFwiQ29tcGxldGlvblRleHRcIiB9KSk7XHJcblxyXG4gICAgICAgIHJldHVybiBwLnRoZW4ocmVzcG9uc2UgPT4gcmVzcG9uc2UubWFwKHMgPT4gdGhpcy5fbWFrZVN1Z2dlc3Rpb24ocykpKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgb25EaWRJbnNlcnRTdWdnZXN0aW9uKGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yLCB0cmlnZ2VyUG9zaXRpb246IFRleHRCdWZmZXIuUG9pbnQsIHN1Z2dlc3Rpb246IGFueSkge1xyXG4gICAgICAgIHRoaXMucmVzdWx0cyA9IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuX2Rpc3Bvc2FibGUpXHJcbiAgICAgICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG5cclxuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlID0gbnVsbDtcclxuICAgICAgICB0aGlzLl9pbml0aWFsaXplZCA9IGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX3NldHVwU3Vic2NyaXB0aW9ucygpIHtcclxuICAgICAgICBpZiAodGhpcy5faW5pdGlhbGl6ZWQpIHJldHVybjtcclxuXHJcbiAgICAgICAgY29uc3QgZGlzcG9zYWJsZSA9IHRoaXMuX2Rpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG5cclxuICAgICAgICAvLyBDbGVhciB3aGVuIGF1dG8tY29tcGxldGUgaXMgb3BlbmluZy5cclxuICAgICAgICAvLyBUT0RPOiBVcGRhdGUgYXRvbSB0eXBpbmdzXHJcbiAgICAgICAgZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5vbldpbGxEaXNwYXRjaCgoZXZlbnQ6IEV2ZW50KSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChldmVudC50eXBlID09PSBcImF1dG9jb21wbGV0ZS1wbHVzOmFjdGl2YXRlXCIgfHwgZXZlbnQudHlwZSA9PT0gXCJhdXRvY29tcGxldGUtcGx1czpjb25maXJtXCIgfHwgZXZlbnQudHlwZSA9PT0gXCJhdXRvY29tcGxldGUtcGx1czpjYW5jZWxcIikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5yZXN1bHRzID0gbnVsbDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgLy8gVE9ETzogRGlzcG9zZSBvZiB0aGVzZSB3aGVuIG5vdCBuZWVkZWRcclxuICAgICAgICBkaXNwb3NhYmxlLmFkZChhdG9tLmNvbmZpZy5vYnNlcnZlKFwib21uaXNoYXJwLWF0b20udXNlSWNvbnNcIiwgKHZhbHVlKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuX3VzZUljb25zID0gdmFsdWU7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICBkaXNwb3NhYmxlLmFkZChhdG9tLmNvbmZpZy5vYnNlcnZlKFwib21uaXNoYXJwLWF0b20udXNlTGVmdExhYmVsQ29sdW1uRm9yU3VnZ2VzdGlvbnNcIiwgKHZhbHVlKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuX3VzZUxlZnRMYWJlbENvbHVtbkZvclN1Z2dlc3Rpb25zID0gdmFsdWU7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLl9pbml0aWFsaXplZCA9IHRydWU7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfbWFrZVN1Z2dlc3Rpb24oaXRlbTogTW9kZWxzLkF1dG9Db21wbGV0ZVJlc3BvbnNlKSB7XHJcbiAgICAgICAgbGV0IGRlc2NyaXB0aW9uOiBhbnksIGxlZnRMYWJlbDogYW55LCBpY29uSFRNTDogYW55LCB0eXBlOiBhbnk7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl91c2VMZWZ0TGFiZWxDb2x1bW5Gb3JTdWdnZXN0aW9ucyA9PT0gdHJ1ZSkge1xyXG4gICAgICAgICAgICBkZXNjcmlwdGlvbiA9IGl0ZW0uUmVxdWlyZWROYW1lc3BhY2VJbXBvcnQ7XHJcbiAgICAgICAgICAgIGxlZnRMYWJlbCA9IGl0ZW0uUmV0dXJuVHlwZTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBkZXNjcmlwdGlvbiA9IHJlbmRlclJldHVyblR5cGUoaXRlbS5SZXR1cm5UeXBlKTtcclxuICAgICAgICAgICAgbGVmdExhYmVsID0gXCJcIjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl91c2VJY29ucyA9PT0gdHJ1ZSkge1xyXG4gICAgICAgICAgICBpY29uSFRNTCA9IHJlbmRlckljb24oaXRlbSk7XHJcbiAgICAgICAgICAgIHR5cGUgPSBpdGVtLktpbmQ7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgaWNvbkhUTUwgPSBudWxsO1xyXG4gICAgICAgICAgICB0eXBlID0gaXRlbS5LaW5kLnRvTG93ZXJDYXNlKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBfc2VhcmNoOiBpdGVtLkNvbXBsZXRpb25UZXh0LFxyXG4gICAgICAgICAgICBzbmlwcGV0OiBpdGVtLlNuaXBwZXQsXHJcbiAgICAgICAgICAgIHR5cGU6IHR5cGUsXHJcbiAgICAgICAgICAgIGljb25IVE1MOiBpY29uSFRNTCxcclxuICAgICAgICAgICAgZGlzcGxheVRleHQ6IGl0ZW0uRGlzcGxheVRleHQsXHJcbiAgICAgICAgICAgIGNsYXNzTmFtZTogXCJhdXRvY29tcGxldGUtb21uaXNoYXJwLWF0b21cIixcclxuICAgICAgICAgICAgZGVzY3JpcHRpb246IGRlc2NyaXB0aW9uLFxyXG4gICAgICAgICAgICBsZWZ0TGFiZWw6IGxlZnRMYWJlbCxcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFtuZXcgQ29tcGxldGlvblByb3ZpZGVyKCldO1xyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
