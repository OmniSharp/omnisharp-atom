"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.generatorAspnet = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _rxjs = require("rxjs");

var _omnisharpClient = require("omnisharp-client");

var _lodash = require("lodash");

var _path = require("path");

var path = _interopRequireWildcard(_path);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var commands = ["AngularController", "AngularControllerAs", "AngularDirective", "AngularFactory", "AngularModule", "BowerJson", "Class", "CoffeeScript", "Config", "gitignore", "Gruntfile", "Gulpfile", "HTMLPage", "Interface", "JavaScript", "JScript", "JSON", "JSONSchema", "JSX", "Middleware", "MvcController", "MvcView", "PackageJson", "StartupClass", "StyleSheet", "StyleSheetLess", "StyleSheetSCSS", "TagHelper", "TextFile", "TypeScript", "TypeScriptConfig", "WebApiController"];

var GeneratorAspnet = function () {
    function GeneratorAspnet() {
        _classCallCheck(this, GeneratorAspnet);

        this.required = true;
        this.title = "Aspnet Yeoman Generator";
        this.description = "Enables the aspnet yeoman generator.";
    }

    _createClass(GeneratorAspnet, [{
        key: "activate",
        value: function activate() {
            var _this = this;

            this.disposable = new _omnisharpClient.CompositeDisposable();
            this.disposable.add(atom.commands.add("atom-workspace", "omnisharp-atom:new-project", function () {
                return _this.newProject();
            }));
            this.disposable.add(atom.commands.add("atom-workspace", "c#:new-project", function () {
                return _this.newProject();
            }));
            this.disposable.add(atom.commands.add("atom-workspace", "omnisharp-atom:new-class", function () {
                return _this.run("aspnet:Class");
            }));
            this.disposable.add(atom.commands.add("atom-workspace", "C#:new-class", function () {
                return _this.run("aspnet:Class");
            }));
            (0, _lodash.each)(commands, function (command) {
                _this.disposable.add(atom.commands.add("atom-workspace", "omnisharp-atom:aspnet-" + command, function () {
                    return _this.loadCsFile(_this.run("aspnet:" + command));
                }));
            });
        }
    }, {
        key: "loadCsFile",
        value: function loadCsFile(promise) {
            return promise.then(function (messages) {
                var allMessages = messages.skip.concat(messages.create).concat(messages.identical).concat(messages.force);
                return _rxjs.Observable.from(["Startup.cs", "Program.cs", ".cs"]).concatMap(function (file) {
                    return (0, _lodash.filter)(allMessages, function (message) {
                        return (0, _lodash.endsWith)(message, file);
                    });
                }).take(1).map(function (file) {
                    return path.join(messages.cwd, file);
                }).toPromise();
            }).then(function (file) {
                return atom.workspace.open(file);
            });
        }
    }, {
        key: "newProject",
        value: function newProject() {
            return this.loadCsFile(this.run("aspnet:app --createInDirectory")).then(function () {
                return _rxjs.Observable.timer(2000).toPromise();
            }).then(function () {
                atom.commands.dispatch(atom.views.getView(atom.workspace), "omnisharp-atom:restart-server");
            });
        }
    }, {
        key: "run",
        value: function run(command) {
            return this.generator.run(command, undefined, { promptOnZeroDirectories: true });
        }
    }, {
        key: "setup",
        value: function setup(generator) {
            this.generator = generator;
        }
    }, {
        key: "dispose",
        value: function dispose() {
            this.disposable.dispose();
        }
    }]);

    return GeneratorAspnet;
}();

var generatorAspnet = exports.generatorAspnet = new GeneratorAspnet();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9hdG9tL2dlbmVyYXRvci1hc3BuZXQuanMiLCJsaWIvYXRvbS9nZW5lcmF0b3ItYXNwbmV0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQUNBOztBQUNBOztBQUNBOztJQ0FZOzs7Ozs7QUFHWixJQUFNLFdBQVcsQ0FDYixtQkFEYSxFQUViLHFCQUZhLEVBR2Isa0JBSGEsRUFJYixnQkFKYSxFQUtiLGVBTGEsRUFNYixXQU5hLEVBT2IsT0FQYSxFQVFiLGNBUmEsRUFTYixRQVRhLEVBVWIsV0FWYSxFQVdiLFdBWGEsRUFZYixVQVphLEVBYWIsVUFiYSxFQWNiLFdBZGEsRUFlYixZQWZhLEVBZ0JiLFNBaEJhLEVBaUJiLE1BakJhLEVBa0JiLFlBbEJhLEVBbUJiLEtBbkJhLEVBb0JiLFlBcEJhLEVBcUJiLGVBckJhLEVBc0JiLFNBdEJhLEVBdUJiLGFBdkJhLEVBd0JiLGNBeEJhLEVBeUJiLFlBekJhLEVBMEJiLGdCQTFCYSxFQTJCYixnQkEzQmEsRUE0QmIsV0E1QmEsRUE2QmIsVUE3QmEsRUE4QmIsWUE5QmEsRUErQmIsa0JBL0JhLEVBZ0NiLGtCQWhDYSxDQUFYOztJQWdETjtBQUFBLCtCQUFBOzs7QUF5RFcsYUFBQSxRQUFBLEdBQVcsSUFBWCxDQXpEWDtBQTBEVyxhQUFBLEtBQUEsR0FBUSx5QkFBUixDQTFEWDtBQTJEVyxhQUFBLFdBQUEsR0FBYyxzQ0FBZCxDQTNEWDtLQUFBOzs7O21DQU9tQjs7O0FBQ1gsaUJBQUssVUFBTCxHQUFrQiwwQ0FBbEIsQ0FEVztBQUdYLGlCQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsS0FBSyxRQUFMLENBQWMsR0FBZCxDQUFrQixnQkFBbEIsRUFBb0MsNEJBQXBDLEVBQWtFO3VCQUFNLE1BQUssVUFBTDthQUFOLENBQXRGLEVBSFc7QUFJWCxpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLEtBQUssUUFBTCxDQUFjLEdBQWQsQ0FBa0IsZ0JBQWxCLEVBQW9DLGdCQUFwQyxFQUFzRDt1QkFBTSxNQUFLLFVBQUw7YUFBTixDQUExRSxFQUpXO0FBTVgsaUJBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQixLQUFLLFFBQUwsQ0FBYyxHQUFkLENBQWtCLGdCQUFsQixFQUFvQywwQkFBcEMsRUFBZ0U7dUJBQU0sTUFBSyxHQUFMLENBQVMsY0FBVDthQUFOLENBQXBGLEVBTlc7QUFPWCxpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLEtBQUssUUFBTCxDQUFjLEdBQWQsQ0FBa0IsZ0JBQWxCLEVBQW9DLGNBQXBDLEVBQW9EO3VCQUFNLE1BQUssR0FBTCxDQUFTLGNBQVQ7YUFBTixDQUF4RSxFQVBXO0FBU1gsOEJBQUssUUFBTCxFQUFlLG1CQUFPO0FBQ2xCLHNCQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsS0FBSyxRQUFMLENBQWMsR0FBZCxDQUFrQixnQkFBbEIsNkJBQTZELE9BQTdELEVBQXdFOzJCQUFNLE1BQUssVUFBTCxDQUFnQixNQUFLLEdBQUwsYUFBbUIsT0FBbkIsQ0FBaEI7aUJBQU4sQ0FBNUYsRUFEa0I7YUFBUCxDQUFmLENBVFc7Ozs7bUNBY0ksU0FBcUI7QUFDcEMsbUJBQU8sUUFBUSxJQUFSLENBQWEsVUFBQyxRQUFELEVBQTJCO0FBQzNDLG9CQUFNLGNBQWMsU0FBUyxJQUFULENBQ2YsTUFEZSxDQUNSLFNBQVMsTUFBVCxDQURRLENBRWYsTUFGZSxDQUVSLFNBQVMsU0FBVCxDQUZRLENBR2YsTUFIZSxDQUdSLFNBQVMsS0FBVCxDQUhOLENBRHFDO0FBTTNDLHVCQUFPLGlCQUFXLElBQVgsQ0FBd0IsQ0FBQyxZQUFELEVBQWUsWUFBZixFQUE2QixLQUE3QixDQUF4QixFQUNGLFNBREUsQ0FDUTsyQkFBUSxvQkFBTyxXQUFQLEVBQW9COytCQUFXLHNCQUFTLE9BQVQsRUFBa0IsSUFBbEI7cUJBQVg7aUJBQTVCLENBRFIsQ0FFRixJQUZFLENBRUcsQ0FGSCxFQUdGLEdBSEUsQ0FHRTsyQkFBUSxLQUFLLElBQUwsQ0FBVSxTQUFTLEdBQVQsRUFBYyxJQUF4QjtpQkFBUixDQUhGLENBSUYsU0FKRSxFQUFQLENBTjJDO2FBQTNCLENBQWIsQ0FZRixJQVpFLENBWUc7dUJBQVEsS0FBSyxTQUFMLENBQWUsSUFBZixDQUFvQixJQUFwQjthQUFSLENBWlYsQ0FEb0M7Ozs7cUNBZ0J0QjtBQUNkLG1CQUFPLEtBQUssVUFBTCxDQUFnQixLQUFLLEdBQUwsQ0FBUyxnQ0FBVCxDQUFoQixFQUNGLElBREUsQ0FDRzt1QkFBTSxpQkFBVyxLQUFYLENBQWlCLElBQWpCLEVBQXVCLFNBQXZCO2FBQU4sQ0FESCxDQUVGLElBRkUsQ0FFRyxZQUFBO0FBQ0YscUJBQUssUUFBTCxDQUFjLFFBQWQsQ0FBdUIsS0FBSyxLQUFMLENBQVcsT0FBWCxDQUFtQixLQUFLLFNBQUwsQ0FBMUMsRUFBMkQsK0JBQTNELEVBREU7YUFBQSxDQUZWLENBRGM7Ozs7NEJBUU4sU0FBZTtBQUN2QixtQkFBTyxLQUFLLFNBQUwsQ0FBZSxHQUFmLENBQW1CLE9BQW5CLEVBQTRCLFNBQTVCLEVBQXVDLEVBQUUseUJBQXlCLElBQXpCLEVBQXpDLENBQVAsQ0FEdUI7Ozs7OEJBSWQsV0FBYztBQUN2QixpQkFBSyxTQUFMLEdBQWlCLFNBQWpCLENBRHVCOzs7O2tDQUliO0FBQ1YsaUJBQUssVUFBTCxDQUFnQixPQUFoQixHQURVOzs7Ozs7O0FBU1gsSUFBTSw0Q0FBa0IsSUFBSSxlQUFKLEVBQWxCIiwiZmlsZSI6ImxpYi9hdG9tL2dlbmVyYXRvci1hc3BuZXQuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBPYnNlcnZhYmxlIH0gZnJvbSBcInJ4anNcIjtcbmltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUgfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xuaW1wb3J0IHsgZWFjaCwgZW5kc1dpdGgsIGZpbHRlciB9IGZyb20gXCJsb2Rhc2hcIjtcbmltcG9ydCAqIGFzIHBhdGggZnJvbSBcInBhdGhcIjtcbmNvbnN0IGNvbW1hbmRzID0gW1xuICAgIFwiQW5ndWxhckNvbnRyb2xsZXJcIixcbiAgICBcIkFuZ3VsYXJDb250cm9sbGVyQXNcIixcbiAgICBcIkFuZ3VsYXJEaXJlY3RpdmVcIixcbiAgICBcIkFuZ3VsYXJGYWN0b3J5XCIsXG4gICAgXCJBbmd1bGFyTW9kdWxlXCIsXG4gICAgXCJCb3dlckpzb25cIixcbiAgICBcIkNsYXNzXCIsXG4gICAgXCJDb2ZmZWVTY3JpcHRcIixcbiAgICBcIkNvbmZpZ1wiLFxuICAgIFwiZ2l0aWdub3JlXCIsXG4gICAgXCJHcnVudGZpbGVcIixcbiAgICBcIkd1bHBmaWxlXCIsXG4gICAgXCJIVE1MUGFnZVwiLFxuICAgIFwiSW50ZXJmYWNlXCIsXG4gICAgXCJKYXZhU2NyaXB0XCIsXG4gICAgXCJKU2NyaXB0XCIsXG4gICAgXCJKU09OXCIsXG4gICAgXCJKU09OU2NoZW1hXCIsXG4gICAgXCJKU1hcIixcbiAgICBcIk1pZGRsZXdhcmVcIixcbiAgICBcIk12Y0NvbnRyb2xsZXJcIixcbiAgICBcIk12Y1ZpZXdcIixcbiAgICBcIlBhY2thZ2VKc29uXCIsXG4gICAgXCJTdGFydHVwQ2xhc3NcIixcbiAgICBcIlN0eWxlU2hlZXRcIixcbiAgICBcIlN0eWxlU2hlZXRMZXNzXCIsXG4gICAgXCJTdHlsZVNoZWV0U0NTU1wiLFxuICAgIFwiVGFnSGVscGVyXCIsXG4gICAgXCJUZXh0RmlsZVwiLFxuICAgIFwiVHlwZVNjcmlwdFwiLFxuICAgIFwiVHlwZVNjcmlwdENvbmZpZ1wiLFxuICAgIFwiV2ViQXBpQ29udHJvbGxlclwiXG5dO1xuY2xhc3MgR2VuZXJhdG9yQXNwbmV0IHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5yZXF1aXJlZCA9IHRydWU7XG4gICAgICAgIHRoaXMudGl0bGUgPSBcIkFzcG5ldCBZZW9tYW4gR2VuZXJhdG9yXCI7XG4gICAgICAgIHRoaXMuZGVzY3JpcHRpb24gPSBcIkVuYWJsZXMgdGhlIGFzcG5ldCB5ZW9tYW4gZ2VuZXJhdG9yLlwiO1xuICAgIH1cbiAgICBhY3RpdmF0ZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwib21uaXNoYXJwLWF0b206bmV3LXByb2plY3RcIiwgKCkgPT4gdGhpcy5uZXdQcm9qZWN0KCkpKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwiYyM6bmV3LXByb2plY3RcIiwgKCkgPT4gdGhpcy5uZXdQcm9qZWN0KCkpKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwib21uaXNoYXJwLWF0b206bmV3LWNsYXNzXCIsICgpID0+IHRoaXMucnVuKFwiYXNwbmV0OkNsYXNzXCIpKSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcIkMjOm5ldy1jbGFzc1wiLCAoKSA9PiB0aGlzLnJ1bihcImFzcG5ldDpDbGFzc1wiKSkpO1xuICAgICAgICBlYWNoKGNvbW1hbmRzLCBjb21tYW5kID0+IHtcbiAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBgb21uaXNoYXJwLWF0b206YXNwbmV0LSR7Y29tbWFuZH1gLCAoKSA9PiB0aGlzLmxvYWRDc0ZpbGUodGhpcy5ydW4oYGFzcG5ldDoke2NvbW1hbmR9YCkpKSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBsb2FkQ3NGaWxlKHByb21pc2UpIHtcbiAgICAgICAgcmV0dXJuIHByb21pc2UudGhlbigobWVzc2FnZXMpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGFsbE1lc3NhZ2VzID0gbWVzc2FnZXMuc2tpcFxuICAgICAgICAgICAgICAgIC5jb25jYXQobWVzc2FnZXMuY3JlYXRlKVxuICAgICAgICAgICAgICAgIC5jb25jYXQobWVzc2FnZXMuaWRlbnRpY2FsKVxuICAgICAgICAgICAgICAgIC5jb25jYXQobWVzc2FnZXMuZm9yY2UpO1xuICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuZnJvbShbXCJTdGFydHVwLmNzXCIsIFwiUHJvZ3JhbS5jc1wiLCBcIi5jc1wiXSlcbiAgICAgICAgICAgICAgICAuY29uY2F0TWFwKGZpbGUgPT4gZmlsdGVyKGFsbE1lc3NhZ2VzLCBtZXNzYWdlID0+IGVuZHNXaXRoKG1lc3NhZ2UsIGZpbGUpKSlcbiAgICAgICAgICAgICAgICAudGFrZSgxKVxuICAgICAgICAgICAgICAgIC5tYXAoZmlsZSA9PiBwYXRoLmpvaW4obWVzc2FnZXMuY3dkLCBmaWxlKSlcbiAgICAgICAgICAgICAgICAudG9Qcm9taXNlKCk7XG4gICAgICAgIH0pXG4gICAgICAgICAgICAudGhlbihmaWxlID0+IGF0b20ud29ya3NwYWNlLm9wZW4oZmlsZSkpO1xuICAgIH1cbiAgICBuZXdQcm9qZWN0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5sb2FkQ3NGaWxlKHRoaXMucnVuKFwiYXNwbmV0OmFwcCAtLWNyZWF0ZUluRGlyZWN0b3J5XCIpKVxuICAgICAgICAgICAgLnRoZW4oKCkgPT4gT2JzZXJ2YWJsZS50aW1lcigyMDAwKS50b1Byb21pc2UoKSlcbiAgICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIGF0b20uY29tbWFuZHMuZGlzcGF0Y2goYXRvbS52aWV3cy5nZXRWaWV3KGF0b20ud29ya3NwYWNlKSwgXCJvbW5pc2hhcnAtYXRvbTpyZXN0YXJ0LXNlcnZlclwiKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHJ1bihjb21tYW5kKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdlbmVyYXRvci5ydW4oY29tbWFuZCwgdW5kZWZpbmVkLCB7IHByb21wdE9uWmVyb0RpcmVjdG9yaWVzOiB0cnVlIH0pO1xuICAgIH1cbiAgICBzZXR1cChnZW5lcmF0b3IpIHtcbiAgICAgICAgdGhpcy5nZW5lcmF0b3IgPSBnZW5lcmF0b3I7XG4gICAgfVxuICAgIGRpc3Bvc2UoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfVxufVxuZXhwb3J0IGNvbnN0IGdlbmVyYXRvckFzcG5ldCA9IG5ldyBHZW5lcmF0b3JBc3BuZXQ7XG4iLCJpbXBvcnQge09ic2VydmFibGV9IGZyb20gXCJyeGpzXCI7XHJcbmltcG9ydCB7Q29tcG9zaXRlRGlzcG9zYWJsZX0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcclxuaW1wb3J0IHtlYWNoLCBlbmRzV2l0aCwgZmlsdGVyfSBmcm9tIFwibG9kYXNoXCI7XHJcbmltcG9ydCAqIGFzIHBhdGggZnJvbSBcInBhdGhcIjtcclxuXHJcbi8vIFRPRE86IE1ha2Ugc3VyZSBpdCBzdGF5cyBpbiBzeW5jIHdpdGhcclxuY29uc3QgY29tbWFuZHMgPSBbXHJcbiAgICBcIkFuZ3VsYXJDb250cm9sbGVyXCIsXHJcbiAgICBcIkFuZ3VsYXJDb250cm9sbGVyQXNcIixcclxuICAgIFwiQW5ndWxhckRpcmVjdGl2ZVwiLFxyXG4gICAgXCJBbmd1bGFyRmFjdG9yeVwiLFxyXG4gICAgXCJBbmd1bGFyTW9kdWxlXCIsXHJcbiAgICBcIkJvd2VySnNvblwiLFxyXG4gICAgXCJDbGFzc1wiLFxyXG4gICAgXCJDb2ZmZWVTY3JpcHRcIixcclxuICAgIFwiQ29uZmlnXCIsXHJcbiAgICBcImdpdGlnbm9yZVwiLFxyXG4gICAgXCJHcnVudGZpbGVcIixcclxuICAgIFwiR3VscGZpbGVcIixcclxuICAgIFwiSFRNTFBhZ2VcIixcclxuICAgIFwiSW50ZXJmYWNlXCIsXHJcbiAgICBcIkphdmFTY3JpcHRcIixcclxuICAgIFwiSlNjcmlwdFwiLFxyXG4gICAgXCJKU09OXCIsXHJcbiAgICBcIkpTT05TY2hlbWFcIixcclxuICAgIFwiSlNYXCIsXHJcbiAgICBcIk1pZGRsZXdhcmVcIixcclxuICAgIFwiTXZjQ29udHJvbGxlclwiLFxyXG4gICAgXCJNdmNWaWV3XCIsXHJcbiAgICBcIlBhY2thZ2VKc29uXCIsXHJcbiAgICBcIlN0YXJ0dXBDbGFzc1wiLFxyXG4gICAgXCJTdHlsZVNoZWV0XCIsXHJcbiAgICBcIlN0eWxlU2hlZXRMZXNzXCIsXHJcbiAgICBcIlN0eWxlU2hlZXRTQ1NTXCIsXHJcbiAgICBcIlRhZ0hlbHBlclwiLFxyXG4gICAgXCJUZXh0RmlsZVwiLFxyXG4gICAgXCJUeXBlU2NyaXB0XCIsXHJcbiAgICBcIlR5cGVTY3JpcHRDb25maWdcIixcclxuICAgIFwiV2ViQXBpQ29udHJvbGxlclwiXHJcbl07XHJcblxyXG5tb2R1bGUgWWVvbWFuIHtcclxuICAgIGV4cG9ydCBpbnRlcmZhY2UgSU1lc3NhZ2VzIHtcclxuICAgICAgICBjd2Q/OiBzdHJpbmc7XHJcbiAgICAgICAgc2tpcDogc3RyaW5nW107XHJcbiAgICAgICAgZm9yY2U6IHN0cmluZ1tdO1xyXG4gICAgICAgIGNyZWF0ZTogc3RyaW5nW107XHJcbiAgICAgICAgaW52b2tlOiBzdHJpbmdbXTtcclxuICAgICAgICBjb25mbGljdDogc3RyaW5nW107XHJcbiAgICAgICAgaWRlbnRpY2FsOiBzdHJpbmdbXTtcclxuICAgICAgICBpbmZvOiBzdHJpbmdbXTtcclxuICAgIH1cclxufVxyXG5cclxuY2xhc3MgR2VuZXJhdG9yQXNwbmV0IGltcGxlbWVudHMgSUZlYXR1cmUge1xyXG4gICAgcHJpdmF0ZSBkaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xyXG4gICAgcHJpdmF0ZSBnZW5lcmF0b3I6IHtcclxuICAgICAgICBydW4oZ2VuZXJhdG9yOiBzdHJpbmcsIHBhdGg/OiBzdHJpbmcsIG9wdGlvbnM/OiBhbnkpOiBQcm9taXNlPGFueT47IHN0YXJ0KHByZWZpeDogc3RyaW5nLCBwYXRoPzogc3RyaW5nLCBvcHRpb25zPzogYW55KTogUHJvbWlzZTxhbnk+O1xyXG4gICAgICAgIGxpc3QocHJlZml4Pzogc3RyaW5nLCBwYXRoPzogc3RyaW5nLCBvcHRpb25zPzogYW55KTogUHJvbWlzZTx7IGRpc3BsYXlOYW1lOiBzdHJpbmc7IG5hbWU6IHN0cmluZzsgcmVzb2x2ZWQ6IHN0cmluZzsgfVtdPlxyXG4gICAgfTtcclxuXHJcbiAgICBwdWJsaWMgYWN0aXZhdGUoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwib21uaXNoYXJwLWF0b206bmV3LXByb2plY3RcIiwgKCkgPT4gdGhpcy5uZXdQcm9qZWN0KCkpKTtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJjIzpuZXctcHJvamVjdFwiLCAoKSA9PiB0aGlzLm5ld1Byb2plY3QoKSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTpuZXctY2xhc3NcIiwgKCkgPT4gdGhpcy5ydW4oXCJhc3BuZXQ6Q2xhc3NcIikpKTtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJDIzpuZXctY2xhc3NcIiwgKCkgPT4gdGhpcy5ydW4oXCJhc3BuZXQ6Q2xhc3NcIikpKTtcclxuXHJcbiAgICAgICAgZWFjaChjb21tYW5kcywgY29tbWFuZCA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBgb21uaXNoYXJwLWF0b206YXNwbmV0LSR7Y29tbWFuZH1gLCAoKSA9PiB0aGlzLmxvYWRDc0ZpbGUodGhpcy5ydW4oYGFzcG5ldDoke2NvbW1hbmR9YCkpKSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBsb2FkQ3NGaWxlKHByb21pc2U6IFByb21pc2U8YW55Pikge1xyXG4gICAgICAgIHJldHVybiBwcm9taXNlLnRoZW4oKG1lc3NhZ2VzOiBZZW9tYW4uSU1lc3NhZ2VzKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IGFsbE1lc3NhZ2VzID0gbWVzc2FnZXMuc2tpcFxyXG4gICAgICAgICAgICAgICAgLmNvbmNhdChtZXNzYWdlcy5jcmVhdGUpXHJcbiAgICAgICAgICAgICAgICAuY29uY2F0KG1lc3NhZ2VzLmlkZW50aWNhbClcclxuICAgICAgICAgICAgICAgIC5jb25jYXQobWVzc2FnZXMuZm9yY2UpO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuZnJvbTxzdHJpbmc+KFtcIlN0YXJ0dXAuY3NcIiwgXCJQcm9ncmFtLmNzXCIsIFwiLmNzXCJdKVxyXG4gICAgICAgICAgICAgICAgLmNvbmNhdE1hcChmaWxlID0+IGZpbHRlcihhbGxNZXNzYWdlcywgbWVzc2FnZSA9PiBlbmRzV2l0aChtZXNzYWdlLCBmaWxlKSkpXHJcbiAgICAgICAgICAgICAgICAudGFrZSgxKVxyXG4gICAgICAgICAgICAgICAgLm1hcChmaWxlID0+IHBhdGguam9pbihtZXNzYWdlcy5jd2QsIGZpbGUpKVxyXG4gICAgICAgICAgICAgICAgLnRvUHJvbWlzZSgpO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgICAgIC50aGVuKGZpbGUgPT4gYXRvbS53b3Jrc3BhY2Uub3BlbihmaWxlKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBuZXdQcm9qZWN0KCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmxvYWRDc0ZpbGUodGhpcy5ydW4oXCJhc3BuZXQ6YXBwIC0tY3JlYXRlSW5EaXJlY3RvcnlcIikpXHJcbiAgICAgICAgICAgIC50aGVuKCgpID0+IE9ic2VydmFibGUudGltZXIoMjAwMCkudG9Qcm9taXNlKCkpXHJcbiAgICAgICAgICAgIC50aGVuKCgpID0+IHtcclxuICAgICAgICAgICAgICAgIGF0b20uY29tbWFuZHMuZGlzcGF0Y2goYXRvbS52aWV3cy5nZXRWaWV3KGF0b20ud29ya3NwYWNlKSwgXCJvbW5pc2hhcnAtYXRvbTpyZXN0YXJ0LXNlcnZlclwiKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBydW4oY29tbWFuZDogc3RyaW5nKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2VuZXJhdG9yLnJ1bihjb21tYW5kLCB1bmRlZmluZWQsIHsgcHJvbXB0T25aZXJvRGlyZWN0b3JpZXM6IHRydWUgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHNldHVwKGdlbmVyYXRvcjogYW55KSB7XHJcbiAgICAgICAgdGhpcy5nZW5lcmF0b3IgPSBnZW5lcmF0b3I7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVxdWlyZWQgPSB0cnVlO1xyXG4gICAgcHVibGljIHRpdGxlID0gXCJBc3BuZXQgWWVvbWFuIEdlbmVyYXRvclwiO1xyXG4gICAgcHVibGljIGRlc2NyaXB0aW9uID0gXCJFbmFibGVzIHRoZSBhc3BuZXQgeWVvbWFuIGdlbmVyYXRvci5cIjtcclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IGdlbmVyYXRvckFzcG5ldCA9IG5ldyBHZW5lcmF0b3JBc3BuZXQ7XHJcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
