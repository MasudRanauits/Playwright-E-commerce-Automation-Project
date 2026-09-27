import { test, expect } from '../../fixtures/base.fixture';
import { buildNewUser, endpoints, users } from '../../data/testData';

test.describe('Users API @api', () => {
  test('create, read, update and delete an account', async ({ api }) => {
    const user = buildNewUser();

    await test.step('create', async () => {
      const response = await api.post(endpoints.createAccount, { ...user });
      const body = await api.expectResponseCode(response, 201);
      expect(body.message).toContain('User created');
    });

    await test.step('read by email', async () => {
      const response = await api.get(endpoints.getUserDetailByEmail, { email: user.email });
      const body = await api.expectResponseCode(response, 200);
      expect(body.user.email).toBe(user.email);
    });

    await test.step('update', async () => {
      const response = await api.put(endpoints.updateAccount, { ...user, city: 'Chattogram' });
      const body = await api.expectResponseCode(response, 200);
      expect(body.message).toContain('User updated');
    });

    await test.step('delete', async () => {
      const response = await api.delete(endpoints.deleteAccount, {
        email: user.email,
        password: user.password,
      });
      const body = await api.expectResponseCode(response, 200);
      expect(body.message).toContain('Account deleted');
    });
  });

  test('verifyLogin rejects unknown credentials', async ({ api }) => {
    const response = await api.post(endpoints.verifyLogin, {
      email: users.invalidUser.email,
      password: users.invalidUser.password,
    });
    const body = await api.expectResponseCode(response, 404);
    expect(body.message).toContain('User not found');
  });

  test('verifyLogin requires an email parameter', async ({ api }) => {
    const response = await api.post(endpoints.verifyLogin, {
      password: users.invalidUser.password,
    });
    const body = await api.expectResponseCode(response, 400);
    expect(body.message).toContain('email or password parameter is missing');
  });
});
