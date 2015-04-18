import _ = require('lodash')
import OmniSharpServer = require('../../omni-sharp-server/omni-sharp-server')
import Omni = require('../../omni-sharp-server/omni')
var Range = require('atom').Range;
var request: (options: any) => Promise<any> = require("request-promise")
import OmniSharpAtom = require('../omnisharp-atom')

class SyntaxErrors {
    private atomSharper: typeof OmniSharpAtom;
    private editorDestroyedSubscription: { dispose: () => void };
    private decorations: { [index: string]: any[] };

    constructor(atomSharper: typeof OmniSharpAtom) {
        this.atomSharper = atomSharper
        this.decorations = {}
    }


    public activate() {

        this.atomSharper.onEditor(editor => this.registerEventHandlerOnEditor(editor));

        // todo: what do we need to do with regards to cleanup? Should we be destroying
        // all markers?
        this.editorDestroyedSubscription = this.atomSharper.onEditorDestroyed(filePath => { });
    }


    public registerEventHandlerOnEditor(editor) {
        var textBuffer = editor.getBuffer();
        return textBuffer.onDidStopChanging(() => {
            if (OmniSharpServer.vm.isOff) {
                return;
            }
            return Omni.codecheck(null, editor).then((data) => this.drawDecorations(data, editor));
        });
    }

    public getWordAt(str, pos) {
        if (str === void 0) {
            return {
                start: pos,
                end: pos
            };
        }
        while (pos < str.length && /\W/.test(str[pos])) {
            ++pos;
        }
        var left = str.slice(0, pos + 1).search(/\W(?!.*\W)/);
        var right = str.slice(pos).search(/(\W|$)/);
        return {
            start: left + 1,
            end: left + 1 + right
        };
    }


    public destroyDecorationsInEditor(editor) {
        return _.each(this.decorations[editor.id], decoration => decoration.getMarker().destroy())
    }

    // public drawDecorations({QuickFixes}, editor)
    public drawDecorations(arg, editor) {
        var QuickFixes = arg.QuickFixes;

        this.destroyDecorationsInEditor(editor);
        if (QuickFixes.length === 0) {
            return;
        }

        var ranges = _.map(QuickFixes, (error: any) => {
            var column, end, line, ref, start, text;
            line = error.Line - 1;
            column = error.Column - 1;
            text = editor.lineTextForBufferRow(line);
            ref = this.getWordAt(text, column), start = ref.start, end = ref.end;
            return {
                type: error.LogLevel,
                range: new Range([line, start], [line, end]),
                message: error.Text
            };
        });

        // var decorations = _.map(ranges, ({type, range}) => {
        var decorations = _.map(ranges, (arg1) => {
            var type = arg1.type, range = arg1.range;

            var color = (function() {
                switch (false) {
                    case type !== 'Warning':
                        return "green";
                    case type !== 'Error':
                        return "red";
                    default:
                        return "unknown";
                }
            })();

            var marker = editor.markBufferRange(range, { invalidate: 'never' });
            var markerL = editor.markBufferRange(range, { invalidate: 'never' });
            var gutter = editor.decorateMarker(marker, { type: "line-number", "class": "gutter-" + color });
            var line = editor.decorateMarker(markerL, { type: "highlight", "class": "highlight-" + color });
            return [gutter, line];
        });

        return this.decorations[editor.id] = _.flatten(decorations);
    }

    public deactivate() {
        return this.editorDestroyedSubscription.dispose();
    }
}
export = SyntaxErrors
