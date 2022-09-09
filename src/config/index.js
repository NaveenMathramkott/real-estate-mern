// =====need to config env ======
import { routes } from "./apiRoutes";


const serverPath = {
    development: "https://futurerightwings.com/rentiseazyapi/",
}
let api = "api"

let appEnvironment = process.env.REACT_APP_ENV || "development"

let serverApi = serverPath[appEnvironment]
let imageUrl = "https://futurerightwings.com/rentiseazyapi/uploads/"
const server = `${serverApi}${api}`

let config = {
    routes,
    server,
    imageUrl
}

export default config