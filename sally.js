(function () {
    var parseCss = function (css) {
        var rules = {},
            tokens = css
                .replace(/^\s*|\s*\/\*.*\*\/\s*|\s$/g, "") // get rid of comments
                .replace(/\s*(\{|\}|;)\s*/g, "\0$1\0")
                .split(/\0/),
            type = { SELECTOR : "sel", LBRACE : "{", STMT : "stmt", SEMICOLON : ";", RBRACE : "}" },
            expect = [type.SELECTOR], new_expect,
            current_selector, token, property, value, pos;

        for (var i = 0, stop = tokens.length; i < stop; ++i) {
            token = tokens[i]; // throw away empty tokens
            if (token === "") continue;

            for (var j = 0, count = expect.length; j < count; ++j) {
                switch (expect[j]) {
                    case type.SELECTOR:
                        current_selector = token;
                        if (typeof rules[current_selector] !== "object") 
                            rules[current_selector] = {};

                        new_expect = [type.LBRACE];
                    break;

                    case type.LBRACE:
                        if (token !== "{" && j + 1 >= count) return false;
                        else j = count;

                        new_expect = [type.STMT, type.RBRACE];
                    break;

                    case type.STMT:
                        property = value = null;
                        if ((pos = token.indexOf(":")) === -1) break;
                        else j = count;

                        property = token.substring(0, pos).replace(/^\s+|\s+$/, "");
                        value = token.substring(pos + 1).replace(/^\s+|\s+$/, "");
                        important = false;

                        if ((pos = value.search(/!\s*important/)) !== -1) {
                            important = true;
                            value = value.substring(0, pos).replace(/^\s+|\s+$/, "");
                        }

                        rules[current_selector][property] = {
                            "value" : value,
                            "important" : important
                        };
                        
                        new_expect = [type.SEMICOLON, type.RBRACE];
                    break;

                    case type.SEMICOLON:
                        if (token !== ";" && j + 1 >= count) return false;
                        else j = count;

                        new_expect = [type.STMT, type.RBRACE];
                    break;

                    case type.RBRACE:
                        if (token !== "}" && j + 1 >= count) return false;
                        else j = count;

                        new_expect = [type.SELECTOR];
                    break;
                        
                }
            }

            expect = new_expect;
        }

        return rules;
    };

    var xhr = function () {
        try { return new XMLHttpRequest(); } catch(e) {}
        try { return new ActiveXObject("Msxml2.XMLHTTP.6.0"); } catch (e) {}
        try { return new ActiveXObject("Msxml2.XMLHTTP.3.0"); } catch (e) {}
        try { return new ActiveXObject("Msxml2.XMLHTTP"); } catch (e) {}
        try { return new ActiveXObject("Microsoft.XMLHTTP"); } catch (e) {}
        return null;
    };

    var jsName = function (name) {
        var arr = name.split(/-/),
            a = ("a").charCodeAt(0),
            z = ("z").charCodeAt(0),
            ret = "",
            x;

        ret += arr[0];
        for (var i = 1, stop = arr.length; i < stop; ++i) {
            x = arr[i].charCodeAt(0);

            if (x >= a && x <= z) {x -= 32;}
            
            ret += String.fromCharCode(x);
            ret += arr[i].substring(1);
        }

        return ret;
    };

    var clone = function (obj){
        if(obj == null || typeof(obj) != "object") return obj;

        var temp = new obj.constructor();
        for(var key in obj) temp[key] = clone(obj[key]);

        return temp;
    };

    var sally = function () {
        for (var i = 0, stop = document.styleSheets.length; i < stop; ++i) {
            if (!document.styleSheets[i].disabled && document.styleSheets[i].href) {
                var req = xhr();
                if (!req) return;

                req.open("GET", document.styleSheets[i].href);
                req.onreadystatechange = function () {
                    if (req.readyState === 4) {
                        var css = parseCss(req.responseText);
                        if (css === false) return;

                        var important = [];
                        var rules = [];
                        var max_specifity = 0;
                        var hovers = [];
                        var hover;

                        // specifity
                        for (var i in css) {
                            // :hover
                            if (i.indexOf(":hover") !== -1) {
                                hover = i.replace(/:hover/g, "");
                            } else hover = undefined;

                            for (var j in css[i]) {
                                var x = i;
                                var a = x.match(/#[A-Za-z0-9_-]+/g);
                                if (a === null) a = 0;
                                else a = a.length;
                                x = x.replace(/#[A-Za-z0-9_-]+/g, "");

                                var b = x.match(/\.[A-Za-z0-9_-]+/g);
                                if (b === null) b = 0;
                                else b = b.length;
                                x = x.replace(/\.[A-Za-z0-9_-]+/g, "").

                                // naive, but hopefully mostly will work
                                x = x.replace(/\[.+\]|:[a-zA-Z]+/g, "");
                                var c = x.match(/[A-Za-z0-9_-]+/g); 
                                if (c === null) c = 0;
                                else c = c.length;
                                var specifity = parseInt("" + a + b + c);

                                // hover?
                                if (hover !== undefined) {
                                    var elements = Sizzle(hover);
                                    
                                    for (var k = 0, stop = elements.length; k < stop; ++k) {
                                        var index = undefined;
                                        for (var l = 0, count = hovers.length; l < count; ++l) {
                                            if (hovers[l][0] === elements[k]) {
                                                index = l;
                                                break;
                                            }
                                        }

                                        if (typeof index === "undefined") {
                                            index = hovers.length;
                                            hovers[index] = [elements[k], {}];
                                        }

                                        if (typeof hovers[index][1][j] === "undefined")
                                            hovers[index][1][j] = { value : null, specifity : 0 };

                                        if (hovers[index][1][j].specifity <= specifity)
                                            hovers[index][1][j].value = css[i][j].value;
                                    }

                                    continue;
                                }

                                if (css[i][j].important) important[important.length] = [i, j, css[i][j].value];
                                else {
                                    if (specifity > max_specifity) max_specifity = specifity;

                                    if (typeof rules[specifity] !== "object") rules[specifity] = [];
                                    rules[specifity][rules[specifity].length] = [i, j, css[i][j].value];
                                }
                            }
                        }

                        // apply rules
                        for (var i = 0, stop = max_specifity + 1; i < stop; ++i) {
                            if (typeof rules[i] === "undefined") continue;

                            for (var j = 0, count = rules[i].length; j < count; ++j) {
                                var elements = Sizzle(rules[i][j][0]);

                                for (var k = 0, end = elements.length; k < end; ++k) {
                                    elements[k].style[jsName(rules[i][j][1])] = rules[i][j][2];
                                }
                            }
                        }

                        // hovers
                        for (var i = 0, stop = hovers.length; i < stop; ++i) {
                            (function (el, rules) {
                                el._sally_style = {};
                                el.attachEvent("onmouseover", function () {
                                    for (var i in rules) {
                                        el._sally_style[jsName(i)] = el.style[jsName(i)];
                                        el.style[jsName(i)] = rules[i].value;
                                    }
                                });
                                el.attachEvent("onmouseout", function () {
                                    for (var i in rules) {
                                        el.style[jsName(i)] = el._sally_style[jsName(i)];
                                    }
                                });
                            })(hovers[i][0], hovers[i][1]);
                        }
                    }
                };
                req.send();
            }
        }
    };

    window.attachEvent("onload", sally);
})();
