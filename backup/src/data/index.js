import {
    STORE_KEY as TABLE_STORE_KEY,
    STORE_CONFIG as tableConfig
} from "./table";
import { registerStore } from "@wordpress/data";

registerStore(TABLE_STORE_KEY, tableConfig);

export { TABLE_STORE_KEY };