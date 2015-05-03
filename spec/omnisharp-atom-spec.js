/// <reference path="tsd.d.ts" />
var Omni = require('../lib/omni-sharp-server/omni');
describe('OmniSharp Atom', function () {
    var statusBar = null, workspaceView;
    beforeEach(function () {
        workspaceView = atom.views.getView(atom.workspace);
        jasmine.attachToDOM(workspaceView);
        waitsForPromise(function () {
            return atom.workspace.open();
        });
        waitsForPromise(function () {
            return atom.packages.activatePackage('status-bar');
        });
        return waitsForPromise(function () {
            return atom.packages.activatePackage('omnisharp-atom');
        });
    });
    describe('when the package is activated', function () {
        it('should not display the atom sharper pane', function () {
            return expect(workspaceView.find('.omnisharp-atom-pane')).not.toExist();
        });
        return describe('when the atom sharper button is clicked', function () {
            beforeEach(function () {
                if (workspaceView.find('.omnisharp-atom-pane').length === 0) {
                    return statusBar.find('.omnisharp-atom-button')[0].click();
                }
            });
            it('should display the atom sharper pane', function () {
                return expect(workspaceView.find('.omnisharp-atom-pane')).toExist();
            });
            return it('should display the omnisharp server status', function () {
                var message, messageSelector;
                messageSelector = '.omni-output-pane-view ul>li:first-child>span';
                message = workspaceView.find(messageSelector)[0];
                return expect(message.innerText).toBe("Omnisharp server is turned off");
            });
        });
    });
    return describe('toggling atomsharper', function () {
        return describe('when you toggle atomsharper on', function () {
            beforeEach(function () {
                atom.commands.dispatch(atom.views.getView(atom.workspace), 'omnisharp-atom:toggle');
            });
            return it('should start the omnisharp server', function () {
                return expect(Omni.vm.isNotOff).toBeTruthy();
            });
        });
    });
});
