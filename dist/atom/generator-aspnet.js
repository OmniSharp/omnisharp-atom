'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.generatorAspnet = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _path = require('path');

var path = _interopRequireWildcard(_path);

var _rxjs = require('rxjs');

var _tsDisposables = require('ts-disposables');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var commands = ['AngularController', 'AngularControllerAs', 'AngularDirective', 'AngularFactory', 'AngularModule', 'BowerJson', 'Class', 'CoffeeScript', 'Config', 'gitignore', 'Gruntfile', 'Gulpfile', 'HTMLPage', 'Interface', 'JavaScript', 'JScript', 'JSON', 'JSONSchema', 'JSX', 'Middleware', 'MvcController', 'MvcView', 'PackageJson', 'StartupClass', 'StyleSheet', 'StyleSheetLess', 'StyleSheetSCSS', 'TagHelper', 'TextFile', 'TypeScript', 'TypeScriptConfig', 'WebApiController'];

var GeneratorAspnet = function () {
    function GeneratorAspnet() {
        _classCallCheck(this, GeneratorAspnet);

        this.required = true;
        this.title = 'Aspnet Yeoman Generator';
        this.description = 'Enables the aspnet yeoman generator.';
    }

    _createClass(GeneratorAspnet, [{
        key: 'activate',
        value: function activate() {
            var _this = this;

            this.disposable = new _tsDisposables.CompositeDisposable();
            this.disposable.add(atom.commands.add('atom-workspace', 'omnisharp-atom:new-project', function () {
                return _this.newProject();
            }));
            this.disposable.add(atom.commands.add('atom-workspace', 'c#:new-project', function () {
                return _this.newProject();
            }));
            this.disposable.add(atom.commands.add('atom-workspace', 'omnisharp-atom:new-class', function () {
                return _this.run('aspnet:Class');
            }));
            this.disposable.add(atom.commands.add('atom-workspace', 'C#:new-class', function () {
                return _this.run('aspnet:Class');
            }));
            (0, _lodash.each)(commands, function (command) {
                _this.disposable.add(atom.commands.add('atom-workspace', 'omnisharp-atom:aspnet-' + command, function () {
                    return _this.loadCsFile(_this.run('aspnet:' + command));
                }));
            });
        }
    }, {
        key: 'loadCsFile',
        value: function loadCsFile(promise) {
            return promise.then(function (messages) {
                var allMessages = messages.skip.concat(messages.create).concat(messages.identical).concat(messages.force);
                return _rxjs.Observable.from(['Startup.cs', 'Program.cs', '.cs']).concatMap(function (file) {
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
        key: 'newProject',
        value: function newProject() {
            return this.loadCsFile(this.run('aspnet:app --createInDirectory')).then(function () {
                return _rxjs.Observable.timer(2000).toPromise();
            }).then(function () {
                atom.commands.dispatch(atom.views.getView(atom.workspace), 'omnisharp-atom:restart-server');
            });
        }
    }, {
        key: 'run',
        value: function run(command) {
            return this.generator.run(command, undefined, { promptOnZeroDirectories: true });
        }
    }, {
        key: 'setup',
        value: function setup(generator) {
            this.generator = generator;
        }
    }, {
        key: 'dispose',
        value: function dispose() {
            this.disposable.dispose();
        }
    }]);

    return GeneratorAspnet;
}();

var generatorAspnet = exports.generatorAspnet = new GeneratorAspnet();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9hdG9tL2dlbmVyYXRvci1hc3BuZXQudHMiXSwibmFtZXMiOlsicGF0aCIsImNvbW1hbmRzIiwiR2VuZXJhdG9yQXNwbmV0IiwicmVxdWlyZWQiLCJ0aXRsZSIsImRlc2NyaXB0aW9uIiwiZGlzcG9zYWJsZSIsImFkZCIsImF0b20iLCJuZXdQcm9qZWN0IiwicnVuIiwiY29tbWFuZCIsImxvYWRDc0ZpbGUiLCJwcm9taXNlIiwidGhlbiIsIm1lc3NhZ2VzIiwiYWxsTWVzc2FnZXMiLCJza2lwIiwiY29uY2F0IiwiY3JlYXRlIiwiaWRlbnRpY2FsIiwiZm9yY2UiLCJmcm9tIiwiY29uY2F0TWFwIiwibWVzc2FnZSIsImZpbGUiLCJ0YWtlIiwibWFwIiwiam9pbiIsImN3ZCIsInRvUHJvbWlzZSIsIndvcmtzcGFjZSIsIm9wZW4iLCJ0aW1lciIsImRpc3BhdGNoIiwidmlld3MiLCJnZXRWaWV3IiwiZ2VuZXJhdG9yIiwidW5kZWZpbmVkIiwicHJvbXB0T25aZXJvRGlyZWN0b3JpZXMiLCJkaXNwb3NlIiwiZ2VuZXJhdG9yQXNwbmV0Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7QUFDQTs7SUFBWUEsSTs7QUFDWjs7QUFDQTs7Ozs7O0FBR0EsSUFBTUMsV0FBVyxDQUNiLG1CQURhLEVBRWIscUJBRmEsRUFHYixrQkFIYSxFQUliLGdCQUphLEVBS2IsZUFMYSxFQU1iLFdBTmEsRUFPYixPQVBhLEVBUWIsY0FSYSxFQVNiLFFBVGEsRUFVYixXQVZhLEVBV2IsV0FYYSxFQVliLFVBWmEsRUFhYixVQWJhLEVBY2IsV0FkYSxFQWViLFlBZmEsRUFnQmIsU0FoQmEsRUFpQmIsTUFqQmEsRUFrQmIsWUFsQmEsRUFtQmIsS0FuQmEsRUFvQmIsWUFwQmEsRUFxQmIsZUFyQmEsRUFzQmIsU0F0QmEsRUF1QmIsYUF2QmEsRUF3QmIsY0F4QmEsRUF5QmIsWUF6QmEsRUEwQmIsZ0JBMUJhLEVBMkJiLGdCQTNCYSxFQTRCYixXQTVCYSxFQTZCYixVQTdCYSxFQThC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QixLQUFLdUIsU0FBeEIsQ0FBdkIsRUFBMkQsK0JBQTNEO0FBQ0gsYUFKRSxDQUFQO0FBS0g7Ozs0QkFFV3BCLE8sRUFBZTtBQUN2QixtQkFBTyxLQUFLMEIsU0FBTCxDQUFlM0IsR0FBZixDQUFtQkMsT0FBbkIsRUFBNEIyQixTQUE1QixFQUF1QyxFQUFFQyx5QkFBeUIsSUFBM0IsRUFBdkMsQ0FBUDtBQUNIOzs7OEJBRVlGLFMsRUFBYztBQUN2QixpQkFBS0EsU0FBTCxHQUFpQkEsU0FBakI7QUFDSDs7O2tDQUVhO0FBQ1YsaUJBQUsvQixVQUFMLENBQWdCa0MsT0FBaEI7QUFDSDs7Ozs7O0FBT0UsSUFBTUMsNENBQWtCLElBQUl2QyxlQUFKLEVBQXhCIiwiZmlsZSI6ImxpYi9hdG9tL2dlbmVyYXRvci1hc3BuZXQuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge2VhY2gsIGVuZHNXaXRoLCBmaWx0ZXJ9IGZyb20gJ2xvZGFzaCc7XHJcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCB7T2JzZXJ2YWJsZX0gZnJvbSAncnhqcyc7XHJcbmltcG9ydCB7Q29tcG9zaXRlRGlzcG9zYWJsZX0gZnJvbSAndHMtZGlzcG9zYWJsZXMnO1xyXG5cclxuLy8gVE9ETzogTWFrZSBzdXJlIGl0IHN0YXlzIGluIHN5bmMgd2l0aFxyXG5jb25zdCBjb21tYW5kcyA9IFtcclxuICAgICdBbmd1bGFyQ29udHJvbGxlcicsXHJcbiAgICAnQW5ndWxhckNvbnRyb2xsZXJBcycsXHJcbiAgICAnQW5ndWxhckRpcmVjdGl2ZScsXHJcbiAgICAnQW5ndWxhckZhY3RvcnknLFxyXG4gICAgJ0FuZ3VsYXJNb2R1bGUnLFxyXG4gICAgJ0Jvd2VySnNvbicsXHJcbiAgICAnQ2xhc3MnLFxyXG4gICAgJ0NvZmZlZVNjcmlwdCcsXHJcbiAgICAnQ29uZmlnJyxcclxuICAgICdnaXRpZ25vcmUnLFxyXG4gICAgJ0dydW50ZmlsZScsXHJcbiAgICAnR3VscGZpbGUnLFxyXG4gICAgJ0hUTUxQYWdlJyxcclxuICAgICdJbnRlcmZhY2UnLFxyXG4gICAgJ0phdmFTY3JpcHQnLFxyXG4gICAgJ0pTY3JpcHQnLFxyXG4gICAgJ0pTT04nLFxyXG4gICAgJ0pTT05TY2hlbWEnLFxyXG4gICAgJ0pTWCcsXHJcbiAgICAnTWlkZGxld2FyZScsXHJcbiAgICAnTXZjQ29udHJvbGxlcicsXHJcbiAgICAnTXZjVmlldycsXHJcbiAgICAnUGFja2FnZUpzb24nLFxyXG4gICAgJ1N0YXJ0dXBDbGFzcycsXHJcbiAgICAnU3R5bGVTaGVldCcsXHJcbiAgICAnU3R5bGVTaGVldExlc3MnLFxyXG4gICAgJ1N0eWxlU2hlZXRTQ1NTJyxcclxuICAgICdUYWdIZWxwZXInLFxyXG4gICAgJ1RleHRGaWxlJyxcclxuICAgICdUeXBlU2NyaXB0JyxcclxuICAgICdUeXBlU2NyaXB0Q29uZmlnJyxcclxuICAgICdXZWJBcGlDb250cm9sbGVyJ1xyXG5dO1xyXG5cclxubW9kdWxlIFllb21hbiB7XHJcbiAgICBleHBvcnQgaW50ZXJmYWNlIElNZXNzYWdlcyB7XHJcbiAgICAgICAgY3dkPzogc3RyaW5nO1xyXG4gICAgICAgIHNraXA6IHN0cmluZ1tdO1xyXG4gICAgICAgIGZvcmNlOiBzdHJpbmdbXTtcclxuICAgICAgICBjcmVhdGU6IHN0cmluZ1tdO1xyXG4gICAgICAgIGludm9rZTogc3RyaW5nW107XHJcbiAgICAgICAgY29uZmxpY3Q6IHN0cmluZ1tdO1xyXG4gICAgICAgIGlkZW50aWNhbDogc3RyaW5nW107XHJcbiAgICAgICAgaW5mbzogc3RyaW5nW107XHJcbiAgICB9XHJcbn1cclxuXHJcbmNsYXNzIEdlbmVyYXRvckFzcG5ldCBpbXBsZW1lbnRzIElGZWF0dXJlIHtcclxuICAgIHByaXZhdGUgZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxuICAgIHByaXZhdGUgZ2VuZXJhdG9yOiB7XHJcbiAgICAgICAgcnVuKGdlbmVyYXRvcjogc3RyaW5nLCBwYXRoPzogc3RyaW5nLCBvcHRpb25zPzogYW55KTogUHJvbWlzZTxhbnk+OyBzdGFydChwcmVmaXg6IHN0cmluZywgcGF0aD86IHN0cmluZywgb3B0aW9ucz86IGFueSk6IFByb21pc2U8YW55PjtcclxuICAgICAgICBsaXN0KHByZWZpeD86IHN0cmluZywgcGF0aD86IHN0cmluZywgb3B0aW9ucz86IGFueSk6IFByb21pc2U8eyBkaXNwbGF5TmFtZTogc3RyaW5nOyBuYW1lOiBzdHJpbmc7IHJlc29sdmVkOiBzdHJpbmc7IH1bXT5cclxuICAgIH07XHJcblxyXG4gICAgcHVibGljIGFjdGl2YXRlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoJ2F0b20td29ya3NwYWNlJywgJ29tbmlzaGFycC1hdG9tOm5ldy1wcm9qZWN0JywgKCkgPT4gdGhpcy5uZXdQcm9qZWN0KCkpKTtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKCdhdG9tLXdvcmtzcGFjZScsICdjIzpuZXctcHJvamVjdCcsICgpID0+IHRoaXMubmV3UHJvamVjdCgpKSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoJ2F0b20td29ya3NwYWNlJywgJ29tbmlzaGFycC1hdG9tOm5ldy1jbGFzcycsICgpID0+IHRoaXMucnVuKCdhc3BuZXQ6Q2xhc3MnKSkpO1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoJ2F0b20td29ya3NwYWNlJywgJ0MjOm5ldy1jbGFzcycsICgpID0+IHRoaXMucnVuKCdhc3BuZXQ6Q2xhc3MnKSkpO1xyXG5cclxuICAgICAgICBlYWNoKGNvbW1hbmRzLCBjb21tYW5kID0+IHtcclxuICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZCgnYXRvbS13b3Jrc3BhY2UnLCBgb21uaXNoYXJwLWF0b206YXNwbmV0LSR7Y29tbWFuZH1gLCAoKSA9PiB0aGlzLmxvYWRDc0ZpbGUodGhpcy5ydW4oYGFzcG5ldDoke2NvbW1hbmR9YCkpKSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBsb2FkQ3NGaWxlKHByb21pc2U6IFByb21pc2U8YW55Pikge1xyXG4gICAgICAgIHJldHVybiBwcm9taXNlLnRoZW4oKG1lc3NhZ2VzOiBZZW9tYW4uSU1lc3NhZ2VzKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IGFsbE1lc3NhZ2VzID0gbWVzc2FnZXMuc2tpcFxyXG4gICAgICAgICAgICAgICAgLmNvbmNhdChtZXNzYWdlcy5jcmVhdGUpXHJcbiAgICAgICAgICAgICAgICAuY29uY2F0KG1lc3NhZ2VzLmlkZW50aWNhbClcclxuICAgICAgICAgICAgICAgIC5jb25jYXQobWVzc2FnZXMuZm9yY2UpO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuZnJvbTxzdHJpbmc+KFsnU3RhcnR1cC5jcycsICdQcm9ncmFtLmNzJywgJy5jcyddKVxyXG4gICAgICAgICAgICAgICAgLmNvbmNhdE1hcChmaWxlID0+IGZpbHRlcihhbGxNZXNzYWdlcywgbWVzc2FnZSA9PiBlbmRzV2l0aChtZXNzYWdlLCBmaWxlKSkpXHJcbiAgICAgICAgICAgICAgICAudGFrZSgxKVxyXG4gICAgICAgICAgICAgICAgLm1hcChmaWxlID0+IHBhdGguam9pbihtZXNzYWdlcy5jd2QsIGZpbGUpKVxyXG4gICAgICAgICAgICAgICAgLnRvUHJvbWlzZSgpO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgICAgIC50aGVuKGZpbGUgPT4gYXRvbS53b3Jrc3BhY2Uub3BlbihmaWxlKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBuZXdQcm9qZWN0KCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmxvYWRDc0ZpbGUodGhpcy5ydW4oJ2FzcG5ldDphcHAgLS1jcmVhdGVJbkRpcmVjdG9yeScpKVxyXG4gICAgICAgICAgICAudGhlbigoKSA9PiBPYnNlcnZhYmxlLnRpbWVyKDIwMDApLnRvUHJvbWlzZSgpKVxyXG4gICAgICAgICAgICAudGhlbigoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSksICdvbW5pc2hhcnAtYXRvbTpyZXN0YXJ0LXNlcnZlcicpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHJ1bihjb21tYW5kOiBzdHJpbmcpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5nZW5lcmF0b3IucnVuKGNvbW1hbmQsIHVuZGVmaW5lZCwgeyBwcm9tcHRPblplcm9EaXJlY3RvcmllczogdHJ1ZSB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2V0dXAoZ2VuZXJhdG9yOiBhbnkpIHtcclxuICAgICAgICB0aGlzLmdlbmVyYXRvciA9IGdlbmVyYXRvcjtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGlzcG9zZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZXF1aXJlZCA9IHRydWU7XHJcbiAgICBwdWJsaWMgdGl0bGUgPSAnQXNwbmV0IFllb21hbiBHZW5lcmF0b3InO1xyXG4gICAgcHVibGljIGRlc2NyaXB0aW9uID0gJ0VuYWJsZXMgdGhlIGFzcG5ldCB5ZW9tYW4gZ2VuZXJhdG9yLic7XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBnZW5lcmF0b3JBc3BuZXQgPSBuZXcgR2VuZXJhdG9yQXNwbmV0O1xyXG4iXX0=
