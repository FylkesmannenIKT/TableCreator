(function (factory) {
if (typeof WSDEBUG === 'undefined') {
window.WSDEBUG = true;
}
var addAsync = function(){
if(!window.asyncWebshims){
window.asyncWebshims = {
cfg: [],
ready: []
};
}
};
var start = function(){
if(window.jQuery){
factory(jQuery);
factory = function(){return window.webshims;};
}
};


window.webshims = {
setOptions: function(){
addAsync();
window.asyncWebshims.cfg.push(arguments);
},

ready: function(){
addAsync();
window.asyncWebshims.ready.push(arguments);
},
activeLang: function(lang){
addAsync();
window.asyncWebshims.lang = lang;
},
polyfill: function(features){
addAsync();
window.asyncWebshims.polyfill = features;
},
_curScript: (function(){
var scripts, i, scriptUrl, match, regUrl;
//modern browsers: Chrome 29+, Firefox 4+
var currentScript = document.currentScript;

//in debug mode remove result to fully test fallback in all browsers
if(WSDEBUG){
currentScript = false;
}
if (!currentScript) {
//error trick: works in Safari, Chrome, Firefox, IE 10+
//idea found here: https://github.com/samyk/jiagra/
try {
throw(new Error(''));
} catch (e) {
//Safari has sourceURL
scriptUrl = (e.sourceURL || e.stack || '').split('\n');
regUrl = /(?:fil|htt|wid|abo|app|res)(.)+/i;

for(i = 0; i < scriptUrl.length; i++){
//extract scriptUrl from stack: this is dangerous! All browsers have different string patterns (pattern can even vary between different browser versions). Help to make it bulletproof!!!
if((match = scriptUrl[i].match(regUrl))){
scriptUrl = match[0].replace(/[\:\s\(]+[\d\:\)\(\s]+$/, '');
break;
}
}


}

scripts = document.scripts || document.getElementsByTagName('script');

//get script by URL or by readyState == 'interactive' (readySate is supported in IE10-)
//if this fails the last found script is set to the currentScript
for (i = 0; i < scripts.length; i++) {
if(scripts[i].getAttribute('src')){
currentScript = scripts[i];
if (scripts[i].readyState == 'interactive' || scriptUrl == scripts[i].src) {
if(WSDEBUG){
currentScript.wsFoundCurrent = true;
}
break;
}
}
}
}

return currentScript;
})()
};
window.webshim = window.webshims;


window.webshims.timer = setInterval(start, 0);
start();

if (typeof define === 'function' && define.amd) {
define('polyfiller', ['jquery'], factory);
}
}(function($){
"use strict";
var firstRun, path;
var navigator = window.navigator;
var webshims = window.webshims;
var DOMSUPPORT = 'dom-support';
var special = $.event.special;
var emptyJ = $([]);

var asyncWebshims = window.asyncWebshims;
var support = {};
var Object = window.Object;
var addSource = function(text){
return text +"\n//# sourceURL="+this.url;
};
var getAutoEnhance = function(prop){
return !webCFG.enhanceAuto && prop == 'auto' ? false : prop;
};
var featureAlias = {
matchmedia: 'matchMedia',
xhr2: 'filereader',
promise: 'es6',
URL: 'url'
};
var supportCapture = 'capture' in create('input');

clearInterval(webshims.timer);
support.advancedObjectProperties = support.objectAccessor = support.ES5 = !!('create' in Object && 'seal' in Object);

if(support.ES5 && !('toJSON' in Date.prototype)){
support.ES5 = false;
}


path = ($.support.hrefNormalized === false) ? webshims._curScript.getAttribute("src", 4) : webshims._curScript.src;
path = path.split('?')[0].slice(0, path.lastIndexOf("/") + 1) + 'shims/';

function create(name){
return document.createElement(name);
}

$.extend(webshims, {
version: '1.15.10',

cfg: {
enhanceAuto: window.Audio && (!window.matchMedia || matchMedia('(min-device-width: 721px)').matches),
//addCacheBuster: false,
waitReady: true,
//extendNative: false,
loadStyles: true,
wsdoc: document,
wspopover: {appendTo: 'auto', hideOnBlur: true},
ajax: {crossDomain: true},
loadScript: function(src, success){
$.ajax($.extend({}, webCFG.ajax, {url: src, success: success, dataType: 'script', cache: true, global: false, dataFilter: addSource}));
},
basePath: path
},
support: support,
bugs: {},
/*
 * some data
 */
modules: {},
features: {},
featureList: [],
setOptions: function(name, opts){
if (typeof name == 'string' && arguments.length > 1) {
webCFG[name] = (!$.isPlainObject(opts)) ? opts : $.extend(true, webCFG[name] || {}, opts);
} else if (typeof name == 'object') {
$.extend(true, webCFG, name);
}
},
_getAutoEnhance: getAutoEnhance,
addPolyfill: function(name, cfg){
cfg = cfg || {};
var feature = cfg.f || name;
if (!webshimsFeatures[feature]) {
webshimsFeatures[feature] = [];
webshims.featureList.push(feature);
webCFG[feature] = {};
}

webshimsFeatures[feature].push(name);
cfg.options = $.extend(webCFG[feature], cfg.options);

addModule(name, cfg);
if (cfg.methodNames) {
$.each(cfg.methodNames, function(i, methodName){
webshims.addMethodName(methodName);
});
}
},
polyfill: (function(){
var loaded = {};
return function(features){
if(!features){
features = webshims.featureList;
WSDEBUG && webshims.warn('loading all features without specifing might be bad for performance');
}

if (typeof features == 'string') {
features = features.split(' ');
}

if(WSDEBUG){
for(var i = 0; i < features.length; i++){
if(loaded[features[i]]){
webshims.error(features[i] +' already loaded, you might want to use updatePolyfill instead? see: afarkas.github.io/webshim/demos/#Shiv-dynamic-html5');
}
loaded[features[i]] = true;
}
}
return webshims._polyfill(features);
};
})(),
_polyfill: function(features){
var toLoadFeatures = [];
var hasFormsExt, needExtStyles;

if(!firstRun.run){
hasFormsExt = $.inArray('forms-ext', features) !== -1;
firstRun();
needExtStyles = (hasFormsExt && !modules["form-number-date-ui"].test()) || (!supportCapture && $.inArray('mediacapture', features) !== -1);

if(hasFormsExt && $.inArray('forms', features) == -1){
features.push('forms');
if(WSDEBUG){
webshims.warn('need to load forms feature to use forms-ext feature.');
}
}
if(webCFG.loadStyles){
loader.loadCSS('styles/shim'+(needExtStyles ? '-ext' : '')+'.css');
}
}


if (webCFG.waitReady) {
$.readyWait++;
onReady(features, function(){
$.ready(true);
});
}

$.each(features, function(i, feature){

feature = featureAlias[feature] || feature;

if(!webshimsFeatures[feature]){
WSDEBUG && webshims.error("could not find webshims-feature (aborted): "+ feature);
isReady(feature, true);
return;
}
if (feature !== webshimsFeatures[feature][0]) {
onReady(webshimsFeatures[feature], function(){
isReady(feature, true);
});
}
toLoadFeatures = toLoadFeatures.concat(webshimsFeatures[feature]);
});

loadList(toLoadFeatures);


$.each(features, function(i, feature){
var o = webCFG[feature];
if(!o){return;}
if(feature == 'mediaelement' && (o.replaceUI = getAutoEnhance(o.replaceUI))){
o.plugins.unshift('mediacontrols');
}
if(o.plugins && o.plugins.length){
loadList(webCFG[feature].plugins);
}
});
},

/*
 * handle ready modules
 */
reTest: (function(){
var resList;
var reTest = function(i, name){
var module = modules[name];
var readyName = name+'Ready';
if(module && !module.loaded && !( (module.test && $.isFunction(module.test) ) ? module.test([]) : module.test )){
if(special[readyName]){
delete special[readyName];
}
webshimsFeatures[module.f];

resList.push(name);
}
};
return function(moduleNames){
if(typeof moduleNames == 'string'){
moduleNames = moduleNames.split(' ');
}
resList = [];
$.each(moduleNames, reTest);
loadList(resList);
};
})(),
isReady: function(name, _set){

name = name + 'Ready';
if (_set) {
if (special[name] && special[name].add) {
return true;
}

special[name] = $.extend(special[name] || {}, {
add: function(details){
details.handler.call(this, name);
}
});
$(document).triggerHandler(name);
}
return !!(special[name] && special[name].add) || false;
},
ready: function(events, fn /*, _created*/){
var _created = arguments[2];
if (typeof events == 'string') {
events = events.split(' ');
}

if (!_created) {
events = $.map($.grep(events, function(evt){
return !isReady(evt);
}), function(evt){
return evt + 'Ready';
});
}
if (!events.length) {
fn($, webshims, window, document);
return;
}
var readyEv = events.shift(), readyFn = function(){
onReady(events, fn, true);
};

$(document).one(readyEv, readyFn);
},

/*
 * basic DOM-/jQuery-Helpers
 */


capturingEvents: function(names, _maybePrevented){
if (!document.addEventListener) {
return;
}
if (typeof names == 'string') {
names = [names];
}
$.each(names, function(i, name){
var handler = function(e){
e = $.event.fix(e);
if (_maybePrevented && webshims.capturingEventPrevented) {
webshims.capturingEventPrevented(e);
}
return $.event.dispatch.call(this, e);
};
special[name] = special[name] || {};
if (special[name].setup || special[name].teardown) {
return;
}
$.extend(special[name], {
setup: function(){
this.addEventListener(name, handler, true);
},
teardown: function(){
this.removeEventListener(name, handler, true);
}
});
});
},
register: function(name, fn){
var module = modules[name];
if (!module) {
webshims.error("can't find module: " + name);
return;
}
module.loaded = true;
var ready = function(){
fn($, webshims, window, document, undefined, module.options);
isReady(name, true);
};
if (module.d && module.d.length) {
onReady(module.d, ready);
} else {
ready();
}

},
c: {},
/*
 * loader
 */
loader: {

addModule: function(name, ext){
modules[name] = ext;
ext.name = ext.name || name;
if(!ext.c){
ext.c = [];
}
$.each(ext.c, function(i, comboname){
if(!webshims.c[comboname]){
webshims.c[comboname] = [];
}
webshims.c[comboname].push(name);
});
},
loadList: (function(){

var loadedModules = [];
var loadScript = function(src, names){
if (typeof names == 'string') {
names = [names];
}
$.merge(loadedModules, names);
loader.loadScript(src, false, names);
};

var noNeedToLoad = function(name, list){
if (isReady(name) || $.inArray(name, loadedModules) != -1) {
return true;
}
var module = modules[name];
var supported;
if (module) {
supported = (module.test && $.isFunction(module.test)) ? module.test(list) : module.test;
if (supported) {
isReady(name, true);
return true;
} else {
return false;
}
}
return true;
};

var setDependencies = function(module, list){
if (module.d && module.d.length) {
var addDependency = function(i, dependency){
if (!noNeedToLoad(dependency, list) && $.inArray(dependency, list) == -1) {
list.push(dependency);
}
};
$.each(module.d, function(i, dependency){
if (modules[dependency]) {
if(!modules[dependency].loaded){
addDependency(i, dependency);
}
}
else
if (webshimsFeatures[dependency]) {
$.each(webshimsFeatures[dependency], addDependency);
onReady(webshimsFeatures[dependency], function(){
isReady(dependency, true);
});
}
});
if (!module.noAutoCallback) {
module.noAutoCallback = true;
}
}
};

return function(list){
var module;
var loadCombos = [];
var i;
var len;
var foundCombo;
var loadCombo = function(j, combo){
foundCombo = combo;
$.each(webshims.c[combo], function(i, moduleName){
if($.inArray(moduleName, loadCombos) == -1 || $.inArray(moduleName, loadedModules) != -1){
foundCombo = false;
return false;
}
});
if(foundCombo){
loadScript('combos/'+foundCombo, webshims.c[foundCombo]);
return false;
}
};

//length of list is dynamically
for (i = 0; i < list.length; i++) {
module = modules[list[i]];
if (!module || noNeedToLoad(module.name, list)) {
if (WSDEBUG && !module) {
webshims.warn('could not find: ' + list[i]);
}
continue;
}
if (module.css && webCFG.loadStyles) {
loader.loadCSS(module.css);
}

if (module.loadInit) {
module.loadInit();
}


setDependencies(module, list);
if(!module.loaded){
loadCombos.push(module.name);
}
module.loaded = true;
}

for(i = 0, len = loadCombos.length; i < len; i++){
foundCombo = false;

module = loadCombos[i];

if($.inArray(module, loadedModules) == -1){
if(webCFG.debug != 'noCombo'){
$.each(modules[module].c, loadCombo);
}
if(!foundCombo){
loadScript(modules[module].src || module, module);
}
}
}
};
})(),

makePath: function(src){
if (src.indexOf('//') != -1 || src.indexOf('/') === 0) {
return src;
}

if (src.indexOf('.') == -1) {
src += '.js';
}
if (webCFG.addCacheBuster) {
src += webCFG.addCacheBuster;
}
return webCFG.basePath + src;
},

loadCSS: (function(){
var parent, loadedSrcs = {};
return function(src){
src = this.makePath(src);
if (loadedSrcs[src]) {
return;
}
parent = parent || $('link, style')[0] || $('script')[0];
loadedSrcs[src] = 1;
$('<link rel="stylesheet" />').insertBefore(parent).attr({
href: src
});
};
})(),

loadScript: (function(){
var loadedSrcs = {};
return function(src, callback, name, noShimPath){
if(!noShimPath){
src = loader.makePath(src);
}
if (loadedSrcs[src]) {return;}
var complete = function(){

if (callback) {
callback();
}

if (name) {
if (typeof name == 'string') {
name = name.split(' ');
}
$.each(name, function(i, name){
if (!modules[name]) {
return;
}
if (modules[name].afterLoad) {
modules[name].afterLoad();
}
isReady(!modules[name].noAutoCallback ? name : name + 'FileLoaded', true);
});

}
};

loadedSrcs[src] = 1;
webCFG.loadScript(src, complete, $.noop);
};
})()
}
});

/*
 * shortcuts
 */


var webCFG = webshims.cfg;
var webshimsFeatures = webshims.features;
var isReady = webshims.isReady;
var onReady = webshims.ready;
var addPolyfill = webshims.addPolyfill;
var modules = webshims.modules;
var loader = webshims.loader;
var loadList = loader.loadList;
var addModule = loader.addModule;
var bugs = webshims.bugs;
var removeCombos = [];
var importantLogs = {
warn: 1,
error: 1
};
var $fn = $.fn;
var video = create('video');

webshims.addMethodName = function(name){
name = name.split(':');
var prop = name[1];
if (name.length == 1) {
prop = name[0];
name = name[0];
} else {
name = name[0];
}

$fn[name] = function(){
return this.callProp(prop, arguments);
};
};

$fn.callProp = function(prop, args){
var ret;
if(!args){
args = [];
}
this.each(function(){
var fn = $.prop(this, prop);

if (fn && fn.apply) {
ret = fn.apply(this, args);
if (ret !== undefined) {
return false;
}
} else {
webshims.warn(prop+ " is not a method of "+ this);
}
});
return (ret !== undefined) ? ret : this;
};



webshims.activeLang = (function(){

if(!('language' in navigator)){
navigator.language = navigator.browserLanguage || '';
}
var curLang = $.attr(document.documentElement, 'lang') || navigator.language;
onReady('webshimLocalization', function(){
webshims.activeLang(curLang);
});
return function(lang){
if(lang){
if (typeof lang == 'string' ) {
curLang = lang;
} else if(typeof lang == 'object'){
var args = arguments;
var that = this;
onReady('webshimLocalization', function(){
webshims.activeLang.apply(that, args);
});
}
}
return curLang;
};
})();

webshims.errorLog = [];
$.each(['log', 'error', 'warn', 'info'], function(i, fn){
webshims[fn] = function(message){
if( (importantLogs[fn] && webCFG.debug !== false) || webCFG.debug){
webshims.errorLog.push(message);
if(window.console && console.log){
console[(console[fn]) ? fn : 'log'](message);
}
}
};
});

if(WSDEBUG){
if(!webshims._curScript.wsFoundCurrent){
webshims.error('Could not detect currentScript! Use basePath to set script path.');
}
}

/*
 * jQuery-plugins for triggering dom updates can be also very usefull in conjunction with non-HTML5 DOM-Changes (AJAX)
 * Example:
 * webshim.addReady(function(context, insertedElement){
 * $('div.tabs', context).add(insertedElement.filter('div.tabs')).tabs();
 * });
 *
 * $.ajax({
 * success: function(html){
 * $('#main').htmlPolyfill(html);
 * }
 * });
 */

(function(){
//Overwrite DOM-Ready and implement a new ready-method
$.isDOMReady = $.isReady;
var onReady = function(){

$.isDOMReady = true;
isReady('DOM', true);
setTimeout(function(){
isReady('WINDOWLOAD', true);
}, 9999);
};

firstRun = function(){
if(!firstRun.run){

if(WSDEBUG && $.mobile && ($.mobile.textinput || $.mobile.rangeslider || $.mobile.button)){
webshims.info('jQM textinput/rangeslider/button detected waitReady was set to false. Use webshims.ready("featurename") to script against polyfilled methods/properties');

if(!webCFG.readyEvt){
webshims.error('in a jQuery mobile enviroment: you should change the readyEvt to "pageinit".');
}

if(webCFG.waitReady){
webshims.error('in a jQuery mobile enviroment: you should change the waitReady to false.')
}
}

if (WSDEBUG && webCFG.waitReady && $.isReady) {
webshims.warn('Call webshims.polyfill before DOM-Ready or set waitReady to false.');
}

if(!$.isDOMReady && webCFG.waitReady){
var $Ready = $.ready;
$.ready = function(unwait){
if(unwait !== true && document.body){
onReady();
}
return $Ready.apply(this, arguments);
};
$.ready.promise = $Ready.promise;
}
if(webCFG.readyEvt){
$(document).one(webCFG.readyEvt, onReady);
} else {
$(onReady);
}
}
firstRun.run = true;
};

$(window).on('load', function(){
onReady();
setTimeout(function(){
isReady('WINDOWLOAD', true);
}, 9);
});

var readyFns = [];
var eachTrigger = function(){
if(this.nodeType == 1){
webshims.triggerDomUpdate(this);
}
};
$.extend(webshims, {
addReady: function(fn){
var readyFn = function(context, elem){
webshims.ready('DOM', function(){fn(context, elem);});
};
readyFns.push(readyFn);

if(webCFG.wsdoc){
readyFn(webCFG.wsdoc, emptyJ);
}
},
triggerDomUpdate: function(context){
if(!context || !context.nodeType){
if(context && context.jquery){
context.each(function(){
webshims.triggerDomUpdate(this);
});
}
return;
}
var type = context.nodeType;
if(type != 1 && type != 9){return;}
var elem = (context !== document) ? $(context) : emptyJ;
$.each(readyFns, function(i, fn){
fn(context, elem);
});
}
});

$fn.clonePolyfill = $fn.clone;

$fn.htmlPolyfill = function(a){
if(!arguments.length){
return $(this.clonePolyfill()).html();
}
var ret = $fn.html.call(this,  a);
if(ret === this && $.isDOMReady){
this.each(eachTrigger);
}
return ret;
};

$fn.jProp = function(){
return this.pushStack($($fn.prop.apply(this, arguments) || []));
};

$.each(['after', 'before', 'append', 'prepend', 'replaceWith'], function(i, name){
$fn[name+'Polyfill'] = function(a){
a = $(a);
$fn[name].call(this, a);
if($.isDOMReady){
a.each(eachTrigger);
}
return this;
};

});

$.each(['insertAfter', 'insertBefore', 'appendTo', 'prependTo', 'replaceAll'], function(i, name){
$fn[name.replace(/[A-Z]/, function(c){return "Polyfill"+c;})] = function(){
$fn[name].apply(this, arguments);
if($.isDOMReady){
webshims.triggerDomUpdate(this);
}
return this;
};
});

$fn.updatePolyfill = function(){
if($.isDOMReady){
webshims.triggerDomUpdate(this);
}
return this;
};

$.each(['getNativeElement', 'getShadowElement', 'getShadowFocusElement'], function(i, name){
$fn[name] = function(){
return this.pushStack(this);
};
});

})();


if(WSDEBUG){
webCFG.debug = true;
}

if(Object.create){
webshims.objectCreate = function(proto, props, opts){
if(WSDEBUG && props){
webshims.error('second argument for webshims.objectCreate is only available with DOM support');
}
var o = Object.create(proto);
if(opts){
o.options = $.extend(true, {}, o.options  || {}, opts);
opts = o.options;
}
if(o._create && $.isFunction(o._create)){
o._create(opts);
}
return o;
};
}




/*
 * Start Features
 */

/* general modules */
/* change path $.webshims.modules[moduleName].src */


addModule('swfmini', {
test: function(){
if(window.swfobject && !window.swfmini){
window.swfmini = window.swfobject;
}
return ('swfmini' in window);
},
c: [16, 7, 2, 8, 1, 12, 23]
});
modules.swfmini.test();

addModule('sizzle', {test: $.expr.filters});
/*
 * polyfill-Modules
 */

// webshims lib uses a of http://github.com/kriskowal/es5-shim/ to implement
addPolyfill('es5', {
test: !!(support.ES5 && Function.prototype.bind),
d: ['sizzle']
});

addPolyfill('dom-extend', {
f: DOMSUPPORT,
noAutoCallback: true,
d: ['es5'],
c: [16, 7, 2, 15, 30, 3, 8, 4, 9, 10, 25, 31, 34]
});











//<forms
(function(){
var formExtend, formOptions;
var fShim = 'form-shim-extend';
var formvalidation = 'formvalidation';
var fNuAPI = 'form-number-date-api';
var bustedValidity = false;
var bustedWidgetUi = false;
var replaceBustedUI = false;
var inputtypes = {};


var progress = create('progress');
var output = create('output');

var initialFormTest = function(){
var tmp, fieldset;
var testValue = '1(';
var input = create('input');
fieldset = $('<fieldset><textarea required="" /></fieldset>')[0];

support.inputtypes = inputtypes;

$.each(['range', 'date', 'datetime-local', 'month', 'color', 'number'], function(i, type){
input.setAttribute('type', type);
inputtypes[type] = (input.type == type && (input.value = testValue) && input.value != testValue);
});

support.datalist = !!(('options' in create('datalist')) && window.HTMLDataListElement);

support[formvalidation] = ('checkValidity' in input);

support.fieldsetelements = ('elements' in fieldset);


if((support.fieldsetdisabled = ('disabled' in fieldset))){
try {
if(fieldset.querySelector(':invalid')){
fieldset.disabled = true;
tmp = !fieldset.querySelector(':invalid') && fieldset.querySelector(':disabled');
}
} catch(er){}
support.fieldsetdisabled =  !!tmp;
}

if(support[formvalidation]){
bustedWidgetUi = !support.fieldsetdisabled || !support.fieldsetelements || !('value' in progress) || !('value' in output);
replaceBustedUI = bustedWidgetUi && (/Android/i).test(navigator.userAgent);
bustedValidity = window.opera || bugs.bustedValidity || bustedWidgetUi || !support.datalist;

if(!bustedValidity && inputtypes.number){
bustedValidity = true;
try {
input.type = 'number';
input.value = '';
input.stepUp();
bustedValidity = input.value != '1';
} catch(e){}
}

}

bugs.bustedValidity = bustedValidity;

formExtend = support[formvalidation] && !bustedValidity ? 'form-native-extend' : fShim;
initialFormTest = $.noop;
return false;
};
var typeTest = function(o){
var ret = true;
if(!o._types){
o._types = o.types.split(' ');
}
$.each(o._types, function(i, name){
if((name in inputtypes) && !inputtypes[name]){
ret = false;
return false;
}
});
return ret;
};


webshims.validationMessages = webshims.validityMessages = {
langSrc: 'i18n/formcfg-',
availableLangs: "ar bg ca cs el es fa fi fr he hi hu it ja lt nl no pl pt pt-BR pt-PT ru sv zh-CN zh-TW".split(' ')
};
webshims.formcfg = $.extend({}, webshims.validationMessages);

webshims.inputTypes = {};

addPolyfill('form-core', {
f: 'forms',
test: initialFormTest,
d: ['es5'],
options: {
placeholderType: 'value',
messagePopover: {},
list: {
popover: {
constrainWidth: true
}
},
iVal: {
sel: '.ws-validate',
handleBubble: 'hide',
recheckDelay: 400
//,fx: 'slide'
}
//,customMessages: false,
//overridePlaceholder: false, // might be good for IE10
//replaceValidationUI: false
},
methodNames: ['setCustomValidity', 'checkValidity', 'setSelectionRange'],
c: [16, 7, 2, 8, 1, 15, 30, 3, 31]
});

formOptions = webCFG.forms;

addPolyfill('form-native-extend', {
f: 'forms',
test: function(toLoad){
initialFormTest();
return !support[formvalidation] || bustedValidity  || $.inArray(fNuAPI, toLoad  || []) == -1 || modules[fNuAPI].test();
},
d: ['form-core', DOMSUPPORT, 'form-message'],
c: [6, 5, 14, 29]
});

addPolyfill(fShim, {
f: 'forms',
test: function(){
initialFormTest();
return support[formvalidation] && !bustedValidity;
},
d: ['form-core', DOMSUPPORT, 'sizzle'],
c: [16, 15, 28]
});

addPolyfill(fShim+'2', {
f: 'forms',
test: function(){
initialFormTest();
return support[formvalidation] && !bustedWidgetUi;
},
d: [fShim],
c: [27]
});

addPolyfill('form-message', {
f: 'forms',
test: function(toLoad){
initialFormTest();
return !( formOptions.customMessages || !support[formvalidation] || bustedValidity || !modules[formExtend].test(toLoad) );
},
d: [DOMSUPPORT],
c: [16, 7, 15, 30, 3, 8, 4, 14, 28]
});


addPolyfill(fNuAPI, {
f: 'forms-ext',
options: {
types: 'date time range number'
},
test: function(){
initialFormTest();
var ret = !bustedValidity;

if(ret){
ret = typeTest(this.options);
}

return ret;
},
methodNames: ['stepUp', 'stepDown'],
d: ['forms', DOMSUPPORT],
c: [6, 5, 17, 14, 28, 29, 33]
});

addModule('range-ui', {
options: {},
noAutoCallback: true,
test: function(){
return !!$fn.rangeUI;
},
d: ['es5'],
c: [6, 5, 9, 10, 17, 11]
});

addPolyfill('form-number-date-ui', {
f: 'forms-ext',
test: function(){
var o = this.options;
o.replaceUI = getAutoEnhance(o.replaceUI);
initialFormTest();
//input widgets on old androids can't be trusted
if(!o.replaceUI && replaceBustedUI){
o.replaceUI = true;
}
return !o.replaceUI && typeTest(o);
},
d: ['forms', DOMSUPPORT, fNuAPI, 'range-ui'],
options: {
widgets: {
calculateWidth: true,
animate: true
}
},
c: [6, 5, 9, 10, 17, 11]
});

addPolyfill('form-datalist', {
f: 'forms',
test: function(){
initialFormTest();
if(replaceBustedUI){
formOptions.customDatalist = true;
}
return support.datalist && !formOptions.fD;
},
d: ['form-core', DOMSUPPORT],
c: [16, 7, 6, 2, 9, 15, 30, 31, 28, 33]
});
})();
//>




//<mediaelement
(function(){
webshims.mediaelement = {};
var track = create('track');
support.mediaelement = ('canPlayType' in video);
support.texttrackapi = ('addTextTrack' in video);
support.track = ('kind' in track);

create('audio');

if(!(bugs.track = !support.texttrackapi)){
try {
bugs.track = !('oncuechange' in video.addTextTrack('metadata'));
} catch(e){}
}

addPolyfill('mediaelement-core', {
f: 'mediaelement',
noAutoCallback: true,
options: {
//replaceUI: false,
jme: {},
plugins: [],
vars: {},
params: {},
attrs: {},
changeSWF: $.noop
},
methodNames: ['play', 'pause', 'canPlayType', 'mediaLoad:load'],
d: ['swfmini'],
c: [16, 7, 2, 8, 1, 12, 13, 23]
});


addPolyfill('mediaelement-jaris', {
f: 'mediaelement',
d: ['mediaelement-core', DOMSUPPORT],
test: function(){
var options = this.options;

if(!support.mediaelement || webshims.mediaelement.loadSwf){
return false;
}

if(options.preferFlash && !modules.swfmini.test()){
options.preferFlash = false;
}
return !( options.preferFlash && swfmini.hasFlashPlayerVersion('11.3') );
},
c: [21, 25]
});

addPolyfill('track', {
options: {
positionDisplay: true,
override: bugs.track
},
test: function(){
var o = this.options;
o.override = getAutoEnhance(o.override);
return !o.override && !bugs.track;
},
d: ['mediaelement', DOMSUPPORT],
methodNames: ['addTextTrack'],
c: [21, 12, 13, 22, 34]
});

addModule('jmebase', {
src: 'jme/base',
c: [98, 99, 97]
});

$.each([
['mediacontrols', {c: [98, 99], css: 'jme/controls.css'}],
['playlist', {c: [98, 97]}],
['alternate-media']
], function(i, plugin){
addModule(plugin[0], $.extend({
src: 'jme/'+plugin[0],
d: ['jmebase']
}, plugin[1]));
});


addModule('track-ui', {
d: ['track', DOMSUPPORT]
});

})();
//>


removeCombos = removeCombos.concat([18,21,25,27,22]);
addPolyfill('feature-dummy', {
test: true,
loaded: true,
c: removeCombos
});

webshims.$ = $;
$.webshims = webshims;
$.webshim = webshim;

webshims.callAsync = function(){
webshims.callAsync = $.noop;

if(asyncWebshims){
if(asyncWebshims.cfg){
if(!asyncWebshims.cfg.length){
asyncWebshims.cfg = [[asyncWebshims.cfg]];
}
$.each(asyncWebshims.cfg, function(i, cfg){
webshims.setOptions.apply(webshims, cfg);
});
}
if(asyncWebshims.ready){
$.each(asyncWebshims.ready, function(i, ready){
webshims.ready.apply(webshims, ready);
});
}
if(asyncWebshims.lang){
webshims.activeLang(asyncWebshims.lang);
}
if('polyfill' in asyncWebshims){
webshims.polyfill(asyncWebshims.polyfill);
}
}
webshims.isReady('jquery', true);
};

webshims.callAsync();
return webshims;
}));

;webshims.register('form-core', function($, webshims, window, document, undefined, options){
	"use strict";

	webshims.capturingEventPrevented = function(e){
		if(!e._isPolyfilled){
			var isDefaultPrevented = e.isDefaultPrevented;
			var preventDefault = e.preventDefault;
			e.preventDefault = function(){
				clearTimeout($.data(e.target, e.type + 'DefaultPrevented'));
				$.data(e.target, e.type + 'DefaultPrevented', setTimeout(function(){
					$.removeData(e.target, e.type + 'DefaultPrevented');
				}, 30));
				return preventDefault.apply(this, arguments);
			};
			e.isDefaultPrevented = function(){
				return !!(isDefaultPrevented.apply(this, arguments) || $.data(e.target, e.type + 'DefaultPrevented') || false);
			};
			e._isPolyfilled = true;
		}
	};


	var modules = webshims.modules;
	var support = webshims.support;
	var isValid = function(elem){
		return ($.prop(elem, 'validity') || {valid: 1}).valid;
	};
	var lazyLoad = function(){
		var toLoad = ['form-validation'];

		$(document).off('.lazyloadvalidation');

		if(options.lazyCustomMessages){
			options.customMessages = true;
			toLoad.push('form-message');
		}

		if(webshims._getAutoEnhance(options.customDatalist)){
			options.fD = true;
			toLoad.push('form-datalist');
		}

		if(options.addValidators){
			toLoad.push('form-validators');
		}
		webshims.reTest(toLoad);
	};
	/*
	 * Selectors for all browsers
	 */
	
	var extendSels = function(){
		var matches, matchesOverride;
		var exp = $.expr[":"];
		var rElementsGroup = /^(?:form|fieldset)$/i;
		var hasInvalid = function(elem){
			var ret = false;
			$(elem).jProp('elements').each(function(){
				if(!rElementsGroup.test(this.nodeName || '')){
					ret = exp.invalid(this);
					if(ret){
						return false;
					}
				}

			});
			return ret;
		};
		$.extend(exp, {
			"valid-element": function(elem){
				return rElementsGroup.test(elem.nodeName || '') ? !hasInvalid(elem) : !!($.prop(elem, 'willValidate') && isValid(elem));
			},
			"invalid-element": function(elem){
				return rElementsGroup.test(elem.nodeName || '') ? hasInvalid(elem) : !!($.prop(elem, 'willValidate') && !isValid(elem));
			},
			"required-element": function(elem){
				return !!($.prop(elem, 'willValidate') && $.prop(elem, 'required'));
			},
			"user-error": function(elem){
				return ($.prop(elem, 'willValidate') && $(elem).getShadowElement().hasClass((options.iVal.errorClass || 'user-error')));
			},
			"optional-element": function(elem){
				return !!($.prop(elem, 'willValidate') && $.prop(elem, 'required') === false);
			}
		});
		
		['valid', 'invalid', 'required', 'optional'].forEach(function(name){
			exp[name] = $.expr[":"][name+"-element"];
		});
		
		// sizzle/jQuery has a bug with :disabled/:enabled selectors
		if(support.fieldsetdisabled && !$('<fieldset disabled=""><input /><input /></fieldset>').find(':disabled').filter(':disabled').is(':disabled')){
			matches = $.find.matches;
			matchesOverride = {':disabled': 1, ':enabled': 1};
			$.find.matches = function(expr, elements){
				if(matchesOverride[expr]){
					return matches.call(this, '*'+expr, elements);
				}
				return matches.apply(this, arguments);
			};
			$.extend(exp, {
				"enabled": function( elem ) {
					return 'disabled' in elem && elem.disabled === false && !$.find.matchesSelector(elem, 'fieldset[disabled] *');
				},
		
				"disabled": function( elem ) {
					return elem.disabled === true || ('disabled' in elem && $.find.matchesSelector(elem, 'fieldset[disabled] *'));
				}
			});
		}
		
		
		//bug was partially fixed in 1.10.0 for IE9, but not IE8 (move to es5 as soon as 1.10.2 is used)
		if(typeof document.activeElement == 'unknown'){
			var pseudoFocus = exp.focus;
			exp.focus = function(){
				try {
					return pseudoFocus.apply(this, arguments);
				} catch(e){
					webshims.error(e);
				}
				return false;
			};
		}
	};
	var formExtras = {
		noAutoCallback: true,
		options: options
	};
	var addModule = webshims.loader.addModule;
	var lazyLoadProxy = function(obj, fn, args){
		lazyLoad();
		webshims.ready('form-validation', function(){
			obj[fn].apply(obj, args);
		});
	};

	var transClass = ('transitionDelay' in document.documentElement.style) ?  '' : ' no-transition';
	var poCFG = webshims.cfg.wspopover;

	addModule('form-validation', $.extend({d: ['form-message']}, formExtras));

	addModule('form-validators', $.extend({}, formExtras));


	if(support.formvalidation && !webshims.bugs.bustedValidity){
		//create delegatable events
		webshims.capturingEvents(['invalid'], true);
	}
	
	if($.expr.filters){
		extendSels();
	} else {
		webshims.ready('sizzle', extendSels);
	}

	webshims.triggerInlineForm = function(elem, event){
		$(elem).trigger(event);
	};
	

	if(!poCFG.position && poCFG.position !== false){
		poCFG.position = {
			at: 'left bottom',
			my: 'left top',
			collision: 'fit flip'
		};
	}
	webshims.wsPopover = {
		id: 0,
		_create: function(){
			this.options = $.extend(true, {}, poCFG, this.options);
			this.id = webshims.wsPopover.id++;
			this.eventns = '.wsoverlay' + this.id;
			this.timers = {};
			this.element = $('<div class="ws-popover'+transClass+'" tabindex="-1"><div class="ws-po-outerbox"><div class="ws-po-arrow"><div class="ws-po-arrowbox" /></div><div class="ws-po-box" /></div></div>');
			this.contentElement = $('.ws-po-box', this.element);
			this.lastElement = $([]);
			this.bindElement();
			
			this.element.data('wspopover', this);
			
		},
		options: {},
		content: function(html){
			this.contentElement.html(html);
		},
		bindElement: function(){
			var that = this;
			var stopBlur = function(){
				that.stopBlur = false;
			};
			this.preventBlur = function(e){
				that.stopBlur = true;
				clearTimeout(that.timers.stopBlur);
				that.timers.stopBlur = setTimeout(stopBlur, 9);
			};
			this.element.on({
				'mousedown': this.preventBlur
			});
		},
		show: function(){
			lazyLoadProxy(this, 'show', arguments);
		}
	};
	
	/* some extra validation UI */
	webshims.validityAlert = {
		showFor: function(){
			lazyLoadProxy(this, 'showFor', arguments);
		}
	};
	
	
	webshims.getContentValidationMessage = function(elem, validity, key){
		var customRule;
		if(webshims.errorbox && webshims.errorbox.initIvalContentMessage){
			webshims.errorbox.initIvalContentMessage(elem);
		}
		var message = (webshims.getOptions && webshims.errorbox ? webshims.getOptions(elem, 'errormessage', false, true) : $(elem).data('errormessage')) || elem.getAttribute('x-moz-errormessage') || '';
		if(key && message[key]){
			message = message[key];
		} else if(message) {
			validity = validity || $.prop(elem, 'validity') || {valid: 1};
			if(validity.valid){
				message = '';
			}
		}
		if(typeof message == 'object'){
			validity = validity || $.prop(elem, 'validity') || {valid: 1};
			if(validity.customError && (customRule = $.data(elem, 'customMismatchedRule')) && message[customRule] && typeof message[customRule] == 'string'){
				message = message[customRule];
			} else if(!validity.valid){
				$.each(validity, function(name, prop){
					if(prop && name != 'valid' && message[name]){
						message = message[name];
						return false;
					}
				});
				if(typeof message == 'object'){
					if(validity.typeMismatch && message.badInput){
						message = message.badInput;
					}
					if(validity.badInput && message.typeMismatch){
						message = message.typeMismatch;
					}
				}
			}
		}
		
		if(typeof message == 'object'){
			message = message.defaultMessage;
		}
		if(webshims.replaceValidationplaceholder){
			message = webshims.replaceValidationplaceholder(elem, message);
		}
		return message || '';
	};

	webshims.refreshCustomValidityRules = $.noop;
	
	$.fn.getErrorMessage = function(key){
		var message = '';
		var elem = this[0];
		if(elem){
			message = webshims.getContentValidationMessage(elem, false, key) || $.prop(elem, 'customValidationMessage') || ($.prop(elem, 'validationMessage') || '');
		}
		return message;
	};

	$.event.special.valuevalidation = {
		setup: function(){
			webshims.error('valuevalidation was renamed to validatevalue!');
		}
	};


	$.event.special.validatevalue = {
		setup: function(){
			var data = $(this).data() || $.data(this, {});
			if(!('validatevalue' in data)){
				data.validatevalue = true;
			}
		}
	};


	$(document).on('focusin.lazyloadvalidation mousedown.lazyloadvalidation touchstart.lazyloadvalidation', function(e){
		if('form' in e.target){
			lazyLoad();
		}
	});

	webshims.ready('WINDOWLOAD', lazyLoad);

	if(modules['form-number-date-ui'].loaded && !options.customMessages && (modules['form-number-date-api'].test() || (support.inputtypes.range && support.inputtypes.color))){
		webshims.isReady('form-number-date-ui', true);
	}

	webshims.ready('DOM', function(){
		if(document.querySelector('.ws-custom-file')){
			webshims.reTest(['form-validation']);
		}
	});

	if(options.addValidators && options.fastValidators){
		webshims.reTest(['form-validators', 'form-validation']);
	}

	if(document.readyState == 'complete'){
		webshims.isReady('WINDOWLOAD', true);
	}
});

;
//this might was already extended by ES5 shim feature
(function($){
	"use strict";
	var webshims = window.webshims;
	if(webshims.defineProperties){return;}
	var defineProperty = 'defineProperty';
	var has = Object.prototype.hasOwnProperty;
	var descProps = ['configurable', 'enumerable', 'writable'];
	var extendUndefined = function(prop){
		for(var i = 0; i < 3; i++){
			if(prop[descProps[i]] === undefined && (descProps[i] !== 'writable' || prop.value !== undefined)){
				prop[descProps[i]] = true;
			}
		}
	};

	var extendProps = function(props){
		if(props){
			for(var i in props){
				if(has.call(props, i)){
					extendUndefined(props[i]);
				}
			}
		}
	};

	if(Object.create){
		webshims.objectCreate = function(proto, props, opts){
			extendProps(props);
			var o = Object.create(proto, props);
			if(opts){
				o.options = $.extend(true, {}, o.options  || {}, opts);
				opts = o.options;
			}
			if(o._create && $.isFunction(o._create)){
				o._create(opts);
			}
			return o;
		};
	}

	if(Object[defineProperty]){
		webshims[defineProperty] = function(obj, prop, desc){
			extendUndefined(desc);
			return Object[defineProperty](obj, prop, desc);
		};
	}
	if(Object.defineProperties){
		webshims.defineProperties = function(obj, props){
			extendProps(props);
			return Object.defineProperties(obj, props);
		};
	}
	webshims.getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;

	webshims.getPrototypeOf = Object.getPrototypeOf;
})(window.webshims.$);
//DOM-Extension helper
webshims.register('dom-extend', function($, webshims, window, document, undefined){
	"use strict";
	var supportHrefNormalized = !('hrefNormalized' in $.support) || $.support.hrefNormalized;
	var has = Object.prototype.hasOwnProperty;
	webshims.assumeARIA = true;
	
	if($('<input type="email" />').attr('type') == 'text' || $('<form />').attr('novalidate') === "" || ('required' in $('<input />')[0].attributes)){
		webshims.error("IE browser modes are busted in IE10+. Make sure to run IE in edge mode (X-UA-Compatible). Please test your HTML/CSS/JS with a real IE version or at least IETester or similar tools. ");
	}
	
	if (!webshims.cfg.no$Switch) {
		var switch$ = function(){
			if (window.jQuery && (!window.$ || window.jQuery == window.$) && !window.jQuery.webshims) {
				webshims.error("jQuery was included more than once. Make sure to include it only once or try the $.noConflict(extreme) feature! Webshims and other Plugins might not work properly. Or set webshims.cfg.no$Switch to 'true'.");
				if (window.$) {
					window.$ = webshims.$;
				}
				window.jQuery = webshims.$;
			}
		};
		switch$();
		setTimeout(switch$, 90);
		webshims.ready('DOM', switch$);
		$(switch$);
		webshims.ready('WINDOWLOAD', switch$);
		
	}

	//shortcus
	var listReg = /\s*,\s*/;
		
	//proxying attribute
	var olds = {};
	var havePolyfill = {};
	var hasPolyfillMethod = {};
	var extendedProps = {};
	var extendQ = {};
	var modifyProps = {};
	
	var oldVal = $.fn.val;
	var singleVal = function(elem, name, val, pass, _argless){
		return (_argless) ? oldVal.call($(elem)) : oldVal.call($(elem), val);
	};
	
	//jquery mobile and jquery ui
	if(!$.widget && (!$.pluginFactory || !$.pluginFactory.mixin)){
		(function(){
			var _cleanData = $.cleanData;
			$.cleanData = (function( orig ) {
				return function( elems ) {
					var events, elem, i;
					for ( i = 0; (elem = elems[i]) != null; i++ ) {
						try {
							// Only trigger remove when necessary to save time
							events = $._data( elem, "events" );
							if ( events && events.remove ) {
								$( elem ).triggerHandler( "remove" );
							}
							// http://bugs.jquery.com/ticket/8235
						} catch ( e ) {}
					}
					orig( elems );
				};
			})( $.cleanData );
		})();
	}
	

	$.fn.val = function(val){
		var elem = this[0];
		if(arguments.length && val == null){
			val = '';
		}
		if(!arguments.length){
			if(!elem || elem.nodeType !== 1){return oldVal.call(this);}
			return $.prop(elem, 'value', val, 'val', true);
		}
		if($.isArray(val)){
			return oldVal.apply(this, arguments);
		}
		var isFunction = $.isFunction(val);
		return this.each(function(i){
			elem = this;
			if(elem.nodeType === 1){
				if(isFunction){
					var genVal = val.call( elem, i, $.prop(elem, 'value', undefined, 'val', true));
					if(genVal == null){
						genVal = '';
					}
					$.prop(elem, 'value', genVal, 'val') ;
				} else {
					$.prop(elem, 'value', val, 'val');
				}
			}
		});
	};
	$.fn.onTrigger = function(evt, fn){
		return this.on(evt, fn).each(fn);
	};
	
	$.fn.onWSOff = function(evt, fn, trigger, evtDel){
		if(!evtDel){
			evtDel = document;
		}
		$(evtDel)[trigger ? 'onTrigger' : 'on'](evt, fn);
		this.on('remove', function(e){
			if(!e.originalEvent){
				$(evtDel).off(evt, fn);
			}
		});
		return this;
	};
	var idCount = 0;
	var dataID = '_webshims'+ (Math.round(Math.random() * 1000));
	var elementData = function(elem, key, val){
		elem = elem.jquery ? elem[0] : elem;
		if(!elem){return val || {};}
		var data = $.data(elem, dataID);
		if(val !== undefined){
			if(!data){
				data = $.data(elem, dataID, {});
			}
			if(key){
				data[key] = val;
			}
		}
		
		return key ? data && data[key] : data;
	};


	[{name: 'getNativeElement', prop: 'nativeElement'}, {name: 'getShadowElement', prop: 'shadowElement'}, {name: 'getShadowFocusElement', prop: 'shadowFocusElement'}].forEach(function(data){
		$.fn[data.name] = function(){
			var elems = [];
			this.each(function(){
				var shadowData = elementData(this, 'shadowData');
				var elem = shadowData && shadowData[data.prop] || this;
				if($.inArray(elem, elems) == -1){
					elems.push(elem);
				}
			});
			return this.pushStack(elems);
		};
	});

	function clone(elem, dataAndEvents, uniqueIds){
		var cloned = $.clone( elem, dataAndEvents, false );
		$(cloned.querySelectorAll('.'+webshims.shadowClass)).detach();
		if(uniqueIds){
			idCount++;
			$(cloned.querySelectorAll('[id]')).prop('id', function(i, id){
				return id +idCount;
			});
		} else {
			$(cloned.querySelectorAll('audio[id^="ID-"], video[id^="ID-"], label[id^="ID-"]')).removeAttr('id');
		}
		return cloned;
	}

	$.fn.clonePolyfill = function(dataAndEvents, uniqueIds){
		dataAndEvents = dataAndEvents || false;
		return this
			.map(function() {
				var cloned = clone( this, dataAndEvents, uniqueIds );
				setTimeout(function(){
					if($.contains(document.body, cloned)){
						$(cloned).updatePolyfill();
					}
				});
				return cloned;
			})
		;
	};
	
	//add support for $('video').trigger('play') in case extendNative is set to false
	if(!webshims.cfg.extendNative && !webshims.cfg.noTriggerOverride){
		(function(oldTrigger){
			$.event.trigger = function(event, data, elem, onlyHandlers){
				
				if(!hasPolyfillMethod[event] || onlyHandlers || !elem || elem.nodeType !== 1){
					return oldTrigger.apply(this, arguments);
				}
				var ret, isOrig, origName;
				var origFn = elem[event];
				var polyfilledFn = $.prop(elem, event);
				var changeFn = polyfilledFn && origFn != polyfilledFn;
				if(changeFn){
					origName = '__ws'+event;
					isOrig = (event in elem) && has.call(elem, event);
					elem[event] = polyfilledFn;
					elem[origName] = origFn;
				}
				
				ret = oldTrigger.apply(this, arguments);
				if (changeFn) {
					if(isOrig){
						elem[event] = origFn;
					} else {
						delete elem[event];
					}
					delete elem[origName];
				}
				
				return ret;
			};
		})($.event.trigger);
	}
	
	['removeAttr', 'prop', 'attr'].forEach(function(type){
		olds[type] = $[type];
		$[type] = function(elem, name, value, pass, _argless){
			var isVal = (pass == 'val');
			var oldMethod = !isVal ? olds[type] : singleVal;
			if( !elem || !havePolyfill[name] || elem.nodeType !== 1 || (!isVal && pass && type == 'attr' && $.attrFn[name]) ){
				return oldMethod(elem, name, value, pass, _argless);
			}
			
			var nodeName = (elem.nodeName || '').toLowerCase();
			var desc = extendedProps[nodeName];
			var curType = (type == 'attr' && (value === false || value === null)) ? 'removeAttr' : type;
			var propMethod;
			var oldValMethod;
			var ret;
			
			
			if(!desc){
				desc = extendedProps['*'];
			}
			if(desc){
				desc = desc[name];
			}
			
			if(desc){
				propMethod = desc[curType];
			}
			
			if(propMethod){
				if(name == 'value'){
					oldValMethod = propMethod.isVal;
					propMethod.isVal = isVal;
				}
				if(curType === 'removeAttr'){
					return propMethod.value.call(elem);	
				} else if(value === undefined){
					return (propMethod.get) ? 
						propMethod.get.call(elem) : 
						propMethod.value
					;
				} else if(propMethod.set) {
					if(type == 'attr' && value === true){
						value = name;
					}
					
					ret = propMethod.set.call(elem, value);
				}
				if(name == 'value'){
					propMethod.isVal = oldValMethod;
				}
			} else {
				ret = oldMethod(elem, name, value, pass, _argless);
			}
			if((value !== undefined || curType === 'removeAttr') && modifyProps[nodeName] && modifyProps[nodeName][name]){
				
				var boolValue;
				if(curType == 'removeAttr'){
					boolValue = false;
				} else if(curType == 'prop'){
					boolValue = !!(value);
				} else {
					boolValue = true;
				}
				
				modifyProps[nodeName][name].forEach(function(fn){
					if(!fn.only || (fn.only = 'prop' && type == 'prop') || (fn.only == 'attr' && type != 'prop')){
						fn.call(elem, value, boolValue, (isVal) ? 'val' : curType, type);
					}
				});
			}
			return ret;
		};
		
		extendQ[type] = function(nodeName, prop, desc){
			
			if(!extendedProps[nodeName]){
				extendedProps[nodeName] = {};
			}
			if(!extendedProps[nodeName][prop]){
				extendedProps[nodeName][prop] = {};
			}
			var oldDesc = extendedProps[nodeName][prop][type];
			var getSup = function(propType, descriptor, oDesc){
				var origProp;
				if(descriptor && descriptor[propType]){
					return descriptor[propType];
				}
				if(oDesc && oDesc[propType]){
					return oDesc[propType];
				}
				if(type == 'prop' && prop == 'value'){
					return function(value){
						var elem = this;
						return (desc.isVal) ? 
							singleVal(elem, prop, value, false, (arguments.length === 0)) : 
							olds[type](elem, prop, value)
						;
					};
				}
				if(type == 'prop' && propType == 'value' && desc.value.apply){
					origProp = '__ws'+prop;
					hasPolyfillMethod[prop] = true;
					return  function(value){
						var sup = this[origProp] || olds[type](this, prop);
						if(sup && sup.apply){
							sup = sup.apply(this, arguments);
						} 
						return sup;
					};
				}
				return function(value){
					return olds[type](this, prop, value);
				};
			};
			extendedProps[nodeName][prop][type] = desc;
			if(desc.value === undefined){
				if(!desc.set){
					desc.set = desc.writeable ? 
						getSup('set', desc, oldDesc) : 
						(webshims.cfg.useStrict && prop == 'prop') ? 
							function(){throw(prop +' is readonly on '+ nodeName);} : 
							function(){webshims.info(prop +' is readonly on '+ nodeName);}
					;
				}
				if(!desc.get){
					desc.get = getSup('get', desc, oldDesc);
				}
				
			}
			
			['value', 'get', 'set'].forEach(function(descProp){
				if(desc[descProp]){
					desc['_sup'+descProp] = getSup(descProp, oldDesc);
				}
			});
		};
		
	});
	
	var extendNativeValue = (function(){
		var UNKNOWN = webshims.getPrototypeOf(document.createElement('foobar'));
		
		//see also: https://github.com/lojjic/PIE/issues/40 | https://prototype.lighthouseapp.com/projects/8886/tickets/1107-ie8-fatal-crash-when-prototypejs-is-loaded-with-rounded-cornershtc
		var isExtendNativeSave = webshims.support.advancedObjectProperties && webshims.support.objectAccessor;
		return function(nodeName, prop, desc){
			var elem , elemProto;
			 if( isExtendNativeSave && (elem = document.createElement(nodeName)) && (elemProto = webshims.getPrototypeOf(elem)) && UNKNOWN !== elemProto && ( !elem[prop] || !has.call(elem, prop) ) ){
				var sup = elem[prop];
				desc._supvalue = function(){
					if(sup && sup.apply){
						return sup.apply(this, arguments);
					}
					return sup;
				};
				elemProto[prop] = desc.value;
			} else {
				desc._supvalue = function(){
					var data = elementData(this, 'propValue');
					if(data && data[prop] && data[prop].apply){
						return data[prop].apply(this, arguments);
					}
					return data && data[prop];
				};
				initProp.extendValue(nodeName, prop, desc.value);
			}
			desc.value._supvalue = desc._supvalue;
		};
	})();
		
	var initProp = (function(){
		
		var initProps = {};
		
		webshims.addReady(function(context, contextElem){
			var nodeNameCache = {};
			var getElementsByName = function(name){
				if(!nodeNameCache[name]){
					nodeNameCache[name] = $(context.getElementsByTagName(name));
					if(contextElem[0] && $.nodeName(contextElem[0], name)){
						nodeNameCache[name] = nodeNameCache[name].add(contextElem);
					}
				}
			};
			
			
			$.each(initProps, function(name, fns){
				getElementsByName(name);
				if(!fns || !fns.forEach){
					webshims.warn('Error: with '+ name +'-property. methods: '+ fns);
					return;
				}
				fns.forEach(function(fn){
					nodeNameCache[name].each(fn);
				});
			});
			nodeNameCache = null;
		});
		
		var tempCache;
		var emptyQ = $([]);
		var createNodeNameInit = function(nodeName, fn){
			if(!initProps[nodeName]){
				initProps[nodeName] = [fn];
			} else {
				initProps[nodeName].push(fn);
			}
			if($.isDOMReady){
				(tempCache || $( document.getElementsByTagName(nodeName) )).each(fn);
			}
		};

		return {
			createTmpCache: function(nodeName){
				if($.isDOMReady){
					tempCache = tempCache || $( document.getElementsByTagName(nodeName) );
				}
				return tempCache || emptyQ;
			},
			flushTmpCache: function(){
				tempCache = null;
			},
			content: function(nodeName, prop){
				createNodeNameInit(nodeName, function(){
					var val =  $.attr(this, prop);
					if(val != null){
						$.attr(this, prop, val);
					}
				});
			},
			createElement: function(nodeName, fn){
				createNodeNameInit(nodeName, fn);
			},
			extendValue: function(nodeName, prop, value){
				createNodeNameInit(nodeName, function(){
					$(this).each(function(){
						var data = elementData(this, 'propValue', {});
						data[prop] = this[prop];
						this[prop] = value;
					});
				});
			}
		};
	})();
		
	var createPropDefault = function(descs, removeType){
		if(descs.defaultValue === undefined){
			descs.defaultValue = '';
		}
		if(!descs.removeAttr){
			descs.removeAttr = {
				value: function(){
					descs[removeType || 'prop'].set.call(this, descs.defaultValue);
					descs.removeAttr._supvalue.call(this);
				}
			};
		}
		if(!descs.attr){
			descs.attr = {};
		}
	};
	
	$.extend(webshims, {
		xProps: havePolyfill,
		getID: (function(){
			var ID = new Date().getTime();
			return function(elem){
				elem = $(elem);
				var id = elem.prop('id');
				if(!id){
					ID++;
					id = 'ID-'+ ID;
					elem.eq(0).prop('id', id);
				}
				return id;
			};
		})(),
		domPrefixes: ["webkit", "moz", "ms", "o", "ws"],

		prefixed: function (prop, obj){
			var i, testProp;
			var ret = false;
			if(obj[prop]){
				ret = prop;
			}
			if(!ret){
				prop = prop.charAt(0).toUpperCase() + prop.slice(1);
				for(i = 0; i < webshims.domPrefixes.length; i++){
					testProp = webshims.domPrefixes[i]+prop;
					if(testProp in obj){
						ret = testProp;
						break;
					}
				}
			}
			return ret;
		},
		shadowClass: 'wsshadow-'+(Date.now()),
		implement: function(elem, type){
			var data = elementData(elem, 'implemented') || elementData(elem, 'implemented', {});
			if(data[type]){
				webshims.warn(type +' already implemented for element #'+elem.id);
				return false;
			}

			data[type] = true;
			return !$(elem).hasClass('ws-nopolyfill');
		},
		extendUNDEFProp: function(obj, props){
			$.each(props, function(name, prop){
				if( !(name in obj) ){
					obj[name] = prop;
				}
			});
		},
		getOptions: (function(){
			var normalName = /\-([a-z])/g;
			var regs = {};
			var nameRegs = {};
			var regFn = function(f, upper){
				return upper.toLowerCase();
			};
			var nameFn = function(f, dashed){
				return dashed.toUpperCase();
			};
			return function(elem, name, bases, stringAllowed){
				if(nameRegs[name]){
					name = nameRegs[name];
				} else {
					nameRegs[name] = name.replace(normalName, nameFn);
					name = nameRegs[name];
				}
				var data = elementData(elem, 'cfg'+name);
				var dataName;
				var cfg = {};
				
				if(data){
					return data;
				}
				data = $(elem).data();
				if(data && typeof data[name] == 'string'){
					if(stringAllowed){
						return elementData(elem, 'cfg'+name, data[name]);
					}
					webshims.error('data-'+ name +' attribute has to be a valid JSON, was: '+ data[name]);
				}
				if(!bases){
					bases = [true, {}];
				} else if(!Array.isArray(bases)){
					bases = [true, {}, bases];
				} else {
					bases.unshift(true, {});
				}
				
				if(data && typeof data[name] == 'object'){
					bases.push(data[name]);
				}
				
				if(!regs[name]){
					regs[name] = new RegExp('^'+ name +'([A-Z])');
				}
				
				for(dataName in data){
					if(regs[name].test(dataName)){
						cfg[dataName.replace(regs[name], regFn)] = data[dataName];
					}
				}
				bases.push(cfg);
				return elementData(elem, 'cfg'+name, $.extend.apply($, bases));
			};
		})(),
		//http://www.w3.org/TR/html5/common-dom-interfaces.html#reflect
		createPropDefault: createPropDefault,
		data: elementData,
		moveToFirstEvent: function(elem, eventType, bindType){
			var events = ($._data(elem, 'events') || {})[eventType];
			var fn;
			
			if(events && events.length > 1){
				fn = events.pop();
				if(!bindType){
					bindType = 'bind';
				}
				if(bindType == 'bind' && events.delegateCount){
					events.splice( events.delegateCount, 0, fn);
				} else {
					events.unshift( fn );
				}
				
				
			}
			elem = null;
		},
		addShadowDom: (function(){
			var resizeTimer;
			var lastHeight;
			var lastWidth;
			var $window = $(window);
			var docObserve = {
				init: false,
				runs: 0,
				test: function(){
					var height = docObserve.getHeight();
					var width = docObserve.getWidth();
					
					if(height != docObserve.height || width != docObserve.width){
						docObserve.height = height;
						docObserve.width = width;
						docObserve.handler({type: 'docresize'});
						docObserve.runs++;
						if(docObserve.runs < 9){
							setTimeout(docObserve.test, 90);
						}
					} else {
						docObserve.runs = 0;
					}
				},
				handler: (function(){
					var evt;
					var trigger = function(){
						$(document).triggerHandler('updateshadowdom', [evt]);
					};
					var timed = function(){
						if(evt && evt.type == 'resize'){
							var width = $window.width();
							var height = $window.width();

							if(height == lastHeight && width == lastWidth){
								return;
							}
							lastHeight = height;
							lastWidth = width;
						}

						if(evt && evt.type != 'docresize'){
							docObserve.height = docObserve.getHeight();
							docObserve.width = docObserve.getWidth();
						}

						if(window.requestAnimationFrame){
							requestAnimationFrame(trigger);
						} else {
							setTimeout(trigger, 0);
						}
					};
					return function(e){
						clearTimeout(resizeTimer);
						evt = e;
						resizeTimer = setTimeout(timed, (e.type == 'resize' && !window.requestAnimationFrame) ? 50 : 9);
					};
				})(),
				_create: function(){
					$.each({ Height: "getHeight", Width: "getWidth" }, function(name, type){
						var body = document.body;
						var doc = document.documentElement;
						docObserve[type] = function (){
							return Math.max(
								body[ "scroll" + name ], doc[ "scroll" + name ],
								body[ "offset" + name ], doc[ "offset" + name ],
								doc[ "client" + name ]
							);
						};
					});
				},
				start: function(){
					if(!this.init && document.body){
						this.init = true;
						this._create();
						this.height = docObserve.getHeight();
						this.width = docObserve.getWidth();
						setInterval(this.test, 999);
						$(this.test);
						if($.support.boxSizing == null){
							$(function(){
								if($.support.boxSizing){
									docObserve.handler({type: 'boxsizing'});
								}
							});
						}
						webshims.ready('WINDOWLOAD', this.test);
						$(document).on('updatelayout.webshim pageinit popupafteropen panelbeforeopen tabsactivate collapsibleexpand shown.bs.modal shown.bs.collapse slid.bs.carousel playerdimensionchange', this.handler);
						$(window).on('resize', this.handler);
					}
				}
			};
			
			
			webshims.docObserve = function(){
				webshims.ready('DOM', function(){
					docObserve.start();

				});
			};
			return function(nativeElem, shadowElem, opts){
				if(nativeElem && shadowElem){
					opts = opts || {};
					if(nativeElem.jquery){
						nativeElem = nativeElem[0];
					}
					if(shadowElem.jquery){
						shadowElem = shadowElem[0];
					}
					var nativeData = $.data(nativeElem, dataID) || $.data(nativeElem, dataID, {});
					var shadowData = $.data(shadowElem, dataID) || $.data(shadowElem, dataID, {});
					var shadowFocusElementData = {};
					if(!opts.shadowFocusElement){
						opts.shadowFocusElement = shadowElem;
					} else if(opts.shadowFocusElement){
						if(opts.shadowFocusElement.jquery){
							opts.shadowFocusElement = opts.shadowFocusElement[0];
						}
						shadowFocusElementData = $.data(opts.shadowFocusElement, dataID) || $.data(opts.shadowFocusElement, dataID, shadowFocusElementData);
					}
					
					$(nativeElem).on('remove', function(e){
						if (!e.originalEvent) {
							setTimeout(function(){
								$(shadowElem).remove();
							}, 4);
						}
					});
					
					nativeData.hasShadow = shadowElem;
					shadowFocusElementData.nativeElement = shadowData.nativeElement = nativeElem;
					shadowFocusElementData.shadowData = shadowData.shadowData = nativeData.shadowData = {
						nativeElement: nativeElem,
						shadowElement: shadowElem,
						shadowFocusElement: opts.shadowFocusElement
					};
					if(opts.shadowChilds){
						opts.shadowChilds.each(function(){
							elementData(this, 'shadowData', shadowData.shadowData);
						});
					}
					
					if(opts.data){
						shadowFocusElementData.shadowData.data = shadowData.shadowData.data = nativeData.shadowData.data = opts.data;
					}
					opts = null;
				}
				webshims.docObserve();
			};
		})(),
		propTypes: {
			standard: function(descs, name){
				createPropDefault(descs);
				if(descs.prop){return;}
				descs.prop = {
					set: function(val){
						descs.attr.set.call(this, ''+val);
					},
					get: function(){
						return descs.attr.get.call(this) || descs.defaultValue;
					}
				};
				
			},
			"boolean": function(descs, name){
				
				createPropDefault(descs);
				if(descs.prop){return;}
				descs.prop = {
					set: function(val){
						if(val){
							descs.attr.set.call(this, "");
						} else {
							descs.removeAttr.value.call(this);
						}
					},
					get: function(){
						return descs.attr.get.call(this) != null;
					}
				};
			},
			"src": (function(){
				var anchor = document.createElement('a');
				anchor.style.display = "none";
				return function(descs, name){
					
					createPropDefault(descs);
					if(descs.prop){return;}
					descs.prop = {
						set: function(val){
							descs.attr.set.call(this, val);
						},
						get: function(){
							var href = this.getAttribute(name);
							var ret;
							if(href == null){return '';}
							
							anchor.setAttribute('href', href+'' );
							
							if(!supportHrefNormalized){
								try {
									$(anchor).insertAfter(this);
									ret = anchor.getAttribute('href', 4);
								} catch(er){
									ret = anchor.getAttribute('href', 4);
								}
								$(anchor).detach();
							}
							return ret || anchor.href;
						}
					};
				};
			})(),
			enumarated: function(descs, name){
					
					createPropDefault(descs);
					if(descs.prop){return;}
					descs.prop = {
						set: function(val){
							descs.attr.set.call(this, val);
						},
						get: function(){
							var val = (descs.attr.get.call(this) || '').toLowerCase();
							if(!val || descs.limitedTo.indexOf(val) == -1){
								val = descs.defaultValue;
							}
							return val;
						}
					};
				}
			
//			,unsignedLong: $.noop
//			,"doubble": $.noop
//			,"long": $.noop
//			,tokenlist: $.noop
//			,settableTokenlist: $.noop
		},
		reflectProperties: function(nodeNames, props){
			if(typeof props == 'string'){
				props = props.split(listReg);
			}
			props.forEach(function(prop){
				webshims.defineNodeNamesProperty(nodeNames, prop, {
					prop: {
						set: function(val){
							$.attr(this, prop, val);
						},
						get: function(){
							return $.attr(this, prop) || '';
						}
					}
				});
			});
		},
		defineNodeNameProperty: function(nodeName, prop, descs){
			havePolyfill[prop] = true;
						
			if(descs.reflect){
				if(descs.propType && !webshims.propTypes[descs.propType]){
					webshims.error('could not finde propType '+ descs.propType);
				} else {
					webshims.propTypes[descs.propType || 'standard'](descs, prop);
				}
				
			}
			
			['prop', 'attr', 'removeAttr'].forEach(function(type){
				var desc = descs[type];
				if(desc){
					if(type === 'prop'){
						desc = $.extend({writeable: true}, desc);
					} else {
						desc = $.extend({}, desc, {writeable: true});
					}
						
					extendQ[type](nodeName, prop, desc);
					if(nodeName != '*' && webshims.cfg.extendNative && type == 'prop' && desc.value && $.isFunction(desc.value)){
						extendNativeValue(nodeName, prop, desc);
					}
					descs[type] = desc;
				}
			});
			if(descs.initAttr){
				initProp.content(nodeName, prop);
			}
			return descs;
		},
		
		defineNodeNameProperties: function(name, descs, propType, _noTmpCache){
			var olddesc;
			for(var prop in descs){
				if(!_noTmpCache && descs[prop].initAttr){
					initProp.createTmpCache(name);
				}
				if(propType){
					if(descs[prop][propType]){
						//webshims.log('override: '+ name +'['+prop +'] for '+ propType);
					} else {
						descs[prop][propType] = {};
						['value', 'set', 'get'].forEach(function(copyProp){
							if(copyProp in descs[prop]){
								descs[prop][propType][copyProp] = descs[prop][copyProp];
								delete descs[prop][copyProp];
							}
						});
					}
				}
				descs[prop] = webshims.defineNodeNameProperty(name, prop, descs[prop]);
			}
			if(!_noTmpCache){
				initProp.flushTmpCache();
			}
			return descs;
		},
		
		createElement: function(nodeName, create, descs){
			var ret;
			if($.isFunction(create)){
				create = {
					after: create
				};
			}
			initProp.createTmpCache(nodeName);
			if(create.before){
				initProp.createElement(nodeName, create.before);
			}
			if(descs){
				ret = webshims.defineNodeNameProperties(nodeName, descs, false, true);
			}
			if(create.after){
				initProp.createElement(nodeName, create.after);
			}
			initProp.flushTmpCache();
			return ret;
		},
		onNodeNamesPropertyModify: function(nodeNames, props, desc, only){
			if(typeof nodeNames == 'string'){
				nodeNames = nodeNames.split(listReg);
			}
			if($.isFunction(desc)){
				desc = {set: desc};
			}
			
			nodeNames.forEach(function(name){
				if(!modifyProps[name]){
					modifyProps[name] = {};
				}
				if(typeof props == 'string'){
					props = props.split(listReg);
				}
				if(desc.initAttr){
					initProp.createTmpCache(name);
				}
				props.forEach(function(prop){
					if(!modifyProps[name][prop]){
						modifyProps[name][prop] = [];
						havePolyfill[prop] = true;
					}
					if(desc.set){
						if(only){
							desc.set.only =  only;
						}
						modifyProps[name][prop].push(desc.set);
					}
					
					if(desc.initAttr){
						initProp.content(name, prop);
					}
				});
				initProp.flushTmpCache();
				
			});
		},
		defineNodeNamesBooleanProperty: function(elementNames, prop, descs){
			if(!descs){
				descs = {};
			}
			if($.isFunction(descs)){
				descs.set = descs;
			}
			webshims.defineNodeNamesProperty(elementNames, prop, {
				attr: {
					set: function(val){
						if(descs.useContentAttribute){
							webshims.contentAttr(this, prop, val);
						} else {
							this.setAttribute(prop, val);
						}
						if(descs.set){
							descs.set.call(this, true);
						}
					},
					get: function(){
						var ret = (descs.useContentAttribute) ? webshims.contentAttr(this, prop) : this.getAttribute(prop);
						return (ret == null) ? undefined : prop;
					}
				},
				removeAttr: {
					value: function(){
						this.removeAttribute(prop);
						if(descs.set){
							descs.set.call(this, false);
						}
					}
				},
				reflect: true,
				propType: 'boolean',
				initAttr: descs.initAttr || false
			});
		},
		contentAttr: function(elem, name, val){
			if(!elem.nodeName){return;}
			var attr;
			if(val === undefined){
				attr = (elem.attributes[name] || {});
				val = attr.specified ? attr.value : null;
				return (val == null) ? undefined : val;
			}
			
			if(typeof val == 'boolean'){
				if(!val){
					elem.removeAttribute(name);
				} else {
					elem.setAttribute(name, name);
				}
			} else {
				elem.setAttribute(name, val);
			}
		},
		
		activeLang: (function(){
			var curLang = [];
			var langDatas = [];
			var loading = {};
			var load = function(src, obj, loadingLang){
				obj._isLoading = true;
				if(loading[src]){
					loading[src].push(obj);
				} else {
					loading[src] = [obj];
					webshims.loader.loadScript(src, function(){
						if(loadingLang == curLang.join()){
							$.each(loading[src], function(i, obj){
								select(obj);
							});
						}
						delete loading[src];
					});
				}
			};
			
			var select = function(obj){
				var oldLang = obj.__active;
				var selectLang = function(i, lang){
					obj._isLoading = false;
					if(obj[lang] || obj.availableLangs.indexOf(lang) != -1){
						if(obj[lang]){
							obj.__active = obj[lang];
							obj.__activeName = lang;
						} else {
							load(obj.langSrc+lang, obj, curLang.join());
						}
						return false;
					}
				};
				$.each(curLang, selectLang);
				if(!obj.__active){
					obj.__active = obj[''];
					obj.__activeName = '';
				}
				if(oldLang != obj.__active){
					$(obj).trigger('change');
				}
			};
			return function(lang){
				var shortLang;
				if(typeof lang == 'string'){
					if(curLang[0] != lang){
						curLang = [lang];
						shortLang = curLang[0].split('-')[0];
						if(shortLang && shortLang != lang){
							curLang.push(shortLang);
						}
						langDatas.forEach(select);
					}
				} else if(typeof lang == 'object'){
					if(!lang.__active){
						langDatas.push(lang);
						select(lang);
					}
					return lang.__active;
				}
				return curLang[0];
			};
		})()
	});
	
	$.each({
		defineNodeNamesProperty: 'defineNodeNameProperty',
		defineNodeNamesProperties: 'defineNodeNameProperties',
		createElements: 'createElement'
	}, function(name, baseMethod){
		webshims[name] = function(names, a, b, c){
			if(typeof names == 'string'){
				names = names.split(listReg);
			}
			var retDesc = {};
			names.forEach(function(nodeName){
				retDesc[nodeName] = webshims[baseMethod](nodeName, a, b, c);
			});
			return retDesc;
		};
	});
	
	webshims.isReady('webshimLocalization', true);

//html5a11y + hidden attribute
(function(){
	if(('content' in document.createElement('template'))){return;}
	
	$(function(){
		var main = $('main').attr({role: 'main'});
		if(main.length > 1){
			webshims.error('only one main element allowed in document');
		} else if(main.is('article *, section *')) {
			webshims.error('main not allowed inside of article/section elements');
		}
	});
	
	if(('hidden' in document.createElement('a'))){
		return;
	}
	
	webshims.defineNodeNamesBooleanProperty(['*'], 'hidden');
	
	var elemMappings = {
		article: "article",
		aside: "complementary",
		section: "region",
		nav: "navigation",
		address: "contentinfo"
	};
	var addRole = function(elem, role){
		var hasRole = elem.getAttribute('role');
		if (!hasRole) {
			elem.setAttribute('role', role);
		}
	};
	
	
	$.webshims.addReady(function(context, contextElem){
		$.each(elemMappings, function(name, role){
			var elems = $(name, context).add(contextElem.filter(name));
			for (var i = 0, len = elems.length; i < len; i++) {
				addRole(elems[i], role);
			}
		});
		if (context === document) {
			var header = document.getElementsByTagName('header')[0];
			var footers = document.getElementsByTagName('footer');
			var footerLen = footers.length;
			
			if (header && !$(header).closest('section, article')[0]) {
				addRole(header, 'banner');
			}
			if (!footerLen) {
				return;
			}
			var footer = footers[footerLen - 1];
			if (!$(footer).closest('section, article')[0]) {
				addRole(footer, 'contentinfo');
			}
		}
	});
	
})();
});

;webshims.register('form-message', function($, webshims, window, document, undefined, options){
	"use strict";
	if(options.lazyCustomMessages){
		options.customMessages = true;
	}
	var validityMessages = webshims.validityMessages;
	
	var implementProperties = options.customMessages ? ['customValidationMessage'] : [];
	
	validityMessages.en = $.extend(true, {
		typeMismatch: {
			defaultMessage: 'Please enter a valid value.',
			email: 'Please enter an email address.',
			url: 'Please enter a URL.'
		},
		badInput: {
			defaultMessage: 'Please enter a valid value.',
			number: 'Please enter a number.',
			date: 'Please enter a date.',
			time: 'Please enter a time.',
			range: 'Invalid input.',
			month: 'Please enter a valid value.',
			"datetime-local": 'Please enter a datetime.'
		},
		rangeUnderflow: {
			defaultMessage: 'Value must be greater than or equal to {%min}.'
		},
		rangeOverflow: {
			defaultMessage: 'Value must be less than or equal to {%max}.'
		},
		stepMismatch: 'Invalid input.',
		tooLong: 'Please enter at most {%maxlength} character(s). You entered {%valueLen}.',
		tooShort: 'Please enter at least {%minlength} character(s). You entered {%valueLen}.',
		patternMismatch: 'Invalid input. {%title}',
		valueMissing: {
			defaultMessage: 'Please fill out this field.',
			checkbox: 'Please check this box if you want to proceed.'
		}
	}, (validityMessages.en || validityMessages['en-US'] || {}));
	
	if(typeof validityMessages['en'].valueMissing == 'object'){
		['select', 'radio'].forEach(function(type){
			validityMessages.en.valueMissing[type] = validityMessages.en.valueMissing[type] || 'Please select an option.';
		});
	}
	if(typeof validityMessages.en.rangeUnderflow == 'object'){
		['date', 'time', 'datetime-local', 'month'].forEach(function(type){
			validityMessages.en.rangeUnderflow[type] = validityMessages.en.rangeUnderflow[type] || 'Value must be at or after {%min}.';
		});
	}
	if(typeof validityMessages.en.rangeOverflow == 'object'){
		['date', 'time', 'datetime-local', 'month'].forEach(function(type){
			validityMessages.en.rangeOverflow[type] = validityMessages.en.rangeOverflow[type] || 'Value must be at or before {%max}.';
		});
	}
	if(!validityMessages['en-US']){
		validityMessages['en-US'] = $.extend(true, {}, validityMessages.en);
	}
	if(!validityMessages['en-GB']){
		validityMessages['en-GB'] = $.extend(true, {}, validityMessages.en);
	}
	if(!validityMessages['en-AU']){
		validityMessages['en-AU'] = $.extend(true, {}, validityMessages.en);
	}
	validityMessages[''] = validityMessages[''] || validityMessages['en-US'];
	
	validityMessages.de = $.extend(true, {
		typeMismatch: {
			defaultMessage: '{%value} ist in diesem Feld nicht zulässig.',
			email: '{%value} ist keine gültige E-Mail-Adresse.',
			url: '{%value} ist kein(e) gültige(r) Webadresse/Pfad.'
		},
		badInput: {
			defaultMessage: 'Geben Sie einen zulässigen Wert ein.',
			number: 'Geben Sie eine Nummer ein.',
			date: 'Geben Sie ein Datum ein.',
			time: 'Geben Sie eine Uhrzeit ein.',
			month: 'Geben Sie einen Monat mit Jahr ein.',
			range: 'Geben Sie eine Nummer.',
			"datetime-local": 'Geben Sie ein Datum mit Uhrzeit ein.'
		},
		rangeUnderflow: {
			defaultMessage: '{%value} ist zu niedrig. {%min} ist der unterste Wert, den Sie benutzen können.'
		},
		rangeOverflow: {
			defaultMessage: '{%value} ist zu hoch. {%max} ist der oberste Wert, den Sie benutzen können.'
		},
		stepMismatch: 'Der Wert {%value} ist in diesem Feld nicht zulässig. Hier sind nur bestimmte Werte zulässig. {%title}',
		tooLong: 'Der eingegebene Text ist zu lang! Sie haben {%valueLen} Zeichen eingegeben, dabei sind {%maxlength} das Maximum.',
		tooShort: 'Der eingegebene Text ist zu kurz! Sie haben {%valueLen} Zeichen eingegeben, dabei sind {%minlength} das Minimum.',
		patternMismatch: '{%value} hat für dieses Eingabefeld ein falsches Format. {%title}',
		valueMissing: {
			defaultMessage: 'Bitte geben Sie einen Wert ein.',
			checkbox: 'Bitte aktivieren Sie das Kästchen.'
		}
	}, (validityMessages.de || {}));
	
	if(typeof validityMessages.de.valueMissing == 'object'){
		['select', 'radio'].forEach(function(type){
			validityMessages.de.valueMissing[type] = validityMessages.de.valueMissing[type] || 'Bitte wählen Sie eine Option aus.';
		});
	}
	if(typeof validityMessages.de.rangeUnderflow == 'object'){
		['date', 'time', 'datetime-local', 'month'].forEach(function(type){
			validityMessages.de.rangeUnderflow[type] = validityMessages.de.rangeUnderflow[type] || '{%value} ist zu früh. {%min} ist die früheste Zeit, die Sie benutzen können.';
		});
	}
	if(typeof validityMessages.de.rangeOverflow == 'object'){
		['date', 'time', 'datetime-local', 'month'].forEach(function(type){
			validityMessages.de.rangeOverflow[type] = validityMessages.de.rangeOverflow[type] || '{%value} ist zu spät. {%max} ist die späteste Zeit, die Sie benutzen können.';
		});
	}
	
	var currentValidationMessage =  validityMessages[''];
	var getMessageFromObj = function(message, elem){
		if(message && typeof message !== 'string'){
			message = message[ $.prop(elem, 'type') ] || message[ (elem.nodeName || '').toLowerCase() ] || message[ 'defaultMessage' ];
		}
		return message || '';
	};
	var lReg = /</g;
	var gReg = />/g;
	var valueVals = {
		value: 1,
		min: 1,
		max: 1
	};
	var toLocale = (function(){
		var monthFormatter;
		var transforms = {
			number: function(val){
				var num = val * 1;
				if(num.toLocaleString && !isNaN(num)){
					val = num.toLocaleString() || val;
				}
				return val;
			}
		};
		var _toLocale = function(val, elem, attr){
			var type, widget;
			if(valueVals[attr]){
				type = $.prop(elem, 'type');
				widget = $(elem).getShadowElement().data('wsWidget'+ type );
				if(widget && widget.formatValue){
					val = widget.formatValue(val, false);
				} else if(transforms[type]){
					val = transforms[type](val);
				}
			}
			return val;
		};

		[{n: 'date', f: 'toLocaleDateString'}, {n: 'time', f: 'toLocaleTimeString'}, {n: 'datetime-local', f: 'toLocaleString'}].forEach(function(desc){
			transforms[desc.n] = function(val){
				var date = new Date(val);
				if(date && date[desc.f]){
					val = date[desc.f]() || val;
				}
				return val;
			};
		});

		if(window.Intl && Intl.DateTimeFormat){
			monthFormatter = new Intl.DateTimeFormat(navigator.browserLanguage || navigator.language, {year: "numeric", month: "2-digit"}).format(new Date());
			if(monthFormatter && monthFormatter.format){
				transforms.month = function(val){
					var date = new Date(val);
					if(date){
						val = monthFormatter.format(date) || val;
					}
					return val;
				};
			}
		}

		webshims.format =  {};

		['date', 'number', 'month', 'time', 'datetime-local'].forEach(function(name){
			webshims.format[name] = function(val, opts){
				if(opts && opts.nodeType){
					return _toLocale(val, opts, name);
				}
				if(name == 'number' && opts && opts.toFixed ){
					val = (val * 1);
					if(!opts.fixOnlyFloat || val % 1){
						val = val.toFixed(opts.toFixed);
					}
				}
				if(webshims._format && webshims._format[name]){
					return webshims._format[name](val, opts);
				}
				return transforms[name](val);
			};
		});

		return _toLocale;
	})();

	webshims.replaceValidationplaceholder = function(elem, message, name){
		var val = $.prop(elem, 'title');
		if(message){
			if(name == 'patternMismatch' && !val){
				webshims.error('no title for patternMismatch provided. Always add a title attribute.');
			}
			if(val){
				val = '<span class="ws-titlevalue">'+ val.replace(lReg, '&lt;').replace(gReg, '&gt;') +'</span>';
			}

			if(message.indexOf('{%title}') != -1){
				message = message.replace('{%title}', val);
			} else if(val) {
				message = message+' '+val;
			}
		}

		if(message && message.indexOf('{%') != -1){
			['value', 'min', 'max', 'maxlength', 'minlength', 'label'].forEach(function(attr){
				if(message.indexOf('{%'+attr) === -1){return;}
				var val = ((attr == 'label') ? $.trim($('label[for="'+ elem.id +'"]', elem.form).text()).replace(/\*$|:$/, '') : $.prop(elem, attr) || $.attr(elem, attr) || '') || '';
				val = ''+val;


				val = toLocale(val, elem, attr);

				message = message.replace('{%'+ attr +'}', val.replace(lReg, '&lt;').replace(gReg, '&gt;'));
				if('value' == attr){
					message = message.replace('{%valueLen}', val.length);
				}

			});
		}
		return message;
	};
	
	webshims.createValidationMessage = function(elem, name){

		var message = getMessageFromObj(currentValidationMessage[name], elem);
		if(!message && name == 'badInput'){
			message = getMessageFromObj(currentValidationMessage.typeMismatch, elem);
		}
		if(!message && name == 'typeMismatch'){
			message = getMessageFromObj(currentValidationMessage.badInput, elem);
		}
		if(!message){
			message = getMessageFromObj(validityMessages[''][name], elem) || ($.prop(elem, 'validationMessage') || '').replace(lReg, '&lt;').replace(gReg, '&gt;');
			if(name != 'customError'){
				webshims.info('could not find errormessage for: '+ name +' / '+ $.prop(elem, 'type') +'. in language: '+webshims.activeLang());
			}
		}
		message = webshims.replaceValidationplaceholder(elem, message, name);
		
		return message || '';
	};
	
	
	if(!webshims.support.formvalidation || webshims.bugs.bustedValidity){
		implementProperties.push('validationMessage');
	}
	
	currentValidationMessage = webshims.activeLang(validityMessages);
		
	$(validityMessages).on('change', function(e, data){
		currentValidationMessage = validityMessages.__active;
	});
	
	implementProperties.forEach(function(messageProp){
		
		webshims.defineNodeNamesProperty(['fieldset', 'output', 'button'], messageProp, {
			prop: {
				value: '',
				writeable: false
			}
		});
		['input', 'select', 'textarea'].forEach(function(nodeName){
			var desc = webshims.defineNodeNameProperty(nodeName, messageProp, {
				prop: {
					get: function(){
						var elem = this;
						var message = '';
						if(!$.prop(elem, 'willValidate')){
							return message;
						}
						
						var validity = $.prop(elem, 'validity') || {valid: 1};
						
						if(validity.valid){return message;}
						message = webshims.getContentValidationMessage(elem, validity);
						
						if(message){return message;}
						
						if(validity.customError && elem.nodeName){
							message = (webshims.support.formvalidation && !webshims.bugs.bustedValidity && desc.prop._supget) ? desc.prop._supget.call(elem) : webshims.data(elem, 'customvalidationMessage');
							if(message){return message;}
						}
						$.each(validity, function(name, prop){
							if(name == 'valid' || !prop){return;}
							
							message = webshims.createValidationMessage(elem, name);
							if(message){
								return false;
							}
						});
						
						return message || '';
					},
					writeable: false
				}
			});
		});
		
	});
});

;/*!	SWFMini - a SWFObject 2.2 cut down version for webshims
 * 
 * based on SWFObject v2.2 <http://code.google.com/p/swfobject/> 
	is released under the MIT License <http://www.opensource.org/licenses/mit-license.php> 
*/

var swfmini = function() {
	var wasRemoved = function(){webshims.error('This method was removed from swfmini');};
	var UNDEF = "undefined",
		OBJECT = "object",
		webshims = window.webshims,
		SHOCKWAVE_FLASH = "Shockwave Flash",
		SHOCKWAVE_FLASH_AX = "ShockwaveFlash.ShockwaveFlash",
		FLASH_MIME_TYPE = "application/x-shockwave-flash",
		
		win = window,
		doc = document,
		nav = navigator,
		
		plugin = false,
		domLoadFnArr = [main],

		isDomLoaded = false,
		autoHideShow = true,
	
	/* Centralized function for browser feature detection
		- User agent string detection is only used when no good alternative is possible
		- Is executed directly for optimal performance
	*/	
	ua = function() {
		var w3cdom = typeof doc.getElementById != UNDEF && typeof doc.getElementsByTagName != UNDEF && typeof doc.createElement != UNDEF,
			u = nav.userAgent.toLowerCase(),
			p = nav.platform.toLowerCase(),
			windows = p ? /win/.test(p) : /win/.test(u),
			mac = p ? /mac/.test(p) : /mac/.test(u),
			webkit = /webkit/.test(u) ? parseFloat(u.replace(/^.*webkit\/(\d+(\.\d+)?).*$/, "$1")) : false, // returns either the webkit version or false if not webkit
			ie = !+"\v1", // feature detection based on Andrea Giammarchi's solution: http://webreflection.blogspot.com/2009/01/32-bytes-to-know-if-your-browser-is-ie.html
			playerVersion = [0,0,0],
			d = null;
		if (typeof nav.plugins != UNDEF && typeof nav.plugins[SHOCKWAVE_FLASH] == OBJECT) {
			d = nav.plugins[SHOCKWAVE_FLASH].description;
			if (d && !(typeof nav.mimeTypes != UNDEF && nav.mimeTypes[FLASH_MIME_TYPE] && !nav.mimeTypes[FLASH_MIME_TYPE].enabledPlugin)) { // navigator.mimeTypes["application/x-shockwave-flash"].enabledPlugin indicates whether plug-ins are enabled or disabled in Safari 3+
				plugin = true;
				ie = false; // cascaded feature detection for Internet Explorer
				d = d.replace(/^.*\s+(\S+\s+\S+$)/, "$1");
				playerVersion[0] = parseInt(d.replace(/^(.*)\..*$/, "$1"), 10);
				playerVersion[1] = parseInt(d.replace(/^.*\.(.*)\s.*$/, "$1"), 10);
				playerVersion[2] = /[a-zA-Z]/.test(d) ? parseInt(d.replace(/^.*[a-zA-Z]+(.*)$/, "$1"), 10) : 0;
			}
		}
		else if (typeof win.ActiveXObject != UNDEF) {
			try {
				var a = new ActiveXObject(SHOCKWAVE_FLASH_AX);
				if (a) { // a will return null when ActiveX is disabled
					d = a.GetVariable("$version");
					if (d) {
						ie = true; // cascaded feature detection for Internet Explorer
						d = d.split(" ")[1].split(",");
						playerVersion = [parseInt(d[0], 10), parseInt(d[1], 10), parseInt(d[2], 10)];
					}
				}
			}
			catch(e) {}
		}
		return { w3:w3cdom, pv:playerVersion, wk:webkit, ie:ie, win:windows, mac:mac };
	}();
	
	
	function callDomLoadFunctions() {
		if (isDomLoaded) { return; }
		isDomLoaded = true;
		var dl = domLoadFnArr.length;
		for (var i = 0; i < dl; i++) {
			domLoadFnArr[i]();
		}
	}
	
	function addDomLoadEvent(fn) {
		if (isDomLoaded) {
			fn();
		}
		else { 
			domLoadFnArr[domLoadFnArr.length] = fn; // Array.push() is only available in IE5.5+
		}
	}

	
	/* Main function
		- Will preferably execute onDomLoad, otherwise onload (as a fallback)
	*/
	function main() { 
		if (plugin) {
			testPlayerVersion();
		}
	}
	
	/* Detect the Flash Player version for non-Internet Explorer browsers
		- Detecting the plug-in version via the object element is more precise than using the plugins collection item's description:
		  a. Both release and build numbers can be detected
		  b. Avoid wrong descriptions by corrupt installers provided by Adobe
		  c. Avoid wrong descriptions by multiple Flash Player entries in the plugin Array, caused by incorrect browser imports
		- Disadvantage of this method is that it depends on the availability of the DOM, while the plugins collection is immediately available
	*/
	function testPlayerVersion() {
		var b = doc.getElementsByTagName("body")[0];
		var o = createElement(OBJECT);
		o.setAttribute("type", FLASH_MIME_TYPE);
		var t = b.appendChild(o);
		if (t) {
			var counter = 0;
			(function(){
				if (typeof t.GetVariable != UNDEF) {
					var d = t.GetVariable("$version");
					if (d) {
						d = d.split(" ")[1].split(",");
						ua.pv = [parseInt(d[0], 10), parseInt(d[1], 10), parseInt(d[2], 10)];
					}
				}
				else if (counter < 10) {
					counter++;
					setTimeout(arguments.callee, 10);
					return;
				}
				b.removeChild(o);
				t = null;
			})();
		}
	}

	
	function createElement(el) {
		return doc.createElement(el);
	}
	

	/* Flash Player and SWF content version matching
	*/
	function hasPlayerVersion(rv) {
		var pv = ua.pv, v = rv.split(".");
		v[0] = parseInt(v[0], 10);
		v[1] = parseInt(v[1], 10) || 0; // supports short notation, e.g. "9" instead of "9.0.0"
		v[2] = parseInt(v[2], 10) || 0;
		return (pv[0] > v[0] || (pv[0] == v[0] && pv[1] > v[1]) || (pv[0] == v[0] && pv[1] == v[1] && pv[2] >= v[2])) ? true : false;
	}
	
	



	webshims.ready('DOM', callDomLoadFunctions);

	webshims.loader.addModule('swfmini-embed', {d: ['swfmini']});
	var loadEmbed = hasPlayerVersion('9.0.0') ?
		function(){
			webshims.loader.loadList(['swfmini-embed']);
			return true;
		} :
		webshims.$.noop
	;

	if(!webshims.support.mediaelement){
		loadEmbed();
	} else {
		webshims.ready('WINDOWLOAD', loadEmbed);
	}

	return {
		/* Public API
			- Reference: http://code.google.com/p/swfobject/wiki/documentation
		*/ 
		registerObject: wasRemoved,
		
		getObjectById: wasRemoved,
		
		embedSWF: function(swfUrlStr, replaceElemIdStr, widthStr, heightStr, swfVersionStr, xiSwfUrlStr, flashvarsObj, parObj, attObj, callbackFn) {
			var args = arguments;
			if(loadEmbed()){
				webshims.ready('swfmini-embed', function(){
					swfmini.embedSWF.apply(swfmini, args);
				});
			} else if(callbackFn) {
				callbackFn({success:false, id:replaceElemIdStr});
			}
		},
		
		switchOffAutoHideShow: function() {
			autoHideShow = false;
		},
		
		ua: ua,
		
		getFlashPlayerVersion: function() {
			return { major:ua.pv[0], minor:ua.pv[1], release:ua.pv[2] };
		},
		
		hasFlashPlayerVersion: hasPlayerVersion,
		
		createSWF: function(attObj, parObj, replaceElemIdStr) {
			if (ua.w3) {
				return createSWF(attObj, parObj, replaceElemIdStr);
			}
			else {
				return undefined;
			}
		},
		
		showExpressInstall: wasRemoved,
		
		removeSWF: wasRemoved,
		
		createCSS: wasRemoved,
		
		addDomLoadEvent: addDomLoadEvent,
		
		addLoadEvent: wasRemoved,
		
		
		// For internal usage only
		expressInstallCallback: wasRemoved
	};
}();

webshims.isReady('swfmini', true);

;(function(webshims){
	"use strict";
	var support = webshims.support;
	var hasNative = support.mediaelement;
	var supportsLoop = false;
	var bugs = webshims.bugs;
	var swfType = 'mediaelement-jaris';
	var loadSwf = function(){
		webshims.ready(swfType, function(){
			if(!webshims.mediaelement.createSWF){
				webshims.mediaelement.loadSwf = true;
				webshims.reTest([swfType], hasNative);
			}
		});
	};

	var wsCfg = webshims.cfg;
	var options = wsCfg.mediaelement;
	var isIE = navigator.userAgent.indexOf('MSIE') != -1;
	if(!options){
		webshims.error("mediaelement wasn't implemented but loaded");
		return;
	}

	if(hasNative){
		var videoElem = document.createElement('video');
		support.videoBuffered = ('buffered' in videoElem);
		support.mediaDefaultMuted = ('defaultMuted' in videoElem);
		supportsLoop = ('loop' in videoElem);
		support.mediaLoop = supportsLoop;

		webshims.capturingEvents(['play', 'playing', 'waiting', 'paused', 'ended', 'durationchange', 'loadedmetadata', 'canplay', 'volumechange']);
		
		if( !support.videoBuffered || !supportsLoop || (!support.mediaDefaultMuted && isIE && 'ActiveXObject' in window) ){
			webshims.addPolyfill('mediaelement-native-fix', {
				d: ['dom-support']
			});
			webshims.loader.loadList(['mediaelement-native-fix']);
		}
	}
	
	if(support.track && !bugs.track){
		(function(){
			if(!bugs.track){

				if(window.VTTCue && !window.TextTrackCue){
					window.TextTrackCue = window.VTTCue;
				} else if(!window.VTTCue){
					window.VTTCue = window.TextTrackCue;
				}

				try {
					new VTTCue(2, 3, '');
				} catch(e){
					bugs.track = true;
				}
			}
		})();
	}

	if(window.CanvasRenderingContext2D && CanvasRenderingContext2D.prototype){
		CanvasRenderingContext2D.prototype.wsImageComplete = function(cb){
			cb.call(this, this);
		};
	}

webshims.register('mediaelement-core', function($, webshims, window, document, undefined, options){
	var hasSwf = swfmini.hasFlashPlayerVersion('11.3');
	var mediaelement = webshims.mediaelement;
	var allowYtLoading = false;
	
	mediaelement.parseRtmp = function(data){
		var src = data.src.split('://');
		var paths = src[1].split('/');
		var i, len, found;
		data.server = src[0]+'://'+paths[0]+'/';
		data.streamId = [];
		for(i = 1, len = paths.length; i < len; i++){
			if(!found && paths[i].indexOf(':') !== -1){
				paths[i] = paths[i].split(':')[1];
				found = true;
			}
			if(!found){
				data.server += paths[i]+'/';
			} else {
				data.streamId.push(paths[i]);
			}
		}
		if(!data.streamId.length){
			webshims.error('Could not parse rtmp url');
		}
		data.streamId = data.streamId.join('/');
	};

	var getSrcObj = function(elem, nodeName){
		elem = $(elem);
		var src = {src: elem.attr('src') || '', elem: elem, srcProp: elem.prop('src')};
		var tmp;
		
		if(!src.src){return src;}
		
		tmp = elem.attr('data-server');
		if(tmp != null){
			src.server = tmp;
		}
		
		tmp = elem.attr('type') || elem.attr('data-type');
		if(tmp){
			src.type = tmp;
			src.container = $.trim(tmp.split(';')[0]);
		} else {
			if(!nodeName){
				nodeName = elem[0].nodeName.toLowerCase();
				if(nodeName == 'source'){
					nodeName = (elem.closest('video, audio')[0] || {nodeName: 'video'}).nodeName.toLowerCase();
				}
			}
			if(src.server){
				src.type = nodeName+'/rtmp';
				src.container = nodeName+'/rtmp';
			} else {
				
				tmp = mediaelement.getTypeForSrc( src.src, nodeName, src );
				
				if(tmp){
					src.type = tmp;
					src.container = tmp;
				}
			}
		}

		tmp = elem.attr('media');
		if(tmp){
			src.media = tmp;
		}
		if(src.type == 'audio/rtmp' || src.type == 'video/rtmp'){
			if(src.server){
				src.streamId = src.src;
			} else {
				mediaelement.parseRtmp(src);
			}
		}
		return src;
	};
	
	
	
	var hasYt = !hasSwf && ('postMessage' in window) && hasNative;
	
	var loadTrackUi = function(){
		if(loadTrackUi.loaded){return;}
		loadTrackUi.loaded = true;
		if(!options.noAutoTrack){
			webshims.ready('WINDOWLOAD', function(){
				loadThird();
				webshims.loader.loadList(['track-ui']);
			});
		}
	};

	var loadYt = (function(){
		var loaded;
		return function(){
			if(loaded || !hasYt){return;}
			loaded = true;
			if(allowYtLoading){
				webshims.loader.loadScript("https://www.youtube.com/player_api");
			}
			$(function(){
				webshims._polyfill(["mediaelement-yt"]);
			});
		};
	})();
	var loadThird = function(){
		if(hasSwf){
			loadSwf();
		} else {
			loadYt();
		}
	};

	
	webshims.addPolyfill('mediaelement-yt', {
		test: !hasYt,
		d: ['dom-support']
	});
	

	
	mediaelement.mimeTypes = {
		audio: {
				//ogm shouldn´t be used!
				'audio/ogg': ['ogg','oga', 'ogm'],
				'audio/ogg;codecs="opus"': 'opus',
				'audio/mpeg': ['mp2','mp3','mpga','mpega'],
				'audio/mp4': ['mp4','mpg4', 'm4r', 'm4a', 'm4p', 'm4b', 'aac'],
				'audio/wav': ['wav'],
				'audio/3gpp': ['3gp','3gpp'],
				'audio/webm': ['webm'],
				'audio/fla': ['flv', 'f4a', 'fla'],
				'application/x-mpegURL': ['m3u8', 'm3u']
			},
			video: {
				//ogm shouldn´t be used!
				'video/ogg': ['ogg','ogv', 'ogm'],
				'video/mpeg': ['mpg','mpeg','mpe'],
				'video/mp4': ['mp4','mpg4', 'm4v'],
				'video/quicktime': ['mov','qt'],
				'video/x-msvideo': ['avi'],
				'video/x-ms-asf': ['asf', 'asx'],
				'video/flv': ['flv', 'f4v'],
				'video/3gpp': ['3gp','3gpp'],
				'video/webm': ['webm'],
				'application/x-mpegURL': ['m3u8', 'm3u'],
				'video/MP2T': ['ts']
			}
		}
	;
	
	mediaelement.mimeTypes.source =  $.extend({}, mediaelement.mimeTypes.audio, mediaelement.mimeTypes.video);
	
	mediaelement.getTypeForSrc = function(src, nodeName){
		if(src.indexOf('youtube.com/watch?') != -1 || src.indexOf('youtube.com/v/') != -1){
			return 'video/youtube';
		}

		if(!src.indexOf('mediastream:') || !src.indexOf('blob:http')){
			return 'usermedia';
		}

		if(!src.indexOf('webshimstream')){
			return 'jarisplayer/stream';
		}

		if(!src.indexOf('rtmp')){
			return nodeName+'/rtmp';
		}
		src = src.split('?')[0].split('#')[0].split('.');
		src = src[src.length - 1];
		var mt;
		
		$.each(mediaelement.mimeTypes[nodeName], function(mimeType, exts){
			if(exts.indexOf(src) !== -1){
				mt = mimeType;
				return false;
			}
		});
		return mt;
	};
	
	
	mediaelement.srces = function(mediaElem){
		var srces = [];
		mediaElem = $(mediaElem);
		var nodeName = mediaElem[0].nodeName.toLowerCase();
		var src = getSrcObj(mediaElem, nodeName);

		if(!src.src){
			$('source', mediaElem).each(function(){
				src = getSrcObj(this, nodeName);
				if(src.src){srces.push(src);}
			});
		} else {
			srces.push(src);
		}
		return srces;
	};
	
	mediaelement.swfMimeTypes = ['video/3gpp', 'video/x-msvideo', 'video/quicktime', 'video/x-m4v', 'video/mp4', 'video/m4p', 'video/x-flv', 'video/flv', 'audio/mpeg', 'audio/aac', 'audio/mp4', 'audio/x-m4a', 'audio/m4a', 'audio/mp3', 'audio/x-fla', 'audio/fla', 'youtube/flv', 'video/jarisplayer', 'jarisplayer/jarisplayer', 'jarisplayer/stream', 'video/youtube', 'video/rtmp', 'audio/rtmp'];
	
	mediaelement.canThirdPlaySrces = function(mediaElem, srces){
		var ret = '';
		if(hasSwf || hasYt){
			mediaElem = $(mediaElem);
			srces = srces || mediaelement.srces(mediaElem);
			$.each(srces, function(i, src){
				if(src.container && src.src && ((hasSwf && mediaelement.swfMimeTypes.indexOf(src.container) != -1) || (hasYt && src.container == 'video/youtube'))){
					ret = src;
					return false;
				}
			});
			
		}
		
		return ret;
	};
	
	var nativeCanPlayType = {};
	mediaelement.canNativePlaySrces = function(mediaElem, srces){
		var ret = '';
		if(hasNative){
			mediaElem = $(mediaElem);
			var nodeName = (mediaElem[0].nodeName || '').toLowerCase();
			var nativeCanPlay = (nativeCanPlayType[nodeName] || {prop: {_supvalue: false}}).prop._supvalue || mediaElem[0].canPlayType;
			if(!nativeCanPlay){return ret;}
			srces = srces || mediaelement.srces(mediaElem);
			
			$.each(srces, function(i, src){
				if(src.type == 'usermedia' || (src.type && nativeCanPlay.call(mediaElem[0], src.type)) ){
					ret = src;
					return false;
				}
			});
		}
		return ret;
	};
	var emptyType = (/^\s*application\/octet\-stream\s*$/i);
	var getRemoveEmptyType = function(){
		var ret = emptyType.test($.attr(this, 'type') || '');
		if(ret){
			$(this).removeAttr('type');
		}
		return ret;
	};
	mediaelement.setError = function(elem, message){
		if($('source', elem).filter(getRemoveEmptyType).length){
			webshims.error('"application/octet-stream" is a useless mimetype for audio/video. Please change this attribute.');
			try {
				$(elem).mediaLoad();
			} catch(er){}
		} else {
			if(!message){
				message = "can't play sources";
			}
			$(elem).pause().data('mediaerror', message);
			webshims.error('mediaelementError: '+ message +'. Run the following line in your console to get more info: webshim.mediaelement.loadDebugger();');
			setTimeout(function(){
				if($(elem).data('mediaerror')){
					$(elem).addClass('media-error').trigger('mediaerror');
				}
			}, 1);
		}
		
		
	};
	
	var handleThird = (function(){
		var requested;
		var readyType = hasSwf ? swfType : 'mediaelement-yt';
		return function( mediaElem, ret, data ){
			//readd to ready

			webshims.ready(readyType, function(){
				if(mediaelement.createSWF && $(mediaElem).parent()[0]){
					mediaelement.createSWF( mediaElem, ret, data );
				} else if(!requested) {
					requested = true;
					loadThird();
					
					handleThird( mediaElem, ret, data );
				}
			});
			if(!requested && hasYt && !mediaelement.createSWF){
				allowYtLoading = true;
				loadYt();
			}
		};
	})();

	var activate = {
		native: function(elem, src, data){
			if(data && data.isActive == 'third') {
				mediaelement.setActive(elem, 'html5', data);
			}
		},
		third: handleThird
	};

	var stepSources = function(elem, data, srces){
		var i, src;
		var testOrder = [{test: 'canNativePlaySrces', activate: 'native'}, {test: 'canThirdPlaySrces', activate: 'third'}];
		if(options.preferFlash || (data && data.isActive == 'third') ){
			testOrder.reverse();
		}
		for(i = 0; i < 2; i++){
			src = mediaelement[testOrder[i].test](elem, srces);
			if(src){
				activate[testOrder[i].activate](elem, src, data);
				break;
			}
		}

		if(!src){
			mediaelement.setError(elem, false);
			if(data && data.isActive == 'third') {
				mediaelement.setActive(elem, 'html5', data);
			}
		}
	};
	var stopParent = /^(?:embed|object|datalist|picture)$/i;
	var selectSource = function(elem, data){
		var baseData = webshims.data(elem, 'mediaelementBase') || webshims.data(elem, 'mediaelementBase', {});
		var _srces = mediaelement.srces(elem);
		var parent = elem.parentNode;
		
		clearTimeout(baseData.loadTimer);
		$(elem).removeClass('media-error');
		$.data(elem, 'mediaerror', false);
		
		if(!_srces.length || !parent || parent.nodeType != 1 || stopParent.test(parent.nodeName || '')){return;}
		data = data || webshims.data(elem, 'mediaelement');
		if(mediaelement.sortMedia){
			_srces.sort(mediaelement.sortMedia);
		}
		stepSources(elem, data, _srces);

	};
	mediaelement.selectSource = selectSource;
	
	
	$(document).on('ended', function(e){
		var data = webshims.data(e.target, 'mediaelement');
		if( supportsLoop && (!data || data.isActive == 'html5') && !$.prop(e.target, 'loop')){return;}
		setTimeout(function(){
			if( $.prop(e.target, 'paused') || !$.prop(e.target, 'loop') ){return;}
			$(e.target).prop('currentTime', 0).play();
		});
		
	});
	
	var handleMedia = false;

	var initMediaElements = function(){
		var testFixMedia = function(){

			if(webshims.implement(this, 'mediaelement')){
				selectSource(this);
				if(!support.mediaDefaultMuted && $.attr(this, 'muted') != null){
					$.prop(this, 'muted', true);
				}

			}
		};
		
		webshims.ready('dom-support', function(){
			handleMedia = true;
			
			if(!supportsLoop){
				webshims.defineNodeNamesBooleanProperty(['audio', 'video'], 'loop');
			}
			
			['audio', 'video'].forEach(function(nodeName){
				var supLoad;
				supLoad = webshims.defineNodeNameProperty(nodeName, 'load',  {
					prop: {
						value: function(){
							var data = webshims.data(this, 'mediaelement');

							selectSource(this, data);
							if(hasNative && (!data || data.isActive == 'html5') && supLoad.prop._supvalue){
								supLoad.prop._supvalue.apply(this, arguments);
							}
							if(!loadTrackUi.loaded && this.querySelector('track')){
								loadTrackUi();
							}
							$(this).triggerHandler('wsmediareload');
						}
					}
				});

				nativeCanPlayType[nodeName] = webshims.defineNodeNameProperty(nodeName, 'canPlayType',  {
					prop: {
						value: function(type){
							var ret = '';
							if(hasNative && nativeCanPlayType[nodeName].prop._supvalue){
								ret = nativeCanPlayType[nodeName].prop._supvalue.call(this, type);
								if(ret == 'no'){
									ret = '';
								}
							}
							if(!ret && hasSwf){
								type = $.trim((type || '').split(';')[0]);
								if(mediaelement.swfMimeTypes.indexOf(type) != -1){
									ret = 'maybe';
								}
							}
							if(!ret && hasYt && type == 'video/youtube'){
								ret = 'maybe';
							}
							return ret;
						}
					}
				});
			});

			
			webshims.onNodeNamesPropertyModify(['audio', 'video'], ['src', 'poster'], {
				set: function(){
					var elem = this;
					var baseData = webshims.data(elem, 'mediaelementBase') || webshims.data(elem, 'mediaelementBase', {});
					clearTimeout(baseData.loadTimer);
					baseData.loadTimer = setTimeout(function(){
						selectSource(elem);
						elem = null;
					}, 9);
				}
			});
			
			
			webshims.addReady(function(context, insertedElement){
				var media = $('video, audio', context)
					.add(insertedElement.filter('video, audio'))
					.each(testFixMedia)
				;
				if(!loadTrackUi.loaded && $('track', media).length){
					loadTrackUi();
				}
				media = null;
			});
		});
		
		if(hasNative && !handleMedia){
			webshims.addReady(function(context, insertedElement){
				if(!handleMedia){
					$('video, audio', context)
						.add(insertedElement.filter('video, audio'))
						.each(function(){
							if(!mediaelement.canNativePlaySrces(this)){
								allowYtLoading = true;
								loadThird();
								handleMedia = true;
								return false;
							}
						})
					;
				}
			});
		}
	};

	mediaelement.loadDebugger = function(){
		webshims.ready('dom-support', function(){
			webshims.loader.loadScript('mediaelement-debug');
		});
	};

	if(({noCombo: 1, media: 1})[webshims.cfg.debug]){
		$(document).on('mediaerror', function(e){
			mediaelement.loadDebugger();
		});
	}

	//set native implementation ready, before swf api is retested
	if(hasNative){
		webshims.isReady('mediaelement-core', true);
		initMediaElements();
		webshims.ready('WINDOWLOAD mediaelement', loadThird);
	} else {
		webshims.ready(swfType, initMediaElements);
	}
	webshims.ready('track', loadTrackUi);

	if(document.readyState == 'complete'){
		webshims.isReady('WINDOWLOAD', true);
	}
});

})(webshims);

;webshims.validityMessages.en = {
	"typeMismatch": {
		"defaultMessage": "Please enter a valid value.",
		"email": "Please enter an email address.",
		"url": "Please enter a URL."
	},
	"badInput": {
		"defaultMessage": "Please enter a valid value.",
		"number": "Please enter a number.",
		"date": "Please enter a date.",
		"time": "Please enter a time.",
		"range": "Invalid input.",
		"month": "Please enter a valid value.",
		"datetime-local": "Please enter a datetime."
	},
	"rangeUnderflow": {
		"defaultMessage": "Value must be greater than or equal to {%min}.",
		"date": "Value must be at or after {%min}.",
		"time": "Value must be at or after {%min}.",
		"datetime-local": "Value must be at or after {%min}.",
		"month": "Value must be at or after {%min}."
	},
	"rangeOverflow": {
		"defaultMessage": "Value must be less than or equal to {%max}.",
		"date": "Value must be at or before {%max}.",
		"time": "Value must be at or before {%max}.",
		"datetime-local": "Value must be at or before {%max}.",
		"month": "Value must be at or before {%max}."
	},
	"stepMismatch": "Invalid input.",
	"tooLong": "Please enter at most {%maxlength} character(s). You entered {%valueLen}.",
	"tooShort": "Please enter at least {%minlength} character(s). You entered {%valueLen}.",
	"patternMismatch": "Invalid input. {%title}",
	"valueMissing": {
		"defaultMessage": "Please fill out this field.",
		"checkbox": "Please check this box if you want to proceed.",
		"select": "Please select an option.",
		"radio": "Please select an option."
	}
};
webshims.formcfg.en = {
	"numberFormat": {
		".": ".",
		",": ","
	},
	"numberSigns": ".",
	"dateSigns": "-",
	"timeSigns": ":. ",
	"dFormat": "-",
	"patterns": {
		"d": "yy-mm-dd"
	},
	"month": {
		"currentText": "This month"
	},
	"time": {
		"currentText": "Now"
	},
	"date": {
		"closeText": "Done",
		"clear": "Clear",
		"prevText": "Prev",
		"nextText": "Next",
		"currentText": "Today",
		"monthNames": [
			"January",
			"February",
			"March",
			"April",
			"May",
			"June",
			"July",
			"August",
			"September",
			"October",
			"November",
			"December"
		],
		"monthNamesShort": [
			"Jan",
			"Feb",
			"Mar",
			"Apr",
			"May",
			"Jun",
			"Jul",
			"Aug",
			"Sep",
			"Oct",
			"Nov",
			"Dec"
		],
		"dayNames": [
			"Sunday",
			"Monday",
			"Tuesday",
			"Wednesday",
			"Thursday",
			"Friday",
			"Saturday"
		],
		"dayNamesShort": [
			"Sun",
			"Mon",
			"Tue",
			"Wed",
			"Thu",
			"Fri",
			"Sat"
		],
		"dayNamesMin": [
			"Su",
			"Mo",
			"Tu",
			"We",
			"Th",
			"Fr",
			"Sa"
		],
		"weekHeader": "Wk",
		"firstDay": 1,
		"isRTL": false,
		"showMonthAfterYear": false,
		"yearSuffix": ""
	}
};

;webshims.validityMessages['no'] = {
	"typeMismatch": {
		"defaultMessage": "Vennligst skriv en gyldig verdi.",
		"email": "Vennligst skriv inn en e-postadresse.",
		"url": "Vennligst skriv inn en URL."
	},
	"badInput": {
		"defaultMessage": "Vennligst skriv en gyldig verdi.",
		"number": "Vennligst skriv inn et tall.",
		"date": "Vennligst skriv inn en dato.",
		"time": "Vennligst skriv inn et klokkeslett.",
		"range": "Ugyldig data.",
		"month": "Vennligst skriv en gyldig verdi.",
		"datetime-local": "Vennligst skriv inn dato & tid"
	},
	"rangeUnderflow": {
		"defaultMessage": "Verdi må være større eller lik {%min}.",
		"date": "Verdi må være på eller etter {%min}.",
		"time": "Verdi må være på eller etter {%min}.",
		"datetime-local": "Verdi må være på eller etter {%min}.",
		"month": "Verdi må være på eller etter {%min}."
	},
	"rangeOverflow": {
		"defaultMessage": "Verdi må være mindre eller lik {%max}.",
		"date": "Verdi må være på eller før {%max}.",
		"time": "Verdi må være på eller før {%max}.",
		"datetime-local": "Verdi må være på eller før {%max}.",
		"month": "Verdi må være på eller før {%max}."
	},
	"stepMismatch": "Ugyldig inndata.",
	"tooLong": "Vennligst fyll inn maks {%maxlength} tegn. Du skrev inn {%valueLen}.",
	"tooShort": "Vennlist fyll inn minst {%minlength} tegn. Du skrev inn {%valueLen}.",
	"patternMismatch": "Ugyldig data. {%title}",
	"valueMissing": {
		"defaultMessage": "Vennligst fyll inn dette feltet.",
		"checkbox": "Vennligst kryss av i denne boksen om du ønsker å fortsette.",
		"select": "Vennligst velg.",
		"radio": "Vennligst velg."
	}
};
webshims.formcfg['no'] = {
	"numberFormat": {
		".": ".",
		",": ","
	},
	"numberSigns": ".",
	"dateSigns": "/",
	"timeSigns": ":. ",
	"dFormat": "/",
	"patterns": {
		"d": "dd/mm/yy"
	},
	"meridian": [
		"AM",
		"PM"
	],
	"month": {
		"currentText": "Denne måned"
	},
	"time": {
		"currentText": "Nå"
	},
	"date": {
		"closeText": "Ferdig",
		"clear": "Tøm",
		"prevText": "Forrige",
		"nextText": "Neste",
		"currentText": "I dag",
		"monthNames": [
			"Januar",
			"Februar",
			"Mars",
			"April",
			"Mai",
			"Juni",
			"Juli",
			"August",
			"September",
			"Oktober",
			"November",
			"Desember"
		],
		"monthNamesShort": [
			"Jan",
			"Feb",
			"Mar",
			"Apr",
			"Mai",
			"Jun",
			"Jul",
			"Aug",
			"Sep",
			"Okt",
			"Nov",
			"Des"
		],
		"dayNames": [
			"Søndag",
			"Mandag",
			"Tirsdag",
			"Onsdag",
			"Torsdag",
			"Fredag",
			"Lørdag"
		],
		"dayNamesShort": [
			"Søn",
			"Man",
			"Tir",
			"Ons",
			"Tor",
			"Fre",
			"Lør"
		],
		"dayNamesMin": [
			"Sø",
			"Ma",
			"Ti",
			"On",
			"To",
			"Fr",
			"Lø"
		],
		"weekHeader": "Uke",
		"firstDay": 1,
		"isRTL": false,
		"showMonthAfterYear": false,
		"yearSuffix": ""
	}
};
