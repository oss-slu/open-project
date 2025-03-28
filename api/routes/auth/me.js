import { verifyAuth } from "#verifyAuth";

export const get = [
  verifyAuth,
  (req, res) => {
    console.log(req.user);
    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        admin: req.user.admin,
        suspended: req.user.suspended,
        suspensionReason: req.user.suspensionReason,
      },
    });
  },
];
