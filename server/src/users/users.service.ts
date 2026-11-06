import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { DatabaseService } from '../database/database.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { userSelect } from './constants/users.select';
import { randomBytes } from 'crypto';

const SALT_ROUNDS = 10;

// Champs autorisés pour le tri (évite de trier sur n'importe quelle colonne)
const SORTABLE_FIELDS = ['createdAt', 'nom', 'nomUtilisateur', 'email'] as const;

@Injectable()
export class UsersService {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(createUserDto: CreateUserDto) {
    const { nom, email, password } = createUserDto;
    const nomUtilisateur = createUserDto.nomUtilisateur.trim().toLowerCase();

    // Une seule requête pour vérifier les deux doublons
    const existing = await this.databaseService.user.findFirst({
      where: { OR: [{ email }, { nomUtilisateur }] },
      select: { email: true },
    });

    if (existing) {
      throw new ConflictException(
        existing.email === email
          ? 'Cette adresse e-mail est déjà utilisée.'
          : "Ce nom d'utilisateur est déjà utilisé.",
      );
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    try {
      const user = await this.databaseService.user.create({
        data: {
          nom: nom.trim(),
          nomUtilisateur,
          email,
          password: hashedPassword,
        },
        select: userSelect,
      });

      return {
        message: 'Utilisateur créé avec succès.',
        data: user,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          "Cette adresse e-mail ou ce nom d'utilisateur est déjà utilisé.",
        );
      }
      throw error;
    }
  }


  async findOrCreateGoogleUser(profile: {
    googleId: string;
    email: string;
    emailVerified: boolean;
    firstName?: string;
    lastName?: string;
    picture?: string;
  }) {
    const { googleId, email, emailVerified, firstName, lastName, picture, } = profile;

    if (!googleId || !email || !emailVerified) {
      throw new ConflictException(
        'Votre compte Google doit disposer d’une adresse e-mail vérifiée.',
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Vérifier si cette identité Google existe déjà.
    const existingOAuthAccount =
      await this.databaseService.oAuthAccount.findUnique({
        where: {
          provider_providerAccountId: {
            provider: 'GOOGLE',
            providerAccountId: googleId,
          },
        },
        include: {
          user: {
            select: userSelect,
          },
        },
      });

    if (existingOAuthAccount) {
      return existingOAuthAccount.user;
    }

    // 2. Ne pas associer automatiquement un compte existant.
    const existingUser = await this.databaseService.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException(
        'Un compte existe déjà avec cette adresse e-mail. Connectez-vous à ce compte pour associer Google.',
      );
    }

    // 3. Préparer les informations du nouvel utilisateur.
    const nom =
      `${firstName ?? ''} ${lastName ?? ''}`.trim() ||
      normalizedEmail.split('@')[0];

    const usernameBase =
      normalizedEmail
        .split('@')[0]
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9_]/g, '')
        .toLowerCase()
        .slice(0, 80) || 'utilisateur';

    const nomUtilisateur = `${usernameBase}_${randomBytes(4).toString('hex')}`;


    const randomPassword = randomBytes(32).toString('hex');
    const hashedPassword = await bcrypt.hash(randomPassword, SALT_ROUNDS);

    try {
      // 4. Créer l'utilisateur et son compte Google atomiquement.
      return await this.databaseService.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            nom,
            nomUtilisateur,
            email: normalizedEmail,
            password: hashedPassword,
            avatarUrl: picture,
            oauthAccounts: {
              create: {
                provider: 'GOOGLE',
                providerAccountId: googleId,
              },
            },
          },
          select: userSelect,
        });

        return user;
      });
    } catch (error) {
      // Gérer une éventuelle création concurrente.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const linkedAccount =
          await this.databaseService.oAuthAccount.findUnique({
            where: {
              provider_providerAccountId: {
                provider: 'GOOGLE',
                providerAccountId: googleId,
              },
            },
            include: {
              user: {
                select: userSelect,
              },
            },
          });

        if (linkedAccount) {
          return linkedAccount.user;
        }

        throw new ConflictException(
          'Impossible de créer ce compte Google. Vérifiez si cette adresse e-mail est déjà utilisée.',
        );
      }

      throw error;
    }
  }


  async findAll(query: any) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      order = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      OR: search
        ? [
            { nom: { contains: search, mode: 'insensitive' } },
            { nomUtilisateur: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ]
        : undefined,
    };

    const orderField = (SORTABLE_FIELDS as readonly string[]).includes(sortBy)
      ? sortBy
      : 'createdAt';

    const [users, total] = await this.databaseService.$transaction([
      this.databaseService.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [orderField]: order },
        select: userSelect,
      }),
      this.databaseService.user.count({ where }),
    ]);

    return {
      message: 'Liste des utilisateurs récupérée avec succès.',
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }


  async updateHashedRefreshToken(
    userId: string,
    hashedRefreshToken: string | null,
  ) {
    await this.databaseService.user.update({
      where: { id: userId },
      data: { hashedRefreshToken },
    });
  }

  async findByEmail(email: string) {
    return this.databaseService.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
  }

  async findById(id: string) {
    return this.databaseService.user.findUnique({
      where: { id },
    });
  }

  async findOne(id: string) {
    const user = await this.databaseService.user.findUnique({
      where: { id },
      select: userSelect,
    });

    if (!user) {
      throw new NotFoundException("L'utilisateur demandé est introuvable.");
    }

    return {
      message: 'Utilisateur récupéré avec succès.',
      data: user,
    };
  }


  async createPasswordResetToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
  ) {
    return this.databaseService.$transaction(async (tx) => {
      // Un seul token actif par utilisateur.
      await tx.passwordResetToken.deleteMany({
        where: { userId },
      });

      return tx.passwordResetToken.create({
        data: {
          userId,
          tokenHash,
          expiresAt,
        },
      });
    });
  }

  async resetPassword(
    tokenHash: string,
    hashedPassword: string,
  ) {
    return this.databaseService.$transaction(async (tx) => {
      const resetToken = await tx.passwordResetToken.findUnique({
        where: { tokenHash },
      });

      if (!resetToken || resetToken.expiresAt <= new Date()) {
        throw new Error('RESET_TOKEN_INVALID');
      }

      // Suppression atomique : empêche la réutilisation du token.
      const deleted = await tx.passwordResetToken.deleteMany({
        where: {
          id: resetToken.id,
          expiresAt: { gt: new Date() },
        },
      });

      if (deleted.count !== 1) {
        throw new Error('RESET_TOKEN_INVALID');
      }

      const user = await tx.user.update({
        where: { id: resetToken.userId },
        data: {
          password: hashedPassword,
          hashedRefreshToken: null,
        },
      });

      // Invalider les éventuels autres liens de réinitialisation.
      await tx.passwordResetToken.deleteMany({
        where: { userId: resetToken.userId },
      });

      return user;
    });
  }


  async update(id: string, updateUserDto: UpdateUserDto) {
    const existingUser = await this.databaseService.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingUser) {
      throw new NotFoundException("L'utilisateur demandé est introuvable.");
    }

    const { password, ...rest } = updateUserDto;
    const data: Prisma.UserUpdateInput = { ...rest };

    if (rest.email) {
      data.email = rest.email.trim().toLowerCase();

      const emailExists = await this.databaseService.user.findFirst({
        where: { email: data.email as string, NOT: { id } },
        select: { id: true },
      });

      if (emailExists) {
        throw new ConflictException('Cette adresse e-mail est déjà utilisée.');
      }
    }

    if (rest.nomUtilisateur) {
      data.nomUtilisateur = rest.nomUtilisateur.trim().toLowerCase();

      const usernameExists = await this.databaseService.user.findFirst({
        where: { nomUtilisateur: data.nomUtilisateur as string, NOT: { id } },
        select: { id: true },
      });

      if (usernameExists) {
        throw new ConflictException("Ce nom d'utilisateur est déjà utilisé.");
      }
    }

    if (password) {
      data.password = await bcrypt.hash(password, SALT_ROUNDS);
      // Changer le mot de passe déconnecte les autres appareils
      data.hashedRefreshToken = null;
    }

    const updatedUser = await this.databaseService.user.update({
      where: { id },
      data,
      select: userSelect,
    });

    return {
      message: 'Utilisateur mis à jour avec succès.',
      data: updatedUser,
    };
  }

  // async remove(id: string) {
  //   const user = await this.databaseService.user.findUnique({
  //     where: { id },
  //     select: { isActive: true },
  //   });

  //   if (!user) {
  //     throw new NotFoundException("L'utilisateur demandé est introuvable.");
  //   }

  //   if (!user.isActive) {
  //     return {
  //       message: 'Cet utilisateur est déjà désactivé.',
  //       data: null,
  //     };
  //   }

  //   const updatedUser = await this.databaseService.user.update({
  //     where: { id },
  //     data: {
  //       isActive: false,
  //       hashedRefreshToken: null,
  //     },
  //     select: userSelect,
  //   });

  //   return {
  //     message: 'Utilisateur désactivé avec succès.',
  //     data: updatedUser,
  //   };
  // }
}