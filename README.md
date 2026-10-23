# Veritas

Veritas is my final-year project of my **BSc (Hons) Computer Science** degree.

I developed this web application to bring clinic appointment booking, patient queues and doctor reviews into one system. The project explores how machine learning can help patients understand their expected waiting time and help administrators identify reviews that may need closer attention.

## About the Project

Booking an appointment does not always tell a patient how long they will wait when they arrive. Online reviews can also be difficult to judge, especially when there is no clear connection between a review and an actual visit.

Veritas connects these parts of the patient journey. Patients can find a doctor, book an appointment, check in and follow their queue status. After completing their visit, they can leave a review. The system screens that review and sends suspicious submissions for administrator review.

## What Users Can Do

### Patients

Patients can search for doctors, check available slots and manage their appointments. On the appointment date, they can check in and view their queue position with an estimated waiting time.

Once their consultation is complete, they can submit a review of the doctor.

### Doctors

Doctors can view their queue, call the next patient and mark consultations as completed. They can also view their review and credibility information.

### Administrators

Administrators manage doctor accounts, monitor queues and review appointment statistics. They can inspect flagged reviews and decide whether to keep or reject them.

## How Machine Learning Fits In

### Waiting-Time Prediction

The waiting-time model estimates how long a patient may need to wait. It uses information such as the number of patients ahead, the time of day and the accumulated consultation duration of earlier queue entries.

I used an MLP regression model with feature scaling for this task. The predicted time is an estimate, so it may differ from the actual wait.

### Fake-Review Screening

The review-screening model uses TF-IDF and Logistic Regression to analyse review text. A separate rule checks for bursts of review submissions.

Reviews that meet the flagging conditions go to the administrator for inspection. A flag indicates that a review needs attention; it does not establish that the review is fake.

### Doctor Credibility Score

The credibility model uses sentiment, review count and rating consistency to produce a review-derived score.

This score summarises patterns in approved reviews. It is not a clinical assessment of a doctor's skills or qualifications.

## Technologies Used

| Area | Technologies |
| --- | --- |
| Frontend | React, Vite, Tailwind CSS |
| Backend | Python, Flask |
| Authentication | Firebase Authentication |
| Database | Cloud Firestore |
| Machine learning | scikit-learn, Pandas, NumPy |
| API communication | Axios |
| Charts | Recharts |
| SMS integration | Twilio |

## Project Organisation

The project has two main folders:

- `frontend/` contains the React interface and its API connections.
- `backend/` contains the Flask routes, authentication middleware and machine learning code.

The machine learning components are inside `backend/ai_models/`, while the API endpoints are organised inside `backend/routes/`.

## Running the Project Locally

### 1. Clone the repository

git clone https://github.com/Kaayaeeshan/Veritas.git
cd Veritas

### 2. Set up Firebase

Create a Firebase project, register a web application, enable Email/Password authentication and create a Firestore database.

Configure the Firestore access rules and the indexes listed in `firestore.indexes.json`.

Save your Firebase service-account key locally as:

backend/firebase-service-account.json

### 3. Configure the environment

Create `backend/.env` with your backend settings:

FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
FIREBASE_PROJECT_ID=your-firebase-project-id
CORS_ORIGINS=http://localhost:5173
PORT=5000
FLASK_DEBUG=1

Create `frontend/.env.local` with your Firebase web configuration:

VITE_API_BASE_URL=http://localhost:5000/api
VITE_FIREBASE_API_KEY=your-web-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-firebase-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-web-app-id

Both configurations must point to the same Firebase project.

### 4. Start the backend

Run these commands from the project root using Windows PowerShell:

cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt

For the first setup, create the initial administrator account:

python create_first_admin.py

Then start Flask:

python app.py

### 5. Start the frontend

Open another terminal in the project root:

cd frontend
npm install
npm run dev

Open the address printed by Vite, usually http://localhost:5173.

## Current Limitations

Veritas is an academic project, and there are areas I would improve before using it in a real clinic.

These include stronger checks around appointment rescheduling, safer handling of simultaneous queue updates and more consistent review-counter updates after moderation. Doctor access checks also need further refinement.

For the machine learning components, further work should align the training inputs with the live queue data and evaluate the models using relevant clinic data.

## Credentials and Configuration

Private credentials and local environment files are excluded through `.gitignore`.

The Firebase service-account key must remain on the backend. It should never appear in the frontend code or be committed to this repository.

## Author

**Kaayaeeshan Vanniyasingam**

Final-Year Project  
**BSc (Hons) Computer Science**

Module: **6CS007 Project and Professionalism**
