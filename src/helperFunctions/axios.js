
import axios from "axios"
import config from "../config"

export function api() {
    const opts = {
        //config header
        baseURL: config.server,
    }
    return axios.create(opts)
}
export function catchHandler(e) {
    console.log(e, "axios error =============>")
    throw e
}