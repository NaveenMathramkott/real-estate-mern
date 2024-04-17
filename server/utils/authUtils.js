import bcrypt from "bcrypt";
import JWT from "jsonwebtoken";

// Password hashing function
export const hashPassword = async (password) => {
  try {
    const slatRounds = 10;
    const hashedPassword = await bcrypt.hash(password, slatRounds);
    return hashedPassword;
  } catch (error) {
    console.log(`Error hashing password`);
  }
};

// Password comparing function
export const comparePassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

// Token verify function
export const verifyToken = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) return res.status(401).send({ message: "Not Authenticated!" });

  JWT.verify(token, process.env.JWT_SECRET_KEY, async (err, payload) => {
    if (err) return res.status(403).send({ message: "Token is not Valid!" });
    req.userId = payload.id;

    next();
  });
};
