import React from "react";
import CreateLink from "../../components/createLink/index";
import MainContainer from "../../components/mainContainer/index";
import MobileDetect from "mobile-detect";
import style from "./style.module.scss";

function Home({ userAgent }) {
    const md = new MobileDetect(userAgent);

    return (
        <MainContainer userAgent={userAgent}>
            <div className={style.gralinfo}>
                <div className={style.shadow}>
                    <h2>¡Bienvenidos a Argentum Online Web!</h2>
                    {!md.mobile() && (
                        <p>
                            <CreateLink href="/register">
                                Regístrate
                            </CreateLink>{" "}
                            o <strong>Ingresa</strong> para poder jugar!
                        </p>
                    )}
                    <p>
                        Síguenos en nuestra página de{" "}
                        <a
                            href="https://www.facebook.com/ArgentumOnlineWeb"
                            rel="noreferrer"
                            target="_blank"
                        >
                            Facebook
                        </a>
                        !
                    </p>
                </div>
            </div>
        </MainContainer>
    );
}

Home.getInitialProps = async ({ req }) => {
    const userAgent = req ? req.headers["user-agent"] : navigator.userAgent;
    return { userAgent };
};

export default Home;
