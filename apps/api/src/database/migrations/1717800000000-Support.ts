import type { MigrationInterface, QueryRunner } from "typeorm";

/** Support ticketing: tickets + threaded messages. */
export class Support1717800000000 implements MigrationInterface {
  name = "Support1717800000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "support_tickets" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid,
        "name" character varying(120) NOT NULL,
        "email" character varying(255) NOT NULL,
        "subject" character varying(200) NOT NULL,
        "category" character varying(16) NOT NULL DEFAULT 'general',
        "status" character varying(16) NOT NULL DEFAULT 'open',
        "last_message_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_support_tickets_user" ON "support_tickets" ("user_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_support_tickets_status" ON "support_tickets" ("status")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "support_messages" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "ticket_id" uuid NOT NULL REFERENCES "support_tickets"("id") ON DELETE CASCADE,
        "sender_id" uuid,
        "sender_role" character varying(8) NOT NULL DEFAULT 'user',
        "body" text NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_support_messages_ticket" ON "support_messages" ("ticket_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "support_messages"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "support_tickets"`);
  }
}
