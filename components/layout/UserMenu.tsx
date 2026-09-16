"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

type UserMenuProps = {
  variant: "header" | "sidebar";
};

export default function UserMenu({ variant }: UserMenuProps) {
  const { data: session } = useSession();
  const userName = session?.user?.name ?? "Student";
  const userEmail = session?.user?.email ?? "";

  const avatar = (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
      {userName.charAt(0).toUpperCase()}
    </div>
  );

  if (variant === "header") {
    return (
      <Link href="/profile" className="flex min-w-0 items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold leading-4 text-gray-900">
            {userName}
          </p>

          <p className="mt-1 text-xs text-gray-500">{userEmail}</p>
        </div>

        {avatar}
      </Link>
    );
  }

  return (
    <Link href="/profile" className="mb-3 flex items-center gap-3 px-2">
      {avatar}

      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-900">{userName}</p>

        <p className="truncate text-xs text-gray-500">{userEmail}</p>
      </div>
    </Link>
  );
}
