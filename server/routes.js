const _ = require("lodash");
const rateLimit = require("express-rate-limit");

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: true, message: "Demasiados intentos. Intentá de nuevo en 15 minutos." }
});

module.exports = app => {
    const AccountController = require("./controllers/AccountController");
    const AccountService = require("./services/AccountService");
    const AccountInstance = new AccountController(new AccountService());

    const CharacterController = require("./controllers/CharacterController");
    const CharacterService = require("./services/CharacterService");
    const CharacterInstance = new CharacterController(
        new CharacterService(),
        new AccountService()
    );

    app.get("/api/ping", (req, res) => {
        return res.send("pong");
    });

    //ACCOUNT
    app.post("/api/login", authLimiter, (req, res, next) =>
        AccountInstance.login(req, res, next)
    );
    app.post("/api/logout", (req, res) => AccountInstance.logout(req, res));
    app.get("/api/checkuserlogged", (req, res) =>
        AccountInstance.verifyLogin(req, res)
    );
    app.post("/api/register", authLimiter, (req, res, next) =>
        AccountInstance.register(req, res, next)
    );

    //CHARACTER
    app.post("/api/character", (req, res) =>
        CharacterInstance.createCharacter(req, res)
    );

    app.get("/api/character", (req, res) =>
        CharacterInstance.getCharacter(req, res)
    );

    app.put("/api/character_save/:idCharacter", (req, res) =>
        CharacterInstance.saveCharacter(req, res)
    );

    app.get("/api/ranking/general", (req, res) =>
        CharacterInstance.getRankingGeneral(req, res)
    );

    app.get("/api/characters", (req, res) =>
        CharacterInstance.getCharactersByAccountId(req, res)
    );
};
