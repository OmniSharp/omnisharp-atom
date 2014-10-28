{WorkspaceView} = require 'atom'
OmniSharpServer = require '../lib/omni-sharp-server/omni-sharp-server'

describe 'AtomSharper', ->
  statusBar = null

  beforeEach ->
    atom.workspaceView = new WorkspaceView
    atom.workspace = atom.workspaceView.model

    waitsForPromise ->
      atom.workspace.open()

    waitsForPromise ->
      atom.packages.activatePackage('status-bar')

    waitsForPromise ->
      atom.packages.activatePackage('omnisharp-atom')

    waitsFor ->
      statusBar = atom.workspaceView.statusBar
      atom.workspaceView.attachToDom()
      statusBar

  describe 'when the package is activated', ->

    it 'should display the atom sharper button in the status bar', ->
      expect(statusBar.find('.omnisharp-atom-button')).toExist()

    it 'should not display the atom sharper pane', ->
      expect(atom.workspaceView.find('.omnisharp-atom-pane')).not.toExist()

    describe 'when the atom sharper button is clicked', ->

      beforeEach ->
        if atom.workspaceView.find('.omnisharp-atom-pane').length is 0
          statusBar.find('.omnisharp-atom-button')[0].click()

      it 'should display the atom sharper pane', ->
        expect(atom.workspaceView.find('.omnisharp-atom-pane')).toExist()

      it 'should display the omnisharp server status', ->
        messageSelector = '.omni-output-pane-view ul>li:first-child>span'
        message = atom.workspaceView.find(messageSelector)[0]
        expect(message.innerText).toBe("Omnisharp server is turned off")

  describe 'toggling atomsharper', ->

    describe 'when you toggle atomsharper on', ->

      beforeEach ->
        atom.workspaceView.trigger 'omnisharp-atom:toggle'

      it 'should start the omnisharp server', ->
        expect(OmniSharpServer.vm.isNotOff).toBeTruthy()
