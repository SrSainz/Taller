import test from "node:test";
import assert from "node:assert/strict";
import { requireActiveUser } from "../api/_require-active-user.js";

test("análisis privado rechaza ausencia de token sin invocar ningún proveedor", async () => {
  assert.equal((await requireActiveUser({headers:{}}, () => assert.fail("network"))).status,401);
});

test("análisis exige token verificado y perfil activo", async () => {
  const previousUrl = process.env.SUPABASE_URL;
  const previousKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  process.env.SUPABASE_URL = "https://auth.test";
  process.env.SUPABASE_PUBLISHABLE_KEY = "public-test";
  try {
    const request = {headers:{authorization:"Bearer test"}};
    assert.equal((await requireActiveUser(request, async () => new Response("",{status:401}))).status,401);
    const fetcher = active => async (url) => Response.json(url.endsWith("/user")?{id:"driver-test"}:[{active}]);
    assert.equal((await requireActiveUser(request, fetcher(false))).status,403);
    assert.equal((await requireActiveUser(request, fetcher(true))).userId,"driver-test");
    assert.equal((await requireActiveUser(request, async () => {throw Error("offline");})).status,503);
  } finally {
    if (previousUrl === undefined) delete process.env.SUPABASE_URL; else process.env.SUPABASE_URL=previousUrl;
    if (previousKey === undefined) delete process.env.SUPABASE_PUBLISHABLE_KEY; else process.env.SUPABASE_PUBLISHABLE_KEY=previousKey;
  }
});
