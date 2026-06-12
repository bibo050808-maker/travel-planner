// Auto version check - bypass CDN cache on new deployment
(function() {
  var STORAGE_KEY = 'app_version';
  fetch('./version.json?t=' + Date.now())
    .then(function(r) { return r.json(); })
    .then(function(v) {
      var stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== v.version) {
        localStorage.setItem(STORAGE_KEY, v.version);
        if (stored) {
          // Version changed - force fresh load bypassing CDN
          var url = location.href.split('?')[0] + '?v=' + v.version;
          location.replace(url);
        }
      }
    })
    .catch(function() { /* version check failed - continue */ });
})();
