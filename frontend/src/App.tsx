import { lazy, Suspense, ReactNode } from "react";
import { ThemeProvider } from "styled-components";
import SocialPanel from "./Components/social/SocialPanel";
import AppLayout from "./Components/AppLayout";
import Toaster from "./Components/Toaster";
import Spinner from "./Components/ui/Spinner";
import RaceInvites from "./Components/race/RaceInvites";
import OfflineSync from "./Components/OfflineSync";
import { GlobalStyles } from "./Styles/global";
import { useTheme } from "./Context/ThemeContext";
import { SocialContextProvider } from "./Context/SocialContext";
import { UiProvider } from "./Context/UiContext";
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
const RacePage = lazy(() => import("./Pages/RacePage"));
const RaceRoomPage = lazy(() => import("./Pages/RaceRoomPage"));
const SettingsPage = lazy(() => import("./Pages/SettingsPage"));
const ForgotPasswordPage = lazy(() => import("./Pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./Pages/ResetPasswordPage"));
const AdminReportsPage = lazy(() => import("./Pages/AdminReportsPage"));
const ReplayPage = lazy(() => import("./Pages/ReplayPage"));
const NotFoundPage = lazy(() => import("./Pages/NotFoundPage"));

const Standalone = ({ children }: { children: ReactNode }) => (
  <Suspense fallback={<div className="route-loading"><Spinner size={20} /></div>}>{children}</Suspense>
);

function App() {
  const {theme} = useTheme()
  return (
    <ThemeProvider theme={theme}>
      <SocialContextProvider>
        <UiProvider>
          <Toaster/>
          <GlobalStyles />
          <SocialPanel />
          <RaceInvites />
          <OfflineSync />
          <Routes>
            <Route path="/" element={<Home/>}/>
            {/* Outside the app layout, like the typing test: the nav and footer
                step aside while a race is on. */}
            <Route path="/race/:code" element={<Standalone><RaceRoomPage /></Standalone>} />
            <Route element={<AppLayout/>}>
              <Route path="/user" element={<AnalyticsPage/>}/>
              <Route path="/u/:username" element={<ProfilePage/>}/>
              <Route path="/leaderboard" element={<LeaderboardPage/>}/>
              <Route path="/race" element={<RacePage/>}/>
              <Route path="/groups" element={<GroupsPage/>}/>
              <Route path="/groups/:groupId" element={<GroupChatPage/>}/>
              <Route path="/settings" element={<SettingsPage/>}/>
              <Route path="/replay/:id" element={<ReplayPage/>}/>
              <Route path="/forgot" element={<ForgotPasswordPage/>}/>
              <Route path="/reset" element={<ResetPasswordPage/>}/>
              <Route path="/admin/reports" element={<AdminReportsPage/>}/>
              <Route path="*" element={<NotFoundPage/>}/>
            </Route>
          </Routes>
        </UiProvider>
      </SocialContextProvider>
    </ThemeProvider>
  );
}

export default App;
