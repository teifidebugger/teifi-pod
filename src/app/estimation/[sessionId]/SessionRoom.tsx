"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    ArrowDown,
    ArrowLeft,
    ArrowUp,
    Check,
    CheckCircle2,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Circle,
    Copy,
    ExternalLink,
    Eye,
    Info,
    Layers,
    ListFilter,
    Loader2,
    Pencil,
    Plus,
    RotateCcw,
    Trash2,
    UserPlus,
    Users,
    X,
} from "lucide-react"
import Link from "next/link"
import { PokerCards, DECKS } from "./PokerCards"
import { VoteReveal } from "./VoteReveal"
import { SessionSummaryDialog } from "./SessionSummaryDialog"
import {
    addPokerRound,
    getPokerSession,
    revealRound,
    updateSessionStatus,
    joinPokerSession,
    importProjectTasks,
    fetchLinearIssuesForSession,
    addLinearIssuesToSession,
    updatePokerSession,
    deletePokerRound,
    updatePokerRound,
    heartbeat,
    resetRound,
    reorderRounds,
    fetchLinearIssueDetail,
    getWorkspaceMembersForInvite,
    inviteMemberToSession,
} from "@/app/actions/estimation"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { STATUS_BADGE, STATUS_LABEL } from "@/app/estimation/_lib/status"
import { MarkdownRenderer } from "@/components/portal/MarkdownRenderer"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { formatDistanceToNow } from "date-fns"

type SessionSnap = Awaited<ReturnType<typeof getPokerSession>>
type RoundSnap = SessionSnap["rounds"][number]
type ParticipantSnap = SessionSnap["participants"][number]

type IssueDetailCache = {
    description: string | null
    comments: { id: string; body: string; createdAt: string; userName: string }[]
}

// ── IssueContextPanel ─────────────────────────────────────────────────────────

function IssueContextPanel({
    linearIssueId,
    detail,
    loading,
}: {
    linearIssueId: string | null | undefined
    detail: IssueDetailCache | undefined
    loading: boolean
}) {
    const [commentsOpen, setCommentsOpen] = useState(false)

    if (!linearIssueId) return null

    if (loading && !detail) {
        return (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Loading description…
            </div>
        )
    }

    if (!detail) return null

    return (
        <div className="space-y-4">
            <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Description</p>
                <MarkdownRenderer content={detail.description} />
            </div>

            {detail.comments.length > 0 && (
                <Collapsible open={commentsOpen} onOpenChange={setCommentsOpen}>
                    <CollapsibleTrigger asChild>
                        <button className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                            <ChevronRight
                                className={cn("h-3.5 w-3.5 transition-transform", commentsOpen && "rotate-90")}
                            />
                            {detail.comments.length} comment{detail.comments.length !== 1 ? "s" : ""}
                        </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-3 space-y-3">
                        {detail.comments.map((comment) => (
                            <div key={comment.id} className="flex gap-2.5">
                                <Avatar className="h-6 w-6 shrink-0 mt-0.5">
                                    <AvatarFallback className="text-[10px]">
                                        {comment.userName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-baseline gap-1.5 mb-1">
                                        <span className="text-xs font-medium">{comment.userName}</span>
                                        <span className="text-[10px] text-muted-foreground">
                                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                        {comment.body}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </CollapsibleContent>
                </Collapsible>
            )}
        </div>
    )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(name: string | null) {
    if (!name) return "?"
    return name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
}

const ROUND_STATUS_TOOLTIP: Record<string, string> = {
    VOTING: "Voting in progress — waiting for all participants",
    REVEALED: "Votes revealed — discuss before host confirms",
    COMPLETE: "Estimate confirmed — locked",
}

function roundStatusBadge(status: RoundSnap["status"], withTooltip = false) {
    const badge = status === "VOTING"
        ? <Badge variant="secondary" className="text-xs">Voting</Badge>
        : status === "REVEALED"
            ? <Badge className="bg-amber-500 text-white text-xs hover:bg-amber-500">Revealed</Badge>
            : <Badge className="bg-green-600 text-white text-xs hover:bg-green-600 gap-1"><CheckCircle2 className="h-3 w-3" /> Done</Badge>

    if (!withTooltip || !ROUND_STATUS_TOOLTIP[status]) return badge

    return (
        <Tooltip>
            <TooltipTrigger asChild>{badge}</TooltipTrigger>
            <TooltipContent>{ROUND_STATUS_TOOLTIP[status]}</TooltipContent>
        </Tooltip>
    )
}

function sessionStatusBadge(status: SessionSnap["status"]) {
    return (
        <Badge
            variant="outline"
            className={`text-[10px] h-5 px-1.5 font-medium ${STATUS_BADGE[status] ?? ""}`}
        >
            {STATUS_LABEL[status] ?? status}
        </Badge>
    )
}

// ── Main component ────────────────────────────────────────────────────────────

interface SessionRoomProps {
    initialSession: SessionSnap
    currentMemberId: string
    currentUserId: string
    isHost: boolean
    currentParticipantId: string | null
}

export function SessionRoom({
    initialSession,
    currentMemberId,
    // currentUserId reserved for future use (e.g. avatar display)
    isHost,
    currentParticipantId: initialParticipantId,
}: SessionRoomProps) {
    const [session, setSession] = useState<SessionSnap>(initialSession)
    const [activeRoundId, setActiveRoundId] = useState<string | null>(
        initialSession.rounds[0]?.id ?? null
    )
    const [showAddRound, setShowAddRound] = useState(false)
    const [addRoundTitle, setAddRoundTitle] = useState("")
    const [addRoundPending, startAddRound] = useTransition()
    const [revealPending, startReveal] = useTransition()
    const [statusPending, startStatus] = useTransition()
    const [joinPending, startJoin] = useTransition()
    const [showJoinDialog, setShowJoinDialog] = useState(false)
    const [copiedInvite, setCopiedInvite] = useState(false)
    const [inviteOpen, setInviteOpen] = useState(false)
    const [inviteMembers, setInviteMembers] = useState<Array<{
        id: string; userId: string; userName: string | null; userEmail: string | null; userImage: string | null; isParticipant: boolean
    }>>([])
    const [inviteMembersLoading, setInviteMembersLoading] = useState(false)
    const [invitePending, startInvite] = useTransition()
    const [importTasksPending, startImportTasks] = useTransition()
    const [importError, setImportError] = useState<string | null>(null)
    const [linearPickerOpen, setLinearPickerOpen] = useState(false)
    const [linearIssues, setLinearIssues] = useState<Array<{
        id: string; identifier: string; title: string; stateName: string; alreadyAdded: boolean
    }>>([])
    const [linearIssuesLoading, setLinearIssuesLoading] = useState(false)
    const [selectedLinearIds, setSelectedLinearIds] = useState<Set<string>>(new Set())
    const [addLinearPending, startAddLinear] = useTransition()
    const [showSummaryDialog, setShowSummaryDialog] = useState(false)
    const [deletePending, setDeletePending] = useState<string | null>(null)
    const [editingRoundId, setEditingRoundId] = useState<string | null>(null)
    const [editRoundTitle, setEditRoundTitle] = useState("")
    const [editRoundPending, startEditRound] = useTransition()
    const [showEditSession, setShowEditSession] = useState(false)
    const [editSessionName, setEditSessionName] = useState("")
    const [editSessionDesc, setEditSessionDesc] = useState("")
    const [editSessionDeck, setEditSessionDeck] = useState("")
    const [editSessionPending, startEditSession] = useTransition()
    const [resetRoundPending, startResetRound] = useTransition()
    const [reorderPending, startReorder] = useTransition()

    const [currentParticipantId, setCurrentParticipantId] = useState(initialParticipantId)

    // Onboarding banner — dismissed via localStorage
    const [onboarded, setOnboarded] = useState(() =>
        typeof window !== "undefined" && localStorage.getItem("teifi_estimation_onboarded") === "true"
    )
    const [voteHintDismissed, setVoteHintDismissed] = useState(() =>
        typeof window !== "undefined" && localStorage.getItem("teifi_vote_hint_dismissed") === "true"
    )
    function dismissOnboarding() {
        setOnboarded(true)
        localStorage.setItem("teifi_estimation_onboarded", "true")
    }

    // Issue detail cache — keyed by linearIssueId, fetched once per round change
    const [issueDetailCache, setIssueDetailCache] = useState<Map<string, IssueDetailCache>>(new Map())
    const [issueDetailLoading, setIssueDetailLoading] = useState(false)

    // 3-second JSON polling (no SSE — Neon has no LISTEN/NOTIFY)
    const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    async function fetchSnapshot() {
        try {
            const res = await fetch(`/api/v1/estimation/${session.id}/stream`)
            if (res.ok) {
                const data = (await res.json()) as SessionSnap
                setSession(data)
                const me = data.participants.find((p: ParticipantSnap) => p.member.id === currentMemberId)
                if (me) setCurrentParticipantId(me.id)
            }
        } catch {
            // network error — retry next cycle
        }
        schedulePoll()
    }

    function schedulePoll() {
        if (pollTimerRef.current) clearTimeout(pollTimerRef.current)
        pollTimerRef.current = setTimeout(fetchSnapshot, 3000)
    }

    useEffect(() => {
        schedulePoll()
        return () => {
            if (pollTimerRef.current) clearTimeout(pollTimerRef.current)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Fetch Linear issue detail on active round change (cached, no re-fetch on poll)
    useEffect(() => {
        const linearIssueId = session.rounds.find((r) => r.id === activeRoundId)?.linearIssueId
        if (!linearIssueId) return
        if (issueDetailCache.has(linearIssueId)) return

        setIssueDetailLoading(true)
        fetchLinearIssueDetail(linearIssueId, session.id)
            .then((detail) => {
                setIssueDetailCache((prev) => new Map(prev).set(linearIssueId, detail))
            })
            .catch((err) => {
                const msg = err instanceof Error ? err.message : ""
                if (msg.includes("reconnect") || msg.includes("token") || msg.includes("Connect your Linear")) {
                    toast.error("Linear disconnected", {
                        description: "Your Linear token expired. Reconnect to continue.",
                        action: { label: "Reconnect", onClick: () => window.location.href = `/settings/integrations?returnTo=${encodeURIComponent(`/estimation/${session.id}`)}` },
                        duration: 8000,
                    })
                }
            })
            .finally(() => setIssueDetailLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeRoundId])

    // ── Derived data ──────────────────────────────────────────────────────────

    const activeRound = session.rounds.find((r) => r.id === activeRoundId) ?? session.rounds[0] ?? null
    const activeRoundIndex = activeRound ? session.rounds.findIndex((r) => r.id === activeRound.id) : -1

    const deck =
        session.deckType === "custom" && session.customDeck.length > 0
            ? session.customDeck
            : (DECKS[session.deckType] ?? DECKS.fibonacci)

    const myVote = activeRound?.votes.find(
        (v) => v.participant.member.id === currentMemberId
    )

    const isParticipant = currentParticipantId !== null

    // ── Heartbeat for presence tracking ──────────────────────────────────────
    useEffect(() => {
        if (!isParticipant) return
        const id = setInterval(() => { heartbeat(session.id) }, 30_000)
        return () => clearInterval(id)
    }, [session.id, isParticipant])

    const myParticipant = session.participants.find((p) => p.member.id === currentMemberId)
    const amObserver = myParticipant?.isObserver ?? false

    const voters = session.participants.filter((p) => !p.isObserver)
    const observers = session.participants.filter((p) => p.isObserver)

    // ── Actions ───────────────────────────────────────────────────────────────

    function handleAddRound() {
        if (!addRoundTitle.trim()) return
        startAddRound(async () => {
            try {
                const fd = new FormData()
                fd.append("sessionId", session.id)
                fd.append("title", addRoundTitle.trim())
                await addPokerRound(fd)
                setAddRoundTitle("")
                setShowAddRound(false)
                toast.success("Issue added")
                fetchSnapshot()
            } catch (err) {
                toast.error("Failed to add issue", { description: err instanceof Error ? err.message : undefined })
            }
        })
    }

    function handleReveal() {
        if (!activeRound) return
        startReveal(async () => {
            try {
                await revealRound(activeRound.id)
                toast.success("Votes revealed")
                fetchSnapshot()
            } catch (err) {
                toast.error("Failed to reveal votes", { description: err instanceof Error ? err.message : undefined })
            }
        })
    }

    function handleSessionStatus(status: "ACTIVE" | "COMPLETED") {
        startStatus(async () => {
            try {
                await updateSessionStatus(session.id, status)
                toast.success(status === "ACTIVE" ? "Session started" : "Session ended")
                fetchSnapshot()
            } catch (err) {
                toast.error("Failed to update session", { description: err instanceof Error ? err.message : undefined })
            }
        })
    }

    function handleJoin(asObserver: boolean) {
        setShowJoinDialog(false)
        startJoin(async () => {
            try {
                await joinPokerSession(session.id, asObserver)
                toast.success(asObserver ? "Joined as observer" : "Joined as voter")
                fetchSnapshot()
            } catch (err) {
                toast.error("Failed to join session", { description: err instanceof Error ? err.message : undefined })
            }
        })
    }

    function handleCopyLink() {
        const url = window.location.href
        navigator.clipboard.writeText(url).then(() => {
            setCopiedInvite(true)
            setTimeout(() => setCopiedInvite(false), 2000)
        })
    }

    async function handleInviteOpen(open: boolean) {
        setInviteOpen(open)
        if (open && inviteMembers.length === 0) {
            setInviteMembersLoading(true)
            try {
                const members = await getWorkspaceMembersForInvite(session.id)
                setInviteMembers(members)
            } catch {
                toast.error("Failed to load members")
            } finally {
                setInviteMembersLoading(false)
            }
        }
    }

    function handleInviteMember(memberId: string) {
        startInvite(async () => {
            try {
                await inviteMemberToSession(session.id, memberId)
                setInviteMembers((prev) =>
                    prev.map((m) => (m.id === memberId ? { ...m, isParticipant: true } : m))
                )
                fetchSnapshot()
                toast.success("Member invited")
            } catch (err) {
                toast.error("Failed to invite member", { description: err instanceof Error ? err.message : undefined })
            }
        })
    }

    function handleImportTasks() {
        setImportError(null)
        startImportTasks(async () => {
            try {
                const res = await importProjectTasks(session.id)
                fetchSnapshot()
                if (res.imported === 0) {
                    setImportError("All project tasks are already in this session.")
                } else {
                    toast.success(`Imported ${res.imported} task${res.imported !== 1 ? "s" : ""}`)
                }
            } catch (err) {
                const msg = err instanceof Error ? err.message : "Import failed"
                setImportError(msg)
                toast.error("Import failed", { description: msg })
            }
        })
    }

    async function handleOpenLinearPicker(open: boolean) {
        setLinearPickerOpen(open)
        if (open) {
            setSelectedLinearIds(new Set())
            setLinearIssuesLoading(true)
            try {
                const issues = await fetchLinearIssuesForSession(session.id)
                setLinearIssues(issues)
            } catch (err) {
                const msg = err instanceof Error ? err.message : "Failed to load Linear issues"
                const isTokenError = msg.includes("reconnect") || msg.includes("token")
                if (isTokenError) {
                    toast.error("Linear disconnected", {
                        description: "Your Linear token expired. Reconnect to continue.",
                        action: { label: "Reconnect", onClick: () => window.location.href = `/settings/integrations?returnTo=${encodeURIComponent(`/estimation/${session.id}`)}` },
                        duration: 8000,
                    })
                } else {
                    toast.error("Failed to load Linear issues", { description: msg })
                }
                setLinearPickerOpen(false)
            } finally {
                setLinearIssuesLoading(false)
            }
        }
    }

    function handleConfirmLinearPick() {
        const selected = linearIssues.filter((i) => selectedLinearIds.has(i.id))
        if (selected.length === 0) return
        startAddLinear(async () => {
            try {
                const res = await addLinearIssuesToSession(session.id, selected)
                setLinearPickerOpen(false)
                setSelectedLinearIds(new Set())
                toast.success(`Added ${res.added} issue${res.added !== 1 ? "s" : ""} to this session`)
                const hasEmptyDesc = selected.some((i) => !i.title.trim())
                if (hasEmptyDesc) {
                    toast.warning("Some issues have empty descriptions — consider adding context")
                }
                fetchSnapshot()
            } catch (err) {
                toast.error("Failed to add issues", { description: err instanceof Error ? err.message : undefined })
            }
        })
    }

    async function handleDeleteRound(roundId: string) {
        setDeletePending(roundId)
        try {
            await deletePokerRound(roundId)
            if (activeRoundId === roundId) {
                const remaining = session.rounds.filter((r) => r.id !== roundId)
                setActiveRoundId(remaining[0]?.id ?? null)
            }
            toast.success("Round deleted")
            fetchSnapshot()
        } catch (err) {
            toast.error("Failed to delete round", { description: err instanceof Error ? err.message : undefined })
        } finally {
            setDeletePending(null)
        }
    }

    function startEditRoundInline(round: RoundSnap) {
        setEditingRoundId(round.id)
        setEditRoundTitle(round.title)
    }

    function handleSaveEditRound() {
        if (!editingRoundId || !editRoundTitle.trim()) return
        startEditRound(async () => {
            try {
                await updatePokerRound(editingRoundId, { title: editRoundTitle.trim() })
                setEditingRoundId(null)
                toast.success("Round updated")
                fetchSnapshot()
            } catch (err) {
                toast.error("Failed to update round", { description: err instanceof Error ? err.message : undefined })
            }
        })
    }

    function navigateRound(direction: "prev" | "next") {
        if (activeRoundIndex === -1) return
        const nextIndex = direction === "prev" ? activeRoundIndex - 1 : activeRoundIndex + 1
        if (nextIndex >= 0 && nextIndex < session.rounds.length) {
            setActiveRoundId(session.rounds[nextIndex].id)
        }
    }

    function openEditSession() {
        setEditSessionName(session.name)
        setEditSessionDesc(session.description ?? "")
        setEditSessionDeck(session.deckType)
        setShowEditSession(true)
    }

    function handleSaveEditSession() {
        if (!editSessionName.trim()) return
        startEditSession(async () => {
            try {
                await updatePokerSession(session.id, {
                    name: editSessionName.trim(),
                    description: editSessionDesc.trim(),
                    deckType: editSessionDeck,
                })
                setShowEditSession(false)
                toast.success("Session updated")
                fetchSnapshot()
            } catch (err) {
                toast.error("Failed to update session", { description: err instanceof Error ? err.message : undefined })
            }
        })
    }

    function handleResetRound() {
        if (!activeRound) return
        startResetRound(async () => {
            try {
                await resetRound(activeRound.id)
                toast.success("Round reset to voting")
                fetchSnapshot()
            } catch (err) {
                toast.error("Failed to reset round", { description: err instanceof Error ? err.message : undefined })
            }
        })
    }

    function handleReorderRound(index: number, direction: "up" | "down") {
        const newRounds = [...session.rounds]
        const swapIndex = direction === "up" ? index - 1 : index + 1
        if (swapIndex < 0 || swapIndex >= newRounds.length) return
        ;[newRounds[index], newRounds[swapIndex]] = [newRounds[swapIndex], newRounds[index]]
        const orderedIds = newRounds.map((r) => r.id)
        startReorder(async () => {
            try {
                await reorderRounds(session.id, orderedIds)
                fetchSnapshot()
            } catch (err) {
                toast.error("Failed to reorder", { description: err instanceof Error ? err.message : undefined })
            }
        })
    }

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-sidebar-border px-6 py-3">
                <div className="flex min-w-0 items-center gap-3">
                    <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" aria-label="Back to sessions" asChild>
                        <Link href="/estimation">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <h1 className="truncate text-lg font-semibold">{session.name}</h1>
                            {sessionStatusBadge(session.status)}
                            {isHost && (
                                <Button size="icon" variant="ghost" className="h-6 w-6" aria-label="Edit session" onClick={openEditSession}>
                                    <Pencil className="h-3 w-3" />
                                </Button>
                            )}
                        </div>
                        {session.status === "LOBBY" && (
                            <p className="text-xs text-muted-foreground mt-0.5">Waiting for host to start — invite your team while you wait</p>
                        )}
                        {session.description && (
                            <p className="text-xs text-muted-foreground">{session.description}</p>
                        )}
                    </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                    <Popover open={inviteOpen} onOpenChange={handleInviteOpen}>
                        <PopoverTrigger asChild>
                            <Button size="sm" variant="outline">
                                <UserPlus className="mr-1 h-3 w-3" />
                                Invite
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72 p-0" align="end">
                            <Command>
                                <CommandInput placeholder="Search members..." />
                                <CommandList>
                                    <CommandEmpty>
                                        {inviteMembersLoading ? "Loading..." : "No members found."}
                                    </CommandEmpty>
                                    <CommandGroup>
                                        {inviteMembers.map((m) => (
                                            <CommandItem
                                                key={m.id}
                                                value={`${m.userName ?? ""} ${m.userEmail ?? ""}`}
                                                onSelect={() => {
                                                    if (!m.isParticipant) handleInviteMember(m.id)
                                                }}
                                                disabled={m.isParticipant || invitePending}
                                                className="flex items-center gap-2"
                                            >
                                                <Avatar className="h-6 w-6 shrink-0">
                                                    <AvatarImage src={m.userImage ?? undefined} />
                                                    <AvatarFallback className="text-[10px]">
                                                        {initials(m.userName)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm truncate">{m.userName ?? "Unknown"}</p>
                                                    {m.userEmail && (
                                                        <p className="text-xs text-muted-foreground truncate">{m.userEmail}</p>
                                                    )}
                                                </div>
                                                {m.isParticipant && (
                                                    <Check className="h-3.5 w-3.5 text-green-600 shrink-0" />
                                                )}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                            <div className="border-t border-sidebar-border p-2 space-y-1">
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="w-full justify-start text-xs text-muted-foreground"
                                    onClick={handleCopyLink}
                                >
                                    <Copy className="mr-1.5 h-3 w-3" />
                                    {copiedInvite ? "Link copied!" : "Copy session link"}
                                </Button>
                                <p className="text-[11px] text-muted-foreground/60 px-2">Anyone with this link can join as a voter</p>
                            </div>
                        </PopoverContent>
                    </Popover>
                    {!isParticipant && (
                        <Button size="sm" variant="outline" onClick={() => setShowJoinDialog(true)} disabled={joinPending}>
                            {joinPending && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                            Join session
                        </Button>
                    )}
                    {isHost && session.status === "LOBBY" && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span>
                                    <Button size="sm" onClick={() => handleSessionStatus("ACTIVE")} disabled={statusPending || session.rounds.length === 0}>
                                        {statusPending && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                                        Start session
                                    </Button>
                                </span>
                            </TooltipTrigger>
                            <TooltipContent>
                                {session.rounds.length === 0
                                    ? "Add at least one issue before starting"
                                    : "Begin the session — participants can start voting"}
                            </TooltipContent>
                        </Tooltip>
                    )}
                    {isHost && session.status === "ACTIVE" && (
                        <Button size="sm" variant="outline" onClick={() => setShowSummaryDialog(true)} disabled={statusPending}>
                            End session
                        </Button>
                    )}
                </div>
            </div>

            {/* Body: two-column layout */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left: Round list */}
                <aside className="flex w-80 flex-shrink-0 flex-col border-r border-sidebar-border">
                    <div className="flex items-center justify-between px-4 py-3">
                        <span className="text-sm font-medium">Issues</span>
                        {isHost && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button size="sm" variant="ghost" className="h-7 gap-1 px-2" aria-label="Add issues">
                                        <Plus className="h-3.5 w-3.5" />
                                        <ChevronDown className="h-3 w-3" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setShowAddRound((v) => !v)}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add manually
                                    </DropdownMenuItem>
                                    {session.project && (
                                        <DropdownMenuItem
                                            onClick={handleImportTasks}
                                            disabled={importTasksPending}
                                        >
                                            {importTasksPending
                                                ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                : <Plus className="mr-2 h-4 w-4 text-blue-500" />
                                            }
                                            Import project tasks
                                        </DropdownMenuItem>
                                    )}
                                    {session.project?.linearTeamId && (
                                        <DropdownMenuItem
                                            onClick={() => handleOpenLinearPicker(true)}
                                            disabled={addLinearPending}
                                        >
                                            <ListFilter className="mr-2 h-4 w-4" />
                                            Pick from Linear
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>

                    {session.project && !session.project.linearTeamId && isHost && (
                        <p className="px-4 pb-2 text-xs text-muted-foreground">
                            <Link href={`/projects/${session.project.id}/settings`} className="underline underline-offset-2 hover:text-foreground">
                                Link project to Linear &rarr;
                            </Link>
                        </p>
                    )}

                    {importError && (
                        <p className="px-4 pb-2 text-xs text-destructive">{importError}</p>
                    )}

                    <div className="flex-1 overflow-y-auto">
                        {session.rounds.length === 0 && (
                            <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                                <div className="rounded-full border-2 border-dashed border-sidebar-border p-3">
                                    <Plus className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <p className="text-xs font-medium text-muted-foreground">No issues yet</p>
                                {isHost && <p className="text-xs text-muted-foreground/60">Use the + button above to add issues</p>}
                            </div>
                        )}
                        {session.rounds.map((round) => (
                            <div
                                key={round.id}
                                className={cn(
                                    "group relative border-b border-sidebar-border border-l-2 border-l-transparent transition-colors hover:bg-muted/40",
                                    round.id === activeRoundId && "border-l-primary bg-sidebar-accent"
                                )}
                            >
                                {editingRoundId === round.id ? (
                                    <div className="flex items-center gap-2 px-4 py-2">
                                        <Input
                                            value={editRoundTitle}
                                            onChange={(e) => setEditRoundTitle(e.target.value)}
                                            className="h-7 text-sm"
                                            autoFocus
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") handleSaveEditRound()
                                                if (e.key === "Escape") setEditingRoundId(null)
                                            }}
                                        />
                                        <Button size="sm" className="h-7 px-2 text-xs" onClick={handleSaveEditRound} disabled={editRoundPending}>
                                            {editRoundPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
                                        </Button>
                                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setEditingRoundId(null)}>
                                            ✕
                                        </Button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setActiveRoundId(round.id)}
                                        className="flex w-full items-start gap-2 px-4 py-3 text-left"
                                    >
                                        <span
                                            className={cn(
                                                "mt-1.5 h-2 w-2 flex-shrink-0 rounded-full transition-colors",
                                                round.id === activeRoundId
                                                    ? "bg-primary"
                                                    : "bg-transparent"
                                            )}
                                        />
                                        <div className="min-w-0 flex-1">
                                            <p className={cn("truncate text-sm leading-tight", round.id === activeRoundId ? "font-semibold" : "font-medium")}>
                                                {round.linearIssueIdentifier && round.linearIssueId && (
                                                    <a
                                                        href={`https://linear.app/issue/${round.linearIssueId}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="mr-1 inline-flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        {round.linearIssueIdentifier}
                                                        <ExternalLink className="h-2.5 w-2.5" />
                                                    </a>
                                                )}
                                                {round.title}
                                            </p>
                                            <div className="mt-1 flex items-center gap-1.5">
                                                {(round.status === "COMPLETE" || round.status === "REVEALED") && roundStatusBadge(round.status, true)}
                                                {round.finalEstimate && (
                                                    <span className="font-mono text-xs text-muted-foreground">
                                                        → {round.finalEstimate}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                )}
                                {isHost && editingRoundId !== round.id && (
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden items-center gap-0.5 group-hover:flex group-focus-within:flex">
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-6 w-6"
                                            aria-label="Move up"
                                            onClick={(e) => { e.stopPropagation(); handleReorderRound(session.rounds.findIndex((r) => r.id === round.id), "up") }}
                                            disabled={reorderPending || session.rounds.findIndex((r) => r.id === round.id) === 0}
                                        >
                                            <ArrowUp className="h-3 w-3" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-6 w-6"
                                            aria-label="Move down"
                                            onClick={(e) => { e.stopPropagation(); handleReorderRound(session.rounds.findIndex((r) => r.id === round.id), "down") }}
                                            disabled={reorderPending || session.rounds.findIndex((r) => r.id === round.id) === session.rounds.length - 1}
                                        >
                                            <ArrowDown className="h-3 w-3" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-6 w-6"
                                            aria-label="Edit title"
                                            onClick={(e) => { e.stopPropagation(); startEditRoundInline(round) }}
                                        >
                                            <Pencil className="h-3 w-3" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-6 w-6 text-destructive hover:text-destructive"
                                            aria-label="Delete round"
                                            onClick={(e) => { e.stopPropagation(); handleDeleteRound(round.id) }}
                                            disabled={deletePending === round.id}
                                        >
                                            {deletePending === round.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ))}
                        {showAddRound && (
                            <div className="border-b border-sidebar-border px-4 py-3 space-y-2">
                                <Label className="text-xs">Issue title</Label>
                                <Input
                                    value={addRoundTitle}
                                    onChange={(e) => setAddRoundTitle(e.target.value)}
                                    placeholder="e.g. Implement login page"
                                    className="h-8 text-sm"
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") handleAddRound()
                                        if (e.key === "Escape") setShowAddRound(false)
                                    }}
                                    autoFocus
                                />
                                <div className="flex gap-2">
                                    <Button size="sm" onClick={handleAddRound} disabled={addRoundPending || !addRoundTitle.trim()}>
                                        {addRoundPending && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                                        Add
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => setShowAddRound(false)}>
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </aside>

                {/* Right: Active round voting panel — 3-zone layout */}
                <main className="flex flex-1 flex-col overflow-hidden">
                    {!activeRound && session.rounds.length === 0 ? (
                        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center p-8">
                            {session.status === "LOBBY" && isHost ? (
                                <div className="space-y-2 p-4 rounded-lg border border-sidebar-border bg-sidebar/30 w-full max-w-xs">
                                    <p className="text-sm font-medium">Before you start</p>
                                    <div className="space-y-1.5 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            {session.rounds.length > 0 ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Circle className="h-4 w-4" />}
                                            <span>Add issues to estimate</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {session.participants.length > 1 ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Circle className="h-4 w-4" />}
                                            <span>Invite teammates</span>
                                        </div>
                                    </div>
                                </div>
                            ) : session.status === "LOBBY" ? (
                                <>
                                    <Layers className="h-10 w-10 text-muted-foreground/30" />
                                    <div>
                                        <p className="text-sm font-medium">Waiting for the host to start the session...</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">The host will add issues and begin voting shortly</p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <Layers className="h-10 w-10 text-muted-foreground/30" />
                                    <div>
                                        <p className="text-sm font-medium">{isHost ? "No issues yet" : "Nothing to vote on yet"}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {isHost ? "Add issues using the + button in the sidebar" : "Waiting for the host to add issues"}
                                        </p>
                                    </div>
                                    {isHost && (
                                        <p className="text-xs text-muted-foreground/60">Use the sidebar to add your first issue</p>
                                    )}
                                </>
                            )}
                        </div>
                    ) : !activeRound ? (
                        <div className="flex flex-1 items-center justify-center text-muted-foreground">
                            <p className="text-sm">Select or add an issue to start estimating.</p>
                        </div>
                    ) : (
                        <>
                            {/* Zone 1: Fixed header — title, nav, actions */}
                            <div className="shrink-0 border-b border-sidebar-border px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex min-w-0 items-center gap-2">
                                        {/* Multi-round navigation */}
                                        {session.rounds.length > 1 && (
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-7 w-7"
                                                    aria-label="Previous round"
                                                    onClick={() => navigateRound("prev")}
                                                    disabled={activeRoundIndex <= 0}
                                                >
                                                    <ChevronLeft className="h-4 w-4" />
                                                </Button>
                                                <span className="text-xs text-muted-foreground tabular-nums">
                                                    {activeRoundIndex + 1} / {session.rounds.length}
                                                </span>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-7 w-7"
                                                    aria-label="Next round"
                                                    onClick={() => navigateRound("next")}
                                                    disabled={activeRoundIndex >= session.rounds.length - 1}
                                                >
                                                    <ChevronRight className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                        <div className="min-w-0">
                                            <h2 className="truncate text-base font-semibold">{activeRound.title}</h2>
                                            {activeRound.linearIssueIdentifier && activeRound.linearIssueId && (
                                                <a
                                                    href={`https://linear.app/issue/${activeRound.linearIssueId}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground"
                                                >
                                                    {activeRound.linearIssueIdentifier}
                                                    <ExternalLink className="h-2.5 w-2.5" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-2">
                                        {roundStatusBadge(activeRound.status)}
                                        {activeRound.status === "VOTING" && (
                                            isHost ? (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={handleReveal}
                                                            disabled={revealPending}
                                                        >
                                                            {revealPending
                                                                ? <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                                                : <Eye className="mr-1 h-3 w-3" />
                                                            }
                                                            Reveal votes
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Show all votes at once</TooltipContent>
                                                </Tooltip>
                                            ) : isParticipant && !amObserver ? (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <span>
                                                            <Button size="sm" variant="outline" disabled>
                                                                <Eye className="mr-1 h-3 w-3" />
                                                                Reveal votes
                                                            </Button>
                                                        </span>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Only the session host can reveal votes</TooltipContent>
                                                </Tooltip>
                                            ) : null
                                        )}
                                        {isHost && (activeRound.status === "REVEALED" || activeRound.status === "COMPLETE") && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={handleResetRound}
                                                disabled={resetRoundPending}
                                            >
                                                {resetRoundPending
                                                    ? <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                                    : <RotateCcw className="mr-1 h-3 w-3" />
                                                }
                                                Re-vote
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {/* Completed round summary chip */}
                                {activeRound.status === "COMPLETE" && activeRound.finalEstimate && (
                                    <div className="mt-2 flex items-center gap-2">
                                        <Badge className="bg-green-600 text-white hover:bg-green-600 gap-1 px-3 py-1 text-sm font-mono">
                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                            Final: {activeRound.finalEstimate}
                                        </Badge>
                                    </div>
                                )}
                            </div>

                            {/* Zone 2: Scrollable context — description, comments */}
                            <div className="flex-1 overflow-y-auto px-6 py-4">
                                <IssueContextPanel
                                    linearIssueId={activeRound.linearIssueId}
                                    detail={activeRound.linearIssueId ? issueDetailCache.get(activeRound.linearIssueId) : undefined}
                                    loading={issueDetailLoading}
                                />
                            </div>

                            {/* Zone 3: Sticky voting card — always visible at bottom */}
                            <div className="shrink-0 border-t border-sidebar-border px-6 py-4 space-y-3">
                                {!onboarded && (
                                    <div className="rounded-lg border border-sidebar-border bg-sidebar/40 p-3 flex items-start gap-3 text-sm">
                                        <Info className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                                        <p className="text-muted-foreground flex-1">
                                            <span className="font-medium text-foreground">How planning poker works: </span>
                                            Pick a card → Host reveals all votes → Discuss → Host confirms estimate.
                                        </p>
                                        <button onClick={dismissOnboarding} className="text-muted-foreground hover:text-foreground shrink-0">
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                )}
                                <Card>
                                    <CardContent className="pt-4">
                                        {activeRound.status === "VOTING" && (
                                            isParticipant && !amObserver ? (
                                                <div className="space-y-3">
                                                    <PokerCards
                                                        roundId={activeRound.id}
                                                        deckType={session.deckType}
                                                        customDeck={session.customDeck}
                                                        selectedValue={myVote?.value ?? null}
                                                    />
                                                    {myVote && !voteHintDismissed && (
                                                        <div className="flex items-start gap-2 rounded-md border border-sidebar-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                                                            <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                                                            <span className="flex-1">Your vote is hidden until the host reveals — this prevents anchoring bias.</span>
                                                            <button onClick={() => { setVoteHintDismissed(true); localStorage.setItem("teifi_vote_hint_dismissed", "true") }} className="hover:text-foreground shrink-0">
                                                                <X className="h-3 w-3" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : isParticipant && amObserver ? (
                                                <div className="flex flex-col items-center gap-3 py-4 text-center">
                                                    <div className="rounded-full bg-muted/60 p-3">
                                                        <Eye className="h-5 w-5 text-muted-foreground" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium">You're observing this session</p>
                                                        <p className="mt-1 text-xs text-muted-foreground">You can see results when the host reveals — your input won't count</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-sm text-muted-foreground">
                                                    Join the session to cast your vote.
                                                </p>
                                            )
                                        )}
                                        {(activeRound.status === "REVEALED" || activeRound.status === "COMPLETE") && (
                                            <VoteReveal
                                                roundId={activeRound.id}
                                                roundTitle={activeRound.title}
                                                votes={activeRound.votes}
                                                isHost={isHost}
                                                finalEstimate={activeRound.finalEstimate}
                                                onRevote={handleResetRound}
                                                onNext={(() => {
                                                    const nextVoting = session.rounds.find((r, i) => i > activeRoundIndex && r.status === "VOTING")
                                                    return nextVoting ? () => setActiveRoundId(nextVoting.id) : undefined
                                                })()}
                                            />
                                        )}
                                    </CardContent>
                                </Card>

                                {activeRound.status === "VOTING" && (() => {
                                    const voted = activeRound.votes.length
                                    const total = voters.length
                                    const allVoted = total > 0 && voted >= total
                                    if (allVoted) {
                                        return (
                                            <div className="mt-3 space-y-2">
                                                <div className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
                                                    <CheckCircle2 className="h-4 w-4" />
                                                    All votes in!
                                                </div>
                                                {isHost ? (
                                                    <Button onClick={handleReveal} disabled={revealPending} className="w-full">
                                                        {revealPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Eye className="mr-1 h-4 w-4" />}
                                                        Reveal votes
                                                    </Button>
                                                ) : (
                                                    <p className="text-xs text-muted-foreground">Waiting for the host to reveal…</p>
                                                )}
                                            </div>
                                        )
                                    }
                                    return (
                                        <div className="mt-3 space-y-2">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                {voters.map((p) => {
                                                    const hasVoted = activeRound.votes.some((v) => v.participant.id === p.id)
                                                    return (
                                                        <Tooltip key={p.id}>
                                                            <TooltipTrigger asChild>
                                                                <div className={cn(
                                                                    "rounded-full ring-2 transition-all",
                                                                    hasVoted ? "ring-green-500" : "ring-border opacity-50"
                                                                )}>
                                                                    <Avatar className="h-6 w-6">
                                                                        <AvatarImage src={p.member.user.image ?? undefined} />
                                                                        <AvatarFallback className="text-[10px]">
                                                                            {p.member.user.name?.[0] ?? "?"}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                </div>
                                                            </TooltipTrigger>
                                                            <TooltipContent>{p.member.user.name ?? "Unknown"} — {hasVoted ? "voted" : "not yet voted"}</TooltipContent>
                                                        </Tooltip>
                                                    )
                                                })}
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <span className="cursor-default">{`${voted}/${total} voted`}</span>
                                                    </TooltipTrigger>
                                                    <TooltipContent>{voted} of {total} participants have voted this round</TooltipContent>
                                                </Tooltip>
                                                <span className="font-medium">{deck.join(", ")}</span>
                                            </div>
                                        </div>
                                    )
                                })()}
                            </div>
                        </>
                    )}
                </main>
            </div>

            {/* Bottom: Participants */}
            <div className="border-t border-sidebar-border px-6 py-3 space-y-2">
                {/* Voters */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        <span>Voters ({voters.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {voters.map((participant) => {
                            const hasVotedOnActive = activeRound
                                ? activeRound.votes.some((v) => v.participant.id === participant.id)
                                : false
                            const voteValue =
                                activeRound?.status !== "VOTING"
                                    ? activeRound?.votes.find((v) => v.participant.id === participant.id)?.value
                                    : undefined

                            return (
                                <Tooltip key={participant.id}>
                                    <TooltipTrigger asChild>
                                        <div className="flex items-center gap-1.5">
                                            <div className="relative">
                                                <Avatar className="h-7 w-7">
                                                    <AvatarImage src={participant.member.user.image ?? undefined} />
                                                    <AvatarFallback className="text-xs">
                                                        {initials(participant.member.user.name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span
                                                    className={cn(
                                                        "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background",
                                                        activeRound?.status === "VOTING"
                                                            ? hasVotedOnActive
                                                                ? "bg-green-500"
                                                                : "bg-muted-foreground/40"
                                                            : "bg-transparent"
                                                    )}
                                                />
                                            </div>
                                            {voteValue && (
                                                <span className="rounded bg-muted px-1 py-0.5 font-mono text-xs font-semibold">
                                                    {voteValue}
                                                </span>
                                            )}
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="text-xs">
                                        <p className="font-medium">{participant.member.user.name ?? "Unknown"}</p>
                                        {participant.isHost && <p className="text-muted-foreground">Host</p>}
                                        {activeRound?.status === "VOTING" && (
                                            <p className="text-muted-foreground">
                                                {hasVotedOnActive ? "Voted" : "Waiting..."}
                                            </p>
                                        )}
                                    </TooltipContent>
                                </Tooltip>
                            )
                        })}
                    </div>
                </div>

                {/* Observers */}
                {observers.length > 0 && (
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Eye className="h-3.5 w-3.5" />
                            <span>Observers ({observers.length})</span>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {observers.map((participant) => (
                                <Tooltip key={participant.id}>
                                    <TooltipTrigger asChild>
                                        <div className="relative opacity-70">
                                            <Avatar className="h-7 w-7">
                                                <AvatarImage src={participant.member.user.image ?? undefined} />
                                                <AvatarFallback className="text-xs">
                                                    {initials(participant.member.user.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="text-xs">
                                        <p className="font-medium">{participant.member.user.name ?? "Unknown"}</p>
                                        <p className="text-muted-foreground">Watching without voting — not counted in vote totals</p>
                                    </TooltipContent>
                                </Tooltip>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Linear issue picker dialog */}
            <Dialog open={linearPickerOpen} onOpenChange={(open) => { if (!open) setLinearPickerOpen(false) }}>
                <DialogContent className="sm:max-w-sm p-0">
                    <DialogHeader className="px-4 pt-4 pb-0">
                        <DialogTitle>Pick from Linear</DialogTitle>
                        <DialogDescription>Select issues to add as estimation rounds.</DialogDescription>
                    </DialogHeader>
                    <Command>
                        <CommandInput placeholder="Search Linear issues..." />
                        <CommandList className="max-h-64">
                            {linearIssuesLoading ? (
                                <div className="flex items-center justify-center py-6">
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                </div>
                            ) : (
                                <>
                                    <CommandEmpty>No issues found.</CommandEmpty>
                                    <CommandGroup>
                                        {linearIssues.map((issue) => (
                                            <CommandItem
                                                key={issue.id}
                                                value={`${issue.identifier} ${issue.title}`}
                                                disabled={issue.alreadyAdded}
                                                onSelect={() => {
                                                    if (issue.alreadyAdded) return
                                                    setSelectedLinearIds((prev) => {
                                                        const next = new Set(prev)
                                                        if (next.has(issue.id)) next.delete(issue.id)
                                                        else next.add(issue.id)
                                                        return next
                                                    })
                                                }}
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4 shrink-0",
                                                        selectedLinearIds.has(issue.id) || issue.alreadyAdded
                                                            ? "opacity-100"
                                                            : "opacity-0"
                                                    )}
                                                />
                                                <span className="mr-1.5 text-xs text-muted-foreground shrink-0">
                                                    {issue.identifier}
                                                </span>
                                                <span className={cn(
                                                    "truncate text-sm",
                                                    issue.alreadyAdded && "text-muted-foreground line-through"
                                                )}>
                                                    {issue.title}
                                                </span>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </>
                            )}
                        </CommandList>
                        {!linearIssuesLoading && selectedLinearIds.size > 0 && (
                            <div className="border-t border-border p-2">
                                <Button
                                    size="sm"
                                    className="w-full"
                                    onClick={handleConfirmLinearPick}
                                    disabled={addLinearPending}
                                >
                                    {addLinearPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                                    Add {selectedLinearIds.size} issue{selectedLinearIds.size !== 1 ? "s" : ""}
                                </Button>
                            </div>
                        )}
                    </Command>
                </DialogContent>
            </Dialog>

            {/* Join dialog — Voter or Observer */}
            <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Join session</DialogTitle>
                        <DialogDescription>
                            How would you like to participate in this estimation session?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <button
                            onClick={() => handleJoin(false)}
                            className="flex flex-col items-center gap-2 rounded-lg border-2 border-border p-4 text-center transition-colors hover:border-primary hover:bg-muted/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            <Users className="h-7 w-7 text-primary" />
                            <span className="text-sm font-semibold">Join as Voter</span>
                            <p className="text-xs text-muted-foreground">Cast estimates and contribute to final score</p>
                        </button>
                        <button
                            onClick={() => handleJoin(true)}
                            className="flex flex-col items-center gap-2 rounded-lg border-2 border-border p-4 text-center transition-colors hover:border-primary hover:bg-muted/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            <Eye className="h-7 w-7 text-muted-foreground" />
                            <span className="text-sm font-semibold">Join as Observer</span>
                            <p className="text-xs text-muted-foreground">Watch without voting — useful for stakeholders</p>
                        </button>
                    </div>
                </DialogContent>
            </Dialog>

            <SessionSummaryDialog
                open={showSummaryDialog}
                onOpenChange={setShowSummaryDialog}
                sessionId={session.id}
                rounds={session.rounds}
            />
        </div>
    )
}
