{View}  = require 'atom'
{$} = require 'atom'
Convert = require 'ansi-to-html'
Vue = require 'vue'

ErrorPaneView = require './error-pane-view'
FindPaneView = require './find-pane-view'
OmniOutputPaneView = require './omni-output-pane-view'

module.exports =
# Internal: A tool-panel view for the test result output.
class DockView extends View

  # Internal: Initialize test-status output view DOM contents.
  @content: ->
    btn = (view, text) =>
      @button
        'v-attr' : "class: selected | btn-selected #{view}",
        'v-on' : "click: selectPane",
        'pane' : view
        text

    @div class: 'tool-panel panel-bottom atom-sharper-pane', outlet: 'pane', =>
      @div class: 'atom-sharper-output-resizer', outlet: 'resizeHandle'
      #header
      @div class: "inset-panel", =>
        @div class: "panel-heading clearfix", =>
          @div class: 'btn-toolbar pull-left', =>
            @div class: 'btn-group btn-toggle', =>
              btn "errors", "Errors"
              btn "find", "Find"
              btn "build", "Build output"
              btn "omni", "Omnisharp output"
        #tab content panels
        @div 'v-attr' : 'class: selected | content-selected omni', outlet: 'omniOutput'
        @div 'v-attr' : 'class: selected | content-selected errors', outlet: 'errorsOutput'
        @div 'v-attr' : 'class: selected | content-selected find', outlet: 'findOutput'
        @div 'v-attr' : 'class: selected | content-selected build'

  # Internal: Initialize the test-status output view and event handlers.
  initialize: ->

    Vue.filter 'btn-selected', (value, expectedValue) =>
      selected = if value == expectedValue then "selected" else ""
      "btn btn-default btn-fix #{selected}"

    Vue.filter 'content-selected', (value, expectedValue) =>
      selected = if value == expectedValue then "" else "hide"
      "atom-sharper-output #{expectedValue}-output #{selected}"

    @errorsOutput.append(new ErrorPaneView())
    @findOutput.append(new FindPaneView())
    @omniOutput.append(new OmniOutputPaneView())

    @vm = new Vue
      el: this[0]
      data:
        selected: "omni"
      methods:
        selectPane: ({target}) => @selectPane $(target).attr "pane"

    atom.workspaceView.command "atom-sharper:toggle-output", => @toggle()
    atom.workspaceView.command "atom-sharper:hide", => @hide()
    atom.workspaceView.command "atom-sharper:show-errors", => @selectPane "errors"
    atom.workspaceView.command "atom-sharper:show-find", => @selectPane "find"
    atom.workspaceView.command "atom-sharper:show-build", => @selectPane "build"
    atom.workspaceView.command "atom-sharper:show-omni", => @selectPane "omni"

    @on 'core:cancel core:close', =>
      @hide()

    @on 'mousedown', '.atom-sharper-output-resizer', (e) => @resizeStarted(e)

  selectPane: (pane) =>
    @vm.selected = pane
    @show()
    this.find("button.selected").focus()

  resizeStarted: =>
    @fixedTop = @resizeHandle.offset().top
    @fixedHeight = $(".atom-sharper-pane").height()
    @fixedButtonBarHeight = this.find(".btn-group").height()
    @statusBarHeight = atom.workspaceView.statusBar.height()
    $(document).on('mousemove', @resizePane)
    $(document).on('mouseup', @resizeStopped)

  resizeStopped: =>
    $(document).off('mousemove', @resizePane)
    $(document).off('mouseup', @resizeStopped)

  resizePane: ({pageY, which}) =>
    return @resizeStopped() unless which is 1
    h = @fixedHeight + (@fixedTop - pageY)
    $(".atom-sharper-pane").height(h)
    this.find(".atom-sharper-output").height(h-@fixedButtonBarHeight-@statusBarHeight)
    this.find(".messages-container").height(h-@fixedButtonBarHeight-@statusBarHeight)


  destroy: ->
    @detach()


  show: -> atom.workspaceView.prependToBottom(this) unless @hasParent()
  hide: -> @detach()
  # Internal: Toggle the visibilty of the test-status output view.
  #
  # Returns nothing.
  toggle: -> if @hasParent() then @hide() else @show()
