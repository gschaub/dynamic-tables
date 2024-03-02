
import * as selectors from "./selectors";
import * as actions from "./actions";
import reducer from "./reducer";
import * as resolvers from "./resolvers";
// import { controls } from "@wordpress/data-controls";

export { default as STORE_NAME } from "./constants";
export const storeConfig = () => ({
    selectors,
    actions,
    reducer,
    resolvers
    // controls
});
