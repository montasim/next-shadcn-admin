'use server'

import { revalidatePath } from 'next/cache'
import { Task, taskSchema } from './data/schema'

// メモリ内データストア（実際のアプリケーションではデータベースを使用）
let tasks: Task[] = []

export async function getTasks() {
  return tasks
}

export async function createTask(formData: FormData) {
  const rawData = {
    id: `TASK-${Math.floor(Math.random() * 10000)}`,
    title: formData.get('title'),
    status: formData.get('status'),
    label: formData.get('label'),
    priority: formData.get('priority'),
  }

  const validatedData = taskSchema.parse(rawData)
  tasks.push(validatedData)
  
  revalidatePath('/dashboard/tasks')
  return { message: 'Task created successfully' }
}

export async function updateTask(taskId: string, formData: FormData) {
  const rawData = {
    id: taskId,
    title: formData.get('title'),
    status: formData.get('status'),
    label: formData.get('label'),
    priority: formData.get('priority'),
  }

  const validatedData = taskSchema.parse(rawData)
  const index = tasks.findIndex(task => task.id === taskId)
  
  if (index === -1) {
    throw new Error('Task not found')
  }

  tasks[index] = validatedData
  revalidatePath('/dashboard/tasks')
  return { message: 'Task updated successfully' }
}

export async function deleteTask(taskId: string) {
  const index = tasks.findIndex(task => task.id === taskId)
  
  if (index === -1) {
    throw new Error('Task not found')
  }

  tasks.splice(index, 1)
  revalidatePath('/dashboard/tasks')
  return { message: 'Task deleted successfully' }
}

// 初期データのロード
import { faker } from '@faker-js/faker'

const statuses = ['in progress', 'backlog', 'todo', 'canceled', 'done'] as const
const labels = ['documentation', 'feature', 'bug'] as const
const priorities = ['high', 'medium', 'low'] as const

tasks = Array.from({ length: 100 }, () => ({
  id: `TASK-${faker.number.int({ min: 1000, max: 9999 })}`,
  title: faker.hacker.phrase(),
  status: faker.helpers.arrayElement(statuses),
  label: faker.helpers.arrayElement(labels),
  priority: faker.helpers.arrayElement(priorities),
}))
