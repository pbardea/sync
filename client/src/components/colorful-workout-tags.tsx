'use client'

import { useState } from 'react'
import { PlusCircle, X, Edit2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Exercise } from '@/Fitness'

export function ColorfulWorkoutTags() {
  const [exercises, setExercises] = useState<Exercise[]>([
    { name: 'Running', color: '#A66FB5' },
    { name: 'Weight Lifting', color: '#6488EA' },
    { name: 'Skating', color: '#FFDBBB' },
  ])
  const [newExercise, setNewExercise] = useState<Exercise>({ name: '', color: '#000000' })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const addOrUpdateExercise = () => {
    if (newExercise.name.trim() !== '') {
      if (editingIndex !== null) {
        const updatedExercises = [...exercises]
        updatedExercises[editingIndex] = newExercise
        setExercises(updatedExercises)
        setEditingIndex(null)
      } else {
        setExercises([...exercises, newExercise])
      }
      setNewExercise({ name: '', color: '#000000' })
      setIsDialogOpen(false)
    }
  }

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index))
  }

  const editExercise = (index: number) => {
    setNewExercise(exercises[index])
    setEditingIndex(index)
    setIsDialogOpen(true)
  }

  return (
    <div className="max-w-md mx-auto p-4 bg-card rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-card-foreground">Workout Tags</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              onClick={() => {
                setNewExercise({ name: '', color: '#000000' })
                setEditingIndex(null)
              }}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Add
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingIndex !== null ? 'Edit Exercise' : 'Add New Exercise'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="exercise-name" className="text-right">
                  Name
                </label>
                <Input
                  id="exercise-name"
                  value={newExercise.name}
                  onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="exercise-color" className="text-right">
                  Color
                </label>
                <Input
                  id="exercise-color"
                  type="color"
                  value={newExercise.color}
                  onChange={(e) => setNewExercise({ ...newExercise, color: e.target.value })}
                  className="col-span-3 h-10"
                />
              </div>
            </div>
            <Button onClick={addOrUpdateExercise}>
              {editingIndex !== null ? 'Update' : 'Add'} Exercise
            </Button>
          </DialogContent>
        </Dialog>
      </div>
      <div className="flex flex-wrap gap-2">
        {exercises.map((exercise, index) => (
          <div
            key={index}
            className="flex items-center bg-background rounded-full px-3 py-1"
            style={{ backgroundColor: exercise.color, color: getContrastColor(exercise.color) }}
          >
            <span className="mr-2">{exercise.name}</span>
            <button
              onClick={() => editExercise(index)}
              className="p-1 rounded-full hover:bg-black/10"
              aria-label={`Edit ${exercise.name}`}
            >
              <Edit2 className="h-3 w-3" />
            </button>
            <button
              onClick={() => removeExercise(index)}
              className="p-1 rounded-full hover:bg-black/10"
              aria-label={`Remove ${exercise.name}`}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// Helper function to determine text color based on background color
function getContrastColor(hexColor: string) {
  const r = parseInt(hexColor.slice(1, 3), 16)
  const g = parseInt(hexColor.slice(3, 5), 16)
  const b = parseInt(hexColor.slice(5, 7), 16)
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000
  return (yiq >= 128) ? 'black' : 'white'
}
