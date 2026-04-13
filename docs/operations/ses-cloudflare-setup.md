# SES and Cloudflare Setup

This document covers the mail-delivery setup for the public contact form.

## Target delivery model

- AWS region: `ap-northeast-1`
- SES sender: `no-reply@quadrillionaaa.com`
- SES recipient: `ai@quadrillion-ai.com`
- DNS provider: Cloudflare
- App endpoint: `/api/contact`

## 1. Verify the domain in SES

Run with the configured AWS profile:

```bash
aws ses verify-domain-identity \
  --domain quadrillionaaa.com \
  --region ap-northeast-1 \
  --profile default
```

This returns a TXT verification token.

Add the TXT record in Cloudflare DNS:

- Type: `TXT`
- Name: `_amazonses.quadrillionaaa.com`
- Content: `<token returned by SES>`

## 2. Enable DKIM

Request DKIM tokens:

```bash
aws ses verify-domain-dkim \
  --domain quadrillionaaa.com \
  --region ap-northeast-1 \
  --profile default
```

SES returns three DKIM tokens. Add all three as CNAME records in Cloudflare DNS:

- Name: `<token>._domainkey.quadrillionaaa.com`
- Target: `<token>.dkim.amazonses.com`

## 3. SPF guidance

If `quadrillionaaa.com` does not already have an SPF record, add one TXT record for the root domain:

```text
v=spf1 include:amazonses.com ~all
```

If an SPF record already exists, merge `include:amazonses.com` into the existing record rather than creating a second SPF entry.

## 4. Recommended IAM scope

Do not use a broad AWS key for the Worker. Create a send-only IAM user or access key limited to SES send operations in `ap-northeast-1`.

Suggested policy shape:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ses:SendEmail",
        "ses:SendRawEmail"
      ],
      "Resource": "*"
    }
  ]
}
```

If you later restrict the resource to a verified identity ARN, update the Worker secrets accordingly.

## 5. Worker secrets / environment variables

Set these values for local preview and production deployment:

- `CONTACT_TO_EMAIL`
- `CONTACT_FROM_EMAIL`
- `SES_REGION`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

Rules:

- keep real values only in ignored local files such as `.env.local`
- never commit `.env.local` or any `.env.*.local` file
- never expose these values through `NEXT_PUBLIC_*`
- for deployed Workers, prefer `wrangler secret put` over plaintext vars

For Cloudflare Workers, set secrets with `wrangler secret put`:

```bash
wrangler secret put CONTACT_TO_EMAIL
wrangler secret put CONTACT_FROM_EMAIL
wrangler secret put SES_REGION
wrangler secret put AWS_ACCESS_KEY_ID
wrangler secret put AWS_SECRET_ACCESS_KEY
```

## 6. Cloudflare WAF / rate limiting

Do not rely on in-process memory for public-form rate limiting.

Add a Cloudflare WAF rate-limiting rule for `/api/contact`, for example:

- match path equals `/api/contact`
- count by client IP
- protect `POST` requests
- threshold example: `5 requests / 10 minutes`

If abuse appears after launch, add Turnstile in addition to the WAF rule.

## 7. Verification checklist

- SES domain verification status becomes `Success`
- DKIM status becomes `Success`
- SPF is present and valid
- `/contact` loads in preview and production
- valid submissions reach `ai@quadrillion-ai.com`
- invalid submissions return `400`
- Cloudflare WAF rule is active for `/api/contact`
