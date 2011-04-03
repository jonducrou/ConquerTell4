var conquertell4_game_state = {
  
  //this sucks - currently forces a 30 second wait for an update, need to add a mutex manually?
  observe: function(aSubject, aTopic, aData){
    if(aTopic != "nsPref:changed") return;
    //this.update();
  },

  update: function() {
    var username = conquertell4.prefs.getCharPref("username").toLowerCase();
    var req = new XMLHttpRequest();
	  req.onreadystatechange = function () {
      conquertell4_game_state.process_data(req);
    };

	  var url = "http://www.conquerclub.com/rss.php?username=" + username;
	  req.open('GET', url, true); 
	  req.send(null);

  },

  process_data: function(req) {
    dataset = [];
    var best_game_state = 'UNKNOWN';
    var best_game_wait = '99-99-99';
    var count = 0;
    var active_count = 0;

    if (req.readyState == 4 && req.status == 200) {
      dom = req.responseXML;
      var items = dom.getElementsByTagName("item");
		  for (var i = 0; i < items.length; i++){
        var gameobj = {};
        gameobj.title_text = items.item(i).getElementsByTagName("title").item(0).firstChild.nodeValue;
        gameobj.link = items.item(i).getElementsByTagName("link").item(0).firstChild.nodeValue;
        dataset.push(gameobj);

        gameobj.game_number = gameobj.title_text.split(" ")[1];
        gameobj.game_state = gameobj.title_text.split(" ")[5];
        gameobj.game_wait = gameobj.title_text.split(" ")[6].substring(1);

        if (gameobj.game_state == 'missing') {
          gameobj.game_state = 'UNKNOWN';
        }


        if (gameobj.game_wait < best_game_wait) {
          best_game_wait = gameobj.game_wait;
        }
        if (gameobj.game_state == 'READY' || best_game_state == 'PLAYING') {
          active_count += 1;
        }
        count += 1;

        if (best_game_state == 'UNKNOWN') {
          best_game_state = gameobj.game_state;
        } else if (gameobj.game_state == 'PLAYING') {
          best_game_state = gameobj.game_state;
        } else if (gameobj.game_state == 'READY' && best_game_state != 'PLAYING') {
          best_game_state = gameobj.game_state;
        } else if (gameobj.game_state == 'WAITING' && best_game_state != 'PLAYING' && best_game_state != 'READY') {
          best_game_state = gameobj.game_state;
        }
      }


    this.container = document.getElementById("conquertell4-toolbar-button");
    this.container.setAttribute("class", "conquertell4-" + best_game_state);
    this.container.tooltipText = active_count + " / " + count;

    var mp = document.createElement("menupopup");

    var only_ready = conquertell4.prefs.getBoolPref("only_ready");

    var added = 0;
    for (var j = 0; j < dataset.length; j++) { 
      var game_obj = dataset[j];
      if (only_ready && game_obj.game_state != 'READY' && game_obj.game_state != 'PLAYING' ) {
        continue;
      }
      added += 1;
      var x = document.createElement("menuitem");
      x.link = game_obj.link;
      x.setAttribute("label", game_obj.title_text);
      x.setAttribute("class", "menuitem-iconic conquertell4-" + game_obj.game_state);
      x.addEventListener("click", function(y){openUILinkIn(y.target.link, "tab")}, false);
      mp.appendChild(x);      
    }
    if (only_ready && added == 0) {
      // show something rather than nothing
      var x = document.createElement("menuitem");
      x.setAttribute("label", conquertell4.strings.getString("NoReadyGames"));
      x.setAttribute("class", "menuitem-iconic conquertell4-WAITING" );
      mp.appendChild(x);
    }
    if (dataset.length == 0) {
      var x = document.createElement("menuitem");
      x.setAttribute("label", conquertell4.strings.getString("FailureLoading"));
      x.setAttribute("class", "menuitem-iconic conquertell4-UNKNOWN");
      mp.appendChild(x);      
    }
    var sep = document.createElement("menuseparator");
    mp.appendChild(sep);
    var pref_dialog = document.createElement("menuitem");
    pref_dialog.setAttribute("label", conquertell4.strings.getString("Preferences"));
    pref_dialog.addEventListener("click", function() {window.openDialog("chrome://conquertell4/content/options.xul", "ConquerTell", "chrome,centerscreen");},false);
    mp.appendChild(pref_dialog);

    while (this.container.firstChild) { this.container.removeChild(this.container.firstChild); }
    this.container.appendChild(mp);    
    } 
  }

};

  

var conquertell4 = {
  prefs: null,
  onLoad: function() {
    // initialization code
    this.initialized = true;
    this.strings = document.getElementById("conquertell4-strings");

    this.prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions.conquertell4.");
    this.prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
    this.prefs.addObserver("", conquertell4_game_state, false);


    setInterval("conquertell4_game_state.update()",30000);


    if (true) { //removed first run detection by popular demand (this is where it would go)
      var myId    = "conquertell4-toolbar-button"; // ID of button to add
      var afterId = "urlbar-container";    // ID of element to insert after
      var navBar  = document.getElementById("nav-bar");
      navBar.currentSet += "," + myId;
      try { BrowserToolboxCustomizeDone(true); } catch (e) {}
    }

    setTimeout("conquertell4_game_state.update()", 1000);

  },
  onMenuItemCommand: function(e) {
    //do nothing
  },
  onToolbarButtonCommand: function(e) {
    conquertell4.onMenuItemCommand(e);
  }
};

window.addEventListener("load", function () { conquertell4.onLoad(); }, false);
