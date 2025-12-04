import React from "react"
import { useEffect } from "react"
import { useAuthStore } from "./stores/authStore"
import {Loader} from 'lucide-react'
import Navbar from "./components/Navbar"
import { Toaster } from "react-hot-toast"
import { Routes,Route, Navigate } from "react-router-dom"
// importinf pages 
import SignupPage from "./pages/SignupPage"
import LoginPage from "./pages/LoginPage"
import UserProfile from "./pages/UserProfile"
import DashboardPage from "./pages/DashboardPage"
import CreateTeamPage from "./pages/CreateTeamPage"
import TeamsPage from "./pages/TeamsPage"
import ViewTeam from "./pages/ViewTeam"
import ProjectsPage from "./pages/ProjectsPage"
import ProjectDetailPage from "./pages/ProjectDetailPage"
import TasksPage from "./pages/TasksPage"
import ProjectTasksPage from "./pages/ProjectTasksPage"
import ReportsPage from "./pages/ReportsPage"


const App = () => {
  const { authUser, isCheckingAuth, checkAuth } = useAuthStore();
  useEffect(
    ()=>{
      checkAuth()
    }, [checkAuth]
  );
  // if user being verified show loadin
  if(isCheckingAuth && !authUser){
    return (
      <div className='flex items-center justify-center h-screen'>
        <Loader className='size-10 animate-spin'/>
      </div>
    )
  };

  return (
    <div>
      <Navbar/>
        {/* roouting */}
        <Routes>  
            <Route path="/" element={ authUser ?  <TeamsPage /> : <LoginPage /> } />
            <Route path="/login" element ={ !authUser ? <LoginPage/> : <Navigate to="/" /> }/>
            <Route path="/signup" element ={ !authUser ? <SignupPage/> : <Navigate to="/" /> }/>
            <Route path="/profile" element = { authUser? <UserProfile/> : <Navigate to="/login"/>} />
            <Route path="/create-team" element = { authUser? <CreateTeamPage/> : <Navigate to="/login"/>} />
            {/* <Route path="/teams" element = { authUser? <TeamsPage/> : <Navigate to="/login"/>} /> */}
            <Route path="/view-team/:teamId" element = { authUser? <ViewTeam/> : <Navigate to="/login"/>} />
            <Route path="/projects" element = { authUser? <ProjectsPage/> : <Navigate to="/login"/>} />
            <Route path="/projects/:projectId" element = { authUser? <ProjectDetailPage/> : <Navigate to="/login"/>} />
            <Route path="/tasks" element = { authUser? <TasksPage/> : <Navigate to="/login"/>} />
            <Route path="/tasks/project/:projectId" element = { authUser? <ProjectTasksPage/> : <Navigate to="/login"/>} />
            <Route path="/reports/project/:projectId" element = { authUser? <ReportsPage/> : <Navigate to="/login"/>} />
        </Routes>
      <Toaster position="top-right"/>
    </div>
  )
}

export default App
