import axios from "axios";

const apiCall = axios.create({
  baseURL: `${process.env.REACT_APP_PUBLIC_URL}/api/v1`,
  withCredentials: true,
});

export default apiCall;
