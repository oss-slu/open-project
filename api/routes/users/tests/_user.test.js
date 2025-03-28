import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "#index";
import { gt } from "#gt";
import { prisma } from "#mock-prisma";
import { prisma as realPrisma } from "#prisma";
import { LogType } from "@prisma/client";

describe("/users", () => {
  describe("GET", () => {
    it("Should return 403 if user is not a global admin", async () => {
      const res = await request(app)
        .get("/api/users")
        .set(...(await gt()))
        .send();

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: "Unauthorized" });
      expect(prisma.user.findMany).not.toHaveBeenCalled();

      const requestingUser = await realPrisma.user.findUnique({
        where: { email: "test@email.com" },
        include: {
          logs: {
            where: {
              type: LogType.FORBIDDEN_ACTION,
            },
          },
        },
      });

      expect(requestingUser.logs).toHaveLength(1);
      expect(requestingUser.logs[0].type).toBe(LogType.FORBIDDEN_ACTION);
    });

    it("Should return a list of users if the user is a global admin", async () => {
      // Make the user a global admin
      await realPrisma.user.update({
        where: {
          email: "test@email.com",
        },
        data: {
          admin: true,
        },
      });

      const res = await request(app)
        .get("/api/users")
        .set(...(await gt()))
        .send();

      expect(res.status).toBe(200);
      expect(res.body.users).toHaveLength(2);

      expect(res.body.users[0]).toMatchObject({
        admin: expect.any(Boolean),
        createdAt: expect.any(String),
        email: expect.any(String),
        firstName: expect.any(String),
        id: expect.any(String),
        isMe: expect.any(Boolean),
        jobCount: expect.any(Number),
        lastName: expect.any(String),
        name: expect.any(String),
        shopCount: expect.any(Number),
        suspended: expect.any(Boolean),
        updatedAt: expect.any(String),
      });

      // Ensure no extra keys
      const expectedKeys = [
        "admin",
        "createdAt",
        "email",
        "firstName",
        "id",
        "isMe",
        "jobCount",
        "lastName",
        "name",
        "shopCount",
        "suspended",
        "suspensionReason",
        "updatedAt",
      ];
      expect(Object.keys(res.body.users[0]).sort()).toEqual(
        expectedKeys.sort()
      );
    });
  });
});