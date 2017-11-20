let mw = requireMiddleware("google-analytics.js")

describe("Google Analytics", ()=>{
  it("embed ga html snippet", async ()=>{
    let res = mw.run(
      new Request("http://hello", {
        headers: {
          "user-agent": "hello"
        }
      }),
      new Response("<html><body></body></html>", {
        headers: {
          "content-type": "text/html"
        }
      }),
      { tracking_id: "blah" }
    );
    res.should.be.an.instanceOf(Response)
    let body = await res.text()
    body.should.containEql("<html><body><!-- Google Analytics --><script>")
    body.should.containEql("ga(\'create\', \'blah\'");
    body.should.containEql("</body></html>");

    withCassette("cassettes/ga", function(cb){
      mw.fireResponseEnd();
      cb()
    })
  })
})