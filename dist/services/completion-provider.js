'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _tsDisposables = require('ts-disposables');

var _omni = require('../server/omni');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var filter = require('fuzzaldrin').filter;
function calcuateMovement(previous, current) {
    if (!current) return { reset: true, current: current, previous: null };
    var row = Math.abs(current.bufferPosition.row - previous.bufferPosition.row) > 0;
    var column = Math.abs(current.bufferPosition.column - previous.bufferPosition.column) > 3;
    return { reset: row || column || false, previous: previous, current: current };
}
var autoCompleteOptions = {
    WordToComplete: '',
    WantDocumentationForEveryCompletionResult: false,
    WantKind: true,
    WantSnippet: true,
    WantReturnType: true
};
function renderReturnType(returnType) {
    if (returnType === null) {
        return;
    }
    return 'Returns: ' + returnType;
}
function renderIcon(item) {
    return '<img height="16px" width="16px" src="atom://omnisharp-atom/styles/icons/autocomplete_' + item.Kind.toLowerCase() + '@3x.png" />';
}

var CompletionProvider = function () {
    function CompletionProvider() {
        _classCallCheck(this, CompletionProvider);

        this._initialized = false;
        this.selector = '.source.omnisharp';
        this.disableForSelector = '.source.omnisharp .comment';
        this.inclusionPriority = 1;
        this.suggestionPriority = 10;
        this.excludeLowerPriority = false;
    }

    _createClass(CompletionProvider, [{
        key: 'getSuggestions',
        value: function getSuggestions(options) {
            var _this = this;

            if (!this._initialized) this._setupSubscriptions();
            if (this.results && this.previous && calcuateMovement(this.previous, options).reset) {
                this.results = null;
            }
            if (this.results && options.prefix === '.' || options.prefix && !(0, _lodash.trim)(options.prefix) || !options.prefix || options.activatedManually) {
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
            if (search === '.') search = '';
            if (!this.results) this.results = _omni.Omni.request(function (solution) {
                return solution.autocomplete((0, _lodash.clone)(autoCompleteOptions));
            }).toPromise();
            var p = this.results;
            if (search) p = p.then(function (s) {
                return filter(s, search, { key: 'CompletionText' });
            });
            return p.then(function (response) {
                return response.map(function (s) {
                    return _this._makeSuggestion(s);
                });
            });
        }
    }, {
        key: 'onDidInsertSuggestion',
        value: function onDidInsertSuggestion(editor, triggerPosition, suggestion) {
            this.results = null;
        }
    }, {
        key: 'dispose',
        value: function dispose() {
            if (this._disposable) this._disposable.dispose();
            this._disposable = null;
            this._initialized = false;
        }
    }, {
        key: '_setupSubscriptions',
        value: function _setupSubscriptions() {
            var _this2 = this;

            if (this._initialized) return;
            var disposable = this._disposable = new _tsDisposables.CompositeDisposable();
            disposable.add(atom.commands.onWillDispatch(function (event) {
                if (event.type === 'autocomplete-plus:activate' || event.type === 'autocomplete-plus:confirm' || event.type === 'autocomplete-plus:cancel') {
                    _this2.results = null;
                }
            }));
            disposable.add(atom.config.observe('omnisharp-atom.useIcons', function (value) {
                _this2._useIcons = value;
            }));
            disposable.add(atom.config.observe('omnisharp-atom.useLeftLabelColumnForSuggestions', function (value) {
                _this2._useLeftLabelColumnForSuggestions = value;
            }));
            this._initialized = true;
        }
    }, {
        key: '_makeSuggestion',
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
                leftLabel = '';
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
                className: 'autocomplete-omnisharp-atom',
                description: description,
                leftLabel: leftLabel
            };
        }
    }]);

    return CompletionProvider;
}();

module.exports = [new CompletionProvider()];
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9zZXJ2aWNlcy9jb21wbGV0aW9uLXByb3ZpZGVyLnRzIl0sIm5hbWVzIjpbImZpbHRlciIsInJlcXVpcmUiLCJjYWxjdWF0ZU1vdmVtZW50IiwicHJldmlvdXMiLCJjdXJyZW50IiwicmVzZXQiLCJyb3ciLCJNYXRoIiwiYWJzIiwiYnVmZmVyUG9zaXRpb24iLCJjb2x1bW4iLCJhdXRvQ29tcGxldGVPcHRpb25zIiwiV29yZFRvQ29tcGxldGUiLCJXYW50RG9jdW1lbnRhdGlvbkZvckV2ZXJ5Q29tcGxldGlvblJlc3VsdCIsIldhbnRLaW5kIiwiV2FudFNuaXBwZXQiLCJXYW50UmV0dXJuVHlwZSIsInJlbmRlclJldHVyblR5cGUiLCJyZXR1cm5UeXBlIiwicmVuZGVySWNvbiIsIml0ZW0iLCJLaW5kIiwidG9Mb3dlckNhc2UiLCJDb21wbGV0aW9uUHJvdmlkZXIiLCJfaW5pdGlhbGl6ZWQiLCJzZWxlY3RvciIsImRpc2FibGVGb3JTZWxlY3RvciIsImluY2x1c2lvblByaW9yaXR5Iiwic3VnZ2VzdGlvblByaW9yaXR5IiwiZXhjbHVkZUxvd2VyUHJpb3JpdHkiLCJvcHRpb25zIiwiX3NldHVwU3Vic2NyaXB0aW9ucyIsInJlc3VsdHMiLCJwcmVmaXgiLCJhY3RpdmF0ZWRNYW51YWxseSIsImJ1ZmZlciIsImVkaXRvciIsImdldEJ1ZmZlciIsImVuZCIsImRhdGEiLCJnZXRMaW5lcyIsInN1YnN0cmluZyIsImxhc3RDaGFyYWN0ZXJUeXBlZCIsInRlc3QiLCJzZWFyY2giLCJyZXF1ZXN0Iiwic29sdXRpb24iLCJhdXRvY29tcGxldGUiLCJ0b1Byb21pc2UiLCJwIiwidGhlbiIsInMiLCJrZXkiLCJyZXNwb25zZSIsIm1hcCIsIl9tYWtlU3VnZ2VzdGlvbiIsInRyaWdnZXJQb3NpdGlvbiIsInN1Z2dlc3Rpb24iLCJfZGlzcG9zYWJsZSIsImRpc3Bvc2UiLCJkaXNwb3NhYmxlIiwiYWRkIiwiYXRvbSIsImNvbW1hbmRzIiwib25XaWxsRGlzcGF0Y2giLCJldmVudCIsInR5cGUiLCJjb25maWciLCJvYnNlcnZlIiwiX3VzZUljb25zIiwidmFsdWUiLCJfdXNlTGVmdExhYmVsQ29sdW1uRm9yU3VnZ2VzdGlvbnMiLCJkZXNjcmlwdGlvbiIsImxlZnRMYWJlbCIsImljb25IVE1MIiwiUmVxdWlyZWROYW1lc3BhY2VJbXBvcnQiLCJSZXR1cm5UeXBlIiwiX3NlYXJjaCIsIkNvbXBsZXRpb25UZXh0Iiwic25pcHBldCIsIlNuaXBwZXQiLCJkaXNwbGF5VGV4dCIsIkRpc3BsYXlUZXh0IiwiY2xhc3NOYW1lIiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6Ijs7OztBQUFBOztBQUVBOztBQUNBOzs7O0FBQ0EsSUFBTUEsU0FBU0MsUUFBUSxZQUFSLEVBQXNCRCxNQUFyQztBQTJCQSxTQUFBRSxnQkFBQSxDQUEwQkMsUUFBMUIsRUFBb0RDLE9BQXBELEVBQTJFO0FBQ3ZFLFFBQUksQ0FBQ0EsT0FBTCxFQUFjLE9BQU8sRUFBRUMsT0FBTyxJQUFULEVBQWVELFNBQVNBLE9BQXhCLEVBQWlDRCxVQUFVLElBQTNDLEVBQVA7QUFHZCxRQUFNRyxNQUFNQyxLQUFLQyxHQUFMLENBQVNKLFFBQVFLLGNBQVIsQ0FBdUJILEdBQXZCLEdBQTZCSCxTQUFTTSxjQUFULENBQXdCSCxHQUE5RCxJQUFxRSxDQUFqRjtBQUVBLFFBQU1JLFNBQVNILEtBQUtDLEdBQUwsQ0FBU0osUUFBUUssY0FBUixDQUF1QkMsTUFBdkIsR0FBZ0NQLFNBQVNNLGNBQVQsQ0FBd0JDLE1BQWpFLElBQTJFLENBQTFGO0FBQ0EsV0FBTyxFQUFFTCxPQUFPQyxPQUFPSSxNQUFQLElBQWlCLEtBQTFCLEVBQWlDUCxVQUFVQSxRQUEzQyxFQUFxREMsU0FBU0EsT0FBOUQsRUFBUDtBQUNIO0FBRUQsSUFBTU8sc0JBQWtEO0FBQ3BEQyxvQkFBZ0IsRUFEb0M7QUFFcERDLCtDQUEyQyxLQUZTO0FBR3BEQyxjQUFVLElBSDBDO0FBSXBEQyxpQkFBYSxJQUp1QztBQUtwREMsb0JBQWdCO0FBTG9DLENB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QXZCLEVBQTZCO0FBQ3pCSywyQkFBV3ZELFdBQVdDLElBQVgsQ0FBWDtBQUNBOEMsdUJBQU85QyxLQUFLQyxJQUFaO0FBQ0gsYUFIRCxNQUdPO0FBQ0hxRCwyQkFBVyxJQUFYO0FBQ0FSLHVCQUFPOUMsS0FBS0MsSUFBTCxDQUFVQyxXQUFWLEVBQVA7QUFDSDtBQUVELG1CQUFPO0FBQ0h1RCx5QkFBU3pELEtBQUswRCxjQURYO0FBRUhDLHlCQUFTM0QsS0FBSzRELE9BRlg7QUFHSGQsc0JBQU1BLElBSEg7QUFJSFEsMEJBQVVBLFFBSlA7QUFLSE8sNkJBQWE3RCxLQUFLOEQsV0FMZjtBQU1IQywyQkFBVyw2QkFOUjtBQU9IWCw2QkFBYUEsV0FQVjtBQVFIQywyQkFBV0E7QUFSUixhQUFQO0FBVUg7Ozs7OztBQUdMVyxPQUFPQyxPQUFQLEdBQWlCLENBQUMsSUFBSTlELGtCQUFKLEVBQUQsQ0FBakIiLCJmaWxlIjoibGliL3NlcnZpY2VzL2NvbXBsZXRpb24tcHJvdmlkZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyB0cmltLCBjbG9uZSB9IGZyb20gJ2xvZGFzaCc7XHJcbmltcG9ydCB7IE1vZGVscyB9IGZyb20gJ29tbmlzaGFycC1jbGllbnQnO1xyXG5pbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlLCBJRGlzcG9zYWJsZSB9IGZyb20gJ3RzLWRpc3Bvc2FibGVzJztcclxuaW1wb3J0IHsgT21uaSB9IGZyb20gJy4uL3NlcnZlci9vbW5pJztcclxuY29uc3QgZmlsdGVyID0gcmVxdWlyZSgnZnV6emFsZHJpbicpLmZpbHRlcjtcclxuXHJcbmludGVyZmFjZSBSZXF1ZXN0T3B0aW9ucyB7XHJcbiAgICBlZGl0b3I6IEF0b20uVGV4dEVkaXRvcjtcclxuICAgIGJ1ZmZlclBvc2l0aW9uOiBUZXh0QnVmZmVyLlBvaW50OyAvLyB0aGUgcG9zaXRpb24gb2YgdGhlIGN1cnNvclxyXG4gICAgcHJlZml4OiBzdHJpbmc7XHJcbiAgICBzY29wZURlc2NyaXB0b3I6IHsgc2NvcGVzOiBzdHJpbmdbXSB9O1xyXG4gICAgYWN0aXZhdGVkTWFudWFsbHk6IGJvb2xlYW47XHJcbn1cclxuXHJcbmludGVyZmFjZSBTdWdnZXN0aW9uIHtcclxuICAgIC8vRWl0aGVyIHRleHQgb3Igc25pcHBldCBpcyByZXF1aXJlZFxyXG4gICAgdGV4dD86IHN0cmluZztcclxuICAgIHNuaXBwZXQ/OiBzdHJpbmc7XHJcbiAgICBkaXNwbGF5VGV4dD86IHN0cmluZztcclxuICAgIHJlcGxhY2VtZW50UHJlZml4Pzogc3RyaW5nO1xyXG4gICAgdHlwZTogc3RyaW5nO1xyXG4gICAgbGVmdExhYmVsPzogc3RyaW5nO1xyXG4gICAgbGVmdExhYmVsSFRNTD86IHN0cmluZztcclxuICAgIHJpZ2h0TGFiZWw/OiBzdHJpbmc7XHJcbiAgICByaWdodExhYmVsSFRNTD86IHN0cmluZztcclxuICAgIGljb25IVE1MPzogc3RyaW5nO1xyXG4gICAgZGVzY3JpcHRpb24/OiBzdHJpbmc7XHJcbiAgICBkZXNjcmlwdGlvbk1vcmVVUkw/OiBzdHJpbmc7XHJcbiAgICBjbGFzc05hbWU/OiBzdHJpbmc7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNhbGN1YXRlTW92ZW1lbnQocHJldmlvdXM6IFJlcXVlc3RPcHRpb25zLCBjdXJyZW50OiBSZXF1ZXN0T3B0aW9ucykge1xyXG4gICAgaWYgKCFjdXJyZW50KSByZXR1cm4geyByZXNldDogdHJ1ZSwgY3VycmVudDogY3VycmVudCwgcHJldmlvdXM6IG51bGwgfTtcclxuICAgIC8vIElmIHRoZSByb3cgY2hhbmdlcyB3ZSBtb3ZlZCBsaW5lcywgd2Ugc2hvdWxkIHJlZmV0Y2ggdGhlIGNvbXBsZXRpb25zXHJcbiAgICAvLyAoSXMgaXQgcG9zc2libGUgaXQgd2lsbCBiZSB0aGUgc2FtZSBzZXQ/KVxyXG4gICAgY29uc3Qgcm93ID0gTWF0aC5hYnMoY3VycmVudC5idWZmZXJQb3NpdGlvbi5yb3cgLSBwcmV2aW91cy5idWZmZXJQb3NpdGlvbi5yb3cpID4gMDtcclxuICAgIC8vIElmIHRoZSBjb2x1bW4ganVtcGVkLCBsZXRzIGdldCB0aGVtIGFnYWluIHRvIGJlIHNhZmUuXHJcbiAgICBjb25zdCBjb2x1bW4gPSBNYXRoLmFicyhjdXJyZW50LmJ1ZmZlclBvc2l0aW9uLmNvbHVtbiAtIHByZXZpb3VzLmJ1ZmZlclBvc2l0aW9uLmNvbHVtbikgPiAzO1xyXG4gICAgcmV0dXJuIHsgcmVzZXQ6IHJvdyB8fCBjb2x1bW4gfHwgZmFsc2UsIHByZXZpb3VzOiBwcmV2aW91cywgY3VycmVudDogY3VycmVudCB9O1xyXG59XHJcblxyXG5jb25zdCBhdXRvQ29tcGxldGVPcHRpb25zID0gPE1vZGVscy5BdXRvQ29tcGxldGVSZXF1ZXN0PntcclxuICAgIFdvcmRUb0NvbXBsZXRlOiAnJyxcclxuICAgIFdhbnREb2N1bWVudGF0aW9uRm9yRXZlcnlDb21wbGV0aW9uUmVzdWx0OiBmYWxzZSxcclxuICAgIFdhbnRLaW5kOiB0cnVlLFxyXG4gICAgV2FudFNuaXBwZXQ6IHRydWUsXHJcbiAgICBXYW50UmV0dXJuVHlwZTogdHJ1ZVxyXG59O1xyXG5cclxuZnVuY3Rpb24gcmVuZGVyUmV0dXJuVHlwZShyZXR1cm5UeXBlOiBzdHJpbmcpIHtcclxuICAgIGlmIChyZXR1cm5UeXBlID09PSBudWxsKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGBSZXR1cm5zOiAke3JldHVyblR5cGV9YDtcclxufVxyXG5cclxuZnVuY3Rpb24gcmVuZGVySWNvbihpdGVtOiBNb2RlbHMuQXV0b0NvbXBsZXRlUmVzcG9uc2UpIHtcclxuICAgIC8vIHRvZG86IG1vdmUgYWRkaXRpb25hbCBzdHlsaW5nIHRvIGNzc1xyXG4gICAgcmV0dXJuIGA8aW1nIGhlaWdodD1cIjE2cHhcIiB3aWR0aD1cIjE2cHhcIiBzcmM9XCJhdG9tOi8vb21uaXNoYXJwLWF0b20vc3R5bGVzL2ljb25zL2F1dG9jb21wbGV0ZV8ke2l0ZW0uS2luZC50b0xvd2VyQ2FzZSgpfUAzeC5wbmdcIiAvPmA7XHJcbn1cclxuXHJcbmNsYXNzIENvbXBsZXRpb25Qcm92aWRlciBpbXBsZW1lbnRzIElEaXNwb3NhYmxlIHtcclxuICAgIHByaXZhdGUgX2Rpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XHJcblxyXG4gICAgcHJpdmF0ZSBfaW5pdGlhbGl6ZWQgPSBmYWxzZTtcclxuXHJcbiAgICBwcml2YXRlIF91c2VJY29uczogYm9vbGVhbjtcclxuICAgIHByaXZhdGUgX3VzZUxlZnRMYWJlbENvbHVtbkZvclN1Z2dlc3Rpb25zOiBib29sZWFuO1xyXG5cclxuICAgIHByaXZhdGUgcHJldmlvdXM6IFJlcXVlc3RPcHRpb25zO1xyXG4gICAgcHJpdmF0ZSByZXN1bHRzOiBQcm9taXNlPE1vZGVscy5BdXRvQ29tcGxldGVSZXNwb25zZVtdPjtcclxuXHJcbiAgICBwdWJsaWMgc2VsZWN0b3IgPSAnLnNvdXJjZS5vbW5pc2hhcnAnO1xyXG4gICAgcHVibGljIGRpc2FibGVGb3JTZWxlY3RvciA9ICcuc291cmNlLm9tbmlzaGFycCAuY29tbWVudCc7XHJcbiAgICBwdWJsaWMgaW5jbHVzaW9uUHJpb3JpdHkgPSAxO1xyXG4gICAgcHVibGljIHN1Z2dlc3Rpb25Qcmlvcml0eSA9IDEwO1xyXG4gICAgcHVibGljIGV4Y2x1ZGVMb3dlclByaW9yaXR5ID0gZmFsc2U7XHJcblxyXG4gICAgcHVibGljIGdldFN1Z2dlc3Rpb25zKG9wdGlvbnM6IFJlcXVlc3RPcHRpb25zKTogUHJvbWlzZTxTdWdnZXN0aW9uW10+IHtcclxuICAgICAgICBpZiAoIXRoaXMuX2luaXRpYWxpemVkKSB0aGlzLl9zZXR1cFN1YnNjcmlwdGlvbnMoKTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMucmVzdWx0cyAmJiB0aGlzLnByZXZpb3VzICYmIGNhbGN1YXRlTW92ZW1lbnQodGhpcy5wcmV2aW91cywgb3B0aW9ucykucmVzZXQpIHtcclxuICAgICAgICAgICAgdGhpcy5yZXN1bHRzID0gbnVsbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLnJlc3VsdHMgJiYgb3B0aW9ucy5wcmVmaXggPT09ICcuJyB8fCAob3B0aW9ucy5wcmVmaXggJiYgIXRyaW0ob3B0aW9ucy5wcmVmaXgpKSB8fCAhb3B0aW9ucy5wcmVmaXggfHwgb3B0aW9ucy5hY3RpdmF0ZWRNYW51YWxseSkge1xyXG4gICAgICAgICAgICB0aGlzLnJlc3VsdHMgPSBudWxsO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5wcmV2aW91cyA9IG9wdGlvbnM7XHJcblxyXG4gICAgICAgIGNvbnN0IGJ1ZmZlciA9IG9wdGlvbnMuZWRpdG9yLmdldEJ1ZmZlcigpO1xyXG4gICAgICAgIGNvbnN0IGVuZCA9IG9wdGlvbnMuYnVmZmVyUG9zaXRpb24uY29sdW1uO1xyXG5cclxuICAgICAgICBjb25zdCBkYXRhID0gYnVmZmVyLmdldExpbmVzKClbb3B0aW9ucy5idWZmZXJQb3NpdGlvbi5yb3ddLnN1YnN0cmluZygwLCBlbmQgKyAxKTtcclxuICAgICAgICBjb25zdCBsYXN0Q2hhcmFjdGVyVHlwZWQgPSBkYXRhW2VuZCAtIDFdO1xyXG5cclxuICAgICAgICBpZiAoIS9bQS1aXzAtOS5dKy9pLnRlc3QobGFzdENoYXJhY3RlclR5cGVkKSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgc2VhcmNoID0gb3B0aW9ucy5wcmVmaXg7XHJcbiAgICAgICAgaWYgKHNlYXJjaCA9PT0gJy4nKVxyXG4gICAgICAgICAgICBzZWFyY2ggPSAnJztcclxuXHJcbiAgICAgICAgaWYgKCF0aGlzLnJlc3VsdHMpIHRoaXMucmVzdWx0cyA9IE9tbmkucmVxdWVzdChzb2x1dGlvbiA9PiBzb2x1dGlvbi5hdXRvY29tcGxldGUoY2xvbmUoYXV0b0NvbXBsZXRlT3B0aW9ucykpKVxyXG4gICAgICAgICAgICAudG9Qcm9taXNlKCk7XHJcblxyXG4gICAgICAgIGxldCBwID0gdGhpcy5yZXN1bHRzO1xyXG4gICAgICAgIGlmIChzZWFyY2gpXHJcbiAgICAgICAgICAgIHAgPSBwLnRoZW4ocyA9PiBmaWx0ZXIocywgc2VhcmNoLCB7IGtleTogJ0NvbXBsZXRpb25UZXh0JyB9KSk7XHJcblxyXG4gICAgICAgIHJldHVybiBwLnRoZW4ocmVzcG9uc2UgPT4gcmVzcG9uc2UubWFwKHMgPT4gdGhpcy5fbWFrZVN1Z2dlc3Rpb24ocykpKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgb25EaWRJbnNlcnRTdWdnZXN0aW9uKGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yLCB0cmlnZ2VyUG9zaXRpb246IFRleHRCdWZmZXIuUG9pbnQsIHN1Z2dlc3Rpb246IGFueSkge1xyXG4gICAgICAgIHRoaXMucmVzdWx0cyA9IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuX2Rpc3Bvc2FibGUpXHJcbiAgICAgICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG5cclxuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlID0gbnVsbDtcclxuICAgICAgICB0aGlzLl9pbml0aWFsaXplZCA9IGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX3NldHVwU3Vic2NyaXB0aW9ucygpIHtcclxuICAgICAgICBpZiAodGhpcy5faW5pdGlhbGl6ZWQpIHJldHVybjtcclxuXHJcbiAgICAgICAgY29uc3QgZGlzcG9zYWJsZSA9IHRoaXMuX2Rpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG5cclxuICAgICAgICAvLyBDbGVhciB3aGVuIGF1dG8tY29tcGxldGUgaXMgb3BlbmluZy5cclxuICAgICAgICAvLyBUT0RPOiBVcGRhdGUgYXRvbSB0eXBpbmdzXHJcbiAgICAgICAgZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5vbldpbGxEaXNwYXRjaCgoZXZlbnQ6IEV2ZW50KSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChldmVudC50eXBlID09PSAnYXV0b2NvbXBsZXRlLXBsdXM6YWN0aXZhdGUnIHx8IGV2ZW50LnR5cGUgPT09ICdhdXRvY29tcGxldGUtcGx1czpjb25maXJtJyB8fCBldmVudC50eXBlID09PSAnYXV0b2NvbXBsZXRlLXBsdXM6Y2FuY2VsJykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5yZXN1bHRzID0gbnVsbDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgLy8gVE9ETzogRGlzcG9zZSBvZiB0aGVzZSB3aGVuIG5vdCBuZWVkZWRcclxuICAgICAgICBkaXNwb3NhYmxlLmFkZChhdG9tLmNvbmZpZy5vYnNlcnZlKCdvbW5pc2hhcnAtYXRvbS51c2VJY29ucycsIHZhbHVlID0+IHtcclxuICAgICAgICAgICAgdGhpcy5fdXNlSWNvbnMgPSB2YWx1ZTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIGRpc3Bvc2FibGUuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoJ29tbmlzaGFycC1hdG9tLnVzZUxlZnRMYWJlbENvbHVtbkZvclN1Z2dlc3Rpb25zJywgdmFsdWUgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLl91c2VMZWZ0TGFiZWxDb2x1bW5Gb3JTdWdnZXN0aW9ucyA9IHZhbHVlO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5faW5pdGlhbGl6ZWQgPSB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX21ha2VTdWdnZXN0aW9uKGl0ZW06IE1vZGVscy5BdXRvQ29tcGxldGVSZXNwb25zZSkge1xyXG4gICAgICAgIGxldCBkZXNjcmlwdGlvbjogYW55LCBsZWZ0TGFiZWw6IGFueSwgaWNvbkhUTUw6IGFueSwgdHlwZTogYW55O1xyXG5cclxuICAgICAgICBpZiAodGhpcy5fdXNlTGVmdExhYmVsQ29sdW1uRm9yU3VnZ2VzdGlvbnMgPT09IHRydWUpIHtcclxuICAgICAgICAgICAgZGVzY3JpcHRpb24gPSBpdGVtLlJlcXVpcmVkTmFtZXNwYWNlSW1wb3J0O1xyXG4gICAgICAgICAgICBsZWZ0TGFiZWwgPSBpdGVtLlJldHVyblR5cGU7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgZGVzY3JpcHRpb24gPSByZW5kZXJSZXR1cm5UeXBlKGl0ZW0uUmV0dXJuVHlwZSk7XHJcbiAgICAgICAgICAgIGxlZnRMYWJlbCA9ICcnO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX3VzZUljb25zID09PSB0cnVlKSB7XHJcbiAgICAgICAgICAgIGljb25IVE1MID0gcmVuZGVySWNvbihpdGVtKTtcclxuICAgICAgICAgICAgdHlwZSA9IGl0ZW0uS2luZDtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBpY29uSFRNTCA9IG51bGw7XHJcbiAgICAgICAgICAgIHR5cGUgPSBpdGVtLktpbmQudG9Mb3dlckNhc2UoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIF9zZWFyY2g6IGl0ZW0uQ29tcGxldGlvblRleHQsXHJcbiAgICAgICAgICAgIHNuaXBwZXQ6IGl0ZW0uU25pcHBldCxcclxuICAgICAgICAgICAgdHlwZTogdHlwZSxcclxuICAgICAgICAgICAgaWNvbkhUTUw6IGljb25IVE1MLFxyXG4gICAgICAgICAgICBkaXNwbGF5VGV4dDogaXRlbS5EaXNwbGF5VGV4dCxcclxuICAgICAgICAgICAgY2xhc3NOYW1lOiAnYXV0b2NvbXBsZXRlLW9tbmlzaGFycC1hdG9tJyxcclxuICAgICAgICAgICAgZGVzY3JpcHRpb246IGRlc2NyaXB0aW9uLFxyXG4gICAgICAgICAgICBsZWZ0TGFiZWw6IGxlZnRMYWJlbCxcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFtuZXcgQ29tcGxldGlvblByb3ZpZGVyKCldO1xyXG4iXX0=
