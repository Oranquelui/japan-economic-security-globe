import "server-only";

import type { ContactPayload } from "../../types/contact";
import type { ContactConfig } from "./config";

interface SesRequest {
  url: string;
  body: string;
  headers: Record<string, string>;
}

const encoder = new TextEncoder();

function toHex(buffer: ArrayBufferLike): string {
  return [...new Uint8Array(buffer)].map((value) => value.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(value: string): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return toHex(hash);
}

async function hmacSha256(key: Uint8Array, value: string): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey("raw", Uint8Array.from(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(value));
  return new Uint8Array(signature);
}

async function deriveSigningKey(secretAccessKey: string, dateStamp: string, region: string, service: string) {
  const kDate = await hmacSha256(encoder.encode(`AWS4${secretAccessKey}`), dateStamp);
  const kRegion = await hmacSha256(kDate, region);
  const kService = await hmacSha256(kRegion, service);
  return hmacSha256(kService, "aws4_request");
}

function buildContactMailBody(payload: ContactPayload): string {
  return [
    `カテゴリ: ${payload.category}`,
    `返信先: ${payload.replyTo}`,
    `件名: ${payload.subject}`,
    "",
    payload.message
  ].join("\n");
}

function buildSesBody(payload: ContactPayload, config: ContactConfig): string {
  const body = new URLSearchParams();
  body.set("Action", "SendEmail");
  body.set("Version", "2010-12-01");
  body.set("Source", config.fromEmail);
  body.set("Destination.ToAddresses.member.1", config.toEmail);
  body.set("ReplyToAddresses.member.1", payload.replyTo);
  body.set("Message.Subject.Data", `[${payload.category}] ${payload.subject}`);
  body.set("Message.Body.Text.Data", buildContactMailBody(payload));
  body.set("Message.Body.Text.Charset", "UTF-8");
  body.set("Message.Subject.Charset", "UTF-8");
  return body.toString();
}

export async function buildSesSendEmailRequest(
  payload: ContactPayload,
  config: ContactConfig,
  now = new Date()
): Promise<SesRequest> {
  const body = buildSesBody(payload, config);
  const host = `email.${config.region}.amazonaws.com`;
  const url = `https://${host}/`;
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = await sha256Hex(body);
  const canonicalHeaders =
    `content-type:application/x-www-form-urlencoded; charset=utf-8\n` +
    `host:${host}\n` +
    `x-amz-content-sha256:${payloadHash}\n` +
    `x-amz-date:${amzDate}\n`;
  const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest = ["POST", "/", "", canonicalHeaders, signedHeaders, payloadHash].join("\n");
  const credentialScope = `${dateStamp}/${config.region}/ses/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    await sha256Hex(canonicalRequest)
  ].join("\n");
  const signingKey = await deriveSigningKey(config.secretAccessKey, dateStamp, config.region, "ses");
  const signature = await hmacSha256(signingKey, stringToSign);

  return {
    url,
    body,
    headers: {
      authorization: `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${toHex(signature.buffer)}`,
      "content-type": "application/x-www-form-urlencoded; charset=utf-8",
      host,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amzDate
    }
  };
}

export async function sendContactEmail(
  payload: ContactPayload,
  config: ContactConfig,
  fetchImpl: typeof fetch = fetch
): Promise<void> {
  const request = await buildSesSendEmailRequest(payload, config);
  const response = await fetchImpl(request.url, {
    method: "POST",
    headers: request.headers,
    body: request.body
  });

  if (!response.ok) {
    throw new Error(`SES request failed with status ${response.status}`);
  }
}
