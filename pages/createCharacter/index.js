import React, { useState, useEffect, useRef } from "react";
import MainContainer from "../../components/mainContainer/index";

import inits from "../../engine/inits";
import RenderCharacters from "../../engine/renderCharacters";

import { fetchAccountFromRequest, fetchUrl, routerPush } from "../../config/utils";
import { clases, razas, nameClases, nameGeneros, nameRazas } from "../../config/config";

import useStore from "../../store/useStore";
import style from "./style.module.scss";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleLeft, faAngleRight } from "@fortawesome/free-solid-svg-icons";

const HEAD_RANGES = {
    [razas.humano]:   { first: 1,   last: 40  },
    [razas.elfo]:     { first: 101, last: 122 },
    [razas.elfoDrow]: { first: 201, last: 221 },
    [razas.enano]:    { first: 301, last: 319 },
    [razas.gnomo]:    { first: 401, last: 416 },
};

const RAZA_BODIES = {
    [razas.humano]:   1,
    [razas.elfo]:     2,
    [razas.elfoDrow]: 3,
    [razas.enano]:    300,
    [razas.gnomo]:    300,
};

function CreateCharacter({ userAgent }) {
    const account = useStore(state => state.account);
    const accountLoaded = useStore(state => state.accountLoaded);
    const initsLoaded = useStore(state => state.initsLoaded);
    const setAccount = useStore(state => state.setAccount);
    const canvasRef = useRef(null);

    const [charName, setCharName] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const [idClaseSelected, setIdClaseSelected] = useState(1);
    const [idRazaSelected, setIdRazaSelected] = useState(1);
    const [idGeneroSelected, setIdGeneroSelected] = useState(1);
    const [idHeadSelected, setIdHeadSelected] = useState(1);
    const [character, setCharacter] = useState({
        idBody: 1, idHead: 1, idWeapon: 48, idShield: 0, idHelmet: 0, idGenero: 1
    });
    const [nameClase, setNameClase] = useState(nameClases[1]);
    const [nameRaza, setNameRaza] = useState(nameRazas[1]);
    const [nameGenero, setNameGenero] = useState(nameGeneros[1]);

    useEffect(() => {
        if (initsLoaded && canvasRef.current) {
            const ctx = canvasRef.current.getContext("2d");
            const rndChar = new RenderCharacters(inits, ctx, character, 24, 60);
            rndChar.drawChar();
        }
    }, [character, initsLoaded]);

    useEffect(() => {
        if (account.accountId || !accountLoaded) {
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

                routerPush("/register");
            })
            .catch(() => {
                if (!ignore) {
                    routerPush("/register");
                }
            });

        return () => {
            ignore = true;
        };
    }, [account.accountId, accountLoaded, setAccount]);

    const handleCreate = async () => {
        if (!charName.trim()) {
            setErrorMessage("Ingresá un nombre para el personaje.");
            return;
        }

        setLoading(true);
        setErrorMessage("");

        const result = await fetchUrl("/character", {
            method: "POST",
            body: JSON.stringify({
                name: charName.trim(),
                idClase: idClaseSelected,
                idRaza: idRazaSelected,
                idGenero: idGeneroSelected,
                idHead: idHeadSelected,
            }),
            headers: { "Content-Type": "application/json" },
            credentials: "include"
        });

        setLoading(false);

        if (result.error) {
            setErrorMessage(result.message);
            return;
        }

        routerPush("/");
    };

    const prevHead = () => {
        const { first } = HEAD_RANGES[idRazaSelected] || HEAD_RANGES[razas.humano];
        if (idHeadSelected > first) {
            const newHead = idHeadSelected - 1;
            setIdHeadSelected(newHead);
            setCharacter(prev => ({ ...prev, idHead: newHead }));
        }
    };

    const nextHead = () => {
        const { last } = HEAD_RANGES[idRazaSelected] || HEAD_RANGES[razas.humano];
        if (idHeadSelected < last) {
            const newHead = idHeadSelected + 1;
            setIdHeadSelected(newHead);
            setCharacter(prev => ({ ...prev, idHead: newHead }));
        }
    };

    const prevClase = () => {
        if (idClaseSelected > 1) {
            let newClase = idClaseSelected - 1;
            if (newClase === 5) newClase--;
            setIdClaseSelected(newClase);
            setNameClase(nameClases[newClase]);
            setCharacter(prev => ({ ...prev, idWeapon: newClase === clases.cazador ? 40 : 48 }));
        }
    };

    const nextClase = () => {
        if (idClaseSelected < 9) {
            let newClase = idClaseSelected + 1;
            if (newClase === 5) newClase++;
            setIdClaseSelected(newClase);
            setNameClase(nameClases[newClase]);
            setCharacter(prev => ({ ...prev, idWeapon: newClase === clases.cazador ? 40 : 48 }));
        }
    };

    const prevRaza = () => {
        if (idRazaSelected > 1) {
            const newRaza = idRazaSelected - 1;
            const { first } = HEAD_RANGES[newRaza] || HEAD_RANGES[razas.humano];
            setIdRazaSelected(newRaza);
            setIdHeadSelected(first);
            setNameRaza(nameRazas[newRaza]);
            setCharacter(prev => ({ ...prev, idBody: RAZA_BODIES[newRaza], idHead: first }));
        }
    };

    const nextRaza = () => {
        if (idRazaSelected < 5) {
            const newRaza = idRazaSelected + 1;
            const { first } = HEAD_RANGES[newRaza] || HEAD_RANGES[razas.humano];
            setIdRazaSelected(newRaza);
            setIdHeadSelected(first);
            setNameRaza(nameRazas[newRaza]);
            setCharacter(prev => ({ ...prev, idBody: RAZA_BODIES[newRaza], idHead: first }));
        }
    };

    const prevGenero = () => {
        if (idGeneroSelected > 1) {
            const newGenero = idGeneroSelected - 1;
            setIdGeneroSelected(newGenero);
            setNameGenero(nameGeneros[newGenero]);
            setCharacter(prev => ({ ...prev, idGenero: newGenero }));
        }
    };

    const nextGenero = () => {
        if (idGeneroSelected < 2) {
            const newGenero = idGeneroSelected + 1;
            setIdGeneroSelected(newGenero);
            setNameGenero(nameGeneros[newGenero]);
            setCharacter(prev => ({ ...prev, idGenero: newGenero }));
        }
    };

    return (
        <MainContainer userAgent={userAgent}>
            <div className={style.contentLeft}>
                <div className={style.shadow}>
                    <h4>Crear Personaje</h4>
                    <div className={style.createCharacter}>
                        <div className={style.content_general}>
                            <div className={style.content_left}>
                                <label htmlFor="charName" className={style.text}>Nombre</label>
                                <input
                                    type="text"
                                    className={style.input_text}
                                    id="charName"
                                    value={charName}
                                    onChange={e => setCharName(e.target.value)}
                                    maxLength={20}
                                    placeholder="Nombre del personaje"
                                />
                                <div className={style.canvasCharacter}>
                                    <FontAwesomeIcon icon={faAngleLeft} className={style.faAngleLeft} onClick={prevHead} />
                                    <canvas ref={canvasRef} className={style.character} width="80" height="100" />
                                    <FontAwesomeIcon icon={faAngleRight} className={style.faAngleRight} onClick={nextHead} />
                                </div>
                            </div>
                            <div className={style.content_right}>
                                <label htmlFor="clase" className={style.text}>Clase</label>
                                <div className={style.content_input_text}>
                                    <FontAwesomeIcon icon={faAngleLeft} className={style.faAngleLeft} onClick={prevClase} />
                                    <input type="text" className={style.input_text} id="clase" disabled readOnly value={nameClase} />
                                    <FontAwesomeIcon icon={faAngleRight} className={style.faAngleRight} onClick={nextClase} />
                                </div>

                                <label htmlFor="raza" className={style.text}>Raza</label>
                                <div className={style.content_input_text}>
                                    <FontAwesomeIcon icon={faAngleLeft} className={style.faAngleLeft} onClick={prevRaza} />
                                    <input type="text" className={style.input_text} id="raza" disabled readOnly value={nameRaza} />
                                    <FontAwesomeIcon icon={faAngleRight} className={style.faAngleRight} onClick={nextRaza} />
                                </div>

                                <label htmlFor="genero" className={style.text}>Género</label>
                                <div className={style.content_input_text}>
                                    <FontAwesomeIcon icon={faAngleLeft} className={style.faAngleLeft} onClick={prevGenero} />
                                    <input type="text" className={style.input_text} id="genero" disabled readOnly value={nameGenero} />
                                    <FontAwesomeIcon icon={faAngleRight} className={style.faAngleRight} onClick={nextGenero} />
                                </div>

                                <label htmlFor="ciudad" className={style.text}>Ciudad</label>
                                <div className={`${style.content_input_text} ${style.margin_left}`}>
                                    <input type="text" className={style.input_text} id="ciudad" disabled readOnly value="Ullathorpe" />
                                </div>
                            </div>
                        </div>

                        {errorMessage && (
                            <p style={{ color: "#ff4444", fontSize: "13px", margin: "8px 0" }}>
                                {errorMessage}
                            </p>
                        )}

                        <button onClick={handleCreate} disabled={loading}>
                            {loading ? "Creando..." : "Crear personaje"}
                        </button>
                    </div>
                </div>
            </div>
        </MainContainer>
    );
}

CreateCharacter.getInitialProps = async ({ req, res }) => {
    const account = await fetchAccountFromRequest(req);

    if (account && !account.accountId && req) {
        res.writeHead(302, { Location: "/register" });
        res.end();
        return res.finished = true;
    }

    const userAgent = req ? req.headers["user-agent"] : navigator.userAgent;
    return { userAgent, initialAccount: account };
};

export default CreateCharacter;
