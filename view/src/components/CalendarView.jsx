import React, { useState, useEffect } from 'react';
import { axiosInstance } from '../libs/axios';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, User, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const CalendarView = ({ projectId }) => {
  const [tasks, setTasks] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState('month'); // 'month', 'week', 'day'
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTasks();
  }, [projectId]);

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get(`/tasks/project/${projectId}`);
      setTasks(response.data.tasks || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Failed to load tasks. Please try again.');
      toast.error('Failed to load calendar tasks');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper functions for date manipulation
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();
  
  // Navigate to previous or next period based on current view
  const navigate = (direction) => {
    const newDate = new Date(currentDate);
    
    if (currentView === 'month') {
      newDate.setMonth(newDate.getMonth() + direction);
    } else if (currentView === 'week') {
      newDate.setDate(newDate.getDate() + (7 * direction));
    } else if (currentView === 'day') {
      newDate.setDate(newDate.getDate() + direction);
    }
    
    setCurrentDate(newDate);
  };

  // Get tasks for a specific date
  const getTasksForDate = (date) => {
    return tasks.filter(task => {
      const taskDate = new Date(task.dueDate);
      return (
        taskDate.getDate() === date.getDate() &&
        taskDate.getMonth() === date.getMonth() &&
        taskDate.getFullYear() === date.getFullYear()
      );
    });
  };

  // Determine if a date is today
  const isToday = (date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Get the week dates for the week view
  const getWeekDates = () => {
    const dates = [];
    const firstDayOfWeek = new Date(currentDate);
    const day = currentDate.getDay();
    
    // Adjust to get the first day of the week (Sunday)
    firstDayOfWeek.setDate(currentDate.getDate() - day);
    
    // Generate 7 days starting from the first day of the week
    for (let i = 0; i < 7; i++) {
      const date = new Date(firstDayOfWeek);
      date.setDate(firstDayOfWeek.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  };

  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = getFirstDayOfMonth(year, month);
    const monthDays = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      monthDays.push(<div key={`empty-${i}`} className="h-24 border border-gray-800 bg-gray-900/50"></div>);
    }
    
    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayTasks = getTasksForDate(date);
      const isCurrentDay = isToday(date);
      
      monthDays.push(
        <div 
          key={`day-${day}`} 
          className={`h-24 border border-gray-800 p-1 overflow-hidden ${
            isCurrentDay ? 'bg-indigo-900/20 border-indigo-500/50' : 'bg-gray-900/50'
          }`}
        >
          <div className="flex justify-between items-center mb-1">
            <span className={`text-xs font-medium ${isCurrentDay ? 'text-indigo-400' : 'text-gray-400'}`}>
              {day}
            </span>
            {dayTasks.length > 0 && (
              <span className="text-xs bg-gray-800 text-gray-300 px-1.5 py-0.5 rounded-full">
                {dayTasks.length}
              </span>
            )}
          </div>
          <div className="space-y-1">
            {dayTasks.slice(0, 2).map(task => (
              <div 
                key={task._id} 
                className="text-xs p-1 rounded bg-indigo-900/30 border border-indigo-800/50 truncate text-indigo-200"
              >
                {task.title}
              </div>
            ))}
            {dayTasks.length > 2 && (
              <div className="text-xs text-gray-400">+{dayTasks.length - 2} more</div>
            )}
          </div>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-7 gap-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center py-2 text-sm font-medium text-gray-400">
            {day}
          </div>
        ))}
        {monthDays}
      </div>
    );
  };

  const renderWeekView = () => {
    const weekDates = getWeekDates();
    
    return (
      <div className="grid grid-cols-7 gap-1">
        {weekDates.map((date, index) => {
          const dayTasks = getTasksForDate(date);
          const isCurrentDay = isToday(date);
          
          return (
            <div key={index} className="flex flex-col">
              <div className={`text-center py-2 text-sm font-medium ${
                isCurrentDay ? 'text-indigo-400' : 'text-gray-400'
              }`}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()]}
                <div className={`text-xs mt-1 ${isCurrentDay ? 'text-white' : 'text-gray-500'}`}>
                  {date.getDate()}
                </div>
              </div>
              <div className={`flex-1 border border-gray-800 p-2 min-h-[200px] ${
                isCurrentDay ? 'bg-indigo-900/20 border-indigo-500/50' : 'bg-gray-900/50'
              }`}>
                {dayTasks.map(task => (
                  <div 
                    key={task._id}
                    className="text-xs p-2 mb-2 rounded bg-indigo-900/30 border border-indigo-800/50 text-indigo-200"
                  >
                    <div className="font-medium mb-1 truncate">{task.title}</div>
                    <div className="flex items-center text-gray-400">
                      <Clock size={10} className="mr-1" />
                      <span>{new Date(task.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderDayView = () => {
    const dayTasks = getTasksForDate(currentDate);
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    return (
      <div className="flex flex-col">
        <div className="text-center py-4 text-lg font-medium text-white">
          {currentDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
        <div className="grid grid-cols-1 gap-1">
          {hours.map(hour => {
            const hourTasks = dayTasks.filter(task => {
              const taskDate = new Date(task.dueDate);
              return taskDate.getHours() === hour;
            });
            
            return (
              <div key={hour} className="flex border-b border-gray-800 py-2">
                <div className="w-16 text-right pr-4 text-sm text-gray-400">
                  {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                </div>
                <div className="flex-1">
                  {hourTasks.map(task => (
                    <div 
                      key={task._id}
                      className="p-2 mb-2 rounded bg-indigo-900/30 border border-indigo-800/50 text-indigo-200"
                    >
                      <div className="font-medium mb-1">{task.title}</div>
                      <div className="flex items-center text-gray-400 text-xs">
                        <Clock size={10} className="mr-1" />
                        <span>{new Date(task.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {task.assignee && (
                          <span className="ml-2 flex items-center">
                            <User size={10} className="mr-1" />
                            {task.assignee.name}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/20 border border-red-500/50 text-white p-4 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="calendar-view">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-white">Calendar View</h2>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              className="p-1 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            
            <span className="text-white font-medium">
              {currentView === 'month' && currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
              {currentView === 'week' && `Week of ${getWeekDates()[0].toLocaleDateString()}`}
              {currentView === 'day' && currentDate.toLocaleDateString()}
            </span>
            
            <button
              onClick={() => navigate(1)}
              className="p-1 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          
          <div className="flex bg-gray-800 rounded-lg overflow-hidden">
            <button
              onClick={() => setCurrentView('month')}
              className={`px-3 py-1 text-sm ${
                currentView === 'month' 
                  ? 'bg-indigo-600 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setCurrentView('week')}
              className={`px-3 py-1 text-sm ${
                currentView === 'week' 
                  ? 'bg-indigo-600 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setCurrentView('day')}
              className={`px-3 py-1 text-sm ${
                currentView === 'day' 
                  ? 'bg-indigo-600 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Day
            </button>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-800/80 backdrop-blur-md rounded-lg border border-gray-700/50 p-4">
        {currentView === 'month' && renderMonthView()}
        {currentView === 'week' && renderWeekView()}
        {currentView === 'day' && renderDayView()}
      </div>
    </div>
  );
};

export default CalendarView; 