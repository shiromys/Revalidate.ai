import * as dns from 'dns';

import * as net from 'net';
 
/**

* Email Validation Result Interface

* Includes all validation details and scoring

*/

export interface ValidationResult {

  isValid: boolean;

  reason: string;

  mxRecord?: string;

  isCatchAll?: boolean;

  smtpCode?: string;

  validationCertainty?: number; // 0.0 to 1.0

  validationDetails?: Record<string, unknown>;

}
 
/**

* Configuration interface for validation

*/

interface ValidationConfig {

  catchAllTestEmailPrefixes: string[];

  greylistCodes: string[];

  backoffDelays: number[];

  smtpTimeout: number;

  smtpPort: number;

  senderEmail: string;

  availableIps: string[];

  certaintyThresholds: {

    hardBounce: number;

    greylisted: number;

    catchAll: number;

    valid: number;

  };

}
 
/**

* Enhanced Email Validator with Catch-All Detection

* Improvements:

* - Catch-all server detection

* - Certainty/confidence scoring

* - Greylisting with exponential backoff

* - Improved SMTP response handling

* - No hardcoded values (all from env/config)

*/

export class GreylistValidator {

  private config: ValidationConfig;

  private currentIpIndex = 0;
 
  constructor(config?: Partial<ValidationConfig>) {

    // Use provided config or create from environment variables

    this.config = {

      catchAllTestEmailPrefixes: this.getConfigArray(

        process.env.CATCH_ALL_TEST_PREFIXES,

        ['test', 'noreply', 'postmaster', 'verify', 'validation', 'check']

      ),

      greylistCodes: this.getConfigArray(

        process.env.GREYLIST_CODES,

        ['421', '450', '451', '452']

      ),

      backoffDelays: this.parseNumberArray(

        process.env.BACKOFF_DELAYS,

        [1000, 3000, 9000]

      ),

      smtpTimeout: parseInt(process.env.SMTP_TIMEOUT || '5000'),

      smtpPort: parseInt(process.env.SMTP_PORT || '25'),

      senderEmail: process.env.SENDER_EMAIL || 'verify@revalidate.ai',

      availableIps: this.getConfigArray(

        process.env.AVAILABLE_IPS,

        [] // Empty array means use default IP

      ),

      certaintyThresholds: {

        hardBounce: parseFloat(process.env.CERTAINTY_HARD_BOUNCE || '0.05'),

        greylisted: parseFloat(process.env.CERTAINTY_GREYLISTED || '0.4'),

        catchAll: parseFloat(process.env.CERTAINTY_CATCH_ALL || '0.3'),

        valid: parseFloat(process.env.CERTAINTY_VALID || '0.9'),

      },

      ...config,

    };

  }
 
  /**

   * Helper: Parse comma-separated environment variable into array

   */

  private getConfigArray(envValue: string | undefined, defaultValue: string[]): string[] {

    if (!envValue) return defaultValue;

    return envValue.split(',').map(v => v.trim()).filter(v => v.length > 0);

  }
 
  /**

   * Helper: Parse comma-separated numbers

   */

  private parseNumberArray(envValue: string | undefined, defaultValue: number[]): number[] {

    if (!envValue) return defaultValue;

    return envValue.split(',').map(v => {

      const num = parseInt(v.trim());

      return isNaN(num) ? 0 : num;

    }).filter(v => v > 0);

  }
 
  /**

   * Get next IP from pool for load balancing

   */

  private getNextIp(): string | undefined {

    if (this.config.availableIps.length === 0) return undefined;

    const ip = this.config.availableIps[this.currentIpIndex];

    this.currentIpIndex = (this.currentIpIndex + 1) % this.config.availableIps.length;

    return ip;

  }
 
  /**

   * Sleep helper for backoff delays

   */

  private sleep(ms: number): Promise<void> {

    return new Promise(resolve => setTimeout(resolve, ms));

  }
 
  /**

   * Get MX records for domain with fallback to A records

   */

  private async getMxRecords(domain: string): Promise<string[]> {

    return new Promise((resolve, reject) => {

      dns.resolveMx(domain, (err, addresses) => {

        if (err || !addresses || addresses.length === 0) {

          // Fallback to A record

          dns.resolve4(domain, (aErr, aAddresses) => {

            if (aErr || !aAddresses || aAddresses.length === 0) {

              return reject(new Error('No MX or A records found'));

            }

            resolve(aAddresses);

          });

          return;

        }
 
        // Sort by priority (lowest number = highest priority)

        const sorted = addresses.sort((a, b) => a.priority - b.priority);

        resolve(sorted.map(record => record.exchange));

      });

    });

  }
 
  /**

   * Generate test email for catch-all detection

   */

  private generateTestEmail(domain: string): string {

    const randomPrefix = this.config.catchAllTestEmailPrefixes[

      Math.floor(Math.random() * this.config.catchAllTestEmailPrefixes.length)

    ];

    const timestamp = Date.now();

    return `${randomPrefix}${timestamp}@${domain}`;

  }
 
  /**

   * Detect if server is a catch-all by testing with invalid email

   */

  private async detectCatchAll(

    mxRecord: string,

    domain: string,

    senderEmail: string,

    timeout: number = 5000

  ): Promise<{ isCatchAll: boolean; certainty: number }> {

    try {

      const testEmail = this.generateTestEmail(domain);

      const result = await this.checkSmtp(mxRecord, testEmail, senderEmail, timeout);
 
      // If test email is accepted (250), it's likely catch-all

      if (result.code === '250') {

        return {

          isCatchAll: true,

          certainty: 0.8, // High certainty of catch-all

        };

      }
 
      // If test email is rejected (550, 551, etc), not catch-all

      if (result.code.startsWith('5')) {

        return {

          isCatchAll: false,

          certainty: 0.9, // High certainty of NOT catch-all

        };

      }
 
      // Uncertain

      return {

        isCatchAll: false,

        certainty: 0.5,

      };

    } catch {

      // If catch-all detection fails, assume uncertain

      return {

        isCatchAll: false,

        certainty: 0.5,

      };

    }

  }
 
  /**

   * Calculate validation certainty based on SMTP response code

   */

  private calculateCertainty(

    code: string,

    isCatchAll: boolean,

    catchAllCertainty: number

  ): number {

    // Hard bounce = definitely invalid

    if (code.startsWith('5')) {

      return this.config.certaintyThresholds.hardBounce;

    }
 
    // Greylisting = uncertain, retry later

    if (this.config.greylistCodes.includes(code)) {

      return this.config.certaintyThresholds.greylisted;

    }
 
    // Catch-all detected = risky/uncertain

    if (isCatchAll) {

      return this.config.certaintyThresholds.catchAll * (1 - catchAllCertainty);

    }
 
    // 250 response without catch-all = likely valid

    if (code === '250') {

      return this.config.certaintyThresholds.valid;

    }
 
    // Default uncertain

    return 0.5;

  }
 
  /**

   * Core email validation function

   */

  public async validateEmail(

    email: string,

    senderEmail?: string

  ): Promise<ValidationResult> {

    const domain = email.split('@')[1];

    const sender = senderEmail || this.config.senderEmail;
 
    if (!domain) {

      return {

        isValid: false,

        reason: 'No domain found in email',

        validationCertainty: 0.05,

      };

    }
 
    let mxRecords: string[];

    try {

      mxRecords = await this.getMxRecords(domain);

    } catch {

      return {

        isValid: false,

        reason: 'Invalid Domain / No MX Records',

        validationCertainty: 0.05,

      };

    }
 
    // Try each MX record in priority order

    for (const mx of mxRecords) {

      let attempt = 0;
 
      while (attempt <= this.config.backoffDelays.length) {

        const result = await this.checkSmtp(mx, email, sender);
 
        // Only run the catch-all probe when the target address was actually
        // accepted (250). Running it after a hard bounce wastes a second
        // connection to the receiving server for no reason, and repeated
        // rapid connections from the same IP look like directory-harvesting
        // to receiving mail servers — increasing the odds of getting
        // rate-limited or blocked.

        const catchAllDetection = result.code === '250'
          ? await this.detectCatchAll(mx, domain, sender)
          : { isCatchAll: false, certainty: 1.0 };
 
        // Hard bounce = definitely invalid

        if (result.code.startsWith('5')) {

          return {

            isValid: false,

            reason: result.message,

            mxRecord: mx,

            isCatchAll: false,

            smtpCode: result.code,

            validationCertainty: this.config.certaintyThresholds.hardBounce,

            validationDetails: {

              attemptsMade: attempt + 1,

              catchAllDetected: catchAllDetection.isCatchAll,

            },

          };

        }
 
        // Success response + not catch-all = valid

        if (result.code === '250' && !catchAllDetection.isCatchAll) {

          return {

            isValid: true,

            reason: result.message,

            mxRecord: mx,

            isCatchAll: false,

            smtpCode: result.code,

            validationCertainty: this.config.certaintyThresholds.valid,

            validationDetails: {

              attemptsMade: attempt + 1,

              catchAllDetected: false,

            },

          };

        }
 
        // Success response but catch-all = uncertain/risky

        if (result.code === '250' && catchAllDetection.isCatchAll) {

          return {

            isValid: false, // Mark as invalid since we can't verify actual user

            reason: 'Catch-All Server Detected',

            mxRecord: mx,

            isCatchAll: true,

            smtpCode: result.code,

            validationCertainty: this.config.certaintyThresholds.catchAll,

            validationDetails: {

              attemptsMade: attempt + 1,

              catchAllDetected: true,

              catchAllCertainty: catchAllDetection.certainty,

            },

          };

        }
 
        // Greylisting = retry with backoff

        if (this.config.greylistCodes.includes(result.code)) {

          if (attempt < this.config.backoffDelays.length) {

            const delay = this.config.backoffDelays[attempt];

            console.log(

              `[Greylisted] Domain ${domain} on ${mx} returned ${result.code}. ` +

              `Retrying in ${delay}ms (attempt ${attempt + 1}/${this.config.backoffDelays.length})`

            );

            await this.sleep(delay);

            attempt++;

            continue;

          } else {

            return {

              isValid: false,

              reason: 'Greylisting: Retry Limit Exceeded',

              mxRecord: mx,

              isCatchAll: false,

              smtpCode: result.code,

              validationCertainty: this.config.certaintyThresholds.greylisted,

              validationDetails: {

                attemptsMade: attempt + 1,

              },

            };

          }

        }
 
        // Other response = try next MX

        break;

      }

    }
 
    return {

      isValid: false,

      reason: 'All MX servers failed to validate',

      validationCertainty: 0.3,

    };

  }
 
  /**

   * Check SMTP response for a single MX record

   */

  private checkSmtp(

    mxRecord: string,

    targetEmail: string,

    senderEmail: string,

    timeout: number = 5000

  ): Promise<{ isValid: boolean; code: string; message: string }> {

    return new Promise((resolve) => {

      const socket = new net.Socket();

      const localIp = this.getNextIp();

      let step = 0;

      let responseCode = '';
 
      const commands = [

        `EHLO ${senderEmail.split('@')[1]}\r\n`,

        `MAIL FROM:<${senderEmail}>\r\n`,

        `RCPT TO:<${targetEmail}>\r\n`,

        `QUIT\r\n`,

      ];
 
      // Handle timeout

      socket.setTimeout(timeout);

      socket.on('timeout', () => {

        socket.destroy();

        resolve({

          isValid: false,

          code: 'TIMEOUT',

          message: 'Connection timeout',

        });

      });
 
      // Handle errors

      socket.on('error', (err) => {

        socket.destroy();

        resolve({

          isValid: false,

          code: 'ERROR',

          message: `Connection error: ${err.message}`,

        });

      });
 
      // Handle SMTP responses
      //
      // `step` tracks which command we're waiting on a response FOR:
      //   step 0 = waiting on the initial 220 greeting (about to send EHLO)
      //   step 1 = waiting on the EHLO response (about to send MAIL FROM)
      //   step 2 = waiting on the MAIL FROM response (about to send RCPT TO)
      //   step 3 = waiting on the RCPT TO response — THIS is the one that
      //            actually determines mailbox deliverability.
      //
      // Only the response received while step === 3 may resolve the promise
      // as "Deliverable" or "Hard Bounce" for the target mailbox. Responses
      // at earlier steps (greeting/EHLO/MAIL FROM) just advance the
      // handshake — a 250 to MAIL FROM says nothing about whether the
      // target mailbox exists.

      socket.on('data', (data) => {

        const response = data.toString();

        responseCode = response.substring(0, 3);

        // Response to RCPT TO — this is the real verdict.
        if (step === 3) {

          socket.end();

          if (this.config.greylistCodes.includes(responseCode)) {
            return resolve({
              isValid: false,
              code: responseCode,
              message: 'Greylisted',
            });
          }

          if (responseCode.startsWith('5')) {
            return resolve({
              isValid: false,
              code: responseCode,
              message: 'Hard Bounce / Rejected',
            });
          }

          if (responseCode.startsWith('2')) {
            return resolve({
              isValid: true,
              code: responseCode,
              message: 'Deliverable',
            });
          }

          return resolve({
            isValid: false,
            code: responseCode,
            message: `Ambiguous RCPT TO response: ${responseCode}`,
          });

        }
 
        // Handle greylisting on earlier steps (some servers greylist at EHLO/MAIL FROM already)

        if (this.config.greylistCodes.includes(responseCode)) {

          socket.end();

          return resolve({

            isValid: false,

            code: responseCode,

            message: 'Greylisted',

          });

        }
 
        // Handle hard bounces / rejections on earlier steps

        if (responseCode.startsWith('5')) {

          socket.end();

          return resolve({

            isValid: false,

            code: responseCode,

            message: 'Hard Bounce / Rejected',

          });

        }
 
        // Handshake steps 0–2: send the next command and advance, but do
        // NOT resolve yet — we haven't reached the RCPT TO response.

        if (responseCode.startsWith('2') || responseCode.startsWith('3')) {

          if (step < commands.length) {

            socket.write(commands[step]);

            step++;

          }

        }

      });
 
      // Connect to MX server

      const connectOptions: net.SocketConnectOpts = {

        port: this.config.smtpPort,

        host: mxRecord,

      };
 
      if (localIp) {

        connectOptions.localAddress = localIp;

      }
 
      socket.connect(connectOptions);

    });

  }

}
 
/**

* Export default instance for easy usage

*/

export const defaultValidator = new GreylistValidator();