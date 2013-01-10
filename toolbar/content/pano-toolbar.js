
var toolbarXML = null;

function PanoToolbar(win) {
  this.window = win;
  this.xmlStyleSheet = null;
  this.init();
}
PanoToolbar.prototype = {
  constructor: PanoToolbar,
  init: function PT_init () {
    var doc = this.window.document;

    try {
    this.xmlStyleSheet = doc.createProcessingInstruction("xml-stylesheet", 'href="chrome://pano-toolbar/skin/pano-toolbar.css" type="text/css"');
    doc.insertBefore(this.xmlStyleSheet, doc.firstChild);
    } catch(e) {
      Cu.reportError(e);
    }

    var gNaviToolbox = doc.getElementById("navigator-toolbox");
    var range = doc.createRange();
    range.selectNodeContents(gNaviToolbox);
    range.collapse(false);
    var toolbar = range.createContextualFragment(toolbarXML);
    range.insertNode(toolbar);
    range.detach();
  },
  uninit: function PT_uninit () {
    var doc = this.window.document;
    var toolbar = doc.getElementById("PanoTabGroupToolbar");
    if (toolbar) {
      toolbar.parentNode.removeChild(toolbar);
    }

    doc.removeChild(this.xmlStyleSheet);
  },
};

function initWindow (aWindow) {
  aWindow.gPanoToolbar = new PanoToolbar(aWindow);
}

var windowObserver = {
  observe: function observeWindow (aSubject, aTopic, aData) {
    var win = aSubject.QueryInterface(Ci.nsIDOMWindow);
    if (aTopic === "domwindowopened") {
      //win.addEventListener("DOMContentLoaded", function PT_onDOMContentLoaded (aEvent) {
      win.addEventListener("load", function PT_onDOMContentLoaded (aEvent) {
        win.removeEventListener(aEvent.type, PT_onDOMContentLoaded, false);
        if (win.location.href === "chrome://browser/content/browser.xul")
          initWindow(win);
      }, false);
    }
  },
  QueryInterface: function (aIID) {
    if (aIID.equals(Ci.nsISupports) ||
        aIID.equals(Ci.nsIObserver))
      return this;

    throw Cr.NS_ERROR_NO_INTERFACE;
  }
};

function getWindows (type) {
  if (!type)
    type = "navigator:browser";

  var windows = Services.wm.getEnumerator(type);
  while (windows.hasMoreElements()) {
    yield windows.getNext().QueryInterface(Ci.nsIDOMWindow);
  }
}

(function init () {
  var bundle = Services.strings.createBundle("chrome://pano-toolbar/locale/toolbar.properties")

  toolbarXML =
  '<toolbar id="PanoTabGroupToolbar" class="toolbar-primary chromeclass-toolbar" ' +
            'toolbarname="' + bundle.GetStringFromName("toolbarname") + '" ' +
            'mode="icons" defaulticonsize="small" defaultset="" costomizable="true" context="toolbar-context-menu" ' +
            'xmlns="http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul">' +
    '<tabs id="PanoTabGroupTabs" flex="1" setfocus="false"><tab class="pano-tabgroup-tab"/></tabs>' +
    '<toolbarbutton id="PanoToolbar_NewGroupButton" class="toolbarbutton-1 tabs-newtab-button" ' +
                   'oncommand="this.previousElementSibling.newGroup();" ' +
                   'tooltiptext="' + bundle.GetStringFromName("newGroup.tooltip") + '"/>' +
  '</toolbar>';

  for (let win in Iterator(getWindows())) {
    initWindow(win);
  }
  Services.ww.registerNotification(windowObserver);

  Services.console.logStringMessage("Pano Toolbar startup");
})();


function destroy () {
  Services.ww.unregisterNotification(windowObserver);

  for (let win in Iterator(getWindows())) {
    if (win.gPanoToolbar) {
      win.gPanoToolbar.uninit();
      delete win.gPanoToolbar;
    }
  }
  Services.console.logStringMessage("Pano Toolbar shutdown");
}


