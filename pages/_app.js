import React, { useEffect } from "react";
import Head from "../components/Head";
import useStore from "../store/useStore";

import "@fortawesome/fontawesome-svg-core/styles.css";
import "../styles/style.scss";

import { config as configFA } from "@fortawesome/fontawesome-svg-core";
configFA.autoAddCss = false;

import { fetchUrl } from "../config/utils";
function MyApp({ Component, pageProps }) {
    const setAccount = useStore(state => state.setAccount);
    const setAccountLoaded = useStore(state => state.setAccountLoaded);

    useEffect(() => {
        if (pageProps.initialAccount) {
            setAccount(pageProps.initialAccount);
            return;
        }

        let ignore = false;

        fetchUrl("/checkuserlogged", {
            credentials: "include"
        })
            .then(result => {
                if (ignore) return;
                if (result && !result.err) {
                    setAccount(result);
                } else {
                    setAccountLoaded(true);
                }
            })
            .catch(() => {
                if (!ignore) {
                    setAccountLoaded(true);
                }
            });

        return () => {
            ignore = true;
        };
    }, [pageProps.initialAccount, setAccount, setAccountLoaded]);

    return (
        <React.Fragment>
            <Head />
            <Component {...pageProps} />
        </React.Fragment>
    );
}

export default MyApp;
