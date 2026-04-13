import { NextResponse } from "next/server";

import type { ContactPayload } from "../../../types/contact";
import { loadContactConfig } from "../../../lib/contact/config";
import { sendContactEmail } from "../../../lib/contact/ses";
import { validateContactPayload } from "../../../lib/contact/validation";

export async function POST(request: Request) {
  let payload: ContactPayload;

  try {
    payload = (await request.json()) as ContactPayload;
  } catch {
    return NextResponse.json({ message: "送信内容を読み取れませんでした。" }, { status: 400 });
  }

  const validation = validateContactPayload(payload);

  if (!validation.ok) {
    return NextResponse.json(
      {
        message: "入力内容を確認してください。",
        errors: validation.errors
      },
      { status: 400 }
    );
  }

  try {
    await sendContactEmail(payload, loadContactConfig());
    return NextResponse.json({ message: "問い合わせを送信しました。" });
  } catch {
    return NextResponse.json({ message: "現在は送信できません。時間をおいて再度お試しください。" }, { status: 502 });
  }
}
