fs = require('fs')
spawn = require('child_process').spawn



module.exports =
  class OmniSharpServer
    instance = null

    class OmniSharpServerInstance
      packageDir = atom.packages.packageDirPaths[0];
      location = "#{packageDir}/atom-sharp/server/OmniSharp/bin/Debug/OmniSharp.exe"

      start: () ->
        @child = spawn("mono", [location, "-s", atom?.project?.path])
        @child.stdout.on 'data', @out
        atom.emit("omni-sharp:start", @child.pid)
        #@child.stderr.on 'data', @err
        @child.on 'close', @close

      out: (data) => atom.emit("omni-sharp:out", data.toString())
      err: (data) => atom.emit("omni-sharp:err", data.toString())
      close: (data) => atom.emit("omni-sharp:close", data)

      stop: () ->
        @child?.kill "SIGKILL"
        @child = null

      toggle: () -> if @child then @stop() else @start()

    @get: () ->
      instance ?= new OmniSharpServerInstance()


@omni = OmniSharpServer.get()
