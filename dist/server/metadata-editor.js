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

            var _url$split = url.split("/"),
                _url$split2 = _slicedToArray(_url$split, 2),
                assemblyName = _url$split2[0],
                typeName = _url$split2[1];

            return createEditorView(assemblyName, typeName);
        }
    });
}
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9zZXJ2ZXIvbWV0YWRhdGEtZWRpdG9yLnRzIiwibGliL3NlcnZlci9tZXRhZGF0YS1lZGl0b3IuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7UUFRQTs7QUNSQTs7QUFDQTs7QUFDQTs7QUFDQTs7QURJQSxJQUFNLGNBQWMsdUJBQWQ7QUFDTixTQUFBLGNBQUEsR0FBQTtBQUNJLGFBQUEsZ0JBQUEsQ0FBMEIsWUFBMUIsRUFBZ0QsUUFBaEQsRUFBZ0U7QUFDNUQsaUJBQUEsWUFBQSxDQUFzQixRQUF0QixFQUF3QztBQUNwQyxtQkFBTyxTQUFTLE9BQVQsQ0FBOEQsVUFBOUQsRUFBMEUsRUFBRSxjQUFjLFlBQWQsRUFBNEIsVUFBVSxRQUFWLEVBQXhHLEVBQ0YsR0FERSxDQUNFO3VCQUFhLEVBQUUsUUFBUSxTQUFTLE1BQVQsRUFBaUIsTUFBTSxTQUFTLFVBQVQsRUFBcUIsa0JBQXREO2FBQWIsQ0FEVCxDQURvQztTQUF4QztBQUtBLGlCQUFBLFdBQUEsT0FBbUc7Z0JBQTdFO2dCQUFVO2dCQUFNLHFCQUE2RDs7QUFDL0YsZ0JBQU0sU0FBUyxxQkFBZSxFQUFmLENBQVQsQ0FEeUY7QUFFL0YsbUJBQU8sT0FBUCxDQUFlLE1BQWYsRUFGK0Y7QUFHL0YsbUJBQU8sZ0JBQVAsQ0FBd0IsVUFBQyxDQUFEO3VCQUFPLEVBQUUsTUFBRjthQUFQLENBQXhCLENBSCtGO0FBSS9GLG1CQUFPLFNBQVAsR0FBbUIsT0FBbkIsQ0FBMkIsSUFBM0IsRUFKK0Y7QUFNL0YsZ0JBQU0sVUFBVSxnREFBMkIsTUFBM0IsRUFBbUMsUUFBbkMsQ0FBVixDQU55RjtBQU8vRixvQkFBUSxRQUFSLEdBQW1CLElBQW5CLENBUCtGO0FBUS9GLGdCQUFNLFNBQW1DLE1BQW5DLENBUnlGO0FBUy9GLG1CQUFPLFNBQVAsR0FBbUIsT0FBbkIsQ0FUK0Y7QUFXL0YsbUJBQU8sSUFBUCxHQUFjLFlBQUEsRUFBQSxDQVhpRjtBQVkvRixtQkFBTyxNQUFQLEdBQWdCLFlBQUEsRUFBQSxDQVorRTtBQWMvRixtQkFBTyxNQUFQLENBZCtGO1NBQW5HO0FBaUJBLGVBQU8saUNBQWdCLGNBQWhCLENBQ0YsSUFERSxDQUNHLENBREgsRUFFRixPQUZFLENBRU0sWUFGTixFQUVvQixVQUFDLEVBQUQsRUFBSyxDQUFMO21CQUFXLFlBQVksQ0FBWjtTQUFYLENBRnBCLENBR0YsU0FIRSxFQUFQLENBdkI0RDtLQUFoRTtBQTZCQSxXQUFZLEtBQUssU0FBTCxDQUFlLFNBQWYsQ0FBeUIsVUFBQyxHQUFELEVBQVk7QUFDN0MsWUFBSSx3QkFBVyxHQUFYLEVBQWdCLFdBQWhCLENBQUosRUFBa0M7QUFDOUIsZ0JBQU0sTUFBTSxJQUFJLE1BQUosQ0FBVyxZQUFZLE1BQVosQ0FBakIsQ0FEd0I7OzZCQUVHLElBQUksS0FBSixDQUFVLEdBQVY7O2dCQUExQjtnQkFBYywwQkFGUzs7QUFHOUIsbUJBQU8saUJBQWlCLFlBQWpCLEVBQStCLFFBQS9CLENBQVAsQ0FIOEI7U0FBbEM7S0FEaUMsQ0FBckMsQ0E5Qko7Q0FBQSIsImZpbGUiOiJsaWIvc2VydmVyL21ldGFkYXRhLWVkaXRvci5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7U29sdXRpb259IGZyb20gXCIuL3NvbHV0aW9uXCI7XHJcbmltcG9ydCB7VGV4dEVkaXRvcn0gZnJvbSBcImF0b21cIjtcclxuaW1wb3J0IHtTb2x1dGlvbk1hbmFnZXJ9IGZyb20gXCIuL3NvbHV0aW9uLW1hbmFnZXJcIjtcclxuaW1wb3J0IHtzdGFydHNXaXRofSBmcm9tIFwibG9kYXNoXCI7XHJcbmltcG9ydCB7T21uaXNoYXJwVGV4dEVkaXRvciwgT21uaXNoYXJwRWRpdG9yQ29udGV4dH0gZnJvbSBcIi4vb21uaXNoYXJwLXRleHQtZWRpdG9yXCI7XHJcbmltcG9ydCB7SURpc3Bvc2FibGV9IGZyb20gXCJ0cy1kaXNwb3NhYmxlc1wiO1xyXG5cclxuY29uc3QgbWV0YWRhdGFVcmkgPSBcIm9tbmlzaGFycDovL21ldGFkYXRhL1wiO1xyXG5leHBvcnQgZnVuY3Rpb24gbWV0YWRhdGFPcGVuZXIoKTogSURpc3Bvc2FibGUge1xyXG4gICAgZnVuY3Rpb24gY3JlYXRlRWRpdG9yVmlldyhhc3NlbWJseU5hbWU6IHN0cmluZywgdHlwZU5hbWU6IHN0cmluZykge1xyXG4gICAgICAgIGZ1bmN0aW9uIGlzc3VlUmVxdWVzdChzb2x1dGlvbjogU29sdXRpb24pIHtcclxuICAgICAgICAgICAgcmV0dXJuIHNvbHV0aW9uLnJlcXVlc3Q8YW55LCB7IFNvdXJjZTogc3RyaW5nOyBTb3VyY2VOYW1lOiBzdHJpbmcgfT4oXCJtZXRhZGF0YVwiLCB7IEFzc2VtYmx5TmFtZTogYXNzZW1ibHlOYW1lLCBUeXBlTmFtZTogdHlwZU5hbWUgfSlcclxuICAgICAgICAgICAgICAgIC5tYXAocmVzcG9uc2UgPT4gKHsgc291cmNlOiByZXNwb25zZS5Tb3VyY2UsIHBhdGg6IHJlc3BvbnNlLlNvdXJjZU5hbWUsIHNvbHV0aW9uIH0pKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIHNldHVwRWRpdG9yKHtzb2x1dGlvbiwgcGF0aCwgc291cmNlfTogeyBzb2x1dGlvbjogU29sdXRpb247IHNvdXJjZTogc3RyaW5nOyBwYXRoOiBzdHJpbmcgfSkge1xyXG4gICAgICAgICAgICBjb25zdCBlZGl0b3IgPSBuZXcgVGV4dEVkaXRvcih7fSk7XHJcbiAgICAgICAgICAgIGVkaXRvci5zZXRUZXh0KHNvdXJjZSk7XHJcbiAgICAgICAgICAgIGVkaXRvci5vbldpbGxJbnNlcnRUZXh0KChlKSA9PiBlLmNhbmNlbCgpKTtcclxuICAgICAgICAgICAgZWRpdG9yLmdldEJ1ZmZlcigpLnNldFBhdGgocGF0aCk7XHJcblxyXG4gICAgICAgICAgICBjb25zdCBjb250ZXh0ID0gbmV3IE9tbmlzaGFycEVkaXRvckNvbnRleHQoZWRpdG9yLCBzb2x1dGlvbik7XHJcbiAgICAgICAgICAgIGNvbnRleHQubWV0YWRhdGEgPSB0cnVlO1xyXG4gICAgICAgICAgICBjb25zdCByZXN1bHQ6IE9tbmlzaGFycFRleHRFZGl0b3IgPSA8YW55PmVkaXRvcjtcclxuICAgICAgICAgICAgcmVzdWx0Lm9tbmlzaGFycCA9IGNvbnRleHQ7XHJcblxyXG4gICAgICAgICAgICBlZGl0b3Iuc2F2ZSA9IGZ1bmN0aW9uKCkgeyAvKiAqLyB9O1xyXG4gICAgICAgICAgICBlZGl0b3Iuc2F2ZUFzID0gZnVuY3Rpb24oKSB7IC8qICovIH07XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gZWRpdG9yO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIFNvbHV0aW9uTWFuYWdlci5hY3RpdmVTb2x1dGlvblxyXG4gICAgICAgICAgICAudGFrZSgxKVxyXG4gICAgICAgICAgICAuZmxhdE1hcChpc3N1ZVJlcXVlc3QsIChfeiwgeikgPT4gc2V0dXBFZGl0b3IoeikpXHJcbiAgICAgICAgICAgIC50b1Byb21pc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gPGFueT5hdG9tLndvcmtzcGFjZS5hZGRPcGVuZXIoKHVyaTogc3RyaW5nKSA9PiB7XHJcbiAgICAgICAgaWYgKHN0YXJ0c1dpdGgodXJpLCBtZXRhZGF0YVVyaSkpIHtcclxuICAgICAgICAgICAgY29uc3QgdXJsID0gdXJpLnN1YnN0cihtZXRhZGF0YVVyaS5sZW5ndGgpO1xyXG4gICAgICAgICAgICBjb25zdCBbYXNzZW1ibHlOYW1lLCB0eXBlTmFtZV0gPSB1cmwuc3BsaXQoXCIvXCIpO1xyXG4gICAgICAgICAgICByZXR1cm4gY3JlYXRlRWRpdG9yVmlldyhhc3NlbWJseU5hbWUsIHR5cGVOYW1lKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufVxyXG4iLCJpbXBvcnQgeyBUZXh0RWRpdG9yIH0gZnJvbSBcImF0b21cIjtcbmltcG9ydCB7IFNvbHV0aW9uTWFuYWdlciB9IGZyb20gXCIuL3NvbHV0aW9uLW1hbmFnZXJcIjtcbmltcG9ydCB7IHN0YXJ0c1dpdGggfSBmcm9tIFwibG9kYXNoXCI7XG5pbXBvcnQgeyBPbW5pc2hhcnBFZGl0b3JDb250ZXh0IH0gZnJvbSBcIi4vb21uaXNoYXJwLXRleHQtZWRpdG9yXCI7XG5jb25zdCBtZXRhZGF0YVVyaSA9IFwib21uaXNoYXJwOi8vbWV0YWRhdGEvXCI7XG5leHBvcnQgZnVuY3Rpb24gbWV0YWRhdGFPcGVuZXIoKSB7XG4gICAgZnVuY3Rpb24gY3JlYXRlRWRpdG9yVmlldyhhc3NlbWJseU5hbWUsIHR5cGVOYW1lKSB7XG4gICAgICAgIGZ1bmN0aW9uIGlzc3VlUmVxdWVzdChzb2x1dGlvbikge1xuICAgICAgICAgICAgcmV0dXJuIHNvbHV0aW9uLnJlcXVlc3QoXCJtZXRhZGF0YVwiLCB7IEFzc2VtYmx5TmFtZTogYXNzZW1ibHlOYW1lLCBUeXBlTmFtZTogdHlwZU5hbWUgfSlcbiAgICAgICAgICAgICAgICAubWFwKHJlc3BvbnNlID0+ICh7IHNvdXJjZTogcmVzcG9uc2UuU291cmNlLCBwYXRoOiByZXNwb25zZS5Tb3VyY2VOYW1lLCBzb2x1dGlvbiB9KSk7XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gc2V0dXBFZGl0b3IoeyBzb2x1dGlvbiwgcGF0aCwgc291cmNlIH0pIHtcbiAgICAgICAgICAgIGNvbnN0IGVkaXRvciA9IG5ldyBUZXh0RWRpdG9yKHt9KTtcbiAgICAgICAgICAgIGVkaXRvci5zZXRUZXh0KHNvdXJjZSk7XG4gICAgICAgICAgICBlZGl0b3Iub25XaWxsSW5zZXJ0VGV4dCgoZSkgPT4gZS5jYW5jZWwoKSk7XG4gICAgICAgICAgICBlZGl0b3IuZ2V0QnVmZmVyKCkuc2V0UGF0aChwYXRoKTtcbiAgICAgICAgICAgIGNvbnN0IGNvbnRleHQgPSBuZXcgT21uaXNoYXJwRWRpdG9yQ29udGV4dChlZGl0b3IsIHNvbHV0aW9uKTtcbiAgICAgICAgICAgIGNvbnRleHQubWV0YWRhdGEgPSB0cnVlO1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gZWRpdG9yO1xuICAgICAgICAgICAgcmVzdWx0Lm9tbmlzaGFycCA9IGNvbnRleHQ7XG4gICAgICAgICAgICBlZGl0b3Iuc2F2ZSA9IGZ1bmN0aW9uICgpIHsgfTtcbiAgICAgICAgICAgIGVkaXRvci5zYXZlQXMgPSBmdW5jdGlvbiAoKSB7IH07XG4gICAgICAgICAgICByZXR1cm4gZWRpdG9yO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBTb2x1dGlvbk1hbmFnZXIuYWN0aXZlU29sdXRpb25cbiAgICAgICAgICAgIC50YWtlKDEpXG4gICAgICAgICAgICAuZmxhdE1hcChpc3N1ZVJlcXVlc3QsIChfeiwgeikgPT4gc2V0dXBFZGl0b3IoeikpXG4gICAgICAgICAgICAudG9Qcm9taXNlKCk7XG4gICAgfVxuICAgIHJldHVybiBhdG9tLndvcmtzcGFjZS5hZGRPcGVuZXIoKHVyaSkgPT4ge1xuICAgICAgICBpZiAoc3RhcnRzV2l0aCh1cmksIG1ldGFkYXRhVXJpKSkge1xuICAgICAgICAgICAgY29uc3QgdXJsID0gdXJpLnN1YnN0cihtZXRhZGF0YVVyaS5sZW5ndGgpO1xuICAgICAgICAgICAgY29uc3QgW2Fzc2VtYmx5TmFtZSwgdHlwZU5hbWVdID0gdXJsLnNwbGl0KFwiL1wiKTtcbiAgICAgICAgICAgIHJldHVybiBjcmVhdGVFZGl0b3JWaWV3KGFzc2VtYmx5TmFtZSwgdHlwZU5hbWUpO1xuICAgICAgICB9XG4gICAgfSk7XG59XG4iXX0=
