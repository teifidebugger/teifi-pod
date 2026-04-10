"use client"

import dynamic from "next/dynamic"

export const ProjectActionsClient = dynamic(
    () => import("./ProjectActions").then((m) => m.ProjectActions),
    { ssr: false }
)
