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
    @div class: 'tool-panel panel-bottom atom-sharper-pane', outlet: 'pane', =>
      @div class: 'atom-sharper-output-resizer', outlet: 'resizeHandle'
      @div class: "inset-panel", =>
        @div class: "panel-heading clearfix", =>
          @div class: 'btn-toolbar pull-left', =>
            @div class: 'btn-group btn-toggle', =>
              @button class: 'btn btn-default btn-fix', dataTab:'errors-output', 'Errors'
              @button class: 'btn btn-default btn-fix', dataTab:'build-output', 'Build output'
              @button class: 'btn btn-default btn-fix', dataTab:'omni-sharp-output', 'Omnisharp output'
        @div tabIndex: -1, class: 'atom-sharper-output omni-sharp-output padded', =>
            @div class: 'message', outlet: 'sharpAtomOutput'
        @div tabIndex: -1, class: 'atom-sharper-output errors-output', outlet: 'errorsOutput', =>
        @div tabIndex: -1, class: 'atom-sharper-output build-output padded', =>
  # Internal: Initialize the test-status output view and event handlers.
  initialize: ->

    @errorsOutput.append(new AtomSharperErrorView())
    @vm = new Vue
      data:
        selected: "errors"
      el: this[0]

    atom.workspaceView.command "atom-sharper:toggle-output", =>
      @toggle()

    atom.on("omni-sharp-server:out", (data) => @update data)
    atom.on("omni-sharp-server:err", (data) => @update data)
    atom.on "omni-sharp-server:start", @start

    @on 'mousedown', '.atom-sharper-output-resizer', (e) => @resizeStarted(e)
    @on 'click', '.btn-group .btn', (e) => @selectPane(e)

  selectPane: (e) =>
    this.find(".btn-group .btn").removeClass("selected")
    current = $(e.target)
    current.addClass("selected")
    targetOutput = current.attr("datatab");
    this.find(".atom-sharper-output").hide();
    this.find(".#{targetOutput}").show();


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
