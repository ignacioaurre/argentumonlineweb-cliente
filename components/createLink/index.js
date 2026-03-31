import Link from "next/link";
import { buildUrl } from "../../config/utils";

function CreateLink({ children, href, className, style, onClick }) {
    const url = buildUrl(href);
    return (
        <Link href={url.href} as={url.as} className={className} style={style} onClick={onClick}>
            {children}
        </Link>
    );
}

export default CreateLink;
