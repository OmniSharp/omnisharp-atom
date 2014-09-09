{View}  = require 'atom'
{$} = require 'atom'
AtomSharperErrorView = require './atom-sharper-error-view'
Convert = require 'ansi-to-html'
Vue = require 'vue'

module.exports =
# Internal: A tool-panel view for the test result output.
class AtomSharperOutputView extends View

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
              btn "build", "Build output"
              btn "omni", "Omnisharp output"
        #tab content panels
        @div 'v-attr' : 'class: selected | content-selected omni', =>
            @div class: 'message', outlet: 'sharpAtomOutput'
        @div 'v-attr' : 'class: selected | content-selected errors', outlet: 'errorsOutput'
        @div 'v-attr' : 'class: selected | content-selected build'

  # Internal: Initialize the test-status output view and event handlers.
  initialize: ->

    Vue.filter 'btn-selected', (value, expectedValue) =>
      selected = if value == expectedValue then "selected" else ""
      "btn btn-default btn-fix #{selected}"

    Vue.filter 'content-selected', (value, expectedValue) =>
      selected = if value == expectedValue then "" else "hide"
      "atom-sharper-output #{expectedValue}-output #{selected}"

    @errorsOutput.append(new AtomSharperErrorView())
    @vm = new Vue
      el: this[0]
      data:
        selected: "omni"
      methods:
        selectPane: ({target}) => @selectPane $(target).attr "pane"

    atom.workspaceView.command "atom-sharper:toggle-output", => @toggle()

    atom.on("omni-sharp-server:out", (data) => @update data)
    atom.on("omni-sharp-server:err", (data) => @update data)
    atom.on "omni-sharp-server:start", @start

    @on 'mousedown', '.atom-sharper-output-resizer', (e) => @resizeStarted(e)

  selectPane: (pane) => @vm.selected = pane

  resizeStarted: =>
    @fixedTop = @resizeHandle.offset().top
    @fixedHeight = $(".atom-sharper-pane").height()
    @fixedButtonBarHeight = this.find(".btn-group").height()
    $(document).on('mousemove', @resizePane)
    $(document).on('mouseup', @resizeStopped)

  resizeStopped: =>
    $(document).off('mousemove', @resizePane)
    $(document).off('mouseup', @resizeStopped)

  resizePane: ({pageY, which}) =>
    return @resizeStopped() unless which is 1
    h = @fixedHeight + (@fixedTop - pageY)
    $(".atom-sharper-pane").height(h)
    this.find(".atom-sharper-output").height(h-@fixedButtonBarHeight)

  start: (pid) =>
    @output = "<strong class'success'>Started Omnisharp server (#{pid})</strong>"
    @sharpAtomOutput.html(@output).css('font-size', "#{atom.config.getInt('editor.fontSize')}px")

  update: (output) ->
    @convert ?= new Convert
    @output = @convert.toHtml(
      output.replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
      )
    message = @sharpAtomOutput.append("<pre>#{@output.trim()}</pre>")
    message[0].lastChild.scrollIntoViewIfNeeded()

  destroy: ->
    @detach()

  # Internal: Toggle the visibilty of the test-status output view.
  #
  # Returns nothing.
  toggle: ->
    if @hasParent()
      @detach()
    else
      atom.workspaceView.prependToBottom(this) unless @hasParent()
      @sharpAtomOutput[0].lastChild.scrollIntoViewIfNeeded()
