import { Router } from "express";
import * as services from "../services/service.js";
const route = Router();

route.get("/", services.homePage);
route.get("/health", services.health);
route.get("/o/authenticate", services.authenticate);
route.get("/.well-known/openid-configuration", services.wellKnown);
route.get("/jwks.json", services.certs);
route.post("/authenticate/sign-in", services.login);
route.post("/authenticate/sign-up", services.signup);
route.get("/o/userinfo", (req, res) => {
  return res.send({
    error: "invalid_request",
    error_description: "Invalid Credentials",
  });
});
route.post("/o/userinfo", services.userInfo);
route.post("/addClient", services.clientAdd);
route.post("/token", services.token);
route.get("/token", (req, res) => {
  res.status(404).send(`
    <html>
      <body style="font-family:sans-serif;text-align:center;margin-top:50px;">
        <h1>404</h1>
        <p>This page can’t be found</p>
      </body>
    </html>
  `);
});
route.get("/check", services.check);
route.post("/logout", services.logout);
export default route;
