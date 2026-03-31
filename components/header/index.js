import React, { useEffect } from "react";
import style from "./style.module.scss";

import { fetchUrl, routerPush } from "../../config/utils";
import useStore from "../../store/useStore";

import inits from "../../engine/inits";

import CreateLink from "../createLink/index";

import MobileDetect from "mobile-detect";

function Header({ userAgent }) {
    const account = useStore(state => state.account);
    const accountLoaded = useStore(state => state.accountLoaded);
    const setAccount = useStore(state => state.setAccount);
    const setAccountLoaded = useStore(state => state.setAccountLoaded);
    const setInitsLoaded = useStore(state => state.setInitsLoaded);

    useEffect(() => {
        inits.initialize().then(() => setInitsLoaded(true));
    }, []);

    const openCharactersPage = async () => {
        const md = new MobileDetect(userAgent);

        if (md.mobile()) {
            alert("Argentum Online Web no está disponible para celulares.");
            return;
        }

        if (!account.accountId) {
            if (!accountLoaded) {
                const result = await fetchUrl("/checkuserlogged", {
                    credentials: "include"
                }).catch(() => null);

                if (result && !result.err && result.accountId) {
                    setAccount(result);
                    return routerPush("/characters");
                }

                setAccountLoaded(true);
            }

            return routerPush("/register");
        }

        return routerPush("/characters");
    };

    return (
        <React.Fragment>
            <div className={style.logo}>
                <CreateLink href="/">
                    <img src="/static/imgs/logo.png" alt="logo" />
                </CreateLink>
            </div>

            <nav className={style.nav}>
                <ul>
                    <CreateLink href="/">
                        <li className={style.inicio}>INICIO</li>
                    </CreateLink>
                    <li className={style.jugar} onClick={openCharactersPage} style={{ cursor: "pointer" }} />
                    <CreateLink href="/ranking">
                        <li className={style.inicio}>RANKING</li>
                    </CreateLink>
                </ul>
            </nav>
        </React.Fragment>
    );
}

export default Header;
