// middleWare for sigIn user
export const requireSignIn = async (req, res, next) => {
  try {
    next();
  } catch (error) {
    return res.status(404).send({
      success: false,
      message: `Issue with Token`,
    });
  }
};
