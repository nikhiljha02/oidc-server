import express from "express";
import app from "./app.js";
import authRoute from "./Routes/route.js";
import connectDB from "./db.js";
import session from "express-session";
import "dotenv/config";

const PORT = 8080;

// app.use("/api", authRoute);
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: true,
        cookie: {
            httpOnly: true,
        },
    }),
);

app.use("/", authRoute);
async function main() {
    await connectDB();
    app.listen(PORT || 8080, () => {
        console.log(`server is running on development ${PORT} `);
    });
}

main().catch((err) => console.log(err.message));
