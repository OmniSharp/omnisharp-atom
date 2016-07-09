"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

exports.metadataOpener = metadataOpener;

var _atom = require("atom");

var _solutionManager = require("./solution-manager");

var _lodash = require("lodash");

var _omnisharpTextEditor = require("./omnisharp-text-editor");

var metadataUri = "omnisharp://metadata/";
function metadataOpener() {
    function createEditorView(assemblyName, typeName) {
        function issueRequest(solution) {
            return solution.request("metadata", { AssemblyName: assemblyName, TypeName: typeName }).map(function (response) {
                return { source: response.Source, path: response.SourceName, solution: solution };
            });
        }
        function setupEditor(_ref) {
            var solution = _ref.solution;
            var path = _ref.path;
            var source = _ref.source;

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

            var _url$split = url.split("/");

            var _url$split2 = _slicedToArray(_url$split, 2);

            var assemblyName = _url$split2[0];
            var typeName = _url$split2[1];

            return createEditorView(assemblyName, typeName);
        }
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9zZXJ2ZXIvbWV0YWRhdGEtZWRpdG9yLnRzIiwibGliL3NlcnZlci9tZXRhZGF0YS1lZGl0b3IuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7UUFRQSxjLEdBQUEsYzs7QUNSQTs7QUFDQTs7QUFDQTs7QUFDQTs7QURJQSxJQUFNLGNBQWMsdUJBQXBCO0FBQ0EsU0FBQSxjQUFBLEdBQUE7QUFDSSxhQUFBLGdCQUFBLENBQTBCLFlBQTFCLEVBQWdELFFBQWhELEVBQWdFO0FBQzVELGlCQUFBLFlBQUEsQ0FBc0IsUUFBdEIsRUFBd0M7QUFDcEMsbUJBQU8sU0FBUyxPQUFULENBQThELFVBQTlELEVBQTBFLEVBQUUsY0FBYyxZQUFoQixFQUE4QixVQUFVLFFBQXhDLEVBQTFFLEVBQ0YsR0FERSxDQUNFO0FBQUEsdUJBQWEsRUFBRSxRQUFRLFNBQVMsTUFBbkIsRUFBMkIsTUFBTSxTQUFTLFVBQTFDLEVBQXNELGtCQUF0RCxFQUFiO0FBQUEsYUFERixDQUFQO0FBRUg7QUFFRCxpQkFBQSxXQUFBLE9BQW1HO0FBQUEsZ0JBQTdFLFFBQTZFLFFBQTdFLFFBQTZFO0FBQUEsZ0JBQW5FLElBQW1FLFFBQW5FLElBQW1FO0FBQUEsZ0JBQTdELE1BQTZELFFBQTdELE1BQTZEOztBQUMvRixnQkFBTSxTQUFTLHFCQUFlLEVBQWYsQ0FBZjtBQUNBLG1CQUFPLE9BQVAsQ0FBZSxNQUFmO0FBQ0EsbUJBQU8sZ0JBQVAsQ0FBd0IsVUFBQyxDQUFEO0FBQUEsdUJBQU8sRUFBRSxNQUFGLEVBQVA7QUFBQSxhQUF4QjtBQUNBLG1CQUFPLFNBQVAsR0FBbUIsT0FBbkIsQ0FBMkIsSUFBM0I7QUFFQSxnQkFBTSxVQUFVLGdEQUEyQixNQUEzQixFQUFtQyxRQUFuQyxDQUFoQjtBQUNBLG9CQUFRLFFBQVIsR0FBbUIsSUFBbkI7QUFDQSxnQkFBTSxTQUFtQyxNQUF6QztBQUNBLG1CQUFPLFNBQVAsR0FBbUIsT0FBbkI7QUFFQSxtQkFBTyxJQUFQLEdBQWMsWUFBQSxDQUFvQixDQUFsQztBQUNBLG1CQUFPLE1BQVAsR0FBZ0IsWUFBQSxDQUFvQixDQUFwQztBQUVBLG1CQUFPLE1BQVA7QUFDSDtBQUVELGVBQU8saUNBQWdCLGNBQWhCLENBQ0YsSUFERSxDQUNHLENBREgsRUFFRixPQUZFLENBRU0sWUFGTixFQUVvQixVQUFDLEVBQUQsRUFBSyxDQUFMO0FBQUEsbUJBQVcsWUFBWSxDQUFaLENBQVg7QUFBQSxTQUZwQixFQUdGLFNBSEUsRUFBUDtBQUlIO0FBRUQsV0FBWSxLQUFLLFNBQUwsQ0FBZSxTQUFmLENBQXlCLFVBQUMsR0FBRCxFQUFZO0FBQzdDLFlBQUksd0JBQVcsR0FBWCxFQUFnQixXQUFoQixDQUFKLEVBQWtDO0FBQzlCLGdCQUFNLE1BQU0sSUFBSSxNQUFKLENBQVcsWUFBWSxNQUF2QixDQUFaOztBQUQ4Qiw2QkFFRyxJQUFJLEtBQUosQ0FBVSxHQUFWLENBRkg7O0FBQUE7O0FBQUEsZ0JBRXZCLFlBRnVCO0FBQUEsZ0JBRVQsUUFGUzs7QUFHOUIsbUJBQU8saUJBQWlCLFlBQWpCLEVBQStCLFFBQS9CLENBQVA7QUFDSDtBQUNKLEtBTlcsQ0FBWjtBQU9IIiwiZmlsZSI6ImxpYi9zZXJ2ZXIvbWV0YWRhdGEtZWRpdG9yLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtTb2x1dGlvbn0gZnJvbSBcIi4vc29sdXRpb25cIjtcclxuaW1wb3J0IHtUZXh0RWRpdG9yfSBmcm9tIFwiYXRvbVwiO1xyXG5pbXBvcnQge1NvbHV0aW9uTWFuYWdlcn0gZnJvbSBcIi4vc29sdXRpb24tbWFuYWdlclwiO1xyXG5pbXBvcnQge3N0YXJ0c1dpdGh9IGZyb20gXCJsb2Rhc2hcIjtcclxuaW1wb3J0IHtPbW5pc2hhcnBUZXh0RWRpdG9yLCBPbW5pc2hhcnBFZGl0b3JDb250ZXh0fSBmcm9tIFwiLi9vbW5pc2hhcnAtdGV4dC1lZGl0b3JcIjtcclxuaW1wb3J0IHtJRGlzcG9zYWJsZX0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcclxuXHJcbmNvbnN0IG1ldGFkYXRhVXJpID0gXCJvbW5pc2hhcnA6Ly9tZXRhZGF0YS9cIjtcclxuZXhwb3J0IGZ1bmN0aW9uIG1ldGFkYXRhT3BlbmVyKCk6IElEaXNwb3NhYmxlIHtcclxuICAgIGZ1bmN0aW9uIGNyZWF0ZUVkaXRvclZpZXcoYXNzZW1ibHlOYW1lOiBzdHJpbmcsIHR5cGVOYW1lOiBzdHJpbmcpIHtcclxuICAgICAgICBmdW5jdGlvbiBpc3N1ZVJlcXVlc3Qoc29sdXRpb246IFNvbHV0aW9uKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBzb2x1dGlvbi5yZXF1ZXN0PGFueSwgeyBTb3VyY2U6IHN0cmluZzsgU291cmNlTmFtZTogc3RyaW5nIH0+KFwibWV0YWRhdGFcIiwgeyBBc3NlbWJseU5hbWU6IGFzc2VtYmx5TmFtZSwgVHlwZU5hbWU6IHR5cGVOYW1lIH0pXHJcbiAgICAgICAgICAgICAgICAubWFwKHJlc3BvbnNlID0+ICh7IHNvdXJjZTogcmVzcG9uc2UuU291cmNlLCBwYXRoOiByZXNwb25zZS5Tb3VyY2VOYW1lLCBzb2x1dGlvbiB9KSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBzZXR1cEVkaXRvcih7c29sdXRpb24sIHBhdGgsIHNvdXJjZX06IHsgc29sdXRpb246IFNvbHV0aW9uOyBzb3VyY2U6IHN0cmluZzsgcGF0aDogc3RyaW5nIH0pIHtcclxuICAgICAgICAgICAgY29uc3QgZWRpdG9yID0gbmV3IFRleHRFZGl0b3Ioe30pO1xyXG4gICAgICAgICAgICBlZGl0b3Iuc2V0VGV4dChzb3VyY2UpO1xyXG4gICAgICAgICAgICBlZGl0b3Iub25XaWxsSW5zZXJ0VGV4dCgoZSkgPT4gZS5jYW5jZWwoKSk7XHJcbiAgICAgICAgICAgIGVkaXRvci5nZXRCdWZmZXIoKS5zZXRQYXRoKHBhdGgpO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgY29udGV4dCA9IG5ldyBPbW5pc2hhcnBFZGl0b3JDb250ZXh0KGVkaXRvciwgc29sdXRpb24pO1xyXG4gICAgICAgICAgICBjb250ZXh0Lm1ldGFkYXRhID0gdHJ1ZTtcclxuICAgICAgICAgICAgY29uc3QgcmVzdWx0OiBPbW5pc2hhcnBUZXh0RWRpdG9yID0gPGFueT5lZGl0b3I7XHJcbiAgICAgICAgICAgIHJlc3VsdC5vbW5pc2hhcnAgPSBjb250ZXh0O1xyXG5cclxuICAgICAgICAgICAgZWRpdG9yLnNhdmUgPSBmdW5jdGlvbigpIHsgLyogKi8gfTtcclxuICAgICAgICAgICAgZWRpdG9yLnNhdmVBcyA9IGZ1bmN0aW9uKCkgeyAvKiAqLyB9O1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGVkaXRvcjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBTb2x1dGlvbk1hbmFnZXIuYWN0aXZlU29sdXRpb25cclxuICAgICAgICAgICAgLnRha2UoMSlcclxuICAgICAgICAgICAgLmZsYXRNYXAoaXNzdWVSZXF1ZXN0LCAoX3osIHopID0+IHNldHVwRWRpdG9yKHopKVxyXG4gICAgICAgICAgICAudG9Qcm9taXNlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIDxhbnk+YXRvbS53b3Jrc3BhY2UuYWRkT3BlbmVyKCh1cmk6IHN0cmluZykgPT4ge1xyXG4gICAgICAgIGlmIChzdGFydHNXaXRoKHVyaSwgbWV0YWRhdGFVcmkpKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHVybCA9IHVyaS5zdWJzdHIobWV0YWRhdGFVcmkubGVuZ3RoKTtcclxuICAgICAgICAgICAgY29uc3QgW2Fzc2VtYmx5TmFtZSwgdHlwZU5hbWVdID0gdXJsLnNwbGl0KFwiL1wiKTtcclxuICAgICAgICAgICAgcmV0dXJuIGNyZWF0ZUVkaXRvclZpZXcoYXNzZW1ibHlOYW1lLCB0eXBlTmFtZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuIiwiaW1wb3J0IHsgVGV4dEVkaXRvciB9IGZyb20gXCJhdG9tXCI7XG5pbXBvcnQgeyBTb2x1dGlvbk1hbmFnZXIgfSBmcm9tIFwiLi9zb2x1dGlvbi1tYW5hZ2VyXCI7XG5pbXBvcnQgeyBzdGFydHNXaXRoIH0gZnJvbSBcImxvZGFzaFwiO1xuaW1wb3J0IHsgT21uaXNoYXJwRWRpdG9yQ29udGV4dCB9IGZyb20gXCIuL29tbmlzaGFycC10ZXh0LWVkaXRvclwiO1xuY29uc3QgbWV0YWRhdGFVcmkgPSBcIm9tbmlzaGFycDovL21ldGFkYXRhL1wiO1xuZXhwb3J0IGZ1bmN0aW9uIG1ldGFkYXRhT3BlbmVyKCkge1xuICAgIGZ1bmN0aW9uIGNyZWF0ZUVkaXRvclZpZXcoYXNzZW1ibHlOYW1lLCB0eXBlTmFtZSkge1xuICAgICAgICBmdW5jdGlvbiBpc3N1ZVJlcXVlc3Qoc29sdXRpb24pIHtcbiAgICAgICAgICAgIHJldHVybiBzb2x1dGlvbi5yZXF1ZXN0KFwibWV0YWRhdGFcIiwgeyBBc3NlbWJseU5hbWU6IGFzc2VtYmx5TmFtZSwgVHlwZU5hbWU6IHR5cGVOYW1lIH0pXG4gICAgICAgICAgICAgICAgLm1hcChyZXNwb25zZSA9PiAoeyBzb3VyY2U6IHJlc3BvbnNlLlNvdXJjZSwgcGF0aDogcmVzcG9uc2UuU291cmNlTmFtZSwgc29sdXRpb24gfSkpO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIHNldHVwRWRpdG9yKHsgc29sdXRpb24sIHBhdGgsIHNvdXJjZSB9KSB7XG4gICAgICAgICAgICBjb25zdCBlZGl0b3IgPSBuZXcgVGV4dEVkaXRvcih7fSk7XG4gICAgICAgICAgICBlZGl0b3Iuc2V0VGV4dChzb3VyY2UpO1xuICAgICAgICAgICAgZWRpdG9yLm9uV2lsbEluc2VydFRleHQoKGUpID0+IGUuY2FuY2VsKCkpO1xuICAgICAgICAgICAgZWRpdG9yLmdldEJ1ZmZlcigpLnNldFBhdGgocGF0aCk7XG4gICAgICAgICAgICBjb25zdCBjb250ZXh0ID0gbmV3IE9tbmlzaGFycEVkaXRvckNvbnRleHQoZWRpdG9yLCBzb2x1dGlvbik7XG4gICAgICAgICAgICBjb250ZXh0Lm1ldGFkYXRhID0gdHJ1ZTtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGVkaXRvcjtcbiAgICAgICAgICAgIHJlc3VsdC5vbW5pc2hhcnAgPSBjb250ZXh0O1xuICAgICAgICAgICAgZWRpdG9yLnNhdmUgPSBmdW5jdGlvbiAoKSB7IH07XG4gICAgICAgICAgICBlZGl0b3Iuc2F2ZUFzID0gZnVuY3Rpb24gKCkgeyB9O1xuICAgICAgICAgICAgcmV0dXJuIGVkaXRvcjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gU29sdXRpb25NYW5hZ2VyLmFjdGl2ZVNvbHV0aW9uXG4gICAgICAgICAgICAudGFrZSgxKVxuICAgICAgICAgICAgLmZsYXRNYXAoaXNzdWVSZXF1ZXN0LCAoX3osIHopID0+IHNldHVwRWRpdG9yKHopKVxuICAgICAgICAgICAgLnRvUHJvbWlzZSgpO1xuICAgIH1cbiAgICByZXR1cm4gYXRvbS53b3Jrc3BhY2UuYWRkT3BlbmVyKCh1cmkpID0+IHtcbiAgICAgICAgaWYgKHN0YXJ0c1dpdGgodXJpLCBtZXRhZGF0YVVyaSkpIHtcbiAgICAgICAgICAgIGNvbnN0IHVybCA9IHVyaS5zdWJzdHIobWV0YWRhdGFVcmkubGVuZ3RoKTtcbiAgICAgICAgICAgIGNvbnN0IFthc3NlbWJseU5hbWUsIHR5cGVOYW1lXSA9IHVybC5zcGxpdChcIi9cIik7XG4gICAgICAgICAgICByZXR1cm4gY3JlYXRlRWRpdG9yVmlldyhhc3NlbWJseU5hbWUsIHR5cGVOYW1lKTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
