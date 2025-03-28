import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "#index";
import { gt } from "#gt";
import { prisma } from "#prisma";
import { AccountType, LogType } from "@prisma/client";

describe("/[userId]", () => {
  describe("Fetch user profile", () => {
    it("should return a 404 if the user does not exist", async () => {
      const res = await request(app)
        .get(`/api/users/12345`)
        .set(...(await gt()))
        .send();

      expect(res.status).toBe(404);
      expect(res.body).toMatchSnapshot();
    });

    it("should return basic information if the user is not a global admin", async () => {
      const testUser = await prisma.user.create({
        data: {
          firstName: "Test",
          lastName: "User",
          email: "test@example.com",
        },
      });

      const res = await request(app)
        .get(`/api/users/${testUser.id}`)
        .set(...(await gt()))
        .send();

      expect(res.status).toBe(200);

      expect(res.body.user.id).toBe(testUser.id);
      expect(res.body.user).toMatchSnapshot({
        id: expect.any(String),
      });
    });

    it("should not return logs if user is not a global admin", async () => {
      const testUser = await prisma.user.create({
        data: {
          firstName: "Test",
          lastName: "User",
          email: "test@example.com",
          logs: {
            create: [
              {
                type: LogType.USER_LOGIN,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ],
          },
        },
      });

      const res = await request(app)
        .get(`/api/users/${testUser.id}`)
        .set(...(await gt()))
        .send();

      expect(res.status).toBe(200);

      expect(res.body.user.id).toBe(testUser.id);
      expect(res.body.user.logs).toBeUndefined();
    });

    it("should return a full profile if the user is a global admin", async () => {
      const testUser = await prisma.user.create({
        data: {
          firstName: "Test",
          lastName: "User",
          email: "targetUser@example.com",
          shops: {
            create: {
              accountType: AccountType.CUSTOMER,
              shopId: (await prisma.shop.findFirst()).id,
            },
          },
        },
      });

      const res = await request(app)
        .get(`/api/users/${testUser.id}`)
        .set(
          ...(await gt({
            ga: true,
          }))
        )
        .send();

      expect(res.status).toBe(200);

      expect(res.body.user.id).toBe(testUser.id);
      expect(res.body.user).toMatchSnapshot({
        id: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        shops: expect.any(Array),
      });

      expect(res.body.user.shopCount).toBe(1);
      expect(res.body.user.jobCount).toBe(0);
      expect(res.body.user.isMe).toBe(false);

      expect(res.body.user.shops[0].shop.name).toBe("TestShop");
      expect(res.body.user.name).toBe("Test User");

      expect(res.body.user._count).toBeUndefined();

      expect(res.body.user.logs).toBeUndefined();
    });

    it("should return logs if includeLogs is true", async () => {
      const testUser = await prisma.user.create({
        data: {
          firstName: "Test",
          lastName: "User",
          email: "targetUser@example.com",
          logs: {
            create: [
              {
                type: LogType.USER_LOGIN,
              },
            ],
          },
        },
      });

      await prisma.user.update({
        where: {
          email: "test@email.com",
        },
        data: {
          admin: true,
        },
      });

      const res = await request(app)
        .get(`/api/users/${testUser.id}?includeLogs=true`)
        .set(...(await gt()))
        .send();

      expect(res.status).toBe(200);

      expect(res.body.user.id).toBe(testUser.id);
      expect(res.body.user).toMatchSnapshot({
        id: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        logs: expect.any(Array),
      });

      expect(res.body.user.logs.length).toBe(1);
      expect(res.body.user.logs[0].type).toBe(LogType.USER_LOGIN);
    });
  });
});
