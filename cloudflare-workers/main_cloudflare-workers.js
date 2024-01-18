// src/utils/url.ts
var splitPath = (path)=>{
    const paths = path.split("/");
    if (paths[0] === "") {
        paths.shift();
    }
    return paths;
};
var splitRoutingPath = (path)=>{
    const groups = [];
    for(let i = 0;;){
        let replaced = false;
        path = path.replace(/\{[^}]+\}/g, (m)=>{
            const mark = `@\\${i}`;
            groups[i] = [
                mark,
                m
            ];
            i++;
            replaced = true;
            return mark;
        });
        if (!replaced) {
            break;
        }
    }
    const paths = path.split("/");
    if (paths[0] === "") {
        paths.shift();
    }
    for(let i = groups.length - 1; i >= 0; i--){
        const [mark] = groups[i];
        for(let j = paths.length - 1; j >= 0; j--){
            if (paths[j].indexOf(mark) !== -1) {
                paths[j] = paths[j].replace(mark, groups[i][1]);
                break;
            }
        }
    }
    return paths;
};
var patternCache = {};
var getPattern = (label)=>{
    if (label === "*") {
        return "*";
    }
    const match = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
    if (match) {
        if (!patternCache[label]) {
            if (match[2]) {
                patternCache[label] = [
                    label,
                    match[1],
                    new RegExp("^" + match[2] + "$")
                ];
            } else {
                patternCache[label] = [
                    label,
                    match[1],
                    true
                ];
            }
        }
        return patternCache[label];
    }
    return null;
};
var getPath = (request)=>{
    const match = request.url.match(/^https?:\/\/[^/]+(\/[^?]*)/);
    return match ? match[1] : "";
};
var getQueryStrings = (url)=>{
    const queryIndex = url.indexOf("?", 8);
    return queryIndex === -1 ? "" : "?" + url.slice(queryIndex + 1);
};
var getPathNoStrict = (request)=>{
    const result = getPath(request);
    return result.length > 1 && result[result.length - 1] === "/" ? result.slice(0, -1) : result;
};
var mergePath = function() {
    for(var _len = arguments.length, paths = new Array(_len), _key = 0; _key < _len; _key++){
        paths[_key] = arguments[_key];
    }
    let p = "";
    let endsWithSlash = false;
    for (let path of paths){
        if (p[p.length - 1] === "/") {
            p = p.slice(0, -1);
            endsWithSlash = true;
        }
        if (path[0] !== "/") {
            path = `/${path}`;
        }
        if (path === "/" && endsWithSlash) {
            p = `${p}/`;
        } else if (path !== "/") {
            p = `${p}${path}`;
        }
        if (path === "/" && p === "") {
            p = "/";
        }
    }
    return p;
};
var checkOptionalParameter = (path)=>{
    if (!path.match(/\:.+\?$/)) return null;
    const segments = path.split("/");
    const results = [];
    let basePath = "";
    segments.forEach((segment)=>{
        if (segment !== "" && !/\:/.test(segment)) {
            basePath += "/" + segment;
        } else if (/\:/.test(segment)) {
            if (/\?/.test(segment)) {
                if (results.length === 0 && basePath === "") {
                    results.push("/");
                } else {
                    results.push(basePath);
                }
                const optionalSegment = segment.replace("?", "");
                basePath += "/" + optionalSegment;
                results.push(basePath);
            } else {
                basePath += "/" + segment;
            }
        }
    });
    return results.filter((v, i, a)=>a.indexOf(v) === i);
};
var _decodeURI = (value)=>{
    if (!/[%+]/.test(value)) {
        return value;
    }
    if (value.indexOf("+") !== -1) {
        value = value.replace(/\+/g, " ");
    }
    return /%/.test(value) ? decodeURIComponent_(value) : value;
};
var _getQueryParam = (url, key, multiple)=>{
    let encoded;
    if (!multiple && key && !/[%+]/.test(key)) {
        let keyIndex2 = url.indexOf(`?${key}`, 8);
        if (keyIndex2 === -1) {
            keyIndex2 = url.indexOf(`&${key}`, 8);
        }
        while(keyIndex2 !== -1){
            const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
            if (trailingKeyCode === 61) {
                const valueIndex = keyIndex2 + key.length + 2;
                const endIndex = url.indexOf("&", valueIndex);
                return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
            } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
                return "";
            }
            keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
        }
        encoded = /[%+]/.test(url);
        if (!encoded) {
            return void 0;
        }
    }
    const results = {};
    encoded !== null && encoded !== void 0 ? encoded : encoded = /[%+]/.test(url);
    let keyIndex = url.indexOf("?", 8);
    while(keyIndex !== -1){
        const nextKeyIndex = url.indexOf("&", keyIndex + 1);
        let valueIndex = url.indexOf("=", keyIndex);
        if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
            valueIndex = -1;
        }
        let name = url.slice(keyIndex + 1, valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex);
        if (encoded) {
            name = _decodeURI(name);
        }
        keyIndex = nextKeyIndex;
        if (name === "") {
            continue;
        }
        let value;
        if (valueIndex === -1) {
            value = "";
        } else {
            value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
            if (encoded) {
                value = _decodeURI(value);
            }
        }
        if (multiple) {
            if (!(results[name] && Array.isArray(results[name]))) {
                results[name] = [];
            }
            results[name].push(value);
        } else {
            var _results_name;
            (_results_name = results[name]) !== null && _results_name !== void 0 ? _results_name : results[name] = value;
        }
    }
    return key ? results[key] : results;
};
var getQueryParam = _getQueryParam;
var getQueryParams = (url, key)=>{
    return _getQueryParam(url, key, true);
};
var decodeURIComponent_ = decodeURIComponent;

// src/utils/cookie.ts
var validCookieNameRegEx = /^[\w!#$%&'*.^`|~+-]+$/;
var validCookieValueRegEx = /^[ !#-:<-[\]-~]*$/;
var parse = (cookie, name)=>{
    const pairs = cookie.trim().split(";");
    return pairs.reduce((parsedCookie, pairStr)=>{
        pairStr = pairStr.trim();
        const valueStartPos = pairStr.indexOf("=");
        if (valueStartPos === -1) return parsedCookie;
        const cookieName = pairStr.substring(0, valueStartPos).trim();
        if (name && name !== cookieName || !validCookieNameRegEx.test(cookieName)) return parsedCookie;
        let cookieValue = pairStr.substring(valueStartPos + 1).trim();
        if (cookieValue.startsWith('"') && cookieValue.endsWith('"')) cookieValue = cookieValue.slice(1, -1);
        if (validCookieValueRegEx.test(cookieValue)) parsedCookie[cookieName] = decodeURIComponent_(cookieValue);
        return parsedCookie;
    }, {});
};
var _serialize = function(name, value) {
    let opt = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
    let cookie = `${name}=${value}`;
    if (opt && typeof opt.maxAge === "number" && opt.maxAge >= 0) {
        cookie += `; Max-Age=${Math.floor(opt.maxAge)}`;
    }
    if (opt.domain) {
        cookie += `; Domain=${opt.domain}`;
    }
    if (opt.path) {
        cookie += `; Path=${opt.path}`;
    }
    if (opt.expires) {
        cookie += `; Expires=${opt.expires.toUTCString()}`;
    }
    if (opt.httpOnly) {
        cookie += "; HttpOnly";
    }
    if (opt.secure) {
        cookie += "; Secure";
    }
    if (opt.sameSite) {
        cookie += `; SameSite=${opt.sameSite}`;
    }
    if (opt.partitioned) {
        cookie += "; Partitioned";
    }
    return cookie;
};
var serialize = function(name, value) {
    let opt = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
    value = encodeURIComponent(value);
    return _serialize(name, value, opt);
};

// src/helper/html/index.ts
var raw = (value, callbacks)=>{
    const escapedString = new String(value);
    escapedString.isEscaped = true;
    escapedString.callbacks = callbacks;
    return escapedString;
};

// src/utils/html.ts
var HtmlEscapedCallbackPhase = {
    Stringify: 1,
    BeforeStream: 2,
    Stream: 3
};
var resolveCallback = async (str, phase, preserveCallbacks, context, buffer)=>{
    const callbacks = str.callbacks;
    if (!(callbacks === null || callbacks === void 0 ? void 0 : callbacks.length)) {
        return Promise.resolve(str);
    }
    if (buffer) {
        buffer[0] += str;
    } else {
        buffer = [
            str
        ];
    }
    const resStr = Promise.all(callbacks.map((c)=>c({
            phase,
            buffer,
            context
        }))).then((res)=>Promise.all(res.filter(Boolean).map((str2)=>resolveCallback(str2, phase, false, context, buffer))).then(()=>buffer[0]));
    if (preserveCallbacks) {
        return raw(await resStr, callbacks);
    } else {
        return resStr;
    }
};

// src/utils/stream.ts
var StreamingApi = class {
    async write(input) {
        try {
            if (typeof input === "string") {
                input = this.encoder.encode(input);
            }
            await this.writer.write(input);
        } catch (e) {}
        return this;
    }
    async writeln(input) {
        await this.write(input + "\n");
        return this;
    }
    sleep(ms) {
        return new Promise((res)=>setTimeout(res, ms));
    }
    async close() {
        try {
            await this.writer.close();
        } catch (e) {}
    }
    async pipe(body) {
        this.writer.releaseLock();
        await body.pipeTo(this.writable, {
            preventClose: true
        });
        this.writer = this.writable.getWriter();
    }
    async onAbort(listener) {
        this.abortSubscribers.push(listener);
    }
    constructor(writable, _readable){
        this.abortSubscribers = [];
        this.writable = writable;
        this.writer = writable.getWriter();
        this.encoder = new TextEncoder();
        const reader = _readable.getReader();
        this.responseReadable = new ReadableStream({
            async pull (controller) {
                const { done, value } = await reader.read();
                if (done) {
                    controller.close();
                } else {
                    controller.enqueue(value);
                }
            },
            cancel: ()=>{
                this.abortSubscribers.forEach((subscriber)=>subscriber());
            }
        });
    }
};

var __accessCheck$2 = (obj, member, msg)=>{
    if (!member.has(obj)) throw TypeError("Cannot " + msg);
};
var __privateGet$2 = (obj, member, getter)=>{
    __accessCheck$2(obj, member, "read from private field");
    return getter ? getter.call(obj) : member.get(obj);
};
var __privateAdd$2 = (obj, member, value)=>{
    if (member.has(obj)) throw TypeError("Cannot add the same private member more than once");
    member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
};
var __privateSet$2 = (obj, member, value, setter)=>{
    __accessCheck$2(obj, member, "write to private field");
    setter ? setter.call(obj, value) : member.set(obj, value);
    return value;
};
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var _status, _executionCtx, _headers, _preparedHeaders, _res, _isFresh;
var Context = class {
    get event() {
        if (__privateGet$2(this, _executionCtx) && "respondWith" in __privateGet$2(this, _executionCtx)) {
            return __privateGet$2(this, _executionCtx);
        } else {
            throw Error("This context has no FetchEvent");
        }
    }
    get executionCtx() {
        if (__privateGet$2(this, _executionCtx)) {
            return __privateGet$2(this, _executionCtx);
        } else {
            throw Error("This context has no ExecutionContext");
        }
    }
    get res() {
        __privateSet$2(this, _isFresh, false);
        return __privateGet$2(this, _res) || __privateSet$2(this, _res, new Response("404 Not Found", {
            status: 404
        }));
    }
    set res(_res2) {
        __privateSet$2(this, _isFresh, false);
        if (__privateGet$2(this, _res) && _res2) {
            __privateGet$2(this, _res).headers.delete("content-type");
            for (const [k, v] of __privateGet$2(this, _res).headers.entries()){
                if (k === "set-cookie") {
                    const cookies = __privateGet$2(this, _res).headers.getSetCookie();
                    _res2.headers.delete("set-cookie");
                    for (const cookie of cookies){
                        _res2.headers.append("set-cookie", cookie);
                    }
                } else {
                    _res2.headers.set(k, v);
                }
            }
        }
        __privateSet$2(this, _res, _res2);
        this.finalized = true;
    }
    get var() {
        return {
            ...this._var
        };
    }
    get runtime() {
        var _global_process_release, _global_process;
        const global = globalThis;
        if ((global === null || global === void 0 ? void 0 : global.Deno) !== void 0) {
            return "deno";
        }
        if ((global === null || global === void 0 ? void 0 : global.Bun) !== void 0) {
            return "bun";
        }
        if (typeof (global === null || global === void 0 ? void 0 : global.WebSocketPair) === "function") {
            return "workerd";
        }
        if (typeof (global === null || global === void 0 ? void 0 : global.EdgeRuntime) === "string") {
            return "edge-light";
        }
        if ((global === null || global === void 0 ? void 0 : global.fastly) !== void 0) {
            return "fastly";
        }
        if ((global === null || global === void 0 ? void 0 : global.__lagon__) !== void 0) {
            return "lagon";
        }
        if ((global === null || global === void 0 ? void 0 : (_global_process = global.process) === null || _global_process === void 0 ? void 0 : (_global_process_release = _global_process.release) === null || _global_process_release === void 0 ? void 0 : _global_process_release.name) === "node") {
            return "node";
        }
        return "other";
    }
    constructor(req, options){
        var _this = this;
        this.env = {};
        this._var = {};
        this.finalized = false;
        this.error = void 0;
        __privateAdd$2(this, _status, 200);
        __privateAdd$2(this, _executionCtx, void 0);
        __privateAdd$2(this, _headers, void 0);
        __privateAdd$2(this, _preparedHeaders, void 0);
        __privateAdd$2(this, _res, void 0);
        __privateAdd$2(this, _isFresh, true);
        this.renderer = (content)=>this.html(content);
        this.notFoundHandler = ()=>new Response();
        this.render = function() {
            for(var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++){
                args[_key] = arguments[_key];
            }
            return _this.renderer(...args);
        };
        this.setRenderer = (renderer)=>{
            this.renderer = renderer;
        };
        this.header = (name, value, options)=>{
            if (value === void 0) {
                if (__privateGet$2(this, _headers)) {
                    __privateGet$2(this, _headers).delete(name);
                } else if (__privateGet$2(this, _preparedHeaders)) {
                    delete __privateGet$2(this, _preparedHeaders)[name.toLocaleLowerCase()];
                }
                if (this.finalized) {
                    this.res.headers.delete(name);
                }
                return;
            }
            if (options === null || options === void 0 ? void 0 : options.append) {
                if (!__privateGet$2(this, _headers)) {
                    __privateSet$2(this, _isFresh, false);
                    __privateSet$2(this, _headers, new Headers(__privateGet$2(this, _preparedHeaders)));
                    __privateSet$2(this, _preparedHeaders, {});
                }
                __privateGet$2(this, _headers).append(name, value);
            } else {
                if (__privateGet$2(this, _headers)) {
                    __privateGet$2(this, _headers).set(name, value);
                } else {
                    var __privateGet1;
                    (__privateGet1 = __privateGet$2(this, _preparedHeaders)) !== null && __privateGet1 !== void 0 ? __privateGet1 : __privateSet$2(this, _preparedHeaders, {});
                    __privateGet$2(this, _preparedHeaders)[name.toLowerCase()] = value;
                }
            }
            if (this.finalized) {
                if (options === null || options === void 0 ? void 0 : options.append) {
                    this.res.headers.append(name, value);
                } else {
                    this.res.headers.set(name, value);
                }
            }
        };
        this.status = (status)=>{
            __privateSet$2(this, _isFresh, false);
            __privateSet$2(this, _status, status);
        };
        this.set = (key, value)=>{
            var _this__var;
            (_this__var = this._var) !== null && _this__var !== void 0 ? _this__var : this._var = {};
            this._var[key] = value;
        };
        this.get = (key)=>{
            return this._var ? this._var[key] : void 0;
        };
        this.newResponse = (data, arg, headers)=>{
            if (__privateGet$2(this, _isFresh) && !headers && !arg && __privateGet$2(this, _status) === 200) {
                return new Response(data, {
                    headers: __privateGet$2(this, _preparedHeaders)
                });
            }
            if (arg && typeof arg !== "number") {
                this.res = new Response(data, arg);
            }
            const status = typeof arg === "number" ? arg : arg ? arg.status : __privateGet$2(this, _status);
            var __privateGet1;
            (__privateGet1 = __privateGet$2(this, _preparedHeaders)) !== null && __privateGet1 !== void 0 ? __privateGet1 : __privateSet$2(this, _preparedHeaders, {});
            var __privateGet2;
            (__privateGet2 = __privateGet$2(this, _headers)) !== null && __privateGet2 !== void 0 ? __privateGet2 : __privateSet$2(this, _headers, new Headers());
            for (const [k, v] of Object.entries(__privateGet$2(this, _preparedHeaders))){
                __privateGet$2(this, _headers).set(k, v);
            }
            if (__privateGet$2(this, _res)) {
                __privateGet$2(this, _res).headers.forEach((v, k)=>{
                    var __privateGet1;
                    (__privateGet1 = __privateGet$2(this, _headers)) === null || __privateGet1 === void 0 ? void 0 : __privateGet1.set(k, v);
                });
                for (const [k, v] of Object.entries(__privateGet$2(this, _preparedHeaders))){
                    __privateGet$2(this, _headers).set(k, v);
                }
            }
            headers !== null && headers !== void 0 ? headers : headers = {};
            for (const [k, v] of Object.entries(headers)){
                if (typeof v === "string") {
                    __privateGet$2(this, _headers).set(k, v);
                } else {
                    __privateGet$2(this, _headers).delete(k);
                    for (const v2 of v){
                        __privateGet$2(this, _headers).append(k, v2);
                    }
                }
            }
            return new Response(data, {
                status,
                headers: __privateGet$2(this, _headers)
            });
        };
        this.body = (data, arg, headers)=>{
            return typeof arg === "number" ? this.newResponse(data, arg, headers) : this.newResponse(data, arg);
        };
        this.text = (text, arg, headers)=>{
            if (!__privateGet$2(this, _preparedHeaders)) {
                if (__privateGet$2(this, _isFresh) && !headers && !arg) {
                    return new Response(text);
                }
                __privateSet$2(this, _preparedHeaders, {});
            }
            __privateGet$2(this, _preparedHeaders)["content-type"] = TEXT_PLAIN;
            return typeof arg === "number" ? this.newResponse(text, arg, headers) : this.newResponse(text, arg);
        };
        this.json = (object, arg, headers)=>{
            const body = JSON.stringify(object);
            var __privateGet1;
            (__privateGet1 = __privateGet$2(this, _preparedHeaders)) !== null && __privateGet1 !== void 0 ? __privateGet1 : __privateSet$2(this, _preparedHeaders, {});
            __privateGet$2(this, _preparedHeaders)["content-type"] = "application/json; charset=UTF-8";
            return typeof arg === "number" ? this.newResponse(body, arg, headers) : this.newResponse(body, arg);
        };
        this.jsonT = (object, arg, headers)=>{
            return this.json(object, arg, headers);
        };
        this.html = (html, arg, headers)=>{
            var __privateGet1;
            (__privateGet1 = __privateGet$2(this, _preparedHeaders)) !== null && __privateGet1 !== void 0 ? __privateGet1 : __privateSet$2(this, _preparedHeaders, {});
            __privateGet$2(this, _preparedHeaders)["content-type"] = "text/html; charset=UTF-8";
            if (typeof html === "object") {
                if (!(html instanceof Promise)) {
                    html = html.toString();
                }
                if (html instanceof Promise) {
                    return html.then((html2)=>resolveCallback(html2, HtmlEscapedCallbackPhase.Stringify, false, {})).then((html2)=>{
                        return typeof arg === "number" ? this.newResponse(html2, arg, headers) : this.newResponse(html2, arg);
                    });
                }
            }
            return typeof arg === "number" ? this.newResponse(html, arg, headers) : this.newResponse(html, arg);
        };
        this.redirect = function(location) {
            let status = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 302;
            var __privateGet1;
            (__privateGet1 = __privateGet$2(_this, _headers)) !== null && __privateGet1 !== void 0 ? __privateGet1 : __privateSet$2(_this, _headers, new Headers());
            __privateGet$2(_this, _headers).set("Location", location);
            return _this.newResponse(null, status);
        };
        this.streamText = (cb, arg, headers)=>{
            headers !== null && headers !== void 0 ? headers : headers = {};
            this.header("content-type", TEXT_PLAIN);
            this.header("x-content-type-options", "nosniff");
            this.header("transfer-encoding", "chunked");
            return this.stream(cb, arg, headers);
        };
        this.stream = (cb, arg, headers)=>{
            const { readable, writable } = new TransformStream();
            const stream = new StreamingApi(writable, readable);
            cb(stream).finally(()=>stream.close());
            return typeof arg === "number" ? this.newResponse(stream.responseReadable, arg, headers) : this.newResponse(stream.responseReadable, arg);
        };
        this.cookie = (name, value, opt)=>{
            const cookie = serialize(name, value, opt);
            this.header("set-cookie", cookie, {
                append: true
            });
        };
        this.notFound = ()=>{
            return this.notFoundHandler(this);
        };
        this.req = req;
        if (options) {
            __privateSet$2(this, _executionCtx, options.executionCtx);
            this.env = options.env;
            if (options.notFoundHandler) {
                this.notFoundHandler = options.notFoundHandler;
            }
        }
    }
};
_status = new WeakMap();
_executionCtx = new WeakMap();
_headers = new WeakMap();
_preparedHeaders = new WeakMap();
_res = new WeakMap();
_isFresh = new WeakMap();

// src/compose.ts
var compose = (middleware, onError, onNotFound)=>{
    return (context, next)=>{
        let index = -1;
        return dispatch(0);
        async function dispatch(i) {
            if (i <= index) {
                throw new Error("next() called multiple times");
            }
            index = i;
            let res;
            let isError = false;
            let handler;
            if (middleware[i]) {
                handler = middleware[i][0][0];
                if (context instanceof Context) {
                    context.req.routeIndex = i;
                }
            } else {
                handler = i === middleware.length && next || void 0;
            }
            if (!handler) {
                if (context instanceof Context && context.finalized === false && onNotFound) {
                    res = await onNotFound(context);
                }
            } else {
                try {
                    res = await handler(context, ()=>{
                        return dispatch(i + 1);
                    });
                } catch (err) {
                    if (err instanceof Error && context instanceof Context && onError) {
                        context.error = err;
                        res = await onError(err, context);
                        isError = true;
                    } else {
                        throw err;
                    }
                }
            }
            if (res && (context.finalized === false || isError)) {
                context.res = res;
            }
            return context;
        }
    };
};

// src/http-exception.ts
var HTTPException = class extends Error {
    getResponse() {
        if (this.res) {
            return this.res;
        }
        return new Response(this.message, {
            status: this.status
        });
    }
    constructor(status = 500, options){
        super(options === null || options === void 0 ? void 0 : options.message);
        this.res = options === null || options === void 0 ? void 0 : options.res;
        this.status = status;
    }
};

// src/utils/body.ts
var isArrayField = (value)=>{
    return Array.isArray(value);
};
var parseBody = async function(request) {
    let options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {
        all: false
    };
    let body = {};
    const contentType = request.headers.get("Content-Type");
    if (contentType && (contentType.startsWith("multipart/form-data") || contentType.startsWith("application/x-www-form-urlencoded"))) {
        const formData = await request.formData();
        if (formData) {
            const form = {};
            formData.forEach((value, key)=>{
                const shouldParseAllValues = options.all || key.slice(-2) === "[]";
                if (!shouldParseAllValues) {
                    form[key] = value;
                    return;
                }
                if (form[key] && isArrayField(form[key])) {
                    form[key].push(value);
                    return;
                }
                if (form[key]) {
                    form[key] = [
                        form[key],
                        value
                    ];
                    return;
                }
                form[key] = value;
            });
            body = form;
        }
    }
    return body;
};

var __accessCheck$1 = (obj, member, msg)=>{
    if (!member.has(obj)) throw TypeError("Cannot " + msg);
};
var __privateGet$1 = (obj, member, getter)=>{
    __accessCheck$1(obj, member, "read from private field");
    return getter ? getter.call(obj) : member.get(obj);
};
var __privateAdd$1 = (obj, member, value)=>{
    if (member.has(obj)) throw TypeError("Cannot add the same private member more than once");
    member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
};
var __privateSet$1 = (obj, member, value, setter)=>{
    __accessCheck$1(obj, member, "write to private field");
    setter ? setter.call(obj, value) : member.set(obj, value);
    return value;
};
var _validatedData, _matchResult;
var HonoRequest = class {
    param(key) {
        if (key) {
            const param = __privateGet$1(this, _matchResult)[1] ? __privateGet$1(this, _matchResult)[1][__privateGet$1(this, _matchResult)[0][this.routeIndex][1][key]] : __privateGet$1(this, _matchResult)[0][this.routeIndex][1][key];
            return param ? /\%/.test(param) ? decodeURIComponent_(param) : param : void 0;
        } else {
            const decoded = {};
            const keys = Object.keys(__privateGet$1(this, _matchResult)[0][this.routeIndex][1]);
            for(let i = 0, len = keys.length; i < len; i++){
                const key2 = keys[i];
                const value = __privateGet$1(this, _matchResult)[1] ? __privateGet$1(this, _matchResult)[1][__privateGet$1(this, _matchResult)[0][this.routeIndex][1][key2]] : __privateGet$1(this, _matchResult)[0][this.routeIndex][1][key2];
                if (value && typeof value === "string") {
                    decoded[key2] = /\%/.test(value) ? decodeURIComponent_(value) : value;
                }
            }
            return decoded;
        }
    }
    query(key) {
        return getQueryParam(this.url, key);
    }
    queries(key) {
        return getQueryParams(this.url, key);
    }
    header(name) {
        var _this_raw_headers_get;
        if (name) return (_this_raw_headers_get = this.raw.headers.get(name.toLowerCase())) !== null && _this_raw_headers_get !== void 0 ? _this_raw_headers_get : void 0;
        const headerData = {};
        this.raw.headers.forEach((value, key)=>{
            headerData[key] = value;
        });
        return headerData;
    }
    cookie(key) {
        const cookie = this.raw.headers.get("Cookie");
        if (!cookie) return;
        const obj = parse(cookie);
        if (key) {
            const value = obj[key];
            return value;
        } else {
            return obj;
        }
    }
    async parseBody(options) {
        if (this.bodyCache.parsedBody) return this.bodyCache.parsedBody;
        const parsedBody = await parseBody(this, options);
        this.bodyCache.parsedBody = parsedBody;
        return parsedBody;
    }
    json() {
        return this.cachedBody("json");
    }
    text() {
        return this.cachedBody("text");
    }
    arrayBuffer() {
        return this.cachedBody("arrayBuffer");
    }
    blob() {
        return this.cachedBody("blob");
    }
    formData() {
        return this.cachedBody("formData");
    }
    addValidatedData(target, data) {
        __privateGet$1(this, _validatedData)[target] = data;
    }
    valid(target) {
        return __privateGet$1(this, _validatedData)[target];
    }
    get url() {
        return this.raw.url;
    }
    get method() {
        return this.raw.method;
    }
    get matchedRoutes() {
        return __privateGet$1(this, _matchResult)[0].map((param)=>{
            let [[, route]] = param;
            return route;
        });
    }
    get routePath() {
        return __privateGet$1(this, _matchResult)[0].map((param)=>{
            let [[, route]] = param;
            return route;
        })[this.routeIndex].path;
    }
    get headers() {
        return this.raw.headers;
    }
    get body() {
        return this.raw.body;
    }
    get bodyUsed() {
        return this.raw.bodyUsed;
    }
    get integrity() {
        return this.raw.integrity;
    }
    get keepalive() {
        return this.raw.keepalive;
    }
    get referrer() {
        return this.raw.referrer;
    }
    get signal() {
        return this.raw.signal;
    }
    constructor(request, path = "/", matchResult = [
        []
    ]){
        __privateAdd$1(this, _validatedData, void 0);
        __privateAdd$1(this, _matchResult, void 0);
        this.routeIndex = 0;
        this.bodyCache = {};
        this.cachedBody = (key)=>{
            const { bodyCache, raw } = this;
            const cachedBody = bodyCache[key];
            if (cachedBody) return cachedBody;
            if (bodyCache.arrayBuffer) {
                return (async ()=>{
                    return await new Response(bodyCache.arrayBuffer)[key]();
                })();
            }
            return bodyCache[key] = raw[key]();
        };
        this.raw = request;
        this.path = path;
        __privateSet$1(this, _matchResult, matchResult);
        __privateSet$1(this, _validatedData, {});
    }
};
_validatedData = new WeakMap();
_matchResult = new WeakMap();

// src/router.ts
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = [
    "get",
    "post",
    "put",
    "delete",
    "options",
    "patch"
];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = class extends Error {
};

var __accessCheck = (obj, member, msg)=>{
    if (!member.has(obj)) throw TypeError("Cannot " + msg);
};
var __privateGet = (obj, member, getter)=>{
    __accessCheck(obj, member, "read from private field");
    return getter ? getter.call(obj) : member.get(obj);
};
var __privateAdd = (obj, member, value)=>{
    if (member.has(obj)) throw TypeError("Cannot add the same private member more than once");
    member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
};
var __privateSet = (obj, member, value, setter)=>{
    __accessCheck(obj, member, "write to private field");
    setter ? setter.call(obj, value) : member.set(obj, value);
    return value;
};
var COMPOSED_HANDLER = Symbol("composedHandler");
function defineDynamicClass() {
    return class {
    };
}
var notFoundHandler = (c)=>{
    return c.text("404 Not Found", 404);
};
var errorHandler = (err, c)=>{
    if (err instanceof HTTPException) {
        return err.getResponse();
    }
    console.error(err);
    const message = "Internal Server Error";
    return c.text(message, 500);
};
var _path;
var _Hono = class extends defineDynamicClass() {
    clone() {
        const clone = new _Hono({
            router: this.router,
            getPath: this.getPath
        });
        clone.routes = this.routes;
        return clone;
    }
    route(path, app) {
        const subApp = this.basePath(path);
        if (!app) {
            return subApp;
        }
        app.routes.map((r)=>{
            let handler;
            if (app.errorHandler === errorHandler) {
                handler = r.handler;
            } else {
                handler = async (c, next)=>(await compose([], app.errorHandler)(c, ()=>r.handler(c, next))).res;
                handler[COMPOSED_HANDLER] = r.handler;
            }
            subApp.addRoute(r.method, r.path, handler);
        });
        return this;
    }
    basePath(path) {
        const subApp = this.clone();
        subApp._basePath = mergePath(this._basePath, path);
        return subApp;
    }
    showRoutes() {
        const length = 8;
        this.routes.map((route)=>{
            console.log(`\x1B[32m${route.method}\x1B[0m ${" ".repeat(length - route.method.length)} ${route.path}`);
        });
    }
    mount(path, applicationHandler, optionHandler) {
        const mergedPath = mergePath(this._basePath, path);
        const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
        const handler = async (c, next)=>{
            let executionContext = void 0;
            try {
                executionContext = c.executionCtx;
            } catch (e) {}
            const options = optionHandler ? optionHandler(c) : [
                c.env,
                executionContext
            ];
            const optionsArray = Array.isArray(options) ? options : [
                options
            ];
            const queryStrings = getQueryStrings(c.req.url);
            const res = await applicationHandler(new Request(new URL((c.req.path.slice(pathPrefixLength) || "/") + queryStrings, c.req.url), c.req.raw), ...optionsArray);
            if (res) return res;
            await next();
        };
        this.addRoute(METHOD_NAME_ALL, mergePath(path, "*"), handler);
        return this;
    }
    get routerName() {
        this.matchRoute("GET", "/");
        return this.router.name;
    }
    addRoute(method, path, handler) {
        method = method.toUpperCase();
        path = mergePath(this._basePath, path);
        const r = {
            path,
            method,
            handler
        };
        this.router.add(method, path, [
            handler,
            r
        ]);
        this.routes.push(r);
    }
    matchRoute(method, path) {
        return this.router.match(method, path);
    }
    handleError(err, c) {
        if (err instanceof Error) {
            return this.errorHandler(err, c);
        }
        throw err;
    }
    dispatch(request, executionCtx, env, method) {
        if (method === "HEAD") {
            return (async ()=>new Response(null, await this.dispatch(request, executionCtx, env, "GET")))();
        }
        const path = this.getPath(request, {
            env
        });
        const matchResult = this.matchRoute(method, path);
        const c = new Context(new HonoRequest(request, path, matchResult), {
            env,
            executionCtx,
            notFoundHandler: this.notFoundHandler
        });
        if (matchResult[0].length === 1) {
            let res;
            try {
                res = matchResult[0][0][0][0](c, async ()=>{});
                if (!res) {
                    return this.notFoundHandler(c);
                }
            } catch (err) {
                return this.handleError(err, c);
            }
            if (res instanceof Response) return res;
            return (async ()=>{
                let awaited;
                try {
                    awaited = await res;
                    if (!awaited) {
                        return this.notFoundHandler(c);
                    }
                } catch (err) {
                    return this.handleError(err, c);
                }
                return awaited;
            })();
        }
        const composed = compose(matchResult[0], this.errorHandler, this.notFoundHandler);
        return (async ()=>{
            try {
                const context = await composed(c);
                if (!context.finalized) {
                    throw new Error("Context is not finalized. You may forget returning Response object or `await next()`");
                }
                return context.res;
            } catch (err) {
                return this.handleError(err, c);
            }
        })();
    }
    constructor(options = {}){
        var _this;
        super(), _this = this;
        this._basePath = "/";
        __privateAdd(this, _path, "/");
        this.routes = [];
        this.notFoundHandler = notFoundHandler;
        this.errorHandler = errorHandler;
        this.onError = (handler)=>{
            this.errorHandler = handler;
            return this;
        };
        this.notFound = (handler)=>{
            this.notFoundHandler = handler;
            return this;
        };
        this.head = ()=>{
            console.warn("`app.head()` is no longer used. `app.get()` implicitly handles the HEAD method.");
            return this;
        };
        this.handleEvent = (event)=>{
            return this.dispatch(event.request, event, void 0, event.request.method);
        };
        this.fetch = (request, Env, executionCtx)=>{
            return this.dispatch(request, executionCtx, Env, request.method);
        };
        this.request = (input, requestInit, Env, executionCtx)=>{
            if (input instanceof Request) {
                if (requestInit !== void 0) {
                    input = new Request(input, requestInit);
                }
                return this.fetch(input, Env, executionCtx);
            }
            input = input.toString();
            const path = /^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`;
            const req = new Request(path, requestInit);
            return this.fetch(req, Env, executionCtx);
        };
        this.fire = ()=>{
            addEventListener("fetch", (event)=>{
                event.respondWith(this.dispatch(event.request, event, void 0, event.request.method));
            });
        };
        const allMethods = [
            ...METHODS,
            METHOD_NAME_ALL_LOWERCASE
        ];
        allMethods.map((method)=>{
            var _this = this;
            this[method] = function(args1) {
                for(var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++){
                    args[_key - 1] = arguments[_key];
                }
                if (typeof args1 === "string") {
                    __privateSet(_this, _path, args1);
                } else {
                    _this.addRoute(method, __privateGet(_this, _path), args1);
                }
                args.map((handler)=>{
                    if (typeof handler !== "string") {
                        _this.addRoute(method, __privateGet(_this, _path), handler);
                    }
                });
                return _this;
            };
        });
        this.on = function(method, path) {
            for(var _len = arguments.length, handlers = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++){
                handlers[_key - 2] = arguments[_key];
            }
            if (!method) return _this;
            __privateSet(_this, _path, path);
            for (const m of [
                method
            ].flat()){
                handlers.map((handler)=>{
                    _this.addRoute(m.toUpperCase(), __privateGet(_this, _path), handler);
                });
            }
            return _this;
        };
        this.use = function(arg1) {
            for(var _len = arguments.length, handlers = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++){
                handlers[_key - 1] = arguments[_key];
            }
            if (typeof arg1 === "string") {
                __privateSet(_this, _path, arg1);
            } else {
                handlers.unshift(arg1);
            }
            handlers.map((handler)=>{
                _this.addRoute(METHOD_NAME_ALL, __privateGet(_this, _path), handler);
            });
            return _this;
        };
        var _options_strict;
        const strict = (_options_strict = options.strict) !== null && _options_strict !== void 0 ? _options_strict : true;
        delete options.strict;
        Object.assign(this, options);
        var _options_getPath;
        this.getPath = strict ? (_options_getPath = options.getPath) !== null && _options_getPath !== void 0 ? _options_getPath : getPath : getPathNoStrict;
    }
};
var Hono$1 = _Hono;
_path = new WeakMap();

// src/router/reg-exp-router/node.ts
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = ".*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = Symbol();
function compareKey(a, b) {
    if (a.length === 1) {
        return b.length === 1 ? a < b ? -1 : 1 : -1;
    }
    if (b.length === 1) {
        return 1;
    }
    if (a === ONLY_WILDCARD_REG_EXP_STR || a === TAIL_WILDCARD_REG_EXP_STR) {
        return 1;
    } else if (b === ONLY_WILDCARD_REG_EXP_STR || b === TAIL_WILDCARD_REG_EXP_STR) {
        return -1;
    }
    if (a === LABEL_REG_EXP_STR) {
        return 1;
    } else if (b === LABEL_REG_EXP_STR) {
        return -1;
    }
    return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
var Node$1 = class Node {
    insert(tokens, index, paramMap, context, pathErrorCheckOnly) {
        if (tokens.length === 0) {
            if (this.index !== void 0) {
                throw PATH_ERROR;
            }
            if (pathErrorCheckOnly) {
                return;
            }
            this.index = index;
            return;
        }
        const [token, ...restTokens] = tokens;
        const pattern = token === "*" ? restTokens.length === 0 ? [
            "",
            "",
            ONLY_WILDCARD_REG_EXP_STR
        ] : [
            "",
            "",
            LABEL_REG_EXP_STR
        ] : token === "/*" ? [
            "",
            "",
            TAIL_WILDCARD_REG_EXP_STR
        ] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
        let node;
        if (pattern) {
            const name = pattern[1];
            let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
            if (name && pattern[2]) {
                regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
                if (/\((?!\?:)/.test(regexpStr)) {
                    throw PATH_ERROR;
                }
            }
            node = this.children[regexpStr];
            if (!node) {
                if (Object.keys(this.children).some((k)=>k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR)) {
                    throw PATH_ERROR;
                }
                if (pathErrorCheckOnly) {
                    return;
                }
                node = this.children[regexpStr] = new Node$1();
                if (name !== "") {
                    node.varIndex = context.varIndex++;
                }
            }
            if (!pathErrorCheckOnly && name !== "") {
                paramMap.push([
                    name,
                    node.varIndex
                ]);
            }
        } else {
            node = this.children[token];
            if (!node) {
                if (Object.keys(this.children).some((k)=>k.length > 1 && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR)) {
                    throw PATH_ERROR;
                }
                if (pathErrorCheckOnly) {
                    return;
                }
                node = this.children[token] = new Node$1();
            }
        }
        node.insert(restTokens, index, paramMap, context, pathErrorCheckOnly);
    }
    buildRegExpStr() {
        const childKeys = Object.keys(this.children).sort(compareKey);
        const strList = childKeys.map((k)=>{
            const c = this.children[k];
            return (typeof c.varIndex === "number" ? `(${k})@${c.varIndex}` : k) + c.buildRegExpStr();
        });
        if (typeof this.index === "number") {
            strList.unshift(`#${this.index}`);
        }
        if (strList.length === 0) {
            return "";
        }
        if (strList.length === 1) {
            return strList[0];
        }
        return "(?:" + strList.join("|") + ")";
    }
    constructor(){
        this.children = {};
    }
};

// src/router/reg-exp-router/trie.ts
var Trie = class {
    insert(path, index, pathErrorCheckOnly) {
        const paramAssoc = [];
        const groups = [];
        for(let i = 0;;){
            let replaced = false;
            path = path.replace(/\{[^}]+\}/g, (m)=>{
                const mark = `@\\${i}`;
                groups[i] = [
                    mark,
                    m
                ];
                i++;
                replaced = true;
                return mark;
            });
            if (!replaced) {
                break;
            }
        }
        const tokens = path.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
        for(let i = groups.length - 1; i >= 0; i--){
            const [mark] = groups[i];
            for(let j = tokens.length - 1; j >= 0; j--){
                if (tokens[j].indexOf(mark) !== -1) {
                    tokens[j] = tokens[j].replace(mark, groups[i][1]);
                    break;
                }
            }
        }
        this.root.insert(tokens, index, paramAssoc, this.context, pathErrorCheckOnly);
        return paramAssoc;
    }
    buildRegExp() {
        let regexp = this.root.buildRegExpStr();
        if (regexp === "") {
            return [
                /^$/,
                [],
                []
            ];
        }
        let captureIndex = 0;
        const indexReplacementMap = [];
        const paramReplacementMap = [];
        regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex)=>{
            if (typeof handlerIndex !== "undefined") {
                indexReplacementMap[++captureIndex] = Number(handlerIndex);
                return "$()";
            }
            if (typeof paramIndex !== "undefined") {
                paramReplacementMap[Number(paramIndex)] = ++captureIndex;
                return "";
            }
            return "";
        });
        return [
            new RegExp(`^${regexp}`),
            indexReplacementMap,
            paramReplacementMap
        ];
    }
    constructor(){
        this.context = {
            varIndex: 0
        };
        this.root = new Node$1();
    }
};

// src/router/reg-exp-router/router.ts
var methodNames = [
    METHOD_NAME_ALL,
    ...METHODS
].map((method)=>method.toUpperCase());
var emptyParam = [];
var nullMatcher = [
    /^$/,
    [],
    {}
];
var wildcardRegExpCache = {};
function buildWildcardRegExp(path) {
    var _wildcardRegExpCache_path;
    return (_wildcardRegExpCache_path = wildcardRegExpCache[path]) !== null && _wildcardRegExpCache_path !== void 0 ? _wildcardRegExpCache_path : wildcardRegExpCache[path] = new RegExp(path === "*" ? "" : `^${path.replace(/\/\*/, "(?:|/.*)")}$`);
}
function clearWildcardRegExpCache() {
    wildcardRegExpCache = {};
}
function buildMatcherFromPreprocessedRoutes(routes) {
    const trie = new Trie();
    const handlerData = [];
    if (routes.length === 0) {
        return nullMatcher;
    }
    const routesWithStaticPathFlag = routes.map((route)=>[
            !/\*|\/:/.test(route[0]),
            ...route
        ]).sort((param, param1)=>{
        let [isStaticA, pathA] = param, [isStaticB, pathB] = param1;
        return isStaticA ? 1 : isStaticB ? -1 : pathA.length - pathB.length;
    });
    const staticMap = {};
    for(let i = 0, j = -1, len = routesWithStaticPathFlag.length; i < len; i++){
        const [pathErrorCheckOnly, path, handlers] = routesWithStaticPathFlag[i];
        if (pathErrorCheckOnly) {
            staticMap[path] = [
                handlers.map((param)=>{
                    let [h] = param;
                    return [
                        h,
                        {}
                    ];
                }),
                emptyParam
            ];
        } else {
            j++;
        }
        let paramAssoc;
        try {
            paramAssoc = trie.insert(path, j, pathErrorCheckOnly);
        } catch (e) {
            throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
        }
        if (pathErrorCheckOnly) {
            continue;
        }
        handlerData[j] = handlers.map((param)=>{
            let [h, paramCount] = param;
            const paramIndexMap = {};
            paramCount -= 1;
            for(; paramCount >= 0; paramCount--){
                const [key, value] = paramAssoc[paramCount];
                paramIndexMap[key] = value;
            }
            return [
                h,
                paramIndexMap
            ];
        });
    }
    const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
    for(let i = 0, len = handlerData.length; i < len; i++){
        for(let j = 0, len2 = handlerData[i].length; j < len2; j++){
            var _handlerData_i_j;
            const map = (_handlerData_i_j = handlerData[i][j]) === null || _handlerData_i_j === void 0 ? void 0 : _handlerData_i_j[1];
            if (!map) {
                continue;
            }
            const keys = Object.keys(map);
            for(let k = 0, len3 = keys.length; k < len3; k++){
                map[keys[k]] = paramReplacementMap[map[keys[k]]];
            }
        }
    }
    const handlerMap = [];
    for(const i in indexReplacementMap){
        handlerMap[i] = handlerData[indexReplacementMap[i]];
    }
    return [
        regexp,
        handlerMap,
        staticMap
    ];
}
function findMiddleware(middleware, path) {
    if (!middleware) {
        return void 0;
    }
    for (const k of Object.keys(middleware).sort((a, b)=>b.length - a.length)){
        if (buildWildcardRegExp(k).test(path)) {
            return [
                ...middleware[k]
            ];
        }
    }
    return void 0;
}
var RegExpRouter = class {
    add(method, path, handler) {
        var _a;
        const { middleware, routes } = this;
        if (!middleware || !routes) {
            throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
        }
        if (methodNames.indexOf(method) === -1) methodNames.push(method);
        if (!middleware[method]) {
            [
                middleware,
                routes
            ].forEach((handlerMap)=>{
                handlerMap[method] = {};
                Object.keys(handlerMap[METHOD_NAME_ALL]).forEach((p)=>{
                    handlerMap[method][p] = [
                        ...handlerMap[METHOD_NAME_ALL][p]
                    ];
                });
            });
        }
        if (path === "/*") {
            path = "*";
        }
        const paramCount = (path.match(/\/:/g) || []).length;
        if (/\*$/.test(path)) {
            const re = buildWildcardRegExp(path);
            if (method === METHOD_NAME_ALL) {
                Object.keys(middleware).forEach((m)=>{
                    var _a2;
                    (_a2 = middleware[m])[path] || (_a2[path] = findMiddleware(middleware[m], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || []);
                });
            } else {
                (_a = middleware[method])[path] || (_a[path] = findMiddleware(middleware[method], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || []);
            }
            Object.keys(middleware).forEach((m)=>{
                if (method === METHOD_NAME_ALL || method === m) {
                    Object.keys(middleware[m]).forEach((p)=>{
                        re.test(p) && middleware[m][p].push([
                            handler,
                            paramCount
                        ]);
                    });
                }
            });
            Object.keys(routes).forEach((m)=>{
                if (method === METHOD_NAME_ALL || method === m) {
                    Object.keys(routes[m]).forEach((p)=>re.test(p) && routes[m][p].push([
                            handler,
                            paramCount
                        ]));
                }
            });
            return;
        }
        const paths = checkOptionalParameter(path) || [
            path
        ];
        for(let i = 0, len = paths.length; i < len; i++){
            const path2 = paths[i];
            Object.keys(routes).forEach((m)=>{
                var _a2;
                if (method === METHOD_NAME_ALL || method === m) {
                    (_a2 = routes[m])[path2] || (_a2[path2] = [
                        ...findMiddleware(middleware[m], path2) || findMiddleware(middleware[METHOD_NAME_ALL], path2) || []
                    ]);
                    routes[m][path2].push([
                        handler,
                        paramCount - len + i + 1
                    ]);
                }
            });
        }
    }
    match(method, path) {
        clearWildcardRegExpCache();
        const matchers = this.buildAllMatchers();
        this.match = (method2, path2)=>{
            const matcher = matchers[method2];
            const staticMatch = matcher[2][path2];
            if (staticMatch) {
                return staticMatch;
            }
            const match = path2.match(matcher[0]);
            if (!match) {
                return [
                    [],
                    emptyParam
                ];
            }
            const index = match.indexOf("", 1);
            return [
                matcher[1][index],
                match
            ];
        };
        return this.match(method, path);
    }
    buildAllMatchers() {
        const matchers = {};
        methodNames.forEach((method)=>{
            matchers[method] = this.buildMatcher(method) || matchers[METHOD_NAME_ALL];
        });
        this.middleware = this.routes = void 0;
        return matchers;
    }
    buildMatcher(method) {
        const routes = [];
        let hasOwnRoute = method === METHOD_NAME_ALL;
        [
            this.middleware,
            this.routes
        ].forEach((r)=>{
            const ownRoute = r[method] ? Object.keys(r[method]).map((path)=>[
                    path,
                    r[method][path]
                ]) : [];
            if (ownRoute.length !== 0) {
                hasOwnRoute || (hasOwnRoute = true);
                routes.push(...ownRoute);
            } else if (method !== METHOD_NAME_ALL) {
                routes.push(...Object.keys(r[METHOD_NAME_ALL]).map((path)=>[
                        path,
                        r[METHOD_NAME_ALL][path]
                    ]));
            }
        });
        if (!hasOwnRoute) {
            return null;
        } else {
            return buildMatcherFromPreprocessedRoutes(routes);
        }
    }
    constructor(){
        this.name = "RegExpRouter";
        this.middleware = {
            [METHOD_NAME_ALL]: {}
        };
        this.routes = {
            [METHOD_NAME_ALL]: {}
        };
    }
};

// src/router/smart-router/router.ts
var SmartRouter = class {
    add(method, path, handler) {
        if (!this.routes) {
            throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
        }
        this.routes.push([
            method,
            path,
            handler
        ]);
    }
    match(method, path) {
        if (!this.routes) {
            throw new Error("Fatal error");
        }
        const { routers, routes } = this;
        const len = routers.length;
        let i = 0;
        let res;
        for(; i < len; i++){
            const router = routers[i];
            try {
                routes.forEach((args)=>{
                    router.add(...args);
                });
                res = router.match(method, path);
            } catch (e) {
                if (e instanceof UnsupportedPathError) {
                    continue;
                }
                throw e;
            }
            this.match = router.match.bind(router);
            this.routers = [
                router
            ];
            this.routes = void 0;
            break;
        }
        if (i === len) {
            throw new Error("Fatal error");
        }
        this.name = `SmartRouter + ${this.activeRouter.name}`;
        return res;
    }
    get activeRouter() {
        if (this.routes || this.routers.length !== 1) {
            throw new Error("No active router has been determined yet.");
        }
        return this.routers[0];
    }
    constructor(init){
        this.name = "SmartRouter";
        this.routers = [];
        this.routes = [];
        Object.assign(this, init);
    }
};

// src/router/trie-router/node.ts
var Node = class {
    insert(method, path, handler) {
        this.name = `${method} ${path}`;
        this.order = ++this.order;
        let curNode = this;
        const parts = splitRoutingPath(path);
        const possibleKeys = [];
        const parentPatterns = [];
        for(let i = 0, len = parts.length; i < len; i++){
            const p = parts[i];
            if (Object.keys(curNode.children).includes(p)) {
                parentPatterns.push(...curNode.patterns);
                curNode = curNode.children[p];
                const pattern2 = getPattern(p);
                if (pattern2) possibleKeys.push(pattern2[1]);
                continue;
            }
            curNode.children[p] = new Node();
            const pattern = getPattern(p);
            if (pattern) {
                curNode.patterns.push(pattern);
                parentPatterns.push(...curNode.patterns);
                possibleKeys.push(pattern[1]);
            }
            parentPatterns.push(...curNode.patterns);
            curNode = curNode.children[p];
        }
        if (!curNode.methods.length) {
            curNode.methods = [];
        }
        const m = {};
        const handlerSet = {
            handler,
            possibleKeys: possibleKeys.filter((v, i, a)=>a.indexOf(v) === i),
            name: this.name,
            score: this.order
        };
        m[method] = handlerSet;
        curNode.methods.push(m);
        return curNode;
    }
    gHSets(node, method, nodeParams, params) {
        const handlerSets = [];
        for(let i = 0, len = node.methods.length; i < len; i++){
            const m = node.methods[i];
            const handlerSet = m[method] || m[METHOD_NAME_ALL];
            const processedSet = {};
            if (handlerSet !== void 0) {
                handlerSet.params = {};
                handlerSet.possibleKeys.forEach((key)=>{
                    const processed = processedSet[handlerSet.name];
                    var _nodeParams_key;
                    handlerSet.params[key] = params[key] && !processed ? params[key] : (_nodeParams_key = nodeParams[key]) !== null && _nodeParams_key !== void 0 ? _nodeParams_key : params[key];
                    processedSet[handlerSet.name] = true;
                });
                handlerSets.push(handlerSet);
            }
        }
        return handlerSets;
    }
    search(method, path) {
        const handlerSets = [];
        this.params = {};
        const params = {};
        const curNode = this;
        let curNodes = [
            curNode
        ];
        const parts = splitPath(path);
        for(let i = 0, len = parts.length; i < len; i++){
            const part = parts[i];
            const isLast = i === len - 1;
            const tempNodes = [];
            for(let j = 0, len2 = curNodes.length; j < len2; j++){
                const node = curNodes[j];
                const nextNode = node.children[part];
                if (nextNode) {
                    nextNode.params = node.params;
                    if (isLast === true) {
                        if (nextNode.children["*"]) {
                            handlerSets.push(...this.gHSets(nextNode.children["*"], method, node.params, {}));
                        }
                        handlerSets.push(...this.gHSets(nextNode, method, node.params, {}));
                    } else {
                        tempNodes.push(nextNode);
                    }
                }
                for(let k = 0, len3 = node.patterns.length; k < len3; k++){
                    const pattern = node.patterns[k];
                    if (pattern === "*") {
                        const astNode = node.children["*"];
                        if (astNode) {
                            handlerSets.push(...this.gHSets(astNode, method, node.params, {}));
                            tempNodes.push(astNode);
                        }
                        continue;
                    }
                    if (part === "") continue;
                    const [key, name, matcher] = pattern;
                    const child = node.children[key];
                    const restPathString = parts.slice(i).join("/");
                    if (matcher instanceof RegExp && matcher.test(restPathString)) {
                        params[name] = restPathString;
                        handlerSets.push(...this.gHSets(child, method, node.params, params));
                        continue;
                    }
                    if (matcher === true || matcher instanceof RegExp && matcher.test(part)) {
                        if (typeof key === "string") {
                            params[name] = part;
                            if (isLast === true) {
                                handlerSets.push(...this.gHSets(child, method, params, node.params));
                                if (child.children["*"]) {
                                    handlerSets.push(...this.gHSets(child.children["*"], method, node.params, params));
                                }
                            } else {
                                child.params = {
                                    ...params
                                };
                                tempNodes.push(child);
                            }
                        }
                    }
                }
            }
            curNodes = tempNodes;
        }
        const results = handlerSets.sort((a, b)=>{
            return a.score - b.score;
        });
        return [
            results.map((param)=>{
                let { handler, params: params2 } = param;
                return [
                    handler,
                    params2
                ];
            })
        ];
    }
    constructor(method, handler, children){
        this.order = 0;
        this.params = {};
        this.children = children || {};
        this.methods = [];
        this.name = "";
        if (method && handler) {
            const m = {};
            m[method] = {
                handler,
                possibleKeys: [],
                score: 0,
                name: this.name
            };
            this.methods = [
                m
            ];
        }
        this.patterns = [];
    }
};

// src/router/trie-router/router.ts
var TrieRouter = class {
    add(method, path, handler) {
        const results = checkOptionalParameter(path);
        if (results) {
            for (const p of results){
                this.node.insert(method, p, handler);
            }
            return;
        }
        this.node.insert(method, path, handler);
    }
    match(method, path) {
        return this.node.search(method, path);
    }
    constructor(){
        this.name = "TrieRouter";
        this.node = new Node();
    }
};

// src/hono.ts
var Hono = class extends Hono$1 {
    constructor(options = {}){
        super(options);
        var _options_router;
        this.router = (_options_router = options.router) !== null && _options_router !== void 0 ? _options_router : new SmartRouter({
            routers: [
                new RegExpRouter(),
                new TrieRouter()
            ]
        });
    }
};

// src/middleware/cors/index.ts
var cors = (options)=>{
    const defaults = {
        origin: "*",
        allowMethods: [
            "GET",
            "HEAD",
            "PUT",
            "POST",
            "DELETE",
            "PATCH"
        ],
        allowHeaders: [],
        exposeHeaders: []
    };
    const opts = {
        ...defaults,
        ...options
    };
    const findAllowOrigin = ((optsOrigin)=>{
        if (typeof optsOrigin === "string") {
            return ()=>optsOrigin;
        } else if (typeof optsOrigin === "function") {
            return optsOrigin;
        } else {
            return (origin)=>optsOrigin.includes(origin) ? origin : optsOrigin[0];
        }
    })(opts.origin);
    return async function cors2(c, next) {
        var _opts_exposeHeaders;
        function set(key, value) {
            c.res.headers.set(key, value);
        }
        const allowOrigin = findAllowOrigin(c.req.header("origin") || "");
        if (allowOrigin) {
            set("Access-Control-Allow-Origin", allowOrigin);
        }
        if (opts.origin !== "*") {
            set("Vary", "Origin");
        }
        if (opts.credentials) {
            set("Access-Control-Allow-Credentials", "true");
        }
        if ((_opts_exposeHeaders = opts.exposeHeaders) === null || _opts_exposeHeaders === void 0 ? void 0 : _opts_exposeHeaders.length) {
            set("Access-Control-Expose-Headers", opts.exposeHeaders.join(","));
        }
        if (c.req.method !== "OPTIONS") {
            await next();
        } else {
            var _opts_allowMethods;
            if (opts.maxAge != null) {
                set("Access-Control-Max-Age", opts.maxAge.toString());
            }
            if ((_opts_allowMethods = opts.allowMethods) === null || _opts_allowMethods === void 0 ? void 0 : _opts_allowMethods.length) {
                set("Access-Control-Allow-Methods", opts.allowMethods.join(","));
            }
            let headers = opts.allowHeaders;
            if (!(headers === null || headers === void 0 ? void 0 : headers.length)) {
                const requestHeaders = c.req.header("Access-Control-Request-Headers");
                if (requestHeaders) {
                    headers = requestHeaders.split(/\s*,\s*/);
                }
            }
            if (headers === null || headers === void 0 ? void 0 : headers.length) {
                set("Access-Control-Allow-Headers", headers.join(","));
                c.res.headers.append("Vary", "Access-Control-Request-Headers");
            }
            c.res.headers.delete("Content-Length");
            c.res.headers.delete("Content-Type");
            return new Response(null, {
                headers: c.res.headers,
                status: 204,
                statusText: c.res.statusText
            });
        }
    };
};

// src/helper/adapter/index.ts
var getRuntimeKey = ()=>{
    var _global_process_release, _global_process;
    const global = globalThis;
    if ((global === null || global === void 0 ? void 0 : global.Deno) !== void 0) return "deno";
    if ((global === null || global === void 0 ? void 0 : global.Bun) !== void 0) return "bun";
    if (typeof (global === null || global === void 0 ? void 0 : global.WebSocketPair) === "function") return "workerd";
    if (typeof (global === null || global === void 0 ? void 0 : global.EdgeRuntime) === "string") return "edge-light";
    if ((global === null || global === void 0 ? void 0 : global.fastly) !== void 0) return "fastly";
    if ((global === null || global === void 0 ? void 0 : global.__lagon__) !== void 0) return "lagon";
    if ((global === null || global === void 0 ? void 0 : (_global_process = global.process) === null || _global_process === void 0 ? void 0 : (_global_process_release = _global_process.release) === null || _global_process_release === void 0 ? void 0 : _global_process_release.name) === "node") return "node";
    return "other";
};

// src/middleware/logger/index.ts
var humanize = (times)=>{
    const [delimiter, separator] = [
        ",",
        "."
    ];
    const orderTimes = times.map((v)=>v.replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1" + delimiter));
    return orderTimes.join(separator);
};
var time = (start)=>{
    const delta = Date.now() - start;
    return humanize([
        delta < 1e3 ? delta + "ms" : Math.round(delta / 1e3) + "s"
    ]);
};
var colorStatus = (status)=>{
    const out = {
        7: `\x1B[35m${status}\x1B[0m`,
        5: `\x1B[31m${status}\x1B[0m`,
        4: `\x1B[33m${status}\x1B[0m`,
        3: `\x1B[36m${status}\x1B[0m`,
        2: `\x1B[32m${status}\x1B[0m`,
        1: `\x1B[32m${status}\x1B[0m`,
        0: `\x1B[33m${status}\x1B[0m`
    };
    const calculateStatus = status / 100 | 0;
    return out[calculateStatus];
};
function log(fn, prefix, method, path) {
    let status = arguments.length > 4 && arguments[4] !== void 0 ? arguments[4] : 0, elapsed = arguments.length > 5 ? arguments[5] : void 0;
    const out = prefix === "<--" /* Incoming */  ? `  ${prefix} ${method} ${path}` : `  ${prefix} ${method} ${path} ${colorStatus(status)} ${elapsed}`;
    fn(out);
}
var logger = function() {
    let fn = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : console.log;
    return async function logger2(c, next) {
        const { method } = c.req;
        const path = getPath(c.req.raw);
        log(fn, "<--" /* Incoming */ , method, path);
        const start = Date.now();
        await next();
        log(fn, "-->" /* Outgoing */ , method, path, c.res.status, time(start));
    };
};

// src/middleware/timing/index.ts
var getTime = ()=>{
    try {
        return performance.now();
    } catch (e) {}
    return Date.now();
};
var timing = (config)=>{
    const options = {
        ...{
            total: true,
            enabled: true,
            totalDescription: "Total Response Time",
            autoEnd: true,
            crossOrigin: false
        },
        ...config
    };
    return async function timing2(c, next) {
        const headers = [];
        const timers = /* @__PURE__ */ new Map();
        c.set("metric", {
            headers,
            timers
        });
        if (options.total) {
            startTime(c, "total", options.totalDescription);
        }
        await next();
        if (options.total) {
            endTime(c, "total");
        }
        if (options.autoEnd) {
            timers.forEach((_, key)=>endTime(c, key));
        }
        const enabled = typeof options.enabled === "function" ? options.enabled(c) : options.enabled;
        if (enabled) {
            c.res.headers.append("Server-Timing", headers.join(","));
            if (options.crossOrigin) {
                c.res.headers.append("Timing-Allow-Origin", typeof options.crossOrigin === "string" ? options.crossOrigin : "*");
            }
        }
    };
};
var setMetric = (c, name, valueDescription, description, precision)=>{
    const metrics = c.get("metric");
    if (!metrics) {
        console.warn("Metrics not initialized! Please add the `timing()` middleware to this route!");
        return;
    }
    if (typeof valueDescription === "number") {
        const dur = valueDescription.toFixed(precision || 1);
        const metric = description ? `${name};dur=${dur};desc="${description}"` : `${name};dur=${dur}`;
        metrics.headers.push(metric);
    } else {
        const metric = valueDescription ? `${name};desc="${valueDescription}"` : `${name}`;
        metrics.headers.push(metric);
    }
};
var startTime = (c, name, description)=>{
    const metrics = c.get("metric");
    if (!metrics) {
        console.warn("Metrics not initialized! Please add the `timing()` middleware to this route!");
        return;
    }
    metrics.timers.set(name, {
        description,
        start: getTime()
    });
};
var endTime = (c, name, precision)=>{
    const metrics = c.get("metric");
    if (!metrics) {
        console.warn("Metrics not initialized! Please add the `timing()` middleware to this route!");
        return;
    }
    const timer = metrics.timers.get(name);
    if (!timer) {
        console.warn(`Timer "${name}" does not exist!`);
        return;
    }
    const { description, start } = timer;
    const duration = getTime() - start;
    setMetric(c, name, duration, description, precision);
    metrics.timers.delete(name);
};

/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */ /**
 * Harm categories that would cause prompts or candidates to be blocked.
 * @public
 */ var HarmCategory;
(function(HarmCategory) {
    HarmCategory["HARM_CATEGORY_UNSPECIFIED"] = "HARM_CATEGORY_UNSPECIFIED";
    HarmCategory["HARM_CATEGORY_HATE_SPEECH"] = "HARM_CATEGORY_HATE_SPEECH";
    HarmCategory["HARM_CATEGORY_SEXUALLY_EXPLICIT"] = "HARM_CATEGORY_SEXUALLY_EXPLICIT";
    HarmCategory["HARM_CATEGORY_HARASSMENT"] = "HARM_CATEGORY_HARASSMENT";
    HarmCategory["HARM_CATEGORY_DANGEROUS_CONTENT"] = "HARM_CATEGORY_DANGEROUS_CONTENT";
})(HarmCategory || (HarmCategory = {}));
/**
 * Threshhold above which a prompt or candidate will be blocked.
 * @public
 */ var HarmBlockThreshold;
(function(HarmBlockThreshold) {
    // Threshold is unspecified.
    HarmBlockThreshold["HARM_BLOCK_THRESHOLD_UNSPECIFIED"] = "HARM_BLOCK_THRESHOLD_UNSPECIFIED";
    // Content with NEGLIGIBLE will be allowed.
    HarmBlockThreshold["BLOCK_LOW_AND_ABOVE"] = "BLOCK_LOW_AND_ABOVE";
    // Content with NEGLIGIBLE and LOW will be allowed.
    HarmBlockThreshold["BLOCK_MEDIUM_AND_ABOVE"] = "BLOCK_MEDIUM_AND_ABOVE";
    // Content with NEGLIGIBLE, LOW, and MEDIUM will be allowed.
    HarmBlockThreshold["BLOCK_ONLY_HIGH"] = "BLOCK_ONLY_HIGH";
    // All content will be allowed.
    HarmBlockThreshold["BLOCK_NONE"] = "BLOCK_NONE";
})(HarmBlockThreshold || (HarmBlockThreshold = {}));
/**
 * Probability that a prompt or candidate matches a harm category.
 * @public
 */ var HarmProbability;
(function(HarmProbability) {
    // Probability is unspecified.
    HarmProbability["HARM_PROBABILITY_UNSPECIFIED"] = "HARM_PROBABILITY_UNSPECIFIED";
    // Content has a negligible chance of being unsafe.
    HarmProbability["NEGLIGIBLE"] = "NEGLIGIBLE";
    // Content has a low chance of being unsafe.
    HarmProbability["LOW"] = "LOW";
    // Content has a medium chance of being unsafe.
    HarmProbability["MEDIUM"] = "MEDIUM";
    // Content has a high chance of being unsafe.
    HarmProbability["HIGH"] = "HIGH";
})(HarmProbability || (HarmProbability = {}));
/**
 * Reason that a prompt was blocked.
 * @public
 */ var BlockReason;
(function(BlockReason) {
    // A blocked reason was not specified.
    BlockReason["BLOCKED_REASON_UNSPECIFIED"] = "BLOCKED_REASON_UNSPECIFIED";
    // Content was blocked by safety settings.
    BlockReason["SAFETY"] = "SAFETY";
    // Content was blocked, but the reason is uncategorized.
    BlockReason["OTHER"] = "OTHER";
})(BlockReason || (BlockReason = {}));
/**
 * Reason that a candidate finished.
 * @public
 */ var FinishReason;
(function(FinishReason) {
    // Default value. This value is unused.
    FinishReason["FINISH_REASON_UNSPECIFIED"] = "FINISH_REASON_UNSPECIFIED";
    // Natural stop point of the model or provided stop sequence.
    FinishReason["STOP"] = "STOP";
    // The maximum number of tokens as specified in the request was reached.
    FinishReason["MAX_TOKENS"] = "MAX_TOKENS";
    // The candidate content was flagged for safety reasons.
    FinishReason["SAFETY"] = "SAFETY";
    // The candidate content was flagged for recitation reasons.
    FinishReason["RECITATION"] = "RECITATION";
    // Unknown reason.
    FinishReason["OTHER"] = "OTHER";
})(FinishReason || (FinishReason = {}));
/**
 * Task type for embedding content.
 * @public
 */ var TaskType;
(function(TaskType) {
    TaskType["TASK_TYPE_UNSPECIFIED"] = "TASK_TYPE_UNSPECIFIED";
    TaskType["RETRIEVAL_QUERY"] = "RETRIEVAL_QUERY";
    TaskType["RETRIEVAL_DOCUMENT"] = "RETRIEVAL_DOCUMENT";
    TaskType["SEMANTIC_SIMILARITY"] = "SEMANTIC_SIMILARITY";
    TaskType["CLASSIFICATION"] = "CLASSIFICATION";
    TaskType["CLUSTERING"] = "CLUSTERING";
})(TaskType || (TaskType = {}));
/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */ class GoogleGenerativeAIError extends Error {
    constructor(message){
        super(`[GoogleGenerativeAI Error]: ${message}`);
    }
}
class GoogleGenerativeAIResponseError extends GoogleGenerativeAIError {
    constructor(message, response){
        super(message);
        this.response = response;
    }
}
/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */ const BASE_URL = "https://generativelanguage.googleapis.com";
const API_VERSION = "v1";
/**
 * We can't `require` package.json if this runs on web. We will use rollup to
 * swap in the version number here at build time.
 */ const PACKAGE_VERSION = "0.1.3";
const PACKAGE_LOG_HEADER = "genai-js";
var Task;
(function(Task) {
    Task["GENERATE_CONTENT"] = "generateContent";
    Task["STREAM_GENERATE_CONTENT"] = "streamGenerateContent";
    Task["COUNT_TOKENS"] = "countTokens";
    Task["EMBED_CONTENT"] = "embedContent";
    Task["BATCH_EMBED_CONTENTS"] = "batchEmbedContents";
})(Task || (Task = {}));
class RequestUrl {
    toString() {
        let url = `${BASE_URL}/${API_VERSION}/models/${this.model}:${this.task}`;
        if (this.stream) {
            url += "?alt=sse";
        }
        return url;
    }
    constructor(model, task, apiKey, stream){
        this.model = model;
        this.task = task;
        this.apiKey = apiKey;
        this.stream = stream;
    }
}
/**
 * Simple, but may become more complex if we add more versions to log.
 */ function getClientHeaders() {
    return `${PACKAGE_LOG_HEADER}/${PACKAGE_VERSION}`;
}
async function makeRequest(url, body) {
    let response;
    try {
        response = await fetch(url.toString(), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-goog-api-client": getClientHeaders(),
                "x-goog-api-key": url.apiKey
            },
            body
        });
        if (!response.ok) {
            let message = "";
            try {
                const json = await response.json();
                message = json.error.message;
                if (json.error.details) {
                    message += ` ${JSON.stringify(json.error.details)}`;
                }
            } catch (e) {
            // ignored
            }
            throw new Error(`[${response.status} ${response.statusText}] ${message}`);
        }
    } catch (e) {
        const err = new GoogleGenerativeAIError(`Error fetching from ${url.toString()}: ${e.message}`);
        err.stack = e.stack;
        throw err;
    }
    return response;
}
/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */ /**
 * Adds convenience helper methods to a response object, including stream
 * chunks (as long as each chunk is a complete GenerateContentResponse JSON).
 */ function addHelpers(response) {
    response.text = ()=>{
        if (response.candidates && response.candidates.length > 0) {
            if (response.candidates.length > 1) {
                console.warn(`This response had ${response.candidates.length} ` + `candidates. Returning text from the first candidate only. ` + `Access response.candidates directly to use the other candidates.`);
            }
            if (hadBadFinishReason(response.candidates[0])) {
                throw new GoogleGenerativeAIResponseError(`${formatBlockErrorMessage(response)}`, response);
            }
            return getText(response);
        } else if (response.promptFeedback) {
            throw new GoogleGenerativeAIResponseError(`Text not available. ${formatBlockErrorMessage(response)}`, response);
        }
        return "";
    };
    return response;
}
/**
 * Returns text of first candidate.
 */ function getText(response) {
    var _a, _b, _c, _d;
    if ((_d = (_c = (_b = (_a = response.candidates) === null || _a === void 0 ? void 0 : _a[0].content) === null || _b === void 0 ? void 0 : _b.parts) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.text) {
        return response.candidates[0].content.parts[0].text;
    } else {
        return "";
    }
}
const badFinishReasons = [
    FinishReason.RECITATION,
    FinishReason.SAFETY
];
function hadBadFinishReason(candidate) {
    return !!candidate.finishReason && badFinishReasons.includes(candidate.finishReason);
}
function formatBlockErrorMessage(response) {
    var _a, _b, _c;
    let message = "";
    if ((!response.candidates || response.candidates.length === 0) && response.promptFeedback) {
        message += "Response was blocked";
        if ((_a = response.promptFeedback) === null || _a === void 0 ? void 0 : _a.blockReason) {
            message += ` due to ${response.promptFeedback.blockReason}`;
        }
        if ((_b = response.promptFeedback) === null || _b === void 0 ? void 0 : _b.blockReasonMessage) {
            message += `: ${response.promptFeedback.blockReasonMessage}`;
        }
    } else if ((_c = response.candidates) === null || _c === void 0 ? void 0 : _c[0]) {
        const firstCandidate = response.candidates[0];
        if (hadBadFinishReason(firstCandidate)) {
            message += `Candidate was blocked due to ${firstCandidate.finishReason}`;
            if (firstCandidate.finishMessage) {
                message += `: ${firstCandidate.finishMessage}`;
            }
        }
    }
    return message;
}
/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */ /* global Reflect, Promise, SuppressedError, Symbol */ function __await(v) {
    return this instanceof __await ? (this.v = v, this) : new __await(v);
}
function __asyncGenerator(thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function() {
        return this;
    }, i;
    function verb(n) {
        if (g[n]) i[n] = function(v) {
            return new Promise(function(a, b) {
                q.push([
                    n,
                    v,
                    a,
                    b
                ]) > 1 || resume(n, v);
            });
        };
    }
    function resume(n, v) {
        try {
            step(g[n](v));
        } catch (e) {
            settle(q[0][3], e);
        }
    }
    function step(r) {
        r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r);
    }
    function fulfill(value) {
        resume("next", value);
    }
    function reject(value) {
        resume("throw", value);
    }
    function settle(f, v) {
        if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]);
    }
}
typeof SuppressedError === "function" ? SuppressedError : function(error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};
/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */ const responseLineRE = /^data\: (.*)(?:\n\n|\r\r|\r\n\r\n)/;
/**
 * Process a response.body stream from the backend and return an
 * iterator that provides one complete GenerateContentResponse at a time
 * and a promise that resolves with a single aggregated
 * GenerateContentResponse.
 *
 * @param response - Response from a fetch call
 */ function processStream(response) {
    const inputStream = response.body.pipeThrough(new TextDecoderStream("utf8", {
        fatal: true
    }));
    const responseStream = getResponseStream(inputStream);
    const [stream1, stream2] = responseStream.tee();
    return {
        stream: generateResponseSequence(stream1),
        response: getResponsePromise(stream2)
    };
}
async function getResponsePromise(stream) {
    const allResponses = [];
    const reader = stream.getReader();
    while(true){
        const { done, value } = await reader.read();
        if (done) {
            return addHelpers(aggregateResponses(allResponses));
        }
        allResponses.push(value);
    }
}
function generateResponseSequence(stream) {
    return __asyncGenerator(this, arguments, function* generateResponseSequence_1() {
        const reader = stream.getReader();
        while(true){
            const { value, done } = yield __await(reader.read());
            if (done) {
                break;
            }
            yield yield __await(addHelpers(value));
        }
    });
}
/**
 * Reads a raw stream from the fetch response and join incomplete
 * chunks, returning a new stream that provides a single complete
 * GenerateContentResponse in each iteration.
 */ function getResponseStream(inputStream) {
    const reader = inputStream.getReader();
    const stream = new ReadableStream({
        start (controller) {
            let currentText = "";
            return pump();
            function pump() {
                return reader.read().then((param)=>{
                    let { value, done } = param;
                    if (done) {
                        if (currentText.trim()) {
                            controller.error(new GoogleGenerativeAIError("Failed to parse stream"));
                            return;
                        }
                        controller.close();
                        return;
                    }
                    currentText += value;
                    let match = currentText.match(responseLineRE);
                    let parsedResponse;
                    while(match){
                        try {
                            parsedResponse = JSON.parse(match[1]);
                        } catch (e) {
                            controller.error(new GoogleGenerativeAIError(`Error parsing JSON response: "${match[1]}"`));
                            return;
                        }
                        controller.enqueue(parsedResponse);
                        currentText = currentText.substring(match[0].length);
                        match = currentText.match(responseLineRE);
                    }
                    return pump();
                });
            }
        }
    });
    return stream;
}
/**
 * Aggregates an array of `GenerateContentResponse`s into a single
 * GenerateContentResponse.
 */ function aggregateResponses(responses) {
    const lastResponse = responses[responses.length - 1];
    const aggregatedResponse = {
        promptFeedback: lastResponse === null || lastResponse === void 0 ? void 0 : lastResponse.promptFeedback
    };
    for (const response of responses){
        if (response.candidates) {
            for (const candidate of response.candidates){
                const i = candidate.index;
                if (!aggregatedResponse.candidates) {
                    aggregatedResponse.candidates = [];
                }
                if (!aggregatedResponse.candidates[i]) {
                    aggregatedResponse.candidates[i] = {
                        index: candidate.index
                    };
                }
                // Keep overwriting, the last one will be final
                aggregatedResponse.candidates[i].citationMetadata = candidate.citationMetadata;
                aggregatedResponse.candidates[i].finishReason = candidate.finishReason;
                aggregatedResponse.candidates[i].finishMessage = candidate.finishMessage;
                aggregatedResponse.candidates[i].safetyRatings = candidate.safetyRatings;
                /**
                 * Candidates should always have content and parts, but this handles
                 * possible malformed responses.
                 */ if (candidate.content && candidate.content.parts) {
                    if (!aggregatedResponse.candidates[i].content) {
                        aggregatedResponse.candidates[i].content = {
                            role: candidate.content.role || "user",
                            parts: [
                                {
                                    text: ""
                                }
                            ]
                        };
                    }
                    for (const part of candidate.content.parts){
                        if (part.text) {
                            aggregatedResponse.candidates[i].content.parts[0].text += part.text;
                        }
                    }
                }
            }
        }
    }
    return aggregatedResponse;
}
/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */ async function generateContentStream(apiKey, model, params) {
    const url = new RequestUrl(model, Task.STREAM_GENERATE_CONTENT, apiKey, /* stream */ true);
    const response = await makeRequest(url, JSON.stringify(params));
    return processStream(response);
}
async function generateContent(apiKey, model, params) {
    const url = new RequestUrl(model, Task.GENERATE_CONTENT, apiKey, /* stream */ false);
    const response = await makeRequest(url, JSON.stringify(params));
    const responseJson = await response.json();
    const enhancedResponse = addHelpers(responseJson);
    return {
        response: enhancedResponse
    };
}
/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */ function formatNewContent(request, role) {
    let newParts = [];
    if (typeof request === "string") {
        newParts = [
            {
                text: request
            }
        ];
    } else {
        for (const partOrString of request){
            if (typeof partOrString === "string") {
                newParts.push({
                    text: partOrString
                });
            } else {
                newParts.push(partOrString);
            }
        }
    }
    return {
        role,
        parts: newParts
    };
}
function formatGenerateContentInput(params) {
    if (params.contents) {
        return params;
    } else {
        const content = formatNewContent(params, "user");
        return {
            contents: [
                content
            ]
        };
    }
}
function formatEmbedContentInput(params) {
    if (typeof params === "string" || Array.isArray(params)) {
        const content = formatNewContent(params, "user");
        return {
            content
        };
    }
    return params;
}
/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */ /**
 * Do not log a message for this error.
 */ const SILENT_ERROR = "SILENT_ERROR";
/**
 * ChatSession class that enables sending chat messages and stores
 * history of sent and received messages so far.
 *
 * @public
 */ class ChatSession {
    /**
     * Gets the chat history so far. Blocked prompts are not added to history.
     * Blocked candidates are not added to history, nor are the prompts that
     * generated them.
     */ async getHistory() {
        await this._sendPromise;
        return this._history;
    }
    /**
     * Sends a chat message and receives a non-streaming
     * {@link GenerateContentResult}
     */ async sendMessage(request) {
        var _a, _b;
        await this._sendPromise;
        const newContent = formatNewContent(request, "user");
        const generateContentRequest = {
            safetySettings: (_a = this.params) === null || _a === void 0 ? void 0 : _a.safetySettings,
            generationConfig: (_b = this.params) === null || _b === void 0 ? void 0 : _b.generationConfig,
            contents: [
                ...this._history,
                newContent
            ]
        };
        let finalResult;
        // Add onto the chain.
        this._sendPromise = this._sendPromise.then(()=>generateContent(this._apiKey, this.model, generateContentRequest)).then((result)=>{
            var _a;
            if (result.response.candidates && result.response.candidates.length > 0) {
                this._history.push(newContent);
                const responseContent = Object.assign({
                    parts: [],
                    // Response seems to come back without a role set.
                    role: "model"
                }, (_a = result.response.candidates) === null || _a === void 0 ? void 0 : _a[0].content);
                this._history.push(responseContent);
            } else {
                const blockErrorMessage = formatBlockErrorMessage(result.response);
                if (blockErrorMessage) {
                    console.warn(`sendMessage() was unsuccessful. ${blockErrorMessage}. Inspect response object for details.`);
                }
            }
            finalResult = result;
        });
        await this._sendPromise;
        return finalResult;
    }
    /**
     * Sends a chat message and receives the response as a
     * {@link GenerateContentStreamResult} containing an iterable stream
     * and a response promise.
     */ async sendMessageStream(request) {
        var _a, _b;
        await this._sendPromise;
        const newContent = formatNewContent(request, "user");
        const generateContentRequest = {
            safetySettings: (_a = this.params) === null || _a === void 0 ? void 0 : _a.safetySettings,
            generationConfig: (_b = this.params) === null || _b === void 0 ? void 0 : _b.generationConfig,
            contents: [
                ...this._history,
                newContent
            ]
        };
        const streamPromise = generateContentStream(this._apiKey, this.model, generateContentRequest);
        // Add onto the chain.
        this._sendPromise = this._sendPromise.then(()=>streamPromise)// This must be handled to avoid unhandled rejection, but jump
        // to the final catch block with a label to not log this error.
        .catch((_ignored)=>{
            throw new Error(SILENT_ERROR);
        }).then((streamResult)=>streamResult.response).then((response)=>{
            if (response.candidates && response.candidates.length > 0) {
                this._history.push(newContent);
                const responseContent = Object.assign({}, response.candidates[0].content);
                // Response seems to come back without a role set.
                if (!responseContent.role) {
                    responseContent.role = "model";
                }
                this._history.push(responseContent);
            } else {
                const blockErrorMessage = formatBlockErrorMessage(response);
                if (blockErrorMessage) {
                    console.warn(`sendMessageStream() was unsuccessful. ${blockErrorMessage}. Inspect response object for details.`);
                }
            }
        }).catch((e)=>{
            // Errors in streamPromise are already catchable by the user as
            // streamPromise is returned.
            // Avoid duplicating the error message in logs.
            if (e.message !== SILENT_ERROR) {
                // Users do not have access to _sendPromise to catch errors
                // downstream from streamPromise, so they should not throw.
                console.error(e);
            }
        });
        return streamPromise;
    }
    constructor(apiKey, model, params){
        this.model = model;
        this.params = params;
        this._history = [];
        this._sendPromise = Promise.resolve();
        this._apiKey = apiKey;
        if (params === null || params === void 0 ? void 0 : params.history) {
            this._history = params.history.map((content)=>{
                if (!content.role) {
                    throw new Error("Missing role for history item: " + JSON.stringify(content));
                }
                return formatNewContent(content.parts, content.role);
            });
        }
    }
}
/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */ async function countTokens(apiKey, model, params) {
    const url = new RequestUrl(model, Task.COUNT_TOKENS, apiKey, false);
    const response = await makeRequest(url, JSON.stringify(Object.assign(Object.assign({}, params), {
        model
    })));
    return response.json();
}
/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */ async function embedContent(apiKey, model, params) {
    const url = new RequestUrl(model, Task.EMBED_CONTENT, apiKey, false);
    const response = await makeRequest(url, JSON.stringify(params));
    return response.json();
}
async function batchEmbedContents(apiKey, model, params) {
    const url = new RequestUrl(model, Task.BATCH_EMBED_CONTENTS, apiKey, false);
    const requestsWithModel = params.requests.map((request)=>{
        return Object.assign(Object.assign({}, request), {
            model: `models/${model}`
        });
    });
    const response = await makeRequest(url, JSON.stringify({
        requests: requestsWithModel
    }));
    return response.json();
}
/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */ /**
 * Class for generative model APIs.
 * @public
 */ class GenerativeModel {
    /**
     * Makes a single non-streaming call to the model
     * and returns an object containing a single {@link GenerateContentResponse}.
     */ async generateContent(request) {
        const formattedParams = formatGenerateContentInput(request);
        return generateContent(this.apiKey, this.model, Object.assign({
            generationConfig: this.generationConfig,
            safetySettings: this.safetySettings
        }, formattedParams));
    }
    /**
     * Makes a single streaming call to the model
     * and returns an object containing an iterable stream that iterates
     * over all chunks in the streaming response as well as
     * a promise that returns the final aggregated response.
     */ async generateContentStream(request) {
        const formattedParams = formatGenerateContentInput(request);
        return generateContentStream(this.apiKey, this.model, Object.assign({
            generationConfig: this.generationConfig,
            safetySettings: this.safetySettings
        }, formattedParams));
    }
    /**
     * Gets a new {@link ChatSession} instance which can be used for
     * multi-turn chats.
     */ startChat(startChatParams) {
        return new ChatSession(this.apiKey, this.model, startChatParams);
    }
    /**
     * Counts the tokens in the provided request.
     */ async countTokens(request) {
        const formattedParams = formatGenerateContentInput(request);
        return countTokens(this.apiKey, this.model, formattedParams);
    }
    /**
     * Embeds the provided content.
     */ async embedContent(request) {
        const formattedParams = formatEmbedContentInput(request);
        return embedContent(this.apiKey, this.model, formattedParams);
    }
    /**
     * Embeds an array of {@link EmbedContentRequest}s.
     */ async batchEmbedContents(batchEmbedContentRequest) {
        return batchEmbedContents(this.apiKey, this.model, batchEmbedContentRequest);
    }
    constructor(apiKey, modelParams){
        var _a;
        this.apiKey = apiKey;
        if (modelParams.model.startsWith("models/")) {
            this.model = (_a = modelParams.model.split("models/")) === null || _a === void 0 ? void 0 : _a[1];
        } else {
            this.model = modelParams.model;
        }
        this.generationConfig = modelParams.generationConfig || {};
        this.safetySettings = modelParams.safetySettings || [];
    }
}
/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */ /**
 * Top-level class for this SDK
 * @public
 */ class GoogleGenerativeAI {
    /**
     * Gets a {@link GenerativeModel} instance for the provided model name.
     */ getGenerativeModel(modelParams) {
        if (!modelParams.model) {
            throw new GoogleGenerativeAIError(`Must provide a model name. ` + `Example: genai.getGenerativeModel({ model: 'my-model-name' })`);
        }
        return new GenerativeModel(this.apiKey, modelParams);
    }
    constructor(apiKey){
        this.apiKey = apiKey;
    }
}

function getToken(headers) {
    for (const [k, v] of Object.entries(headers)){
        if (k.toLowerCase() === "authorization") {
            return v.substring(v.indexOf(" ") + 1);
        }
    }
    return null;
}
function parseBase64(base64) {
    var _m_match_groups, _m_match;
    if (!base64.startsWith("data:")) {
        return {
            text: ""
        };
    }
    const [m, data, ..._arr] = base64.split(",");
    var _m_match_groups_mime;
    const mimeType = (_m_match_groups_mime = (_m_match = m.match(RegExp(":(?<mime>.*?);"))) === null || _m_match === void 0 ? void 0 : (_m_match_groups = _m_match.groups) === null || _m_match_groups === void 0 ? void 0 : _m_match_groups.mime) !== null && _m_match_groups_mime !== void 0 ? _m_match_groups_mime : "img/png";
    return {
        inlineData: {
            mimeType: mimeType,
            data
        }
    };
}
function openAiMessageToGeminiMessage(messages) {
    const result = messages.flatMap((param)=>{
        let { role, content } = param;
        if (role === "system") {
            return [
                {
                    role: "user",
                    parts: [
                        {
                            text: content
                        }
                    ]
                },
                {
                    role: "model",
                    parts: [
                        {
                            text: ""
                        }
                    ]
                }
            ];
        }
        var _content_toString;
        const parts = content == null || typeof content === "string" ? [
            {
                text: (_content_toString = content === null || content === void 0 ? void 0 : content.toString()) !== null && _content_toString !== void 0 ? _content_toString : ""
            }
        ] : content.map((item)=>item.type === "text" ? {
                text: item.text
            } : parseBase64(item.image_url.url));
        return [
            {
                role: "user" === role ? "user" : "model",
                parts: parts
            }
        ];
    }).flatMap((item, idx, arr)=>{
        var _arr_at;
        if (item.role === ((_arr_at = arr.at(idx + 1)) === null || _arr_at === void 0 ? void 0 : _arr_at.role) && item.role === "user") {
            return [
                item,
                {
                    role: "model",
                    parts: [
                        {
                            text: ""
                        }
                    ]
                }
            ];
        }
        return [
            item
        ];
    });
    return result;
}
function hasImageMessage(messages) {
    return messages.some((msg)=>{
        const content = msg.content;
        if (content == null) {
            return false;
        }
        if (typeof content === "string") {
            return false;
        }
        return content.some((it)=>it.type === "image_url");
    });
}
function genModel(genAi, req) {
    var _req_max_tokens, _req_temperature, _req_top_p;
    const model = genAi.getGenerativeModel({
        model: hasImageMessage(req.messages) ? "gemini-pro-vision" : "gemini-pro",
        generationConfig: {
            maxOutputTokens: (_req_max_tokens = req.max_tokens) !== null && _req_max_tokens !== void 0 ? _req_max_tokens : undefined,
            temperature: (_req_temperature = req.temperature) !== null && _req_temperature !== void 0 ? _req_temperature : undefined,
            topP: (_req_top_p = req.top_p) !== null && _req_top_p !== void 0 ? _req_top_p : undefined
        }
    });
    return model;
}
var GeminiModel;
(function(GeminiModel) {
    GeminiModel["GEMINI_PRO"] = "gemini-pro";
    GeminiModel["GEMINI_PRO_VISION"] = "gemini-pro-vision";
})(GeminiModel || (GeminiModel = {}));

const nonStreamingChatProxyHandler = async (c, req, genAi)=>{
    const log = c.var.log;
    const model = genModel(genAi, req);
    const geminiResp = await model.generateContent({
        contents: openAiMessageToGeminiMessage(req.messages)
    }).then((it)=>it.response.text()).catch((err)=>{
        var _err_message;
        return (_err_message = err === null || err === void 0 ? void 0 : err.message) !== null && _err_message !== void 0 ? _err_message : err.toString();
    });
    log.debug(JSON.stringify(geminiResp));
    const resp = {
        id: "chatcmpl-abc123",
        object: "chat.completion",
        created: Date.now(),
        model: req.model,
        choices: [
            {
                message: {
                    role: "assistant",
                    content: geminiResp
                },
                logprobs: null,
                finish_reason: "stop",
                index: 0
            }
        ]
    };
    return c.json(resp);
};

// src/helper/streaming/sse.ts
var SSEStreamingApi = class extends StreamingApi {
    async writeSSE(message) {
        const data = message.data.split("\n").map((line)=>{
            return `data: ${line}`;
        }).join("\n");
        const sseData = [
            message.event && `event: ${message.event}`,
            data,
            message.id && `id: ${message.id}`
        ].filter(Boolean).join("\n") + "\n\n";
        await this.write(sseData);
    }
    constructor(writable, readable){
        super(writable, readable);
    }
};
var setSSEHeaders = (context)=>{
    context.header("Transfer-Encoding", "chunked");
    context.header("Content-Type", "text/event-stream");
    context.header("Cache-Control", "no-cache");
    context.header("Connection", "keep-alive");
};
var streamSSE = (c, cb)=>{
    const { readable, writable } = new TransformStream();
    const stream = new SSEStreamingApi(writable, readable);
    cb(stream).finally(()=>stream.close());
    setSSEHeaders(c);
    return c.newResponse(stream.responseReadable);
};

const streamingChatProxyHandler = async (c, req, genAi)=>{
    const log = c.var.log;
    const model = genModel(genAi, req);
    const genOpenAiResp = (content, stop)=>({
            id: "chatcmpl-abc123",
            object: "chat.completion.chunk",
            created: Date.now(),
            model: req.model,
            choices: [
                {
                    delta: {
                        role: "assistant",
                        content: content
                    },
                    finish_reason: stop ? "stop" : null,
                    index: 0
                }
            ]
        });
    return streamSSE(c, async (sseStream)=>{
        await model.generateContentStream({
            contents: openAiMessageToGeminiMessage(req.messages)
        }).then(async (param)=>{
            let { stream, response } = param;
            for await (const { text } of stream){
                await sseStream.writeSSE({
                    data: JSON.stringify(genOpenAiResp(text(), false))
                });
            }
            await sseStream.writeSSE({
                data: JSON.stringify(genOpenAiResp("", true))
            });
            const geminiResult = (await response).text();
            log.info(JSON.stringify(geminiResult));
        }).catch(async (e)=>{
            await sseStream.writeSSE({
                data: JSON.stringify(genOpenAiResp(e.toString(), true))
            });
            log.info(e);
        });
        await sseStream.writeSSE({
            data: "[DONE]"
        });
        await sseStream.close();
    });
};

const chatProxyHandler = async (c)=>{
    const log = c.var.log;
    const req = await c.req.json();
    log.debug(JSON.stringify(req));
    const headers = c.req.header();
    const apiKey = getToken(headers);
    if (apiKey == null) {
        return c.text("Unauthorized", 401);
    }
    const genAi = new GoogleGenerativeAI(apiKey);
    if (req.stream === true) {
        return streamingChatProxyHandler(c, req, genAi);
    }
    return nonStreamingChatProxyHandler(c, req, genAi);
};

var LogLevel;
(function(LogLevel) {
    LogLevel[LogLevel["error"] = 3] = "error";
    LogLevel[LogLevel["warn"] = 4] = "warn";
    LogLevel[LogLevel["info"] = 5] = "info";
    LogLevel[LogLevel["debug"] = 7] = "debug";
})(LogLevel || (LogLevel = {}));
function gen_logger(id) {
    return mapValues(LogLevel, (value, name)=>{
        return (msg)=>{
        };
    });
}
function mapValues(obj, fn) {
    return Object.fromEntries(Object.entries(obj).map((param)=>{
        let [key, value] = param;
        return [
            key,
            fn(value, key, obj)
        ];
    }));
}

const app = new Hono({
    strict: true
}).use("*", cors(), timing(), logger()).use("*", async (c, next)=>{
    const logger = gen_logger(crypto.randomUUID());
    c.set("log", logger);
    await next();
    c.set("log", undefined);
}).options("*", (c)=>c.text("", 204)).get("/", (c)=>{
    const origin = new URL(c.req.url).origin;
    return c.html(`<pre>

Hello Gemini-OpenAI-Proxy from ${getRuntimeKey()}! 

You can try it with:

curl ${origin}/v1/chat/completions \\
-H "Authorization: Bearer $YOUR_GEMINI_API_KEY" \\
-H "Content-Type: application/json" \\
-d '{
"model": "gpt-3.5-turbo",
"messages": [{"role": "user", "content": "Hello"}],
"temperature": 0.7
}'


</pre>`);
}).post("/v1/chat/completions", chatProxyHandler);

app.fire();