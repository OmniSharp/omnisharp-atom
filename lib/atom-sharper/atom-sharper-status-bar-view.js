(function() {
  var AtomSharperStatusBarView, View,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  View = require('atom').View;

  module.exports = AtomSharperStatusBarView = (function(_super) {
    __extends(AtomSharperStatusBarView, _super);

    function AtomSharperStatusBarView() {
      return AtomSharperStatusBarView.__super__.constructor.apply(this, arguments);
    }

    AtomSharperStatusBarView.content = function() {
      return this.div({
        "class": 'inline-block omni-meter'
      }, (function(_this) {
        return function() {
          return _this.span({
            outlet: 'omni-meter',
            "class": 'test-status icon icon-flame',
            tabindex: -1
          }, 'omni');
        };
      })(this));
    };

    AtomSharperStatusBarView.prototype.initialize = function() {
      atom.workspaceView.command("atom-sharper:toggle", (function(_this) {
        return function() {
          return _this.toggle();
        };
      })(this));
      return this.subscribe(this, 'click', (function(_this) {
        return function() {
          return atom.workspaceView.trigger('atom-sharper:toggle-output');
        };
      })(this));
    };

    AtomSharperStatusBarView.prototype.attach = function() {
      return atom.workspaceView.statusBar.appendLeft(this);
    };

    AtomSharperStatusBarView.prototype.toggle = function() {
      if (this.hasParent()) {
        return this.detach();
      } else {
        return this.attach();
      }
    };

    AtomSharperStatusBarView.prototype.destroy = function() {
      return this.detach();
    };

    return AtomSharperStatusBarView;

  })(View);

}).call(this);
