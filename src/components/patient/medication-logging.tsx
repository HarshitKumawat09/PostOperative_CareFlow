'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  Pill, 
  Clock, 
  Calendar, 
  Plus, 
  CheckCircle, 
  AlertTriangle, 
  Bell,
  User,
  MapPin,
  Phone,
  Trash2,
  Edit,
  Save
} from 'lucide-react';
import { 
  MedicationEntry, 
  MedicationDosage, 
  MedicationFrequency, 
  MedicationRoute,
  MedicationStatus,
  SideEffect,
  MedicationReminder,
  PharmacyInfo,
  PrescriberInfo
} from '@/types/medication-tracking';

interface MedicationLoggingProps {
  patientId: string;
  surgeryType?: string;
  postOpDay?: number;
  onMedicationLogged: (medication: MedicationEntry) => void;
}

export default function MedicationLogging({ 
  patientId, 
  surgeryType, 
  postOpDay, 
  onMedicationLogged 
}: MedicationLoggingProps) {
  const [medications, setMedications] = useState<MedicationEntry[]>([]);
  const [currentMedication, setCurrentMedication] = useState<Partial<MedicationEntry>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [sideEffects, setSideEffects] = useState<SideEffect[]>([]);

  // Initialize with empty medication form
  useEffect(() => {
    if (medications.length === 0) {
      addNewMedication();
    }
  }, []);

  const addNewMedication = () => {
    const newMedication: Partial<MedicationEntry> = {
      id: `med-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: '',
      dosage: {
        amount: 0,
        unit: 'mg',
        form: 'tablet'
      },
      frequency: {
        type: 'daily',
        interval: 1,
        specificTimes: ['08:00']
      },
      route: {
        method: 'oral'
      },
      prescriber: {
        id: '',
        name: '',
        specialty: '',
        prescriptionDate: new Date()
      },
      pharmacy: {
        id: '',
        name: '',
        address: '',
        phoneNumber: '',
        preferredPharmacy: true
      },
      startDate: new Date(),
      status: 'pending_start',
      instructions: '',
      purpose: '',
      adherence: {
        totalDoses: 0,
        takenDoses: 0,
        missedDoses: 0,
        lateDoses: 0,
        adherenceRate: 0,
        currentStreak: 0,
        longestStreak: 0,
        weeklyAdherence: [],
        monthlyAdherence: []
      },
      refills: {
        currentSupply: 0,
        totalSupply: 30,
        refillDate: new Date(),
        nextRefillDate: new Date(),
        refillsRemaining: 0,
        autoRefill: false,
        pharmacyContacted: false,
        reminderSent: false
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setCurrentMedication(newMedication);
    setMedications([...medications, newMedication as MedicationEntry]);
  };

  const updateCurrentMedication = (field: string, value: any) => {
    setCurrentMedication((prev: Partial<MedicationEntry> | undefined) => {
      if (!prev) return {};
      return { ...prev, [field]: value };
    });
  };

  const updateDosage = (field: string, value: any) => {
    setCurrentMedication((prev: Partial<MedicationEntry> | undefined) => {
      if (!prev || !prev.dosage) return prev;
      return { 
        ...prev, 
        dosage: { ...prev.dosage, [field]: value }
      };
    });
  };

  const updateFrequency = (field: string, value: any) => {
    setCurrentMedication((prev: Partial<MedicationEntry> | undefined) => {
      if (!prev || !prev.frequency) return prev;
      return { 
        ...prev, 
        frequency: { ...prev.frequency, [field]: value }
      };
    });
  };

  const updatePrescriber = (field: string, value: any) => {
    setCurrentMedication((prev: Partial<MedicationEntry> | undefined) => {
      if (!prev || !prev.prescriber) return prev;
      return { 
        ...prev, 
        prescriber: { ...prev.prescriber, [field]: value }
      };
    });
  };

  const updatePharmacy = (field: string, value: any) => {
    setCurrentMedication((prev: Partial<MedicationEntry> | undefined) => {
      if (!prev || !prev.pharmacy) return prev;
      return { 
        ...prev, 
        pharmacy: { ...prev.pharmacy, [field]: value }
      };
    });
  };

  const addSideEffect = () => {
    const newSideEffect: SideEffect = {
      id: `se-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'nausea',
      severity: 'moderate',
      description: '',
      onsetTime: new Date(),
      resolved: false,
      reportedToProvider: false
    };
    setSideEffects([...sideEffects, newSideEffect]);
  };

  const removeSideEffect = (id: string) => {
    setSideEffects(sideEffects.filter(se => se.id !== id));
  };

  const updateSideEffect = (id: string, updates: Partial<SideEffect>) => {
    setSideEffects(sideEffects.map(se => 
      se.id === id ? { ...se, ...updates } : se
    ));
  };

  const validateMedication = (): string[] => {
    const errors: string[] = [];
    
    if (!currentMedication.name?.trim()) {
      errors.push('Medication name is required');
    }
    
    if (!currentMedication.dosage?.amount || currentMedication.dosage?.amount <= 0) {
      errors.push('Dosage amount must be greater than 0');
    }
    
    if (!currentMedication.frequency?.interval || currentMedication.frequency?.interval <= 0) {
      errors.push('Frequency interval must be greater than 0');
    }
    
    if (!currentMedication.purpose?.trim()) {
      errors.push('Medication purpose is required');
    }
    
    return errors;
  };

  const saveMedication = async () => {
    const errors = validateMedication();
    if (errors.length > 0) {
      alert('Please fix the following errors:\n' + errors.join('\n'));
      return;
    }

    setIsSubmitting(true);

    try {
      const medicationToSave: MedicationEntry = {
        ...currentMedication as MedicationEntry,
        sideEffects,
        adherence: {
          ...currentMedication.adherence!,
          totalDoses: 0,
          takenDoses: 0,
          missedDoses: 0,
          lateDoses: 0,
          adherenceRate: 0,
          currentStreak: 0,
          longestStreak: 0
        }
      };

      const response = await fetch('/api/medication-tracking/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(medicationToSave)
      });

      if (response.ok) {
        onMedicationLogged(medicationToSave);
        // Reset form for next medication
        setCurrentMedication({});
        setSideEffects([]);
        setShowAdvanced(false);
      } else {
        throw new Error('Failed to save medication');
      }
    } catch (error) {
      console.error('Error saving medication:', error);
      alert('Failed to save medication. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: MedicationStatus) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-300';
      case 'pending_start': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'paused': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'discontinued': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'mild': return 'bg-green-100 text-green-800 border-green-300';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'severe': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Pill className="w-5 h-5" />
              Add Medication
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? 'Simple' : 'Advanced'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Medication Name *</label>
              <Input
                placeholder="e.g., Ibuprofen, Lisinopril"
                value={currentMedication.name || ''}
                onChange={(e) => updateCurrentMedication('name', e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Purpose *</label>
              <Textarea
                placeholder="Why is this medication prescribed?"
                value={currentMedication.purpose || ''}
                onChange={(e) => updateCurrentMedication('purpose', e.target.value)}
                rows={2}
              />
            </div>
          </div>

          {/* Dosage Information */}
          <div>
            <h4 className="font-medium mb-3">Dosage Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div>
                <label className="text-sm font-medium">Amount *</label>
                <Input
                  type="number"
                  placeholder="500"
                  value={currentMedication.dosage?.amount || ''}
                  onChange={(e) => updateDosage('amount', parseFloat(e.target.value))}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Unit</label>
                <Select 
                  value={currentMedication.dosage?.unit || 'mg'} 
                  onValueChange={(value: any) => updateDosage('unit', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mg">mg</SelectItem>
                    <SelectItem value="mcg">mcg</SelectItem>
                    <SelectItem value="g">g</SelectItem>
                    <SelectItem value="ml">ml</SelectItem>
                    <SelectItem value="units">units</SelectItem>
                    <SelectItem value="drops">drops</SelectItem>
                    <SelectItem value="sprays">sprays</SelectItem>
                    <SelectItem value="puffs">puffs</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Form</label>
                <Select 
                  value={currentMedication.dosage?.form || 'tablet'} 
                  onValueChange={(value: any) => updateDosage('form', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tablet">Tablet</SelectItem>
                    <SelectItem value="capsule">Capsule</SelectItem>
                    <SelectItem value="liquid">Liquid</SelectItem>
                    <SelectItem value="injection">Injection</SelectItem>
                    <SelectItem value="patch">Patch</SelectItem>
                    <SelectItem value="cream">Cream</SelectItem>
                    <SelectItem value="ointment">Ointment</SelectItem>
                    <SelectItem value="inhaler">Inhaler</SelectItem>
                    <SelectItem value="spray">Spray</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Strength</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="50"
                    value={currentMedication.dosage?.strength || ''}
                    onChange={(e) => updateDosage('strength', parseFloat(e.target.value))}
                    className="flex-1"
                  />
                  <Input
                    placeholder="mg"
                    value={currentMedication.dosage?.strengthUnit || ''}
                    onChange={(e) => updateDosage('strengthUnit', e.target.value)}
                    className="w-20"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Frequency Information */}
          <div>
            <h4 className="font-medium mb-3">Frequency</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Type</label>
                <Select 
                  value={currentMedication.frequency?.type || 'daily'} 
                  onValueChange={(value: any) => updateFrequency('type', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="as_needed">As Needed (PRN)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Interval</label>
                <div className="flex items-center gap-2">
                  <span>Every</span>
                  <Input
                    type="number"
                    placeholder="8"
                    value={currentMedication.frequency?.interval || ''}
                    onChange={(e) => updateFrequency('interval', parseInt(e.target.value))}
                    className="w-20"
                  />
                  <span>hours</span>
                </div>
              </div>

              {currentMedication.frequency?.type === 'daily' && (
                <div>
                  <label className="text-sm font-medium">Times</label>
                  <div className="flex gap-2">
                    {['08:00', '14:00', '20:00'].map((time, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={currentMedication.frequency?.specificTimes?.[index] || ''}
                          onChange={(e) => {
                            const newTimes = [...(currentMedication.frequency?.specificTimes || [])];
                            newTimes[index] = e.target.value;
                            updateFrequency('specificTimes', newTimes);
                          }}
                          className="w-28"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newTimes = [...(currentMedication.frequency?.specificTimes || [])];
                            newTimes.splice(index, 1);
                            updateFrequency('specificTimes', newTimes);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newTimes = [...(currentMedication.frequency?.specificTimes || []), '00:00'];
                        updateFrequency('specificTimes', newTimes);
                      }}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Route and Instructions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Route</label>
              <Select 
                value={currentMedication.route?.method || 'oral'} 
                onValueChange={(value: any) => updateCurrentMedication('route', { method: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="oral">Oral</SelectItem>
                  <SelectItem value="intravenous">Intravenous (IV)</SelectItem>
                  <SelectItem value="intramuscular">Intramuscular (IM)</SelectItem>
                  <SelectItem value="subcutaneous">Subcutaneous</SelectItem>
                  <SelectItem value="topical">Topical</SelectItem>
                  <SelectItem value="transdermal">Transdermal</SelectItem>
                  <SelectItem value="inhalation">Inhalation</SelectItem>
                  <SelectItem value="nasal">Nasal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Instructions</label>
              <Textarea
                placeholder="Take with food, avoid grapefruit, etc."
                value={currentMedication.instructions || ''}
                onChange={(e) => updateCurrentMedication('instructions', e.target.value)}
                rows={3}
              />
            </div>
          </div>

          {/* Advanced Information */}
          {showAdvanced && (
            <>
              {/* Prescriber Information */}
              <div>
                <h4 className="font-medium mb-3">Prescriber Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Doctor Name</label>
                    <Input
                      placeholder="Dr. Smith"
                      value={currentMedication.prescriber?.name || ''}
                      onChange={(e) => updatePrescriber('name', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Specialty</label>
                    <Input
                      placeholder="Cardiology"
                      value={currentMedication.prescriber?.specialty || ''}
                      onChange={(e) => updatePrescriber('specialty', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Contact Number</label>
                    <Input
                      placeholder="(555) 123-4567"
                      value={currentMedication.prescriber?.contactNumber || ''}
                      onChange={(e) => updatePrescriber('contactNumber', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Prescription Date</label>
                    <Input
                      type="date"
                      value={currentMedication.prescriber?.prescriptionDate?.toISOString().split('T')[0] || ''}
                      onChange={(e) => updatePrescriber('prescriptionDate', new Date(e.target.value))}
                    />
                  </div>
                </div>
              </div>

              {/* Pharmacy Information */}
              <div>
                <h4 className="font-medium mb-3">Pharmacy Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Pharmacy Name</label>
                    <Input
                      placeholder="CVS Pharmacy"
                      value={currentMedication.pharmacy?.name || ''}
                      onChange={(e) => updatePharmacy('name', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Address</label>
                    <Textarea
                      placeholder="123 Main St, City, State 12345"
                      value={currentMedication.pharmacy?.address || ''}
                      onChange={(e) => updatePharmacy('address', e.target.value)}
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Phone Number</label>
                    <Input
                      placeholder="(555) 123-4567"
                      value={currentMedication.pharmacy?.phoneNumber || ''}
                      onChange={(e) => updatePharmacy('phoneNumber', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <Input
                      type="email"
                      placeholder="pharmacy@example.com"
                      value={currentMedication.pharmacy?.email || ''}
                      onChange={(e) => updatePharmacy('email', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Start/End Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Start Date</label>
                  <Input
                    type="date"
                    value={currentMedication.startDate?.toISOString().split('T')[0] || ''}
                    onChange={(e) => updateCurrentMedication('startDate', new Date(e.target.value))}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">End Date (Optional)</label>
                  <Input
                    type="date"
                    value={currentMedication.endDate?.toISOString().split('T')[0] || ''}
                    onChange={(e) => updateCurrentMedication('endDate', e.target.value ? new Date(e.target.value) : undefined)}
                  />
                </div>
              </div>
            </>
          )}

          {/* Side Effects */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">Side Effects</h4>
              <Button onClick={addSideEffect} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-1" />
                Add Side Effect
              </Button>
            </div>

            {sideEffects.length === 0 ? (
              <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                <AlertTriangle className="w-12 h-12 mx-auto mb-2" />
                <p>No side effects recorded</p>
                <p className="text-sm">Add side effects to track medication reactions</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sideEffects.map((sideEffect) => (
                  <div key={sideEffect.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Select
                          value={sideEffect.type}
                          onValueChange={(value: any) => updateSideEffect(sideEffect.id, { type: value })}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="nausea">Nausea</SelectItem>
                            <SelectItem value="vomiting">Vomiting</SelectItem>
                            <SelectItem value="dizziness">Dizziness</SelectItem>
                            <SelectItem value="drowsiness">Drowsiness</SelectItem>
                            <SelectItem value="insomnia">Insomnia</SelectItem>
                            <SelectItem value="constipation">Constipation</SelectItem>
                            <SelectItem value="diarrhea">Diarrhea</SelectItem>
                            <SelectItem value="headache">Headache</SelectItem>
                            <SelectItem value="rash">Rash</SelectItem>
                            <SelectItem value="itching">Itching</SelectItem>
                            <SelectItem value="swelling">Swelling</SelectItem>
                            <SelectItem value="difficulty_breathing">Difficulty Breathing</SelectItem>
                            <SelectItem value="chest_pain">Chest Pain</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Badge className={getSeverityColor(sideEffect.severity)}>
                          {sideEffect.severity}
                        </Badge>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSideEffect(sideEffect.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Description</label>
                        <Textarea
                          placeholder="Describe the side effect..."
                          value={sideEffect.description || ''}
                          onChange={(e) => updateSideEffect(sideEffect.id, { description: e.target.value })}
                          rows={2}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium">Duration</label>
                        <Input
                          placeholder="2 hours, constant"
                          value={sideEffect.duration || ''}
                          onChange={(e) => updateSideEffect(sideEffect.id, { duration: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              onClick={saveMedication}
              disabled={isSubmitting}
              className="min-w-32"
            >
              {isSubmitting ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Medication
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
