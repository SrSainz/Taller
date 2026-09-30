import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store, max-age=0, must-revalidate" },
});

const normalizeEmail = (value: unknown) => String(value ?? "").trim().toLowerCase();
const normalizeName = (value: unknown) => String(value ?? "").trim().replace(/\s+/g, " ");
const validDriverPassword = (value: unknown) => {
  const password = String(value ?? "");
  return password.length >= 8 && password.length <= 128;
};
const madridDateKey = (date = new Date()) => new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Madrid",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(date);
const isCalendarDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
};
const previousCalendarDate = (value: string) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
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

const profileFields = "id, full_name, role, email, vehicle_plate, avatar_path, active, must_change_password, effective_from, effective_to, replaced_by, replaces_profile_id, created_at, updated_at";

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
    const password = String(payload.password ?? "");
    if (!email || !email.includes("@") || !fullName || !professionalVehicles.has(vehiclePlate ?? "") || !validDriverPassword(password)) {
      return json({ error: "Introduce nombre, email y una contraseña definitiva de al menos 8 caracteres." }, 400);
    }
    const { data: created, error: createError } = await auth.admin.auth.admin.createUser({
      email,
      password,
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
      must_change_password: false,
      effective_from: madridDateKey(),
    }).select(profileFields).single();
    if (profileError) {
      await auth.admin.auth.admin.deleteUser(created.user.id);
      return json({ error: profileError.message }, 400);
    }
    return json({ profile, password });
  }

  if (action === "replace") {
    const previousDriverId = String(payload.previousDriverId ?? "");
    const email = normalizeEmail(payload.email);
    const fullName = normalizeName(payload.fullName);
    const password = String(payload.password ?? "");
    const effectiveFrom = String(payload.effectiveFrom ?? "");
    if (!previousDriverId || !email || !email.includes("@") || !fullName || !validDriverPassword(password) || !isCalendarDate(effectiveFrom)) {
      return json({ error: "Revisa el nombre, el email, la fecha de inicio y la contraseña (mínimo 8 caracteres)." }, 400);
    }
    if (effectiveFrom !== madridDateKey()) return json({ error: "La sustitución entra en vigor hoy; conserva cada documento con su fecha y perfil original." }, 400);

    const { data: previousDriver, error: previousError } = await auth.admin.from("profiles")
      .select("id, role, vehicle_plate, active, effective_from, replaced_by")
      .eq("id", previousDriverId)
      .single();
    if (previousError || previousDriver?.role !== "driver" || !previousDriver.active || previousDriver.replaced_by) {
      return json({ error: "El perfil seleccionado ya no tiene un acceso activo para sustituir." }, 400);
    }
    const vehiclePlate = normalizeName(previousDriver.vehicle_plate);
    if (!professionalVehicles.has(vehiclePlate)) return json({ error: "El conductor no tiene asignado un coche profesional." }, 400);
    const lastActiveDate = previousCalendarDate(effectiveFrom);
    if (String(previousDriver.effective_from ?? "1900-01-01") > lastActiveDate) {
      return json({ error: "La fecha de sustitución debe ser posterior al inicio de vigencia del perfil actual." }, 400);
    }

    const { data: created, error: createError } = await auth.admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
      app_metadata: { role: "driver" },
    });
    if (createError || !created.user) return json({ error: createError?.message ?? "No se ha podido crear la cuenta nueva." }, 400);

    const { data: newProfile, error: profileError } = await auth.admin.from("profiles").insert({
      id: created.user.id,
      full_name: fullName,
      role: "driver",
      email,
      vehicle_plate: vehiclePlate,
      active: true,
      must_change_password: false,
      effective_from: effectiveFrom,
      replaces_profile_id: previousDriverId,
    }).select(profileFields).single();
    if (profileError) {
      await auth.admin.auth.admin.deleteUser(created.user.id);
      return json({ error: profileError.message }, 400);
    }

    const { data: closedProfile, error: closeError } = await auth.admin.from("profiles").update({
      active: false,
      effective_to: lastActiveDate,
      replaced_by: created.user.id,
      updated_at: new Date().toISOString(),
    }).eq("id", previousDriverId).eq("active", true).is("replaced_by", null).select(profileFields).maybeSingle();
    if (closeError || !closedProfile) {
      await auth.admin.auth.admin.deleteUser(created.user.id);
      return json({ error: closeError?.message ?? "El perfil anterior cambió mientras se guardaba; no se completó la sustitución." }, 409);
    }
    return json({ profile: newProfile, previousProfile: closedProfile, password });
  }

  const userId = String(payload.userId ?? "");
  if (!userId) return json({ error: "Falta la cuenta que se quiere modificar." }, 400);

  if (action === "reset_password") {
    const password = String(payload.password ?? "");
    if (!validDriverPassword(password)) return json({ error: "La contraseña definitiva debe tener al menos 8 caracteres." }, 400);
    const { error: authError } = await auth.admin.auth.admin.updateUserById(userId, { password, app_metadata: { role: "driver" } });
    if (authError) return json({ error: authError.message }, 400);
    const { data: profile, error } = await auth.admin.from("profiles").update({ must_change_password: false, active: true, updated_at: new Date().toISOString() }).eq("id", userId).select(profileFields).single();
    if (error) return json({ error: error.message }, 400);
    return json({ profile, password });
  }

  if (action === "update") {
    const { data: targetDriver, error: targetError } = await auth.admin.from("profiles").select("id, role, vehicle_plate").eq("id", userId).single();
    if (targetError || targetDriver?.role !== "driver") return json({ error: "Solo se pueden editar perfiles de conductores." }, 400);
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    const authUpdates: Record<string, unknown> = {};
    if (payload.fullName !== undefined) {
      const fullName = normalizeName(payload.fullName);
      if (!fullName) return json({ error: "El nombre completo no puede estar vacío." }, 400);
      updates.full_name = fullName;
      authUpdates.user_metadata = { full_name: fullName };
    }
    if (payload.email !== undefined) {
      const email = normalizeEmail(payload.email);
      if (!email || !email.includes("@")) return json({ error: "Introduce un email válido para el acceso." }, 400);
      updates.email = email;
      authUpdates.email = email;
      authUpdates.email_confirm = true;
    }
    if (payload.vehiclePlate !== undefined) {
      const nextVehicle = normalizeName(payload.vehiclePlate) || null;
      if (nextVehicle && !professionalVehicles.has(nextVehicle)) return json({ error: "Solo puedes asignar uno de los tres coches profesionales." }, 400);
      updates.vehicle_plate = nextVehicle;
    }
    if (payload.active !== undefined) updates.active = Boolean(payload.active);
    if (payload.avatarPath !== undefined) {
      const avatarPath = String(payload.avatarPath ?? "");
      const segments = avatarPath.split("/");
      if (segments.length !== 3 || segments[0] !== "profile-photos" || segments[1] !== userId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.webp$/i.test(segments[2])) {
        return json({ error: "La ruta de la foto de perfil no es válida." }, 400);
      }
      updates.avatar_path = avatarPath;
    }
    if (Object.keys(authUpdates).length > 0) {
      const { error: authError } = await auth.admin.auth.admin.updateUserById(userId, authUpdates);
      if (authError) return json({ error: authError.message }, 400);
    }
    const { data: profile, error } = await auth.admin.from("profiles").update(updates).eq("id", userId).eq("role", "driver").select(profileFields).single();
    if (error) return json({ error: error.message }, 400);
    return json({ profile });
  }

  return json({ error: "Acción de administración no reconocida." }, 400);
});
