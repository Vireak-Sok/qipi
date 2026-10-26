import { readFile, writeFile } from "node:fs/promises";
import { pageMarkup } from "../src/ui/shell.mjs";
const head = await readFile(new URL("../src/ui/document-head.html", import.meta.url), "utf8");
await writeFile(new URL("../public/index.html", import.meta.url), head + '<body class="social-app">\n' + pageMarkup + '\n</body>\n</html>\n');
