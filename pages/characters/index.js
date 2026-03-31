import React, { useEffect, useRef, useState } from "react";
import MainContainer from "../../components/mainContainer/index";
import CreateLink from "../../components/createLink/index";
import { fetchAccountFromRequest, fetchUrl, routerPush } from "../../config/utils";
import pvpChars from "../../config/pvpChars.json";
import inits from "../../engine/inits";
import RenderCharacters from "../../engine/renderCharacters";
import useStore from "../../store/useStore";
import style from "./style.module.scss";

function Characters({ userAgent, initialAccount }) {
    const account = useStore(state => state.account);
    const accountLoaded = useStore(state => state.accountLoaded);
    const initsLoaded = useStore(state => state.initsLoaded);
    const setAccount = useStore(state => state.setAccount);
    const setAccountLoaded = useStore(state => state.setAccountLoaded);

    const [characters, setCharacters] = useState([]);
    const [typeGame, setTypeGame] = useState("PvE");
    const canvasRefs = useRef([]);

    const currentAccount = account.accountId ? account : initialAccount || {};
    const displayedCharacters = typeGame === "PvE" ? characters : pvpChars;

    useEffect(() => {
        if (initialAccount && initialAccount.accountId) {
            setAccount(initialAccount);
        }
    }, [initialAccount, setAccount]);

    useEffect(() => {
        if (currentAccount.accountId) {
            return;
        }

        let ignore = false;

        fetchUrl("/checkuserlogged", {
            credentials: "include"
        })
            .then(result => {
                if (ignore) return;

                if (result && !result.err && result.accountId) {
                    setAccount(result);
                    return;
                }

                setAccountLoaded(true);
                routerPush("/register");
            })
            .catch(() => {
                if (!ignore) {
                    setAccountLoaded(true);
                    routerPush("/register");
                }
            });

        return () => {
            ignore = true;
        };
    }, [currentAccount.accountId, setAccount, setAccountLoaded]);

    useEffect(() => {
        if (!currentAccount.accountId) {
            return;
        }

        fetchUrl("/characters").then(result => {
            setCharacters(Array.isArray(result) ? result : []);
        });
    }, [currentAccount.accountId]);

    useEffect(() => {
        if (!initsLoaded) {
            return;
        }

        canvasRefs.current.forEach(canvas => {
            if (canvas) {
                const ctx = canvas.getContext("2d");
                ctx.clearRect(0, 0, 80, 100);
            }
        });

        displayedCharacters.forEach((character, index) => {
            const canvas = canvasRefs.current[index];

            if (!canvas || !character) {
                return;
            }

            const ctx = canvas.getContext("2d");
            const rndChar = new RenderCharacters(inits, ctx, character, 24, 60);
            rndChar.drawChar();
        });
    }, [displayedCharacters, initsLoaded]);

    const play = (character, key) => {
        if (!character) {
            return routerPush("/createCharacter");
        }

        window.localStorage.setItem("idAccount", currentAccount.accountId);
        window.localStorage.setItem("email", currentAccount.email);

        if (typeGame === "PvE") {
            window.localStorage.setItem("idCharacter", character._id);
            window.localStorage.removeItem("idChar");
        } else {
            window.localStorage.setItem("idChar", key);
            window.localStorage.removeItem("idCharacter");
        }

        window.localStorage.setItem("typeGame", typeGame === "PvE" ? 1 : 2);

        window.location.href = "/play";
    };

    return (
        <MainContainer userAgent={userAgent}>
            <div className={style.contentLeft}>
                <div className={style.shadow}>
                    <h4>Seleccionar Personaje</h4>

                    <div className={style.tabs}>
                        <button
                            className={`${style.tab} ${typeGame === "PvE" ? style.tabActive : ""}`}
                            onClick={() => setTypeGame("PvE")}
                        >
                            PvE
                        </button>
                        <button
                            className={`${style.tab} ${typeGame === "PvP" ? style.tabActive : ""}`}
                            onClick={() => setTypeGame("PvP")}
                        >
                            PvP
                        </button>
                    </div>

                    <div className={style.grid}>
                        {Array.from({ length: 10 }, (_, i) => {
                            const character = displayedCharacters[i];
                            const isEmptyPveSlot = typeGame === "PvE" && !character;

                            return (
                                <button
                                    key={i}
                                    className={`${style.card} ${isEmptyPveSlot ? style.cardEmpty : ""}`}
                                    onClick={() => play(character, i)}
                                >
                                    <span className={style.name}>
                                        {character ? character.name : "Slot vacío"}
                                    </span>
                                    <canvas
                                        ref={ref => { canvasRefs.current[i] = ref; }}
                                        className={style.canvas}
                                        width="80"
                                        height="100"
                                    />
                                    <span className={style.meta}>
                                        {character ? "Jugar" : "Crear personaje"}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <div className={style.actions}>
                        <CreateLink href="/" className={style.linkSecondary}>
                            Volver
                        </CreateLink>
                        <CreateLink href="/createCharacter" className={style.linkPrimary}>
                            Crear Personaje
                        </CreateLink>
                    </div>
                </div>
            </div>
        </MainContainer>
    );
}

Characters.getInitialProps = async ({ req, res }) => {
    const account = await fetchAccountFromRequest(req);

    if (req && !account.accountId) {
        res.writeHead(302, { Location: "/register" });
        res.end();
        return res.finished = true;
    }

    const userAgent = req ? req.headers["user-agent"] : navigator.userAgent;

    return {
        userAgent,
        initialAccount: account
    };
};

export default Characters;
