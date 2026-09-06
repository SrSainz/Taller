// Isolated browser QA: fake users and routed responses; never writes live data.
import assert from "node:assert/strict";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
const origin = process.env.AUDIT_ORIGIN || "http://127.0.0.1:5182";
const encode = value => Buffer.from(JSON.stringify(value)).toString("base64url");
try {
  for (const role of ["admin", "driver"]) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" });
    const page = await context.newPage();
    const errors = [];
    const requests = [];
    let realtimeJoins = 0;
    page.on("pageerror", error => errors.push(error.message));
    const user = { id: "11111111-1111-4111-8111-111111111111", email: "audit@example.test", app_metadata: { role }, user_metadata: {} };
    const profile = { ...user, full_name: "AUDITORÍA", role, active: true, vehicle_plate: "5043 MLC" };
    const session = { user, token_type: "bearer", expires_in: 3600, expires_at: Math.floor(Date.now()/1000)+3600,
      access_token: `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ sub:user.id, exp:Math.floor(Date.now()/1000)+3600, app_metadata:{role} })}.test`, refresh_token: "mock-only" };
    await page.route("**/*.supabase.co/**", route => {
      const url = new URL(route.request().url());
      requests.push(url.pathname);
      let body = [];
      if (url.pathname.includes("/auth/")) body = url.pathname.endsWith("/user") ? user : session;
      if (url.pathname.endsWith("/profiles")) body = route.request().headers().accept?.includes("object") ? profile : [profile];
      if (url.pathname.includes("/functions/v1/admin-users")) body = { profiles: [profile] };
      return route.fulfill({ status:200, contentType:"application/json", body:JSON.stringify(body) });
    });
    await page.routeWebSocket("**/*.supabase.co/**", ws => {
      ws.onMessage(message => {
        const wire = JSON.parse(message);
        const data = Array.isArray(wire) ? {joinRef:wire[0],ref:wire[1],topic:wire[2],event:wire[3],payload:wire[4]} : wire;
        const reply = payload => ws.send(JSON.stringify(Array.isArray(wire)
          ? [data.joinRef,data.ref,data.topic,"phx_reply",payload]
          : {topic:data.topic,event:"phx_reply",ref:data.ref,payload}));
        if (data.event === "phx_join") {
          realtimeJoins++;
          reply({status:"ok",response:{postgres_changes:(data.payload.config?.postgres_changes??[]).map((binding,id)=>({...binding,id}))}});
        }
        if (data.event === "heartbeat") reply({status:"ok",response:{}});
      });
    });
    await page.addInitScript(session => {
      localStorage.setItem("sb-mrureuqfzdxyfftghifc-auth-token", JSON.stringify(session));
      localStorage.setItem("sobre-ruedas:keep-signed-in", "true");
    }, session);
    await page.goto(origin);
    await page.waitForTimeout(1800);
    assert.equal(await page.locator("vite-error-overlay").count(),0);
    const text = await page.locator("body").innerText();
    assert.ok(!text.includes("Entra en tu espacio"), `mock session did not load: ${text}; requests=${JSON.stringify(requests)}; errors=${JSON.stringify(errors)}`);
    assert.ok(text.length > 100);
    assert.ok(realtimeJoins > 0, "Realtime was not tested");
    console.log(JSON.stringify({ role, initialRequests:requests.length, buttons:await page.getByRole("button").allTextContents() }));
    if (role === "admin") {
      for (const route of ["conductores","flota","mantenimiento","facturas","administracion","automatizaciones","ajustes","ayuda","informes"]) {
        await page.evaluate(route => { location.hash=`#/${route}`; }, route);
        await page.waitForTimeout(250);
        assert.ok((await page.locator("body").innerText()).length > 100, route);
      }
    } else {
      const before = realtimeJoins;
      await page.getByRole("button", { name: "Seleccionar mes", exact:true }).click();
      await page.getByRole("option", { name: "Agosto", exact:true }).click();
      await page.waitForTimeout(500);
      assert.equal(realtimeJoins, before, "changing calendar month reopened realtime");
    }
    await page.screenshot({ path:`tmp/audit-${role}-mobile.png` });
    const beforeIdle = requests.length;
    await page.waitForTimeout(32000);
    assert.equal(requests.length,beforeIdle,"unexpected idle polling");
    assert.deepEqual(errors,[]);
    console.log(JSON.stringify({ role, idleRequests:requests.length-beforeIdle, pageErrors:errors.length, totalRequests:requests.length, realtimeJoins }));
    await context.close();
  }
} finally { await browser.close(); }
