chrome.app.runtime.onLaunched.addListener(function() {
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
});

