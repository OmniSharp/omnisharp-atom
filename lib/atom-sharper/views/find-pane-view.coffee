{View}  = require 'atom'
Convert = require 'ansi-to-html'
Vue = require 'vue'
_ = require 'underscore'

OmniSharpServer = require '../../omni-sharp-server/omni-sharp-server'

module.exports =
# Internal: A tool-panel view for find usages/implementations
class FindPaneView extends View

  @content: ->
    @div class: 'error-output-pane', outlet: 'atomSharpFindPane', =>
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
            'v-repeat': 'usages',
            'v-on': 'click: gotoUsage',
            data='{{$index}}',
            =>
              @td '{{Line}}'
              @td '{{Column}}'
              @td '{{Text}}'
              @td '{{FileName}}'

  initialize: ->
    @vm = new Vue
      el: this[0]
      data: _.extend OmniSharpServer.vm,
        usages: []
      methods:
        gotoUsage: ({targetVM}) -> atom.emit "omni:navigate-to", targetVM.$data

    atom.on "omni:find-usages", (data) => @vm.usages = data.QuickFixes

  destroy: ->
    @detach()
