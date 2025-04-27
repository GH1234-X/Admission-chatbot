# StudentGuideAI - Educational Assistant

An AI-powered educational assistant focused on helping students with Gujarat college admissions.

## Features

- **AI Chatbot**: Get answers about admission requirements, entrance exams, cutoffs, and more
- **College Directory**: Browse colleges across various districts in Gujarat
- **Engineering Cutoffs**: View cutoff scores for different engineering programs
- **Scholarships**: Find scholarship opportunities categorized by eligibility criteria
- **User Profiles**: Create an account to save chat history and preferences

## Project Structure

- **Frontend**: React.js with TailwindCSS and Shadcn UI components
- **Backend**: Express.js server
- **Database**: Firebase Firestore for data storage
- **Authentication**: Firebase Authentication
- **AI Integration**: Groq API for AI chat responses

## Setup Instructions

### Prerequisites

- Node.js (v16 or newer)
- npm or yarn
- Firebase account
- Groq API account

### Firebase Setup

1. Create a Firebase project at [firebase.google.com](https://console.firebase.google.com/)
2. Enable Authentication with Google and Email/Password providers
3. Create a Firestore database
4. Register your web app in Firebase to get your config values
5. Add your local development URL to the authorized domains list for authentication

### Getting Started

1. Clone or download this repository
2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the project root with the following variables:
```
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
GROQ_API_KEY=your_groq_api_key
```

4. Run the development server:
```bash
npm run dev
```

5. Open your browser to [http://localhost:5000](http://localhost:5000)

### Admin Features

The project includes special admin features for data management:
- On the Colleges by Location page, admin users can import Gujarat colleges data
- Admin access is granted to specific email addresses (currently configured for "admin@example.com")

## Deploying to Production

For production deployment:
1. Build the project:
```bash
npm run build
```

2. Deploy the built files to your preferred hosting service
3. Make sure to update the Firebase authorized domains to include your production URL

## Data Models

- **Users**: Authentication and profile information
- **Chat Messages**: Conversation history between users and the AI
- **Colleges**: Educational institutions across Gujarat with details and district information
- **College Cutoffs**: Entrance requirements and cutoff scores for various programs
- **Scholarships**: Financial aid opportunities for students

## Troubleshooting

- **Firebase Authentication**: Make sure your app's URL is in the Firebase authorized domains list
- **Firestore Permissions**: Check your Firestore rules if you encounter database access issues
- **API Keys**: Verify that all required API keys are correctly set in your environment variables

## Development Notes

- The project uses Drizzle ORM with PostgreSQL for the Express backend
- Firebase is used for authentication and data storage via the Firestore database
- The AI chatbot uses Groq's LLM API for generating responses
