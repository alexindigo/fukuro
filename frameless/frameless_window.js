var isCtrl = false;
var isMeta = false;

chrome.app.window.gameLocation = 'http://192.168.10.210:31337/satelite';

window.onload = function()
{
  // init
  document.getElementById("webview").src = chrome.app.window.gameLocation;
  document.getElementById("loc").value = chrome.app.window.gameLocation;

  document.getElementById("webview").onkeydown = function(e)
  {
    if (e.which == 17) isCtrl = true;
    if (e.which == 91) isMeta = true;

    // close window (W)
    if (e.which == 87 && (isCtrl || isMeta))
    {
      window.close();
    }

    // reload (R)
    if (e.which == 82 && (isCtrl || isMeta))
    {
      document.getElementById("webview").reload();
    }

    // location (L)
    if (e.which == 76 && (isCtrl || isMeta))
    {
      document.getElementById("control").style.display = 'block';
    }

    // new (N)
    if (e.which == 78 && (isCtrl || isMeta))
    {
      chrome.app.window.create("frameless_window.html",
          {  frame: "none",
             bounds: {
               width: 1100,
               height: 600,
               left: 100
             },
             minWidth: 800,
             minHeight: 600
          }
        );
    }
  }

  document.getElementById("loc").onchange = function()
  {
    chrome.app.window.gameLocation = document.getElementById("loc").value;
    document.getElementById("webview").src = document.getElementById("loc").value;
    document.getElementById("control").style.display = 'none';
  }

  document.getElementById("webview").onkeyup = function(e)
  {
    if (e.which == 17) isCtrl = false;
    if (e.which == 91) isMeta = false;
  }
}

window.onfocus = function() {
//  console.log("focus");
}

window.onblur = function() {
  document.getElementById("control").style.display = 'none';
}

window.onresize = function() {
//  updateContentStyle();
}
