"use client"

import { createContext, useContext } from "react"

type PortalUserContextValue = {
    isStaffOrPreview: boolean
    staffTeamIds: string[] | null
}

const PortalUserContext = createContext<PortalUserContextValue>({ isStaffOrPreview: false, staffTeamIds: null })

export function PortalUserProvider({
    isStaffOrPreview,
    staffTeamIds,
    children,
}: {
    isStaffOrPreview: boolean
    staffTeamIds: string[] | null
    children: React.ReactNode
}) {
    return (
        <PortalUserContext.Provider value={{ isStaffOrPreview, staffTeamIds }}>
            {children}
        </PortalUserContext.Provider>
    )
}

/** Returns portal user flags available in any client component under the portal layout. */
export function usePortalUser() {
    return useContext(PortalUserContext)
}
