(function() {
  var $, Omni, OmniSharpServer, Url, rp;

  OmniSharpServer = require('./omni-sharp-server');

  rp = require("request-promise");

  Url = require("url");

  $ = require("jquery");

  module.exports = Omni = (function() {
    function Omni() {}

    Omni.getEditorRequestContext = function() {
      var context, editor, marker;
      editor = atom.workspace.getActiveEditor();
      marker = editor.getCursorBufferPosition();
      context = {
        column: marker.column,
        filename: editor.getUri(),
        line: marker.row + 1,
        buffer: editor.displayBuffer.buffer.cachedText
      };
      return context;
    };

    Omni._uri = function(path, query) {
      var port;
      port = OmniSharpServer.get().getPortNumber();
      return Url.format({
        hostname: "localhost",
        protocol: "http",
        port: port,
        pathname: path,
        query: query
      });
    };

    Omni.syntaxErrors = function(data) {
      return rp({
        uri: Omni._uri("syntaxErrors"),
        method: "POST",
        form: data
      });
    };

    Omni.goToDefinition = function(data) {
      data = $.extend({}, data, Omni.getEditorRequestContext());
      return rp({
        uri: Omni._uri("gotoDefinition"),
        method: "POST",
        form: data
      });
    };

    return Omni;

  })();

}).call(this);
