import React, { useState } from "react";
import style from "./style.module.scss";

import { fetchUrl } from "../../config/utils";
import useStore from "../../store/useStore";

import CreateLink from "../createLink/index";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSignOutAlt } from "@fortawesome/free-solid-svg-icons";

function Login() {
    const account = useStore(state => state.account);
    const setAccount = useStore(state => state.setAccount);

    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const handleLogin = async () => {
        if (!name || !password) return;

        const result = await fetchUrl("/login", {
            method: "POST",
            body: JSON.stringify({ name, password }),
            headers: { "Content-Type": "application/json" },
            credentials: "include"
        });

        if (result.error) {
            setErrorMessage(result.message);
            return;
        }

        setAccount(result);
    };

    const handleLogout = () => {
        setAccount({});
        fetchUrl("/logout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include"
        });
    };

    return (
        <div className={style.servidores}>
            <div className={style.svtitulo}>
                <img src="/static/imgs/deco.png" alt="" />
                <p className={style.servidorTxt}>SERVIDOR</p>
                <p className={style.cantUser} style={{ color: "green" }}>Online</p>
            </div>

            {account.accountId ? (
                <div className={style.login} style={{ height: "150px" }}>
                    <div className={style.avatar}>
                        <img src="/static/imgs/logo-aoweb.png" alt="" />
                        <a onClick={handleLogout}>
                            SALIR <FontAwesomeIcon icon={faSignOutAlt} />
                        </a>
                    </div>
                    <span className={style.name}>{account.name}</span>
                </div>
            ) : (
                <div className={style.login} style={{ height: "140px" }}>
                    <div className={style.user}>
                        <p>USUARIO</p>
                        <div className={style.contentInput}>
                            <input
                                type="text"
                                name="name"
                                id="name"
                                value={name}
                                onChange={e => setName(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className={style.pass}>
                        <p>CONTRASEÑA</p>
                        <div className={style.contentInput}>
                            <input
                                type="password"
                                name="password"
                                id="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {errorMessage && (
                        <p style={{ color: "#ff4444", fontSize: "12px", margin: "4px 0", textAlign: "center" }}>
                            {errorMessage}
                        </p>
                    )}

                    <CreateLink
                        href="/register"
                        style={{ textDecoration: "none", color: "#006e2e", marginRight: "44px" }}
                    >
                        CREAR CUENTA
                    </CreateLink>

                    <button
                        onClick={handleLogin}
                        className={style.bold}
                        style={{ color: "#ff9000", marginRight: "29px" }}
                    >
                        ENTRAR
                    </button>
                </div>
            )}
        </div>
    );
}

export default Login;
