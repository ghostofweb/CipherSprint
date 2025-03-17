# CipherSprint ⌨️⚡

**Test Your Typing Speed with CipherSprint!**

## 🚀 Overview
CipherSprint is a **real-time typing speed test** platform designed to help users enhance their typing speed and accuracy. With an interactive UI and real-time performance tracking, users can measure their words per minute (WPM), accuracy, and progress over time.

🔥 **Fast & Responsive** | 🎯 **Accurate Stats** | 📊 **Performance Insights**

## 🛠 Tech Stack
- **Frontend:** React, Vite, Global CSS, Tailwind CSS, Styled Components
- **Backend:** Firebase (Auth, Firestore, Hosting)
- **State Management:** React Context API
- **Authentication:** Firebase Auth (Google Sign-In)
- **Data Visualization:** Chart.js, React-ChartJS-2
- **Other Libraries:** Random-Words, React Select, React Toastify

## 🌍 Features
✅ Real-time **typing speed test** with WPM & accuracy tracking  
✅ **User authentication** with Firebase (Google Sign-In)  
✅ **Leaderboard** to compare your performance with others  
✅ **Charts & Stats** to visualize progress over time  
✅ **Custom test settings** (time limits, word count)  
✅ **Responsive UI** for desktop & mobile  
✅ **Dark mode support**  

## 📊 Typing Speed & Accuracy Calculation
### Words Per Minute (WPM):
```
WPM = (Correct Words / Time in Minutes)
```
### Accuracy:
```
Accuracy (%) = [(Correct Characters) / (Correct + Incorrect + Extra + Missed Characters)] * 100
```
### Definitions:
- **Correct Characters:** Typed correctly as per the given text.
- **Incorrect Characters:** Typed incorrectly.
- **Extra Characters:** Typed but not present in the original text.
- **Missed Characters:** Not typed at all from the original text.

## 🔧 Installation & Setup
Clone the repository and install dependencies:

```bash
# Clone the repo
git clone https://github.com/your-username/ciphersprint.git
cd ciphersprint

# Install dependencies
npm install

# Create a .env file and add Firebase credentials

# Run development server
npm start
```

## 🌎 Live Website
[Visit CipherSprint](https://ciphersprint.vercel.app/)

---

⌨️ **Start typing faster with CipherSprint!** 🚀
