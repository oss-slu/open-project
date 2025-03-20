import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { prisma } from "#prisma";
import inquirer from "inquirer";
import ora from "ora";
dotenv.config();

export const generateToken = (user) => {
  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    },
    process.env.JWT_SECRET,
    { expiresIn: "24h" }
  );

  return token;
};

export const generateTokenForUser = async () => {
  const spinner = ora("Loading users...").start();
  const users = await prisma.user.findMany({});
  spinner.stop();

  const { user } = await inquirer.prompt([
    {
      type: "list",
      name: "user",
      message: "Select a user to generate a token for",
      choices: users.map((user) => ({
        name: `${user.firstName} ${user.lastName} (${user.id})`,
        value: user,
      })),
    },
  ]);

  const token = generateToken(user);

  console.log(
    `Paste the following into your browser's console to set the token and log in as ${user.firstName} ${user.lastName}:

localStorage.setItem("token", "${token}");document.location.reload()

    `
  );
};

generateTokenForUser();
