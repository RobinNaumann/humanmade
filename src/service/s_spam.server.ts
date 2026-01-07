import { err } from "donau/server";
import { Dict } from "../shared/util.shared";

type RequestMeta = {
  timestamp: number;
  path?: string;
  [key: string]: any;
};

export class SpamDetectService {
  constructor(
    public readonly maxRequestsInWindow: number,
    public readonly windowMs: number
  ) {}

  private _reqCache: Dict<RequestMeta[]> = {};

  ip(req: any): string {
    return (
      req.ip ||
      req.headers?.["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      "unknown"
    );
  }

  /**
   * Throws an error if spam or rate limit is detected for the request.
   * @param req - The request object (should contain IP, path, method, headers, etc.)
   */
  async spamGuard(req: any): Promise<void> {
    const now = Date.now();
    // Try to extract IP from common locations
    const ip = this.ip(req);
    const meta: RequestMeta = {
      timestamp: now,
      path: req.path || req.url,
      method: req.method,
      userAgent: req.headers?.["user-agent"],
    };

    const inWindow = this._inWindow(now, ip, meta);

    // Check rate limit
    if (inWindow.length > this.maxRequestsInWindow) {
      throw err.tooManyRequests("Rate limit exceeded");
    }
  }

  private _pruneRequests(now: number): void {
    const cutoff = now - this.windowMs;
    for (const ip in this._reqCache) {
      const arr = this._reqCache[ip];
      const filtered = arr.filter((r) => r.timestamp >= cutoff);
      if (filtered.length > 0) this._reqCache[ip] = filtered;
      else delete this._reqCache[ip];
    }
  }

  private _inWindow(now: number, ip: string, meta: RequestMeta): RequestMeta[] {
    this._pruneRequests(now);
    let arr = this._reqCache[ip] ?? [];
    arr.push(meta);
    this._reqCache[ip] = arr;

    return arr;
  }
}
