import _ = require('lodash');
//import spacePenViews = require('atom-space-pen-views')
//var $ = spacePenViews.jQuery;
import {CompositeDisposable, Observable, Disposable} from "rx";
import Omni = require('../../omni-sharp-server/omni');
import {DriverState} from "omnisharp-client"

class CodeLens implements OmniSharp.IFeature {
    private disposable: Rx.CompositeDisposable;
    private activeMarkers: Atom.Marker[] = [];

    public activate() {
        this.disposable.add(Omni.switchActiveEditor((editor, cd) => {
            editor.getBuffer().onDidStopChanging(() => this.updateCodeLens(editor));
            editor.getBuffer().onDidSave(() => this.updateCodeLens(editor));
            editor.getBuffer().onDidReload(() => this.updateCodeLens(editor));

            editor.onDidChangeScrollTop((top) => {
                var editorView = $(atom.views.getView(editor));
                var line = $(".codelens", this.getFromShadowDom(editorView, ".scroll-view"));

                line.css("top", top + "px");
            });

            this.updateCodeLens(editor);

            cd.add(Disposable.create(() => {
                _.each(this.activeMarkers, marker => marker.destroy());
                this.activeMarkers = [];
            }))
        }));
    }

    public dispose() {
        this.disposable.dispose();
    }

    public updateCodeLens(editor: Atom.TextEditor) {
        var lineHeight = "+=" + editor.getLineHeightInPixels() + "px";
        var editorView = $(atom.views.getView(editor));

        var initialBufferPos = editor.getCursorBufferPosition();

        Omni.request(editor, solution =>
            solution.currentfilemembersasflat(solution.makeRequest(editor)))
            .flatMap(fileMembers => Observable.from(fileMembers))
            .concatMap(fileMember =>
                Omni.request(editor, solution => solution.findusages({
                    Column: fileMember.Column + 1,
                    FileName: editor.getPath(),
                    Line: fileMember.Line,
                })
                    .map(response => ({ response, fileMember }))))
            .toArray()
            .subscribe(responses => {

                _.each(this.activeMarkers, marker => marker.destroy());
                this.activeMarkers = [];
                
                _.each(responses, (ctx) => {
                    var {response, fileMember} = ctx;

                    var range = editor.getBuffer().rangeForRow(fileMember.Line - 1);
                    var marker = editor.markBufferRange(range);
                    this.activeMarkers.push(marker);

                    var decorationParams = {
                        type: "line"
                    };
                    var decoration = editor.decorateMarker(marker, decorationParams);
                });
            });
    }

    private getFromShadowDom(element: JQuery, selector: string): JQuery {
        var el = element[0];
        var found = (<any> el).rootElement.querySelectorAll(selector);
        return $(found[0]);
    }
}

export = CodeLens;
