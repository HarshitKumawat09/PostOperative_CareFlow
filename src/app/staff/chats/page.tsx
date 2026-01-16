'use client';

import { ChatManagement } from '@/components/dashboard/staff/chat-management';

export default function StaffChatsPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold font-headline">Live Chats</h1>
            <ChatManagement />
        </div>
    );
}
