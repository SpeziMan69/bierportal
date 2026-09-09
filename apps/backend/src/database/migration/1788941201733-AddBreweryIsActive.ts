import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBreweryIsActive1788941201733 implements MigrationInterface {
  name = 'AddBreweryIsActive1788941201733';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "brewery" ADD "isActive" boolean NOT NULL DEFAULT true`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "brewery" DROP COLUMN "isActive"`);
  }
}
