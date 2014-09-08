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
        @tr 'v-repeat': 'e :errors', =>
          @td '{{e}}'
          @td '{{e}}'
          @td '{{e}}'
          @td '{{e}}'

  initialize: ->
    @vm = new Vue
      data:
        errors: ["a", "b", "c"]
      el: this[0]

  destroy: ->
    @detach()
