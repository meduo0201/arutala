# Security policy

Arutala stores menstrual-cycle data, which is sensitive personal information.
Security issues are taken seriously even though this is a small project.

## Reporting a vulnerability

Please do **not** open a public GitHub issue for security problems.

Instead, send the details to the maintainer at the contact address listed on
the live app's `/privacy` page (the Data Controller email shown there). Include:

- A short description of the issue and its impact.
- Steps to reproduce, or a proof-of-concept if you have one.
- Any relevant logs, screenshots, or affected URLs.
- Whether you have already disclosed the issue elsewhere.

You should expect an acknowledgement within 7 days and a status update within
30 days. The maintainer will coordinate disclosure with you once a fix is
shipped.

## Scope

Issues that are in scope:

- Authentication / authorization bypass.
- Row Level Security (RLS) policy bypass on Supabase.
- Cross-site scripting, CSRF, clickjacking on the web app.
- Cryptographic weaknesses in the end-to-end encryption layer.
- Sensitive data leaks (logs, error pages, third-party requests).
- Insecure default configurations affecting forked instances.

Issues that are usually **out of scope**:

- Bugs that require a compromised device or rooted browser.
- Denial-of-service that requires attacker-controlled rate limits.
- Vulnerabilities in third-party services (report to those vendors).
- Missing security headers on `*.pages.dev` previews (production only).

## Responsible disclosure

Researchers acting in good faith and within the scope above will not be
pursued legally for accidental, non-destructive testing. Do not access data
that does not belong to you, do not exfiltrate user data, and do not run
intrusive scans against the production deployment.
