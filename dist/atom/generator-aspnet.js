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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9hdG9tL2dlbmVyYXRvci1hc3BuZXQuanMiLCJsaWIvYXRvbS9nZW5lcmF0b3ItYXNwbmV0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQUNBOztBQUNBOztBQUNBOztJQ0FZLEk7Ozs7OztBQUdaLElBQU0sV0FBVyxDQUNiLG1CQURhLEVBRWIscUJBRmEsRUFHYixrQkFIYSxFQUliLGdCQUphLEVBS2IsZUFMYSxFQU1iLFdBTmEsRUFPYixPQVBhLEVBUWIsY0FSYSxFQVNiLFFBVGEsRUFVYixXQVZhLEVBV2IsV0FYYSxFQVliLFVBWmEsRUFhYixVQWJhLEVBY2IsV0FkYSxFQWViLFlBZmEsRUFnQmIsU0FoQmEsRUFpQmIsTUFqQmEsRUFrQmIsWUFsQmEsRUFtQmIsS0FuQmEsRUFvQmIsWUFwQmEsRUFxQmIsZUFyQmEsRUFzQmIsU0F0QmEsRUF1QmIsYUF2QmEsRUF3QmIsY0F4QmEsRUF5QmIsWUF6QmEsRUEwQmIsZ0JBMUJhLEVBMkJiLGdCQTNCYSxFQTRCYixXQTVCYSxFQTZCYixVQTdCYSxFQThCYixZQTlCYSxFQStCYixrQkEvQmEsRUFnQ2Isa0JBaENhLENBQWpCOztJQWdEQSxlO0FBQUEsK0JBQUE7QUFBQTs7QUF5RFcsYUFBQSxRQUFBLEdBQVcsSUFBWDtBQUNBLGFBQUEsS0FBQSxHQUFRLHlCQUFSO0FBQ0EsYUFBQSxXQUFBLEdBQWMsc0NBQWQ7QUFDVjs7OzttQ0FyRGtCO0FBQUE7O0FBQ1gsaUJBQUssVUFBTCxHQUFrQiwwQ0FBbEI7QUFFQSxpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLEtBQUssUUFBTCxDQUFjLEdBQWQsQ0FBa0IsZ0JBQWxCLEVBQW9DLDRCQUFwQyxFQUFrRTtBQUFBLHVCQUFNLE1BQUssVUFBTCxFQUFOO0FBQUEsYUFBbEUsQ0FBcEI7QUFDQSxpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLEtBQUssUUFBTCxDQUFjLEdBQWQsQ0FBa0IsZ0JBQWxCLEVBQW9DLGdCQUFwQyxFQUFzRDtBQUFBLHVCQUFNLE1BQUssVUFBTCxFQUFOO0FBQUEsYUFBdEQsQ0FBcEI7QUFFQSxpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLEtBQUssUUFBTCxDQUFjLEdBQWQsQ0FBa0IsZ0JBQWxCLEVBQW9DLDBCQUFwQyxFQUFnRTtBQUFBLHVCQUFNLE1BQUssR0FBTCxDQUFTLGNBQVQsQ0FBTjtBQUFBLGFBQWhFLENBQXBCO0FBQ0EsaUJBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQixLQUFLLFFBQUwsQ0FBYyxHQUFkLENBQWtCLGdCQUFsQixFQUFvQyxjQUFwQyxFQUFvRDtBQUFBLHVCQUFNLE1BQUssR0FBTCxDQUFTLGNBQVQsQ0FBTjtBQUFBLGFBQXBELENBQXBCO0FBRUEsOEJBQUssUUFBTCxFQUFlLG1CQUFPO0FBQ2xCLHNCQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsS0FBSyxRQUFMLENBQWMsR0FBZCxDQUFrQixnQkFBbEIsNkJBQTZELE9BQTdELEVBQXdFO0FBQUEsMkJBQU0sTUFBSyxVQUFMLENBQWdCLE1BQUssR0FBTCxhQUFtQixPQUFuQixDQUFoQixDQUFOO0FBQUEsaUJBQXhFLENBQXBCO0FBQ0gsYUFGRDtBQUdIOzs7bUNBRWtCLE8sRUFBcUI7QUFDcEMsbUJBQU8sUUFBUSxJQUFSLENBQWEsVUFBQyxRQUFELEVBQTJCO0FBQzNDLG9CQUFNLGNBQWMsU0FBUyxJQUFULENBQ2YsTUFEZSxDQUNSLFNBQVMsTUFERCxFQUVmLE1BRmUsQ0FFUixTQUFTLFNBRkQsRUFHZixNQUhlLENBR1IsU0FBUyxLQUhELENBQXBCO0FBS0EsdUJBQU8saUJBQVcsSUFBWCxDQUF3QixDQUFDLFlBQUQsRUFBZSxZQUFmLEVBQTZCLEtBQTdCLENBQXhCLEVBQ0YsU0FERSxDQUNRO0FBQUEsMkJBQVEsb0JBQU8sV0FBUCxFQUFvQjtBQUFBLCtCQUFXLHNCQUFTLE9BQVQsRUFBa0IsSUFBbEIsQ0FBWDtBQUFBLHFCQUFwQixDQUFSO0FBQUEsaUJBRFIsRUFFRixJQUZFLENBRUcsQ0FGSCxFQUdGLEdBSEUsQ0FHRTtBQUFBLDJCQUFRLEtBQUssSUFBTCxDQUFVLFNBQVMsR0FBbkIsRUFBd0IsSUFBeEIsQ0FBUjtBQUFBLGlCQUhGLEVBSUYsU0FKRSxFQUFQO0FBS0gsYUFYTSxFQVlGLElBWkUsQ0FZRztBQUFBLHVCQUFRLEtBQUssU0FBTCxDQUFlLElBQWYsQ0FBb0IsSUFBcEIsQ0FBUjtBQUFBLGFBWkgsQ0FBUDtBQWFIOzs7cUNBRWlCO0FBQ2QsbUJBQU8sS0FBSyxVQUFMLENBQWdCLEtBQUssR0FBTCxDQUFTLGdDQUFULENBQWhCLEVBQ0YsSUFERSxDQUNHO0FBQUEsdUJBQU0saUJBQVcsS0FBWCxDQUFpQixJQUFqQixFQUF1QixTQUF2QixFQUFOO0FBQUEsYUFESCxFQUVGLElBRkUsQ0FFRyxZQUFBO0FBQ0YscUJBQUssUUFBTCxDQUFjLFFBQWQsQ0FBdUIsS0FBSyxLQUFMLENBQVcsT0FBWCxDQUFtQixLQUFLLFNBQXhCLENBQXZCLEVBQTJELCtCQUEzRDtBQUNILGFBSkUsQ0FBUDtBQUtIOzs7NEJBRVcsTyxFQUFlO0FBQ3ZCLG1CQUFPLEtBQUssU0FBTCxDQUFlLEdBQWYsQ0FBbUIsT0FBbkIsRUFBNEIsU0FBNUIsRUFBdUMsRUFBRSx5QkFBeUIsSUFBM0IsRUFBdkMsQ0FBUDtBQUNIOzs7OEJBRVksUyxFQUFjO0FBQ3ZCLGlCQUFLLFNBQUwsR0FBaUIsU0FBakI7QUFDSDs7O2tDQUVhO0FBQ1YsaUJBQUssVUFBTCxDQUFnQixPQUFoQjtBQUNIOzs7Ozs7QUFPRSxJQUFNLDRDQUFrQixJQUFJLGVBQUosRUFBeEIiLCJmaWxlIjoibGliL2F0b20vZ2VuZXJhdG9yLWFzcG5ldC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE9ic2VydmFibGUgfSBmcm9tIFwicnhqc1wiO1xuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSB9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XG5pbXBvcnQgeyBlYWNoLCBlbmRzV2l0aCwgZmlsdGVyIH0gZnJvbSBcImxvZGFzaFwiO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tIFwicGF0aFwiO1xuY29uc3QgY29tbWFuZHMgPSBbXG4gICAgXCJBbmd1bGFyQ29udHJvbGxlclwiLFxuICAgIFwiQW5ndWxhckNvbnRyb2xsZXJBc1wiLFxuICAgIFwiQW5ndWxhckRpcmVjdGl2ZVwiLFxuICAgIFwiQW5ndWxhckZhY3RvcnlcIixcbiAgICBcIkFuZ3VsYXJNb2R1bGVcIixcbiAgICBcIkJvd2VySnNvblwiLFxuICAgIFwiQ2xhc3NcIixcbiAgICBcIkNvZmZlZVNjcmlwdFwiLFxuICAgIFwiQ29uZmlnXCIsXG4gICAgXCJnaXRpZ25vcmVcIixcbiAgICBcIkdydW50ZmlsZVwiLFxuICAgIFwiR3VscGZpbGVcIixcbiAgICBcIkhUTUxQYWdlXCIsXG4gICAgXCJJbnRlcmZhY2VcIixcbiAgICBcIkphdmFTY3JpcHRcIixcbiAgICBcIkpTY3JpcHRcIixcbiAgICBcIkpTT05cIixcbiAgICBcIkpTT05TY2hlbWFcIixcbiAgICBcIkpTWFwiLFxuICAgIFwiTWlkZGxld2FyZVwiLFxuICAgIFwiTXZjQ29udHJvbGxlclwiLFxuICAgIFwiTXZjVmlld1wiLFxuICAgIFwiUGFja2FnZUpzb25cIixcbiAgICBcIlN0YXJ0dXBDbGFzc1wiLFxuICAgIFwiU3R5bGVTaGVldFwiLFxuICAgIFwiU3R5bGVTaGVldExlc3NcIixcbiAgICBcIlN0eWxlU2hlZXRTQ1NTXCIsXG4gICAgXCJUYWdIZWxwZXJcIixcbiAgICBcIlRleHRGaWxlXCIsXG4gICAgXCJUeXBlU2NyaXB0XCIsXG4gICAgXCJUeXBlU2NyaXB0Q29uZmlnXCIsXG4gICAgXCJXZWJBcGlDb250cm9sbGVyXCJcbl07XG5jbGFzcyBHZW5lcmF0b3JBc3BuZXQge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLnJlcXVpcmVkID0gdHJ1ZTtcbiAgICAgICAgdGhpcy50aXRsZSA9IFwiQXNwbmV0IFllb21hbiBHZW5lcmF0b3JcIjtcbiAgICAgICAgdGhpcy5kZXNjcmlwdGlvbiA9IFwiRW5hYmxlcyB0aGUgYXNwbmV0IHllb21hbiBnZW5lcmF0b3IuXCI7XG4gICAgfVxuICAgIGFjdGl2YXRlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTpuZXctcHJvamVjdFwiLCAoKSA9PiB0aGlzLm5ld1Byb2plY3QoKSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJjIzpuZXctcHJvamVjdFwiLCAoKSA9PiB0aGlzLm5ld1Byb2plY3QoKSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTpuZXctY2xhc3NcIiwgKCkgPT4gdGhpcy5ydW4oXCJhc3BuZXQ6Q2xhc3NcIikpKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwiQyM6bmV3LWNsYXNzXCIsICgpID0+IHRoaXMucnVuKFwiYXNwbmV0OkNsYXNzXCIpKSk7XG4gICAgICAgIGVhY2goY29tbWFuZHMsIGNvbW1hbmQgPT4ge1xuICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIGBvbW5pc2hhcnAtYXRvbTphc3BuZXQtJHtjb21tYW5kfWAsICgpID0+IHRoaXMubG9hZENzRmlsZSh0aGlzLnJ1bihgYXNwbmV0OiR7Y29tbWFuZH1gKSkpKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGxvYWRDc0ZpbGUocHJvbWlzZSkge1xuICAgICAgICByZXR1cm4gcHJvbWlzZS50aGVuKChtZXNzYWdlcykgPT4ge1xuICAgICAgICAgICAgY29uc3QgYWxsTWVzc2FnZXMgPSBtZXNzYWdlcy5za2lwXG4gICAgICAgICAgICAgICAgLmNvbmNhdChtZXNzYWdlcy5jcmVhdGUpXG4gICAgICAgICAgICAgICAgLmNvbmNhdChtZXNzYWdlcy5pZGVudGljYWwpXG4gICAgICAgICAgICAgICAgLmNvbmNhdChtZXNzYWdlcy5mb3JjZSk7XG4gICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5mcm9tKFtcIlN0YXJ0dXAuY3NcIiwgXCJQcm9ncmFtLmNzXCIsIFwiLmNzXCJdKVxuICAgICAgICAgICAgICAgIC5jb25jYXRNYXAoZmlsZSA9PiBmaWx0ZXIoYWxsTWVzc2FnZXMsIG1lc3NhZ2UgPT4gZW5kc1dpdGgobWVzc2FnZSwgZmlsZSkpKVxuICAgICAgICAgICAgICAgIC50YWtlKDEpXG4gICAgICAgICAgICAgICAgLm1hcChmaWxlID0+IHBhdGguam9pbihtZXNzYWdlcy5jd2QsIGZpbGUpKVxuICAgICAgICAgICAgICAgIC50b1Byb21pc2UoKTtcbiAgICAgICAgfSlcbiAgICAgICAgICAgIC50aGVuKGZpbGUgPT4gYXRvbS53b3Jrc3BhY2Uub3BlbihmaWxlKSk7XG4gICAgfVxuICAgIG5ld1Byb2plY3QoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxvYWRDc0ZpbGUodGhpcy5ydW4oXCJhc3BuZXQ6YXBwIC0tY3JlYXRlSW5EaXJlY3RvcnlcIikpXG4gICAgICAgICAgICAudGhlbigoKSA9PiBPYnNlcnZhYmxlLnRpbWVyKDIwMDApLnRvUHJvbWlzZSgpKVxuICAgICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgYXRvbS5jb21tYW5kcy5kaXNwYXRjaChhdG9tLnZpZXdzLmdldFZpZXcoYXRvbS53b3Jrc3BhY2UpLCBcIm9tbmlzaGFycC1hdG9tOnJlc3RhcnQtc2VydmVyXCIpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgcnVuKGNvbW1hbmQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2VuZXJhdG9yLnJ1bihjb21tYW5kLCB1bmRlZmluZWQsIHsgcHJvbXB0T25aZXJvRGlyZWN0b3JpZXM6IHRydWUgfSk7XG4gICAgfVxuICAgIHNldHVwKGdlbmVyYXRvcikge1xuICAgICAgICB0aGlzLmdlbmVyYXRvciA9IGdlbmVyYXRvcjtcbiAgICB9XG4gICAgZGlzcG9zZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICB9XG59XG5leHBvcnQgY29uc3QgZ2VuZXJhdG9yQXNwbmV0ID0gbmV3IEdlbmVyYXRvckFzcG5ldDtcbiIsImltcG9ydCB7T2JzZXJ2YWJsZX0gZnJvbSBcInJ4anNcIjtcclxuaW1wb3J0IHtDb21wb3NpdGVEaXNwb3NhYmxlfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xyXG5pbXBvcnQge2VhY2gsIGVuZHNXaXRoLCBmaWx0ZXJ9IGZyb20gXCJsb2Rhc2hcIjtcclxuaW1wb3J0ICogYXMgcGF0aCBmcm9tIFwicGF0aFwiO1xyXG5cclxuLy8gVE9ETzogTWFrZSBzdXJlIGl0IHN0YXlzIGluIHN5bmMgd2l0aFxyXG5jb25zdCBjb21tYW5kcyA9IFtcclxuICAgIFwiQW5ndWxhckNvbnRyb2xsZXJcIixcclxuICAgIFwiQW5ndWxhckNvbnRyb2xsZXJBc1wiLFxyXG4gICAgXCJBbmd1bGFyRGlyZWN0aXZlXCIsXHJcbiAgICBcIkFuZ3VsYXJGYWN0b3J5XCIsXHJcbiAgICBcIkFuZ3VsYXJNb2R1bGVcIixcclxuICAgIFwiQm93ZXJKc29uXCIsXHJcbiAgICBcIkNsYXNzXCIsXHJcbiAgICBcIkNvZmZlZVNjcmlwdFwiLFxyXG4gICAgXCJDb25maWdcIixcclxuICAgIFwiZ2l0aWdub3JlXCIsXHJcbiAgICBcIkdydW50ZmlsZVwiLFxyXG4gICAgXCJHdWxwZmlsZVwiLFxyXG4gICAgXCJIVE1MUGFnZVwiLFxyXG4gICAgXCJJbnRlcmZhY2VcIixcclxuICAgIFwiSmF2YVNjcmlwdFwiLFxyXG4gICAgXCJKU2NyaXB0XCIsXHJcbiAgICBcIkpTT05cIixcclxuICAgIFwiSlNPTlNjaGVtYVwiLFxyXG4gICAgXCJKU1hcIixcclxuICAgIFwiTWlkZGxld2FyZVwiLFxyXG4gICAgXCJNdmNDb250cm9sbGVyXCIsXHJcbiAgICBcIk12Y1ZpZXdcIixcclxuICAgIFwiUGFja2FnZUpzb25cIixcclxuICAgIFwiU3RhcnR1cENsYXNzXCIsXHJcbiAgICBcIlN0eWxlU2hlZXRcIixcclxuICAgIFwiU3R5bGVTaGVldExlc3NcIixcclxuICAgIFwiU3R5bGVTaGVldFNDU1NcIixcclxuICAgIFwiVGFnSGVscGVyXCIsXHJcbiAgICBcIlRleHRGaWxlXCIsXHJcbiAgICBcIlR5cGVTY3JpcHRcIixcclxuICAgIFwiVHlwZVNjcmlwdENvbmZpZ1wiLFxyXG4gICAgXCJXZWJBcGlDb250cm9sbGVyXCJcclxuXTtcclxuXHJcbm1vZHVsZSBZZW9tYW4ge1xyXG4gICAgZXhwb3J0IGludGVyZmFjZSBJTWVzc2FnZXMge1xyXG4gICAgICAgIGN3ZD86IHN0cmluZztcclxuICAgICAgICBza2lwOiBzdHJpbmdbXTtcclxuICAgICAgICBmb3JjZTogc3RyaW5nW107XHJcbiAgICAgICAgY3JlYXRlOiBzdHJpbmdbXTtcclxuICAgICAgICBpbnZva2U6IHN0cmluZ1tdO1xyXG4gICAgICAgIGNvbmZsaWN0OiBzdHJpbmdbXTtcclxuICAgICAgICBpZGVudGljYWw6IHN0cmluZ1tdO1xyXG4gICAgICAgIGluZm86IHN0cmluZ1tdO1xyXG4gICAgfVxyXG59XHJcblxyXG5jbGFzcyBHZW5lcmF0b3JBc3BuZXQgaW1wbGVtZW50cyBJRmVhdHVyZSB7XHJcbiAgICBwcml2YXRlIGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XHJcbiAgICBwcml2YXRlIGdlbmVyYXRvcjoge1xyXG4gICAgICAgIHJ1bihnZW5lcmF0b3I6IHN0cmluZywgcGF0aD86IHN0cmluZywgb3B0aW9ucz86IGFueSk6IFByb21pc2U8YW55Pjsgc3RhcnQocHJlZml4OiBzdHJpbmcsIHBhdGg/OiBzdHJpbmcsIG9wdGlvbnM/OiBhbnkpOiBQcm9taXNlPGFueT47XHJcbiAgICAgICAgbGlzdChwcmVmaXg/OiBzdHJpbmcsIHBhdGg/OiBzdHJpbmcsIG9wdGlvbnM/OiBhbnkpOiBQcm9taXNlPHsgZGlzcGxheU5hbWU6IHN0cmluZzsgbmFtZTogc3RyaW5nOyByZXNvbHZlZDogc3RyaW5nOyB9W10+XHJcbiAgICB9O1xyXG5cclxuICAgIHB1YmxpYyBhY3RpdmF0ZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTpuZXctcHJvamVjdFwiLCAoKSA9PiB0aGlzLm5ld1Byb2plY3QoKSkpO1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcImMjOm5ldy1wcm9qZWN0XCIsICgpID0+IHRoaXMubmV3UHJvamVjdCgpKSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcIm9tbmlzaGFycC1hdG9tOm5ldy1jbGFzc1wiLCAoKSA9PiB0aGlzLnJ1bihcImFzcG5ldDpDbGFzc1wiKSkpO1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcIkMjOm5ldy1jbGFzc1wiLCAoKSA9PiB0aGlzLnJ1bihcImFzcG5ldDpDbGFzc1wiKSkpO1xyXG5cclxuICAgICAgICBlYWNoKGNvbW1hbmRzLCBjb21tYW5kID0+IHtcclxuICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIGBvbW5pc2hhcnAtYXRvbTphc3BuZXQtJHtjb21tYW5kfWAsICgpID0+IHRoaXMubG9hZENzRmlsZSh0aGlzLnJ1bihgYXNwbmV0OiR7Y29tbWFuZH1gKSkpKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGxvYWRDc0ZpbGUocHJvbWlzZTogUHJvbWlzZTxhbnk+KSB7XHJcbiAgICAgICAgcmV0dXJuIHByb21pc2UudGhlbigobWVzc2FnZXM6IFllb21hbi5JTWVzc2FnZXMpID0+IHtcclxuICAgICAgICAgICAgY29uc3QgYWxsTWVzc2FnZXMgPSBtZXNzYWdlcy5za2lwXHJcbiAgICAgICAgICAgICAgICAuY29uY2F0KG1lc3NhZ2VzLmNyZWF0ZSlcclxuICAgICAgICAgICAgICAgIC5jb25jYXQobWVzc2FnZXMuaWRlbnRpY2FsKVxyXG4gICAgICAgICAgICAgICAgLmNvbmNhdChtZXNzYWdlcy5mb3JjZSk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5mcm9tPHN0cmluZz4oW1wiU3RhcnR1cC5jc1wiLCBcIlByb2dyYW0uY3NcIiwgXCIuY3NcIl0pXHJcbiAgICAgICAgICAgICAgICAuY29uY2F0TWFwKGZpbGUgPT4gZmlsdGVyKGFsbE1lc3NhZ2VzLCBtZXNzYWdlID0+IGVuZHNXaXRoKG1lc3NhZ2UsIGZpbGUpKSlcclxuICAgICAgICAgICAgICAgIC50YWtlKDEpXHJcbiAgICAgICAgICAgICAgICAubWFwKGZpbGUgPT4gcGF0aC5qb2luKG1lc3NhZ2VzLmN3ZCwgZmlsZSkpXHJcbiAgICAgICAgICAgICAgICAudG9Qcm9taXNlKCk7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAgICAgLnRoZW4oZmlsZSA9PiBhdG9tLndvcmtzcGFjZS5vcGVuKGZpbGUpKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIG5ld1Byb2plY3QoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubG9hZENzRmlsZSh0aGlzLnJ1bihcImFzcG5ldDphcHAgLS1jcmVhdGVJbkRpcmVjdG9yeVwiKSlcclxuICAgICAgICAgICAgLnRoZW4oKCkgPT4gT2JzZXJ2YWJsZS50aW1lcigyMDAwKS50b1Byb21pc2UoKSlcclxuICAgICAgICAgICAgLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgYXRvbS5jb21tYW5kcy5kaXNwYXRjaChhdG9tLnZpZXdzLmdldFZpZXcoYXRvbS53b3Jrc3BhY2UpLCBcIm9tbmlzaGFycC1hdG9tOnJlc3RhcnQtc2VydmVyXCIpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHJ1bihjb21tYW5kOiBzdHJpbmcpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5nZW5lcmF0b3IucnVuKGNvbW1hbmQsIHVuZGVmaW5lZCwgeyBwcm9tcHRPblplcm9EaXJlY3RvcmllczogdHJ1ZSB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2V0dXAoZ2VuZXJhdG9yOiBhbnkpIHtcclxuICAgICAgICB0aGlzLmdlbmVyYXRvciA9IGdlbmVyYXRvcjtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGlzcG9zZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZXF1aXJlZCA9IHRydWU7XHJcbiAgICBwdWJsaWMgdGl0bGUgPSBcIkFzcG5ldCBZZW9tYW4gR2VuZXJhdG9yXCI7XHJcbiAgICBwdWJsaWMgZGVzY3JpcHRpb24gPSBcIkVuYWJsZXMgdGhlIGFzcG5ldCB5ZW9tYW4gZ2VuZXJhdG9yLlwiO1xyXG59XHJcblxyXG5leHBvcnQgY29uc3QgZ2VuZXJhdG9yQXNwbmV0ID0gbmV3IEdlbmVyYXRvckFzcG5ldDtcclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
