import { Module } from '@nestjs/common';
import { validationSchema } from './config/validation.schema';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from './modules/users/user.entity';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { BeersModule } from './modules/beers/beers.module';
import { BreweriesModule } from './modules/breweries/breweries.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { UserBeersModule } from './modules/user-beers/user-beers.module';
import { Beer } from './common/entities/beer.entity';
import { BeerStyle } from './common/entities/beer-style.entity';
import { Brewery } from './common/entities/brewery.entity';
import { Review } from './common/entities/review.entity';
import { ReviewLike } from './common/entities/review-like.entity';
import { UserBeerEntry } from './common/entities/user-entry.entity';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
      validationOptions: {
        abortEarly: false, // show ALL errors at once, not just the first
      },
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USER'),
        password: config.get<string>('DB_PASS'),
        database: config.get<string>('DB_NAME'),
        // Glob-based autoloading breaks once webpack bundles everything into main.js, so list entities explicitly.
        entities: [User, Beer, BeerStyle, Brewery, Review, ReviewLike, UserBeerEntry],
        synchronize: process.env.NODE_ENV !== 'production',
      }),
    }),

    UsersModule,
    AuthModule,
    BeersModule,
    BreweriesModule,
    ReviewsModule,
    UserBeersModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
