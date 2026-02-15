'use client';

import { useState, useMemo } from 'react';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import type { ChatRequest, ActiveChat } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, User, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { ChatRoom } from '../chat/chat-room';

export function ChatManagement() {
    const { firestore, user } = useFirebase();
    const { toast } = useToast();
    const [acceptingId, setAcceptingId] = useState<string | null>(null);
    const [selectedChat, setSelectedChat] = useState<ActiveChat | null>(null);

    // Listen for pending chat requests, but order them on the client
    const pendingRequestsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null; // Wait for both firestore and user
        return query(
            collection(firestore, 'chat_requests'), 
            where('status', '==', 'pending')
        );
    }, [firestore, user]); // Add user to dependency array

    const { data: pendingRequests, isLoading: pendingLoading } = useCollection<ChatRequest>(pendingRequestsQuery);

    const sortedPendingRequests = useMemo(() => {
        if (!pendingRequests) return [];
        // Sort ascending by timestamp
        return [...pendingRequests].sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis());
    }, [pendingRequests]);


    // Listen for active chats assigned to this staff member, but order them on the client
    const activeChatsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(
            collection(firestore, 'active_chats'),
            where('staffId', '==', user.uid)
        );
    }, [firestore, user]);
    
    const { data: activeChats, isLoading: activeChatsLoading } = useCollection<ActiveChat>(activeChatsQuery);
    
    const sortedActiveChats = useMemo(() => {
        if (!activeChats) return [];
        // Sort descending by last message timestamp
        return [...activeChats].sort((a, b) => {
            const timeA = a.lastMessageTimestamp?.toMillis() || 0;
            const timeB = b.lastMessageTimestamp?.toMillis() || 0;
            return timeB - timeA;
        });
    }, [activeChats]);


    const handleAccept = async (request: ChatRequest) => {
        if (!user) {
            toast({ variant: 'destructive', title: "Error", description: "You must be logged in." });
            return;
        }
        setAcceptingId(request.id);
        
        const requestRef = doc(firestore, 'chat_requests', request.id);

        try {
            await runTransaction(firestore, async (transaction) => {
                const requestDoc = await transaction.get(requestRef);

                if (!requestDoc.exists() || requestDoc.data()?.status !== 'pending') {
                    throw new Error('Request is no longer available.');
                }
                
                const activeChatRef = doc(collection(firestore, 'active_chats'));
                transaction.set(activeChatRef, {
                    id: activeChatRef.id,
                    patientId: request.patientId,
                    staffId: user.uid,
                    patientName: request.patientName,
                    staffName: user.displayName || 'Staff Member',
                    startedAt: serverTimestamp(),
                    lastMessage: 'Chat started by staff.',
                    lastMessageTimestamp: serverTimestamp(),
                });

                transaction.update(requestRef, { 
                    status: 'active', 
                    staffId: user.uid,
                    activeChatId: activeChatRef.id,
                });
            });

            toast({ title: "Chat Accepted", description: "You have been connected with the patient." });

        } catch (error: any) {
            console.error("Error accepting chat request:", error);
            toast({ variant: 'destructive', title: "Error", description: error.message || 'Failed to accept chat request.' });
        } finally {
            setAcceptingId(null);
        }
    }
    
    const isLoading = pendingLoading || activeChatsLoading;

    return (
        <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Request Queue</CardTitle>
                        <CardDescription>Patients waiting for assistance.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                         {pendingLoading && <div className="flex justify-center items-center p-4"><Loader2 className="w-6 h-6 animate-spin"/></div>}
                         {!pendingLoading && sortedPendingRequests.length === 0 && <p className="text-sm text-center text-muted-foreground p-4">No pending requests.</p>}
                         {sortedPendingRequests.map(req => (
                             <Card key={req.id} className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="font-semibold">{req.patientName}</p>
                                        <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3"/>{formatDistanceToNow(req.timestamp.toDate(), { addSuffix: true })}</p>
                                    </div>
                                    <Button size="sm" onClick={() => handleAccept(req)} disabled={!!acceptingId}>
                                        {acceptingId === req.id ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Accept'}
                                    </Button>
                                </div>
                                <p className="text-sm mt-2 pt-2 border-t">"{req.initialQuestion}"</p>
                             </Card>
                         ))}
                    </CardContent>
                </Card>
            </div>
            <div className="md:col-span-2">
                 <Card>
                    <CardHeader>
                        <CardTitle>My Active Chats</CardTitle>
                        <CardDescription>Your ongoing conversations.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                         {activeChatsLoading && <div className="flex justify-center items-center p-4"><Loader2 className="w-6 h-6 animate-spin"/></div>}
                         {!activeChatsLoading && sortedActiveChats.length === 0 && <p className="text-sm text-center text-muted-foreground p-4">You have no active chats.</p>}
                         {sortedActiveChats.map(chat => (
                             <Card key={chat.id} className="p-4 cursor-pointer hover:bg-secondary" onClick={() => setSelectedChat(chat)}>
                                <div className="flex items-center justify-between">
                                    <p className="font-semibold flex items-center gap-2"><User className="w-4 h-4"/>{chat.patientName}</p>
                                    <p className="text-xs text-muted-foreground">{chat.lastMessageTimestamp ? formatDistanceToNow(chat.lastMessageTimestamp.toDate(), {addSuffix: true}) : 'No messages yet'}</p>
                                </div>
                                 <p className="text-sm text-muted-foreground truncate mt-1">
                                     {chat.lastMessage || 'Click to open chat.'}
                                 </p>
                             </Card>
                         ))}
                    </CardContent>
                </Card>
            </div>

            <Dialog open={!!selectedChat} onOpenChange={(isOpen) => !isOpen && setSelectedChat(null)}>
                <DialogContent className="max-w-md">
                     {selectedChat && (
                        <>
                        <DialogHeader>
                            <DialogTitle>Chat with {selectedChat.patientName}</DialogTitle>
                        </DialogHeader>
                        <ChatRoom activeChatId={selectedChat.id} />
                        </>
                     )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
