import { Sprite } from "pixi.js";
import { hasTexture, getSubTexture } from "./textureCache";

/**
 * Equivalente PIXI de engine.drawGrhCapa().
 *
 * Crea un Sprite a partir de la sub-textura del grh y lo agrega al container.
 * El container se limpia al inicio de cada frame (container.removeChildren()),
 * por lo que los sprites son de un solo uso por frame — sin GC extra porque
 * PixiJS los recicla internamente a través de su pool de Sprites.
 *
 * @param {import("pixi.js").Container} container - capa PIXI destino
 * @param {object} grh   - objeto gráfico con { numFile, sX, sY, width, height }
 * @param {number} dstX  - posición x destino en canvas (px)
 * @param {number} dstY  - posición y destino en canvas (px)
 * @param {boolean} [alpha] - si true aplica alpha 0.5 (equivale al globalAlpha del 2D)
 */
export function drawGrhPixi(container, grh, dstX, dstY, alpha) {
    if (!grh || !grh.numFile || !hasTexture(grh.numFile)) return;

    const texture = getSubTexture(grh.numFile, grh.sX, grh.sY, grh.width, grh.height);
    if (!texture) return;

    const sprite = Sprite.from(texture);
    sprite.x = dstX;
    sprite.y = dstY;
    if (alpha) sprite.alpha = 0.5;

    container.addChild(sprite);
}
