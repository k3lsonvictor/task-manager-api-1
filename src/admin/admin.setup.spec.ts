import { hash } from 'bcrypt';
import { authenticateAdmin } from './admin.setup';

describe('authenticateAdmin', () => {
  it('rejects invalid admin credentials', async () => {
    await expect(
      authenticateAdmin(
        'admin@example.com',
        'wrong-password',
        'admin@example.com',
        'strong-password',
      ),
    ).resolves.toBe(false);
  });

  it('accepts valid plain-text admin credentials', async () => {
    await expect(
      authenticateAdmin(
        'admin@example.com',
        'strong-password',
        'admin@example.com',
        'strong-password',
      ),
    ).resolves.toBe(true);
  });

  it('accepts a valid password when ADMIN_PASSWORD uses bcrypt', async () => {
    const passwordHash = await hash('strong-password', 4);

    await expect(
      authenticateAdmin(
        'admin@example.com',
        'strong-password',
        'admin@example.com',
        passwordHash,
      ),
    ).resolves.toBe(true);
  });
});
