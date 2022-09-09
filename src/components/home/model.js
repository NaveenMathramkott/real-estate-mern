import * as service from "./service"

export const home = {
    state: {
        apiLoading: false,
        rentalList: []
    }, // initial state
    reducers: {
        //handle before request
        onRequest(state, payload) {
            return {
                ...state,
                apiLoading: true
            }
        },
        onError(state, err) {
            console.log(err , "error ==")
            return {
                ...state,
                apiLoading: false
            }
        },
        onSuccess(state, message) {
            return {
                ...state,
                apiLoading: false
            }
        },
        fetchallrentalSuccess(state, response) {
            return {
                ...state,
                apiLoading: false,
                rentalList: response.response
            }
        },
        addrentalFromAdminSuccess(state, response) {
            return {
                ...state,
                apiLoading: false
            }
        },
    },
    effects: (dispatch) => ({
        // handle state changes with impure functions.
        // use async/await for async actions
        async fetchAllRental(payload, rootState) {

            dispatch.home.onRequest()
            try {
                let res = await service.fetchAllRental(payload)
                console.log(res ,"called")
                dispatch.home.fetchallrentalSuccess(res);
            } catch (e) {
                dispatch.home.onError(e);
            }
        },
        async addrentalFromAdmin(payload, rootState) {

            dispatch.home.onRequest()
            try {
                let res = await service.addrentalFromAdmin(payload)
                dispatch.home.addrentalFromAdminSuccess(res);
            } catch (e) {
                dispatch.home.onError(e);
            }
        },


    }),
};