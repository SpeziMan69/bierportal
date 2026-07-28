import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { Auth } from './auth';
import { environment } from '../../../environments/environment';

describe('Auth', () => {
  let service: Auth;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(Auth);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('POST /auth/login with identifier+password and return id+email', () => {
    const mockResponse = {
      id: 'ce1250b9-b4fb-4a3e-ba1f-026baf0fa649',
      email: 'testuser@example.com',
    };

    service.login('testuser@example.com', 'TestPass123!').subscribe((res) => {
      expect(res.id).toBe(mockResponse.id);
      expect(res.email).toBe(mockResponse.email);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      identifier: 'testuser@example.com',
      password: 'TestPass123!',
    });
    req.flush(mockResponse);
  });

  it('should propagate HTTP 401 error on wrong password', () => {
    let errorCaught = false;

    service.login('testuser@example.com', 'WrongPass1!').subscribe({
      error: (err: HttpErrorResponse) => {
        expect(err.status).toBe(401);
        errorCaught = true;
      },
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
    expect(errorCaught).toBe(true);
  });
});
