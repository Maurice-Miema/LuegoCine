import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class DatabaseService extends PrismaClient  implements OnModuleInit  {

  private readonly logger = new Logger(DatabaseService.name);

  constructor() {
    super({
      adapter: new PrismaPg({
        connectionString: process.env.DATABASE_URL!,
      }),
    });
  }

  async onModuleInit() {
    try {
        await this.$connect();
        await this.$queryRaw`SELECT 1`;
        this.logger.log('Connexion à la base de données réussie.');
    } catch (error) {
        this.logger.error(
            'Impossible de se connecter à la base de données.',
            error instanceof Error ? error.stack : undefined,
        );
        throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Connexion à la base de données fermée.');
  }
}


