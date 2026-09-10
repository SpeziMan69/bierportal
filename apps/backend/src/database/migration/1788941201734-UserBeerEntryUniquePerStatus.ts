import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserBeerEntryUniquePerStatus1788941201734 implements MigrationInterface {
  name = 'UserBeerEntryUniquePerStatus1788941201734';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_beer_entry" DROP CONSTRAINT "UQ_ebbc28b16a7f3275a70a4a82795"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_beer_entry" ADD CONSTRAINT "UQ_user_beer_entry_user_beer_status" UNIQUE ("userId", "beerId", "status")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_beer_entry" DROP CONSTRAINT "UQ_user_beer_entry_user_beer_status"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_beer_entry" ADD CONSTRAINT "UQ_ebbc28b16a7f3275a70a4a82795" UNIQUE ("userId", "beerId")`,
    );
  }
}
