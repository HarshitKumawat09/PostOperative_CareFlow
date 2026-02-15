'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Send, Loader2 } from 'lucide-react';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import type { ChatRequest } from '@/lib/types';
import { collection, serverTimestamp, addDoc, doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { ChatRoom } from '@/components/dashboard/chat/chat-room';
import { FirestorePermissionError, errorEmitter } from '@/firebase';

interface ChatModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ChatModal({ open, onOpenChange }: ChatModalProps) {
  const { toast } = useToast();
  const { firestore, user, userProfile, isUserProfileLoading } = useFirebase();
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);

  // Get the active request ID from the user's profile
  const activeRequestId = userProfile?.activeChatRequestId;

  // Listen for this patient's single chat request document
  const requestRef = useMemoFirebase(() => {
    if (!firestore || !activeRequestId) return null;
    return doc(firestore, 'chat_requests', activeRequestId);
  }, [firestore, activeRequestId]);

  const { data: activeRequest, isLoading: requestLoading } = useDoc<ChatRequest>(requestRef);

  const handleSubmit = async () => {
    if (!question.trim() || !user || !firestore) return;
    setLoading(true);

    try {
      const chatRequestData = {
        patientId: user.uid,
        patientName: user.displayName || 'Anonymous Patient',
        initialQuestion: question,
        status: 'pending' as const,
        timestamp: serverTimestamp(),
        staffId: null,
        activeChatId: null,
      };

      const requestsCollection = collection(firestore, 'chat_requests');
      // Create the chat request document
      const docRef = await addDoc(requestsCollection, chatRequestData);

      // Now, update the user's profile with the ID of the new request
      const userProfileRef = doc(firestore, 'users', user.uid);
      await updateDoc(userProfileRef, {
        activeChatRequestId: docRef.id
      });

      toast({ title: 'Request Sent', description: 'A staff member will be with you shortly.' });
      setQuestion('');
      // The component will re-render due to the userProfile update, showing the 'pending' state.
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.message || 'Failed to submit chat request. Please check your connection or permissions.';
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
      if (error.code?.includes('permission-denied')) {
        errorEmitter.emit(
          'permission-error',
          new FirestorePermissionError({
            path: collection(firestore, 'chat_requests').path,
            operation: 'create',
            requestResourceData: "See data in handleSubmit function",
          })
        );
      }
    } finally {
      setLoading(false);
    }
  };
  
  const renderContent = () => {
    // Show loading while we check the profile and potentially the request doc
    if (isUserProfileLoading || (activeRequestId && requestLoading)) {
        return (
             <>
                <DialogHeader>
                    <DialogTitle>Loading Chat</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center justify-center h-48 gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Checking for active chats...</p>
                </div>
            </>
        );
    }

    // A request exists and it's active
    if (activeRequest?.status === 'active' && activeRequest.activeChatId) {
        return (
            <>
                <DialogHeader>
                    <DialogTitle>Chat with Staff</DialogTitle>
                    <DialogDescription>You are now connected with a staff member.</DialogDescription>
                </DialogHeader>
                <ChatRoom activeChatId={activeRequest.activeChatId} />
            </>
        );
    }
    
    // A request exists and it's pending
    if (activeRequest?.status === 'pending') {
        return (
            <>
                <DialogHeader>
                    <DialogTitle>Request Sent</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center justify-center h-48 gap-4 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <h3 className="font-semibold">Waiting for a staff member...</h3>
                    <p className="text-muted-foreground">Your request has been sent. Someone will accept your chat soon.</p>
                </div>
            </>
        )
    }

    // No active or pending request, show the form
    return (
        <>
            <DialogHeader>
            <DialogTitle>Ask a Question</DialogTitle>
            <DialogDescription>
                Submit a question to our care team. A staff member will join a chat with you shortly.
            </DialogDescription>
            </DialogHeader>
             <div className="grid gap-4 py-4">
                <div className="grid w-full gap-1.5">
                    <Label htmlFor="question">Your question</Label>
                    <Textarea
                        placeholder="Type your question here..."
                        id="question"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        rows={4}
                    />
                </div>
            </div>
            <DialogFooter>
                <Button onClick={handleSubmit} disabled={loading || !question.trim()}>
                    {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Submitting...</> : <><Send className="mr-2 h-4 w-4" /> Submit Request</>}
                </Button>
            </DialogFooter>
        </>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
        // When closing the dialog, we need to consider what happens.
        // If a patient closes the pending/active chat window, should the request be cancelled?
        // For now, we'll just close the dialog. The request remains.
        onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-md">
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
