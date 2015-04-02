Omni = require '../../omni-sharp-server/omni'
spawn = require('child_process').spawn

module.exports =
  class Build

    activate: =>
      atom.commands.add 'atom-workspace', 'omnisharp-atom:build', ->
        atom.commands.dispatch(atom.views.getView(atom.workspace), 'omnisharp-atom:show-build')
        Omni.build()

      atom.on "omni:build-command", (command) =>
        pattern = /[\w\\\/:=_\-\.]+|"[\w\\\s\/:=_\-\.]*"/g
        args = command.match(pattern)
        buildCommand = args.shift()

        # strip quotes from project path
        projectPath = args[args.length - 1]
        args[args.length - 1] = projectPath.substring(1, projectPath.length - 1)

        @build = spawn(buildCommand, args)
        atom.emit "omnisharp-atom:building", command

        @build.stdout.on 'data', @out
        @build.stderr.on 'data', @err
        @build.on 'close', @close

    out: (data) =>
      atom.emit "omnisharp-atom:build-message", data.toString()

    err: (data) =>
      atom.emit "omnisharp-atom:build-err", data.toString()

    close: (exitCode) =>
      atom.emit "omnisharp-atom:build-exitcode", exitCode
