import { Prisma } from '@prisma/client';

export const userSelect = {
    id: true,
    nom: true,
    nomUtilisateur: true,
    email: true,
    createdAt: true,
    updatedAt: true,
} satisfies Prisma.UserSelect;


