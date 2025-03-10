import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "#index";
import { gt } from "#gt";
import { prisma } from "#prisma";
import { tc } from "#setup";
import { AccountType, LedgerItemType } from "@prisma/client";

describe("/shop/[shopId]/user/[userId]/ledger", () => {
  describe("GET", () => {
    it("returns a user's ledger items", async () => {
      const res = await request(app)
        .get(`/api/shop/${tc.shop.id}/user/${tc.globalUser.id}/ledger`)
        .set(...(await gt({ ga: true })))
        .send();

      expect(res.status).toBe(200);
      expect(res.body.ledgerItems).toHaveLength(0);
      expect(res.body.balance).toBe(0);
    });

    it("returns a user's ledger items with a balance", async () => {
      await prisma.ledgerItem.createMany({
        data: [
          {
            userId: tc.globalUser.id,
            shopId: tc.shop.id,
            type: LedgerItemType.INITIAL,
            value: 100,
          },
          {
            userId: tc.globalUser.id,
            shopId: tc.shop.id,
            type: LedgerItemType.JOB,
            value: -10,
          },
          {
            userId: tc.globalUser.id,
            shopId: tc.shop.id,
            type: LedgerItemType.JOB,
            value: -20,
          },
          {
            userId: tc.globalUser.id,
            shopId: tc.shop.id,
            type: LedgerItemType.AUTOMATED_TOPUP,
            value: 30,
          },
          {
            userId: tc.globalUser.id,
            shopId: tc.shop.id,
            type: LedgerItemType.MANUAL_TOPUP,
            value: 40,
          },
        ],
      });

      const res = await request(app)
        .get(`/api/shop/${tc.shop.id}/user/${tc.globalUser.id}/ledger`)
        .set(...(await gt({ ga: true })))
        .send();

      expect(res.status).toBe(200);
      expect(res.body.ledgerItems).toHaveLength(5);
      expect(res.body.balance).toBe(140);
    });

    it("allows a user to fetch their own ledger items even if not an admin", async () => {
      const res = await request(app)
        .get(`/api/shop/${tc.shop.id}/user/${tc.user.id}/ledger`)
        .set(...(await gt()))
        .send();

      expect(res.status).toBe(200);
    });

    it("does not allow a user to see another user's ledger items", async () => {
      const testUser = await prisma.user.create({
        data: {
          firstName: "TestFirstName",
          lastName: "TestLastName",
          email: "test1@email.com",
          shops: {
            create: {
              shopId: tc.shop.id,
              accountType: "CUSTOMER",
            },
          },
        },
      });

      const res = await request(app)
        .get(`/api/shop/${tc.shop.id}/user/${testUser.id}/ledger`)
        .set(...(await gt()))
        .send();

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: "Unauthorized" });
    });

    it("does not allow a user to see another user's ledger items if the other user is an admin", async () => {
      const testUser = await prisma.user.create({
        data: {
          firstName: "TestFirstName",
          lastName: "TestLastName",
          email: "test2@email.com",
          shops: {
            create: {
              shopId: tc.shop.id,
              accountType: AccountType.ADMIN,
            },
          },
        },
      });

      const res = await request(app)
        .get(`/api/shop/${tc.shop.id}/user/${testUser.id}/ledger`)
        .set(...(await gt()))
        .send();

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: "Unauthorized" });
    });

    it("returns 404 when the user is not a member of the shop", async () => {
      const res = await request(app)
        .get(`/api/shop/${tc.shop.id}/user/1234/ledger`)
        .set(...(await gt({ ga: true })))
        .send();

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: "Not found" });
    });
  });

  describe("POST", () => {
    it("creates a ledger item", async () => {
      const res = await request(app)
        .post(`/api/shop/${tc.shop.id}/user/${tc.globalUser.id}/ledger`)
        .set(...(await gt({ ga: true })))
        .send({
          type: "MANUAL_TOPUP",
          value: 100,
        });

      expect(res.status).toBe(200);

      const ledgerItem = await prisma.ledgerItem.findFirst({
        where: {
          userId: tc.globalUser.id,
          shopId: tc.shop.id,
        },
      });

      expect(ledgerItem).toBeDefined();
      expect(ledgerItem.type).toBe("MANUAL_TOPUP");
      expect(ledgerItem.value).toBe(100);
    });

    it("creates a ledger item", async () => {
      const res = await request(app)
        .post(`/api/shop/${tc.shop.id}/user/${tc.globalUser.id}/ledger`)
        .set(...(await gt({ ga: true })))
        .send({
          type: "AUTOMATED_TOPUP",
          value: 100,
        });
  
      expect(res.status).toBe(200);
  
      const ledgerItem = await prisma.ledgerItem.findFirst({
        where: {
          userId: tc.globalUser.id,
          shopId: tc.shop.id,
        },
      });
  
      expect(ledgerItem).toBeDefined();
      expect(ledgerItem.type).toBe("AUTOMATED_TOPUP");
      expect(ledgerItem.value).toBe(100);
     });

    it("does not allow customers to post manual deposits", async () => {
      const res = await request(app)
        .post(`/api/shop/${tc.shop.id}/user/${tc.globalUser.id}/ledger`)
        .set(...(await gt({ sat: "CUSTOMER" })))
        .send({
          type: "MANUAL_DEPOSIT",
          value: 100,
        });

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: "Unauthorized" });
    });

    it("does not allow group admins to post manual deposits", async () => {
      const res = await request(app)
        .post(`/api/shop/${tc.shop.id}/user/${tc.globalUser.id}/ledger`)
        .set(...(await gt({ sat: "GROUP_ADMIN" })))
        .send({
          type: "MANUAL_DEPOSIT",
          value: 100,
        });

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: "Unauthorized" });
    });

    it("allows operators to post manual deposits", async () => {
      const res = await request(app)
        .post(`/api/shop/${tc.shop.id}/user/${tc.globalUser.id}/ledger`)
        .set(...(await gt({ sat: "OPERATOR" })))
        .send({
          type: "MANUAL_DEPOSIT",
          value: 100,
        });

      expect(res.status).toBe(200);

      const ledgerItem = await prisma.ledgerItem.findFirst({
        where: {
          userId: tc.globalUser.id,
          shopId: tc.shop.id,
        },
      });

      expect(ledgerItem).toBeDefined();
      expect(ledgerItem.type).toBe("MANUAL_DEPOSIT");
      expect(ledgerItem.value).toBe(100);
    });

    it("allows workshop admins to post manual deposits", async () => {
      const res = await request(app)
        .post(`/api/shop/${tc.shop.id}/user/${tc.globalUser.id}/ledger`)
        .set(...(await gt({ sat: "ADMIN" })))
        .send({
          type: "MANUAL_DEPOSIT",
          value: 100,
        });

      expect(res.status).toBe(200);

      const ledgerItem = await prisma.ledgerItem.findFirst({
        where: {
          userId: tc.globalUser.id,
          shopId: tc.shop.id,
        },
      });

      expect(ledgerItem).toBeDefined();
      expect(ledgerItem.type).toBe("MANUAL_DEPOSIT");
      expect(ledgerItem.value).toBe(100);
    });

    it("does not allow customers to post automated deposits", async () => {
      const res = await request(app)
        .post(`/api/shop/${tc.shop.id}/user/${tc.globalUser.id}/ledger`)
        .set(...(await gt({ sat: "CUSTOMER" })))
        .send({
          type: "MAUTOMATED_DEPOSIT",
          value: 100,
        });

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: "Unauthorized" });
    });

    it("does not allow group admins to post automated deposits", async () => {
      const res = await request(app)
        .post(`/api/shop/${tc.shop.id}/user/${tc.globalUser.id}/ledger`)
        .set(...(await gt({ sat: "GROUP_ADMIN" })))
        .send({
          type: "MAUTOMATED_DEPOSIT",
          value: 100,
        });

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: "Unauthorized" });
    });

    it("allows operators to post automated deposits", async () => {
      const res = await request(app)
        .post(`/api/shop/${tc.shop.id}/user/${tc.globalUser.id}/ledger`)
        .set(...(await gt({ sat: "OPERATOR" })))
        .send({
          type: "AUTOMATED_DEPOSIT",
          value: 100,
        });

      expect(res.status).toBe(200);

      const ledgerItem = await prisma.ledgerItem.findFirst({
        where: {
          userId: tc.globalUser.id,
          shopId: tc.shop.id,
        },
      });

      expect(ledgerItem).toBeDefined();
      expect(ledgerItem.type).toBe("AUTOMATED_DEPOSIT");
      expect(ledgerItem.value).toBe(100);
    });

    it("allows workshop admins to post automated deposits", async () => {
      const res = await request(app)
        .post(`/api/shop/${tc.shop.id}/user/${tc.globalUser.id}/ledger`)
        .set(...(await gt({ sat: "ADMIN" })))
        .send({
          type: "AUTOMATED_DEPOSIT",
          value: 100,
        });

      expect(res.status).toBe(200);

      const ledgerItem = await prisma.ledgerItem.findFirst({
        where: {
          userId: tc.globalUser.id,
          shopId: tc.shop.id,
        },
      });

      expect(ledgerItem).toBeDefined();
      expect(ledgerItem.type).toBe("AUTOMATED_DEPOSIT");
      expect(ledgerItem.value).toBe(100);
    });

    it("throws an error if the type is invalid", async () => {
      const res = await request(app)
        .post(`/api/shop/${tc.shop.id}/user/${tc.globalUser.id}/ledger`)
        .set(...(await gt({ ga: true })))
        .send({
          type: "INVALID_TYPE",
          value: 100,
        });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: "Invalid type" });
    });

    it("throws an error if the value is negative", async () => {
      const res = await request(app)
        .post(`/api/shop/${tc.shop.id}/user/${tc.globalUser.id}/ledger`)
        .set(...(await gt({ ga: true })))
        .send({
          type: "MANUAL_TOPUP",
          value: -100,
        });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: "Invalid value" });
    });

    it("throws an error if the value is negative", async () => {
      const res = await request(app)
        .post(`/api/shop/${tc.shop.id}/user/${tc.globalUser.id}/ledger`)
        .set(...(await gt({ ga: true })))
        .send({
          type: "AUTOMATED_TOPUP",
          value: -100,
        });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: "Invalid value" });
    });

    it("throws an error if the value is not a number", async () => {
      const res = await request(app)
        .post(`/api/shop/${tc.shop.id}/user/${tc.globalUser.id}/ledger`)
        .set(...(await gt({ ga: true })))
        .send({
          type: "MANUAL_TOPUP",
          value: "adf",
        });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: "value must be floaty" });
    });

    it("throws an error if the value is not a number", async () => {
      const res = await request(app)
        .post(`/api/shop/${tc.shop.id}/user/${tc.globalUser.id}/ledger`)
        .set(...(await gt({ ga: true })))
        .send({
          type: "AUTOMATED_TOPUP",
          value: "adf",
        });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: "value must be floaty" });
    });

    it("converts floaty values to floats", async () => {
      const res = await request(app)
        .post(`/api/shop/${tc.shop.id}/user/${tc.globalUser.id}/ledger`)
        .set(...(await gt({ ga: true })))
        .send({
          type: "MANUAL_TOPUP",
          value: "100",
        });

      expect(res.status).toBe(200);
      expect(res.body.balance).toBe(100);
    });

    it("converts floaty values to floats", async () => {
      const res = await request(app)
        .post(`/api/shop/${tc.shop.id}/user/${tc.globalUser.id}/ledger`)
        .set(...(await gt({ ga: true })))
        .send({
          type: "AUTOMATED_TOPUP",
          value: "100",
        });

      expect(res.status).toBe(200);
      expect(res.body.balance).toBe(100);
    });

    it("handles a manual topup", async () => {
      const res = await request(app)
        .post(`/api/shop/${tc.shop.id}/user/${tc.globalUser.id}/ledger`)
        .set(...(await gt({ ga: true })))
        .send({
          type: "MANUAL_TOPUP",
          value: 100,
        });

      expect(res.status).toBe(200);
      expect(res.body.ledgerItems).toHaveLength(1);
      expect(res.body.balance).toBe(100);
    });

    it("handles a manual topup", async () => {
      const res = await request(app)
        .post(`/api/shop/${tc.shop.id}/user/${tc.globalUser.id}/ledger`)
        .set(...(await gt({ ga: true })))
        .send({
          type: "AUTOMATED_TOPUP",
          value: 100,
        });

      expect(res.status).toBe(200);
      expect(res.body.ledgerItems).toHaveLength(1);
      expect(res.body.balance).toBe(100);
    });

    it("returns 400 if the topup value is less than the balance", async () => {
      await prisma.ledgerItem.create({
        data: {
          userId: tc.user.id,
          shopId: tc.shop.id,
          type: LedgerItemType.INITIAL,
          value: 100,
        },
      });

      const res = await request(app)
        .post(`/api/shop/${tc.shop.id}/user/${tc.user.id}/ledger`)
        .set(...(await gt({ ga: true })))
        .send({
          type: "MANUAL_TOPUP",
          value: 50,
        });

      expect(res.status).toBe(400);
    });

    it("returns 400 if the automated topup value is less than the balance", async () => {
      await prisma.ledgerItem.create({
        data: {
          userId: tc.user.id,
          shopId: tc.shop.id,
          type: LedgerItemType.INITIAL,
          value: 100,
        },
      });

      const res = await request(app)
        .post(`/api/shop/${tc.shop.id}/user/${tc.user.id}/ledger`)
        .set(...(await gt({ ga: true })))
        .send({
          type: "AUTOMATED_TOPUP",
          value: 50,
        });

      expect(res.status).toBe(400);
    });

    it("returns 400 if the topup value is the same as the balance", async () => {
      await prisma.ledgerItem.create({
        data: {
          userId: tc.user.id,
          shopId: tc.shop.id,
          type: LedgerItemType.INITIAL,
          value: 100,
        },
      });

      const res = await request(app)
        .post(`/api/shop/${tc.shop.id}/user/${tc.user.id}/ledger`)
        .set(...(await gt({ ga: true })))
        .send({
          type: "MANUAL_TOPUP",
          value: 100,
        });

      expect(res.status).toBe(400);
    });

    it("returns 400 if the automated  topup value is the same as the balance", async () => {
      await prisma.ledgerItem.create({
        data: {
          userId: tc.user.id,
          shopId: tc.shop.id,
          type: LedgerItemType.INITIAL,
          value: 100,
        },
      });

      const res = await request(app)
        .post(`/api/shop/${tc.shop.id}/user/${tc.user.id}/ledger`)
        .set(...(await gt({ ga: true })))
        .send({
          type: "AUTOMATED_TOPUP",
          value: 100,
        });

      expect(res.status).toBe(400);
    });

    it("handles a manual deposit", async () => {
      await prisma.ledgerItem.create({
        data: {
          userId: tc.user.id,
          shopId: tc.shop.id,
          type: LedgerItemType.INITIAL,
          value: 100,
        },
      });

      const res = await request(app)
        .post(`/api/shop/${tc.shop.id}/user/${tc.user.id}/ledger`)
        .set(...(await gt({ ga: true })))
        .send({
          type: "MANUAL_DEPOSIT",
          value: 100,
        });

      expect(res.status).toBe(200);
      expect(res.body.balance).toBe(200);
    });

    it("handles an automated deposit", async () => {
      await prisma.ledgerItem.create({
        data: {
          userId: tc.user.id,
          shopId: tc.shop.id,
          type: LedgerItemType.INITIAL,
          value: 100,
        },
      });

      const res = await request(app)
        .post(`/api/shop/${tc.shop.id}/user/${tc.user.id}/ledger`)
        .set(...(await gt({ ga: true })))
        .send({
          type: "AUTOMATED_DEPOSIT",
          value: 100,
        });

      expect(res.status).toBe(200);
      expect(res.body.balance).toBe(200);
    });

    it("handles a funds purchased deposit", async () => {
      await prisma.ledgerItem.create({
        data: {
          userId: tc.user.id,
          shopId: tc.shop.id,
          type: LedgerItemType.INITIAL,
          value: 100,
        },
      });

      const res = await request(app)
        .post(`/api/shop/${tc.shop.id}/user/${tc.user.id}/ledger`)
        .set(...(await gt({ ga: true })))
        .send({
          type: "FUNDS_PURCHASED",
          value: 100,
        });

      expect(res.status).toBe(200);
      expect(res.body.balance).toBe(200);
    });

    it("handles a manual reduction", async () => {
      await prisma.ledgerItem.create({
        data: {
          userId: tc.user.id,
          shopId: tc.shop.id,
          type: LedgerItemType.INITIAL,
          value: 100,
        },
      });

      const res = await request(app)
        .post(`/api/shop/${tc.shop.id}/user/${tc.user.id}/ledger`)
        .set(...(await gt({ ga: true })))
        .send({
          type: "MANUAL_REDUCTION",
          value: 50,
        });

      expect(res.status).toBe(200);
      expect(res.body.balance).toBe(50);
    });

    it("returns 404 when the user is not a member of the shop", async () => {
      const res = await request(app)
        .post(`/api/shop/${tc.shop.id}/user/1234/ledger`)
        .set(...(await gt()))
        .send({
          type: "MANUAL_REDUCTION",
          value: 50,
        });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: "Not found" });
    });
  });
});
