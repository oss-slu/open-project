import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "#index";
import { gt } from "#gt";
import { prisma } from "#prisma";
import { prisma as mockPrisma } from "#mock-prisma";
import { LogType } from "@prisma/client";

describe("/[userId]", () => {
  describe("Suspend user", async () => {
    it("should return 403 if requesting user is not a global admin", async () => {
      const createdUser = await prisma.user.create({
        data: {
          email: "toBeSuspended@test.com",
          firstName: "John",
          lastName: "Doe",
        },
      });

      const res = await request(app)
        .post(`/api/users/${createdUser.id}/suspension`)
        .set(...(await gt()))
        .send();

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: "Unauthorized" });

      const updatedUser = await prisma.user.findUnique({
        where: { id: createdUser.id },
      });

      expect(updatedUser.suspended).toBe(false);

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
        .post(`/api/users/_/suspension`)
        .set(...(await gt({ ga: true })))
        .send();

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: "User not found" });

      expect(mockPrisma.logs.create).not.toHaveBeenCalled();
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it("should suspend user", async () => {
      const createdUser = await prisma.user.create({
        data: {
          email: "toBeSuspended@test.com",
          firstName: "John",
          lastName: "Doe",
        },
      });

      const res = await request(app)
        .post(`/api/users/${createdUser.id}/suspension`)
        .set(...(await gt({ ga: true })))
        .send({
          reason: "Test reason",
        });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: "User is now suspended" });

      const updatedUser = await prisma.user.findUnique({
        where: { id: createdUser.id },
        include: {
          logs: {
            where: {
              type: LogType.USER_SUSPENSION_APPLIED,
            },
          },
        },
      });

      expect(updatedUser.suspended).toBe(true);
      expect(updatedUser.suspensionReason).toBe("Test reason");
      expect(updatedUser.logs).toHaveLength(1);
    });

    it("should allow a suspended user to access /api/auth/me", async () => {
      const res = await request(app)
        .get(`/api/auth/me`)
        .set(...(await gt({ suspended: true })))
        .send();

      expect(res.status).toBe(200);
      expect(res.body.user.suspended).toBe(true);
    });

    it("should not allow a suspended user to access other routes", async () => {
      const res = await request(app)
        .get(`/api/shop`)
        .set(...(await gt({ suspended: true })))
        .send();

      console.log(res.status);

      expect(res.status).toBe(403);
    });
  });

  describe("Unsuspend user", async () => {
    it("should return 403 if requesting user is not a global admin", async () => {
      const createdUser = await prisma.user.create({
        data: {
          email: "toBeSuspended@test.com",
          firstName: "John",
          lastName: "Doe",
          suspended: true,
        },
      });

      const res = await request(app)
        .delete(`/api/users/${createdUser.id}/suspension`)
        .set(...(await gt()))
        .send();

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: "Unauthorized" });

      const updatedUser = await prisma.user.findUnique({
        where: { id: createdUser.id },
      });

      expect(updatedUser.suspended).toBe(true);

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
        .delete(`/api/users/_/suspension`)
        .set(...(await gt({ ga: true })))
        .send();

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: "User not found" });

      expect(mockPrisma.logs.create).not.toHaveBeenCalled();
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it("should unsuspend user", async () => {
      const createdUser = await prisma.user.create({
        data: {
          email: "toBeSuspended@test.com",
          firstName: "John",
          lastName: "Doe",
          suspended: true,
        },
      });

      const res = await request(app)
        .delete(`/api/users/${createdUser.id}/suspension`)
        .set(...(await gt({ ga: true })))
        .send();

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: "User is no longer suspended" });

      const updatedUser = await prisma.user.findUnique({
        where: { id: createdUser.id },
        include: {
          logs: {
            where: {
              type: LogType.USER_SUSPENSION_REMOVED,
            },
          },
        },
      });

      expect(updatedUser.suspended).toBe(false);
      expect(updatedUser.logs).toHaveLength(1);
    });
  });

  describe("Change suspension reason", async () => {
    it("should return 403 if requesting user is not a global admin", async () => {
      const createdUser = await prisma.user.create({
        data: {
          email: "toBeSuspended@test.com",
          firstName: "John",
          lastName: "Doe",
          suspended: true,
          suspensionReason: "Test reason",
        },
      });

      const res = await request(app)
        .put(`/api/users/${createdUser.id}/suspension`)
        .set(...(await gt()))
        .send({
          reason: "New reason",
        });

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: "Unauthorized" });

      const updatedUser = await prisma.user.findUnique({
        where: { id: createdUser.id },
      });

      expect(updatedUser.suspended).toBe(true);
      expect(updatedUser.suspensionReason).toBe("Test reason");

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

    it("should return 403 if target user is not suspended", async () => {
      const createdUser = await prisma.user.create({
        data: {
          email: "toBeSuspended@test.com",
          firstName: "John",
          lastName: "Doe",
          suspended: false,
        },
      });

      const res = await request(app)
        .put(`/api/users/${createdUser.id}/suspension`)
        .set(...(await gt({ ga: true })))
        .send({
          reason: "New reason",
        });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: "User is not suspended" });

      const updatedUser = await prisma.user.findUnique({
        where: { id: createdUser.id },
        include: {
          logs: {
            where: {
              type: LogType.USER_SUSPENSION_CHANGED,
            },
          },
        },
      });

      expect(updatedUser.suspended).toBe(false);
      expect(updatedUser.suspensionReason).toBeNull();
      expect(updatedUser.logs).toHaveLength(0);
    });

    it("should return 404 if user is not found", async () => {
      const res = await request(app)
        .put(`/api/users/_/suspension`)
        .set(...(await gt({ ga: true })))
        .send({
          reason: "New reason",
        });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: "User not found" });

      expect(mockPrisma.logs.create).not.toHaveBeenCalled();
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it("should change suspension reason", async () => {
      const createdUser = await prisma.user.create({
        data: {
          email: "toBeSuspended@test.com",
          firstName: "John",
          lastName: "Doe",
          suspended: true,
          suspensionReason: "Test reason",
        },
      });

      const res = await request(app)
        .put(`/api/users/${createdUser.id}/suspension`)
        .set(...(await gt({ ga: true })))
        .send({
          reason: "New reason",
        });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        message: "Suspension reason has been updated",
      });

      const updatedUser = await prisma.user.findUnique({
        where: { id: createdUser.id },
        include: {
          logs: {
            where: {
              type: LogType.USER_SUSPENSION_CHANGED,
            },
          },
        },
      });

      expect(updatedUser.suspended).toBe(true);
      expect(updatedUser.suspensionReason).toBe("New reason");
      expect(updatedUser.logs).toHaveLength(1);
    });
  });
});
