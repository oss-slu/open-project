import express from "express";
import passport from "passport";
import { Strategy as SamlStrategy } from "passport-saml";
import bodyParser from "body-parser";
import samlConfig from "./config/saml-config.js";
import cors from "cors";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { prisma } from "#prisma";
import { LogType } from "@prisma/client";
dotenv.config();
import { createRouteHandler } from "uploadthing/express";
import { uploadRouter } from "./config/uploadthing.js";
import path from "path";
import { fileURLToPath } from "url";
import registerRoutes from "./util/router.js";
// import client from "#postmark";

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Enable CORS for your React app
app.use(
  cors({
    // origin: "http://localhost:3152", // Allow requests from your React app
    // optionsSuccessStatus: 200,
  })
);

//RESPONSE BODY LOGGER
// app.use((req, res, next) => {
//   const originalSend = res.send;

//   res.send = function (body) {
//     console.log("Response Body:", body); // Log the response body
//     originalSend.call(this, body);
//   };

//   next();
// });

// Initialize passport
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(passport.initialize());

// Log
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== "test") {
    console.log(req.method, req.url);
  }
  next();
});

// Passport SAML strategy
passport.use(
  new SamlStrategy(samlConfig, async (profile, done) => {
    try {
      const userEmail =
        profile.email ||
        profile[
          "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"
        ];

      // Check if the user exists in the database
      let user = await prisma.user.findUnique({
        where: { email: userEmail },
      });

      // If user doesn't exist, create a new user
      if (!user) {
        user = await prisma.user.create({
          data: {
            email: userEmail,
            firstName: profile.firstName,
            lastName: profile.lastName,
          },
        });

        const shopsToJoin = await prisma.shop.findMany({
          where: {
            autoJoin: true,
          },
        });

        for (const shop of shopsToJoin) {
          await prisma.userShop.create({
            data: {
              userId: user.id,
              shopId: shop.id,
              active: true,
            },
          });

          await prisma.logs.create({
            data: {
              userId: user.id,
              type: LogType.USER_CONNECTED_TO_SHOP,
              shopId: shop.id,
            },
          });
        }

        await prisma.logs.create({
          data: {
            userId: user.id,
            type: LogType.USER_CREATED,
          },
        });
      } else {
        await prisma.logs.create({
          data: {
            userId: user.id,
            type: LogType.USER_LOGIN,
          },
        });

        console.log("Email Sent! - mock");
        
        /*

        client.sendEmail({
          "From": `${process.env.POSTMARK_FROM_EMAIL}`, 
          "To": `${user.email}`,
          "Subject": "User Login detected for OpenSLU",
          "HtmlBody": `A login was detected at ${new Date(Date.now()).toLocaleString()} and ip TODO.` , 
          "TextBody": `A login was detected at ${new Date(Date.now()).toLocaleString()} and ip TODO.`,
          "MessageStream": "outbound"
        });
        
        */
      }

      // Pass the user to the next middleware
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  })
);

// SAML Assertion Consumer Service (ACS) Endpoint
app.post(
  "/assertion",
  passport.authenticate("saml", { failureRedirect: "/error", session: false }),
  (req, res) => {
    // Generate JWT
    const token = jwt.sign(
      {
        id: req.user.id,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
      },
      process.env.JWT_SECRET,
      { expiresIn: "3h" }
    );

    const relayState = req.body.RelayState;

    // Send token to the client
    res.redirect(
      (relayState ? relayState : process.env.BASE_URL) + "?token=" + token
    );
  }
);

app.use(express.json());

app.use((req, res, next) => {
  // Hook into the response lifecycle
  const originalSend = res.send;

  res.send = async function (body) {
    if (res.statusCode === 403) {
      await prisma.logs.create({
        data: {
          type: LogType.FORBIDDEN_ACTION,
          userId: req.user?.id,
          message: JSON.stringify({
            message: res.body?.message,
            error: res.body?.error,
            method: req.method,
            url: req.originalUrl,
            body: req.body,
            query: req.query,
            ip: req.ip,
          }),
          shopId: req.params?.shopId,
          jobId: req.params?.jobId,
          jobItemId: req.params?.jobItemId,
          resourceId: req.params?.resourceId,
          resourceTypeId: req.params?.resourceTypeId,
          materialId: req.params?.materialId,
          commentId: req.params?.commentId,
          ledgerItemId: req.params?.ledgerItemId,
          billingGroupId: req.params?.billingGroupId,
          userBillingGroupId: req.params?.userBillingGroupId,
          billingGroupInvitationLinkId:
            req.params?.billingGroupInvitationLinkId,
        },
      });
    }

    // Call the original send method
    return originalSend.call(this, body);
  };

  next();
});

app.use(
  "/api/files/upload",
  createRouteHandler({
    router: uploadRouter,
    config: {
      token: process.env.UPLOADTHING_TOKEN,
      callbackUrl: process.env.SERVER_URL + "/api/files/upload",
      logLevel: "Error",
    },
  })
);

// app.use("/api", await router());

await registerRoutes(app, path.join(process.cwd(), "routes"));

app.use(express.static("../app/dist"));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../app/dist", "index.html"));
});

// Error Route
app.get("/error", (req, res) => {
  res.send("Login Failed");
});

// Server Setup
const PORT = process.env.PORT || 3000;
let server;
if (process.env.NODE_ENV !== "test") {
  server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export { app, server };
