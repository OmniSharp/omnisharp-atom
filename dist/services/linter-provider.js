'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.init = init;
exports.registerIndie = registerIndie;

var _omni = require('../server/omni');

var _lodash = require('lodash');

var _tsDisposables = require('ts-disposables');

var Range = require('atom').Range;

function mapIndieValues(error) {
    var level = error.LogLevel.toLowerCase();
    return {
        type: level,
        text: error.Text + ' [' + _omni.Omni.getFrameworks(error.Projects) + '] ',
        filePath: error.FileName,
        range: new Range([error.Line, error.Column], [error.EndLine, error.EndColumn])
    };
}
function showLinter() {
    (0, _lodash.each)(document.querySelectorAll('linter-bottom-tab'), function (element) {
        element.style.display = '';
    });
    (0, _lodash.each)(document.querySelectorAll('linter-bottom-status'), function (element) {
        element.style.display = '';
    });
    var panel = document.querySelector('linter-panel');
    if (panel) panel.style.display = '';
}
function hideLinter() {
    (0, _lodash.each)(document.querySelectorAll('linter-bottom-tab'), function (element) {
        element.style.display = 'none';
    });
    (0, _lodash.each)(document.querySelectorAll('linter-bottom-status'), function (element) {
        element.style.display = 'none';
    });
    var panel = document.querySelector('linter-panel');
    if (panel) panel.style.display = 'none';
}
var showHiddenDiagnostics = true;
function init(linter) {
    var disposable = new _tsDisposables.CompositeDisposable();
    var cd = void 0;
    disposable.add(atom.config.observe('omnisharp-atom.hideLinterInterface', function (hidden) {
        if (hidden) {
            cd = new _tsDisposables.CompositeDisposable();
            disposable.add(cd);
            cd.add(_omni.Omni.activeEditor.filter(function (z) {
                return !z;
            }).subscribe(showLinter));
            cd.add(_omni.Omni.activeEditor.filter(function (z) {
                return !!z;
            }).subscribe(hideLinter));
        } else {
            if (cd) {
                disposable.remove(cd);
                cd.dispose();
            }
            showLinter();
        }
    }));
    disposable.add(atom.config.observe('omnisharp-atom.showHiddenDiagnostics', function (show) {
        showHiddenDiagnostics = show;
        atom.workspace.getTextEditors().forEach(function (editor) {
            var editorLinter = linter.getEditorLinter(editor);
            if (editorLinter) {
                editorLinter.lint(true);
            }
        });
    }));
    disposable.add(_omni.Omni.activeEditor.filter(function (z) {
        return !!z;
    }).take(1).delay(1000).subscribe(function (e) {
        _omni.Omni.whenEditorConnected(e).subscribe(function () {
            atom.workspace.getTextEditors().forEach(function (editor) {
                var editorLinter = linter.getEditorLinter(editor);
                if (editorLinter) {
                    editorLinter.lint(true);
                }
            });
        });
    }));
    return disposable;
}
function registerIndie(registry, disposable) {
    var linter = registry.register({ name: 'c#' });
    disposable.add(linter, _omni.Omni.diagnostics.subscribe(function (diagnostics) {
        var messages = [];
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = diagnostics[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var item = _step.value;

                if (showHiddenDiagnostics || item.LogLevel !== 'Hidden') {
                    messages.push(mapIndieValues(item));
                }
            }
        } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion && _iterator.return) {
                    _iterator.return();
                }
            } finally {
                if (_didIteratorError) {
                    throw _iteratorError;
                }
            }
        }

        linter.setMessages(messages);
    }));
}
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9zZXJ2aWNlcy9saW50ZXItcHJvdmlkZXIudHMiXSwibmFtZXMiOlsiaW5pdCIsInJlZ2lzdGVySW5kaWUiLCJSYW5nZSIsInJlcXVpcmUiLCJtYXBJbmRpZVZhbHVlcyIsImVycm9yIiwibGV2ZWwiLCJMb2dMZXZlbCIsInRvTG93ZXJDYXNlIiwidHlwZSIsInRleHQiLCJUZXh0IiwiZ2V0RnJhbWV3b3JrcyIsIlByb2plY3RzIiwiZmlsZVBhdGgiLCJGaWxlTmFtZSIsInJhbmdlIiwiTGluZSIsIkNvbHVtbiIsIkVuZExpbmUiLCJFbmRDb2x1bW4iLCJzaG93TGludGVyIiwiZG9jdW1lbnQiLCJxdWVyeVNlbGVjdG9yQWxsIiwiZWxlbWVudCIsInN0eWxlIiwiZGlzcGxheSIsInBhbmVsIiwicXVlcnlTZWxlY3RvciIsImhpZGVMaW50ZXIiLCJzaG93SGlkZGVuRGlhZ25vc3RpY3MiLCJsaW50ZXIiLCJkaXNwb3NhYmxlIiwiY2QiLCJhZGQiLCJhdG9tIiwiY29uZmlnIiwib2JzZXJ2ZSIsImhpZGRlbiIsImFjdGl2ZUVkaXRvciIsImZpbHRlciIsInoiLCJzdWJzY3JpYmUiLCJyZW1vdmUiLCJkaXNwb3NlIiwic2hvdyIsIndvcmtzcGFjZSIsImdldFRleHRFZGl0b3JzIiwiZm9yRWFjaCIsImVkaXRvckxpbnRlciIsImdldEVkaXRvckxpbnRlciIsImVkaXRvciIsImxpbnQiLCJ0YWtlIiwiZGVsYXkiLCJ3aGVuRWRpdG9yQ29ubmVjdGVkIiwiZSIsInJlZ2lzdHJ5IiwicmVnaXN0ZXIiLCJuYW1lIiwiZGlhZ25vc3RpY3MiLCJtZXNzYWdlcyIsIml0ZW0iLCJwdXNoIiwic2V0TWVzc2FnZXMiXSwibWFwcGluZ3MiOiI7Ozs7O1FBMERNQSxJLEdBQUFBLEk7UUFrREFDLGEsR0FBQUEsYTs7QUEzR047O0FBSUE7O0FBQ0E7O0FBSEEsSUFBTUMsUUFBUUMsUUFBUSxNQUFSLEVBQWdCRCxLQUE5Qjs7QUEwQkEsU0FBQUUsY0FBQSxDQUF3QkMsS0FB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QWYsQ0FBZDtBQUNIO0FBQ0o7QUFOaUI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFRbEIvQixlQUFPaUMsV0FBUCxDQUFtQkgsUUFBbkI7QUFDSCxLQVZMLENBRko7QUFjSCIsImZpbGUiOiJsaWIvc2VydmljZXMvbGludGVyLXByb3ZpZGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTW9kZWxzIH0gZnJvbSAnb21uaXNoYXJwLWNsaWVudCc7XHJcbmltcG9ydCB7IE9tbmkgfSBmcm9tICcuLi9zZXJ2ZXIvb21uaSc7XHJcbi8qIHRzbGludDpkaXNhYmxlOnZhcmlhYmxlLW5hbWUgKi9cclxuY29uc3QgUmFuZ2UgPSByZXF1aXJlKCdhdG9tJykuUmFuZ2U7XHJcbi8qIHRzbGludDplbmFibGU6dmFyaWFibGUtbmFtZSAqL1xyXG5pbXBvcnQgeyBlYWNoIH0gZnJvbSAnbG9kYXNoJztcclxuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSB9IGZyb20gJ3RzLWRpc3Bvc2FibGVzJztcclxuXHJcbmludGVyZmFjZSBMaW50ZXJNZXNzYWdlIHtcclxuICAgIHR5cGU6IHN0cmluZzsgLy8gXCJlcnJvclwiIHwgXCJ3YXJuaW5nXCJcclxuICAgIHRleHQ/OiBzdHJpbmc7XHJcbiAgICBodG1sPzogc3RyaW5nO1xyXG4gICAgZmlsZVBhdGg/OiBzdHJpbmc7XHJcbiAgICByYW5nZT86IFJhbmdlO1xyXG4gICAgW2tleTogc3RyaW5nXTogYW55O1xyXG59XHJcblxyXG5pbnRlcmZhY2UgSW5kaWVSZWdpc3RyeSB7XHJcbiAgICByZWdpc3RlcihvcHRpb25zOiB7IG5hbWU6IHN0cmluZzsgfSk6IEluZGllO1xyXG4gICAgaGFzKGluZGllOiBhbnkpOiBCb29sZWFuO1xyXG4gICAgdW5yZWdpc3RlcihpbmRpZTogYW55KTogdm9pZDtcclxufVxyXG5cclxuaW50ZXJmYWNlIEluZGllIHtcclxuICAgIHNldE1lc3NhZ2VzKG1lc3NhZ2VzOiBMaW50ZXJNZXNzYWdlW10pOiB2b2lkO1xyXG4gICAgZGVsZXRlTWVzc2FnZXMoKTogdm9pZDtcclxuICAgIGRpc3Bvc2UoKTogdm9pZDtcclxufVxyXG5cclxuZnVuY3Rpb24gbWFwSW5kaWVWYWx1ZXMoZXJyb3I6IE1vZGVscy5EaWFnbm9zdGljTG9jYXRpb24pOiBMaW50ZXJNZXNzYWdlIHtcclxuICAgIGNvbnN0IGxldmVsID0gZXJyb3IuTG9nTGV2ZWwudG9Mb3dlckNhc2UoKTtcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHR5cGU6IGxldmVsLFxyXG4gICAgICAgIHRleHQ6IGAke2Vycm9yLlRleHR9IFske09tbmkuZ2V0RnJhbWV3b3JrcyhlcnJvci5Qcm9qZWN0cyl9XSBgLFxyXG4gICAgICAgIGZpbGVQYXRoOiBlcnJvci5GaWxlTmFtZSxcclxuICAgICAgICByYW5nZTogbmV3IFJhbmdlKFtlcnJvci5MaW5lLCBlcnJvci5Db2x1bW5dLCBbZXJyb3IuRW5kTGluZSwgZXJyb3IuRW5kQ29sdW1uXSlcclxuICAgIH07XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNob3dMaW50ZXIoKSB7XHJcbiAgICBlYWNoKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ2xpbnRlci1ib3R0b20tdGFiJyksIChlbGVtZW50OiBIVE1MRWxlbWVudCkgPT4geyBlbGVtZW50LnN0eWxlLmRpc3BsYXkgPSAnJzsgfSk7XHJcbiAgICBlYWNoKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ2xpbnRlci1ib3R0b20tc3RhdHVzJyksIChlbGVtZW50OiBIVE1MRWxlbWVudCkgPT4geyBlbGVtZW50LnN0eWxlLmRpc3BsYXkgPSAnJzsgfSk7XHJcbiAgICBjb25zdCBwYW5lbCA9IDxIVE1MRWxlbWVudD5kb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdsaW50ZXItcGFuZWwnKTtcclxuICAgIGlmIChwYW5lbClcclxuICAgICAgICBwYW5lbC5zdHlsZS5kaXNwbGF5ID0gJyc7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGhpZGVMaW50ZXIoKSB7XHJcbiAgICBlYWNoKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ2xpbnRlci1ib3R0b20tdGFiJyksIChlbGVtZW50OiBIVE1MRWxlbWVudCkgPT4geyBlbGVtZW50LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7IH0pO1xyXG4gICAgZWFjaChkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdsaW50ZXItYm90dG9tLXN0YXR1cycpLCAoZWxlbWVudDogSFRNTEVsZW1lbnQpID0+IHsgZWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnOyB9KTtcclxuICAgIGNvbnN0IHBhbmVsID0gPEhUTUxFbGVtZW50PmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2xpbnRlci1wYW5lbCcpO1xyXG4gICAgaWYgKHBhbmVsKVxyXG4gICAgICAgIHBhbmVsLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XHJcbn1cclxuXHJcbmxldCBzaG93SGlkZGVuRGlhZ25vc3RpY3MgPSB0cnVlO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGluaXQobGludGVyOiB7IGdldEVkaXRvckxpbnRlcjogKGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yKSA9PiB7IGxpbnQ6IChzaG91bGRMaW50OiBib29sZWFuKSA9PiB2b2lkIH0gfSkge1xyXG4gICAgY29uc3QgZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcbiAgICBsZXQgY2Q6IENvbXBvc2l0ZURpc3Bvc2FibGU7XHJcbiAgICBkaXNwb3NhYmxlLmFkZChhdG9tLmNvbmZpZy5vYnNlcnZlKCdvbW5pc2hhcnAtYXRvbS5oaWRlTGludGVySW50ZXJmYWNlJywgaGlkZGVuID0+IHtcclxuICAgICAgICBpZiAoaGlkZGVuKSB7XHJcbiAgICAgICAgICAgIGNkID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgICAgICAgICAgZGlzcG9zYWJsZS5hZGQoY2QpO1xyXG5cclxuICAgICAgICAgICAgLy8gc2hvdyBsaW50ZXIgYnV0dG9uc1xyXG4gICAgICAgICAgICBjZC5hZGQoT21uaS5hY3RpdmVFZGl0b3JcclxuICAgICAgICAgICAgICAgIC5maWx0ZXIoeiA9PiAheilcclxuICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoc2hvd0xpbnRlcikpO1xyXG5cclxuICAgICAgICAgICAgLy8gaGlkZSBsaW50ZXIgYnV0dG9uc1xyXG4gICAgICAgICAgICBjZC5hZGQoT21uaS5hY3RpdmVFZGl0b3JcclxuICAgICAgICAgICAgICAgIC5maWx0ZXIoeiA9PiAhIXopXHJcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKGhpZGVMaW50ZXIpKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBpZiAoY2QpIHtcclxuICAgICAgICAgICAgICAgIGRpc3Bvc2FibGUucmVtb3ZlKGNkKTtcclxuICAgICAgICAgICAgICAgIGNkLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBzaG93TGludGVyKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSkpO1xyXG5cclxuICAgIGRpc3Bvc2FibGUuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoJ29tbmlzaGFycC1hdG9tLnNob3dIaWRkZW5EaWFnbm9zdGljcycsIHNob3cgPT4ge1xyXG4gICAgICAgIHNob3dIaWRkZW5EaWFnbm9zdGljcyA9IHNob3c7XHJcbiAgICAgICAgYXRvbS53b3Jrc3BhY2UuZ2V0VGV4dEVkaXRvcnMoKS5mb3JFYWNoKGVkaXRvciA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IGVkaXRvckxpbnRlciA9IGxpbnRlci5nZXRFZGl0b3JMaW50ZXIoZWRpdG9yKTtcclxuICAgICAgICAgICAgaWYgKGVkaXRvckxpbnRlcikge1xyXG4gICAgICAgICAgICAgICAgZWRpdG9yTGludGVyLmxpbnQodHJ1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH0pKTtcclxuXHJcbiAgICBkaXNwb3NhYmxlLmFkZChPbW5pLmFjdGl2ZUVkaXRvci5maWx0ZXIoeiA9PiAhIXopLnRha2UoMSkuZGVsYXkoMTAwMCkuc3Vic2NyaWJlKGUgPT4ge1xyXG4gICAgICAgIE9tbmkud2hlbkVkaXRvckNvbm5lY3RlZChlKS5zdWJzY3JpYmUoKCkgPT4ge1xyXG4gICAgICAgICAgICBhdG9tLndvcmtzcGFjZS5nZXRUZXh0RWRpdG9ycygpLmZvckVhY2goZWRpdG9yID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGVkaXRvckxpbnRlciA9IGxpbnRlci5nZXRFZGl0b3JMaW50ZXIoZWRpdG9yKTtcclxuICAgICAgICAgICAgICAgIGlmIChlZGl0b3JMaW50ZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICBlZGl0b3JMaW50ZXIubGludCh0cnVlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9KSk7XHJcblxyXG4gICAgcmV0dXJuIGRpc3Bvc2FibGU7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiByZWdpc3RlckluZGllKHJlZ2lzdHJ5OiBJbmRpZVJlZ2lzdHJ5LCBkaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlKSB7XHJcbiAgICBjb25zdCBsaW50ZXIgPSByZWdpc3RyeS5yZWdpc3Rlcih7IG5hbWU6ICdjIycgfSk7XHJcbiAgICBkaXNwb3NhYmxlLmFkZChcclxuICAgICAgICBsaW50ZXIsXHJcbiAgICAgICAgT21uaS5kaWFnbm9zdGljc1xyXG4gICAgICAgICAgICAuc3Vic2NyaWJlKGRpYWdub3N0aWNzID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IG1lc3NhZ2VzOiBMaW50ZXJNZXNzYWdlW10gPSBbXTtcclxuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgaXRlbSBvZiBkaWFnbm9zdGljcykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChzaG93SGlkZGVuRGlhZ25vc3RpY3MgfHwgaXRlbS5Mb2dMZXZlbCAhPT0gJ0hpZGRlbicpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZXMucHVzaChtYXBJbmRpZVZhbHVlcyhpdGVtKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGxpbnRlci5zZXRNZXNzYWdlcyhtZXNzYWdlcyk7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICApO1xyXG59XHJcblxyXG4iXX0=
