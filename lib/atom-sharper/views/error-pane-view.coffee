{View}  = require 'atom'
Convert = require 'ansi-to-html'
Vue = require 'vue'
_ = require 'underscore'
fs = require 'fs'

OmniSharpServer = require '../../omni-sharp-server/omni-sharp-server'

module.exports =
# Internal: A tool-panel view for the test result output.
class ErrorPaneView extends View

  @content: ->
    @div class: 'error-output-pane', outlet: 'atomSharpErrorPane', =>
      @ul class: 'background-message centered', 'v-class': 'hide: isLoadingOrReady', =>
        @li =>
          @span 'Omnisharp server is turned off'
          @kbd class: 'key-binding text-highlight', '⌃⌥O'
      @ul class: 'background-message centered', 'v-class': 'hide: isNotLoading', =>
        @li =>
          @progress class: 'inline-block'
      @table class: 'error-table', 'v-class': 'hide: isNotReady', =>
        @thead =>
          @th 'line'
          @th 'column'
          @th 'message'
          @th 'filename'
        @tbody =>
          @tr
            'v-repeat': 'errors',
            'v-on': 'click: gotoError',
            data='{{$index}}',
            =>
              @td '{{Line}}'
              @td '{{Column}}'
              @td '{{Message}}'
              @td '{{FileName}}'

  initialize: ->
    @vm = new Vue
      el: this[0]
      data: _.extend OmniSharpServer.vm,
        errors: []
      methods:
        gotoError: ({targetVM}) -> atom.emit "omni:navigate-to", targetVM.$data

    atom.on "omni:syntax-errors", (data) => @vm.errors = data.Errors

  destroy: ->
    @detach()
