{View}  = require 'atom'
{$} = require 'atom'
Convert = require 'ansi-to-html'
Vue = require 'vue'
_ = require 'underscore'

module.exports =
# Internal: A tool-panel view for the test result output.
class OmniOutputPaneView extends View
  @content: ->
    @div class: 'omni-output-pane-view', =>
      @pre 'v-repeat': 'l :output', '{{ l.message | ansi-to-html }}'

  initialize: ->
    scrollToBottom= _.throttle (=>this[0].lastElementChild?.scrollIntoViewIfNeeded()), 100
    Vue.filter 'ansi-to-html', (value) =>
      scrollToBottom()
      @convert ?= new Convert()
      v = @convert.toHtml value
      v.trim()

    @vm = new Vue
      el: this[0]
      data:
        output: []

    atom.on "omni-sharp-server:out", (data) => @vm.output.push message: data
    atom.on "omni-sharp-server:err", (data) => @vm.output.push {message: data, isError: true}
    atom.on "omni-sharp-server:start", (pid) =>
      @vm.output.push message:"Started Omnisharp server (#{pid})"

  destroy: ->
    @detach()
