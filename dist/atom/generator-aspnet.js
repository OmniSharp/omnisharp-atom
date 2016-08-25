"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.generatorAspnet = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _rxjs = require("rxjs");

var _tsDisposables = require("ts-disposables");

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

            this.disposable = new _tsDisposables.CompositeDisposable();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9hdG9tL2dlbmVyYXRvci1hc3BuZXQuanMiLCJsaWIvYXRvbS9nZW5lcmF0b3ItYXNwbmV0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQUNBOztBQUNBOztBQUNBOztJQ0FZOzs7Ozs7QUFHWixJQUFNLFdBQVcsQ0FDYixtQkFEYSxFQUViLHFCQUZhLEVBR2Isa0JBSGEsRUFJYixnQkFKYSxFQUtiLGVBTGEsRUFNYixXQU5hLEVBT2IsT0FQYSxFQVFiLGNBUmEsRUFTYixRQVRhLEVBVWIsV0FWYSxFQVdiLFdBWGEsRUFZYixVQVphLEVBYWIsVUFiYSxFQWNiLFdBZGEsRUFlYixZQWZhLEVBZ0JiLFNBaEJhLEVBaUJiLE1BakJhLEVBa0JiLFlBbEJhLEVBbUJiLEtBbkJhLEVBb0JiLFlBcEJhLEVBcUJiLGVBckJhLEVBc0JiLFNBdEJhLEVBdUJiLGFBdkJhLEVBd0JiLGNBeEJhLEVBeUJiLFlBekJhLEVBMEJiLGdCQTFCYSxFQTJCYixnQkEzQmEsRUE0QmIsV0E1QmEsRUE2QmIsVUE3QmEsRUE4QmIsWUE5QmEsRUErQmIsa0JBL0JhLEVBZ0NiLGtCQWhDYSxDQUFYOztJQWdETjtBQUFBLCtCQUFBOzs7QUF5RFcsYUFBQSxRQUFBLEdBQVcsSUFBWCxDQXpEWDtBQTBEVyxhQUFBLEtBQUEsR0FBUSx5QkFBUixDQTFEWDtBQTJEVyxhQUFBLFdBQUEsR0FBYyxzQ0FBZCxDQTNEWDtLQUFBOzs7O21DQU9tQjs7O0FBQ1gsaUJBQUssVUFBTCxHQUFrQix3Q0FBbEIsQ0FEVztBQUdYLGlCQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsS0FBSyxRQUFMLENBQWMsR0FBZCxDQUFrQixnQkFBbEIsRUFBb0MsNEJBQXBDLEVBQWtFO3VCQUFNLE1BQUssVUFBTDthQUFOLENBQXRGLEVBSFc7QUFJWCxpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLEtBQUssUUFBTCxDQUFjLEdBQWQsQ0FBa0IsZ0JBQWxCLEVBQW9DLGdCQUFwQyxFQUFzRDt1QkFBTSxNQUFLLFVBQUw7YUFBTixDQUExRSxFQUpXO0FBTVgsaUJBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQixLQUFLLFFBQUwsQ0FBYyxHQUFkLENBQWtCLGdCQUFsQixFQUFvQywwQkFBcEMsRUFBZ0U7dUJBQU0sTUFBSyxHQUFMLENBQVMsY0FBVDthQUFOLENBQXBGLEVBTlc7QUFPWCxpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLEtBQUssUUFBTCxDQUFjLEdBQWQsQ0FBa0IsZ0JBQWxCLEVBQW9DLGNBQXBDLEVBQW9EO3VCQUFNLE1BQUssR0FBTCxDQUFTLGNBQVQ7YUFBTixDQUF4RSxFQVBXO0FBU1gsOEJBQUssUUFBTCxFQUFlLG1CQUFPO0FBQ2xCLHNCQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsS0FBSyxRQUFMLENBQWMsR0FBZCxDQUFrQixnQkFBbEIsNkJBQTZELE9BQTdELEVBQXdFOzJCQUFNLE1BQUssVUFBTCxDQUFnQixNQUFLLEdBQUwsYUFBbUIsT0FBbkIsQ0FBaEI7aUJBQU4sQ0FBNUYsRUFEa0I7YUFBUCxDQUFmLENBVFc7Ozs7bUNBY0ksU0FBcUI7QUFDcEMsbUJBQU8sUUFBUSxJQUFSLENBQWEsVUFBQyxRQUFELEVBQTJCO0FBQzNDLG9CQUFNLGNBQWMsU0FBUyxJQUFULENBQ2YsTUFEZSxDQUNSLFNBQVMsTUFBVCxDQURRLENBRWYsTUFGZSxDQUVSLFNBQVMsU0FBVCxDQUZRLENBR2YsTUFIZSxDQUdSLFNBQVMsS0FBVCxDQUhOLENBRHFDO0FBTTNDLHVCQUFPLGlCQUFXLElBQVgsQ0FBd0IsQ0FBQyxZQUFELEVBQWUsWUFBZixFQUE2QixLQUE3QixDQUF4QixFQUNGLFNBREUsQ0FDUTsyQkFBUSxvQkFBTyxXQUFQLEVBQW9COytCQUFXLHNCQUFTLE9BQVQsRUFBa0IsSUFBbEI7cUJBQVg7aUJBQTVCLENBRFIsQ0FFRixJQUZFLENBRUcsQ0FGSCxFQUdGLEdBSEUsQ0FHRTsyQkFBUSxLQUFLLElBQUwsQ0FBVSxTQUFTLEdBQVQsRUFBYyxJQUF4QjtpQkFBUixDQUhGLENBSUYsU0FKRSxFQUFQLENBTjJDO2FBQTNCLENBQWIsQ0FZRixJQVpFLENBWUc7dUJBQVEsS0FBSyxTQUFMLENBQWUsSUFBZixDQUFvQixJQUFwQjthQUFSLENBWlYsQ0FEb0M7Ozs7cUNBZ0J0QjtBQUNkLG1CQUFPLEtBQUssVUFBTCxDQUFnQixLQUFLLEdBQUwsQ0FBUyxnQ0FBVCxDQUFoQixFQUNGLElBREUsQ0FDRzt1QkFBTSxpQkFBVyxLQUFYLENBQWlCLElBQWpCLEVBQXVCLFNBQXZCO2FBQU4sQ0FESCxDQUVGLElBRkUsQ0FFRyxZQUFBO0FBQ0YscUJBQUssUUFBTCxDQUFjLFFBQWQsQ0FBdUIsS0FBSyxLQUFMLENBQVcsT0FBWCxDQUFtQixLQUFLLFNBQUwsQ0FBMUMsRUFBMkQsK0JBQTNELEVBREU7YUFBQSxDQUZWLENBRGM7Ozs7NEJBUU4sU0FBZTtBQUN2QixtQkFBTyxLQUFLLFNBQUwsQ0FBZSxHQUFmLENBQW1CLE9BQW5CLEVBQTRCLFNBQTVCLEVBQXVDLEVBQUUseUJBQXlCLElBQXpCLEVBQXpDLENBQVAsQ0FEdUI7Ozs7OEJBSWQsV0FBYztBQUN2QixpQkFBSyxTQUFMLEdBQWlCLFNBQWpCLENBRHVCOzs7O2tDQUliO0FBQ1YsaUJBQUssVUFBTCxDQUFnQixPQUFoQixHQURVOzs7Ozs7O0FBU1gsSUFBTSw0Q0FBa0IsSUFBSSxlQUFKLEVBQWxCIiwiZmlsZSI6ImxpYi9hdG9tL2dlbmVyYXRvci1hc3BuZXQuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBPYnNlcnZhYmxlIH0gZnJvbSBcInJ4anNcIjtcbmltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUgfSBmcm9tIFwidHMtZGlzcG9zYWJsZXNcIjtcbmltcG9ydCB7IGVhY2gsIGVuZHNXaXRoLCBmaWx0ZXIgfSBmcm9tIFwibG9kYXNoXCI7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gXCJwYXRoXCI7XG5jb25zdCBjb21tYW5kcyA9IFtcbiAgICBcIkFuZ3VsYXJDb250cm9sbGVyXCIsXG4gICAgXCJBbmd1bGFyQ29udHJvbGxlckFzXCIsXG4gICAgXCJBbmd1bGFyRGlyZWN0aXZlXCIsXG4gICAgXCJBbmd1bGFyRmFjdG9yeVwiLFxuICAgIFwiQW5ndWxhck1vZHVsZVwiLFxuICAgIFwiQm93ZXJKc29uXCIsXG4gICAgXCJDbGFzc1wiLFxuICAgIFwiQ29mZmVlU2NyaXB0XCIsXG4gICAgXCJDb25maWdcIixcbiAgICBcImdpdGlnbm9yZVwiLFxuICAgIFwiR3J1bnRmaWxlXCIsXG4gICAgXCJHdWxwZmlsZVwiLFxuICAgIFwiSFRNTFBhZ2VcIixcbiAgICBcIkludGVyZmFjZVwiLFxuICAgIFwiSmF2YVNjcmlwdFwiLFxuICAgIFwiSlNjcmlwdFwiLFxuICAgIFwiSlNPTlwiLFxuICAgIFwiSlNPTlNjaGVtYVwiLFxuICAgIFwiSlNYXCIsXG4gICAgXCJNaWRkbGV3YXJlXCIsXG4gICAgXCJNdmNDb250cm9sbGVyXCIsXG4gICAgXCJNdmNWaWV3XCIsXG4gICAgXCJQYWNrYWdlSnNvblwiLFxuICAgIFwiU3RhcnR1cENsYXNzXCIsXG4gICAgXCJTdHlsZVNoZWV0XCIsXG4gICAgXCJTdHlsZVNoZWV0TGVzc1wiLFxuICAgIFwiU3R5bGVTaGVldFNDU1NcIixcbiAgICBcIlRhZ0hlbHBlclwiLFxuICAgIFwiVGV4dEZpbGVcIixcbiAgICBcIlR5cGVTY3JpcHRcIixcbiAgICBcIlR5cGVTY3JpcHRDb25maWdcIixcbiAgICBcIldlYkFwaUNvbnRyb2xsZXJcIlxuXTtcbmNsYXNzIEdlbmVyYXRvckFzcG5ldCB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMucmVxdWlyZWQgPSB0cnVlO1xuICAgICAgICB0aGlzLnRpdGxlID0gXCJBc3BuZXQgWWVvbWFuIEdlbmVyYXRvclwiO1xuICAgICAgICB0aGlzLmRlc2NyaXB0aW9uID0gXCJFbmFibGVzIHRoZSBhc3BuZXQgeWVvbWFuIGdlbmVyYXRvci5cIjtcbiAgICB9XG4gICAgYWN0aXZhdGUoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcIm9tbmlzaGFycC1hdG9tOm5ldy1wcm9qZWN0XCIsICgpID0+IHRoaXMubmV3UHJvamVjdCgpKSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcImMjOm5ldy1wcm9qZWN0XCIsICgpID0+IHRoaXMubmV3UHJvamVjdCgpKSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcIm9tbmlzaGFycC1hdG9tOm5ldy1jbGFzc1wiLCAoKSA9PiB0aGlzLnJ1bihcImFzcG5ldDpDbGFzc1wiKSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJDIzpuZXctY2xhc3NcIiwgKCkgPT4gdGhpcy5ydW4oXCJhc3BuZXQ6Q2xhc3NcIikpKTtcbiAgICAgICAgZWFjaChjb21tYW5kcywgY29tbWFuZCA9PiB7XG4gICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgYG9tbmlzaGFycC1hdG9tOmFzcG5ldC0ke2NvbW1hbmR9YCwgKCkgPT4gdGhpcy5sb2FkQ3NGaWxlKHRoaXMucnVuKGBhc3BuZXQ6JHtjb21tYW5kfWApKSkpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgbG9hZENzRmlsZShwcm9taXNlKSB7XG4gICAgICAgIHJldHVybiBwcm9taXNlLnRoZW4oKG1lc3NhZ2VzKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBhbGxNZXNzYWdlcyA9IG1lc3NhZ2VzLnNraXBcbiAgICAgICAgICAgICAgICAuY29uY2F0KG1lc3NhZ2VzLmNyZWF0ZSlcbiAgICAgICAgICAgICAgICAuY29uY2F0KG1lc3NhZ2VzLmlkZW50aWNhbClcbiAgICAgICAgICAgICAgICAuY29uY2F0KG1lc3NhZ2VzLmZvcmNlKTtcbiAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmZyb20oW1wiU3RhcnR1cC5jc1wiLCBcIlByb2dyYW0uY3NcIiwgXCIuY3NcIl0pXG4gICAgICAgICAgICAgICAgLmNvbmNhdE1hcChmaWxlID0+IGZpbHRlcihhbGxNZXNzYWdlcywgbWVzc2FnZSA9PiBlbmRzV2l0aChtZXNzYWdlLCBmaWxlKSkpXG4gICAgICAgICAgICAgICAgLnRha2UoMSlcbiAgICAgICAgICAgICAgICAubWFwKGZpbGUgPT4gcGF0aC5qb2luKG1lc3NhZ2VzLmN3ZCwgZmlsZSkpXG4gICAgICAgICAgICAgICAgLnRvUHJvbWlzZSgpO1xuICAgICAgICB9KVxuICAgICAgICAgICAgLnRoZW4oZmlsZSA9PiBhdG9tLndvcmtzcGFjZS5vcGVuKGZpbGUpKTtcbiAgICB9XG4gICAgbmV3UHJvamVjdCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubG9hZENzRmlsZSh0aGlzLnJ1bihcImFzcG5ldDphcHAgLS1jcmVhdGVJbkRpcmVjdG9yeVwiKSlcbiAgICAgICAgICAgIC50aGVuKCgpID0+IE9ic2VydmFibGUudGltZXIoMjAwMCkudG9Qcm9taXNlKCkpXG4gICAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSksIFwib21uaXNoYXJwLWF0b206cmVzdGFydC1zZXJ2ZXJcIik7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBydW4oY29tbWFuZCkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZW5lcmF0b3IucnVuKGNvbW1hbmQsIHVuZGVmaW5lZCwgeyBwcm9tcHRPblplcm9EaXJlY3RvcmllczogdHJ1ZSB9KTtcbiAgICB9XG4gICAgc2V0dXAoZ2VuZXJhdG9yKSB7XG4gICAgICAgIHRoaXMuZ2VuZXJhdG9yID0gZ2VuZXJhdG9yO1xuICAgIH1cbiAgICBkaXNwb3NlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgIH1cbn1cbmV4cG9ydCBjb25zdCBnZW5lcmF0b3JBc3BuZXQgPSBuZXcgR2VuZXJhdG9yQXNwbmV0O1xuIiwiaW1wb3J0IHtPYnNlcnZhYmxlfSBmcm9tIFwicnhqc1wiO1xyXG5pbXBvcnQge0NvbXBvc2l0ZURpc3Bvc2FibGV9IGZyb20gXCJ0cy1kaXNwb3NhYmxlc1wiO1xyXG5pbXBvcnQge2VhY2gsIGVuZHNXaXRoLCBmaWx0ZXJ9IGZyb20gXCJsb2Rhc2hcIjtcclxuaW1wb3J0ICogYXMgcGF0aCBmcm9tIFwicGF0aFwiO1xyXG5cclxuLy8gVE9ETzogTWFrZSBzdXJlIGl0IHN0YXlzIGluIHN5bmMgd2l0aFxyXG5jb25zdCBjb21tYW5kcyA9IFtcclxuICAgIFwiQW5ndWxhckNvbnRyb2xsZXJcIixcclxuICAgIFwiQW5ndWxhckNvbnRyb2xsZXJBc1wiLFxyXG4gICAgXCJBbmd1bGFyRGlyZWN0aXZlXCIsXHJcbiAgICBcIkFuZ3VsYXJGYWN0b3J5XCIsXHJcbiAgICBcIkFuZ3VsYXJNb2R1bGVcIixcclxuICAgIFwiQm93ZXJKc29uXCIsXHJcbiAgICBcIkNsYXNzXCIsXHJcbiAgICBcIkNvZmZlZVNjcmlwdFwiLFxyXG4gICAgXCJDb25maWdcIixcclxuICAgIFwiZ2l0aWdub3JlXCIsXHJcbiAgICBcIkdydW50ZmlsZVwiLFxyXG4gICAgXCJHdWxwZmlsZVwiLFxyXG4gICAgXCJIVE1MUGFnZVwiLFxyXG4gICAgXCJJbnRlcmZhY2VcIixcclxuICAgIFwiSmF2YVNjcmlwdFwiLFxyXG4gICAgXCJKU2NyaXB0XCIsXHJcbiAgICBcIkpTT05cIixcclxuICAgIFwiSlNPTlNjaGVtYVwiLFxyXG4gICAgXCJKU1hcIixcclxuICAgIFwiTWlkZGxld2FyZVwiLFxyXG4gICAgXCJNdmNDb250cm9sbGVyXCIsXHJcbiAgICBcIk12Y1ZpZXdcIixcclxuICAgIFwiUGFja2FnZUpzb25cIixcclxuICAgIFwiU3RhcnR1cENsYXNzXCIsXHJcbiAgICBcIlN0eWxlU2hlZXRcIixcclxuICAgIFwiU3R5bGVTaGVldExlc3NcIixcclxuICAgIFwiU3R5bGVTaGVldFNDU1NcIixcclxuICAgIFwiVGFnSGVscGVyXCIsXHJcbiAgICBcIlRleHRGaWxlXCIsXHJcbiAgICBcIlR5cGVTY3JpcHRcIixcclxuICAgIFwiVHlwZVNjcmlwdENvbmZpZ1wiLFxyXG4gICAgXCJXZWJBcGlDb250cm9sbGVyXCJcclxuXTtcclxuXHJcbm1vZHVsZSBZZW9tYW4ge1xyXG4gICAgZXhwb3J0IGludGVyZmFjZSBJTWVzc2FnZXMge1xyXG4gICAgICAgIGN3ZD86IHN0cmluZztcclxuICAgICAgICBza2lwOiBzdHJpbmdbXTtcclxuICAgICAgICBmb3JjZTogc3RyaW5nW107XHJcbiAgICAgICAgY3JlYXRlOiBzdHJpbmdbXTtcclxuICAgICAgICBpbnZva2U6IHN0cmluZ1tdO1xyXG4gICAgICAgIGNvbmZsaWN0OiBzdHJpbmdbXTtcclxuICAgICAgICBpZGVudGljYWw6IHN0cmluZ1tdO1xyXG4gICAgICAgIGluZm86IHN0cmluZ1tdO1xyXG4gICAgfVxyXG59XHJcblxyXG5jbGFzcyBHZW5lcmF0b3JBc3BuZXQgaW1wbGVtZW50cyBJRmVhdHVyZSB7XHJcbiAgICBwcml2YXRlIGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XHJcbiAgICBwcml2YXRlIGdlbmVyYXRvcjoge1xyXG4gICAgICAgIHJ1bihnZW5lcmF0b3I6IHN0cmluZywgcGF0aD86IHN0cmluZywgb3B0aW9ucz86IGFueSk6IFByb21pc2U8YW55Pjsgc3RhcnQocHJlZml4OiBzdHJpbmcsIHBhdGg/OiBzdHJpbmcsIG9wdGlvbnM/OiBhbnkpOiBQcm9taXNlPGFueT47XHJcbiAgICAgICAgbGlzdChwcmVmaXg/OiBzdHJpbmcsIHBhdGg/OiBzdHJpbmcsIG9wdGlvbnM/OiBhbnkpOiBQcm9taXNlPHsgZGlzcGxheU5hbWU6IHN0cmluZzsgbmFtZTogc3RyaW5nOyByZXNvbHZlZDogc3RyaW5nOyB9W10+XHJcbiAgICB9O1xyXG5cclxuICAgIHB1YmxpYyBhY3RpdmF0ZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTpuZXctcHJvamVjdFwiLCAoKSA9PiB0aGlzLm5ld1Byb2plY3QoKSkpO1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcImMjOm5ldy1wcm9qZWN0XCIsICgpID0+IHRoaXMubmV3UHJvamVjdCgpKSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcIm9tbmlzaGFycC1hdG9tOm5ldy1jbGFzc1wiLCAoKSA9PiB0aGlzLnJ1bihcImFzcG5ldDpDbGFzc1wiKSkpO1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcIkMjOm5ldy1jbGFzc1wiLCAoKSA9PiB0aGlzLnJ1bihcImFzcG5ldDpDbGFzc1wiKSkpO1xyXG5cclxuICAgICAgICBlYWNoKGNvbW1hbmRzLCBjb21tYW5kID0+IHtcclxuICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIGBvbW5pc2hhcnAtYXRvbTphc3BuZXQtJHtjb21tYW5kfWAsICgpID0+IHRoaXMubG9hZENzRmlsZSh0aGlzLnJ1bihgYXNwbmV0OiR7Y29tbWFuZH1gKSkpKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGxvYWRDc0ZpbGUocHJvbWlzZTogUHJvbWlzZTxhbnk+KSB7XHJcbiAgICAgICAgcmV0dXJuIHByb21pc2UudGhlbigobWVzc2FnZXM6IFllb21hbi5JTWVzc2FnZXMpID0+IHtcclxuICAgICAgICAgICAgY29uc3QgYWxsTWVzc2FnZXMgPSBtZXNzYWdlcy5za2lwXHJcbiAgICAgICAgICAgICAgICAuY29uY2F0KG1lc3NhZ2VzLmNyZWF0ZSlcclxuICAgICAgICAgICAgICAgIC5jb25jYXQobWVzc2FnZXMuaWRlbnRpY2FsKVxyXG4gICAgICAgICAgICAgICAgLmNvbmNhdChtZXNzYWdlcy5mb3JjZSk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5mcm9tPHN0cmluZz4oW1wiU3RhcnR1cC5jc1wiLCBcIlByb2dyYW0uY3NcIiwgXCIuY3NcIl0pXHJcbiAgICAgICAgICAgICAgICAuY29uY2F0TWFwKGZpbGUgPT4gZmlsdGVyKGFsbE1lc3NhZ2VzLCBtZXNzYWdlID0+IGVuZHNXaXRoKG1lc3NhZ2UsIGZpbGUpKSlcclxuICAgICAgICAgICAgICAgIC50YWtlKDEpXHJcbiAgICAgICAgICAgICAgICAubWFwKGZpbGUgPT4gcGF0aC5qb2luKG1lc3NhZ2VzLmN3ZCwgZmlsZSkpXHJcbiAgICAgICAgICAgICAgICAudG9Qcm9taXNlKCk7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAgICAgLnRoZW4oZmlsZSA9PiBhdG9tLndvcmtzcGFjZS5vcGVuKGZpbGUpKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIG5ld1Byb2plY3QoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubG9hZENzRmlsZSh0aGlzLnJ1bihcImFzcG5ldDphcHAgLS1jcmVhdGVJbkRpcmVjdG9yeVwiKSlcclxuICAgICAgICAgICAgLnRoZW4oKCkgPT4gT2JzZXJ2YWJsZS50aW1lcigyMDAwKS50b1Byb21pc2UoKSlcclxuICAgICAgICAgICAgLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgYXRvbS5jb21tYW5kcy5kaXNwYXRjaChhdG9tLnZpZXdzLmdldFZpZXcoYXRvbS53b3Jrc3BhY2UpLCBcIm9tbmlzaGFycC1hdG9tOnJlc3RhcnQtc2VydmVyXCIpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHJ1bihjb21tYW5kOiBzdHJpbmcpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5nZW5lcmF0b3IucnVuKGNvbW1hbmQsIHVuZGVmaW5lZCwgeyBwcm9tcHRPblplcm9EaXJlY3RvcmllczogdHJ1ZSB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2V0dXAoZ2VuZXJhdG9yOiBhbnkpIHtcclxuICAgICAgICB0aGlzLmdlbmVyYXRvciA9IGdlbmVyYXRvcjtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGlzcG9zZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZXF1aXJlZCA9IHRydWU7XHJcbiAgICBwdWJsaWMgdGl0bGUgPSBcIkFzcG5ldCBZZW9tYW4gR2VuZXJhdG9yXCI7XHJcbiAgICBwdWJsaWMgZGVzY3JpcHRpb24gPSBcIkVuYWJsZXMgdGhlIGFzcG5ldCB5ZW9tYW4gZ2VuZXJhdG9yLlwiO1xyXG59XHJcblxyXG5leHBvcnQgY29uc3QgZ2VuZXJhdG9yQXNwbmV0ID0gbmV3IEdlbmVyYXRvckFzcG5ldDtcclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
