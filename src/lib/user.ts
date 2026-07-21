// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getUserProfile(token: string): Promise<any> {
  if (!token) {
    throw new Error('Please login again');
  }

  const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await response.json();

  if (!response.ok || result.success === false) {
    throw new Error(result.message || 'Failed to fetch profile');
  }

  return result.data;
}
