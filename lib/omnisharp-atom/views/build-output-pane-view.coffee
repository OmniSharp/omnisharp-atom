{View}  = require 'atom'
{$} = require 'atom'
Convert = require 'ansi-to-html'
Vue = require 'vue'
_ = require 'underscore'

module.exports =
# Internal: A tool-panel view for the build result output.
class BuildOutputPaneView extends View
  @content: ->
    @div class: 'build-output-pane-view', =>
      @div class: 'messages-container', =>
        @pre
          'v-class': 'text-error: l.isError, navigate-link: l.isLink',
          'v-repeat': 'l :output',
          'v-on': 'click: navigate'
          'v-attr': 'data-nav: l.nav'
          '{{ l.message | ansi-to-html }}'

  initialize: ->
    scrollToBottom= _.throttle (=>this.find(".messages-container")[0].lastElementChild?.scrollIntoViewIfNeeded()), 100
    Vue.filter 'ansi-to-html', (value) =>
      scrollToBottom()
      @convert ?= new Convert()
      v = @convert.toHtml value
      v.trim()

    @vm = new Vue
      el: this[0]
      data:
        output: []
      methods:
        navigate: (e) ->
          nav = JSON.parse(e.srcElement.attributes['data-nav'].value)
          if nav
            atom.emit "omni:navigate-to", nav

    atom.on "omnisharp-atom:build-message", (data) =>
      linkPattern = /(.*)\((\d*),(\d*)\)/g
      navMatches = linkPattern.exec(data)
      isLink = false
      nav = false

      if navMatches.length == 4
        isLink = true
        nav =
          FileName: navMatches[1]
          Line: navMatches[2]
          Column: navMatches[3]

      logMessage =
        message: data
        isLink: isLink
        nav: JSON.stringify(nav)

      @vm.output.$remove(0) if @vm.output.length >= 1000
      @vm.output.push logMessage

    atom.on "omnisharp-atom:build-err", (data) =>
      @vm.output.$remove(0) if @vm.output.length >= 1000
      @vm.output.push {message: data, isError: true}

    atom.on "omnisharp-atom:building", (command) =>
      @vm.output = []
      @vm.output.push message:'OmniSharp Atom building...'
      @vm.output.push message:"\t#{command}"

    atom.on "omnisharp-atom:build-exitcode", (exitCode) =>
      if exitCode == 0
        @vm.output.push message: 'Build succeeded!'
      else
        @vm.output.push message: 'Build failed!', isError: true


  destroy: ->
    @detach()
