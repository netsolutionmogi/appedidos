(function(window, document, exportName, undefined) {
    "use strict";

    var isMultiTouch = false;
    var multiTouchStartPos;
    var eventTarget;
    var touchElements = {};

    // polyfills
    if(!document.createTouch) {
        document.createTouch = function(view, target, identifier, pageX, pageY, screenX, screenY, clientX, clientY) {
            // auto set
            if(clientX == undefined || clientY == undefined) {
                clientX = pageX - window.pageXOffset;
                clientY = pageY - window.pageYOffset;
            }

            return new Touch(target, identifier, {
                pageX: pageX,
                pageY: pageY,
                screenX: screenX,
                screenY: screenY,
                clientX: clientX,
                clientY: clientY
            });
        };
    }

    if(!document.createTouchList) {
        document.createTouchList = function() {
            var touchList = new TouchList();
            for (var i = 0; i < arguments.length; i++) {
                touchList[i] = arguments[i];
            }
            touchList.length = arguments.length;
            return touchList;
        };
    }

    /**
     * create an touch point
     * @constructor
     * @param target
     * @param identifier
     * @param pos
     * @param deltaX
     * @param deltaY
     * @returns {Object} touchPoint
     */
    function Touch(target, identifier, pos, deltaX, deltaY) {
        deltaX = deltaX || 0;
        deltaY = deltaY || 0;

        this.identifier = identifier;
        this.target = target;
        this.clientX = pos.clientX + deltaX;
        this.clientY = pos.clientY + deltaY;
        this.screenX = pos.screenX + deltaX;
        this.screenY = pos.screenY + deltaY;
        this.pageX = pos.pageX + deltaX;
        this.pageY = pos.pageY + deltaY;
    }

    /**
     * create empty touchlist with the methods
     * @constructor
     * @returns touchList
     */
    function TouchList() {
        var touchList = [];

        touchList.item = function(index) {
            return this[index] || null;
        };

        // specified by Mozilla
        touchList.identifiedTouch = function(id) {
            return this[id + 1] || null;
        };

        return touchList;
    }


    /**
     * Simple trick to fake touch event support
     * this is enough for most libraries like Modernizr and Hammer
     */
    function fakeTouchSupport() {
        var objs = [window, document.documentElement];
        var props = ['ontouchstart', 'ontouchmove', 'ontouchcancel', 'ontouchend'];

        for(var o=0; o<objs.length; o++) {
            for(var p=0; p<props.length; p++) {
                if(objs[o] && objs[o][props[p]] == undefined) {
                    objs[o][props[p]] = null;
                }
            }
        }
    }

    /**
     * we don't have to emulate on a touch device
     * @returns {boolean}
     */
    function hasTouchSupport() {
        return ("ontouchstart" in window) || // touch events
               (window.Modernizr && window.Modernizr.touch) || // modernizr
               (navigator.msMaxTouchPoints || navigator.maxTouchPoints) > 2; // pointer events
    }

    /**
     * disable mouseevents on the page
     * @param ev
     */
    function preventMouseEvents(ev) {
        ev.preventDefault();
        ev.stopPropagation();
    }

    /**
     * only trigger touches when the left mousebutton has been pressed
     * @param touchType
     * @returns {Function}
     */
    function onMouse(touchType) {
        return function(ev) {
            // prevent mouse events
            preventMouseEvents(ev);

            if (ev.which !== 1) {
                return;
            }

            // The EventTarget on which the touch point started when it was first placed on the surface,
            // even if the touch point has since moved outside the interactive area of that element.
            // also, when the target doesnt exist anymore, we update it
            if (ev.type == 'mousedown' || !eventTarget || (eventTarget && !eventTarget.dispatchEvent)) {
                eventTarget = ev.target;
            }

            // shiftKey has been lost, so trigger a touchend
            if (isMultiTouch && !ev.shiftKey) {
                triggerTouch('touchend', ev);
                isMultiTouch = false;
            }

            triggerTouch(touchType, ev);

            // we're entering the multi-touch mode!
            if (!isMultiTouch && ev.shiftKey) {
                isMultiTouch = true;
                multiTouchStartPos = {
                    pageX: ev.pageX,
                    pageY: ev.pageY,
                    clientX: ev.clientX,
                    clientY: ev.clientY,
                    screenX: ev.screenX,
                    screenY: ev.screenY
                };
                triggerTouch('touchstart', ev);
            }

            // reset
            if (ev.type == 'mouseup') {
                multiTouchStartPos = null;
                isMultiTouch = false;
                eventTarget = null;
            }
        }
    }

    /**
     * trigger a touch event
     * @param eventName
     * @param mouseEv
     */
    function triggerTouch(eventName, mouseEv) {
        var touchEvent = document.createEvent('Event');
        touchEvent.initEvent(eventName, true, true);

        touchEvent.altKey = mouseEv.altKey;
        touchEvent.ctrlKey = mouseEv.ctrlKey;
        touchEvent.metaKey = mouseEv.metaKey;
        touchEvent.shiftKey = mouseEv.shiftKey;

        touchEvent.touches = getActiveTouches(mouseEv, eventName);
        touchEvent.targetTouches = getActiveTouches(mouseEv, eventName);
        touchEvent.changedTouches = getChangedTouches(mouseEv, eventName);

        eventTarget.dispatchEvent(touchEvent);
    }

    /**
     * create a touchList based on the mouse event
     * @param mouseEv
     * @returns {TouchList}
     */
    function createTouchList(mouseEv) {
        var touchList = new TouchList();

        if (isMultiTouch) {
            var f = TouchEmulator.multiTouchOffset;
            var deltaX = multiTouchStartPos.pageX - mouseEv.pageX;
            var deltaY = multiTouchStartPos.pageY - mouseEv.pageY;

            touchList.push(new Touch(eventTarget, 1, multiTouchStartPos, (deltaX*-1) - f, (deltaY*-1) + f));
            touchList.push(new Touch(eventTarget, 2, multiTouchStartPos, deltaX+f, deltaY-f));
        } else {
            touchList.push(new Touch(eventTarget, 1, mouseEv, 0, 0));
        }

        return touchList;
    }

    /**
     * receive all active touches
     * @param mouseEv
     * @returns {TouchList}
     */
    function getActiveTouches(mouseEv, eventName) {
        // empty list
        if (mouseEv.type == 'mouseup') {
            return new TouchList();
        }

        var touchList = createTouchList(mouseEv);
        if(isMultiTouch && mouseEv.type != 'mouseup' && eventName == 'touchend') {
            touchList.splice(1, 1);
        }
        return touchList;
    }

    /**
     * receive a filtered set of touches with only the changed pointers
     * @param mouseEv
     * @param eventName
     * @returns {TouchList}
     */
    function getChangedTouches(mouseEv, eventName) {
        var touchList = createTouchList(mouseEv);

        // we only want to return the added/removed item on multitouch
        // which is the second pointer, so remove the first pointer from the touchList
        //
        // but when the mouseEv.type is mouseup, we want to send all touches because then
        // no new input will be possible
        if(isMultiTouch && mouseEv.type != 'mouseup' &&
            (eventName == 'touchstart' || eventName == 'touchend')) {
            touchList.splice(0, 1);
        }

        return touchList;
    }

    /**
     * show the touchpoints on the screen
     */
    function showTouches(ev) {
        var touch, i, el, styles;

        // first all visible touches
        for(i = 0; i < ev.touches.length; i++) {
            touch = ev.touches[i];
            el = touchElements[touch.identifier];
            if(!el) {
                el = touchElements[touch.identifier] = document.createElement("div");
                document.body.appendChild(el);
            }

            styles = TouchEmulator.template(touch);
            for(var prop in styles) {
                el.style[prop] = styles[prop];
            }
        }

        // remove all ended touches
        if(ev.type == 'touchend' || ev.type == 'touchcancel') {
            for(i = 0; i < ev.changedTouches.length; i++) {
                touch = ev.changedTouches[i];
                el = touchElements[touch.identifier];
                if(el) {
                    el.parentNode.removeChild(el);
                    delete touchElements[touch.identifier];
                }
            }
        }
    }

    /**
     * TouchEmulator initializer
     */
    function TouchEmulator() {
        if (hasTouchSupport()) {
            return;
        }

        fakeTouchSupport();

        window.addEventListener("mousedown", onMouse('touchstart'), true);
        window.addEventListener("mousemove", onMouse('touchmove'), true);
        window.addEventListener("mouseup", onMouse('touchend'), true);

        window.addEventListener("mouseenter", preventMouseEvents, true);
        window.addEventListener("mouseleave", preventMouseEvents, true);
        window.addEventListener("mouseout", preventMouseEvents, true);
        window.addEventListener("mouseover", preventMouseEvents, true);

        // it uses itself!
        window.addEventListener("touchstart", showTouches, true);
        window.addEventListener("touchmove", showTouches, true);
        window.addEventListener("touchend", showTouches, true);
        window.addEventListener("touchcancel", showTouches, true);
    }

    // start distance when entering the multitouch mode
    TouchEmulator.multiTouchOffset = 75;

    /**
     * css template for the touch rendering
     * @param touch
     * @returns object
     */
    TouchEmulator.template = function(touch) {
        var size = 30;
        var transform = 'translate('+ (touch.clientX-(size/2)) +'px, '+ (touch.clientY-(size/2)) +'px)';
        return {
            position: 'fixed',
            left: 0,
            top: 0,
            background: '#fff',
            border: 'solid 1px #999',
            opacity: .6,
            borderRadius: '100%',
            height: size + 'px',
            width: size + 'px',
            padding: 0,
            margin: 0,
            display: 'block',
            overflow: 'hidden',
            pointerEvents: 'none',
            webkitUserSelect: 'none',
            mozUserSelect: 'none',
            userSelect: 'none',
            webkitTransform: transform,
            mozTransform: transform,
            transform: transform,
            zIndex: 100
        }
    };

    // export
    if (typeof define == "function" && define.amd) {
        define(function() {
            return TouchEmulator;
        });
    } else if (typeof module != "undefined" && module.exports) {
        module.exports = TouchEmulator;
    } else {
        window[exportName] = TouchEmulator;
    }
})(window, document, "TouchEmulator");

TouchEmulator(); 

window.gourmet = [];
window.gourmet.development = true;
window.gourmet.version = '0.3.0';
window.gourmet.timeout = 5;
window.gourmet.protocol = 'http://';
window.gourmet.demo = 'www.nfeja.com.br';

if(localStorage.getItem("protocol") !== null) 
    window.gourmet.protocol = localStorage.getItem("protocol");





!function(a){"function"==typeof define&&define.amd?define(["jquery"],a):"object"==typeof exports?module.exports=a(require("jquery")):a(jQuery)}(function(a){function b(a){return void 0!==a&&null!==a}a(document).ready(function(){a("body").append("<div id=snackbar-container/>")});var c={events:{},on:function(a,b){this.events[a]=this.events[a]||[],this.events[a].push(b)},off:function(a){this.events[a]&&delete this.events[a]},emit:function(a,b){this.events[a]&&this.events[a].forEach(function(a){a(b)})}};a(document).on("click","[data-toggle=snackbar]",function(){a(this).snackbar("toggle")}).on("click","#snackbar-container .snackbar",function(){a(this).snackbar("hide")}),a.snackbar=function(d){if(b(d)&&d===Object(d)){var e,f=!1;d=Object.assign({},a.snackbar.defaults,d),b(d.id)?a("#"+d.id).length?e=a("#"+d.id):(e=a("<div/>").attr("id",""+d.id).attr("class","snackbar"),f=!0):(d.id="snackbar"+Date.now(),e=a("<div/>").attr("id",d.id).attr("class","snackbar"),f=!0);var g=e.hasClass("snackbar-opened");b(d.style)?(g?e.attr("class","snackbar snackbar-opened "+d.style):e.attr("class","snackbar "+d.style),e.attr("data-style",d.style)):g?e.attr("class","snackbar snackbar-opened"):e.attr("class","snackbar"),d.htmlAllowed=!!b(d.htmlAllowed)&&d.htmlAllowed,d.timeout=b(d.timeout)?d.timeout:3e3,e.attr("data-timeout",d.timeout),d.content=d.htmlAllowed?d.content:a("<p>"+d.content+"</p>").text(),b(d.onClose)&&c.on(d.id,d.onClose),b(d.htmlAllowed)&&e.attr("data-html-allowed",d.htmlAllowed),b(d.content)&&(e.find(".snackbar-content").length?e.find(".snackbar-content").html(d.content):e.prepend("<span class=snackbar-content>"+d.content+"</span>"),e.attr("data-content",d.content)),f?e.appendTo("#snackbar-container"):e.insertAfter("#snackbar-container .snackbar:last-child"),b(d.action)&&"toggle"==d.action&&(d.action=g?"hide":"show");var h=Date.now();e.data("animationId1",h),setTimeout(function(){e.data("animationId1")===h&&(b(d.action)&&"show"!=d.action?b(d.action)&&"hide"==d.action&&(e.removeClass("snackbar-opened"),c.emit(d.id),c.off(d.id)):e.addClass("snackbar-opened"))},50);var i=Date.now();return e.data("animationId2",i),0!==d.timeout&&setTimeout(function(){e.data("animationId2")===i&&(e.removeClass("snackbar-opened"),c.emit(d.id),c.off(d.id))},d.timeout),e}return!1},a.snackbar.defaults={},a.fn.snackbar=function(c){if(void 0!==c){var d={};if(this.hasClass("snackbar"))return d={id:this.attr("id"),content:a(this).attr("data-content"),style:a(this).attr("data-style"),timeout:parseInt(a(this).attr("data-timeout")),htmlAllowed:a(this).attr("data-html-allowed")},"show"!==c&&"hide"!==c&&"toggle"!=c||(d.action=c),a.snackbar(d);b(c)&&"show"!==c&&"hide"!==c&&"toggle"!=c||(d={content:a(this).attr("data-content"),style:a(this).attr("data-style"),timeout:a(this).attr("data-timeout"),htmlAllowed:a(this).attr("data-html-allowed")}),b(c)&&(d.id=this.attr("data-snackbar-id"),"show"!==c&&"hide"!==c&&"toggle"!=c||(d.action=c));var e=a.snackbar(d);return this.attr("data-snackbar-id",e.attr("id")),e}}});
//# sourceMappingURL=snackbar.min.js.map


/*
 * jQuery MD5 Plugin 1.2.1
 * https://github.com/blueimp/jQuery-MD5
 *
 * Copyright 2010, Sebastian Tschan
 * https://blueimp.net
 *
 * Licensed under the MIT license:
 * http://creativecommons.org/licenses/MIT/
 * 
 * Based on
 * A JavaScript implementation of the RSA Data Security, Inc. MD5 Message
 * Digest Algorithm, as defined in RFC 1321.
 * Version 2.2 Copyright (C) Paul Johnston 1999 - 2009
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * Distributed under the BSD License
 * See http://pajhome.org.uk/crypt/md5 for more info.
 */
/*jslint bitwise: true */
/*global unescape, jQuery */
function pad(str, max) {
    str = str.toString();
    return str.length < max ? pad("0" + str, max) : str;
}
(function($) {
    'use strict';
    /*
     * Add integers, wrapping at 2^32. This uses 16-bit operations internally
     * to work around bugs in some JS interpreters.
     */
    function safe_add(x, y) {
        var lsw = (x & 0xFFFF) + (y & 0xFFFF),
            msw = (x >> 16) + (y >> 16) + (lsw >> 16);
        return (msw << 16) | (lsw & 0xFFFF);
    }
    /*
     * Bitwise rotate a 32-bit number to the left.
     */
    function bit_rol(num, cnt) {
        return (num << cnt) | (num >>> (32 - cnt));
    }
    /*
     * These functions implement the four basic operations the algorithm uses.
     */
    function md5_cmn(q, a, b, x, s, t) {
        return safe_add(bit_rol(safe_add(safe_add(a, q), safe_add(x, t)), s), b);
    }

    function md5_ff(a, b, c, d, x, s, t) {
        return md5_cmn((b & c) | ((~b) & d), a, b, x, s, t);
    }

    function md5_gg(a, b, c, d, x, s, t) {
        return md5_cmn((b & d) | (c & (~d)), a, b, x, s, t);
    }

    function md5_hh(a, b, c, d, x, s, t) {
        return md5_cmn(b ^ c ^ d, a, b, x, s, t);
    }

    function md5_ii(a, b, c, d, x, s, t) {
        return md5_cmn(c ^ (b | (~d)), a, b, x, s, t);
    }
    /*
     * Calculate the MD5 of an array of little-endian words, and a bit length.
     */
    function binl_md5(x, len) {
        /* append padding */
        x[len >> 5] |= 0x80 << ((len) % 32);
        x[(((len + 64) >>> 9) << 4) + 14] = len;
        var i, olda, oldb, oldc, oldd,
            a = 1732584193,
            b = -271733879,
            c = -1732584194,
            d = 271733878;
        for (i = 0; i < x.length; i += 16) {
            olda = a;
            oldb = b;
            oldc = c;
            oldd = d;
            a = md5_ff(a, b, c, d, x[i], 7, -680876936);
            d = md5_ff(d, a, b, c, x[i + 1], 12, -389564586);
            c = md5_ff(c, d, a, b, x[i + 2], 17, 606105819);
            b = md5_ff(b, c, d, a, x[i + 3], 22, -1044525330);
            a = md5_ff(a, b, c, d, x[i + 4], 7, -176418897);
            d = md5_ff(d, a, b, c, x[i + 5], 12, 1200080426);
            c = md5_ff(c, d, a, b, x[i + 6], 17, -1473231341);
            b = md5_ff(b, c, d, a, x[i + 7], 22, -45705983);
            a = md5_ff(a, b, c, d, x[i + 8], 7, 1770035416);
            d = md5_ff(d, a, b, c, x[i + 9], 12, -1958414417);
            c = md5_ff(c, d, a, b, x[i + 10], 17, -42063);
            b = md5_ff(b, c, d, a, x[i + 11], 22, -1990404162);
            a = md5_ff(a, b, c, d, x[i + 12], 7, 1804603682);
            d = md5_ff(d, a, b, c, x[i + 13], 12, -40341101);
            c = md5_ff(c, d, a, b, x[i + 14], 17, -1502002290);
            b = md5_ff(b, c, d, a, x[i + 15], 22, 1236535329);
            a = md5_gg(a, b, c, d, x[i + 1], 5, -165796510);
            d = md5_gg(d, a, b, c, x[i + 6], 9, -1069501632);
            c = md5_gg(c, d, a, b, x[i + 11], 14, 643717713);
            b = md5_gg(b, c, d, a, x[i], 20, -373897302);
            a = md5_gg(a, b, c, d, x[i + 5], 5, -701558691);
            d = md5_gg(d, a, b, c, x[i + 10], 9, 38016083);
            c = md5_gg(c, d, a, b, x[i + 15], 14, -660478335);
            b = md5_gg(b, c, d, a, x[i + 4], 20, -405537848);
            a = md5_gg(a, b, c, d, x[i + 9], 5, 568446438);
            d = md5_gg(d, a, b, c, x[i + 14], 9, -1019803690);
            c = md5_gg(c, d, a, b, x[i + 3], 14, -187363961);
            b = md5_gg(b, c, d, a, x[i + 8], 20, 1163531501);
            a = md5_gg(a, b, c, d, x[i + 13], 5, -1444681467);
            d = md5_gg(d, a, b, c, x[i + 2], 9, -51403784);
            c = md5_gg(c, d, a, b, x[i + 7], 14, 1735328473);
            b = md5_gg(b, c, d, a, x[i + 12], 20, -1926607734);
            a = md5_hh(a, b, c, d, x[i + 5], 4, -378558);
            d = md5_hh(d, a, b, c, x[i + 8], 11, -2022574463);
            c = md5_hh(c, d, a, b, x[i + 11], 16, 1839030562);
            b = md5_hh(b, c, d, a, x[i + 14], 23, -35309556);
            a = md5_hh(a, b, c, d, x[i + 1], 4, -1530992060);
            d = md5_hh(d, a, b, c, x[i + 4], 11, 1272893353);
            c = md5_hh(c, d, a, b, x[i + 7], 16, -155497632);
            b = md5_hh(b, c, d, a, x[i + 10], 23, -1094730640);
            a = md5_hh(a, b, c, d, x[i + 13], 4, 681279174);
            d = md5_hh(d, a, b, c, x[i], 11, -358537222);
            c = md5_hh(c, d, a, b, x[i + 3], 16, -722521979);
            b = md5_hh(b, c, d, a, x[i + 6], 23, 76029189);
            a = md5_hh(a, b, c, d, x[i + 9], 4, -640364487);
            d = md5_hh(d, a, b, c, x[i + 12], 11, -421815835);
            c = md5_hh(c, d, a, b, x[i + 15], 16, 530742520);
            b = md5_hh(b, c, d, a, x[i + 2], 23, -995338651);
            a = md5_ii(a, b, c, d, x[i], 6, -198630844);
            d = md5_ii(d, a, b, c, x[i + 7], 10, 1126891415);
            c = md5_ii(c, d, a, b, x[i + 14], 15, -1416354905);
            b = md5_ii(b, c, d, a, x[i + 5], 21, -57434055);
            a = md5_ii(a, b, c, d, x[i + 12], 6, 1700485571);
            d = md5_ii(d, a, b, c, x[i + 3], 10, -1894986606);
            c = md5_ii(c, d, a, b, x[i + 10], 15, -1051523);
            b = md5_ii(b, c, d, a, x[i + 1], 21, -2054922799);
            a = md5_ii(a, b, c, d, x[i + 8], 6, 1873313359);
            d = md5_ii(d, a, b, c, x[i + 15], 10, -30611744);
            c = md5_ii(c, d, a, b, x[i + 6], 15, -1560198380);
            b = md5_ii(b, c, d, a, x[i + 13], 21, 1309151649);
            a = md5_ii(a, b, c, d, x[i + 4], 6, -145523070);
            d = md5_ii(d, a, b, c, x[i + 11], 10, -1120210379);
            c = md5_ii(c, d, a, b, x[i + 2], 15, 718787259);
            b = md5_ii(b, c, d, a, x[i + 9], 21, -343485551);
            a = safe_add(a, olda);
            b = safe_add(b, oldb);
            c = safe_add(c, oldc);
            d = safe_add(d, oldd);
        }
        return [a, b, c, d];
    }
    /*
     * Convert an array of little-endian words to a string
     */
    function binl2rstr(input) {
        var i,
            output = '';
        for (i = 0; i < input.length * 32; i += 8) {
            output += String.fromCharCode((input[i >> 5] >>> (i % 32)) & 0xFF);
        }
        return output;
    }
    /*
     * Convert a raw string to an array of little-endian words
     * Characters >255 have their high-byte silently ignored.
     */
    function rstr2binl(input) {
        var i,
            output = [];
        output[(input.length >> 2) - 1] = undefined;
        for (i = 0; i < output.length; i += 1) {
            output[i] = 0;
        }
        for (i = 0; i < input.length * 8; i += 8) {
            output[i >> 5] |= (input.charCodeAt(i / 8) & 0xFF) << (i % 32);
        }
        return output;
    }
    /*
     * Calculate the MD5 of a raw string
     */
    function rstr_md5(s) {
        return binl2rstr(binl_md5(rstr2binl(s), s.length * 8));
    }
    /*
     * Calculate the HMAC-MD5, of a key and some data (raw strings)
     */
    function rstr_hmac_md5(key, data) {
        var i,
            bkey = rstr2binl(key),
            ipad = [],
            opad = [],
            hash;
        ipad[15] = opad[15] = undefined;
        if (bkey.length > 16) {
            bkey = binl_md5(bkey, key.length * 8);
        }
        for (i = 0; i < 16; i += 1) {
            ipad[i] = bkey[i] ^ 0x36363636;
            opad[i] = bkey[i] ^ 0x5C5C5C5C;
        }
        hash = binl_md5(ipad.concat(rstr2binl(data)), 512 + data.length * 8);
        return binl2rstr(binl_md5(opad.concat(hash), 512 + 128));
    }
    /*
     * Convert a raw string to a hex string
     */
    function rstr2hex(input) {
        var hex_tab = '0123456789abcdef',
            output = '',
            x,
            i;
        for (i = 0; i < input.length; i += 1) {
            x = input.charCodeAt(i);
            output += hex_tab.charAt((x >>> 4) & 0x0F) + hex_tab.charAt(x & 0x0F);
        }
        return output;
    }
    /*
     * Encode a string as utf-8
     */
    function str2rstr_utf8(input) {
        return unescape(encodeURIComponent(input));
    }
    /*
     * Take string arguments and return either raw or hex encoded strings
     */
    function raw_md5(s) {
        return rstr_md5(str2rstr_utf8(s));
    }

    function hex_md5(s) {
        return rstr2hex(raw_md5(s));
    }

    function raw_hmac_md5(k, d) {
        return rstr_hmac_md5(str2rstr_utf8(k), str2rstr_utf8(d));
    }

    function hex_hmac_md5(k, d) {
        return rstr2hex(raw_hmac_md5(k, d));
    }
    $.md5 = function(string, key, raw) {
        if (!key) {
            if (!raw) {
                return hex_md5(string);
            } else {
                return raw_md5(string);
            }
        }
        if (!raw) {
            return hex_hmac_md5(key, string);
        } else {
            return raw_hmac_md5(key, string);
        }
    };
}(typeof jQuery === 'function' ? jQuery : this));
/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
$.base64.utf8encode = true;
var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // `load`, `deviceready`, `offline`, and `online`.
    bindEvents: function() {},
    // deviceready Event Handler
    //
    // The scope of `this` is the event. In order to call the `receivedEvent`
    // function, we must explicity call `app.receivedEvent(...);`
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        if(id == "deviceready"){

            document.addEventListener("backbutton", function(e) {
                e.preventDefault();
            }, false);



        }
    },
    scan: function() {
        console.log('scanning');
        var scanner = cordova.plugins.barcodeScanner;
        scanner.scan(function(result) {
            var qr = JSON.parse(result.text);
            connect(qr.servidorip, qr.porta, false);
        }, function(error) {
            console.log("Scanning failed: ", error);
        });
    },

    vibrate: function() {
        try{
              navigator.notification.vibrate( 1000 );
          }
          catch(e){

          }
    },
    scan_table: function() {
        console.log('scanning');
        var scanner = cordova.plugins.barcodeScanner;
        scanner.scan(function(result) {
            if(result.text > 0){
                get_tablestats(pad(result.text, 4), true, 1);
            }
        }, function(error) {
            console.log("Scanning failed: ", error);
        });
    }
};

function loadoverlay(action = 'start') {
    if (action == 'start') {
        $("body").append("<div id='loading'><div class='loader'></div></div>");
        $("#loading").animate({
            'opacity': 0.5
        }, 400);
    } else {
        $("#loading").remove();
    }
}

function msg(content, color = "#2d2d2d", beep = 0){
    $.snackbar({content: content, htmlAllowed: true});
    $(".snackbar").css("background", color)
    if(beep > 0){
        beeper(beep);
    }
}

function beeper(qtd){
        try{    
                var media = new Media('/android_asset/www/chime_bell_ding.wav', null, function(){navigator.notification.beep(qtd)});
                media.play();
        }
        catch(e){
            try{    
                    navigator.notification.beep(qtd);
            }
            catch(e){
            }
        }
}
function dialog(title, msg, action = null, beep = 1) {
    if(beep > 0){
        beeper(beep);
    }
    var html = '<div class="modal"> <div class="modal-dialog"> <div class="modal-content"> <div class="modal-header"> <button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button> <h4 class="modal-title">' + title + '</h4> </div> <div class="modal-body"> <p>' + msg + '</p> </div> <div class="modal-footer"> <button type="button" class="btn btn-default focusme" data-dismiss="modal">Fechar<div class="ripple-container"></div></button> </div> </div> </div>';
    $("body").append(html);
    $(".modal").css("opacity", "0");
    $(".modal").show();
    $(".modal").animate({
        'opacity': 1
    }, 200);
    $(".modal button.focusme").focus();
    $(".modal button").click(function() {
        if ($(this).attr("data-dismiss") == "modal") {
            if (action == null) $(this).parent().parent().parent().parent().remove();
            else {
                action();
                $(this).parent().parent().parent().parent().remove();
            }
        }
    });
}

function limpar() {
    localStorage.clear();
    redirect('index.html');
}

function limpar_login() {
    localStorage.removeItem("authcode");
    localStorage.removeItem("authpass");
    if(localStorage.serverip == window.gourmet.demo){
        limpar();
    }
    else
        redirect('index.html');
}

function limpar_conexao() {
    localStorage.removeItem("serverip");
    localStorage.removeItem("serverport");
    redirect('index.html');
}

function login(code = localStorage.authcode, pass = localStorage.authpass, ip = localStorage.serverip, port = localStorage.serverport, automatic = true) {
    loadoverlay();
    code = pad(code, 4);
    var auth = $.base64('encode', '{"code": "' + code + '", "pass": "' + pass + '"}');
    $.getJSON(window.gourmet.protocol + ip + ":" + port + "/api/api.php?action=login&parameters=" + auth, function(data) {
        if (data.success == true) {
            localStorage.setItem("authcode", code);
            localStorage.setItem("authpass", pass);
            localStorage.setItem("username", data.name);
            redirect('home.html');
        }
        if (data.success == false) {
            if (data.error == "authentication_login") {
                if (automatic === true) dialog("Erro!", "Código ou senha incorretos", limpar_login);
                else {
                    dialog("Erro!", "Código ou senha incorretos");
                }
            }
            if (data.error == "parameters_login") {
                if (automatic === true) dialog("Erro!", "Erro com os parâmetros e login", limpar_login);
                else {
                    dialog("Erro!", "Erro com os parâmetros e login");
                }
            }
            if (data.error == "mysql") {
                dialog("Erro!", "Erro ao se conectar com o MySQL", limpar_conexao);
            }
        }
        loadoverlay("close");
    }).fail(function() {
        dialog("Erro", "Não foi possível se conectar");
        loadoverlay("close");
        if (automatic === true) change('default');
    });
}

function list_opentables(code = localStorage.authcode, pass = localStorage.authpass, ip = localStorage.serverip, port = localStorage.serverport) {
    var auth = $.base64('encode', '{"code": "' + code + '", "pass": "' + pass + '"}');
    loadoverlay();
    $.getJSON(window.gourmet.protocol + ip + ":" + port + "/api/api.php?action=list_opentables&parameters=" + auth, function(data) {
        loadoverlay('stop');
        if (data.success == true) {
            if (data.rows.length > 0) $("ul.opentables").html('');
            $(data.rows).each(function() {
                var classconta = '';
                if (this.PediuConta == 1) classconta = 'pediuconta';
                $("ul.opentables").append("<li class='" + classconta + "' onclick=\"redirect('prevenda.html?tablecod="+this.CodigoNSequencial+"');\"><span class='codigo'>" + this.CodigoNSequencial + "</span></li>");
            });
            // for (i = 1; i < 551; i++) { 
            //   $("ul.opentables").append("<li><span class='codigo'>"+i+"</span></li>");
            // }
            var options = {
                valueNames: ['codigo']
            };
            var userList = new List('content', options);

      // click and hold event listener






        // var timeout_id = 0,
        //     hold_time = 500;
        //     window.pressed = 0;

        //         $('ul.opentables li').mousedown(function() {
        //             window.pressed_cod = $(".codigo", this).html();
        //             timeout_id = setTimeout(aaa, hold_time);
        //         }).bind('mouseup mouseleave', function() {
        //             clearTimeout(timeout_id);
        //             if(window.pressed == 0) setTimeout(function(){top.location.href='prevenda.html?tablecod='+window.pressed_cod}, 300);
        //         });

        //         function aaa() {
        //         window.pressed = 1; 
        //             dialog("Você abriu o menu de opções rápidas.", "Ainda em construção...", function(){ window.pressed = 0;});
        //         }

        }
        if (data.success == false) {
            if (data.error == "authentication_login") {
                dialog("Erro!", "Código ou senha incorretos", limpar_login);
            }
            if (data.error == "parameters_login") {
                dialog("Erro!", "Erro com os parâmetros e login", limpar_login);
            }
            if (data.error == "mysql") {
                dialog("Erro!", "Erro ao se conectar com o MySQL", limpar_conexao);
            }
        }
        loadoverlay("close");
    }).fail(function() {
        dialog("Erro", "Não foi possível se conectar", limpar_conexao);
        loadoverlay("close");
    });
}

function list_reservedtables(code = localStorage.authcode, pass = localStorage.authpass, ip = localStorage.serverip, port = localStorage.serverport) {
    var auth = $.base64('encode', '{"code": "' + code + '", "pass": "' + pass + '"}');
    loadoverlay();
    $.getJSON(window.gourmet.protocol + ip + ":" + port + "/api/api.php?action=list_reservedtables&parameters=" + auth, function(data) {
        loadoverlay('stop');
        if (data.success == true) {
            if (data.rows.length > 0) $("ul.opentables").html('');
            $(data.rows).each(function() {
                $("ul.opentables").append("<li class=\"reserved\" onclick=\"get_tablestats(pad(" + this.CodigoNSequencial + ", 4), true, 1);\"><span class='codigo'>" + this.CodigoNSequencial + "</span></li>");
            });
            // for (i = 1; i < 551; i++) { 
            //   $("ul.opentables").append("<li><span class='codigo'>"+i+"</span></li>");
            // }
            var options = {
                valueNames: ['codigo']
            };
            var userList = new List('content', options);
        }
        if (data.success == false) {
            if (data.error == "authentication_login") {
                dialog("Erro!", "Código ou senha incorretos", limpar_login);
            }
            if (data.error == "parameters_login") {
                dialog("Erro!", "Erro com os parâmetros e login", limpar_login);
            }
            if (data.error == "mysql") {
                dialog("Erro!", "Erro ao se conectar com o MySQL", limpar_conexao);
            }
        }
        loadoverlay("close");
    }).fail(function() {
        dialog("Erro", "Não foi possível se conectar", limpar_conexao);
        loadoverlay("close");
    });
}

function loadcardapio(page = 'categories', catcode = null, code = localStorage.authcode, pass = localStorage.authpass, ip = localStorage.serverip, port = localStorage.serverport) {
    var auth = $.base64('encode', '{"code": "' + code + '", "pass": "' + pass + '", "catcode": "' + catcode + '"}');
    loadoverlay();
      $("input:first").focus();
    if (page == "categories") {
        $("#precototal").hide();
        $("input[name='prdct-qtde']").val('1');
        $("#addproduto").remove();
        $("#precototal .price").css("opacity", 0)
        $(".back").click(function() {
            window.history.back();
        })
        $.getJSON(window.gourmet.protocol + ip + ":" + port + "/api/api.php?action=list_categories&parameters=" + auth, function(data) {
            loadoverlay('stop');
            $("ul.cardapio").html('');
            if (data.success == true) {
                $(data.rows).each(function() {
                    $("ul.cardapio").append("<li id=\"" + this.Codigo + "\"><span class='nome'>" + this.Nome + "</span></li>");
                });
                $("ul.cardapio li").click(function() {
                    loadcardapio('products', $(this).attr("id"))
                });
                // for (i = 1; i < 551; i++) { 
                //   $("ul.opentables").append("<li><span class='codigo'>"+i+"</span></li>");
                // }
                var options = {
                    valueNames: ['nome']
                };
                var userList = new List('content', options);
            }
            if (data.success == false) {
                if (data.error == "authentication_login") {
                    dialog("Erro!", "Código ou senha incorretos", limpar_login);
                }
                if (data.error == "parameters_login") {
                    dialog("Erro!", "Erro com os parâmetros e login", limpar_login);
                }
                if (data.error == "mysql") {
                    dialog("Erro!", "Erro ao se conectar com o MySQL", limpar_conexao);
                }
            }
            loadoverlay("close");
        }).fail(function() {
            dialog("Erro", "Não foi possível se conectar", limpar_conexao);
            loadoverlay("close");
        });
    }
    if (page == "products") {
        $.getJSON(window.gourmet.protocol + ip + ":" + port + "/api/api.php?action=list_products&parameters=" + auth, function(data) {
            $(".back").off("click");
            $(".back").click(function() {
                loadcardapio();
            });
            loadoverlay('stop');
            if (data.success == true) {
                $("ul.cardapio").html('');
                $(data.rows).each(function() {
                    $("ul.cardapio").append("<li id=\"" + this.Codigo + "\" data-valor=\"" + this.Venda + "\"><span class='nome'>" + this.Mini + "</span></li>");
                });
                // for (i = 1; i < 551; i++) { 
                //   $("ul.opentables").append("<li><span class='codigo'>"+i+"</span></li>");
                // }
                var options = {
                    valueNames: ['nome']
                };
                $("input.search").attr("placeholder", "Filtrar produtos");
                $("input.search").val('');
                $("input.search").change();
                var userList = new List('content', options);
                $("ul.cardapio li").click(function() {
                if($("#addproduto").length == 0)
                $("#precototal").after('<a href="javascript:void(0)" id="addproduto" onclick="process_add();" class="btn btn-raised btn-success" style="margin-top: 23px;border-top-left-radius: 0px;border-top-right-radius: 0px;">Adicionar produto<div class="ripple-container"></div></a>');
                
            $("#precototal").show();
                    $("ul.cardapio li").attr("class", "");
                    $(this).addClass("selected");
                    $("input[name='prdct-qtde']").val('1');
                    $("#precototal").show();
                    $("#precototal .price").css("opacity", 1);
                    window.details = {
                        "product_id": $(this).attr("id"),
                        "name": $(".nome", this).html(),
                        "qtde": $("input[name='prdct-qtde']").val(),
                        "table": parseURLParams(location.href).tablecod[0]
                    };
                    $("#precototal .price").html("Valor total: R$" + parseFloat($(this).attr("data-valor")).toFixed(2).replace(".", ",").replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,"));
                });
                $("input[name='prdct-qtde']").change(function() {
                    window.details = {
                        "product_id": $("ul.cardapio li.selected").attr("id"),
                        "name": $("ul.cardapio li.selected .nome").html(),
                        "qtde": $("input[name='prdct-qtde']").val(),
                        "table": parseURLParams(location.href).tablecod[0]
                    };
                    var valor = parseFloat($("ul.cardapio li.selected").attr("data-valor")) * parseInt($(this).val());
                    $("#precototal .price").html("Valor total: R$" + valor.toFixed(2).replace(".", ",").replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,"));
                })
            }
            if (data.success == false) {
                if (data.error == "authentication_login") {
                    dialog("Erro!", "Código ou senha incorretos", limpar_login);
                }
                if (data.error == "parameters_login") {
                    dialog("Erro!", "Erro com os parâmetros e login", limpar_login);
                }
                if (data.error == "mysql") {
                    dialog("Erro!", "Erro ao se conectar com o MySQL", limpar_conexao);
                }
            }
            loadoverlay("close");
        }).fail(function() {
            dialog("Erro", "Não foi possível se conectar", limpar_conexao);
            loadoverlay("close");
        });
    }
}

function list_prevenda(table, code = localStorage.authcode, pass = localStorage.authpass, ip = localStorage.serverip, port = localStorage.serverport) {
    var auth = $.base64('encode', '{"code": "' + code + '", "pass": "' + pass + '", "tablecod": "' + table + '"}');
    loadoverlay();
    $.getJSON(window.gourmet.protocol + ip + ":" + port + "/api/api.php?action=list_prevenda&parameters=" + auth, function(data) {
        loadoverlay('stop');
        if (data.success == true) {
            var total = 0;
            $("#list_prevenda tbody").html('');
            $(data.rows).each(function() {
                total = total + parseFloat(this.Valor);
                var acomp = '';
                if(this.ItemAcompanhado > 0){ 
                    acomp = 'class="item_acomp" style="display: flex;" data-parent-id="'+this.ItemAcompanhado+'"';
                }

                $("#list_prevenda tbody").append("<tr data-price='"+parseFloat(this.Valor)+"' id='"+this.NItem+"' "+acomp+"> <td style='width: 15%; text-align: center;'>" + parseInt(this.Qtde) + "</td> <td style='width: 45%;'>" + this.Descricao + "</td> <td style='width: 25%;' class='price'>R$" + parseFloat(this.Valor).toFixed(2).replace(".", ",").replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,") + "</td> <td syle='width: 15%;' class='arrow'></td> </tr>");
            });
            $("#list_prevenda tbody").append("<tr class='warning'> <td style='width: 15%;'></td> <td  style='width: 45%;'><strong>TOTAL</strong></td> <td style='width: 25%;'><strong>R$" + total.toFixed(2).replace(".", ",").replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,") + "</strong></td> <td style='width: 15%;'></td> </tr>");
            get_tablestats(table);

            $(".item_acomp").each(function(){
                var html = $(this)[0].outerHTML;
                var id = $(this).attr("id");
                var parent_id = $(this).attr("data-parent-id");
                $(this).remove();
                $("tr#"+parent_id).after(html);
                $("tr#"+parent_id).addClass("item_parent");

                    $("tr#"+parent_id+" .arrow").html('<i class="material-icons">&#xE313;</i>');
                    var parent_price = $("tr#"+parent_id).attr("data-price");
                    parent_price = parseFloat(parent_price) + parseFloat($("tr#"+id).attr("data-price"));
                    $("tr#"+parent_id).attr("data-price", parent_price);
                    $("tr#"+parent_id+" td.price").html('R$'+parseFloat(parent_price).toFixed(2).replace(".", ",").replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,"));
            });
            $(".item_acomp").hide();
            $(".item_parent .arrow").click(function(){
                var parent_id = $(this).parent().attr("id");
                $(".item_acomp[data-parent-id='"+parent_id+"']").toggle(100);

                if($(this).html() == '<i class="material-icons">keyboard_arrow_up</i>'){
                    $(this).html('<i class="material-icons">keyboard_arrow_down</i>')
                }
                else{
                    $(this).html('<i class="material-icons">keyboard_arrow_up</i>');
                }

            })
        }
        if (data.success == false) {
            if (data.error == "authentication_login") {
                dialog("Erro!", "Código ou senha incorretos", limpar_login);
            }
            if (data.error == "parameters_login") {
                dialog("Erro!", "Erro com os parâmetros e login", limpar_login);
            }
            if (data.error == "mysql") {
                dialog("Erro!", "Erro ao se conectar com o MySQL", limpar_conexao);
            }
        }
        loadoverlay("close");
    }).fail(function() {
        dialog("Erro", "Não foi possível se conectar", limpar_conexao);
        loadoverlay("close");
    });
}

function get_tablestats(table, newtable = false, peopleamount = null, code = localStorage.authcode, pass = localStorage.authpass, ip = localStorage.serverip, port = localStorage.serverport) {
    var auth = $.base64('encode', '{"code": "' + code + '", "pass": "' + pass + '", "tablecod": "' + table + '"}');
    loadoverlay();
    $.getJSON(window.gourmet.protocol + ip + ":" + port + "/api/api.php?action=get_tablestats&parameters=" + auth, function(data) {
        loadoverlay('stop');
        if (data.success == true) {
            if (newtable == true) {
                if (data.stats == 'open') {
                    setmsg("Esta mesa já estava aberta!");
                        redirect("prevenda.html?tablecod=" + table);
                }
                if (data.stats == 'closed') {
                    //alert("abrir mesa "+table+" para "+peopleamount+" pessoas");
                    if (data.eminentbooking !== undefined && data.eminentbooking !== null) {
                        dialog("Atenção", "Reserva eminente para <b>" + data.eminentbooking.Nome + "</b> às <b>" + data.eminentbooking.dataHora + '</b>', function() {
                            redirect('novopedido.html?tablecod=' + table);
                        });
                    } else redirect('novopedido.html?tablecod=' + table);
                }
            } else {
                if (data.stats == 'open') {
                    $("input[name='people-number']").val(data.NumPessoas);
                }
            }
        }
        if (data.success == false) {
            if (data.error == "authentication_login") {
                dialog("Erro!", "Código ou senha incorretos", limpar_login);
            }
            if (data.error == "parameters_login") {
                dialog("Erro!", "Erro com os parâmetros e login", limpar_login);
            }
            if (data.error == "mysql") {
                dialog("Erro!", "Erro ao se conectar com o MySQL", limpar_conexao);
            }
        }
        loadoverlay("close");
    }).fail(function() {
        dialog("Erro", "Não foi possível se conectar", limpar_conexao);
        loadoverlay("close");
    });
}

function adicionar_produto(product_code, qtde, table, name, time = parseInt(Date.now()), code = localStorage.authcode, pass = localStorage.authpass, ip = localStorage.serverip, port = localStorage.serverport) {
    var auth = $.base64('encode', '{"code": "' + code + '", "pass": "' + pass + '", "product_code": "' + product_code + '", "qtde": ' + qtde + ', "time": "' + time + '", "tablecod": "' + table + '"}');
    loadoverlay();
    $.getJSON(window.gourmet.protocol + ip + ":" + port + "/api/api.php?action=new_item&parameters=" + auth, function(result) {
        loadoverlay('stop');
        if (result.success == true) {
            localStorage.setItem("newitem", JSON.stringify(result.rows));
            redirect('mapper.html');
        }
        if (result.success == false) {
            if (result.error == "authentication_login") {
                dialog("Erro!", "Código ou senha incorretos", limpar_login);
            }
            if (result.error == "parameters_login") {
                dialog("Erro!", "Erro com os parâmetros e login", limpar_login);
            }
            if (result.error == "mysql") {
                dialog("Erro!", "Erro ao se conectar com o MySQL", limpar_conexao);
            }
        }
        loadoverlay("close");
    }).fail(function() {
        dialog("Erro", "Não foi possível se conectar", limpar_conexao);
        loadoverlay("close");
    });
}

function vernovopedido(table, code = localStorage.authcode, pass = localStorage.authpass, ip = localStorage.serverip, port = localStorage.serverport) {
    var pedido = localStorage.getItem("pedidoaberto");
    pedido = JSON.parse(pedido);
    var produtos = [];
    $(pedido).each(function() {
        if (this.ingredientes !== undefined) {
            if (this.ingredientes[0].Padrao !== undefined) {
                return true; //PULA PARA O PROXIMO LOOP SE O INGREDIENTE NAO FOI DEFINIDO
            }
        }
        if (this.table == table) {
            produtos.push(this);
        }
    });
    if (produtos.length > 0) {
        var auth = $.base64('encode', '{"code": "' + code + '", "pass": "' + pass + '", "rows": "' + $.base64('encode', JSON.stringify(produtos)) + '"}');
        loadoverlay();
        $.post(window.gourmet.protocol + ip + ":" + port + "/api/api.php?action=pre_processlist", {"parameters": auth}, function(data) {
            loadoverlay('stop');
            if (data.success == true) {
                if(data.controleproducao == "True"){
                    $("#controledeproducao").show();
                    if(window.controleatt != 1){
                        window.controleatt = 1;
                        $("#controledeproducao .checkbox-material").click();
                    }
                }
                var total = 0;
                localStorage.setItem("pedidoaberto", JSON.stringify(data.rows));
                $("#list_prevenda tbody").html('');
                $(data.rows).each(function() {
                    this.qtde = 1;
                    var parent_id = this.time;
                    var valorproduto = parseFloat(this.ValorUnitario);
                    var acompanhamentoshtml = '';
                    if(typeof this.acompanhamentos != "undefined"){
                                        $(this.acompanhamentos).each(function(key, value){
                                            valorproduto += parseFloat(value.valoracomp); 
                                            acompanhamentoshtml += "<tr style='display: flex;' id='"+this.time+"' data-parent-id='"+parent_id+"' class='item_acomp' style='' data-timestamp='" + this.time + "'> <td style='width: 15%;'></td> <td style='width: 45%;'>" + this.name + "</td> <td class='price' style='width: 25%;'>R$" + parseFloat(this.valoracomp).toFixed(2).replace(".", ",").replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,") + "</td><td style=\"text-align: center; width: 15%;\"></td></tr>"
                                        });
                    }
                    total = total + (parseFloat(valorproduto) * parseInt(this.qtde));
                    $("#list_prevenda tbody").append("<tr id='"+this.time+"' class='item_parent' data-timestamp='" + this.time + "'><td class='arrow' style='width:15%'></td><td style='display:none;'><input class='form-control' id='inputSmall' name='" + this.time + "_qtdi' type='text' maxlenght='2' value='" + parseInt(this.qtde) + "'/> <div class=\"prdct-qtde-novopedido\" data-controlname=\"" + this.time + "_qtdi\"> <i class=\"material-icons\" onclick=\"control_qt('0', this);\">&#xE15B;</i> <i class=\"material-icons\" onclick=\"control_qt('1', this);\">&#xE145;</i> </div></td> <td  style='width:45%'>" + this.nome + "</td> <td style='width:25%' class='price'>R$" + (parseFloat(valorproduto) * parseInt(this.qtde)).toFixed(2).replace(".", ",").replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,") + "</td><td style='width:15%' style=\"text-align: center;\"><i class=\"material-icons delete_row_pedido\">&#xE872;</i></td></tr>");
                    if (acompanhamentoshtml.length > 0) {
                    $(".arrow").last().html('<i class="material-icons">&#xE313;</i>');
                    $("#list_prevenda tbody").append(acompanhamentoshtml);
                    }
                    else $(".arrow").last().removeClass("arrow");
                });

            $(".item_parent .arrow").click(function(){
                var parent_id = $(this).parent().attr("id");
                $(".item_acomp[data-parent-id='"+parent_id+"']").toggle(100);

                if($(this).html() == '<i class="material-icons">keyboard_arrow_up</i>'){
                    $(this).html('<i class="material-icons">keyboard_arrow_down</i>')
                }
                else{
                    $(this).html('<i class="material-icons">keyboard_arrow_up</i>');
                }

            })
            $(".item_acomp").hide();
                $("#list_prevenda tbody").append("<tr class='warning'><td style='width:15%'></td> <td style='width:45%'><strong>TOTAL</strong></td> <td style='display:none;'></td> <td style='width:35%'><strong>R$" + total.toFixed(2).replace(".", ",").replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,") + "</strong></td><td style='width:15%'></td> </tr>");
                $(".delete_row_pedido").click(function() {
                    var key = $(this).parent().parent().attr("data-timestamp");
                    $(this).parent().parent().remove();
                    $("[data-parent-id='"+key+"']").remove();
                    $("tr.warning").css("opacity", 0);
                    $(data.rows).each(function(index, value) {
                        if (this.time == key) {
                            delete data.rows[index];
                            localStorage.setItem("pedidoaberto", JSON.stringify(data.rows));
                            vernovopedido(table);
                        }
                    });
                });
                $("tr input").change(function() {
                    var newval = $(this).val();
                    var key = $(this).parent().parent().attr("data-timestamp");
                    $("tr.warning").css("opacity", 0);
                    $(data.rows).each(function(index, value) {
                        if (this.time == key) {
                            data.rows[index].qtde = newval;
                            localStorage.setItem("pedidoaberto", JSON.stringify(data.rows));
                            vernovopedido(table);
                        }
                    });
                });
            }
            if (data.success == false) {
                if (data.error == "authentication_login") {
                    dialog("Erro!", "Código ou senha incorretos", limpar_login);
                }
                if (data.error == "parameters_login") {
                    dialog("Erro!", "Erro com os parâmetros e login", limpar_login);
                }
                if (data.error == "mysql") {
                    dialog("Erro!", "Erro ao se conectar com o MySQL", limpar_conexao);
                }
            }
            loadoverlay("close");
        }, "json").fail(function() {
            dialog("Erro", "Não foi possível se conectar", limpar_conexao);
            loadoverlay("close");
        });
    }
    get_tablestats(table);
}

function solicitar_fechamento(table, peopleamount = 0, code = localStorage.authcode, pass = localStorage.authpass, ip = localStorage.serverip, port = localStorage.serverport) {
    loadoverlay();
    var auth = $.base64('encode', '{"code": "' + code + '", "pass": "' + pass + '", "table": "' + table + '", "peopleamount": "' + peopleamount + '"}');
    $.getJSON(window.gourmet.protocol + ip + ":" + port + "/api/api.php?action=solicitar_fechamento&parameters=" + auth, function(data) {
        loadoverlay('stop');
        if (data.success == true) {
            setmsg("Fechamento solicitado.");
            redirect('home.html');
        }
        if (data.success == false) {
            if (data.error == "authentication_login") {
                dialog("Erro!", "Código ou senha incorretos", limpar_login);
            }
            if (data.error == "parameters_login") {
                dialog("Erro!", "Erro com os parâmetros e login", limpar_login);
            }
            if (data.error == "mysql") {
                dialog("Erro!", "Erro ao se conectar com o MySQL", limpar_conexao);
            } else {
                dialog("Erro!", "Erro não identificado");
            }
        }
    }).fail(function() {
        dialog("Erro", "Não foi possível se conectar", limpar_conexao);
        loadoverlay("close");
    });
}

function finish(table, code = localStorage.authcode, pass = localStorage.authpass, ip = localStorage.serverip, port = localStorage.serverport) {
    loadoverlay();
    var pedido = localStorage.getItem("pedidoaberto");
    var obspedido = '';
    if(localStorage.getItem("obspedido") !== null)
        obspedido =  $.base64('encode', localStorage.getItem("obspedido"));


    pedido = JSON.parse(pedido);
    var produtos = [];
    $(pedido).each(function() {
        if (this.table == table) {
            produtos.push(this);
        }
    });
    if($("#controledeproducao input").is(':checked')){
        var controledeproducao = 1;
    }
    else{
        var controledeproducao = 0;
    }

    var auth = $.base64('encode', '{"code": "' + code + '", "pass": "' + pass + '", "controledeproducao": '+controledeproducao+', "obspedido": "'+obspedido+'", "rows": "' + $.base64('encode', JSON.stringify(produtos)) + '", "peopleamount": "' + $("input[name='people-number']").val() + '"}');


    $.post(window.gourmet.protocol + ip + ":" + port + "/api/api.php?action=finishorder", {"parameters": auth}, function(data) {
        loadoverlay('stop');
        if (data.success == true) {
            setmsg("<i class=\"material-icons\">&#xE876;</i> Pedido efetuado com sucesso", "#4caf50", 1);
            redirect('home.html');
        }
        if (data.success == false) {
            if (data.error == "authentication_login") {
                dialog("Erro!", "Código ou senha incorretos", limpar_login);
            }
            else if (data.error == "parameters_login") {
                dialog("Erro!", "Erro com os parâmetros e login", limpar_login);
            }
            else if (data.error == "mysql_rollback") {
                dialog("Erro!", "Erro na inserção dos produtos no MySQL, tente mais tarde. Se o erro persistir contate suporte técnico. <br /><br /><br /><i style='font-size:8pt;'>" + data.desc + "</i>");
            }
            else if (data.error == "mysql") {
                dialog("Erro!", "Erro ao se conectar com o MySQL", limpar_conexao);
            } else {
                dialog("Erro!", "Erro não identificado");
            }
        }
    }, "json");
}

function loadingredientes(key) {
    var pedido = localStorage.getItem("newitem");
    pedido = JSON.parse(pedido);
    var item;
    $(pedido).each(function() {
        if (this.time == key) {
            item = this;
        }
    });
    if (typeof item == "undefined") {
        $(pedido).each(function() {
            $(this.acompanhamentos).each(function() {
                if (this.time == key) {
                    item = this;
                }
            });
        });
    }
    $(".install .col-md-12").first().after("<div>INGREDIENTES DE <b>" + item.name + "</b></div>");
    var q = {
        "NAO": "q1",
        "POUCO": "q2",
        "NORMAL": "q3",
        "MUITO": "q4"
    };
    var qinvert = {
        "q1": "NAO",
        "q2": "POUCO",
        "q3": "NORMAL",
        "q4": "MUITO"
    };
    var qlist = ["q1", "q2", "q3", "q4"];
    console.log(item);
    $(item.ingredientes).each(function() {
        $("table#list_ingredientes tbody").append('<tr><td><div class="ing_title first">' + this.Ingrediente + '</div><div class="qntd_ingr q4"><i class="material-icons">&#xE877;</i></div></td> <td><div class="ing_title">&nbsp;</div><div class="qntd_ingr q3"><i class="material-icons">&#xE876;</i></div></td> <td><div class="ing_title">&nbsp;</div><div class="qntd_ingr q2"><i class="material-icons">&#xE15B;</i></div></td> <td><div class="ing_title">&nbsp;</div><div class="qntd_ingr q1"><i class="material-icons">&#xE14C;</i></div></td></tr>');
        $(".qntd_ingr." + q[this.Padrao], $("table#list_ingredientes tbody tr").last()).addClass("clicked");
    });
    $("tbody .qntd_ingr").click(function() {
        var el = this;
        $(".qntd_ingr", $(this).parent().parent()).each(function() {
            $(this).removeClass("clicked");
        });
        $(this).addClass("clicked");
    });
    $("thead .qntd_ingr").click(function() {
        var el = this;
        $(qlist).each(function() {
            var theq = this;
            if ($(el).hasClass(theq)) {
                $("tbody ." + theq).click();
            }
        });
    });
    $("#continue").click(function() {
        var new_ingredientes = seriealize_buttons();
        item.ingredientes = new_ingredientes;
        //remover item


        if (parseURLParams(location.href).acomp == 'true') {
            $(pedido).each(function(parent_index, value) {
                $(pedido[parent_index].acompanhamentos).each(function(child_index, value_child) {
                    if (parseURLParams(location.href).key == pedido[parent_index].acompanhamentos[child_index].time) {
                        pedido[parent_index].acompanhamentos[child_index].ingredientes = new_ingredientes;
                    }
                });
            });
        }
        else{
        $(pedido).each(function(index, value) {
            if (this.time == item.time) {
                pedido[index] = item;
            }
        });
        }
        localStorage.setItem("newitem", JSON.stringify(pedido));
        redirect('mapper.html');
    });
}

function loadAcompanhamentos(key, code = localStorage.authcode, pass = localStorage.authpass, ip = localStorage.serverip, port = localStorage.serverport) {
    var pedido = localStorage.getItem("newitem");
    pedido = JSON.parse(pedido);
    var item;
    $(pedido).each(function() {
        if (this.time == key) {
            item = this;
        }
    });
    $(".install .col-md-12").first().after("<div>ACOMPANHAMENTOS DE <b>" + item.name + "</b></div>");
    $(item.acompanhamentos).each(function() {
        $("table#list_acompanhamentos tbody").append("<tr id='"+this.time+"'><td><div>" + this.name + "</div></td> <td><input class='form-control' id='inputSmall' name='" + this.time + "_qtdi' type='text' maxlenght='2' value='" + parseInt(this.qtde_default) + "'/><div class=\"prdct-qtde-novopedido\" data-controlname=\"" + this.time + "_qtdi\"> <i class=\"material-icons\" onclick=\"control_qt2('0', this, "+this.max_qtde+");\">&#xE15B;</i> <i class=\"material-icons\" onclick=\"control_qt2('1', this, "+this.max_qtde+");\">&#xE145;</i> </div></td> </tr>");
    });
    $("tbody .qntd_ingr").click(function() {
        var el = this;
        $(".qntd_ingr", $(this).parent().parent()).each(function() {
            $(this).removeClass("clicked");
        });
        $(this).addClass("clicked");
    });
    $("thead .qntd_ingr").click(function() {
        var el = this;
        $(qlist).each(function() {
            var theq = this;
            if ($(el).hasClass(theq)) {
                $("tbody ." + theq).click();
            }
        });
    });
    $("#continue").click(function() {
        var new_acomp = seriealize_buttons();
        var new_acomp_data = [];
        $(item.acompanhamentos).each(function(index, value) {
            var this_new = new_acomp[item.acompanhamentos[index].time];
            
              for (var i = 0; i < this_new.qtd; i++) {

                    item.acompanhamentos[index].choosed = true;
                    var dataa = item.acompanhamentos[index];
                    new_acomp_data.push(dataa);
              }
        });


    var auth = $.base64('encode', '{"code": "' + code + '", "pass": "' + pass + '", "new_acomp_data": "' + $.base64('encode', JSON.stringify(new_acomp_data)) + '"}');

    $.post(window.gourmet.protocol + ip + ":" + port + "/api/api.php?action=remake_ids", {"parameters": auth}, function(data) {
        loadoverlay('stop');
        if (data.success == true) {

        $(pedido).each(function(index, value) {
            if (this.time == key) {
                pedido[index].acompanhamentos = data.new_acomp_data;
            }
        });
        console.log(pedido);
        localStorage.setItem("newitem", JSON.stringify(pedido));
        redirect('mapper.html');

        }
        if (data.success == false) {
            if (data.error == "authentication_login") {
                dialog("Erro!", "Código ou senha incorretos", limpar_login);
            }
            if (data.error == "parameters_login") {
                dialog("Erro!", "Erro com os parâmetros e login", limpar_login);
            }
            if (data.error == "mysql") {
                dialog("Erro!", "Erro ao se conectar com o MySQL", limpar_conexao);
            }
        }

    }, "json");
    });
}

function demo(){
    localStorage.setItem("serverip", window.gourmet.demo);
    localStorage.setItem("serverport", '443');
    localStorage.setItem("protocol", 'https://');
    window.gourmet.protocol = 'https://';
    localStorage.setItem("authcode", '1');
    localStorage.setItem("authpass", '1');
    connect();
}

function getversion(ip = localStorage.serverip, port = localStorage.serverport, automatic = true) {
    $.getJSON(window.gourmet.protocol + ip + ":" + port + "/api/api.php?action=version", function(data) {
        if (data.success == true) {
          $("#apiversion").html(data.version)
        }
        loadoverlay("close");
    }).fail(function() {
        dialog("Erro", "Não foi possível se conectar");
        loadoverlay("close");
    });
}


function connect(ip = localStorage.serverip, port = localStorage.serverport, automatic = true) {
    if(port != 443){
        localStorage.setItem("protocol", 'http://');
        window.gourmet.protocol = 'http://';
    }
    var fire = new Date().getTime();
    loadoverlay();
    $.getJSON(window.gourmet.protocol + ip + ":" + port + "/api/api.php", function(data) {
        var loaded = new Date().getTime();
        if (data.success == true) {
            localStorage.setItem("serverip", ip);
            localStorage.setItem("serverport", port);
            if (localStorage.getItem("authcode") !== null && localStorage.getItem("authpass") !== null && localStorage.getItem("serverip") !== null && localStorage.getItem("serverport") !== null) {
                login();
            } else {
                msg("Conexão estabelecida com sucesso. Tempo de resposta: "+((loaded-fire)/1000).toFixed(2)+"s", "#4caf50", 1);
                change('login');
            }
        }
        if (data.success == false) {
            if (data.error == "mysql") {
                dialog("Erro!", "Erro ao se conectar com o MySQL");
            }
            if (automatic === true) change('default');
        }
        loadoverlay("close");
    }).fail(function() {
        dialog("Erro", "Não foi possível se conectar");
        loadoverlay("close");
        if (automatic === true) change('default');
    });
}

function control_qt(p, el) {
    var input = $("input[name='" + $(el).parent().attr("data-controlname") + "']");
    var value = parseInt($(input).val());
    if (p == 0 && value > 1) $(input).val(value - 1);
    if (p == 1) $(input).val(value + 1);
    $(input).change();
}

function control_qt2(p, el, max) {
    var input = $("input[name='" + $(el).parent().attr("data-controlname") + "']");
    var value = parseInt($(input).val());
    if (p == 0 && value > 0) $(input).val(value - 1);
    if (p == 1) $(input).val(value + 1);
    if(max > 0){
        if(parseInt($(input).val()) > max) $(input).val(max);
    }
    $(input).change();
}

function parseURLParams(url) {
    var queryStart = url.indexOf("?") + 1,
        queryEnd = url.indexOf("#") + 1 || url.length + 1,
        query = url.slice(queryStart, queryEnd - 1),
        pairs = query.replace(/\+/g, " ").split("&"),
        parms = {},
        i, n, v, nv;
    if (query === url || query === "") return;
    for (i = 0; i < pairs.length; i++) {
        nv = pairs[i].split("=", 2);
        n = decodeURIComponent(nv[0]);
        v = decodeURIComponent(nv[1]);
        if (!parms.hasOwnProperty(n)) parms[n] = [];
        parms[n].push(nv.length === 2 ? v : null);
    }
    return parms;
}
var rotate = 0;
$(".cm-gourmet-monocolor-icon").click(function() {
    rotate = rotate - 360; 
    $(this).attr("style", "-webkit-transform: rotate("+rotate+"deg); -moz-transform: rotate("+rotate+"deg); -ms-transform: rotate("+rotate+"deg); -o-transform: rotate("+rotate+"deg); transform: rotate("+rotate+"deg);");
});

function verifymsgs(){
    if(localStorage.getItem("msgs") !== null){
        var msgs = localStorage.getItem("msgs");
        msgs = JSON.parse(msgs);
        $(msgs).each(function(){
            msg(this.content, this.color, this.beep);
        })
    }
    localStorage.removeItem("msgs");
}
function setmsg(content, color = "#2d2d2d", beep = 0){
    if(localStorage.getItem("msgs") !== null){
        var msgs = localStorage.getItem("msgs");
        msgs = JSON.parse(msgs);
    }
    else{
        msgs = [];
    }
    msgs.push({"content": content, "color": color, "beep": beep});
    msgs = JSON.stringify(msgs);
    localStorage.setItem("msgs", msgs);
}
function print_r(o){
return JSON.stringify(o,null,'\t').replace(/\n/g,'<br>').replace(/\t/g,'&nbsp;&nbsp;&nbsp;'); }

function redirect(url){
    try{
    window.plugins.nativepagetransitions.fade( {"duration":  150, "androiddelay": 50, "href": url }, function (msg) {}, function (msg) {
    top.location.href = url; });
    }
    catch(e){
        self.location.href = url;
    }

}

$(document).ready(function(){
    $.ajaxSetup({
        timeout: window.gourmet.timeout*1000
    });
        setTimeout(function(){
        verifymsgs();
    }, 900);
            $("*[href]").click(function(e){
                if($(this).attr('href') != "#" && $(this).attr('href') != "javascript:void(0)" && $(this).attr('href') != "javascript:void(0);"){
                    var url  = $(this).attr('href');
                    e.preventDefault();
                    redirect(url);
                }
            });

});