'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { SurgeryType, SURGERY_TYPE_LABELS } from '@/lib/types';
import { Calendar, Stethoscope, Heart, Bone, Brain } from 'lucide-react';

interface SurgeryTypeSelectorProps {
  selectedSurgery?: SurgeryType;
  onSurgerySelect: (surgeryType: SurgeryType) => void;
  onSave?: () => void;
  loading?: boolean;
}

// Surgery categories with icons
const SURGERY_CATEGORIES = {
  ORTHOPEDIC: {
    icon: Bone,
    surgeries: [SurgeryType.KNEE_REPLACEMENT, SurgeryType.HIP_REPLACEMENT, SurgeryType.SPINAL_SURGERY, SurgeryType.SHOULDER_SURGERY]
  },
  ABDOMINAL: {
    icon: Stethoscope,
    surgeries: [SurgeryType.ABDOMINAL_SURGERY, SurgeryType.GALLBLADDER_SURGERY, SurgeryType.APPENDECTOMY]
  },
  CARDIAC: {
    icon: Heart,
    surgeries: [SurgeryType.CARDIAC_SURGERY]
  },
  OTHER: {
    icon: Brain,
    surgeries: [SurgeryType.CESAREAN_SECTION, SurgeryType.PROSTATE_SURGERY, SurgeryType.GENERAL_SURGERY]
  }
};

export function SurgeryTypeSelector({ selectedSurgery, onSurgerySelect, onSave, loading }: SurgeryTypeSelectorProps) {
  const [tempSelection, setTempSelection] = useState<SurgeryType | undefined>(selectedSurgery);

  const handleSave = () => {
    if (tempSelection) {
      onSurgerySelect(tempSelection);
      onSave?.();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="border-2 border-primary/20">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-primary flex items-center justify-center gap-3">
            <Stethoscope className="h-8 w-8" />
            Select Your Surgery Type
          </CardTitle>
          <CardDescription className="text-lg">
            This helps us provide personalized recovery guidance specific to your procedure
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Quick Select Dropdown */}
          <div className="text-center">
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Quick Selection
            </label>
            <Select value={tempSelection} onValueChange={(value) => setTempSelection(value as SurgeryType)}>
              <SelectTrigger className="w-full max-w-md mx-auto">
                <SelectValue placeholder="Choose your surgery type..." />
              </SelectTrigger>
              <SelectContent>
                {Object.values(SurgeryType).map(type => (
                  <SelectItem key={type} value={type}>
                    {SURGERY_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            {Object.entries(SURGERY_CATEGORIES).map(([category, { icon: Icon, surgeries }]) => (
              <Card key={category} className="border-l-4 border-l-primary/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Icon className="h-5 w-5 text-primary" />
                    {category}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2">
                    {surgeries.map(surgery => (
                      <Button
                        key={surgery}
                        variant={tempSelection === surgery ? "default" : "outline"}
                        className="justify-start h-auto p-3"
                        onClick={() => setTempSelection(surgery)}
                      >
                        <div className="text-left">
                          <div className="font-medium">
                            {SURGERY_TYPE_LABELS[surgery]}
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Selected Surgery Display */}
          {tempSelection && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Stethoscope className="h-6 w-6 text-primary" />
                    <div>
                      <div className="font-medium text-lg">Selected Surgery:</div>
                      <div className="text-primary font-semibold">
                        {SURGERY_TYPE_LABELS[tempSelection]}
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-sm">
                    Personalized Guidance Ready
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 pt-4">
            <Button
              size="lg"
              onClick={handleSave}
              disabled={!tempSelection || loading}
              className="px-8"
            >
              {loading ? 'Saving...' : 'Continue to Recovery'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card className="bg-blue-50/50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <div className="font-medium text-blue-900 mb-1">Why This Matters</div>
              <div className="text-sm text-blue-700">
                Different surgeries have different recovery timelines, complications, and care protocols. 
                By selecting your specific surgery type, we'll provide you with:
              </div>
              <ul className="text-sm text-blue-700 mt-2 space-y-1">
                <li>• Surgery-specific recovery milestones</li>
                <li>• Accurate complication warnings</li>
                <li>• Personalized symptom tracking</li>
                <li>• Targeted medical guidance</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
