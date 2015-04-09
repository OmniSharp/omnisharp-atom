/// <reference path="tsd.d.ts" />
var WorkspaceView = require('atom').WorkspaceView;
import OmniSharpServer = require('../lib/omni-sharp-server/omni-sharp-server')

describe('OmniSharp Atom', () => {
    var statusBar = null;
    beforeEach(() => {
        atom.workspaceView = new WorkspaceView;
        atom.workspace = atom.workspaceView.model;
        waitsForPromise(() => {
            return atom.workspace.open();
        });
        waitsForPromise(() => {
            return atom.packages.activatePackage('status-bar');
        });
        waitsForPromise(() => {
            return atom.packages.activatePackage('omnisharp-atom');
        });
        return waitsFor(() => {
            statusBar = atom.workspaceView.statusBar;
            atom.workspaceView.attachToDom();
            return statusBar;
        });
    });
    describe('when the package is activated', () => {
        it('should display the atom sharper button in the status bar', () => {
            return expect(statusBar.find('.omnisharp-atom-button')).toExist();
        });
        it('should not display the atom sharper pane', () => {
            return expect(atom.workspaceView.find('.omnisharp-atom-pane')).not.toExist();
        });
        return describe('when the atom sharper button is clicked', () => {
            beforeEach(() => {
                if (atom.workspaceView.find('.omnisharp-atom-pane').length === 0) {
                    return statusBar.find('.omnisharp-atom-button')[0].click();
                }
            });
            it('should display the atom sharper pane', () => {
                return expect(atom.workspaceView.find('.omnisharp-atom-pane')).toExist();
            });
            return it('should display the omnisharp server status', () => {
                var message, messageSelector;
                messageSelector = '.omni-output-pane-view ul>li:first-child>span';
                message = atom.workspaceView.find(messageSelector)[0];
                return expect(message.innerText).toBe("Omnisharp server is turned off");
            });
        });
    });
    return describe('toggling atomsharper', () => {
        return describe('when you toggle atomsharper on', () => {
            beforeEach(() => {
                return atom.workspaceView.trigger('omnisharp-atom:toggle');
            });
            return it('should start the omnisharp server', () => {
                return expect(OmniSharpServer.vm.isNotOff).toBeTruthy();
            });
        });
    });
});
