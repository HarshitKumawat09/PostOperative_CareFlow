'use client';

import { useState } from 'react';
import { ChatModal } from './chat-modal';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function ChatButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              className="rounded-full w-14 h-14 shadow-lg"
              aria-label="Chat with staff"
              onClick={() => setOpen(true)}
            >
              <MessageSquare className="w-6 h-6" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Chat with a staff member</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <ChatModal open={open} onOpenChange={setOpen} />
    </>
  );
}
