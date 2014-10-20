{View}  = require 'atom'
{$} = require 'atom'
Convert = require 'ansi-to-html'
Vue = require 'vue'
_ = require 'underscore'

OmniSharpServer = require '../../omni-sharp-server/omni-sharp-server'

module.exports =
# Internal: A tool-panel view for the test result output.
class OmniOutputPaneView extends View
  @content: ->
    @div class: 'omni-output-pane-view', =>
      @ul class: 'background-message centered', 'v-class': 'hide: initialized', =>
        @li =>
          @span 'Omnisharp server is turned off'
          @kbd class: 'key-binding text-highlight', '⌃⌥O'
      @div class: 'messages-container', 'v-class': 'hide: uninitialized', =>
        @pre 'v-class': 'text-error: l.isError', 'v-repeat': 'l :output', '{{ l.message | ansi-to-html }}'

  initialize: ->
    scrollToBottom= _.throttle (=>this.find(".messages-container")[0].lastElementChild?.scrollIntoViewIfNeeded()), 100
    Vue.filter 'ansi-to-html', (value) =>
      scrollToBottom()
      @convert ?= new Convert()
      v = @convert.toHtml value
      v.trim()

    @vm = new Vue
      el: this[0]
      data:_ .extend OmniSharpServer.vm,
        uninitialized: true
        initialized: false
        output: []

    atom.on "omni-sharp-server:out", (data) =>
      @vm.output.$remove(0) if @vm.output.length >= 1000
      @vm.output.push message: data
    atom.on "omni-sharp-server:err", (data) =>
      @vm.output.$remove(0) if @vm.output.length >= 1000
      @vm.output.push {message: data, isError: true}
    atom.on "omni-sharp-server:start", (pid) =>
      @vm.uninitialized = false
      @vm.initialized = true
      @vm.output = []
      @vm.output.push message:"Started Omnisharp server (#{pid})"

  destroy: ->
    @detach()
