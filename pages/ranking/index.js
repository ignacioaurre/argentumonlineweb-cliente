import React from "react";
import MainContainer from "../../components/mainContainer/index";
import inits from "../../engine/inits";
import { fetchUrl } from "../../config/utils";
import { nameClases } from "../../config/config";
import useStore from "../../store/useStore";
import style from "./style.module.scss";

function Ranking({ rankingList, userAgent }) {
    const initsLoaded = useStore(state => state.initsLoaded);

    if (typeof window !== "undefined" && initsLoaded) {
        rankingList.forEach((character, index) => {
            let idHead = (character.navegando || character.dead) ? character.idLastHead : character.idHead;
            let idBody = (character.navegando || character.dead) ? character.idLastBody : character.idBody;
            const idHelmet = character.idHelmet;

            const grhCabeza = idHead ? inits.heads[idHead][2] : "";
            const graphicGrhHead = inits.graphics[grhCabeza];

            const grhHelmet = idHelmet ? inits.cascos[idHelmet] : "";
            const graphicGrhHelmet = inits.graphics[grhHelmet[2]];

            const grhRopa = idBody ? inits.bodies[idBody][2] : "";
            const currentGrhRopa = inits.graphics[grhRopa].frames[1];
            const graphicsGrhRopa = inits.graphics[currentGrhRopa];

            rankingList[index].headNumFile = graphicGrhHead.numFile || "";
            rankingList[index].helmetNumFile = graphicGrhHelmet.numFile || "";
            rankingList[index].helmetOffsetY = grhHelmet.offsetY || "";
            rankingList[index].bodyNumFile = graphicsGrhRopa.numFile || "";

            if (character.idRaza == 4 || character.idRaza == 5) {
                rankingList[index].posY = "-9px";
            }
        });
    }

    return (
        <MainContainer userAgent={userAgent}>
            <div className={style.contentLeft}>
                <div className={style.shadow}>
                    <h4>Ranking</h4>
                    <div className={style.tabs}>
                        <div className={`${style.tab} ${style.tabActive}`}>
                            <span>General</span>
                            <div className={style.line} />
                        </div>
                    </div>

                    <div
                        className={`${style.contentBox} ${style.contentBoxRanking}`}
                        style={{ height: "auto" }}
                    >
                        <div className={style.tableHeader}>
                            <div className={`${style.rank} ${style.rankGeneral}`}>Ranking</div>
                            <div className={`${style.name} ${style.nameGeneral}`}>Nombre</div>
                            <div className={style.levelGeneral}>Nivel</div>
                            <div className={style.claseGeneral}>Clase</div>
                            <div className={`${style.kills} ${style.killsGeneral}`}>Asesinatos</div>
                        </div>

                        {rankingList.map((character, key) => (
                            <div className={style.row} key={key}>
                                <div className={`${style.rank} ${style.rankGeneral}`} style={{ height: "60px", padding: 0 }}>
                                    <span>{key + 1}.</span>
                                </div>
                                <div className={`${style.name} ${style.nameGeneral}`} style={{ height: "60px", padding: 0 }}>
                                    <a>
                                        <div className={style.character}>
                                            <div
                                                className={style.bodyImgCharacter}
                                                style={{
                                                    backgroundImage: character.bodyNumFile ? `url("/static/graficos/${character.bodyNumFile}.png")` : "none",
                                                    backgroundPositionY: character.posY || 0
                                                }}
                                            />
                                            <div
                                                className={style.headImgCharacter}
                                                style={{
                                                    backgroundImage: character.headNumFile ? `url("/static/graficos/${character.headNumFile}.png")` : ""
                                                }}
                                            />
                                            <div
                                                className={style.helmetImgCharacter}
                                                style={{
                                                    backgroundImage: character.helmetNumFile ? `url("/static/graficos/${character.helmetNumFile}.png")` : "",
                                                    backgroundPositionY: character.helmetOffsetY || 0
                                                }}
                                            />
                                        </div>
                                        <span style={{ color: character.criminal ? "red" : "blue" }}>
                                            {character.name}
                                        </span>
                                    </a>
                                </div>
                                <div className={style.levelGeneral} style={{ height: "60px", padding: 0 }}>
                                    <span>{character.level}</span>
                                </div>
                                <div className={style.claseGeneral} style={{ height: "60px", padding: 0 }}>
                                    <span>{nameClases[character.idClase]}</span>
                                </div>
                                <div className={`${style.kills} ${style.killsGeneral}`} style={{ height: "60px", padding: 0 }}>
                                    <span>{character.ciudadanosMatados + character.criminalesMatados}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </MainContainer>
    );
}

Ranking.getInitialProps = async ({ req }) => {
    const result = await fetchUrl("/ranking/general");
    const userAgent = req ? req.headers["user-agent"] : navigator.userAgent;
    return { rankingList: result, userAgent };
};

export default Ranking;
