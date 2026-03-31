require("dotenv").config();
const express = require("express");
const next = require("next");
const pino = require("pino");

const logger = pino({
    level: process.env.LOG_LEVEL || "info",
    transport: process.env.NODE_ENV !== "production"
        ? { target: "pino-pretty", options: { colorize: true } }
        : undefined
});

const port = parseInt(process.env.PORT, 10) || 3000;
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();
const urls = require("./config/urls.json");
const compression = require("compression");

const passport = require("passport"),
    passportConfig = require("./server/passport"),
    flash = require("express-flash"),
    cookieParser = require("cookie-parser"),
    cookieSession = require("cookie-session"),
    session = require("express-session"),
    mongoose = require("mongoose"),
    bodyParser = require("body-parser"),
    routes = require("./server/routes");

const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/aoweb";
mongoose
    .connect(mongoUri)
    .then(() => logger.info("MongoDB conectado"))
    .catch(err => logger.error({ err }, "Error conectando a MongoDB"));

const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",")
    : ["http://localhost:3000"];

const robotsOptions = {
    root: __dirname + "/static/",
    headers: {
        "Content-Type": "text/plain; charset=UTF-8"
    }
};

app.prepare().then(() => {
    const server = express();

    server.use(compression());

    server.use(
        require("cors")({
            origin: function(origin, callback) {
                if (!origin || allowedOrigins.includes(origin)) {
                    return callback(null, true);
                }
                callback(new Error("CORS no permitido para este origen"));
            },
            credentials: true
        })
    );

    server.use(bodyParser.urlencoded({ extended: false }));
    server.use(bodyParser.json());

    server.use(flash());

    server.use(cookieParser());
    server.use(
        cookieSession({
            name: "session",
            keys: [process.env.SESSION_SECRET || "dev-secret-cambiar-en-produccion"],
            domain: !dev ? process.env.COOKIE_DOMAIN : undefined,
            maxAge: 24 * 60 * 60 * 1000 * 7
        })
    );

    server.use(passport.initialize());
    server.use(passport.session());

    server.get("/robots.txt", (req, res) =>
        res.status(200).sendFile("robots.txt", robotsOptions)
    );

    routes(server);

    Object.keys(urls).map(function(url, index) {
        const href = urls[url];

        server.get(url, (req, res) => {
            return app.render(req, res, href, req.query, req.params);
        });
    });

    server.get("*", (req, res) => {
        return handle(req, res);
    });

    server.listen(port, err => {
        if (err) throw err;
        logger.info(`Servidor listo en http://localhost:${port}`);
    });
});

module.exports = { logger };
