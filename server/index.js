import express from "express";
import { randomBytes } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
const port = Number(process.env.PORT) || 3001;
const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
try { process.loadEnvFile(path.resolve(currentDirectory, "../.env")); } catch (error) { if (error.code !== "ENOENT") throw error; }
const authApiBaseUrl = "https://react-api.dev2life.workers.dev/api/v1";
const sessionCookieName = "series_finder_session";
const sessions = new Map();
const sessionLifetimeMs = 24 * 60 * 60 * 1000;
app.use(express.json({ limit: "20kb" }));

function getSessionToken(request) {
  const cookie = request.headers.cookie?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${sessionCookieName}=`));
  return cookie ? cookie.slice(sessionCookieName.length + 1) : "";
}

function setSessionCookie(response, token) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  response.setHeader("Set-Cookie", `${sessionCookieName}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${sessionLifetimeMs / 1000}${secure}`);
}

function createSession(response, user) {
  const token = randomBytes(32).toString("hex");
  sessions.set(token, { user, expiresAt: Date.now() + sessionLifetimeMs });
  setSessionCookie(response, token);
}

function getSession(request) {
  const token = getSessionToken(request);
  const session = sessions.get(token);
  if (!session || session.expiresAt <= Date.now()) {
    if (token) sessions.delete(token);
    return null;
  }
  return { token, ...session };
}

async function requireSession(request, response, next) {
  const token = request.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return response.status(401).json({ success: false, error: { code: "TOKEN_MISSING", message: "กรุณาเข้าสู่ระบบ" } });
  try {
    const authResponse = await fetch(`${authApiBaseUrl}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
    if (!authResponse.ok) return response.status(authResponse.status).json(await authResponse.json().catch(() => ({ success: false, error: { code: "TOKEN_INVALID", message: "กรุณาเข้าสู่ระบบอีกครั้ง" } })));
    request.authUser = (await authResponse.json()).data;
    return next();
  } catch (error) {
    console.error("Could not verify API access token:", error);
    return response.status(502).json({ success: false, error: { code: "AUTH_API_UNAVAILABLE", message: "ไม่สามารถตรวจสอบสิทธิ์ได้ในขณะนี้" } });
  }
}

function supabaseReady(response) {
  if (supabaseUrl && supabaseAnonKey) return true;
  response.status(503).json({ error: "ตั้งค่า Supabase ก่อนใช้งาน: ใส่ SUPABASE_URL และ SUPABASE_PUBLISHABLE_KEY (หรือ SUPABASE_ANON_KEY) ในไฟล์ .env แล้วรีสตาร์ตเซิร์ฟเวอร์" });
  return false;
}

async function supabaseAuth(endpoint, payload) {
  const authResponse = await fetch(`${supabaseUrl}/auth/v1/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: supabaseAnonKey },
    body: JSON.stringify(payload),
  });
  return { authResponse, result: await authResponse.json().catch(() => ({})) };
}

function userFromSupabase(user) {
  const metadata = user.user_metadata || {};
  return { id: user.id, email: user.email, profile: {
    firstName: metadata.first_name, lastName: metadata.last_name,
    gender: metadata.gender, birthday: metadata.birthday, genres: metadata.genres || [],
  } };
}

// The browser uses the course auth API directly; legacy same-origin auth routes are disabled.
app.post("/api/auth/register", (_request, response) => response.status(410).json({ error: "Use the configured external auth API." }));
app.post("/api/auth/login", (_request, response) => response.status(410).json({ error: "Use the configured external auth API." }));
app.get("/api/auth/session", (_request, response) => response.status(410).json({ error: "Use the configured external auth API." }));
app.post("/api/auth/logout", (_request, response) => response.status(410).json({ error: "Use the configured external auth API." }));

app.post("/api/auth/register", async (request, response) => {
  if (!supabaseReady(response)) return;
  const email = typeof request.body.email === "string" ? request.body.email.trim().toLowerCase() : "";
  const password = request.body.password;
  const profile = request.body.profile && typeof request.body.profile === "object" ? request.body.profile : {};
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return response.status(400).json({ error: "Please enter a valid email address." });
  if (typeof password !== "string" || password.length < 8 || !/[!@#$%^&*(),.?":{}|<>_+=\\[\]~-]/.test(password)) return response.status(400).json({ error: "Password must be at least 8 characters and include a special character." });
  if (!profile.firstName || profile.firstName.trim().length < 2 || !profile.lastName || profile.lastName.trim().length < 2 || !["male", "female", "other"].includes(profile.gender) || !/^\d{4}-\d{2}-\d{2}$/.test(profile.birthday || "") || profile.birthday >= new Date().toISOString().slice(0, 10)) return response.status(400).json({ error: "Please check your name, gender, and date of birth." });
  try {
    const { authResponse, result } = await supabaseAuth("signup", { email, password, data: { first_name: profile.firstName.trim(), last_name: profile.lastName.trim(), gender: profile.gender, birthday: profile.birthday, genres: profile.genres || [] } });
    if (!authResponse.ok) return response.status(authResponse.status === 422 ? 409 : authResponse.status).json({ error: result.msg || result.message || result.error_description || "Could not create the account." });
    if (!result.session || !result.user) return response.status(202).json({ confirmationRequired: true, email });
    const user = userFromSupabase(result.user);
    createSession(response, user);
    return response.status(201).json(user);
  } catch (error) {
    console.error("Account registration failed:", error);
    return response.status(500).json({ error: "Could not create the account. Please try again." });
  }
});

app.post("/api/auth/register", async (request, response) => {
  return response.status(410).json({ error: "This legacy registration route is disabled." });
  const username = typeof request.body.username === "string" ? request.body.username.trim().toLowerCase() : "";
  const password = request.body.password;
  if (!/^[a-z0-9_.-]{3,24}$/.test(username)) return response.status(400).json({ error: "Username must be 3–24 characters using letters, numbers, dot, dash, or underscore." });
  if (!validPassword(password)) return response.status(400).json({ error: "Password must be at least 8 characters and include a special character." });

  try {
    const users = await readUsers();
    if (users.some((user) => user.username === username)) return response.status(409).json({ error: "That username is already registered." });
    const salt = randomBytes(16).toString("hex");
    const passwordHash = (await scrypt(password, salt, 64)).toString("hex");
    const profile = request.body.profile && typeof request.body.profile === "object" ? request.body.profile : {};
    users.push({ username, salt, passwordHash, profile });
    await mkdir(path.dirname(usersFile), { recursive: true });
    await writeFile(usersFile, JSON.stringify(users, null, 2), { encoding: "utf8", mode: 0o600 });
    const user = { username, profile };
    createSession(response, user);
    return response.status(201).json(user);
  } catch (error) {
    console.error("Account registration failed:", error);
    return response.status(500).json({ error: "Could not create the account. Please try again." });
  }
});

app.post("/api/auth/login", async (request, response) => {
  if (!supabaseReady(response)) return;
  const email = typeof request.body.email === "string" ? request.body.email.trim().toLowerCase() : "";
  const password = typeof request.body.password === "string" ? request.body.password : "";
  try {
    const { authResponse, result } = await supabaseAuth("token?grant_type=password", { email, password });
    if (!authResponse.ok || !result.user) return response.status(401).json({ error: "Email or password is incorrect." });
    const user = userFromSupabase(result.user);
    createSession(response, user);
    return response.json(user);
  } catch (error) {
    console.error("Login failed:", error);
    return response.status(500).json({ error: "Could not sign in. Please try again." });
  }
});

app.post("/api/auth/login", async (request, response) => {
  return response.status(410).json({ error: "This legacy login route is disabled." });
  const username = typeof request.body.username === "string" ? request.body.username.trim().toLowerCase() : "";
  const password = typeof request.body.password === "string" ? request.body.password : "";
  try {
    const user = (await readUsers()).find((account) => account.username === username);
    if (!user || !password) return response.status(401).json({ error: "Username or password is incorrect." });
    const attemptedHash = await scrypt(password, user.salt, 64);
    const savedHash = Buffer.from(user.passwordHash, "hex");
    if (attemptedHash.length !== savedHash.length || !timingSafeEqual(attemptedHash, savedHash)) {
      return response.status(401).json({ error: "Username or password is incorrect." });
    }
    const authenticatedUser = { username: user.username, profile: user.profile };
    createSession(response, authenticatedUser);
    return response.json(authenticatedUser);
  } catch (error) {
    console.error("Login failed:", error);
    return response.status(500).json({ error: "Could not sign in. Please try again." });
  }
});

app.get("/api/auth/session", (request, response) => {
  const session = getSession(request);
  if (!session) return response.status(401).json({ error: "Not signed in." });
  return response.json(session.user);
});

app.get("/api/auth/session", (request, response) => {
  return response.status(410).json({ error: "This legacy session route is disabled." });
});

app.post("/api/auth/logout", (request, response) => {
  const token = getSessionToken(request);
  if (token) sessions.delete(token);
  response.setHeader("Set-Cookie", `${sessionCookieName}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${process.env.NODE_ENV === "production" ? "; Secure" : ""}`);
  return response.status(204).end();
});

app.get("/api/shows/preview", async (request, response) => {
  const requestedPage = Number(request.query.page ?? 0);
  if (!Number.isInteger(requestedPage) || requestedPage < 0) {
    return response.status(400).json({ error: "Page must be a non-negative integer" });
  }
  try {
    const showsUrl = new URL("https://api.tvmaze.com/shows");
    showsUrl.searchParams.set("page", String(requestedPage));
    const apiResponse = await fetch(showsUrl);
    if (apiResponse.status === 404) return response.json([]);
    if (!apiResponse.ok) return response.status(502).json({ error: "Unable to load series previews right now." });
    const shows = await apiResponse.json();
    if (!Array.isArray(shows)) return response.status(502).json({ error: "TVmaze returned invalid series data" });
    return response.json(shows.map((show) => ({
      id: show.id,
      name: show.name,
      image: show.image ? { medium: show.image.medium, original: show.image.original } : null,
      genres: show.genres || [],
      premiered: show.premiered,
      ended: show.ended,
      rating: show.rating ? { average: show.rating.average } : null,
      language: show.language,
      status: show.status,
      type: show.type,
    })));
  } catch (error) {
    console.error("TVmaze series previews failed:", error);
    return response.status(502).json({ error: "Could not load series previews. Please try again." });
  }
});

app.get("/api/shows", requireSession, async (request, response) => {
  const requestedPage = Number(request.query.page ?? 0);
  if (!Number.isInteger(requestedPage) || requestedPage < 0) {
    return response.status(400).json({ error: "Page must be a non-negative integer" });
  }

  try {
    const showsUrl = new URL("https://api.tvmaze.com/shows");
    showsUrl.searchParams.set("page", String(requestedPage));

    const apiResponse = await fetch(showsUrl);
    if (apiResponse.status === 404) {
      return response.json([]);
    }
    if (!apiResponse.ok) {
      return response.status(502).json({
        error: `Unable to load series right now (TVmaze responded with ${apiResponse.status})`,
      });
    }

    const shows = await apiResponse.json();
    if (!Array.isArray(shows)) {
      return response.status(502).json({ error: "TVmaze returned invalid series data" });
    }
    return response.json(shows);
  } catch (error) {
    console.error("TVmaze series list failed:", error);
    return response.status(502).json({
      error: "Could not connect to the series catalog. Please try again.",
    });
  }
});

app.get("/api/shows/search", requireSession, async (request, response) => {
  const query = typeof request.query.q === "string" ? request.query.q.trim() : "";

  if (!query) {
    return response.status(400).json({ error: "กรุณาระบุชื่อซีรีส์ที่ต้องการค้นหา" });
  }

  try {
    const searchUrl = new URL("https://api.tvmaze.com/search/shows");
    searchUrl.searchParams.set("q", query);

    const apiResponse = await fetch(searchUrl);
    if (!apiResponse.ok) {
      return response.status(502).json({
        error: `ไม่สามารถค้นหาซีรีส์ได้ในขณะนี้ (TVmaze ตอบกลับ ${apiResponse.status})`,
      });
    }

    const shows = await apiResponse.json();
    return response.json(shows);
  } catch (error) {
    console.error("TVmaze search failed:", error);
    return response.status(502).json({
      error: "เชื่อมต่อบริการค้นหาซีรีส์ไม่ได้ กรุณาลองอีกครั้ง",
    });
  }
});

if (process.env.NODE_ENV === "production") {
  const staticDirectory = path.resolve(currentDirectory, "../dist");
  app.use(express.static(staticDirectory));
  app.get("*", (_request, response) => {
    response.sendFile(path.join(staticDirectory, "index.html"));
  });
}

app.listen(port, () => {
  console.log(`Series Finder API is running at http://localhost:${port}`);
});
