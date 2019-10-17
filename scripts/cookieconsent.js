// no jquery

function popCookieNotice(){

  var content = "We use cookies to analyse site traffic to provide you a \
better experience. Click 𝗢𝗞 to allow cookies 😀 or click 𝗖𝗮𝗻𝗰𝗲𝗹 to \
continue without cookies 😢.";

  var result = confirm(content);
  if (result) {
    if (typeof(Storage) !== "undefined") {
      window.localStorage.setItem("cookieConsent", "1");
    }
    window['ga-disable-UA-148378003-1'] = false;  // Enable GA
  }
}

if (typeof(Storage) !== "undefined") {
    // Code for localStorage
    if (window.localStorage.getItem("cookieConsent")=="1") {
      window['ga-disable-UA-148378003-1'] = false;  // Enable GA
    } else {
      popCookieNotice();
    }
} else {
    // No web storage Support.
    popCookieNotice();
}
