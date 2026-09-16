"use client";

import Image from "next/image";
import Navigation from "./Navigation";
import UserMenu from "./UserMenu";
import { signOut } from "next-auth/react";

import { LogOut } from "lucide-react";

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-gray-200 bg-white px-4 py-5 md:flex">
      {/* Logo */}
      <div className="mb-5 shrink-0 border-b border-gray-100 px-2 pb-5">
        <Image
          src="/logo.jpg"
          alt="Логотип Политехнического Университета Молдовы"
          width={150}
          height={70}
          priority
          className="h-auto w-[145px] object-contain"
        />

        <p className="mt-3 max-w-[190px] text-xs font-medium leading-5 text-gray-500">
          Политехнический Университет Молдовы
        </p>
      </div>

      {/* Navigation */}
      <Navigation />

      {/* User */}
      <div className="shrink-0 border-t border-gray-100 pt-4">
        <UserMenu variant="sidebar" />

        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/auth" })}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900"
        >
          <LogOut size={18} />

          <span>Выйти</span>
        </button>
      </div>
    </aside>
  );
}
