"use client"

import React, { useState, useTransition } from "react"
import { 
  Plus, 
  Trash2, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  Circle, 
  ListTodo, 
  Clock, 
  AlertCircle,
  Sparkles,
  X
} from "lucide-react"
import { createTaskAction, toggleTaskAction, deleteTaskAction } from "./actions"

export interface TaskType {
  id: string
  title: string
  description: string | null
  completed: boolean
  dueDate: string | null
  priority: string
  userId: string
  createdAt: string
  updatedAt: string
}

interface TasksListClientProps {
  agentId: string
  userId: string
  agentName: string
  initialTasks: TaskType[]
}

export default function TasksListClient({ agentId, userId, agentName, initialTasks }: TasksListClientProps) {
  const [tasks, setTasks] = useState<TaskType[]>(initialTasks)
  const [isPending, startTransition] = useTransition()
  
  // Tab states: 'pending' | 'completed'
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending')
  // Priority filter: 'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL')
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [newPriority, setNewPriority] = useState("MEDIUM")
  const [newDueDate, setNewDueDate] = useState("")
  
  const [isSaving, setIsSaving] = useState(false)

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    const statusMatch = activeTab === 'completed' ? task.completed : !task.completed
    const priorityMatch = priorityFilter === 'ALL' ? true : task.priority === priorityFilter
    return statusMatch && priorityMatch
  })

  const pendingCount = tasks.filter(t => !t.completed).length
  const completedCount = tasks.filter(t => t.completed).length

  // Toggle Task Status
  const handleToggle = async (taskId: string, currentCompleted: boolean) => {
    const nextCompleted = !currentCompleted
    
    // Optimistic UI Update
    setTasks(prev => 
      prev.map(t => t.id === taskId ? { ...t, completed: nextCompleted } : t)
    )

    const res = await toggleTaskAction(taskId, nextCompleted, agentId)
    if (!res.success) {
      // Revert if error
      setTasks(prev => 
        prev.map(t => t.id === taskId ? { ...t, completed: currentCompleted } : t)
      )
      alert("Error al actualizar la tarea: " + res.error)
    }
  }

  // Delete Task
  const handleDelete = async (taskId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este pendiente?")) return

    const previousTasks = [...tasks]
    // Optimistic UI Update
    setTasks(prev => prev.filter(t => t.id !== taskId))

    const res = await deleteTaskAction(taskId, agentId)
    if (!res.success) {
      setTasks(previousTasks)
      alert("Error al eliminar la tarea: " + res.error)
    }
  }

  // Create Task
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return

    setIsSaving(true)
    const res = await createTaskAction({
      title: newTitle,
      description: newDescription || undefined,
      priority: newPriority,
      dueDate: newDueDate || undefined,
      userId: userId
    })

    setIsSaving(false)
    if (res.success && res.task) {
      const createdTask: TaskType = {
        ...res.task,
        createdAt: new Date(res.task.createdAt).toISOString(),
        updatedAt: new Date(res.task.updatedAt).toISOString()
      }
      setTasks(prev => [createdTask, ...prev])
      setIsModalOpen(false)
      // Reset form
      setNewTitle("")
      setNewDescription("")
      setNewPriority("MEDIUM")
      setNewDueDate("")
    } else {
      alert("Error al crear la tarea: " + res.error)
    }
  }

  return (
    <div className="min-h-full bg-neutral-950 p-6 md:p-8 flex flex-col gap-6 text-neutral-200">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-neutral-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <ListTodo className="w-6 h-6 text-indigo-400" />
              Gestor de Tareas Pendientes
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              María Asistente
            </span>
          </div>
          <p className="text-sm text-neutral-400">
            Administra tus pendientes de trabajo creados por ti o anotados directamente por {agentName}.
          </p>
        </div>
        
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2 px-4 rounded-xl transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nueva Tarea
        </button>
      </div>

      {/* TABS & FILTERS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {/* State tabs */}
        <div className="flex bg-neutral-900 p-1 rounded-xl border border-neutral-800/80">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              activeTab === 'pending'
                ? "bg-neutral-800 text-white shadow-sm"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            Pendientes ({pendingCount})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              activeTab === 'completed'
                ? "bg-neutral-800 text-white shadow-sm"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            Completadas ({completedCount})
          </button>
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500 font-medium">Prioridad:</span>
          <div className="flex gap-1.5">
            {(['ALL', 'HIGH', 'MEDIUM', 'LOW'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
                  priorityFilter === p
                    ? p === 'HIGH' ? "bg-red-500/10 text-red-400 border-red-500/20"
                      : p === 'MEDIUM' ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                      : p === 'LOW' ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                      : "bg-neutral-800 text-white border-neutral-700"
                    : "bg-transparent text-neutral-400 border-neutral-800 hover:border-neutral-700"
                }`}
              >
                {p === 'ALL' && 'Todas'}
                {p === 'HIGH' && 'Alta'}
                {p === 'MEDIUM' && 'Media'}
                {p === 'LOW' && 'Baja'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* TASKS LIST */}
      <div className="flex-1 flex flex-col gap-3 min-h-[300px]">
        {filteredTasks.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 border border-dashed border-neutral-800 rounded-2xl bg-neutral-900/10">
            <ListTodo className="w-12 h-12 text-neutral-600 mb-3" />
            <h3 className="text-white font-medium mb-1">No se encontraron tareas</h3>
            <p className="text-xs text-neutral-500 text-center max-w-xs">
              {activeTab === 'pending'
                ? "No tienes tareas pendientes que coincidan con los filtros seleccionados."
                : "No hay tareas marcadas como completadas todavía."}
            </p>
          </div>
        ) : (
          filteredTasks.map(task => {
            const isHigh = task.priority === 'HIGH'
            const isMedium = task.priority === 'MEDIUM'
            const isLow = task.priority === 'LOW'

            return (
              <div 
                key={task.id}
                className={`group flex items-start gap-4 p-4 rounded-xl border transition-all bg-neutral-900/40 backdrop-blur-sm ${
                  task.completed 
                    ? "border-neutral-900 opacity-60" 
                    : "border-neutral-800/80 hover:border-neutral-700/80 hover:bg-neutral-900/60"
                }`}
              >
                {/* CHECKBOX TRIGGER */}
                <button
                  onClick={() => handleToggle(task.id, task.completed)}
                  className="mt-0.5 text-neutral-400 hover:text-indigo-400 transition-colors shrink-0"
                >
                  {task.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-indigo-500 animate-in zoom-in-50 duration-200" />
                  ) : (
                    <Circle className="w-5 h-5 text-neutral-600 group-hover:text-neutral-500 transition-colors" />
                  )}
                </button>

                {/* TASK TITLE & DETAILS */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <h3 className={`font-semibold text-sm leading-tight break-words ${
                      task.completed ? "line-through text-neutral-500" : "text-white"
                    }`}>
                      {task.title}
                    </h3>
                    
                    {/* PRIORITY BADGE */}
                    <span className={`text-[10px] px-2 py-0.5 rounded font-medium border tracking-wide uppercase shrink-0 ${
                      isHigh ? "bg-red-500/10 text-red-400 border-red-500/20"
                        : isMedium ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                        : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                    }`}>
                      {isHigh ? 'Alta' : isMedium ? 'Media' : 'Baja'}
                    </span>
                  </div>

                  {task.description && (
                    <p className={`text-xs mb-2 leading-relaxed break-words ${
                      task.completed ? "text-neutral-600" : "text-neutral-400"
                    }`}>
                      {task.description}
                    </p>
                  )}

                  {/* DUE DATE CARD */}
                  {task.dueDate && (
                    <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 font-medium">
                      <CalendarIcon className="w-3.5 h-3.5 shrink-0" />
                      <span>Límite: {task.dueDate}</span>
                    </div>
                  )}
                </div>

                {/* DELETE BUTTON */}
                <button
                  onClick={() => handleDelete(task.id)}
                  className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-2 text-neutral-600 hover:text-red-400 hover:bg-neutral-800/50 rounded-lg transition-all"
                  title="Eliminar tarea"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )
          })
        )}
      </div>

      {/* CREATE TASK MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#161616] border border-neutral-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center p-5 border-b border-neutral-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" />
                Añadir Nueva Tarea
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-500 hover:text-white p-1 hover:bg-neutral-800 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreate} className="p-5 flex flex-col gap-4">
              
              {/* Title input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-neutral-400 font-medium">Título o Pendiente *</label>
                <input 
                  type="text"
                  required
                  className="bg-neutral-900 border border-neutral-800 rounded-lg p-2.5 text-sm text-neutral-200 focus:outline-none focus:border-neutral-700 w-full"
                  placeholder="Ej. Revisar reportes de venta"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>

              {/* Description textarea */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-neutral-400 font-medium">Descripción (Opcional)</label>
                <textarea
                  className="bg-neutral-900 border border-neutral-800 rounded-lg p-2.5 text-sm text-neutral-200 focus:outline-none focus:border-neutral-700 w-full min-h-[80px] resize-y"
                  placeholder="Detalles sobre el pendiente..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Priority Selection */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-neutral-400 font-medium">Prioridad</label>
                  <select
                    className="bg-neutral-900 border border-neutral-800 rounded-lg p-2.5 text-sm text-neutral-200 focus:outline-none focus:border-neutral-700 w-full"
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                  >
                    <option value="LOW">Baja</option>
                    <option value="MEDIUM">Media</option>
                    <option value="HIGH">Alta</option>
                  </select>
                </div>

                {/* Due Date selection */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-neutral-400 font-medium">Fecha Límite (Opcional)</label>
                  <input 
                    type="date"
                    className="bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-sm text-neutral-200 focus:outline-none focus:border-neutral-700 w-full"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !newTitle.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 disabled:opacity-50 text-white text-xs font-semibold py-2 px-4 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  {isSaving ? "Guardando..." : "Crear Pendiente"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  )
}
