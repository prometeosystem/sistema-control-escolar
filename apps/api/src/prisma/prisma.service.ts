import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    // Conexión diferida hasta que existan migraciones de dominio; no falla el boot.
    try {
      await this.$connect();
    } catch {
      // Postgres puede no estar arriba en el scaffold inicial.
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
