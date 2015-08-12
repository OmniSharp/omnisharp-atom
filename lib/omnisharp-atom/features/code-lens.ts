import _ = require('lodash');
//import spacePenViews = require('atom-space-pen-views')
//var $ = spacePenViews.jQuery;
import {CompositeDisposable, Observable} from "rx";
import Omni = require('../../omni-sharp-server/omni');
import {DriverState} from "omnisharp-client"

class CodeLens implements OmniSharp.IFeature {
    private disposable: Rx.CompositeDisposable;

  public activate() {
      this.disposable.add(Omni.activeEditor.where(z => !!z).subscribe(editor => {
          var cd = new CompositeDisposable();

          cd.add(Omni.activeEditor.where(active => active !== editor).subscribe(() => {
              cd.dispose();
              this.disposable.remove(cd);
          }));
      }));

    this.atomSharper.onEditor((editor: Atom.TextEditor) => {
      editor.getBuffer().onDidStopChanging(() => this.updateCodeLens(editor));
      editor.getBuffer().onDidSave(() => this.updateCodeLens(editor));
      editor.getBuffer().onDidDelete(() => this.updateCodeLens(editor));
      editor.getBuffer().onDidReload(() => this.updateCodeLens(editor));

      editor.onDidChangeScrollTop((top) => {
        var editorView = $(atom.views.getView(editor));
        var line = $(".codelens", this.getFromShadowDom(editorView, ".scroll-view"));

        line.css("top", top + "px");

      });
    });

    Omni.registerConfiguration(client => {
      client.state.subscribe(state => {
        if (state === DriverState.Connected)
          this.updateCodeLens(null);
      });
    });

  }

  public updateCodeLens(editor: Atom.TextEditor) {
    var self = this; // yay for scoping, I always forget in typhadowescript, what this does, big arrow should bind this to the class instance, right?
    if (editor == undefined || Omni.client === undefined || Omni.client.currentState !== DriverState.Connected) return;

    var lineHeight = "+=" + editor.getLineHeightInPixels() + "px";
    var editorView = $(atom.views.getView(editor));

    var initialBufferPos = editor.getCursorBufferPosition();

    _.debounce(() => {
      var request = <OmniSharp.Models.FormatRangeRequest>Omni.makeRequest(editor);
      Omni.client.currentfilemembersasflatPromise(request)
        .then((fileMembers) => {
          _.forEach(fileMembers, function(fileMember: OmniSharp.Models.QuickFix) {
            console.log(fileMember);

            var req = <OmniSharp.Models.FindUsagesRequest>{
              Column: fileMember.Column + 1,
              FileName: request.FileName,
              Line: fileMember.Line,
            };
            //go get the count of the usages
            Omni.client.findusagesPromise(req)
              .then((findUsagesResponse) => {
                var range = editor.getBuffer().rangeForRow(req.Line - 1);
                var marker = editor.markBufferRange(range);
                var decorationParams = {
                    type : "line",
                    //class : `codelens-${findUsagesResponse.QuickFixes.length}`
                };
                var decoration = editor.decorateMarker(marker, decorationParams);
              });
          });
        });
    }, 500)();
  }

  private getFromShadowDom(element: JQuery, selector: string): JQuery {
    var el = element[0];
    var found = (<any> el).rootElement.querySelectorAll(selector);
    return $(found[0]);
  }
}

export = CodeLens;
