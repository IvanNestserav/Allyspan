# Allyspan Journal submission delivery

Prepared service, not a live submission endpoint. The public form remains closed.

## Architecture

The GitHub Pages site stays on its existing domain. A separate Cloudflare Worker receives validated multipart submissions, verifies a Turnstile challenge, sends the manuscript and metadata to `journal@allyspan.org` through Resend, and requests a separate author receipt. The Journal address already forwards to the owner's verified Gmail destination.

Manuscripts are not put in a public bucket, repository, URL, analytics event or application log. This service has no database or file bucket: attachments pass through Worker memory into the private editorial email. Resend, Cloudflare routing and the editorial mailbox necessarily process the submission. Emails and attachments remain with those services according to their settings and deletion actions. There is no automatic retention/deletion process in this version.

The 10 MB total attachment limit was approved by Ivan. Editable files: DOCX, DOC, Pages, TXT, RTF, ODT. PDF is a companion; supporting images are PNG/JPG. Unknown/empty extensions and basic format mismatches are rejected. This is not a malware scanner; editorial staff must treat incoming attachments as untrusted.

The existing Classroom Studio Worker, databases, storage, authentication and release gates are untouched.

## Cloudflare setup - owner's account

1. In Workers & Pages, create a Worker connected to the existing GitHub repository `IvanNestserav/Allyspan`. Set root directory to `journal-worker`, no framework/build command, deploy command `npx wrangler deploy`. The root package pins Wrangler. Keep submissions closed on first deployment.
2. Create a managed Turnstile widget for `www.allyspan.org` and `allyspan.org`. Put its public site key in Worker variable `TURNSTILE_SITE_KEY`. Put the secret in encrypted Worker secret `TURNSTILE_SECRET_KEY`.
3. Add encrypted Worker secret `RESEND_API_KEY`, authorized for the verified sending domain `allyspan.org`. Use an existing appropriate sending key or create a narrowly scoped one in Resend. Do not put keys in chat, GitHub, screenshots or frontend code. The sender is `The Allyspan Journal <journal@allyspan.org>` and the Reply-To is the Journal address (or author on the editorial message).
4. Wrangler config creates the `JOURNAL_RATE_LIMITER` binding: five requests per minute per IP per Cloudflare location. Confirm namespace `782631904` is not shared with another service. Rate limits are approximate and per-location; Turnstile is also mandatory. Request bodies are limited while streaming, before parsing.
5. The config defaults `SUBMISSIONS_OPEN=false`. Set it true only for a controlled delivery check after all secrets and bindings exist. Set the actual returned HTTPS Worker origin in the frontend `submission-config.js`; never guess a workers.dev address. The default frontend configuration is `enabled:false` and `apiBase:""`.

CLI alternative, from this directory on a machine already authorized to Cloudflare:

```sh
npm install
npx wrangler login
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put TURNSTILE_SECRET_KEY
npx wrangler deploy
```

Set the public site key in the Cloudflare dashboard after deployment. The tracked config deliberately declares submissions closed; a later deployment may restore those declared values. Recheck settings after every deployment and keep the service closed until real delivery is verified. `keep_vars` preserves other dashboard variables. Do not override the existing Classroom Studio deployment.

## Real delivery checks required before public launch

- Confirm `journal@allyspan.org` forwards a test message into the intended private inbox.
- Confirm the Resend domain is verified for `journal@allyspan.org` and the configured API key can send from it.
- Test on a controlled frontend page at an approved host with an actual managed Turnstile challenge. Use only synthetic manuscript data and a consenting test inbox.
- Confirm editorial email arrives with readable metadata and correct manuscript/PDF/image attachments. Verify Reply-To is the author.
- Confirm author receipt arrives, has the same reference and policy version, says submission is not acceptance, and replies to `journal@allyspan.org`.
- Confirm a repeated request uses Resend idempotency keys and does not duplicate either message within the provider's 24-hour window. Keep the same submission ID when retrying. Turnstile tokens are single-use; refresh the check before retrying.
- Confirm invalid and oversized submissions, failed challenges, bad origins, rate limits and service errors do not report success.
- Receipt failure after editorial acceptance must show received with receipt unconfirmed, not "not sent". A network failure cannot prove delivery either way; the form tells authors to keep their details and reference.
- Reconcile the live privacy page using the draft below, then enable the single guide button as a link to `/showcase/submit-your-work/`. Remove preview-only wording and noindex on the form only when it is actually live. Do not enable the button merely because the receiving address exists.

Automated checks (no network, no real emails):

```sh
npm test
```

23 server tests cover validation and failure paths. Passing mocks is not proof of production delivery. There is no delivery webhook, bounce tracking, background receipt retry or editorial portal in this version. Provider API acceptance is not proof of inbox arrival. SMTP delivery must be checked in the test inboxes. Do not make stronger promises in the UI.

## Draft live privacy text - publish only with the live service

Your manuscript, selected attachments, author information and declarations are sent over HTTPS through Cloudflare to Resend for delivery to the Journal's private editorial inbox. `journal@allyspan.org` forwards to the owner's verified Gmail inbox. The public site and submission service do not publish manuscripts or create public download links. Authorized editorial personnel and necessary service providers may process them for editorial assessment.

Cloudflare Turnstile checks requests to prevent abuse. The submission endpoint applies a short-term rate limit using the request IP. The application does not log form contents or save them in browser storage, a database or a file bucket. Your browser holds unfinished entries while the page is open. Cloudflare and email providers may retain ordinary technical records according to their service settings.

Submission emails, attachments and editorial correspondence remain in the private editorial mailbox until deleted; this version does not implement automatic expiry. Contact `journal@allyspan.org` with your reference to request withdrawal or deletion. Do not send confidential participant records, signed consent forms, home addresses or student IDs. Submitting for assessment does not grant publication rights; final publication requires a separate agreement and author proof approval.

## Operational notes

- No API key is delivered to the browser. `TURNSTILE_SITE_KEY` is public; both secrets stay in Cloudflare.
- No application logs include manuscript content, author emails or provider error payloads.
- Responses expose no credentials or email provider IDs.
- The service's `/config` route reports whether all required bindings/variables are present. This is configuration readiness, not a guarantee of mailbox delivery.
- Leave the default close switch in place if verification is incomplete. Retest after configuration or sending-domain changes.
- The source is in the same GitHub repository for maintainability; storing source there does not deploy a Worker or provision secrets.
