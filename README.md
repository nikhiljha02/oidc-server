# 🚀 Custom OIDC Server (OAuth 2.0 Implementation)

A custom-built **OpenID Connect (OIDC)** server built on top of OAuth 2.0, designed to replicate real-world authentication flows.

It allows client applications to:

- Register themselves
- Authenticate users
- Obtain authorization codes
- Exchange them for tokens
- Fetch user profile data securely

---

## 🛠️ Tech Stack

| Technology | Role |
|---|---|
| Node.js | Runtime |
| Express.js | Web framework |
| JavaScript | Language |
| HTML | Frontend views |
| MongoDB | Database |

---

## 📦 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/nikhiljha02/oidc-server.git
cd oidc-server
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Create a `.env` file in the root directory:

```env
MONGO_URI=your_mongodb_connection_string
JWT_ACCESS_SECRET=your_access_token_secret
JWT_REFRESH_TOKEN_SECRET=your_refresh_token_secret
PORT=8080
SESSION_SECRET=your_session_secret
```

### 4. Generate Keys

Generate public/private RSA keys used for RS256 token signing:

```bash
sh key-gen.sh
```

### 5. Run the Server

```bash
npm run dev
```

Server starts at: **http://localhost:8080**

---

## 🔍 OIDC Discovery Endpoint

Access the OIDC configuration at:

```
http://localhost:8080/.well-known/openid-configuration
```

**Example response:**

```json
{
  "issuer": "http://localhost:8080",
  "authorization_endpoint": "http://localhost:8080/o/authenticate",
  "userinfo_endpoint": "http://localhost:8080/o/userinfo",
  "token_endpoint": "http://localhost:8080/token",
  "jwks_uri": "http://localhost:8080/jwks.json",
  "claims_supported": [
    "aud",
    "email",
    "email_verified",
    "exp",
    "family_name",
    "given_name",
    "iat",
    "iss",
    "name",
    "sub"
  ],
  "id_token_signing_alg_values_supported": ["RS256"]
}
```

---

## 🔐 Authentication Flow (OIDC)

### Step 1 — Client Registration

Register your application at:

```
http://localhost:8080/
```

You will receive:
- `client_id`
- `client_secret`

### Step 2 — User Authentication

Redirect the user to `/o/authenticate` with the following query parameters:

| Parameter | Description |
|---|---|
| `client_id` | Your registered client ID |
| `redirect_uri` | URI to redirect after login |

- ✅ If valid → user sees the login page
- ✅ if user is not registered in oidc provieder db then first signup then login
- ✅ if user already registered then just proceed with login
- ✅ After login → redirected back with an **authorization code**

### Step 3 — Exchange Authorization Code for Token

> ⏳ Authorization codes are valid for **3 minutes**.

```javascript
const tokenRes = await fetch("http://localhost:8080/token", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    client_id: "your_client_id",
    client_secret: "your_client_secret",
    authcode: code,
    grant_type: "authorization_code",
    redirect_uri: "http://localhost:8080/callback"
  })
});

const data = await tokenRes.json();
const token = data.identityToken;
```

### Step 4 — Fetch User Info

> ⚠️ Do **NOT** remove the `"Bearer "` prefix from the Authorization header.

```javascript
await fetch("http://localhost:8080/o/userinfo", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  }
})
  .then(res => res.json())
  .then(data => console.log(data));
```

---

## 📁 Available Endpoints

| Endpoint | Description |
|---|---|
| `/o/authenticate` | User authentication |
| `/token` | Exchange auth code for token |
| `/userinfo` | Get user profile details |
| `/jwks.json` | Public keys (JWKS) |
| `/.well-known/openid-configuration` | OIDC discovery document |

---

## 🔄 Flow Summary

```
Client registers
      ↓
User logs in via OIDC server
      ↓
Server returns authorization code
      ↓
Client exchanges code for token
      ↓
Client fetches user data
```

---

## ⚠️ Notes

- Authorization codes are **short-lived** (3 minutes)
- Tokens are signed using **RS256**
- Ensure **secure storage** of secrets and tokens in production

---

## 📌 Future Improvements

- [ ] Refresh token support
- [ ] Role-based access control (RBAC)
- [ ] UI improvements
- [ ] Production-grade security hardening

---

## 🤝 Contributing

Pull requests are welcome! Feel free to improve or extend this project.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
