import { lazy } from "react";
import { ThemeProvider } from "styled-components";
import SocialPanel from "./Components/social/SocialPanel";
import AppLayout from "./Components/AppLayout";
import Toaster from "./Components/Toaster";
import { GlobalStyles } from "./Styles/global";
import { useTheme } from "./Context/ThemeContext";
import { SocialContextProvider } from "./Context/SocialContext";
import 'react-toastify/dist/ReactToastify.css';
import { Route, Routes } from "react-router-dom";
import Home from "./Pages/Home";

// Everything except the typing test loads on demand, so the first paint
// only pays for the page people actually land on.
const AnalyticsPage = lazy(() => import("./Pages/AnalyticsPage"));
const ProfilePage = lazy(() => import("./Pages/ProfilePage"));
const LeaderboardPage = lazy(() => import("./Pages/LeaderboardPage"));
const GroupsPage = lazy(() => import("./Pages/GroupsPage"));
const GroupChatPage = lazy(() => import("./Pages/GroupChatPage"));

function App() {
  const {theme} = useTheme()
  return (
    <ThemeProvider theme={theme}>
      <SocialContextProvider>
        <Toaster/>
        <GlobalStyles />
        <SocialPanel />
        <Routes>
          <Route path="/" element={<Home/>}/>
          <Route element={<AppLayout/>}>
            <Route path="/user" element={<AnalyticsPage/>}/>
            <Route path="/u/:username" element={<ProfilePage/>}/>
            <Route path="/leaderboard" element={<LeaderboardPage/>}/>
            <Route path="/groups" element={<GroupsPage/>}/>
            <Route path="/groups/:groupId" element={<GroupChatPage/>}/>
          </Route>
        </Routes>
      </SocialContextProvider>
    </ThemeProvider>
  );
}

export default App;
