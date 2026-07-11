import "dotenv/config";
import { prisma } from "../src/lib/db";

async function main() {
  const before = await Promise.all([
    prisma.user.count(),
    prisma.product.count(),
    prisma.store.count(),
    prisma.conversation.count(),
    prisma.productBoostRequest.count(),
  ]);

  await prisma.$transaction([
    prisma.pushSubscription.deleteMany({ where: { user: { role: { not: "ADMIN" } } } }),
    prisma.notification.deleteMany({}),
    prisma.chatAttachment.deleteMany({}),
    prisma.message.deleteMany({}),
    prisma.chatTypingStatus.deleteMany({}),
    prisma.conversation.deleteMany({}),
    prisma.report.deleteMany({}),
    prisma.review.deleteMany({}),
    prisma.favorite.deleteMany({}),
    prisma.favoriteFolder.deleteMany({}),
    prisma.savedSearch.deleteMany({}),
    prisma.comparedProduct.deleteMany({}),
    prisma.priceAlert.deleteMany({}),
    prisma.productPriceHistory.deleteMany({}),
    prisma.productView.deleteMany({}),
    prisma.recentlyViewed.deleteMany({}),
    prisma.productBoostRequest.deleteMany({}),
    prisma.product.deleteMany({}),
    prisma.sellerVerification.deleteMany({}),
    prisma.store.deleteMany({}),
    prisma.adminNote.deleteMany({}),
    prisma.accountDeletionRequest.deleteMany({ where: { user: { role: { not: "ADMIN" } } } }),
    prisma.session.deleteMany({ where: { user: { role: { not: "ADMIN" } } } }),
    prisma.account.deleteMany({ where: { user: { role: { not: "ADMIN" } } } }),
    prisma.user.deleteMany({ where: { role: { not: "ADMIN" } } }),
  ]);

  const after = await Promise.all([
    prisma.user.count(),
    prisma.product.count(),
    prisma.store.count(),
    prisma.conversation.count(),
    prisma.productBoostRequest.count(),
  ]);

  console.log(
    JSON.stringify(
      {
        removed: {
          users: before[0] - after[0],
          products: before[1] - after[1],
          stores: before[2] - after[2],
          conversations: before[3] - after[3],
          adverts: before[4] - after[4],
        },
        remaining: {
          users: after[0],
          products: after[1],
          stores: after[2],
          conversations: after[3],
          adverts: after[4],
        },
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
