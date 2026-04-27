import path from "path";
import { privateKey, publicKey } from "../utils/certs.js";
import jose from "node-jose";
import user from "../schemas/userSchema.js";
import "dotenv/config";
import JWT from "jsonwebtoken";
import client from "../schemas/clientSchema.js";
import crypto from "crypto";
import mongoose from "mongoose";
import authCodeSchema from "../schemas/codeSchema.js";
import fs from "fs";
import * as cheerio from "cheerio";

const homePage = async (req, res) => {
  return res.sendFile(path.resolve("Frontend", "clientInfo.html"));
};

const health = async (req, res) => {
  return res.json({ message: "Server is healthy", healthy: true });
};

const authenticate = async (req, res) => {
  let { client_id, redirect_url } = req.query;

  // if (!mongoose.Types.ObjectId.isValid(clientId)) {
  //     return res.status(400).send("Invalid client_id format");
  // }
  const user = await client.findById(client_id);
  if (!user) {
    let html = fs.readFileSync(path.resolve("Frontend", "block.html"), "utf8");

    const $ = cheerio.load(html);

    $(".access").text("ACCESS BLOCKED ");

    html = $.html();
    return res.send(html);
  }

  if (redirect_url !== user.redirectUrl) {
    res.json({ message: "redirect url is not proper" });
    return;
  }

  req.session.client_id = client_id;
  req.session.redirect_url = redirect_url;

  let html = fs.readFileSync(path.resolve("Frontend", "index.html"), "utf8");
  html = html.replace("REDIRECT_URL_PLACEHOLDER", redirect_url);
  html = html.replace("client_id", client_id);

  const $ = cheerio.load(html);

  $(".login_heading").html(
    `Sign in to continue <span class='app-name'>${user.applicationName}</span>`,
  );

  html = $.html();
  return res.send(html);
};

const certs = async (req, res) => {
  const key = await jose.JWK.asKey(publicKey, "pem");
  return res.json({ keys: [key.toJSON()] });
};

const wellKnown = async (req, res) => {
  let issue = "https://oidc-server-1.onrender.com";
  return res.json({
    issuer: issue,
    authorization_endpoint: `${issue}/o/authenticate`,
    userinfo_endpoint: `${issue}/o/userinfo`,
    token_endpoint: `${issue}/token`,
    jwks_uri: `${issue}/jwks.json`,
    claims_supported: [
      "aud",
      "email",
      "email_verified",
      "exp",
      "family_name",
      "given_name",
      "iat",
      "iss",
      "name",
      "sub",
    ],
    id_token_signing_alg_values_supported: ["RS256"],
  });
};

const token = async (req, res) => {
  const { client_id, client_secret, authcode } = req.body;
  let clientCode = await authCodeSchema.findOne({ authcode });
  let clientInfo = await client.findById(client_id);

  let checkSecret = clientInfo.comparePassword(client_secret);

  if (!checkSecret) {
    res.json({ message: "client details is not proper" });
    return;
  }

  //   continue from here  cehck code generate token

  if (!clientCode) {
    res.json({ message: "auth code not found or code used" });
    return;
  }

  if (clientCode.expiresAt <= new Date()) {
    // expired → clean up
    await clientCode.deleteOne({ authcode });
    return res.json({ message: "Timeout perform task in 1 min" });
  }

  if (clientCode.authcode !== authcode) {
    res.json({ message: "Invalid or expired authorization code." });
    return;
  }

  const loginUser = await user.findById(clientCode.userId);

  const claims = {
    iss: "http://localhost:8080",
    sub: loginUser.id,
    email: loginUser.email,
    exp: Math.floor(Date.now() / 1000) + 3600,
    given_name: loginUser.firstName ?? "",
    family_name: loginUser.lastName ?? undefined,
    name: [loginUser.firstName, loginUser.lastName].filter(Boolean).join(" "),
  };

  const token = JWT.sign(claims, privateKey, { algorithm: "RS256" });

  res.json({ identityToken: token });
};

const signup = async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  if (!email || !password || !firstName) {
    res
      .status(400)
      .json({ message: "First name, email, and password are required." });
    return;
  }

  const existing = await user.findOne({ email });
  if (existing) {
    res
      .status(409)
      .json({ message: "user with this email already registered" });
    return;
  }
  const { client_id, redirect_url } = req.session;
  await user.create({
    firstName,
    lastName: lastName ?? null,
    email,
    password,
  });
  res.status(201).json({
    ok: true,
    message: "registration done",
    clientId: client_id,
    redirect: redirect_url,
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  const { client_id, redirect_url } = req.session;
  if (!email || !password || !redirect_url) {
    return res
      .status(400)
      .json({ message: "Email, password, and redirect_url are required." });
  }

  const loginUser = await user.findOne({ email });
  const checkClient = await client.findById(client_id);
  if (redirect_url !== checkClient.redirectUrl) {
    res.json({ message: "redirect url is not proper" });
    return;
  }
  if (!loginUser) {
    return res.status(404).json({ message: "User not found with this email" });
  }

  let passwordCorrect = await loginUser.comparePassword(password);
  if (!passwordCorrect) {
    return res.status(422).json({ message: "Invalid email or password" });
  }

  // Generate a unique authorization code
  const authCode = crypto.randomBytes(4).toString("hex");
  await authCodeSchema.create({
    authcode: authCode,
    userId: loginUser.id,
    clientId: checkClient.id,
    expiresAt: new Date(Date.now() + 3 * 60 * 1000),
  });

  // Redirect to the client's redirect_url with the code
  res.redirect(`${redirect_url}?authcode=${authCode}`);
};

const userInfo = async (req, res) => {
  let authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer")) {
    res
      .status(401)
      .json({ message: "Missing or invalid Authorization header." });
    return;
  }
  const token = authHeader.slice(7);
  let claims;
  try {
    claims = JWT.verify(token, publicKey, {
      algorithms: ["RS256"],
    });
  } catch (error) {
    console.log(error);
    res.status(401).json({ message: "Invalid or expired token." });
    return;
  }

  let userInfo = await user.findById(claims.sub);
  res.json({
    sub: userInfo.id,
    email: userInfo.email,
    given_name: userInfo.firstName,
    family_name: userInfo.lastName,
    name: [userInfo.firstName, userInfo.lastName].filter(Boolean).join(" "),
  });
};

const clientAdd = async (req, res) => {
  let { appName, appUrl, redirectUrl } = req.body;
  if (!appName || !appUrl || !redirectUrl) {
    res.status(400).json({ message: "Fill all details." });
    return;
  }

  const clientSecret = crypto.randomBytes(32).toString("hex");

  let newClient = await client.create({
    applicationName: appName,
    applicationUrl: appUrl,
    redirectUrl: redirectUrl,
    clientSecret,
  });

  res.json({
    clientId: newClient._id,
    clientSecret: clientSecret,
  });
};

const check = async (req, res) => {
  res.json({ message: "checkPoint" });
};

export {
  homePage,
  health,
  authenticate,
  wellKnown,
  certs,
  signup,
  login,
  userInfo,
  token,
  clientAdd,
  //   callback,
  check,
};
