import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquareQuote } from 'lucide-react';

interface DoctorsRemarksCardProps {
  latestRemark?: string | null;
}

export function DoctorsRemarksCard({ latestRemark }: DoctorsRemarksCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquareQuote className="w-6 h-6" />
          Latest Doctor's Remark
        </CardTitle>
        <CardDescription>Latest feedback from your care team.</CardDescription>
      </CardHeader>
      <CardContent>
        {latestRemark ? (
          <div className="space-y-2">
            <blockquote className="border-l-2 pl-4 italic">
              "{latestRemark}"
            </blockquote>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No remarks yet. Your doctor will review your logs soon.</p>
        )}
      </CardContent>
    </Card>
  );
}
