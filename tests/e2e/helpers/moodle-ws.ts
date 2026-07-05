import type { APIRequestContext } from '@playwright/test';
import type { EduPlatformEnv } from './env';

export type MoodleWsArgs = Record<string, string | number | boolean | undefined | null>;

export interface MoodleWsCall {
  wsfunction: string;
  args?: MoodleWsArgs;
}

const SECRET_KEY_PATTERN = /(token|password|secret|key|authorization)/i;

export function redactValue(key: string, value: unknown): unknown {
  if (SECRET_KEY_PATTERN.test(key) && value !== undefined && value !== null && value !== '') {
    return '[redacted]';
  }
  return value;
}

export function redactObject<T extends Record<string, unknown>>(input: T): Record<string, unknown> {
  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (Array.isArray(value)) {
      output[key] = value.map((item) =>
        item && typeof item === 'object' ? redactObject(item as Record<string, unknown>) : item,
      );
    } else if (value && typeof value === 'object') {
      output[key] = redactObject(value as Record<string, unknown>);
    } else {
      output[key] = redactValue(key, value);
    }
  }
  return output;
}

export class MoodleWsClient {
  constructor(
    private readonly request: APIRequestContext,
    private readonly env: EduPlatformEnv,
  ) {}

  redactedCall({ wsfunction, args = {} }: MoodleWsCall): Record<string, unknown> {
    return redactObject({
      endpoint: this.endpoint(),
      wsfunction,
      args,
      wstoken: this.env.wsToken,
    });
  }

  async call<T = unknown>({ wsfunction, args = {} }: MoodleWsCall): Promise<T> {
    if (!this.env.wsToken) {
      throw new Error('EDUPLATFORM_WS_TOKEN is required for Moodle web-service calls.');
    }

    const response = await this.request.post(this.endpoint(), {
      form: {
        wstoken: this.env.wsToken,
        wsfunction,
        moodlewsrestformat: 'json',
        ...this.flattenArgs(args),
      },
    });

    const text = await response.text();
    let payload: unknown;
    try {
      payload = JSON.parse(text);
    } catch {
      throw new Error(`Moodle web-service ${wsfunction} returned non-JSON status ${response.status()}.`);
    }

    if (!response.ok()) {
      throw new Error(`Moodle web-service ${wsfunction} failed with HTTP ${response.status()}.`);
    }

    if (payload && typeof payload === 'object' && 'exception' in payload) {
      const exception = payload as { exception?: string; message?: string };
      throw new Error(`Moodle web-service ${wsfunction} failed: ${exception.exception || ''} ${exception.message || ''}`.trim());
    }

    return payload as T;
  }

  private endpoint(): string {
    return new URL('/webservice/rest/server.php', this.env.baseUrl).toString();
  }

  private flattenArgs(args: MoodleWsArgs): Record<string, string> {
    const flattened: Record<string, string> = {};
    for (const [key, value] of Object.entries(args)) {
      if (value !== undefined && value !== null) {
        flattened[key] = String(value);
      }
    }
    return flattened;
  }
}
