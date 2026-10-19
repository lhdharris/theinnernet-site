/* Where each build of the app downloads from: the latest release of the
   public innernet-releases repository. A platform with no link yet shows
   as coming soon; add its link here when its build is out. */
(function () {
  var LATEST = 'https://github.com/lhdharris/innernet-releases/releases/latest/download/';
  var BUILDS = {
    linux: LATEST + 'Innernet-x86_64.AppImage',
    deb: LATEST + 'Innernet-amd64.deb',
    rpm: LATEST + 'Innernet-x86_64.rpm',
    windows: LATEST + 'Innernet-windows.zip',
    macos: LATEST + 'Innernet-macos.zip'
  };
  document.querySelectorAll('a[data-platform]').forEach(function (a) {
    var url = BUILDS[a.getAttribute('data-platform')];
    if (url) {
      a.href = url;
      a.classList.remove('soon');
      a.removeAttribute('aria-disabled');
    }
  });
})();
