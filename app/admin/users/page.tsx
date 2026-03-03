import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import UserClient from "./UserClient";

export const dynamic = "force-dynamic";

export default async function UsersManagementWrapper() {
  const session = await getServerSession(authOptions);

  if (
    !session ||
    (session.user as any)?.role !== "admin"
  ) {
    redirect("/");
  }

  return <UserClient />;
}
