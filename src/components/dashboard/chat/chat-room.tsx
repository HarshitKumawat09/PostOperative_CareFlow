'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2 } from 'lucide-react';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import type { Message } from '@/lib/types';
import { collection, query, orderBy, doc, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface ChatRoomProps {
    activeChatId: string;
}

export function ChatRoom({ activeChatId }: ChatRoomProps) {
    const { firestore, user } = useFirebase();
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    // Listen for messages in this active chat
    const messagesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, `active_chats/${activeChatId}/messages`),
            orderBy('timestamp', 'asc')
        );
    }, [firestore, activeChatId]);

    const { data: messages, isLoading: messagesLoading } = useCollection<Message>(messagesQuery);
    
    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollAreaRef.current) {
            const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (viewport) {
                viewport.scrollTop = viewport.scrollHeight;
            }
        }
    }, [messages]);


    const handleSendMessage = async () => {
        if (!newMessage.trim() || !user) return;
        setLoading(true);
        
        const chatRef = doc(firestore, 'active_chats', activeChatId);
        const messagesRef = collection(chatRef, 'messages');

        try {
            // Add the new message
            await addDoc(messagesRef, {
                text: newMessage,
                senderId: user.uid,
                timestamp: serverTimestamp(),
            });

            // Update the last message on the parent chat document
            await updateDoc(chatRef, {
                lastMessage: newMessage,
                lastMessageTimestamp: serverTimestamp(),
            });

            setNewMessage('');
        } catch (error) {
            console.error("Error sending message:", error);
            // Optionally, show a toast to the user
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[60vh]">
            <ScrollArea className="flex-1 w-full pr-4" ref={scrollAreaRef}>
                <div className="space-y-4 p-4">
                    {messagesLoading && <div className="flex justify-center p-4"><Loader2 className="animate-spin"/></div>}
                    {messages?.map(msg => (
                        <div key={msg.id} className={cn("flex items-end gap-2", msg.senderId === user?.uid ? "justify-end" : "justify-start")}>
                             {msg.senderId !== user?.uid && (
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback>{'P'}</AvatarFallback>
                                </Avatar>
                            )}
                            <div className={cn("rounded-lg px-3 py-2 text-sm max-w-[75%]", msg.senderId === user?.uid ? "bg-primary text-primary-foreground" : "bg-muted")}>
                               {msg.text}
                            </div>
                             {msg.senderId === user?.uid && (
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback>{user?.displayName?.charAt(0) || 'S'}</AvatarFallback>
                                </Avatar>
                            )}
                        </div>
                    ))}
                    {!messagesLoading && messages?.length === 0 && (
                        <p className="text-center text-sm text-muted-foreground">No messages yet. Say hello!</p>
                    )}
                </div>
            </ScrollArea>

            <div className="mt-4 border-t pt-4">
                <div className="relative">
                    <Textarea
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        rows={2}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                            }
                        }}
                        className="pr-20"
                    />
                     <Button 
                        type="submit" 
                        size="icon" 
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-12"
                        onClick={handleSendMessage}
                        disabled={loading || !newMessage.trim()}
                    >
                       {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4"/>}
                       <span className="sr-only">Send</span>
                    </Button>
                </div>
            </div>
        </div>
    );
}
