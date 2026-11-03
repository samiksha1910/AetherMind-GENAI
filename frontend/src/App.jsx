
import { useEffect, useState } from 'react'
import {
  extractTasks,
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  breakDownGoal,
} from './services/api'

const navigation = [
  { label: 'Dashboard', icon: '⌂' },
  { label: 'AI Assistant', icon: '✧' },
  { label: 'My Tasks', icon: '☷' },
  { label: 'Goals & Milestones', icon: '◇' },
  { label: 'Calendar', icon: '▦' },
]

function displayDate(date) {
  if (!date) return 'No deadline'
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  })
}

function App() {
  const [activePage, setActivePage] = useState('Dashboard')

  // SETTINGS PREFERENCES
  const [defaultPriority, setDefaultPriority] = useState(
    () => localStorage.getItem('aethermind-priority') || 'Medium'
  )

  const [weekStart, setWeekStart] = useState(
    () => localStorage.getItem('aethermind-week-start') || 'Monday'
  )

  const [dailyReminder, setDailyReminder] = useState(
    () => localStorage.getItem('aethermind-daily-reminder') !== 'false'
  )

  useEffect(() => {
    localStorage.setItem('aethermind-priority', defaultPriority)
    localStorage.setItem('aethermind-week-start', weekStart)
    localStorage.setItem(
      'aethermind-daily-reminder',
      String(dailyReminder)
    )
  }, [defaultPriority, weekStart, dailyReminder])

  // TASK STATES
  const [tasks, setTasks] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [priorityFilter, setPriorityFilter] = useState('All')

  const [editingTaskId, setEditingTaskId] = useState(null)
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'Medium',
    due_date: '',
  })

  // GOAL STATES
  const [goals, setGoals] = useState([])
  const [goalTitle, setGoalTitle] = useState('')
  const [goalDescription, setGoalDescription] = useState('')
  const [goalDate, setGoalDate] = useState('')
  const [goalMilestones, setGoalMilestones] = useState('')

  const [goalIdea, setGoalIdea] = useState('')
  const [suggestedGoal, setSuggestedGoal] = useState(null)

  // AI STATES
  const [note, setNote] = useState('')
  const [extractedTasks, setExtractedTasks] = useState([])
  const [isExtracting, setIsExtracting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isBreakingDown, setIsBreakingDown] = useState(false)

  // LOADING STATES
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingGoals, setIsLoadingGoals] = useState(true)
  const [isCreatingGoal, setIsCreatingGoal] = useState(false)

  // NOTIFICATIONS
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  // CALENDAR STATES
  const [calendarMonth, setCalendarMonth] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  )

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().slice(0, 10)
  )

  const getDateKey = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const changeCalendarMonth = (direction) => {
    setCalendarMonth((current) =>
      new Date(
        current.getFullYear(),
        current.getMonth() + direction,
        1
      )
    )
  }

  const calendarStart = new Date(
    calendarMonth.getFullYear(),
    calendarMonth.getMonth(),
    1
  )

  const calendarOffset = (calendarStart.getDay() + 6) % 7

  const calendarDays = Array.from({ length: 42 }, (_, index) => {
    return new Date(
      calendarMonth.getFullYear(),
      calendarMonth.getMonth(),
      index - calendarOffset + 1
    )
  })

  const selectedDayTasks = tasks.filter(
    (task) => task.due_date?.slice(0, 10) === selectedDate
  )

  const todayKey = getDateKey(new Date())

  
  const loadTasks = async () => {
    try {
      const result = await getTasks()
      setTasks(result.tasks || [])
      setError('')
    } catch (err) {
      setError(`Could not load tasks: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const loadGoals = async () => {
    try {
      const result = await getGoals()
      setGoals(result.goals || [])
    } catch (err) {
      setError(`Could not load goals: ${err.message}`)
    } finally {
      setIsLoadingGoals(false)
    }
  }

  useEffect(() => {
    loadTasks()
    loadGoals()
  }, [])

  const completed = tasks.filter(
    (task) => task.status === 'Completed'
  ).length

  const pending = tasks.length - completed

  const activeGoals = goals.filter(
    (goal) => goal.status !== 'Completed'
  ).length

  const handleExtract = async () => {
    if (!note.trim()) {
      setError('Please enter some text before extracting tasks.')
      setActivePage('AI Assistant')
      return
    }

    setActivePage('AI Assistant')
    setIsExtracting(true)
    setError('')
    setMessage('')
    setExtractedTasks([])

    try {
      const result = await extractTasks(note.trim(), 'Text')
      setExtractedTasks(result.tasks || [])

      if (!result.tasks?.length) {
        setMessage('No actionable tasks were found. Try describing specific actions.')
      }
    } catch (err) {
      setError(err.message || 'Task extraction failed.')
    } finally {
      setIsExtracting(false)
    }
  }

  const handleSaveTasks = async () => {
    if (!extractedTasks.length) return

    setIsSaving(true)
    setError('')
    setMessage('')

    let savedCount = 0

    try {
      for (const task of extractedTasks) {
        await createTask(task)
        savedCount += 1
      }

      setExtractedTasks([])
      setNote('')
      await loadTasks()
      setMessage(`${savedCount} task(s) saved successfully to your workspace!`)
      setActivePage('My Tasks')
    } catch (err) {
      await loadTasks()
      setError(
        `${savedCount} task(s) saved. The remaining tasks could not be saved: ${err.message}`
      )
    } finally {
      setIsSaving(false)
    }
  }

  const toggleTask = async (task) => {
    const newStatus =
      task.status === 'Completed' ? 'Pending' : 'Completed'

    try {
      await updateTask(task._id, { status: newStatus })
      await loadTasks()
      setMessage('Task status updated successfully.')
      setError('')
    } catch (err) {
      setError(`Could not update task: ${err.message}`)
    }
  }

  const handleDeleteTask = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return
    }

    try {
      await deleteTask(id)
      await loadTasks()
      setMessage('Task deleted successfully.')
      setError('')
    } catch (err) {
      setError(`Could not delete task: ${err.message}`)
    }
  }
  const handleEditTask = (task) => {
  setEditingTaskId(task._id)
  setEditForm({
    title: task.title || '',
    description: task.description || '',
    category: task.category || 'General',
    priority: task.priority || 'Medium',
    due_date: task.due_date || '',
  })
  setError('')
  setMessage('')
}

const handleSaveTaskEdit = async (event) => {
  event.preventDefault()

  if (!editForm.title.trim()) {
    setError('Task title cannot be empty.')
    return
  }

  try {
    await updateTask(editingTaskId, {
      ...editForm,
      title: editForm.title.trim(),
      due_date: editForm.due_date || null,
    })

    setEditingTaskId(null)
    await loadTasks()
    setMessage('Task updated successfully!')
    setError('')
  } catch (err) {
    setError(`Could not edit task: ${err.message}`)
  }
}

  // CREATE A GOAL

  const handleCreateGoal = async (event) => {
    event.preventDefault()

    if (!goalTitle.trim()) {
      setError('Please enter a goal title.')
      return
    }

    const milestones = goalMilestones
      .split('\n')
      .map((title) => title.trim())
      .filter(Boolean)
      .map((title) => ({
        title,
        completed: false,
      }))

    setIsCreatingGoal(true)
    setError('')
    setMessage('')

    try {
      await createGoal({
        title: goalTitle.trim(),
        description: goalDescription.trim(),
        target_date: goalDate || null,
        milestones,
      })

      setGoalTitle('')
      setGoalDescription('')
      setGoalDate('')
      setGoalMilestones('')

      await loadGoals()
      setMessage('Your new goal has been saved successfully!')
    } catch (err) {
      setError(`Could not create goal: ${err.message}`)
    } finally {
      setIsCreatingGoal(false)
    }
  }
  
const handleBreakDownGoal = async () => {
  if (!goalIdea.trim()) {
    setError('Please describe the goal you want to achieve.')
    return
  }

  setIsBreakingDown(true)
  setSuggestedGoal(null)
  setError('')
  setMessage('')

  try {
    const result = await breakDownGoal(goalIdea.trim())
    setSuggestedGoal({
      ...result,
      milestones: result.milestones || [],
    })
    setMessage('Your AI-generated goal plan is ready for review!')
  } catch (err) {
    setError(`Could not generate goal plan: ${err.message}`)
  } finally {
    setIsBreakingDown(false)
  }
}

const handleSaveSuggestedGoal = async () => {
  if (!suggestedGoal) return

  setIsCreatingGoal(true)
  setError('')
  setMessage('')

  try {
    await createGoal({
      title: suggestedGoal.title,
      description: suggestedGoal.description,
      target_date: goalDate || null,
      milestones: suggestedGoal.milestones.map((milestone) => ({
        title: milestone.title,
        completed: false,
      })),
    })

    setSuggestedGoal(null)
    setGoalIdea('')
    setGoalDate('')

    await loadGoals()
    setMessage('AI-generated goal saved successfully to MongoDB!')
  } catch (err) {
    setError(`Could not save AI goal: ${err.message}`)
  } finally {
    setIsCreatingGoal(false)
  }
}


  // UPDATE MILESTONE COMPLETION

  const handleToggleMilestone = async (goal, index) => {
    const updatedMilestones = goal.milestones.map((milestone, i) => (
      i === index
        ? { ...milestone, completed: !milestone.completed }
        : milestone
    ))

    try {
      await updateGoal(goal._id, {
        milestones: updatedMilestones,
      })

      await loadGoals()
      setMessage('Milestone progress updated.')
      setError('')
    } catch (err) {
      setError(`Could not update milestone: ${err.message}`)
    }
  }
  const handleUpdateMilestones = async (goal, updatedMilestones) => {
  try {
    await updateGoal(goal._id, {
      milestones: updatedMilestones,
    })

    await loadGoals()
    setMessage('Goal milestones updated successfully!')
    setError('')
  } catch (err) {
    setError(`Could not update milestones: ${err.message}`)
  }
}

  // MARK GOAL COMPLETE

  const handleCompleteGoal = async (goal) => {
    const newStatus =
      goal.status === 'Completed' ? 'In Progress' : 'Completed'

    try {
      await updateGoal(goal._id, { status: newStatus })
      await loadGoals()
      setMessage(`Goal marked ${newStatus.toLowerCase()}.`)
      setError('')
    } catch (err) {
      setError(`Could not update goal: ${err.message}`)
    }
  }

  // DELETE GOAL

  const handleDeleteGoal = async (id) => {
    if (!window.confirm('Are you sure you want to delete this goal?')) {
      return
    }

    try {
      await deleteGoal(id)
      await loadGoals()
      setMessage('Goal deleted successfully.')
      setError('')
    } catch (err) {
      setError(`Could not delete goal: ${err.message}`)
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon">✧</span>
          <span>AetherMind</span>
        </div>

        <p className="nav-label">WORKSPACE</p>

        <nav>
          {navigation.map((item) => (
            <button
              key={item.label}
              className={`nav-item ${activePage === item.label ? 'active' : ''}`}
              onClick={() => {
                setActivePage(item.label)
                setError('')
                setMessage('')

                if (item.label === 'My Tasks') loadTasks()
                if (item.label === 'Goals & Milestones') loadGoals()
              }}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <p className="nav-label preferences-label">PREFERENCES</p>

        <button
          className={`nav-item ${activePage === 'Settings' ? 'active' : ''}`}
          onClick={() => setActivePage('Settings')}
        >
          <span className="nav-icon">⚙</span>
          Settings
        </button>

        <div className="workspace-profile">
          <div className="avatar">S</div>
          <div>
            <strong>My Workspace</strong>
            <span>Personal space</span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace <span>/</span> <strong>{activePage}</strong>
          </div>

          <div className="top-actions">
            <span className="date-label">◷ &nbsp; Your workspace</span>
            <span className="icon-button">♧</span>
          </div>
        </header>

        {(error || message) && (
          <div className={error ? 'ai-error' : 'ai-note'}>
            {error || message}
          </div>
        )}

        {activePage === 'Dashboard' && (
          <>
            <section className="welcome-section">
              <div>
                <h1>Welcome back, Samiksha ✨</h1>
                <p>Here's your personal command center. Let's make today count.</p>
              </div>
              <span className="ai-badge">✦ AI-powered workspace</span>
            </section>

            <section className="stats-grid">
              <StatCard
                label="Total tasks"
                value={tasks.length}
                note="Your active workload"
              />
              <StatCard
                label="Completed"
                value={completed}
                note="Tasks finished"
                color="green"
              />
              <StatCard
                label="Pending"
                value={pending}
                note="Tasks to work on"
                color="blue"
              />
              <StatCard
                label="Active goals"
                value={activeGoals}
                note="Goals in progress"
                color="purple"
              />
            </section>

            <section className="dashboard-grid">
              <div className="assistant-card">
                <span className="assistant-tag">✧ YOUR AI ASSISTANT</span>
                <h2>What's on your mind?</h2>
                <p>Share your plans and I'll turn them into clear, actionable tasks.</p>

                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="e.g. I need to prepare for my Java viva and finish my cloud assignment by tomorrow..."
                  rows="3"
                />

                <div className="assistant-actions">
                  <span>＋ Text input</span>
                  <button
                    className="primary-button"
                    onClick={handleExtract}
                    disabled={isExtracting}
                  >
                    {isExtracting ? 'Extracting...' : 'Extract tasks ↗'}
                  </button>
                </div>
              </div>
<div className="panel-card">
  <div className="panel-heading">
    <h2>Upcoming priorities</h2>
    <button onClick={() => setActivePage('My Tasks')}>
      View all →
    </button>
  </div>

  {isLoading ? (
    <p>Loading your tasks...</p>
  ) : (() => {
    const today = new Date().toISOString().split('T')[0]

    const upcomingTasks = tasks
      .filter(
        (task) =>
          task.status !== 'Completed' &&
          task.due_date &&
          task.due_date >= today
      )
      .sort((a, b) => a.due_date.localeCompare(b.due_date))
      .slice(0, 3)

    return upcomingTasks.length ? (
      upcomingTasks.map((task) => (
        <TaskRow
          key={task._id}
          task={task}
          onToggle={toggleTask}
        />
      ))
    ) : (
      <p>No upcoming deadlines. You're all caught up!</p>
    )
  })()}
</div>
            </section>

            <section className="bottom-grid">
              <div className="panel-card goal-card">
                <div className="panel-heading">
                  <h2>Goal progress</h2>
                  <button onClick={() => {
                    setActivePage('Goals & Milestones')
                    loadGoals()
                  }}>
                    See goals →
                  </button>
                </div>

                {goals.length ? (
                  goals.slice(0, 2).map((goal) => (
                    <GoalProgress key={goal._id} goal={goal} />
                  ))
                ) : (
                  <div className="goal-title">
                    No goals yet <span>Create your first goal</span>
                  </div>
                )}
              </div>

              <div className="panel-card productivity-card">
  <h2>Your productivity</h2>

  <div className="productivity-content">
    <div
      className="productivity-ring"
      style={{
        '--progress': `${tasks.length
          ? Math.round((completed / tasks.length) * 100)
          : 0}%`,
      }}
    >
      <div className="productivity-ring-inner">
        <strong>
          {tasks.length
            ? Math.round((completed / tasks.length) * 100)
            : 0}%
        </strong>
        <span>COMPLETED</span>
      </div>
    </div>

    <div className="productivity-message">
      <h3>One step at a time.</h3>
      <p>
        Keep your priorities clear and turn big goals into small wins,
        one task at a time.
      </p>
      <span className="purple-text">✧ Powered by AetherMind</span>
    </div>
  </div>
</div>
            </section>
          </>
        )}

{activePage === 'AI Assistant' && (
  <section className="page-placeholder ai-workspace">

    {/* AI PAGE INTRO */}
    <div className="ai-page-intro">
  <div>
    <h1>Your thoughts, intelligently organized.</h1>
    <p>
      Turn everyday thoughts into clear tasks, priorities and actionable plans.
    </p>
  </div>
</div>

    {/* QUICK PROMPT SUGGESTIONS */}
    <div className="ai-prompt-suggestions">
      <span>TRY ASKING</span>

      <button
        onClick={() =>
          setNote("Help me plan my day and prioritize my pending tasks.")
        }
      >
        ✧ Plan my day
      </button>

      <button
        onClick={() =>
          setNote("Help me organize my upcoming deadlines and assignments.")
        }
      >
        ◷ Organize my deadlines
      </button>

      <button
        onClick={() =>
          setNote("Break down my goal into small actionable tasks.")
        }
      >
        ◇ Organize my goals
      </button>
    </div>

    <div className="ai-workspace-grid">

      {/* MAIN AI INPUT PANEL */}
      <div className="assistant-card ai-input-panel">
        <span className="assistant-tag">✧ GEMINI AI · TASK EXTRACTION</span>
        <h2>What's on your mind?</h2>
        <p>
          Write naturally. Include your tasks, deadlines, plans or reminders.
          Gemini will identify the actionable items.
        </p>

        <textarea
          className="ai-main-input"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="For example: Tomorrow I need to revise Java for 2 hours, finish my cloud assignment by Friday, and prepare slides for my project..."
          rows="9"
        />

        <div className="assistant-actions">
          <span>✧ Natural language input</span>
          <button
            className="primary-button"
            onClick={handleExtract}
            disabled={isExtracting || isSaving}
          >
            {isExtracting ? 'Analyzing your text...' : 'Extract my tasks ↗'}
          </button>
        </div>

        {isExtracting && (
          <p className="ai-loading">
            ✧ Gemini is analyzing your input and identifying actionable tasks...
          </p>
        )}

        {extractedTasks.length > 0 && (
          <div className="extracted-results">
            <h2>✧ Review extracted tasks</h2>
            <p>Check the details before saving them to your workspace.</p>

            {extractedTasks.map((task, index) => (
              <div className="panel-card extracted-task" key={index}>
                <h3>{task.title}</h3>
                <p>{task.description || 'No additional description.'}</p>
                <div className="extracted-task-details">
                  <span>{task.category}</span>
                  <span>{task.priority} priority</span>
                  <span>{displayDate(task.due_date)}</span>
                </div>
              </div>
            ))}

            <button
              className="primary-button"
              onClick={handleSaveTasks}
              disabled={isSaving}
            >
              {isSaving ? 'Saving to MongoDB...' : 'Confirm & Save Tasks'}
            </button>
          </div>
        )}
      </div>

      {/* RIGHT SIDEBAR */}
      <div className="ai-side-column">

        <div className="panel-card ai-insight-card">
          <span className="assistant-tag">YOUR WORKSPACE</span>
          <h2>Task snapshot</h2>

          <div className="overview-stat">
            <span>Total tasks</span>
            <strong>{tasks.length}</strong>
          </div>

          <div className="overview-stat">
            <span>Pending</span>
            <strong>{tasks.filter(t => t.status === 'Pending').length}</strong>
          </div>

          <div className="overview-stat">
            <span>Completed</span>
            <strong>{completed}</strong>
          </div>

          <div className="overview-stat">
            <span>Active goals</span>
            <strong>{activeGoals}</strong>
          </div>
        </div>

        <div className="panel-card ai-insight-card">
          <span className="assistant-tag">RECENT TASKS</span>
          <h2>Recently in your workspace</h2>

          {tasks.length ? (
            tasks.slice(0, 4).map(task => (
              <div className="ai-recent-task" key={task._id}>
                <span className="ai-recent-dot" />
                <div>
                  <strong>{task.title}</strong>
                  <span>{task.priority} priority · {task.status}</span>
                </div>
              </div>
            ))
          ) : (
            <p>Your saved tasks will appear here.</p>
          )}
        </div>

        <div className="panel-card ai-tip-card">
          <span className="assistant-tag">HOW IT WORKS</span>
          <h2>From thoughts to action.</h2>
          <p>01 · Describe your plans in plain language.</p>
          <p>02 · Gemini extracts structured tasks.</p>
          <p>03 · Review and confirm your tasks.</p>
          <p>04 · Your confirmed tasks are saved to MongoDB.</p>
        </div>

      </div>
    </div>
  </section>
)}

        {activePage === 'My Tasks' && (
  <section className="page-placeholder">
    <span className="assistant-tag">YOUR WORKSPACE</span>
    <h1>My Tasks</h1>
    <p>Search, organize and manage your tasks.</p>
    <div className="task-overview-grid">
  <StatCard
    label="Total tasks"
    value={tasks.length}
    note="All your tasks"
  />
  <StatCard
    label="Pending"
    value={tasks.filter(t => t.status === 'Pending').length}
    note="Waiting to be done"
    color="blue"
  />
  <StatCard
    label="In progress"
    value={tasks.filter(t => t.status === 'In Progress').length}
    note="Currently working on"
    color="purple"
  />
  <StatCard
    label="Completed"
    value={completed}
    note="Successfully finished"
    color="green"
  />
</div>

    <div className="task-filters">
      <input
        className="goal-form-input"
        placeholder="Search tasks..."
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
      />

      <select
        className="goal-form-input"
        value={statusFilter}
        onChange={(event) => setStatusFilter(event.target.value)}
      >
        <option value="All">All statuses</option>
        <option value="Pending">Pending</option>
        <option value="In Progress">In Progress</option>
        <option value="Completed">Completed</option>
      </select>

      <select
        className="goal-form-input"
        value={priorityFilter}
        onChange={(event) => setPriorityFilter(event.target.value)}
      >
        <option value="All">All priorities</option>
        <option value="High">High</option>
        <option value="Medium">Medium</option>
        <option value="Low">Low</option>
      </select>
    </div>

    {isLoading ? (
      <p>Loading tasks...</p>
    ) : tasks.length === 0 ? (
      <div className="panel-card">
        <h2>No tasks yet</h2>
        <p>Use the AI Assistant to create your first task.</p>
        <button
          className="primary-button"
          onClick={() => setActivePage('AI Assistant')}
        >
          Create tasks
        </button>
      </div>
    ) : (
      (() => {
        const filteredTasks = tasks.filter((task) => {
          const query = searchQuery.toLowerCase()

          const matchesSearch =
            (task.title || '').toLowerCase().includes(query) ||
            (task.description || '').toLowerCase().includes(query)

          const matchesStatus =
            statusFilter === 'All' || task.status === statusFilter

          const matchesPriority =
            priorityFilter === 'All' ||
            (task.priority || 'Medium') === priorityFilter

          return matchesSearch && matchesStatus && matchesPriority
        })

        return filteredTasks.length ? (
          filteredTasks.map((task) => (
            <div className="task-management-row" key={task._id}>
              {editingTaskId === task._id ? (
                <form
                  className="panel-card"
                  onSubmit={handleSaveTaskEdit}
                >
                  <h3>Edit task</h3>

                  <label className="goal-form-label">Title</label>
                  <input
                    className="goal-form-input"
                    value={editForm.title}
                    onChange={(event) =>
                      setEditForm({ ...editForm, title: event.target.value })
                    }
                    required
                  />

                  <label className="goal-form-label">Description</label>
                  <textarea
                    className="goal-form-input"
                    value={editForm.description}
                    onChange={(event) =>
                      setEditForm({ ...editForm, description: event.target.value })
                    }
                    rows="2"
                  />

                  <label className="goal-form-label">Category</label>
                  <input
                    className="goal-form-input"
                    value={editForm.category}
                    onChange={(event) =>
                      setEditForm({ ...editForm, category: event.target.value })
                    }
                  />

                  <label className="goal-form-label">Priority</label>
                  <select
                    className="goal-form-input"
                    value={editForm.priority}
                    onChange={(event) =>
                      setEditForm({ ...editForm, priority: event.target.value })
                    }
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>

                  <label className="goal-form-label">Deadline</label>
                  <input
                    className="goal-form-input"
                    type="date"
                    value={editForm.due_date}
                    onChange={(event) =>
                      setEditForm({ ...editForm, due_date: event.target.value })
                    }
                  />

                  <div className="goal-card-actions">
                    <button className="primary-button" type="submit">
                      Save changes
                    </button>

                    <button
                      className="delete-task-button"
                      type="button"
                      onClick={() => setEditingTaskId(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <TaskRow task={task} onToggle={toggleTask} />

                  <button
                    className="delete-task-button"
                    onClick={() => handleEditTask(task)}
                  >
                    Edit
                  </button>

                  <button
                    className="delete-task-button"
                    onClick={() => handleDeleteTask(task._id)}
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          ))
        ) : (
          <div className="panel-card">
            <h3>No matching tasks</h3>
            <p>Try changing your search or filters.</p>
          </div>
        )
      })()
    )}
  </section>
)}

          {activePage === 'Goals & Milestones' && (
  <section className="page-placeholder">
    <span className="assistant-tag">YOUR WORKSPACE</span>
    <h1>Goals & Milestones</h1>
    <p>Turn your ambitions into manageable steps.</p>

    <div className="goals-layout">

      {/* LEFT SIDE */}
      <div className="goals-main">

        {/* AI GOAL PLANNER */}
        <div className="assistant-card standalone-assistant">
          <span className="assistant-tag">✧ GEMINI AI GOAL PLANNER</span>
          <h2>Turn your big ideas into a plan.</h2>
          <p>
            Describe what you want to achieve. AetherMind will break
            your goal into practical milestones.
          </p>

          <textarea
            value={goalIdea}
            onChange={(event) => setGoalIdea(event.target.value)}
            placeholder="e.g. I want to become a full-stack developer in the next 6 months..."
            rows="4"
          />

          <div className="assistant-actions">
            <span>✧ AI-powered planning</span>
            <button
              className="primary-button"
              onClick={handleBreakDownGoal}
              disabled={isBreakingDown || isCreatingGoal}
            >
              {isBreakingDown ? 'Generating plan...' : 'Generate my plan ↗'}
            </button>
          </div>

          {isBreakingDown && (
            <p className="ai-loading">
              ✧ Gemini is turning your goal into actionable milestones...
            </p>
          )}

          {suggestedGoal && (
            <div className="extracted-results">
              <h2>✧ Review your AI-generated plan</h2>
              <p>
                You can edit the goal and milestones before saving.
              </p>

              <label className="goal-form-label">Goal title</label>
              <input
                className="goal-form-input"
                value={suggestedGoal.title}
                onChange={(event) =>
                  setSuggestedGoal({
                    ...suggestedGoal,
                    title: event.target.value,
                  })
                }
              />

              <label className="goal-form-label">Description</label>
              <textarea
                className="goal-form-input"
                value={suggestedGoal.description}
                onChange={(event) =>
                  setSuggestedGoal({
                    ...suggestedGoal,
                    description: event.target.value,
                  })
                }
                rows="3"
              />

              <label className="goal-form-label">
                Target date <span>(optional)</span>
              </label>
              <input
                className="goal-form-input"
                type="date"
                value={goalDate}
                onChange={(event) => setGoalDate(event.target.value)}
              />

              <label className="goal-form-label">
                Milestones <span>(edit or remove as needed)</span>
              </label>

              {suggestedGoal.milestones.map((milestone, index) => (
                <div className="milestone-row" key={index}>
                  <input
                    className="goal-form-input"
                    value={milestone.title}
                    onChange={(event) => {
                      const updated = [...suggestedGoal.milestones];

                      updated[index] = {
                        ...updated[index],
                        title: event.target.value,
                      };

                      setSuggestedGoal({
                        ...suggestedGoal,
                        milestones: updated,
                      });
                    }}
                    placeholder="Milestone title"
                  />

                  <button
                    type="button"
                    className="delete-task-button"
                    onClick={() =>
                      setSuggestedGoal({
                        ...suggestedGoal,
                        milestones: suggestedGoal.milestones.filter(
                          (_, i) => i !== index
                        ),
                      })
                    }
                  >
                    Remove
                  </button>
                </div>
              ))}

              <button
                type="button"
                className="primary-button"
                onClick={() =>
                  setSuggestedGoal({
                    ...suggestedGoal,
                    milestones: [
                      ...suggestedGoal.milestones,
                      { title: '', completed: false },
                    ],
                  })
                }
              >
                + Add milestone
              </button>

              <div className="goal-card-actions">
                <button
                  className="primary-button"
                  onClick={handleSaveSuggestedGoal}
                  disabled={
                    isCreatingGoal ||
                    !suggestedGoal.title.trim() ||
                    !suggestedGoal.milestones.length ||
                    suggestedGoal.milestones.some(
                      (item) => !item.title.trim()
                    )
                  }
                >
                  {isCreatingGoal ? 'Saving to MongoDB...' : 'Confirm & Save Goal'}
                </button>

                <button
                  className="delete-task-button"
                  onClick={() => {
                    setSuggestedGoal(null);
                    setMessage('');
                  }}
                >
                  Discard plan
                </button>
              </div>
            </div>
          )}
        </div>

        {/* MANUAL GOAL CREATION */}
        <div className="assistant-card standalone-assistant">
          <h2>＋ Create a goal manually</h2>
          <p>Prefer creating your own goal? Add it here.</p>

          <form onSubmit={handleCreateGoal}>
            <label className="goal-form-label">Goal title</label>
            <input
              className="goal-form-input"
              value={goalTitle}
              onChange={(event) => setGoalTitle(event.target.value)}
              placeholder="e.g. Become a full-stack developer"
              maxLength={200}
              required
            />

            <label className="goal-form-label">Description</label>
            <textarea
              className="goal-form-input"
              value={goalDescription}
              onChange={(event) => setGoalDescription(event.target.value)}
              placeholder="What do you want to achieve?"
              rows="3"
            />

            <label className="goal-form-label">Target date</label>
            <input
              className="goal-form-input"
              type="date"
              value={goalDate}
              onChange={(event) => setGoalDate(event.target.value)}
            />

            <label className="goal-form-label">
              Milestones <span>(one milestone per line)</span>
            </label>
            <textarea
              className="goal-form-input"
              value={goalMilestones}
              onChange={(event) => setGoalMilestones(event.target.value)}
              placeholder={'Learn the fundamentals\nBuild a project\nDeploy the project'}
              rows="4"
            />

            <button
              className="primary-button"
              type="submit"
              disabled={isCreatingGoal}
            >
              {isCreatingGoal ? 'Saving goal...' : 'Create goal ↗'}
            </button>
          </form>
        </div>

        {/* SAVED GOALS */}
        <div className="goals-list">
          <h2>Your goals</h2>

          {isLoadingGoals ? (
            <p>Loading your goals...</p>
          ) : goals.length === 0 ? (
            <div className="panel-card">
              <h3>No goals created yet</h3>
              <p>Your saved goals will appear here.</p>
            </div>
          ) : (
            goals.map((goal) => (
              <GoalCard
                key={goal._id}
                goal={goal}
                onToggleMilestone={handleToggleMilestone}
                onComplete={handleCompleteGoal}
                onDelete={handleDeleteGoal}
                onEditMilestones={handleUpdateMilestones}
              />
            ))
          )}
        </div>

      </div>

      {/* RIGHT SIDE — GOALS OVERVIEW */}
      <aside className="goals-overview">

        <div className="panel-card">
          <span className="assistant-tag">YOUR PROGRESS</span>
          <h2>Goals Overview</h2>

          <div className="overview-stat">
            <span>Total goals</span>
            <strong>{goals.length}</strong>
          </div>

          <div className="overview-stat">
            <span>In progress</span>
            <strong>
              {goals.filter((goal) => goal.status !== 'Completed').length}
            </strong>
          </div>

          <div className="overview-stat">
            <span>Completed goals</span>
            <strong>
              {goals.filter((goal) => goal.status === 'Completed').length}
            </strong>
          </div>
        </div>

        <div className="panel-card">
          <span className="assistant-tag">MILESTONE TRACKER</span>
          <h2>Overall progress</h2>

          <div className="overview-stat">
            <span>Completed milestones</span>
            <strong>
              {goals.reduce(
                (total, goal) =>
                  total +
                  (goal.milestones || []).filter((item) => item.completed).length,
                0
              )}
            </strong>
          </div>

          <div className="overview-stat">
            <span>Total milestones</span>
            <strong>
              {goals.reduce(
                (total, goal) => total + (goal.milestones || []).length,
                0
              )}
            </strong>
          </div>

          <div className="progress-track">
            <div
              className="progress-fill"
              style={{
                width: `${
                  goals.reduce(
                    (total, goal) =>
                      total +
                      (goal.milestones || []).filter((item) => item.completed).length,
                    0
                  ) /
                    Math.max(
                      goals.reduce(
                        (total, goal) => total + (goal.milestones || []).length,
                        0
                      ),
                      1
                    ) *
                    100
                }%`,
              }}
            />
          </div>
        </div>

        <div className="panel-card">
          <span className="assistant-tag">AETHERMIND TIP</span>
          <h2>One step at a time.</h2>
          <p>
            Break large ambitions into smaller milestones. Complete them
            consistently and track your progress here.
          </p>
        </div>

      </aside>
    </div>
  </section>
)}
        

        {activePage === 'Calendar' && (
  <section className="calendar-page">
    <span className="assistant-tag">YOUR WORKSPACE</span>

    <div className="welcome-section calendar-heading">
      <div>
        <h1>Calendar</h1>
        <p>Keep track of your deadlines and daily priorities.</p>
      </div>

      <button
        className="secondary-button"
        onClick={() => {
          setCalendarMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
          setSelectedDate(todayKey)
        }}
      >
        Today
      </button>
    </div>

    <div className="panel-card calendar-card">
      <div className="calendar-toolbar">
        <button
          className="calendar-nav-button"
          onClick={() => changeCalendarMonth(-1)}
        >
          ←
        </button>

        <h2>
          {calendarMonth.toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
          })}
        </h2>

        <button
          className="calendar-nav-button"
          onClick={() => changeCalendarMonth(1)}
        >
          →
        </button>
      </div>

      <div className="calendar-grid">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <div className="calendar-weekday" key={day}>
            {day}
          </div>
        ))}

        {calendarDays.map((date) => {
          const dateKey = getDateKey(date)
          const dayTasks = tasks.filter(
            (task) => task.due_date?.slice(0, 10) === dateKey
          )
          const isCurrentMonth =
            date.getMonth() === calendarMonth.getMonth()
          const isToday = dateKey === todayKey
          const isSelected = dateKey === selectedDate

          return (
            <button
              key={dateKey}
              className={[
                'calendar-day',
                !isCurrentMonth ? 'other-month' : '',
                isToday ? 'today' : '',
                isSelected ? 'selected-day' : '',
              ].join(' ')}
              onClick={() => setSelectedDate(dateKey)}
            >
              <span>{date.getDate()}</span>

              {dayTasks.length > 0 && (
                <div className="calendar-task-dots">
                  {dayTasks.slice(0, 3).map((task, index) => (
                    <span key={task._id || index} />
                  ))}
                </div>
              )}

              {dayTasks.length > 0 && (
                <small>{dayTasks.length} task{dayTasks.length > 1 ? 's' : ''}</small>
              )}
            </button>
          )
        })}
      </div>
    </div>

    <div className="panel-card calendar-agenda">
      <div className="panel-heading">
        <h2>
          {new Date(`${selectedDate}T12:00:00`).toLocaleDateString(
            'en-US',
            { weekday: 'long', day: 'numeric', month: 'long' }
          )}
        </h2>
        <span className="purple-text">
          {selectedDayTasks.length} scheduled
        </span>
      </div>

      {selectedDayTasks.length > 0 ? (
        selectedDayTasks.map((task) => (
          <div className="calendar-agenda-task" key={task._id}>
            <div>
              <strong className={task.status === 'Completed' ? 'completed-task' : ''}>
                {task.title}
              </strong>
              <span>{task.category || 'General'} · {task.priority} priority</span>
            </div>
            <span className="purple-text">{task.status}</span>
          </div>
        ))
      ) : (
        <p className="calendar-empty">
          No tasks scheduled for this date. Enjoy the free time!
        </p>
      )}
    </div>
  </section>
)}
{activePage === 'Settings' && (
  <section className="page-placeholder settings-page">
    <div className="settings-heading">
      <h1>Settings</h1>
      <p>Customize your workspace and preferences.</p>
    </div>

    <div className="panel-card settings-workspace-card">
      <div className="settings-section-title">
        <span className="settings-icon">✧</span>
        <h2>Workspace Overview</h2>
      </div>
      <div className="settings-workspace-content">
        <div>
          <h3>AetherMind</h3>
          <span className="settings-tagline">Plan · Focus · Achieve</span>
          <p>Your intelligent productivity companion, powered by AI.</p>
        </div>
        <div className="settings-brand-art">
          <span>✧</span>
          <strong>AetherMind</strong>
          <small>Plan · Focus · Achieve</small>
        </div>
      </div>
    </div>

    <div className="panel-card settings-preferences-card">
      <div className="settings-section-title">
        <span className="settings-icon">☷</span>
        <h2>Productivity Preferences</h2>
      </div>

      <div className="settings-preference-row">
        <label htmlFor="default-priority">Default Task Priority</label>
        <select id="default-priority" value={defaultPriority}
          onChange={(event) => setDefaultPriority(event.target.value)}>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>
      </div>

      <div className="settings-preference-row">
        <label htmlFor="week-start">Start of the Week</label>
        <select id="week-start" value={weekStart}
          onChange={(event) => setWeekStart(event.target.value)}>
          <option value="Monday">Monday</option>
          <option value="Sunday">Sunday</option>
        </select>
      </div>

      <div className="settings-preference-row">
        <label htmlFor="daily-reminder">Daily Planning Reminder</label>
        <label className="settings-switch">
          <input id="daily-reminder" type="checkbox" checked={dailyReminder}
            onChange={(event) => setDailyReminder(event.target.checked)} />
          <span />
        </label>
      </div>

      <p className="settings-save-note">
        ✧ Your preferences are saved automatically on this device.
      </p>
    </div>

    <div className="panel-card settings-about-card">
      <div className="settings-section-title">
        <span className="settings-icon">ⓘ</span>
        <h2>About AetherMind</h2>
      </div>
      <div className="settings-about-grid">
        <div><span>Project Version</span><strong>v1.0.0</strong></div>
        <div><span>Built With</span><strong>React · FastAPI · Gemini AI · MongoDB</strong></div>
        <div>
          <span>About</span>
          <strong>An AI-powered productivity platform to help you plan better, achieve more and grow consistently.</strong>
        </div>
      </div>
    </div>
  </section>
)}
      </main>
    </div>
  )
}

function StatCard({ label, value, note, color = 'purple' }) {
  return (
    <div className="stat-card">
      <span>{label}</span>
      <strong className={color}>{value}</strong>
      <small>{note}</small>
    </div>
  )
}

function TaskRow({ task, onToggle }) {
  const done = task.status === 'Completed'

  return (
    <div className="task-row">
      <button
        className={`task-check ${done ? 'checked' : ''}`}
        onClick={() => onToggle(task)}
        aria-label={done ? 'Mark incomplete' : 'Mark complete'}
      >
        {done ? '✓' : ''}
      </button>

      <div className="task-details">
        <strong className={done ? 'completed-task' : ''}>
          {task.title}
        </strong>
        <span>
          {displayDate(task.due_date)} · {task.category}
        </span>
      </div>

      <span className={`priority ${(task.priority || 'Medium').toLowerCase()}`}>
        {task.priority || 'Medium'}
      </span>
    </div>
  )
}

function GoalProgress({ goal }) {
  const milestones = goal.milestones || []
  const completedCount = milestones.filter((item) => item.completed).length
  const progress = milestones.length
    ? Math.round((completedCount / milestones.length) * 100)
    : goal.status === 'Completed' ? 100 : 0

  return (
    <div style={{ marginBottom: '18px' }}>
      <div className="goal-title">
        {goal.title}
        <span>{progress}%</span>
      </div>
      <div className="progress-track">
        <div style={{ width: `${progress}%` }} />
      </div>
      <div className="goal-footer">
        <span>{completedCount}/{milestones.length} milestones complete</span>
        <span className="purple-text">{goal.status}</span>
      </div>
    </div>
  )
}
function GoalCard({
  goal,
  onToggleMilestone,
  onComplete,
  onDelete,
  onEditMilestones,
}) {
  const milestones = goal.milestones || []
  const completedCount = milestones.filter((item) => item.completed).length
  const progress = milestones.length
    ? Math.round((completedCount / milestones.length) * 100)
    : goal.status === 'Completed' ? 100 : 0

  const [isEditing, setIsEditing] = useState(false)
  const [editedMilestones, setEditedMilestones] = useState(
    milestones.map((item) => ({ ...item }))
  )

  const startEditing = () => {
    setEditedMilestones(milestones.map((item) => ({ ...item })))
    setIsEditing(true)
  }

  const handleSave = async () => {
    const validMilestones = editedMilestones
      .filter((item) => item.title.trim())
      .map((item) => ({
        ...item,
        title: item.title.trim(),
      }))

    await onEditMilestones(goal, validMilestones)
    setIsEditing(false)
  }

  const addMilestone = () => {
    setEditedMilestones([
      ...editedMilestones,
      { title: '', completed: false },
    ])
  }

  const updateMilestone = (index, value) => {
    setEditedMilestones((previous) =>
      previous.map((item, i) =>
        i === index ? { ...item, title: value } : item
      )
    )
  }

  const removeMilestone = (index) => {
    setEditedMilestones((previous) =>
      previous.filter((_, i) => i !== index)
    )
  }

  return (
    <div className="panel-card goal-management-card">
      <div className="panel-heading">
        <h2>{goal.title}</h2>
        <span className="purple-text">{goal.status}</span>
      </div>

      {goal.description && <p>{goal.description}</p>}

      <div className="goal-footer">
        <span>Target: {displayDate(goal.target_date)}</span>
        <span>
          {completedCount}/{milestones.length} milestones
        </span>
      </div>

      <div className="progress-track">
        <div style={{ width: `${progress}%` }} />
      </div>

      <p className="purple-text">{progress}% completed</p>

      <h3>Milestones</h3>

      {isEditing ? (
        <div className="milestone-edit-list">
          {editedMilestones.map((milestone, index) => (
            <div className="milestone-row" key={index}>
              <input
                type="text"
                value={milestone.title}
                placeholder="Enter milestone name"
                onChange={(event) =>
                  updateMilestone(index, event.target.value)
                }
              />

              <button
                type="button"
                className="delete-task-button"
                onClick={() => removeMilestone(index)}
              >
                Remove
              </button>
            </div>
          ))}

          <button
            type="button"
            className="secondary-button"
            onClick={addMilestone}
          >
            + Add milestone
          </button>

          <div className="goal-card-actions">
            <button
              type="button"
              className="primary-button"
              onClick={handleSave}
            >
              Save changes
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          {milestones.length ? (
            milestones.map((milestone, index) => (
              <label className="milestone-row" key={index}>
                <input
                  type="checkbox"
                  checked={milestone.completed}
                  onChange={() => onToggleMilestone(goal, index)}
                />
                <span
                  className={
                    milestone.completed ? 'completed-task' : ''
                  }
                >
                  {milestone.title}
                </span>
              </label>
            ))
          ) : (
            <p>No milestones added to this goal.</p>
          )}

          <div className="goal-card-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={startEditing}
            >
              Edit milestones
            </button>

            <button
              type="button"
              className="primary-button"
              onClick={() => onComplete(goal)}
            >
              {goal.status === 'Completed'
                ? 'Reopen goal'
                : 'Mark goal complete'}
            </button>

            <button
              type="button"
              className="delete-task-button"
              onClick={() => onDelete(goal._id)}
            >
              Delete goal
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default App