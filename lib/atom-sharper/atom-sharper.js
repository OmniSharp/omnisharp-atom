(function() {
  var AtomSharperOutputView, AtomSharperStatusBarView, Omni, OmniSharpServer;

  AtomSharperStatusBarView = require('./atom-sharper-status-bar-view');

  AtomSharperOutputView = require('./atom-sharper-output-view');

  OmniSharpServer = require('../omni-sharp-server/omni-sharp-server');

  Omni = require('../omni-sharp-server/omni');

  module.exports = {
    atomSharpView: null,
    activate: function(state) {
      var createStatusEntry;
      atom.workspaceView.command("atom-sharper:toggle", (function(_this) {
        return function() {
          return _this.toggle();
        };
      })(this));
      atom.workspaceView.command("atom-sharper:request", (function(_this) {
        return function() {
          return _this.testRequest();
        };
      })(this));
      atom.workspaceView.command("atom-sharp:go-to-definition", (function(_this) {
        return function() {
          return _this.goToDefinition();
        };
      })(this));
      createStatusEntry = (function(_this) {
        return function() {
          _this.testStatusStatusBar = new AtomSharperStatusBarView;
          _this.outputView = new AtomSharperOutputView;
          return atom.on("omni-sharp-server:close", function() {
            return _this.outputView.destroy();
          });
        };
      })(this);
      if (atom.workspaceView.statusBar) {
        return createStatusEntry();
      } else {
        return atom.packages.once('activated', function() {
          return createStatusEntry();
        });
      }
    },
    toggle: function() {
      return OmniSharpServer.get().toggle();
    },
    testRequest: function() {
      var editor;
      editor = atom.workspace.getActiveEditor();
      return Omni.syntaxErrors({
        column: 0,
        filename: editor.getUri(),
        line: 0,
        buffer: editor.displayBuffer.buffer.cachedText
      }).then(function(data) {
        return console.log(data);
      })["catch"](function(data) {
        return console.error(data);
      });
    },
    translatePoint: function(line, column) {
      return [line - 1, column];
    },
    goToDefinition: function() {
      var translatePoint;
      translatePoint = this.translatePoint;
      return Omni.goToDefinition().then(function(data) {
        var definition;
        definition = JSON.parse(data);
        return atom.workspace.open(definition.FileName).then(function(editor) {
          return editor.setCursorBufferPosition(translatePoint(definition.Line, definition.Column));
        });
      })["catch"](function(data) {
        return console.error(data);
      });
    },
    deactivate: function() {
      var _ref, _ref1;
      OmniSharpServer.get().stop();
      if ((_ref = this.testStatusStatusBar) != null) {
        _ref.destroy();
      }
      this.testStatusStatusBar = null;
      if ((_ref1 = this.outputView) != null) {
        _ref1.destroy();
      }
      return this.outputView = null;
    },
    serialize: function() {
      return {
        atomSharpViewState: this.atomSharpView.serialize()
      };
    }
  };

}).call(this);
