import { api, catchHandler } from "../../helperFunctions/axios";
import config from "../../config"

export function locationAutocomplte(location) {
    console.log(config , "config")
    return api()
        .put(`${config.routes.rentalList}/${location}`)
        .then(res => res.data)
        .catch((err) => catchHandler(err))
}