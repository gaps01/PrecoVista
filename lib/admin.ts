import { getChatGPTUser } from '@/app/chatgpt-auth';
import { runtimeEnv } from './runtime-env';

export async function currentAdmin() {
  const user = await getChatGPTUser();
  const adminUserId = runtimeEnv().PRECOVISTA_ADMIN_USER_ID;
  return {
    user,
    authorized: Boolean(user && adminUserId && user.userId === adminUserId),
    configured: Boolean(adminUserId),
  };
}
