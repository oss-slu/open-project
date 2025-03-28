import { LedgerItemType, LogType } from "@prisma/client";
import { prisma } from "#prisma";
import { verifyAuth } from "#verifyAuth";
import { SHOP_SELECT, SHOP_SELECT_WITH_LEDGER } from "./shared.js";

export const get = [
  verifyAuth,
  async (req, res) => {
    try {
      const shops = await prisma.shop.findMany({
        where: req.user.admin
          ? {}
          : {
              users: {
                some: {
                  userId: req.user.id,
                  active: true,
                },
              },
            },
        select: SHOP_SELECT,
        take: req.query.limit ? parseInt(req.query.limit) : 20,
        skip: req.query.offset ? parseInt(req.query.offset) : 0,
      });

      const totalShops = await prisma.shop.count({
        where: req.user.admin
          ? {}
          : {
              users: {
                some: {
                  userId: req.user.id,
                  active: true,
                },
              },
            },
      });

      res.json({
        shops,
        meta: {
          total: totalShops,
          count: shops.length,
          offset: req.query.offset ? parseInt(req.query.offset) : 0,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Something went wrong" });
    }
  },
];

export const post = [
  verifyAuth,
  async (req, res) => {
    try {
      if (!req.user.admin) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      if (!req.body.name) {
        return res.status(400).json({
          error: "Name is required",
        });
      }

      let startingDeposit = null;
      if (req.body.startingDeposit) {
        startingDeposit = parseFloat(req.body.startingDeposit);
        if (isNaN(startingDeposit)) {
          return res.status(400).json({
            error: "startingDeposit must be floaty",
          });
        }
      }

      const shop = await prisma.shop.create({
        data: {
          name: req.body.name,
          address: req.body.address,
          phone: req.body.phone,
          email: req.body.email,
          description: req.body.description,
          imageUrl: req.body.imageUrl,
          startingDeposit: startingDeposit,
          users: {
            create: {
              userId: req.user.id,
              accountType: "ADMIN",
            },
          },
          ledgerItems:
            startingDeposit > 0
              ? {
                  create: {
                    userId: req.user.id,
                    type: LedgerItemType.INITIAL,
                    value: startingDeposit,
                  },
                }
              : undefined,
        },
        select: startingDeposit ? SHOP_SELECT_WITH_LEDGER : SHOP_SELECT,
      });

      await prisma.logs.create({
        data: {
          type: LogType.SHOP_CREATED,
          userId: req.user.id,
          shopId: shop.id,
          to: JSON.stringify(shop),
        },
      });

      if (startingDeposit) {
        await prisma.logs.create({
          data: {
            type: LogType.LEDGER_ITEM_CREATED,
            userId: req.user.id,
            shopId: shop.id,
            ledgerItemId: shop.ledgerItems[0].id,
          },
        });
      }

      const shops = await prisma.shop.findMany({
        where: {
          users: {
            some: {
              userId: req.user.id,
            },
          },
        },
        select: SHOP_SELECT,
        take: req.query.limit ? parseInt(req.query.limit) : 20,
        skip: req.query.offset ? parseInt(req.query.offset) : 0,
      });

      const totalShops = await prisma.shop.count({
        where: {
          users: {
            some: {
              userId: req.user.id,
            },
          },
        },
      });

      delete shop.ledgerItems;

      res.json({
        shop,
        shops,
        meta: {
          total: totalShops,
          count: shops.length,
          offset: req.query.offset ? parseInt(req.query.offset) : 0,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Something went wrong" });
    }
  },
];
