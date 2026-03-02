// export const firebaseConfig = {
//   "projectId": "studio-2363340782-5ffd7",
//   "appId": "1:567123113004:web:088eb299050fb14d5ecd89",
//   "apiKey": "GOOGLE_API_KEY",
//   "authDomain": "studio-2363340782-5ffd7.firebaseapp.com",
//   "measurementId": "",
//   "messagingSenderId": "567123113004"
// };
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
};

