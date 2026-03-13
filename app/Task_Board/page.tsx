'use client'

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { useSidebar } from "@/lib/SidebarContext";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

// Task type
interface Task {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  deadline: string;
  status: "Backlog" | "In Progress" | "Review" | "Done";
}

const statuses: Task['status'][] = ["Backlog", "In Progress", "Review", "Done"];

export default function TaskBoard() {
  const { isOpen } = useSidebar();

  // ✅ Lazy init tasks from localStorage to avoid hydration issues
  const [tasks, setTasks] = useState<Task[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("taskboard_tasks");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");

    // Filter state
    const [activeFilter, setActiveFilter] = useState<"created" | "deadline" | "none">("none");
    const [filterDate, setFilterDate] = useState("");


  // Save tasks to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("taskboard_tasks", JSON.stringify(tasks));
    }
  }, [tasks]);

  // Add a new task
  const addTask = () => {
    if (!title || !description || !deadline) return;
    const newTask: Task = {
      id: Date.now().toString(),
      title,
      description,
      createdAt: new Date().toISOString(),
      deadline,
      status: "Backlog",
    };
    setTasks(prev => [...prev, newTask]);
    setTitle(""); setDescription(""); setDeadline("");
  };

  // Drag and Drop handler
    const onDragEnd = (result: DropResult) => {
    const { draggableId, destination } = result;
    if (!destination) return;

    setTasks(prev => {
        const movedTask = prev.find(t => t.id === draggableId)!;
        const others = prev.filter(t => t.id !== draggableId);

        // Filter tasks that will remain in the destination column
        const before = others.filter(t => t.status !== destination.droppableId);
        const inColumn = others.filter(t => t.status === destination.droppableId);

        // Insert moved task at the correct index in that column
        const updatedColumn = [
        ...inColumn.slice(0, destination.index),
        { ...movedTask, status: destination.droppableId as Task['status'] },
        ...inColumn.slice(destination.index)
        ];

        // Return new tasks array
        return [...before, ...updatedColumn];
    });
    };

    const deleteTask = (id: string) => {
    // Show confirmation dialog
    if (confirm("Are you sure you want to delete this task?")) {
        setTasks(prev => prev.filter(task => task.id !== id));
    }
    };

    // Filtered tasks
    const filteredTasks = tasks.filter(task => {
    if (activeFilter === "created") return filterDate ? task.createdAt.startsWith(filterDate) : true;
    if (activeFilter === "deadline") return filterDate ? task.deadline === filterDate : true;
    return true;
    });

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white font-sans">
      <Sidebar />
      <div className="flex-1 transition-all duration-300" style={{ paddingLeft: isOpen ? '240px' : '80px' }}>
        <Header />
        <main className="p-8">

          {/* Filters */}
            <div className="mb-6 flex gap-4 items-center">
                <select
                value={activeFilter}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                    const value = e.target.value as "created" | "deadline" | "none";
                    setActiveFilter(value);
                    setFilterDate(""); // reset date when switching
                }}
                className="p-2 rounded border border-gray-500 bg-[#1a1a1a]/80 text-white"
                >
                <option value="none">No Filter</option>
                <option value="created">Filter by Created Date</option>
                <option value="deadline">Filter by Deadline</option>
                </select>

            {activeFilter !== "none" && (
                <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="p-2 rounded bg-[#1a1a1a]/80"
                />
            )}
            </div>

          {/* Kanban Board */}
          <DragDropContext   onDragEnd={onDragEnd}
            onDragStart={() => {}}>
            <div className="flex gap-4 overflow-x-auto h-100">
              {statuses.map((status) => (
                <Droppable droppableId={status} key={status}>
                {(provided) => (
                    <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}        // ✅ ONLY HERE
                    className="min-w-[250px] p-2 bg-[#2a2a2a] rounded-lg flex flex-col"
                    >
                    <h3 className="text-lg font-bold mb-2">{status}</h3>

                    {/* Scrollable task list */}
                    <div className="overflow-y-auto max-h-[600px] flex flex-col gap-2">
                        {filteredTasks
                        .filter(task => task.status === status)
                        .map((task, index) => (
                            <Draggable draggableId={task.id} index={index} key={task.id}>
                            {(provided) => (
                                <div
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                ref={provided.innerRef}
                                className="p-2 bg-[#3a3a3a] rounded shadow cursor-pointer hover:bg-[#4a4a4a] relative"
                                >
                                <h4 className="font-semibold">{task.title}</h4>
                                <p className="text-sm">{task.description}</p>
                                <p className="text-xs mt-1">Deadline: {task.deadline}</p>
                                <p className="text-xs text-gray-400">
                                    Created: {task.createdAt.split('T')[0]}
                                </p>

                                {/* Delete Button */}
                                <button
                                    onClick={() => deleteTask(task.id)}
                                    className="absolute top-2 right-4 text-red-500 hover:text-red-700"
                                    title="Delete Task"
                                >
                                    ✕
                                </button>
                                </div>
                            )}
                            </Draggable>
                        ))}
                        {provided.placeholder}
                    </div>
                    </div>
                )}
                </Droppable>
              ))}
            </div>
          </DragDropContext>


          {/* Task Form */}
          <div className="mt-6 p-4 bg-[#2a2a2a] rounded-lg flex flex-col gap-3">
            <input
              className="p-2 rounded bg-[#1a1a1a]/80"
              placeholder="Title"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
            <textarea
              className="p-2 rounded bg-[#1a1a1a]/80"
              placeholder="Description"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
            <input
              type="date"
              className="p-2 rounded bg-[#1a1a1a]/80"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
            />
            <i className="text-xs">Note: Date input is for deadline</i>
            <button onClick={addTask} className="bg-blue-600 hover:bg-blue-700 p-2 rounded">
              Add Task
            </button>
          </div>

        </main>
      </div>
    </div>
  );
}