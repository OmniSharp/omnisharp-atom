import {extend} from "lodash";
const entities = require("entities");

const STYLES = {
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

const toHexString = function(num) {
    num = num.toString(16);
    while (num.length < 2) {
        num = "0" + num;
    }
    return num;
};

[0, 1, 2, 3, 4, 5].forEach(function(red) {
    return [0, 1, 2, 3, 4, 5].forEach(function(green) {
        return [0, 1, 2, 3, 4, 5].forEach(function(blue) {
            var b, c, g, n, r, rgb;
            c = 16 + (red * 36) + (green * 6) + blue;
            r = red > 0 ? red * 40 + 55 : 0;
            g = green > 0 ? green * 40 + 55 : 0;
            b = blue > 0 ? blue * 40 + 55 : 0;
            rgb = ((function() {
                var j, len, ref, results;
                ref = [r, g, b];
                results = [];
                for (j = 0, len = ref.length; j < len; j++) {
                    n = ref[j];
                    results.push(toHexString(n));
                }
                return results;
            })()).join('');
            STYLES["ef" + c] = "color:#" + rgb;
            return STYLES["eb" + c] = "background-color:#" + rgb;
        });
    });
});

(function() {
    const results = [];
    for (let j = 0; j <= 23; j++) { results.push(j); }
    return results;
}).apply(this).forEach(function(gray) {
    var c, l;
    c = gray + 232;
    l = toHexString(gray * 10 + 8);
    STYLES["ef" + c] = "color:#" + l + l + l;
    return STYLES["eb" + c] = "background-color:#" + l + l + l;
});

const defaults = {
    fg: '#FFF',
    bg: '#000',
    newline: false,
    escapeXML: false,
    stream: false
};

export class Convert {
    private opts: any;
    private input: any[] = [];
    private stack: any[] = [];
    private stickyStack: any[] = [];
    constructor(options?: any) {
        if (options == null) {
            options = {};
        }
        this.opts = extend({}, defaults, options);
    }

    public toHtml(input: any) {
        var buf;
        this.input = typeof input === 'string' ? [input] : input;
        buf = [];
        this.stickyStack.forEach((function(_this) {
            return function(element) {
                return _this.generateOutput(element.token, element.data, function(chunk) {
                    return buf.push(chunk);
                });
            };
        })(this));
        this.forEach(function(chunk: any) {
            return buf.push(chunk);
        });
        this.input = [];
        return buf.join('');
    }

    private forEach(callback: any) {
        var buf;
        buf = '';
        this.input.forEach((function(_this) {
            return function(chunk) {
                buf += chunk;
                return _this.tokenize(buf, function(token, data) {
                    _this.generateOutput(token, data, callback);
                    if (_this.opts.stream) {
                        return _this.updateStickyStack(token, data);
                    }
                });
            };
        })(this));
        if (this.stack.length) {
            return callback(this.resetStyles());
        }
    }

    private generateOutput(token: any, data: any, callback: any) {
        switch (token) {
            case 'text':
                return callback(this.pushText(data));
            case 'display':
                return this.handleDisplay(data, callback);
            case 'xterm256':
                return callback(this.pushStyle("ef" + data));
        }
    }

    private updateStickyStack(token: any, data: any) {
        var notCategory;
        notCategory = function(category) {
            return function(e) {
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

    private handleDisplay(code: any, callback: any) {
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
        if (code === 2) {

        }
        if ((2 < code && code < 5)) {
            callback(this.pushTag('u'));
        }
        if ((4 < code && code < 7)) {
            callback(this.pushTag('blink'));
        }
        if (code === 7) {

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
        if ((29 < code && code < 38)) {
            callback(this.pushStyle("ef" + (code - 30)));
        }
        if (code === 39) {
            callback(this.pushStyle("color:" + this.opts.fg));
        }
        if ((39 < code && code < 48)) {
            callback(this.pushStyle("eb" + (code - 40)));
        }
        if (code === 49) {
            callback(this.pushStyle("background-color:" + this.opts.bg));
        }
        if ((89 < code && code < 98)) {
            callback(this.pushStyle("ef" + (8 + (code - 90))));
        }
        if ((99 < code && code < 108)) {
            return callback(this.pushStyle("eb" + (8 + (code - 100))));
        }
    }

    private categoryForCode(code: any) {
        code = parseInt(code, 10);
        if (code === 0) {
            return 'all';
        } else if (code === 1) {
            return 'bold';
        } else if ((2 < code && code < 5)) {
            return 'underline';
        } else if ((4 < code && code < 7)) {
            return 'blink';
        } else if (code === 8) {
            return 'hide';
        } else if (code === 9) {
            return 'strike';
        } else if ((29 < code && code < 38) || code === 39 || (89 < code && code < 98)) {
            return 'foreground-color';
        } else if ((39 < code && code < 48) || code === 49 || (99 < code && code < 108)) {
            return 'background-color';
        } else {
            return null;
        }
    }

    private pushTag(tag: any, style?: any) {
        if (style == null) {
            style = '';
        }
        if (style.length && style.indexOf(':') === -1) {
            style = STYLES[style];
        }
        this.stack.push(tag);
        return ["<" + tag, (style ? " style=\"" + style + "\"" : void 0), ">"].join('');
    }

    private pushText(text) {
        if (this.opts.escapeXML) {
            return entities.encodeXML(text);
        } else {
            return text;
        }
    }

    private pushStyle(style: any) {
        return this.pushTag("span", style);
    }

    private closeTag(style: any) {
        var last;
        if (this.stack.slice(-1)[0] === style) {
            last = this.stack.pop();
        }
        if (last != null) {
            return "</" + style + ">";
        }
    }

    private resetStyles() {
        var ref, stack;
        ref = [this.stack, []], stack = ref[0], this.stack = ref[1];
        return stack.reverse().map(function(tag) {
            return "</" + tag + ">";
        }).join('');
    }

    private tokenize(text: any, callback: any) {
        var ansiHandler, ansiMatch, ansiMess, handler, i, len, length, newline, o, process, realText, remove, removeXterm256, results1, tokens;
        ansiMatch = false;
        ansiHandler = 3;
        remove = function(m) {
            return '';
        };
        removeXterm256 = function(m, g1) {
            callback('xterm256', g1);
            return '';
        };
        newline = (function(_this) {
            return function(m) {
                if (_this.opts.newline) {
                    callback('display', -1);
                } else {
                    callback('text', m);
                }
                return '';
            };
        })(this);
        ansiMess = function(m: any, g1: any) {
            var code, len, o;
            ansiMatch = true;
            if (g1.trim().length === 0) {
                g1 = '0';
            }
            g1 = g1.trimRight(';').split(';');
            for (o = 0, len = g1.length; o < len; o++) {
                code = g1[o];
                callback('display', code);
            }
            return '';
        };
        realText = function(m: any) {
            callback('text', m);
            return '';
        };
        tokens = [
            {
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
            }
        ];
        process = function(handler: any, i: any) {
            var matches;
            if (i > ansiHandler && ansiMatch) {
                return;
            } else {
                ansiMatch = false;
            }
            matches = text.match(handler.pattern);
            text = text.replace(handler.pattern, handler.sub);
            if (matches == null) {

            }
        };
        results1 = [];
        while ((length = text.length) > 0) {
            for (i = o = 0, len = tokens.length; o < len; i = ++o) {
                handler = tokens[i];
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
}
