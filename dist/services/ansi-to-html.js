'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Convert = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var entities = require('entities');
var STYLES = {
    'ef0': 'color:#000',
    'ef1': 'color:#A00',
    'ef2': 'color:#0A0',
    'ef3': 'color:#A50',
    'ef4': 'color:#00A',
    'ef5': 'color:#A0A',
    'ef6': 'color:#0AA',
    'ef7': 'color:#AAA',
    'ef8': 'color:#555',
    'ef9': 'color:#F55',
    'ef10': 'color:#5F5',
    'ef11': 'color:#FF5',
    'ef12': 'color:#55F',
    'ef13': 'color:#F5F',
    'ef14': 'color:#5FF',
    'ef15': 'color:#FFF',
    'eb0': 'background-color:#000',
    'eb1': 'background-color:#A00',
    'eb2': 'background-color:#0A0',
    'eb3': 'background-color:#A50',
    'eb4': 'background-color:#00A',
    'eb5': 'background-color:#A0A',
    'eb6': 'background-color:#0AA',
    'eb7': 'background-color:#AAA',
    'eb8': 'background-color:#555',
    'eb9': 'background-color:#F55',
    'eb10': 'background-color:#5F5',
    'eb11': 'background-color:#FF5',
    'eb12': 'background-color:#55F',
    'eb13': 'background-color:#F5F',
    'eb14': 'background-color:#5FF',
    'eb15': 'background-color:#FFF'
};
var toHexString = function toHexString(num) {
    num = num.toString(16);
    while (num.length < 2) {
        num = '0' + num;
    }
    return num;
};
[0, 1, 2, 3, 4, 5].forEach(function (red) {
    return [0, 1, 2, 3, 4, 5].forEach(function (green) {
        return [0, 1, 2, 3, 4, 5].forEach(function (blue) {
            var c = 16 + red * 36 + green * 6 + blue;
            var r = red > 0 ? red * 40 + 55 : 0;
            var g = green > 0 ? green * 40 + 55 : 0;
            var b = blue > 0 ? blue * 40 + 55 : 0;
            var rgb = function () {
                var ref = [r, g, b];
                var results = [];
                for (var j = 0, len = ref.length; j < len; j++) {
                    var n = ref[j];
                    results.push(toHexString(n));
                }
                return results;
            }().join('');
            STYLES['ef' + c] = 'color:#' + rgb;
            return STYLES['eb' + c] = 'background-color:#' + rgb;
        });
    });
});
(function () {
    var results = [];
    for (var j = 0; j <= 23; j++) {
        results.push(j);
    }
    return results;
}).apply(undefined).forEach(function (gray) {
    var c = gray + 232;
    var l = toHexString(gray * 10 + 8);
    STYLES['ef' + c] = 'color:#' + l + l + l;
    return STYLES['eb' + c] = 'background-color:#' + l + l + l;
});
var defaults = {
    fg: '#FFF',
    bg: '#000',
    newline: false,
    escapeXML: false,
    stream: false
};

var Convert = exports.Convert = function () {
    function Convert(options) {
        _classCallCheck(this, Convert);

        this.input = [];
        this.stack = [];
        this.stickyStack = [];
        if (options == null) {
            options = {};
        }
        this.opts = (0, _lodash.extend)({}, defaults, options);
    }

    _createClass(Convert, [{
        key: 'toHtml',
        value: function toHtml(input) {
            var _this = this;

            this.input = typeof input === 'string' ? [input] : input;
            var buf = [];
            this.stickyStack.forEach(function (element) {
                return _this.generateOutput(element.token, element.data, function (chunk) {
                    return buf.push(chunk);
                });
            });
            this.forEach(function (chunk) {
                return buf.push(chunk);
            });
            this.input = [];
            return buf.join('');
        }
    }, {
        key: 'forEach',
        value: function forEach(callback) {
            var _this2 = this;

            var buf = '';
            this.input.forEach(function (chunk) {
                buf += chunk;
                return _this2.tokenize(buf, function (token, data) {
                    _this2.generateOutput(token, data, callback);
                    if (_this2.opts.stream) {
                        return _this2.updateStickyStack(token, data);
                    }
                });
            });
            if (this.stack.length) {
                return callback(this.resetStyles());
            }
        }
    }, {
        key: 'generateOutput',
        value: function generateOutput(token, data, callback) {
            switch (token) {
                case 'text':
                    return callback(this.pushText(data));
                case 'display':
                    return this.handleDisplay(data, callback);
                case 'xterm256':
                    return callback(this.pushStyle('ef' + data));
            }
        }
    }, {
        key: 'updateStickyStack',
        value: function updateStickyStack(token, data) {
            var notCategory = function notCategory(category) {
                return function (e) {
                    return (category === null || e.category !== category) && category !== 'all';
                };
            };
            if (token !== 'text') {
                this.stickyStack = this.stickyStack.filter(notCategory(this.categoryForCode(data)));
                return this.stickyStack.push({
                    token: token,
                    data: data,
                    category: this.categoryForCode(data)
                });
            }
        }
    }, {
        key: 'handleDisplay',
        value: function handleDisplay(code, callback) {
            code = parseInt(code, 10);
            if (code === -1) {
                callback('<br/>');
            }
            if (code === 0) {
                if (this.stack.length) {
                    callback(this.resetStyles());
                }
            }
            if (code === 1) {
                callback(this.pushTag('b'));
            }
            if (2 < code && code < 5) {
                callback(this.pushTag('u'));
            }
            if (4 < code && code < 7) {
                callback(this.pushTag('blink'));
            }
            if (code === 8) {
                callback(this.pushStyle('display:none'));
            }
            if (code === 9) {
                callback(this.pushTag('strike'));
            }
            if (code === 24) {
                callback(this.closeTag('u'));
            }
            if (29 < code && code < 38) {
                callback(this.pushStyle('ef' + (code - 30)));
            }
            if (code === 39) {
                callback(this.pushStyle('color:' + this.opts.fg));
            }
            if (39 < code && code < 48) {
                callback(this.pushStyle('eb' + (code - 40)));
            }
            if (code === 49) {
                callback(this.pushStyle('background-color:' + this.opts.bg));
            }
            if (89 < code && code < 98) {
                callback(this.pushStyle('ef' + (8 + (code - 90))));
            }
            if (99 < code && code < 108) {
                return callback(this.pushStyle('eb' + (8 + (code - 100))));
            }
        }
    }, {
        key: 'categoryForCode',
        value: function categoryForCode(code) {
            code = parseInt(code, 10);
            if (code === 0) {
                return 'all';
            } else if (code === 1) {
                return 'bold';
            } else if (2 < code && code < 5) {
                return 'underline';
            } else if (4 < code && code < 7) {
                return 'blink';
            } else if (code === 8) {
                return 'hide';
            } else if (code === 9) {
                return 'strike';
            } else if (29 < code && code < 38 || code === 39 || 89 < code && code < 98) {
                return 'foreground-color';
            } else if (39 < code && code < 48 || code === 49 || 99 < code && code < 108) {
                return 'background-color';
            } else {
                return null;
            }
        }
    }, {
        key: 'pushTag',
        value: function pushTag(tag, style) {
            if (style == null) {
                style = '';
            }
            if (style.length && style.indexOf(':') === -1) {
                style = STYLES[style];
            }
            this.stack.push(tag);
            return ['<' + tag, style ? ' style=\"' + style + '\"' : void 0, '>'].join('');
        }
    }, {
        key: 'pushText',
        value: function pushText(text) {
            if (this.opts.escapeXML) {
                return entities.encodeXML(text);
            } else {
                return text;
            }
        }
    }, {
        key: 'pushStyle',
        value: function pushStyle(style) {
            return this.pushTag('span', style);
        }
    }, {
        key: 'closeTag',
        value: function closeTag(style) {
            var last = void 0;
            if (this.stack.slice(-1)[0] === style) {
                last = this.stack.pop();
            }
            if (last != null) {
                return '</' + style + '>';
            }
        }
    }, {
        key: 'resetStyles',
        value: function resetStyles() {
            var ref = [this.stack, []],
                stack = ref[0];
            this.stack = ref[1];
            return stack.reverse().map(function (tag) {
                return '</' + tag + '>';
            }).join('');
        }
    }, {
        key: 'tokenize',
        value: function tokenize(text, callback) {
            var _this3 = this;

            var ansiMatch = false;
            var ansiHandler = 3;
            var remove = function remove(m) {
                return '';
            };
            var removeXterm256 = function removeXterm256(m, g1) {
                callback('xterm256', g1);
                return '';
            };
            var newline = function newline(m) {
                if (_this3.opts.newline) {
                    callback('display', -1);
                } else {
                    callback('text', m);
                }
                return '';
            };
            var ansiMess = function ansiMess(m, g1) {
                ansiMatch = true;
                var code = void 0;
                if (g1.trim().length === 0) {
                    g1 = '0';
                }
                g1 = g1.trimRight(';').split(';');
                for (var o = 0, len = g1.length; o < len; o++) {
                    code = g1[o];
                    callback('display', code);
                }
                return '';
            };
            var realText = function realText(m) {
                callback('text', m);
                return '';
            };
            var tokens = [{
                pattern: /^\x08+/,
                sub: remove
            }, {
                pattern: /^\x1b\[[012]?K/,
                sub: remove
            }, {
                pattern: /^\x1b\[38;5;(\d+)m/,
                sub: removeXterm256
            }, {
                pattern: /^\n+/,
                sub: newline
            }, {
                pattern: /^\x1b\[((?:\d{1,3};?)+|)m/,
                sub: ansiMess
            }, {
                pattern: /^\x1b\[?[\d;]{0,3}/,
                sub: remove
            }, {
                pattern: /^([^\x1b\x08\n]+)/,
                sub: realText
            }];
            var process = function process(handler, i) {
                if (i > ansiHandler && ansiMatch) {
                    return;
                } else {
                    ansiMatch = false;
                }
                text = text.replace(handler.pattern, handler.sub);
            };
            var results1 = [];
            while ((length = text.length) > 0) {
                for (var i = 0, o = 0, len = tokens.length; o < len; i = ++o) {
                    var handler = tokens[i];
                    process(handler, i);
                }
                if (text.length === length) {
                    break;
                } else {
                    results1.push(void 0);
                }
            }
            return results1;
        }
    }]);

    return Convert;
}();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9zZXJ2aWNlcy9hbnNpLXRvLWh0bWwudHMiXSwibmFtZXMiOlsiZW50aXRpZXMiLCJyZXF1aXJlIiwiU1RZTEVTIiwidG9IZXhTdHJpbmciLCJudW0iLCJ0b1N0cmluZyIsImxlbmd0aCIsImZvckVhY2giLCJyZWQiLCJncmVlbiIsImJsdWUiLCJjIiwiciIsImciLCJiIiwicmdiIiwicmVmIiwicmVzdWx0cyIsImoiLCJsZW4iLCJuIiwicHVzaCIsImpvaW4iLCJhcHBseSIsImdyYXkiLCJsIiwiZGVmYXVsdHMiLCJmZyIsImJnIiwibmV3bGluZSIsImVzY2FwZVhNTCIsInN0cmVhbSIsIkNvbnZlcnQiLCJvcHRpb25zIiwiaW5wdXQiLCJzdGFjayIsInN0aWNreVN0YWNrIiwib3B0cyIsImJ1ZiIsImdlbmVyYXRlT3V0cHV0IiwiZWxlbWVudCIsInRva2VuIiwiZGF0YSIsImNodW5rIiwiY2FsbGJhY2siLCJ0b2tlbml6ZSIsInVwZGF0ZVN0aWNreVN0YWNrIiwicmVzZXRTdHlsZXMiLCJwdXNoVGV4dCIsImhhbmRsZURpc3BsYXkiLCJwdXNoU3R5bGUiLCJub3RDYXRlZ29yeSIsImNhdGVnb3J5IiwiZSIsImZpbHRlciIsImNhdGVnb3J5Rm9yQ29kZSIsImNvZGUiLCJwYXJzZUludCIsInB1c2hUYWciLCJjbG9zZVRhZyIsInRhZyIsInN0eWxlIiwiaW5kZXhPZiIsInRleHQiLCJlbmNvZGVYTUwiLCJsYXN0Iiwic2xpY2UiLCJwb3AiLCJyZXZlcnNlIiwibWFwIiwiYW5zaU1hdGNoIiwiYW5zaUhhbmRsZXIiLCJyZW1vdmUiLCJtIiwicmVtb3ZlWHRlcm0yNTYiLCJnMSIsImFuc2lNZXNzIiwidHJpbSIsInRyaW1SaWdodCIsInNwbGl0IiwibyIsInJlYWxUZXh0IiwidG9rZW5zIiwicGF0dGVybiIsInN1YiIsInByb2Nlc3MiLCJoYW5kbGVyIiwiaSIsInJlcGxhY2UiLCJyZXN1bHRzMSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7Ozs7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QUFTeUQsS0FBS3pELE1BQWYsSUFBeUIsQ0FBaEMsRUFBbUM7QUFDL0IscUJBQUssSUFBSWlGLElBQUksQ0FBUixFQUFXUCxJQUFJLENBQWYsRUFBa0I3RCxNQUFNK0QsT0FBTzVFLE1BQXBDLEVBQTRDMEUsSUFBSTdELEdBQWhELEVBQXFEb0UsSUFBSSxFQUFFUCxDQUEzRCxFQUE4RDtBQUMxRCx3QkFBTU0sVUFBVUosT0FBT0ssQ0FBUCxDQUFoQjtBQUNBRiw0QkFBUUMsT0FBUixFQUFpQkMsQ0FBakI7QUFDSDtBQUNELG9CQUFJeEIsS0FBS3pELE1BQUwsS0FBZ0JBLE1BQXBCLEVBQTRCO0FBQ3hCO0FBQ0gsaUJBRkQsTUFFTztBQUNIbUYsNkJBQVNwRSxJQUFULENBQWMsS0FBSyxDQUFuQjtBQUNIO0FBQ0o7QUFDRCxtQkFBT29FLFFBQVA7QUFDSCIsImZpbGUiOiJsaWIvc2VydmljZXMvYW5zaS10by1odG1sLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtleHRlbmR9IGZyb20gJ2xvZGFzaCc7XHJcbmNvbnN0IGVudGl0aWVzID0gcmVxdWlyZSgnZW50aXRpZXMnKTtcclxuXHJcbmNvbnN0IFNUWUxFUyA9IHtcclxuICAgICdlZjAnOiAnY29sb3I6IzAwMCcsXHJcbiAgICAnZWYxJzogJ2NvbG9yOiNBMDAnLFxyXG4gICAgJ2VmMic6ICdjb2xvcjojMEEwJyxcclxuICAgICdlZjMnOiAnY29sb3I6I0E1MCcsXHJcbiAgICAnZWY0JzogJ2NvbG9yOiMwMEEnLFxyXG4gICAgJ2VmNSc6ICdjb2xvcjojQTBBJyxcclxuICAgICdlZjYnOiAnY29sb3I6IzBBQScsXHJcbiAgICAnZWY3JzogJ2NvbG9yOiNBQUEnLFxyXG4gICAgJ2VmOCc6ICdjb2xvcjojNTU1JyxcclxuICAgICdlZjknOiAnY29sb3I6I0Y1NScsXHJcbiAgICAnZWYxMCc6ICdjb2xvcjojNUY1JyxcclxuICAgICdlZjExJzogJ2NvbG9yOiNGRjUnLFxyXG4gICAgJ2VmMTInOiAnY29sb3I6IzU1RicsXHJcbiAgICAnZWYxMyc6ICdjb2xvcjojRjVGJyxcclxuICAgICdlZjE0JzogJ2NvbG9yOiM1RkYnLFxyXG4gICAgJ2VmMTUnOiAnY29sb3I6I0ZGRicsXHJcbiAgICAnZWIwJzogJ2JhY2tncm91bmQtY29sb3I6IzAwMCcsXHJcbiAgICAnZWIxJzogJ2JhY2tncm91bmQtY29sb3I6I0EwMCcsXHJcbiAgICAnZWIyJzogJ2JhY2tncm91bmQtY29sb3I6IzBBMCcsXHJcbiAgICAnZWIzJzogJ2JhY2tncm91bmQtY29sb3I6I0E1MCcsXHJcbiAgICAnZWI0JzogJ2JhY2tncm91bmQtY29sb3I6IzAwQScsXHJcbiAgICAnZWI1JzogJ2JhY2tncm91bmQtY29sb3I6I0EwQScsXHJcbiAgICAnZWI2JzogJ2JhY2tncm91bmQtY29sb3I6IzBBQScsXHJcbiAgICAnZWI3JzogJ2JhY2tncm91bmQtY29sb3I6I0FBQScsXHJcbiAgICAnZWI4JzogJ2JhY2tncm91bmQtY29sb3I6IzU1NScsXHJcbiAgICAnZWI5JzogJ2JhY2tncm91bmQtY29sb3I6I0Y1NScsXHJcbiAgICAnZWIxMCc6ICdiYWNrZ3JvdW5kLWNvbG9yOiM1RjUnLFxyXG4gICAgJ2ViMTEnOiAnYmFja2dyb3VuZC1jb2xvcjojRkY1JyxcclxuICAgICdlYjEyJzogJ2JhY2tncm91bmQtY29sb3I6IzU1RicsXHJcbiAgICAnZWIxMyc6ICdiYWNrZ3JvdW5kLWNvbG9yOiNGNUYnLFxyXG4gICAgJ2ViMTQnOiAnYmFja2dyb3VuZC1jb2xvcjojNUZGJyxcclxuICAgICdlYjE1JzogJ2JhY2tncm91bmQtY29sb3I6I0ZGRidcclxufTtcclxuXHJcbmNvbnN0IHRvSGV4U3RyaW5nID0gZnVuY3Rpb24gKG51bTogYW55KSB7XHJcbiAgICBudW0gPSBudW0udG9TdHJpbmcoMTYpO1xyXG4gICAgd2hpbGUgKG51bS5sZW5ndGggPCAyKSB7XHJcbiAgICAgICAgbnVtID0gJzAnICsgbnVtO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIG51bTtcclxufTtcclxuXHJcblswLCAxLCAyLCAzLCA0LCA1XS5mb3JFYWNoKGZ1bmN0aW9uIChyZWQpIHtcclxuICAgIHJldHVybiBbMCwgMSwgMiwgMywgNCwgNV0uZm9yRWFjaChmdW5jdGlvbiAoZ3JlZW4pIHtcclxuICAgICAgICByZXR1cm4gWzAsIDEsIDIsIDMsIDQsIDVdLmZvckVhY2goZnVuY3Rpb24gKGJsdWUpIHtcclxuICAgICAgICAgICAgY29uc3QgYyA9IDE2ICsgKHJlZCAqIDM2KSArIChncmVlbiAqIDYpICsgYmx1ZTtcclxuICAgICAgICAgICAgY29uc3QgciA9IHJlZCA+IDAgPyByZWQgKiA0MCArIDU1IDogMDtcclxuICAgICAgICAgICAgY29uc3QgZyA9IGdyZWVuID4gMCA/IGdyZWVuICogNDAgKyA1NSA6IDA7XHJcbiAgICAgICAgICAgIGNvbnN0IGIgPSBibHVlID4gMCA/IGJsdWUgKiA0MCArIDU1IDogMDtcclxuICAgICAgICAgICAgY29uc3QgcmdiID0gKChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCByZWYgPSBbciwgZywgYl07XHJcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHRzOiBhbnlbXSA9IFtdO1xyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaiA9IDAsIGxlbiA9IHJlZi5sZW5ndGg7IGogPCBsZW47IGorKykge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG4gPSByZWZbal07XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKHRvSGV4U3RyaW5nKG4pKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHRzO1xyXG4gICAgICAgICAgICB9KSgpKS5qb2luKCcnKTtcclxuICAgICAgICAgICAgU1RZTEVTWydlZicgKyBjXSA9ICdjb2xvcjojJyArIHJnYjtcclxuICAgICAgICAgICAgcmV0dXJuIFNUWUxFU1snZWInICsgY10gPSAnYmFja2dyb3VuZC1jb2xvcjojJyArIHJnYjtcclxuICAgICAgICB9KTtcclxuICAgIH0pO1xyXG59KTtcclxuXHJcbihmdW5jdGlvbiAoKSB7XHJcbiAgICBjb25zdCByZXN1bHRzOiBhbnlbXSA9IFtdO1xyXG4gICAgZm9yIChsZXQgaiA9IDA7IGogPD0gMjM7IGorKykgeyByZXN1bHRzLnB1c2goaik7IH1cclxuICAgIHJldHVybiByZXN1bHRzO1xyXG59KS5hcHBseSh0aGlzKS5mb3JFYWNoKGZ1bmN0aW9uIChncmF5OiBhbnkpIHtcclxuICAgIGNvbnN0IGMgPSBncmF5ICsgMjMyO1xyXG4gICAgY29uc3QgbCA9IHRvSGV4U3RyaW5nKGdyYXkgKiAxMCArIDgpO1xyXG4gICAgU1RZTEVTWydlZicgKyBjXSA9ICdjb2xvcjojJyArIGwgKyBsICsgbDtcclxuICAgIHJldHVybiBTVFlMRVNbJ2ViJyArIGNdID0gJ2JhY2tncm91bmQtY29sb3I6IycgKyBsICsgbCArIGw7XHJcbn0pO1xyXG5cclxuY29uc3QgZGVmYXVsdHMgPSB7XHJcbiAgICBmZzogJyNGRkYnLFxyXG4gICAgYmc6ICcjMDAwJyxcclxuICAgIG5ld2xpbmU6IGZhbHNlLFxyXG4gICAgZXNjYXBlWE1MOiBmYWxzZSxcclxuICAgIHN0cmVhbTogZmFsc2VcclxufTtcclxuXHJcbmV4cG9ydCBjbGFzcyBDb252ZXJ0IHtcclxuICAgIHByaXZhdGUgb3B0czogYW55O1xyXG4gICAgcHJpdmF0ZSBpbnB1dDogYW55W10gPSBbXTtcclxuICAgIHByaXZhdGUgc3RhY2s6IGFueVtdID0gW107XHJcbiAgICBwcml2YXRlIHN0aWNreVN0YWNrOiBhbnlbXSA9IFtdO1xyXG4gICAgY29uc3RydWN0b3Iob3B0aW9ucz86IGFueSkge1xyXG4gICAgICAgIGlmIChvcHRpb25zID09IG51bGwpIHtcclxuICAgICAgICAgICAgb3B0aW9ucyA9IHt9O1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLm9wdHMgPSBleHRlbmQoe30sIGRlZmF1bHRzLCBvcHRpb25zKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgdG9IdG1sKGlucHV0OiBhbnkpIHtcclxuICAgICAgICB0aGlzLmlucHV0ID0gdHlwZW9mIGlucHV0ID09PSAnc3RyaW5nJyA/IFtpbnB1dF0gOiBpbnB1dDtcclxuICAgICAgICBjb25zdCBidWY6IGFueVtdID0gW107XHJcbiAgICAgICAgdGhpcy5zdGlja3lTdGFjay5mb3JFYWNoKGVsZW1lbnQgPT4ge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5nZW5lcmF0ZU91dHB1dChlbGVtZW50LnRva2VuLCBlbGVtZW50LmRhdGEsIGZ1bmN0aW9uIChjaHVuazogYW55KSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYnVmLnB1c2goY2h1bmspO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLmZvckVhY2goZnVuY3Rpb24gKGNodW5rOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGJ1Zi5wdXNoKGNodW5rKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLmlucHV0ID0gW107XHJcbiAgICAgICAgcmV0dXJuIGJ1Zi5qb2luKCcnKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGZvckVhY2goY2FsbGJhY2s6IGFueSkge1xyXG4gICAgICAgIGxldCBidWYgPSAnJztcclxuICAgICAgICB0aGlzLmlucHV0LmZvckVhY2goY2h1bmsgPT4ge1xyXG4gICAgICAgICAgICBidWYgKz0gY2h1bms7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnRva2VuaXplKGJ1ZiwgKHRva2VuOiBhbnksIGRhdGE6IGFueSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5nZW5lcmF0ZU91dHB1dCh0b2tlbiwgZGF0YSwgY2FsbGJhY2spO1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMub3B0cy5zdHJlYW0pIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy51cGRhdGVTdGlja3lTdGFjayh0b2tlbiwgZGF0YSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGlmICh0aGlzLnN0YWNrLmxlbmd0aCkge1xyXG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2sodGhpcy5yZXNldFN0eWxlcygpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBnZW5lcmF0ZU91dHB1dCh0b2tlbjogYW55LCBkYXRhOiBhbnksIGNhbGxiYWNrOiBhbnkpIHtcclxuICAgICAgICBzd2l0Y2ggKHRva2VuKSB7XHJcbiAgICAgICAgICAgIGNhc2UgJ3RleHQnOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKHRoaXMucHVzaFRleHQoZGF0YSkpO1xyXG4gICAgICAgICAgICBjYXNlICdkaXNwbGF5JzpcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmhhbmRsZURpc3BsYXkoZGF0YSwgY2FsbGJhY2spO1xyXG4gICAgICAgICAgICBjYXNlICd4dGVybTI1Nic6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2sodGhpcy5wdXNoU3R5bGUoJ2VmJyArIGRhdGEpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSB1cGRhdGVTdGlja3lTdGFjayh0b2tlbjogYW55LCBkYXRhOiBhbnkpIHtcclxuICAgICAgICBjb25zdCBub3RDYXRlZ29yeSA9IGZ1bmN0aW9uIChjYXRlZ29yeTogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAoZTogYW55KSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gKGNhdGVnb3J5ID09PSBudWxsIHx8IGUuY2F0ZWdvcnkgIT09IGNhdGVnb3J5KSAmJiBjYXRlZ29yeSAhPT0gJ2FsbCc7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfTtcclxuICAgICAgICBpZiAodG9rZW4gIT09ICd0ZXh0Jykge1xyXG4gICAgICAgICAgICB0aGlzLnN0aWNreVN0YWNrID0gdGhpcy5zdGlja3lTdGFjay5maWx0ZXIobm90Q2F0ZWdvcnkodGhpcy5jYXRlZ29yeUZvckNvZGUoZGF0YSkpKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3RpY2t5U3RhY2sucHVzaCh7XHJcbiAgICAgICAgICAgICAgICB0b2tlbjogdG9rZW4sXHJcbiAgICAgICAgICAgICAgICBkYXRhOiBkYXRhLFxyXG4gICAgICAgICAgICAgICAgY2F0ZWdvcnk6IHRoaXMuY2F0ZWdvcnlGb3JDb2RlKGRhdGEpXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGhhbmRsZURpc3BsYXkoY29kZTogYW55LCBjYWxsYmFjazogYW55KSB7XHJcbiAgICAgICAgY29kZSA9IHBhcnNlSW50KGNvZGUsIDEwKTtcclxuICAgICAgICBpZiAoY29kZSA9PT0gLTEpIHtcclxuICAgICAgICAgICAgY2FsbGJhY2soJzxici8+Jyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChjb2RlID09PSAwKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLnN0YWNrLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2sodGhpcy5yZXNldFN0eWxlcygpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoY29kZSA9PT0gMSkge1xyXG4gICAgICAgICAgICBjYWxsYmFjayh0aGlzLnB1c2hUYWcoJ2InKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICgoMiA8IGNvZGUgJiYgY29kZSA8IDUpKSB7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrKHRoaXMucHVzaFRhZygndScpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCg0IDwgY29kZSAmJiBjb2RlIDwgNykpIHtcclxuICAgICAgICAgICAgY2FsbGJhY2sodGhpcy5wdXNoVGFnKCdibGluaycpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGNvZGUgPT09IDgpIHtcclxuICAgICAgICAgICAgY2FsbGJhY2sodGhpcy5wdXNoU3R5bGUoJ2Rpc3BsYXk6bm9uZScpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGNvZGUgPT09IDkpIHtcclxuICAgICAgICAgICAgY2FsbGJhY2sodGhpcy5wdXNoVGFnKCdzdHJpa2UnKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChjb2RlID09PSAyNCkge1xyXG4gICAgICAgICAgICBjYWxsYmFjayh0aGlzLmNsb3NlVGFnKCd1JykpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoKDI5IDwgY29kZSAmJiBjb2RlIDwgMzgpKSB7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrKHRoaXMucHVzaFN0eWxlKCdlZicgKyAoY29kZSAtIDMwKSkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoY29kZSA9PT0gMzkpIHtcclxuICAgICAgICAgICAgY2FsbGJhY2sodGhpcy5wdXNoU3R5bGUoJ2NvbG9yOicgKyB0aGlzLm9wdHMuZmcpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCgzOSA8IGNvZGUgJiYgY29kZSA8IDQ4KSkge1xyXG4gICAgICAgICAgICBjYWxsYmFjayh0aGlzLnB1c2hTdHlsZSgnZWInICsgKGNvZGUgLSA0MCkpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGNvZGUgPT09IDQ5KSB7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrKHRoaXMucHVzaFN0eWxlKCdiYWNrZ3JvdW5kLWNvbG9yOicgKyB0aGlzLm9wdHMuYmcpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCg4OSA8IGNvZGUgJiYgY29kZSA8IDk4KSkge1xyXG4gICAgICAgICAgICBjYWxsYmFjayh0aGlzLnB1c2hTdHlsZSgnZWYnICsgKDggKyAoY29kZSAtIDkwKSkpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCg5OSA8IGNvZGUgJiYgY29kZSA8IDEwOCkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKHRoaXMucHVzaFN0eWxlKCdlYicgKyAoOCArIChjb2RlIC0gMTAwKSkpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBjYXRlZ29yeUZvckNvZGUoY29kZTogYW55KSB7XHJcbiAgICAgICAgY29kZSA9IHBhcnNlSW50KGNvZGUsIDEwKTtcclxuICAgICAgICBpZiAoY29kZSA9PT0gMCkge1xyXG4gICAgICAgICAgICByZXR1cm4gJ2FsbCc7XHJcbiAgICAgICAgfSBlbHNlIGlmIChjb2RlID09PSAxKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAnYm9sZCc7XHJcbiAgICAgICAgfSBlbHNlIGlmICgoMiA8IGNvZGUgJiYgY29kZSA8IDUpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAndW5kZXJsaW5lJztcclxuICAgICAgICB9IGVsc2UgaWYgKCg0IDwgY29kZSAmJiBjb2RlIDwgNykpIHtcclxuICAgICAgICAgICAgcmV0dXJuICdibGluayc7XHJcbiAgICAgICAgfSBlbHNlIGlmIChjb2RlID09PSA4KSB7XHJcbiAgICAgICAgICAgIHJldHVybiAnaGlkZSc7XHJcbiAgICAgICAgfSBlbHNlIGlmIChjb2RlID09PSA5KSB7XHJcbiAgICAgICAgICAgIHJldHVybiAnc3RyaWtlJztcclxuICAgICAgICB9IGVsc2UgaWYgKCgyOSA8IGNvZGUgJiYgY29kZSA8IDM4KSB8fCBjb2RlID09PSAzOSB8fCAoODkgPCBjb2RlICYmIGNvZGUgPCA5OCkpIHtcclxuICAgICAgICAgICAgcmV0dXJuICdmb3JlZ3JvdW5kLWNvbG9yJztcclxuICAgICAgICB9IGVsc2UgaWYgKCgzOSA8IGNvZGUgJiYgY29kZSA8IDQ4KSB8fCBjb2RlID09PSA0OSB8fCAoOTkgPCBjb2RlICYmIGNvZGUgPCAxMDgpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAnYmFja2dyb3VuZC1jb2xvcic7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgcHVzaFRhZyh0YWc6IGFueSwgc3R5bGU/OiBhbnkpIHtcclxuICAgICAgICBpZiAoc3R5bGUgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICBzdHlsZSA9ICcnO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoc3R5bGUubGVuZ3RoICYmIHN0eWxlLmluZGV4T2YoJzonKSA9PT0gLTEpIHtcclxuICAgICAgICAgICAgc3R5bGUgPSBTVFlMRVNbc3R5bGVdO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnN0YWNrLnB1c2godGFnKTtcclxuICAgICAgICByZXR1cm4gWyc8JyArIHRhZywgKHN0eWxlID8gJyBzdHlsZT1cXFwiJyArIHN0eWxlICsgJ1xcXCInIDogdm9pZCAwKSwgJz4nXS5qb2luKCcnKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHB1c2hUZXh0KHRleHQ6IGFueSkge1xyXG4gICAgICAgIGlmICh0aGlzLm9wdHMuZXNjYXBlWE1MKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlbnRpdGllcy5lbmNvZGVYTUwodGV4dCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRleHQ7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgcHVzaFN0eWxlKHN0eWxlOiBhbnkpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5wdXNoVGFnKCdzcGFuJywgc3R5bGUpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgY2xvc2VUYWcoc3R5bGU6IGFueSkge1xyXG4gICAgICAgIGxldCBsYXN0OiBhbnk7XHJcbiAgICAgICAgaWYgKHRoaXMuc3RhY2suc2xpY2UoLTEpWzBdID09PSBzdHlsZSkge1xyXG4gICAgICAgICAgICBsYXN0ID0gdGhpcy5zdGFjay5wb3AoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGxhc3QgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICByZXR1cm4gJzwvJyArIHN0eWxlICsgJz4nO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHJlc2V0U3R5bGVzKCkge1xyXG4gICAgICAgIGNvbnN0IHJlZiA9IFt0aGlzLnN0YWNrLCBbXV0sIHN0YWNrID0gcmVmWzBdO1xyXG4gICAgICAgIHRoaXMuc3RhY2sgPSByZWZbMV07XHJcbiAgICAgICAgcmV0dXJuIHN0YWNrLnJldmVyc2UoKS5tYXAoZnVuY3Rpb24gKHRhZykge1xyXG4gICAgICAgICAgICByZXR1cm4gJzwvJyArIHRhZyArICc+JztcclxuICAgICAgICB9KS5qb2luKCcnKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHRva2VuaXplKHRleHQ6IGFueSwgY2FsbGJhY2s6IGFueSkge1xyXG4gICAgICAgIGxldCBhbnNpTWF0Y2ggPSBmYWxzZTtcclxuICAgICAgICBjb25zdCBhbnNpSGFuZGxlciA9IDM7XHJcbiAgICAgICAgY29uc3QgcmVtb3ZlID0gZnVuY3Rpb24gKG06IGFueSkge1xyXG4gICAgICAgICAgICByZXR1cm4gJyc7XHJcbiAgICAgICAgfTtcclxuICAgICAgICBjb25zdCByZW1vdmVYdGVybTI1NiA9IGZ1bmN0aW9uIChtOiBhbnksIGcxOiBhbnkpIHtcclxuICAgICAgICAgICAgY2FsbGJhY2soJ3h0ZXJtMjU2JywgZzEpO1xyXG4gICAgICAgICAgICByZXR1cm4gJyc7XHJcbiAgICAgICAgfTtcclxuICAgICAgICBjb25zdCBuZXdsaW5lID0gKG06IGFueSkgPT4ge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5vcHRzLm5ld2xpbmUpIHtcclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrKCdkaXNwbGF5JywgLTEpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2soJ3RleHQnLCBtKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gJyc7XHJcbiAgICAgICAgfTtcclxuICAgICAgICBjb25zdCBhbnNpTWVzcyA9IGZ1bmN0aW9uIChtOiBhbnksIGcxOiBhbnkpIHtcclxuICAgICAgICAgICAgYW5zaU1hdGNoID0gdHJ1ZTtcclxuICAgICAgICAgICAgbGV0IGNvZGU6IGFueTtcclxuICAgICAgICAgICAgaWYgKGcxLnRyaW0oKS5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgICAgICAgIGcxID0gJzAnO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGcxID0gZzEudHJpbVJpZ2h0KCc7Jykuc3BsaXQoJzsnKTtcclxuICAgICAgICAgICAgZm9yIChsZXQgbyA9IDAsIGxlbiA9IGcxLmxlbmd0aDsgbyA8IGxlbjsgbysrKSB7XHJcbiAgICAgICAgICAgICAgICBjb2RlID0gZzFbb107XHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjaygnZGlzcGxheScsIGNvZGUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiAnJztcclxuICAgICAgICB9O1xyXG4gICAgICAgIGNvbnN0IHJlYWxUZXh0ID0gZnVuY3Rpb24gKG06IGFueSkge1xyXG4gICAgICAgICAgICBjYWxsYmFjaygndGV4dCcsIG0pO1xyXG4gICAgICAgICAgICByZXR1cm4gJyc7XHJcbiAgICAgICAgfTtcclxuICAgICAgICBjb25zdCB0b2tlbnMgPSBbXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHBhdHRlcm46IC9eXFx4MDgrLyxcclxuICAgICAgICAgICAgICAgIHN1YjogcmVtb3ZlXHJcbiAgICAgICAgICAgIH0sIHtcclxuICAgICAgICAgICAgICAgIHBhdHRlcm46IC9eXFx4MWJcXFtbMDEyXT9LLyxcclxuICAgICAgICAgICAgICAgIHN1YjogcmVtb3ZlXHJcbiAgICAgICAgICAgIH0sIHtcclxuICAgICAgICAgICAgICAgIHBhdHRlcm46IC9eXFx4MWJcXFszODs1OyhcXGQrKW0vLFxyXG4gICAgICAgICAgICAgICAgc3ViOiByZW1vdmVYdGVybTI1NlxyXG4gICAgICAgICAgICB9LCB7XHJcbiAgICAgICAgICAgICAgICBwYXR0ZXJuOiAvXlxcbisvLFxyXG4gICAgICAgICAgICAgICAgc3ViOiBuZXdsaW5lXHJcbiAgICAgICAgICAgIH0sIHtcclxuICAgICAgICAgICAgICAgIHBhdHRlcm46IC9eXFx4MWJcXFsoKD86XFxkezEsM307PykrfCltLyxcclxuICAgICAgICAgICAgICAgIHN1YjogYW5zaU1lc3NcclxuICAgICAgICAgICAgfSwge1xyXG4gICAgICAgICAgICAgICAgcGF0dGVybjogL15cXHgxYlxcWz9bXFxkO117MCwzfS8sXHJcbiAgICAgICAgICAgICAgICBzdWI6IHJlbW92ZVxyXG4gICAgICAgICAgICB9LCB7XHJcbiAgICAgICAgICAgICAgICBwYXR0ZXJuOiAvXihbXlxceDFiXFx4MDhcXG5dKykvLFxyXG4gICAgICAgICAgICAgICAgc3ViOiByZWFsVGV4dFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgXTtcclxuICAgICAgICBjb25zdCBwcm9jZXNzID0gZnVuY3Rpb24gKGhhbmRsZXI6IGFueSwgaTogYW55KSB7XHJcbiAgICAgICAgICAgIGlmIChpID4gYW5zaUhhbmRsZXIgJiYgYW5zaU1hdGNoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBhbnNpTWF0Y2ggPSBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0ZXh0ID0gdGV4dC5yZXBsYWNlKGhhbmRsZXIucGF0dGVybiwgaGFuZGxlci5zdWIpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgY29uc3QgcmVzdWx0czE6IGFueVtdID0gW107XHJcbiAgICAgICAgd2hpbGUgKChsZW5ndGggPSB0ZXh0Lmxlbmd0aCkgPiAwKSB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwLCBvID0gMCwgbGVuID0gdG9rZW5zLmxlbmd0aDsgbyA8IGxlbjsgaSA9ICsrbykge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgaGFuZGxlciA9IHRva2Vuc1tpXTtcclxuICAgICAgICAgICAgICAgIHByb2Nlc3MoaGFuZGxlciwgaSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHRleHQubGVuZ3RoID09PSBsZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0czEucHVzaCh2b2lkIDApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByZXN1bHRzMTtcclxuICAgIH1cclxufVxyXG4iXX0=
