import { prisma } from "#prisma";
import { verifyAuth } from "#verifyAuth";

export const get = [
  verifyAuth,
  async (req, res) => {
    const includeLogs = req.query.includeLogs === "true";

    try {
      if (!req.user.admin) {
        if (req.user.id !== req.params.userId) {
          // Return a very basic profile including only the user's name and id
          let user = await prisma.user.findUnique({
            where: {
              id: req.params.userId,
            },
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          });

          if (!user) return res.status(404).json({ message: "User not found" });

          user = {
            ...user,
            name: `${user.firstName} ${user.lastName}`,
          };

          return res.json({
            user,
          });
        }
      }

      let user = await prisma.user.findUnique({
        where: {
          id: req.params.userId,
        },
        include: {
          shops: {
            where: {
              active: true,
            },
            select: {
              shop: true,
              createdAt: true,
              accountTitle: true,
              accountType: true,
            },
          },
          jobs: true,
          logs: includeLogs && {
            orderBy: {
              createdAt: "desc",
            },
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
              shop: {
                select: {
                  name: true,
                },
              },
              resource: {
                select: {
                  title: true,
                  active: true,
                },
              },
              resourceType: {
                select: {
                  title: true,
                },
              },
              resourceImage: {
                select: {
                  fileUrl: true,
                  fileName: true,
                  active: true,
                },
              },
              job: {
                select: {
                  title: true,
                },
              },
              jobItem: {
                select: {
                  title: true,
                  active: true,
                  fileName: true,
                  fileUrl: true,
                  status: true,
                },
              },
              material: {
                select: {
                  title: true,
                  active: true,
                  tdsFileUrl: true,
                  tdsFileName: true,
                  msdsFileUrl: true,
                  msdsFileName: true,
                  resourceType: {
                    select: {
                      id: true,
                      title: true,
                    },
                  },
                },
              },
              materialImage: {
                select: {
                  active: true,
                  fileUrl: true,
                  fileName: true,
                  material: {
                    select: {
                      title: true,
                      resourceType: {
                        select: {
                          title: true,
                          id: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          _count: {
            select: {
              shops: {
                where: {
                  active: true,
                },
              },
              jobs: true,
            },
          },
        },
      });

      if (!user) return res.status(404).json({ message: "User not found" });

      user = {
        ...user,
        name: `${user.firstName} ${user.lastName}`,
        shopCount: user._count.shops,
        jobCount: user._count.jobs,
        _count: undefined,
        isMe: user.id === req.user.id,
      };

      return res.json({
        user,
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  },
];
