{View}  = require 'atom'
{$} = require 'atom'

Convert = require 'ansi-to-html'
Vue = require 'vue'

module.exports =
# Internal: A tool-panel view for the test result output.
class ErrorPaneView extends View

  @content: ->
    @div class: 'error-output-pane', outlet: 'atomSharpErrorPane', =>
      @table class: 'error-table', =>
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
      data:
        errors: []
      methods:
        gotoError: ({targetVM}) -> atom.emit "omni:navigate-to", targetVM.$data

    atom.on "omni:syntax-errors", (data) => @vm.errors = data.Errors

  destroy: ->
    @detach()
