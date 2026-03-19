export const QR_APPROVAL_TTL_MS = 10 * 60 * 1000 // 10 minutes

export type BorrowApprovalQrPayload = {
    v: 1
    requestId: string
}

export function createBorrowApprovalQrPayload(requestId: string) {
    const payload: BorrowApprovalQrPayload = {
        v: 1,
        requestId,
    }

    return JSON.stringify(payload)
}

export function extractBorrowApprovalRequestId(rawPayload: string) {
    const trimmed = rawPayload.trim()

    // Backward-compatible fallback for older plain-text payloads.
    if (!trimmed.startsWith("{")) {
        return trimmed || null
    }

    try {
        const parsed = JSON.parse(trimmed) as Partial<BorrowApprovalQrPayload> & {
            requestId?: unknown
        }

        if (typeof parsed.requestId === "string" && parsed.requestId.length > 0) {
            return parsed.requestId
        }

        return null
    } catch {
        return null
    }
}

