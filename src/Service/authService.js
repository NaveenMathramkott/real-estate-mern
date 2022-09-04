import axios from "axios";

const API_URL = "https://futurerightwings.com/rentsys/api/auth/";
const API_URL_KYC = "https://futurerightwings.com/createkyc/api/items";

export const registerAuth = ({ username, email, password }) => {
  return axios.post(API_URL + "signup", {
    username,
    email,
    password,
  });
};

export const loginAuth = ({ username, password }) => {
  return axios
    .post(API_URL + "signin", {
      username,
      password,
    })
    .then((response) => {
      if (response.data.accessToken) {
        localStorage.setItem("user", JSON.stringify(response.data));
      }
      return response.data;
    });
};
export const kycFormPost = ({
  firstName,
  lastName,
  address,
  email,
  mobile,
  idNo,
  location,
}) => {
  return axios.post(API_URL_KYC, {
    firstName,
    lastName,
    address,
    email,
    mobile,
    idNo,
    location,
  });
};

//   logout() {
//     localStorage.removeItem("user");
//   }

//   getCurrentUser() {
//     return JSON.parse(localStorage.getItem("user"));
//   }
// }

// export default new AuthService();
