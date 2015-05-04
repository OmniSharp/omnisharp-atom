/// <reference path="tsd.d.ts" />
import Omni = require('../lib/omni-sharp-server/omni')

describe('OmniSharp Atom', () => {
    var statusBar = null, workspaceView;
    beforeEach(() => {
        workspaceView = atom.views.getView(atom.workspace);
        jasmine.attachToDOM(workspaceView);
        waitsForPromise(() => {
            return atom.workspace.open();
        });
        waitsForPromise(() => {
            return atom.packages.activatePackage('status-bar');
        });
        return waitsForPromise(() => {
            return atom.packages.activatePackage('omnisharp-atom');
        });
    });
    describe('when the package is activated', () => {
        // TODO: Figure out the best way to test this without workspaceView
        //it('should display the atom sharper button in the status bar', () => {
        //    return expect(statusBar.find('.omnisharp-atom-button')).toExist();
        //});
        it('should not display the atom sharper pane', () => {
            return expect(workspaceView.find('.omnisharp-atom-pane')).not.toExist();
        });
        return describe('when the atom sharper button is clicked', () => {
            beforeEach(() => {
                if (workspaceView.find('.omnisharp-atom-pane').length === 0) {
                    return statusBar.find('.omnisharp-atom-button')[0].click();
                }
            });
            it('should display the atom sharper pane', () => {
                return expect(workspaceView.find('.omnisharp-atom-pane')).toExist();
            });
            return it('should display the omnisharp server status', () => {
                var message, messageSelector;
                messageSelector = '.omni-output-pane-view ul>li:first-child>span';
                message = workspaceView.find(messageSelector)[0];
                return expect(message.innerText).toBe("Omnisharp server is turned off");
            });
        });
    });
    return describe('toggling atomsharper', () => {
        return describe('when you toggle atomsharper on', () => {
            beforeEach(() => {
                atom.commands.dispatch(atom.views.getView(atom.workspace), 'omnisharp-atom:toggle')
            });
            return it('should start the omnisharp server', () => {
                return expect(Omni.vm.isNotOff).toBeTruthy();
            });
        });
    });
});
