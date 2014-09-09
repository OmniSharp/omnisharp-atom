fs = require('fs')
spawn = require('child_process').spawn
BrowserWindow = require('remote').require('browser-window')


module.exports =
  class OmniSharpServer
    instance = null

    class OmniSharpServerInstance
      packageDir = atom.packages.packageDirPaths[0];
      location = "#{packageDir}/atom-sharper/server/OmniSharp/bin/Debug/OmniSharp.exe"

      start: () ->
        useMono = process.platform isnt "win32"
        executablePath = if useMono then "mono" else location
        port = @getPortNumber()

        serverArguments = [ "-s", atom?.project?.path, "-p", port]

        if useMono
          serverArguments.unshift location

        @child = spawn(executablePath, serverArguments)
        @child.stdout.on 'data', @out
        atom.emit("omni-sharp-server:start", @child.pid)
        @child.stderr.on 'data', @err
        @child.on 'close', @close

      out: (data) => atom.emit("omni-sharp-server:out", data.toString())
      err: (data) => atom.emit("omni-sharp-server:err", data.toString())
      close: (data) =>
        atom.emit("omni-sharp-server:close", data)
        @port = null

      getPortNumber: ->
        if @port
          return @port
        windows = BrowserWindow.getAllWindows()
        currentWindow = BrowserWindow.getFocusedWindow().getProcessId()
        index = windows.findIndex (w) => w.getProcessId() ==  currentWindow
        @port = 2000 + index
        @port

      stop: () ->
        @child?.kill "SIGKILL"
        @child = null

      toggle: () -> if @child then @stop() else @start()

    @get: () ->
      instance ?= new OmniSharpServerInstance()
