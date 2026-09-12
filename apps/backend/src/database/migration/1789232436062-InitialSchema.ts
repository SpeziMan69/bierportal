import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1789232436062 implements MigrationInterface {
  name = 'InitialSchema1789232436062';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "brewery" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "sourceId" integer, "externalId" character varying, "name" character varying NOT NULL, "city" character varying, "state" character varying, "country" character varying, "region" character varying, "website" character varying, "description" text, "logoUrl" character varying, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_2758c30fdf45037929e3279f946" UNIQUE ("sourceId"), CONSTRAINT "UQ_18b185707a96e99cecf260367d3" UNIQUE ("externalId"), CONSTRAINT "PK_d02cc4f101bd53d64d9c1c87294" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."user_beer_entry_status_enum" AS ENUM('tried', 'wishlist', 'cellar')`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_beer_entry" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" "public"."user_beer_entry_status_enum" NOT NULL, "note" character varying, "addedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, "beerId" uuid, CONSTRAINT "UQ_1373fa2609f1ebea7c61d1a22c9" UNIQUE ("userId", "beerId", "status"), CONSTRAINT "PK_496bede2e09105c5d9c907a082d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "beer" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "sourceId" integer, "externalId" character varying, "name" character varying NOT NULL, "imageUrl" character varying, "description" text, "abv" numeric(4,1), "style" character varying, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "avgRating" numeric(3,2) NOT NULL DEFAULT '0', "ratingCount" integer NOT NULL DEFAULT '0', "breweryId" uuid, CONSTRAINT "UQ_d2e93ea3b05f11e6d1f565689b0" UNIQUE ("sourceId"), CONSTRAINT "UQ_a082bb470b20871046a43fc01ca" UNIQUE ("externalId"), CONSTRAINT "PK_68ce81153952014a6e8b20df5c1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "review_like" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, "reviewId" uuid, CONSTRAINT "UQ_70765efe5debac97e61d96836d0" UNIQUE ("userId", "reviewId"), CONSTRAINT "PK_d40f62b4eca95d56b89c525a0d8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "review" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "rating" numeric(2,1) NOT NULL, "text" text, "isDraft" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, "beerId" uuid, CONSTRAINT "UQ_a568733f6ff2e5b9d28d92e64b2" UNIQUE ("userId", "beerId"), CONSTRAINT "PK_2e4299a343a81574217255c00ca" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "username" character varying NOT NULL, "email" character varying NOT NULL, "passwordHash" character varying, "googleId" character varying, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "picture" character varying, "isUsernameSet" boolean NOT NULL DEFAULT false, CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_f382af58ab36057334fb262efd5" UNIQUE ("googleId"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_beer_entry" ADD CONSTRAINT "FK_68a3a56d35a54eacf93b3166f19" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_beer_entry" ADD CONSTRAINT "FK_39636a10f72fd26e796ad667f36" FOREIGN KEY ("beerId") REFERENCES "beer"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "beer" ADD CONSTRAINT "FK_90153fe87d3eee841f699ef5fa7" FOREIGN KEY ("breweryId") REFERENCES "brewery"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "review_like" ADD CONSTRAINT "FK_f586f7a08d5ea44e409e61e8de5" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "review_like" ADD CONSTRAINT "FK_cf9251ae2c2598692d5007cbd0b" FOREIGN KEY ("reviewId") REFERENCES "review"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "review" ADD CONSTRAINT "FK_1337f93918c70837d3cea105d39" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "review" ADD CONSTRAINT "FK_d9d1377c0c9d7befdba991b477b" FOREIGN KEY ("beerId") REFERENCES "beer"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "review" DROP CONSTRAINT "FK_d9d1377c0c9d7befdba991b477b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "review" DROP CONSTRAINT "FK_1337f93918c70837d3cea105d39"`,
    );
    await queryRunner.query(
      `ALTER TABLE "review_like" DROP CONSTRAINT "FK_cf9251ae2c2598692d5007cbd0b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "review_like" DROP CONSTRAINT "FK_f586f7a08d5ea44e409e61e8de5"`,
    );
    await queryRunner.query(`ALTER TABLE "beer" DROP CONSTRAINT "FK_90153fe87d3eee841f699ef5fa7"`);
    await queryRunner.query(
      `ALTER TABLE "user_beer_entry" DROP CONSTRAINT "FK_39636a10f72fd26e796ad667f36"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_beer_entry" DROP CONSTRAINT "FK_68a3a56d35a54eacf93b3166f19"`,
    );
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "review"`);
    await queryRunner.query(`DROP TABLE "review_like"`);
    await queryRunner.query(`DROP TABLE "beer"`);
    await queryRunner.query(`DROP TABLE "user_beer_entry"`);
    await queryRunner.query(`DROP TYPE "public"."user_beer_entry_status_enum"`);
    await queryRunner.query(`DROP TABLE "brewery"`);
  }
}
