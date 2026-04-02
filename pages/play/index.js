import React, { useState, useEffect, useRef, useCallback } from "react";

import inits from "../../engine/inits";

import _ from "lodash";

import { routerPush } from "../../config/utils";

import style from "./style.module.scss";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faComment } from "@fortawesome/free-solid-svg-icons";

// ─── Module-level constants ────────────────────────────────────────────────────

const NAME_KEY_CODE = {
    flechaArriba: 0,
    flechaAbajo: 1,
    flechaIzquierda: 2,
    flechaDerecha: 3,
    usar: 4,
    atacar: 5,
    agarrar: 6,
    tirar: 7,
    equipar: 8,
    domar: 9,
    robar: 10,
    seguro: 11
};

const DEFAULT_KEY_CODES = {
    [NAME_KEY_CODE.flechaArriba]: 38,
    [NAME_KEY_CODE.flechaAbajo]: 40,
    [NAME_KEY_CODE.flechaIzquierda]: 37,
    [NAME_KEY_CODE.flechaDerecha]: 39,
    [NAME_KEY_CODE.usar]: 85,
    [NAME_KEY_CODE.atacar]: 17,
    [NAME_KEY_CODE.agarrar]: 65,
    [NAME_KEY_CODE.tirar]: 84,
    [NAME_KEY_CODE.equipar]: 69,
    [NAME_KEY_CODE.domar]: 68,
    [NAME_KEY_CODE.robar]: 82,
    [NAME_KEY_CODE.seguro]: 83
};

const EMPTY_MACRO = () => ({ idPosItem: "", idSpell: "", idPosSpell: "", img: "", key: "", keyChar: "" });
const EMPTY_MACROS = () => Array.from({ length: 6 }, EMPTY_MACRO);

const INITIAL_TRADE = {
    idPosTrade: 0,
    idPosInv: 0,
    titleItem: "",
    infoItem: "",
    imgItem: "",
    goldItem: "",
    itemsTrade: {},
    itemsUser: {}
};

const INITIAL_STATE = {
    showModalControlPanel: false,
    showInventary: true,
    showMacroConfig: false,
    loading: true,
    user: {},
    selectItem: 0,
    showConsole: true,
    messagesConsole: [],
    crosshair: false,
    nameMap: "",
    showModalReconnect: false,
    showInputText: false,
    textDialog: "",
    showModalTrade: false,
    trade: { ...INITIAL_TRADE },
    cantTrade: 1,
    mapasToLoad: 0,
    mapasCargados: 0,
    keyMacro: { indexMacro: "", idPosItem: "", idSpell: "", idPosSpell: "", key: "", keyChar: "" },
    valueKeyMacro: EMPTY_MACROS(),
    keyCodeMacros: {},
    tmpKeyCodeDefault: {},
    keyCodeDefault: { ...DEFAULT_KEY_CODES },
    keyCodeDefaultReset: { ...DEFAULT_KEY_CODES },
    charKeyCodeDefault: {}
};

// ─── Helper ───────────────────────────────────────────────────────────────────

function computeCharKeyCodes(keyCodeDefault, config) {
    const result = {};
    Object.keys(keyCodeDefault).forEach(key => {
        const keyCode = keyCodeDefault[key];
        let fromChar = String.fromCharCode(keyCode);
        if (config && config.keyCodeMap && config.keyCodeMap[keyCode]) {
            fromChar = config.keyCodeMap[keyCode];
        }
        result[key] = fromChar;
    });
    return result;
}

// ─── Component ────────────────────────────────────────────────────────────────

function Play() {
    const [state, setStateFn] = useState(INITIAL_STATE);

    // Always-current ref so engine can read state synchronously
    const stateRef = useRef(state);
    stateRef.current = state;

    // DOM refs
    const consoleRef = useRef(null);
    const macros = useRef([]);
    const modalMacro = useRef(null);
    const canvas = useRef({ pixi: null });

    // Non-state instance values
    const clickUse = useRef(0);
    const lastClickIdItem = useRef(0);

    // Engine objects (loaded once in useEffect)
    const pkgRef = useRef(null);
    const userRef = useRef(null);
    const generalRef = useRef(null);
    const gameRef = useRef(null);
    const engineRef = useRef(null);
    const messagesRef = useRef(null);
    const connectionRef = useRef(null);
    const configRef = useRef(null);

    // Merge setState that mimics class setState(updates, callback)
    const setState = useCallback((updates, callback) => {
        setStateFn(prev => {
            return typeof updates === "function"
                ? { ...prev, ...updates(prev) }
                : { ...prev, ...updates };
        });
        if (callback) setTimeout(callback, 0);
    }, []);

    // Keep a stable ref so the bridge always calls the latest setState
    const setStateRef = useRef(setState);
    setStateRef.current = setState;

    // Bridge object passed to engine — mimics class instance API
    const bridge = useRef({
        get state() { return stateRef.current; },
        setState(updates, callback) { setStateRef.current(updates, callback); },
        get refs() { return { console: consoleRef.current }; }
    });

    // ── Initialization ────────────────────────────────────────────────────────

    useEffect(() => {
        inits.setReact(bridge.current);

        const macrosStorage = window.localStorage.getItem("macros");
        if (macrosStorage) {
            const jsonMacros = JSON.parse(macrosStorage);
            const tmpKeyCodeMacros = {};
            jsonMacros.forEach((macro, index) => {
                if (macro.key) tmpKeyCodeMacros[macro.key] = index;
            });
            setState({ valueKeyMacro: jsonMacros, keyCodeMacros: tmpKeyCodeMacros });
        }

        const defaultKeysStorage = window.localStorage.getItem("defaultKeys");
        let initialKeyCodeDefault = { ...DEFAULT_KEY_CODES };
        if (defaultKeysStorage) {
            initialKeyCodeDefault = JSON.parse(defaultKeysStorage);
        }

        (async () => {
            configRef.current = require("../../engine/config").default;
            const Engine = require("../../engine/engine").default;
            const General = require("../../engine/general").default;
            const Messages = require("../../engine/connection/messages").default;
            const Connection = require("../../engine/connection/connection").default;
            const Game = require("../../engine/game").default;
            const User = require("../../engine/user").default;
            const Package = require("../../engine/connection/package").default;

            pkgRef.current = new Package();
            userRef.current = new User();
            generalRef.current = new General(pkgRef.current, configRef.current);
            gameRef.current = new Game(inits, userRef.current, pkgRef.current, configRef.current, bridge.current);
            engineRef.current = new Engine(
                inits,
                userRef.current,
                pkgRef.current,
                configRef.current,
                gameRef.current,
                canvas.current,
                bridge.current
            );
            messagesRef.current = new Messages(
                userRef.current,
                engineRef.current,
                inits,
                pkgRef.current,
                configRef.current,
                gameRef.current,
                bridge.current
            );
            connectionRef.current = new Connection(
                messagesRef.current,
                pkgRef.current,
                gameRef.current,
                engineRef.current,
                userRef.current,
                configRef.current,
                bridge.current
            );

            const charKCs = computeCharKeyCodes(initialKeyCodeDefault, configRef.current);
            setState({
                keyCodeDefault: _.cloneDeep(initialKeyCodeDefault),
                tmpKeyCodeDefault: _.cloneDeep(initialKeyCodeDefault),
                charKeyCodeDefault: charKCs
            });

            await engineRef.current.initCanvas();
            connectionRef.current.startWebSocket();
            setState({ loading: false });

            document.oncontextmenu = e => {
                e.stopPropagation();
                return false;
            };

            document.onkeyup = e => {
                const {
                    selectItem,
                    showInputText,
                    textDialog,
                    showMacroConfig,
                    valueKeyMacro,
                    keyCodeMacros,
                    keyCodeDefault
                } = stateRef.current;
                const keyCode = e.keyCode;

                if (showMacroConfig) return;

                if (!showInputText && !isNaN(parseInt(keyCodeMacros[keyCode]))) {
                    const macro = valueKeyMacro[keyCodeMacros[keyCode]];
                    if (macro.idPosItem !== "") {
                        gameRef.current.useItem(macro.idPosItem);
                    } else if (macro.idSpell !== "") {
                        selectSpell_(macro.idPosSpell);
                    }
                    return;
                }

                if (keyCode == keyCodeDefault[configRef.current.nameKeyCode.usar] && !showInputText) {
                    if (selectItem) gameRef.current.useItem(selectItem);
                }

                if (keyCode == keyCodeDefault[configRef.current.nameKeyCode.equipar] && !showInputText) {
                    const item = userRef.current.items[selectItem];
                    if (selectItem && item) gameRef.current.equiparItem(selectItem, item.idItem);
                }

                if (keyCode == keyCodeDefault[configRef.current.nameKeyCode.agarrar] && !showInputText) {
                    pkgRef.current.setPackageID(pkgRef.current.serverPacketID.agarrarItem);
                    configRef.current.ws.send(pkgRef.current.dataSend());
                }

                if (keyCode == keyCodeDefault[configRef.current.nameKeyCode.tirar] && !showInputText) {
                    let cantItem = 1;
                    if (selectItem) {
                        cantItem = prompt("¿Cuántos quieres tirar?", 1);
                    }
                    if (cantItem > 0) {
                        pkgRef.current.setPackageID(pkgRef.current.serverPacketID.tirarItem);
                        pkgRef.current.writeInt(selectItem);
                        pkgRef.current.writeShort(parseInt(cantItem));
                        configRef.current.ws.send(pkgRef.current.dataSend());
                    }
                }

                if (keyCode == 13) {
                    if (showInputText) {
                        generalRef.current.sendDialog(textDialog);
                        setState({ textDialog: "" });
                    }
                    setState({ showInputText: !showInputText });
                }

                if (keyCode == 77 && !showInputText) {
                    generalRef.current.sendDialog("/meditar");
                }

                if (keyCode == keyCodeDefault[configRef.current.nameKeyCode.seguro] && !showInputText) {
                    configRef.current.seguroActivado = !configRef.current.seguroActivado;
                    pkgRef.current.setPackageID(pkgRef.current.serverPacketID.changeSeguro);
                    configRef.current.ws.send(pkgRef.current.dataSend());
                }

                if (keyCode == keyCodeDefault[configRef.current.nameKeyCode.atacar]) {
                    if (+Date.now() - configRef.current.timeHitStart > configRef.current.intervalHit) {
                        engineRef.current.hit();
                    }
                }

                e = e || window.event;
                if (e.ctrlKey) {
                    const c = e.which || keyCode;
                    switch (c) {
                        case 83:
                        case 87:
                        case 68:
                            e.preventDefault();
                            e.stopPropagation();
                            break;
                    }
                }
            };
        })();

        return () => {
            document.oncontextmenu = null;
            document.onkeyup = null;
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Helpers needed by keyup handler (stable via refs) ─────────────────────

    const selectSpell_ = useCallback(i => {
        const { keyMacro, showMacroConfig } = stateRef.current;
        const spell = userRef.current && userRef.current.spells[i];

        if (showMacroConfig && spell) {
            setState({
                keyMacro: {
                    ...keyMacro,
                    idSpell: spell.idSpell,
                    idPosSpell: i,
                    idPosItem: "",
                    img: `/static/spells/${spell.idSpell}.png`
                }
            });
            return;
        }

        if (userRef.current && userRef.current.maxMana > 0) {
            configRef.current.hechizoSelected = i;
            setState({ crosshair: true });
            gameRef.current.writeConsole("Haz click sobre el objetivo...", "gray");
        }
    }, [setState]);

    // ── Event handlers ────────────────────────────────────────────────────────

    const closeModalTrade = () => setState({ showModalTrade: false });

    const openConsole = () => setState(prev => ({ showConsole: !prev.showConsole }));

    const selectItem = i => {
        const { keyMacro, showMacroConfig } = state;

        setState({ selectItem: i });

        if (showMacroConfig) {
            const item = userRef.current && userRef.current.items[i];
            if (item) {
                setState({
                    keyMacro: {
                        ...keyMacro,
                        idSpell: "",
                        idPosItem: i,
                        img: `/static/graficos/${inits.graphics[item.grhIndex].numFile}.png`
                    }
                });
            }
            return;
        }

        if (clickUse.current > 1 && lastClickIdItem.current == i) {
            clickUse.current = 0;
            gameRef.current.useItem(i);
        }

        clickUse.current++;
        lastClickIdItem.current = i;
    };

    const selectSpell = i => selectSpell_(i);

    const clickCanvas = e => {
        const xCanvas = e.nativeEvent.offsetX;
        const yCanvas = e.nativeEvent.offsetY;
        const posX = Math.round(userRef.current.pos.x + xCanvas / 32 - 544 / 64);
        const posY = Math.round(userRef.current.pos.y + yCanvas / 32 - 544 / 64);
        engineRef.current.clickCanvas({ x: posX, y: posY });
    };

    const selectItemUserTrade = i => {
        const { trade } = state;
        const item = trade.itemsUser[i];
        setState({
            trade: {
                ...trade,
                idPosInv: i,
                titleItem: item ? item.name : "",
                infoItem: item ? item.info : "",
                imgItem: item ? item.imgItem : "",
                goldItem: item ? item.gold : ""
            }
        });
    };

    const selectItemTrade = i => {
        const { trade } = state;
        const item = trade.itemsTrade[i];
        setState({
            trade: {
                ...trade,
                idPosTrade: i,
                titleItem: item ? item.name : "",
                infoItem: item ? item.info : "",
                imgItem: item ? item.imgItem : "",
                goldItem: item ? item.gold : ""
            }
        });
    };

    const buyTrade = () => {
        const { trade, cantTrade } = state;
        if (trade.idPosTrade) {
            pkgRef.current.setPackageID(pkgRef.current.serverPacketID.buyItem);
            pkgRef.current.writeByte(trade.idPosTrade);
            pkgRef.current.writeShort(cantTrade);
            configRef.current.ws.send(pkgRef.current.dataSend());
        }
    };

    const sellTrade = () => {
        const { trade, cantTrade } = state;
        if (trade.idPosInv) {
            pkgRef.current.setPackageID(pkgRef.current.serverPacketID.sellItem);
            pkgRef.current.writeByte(trade.idPosInv);
            pkgRef.current.writeShort(cantTrade);
            configRef.current.ws.send(pkgRef.current.dataSend());
        }
    };

    const showInventary = () => setState({ showInventary: true });
    const showSpells = () => setState({ showInventary: false });

    const showMacroConfig = (e, key) => {
        e.preventDefault();
        const refMacro = macros.current[key];
        modalMacro.current.style.left = `${refMacro.offsetLeft - 57}px`;
        modalMacro.current.style.top = `${refMacro.offsetTop - 210}px`;
        setState({
            showMacroConfig: true,
            keyMacro: { indexMacro: key, idPosItem: "", idPosSpell: "", idSpell: "", key: "", keyChar: "" }
        });
    };

    const handleKeyMacro = e => {
        const { keyMacro, keyCodeMacros, keyCodeDefault } = state;
        const keyCode = e.keyCode;

        if (Object.values(keyCodeDefault).indexOf(keyCode) > -1 || !isNaN(parseInt(keyCodeMacros[keyCode]))) {
            alert("La tecla ya está asignada");
        } else {
            let fromChar = String.fromCharCode(keyCode);
            if (configRef.current && configRef.current.keyCodeMap[keyCode]) {
                fromChar = configRef.current.keyCodeMap[keyCode];
            }
            setState({ keyMacro: { ...keyMacro, key: keyCode, keyChar: fromChar } });
        }
    };

    const saveMacro = () => {
        const { keyMacro, valueKeyMacro, keyCodeMacros } = state;
        const newMacros = [...valueKeyMacro];
        newMacros[keyMacro.indexMacro] = {
            idPosItem: keyMacro.idPosItem,
            idSpell: keyMacro.idSpell,
            idPosSpell: keyMacro.idPosSpell,
            img: keyMacro.img,
            key: keyMacro.key,
            keyChar: keyMacro.keyChar
        };
        const newKeyCodeMacros = { ...keyCodeMacros, [keyMacro.key]: keyMacro.indexMacro };
        setState({ valueKeyMacro: newMacros, keyCodeMacros: newKeyCodeMacros, showMacroConfig: false });
        window.localStorage.setItem("macros", JSON.stringify(newMacros));
    };

    const handleKeyDefault = (e, keyType) => {
        const { keyCodeMacros, charKeyCodeDefault, tmpKeyCodeDefault } = state;
        const keyCode = e.keyCode;

        if (Object.values(tmpKeyCodeDefault).indexOf(keyCode) > -1 || !isNaN(parseInt(keyCodeMacros[keyCode]))) {
            alert("La tecla ya está asignada");
        } else {
            let fromChar = String.fromCharCode(keyCode);
            if (configRef.current && configRef.current.keyCodeMap[keyCode]) {
                fromChar = configRef.current.keyCodeMap[keyCode];
            }
            setState({
                tmpKeyCodeDefault: { ...tmpKeyCodeDefault, [keyType]: keyCode },
                charKeyCodeDefault: { ...charKeyCodeDefault, [keyType]: fromChar }
            });
        }
    };

    const restoreDefaultKeys = () => {
        const { keyCodeDefaultReset } = state;
        window.localStorage.setItem("defaultKeys", JSON.stringify(keyCodeDefaultReset));
        const newKeys = _.cloneDeep(keyCodeDefaultReset);
        const charKCs = computeCharKeyCodes(newKeys, configRef.current);
        setState({
            keyCodeDefault: newKeys,
            tmpKeyCodeDefault: _.cloneDeep(keyCodeDefaultReset),
            charKeyCodeDefault: charKCs
        });
    };

    const saveChangesKeys = () => {
        const { tmpKeyCodeDefault } = state;
        window.localStorage.setItem("defaultKeys", JSON.stringify(tmpKeyCodeDefault));
        setState({ keyCodeDefault: _.cloneDeep(tmpKeyCodeDefault) });
        alert("Teclas guardadas.");
    };

    const restoreMacros = () => {
        window.localStorage.setItem("macros", "");
        setState({ keyCodeMacros: {}, valueKeyMacro: EMPTY_MACROS() });
        alert("Macros reseteados.");
    };

    // ── Render helpers ────────────────────────────────────────────────────────

    const renderBoxItems = () => {
        const { user, selectItem: selectedItem } = state;
        const items = user.items || {};
        const html = [];

        for (let i = 1; i < 22; i++) {
            const item = items[i];
            html.push(
                <div
                    className={`${style.slot_inv} ${selectedItem === i ? style.item_selected : ""}`}
                    key={i}
                    onClick={() => selectItem(i)}
                >
                    <div
                        className={`${style.img_item} ${item && !item.validUser ? style.itemNotValid : ""}`}
                        style={{
                            backgroundImage: item
                                ? `url("/static/graficos/${inits.graphics[item.grhIndex].numFile}.png")`
                                : "none"
                        }}
                    />
                    <div className={style.amount}>{item ? item.cant : ""}</div>
                    {item && item.equipped ? <div className={style.equipped}>E</div> : null}
                </div>
            );
        }

        return html;
    };

    const renderBoxSpells = () => {
        const { user } = state;
        const spells = user.spells || {};
        const html = [];

        for (let i = 1; i < 29; i++) {
            const spell = spells[i];
            html.push(
                <div className={style.slot_spell} key={i} onClick={() => selectSpell(i)}>
                    <div
                        className={style.img_spell}
                        style={{
                            backgroundImage: spell ? `url("/static/spells/${spell.idSpell}.png")` : "none"
                        }}
                    />
                </div>
            );
        }

        return html;
    };

    const renderBoxMacros = () => {
        const { valueKeyMacro } = state;
        const html = [];

        for (let i = 0; i < 6; i++) {
            const macro = valueKeyMacro[i];
            html.push(
                <div
                    key={i}
                    className={style.macro}
                    onContextMenu={e => showMacroConfig(e, i)}
                    ref={ref => { macros.current[i] = ref; }}
                >
                    {macro.idPosItem !== "" && macro.img ? (
                        <div className={style.item} style={{ backgroundImage: `url("${macro.img}")` }} />
                    ) : null}
                    {macro.idSpell !== "" && macro.img ? (
                        <div className={style.spell} style={{ backgroundImage: `url("${macro.img}")` }} />
                    ) : null}
                    {macro.keyChar !== "" ? <div className={style.key}>{macro.keyChar}</div> : null}
                </div>
            );
        }

        return html;
    };

    const renderBoxItemsUserTrade = () => {
        const { trade } = state;
        const html = [];

        for (let i = 1; i < 26; i++) {
            const item = trade.itemsUser[i];
            html.push(
                <div
                    className={`${style.slotInventary} ${trade.idPosInv === i ? style.slotInventarySelected : ""}`}
                    key={i}
                    onClick={() => selectItemUserTrade(i)}
                >
                    <div
                        className={`${style.imgItem} ${item && !item.validUser ? style.itemNotValid : ""}`}
                        style={{ backgroundImage: item ? `url("${item.imgItem}")` : "none" }}
                    />
                    <div className={style.cant}>{item && item.cant}</div>
                    {item && item.equipped ? <div className={style.equipped}>E</div> : null}
                </div>
            );
        }

        return html;
    };

    const renderBoxItemsTrade = () => {
        const { trade } = state;
        const html = [];

        for (let i = 1; i < 26; i++) {
            const item = trade.itemsTrade[i];
            html.push(
                <div
                    className={`${style.slotTrade} ${item && !item.validUser ? style.itemNotValid : ""} ${trade.idPosTrade === i ? style.slotTradeSelected : ""}`}
                    key={i}
                    onClick={() => selectItemTrade(i)}
                >
                    <div
                        className={style.imgItem}
                        style={{ backgroundImage: item ? `url("${item.imgItem}")` : "none" }}
                    />
                </div>
            );
        }

        return html;
    };

    // ── Render ────────────────────────────────────────────────────────────────

    const {
        showInventary: showInv,
        showMacroConfig: showMacro,
        loading,
        user,
        showConsole,
        messagesConsole,
        crosshair,
        nameMap,
        showInputText,
        textDialog,
        showModalTrade,
        trade,
        cantTrade,
        mapasToLoad,
        mapasCargados,
        keyMacro,
        showModalControlPanel,
        keyCodeDefault,
        charKeyCodeDefault
    } = state;

    return (
        <React.Fragment>
            <div
                className={style.progressBar}
                style={{ display: loading ? "block" : "none" }}
            >
                <div className={style.logo_tmp} />
                <div className={style.text}>
                    <span id="porcentajeBarra">
                        {mapasCargados} / {mapasToLoad} Mapas
                    </span>
                </div>
                <div className={style.contentBar}>
                    <div className={style.carga} />
                    <div
                        className={style.barra}
                        style={{ width: `${(mapasCargados * 578) / mapasToLoad}px` }}
                    />
                </div>
                <div className={style.contBox}>
                    <div className={style.help}>
                        <p>Mover: Flechas</p>
                        <p>Atacar: Ctrl</p>
                        <p>Agarrar: A</p>
                        <p>Usar: U</p>
                        <p>Tirar: T</p>
                        <p>Seguro: S</p>
                        <p>Meditar: M</p>
                        <p>Hablar: Enter</p>
                    </div>
                    <div className={style.news}>
                        <div className={style.news_content}>
                            <div className={style.title}>
                                Actualización 03/06/2016
                            </div>
                            <p>- Volvimos!.</p>
                            <p>
                                - Síguemos en nuestra página de{" "}
                                <a
                                    target="_blank"
                                    rel="noreferrer"
                                    href="https://www.facebook.com/ArgentumOnlineWeb"
                                >
                                    Facebook
                                </a>{" "}
                                para más novedades!
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <ul className={style.modalInfo} />

            <div
                className={style.modalControlPanel}
                style={{ display: showModalControlPanel ? "block" : "none" }}
            >
                <div
                    className={style.closeControlPanel}
                    onClick={() => setState({ showModalControlPanel: false })}
                />
                <div className={style.sound} />
                <div className={style.teclas}>
                    <input
                        type="text"
                        className={`${style.tecla} ${style.margin_left_tecla}`}
                        value={charKeyCodeDefault[NAME_KEY_CODE.flechaArriba] || ""}
                        onChange={() => {}}
                        onKeyUp={e => handleKeyDefault(e, NAME_KEY_CODE.flechaArriba)}
                    />
                    <input
                        type="text"
                        className={style.tecla}
                        value={charKeyCodeDefault[NAME_KEY_CODE.flechaAbajo] || ""}
                        onChange={() => {}}
                        onKeyUp={e => handleKeyDefault(e, NAME_KEY_CODE.flechaAbajo)}
                    />
                    <input
                        type="text"
                        className={style.tecla}
                        value={charKeyCodeDefault[NAME_KEY_CODE.flechaIzquierda] || ""}
                        onChange={() => {}}
                        onKeyUp={e => handleKeyDefault(e, NAME_KEY_CODE.flechaIzquierda)}
                    />
                    <input
                        type="text"
                        className={style.tecla}
                        value={charKeyCodeDefault[NAME_KEY_CODE.flechaDerecha] || ""}
                        onChange={() => {}}
                        onKeyUp={e => handleKeyDefault(e, NAME_KEY_CODE.flechaDerecha)}
                    />

                    <input
                        type="text"
                        className={`${style.tecla} ${style.margin_left_tecla}`}
                        value={charKeyCodeDefault[NAME_KEY_CODE.usar] || ""}
                        onChange={() => {}}
                        onKeyUp={e => handleKeyDefault(e, NAME_KEY_CODE.usar)}
                    />
                    <input
                        type="text"
                        className={style.tecla}
                        value={charKeyCodeDefault[NAME_KEY_CODE.atacar] || ""}
                        onChange={() => {}}
                        onKeyUp={e => handleKeyDefault(e, NAME_KEY_CODE.atacar)}
                    />
                    <input
                        type="text"
                        className={style.tecla}
                        value={charKeyCodeDefault[NAME_KEY_CODE.agarrar] || ""}
                        onChange={() => {}}
                        onKeyUp={e => handleKeyDefault(e, NAME_KEY_CODE.agarrar)}
                    />
                    <input
                        type="text"
                        className={style.tecla}
                        value={charKeyCodeDefault[NAME_KEY_CODE.tirar] || ""}
                        onChange={() => {}}
                        onKeyUp={e => handleKeyDefault(e, NAME_KEY_CODE.tirar)}
                    />

                    <input
                        type="text"
                        className={`${style.tecla} ${style.margin_left_tecla}`}
                        value={charKeyCodeDefault[NAME_KEY_CODE.equipar] || ""}
                        onChange={() => {}}
                        onKeyUp={e => handleKeyDefault(e, NAME_KEY_CODE.equipar)}
                    />
                    <input
                        type="text"
                        className={style.tecla}
                        value={charKeyCodeDefault[NAME_KEY_CODE.domar] || ""}
                        onChange={() => {}}
                        onKeyUp={e => handleKeyDefault(e, NAME_KEY_CODE.domar)}
                    />
                    <input
                        type="text"
                        className={style.tecla}
                        value={charKeyCodeDefault[NAME_KEY_CODE.robar] || ""}
                        onChange={() => {}}
                        onKeyUp={e => handleKeyDefault(e, NAME_KEY_CODE.robar)}
                    />
                    <input
                        type="text"
                        className={style.tecla}
                        value={charKeyCodeDefault[NAME_KEY_CODE.seguro] || ""}
                        onChange={() => {}}
                        onKeyUp={e => handleKeyDefault(e, NAME_KEY_CODE.seguro)}
                    />

                    <div className={style.default_teclas} onClick={restoreDefaultKeys} />
                    <div className={style.save_cambios} onClick={saveChangesKeys} />
                    <div className={style.reset_macros} onClick={restoreMacros} />
                </div>
            </div>

            <div
                className={style.modalReconnect}
                style={{ top: "285px", left: "638.5px" }}
            />

            <div
                className={style.modalMacro}
                style={{ display: showMacro ? "block" : "none" }}
                ref={modalMacro}
            >
                <div
                    className={`${style.cruz} ${style.closeMacro}`}
                    onClick={() => setState({ showMacroConfig: false })}
                />
                <input
                    type="text"
                    onKeyUp={handleKeyMacro}
                    className={style.keyMacro}
                    value={keyMacro.keyChar}
                    onChange={() => {}}
                />
                <div className={style.img}>
                    {keyMacro.idPosItem && keyMacro.img ? (
                        <div className={style.item} style={{ backgroundImage: `url("${keyMacro.img}")` }} />
                    ) : null}
                    {keyMacro.idSpell && keyMacro.img ? (
                        <div className={style.spell} style={{ backgroundImage: `url("${keyMacro.img}")` }} />
                    ) : null}
                </div>
                <div className={style.guardarMacro} onClick={saveMacro} />
            </div>

            <div
                className={style.modalTrade}
                style={{ display: showModalTrade ? "block" : "none" }}
            >
                <div className={style.headTrade}>
                    <div className={style.imgItemTrade}>
                        <div
                            className={style.imgItem}
                            style={{ backgroundImage: trade.imgItem ? `url("${trade.imgItem}")` : "none" }}
                        />
                    </div>
                    <div className={style.titleAndGold}>
                        <div className={style.titleItemTrade}>{trade.titleItem}</div>
                        <div className={style.infoItem}>{trade.infoItem}</div>
                        <div className={style.goldItemTrade}>{trade.goldItem}</div>
                    </div>
                    <div className={style.closeTrade} onClick={closeModalTrade} />
                </div>
                <div className={style.itemsTrade}>
                    <div className={style.trade}>{renderBoxItemsTrade()}</div>
                    <div className={style.inventary}>{renderBoxItemsUserTrade()}</div>
                </div>
                <div className={style.footerTrade}>
                    <div className={style.buttonBuy} onClick={buyTrade} />
                    <div className={style.buttonLess} />
                    <input
                        type="text"
                        className={style.cantTrade}
                        value={cantTrade}
                        onChange={e => setState({ cantTrade: e.target.value })}
                    />
                    <div className={style.buttonMore} />
                    <div className={style.buttonSell} onClick={sellTrade} />
                </div>
            </div>

            <div
                className={style.outer}
                style={{ display: loading ? "none" : "table" }}
            >
                <div className={style.middle}>
                    <div className={style.content}>
                        <div className={style.content_left}>
                            <div className={style.render}>
                                <input
                                    type="text"
                                    name="text"
                                    autoFocus
                                    ref={input => input && input.focus()}
                                    className={style.text}
                                    style={{ display: showInputText ? "block" : "none" }}
                                    value={textDialog}
                                    onChange={e => setState({ textDialog: e.target.value })}
                                />
                                <canvas
                                    width="544"
                                    height="544"
                                    id="pixi"
                                    className={style.pixi}
                                    ref={ref => { canvas.current.pixi = ref; }}
                                    onClick={clickCanvas}
                                    style={{ cursor: crosshair ? "crosshair" : "default" }}
                                />
                                <div
                                    id="console"
                                    ref={consoleRef}
                                    className={style.console}
                                    style={{ display: showConsole ? "block" : "none" }}
                                >
                                    {messagesConsole}
                                </div>
                                <div
                                    className={style.openConsole}
                                    title="Abrir o cerrar consola"
                                    onClick={openConsole}
                                >
                                    <FontAwesomeIcon icon={faComment} />
                                </div>
                            </div>

                            <div className={style.macros}>
                                {renderBoxMacros()}
                            </div>
                        </div>
                        <div className={style.content_right}>
                            <div className={style.header}>
                                <div className={style.level}>{user.level}</div>
                                <div
                                    className={style.configuration}
                                    onClick={() => {
                                        const newTmpKeys = _.cloneDeep(keyCodeDefault);
                                        const charKCs = computeCharKeyCodes(newTmpKeys, configRef.current);
                                        setState({
                                            showModalControlPanel: true,
                                            tmpKeyCodeDefault: newTmpKeys,
                                            charKeyCodeDefault: charKCs
                                        });
                                    }}
                                />
                                <div className={style.name}>{user.nameCharacter}</div>
                                <div className={style.exp}>
                                    <div
                                        className={style.progress_bar}
                                        style={{
                                            width: `${(((user.exp * 100) / user.expNextLevel) * (configRef.current ? configRef.current.xpLength : 0)) / 100}px`
                                        }}
                                    />
                                    <div className={style.porcentaje}>{`${((user.exp * 100) / user.expNextLevel).toFixed(2)}%`}</div>
                                    <div className={style.num}>{`${user.exp} / ${user.expNextLevel}`}</div>
                                </div>
                                <div className={style.buttons}>
                                    <div
                                        className={`${style.button_inv} ${!showInv ? style.buttonInvSelected : ""}`}
                                        onClick={showInventary}
                                    />
                                    <div
                                        className={`${style.button_spell} ${showInv ? style.buttonInvSelected : ""}`}
                                        onClick={showSpells}
                                    />
                                </div>
                            </div>
                            <div className={style.body}>
                                <div
                                    className={style.inventary}
                                    style={{ display: showInv ? "block" : "none" }}
                                >
                                    {renderBoxItems()}
                                </div>
                                <div
                                    className={style.spell}
                                    style={{ display: showInv ? "none" : "block" }}
                                >
                                    {renderBoxSpells()}
                                </div>
                            </div>
                            <div className={style.footer}>
                                <div className={style.info_map}>
                                    <div className={style.name_map}>{nameMap}</div>
                                    <div className={style.pos_map}>
                                        {user.pos
                                            ? `Mapa: ${configRef.current ? configRef.current.mapNumber : ""} X: ${user.pos.x} Y: ${user.pos.y}`
                                            : ""}
                                    </div>
                                </div>
                                <div className={style.left_footer}>
                                    <div className={style.hp}>
                                        <div
                                            className={style.progress_bar}
                                            style={{
                                                width: `${(user.hp * (configRef.current ? configRef.current.hpLength : 0)) / user.maxHp}px`
                                            }}
                                        />
                                        <div className={style.num}>{`${user.hp} / ${user.maxHp}`}</div>
                                    </div>
                                    <div className={style.mana}>
                                        <div
                                            className={style.progress_bar}
                                            style={{
                                                width: `${(user.mana * (configRef.current ? configRef.current.manaLength : 0)) / user.maxMana}px`
                                            }}
                                        />
                                        <div className={style.num}>{`${user.mana} / ${user.maxMana}`}</div>
                                    </div>
                                    <div className={style.gold}>{user.gold}</div>
                                    <div className={style.attr}>
                                        <div className={style.agilidad}>{user.attrAgilidad}</div>
                                        <div className={style.fuerza}>{user.attrFuerza}</div>
                                    </div>
                                </div>
                                <div className={style.right_footer}>
                                    <div
                                        className={style.minimap}
                                        style={{
                                            backgroundImage: configRef.current && configRef.current.mapNumber
                                                ? `url('/static/imgs_mapas/${configRef.current.mapNumber}.png')`
                                                : "none"
                                        }}
                                    >
                                        <div
                                            className={style.point_minimap}
                                            style={{
                                                top: user.pos ? `${user.pos.y - 1}px` : 0,
                                                left: user.pos ? `${user.pos.x - 1}px` : 0
                                            }}
                                        />
                                    </div>
                                    <div className={style.buttons_map}>
                                        <div className={style.open_map} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </React.Fragment>
    );
}

export default Play;
