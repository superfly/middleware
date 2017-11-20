let mw = requireMiddleware("https-upgrader.js")

describe("HTTP Upgrader", ()=>{
  it("redirects to https when http", ()=>{
    let res = mw.run(new Request("http://hello"), new Response());
    res.should.be.an.instanceOf(Response);
    res.headers.get("location").should.equal("https://hello/");
  })
  it("does not redirect when https", ()=>{
    let res = mw.run(new Request("https://hello"), new Response());
    res.should.be.an.instanceOf(Response);
    res.headers.get("location").should.equal("");
  })
})