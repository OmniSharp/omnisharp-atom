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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9zZXJ2aWNlcy9hbnNpLXRvLWh0bWwuanMiLCJsaWIvc2VydmljZXMvYW5zaS10by1odG1sLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOzs7O0FDQ0EsSUFBTSxXQUFXLFFBQVEsVUFBUixDQUFYO0FBRU4sSUFBTSxTQUFTO0FBQ1gsV0FBTyxZQUFQO0FBQ0EsV0FBTyxZQUFQO0FBQ0EsV0FBTyxZQUFQO0FBQ0EsV0FBTyxZQUFQO0FBQ0EsV0FBTyxZQUFQO0FBQ0EsV0FBTyxZQUFQO0FBQ0EsV0FBTyxZQUFQO0FBQ0EsV0FBTyxZQUFQO0FBQ0EsV0FBTyxZQUFQO0FBQ0EsV0FBTyxZQUFQO0FBQ0EsWUFBUSxZQUFSO0FBQ0EsWUFBUSxZQUFSO0FBQ0EsWUFBUSxZQUFSO0FBQ0EsWUFBUSxZQUFSO0FBQ0EsWUFBUSxZQUFSO0FBQ0EsWUFBUSxZQUFSO0FBQ0EsV0FBTyx1QkFBUDtBQUNBLFdBQU8sdUJBQVA7QUFDQSxXQUFPLHVCQUFQO0FBQ0EsV0FBTyx1QkFBUDtBQUNBLFdBQU8sdUJBQVA7QUFDQSxXQUFPLHVCQUFQO0FBQ0EsV0FBTyx1QkFBUDtBQUNBLFdBQU8sdUJBQVA7QUFDQSxXQUFPLHVCQUFQO0FBQ0EsV0FBTyx1QkFBUDtBQUNBLFlBQVEsdUJBQVI7QUFDQSxZQUFRLHVCQUFSO0FBQ0EsWUFBUSx1QkFBUjtBQUNBLFlBQVEsdUJBQVI7QUFDQSxZQUFRLHVCQUFSO0FBQ0EsWUFBUSx1QkFBUjtDQWhDRTtBQW1DTixJQUFNLGNBQWMsU0FBZCxXQUFjLENBQVMsR0FBVCxFQUFpQjtBQUNqQyxVQUFNLElBQUksUUFBSixDQUFhLEVBQWIsQ0FBTixDQURpQztBQUVqQyxXQUFPLElBQUksTUFBSixHQUFhLENBQWIsRUFBZ0I7QUFDbkIsY0FBTSxNQUFNLEdBQU4sQ0FEYTtLQUF2QjtBQUdBLFdBQU8sR0FBUCxDQUxpQztDQUFqQjtBQVFwQixDQUFDLENBQUQsRUFBSSxDQUFKLEVBQU8sQ0FBUCxFQUFVLENBQVYs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Q0FBWSxLQUFaLENBREc7aUJBRlA7QUFLQSx1QkFBTyxLQUFLLE9BQUwsQ0FBYSxRQUFRLE9BQVIsRUFBaUIsUUFBUSxHQUFSLENBQXJDLENBTnlDO2FBQTdCLENBM0RxQjtBQW1FckMsZ0JBQU0sV0FBa0IsRUFBbEIsQ0FuRStCO0FBb0VyQyxtQkFBTyxDQUFDLFNBQVMsS0FBSyxNQUFMLENBQVYsR0FBeUIsQ0FBekIsRUFBNEI7QUFDL0IscUJBQUssSUFBSSxJQUFJLENBQUosRUFBTyxJQUFJLENBQUosRUFBTyxNQUFNLE9BQU8sTUFBUCxFQUFlLElBQUksR0FBSixFQUFTLElBQUksRUFBRSxDQUFGLEVBQUs7QUFDMUQsd0JBQU0sVUFBVSxPQUFPLENBQVAsQ0FBVixDQURvRDtBQUUxRCw0QkFBUSxPQUFSLEVBQWlCLENBQWpCLEVBRjBEO2lCQUE5RDtBQUlBLG9CQUFJLEtBQUssTUFBTCxLQUFnQixNQUFoQixFQUF3QjtBQUN4QiwwQkFEd0I7aUJBQTVCLE1BRU87QUFDSCw2QkFBUyxJQUFULENBQWMsS0FBSyxDQUFMLENBQWQsQ0FERztpQkFGUDthQUxKO0FBV0EsbUJBQU8sUUFBUCxDQS9FcUMiLCJmaWxlIjoibGliL3NlcnZpY2VzL2Fuc2ktdG8taHRtbC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGV4dGVuZCB9IGZyb20gXCJsb2Rhc2hcIjtcbmNvbnN0IGVudGl0aWVzID0gcmVxdWlyZShcImVudGl0aWVzXCIpO1xuY29uc3QgU1RZTEVTID0ge1xuICAgIFwiZWYwXCI6IFwiY29sb3I6IzAwMFwiLFxuICAgIFwiZWYxXCI6IFwiY29sb3I6I0EwMFwiLFxuICAgIFwiZWYyXCI6IFwiY29sb3I6IzBBMFwiLFxuICAgIFwiZWYzXCI6IFwiY29sb3I6I0E1MFwiLFxuICAgIFwiZWY0XCI6IFwiY29sb3I6IzAwQVwiLFxuICAgIFwiZWY1XCI6IFwiY29sb3I6I0EwQVwiLFxuICAgIFwiZWY2XCI6IFwiY29sb3I6IzBBQVwiLFxuICAgIFwiZWY3XCI6IFwiY29sb3I6I0FBQVwiLFxuICAgIFwiZWY4XCI6IFwiY29sb3I6IzU1NVwiLFxuICAgIFwiZWY5XCI6IFwiY29sb3I6I0Y1NVwiLFxuICAgIFwiZWYxMFwiOiBcImNvbG9yOiM1RjVcIixcbiAgICBcImVmMTFcIjogXCJjb2xvcjojRkY1XCIsXG4gICAgXCJlZjEyXCI6IFwiY29sb3I6IzU1RlwiLFxuICAgIFwiZWYxM1wiOiBcImNvbG9yOiNGNUZcIixcbiAgICBcImVmMTRcIjogXCJjb2xvcjojNUZGXCIsXG4gICAgXCJlZjE1XCI6IFwiY29sb3I6I0ZGRlwiLFxuICAgIFwiZWIwXCI6IFwiYmFja2dyb3VuZC1jb2xvcjojMDAwXCIsXG4gICAgXCJlYjFcIjogXCJiYWNrZ3JvdW5kLWNvbG9yOiNBMDBcIixcbiAgICBcImViMlwiOiBcImJhY2tncm91bmQtY29sb3I6IzBBMFwiLFxuICAgIFwiZWIzXCI6IFwiYmFja2dyb3VuZC1jb2xvcjojQTUwXCIsXG4gICAgXCJlYjRcIjogXCJiYWNrZ3JvdW5kLWNvbG9yOiMwMEFcIixcbiAgICBcImViNVwiOiBcImJhY2tncm91bmQtY29sb3I6I0EwQVwiLFxuICAgIFwiZWI2XCI6IFwiYmFja2dyb3VuZC1jb2xvcjojMEFBXCIsXG4gICAgXCJlYjdcIjogXCJiYWNrZ3JvdW5kLWNvbG9yOiNBQUFcIixcbiAgICBcImViOFwiOiBcImJhY2tncm91bmQtY29sb3I6IzU1NVwiLFxuICAgIFwiZWI5XCI6IFwiYmFja2dyb3VuZC1jb2xvcjojRjU1XCIsXG4gICAgXCJlYjEwXCI6IFwiYmFja2dyb3VuZC1jb2xvcjojNUY1XCIsXG4gICAgXCJlYjExXCI6IFwiYmFja2dyb3VuZC1jb2xvcjojRkY1XCIsXG4gICAgXCJlYjEyXCI6IFwiYmFja2dyb3VuZC1jb2xvcjojNTVGXCIsXG4gICAgXCJlYjEzXCI6IFwiYmFja2dyb3VuZC1jb2xvcjojRjVGXCIsXG4gICAgXCJlYjE0XCI6IFwiYmFja2dyb3VuZC1jb2xvcjojNUZGXCIsXG4gICAgXCJlYjE1XCI6IFwiYmFja2dyb3VuZC1jb2xvcjojRkZGXCJcbn07XG5jb25zdCB0b0hleFN0cmluZyA9IGZ1bmN0aW9uIChudW0pIHtcbiAgICBudW0gPSBudW0udG9TdHJpbmcoMTYpO1xuICAgIHdoaWxlIChudW0ubGVuZ3RoIDwgMikge1xuICAgICAgICBudW0gPSBcIjBcIiArIG51bTtcbiAgICB9XG4gICAgcmV0dXJuIG51bTtcbn07XG5bMCwgMSwgMiwgMywgNCwgNV0uZm9yRWFjaChmdW5jdGlvbiAocmVkKSB7XG4gICAgcmV0dXJuIFswLCAxLCAyLCAzLCA0LCA1XS5mb3JFYWNoKGZ1bmN0aW9uIChncmVlbikge1xuICAgICAgICByZXR1cm4gWzAsIDEsIDIsIDMsIDQsIDVdLmZvckVhY2goZnVuY3Rpb24gKGJsdWUpIHtcbiAgICAgICAgICAgIGNvbnN0IGMgPSAxNiArIChyZWQgKiAzNikgKyAoZ3JlZW4gKiA2KSArIGJsdWU7XG4gICAgICAgICAgICBjb25zdCByID0gcmVkID4gMCA/IHJlZCAqIDQwICsgNTUgOiAwO1xuICAgICAgICAgICAgY29uc3QgZyA9IGdyZWVuID4gMCA/IGdyZWVuICogNDAgKyA1NSA6IDA7XG4gICAgICAgICAgICBjb25zdCBiID0gYmx1ZSA+IDAgPyBibHVlICogNDAgKyA1NSA6IDA7XG4gICAgICAgICAgICBjb25zdCByZ2IgPSAoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBjb25zdCByZWYgPSBbciwgZywgYl07XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0cyA9IFtdO1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGogPSAwLCBsZW4gPSByZWYubGVuZ3RoOyBqIDwgbGVuOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbiA9IHJlZltqXTtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKHRvSGV4U3RyaW5nKG4pKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gICAgICAgICAgICB9KSgpKS5qb2luKFwiXCIpO1xuICAgICAgICAgICAgU1RZTEVTW1wiZWZcIiArIGNdID0gXCJjb2xvcjojXCIgKyByZ2I7XG4gICAgICAgICAgICByZXR1cm4gU1RZTEVTW1wiZWJcIiArIGNdID0gXCJiYWNrZ3JvdW5kLWNvbG9yOiNcIiArIHJnYjtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59KTtcbihmdW5jdGlvbiAoKSB7XG4gICAgY29uc3QgcmVzdWx0cyA9IFtdO1xuICAgIGZvciAobGV0IGogPSAwOyBqIDw9IDIzOyBqKyspIHtcbiAgICAgICAgcmVzdWx0cy5wdXNoKGopO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0cztcbn0pLmFwcGx5KHRoaXMpLmZvckVhY2goZnVuY3Rpb24gKGdyYXkpIHtcbiAgICBjb25zdCBjID0gZ3JheSArIDIzMjtcbiAgICBjb25zdCBsID0gdG9IZXhTdHJpbmcoZ3JheSAqIDEwICsgOCk7XG4gICAgU1RZTEVTW1wiZWZcIiArIGNdID0gXCJjb2xvcjojXCIgKyBsICsgbCArIGw7XG4gICAgcmV0dXJuIFNUWUxFU1tcImViXCIgKyBjXSA9IFwiYmFja2dyb3VuZC1jb2xvcjojXCIgKyBsICsgbCArIGw7XG59KTtcbmNvbnN0IGRlZmF1bHRzID0ge1xuICAgIGZnOiBcIiNGRkZcIixcbiAgICBiZzogXCIjMDAwXCIsXG4gICAgbmV3bGluZTogZmFsc2UsXG4gICAgZXNjYXBlWE1MOiBmYWxzZSxcbiAgICBzdHJlYW06IGZhbHNlXG59O1xuZXhwb3J0IGNsYXNzIENvbnZlcnQge1xuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5pbnB1dCA9IFtdO1xuICAgICAgICB0aGlzLnN0YWNrID0gW107XG4gICAgICAgIHRoaXMuc3RpY2t5U3RhY2sgPSBbXTtcbiAgICAgICAgaWYgKG9wdGlvbnMgPT0gbnVsbCkge1xuICAgICAgICAgICAgb3B0aW9ucyA9IHt9O1xuICAgICAgICB9XG4gICAgICAgIHRoaXMub3B0cyA9IGV4dGVuZCh7fSwgZGVmYXVsdHMsIG9wdGlvbnMpO1xuICAgIH1cbiAgICB0b0h0bWwoaW5wdXQpIHtcbiAgICAgICAgdGhpcy5pbnB1dCA9IHR5cGVvZiBpbnB1dCA9PT0gXCJzdHJpbmdcIiA/IFtpbnB1dF0gOiBpbnB1dDtcbiAgICAgICAgY29uc3QgYnVmID0gW107XG4gICAgICAgIHRoaXMuc3RpY2t5U3RhY2suZm9yRWFjaCgoZWxlbWVudCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2VuZXJhdGVPdXRwdXQoZWxlbWVudC50b2tlbiwgZWxlbWVudC5kYXRhLCBmdW5jdGlvbiAoY2h1bmspIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYnVmLnB1c2goY2h1bmspO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmZvckVhY2goZnVuY3Rpb24gKGNodW5rKSB7XG4gICAgICAgICAgICByZXR1cm4gYnVmLnB1c2goY2h1bmspO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5pbnB1dCA9IFtdO1xuICAgICAgICByZXR1cm4gYnVmLmpvaW4oXCJcIik7XG4gICAgfVxuICAgIGZvckVhY2goY2FsbGJhY2spIHtcbiAgICAgICAgbGV0IGJ1ZiA9IFwiXCI7XG4gICAgICAgIHRoaXMuaW5wdXQuZm9yRWFjaCgoY2h1bmspID0+IHtcbiAgICAgICAgICAgIGJ1ZiArPSBjaHVuaztcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnRva2VuaXplKGJ1ZiwgKHRva2VuLCBkYXRhKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5nZW5lcmF0ZU91dHB1dCh0b2tlbiwgZGF0YSwgY2FsbGJhY2spO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLm9wdHMuc3RyZWFtKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnVwZGF0ZVN0aWNreVN0YWNrKHRva2VuLCBkYXRhKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICAgIGlmICh0aGlzLnN0YWNrLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKHRoaXMucmVzZXRTdHlsZXMoKSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZ2VuZXJhdGVPdXRwdXQodG9rZW4sIGRhdGEsIGNhbGxiYWNrKSB7XG4gICAgICAgIHN3aXRjaCAodG9rZW4pIHtcbiAgICAgICAgICAgIGNhc2UgXCJ0ZXh0XCI6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKHRoaXMucHVzaFRleHQoZGF0YSkpO1xuICAgICAgICAgICAgY2FzZSBcImRpc3BsYXlcIjpcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5oYW5kbGVEaXNwbGF5KGRhdGEsIGNhbGxiYWNrKTtcbiAgICAgICAgICAgIGNhc2UgXCJ4dGVybTI1NlwiOlxuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayh0aGlzLnB1c2hTdHlsZShcImVmXCIgKyBkYXRhKSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgdXBkYXRlU3RpY2t5U3RhY2sodG9rZW4sIGRhdGEpIHtcbiAgICAgICAgY29uc3Qgbm90Q2F0ZWdvcnkgPSBmdW5jdGlvbiAoY2F0ZWdvcnkpIHtcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAoY2F0ZWdvcnkgPT09IG51bGwgfHwgZS5jYXRlZ29yeSAhPT0gY2F0ZWdvcnkpICYmIGNhdGVnb3J5ICE9PSBcImFsbFwiO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKHRva2VuICE9PSBcInRleHRcIikge1xuICAgICAgICAgICAgdGhpcy5zdGlja3lTdGFjayA9IHRoaXMuc3RpY2t5U3RhY2suZmlsdGVyKG5vdENhdGVnb3J5KHRoaXMuY2F0ZWdvcnlGb3JDb2RlKGRhdGEpKSk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zdGlja3lTdGFjay5wdXNoKHtcbiAgICAgICAgICAgICAgICB0b2tlbjogdG9rZW4sXG4gICAgICAgICAgICAgICAgZGF0YTogZGF0YSxcbiAgICAgICAgICAgICAgICBjYXRlZ29yeTogdGhpcy5jYXRlZ29yeUZvckNvZGUoZGF0YSlcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIGhhbmRsZURpc3BsYXkoY29kZSwgY2FsbGJhY2spIHtcbiAgICAgICAgY29kZSA9IHBhcnNlSW50KGNvZGUsIDEwKTtcbiAgICAgICAgaWYgKGNvZGUgPT09IC0xKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhcIjxici8+XCIpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjb2RlID09PSAwKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5zdGFjay5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayh0aGlzLnJlc2V0U3R5bGVzKCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChjb2RlID09PSAxKSB7XG4gICAgICAgICAgICBjYWxsYmFjayh0aGlzLnB1c2hUYWcoXCJiXCIpKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoKDIgPCBjb2RlICYmIGNvZGUgPCA1KSkge1xuICAgICAgICAgICAgY2FsbGJhY2sodGhpcy5wdXNoVGFnKFwidVwiKSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCg0IDwgY29kZSAmJiBjb2RlIDwgNykpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKHRoaXMucHVzaFRhZyhcImJsaW5rXCIpKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY29kZSA9PT0gOCkge1xuICAgICAgICAgICAgY2FsbGJhY2sodGhpcy5wdXNoU3R5bGUoXCJkaXNwbGF5Om5vbmVcIikpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjb2RlID09PSA5KSB7XG4gICAgICAgICAgICBjYWxsYmFjayh0aGlzLnB1c2hUYWcoXCJzdHJpa2VcIikpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjb2RlID09PSAyNCkge1xuICAgICAgICAgICAgY2FsbGJhY2sodGhpcy5jbG9zZVRhZyhcInVcIikpO1xuICAgICAgICB9XG4gICAgICAgIGlmICgoMjkgPCBjb2RlICYmIGNvZGUgPCAzOCkpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKHRoaXMucHVzaFN0eWxlKFwiZWZcIiArIChjb2RlIC0gMzApKSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNvZGUgPT09IDM5KSB7XG4gICAgICAgICAgICBjYWxsYmFjayh0aGlzLnB1c2hTdHlsZShcImNvbG9yOlwiICsgdGhpcy5vcHRzLmZnKSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCgzOSA8IGNvZGUgJiYgY29kZSA8IDQ4KSkge1xuICAgICAgICAgICAgY2FsbGJhY2sodGhpcy5wdXNoU3R5bGUoXCJlYlwiICsgKGNvZGUgLSA0MCkpKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY29kZSA9PT0gNDkpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKHRoaXMucHVzaFN0eWxlKFwiYmFja2dyb3VuZC1jb2xvcjpcIiArIHRoaXMub3B0cy5iZykpO1xuICAgICAgICB9XG4gICAgICAgIGlmICgoODkgPCBjb2RlICYmIGNvZGUgPCA5OCkpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKHRoaXMucHVzaFN0eWxlKFwiZWZcIiArICg4ICsgKGNvZGUgLSA5MCkpKSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCg5OSA8IGNvZGUgJiYgY29kZSA8IDEwOCkpIHtcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayh0aGlzLnB1c2hTdHlsZShcImViXCIgKyAoOCArIChjb2RlIC0gMTAwKSkpKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBjYXRlZ29yeUZvckNvZGUoY29kZSkge1xuICAgICAgICBjb2RlID0gcGFyc2VJbnQoY29kZSwgMTApO1xuICAgICAgICBpZiAoY29kZSA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIFwiYWxsXCI7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoY29kZSA9PT0gMSkge1xuICAgICAgICAgICAgcmV0dXJuIFwiYm9sZFwiO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKCgyIDwgY29kZSAmJiBjb2RlIDwgNSkpIHtcbiAgICAgICAgICAgIHJldHVybiBcInVuZGVybGluZVwiO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKCg0IDwgY29kZSAmJiBjb2RlIDwgNykpIHtcbiAgICAgICAgICAgIHJldHVybiBcImJsaW5rXCI7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoY29kZSA9PT0gOCkge1xuICAgICAgICAgICAgcmV0dXJuIFwiaGlkZVwiO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGNvZGUgPT09IDkpIHtcbiAgICAgICAgICAgIHJldHVybiBcInN0cmlrZVwiO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKCgyOSA8IGNvZGUgJiYgY29kZSA8IDM4KSB8fCBjb2RlID09PSAzOSB8fCAoODkgPCBjb2RlICYmIGNvZGUgPCA5OCkpIHtcbiAgICAgICAgICAgIHJldHVybiBcImZvcmVncm91bmQtY29sb3JcIjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICgoMzkgPCBjb2RlICYmIGNvZGUgPCA0OCkgfHwgY29kZSA9PT0gNDkgfHwgKDk5IDwgY29kZSAmJiBjb2RlIDwgMTA4KSkge1xuICAgICAgICAgICAgcmV0dXJuIFwiYmFja2dyb3VuZC1jb2xvclwiO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcHVzaFRhZyh0YWcsIHN0eWxlKSB7XG4gICAgICAgIGlmIChzdHlsZSA9PSBudWxsKSB7XG4gICAgICAgICAgICBzdHlsZSA9IFwiXCI7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHN0eWxlLmxlbmd0aCAmJiBzdHlsZS5pbmRleE9mKFwiOlwiKSA9PT0gLTEpIHtcbiAgICAgICAgICAgIHN0eWxlID0gU1RZTEVTW3N0eWxlXTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnN0YWNrLnB1c2godGFnKTtcbiAgICAgICAgcmV0dXJuIFtcIjxcIiArIHRhZywgKHN0eWxlID8gXCIgc3R5bGU9XFxcIlwiICsgc3R5bGUgKyBcIlxcXCJcIiA6IHZvaWQgMCksIFwiPlwiXS5qb2luKFwiXCIpO1xuICAgIH1cbiAgICBwdXNoVGV4dCh0ZXh0KSB7XG4gICAgICAgIGlmICh0aGlzLm9wdHMuZXNjYXBlWE1MKSB7XG4gICAgICAgICAgICByZXR1cm4gZW50aXRpZXMuZW5jb2RlWE1MKHRleHQpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRleHQ7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcHVzaFN0eWxlKHN0eWxlKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnB1c2hUYWcoXCJzcGFuXCIsIHN0eWxlKTtcbiAgICB9XG4gICAgY2xvc2VUYWcoc3R5bGUpIHtcbiAgICAgICAgbGV0IGxhc3Q7XG4gICAgICAgIGlmICh0aGlzLnN0YWNrLnNsaWNlKC0xKVswXSA9PT0gc3R5bGUpIHtcbiAgICAgICAgICAgIGxhc3QgPSB0aGlzLnN0YWNrLnBvcCgpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChsYXN0ICE9IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBcIjwvXCIgKyBzdHlsZSArIFwiPlwiO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJlc2V0U3R5bGVzKCkge1xuICAgICAgICBjb25zdCByZWYgPSBbdGhpcy5zdGFjaywgW11dLCBzdGFjayA9IHJlZlswXTtcbiAgICAgICAgdGhpcy5zdGFjayA9IHJlZlsxXTtcbiAgICAgICAgcmV0dXJuIHN0YWNrLnJldmVyc2UoKS5tYXAoZnVuY3Rpb24gKHRhZykge1xuICAgICAgICAgICAgcmV0dXJuIFwiPC9cIiArIHRhZyArIFwiPlwiO1xuICAgICAgICB9KS5qb2luKFwiXCIpO1xuICAgIH1cbiAgICB0b2tlbml6ZSh0ZXh0LCBjYWxsYmFjaykge1xuICAgICAgICBsZXQgYW5zaU1hdGNoID0gZmFsc2U7XG4gICAgICAgIGNvbnN0IGFuc2lIYW5kbGVyID0gMztcbiAgICAgICAgY29uc3QgcmVtb3ZlID0gZnVuY3Rpb24gKG0pIHtcbiAgICAgICAgICAgIHJldHVybiBcIlwiO1xuICAgICAgICB9O1xuICAgICAgICBjb25zdCByZW1vdmVYdGVybTI1NiA9IGZ1bmN0aW9uIChtLCBnMSkge1xuICAgICAgICAgICAgY2FsbGJhY2soXCJ4dGVybTI1NlwiLCBnMSk7XG4gICAgICAgICAgICByZXR1cm4gXCJcIjtcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgbmV3bGluZSA9IChtKSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5vcHRzLm5ld2xpbmUpIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhcImRpc3BsYXlcIiwgLTEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soXCJ0ZXh0XCIsIG0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IGFuc2lNZXNzID0gZnVuY3Rpb24gKG0sIGcxKSB7XG4gICAgICAgICAgICBhbnNpTWF0Y2ggPSB0cnVlO1xuICAgICAgICAgICAgbGV0IGNvZGU7XG4gICAgICAgICAgICBpZiAoZzEudHJpbSgpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGcxID0gXCIwXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBnMSA9IGcxLnRyaW1SaWdodChcIjtcIikuc3BsaXQoXCI7XCIpO1xuICAgICAgICAgICAgZm9yIChsZXQgbyA9IDAsIGxlbiA9IGcxLmxlbmd0aDsgbyA8IGxlbjsgbysrKSB7XG4gICAgICAgICAgICAgICAgY29kZSA9IGcxW29dO1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKFwiZGlzcGxheVwiLCBjb2RlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBcIlwiO1xuICAgICAgICB9O1xuICAgICAgICBjb25zdCByZWFsVGV4dCA9IGZ1bmN0aW9uIChtKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhcInRleHRcIiwgbSk7XG4gICAgICAgICAgICByZXR1cm4gXCJcIjtcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgdG9rZW5zID0gW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHBhdHRlcm46IC9eXFx4MDgrLyxcbiAgICAgICAgICAgICAgICBzdWI6IHJlbW92ZVxuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIHBhdHRlcm46IC9eXFx4MWJcXFtbMDEyXT9LLyxcbiAgICAgICAgICAgICAgICBzdWI6IHJlbW92ZVxuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIHBhdHRlcm46IC9eXFx4MWJcXFszODs1OyhcXGQrKW0vLFxuICAgICAgICAgICAgICAgIHN1YjogcmVtb3ZlWHRlcm0yNTZcbiAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICBwYXR0ZXJuOiAvXlxcbisvLFxuICAgICAgICAgICAgICAgIHN1YjogbmV3bGluZVxuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIHBhdHRlcm46IC9eXFx4MWJcXFsoKD86XFxkezEsM307PykrfCltLyxcbiAgICAgICAgICAgICAgICBzdWI6IGFuc2lNZXNzXG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgcGF0dGVybjogL15cXHgxYlxcWz9bXFxkO117MCwzfS8sXG4gICAgICAgICAgICAgICAgc3ViOiByZW1vdmVcbiAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICBwYXR0ZXJuOiAvXihbXlxceDFiXFx4MDhcXG5dKykvLFxuICAgICAgICAgICAgICAgIHN1YjogcmVhbFRleHRcbiAgICAgICAgICAgIH1cbiAgICAgICAgXTtcbiAgICAgICAgY29uc3QgcHJvY2VzcyA9IGZ1bmN0aW9uIChoYW5kbGVyLCBpKSB7XG4gICAgICAgICAgICBpZiAoaSA+IGFuc2lIYW5kbGVyICYmIGFuc2lNYXRjaCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGFuc2lNYXRjaCA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGV4dCA9IHRleHQucmVwbGFjZShoYW5kbGVyLnBhdHRlcm4sIGhhbmRsZXIuc3ViKTtcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgcmVzdWx0czEgPSBbXTtcbiAgICAgICAgd2hpbGUgKChsZW5ndGggPSB0ZXh0Lmxlbmd0aCkgPiAwKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMCwgbyA9IDAsIGxlbiA9IHRva2Vucy5sZW5ndGg7IG8gPCBsZW47IGkgPSArK28pIHtcbiAgICAgICAgICAgICAgICBjb25zdCBoYW5kbGVyID0gdG9rZW5zW2ldO1xuICAgICAgICAgICAgICAgIHByb2Nlc3MoaGFuZGxlciwgaSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGV4dC5sZW5ndGggPT09IGxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0czEucHVzaCh2b2lkIDApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHRzMTtcbiAgICB9XG59XG4iLCJpbXBvcnQge2V4dGVuZH0gZnJvbSBcImxvZGFzaFwiO1xyXG5jb25zdCBlbnRpdGllcyA9IHJlcXVpcmUoXCJlbnRpdGllc1wiKTtcclxuXHJcbmNvbnN0IFNUWUxFUyA9IHtcclxuICAgIFwiZWYwXCI6IFwiY29sb3I6IzAwMFwiLFxyXG4gICAgXCJlZjFcIjogXCJjb2xvcjojQTAwXCIsXHJcbiAgICBcImVmMlwiOiBcImNvbG9yOiMwQTBcIixcclxuICAgIFwiZWYzXCI6IFwiY29sb3I6I0E1MFwiLFxyXG4gICAgXCJlZjRcIjogXCJjb2xvcjojMDBBXCIsXHJcbiAgICBcImVmNVwiOiBcImNvbG9yOiNBMEFcIixcclxuICAgIFwiZWY2XCI6IFwiY29sb3I6IzBBQVwiLFxyXG4gICAgXCJlZjdcIjogXCJjb2xvcjojQUFBXCIsXHJcbiAgICBcImVmOFwiOiBcImNvbG9yOiM1NTVcIixcclxuICAgIFwiZWY5XCI6IFwiY29sb3I6I0Y1NVwiLFxyXG4gICAgXCJlZjEwXCI6IFwiY29sb3I6IzVGNVwiLFxyXG4gICAgXCJlZjExXCI6IFwiY29sb3I6I0ZGNVwiLFxyXG4gICAgXCJlZjEyXCI6IFwiY29sb3I6IzU1RlwiLFxyXG4gICAgXCJlZjEzXCI6IFwiY29sb3I6I0Y1RlwiLFxyXG4gICAgXCJlZjE0XCI6IFwiY29sb3I6IzVGRlwiLFxyXG4gICAgXCJlZjE1XCI6IFwiY29sb3I6I0ZGRlwiLFxyXG4gICAgXCJlYjBcIjogXCJiYWNrZ3JvdW5kLWNvbG9yOiMwMDBcIixcclxuICAgIFwiZWIxXCI6IFwiYmFja2dyb3VuZC1jb2xvcjojQTAwXCIsXHJcbiAgICBcImViMlwiOiBcImJhY2tncm91bmQtY29sb3I6IzBBMFwiLFxyXG4gICAgXCJlYjNcIjogXCJiYWNrZ3JvdW5kLWNvbG9yOiNBNTBcIixcclxuICAgIFwiZWI0XCI6IFwiYmFja2dyb3VuZC1jb2xvcjojMDBBXCIsXHJcbiAgICBcImViNVwiOiBcImJhY2tncm91bmQtY29sb3I6I0EwQVwiLFxyXG4gICAgXCJlYjZcIjogXCJiYWNrZ3JvdW5kLWNvbG9yOiMwQUFcIixcclxuICAgIFwiZWI3XCI6IFwiYmFja2dyb3VuZC1jb2xvcjojQUFBXCIsXHJcbiAgICBcImViOFwiOiBcImJhY2tncm91bmQtY29sb3I6IzU1NVwiLFxyXG4gICAgXCJlYjlcIjogXCJiYWNrZ3JvdW5kLWNvbG9yOiNGNTVcIixcclxuICAgIFwiZWIxMFwiOiBcImJhY2tncm91bmQtY29sb3I6IzVGNVwiLFxyXG4gICAgXCJlYjExXCI6IFwiYmFja2dyb3VuZC1jb2xvcjojRkY1XCIsXHJcbiAgICBcImViMTJcIjogXCJiYWNrZ3JvdW5kLWNvbG9yOiM1NUZcIixcclxuICAgIFwiZWIxM1wiOiBcImJhY2tncm91bmQtY29sb3I6I0Y1RlwiLFxyXG4gICAgXCJlYjE0XCI6IFwiYmFja2dyb3VuZC1jb2xvcjojNUZGXCIsXHJcbiAgICBcImViMTVcIjogXCJiYWNrZ3JvdW5kLWNvbG9yOiNGRkZcIlxyXG59O1xyXG5cclxuY29uc3QgdG9IZXhTdHJpbmcgPSBmdW5jdGlvbihudW06IGFueSkge1xyXG4gICAgbnVtID0gbnVtLnRvU3RyaW5nKDE2KTtcclxuICAgIHdoaWxlIChudW0ubGVuZ3RoIDwgMikge1xyXG4gICAgICAgIG51bSA9IFwiMFwiICsgbnVtO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIG51bTtcclxufTtcclxuXHJcblswLCAxLCAyLCAzLCA0LCA1XS5mb3JFYWNoKGZ1bmN0aW9uKHJlZCkge1xyXG4gICAgcmV0dXJuIFswLCAxLCAyLCAzLCA0LCA1XS5mb3JFYWNoKGZ1bmN0aW9uKGdyZWVuKSB7XHJcbiAgICAgICAgcmV0dXJuIFswLCAxLCAyLCAzLCA0LCA1XS5mb3JFYWNoKGZ1bmN0aW9uKGJsdWUpIHtcclxuICAgICAgICAgICAgY29uc3QgYyA9IDE2ICsgKHJlZCAqIDM2KSArIChncmVlbiAqIDYpICsgYmx1ZTtcclxuICAgICAgICAgICAgY29uc3QgciA9IHJlZCA+IDAgPyByZWQgKiA0MCArIDU1IDogMDtcclxuICAgICAgICAgICAgY29uc3QgZyA9IGdyZWVuID4gMCA/IGdyZWVuICogNDAgKyA1NSA6IDA7XHJcbiAgICAgICAgICAgIGNvbnN0IGIgPSBibHVlID4gMCA/IGJsdWUgKiA0MCArIDU1IDogMDtcclxuICAgICAgICAgICAgY29uc3QgcmdiID0gKChmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHJlZiA9IFtyLCBnLCBiXTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdHM6IGFueVtdID0gW107XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBqID0gMCwgbGVuID0gcmVmLmxlbmd0aDsgaiA8IGxlbjsgaisrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbiA9IHJlZltqXTtcclxuICAgICAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2godG9IZXhTdHJpbmcobikpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdHM7XHJcbiAgICAgICAgICAgIH0pKCkpLmpvaW4oXCJcIik7XHJcbiAgICAgICAgICAgIFNUWUxFU1tcImVmXCIgKyBjXSA9IFwiY29sb3I6I1wiICsgcmdiO1xyXG4gICAgICAgICAgICByZXR1cm4gU1RZTEVTW1wiZWJcIiArIGNdID0gXCJiYWNrZ3JvdW5kLWNvbG9yOiNcIiArIHJnYjtcclxuICAgICAgICB9KTtcclxuICAgIH0pO1xyXG59KTtcclxuXHJcbihmdW5jdGlvbigpIHtcclxuICAgIGNvbnN0IHJlc3VsdHM6IGFueVtdID0gW107XHJcbiAgICBmb3IgKGxldCBqID0gMDsgaiA8PSAyMzsgaisrKSB7IHJlc3VsdHMucHVzaChqKTsgfVxyXG4gICAgcmV0dXJuIHJlc3VsdHM7XHJcbn0pLmFwcGx5KHRoaXMpLmZvckVhY2goZnVuY3Rpb24oZ3JheTogYW55KSB7XHJcbiAgICBjb25zdCBjID0gZ3JheSArIDIzMjtcclxuICAgIGNvbnN0IGwgPSB0b0hleFN0cmluZyhncmF5ICogMTAgKyA4KTtcclxuICAgIFNUWUxFU1tcImVmXCIgKyBjXSA9IFwiY29sb3I6I1wiICsgbCArIGwgKyBsO1xyXG4gICAgcmV0dXJuIFNUWUxFU1tcImViXCIgKyBjXSA9IFwiYmFja2dyb3VuZC1jb2xvcjojXCIgKyBsICsgbCArIGw7XHJcbn0pO1xyXG5cclxuY29uc3QgZGVmYXVsdHMgPSB7XHJcbiAgICBmZzogXCIjRkZGXCIsXHJcbiAgICBiZzogXCIjMDAwXCIsXHJcbiAgICBuZXdsaW5lOiBmYWxzZSxcclxuICAgIGVzY2FwZVhNTDogZmFsc2UsXHJcbiAgICBzdHJlYW06IGZhbHNlXHJcbn07XHJcblxyXG5leHBvcnQgY2xhc3MgQ29udmVydCB7XHJcbiAgICBwcml2YXRlIG9wdHM6IGFueTtcclxuICAgIHByaXZhdGUgaW5wdXQ6IGFueVtdID0gW107XHJcbiAgICBwcml2YXRlIHN0YWNrOiBhbnlbXSA9IFtdO1xyXG4gICAgcHJpdmF0ZSBzdGlja3lTdGFjazogYW55W10gPSBbXTtcclxuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnM/OiBhbnkpIHtcclxuICAgICAgICBpZiAob3B0aW9ucyA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgIG9wdGlvbnMgPSB7fTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5vcHRzID0gZXh0ZW5kKHt9LCBkZWZhdWx0cywgb3B0aW9ucyk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHRvSHRtbChpbnB1dDogYW55KSB7XHJcbiAgICAgICAgdGhpcy5pbnB1dCA9IHR5cGVvZiBpbnB1dCA9PT0gXCJzdHJpbmdcIiA/IFtpbnB1dF0gOiBpbnB1dDtcclxuICAgICAgICBjb25zdCBidWY6IGFueVtdID0gW107XHJcbiAgICAgICAgdGhpcy5zdGlja3lTdGFjay5mb3JFYWNoKChlbGVtZW50KSA9PiB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmdlbmVyYXRlT3V0cHV0KGVsZW1lbnQudG9rZW4sIGVsZW1lbnQuZGF0YSwgZnVuY3Rpb24oY2h1bms6IGFueSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGJ1Zi5wdXNoKGNodW5rKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGhpcy5mb3JFYWNoKGZ1bmN0aW9uKGNodW5rOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGJ1Zi5wdXNoKGNodW5rKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLmlucHV0ID0gW107XHJcbiAgICAgICAgcmV0dXJuIGJ1Zi5qb2luKFwiXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZm9yRWFjaChjYWxsYmFjazogYW55KSB7XHJcbiAgICAgICAgbGV0IGJ1ZiA9IFwiXCI7XHJcbiAgICAgICAgdGhpcy5pbnB1dC5mb3JFYWNoKChjaHVuaykgPT4ge1xyXG4gICAgICAgICAgICBidWYgKz0gY2h1bms7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnRva2VuaXplKGJ1ZiwgKHRva2VuOiBhbnksIGRhdGE6IGFueSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5nZW5lcmF0ZU91dHB1dCh0b2tlbiwgZGF0YSwgY2FsbGJhY2spO1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMub3B0cy5zdHJlYW0pIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy51cGRhdGVTdGlja3lTdGFjayh0b2tlbiwgZGF0YSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGlmICh0aGlzLnN0YWNrLmxlbmd0aCkge1xyXG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2sodGhpcy5yZXNldFN0eWxlcygpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBnZW5lcmF0ZU91dHB1dCh0b2tlbjogYW55LCBkYXRhOiBhbnksIGNhbGxiYWNrOiBhbnkpIHtcclxuICAgICAgICBzd2l0Y2ggKHRva2VuKSB7XHJcbiAgICAgICAgICAgIGNhc2UgXCJ0ZXh0XCI6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2sodGhpcy5wdXNoVGV4dChkYXRhKSk7XHJcbiAgICAgICAgICAgIGNhc2UgXCJkaXNwbGF5XCI6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5oYW5kbGVEaXNwbGF5KGRhdGEsIGNhbGxiYWNrKTtcclxuICAgICAgICAgICAgY2FzZSBcInh0ZXJtMjU2XCI6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2sodGhpcy5wdXNoU3R5bGUoXCJlZlwiICsgZGF0YSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHVwZGF0ZVN0aWNreVN0YWNrKHRva2VuOiBhbnksIGRhdGE6IGFueSkge1xyXG4gICAgICAgIGNvbnN0IG5vdENhdGVnb3J5ID0gZnVuY3Rpb24oY2F0ZWdvcnk6IGFueSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oZTogYW55KSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gKGNhdGVnb3J5ID09PSBudWxsIHx8IGUuY2F0ZWdvcnkgIT09IGNhdGVnb3J5KSAmJiBjYXRlZ29yeSAhPT0gXCJhbGxcIjtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIGlmICh0b2tlbiAhPT0gXCJ0ZXh0XCIpIHtcclxuICAgICAgICAgICAgdGhpcy5zdGlja3lTdGFjayA9IHRoaXMuc3RpY2t5U3RhY2suZmlsdGVyKG5vdENhdGVnb3J5KHRoaXMuY2F0ZWdvcnlGb3JDb2RlKGRhdGEpKSk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnN0aWNreVN0YWNrLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgdG9rZW46IHRva2VuLFxyXG4gICAgICAgICAgICAgICAgZGF0YTogZGF0YSxcclxuICAgICAgICAgICAgICAgIGNhdGVnb3J5OiB0aGlzLmNhdGVnb3J5Rm9yQ29kZShkYXRhKVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBoYW5kbGVEaXNwbGF5KGNvZGU6IGFueSwgY2FsbGJhY2s6IGFueSkge1xyXG4gICAgICAgIGNvZGUgPSBwYXJzZUludChjb2RlLCAxMCk7XHJcbiAgICAgICAgaWYgKGNvZGUgPT09IC0xKSB7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrKFwiPGJyLz5cIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChjb2RlID09PSAwKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLnN0YWNrLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2sodGhpcy5yZXNldFN0eWxlcygpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoY29kZSA9PT0gMSkge1xyXG4gICAgICAgICAgICBjYWxsYmFjayh0aGlzLnB1c2hUYWcoXCJiXCIpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCgyIDwgY29kZSAmJiBjb2RlIDwgNSkpIHtcclxuICAgICAgICAgICAgY2FsbGJhY2sodGhpcy5wdXNoVGFnKFwidVwiKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICgoNCA8IGNvZGUgJiYgY29kZSA8IDcpKSB7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrKHRoaXMucHVzaFRhZyhcImJsaW5rXCIpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGNvZGUgPT09IDgpIHtcclxuICAgICAgICAgICAgY2FsbGJhY2sodGhpcy5wdXNoU3R5bGUoXCJkaXNwbGF5Om5vbmVcIikpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoY29kZSA9PT0gOSkge1xyXG4gICAgICAgICAgICBjYWxsYmFjayh0aGlzLnB1c2hUYWcoXCJzdHJpa2VcIikpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoY29kZSA9PT0gMjQpIHtcclxuICAgICAgICAgICAgY2FsbGJhY2sodGhpcy5jbG9zZVRhZyhcInVcIikpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoKDI5IDwgY29kZSAmJiBjb2RlIDwgMzgpKSB7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrKHRoaXMucHVzaFN0eWxlKFwiZWZcIiArIChjb2RlIC0gMzApKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChjb2RlID09PSAzOSkge1xyXG4gICAgICAgICAgICBjYWxsYmFjayh0aGlzLnB1c2hTdHlsZShcImNvbG9yOlwiICsgdGhpcy5vcHRzLmZnKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICgoMzkgPCBjb2RlICYmIGNvZGUgPCA0OCkpIHtcclxuICAgICAgICAgICAgY2FsbGJhY2sodGhpcy5wdXNoU3R5bGUoXCJlYlwiICsgKGNvZGUgLSA0MCkpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGNvZGUgPT09IDQ5KSB7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrKHRoaXMucHVzaFN0eWxlKFwiYmFja2dyb3VuZC1jb2xvcjpcIiArIHRoaXMub3B0cy5iZykpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoKDg5IDwgY29kZSAmJiBjb2RlIDwgOTgpKSB7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrKHRoaXMucHVzaFN0eWxlKFwiZWZcIiArICg4ICsgKGNvZGUgLSA5MCkpKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICgoOTkgPCBjb2RlICYmIGNvZGUgPCAxMDgpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayh0aGlzLnB1c2hTdHlsZShcImViXCIgKyAoOCArIChjb2RlIC0gMTAwKSkpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBjYXRlZ29yeUZvckNvZGUoY29kZTogYW55KSB7XHJcbiAgICAgICAgY29kZSA9IHBhcnNlSW50KGNvZGUsIDEwKTtcclxuICAgICAgICBpZiAoY29kZSA9PT0gMCkge1xyXG4gICAgICAgICAgICByZXR1cm4gXCJhbGxcIjtcclxuICAgICAgICB9IGVsc2UgaWYgKGNvZGUgPT09IDEpIHtcclxuICAgICAgICAgICAgcmV0dXJuIFwiYm9sZFwiO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoKDIgPCBjb2RlICYmIGNvZGUgPCA1KSkge1xyXG4gICAgICAgICAgICByZXR1cm4gXCJ1bmRlcmxpbmVcIjtcclxuICAgICAgICB9IGVsc2UgaWYgKCg0IDwgY29kZSAmJiBjb2RlIDwgNykpIHtcclxuICAgICAgICAgICAgcmV0dXJuIFwiYmxpbmtcIjtcclxuICAgICAgICB9IGVsc2UgaWYgKGNvZGUgPT09IDgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIFwiaGlkZVwiO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoY29kZSA9PT0gOSkge1xyXG4gICAgICAgICAgICByZXR1cm4gXCJzdHJpa2VcIjtcclxuICAgICAgICB9IGVsc2UgaWYgKCgyOSA8IGNvZGUgJiYgY29kZSA8IDM4KSB8fCBjb2RlID09PSAzOSB8fCAoODkgPCBjb2RlICYmIGNvZGUgPCA5OCkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIFwiZm9yZWdyb3VuZC1jb2xvclwiO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoKDM5IDwgY29kZSAmJiBjb2RlIDwgNDgpIHx8IGNvZGUgPT09IDQ5IHx8ICg5OSA8IGNvZGUgJiYgY29kZSA8IDEwOCkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIFwiYmFja2dyb3VuZC1jb2xvclwiO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHB1c2hUYWcodGFnOiBhbnksIHN0eWxlPzogYW55KSB7XHJcbiAgICAgICAgaWYgKHN0eWxlID09IG51bGwpIHtcclxuICAgICAgICAgICAgc3R5bGUgPSBcIlwiO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoc3R5bGUubGVuZ3RoICYmIHN0eWxlLmluZGV4T2YoXCI6XCIpID09PSAtMSkge1xyXG4gICAgICAgICAgICBzdHlsZSA9IFNUWUxFU1tzdHlsZV07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuc3RhY2sucHVzaCh0YWcpO1xyXG4gICAgICAgIHJldHVybiBbXCI8XCIgKyB0YWcsIChzdHlsZSA/IFwiIHN0eWxlPVxcXCJcIiArIHN0eWxlICsgXCJcXFwiXCIgOiB2b2lkIDApLCBcIj5cIl0uam9pbihcIlwiKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHB1c2hUZXh0KHRleHQ6IGFueSkge1xyXG4gICAgICAgIGlmICh0aGlzLm9wdHMuZXNjYXBlWE1MKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlbnRpdGllcy5lbmNvZGVYTUwodGV4dCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRleHQ7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgcHVzaFN0eWxlKHN0eWxlOiBhbnkpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5wdXNoVGFnKFwic3BhblwiLCBzdHlsZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBjbG9zZVRhZyhzdHlsZTogYW55KSB7XHJcbiAgICAgICAgbGV0IGxhc3Q6IGFueTtcclxuICAgICAgICBpZiAodGhpcy5zdGFjay5zbGljZSgtMSlbMF0gPT09IHN0eWxlKSB7XHJcbiAgICAgICAgICAgIGxhc3QgPSB0aGlzLnN0YWNrLnBvcCgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAobGFzdCAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBcIjwvXCIgKyBzdHlsZSArIFwiPlwiO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHJlc2V0U3R5bGVzKCkge1xyXG4gICAgICAgIGNvbnN0IHJlZiA9IFt0aGlzLnN0YWNrLCBbXV0sIHN0YWNrID0gcmVmWzBdO1xyXG4gICAgICAgIHRoaXMuc3RhY2sgPSByZWZbMV07XHJcbiAgICAgICAgcmV0dXJuIHN0YWNrLnJldmVyc2UoKS5tYXAoZnVuY3Rpb24odGFnKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBcIjwvXCIgKyB0YWcgKyBcIj5cIjtcclxuICAgICAgICB9KS5qb2luKFwiXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgdG9rZW5pemUodGV4dDogYW55LCBjYWxsYmFjazogYW55KSB7XHJcbiAgICAgICAgbGV0IGFuc2lNYXRjaCA9IGZhbHNlO1xyXG4gICAgICAgIGNvbnN0IGFuc2lIYW5kbGVyID0gMztcclxuICAgICAgICBjb25zdCByZW1vdmUgPSBmdW5jdGlvbihtOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIFwiXCI7XHJcbiAgICAgICAgfTtcclxuICAgICAgICBjb25zdCByZW1vdmVYdGVybTI1NiA9IGZ1bmN0aW9uKG06IGFueSwgZzE6IGFueSkge1xyXG4gICAgICAgICAgICBjYWxsYmFjayhcInh0ZXJtMjU2XCIsIGcxKTtcclxuICAgICAgICAgICAgcmV0dXJuIFwiXCI7XHJcbiAgICAgICAgfTtcclxuICAgICAgICBjb25zdCBuZXdsaW5lID0gKG06IGFueSkgPT4ge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5vcHRzLm5ld2xpbmUpIHtcclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrKFwiZGlzcGxheVwiLCAtMSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhcInRleHRcIiwgbSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIFwiXCI7XHJcbiAgICAgICAgfTtcclxuICAgICAgICBjb25zdCBhbnNpTWVzcyA9IGZ1bmN0aW9uKG06IGFueSwgZzE6IGFueSkge1xyXG4gICAgICAgICAgICBhbnNpTWF0Y2ggPSB0cnVlO1xyXG4gICAgICAgICAgICBsZXQgY29kZTogYW55O1xyXG4gICAgICAgICAgICBpZiAoZzEudHJpbSgpLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgZzEgPSBcIjBcIjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBnMSA9IGcxLnRyaW1SaWdodChcIjtcIikuc3BsaXQoXCI7XCIpO1xyXG4gICAgICAgICAgICBmb3IgKGxldCBvID0gMCwgbGVuID0gZzEubGVuZ3RoOyBvIDwgbGVuOyBvKyspIHtcclxuICAgICAgICAgICAgICAgIGNvZGUgPSBnMVtvXTtcclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrKFwiZGlzcGxheVwiLCBjb2RlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gXCJcIjtcclxuICAgICAgICB9O1xyXG4gICAgICAgIGNvbnN0IHJlYWxUZXh0ID0gZnVuY3Rpb24obTogYW55KSB7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrKFwidGV4dFwiLCBtKTtcclxuICAgICAgICAgICAgcmV0dXJuIFwiXCI7XHJcbiAgICAgICAgfTtcclxuICAgICAgICBjb25zdCB0b2tlbnMgPSBbXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHBhdHRlcm46IC9eXFx4MDgrLyxcclxuICAgICAgICAgICAgICAgIHN1YjogcmVtb3ZlXHJcbiAgICAgICAgICAgIH0sIHtcclxuICAgICAgICAgICAgICAgIHBhdHRlcm46IC9eXFx4MWJcXFtbMDEyXT9LLyxcclxuICAgICAgICAgICAgICAgIHN1YjogcmVtb3ZlXHJcbiAgICAgICAgICAgIH0sIHtcclxuICAgICAgICAgICAgICAgIHBhdHRlcm46IC9eXFx4MWJcXFszODs1OyhcXGQrKW0vLFxyXG4gICAgICAgICAgICAgICAgc3ViOiByZW1vdmVYdGVybTI1NlxyXG4gICAgICAgICAgICB9LCB7XHJcbiAgICAgICAgICAgICAgICBwYXR0ZXJuOiAvXlxcbisvLFxyXG4gICAgICAgICAgICAgICAgc3ViOiBuZXdsaW5lXHJcbiAgICAgICAgICAgIH0sIHtcclxuICAgICAgICAgICAgICAgIHBhdHRlcm46IC9eXFx4MWJcXFsoKD86XFxkezEsM307PykrfCltLyxcclxuICAgICAgICAgICAgICAgIHN1YjogYW5zaU1lc3NcclxuICAgICAgICAgICAgfSwge1xyXG4gICAgICAgICAgICAgICAgcGF0dGVybjogL15cXHgxYlxcWz9bXFxkO117MCwzfS8sXHJcbiAgICAgICAgICAgICAgICBzdWI6IHJlbW92ZVxyXG4gICAgICAgICAgICB9LCB7XHJcbiAgICAgICAgICAgICAgICBwYXR0ZXJuOiAvXihbXlxceDFiXFx4MDhcXG5dKykvLFxyXG4gICAgICAgICAgICAgICAgc3ViOiByZWFsVGV4dFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgXTtcclxuICAgICAgICBjb25zdCBwcm9jZXNzID0gZnVuY3Rpb24oaGFuZGxlcjogYW55LCBpOiBhbnkpIHtcclxuICAgICAgICAgICAgaWYgKGkgPiBhbnNpSGFuZGxlciAmJiBhbnNpTWF0Y2gpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGFuc2lNYXRjaCA9IGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRleHQgPSB0ZXh0LnJlcGxhY2UoaGFuZGxlci5wYXR0ZXJuLCBoYW5kbGVyLnN1Yik7XHJcbiAgICAgICAgfTtcclxuICAgICAgICBjb25zdCByZXN1bHRzMTogYW55W10gPSBbXTtcclxuICAgICAgICB3aGlsZSAoKGxlbmd0aCA9IHRleHQubGVuZ3RoKSA+IDApIHtcclxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDAsIG8gPSAwLCBsZW4gPSB0b2tlbnMubGVuZ3RoOyBvIDwgbGVuOyBpID0gKytvKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBoYW5kbGVyID0gdG9rZW5zW2ldO1xyXG4gICAgICAgICAgICAgICAgcHJvY2VzcyhoYW5kbGVyLCBpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodGV4dC5sZW5ndGggPT09IGxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHRzMS5wdXNoKHZvaWQgMCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdHMxO1xyXG4gICAgfVxyXG59XHJcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
