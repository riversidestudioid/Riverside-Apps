import { generateKeyPairSync, randomBytes, sign, verify } from "node:crypto";
import type { IncomingMessage } from "node:http";
import { admin, customer } from "./database";
export async function readJson(req: IncomingMessage) {
  let body = "";
  for await (const chunk of req) body += chunk;
  return JSON.parse(body || "{}") as Record<string, unknown>;
}
export function createTestAuth(origin: () => string) {
  const { privateKey, publicKey } = generateKeyPairSync("ec", {
    namedCurve: "prime256v1",
  });
  const kid = randomBytes(8).toString("hex");
  const jwk = {
    ...publicKey.export({ format: "jwk" }),
    kid,
    alg: "ES256",
    use: "sig",
  };
  const password = randomBytes(24).toString("base64url");
  const refresh = new Map<string, string>();
  const users = [
    { id: admin, email: "admin@test.invalid" },
    { id: customer, email: "customer@test.invalid" },
  ];
  const user = (id: string) => ({
    ...users.find((u) => u.id === id)!,
    aud: "authenticated",
    role: "authenticated",
    app_metadata: {},
    user_metadata: id === customer ? { role: "admin" } : {},
    created_at: new Date().toISOString(),
  });
  function issue(id: string, ttl = 3600) {
    const u = user(id);
    const payload = {
      sub: id,
      email: u.email,
      role: "authenticated",
      aud: "authenticated",
      iss: origin() + "/auth/v1",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + ttl,
      app_metadata: {},
      user_metadata: u.user_metadata,
    };
    const input =
      Buffer.from(JSON.stringify({ alg: "ES256", typ: "JWT", kid })).toString(
        "base64url",
      ) +
      "." +
      Buffer.from(JSON.stringify(payload)).toString("base64url");
    const access =
      input +
      "." +
      sign("sha256", Buffer.from(input), {
        key: privateKey,
        dsaEncoding: "ieee-p1363",
      }).toString("base64url");
    const token = randomBytes(24).toString("base64url");
    refresh.set(token, id);
    return {
      access_token: access,
      refresh_token: token,
      token_type: "bearer",
      expires_in: ttl,
      expires_at: payload.exp,
      user: u,
    };
  }
  function claims(token: string) {
    try {
      const [header, body, sig] = token.split(".");
      const payload = JSON.parse(Buffer.from(body, "base64url").toString());
      if (
        !verify(
          "sha256",
          Buffer.from(header + "." + body),
          { key: publicKey, dsaEncoding: "ieee-p1363" },
          Buffer.from(sig, "base64url"),
        ) ||
        payload.exp <= Date.now() / 1000 ||
        !users.some((u) => u.id === payload.sub)
      )
        return null;
      return payload as { sub: string; email: string; exp: number };
    } catch {
      return null;
    }
  }
  return {
    issue,
    claims,
    credentials: { password, admin: users[0].email, customer: users[1].email },
    async handle(
      req: IncomingMessage,
      url: URL,
      json: (value: unknown, status?: number) => void,
    ) {
      if (url.pathname === "/__test/credentials") {
        json({ password, admin: users[0].email, customer: users[1].email });
        return true;
      }
      if (url.pathname === "/__test/revoke-refresh") {
        refresh.clear();
        json({ ok: true });
        return true;
      }
      if (url.pathname === "/auth/v1/.well-known/jwks.json") {
        json({ keys: [jwk] });
        return true;
      }
      if (url.pathname === "/auth/v1/token") {
        const body = await readJson(req);
        if (url.searchParams.get("grant_type") === "refresh_token") {
          const id = refresh.get(String(body.refresh_token));
          if (!id) {
            json(
              {
                msg: "Refresh token expired",
                error_code: "refresh_token_not_found",
              },
              400,
            );
            return true;
          }
          refresh.delete(String(body.refresh_token));
          json(issue(id));
          return true;
        }
        const u = users.find((v) => v.email === body.email);
        if (!u || body.password !== password) {
          json(
            {
              msg: "Invalid login credentials",
              error_code: "invalid_credentials",
            },
            400,
          );
          return true;
        }
        json(issue(u.id));
        return true;
      }
      if (url.pathname === "/auth/v1/user") {
        const identity = claims(
          (req.headers.authorization ?? "").replace("Bearer ", ""),
        );
        json(
          identity ? user(identity.sub) : { msg: "Unauthorized" },
          identity ? 200 : 401,
        );
        return true;
      }
      if (url.pathname === "/auth/v1/logout") {
        const c = claims(
          (req.headers.authorization ?? "").replace("Bearer ", ""),
        );
        if (c)
          for (const [key, id] of refresh)
            if (id === c.sub) refresh.delete(key);
        json({});
        return true;
      }
      return false;
    },
  };
}
