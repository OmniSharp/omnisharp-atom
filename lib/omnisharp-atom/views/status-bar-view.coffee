{View} = require 'atom-space-pen-views'
Vue = require 'vue'
OmniSharpServer = require '../../omni-sharp-server/omni-sharp-server'

module.exports =
class StatusBarView extends View

  # Internal: Initialize test-status status bar view DOM contents.
  @content: ->
    @a href:'#', 'v-on' : 'click: toggle', outlet:  'omni-meter', class: 'inline-block omnisharp-atom-button', =>
      @span
        class: 'icon icon-flame',
        'v-class': 'text-subtle: isOff, text-success: isReady, text-error: isError',
        '{{iconText}}'
      @progress class: 'inline-block', 'v-class': 'hide: isNotLoading'

  # Internal: Initialize the status bar view and event handlers.
  initialize: (statusBar) ->

    @vm = new Vue
      el: this[0]
      data: OmniSharpServer.vm
      methods:
        toggle: @toggle
    @statusBarTitle = statusBar.addLeftTile(item: this, priority: -1000);

  toggle: =>
    atom.commands.dispatch(atom.views.getView(atom.workspace), 'omnisharp-atom:toggle-output')
    @vm.isOpen = !@vm.isOpen

  # Returns nothing.
  destroy: ->
    @detach()
    @statusBarTile?.destroy()
    @statusBarTile = null
