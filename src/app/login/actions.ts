"use server";

import { redirect } from "next/navigation";
import { verifyPasscode, issueSession, setSessionCookie } from "@/lib/auth";

export async function loginAction(formData: FormData) {
  const passcode = String(formData.get("passcode") ?? "");
  if (!verifyPasscode(passcode)) {
    return { error: "Wrong passcode" };
  }
  const token = issueSession();
  await setSessionCookie(token);
  redirect("/");
}
