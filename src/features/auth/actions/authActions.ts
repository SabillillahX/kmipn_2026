'use server'

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/src/database';
import { users } from '@/src/database/schema';
import { eq } from 'drizzle-orm';

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email and password are required' };
  }

  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user || user.passwordHash !== password) {
    return { error: 'Invalid email or password' };
  }

  if (user.role !== 'gov_employee') {
    return { error: 'Access denied: Insufficient privileges' };
  }

  const cookieStore = await cookies();
  cookieStore.set('auth_token', user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });

  redirect('/dashboard');
}
