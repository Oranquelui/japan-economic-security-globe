import "server-only";

export interface ContactConfig {
  toEmail: string;
  fromEmail: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
}

export function loadContactConfig(env = process.env): ContactConfig {
  const toEmail = env.CONTACT_TO_EMAIL;
  const fromEmail = env.CONTACT_FROM_EMAIL;
  const region = env.SES_REGION;
  const accessKeyId = env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = env.AWS_SECRET_ACCESS_KEY;

  if (!toEmail || !fromEmail || !region || !accessKeyId || !secretAccessKey) {
    throw new Error("Missing contact delivery configuration");
  }

  return {
    toEmail,
    fromEmail,
    region,
    accessKeyId,
    secretAccessKey
  };
}
