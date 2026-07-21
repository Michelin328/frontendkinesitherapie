'use client'

import { useState, useEffect, useCallback } from 'react'
import { getPatients, getPatientById } from '@/lib/api'
import type { Patient, PaginatedResponse } from '@/types'

export function usePatientList(page = 1, limit = 20, search?: string) {
  const [data, setData] = useState<PaginatedResponse<Patient> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getPatients(page, limit, search)
      setData(res)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [page, limit, search])

  useEffect(() => { fetchData() }, [fetchData])

  return {
    patients: data?.data || [],
    total: data?.total || 0,
    totalPages: data?.totalPages || 0,
    loading,
    error,
    refetch: fetchData,
  }
}

export function usePatient(id: number | null) {
  const [patient, setPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPatient = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const res = await getPatientById(id)
      setPatient(res)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { fetchPatient() }, [fetchPatient])

  return { patient, loading, error, refetch: fetchPatient }
}
