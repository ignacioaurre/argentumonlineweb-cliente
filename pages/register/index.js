import React, { useState } from "react";
import MainContainer from "../../components/mainContainer/index";
import { fetchAccountFromRequest, fetchUrl, routerPush } from "../../config/utils";
import useStore from "../../store/useStore";
import style from "./style.module.scss";

function Register({ userAgent }) {
    const setAccount = useStore(state => state.setAccount);

    const [form, setForm] = useState({ name: "", password: "", repassword: "", email: "" });
    const [errorMessage, setErrorMessage] = useState("");

    const handleInput = e => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        const { name, password, repassword, email } = form;

        if (!name || !password || !repassword || !email) {
            setErrorMessage("Faltan campos por completar.");
            return;
        }

        if (password !== repassword) {
            setErrorMessage("Las contraseñas no coinciden.");
            return;
        }

        const regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if (!regex.test(email.toLowerCase())) {
            setErrorMessage("El email no es válido.");
            return;
        }

        const result = await fetchUrl("/register", {
            method: "POST",
            body: JSON.stringify({ name, password, email: email.toLowerCase() }),
            headers: { "Content-Type": "application/json" },
            credentials: "include"
        });

        if (result.error) {
            setErrorMessage(result.message);
            return;
        }

        setAccount(result);
        routerPush("/");
    };

    const { name, password, repassword, email } = form;

    return (
        <MainContainer userAgent={userAgent}>
            <div className={style.contentLeft}>
                <div className={style.shadow}>
                    <h4>Registro</h4>
                    <div className={style.register}>
                        <div className={style.form}>
                            <div className={style.groupInput}>
                                <label htmlFor="">USUARIO </label>
                                <input
                                    type="text"
                                    className={style.inputText}
                                    name="name"
                                    value={name}
                                    onChange={handleInput}
                                />
                            </div>

                            <div className={style.groupInput}>
                                <label htmlFor="">CONTRASEÑA </label>
                                <input
                                    type="password"
                                    className={style.inputText}
                                    name="password"
                                    value={password}
                                    onChange={handleInput}
                                />
                            </div>

                            <div className={style.groupInput}>
                                <label htmlFor="">RE-CONTRASEÑA </label>
                                <input
                                    type="password"
                                    className={style.inputText}
                                    name="repassword"
                                    value={repassword}
                                    onChange={handleInput}
                                />
                            </div>

                            <div className={style.groupInput}>
                                <label htmlFor="">E-MAIL </label>
                                <input
                                    type="text"
                                    className={style.inputText}
                                    name="email"
                                    value={email}
                                    onChange={handleInput}
                                />
                            </div>

                            {errorMessage && (
                                <p style={{ color: "#ff4444", fontSize: "13px", marginBottom: "8px" }}>
                                    {errorMessage}
                                </p>
                            )}

                            <button className={style.buttonRegister} onClick={handleSave}>
                                Registrarse
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </MainContainer>
    );
}

Register.getInitialProps = async ({ req, res }) => {
    const account = await fetchAccountFromRequest(req);

    if (account && account.accountId) {
        if (req) {
            res.writeHead(302, { Location: "/" });
            res.end();
            return (res.finished = true);
        } else {
            routerPush("/");
        }
    }
    const userAgent = req ? req.headers["user-agent"] : navigator.userAgent;
    return { userAgent };
};

export default Register;
