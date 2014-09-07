{WorkspaceView} = require 'atom'
AtomSharp = require '../lib/atom-sharper/atom-sharper'

# Use the command `window:run-package-specs` (cmd-alt-ctrl-p) to run specs.
#
# To run a specific `it` or `describe` block add an `f` to the front (e.g. `fit`
# or `fdescribe`). Remove the `f` to unfocus the block.

describe "AtomSharper", ->
  activationPromise = null

  beforeEach ->
    atom.workspaceView = new WorkspaceView
    activationPromise = atom.packages.activatePackage('atom-sharp')

  describe "when the atom-sharper:toggle event is triggered", ->
    it "attaches and then detaches the view", ->
      statusBar = atom.workspaceView.statusBar
      expect(statusBar.find('.omni-meter')).not.toExist()

      # This is an activation event, triggering it will cause the package to be
      # activated.
      atom.workspaceView.trigger 'atom-sharper:toggle'

      waitsForPromise ->
        activationPromise

      runs ->
        expect(statusBar.find('.omni-meter')).toExist()
        atom.workspaceView.trigger 'atom-sharper:toggle'
        expect(statusBar.find('.omni-meter')).not.toExist()
