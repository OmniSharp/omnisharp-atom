"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Convert = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require("lodash");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var entities = require("entities");
var STYLES = {
    "ef0": "color:#000",
    "ef1": "color:#A00",
    "ef2": "color:#0A0",
    "ef3": "color:#A50",
    "ef4": "color:#00A",
    "ef5": "color:#A0A",
    "ef6": "color:#0AA",
    "ef7": "color:#AAA",
    "ef8": "color:#555",
    "ef9": "color:#F55",
    "ef10": "color:#5F5",
    "ef11": "color:#FF5",
    "ef12": "color:#55F",
    "ef13": "color:#F5F",
    "ef14": "color:#5FF",
    "ef15": "color:#FFF",
    "eb0": "background-color:#000",
    "eb1": "background-color:#A00",
    "eb2": "background-color:#0A0",
    "eb3": "background-color:#A50",
    "eb4": "background-color:#00A",
    "eb5": "background-color:#A0A",
    "eb6": "background-color:#0AA",
    "eb7": "background-color:#AAA",
    "eb8": "background-color:#555",
    "eb9": "background-color:#F55",
    "eb10": "background-color:#5F5",
    "eb11": "background-color:#FF5",
    "eb12": "background-color:#55F",
    "eb13": "background-color:#F5F",
    "eb14": "background-color:#5FF",
    "eb15": "background-color:#FFF"
};
var toHexString = function toHexString(num) {
    num = num.toString(16);
    while (num.length < 2) {
        num = "0" + num;
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
            }().join("");
            STYLES["ef" + c] = "color:#" + rgb;
            return STYLES["eb" + c] = "background-color:#" + rgb;
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
    STYLES["ef" + c] = "color:#" + l + l + l;
    return STYLES["eb" + c] = "background-color:#" + l + l + l;
});
var defaults = {
    fg: "#FFF",
    bg: "#000",
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
        key: "toHtml",
        value: function toHtml(input) {
            var _this = this;

            this.input = typeof input === "string" ? [input] : input;
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
            return buf.join("");
        }
    }, {
        key: "forEach",
        value: function forEach(callback) {
            var _this2 = this;

            var buf = "";
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
        key: "generateOutput",
        value: function generateOutput(token, data, callback) {
            switch (token) {
                case "text":
                    return callback(this.pushText(data));
                case "display":
                    return this.handleDisplay(data, callback);
                case "xterm256":
                    return callback(this.pushStyle("ef" + data));
            }
        }
    }, {
        key: "updateStickyStack",
        value: function updateStickyStack(token, data) {
            var notCategory = function notCategory(category) {
                return function (e) {
                    return (category === null || e.category !== category) && category !== "all";
                };
            };
            if (token !== "text") {
                this.stickyStack = this.stickyStack.filter(notCategory(this.categoryForCode(data)));
                return this.stickyStack.push({
                    token: token,
                    data: data,
                    category: this.categoryForCode(data)
                });
            }
        }
    }, {
        key: "handleDisplay",
        value: function handleDisplay(code, callback) {
            code = parseInt(code, 10);
            if (code === -1) {
                callback("<br/>");
            }
            if (code === 0) {
                if (this.stack.length) {
                    callback(this.resetStyles());
                }
            }
            if (code === 1) {
                callback(this.pushTag("b"));
            }
            if (2 < code && code < 5) {
                callback(this.pushTag("u"));
            }
            if (4 < code && code < 7) {
                callback(this.pushTag("blink"));
            }
            if (code === 8) {
                callback(this.pushStyle("display:none"));
            }
            if (code === 9) {
                callback(this.pushTag("strike"));
            }
            if (code === 24) {
                callback(this.closeTag("u"));
            }
            if (29 < code && code < 38) {
                callback(this.pushStyle("ef" + (code - 30)));
            }
            if (code === 39) {
                callback(this.pushStyle("color:" + this.opts.fg));
            }
            if (39 < code && code < 48) {
                callback(this.pushStyle("eb" + (code - 40)));
            }
            if (code === 49) {
                callback(this.pushStyle("background-color:" + this.opts.bg));
            }
            if (89 < code && code < 98) {
                callback(this.pushStyle("ef" + (8 + (code - 90))));
            }
            if (99 < code && code < 108) {
                return callback(this.pushStyle("eb" + (8 + (code - 100))));
            }
        }
    }, {
        key: "categoryForCode",
        value: function categoryForCode(code) {
            code = parseInt(code, 10);
            if (code === 0) {
                return "all";
            } else if (code === 1) {
                return "bold";
            } else if (2 < code && code < 5) {
                return "underline";
            } else if (4 < code && code < 7) {
                return "blink";
            } else if (code === 8) {
                return "hide";
            } else if (code === 9) {
                return "strike";
            } else if (29 < code && code < 38 || code === 39 || 89 < code && code < 98) {
                return "foreground-color";
            } else if (39 < code && code < 48 || code === 49 || 99 < code && code < 108) {
                return "background-color";
            } else {
                return null;
            }
        }
    }, {
        key: "pushTag",
        value: function pushTag(tag, style) {
            if (style == null) {
                style = "";
            }
            if (style.length && style.indexOf(":") === -1) {
                style = STYLES[style];
            }
            this.stack.push(tag);
            return ["<" + tag, style ? " style=\"" + style + "\"" : void 0, ">"].join("");
        }
    }, {
        key: "pushText",
        value: function pushText(text) {
            if (this.opts.escapeXML) {
                return entities.encodeXML(text);
            } else {
                return text;
            }
        }
    }, {
        key: "pushStyle",
        value: function pushStyle(style) {
            return this.pushTag("span", style);
        }
    }, {
        key: "closeTag",
        value: function closeTag(style) {
            var last = void 0;
            if (this.stack.slice(-1)[0] === style) {
                last = this.stack.pop();
            }
            if (last != null) {
                return "</" + style + ">";
            }
        }
    }, {
        key: "resetStyles",
        value: function resetStyles() {
            var ref = [this.stack, []],
                stack = ref[0];
            this.stack = ref[1];
            return stack.reverse().map(function (tag) {
                return "</" + tag + ">";
            }).join("");
        }
    }, {
        key: "tokenize",
        value: function tokenize(text, callback) {
            var _this3 = this;

            var ansiMatch = false;
            var ansiHandler = 3;
            var remove = function remove(m) {
                return "";
            };
            var removeXterm256 = function removeXterm256(m, g1) {
                callback("xterm256", g1);
                return "";
            };
            var newline = function newline(m) {
                if (_this3.opts.newline) {
                    callback("display", -1);
                } else {
                    callback("text", m);
                }
                return "";
            };
            var ansiMess = function ansiMess(m, g1) {
                ansiMatch = true;
                var code = void 0;
                if (g1.trim().length === 0) {
                    g1 = "0";
                }
                g1 = g1.trimRight(";").split(";");
                for (var o = 0, len = g1.length; o < len; o++) {
                    code = g1[o];
                    callback("display", code);
                }
                return "";
            };
            var realText = function realText(m) {
                callback("text", m);
                return "";
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9zZXJ2aWNlcy9hbnNpLXRvLWh0bWwuanMiLCJsaWIvc2VydmljZXMvYW5zaS10by1odG1sLnRzIl0sIm5hbWVzIjpbImVudGl0aWVzIiwicmVxdWlyZSIsIlNUWUxFUyIsInRvSGV4U3RyaW5nIiwibnVtIiwidG9TdHJpbmciLCJsZW5ndGgiLCJmb3JFYWNoIiwicmVkIiwiZ3JlZW4iLCJibHVlIiwiYyIsInIiLCJnIiwiYiIsInJnYiIsInJlZiIsInJlc3VsdHMiLCJqIiwibGVuIiwibiIsInB1c2giLCJqb2luIiwiYXBwbHkiLCJncmF5IiwibCIsImRlZmF1bHRzIiwiZmciLCJiZyIsIm5ld2xpbmUiLCJlc2NhcGVYTUwiLCJzdHJlYW0iLCJDb252ZXJ0Iiwib3B0aW9ucyIsImlucHV0Iiwic3RhY2siLCJzdGlja3lTdGFjayIsIm9wdHMiLCJidWYiLCJlbGVtZW50IiwiZ2VuZXJhdGVPdXRwdXQiLCJ0b2tlbiIsImRhdGEiLCJjaHVuayIsImNhbGxiYWNrIiwidG9rZW5pemUiLCJ1cGRhdGVTdGlja3lTdGFjayIsInJlc2V0U3R5bGVzIiwicHVzaFRleHQiLCJoYW5kbGVEaXNwbGF5IiwicHVzaFN0eWxlIiwibm90Q2F0ZWdvcnkiLCJjYXRlZ29yeSIsImUiLCJmaWx0ZXIiLCJjYXRlZ29yeUZvckNvZGUiLCJjb2RlIiwicGFyc2VJbnQiLCJwdXNoVGFnIiwiY2xvc2VUYWciLCJ0YWciLCJzdHlsZSIsImluZGV4T2YiLCJ0ZXh0IiwiZW5jb2RlWE1MIiwibGFzdCIsInNsaWNlIiwicG9wIiwicmV2ZXJzZSIsIm1hcCIsImFuc2lNYXRjaCIsImFuc2lIYW5kbGVyIiwicmVtb3ZlIiwibSIsInJlbW92ZVh0ZXJtMjU2IiwiZzEiLCJhbnNpTWVzcyIsInRyaW0iLCJ0cmltUmlnaHQiLCJzcGxpdCIsIm8iLCJyZWFsVGV4dCIsInRva2VucyIsInBhdHRlcm4iLCJzdWIiLCJwcm9jZXNzIiwiaGFuZGxlciIsImkiLCJyZXBsYWNlIiwicmVzdWx0czEi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YUFQRDtBQVFBLGdCQUFNSyxXQUFrQixFQUF4QjtBQUNBLG1CQUFPLENBQUNuRixTQUFTeUQsS0FBS3pELE1BQWYsSUFBeUIsQ0FBaEMsRUFBbUM7QUFDL0IscUJBQUssSUFBSWlGLElBQUksQ0FBUixFQUFXUCxJQUFJLENBQWYsRUFBa0I3RCxNQUFNK0QsT0FBTzVFLE1BQXBDLEVBQTRDMEUsSUFBSTdELEdBQWhELEVBQXFEb0UsSUFBSSxFQUFFUCxDQUEzRCxFQUE4RDtBQUMxRCx3QkFBTU0sVUFBVUosT0FBT0ssQ0FBUCxDQUFoQjtBQUNBRiw0QkFBUUMsT0FBUixFQUFpQkMsQ0FBakI7QUFDSDtBQUNELG9CQUFJeEIsS0FBS3pELE1BQUwsS0FBZ0JBLE1BQXBCLEVBQTRCO0FBQ3hCO0FBQ0gsaUJBRkQsTUFFTztBQUNIbUYsNkJBQVNwRSxJQUFULENBQWMsS0FBSyxDQUFuQjtBQUNIO0FBQ0o7QUFDRCxtQkFBT29FLFFBQVA7QUFDSCIsImZpbGUiOiJsaWIvc2VydmljZXMvYW5zaS10by1odG1sLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZXh0ZW5kIH0gZnJvbSBcImxvZGFzaFwiO1xuY29uc3QgZW50aXRpZXMgPSByZXF1aXJlKFwiZW50aXRpZXNcIik7XG5jb25zdCBTVFlMRVMgPSB7XG4gICAgXCJlZjBcIjogXCJjb2xvcjojMDAwXCIsXG4gICAgXCJlZjFcIjogXCJjb2xvcjojQTAwXCIsXG4gICAgXCJlZjJcIjogXCJjb2xvcjojMEEwXCIsXG4gICAgXCJlZjNcIjogXCJjb2xvcjojQTUwXCIsXG4gICAgXCJlZjRcIjogXCJjb2xvcjojMDBBXCIsXG4gICAgXCJlZjVcIjogXCJjb2xvcjojQTBBXCIsXG4gICAgXCJlZjZcIjogXCJjb2xvcjojMEFBXCIsXG4gICAgXCJlZjdcIjogXCJjb2xvcjojQUFBXCIsXG4gICAgXCJlZjhcIjogXCJjb2xvcjojNTU1XCIsXG4gICAgXCJlZjlcIjogXCJjb2xvcjojRjU1XCIsXG4gICAgXCJlZjEwXCI6IFwiY29sb3I6IzVGNVwiLFxuICAgIFwiZWYxMVwiOiBcImNvbG9yOiNGRjVcIixcbiAgICBcImVmMTJcIjogXCJjb2xvcjojNTVGXCIsXG4gICAgXCJlZjEzXCI6IFwiY29sb3I6I0Y1RlwiLFxuICAgIFwiZWYxNFwiOiBcImNvbG9yOiM1RkZcIixcbiAgICBcImVmMTVcIjogXCJjb2xvcjojRkZGXCIsXG4gICAgXCJlYjBcIjogXCJiYWNrZ3JvdW5kLWNvbG9yOiMwMDBcIixcbiAgICBcImViMVwiOiBcImJhY2tncm91bmQtY29sb3I6I0EwMFwiLFxuICAgIFwiZWIyXCI6IFwiYmFja2dyb3VuZC1jb2xvcjojMEEwXCIsXG4gICAgXCJlYjNcIjogXCJiYWNrZ3JvdW5kLWNvbG9yOiNBNTBcIixcbiAgICBcImViNFwiOiBcImJhY2tncm91bmQtY29sb3I6IzAwQVwiLFxuICAgIFwiZWI1XCI6IFwiYmFja2dyb3VuZC1jb2xvcjojQTBBXCIsXG4gICAgXCJlYjZcIjogXCJiYWNrZ3JvdW5kLWNvbG9yOiMwQUFcIixcbiAgICBcImViN1wiOiBcImJhY2tncm91bmQtY29sb3I6I0FBQVwiLFxuICAgIFwiZWI4XCI6IFwiYmFja2dyb3VuZC1jb2xvcjojNTU1XCIsXG4gICAgXCJlYjlcIjogXCJiYWNrZ3JvdW5kLWNvbG9yOiNGNTVcIixcbiAgICBcImViMTBcIjogXCJiYWNrZ3JvdW5kLWNvbG9yOiM1RjVcIixcbiAgICBcImViMTFcIjogXCJiYWNrZ3JvdW5kLWNvbG9yOiNGRjVcIixcbiAgICBcImViMTJcIjogXCJiYWNrZ3JvdW5kLWNvbG9yOiM1NUZcIixcbiAgICBcImViMTNcIjogXCJiYWNrZ3JvdW5kLWNvbG9yOiNGNUZcIixcbiAgICBcImViMTRcIjogXCJiYWNrZ3JvdW5kLWNvbG9yOiM1RkZcIixcbiAgICBcImViMTVcIjogXCJiYWNrZ3JvdW5kLWNvbG9yOiNGRkZcIlxufTtcbmNvbnN0IHRvSGV4U3RyaW5nID0gZnVuY3Rpb24gKG51bSkge1xuICAgIG51bSA9IG51bS50b1N0cmluZygxNik7XG4gICAgd2hpbGUgKG51bS5sZW5ndGggPCAyKSB7XG4gICAgICAgIG51bSA9IFwiMFwiICsgbnVtO1xuICAgIH1cbiAgICByZXR1cm4gbnVtO1xufTtcblswLCAxLCAyLCAzLCA0LCA1XS5mb3JFYWNoKGZ1bmN0aW9uIChyZWQpIHtcbiAgICByZXR1cm4gWzAsIDEsIDIsIDMsIDQsIDVdLmZvckVhY2goZnVuY3Rpb24gKGdyZWVuKSB7XG4gICAgICAgIHJldHVybiBbMCwgMSwgMiwgMywgNCwgNV0uZm9yRWFjaChmdW5jdGlvbiAoYmx1ZSkge1xuICAgICAgICAgICAgY29uc3QgYyA9IDE2ICsgKHJlZCAqIDM2KSArIChncmVlbiAqIDYpICsgYmx1ZTtcbiAgICAgICAgICAgIGNvbnN0IHIgPSByZWQgPiAwID8gcmVkICogNDAgKyA1NSA6IDA7XG4gICAgICAgICAgICBjb25zdCBnID0gZ3JlZW4gPiAwID8gZ3JlZW4gKiA0MCArIDU1IDogMDtcbiAgICAgICAgICAgIGNvbnN0IGIgPSBibHVlID4gMCA/IGJsdWUgKiA0MCArIDU1IDogMDtcbiAgICAgICAgICAgIGNvbnN0IHJnYiA9ICgoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlZiA9IFtyLCBnLCBiXTtcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHRzID0gW107XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaiA9IDAsIGxlbiA9IHJlZi5sZW5ndGg7IGogPCBsZW47IGorKykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBuID0gcmVmW2pdO1xuICAgICAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2godG9IZXhTdHJpbmcobikpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0cztcbiAgICAgICAgICAgIH0pKCkpLmpvaW4oXCJcIik7XG4gICAgICAgICAgICBTVFlMRVNbXCJlZlwiICsgY10gPSBcImNvbG9yOiNcIiArIHJnYjtcbiAgICAgICAgICAgIHJldHVybiBTVFlMRVNbXCJlYlwiICsgY10gPSBcImJhY2tncm91bmQtY29sb3I6I1wiICsgcmdiO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn0pO1xuKGZ1bmN0aW9uICgpIHtcbiAgICBjb25zdCByZXN1bHRzID0gW107XG4gICAgZm9yIChsZXQgaiA9IDA7IGogPD0gMjM7IGorKykge1xuICAgICAgICByZXN1bHRzLnB1c2goaik7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHRzO1xufSkuYXBwbHkodGhpcykuZm9yRWFjaChmdW5jdGlvbiAoZ3JheSkge1xuICAgIGNvbnN0IGMgPSBncmF5ICsgMjMyO1xuICAgIGNvbnN0IGwgPSB0b0hleFN0cmluZyhncmF5ICogMTAgKyA4KTtcbiAgICBTVFlMRVNbXCJlZlwiICsgY10gPSBcImNvbG9yOiNcIiArIGwgKyBsICsgbDtcbiAgICByZXR1cm4gU1RZTEVTW1wiZWJcIiArIGNdID0gXCJiYWNrZ3JvdW5kLWNvbG9yOiNcIiArIGwgKyBsICsgbDtcbn0pO1xuY29uc3QgZGVmYXVsdHMgPSB7XG4gICAgZmc6IFwiI0ZGRlwiLFxuICAgIGJnOiBcIiMwMDBcIixcbiAgICBuZXdsaW5lOiBmYWxzZSxcbiAgICBlc2NhcGVYTUw6IGZhbHNlLFxuICAgIHN0cmVhbTogZmFsc2Vcbn07XG5leHBvcnQgY2xhc3MgQ29udmVydCB7XG4gICAgY29uc3RydWN0b3Iob3B0aW9ucykge1xuICAgICAgICB0aGlzLmlucHV0ID0gW107XG4gICAgICAgIHRoaXMuc3RhY2sgPSBbXTtcbiAgICAgICAgdGhpcy5zdGlja3lTdGFjayA9IFtdO1xuICAgICAgICBpZiAob3B0aW9ucyA9PSBudWxsKSB7XG4gICAgICAgICAgICBvcHRpb25zID0ge307XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5vcHRzID0gZXh0ZW5kKHt9LCBkZWZhdWx0cywgb3B0aW9ucyk7XG4gICAgfVxuICAgIHRvSHRtbChpbnB1dCkge1xuICAgICAgICB0aGlzLmlucHV0ID0gdHlwZW9mIGlucHV0ID09PSBcInN0cmluZ1wiID8gW2lucHV0XSA6IGlucHV0O1xuICAgICAgICBjb25zdCBidWYgPSBbXTtcbiAgICAgICAgdGhpcy5zdGlja3lTdGFjay5mb3JFYWNoKChlbGVtZW50KSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5nZW5lcmF0ZU91dHB1dChlbGVtZW50LnRva2VuLCBlbGVtZW50LmRhdGEsIGZ1bmN0aW9uIChjaHVuaykge1xuICAgICAgICAgICAgICAgIHJldHVybiBidWYucHVzaChjaHVuayk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuZm9yRWFjaChmdW5jdGlvbiAoY2h1bmspIHtcbiAgICAgICAgICAgIHJldHVybiBidWYucHVzaChjaHVuayk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmlucHV0ID0gW107XG4gICAgICAgIHJldHVybiBidWYuam9pbihcIlwiKTtcbiAgICB9XG4gICAgZm9yRWFjaChjYWxsYmFjaykge1xuICAgICAgICBsZXQgYnVmID0gXCJcIjtcbiAgICAgICAgdGhpcy5pbnB1dC5mb3JFYWNoKChjaHVuaykgPT4ge1xuICAgICAgICAgICAgYnVmICs9IGNodW5rO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMudG9rZW5pemUoYnVmLCAodG9rZW4sIGRhdGEpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmdlbmVyYXRlT3V0cHV0KHRva2VuLCBkYXRhLCBjYWxsYmFjayk7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMub3B0cy5zdHJlYW0pIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMudXBkYXRlU3RpY2t5U3RhY2sodG9rZW4sIGRhdGEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgICAgaWYgKHRoaXMuc3RhY2subGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2sodGhpcy5yZXNldFN0eWxlcygpKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBnZW5lcmF0ZU91dHB1dCh0b2tlbiwgZGF0YSwgY2FsbGJhY2spIHtcbiAgICAgICAgc3dpdGNoICh0b2tlbikge1xuICAgICAgICAgICAgY2FzZSBcInRleHRcIjpcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2sodGhpcy5wdXNoVGV4dChkYXRhKSk7XG4gICAgICAgICAgICBjYXNlIFwiZGlzcGxheVwiOlxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmhhbmRsZURpc3BsYXkoZGF0YSwgY2FsbGJhY2spO1xuICAgICAgICAgICAgY2FzZSBcInh0ZXJtMjU2XCI6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKHRoaXMucHVzaFN0eWxlKFwiZWZcIiArIGRhdGEpKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICB1cGRhdGVTdGlja3lTdGFjayh0b2tlbiwgZGF0YSkge1xuICAgICAgICBjb25zdCBub3RDYXRlZ29yeSA9IGZ1bmN0aW9uIChjYXRlZ29yeSkge1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIChjYXRlZ29yeSA9PT0gbnVsbCB8fCBlLmNhdGVnb3J5ICE9PSBjYXRlZ29yeSkgJiYgY2F0ZWdvcnkgIT09IFwiYWxsXCI7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9O1xuICAgICAgICBpZiAodG9rZW4gIT09IFwidGV4dFwiKSB7XG4gICAgICAgICAgICB0aGlzLnN0aWNreVN0YWNrID0gdGhpcy5zdGlja3lTdGFjay5maWx0ZXIobm90Q2F0ZWdvcnkodGhpcy5jYXRlZ29yeUZvckNvZGUoZGF0YSkpKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnN0aWNreVN0YWNrLnB1c2goe1xuICAgICAgICAgICAgICAgIHRva2VuOiB0b2tlbixcbiAgICAgICAgICAgICAgICBkYXRhOiBkYXRhLFxuICAgICAgICAgICAgICAgIGNhdGVnb3J5OiB0aGlzLmNhdGVnb3J5Rm9yQ29kZShkYXRhKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaGFuZGxlRGlzcGxheShjb2RlLCBjYWxsYmFjaykge1xuICAgICAgICBjb2RlID0gcGFyc2VJbnQoY29kZSwgMTApO1xuICAgICAgICBpZiAoY29kZSA9PT0gLTEpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKFwiPGJyLz5cIik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNvZGUgPT09IDApIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnN0YWNrLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKHRoaXMucmVzZXRTdHlsZXMoKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNvZGUgPT09IDEpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKHRoaXMucHVzaFRhZyhcImJcIikpO1xuICAgICAgICB9XG4gICAgICAgIGlmICgoMiA8IGNvZGUgJiYgY29kZSA8IDUpKSB7XG4gICAgICAgICAgICBjYWxsYmFjayh0aGlzLnB1c2hUYWcoXCJ1XCIpKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoKDQgPCBjb2RlICYmIGNvZGUgPCA3KSkge1xuICAgICAgICAgICAgY2FsbGJhY2sodGhpcy5wdXNoVGFnKFwiYmxpbmtcIikpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjb2RlID09PSA4KSB7XG4gICAgICAgICAgICBjYWxsYmFjayh0aGlzLnB1c2hTdHlsZShcImRpc3BsYXk6bm9uZVwiKSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNvZGUgPT09IDkpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKHRoaXMucHVzaFRhZyhcInN0cmlrZVwiKSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNvZGUgPT09IDI0KSB7XG4gICAgICAgICAgICBjYWxsYmFjayh0aGlzLmNsb3NlVGFnKFwidVwiKSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCgyOSA8IGNvZGUgJiYgY29kZSA8IDM4KSkge1xuICAgICAgICAgICAgY2FsbGJhY2sodGhpcy5wdXNoU3R5bGUoXCJlZlwiICsgKGNvZGUgLSAzMCkpKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY29kZSA9PT0gMzkpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKHRoaXMucHVzaFN0eWxlKFwiY29sb3I6XCIgKyB0aGlzLm9wdHMuZmcpKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoKDM5IDwgY29kZSAmJiBjb2RlIDwgNDgpKSB7XG4gICAgICAgICAgICBjYWxsYmFjayh0aGlzLnB1c2hTdHlsZShcImViXCIgKyAoY29kZSAtIDQwKSkpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjb2RlID09PSA0OSkge1xuICAgICAgICAgICAgY2FsbGJhY2sodGhpcy5wdXNoU3R5bGUoXCJiYWNrZ3JvdW5kLWNvbG9yOlwiICsgdGhpcy5vcHRzLmJnKSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCg4OSA8IGNvZGUgJiYgY29kZSA8IDk4KSkge1xuICAgICAgICAgICAgY2FsbGJhY2sodGhpcy5wdXNoU3R5bGUoXCJlZlwiICsgKDggKyAoY29kZSAtIDkwKSkpKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoKDk5IDwgY29kZSAmJiBjb2RlIDwgMTA4KSkge1xuICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKHRoaXMucHVzaFN0eWxlKFwiZWJcIiArICg4ICsgKGNvZGUgLSAxMDApKSkpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGNhdGVnb3J5Rm9yQ29kZShjb2RlKSB7XG4gICAgICAgIGNvZGUgPSBwYXJzZUludChjb2RlLCAxMCk7XG4gICAgICAgIGlmIChjb2RlID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gXCJhbGxcIjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChjb2RlID09PSAxKSB7XG4gICAgICAgICAgICByZXR1cm4gXCJib2xkXCI7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoKDIgPCBjb2RlICYmIGNvZGUgPCA1KSkge1xuICAgICAgICAgICAgcmV0dXJuIFwidW5kZXJsaW5lXCI7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoKDQgPCBjb2RlICYmIGNvZGUgPCA3KSkge1xuICAgICAgICAgICAgcmV0dXJuIFwiYmxpbmtcIjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChjb2RlID09PSA4KSB7XG4gICAgICAgICAgICByZXR1cm4gXCJoaWRlXCI7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoY29kZSA9PT0gOSkge1xuICAgICAgICAgICAgcmV0dXJuIFwic3RyaWtlXCI7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoKDI5IDwgY29kZSAmJiBjb2RlIDwgMzgpIHx8IGNvZGUgPT09IDM5IHx8ICg4OSA8IGNvZGUgJiYgY29kZSA8IDk4KSkge1xuICAgICAgICAgICAgcmV0dXJuIFwiZm9yZWdyb3VuZC1jb2xvclwiO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKCgzOSA8IGNvZGUgJiYgY29kZSA8IDQ4KSB8fCBjb2RlID09PSA0OSB8fCAoOTkgPCBjb2RlICYmIGNvZGUgPCAxMDgpKSB7XG4gICAgICAgICAgICByZXR1cm4gXCJiYWNrZ3JvdW5kLWNvbG9yXCI7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgIH1cbiAgICBwdXNoVGFnKHRhZywgc3R5bGUpIHtcbiAgICAgICAgaWYgKHN0eWxlID09IG51bGwpIHtcbiAgICAgICAgICAgIHN0eWxlID0gXCJcIjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc3R5bGUubGVuZ3RoICYmIHN0eWxlLmluZGV4T2YoXCI6XCIpID09PSAtMSkge1xuICAgICAgICAgICAgc3R5bGUgPSBTVFlMRVNbc3R5bGVdO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuc3RhY2sucHVzaCh0YWcpO1xuICAgICAgICByZXR1cm4gW1wiPFwiICsgdGFnLCAoc3R5bGUgPyBcIiBzdHlsZT1cXFwiXCIgKyBzdHlsZSArIFwiXFxcIlwiIDogdm9pZCAwKSwgXCI+XCJdLmpvaW4oXCJcIik7XG4gICAgfVxuICAgIHB1c2hUZXh0KHRleHQpIHtcbiAgICAgICAgaWYgKHRoaXMub3B0cy5lc2NhcGVYTUwpIHtcbiAgICAgICAgICAgIHJldHVybiBlbnRpdGllcy5lbmNvZGVYTUwodGV4dCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdGV4dDtcbiAgICAgICAgfVxuICAgIH1cbiAgICBwdXNoU3R5bGUoc3R5bGUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucHVzaFRhZyhcInNwYW5cIiwgc3R5bGUpO1xuICAgIH1cbiAgICBjbG9zZVRhZyhzdHlsZSkge1xuICAgICAgICBsZXQgbGFzdDtcbiAgICAgICAgaWYgKHRoaXMuc3RhY2suc2xpY2UoLTEpWzBdID09PSBzdHlsZSkge1xuICAgICAgICAgICAgbGFzdCA9IHRoaXMuc3RhY2sucG9wKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGxhc3QgIT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIFwiPC9cIiArIHN0eWxlICsgXCI+XCI7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmVzZXRTdHlsZXMoKSB7XG4gICAgICAgIGNvbnN0IHJlZiA9IFt0aGlzLnN0YWNrLCBbXV0sIHN0YWNrID0gcmVmWzBdO1xuICAgICAgICB0aGlzLnN0YWNrID0gcmVmWzFdO1xuICAgICAgICByZXR1cm4gc3RhY2sucmV2ZXJzZSgpLm1hcChmdW5jdGlvbiAodGFnKSB7XG4gICAgICAgICAgICByZXR1cm4gXCI8L1wiICsgdGFnICsgXCI+XCI7XG4gICAgICAgIH0pLmpvaW4oXCJcIik7XG4gICAgfVxuICAgIHRva2VuaXplKHRleHQsIGNhbGxiYWNrKSB7XG4gICAgICAgIGxldCBhbnNpTWF0Y2ggPSBmYWxzZTtcbiAgICAgICAgY29uc3QgYW5zaUhhbmRsZXIgPSAzO1xuICAgICAgICBjb25zdCByZW1vdmUgPSBmdW5jdGlvbiAobSkge1xuICAgICAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IHJlbW92ZVh0ZXJtMjU2ID0gZnVuY3Rpb24gKG0sIGcxKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhcInh0ZXJtMjU2XCIsIGcxKTtcbiAgICAgICAgICAgIHJldHVybiBcIlwiO1xuICAgICAgICB9O1xuICAgICAgICBjb25zdCBuZXdsaW5lID0gKG0pID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLm9wdHMubmV3bGluZSkge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKFwiZGlzcGxheVwiLCAtMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhcInRleHRcIiwgbSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gXCJcIjtcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgYW5zaU1lc3MgPSBmdW5jdGlvbiAobSwgZzEpIHtcbiAgICAgICAgICAgIGFuc2lNYXRjaCA9IHRydWU7XG4gICAgICAgICAgICBsZXQgY29kZTtcbiAgICAgICAgICAgIGlmIChnMS50cmltKCkubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgZzEgPSBcIjBcIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGcxID0gZzEudHJpbVJpZ2h0KFwiO1wiKS5zcGxpdChcIjtcIik7XG4gICAgICAgICAgICBmb3IgKGxldCBvID0gMCwgbGVuID0gZzEubGVuZ3RoOyBvIDwgbGVuOyBvKyspIHtcbiAgICAgICAgICAgICAgICBjb2RlID0gZzFbb107XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soXCJkaXNwbGF5XCIsIGNvZGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IHJlYWxUZXh0ID0gZnVuY3Rpb24gKG0pIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKFwidGV4dFwiLCBtKTtcbiAgICAgICAgICAgIHJldHVybiBcIlwiO1xuICAgICAgICB9O1xuICAgICAgICBjb25zdCB0b2tlbnMgPSBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcGF0dGVybjogL15cXHgwOCsvLFxuICAgICAgICAgICAgICAgIHN1YjogcmVtb3ZlXG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgcGF0dGVybjogL15cXHgxYlxcW1swMTJdP0svLFxuICAgICAgICAgICAgICAgIHN1YjogcmVtb3ZlXG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgcGF0dGVybjogL15cXHgxYlxcWzM4OzU7KFxcZCspbS8sXG4gICAgICAgICAgICAgICAgc3ViOiByZW1vdmVYdGVybTI1NlxuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIHBhdHRlcm46IC9eXFxuKy8sXG4gICAgICAgICAgICAgICAgc3ViOiBuZXdsaW5lXG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgcGF0dGVybjogL15cXHgxYlxcWygoPzpcXGR7MSwzfTs/KSt8KW0vLFxuICAgICAgICAgICAgICAgIHN1YjogYW5zaU1lc3NcbiAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICBwYXR0ZXJuOiAvXlxceDFiXFxbP1tcXGQ7XXswLDN9LyxcbiAgICAgICAgICAgICAgICBzdWI6IHJlbW92ZVxuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIHBhdHRlcm46IC9eKFteXFx4MWJcXHgwOFxcbl0rKS8sXG4gICAgICAgICAgICAgICAgc3ViOiByZWFsVGV4dFxuICAgICAgICAgICAgfVxuICAgICAgICBdO1xuICAgICAgICBjb25zdCBwcm9jZXNzID0gZnVuY3Rpb24gKGhhbmRsZXIsIGkpIHtcbiAgICAgICAgICAgIGlmIChpID4gYW5zaUhhbmRsZXIgJiYgYW5zaU1hdGNoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgYW5zaU1hdGNoID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0ZXh0ID0gdGV4dC5yZXBsYWNlKGhhbmRsZXIucGF0dGVybiwgaGFuZGxlci5zdWIpO1xuICAgICAgICB9O1xuICAgICAgICBjb25zdCByZXN1bHRzMSA9IFtdO1xuICAgICAgICB3aGlsZSAoKGxlbmd0aCA9IHRleHQubGVuZ3RoKSA+IDApIHtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwLCBvID0gMCwgbGVuID0gdG9rZW5zLmxlbmd0aDsgbyA8IGxlbjsgaSA9ICsrbykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGhhbmRsZXIgPSB0b2tlbnNbaV07XG4gICAgICAgICAgICAgICAgcHJvY2VzcyhoYW5kbGVyLCBpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0ZXh0Lmxlbmd0aCA9PT0gbGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXN1bHRzMS5wdXNoKHZvaWQgMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdHMxO1xuICAgIH1cbn1cbiIsImltcG9ydCB7ZXh0ZW5kfSBmcm9tIFwibG9kYXNoXCI7XHJcbmNvbnN0IGVudGl0aWVzID0gcmVxdWlyZShcImVudGl0aWVzXCIpO1xyXG5cclxuY29uc3QgU1RZTEVTID0ge1xyXG4gICAgXCJlZjBcIjogXCJjb2xvcjojMDAwXCIsXHJcbiAgICBcImVmMVwiOiBcImNvbG9yOiNBMDBcIixcclxuICAgIFwiZWYyXCI6IFwiY29sb3I6IzBBMFwiLFxyXG4gICAgXCJlZjNcIjogXCJjb2xvcjojQTUwXCIsXHJcbiAgICBcImVmNFwiOiBcImNvbG9yOiMwMEFcIixcclxuICAgIFwiZWY1XCI6IFwiY29sb3I6I0EwQVwiLFxyXG4gICAgXCJlZjZcIjogXCJjb2xvcjojMEFBXCIsXHJcbiAgICBcImVmN1wiOiBcImNvbG9yOiNBQUFcIixcclxuICAgIFwiZWY4XCI6IFwiY29sb3I6IzU1NVwiLFxyXG4gICAgXCJlZjlcIjogXCJjb2xvcjojRjU1XCIsXHJcbiAgICBcImVmMTBcIjogXCJjb2xvcjojNUY1XCIsXHJcbiAgICBcImVmMTFcIjogXCJjb2xvcjojRkY1XCIsXHJcbiAgICBcImVmMTJcIjogXCJjb2xvcjojNTVGXCIsXHJcbiAgICBcImVmMTNcIjogXCJjb2xvcjojRjVGXCIsXHJcbiAgICBcImVmMTRcIjogXCJjb2xvcjojNUZGXCIsXHJcbiAgICBcImVmMTVcIjogXCJjb2xvcjojRkZGXCIsXHJcbiAgICBcImViMFwiOiBcImJhY2tncm91bmQtY29sb3I6IzAwMFwiLFxyXG4gICAgXCJlYjFcIjogXCJiYWNrZ3JvdW5kLWNvbG9yOiNBMDBcIixcclxuICAgIFwiZWIyXCI6IFwiYmFja2dyb3VuZC1jb2xvcjojMEEwXCIsXHJcbiAgICBcImViM1wiOiBcImJhY2tncm91bmQtY29sb3I6I0E1MFwiLFxyXG4gICAgXCJlYjRcIjogXCJiYWNrZ3JvdW5kLWNvbG9yOiMwMEFcIixcclxuICAgIFwiZWI1XCI6IFwiYmFja2dyb3VuZC1jb2xvcjojQTBBXCIsXHJcbiAgICBcImViNlwiOiBcImJhY2tncm91bmQtY29sb3I6IzBBQVwiLFxyXG4gICAgXCJlYjdcIjogXCJiYWNrZ3JvdW5kLWNvbG9yOiNBQUFcIixcclxuICAgIFwiZWI4XCI6IFwiYmFja2dyb3VuZC1jb2xvcjojNTU1XCIsXHJcbiAgICBcImViOVwiOiBcImJhY2tncm91bmQtY29sb3I6I0Y1NVwiLFxyXG4gICAgXCJlYjEwXCI6IFwiYmFja2dyb3VuZC1jb2xvcjojNUY1XCIsXHJcbiAgICBcImViMTFcIjogXCJiYWNrZ3JvdW5kLWNvbG9yOiNGRjVcIixcclxuICAgIFwiZWIxMlwiOiBcImJhY2tncm91bmQtY29sb3I6IzU1RlwiLFxyXG4gICAgXCJlYjEzXCI6IFwiYmFja2dyb3VuZC1jb2xvcjojRjVGXCIsXHJcbiAgICBcImViMTRcIjogXCJiYWNrZ3JvdW5kLWNvbG9yOiM1RkZcIixcclxuICAgIFwiZWIxNVwiOiBcImJhY2tncm91bmQtY29sb3I6I0ZGRlwiXHJcbn07XHJcblxyXG5jb25zdCB0b0hleFN0cmluZyA9IGZ1bmN0aW9uKG51bTogYW55KSB7XHJcbiAgICBudW0gPSBudW0udG9TdHJpbmcoMTYpO1xyXG4gICAgd2hpbGUgKG51bS5sZW5ndGggPCAyKSB7XHJcbiAgICAgICAgbnVtID0gXCIwXCIgKyBudW07XHJcbiAgICB9XHJcbiAgICByZXR1cm4gbnVtO1xyXG59O1xyXG5cclxuWzAsIDEsIDIsIDMsIDQsIDVdLmZvckVhY2goZnVuY3Rpb24ocmVkKSB7XHJcbiAgICByZXR1cm4gWzAsIDEsIDIsIDMsIDQsIDVdLmZvckVhY2goZnVuY3Rpb24oZ3JlZW4pIHtcclxuICAgICAgICByZXR1cm4gWzAsIDEsIDIsIDMsIDQsIDVdLmZvckVhY2goZnVuY3Rpb24oYmx1ZSkge1xyXG4gICAgICAgICAgICBjb25zdCBjID0gMTYgKyAocmVkICogMzYpICsgKGdyZWVuICogNikgKyBibHVlO1xyXG4gICAgICAgICAgICBjb25zdCByID0gcmVkID4gMCA/IHJlZCAqIDQwICsgNTUgOiAwO1xyXG4gICAgICAgICAgICBjb25zdCBnID0gZ3JlZW4gPiAwID8gZ3JlZW4gKiA0MCArIDU1IDogMDtcclxuICAgICAgICAgICAgY29uc3QgYiA9IGJsdWUgPiAwID8gYmx1ZSAqIDQwICsgNTUgOiAwO1xyXG4gICAgICAgICAgICBjb25zdCByZ2IgPSAoKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcmVmID0gW3IsIGcsIGJdO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0czogYW55W10gPSBbXTtcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGogPSAwLCBsZW4gPSByZWYubGVuZ3RoOyBqIDwgbGVuOyBqKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBuID0gcmVmW2pdO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaCh0b0hleFN0cmluZyhuKSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0cztcclxuICAgICAgICAgICAgfSkoKSkuam9pbihcIlwiKTtcclxuICAgICAgICAgICAgU1RZTEVTW1wiZWZcIiArIGNdID0gXCJjb2xvcjojXCIgKyByZ2I7XHJcbiAgICAgICAgICAgIHJldHVybiBTVFlMRVNbXCJlYlwiICsgY10gPSBcImJhY2tncm91bmQtY29sb3I6I1wiICsgcmdiO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSk7XHJcbn0pO1xyXG5cclxuKGZ1bmN0aW9uKCkge1xyXG4gICAgY29uc3QgcmVzdWx0czogYW55W10gPSBbXTtcclxuICAgIGZvciAobGV0IGogPSAwOyBqIDw9IDIzOyBqKyspIHsgcmVzdWx0cy5wdXNoKGopOyB9XHJcbiAgICByZXR1cm4gcmVzdWx0cztcclxufSkuYXBwbHkodGhpcykuZm9yRWFjaChmdW5jdGlvbihncmF5OiBhbnkpIHtcclxuICAgIGNvbnN0IGMgPSBncmF5ICsgMjMyO1xyXG4gICAgY29uc3QgbCA9IHRvSGV4U3RyaW5nKGdyYXkgKiAxMCArIDgpO1xyXG4gICAgU1RZTEVTW1wiZWZcIiArIGNdID0gXCJjb2xvcjojXCIgKyBsICsgbCArIGw7XHJcbiAgICByZXR1cm4gU1RZTEVTW1wiZWJcIiArIGNdID0gXCJiYWNrZ3JvdW5kLWNvbG9yOiNcIiArIGwgKyBsICsgbDtcclxufSk7XHJcblxyXG5jb25zdCBkZWZhdWx0cyA9IHtcclxuICAgIGZnOiBcIiNGRkZcIixcclxuICAgIGJnOiBcIiMwMDBcIixcclxuICAgIG5ld2xpbmU6IGZhbHNlLFxyXG4gICAgZXNjYXBlWE1MOiBmYWxzZSxcclxuICAgIHN0cmVhbTogZmFsc2VcclxufTtcclxuXHJcbmV4cG9ydCBjbGFzcyBDb252ZXJ0IHtcclxuICAgIHByaXZhdGUgb3B0czogYW55O1xyXG4gICAgcHJpdmF0ZSBpbnB1dDogYW55W10gPSBbXTtcclxuICAgIHByaXZhdGUgc3RhY2s6IGFueVtdID0gW107XHJcbiAgICBwcml2YXRlIHN0aWNreVN0YWNrOiBhbnlbXSA9IFtdO1xyXG4gICAgY29uc3RydWN0b3Iob3B0aW9ucz86IGFueSkge1xyXG4gICAgICAgIGlmIChvcHRpb25zID09IG51bGwpIHtcclxuICAgICAgICAgICAgb3B0aW9ucyA9IHt9O1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLm9wdHMgPSBleHRlbmQoe30sIGRlZmF1bHRzLCBvcHRpb25zKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgdG9IdG1sKGlucHV0OiBhbnkpIHtcclxuICAgICAgICB0aGlzLmlucHV0ID0gdHlwZW9mIGlucHV0ID09PSBcInN0cmluZ1wiID8gW2lucHV0XSA6IGlucHV0O1xyXG4gICAgICAgIGNvbnN0IGJ1ZjogYW55W10gPSBbXTtcclxuICAgICAgICB0aGlzLnN0aWNreVN0YWNrLmZvckVhY2goKGVsZW1lbnQpID0+IHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2VuZXJhdGVPdXRwdXQoZWxlbWVudC50b2tlbiwgZWxlbWVudC5kYXRhLCBmdW5jdGlvbihjaHVuazogYW55KSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYnVmLnB1c2goY2h1bmspO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLmZvckVhY2goZnVuY3Rpb24oY2h1bms6IGFueSkge1xyXG4gICAgICAgICAgICByZXR1cm4gYnVmLnB1c2goY2h1bmspO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMuaW5wdXQgPSBbXTtcclxuICAgICAgICByZXR1cm4gYnVmLmpvaW4oXCJcIik7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBmb3JFYWNoKGNhbGxiYWNrOiBhbnkpIHtcclxuICAgICAgICBsZXQgYnVmID0gXCJcIjtcclxuICAgICAgICB0aGlzLmlucHV0LmZvckVhY2goKGNodW5rKSA9PiB7XHJcbiAgICAgICAgICAgIGJ1ZiArPSBjaHVuaztcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMudG9rZW5pemUoYnVmLCAodG9rZW46IGFueSwgZGF0YTogYW55KSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmdlbmVyYXRlT3V0cHV0KHRva2VuLCBkYXRhLCBjYWxsYmFjayk7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5vcHRzLnN0cmVhbSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnVwZGF0ZVN0aWNreVN0YWNrKHRva2VuLCBkYXRhKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgaWYgKHRoaXMuc3RhY2subGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayh0aGlzLnJlc2V0U3R5bGVzKCkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGdlbmVyYXRlT3V0cHV0KHRva2VuOiBhbnksIGRhdGE6IGFueSwgY2FsbGJhY2s6IGFueSkge1xyXG4gICAgICAgIHN3aXRjaCAodG9rZW4pIHtcclxuICAgICAgICAgICAgY2FzZSBcInRleHRcIjpcclxuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayh0aGlzLnB1c2hUZXh0KGRhdGEpKTtcclxuICAgICAgICAgICAgY2FzZSBcImRpc3BsYXlcIjpcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmhhbmRsZURpc3BsYXkoZGF0YSwgY2FsbGJhY2spO1xyXG4gICAgICAgICAgICBjYXNlIFwieHRlcm0yNTZcIjpcclxuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayh0aGlzLnB1c2hTdHlsZShcImVmXCIgKyBkYXRhKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgdXBkYXRlU3RpY2t5U3RhY2sodG9rZW46IGFueSwgZGF0YTogYW55KSB7XHJcbiAgICAgICAgY29uc3Qgbm90Q2F0ZWdvcnkgPSBmdW5jdGlvbihjYXRlZ29yeTogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbihlOiBhbnkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiAoY2F0ZWdvcnkgPT09IG51bGwgfHwgZS5jYXRlZ29yeSAhPT0gY2F0ZWdvcnkpICYmIGNhdGVnb3J5ICE9PSBcImFsbFwiO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgaWYgKHRva2VuICE9PSBcInRleHRcIikge1xyXG4gICAgICAgICAgICB0aGlzLnN0aWNreVN0YWNrID0gdGhpcy5zdGlja3lTdGFjay5maWx0ZXIobm90Q2F0ZWdvcnkodGhpcy5jYXRlZ29yeUZvckNvZGUoZGF0YSkpKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3RpY2t5U3RhY2sucHVzaCh7XHJcbiAgICAgICAgICAgICAgICB0b2tlbjogdG9rZW4sXHJcbiAgICAgICAgICAgICAgICBkYXRhOiBkYXRhLFxyXG4gICAgICAgICAgICAgICAgY2F0ZWdvcnk6IHRoaXMuY2F0ZWdvcnlGb3JDb2RlKGRhdGEpXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGhhbmRsZURpc3BsYXkoY29kZTogYW55LCBjYWxsYmFjazogYW55KSB7XHJcbiAgICAgICAgY29kZSA9IHBhcnNlSW50KGNvZGUsIDEwKTtcclxuICAgICAgICBpZiAoY29kZSA9PT0gLTEpIHtcclxuICAgICAgICAgICAgY2FsbGJhY2soXCI8YnIvPlwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGNvZGUgPT09IDApIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuc3RhY2subGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjayh0aGlzLnJlc2V0U3R5bGVzKCkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChjb2RlID09PSAxKSB7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrKHRoaXMucHVzaFRhZyhcImJcIikpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoKDIgPCBjb2RlICYmIGNvZGUgPCA1KSkge1xyXG4gICAgICAgICAgICBjYWxsYmFjayh0aGlzLnB1c2hUYWcoXCJ1XCIpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCg0IDwgY29kZSAmJiBjb2RlIDwgNykpIHtcclxuICAgICAgICAgICAgY2FsbGJhY2sodGhpcy5wdXNoVGFnKFwiYmxpbmtcIikpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoY29kZSA9PT0gOCkge1xyXG4gICAgICAgICAgICBjYWxsYmFjayh0aGlzLnB1c2hTdHlsZShcImRpc3BsYXk6bm9uZVwiKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChjb2RlID09PSA5KSB7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrKHRoaXMucHVzaFRhZyhcInN0cmlrZVwiKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChjb2RlID09PSAyNCkge1xyXG4gICAgICAgICAgICBjYWxsYmFjayh0aGlzLmNsb3NlVGFnKFwidVwiKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICgoMjkgPCBjb2RlICYmIGNvZGUgPCAzOCkpIHtcclxuICAgICAgICAgICAgY2FsbGJhY2sodGhpcy5wdXNoU3R5bGUoXCJlZlwiICsgKGNvZGUgLSAzMCkpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGNvZGUgPT09IDM5KSB7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrKHRoaXMucHVzaFN0eWxlKFwiY29sb3I6XCIgKyB0aGlzLm9wdHMuZmcpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCgzOSA8IGNvZGUgJiYgY29kZSA8IDQ4KSkge1xyXG4gICAgICAgICAgICBjYWxsYmFjayh0aGlzLnB1c2hTdHlsZShcImViXCIgKyAoY29kZSAtIDQwKSkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoY29kZSA9PT0gNDkpIHtcclxuICAgICAgICAgICAgY2FsbGJhY2sodGhpcy5wdXNoU3R5bGUoXCJiYWNrZ3JvdW5kLWNvbG9yOlwiICsgdGhpcy5vcHRzLmJnKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICgoODkgPCBjb2RlICYmIGNvZGUgPCA5OCkpIHtcclxuICAgICAgICAgICAgY2FsbGJhY2sodGhpcy5wdXNoU3R5bGUoXCJlZlwiICsgKDggKyAoY29kZSAtIDkwKSkpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCg5OSA8IGNvZGUgJiYgY29kZSA8IDEwOCkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKHRoaXMucHVzaFN0eWxlKFwiZWJcIiArICg4ICsgKGNvZGUgLSAxMDApKSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGNhdGVnb3J5Rm9yQ29kZShjb2RlOiBhbnkpIHtcclxuICAgICAgICBjb2RlID0gcGFyc2VJbnQoY29kZSwgMTApO1xyXG4gICAgICAgIGlmIChjb2RlID09PSAwKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBcImFsbFwiO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoY29kZSA9PT0gMSkge1xyXG4gICAgICAgICAgICByZXR1cm4gXCJib2xkXCI7XHJcbiAgICAgICAgfSBlbHNlIGlmICgoMiA8IGNvZGUgJiYgY29kZSA8IDUpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBcInVuZGVybGluZVwiO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoKDQgPCBjb2RlICYmIGNvZGUgPCA3KSkge1xyXG4gICAgICAgICAgICByZXR1cm4gXCJibGlua1wiO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoY29kZSA9PT0gOCkge1xyXG4gICAgICAgICAgICByZXR1cm4gXCJoaWRlXCI7XHJcbiAgICAgICAgfSBlbHNlIGlmIChjb2RlID09PSA5KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBcInN0cmlrZVwiO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoKDI5IDwgY29kZSAmJiBjb2RlIDwgMzgpIHx8IGNvZGUgPT09IDM5IHx8ICg4OSA8IGNvZGUgJiYgY29kZSA8IDk4KSkge1xyXG4gICAgICAgICAgICByZXR1cm4gXCJmb3JlZ3JvdW5kLWNvbG9yXCI7XHJcbiAgICAgICAgfSBlbHNlIGlmICgoMzkgPCBjb2RlICYmIGNvZGUgPCA0OCkgfHwgY29kZSA9PT0gNDkgfHwgKDk5IDwgY29kZSAmJiBjb2RlIDwgMTA4KSkge1xyXG4gICAgICAgICAgICByZXR1cm4gXCJiYWNrZ3JvdW5kLWNvbG9yXCI7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgcHVzaFRhZyh0YWc6IGFueSwgc3R5bGU/OiBhbnkpIHtcclxuICAgICAgICBpZiAoc3R5bGUgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICBzdHlsZSA9IFwiXCI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChzdHlsZS5sZW5ndGggJiYgc3R5bGUuaW5kZXhPZihcIjpcIikgPT09IC0xKSB7XHJcbiAgICAgICAgICAgIHN0eWxlID0gU1RZTEVTW3N0eWxlXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5zdGFjay5wdXNoKHRhZyk7XHJcbiAgICAgICAgcmV0dXJuIFtcIjxcIiArIHRhZywgKHN0eWxlID8gXCIgc3R5bGU9XFxcIlwiICsgc3R5bGUgKyBcIlxcXCJcIiA6IHZvaWQgMCksIFwiPlwiXS5qb2luKFwiXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgcHVzaFRleHQodGV4dDogYW55KSB7XHJcbiAgICAgICAgaWYgKHRoaXMub3B0cy5lc2NhcGVYTUwpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVudGl0aWVzLmVuY29kZVhNTCh0ZXh0KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByZXR1cm4gdGV4dDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBwdXNoU3R5bGUoc3R5bGU6IGFueSkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnB1c2hUYWcoXCJzcGFuXCIsIHN0eWxlKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGNsb3NlVGFnKHN0eWxlOiBhbnkpIHtcclxuICAgICAgICBsZXQgbGFzdDogYW55O1xyXG4gICAgICAgIGlmICh0aGlzLnN0YWNrLnNsaWNlKC0xKVswXSA9PT0gc3R5bGUpIHtcclxuICAgICAgICAgICAgbGFzdCA9IHRoaXMuc3RhY2sucG9wKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChsYXN0ICE9IG51bGwpIHtcclxuICAgICAgICAgICAgcmV0dXJuIFwiPC9cIiArIHN0eWxlICsgXCI+XCI7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgcmVzZXRTdHlsZXMoKSB7XHJcbiAgICAgICAgY29uc3QgcmVmID0gW3RoaXMuc3RhY2ssIFtdXSwgc3RhY2sgPSByZWZbMF07XHJcbiAgICAgICAgdGhpcy5zdGFjayA9IHJlZlsxXTtcclxuICAgICAgICByZXR1cm4gc3RhY2sucmV2ZXJzZSgpLm1hcChmdW5jdGlvbih0YWcpIHtcclxuICAgICAgICAgICAgcmV0dXJuIFwiPC9cIiArIHRhZyArIFwiPlwiO1xyXG4gICAgICAgIH0pLmpvaW4oXCJcIik7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSB0b2tlbml6ZSh0ZXh0OiBhbnksIGNhbGxiYWNrOiBhbnkpIHtcclxuICAgICAgICBsZXQgYW5zaU1hdGNoID0gZmFsc2U7XHJcbiAgICAgICAgY29uc3QgYW5zaUhhbmRsZXIgPSAzO1xyXG4gICAgICAgIGNvbnN0IHJlbW92ZSA9IGZ1bmN0aW9uKG06IGFueSkge1xyXG4gICAgICAgICAgICByZXR1cm4gXCJcIjtcclxuICAgICAgICB9O1xyXG4gICAgICAgIGNvbnN0IHJlbW92ZVh0ZXJtMjU2ID0gZnVuY3Rpb24obTogYW55LCBnMTogYW55KSB7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrKFwieHRlcm0yNTZcIiwgZzEpO1xyXG4gICAgICAgICAgICByZXR1cm4gXCJcIjtcclxuICAgICAgICB9O1xyXG4gICAgICAgIGNvbnN0IG5ld2xpbmUgPSAobTogYW55KSA9PiB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLm9wdHMubmV3bGluZSkge1xyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2soXCJkaXNwbGF5XCIsIC0xKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrKFwidGV4dFwiLCBtKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gXCJcIjtcclxuICAgICAgICB9O1xyXG4gICAgICAgIGNvbnN0IGFuc2lNZXNzID0gZnVuY3Rpb24obTogYW55LCBnMTogYW55KSB7XHJcbiAgICAgICAgICAgIGFuc2lNYXRjaCA9IHRydWU7XHJcbiAgICAgICAgICAgIGxldCBjb2RlOiBhbnk7XHJcbiAgICAgICAgICAgIGlmIChnMS50cmltKCkubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICBnMSA9IFwiMFwiO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGcxID0gZzEudHJpbVJpZ2h0KFwiO1wiKS5zcGxpdChcIjtcIik7XHJcbiAgICAgICAgICAgIGZvciAobGV0IG8gPSAwLCBsZW4gPSBnMS5sZW5ndGg7IG8gPCBsZW47IG8rKykge1xyXG4gICAgICAgICAgICAgICAgY29kZSA9IGcxW29dO1xyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2soXCJkaXNwbGF5XCIsIGNvZGUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBcIlwiO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgY29uc3QgcmVhbFRleHQgPSBmdW5jdGlvbihtOiBhbnkpIHtcclxuICAgICAgICAgICAgY2FsbGJhY2soXCJ0ZXh0XCIsIG0pO1xyXG4gICAgICAgICAgICByZXR1cm4gXCJcIjtcclxuICAgICAgICB9O1xyXG4gICAgICAgIGNvbnN0IHRva2VucyA9IFtcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgcGF0dGVybjogL15cXHgwOCsvLFxyXG4gICAgICAgICAgICAgICAgc3ViOiByZW1vdmVcclxuICAgICAgICAgICAgfSwge1xyXG4gICAgICAgICAgICAgICAgcGF0dGVybjogL15cXHgxYlxcW1swMTJdP0svLFxyXG4gICAgICAgICAgICAgICAgc3ViOiByZW1vdmVcclxuICAgICAgICAgICAgfSwge1xyXG4gICAgICAgICAgICAgICAgcGF0dGVybjogL15cXHgxYlxcWzM4OzU7KFxcZCspbS8sXHJcbiAgICAgICAgICAgICAgICBzdWI6IHJlbW92ZVh0ZXJtMjU2XHJcbiAgICAgICAgICAgIH0sIHtcclxuICAgICAgICAgICAgICAgIHBhdHRlcm46IC9eXFxuKy8sXHJcbiAgICAgICAgICAgICAgICBzdWI6IG5ld2xpbmVcclxuICAgICAgICAgICAgfSwge1xyXG4gICAgICAgICAgICAgICAgcGF0dGVybjogL15cXHgxYlxcWygoPzpcXGR7MSwzfTs/KSt8KW0vLFxyXG4gICAgICAgICAgICAgICAgc3ViOiBhbnNpTWVzc1xyXG4gICAgICAgICAgICB9LCB7XHJcbiAgICAgICAgICAgICAgICBwYXR0ZXJuOiAvXlxceDFiXFxbP1tcXGQ7XXswLDN9LyxcclxuICAgICAgICAgICAgICAgIHN1YjogcmVtb3ZlXHJcbiAgICAgICAgICAgIH0sIHtcclxuICAgICAgICAgICAgICAgIHBhdHRlcm46IC9eKFteXFx4MWJcXHgwOFxcbl0rKS8sXHJcbiAgICAgICAgICAgICAgICBzdWI6IHJlYWxUZXh0XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICBdO1xyXG4gICAgICAgIGNvbnN0IHByb2Nlc3MgPSBmdW5jdGlvbihoYW5kbGVyOiBhbnksIGk6IGFueSkge1xyXG4gICAgICAgICAgICBpZiAoaSA+IGFuc2lIYW5kbGVyICYmIGFuc2lNYXRjaCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgYW5zaU1hdGNoID0gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGV4dCA9IHRleHQucmVwbGFjZShoYW5kbGVyLnBhdHRlcm4sIGhhbmRsZXIuc3ViKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIGNvbnN0IHJlc3VsdHMxOiBhbnlbXSA9IFtdO1xyXG4gICAgICAgIHdoaWxlICgobGVuZ3RoID0gdGV4dC5sZW5ndGgpID4gMCkge1xyXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMCwgbyA9IDAsIGxlbiA9IHRva2Vucy5sZW5ndGg7IG8gPCBsZW47IGkgPSArK28pIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGhhbmRsZXIgPSB0b2tlbnNbaV07XHJcbiAgICAgICAgICAgICAgICBwcm9jZXNzKGhhbmRsZXIsIGkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh0ZXh0Lmxlbmd0aCA9PT0gbGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdHMxLnB1c2godm9pZCAwKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcmVzdWx0czE7XHJcbiAgICB9XHJcbn1cclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
