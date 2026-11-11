import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@sharkord/ui';
import { memo, useCallback } from 'react';
import { useStreamStatus } from '../../hooks/use-stream-status';

export const StreamErrorDialog = memo(() => {
  const { status, clear } = useStreamStatus();

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) clear();
    },
    [clear]
  );

  if (status.state !== 'error') return null;

  return (
    <AlertDialog open onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Stream problem</AlertDialogTitle>
          <AlertDialogDescription>{status.message}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction>OK</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
});
