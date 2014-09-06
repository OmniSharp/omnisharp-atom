{WorkspaceView} = require 'atom'
AtomSharp = require '../lib/atom-sharp'

# Use the command `window:run-package-specs` (cmd-alt-ctrl-p) to run specs.
#
# To run a specific `it` or `describe` block add an `f` to the front (e.g. `fit`
# or `fdescribe`). Remove the `f` to unfocus the block.

describe "AtomSharp", ->
  activationPromise = null

  beforeEach ->
    atom.workspaceView = new WorkspaceView
    activationPromise = atom.packages.activatePackage('atom-sharp')

  describe "when the atom-sharp:toggle event is triggered", ->
    it "attaches and then detaches the view", ->
      statusBar = atom.workspaceView.statusBar
      expect(statusBar.find('.omni-meter')).not.toExist()

      # This is an activation event, triggering it will cause the package to be
      # activated.
      atom.workspaceView.trigger 'atom-sharp:toggle'

      waitsForPromise ->
        activationPromise

      runs ->
        expect(statusBar.find('.omni-meter')).toExist()
        atom.workspaceView.trigger 'atom-sharp:toggle'
        expect(statusBar.find('.omni-meter')).not.toExist()
