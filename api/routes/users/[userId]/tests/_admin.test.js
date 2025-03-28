import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "#index";
import { gt } from "#gt";
import { prisma as mockPrisma } from "#mock-prisma";
import { prisma } from "#prisma";
import { LogType } from "@prisma/client";

describe("/[userId]", () => {
  describe("User/global admin promotion", async () => {
    it("should return 403 if requesting user is not a global admin", async () => {
      const createdUser = await prisma.user.create({
        data: {
          email: "toBePromoted@test.com",
          firstName: "John",
          lastName: "Doe",
        },
      });

      const res = await request(app)
        .post(`/api/users/_/admin`)
        .set(...(await gt()))
        .send();

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: "Unauthorized" });

      const updatedUser = await prisma.user.findUnique({
        where: { id: createdUser.id },
      });

      expect(updatedUser.admin).toBe(false);

      const requestingUser = await prisma.user.findUnique({
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
    it("should return 404 if user is not found", async () => {
      const res = await request(app)
        .post(`/api/users/_/admin`)
        .set(...(await gt({ ga: true })))
        .send();

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: "User not found" });
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
      expect(mockPrisma.logs.create).not.toHaveBeenCalled();
    });
    it("should return 400 if user is already an admin", async () => {
      const createdUser = await prisma.user.create({
        data: {
          email: "toBePromoted@test.com",
          firstName: "John",
          lastName: "Doe",
          admin: true,
        },
      });

      const res = await request(app)
        .post(`/api/users/${createdUser.id}/admin`)
        .set(...(await gt({ ga: true })))
        .send();

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "User is already an admin" });

      const updatedUser = await prisma.user.findUnique({
        where: { id: createdUser.id },
      });

      expect(updatedUser.admin).toBe(true);
      expect(mockPrisma.logs.create).not.toHaveBeenCalled();
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });
    it("should promote user to global admin", async () => {
      const createdUser = await prisma.user.create({
        data: {
          email: "toBePromoted@test.com",
          firstName: "John",
          lastName: "Doe",
        },
      });

      const res = await request(app)
        .post(`/api/users/${createdUser.id}/admin`)
        .set(...(await gt({ ga: true })))
        .send();

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: "User is now an admin" });

      const updatedUser = await prisma.user.findUnique({
        where: { id: createdUser.id },
        include: {
          logs: {
            where: {
              type: LogType.USER_PROMOTED_TO_ADMIN,
            },
          },
        },
      });

      expect(updatedUser.admin).toBe(true);
      expect(updatedUser.logs).toHaveLength(1);
    });
  });

  describe("User/global admin demotion", async () => {
    it("should return 403 if requesting user is not a global admin", async () => {
      const createdUser = await prisma.user.create({
        data: {
          email: "toBePromoted@test.com",
          firstName: "John",
          lastName: "Doe",
          admin: true,
        },
      });

      const res = await request(app)
        .delete(`/api/users/${createdUser.id}/admin`)
        .set(...(await gt()))
        .send();

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: "Unauthorized" });

      const updatedUser = await prisma.user.findUnique({
        where: { id: createdUser.id },
        include: {
          logs: {
            where: {
              type: LogType.USER_DEMOTED_FROM_ADMIN,
            },
          },
        },
      });

      expect(updatedUser.admin).toBe(true);
      expect(updatedUser.logs).toHaveLength(0);

      const requestingUser = await prisma.user.findUnique({
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
    it("should return 404 if user is not found", async () => {
      const res = await request(app)
        .delete(`/api/users/_/admin`)
        .set(...(await gt({ ga: true })))
        .send();

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: "User not found" });

      expect(mockPrisma.logs.create).not.toHaveBeenCalled();
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });
    it("should return 400 if target user is not an admin", async () => {
      const createdUser = await prisma.user.create({
        data: {
          email: "toBePromoted@email.com",
          firstName: "John",
          lastName: "Doe",
        },
      });

      const res = await request(app)
        .delete(`/api/users/${createdUser.id}/admin`)
        .set(...(await gt({ ga: true })))
        .send();

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "User is not an admin" });

      const updatedUser = await prisma.user.findUnique({
        where: { id: createdUser.id },
        include: {
          logs: {
            where: {
              type: LogType.USER_DEMOTED_FROM_ADMIN,
            },
          },
        },
      });

      expect(updatedUser.admin).toBe(false);
      expect(updatedUser.logs).toHaveLength(0);

      expect(mockPrisma.logs.create).not.toHaveBeenCalled();
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });
    it("should demote user from global admin", async () => {
      const createdUser = await prisma.user.create({
        data: {
          email: "toBePromoted@test.com",
          firstName: "John",
          lastName: "Doe",
          admin: true,
        },
      });

      const res = await request(app)
        .delete(`/api/users/${createdUser.id}/admin`)
        .set(...(await gt({ ga: true })))
        .send();

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: "User is no longer an admin" });

      const updatedUser = await prisma.user.findUnique({
        where: { id: createdUser.id },
        include: {
          logs: {
            where: {
              type: LogType.USER_DEMOTED_FROM_ADMIN,
            },
          },
        },
      });

      expect(updatedUser.admin).toBe(false);
      expect(updatedUser.logs).toHaveLength(1);
    });
  });
});
