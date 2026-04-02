import { Sprite } from "pixi.js";
import { hasTexture, getSubTexture } from "./textureCache";

/**
 * Agrega un Sprite al container usando sub-textura.
 * Si la textura aún no está cargada, dispara el load y omite el frame.
 */
function addSprite(container, grh, destX, destY, alpha, inits) {
    if (!hasTexture(grh.numFile)) {
        if (!inits.preCacheGraphics[grh.numFile]) {
            inits.loadImage(grh.numFile);
        }
        return;
    }
    const texture = getSubTexture(grh.numFile, grh.sX, grh.sY, grh.width, grh.height);
    if (!texture) return;

    const sprite = Sprite.from(texture);
    sprite.x = destX;
    sprite.y = destY;
    if (alpha != null) sprite.alpha = alpha;
    container.addChild(sprite);
}

/**
 * Equivalente PIXI de engine.drawChar().
 * Renderiza head, body, helmet, weapon y shield de un personaje
 * como sprites en el container foreground.
 *
 * @param {import("pixi.js").Container} layer  - pixiLayers.foreground
 * @param {object}  personaje - objeto personaje con frameCounter, heading, ids, etc.
 * @param {object}  inits     - instancia de Inits (bodies, heads, armas, etc.)
 * @param {object}  config    - instancia de Config (OffsetXHead)
 * @param {number}  sX        - x destino en canvas (px)
 * @param {number}  sY        - y destino en canvas (px)
 */
export function drawCharPixi(layer, personaje, inits, config, sX, sY) {
    const grhRopa   = personaje.idBody   ? inits.bodies[personaje.idBody][personaje.heading]     : "";
    const grhWeapon = personaje.idWeapon ? inits.armas[personaje.idWeapon][personaje.heading]    : "";
    const grhShield = personaje.idShield ? inits.escudos[personaje.idShield][personaje.heading]  : "";

    let graphicsGrhRopa   = null;
    let graphicsGrhWeapon = null;
    let graphicsGrhShield = null;

    if (grhRopa) {
        const cur = inits.graphics[grhRopa].frames[Math.ceil(personaje.frameCounter)];
        graphicsGrhRopa = inits.graphics[cur];
    }
    if (grhWeapon) {
        const cur = inits.graphics[grhWeapon].frames[Math.ceil(personaje.frameCounterWeapon)];
        graphicsGrhWeapon = inits.graphics[cur];
    }
    if (grhShield) {
        const cur = inits.graphics[grhShield].frames[Math.ceil(personaje.frameCounterShield)];
        graphicsGrhShield = inits.graphics[cur];
    }

    // Head
    if (personaje.idHead) {
        const grhCabeza = inits.heads[personaje.idHead][personaje.heading];
        const g = inits.graphics[grhCabeza];
        addSprite(
            layer, g,
            sX + config.OffsetXHead,
            sY + inits.bodies[personaje.idBody].headOffsetY - 18,
            null, inits
        );
    }

    // Body
    if (graphicsGrhRopa) {
        const tmpsX = sX - Math.floor((graphicsGrhRopa.width  * 16) / 32) + 16;
        const tmpsY = sY - Math.floor((graphicsGrhRopa.height * 32) / 32) + 32;
        addSprite(layer, graphicsGrhRopa, tmpsX, tmpsY, null, inits);
    }

    // Helmet
    if (personaje.idHelmet) {
        const casco     = inits.cascos[personaje.idHelmet];
        const grhHelmet = inits.cascos[personaje.idHelmet][personaje.heading];
        const g         = inits.graphics[grhHelmet];
        addSprite(
            layer, g,
            sX + config.OffsetXHead + casco.offsetX,
            sY + inits.bodies[personaje.idBody].headOffsetY - 18 + casco.offsetY,
            null, inits
        );
    }

    // Weapon
    if (graphicsGrhWeapon) {
        const tmpsX = sX - Math.floor((graphicsGrhWeapon.width  * 16) / 32) + 16;
        const tmpsY = sY - Math.floor((graphicsGrhWeapon.height * 32) / 32) + 28;
        addSprite(layer, graphicsGrhWeapon, tmpsX, tmpsY, null, inits);
    }

    // Shield
    if (graphicsGrhShield) {
        const tmpsX = sX - Math.floor((graphicsGrhShield.width  * 16) / 32) + 16;
        const tmpsY = sY - Math.floor((graphicsGrhShield.height * 32) / 32) + 32;
        addSprite(layer, graphicsGrhShield, tmpsX, tmpsY, null, inits);
    }
}

/**
 * Equivalente PIXI de engine.drawFx().
 * Renderiza el frame actual de un efecto visual como Sprite.
 *
 * @param {import("pixi.js").Container} layer
 * @param {object} graphicCurrentGrh - gráfico del frame actual { numFile, sX, sY, width, height }
 * @param {number} sX
 * @param {number} sY
 * @param {boolean} alpha - si true aplica alpha 0.6
 * @param {object} inits
 */
export function drawFxPixi(layer, graphicCurrentGrh, sX, sY, alpha, inits) {
    if (!hasTexture(graphicCurrentGrh.numFile)) {
        if (!inits.preCacheGraphics[graphicCurrentGrh.numFile]) {
            inits.loadImage(graphicCurrentGrh.numFile);
        }
        return;
    }
    const texture = getSubTexture(
        graphicCurrentGrh.numFile,
        graphicCurrentGrh.sX,
        graphicCurrentGrh.sY,
        graphicCurrentGrh.width,
        graphicCurrentGrh.height
    );
    if (!texture) return;

    const sprite = Sprite.from(texture);
    sprite.x = sX;
    sprite.y = sY;
    if (alpha) sprite.alpha = 0.6;
    layer.addChild(sprite);
}
