(function() {
  var BrowserWindow, OmniSharpServer, fs, spawn,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  fs = require('fs');

  spawn = require('child_process').spawn;

  BrowserWindow = require('remote').require('browser-window');

  module.exports = OmniSharpServer = (function() {
    var OmniSharpServerInstance, instance;

    function OmniSharpServer() {}

    instance = null;

    OmniSharpServerInstance = (function() {
      var location, packageDir;

      function OmniSharpServerInstance() {
        this.close = __bind(this.close, this);
        this.err = __bind(this.err, this);
        this.out = __bind(this.out, this);
      }

      packageDir = atom.packages.packageDirPaths[0];

      location = "" + packageDir + "/atom-sharper/server/OmniSharp/bin/Debug/OmniSharp.exe";

      OmniSharpServerInstance.prototype.start = function() {
        var _ref;
        this.child = spawn("mono", [location, "-s", typeof atom !== "undefined" && atom !== null ? (_ref = atom.project) != null ? _ref.path : void 0 : void 0, "-p", this.getPortNumber(), "-v", "Verbose"]);
        this.child.stdout.on('data', this.out);
        atom.emit("omni-sharp-server:start", this.child.pid);
        this.child.stderr.on('data', this.err);
        return this.child.on('close', this.close);
      };

      OmniSharpServerInstance.prototype.out = function(data) {
        return atom.emit("omni-sharp-server:out", data.toString());
      };

      OmniSharpServerInstance.prototype.err = function(data) {
        return atom.emit("omni-sharp-server:err", data.toString());
      };

      OmniSharpServerInstance.prototype.close = function(data) {
        atom.emit("omni-sharp-server:close", data);
        return this.port = null;
      };

      OmniSharpServerInstance.prototype.getPortNumber = function() {
        var currentWindow, index, windows;
        if (this.port) {
          return this.port;
        }
        windows = BrowserWindow.getAllWindows();
        currentWindow = BrowserWindow.getFocusedWindow().getProcessId();
        index = windows.findIndex((function(_this) {
          return function(w) {
            return w.getProcessId() === currentWindow;
          };
        })(this));
        this.port = 2000 + index;
        return this.port;
      };

      OmniSharpServerInstance.prototype.stop = function() {
        var _ref;
        if ((_ref = this.child) != null) {
          _ref.kill("SIGKILL");
        }
        return this.child = null;
      };

      OmniSharpServerInstance.prototype.toggle = function() {
        if (this.child) {
          return this.stop();
        } else {
          return this.start();
        }
      };

      return OmniSharpServerInstance;

    })();

    OmniSharpServer.get = function() {
      return instance != null ? instance : instance = new OmniSharpServerInstance();
    };

    return OmniSharpServer;

  })();

}).call(this);
