const httpProto = "http",
  wsProto = "ws",
  httpsProto = "https",
  wssProto = "wss";

const protoSwaps = {
  http: httpsProto,
  ws: wssProto
}

const redirectCode = 307

module.exports = function (req, next) {
  let splittedUrl = req.url.split(":")

  for (let proto in protoSwaps) {
    if (splittedUrl[0] == proto) {
      splittedUrl[0] = protoSwaps[proto];
      return Fly.redirect(splittedUrl.join(":"), redirectCode);
    }
  }

  return next(req);
};