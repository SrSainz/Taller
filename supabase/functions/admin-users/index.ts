import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});

const normalizeEmail = (value: unknown) => String(value ?? "").trim().toLowerCase();
const normalizeName = (value: unknown) => String(value ?? "").trim().replace(/\s+/g, " ");
const validTemporaryPassword = (value: unknown) => {
  const password = String(value ?? "");
  return password.length >= 8 && password.length <= 128;
};
const professionalVehicles = new Set(["5043 MLC", "5750 MJV", "5754 MJV"]);

const authenticateAdmin = async (request: Request) => {
  const authorization = request.headers.get("Authorization");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const publishableKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!authorization || !supabaseUrl || !publishableKey || !serviceRoleKey) {
    return { error: json({ error: "La administración no está configurada en el servidor." }, 500) };
  }

  const viewer = createClient(supabaseUrl, publishableKey, { global: { headers: { Authorization: authorization } } });
  const { data: { user }, error: userError } = await viewer.auth.getUser();
  if (userError || !user || user.app_metadata?.role !== "admin") {
    return { error: json({ error: "Solo un administrador puede gestionar estas cuentas." }, 403) };
  }

  return { admin: createClient(supabaseUrl, serviceRoleKey), user };
};

const profileFields = "id, full_name, role, email, vehicle_plate, active, must_change_password, created_at, updated_at";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Método no permitido." }, 405);

  const auth = await authenticateAdmin(request);
  if (auth.error) return auth.error;

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "La petición no contiene un JSON válido." }, 400);
  }

  const action = String(payload.action ?? "list");
  if (action === "list") {
    const { data, error } = await auth.admin.from("profiles").select(profileFields).eq("role", "driver").order("full_name");
    if (error) return json({ error: error.message }, 400);
    return json({ profiles: data ?? [] });
  }

  if (action === "create") {
    const email = normalizeEmail(payload.email);
    const fullName = normalizeName(payload.fullName);
    const vehiclePlate = normalizeName(payload.vehiclePlate) || null;
    const temporaryPassword = String(payload.temporaryPassword ?? "");
    if (!email || !email.includes("@") || !fullName || !professionalVehicles.has(vehiclePlate ?? "") || !validTemporaryPassword(temporaryPassword)) {
      return json({ error: "Introduce nombre, email y una contraseña temporal de al menos 8 caracteres." }, 400);
    }
    const { count: vehicleCount, error: countError } = await auth.admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "driver")
      .eq("vehicle_plate", vehiclePlate);
    if (countError) return json({ error: countError.message }, 400);
    if ((vehicleCount ?? 0) >= 2) return json({ error: "Ese coche ya tiene dos conductores asignados." }, 400);
    const { data: created, error: createError } = await auth.admin.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: { full_name: fullName },
      app_metadata: { role: "driver" },
    });
    if (createError || !created.user) return json({ error: createError?.message ?? "No se ha podido crear la cuenta." }, 400);

    const { data: profile, error: profileError } = await auth.admin.from("profiles").insert({
      id: created.user.id,
      full_name: fullName,
      role: "driver",
      email,
      vehicle_plate: vehiclePlate,
      active: true,
      must_change_password: true,
    }).select(profileFields).single();
    if (profileError) {
      await auth.admin.auth.admin.deleteUser(created.user.id);
      return json({ error: profileError.message }, 400);
    }
    return json({ profile, temporaryPassword });
  }

  const userId = String(payload.userId ?? "");
  if (!userId) return json({ error: "Falta la cuenta que se quiere modificar." }, 400);

  if (action === "reset_password") {
    const temporaryPassword = String(payload.temporaryPassword ?? "");
    if (!validTemporaryPassword(temporaryPassword)) return json({ error: "La contraseña temporal debe tener al menos 8 caracteres." }, 400);
    const { error: authError } = await auth.admin.auth.admin.updateUserById(userId, { password: temporaryPassword, app_metadata: { role: "driver" } });
    if (authError) return json({ error: authError.message }, 400);
    const { data: profile, error } = await auth.admin.from("profiles").update({ must_change_password: true, active: true, updated_at: new Date().toISOString() }).eq("id", userId).select(profileFields).single();
    if (error) return json({ error: error.message }, 400);
    return json({ profile, temporaryPassword });
  }

  if (action === "update") {
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (payload.fullName !== undefined) updates.full_name = normalizeName(payload.fullName);
    if (payload.vehiclePlate !== undefined) {
      const nextVehicle = normalizeName(payload.vehiclePlate) || null;
      if (nextVehicle && !professionalVehicles.has(nextVehicle)) return json({ error: "Solo puedes asignar uno de los tres coches profesionales." }, 400);
      const { data: currentDriver, error: currentError } = await auth.admin.from("profiles").select("vehicle_plate").eq("id", userId).eq("role", "driver").single();
      if (currentError) return json({ error: currentError.message }, 400);
      if (nextVehicle && nextVehicle !== currentDriver.vehicle_plate) {
        const { count: vehicleCount, error: countError } = await auth.admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "driver").eq("vehicle_plate", nextVehicle).neq("id", userId);
        if (countError) return json({ error: countError.message }, 400);
        if ((vehicleCount ?? 0) >= 2) return json({ error: "Ese coche ya tiene dos conductores asignados." }, 400);
      }
      updates.vehicle_plate = nextVehicle;
    }
    if (payload.active !== undefined) updates.active = Boolean(payload.active);
    const { data: profile, error } = await auth.admin.from("profiles").update(updates).eq("id", userId).eq("role", "driver").select(profileFields).single();
    if (error) return json({ error: error.message }, 400);
    return json({ profile });
  }

  return json({ error: "Acción de administración no reconocida." }, 400);
});
