const gaCollectURL = "http://www.google-analytics.com/collect",
  utmRegexp = /^utm/,
  gaURLParams = {
    utm_source: "cs",
    utm_name: "cn",
    utm_medium: "cm",
    utm_term: "ck",
    utm_content: "cc",
    utm_id: "ci",
    gclid: "gclid",
    dclid: "dclid"
  },
  ignoreCookie = /(__utm.|utmctr|utmcmd.|utmccn.|_ga|_gat|_gid|has_js|__gads)/,
  ignoreQueryParam = /[&?](utm_(campaign|content|medium|source|term)|gclid|cx|ie|cof|siteurl|zanpid|origin)=([A-z0-9_\\-\\.%25]+)/;

module.exports = function(req, next) {
  const trackingID = this.getSetting("tracking_id");
  if (!trackingID) {
    return next(req);
  }

  let sess = this.session;

  const userID = sess.userID,
    clientID = sess.clientID;

  // TODO
  let cache = this.cache;
  cache.ignoreCookie(ignoreCookie);
  cache.ignoreQueryParam(ignoreQueryParam);

  const fullURL = req.url; // original url

  this.addEventListener(
    "responseEnd",
    responseEnd(fullURL, trackingID, clientID, userID)
  );

  const res = next(req);

  if (res.isHTML)
    this.addEventListener(
      "responseChunk",
      responseChunk(trackingID, clientID, userID)
    );

  return res;
};

const bodyEndTagRegex = /(<\/body>)/;

function responseChunk(trackingID, clientID, userID) {
  return function(event) {
    let chunk = event.chunk;

    if (bodyEndTagRegex.test(chunk)) {
      event.rewrite(
        chunk.replace("</body>", `${gaJS(trackingID, clientID, userID)}</body>`)
      );
    }
  };
}

function responseEnd(fullURL, trackingID, clientID, userID) {
  return async function(event) {
    const req = event.request,
      res = event.response,
      err = event.error,
      success = res.ok,
      ua = req.headers.get("user-agent"),
      remoteAddr = req.remoteAddr.split(":")[0];

    if (ua == "") return;

    let lang = req.headers.get("accept-language");
    if (lang != "") lang = lang.toLowerCase().split(",")[0];

    let form = new FormData();

    form.set("v", 1);
    form.set("t", "pageview");
    form.set("tid", trackingID);
    form.set("cid", clientID);
    form.set("uip", remoteAddr);
    form.set("ul", lang);
    form.set("dr", req.referrer);
    form.set("dl", fullURL);
    form.set("ds", "fly.io");
    form.set("ua", ua);

    if (userID != "") form.set("uid", userID);

    if (!success) {
      form.set("t", "exception");
      form.set("exd", res.status);
    }

    const u = new URL(fullURL);

    const sp = u.searchParams;
    for (let k of sp.keys()) {
      console.log("sp key:", k);
      const gaName = gaURLParams[k];
      if (gaName) {
        form.set(gaName, sp.get(k));
      }
    }

    const gaRes = await fetch(gaCollectURL, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded"
      },
      body: form
    });
  };
}

function gaJS(trackingID, clientID, userID) {
  return `<!-- Google Analytics --><script>
    (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
    (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
    m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
    })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');
    ga('create', '${trackingID}', 'auto', {"clientID":"${clientID}","userID":"${userID}"}
    </script><!-- End Google Analytics -->`;
}
