
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

  const [tasks, setTasks] = useState([])
  const [goals, setGoals] = useState([])

  const [note, setNote] = useState('')
  const [extractedTasks, setExtractedTasks] = useState([])

  const [goalTitle, setGoalTitle] = useState('')
  const [goalDescription, setGoalDescription] = useState('')
  const [goalDate, setGoalDate] = useState('')
  const [goalMilestones, setGoalMilestones] = useState('')

  const [isExtracting, setIsExtracting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingGoals, setIsLoadingGoals] = useState(true)
  const [isCreatingGoal, setIsCreatingGoal] = useState(false)

  const [goalIdea, setGoalIdea] = useState('')
  const [suggestedGoal, setSuggestedGoal] = useState(null)
  const [isBreakingDown, setIsBreakingDown] = useState(false)

  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

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
                  <h2>Today's focus</h2>
                  <button onClick={() => setActivePage('My Tasks')}>
                    View all →
                  </button>
                </div>

                {isLoading ? (
                  <p>Loading your tasks...</p>
                ) : tasks.length ? (
                  tasks.slice(0, 3).map((task) => (
                    <TaskRow
                      key={task._id}
                      task={task}
                      onToggle={toggleTask}
                    />
                  ))
                ) : (
                  <p>No tasks yet. Add your first task using the AI Assistant.</p>
                )}
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
                <h3>One step at a time.</h3>
                <p>
                  Keep your priorities clear and turn big goals into small wins,
                  one task at a time.
                </p>
                <span className="purple-text">✧ Powered by AetherMind</span>
              </div>
            </section>
          </>
        )}

        {activePage === 'AI Assistant' && (
          <section className="page-placeholder">
            <span className="assistant-tag">AETHERMIND WORKSPACE</span>
            <h1>AI Assistant</h1>

            <div className="assistant-card standalone-assistant">
              <h2>What's on your mind?</h2>
              <p>Write naturally. AetherMind will organize your thoughts into tasks.</p>

              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Write your plans, reminders, or goals here..."
                rows="5"
              />

              <div className="assistant-actions">
                <span>＋ Text input</span>
                <button
                  className="primary-button"
                  onClick={handleExtract}
                  disabled={isExtracting || isSaving}
                >
                  {isExtracting ? 'Extracting...' : 'Extract tasks ↗'}
                </button>
              </div>

              {isExtracting && (
                <p className="ai-loading">✧ AetherMind is analyzing your input...</p>
              )}

              {extractedTasks.length > 0 && (
                <div className="extracted-results">
                  <h2>✧ Extracted tasks</h2>
                  <p>Review these tasks before saving them to your workspace.</p>

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
          </section>
        )}

        {activePage === 'My Tasks' && (
          <section className="page-placeholder">
            <span className="assistant-tag">YOUR WORKSPACE</span>
            <h1>My Tasks</h1>
            <p>Tasks saved in your AetherMind database.</p>

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
              tasks.map((task) => (
                <div className="task-management-row" key={task._id}>
                  <TaskRow task={task} onToggle={toggleTask} />
                  <button
                    className="delete-task-button"
                    onClick={() => handleDeleteTask(task._id)}
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </section>
        )}

                {activePage === 'Goals & Milestones' && (
          <section className="page-placeholder">
            <span className="assistant-tag">YOUR WORKSPACE</span>
            <h1>Goals & Milestones</h1>
            <p>Turn your ambitions into manageable steps.</p>

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
                          const updated = [...suggestedGoal.milestones]
                          updated[index] = {
                            ...updated[index],
                            title: event.target.value,
                          }
                          setSuggestedGoal({
                            ...suggestedGoal,
                            milestones: updated,
                          })
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
                        setSuggestedGoal(null)
                        setMessage('')
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
                  />
                ))
              )}
            </div>
          </section>
        )}

        {activePage === 'Calendar' && (
          <section className="page-placeholder">
            <span className="assistant-tag">YOUR WORKSPACE</span>
            <h1>Calendar</h1>
            <div className="panel-card">
              <h2>Your deadlines</h2>
              {tasks.filter((task) => task.due_date).length ? (
                tasks
                  .filter((task) => task.due_date)
                  .map((task) => (
                    <p key={task._id}>
                      {displayDate(task.due_date)} — {task.title}
                    </p>
                  ))
              ) : (
                <p>No deadlines scheduled yet.</p>
              )}
            </div>
          </section>
        )}

        {activePage === 'Settings' && (
          <section className="page-placeholder">
            <span className="assistant-tag">YOUR WORKSPACE</span>
            <h1>Settings</h1>
            <div className="panel-card">
              <h2>Personal workspace</h2>
              <p>AetherMind — Personal AI Chief of Staff</p>
              <p>Database: MongoDB Atlas</p>
              <p>AI engine: Google Gemini</p>
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

function GoalCard({ goal, onToggleMilestone, onComplete, onDelete }) {
  const milestones = goal.milestones || []
  const completedCount = milestones.filter((item) => item.completed).length
  const progress = milestones.length
    ? Math.round((completedCount / milestones.length) * 100)
    : goal.status === 'Completed' ? 100 : 0

  return (
    <div className="panel-card goal-management-card">
      <div className="panel-heading">
        <h2>{goal.title}</h2>
        <span className="purple-text">{goal.status}</span>
      </div>

      {goal.description && <p>{goal.description}</p>}

      <div className="goal-footer">
        <span>Target: {displayDate(goal.target_date)}</span>
        <span>{completedCount}/{milestones.length} milestones</span>
      </div>

      <div className="progress-track">
        <div style={{ width: `${progress}%` }} />
      </div>

      <p className="purple-text">{progress}% completed</p>

      <h3>Milestones</h3>

      {milestones.length ? (
        milestones.map((milestone, index) => (
          <label
            key={index}
            className="milestone-row"
          >
            <input
              type="checkbox"
              checked={milestone.completed}
              onChange={() => onToggleMilestone(goal, index)}
            />
            <span className={milestone.completed ? 'completed-task' : ''}>
              {milestone.title}
            </span>
          </label>
        ))
      ) : (
        <p>No milestones added to this goal.</p>
      )}

      <div className="goal-card-actions">
        <button
          className="primary-button"
          onClick={() => onComplete(goal)}
        >
          {goal.status === 'Completed' ? 'Reopen goal' : 'Mark goal complete'}
        </button>

        <button
          className="delete-task-button"
          onClick={() => onDelete(goal._id)}
        >
          Delete goal
        </button>
      </div>
    </div>
  )
}

export default App
