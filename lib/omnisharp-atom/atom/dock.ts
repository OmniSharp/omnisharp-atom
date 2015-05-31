import {CompositeDisposable} from "rx";
import Omni = require('../../omni-sharp-server/omni')
import DockWindow = require('../views/dock-view');
import React = require('react');

class Dock implements OmniSharp.IFeature {
    private disposable: Rx.CompositeDisposable;
    private view: Element;
    private panel: Atom.Panel;

    public activate() {
        var p = this.panel = atom.workspace.addBottomPanel({
            item: document.createElement('span'),
            visible: false
        });

        this.view = p.item.parentElement;
        this.view.classList.add('omnisharp-atom-pane');
        React.render(React.createElement(DockWindow, { panel: p }), this.view);
    }

    public dispose() {
        React.unmountComponentAtNode(this.view);
        this.panel.destroy();
        this.disposable.dispose();
    }
}

export var dockWindow = new Dock;
