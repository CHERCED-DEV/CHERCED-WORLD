'use client'

import { buttonClassName } from '@/components/ui/Button'
import type { AccountPanelCopy } from '@/content/account'
import { deleteOwnComment } from '@/lib/actions/profile'
import { ActionNotice } from './ActionNotice'
import { useRunner } from './useRunner'

export function CommentDelete({ id, copy }: { id: string; copy: AccountPanelCopy }) {
  const runner = useRunner()
  return (
    <>
      <button
        type="button"
        className={buttonClassName({ variant: 'ghost', size: 'sm' })}
        onClick={() => runner.run(() => deleteOwnComment(id))}
        disabled={runner.pending}
        data-cw-comment-delete=""
      >
        {copy.deleteComment}
      </button>
      {runner.result && !runner.result.ok ? <ActionNotice result={runner.result} copy={copy} success={copy.commentDeleted} /> : null}
    </>
  )
}
