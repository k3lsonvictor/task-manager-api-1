import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { MailService } from '../mail/mail.service';
import { ConfigService } from '@nestjs/config';

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: jest.Mocked<
    Pick<UsersRepository, 'findByEmail' | 'create' | 'updateById'>
  >;
  let mailService: jest.Mocked<Pick<MailService, 'enqueueVerificationEmail'>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
            updateById: jest.fn(),
          },
        },
        {
          provide: MailService,
          useValue: {
            enqueueVerificationEmail: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('false'),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    usersRepository = module.get(UsersRepository);
    mailService = module.get(MailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates an already verified user without enqueueing an email when verification is disabled', async () => {
    usersRepository.findByEmail.mockResolvedValue(null);
    usersRepository.create.mockResolvedValue({
      id: 'user-id',
      name: 'Kelson',
      email: 'kelson@example.com',
      emailVerified: true,
      createdAt: new Date(),
    } as any);

    await service.create({
      name: 'Kelson',
      email: 'kelson@example.com',
      password: '12345678',
    });

    expect(usersRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Kelson',
        email: 'kelson@example.com',
        emailVerified: true,
      }),
    );
    expect(mailService.enqueueVerificationEmail).not.toHaveBeenCalled();
  });
});
