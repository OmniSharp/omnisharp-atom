'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

exports.metadataOpener = metadataOpener;

var _atom = require('atom');

var _lodash = require('lodash');

var _omnisharpTextEditor = require('./omnisharp-text-editor');

var _solutionManager = require('./solution-manager');

var metadataUri = 'omnisharp://metadata/';
function metadataOpener() {
    function createEditorView(assemblyName, typeName) {
        function issueRequest(solution) {
            return solution.request('metadata', { AssemblyName: assemblyName, TypeName: typeName }).map(function (response) {
                return { source: response.Source, path: response.SourceName, solution: solution };
            });
        }
        function setupEditor(_ref) {
            var solution = _ref.solution,
                path = _ref.path,
                source = _ref.source;

            var editor = new _atom.TextEditor({});
            editor.setText(source);
            editor.onWillInsertText(function (e) {
                return e.cancel();
            });
            editor.getBuffer().setPath(path);
            var context = new _omnisharpTextEditor.OmnisharpEditorContext(editor, solution);
            context.metadata = true;
            var result = editor;
            result.omnisharp = context;
            editor.save = function () {};
            editor.saveAs = function () {};
            return editor;
        }
        return _solutionManager.SolutionManager.activeSolution.take(1).flatMap(issueRequest, function (_z, z) {
            return setupEditor(z);
        }).toPromise();
    }
    return atom.workspace.addOpener(function (uri) {
        if ((0, _lodash.startsWith)(uri, metadataUri)) {
            var url = uri.substr(metadataUri.length);

            var _url$split = url.split('/'),
                _url$split2 = _slicedToArray(_url$split, 2),
                assemblyName = _url$split2[0],
                typeName = _url$split2[1];

            return createEditorView(assemblyName, typeName);
        }
    });
}
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9zZXJ2ZXIvbWV0YWRhdGEtZWRpdG9yLnRzIl0sIm5hbWVzIjpbIm1ldGFkYXRhT3BlbmVyIiwibWV0YWRhdGFVcmkiLCJjcmVhdGVFZGl0b3JWaWV3IiwiYXNzZW1ibHlOYW1lIiwidHlwZU5hbWUiLCJpc3N1ZVJlcXVlc3QiLCJzb2x1dGlvbiIsInJlcXVlc3QiLCJBc3NlbWJseU5hbWUiLCJUeXBlTmFtZSIsIm1hcCIsInNvdXJjZSIsInJlc3BvbnNlIiwiU291cmNlIiwicGF0aCIsIlNvdXJjZU5hbWUiLCJzZXR1cEVkaXRvciIsImVkaXRvciIsInNldFRleHQiLCJvbldpbGxJbnNlcnRUZXh0IiwiZSIsImNhbmNlbCIsImdldEJ1ZmZlciIsInNldFBhdGgiLCJjb250ZXh0IiwibWV0YWRhdGEiLCJyZXN1bHQiLCJvbW5pc2hhcnAiLCJzYXZlIiwic2F2ZUFzIiwiYWN0aXZlU29sdXRpb24iLCJ0YWtlIiwiZmxhdE1hcCIsIl96IiwieiIsInRvUHJvbWlzZSIsImF0b20iLCJ3b3Jrc3BhY2UiLCJhZGRPcGVuZXIiLCJ1cmkiLCJ1cmwiLCJzdWJzdHIiLCJsZW5ndGgiLCJzcGxpdCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7UUFRTUEsYyxHQUFBQSxjOztBQVJOOztBQUNBOztBQUVBOztBQUVBOztBQUVBLElBQU1DLGNBQWMsdUJBQXBCO0FBQ00sU0FBQUQsY0FBQSxHQUFBO0FBQ0YsYUFBQUUsZ0JBQUEsQ0FBMEJDLFlBQTFCLEVBQWdEQyxRQUFoRCxFQUFnRTtBQUM1RCxpQkFBQUMsWUFBQSxDQUFzQkMsUUFBdEIsRUFBd0M7QUFDcEMsbUJBQU9BLFNBQVNDLE9BQVQsQ0FBOEQsVUFBOUQsRUFBMEUsRUFBRUMsY0FBY0wsWUFBaEIsRUFBOEJNLFVBQVVMLFFBQXhDLEVBQTFFLEVBQ0ZNLEdBREUsQ0FDRTtBQUFBLHVCQUFhLEVBQUVDLFFBQVFDLFNBQVNDLE1BQW5CLEVBQTJCQyxNQUFNRixTQUFTRyxVQUExQyxFQUFzRFQsa0JBQXRELEVBQWI7QUFBQSxhQURGLENBQVA7QUFFSDtBQUVELGlCQUFBVSxXQUFBLE9BQW1HO0FBQUEsZ0JBQTdFVixRQUE2RSxRQUE3RUEsUUFBNkU7QUFBQSxnQkFBbkVRLElBQW1FLFFBQW5FQSxJQUFtRTtBQUFBLGdCQUE3REgsTUFBNkQsUUFBN0RBLE1BQTZEOztBQUMvRixnQkFBTU0sU0FBUyxxQkFBZSxFQUFmLENBQWY7QUFDQUEsbUJBQU9DLE9BQVAsQ0FBZVAsTUFBZjtBQUNBTSxtQkFBT0UsZ0JBQVAsQ0FBd0I7QUFBQSx1QkFBS0MsRUFBRUMsTUFBRixFQUFMO0FBQUEsYUFBeEI7QUFDQUosbUJBQU9LLFNBQVAsR0FBbUJDLE9BQW5CLENBQTJCVCxJQUEzQjtBQUVBLGdCQUFNVSxVQUFVLGdEQUEyQlAsTUFBM0IsRUFBbUNYLFFBQW5DLENBQWhCO0FBQ0FrQixvQkFBUUMsUUFBUixHQUFtQixJQUFuQjtBQUNBLGdCQUFNQyxTQUFvQ1QsTUFBMUM7QUFDQVMsbUJBQU9DLFNBQVAsR0FBbUJILE9BQW5CO0FBRUFQLG1CQUFPVyxJQUFQLEdBQWMsWUFBQSxDQUFxQixDQUFuQztBQUNBWCxtQkFBT1ksTUFBUCxHQUFnQixZQUFBLENBQXFCLENBQXJDO0FBRUEsbUJBQU9aLE1BQVA7QUFDSDtBQUVELGVBQU8saUNBQWdCYSxjQUFoQixDQUNGQyxJQURFLENBQ0csQ0FESCxFQUVGQyxPQUZFLENBRU0zQixZQUZOLEVBRW9CLFVBQUM0QixFQUFELEVBQUtDLENBQUw7QUFBQSxtQkFBV2xCLFlBQVlrQixDQUFaLENBQVg7QUFBQSxTQUZwQixFQUdGQyxTQUhFLEVBQVA7QUFJSDtBQUVELFdBQVlDLEtBQUtDLFNBQUwsQ0FBZUMsU0FBZixDQUF5QixVQUFDQyxHQUFELEVBQVk7QUFDN0MsWUFBSSx3QkFBV0EsR0FBWCxFQUFnQnRDLFdBQWhCLENBQUosRUFBa0M7QUFDOUIsZ0JBQU11QyxNQUFNRCxJQUFJRSxNQUFKLENBQVd4QyxZQUFZeUMsTUFBdkIsQ0FBWjs7QUFEOEIsNkJBRUdGLElBQUlHLEtBQUosQ0FBVSxHQUFWLENBRkg7QUFBQTtBQUFBLGdCQUV2QnhDLFlBRnVCO0FBQUEsZ0JBRVRDLFFBRlM7O0FBRzlCLG1CQUFPRixpQkFBaUJDLFlBQWpCLEVBQStCQyxRQUEvQixDQUFQO0FBQ0g7QUFDSixLQU5XLENBQVo7QUFPSCIsImZpbGUiOiJsaWIvc2VydmVyL21ldGFkYXRhLWVkaXRvci5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7VGV4dEVkaXRvcn0gZnJvbSAnYXRvbSc7XHJcbmltcG9ydCB7c3RhcnRzV2l0aH0gZnJvbSAnbG9kYXNoJztcclxuaW1wb3J0IHtJRGlzcG9zYWJsZX0gZnJvbSAndHMtZGlzcG9zYWJsZXMnO1xyXG5pbXBvcnQge09tbmlzaGFycEVkaXRvckNvbnRleHQsIElPbW5pc2hhcnBUZXh0RWRpdG9yfSBmcm9tICcuL29tbmlzaGFycC10ZXh0LWVkaXRvcic7XHJcbmltcG9ydCB7U29sdXRpb259IGZyb20gJy4vc29sdXRpb24nO1xyXG5pbXBvcnQge1NvbHV0aW9uTWFuYWdlcn0gZnJvbSAnLi9zb2x1dGlvbi1tYW5hZ2VyJztcclxuXHJcbmNvbnN0IG1ldGFkYXRhVXJpID0gJ29tbmlzaGFycDovL21ldGFkYXRhLyc7XHJcbmV4cG9ydCBmdW5jdGlvbiBtZXRhZGF0YU9wZW5lcigpOiBJRGlzcG9zYWJsZSB7XHJcbiAgICBmdW5jdGlvbiBjcmVhdGVFZGl0b3JWaWV3KGFzc2VtYmx5TmFtZTogc3RyaW5nLCB0eXBlTmFtZTogc3RyaW5nKSB7XHJcbiAgICAgICAgZnVuY3Rpb24gaXNzdWVSZXF1ZXN0KHNvbHV0aW9uOiBTb2x1dGlvbikge1xyXG4gICAgICAgICAgICByZXR1cm4gc29sdXRpb24ucmVxdWVzdDxhbnksIHsgU291cmNlOiBzdHJpbmc7IFNvdXJjZU5hbWU6IHN0cmluZyB9PignbWV0YWRhdGEnLCB7IEFzc2VtYmx5TmFtZTogYXNzZW1ibHlOYW1lLCBUeXBlTmFtZTogdHlwZU5hbWUgfSlcclxuICAgICAgICAgICAgICAgIC5tYXAocmVzcG9uc2UgPT4gKHsgc291cmNlOiByZXNwb25zZS5Tb3VyY2UsIHBhdGg6IHJlc3BvbnNlLlNvdXJjZU5hbWUsIHNvbHV0aW9uIH0pKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIHNldHVwRWRpdG9yKHtzb2x1dGlvbiwgcGF0aCwgc291cmNlfTogeyBzb2x1dGlvbjogU29sdXRpb247IHNvdXJjZTogc3RyaW5nOyBwYXRoOiBzdHJpbmcgfSkge1xyXG4gICAgICAgICAgICBjb25zdCBlZGl0b3IgPSBuZXcgVGV4dEVkaXRvcih7fSk7XHJcbiAgICAgICAgICAgIGVkaXRvci5zZXRUZXh0KHNvdXJjZSk7XHJcbiAgICAgICAgICAgIGVkaXRvci5vbldpbGxJbnNlcnRUZXh0KGUgPT4gZS5jYW5jZWwoKSk7XHJcbiAgICAgICAgICAgIGVkaXRvci5nZXRCdWZmZXIoKS5zZXRQYXRoKHBhdGgpO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgY29udGV4dCA9IG5ldyBPbW5pc2hhcnBFZGl0b3JDb250ZXh0KGVkaXRvciwgc29sdXRpb24pO1xyXG4gICAgICAgICAgICBjb250ZXh0Lm1ldGFkYXRhID0gdHJ1ZTtcclxuICAgICAgICAgICAgY29uc3QgcmVzdWx0OiBJT21uaXNoYXJwVGV4dEVkaXRvciA9IDxhbnk+ZWRpdG9yO1xyXG4gICAgICAgICAgICByZXN1bHQub21uaXNoYXJwID0gY29udGV4dDtcclxuXHJcbiAgICAgICAgICAgIGVkaXRvci5zYXZlID0gZnVuY3Rpb24gKCkgeyAvKiAqLyB9O1xyXG4gICAgICAgICAgICBlZGl0b3Iuc2F2ZUFzID0gZnVuY3Rpb24gKCkgeyAvKiAqLyB9O1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGVkaXRvcjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBTb2x1dGlvbk1hbmFnZXIuYWN0aXZlU29sdXRpb25cclxuICAgICAgICAgICAgLnRha2UoMSlcclxuICAgICAgICAgICAgLmZsYXRNYXAoaXNzdWVSZXF1ZXN0LCAoX3osIHopID0+IHNldHVwRWRpdG9yKHopKVxyXG4gICAgICAgICAgICAudG9Qcm9taXNlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIDxhbnk+YXRvbS53b3Jrc3BhY2UuYWRkT3BlbmVyKCh1cmk6IHN0cmluZykgPT4ge1xyXG4gICAgICAgIGlmIChzdGFydHNXaXRoKHVyaSwgbWV0YWRhdGFVcmkpKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHVybCA9IHVyaS5zdWJzdHIobWV0YWRhdGFVcmkubGVuZ3RoKTtcclxuICAgICAgICAgICAgY29uc3QgW2Fzc2VtYmx5TmFtZSwgdHlwZU5hbWVdID0gdXJsLnNwbGl0KCcvJyk7XHJcbiAgICAgICAgICAgIHJldHVybiBjcmVhdGVFZGl0b3JWaWV3KGFzc2VtYmx5TmFtZSwgdHlwZU5hbWUpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59XHJcbiJdfQ==
