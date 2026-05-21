const STEP_LABELS = [
  'Experiência',
  'Serviço',
  'Data e Hora',
  'Pessoas',
  'Participantes',
  'Resumo',
]

interface ProgressBarProps {
  currentStep: number
  totalSteps: number
}

export function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  const percent = Math.round(((currentStep - 1) / (totalSteps - 1)) * 100)

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Passo {currentStep} de {totalSteps} —{' '}
          <span className="font-medium text-white">{STEP_LABELS[currentStep - 1]}</span>
        </span>
        <span className="text-brand">{percent}% completo</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-brand transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
