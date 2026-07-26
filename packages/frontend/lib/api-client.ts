const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export async function clientFetch<T>(path: string): Promise<T> {
    const res = await fetch(`${BACKEND_URL}${path}`);
    if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
    return res.json() as Promise<T>;
}
