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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9hdG9tL2dlbmVyYXRvci1hc3BuZXQuanMiLCJsaWIvYXRvbS9nZW5lcmF0b3ItYXNwbmV0LnRzIl0sIm5hbWVzIjpbInBhdGgiLCJjb21tYW5kcyIsIkdlbmVyYXRvckFzcG5ldCIsInJlcXVpcmVkIiwidGl0bGUiLCJkZXNjcmlwdGlvbiIsImRpc3Bvc2FibGUiLCJhZGQiLCJhdG9tIiwibmV3UHJvamVjdCIsInJ1biIsImNvbW1hbmQiLCJsb2FkQ3NGaWxlIiwicHJvbWlzZSIsInRoZW4iLCJtZXNzYWdlcyIsImFsbE1lc3NhZ2VzIiwic2tpcCIsImNvbmNhdCIsImNyZWF0ZSIsImlkZW50aWNhbCIsImZvcmNlIiwiZnJvbSIsImNvbmNhdE1hcCIsIm1lc3NhZ2UiLCJmaWxlIiwidGFrZSIsIm1hcCIsImpvaW4iLCJjd2QiLCJ0b1Byb21pc2UiLCJ3b3Jrc3BhY2UiLCJvcGVuIiwidGltZXIiLCJkaXNwYXRjaCIsInZpZXdzIiwiZ2V0VmlldyIsImdlbmVyYXRvciIsInVuZGVmaW5lZCIsInByb21wdE9uWmVyb0RpcmVjdG9yaWVzIiwiZGlzcG9zZSIsImdlbmVyYXRvckFzcG5ldCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0lDQVlBLEk7Ozs7OztBQUdaLElBQU1DLFdBQVcsQ0FDYixtQkFEYSxFQUViLHFCQUZhLEVBR2Isa0JBSGEsRUFJYixnQkFKYSxFQUtiLGVBTGEsRUFNYixXQU5hLEVBT2IsT0FQYSxFQVFiLGNBUmEsRUFTYixRQVRhLEVBVWIsV0FWYSxFQVdiLFdBWGEsRUFZYixVQVphLEVBYWIsVUFiYSxFQWNiLFdBZGEsRUFlYixZQWZhLEVBZ0JiLFNBaEJhLEVBaUJiLE1BakJhLEVBa0JiLFlBbEJhLEVBbUJiLEtBbkJhLEVBb0JiLFlBcEJhLEVBcUJiLGVBckJhLEVBc0JiLFNBdEJhLEVBdUJiLGFBdkJhLEVBd0JiLGNBeEJhLEVBeUJiLFlBekJhLEVBMEJiLGdCQTFCYSxFQTJCYixnQkEz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QixLQUFLMkIsS0FBTCxDQUFXQyxPQUFYLENBQW1CNUIsS0FBS3VCLFNBQXhCLENBQXZCLEVBQTJELCtCQUEzRDtBQUNILGFBSkUsQ0FBUDtBQUtIOzs7NEJBRVdwQixPLEVBQWU7QUFDdkIsbUJBQU8sS0FBSzBCLFNBQUwsQ0FBZTNCLEdBQWYsQ0FBbUJDLE9BQW5CLEVBQTRCMkIsU0FBNUIsRUFBdUMsRUFBRUMseUJBQXlCLElBQTNCLEVBQXZDLENBQVA7QUFDSDs7OzhCQUVZRixTLEVBQWM7QUFDdkIsaUJBQUtBLFNBQUwsR0FBaUJBLFNBQWpCO0FBQ0g7OztrQ0FFYTtBQUNWLGlCQUFLL0IsVUFBTCxDQUFnQmtDLE9BQWhCO0FBQ0g7Ozs7OztBQU9FLElBQU1DLDRDQUFrQixJQUFJdkMsZUFBSixFQUF4QiIsImZpbGUiOiJsaWIvYXRvbS9nZW5lcmF0b3ItYXNwbmV0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgT2JzZXJ2YWJsZSB9IGZyb20gXCJyeGpzXCI7XG5pbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlIH0gZnJvbSBcInRzLWRpc3Bvc2FibGVzXCI7XG5pbXBvcnQgeyBlYWNoLCBlbmRzV2l0aCwgZmlsdGVyIH0gZnJvbSBcImxvZGFzaFwiO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tIFwicGF0aFwiO1xuY29uc3QgY29tbWFuZHMgPSBbXG4gICAgXCJBbmd1bGFyQ29udHJvbGxlclwiLFxuICAgIFwiQW5ndWxhckNvbnRyb2xsZXJBc1wiLFxuICAgIFwiQW5ndWxhckRpcmVjdGl2ZVwiLFxuICAgIFwiQW5ndWxhckZhY3RvcnlcIixcbiAgICBcIkFuZ3VsYXJNb2R1bGVcIixcbiAgICBcIkJvd2VySnNvblwiLFxuICAgIFwiQ2xhc3NcIixcbiAgICBcIkNvZmZlZVNjcmlwdFwiLFxuICAgIFwiQ29uZmlnXCIsXG4gICAgXCJnaXRpZ25vcmVcIixcbiAgICBcIkdydW50ZmlsZVwiLFxuICAgIFwiR3VscGZpbGVcIixcbiAgICBcIkhUTUxQYWdlXCIsXG4gICAgXCJJbnRlcmZhY2VcIixcbiAgICBcIkphdmFTY3JpcHRcIixcbiAgICBcIkpTY3JpcHRcIixcbiAgICBcIkpTT05cIixcbiAgICBcIkpTT05TY2hlbWFcIixcbiAgICBcIkpTWFwiLFxuICAgIFwiTWlkZGxld2FyZVwiLFxuICAgIFwiTXZjQ29udHJvbGxlclwiLFxuICAgIFwiTXZjVmlld1wiLFxuICAgIFwiUGFja2FnZUpzb25cIixcbiAgICBcIlN0YXJ0dXBDbGFzc1wiLFxuICAgIFwiU3R5bGVTaGVldFwiLFxuICAgIFwiU3R5bGVTaGVldExlc3NcIixcbiAgICBcIlN0eWxlU2hlZXRTQ1NTXCIsXG4gICAgXCJUYWdIZWxwZXJcIixcbiAgICBcIlRleHRGaWxlXCIsXG4gICAgXCJUeXBlU2NyaXB0XCIsXG4gICAgXCJUeXBlU2NyaXB0Q29uZmlnXCIsXG4gICAgXCJXZWJBcGlDb250cm9sbGVyXCJcbl07XG5jbGFzcyBHZW5lcmF0b3JBc3BuZXQge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLnJlcXVpcmVkID0gdHJ1ZTtcbiAgICAgICAgdGhpcy50aXRsZSA9IFwiQXNwbmV0IFllb21hbiBHZW5lcmF0b3JcIjtcbiAgICAgICAgdGhpcy5kZXNjcmlwdGlvbiA9IFwiRW5hYmxlcyB0aGUgYXNwbmV0IHllb21hbiBnZW5lcmF0b3IuXCI7XG4gICAgfVxuICAgIGFjdGl2YXRlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTpuZXctcHJvamVjdFwiLCAoKSA9PiB0aGlzLm5ld1Byb2plY3QoKSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJjIzpuZXctcHJvamVjdFwiLCAoKSA9PiB0aGlzLm5ld1Byb2plY3QoKSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTpuZXctY2xhc3NcIiwgKCkgPT4gdGhpcy5ydW4oXCJhc3BuZXQ6Q2xhc3NcIikpKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwiQyM6bmV3LWNsYXNzXCIsICgpID0+IHRoaXMucnVuKFwiYXNwbmV0OkNsYXNzXCIpKSk7XG4gICAgICAgIGVhY2goY29tbWFuZHMsIGNvbW1hbmQgPT4ge1xuICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIGBvbW5pc2hhcnAtYXRvbTphc3BuZXQtJHtjb21tYW5kfWAsICgpID0+IHRoaXMubG9hZENzRmlsZSh0aGlzLnJ1bihgYXNwbmV0OiR7Y29tbWFuZH1gKSkpKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGxvYWRDc0ZpbGUocHJvbWlzZSkge1xuICAgICAgICByZXR1cm4gcHJvbWlzZS50aGVuKChtZXNzYWdlcykgPT4ge1xuICAgICAgICAgICAgY29uc3QgYWxsTWVzc2FnZXMgPSBtZXNzYWdlcy5za2lwXG4gICAgICAgICAgICAgICAgLmNvbmNhdChtZXNzYWdlcy5jcmVhdGUpXG4gICAgICAgICAgICAgICAgLmNvbmNhdChtZXNzYWdlcy5pZGVudGljYWwpXG4gICAgICAgICAgICAgICAgLmNvbmNhdChtZXNzYWdlcy5mb3JjZSk7XG4gICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5mcm9tKFtcIlN0YXJ0dXAuY3NcIiwgXCJQcm9ncmFtLmNzXCIsIFwiLmNzXCJdKVxuICAgICAgICAgICAgICAgIC5jb25jYXRNYXAoZmlsZSA9PiBmaWx0ZXIoYWxsTWVzc2FnZXMsIG1lc3NhZ2UgPT4gZW5kc1dpdGgobWVzc2FnZSwgZmlsZSkpKVxuICAgICAgICAgICAgICAgIC50YWtlKDEpXG4gICAgICAgICAgICAgICAgLm1hcChmaWxlID0+IHBhdGguam9pbihtZXNzYWdlcy5jd2QsIGZpbGUpKVxuICAgICAgICAgICAgICAgIC50b1Byb21pc2UoKTtcbiAgICAgICAgfSlcbiAgICAgICAgICAgIC50aGVuKGZpbGUgPT4gYXRvbS53b3Jrc3BhY2Uub3BlbihmaWxlKSk7XG4gICAgfVxuICAgIG5ld1Byb2plY3QoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxvYWRDc0ZpbGUodGhpcy5ydW4oXCJhc3BuZXQ6YXBwIC0tY3JlYXRlSW5EaXJlY3RvcnlcIikpXG4gICAgICAgICAgICAudGhlbigoKSA9PiBPYnNlcnZhYmxlLnRpbWVyKDIwMDApLnRvUHJvbWlzZSgpKVxuICAgICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgYXRvbS5jb21tYW5kcy5kaXNwYXRjaChhdG9tLnZpZXdzLmdldFZpZXcoYXRvbS53b3Jrc3BhY2UpLCBcIm9tbmlzaGFycC1hdG9tOnJlc3RhcnQtc2VydmVyXCIpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgcnVuKGNvbW1hbmQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2VuZXJhdG9yLnJ1bihjb21tYW5kLCB1bmRlZmluZWQsIHsgcHJvbXB0T25aZXJvRGlyZWN0b3JpZXM6IHRydWUgfSk7XG4gICAgfVxuICAgIHNldHVwKGdlbmVyYXRvcikge1xuICAgICAgICB0aGlzLmdlbmVyYXRvciA9IGdlbmVyYXRvcjtcbiAgICB9XG4gICAgZGlzcG9zZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICB9XG59XG5leHBvcnQgY29uc3QgZ2VuZXJhdG9yQXNwbmV0ID0gbmV3IEdlbmVyYXRvckFzcG5ldDtcbiIsImltcG9ydCB7T2JzZXJ2YWJsZX0gZnJvbSBcInJ4anNcIjtcclxuaW1wb3J0IHtDb21wb3NpdGVEaXNwb3NhYmxlfSBmcm9tIFwidHMtZGlzcG9zYWJsZXNcIjtcclxuaW1wb3J0IHtlYWNoLCBlbmRzV2l0aCwgZmlsdGVyfSBmcm9tIFwibG9kYXNoXCI7XHJcbmltcG9ydCAqIGFzIHBhdGggZnJvbSBcInBhdGhcIjtcclxuXHJcbi8vIFRPRE86IE1ha2Ugc3VyZSBpdCBzdGF5cyBpbiBzeW5jIHdpdGhcclxuY29uc3QgY29tbWFuZHMgPSBbXHJcbiAgICBcIkFuZ3VsYXJDb250cm9sbGVyXCIsXHJcbiAgICBcIkFuZ3VsYXJDb250cm9sbGVyQXNcIixcclxuICAgIFwiQW5ndWxhckRpcmVjdGl2ZVwiLFxyXG4gICAgXCJBbmd1bGFyRmFjdG9yeVwiLFxyXG4gICAgXCJBbmd1bGFyTW9kdWxlXCIsXHJcbiAgICBcIkJvd2VySnNvblwiLFxyXG4gICAgXCJDbGFzc1wiLFxyXG4gICAgXCJDb2ZmZWVTY3JpcHRcIixcclxuICAgIFwiQ29uZmlnXCIsXHJcbiAgICBcImdpdGlnbm9yZVwiLFxyXG4gICAgXCJHcnVudGZpbGVcIixcclxuICAgIFwiR3VscGZpbGVcIixcclxuICAgIFwiSFRNTFBhZ2VcIixcclxuICAgIFwiSW50ZXJmYWNlXCIsXHJcbiAgICBcIkphdmFTY3JpcHRcIixcclxuICAgIFwiSlNjcmlwdFwiLFxyXG4gICAgXCJKU09OXCIsXHJcbiAgICBcIkpTT05TY2hlbWFcIixcclxuICAgIFwiSlNYXCIsXHJcbiAgICBcIk1pZGRsZXdhcmVcIixcclxuICAgIFwiTXZjQ29udHJvbGxlclwiLFxyXG4gICAgXCJNdmNWaWV3XCIsXHJcbiAgICBcIlBhY2thZ2VKc29uXCIsXHJcbiAgICBcIlN0YXJ0dXBDbGFzc1wiLFxyXG4gICAgXCJTdHlsZVNoZWV0XCIsXHJcbiAgICBcIlN0eWxlU2hlZXRMZXNzXCIsXHJcbiAgICBcIlN0eWxlU2hlZXRTQ1NTXCIsXHJcbiAgICBcIlRhZ0hlbHBlclwiLFxyXG4gICAgXCJUZXh0RmlsZVwiLFxyXG4gICAgXCJUeXBlU2NyaXB0XCIsXHJcbiAgICBcIlR5cGVTY3JpcHRDb25maWdcIixcclxuICAgIFwiV2ViQXBpQ29udHJvbGxlclwiXHJcbl07XHJcblxyXG5tb2R1bGUgWWVvbWFuIHtcclxuICAgIGV4cG9ydCBpbnRlcmZhY2UgSU1lc3NhZ2VzIHtcclxuICAgICAgICBjd2Q/OiBzdHJpbmc7XHJcbiAgICAgICAgc2tpcDogc3RyaW5nW107XHJcbiAgICAgICAgZm9yY2U6IHN0cmluZ1tdO1xyXG4gICAgICAgIGNyZWF0ZTogc3RyaW5nW107XHJcbiAgICAgICAgaW52b2tlOiBzdHJpbmdbXTtcclxuICAgICAgICBjb25mbGljdDogc3RyaW5nW107XHJcbiAgICAgICAgaWRlbnRpY2FsOiBzdHJpbmdbXTtcclxuICAgICAgICBpbmZvOiBzdHJpbmdbXTtcclxuICAgIH1cclxufVxyXG5cclxuY2xhc3MgR2VuZXJhdG9yQXNwbmV0IGltcGxlbWVudHMgSUZlYXR1cmUge1xyXG4gICAgcHJpdmF0ZSBkaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xyXG4gICAgcHJpdmF0ZSBnZW5lcmF0b3I6IHtcclxuICAgICAgICBydW4oZ2VuZXJhdG9yOiBzdHJpbmcsIHBhdGg/OiBzdHJpbmcsIG9wdGlvbnM/OiBhbnkpOiBQcm9taXNlPGFueT47IHN0YXJ0KHByZWZpeDogc3RyaW5nLCBwYXRoPzogc3RyaW5nLCBvcHRpb25zPzogYW55KTogUHJvbWlzZTxhbnk+O1xyXG4gICAgICAgIGxpc3QocHJlZml4Pzogc3RyaW5nLCBwYXRoPzogc3RyaW5nLCBvcHRpb25zPzogYW55KTogUHJvbWlzZTx7IGRpc3BsYXlOYW1lOiBzdHJpbmc7IG5hbWU6IHN0cmluZzsgcmVzb2x2ZWQ6IHN0cmluZzsgfVtdPlxyXG4gICAgfTtcclxuXHJcbiAgICBwdWJsaWMgYWN0aXZhdGUoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwib21uaXNoYXJwLWF0b206bmV3LXByb2plY3RcIiwgKCkgPT4gdGhpcy5uZXdQcm9qZWN0KCkpKTtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJjIzpuZXctcHJvamVjdFwiLCAoKSA9PiB0aGlzLm5ld1Byb2plY3QoKSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTpuZXctY2xhc3NcIiwgKCkgPT4gdGhpcy5ydW4oXCJhc3BuZXQ6Q2xhc3NcIikpKTtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJDIzpuZXctY2xhc3NcIiwgKCkgPT4gdGhpcy5ydW4oXCJhc3BuZXQ6Q2xhc3NcIikpKTtcclxuXHJcbiAgICAgICAgZWFjaChjb21tYW5kcywgY29tbWFuZCA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBgb21uaXNoYXJwLWF0b206YXNwbmV0LSR7Y29tbWFuZH1gLCAoKSA9PiB0aGlzLmxvYWRDc0ZpbGUodGhpcy5ydW4oYGFzcG5ldDoke2NvbW1hbmR9YCkpKSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBsb2FkQ3NGaWxlKHByb21pc2U6IFByb21pc2U8YW55Pikge1xyXG4gICAgICAgIHJldHVybiBwcm9taXNlLnRoZW4oKG1lc3NhZ2VzOiBZZW9tYW4uSU1lc3NhZ2VzKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IGFsbE1lc3NhZ2VzID0gbWVzc2FnZXMuc2tpcFxyXG4gICAgICAgICAgICAgICAgLmNvbmNhdChtZXNzYWdlcy5jcmVhdGUpXHJcbiAgICAgICAgICAgICAgICAuY29uY2F0KG1lc3NhZ2VzLmlkZW50aWNhbClcclxuICAgICAgICAgICAgICAgIC5jb25jYXQobWVzc2FnZXMuZm9yY2UpO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuZnJvbTxzdHJpbmc+KFtcIlN0YXJ0dXAuY3NcIiwgXCJQcm9ncmFtLmNzXCIsIFwiLmNzXCJdKVxyXG4gICAgICAgICAgICAgICAgLmNvbmNhdE1hcChmaWxlID0+IGZpbHRlcihhbGxNZXNzYWdlcywgbWVzc2FnZSA9PiBlbmRzV2l0aChtZXNzYWdlLCBmaWxlKSkpXHJcbiAgICAgICAgICAgICAgICAudGFrZSgxKVxyXG4gICAgICAgICAgICAgICAgLm1hcChmaWxlID0+IHBhdGguam9pbihtZXNzYWdlcy5jd2QsIGZpbGUpKVxyXG4gICAgICAgICAgICAgICAgLnRvUHJvbWlzZSgpO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgICAgIC50aGVuKGZpbGUgPT4gYXRvbS53b3Jrc3BhY2Uub3BlbihmaWxlKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBuZXdQcm9qZWN0KCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmxvYWRDc0ZpbGUodGhpcy5ydW4oXCJhc3BuZXQ6YXBwIC0tY3JlYXRlSW5EaXJlY3RvcnlcIikpXHJcbiAgICAgICAgICAgIC50aGVuKCgpID0+IE9ic2VydmFibGUudGltZXIoMjAwMCkudG9Qcm9taXNlKCkpXHJcbiAgICAgICAgICAgIC50aGVuKCgpID0+IHtcclxuICAgICAgICAgICAgICAgIGF0b20uY29tbWFuZHMuZGlzcGF0Y2goYXRvbS52aWV3cy5nZXRWaWV3KGF0b20ud29ya3NwYWNlKSwgXCJvbW5pc2hhcnAtYXRvbTpyZXN0YXJ0LXNlcnZlclwiKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBydW4oY29tbWFuZDogc3RyaW5nKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2VuZXJhdG9yLnJ1bihjb21tYW5kLCB1bmRlZmluZWQsIHsgcHJvbXB0T25aZXJvRGlyZWN0b3JpZXM6IHRydWUgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHNldHVwKGdlbmVyYXRvcjogYW55KSB7XHJcbiAgICAgICAgdGhpcy5nZW5lcmF0b3IgPSBnZW5lcmF0b3I7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVxdWlyZWQgPSB0cnVlO1xyXG4gICAgcHVibGljIHRpdGxlID0gXCJBc3BuZXQgWWVvbWFuIEdlbmVyYXRvclwiO1xyXG4gICAgcHVibGljIGRlc2NyaXB0aW9uID0gXCJFbmFibGVzIHRoZSBhc3BuZXQgeWVvbWFuIGdlbmVyYXRvci5cIjtcclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IGdlbmVyYXRvckFzcG5ldCA9IG5ldyBHZW5lcmF0b3JBc3BuZXQ7XHJcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
