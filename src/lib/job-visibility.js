/**
 * Determines whether a caller (public visitor) may view/apply to a job,
 * based on its visibility level and a supplied access token.
 *
 * - public:     always allowed.
 * - link_only:  allowed only if the token matches jobs.access_token.
 * - invited:    allowed only if the token matches a job_invites.token row
 *               for this job (checked separately, see verifyInviteToken).
 */
export function canAccessJob(job, token) {
    if (!job) return false
    if (job.visibility === 'public' || !job.visibility) return true
    if (job.visibility === 'link_only') return !!token && token === job.access_token
    // 'invited' is verified against job_invites in the caller (needs a DB lookup)
    return false
}

export const VISIBILITY_LABELS = {
    public: 'Publik',
    link_only: 'Siapa Saja yang Punya Link',
    invited: 'Hanya yang Diundang',
}
