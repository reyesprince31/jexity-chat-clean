import { prisma, Prisma } from "@repo/db";

export type AdminOrganizationWithMembers = Prisma.OrganizationGetPayload<{
  include: {
    members: {
      include: {
        user: {
          select: {
            name: true;
            email: true;
          };
        };
      };
    };
    _count: {
      select: {
        members: true;
        invitations: true;
      };
    };
  };
}>;

export async function getAdminOrganizations(): Promise<AdminOrganizationWithMembers[]> {
  const organizations = await prisma.organization.findMany({
    include: {
      members: {
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
      _count: {
        select: {
          members: true,
          invitations: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return organizations;
}
