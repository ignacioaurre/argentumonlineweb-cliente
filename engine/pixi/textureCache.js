import { Texture, Rectangle } from "pixi.js";

const _cache = {};
const _subCache = {};

/**
 * Crea y registra una PIXI.Texture a partir de un HTMLImageElement ya cargado.
 * Llamado desde inits.loadImage() después de que la imagen carga.
 */
export function setTexture(numFile, image) {
    if (!_cache[numFile]) {
        _cache[numFile] = Texture.from(image);
    }
    return _cache[numFile];
}

/**
 * Devuelve la PIXI.Texture completa para un numFile, o null si no está cargada.
 */
export function getTexture(numFile) {
    return _cache[numFile] ?? null;
}

/**
 * Devuelve true si la textura base ya fue cargada para ese numFile.
 */
export function hasTexture(numFile) {
    return !!_cache[numFile];
}

/**
 * Devuelve (y cachea) una sub-textura correspondiente a una región del sprite sheet.
 * Equivalente a ctx.drawImage(img, sX, sY, w, h, ...) pero en PIXI.
 *
 * @param {number|string} numFile - clave del sprite sheet
 * @param {number} sX - x de origen en el sheet
 * @param {number} sY - y de origen en el sheet
 * @param {number} width - ancho del frame
 * @param {number} height - alto del frame
 * @returns {Texture|null} sub-textura cacheada, o null si la base no está lista
 */
export function getSubTexture(numFile, sX, sY, width, height) {
    const base = _cache[numFile];
    if (!base) return null;

    const key = `${numFile}_${sX}_${sY}_${width}_${height}`;
    if (!_subCache[key]) {
        _subCache[key] = new Texture({
            source: base.source,
            frame: new Rectangle(sX, sY, width, height)
        });
    }
    return _subCache[key];
}
