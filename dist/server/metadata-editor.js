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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9zZXJ2ZXIvbWV0YWRhdGEtZWRpdG9yLnRzIiwibGliL3NlcnZlci9tZXRhZGF0YS1lZGl0b3IuanMiXSwibmFtZXMiOlsibWV0YWRhdGFPcGVuZXIiLCJtZXRhZGF0YVVyaSIsImNyZWF0ZUVkaXRvclZpZXciLCJhc3NlbWJseU5hbWUiLCJ0eXBlTmFtZSIsImlzc3VlUmVxdWVzdCIsInNvbHV0aW9uIiwicmVxdWVzdCIsIkFzc2VtYmx5TmFtZSIsIlR5cGVOYW1lIiwibWFwIiwic291cmNlIiwicmVzcG9uc2UiLCJTb3VyY2UiLCJwYXRoIiwiU291cmNlTmFtZSIsInNldHVwRWRpdG9yIiwiZWRpdG9yIiwic2V0VGV4dCIsIm9uV2lsbEluc2VydFRleHQiLCJlIiwiY2FuY2VsIiwiZ2V0QnVmZmVyIiwic2V0UGF0aCIsImNvbnRleHQiLCJtZXRhZGF0YSIsInJlc3VsdCIsIm9tbmlzaGFycCIsInNhdmUiLCJzYXZlQXMiLCJhY3RpdmVTb2x1dGlvbiIsInRha2UiLCJmbGF0TWFwIiwiX3oiLCJ6IiwidG9Qcm9taXNlIiwiYXRvbSIsIndvcmtzcGFjZSIsImFkZE9wZW5lciIsInVyaSIsInVybCIsInN1YnN0ciIsImxlbmd0aCIsInNwbGl0Il0sIm1hcHBpbmdzIjoiOzs7Ozs7OztRQVFBQSxjLEdBQUFBLGM7O0FDUkE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FESUEsSUFBTUMsY0FBYyx1QkFBcEI7QUFDQSxTQUFBRCxjQUFBLEdBQUE7QUFDSSxhQUFBRSxnQkFBQSxDQUEwQkMsWUFBMUIsRUFBZ0RDLFFBQWhELEVBQWdFO0FBQzVELGlCQUFBQyxZQUFBLENBQXNCQyxRQUF0QixFQUF3QztBQUNwQyxtQkFBT0EsU0FBU0MsT0FBVCxDQUE4RCxVQUE5RCxFQUEwRSxFQUFFQyxjQUFjTCxZQUFoQixFQUE4Qk0sVUFBVUwsUUFBeEMsRUFBMUUsRUFDRk0sR0FERSxDQUNFO0FBQUEsdUJBQWEsRUFBRUMsUUFBUUMsU0FBU0MsTUFBbkIsRUFBMkJDLE1BQU1GLFNBQVNHLFVBQTFDLEVBQXNEVCxrQkFBdEQsRUFBYjtBQUFBLGFBREYsQ0FBUDtBQUVIO0FBRUQsaUJBQUFVLFdBQUEsT0FBbUc7QUFBQSxnQkFBN0VWLFFBQTZFLFFBQTdFQSxRQUE2RTtBQUFBLGdCQUFuRVEsSUFBbUUsUUFBbkVBLElBQW1FO0FBQUEsZ0JBQTdESCxNQUE2RCxRQUE3REEsTUFBNkQ7O0FBQy9GLGdCQUFNTSxTQUFTLHFCQUFlLEVBQWYsQ0FBZjtBQUNBQSxtQkFBT0MsT0FBUCxDQUFlUCxNQUFmO0FBQ0FNLG1CQUFPRSxnQkFBUCxDQUF3QixVQUFDQyxDQUFEO0FBQUEsdUJBQU9BLEVBQUVDLE1BQUYsRUFBUDtBQUFBLGFBQXhCO0FBQ0FKLG1CQUFPSyxTQUFQLEdBQW1CQyxPQUFuQixDQUEyQlQsSUFBM0I7QUFFQSxnQkFBTVUsVUFBVSxnREFBMkJQLE1BQTNCLEVBQW1DWCxRQUFuQyxDQUFoQjtBQUNBa0Isb0JBQVFDLFFBQVIsR0FBbUIsSUFBbkI7QUFDQSxnQkFBTUMsU0FBbUNULE1BQXpDO0FBQ0FTLG1CQUFPQyxTQUFQLEdBQW1CSCxPQUFuQjtBQUVBUCxtQkFBT1csSUFBUCxHQUFjLFlBQUEsQ0FBb0IsQ0FBbEM7QUFDQVgsbUJBQU9ZLE1BQVAsR0FBZ0IsWUFBQSxDQUFvQixDQUFwQztBQUVBLG1CQUFPWixNQUFQO0FBQ0g7QUFFRCxlQUFPLGlDQUFnQmEsY0FBaEIsQ0FDRkMsSUFERSxDQUNHLENBREgsRUFFRkMsT0FGRSxDQUVNM0IsWUFGTixFQUVvQixVQUFDNEIsRUFBRCxFQUFLQyxDQUFMO0FBQUEsbUJBQVdsQixZQUFZa0IsQ0FBWixDQUFYO0FBQUEsU0FGcEIsRUFHRkMsU0FIRSxFQUFQO0FBSUg7QUFFRCxXQUFZQyxLQUFLQyxTQUFMLENBQWVDLFNBQWYsQ0FBeUIsVUFBQ0MsR0FBRCxFQUFZO0FBQzdDLFlBQUksd0JBQVdBLEdBQVgsRUFBZ0J0QyxXQUFoQixDQUFKLEVBQWtDO0FBQzlCLGdCQUFNdUMsTUFBTUQsSUFBSUUsTUFBSixDQUFXeEMsWUFBWXlDLE1BQXZCLENBQVo7O0FBRDhCLDZCQUVHRixJQUFJRyxLQUFKLENBQVUsR0FBVixDQUZIOztBQUFBOztBQUFBLGdCQUV2QnhDLFlBRnVCO0FBQUEsZ0JBRVRDLFFBRlM7O0FBRzlCLG1CQUFPRixpQkFBaUJDLFlBQWpCLEVBQStCQyxRQUEvQixDQUFQO0FBQ0g7QUFDSixLQU5XLENBQVo7QUFPSCIsImZpbGUiOiJsaWIvc2VydmVyL21ldGFkYXRhLWVkaXRvci5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7U29sdXRpb259IGZyb20gXCIuL3NvbHV0aW9uXCI7XHJcbmltcG9ydCB7VGV4dEVkaXRvcn0gZnJvbSBcImF0b21cIjtcclxuaW1wb3J0IHtTb2x1dGlvbk1hbmFnZXJ9IGZyb20gXCIuL3NvbHV0aW9uLW1hbmFnZXJcIjtcclxuaW1wb3J0IHtzdGFydHNXaXRofSBmcm9tIFwibG9kYXNoXCI7XHJcbmltcG9ydCB7T21uaXNoYXJwVGV4dEVkaXRvciwgT21uaXNoYXJwRWRpdG9yQ29udGV4dH0gZnJvbSBcIi4vb21uaXNoYXJwLXRleHQtZWRpdG9yXCI7XHJcbmltcG9ydCB7SURpc3Bvc2FibGV9IGZyb20gXCJ0cy1kaXNwb3NhYmxlc1wiO1xyXG5cclxuY29uc3QgbWV0YWRhdGFVcmkgPSBcIm9tbmlzaGFycDovL21ldGFkYXRhL1wiO1xyXG5leHBvcnQgZnVuY3Rpb24gbWV0YWRhdGFPcGVuZXIoKTogSURpc3Bvc2FibGUge1xyXG4gICAgZnVuY3Rpb24gY3JlYXRlRWRpdG9yVmlldyhhc3NlbWJseU5hbWU6IHN0cmluZywgdHlwZU5hbWU6IHN0cmluZykge1xyXG4gICAgICAgIGZ1bmN0aW9uIGlzc3VlUmVxdWVzdChzb2x1dGlvbjogU29sdXRpb24pIHtcclxuICAgICAgICAgICAgcmV0dXJuIHNvbHV0aW9uLnJlcXVlc3Q8YW55LCB7IFNvdXJjZTogc3RyaW5nOyBTb3VyY2VOYW1lOiBzdHJpbmcgfT4oXCJtZXRhZGF0YVwiLCB7IEFzc2VtYmx5TmFtZTogYXNzZW1ibHlOYW1lLCBUeXBlTmFtZTogdHlwZU5hbWUgfSlcclxuICAgICAgICAgICAgICAgIC5tYXAocmVzcG9uc2UgPT4gKHsgc291cmNlOiByZXNwb25zZS5Tb3VyY2UsIHBhdGg6IHJlc3BvbnNlLlNvdXJjZU5hbWUsIHNvbHV0aW9uIH0pKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIHNldHVwRWRpdG9yKHtzb2x1dGlvbiwgcGF0aCwgc291cmNlfTogeyBzb2x1dGlvbjogU29sdXRpb247IHNvdXJjZTogc3RyaW5nOyBwYXRoOiBzdHJpbmcgfSkge1xyXG4gICAgICAgICAgICBjb25zdCBlZGl0b3IgPSBuZXcgVGV4dEVkaXRvcih7fSk7XHJcbiAgICAgICAgICAgIGVkaXRvci5zZXRUZXh0KHNvdXJjZSk7XHJcbiAgICAgICAgICAgIGVkaXRvci5vbldpbGxJbnNlcnRUZXh0KChlKSA9PiBlLmNhbmNlbCgpKTtcclxuICAgICAgICAgICAgZWRpdG9yLmdldEJ1ZmZlcigpLnNldFBhdGgocGF0aCk7XHJcblxyXG4gICAgICAgICAgICBjb25zdCBjb250ZXh0ID0gbmV3IE9tbmlzaGFycEVkaXRvckNvbnRleHQoZWRpdG9yLCBzb2x1dGlvbik7XHJcbiAgICAgICAgICAgIGNvbnRleHQubWV0YWRhdGEgPSB0cnVlO1xyXG4gICAgICAgICAgICBjb25zdCByZXN1bHQ6IE9tbmlzaGFycFRleHRFZGl0b3IgPSA8YW55PmVkaXRvcjtcclxuICAgICAgICAgICAgcmVzdWx0Lm9tbmlzaGFycCA9IGNvbnRleHQ7XHJcblxyXG4gICAgICAgICAgICBlZGl0b3Iuc2F2ZSA9IGZ1bmN0aW9uKCkgeyAvKiAqLyB9O1xyXG4gICAgICAgICAgICBlZGl0b3Iuc2F2ZUFzID0gZnVuY3Rpb24oKSB7IC8qICovIH07XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gZWRpdG9yO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIFNvbHV0aW9uTWFuYWdlci5hY3RpdmVTb2x1dGlvblxyXG4gICAgICAgICAgICAudGFrZSgxKVxyXG4gICAgICAgICAgICAuZmxhdE1hcChpc3N1ZVJlcXVlc3QsIChfeiwgeikgPT4gc2V0dXBFZGl0b3IoeikpXHJcbiAgICAgICAgICAgIC50b1Byb21pc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gPGFueT5hdG9tLndvcmtzcGFjZS5hZGRPcGVuZXIoKHVyaTogc3RyaW5nKSA9PiB7XHJcbiAgICAgICAgaWYgKHN0YXJ0c1dpdGgodXJpLCBtZXRhZGF0YVVyaSkpIHtcclxuICAgICAgICAgICAgY29uc3QgdXJsID0gdXJpLnN1YnN0cihtZXRhZGF0YVVyaS5sZW5ndGgpO1xyXG4gICAgICAgICAgICBjb25zdCBbYXNzZW1ibHlOYW1lLCB0eXBlTmFtZV0gPSB1cmwuc3BsaXQoXCIvXCIpO1xyXG4gICAgICAgICAgICByZXR1cm4gY3JlYXRlRWRpdG9yVmlldyhhc3NlbWJseU5hbWUsIHR5cGVOYW1lKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufVxyXG4iLCJpbXBvcnQgeyBUZXh0RWRpdG9yIH0gZnJvbSBcImF0b21cIjtcbmltcG9ydCB7IFNvbHV0aW9uTWFuYWdlciB9IGZyb20gXCIuL3NvbHV0aW9uLW1hbmFnZXJcIjtcbmltcG9ydCB7IHN0YXJ0c1dpdGggfSBmcm9tIFwibG9kYXNoXCI7XG5pbXBvcnQgeyBPbW5pc2hhcnBFZGl0b3JDb250ZXh0IH0gZnJvbSBcIi4vb21uaXNoYXJwLXRleHQtZWRpdG9yXCI7XG5jb25zdCBtZXRhZGF0YVVyaSA9IFwib21uaXNoYXJwOi8vbWV0YWRhdGEvXCI7XG5leHBvcnQgZnVuY3Rpb24gbWV0YWRhdGFPcGVuZXIoKSB7XG4gICAgZnVuY3Rpb24gY3JlYXRlRWRpdG9yVmlldyhhc3NlbWJseU5hbWUsIHR5cGVOYW1lKSB7XG4gICAgICAgIGZ1bmN0aW9uIGlzc3VlUmVxdWVzdChzb2x1dGlvbikge1xuICAgICAgICAgICAgcmV0dXJuIHNvbHV0aW9uLnJlcXVlc3QoXCJtZXRhZGF0YVwiLCB7IEFzc2VtYmx5TmFtZTogYXNzZW1ibHlOYW1lLCBUeXBlTmFtZTogdHlwZU5hbWUgfSlcbiAgICAgICAgICAgICAgICAubWFwKHJlc3BvbnNlID0+ICh7IHNvdXJjZTogcmVzcG9uc2UuU291cmNlLCBwYXRoOiByZXNwb25zZS5Tb3VyY2VOYW1lLCBzb2x1dGlvbiB9KSk7XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gc2V0dXBFZGl0b3IoeyBzb2x1dGlvbiwgcGF0aCwgc291cmNlIH0pIHtcbiAgICAgICAgICAgIGNvbnN0IGVkaXRvciA9IG5ldyBUZXh0RWRpdG9yKHt9KTtcbiAgICAgICAgICAgIGVkaXRvci5zZXRUZXh0KHNvdXJjZSk7XG4gICAgICAgICAgICBlZGl0b3Iub25XaWxsSW5zZXJ0VGV4dCgoZSkgPT4gZS5jYW5jZWwoKSk7XG4gICAgICAgICAgICBlZGl0b3IuZ2V0QnVmZmVyKCkuc2V0UGF0aChwYXRoKTtcbiAgICAgICAgICAgIGNvbnN0IGNvbnRleHQgPSBuZXcgT21uaXNoYXJwRWRpdG9yQ29udGV4dChlZGl0b3IsIHNvbHV0aW9uKTtcbiAgICAgICAgICAgIGNvbnRleHQubWV0YWRhdGEgPSB0cnVlO1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gZWRpdG9yO1xuICAgICAgICAgICAgcmVzdWx0Lm9tbmlzaGFycCA9IGNvbnRleHQ7XG4gICAgICAgICAgICBlZGl0b3Iuc2F2ZSA9IGZ1bmN0aW9uICgpIHsgfTtcbiAgICAgICAgICAgIGVkaXRvci5zYXZlQXMgPSBmdW5jdGlvbiAoKSB7IH07XG4gICAgICAgICAgICByZXR1cm4gZWRpdG9yO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBTb2x1dGlvbk1hbmFnZXIuYWN0aXZlU29sdXRpb25cbiAgICAgICAgICAgIC50YWtlKDEpXG4gICAgICAgICAgICAuZmxhdE1hcChpc3N1ZVJlcXVlc3QsIChfeiwgeikgPT4gc2V0dXBFZGl0b3IoeikpXG4gICAgICAgICAgICAudG9Qcm9taXNlKCk7XG4gICAgfVxuICAgIHJldHVybiBhdG9tLndvcmtzcGFjZS5hZGRPcGVuZXIoKHVyaSkgPT4ge1xuICAgICAgICBpZiAoc3RhcnRzV2l0aCh1cmksIG1ldGFkYXRhVXJpKSkge1xuICAgICAgICAgICAgY29uc3QgdXJsID0gdXJpLnN1YnN0cihtZXRhZGF0YVVyaS5sZW5ndGgpO1xuICAgICAgICAgICAgY29uc3QgW2Fzc2VtYmx5TmFtZSwgdHlwZU5hbWVdID0gdXJsLnNwbGl0KFwiL1wiKTtcbiAgICAgICAgICAgIHJldHVybiBjcmVhdGVFZGl0b3JWaWV3KGFzc2VtYmx5TmFtZSwgdHlwZU5hbWUpO1xuICAgICAgICB9XG4gICAgfSk7XG59XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
