import * as service from "./service"

export const home = {
    state: {
        apiLoading: false,
        locationAutoComplete: []
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
        locationAutocomplteSuccess(state, response) {
            return {
                ...state,
                apiLoading: false,
                locationAutoComplete: response.response
            }
        },
    },
    effects: (dispatch) => ({
        // handle state changes with impure functions.
        // use async/await for async actions
        async locationAutocomplte(payload, rootState) {

            dispatch.home.onRequest()
            try {
                let res = await service.locationAutocomplte(payload)
                console.log(res ,"called")
                dispatch.home.locationAutocomplteSuccess(res);
            } catch (e) {
                dispatch.home.onError(e);
            }
        },


    }),
};