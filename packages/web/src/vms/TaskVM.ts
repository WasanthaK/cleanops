/**
 * Task view model coordinates offline-friendly task updates.
 */
import { useEffect, useState } from 'react';

import { apiRepo } from '../repos/ApiRepo';
import { TaskItem } from '../models';

export function useTaskVM(jobId: string, initialTasks: TaskItem[]) {
  const [tasks, setTasks] = useState<TaskItem[]>(initialTasks);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const toggleTask = (taskId: string) => {
    setTasks((current) =>
      current.map((task) => (task.id === taskId ? { ...task, completed: !task.completed } : task))
    );
  };

  const save = async () => {
    setSaving(true);
    try {
      await apiRepo.saveTasks(jobId, tasks);
    } finally {
      setSaving(false);
    }
  };

  return { tasks, setTasks, toggleTask, save, saving };
}
