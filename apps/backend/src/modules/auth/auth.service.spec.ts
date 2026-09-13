import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';

const USER_ID = 'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d';

const fakeUser: Partial<User> = {
  id: USER_ID,
  username: 'hopfenheld',
  email: 'hopfenheld@example.com',
  isUsernameSet: true,
};

describe('AuthService', () => {
  let service: AuthService;
  let usersService: {
    findByEmail: jest.Mock;
    findByUsername: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
  let jwtService: { signAsync: jest.Mock };

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      findByUsername: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };
    jwtService = { signAsync: jest.fn().mockResolvedValue('signed.jwt.token') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  describe('register', () => {
    it('hashes the password before storing the user (never plaintext)', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.findByUsername.mockResolvedValue(null);
      usersService.create.mockImplementation((data: Partial<User>) =>
        Promise.resolve({ id: 'new-id', ...data }),
      );

      const result = await service.register({
        username: 'neuerUser',
        email: 'neu@example.com',
        password: 'Sup3r$ecret1',
      });

      expect(result).toEqual({ id: 'new-id', email: 'neu@example.com' });

      const storedHash = usersService.create.mock.calls[0][0].passwordHash as string;
      expect(storedHash).not.toBe('Sup3r$ecret1');
      await expect(bcrypt.compare('Sup3r$ecret1', storedHash)).resolves.toBe(true);
    });

    it('throws ConflictException when the username is already taken', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.findByUsername.mockResolvedValue(fakeUser);

      await expect(
        service.register({
          username: 'hopfenheld',
          email: 'other@example.com',
          password: 'Sup3r$ecret1',
        }),
      ).rejects.toThrow(ConflictException);
      expect(usersService.create).not.toHaveBeenCalled();
    });

    it('throws ConflictException when the email is already taken', async () => {
      usersService.findByUsername.mockResolvedValue(null);
      usersService.findByEmail.mockResolvedValue(fakeUser);

      await expect(
        service.register({
          username: 'neuerUser',
          email: 'hopfenheld@example.com',
          password: 'Sup3r$ecret1',
        }),
      ).rejects.toThrow(ConflictException);
      expect(usersService.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('returns a signed token for correct credentials', async () => {
      const passwordHash = await bcrypt.hash('C0rrect-H0rse', 12);
      usersService.findByUsername.mockResolvedValue({ ...fakeUser, passwordHash });

      const result = await service.login({ identifier: 'hopfenheld', password: 'C0rrect-H0rse' });

      expect(jwtService.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({ sub: USER_ID, username: 'hopfenheld' }),
      );
      expect(result).toEqual({
        token: 'signed.jwt.token',
        id: USER_ID,
        email: fakeUser.email,
        isUsernameSet: true,
      });
    });

    it('looks the user up by email when the identifier contains "@"', async () => {
      const passwordHash = await bcrypt.hash('C0rrect-H0rse', 12);
      usersService.findByEmail.mockResolvedValue({ ...fakeUser, passwordHash });

      await service.login({ identifier: 'hopfenheld@example.com', password: 'C0rrect-H0rse' });

      expect(usersService.findByEmail).toHaveBeenCalledWith('hopfenheld@example.com');
      expect(usersService.findByUsername).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException for a wrong password', async () => {
      const passwordHash = await bcrypt.hash('C0rrect-H0rse', 12);
      usersService.findByUsername.mockResolvedValue({ ...fakeUser, passwordHash });

      await expect(
        service.login({ identifier: 'hopfenheld', password: 'wrong-password' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when the user does not exist', async () => {
      usersService.findByUsername.mockResolvedValue(null);

      await expect(
        service.login({ identifier: 'ghost', password: 'whatever123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException for a Google-only account (no password set)', async () => {
      usersService.findByUsername.mockResolvedValue({ ...fakeUser, passwordHash: null });

      await expect(
        service.login({ identifier: 'hopfenheld', password: 'whatever123' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('setUsername', () => {
    it('updates the username when it is free', async () => {
      usersService.findByUsername.mockResolvedValue(null);
      usersService.update.mockResolvedValue({
        ...fakeUser,
        username: 'neuerName',
        isUsernameSet: true,
      });

      const result = await service.setUsername(USER_ID, 'neuerName');

      expect(usersService.update).toHaveBeenCalledWith(USER_ID, {
        username: 'neuerName',
        isUsernameSet: true,
      });
      expect(result.username).toBe('neuerName');
    });

    it('throws ConflictException when the username is already taken', async () => {
      usersService.findByUsername.mockResolvedValue(fakeUser);

      await expect(service.setUsername(USER_ID, 'hopfenheld')).rejects.toThrow(ConflictException);
      expect(usersService.update).not.toHaveBeenCalled();
    });
  });
});
