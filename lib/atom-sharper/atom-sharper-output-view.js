(function() {
  var $, AtomSharperOutputView, Convert, View,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  View = require('atom').View;

  $ = require('atom').$;

  Convert = require('ansi-to-html');

  module.exports = AtomSharperOutputView = (function(_super) {
    __extends(AtomSharperOutputView, _super);

    function AtomSharperOutputView() {
      this.start = __bind(this.start, this);
      this.resizePane = __bind(this.resizePane, this);
      this.resizeStopped = __bind(this.resizeStopped, this);
      this.resizeStarted = __bind(this.resizeStarted, this);
      return AtomSharperOutputView.__super__.constructor.apply(this, arguments);
    }

    AtomSharperOutputView.content = function() {
      return this.div({
        "class": 'tool-panel panel-bottom native-key-bindings atom-sharper',
        outlet: 'pane'
      }, (function(_this) {
        return function() {
          _this.div({
            "class": 'atom-sharper-output-resizer',
            outlet: 'resizeHandle'
          });
          return _this.div({
            tabIndex: -1,
            "class": 'atom-sharper-output padded'
          }, function() {
            return _this.div({
              "class": 'block'
            }, function() {
              return _this.div({
                "class": 'message',
                outlet: 'sharpAtomOutput'
              });
            });
          });
        };
      })(this));
    };

    AtomSharperOutputView.prototype.initialize = function() {
      atom.workspaceView.command("atom-sharper:toggle-output", (function(_this) {
        return function() {
          return _this.toggle();
        };
      })(this));
      atom.on("omni-sharp-server:out", (function(_this) {
        return function(data) {
          return _this.update(data);
        };
      })(this));
      atom.on("omni-sharp-server:err", (function(_this) {
        return function(data) {
          return _this.update(data);
        };
      })(this));
      atom.on("omni-sharp-server:start", this.start);
      return this.on('mousedown', '.atom-sharper-output-resizer', (function(_this) {
        return function(e) {
          return _this.resizeStarted(e);
        };
      })(this));
    };

    AtomSharperOutputView.prototype.resizeStarted = function() {
      this.fixedTop = this.resizeHandle.offset().top;
      this.fixedHeight = $(".atom-sharper").height();
      $(document).on('mousemove', this.resizePane);
      return $(document).on('mouseup', this.resizeStopped);
    };

    AtomSharperOutputView.prototype.resizeStopped = function() {
      $(document).off('mousemove', this.resizePane);
      return $(document).off('mouseup', this.resizeStopped);
    };

    AtomSharperOutputView.prototype.resizePane = function(_arg) {
      var h, pageY, which;
      pageY = _arg.pageY, which = _arg.which;
      if (which !== 1) {
        return this.resizeStopped();
      }
      h = this.fixedHeight + (this.fixedTop - pageY);
      return $(".atom-sharper").height(h);
    };

    AtomSharperOutputView.prototype.start = function(pid) {
      this.output = "<strong class'success'>Started Omnisharp server (" + pid + ")</strong>";
      return this.sharpAtomOutput.html(this.output).css('font-size', "" + (atom.config.getInt('editor.fontSize')) + "px");
    };

    AtomSharperOutputView.prototype.update = function(output) {
      var message;
      if (this.convert == null) {
        this.convert = new Convert;
      }
      this.output = this.convert.toHtml(output.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));
      message = this.sharpAtomOutput.append("<pre>" + (this.output.trim()) + "</pre>");
      return message[0].lastChild.scrollIntoViewIfNeeded();
    };

    AtomSharperOutputView.prototype.destroy = function() {
      return this.detach();
    };

    AtomSharperOutputView.prototype.toggle = function() {
      if (this.hasParent()) {
        return this.detach();
      } else {
        if (!this.hasParent()) {
          atom.workspaceView.prependToBottom(this);
        }
        return this.sharpAtomOutput[0].lastChild.scrollIntoViewIfNeeded();
      }
    };

    return AtomSharperOutputView;

  })(View);

}).call(this);
