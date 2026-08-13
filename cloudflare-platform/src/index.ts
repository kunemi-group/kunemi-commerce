import type { Env } from './types';
import { routeRequest } from './router';

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    try {
      return await routeRequest(request, env);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Internal Server Error';
      return new Response(
        JSON.stringify({
          error: 'Edge Execution Failure',
          message,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }
  },
};
