conquertell4.onFirefoxLoad = function(event) {
  document.getElementById("contentAreaContextMenu")
          .addEventListener("popupshowing", function (e){ conquertell4.showFirefoxContextMenu(e); }, false);
};

conquertell4.showFirefoxContextMenu = function(event) {
  document.getElementById("context-conquertell4").hidden = gContextMenu.onImage;
};

window.addEventListener("load", function () { conquertell4.onFirefoxLoad(); }, false);
