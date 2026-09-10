import type { BeerStatus } from '@bierportal/dtos';

export interface UserProfile {
  id: string;
  username: string;
  picture: string | null;
  createdAt: string;
  reviewCount: number;
  likeCount: number;
}

export type UpdatedProfile = Pick<UserProfile, 'id' | 'username' | 'picture' | 'createdAt'>;

export interface UserReview {
  id: string;
  rating: number;
  text: string | null;
  createdAt: string;
  updatedAt: string;
  beer: { id: string; name: string } | null;
}

export interface UserLike {
  id: string;
  createdAt: string;
  review: {
    id: string;
    rating: number;
    text: string | null;
    beer: { id: string; name: string } | null;
  } | null;
}

export interface UserBeerEntry {
  id: string;
  status: BeerStatus;
  note: string | null;
  addedAt: string;
  beer: {
    id: string;
    name: string;
    imageUrl: string | null;
    brewery: string | null;
  } | null;
}
