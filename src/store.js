//common store for redux
import { init } from "@rematch/core";
import * as models from "./models";

//initilaising store

const store = init({ models });

export default store;
