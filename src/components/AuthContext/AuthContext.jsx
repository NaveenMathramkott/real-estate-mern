import React from "react";

const AuthContext = React.createContext({ status: null, login: () => {} });

export default AuthContext;
