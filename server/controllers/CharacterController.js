const tokenAuth = process.env.GAME_SERVER_TOKEN || "Bearer token";

// Stats base por clase (nivel 1)
const BASE_STATS = {
    1:  { hp: 80,  mana: 180, minHit: 3, maxHit: 8,  idWeapon: 10, idShield: 0 }, // Mago
    2:  { hp: 110, mana: 160, minHit: 4, maxHit: 10, idWeapon: 24, idShield: 6 }, // Clérigo
    3:  { hp: 180, mana: 40,  minHit: 8, maxHit: 18, idWeapon: 13, idShield: 6 }, // Guerrero
    4:  { hp: 140, mana: 60,  minHit: 7, maxHit: 14, idWeapon: 52, idShield: 3 }, // Asesino
    5:  { hp: 120, mana: 60,  minHit: 6, maxHit: 12, idWeapon: 52, idShield: 0 }, // Ladrón
    6:  { hp: 120, mana: 120, minHit: 5, maxHit: 12, idWeapon: 5,  idShield: 3 }, // Bardo
    7:  { hp: 120, mana: 150, minHit: 5, maxHit: 10, idWeapon: 24, idShield: 0 }, // Druida
    8:  { hp: 160, mana: 100, minHit: 7, maxHit: 16, idWeapon: 13, idShield: 6 }, // Paladín
    9:  { hp: 150, mana: 80,  minHit: 8, maxHit: 16, idWeapon: 40, idShield: 0 }, // Cazador
    10: { hp: 120, mana: 60,  minHit: 5, maxHit: 10, idWeapon: 5,  idShield: 0 }, // Trabajador
    11: { hp: 150, mana: 80,  minHit: 7, maxHit: 15, idWeapon: 13, idShield: 3 }, // Pirata
};

// Modificadores de atributo por raza (base 18)
const RACE_MODIFIERS = {
    1: { fuerza: 1,  agilidad: 1,  inteligencia: 0,  constitucion: 2 }, // Humano
    2: { fuerza: -1, agilidad: 3,  inteligencia: 2,  constitucion: 1 }, // Elfo
    3: { fuerza: 2,  agilidad: 3,  inteligencia: 2,  constitucion: 0 }, // Elfo Drow
    4: { fuerza: 3,  agilidad: 0,  inteligencia: -2, constitucion: 3 }, // Enano
    5: { fuerza: -2, agilidad: 3,  inteligencia: 4,  constitucion: 0 }, // Gnomo
};

// Cuerpo inicial por raza
const RACE_BODIES = {
    1: 1,   // Humano
    2: 2,   // Elfo
    3: 3,   // Elfo Drow
    4: 300, // Enano
    5: 300, // Gnomo
};

class CharacterController {
    constructor(characterService, accountService) {
        this.characterService = characterService;
        this.accountService = accountService;
    }

    async getCharacter(req, res, next) {
        const { idAccount, idCharacter, email } = req.query;
        const { authorization } = req.headers;

        if (authorization != tokenAuth) {
            return res.json({ err: true });
        }

        try {
            const account = await this.accountService.getAccount({
                _id: idAccount,
                email
            });

            let character = {};

            if (idCharacter) {
                character = await this.characterService.getCharacter({
                    _id: idCharacter,
                    idAccount
                });
            }

            res.json({ account, character });
        } catch (e) {
            res.json({ err: true, message: e.message });
        }
    }

    async createCharacter(req, res) {
        if (!req.user) {
            return res.json({ error: true, message: "No autorizado." });
        }

        const { name, idClase, idRaza, idGenero, idHead } = req.body;

        const trimmedName = (name || "").trim();

        if (!trimmedName || trimmedName.length < 3 || trimmedName.length > 20) {
            return res.json({ error: true, message: "El nombre debe tener entre 3 y 20 caracteres." });
        }

        if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$/.test(trimmedName)) {
            return res.json({ error: true, message: "El nombre solo puede contener letras." });
        }

        const claseId = Number(idClase);
        const razaId = Number(idRaza);
        const generoId = Number(idGenero);
        const headId = Number(idHead);

        if (!BASE_STATS[claseId] || !RACE_MODIFIERS[razaId]) {
            return res.json({ error: true, message: "Clase o raza inválida." });
        }

        try {
            const existing = await this.characterService.getCharacter({ name: trimmedName });
            if (existing) {
                return res.json({ error: true, message: "Ese nombre ya está en uso." });
            }

            const accountChars = await this.characterService.getCharactersByAccountId(req.user.accountId);
            if (accountChars.length >= 5) {
                return res.json({ error: true, message: "Límite de personajes alcanzado (máximo 5)." });
            }

            const stats = BASE_STATS[claseId];
            const race = RACE_MODIFIERS[razaId];

            const newCharacter = {
                idAccount: req.user.accountId,
                name: trimmedName,
                idClase: claseId,
                idRaza: razaId,
                idGenero: generoId,
                idHead: headId,
                idBody: RACE_BODIES[razaId] || 1,
                idHelmet: 0,
                idWeapon: stats.idWeapon,
                idShield: stats.idShield,
                idLastHead: 0,
                idLastBody: 0,
                idLastHelmet: 0,
                idLastWeapon: 0,
                idLastShield: 0,
                idItemWeapon: 0,
                idItemBody: 0,
                idItemShield: 0,
                idItemHelmet: 0,
                map: 1,
                posX: 50,
                posY: 50,
                hp: stats.hp,
                maxHp: stats.hp,
                mana: stats.mana,
                maxMana: stats.mana,
                minHit: stats.minHit,
                maxHit: stats.maxHit,
                gold: 0,
                level: 1,
                exp: 0,
                expNextLevel: 300,
                attrFuerza: 18 + race.fuerza,
                attrAgilidad: 18 + race.agilidad,
                attrInteligencia: 18 + race.inteligencia,
                attrConstitucion: 18 + race.constitucion,
                privileges: 0,
                criminal: false,
                dead: false,
                navegando: false,
                muerto: false,
                banned: null,
                npcMatados: 0,
                ciudadanosMatados: 0,
                criminalesMatados: 0,
                countKilled: 0,
                countDie: 0,
                fianza: 0,
                connected: false,
                spellsAcertados: 0,
                spellsErrados: 0,
                items: [],
                spells: [],
            };

            const character = await this.characterService.addCharacter(newCharacter);

            res.json({ success: true, character });
        } catch (e) {
            res.json({ error: true, message: e.message });
        }
    }

    async saveCharacter(req, res) {
        const { idCharacter } = req.params;

        const character = await this.characterService.updateCharacter(
            idCharacter,
            req.body
        );

        res.json(character);
    }

    async getRankingGeneral(req, res, next) {
        const ranking = await this.characterService.getRankingGeneral();

        res.json(ranking);
    }

    async getCharactersByAccountId(req, res, next) {
        if (req.user) {
            const characters = await this.characterService.getCharactersByAccountId(
                req.user.accountId
            );

            res.json(characters);
        } else {
            res.json({});
        }
    }
}

module.exports = CharacterController;
