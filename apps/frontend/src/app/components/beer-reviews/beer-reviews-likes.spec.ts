import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, of } from 'rxjs';
import { BeerReviews } from './beer-reviews';
import { Auth } from '../../core/auth/auth';
import { ReviewService, type BeerReview, type ReviewLikeResult } from '../../services/review';

describe('Comment likes', () => {
  const review: BeerReview = {
    id: 'review-1',
    rating: 4,
    text: 'Gut',
    createdAt: '',
    likeCount: 2,
    likedByMe: false,
    user: { id: 'other', username: 'Other', picture: null },
  };
  const user = signal<{ id: string } | null>({ id: 'me' });
  const navigate = jest.fn();
  let request: Subject<ReviewLikeResult>;
  let service: { getForBeer: jest.Mock; like: jest.Mock; unlike: jest.Mock };
  let component: BeerReviews;

  beforeEach(() => {
    user.set({ id: 'me' });
    request = new Subject();
    service = {
      getForBeer: jest.fn(() => of({ items: [review], page: 1, totalPages: 1 })),
      like: jest.fn(() => request),
      unlike: jest.fn(() => request),
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: Auth, useValue: { user } },
        { provide: Router, useValue: { navigate } },
        { provide: ReviewService, useValue: service },
      ],
    });
    component = TestBed.runInInjectionContext(() => new BeerReviews());
    component.beerId = 'beer';
    component.ngOnChanges();
  });

  it('uses server counts and blocks double clicks', () => {
    component['toggleLike'](review);
    component['toggleLike'](review);
    expect(service.like).toHaveBeenCalledTimes(1);
    request.next({ liked: true, likeCount: 3 });
    expect(component['reviews']()[0]).toMatchObject({ likedByMe: true, likeCount: 3 });
    component['toggleLike'](component['reviews']()[0]);
    expect(service.unlike).toHaveBeenCalledWith(review.id);
  });

  it('keeps the original state on failure and allows retry', () => {
    component['toggleLike'](review);
    request.error({ status: 500 });
    expect(component['reviews']()[0].likeCount).toBe(2);
    expect(component['likeErrors']()[review.id]).toBeTruthy();
    expect(component['liking']()).toEqual([]);
  });

  it('prevents self-likes and sends guests to login', () => {
    component['toggleLike']({ ...review, user: { ...review.user!, id: 'me' } });
    expect(service.like).not.toHaveBeenCalled();
    user.set(null);
    component['toggleLike'](review);
    expect(navigate).toHaveBeenCalledWith(['/login']);
    expect(service.like).not.toHaveBeenCalled();
  });
});
