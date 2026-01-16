// This file is now deprecated as we are using live Firebase data.
// It is kept for reference or if a fallback to mock data is ever needed.

import type { Doctor, UserProfile } from './types';

export const placeholderImages = [
    {
      "id": "hero-landing",
      "description": "A medical professional smiling while using a tablet.",
      "imageUrl": "https://picsum.photos/seed/hero-landing/600/400",
      "imageHint": "medical professional tablet"
    },
    {
      "id": "auth-background",
      "description": "A modern and clean hospital interior.",
      "imageUrl": "https://picsum.photos/seed/auth-background/1200/800",
      "imageHint": "hospital interior"
    }
];

export const doctors: Doctor[] = [
  {
    id: 'doc_1',
    firstName: 'Evelyn',
    lastName: 'Reed',
    email: 'evelyn.reed@careflow.com',
    specialization: 'Orthopedic Surgeon',
    contactNumber: '555-0101',
    profileImageUrl: 'https://picsum.photos/seed/doc1/100/100',
  },
  {
    id: 'doc_2',
    firstName: 'Samuel',
    lastName: 'Chen',
    email: 'samuel.chen@careflow.com',
    specialization: 'Cardiothoracic Surgeon',
    contactNumber: '555-0102',
    profileImageUrl: 'https://picsum.photos/seed/doc2/100/100',
  },
];
