# **App Name**: CareFlow

## Core Features:

- HIPAA Compliant Authentication: Secure user authentication with role-based access control (patient/staff) using Firebase Auth. This includes login and signup functionality.
- Patient Dashboard: Display a personalized dashboard for patients, featuring profile information, doctor details, appointment schedules, daily log submission, and staff feedback.
- Daily Progress Logging: Allow patients to log their daily progress, including pain levels, wound images (saved to Firebase Storage), task completion, and additional notes, via a modal form.
- Staff Dashboard & Triage: Present a dashboard for medical staff with a sortable table listing assigned patients, including details such as patient ID, name, assigned doctor, and status.
- Log Drill-Down and Acknowledgement: Enable staff to drill down into individual patient logs, review wound images and pain metrics, and acknowledge the entry. Staff can also add remarks to logs, which the patient can view.
- Emergency Assistance: The app has a static SOS button for patients to quickly call for emergency assistance.  Requires a 5-second continuous press to trigger. Show a visual progress ring during the hold.
- AI-powered Assessment Tool: The app provides an AI-powered assessment tool that decides whether to present information from a patient's previous logs in order to assist a doctor's interpretation of the present log. The system alerts the doctor when certain symptom clusters appear in consecutive logs. It suggests actions or recommendations for doctors when symptoms get worse.

## Style Guidelines:

- Primary color: #2774AE (RGB) A muted blue evoking a sense of trust and professionalism, suitable for a medical application.
- Background color: #F0F4F8 (RGB) A very light, desaturated tint of the primary, providing a clean and calming backdrop.
- Accent color: #73A35B (RGB) An analogous green with higher saturation that contrasts with the primary. The use of a natural color promotes health and growth.
- Body font: 'Inter', a sans-serif with a modern look that would work for both body and headline.
- Note: currently only Google Fonts are supported.
- Use clean, modern icons from a set like Remix Icon to represent different features and actions within the app. Ensure they are easily recognizable and consistent.
- Employ a split-screen layout for login/signup pages. Utilize Tailwind CSS grid and flexbox utilities for responsive design across different devices.
- Implement subtle transition animations for UI elements, such as modal appearance/disappearance and tab switching, to enhance user experience. Keep animations brief and purposeful.