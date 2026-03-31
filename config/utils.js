import Router from "next/router";
import urls from "./urls.json";
import fetch from "isomorphic-fetch";
import _ from "lodash";

function getApiBaseUrl() {
    if (typeof window !== "undefined") {
        return "/api";
    }

    if (process.env.INTERNAL_API_URL) {
        return process.env.INTERNAL_API_URL.replace(/\/$/, "");
    }

    if (process.env.NEXT_PUBLIC_API_URL) {
        return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
    }

    const port = process.env.PORT || 3000;
    return `http://localhost:${port}/api`;
}

export async function fetchUrl(url, options = {}) {
    const response = await fetch(getApiBaseUrl() + url, options);

    const result = await response.json();

    return result;
}

export async function fetchAccountFromRequest(req) {
    if (!req) {
        return {};
    }

    const result = await fetchUrl("/checkuserlogged", {
        credentials: "include",
        headers: { cookie: req.headers.cookie || "" }
    });

    return result && !result.err ? result : {};
}

export function routerPush(href, query = "", blank) {
    if (blank) {
        return window.open(href, "_blank");
    }

    const url = buildUrl(href);

    Router.push(url.href + query, url.as + query);
}

export function buildUrl(href) {
    const splitHref = href.split("/");

    if (splitHref.length > 2) {
        for (let index in urls) {
            if (index.indexOf("/" + splitHref[1]) > -1) {
                let asHref = urls[index];
                let tmpUrl = href.replace("/" + splitHref[1], "");

                return {
                    href: asHref + tmpUrl,
                    as: href
                };
            }
        }
    }

    return {
        href: urls[href],
        as: href
    };
}
