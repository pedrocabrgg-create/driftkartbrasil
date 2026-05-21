'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { reservaFormSchema, type ReservaFormData } from '@/lib/schemas/reserva'
import { criarReserva } from './actions'
import type { Modalidade } from '@/lib/db/types'

import { Step1Nivel } from '@/components/booking/step1-nivel'
import { Step2Modalidade } from '@/components/booking/step2-modalidade'
import { Step3DataHorario } from '@/components/booking/step3-data-horario'
import { Step4Pilotos } from '@/components/booking/step4-pilotos'
import { Step5Participantes } from '@/components/booking/step5-participantes'
import { Step6Resumo } from '@/components/booking/step6-resumo'
import { BookingSuccess } from '@/components/booking/booking-success'
import { ProgressBar } from '@/components/booking/progress-bar'

const TOTAL_STEPS = 6

interface BookingWizardProps {
  modalidades: Modalidade[]
}

export function BookingWizard({ modalidades }: BookingWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [successReservaId, setSuccessReservaId] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<ReservaFormData>({
    resolver: zodResolver(reservaFormSchema),
    defaultValues: {
      nivelExperiencia: undefined,
      modalidadeId: '',
      data: '',
      inicioAt: '',
      pilotosCount: 1,
      pilotos: [{ nome: '', telefone: '' }],
      organizador: { nome: '', telefone: '', email: '', cpf: '' },
    },
    mode: 'onChange',
  })

  // eslint-disable-next-line react-hooks/incompatible-library
  const modalidadeSelecionada = modalidades.find(
    (m) => m.id === form.watch('modalidadeId'),
  )

  function nextStep() {
    setCurrentStep((s) => Math.min(s + 1, TOTAL_STEPS))
  }

  function prevStep() {
    setCurrentStep((s) => Math.max(s - 1, 1))
  }

  async function onSubmit(data: ReservaFormData) {
    setSubmitError(null)
    setIsSubmitting(true)
    try {
      const result = await criarReserva(data)
      if (result.ok) {
        setSuccessReservaId(result.reservaId)
      } else {
        setSubmitError(result.error)
        // Se erro de disponibilidade, volta para passo 3
        if (result.error.includes('horário')) {
          setCurrentStep(3)
        }
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (successReservaId) {
    return (
      <BookingSuccess
        reservaId={successReservaId}
        formData={form.getValues()}
        modalidade={modalidadeSelecionada ?? null}
      />
    )
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <ProgressBar currentStep={currentStep} totalSteps={TOTAL_STEPS} />

      <div className="mt-8">
        {currentStep === 1 && <Step1Nivel form={form} onNext={nextStep} />}
        {currentStep === 2 && (
          <Step2Modalidade
            form={form}
            modalidades={modalidades}
            onNext={nextStep}
            onPrev={prevStep}
          />
        )}
        {currentStep === 3 && (
          <Step3DataHorario
            form={form}
            modalidade={modalidadeSelecionada ?? null}
            onNext={nextStep}
            onPrev={prevStep}
          />
        )}
        {currentStep === 4 && (
          <Step4Pilotos
            form={form}
            modalidade={modalidadeSelecionada ?? null}
            onNext={nextStep}
            onPrev={prevStep}
          />
        )}
        {currentStep === 5 && (
          <Step5Participantes form={form} onNext={nextStep} onPrev={prevStep} />
        )}
        {currentStep === 6 && (
          <Step6Resumo
            form={form}
            modalidade={modalidadeSelecionada ?? null}
            onSubmit={form.handleSubmit(onSubmit)}
            onPrev={prevStep}
            isSubmitting={isSubmitting}
            submitError={submitError}
          />
        )}
      </div>
    </div>
  )
}
