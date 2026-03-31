import React from "react";
import style from "./style.module.scss";

import Header from "../header/index";
import Login from "../login/index";

function MainContainer({ userAgent, children }) {
    return (
        <div className={style.container}>
            <Header userAgent={userAgent} />
            {children}
            <Login />
        </div>
    );
}

export default MainContainer;
