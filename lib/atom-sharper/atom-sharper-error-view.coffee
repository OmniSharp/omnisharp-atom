{View}  = require 'atom'
{$} = require 'atom'
Convert = require 'ansi-to-html'
Vue = require 'vue'

module.exports =
# Internal: A tool-panel view for the test result output.
class AtomSharperErrorView extends View

  @content: ->
    @div class: 'error-output-pane', outlet: 'atomSharpErrorPane', =>
      @table class: 'error-table', =>
        @thead =>
          @th 'line'
          @th 'column'
          @th 'file'
          @th 'error'
        @tbody =>
          @tr 'v-repeat': 'e :errors', class:"", data='{{$index}}', =>
            @td '{{e.Line}}'
            @td '{{e.Column}}'
            @td '{{e.FileName}}'
            @td '{{e.Message}}'

  initialize: ->
    @vm = new Vue
      data:
        errors: []
      el: this[0]

    atom.on "omni:syntax-errors", (data) =>
      console.log data
      @vm.errors = JSON.parse(data).Errors

  destroy: ->
    @detach()
