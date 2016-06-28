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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9zZXJ2ZXIvbWV0YWRhdGEtZWRpdG9yLnRzIiwibGliL3NlcnZlci9tZXRhZGF0YS1lZGl0b3IuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7UUFRQTs7QUNSQTs7QUFDQTs7QUFDQTs7QUFDQTs7QURJQSxJQUFNLGNBQWMsdUJBQWQ7QUFDTixTQUFBLGNBQUEsR0FBQTtBQUNJLGFBQUEsZ0JBQUEsQ0FBMEIsWUFBMUIsRUFBZ0QsUUFBaEQsRUFBZ0U7QUFDNUQsaUJBQUEsWUFBQSxDQUFzQixRQUF0QixFQUF3QztBQUNwQyxtQkFBTyxTQUFTLE9BQVQsQ0FBOEQsVUFBOUQsRUFBMEUsRUFBRSxjQUFjLFlBQWQsRUFBNEIsVUFBVSxRQUFWLEVBQXhHLEVBQ0YsR0FERSxDQUNFO3VCQUFhLEVBQUUsUUFBUSxTQUFTLE1BQVQsRUFBaUIsTUFBTSxTQUFTLFVBQVQsRUFBcUIsa0JBQXREO2FBQWIsQ0FEVCxDQURvQztTQUF4QztBQUtBLGlCQUFBLFdBQUEsT0FBbUc7Z0JBQTdFLHlCQUE2RTtnQkFBbkUsaUJBQW1FO2dCQUE3RCxxQkFBNkQ7O0FBQy9GLGdCQUFNLFNBQVMscUJBQWUsRUFBZixDQUFULENBRHlGO0FBRS9GLG1CQUFPLE9BQVAsQ0FBZSxNQUFmLEVBRitGO0FBRy9GLG1CQUFPLGdCQUFQLENBQXdCLFVBQUMsQ0FBRDt1QkFBTyxFQUFFLE1BQUY7YUFBUCxDQUF4QixDQUgrRjtBQUkvRixtQkFBTyxTQUFQLEdBQW1CLE9BQW5CLENBQTJCLElBQTNCLEVBSitGO0FBTS9GLGdCQUFNLFVBQVUsZ0RBQTJCLE1BQTNCLEVBQW1DLFFBQW5DLENBQVYsQ0FOeUY7QUFPL0Ysb0JBQVEsUUFBUixHQUFtQixJQUFuQixDQVArRjtBQVEvRixnQkFBTSxTQUFtQyxNQUFuQyxDQVJ5RjtBQVMvRixtQkFBTyxTQUFQLEdBQW1CLE9BQW5CLENBVCtGO0FBVy9GLG1CQUFPLElBQVAsR0FBYyxZQUFBLEVBQUEsQ0FYaUY7QUFZL0YsbUJBQU8sTUFBUCxHQUFnQixZQUFBLEVBQUEsQ0FaK0U7QUFjL0YsbUJBQU8sTUFBUCxDQWQrRjtTQUFuRztBQWlCQSxlQUFPLGlDQUFnQixjQUFoQixDQUNGLElBREUsQ0FDRyxDQURILEVBRUYsT0FGRSxDQUVNLFlBRk4sRUFFb0IsVUFBQyxFQUFELEVBQUssQ0FBTDttQkFBVyxZQUFZLENBQVo7U0FBWCxDQUZwQixDQUdGLFNBSEUsRUFBUCxDQXZCNEQ7S0FBaEU7QUE2QkEsV0FBWSxLQUFLLFNBQUwsQ0FBZSxTQUFmLENBQXlCLFVBQUMsR0FBRCxFQUFZO0FBQzdDLFlBQUksd0JBQVcsR0FBWCxFQUFnQixXQUFoQixDQUFKLEVBQWtDO0FBQzlCLGdCQUFNLE1BQU0sSUFBSSxNQUFKLENBQVcsWUFBWSxNQUFaLENBQWpCLENBRHdCOzs2QkFFRyxJQUFJLEtBQUosQ0FBVSxHQUFWLEVBRkg7Ozs7Z0JBRXZCLDhCQUZ1QjtnQkFFVCwwQkFGUzs7QUFHOUIsbUJBQU8saUJBQWlCLFlBQWpCLEVBQStCLFFBQS9CLENBQVAsQ0FIOEI7U0FBbEM7S0FEaUMsQ0FBckMsQ0E5Qko7Q0FBQSIsImZpbGUiOiJsaWIvc2VydmVyL21ldGFkYXRhLWVkaXRvci5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7U29sdXRpb259IGZyb20gXCIuL3NvbHV0aW9uXCI7XHJcbmltcG9ydCB7VGV4dEVkaXRvcn0gZnJvbSBcImF0b21cIjtcclxuaW1wb3J0IHtTb2x1dGlvbk1hbmFnZXJ9IGZyb20gXCIuL3NvbHV0aW9uLW1hbmFnZXJcIjtcclxuaW1wb3J0IHtzdGFydHNXaXRofSBmcm9tIFwibG9kYXNoXCI7XHJcbmltcG9ydCB7T21uaXNoYXJwVGV4dEVkaXRvciwgT21uaXNoYXJwRWRpdG9yQ29udGV4dH0gZnJvbSBcIi4vb21uaXNoYXJwLXRleHQtZWRpdG9yXCI7XHJcbmltcG9ydCB7SURpc3Bvc2FibGV9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XHJcblxyXG5jb25zdCBtZXRhZGF0YVVyaSA9IFwib21uaXNoYXJwOi8vbWV0YWRhdGEvXCI7XHJcbmV4cG9ydCBmdW5jdGlvbiBtZXRhZGF0YU9wZW5lcigpOiBJRGlzcG9zYWJsZSB7XHJcbiAgICBmdW5jdGlvbiBjcmVhdGVFZGl0b3JWaWV3KGFzc2VtYmx5TmFtZTogc3RyaW5nLCB0eXBlTmFtZTogc3RyaW5nKSB7XHJcbiAgICAgICAgZnVuY3Rpb24gaXNzdWVSZXF1ZXN0KHNvbHV0aW9uOiBTb2x1dGlvbikge1xyXG4gICAgICAgICAgICByZXR1cm4gc29sdXRpb24ucmVxdWVzdDxhbnksIHsgU291cmNlOiBzdHJpbmc7IFNvdXJjZU5hbWU6IHN0cmluZyB9PihcIm1ldGFkYXRhXCIsIHsgQXNzZW1ibHlOYW1lOiBhc3NlbWJseU5hbWUsIFR5cGVOYW1lOiB0eXBlTmFtZSB9KVxyXG4gICAgICAgICAgICAgICAgLm1hcChyZXNwb25zZSA9PiAoeyBzb3VyY2U6IHJlc3BvbnNlLlNvdXJjZSwgcGF0aDogcmVzcG9uc2UuU291cmNlTmFtZSwgc29sdXRpb24gfSkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gc2V0dXBFZGl0b3Ioe3NvbHV0aW9uLCBwYXRoLCBzb3VyY2V9OiB7IHNvbHV0aW9uOiBTb2x1dGlvbjsgc291cmNlOiBzdHJpbmc7IHBhdGg6IHN0cmluZyB9KSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGVkaXRvciA9IG5ldyBUZXh0RWRpdG9yKHt9KTtcclxuICAgICAgICAgICAgZWRpdG9yLnNldFRleHQoc291cmNlKTtcclxuICAgICAgICAgICAgZWRpdG9yLm9uV2lsbEluc2VydFRleHQoKGUpID0+IGUuY2FuY2VsKCkpO1xyXG4gICAgICAgICAgICBlZGl0b3IuZ2V0QnVmZmVyKCkuc2V0UGF0aChwYXRoKTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IGNvbnRleHQgPSBuZXcgT21uaXNoYXJwRWRpdG9yQ29udGV4dChlZGl0b3IsIHNvbHV0aW9uKTtcclxuICAgICAgICAgICAgY29udGV4dC5tZXRhZGF0YSA9IHRydWU7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdDogT21uaXNoYXJwVGV4dEVkaXRvciA9IDxhbnk+ZWRpdG9yO1xyXG4gICAgICAgICAgICByZXN1bHQub21uaXNoYXJwID0gY29udGV4dDtcclxuXHJcbiAgICAgICAgICAgIGVkaXRvci5zYXZlID0gZnVuY3Rpb24oKSB7IC8qICovIH07XHJcbiAgICAgICAgICAgIGVkaXRvci5zYXZlQXMgPSBmdW5jdGlvbigpIHsgLyogKi8gfTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBlZGl0b3I7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gU29sdXRpb25NYW5hZ2VyLmFjdGl2ZVNvbHV0aW9uXHJcbiAgICAgICAgICAgIC50YWtlKDEpXHJcbiAgICAgICAgICAgIC5mbGF0TWFwKGlzc3VlUmVxdWVzdCwgKF96LCB6KSA9PiBzZXR1cEVkaXRvcih6KSlcclxuICAgICAgICAgICAgLnRvUHJvbWlzZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiA8YW55PmF0b20ud29ya3NwYWNlLmFkZE9wZW5lcigodXJpOiBzdHJpbmcpID0+IHtcclxuICAgICAgICBpZiAoc3RhcnRzV2l0aCh1cmksIG1ldGFkYXRhVXJpKSkge1xyXG4gICAgICAgICAgICBjb25zdCB1cmwgPSB1cmkuc3Vic3RyKG1ldGFkYXRhVXJpLmxlbmd0aCk7XHJcbiAgICAgICAgICAgIGNvbnN0IFthc3NlbWJseU5hbWUsIHR5cGVOYW1lXSA9IHVybC5zcGxpdChcIi9cIik7XHJcbiAgICAgICAgICAgIHJldHVybiBjcmVhdGVFZGl0b3JWaWV3KGFzc2VtYmx5TmFtZSwgdHlwZU5hbWUpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59XHJcbiIsImltcG9ydCB7IFRleHRFZGl0b3IgfSBmcm9tIFwiYXRvbVwiO1xuaW1wb3J0IHsgU29sdXRpb25NYW5hZ2VyIH0gZnJvbSBcIi4vc29sdXRpb24tbWFuYWdlclwiO1xuaW1wb3J0IHsgc3RhcnRzV2l0aCB9IGZyb20gXCJsb2Rhc2hcIjtcbmltcG9ydCB7IE9tbmlzaGFycEVkaXRvckNvbnRleHQgfSBmcm9tIFwiLi9vbW5pc2hhcnAtdGV4dC1lZGl0b3JcIjtcbmNvbnN0IG1ldGFkYXRhVXJpID0gXCJvbW5pc2hhcnA6Ly9tZXRhZGF0YS9cIjtcbmV4cG9ydCBmdW5jdGlvbiBtZXRhZGF0YU9wZW5lcigpIHtcbiAgICBmdW5jdGlvbiBjcmVhdGVFZGl0b3JWaWV3KGFzc2VtYmx5TmFtZSwgdHlwZU5hbWUpIHtcbiAgICAgICAgZnVuY3Rpb24gaXNzdWVSZXF1ZXN0KHNvbHV0aW9uKSB7XG4gICAgICAgICAgICByZXR1cm4gc29sdXRpb24ucmVxdWVzdChcIm1ldGFkYXRhXCIsIHsgQXNzZW1ibHlOYW1lOiBhc3NlbWJseU5hbWUsIFR5cGVOYW1lOiB0eXBlTmFtZSB9KVxuICAgICAgICAgICAgICAgIC5tYXAocmVzcG9uc2UgPT4gKHsgc291cmNlOiByZXNwb25zZS5Tb3VyY2UsIHBhdGg6IHJlc3BvbnNlLlNvdXJjZU5hbWUsIHNvbHV0aW9uIH0pKTtcbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBzZXR1cEVkaXRvcih7IHNvbHV0aW9uLCBwYXRoLCBzb3VyY2UgfSkge1xuICAgICAgICAgICAgY29uc3QgZWRpdG9yID0gbmV3IFRleHRFZGl0b3Ioe30pO1xuICAgICAgICAgICAgZWRpdG9yLnNldFRleHQoc291cmNlKTtcbiAgICAgICAgICAgIGVkaXRvci5vbldpbGxJbnNlcnRUZXh0KChlKSA9PiBlLmNhbmNlbCgpKTtcbiAgICAgICAgICAgIGVkaXRvci5nZXRCdWZmZXIoKS5zZXRQYXRoKHBhdGgpO1xuICAgICAgICAgICAgY29uc3QgY29udGV4dCA9IG5ldyBPbW5pc2hhcnBFZGl0b3JDb250ZXh0KGVkaXRvciwgc29sdXRpb24pO1xuICAgICAgICAgICAgY29udGV4dC5tZXRhZGF0YSA9IHRydWU7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBlZGl0b3I7XG4gICAgICAgICAgICByZXN1bHQub21uaXNoYXJwID0gY29udGV4dDtcbiAgICAgICAgICAgIGVkaXRvci5zYXZlID0gZnVuY3Rpb24gKCkgeyB9O1xuICAgICAgICAgICAgZWRpdG9yLnNhdmVBcyA9IGZ1bmN0aW9uICgpIHsgfTtcbiAgICAgICAgICAgIHJldHVybiBlZGl0b3I7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFNvbHV0aW9uTWFuYWdlci5hY3RpdmVTb2x1dGlvblxuICAgICAgICAgICAgLnRha2UoMSlcbiAgICAgICAgICAgIC5mbGF0TWFwKGlzc3VlUmVxdWVzdCwgKF96LCB6KSA9PiBzZXR1cEVkaXRvcih6KSlcbiAgICAgICAgICAgIC50b1Byb21pc2UoKTtcbiAgICB9XG4gICAgcmV0dXJuIGF0b20ud29ya3NwYWNlLmFkZE9wZW5lcigodXJpKSA9PiB7XG4gICAgICAgIGlmIChzdGFydHNXaXRoKHVyaSwgbWV0YWRhdGFVcmkpKSB7XG4gICAgICAgICAgICBjb25zdCB1cmwgPSB1cmkuc3Vic3RyKG1ldGFkYXRhVXJpLmxlbmd0aCk7XG4gICAgICAgICAgICBjb25zdCBbYXNzZW1ibHlOYW1lLCB0eXBlTmFtZV0gPSB1cmwuc3BsaXQoXCIvXCIpO1xuICAgICAgICAgICAgcmV0dXJuIGNyZWF0ZUVkaXRvclZpZXcoYXNzZW1ibHlOYW1lLCB0eXBlTmFtZSk7XG4gICAgICAgIH1cbiAgICB9KTtcbn1cbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
