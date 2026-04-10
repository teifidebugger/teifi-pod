"use client"

import dynamic from "next/dynamic"

export const MemberRolesEditor = dynamic(
    () => import("./MemberRolesEditor").then((m) => m.MemberRolesEditor),
    { ssr: false }
)
