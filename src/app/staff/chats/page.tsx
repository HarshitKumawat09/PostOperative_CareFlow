'use client';

import { ChatManagement } from '@/components/dashboard/staff/chat-management';
import { MessageSquare } from 'lucide-react';

export default function StaffChatsPage() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] space-y-8 pb-12 font-sans bg-slate-50/50 p-6 lg:p-8">
      {/* Header Section */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
        <div className="bg-blue-100 p-2.5 rounded-xl">
          <MessageSquare className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Live Chats</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Real-time communication with patients.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <ChatManagement />
      </div>
    </div>
  );
}